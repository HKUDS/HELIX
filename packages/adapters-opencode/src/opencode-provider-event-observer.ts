import { createHash } from "node:crypto"

export type OpenCodeProviderEventObserverFinishReason = "stop" | "length" | "tool-calls" | "content-filter" | "error" | "unknown"
export type OpenCodeProviderEventObserverMetadata = Record<string, unknown>

export interface OpenCodeProviderEventObserverUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  reasoningTokens?: number
  cacheReadInputTokens?: number
  cacheWriteInputTokens?: number
}

export type OpenCodeProviderEventObserverToolResultValue =
  | { type: "json"; value: unknown }
  | { type: "text"; value: unknown }
  | { type: "error"; value: unknown }
  | { type: "content"; value: unknown[] }

export type OpenCodeProviderEventObserverLLMEvent =
  | { type: "step-start"; index: number }
  | { type: "text-start"; id: string; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "text-delta"; id: string; text: string; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "text-end"; id: string; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "reasoning-start"; id: string; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "reasoning-delta"; id: string; text: string; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "reasoning-end"; id: string; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "tool-input-start"; id: string; name: string; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "tool-input-delta"; id: string; name: string; text: string }
  | { type: "tool-input-end"; id: string; name: string; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "tool-call"; id: string; name: string; input: unknown; providerExecuted?: boolean | undefined; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "tool-result"; id: string; name: string; result: OpenCodeProviderEventObserverToolResultValue; providerExecuted?: boolean | undefined; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "tool-error"; id: string; name: string; message: string; error?: unknown; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "step-finish"; index: number; reason: OpenCodeProviderEventObserverFinishReason; usage?: OpenCodeProviderEventObserverUsage | undefined; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }
  | { type: "finish"; reason: OpenCodeProviderEventObserverFinishReason; usage?: OpenCodeProviderEventObserverUsage | undefined; providerMetadata?: OpenCodeProviderEventObserverMetadata | undefined }

export interface OpenCodeProviderEventObserverState {
  step: number
  text: number
  reasoning: number
  currentTextID?: string | undefined
  currentReasoningID?: string | undefined
  toolNames: Record<string, string>
}

export type OpenCodeProviderEventObserverAISDKEvent = Record<string, unknown> & { type: string }

export interface OpenCodeProviderEventObserverBridge {
  createState(): OpenCodeProviderEventObserverState
  observeEvent(
    state: OpenCodeProviderEventObserverState,
    event: OpenCodeProviderEventObserverAISDKEvent,
  ): OpenCodeProviderEventObserverLLMEvent[]
  observeEvents(
    events: OpenCodeProviderEventObserverAISDKEvent[],
    state?: OpenCodeProviderEventObserverState,
  ): OpenCodeProviderEventObserverLLMEvent[]
}

export interface OpenCodeProviderEventObserverNativeExactFixtureCase {
  id:
    | "session-visible-stream-chunks"
    | "implicit-block-ids"
    | "ignored-non-session-visible-chunks"
    | "tool-error-preserves-cause"
    | "empty-usage-stays-undefined"
    | "finish-resets-reused-state"
  input: OpenCodeProviderEventObserverAISDKEvent[]
  actual: OpenCodeProviderEventObserverLLMEvent[]
  expected: OpenCodeProviderEventObserverLLMEvent[]
}

export interface OpenCodeProviderEventObserverNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.event-observer"
  portID: "provider.event-normalizer"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-event-observer-native-exact-fixture"
  replayRef: "provider-event-observer-native-exact:opencode"
  fixtureID: "opencode-provider-event-observer:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeProviderEventObserverNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderEventObserverNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderEventObserverNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderEventObserverNativeExactFixtureIssue[]
}

const FINISH_REASONS = new Set<OpenCodeProviderEventObserverFinishReason>(["stop", "length", "tool-calls", "content-filter", "error", "unknown"])

export function createOpenCodeProviderEventObserverBridge(): OpenCodeProviderEventObserverBridge {
  return {
    createState: openCodeProviderEventObserverAdapterState,
    observeEvent: openCodeProviderEventObserverToLLMEvents,
    observeEvents(events, state = openCodeProviderEventObserverAdapterState()) {
      return events.flatMap((event) => openCodeProviderEventObserverToLLMEvents(state, event))
    },
  }
}

export function openCodeProviderEventObserverAdapterState(): OpenCodeProviderEventObserverState {
  return {
    step: 0,
    text: 0,
    reasoning: 0,
    toolNames: {},
  }
}

export function openCodeProviderEventObserverToLLMEvents(
  state: OpenCodeProviderEventObserverState,
  event: OpenCodeProviderEventObserverAISDKEvent,
): OpenCodeProviderEventObserverLLMEvent[] {
  switch (event.type) {
    case "start":
      return []

    case "start-step":
      return [{ type: "step-start", index: state.step }]

    case "finish-step":
      return [
        openCodeProviderEventObserverClean({
          type: "step-finish",
          index: state.step++,
          reason: openCodeProviderEventObserverFinishReason(event.finishReason),
          usage: openCodeProviderEventObserverUsage(event.usage),
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]

    case "finish": {
      const output: OpenCodeProviderEventObserverLLMEvent[] = [
        openCodeProviderEventObserverClean({
          type: "finish",
          reason: openCodeProviderEventObserverFinishReason(event.finishReason),
          usage: openCodeProviderEventObserverUsage(event.totalUsage),
          providerMetadata: "providerMetadata" in event ? openCodeProviderEventObserverProviderMetadata(event.providerMetadata) : undefined,
        }),
      ]
      Object.assign(state, openCodeProviderEventObserverAdapterState())
      return output
    }

    case "text-start": {
      state.currentTextID = openCodeProviderEventObserverCurrentTextID(state, openCodeProviderEventObserverString(event.id))
      return [
        openCodeProviderEventObserverClean({
          type: "text-start",
          id: state.currentTextID,
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]
    }

    case "text-delta":
      return [
        openCodeProviderEventObserverClean({
          type: "text-delta",
          id: openCodeProviderEventObserverCurrentTextID(state, openCodeProviderEventObserverString(event.id)),
          text: typeof event.text === "string" ? event.text : "",
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]

    case "text-end": {
      const id = openCodeProviderEventObserverCurrentTextID(state, openCodeProviderEventObserverString(event.id))
      state.currentTextID = undefined
      return [
        openCodeProviderEventObserverClean({
          type: "text-end",
          id,
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]
    }

    case "reasoning-start": {
      state.currentReasoningID = openCodeProviderEventObserverCurrentReasoningID(state, openCodeProviderEventObserverString(event.id))
      return [
        openCodeProviderEventObserverClean({
          type: "reasoning-start",
          id: state.currentReasoningID,
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]
    }

    case "reasoning-delta":
      return [
        openCodeProviderEventObserverClean({
          type: "reasoning-delta",
          id: openCodeProviderEventObserverCurrentReasoningID(state, openCodeProviderEventObserverString(event.id)),
          text: typeof event.text === "string" ? event.text : "",
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]

    case "reasoning-end": {
      const id = openCodeProviderEventObserverCurrentReasoningID(state, openCodeProviderEventObserverString(event.id))
      state.currentReasoningID = undefined
      return [
        openCodeProviderEventObserverClean({
          type: "reasoning-end",
          id,
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]
    }

    case "tool-input-start": {
      const id = openCodeProviderEventObserverRequireString(event.id)
      const name = openCodeProviderEventObserverRequireString(event.toolName)
      state.toolNames[id] = name
      return [
        openCodeProviderEventObserverClean({
          type: "tool-input-start",
          id,
          name,
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]
    }

    case "tool-input-delta": {
      const id = openCodeProviderEventObserverRequireString(event.id)
      return [
        {
          type: "tool-input-delta",
          id,
          name: state.toolNames[id] ?? "unknown",
          text: typeof event.delta === "string" ? event.delta : "",
        },
      ]
    }

    case "tool-input-end": {
      const id = openCodeProviderEventObserverRequireString(event.id)
      return [
        openCodeProviderEventObserverClean({
          type: "tool-input-end",
          id,
          name: state.toolNames[id] ?? "unknown",
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]
    }

    case "tool-call": {
      const id = openCodeProviderEventObserverRequireString(event.toolCallId)
      const name = openCodeProviderEventObserverRequireString(event.toolName)
      state.toolNames[id] = name
      return [
        openCodeProviderEventObserverClean({
          type: "tool-call",
          id,
          name,
          input: event.input,
          providerExecuted: "providerExecuted" in event ? openCodeProviderEventObserverBoolean(event.providerExecuted) : undefined,
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]
    }

    case "tool-result": {
      const id = openCodeProviderEventObserverRequireString(event.toolCallId)
      const name = state.toolNames[id] ?? "unknown"
      delete state.toolNames[id]
      return [
        openCodeProviderEventObserverClean({
          type: "tool-result",
          id,
          name,
          result: openCodeProviderEventObserverToolResultValue(event.output),
          providerExecuted: "providerExecuted" in event ? openCodeProviderEventObserverBoolean(event.providerExecuted) : undefined,
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]
    }

    case "tool-error": {
      const id = openCodeProviderEventObserverRequireString(event.toolCallId)
      const name = state.toolNames[id] ?? ("toolName" in event ? openCodeProviderEventObserverRequireString(event.toolName) : "unknown")
      delete state.toolNames[id]
      return [
        openCodeProviderEventObserverClean({
          type: "tool-error",
          id,
          name,
          message: openCodeProviderEventObserverErrorMessage(event.error),
          error: event.error,
          providerMetadata: openCodeProviderEventObserverProviderMetadata(event.providerMetadata),
        }),
      ]
    }

    case "error":
      throw event.error

    case "abort":
    case "source":
    case "file":
    case "raw":
    case "tool-output-denied":
    case "tool-approval-request":
      return []

    default:
      return []
  }
}

export function captureOpenCodeProviderEventObserverNativeExactFixture(): OpenCodeProviderEventObserverNativeExactFixture {
  const bridge = createOpenCodeProviderEventObserverBridge()
  const metadata = { openai: { itemID: "item-1" } }
  const visibleStreamInput = [
    { type: "start" },
    { type: "start-step", request: {}, warnings: [] },
    { type: "text-start", id: "text-1", providerMetadata: metadata },
    { type: "text-delta", id: "text-1", text: "Hel", providerMetadata: { openai: { delta: 1 } } },
    { type: "text-delta", id: "text-1", text: "lo", providerMetadata: { openai: { delta: 2 } } },
    { type: "text-end", id: "text-1", providerMetadata: { openai: { done: true } } },
    { type: "reasoning-start", id: "reasoning-1", providerMetadata: metadata },
    { type: "reasoning-delta", id: "reasoning-1", text: "Think", providerMetadata: { openai: { delta: 3 } } },
    { type: "reasoning-end", id: "reasoning-1", providerMetadata: { openai: { done: true } } },
    { type: "tool-input-start", id: "call-1", toolName: "lookup", providerMetadata: metadata },
    { type: "tool-input-delta", id: "call-1", delta: "{\"query\":" },
    { type: "tool-input-delta", id: "call-1", delta: "\"weather\"}" },
    { type: "tool-input-end", id: "call-1", providerMetadata: { openai: { inputDone: true } } },
    { type: "tool-call", toolCallId: "call-1", toolName: "lookup", input: { query: "weather" }, providerExecuted: true, providerMetadata: { openai: { called: true } } },
    { type: "tool-result", toolCallId: "call-1", output: { title: "Lookup", output: "sunny", metadata: { ok: true } }, providerExecuted: true, providerMetadata: { openai: { result: true } } },
    {
      type: "finish-step",
      finishReason: "other",
      usage: {
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
        inputTokenDetails: { cacheReadTokens: 3, cacheWriteTokens: 2 },
        outputTokenDetails: { reasoningTokens: 1 },
      },
      providerMetadata: { openai: { step: true } },
    },
    {
      type: "finish",
      finishReason: "other",
      totalUsage: {
        inputTokens: 11,
        outputTokens: 6,
        totalTokens: 17,
        cachedInputTokens: 4,
        reasoningTokens: 2,
        inputTokenDetails: { cacheReadTokens: 4 },
        outputTokenDetails: { reasoningTokens: 2 },
      },
    },
  ]
  const implicitIDInput = [
    { type: "text-delta", text: "implicit text" },
    { type: "text-end" },
    { type: "reasoning-delta", text: "implicit reasoning" },
    { type: "reasoning-end" },
  ]
  const ignoredInput = [
    { type: "abort" },
    { type: "source" },
    { type: "file" },
    { type: "raw" },
    { type: "tool-output-denied" },
    { type: "tool-approval-request" },
  ]
  const toolErrorInput = [
    { type: "tool-error", toolCallId: "call_123", toolName: "bash", input: {}, error: { message: "Permission rejected" } },
  ]
  const emptyUsageInput = [
    {
      type: "finish-step",
      finishReason: "stop",
      usage: {
        inputTokens: undefined,
        outputTokens: undefined,
        totalTokens: undefined,
        reasoningTokens: undefined,
        cachedInputTokens: undefined,
        inputTokenDetails: { cacheReadTokens: undefined, cacheWriteTokens: undefined },
        outputTokenDetails: { reasoningTokens: undefined },
      },
    },
  ]
  const resetState = bridge.createState()
  bridge.observeEvents([
    { type: "start-step", request: {}, warnings: [] },
    { type: "text-delta", text: "first" },
    { type: "text-end" },
    { type: "reasoning-delta", text: "first reasoning" },
    { type: "reasoning-end" },
    { type: "finish-step", finishReason: "stop", usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
    { type: "finish", finishReason: "stop", totalUsage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
  ], resetState)
  const resetInput = [
    { type: "start-step", request: {}, warnings: [] },
    { type: "text-delta", text: "second" },
    { type: "text-end" },
    { type: "reasoning-delta", text: "second reasoning" },
    { type: "reasoning-end" },
  ]

  const cases: OpenCodeProviderEventObserverNativeExactFixtureCase[] = [
    {
      id: "session-visible-stream-chunks",
      input: visibleStreamInput,
      actual: bridge.observeEvents(visibleStreamInput),
      expected: [
        { type: "step-start", index: 0 },
        { type: "text-start", id: "text-1", providerMetadata: metadata },
        { type: "text-delta", id: "text-1", text: "Hel", providerMetadata: { openai: { delta: 1 } } },
        { type: "text-delta", id: "text-1", text: "lo", providerMetadata: { openai: { delta: 2 } } },
        { type: "text-end", id: "text-1", providerMetadata: { openai: { done: true } } },
        { type: "reasoning-start", id: "reasoning-1", providerMetadata: metadata },
        { type: "reasoning-delta", id: "reasoning-1", text: "Think", providerMetadata: { openai: { delta: 3 } } },
        { type: "reasoning-end", id: "reasoning-1", providerMetadata: { openai: { done: true } } },
        { type: "tool-input-start", id: "call-1", name: "lookup", providerMetadata: metadata },
        { type: "tool-input-delta", id: "call-1", name: "lookup", text: "{\"query\":" },
        { type: "tool-input-delta", id: "call-1", name: "lookup", text: "\"weather\"}" },
        { type: "tool-input-end", id: "call-1", name: "lookup", providerMetadata: { openai: { inputDone: true } } },
        { type: "tool-call", id: "call-1", name: "lookup", input: { query: "weather" }, providerExecuted: true, providerMetadata: { openai: { called: true } } },
        { type: "tool-result", id: "call-1", name: "lookup", result: { type: "json", value: { title: "Lookup", output: "sunny", metadata: { ok: true } } }, providerExecuted: true, providerMetadata: { openai: { result: true } } },
        { type: "step-finish", index: 0, reason: "unknown", usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15, reasoningTokens: 1, cacheReadInputTokens: 3, cacheWriteInputTokens: 2 }, providerMetadata: { openai: { step: true } } },
        { type: "finish", reason: "unknown", usage: { inputTokens: 11, outputTokens: 6, totalTokens: 17, reasoningTokens: 2, cacheReadInputTokens: 4 } },
      ],
    },
    {
      id: "implicit-block-ids",
      input: implicitIDInput,
      actual: bridge.observeEvents(implicitIDInput),
      expected: [
        { type: "text-delta", id: "text-0", text: "implicit text" },
        { type: "text-end", id: "text-0" },
        { type: "reasoning-delta", id: "reasoning-0", text: "implicit reasoning" },
        { type: "reasoning-end", id: "reasoning-0" },
      ],
    },
    {
      id: "ignored-non-session-visible-chunks",
      input: ignoredInput,
      actual: bridge.observeEvents(ignoredInput),
      expected: [],
    },
    {
      id: "tool-error-preserves-cause",
      input: toolErrorInput,
      actual: bridge.observeEvents(toolErrorInput),
      expected: [{ type: "tool-error", id: "call_123", name: "bash", message: "Permission rejected", error: { message: "Permission rejected" } }],
    },
    {
      id: "empty-usage-stays-undefined",
      input: emptyUsageInput,
      actual: bridge.observeEvents(emptyUsageInput),
      expected: [{ type: "step-finish", index: 0, reason: "stop" }],
    },
    {
      id: "finish-resets-reused-state",
      input: resetInput,
      actual: bridge.observeEvents(resetInput, resetState),
      expected: [
        { type: "step-start", index: 0 },
        { type: "text-delta", id: "text-0", text: "second" },
        { type: "text-end", id: "text-0" },
        { type: "reasoning-delta", id: "reasoning-0", text: "second reasoning" },
        { type: "reasoning-end", id: "reasoning-0" },
      ],
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.event-observer" as const,
    portID: "provider.event-normalizer" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-event-observer-native-exact-fixture" as const,
    replayRef: "provider-event-observer-native-exact:opencode" as const,
    fixtureID: "opencode-provider-event-observer:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/llm/ai-sdk.ts#adapterState,toLLMEvents,usage,finishReason",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/test/session/llm.test.ts#session.llm.ai-sdk adapter",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/llm.ts#LLMAISDK.toLLMEvents,fullStream",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderEventObserverFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderEventObserverNativeExactFixture(
  fixture: OpenCodeProviderEventObserverNativeExactFixture,
): OpenCodeProviderEventObserverNativeExactFixtureVerification {
  const issues: OpenCodeProviderEventObserverNativeExactFixtureIssue[] = []
  if (
    fixture.atomID !== "opencode.provider.event-observer" ||
    fixture.portID !== "provider.event-normalizer" ||
    fixture.fixtureID !== "opencode-provider-event-observer:native-exact-fixture"
  ) {
    issues.push({ id: "opencode-provider-event-observer-native-exact.identity", message: "OpenCode event observer native fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-provider-event-observer-native-exact.native-claim", message: "OpenCode event observer fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-provider-event-observer-native-exact.lossiness", message: "OpenCode event observer native fixture cannot retain known lossiness." })
  }
  for (const source of ["packages/opencode/src/session/llm/ai-sdk.ts", "packages/opencode/test/session/llm.test.ts", "packages/opencode/src/session/llm.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-provider-event-observer-native-exact.source", message: `OpenCode event observer fixture lost upstream source ${source}.` })
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeProviderEventObserverSameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-provider-event-observer-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned event observer behavior.` })
    }
  }
  if (!fixture.cases.some((item) => item.id === "finish-resets-reused-state" && item.actual.some((event) => event.type === "step-start" && event.index === 0))) {
    issues.push({ id: "opencode-provider-event-observer-native-exact.state-reset", message: "Finish state reset is not covered." })
  }
  if (!fixture.cases.some((item) => item.id === "empty-usage-stays-undefined" && item.actual[0]?.type === "step-finish" && !("usage" in item.actual[0]))) {
    issues.push({ id: "opencode-provider-event-observer-native-exact.empty-usage", message: "Empty usage omission is not covered." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderEventObserverFingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-provider-event-observer-native-exact.fingerprint", message: "OpenCode event observer native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function openCodeProviderEventObserverFinishReason(value: unknown): OpenCodeProviderEventObserverFinishReason {
  return typeof value === "string" && FINISH_REASONS.has(value as OpenCodeProviderEventObserverFinishReason)
    ? value as OpenCodeProviderEventObserverFinishReason
    : "unknown"
}

function openCodeProviderEventObserverProviderMetadata(value: unknown): OpenCodeProviderEventObserverMetadata | undefined {
  return openCodeProviderEventObserverRecord(value)
}

function openCodeProviderEventObserverUsage(value: unknown): OpenCodeProviderEventObserverUsage | undefined {
  const item = openCodeProviderEventObserverRecord(value)
  if (!item) return undefined
  const inputTokenDetails = openCodeProviderEventObserverRecord(item.inputTokenDetails)
  const outputTokenDetails = openCodeProviderEventObserverRecord(item.outputTokenDetails)
  const entries = Object.entries({
    inputTokens: openCodeProviderEventObserverNumber(item.inputTokens),
    outputTokens: openCodeProviderEventObserverNumber(item.outputTokens),
    totalTokens: openCodeProviderEventObserverNumber(item.totalTokens),
    reasoningTokens: openCodeProviderEventObserverNumber(outputTokenDetails?.reasoningTokens) ?? openCodeProviderEventObserverNumber(item.reasoningTokens),
    cacheReadInputTokens: openCodeProviderEventObserverNumber(inputTokenDetails?.cacheReadTokens) ?? openCodeProviderEventObserverNumber(item.cachedInputTokens),
    cacheWriteInputTokens: openCodeProviderEventObserverNumber(inputTokenDetails?.cacheWriteTokens),
  }).filter((entry) => entry[1] !== undefined)
  return entries.length === 0 ? undefined : Object.fromEntries(entries) as OpenCodeProviderEventObserverUsage
}

function openCodeProviderEventObserverCurrentTextID(state: OpenCodeProviderEventObserverState, id: string | undefined): string {
  state.currentTextID = id ?? state.currentTextID ?? `text-${state.text++}`
  return state.currentTextID
}

function openCodeProviderEventObserverCurrentReasoningID(state: OpenCodeProviderEventObserverState, id: string | undefined): string {
  state.currentReasoningID = id ?? state.currentReasoningID ?? `reasoning-${state.reasoning++}`
  return state.currentReasoningID
}

function openCodeProviderEventObserverToolResultValue(value: unknown, type: OpenCodeProviderEventObserverToolResultValue["type"] = "json"): OpenCodeProviderEventObserverToolResultValue {
  const record = openCodeProviderEventObserverRecord(value)
  if (
    record &&
    (record.type === "text" || record.type === "json" || record.type === "error" || record.type === "content") &&
    "value" in record
  ) {
    return record as OpenCodeProviderEventObserverToolResultValue
  }
  if (type === "content") return { type, value: Array.isArray(value) ? value : [] }
  return { type, value }
}

function openCodeProviderEventObserverErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message) return error.message
    if (error.name) return error.name
  }
  const record = openCodeProviderEventObserverRecord(error)
  if (record && typeof record.message === "string" && record.message) return record.message
  const data = openCodeProviderEventObserverRecord(record?.data)
  if (data && typeof data.message === "string" && data.message) return data.message
  const text = String(error)
  if (text && text !== "[object Object]") return text
  if (record) return JSON.stringify(record)
  return "unknown error"
}

function openCodeProviderEventObserverClean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined)) as T
}

function openCodeProviderEventObserverRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function openCodeProviderEventObserverString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function openCodeProviderEventObserverRequireString(value: unknown): string {
  if (typeof value !== "string") throw new TypeError("OpenCode provider event observer expected a string event field.")
  return value
}

function openCodeProviderEventObserverBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function openCodeProviderEventObserverNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined
}

function openCodeProviderEventObserverSameJSON(left: unknown, right: unknown): boolean {
  return openCodeProviderEventObserverStableJSON(left) === openCodeProviderEventObserverStableJSON(right)
}

function openCodeProviderEventObserverFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeProviderEventObserverStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeProviderEventObserverStableJSON(value: unknown): string {
  return JSON.stringify(openCodeProviderEventObserverSortStable(value))
}

function openCodeProviderEventObserverSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeProviderEventObserverSortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeProviderEventObserverSortStable(entry)]),
  )
}
