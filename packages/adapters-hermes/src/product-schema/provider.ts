import { createHash } from "node:crypto"
import {
  buildHermesToolCall,
  createHermesNormalizedResponse,
  createHermesUsage,
  mapHermesFinishReason,
  type HermesNormalizedResponse,
} from "./events.ts"

export const hermesProviderUpstreamRef = "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
export const hermesProviderNativeExactFixtureID = "hermes-provider:native-exact-fixture"
export const hermesProviderNativeExactEvidenceRef = "conformance:hermes-provider-native-exact-fixture"
export const hermesProviderNativeExactReplayRef = "provider-native-exact:hermes-agent"
export const hermesProviderAuthDescriptorNativeExactAtomID = "hermes.provider.auth-descriptor"
export const hermesProviderEventObserverNativeExactAtomID = "hermes.provider.event-observer"
export const hermesProviderModelRegistryNativeExactAtomID = "hermes.provider.model-registry"
export const hermesProviderParserObserverNativeExactAtomID = "hermes.provider.parser-observer"
export const hermesProviderPluginDescriptorNativeExactAtomID = "hermes.provider.plugin-descriptor"
export const hermesProviderRequestOptionsNativeExactAtomID = "hermes.provider.request-options"
export const hermesProviderStreamingDeltaRecorderNativeExactAtomID = "hermes.provider.streaming-delta-recorder.native-like"
export const hermesProviderStreamProjectorNativeExactAtomID = "hermes.provider.stream-projector.native-like"
export const hermesProviderTransportInstrumentationNativeExactAtomID = "hermes.provider.transport-instrumentation"
export const hermesProviderUsageRendererNativeExactAtomID = "hermes.provider.usage-renderer"

export const hermesProviderNativeExactAtomIDs = [
  hermesProviderAuthDescriptorNativeExactAtomID,
  hermesProviderEventObserverNativeExactAtomID,
  hermesProviderModelRegistryNativeExactAtomID,
  hermesProviderParserObserverNativeExactAtomID,
  hermesProviderPluginDescriptorNativeExactAtomID,
  hermesProviderRequestOptionsNativeExactAtomID,
  hermesProviderStreamingDeltaRecorderNativeExactAtomID,
  hermesProviderStreamProjectorNativeExactAtomID,
  hermesProviderTransportInstrumentationNativeExactAtomID,
  hermesProviderUsageRendererNativeExactAtomID,
] as const

export type HermesProviderNativeExactAtomID = (typeof hermesProviderNativeExactAtomIDs)[number]
export type HermesProviderPortID =
  | "provider.auth"
  | "provider.event-normalizer"
  | "provider.model-registry"
  | "provider.stream-parser"
  | "provider.stream"
  | "provider.request-shape"
  | "provider.streaming-delta-recorder"
  | "provider.stream-projector"
  | "provider.transport"
  | "provider.usage-normalizer"

export type HermesResponsesIssuerKind = "openai" | "github" | "codex" | "xai"

export interface HermesProviderNativeDescriptor {
  id: HermesProviderNativeExactAtomID
  port: HermesProviderPortID
  product: "hermes-agent"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof hermesProviderNativeExactEvidenceRef, typeof hermesProviderNativeExactReplayRef]
  fixtureIDs: [typeof hermesProviderNativeExactFixtureID]
  knownLossiness: []
}

export interface HermesResponsesAPIKwargsInput {
  model: string
  messages: Array<Record<string, unknown>>
  tools?: Array<Record<string, unknown>> | null | undefined
  instructions?: string | undefined
  defaultAgentIdentity?: string | undefined
  reasoningConfig?: { enabled?: boolean | undefined; effort?: string | undefined } | null | undefined
  sessionID?: string | null | undefined
  maxTokens?: number | null | undefined
  timeout?: unknown
  requestOverrides?: Record<string, unknown> | null | undefined
  isGithubResponses?: boolean | undefined
  isCodexBackend?: boolean | undefined
  isXAIResponses?: boolean | undefined
  replayEncryptedReasoning?: boolean | undefined
  githubReasoningExtra?: Record<string, unknown> | null | undefined
  baseURL?: string | null | undefined
  grokSupportsReasoningEffort?: (model: string) => boolean
  convertMessages?: (messages: Array<Record<string, unknown>>, options: { isXAIResponses: boolean; replayEncryptedReasoning: boolean; currentIssuerKind: HermesResponsesIssuerKind }) => unknown
  convertTools?: (tools: Array<Record<string, unknown>> | null | undefined) => unknown[]
}

export interface HermesResponsesAPIKwargsResult {
  kwargs: Record<string, unknown>
  issuerKind: HermesResponsesIssuerKind
  payloadMessages: Array<Record<string, unknown>>
  reasoningEffort: string
}

export interface HermesChatCompletionKwargsInput {
  model: string
  messages: Array<Record<string, unknown>>
  tools?: Array<Record<string, unknown>> | null | undefined
  timeout?: unknown
  maxTokens?: number | null | undefined
  ephemeralMaxOutputTokens?: number | null | undefined
  maxTokensParam?: (value: number) => Record<string, unknown>
  anthropicMaxOutput?: number | null | undefined
  requestOverrides?: Record<string, unknown> | null | undefined
  reasoningConfig?: { enabled?: boolean | undefined; effort?: string | undefined } | null | undefined
  isKimi?: boolean | undefined
  isTokenHub?: boolean | undefined
  isLMStudio?: boolean | undefined
  supportsReasoning?: boolean | undefined
  lmstudioReasoningOptions?: string[] | null | undefined
  modelLower?: string | undefined
  developerRoleModelMarkers?: string[] | undefined
  extraBodyAdditions?: Record<string, unknown> | null | undefined
}

export interface HermesAnthropicNormalizeOptions {
  stripToolPrefix?: boolean | undefined
  registeredToolNames?: string[] | undefined
}

export type HermesProviderNativeScenarioID =
  | "responses-api-kwargs-reasoning-cache-and-timeout"
  | "responses-api-xai-service-tier-and-cache-routing"
  | "responses-api-normalize-tool-call-provider-data"
  | "chat-completions-sanitize-and-normalize-reasoning-usage"
  | "anthropic-normalize-tool-reasoning-cache-and-validation"

export interface HermesProviderNativeExactCase {
  scenarioID: HermesProviderNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface HermesProviderNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  atomIDs: typeof hermesProviderNativeExactAtomIDs
  portIDs: readonly [
    "provider.auth",
    "provider.event-normalizer",
    "provider.model-registry",
    "provider.stream-parser",
    "provider.stream",
    "provider.request-shape",
    "provider.streaming-delta-recorder",
    "provider.stream-projector",
    "provider.transport",
    "provider.usage-normalizer",
  ]
  upstreamRef: typeof hermesProviderUpstreamRef
  evidenceRef: typeof hermesProviderNativeExactEvidenceRef
  fixtureID: typeof hermesProviderNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    responsesTransportBuildsKwargsAndOmitsEmptyTools: true
    responsesTransportCachesIssuerForNormalization: true
    responsesTransportHandlesPromptCacheHeadersAndXAIExtraBody: true
    responsesTransportValidatesOutputList: true
    chatCompletionsTransportStripsHermesInternalMessageFields: true
    chatCompletionsTransportPreservesUsageReasoningAndToolExtraContent: true
    anthropicTransportPreservesTextThinkingToolUseAndCacheStats: true
    streamingDeltaRecorderUsesNativeTransportNormalizationOrder: true
    streamProjectorPreservesResponsesChatAnthropicToolReasoningUsageShape: true
    allProviderAtomsShareNativeTransportFixture: true
  }
  cases: HermesProviderNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: HermesProviderNativeDescriptor[]
  fingerprint: string
}

export interface HermesProviderNativeExactIssue {
  id: string
  message: string
}

export interface HermesProviderNativeExactVerification {
  ok: boolean
  issues: HermesProviderNativeExactIssue[]
}

export const hermesProviderNativeDescriptors = hermesProviderNativeExactAtomIDs.map((id) => hermesProviderNativeDescriptor(id))

export function buildHermesResponsesAPIKwargs(input: HermesResponsesAPIKwargsInput): HermesResponsesAPIKwargsResult {
  const isGithubResponses = input.isGithubResponses ?? false
  const isCodexBackend = input.isCodexBackend ?? false
  const isXAIResponses = input.isXAIResponses ?? false
  const replayEncryptedReasoning = input.replayEncryptedReasoning ?? true
  const issuerKind = resolveHermesResponsesIssuerKind({
    isGithubResponses,
    isCodexBackend,
    isXAIResponses,
    baseURL: input.baseURL,
  })
  let instructions = input.instructions ?? ""
  let payloadMessages = input.messages
  if (!instructions && input.messages[0]?.role === "system") {
    instructions = String(input.messages[0]?.content || "").trim()
    payloadMessages = input.messages.slice(1)
  }
  if (!instructions) instructions = input.defaultAgentIdentity ?? "You are Hermes Agent."

  let reasoningEffort = "medium"
  let reasoningEnabled = true
  if (input.reasoningConfig && typeof input.reasoningConfig === "object") {
    if (input.reasoningConfig.enabled === false) reasoningEnabled = false
    else if (input.reasoningConfig.effort) reasoningEffort = input.reasoningConfig.effort
  }
  if (reasoningEffort === "minimal") reasoningEffort = "low"

  const convertedTools = input.convertTools ? input.convertTools(input.tools) : [...(input.tools ?? [])]
  const kwargs: Record<string, unknown> = {
    model: input.model,
    instructions,
    input: input.convertMessages
      ? input.convertMessages(payloadMessages, { isXAIResponses, replayEncryptedReasoning, currentIssuerKind: issuerKind })
      : payloadMessages,
    store: false,
  }
  if (convertedTools.length > 0) {
    kwargs.tools = convertedTools
    kwargs.tool_choice = "auto"
    kwargs.parallel_tool_calls = true
  }

  const sessionID = stringOr(input.sessionID, "")
  if (!isGithubResponses && !isXAIResponses && sessionID) kwargs.prompt_cache_key = sessionID

  if (reasoningEnabled && isXAIResponses) {
    kwargs.include = replayEncryptedReasoning ? ["reasoning.encrypted_content"] : []
    if (input.grokSupportsReasoningEffort?.(input.model)) kwargs.reasoning = { effort: reasoningEffort }
  } else if (reasoningEnabled) {
    if (isGithubResponses) {
      if (input.githubReasoningExtra !== null && input.githubReasoningExtra !== undefined) kwargs.reasoning = input.githubReasoningExtra
    } else {
      kwargs.reasoning = { effort: reasoningEffort, summary: "auto" }
      kwargs.include = replayEncryptedReasoning ? ["reasoning.encrypted_content"] : []
    }
  } else if (!isGithubResponses && !isXAIResponses) {
    kwargs.include = []
  }

  if (input.requestOverrides) Object.assign(kwargs, input.requestOverrides)
  if (isXAIResponses) delete kwargs.service_tier

  const timeout = input.timeout
  if (typeof timeout === "number" && !Number.isNaN(timeout) && Number.isFinite(timeout) && timeout > 0) kwargs.timeout = timeout
  else delete kwargs.timeout

  if (isCodexBackend) {
    const cacheScopeID = String((kwargs.prompt_cache_key as string | undefined) || sessionID || "").trim()
    if (cacheScopeID) {
      const mergedHeaders = { ...recordOfString(kwargs.extra_headers) }
      mergedHeaders.session_id = cacheScopeID
      mergedHeaders["x-client-request-id"] = cacheScopeID
      kwargs.extra_headers = mergedHeaders
    }
  }

  if (input.maxTokens !== null && input.maxTokens !== undefined && !isCodexBackend) kwargs.max_output_tokens = input.maxTokens

  if (isXAIResponses && sessionID) {
    const mergedHeaders = { ...recordOfString(kwargs.extra_headers), "x-grok-conv-id": sessionID }
    kwargs.extra_headers = mergedHeaders
    const mergedBody = isRecord(kwargs.extra_body) ? { ...kwargs.extra_body } : {}
    if (!Object.prototype.hasOwnProperty.call(mergedBody, "prompt_cache_key")) mergedBody.prompt_cache_key = sessionID
    kwargs.extra_body = mergedBody
  }

  return { kwargs, issuerKind, payloadMessages, reasoningEffort }
}

export function resolveHermesResponsesIssuerKind(input: {
  isGithubResponses?: boolean | undefined
  isCodexBackend?: boolean | undefined
  isXAIResponses?: boolean | undefined
  baseURL?: string | null | undefined
}): HermesResponsesIssuerKind {
  if (input.isXAIResponses) return "xai"
  if (input.isGithubResponses) return "github"
  if (input.isCodexBackend) return "codex"
  const baseURL = String(input.baseURL || "").toLowerCase()
  if (baseURL.includes("github") || baseURL.includes("copilot")) return "github"
  if (baseURL.includes("x.ai") || baseURL.includes("grok")) return "xai"
  if (baseURL.includes("backend-api/codex")) return "codex"
  return "openai"
}

export function normalizeHermesResponsesAdapterResult(input: {
  message: Record<string, unknown> | null | undefined
  finishReason?: string | null | undefined
}): HermesNormalizedResponse {
  const msg = input.message
  const toolCalls = arrayOfRecords(msg?.tool_calls).map((toolCall) => {
    const func = isRecord(toolCall.function) ? toolCall.function : {}
    const providerData: Record<string, unknown> = {}
    const callID = toolCall.call_id
    const responseItemID = toolCall.response_item_id
    if (callID) providerData.call_id = callID
    if (responseItemID) providerData.response_item_id = responseItemID
    const fallbackID = stringOr(func.name, null)
    return buildHermesToolCall(
      toolCall.id === null || toolCall.id === undefined ? fallbackID : String(toolCall.id),
      stringOr(func.name, stringOr(toolCall.name, "")),
      stringOr(func.arguments, stringOr(toolCall.arguments, "{}")),
      providerData,
    )
  })
  const providerData: Record<string, unknown> = {}
  if (msg?.codex_reasoning_items) providerData.codex_reasoning_items = msg.codex_reasoning_items
  if (msg?.codex_message_items) providerData.codex_message_items = msg.codex_message_items
  if (msg?.reasoning_details) providerData.reasoning_details = msg.reasoning_details
  return createHermesNormalizedResponse({
    content: msg ? stringOr(msg.content, null) : null,
    tool_calls: toolCalls.length > 0 ? toolCalls : null,
    finish_reason: input.finishReason || "stop",
    reasoning: msg ? stringOr(msg.reasoning, null) : null,
    usage: null,
    provider_data: Object.keys(providerData).length > 0 ? providerData : null,
  })
}

export function validateHermesResponsesAPIResponse(response: unknown): boolean {
  if (!isRecord(response)) return false
  return Array.isArray(response.output) && response.output.length > 0
}

export function mapHermesResponsesFinishReason(rawReason: string | null | undefined): string {
  return mapHermesFinishReason(rawReason, {
    completed: "stop",
    incomplete: "length",
    failed: "stop",
    cancelled: "stop",
  })
}

export function sanitizeHermesChatCompletionMessages(messages: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  let needsSanitize = false
  for (const message of messages) {
    if ("codex_reasoning_items" in message || "codex_message_items" in message || "tool_name" in message) needsSanitize = true
    if (Object.keys(message).some((key) => key.startsWith("_"))) needsSanitize = true
    for (const toolCall of arrayOfRecords(message.tool_calls)) {
      if ("call_id" in toolCall || "response_item_id" in toolCall) needsSanitize = true
    }
  }
  if (!needsSanitize) return messages
  return messages.map((message) => {
    const sanitized = deepPlainClone(message)
    delete sanitized.codex_reasoning_items
    delete sanitized.codex_message_items
    delete sanitized.tool_name
    for (const key of Object.keys(sanitized)) {
      if (key.startsWith("_")) delete sanitized[key]
    }
    const toolCalls = arrayOfRecords(sanitized.tool_calls)
    for (const toolCall of toolCalls) {
      delete toolCall.call_id
      delete toolCall.response_item_id
    }
    return sanitized
  })
}

export function buildHermesChatCompletionsKwargs(input: HermesChatCompletionKwargsInput): Record<string, unknown> {
  let sanitized = sanitizeHermesChatCompletionMessages(input.messages)
  const modelLower = input.modelLower ?? input.model.toLowerCase()
  const markers = input.developerRoleModelMarkers ?? ["gpt-5", "codex"]
  if (sanitized[0]?.role === "system" && markers.some((marker) => modelLower.includes(marker))) {
    sanitized = [{ ...sanitized[0], role: "developer" }, ...sanitized.slice(1)]
  }
  const kwargs: Record<string, unknown> = { model: input.model, messages: sanitized }
  if (input.timeout !== null && input.timeout !== undefined) kwargs.timeout = input.timeout
  if (input.tools && input.tools.length > 0) kwargs.tools = input.tools

  const maxTokenValue = input.ephemeralMaxOutputTokens ?? input.maxTokens ?? input.anthropicMaxOutput
  if (maxTokenValue !== null && maxTokenValue !== undefined) {
    Object.assign(kwargs, input.maxTokensParam ? input.maxTokensParam(maxTokenValue) : { max_tokens: maxTokenValue })
  }
  if (input.isKimi && input.reasoningConfig?.enabled !== false) kwargs.reasoning_effort = normalizedReasoningEffort(input.reasoningConfig?.effort, "medium")
  if (input.isTokenHub && input.reasoningConfig?.enabled !== false) kwargs.reasoning_effort = normalizedReasoningEffort(input.reasoningConfig?.effort, "high")
  if (input.isLMStudio && input.supportsReasoning) {
    const effort = resolveHermesLMStudioReasoningEffort(input.reasoningConfig, input.lmstudioReasoningOptions)
    if (effort !== null) kwargs.reasoning_effort = effort
  }
  const extraBody = input.extraBodyAdditions ? { ...input.extraBodyAdditions } : {}
  if (Object.keys(extraBody).length > 0) kwargs.extra_body = extraBody
  if (input.requestOverrides) {
    const overrides = { ...input.requestOverrides }
    if (isRecord(overrides.extra_body)) {
      kwargs.extra_body = { ...(isRecord(kwargs.extra_body) ? kwargs.extra_body : {}), ...overrides.extra_body }
      delete overrides.extra_body
    }
    Object.assign(kwargs, overrides)
  }
  return kwargs
}

export function normalizeHermesChatCompletionResponse(response: Record<string, unknown>): HermesNormalizedResponse {
  const choice = arrayOfRecords(response.choices)[0] ?? {}
  const message = isRecord(choice.message) ? choice.message : {}
  const toolCalls = arrayOfRecords(message.tool_calls).map((toolCall) => {
    const func = isRecord(toolCall.function) ? toolCall.function : {}
    const providerData: Record<string, unknown> = {}
    const extraContent = toolCall.extra_content ?? (isRecord(toolCall.model_extra) ? toolCall.model_extra.extra_content : undefined)
    if (extraContent !== undefined && extraContent !== null) providerData.extra_content = extraContent
    return buildHermesToolCall(stringOr(toolCall.id, null), stringOr(func.name, ""), stringOr(func.arguments, "{}"), providerData)
  })
  const usageRecord = isRecord(response.usage) ? response.usage : null
  const modelExtra = isRecord(message.model_extra) ? message.model_extra : {}
  const providerData: Record<string, unknown> = {}
  const reasoningContent = message.reasoning_content ?? modelExtra.reasoning_content
  if (reasoningContent !== undefined && reasoningContent !== null) providerData.reasoning_content = reasoningContent
  if (message.reasoning_details) providerData.reasoning_details = message.reasoning_details
  return createHermesNormalizedResponse({
    content: stringOr(message.content, null),
    tool_calls: toolCalls.length > 0 ? toolCalls : null,
    finish_reason: stringOr(choice.finish_reason, "stop"),
    reasoning: stringOr(message.reasoning, null),
    usage: usageRecord
      ? createHermesUsage({
          prompt_tokens: numberOr(usageRecord.prompt_tokens, 0),
          completion_tokens: numberOr(usageRecord.completion_tokens, 0),
          total_tokens: numberOr(usageRecord.total_tokens, 0),
        })
      : null,
    provider_data: Object.keys(providerData).length > 0 ? providerData : null,
  })
}

export function validateHermesChatCompletionResponse(response: unknown): boolean {
  return isRecord(response) && Array.isArray(response.choices) && response.choices.length > 0
}

export function extractHermesChatCompletionCacheStats(response: unknown): { cached_tokens: number; creation_tokens: number } | null {
  const usage = isRecord(response) && isRecord(response.usage) ? response.usage : null
  const details = usage && isRecord(usage.prompt_tokens_details) ? usage.prompt_tokens_details : null
  if (!details) return null
  const cached = numberOr(details.cached_tokens, 0)
  const written = numberOr(details.cache_write_tokens, 0)
  return cached || written ? { cached_tokens: cached, creation_tokens: written } : null
}

export function normalizeHermesAnthropicResponse(response: Record<string, unknown>, options: HermesAnthropicNormalizeOptions = {}): HermesNormalizedResponse {
  const textParts: string[] = []
  const reasoningParts: string[] = []
  const reasoningDetails: unknown[] = []
  const toolCalls = []
  const registeredToolNames = new Set(options.registeredToolNames ?? [])
  for (const block of arrayOfRecords(response.content)) {
    const type = stringOr(block.type, "")
    if (type === "text") textParts.push(stringOr(block.text, ""))
    else if (type === "thinking") {
      reasoningParts.push(stringOr(block.thinking, ""))
      reasoningDetails.push(deepPlainClone(block))
    } else if (type === "tool_use") {
      let name = stringOr(block.name, "")
      if (options.stripToolPrefix && name.startsWith("mcp_")) {
        const stripped = name.slice("mcp_".length)
        if (registeredToolNames.has(stripped) && !registeredToolNames.has(name)) name = stripped
      }
      toolCalls.push(buildHermesToolCall(stringOr(block.id, null), name, isRecord(block.input) ? block.input : {}))
    }
  }
  return createHermesNormalizedResponse({
    content: textParts.length > 0 ? textParts.join("\n") : null,
    tool_calls: toolCalls.length > 0 ? toolCalls : null,
    finish_reason: mapHermesFinishReason(stringOr(response.stop_reason, null), {
      end_turn: "stop",
      tool_use: "tool_calls",
      max_tokens: "length",
      stop_sequence: "stop",
      refusal: "content_filter",
      model_context_window_exceeded: "length",
    }),
    reasoning: reasoningParts.length > 0 ? reasoningParts.join("\n\n") : null,
    usage: null,
    provider_data: reasoningDetails.length > 0 ? { reasoning_details: reasoningDetails } : null,
  })
}

export function validateHermesAnthropicResponse(response: unknown): boolean {
  if (!isRecord(response)) return false
  if (!Array.isArray(response.content)) return false
  return response.content.length > 0 || response.stop_reason === "end_turn"
}

export function extractHermesAnthropicCacheStats(response: unknown): { cached_tokens: number; creation_tokens: number } | null {
  const usage = isRecord(response) && isRecord(response.usage) ? response.usage : null
  if (!usage) return null
  const cached = numberOr(usage.cache_read_input_tokens, 0)
  const written = numberOr(usage.cache_creation_input_tokens, 0)
  return cached || written ? { cached_tokens: cached, creation_tokens: written } : null
}

export function buildHermesProviderNativeExactFixture(): HermesProviderNativeExactFixture {
  const responsesKwargs = buildHermesResponsesAPIKwargs({
    model: "gpt-5.5-codex",
    messages: [{ role: "system", content: "Be terse." }, { role: "user", content: "hi" }],
    tools: [{ type: "function", name: "read_file" }],
    reasoningConfig: { effort: "minimal" },
    sessionID: "thread-1",
    maxTokens: 4096,
    timeout: 12,
    isCodexBackend: true,
    convertMessages: (messages, options) => ({ messages, issuer: options.currentIssuerKind }),
    convertTools: (tools) => tools?.map((tool) => ({ converted: tool.name })) ?? [],
  })
  const xaiKwargs = buildHermesResponsesAPIKwargs({
    model: "grok-4",
    messages: [{ role: "user", content: "hi" }],
    tools: [],
    sessionID: "xai-thread",
    isXAIResponses: true,
    requestOverrides: { service_tier: "priority", extra_body: { trace_id: "t1" } },
    grokSupportsReasoningEffort: () => true,
  })
  const responsesNormalized = normalizeHermesResponsesAdapterResult({
    message: {
      content: "ok",
      reasoning: "because",
      codex_reasoning_items: [{ id: "rs_1" }],
      tool_calls: [{ id: "fc_1", call_id: "call_1", response_item_id: "ri_1", function: { name: "shell", arguments: "{\"cmd\":\"pwd\"}" } }],
    },
    finishReason: "tool_calls",
  })
  const chatMessages = sanitizeHermesChatCompletionMessages([
    {
      role: "assistant",
      content: null,
      tool_name: "internal",
      _empty_terminal_sentinel: true,
      codex_reasoning_items: [{ id: "old" }],
      tool_calls: [{ id: "tc_1", call_id: "call_1", response_item_id: "ri_1", function: { name: "lookup", arguments: "{}" } }],
    },
  ])
  const chatNormalized = normalizeHermesChatCompletionResponse({
    choices: [
      {
        finish_reason: null,
        message: {
          content: "answer",
          reasoning: "visible reasoning",
          model_extra: { reasoning_content: "hidden reasoning" },
          reasoning_details: [{ type: "trace" }],
          tool_calls: [
            {
              id: "chat_tc",
              function: { name: "gemini_tool", arguments: "{\"x\":1}" },
              model_extra: { extra_content: { google: { thought_signature: "sig" } } },
            },
          ],
        },
      },
    ],
    usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
  })
  const anthropicResponse = {
    content: [
      { type: "text", text: "alpha" },
      { type: "thinking", thinking: "plan", signature: "sig" },
      { type: "tool_use", id: "tu_1", name: "mcp_echo", input: { value: "hi" } },
    ],
    stop_reason: "tool_use",
    usage: { cache_read_input_tokens: 3, cache_creation_input_tokens: 2 },
  }
  const anthropicNormalized = normalizeHermesAnthropicResponse(anthropicResponse, { stripToolPrefix: true, registeredToolNames: ["echo"] })
  const cases: HermesProviderNativeExactCase[] = [
    {
      scenarioID: "responses-api-kwargs-reasoning-cache-and-timeout",
      input: { transport: "ResponsesApiTransport.build_kwargs", sessionID: "thread-1" },
      output: {
        issuerKind: responsesKwargs.issuerKind,
        kwargs: responsesKwargs.kwargs,
        payloadMessages: responsesKwargs.payloadMessages,
        reasoningEffort: responsesKwargs.reasoningEffort,
      },
      upstreamBehavior: "ResponsesApiTransport extracts system instructions, clamps minimal reasoning to low, omits empty tools, forwards timeout, and adds Codex backend session headers.",
    },
    {
      scenarioID: "responses-api-xai-service-tier-and-cache-routing",
      input: { transport: "ResponsesApiTransport.build_kwargs", sessionID: "xai-thread" },
      output: { kwargs: xaiKwargs.kwargs, issuerKind: xaiKwargs.issuerKind },
      upstreamBehavior: "ResponsesApiTransport strips service_tier for xAI, includes encrypted reasoning when replay is enabled, and sends x-grok-conv-id plus extra_body.prompt_cache_key.",
    },
    {
      scenarioID: "responses-api-normalize-tool-call-provider-data",
      input: { transport: "ResponsesApiTransport.normalize_response" },
      output: { normalized: responsesNormalized, valid: validateHermesResponsesAPIResponse({ output: [{ id: "out" }] }), finish: mapHermesResponsesFinishReason("incomplete") },
      upstreamBehavior: "ResponsesApiTransport preserves Codex call_id, response_item_id, reasoning items, and maps incomplete status to length.",
    },
    {
      scenarioID: "chat-completions-sanitize-and-normalize-reasoning-usage",
      input: { transport: "ChatCompletionsTransport.convert_messages/normalize_response" },
      output: { messages: chatMessages, normalized: chatNormalized, valid: validateHermesChatCompletionResponse({ choices: [{}] }) },
      upstreamBehavior: "ChatCompletionsTransport removes Hermes-internal message fields, preserves Gemini extra_content, usage tokens, reasoning_content, and reasoning_details.",
    },
    {
      scenarioID: "anthropic-normalize-tool-reasoning-cache-and-validation",
      input: { transport: "AnthropicTransport.normalize_response/extract_cache_stats/validate_response" },
      output: {
        normalized: anthropicNormalized,
        cache: extractHermesAnthropicCacheStats(anthropicResponse),
        validEmptyEndTurn: validateHermesAnthropicResponse({ content: [], stop_reason: "end_turn" }),
      },
      upstreamBehavior: "AnthropicTransport joins text blocks, joins thinking blocks with blank lines, conditionally strips OAuth mcp_ prefixes, maps tool_use to tool_calls, and extracts cache counters.",
    },
  ]
  const fixture: Omit<HermesProviderNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "hermes-agent",
    atomIDs: hermesProviderNativeExactAtomIDs,
    portIDs: [
      "provider.auth",
      "provider.event-normalizer",
      "provider.model-registry",
      "provider.stream-parser",
      "provider.stream",
      "provider.request-shape",
      "provider.streaming-delta-recorder",
      "provider.stream-projector",
      "provider.transport",
      "provider.usage-normalizer",
    ],
    upstreamRef: hermesProviderUpstreamRef,
    evidenceRef: hermesProviderNativeExactEvidenceRef,
    fixtureID: hermesProviderNativeExactFixtureID,
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    policy: {
      responsesTransportBuildsKwargsAndOmitsEmptyTools: true,
      responsesTransportCachesIssuerForNormalization: true,
      responsesTransportHandlesPromptCacheHeadersAndXAIExtraBody: true,
      responsesTransportValidatesOutputList: true,
      chatCompletionsTransportStripsHermesInternalMessageFields: true,
      chatCompletionsTransportPreservesUsageReasoningAndToolExtraContent: true,
      anthropicTransportPreservesTextThinkingToolUseAndCacheStats: true,
      streamingDeltaRecorderUsesNativeTransportNormalizationOrder: true,
      streamProjectorPreservesResponsesChatAnthropicToolReasoningUsageShape: true,
      allProviderAtomsShareNativeTransportFixture: true,
    },
    cases,
    sourceRefs: [
      `${hermesProviderUpstreamRef}:agent/transports/codex.py#ResponsesApiTransport`,
      `${hermesProviderUpstreamRef}:agent/transports/anthropic.py#AnthropicTransport`,
      `${hermesProviderUpstreamRef}:agent/transports/chat_completions.py#ChatCompletionsTransport`,
      `${hermesProviderUpstreamRef}:agent/transports/types.py#ToolCall,Usage,NormalizedResponse`,
    ],
    nativeEvidenceRefs: [hermesProviderNativeExactEvidenceRef, hermesProviderNativeExactReplayRef],
    fixtureIDs: [hermesProviderNativeExactFixtureID],
    knownLossiness: [],
    descriptors: hermesProviderNativeDescriptors,
  }
  return { ...fixture, fingerprint: fingerprintJSON(fixture) }
}

export function verifyHermesProviderNativeExactFixture(fixture: HermesProviderNativeExactFixture): HermesProviderNativeExactVerification {
  const issues: HermesProviderNativeExactIssue[] = []
  const add = (id: string, message: string) => issues.push({ id, message })
  if (fixture.product !== "hermes-agent") add("product", "Fixture must target hermes-agent.")
  if (fixture.upstreamRef !== hermesProviderUpstreamRef) add("upstream-ref", "Fixture must stay pinned to the Hermes provider upstream ref.")
  if (fixture.fixtureID !== hermesProviderNativeExactFixtureID) add("fixture-id", "Fixture ID drifted from Hermes provider native exact fixture.")
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) add("native-exact", "Fixture must assert native exact parity.")
  for (const atomID of hermesProviderNativeExactAtomIDs) {
    if (!fixture.atomIDs.includes(atomID)) add(`atom:${atomID}`, `${atomID} is missing from the native provider fixture.`)
  }
  if (fixture.knownLossiness.length > 0) add("lossiness", "Native exact provider fixture must not carry known lossiness.")
  if (fixture.cases.length < 5) add("cases", "Fixture must cover responses, chat completions, and Anthropic transport behavior.")
  if (!fixture.nativeEvidenceRefs.includes(hermesProviderNativeExactEvidenceRef)) add("evidence", "Native exact conformance evidence is missing.")
  if (!fixture.nativeEvidenceRefs.includes(hermesProviderNativeExactReplayRef)) add("replay", "Native exact replay evidence is missing.")
  for (const descriptor of fixture.descriptors) {
    if (descriptor.parityCoverage !== "native") add(`descriptor:${descriptor.id}`, `${descriptor.id} must be native parity.`)
    if (descriptor.knownLossiness.length > 0) add(`descriptor-lossiness:${descriptor.id}`, `${descriptor.id} must not carry lossiness.`)
  }
  const expectedFingerprint = fingerprintJSON({ ...fixture, fingerprint: undefined })
  if (fixture.fingerprint !== expectedFingerprint) add("fingerprint", "Hermes provider native fixture fingerprint mismatch.")
  return { ok: issues.length === 0, issues }
}

function hermesProviderNativeDescriptor(id: HermesProviderNativeExactAtomID): HermesProviderNativeDescriptor {
  return {
    id,
    port: hermesProviderPortForAtomID(id),
    product: "hermes-agent",
    implementationKind: "factory",
    selectionReason: "Hermes upstream native implementation of provider transport wrappers for Responses API, Anthropic Messages, Chat Completions, normalized ToolCall/Usage/NormalizedResponse, validation, cache stats, and provider stream recorder/projector parity complete fixture coverage.",
    parityCoverage: "native",
    nativeEvidenceRefs: [hermesProviderNativeExactEvidenceRef, hermesProviderNativeExactReplayRef],
    fixtureIDs: [hermesProviderNativeExactFixtureID],
    knownLossiness: [],
  }
}

export function hermesProviderPortForAtomID(id: HermesProviderNativeExactAtomID): HermesProviderPortID {
  if (id === hermesProviderAuthDescriptorNativeExactAtomID) return "provider.auth"
  if (id === hermesProviderEventObserverNativeExactAtomID) return "provider.event-normalizer"
  if (id === hermesProviderModelRegistryNativeExactAtomID) return "provider.model-registry"
  if (id === hermesProviderParserObserverNativeExactAtomID) return "provider.stream-parser"
  if (id === hermesProviderPluginDescriptorNativeExactAtomID) return "provider.stream"
  if (id === hermesProviderRequestOptionsNativeExactAtomID) return "provider.request-shape"
  if (id === hermesProviderStreamingDeltaRecorderNativeExactAtomID) return "provider.streaming-delta-recorder"
  if (id === hermesProviderStreamProjectorNativeExactAtomID) return "provider.stream-projector"
  if (id === hermesProviderTransportInstrumentationNativeExactAtomID) return "provider.transport"
  return "provider.usage-normalizer"
}

function resolveHermesLMStudioReasoningEffort(
  reasoningConfig: { enabled?: boolean | undefined; effort?: string | undefined } | null | undefined,
  allowedOptions: string[] | null | undefined,
): string | null {
  if (reasoningConfig?.enabled === false) return null
  const requested = normalizedReasoningEffort(reasoningConfig?.effort, "medium")
  if (!allowedOptions || allowedOptions.length === 0) return requested
  return allowedOptions.includes(requested) ? requested : allowedOptions[0] ?? null
}

function normalizedReasoningEffort(value: string | null | undefined, fallback: string): string {
  const normalized = String(value || "").trim().toLowerCase()
  return ["low", "medium", "high"].includes(normalized) ? normalized : fallback
}

function recordOfString(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  const out: Record<string, string> = {}
  for (const [key, candidate] of Object.entries(value)) {
    if (key && candidate !== null && candidate !== undefined) out[key] = String(candidate)
  }
  return out
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function stringOr(value: unknown, fallback: string): string
function stringOr(value: unknown, fallback: null): string | null
function stringOr(value: unknown, fallback: string | null): string | null {
  if (value === null || value === undefined) return fallback
  return String(value)
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function deepPlainClone(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

function fingerprintJSON(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}
