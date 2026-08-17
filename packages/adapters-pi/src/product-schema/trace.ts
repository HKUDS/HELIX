import { createHash } from "node:crypto"

export const piMonoTraceUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoTraceDebugSurfaceNativeExactAtomID = "pi.trace.debug-surface"
export const piMonoTraceDebugSurfaceNativeExactFixtureID = "pi-trace-debug-surface:native-exact-fixture"
export const piMonoTraceDebugSurfaceNativeExactEvidenceRef = "conformance:pi-trace-debug-surface-native-exact-fixture"
export const piMonoTraceDebugSurfaceNativeExactReplayRef = "trace-debug-surface-native-exact:pi-mono"

export type PiMonoTraceRuntimeReason = "new" | "resume" | "fork" | "quit"
export type PiMonoTraceRecordSource = "agent-session-runtime" | "session-format"
export type PiMonoTraceRecordEvent =
  | "session_before_switch"
  | "session_before_fork"
  | "session_shutdown"
  | "session_start"
  | "session_rebind"
  | "before_session_invalidate"
  | "session_dispose"
  | "import_copy"
  | "jsonl_readback"
  | "context_rebuild"

export interface PiMonoTraceDebugRecord {
  sequence: number
  event: PiMonoTraceRecordEvent
  source: PiMonoTraceRecordSource
  reason?: PiMonoTraceRuntimeReason | undefined
  targetSessionFile?: string | undefined
  previousSessionFile?: string | undefined
  entryID?: string | undefined
  parentID?: string | null | undefined
  entryType?: string | undefined
  role?: string | undefined
  contentText?: string | undefined
  contentHash?: string | undefined
  selectedText?: string | undefined
  redaction: "none-upstream-jsonl-storage" | "not-applicable"
  flowProjection: "runtime-lifecycle" | "session-jsonl-readback" | "context-rebuild"
}

export type PiMonoTraceRuntimeAction =
  | {
      type: "switch"
      targetSessionFile: string
      nextSessionFile?: string | undefined
      cancelled?: boolean | undefined
    }
  | {
      type: "new"
      nextSessionFile: string
      parentSession?: string | undefined
      setupRebuildsContext?: boolean | undefined
      cancelled?: boolean | undefined
    }
  | {
      type: "fork"
      entry: PiMonoTraceReplayEntry
      position?: "before" | "at" | undefined
      nextSessionFile: string
      cancelled?: boolean | undefined
    }
  | {
      type: "import"
      inputPath: string
      destinationPath: string
      jsonl: string
      cancelled?: boolean | undefined
    }
  | { type: "dispose" }

export interface PiMonoTraceReplayEntry {
  id: string
  parentId: string | null
  type: string
  timestamp: string
  message?: unknown
}

export interface PiMonoTraceReplayResult {
  records: PiMonoTraceDebugRecord[]
  finalSessionFile: string
  cancelledActions: number
  jsonlReadbackRecords: PiMonoTraceDebugRecord[]
}

export interface PiMonoTraceNativeDescriptor {
  id: typeof piMonoTraceDebugSurfaceNativeExactAtomID
  port: "trace.recorder"
  product: "pi-mono"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof piMonoTraceDebugSurfaceNativeExactEvidenceRef, typeof piMonoTraceDebugSurfaceNativeExactReplayRef]
  fixtureIDs: [typeof piMonoTraceDebugSurfaceNativeExactFixtureID]
  knownLossiness: []
}

export type PiMonoTraceNativeScenarioID =
  | "switch-session-runtime-order"
  | "new-session-setup-rebuilds-context"
  | "fork-before-user-message-selected-text"
  | "import-jsonl-copy-and-readback"
  | "dispose-session-shutdown"
  | "cancelled-before-switch-short-circuits"

export interface PiMonoTraceNativeExactCase {
  scenarioID: PiMonoTraceNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoTraceNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoTraceDebugSurfaceNativeExactAtomID
  portID: "trace.recorder"
  upstreamRef: typeof piMonoTraceUpstreamRef
  evidenceRef: typeof piMonoTraceDebugSurfaceNativeExactEvidenceRef
  fixtureID: typeof piMonoTraceDebugSurfaceNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    sessionBeforeSwitchRunsBeforeResumeOrNewReplacement: true
    cancelledBeforeSwitchSkipsShutdownAndStart: true
    sessionShutdownRunsBeforeInvalidationAndDispose: true
    sessionStartCarriesReasonAndPreviousSessionFile: true
    forkBeforeUserMessageExtractsTextParts: true
    importCopiesJsonlBeforeOpeningDestination: true
    jsonlReadbackPreservesLineOrder: true
    jsonlTraceLayerDoesNotRedactStoredSessionContent: true
    flowProjectionUsesSessionParentTreeAndRuntimeLifecycle: true
  }
  cases: PiMonoTraceNativeExactCase[]
  replay: PiMonoTraceReplayResult
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptor: PiMonoTraceNativeDescriptor
  fingerprint: string
}

export interface PiMonoTraceNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoTraceNativeExactVerification {
  ok: boolean
  issues: PiMonoTraceNativeExactIssue[]
}

export const piMonoTraceDebugSurfaceNativeDescriptor: PiMonoTraceNativeDescriptor = {
  id: piMonoTraceDebugSurfaceNativeExactAtomID,
  port: "trace.recorder",
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: "Pi upstream native implementation of AgentSessionRuntime session lifecycle and JSONL session readback trace with native parity complete replay coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoTraceDebugSurfaceNativeExactEvidenceRef, piMonoTraceDebugSurfaceNativeExactReplayRef],
  fixtureIDs: [piMonoTraceDebugSurfaceNativeExactFixtureID],
  knownLossiness: [],
}

export const piMonoTraceNativeDescriptors = [piMonoTraceDebugSurfaceNativeDescriptor] as const

export function replayPiMonoSessionRuntimeTrace(input: {
  currentSessionFile: string
  actions: PiMonoTraceRuntimeAction[]
}): PiMonoTraceReplayResult {
  const records: PiMonoTraceDebugRecord[] = []
  let currentSessionFile = input.currentSessionFile
  let sequence = 0
  let cancelledActions = 0
  const push = (record: Omit<PiMonoTraceDebugRecord, "sequence">) => {
    records.push({ sequence: sequence++, ...record })
  }

  for (const action of input.actions) {
    if (action.type === "switch") {
      push(runtimeRecord("session_before_switch", "resume", { targetSessionFile: action.targetSessionFile }))
      if (action.cancelled) {
        cancelledActions++
        continue
      }
      const previousSessionFile = currentSessionFile
      const nextSessionFile = action.nextSessionFile ?? action.targetSessionFile
      push(runtimeRecord("session_shutdown", "resume", { targetSessionFile: nextSessionFile }))
      currentSessionFile = nextSessionFile
      push(runtimeRecord("session_start", "resume", { previousSessionFile, targetSessionFile: currentSessionFile }))
      push(runtimeRecord("session_rebind", "resume", { targetSessionFile: currentSessionFile }))
      continue
    }

    if (action.type === "new") {
      push(runtimeRecord("session_before_switch", "new"))
      if (action.cancelled) {
        cancelledActions++
        continue
      }
      const previousSessionFile = currentSessionFile
      push(runtimeRecord("session_shutdown", "new", { targetSessionFile: action.nextSessionFile }))
      currentSessionFile = action.nextSessionFile
      push(runtimeRecord("session_start", "new", { previousSessionFile, targetSessionFile: currentSessionFile }))
      if (action.setupRebuildsContext) {
        push({
          event: "context_rebuild",
          source: "agent-session-runtime",
          reason: "new",
          targetSessionFile: currentSessionFile,
          redaction: "not-applicable",
          flowProjection: "context-rebuild",
        })
      }
      push(runtimeRecord("session_rebind", "new", { targetSessionFile: currentSessionFile }))
      continue
    }

    if (action.type === "fork") {
      const position = action.position ?? "before"
      push({
        event: "session_before_fork",
        source: "agent-session-runtime",
        reason: "fork",
        entryID: action.entry.id,
        parentID: action.entry.parentId,
        selectedText: position === "before" ? extractPiMonoUserMessageText(action.entry.message) : undefined,
        redaction: "not-applicable",
        flowProjection: "runtime-lifecycle",
      })
      if (action.cancelled) {
        cancelledActions++
        continue
      }
      const previousSessionFile = currentSessionFile
      push(runtimeRecord("session_shutdown", "fork", { targetSessionFile: action.nextSessionFile }))
      currentSessionFile = action.nextSessionFile
      push(runtimeRecord("session_start", "fork", { previousSessionFile, targetSessionFile: currentSessionFile }))
      push(runtimeRecord("session_rebind", "fork", { targetSessionFile: currentSessionFile }))
      continue
    }

    if (action.type === "import") {
      if (action.inputPath !== action.destinationPath) {
        push({
          event: "import_copy",
          source: "agent-session-runtime",
          reason: "resume",
          targetSessionFile: action.destinationPath,
          redaction: "not-applicable",
          flowProjection: "runtime-lifecycle",
        })
      }
      push(runtimeRecord("session_before_switch", "resume", { targetSessionFile: action.destinationPath }))
      if (action.cancelled) {
        cancelledActions++
        continue
      }
      const previousSessionFile = currentSessionFile
      push(runtimeRecord("session_shutdown", "resume", { targetSessionFile: action.destinationPath }))
      currentSessionFile = action.destinationPath
      push(runtimeRecord("session_start", "resume", { previousSessionFile, targetSessionFile: currentSessionFile }))
      for (const readback of readPiMonoSessionJsonlTrace(action.jsonl)) {
        push(readback)
      }
      push(runtimeRecord("session_rebind", "resume", { targetSessionFile: currentSessionFile }))
      continue
    }

    const previousSessionFile = currentSessionFile
    push(runtimeRecord("session_shutdown", "quit", { targetSessionFile: previousSessionFile }))
    push(runtimeRecord("before_session_invalidate", "quit", { targetSessionFile: previousSessionFile }))
    push(runtimeRecord("session_dispose", "quit", { targetSessionFile: previousSessionFile }))
  }

  return {
    records,
    finalSessionFile: currentSessionFile,
    cancelledActions,
    jsonlReadbackRecords: records.filter((record) => record.event === "jsonl_readback"),
  }
}

export function readPiMonoSessionJsonlTrace(content: string): Array<Omit<PiMonoTraceDebugRecord, "sequence">> {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0)
  return lines.map((line) => {
    const entry = JSON.parse(line) as Record<string, unknown>
    const message = isRecord(entry.message) ? entry.message : undefined
    const role = typeof message?.role === "string" ? message.role : undefined
    const contentText = role && message ? extractPiMonoMessageContentText(message.content) : undefined
    return {
      event: "jsonl_readback" as const,
      source: "session-format" as const,
      entryID: typeof entry.id === "string" ? entry.id : undefined,
      parentID: typeof entry.parentId === "string" || entry.parentId === null ? entry.parentId : undefined,
      entryType: typeof entry.type === "string" ? entry.type : undefined,
      role,
      contentText,
      contentHash: contentText === undefined ? undefined : hashText(contentText),
      redaction: "none-upstream-jsonl-storage" as const,
      flowProjection: "session-jsonl-readback" as const,
    }
  })
}

export function buildPiMonoTraceNativeExactFixture(): PiMonoTraceNativeExactFixture {
  const jsonl = [
    JSON.stringify({ type: "session", version: 3, id: "session-id", timestamp: "2026-06-01T00:00:00.000Z", cwd: "/repo" }),
    JSON.stringify({ type: "message", id: "u1", parentId: null, timestamp: "2026-06-01T00:00:01.000Z", message: { role: "user", content: [{ type: "text", text: "inspect trace" }] } }),
    JSON.stringify({ type: "message", id: "a1", parentId: "u1", timestamp: "2026-06-01T00:00:02.000Z", message: { role: "assistant", content: [{ type: "thinking", thinking: "plan" }, { type: "text", text: "done" }], provider: "anthropic", model: "claude-sonnet-4-5" } }),
    JSON.stringify({ type: "compaction", id: "c1", parentId: "a1", timestamp: "2026-06-01T00:00:03.000Z", summary: "summary", firstKeptEntryId: "a1", tokensBefore: 512 }),
  ].join("\n")
  const replay = replayPiMonoSessionRuntimeTrace({
    currentSessionFile: "/repo/.pi/current.jsonl",
    actions: [
      { type: "switch", targetSessionFile: "/repo/.pi/resume.jsonl" },
      { type: "new", nextSessionFile: "/repo/.pi/new.jsonl", parentSession: "/repo/.pi/resume.jsonl", setupRebuildsContext: true },
      {
        type: "fork",
        entry: {
          type: "message",
          id: "u1",
          parentId: null,
          timestamp: "2026-06-01T00:00:01.000Z",
          message: { role: "user", content: [{ type: "text", text: "inspect trace" }, { type: "image", data: "base64", mimeType: "image/png" }] },
        },
        position: "before",
        nextSessionFile: "/repo/.pi/fork.jsonl",
      },
      { type: "import", inputPath: "/tmp/import.jsonl", destinationPath: "/repo/.pi/import.jsonl", jsonl },
      { type: "switch", targetSessionFile: "/repo/.pi/cancelled.jsonl", cancelled: true },
      { type: "dispose" },
    ],
  })
  const fixtureWithoutFingerprint: Omit<PiMonoTraceNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoTraceDebugSurfaceNativeExactAtomID,
    portID: "trace.recorder" as const,
    upstreamRef: piMonoTraceUpstreamRef,
    evidenceRef: piMonoTraceDebugSurfaceNativeExactEvidenceRef,
    fixtureID: piMonoTraceDebugSurfaceNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      sessionBeforeSwitchRunsBeforeResumeOrNewReplacement: true as const,
      cancelledBeforeSwitchSkipsShutdownAndStart: true as const,
      sessionShutdownRunsBeforeInvalidationAndDispose: true as const,
      sessionStartCarriesReasonAndPreviousSessionFile: true as const,
      forkBeforeUserMessageExtractsTextParts: true as const,
      importCopiesJsonlBeforeOpeningDestination: true as const,
      jsonlReadbackPreservesLineOrder: true as const,
      jsonlTraceLayerDoesNotRedactStoredSessionContent: true as const,
      flowProjectionUsesSessionParentTreeAndRuntimeLifecycle: true as const,
    },
    cases: [
      traceCase(
        "switch-session-runtime-order",
        { currentSessionFile: "current.jsonl", targetSessionFile: "resume.jsonl" },
        { events: ["session_before_switch", "session_shutdown", "session_start", "session_rebind"], reason: "resume" },
        "AgentSessionRuntime.switchSession emits session_before_switch, tears down the current session with reason resume, creates the target runtime with session_start reason resume, then rebinds the session.",
      ),
      traceCase(
        "new-session-setup-rebuilds-context",
        { parentSession: "resume.jsonl", setup: true },
        { events: ["session_before_switch", "session_shutdown", "session_start", "context_rebuild", "session_rebind"], reason: "new" },
        "AgentSessionRuntime.newSession emits session_before_switch for new sessions, creates a new SessionManager, runs setup, and rebuilds agent state from buildSessionContext before rebind.",
      ),
      traceCase(
        "fork-before-user-message-selected-text",
        { entryID: "u1", position: "before" },
        { selectedText: "inspect trace", ignoresImageBlocks: true },
        "AgentSessionRuntime.fork with position before requires a user message and extracts selectedText by concatenating only text content blocks.",
      ),
      traceCase(
        "import-jsonl-copy-and-readback",
        { inputPath: "/tmp/import.jsonl", destinationPath: "/repo/.pi/import.jsonl" },
        { copiedBeforeOpen: true, readbackEntryTypes: ["session", "message", "message", "compaction"], redaction: "none-upstream-jsonl-storage" },
        "AgentSessionRuntime.importFromJsonl copies the JSONL file into the session directory before SessionManager.open; Pi session-format stores JSONL entries in file order with message content preserved.",
      ),
      traceCase(
        "dispose-session-shutdown",
        { reason: "quit" },
        { events: ["session_shutdown", "before_session_invalidate", "session_dispose"] },
        "AgentSessionRuntime.dispose emits session_shutdown with reason quit, runs beforeSessionInvalidate, then disposes the current session.",
      ),
      traceCase(
        "cancelled-before-switch-short-circuits",
        { cancelled: true },
        { events: ["session_before_switch"], noShutdownOrStart: true },
        "session_before_switch cancellation returns { cancelled: true } and prevents teardown, session_start, and rebind.",
      ),
    ],
    replay,
    sourceRefs: [
      `${piMonoTraceUpstreamRef}:packages/coding-agent/src/core/agent-session-runtime.ts#AgentSessionRuntime.switchSession,newSession,fork,importFromJsonl,dispose`,
      `${piMonoTraceUpstreamRef}:packages/coding-agent/docs/session-format.md#SessionFileFormat,SessionHeader,SessionMessageEntry,CompactionEntry,SessionManagerAPI`,
    ],
    nativeEvidenceRefs: [piMonoTraceDebugSurfaceNativeExactEvidenceRef, piMonoTraceDebugSurfaceNativeExactReplayRef],
    fixtureIDs: [piMonoTraceDebugSurfaceNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptor: { ...piMonoTraceDebugSurfaceNativeDescriptor },
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoTraceNativeExactFixture(fixture: PiMonoTraceNativeExactFixture): PiMonoTraceNativeExactVerification {
  const issues: PiMonoTraceNativeExactIssue[] = []
  if (fixture.product !== "pi-mono") issues.push(issue("product", "Fixture must target pi-mono."))
  if (fixture.atomID !== piMonoTraceDebugSurfaceNativeExactAtomID) issues.push(issue("atom", "Fixture must cover pi.trace.debug-surface."))
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) issues.push(issue("native-claim", "Pi trace fixture must claim native exact parity."))
  if (fixture.knownLossiness.length !== 0 || fixture.descriptor.knownLossiness.length !== 0) issues.push(issue("lossiness", "Native Pi trace fixture must not carry bridge lossiness."))
  if (!fixture.sourceRefs.some((ref) => ref.includes("agent-session-runtime.ts")) || !fixture.sourceRefs.some((ref) => ref.includes("session-format.md"))) {
    issues.push(issue("source", "Fixture must cite both AgentSessionRuntime and session-format upstream anchors."))
  }
  const events = fixture.replay.records.map((record) => record.event)
  assertSubsequence(issues, events, ["session_before_switch", "session_shutdown", "session_start", "session_rebind"], "switch-order")
  assertSubsequence(issues, events, ["import_copy", "session_before_switch", "session_shutdown", "session_start", "jsonl_readback"], "import-order")
  assertSubsequence(issues, events, ["session_shutdown", "before_session_invalidate", "session_dispose"], "dispose-order")
  const cancelledIndex = fixture.replay.records.findIndex((record) => record.event === "session_before_switch" && record.targetSessionFile === "/repo/.pi/cancelled.jsonl")
  if (cancelledIndex < 0) {
    issues.push(issue("cancelled-before-switch", "Fixture lost cancelled before-switch record."))
  } else {
    const afterCancelled = fixture.replay.records.slice(cancelledIndex + 1)
    if (afterCancelled.some((record) => record.targetSessionFile === "/repo/.pi/cancelled.jsonl" && (record.event === "session_shutdown" || record.event === "session_start"))) {
      issues.push(issue("cancelled-short-circuit", "Cancelled before-switch must not shut down or start the target session."))
    }
  }
  const forkRecord = fixture.replay.records.find((record) => record.event === "session_before_fork")
  if (forkRecord?.selectedText !== "inspect trace") issues.push(issue("fork-selected-text", "Fork replay must extract text-only selectedText from the user message."))
  if (fixture.replay.jsonlReadbackRecords.length !== 4) issues.push(issue("jsonl-readback-count", "JSONL readback must preserve all four fixture lines."))
  if (fixture.replay.jsonlReadbackRecords.some((record) => record.redaction !== "none-upstream-jsonl-storage")) {
    issues.push(issue("jsonl-redaction-policy", "Pi session-format readback must preserve raw stored session content at this trace layer."))
  }
  const expectedFingerprint = fingerprintObject({ ...fixture, fingerprint: undefined })
  if (fixture.fingerprint !== expectedFingerprint) issues.push(issue("fingerprint", "Fixture fingerprint drifted."))
  return { ok: issues.length === 0, issues }
}

function runtimeRecord(
  event: PiMonoTraceRecordEvent,
  reason: PiMonoTraceRuntimeReason,
  details: Pick<PiMonoTraceDebugRecord, "targetSessionFile" | "previousSessionFile"> = {},
): Omit<PiMonoTraceDebugRecord, "sequence"> {
  return {
    event,
    source: "agent-session-runtime",
    reason,
    ...details,
    redaction: "not-applicable",
    flowProjection: "runtime-lifecycle",
  }
}

function extractPiMonoUserMessageText(message: unknown): string | undefined {
  if (!isRecord(message) || message.role !== "user") return undefined
  return extractPiMonoMessageContentText(message.content)
}

function extractPiMonoMessageContentText(content: unknown): string | undefined {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return undefined
  const text = content
    .filter((part): part is { type: string; text: string } => isRecord(part) && part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("")
  return text.length > 0 ? text : undefined
}

function traceCase(
  scenarioID: PiMonoTraceNativeScenarioID,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  upstreamBehavior: string,
): PiMonoTraceNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function assertSubsequence(
  issues: PiMonoTraceNativeExactIssue[],
  events: PiMonoTraceRecordEvent[],
  expected: PiMonoTraceRecordEvent[],
  id: string,
): void {
  let cursor = 0
  for (const event of events) {
    if (event === expected[cursor]) cursor++
    if (cursor === expected.length) return
  }
  issues.push(issue(id, `Replay events do not contain expected subsequence: ${expected.join(" -> ")}.`))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function issue(id: string, message: string): PiMonoTraceNativeExactIssue {
  return { id: `pi-trace-native-exact.${id}`, message }
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}
