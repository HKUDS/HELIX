import { mkdtempSync, rmSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { asMessageID, asPartID, asSessionID, type LegoMessage } from "@helix/contracts"
import { createOpenCodeSessionContextSelectorAtom, createOpenCodeSessionEventLogAtom, createOpenCodeSessionPersonality } from "@helix/adapters-opencode/session-personality"
import { createAssistantMessage, createUserMessage } from "@helix/lego-session/utils"
import {
  buildOpenCodeSessionNativeExactFixture,
  decodeOpenCodeMessageV2CursorProjection,
  filterOpenCodeCompactedMessagesProjection,
  forkOpenCodeSessionBeforeMessageProjection,
  hydrateOpenCodeMessageV2RowsProjection,
  openCodeSessionBranchingSQLiteServiceNativeExactAtomID,
  openCodeSessionContextSelectorMessageV2NativeExactAtomID,
  openCodeSessionDiffSQLiteServiceNativeExactAtomID,
  openCodeSessionEventLogSyncEventNativeExactAtomID,
  openCodeCreateSessionInfoProjection,
  openCodeMessageInfoFromRowProjection,
  openCodeMessagePartFromRowProjection,
  openCodeSessionMessageStoreSQLiteServiceNativeExactAtomID,
  openCodeSessionFromSQLiteRowProjection,
  openCodeSessionMessagePartProjectorNativeExactAtomID,
  openCodeSessionNativeDescriptors,
  openCodeSessionNativeExactAtomIDs,
  openCodeSessionNativeExactEvidenceRef,
  openCodeSessionNativeExactFixtureID,
  openCodeSessionNativeExactReplayRef,
  openCodeSessionReaderSQLiteServiceNativeExactAtomID,
  openCodeSessionSyncEventDefinitionsProjection,
  openCodeSessionToSQLiteRowProjection,
  openCodeSessionWriterSQLiteServiceNativeExactAtomID,
  pageOpenCodeMessageV2Projection,
  projectOpenCodeSessionMessageRowProjection,
  selectOpenCodePromptContextProjection,
  verifyOpenCodeSessionNativeExactFixture,
  type OpenCodeMessageV2WithPartsProjection,
  type OpenCodeMessageV2RowProjection,
  type OpenCodePartRowProjection,
} from "@helix/adapters-opencode/product-schema/session"

const require = createRequire(import.meta.url)

describe("OpenCode session native exact schema", () => {
  it("round-trips SessionTable rows with default title, path, tokens, and summary fields", () => {
    const session = openCodeCreateSessionInfoProjection({
      id: "ses_native_01",
      slug: "native",
      projectID: "project_1",
      workspaceID: "wrk_1",
      worktree: "/repo",
      directory: "/repo/app",
      parentID: "ses_parent",
      agent: "build",
      model: { providerID: "anthropic", id: "claude" },
      permission: [{ type: "ask" }],
      version: "0.5.0",
      now: 1_780_000_000_000,
    })
    const row = openCodeSessionToSQLiteRowProjection({
      ...session,
      summary: { additions: 2, deletions: 1, files: 1, diffs: [{ path: "src/a.ts" }] },
      share: { url: "https://share.example/ses_native_01" },
    })
    const restored = openCodeSessionFromSQLiteRowProjection(row)

    expect(session.title).toBe("Child session - 2026-05-28T20:26:40.000Z")
    expect(session.path).toBe("app")
    expect(row).toMatchObject({
      id: "ses_native_01",
      project_id: "project_1",
      workspace_id: "wrk_1",
      parent_id: "ses_parent",
      directory: "/repo/app",
      path: "app",
      title: session.title,
      tokens_input: 0,
      tokens_output: 0,
      tokens_reasoning: 0,
      tokens_cache_read: 0,
      tokens_cache_write: 0,
      time_created: 1_780_000_000_000,
      time_updated: 1_780_000_000_000,
    })
    expect(restored).toMatchObject({
      id: "ses_native_01",
      workspaceID: "wrk_1",
      parentID: "ses_parent",
      path: "app",
      summary: { additions: 2, deletions: 1, files: 1, diffs: [{ path: "src/a.ts" }] },
      share: { url: "https://share.example/ses_native_01" },
      tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    })
  })

  it("hydrates MessageV2 rows, pages by time/id cursor, and reports missing sessions", () => {
    const messages: OpenCodeMessageV2RowProjection[] = [
      { id: "msg_001", session_id: "ses_1", time_created: 1000, data: { role: "user", time: { created: 1000 } } },
      { id: "msg_002", session_id: "ses_1", time_created: 2000, data: { role: "assistant", parentID: "msg_001", time: { created: 2000 } } },
      { id: "msg_003", session_id: "ses_1", time_created: 2000, data: { role: "user", time: { created: 2000 } } },
    ]
    const parts: OpenCodePartRowProjection[] = [
      { id: "prt_b", session_id: "ses_1", message_id: "msg_002", time_created: 2002, data: { type: "tool", tool: "read" } },
      { id: "prt_a", session_id: "ses_1", message_id: "msg_002", time_created: 2001, data: { type: "text", text: "answer" } },
      { id: "prt_user", session_id: "ses_1", message_id: "msg_001", time_created: 1001, data: { type: "text", text: "hello" } },
    ]
    const page = pageOpenCodeMessageV2Projection({
      sessionID: "ses_1",
      messages,
      parts,
      sessionRows: [{ id: "ses_1" } as never],
      limit: 2,
    })
    const next = pageOpenCodeMessageV2Projection({
      sessionID: "ses_1",
      messages,
      parts,
      sessionRows: [{ id: "ses_1" } as never],
      limit: 2,
      ...(page.cursor ? { before: page.cursor } : {}),
    })
    const missing = pageOpenCodeMessageV2Projection({
      sessionID: "missing",
      messages,
      parts,
      sessionRows: [{ id: "ses_1" } as never],
      limit: 2,
    })

    expect(openCodeMessageInfoFromRowProjection(messages[0]!)).toMatchObject({ id: "msg_001", sessionID: "ses_1", role: "user" })
    expect(openCodeMessagePartFromRowProjection(parts[0]!)).toMatchObject({ id: "prt_b", sessionID: "ses_1", messageID: "msg_002", type: "tool" })
    expect(hydrateOpenCodeMessageV2RowsProjection([messages[1]!], parts)[0]?.parts.map((part) => part.id)).toEqual(["prt_a", "prt_b"])
    expect(page).toMatchObject({ status: "ok", more: true })
    expect(page.items.map((item) => item.info.id)).toEqual(["msg_002", "msg_003"])
    expect(decodeOpenCodeMessageV2CursorProjection(page.cursor!)).toEqual({ id: "msg_002", time: 2000 })
    expect(next.items.map((item) => item.info.id)).toEqual(["msg_001"])
    expect(missing).toMatchObject({ status: "not-found", error: "Session not found: missing" })
  })

  it("forks before a boundary message and preserves OpenCode compaction filter ordering", () => {
    const baseMessages = [
      {
        info: { id: "msg_001", sessionID: "ses_root", role: "user" as const },
        parts: [{ id: "prt_001", sessionID: "ses_root", messageID: "msg_001", type: "text", text: "hello" }],
      },
      {
        info: { id: "msg_002", sessionID: "ses_root", role: "assistant" as const, parentID: "msg_001" },
        parts: [{ id: "prt_002", sessionID: "ses_root", messageID: "msg_002", type: "text", text: "answer" }],
      },
      {
        info: { id: "msg_003", sessionID: "ses_root", role: "user" as const },
        parts: [{ id: "prt_003", sessionID: "ses_root", messageID: "msg_003", type: "compaction", auto: true, tail_start_id: "msg_001" }],
      },
    ]
    const fork = forkOpenCodeSessionBeforeMessageProjection({
      original: {
        id: "ses_root",
        slug: "root",
        projectID: "project_1",
        workspaceID: "wrk_1",
        directory: "/repo/app",
        path: "app",
        title: "Root session",
        version: "0.5.0",
        time: { created: 1000, updated: 1000 },
      },
      messages: baseMessages,
      worktree: "/repo",
      directory: "/repo/app",
      newSessionID: "ses_fork",
      now: 2000,
      beforeMessageID: "msg_003",
      nextMessageIDs: ["msg_101", "msg_102"],
      nextPartIDs: ["prt_101", "prt_102"],
    })
    const compactionStream: OpenCodeMessageV2WithPartsProjection[] = [
      { info: { id: "msg_006", sessionID: "ses_root", role: "user" as const, model: { providerID: "anthropic", modelID: "claude-opus" } }, parts: [{ id: "prt_006", sessionID: "ses_root", messageID: "msg_006", type: "text" }] },
      { info: { id: "msg_005", sessionID: "ses_root", role: "assistant", parentID: "msg_004", summary: true, finish: true }, parts: [{ id: "prt_005", sessionID: "ses_root", messageID: "msg_005", type: "text" }] },
      { info: { id: "msg_004", sessionID: "ses_root", role: "user" }, parts: [{ id: "prt_004", sessionID: "ses_root", messageID: "msg_004", type: "compaction", tail_start_id: "msg_002" }] },
      { info: { id: "msg_003", sessionID: "ses_root", role: "assistant", parentID: "msg_002", finish: true }, parts: [{ id: "prt_003", sessionID: "ses_root", messageID: "msg_003", type: "text" }] },
      { info: { id: "msg_002", sessionID: "ses_root", role: "user" }, parts: [{ id: "prt_002", sessionID: "ses_root", messageID: "msg_002", type: "text" }] },
    ]
    const compacted = filterOpenCodeCompactedMessagesProjection(compactionStream)
    const promptContext = selectOpenCodePromptContextProjection(compactionStream)

    expect(fork.session.title).toBe("Root session (fork #1)")
    expect(fork.messages.map((message) => message.info.id)).toEqual(["msg_101", "msg_102"])
    expect(fork.messages[1]?.info.parentID).toBe("msg_101")
    expect(fork.idMap).toEqual({ msg_001: "msg_101", msg_002: "msg_102" })
    expect(compacted.map((message) => message.info.id)).toEqual(["msg_004", "msg_005", "msg_002", "msg_003", "msg_006"])
    expect(promptContext.messages.map((message) => message.info.id)).toEqual(["msg_004", "msg_005", "msg_002", "msg_003", "msg_006"])
    expect(promptContext.latest.user?.id).toBe("msg_006")
    expect(promptContext.model).toEqual({ providerID: "anthropic", modelID: "claude-opus" })
  })

  it("publishes native descriptors and verifies the exact fixture with SyncEvent projection coverage", () => {
    const fixture = buildOpenCodeSessionNativeExactFixture()
    const sessionNextRow = projectOpenCodeSessionMessageRowProjection({
      eventID: "evt_1",
      sessionID: "ses_1",
      type: "session.next.text.ended",
      timeCreated: 1000,
      data: { id: "drop", type: "drop", text: "done", time: { _tag: "DateTime", epochMillis: 1000 } },
    })

    expect(verifyOpenCodeSessionNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      product: "opencode",
      atomIDs: openCodeSessionNativeExactAtomIDs,
      portIDs: expect.arrayContaining([
        "session.branching",
        "session.context-selector",
        "session.diff",
        "session.event-log",
        "session.message-part-projector",
        "session.message-store",
        "session.reader",
        "session.writer",
      ]),
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      policy: expect.objectContaining({
        contextSelectorUsesMessageV2FilterCompactedForPromptContext: true,
        messagePartProjectorSpreadsPartRowsAndPreservesMessageLinkage: true,
      }),
      nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
      fixtureIDs: [openCodeSessionNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(openCodeSessionNativeExactAtomIDs).toContain(openCodeSessionMessagePartProjectorNativeExactAtomID)
    expect(openCodeSessionNativeExactAtomIDs).toContain(openCodeSessionContextSelectorMessageV2NativeExactAtomID)
    expect(openCodeSessionNativeExactAtomIDs).toEqual(expect.arrayContaining([
      openCodeSessionBranchingSQLiteServiceNativeExactAtomID,
      openCodeSessionContextSelectorMessageV2NativeExactAtomID,
      openCodeSessionDiffSQLiteServiceNativeExactAtomID,
      openCodeSessionEventLogSyncEventNativeExactAtomID,
      openCodeSessionMessageStoreSQLiteServiceNativeExactAtomID,
      openCodeSessionReaderSQLiteServiceNativeExactAtomID,
      openCodeSessionWriterSQLiteServiceNativeExactAtomID,
    ]))
    expect(openCodeSessionNativeDescriptors).toHaveLength(openCodeSessionNativeExactAtomIDs.length)
    expect(openCodeSessionNativeDescriptors.find((descriptor) => descriptor.id === openCodeSessionMessagePartProjectorNativeExactAtomID)).toMatchObject({
      port: "session.message-part-projector",
      parityCoverage: "native",
      nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
      fixtureIDs: [openCodeSessionNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(openCodeSessionNativeDescriptors.find((descriptor) => descriptor.id === openCodeSessionContextSelectorMessageV2NativeExactAtomID)).toMatchObject({
      port: "session.context-selector",
      parityCoverage: "native",
      nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
      fixtureIDs: [openCodeSessionNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(openCodeSessionNativeDescriptors.find((descriptor) => descriptor.id === openCodeSessionReaderSQLiteServiceNativeExactAtomID)).toMatchObject({
      port: "session.reader",
      parityCoverage: "native",
      nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
      fixtureIDs: [openCodeSessionNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(openCodeSessionNativeDescriptors.find((descriptor) => descriptor.id === openCodeSessionWriterSQLiteServiceNativeExactAtomID)).toMatchObject({
      port: "session.writer",
      parityCoverage: "native",
      nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
      fixtureIDs: [openCodeSessionNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(openCodeSessionNativeDescriptors.find((descriptor) => descriptor.id === openCodeSessionMessageStoreSQLiteServiceNativeExactAtomID)).toMatchObject({
      port: "session.message-store",
      parityCoverage: "native",
      nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
      fixtureIDs: [openCodeSessionNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(openCodeSessionNativeDescriptors.find((descriptor) => descriptor.id === openCodeSessionBranchingSQLiteServiceNativeExactAtomID)).toMatchObject({
      port: "session.branching",
      parityCoverage: "native",
      nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
      fixtureIDs: [openCodeSessionNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(openCodeSessionNativeDescriptors.find((descriptor) => descriptor.id === openCodeSessionDiffSQLiteServiceNativeExactAtomID)).toMatchObject({
      port: "session.diff",
      parityCoverage: "native",
      nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
      fixtureIDs: [openCodeSessionNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(openCodeSessionNativeDescriptors.find((descriptor) => descriptor.id === openCodeSessionEventLogSyncEventNativeExactAtomID)).toMatchObject({
      port: "session.event-log",
      parityCoverage: "native",
      nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
      fixtureIDs: [openCodeSessionNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(openCodeSessionNativeDescriptors.every((descriptor) => descriptor.parityCoverage === "native" && descriptor.knownLossiness.length === 0)).toBe(true)
    expect(fixture.cases.find((item) => item.scenarioID === "message-v2-part-row-projector-preserves-discriminated-payload-and-linkage")).toMatchObject({
      output: {
        projectedPart: {
          id: "prt_003",
          sessionID: "ses_7fffffffffffNativeSession",
          messageID: "msg_002",
          type: "text",
          text: "answer",
          metadata: { providerExecuted: true },
        },
        hydratedAssistantPartIDs: ["prt_002", "prt_003"],
        hydratedAssistantPartMessageIDs: ["msg_002", "msg_002"],
      },
    })
    expect(fixture.cases.find((item) => item.scenarioID === "context-selector-filter-compacted-message-v2-prompt-context")).toMatchObject({
      output: {
        contextIDs: ["msg_004", "msg_005", "msg_002", "msg_003", "msg_006"],
        latestUserID: "msg_006",
        model: { providerID: "anthropic", modelID: "claude" },
        taskPartIDs: [],
      },
    })
    expect(openCodeSessionSyncEventDefinitionsProjection().map((event) => event.eventType)).toEqual([
      "session.created",
      "session.updated",
      "session.deleted",
      "message.updated",
      "message.removed",
      "message.part.updated",
      "message.part.removed",
    ])
    expect(sessionNextRow).toEqual({
      id: "evt_1",
      session_id: "ses_1",
      type: "session.next.text.ended",
      time_created: 1000,
      data: { text: "done", time: 1000 },
    })
  })

  it("runs SQLite service-backed reader, writer, message-store, branching, and diff ports", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-opencode-session-service-"))
    const sqlitePath = join(dir, "opencode.db")
    const service = createOpenCodeSessionPersonality({ cwd: dir, sqlitePath })
    let closed = false
    const closeService = () => {
      if (!closed) {
        service.close()
        closed = true
      }
    }

    try {
      const sessionID = asSessionID("ses_sqlite_service")
      const userID = asMessageID("msg_sqlite_user")
      const assistantID = asMessageID("msg_sqlite_assistant")
      const textPartID = asPartID("prt_sqlite_text")
      const reasonPartID = asPartID("prt_sqlite_reason")
      const session = await service.create({ id: sessionID, cwd: dir, title: "SQLite service native" })
      const user = createUserMessage({ sessionID: session.id, id: userID, text: "hello native" })
      const assistant = createAssistantMessage({
        sessionID: session.id,
        id: assistantID,
        text: "answer",
        parts: [{ id: textPartID, type: "text", text: "answer" }],
      })
      user.time.created = 1000
      assistant.time.created = 2000
      assistant.time.completed = 2000

      await service.appendMessage(user)
      await service.appendMessage(assistant)
      await service.appendPart({
        sessionID: session.id,
        messageID: assistant.id,
        part: { id: reasonPartID, type: "reasoning", text: "because" },
      })
      await service.branch({ sessionID: session.id, entryID: String(userID) })
      const eventLog = createOpenCodeSessionEventLogAtom(service)
      eventLog.append({
        sessionID: session.id,
        type: "session.event-log.note",
        data: { source: "native-event-log" },
        timestamp: 1_780_000_000_123,
      })
      const scratchSessionID = asSessionID("ses_event_log_scratch")
      eventLog.append({
        sessionID: scratchSessionID,
        type: "session.event-log.scratch",
        data: { clear: true },
        timestamp: 1_780_000_000_124,
      })
      expect(eventLog.manifest.id).toBe(openCodeSessionEventLogSyncEventNativeExactAtomID)
      expect(eventLog.read({ sessionID: session.id }).map((event) => event.type)).toEqual(expect.arrayContaining([
        "session.created",
        "message.updated",
        "session.branch",
        "session.event-log.note",
      ]))
      expect(eventLog.read({ sessionID: scratchSessionID, type: "session.event-log.scratch" })).toHaveLength(1)
      eventLog.clear({ sessionID: scratchSessionID })
      expect(eventLog.read({ sessionID: scratchSessionID })).toEqual([])
      const contextSelector = createOpenCodeSessionContextSelectorAtom(service)
      expect(contextSelector.manifest.id).toBe(openCodeSessionContextSelectorMessageV2NativeExactAtomID)
      const baseContext = await contextSelector.select({ sessionID: session.id })
      expect(baseContext.messages.map((message) => message.id)).toEqual([userID, assistantID])

      const contextSession = await service.create({
        id: asSessionID("ses_sqlite_context_selector"),
        cwd: dir,
        title: "SQLite context selector native",
      })
      const tailUser = createUserMessage({ sessionID: contextSession.id, id: asMessageID("msg_context_002"), text: "tail user" })
      tailUser.time.created = 2000
      const tailAssistant = createAssistantMessage({
        sessionID: contextSession.id,
        id: asMessageID("msg_context_003"),
        text: "tail answer",
      })
      tailAssistant.parentID = tailUser.id
      tailAssistant.time.created = 3000
      tailAssistant.time.completed = 3000
      ;(tailAssistant as unknown as Record<string, unknown>)["finish"] = true
      const compactionUser = createUserMessage({
        sessionID: contextSession.id,
        id: asMessageID("msg_context_004"),
        text: "compact",
      })
      compactionUser.time.created = 4000
      compactionUser.parts = [
        {
          id: asPartID("prt_context_004"),
          type: "compaction",
          summary: "summary",
          reason: "auto",
          tail_start_id: String(tailUser.id),
        } as unknown as LegoMessage["parts"][number],
      ]
      const summaryAssistant = createAssistantMessage({
        sessionID: contextSession.id,
        id: asMessageID("msg_context_005"),
        text: "summary",
      })
      summaryAssistant.parentID = compactionUser.id
      summaryAssistant.time.created = 5000
      summaryAssistant.time.completed = 5000
      ;(summaryAssistant as unknown as Record<string, unknown>)["summary"] = true
      ;(summaryAssistant as unknown as Record<string, unknown>)["finish"] = true
      const latestUser = createUserMessage({
        sessionID: contextSession.id,
        id: asMessageID("msg_context_006"),
        text: "continue",
      })
      latestUser.time.created = 6000
      ;(latestUser as unknown as Record<string, unknown>)["model"] = { providerID: "anthropic", modelID: "claude-opus" }
      for (const message of [tailUser, tailAssistant, compactionUser, summaryAssistant, latestUser]) {
        await service.appendMessage(message)
      }
      const compactedContext = await contextSelector.select({ sessionID: contextSession.id })
      expect(compactedContext.messages.map((message) => message.id)).toEqual([
        asMessageID("msg_context_004"),
        asMessageID("msg_context_005"),
        asMessageID("msg_context_002"),
        asMessageID("msg_context_003"),
        asMessageID("msg_context_006"),
      ])
      expect(compactedContext.model).toEqual({ providerID: "anthropic", modelID: "claude-opus" })

      const fork = await service.fork({ sessionID: session.id, messageID: assistant.id, title: "SQLite service fork" })
      const transcript = await service.transcript(session.id)
      const messages = await service.messages({ sessionID: session.id, limit: 2 })
      const diff = await service.diff(session.id)

      expect(session).toMatchObject({ id: sessionID, title: "SQLite service native" })
      expect(messages.map((message) => message.id)).toEqual([userID, assistantID])
      expect(transcript.messages.map((message) => message.id)).toEqual([userID, assistantID])
      expect(transcript.messages[1]?.parts.map((part) => part.id)).toEqual([textPartID, reasonPartID])
      expect(fork).toMatchObject({ title: "SQLite service fork", parentID: session.id })
      expect((diff as Array<{ type: string }>).map((event) => event.type)).toEqual(expect.arrayContaining(["message.updated", "session.branch.noop"]))

      closeService()
      const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite")
      const db = new DatabaseSync(sqlitePath)
      try {
        const sessionRow = db.prepare("SELECT id, data FROM session WHERE id = ?").get(String(session.id)) as { id: string; data: string } | undefined
        const messageRows = db.prepare("SELECT id, session_id, data FROM message WHERE session_id = ?").all(String(session.id)) as Array<{
          id: string
          session_id: string
          data: string
        }>
        const partRows = db.prepare("SELECT id, message_id, data FROM part WHERE session_id = ?").all(String(session.id)) as Array<{
          id: string
          message_id: string
          data: string
        }>
        const linkRows = db.prepare("SELECT message_id FROM session_message WHERE session_id = ?").all(String(session.id)) as Array<{ message_id: string }>
        const eventRows = db.prepare("SELECT data FROM event WHERE session_id = ?").all(String(session.id)) as Array<{ data: string }>
        const partData = new Map(partRows.map((row) => [row.id, JSON.parse(row.data) as Record<string, unknown>]))
        const eventData = eventRows.map((row) => JSON.parse(row.data) as Record<string, unknown>)

        expect(sessionRow?.id).toBe(String(session.id))
        expect(JSON.parse(sessionRow!.data)).toMatchObject({ id: String(session.id), title: "SQLite service native" })
        expect(messageRows.map((row) => row.id)).toEqual(expect.arrayContaining([String(userID), String(assistantID)]))
        expect(linkRows.map((row) => row.message_id)).toEqual(expect.arrayContaining([String(userID), String(assistantID)]))
        expect(partData.get(String(textPartID))).toEqual({ type: "text", text: "answer" })
        expect(partData.get(String(reasonPartID))).toEqual({ type: "reasoning", text: "because" })
        expect(partRows.find((row) => row.id === String(reasonPartID))?.message_id).toBe(String(assistantID))
        expect(eventData).toEqual(expect.arrayContaining([
          expect.objectContaining({ type: "session.created" }),
          expect.objectContaining({ type: "session.branch" }),
          expect.objectContaining({ type: "session.event-log.note" }),
        ]))
      } finally {
        db.close()
      }
    } finally {
      closeService()
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
