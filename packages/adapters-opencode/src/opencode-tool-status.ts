import { createHash } from "node:crypto"

export type OpenCodeToolStatus = "pending" | "running" | "completed" | "error"

export type OpenCodeToolStatusMetadata = Record<string, unknown>

export interface OpenCodeToolStatusFilePart {
  id?: string
  sessionID?: string
  messageID?: string
  type: "file"
  mime: string
  filename?: string
  url: string
  source?: unknown
}

export interface OpenCodeToolStatusPendingState {
  status: "pending"
  input: Record<string, unknown>
  raw: string
}

export interface OpenCodeToolStatusRunningState {
  status: "running"
  input: Record<string, unknown>
  title?: string
  metadata?: OpenCodeToolStatusMetadata
  time: {
    start: number
  }
}

export interface OpenCodeToolStatusCompletedState {
  status: "completed"
  input: Record<string, unknown>
  output: string
  title: string
  metadata: OpenCodeToolStatusMetadata
  time: {
    start: number
    end: number
    compacted?: number
  }
  attachments?: OpenCodeToolStatusFilePart[]
}

export interface OpenCodeToolStatusErrorState {
  status: "error"
  input: Record<string, unknown>
  error: string
  metadata?: OpenCodeToolStatusMetadata
  time: {
    start: number
    end: number
  }
}

export type OpenCodeToolStatusState =
  | OpenCodeToolStatusPendingState
  | OpenCodeToolStatusRunningState
  | OpenCodeToolStatusCompletedState
  | OpenCodeToolStatusErrorState

export interface OpenCodeToolStatusPart {
  id: string
  messageID: string
  sessionID: string
  type: "tool"
  callID: string
  tool: string
  state: OpenCodeToolStatusState
  metadata?: OpenCodeToolStatusMetadata
}

export interface OpenCodeToolStatusBridgeInput {
  id: string
  name: string
  messageID: string
  sessionID: string
  providerExecuted?: boolean
}

export interface OpenCodeToolCallInput {
  name: string
  input: unknown
  providerMetadata?: OpenCodeToolStatusMetadata
}

export interface OpenCodeToolMetadataInput {
  args: Record<string, unknown>
  title?: string
  metadata?: OpenCodeToolStatusMetadata
}

export interface OpenCodeToolCompletionInput {
  title: string
  metadata: OpenCodeToolStatusMetadata
  output: string
  attachments?: OpenCodeToolStatusFilePart[]
}

export interface OpenCodeToolStatusBridge {
  ensureToolCall(input: OpenCodeToolStatusBridgeInput): OpenCodeToolStatusPart
  applyToolCall(part: OpenCodeToolStatusPart, input: OpenCodeToolCallInput): OpenCodeToolStatusPart
  applyMetadata(part: OpenCodeToolStatusPart, input: OpenCodeToolMetadataInput): OpenCodeToolStatusPart
  completeToolCall(part: OpenCodeToolStatusPart, output: OpenCodeToolCompletionInput): OpenCodeToolStatusPart
  failToolCall(part: OpenCodeToolStatusPart, error: unknown): OpenCodeToolStatusPart
}

export interface OpenCodeToolStatusBridgeOptions {
  now?: () => number
  partID?: () => string
}

export interface OpenCodeToolStatusNativeExactFixtureCase {
  id:
    | "ensure-pending-provider-executed"
    | "tool-call-running-provider-metadata"
    | "metadata-promotes-pending-to-running"
    | "complete-running-tool-call"
    | "fail-running-tool-call"
    | "ignore-terminal-update"
  actual: OpenCodeToolStatusPart
  expected: OpenCodeToolStatusPart
}

export interface OpenCodeToolStatusNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.tool.status-bridge"
  portID: "tool.audit-log"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-tool-status-native-exact-fixture"
  replayRef: "tool-status-native-exact:opencode"
  fixtureID: "opencode-tool-status:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeToolStatusNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeToolStatusNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeToolStatusNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeToolStatusNativeExactFixtureIssue[]
}

export function createOpenCodeToolStatusBridge(options: OpenCodeToolStatusBridgeOptions = {}): OpenCodeToolStatusBridge {
  const now = options.now ?? Date.now
  const partID = options.partID ?? (() => `part_${now()}`)
  return {
    ensureToolCall(input) {
      return openCodeToolStatusEnsureToolCall(input, partID())
    },
    applyToolCall(part, input) {
      return openCodeToolStatusApplyToolCall(part, input, now())
    },
    applyMetadata(part, input) {
      return openCodeToolStatusApplyMetadata(part, input, now())
    },
    completeToolCall(part, output) {
      return openCodeToolStatusCompleteToolCall(part, output, now())
    },
    failToolCall(part, error) {
      return openCodeToolStatusFailToolCall(part, error, now())
    },
  }
}

export function openCodeToolStatusEnsureToolCall(input: OpenCodeToolStatusBridgeInput, partID: string): OpenCodeToolStatusPart {
  return {
    id: partID,
    messageID: input.messageID,
    sessionID: input.sessionID,
    type: "tool",
    tool: input.name,
    callID: input.id,
    state: { status: "pending", input: {}, raw: "" },
    ...(input.providerExecuted ? { metadata: { providerExecuted: true } } : {}),
  }
}

export function openCodeToolStatusApplyToolCall(
  part: OpenCodeToolStatusPart,
  input: OpenCodeToolCallInput,
  now: number,
): OpenCodeToolStatusPart {
  const toolInput = openCodeToolStatusToolInput(input.input)
  return {
    ...part,
    tool: input.name,
    state: part.state.status === "running"
      ? { ...part.state, input: toolInput }
      : { status: "running", input: toolInput, time: { start: now } },
    ...openCodeToolStatusOptionalMetadata(
      part.metadata?.["providerExecuted"] === true
        ? { ...(input.providerMetadata ?? {}), providerExecuted: true }
        : input.providerMetadata,
    ),
  }
}

export function openCodeToolStatusApplyMetadata(
  part: OpenCodeToolStatusPart,
  input: OpenCodeToolMetadataInput,
  now: number,
): OpenCodeToolStatusPart {
  if (part.state.status !== "running" && part.state.status !== "pending") return part
  return {
    ...part,
    state: {
      status: "running",
      ...openCodeToolStatusOptionalTitle(input.title),
      ...openCodeToolStatusOptionalStateMetadata(input.metadata),
      input: input.args,
      time: { start: now },
    },
  }
}

export function openCodeToolStatusCompleteToolCall(
  part: OpenCodeToolStatusPart,
  output: OpenCodeToolCompletionInput,
  now: number,
): OpenCodeToolStatusPart {
  if (part.state.status !== "running") return part
  return {
    ...part,
    state: {
      status: "completed",
      input: part.state.input,
      output: output.output,
      metadata: output.metadata,
      title: output.title,
      time: { start: part.state.time.start, end: now },
      ...(output.attachments === undefined ? {} : { attachments: output.attachments }),
    },
  }
}

export function openCodeToolStatusFailToolCall(part: OpenCodeToolStatusPart, error: unknown, now: number): OpenCodeToolStatusPart {
  if (part.state.status !== "running") return part
  return {
    ...part,
    state: {
      status: "error",
      input: part.state.input,
      error: openCodeToolStatusErrorMessage(error),
      time: { start: part.state.time.start, end: now },
    },
  }
}

export function openCodeToolStatusErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message) return error.message
    if (error.name) return error.name
  }
  const record = openCodeToolStatusRecord(error)
  if (record && typeof record["message"] === "string" && record["message"]) return record["message"]
  const data = openCodeToolStatusRecord(record?.["data"])
  if (data && typeof data["message"] === "string" && data["message"]) return data["message"]
  const text = String(error)
  if (text && text !== "[object Object]") return text
  const formatted = openCodeToolStatusErrorFormat(error)
  return formatted || "unknown error"
}

export function captureOpenCodeToolStatusNativeExactFixture(): OpenCodeToolStatusNativeExactFixture {
  const bridge = createOpenCodeToolStatusBridge({
    now: openCodeToolStatusSequence([100, 110, 120, 130, 140]),
    partID: openCodeToolStatusSequence(["part_tool_001", "part_tool_002", "part_tool_003"]),
  })
  const pending = bridge.ensureToolCall({
    id: "call_001",
    name: "bash",
    messageID: "msg_001",
    sessionID: "ses_001",
    providerExecuted: true,
  })
  const running = bridge.applyToolCall(pending, {
    name: "bash",
    input: { cmd: "pwd" },
    providerMetadata: { provider: "openai" },
  })
  const metadataRunning = bridge.applyMetadata(
    bridge.ensureToolCall({ id: "call_002", name: "read", messageID: "msg_001", sessionID: "ses_001" }),
    { args: { filePath: "README.md" }, title: "Read README", metadata: { bytes: 42 } },
  )
  const completed = bridge.completeToolCall(running, {
    title: "pwd",
    metadata: { exitCode: 0 },
    output: "/workspace\n",
    attachments: [{ type: "file", mime: "text/plain", filename: "pwd.txt", url: "file:///tmp/pwd.txt" }],
  })
  const failed = bridge.failToolCall(
    bridge.applyToolCall(
      bridge.ensureToolCall({ id: "call_003", name: "edit", messageID: "msg_001", sessionID: "ses_001" }),
      { name: "edit", input: "bad-input" },
    ),
    { data: { message: "edit failed" } },
  )
  const ignored = bridge.completeToolCall(pending, { title: "ignored", metadata: {}, output: "ignored" })
  const cases: OpenCodeToolStatusNativeExactFixtureCase[] = [
    {
      id: "ensure-pending-provider-executed",
      actual: pending,
      expected: {
        id: "part_tool_001",
        messageID: "msg_001",
        sessionID: "ses_001",
        type: "tool",
        tool: "bash",
        callID: "call_001",
        state: { status: "pending", input: {}, raw: "" },
        metadata: { providerExecuted: true },
      },
    },
    {
      id: "tool-call-running-provider-metadata",
      actual: running,
      expected: {
        id: "part_tool_001",
        messageID: "msg_001",
        sessionID: "ses_001",
        type: "tool",
        tool: "bash",
        callID: "call_001",
        state: { status: "running", input: { cmd: "pwd" }, time: { start: 100 } },
        metadata: { provider: "openai", providerExecuted: true },
      },
    },
    {
      id: "metadata-promotes-pending-to-running",
      actual: metadataRunning,
      expected: {
        id: "part_tool_002",
        messageID: "msg_001",
        sessionID: "ses_001",
        type: "tool",
        tool: "read",
        callID: "call_002",
        state: { status: "running", title: "Read README", metadata: { bytes: 42 }, input: { filePath: "README.md" }, time: { start: 110 } },
      },
    },
    {
      id: "complete-running-tool-call",
      actual: completed,
      expected: {
        id: "part_tool_001",
        messageID: "msg_001",
        sessionID: "ses_001",
        type: "tool",
        tool: "bash",
        callID: "call_001",
        state: {
          status: "completed",
          input: { cmd: "pwd" },
          output: "/workspace\n",
          title: "pwd",
          metadata: { exitCode: 0 },
          time: { start: 100, end: 120 },
          attachments: [{ type: "file", mime: "text/plain", filename: "pwd.txt", url: "file:///tmp/pwd.txt" }],
        },
        metadata: { provider: "openai", providerExecuted: true },
      },
    },
    {
      id: "fail-running-tool-call",
      actual: failed,
      expected: {
        id: "part_tool_003",
        messageID: "msg_001",
        sessionID: "ses_001",
        type: "tool",
        tool: "edit",
        callID: "call_003",
        state: { status: "error", input: { value: "bad-input" }, error: "edit failed", time: { start: 130, end: 140 } },
      },
    },
    {
      id: "ignore-terminal-update",
      actual: ignored,
      expected: pending,
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.tool.status-bridge" as const,
    portID: "tool.audit-log" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-tool-status-native-exact-fixture" as const,
    replayRef: "tool-status-native-exact:opencode" as const,
    fixtureID: "opencode-tool-status:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/tools.ts#context.metadata,execute",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/processor.ts#ensureToolCall,updateToolCall,completeToolCall,failToolCall,toolInput",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#ToolPart,ToolStatePending,ToolStateRunning,ToolStateCompleted,ToolStateError",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/util/error.ts#errorMessage",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeToolStatusFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeToolStatusNativeExactFixture(
  fixture: OpenCodeToolStatusNativeExactFixture,
): OpenCodeToolStatusNativeExactFixtureVerification {
  const issues: OpenCodeToolStatusNativeExactFixtureIssue[] = []
  if (
    fixture.atomID !== "opencode.tool.status-bridge" ||
    fixture.portID !== "tool.audit-log" ||
    fixture.fixtureID !== "opencode-tool-status:native-exact-fixture"
  ) {
    issues.push({ id: "opencode-tool-status-native-exact.identity", message: "OpenCode tool status native fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-tool-status-native-exact.native-claim", message: "OpenCode tool status fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-tool-status-native-exact.lossiness", message: "OpenCode tool status native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/tools.ts", "session/processor.ts", "session/message-v2.ts", "util/error.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-tool-status-native-exact.source", message: `OpenCode tool status fixture lost upstream source ${source}.` })
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeToolStatusSameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-tool-status-native-exact.case", caseID: item.id, message: `${item.id} no longer matches the pinned status transition.` })
    }
  }
  if (openCodeToolStatusErrorMessage(new Error("")) !== "Error") {
    issues.push({ id: "opencode-tool-status-native-exact.error-name", message: "Error instances without messages must fall back to the error name." })
  }
  if (openCodeToolStatusErrorMessage({}) !== "Error (no message)") {
    issues.push({ id: "opencode-tool-status-native-exact.error-format", message: "Plain object error fallback must match upstream JSON formatting." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeToolStatusFingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-tool-status-native-exact.fingerprint", message: "OpenCode tool status native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function openCodeToolStatusToolInput(value: unknown): Record<string, unknown> {
  const record = openCodeToolStatusRecord(value)
  return record ? record : { value }
}

function openCodeToolStatusOptionalMetadata(metadata: OpenCodeToolStatusMetadata | undefined): { metadata?: OpenCodeToolStatusMetadata } {
  return metadata === undefined ? {} : { metadata }
}

function openCodeToolStatusOptionalStateMetadata(metadata: OpenCodeToolStatusMetadata | undefined): { metadata?: OpenCodeToolStatusMetadata } {
  return metadata === undefined ? {} : { metadata }
}

function openCodeToolStatusOptionalTitle(title: string | undefined): { title?: string } {
  return title === undefined ? {} : { title }
}

function openCodeToolStatusRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function openCodeToolStatusErrorFormat(error: unknown): string {
  if (error instanceof Error) return error.stack ?? `${error.name}: ${error.message}`
  const record = openCodeToolStatusRecord(error)
  if (!record) return String(error)
  try {
    const json = JSON.stringify(error, null, 2)
    if (json === "{}") {
      const text = String(error)
      if (text && text !== "[object Object]") return text
      const ctor = record.constructor?.name
      const prefix = ctor && ctor !== "Object" ? ctor : "Error"
      const names = Object.getOwnPropertyNames(error)
      return names.length === 0 ? `${prefix} (no message)` : `${prefix} { ${names.join(", ")} }`
    }
    return json
  } catch {
    return "Unexpected error (unserializable)"
  }
}

function openCodeToolStatusSequence<T>(values: T[]): () => T {
  let index = 0
  return () => {
    const value = values[index] ?? values[values.length - 1]
    index += 1
    return value as T
  }
}

function openCodeToolStatusSameJSON(left: unknown, right: unknown): boolean {
  return openCodeToolStatusStableJSON(left) === openCodeToolStatusStableJSON(right)
}

function openCodeToolStatusFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeToolStatusStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeToolStatusStableJSON(value: unknown): string {
  return JSON.stringify(openCodeToolStatusSortStable(value))
}

function openCodeToolStatusSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeToolStatusSortStable)
  const record = openCodeToolStatusRecord(value)
  if (!record) return value
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, openCodeToolStatusSortStable(entry)]))
}
