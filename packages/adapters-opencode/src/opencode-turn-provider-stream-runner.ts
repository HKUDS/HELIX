import { createHash } from "node:crypto"
import {
  createOpenCodeTurnStreamReducerBridge,
  type OpenCodeTurnStreamReducerEvent,
  type OpenCodeTurnStreamReducerInputEvent,
} from "./opencode-turn-stream-reducer"

export interface OpenCodeTurnProviderStreamRunnerModel {
  id: string
  providerID: string
  api?: {
    npm?: string
    id?: string
  }
}

export interface OpenCodeTurnProviderStreamRunnerPrepared {
  messages: unknown[]
  tools: Record<string, unknown>
  params: {
    temperature?: number
    topP?: number
    topK?: number
    maxOutputTokens?: number
    options?: Record<string, unknown>
  }
  headers?: Record<string, string>
  messageTransformOptions?: Record<string, unknown>
}

export interface OpenCodeTurnProviderStreamRunnerInput {
  sessionID: string
  model: OpenCodeTurnProviderStreamRunnerModel
  prepared: OpenCodeTurnProviderStreamRunnerPrepared
  flags?: {
    experimentalNativeLlm?: boolean
  }
  nativeRuntime?: { type: "supported" } | { type: "unsupported"; reason: string }
  toolChoice?: "auto" | "required" | "none"
  retries?: number
  abort?: { signalID: string }
  telemetry?: {
    enabled?: boolean
    userID?: string
  }
}

export type OpenCodeTurnProviderStreamRuntimeSelection =
  | { runtime: "native"; stream: "llm-event"; fallbackReason?: never }
  | { runtime: "ai-sdk"; stream: "fullStream"; fallbackReason?: string }

export interface OpenCodeTurnProviderStreamTextCall {
  providerID: string
  modelID: string
  temperature?: number
  topP?: number
  topK?: number
  providerOptions: Record<string, unknown>
  activeTools: string[]
  toolChoice?: "auto" | "required" | "none"
  maxOutputTokens?: number
  abortSignalID?: string
  headers?: Record<string, string>
  maxRetries: number
  messageCount: number
  telemetry: {
    isEnabled: boolean
    functionId: "session.llm"
    metadata: {
      userId: string
      sessionId: string
    }
  }
  modelWrapped: true
  transformParams: "ProviderTransform.message"
}

export interface OpenCodeTurnProviderStreamRepairInput {
  toolCall: {
    toolName: string
    input: unknown
    toolCallId?: string
  }
  error: {
    message: string
  }
}

export interface OpenCodeTurnProviderStreamRunnerBridge {
  selectRuntime(input: OpenCodeTurnProviderStreamRunnerInput): OpenCodeTurnProviderStreamRuntimeSelection
  buildAIStreamTextCall(input: OpenCodeTurnProviderStreamRunnerInput): OpenCodeTurnProviderStreamTextCall
  repairToolCall(input: OpenCodeTurnProviderStreamRepairInput, tools: Record<string, unknown>): OpenCodeTurnProviderStreamRepairInput["toolCall"]
  consumeAIStream(events: OpenCodeTurnStreamReducerInputEvent[]): OpenCodeTurnStreamReducerEvent[]
  scopedAbort(input: { release: boolean; reason?: string }): { created: true; aborted: boolean; reason?: string }
}

export interface OpenCodeTurnProviderStreamRunnerNativeExactFixtureCase {
  id:
    | "native-runtime-selected-when-supported"
    | "native-runtime-fallback-records-reason"
    | "ai-sdk-stream-text-call-shape"
    | "repair-tool-call-lowercase-match"
    | "repair-tool-call-invalid-fallback"
    | "full-stream-reduces-to-llm-events"
    | "error-event-fails-stream"
    | "scoped-abort-release"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTurnProviderStreamRunnerNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.provider-stream-runner"
  portID: "turn.provider-stream-runner"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-provider-stream-runner-native-exact-fixture"
  replayRef: "turn-provider-stream-runner-native-exact:opencode"
  fixtureID: "opencode-turn-provider-stream-runner:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnProviderStreamRunnerNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnProviderStreamRunnerNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnProviderStreamRunnerNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnProviderStreamRunnerNativeExactFixtureIssue[]
}

export function createOpenCodeTurnProviderStreamRunnerBridge(): OpenCodeTurnProviderStreamRunnerBridge {
  return {
    selectRuntime,
    buildAIStreamTextCall,
    repairToolCall,
    consumeAIStream,
    scopedAbort,
  }
}

function selectRuntime(input: OpenCodeTurnProviderStreamRunnerInput): OpenCodeTurnProviderStreamRuntimeSelection {
  if (input.flags?.experimentalNativeLlm && input.nativeRuntime?.type === "supported") {
    return { runtime: "native", stream: "llm-event" }
  }
  if (input.flags?.experimentalNativeLlm && input.nativeRuntime?.type === "unsupported") {
    return { runtime: "ai-sdk", stream: "fullStream", fallbackReason: input.nativeRuntime.reason }
  }
  return { runtime: "ai-sdk", stream: "fullStream" }
}

function buildAIStreamTextCall(input: OpenCodeTurnProviderStreamRunnerInput): OpenCodeTurnProviderStreamTextCall {
  const result: OpenCodeTurnProviderStreamTextCall = {
    providerID: input.model.providerID,
    modelID: input.model.id,
    providerOptions: providerOptions(input.model, input.prepared.params.options ?? {}),
    activeTools: Object.keys(input.prepared.tools).filter((name) => name !== "invalid"),
    maxRetries: input.retries ?? 0,
    messageCount: input.prepared.messages.length,
    telemetry: {
      isEnabled: input.telemetry?.enabled === true,
      functionId: "session.llm",
      metadata: {
        userId: input.telemetry?.userID ?? "unknown",
        sessionId: input.sessionID,
      },
    },
    modelWrapped: true,
    transformParams: "ProviderTransform.message",
  }
  if (input.prepared.params.temperature !== undefined) result.temperature = input.prepared.params.temperature
  if (input.prepared.params.topP !== undefined) result.topP = input.prepared.params.topP
  if (input.prepared.params.topK !== undefined) result.topK = input.prepared.params.topK
  if (input.toolChoice !== undefined) result.toolChoice = input.toolChoice
  if (input.prepared.params.maxOutputTokens !== undefined) result.maxOutputTokens = input.prepared.params.maxOutputTokens
  if (input.abort) result.abortSignalID = input.abort.signalID
  if (input.prepared.headers) result.headers = input.prepared.headers
  return result
}

function repairToolCall(
  input: OpenCodeTurnProviderStreamRepairInput,
  tools: Record<string, unknown>,
): OpenCodeTurnProviderStreamRepairInput["toolCall"] {
  const lower = input.toolCall.toolName.toLowerCase()
  if (lower !== input.toolCall.toolName && tools[lower]) return { ...input.toolCall, toolName: lower }
  return {
    ...input.toolCall,
    input: JSON.stringify({ tool: input.toolCall.toolName, error: input.error.message }),
    toolName: "invalid",
  }
}

function consumeAIStream(events: OpenCodeTurnStreamReducerInputEvent[]): OpenCodeTurnStreamReducerEvent[] {
  const reducer = createOpenCodeTurnStreamReducerBridge()
  const state = reducer.createState()
  const output: OpenCodeTurnStreamReducerEvent[] = []
  for (const event of events) {
    if (event.type === "error") throw event.error
    output.push(...reducer.reduceEvent(state, event))
  }
  return output
}

function scopedAbort(input: { release: boolean; reason?: string }): { created: true; aborted: boolean; reason?: string } {
  const result: { created: true; aborted: boolean; reason?: string } = { created: true, aborted: false }
  if (input.release) {
    result.aborted = true
    if (input.reason) result.reason = input.reason
  }
  return result
}

export function captureOpenCodeTurnProviderStreamRunnerNativeExactFixture(): OpenCodeTurnProviderStreamRunnerNativeExactFixture {
  const bridge = createOpenCodeTurnProviderStreamRunnerBridge()
  const prepared: OpenCodeTurnProviderStreamRunnerPrepared = {
    messages: [{ role: "user", content: "hello" }],
    tools: { bash: {}, invalid: {}, read: {} },
    params: {
      temperature: 0.2,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 1024,
      options: { reasoningEffort: "medium" },
    },
    headers: { "x-opencode": "1" },
  }
  const input: OpenCodeTurnProviderStreamRunnerInput = {
    sessionID: "ses_1",
    model: { id: "gpt-5-codex", providerID: "openai", api: { npm: "@ai-sdk/openai", id: "gpt-5-codex" } },
    prepared,
    toolChoice: "auto",
    retries: 2,
    abort: { signalID: "abort_1" },
    telemetry: { enabled: true, userID: "ava" },
  }

  let errorMessage = ""
  try {
    bridge.consumeAIStream([{ type: "error", error: new Error("provider failed") }])
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error)
  }

  const streamInput = [
    { type: "start" },
    { type: "start-step" },
    { type: "text-start", id: "txt" },
    { type: "text-delta", id: "txt", text: "hi" },
    { type: "text-end", id: "txt" },
    { type: "finish", finishReason: "stop", totalUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } },
  ]

  const cases: OpenCodeTurnProviderStreamRunnerNativeExactFixtureCase[] = [
    {
      id: "native-runtime-selected-when-supported",
      actual: bridge.selectRuntime({ ...input, flags: { experimentalNativeLlm: true }, nativeRuntime: { type: "supported" } }),
      expected: { runtime: "native", stream: "llm-event" },
    },
    {
      id: "native-runtime-fallback-records-reason",
      actual: bridge.selectRuntime({ ...input, flags: { experimentalNativeLlm: true }, nativeRuntime: { type: "unsupported", reason: "provider-not-supported" } }),
      expected: { runtime: "ai-sdk", stream: "fullStream", fallbackReason: "provider-not-supported" },
    },
    {
      id: "ai-sdk-stream-text-call-shape",
      actual: bridge.buildAIStreamTextCall(input),
      expected: {
        providerID: "openai",
        modelID: "gpt-5-codex",
        temperature: 0.2,
        topP: 0.9,
        topK: 40,
        providerOptions: { openai: { reasoningEffort: "medium" } },
        activeTools: ["bash", "read"],
        toolChoice: "auto",
        maxOutputTokens: 1024,
        abortSignalID: "abort_1",
        headers: { "x-opencode": "1" },
        maxRetries: 2,
        messageCount: 1,
        telemetry: { isEnabled: true, functionId: "session.llm", metadata: { userId: "ava", sessionId: "ses_1" } },
        modelWrapped: true,
        transformParams: "ProviderTransform.message",
      },
    },
    {
      id: "repair-tool-call-lowercase-match",
      actual: bridge.repairToolCall({ toolCall: { toolName: "BASH", input: { cmd: "pwd" }, toolCallId: "call_1" }, error: { message: "bad tool" } }, prepared.tools),
      expected: { toolName: "bash", input: { cmd: "pwd" }, toolCallId: "call_1" },
    },
    {
      id: "repair-tool-call-invalid-fallback",
      actual: bridge.repairToolCall({ toolCall: { toolName: "Nope", input: { value: true }, toolCallId: "call_2" }, error: { message: "schema failed" } }, prepared.tools),
      expected: { toolName: "invalid", input: "{\"tool\":\"Nope\",\"error\":\"schema failed\"}", toolCallId: "call_2" },
    },
    {
      id: "full-stream-reduces-to-llm-events",
      actual: bridge.consumeAIStream(streamInput),
      expected: [
        { type: "step-start", index: 0 },
        { type: "text-start", id: "txt" },
        { type: "text-delta", id: "txt", text: "hi" },
        { type: "text-end", id: "txt" },
        { type: "finish", reason: "stop", usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } },
      ],
    },
    {
      id: "error-event-fails-stream",
      actual: errorMessage,
      expected: "provider failed",
    },
    {
      id: "scoped-abort-release",
      actual: bridge.scopedAbort({ release: true, reason: "scope-release" }),
      expected: { created: true, aborted: true, reason: "scope-release" },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.provider-stream-runner" as const,
    portID: "turn.provider-stream-runner" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-provider-stream-runner-native-exact-fixture" as const,
    replayRef: "turn-provider-stream-runner-native-exact:opencode" as const,
    fixtureID: "opencode-turn-provider-stream-runner:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/llm.ts#LLM.run,experimentalNativeLlm,streamText,experimental_repairToolCall,fullStream,Stream.scoped",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/llm/ai-sdk.ts#adapterState,toLLMEvents,error",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/transform.ts#providerOptions,message",
      "fixture-share:opencode.turn.stream-reducer:opencode-turn-stream-reducer:native-exact-fixture",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return { ...fixtureWithoutFingerprint, fingerprint: fingerprintObject(fixtureWithoutFingerprint) }
}

export function verifyOpenCodeTurnProviderStreamRunnerNativeExactFixture(
  fixture: OpenCodeTurnProviderStreamRunnerNativeExactFixture,
): OpenCodeTurnProviderStreamRunnerNativeExactFixtureVerification {
  const issues: OpenCodeTurnProviderStreamRunnerNativeExactFixtureIssue[] = []
  if (fixture.atomID !== "opencode.turn.provider-stream-runner" || fixture.portID !== "turn.provider-stream-runner" || fixture.fixtureID !== "opencode-turn-provider-stream-runner:native-exact-fixture") {
    issues.push({ id: "opencode-turn-provider-stream-runner-native-exact.identity", message: "OpenCode turn provider-stream-runner fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-turn-provider-stream-runner-native-exact.native-claim", message: "OpenCode turn provider-stream-runner must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-turn-provider-stream-runner-native-exact.lossiness", message: "OpenCode turn provider-stream-runner native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/llm.ts", "session/llm/ai-sdk.ts", "provider/transform.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-turn-provider-stream-runner-native-exact.source", message: `OpenCode turn provider-stream-runner fixture lost pinned ${source} source.` })
    }
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-turn-provider-stream-runner-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned LLM.run provider stream behavior.` })
    }
  }
  if (!fixture.cases.some((item) => item.id === "error-event-fails-stream" && item.actual === "provider failed")) {
    issues.push({ id: "opencode-turn-provider-stream-runner-native-exact.error-propagation", message: "AI SDK error chunks must fail the provider stream." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-provider-stream-runner-native-exact.fingerprint", message: "OpenCode turn provider-stream-runner native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function providerOptions(model: OpenCodeTurnProviderStreamRunnerModel, options: Record<string, unknown>): Record<string, unknown> {
  const key = providerOptionsKey(model)
  return key ? { [key]: options } : options
}

function providerOptionsKey(model: OpenCodeTurnProviderStreamRunnerModel): string | undefined {
  if (model.api?.npm === "@ai-sdk/azure") return "openai"
  if (model.api?.npm === "@ai-sdk/openai" || model.api?.npm === "@ai-sdk/openai-compatible" || model.api?.npm === "@ai-sdk/anthropic") {
    return model.providerID.split(".")[0] ?? model.providerID
  }
  if (model.api?.npm === "@ai-sdk/google") return "google"
  if (model.api?.npm === "@ai-sdk/google-vertex") return "google"
  if (model.api?.npm === "@ai-sdk/amazon-bedrock") return "bedrock"
  return model.providerID
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
