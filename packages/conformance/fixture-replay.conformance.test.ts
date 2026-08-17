import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { asMessageID, sessionTranscriptSchema } from "@helix/contracts"
import { JsonlTreeSessionService, ProjectionSessionService, type ProjectionReplayEvent } from "@helix/lego-session"

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures")
const upstreamFixturesDir = join(fixturesDir, "upstream")

describe("upstream-shaped fixture replay", () => {
  it("loads a Pi v3 JSONL session fixture into the common transcript contract", async () => {
    const service = new JsonlTreeSessionService({ storageDir: fixturesDir })
    const info = await service.open(join(fixturesDir, "pi-session-v3.jsonl"))
    const transcript = await service.transcript(info.id)

    expect(info.title).toBe("Pi fixture")
    expect(sessionTranscriptSchema.validate(transcript)).toEqual({ ok: true, issues: [] })
    expect(transcript.messages.map((message) => message.role)).toEqual(["user", "assistant"])
    expect(JSON.stringify(transcript)).toContain("hello from pi jsonl")
  })

  it("branches, compacts, and resumes the Pi v3 JSONL fixture", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "helix-pi-fixture-"))
    const fixturePath = join(storageDir, "pi-session-v3.jsonl")
    copyFileSync(join(fixturesDir, "pi-session-v3.jsonl"), fixturePath)

    const service = new JsonlTreeSessionService({ storageDir })
    const info = await service.open(fixturePath)
    await service.branch({ sessionID: info.id, entryID: "msg_pi_user" })
    const compactionID = service.appendCompaction({
      sessionID: info.id,
      summary: "fixture compaction",
      firstKeptEntryID: "msg_pi_user",
    })

    expect((await service.messages({ sessionID: info.id })).map((message) => message.role)).toEqual(["user"])
    expect(service.getEntries(info.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: compactionID, type: "compaction", summary: "fixture compaction" }),
      ]),
    )
    expect((await service.resume({ cwd: "/tmp/pi-fixture" })).id).toBe(info.id)

    const reopened = new JsonlTreeSessionService({ storageDir })
    const resumed = await reopened.resume({ cwd: "/tmp/pi-fixture" })
    expect(resumed.id).toBe(info.id)
    expect((await reopened.messages({ sessionID: resumed.id })).map((message) => message.role)).toEqual(["user"])
    expect(reopened.getEntries(resumed.id).map((entry) => entry.type)).toContain("compaction")
  })

  it("replays OpenCode-style projection events into the common transcript contract", async () => {
    const service = new ProjectionSessionService()
    const events = readJsonl<ProjectionReplayEvent>(join(fixturesDir, "opencode-projection-events.jsonl"))
    const [info] = await service.replay(events)
    expect(info?.title).toBe("OpenCode fixture")

    const transcript = await service.transcript(info!.id)
    expect(sessionTranscriptSchema.validate(transcript)).toEqual({ ok: true, issues: [] })
    expect(transcript.messages.map((message) => message.role)).toEqual(["user", "assistant"])
    expect(JSON.stringify(transcript)).toContain("hello from opencode projection")
  })

  it("forks, paginates, and diffs the OpenCode MessageV2 fixture", async () => {
    const service = new ProjectionSessionService()
    const [info] = await service.replay(readJsonl<ProjectionReplayEvent>(join(fixturesDir, "opencode-projection-events.jsonl")))
    expect(info).toBeTruthy()

    const newest = await service.pageMessages({ sessionID: info!.id, limit: 1 })
    expect(newest.messages.map((message) => message.role)).toEqual(["assistant"])
    expect(newest.more).toBe(true)

    const older = await service.pageMessages({ sessionID: info!.id, limit: 1, before: newest.cursor! })
    expect(older.messages.map((message) => message.role)).toEqual(["user"])
    expect(older.more).toBe(false)

    const fork = await service.fork({
      sessionID: info!.id,
      messageID: asMessageID("msg_opencode_assistant"),
      title: "before assistant",
    })
    expect((await service.messages({ sessionID: fork.id })).map((message) => message.role)).toEqual(["user"])
    expect((await service.diff(info!.id)).map((event) => (event as { type: string }).type)).toEqual(
      expect.arrayContaining(["session.created", "message.updated", "message.part.updated"]),
    )
  })

  it("converts Pi and OpenCode sample fixtures into schema-valid common transcripts", async () => {
    const pi = new JsonlTreeSessionService({ storageDir: fixturesDir })
    const piInfo = await pi.open(join(fixturesDir, "pi-session-v3.jsonl"))
    const opencode = new ProjectionSessionService()
    const [openCodeInfo] = await opencode.replay(readJsonl<ProjectionReplayEvent>(join(fixturesDir, "opencode-projection-events.jsonl")))

    const transcripts = [await pi.transcript(piInfo.id), await opencode.transcript(openCodeInfo!.id)]

    expect(transcripts.map((transcript) => sessionTranscriptSchema.is(transcript))).toEqual([true, true])
    expect(transcripts.map((transcript) => transcript.messages.map((message) => message.role))).toEqual([
      ["user", "assistant"],
      ["user", "assistant"],
    ])
  })

  it("replays large upstream-shaped Pi and OpenCode traces without losing ordering or schema shape", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "helix-large-fixtures-"))
    const piPath = writeLargePiFixture(storageDir, 64)
    const openCodeEvents = largeOpenCodeProjectionEvents(64)

    const pi = new JsonlTreeSessionService({ storageDir })
    const piInfo = await pi.open(piPath)
    const opencode = new ProjectionSessionService()
    const [openCodeInfo] = await opencode.replay(openCodeEvents)

    const piTranscript = await pi.transcript(piInfo.id)
    const openCodeTranscript = await opencode.transcript(openCodeInfo!.id)

    expect(sessionTranscriptSchema.validate(piTranscript)).toEqual({ ok: true, issues: [] })
    expect(sessionTranscriptSchema.validate(openCodeTranscript)).toEqual({ ok: true, issues: [] })
    expect(piTranscript.messages).toHaveLength(128)
    expect(openCodeTranscript.messages).toHaveLength(128)
    expect(piTranscript.messages.at(0)?.parts[0]).toMatchObject({ type: "text", text: "pi large user 0" })
    expect(piTranscript.messages.at(-1)?.parts[0]).toMatchObject({ type: "text", text: "pi large assistant 63" })
    expect(openCodeTranscript.messages.at(0)?.parts[0]).toMatchObject({ type: "text", text: "opencode large user 0" })
    expect(openCodeTranscript.messages.at(-1)?.parts[0]).toMatchObject({ type: "text", text: "opencode large assistant 63" })

    await pi.branch({ sessionID: piInfo.id, entryID: "msg_pi_large_assistant_031" })
    expect(await pi.messages({ sessionID: piInfo.id })).toHaveLength(64)

    let cursor: string | undefined
    let paged = 0
    do {
      const page = await opencode.pageMessages({ sessionID: openCodeInfo!.id, limit: 9, ...(cursor ? { before: cursor } : {}) })
      paged += page.messages.length
      cursor = page.cursor
      if (!page.more) break
    } while (cursor)
    expect(paged).toBe(128)
  })

  it("replays a real upstream Pi large session export into the common transcript contract", async () => {
    const manifest = readUpstreamManifest()
    expect(manifest.fixtures.find((fixture) => fixture.product === "pi-mono")).toMatchObject({
      sourceCommit: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      sourcePath: "packages/coding-agent/test/fixtures/large-session.jsonl",
      expectedTranscriptMessages: 914,
    })

    const storageDir = mkdtempSync(join(tmpdir(), "helix-real-pi-fixture-"))
    const fixturePath = join(storageDir, "pi-large-session.upstream.jsonl")
    copyFileSync(join(upstreamFixturesDir, "pi-large-session.upstream.jsonl"), fixturePath)
    const service = new JsonlTreeSessionService({ storageDir })
    const info = await service.open(fixturePath)
    const transcript = await service.transcript(info.id)
    const entries = service.getEntries(info.id)

    expect(sessionTranscriptSchema.validate(transcript)).toEqual({ ok: true, issues: [] })
    expect(transcript.messages).toHaveLength(914)
    expect(transcript.messages.map((message) => message.role)).toEqual(expect.arrayContaining(["user", "assistant", "tool"]))
    expect(JSON.stringify(transcript)).toContain("read packages/coding-agent/docs/theme.md in full")
    expect(JSON.stringify(transcript)).toContain("Request was aborted")
    expect(JSON.stringify(transcript)).toContain("toolu_017qEkVzzPb7b7o4FkgJLF23")

    const context = service.buildContext({ sessionID: info.id })
    expect(context.thinkingLevel).toBe("off")
    expect(context.model?.modelID).toBe("claude-sonnet-4-5")

    const middleMessage = entries.find(
      (entry) => entry.type === "message" && entry.message.role === "tool" && JSON.stringify(entry.message.parts).includes("tool_result"),
    )
    expect(middleMessage).toBeTruthy()
    await service.branch({ sessionID: info.id, entryID: middleMessage!.id })
    expect((await service.messages({ sessionID: info.id })).length).toBeLessThan(transcript.messages.length)
  })

  it("replays a real upstream OpenCode session timeline export into projection storage", async () => {
    const manifest = readUpstreamManifest()
    expect(manifest.fixtures.find((fixture) => fixture.product === "opencode")).toMatchObject({
      sourceCommit: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      sourcePath: "packages/app/e2e/smoke/session-timeline.fixture.ts",
      expectedTranscriptMessages: 168,
    })

    const service = new ProjectionSessionService()
    const events = readJsonl<ProjectionReplayEvent>(join(upstreamFixturesDir, "opencode-session-timeline.upstream.projection.jsonl"))
    const infos = await service.replay(events)
    const source = infos.find((info) => info.id === "ses_smoke_source")
    const target = infos.find((info) => info.id === "ses_smoke_target")
    expect(source?.title).toBe("Uncommitted changes inquiry")
    expect(target?.title).toBe("Example Game: sample jump movement & sample physics analysis")

    const sourceTranscript = await service.transcript(source!.id)
    const targetTranscript = await service.transcript(target!.id)
    expect(sessionTranscriptSchema.validate(sourceTranscript)).toEqual({ ok: true, issues: [] })
    expect(sessionTranscriptSchema.validate(targetTranscript)).toEqual({ ok: true, issues: [] })
    expect(sourceTranscript.messages).toHaveLength(24)
    expect(targetTranscript.messages).toHaveLength(144)
    expect(JSON.stringify(targetTranscript)).toContain("claude-opus-4-6")
    expect(JSON.stringify(targetTranscript)).toContain("apply_patch")
    expect(JSON.stringify(targetTranscript)).toContain("websearch")

    let cursor: string | undefined
    let paged = 0
    do {
      const page = await service.pageMessages({ sessionID: target!.id, limit: 17, ...(cursor ? { before: cursor } : {}) })
      paged += page.messages.length
      cursor = page.cursor
      if (!page.more) break
    } while (cursor)
    expect(paged).toBe(144)

    const fork = await service.fork({
      sessionID: target!.id,
      messageID: asMessageID("msg_user_smoke_0036"),
      title: "real upstream fork",
    })
    expect((await service.messages({ sessionID: fork.id })).length).toBeLessThan(targetTranscript.messages.length)
    expect((await service.diff(target!.id))).toHaveLength(events.filter((event) => event.sessionID === target!.id).length)
  })
})

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T)
}

function readUpstreamManifest(): {
  fixtures: Array<{
    product: string
    sourceCommit: string
    sourcePath: string
    expectedTranscriptMessages: number
  }>
} {
  return JSON.parse(readFileSync(join(upstreamFixturesDir, "manifest.json"), "utf8")) as {
    fixtures: Array<{
      product: string
      sourceCommit: string
      sourcePath: string
      expectedTranscriptMessages: number
    }>
  }
}

function writeLargePiFixture(storageDir: string, pairs: number): string {
  const sessionID = "ses_pi_large_fixture"
  const path = join(storageDir, "pi-large-session-v3.jsonl")
  const lines: unknown[] = [
    {
      type: "session",
      version: 3,
      id: sessionID,
      timestamp: "2026-05-26T15:00:00.000Z",
      cwd: "/tmp/pi-large-fixture",
      title: "Pi large fixture",
    },
  ]
  let parentId: string | null = null
  for (let index = 0; index < pairs; index++) {
    const userID = `msg_pi_large_user_${index.toString().padStart(3, "0")}`
    const assistantID = `msg_pi_large_assistant_${index.toString().padStart(3, "0")}`
    lines.push({
      type: "message",
      id: userID,
      parentId,
      timestamp: new Date(1779807600000 + index * 2000).toISOString(),
      message: {
        id: userID,
        sessionID,
        role: "user",
        time: { created: 1779807600000 + index * 2000 },
        parts: [{ id: `prt_pi_large_user_${index}`, type: "text", text: `pi large user ${index}` }],
      },
    })
    lines.push({
      type: "message",
      id: assistantID,
      parentId: userID,
      timestamp: new Date(1779807601000 + index * 2000).toISOString(),
      message: {
        id: assistantID,
        sessionID,
        role: "assistant",
        time: { created: 1779807601000 + index * 2000, completed: 1779807601000 + index * 2000 },
        parts: [{ id: `prt_pi_large_assistant_${index}`, type: "text", text: `pi large assistant ${index}` }],
      },
    })
    parentId = assistantID
  }
  writeFileSync(path, `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`, "utf8")
  return path
}

function largeOpenCodeProjectionEvents(pairs: number): ProjectionReplayEvent[] {
  const sessionID = "ses_opencode_large_fixture"
  const events: ProjectionReplayEvent[] = [
    {
      type: "session.created",
      sessionID,
      timestamp: 1779808600000,
      properties: {
        info: {
          id: sessionID,
          version: "1.0",
          projectID: "proj_large_fixture",
          directory: "/tmp/opencode-large-fixture",
          workspaceID: "ws_large_fixture",
          title: "OpenCode large fixture",
          agent: "build",
          providerID: "anthropic",
          modelID: "claude-sonnet",
          mode: "build",
          time: { created: 1779808600000, updated: 1779808600000 },
        },
      },
    },
  ]
  for (let index = 0; index < pairs; index++) {
    const userID = `msg_opencode_large_user_${index.toString().padStart(3, "0")}`
    const assistantID = `msg_opencode_large_assistant_${index.toString().padStart(3, "0")}`
    const base = 1779808601000 + index * 2000
    events.push(
      {
        type: "message.updated",
        sessionID,
        timestamp: base,
        properties: {
          sessionID,
          info: {
            id: userID,
            sessionID,
            role: "user",
            time: { created: base },
            agent: "build",
            model: { providerID: "anthropic", modelID: "claude-sonnet" },
          },
        },
      },
      {
        type: "message.part.updated",
        sessionID,
        timestamp: base + 1,
        properties: {
          sessionID,
          part: {
            id: `prt_opencode_large_user_${index}`,
            sessionID,
            messageID: userID,
            type: "text",
            text: `opencode large user ${index}`,
          },
        },
      },
      {
        type: "message.updated",
        sessionID,
        timestamp: base + 1000,
        properties: {
          sessionID,
          info: {
            id: assistantID,
            sessionID,
            role: "assistant",
            parentID: userID,
            time: { created: base + 1000, completed: base + 1000 },
            agent: "build",
            providerID: "anthropic",
            modelID: "claude-sonnet",
            finish: "stop",
          },
        },
      },
      {
        type: "message.part.updated",
        sessionID,
        timestamp: base + 1001,
        properties: {
          sessionID,
          part: {
            id: `prt_opencode_large_assistant_${index}`,
            sessionID,
            messageID: assistantID,
            type: "text",
            text: `opencode large assistant ${index}`,
          },
        },
      },
    )
  }
  return events
}
