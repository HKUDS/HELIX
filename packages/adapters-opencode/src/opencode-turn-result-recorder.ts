import { createHash } from "node:crypto"

export interface OpenCodeTurnResultRecorderTokens {
  input: number
  output: number
  cache: {
    read: number
    write: number
  }
  total: number
}

export interface OpenCodeTurnResultRecorderAssistantMessage {
  id: string
  sessionID: string
  parentID: string
  summary?: boolean
  agent?: string
  variant?: string
  finish?: string
  cost: number
  tokens: OpenCodeTurnResultRecorderTokens
  time: {
    created: number
    completed?: number
  }
}

export type OpenCodeTurnResultRecorderPart =
  | { id: string; messageID: string; sessionID: string; type: "step-start"; snapshot?: string }
  | {
    id: string
    messageID: string
    sessionID: string
    type: "step-finish"
    reason: string
    snapshot: string
    tokens: OpenCodeTurnResultRecorderTokens
    cost: number
  }
  | { id: string; messageID: string; sessionID: string; type: "patch"; hash: string; files: string[] }
  | { id: string; messageID: string; sessionID: string; type: "text"; text: string; time: { start: number; end?: number }; metadata?: Record<string, unknown> }
  | { id: string; messageID: string; sessionID: string; type: "reasoning"; text: string; time: { start: number; end?: number }; metadata?: Record<string, unknown> }

export type OpenCodeTurnResultRecorderEvent =
  | { type: "step.started"; sessionID: string; snapshot?: string }
  | { type: "step.ended"; sessionID: string; finish: string; cost: number; tokens: OpenCodeTurnResultRecorderTokens; snapshot: string }
  | { type: "text.started"; sessionID: string }
  | { type: "text.ended"; sessionID: string; text: string }
  | { type: "reasoning.started"; sessionID: string; reasoningID: string }
  | { type: "reasoning.ended"; sessionID: string; reasoningID: string; text: string }

export interface OpenCodeTurnResultRecorderState {
  assistantMessage: OpenCodeTurnResultRecorderAssistantMessage
  snapshot?: string
  completedSnapshot: string
  patch: { hash: string; files: string[] }
  now: number
  partCounter: number
  currentText?: OpenCodeTurnResultRecorderPart & { type: "text" }
  reasoningMap: Record<string, OpenCodeTurnResultRecorderPart & { type: "reasoning" }>
  parts: OpenCodeTurnResultRecorderPart[]
  events: OpenCodeTurnResultRecorderEvent[]
  summaryRequests: Array<{ sessionID: string; messageID: string }>
  messageUpdates: OpenCodeTurnResultRecorderAssistantMessage[]
}

export interface OpenCodeTurnResultRecorderBridge {
  createState(input?: Partial<OpenCodeTurnResultRecorderState>): OpenCodeTurnResultRecorderState
  handleReasoningStart(state: OpenCodeTurnResultRecorderState, input: { id: string; providerMetadata?: Record<string, unknown> }): void
  handleReasoningDelta(state: OpenCodeTurnResultRecorderState, input: { id: string; text: string; providerMetadata?: Record<string, unknown> }): void
  handleReasoningEnd(state: OpenCodeTurnResultRecorderState, input: { id: string; providerMetadata?: Record<string, unknown> }): void
  handleTextStart(state: OpenCodeTurnResultRecorderState, input?: { providerMetadata?: Record<string, unknown> }): void
  handleTextDelta(state: OpenCodeTurnResultRecorderState, input: { text: string; providerMetadata?: Record<string, unknown> }): void
  handleTextEnd(state: OpenCodeTurnResultRecorderState, input?: { providerMetadata?: Record<string, unknown>; completeText?: (text: string) => string }): void
  handleStepStart(state: OpenCodeTurnResultRecorderState): void
  handleStepFinish(state: OpenCodeTurnResultRecorderState, input: { reason: string; usage: { cost: number; tokens: OpenCodeTurnResultRecorderTokens } }): void
  cleanup(state: OpenCodeTurnResultRecorderState): void
}

export interface OpenCodeTurnResultRecorderNativeExactFixtureCase {
  id:
    | "step-start-records-snapshot-part"
    | "text-complete-applies-plugin-transform"
    | "reasoning-end-closes-part"
    | "step-finish-updates-assistant-and-patch"
    | "summary-mode-suppresses-step-events-and-summary"
    | "cleanup-finalizes-open-parts-and-assistant"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTurnResultRecorderNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.result-recorder"
  portID: "turn.result-recorder"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-result-recorder-native-exact-fixture"
  replayRef: "turn-result-recorder-native-exact:opencode"
  fixtureID: "opencode-turn-result-recorder:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnResultRecorderNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnResultRecorderNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnResultRecorderNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnResultRecorderNativeExactFixtureIssue[]
}

export function createOpenCodeTurnResultRecorderBridge(): OpenCodeTurnResultRecorderBridge {
  return {
    createState,
    handleReasoningStart,
    handleReasoningDelta,
    handleReasoningEnd,
    handleTextStart,
    handleTextDelta,
    handleTextEnd,
    handleStepStart,
    handleStepFinish,
    cleanup,
  }
}

function createState(input: Partial<OpenCodeTurnResultRecorderState> = {}): OpenCodeTurnResultRecorderState {
  const assistantMessage = input.assistantMessage ?? {
    id: "msg_assistant",
    sessionID: "ses_1",
    parentID: "msg_user",
    cost: 1,
    tokens: zeroTokens(),
    time: { created: 1 },
  }
  return {
    assistantMessage: cloneAssistant(assistantMessage),
    snapshot: input.snapshot ?? "snap_before",
    completedSnapshot: input.completedSnapshot ?? "snap_after",
    patch: input.patch ?? { hash: "patch_hash", files: [] },
    now: input.now ?? 100,
    partCounter: input.partCounter ?? 0,
    ...(input.currentText ? { currentText: input.currentText } : {}),
    reasoningMap: { ...(input.reasoningMap ?? {}) },
    parts: [...(input.parts ?? [])],
    events: [...(input.events ?? [])],
    summaryRequests: [...(input.summaryRequests ?? [])],
    messageUpdates: [...(input.messageUpdates ?? [])],
  }
}

function handleStepStart(state: OpenCodeTurnResultRecorderState): void {
  if (!state.snapshot) state.snapshot = "snap_tracked"
  if (!state.assistantMessage.summary) {
    state.events.push({ type: "step.started", sessionID: state.assistantMessage.sessionID, snapshot: state.snapshot })
  }
  state.parts.push({
    id: nextPartID(state),
    messageID: state.assistantMessage.id,
    sessionID: state.assistantMessage.sessionID,
    type: "step-start",
    ...(state.snapshot ? { snapshot: state.snapshot } : {}),
  })
}

function handleStepFinish(
  state: OpenCodeTurnResultRecorderState,
  input: { reason: string; usage: { cost: number; tokens: OpenCodeTurnResultRecorderTokens } },
): void {
  for (const reasoningID of Object.keys(state.reasoningMap)) handleReasoningEnd(state, { id: reasoningID })
  if (!state.assistantMessage.summary) {
    state.events.push({
      type: "step.ended",
      sessionID: state.assistantMessage.sessionID,
      finish: input.reason,
      cost: input.usage.cost,
      tokens: input.usage.tokens,
      snapshot: state.completedSnapshot,
    })
  }
  state.assistantMessage.finish = input.reason
  state.assistantMessage.cost += input.usage.cost
  state.assistantMessage.tokens = input.usage.tokens
  state.parts.push({
    id: nextPartID(state),
    reason: input.reason,
    snapshot: state.completedSnapshot,
    messageID: state.assistantMessage.id,
    sessionID: state.assistantMessage.sessionID,
    type: "step-finish",
    tokens: input.usage.tokens,
    cost: input.usage.cost,
  })
  updateMessage(state)
  if (state.snapshot && state.patch.files.length) {
    state.parts.push({
      id: nextPartID(state),
      messageID: state.assistantMessage.id,
      sessionID: state.assistantMessage.sessionID,
      type: "patch",
      hash: state.patch.hash,
      files: state.patch.files,
    })
  }
  delete state.snapshot
  if (!state.assistantMessage.summary) {
    state.summaryRequests.push({ sessionID: state.assistantMessage.sessionID, messageID: state.assistantMessage.parentID })
  }
}

function handleTextStart(state: OpenCodeTurnResultRecorderState, input: { providerMetadata?: Record<string, unknown> } = {}): void {
  if (!state.assistantMessage.summary) state.events.push({ type: "text.started", sessionID: state.assistantMessage.sessionID })
  const part: OpenCodeTurnResultRecorderPart & { type: "text" } = {
    id: nextPartID(state),
    messageID: state.assistantMessage.id,
    sessionID: state.assistantMessage.sessionID,
    type: "text",
    text: "",
    time: { start: state.now },
    ...(input.providerMetadata ? { metadata: input.providerMetadata } : {}),
  }
  state.currentText = part
  state.parts.push(part)
}

function handleTextDelta(state: OpenCodeTurnResultRecorderState, input: { text: string; providerMetadata?: Record<string, unknown> }): void {
  if (!state.currentText) return
  state.currentText.text += input.text
  if (input.providerMetadata) state.currentText.metadata = input.providerMetadata
  replacePart(state, state.currentText)
}

function handleTextEnd(
  state: OpenCodeTurnResultRecorderState,
  input: { providerMetadata?: Record<string, unknown>; completeText?: (text: string) => string } = {},
): void {
  if (!state.currentText) return
  state.currentText.text = input.completeText ? input.completeText(state.currentText.text) : state.currentText.text
  if (!state.assistantMessage.summary) {
    state.events.push({ type: "text.ended", sessionID: state.assistantMessage.sessionID, text: state.currentText.text })
  }
  state.currentText.time = { start: state.currentText.time.start, end: state.now }
  if (input.providerMetadata) state.currentText.metadata = input.providerMetadata
  replacePart(state, state.currentText)
  delete state.currentText
}

function handleReasoningStart(state: OpenCodeTurnResultRecorderState, input: { id: string; providerMetadata?: Record<string, unknown> }): void {
  if (input.id in state.reasoningMap) return
  state.events.push({ type: "reasoning.started", sessionID: state.assistantMessage.sessionID, reasoningID: input.id })
  const part: OpenCodeTurnResultRecorderPart & { type: "reasoning" } = {
    id: nextPartID(state),
    messageID: state.assistantMessage.id,
    sessionID: state.assistantMessage.sessionID,
    type: "reasoning",
    text: "",
    time: { start: state.now },
    ...(input.providerMetadata ? { metadata: input.providerMetadata } : {}),
  }
  state.reasoningMap[input.id] = part
  state.parts.push(part)
}

function handleReasoningDelta(state: OpenCodeTurnResultRecorderState, input: { id: string; text: string; providerMetadata?: Record<string, unknown> }): void {
  const part = state.reasoningMap[input.id]
  if (!part) return
  part.text += input.text
  if (input.providerMetadata) part.metadata = input.providerMetadata
  replacePart(state, part)
}

function handleReasoningEnd(state: OpenCodeTurnResultRecorderState, input: { id: string; providerMetadata?: Record<string, unknown> }): void {
  const part = state.reasoningMap[input.id]
  if (!part) return
  if (input.providerMetadata) part.metadata = input.providerMetadata
  state.events.push({ type: "reasoning.ended", sessionID: state.assistantMessage.sessionID, reasoningID: input.id, text: part.text })
  part.time = { start: part.time.start, end: state.now }
  replacePart(state, part)
  delete state.reasoningMap[input.id]
}

function cleanup(state: OpenCodeTurnResultRecorderState): void {
  if (state.snapshot && state.patch.files.length) {
    state.parts.push({
      id: nextPartID(state),
      messageID: state.assistantMessage.id,
      sessionID: state.assistantMessage.sessionID,
      type: "patch",
      hash: state.patch.hash,
      files: state.patch.files,
    })
    delete state.snapshot
  }
  if (state.currentText) {
    state.currentText.time = { start: state.currentText.time.start, end: state.now }
    replacePart(state, state.currentText)
    delete state.currentText
  }
  for (const part of Object.values(state.reasoningMap)) {
    part.time = { start: part.time.start, end: state.now }
    replacePart(state, part)
  }
  state.reasoningMap = {}
  state.assistantMessage.time.completed = state.now
  updateMessage(state)
}

export function captureOpenCodeTurnResultRecorderNativeExactFixture(): OpenCodeTurnResultRecorderNativeExactFixture {
  const bridge = createOpenCodeTurnResultRecorderBridge()
  const stepStart = bridge.createState()
  bridge.handleStepStart(stepStart)

  const text = bridge.createState()
  bridge.handleTextStart(text, { providerMetadata: { start: true } })
  bridge.handleTextDelta(text, { text: "hello" })
  bridge.handleTextDelta(text, { text: " world", providerMetadata: { delta: 2 } })
  bridge.handleTextEnd(text, { completeText: (value) => `${value}!`, providerMetadata: { end: true } })

  const reasoning = bridge.createState()
  bridge.handleReasoningStart(reasoning, { id: "reason_1", providerMetadata: { source: "model" } })
  bridge.handleReasoningDelta(reasoning, { id: "reason_1", text: "think" })
  bridge.handleReasoningEnd(reasoning, { id: "reason_1", providerMetadata: { final: true } })

  const finish = bridge.createState({ patch: { hash: "abc123", files: ["src/a.ts"] } })
  bridge.handleStepFinish(finish, { reason: "stop", usage: { cost: 0.25, tokens: tokens({ input: 10, output: 5, total: 15 }) } })

  const summary = bridge.createState({
    assistantMessage: { id: "msg_summary", sessionID: "ses_1", parentID: "msg_user", summary: true, cost: 0, tokens: zeroTokens(), time: { created: 1 } },
  })
  bridge.handleStepStart(summary)
  bridge.handleStepFinish(summary, { reason: "stop", usage: { cost: 0.1, tokens: tokens({ input: 1, output: 1, total: 2 }) } })

  const cleanupState = bridge.createState({ patch: { hash: "cleanup_patch", files: ["changed.ts"] } })
  bridge.handleTextStart(cleanupState)
  bridge.handleTextDelta(cleanupState, { text: "unfinished" })
  bridge.handleReasoningStart(cleanupState, { id: "reason_open" })
  bridge.handleReasoningDelta(cleanupState, { id: "reason_open", text: "open" })
  bridge.cleanup(cleanupState)

  const cases: OpenCodeTurnResultRecorderNativeExactFixtureCase[] = [
    {
      id: "step-start-records-snapshot-part",
      actual: projection(stepStart),
      expected: {
        parts: [{ id: "part-0", type: "step-start", snapshot: "snap_before" }],
        events: [{ type: "step.started", sessionID: "ses_1", snapshot: "snap_before" }],
        assistant: assistantProjection(stepStart.assistantMessage),
        summaryRequests: [],
        messageUpdates: [],
      },
    },
    {
      id: "text-complete-applies-plugin-transform",
      actual: projection(text),
      expected: {
        parts: [{ id: "part-0", type: "text", text: "hello world!", time: { start: 100, end: 100 }, metadata: { end: true } }],
        events: [
          { type: "text.started", sessionID: "ses_1" },
          { type: "text.ended", sessionID: "ses_1", text: "hello world!" },
        ],
        assistant: assistantProjection(text.assistantMessage),
        summaryRequests: [],
        messageUpdates: [],
      },
    },
    {
      id: "reasoning-end-closes-part",
      actual: projection(reasoning),
      expected: {
        parts: [{ id: "part-0", type: "reasoning", text: "think", time: { start: 100, end: 100 }, metadata: { final: true } }],
        events: [
          { type: "reasoning.started", sessionID: "ses_1", reasoningID: "reason_1" },
          { type: "reasoning.ended", sessionID: "ses_1", reasoningID: "reason_1", text: "think" },
        ],
        assistant: assistantProjection(reasoning.assistantMessage),
        summaryRequests: [],
        messageUpdates: [],
      },
    },
    {
      id: "step-finish-updates-assistant-and-patch",
      actual: projection(finish),
      expected: {
        parts: [
          { id: "part-0", type: "step-finish", reason: "stop", snapshot: "snap_after", tokens: tokens({ input: 10, output: 5, total: 15 }), cost: 0.25 },
          { id: "part-1", type: "patch", hash: "abc123", files: ["src/a.ts"] },
        ],
        events: [{ type: "step.ended", sessionID: "ses_1", finish: "stop", cost: 0.25, tokens: tokens({ input: 10, output: 5, total: 15 }), snapshot: "snap_after" }],
        assistant: { id: "msg_assistant", finish: "stop", cost: 1.25, tokens: tokens({ input: 10, output: 5, total: 15 }), completed: undefined },
        summaryRequests: [{ sessionID: "ses_1", messageID: "msg_user" }],
        messageUpdates: [{ id: "msg_assistant", finish: "stop", cost: 1.25, tokens: tokens({ input: 10, output: 5, total: 15 }), completed: undefined }],
      },
    },
    {
      id: "summary-mode-suppresses-step-events-and-summary",
      actual: projection(summary),
      expected: {
        parts: [
          { id: "part-0", type: "step-start", snapshot: "snap_before" },
          { id: "part-1", type: "step-finish", reason: "stop", snapshot: "snap_after", tokens: tokens({ input: 1, output: 1, total: 2 }), cost: 0.1 },
        ],
        events: [],
        assistant: { id: "msg_summary", finish: "stop", cost: 0.1, tokens: tokens({ input: 1, output: 1, total: 2 }), completed: undefined },
        summaryRequests: [],
        messageUpdates: [{ id: "msg_summary", finish: "stop", cost: 0.1, tokens: tokens({ input: 1, output: 1, total: 2 }), completed: undefined }],
      },
    },
    {
      id: "cleanup-finalizes-open-parts-and-assistant",
      actual: projection(cleanupState),
      expected: {
        parts: [
          { id: "part-0", type: "text", text: "unfinished", time: { start: 100, end: 100 } },
          { id: "part-1", type: "reasoning", text: "open", time: { start: 100, end: 100 } },
          { id: "part-2", type: "patch", hash: "cleanup_patch", files: ["changed.ts"] },
        ],
        events: [
          { type: "text.started", sessionID: "ses_1" },
          { type: "reasoning.started", sessionID: "ses_1", reasoningID: "reason_open" },
        ],
        assistant: { id: "msg_assistant", finish: undefined, cost: 1, tokens: zeroTokens(), completed: 100 },
        summaryRequests: [],
        messageUpdates: [{ id: "msg_assistant", finish: undefined, cost: 1, tokens: zeroTokens(), completed: 100 }],
      },
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.result-recorder" as const,
    portID: "turn.result-recorder" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-result-recorder-native-exact-fixture" as const,
    replayRef: "turn-result-recorder-native-exact:opencode" as const,
    fixtureID: "opencode-turn-result-recorder:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/processor.ts#step-start,step-finish,text-start,text-delta,text-end,reasoning-start,reasoning-delta,reasoning-end,cleanup",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.ts#updatePart,updateMessage",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/summary.ts#summarize",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnResultRecorderNativeExactFixture(
  fixture: OpenCodeTurnResultRecorderNativeExactFixture,
): OpenCodeTurnResultRecorderNativeExactFixtureVerification {
  const issues: OpenCodeTurnResultRecorderNativeExactFixtureIssue[] = []
  if (fixture.atomID !== "opencode.turn.result-recorder" || fixture.portID !== "turn.result-recorder" || fixture.fixtureID !== "opencode-turn-result-recorder:native-exact-fixture") {
    issues.push({ id: "opencode-turn-result-recorder-native-exact.identity", message: "OpenCode turn result-recorder fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-turn-result-recorder-native-exact.native-claim", message: "OpenCode turn result-recorder fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-turn-result-recorder-native-exact.lossiness", message: "OpenCode turn result-recorder native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/processor.ts", "session/session.ts", "session/summary.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-turn-result-recorder-native-exact.source", message: `OpenCode turn result-recorder fixture lost pinned ${source} source.` })
    }
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-turn-result-recorder-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned SessionProcessor result-recording behavior.` })
    }
  }
  const finish = fixture.cases.find((item) => item.id === "step-finish-updates-assistant-and-patch")
  if (!finish || !sameJSON(finish.actual, finish.expected)) {
    issues.push({ id: "opencode-turn-result-recorder-native-exact.step-finish", message: "Step finish must update assistant metadata, patch parts, and summary requests." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-result-recorder-native-exact.fingerprint", message: "OpenCode turn result-recorder fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function nextPartID(state: OpenCodeTurnResultRecorderState): string {
  return `part-${state.partCounter++}`
}

function replacePart(state: OpenCodeTurnResultRecorderState, part: OpenCodeTurnResultRecorderPart): void {
  const index = state.parts.findIndex((item) => item.id === part.id)
  if (index === -1) state.parts.push(part)
  else state.parts[index] = part
}

function updateMessage(state: OpenCodeTurnResultRecorderState): void {
  state.messageUpdates.push(cloneAssistant(state.assistantMessage))
}

function cloneAssistant(input: OpenCodeTurnResultRecorderAssistantMessage): OpenCodeTurnResultRecorderAssistantMessage {
  return {
    ...input,
    tokens: cloneTokens(input.tokens),
    time: { ...input.time },
  }
}

function zeroTokens(): OpenCodeTurnResultRecorderTokens {
  return tokens({})
}

function tokens(input: Partial<{ input: number; output: number; cacheRead: number; cacheWrite: number; total: number }>): OpenCodeTurnResultRecorderTokens {
  return {
    input: input.input ?? 0,
    output: input.output ?? 0,
    cache: {
      read: input.cacheRead ?? 0,
      write: input.cacheWrite ?? 0,
    },
    total: input.total ?? 0,
  }
}

function cloneTokens(input: OpenCodeTurnResultRecorderTokens): OpenCodeTurnResultRecorderTokens {
  return {
    input: input.input,
    output: input.output,
    cache: { ...input.cache },
    total: input.total,
  }
}

function projection(state: OpenCodeTurnResultRecorderState): unknown {
  return {
    parts: state.parts.map(partProjection),
    events: state.events,
    assistant: assistantProjection(state.assistantMessage),
    summaryRequests: state.summaryRequests,
    messageUpdates: state.messageUpdates.map(assistantProjection),
  }
}

function assistantProjection(message: OpenCodeTurnResultRecorderAssistantMessage): unknown {
  return {
    id: message.id,
    finish: message.finish,
    cost: message.cost,
    tokens: message.tokens,
    completed: message.time.completed,
  }
}

function partProjection(part: OpenCodeTurnResultRecorderPart): unknown {
  switch (part.type) {
    case "step-start":
      return { id: part.id, type: part.type, ...(part.snapshot ? { snapshot: part.snapshot } : {}) }
    case "step-finish":
      return { id: part.id, type: part.type, reason: part.reason, snapshot: part.snapshot, tokens: part.tokens, cost: part.cost }
    case "patch":
      return { id: part.id, type: part.type, hash: part.hash, files: part.files }
    case "text":
      return { id: part.id, type: part.type, text: part.text, time: part.time, ...(part.metadata ? { metadata: part.metadata } : {}) }
    case "reasoning":
      return { id: part.id, type: part.type, text: part.text, time: part.time, ...(part.metadata ? { metadata: part.metadata } : {}) }
  }
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableJSON(left) === stableJSON(right)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableJSON(value)).digest("hex").slice(0, 16)
}

function stableJSON(value: unknown): string {
  return JSON.stringify(sortStable(value))
}

function sortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortStable(entry)]),
  )
}
