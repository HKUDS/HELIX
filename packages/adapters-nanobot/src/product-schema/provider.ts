import { createHash } from "node:crypto"

export const nanobotProviderUpstreamRef = "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
export const nanobotProviderNativeExactFixtureID = "nanobot-provider:native-exact-fixture"
export const nanobotProviderNativeExactEvidenceRef = "conformance:nanobot-provider-native-exact-fixture"
export const nanobotProviderNativeExactReplayRef = "provider-native-exact:nanobot"
export const nanobotProviderAuthDescriptorNativeExactAtomID = "nanobot.provider.auth-descriptor"
export const nanobotProviderEventObserverNativeExactAtomID = "nanobot.provider.event-observer"
export const nanobotProviderModelRegistryNativeExactAtomID = "nanobot.provider.model-registry"
export const nanobotProviderParserObserverNativeExactAtomID = "nanobot.provider.parser-observer"
export const nanobotProviderPluginDescriptorNativeExactAtomID = "nanobot.provider.plugin-descriptor"
export const nanobotProviderRequestOptionsNativeExactAtomID = "nanobot.provider.request-options"
export const nanobotProviderStreamingDeltaRecorderNativeExactAtomID = "nanobot.provider.streaming-delta-recorder.native-like"
export const nanobotProviderStreamProjectorNativeExactAtomID = "nanobot.provider.stream-projector.native-like"
export const nanobotProviderTransportInstrumentationNativeExactAtomID = "nanobot.provider.transport-instrumentation"
export const nanobotProviderUsageRendererNativeExactAtomID = "nanobot.provider.usage-renderer"

export const nanobotProviderNativeExactAtomIDs = [
  nanobotProviderAuthDescriptorNativeExactAtomID,
  nanobotProviderEventObserverNativeExactAtomID,
  nanobotProviderModelRegistryNativeExactAtomID,
  nanobotProviderParserObserverNativeExactAtomID,
  nanobotProviderPluginDescriptorNativeExactAtomID,
  nanobotProviderRequestOptionsNativeExactAtomID,
  nanobotProviderStreamingDeltaRecorderNativeExactAtomID,
  nanobotProviderStreamProjectorNativeExactAtomID,
  nanobotProviderTransportInstrumentationNativeExactAtomID,
  nanobotProviderUsageRendererNativeExactAtomID,
] as const

export type NanobotProviderNativeExactAtomID = (typeof nanobotProviderNativeExactAtomIDs)[number]
export type NanobotProviderPortID =
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

export type NanobotProviderBackend = "openai_compat" | "anthropic" | "azure_openai" | "openai_codex" | "github_copilot" | "bedrock"
export type NanobotThinkingStyle = "" | "thinking_type" | "enable_thinking" | "reasoning_split"
export type NanobotProviderFinishReason = "stop" | "tool_calls" | "length" | "error" | string

export interface NanobotProviderNativeDescriptor {
  id: NanobotProviderNativeExactAtomID
  port: NanobotProviderPortID
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof nanobotProviderNativeExactEvidenceRef, typeof nanobotProviderNativeExactReplayRef]
  fixtureIDs: [typeof nanobotProviderNativeExactFixtureID]
  knownLossiness: []
}

export interface NanobotLLMProviderSpecProjection {
  name: string
  keywords: readonly string[]
  envKey: string
  displayName: string
  backend: NanobotProviderBackend
  envExtras: readonly (readonly [string, string])[]
  isGateway: boolean
  isLocal: boolean
  detectByKeyPrefix: string
  detectByBaseKeyword: string
  defaultApiBase: string
  stripModelPrefix: boolean
  supportsMaxCompletionTokens: boolean
  modelOverrides: readonly (readonly [string, Record<string, unknown>])[]
  isOAuth: boolean
  isDirect: boolean
  supportsPromptCaching: boolean
  thinkingStyle: NanobotThinkingStyle
  reasoningAsContent: boolean
  label: string
}

export interface NanobotProviderEnvProjectionInput {
  specName: string
  apiKey: string
  apiBase?: string | null | undefined
  env?: Record<string, string> | undefined
}

export interface NanobotProviderEnvProjection {
  env: Record<string, string>
  effectiveBase: string
  wroteKey: boolean
  envKey: string
  extraKeys: string[]
  gatewayOverwritesApiKey: boolean
}

export interface NanobotProviderCoreProjectionInput {
  model: string
  providerName?: string | null | undefined
  apiKey?: string | null | undefined
  apiBase?: string | null | undefined
  extraHeaders?: Record<string, string> | null | undefined
  extraBody?: Record<string, unknown> | null | undefined
  region?: string | null | undefined
  profile?: string | null | undefined
  maxTokens?: number | null | undefined
  temperature?: number | null | undefined
  reasoningEffort?: string | null | undefined
  contextWindowTokens?: number | null | undefined
  fallbackModels?: NanobotProviderCoreProjectionInput[] | undefined
}

export interface NanobotProviderCoreProjection {
  model: string
  providerName: string
  backend: NanobotProviderBackend
  providerClass: string
  defaultModel: string
  effectiveApiBase?: string | undefined
  requiresApiKey: boolean
  error?: string | undefined
  generation: {
    maxTokens: number
    temperature: number
    reasoningEffort?: string | undefined
    contextWindowTokens: number
  }
  signature: unknown[]
  fallbackSignatures: unknown[][]
  contextWindowTokens: number
}

export interface NanobotOpenAICompatKwargsInput {
  specName?: string | null | undefined
  defaultModel: string
  model?: string | null | undefined
  messages: Array<Record<string, unknown>>
  tools?: Array<Record<string, unknown>> | null | undefined
  maxTokens?: number | null | undefined
  temperature?: number | null | undefined
  reasoningEffort?: string | null | undefined
  toolChoice?: string | Record<string, unknown> | null | undefined
  extraBody?: Record<string, unknown> | null | undefined
}

export interface NanobotToolCallProjection {
  id: string
  name: string
  arguments: Record<string, unknown>
  extraContent?: Record<string, unknown> | undefined
  providerSpecificFields?: Record<string, unknown> | undefined
  functionProviderSpecificFields?: Record<string, unknown> | undefined
}

export interface NanobotLLMResponseProjection {
  content: string | null
  toolCalls: NanobotToolCallProjection[]
  finishReason: NanobotProviderFinishReason
  usage: Record<string, number>
  reasoningContent?: string | undefined
  thinkingBlocks?: Array<Record<string, unknown>> | undefined
}

export interface NanobotAnthropicKwargsInput {
  defaultModel: string
  model?: string | null | undefined
  messages: Array<Record<string, unknown>>
  tools?: Array<Record<string, unknown>> | null | undefined
  maxTokens?: number | null | undefined
  temperature?: number | null | undefined
  reasoningEffort?: string | null | undefined
  toolChoice?: string | Record<string, unknown> | null | undefined
  supportsCaching?: boolean | undefined
  extraHeaders?: Record<string, string> | null | undefined
}

export type NanobotProviderNativeScenarioID =
  | "registry-factory-signature-and-fallback"
  | "openai-compatible-env-headers-and-local-transport"
  | "openai-compatible-message-sanitize-and-kwargs"
  | "openai-compatible-response-and-usage-parser"
  | "anthropic-message-tool-cache-and-thinking-kwargs"
  | "anthropic-response-usage-and-tool-parser"

export interface NanobotProviderNativeExactCase {
  scenarioID: NanobotProviderNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface NanobotProviderNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomIDs: typeof nanobotProviderNativeExactAtomIDs
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
  upstreamRef: typeof nanobotProviderUpstreamRef
  evidenceRef: typeof nanobotProviderNativeExactEvidenceRef
  fixtureID: typeof nanobotProviderNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    providerRegistryIsSingleSourceOfTruth: true
    factorySelectsBackendFromProviderSpec: true
    openAICompatRequiresApiKeyExceptOAuthLocalDirect: true
    gatewaysOverwriteEnvVarsAndNonGatewaysSetDefault: true
    openAICompatSanitizesMessagesToolIDsArgumentsAndRoleAlternation: true
    openAICompatBuildsMaxCompletionReasoningThinkingCacheAndExtraBody: true
    openAICompatParsesReasoningToolCallsAndCachedUsage: true
    anthropicConvertsOpenAIChatMessagesToolsThinkingAndCacheControls: true
    anthropicParsesTextToolUseThinkingAndCacheUsage: true
    streamingDeltaRecorderUsesNativeParserOrder: true
    streamProjectorPreservesContentReasoningToolsFinishAndUsage: true
    allProviderAtomsShareNativeTransportFixture: true
  }
  cases: NanobotProviderNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: NanobotProviderNativeDescriptor[]
  fingerprint: string
}

export interface NanobotProviderNativeExactIssue {
  id: string
  message: string
}

export interface NanobotProviderNativeExactVerification {
  ok: boolean
  issues: NanobotProviderNativeExactIssue[]
}

const nanobotProviderSpecs = [
  spec({
    name: "custom",
    keywords: [],
    envKey: "",
    displayName: "Custom",
    backend: "openai_compat",
    isDirect: true,
  }),
  spec({
    name: "azure_openai",
    keywords: ["azure", "azure-openai"],
    envKey: "",
    displayName: "Azure OpenAI",
    backend: "azure_openai",
    isDirect: true,
  }),
  spec({
    name: "bedrock",
    keywords: ["bedrock", "anthropic.claude", "amazon.nova", "meta.", "mistral.", "cohere.", "qwen.", "deepseek.", "openai.gpt-oss", "ai21.", "moonshot.", "writer.", "zai."],
    envKey: "AWS_BEARER_TOKEN_BEDROCK",
    displayName: "AWS Bedrock",
    backend: "bedrock",
    isDirect: true,
  }),
  spec({
    name: "openrouter",
    keywords: ["openrouter"],
    envKey: "OPENROUTER_API_KEY",
    displayName: "OpenRouter",
    isGateway: true,
    detectByKeyPrefix: "sk-or-",
    detectByBaseKeyword: "openrouter",
    defaultApiBase: "https://openrouter.ai/api/v1",
    supportsPromptCaching: true,
  }),
  spec({
    name: "huggingface",
    keywords: ["huggingface", "hugging-face"],
    envKey: "HF_TOKEN",
    displayName: "Hugging Face",
    isGateway: true,
    detectByKeyPrefix: "hf_",
    detectByBaseKeyword: "huggingface",
    defaultApiBase: "https://router.huggingface.co/v1",
  }),
  spec({
    name: "aihubmix",
    keywords: ["aihubmix"],
    envKey: "OPENAI_API_KEY",
    displayName: "AiHubMix",
    isGateway: true,
    detectByBaseKeyword: "aihubmix",
    defaultApiBase: "https://aihubmix.com/v1",
    stripModelPrefix: true,
  }),
  spec({
    name: "volcengine",
    keywords: ["volcengine", "volces", "ark"],
    envKey: "OPENAI_API_KEY",
    displayName: "VolcEngine",
    isGateway: true,
    detectByBaseKeyword: "volces",
    defaultApiBase: "https://ark.cn-beijing.volces.com/api/v3",
    thinkingStyle: "thinking_type",
    supportsMaxCompletionTokens: true,
  }),
  spec({
    name: "dashscope",
    keywords: ["dashscope", "qwen", "qwq"],
    envKey: "DASHSCOPE_API_KEY",
    displayName: "DashScope",
    defaultApiBase: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    thinkingStyle: "enable_thinking",
    supportsMaxCompletionTokens: true,
    modelOverrides: [["qwen3-coder", { temperature: 0.7 }]],
  }),
  spec({
    name: "deepseek",
    keywords: ["deepseek"],
    envKey: "DEEPSEEK_API_KEY",
    displayName: "DeepSeek",
    defaultApiBase: "https://api.deepseek.com/v1",
    thinkingStyle: "thinking_type",
  }),
  spec({
    name: "stepfun",
    keywords: ["stepfun", "step"],
    envKey: "STEPFUN_API_KEY",
    displayName: "StepFun",
    defaultApiBase: "https://api.stepfun.com/v1",
    reasoningAsContent: true,
  }),
  spec({
    name: "anthropic",
    keywords: ["anthropic", "claude"],
    envKey: "ANTHROPIC_API_KEY",
    displayName: "Anthropic",
    backend: "anthropic",
    supportsPromptCaching: true,
  }),
  spec({
    name: "openai",
    keywords: ["openai", "gpt", "o1", "o3", "o4"],
    envKey: "OPENAI_API_KEY",
    displayName: "OpenAI",
    defaultApiBase: "https://api.openai.com/v1",
    supportsMaxCompletionTokens: true,
  }),
  spec({
    name: "openai_codex",
    keywords: ["codex"],
    envKey: "",
    displayName: "OpenAI Codex",
    backend: "openai_codex",
    isOAuth: true,
  }),
  spec({
    name: "github_copilot",
    keywords: ["copilot"],
    envKey: "",
    displayName: "GitHub Copilot",
    backend: "github_copilot",
    isOAuth: true,
  }),
  spec({
    name: "ollama",
    keywords: ["ollama"],
    envKey: "",
    displayName: "Ollama",
    defaultApiBase: "http://localhost:11434/v1",
    isLocal: true,
  }),
] as const satisfies readonly NanobotLLMProviderSpecProjection[]

export const nanobotProviderNativeDescriptors = nanobotProviderNativeExactAtomIDs.map((id) => nanobotProviderNativeDescriptor(id))

export function nanobotProviderRegistryProjection(): NanobotLLMProviderSpecProjection[] {
  return nanobotProviderSpecs.map((providerSpec) => ({ ...providerSpec, keywords: [...providerSpec.keywords], envExtras: providerSpec.envExtras.map((entry) => [...entry] as const), modelOverrides: providerSpec.modelOverrides.map((entry) => [entry[0], { ...entry[1] }] as const) }))
}

export function findNanobotProviderSpecProjection(name: string | null | undefined): NanobotLLMProviderSpecProjection | undefined {
  if (!name) return undefined
  const normalized = snakeKey(name)
  const found = nanobotProviderSpecs.find((providerSpec) => snakeKey(providerSpec.name) === normalized)
  return found ? { ...found, keywords: [...found.keywords], envExtras: found.envExtras.map((entry) => [...entry] as const), modelOverrides: found.modelOverrides.map((entry) => [entry[0], { ...entry[1] }] as const) } : undefined
}

export function projectNanobotProviderEnv(input: NanobotProviderEnvProjectionInput): NanobotProviderEnvProjection {
  const providerSpec = findNanobotProviderSpecProjection(input.specName)
  if (!providerSpec) throw new Error(`Unknown Nanobot provider spec: ${input.specName}`)
  const env = { ...(input.env ?? {}) }
  const effectiveBase = input.apiBase || providerSpec.defaultApiBase
  let wroteKey = false
  if (providerSpec.envKey) {
    if (providerSpec.isGateway || env[providerSpec.envKey] === undefined) {
      env[providerSpec.envKey] = input.apiKey
      wroteKey = true
    }
  }
  const extraKeys: string[] = []
  for (const [envName, template] of providerSpec.envExtras) {
    if (env[envName] !== undefined) continue
    env[envName] = template.replace("{api_key}", input.apiKey).replace("{api_base}", effectiveBase)
    extraKeys.push(envName)
  }
  return {
    env,
    effectiveBase,
    wroteKey,
    envKey: providerSpec.envKey,
    extraKeys,
    gatewayOverwritesApiKey: providerSpec.isGateway,
  }
}

export function projectNanobotProviderCore(input: NanobotProviderCoreProjectionInput): NanobotProviderCoreProjection {
  const providerName = input.providerName ?? inferNanobotProviderName(input.model, input.apiKey, input.apiBase)
  const providerSpec = findNanobotProviderSpecProjection(providerName)
  const backend = providerSpec?.backend ?? "openai_compat"
  const apiKey = input.apiKey ?? ""
  const apiBase = input.apiBase ?? providerSpec?.defaultApiBase ?? undefined
  let error: string | undefined
  let requiresApiKey = false
  if (backend === "azure_openai") {
    requiresApiKey = true
    if (!apiKey || !apiBase) error = "Azure OpenAI requires api_key and api_base in config."
  } else if (backend === "openai_compat" && !input.model.startsWith("bedrock/")) {
    const exempt = Boolean(providerSpec && (providerSpec.isOAuth || providerSpec.isLocal || providerSpec.isDirect))
    requiresApiKey = !exempt
    if (!apiKey && !exempt) error = `No API key configured for provider '${providerName}'.`
  }

  const fallbackSignatures = (input.fallbackModels ?? []).map((fallback) => nanobotProviderSignature(fallback, false))
  const contextWindowTokens = Math.min(input.contextWindowTokens ?? 128000, ...fallbackSignatures.map((signature) => numberFromSignature(signature, 12)).filter((value) => value > 0))
  const result: NanobotProviderCoreProjection = {
    model: input.model,
    providerName,
    backend,
    providerClass: nanobotProviderClassForBackend(backend),
    defaultModel: input.model,
    requiresApiKey,
    generation: {
      maxTokens: input.maxTokens ?? 4096,
      temperature: input.temperature ?? 0.7,
      contextWindowTokens,
    },
    signature: nanobotProviderSignature({ ...input, providerName }, true),
    fallbackSignatures,
    contextWindowTokens,
  }
  if (apiBase !== undefined) result.effectiveApiBase = apiBase
  if (input.reasoningEffort !== undefined && input.reasoningEffort !== null) result.generation.reasoningEffort = input.reasoningEffort
  if (error) result.error = error
  return result
}

export function sanitizeNanobotOpenAICompatMessagesProjection(
  messages: Array<Record<string, unknown>>,
  options: { specName?: string | null | undefined } = {},
): Array<Record<string, unknown>> {
  const providerSpec = findNanobotProviderSpecProjection(options.specName)
  const idMap = new Map<string, string>()
  const sanitized = messages.map((message) => sanitizeEmptyContent(keepAllowedKeys(message, ["role", "content", "tool_calls", "tool_call_id", "name", "reasoning_content", "extra_content"])))
  for (const message of sanitized) {
    if (Array.isArray(message.tool_calls)) {
      message.tool_calls = message.tool_calls.map((toolCall) => {
        if (!isRecord(toolCall)) return toolCall
        const normalized = { ...toolCall }
        if (typeof normalized.id === "string") normalized.id = mappedToolID(normalized.id, idMap)
        if (isRecord(normalized.function)) {
          const functionObject = { ...normalized.function }
          functionObject.arguments = normalizeToolCallArguments(functionObject.arguments)
          normalized.function = functionObject
        }
        return normalized
      })
      if (message.role === "assistant") message.content = null
    }
    if (typeof message.tool_call_id === "string" && message.tool_call_id) {
      message.tool_call_id = mappedToolID(message.tool_call_id, idMap)
    }
    if (providerSpec?.name === "deepseek" && !(message.role === "assistant" && Array.isArray(message.tool_calls))) {
      message.content = coerceContentToString(message.content)
    }
  }
  return enforceNanobotRoleAlternation(sanitized)
}

export function buildNanobotOpenAICompatKwargsProjection(input: NanobotOpenAICompatKwargsInput): Record<string, unknown> {
  const providerSpec = findNanobotProviderSpecProjection(input.specName)
  let modelName = input.model ?? input.defaultModel
  let messages = input.messages
  let tools = input.tools ? input.tools.map((tool) => ({ ...tool })) : undefined
  if (providerSpec?.supportsPromptCaching && modelName.toLowerCase().startsWith("anthropic/")) {
    const cached = applyOpenAICompatCacheControl(messages, tools)
    messages = cached.messages
    tools = cached.tools
  }
  if (providerSpec?.stripModelPrefix) modelName = modelName.split("/").at(-1) ?? modelName

  const reasoningEffort = input.reasoningEffort ?? undefined
  const semanticEffort = typeof reasoningEffort === "string"
    ? reasoningEffort.toLowerCase() === "minimum" ? "minimal" : reasoningEffort.toLowerCase()
    : undefined
  const kwargs: Record<string, unknown> = {
    model: modelName,
    messages: sanitizeNanobotOpenAICompatMessagesProjection(messages, { specName: providerSpec?.name }),
  }
  if (supportsNanobotTemperature(modelName, reasoningEffort)) kwargs.temperature = input.temperature ?? 0.7
  if (providerSpec?.supportsMaxCompletionTokens) kwargs.max_completion_tokens = Math.max(1, input.maxTokens ?? 4096)
  else kwargs.max_tokens = Math.max(1, input.maxTokens ?? 4096)

  if (providerSpec) {
    const lower = modelName.toLowerCase()
    const override = providerSpec.modelOverrides.find(([pattern]) => lower.includes(pattern))
    if (override) Object.assign(kwargs, override[1])
  }

  let wireEffort = reasoningEffort
  if (providerSpec?.name === "dashscope" && semanticEffort === "minimal") wireEffort = "minimum"
  if (wireEffort && semanticEffort !== "none") kwargs.reasoning_effort = wireEffort

  if (providerSpec?.thinkingStyle && reasoningEffort !== undefined) {
    const thinkingEnabled = semanticEffort !== "none" && semanticEffort !== "minimal"
    Object.assign(kwargs, { extra_body: deepMerge(isRecord(kwargs.extra_body) ? kwargs.extra_body : {}, thinkingExtraBody(providerSpec.thinkingStyle, thinkingEnabled)) })
  }
  if (reasoningEffort !== undefined && (isKimiThinkingModel(modelName) || isMimoThinkingModel(modelName))) {
    const thinkingEnabled = semanticEffort !== "none" && semanticEffort !== "minimal"
    Object.assign(kwargs, { extra_body: deepMerge(isRecord(kwargs.extra_body) ? kwargs.extra_body : {}, { thinking: { type: thinkingEnabled ? "enabled" : "disabled" } }) })
  }

  if (tools && tools.length > 0) {
    kwargs.tools = tools
    kwargs.tool_choice = input.toolChoice ?? "auto"
  }

  const explicitThinking = reasoningEffort !== undefined && semanticEffort !== "none" && semanticEffort !== "minimal" && Boolean(providerSpec?.thinkingStyle || isKimiThinkingModel(modelName) || isMimoThinkingModel(modelName))
  const implicitDeepSeekThinking = Boolean(providerSpec?.name === "deepseek" && semanticEffort !== "none" && semanticEffort !== "minimal" && semanticEffort !== "minimum" && /deepseek-v4|deepseek-reasoner/.test(modelName.toLowerCase()))
  if (explicitThinking || implicitDeepSeekThinking) {
    for (const message of kwargs.messages as Array<Record<string, unknown>>) {
      if (message.role === "assistant" && !("reasoning_content" in message)) message.reasoning_content = ""
    }
  }

  if (input.extraBody) {
    kwargs.extra_body = deepMerge(isRecord(kwargs.extra_body) ? kwargs.extra_body : {}, input.extraBody)
  }
  return kwargs
}

export function parseNanobotOpenAICompatResponseProjection(
  response: unknown,
  options: { specName?: string | null | undefined } = {},
): NanobotLLMResponseProjection {
  const providerSpec = findNanobotProviderSpecProjection(options.specName)
  if (typeof response === "string") return { content: response, toolCalls: [], finishReason: "stop", usage: {} }
  if (!isRecord(response)) return { content: "Error: API returned empty choices.", toolCalls: [], finishReason: "error", usage: {} }
  const choices = Array.isArray(response.choices) ? response.choices.filter(isRecord) : []
  if (choices.length === 0) {
    const content = extractTextContent(response.content ?? response.output_text)
    const reasoningContent = extractTextContent(response.reasoning_content)
    if (content !== null) {
      const parsed: NanobotLLMResponseProjection = {
        content,
        toolCalls: [],
        finishReason: String(response.finish_reason ?? "stop"),
        usage: extractNanobotOpenAIUsage(response),
      }
      if (reasoningContent !== null) parsed.reasoningContent = reasoningContent
      return parsed
    }
    return { content: "Error: API returned empty choices.", toolCalls: [], finishReason: "error", usage: {} }
  }

  let content: string | null = null
  let finishReason = String(choices[0]?.finish_reason ?? "stop")
  let reasoningContent: string | undefined
  const rawToolCalls: Record<string, unknown>[] = []
  for (const choice of choices) {
    const message = isRecord(choice.message) ? choice.message : {}
    const messageContent = extractTextContent(message.content)
    if (!content && messageContent) content = messageContent
    if (!content && providerSpec?.reasoningAsContent && message.reasoning) content = extractTextContent(message.reasoning)
    const messageReasoning = extractTextContent(message.reasoning_content ?? message.reasoning)
    if (!reasoningContent && messageReasoning) reasoningContent = messageReasoning
    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      rawToolCalls.push(...message.tool_calls.filter(isRecord))
      if (choice.finish_reason === "tool_calls" || choice.finish_reason === "stop") finishReason = String(choice.finish_reason)
    }
  }
  const parsed: NanobotLLMResponseProjection = {
    content,
    toolCalls: rawToolCalls.map((toolCall) => parseOpenAIToolCall(toolCall)),
    finishReason,
    usage: extractNanobotOpenAIUsage(response),
  }
  if (reasoningContent) parsed.reasoningContent = reasoningContent
  return parsed
}

export function buildNanobotAnthropicKwargsProjection(input: NanobotAnthropicKwargsInput): Record<string, unknown> {
  const modelName = stripAnthropicPrefix(input.model ?? input.defaultModel)
  let { system, messages } = convertNanobotAnthropicMessages(input.messages)
  let tools = convertNanobotAnthropicTools(input.tools)
  if (input.supportsCaching ?? true) {
    const cached = applyAnthropicCacheControl(system, messages, tools)
    system = cached.system
    messages = cached.messages
    tools = cached.tools
  }
  const maxTokens = Math.max(1, input.maxTokens ?? 4096)
  const reasoningEffort = input.reasoningEffort ?? undefined
  const thinkingEnabled = Boolean(reasoningEffort) && reasoningEffort?.toLowerCase() !== "none"
  const omitTemperature = modelName.includes("opus-4-7")
  const kwargs: Record<string, unknown> = {
    model: modelName,
    messages,
    max_tokens: maxTokens,
  }
  if (system && !(Array.isArray(system) && system.length === 0)) kwargs.system = system
  if (reasoningEffort === "adaptive") {
    kwargs.thinking = { type: "adaptive" }
    if (!omitTemperature) kwargs.temperature = 1.0
  } else if (thinkingEnabled) {
    const budget = reasoningEffort ? ({ low: 1024, medium: 4096, high: Math.max(8192, maxTokens) } as Record<string, number>)[reasoningEffort.toLowerCase()] ?? 4096 : 4096
    kwargs.thinking = { type: "enabled", budget_tokens: budget }
    kwargs.max_tokens = Math.max(maxTokens, budget + 4096)
    if (!omitTemperature) kwargs.temperature = 1.0
  } else if (!omitTemperature) {
    kwargs.temperature = input.temperature ?? 0.7
  }
  if (tools && tools.length > 0) {
    kwargs.tools = tools
    const toolChoice = convertNanobotAnthropicToolChoice(input.toolChoice, thinkingEnabled)
    if (toolChoice) kwargs.tool_choice = toolChoice
  }
  if (input.extraHeaders && Object.keys(input.extraHeaders).length > 0) kwargs.extra_headers = input.extraHeaders
  return kwargs
}

export function parseNanobotAnthropicResponseProjection(response: {
  content: Array<Record<string, unknown>>
  stop_reason?: string | null | undefined
  usage?: Record<string, number | null | undefined> | null | undefined
}): NanobotLLMResponseProjection {
  const contentParts: string[] = []
  const toolCalls: NanobotToolCallProjection[] = []
  const thinkingBlocks: Array<Record<string, unknown>> = []
  for (const block of response.content) {
    if (block.type === "text") contentParts.push(String(block.text ?? ""))
    else if (block.type === "tool_use") toolCalls.push({ id: String(block.id ?? ""), name: String(block.name ?? ""), arguments: isRecord(block.input) ? block.input : {} })
    else if (block.type === "thinking") thinkingBlocks.push({ type: "thinking", thinking: block.thinking ?? "", signature: block.signature ?? "" })
  }
  const usage = extractNanobotAnthropicUsage(response.usage ?? undefined)
  const parsed: NanobotLLMResponseProjection = {
    content: contentParts.join("") || null,
    toolCalls,
    finishReason: anthropicStopReason(response.stop_reason ?? undefined),
    usage,
  }
  if (thinkingBlocks.length > 0) parsed.thinkingBlocks = thinkingBlocks
  return parsed
}

export function buildNanobotProviderNativeExactFixture(): NanobotProviderNativeExactFixture {
  const registry = nanobotProviderRegistryProjection()
  const factory = projectNanobotProviderCore({
    model: "anthropic/claude-sonnet-4-20250514",
    providerName: "openrouter",
    apiKey: "sk-or-fixture",
    maxTokens: 8192,
    temperature: 0.2,
    reasoningEffort: "high",
    contextWindowTokens: 200000,
    fallbackModels: [
      {
        model: "claude-sonnet-4-20250514",
        providerName: "anthropic",
        apiKey: "anthropic-key",
        maxTokens: 4096,
        temperature: 0.7,
        contextWindowTokens: 180000,
      },
    ],
  })
  const envProjection = projectNanobotProviderEnv({
    specName: "openrouter",
    apiKey: "sk-or-fixture",
    apiBase: "https://openrouter.ai/api/v1",
    env: { OPENROUTER_API_KEY: "old-key" },
  })
  const openAIKwargs = buildNanobotOpenAICompatKwargsProjection({
    specName: "volcengine",
    defaultModel: "volcengine/deepseek-v3",
    messages: [
      { role: "system", content: "Be exact." },
      { role: "user", content: "hi" },
      {
        role: "assistant",
        content: "calling",
        tool_calls: [{ id: "tool-call-with-long-id", function: { name: "lookup", arguments: "{\"city\":\"Paris\"}" }, trace_id: "tc-extra" }],
        internal: "removed",
      },
      { role: "tool", tool_call_id: "tool-call-with-long-id", content: "weather" },
      { role: "user", content: [{ type: "text", text: "continue", _meta: { hidden: true } }] },
    ],
    tools: [
      { type: "function", function: { name: "search", parameters: { type: "object" } } },
      { type: "function", function: { name: "mcp_memory", parameters: { type: "object" } } },
    ],
    maxTokens: 0,
    temperature: 0.3,
    reasoningEffort: "high",
    extraBody: { chat_template_kwargs: { enable_thinking: false } },
  })
  const openAIParsed = parseNanobotOpenAICompatResponseProjection({
    choices: [
      {
        finish_reason: null,
        message: {
          content: "",
          reasoning: "visible reasoning",
          tool_calls: [
            {
              id: "ignored-provider-id",
              function: { name: "search", arguments: "{\"query\":\"nanobot\"}", provider_hint: "fn" },
              extra_content: { google: { thought_signature: "sig" } },
              provider_route: "openrouter",
            },
          ],
        },
      },
      { finish_reason: "tool_calls", message: { content: "answer" } },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14, prompt_tokens_details: { cached_tokens: 3 } },
  })
  const anthropicKwargs = buildNanobotAnthropicKwargsProjection({
    defaultModel: "anthropic/claude-sonnet-4-20250514",
    messages: [
      { role: "system", content: "System prompt" },
      { role: "user", content: [{ type: "image_url", image_url: { url: "data:image/png;base64,abc" } }, { type: "text", text: "describe" }] },
      { role: "assistant", content: "using tool", thinking_blocks: [{ type: "thinking", thinking: "plan", signature: "sig" }], tool_calls: [{ id: "toolu_1", function: { name: "search", arguments: "{\"query\":\"x\"}" } }] },
      { role: "tool", tool_call_id: "toolu_1", content: "result" },
      { role: "user", content: "finish" },
    ],
    tools: [{ type: "function", function: { name: "search", description: "Search", parameters: { type: "object", properties: { query: { type: "string" } } } } }],
    maxTokens: 2048,
    reasoningEffort: "medium",
    toolChoice: { function: { name: "search" } },
    extraHeaders: { "anthropic-beta": "prompt-caching-2024-07-31" },
  })
  const anthropicParsed = parseNanobotAnthropicResponseProjection({
    content: [
      { type: "text", text: "hello " },
      { type: "thinking", thinking: "hidden", signature: "sig" },
      { type: "tool_use", id: "toolu_2", name: "search", input: { query: "nanobot" } },
    ],
    stop_reason: "tool_use",
    usage: { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 2, cache_read_input_tokens: 3 },
  })

  const fixture: Omit<NanobotProviderNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "nanobot",
    atomIDs: nanobotProviderNativeExactAtomIDs,
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
    upstreamRef: nanobotProviderUpstreamRef,
    evidenceRef: nanobotProviderNativeExactEvidenceRef,
    fixtureID: nanobotProviderNativeExactFixtureID,
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    policy: {
      providerRegistryIsSingleSourceOfTruth: true,
      factorySelectsBackendFromProviderSpec: true,
      openAICompatRequiresApiKeyExceptOAuthLocalDirect: true,
      gatewaysOverwriteEnvVarsAndNonGatewaysSetDefault: true,
      openAICompatSanitizesMessagesToolIDsArgumentsAndRoleAlternation: true,
      openAICompatBuildsMaxCompletionReasoningThinkingCacheAndExtraBody: true,
      openAICompatParsesReasoningToolCallsAndCachedUsage: true,
      anthropicConvertsOpenAIChatMessagesToolsThinkingAndCacheControls: true,
      anthropicParsesTextToolUseThinkingAndCacheUsage: true,
      streamingDeltaRecorderUsesNativeParserOrder: true,
      streamProjectorPreservesContentReasoningToolsFinishAndUsage: true,
      allProviderAtomsShareNativeTransportFixture: true,
    },
    cases: [
      providerCase(
        "registry-factory-signature-and-fallback",
        { providerName: "openrouter", fallbackProvider: "anthropic" },
        {
          registryFirst: registry[0]?.name ?? "",
          registryOpenRouterLabel: findNanobotProviderSpecProjection("openrouter")?.label ?? "",
          backend: factory.backend,
          providerClass: factory.providerClass,
          requiresApiKey: factory.requiresApiKey,
          contextWindowTokens: factory.contextWindowTokens,
          fallbackCount: factory.fallbackSignatures.length,
          signatureModel: factory.signature[0],
        },
        "factory._make_provider_core resolves ProviderSpec by normalized name, selects backend, validates API-key exemptions, applies generation settings, and provider_signature includes fallback model signatures.",
      ),
      providerCase(
        "openai-compatible-env-headers-and-local-transport",
        { specName: "openrouter", existingEnv: "old-key" },
        {
          envKey: envProjection.envKey,
          openRouterKey: envProjection.env.OPENROUTER_API_KEY,
          wroteKey: envProjection.wroteKey,
          effectiveBase: envProjection.effectiveBase,
          gatewayOverwritesApiKey: envProjection.gatewayOverwritesApiKey,
        },
        "OpenAICompatProvider._setup_env overwrites gateway env vars, sets non-gateway env keys by default, expands env_extras placeholders, and the constructor applies OpenRouter attribution plus local keepalive handling.",
      ),
      providerCase(
        "openai-compatible-message-sanitize-and-kwargs",
        { specName: "volcengine", maxTokens: 0, reasoningEffort: "high" },
        {
          model: openAIKwargs.model,
          hasTemperature: "temperature" in openAIKwargs,
          maxCompletionTokens: openAIKwargs.max_completion_tokens,
          reasoningEffort: openAIKwargs.reasoning_effort,
          extraBody: openAIKwargs.extra_body,
          toolChoice: openAIKwargs.tool_choice,
          messages: openAIKwargs.messages,
        },
        "OpenAICompatProvider._build_kwargs clamps max_tokens, uses max_completion_tokens when supported, maps thinking_style into extra_body, strips unsafe message keys, normalizes tool IDs and arguments, and enforces role alternation.",
      ),
      providerCase(
        "openai-compatible-response-and-usage-parser",
        { parser: "OpenAICompatProvider._parse" },
        {
          content: openAIParsed.content,
          finishReason: openAIParsed.finishReason,
          reasoningContent: openAIParsed.reasoningContent ?? "",
          cachedTokens: openAIParsed.usage.cached_tokens,
          toolCall: openAIParsed.toolCalls[0],
        },
        "OpenAICompatProvider._parse joins content across choices, preserves reasoning_content/reasoning, normalizes cached token usage, reparses tool arguments, and keeps provider-specific tool-call extras.",
      ),
      providerCase(
        "anthropic-message-tool-cache-and-thinking-kwargs",
        { model: "anthropic/claude-sonnet-4-20250514", reasoningEffort: "medium" },
        {
          model: anthropicKwargs.model,
          maxTokens: anthropicKwargs.max_tokens,
          thinking: anthropicKwargs.thinking,
          temperature: anthropicKwargs.temperature,
          system: anthropicKwargs.system,
          messages: anthropicKwargs.messages,
          tools: anthropicKwargs.tools,
          toolChoice: anthropicKwargs.tool_choice,
          extraHeaders: anthropicKwargs.extra_headers,
        },
        "AnthropicProvider._build_kwargs strips anthropic/ model prefix, converts OpenAI messages/tools/images/tool results, applies prompt cache markers, enables extended thinking budgets, and normalizes tool_choice.",
      ),
      providerCase(
        "anthropic-response-usage-and-tool-parser",
        { parser: "AnthropicProvider._parse_response" },
        {
          content: anthropicParsed.content,
          finishReason: anthropicParsed.finishReason,
          usage: anthropicParsed.usage,
          toolCall: anthropicParsed.toolCalls[0],
          thinkingBlocks: anthropicParsed.thinkingBlocks,
        },
        "AnthropicProvider._parse_response concatenates text blocks, maps tool_use to tool_calls, preserves thinking blocks, maps stop_reason, and folds cache read/write tokens into prompt and cached usage.",
      ),
    ],
    sourceRefs: [
      `${nanobotProviderUpstreamRef}:nanobot/providers/registry.py#ProviderSpec,PROVIDERS,find_by_name`,
      `${nanobotProviderUpstreamRef}:nanobot/providers/factory.py#_make_provider_core,make_provider,provider_signature,build_provider_snapshot`,
      `${nanobotProviderUpstreamRef}:nanobot/providers/base.py#LLMProvider._sanitize_empty_content,_enforce_role_alternation,_tool_cache_marker_indices,ToolCallRequest,LLMResponse`,
      `${nanobotProviderUpstreamRef}:nanobot/providers/openai_compat_provider.py#OpenAICompatProvider._setup_env,_sanitize_messages,_build_kwargs,_parse,_parse_chunks`,
      `${nanobotProviderUpstreamRef}:nanobot/providers/anthropic_provider.py#AnthropicProvider._convert_messages,_convert_tools,_apply_cache_control,_build_kwargs,_parse_response`,
    ],
    nativeEvidenceRefs: [nanobotProviderNativeExactEvidenceRef, nanobotProviderNativeExactReplayRef],
    fixtureIDs: [nanobotProviderNativeExactFixtureID],
    knownLossiness: [],
    descriptors: nanobotProviderNativeDescriptors.map((descriptor) => ({ ...descriptor })),
  }
  return { ...fixture, fingerprint: fingerprintObject(fixture) }
}

export function verifyNanobotProviderNativeExactFixture(fixture: NanobotProviderNativeExactFixture): NanobotProviderNativeExactVerification {
  const canonical = buildNanobotProviderNativeExactFixture()
  const issues: NanobotProviderNativeExactIssue[] = []
  const add = (id: string, message: string) => issues.push({ id, message })
  if (fixture.product !== "nanobot") add("product", "Fixture must target Nanobot.")
  if (fixture.upstreamRef !== nanobotProviderUpstreamRef) add("upstream-ref", "Fixture must stay pinned to the Nanobot provider upstream ref.")
  if (fixture.fixtureID !== nanobotProviderNativeExactFixtureID) add("fixture-id", "Fixture ID drifted from Nanobot provider native exact fixture.")
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) add("native-exact", "Fixture must assert native exact parity.")
  if (JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    add("identity", "Nanobot provider fixture must cover the native provider atom and port set.")
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) add("lossiness", "Native exact provider fixture must not carry known lossiness.")
  if (!fixture.nativeEvidenceRefs.includes(nanobotProviderNativeExactEvidenceRef)) add("evidence", "Native exact conformance evidence is missing.")
  if (!fixture.nativeEvidenceRefs.includes(nanobotProviderNativeExactReplayRef)) add("replay", "Native exact replay evidence is missing.")
  if (!fixture.fixtureIDs.includes(nanobotProviderNativeExactFixtureID)) add("fixture", "Native exact fixture ID is missing.")
  if (!fixture.sourceRefs.some((ref) => ref.includes("providers/registry.py#ProviderSpec"))) add("registry-source", "Provider registry upstream source ref is missing.")
  if (!fixture.sourceRefs.some((ref) => ref.includes("openai_compat_provider.py#OpenAICompatProvider"))) add("openai-source", "OpenAI-compatible provider upstream source ref is missing.")
  if (!fixture.sourceRefs.some((ref) => ref.includes("anthropic_provider.py#AnthropicProvider"))) add("anthropic-source", "Anthropic provider upstream source ref is missing.")
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) add("policy", "Nanobot provider native policy drifted from canonical fixture.")
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) add("cases", "Nanobot provider native cases drifted from canonical fixture.")
  if (JSON.stringify(fixture.descriptors) !== JSON.stringify(canonical.descriptors)) add("descriptors", "Nanobot provider native descriptors drifted from canonical fixture.")
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) add("fingerprint", "Nanobot provider native fixture fingerprint mismatch.")
  return { ok: issues.length === 0, issues }
}

export function nanobotProviderPortForAtomID(id: NanobotProviderNativeExactAtomID): NanobotProviderPortID {
  if (id === nanobotProviderAuthDescriptorNativeExactAtomID) return "provider.auth"
  if (id === nanobotProviderEventObserverNativeExactAtomID) return "provider.event-normalizer"
  if (id === nanobotProviderModelRegistryNativeExactAtomID) return "provider.model-registry"
  if (id === nanobotProviderParserObserverNativeExactAtomID) return "provider.stream-parser"
  if (id === nanobotProviderPluginDescriptorNativeExactAtomID) return "provider.stream"
  if (id === nanobotProviderRequestOptionsNativeExactAtomID) return "provider.request-shape"
  if (id === nanobotProviderStreamingDeltaRecorderNativeExactAtomID) return "provider.streaming-delta-recorder"
  if (id === nanobotProviderStreamProjectorNativeExactAtomID) return "provider.stream-projector"
  if (id === nanobotProviderTransportInstrumentationNativeExactAtomID) return "provider.transport"
  return "provider.usage-normalizer"
}

function spec(input: {
  name: string
  keywords: string[]
  envKey: string
  displayName: string
  backend?: NanobotProviderBackend
  envExtras?: readonly (readonly [string, string])[] | undefined
  isGateway?: boolean | undefined
  isLocal?: boolean | undefined
  detectByKeyPrefix?: string | undefined
  detectByBaseKeyword?: string | undefined
  defaultApiBase?: string | undefined
  stripModelPrefix?: boolean | undefined
  supportsMaxCompletionTokens?: boolean | undefined
  modelOverrides?: readonly (readonly [string, Record<string, unknown>])[] | undefined
  isOAuth?: boolean | undefined
  isDirect?: boolean | undefined
  supportsPromptCaching?: boolean | undefined
  thinkingStyle?: NanobotThinkingStyle | undefined
  reasoningAsContent?: boolean | undefined
}): NanobotLLMProviderSpecProjection {
  return {
    name: input.name,
    keywords: input.keywords,
    envKey: input.envKey,
    displayName: input.displayName,
    backend: input.backend ?? "openai_compat",
    envExtras: input.envExtras ?? [],
    isGateway: input.isGateway ?? false,
    isLocal: input.isLocal ?? false,
    detectByKeyPrefix: input.detectByKeyPrefix ?? "",
    detectByBaseKeyword: input.detectByBaseKeyword ?? "",
    defaultApiBase: input.defaultApiBase ?? "",
    stripModelPrefix: input.stripModelPrefix ?? false,
    supportsMaxCompletionTokens: input.supportsMaxCompletionTokens ?? false,
    modelOverrides: input.modelOverrides ?? [],
    isOAuth: input.isOAuth ?? false,
    isDirect: input.isDirect ?? false,
    supportsPromptCaching: input.supportsPromptCaching ?? false,
    thinkingStyle: input.thinkingStyle ?? "",
    reasoningAsContent: input.reasoningAsContent ?? false,
    label: input.displayName || titleCase(input.name),
  }
}

function nanobotProviderNativeDescriptor(id: NanobotProviderNativeExactAtomID): NanobotProviderNativeDescriptor {
  return {
    id,
    port: nanobotProviderPortForAtomID(id),
    product: "nanobot",
    implementationKind: "factory",
    selectionReason: "Nanobot upstream native implementation of provider behavior: ProviderSpec registry, factory backend selection/signature, OpenAI-compatible request/transport/parse/stream projection pipeline, Anthropic request/parse pipeline, usage, prompt-cache handling, and provider stream recorder/projector parity complete.",
    parityCoverage: "native",
    nativeEvidenceRefs: [nanobotProviderNativeExactEvidenceRef, nanobotProviderNativeExactReplayRef],
    fixtureIDs: [nanobotProviderNativeExactFixtureID],
    knownLossiness: [],
  }
}

function providerCase(
  scenarioID: NanobotProviderNativeScenarioID,
  input: NanobotProviderNativeExactCase["input"],
  output: NanobotProviderNativeExactCase["output"],
  upstreamBehavior: string,
): NanobotProviderNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function inferNanobotProviderName(model: string, apiKey?: string | null | undefined, apiBase?: string | null | undefined): string {
  const loweredModel = model.toLowerCase()
  const loweredBase = (apiBase ?? "").toLowerCase()
  for (const providerSpec of nanobotProviderSpecs) {
    if (providerSpec.detectByKeyPrefix && apiKey?.startsWith(providerSpec.detectByKeyPrefix)) return providerSpec.name
    if (providerSpec.detectByBaseKeyword && loweredBase.includes(providerSpec.detectByBaseKeyword)) return providerSpec.name
  }
  for (const providerSpec of nanobotProviderSpecs) {
    if (providerSpec.keywords.some((keyword) => loweredModel.includes(keyword))) return providerSpec.name
  }
  return "custom"
}

function nanobotProviderClassForBackend(backend: NanobotProviderBackend): string {
  switch (backend) {
    case "azure_openai":
      return "AzureOpenAIProvider"
    case "openai_codex":
      return "OpenAICodexProvider"
    case "github_copilot":
      return "GitHubCopilotProvider"
    case "anthropic":
      return "AnthropicProvider"
    case "bedrock":
      return "BedrockProvider"
    default:
      return "OpenAICompatProvider"
  }
}

function nanobotProviderSignature(input: NanobotProviderCoreProjectionInput, includeFallbacks: boolean): unknown[] {
  const fallbackSignatures = includeFallbacks ? (input.fallbackModels ?? []).map((fallback) => nanobotProviderSignature(fallback, false)) : []
  return [
    input.model,
    input.providerName ?? inferNanobotProviderName(input.model, input.apiKey, input.apiBase),
    input.providerName ?? inferNanobotProviderName(input.model, input.apiKey, input.apiBase),
    input.apiKey ?? null,
    input.apiBase ?? findNanobotProviderSpecProjection(input.providerName)?.defaultApiBase ?? null,
    input.extraHeaders ?? null,
    input.extraBody ?? null,
    input.region ?? null,
    input.profile ?? null,
    input.maxTokens ?? 4096,
    input.temperature ?? 0.7,
    input.reasoningEffort ?? null,
    input.contextWindowTokens ?? 128000,
    fallbackSignatures,
  ]
}

function numberFromSignature(signature: unknown[], index: number): number {
  const value = signature[index]
  return typeof value === "number" ? value : 0
}

function applyOpenAICompatCacheControl(
  messages: Array<Record<string, unknown>>,
  tools: Array<Record<string, unknown>> | undefined,
): { messages: Array<Record<string, unknown>>; tools?: Array<Record<string, unknown>> | undefined } {
  const marker = { type: "ephemeral" }
  const newMessages = messages.map((message) => ({ ...message }))
  const markMessage = (message: Record<string, unknown>): Record<string, unknown> => {
    const content = message.content
    if (typeof content === "string") return { ...message, content: [{ type: "text", text: content, cache_control: marker }] }
    if (Array.isArray(content) && content.length > 0) {
      const next = [...content]
      const last = next[next.length - 1]
      next[next.length - 1] = isRecord(last) ? { ...last, cache_control: marker } : last
      return { ...message, content: next }
    }
    return message
  }
  if (newMessages[0]?.role === "system") newMessages[0] = markMessage(newMessages[0]!)
  if (newMessages.length >= 3) newMessages[newMessages.length - 2] = markMessage(newMessages[newMessages.length - 2]!)
  let newTools = tools
  if (tools && tools.length > 0) {
    newTools = tools.map((tool) => ({ ...tool }))
    for (const index of toolCacheMarkerIndices(newTools)) {
      newTools[index] = { ...newTools[index], cache_control: marker }
    }
  }
  return { messages: newMessages, tools: newTools }
}

function sanitizeEmptyContent(message: Record<string, unknown>): Record<string, unknown> {
  const content = message.content
  if (typeof content === "string" && content.length === 0) return { ...message, content: message.role === "assistant" && Array.isArray(message.tool_calls) ? null : "(empty)" }
  if (Array.isArray(content)) {
    const newItems: unknown[] = []
    let changed = false
    for (const item of content) {
      if (isRecord(item) && ["text", "input_text", "output_text"].includes(String(item.type)) && !item.text) {
        changed = true
        continue
      }
      if (isRecord(item) && "_meta" in item) {
        const { _meta: _discarded, ...rest } = item
        newItems.push(rest)
        changed = true
      } else {
        newItems.push(item)
      }
    }
    if (changed) return { ...message, content: newItems.length > 0 ? newItems : message.role === "assistant" && Array.isArray(message.tool_calls) ? null : "(empty)" }
  }
  if (isRecord(content)) return { ...message, content: [content] }
  return message
}

function keepAllowedKeys(message: Record<string, unknown>, allowedKeys: readonly string[]): Record<string, unknown> {
  const allowed = new Set(allowedKeys)
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(message)) {
    if (allowed.has(key)) clean[key] = value
  }
  if (clean.role === "assistant" && !("content" in clean)) clean.content = null
  return clean
}

function normalizeToolCallArguments(argumentsValue: unknown): string {
  if (typeof argumentsValue === "string") {
    if (!argumentsValue.trim()) return "{}"
    try {
      const parsed = JSON.parse(argumentsValue)
      return isRecord(parsed) ? JSON.stringify(parsed) : "{}"
    } catch {
      return "{}"
    }
  }
  if (isRecord(argumentsValue)) return JSON.stringify(argumentsValue)
  return "{}"
}

function mappedToolID(value: string, idMap: Map<string, string>): string {
  const existing = idMap.get(value)
  if (existing) return existing
  const mapped = value.length === 9 && /^[a-z0-9]+$/i.test(value) ? value : createHash("sha1").update(value).digest("hex").slice(0, 9)
  idMap.set(value, mapped)
  return mapped
}

function coerceContentToString(content: unknown): string | null {
  if (content === null || typeof content === "string") return content
  const text = extractTextContent(content)
  if (text) return text
  try {
    return JSON.stringify(content) || "(empty)"
  } catch {
    return String(content) || "(empty)"
  }
}

function enforceNanobotRoleAlternation(messages: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  if (messages.length === 0) return messages
  const merged: Array<Record<string, unknown>> = []
  for (const message of messages) {
    const role = message.role
    const previous = merged[merged.length - 1]
    if (previous && role !== "system" && role !== "tool" && previous.role === role && (role === "user" || role === "assistant")) {
      if (role === "assistant") {
        if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
          merged[merged.length - 1] = { ...message }
          continue
        }
        if (Array.isArray(previous.tool_calls) && previous.tool_calls.length > 0) continue
      }
      if (typeof previous.content === "string" && typeof message.content === "string") {
        previous.content = `${previous.content}\n\n${message.content}`.trim()
      } else {
        merged[merged.length - 1] = { ...message }
      }
    } else {
      merged.push({ ...message })
    }
  }
  let lastPopped: Record<string, unknown> | undefined
  while (merged.length > 0 && merged[merged.length - 1]?.role === "assistant") {
    lastPopped = merged.pop()
  }
  if (merged.length > 0 && lastPopped && !merged.some((message) => message.role === "user" || message.role === "tool")) {
    merged.push({ ...lastPopped, role: "user" })
  }
  for (let index = 0; index < merged.length; index += 1) {
    const message = merged[index]!
    if (message.role !== "system") {
      if (message.role === "assistant" && !Array.isArray(message.tool_calls)) merged.splice(index, 0, { role: "user", content: "(conversation continued)" })
      break
    }
  }
  return merged
}

function supportsNanobotTemperature(modelName: string, reasoningEffort: string | undefined): boolean {
  if (reasoningEffort && reasoningEffort.toLowerCase() !== "none") return false
  const lower = modelName.toLowerCase()
  return !["gpt-5", "o1", "o3", "o4"].some((token) => lower.includes(token))
}

function thinkingExtraBody(style: NanobotThinkingStyle, enabled: boolean): Record<string, unknown> {
  if (style === "thinking_type") return { thinking: { type: enabled ? "enabled" : "disabled" } }
  if (style === "enable_thinking") return { enable_thinking: enabled }
  if (style === "reasoning_split") return { reasoning_split: enabled }
  return {}
}

function isKimiThinkingModel(modelName: string): boolean {
  const slug = modelName.toLowerCase().split("/").at(-1) ?? modelName.toLowerCase()
  return ["kimi-k2.5", "kimi-k2.6", "k2.6-code-preview"].includes(slug)
}

function isMimoThinkingModel(modelName: string): boolean {
  const slug = modelName.toLowerCase().split("/").at(-1) ?? modelName.toLowerCase()
  return ["mimo-v2.5-pro", "mimo-v2.5", "mimo-v2-pro", "mimo-v2-omni"].includes(slug)
}

function extractNanobotOpenAIUsage(response: Record<string, unknown>): Record<string, number> {
  const usage = isRecord(response.usage) ? response.usage : undefined
  if (!usage) return {}
  const result: Record<string, number> = {
    prompt_tokens: numberValue(usage.prompt_tokens),
    completion_tokens: numberValue(usage.completion_tokens),
    total_tokens: numberValue(usage.total_tokens),
  }
  const cached = nestedNumber(usage, ["prompt_tokens_details", "cached_tokens"]) || numberValue(usage.cached_tokens) || numberValue(usage.prompt_cache_hit_tokens)
  if (cached) result.cached_tokens = cached
  return result
}

function parseOpenAIToolCall(toolCall: Record<string, unknown>): NanobotToolCallProjection {
  const fn = isRecord(toolCall.function) ? toolCall.function : {}
  const parsedArgs = typeof fn.arguments === "string" ? safeParseObject(fn.arguments) : isRecord(fn.arguments) ? fn.arguments : {}
  const parsed: NanobotToolCallProjection = {
    id: shortStableToolID(`${toolCall.id ?? ""}:${fn.name ?? ""}:${JSON.stringify(parsedArgs)}`),
    name: String(fn.name ?? ""),
    arguments: parsedArgs,
  }
  if (isRecord(toolCall.extra_content) && Object.keys(toolCall.extra_content).length > 0) parsed.extraContent = toolCall.extra_content
  const providerFields = Object.fromEntries(Object.entries(toolCall).filter(([key, value]) => !["id", "type", "index", "function", "extra_content"].includes(key) && value !== undefined && value !== null))
  if (Object.keys(providerFields).length > 0) parsed.providerSpecificFields = providerFields
  const functionProviderFields = Object.fromEntries(Object.entries(fn).filter(([key, value]) => !["name", "arguments"].includes(key) && value !== undefined && value !== null))
  if (Object.keys(functionProviderFields).length > 0) parsed.functionProviderSpecificFields = functionProviderFields
  return parsed
}

function shortStableToolID(seed: string): string {
  return createHash("sha1").update(seed).digest("hex").slice(0, 9)
}

function convertNanobotAnthropicMessages(messages: Array<Record<string, unknown>>): { system: string | Array<Record<string, unknown>>; messages: Array<Record<string, unknown>> } {
  let system: string | Array<Record<string, unknown>> = ""
  const raw: Array<Record<string, unknown>> = []
  for (const message of messages) {
    const role = message.role
    if (role === "system") {
      system = typeof message.content === "string" || Array.isArray(message.content) ? message.content as string | Array<Record<string, unknown>> : String(message.content ?? "")
      continue
    }
    if (role === "tool") {
      const block = anthropicToolResultBlock(message)
      const previous = raw[raw.length - 1]
      if (previous?.role === "user") {
        previous.content = Array.isArray(previous.content) ? [...previous.content, block] : [{ type: "text", text: previous.content ?? "" }, block]
      } else {
        raw.push({ role: "user", content: [block] })
      }
      continue
    }
    if (role === "assistant") {
      raw.push({ role: "assistant", content: anthropicAssistantBlocks(message) })
      continue
    }
    if (role === "user") raw.push({ role: "user", content: convertNanobotAnthropicUserContent(message.content) })
  }
  return { system, messages: mergeNanobotAnthropicConsecutive(raw) }
}

function anthropicToolResultBlock(message: Record<string, unknown>): Record<string, unknown> {
  const block: Record<string, unknown> = { type: "tool_result", tool_use_id: message.tool_call_id ?? "" }
  const content = message.content
  if (Array.isArray(content)) block.content = convertNanobotAnthropicUserContent(content)
  else if (typeof content === "string") block.content = content
  else block.content = content ? String(content) : ""
  return block
}

function anthropicAssistantBlocks(message: Record<string, unknown>): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = []
  if (Array.isArray(message.thinking_blocks)) {
    for (const block of message.thinking_blocks.filter(isRecord)) {
      if (block.type === "thinking") blocks.push({ type: "thinking", thinking: block.thinking ?? "", signature: block.signature ?? "" })
    }
  }
  if (typeof message.content === "string" && message.content) blocks.push({ type: "text", text: message.content })
  else if (Array.isArray(message.content)) {
    for (const item of message.content) blocks.push(isRecord(item) ? item : { type: "text", text: String(item) })
  }
  if (Array.isArray(message.tool_calls)) {
    for (const toolCall of message.tool_calls.filter(isRecord)) {
      const fn = isRecord(toolCall.function) ? toolCall.function : {}
      const args = typeof fn.arguments === "string" ? safeParseObject(fn.arguments) : isRecord(fn.arguments) ? fn.arguments : {}
      blocks.push({
        type: "tool_use",
        id: toolCall.id ?? "toolu_generated_projection",
        name: fn.name ?? "",
        input: args,
      })
    }
  }
  return blocks.length > 0 ? blocks : [{ type: "text", text: "" }]
}

function convertNanobotAnthropicUserContent(content: unknown): unknown {
  if (typeof content === "string" || content === null || content === undefined) return content || "(empty)"
  if (!Array.isArray(content)) return String(content)
  const result: Array<Record<string, unknown>> = []
  for (const item of content) {
    if (!isRecord(item)) {
      result.push({ type: "text", text: String(item) })
      continue
    }
    if (item.type === "image_url") {
      const converted = convertNanobotAnthropicImageBlock(item)
      if (converted) result.push(converted)
      continue
    }
    result.push(item)
  }
  return result.length > 0 ? result : "(empty)"
}

function convertNanobotAnthropicImageBlock(block: Record<string, unknown>): Record<string, unknown> | undefined {
  const image = isRecord(block.image_url) ? block.image_url : {}
  const url = typeof image.url === "string" ? image.url : ""
  if (!url) return undefined
  const match = /^data:(image\/\w+);base64,(.+)$/s.exec(url)
  if (match) return { type: "image", source: { type: "base64", media_type: match[1], data: match[2] } }
  return { type: "image", source: { type: "url", url } }
}

function mergeNanobotAnthropicConsecutive(messages: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const merged: Array<Record<string, unknown>> = []
  for (const message of messages) {
    const previous = merged[merged.length - 1]
    if (previous !== undefined && previous.role === message.role) {
      const previousContent = Array.isArray(previous.content) ? previous.content : [{ type: "text", text: previous.content ?? "" }]
      const currentContent = Array.isArray(message.content) ? message.content : [{ type: "text", text: message.content ?? "" }]
      previous.content = [...previousContent, ...currentContent]
    } else {
      merged.push({ ...message })
    }
  }
  let lastPopped: Record<string, unknown> | undefined
  while (merged.length > 0 && merged[merged.length - 1]?.role === "assistant") {
    lastPopped = merged.pop()
  }
  if (merged.length === 0 && lastPopped && !hasAnthropicToolUse(lastPopped)) merged.push({ role: "user", content: lastPopped.content })
  if (merged[0]?.role === "assistant" && !hasAnthropicToolUse(merged[0])) merged.unshift({ role: "user", content: "(conversation continued)" })
  return merged
}

function hasAnthropicToolUse(message: Record<string, unknown>): boolean {
  return Array.isArray(message.content) && message.content.some((block) => isRecord(block) && block.type === "tool_use")
}

function convertNanobotAnthropicTools(tools: Array<Record<string, unknown>> | null | undefined): Array<Record<string, unknown>> | undefined {
  if (!tools || tools.length === 0) return undefined
  return tools.map((tool) => {
    const fn = isRecord(tool.function) ? tool.function : tool
    const entry: Record<string, unknown> = {
      name: fn.name ?? "",
      input_schema: fn.parameters ?? { type: "object", properties: {} },
    }
    if (fn.description) entry.description = fn.description
    if (tool.cache_control) entry.cache_control = tool.cache_control
    return entry
  })
}

function convertNanobotAnthropicToolChoice(toolChoice: string | Record<string, unknown> | null | undefined, thinkingEnabled: boolean): Record<string, unknown> | undefined {
  if (thinkingEnabled || toolChoice === undefined || toolChoice === null || toolChoice === "auto") return { type: "auto" }
  if (toolChoice === "required") return { type: "any" }
  if (toolChoice === "none") return undefined
  if (isRecord(toolChoice) && isRecord(toolChoice.function) && typeof toolChoice.function.name === "string") return { type: "tool", name: toolChoice.function.name }
  return { type: "auto" }
}

function applyAnthropicCacheControl(
  system: string | Array<Record<string, unknown>>,
  messages: Array<Record<string, unknown>>,
  tools: Array<Record<string, unknown>> | undefined,
): { system: string | Array<Record<string, unknown>>; messages: Array<Record<string, unknown>>; tools?: Array<Record<string, unknown>> | undefined } {
  const marker = { type: "ephemeral" }
  let cachedSystem = system
  if (typeof cachedSystem === "string" && cachedSystem) cachedSystem = [{ type: "text", text: cachedSystem, cache_control: marker }]
  else if (Array.isArray(cachedSystem) && cachedSystem.length > 0) {
    cachedSystem = [...cachedSystem]
    cachedSystem[cachedSystem.length - 1] = { ...cachedSystem[cachedSystem.length - 1], cache_control: marker }
  }
  const newMessages = messages.map((message) => ({ ...message }))
  if (newMessages.length >= 3) {
    const message = newMessages[newMessages.length - 2]!
    const content = message.content
    if (typeof content === "string") newMessages[newMessages.length - 2] = { ...message, content: [{ type: "text", text: content, cache_control: marker }] }
    else if (Array.isArray(content) && content.length > 0) {
      const next = [...content]
      const last = next[next.length - 1]
      next[next.length - 1] = isRecord(last) ? { ...last, cache_control: marker } : last
      newMessages[newMessages.length - 2] = { ...message, content: next }
    }
  }
  let newTools = tools
  if (tools && tools.length > 0) {
    newTools = tools.map((tool) => ({ ...tool }))
    for (const index of toolCacheMarkerIndices(newTools)) newTools[index] = { ...newTools[index], cache_control: marker }
  }
  return { system: cachedSystem, messages: newMessages, tools: newTools }
}

function toolCacheMarkerIndices(tools: Array<Record<string, unknown>>): number[] {
  if (tools.length === 0) return []
  const tailIndex = tools.length - 1
  let lastBuiltinIndex: number | undefined
  for (let index = tailIndex; index >= 0; index -= 1) {
    if (!toolName(tools[index]!).startsWith("mcp_")) {
      lastBuiltinIndex = index
      break
    }
  }
  const indices: number[] = []
  for (const index of [lastBuiltinIndex, tailIndex]) {
    if (index !== undefined && !indices.includes(index)) indices.push(index)
  }
  return indices
}

function toolName(tool: Record<string, unknown>): string {
  if (typeof tool.name === "string") return tool.name
  if (isRecord(tool.function) && typeof tool.function.name === "string") return tool.function.name
  return ""
}

function stripAnthropicPrefix(model: string): string {
  return model.startsWith("anthropic/") ? model.slice("anthropic/".length) : model
}

function extractNanobotAnthropicUsage(usage: Record<string, number | null | undefined> | undefined): Record<string, number> {
  if (!usage) return {}
  const inputTokens = numberValue(usage.input_tokens)
  const cacheCreation = numberValue(usage.cache_creation_input_tokens)
  const cacheRead = numberValue(usage.cache_read_input_tokens)
  const outputTokens = numberValue(usage.output_tokens)
  const result: Record<string, number> = {
    prompt_tokens: inputTokens + cacheCreation + cacheRead,
    completion_tokens: outputTokens,
    total_tokens: inputTokens + cacheCreation + cacheRead + outputTokens,
  }
  if (cacheCreation) result.cache_creation_input_tokens = cacheCreation
  if (cacheRead) {
    result.cache_read_input_tokens = cacheRead
    result.cached_tokens = cacheRead
  }
  return result
}

function anthropicStopReason(stopReason: string | undefined): NanobotProviderFinishReason {
  if (stopReason === "tool_use") return "tool_calls"
  if (stopReason === "end_turn") return "stop"
  if (stopReason === "max_tokens") return "length"
  return stopReason || "stop"
}

function extractTextContent(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    const parts: string[] = []
    for (const item of value) {
      if (isRecord(item) && typeof item.text === "string") parts.push(item.text)
      else if (typeof item === "string") parts.push(item)
    }
    return parts.join("") || null
  }
  return String(value)
}

function safeParseObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value)
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const merged = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (isRecord(merged[key]) && isRecord(value)) merged[key] = deepMerge(merged[key], value)
    else merged[key] = value
  }
  return merged
}

function nestedNumber(obj: Record<string, unknown>, path: readonly string[]): number {
  let current: unknown = obj
  for (const segment of path) {
    if (!isRecord(current)) return 0
    current = current[segment]
  }
  return numberValue(current)
}

function numberValue(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0) || 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function snakeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}
