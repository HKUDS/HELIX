import { createHash } from "node:crypto"

export type OpenCodeTurnToolPartState =
  | { status: "pending"; input: Record<string, unknown>; raw: "" }
  | { status: "running"; input: Record<string, unknown>; time: { start: number } }
  | {
    status: "completed"
    input: Record<string, unknown>
    output: string
    metadata: Record<string, unknown>
    title: string
    time: { start: number; end: number }
    attachments?: OpenCodeTurnToolFilePart[]
  }
  | { status: "error"; input: Record<string, unknown>; error: string; time: { start: number; end: number } }

export interface OpenCodeTurnToolFilePart {
  type: "file"
  mime: string
  url: string
  filename?: string
}

export interface OpenCodeTurnToolPart {
  id: string
  messageID: string
  sessionID: string
  type: "tool"
  tool: string
  callID: string
  state: OpenCodeTurnToolPartState
  metadata?: Record<string, unknown>
}

export interface OpenCodeTurnToolCall {
  partID: string
  messageID: string
  sessionID: string
  inputEnded: boolean
}

export interface OpenCodeTurnToolLoopState {
  assistantMessage: {
    id: string
    sessionID: string
    summary?: boolean
    agent?: string
  }
  shouldBreak: boolean
  blocked: boolean
  now: number
  partCounter: number
  toolcalls: Record<string, OpenCodeTurnToolCall>
  parts: OpenCodeTurnToolPart[]
  recentParts: OpenCodeTurnToolPart[]
  events: OpenCodeTurnToolLoopEvent[]
  permissionAsks: OpenCodeTurnToolLoopPermissionAsk[]
  settled: string[]
}

export type OpenCodeTurnToolPlannerEvent =
  | { type: "tool-input-start"; id: string; name: string; providerExecuted?: boolean }
  | { type: "tool-input-delta"; id: string; delta?: string }
  | { type: "tool-input-end"; id: string; name: string; providerMetadata?: Record<string, unknown>; providerExecuted?: boolean }
  | { type: "tool-call"; id: string; name: string; input: unknown; providerMetadata?: Record<string, unknown>; providerExecuted?: boolean }

export type OpenCodeTurnToolExecutorEvent =
  | {
    type: "tool-result"
    id: string
    name: string
    result: { type: "json" | "text" | "error" | "content"; value: unknown }
    providerExecuted?: boolean
  }
  | { type: "tool-error"; id: string; name?: string; message: string; error?: unknown }

export type OpenCodeTurnToolLoopEvent =
  | { type: "tool.input.started"; callID: string; name: string }
  | { type: "tool.input.ended"; callID: string; text: "" }
  | { type: "tool.called"; callID: string; tool: string; input: Record<string, unknown>; provider: { executed: boolean; metadata?: Record<string, unknown> } }
  | { type: "tool.success"; callID: string; structured: Record<string, unknown>; content: Array<{ type: "text"; text: string } | { type: "file"; uri: string; mime: string; name?: string }>; provider: { executed: boolean } }
  | { type: "tool.failed"; callID: string; error: { type: "unknown"; message: string }; provider: { executed: boolean } }

export interface OpenCodeTurnToolLoopPermissionAsk {
  permission: "doom_loop"
  patterns: string[]
  metadata: { tool: string; input: Record<string, unknown> }
  always: string[]
}

export interface OpenCodeTurnToolLoopBridge {
  createState(input?: Partial<OpenCodeTurnToolLoopState>): OpenCodeTurnToolLoopState
  handlePlannerEvent(state: OpenCodeTurnToolLoopState, event: OpenCodeTurnToolPlannerEvent): OpenCodeTurnToolLoopState
  handleExecutorEvent(state: OpenCodeTurnToolLoopState, event: OpenCodeTurnToolExecutorEvent): OpenCodeTurnToolLoopState
}

export interface OpenCodeTurnToolCallPlannerNativeExactFixtureCase {
  id:
    | "input-start-creates-pending-tool"
    | "input-end-marks-call"
    | "tool-call-starts-running-state"
    | "tool-call-wraps-non-record-input"
    | "doom-loop-asks-permission"
    | "summary-mode-rejects-tool-call"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTurnToolExecutorNativeExactFixtureCase {
  id:
    | "structured-tool-result-completes-running-call"
    | "json-result-falls-back-to-tool-name"
    | "tool-error-blocks-when-user-rejected"
    | "tool-result-ignored-without-running-call"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTurnToolCallPlannerNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.tool-call-planner"
  portID: "turn.tool-call-planner"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-tool-call-planner-native-exact-fixture"
  replayRef: "turn-tool-call-planner-native-exact:opencode"
  fixtureID: "opencode-turn-tool-call-planner:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnToolCallPlannerNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnToolExecutorNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.tool-executor"
  portID: "turn.tool-executor"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-tool-executor-native-exact-fixture"
  replayRef: "turn-tool-executor-native-exact:opencode"
  fixtureID: "opencode-turn-tool-executor:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnToolExecutorNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnToolLoopNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnToolLoopNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnToolLoopNativeExactFixtureIssue[]
}

const DOOM_LOOP_THRESHOLD = 3

export function createOpenCodeTurnToolLoopBridge(): OpenCodeTurnToolLoopBridge {
  return {
    createState,
    handlePlannerEvent: handleOpenCodeTurnToolPlannerEvent,
    handleExecutorEvent: handleOpenCodeTurnToolExecutorEvent,
  }
}

function createState(input: Partial<OpenCodeTurnToolLoopState> = {}): OpenCodeTurnToolLoopState {
  return {
    assistantMessage: { id: "msg_assistant", sessionID: "ses_1", ...input.assistantMessage },
    shouldBreak: input.shouldBreak ?? true,
    blocked: input.blocked ?? false,
    now: input.now ?? 100,
    partCounter: input.partCounter ?? 0,
    toolcalls: { ...(input.toolcalls ?? {}) },
    parts: [...(input.parts ?? [])],
    recentParts: [...(input.recentParts ?? [])],
    events: [...(input.events ?? [])],
    permissionAsks: [...(input.permissionAsks ?? [])],
    settled: [...(input.settled ?? [])],
  }
}

export function handleOpenCodeTurnToolPlannerEvent(
  state: OpenCodeTurnToolLoopState,
  event: OpenCodeTurnToolPlannerEvent,
): OpenCodeTurnToolLoopState {
  switch (event.type) {
    case "tool-input-start":
      assertToolAllowed(state, event.name)
      ensureToolCall(state, event)
      return state

    case "tool-input-delta":
      return state

    case "tool-input-end": {
      const toolCall = ensureToolCall(state, event)
      state.events.push({ type: "tool.input.ended", callID: event.id, text: "" })
      state.toolcalls[event.id] = { ...toolCall.call, inputEnded: true }
      return state
    }

    case "tool-call": {
      assertToolAllowed(state, event.name)
      const toolCall = ensureToolCall(state, event)
      const input = toolInput(event.input)
      if (!toolCall.call.inputEnded) state.events.push({ type: "tool.input.ended", callID: event.id, text: "" })
      state.events.push({
        type: "tool.called",
        callID: event.id,
        tool: event.name,
        input,
        provider: {
          executed: toolCall.part.metadata?.providerExecuted === true,
          ...(event.providerMetadata ? { metadata: event.providerMetadata } : {}),
        },
      })
      updateToolCall(state, event.id, (part) => {
        const metadata = part.metadata?.providerExecuted
          ? { ...(event.providerMetadata ?? {}), providerExecuted: true }
          : event.providerMetadata
        return {
          ...part,
          tool: event.name,
          state:
            part.state.status === "running"
              ? { ...part.state, input }
              : { status: "running", input, time: { start: state.now } },
          ...(metadata ? { metadata } : {}),
        }
      })
      maybeAskDoomLoop(state, event.name, input)
      return state
    }
  }
}

export function handleOpenCodeTurnToolExecutorEvent(
  state: OpenCodeTurnToolLoopState,
  event: OpenCodeTurnToolExecutorEvent,
): OpenCodeTurnToolLoopState {
  switch (event.type) {
    case "tool-result": {
      const toolCall = readToolCall(state, event.id)
      const output = toolResultOutput(event)
      state.events.push({
        type: "tool.success",
        callID: event.id,
        structured: output.metadata,
        content: [
          { type: "text", text: output.output },
          ...(output.attachments?.map((item) => ({
            type: "file" as const,
            uri: item.url,
            mime: item.mime,
            ...(item.filename ? { name: item.filename } : {}),
          })) ?? []),
        ],
        provider: { executed: event.providerExecuted === true || toolCall?.part.metadata?.providerExecuted === true },
      })
      completeToolCall(state, event.id, output)
      return state
    }

    case "tool-error": {
      const toolCall = readToolCall(state, event.id)
      state.events.push({
        type: "tool.failed",
        callID: event.id,
        error: { type: "unknown", message: event.message },
        provider: { executed: toolCall?.part.metadata?.providerExecuted === true },
      })
      failToolCall(state, event.id, event.error ?? new Error(event.message))
      return state
    }
  }
}

export function captureOpenCodeTurnToolCallPlannerNativeExactFixture(): OpenCodeTurnToolCallPlannerNativeExactFixture {
  const bridge = createOpenCodeTurnToolLoopBridge()
  const startState = bridge.createState()
  bridge.handlePlannerEvent(startState, { type: "tool-input-start", id: "call_1", name: "bash", providerExecuted: true })

  const inputEndState = bridge.createState()
  bridge.handlePlannerEvent(inputEndState, { type: "tool-input-end", id: "call_2", name: "read" })

  const callState = bridge.createState()
  bridge.handlePlannerEvent(callState, { type: "tool-input-start", id: "call_3", name: "write" })
  bridge.handlePlannerEvent(callState, { type: "tool-call", id: "call_3", name: "write", input: { file: "a.ts" }, providerMetadata: { openai: { item: "1" } } })

  const wrappedState = bridge.createState()
  bridge.handlePlannerEvent(wrappedState, { type: "tool-call", id: "call_4", name: "echo", input: "hello" })

  const doomState = bridge.createState({
    recentParts: [
      runningPart("old_1", "bash", { cmd: "npm test" }),
      runningPart("old_2", "bash", { cmd: "npm test" }),
      runningPart("old_3", "bash", { cmd: "npm test" }),
    ],
  })
  bridge.handlePlannerEvent(doomState, { type: "tool-call", id: "call_5", name: "bash", input: { cmd: "npm test" } })

  let summaryError = ""
  try {
    bridge.handlePlannerEvent(bridge.createState({ assistantMessage: { id: "msg_summary", sessionID: "ses_1", summary: true } }), {
      type: "tool-call",
      id: "call_summary",
      name: "bash",
      input: {},
    })
  } catch (error) {
    summaryError = error instanceof Error ? error.message : String(error)
  }

  const cases: OpenCodeTurnToolCallPlannerNativeExactFixtureCase[] = [
    {
      id: "input-start-creates-pending-tool",
      actual: plannerProjection(startState),
      expected: {
        parts: [
          {
            id: "part-0",
            callID: "call_1",
            tool: "bash",
            state: { status: "pending", input: {}, raw: "" },
            metadata: { providerExecuted: true },
          },
        ],
        events: [{ type: "tool.input.started", callID: "call_1", name: "bash" }],
        toolcalls: { call_1: { inputEnded: false, partID: "part-0" } },
        permissionAsks: [],
      },
    },
    {
      id: "input-end-marks-call",
      actual: plannerProjection(inputEndState),
      expected: {
        parts: [
          {
            id: "part-0",
            callID: "call_2",
            tool: "read",
            state: { status: "pending", input: {}, raw: "" },
          },
        ],
        events: [
          { type: "tool.input.started", callID: "call_2", name: "read" },
          { type: "tool.input.ended", callID: "call_2", text: "" },
        ],
        toolcalls: { call_2: { inputEnded: true, partID: "part-0" } },
        permissionAsks: [],
      },
    },
    {
      id: "tool-call-starts-running-state",
      actual: plannerProjection(callState),
      expected: {
        parts: [
          {
            id: "part-0",
            callID: "call_3",
            tool: "write",
            state: { status: "running", input: { file: "a.ts" }, time: { start: 100 } },
            metadata: { openai: { item: "1" } },
          },
        ],
        events: [
          { type: "tool.input.started", callID: "call_3", name: "write" },
          { type: "tool.input.ended", callID: "call_3", text: "" },
          { type: "tool.called", callID: "call_3", tool: "write", input: { file: "a.ts" }, provider: { executed: false, metadata: { openai: { item: "1" } } } },
        ],
        toolcalls: { call_3: { inputEnded: false, partID: "part-0" } },
        permissionAsks: [],
      },
    },
    {
      id: "tool-call-wraps-non-record-input",
      actual: plannerProjection(wrappedState),
      expected: {
        parts: [
          {
            id: "part-0",
            callID: "call_4",
            tool: "echo",
            state: { status: "running", input: { value: "hello" }, time: { start: 100 } },
          },
        ],
        events: [
          { type: "tool.input.started", callID: "call_4", name: "echo" },
          { type: "tool.input.ended", callID: "call_4", text: "" },
          { type: "tool.called", callID: "call_4", tool: "echo", input: { value: "hello" }, provider: { executed: false } },
        ],
        toolcalls: { call_4: { inputEnded: false, partID: "part-0" } },
        permissionAsks: [],
      },
    },
    {
      id: "doom-loop-asks-permission",
      actual: doomState.permissionAsks,
      expected: [
        {
          permission: "doom_loop",
          patterns: ["bash"],
          metadata: { tool: "bash", input: { cmd: "npm test" } },
          always: ["bash"],
        },
      ],
    },
    {
      id: "summary-mode-rejects-tool-call",
      actual: summaryError,
      expected: "Tool call not allowed while generating summary: bash",
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.tool-call-planner" as const,
    portID: "turn.tool-call-planner" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-tool-call-planner-native-exact-fixture" as const,
    replayRef: "turn-tool-call-planner-native-exact:opencode" as const,
    fixtureID: "opencode-turn-tool-call-planner:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/processor.ts#ensureToolCall,tool-input-start,tool-input-end,tool-call,doom_loop",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return { ...fixtureWithoutFingerprint, fingerprint: fingerprintObject(fixtureWithoutFingerprint) }
}

export function captureOpenCodeTurnToolExecutorNativeExactFixture(): OpenCodeTurnToolExecutorNativeExactFixture {
  const bridge = createOpenCodeTurnToolLoopBridge()
  const completed = bridge.createState()
  seedRunningTool(completed, "call_1", "lookup", { query: "weather" }, { providerExecuted: true })
  bridge.handleExecutorEvent(completed, {
    type: "tool-result",
    id: "call_1",
    name: "lookup",
    result: {
      type: "json",
      value: {
        title: "Weather Lookup",
        metadata: { city: "SF" },
        output: "sunny",
        attachments: [{ type: "file", mime: "image/png", url: "file://plot.png", filename: "plot.png" }, { type: "bad", url: "skip" }],
      },
    },
    providerExecuted: true,
  })

  const jsonFallback = bridge.createState()
  seedRunningTool(jsonFallback, "call_2", "inspect", { id: 1 })
  bridge.handleExecutorEvent(jsonFallback, { type: "tool-result", id: "call_2", name: "inspect", result: { type: "json", value: { ok: true } } })

  const rejected = bridge.createState({ shouldBreak: true })
  seedRunningTool(rejected, "call_3", "write", { file: "a.ts" })
  bridge.handleExecutorEvent(rejected, { type: "tool-error", id: "call_3", name: "write", message: "denied", error: { name: "PermissionRejectedError", message: "denied" } })

  const ignored = bridge.createState()
  bridge.handleExecutorEvent(ignored, { type: "tool-result", id: "missing", name: "noop", result: { type: "text", value: "ignored" } })

  const cases: OpenCodeTurnToolExecutorNativeExactFixtureCase[] = [
    {
      id: "structured-tool-result-completes-running-call",
      actual: executorProjection(completed),
      expected: {
        parts: [
          {
            id: "part-0",
            callID: "call_1",
            tool: "lookup",
            state: {
              status: "completed",
              input: { query: "weather" },
              output: "sunny",
              metadata: { city: "SF" },
              title: "Weather Lookup",
              time: { start: 100, end: 100 },
              attachments: [{ type: "file", mime: "image/png", url: "file://plot.png", filename: "plot.png" }],
            },
            metadata: { providerExecuted: true },
          },
        ],
        events: [
          {
            type: "tool.success",
            callID: "call_1",
            structured: { city: "SF" },
            content: [
              { type: "text", text: "sunny" },
              { type: "file", uri: "file://plot.png", mime: "image/png", name: "plot.png" },
            ],
            provider: { executed: true },
          },
        ],
        toolcalls: {},
        blocked: false,
        settled: ["call_1"],
      },
    },
    {
      id: "json-result-falls-back-to-tool-name",
      actual: executorProjection(jsonFallback),
      expected: {
        parts: [
          {
            id: "part-0",
            callID: "call_2",
            tool: "inspect",
            state: {
              status: "completed",
              input: { id: 1 },
              output: "{\"ok\":true}",
              metadata: { ok: true },
              title: "inspect",
              time: { start: 100, end: 100 },
            },
          },
        ],
        events: [
          {
            type: "tool.success",
            callID: "call_2",
            structured: { ok: true },
            content: [{ type: "text", text: "{\"ok\":true}" }],
            provider: { executed: false },
          },
        ],
        toolcalls: {},
        blocked: false,
        settled: ["call_2"],
      },
    },
    {
      id: "tool-error-blocks-when-user-rejected",
      actual: executorProjection(rejected),
      expected: {
        parts: [
          {
            id: "part-0",
            callID: "call_3",
            tool: "write",
            state: { status: "error", input: { file: "a.ts" }, error: "denied", time: { start: 100, end: 100 } },
          },
        ],
        events: [
          { type: "tool.failed", callID: "call_3", error: { type: "unknown", message: "denied" }, provider: { executed: false } },
        ],
        toolcalls: {},
        blocked: true,
        settled: ["call_3"],
      },
    },
    {
      id: "tool-result-ignored-without-running-call",
      actual: executorProjection(ignored),
      expected: {
        parts: [],
        events: [{ type: "tool.success", callID: "missing", structured: {}, content: [{ type: "text", text: "ignored" }], provider: { executed: false } }],
        toolcalls: {},
        blocked: false,
        settled: [],
      },
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.tool-executor" as const,
    portID: "turn.tool-executor" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-tool-executor-native-exact-fixture" as const,
    replayRef: "turn-tool-executor-native-exact:opencode" as const,
    fixtureID: "opencode-turn-tool-executor:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/processor.ts#toolResultOutput,completeToolCall,failToolCall,tool-result,tool-error",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return { ...fixtureWithoutFingerprint, fingerprint: fingerprintObject(fixtureWithoutFingerprint) }
}

export function verifyOpenCodeTurnToolCallPlannerNativeExactFixture(
  fixture: OpenCodeTurnToolCallPlannerNativeExactFixture,
): OpenCodeTurnToolLoopNativeExactFixtureVerification {
  const issues = verifyBase(fixture, {
    atomID: "opencode.turn.tool-call-planner",
    portID: "turn.tool-call-planner",
    fixtureID: "opencode-turn-tool-call-planner:native-exact-fixture",
    prefix: "opencode-turn-tool-call-planner-native-exact",
  })
  if (!fixture.cases.some((item) => item.id === "doom-loop-asks-permission" && sameJSON(item.actual, item.expected))) {
    issues.push({ id: "opencode-turn-tool-call-planner-native-exact.doom-loop", message: "Doom-loop permission guard must stay covered." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-tool-call-planner-native-exact.fingerprint", message: "OpenCode turn tool-call planner fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

export function verifyOpenCodeTurnToolExecutorNativeExactFixture(
  fixture: OpenCodeTurnToolExecutorNativeExactFixture,
): OpenCodeTurnToolLoopNativeExactFixtureVerification {
  const issues = verifyBase(fixture, {
    atomID: "opencode.turn.tool-executor",
    portID: "turn.tool-executor",
    fixtureID: "opencode-turn-tool-executor:native-exact-fixture",
    prefix: "opencode-turn-tool-executor-native-exact",
  })
  if (!fixture.cases.some((item) => item.id === "tool-error-blocks-when-user-rejected" && sameJSON(item.actual, item.expected))) {
    issues.push({ id: "opencode-turn-tool-executor-native-exact.rejected-blocks", message: "Rejected tool errors must set blocked when shouldBreak is true." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-tool-executor-native-exact.fingerprint", message: "OpenCode turn tool executor fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function ensureToolCall(
  state: OpenCodeTurnToolLoopState,
  input: { id: string; name: string; providerExecuted?: boolean },
): { call: OpenCodeTurnToolCall; part: OpenCodeTurnToolPart } {
  const existing = readToolCall(state, input.id)
  if (existing) {
    if (!input.providerExecuted || existing.part.metadata?.providerExecuted) return existing
    const updated = {
      ...existing.part,
      metadata: { ...(existing.part.metadata ?? {}), providerExecuted: true },
    }
    replacePart(state, updated)
    state.toolcalls[input.id] = {
      ...existing.call,
      partID: updated.id,
      messageID: updated.messageID,
      sessionID: updated.sessionID,
    }
    return { call: state.toolcalls[input.id]!, part: updated }
  }

  state.events.push({ type: "tool.input.started", callID: input.id, name: input.name })
  const part: OpenCodeTurnToolPart = {
    id: `part-${state.partCounter++}`,
    messageID: state.assistantMessage.id,
    sessionID: state.assistantMessage.sessionID,
    type: "tool",
    tool: input.name,
    callID: input.id,
    state: { status: "pending", input: {}, raw: "" },
    ...(input.providerExecuted ? { metadata: { providerExecuted: true } } : {}),
  }
  state.parts.push(part)
  state.toolcalls[input.id] = {
    partID: part.id,
    messageID: part.messageID,
    sessionID: part.sessionID,
    inputEnded: false,
  }
  return { call: state.toolcalls[input.id]!, part }
}

function readToolCall(state: OpenCodeTurnToolLoopState, toolCallID: string): { call: OpenCodeTurnToolCall; part: OpenCodeTurnToolPart } | undefined {
  const call = state.toolcalls[toolCallID]
  if (!call) return undefined
  const part = state.parts.find((item) => item.id === call.partID && item.messageID === call.messageID && item.sessionID === call.sessionID)
  if (!part || part.type !== "tool") {
    delete state.toolcalls[toolCallID]
    return undefined
  }
  return { call, part }
}

function updateToolCall(
  state: OpenCodeTurnToolLoopState,
  toolCallID: string,
  update: (part: OpenCodeTurnToolPart) => OpenCodeTurnToolPart,
): OpenCodeTurnToolPart | undefined {
  const match = readToolCall(state, toolCallID)
  if (!match) return undefined
  const part = update(match.part)
  replacePart(state, part)
  state.toolcalls[toolCallID] = {
    ...match.call,
    partID: part.id,
    messageID: part.messageID,
    sessionID: part.sessionID,
  }
  return part
}

function completeToolCall(
  state: OpenCodeTurnToolLoopState,
  toolCallID: string,
  output: { title: string; metadata: Record<string, unknown>; output: string; attachments?: OpenCodeTurnToolFilePart[] },
): void {
  const match = readToolCall(state, toolCallID)
  if (!match || match.part.state.status !== "running") return
  replacePart(state, {
    ...match.part,
    state: {
      status: "completed",
      input: match.part.state.input,
      output: output.output,
      metadata: output.metadata,
      title: output.title,
      time: { start: match.part.state.time.start, end: state.now },
      ...(output.attachments ? { attachments: output.attachments } : {}),
    },
  })
  settleToolCall(state, toolCallID)
}

function failToolCall(state: OpenCodeTurnToolLoopState, toolCallID: string, error: unknown): boolean {
  const match = readToolCall(state, toolCallID)
  if (!match || match.part.state.status !== "running") return false
  replacePart(state, {
    ...match.part,
    state: {
      status: "error",
      input: match.part.state.input,
      error: errorMessage(error),
      time: { start: match.part.state.time.start, end: state.now },
    },
  })
  if (isRejectedError(error)) state.blocked = state.shouldBreak
  settleToolCall(state, toolCallID)
  return true
}

function settleToolCall(state: OpenCodeTurnToolLoopState, toolCallID: string): void {
  delete state.toolcalls[toolCallID]
  state.settled.push(toolCallID)
}

function replacePart(state: OpenCodeTurnToolLoopState, part: OpenCodeTurnToolPart): void {
  const index = state.parts.findIndex((item) => item.id === part.id)
  if (index === -1) state.parts.push(part)
  else state.parts[index] = part
}

function assertToolAllowed(state: OpenCodeTurnToolLoopState, name: string): void {
  if (state.assistantMessage.summary) throw new Error(`Tool call not allowed while generating summary: ${name}`)
}

function toolInput(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : { value }
}

function toolResultOutput(
  value: Extract<OpenCodeTurnToolExecutorEvent, { type: "tool-result" }>,
): { title: string; metadata: Record<string, unknown>; output: string; attachments?: OpenCodeTurnToolFilePart[] } {
  if (isRecord(value.result.value) && typeof value.result.value.output === "string") {
    const attachments = Array.isArray(value.result.value.attachments)
      ? value.result.value.attachments.filter(isFilePart)
      : undefined
    return {
      title: typeof value.result.value.title === "string" ? value.result.value.title : value.name,
      metadata: isRecord(value.result.value.metadata) ? value.result.value.metadata : {},
      output: value.result.value.output,
      ...(attachments?.length ? { attachments } : {}),
    }
  }
  return {
    title: value.name,
    metadata: value.result.type === "json" && isRecord(value.result.value) ? value.result.value : {},
    output: typeof value.result.value === "string" ? value.result.value : (JSON.stringify(value.result.value) ?? ""),
  }
}

function maybeAskDoomLoop(state: OpenCodeTurnToolLoopState, tool: string, input: Record<string, unknown>): void {
  const recentParts = state.recentParts.slice(-DOOM_LOOP_THRESHOLD)
  if (
    recentParts.length !== DOOM_LOOP_THRESHOLD ||
    !recentParts.every((part) =>
      part.type === "tool" &&
      part.tool === tool &&
      part.state.status !== "pending" &&
      JSON.stringify("input" in part.state ? part.state.input : undefined) === JSON.stringify(input)
    )
  ) {
    return
  }
  state.permissionAsks.push({
    permission: "doom_loop",
    patterns: [tool],
    metadata: { tool, input },
    always: [tool],
  })
}

function runningPart(id: string, tool: string, input: Record<string, unknown>, start = 1): OpenCodeTurnToolPart {
  return {
    id,
    messageID: "msg_assistant",
    sessionID: "ses_1",
    type: "tool",
    tool,
    callID: id,
    state: { status: "running", input, time: { start } },
  }
}

function seedRunningTool(
  state: OpenCodeTurnToolLoopState,
  id: string,
  tool: string,
  input: Record<string, unknown>,
  metadata?: Record<string, unknown>,
): void {
  const part = runningPart(`part-${state.partCounter++}`, tool, input, state.now)
  const next = metadata ? { ...part, callID: id, metadata } : { ...part, callID: id }
  state.parts.push(next)
  state.toolcalls[id] = { partID: next.id, messageID: next.messageID, sessionID: next.sessionID, inputEnded: true }
}

function plannerProjection(state: OpenCodeTurnToolLoopState): unknown {
  return {
    parts: state.parts.map(projectPart),
    events: state.events,
    toolcalls: projectToolcalls(state.toolcalls),
    permissionAsks: state.permissionAsks,
  }
}

function executorProjection(state: OpenCodeTurnToolLoopState): unknown {
  return {
    parts: state.parts.map(projectPart),
    events: state.events,
    toolcalls: projectToolcalls(state.toolcalls),
    blocked: state.blocked,
    settled: state.settled,
  }
}

function projectPart(part: OpenCodeTurnToolPart): unknown {
  return {
    id: part.id,
    callID: part.callID,
    tool: part.tool,
    state: part.state,
    ...(part.metadata ? { metadata: part.metadata } : {}),
  }
}

function projectToolcalls(toolcalls: Record<string, OpenCodeTurnToolCall>): Record<string, { inputEnded: boolean; partID: string }> {
  return Object.fromEntries(Object.entries(toolcalls).map(([key, value]) => [key, { inputEnded: value.inputEnded, partID: value.partID }]))
}

function verifyBase(
  fixture: OpenCodeTurnToolCallPlannerNativeExactFixture | OpenCodeTurnToolExecutorNativeExactFixture,
  expected: { atomID: string; portID: string; fixtureID: string; prefix: string },
): OpenCodeTurnToolLoopNativeExactFixtureIssue[] {
  const issues: OpenCodeTurnToolLoopNativeExactFixtureIssue[] = []
  if (fixture.atomID !== expected.atomID || fixture.portID !== expected.portID || fixture.fixtureID !== expected.fixtureID) {
    issues.push({ id: `${expected.prefix}.identity`, message: "OpenCode turn tool loop fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: `${expected.prefix}.native-claim`, message: "OpenCode turn tool loop fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: `${expected.prefix}.lossiness`, message: "OpenCode turn tool loop native fixture cannot retain known lossiness." })
  }
  if (!fixture.sourceRefs.some((ref) => ref.includes("session/processor.ts") && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
    issues.push({ id: `${expected.prefix}.source`, message: "OpenCode turn tool loop fixture lost pinned SessionProcessor source." })
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actual, item.expected)) {
      issues.push({ id: `${expected.prefix}.case`, caseID: item.id, message: `${item.id} no longer matches pinned SessionProcessor tool-loop behavior.` })
    }
  }
  return issues
}

function isFilePart(value: unknown): value is OpenCodeTurnToolFilePart {
  return isRecord(value) && value.type === "file" && typeof value.mime === "string" && typeof value.url === "string"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function isRejectedError(error: unknown): boolean {
  return isRecord(error) && (error.name === "PermissionRejectedError" || error.name === "QuestionRejectedError")
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (isRecord(error) && typeof error.message === "string") return error.message
  return String(error)
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
