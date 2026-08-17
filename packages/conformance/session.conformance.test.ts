import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { asMessageID, asSessionID, createID, type LegoMessage } from "@helix/contracts"
import {
  createAssistantMessage,
  createUserMessage,
  JsonlTreeFileStorage,
  JsonlTreeSessionService,
  ProjectionSQLiteStorage,
  ProjectionSessionService,
  type SessionService,
} from "@helix/lego-session"

function sessionFactories(): Array<[string, () => SessionService]> {
  return [
    [
      "jsonl-tree",
      () =>
        new JsonlTreeSessionService({
          storageDir: mkdtempSync(join(tmpdir(), "helix-jsonl-")),
          cwd: process.cwd(),
        }),
    ],
    ["event-projection", () => new ProjectionSessionService({ cwd: process.cwd() })],
  ]
}

function firstText(message: LegoMessage): string {
  const part = message.parts[0]
  return part?.type === "text" ? part.text : ""
}

describe.each(sessionFactories())("SessionService conformance: %s", (_name, factory) => {
  it("creates, appends, lists, resumes, and returns a transcript", async () => {
    const service = factory()
    const session = await service.create({ title: "conformance" })
    const user = createUserMessage({ sessionID: session.id, text: "hello" })
    const assistant = createAssistantMessage({ sessionID: session.id, text: "world" })

    await service.appendMessage(user)
    await service.appendMessage(assistant)

    expect(await service.list()).toHaveLength(1)
    expect((await service.resume()).id).toBe(session.id)
    expect((await service.messages({ sessionID: session.id })).map((message) => message.role)).toEqual(["user", "assistant"])
    expect((await service.transcript(session.id)).messages).toHaveLength(2)
  })

  it("updates messages and parts through the common contract", async () => {
    const service = factory()
    const session = await service.create()
    const assistant = createAssistantMessage({ sessionID: session.id, text: "first" })
    await service.appendMessage(assistant)

    const part = { id: createID("part"), type: "text" as const, text: "second" }
    await service.appendPart({ sessionID: session.id, messageID: assistant.id, part })
    const updatedPart = { ...part, text: "third" }
    await service.updatePart({ sessionID: session.id, messageID: assistant.id, partID: part.id, part: updatedPart })

    const [message] = await service.messages({ sessionID: session.id })
    expect(message?.parts.map((candidate) => (candidate.type === "text" ? candidate.text : ""))).toEqual(["first", "third"])
  })

  it("forks a session into an independent transcript", async () => {
    const service = factory()
    const session = await service.create({ title: "root" })
    await service.appendMessage(createUserMessage({ sessionID: session.id, text: "root user" }))
    await service.appendMessage(createAssistantMessage({ sessionID: session.id, text: "root assistant" }))

    const fork = await service.fork({ sessionID: session.id, title: "fork" })
    await service.appendMessage(createUserMessage({ sessionID: fork.id, text: "fork user" }))

    expect((await service.messages({ sessionID: session.id })).map((message) => message.role)).toEqual(["user", "assistant"])
    expect((await service.messages({ sessionID: fork.id })).map((message) => message.role)).toEqual([
      "user",
      "assistant",
      "user",
    ])
  })

  it("removes messages and sessions", async () => {
    const service = factory()
    const session = await service.create()
    const user = createUserMessage({ sessionID: session.id, text: "delete me" })
    await service.appendMessage(user)
    await service.removeMessage({ sessionID: session.id, messageID: user.id })
    expect(await service.messages({ sessionID: session.id })).toEqual([])
    await service.remove(session.id)
    await expect(service.get(session.id)).rejects.toThrow(/Session not found/)
  })

  it("paginates messages through a cursor", async () => {
    const service = factory()
    const session = await service.create()
    const first = createUserMessage({ sessionID: session.id, id: asMessageID("msg_001"), text: "one" })
    const second = createAssistantMessage({ sessionID: session.id, id: asMessageID("msg_002"), text: "two" })
    const third = createUserMessage({ sessionID: session.id, id: asMessageID("msg_003"), text: "three" })
    first.time.created = 1
    second.time.created = 2
    third.time.created = 3
    await service.appendMessage(first)
    await service.appendMessage(second)
    await service.appendMessage(third)

    const newest = await service.pageMessages({ sessionID: session.id, limit: 2 })
    expect(newest.messages.map(firstText)).toEqual(["two", "three"])
    expect(newest.more).toBe(true)
    expect(newest.cursor).toBeTruthy()

    const older = await service.pageMessages({ sessionID: session.id, limit: 2, before: newest.cursor! })
    expect(older.messages.map(firstText)).toEqual(["one"])
    expect(older.more).toBe(false)
    expect(older.cursor).toBeUndefined()
  })
})

describe("JsonlTreeSessionService Pi-style tree behavior", () => {
  it("exposes append-only tree storage capabilities as a replaceable lego boundary", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "helix-jsonl-storage-"))
    const storage = new JsonlTreeFileStorage(storageDir)
    const service = new JsonlTreeSessionService({ storageDir })
    const session = await service.create()

    expect(storage.kind).toBe("appendOnlyTree")
    expect(storage.capabilities).toMatchObject({ appendOnlyTree: true, migration: true, index: true })
    expect(service.storage.kind).toBe("appendOnlyTree")
    expect(service.storage.listFiles()).toEqual([session.path])
  })

  it("branches back to an earlier entry without rewriting history", async () => {
    const service = new JsonlTreeSessionService({
      storageDir: mkdtempSync(join(tmpdir(), "helix-branch-")),
    })
    const session = await service.create()
    const first = createUserMessage({ sessionID: session.id, text: "first" })
    const second = createAssistantMessage({ sessionID: session.id, text: "second" })
    await service.appendMessage(first)
    await service.appendMessage(second)
    await service.branch({ sessionID: session.id, entryID: first.id })
    await service.appendMessage(createAssistantMessage({ sessionID: session.id, text: "alternate" }))

    expect((await service.messages({ sessionID: session.id })).map((message) => message.parts[0])).toMatchObject([
      { type: "text", text: "first" },
      { type: "text", text: "alternate" },
    ])
    expect(service.getEntries(session.id)).toHaveLength(3)
  })

  it("persists the Pi leaf pointer across reopen after branching", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "helix-leaf-"))
    const service = new JsonlTreeSessionService({ storageDir })
    const session = await service.create()
    const first = createUserMessage({ sessionID: session.id, text: "first" })
    const second = createAssistantMessage({ sessionID: session.id, text: "second" })
    await service.appendMessage(first)
    await service.appendMessage(second)
    await service.branch({ sessionID: session.id, entryID: first.id })

    expect(service.getLeafID(session.id)).toBe(first.id)
    expect(service.getHeader(session.id)).toMatchObject({ type: "session", version: 3, leafID: first.id })

    const reopened = new JsonlTreeSessionService({ storageDir })
    const reopenedInfo = await reopened.open(session.path!)
    expect(reopened.getLeafID(reopenedInfo.id)).toBe(first.id)
    expect((await reopened.messages({ sessionID: reopenedInfo.id })).map((message) => message.parts[0])).toMatchObject([
      { type: "text", text: "first" },
    ])

    const alternate = createAssistantMessage({ sessionID: reopenedInfo.id, text: "alternate" })
    await reopened.appendMessage(alternate)
    expect(reopened.getHeader(reopenedInfo.id).leafID).toBe(alternate.id)

    const reopenedAgain = new JsonlTreeSessionService({ storageDir })
    const reopenedAgainInfo = await reopenedAgain.open(session.path!)
    expect((await reopenedAgain.messages({ sessionID: reopenedAgainInfo.id })).map((message) => message.parts[0])).toMatchObject([
      { type: "text", text: "first" },
      { type: "text", text: "alternate" },
    ])
  })

  it("branches with a summary entry from an earlier Pi tree point", async () => {
    const service = new JsonlTreeSessionService({
      storageDir: mkdtempSync(join(tmpdir(), "helix-branch-summary-")),
    })
    const session = await service.create()
    const first = createUserMessage({ sessionID: session.id, text: "first" })
    const second = createAssistantMessage({ sessionID: session.id, text: "second" })
    await service.appendMessage(first)
    await service.appendMessage(second)

    const summaryID = service.branchWithSummary({
      sessionID: session.id,
      entryID: first.id,
      summary: "abandoned branch summary",
      details: { reason: "test" },
      fromHook: true,
    })

    expect(service.getLeafID(session.id)).toBe(summaryID)
    expect(service.getEntries(session.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: summaryID,
          type: "branch_summary",
          parentID: first.id,
          fromID: first.id,
          summary: "abandoned branch summary",
          details: { reason: "test" },
          fromHook: true,
        }),
      ]),
    )
    expect((await service.messages({ sessionID: session.id })).map(firstText)).toEqual(["first"])
  })

  it("creates a new Pi session file from a single branch path", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "helix-create-branch-"))
    const service = new JsonlTreeSessionService({ storageDir })
    const session = await service.create({ title: "root" })
    const first = createUserMessage({ sessionID: session.id, text: "first" })
    const second = createAssistantMessage({ sessionID: session.id, text: "second" })
    const third = createUserMessage({ sessionID: session.id, text: "third" })
    await service.appendMessage(first)
    await service.appendMessage(second)
    service.appendLabel({ sessionID: session.id, targetID: first.id, label: "keep" })
    await service.appendMessage(third)

    const branched = service.createBranchedSession({ sessionID: session.id, leafID: third.id, title: "extracted branch" })
    const entries = service.getEntries(branched.id)

    expect(branched.parentID).toBe(session.id)
    expect(service.getHeader(branched.id)).toMatchObject({
      type: "session",
      version: 3,
      id: branched.id,
      parentSession: session.path,
      title: "extracted branch",
    })
    expect(entries.map((entry) => entry.type)).toEqual(["message", "message", "message", "label"])
    expect(entries.at(-1)).toMatchObject({ type: "label", targetID: first.id, label: "keep", parentID: third.id })
    expect((await service.messages({ sessionID: branched.id })).map((message) => message.sessionID)).toEqual([
      branched.id,
      branched.id,
      branched.id,
    ])

    const reopened = new JsonlTreeSessionService({ storageDir })
    const reopenedInfo = await reopened.open(branched.path!)
    expect((await reopened.messages({ sessionID: reopenedInfo.id })).map(firstText)).toEqual(["first", "second", "third"])
  })

  it("continues recent Pi sessions, forks from a session file, and lists all project dirs", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "helix-pi-listall-"))
    const nestedDir = join(storageDir, "nested-project")
    mkdirSync(nestedDir)
    const service = new JsonlTreeSessionService({ storageDir, cwd: "/tmp/root-project" })
    const root = await service.create({ title: "root session", cwd: "/tmp/root-project" })
    await service.appendMessage(createUserMessage({ sessionID: root.id, text: "root user" }))
    await service.appendMessage(createAssistantMessage({ sessionID: root.id, text: "root assistant" }))

    const nested = new JsonlTreeSessionService({ storageDir: nestedDir, cwd: "/tmp/nested-project" })
    const nestedInfo = await nested.create({ title: "nested session", cwd: "/tmp/nested-project" })
    await nested.appendMessage(createUserMessage({ sessionID: nestedInfo.id, text: "nested user" }))
    await nested.appendMessage(createAssistantMessage({ sessionID: nestedInfo.id, text: "nested assistant" }))

    expect((await service.continueRecent({ cwd: "/tmp/root-project" })).id).toBe(root.id)
    const fork = service.forkFrom({ sourcePath: nestedInfo.path!, cwd: "/tmp/fork-target", title: "forked from file" })

    expect(fork.parentID).toBe(nestedInfo.id)
    expect(service.getHeader(fork.id)).toMatchObject({ parentSession: nestedInfo.path, cwd: "/tmp/fork-target" })
    expect((await service.messages({ sessionID: fork.id })).map(firstText)).toEqual(["nested user", "nested assistant"])
    expect((await service.messages({ sessionID: fork.id })).map((message) => message.sessionID)).toEqual([fork.id, fork.id])

    expect((await service.list()).map((info) => info.title)).toEqual(expect.arrayContaining(["root session", "forked from file"]))
    expect((await service.list()).map((info) => info.title)).not.toContain("nested session")
    expect((await service.listAll()).map((info) => info.title)).toEqual(
      expect.arrayContaining(["root session", "nested session", "forked from file"]),
    )
    expect((await service.listAll({ cwd: "/tmp/nested-project" })).map((info) => info.id)).toEqual([nestedInfo.id])
  })

  it("builds Pi session context from the current tree path", async () => {
    const service = new JsonlTreeSessionService({
      storageDir: mkdtempSync(join(tmpdir(), "helix-pi-context-")),
    })
    const session = await service.create()
    const first = createUserMessage({ sessionID: session.id, text: "first" })
    const second = createAssistantMessage({
      sessionID: session.id,
      text: "second",
    })
    if (second.role === "assistant") second.model = { providerID: "anthropic", modelID: "claude-test" }
    await service.appendMessage(first)
    service.appendThinkingLevelChange({ sessionID: session.id, level: "high" })
    service.appendModelChange({ sessionID: session.id, model: { providerID: "openai", modelID: "gpt-test" } })
    await service.appendMessage(second)
    service.appendCustomEntry({ sessionID: session.id, customType: "ignored", data: { hidden: true } })
    service.appendCustomMessageEntry({
      sessionID: session.id,
      customType: "visible",
      content: [{ type: "text", text: "custom visible" }],
      display: "custom visible",
    })
    const branchSummaryID = service.appendBranchSummary({ sessionID: session.id, fromID: first.id, summary: "branch summary" })

    const context = service.buildContext({ sessionID: session.id })

    expect(context.thinkingLevel).toBe("high")
    expect(context.model).toEqual({ providerID: "anthropic", modelID: "claude-test" })
    expect(context.messages.map(firstText)).toEqual([
      "first",
      "second",
      "custom visible",
      "The following is a summary of a branch that this conversation came back from:\n\n<summary>\nbranch summary\n</summary>",
    ])
    expect(context.messages.at(-1)).toMatchObject({ metadata: { source: "branch_summary", entryID: branchSummaryID } })
    expect(JSON.stringify(context.messages)).not.toContain("hidden")
  })

  it("builds Pi compacted context with summary before the retained tail", async () => {
    const service = new JsonlTreeSessionService({
      storageDir: mkdtempSync(join(tmpdir(), "helix-pi-compacted-context-")),
    })
    const session = await service.create()
    const first = createUserMessage({ sessionID: session.id, text: "first" })
    const second = createAssistantMessage({ sessionID: session.id, text: "second" })
    const third = createUserMessage({ sessionID: session.id, text: "third" })
    await service.appendMessage(first)
    await service.appendMessage(second)
    service.appendCompaction({
      sessionID: session.id,
      summary: "old summary",
      firstKeptEntryID: second.id,
      tokensBefore: 123,
    })
    await service.appendMessage(third)

    const context = service.buildContext({ sessionID: session.id })

    expect(context.messages.map(firstText)).toEqual([
      "The conversation history before this point was compacted into the following summary:\n\n<summary>\nold summary\n</summary>",
      "second",
      "third",
    ])
    expect(context.messages[0]).toMatchObject({ metadata: { source: "compaction", tokensBefore: 123 } })
  })

  it("preserves Pi session v3 non-message entry types in the append-only tree", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "helix-pi-entries-"))
    const service = new JsonlTreeSessionService({ storageDir })
    const session = await service.create()
    const message = createUserMessage({ sessionID: session.id, text: "start" })
    await service.appendMessage(message)

    const thinkingID = service.appendThinkingLevelChange({
      sessionID: session.id,
      level: "high",
      previousLevel: "medium",
    })
    const modelID = service.appendModelChange({
      sessionID: session.id,
      model: { providerID: "anthropic", modelID: "claude-test" },
      previousModel: { providerID: "openai", modelID: "gpt-test" },
    })
    const compactionID = service.appendCompaction({ sessionID: session.id, summary: "summary" })
    const branchSummaryID = service.appendBranchSummary({ sessionID: session.id, fromID: message.id, summary: "branch summary" })
    const customID = service.appendCustomEntry({ sessionID: session.id, customType: "extension_state", data: { enabled: true } })
    const customMessageID = service.appendCustomMessageEntry({
      sessionID: session.id,
      customType: "renderable",
      content: { text: "display me" },
      display: "display me",
    })
    const labelID = service.appendLabel({ sessionID: session.id, targetID: message.id, label: "important" })

    expect(service.getEntries(session.id).map((entry) => entry.type)).toEqual([
      "message",
      "thinking_level_change",
      "model_change",
      "compaction",
      "branch_summary",
      "custom",
      "custom_message",
      "label",
    ])
    expect(service.getEntries(session.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: thinkingID, type: "thinking_level_change", level: "high", previousLevel: "medium" }),
        expect.objectContaining({ id: modelID, type: "model_change", model: { providerID: "anthropic", modelID: "claude-test" } }),
        expect.objectContaining({ id: compactionID, type: "compaction", summary: "summary" }),
        expect.objectContaining({ id: branchSummaryID, type: "branch_summary", fromID: message.id }),
        expect.objectContaining({ id: customID, type: "custom", customType: "extension_state" }),
        expect.objectContaining({ id: customMessageID, type: "custom_message", display: "display me" }),
        expect.objectContaining({ id: labelID, type: "label", label: "important" }),
      ]),
    )

    const reopened = new JsonlTreeSessionService({ storageDir })
    const reopenedInfo = await reopened.open(session.path!)
    expect(reopened.getEntries(reopenedInfo.id).map((entry) => entry.type)).toEqual(service.getEntries(session.id).map((entry) => entry.type))
  })

  it("writes Pi v3 JSONL field names while loading legacy aliases", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "helix-pi-v3-format-"))
    const service = new JsonlTreeSessionService({ storageDir })
    const session = await service.create({ title: "v3 format" })
    const message = createUserMessage({ sessionID: session.id, text: "start" })
    await service.appendMessage(message)
    service.appendThinkingLevelChange({ sessionID: session.id, level: "high" })
    service.appendModelChange({ sessionID: session.id, model: { providerID: "anthropic", modelID: "claude-test" } })
    service.appendCompaction({ sessionID: session.id, summary: "summary", firstKeptEntryID: message.id, tokensBefore: 10 })
    service.appendBranchSummary({ sessionID: session.id, fromID: message.id, summary: "branch summary" })
    service.appendLabel({ sessionID: session.id, targetID: message.id, label: "important" })

    const raw = readJsonlRecords(session.path!)
    expect(raw[0]).toMatchObject({ type: "session", version: 3, leafId: expect.any(String) })
    expect(typeof raw[0]?.timestamp).toBe("string")
    expect(raw.slice(1).every((entry) => "parentId" in entry && !("parentID" in entry))).toBe(true)
    expect(raw.find((entry) => entry.type === "thinking_level_change")).toMatchObject({ thinkingLevel: "high" })
    expect(raw.find((entry) => entry.type === "model_change")).toMatchObject({ provider: "anthropic", modelId: "claude-test" })
    expect(raw.find((entry) => entry.type === "compaction")).toMatchObject({ firstKeptEntryId: message.id })
    expect(raw.find((entry) => entry.type === "branch_summary")).toMatchObject({ fromId: message.id })
    expect(raw.find((entry) => entry.type === "label")).toMatchObject({ targetId: message.id })
    expect(JSON.stringify(raw)).not.toContain("firstKeptEntryID")
    expect(JSON.stringify(raw)).not.toContain("targetID")

    const legacyPath = join(storageDir, "legacy-aliases.jsonl")
    writeFileSync(
      legacyPath,
      [
        JSON.stringify({
          type: "session",
          version: 3,
          id: "ses_legacy",
          timestamp: 1779804000000,
          cwd: "/tmp/pi-legacy",
          leafID: "summary_legacy",
          title: "legacy aliases",
        }),
        JSON.stringify({
          type: "message",
          id: "msg_legacy",
          parentID: null,
          timestamp: 1779804001000,
          message: createUserMessage({ sessionID: asSessionID("ses_legacy"), id: asMessageID("msg_legacy"), text: "legacy" }),
        }),
        JSON.stringify({
          type: "branch_summary",
          id: "summary_legacy",
          parentID: "msg_legacy",
          timestamp: 1779804002000,
          fromID: "msg_legacy",
          summary: "legacy branch",
        }),
      ].join("\n") + "\n",
    )

    const legacyService = new JsonlTreeSessionService({ storageDir })
    const legacy = await legacyService.open(legacyPath)
    expect(legacy.title).toBe("legacy aliases")
    expect(legacyService.getEntries(legacy.id)).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "branch_summary", parentID: "msg_legacy", fromID: "msg_legacy" })]),
    )
    expect((await legacyService.messages({ sessionID: legacy.id })).map(firstText)).toEqual(["legacy"])
  })

  it("migrates Pi JSONL v1/v2 records into the v3 append-only tree", async () => {
    const storageDir = mkdtempSync(join(tmpdir(), "helix-pi-migration-"))
    const v1Path = join(storageDir, "legacy-v1.jsonl")
    writeFileSync(
      v1Path,
      [
        JSON.stringify({
          type: "session",
          id: "ses_legacy_v1",
          timestamp: "2026-05-26T14:00:00.000Z",
          cwd: "/tmp/pi-v1",
          title: "legacy v1",
        }),
        JSON.stringify({
          type: "message",
          message: createUserMessage({
            sessionID: asSessionID("ses_legacy_v1"),
            id: asMessageID("msg_legacy_first"),
            text: "legacy first",
          }),
        }),
        JSON.stringify({
          type: "message",
          message: createAssistantMessage({
            sessionID: asSessionID("ses_legacy_v1"),
            id: asMessageID("msg_legacy_second"),
            text: "legacy second",
          }),
        }),
        JSON.stringify({
          type: "compaction",
          summary: "legacy summary",
          firstKeptEntryIndex: 1,
          tokensBefore: 42,
        }),
      ].join("\n") + "\n",
    )

    const v1Service = new JsonlTreeSessionService({ storageDir })
    const legacy = await v1Service.open(v1Path)
    expect(v1Service.getHeader(legacy.id)).toMatchObject({ version: 3, cwd: "/tmp/pi-v1" })
    expect(v1Service.getEntries(legacy.id)).toMatchObject([
      { type: "message", id: "msg_legacy_first", parentID: null },
      { type: "message", id: "msg_legacy_second", parentID: "msg_legacy_first" },
      {
        type: "compaction",
        id: "mig_00000002",
        parentID: "msg_legacy_second",
        firstKeptEntryID: "msg_legacy_first",
        tokensBefore: 42,
      },
    ])
    expect((await v1Service.messages({ sessionID: legacy.id })).map(firstText)).toEqual(["legacy first", "legacy second"])

    await v1Service.appendMessage(
      createUserMessage({
        sessionID: legacy.id,
        id: asMessageID("msg_after_migration"),
        text: "after migration",
      }),
    )
    const rewritten = readJsonlRecords(v1Path)
    expect(rewritten[0]).toMatchObject({ type: "session", version: 3, leafId: "msg_after_migration" })
    expect(rewritten.slice(1).every((entry) => "parentId" in entry && !("parentID" in entry))).toBe(true)
    expect(rewritten.find((entry) => entry.type === "compaction")).toMatchObject({ firstKeptEntryId: "msg_legacy_first" })
    expect(JSON.stringify(rewritten)).not.toContain("firstKeptEntryIndex")

    const v2Path = join(storageDir, "legacy-v2.jsonl")
    writeFileSync(
      v2Path,
      [
        JSON.stringify({
          type: "session",
          version: 2,
          id: "ses_legacy_v2",
          timestamp: 1779804400000,
          cwd: "/tmp/pi-v2",
        }),
        JSON.stringify({
          type: "message",
          id: "msg_v2_first",
          parentId: null,
          timestamp: 1779804401000,
          message: createUserMessage({ sessionID: asSessionID("ses_legacy_v2"), id: asMessageID("msg_v2_first"), text: "v2 first" }),
        }),
      ].join("\n") + "\n",
    )

    const v2Service = new JsonlTreeSessionService({ storageDir })
    const v2 = await v2Service.open(v2Path)
    expect(v2.id).toBe("ses_legacy_v2")
    expect(v2Service.getHeader(v2.id)).toMatchObject({ version: 3 })
    expect(readJsonlRecords(v2Path)[0]).toMatchObject({ version: 2 })
  })
})

describe("ProjectionSessionService OpenCode-style projection behavior", () => {
  it("creates OpenCode-style descending session ids and orders sessions by update time then id", async () => {
    const service = new ProjectionSessionService({ cwd: process.cwd() })
    const first = await service.create({ title: "first" })
    const second = await service.create({ title: "second" })

    expect(first.id).toMatch(/^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/)
    expect(second.id).toMatch(/^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/)
    expect(String(second.id) < String(first.id)).toBe(true)

    await service.replay([
      {
        type: "session.created",
        sessionID: asSessionID("ses_same_time_b"),
        timestamp: 100,
        properties: { info: { id: "ses_same_time_b", title: "b", directory: process.cwd(), time: { created: 100, updated: 100 } } },
      },
      {
        type: "session.created",
        sessionID: asSessionID("ses_same_time_a"),
        timestamp: 100,
        properties: { info: { id: "ses_same_time_a", title: "a", directory: process.cwd(), time: { created: 100, updated: 100 } } },
      },
    ])

    const tied = (await service.list())
      .filter((session) => session.id === "ses_same_time_a" || session.id === "ses_same_time_b")
      .map((session) => session.id)
    expect(tied).toEqual(["ses_same_time_b", "ses_same_time_a"])
  })

  it("exposes event-sourced projection storage capabilities as a replaceable lego boundary", async () => {
    const service = new ProjectionSessionService({ cwd: process.cwd() })
    const session = await service.create({ title: "projection storage" })

    expect(service.storage.kind).toBe("eventSourcedProjection")
    expect(service.storage.capabilities).toMatchObject({ eventSourcedProjection: true, snapshot: true, index: true })
    expect(service.storage.get(session.id)?.info.title).toBe("projection storage")
  })

  it("persists OpenCode projection state through SQLite storage", async () => {
    const dbPath = join(mkdtempSync(join(tmpdir(), "helix-sqlite-projection-")), "projection.sqlite")
    const storage = new ProjectionSQLiteStorage(dbPath)
    const service = new ProjectionSessionService({ cwd: "/tmp/sqlite-projection", storage })
    const session = await service.create({ title: "sqlite projection" })
    const first = createUserMessage({ sessionID: session.id, id: asMessageID("msg_sqlite_first"), text: "sqlite first" })
    await service.appendMessage(first)
    const snapshot = await service.snapshot(session.id)
    await service.appendMessage(
      createAssistantMessage({ sessionID: session.id, id: asMessageID("msg_sqlite_second"), text: "sqlite second" }),
    )
    storage.close()

    const reopenedStorage = new ProjectionSQLiteStorage(dbPath)
    const reopened = new ProjectionSessionService({ cwd: "/tmp/sqlite-projection", storage: reopenedStorage })
    expect(await reopened.get(session.id)).toMatchObject({ id: session.id, title: "sqlite projection" })
    expect((await reopened.messages({ sessionID: session.id })).map(firstText)).toEqual(["sqlite first", "sqlite second"])
    expect((await reopened.diff(session.id)).map((event) => (event as { type: string }).type)).toEqual(
      expect.arrayContaining(["session.created", "message.updated", "session.snapshot"]),
    )

    await reopened.revert({ sessionID: session.id, snapshotID: snapshot.id })
    expect((await reopened.messages({ sessionID: session.id })).map(firstText)).toEqual(["sqlite first"])
    reopenedStorage.close()
  })

  it("tracks sync-event diffs, snapshots, and reverts projected messages", async () => {
    const service = new ProjectionSessionService({ cwd: process.cwd() })
    const session = await service.create({ title: "projection" })
    const first = createUserMessage({ sessionID: session.id, text: "first" })
    await service.appendMessage(first)
    const snapshot = await service.snapshot(session.id)
    const second = createAssistantMessage({ sessionID: session.id, text: "second" })
    await service.appendMessage(second)

    expect((await service.messages({ sessionID: session.id })).map((message) => message.role)).toEqual(["user", "assistant"])
    expect((await service.diff(session.id)).map((event) => (event as { type: string }).type)).toEqual(
      expect.arrayContaining(["session.created", "message.updated", "session.snapshot"]),
    )

    await service.revert({ sessionID: session.id, snapshotID: snapshot.id })
    expect((await service.messages({ sessionID: session.id })).map((message) => message.parts[0])).toMatchObject([
      { type: "text", text: "first" },
    ])
    expect((await service.diff(session.id)).map((event) => (event as { type: string }).type)).toContain("session.reverted")
  })

  it("forks before a requested message and indexes child sessions", async () => {
    const service = new ProjectionSessionService({ cwd: process.cwd() })
    const session = await service.create({ title: "root" })
    const first = createUserMessage({ sessionID: session.id, text: "first" })
    const second = createAssistantMessage({ sessionID: session.id, text: "second" })
    const third = createUserMessage({ sessionID: session.id, text: "third" })
    await service.appendMessage(first)
    await service.appendMessage(second)
    await service.appendMessage(third)

    const fork = await service.fork({ sessionID: session.id, messageID: third.id, title: "before third" })

    expect((await service.messages({ sessionID: fork.id })).map((message) => message.parts[0])).toMatchObject([
      { type: "text", text: "first" },
      { type: "text", text: "second" },
    ])
    expect(await service.children(session.id)).toEqual([expect.objectContaining({ id: fork.id, parentID: session.id })])
  })

  it("projects OpenCode SyncEvent session info and MessageV2 parts", async () => {
    const service = new ProjectionSessionService({ cwd: process.cwd() })
    const sessionID = asSessionID("ses_opencode_sync")

    await service.replay([
      {
        type: "session.created",
        sessionID,
        timestamp: 1779804200000,
        properties: {
          info: {
            id: sessionID,
            version: "1.0",
            projectID: "proj_1",
            directory: "/tmp/opencode-sync",
            workspaceID: "ws_1",
            parentID: "ses_parent",
            title: "OpenCode Sync",
            agent: "build",
            providerID: "anthropic",
            modelID: "claude-sonnet",
            mode: "build",
            permission: { edit: "ask" },
            cost: 1.5,
            tokens: { input: 10, output: 2, reasoning: 1, cache: { read: 5, write: 1 } },
            time: { created: 1779804200000, updated: 1779804200000 },
            summary: { title: "summary" },
            revert: { messageID: "msg_before" },
          },
        },
      },
      {
        type: "message.updated",
        sessionID,
        timestamp: 1779804201000,
        properties: {
          sessionID,
          info: {
            id: "msg_assistant",
            sessionID,
            role: "assistant",
            time: { created: 1779804201000 },
            parentID: "msg_user",
            agent: "build",
            providerID: "anthropic",
            modelID: "claude-sonnet",
            cost: 0.2,
            tokens: { input: 3, output: 4, reasoning: 1, cache: { read: 2, write: 0 } },
            finish: "tool_calls",
          },
        },
      },
      {
        type: "message.part.updated",
        sessionID,
        timestamp: 1779804202000,
        properties: {
          sessionID,
          part: {
            id: "prt_text",
            sessionID,
            messageID: "msg_assistant",
            type: "text",
            text: "temporary text",
          },
        },
      },
      {
        type: "message.part.updated",
        sessionID,
        timestamp: 1779804203000,
        properties: {
          sessionID,
          part: {
            id: "prt_tool",
            sessionID,
            messageID: "msg_assistant",
            type: "tool",
            callID: "call_1",
            tool: "bash",
            state: {
              status: "completed",
              input: { command: "pwd" },
              output: "/tmp/opencode-sync",
              title: "bash",
              metadata: { exitCode: 0 },
              time: { start: 1779804202500, end: 1779804203000 },
            },
          },
        },
      },
      {
        type: "message.part.removed",
        sessionID,
        timestamp: 1779804204000,
        properties: {
          sessionID,
          messageID: "msg_assistant",
          partID: "prt_text",
        },
      },
    ])

    expect(await service.get(sessionID)).toMatchObject({
      id: sessionID,
      title: "OpenCode Sync",
      cwd: "/tmp/opencode-sync",
      version: "1.0",
      projectID: "proj_1",
      directory: "/tmp/opencode-sync",
      workspaceID: "ws_1",
      parentID: "ses_parent",
      agent: "build",
      providerID: "anthropic",
      modelID: "claude-sonnet",
      model: { providerID: "anthropic", modelID: "claude-sonnet" },
      mode: "build",
      cost: 1.5,
      tokens: { input: 10, output: 2, reasoning: 1, cacheRead: 5, cacheWrite: 1 },
      time: { created: 1779804200000, updated: 1779804200000 },
      summary: { title: "summary" },
      revert: { messageID: "msg_before" },
    })

    const [message] = await service.messages({ sessionID })
    expect(message).toMatchObject({
      id: "msg_assistant",
      role: "assistant",
      parentID: "msg_user",
      agent: "build",
      model: { providerID: "anthropic", modelID: "claude-sonnet" },
      finish: "tool_calls",
      usage: { input: 3, output: 4, reasoning: 1, cacheRead: 2, cacheWrite: 0 },
      cost: 0.2,
    })
    expect(message?.parts).toMatchObject([
      { id: "prt_tool", type: "tool_call", toolCallID: "call_1", toolName: "bash", input: { command: "pwd" }, status: "completed" },
      { id: "prt_tool:result", type: "tool_result", toolCallID: "call_1", toolName: "bash", content: [{ type: "text", text: "/tmp/opencode-sync" }] },
    ])
    expect(JSON.stringify(message?.parts)).not.toContain("temporary text")
    expect((await service.diff(sessionID)).map((event) => (event as { type: string }).type)).toEqual(
      expect.arrayContaining(["session.created", "message.updated", "message.part.updated", "message.part.removed"]),
    )
  })

  it("replays OpenCode session deletion events", async () => {
    const service = new ProjectionSessionService({ cwd: process.cwd() })
    const sessionID = asSessionID("ses_opencode_deleted")

    await service.applyEvent({
      type: "session.created",
      sessionID,
      timestamp: 1779804300000,
      properties: { info: { id: sessionID, title: "deleted", directory: "/tmp/deleted" } },
    })
    await service.applyEvent({ type: "session.deleted", sessionID, timestamp: 1779804301000, properties: { sessionID } })

    expect(await service.list()).toEqual([])
    await expect(service.get(sessionID)).rejects.toThrow(/Session not found/)
  })
})

function readJsonlRecords(path: string): Array<Record<string, unknown>> {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>)
}
