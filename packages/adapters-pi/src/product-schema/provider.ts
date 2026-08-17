import { createHash } from "node:crypto"

export const piMonoProviderUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoProviderDescriptorNativeExactFixtureID = "pi-provider-descriptor:native-exact-fixture"
export const piMonoProviderDescriptorNativeExactEvidenceRef = "conformance:pi-provider-descriptor-native-exact-fixture"
export const piMonoProviderDescriptorNativeExactReplayRef = "provider-descriptor-native-exact:pi-mono"
export const piMonoProviderAuthDescriptorNativeExactAtomID = "pi.provider.auth-descriptor"
export const piMonoProviderEventObserverNativeExactAtomID = "pi.provider.event-observer"
export const piMonoProviderExtensionDescriptorNativeExactAtomID = "pi.provider.extension-descriptor"
export const piMonoProviderModelExtensionNativeExactAtomID = "pi.provider.model-extension"
export const piMonoProviderParserObserverNativeExactAtomID = "pi.provider.parser-observer"
export const piMonoProviderRequestOptionsNativeExactAtomID = "pi.provider.request-options"
export const piMonoProviderStreamingDeltaRecorderNativeExactAtomID = "pi.provider.streaming-delta-recorder.native-like"
export const piMonoProviderStreamProjectorNativeExactAtomID = "pi.provider.stream-projector.native-like"
export const piMonoProviderTransportInstrumentationNativeExactAtomID = "pi.provider.transport-instrumentation"
export const piMonoProviderUsageRendererNativeExactAtomID = "pi.provider.usage-renderer"

export type PiMonoProviderNativeExactAtomID =
  | typeof piMonoProviderAuthDescriptorNativeExactAtomID
  | typeof piMonoProviderEventObserverNativeExactAtomID
  | typeof piMonoProviderExtensionDescriptorNativeExactAtomID
  | typeof piMonoProviderModelExtensionNativeExactAtomID
  | typeof piMonoProviderParserObserverNativeExactAtomID
  | typeof piMonoProviderRequestOptionsNativeExactAtomID
  | typeof piMonoProviderStreamingDeltaRecorderNativeExactAtomID
  | typeof piMonoProviderStreamProjectorNativeExactAtomID
  | typeof piMonoProviderTransportInstrumentationNativeExactAtomID
  | typeof piMonoProviderUsageRendererNativeExactAtomID

export type PiMonoProviderPortID =
  | "provider.auth"
  | "provider.event-normalizer"
  | "provider.stream-parser"
  | "provider.stream"
  | "provider.model-registry"
  | "provider.request-shape"
  | "provider.streaming-delta-recorder"
  | "provider.stream-projector"
  | "provider.transport"
  | "provider.usage-normalizer"

export type PiMonoProviderInputKind = "text" | "image"
export type PiMonoThinkingLevel = "minimal" | "low" | "medium" | "high" | "xhigh"
export type PiMonoModelThinkingLevel = "off" | PiMonoThinkingLevel
export type PiMonoCacheRetention = "none" | "short" | "long"
export type PiMonoTransport = "sse" | "websocket" | "websocket-cached" | "auto"

export interface PiMonoProviderCost {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

export interface PiMonoProviderUsage {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  totalTokens: number
  cost: PiMonoProviderCost & { total: number }
}

export interface PiMonoProviderModelConfig {
  id: string
  name: string
  api?: string | undefined
  baseUrl?: string | undefined
  reasoning: boolean
  thinkingLevelMap?: Partial<Record<PiMonoModelThinkingLevel, string | null>> | undefined
  input: PiMonoProviderInputKind[]
  cost: PiMonoProviderCost
  contextWindow: number
  maxTokens: number
  headers?: Record<string, string> | undefined
  compat?: Record<string, unknown> | undefined
}

export interface PiMonoProviderOAuthConfig {
  name: string
  login?: unknown | undefined
  refreshToken?: unknown | undefined
  getApiKey?: unknown | undefined
  modifyModels?: unknown | undefined
}

export interface PiMonoProviderConfig {
  name?: string | undefined
  baseUrl?: string | undefined
  apiKey?: string | undefined
  api?: string | undefined
  streamSimple?: unknown | undefined
  headers?: Record<string, string> | undefined
  authHeader?: boolean | undefined
  oauth?: PiMonoProviderOAuthConfig | undefined
  models?: PiMonoProviderModelConfig[] | undefined
}

export interface PiMonoProviderModel {
  id: string
  name: string
  api: string
  provider: string
  baseUrl: string
  reasoning: boolean
  thinkingLevelMap?: Partial<Record<PiMonoModelThinkingLevel, string | null>> | undefined
  input: PiMonoProviderInputKind[]
  cost: PiMonoProviderCost
  contextWindow: number
  maxTokens: number
  headers?: undefined
  compat?: Record<string, unknown> | undefined
}

export interface PiMonoSimpleStreamOptions {
  temperature?: number | undefined
  maxTokens?: number | undefined
  signal?: unknown | undefined
  apiKey?: string | undefined
  transport?: PiMonoTransport | undefined
  cacheRetention?: PiMonoCacheRetention | undefined
  sessionId?: string | undefined
  headers?: Record<string, string> | undefined
  onPayload?: unknown | undefined
  onResponse?: unknown | undefined
  timeoutMs?: number | undefined
  maxRetries?: number | undefined
  maxRetryDelayMs?: number | undefined
  metadata?: Record<string, unknown> | undefined
  reasoning?: PiMonoThinkingLevel | undefined
  thinkingBudgets?: Partial<Record<Exclude<PiMonoThinkingLevel, "xhigh">, number>> | undefined
}

export interface PiMonoStreamOptions {
  temperature?: number | undefined
  maxTokens?: number | undefined
  signal?: unknown | undefined
  apiKey?: string | undefined
  transport?: PiMonoTransport | undefined
  cacheRetention?: PiMonoCacheRetention | undefined
  sessionId?: string | undefined
  headers?: Record<string, string> | undefined
  onPayload?: unknown | undefined
  onResponse?: unknown | undefined
  timeoutMs?: number | undefined
  maxRetries?: number | undefined
  maxRetryDelayMs?: number | undefined
  metadata?: Record<string, unknown> | undefined
}

export interface PiMonoProviderRequestConfig {
  apiKey?: string | undefined
  headers?: Record<string, string> | undefined
  authHeader?: boolean | undefined
}

export interface PiMonoProviderResolvedAuthOK {
  ok: true
  apiKey?: string | undefined
  headers?: Record<string, string> | undefined
}

export interface PiMonoProviderResolvedAuthError {
  ok: false
  error: string
}

export type PiMonoProviderResolvedAuth = PiMonoProviderResolvedAuthOK | PiMonoProviderResolvedAuthError

export interface PiMonoProviderRuntimeRegistration {
  name: string
  config: PiMonoProviderConfig
  extensionPath: string
}

export interface PiMonoProviderRuntimeState {
  pendingProviderRegistrations: PiMonoProviderRuntimeRegistration[]
  assertActive(): void
  invalidate(message?: string): void
  registerProvider(name: string, config: PiMonoProviderConfig, extensionPath?: string): void
  unregisterProvider(name: string, extensionPath?: string): void
}

export interface PiMonoProviderObserverPipelineInput {
  payload: Record<string, unknown>
  replacementPayload?: Record<string, unknown> | undefined
  response: PiMonoProviderResolvedResponse
  model: Pick<PiMonoProviderModel, "id" | "provider" | "api">
}

export interface PiMonoProviderResolvedResponse {
  status: number
  headers: Record<string, string>
}

export interface PiMonoProviderObserverProjection {
  finalPayload: Record<string, unknown>
  observerOrder: string[]
  responseStatus: number
  responseHeaderKeys: string[]
  modelID: string
}

export type PiMonoProviderProjectedEventProvider = "anthropic-messages" | "openai-responses"
export type PiMonoProviderProjectedStopReason = "stop" | "length" | "toolUse" | "error" | "aborted"

export interface PiMonoProviderProjectedStream {
  provider: PiMonoProviderProjectedEventProvider
  responseID: string
  eventTypes: string[]
  contentKinds: string[]
  text: string
  stopReason: PiMonoProviderProjectedStopReason
  usage: PiMonoProviderUsage
}

export type PiMonoAnthropicPinnedStreamEvent =
  | {
      type: "message_start"
      message: {
        id: string
        usage: {
          input_tokens?: number | undefined
          output_tokens?: number | undefined
          cache_read_input_tokens?: number | undefined
          cache_creation_input_tokens?: number | undefined
        }
      }
    }
  | { type: "content_block_start"; index: number; content_block: { type: "text" | "thinking" | "tool_use"; id?: string; name?: string; input?: Record<string, unknown> } }
  | { type: "content_block_delta"; index: number; delta: { type: "text_delta" | "thinking_delta" | "input_json_delta"; text?: string; thinking?: string; partial_json?: string } }
  | { type: "content_block_stop"; index: number }
  | {
      type: "message_delta"
      delta: { stop_reason?: "end_turn" | "max_tokens" | "tool_use" | "refusal" | "pause_turn" | "stop_sequence" | "sensitive" | string | undefined }
      usage: {
        input_tokens?: number | null | undefined
        output_tokens?: number | null | undefined
        cache_read_input_tokens?: number | null | undefined
        cache_creation_input_tokens?: number | null | undefined
      }
    }

export type PiMonoOpenAIResponsesPinnedStreamEvent =
  | { type: "response.created"; response: { id: string } }
  | { type: "response.output_item.added"; item: { type: "message" | "reasoning" | "function_call"; id?: string; call_id?: string; name?: string; arguments?: string } }
  | { type: "response.content_part.added"; part: { type: "output_text" | "refusal"; text?: string; refusal?: string } }
  | { type: "response.output_text.delta"; delta: string }
  | { type: "response.output_item.done"; item: { type: "message"; id: string; phase?: "commentary" | "final_answer"; content: Array<{ type: "output_text"; text: string } | { type: "refusal"; refusal: string }> } }
  | {
      type: "response.completed"
      response: {
        id?: string
        status?: "completed" | "incomplete" | "failed" | "cancelled" | "in_progress" | "queued"
        service_tier?: "auto" | "default" | "flex" | "priority" | null
        usage?: {
          input_tokens?: number
          output_tokens?: number
          total_tokens?: number
          input_tokens_details?: { cached_tokens?: number }
        }
      }
    }

export interface PiMonoProviderTransportProjection {
  requestOptionKeys: string[]
  timeout?: number | undefined
  maxRetries?: number | undefined
  hasSignal: boolean
  baseOptionKeys: string[]
  cacheRetention?: PiMonoCacheRetention | undefined
  sessionId?: string | undefined
  transport?: PiMonoTransport | undefined
  maxRetryDelayMs?: number | undefined
}

export interface PiMonoProviderNativeDescriptor {
  id: PiMonoProviderNativeExactAtomID
  port: PiMonoProviderPortID
  product: "pi-mono"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof piMonoProviderDescriptorNativeExactEvidenceRef, typeof piMonoProviderDescriptorNativeExactReplayRef]
  fixtureIDs: [typeof piMonoProviderDescriptorNativeExactFixtureID]
  knownLossiness: []
}

export type PiMonoProviderNativeExactScenarioID =
  | "base-options-api-key-and-retry-fields"
  | "base-options-empty-explicit-api-key-falls-back"
  | "observer-callback-replaces-payload-and-captures-response"
  | "provider-config-validates-model-auth-and-api"
  | "model-extension-replaces-provider-models"
  | "request-auth-merges-headers-and-bearer"
  | "anthropic-stream-projects-text-stop-usage-cost"
  | "openai-responses-stream-projects-text-cache-usage-cost"
  | "transport-options-pass-timeout-retry-signal"
  | "extension-runtime-queues-and-unregisters-by-name"
  | "session-services-flushes-pending-registrations-and-diagnostics"

export interface PiMonoProviderNativeExactCase {
  scenarioID: PiMonoProviderNativeExactScenarioID
  input: Record<string, string | number | boolean | string[]>
  output: Record<string, string | number | boolean | string[]>
  upstreamBehavior: string
}

export interface PiMonoProviderDescriptorNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: readonly [
    typeof piMonoProviderAuthDescriptorNativeExactAtomID,
    typeof piMonoProviderEventObserverNativeExactAtomID,
    typeof piMonoProviderExtensionDescriptorNativeExactAtomID,
    typeof piMonoProviderModelExtensionNativeExactAtomID,
    typeof piMonoProviderParserObserverNativeExactAtomID,
    typeof piMonoProviderRequestOptionsNativeExactAtomID,
    typeof piMonoProviderStreamingDeltaRecorderNativeExactAtomID,
    typeof piMonoProviderStreamProjectorNativeExactAtomID,
    typeof piMonoProviderTransportInstrumentationNativeExactAtomID,
    typeof piMonoProviderUsageRendererNativeExactAtomID,
  ]
  portIDs: readonly [
    "provider.auth",
    "provider.event-normalizer",
    "provider.stream",
    "provider.model-registry",
    "provider.stream-parser",
    "provider.request-shape",
    "provider.streaming-delta-recorder",
    "provider.stream-projector",
    "provider.transport",
    "provider.usage-normalizer",
  ]
  upstreamRef: typeof piMonoProviderUpstreamRef
  evidenceRef: typeof piMonoProviderDescriptorNativeExactEvidenceRef
  fixtureID: typeof piMonoProviderDescriptorNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    providerConfigShapeMatchesExtensionAPI: true
    streamSimpleRequiresApi: true
    customModelProvidersRequireBaseUrlAndApiKeyOrOAuth: true
    modelApiMayComeFromProviderOrModel: true
    customModelsReplaceExistingProviderModels: true
    modelHeadersAreStoredSeparatelyFromModelObjects: true
    requestAuthPrefersAuthStorageThenProviderConfig: true
    authHeaderAddsBearerAuthorization: true
    providerHeadersMergeBeforeModelRequestHeaders: true
    onPayloadMayReplaceProviderPayload: true
    onResponseReceivesStatusAndHeadersBeforeStreamStart: true
    anthropicEventsProjectTextStopUsageAndCost: true
    openAIResponsesEventsProjectTextCacheUsageAndCost: true
    usageCostUsesModelPerMillionRates: true
    requestOptionsPassSignalTimeoutAndMaxRetries: true
    baseOptionsPassThroughSharedStreamOptions: true
    explicitBaseOptionsApiKeyWinsUnlessFalsy: true
    extensionLoadQueuesProviderRegistrationsBeforeBind: true
    sessionServicesFlushPendingProviderRegistrations: true
  }
  cases: PiMonoProviderNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: PiMonoProviderNativeDescriptor[]
  fingerprint: string
}

export interface PiMonoProviderDescriptorNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoProviderDescriptorNativeExactVerification {
  ok: boolean
  issues: PiMonoProviderDescriptorNativeExactIssue[]
}

export const piMonoProviderAuthDescriptorNativeDescriptor = piMonoProviderNativeDescriptor(
  piMonoProviderAuthDescriptorNativeExactAtomID,
  "provider.auth",
  "Pi upstream native provider request auth descriptor with native parity complete provider descriptor fixture coverage.",
)

export const piMonoProviderEventObserverNativeDescriptor = piMonoProviderNativeDescriptor(
  piMonoProviderEventObserverNativeExactAtomID,
  "provider.event-normalizer",
  "Pi upstream native provider stream event observer with native parity complete provider descriptor fixture coverage.",
)

export const piMonoProviderExtensionDescriptorNativeDescriptor = piMonoProviderNativeDescriptor(
  piMonoProviderExtensionDescriptorNativeExactAtomID,
  "provider.stream",
  "Pi upstream native extension provider stream registration descriptor with native parity complete provider descriptor fixture coverage.",
)

export const piMonoProviderModelExtensionNativeDescriptor = piMonoProviderNativeDescriptor(
  piMonoProviderModelExtensionNativeExactAtomID,
  "provider.model-registry",
  "Pi upstream native extension model registration descriptor with native parity complete provider descriptor fixture coverage.",
)

export const piMonoProviderParserObserverNativeDescriptor = piMonoProviderNativeDescriptor(
  piMonoProviderParserObserverNativeExactAtomID,
  "provider.stream-parser",
  "Pi upstream native Anthropic/OpenAI Responses stream parser observer with native parity complete provider descriptor fixture coverage.",
)

export const piMonoProviderRequestOptionsNativeDescriptor = piMonoProviderNativeDescriptor(
  piMonoProviderRequestOptionsNativeExactAtomID,
  "provider.request-shape",
  "Pi upstream native shared stream request options projection with native parity complete provider descriptor fixture coverage.",
)

export const piMonoProviderStreamingDeltaRecorderNativeDescriptor = piMonoProviderNativeDescriptor(
  piMonoProviderStreamingDeltaRecorderNativeExactAtomID,
  "provider.streaming-delta-recorder",
  "Pi upstream native provider stream delta recorder with native parity complete provider descriptor fixture coverage.",
)

export const piMonoProviderStreamProjectorNativeDescriptor = piMonoProviderNativeDescriptor(
  piMonoProviderStreamProjectorNativeExactAtomID,
  "provider.stream-projector",
  "Pi upstream native provider stream projector with native parity complete provider descriptor fixture coverage.",
)

export const piMonoProviderTransportInstrumentationNativeDescriptor = piMonoProviderNativeDescriptor(
  piMonoProviderTransportInstrumentationNativeExactAtomID,
  "provider.transport",
  "Pi upstream native provider transport request option instrumentation with native parity complete provider descriptor fixture coverage.",
)

export const piMonoProviderUsageRendererNativeDescriptor = piMonoProviderNativeDescriptor(
  piMonoProviderUsageRendererNativeExactAtomID,
  "provider.usage-normalizer",
  "Pi upstream native provider usage and cost renderer with native parity complete provider descriptor fixture coverage.",
)

export const piMonoProviderNativeDescriptors = [
  piMonoProviderAuthDescriptorNativeDescriptor,
  piMonoProviderEventObserverNativeDescriptor,
  piMonoProviderExtensionDescriptorNativeDescriptor,
  piMonoProviderModelExtensionNativeDescriptor,
  piMonoProviderParserObserverNativeDescriptor,
  piMonoProviderRequestOptionsNativeDescriptor,
  piMonoProviderStreamingDeltaRecorderNativeDescriptor,
  piMonoProviderStreamProjectorNativeDescriptor,
  piMonoProviderTransportInstrumentationNativeDescriptor,
  piMonoProviderUsageRendererNativeDescriptor,
] as const

export const piMonoProviderNativeExactAtomIDs = piMonoProviderNativeDescriptors.map((descriptor) => descriptor.id)

export function buildPiMonoProviderBaseOptions(
  _model: Pick<PiMonoProviderModel, "api" | "provider" | "id">,
  options: PiMonoSimpleStreamOptions = {},
  apiKey?: string,
): PiMonoStreamOptions {
  return {
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    signal: options.signal,
    apiKey: apiKey || options.apiKey,
    transport: options.transport,
    cacheRetention: options.cacheRetention,
    sessionId: options.sessionId,
    headers: options.headers,
    onPayload: options.onPayload,
    onResponse: options.onResponse,
    timeoutMs: options.timeoutMs,
    maxRetries: options.maxRetries,
    maxRetryDelayMs: options.maxRetryDelayMs,
    metadata: options.metadata,
  }
}

export function validatePiMonoProviderConfig(providerName: string, config: PiMonoProviderConfig): void {
  if (config.streamSimple && !config.api) {
    throw new Error(`Provider ${providerName}: "api" is required when registering streamSimple.`)
  }
  if (!config.models || config.models.length === 0) return
  if (!config.baseUrl) {
    throw new Error(`Provider ${providerName}: "baseUrl" is required when defining models.`)
  }
  if (!config.apiKey && !config.oauth) {
    throw new Error(`Provider ${providerName}: "apiKey" or "oauth" is required when defining models.`)
  }
  for (const modelDef of config.models) {
    const api = modelDef.api || config.api
    if (!api) {
      throw new Error(`Provider ${providerName}, model ${modelDef.id}: no "api" specified.`)
    }
  }
}

export function createPiMonoProviderModelExtensions(providerName: string, config: PiMonoProviderConfig): PiMonoProviderModel[] {
  validatePiMonoProviderConfig(providerName, config)
  if (!config.models || config.models.length === 0) return []
  return config.models.map((modelDef) => ({
    id: modelDef.id,
    name: modelDef.name,
    api: modelDef.api || config.api!,
    provider: providerName,
    baseUrl: modelDef.baseUrl ?? config.baseUrl!,
    reasoning: modelDef.reasoning,
    thinkingLevelMap: modelDef.thinkingLevelMap,
    input: modelDef.input,
    cost: modelDef.cost,
    contextWindow: modelDef.contextWindow,
    maxTokens: modelDef.maxTokens,
    headers: undefined,
    compat: modelDef.compat,
  }))
}

export function createPiMonoProviderRequestConfig(config: PiMonoProviderConfig): PiMonoProviderRequestConfig | undefined {
  if (!config.apiKey && !config.headers && !config.authHeader) return undefined
  return {
    apiKey: config.apiKey,
    headers: config.headers,
    authHeader: config.authHeader,
  }
}

export function resolvePiMonoProviderAuth(input: {
  model: Pick<PiMonoProviderModel, "provider" | "id"> & { headers?: Record<string, string> | undefined }
  providerConfig?: PiMonoProviderRequestConfig | undefined
  modelHeaders?: Record<string, string> | undefined
  authStorageApiKey?: string | undefined
  resolveValue?: ((value: string, label: string) => string) | undefined
  resolveHeaders?: ((headers: Record<string, string> | undefined, label: string) => Record<string, string> | undefined) | undefined
}): PiMonoProviderResolvedAuth {
  try {
    const resolveValue = input.resolveValue ?? ((value: string) => value)
    const resolveHeaders = input.resolveHeaders ?? ((headers: Record<string, string> | undefined) => headers)
    const providerConfig = input.providerConfig
    const apiKey = input.authStorageApiKey ?? (providerConfig?.apiKey ? resolveValue(providerConfig.apiKey, `API key for provider "${input.model.provider}"`) : undefined)
    const providerHeaders = resolveHeaders(providerConfig?.headers, `provider "${input.model.provider}"`)
    const modelHeaders = resolveHeaders(input.modelHeaders, `model "${input.model.provider}/${input.model.id}"`)
    const hasHeaders = Boolean(input.model.headers || providerHeaders || modelHeaders)
    let headers = hasHeaders
      ? {
          ...(input.model.headers ?? {}),
          ...(providerHeaders ?? {}),
          ...(modelHeaders ?? {}),
        }
      : undefined

    if (providerConfig?.authHeader) {
      if (!apiKey) {
        return { ok: false, error: `No API key found for "${input.model.provider}"` }
      }
      headers = { ...(headers ?? {}), Authorization: `Bearer ${apiKey}` }
    }

    return {
      ok: true,
      apiKey,
      headers: headers && Object.keys(headers).length > 0 ? headers : undefined,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export function createPiMonoProviderRuntimeState(): PiMonoProviderRuntimeState {
  const state: { staleMessage?: string } = {}
  const runtime: PiMonoProviderRuntimeState = {
    pendingProviderRegistrations: [],
    assertActive() {
      if (state.staleMessage) throw new Error(state.staleMessage)
    },
    invalidate(message) {
      state.staleMessage ??=
        message ??
        "This extension ctx is stale after session replacement or reload. Do not use a captured pi or command ctx after ctx.newSession(), ctx.fork(), ctx.switchSession(), or ctx.reload()."
    },
    registerProvider(name, config, extensionPath = "<unknown>") {
      runtime.assertActive()
      runtime.pendingProviderRegistrations.push({ name, config, extensionPath })
    },
    unregisterProvider(name) {
      runtime.assertActive()
      runtime.pendingProviderRegistrations = runtime.pendingProviderRegistrations.filter((registration) => registration.name !== name)
    },
  }
  return runtime
}

export function flushPiMonoPendingProviderRegistrations(input: {
  runtime: Pick<PiMonoProviderRuntimeState, "pendingProviderRegistrations">
  modelRegistry: { registerProvider(name: string, config: PiMonoProviderConfig): unknown }
}): Array<{ type: "error"; message: string }> {
  const diagnostics: Array<{ type: "error"; message: string }> = []
  for (const { name, config, extensionPath } of input.runtime.pendingProviderRegistrations) {
    try {
      input.modelRegistry.registerProvider(name, config)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      diagnostics.push({ type: "error", message: `Extension "${extensionPath}" error: ${message}` })
    }
  }
  input.runtime.pendingProviderRegistrations = []
  return diagnostics
}

export function upsertPiMonoProviderConfig(
  existing: PiMonoProviderConfig | undefined,
  config: PiMonoProviderConfig,
): PiMonoProviderConfig {
  if (!existing) return { ...config }
  const next: PiMonoProviderConfig = { ...existing }
  for (const key of Object.keys(config) as (keyof PiMonoProviderConfig)[]) {
    if (config[key] !== undefined) {
      ;(next as Record<string, unknown>)[key] = config[key]
    }
  }
  return next
}

export function calculatePiMonoProviderCost(usage: PiMonoProviderUsage, model: Pick<PiMonoProviderModel, "cost">): PiMonoProviderUsage["cost"] {
  usage.cost.input = (model.cost.input / 1_000_000) * usage.input
  usage.cost.output = (model.cost.output / 1_000_000) * usage.output
  usage.cost.cacheRead = (model.cost.cacheRead / 1_000_000) * usage.cacheRead
  usage.cost.cacheWrite = (model.cost.cacheWrite / 1_000_000) * usage.cacheWrite
  usage.cost.total = usage.cost.input + usage.cost.output + usage.cost.cacheRead + usage.cost.cacheWrite
  return usage.cost
}

export function runPiMonoProviderObserverPipeline(input: PiMonoProviderObserverPipelineInput): PiMonoProviderObserverProjection {
  const observerOrder: string[] = []
  observerOrder.push("onPayload:before-request")
  const finalPayload = input.replacementPayload ?? input.payload
  observerOrder.push("onResponse:before-stream-start")
  return {
    finalPayload,
    observerOrder,
    responseStatus: input.response.status,
    responseHeaderKeys: Object.keys(input.response.headers).sort(),
    modelID: input.model.id,
  }
}

export function projectPiMonoAnthropicStream(
  events: PiMonoAnthropicPinnedStreamEvent[],
  model: Pick<PiMonoProviderModel, "cost">,
): PiMonoProviderProjectedStream {
  const usage = emptyUsage()
  const eventTypes: string[] = ["start"]
  const contentKinds: string[] = []
  const blocks = new Map<number, { kind: string; text: string }>()
  let responseID = ""
  let text = ""
  let stopReason: PiMonoProviderProjectedStopReason = "stop"

  for (const event of events) {
    if (event.type === "message_start") {
      responseID = event.message.id
      usage.input = event.message.usage.input_tokens ?? 0
      usage.output = event.message.usage.output_tokens ?? 0
      usage.cacheRead = event.message.usage.cache_read_input_tokens ?? 0
      usage.cacheWrite = event.message.usage.cache_creation_input_tokens ?? 0
    } else if (event.type === "content_block_start") {
      const kind = event.content_block.type === "tool_use" ? "toolCall" : event.content_block.type
      blocks.set(event.index, { kind, text: "" })
      contentKinds.push(kind)
      eventTypes.push(`${kind}_start`)
    } else if (event.type === "content_block_delta") {
      const block = blocks.get(event.index)
      if (!block) continue
      if (event.delta.type === "text_delta") {
        block.text += event.delta.text ?? ""
        text += event.delta.text ?? ""
        eventTypes.push("text_delta")
      } else if (event.delta.type === "thinking_delta") {
        block.text += event.delta.thinking ?? ""
        eventTypes.push("thinking_delta")
      } else if (event.delta.type === "input_json_delta") {
        block.text += event.delta.partial_json ?? ""
        eventTypes.push("toolcall_delta")
      }
    } else if (event.type === "content_block_stop") {
      const block = blocks.get(event.index)
      if (block) eventTypes.push(`${block.kind}_end`)
    } else if (event.type === "message_delta") {
      if (event.delta.stop_reason) stopReason = mapPiMonoAnthropicStopReason(event.delta.stop_reason)
      if (event.usage.input_tokens != null) usage.input = event.usage.input_tokens
      if (event.usage.output_tokens != null) usage.output = event.usage.output_tokens
      if (event.usage.cache_read_input_tokens != null) usage.cacheRead = event.usage.cache_read_input_tokens
      if (event.usage.cache_creation_input_tokens != null) usage.cacheWrite = event.usage.cache_creation_input_tokens
    }
  }

  usage.totalTokens = usage.input + usage.output + usage.cacheRead + usage.cacheWrite
  calculatePiMonoProviderCost(usage, model)
  eventTypes.push("done")
  return {
    provider: "anthropic-messages",
    responseID,
    eventTypes,
    contentKinds,
    text,
    stopReason,
    usage,
  }
}

export function projectPiMonoOpenAIResponsesStream(
  events: PiMonoOpenAIResponsesPinnedStreamEvent[],
  model: Pick<PiMonoProviderModel, "cost" | "id">,
  options: { serviceTier?: "auto" | "default" | "flex" | "priority" | null } = {},
): PiMonoProviderProjectedStream {
  const usage = emptyUsage()
  const eventTypes: string[] = ["start"]
  const contentKinds: string[] = []
  let responseID = ""
  let text = ""
  let stopReason: PiMonoProviderProjectedStopReason = "stop"
  let currentMessage = false

  for (const event of events) {
    if (event.type === "response.created") {
      responseID = event.response.id
    } else if (event.type === "response.output_item.added") {
      currentMessage = event.item.type === "message"
      if (currentMessage) {
        contentKinds.push("text")
        eventTypes.push("text_start")
      }
    } else if (event.type === "response.output_text.delta" && currentMessage) {
      text += event.delta
      eventTypes.push("text_delta")
    } else if (event.type === "response.output_item.done" && event.item.type === "message") {
      text = event.item.content.map((part) => part.type === "output_text" ? part.text : part.refusal).join("")
      eventTypes.push("text_end")
      currentMessage = false
    } else if (event.type === "response.completed") {
      if (event.response.id) responseID = event.response.id
      const responseUsage = event.response.usage
      if (responseUsage) {
        const cachedTokens = responseUsage.input_tokens_details?.cached_tokens ?? 0
        usage.input = (responseUsage.input_tokens ?? 0) - cachedTokens
        usage.output = responseUsage.output_tokens ?? 0
        usage.cacheRead = cachedTokens
        usage.cacheWrite = 0
        usage.totalTokens = responseUsage.total_tokens ?? 0
      }
      stopReason = mapPiMonoOpenAIResponsesStopReason(event.response.status)
    }
  }

  calculatePiMonoProviderCost(usage, model)
  applyPiMonoOpenAIServiceTierPricing(usage, options.serviceTier, model)
  eventTypes.push("done")
  return {
    provider: "openai-responses",
    responseID,
    eventTypes,
    contentKinds,
    text,
    stopReason,
    usage,
  }
}

export function projectPiMonoProviderTransportOptions(options: PiMonoStreamOptions): PiMonoProviderTransportProjection {
  const requestOptionKeys = [
    ...(options.signal ? ["signal"] : []),
    ...(options.timeoutMs !== undefined ? ["timeout"] : []),
    ...(options.maxRetries !== undefined ? ["maxRetries"] : []),
  ]
  const baseOptionKeys = [
    ...(options.transport ? ["transport"] : []),
    ...(options.cacheRetention ? ["cacheRetention"] : []),
    ...(options.sessionId ? ["sessionId"] : []),
    ...(options.headers ? ["headers"] : []),
    ...(options.maxRetryDelayMs !== undefined ? ["maxRetryDelayMs"] : []),
  ]
  return {
    requestOptionKeys,
    timeout: options.timeoutMs,
    maxRetries: options.maxRetries,
    hasSignal: Boolean(options.signal),
    baseOptionKeys,
    cacheRetention: options.cacheRetention,
    sessionId: options.sessionId,
    transport: options.transport,
    maxRetryDelayMs: options.maxRetryDelayMs,
  }
}

export function buildPiMonoProviderDescriptorNativeExactFixture(): PiMonoProviderDescriptorNativeExactFixture {
  const baseOptions = buildPiMonoProviderBaseOptions(
    { id: "claude-proxy", provider: "corporate-ai", api: "anthropic-messages" },
    {
      temperature: 0.2,
      maxTokens: 1200,
      apiKey: "option-key",
      transport: "sse",
      cacheRetention: "long",
      sessionId: "session-1",
      headers: { "x-provider": "fixture" },
      timeoutMs: 1000,
      maxRetries: 3,
      maxRetryDelayMs: 1500,
      metadata: { trace: "abc" },
    },
    "explicit-key",
  )
  const fallbackApiKeyOptions = buildPiMonoProviderBaseOptions(
    { id: "claude-proxy", provider: "corporate-ai", api: "anthropic-messages" },
    { apiKey: "option-key" },
    "",
  )
  const providerConfig = sampleProviderConfig()
  const providerModels = createPiMonoProviderModelExtensions("corporate-ai", providerConfig)
  const providerAuth = resolvePiMonoProviderAuth({
    model: { id: "claude-proxy", provider: "corporate-ai", headers: { "x-shared": "model", "x-model": "1" } },
    providerConfig: createPiMonoProviderRequestConfig({ apiKey: "provider-key", headers: { "x-shared": "provider", "x-provider": "1" }, authHeader: true }),
    modelHeaders: { "x-shared": "stored", "x-stored": "1" },
  })
  const observerProjection = runPiMonoProviderObserverPipeline({
    payload: { model: "claude-proxy", stream: true },
    replacementPayload: { model: "claude-proxy", stream: true, metadata: { user_id: "agent" } },
    response: { status: 202, headers: { "x-request-id": "req-1", "content-type": "text/event-stream" } },
    model: { id: "claude-proxy", provider: "corporate-ai", api: "anthropic-messages" },
  })
  const anthropicProjection = projectPiMonoAnthropicStream([
    { type: "message_start", message: { id: "msg_01", usage: { input_tokens: 11, output_tokens: 0, cache_read_input_tokens: 3, cache_creation_input_tokens: 2 } } },
    { type: "content_block_start", index: 0, content_block: { type: "text" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "hello " } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "pi" } },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 5 } },
  ], {
    cost: { input: 2, output: 4, cacheRead: 0.5, cacheWrite: 1 },
  })
  const openAIResponsesProjection = projectPiMonoOpenAIResponsesStream([
    { type: "response.created", response: { id: "resp_01" } },
    { type: "response.output_item.added", item: { type: "message", id: "msg_01" } },
    { type: "response.content_part.added", part: { type: "output_text", text: "" } },
    { type: "response.output_text.delta", delta: "cached " },
    { type: "response.output_text.delta", delta: "answer" },
    { type: "response.output_item.done", item: { type: "message", id: "msg_01", content: [{ type: "output_text", text: "cached answer" }] } },
    { type: "response.completed", response: { id: "resp_01", status: "completed", service_tier: "priority", usage: { input_tokens: 17, output_tokens: 7, total_tokens: 24, input_tokens_details: { cached_tokens: 5 } } } },
  ], {
    id: "gpt-5.5",
    cost: { input: 1, output: 2, cacheRead: 0.25, cacheWrite: 0 },
  }, {
    serviceTier: "priority",
  })
  const transportProjection = projectPiMonoProviderTransportOptions({
    signal: { aborted: false },
    timeoutMs: 1500,
    maxRetries: 3,
    maxRetryDelayMs: 60000,
    transport: "sse",
    cacheRetention: "long",
    sessionId: "session-1",
    headers: { "x-provider": "fixture" },
  })
  const runtime = createPiMonoProviderRuntimeState()
  runtime.registerProvider("corporate-ai", providerConfig, "/extensions/provider.ts")
  runtime.registerProvider("temporary-ai", { baseUrl: "https://tmp.example.com" }, "/extensions/provider.ts")
  runtime.unregisterProvider("temporary-ai")
  const flushRuntime = createPiMonoProviderRuntimeState()
  flushRuntime.registerProvider("ok-ai", providerConfig, "/extensions/provider.ts")
  flushRuntime.registerProvider("bad-ai", providerConfig, "/extensions/provider.ts")
  const registered: string[] = []
  const diagnostics = flushPiMonoPendingProviderRegistrations({
    runtime: flushRuntime,
    modelRegistry: {
      registerProvider(name) {
        if (name === "bad-ai") throw new Error("registry rejected provider")
        registered.push(name)
      },
    },
  })

  const fixtureWithoutFingerprint: Omit<PiMonoProviderDescriptorNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: [
      piMonoProviderAuthDescriptorNativeExactAtomID,
      piMonoProviderEventObserverNativeExactAtomID,
      piMonoProviderExtensionDescriptorNativeExactAtomID,
      piMonoProviderModelExtensionNativeExactAtomID,
      piMonoProviderParserObserverNativeExactAtomID,
      piMonoProviderRequestOptionsNativeExactAtomID,
      piMonoProviderStreamingDeltaRecorderNativeExactAtomID,
      piMonoProviderStreamProjectorNativeExactAtomID,
      piMonoProviderTransportInstrumentationNativeExactAtomID,
      piMonoProviderUsageRendererNativeExactAtomID,
    ] as const,
    portIDs: ["provider.auth", "provider.event-normalizer", "provider.stream", "provider.model-registry", "provider.stream-parser", "provider.request-shape", "provider.streaming-delta-recorder", "provider.stream-projector", "provider.transport", "provider.usage-normalizer"] as const,
    upstreamRef: piMonoProviderUpstreamRef,
    evidenceRef: piMonoProviderDescriptorNativeExactEvidenceRef,
    fixtureID: piMonoProviderDescriptorNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      providerConfigShapeMatchesExtensionAPI: true as const,
      streamSimpleRequiresApi: true as const,
      customModelProvidersRequireBaseUrlAndApiKeyOrOAuth: true as const,
      modelApiMayComeFromProviderOrModel: true as const,
      customModelsReplaceExistingProviderModels: true as const,
      modelHeadersAreStoredSeparatelyFromModelObjects: true as const,
      requestAuthPrefersAuthStorageThenProviderConfig: true as const,
      authHeaderAddsBearerAuthorization: true as const,
      providerHeadersMergeBeforeModelRequestHeaders: true as const,
      onPayloadMayReplaceProviderPayload: true as const,
      onResponseReceivesStatusAndHeadersBeforeStreamStart: true as const,
      anthropicEventsProjectTextStopUsageAndCost: true as const,
      openAIResponsesEventsProjectTextCacheUsageAndCost: true as const,
      usageCostUsesModelPerMillionRates: true as const,
      requestOptionsPassSignalTimeoutAndMaxRetries: true as const,
      baseOptionsPassThroughSharedStreamOptions: true as const,
      explicitBaseOptionsApiKeyWinsUnlessFalsy: true as const,
      extensionLoadQueuesProviderRegistrationsBeforeBind: true as const,
      sessionServicesFlushPendingProviderRegistrations: true as const,
    },
    cases: [
      providerCase(
        "base-options-api-key-and-retry-fields",
        { optionApiKey: "option-key", explicitApiKey: "explicit-key", transport: "sse" },
        {
          apiKey: String(baseOptions.apiKey),
          temperature: Number(baseOptions.temperature),
          maxTokens: Number(baseOptions.maxTokens),
          timeoutMs: Number(baseOptions.timeoutMs),
          maxRetries: Number(baseOptions.maxRetries),
          maxRetryDelayMs: Number(baseOptions.maxRetryDelayMs),
          sessionId: String(baseOptions.sessionId),
          metadataTrace: String(baseOptions.metadata?.trace),
          hasHeaders: Boolean(baseOptions.headers),
        },
        "buildBaseOptions copies shared SimpleStreamOptions fields and uses the explicit apiKey argument when it is truthy.",
      ),
      providerCase(
        "base-options-empty-explicit-api-key-falls-back",
        { optionApiKey: "option-key", explicitApiKey: "" },
        { apiKey: String(fallbackApiKeyOptions.apiKey) },
        "buildBaseOptions uses apiKey || options.apiKey, so a falsy explicit apiKey falls back to the option value.",
      ),
      providerCase(
        "observer-callback-replaces-payload-and-captures-response",
        { modelID: observerProjection.modelID, responseStatus: observerProjection.responseStatus },
        {
          payloadWasReplaced: observerProjection.finalPayload.metadata !== undefined,
          observerOrder: observerProjection.observerOrder,
          responseHeaderKeys: observerProjection.responseHeaderKeys,
        },
        "streamAnthropic and streamOpenAIResponses await onPayload before the SDK request, allow a returned payload to replace params, then await onResponse with status and headers before consuming the response stream.",
      ),
      providerCase(
        "provider-config-validates-model-auth-and-api",
        { providerName: "corporate-ai", modelID: "claude-proxy", providerApi: "anthropic-messages" },
        { accepted: true, modelCount: providerModels.length, api: providerModels[0]?.api ?? "" },
        "ModelRegistry.registerProvider validates that custom model providers have baseUrl, apiKey or oauth, and an API at provider or model level.",
      ),
      providerCase(
        "model-extension-replaces-provider-models",
        { providerName: "corporate-ai", modelID: "claude-proxy" },
        {
          provider: providerModels[0]?.provider ?? "",
          baseUrl: providerModels[0]?.baseUrl ?? "",
          headersStoredSeparately: providerModels[0]?.headers === undefined,
          modelSpecificApiWins: providerModels[1]?.api ?? "",
        },
        "ModelRegistry.applyProviderConfig removes existing models for the provider and pushes model objects with provider/model API and baseUrl resolution; model headers are stored out of band.",
      ),
      providerCase(
        "request-auth-merges-headers-and-bearer",
        { providerName: "corporate-ai", authHeader: true },
        providerAuth.ok
          ? {
              ok: true,
              apiKey: providerAuth.apiKey ?? "",
              authorization: providerAuth.headers?.Authorization ?? "",
              sharedHeader: providerAuth.headers?.["x-shared"] ?? "",
              providerHeader: providerAuth.headers?.["x-provider"] ?? "",
              modelHeader: providerAuth.headers?.["x-model"] ?? "",
              storedHeader: providerAuth.headers?.["x-stored"] ?? "",
            }
          : { ok: false, apiKey: "", authorization: "", sharedHeader: "", providerHeader: "", modelHeader: "", storedHeader: "" },
        "ModelRegistry.getApiKeyAndHeaders prefers auth storage/provider API key, merges model headers then provider headers then stored model headers, and adds Authorization when authHeader is enabled.",
      ),
      providerCase(
        "anthropic-stream-projects-text-stop-usage-cost",
        { provider: anthropicProjection.provider, responseID: anthropicProjection.responseID },
        {
          eventTypes: anthropicProjection.eventTypes,
          contentKinds: anthropicProjection.contentKinds,
          text: anthropicProjection.text,
          stopReason: anthropicProjection.stopReason,
          input: anthropicProjection.usage.input,
          output: anthropicProjection.usage.output,
          cacheRead: anthropicProjection.usage.cacheRead,
          cacheWrite: anthropicProjection.usage.cacheWrite,
          totalTokens: anthropicProjection.usage.totalTokens,
          costTotal: anthropicProjection.usage.cost.total,
        },
        "streamAnthropic projects message_start/content_block_delta/content_block_stop/message_delta into start/text delta/text end/done events, maps end_turn to stop, preserves cache usage, and calculates model cost from per-million rates.",
      ),
      providerCase(
        "openai-responses-stream-projects-text-cache-usage-cost",
        { provider: openAIResponsesProjection.provider, responseID: openAIResponsesProjection.responseID },
        {
          eventTypes: openAIResponsesProjection.eventTypes,
          contentKinds: openAIResponsesProjection.contentKinds,
          text: openAIResponsesProjection.text,
          stopReason: openAIResponsesProjection.stopReason,
          input: openAIResponsesProjection.usage.input,
          output: openAIResponsesProjection.usage.output,
          cacheRead: openAIResponsesProjection.usage.cacheRead,
          totalTokens: openAIResponsesProjection.usage.totalTokens,
          costTotal: openAIResponsesProjection.usage.cost.total,
        },
        "processResponsesStream projects response output item deltas into text events, subtracts cached input tokens, maps completed to stop, calculates cost, and applies priority service-tier pricing for gpt-5.5.",
      ),
      providerCase(
        "transport-options-pass-timeout-retry-signal",
        { transport: String(transportProjection.transport), cacheRetention: String(transportProjection.cacheRetention), sessionId: String(transportProjection.sessionId) },
        {
          requestOptionKeys: transportProjection.requestOptionKeys,
          baseOptionKeys: transportProjection.baseOptionKeys,
          timeout: Number(transportProjection.timeout),
          maxRetries: Number(transportProjection.maxRetries),
          maxRetryDelayMs: Number(transportProjection.maxRetryDelayMs),
          hasSignal: transportProjection.hasSignal,
        },
        "streamAnthropic and streamOpenAIResponses pass signal, timeoutMs, and maxRetries into SDK request options while buildBaseOptions preserves transport, cache retention, session ID, headers, and maxRetryDelayMs.",
      ),
      providerCase(
        "extension-runtime-queues-and-unregisters-by-name",
        { extensionPath: "/extensions/provider.ts", registered: ["corporate-ai", "temporary-ai"], unregistered: "temporary-ai" },
        { pendingNames: runtime.pendingProviderRegistrations.map((registration) => registration.name), pendingCount: runtime.pendingProviderRegistrations.length },
        "createExtensionRuntime queues provider registrations before bindCore and unregisterProvider removes queued registrations matching the provider name.",
      ),
      providerCase(
        "session-services-flushes-pending-registrations-and-diagnostics",
        { pendingNames: ["ok-ai", "bad-ai"] },
        {
          registered,
          diagnostics: diagnostics.map((diagnostic) => diagnostic.message),
          pendingAfterFlush: flushRuntime.pendingProviderRegistrations.length,
        },
        "createAgentSessionServices flushes pending provider registrations into ModelRegistry, records extension-scoped diagnostics for failures, then clears the pending queue.",
      ),
    ],
    sourceRefs: [
      `${piMonoProviderUpstreamRef}:packages/coding-agent/src/core/extensions/types.ts#ProviderConfig,ProviderModelConfig,ExtensionRuntimeState`,
      `${piMonoProviderUpstreamRef}:packages/coding-agent/src/core/extensions/loader.ts#createExtensionRuntime,createExtensionAPI,loadExtensionFromFactory`,
      `${piMonoProviderUpstreamRef}:packages/coding-agent/src/core/agent-session-services.ts#createAgentSessionServices`,
      `${piMonoProviderUpstreamRef}:packages/coding-agent/src/core/model-registry.ts#ModelRegistry.registerProvider,ModelRegistry.validateProviderConfig,ModelRegistry.applyProviderConfig,ModelRegistry.getApiKeyAndHeaders`,
      `${piMonoProviderUpstreamRef}:packages/ai/src/providers/simple-options.ts#buildBaseOptions`,
      `${piMonoProviderUpstreamRef}:packages/ai/src/providers/anthropic.ts#streamAnthropic,iterateAnthropicEvents,mapStopReason`,
      `${piMonoProviderUpstreamRef}:packages/ai/src/providers/openai-responses.ts#streamOpenAIResponses,createClient,buildParams`,
      `${piMonoProviderUpstreamRef}:packages/ai/src/providers/openai-responses-shared.ts#processResponsesStream`,
      `${piMonoProviderUpstreamRef}:packages/ai/src/models.ts#calculateCost`,
      `${piMonoProviderUpstreamRef}:packages/ai/src/api-registry.ts#registerApiProvider,unregisterApiProviders,clearApiProviders`,
      `${piMonoProviderUpstreamRef}:packages/ai/src/types.ts#StreamOptions,SimpleStreamOptions,ProviderResponse`,
    ],
    nativeEvidenceRefs: [piMonoProviderDescriptorNativeExactEvidenceRef, piMonoProviderDescriptorNativeExactReplayRef],
    fixtureIDs: [piMonoProviderDescriptorNativeExactFixtureID],
    knownLossiness: [] as string[],
    descriptors: piMonoProviderNativeDescriptors.map((descriptor) => ({ ...descriptor })),
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoProviderDescriptorNativeExactFixture(
  fixture: PiMonoProviderDescriptorNativeExactFixture,
): PiMonoProviderDescriptorNativeExactVerification {
  const canonical = buildPiMonoProviderDescriptorNativeExactFixture()
  const issues: PiMonoProviderDescriptorNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-provider-descriptor-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi provider descriptor behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-provider-descriptor-native-exact.native-claim", message: "Pi provider descriptor fixture must remain a native-exact parity claim." })
  }
  if (JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    issues.push({ id: "pi-provider-descriptor-native-exact.identity", message: "Pi provider descriptor fixture must cover auth, event observer, stream descriptor, model registry, parser observer, request shape, transport, and usage atoms." })
  }
  if (
    fixture.upstreamRef !== piMonoProviderUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("model-registry.ts#ModelRegistry.registerProvider")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("providers/simple-options.ts#buildBaseOptions")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("providers/anthropic.ts#streamAnthropic")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("providers/openai-responses-shared.ts#processResponsesStream")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("extensions/loader.ts#createExtensionRuntime,createExtensionAPI"))
  ) {
    issues.push({ id: "pi-provider-descriptor-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream provider registry, request options, and extension runtime sources." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoProviderDescriptorNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoProviderDescriptorNativeExactReplayRef)) {
    issues.push({ id: "pi-provider-descriptor-native-exact.evidence", message: "Pi provider descriptor native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoProviderDescriptorNativeExactFixtureID)) {
    issues.push({ id: "pi-provider-descriptor-native-exact.fixture", message: "Pi provider descriptor native exact fixture ID is missing." })
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "pi-provider-descriptor-native-exact.lossiness", message: "Native exact Pi provider descriptor fixture must not carry known lossiness markers." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-provider-descriptor-native-exact.policy", message: "Pi provider descriptor policy drifted from upstream provider behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-provider-descriptor-native-exact.cases", message: "Pi provider descriptor cases drifted from the native exact fixture." })
  }
  if (JSON.stringify(fixture.descriptors) !== JSON.stringify(canonical.descriptors)) {
    issues.push({ id: "pi-provider-descriptor-native-exact.descriptors", message: "Pi provider descriptor native descriptors drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function emptyUsage(): PiMonoProviderUsage {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  }
}

function mapPiMonoAnthropicStopReason(reason: string): PiMonoProviderProjectedStopReason {
  switch (reason) {
    case "end_turn":
    case "pause_turn":
    case "stop_sequence":
      return "stop"
    case "max_tokens":
      return "length"
    case "tool_use":
      return "toolUse"
    case "refusal":
    case "sensitive":
      return "error"
    default:
      throw new Error(`Unhandled stop reason: ${reason}`)
  }
}

function mapPiMonoOpenAIResponsesStopReason(status: "completed" | "incomplete" | "failed" | "cancelled" | "in_progress" | "queued" | undefined): PiMonoProviderProjectedStopReason {
  switch (status) {
    case undefined:
    case "completed":
    case "in_progress":
    case "queued":
      return "stop"
    case "incomplete":
      return "length"
    case "failed":
    case "cancelled":
      return "error"
    default: {
      const exhaustive: never = status
      throw new Error(`Unhandled stop reason: ${exhaustive}`)
    }
  }
}

function applyPiMonoOpenAIServiceTierPricing(
  usage: PiMonoProviderUsage,
  serviceTier: "auto" | "default" | "flex" | "priority" | null | undefined,
  model: Pick<PiMonoProviderModel, "id">,
): void {
  const multiplier =
    serviceTier === "flex"
      ? 0.5
      : serviceTier === "priority"
        ? model.id === "gpt-5.5" ? 2.5 : 2
        : 1
  if (multiplier === 1) return
  usage.cost.input *= multiplier
  usage.cost.output *= multiplier
  usage.cost.cacheRead *= multiplier
  usage.cost.cacheWrite *= multiplier
  usage.cost.total = usage.cost.input + usage.cost.output + usage.cost.cacheRead + usage.cost.cacheWrite
}

function piMonoProviderNativeDescriptor(
  id: PiMonoProviderNativeExactAtomID,
  port: PiMonoProviderPortID,
  selectionReason: string,
): PiMonoProviderNativeDescriptor {
  return {
    id,
    port,
    product: "pi-mono",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoProviderDescriptorNativeExactEvidenceRef, piMonoProviderDescriptorNativeExactReplayRef],
    fixtureIDs: [piMonoProviderDescriptorNativeExactFixtureID],
    knownLossiness: [],
  }
}

function providerCase(
  scenarioID: PiMonoProviderNativeExactScenarioID,
  input: PiMonoProviderNativeExactCase["input"],
  output: PiMonoProviderNativeExactCase["output"],
  upstreamBehavior: string,
): PiMonoProviderNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function sampleProviderConfig(): PiMonoProviderConfig {
  return {
    name: "Corporate AI",
    baseUrl: "https://ai.corp.example/v1",
    apiKey: "CORPORATE_AI_KEY",
    api: "anthropic-messages",
    headers: { "x-provider": "corporate" },
    authHeader: true,
    models: [
      {
        id: "claude-proxy",
        name: "Claude Proxy",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 200000,
        maxTokens: 16384,
        headers: { "x-model": "claude-proxy" },
      },
      {
        id: "responses-proxy",
        name: "Responses Proxy",
        api: "openai-responses",
        baseUrl: "https://responses.corp.example/v1",
        reasoning: true,
        input: ["text"],
        cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 0.2 },
        contextWindow: 128000,
        maxTokens: 8192,
        compat: { supportsLongCacheRetention: true },
      },
    ],
  }
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
