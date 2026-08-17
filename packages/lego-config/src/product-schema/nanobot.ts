import { createHash } from "node:crypto"
import { dirname, join, resolve as resolvePath } from "node:path"

export const nanobotConfigUpstreamRef = "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
export const nanobotConfigSourceNativeExactAtomID = "nanobot.config.source"
export const nanobotConfigPrecedenceNativeExactAtomID = "nanobot.config.precedence"
export const nanobotConfigValidatorNativeExactAtomID = "nanobot.config.validator"
export const nanobotConfigNativeExactFixtureID = "nanobot-config:native-exact-fixture"
export const nanobotConfigNativeExactEvidenceRef = "conformance:nanobot-config-native-exact-fixture"
export const nanobotConfigNativeExactReplayRef = "config-native-exact:nanobot"

export type NanobotConfigNativeExactAtomID =
  | typeof nanobotConfigSourceNativeExactAtomID
  | typeof nanobotConfigPrecedenceNativeExactAtomID
  | typeof nanobotConfigValidatorNativeExactAtomID

export type NanobotConfigPortID = "config.source" | "config.merge-strategy" | "config.validator"
export type NanobotConfigRecord = Record<string, unknown>
export type NanobotConfigIssueSeverity = "error" | "warning"

export interface NanobotConfigIssue {
  severity: NanobotConfigIssueSeverity
  message: string
  path: string
}

export interface NanobotConfigLoadInput {
  rawConfig?: unknown
  configFileExists?: boolean | undefined
  parseError?: boolean | undefined
}

export interface NanobotConfigNativeDescriptor {
  id: NanobotConfigNativeExactAtomID
  port: NanobotConfigPortID
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof nanobotConfigNativeExactEvidenceRef, typeof nanobotConfigNativeExactReplayRef]
  fixtureIDs: [typeof nanobotConfigNativeExactFixtureID]
  knownLossiness: []
}

export type NanobotConfigNativeExactScenarioID =
  | "config-path-and-defaults"
  | "load-migration-and-validation-fallback"
  | "env-ref-resolution-preserves-excluded-fields"
  | "model-preset-validation-and-resolution"
  | "save-dump-alias-and-exclude-policy"

export interface NanobotConfigNativeExactCase {
  scenarioID: NanobotConfigNativeExactScenarioID
  input: NanobotConfigRecord
  output: NanobotConfigRecord
  upstreamBehavior: string
}

export interface NanobotConfigNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomIDs: readonly [
    typeof nanobotConfigSourceNativeExactAtomID,
    typeof nanobotConfigPrecedenceNativeExactAtomID,
    typeof nanobotConfigValidatorNativeExactAtomID,
  ]
  portIDs: readonly ["config.source", "config.merge-strategy", "config.validator"]
  upstreamRef: typeof nanobotConfigUpstreamRef
  evidenceRef: typeof nanobotConfigNativeExactEvidenceRef
  fixtureID: typeof nanobotConfigNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    defaultConfigPathIsHomeDotNanobotConfigJson: true
    explicitConfigPathOverridesDefaultAndDerivesDataDir: true
    missingInvalidOrValidationFailedConfigLoadsDefaults: true
    jsonFileIsModelValidatedAgainstPydanticSettingsShape: true
    camelCaseAndSnakeCaseAliasesAreAccepted: true
    nestedMissingFieldsReceivePydanticDefaults: true
    unknownNestedModelFieldsAreIgnoredExceptChannelExtras: true
    channelExtrasArePreserved: true
    envReferencesResolveOnlyDuringExplicitResolver: true
    unresolvedEnvReferencesThrowValueError: true
    envResolverPreservesExcludedDreamCronField: true
    legacyExecRestrictToWorkspaceMigratesToToolsRestrictToWorkspace: true
    legacyMyToolFlatKeysMigrateToToolsMySubconfig: true
    newMyToolSubconfigWinsOverLegacyFlatKeys: true
    modelPresetDefaultNameIsReserved: true
    activeModelPresetMustExistUnlessDefault: true
    stringFallbackModelsMustReferenceNamedPresets: true
    saveDumpUsesCamelAliasesAndExcludesDreamCronAndOauthProviderSecrets: true
  }
  cases: NanobotConfigNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: NanobotConfigNativeDescriptor[]
  fingerprint: string
}

export interface NanobotConfigNativeExactIssue {
  id: string
  message: string
}

export interface NanobotConfigNativeExactVerification {
  ok: boolean
  issues: NanobotConfigNativeExactIssue[]
}

export const nanobotConfigNativeExactAtomIDs = [
  nanobotConfigSourceNativeExactAtomID,
  nanobotConfigPrecedenceNativeExactAtomID,
  nanobotConfigValidatorNativeExactAtomID,
] as const

export const nanobotConfigSourceNativeDescriptor = nanobotConfigNativeDescriptor(
  nanobotConfigSourceNativeExactAtomID,
  "config.source",
  "Nanobot upstream native implementation of loader.get_config_path, paths.py runtime directories, JSON config file load fallback, and explicit env reference resolution.",
)

export const nanobotConfigPrecedenceNativeDescriptor = nanobotConfigNativeDescriptor(
  nanobotConfigPrecedenceNativeExactAtomID,
  "config.merge-strategy",
  "Nanobot upstream native implementation of Pydantic default filling, camel/snake aliases, migration of legacy tool keys, and save-time alias/exclude behavior.",
)

export const nanobotConfigValidatorNativeDescriptor = nanobotConfigNativeDescriptor(
  nanobotConfigValidatorNativeExactAtomID,
  "config.validator",
  "Nanobot upstream native implementation of Config model_preset validation, fallback model validation, bounded fields, and preset resolution semantics.",
)

export const nanobotConfigNativeDescriptors = [
  nanobotConfigSourceNativeDescriptor,
  nanobotConfigPrecedenceNativeDescriptor,
  nanobotConfigValidatorNativeDescriptor,
] as const

const providerNames = [
  "custom",
  "azure_openai",
  "bedrock",
  "anthropic",
  "openai",
  "openrouter",
  "huggingface",
  "deepseek",
  "groq",
  "zhipu",
  "dashscope",
  "vllm",
  "ollama",
  "lm_studio",
  "atomic_chat",
  "ovms",
  "gemini",
  "moonshot",
  "minimax",
  "minimax_anthropic",
  "mistral",
  "stepfun",
  "xiaomi_mimo",
  "longcat",
  "aihubmix",
  "siliconflow",
  "volcengine",
  "volcengine_coding_plan",
  "byteplus",
  "byteplus_coding_plan",
  "openai_codex",
  "github_copilot",
  "qianfan",
  "nvidia",
] as const

const providerDefaults: NanobotConfigRecord = Object.fromEntries(
  providerNames.map((name) => [
    name,
    name === "bedrock"
      ? { api_key: null, api_base: null, extra_headers: null, extra_body: null, region: null, profile: null }
      : { api_key: null, api_base: null, extra_headers: null, extra_body: null },
  ]),
)

export const nanobotDefaultConfigShape: NanobotConfigRecord = {
  agents: {
    defaults: {
      workspace: "~/.nanobot/workspace",
      model_preset: null,
      model: "anthropic/claude-opus-4-5",
      provider: "auto",
      max_tokens: 8192,
      context_window_tokens: 65_536,
      context_block_limit: null,
      temperature: 0.1,
      fallback_models: [],
      max_tool_iterations: 200,
      max_concurrent_subagents: 1,
      max_tool_result_chars: 16_000,
      provider_retry_mode: "standard",
      tool_hint_max_length: 40,
      reasoning_effort: null,
      timezone: "UTC",
      bot_name: "nanobot",
      bot_icon: "🐈",
      unified_session: false,
      disabled_skills: [],
      session_ttl_minutes: 0,
      max_messages: 120,
      consolidation_ratio: 0.5,
      dream: {
        interval_h: 2,
        cron: null,
        model_override: null,
        max_batch_size: 20,
        max_iterations: 15,
        annotate_line_ages: true,
      },
    },
  },
  channels: {
    send_progress: true,
    send_tool_hints: false,
    show_reasoning: true,
    send_max_retries: 3,
    transcription_provider: "groq",
    transcription_language: null,
  },
  providers: providerDefaults,
  api: {
    host: "127.0.0.1",
    port: 8900,
    timeout: 120.0,
  },
  gateway: {
    host: "127.0.0.1",
    port: 18790,
    heartbeat: {
      enabled: true,
      interval_s: 1800,
      keep_recent_messages: 8,
    },
  },
  tools: {
    web: {
      enable: true,
      proxy: null,
      user_agent: null,
      search: {
        provider: "duckduckgo",
        api_key: "",
        base_url: "",
        max_results: 5,
        timeout: 30,
      },
      fetch: {
        use_jina_reader: true,
      },
    },
    exec: {
      enable: true,
      timeout: 60,
      path_append: "",
      sandbox: "",
      allowed_env_keys: [],
      allow_patterns: [],
      deny_patterns: [],
    },
    my: {
      enable: true,
      allow_set: false,
    },
    image_generation: {
      enabled: false,
      provider: "openrouter",
      model: "openai/gpt-5.4-image-2",
      default_aspect_ratio: "1:1",
      default_image_size: "1K",
      max_images_per_turn: 4,
      save_dir: "generated",
    },
    restrict_to_workspace: false,
    mcp_servers: {},
    ssrf_whitelist: [],
  },
  model_presets: {},
}

const rootKeys = new Set(Object.keys(nanobotDefaultConfigShape))
const providerKeySet: Set<string> = new Set(providerNames)
const channelDefaultKeys: Set<string> = new Set(Object.keys(nanobotDefaultConfigShape.channels as NanobotConfigRecord))
const envRefPattern = /\${([A-Za-z_][A-Za-z0-9_]*)}/g

const aliasToSnake = new Map<string, string>([
  ["apiBase", "api_base"],
  ["apiKey", "api_key"],
  ["allowPatterns", "allow_patterns"],
  ["allowSet", "allow_set"],
  ["allowedEnvKeys", "allowed_env_keys"],
  ["annotateLineAges", "annotate_line_ages"],
  ["azureOpenai", "azure_openai"],
  ["byteplusCodingPlan", "byteplus_coding_plan"],
  ["consolidationRatio", "consolidation_ratio"],
  ["contextBlockLimit", "context_block_limit"],
  ["contextWindowTokens", "context_window_tokens"],
  ["defaultAspectRatio", "default_aspect_ratio"],
  ["defaultImageSize", "default_image_size"],
  ["denyPatterns", "deny_patterns"],
  ["disabledSkills", "disabled_skills"],
  ["extraBody", "extra_body"],
  ["extraHeaders", "extra_headers"],
  ["fallbackModels", "fallback_models"],
  ["githubCopilot", "github_copilot"],
  ["idleCompactAfterMinutes", "session_ttl_minutes"],
  ["imageGeneration", "image_generation"],
  ["intervalH", "interval_h"],
  ["keepRecentMessages", "keep_recent_messages"],
  ["lmStudio", "lm_studio"],
  ["maxBatchSize", "max_batch_size"],
  ["maxConcurrentSubagents", "max_concurrent_subagents"],
  ["maxImagesPerTurn", "max_images_per_turn"],
  ["maxIterations", "max_iterations"],
  ["maxMessages", "max_messages"],
  ["maxResults", "max_results"],
  ["maxTokens", "max_tokens"],
  ["maxToolIterations", "max_tool_iterations"],
  ["maxToolResultChars", "max_tool_result_chars"],
  ["mcpServers", "mcp_servers"],
  ["minimaxAnthropic", "minimax_anthropic"],
  ["modelOverride", "model_override"],
  ["modelPreset", "model_preset"],
  ["modelPresets", "model_presets"],
  ["openaiCodex", "openai_codex"],
  ["pathAppend", "path_append"],
  ["providerRetryMode", "provider_retry_mode"],
  ["reasoningEffort", "reasoning_effort"],
  ["restrictToWorkspace", "restrict_to_workspace"],
  ["saveDir", "save_dir"],
  ["sendMaxRetries", "send_max_retries"],
  ["sendProgress", "send_progress"],
  ["sendToolHints", "send_tool_hints"],
  ["sessionTtlMinutes", "session_ttl_minutes"],
  ["showReasoning", "show_reasoning"],
  ["siliconflow", "siliconflow"],
  ["ssrfWhitelist", "ssrf_whitelist"],
  ["toolHintMaxLength", "tool_hint_max_length"],
  ["transcriptionLanguage", "transcription_language"],
  ["transcriptionProvider", "transcription_provider"],
  ["unifiedSession", "unified_session"],
  ["useJinaReader", "use_jina_reader"],
  ["userAgent", "user_agent"],
  ["volcengineCodingPlan", "volcengine_coding_plan"],
  ["xiaomiMimo", "xiaomi_mimo"],
])

const snakeToCamel = new Map<string, string>(
  Array.from(aliasToSnake.entries())
    .filter(([camel, snake]) => camel !== snake)
    .map(([camel, snake]) => [snake, camel]),
)

export function getNanobotConfigPath(input: { homeDir: string; currentConfigPath?: string | undefined }): string {
  return input.currentConfigPath ?? join(input.homeDir, ".nanobot", "config.json")
}

export function getNanobotDataDir(input: { homeDir: string; currentConfigPath?: string | undefined }): string {
  return dirname(getNanobotConfigPath(input))
}

export function getNanobotRuntimeSubdir(input: { homeDir: string; currentConfigPath?: string | undefined; name: string }): string {
  return join(getNanobotDataDir(input), input.name)
}

export function getNanobotWorkspacePath(input: { homeDir: string; workspace?: string | undefined }): string {
  return expandTilde(input.workspace ?? "~/.nanobot/workspace", input.homeDir)
}

export function loadNanobotConfigData(input: NanobotConfigLoadInput = {}): NanobotConfigRecord {
  if (input.configFileExists === false || input.parseError || !isPlainRecord(input.rawConfig ?? {})) {
    return deepClone(nanobotDefaultConfigShape)
  }
  const normalized = normalizeNanobotConfigAliases(migrateNanobotConfigData(input.rawConfig as NanobotConfigRecord)) as NanobotConfigRecord
  const validation = validateNanobotConfigStructure(normalized)
  if (validation.some((issue) => issue.severity === "error")) return deepClone(nanobotDefaultConfigShape)
  return applyNanobotConfigDefaults(normalized)
}

export function migrateNanobotConfigData(config: NanobotConfigRecord): NanobotConfigRecord {
  const migrated = deepClone(config)
  const tools = isPlainRecord(migrated.tools) ? { ...migrated.tools } : undefined
  if (!tools) return migrated

  const exec = isPlainRecord(tools.exec) ? { ...tools.exec } : undefined
  if (exec && hasOwn(exec, "restrictToWorkspace") && !hasOwn(tools, "restrictToWorkspace") && !hasOwn(tools, "restrict_to_workspace")) {
    tools.restrictToWorkspace = exec.restrictToWorkspace
    delete exec.restrictToWorkspace
    tools.exec = exec
  }

  if (hasOwn(tools, "myEnabled") || hasOwn(tools, "mySet")) {
    const my = isPlainRecord(tools.my) ? { ...tools.my } : {}
    if (hasOwn(tools, "myEnabled") && !hasOwn(my, "enable")) my.enable = tools.myEnabled
    if (hasOwn(tools, "mySet") && !hasOwn(my, "allowSet") && !hasOwn(my, "allow_set")) my.allowSet = tools.mySet
    delete tools.myEnabled
    delete tools.mySet
    tools.my = my
  }

  migrated.tools = tools
  return migrated
}

export function normalizeNanobotConfigAliases(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => normalizeNanobotConfigAliases(entry))
  if (!isPlainRecord(value)) return value
  const result: NanobotConfigRecord = {}
  for (const [key, entry] of Object.entries(value)) {
    result[aliasToSnake.get(key) ?? key] = normalizeNanobotConfigAliases(entry)
  }
  return result
}

export function applyNanobotConfigDefaults(config: NanobotConfigRecord): NanobotConfigRecord {
  const result = deepClone(nanobotDefaultConfigShape)
  mergeKnown(result, config, [])
  return result
}

export function resolveNanobotConfigEnvVars(value: unknown, env: Record<string, string | undefined> = {}): unknown {
  if (typeof value === "string") {
    return value.replace(envRefPattern, (_match, name: string) => {
      const replacement = env[name]
      if (replacement === undefined) throw new Error(`Environment variable '${name}' referenced in config is not set`)
      return replacement
    })
  }
  if (Array.isArray(value)) return value.map((entry) => resolveNanobotConfigEnvVars(entry, env))
  if (isPlainRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolveNanobotConfigEnvVars(entry, env)]))
  }
  return value
}

export function validateNanobotConfigStructure(input: unknown): NanobotConfigIssue[] {
  const issues: NanobotConfigIssue[] = []
  if (!isPlainRecord(input)) {
    return [{ severity: "error", path: "$", message: "Config.model_validate expects a mapping object." }]
  }
  const config = normalizeNanobotConfigAliases(input) as NanobotConfigRecord
  for (const key of Object.keys(config)) {
    if (!rootKeys.has(key)) {
      issues.push({ severity: "error", path: key, message: `extra root field ${key} is not permitted by Config settings model` })
    }
  }

  const agents = isPlainRecord(config.agents) ? config.agents : {}
  const defaults = isPlainRecord(agents.defaults) ? agents.defaults : {}
  const modelPresets = isPlainRecord(config.model_presets) ? config.model_presets : {}
  const modelPresetName = stringOrUndefined(defaults.model_preset)
  if (hasOwn(modelPresets, "default")) {
    issues.push({ severity: "error", path: "model_presets.default", message: "model_preset name 'default' is reserved for agents.defaults" })
  }
  if (modelPresetName && modelPresetName !== "default" && !hasOwn(modelPresets, modelPresetName)) {
    issues.push({ severity: "error", path: "agents.defaults.model_preset", message: `model_preset ${JSON.stringify(modelPresetName)} not found in model_presets` })
  }
  const fallbackModels = Array.isArray(defaults.fallback_models) ? defaults.fallback_models : []
  for (const [index, fallback] of fallbackModels.entries()) {
    if (typeof fallback === "string" && !hasOwn(modelPresets, fallback)) {
      issues.push({ severity: "error", path: `agents.defaults.fallback_models.${index}`, message: `fallback_models entry ${JSON.stringify(fallback)} not found in model_presets` })
    }
  }

  const channels = isPlainRecord(config.channels) ? config.channels : {}
  const sendMaxRetries = numberOrUndefined(channels.send_max_retries)
  if (sendMaxRetries !== undefined && (!Number.isInteger(sendMaxRetries) || sendMaxRetries < 0 || sendMaxRetries > 10)) {
    issues.push({ severity: "error", path: "channels.send_max_retries", message: "send_max_retries must be an integer between 0 and 10" })
  }
  const maxConcurrentSubagents = numberOrUndefined(defaults.max_concurrent_subagents)
  if (maxConcurrentSubagents !== undefined && (!Number.isInteger(maxConcurrentSubagents) || maxConcurrentSubagents < 1)) {
    issues.push({ severity: "error", path: "agents.defaults.max_concurrent_subagents", message: "max_concurrent_subagents must be greater than or equal to 1" })
  }
  const consolidationRatio = numberOrUndefined(defaults.consolidation_ratio)
  if (consolidationRatio !== undefined && (consolidationRatio < 0.1 || consolidationRatio > 0.95)) {
    issues.push({ severity: "error", path: "agents.defaults.consolidation_ratio", message: "consolidation_ratio must be between 0.1 and 0.95" })
  }
  const dream = isPlainRecord(defaults.dream) ? defaults.dream : {}
  const dreamInterval = numberOrUndefined(dream.interval_h)
  if (dreamInterval !== undefined && (!Number.isInteger(dreamInterval) || dreamInterval < 1)) {
    issues.push({ severity: "error", path: "agents.defaults.dream.interval_h", message: "dream.interval_h must be greater than or equal to 1" })
  }
  const maxBatchSize = numberOrUndefined(dream.max_batch_size)
  if (maxBatchSize !== undefined && (!Number.isInteger(maxBatchSize) || maxBatchSize < 1)) {
    issues.push({ severity: "error", path: "agents.defaults.dream.max_batch_size", message: "dream.max_batch_size must be greater than or equal to 1" })
  }
  return issues
}

export function resolveNanobotModelPreset(config: NanobotConfigRecord, name?: string | null | undefined): NanobotConfigRecord {
  const normalized = applyNanobotConfigDefaults(normalizeNanobotConfigAliases(config) as NanobotConfigRecord)
  const defaults = ((normalized.agents as NanobotConfigRecord).defaults ?? {}) as NanobotConfigRecord
  const modelPresets = normalized.model_presets as NanobotConfigRecord
  const presetName = name === undefined || name === null ? stringOrUndefined(defaults.model_preset) : name
  if (!presetName || presetName === "default") return defaultPresetFromAgentDefaults(defaults)
  const preset = modelPresets[presetName]
  if (!isPlainRecord(preset)) throw new Error(`model_preset '${presetName}' not found in model_presets`)
  return applyPresetDefaults(preset)
}

export function dumpNanobotConfigForSave(config: NanobotConfigRecord): NanobotConfigRecord {
  const normalized = applyNanobotConfigDefaults(normalizeNanobotConfigAliases(config) as NanobotConfigRecord)
  return toCamelAliasDump(normalized, []) as NanobotConfigRecord
}

export function buildNanobotConfigNativeExactFixture(): NanobotConfigNativeExactFixture {
  const cases: NanobotConfigNativeExactCase[] = [
    {
      scenarioID: "config-path-and-defaults",
      input: { homeDir: "/home/nano", explicitPath: "/tmp/bots/one/config.json" },
      output: {
        defaultConfigPath: "/home/nano/.nanobot/config.json",
        explicitConfigPath: "/tmp/bots/one/config.json",
        explicitDataDir: "/tmp/bots/one",
        logsDir: "/tmp/bots/one/logs",
        defaultWorkspace: "/home/nano/.nanobot/workspace",
        defaultModel: "anthropic/claude-opus-4-5",
        defaultProvider: "auto",
        defaultMaxMessages: 120,
      },
      upstreamBehavior: "loader.get_config_path defaults to Path.home()/.nanobot/config.json unless set_config_path supplied an override; paths.py derives runtime dirs from the active config path parent and workspace defaults to ~/.nanobot/workspace.",
    },
    {
      scenarioID: "load-migration-and-validation-fallback",
      input: {
        rawConfig: {
          agents: { defaults: { maxTokens: 1234, memoryWindow: 42 } },
          tools: { exec: { restrictToWorkspace: true }, myEnabled: false, mySet: true },
          channels: { qq: { msgFormat: "plain" } },
        },
      },
      output: {
        maxTokens: 1234,
        contextWindowTokens: 65_536,
        memoryWindowPresent: false,
        restrictToWorkspace: true,
        execRestrictToWorkspacePresent: false,
        my: { enable: false, allowSet: true },
        channelExtraPreserved: "plain",
        invalidConfigFallbackModel: "anthropic/claude-opus-4-5",
      },
      upstreamBehavior: "load_config JSON-loads, migrates legacy tools.exec.restrictToWorkspace and tools.my* keys, Pydantic-fills missing defaults, ignores unknown nested model fields such as memoryWindow, preserves ChannelsConfig extras, and falls back to Config() on validation failure.",
    },
    {
      scenarioID: "env-ref-resolution-preserves-excluded-fields",
      input: {
        rawConfig: {
          agents: { defaults: { dream: { cron: "5 11 * * *" } } },
          providers: { groq: { apiKey: "${TEST_API_KEY}" } },
        },
        env: { TEST_API_KEY: "resolved-key" },
      },
      output: {
        rawApiKey: "${TEST_API_KEY}",
        resolvedApiKey: "resolved-key",
        cron: "5 11 * * *",
        missingEnvError: "Environment variable 'DOES_NOT_EXIST' referenced in config is not set",
      },
      upstreamBehavior: "load_config does not resolve env refs; resolve_config_env_vars walks strings, dicts, lists, and BaseModel fields, preserving DreamConfig.cron despite exclude=True and throwing ValueError for missing vars.",
    },
    {
      scenarioID: "model-preset-validation-and-resolution",
      input: {
        rawConfig: {
          modelPresets: { fast: { model: "openai/gpt-4.1", provider: "openai", maxTokens: 4096 } },
          agents: { defaults: { modelPreset: "fast", fallbackModels: ["fast"] } },
        },
      },
      output: {
        activePresetModel: "openai/gpt-4.1",
        activePresetProvider: "openai",
        activePresetMaxTokens: 4096,
        defaultPresetModel: "anthropic/claude-opus-4-5",
        reservedDefaultIssuePath: "model_presets.default",
        unknownFallbackIssuePath: "agents.defaults.fallback_models.0",
      },
      upstreamBehavior: "Config._validate_model_preset rejects a reserved default preset name, rejects unknown active preset names, rejects string fallback_models that do not name a preset, and resolve_preset('default') returns agents.defaults fields.",
    },
    {
      scenarioID: "save-dump-alias-and-exclude-policy",
      input: {
        rawConfig: {
          agents: { defaults: { dream: { cron: "0 */4 * * *", intervalH: 5 } } },
          providers: { openaiCodex: { apiKey: "oauth-secret" }, groq: { apiKey: "${GROQ_API_KEY}" } },
          tools: { my: { allowSet: true } },
        },
      },
      output: {
        dumpedIntervalH: 5,
        dumpedCronPresent: false,
        dumpedGroqApiKey: "${GROQ_API_KEY}",
        dumpedOpenAICodexPresent: false,
        dumpedAllowSet: true,
      },
      upstreamBehavior: "save_config writes Config.model_dump(mode='json', by_alias=True), which uses camel aliases and excludes DreamConfig.cron plus exclude=True OAuth provider configs while preserving unresolved env templates.",
    },
  ]
  const fixture: Omit<NanobotConfigNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "nanobot",
    atomIDs: nanobotConfigNativeExactAtomIDs,
    portIDs: ["config.source", "config.merge-strategy", "config.validator"],
    upstreamRef: nanobotConfigUpstreamRef,
    evidenceRef: nanobotConfigNativeExactEvidenceRef,
    fixtureID: nanobotConfigNativeExactFixtureID,
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    policy: {
      defaultConfigPathIsHomeDotNanobotConfigJson: true,
      explicitConfigPathOverridesDefaultAndDerivesDataDir: true,
      missingInvalidOrValidationFailedConfigLoadsDefaults: true,
      jsonFileIsModelValidatedAgainstPydanticSettingsShape: true,
      camelCaseAndSnakeCaseAliasesAreAccepted: true,
      nestedMissingFieldsReceivePydanticDefaults: true,
      unknownNestedModelFieldsAreIgnoredExceptChannelExtras: true,
      channelExtrasArePreserved: true,
      envReferencesResolveOnlyDuringExplicitResolver: true,
      unresolvedEnvReferencesThrowValueError: true,
      envResolverPreservesExcludedDreamCronField: true,
      legacyExecRestrictToWorkspaceMigratesToToolsRestrictToWorkspace: true,
      legacyMyToolFlatKeysMigrateToToolsMySubconfig: true,
      newMyToolSubconfigWinsOverLegacyFlatKeys: true,
      modelPresetDefaultNameIsReserved: true,
      activeModelPresetMustExistUnlessDefault: true,
      stringFallbackModelsMustReferenceNamedPresets: true,
      saveDumpUsesCamelAliasesAndExcludesDreamCronAndOauthProviderSecrets: true,
    },
    cases,
    sourceRefs: [
      `${nanobotConfigUpstreamRef}:nanobot/config/loader.py#set_config_path,get_config_path,load_config,save_config,resolve_config_env_vars,_resolve_in_place,_resolve_env_vars,_env_replace,_migrate_config`,
      `${nanobotConfigUpstreamRef}:nanobot/config/paths.py#get_config_path,get_data_dir,get_runtime_subdir,get_workspace_path,is_default_workspace`,
      `${nanobotConfigUpstreamRef}:nanobot/config/schema.py#Base,ChannelsConfig,DreamConfig,AgentDefaults,AgentsConfig,ProviderConfig,ProvidersConfig,ToolsConfig,Config,_validate_model_preset,resolve_default_preset,resolve_preset,workspace_path`,
      `${nanobotConfigUpstreamRef}:nanobot/agent/tools/web.py#WebSearchConfig,WebFetchConfig,WebToolsConfig`,
      `${nanobotConfigUpstreamRef}:nanobot/agent/tools/shell.py#ExecToolConfig`,
      `${nanobotConfigUpstreamRef}:nanobot/agent/tools/self.py#MyToolConfig`,
      `${nanobotConfigUpstreamRef}:nanobot/agent/tools/image_generation.py#ImageGenerationToolConfig`,
      `${nanobotConfigUpstreamRef}:tests/config/test_env_interpolation.py#TestResolveEnvVars,TestResolveConfig`,
      `${nanobotConfigUpstreamRef}:tests/config/test_config_migration.py#test_load_config_keeps_max_tokens_and_ignores_legacy_memory_window,test_load_config_migrates_legacy_my_tool_keys,test_new_my_tool_keys_take_precedence_over_legacy,test_load_config_resets_ssrf_whitelist_when_next_config_is_empty`,
      `${nanobotConfigUpstreamRef}:tests/config/test_model_presets.py#test_resolve_preset_returns_defaults_when_no_preset,test_resolve_preset_returns_active_preset,test_validator_rejects_unknown_preset,test_model_presets_rejects_reserved_default_name`,
    ],
    nativeEvidenceRefs: [nanobotConfigNativeExactEvidenceRef, nanobotConfigNativeExactReplayRef],
    fixtureIDs: [nanobotConfigNativeExactFixtureID],
    knownLossiness: [],
    descriptors: nanobotConfigNativeDescriptors.map((descriptor) => ({ ...descriptor })),
  }
  return {
    ...fixture,
    fingerprint: fingerprintNanobotConfigFixture(fixture),
  }
}

export function verifyNanobotConfigNativeExactFixture(fixture: NanobotConfigNativeExactFixture): NanobotConfigNativeExactVerification {
  const issues: NanobotConfigNativeExactIssue[] = []
  const expected = buildNanobotConfigNativeExactFixture()
  if (fixture.schemaVersion !== 1) issues.push(issue("schema-version", "Nanobot config native exact fixture schemaVersion must be 1."))
  if (fixture.product !== "nanobot") issues.push(issue("product", "Nanobot config native exact fixture product must be nanobot."))
  if (fixture.upstreamRef !== nanobotConfigUpstreamRef) issues.push(issue("upstream-ref", "Nanobot config fixture must pin the audited HKUDS/nanobot commit."))
  if (fixture.evidenceRef !== nanobotConfigNativeExactEvidenceRef) issues.push(issue("evidence-ref", "Nanobot config fixture evidenceRef changed."))
  if (fixture.fixtureID !== nanobotConfigNativeExactFixtureID) issues.push(issue("fixture-id", "Nanobot config fixtureID changed."))
  if (fixture.exactDiffStatus !== "native-exact") issues.push(issue("exact-diff", "Nanobot config fixture must remain native-exact."))
  if (fixture.nativeParityClaim !== true) issues.push(issue("parity-claim", "Nanobot config fixture must assert nativeParityClaim true."))
  if (!sameStringSet(fixture.atomIDs, nanobotConfigNativeExactAtomIDs)) issues.push(issue("atom-ids", "Nanobot config fixture atomIDs must cover source, precedence, and validator atoms."))
  if (!sameStringSet(fixture.portIDs, ["config.source", "config.merge-strategy", "config.validator"])) issues.push(issue("port-ids", "Nanobot config fixture portIDs changed."))
  if (!sameStringSet(fixture.nativeEvidenceRefs, [nanobotConfigNativeExactEvidenceRef, nanobotConfigNativeExactReplayRef])) {
    issues.push(issue("native-evidence", "Nanobot config fixture native evidence refs must include conformance and replay refs."))
  }
  if (!sameStringSet(fixture.fixtureIDs, [nanobotConfigNativeExactFixtureID])) issues.push(issue("fixture-ids", "Nanobot config fixture IDs must include the native exact fixture."))
  if (fixture.knownLossiness.length > 0) issues.push(issue("lossiness", "Nanobot config native exact fixture must not carry knownLossiness."))
  if (fixture.sourceRefs.length < 8) issues.push(issue("source-refs", "Nanobot config fixture must include loader, paths, schema, tool default, and upstream test source refs."))
  if (fixture.cases.length !== expected.cases.length) issues.push(issue("cases", "Nanobot config native exact fixture case count changed."))
  if (fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0 || descriptor.parityCoverage !== "native")) {
    issues.push(issue("descriptors", "Nanobot config native descriptors must remain native and lossless."))
  }
  if (fixture.fingerprint !== fingerprintNanobotConfigFixture({ ...fixture, fingerprint: undefined } as unknown as Omit<NanobotConfigNativeExactFixture, "fingerprint">)) {
    issues.push(issue("fingerprint", "Nanobot config native exact fixture fingerprint is stale."))
  }
  return { ok: issues.length === 0, issues }
}

function nanobotConfigNativeDescriptor(
  id: NanobotConfigNativeExactAtomID,
  port: NanobotConfigPortID,
  selectionReason: string,
): NanobotConfigNativeDescriptor {
  return {
    id,
    port,
    product: "nanobot",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [nanobotConfigNativeExactEvidenceRef, nanobotConfigNativeExactReplayRef],
    fixtureIDs: [nanobotConfigNativeExactFixtureID],
    knownLossiness: [],
  }
}

function mergeKnown(target: NanobotConfigRecord, source: NanobotConfigRecord, path: string[]): void {
  for (const [key, value] of Object.entries(source)) {
    if (!shouldKeepKey(key, path, target)) continue
    const current = target[key]
    if (isPlainRecord(current) && isPlainRecord(value)) {
      mergeKnown(current as NanobotConfigRecord, value, [...path, key])
    } else {
      target[key] = deepClone(value)
    }
  }
}

function shouldKeepKey(key: string, path: string[], target: NanobotConfigRecord): boolean {
  if (path.length === 0) return rootKeys.has(key)
  if (path.length === 1 && path[0] === "providers") return providerKeySet.has(key)
  if (path.length === 1 && path[0] === "channels") return true
  if (path.length === 2 && path[0] === "channels") {
    const channelName = path[1] ?? ""
    if (!channelDefaultKeys.has(channelName)) return true
  }
  if (path.length === 1 && path[0] === "model_presets") return true
  if (path[0] === "tools" && path[1] === "mcp_servers") return true
  return hasOwn(target, key)
}

function applyPresetDefaults(preset: NanobotConfigRecord): NanobotConfigRecord {
  return {
    model: stringOrUndefined(preset.model) ?? "",
    provider: stringOrUndefined(preset.provider) ?? "auto",
    max_tokens: numberOrUndefined(preset.max_tokens) ?? 8192,
    context_window_tokens: numberOrUndefined(preset.context_window_tokens) ?? 65_536,
    temperature: numberOrUndefined(preset.temperature) ?? 0.1,
    reasoning_effort: preset.reasoning_effort ?? null,
  }
}

function defaultPresetFromAgentDefaults(defaults: NanobotConfigRecord): NanobotConfigRecord {
  return {
    model: defaults.model,
    provider: defaults.provider,
    max_tokens: defaults.max_tokens,
    context_window_tokens: defaults.context_window_tokens,
    temperature: defaults.temperature,
    reasoning_effort: defaults.reasoning_effort ?? null,
  }
}

function toCamelAliasDump(value: unknown, path: string[]): unknown {
  if (Array.isArray(value)) return value.map((entry) => toCamelAliasDump(entry, path))
  if (!isPlainRecord(value)) return value
  const result: NanobotConfigRecord = {}
  for (const [key, entry] of Object.entries(value)) {
    if (path.join(".") === "agents.defaults.dream" && key === "cron") continue
    if (path.join(".") === "providers" && (key === "openai_codex" || key === "github_copilot")) continue
    const outputKey = snakeToCamel.get(key) ?? key
    result[outputKey] = toCamelAliasDump(entry, [...path, key])
  }
  return result
}

function expandTilde(path: string, homeDir: string): string {
  if (path === "~") return homeDir
  if (path.startsWith("~/")) return join(homeDir, path.slice(2))
  return resolvePath(path)
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function isPlainRecord(value: unknown): value is NanobotConfigRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function hasOwn(record: NanobotConfigRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((entry) => rightSet.has(entry))
}

function fingerprintNanobotConfigFixture(fixture: Omit<NanobotConfigNativeExactFixture, "fingerprint">): string {
  return createHash("sha256").update(stableStringify(fixture)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function issue(id: string, message: string): NanobotConfigNativeExactIssue {
  return { id, message }
}
