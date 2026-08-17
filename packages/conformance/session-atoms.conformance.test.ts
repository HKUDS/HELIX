import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  captureOpenCodeSessionIDGeneratorNativeExactFixture,
  verifyOpenCodeSessionIDGeneratorNativeExactFixture,
} from "@helix/adapters-opencode/opencode-session-id-generator"
import {
  captureOpenCodeSessionPaginationNativeExactFixture,
  createOpenCodeSessionPaginationBridge,
  verifyOpenCodeSessionPaginationNativeExactFixture,
} from "@helix/adapters-opencode/opencode-session-pagination"
import {
  captureOpenCodeSessionCompactionEventNativeExactFixture,
  createOpenCodeSessionCompactionEventBridge,
  verifyOpenCodeSessionCompactionEventNativeExactFixture,
} from "@helix/adapters-opencode/opencode-session-compaction-event"
import {
  captureOpenCodeSessionBranchGraphNativeExactFixture,
  createOpenCodeSessionBranchGraphBridge,
  verifyOpenCodeSessionBranchGraphNativeExactFixture,
} from "@helix/adapters-opencode/opencode-session-branch-graph"
import {
  captureOpenCodeSessionMessageV2ProjectorNativeExactFixture,
  createOpenCodeSessionMessageV2ProjectorBridge,
  verifyOpenCodeSessionMessageV2ProjectorNativeExactFixture,
} from "@helix/adapters-opencode/opencode-session-message-v2-projector"
import {
  captureOpenCodeSessionSQLiteProjectionNativeExactFixture,
  createOpenCodeSessionSQLiteProjectionBridge,
  verifyOpenCodeSessionSQLiteProjectionNativeExactFixture,
} from "@helix/adapters-opencode/opencode-session-sqlite-projection"
import {
  captureOpenCodeSessionSyncEventProjectorNativeExactFixture,
  createOpenCodeSessionSyncEventProjector,
  verifyOpenCodeSessionSyncEventProjectorNativeExactFixture,
} from "@helix/adapters-opencode/opencode-session-syncevent-projector"
import { createID, type LegoMessage } from "@helix/contracts"
import {
  createAssistantMessage,
  buildHermesSessionSourceMatrixSnapshot,
  buildNanobotSessionSourceMatrixSnapshot,
  buildOpenCodeSessionSourceMatrixSnapshot,
  buildPiSessionSourceMatrixSnapshot,
  buildSessionStorageExactDiffBlockerSnapshot,
  buildSessionStoragePinnedReadbackSnapshot,
  buildSessionStorageRoundTripGateSnapshot,
  captureOpenCodeSessionLiveRuntimeFixture,
  projectOpenCodeSessionRuntimeProjection,
  createDeterministicSessionIDGenerator,
  createInMemorySessionAtoms,
  createInMemorySessionEventLog,
  createJsonlSessionEventLog,
  createOpenCodeSessionIDGenerator,
  createOpenCodeSyncEventProjector,
  createPiJsonlProjector,
  createPiSessionIDGenerator,
  createProjectionSessionEventLog,
  createServiceBackedSessionAtoms,
  createUserMessage,
  JsonlTreeSessionService,
  ProjectionSessionService,
  sessionPortContractFixtures,
  type ProjectionReplayEvent,
  type SessionService,
  verifySessionStorageExactDiffBlockerSnapshot,
  verifyOpenCodeSessionLiveRuntimeFixture,
  verifySessionStoragePinnedReadbackSnapshot,
  verifySessionStorageRoundTripGateSnapshot,
} from "@helix/lego-session"

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures")

function sessionFactories(): Array<[string, () => SessionService]> {
  return [
    [
      "jsonl-tree",
      () =>
        new JsonlTreeSessionService({
          storageDir: mkdtempSync(join(tmpdir(), "helix-session-atoms-jsonl-")),
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

describe("Session atom port catalog", () => {
  it("publishes contract fixtures for the first session ports", () => {
    expect(sessionPortContractFixtures.map((fixture) => fixture.id)).toEqual([
      "session.id-generator",
      "session.store",
      "session.event-log",
      "session.reader",
      "session.writer",
      "session.message-store",
      "session.branching",
      "session.branch-graph",
      "session.projector",
      "session.message-part-projector",
      "session.pagination",
      "session.context-selector",
      "session.compaction-records",
      "session.diff",
    ])
    expect(sessionPortContractFixtures.every((fixture) => fixture.conformance.startsWith("session-atoms:"))).toBe(true)
  })

  it("splits session id generation into deterministic, OpenCode, and Pi atoms", () => {
    const deterministic = createDeterministicSessionIDGenerator()
    const opencode = createOpenCodeSessionIDGenerator({
      now: () => 1234567890,
      randomBytes: (length) => new Uint8Array(length),
    })
    const pi = createPiSessionIDGenerator()

    expect(deterministic.next({ seed: "root" })).toBe("ses_test_root")
    expect(opencode.next()).toBe("ses_fb669fd2dffe00000000000000")
    expect(opencode.next()).toBe("ses_fb669fd2dffd00000000000000")
    expect(opencode.next({ seed: "ses_existing" })).toBe("ses_existing")
    expect(() => opencode.next({ seed: "msg_wrong" })).toThrow("ID msg_wrong does not start with ses")
    expect(pi.next({ seed: "00000000-0000-4000-8000-000000000000" })).toBe("00000000-0000-4000-8000-000000000000")
    expect(opencode.manifest.personality).toBe("opencode")
    expect(pi.manifest.personality).toBe("pi-mono")
  })

  it("pins OpenCode session id generation to upstream Session.ID descending behavior", () => {
    const fixture = captureOpenCodeSessionIDGeneratorNativeExactFixture()
    expect(verifyOpenCodeSessionIDGeneratorNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture.generated.map((item) => item.value)).toEqual([
      "ses_fb669fd2dffe00000000000000",
      "ses_fb669fd2dffd00000000000000",
    ])
    expect(fixture.knownLossiness).toEqual([])
  })

  it("splits session event-log into an independently testable atom", () => {
    const log = createInMemorySessionEventLog()
    const sessionID = createID("session")
    log.append({ sessionID, type: "session.created", data: { title: "root" }, timestamp: 1 })
    log.append({ sessionID, type: "message.updated", data: { text: "hello" }, timestamp: 2 })
    log.append({ type: "global", timestamp: 3 })

    expect(log.read({ sessionID }).map((event) => event.type)).toEqual(["session.created", "message.updated"])
    expect(log.read({ type: "global" })).toHaveLength(1)
    log.clear({ sessionID })
    expect(log.read({ sessionID })).toEqual([])
    expect(log.read({ type: "global" })).toHaveLength(1)
  })

  it("splits append-only JSONL event-log into an independently testable atom", () => {
    const logPath = join(mkdtempSync(join(tmpdir(), "helix-session-event-log-")), "events.jsonl")
    const log = createJsonlSessionEventLog(logPath)
    const sessionID = createID("session")
    log.append({ sessionID, type: "session.created", data: { title: "jsonl" }, timestamp: 10 })
    log.append({ sessionID, type: "message.updated", data: { text: "persisted" }, timestamp: 11 })

    const reopened = createJsonlSessionEventLog(logPath)
    expect(reopened.read({ sessionID }).map((event) => event.type)).toEqual(["session.created", "message.updated"])
    reopened.clear({ sessionID })
    expect(reopened.read({ sessionID })).toEqual([])
  })

  it("splits projection-backed event-log into an independently testable atom", () => {
    const log = createProjectionSessionEventLog()
    const sessionID = createID("session")
    log.append({
      sessionID,
      type: "session.created",
      data: { id: sessionID, title: "projection log", cwd: process.cwd(), created: 1, updated: 1 },
      timestamp: 1,
    })
    log.append({ sessionID, type: "session.updated", data: { title: "projection log updated" }, timestamp: 2 })

    expect(log.read({ sessionID }).map((event) => event.type)).toEqual(["session.created", "session.updated"])
    expect(log.read({ sessionID, type: "session.updated" })).toHaveLength(1)
    log.clear({ sessionID })
    expect(log.read({ sessionID })).toEqual([])
  })

  it("assembles neutral in-memory session atoms from replaceable common blocks", async () => {
    const atoms = createInMemorySessionAtoms({
      cwd: process.cwd(),
      idGenerator: createDeterministicSessionIDGenerator("neutral"),
    })
    const session = await atoms.writer.create({ title: "neutral root" })
    const user = createUserMessage({ sessionID: session.id, text: "neutral user" })
    const assistant = createAssistantMessage({ sessionID: session.id, text: "neutral assistant" })
    user.time.created = 1
    assistant.time.created = 2

    await atoms.messageStore.appendMessage(user)
    await atoms.messageStore.appendMessage(assistant)
    await atoms.messageStore.appendPart({
      sessionID: session.id,
      messageID: assistant.id,
      part: { id: createID("part"), type: "text", text: "neutral extra" },
    })

    expect(session.id).toBe("neutral_0001")
    expect(atoms.idGenerator.manifest.id).toBe("session.id-generator.deterministic")
    expect(atoms.messageStore.manifest.id).toBe("session.message-store.memory")
    expect(atoms.contextSelector.manifest.id).toBe("session.context-selector.memory")
    expect((await atoms.reader.messages({ sessionID: session.id })).map((message) => message.role)).toEqual(["user", "assistant"])
    expect((await atoms.pagination.pageMessages({ sessionID: session.id, limit: 1 })).messages.map(firstText)).toEqual(["neutral assistant"])

    const projected = await atoms.projector.project({
      sessionID: session.id,
      messages: await atoms.reader.messages({ sessionID: session.id }),
    })
    expect(JSON.stringify(projected.messages)).toContain("neutral extra")

    const context = await atoms.contextSelector.select({ sessionID: session.id })
    expect(context).toMatchObject({ thinkingLevel: "off", model: null })
    expect(context.messages.map(firstText)).toEqual(["neutral user", "neutral assistant"])

    const fork = await atoms.branching.fork({ sessionID: session.id, title: "neutral fork" })
    expect((await atoms.reader.messages({ sessionID: fork.id })).map((message) => message.sessionID)).toEqual([fork.id, fork.id])
    const diffEvents = (await atoms.branching.diff(session.id)) as Array<{ type: string }>
    expect(diffEvents.map((event) => event.type)).toEqual(
      expect.arrayContaining(["session.created", "message.updated", "session.forked"]),
    )
  })

  it("splits OpenCode SyncEvent and Pi JSONL migration projectors into personality atoms", async () => {
    const opencode = createOpenCodeSyncEventProjector()
    const pi = createPiJsonlProjector()

    const openCodeTranscript = await opencode.project({
      events: readJsonl<ProjectionReplayEvent>(join(fixturesDir, "opencode-projection-events.jsonl")),
    })
    const piTranscript = await pi.project({ path: join(fixturesDir, "pi-session-v3.jsonl") })

    expect(opencode.manifest.personality).toBe("opencode")
    expect(pi.manifest.personality).toBe("pi-mono")
    expect(openCodeTranscript.messages.map((message) => message.role)).toEqual(["user", "assistant"])
    expect(piTranscript.messages.map((message) => message.role)).toEqual(["user", "assistant"])
    expect(JSON.stringify(openCodeTranscript)).toContain("hello from opencode projection")
    expect(JSON.stringify(piTranscript)).toContain("hello from pi jsonl")
  })

  it("proves OpenCode session SyncEvent projector as a native exact module fixture", () => {
    const fixture = captureOpenCodeSessionSyncEventProjectorNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.session.projector.syncevent",
      portID: "session.projector",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-session-syncevent-projector-native-exact-fixture",
      replayRef: "session-syncevent-projector-native-exact:opencode",
      fixtureID: "opencode-session-syncevent-projector:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/projectors.ts"),
      expect.stringContaining("packages/opencode/src/session/session.ts"),
      expect.stringContaining("packages/opencode/src/session/session.sql.ts"),
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "session-row-roundtrip-and-partial-update",
      "session-created-updated-deleted-workspace-touch",
      "message-upsert-remove-and-usage-rollback",
      "part-update-remove-usage-delta",
      "late-foreign-updates-are-ignored",
    ])
    expect(verifyOpenCodeSessionSyncEventProjectorNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const projector = createOpenCodeSessionSyncEventProjector({ now: () => 1 })
    const state = projector.createState()
    projector.project({
      state,
      type: "session.created.1",
      data: {
        sessionID: "ses_min",
        info: {
          id: "ses_min",
          projectID: "prj_min",
          slug: "min",
          directory: "/repo",
          title: "Min",
          version: "1",
          time: { created: 1, updated: 1 },
        },
      },
    })
    expect([...state.sessions.keys()]).toEqual(["ses_min"])
    expect(verifyOpenCodeSessionSyncEventProjectorNativeExactFixture({ ...fixture, knownLossiness: ["partial-session"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-session-syncevent-projector.lossiness" }),
    ]))
  })

  it("proves OpenCode session pagination as a native exact module fixture", () => {
    const fixture = captureOpenCodeSessionPaginationNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.session.pagination.update-time-cursor",
      portID: "session.pagination",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-session-pagination-native-exact-fixture",
      replayRef: "session-pagination-native-exact:opencode",
      fixtureID: "opencode-session-pagination:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
      expect.stringContaining("packages/opencode/src/session/session.sql.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "cursor-base64url-roundtrip",
      "page-descending-query-reversed-items-and-tail-cursor",
      "page-before-cursor-uses-older-time-or-id",
      "empty-existing-session-and-missing-session",
      "stream-yields-newest-to-oldest-across-pages",
    ])
    expect(verifyOpenCodeSessionPaginationNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeSessionPaginationBridge()
    expect(bridge.cursor.decode(bridge.cursor.encode({ id: "msg_probe", time: 1 }))).toEqual({ id: "msg_probe", time: 1 })
    expect(verifyOpenCodeSessionPaginationNativeExactFixture({ ...fixture, knownLossiness: ["partial-pagination"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-session-pagination.lossiness" }),
    ]))
  })

  it("proves OpenCode session compaction event as a native exact module fixture", () => {
    const fixture = captureOpenCodeSessionCompactionEventNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.session.compaction-event",
      portID: "session.compaction-records",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-session-compaction-event-native-exact-fixture",
      replayRef: "session-compaction-event-native-exact:opencode",
      fixtureID: "opencode-session-compaction-event:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
      expect.stringContaining("packages/opencode/src/session/compaction.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "create-compaction-part-shape",
      "filter-compacted-without-tail-stops-at-summary",
      "filter-compacted-tail-reorders-retained-context",
      "latest-selects-max-id-and-open-tasks",
    ])
    expect(verifyOpenCodeSessionCompactionEventNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeSessionCompactionEventBridge()
    const created = bridge.create({
      sessionID: "ses_probe",
      messageID: "msg_probe",
      partID: "prt_probe",
      agent: "build",
      model: { providerID: "openai", modelID: "gpt-5" },
      auto: false,
      created: 1,
    })
    expect(created.part).toEqual({
      id: "prt_probe",
      messageID: "msg_probe",
      sessionID: "ses_probe",
      type: "compaction",
      auto: false,
    })
    expect(bridge.filterCompacted([{ info: created.info, parts: [created.part] }]).map((message) => message.info.id)).toEqual(["msg_probe"])
    expect(verifyOpenCodeSessionCompactionEventNativeExactFixture({ ...fixture, knownLossiness: ["partial-compaction"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-session-compaction-event.lossiness" }),
    ]))
  })

  it("proves OpenCode session branch graph fork-before-message as a native exact module fixture", () => {
    const fixture = captureOpenCodeSessionBranchGraphNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.session.branch-graph.fork-before-message",
      portID: "session.branch-graph",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-session-branch-graph-native-exact-fixture",
      replayRef: "session-branch-graph-native-exact:opencode",
      fixtureID: "opencode-session-branch-graph:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/session.ts"),
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
      expect.stringContaining("packages/opencode/src/session/session.sql.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "fork-title-increments-existing-suffix",
      "fork-before-message-clones-prefix-and-remaps-parent",
      "compaction-tail-start-remaps-through-cloned-id-map",
      "unmapped-assistant-parent-and-compaction-tail-follow-upstream-spread",
      "children-filter-by-session-parent-id",
    ])
    expect(verifyOpenCodeSessionBranchGraphNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeSessionBranchGraphBridge()
    const fork = bridge.fork({
      original: { id: "ses_root", title: "Probe", directory: "/repo", workspaceID: "wrk_probe" },
      messages: [
        {
          info: { id: "msg_001", role: "user", sessionID: "ses_root" },
          parts: [{ id: "prt_001", sessionID: "ses_root", messageID: "msg_001", type: "text", text: "hello" }],
        },
      ],
      newSessionID: "ses_fork",
      newMessageIDs: ["msg_new_001"],
      newPartIDs: ["prt_new_001"],
      directory: "/repo",
      path: ".",
    })
    expect(fork.session).toMatchObject({ id: "ses_fork", title: "Probe (fork #1)", workspaceID: "wrk_probe" })
    expect(fork.messages[0]?.parts[0]).toMatchObject({ id: "prt_new_001", sessionID: "ses_fork", messageID: "msg_new_001" })
    expect(verifyOpenCodeSessionBranchGraphNativeExactFixture({ ...fixture, knownLossiness: ["partial-branch-graph"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-session-branch-graph.lossiness" }),
    ]))
  })

  it("proves OpenCode MessageV2 projector as a native exact module fixture", () => {
    const fixture = captureOpenCodeSessionMessageV2ProjectorNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.session.projector.message-v2",
      portID: "session.projector",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-session-message-v2-projector-native-exact-fixture",
      replayRef: "session-message-v2-projector-native-exact:opencode",
      fixtureID: "opencode-session-message-v2-projector:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
      expect.stringContaining("packages/opencode/src/util/media.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "part-kind-and-prompt-input-kind-order",
      "user-parts-filter-files-compaction-and-subtask",
      "assistant-same-model-preserves-provider-metadata-and-tool-output",
      "assistant-different-model-downgrades-reasoning-and-drops-provider-metadata",
      "tool-media-extraction-and-state-fallbacks",
      "aborted-error-content-is-kept-while-other-errors-are-skipped",
      "tool-model-output-normalizes-string-json-and-data-url-content",
    ])
    expect(verifyOpenCodeSessionMessageV2ProjectorNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeSessionMessageV2ProjectorBridge()
    expect(bridge.providerMeta({ providerExecuted: true, keep: "yes" })).toEqual({ keep: "yes" })
    expect(bridge.projectToUIModelMessages({
      model: { providerID: "openai", id: "gpt-5", api: { npm: "@ai-sdk/openai", id: "gpt-5" } },
      messages: [{
        info: { id: "msg_user", sessionID: "ses_probe", role: "user" },
        parts: [{ id: "prt_text", sessionID: "ses_probe", messageID: "msg_user", type: "text", text: "hello" }],
      }],
    })).toEqual([{ id: "msg_user", role: "user", parts: [{ type: "text", text: "hello" }] }])
    expect(verifyOpenCodeSessionMessageV2ProjectorNativeExactFixture({ ...fixture, knownLossiness: ["partial-message-v2"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-session-message-v2-projector.lossiness" }),
    ]))
  })

  it("proves OpenCode session sqlite projection store as a native exact module fixture", () => {
    const fixture = captureOpenCodeSessionSQLiteProjectionNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.session.store.sqlite-projection",
      portID: "session.store",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-session-sqlite-projection-native-exact-fixture",
      replayRef: "session-sqlite-projection-native-exact:opencode",
      fixtureID: "opencode-session-sqlite-projection:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/session.sql.ts"),
      expect.stringContaining("packages/opencode/src/session/session.ts"),
      expect.stringContaining("packages/opencode/src/session/projectors.ts"),
      expect.stringContaining("packages/opencode/src/session/projectors-next.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "session-sql-schema-columns-and-indexes",
      "session-row-roundtrip-and-partial-update",
      "session-create-update-delete-and-workspace-touch",
      "message-part-upsert-remove-and-usage-rollback",
      "late-foreign-message-and-part-updates-are-ignored",
      "session-message-current-select-and-date-time-encoding",
    ])
    expect(verifyOpenCodeSessionSQLiteProjectionNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeSessionSQLiteProjectionBridge()
    const state = bridge.createState()
    bridge.project({
      state,
      type: "session.created",
      data: {
        sessionID: "ses_probe",
        info: {
          id: "ses_probe",
          projectID: "prj_probe",
          slug: "probe",
          directory: "/repo",
          title: "Probe",
          version: "1",
          time: { created: 1, updated: 1 },
        },
      },
    })
    expect([...state.sessions.keys()]).toEqual(["ses_probe"])
    expect(bridge.tableSchema().map((table) => table.table)).toEqual(["session", "message", "part", "todo", "session_message", "permission"])
    expect(verifyOpenCodeSessionSQLiteProjectionNativeExactFixture({ ...fixture, knownLossiness: ["partial-sqlite"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-session-sqlite-projection.lossiness" }),
    ]))
  })

  it("anchors OpenCode session bridge ports to pinned upstream session sources", () => {
    const snapshot = buildOpenCodeSessionSourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-session-source-matrix",
      fixtureID: "opencode-session:source-matrix",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-session-native-exact-fixture",
        "session-native-exact:opencode",
        "conformance:opencode-session-message-v2-projector-native-exact-fixture",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-session:native-exact-fixture",
        "opencode-session-message-v2-projector:native-exact-fixture",
      ]),
      nativeExactBranchIDs: expect.arrayContaining([
        "id-generator",
        "store-sqlite-projection",
        "projector-syncevent",
        "projector-message-v2",
        "branch-graph-fork-before-message",
        "compaction-event",
        "pagination-update-time-cursor",
      ]),
      partialBranchIDs: expect.arrayContaining([
        "full-sqlite-session-roundtrip",
        "live-syncevent-bus-runtime",
      ]),
      missingBranchIDs: [],
      coveredSessionAtomIDs: expect.arrayContaining([
        "opencode.session.branch-graph.fork-before-message",
        "opencode.session.compaction-event",
        "opencode.session.id-generator",
        "opencode.session.pagination.update-time-cursor",
        "opencode.session.projector.message-v2",
        "opencode.session.projector.syncevent",
        "opencode.session.store.sqlite-projection",
      ]),
      coveredSessionPortIDs: expect.arrayContaining([
        "session.id-generator",
        "session.store",
        "session.projector",
        "session.branch-graph",
        "session.compaction-records",
        "session.pagination",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-session-source-matrix-covered-by-partial-fixture",
        "opencode-session-live-runtime-fixture-partial-native-gap",
        "opencode-full-sqlite-session-roundtrip-not-proven",
        "opencode-live-syncevent-runtime-not-spawned",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-service",
        path: "packages/opencode/src/session/session.ts",
        symbols: expect.arrayContaining(["Info", "ForkInput", "Event", "Session"]),
      }),
      expect.objectContaining({
        id: "message-v2",
        path: "packages/opencode/src/session/message-v2.ts",
        symbols: expect.arrayContaining(["Part", "ToolPart", "CompactionPart", "MessageV2"]),
      }),
      expect.objectContaining({
        id: "session-sql",
        path: "packages/opencode/src/session/session.sql.ts",
        symbols: expect.arrayContaining(["SessionTable", "MessageTable", "PartTable"]),
      }),
      expect.objectContaining({
        id: "local-session-runtime-projection",
        path: "packages/lego-session/src/message-part-projector.ts",
        symbols: expect.arrayContaining(["projectOpenCodeSessionRuntimeProjection", "OpenCodeSessionRuntimeProjection"]),
      }),
      expect.objectContaining({
        id: "local-session-live-runtime-fixture",
        path: "packages/lego-session/src/message-part-projector.ts",
        symbols: expect.arrayContaining(["captureOpenCodeSessionLiveRuntimeFixture", "verifyOpenCodeSessionLiveRuntimeFixture"]),
      }),
    ]))
    expect(snapshot.branchAnchors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        branchID: "store-sqlite-projection",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        sessionAtomIDs: ["opencode.session.store.sqlite-projection"],
        sourceRefIDs: expect.arrayContaining(["local-session-live-runtime-fixture"]),
        localEvidenceRefs: expect.arrayContaining(["conformance:opencode-session-sqlite-projection-native-exact-fixture", "session-sqlite-projection-native-exact:opencode"]),
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-session-sqlite-projection-native-exact-fixture", "session-sqlite-projection-native-exact:opencode"]),
        fixtureIDs: ["opencode-session-sqlite-projection:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "projector-message-v2",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-session-message-v2-projector-native-exact-fixture", "session-message-v2-projector-native-exact:opencode"]),
        fixtureIDs: ["opencode-session-message-v2-projector:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "id-generator",
        status: "native-exact",
        exactDiffStatus: "pinned-upstream-source-exact",
        nativeEvidenceRefs: ["conformance:opencode-session-id-generator-native-exact-fixture"],
        fixtureIDs: ["opencode-session-id-generator:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "full-sqlite-session-roundtrip",
        status: "partial",
        localEvidenceRefs: expect.arrayContaining(["opencode-session:runtime-projection", "opencode-session:live-runtime-fixture"]),
        sourceRefIDs: expect.arrayContaining(["local-session-runtime-projection", "local-session-live-runtime-fixture"]),
        knownGaps: expect.arrayContaining(["opencode-full-sqlite-session-roundtrip-not-proven", "opencode-session-transaction-boundaries-not-upstream-exact"]),
      }),
      expect.objectContaining({
        branchID: "live-syncevent-bus-runtime",
        status: "partial",
        localEvidenceRefs: expect.arrayContaining(["opencode-session:live-runtime-fixture"]),
        localMarkers: expect.arrayContaining(["syncevent-bus:projected", "subscription-lifecycle:not-replayed", "syncevent-live-readback:partial"]),
        knownGaps: expect.arrayContaining(["opencode-live-syncevent-runtime-not-spawned", "opencode-upstream-native-session-runtime-not-spawned"]),
      }),
    ]))
  })

  it("projects OpenCode session runtime signals into a lossy partial fixture", () => {
    const projection = projectOpenCodeSessionRuntimeProjection([
      {
        type: "sqlite.roundtrip",
        table: "session",
        operation: "write",
        rowKeys: ["id", "time", "time"],
        sessionID: "ses_1",
        sequence: 2,
      },
      {
        type: "sqlite.roundtrip",
        table: "message",
        operation: "read",
        rowKeys: ["id", "role", "parts"],
        sessionID: "ses_1",
        messageID: "msg_1",
        sequence: 1,
      },
      {
        type: "syncevent.bus",
        eventType: "message.update",
        sessionID: "ses_1",
        partKinds: ["text", "tool", "text"],
        sequence: 3,
      },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-session:runtime-projection",
      evidenceRef: "conformance:opencode-session-runtime-projection",
      coveredBranchIDs: ["full-sqlite-session-roundtrip", "live-syncevent-bus-runtime"],
      retainedFields: expect.arrayContaining(["table", "operation", "rowKeys", "sessionID", "messageID", "eventType", "partKinds"]),
      lossyFields: expect.arrayContaining([
        "native sqlite transaction boundaries",
        "raw sqlite row values/private provider metadata",
        "native SyncEvent subscription lifecycle",
        "wall-clock SyncEvent dispatch timing",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-full-sqlite-session-roundtrip-not-proven",
        "opencode-live-syncevent-runtime-not-spawned",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(projection.sqliteRoundTrip).toEqual([
      { table: "message", operation: "read", rowKeys: ["id", "parts", "role"], sessionID: "ses_1", messageID: "msg_1", sequence: 1 },
      { table: "session", operation: "write", rowKeys: ["id", "time"], sessionID: "ses_1", messageID: null, sequence: 2 },
    ])
    expect(projection.syncEventRuntime).toEqual([
      { eventType: "message.update", sessionID: "ses_1", partKinds: ["text", "tool"], sequence: 3 },
    ])
  })

  it("captures OpenCode session live runtime fixture without promoting native parity", () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-opencode-session-live-"))
    try {
      const fixture = captureOpenCodeSessionLiveRuntimeFixture({
        cwd,
        sessionID: "ses_live_session_01",
        parentSessionID: "ses_live_parent_01",
        forkSessionID: "ses_live_fork_01",
        userMessageID: "msg_live_user_01",
        assistantMessageID: "msg_live_assistant_01",
        textPartID: "prt_live_text_01",
        toolPartID: "prt_live_tool_01",
        compactionPartID: "prt_live_compaction_01",
      })

      expect(verifyOpenCodeSessionLiveRuntimeFixture(fixture)).toEqual({ ok: true, issues: [] })
      expect(fixture).toMatchObject({
        schemaVersion: 1,
        fixtureID: "opencode-session:live-runtime-fixture",
        evidenceRef: "conformance:opencode-session-live-runtime-fixture",
        upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        exactDiffStatus: "live-runtime-partial",
        nativeParityClaim: false,
        capturedBranchIDs: expect.arrayContaining([
          "id-generator",
          "store-sqlite-projection",
          "projector-syncevent",
          "projector-message-v2",
          "branch-graph-fork-before-message",
          "compaction-event",
          "pagination-update-time-cursor",
          "full-sqlite-session-roundtrip",
          "live-syncevent-bus-runtime",
        ]),
        retainedFields: expect.arrayContaining([
          "session/message/part id readback",
          "sqlite table and row key coverage",
          "SyncEvent event type and part kind readback",
          "fork-before-message branch boundary",
        ]),
        lossyFields: expect.arrayContaining([
          "native sqlite transaction boundaries",
          "native SyncEvent subscription lifecycle",
          "wall-clock SyncEvent dispatch timing",
        ]),
        knownGaps: expect.arrayContaining([
          "opencode-upstream-native-session-runtime-not-spawned",
          "opencode-full-sqlite-session-roundtrip-not-proven",
          "opencode-session-transaction-boundaries-not-upstream-exact",
        ]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      expect(fixture.sessionReadback).toMatchObject({
        sessionID: "ses_live_session_01",
        parentSessionID: "ses_live_parent_01",
        forkSessionID: "ses_live_fork_01",
        cwd: "<cwd>",
        sessionPath: "<cwd>/.opencode/session/ses_live_session_01",
        title: "New Session",
      })
      expect(fixture.messageReadback).toMatchObject({
        userMessageID: "msg_live_user_01",
        assistantMessageID: "msg_live_assistant_01",
        partIDs: {
          text: "prt_live_text_01",
          tool: "prt_live_tool_01",
          compaction: "prt_live_compaction_01",
        },
        roleOrder: ["user", "assistant"],
        partKinds: ["text", "tool", "compaction"],
        providerMetadataKeys: ["finishReason", "modelID", "providerID", "usage"],
      })
      expect(fixture.sqliteRoundTrip.map((row) => `${row.table}:${row.operation}`)).toEqual(expect.arrayContaining([
        "session:write",
        "session:read",
        "message:write",
        "message:read",
        "part:write",
        "part:read",
      ]))
      expect(fixture.syncEventReadback.map((event) => event.eventType)).toEqual([
        "session.created",
        "message.updated",
        "part.updated",
        "session.forked",
        "session.compacted",
      ])
      expect(fixture.branchReadback).toEqual({
        parentSessionID: "ses_live_parent_01",
        forkSessionID: "ses_live_fork_01",
        forkBeforeMessageID: "msg_live_assistant_01",
        lineage: ["ses_live_parent_01", "ses_live_session_01", "ses_live_fork_01"],
      })
      expect(fixture.compactionReadback).toMatchObject({
        partID: "prt_live_compaction_01",
        partKind: "compaction",
        eventType: "session.compacted",
      })
      expect(fixture.paginationReadback).toMatchObject({
        cursorKind: "updated-at-message-id",
        cursorFields: ["messageID", "timeUpdated"],
        pageSize: 2,
      })

      const nativeClaim = { ...fixture, nativeParityClaim: true } as unknown as typeof fixture
      expect(verifyOpenCodeSessionLiveRuntimeFixture(nativeClaim).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "opencode-session-live-runtime-fixture.native-claim" }),
      ]))

      const sqliteDrop = {
        ...fixture,
        sqliteRoundTrip: fixture.sqliteRoundTrip.filter((row) => row.table !== "part"),
      }
      expect(verifyOpenCodeSessionLiveRuntimeFixture(sqliteDrop).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "opencode-session-live-runtime-fixture.sqlite-part" }),
      ]))

      const syncEventDrop = {
        ...fixture,
        syncEventReadback: fixture.syncEventReadback.filter((event) => event.eventType !== "session.compacted"),
      }
      expect(verifyOpenCodeSessionLiveRuntimeFixture(syncEventDrop).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "opencode-session-live-runtime-fixture.syncevent-session.compacted" }),
      ]))

      const gapDrop = {
        ...fixture,
        knownGaps: fixture.knownGaps.filter((gap) => gap !== "opencode-upstream-native-session-runtime-not-spawned"),
      }
      expect(verifyOpenCodeSessionLiveRuntimeFixture(gapDrop).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "opencode-session-live-runtime-fixture.native-gaps" }),
      ]))
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("anchors Pi, Nanobot, and Hermes session bridge ports to pinned upstream session sources", () => {
    const cases = [
      {
        product: "pi" as const,
        snapshot: buildPiSessionSourceMatrixSnapshot(),
        upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        evidenceRef: "conformance:pi-session-source-matrix",
        fixtureID: "pi-session:source-matrix",
        coveredAtoms: [
          "pi.session.branch-graph.active-leaf",
          "pi.session.branch-graph.leaf-tree",
          "pi.session.branch-summary",
          "pi.session.context-selector.active-leaf",
          "pi.session.id-generator",
          "pi.session.pagination.active-path",
          "pi.session.projector.jsonl-v3",
          "pi.session.store.jsonl-v3",
        ],
        sourcePaths: [
          "packages/coding-agent/src/core/session-manager.ts",
          "packages/coding-agent/docs/session-format.md",
          "packages/coding-agent/src/core/session-tree.ts",
          "packages/coding-agent/src/core/context-selector.ts",
        ],
      },
      {
        product: "nanobot" as const,
        snapshot: buildNanobotSessionSourceMatrixSnapshot(),
        upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        evidenceRef: "conformance:nanobot-session-source-matrix",
        fixtureID: "nanobot-session:source-matrix",
        coveredAtoms: [
          "nanobot.session.branch-graph.channel-key",
          "nanobot.session.context-selector.max-messages",
          "nanobot.session.goal-state",
          "nanobot.session.id-generator",
          "nanobot.session.pagination.updated-at",
          "nanobot.session.projector.jsonl",
          "nanobot.session.store.jsonl",
        ],
        sourcePaths: [
          "nanobot/session/manager.py",
          "nanobot/session/goal_state.py",
          "nanobot/config/paths.py",
          "nanobot/utils/session_attachments.py",
        ],
      },
      {
        product: "hermes" as const,
        snapshot: buildHermesSessionSourceMatrixSnapshot(),
        upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        evidenceRef: "conformance:hermes-session-source-matrix",
        fixtureID: "hermes-session:source-matrix",
        coveredAtoms: [
          "hermes.session.branch-graph.lineage",
          "hermes.session.compaction-trajectory",
          "hermes.session.context-selector.thread-history",
          "hermes.session.id-generator",
          "hermes.session.pagination.updated-at",
          "hermes.session.projector.openai-messages",
          "hermes.session.store.sqlite-fts",
        ],
        sourcePaths: [
          "acp_adapter/session.py",
          "agent/trajectory.py",
          "agent/agent_runtime_helpers.py",
          "agent/session_storage.py",
        ],
      },
    ]

    for (const item of cases) {
      expect(item.snapshot).toMatchObject({
        schemaVersion: 1,
        product: item.product,
        upstreamRef: item.upstreamRef,
        evidenceRef: item.evidenceRef,
        fixtureID: item.fixtureID,
        partialBranchIDs: expect.arrayContaining([
          "id-generator",
          "store-projection",
          "projector",
          "branch-graph",
          "compaction-record",
          "pagination-context",
          "provider-metadata",
        ]),
        missingBranchIDs: expect.arrayContaining([
          "live-session-runtime",
          "exact-storage-roundtrip",
          "exact-branch-side-effects",
        ]),
        coveredSessionAtomIDs: expect.arrayContaining(item.coveredAtoms),
        coveredSessionPortIDs: expect.arrayContaining([
          "session.id-generator",
          "session.store",
          "session.projector",
          "session.branch-graph",
          "session.compaction-records",
          "session.pagination",
          "session.context-selector",
        ]),
        knownGaps: expect.arrayContaining([
          `${item.product}-session-source-matrix-covered-by-partial-fixture`,
          `${item.product}-live-session-runtime-not-spawned`,
          `${item.product}-exact-storage-roundtrip-not-proven`,
        ]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      for (const path of item.sourcePaths) {
        expect(item.snapshot.sourceRefs).toEqual(expect.arrayContaining([expect.objectContaining({ path })]))
      }
      expect(item.snapshot.branchAnchors).toEqual(expect.arrayContaining([
        expect.objectContaining({
          branchID: "store-projection",
          status: "partial",
          sessionPortIDs: expect.arrayContaining(["session.store"]),
        }),
        expect.objectContaining({
          branchID: "exact-storage-roundtrip",
          status: "missing",
        }),
      ]))
    }
  })

  it("records session storage round-trip positive and negative gates", () => {
    const snapshot = buildSessionStorageRoundTripGateSnapshot()
    const verification = verifySessionStorageRoundTripGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:session-storage-round-trip-gate",
      fixtureID: "session:storage-round-trip-gate",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "message-part-schema",
        "store-readback",
        "branch-graph",
        "compaction-record",
        "pagination-context",
        "provider-metadata",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-session:source-matrix",
      readbackRisk: "source-anchored-partial",
      sourceAnchors: expect.arrayContaining([
        "session-service:packages/opencode/src/session/session.ts",
        "conformance:opencode-session-native-exact-fixture",
        "session-native-exact:opencode",
        "opencode-session:native-exact-fixture",
        "conformance:opencode-session-message-v2-projector-native-exact-fixture",
        "opencode-session-sqlite-projection:native-exact-fixture",
      ]),
      messagePartSchema: expect.arrayContaining(["MessageV2", "ToolPart", "native-exact", "opencode-session-message-v2-projector:native-exact-fixture"]),
      storeReadback: expect.arrayContaining(["sqlite-roundtrip:partial", "full-sqlite-session-roundtrip", "opencode-session-sqlite-projection:native-exact-fixture", "sqlite-message-v2"]),
      providerMetadata: expect.arrayContaining(["provider.raw_part_metadata", "native-metadata-record", "session-message-v2-projector-native-exact:opencode"]),
      fixtureIDs: expect.arrayContaining([
        "opencode-session:native-exact-fixture",
        "opencode-session-id-generator:native-exact-fixture",
        "opencode-session-sqlite-projection:native-exact-fixture",
        "opencode-session-message-v2-projector:native-exact-fixture",
        "opencode-session-compaction-event:native-exact-fixture",
      ]),
      knownLossiness: expect.arrayContaining(["opencode-full-sqlite-session-roundtrip-not-proven", "partial-session-storage-roundtrip"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-session:source-matrix",
      storeReadback: expect.arrayContaining(["jsonl-v3-session-tree", "exact-storage-roundtrip:not-replayed"]),
      paginationContext: expect.arrayContaining(["activePath", "selectContext"]),
      fixtureIDs: expect.arrayContaining([
        "pi-session:source-matrix",
        "pi-mono-session-message-part:message-part-projector",
        "pi-mono-session-message-part:storage-roundtrip",
        "pi-mono-session-message-part:provider-metadata-roundtrip",
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.branchGraph).toEqual(expect.arrayContaining([
      "channel_key",
      "history_reference",
      "channel-session-key",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.providerMetadata).toEqual(expect.arrayContaining([
      "api.trace_id",
      "session-search-reference",
      "memory-session-search-references",
    ]))

    const storeDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, storeReadback: [] }
          : item,
      ),
    }
    expect(verifySessionStorageRoundTripGateSnapshot(storeDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage.store-readback",
        product: "pi-mono",
        dimension: "store-readback",
      }),
    ]))

    const providerMetadataDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, providerMetadata: [] }
          : item,
      ),
    }
    expect(verifySessionStorageRoundTripGateSnapshot(providerMetadataDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage.provider-metadata",
        product: "hermes-agent",
        dimension: "provider-metadata",
      }),
    ]))

    const branchDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, branchGraph: [] }
          : item,
      ),
    }
    expect(verifySessionStorageRoundTripGateSnapshot(branchDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage.branch-graph",
        product: "nanobot",
        dimension: "branch-graph",
      }),
    ]))

    const commonTranscriptOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, readbackRisk: "common-transcript-only" as const }
          : item,
      ),
    }
    expect(verifySessionStorageRoundTripGateSnapshot(commonTranscriptOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage.common-transcript-only",
        product: "opencode",
        dimension: "store-readback",
      }),
    ]))

    const borrowedOpenCode = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, fixtureID: "opencode-session:source-matrix", readbackRisk: "borrowed-opencode" as const }
          : item,
      ),
    }
    expect(verifySessionStorageRoundTripGateSnapshot(borrowedOpenCode).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage.borrowed-source-matrix",
        product: "pi-mono",
        dimension: "message-part-schema",
      }),
    ]))
  })

  it("records session storage exact-diff blockers without claiming native parity", () => {
    const snapshot = buildSessionStorageExactDiffBlockerSnapshot()
    const verification = verifySessionStorageExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:session-storage-exact-diff-blocker-gate",
      fixtureID: "session:storage-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "message-part-schema",
        "store-readback",
        "branch-graph",
        "compaction-record",
        "pagination-context",
        "provider-metadata",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-session:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "semantic-fixture-needs-exact-diff",
      messagePartSchema: expect.arrayContaining(["session-message-part-schema-native-fields:exact-diff-not-proven"]),
      storeReadback: expect.arrayContaining(["session-store-readback-native-transaction:exact-diff-not-proven"]),
      branchGraph: expect.arrayContaining(["session-branch-graph-native-side-effects:exact-diff-not-proven"]),
      compactionRecord: expect.arrayContaining(["session-compaction-record-native-shape:exact-diff-not-proven"]),
      paginationContext: expect.arrayContaining(["session-pagination-context-native-cursor:exact-diff-not-proven"]),
      providerMetadata: expect.arrayContaining(["session-provider-metadata-native-private-state:exact-diff-not-proven"]),
      fixtureIDs: expect.arrayContaining(["session:storage-round-trip-gate", "opencode-session-message-part:storage-roundtrip"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "session-service:packages/opencode/src/session/session.ts",
        "conformance:opencode-session-native-exact-fixture",
        "session-native-exact:opencode",
        "opencode-session:native-exact-fixture",
        "opencode-session-message-part:provider-metadata-roundtrip",
      ]),
      knownLossiness: expect.arrayContaining(["session-store-readback-native-transaction-not-proven", "session-provider-metadata-native-private-state-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-session:source-matrix",
      storeReadback: expect.arrayContaining(["jsonl-v3-session-tree", "session-store-readback-native-transaction:exact-diff-not-proven"]),
      paginationContext: expect.arrayContaining(["session-pagination-context-native-cursor:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.branchGraph).toEqual(expect.arrayContaining([
      "channel_key",
      "session-branch-graph-native-side-effects:exact-diff-not-proven",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.providerMetadata).toEqual(expect.arrayContaining([
      "session-provider-metadata-native-private-state:exact-diff-not-proven",
      "api.trace_id",
    ]))

    const schemaDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, messagePartSchema: [] }
          : item,
      ),
    }
    expect(verifySessionStorageExactDiffBlockerSnapshot(schemaDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-exact-diff.message-part-schema",
        product: "opencode",
        dimension: "message-part-schema",
      }),
    ]))

    const storeDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, storeReadback: [] }
          : item,
      ),
    }
    expect(verifySessionStorageExactDiffBlockerSnapshot(storeDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-exact-diff.store-readback",
        product: "pi-mono",
        dimension: "store-readback",
      }),
    ]))

    const branchDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, branchGraph: [] }
          : item,
      ),
    }
    expect(verifySessionStorageExactDiffBlockerSnapshot(branchDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-exact-diff.branch-graph",
        product: "nanobot",
        dimension: "branch-graph",
      }),
    ]))

    const compactionDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, compactionRecord: [] }
          : item,
      ),
    }
    expect(verifySessionStorageExactDiffBlockerSnapshot(compactionDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-exact-diff.compaction-record",
        product: "hermes-agent",
        dimension: "compaction-record",
      }),
    ]))

    const paginationDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, paginationContext: [] }
          : item,
      ),
    }
    expect(verifySessionStorageExactDiffBlockerSnapshot(paginationDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-exact-diff.pagination-context",
        product: "opencode",
        dimension: "pagination-context",
      }),
    ]))

    const metadataDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, providerMetadata: [] }
          : item,
      ),
    }
    expect(verifySessionStorageExactDiffBlockerSnapshot(metadataDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-exact-diff.provider-metadata",
        product: "hermes-agent",
        dimension: "provider-metadata",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifySessionStorageExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-exact-diff.native-claim",
        product: "opencode",
        dimension: "store-readback",
      }),
    ]))

    const commonTranscriptOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "common-transcript-only" as const }
          : item,
      ),
    }
    expect(verifySessionStorageExactDiffBlockerSnapshot(commonTranscriptOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-exact-diff.common-transcript-only",
        product: "pi-mono",
        dimension: "store-readback",
      }),
    ]))

    const borrowedOpenCode = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, fixtureID: "opencode-session:source-matrix", exactDiffRisk: "borrowed-opencode" as const }
          : item,
      ),
    }
    expect(verifySessionStorageExactDiffBlockerSnapshot(borrowedOpenCode).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-exact-diff.borrowed-source-matrix",
        product: "nanobot",
        dimension: "message-part-schema",
      }),
    ]))
  })

  it("records session storage pinned readback fixtures without upgrading native parity", () => {
    const snapshot = buildSessionStoragePinnedReadbackSnapshot()
    const verification = verifySessionStoragePinnedReadbackSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:session-storage-pinned-readback-gate",
      fixtureID: "session:storage-pinned-readback-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "message-part-schema",
        "store-readback",
        "branch-graph",
        "compaction-record",
        "pagination-context",
        "provider-metadata",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-session:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "pinned-readback-needs-live-storage",
      upstreamWrites: expect.arrayContaining([
        expect.objectContaining({ storageKey: "sqlite:session_message", partType: "text", paginationCursor: "updated_at:0001" }),
        expect.objectContaining({ storageKey: "sqlite:session_part", partType: "tool_call", compactionID: "summary_oc_1" }),
      ]),
      productReadback: expect.arrayContaining([
        expect.objectContaining({ messageID: "msg_oc_1", providerMetadata: expect.objectContaining({ rawPartID: "raw_oc_1" }) }),
      ]),
      assembledProjection: expect.arrayContaining([
        expect.objectContaining({ messageID: "msg_oc_2", branchID: "branch-child", parentBranchID: "branch-root" }),
      ]),
      fixtureIDs: expect.arrayContaining([
        "session:storage-round-trip-gate",
        "opencode-session:native-exact-fixture",
        "opencode-session-message-part:storage-roundtrip",
      ]),
      sourceAnchors: expect.arrayContaining([
        "session-service:packages/opencode/src/session/session.ts",
        "conformance:opencode-session-native-exact-fixture",
        "session-native-exact:opencode",
      ]),
      knownLossiness: expect.arrayContaining(["session-storage-pinned-readback-live-runtime-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      upstreamWrites: expect.arrayContaining([
        expect.objectContaining({ storageKey: "jsonl:v3:entry", branchID: "leaf-root" }),
        expect.objectContaining({ storageKey: "jsonl:v3:entry", branchID: "leaf-child", compactionID: "branch_summary_pi_1" }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      upstreamWrites: expect.arrayContaining([
        expect.objectContaining({ storageKey: "memory-session:goal_state", providerMetadata: expect.objectContaining({ goalState: "active" }) }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")).toMatchObject({
      upstreamWrites: expect.arrayContaining([
        expect.objectContaining({ storageKey: "sqlite-fts:trajectory", providerMetadata: expect.objectContaining({ traceID: "trace_hermes_1" }) }),
        expect.objectContaining({ storageKey: "trajectory:tool_result", toolCallID: "tool_hermes_1" }),
      ]),
    })

    const storeDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              productReadback: item.productReadback.map((record, index) =>
                index === 0
                  ? { ...record, partText: "drifted readback text" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifySessionStoragePinnedReadbackSnapshot(storeDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-pinned-readback.store-readback",
        product: "opencode",
        dimension: "store-readback",
      }),
    ]))

    const schemaDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? {
              ...item,
              upstreamWrites: item.upstreamWrites.map((record, index) =>
                index === 0
                  ? { ...record, partID: "" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifySessionStoragePinnedReadbackSnapshot(schemaDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-pinned-readback.message-part-schema",
        product: "pi-mono",
        dimension: "message-part-schema",
      }),
    ]))

    const branchDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? {
              ...item,
              assembledProjection: item.assembledProjection.map((record, index) =>
                index === 1
                  ? { ...record, parentBranchID: "wrong-parent" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifySessionStoragePinnedReadbackSnapshot(branchDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-pinned-readback.branch-graph",
        product: "nanobot",
        dimension: "branch-graph",
      }),
    ]))

    const compactionDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              productReadback: item.productReadback.map((record, index) =>
                index === 1
                  ? { ...record, compactionID: null }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifySessionStoragePinnedReadbackSnapshot(compactionDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-pinned-readback.compaction-record",
        product: "hermes-agent",
        dimension: "compaction-record",
      }),
    ]))

    const paginationDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledProjection: item.assembledProjection.map((record, index) =>
                index === 0
                  ? { ...record, paginationCursor: "updated_at:wrong" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifySessionStoragePinnedReadbackSnapshot(paginationDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-pinned-readback.pagination-context",
        product: "opencode",
        dimension: "pagination-context",
      }),
    ]))

    const providerMetadataDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              productReadback: item.productReadback.map((record, index) =>
                index === 0
                  ? { ...record, providerMetadata: { ...record.providerMetadata, traceID: "wrong-trace" } }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifySessionStoragePinnedReadbackSnapshot(providerMetadataDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-pinned-readback.provider-metadata",
        product: "hermes-agent",
        dimension: "provider-metadata",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifySessionStoragePinnedReadbackSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-pinned-readback.native-claim",
        product: "pi-mono",
        dimension: "store-readback",
      }),
    ]))

    const harnessOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, exactDiffRisk: "helix-only" as const }
          : item,
      ),
    }
    expect(verifySessionStoragePinnedReadbackSnapshot(harnessOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-storage-pinned-readback.helix-only",
        product: "nanobot",
        dimension: "store-readback",
      }),
    ]))
  })
})

describe.each(sessionFactories())("Session atom ports over %s", (_name, factory) => {
  it("exposes reader, writer, message-store, pagination, projector, context, branching, and diff atoms", async () => {
    const service = factory()
    const atoms = createServiceBackedSessionAtoms(service)
    const session = await atoms.writer.create({ title: "atom root" })
    const user = createUserMessage({ sessionID: session.id, text: "one" })
    const assistant = createAssistantMessage({ sessionID: session.id, text: "two" })
    user.time.created = 1
    assistant.time.created = 2
    if (assistant.time.completed !== undefined) assistant.time.completed = 2

    await atoms.messageStore.appendMessage(user)
    await atoms.messageStore.appendMessage(assistant)

    const extraPart = { id: createID("part"), type: "text" as const, text: "two-extra" }
    await atoms.messageStore.appendPart({ sessionID: session.id, messageID: assistant.id, part: extraPart })
    await atoms.messageStore.updatePart({
      sessionID: session.id,
      messageID: assistant.id,
      partID: extraPart.id,
      part: { ...extraPart, text: "two-updated" },
    })

    expect((await atoms.reader.get(session.id)).title).toBe("atom root")
    expect((await atoms.reader.list()).map((info) => info.id)).toContain(session.id)
    expect((await atoms.reader.messages({ sessionID: session.id })).map((message) => message.role)).toEqual(["user", "assistant"])
    expect((await atoms.reader.transcript(session.id)).messages).toHaveLength(2)
    expect((await atoms.pagination.pageMessages({ sessionID: session.id, limit: 1 })).messages.map(firstText)).toEqual(["two"])

    const projected = await atoms.projector.project({
      sessionID: session.id,
      messages: await atoms.reader.messages({ sessionID: session.id }),
    })
    expect(projected.messages).toHaveLength(2)
    expect(JSON.stringify(projected.messages)).toContain("two-updated")

    const context = await atoms.contextSelector.select({ sessionID: session.id })
    expect(context.messages.map(firstText)).toEqual(["one", "two"])

    const fork = await atoms.branching.fork({ sessionID: session.id, title: "atom fork" })
    expect((await atoms.reader.messages({ sessionID: fork.id })).map((message) => message.role)).toEqual(["user", "assistant"])
    await expect(atoms.branching.diff(session.id)).resolves.toEqual(expect.any(Array))

    await atoms.messageStore.removePart({ sessionID: session.id, messageID: assistant.id, partID: extraPart.id })
    await atoms.messageStore.removeMessage({ sessionID: session.id, messageID: user.id })
    expect((await atoms.reader.messages({ sessionID: session.id })).map((message) => message.role)).toEqual(["assistant"])
  })
})

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T)
}
