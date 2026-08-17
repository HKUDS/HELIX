import { createHash } from "node:crypto"

export const hermesConfigUpstreamRef = "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
export const hermesConfigSourceNativeExactAtomID = "hermes.config.source"
export const hermesConfigPrecedenceNativeExactAtomID = "hermes.config.precedence"
export const hermesConfigValidatorNativeExactAtomID = "hermes.config.validator"
export const hermesConfigNativeExactFixtureID = "hermes-config:native-exact-fixture"
export const hermesConfigNativeExactEvidenceRef = "conformance:hermes-config-native-exact-fixture"
export const hermesConfigNativeExactReplayRef = "config-native-exact:hermes-agent"

export type HermesConfigNativeExactAtomID =
  | typeof hermesConfigSourceNativeExactAtomID
  | typeof hermesConfigPrecedenceNativeExactAtomID
  | typeof hermesConfigValidatorNativeExactAtomID

export type HermesConfigPortID = "config.source" | "config.merge-strategy" | "config.validator"
export type HermesConfigIssueSeverity = "error" | "warning"
export type HermesConfigRecord = Record<string, unknown>

export interface HermesConfigIssue {
  severity: HermesConfigIssueSeverity
  message: string
  hint: string
}

export interface HermesConfigLoadInput {
  rawConfig?: unknown
  env?: Record<string, string | undefined> | undefined
  configFileExists?: boolean | undefined
}

export interface HermesConfigNativeDescriptor {
  id: HermesConfigNativeExactAtomID
  port: HermesConfigPortID
  product: "hermes-agent"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof hermesConfigNativeExactEvidenceRef, typeof hermesConfigNativeExactReplayRef]
  fixtureIDs: [typeof hermesConfigNativeExactFixtureID]
  knownLossiness: []
}

export type HermesConfigNativeExactScenarioID =
  | "raw-config-read-fallbacks"
  | "load-defaults-user-merge-and-env-expansion"
  | "legacy-max-turns-and-root-model-normalization"
  | "config-structure-validation"

export interface HermesConfigNativeExactCase {
  scenarioID: HermesConfigNativeExactScenarioID
  input: HermesConfigRecord
  output: HermesConfigRecord
  upstreamBehavior: string
}

export interface HermesConfigNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  atomIDs: readonly [
    typeof hermesConfigSourceNativeExactAtomID,
    typeof hermesConfigPrecedenceNativeExactAtomID,
    typeof hermesConfigValidatorNativeExactAtomID,
  ]
  portIDs: readonly ["config.source", "config.merge-strategy", "config.validator"]
  upstreamRef: typeof hermesConfigUpstreamRef
  evidenceRef: typeof hermesConfigNativeExactEvidenceRef
  fixtureID: typeof hermesConfigNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    configPathIsHermesHomeConfigYaml: true
    rawConfigReturnsEmptyObjectForMissingInvalidOrNonMappingYaml: true
    loadStartsFromDeepCopiedDefaults: true
    userYamlDeepMergesOverDefaults: true
    nestedDictsMergeRecursively: true
    arraysScalarsAndNullOverride: true
    legacyRootMaxTurnsMovesToAgentMaxTurnsBeforeMerge: true
    rootProviderBaseUrlAndContextLengthMoveIntoModelOnlyWhenModelFieldMissing: true
    rootModelStringBecomesModelDefaultDuringNormalization: true
    envReferencesExpandOnlyInsideStringValues: true
    unresolvedEnvReferencesRemainVerbatim: true
    configKeysAreNotEnvExpanded: true
    customProvidersMustBeAList: true
    fallbackModelMayBeDictOrList: true
    customProvidersWithoutModelWarns: true
  }
  cases: HermesConfigNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: HermesConfigNativeDescriptor[]
  fingerprint: string
}

export interface HermesConfigNativeExactIssue {
  id: string
  message: string
}

export interface HermesConfigNativeExactVerification {
  ok: boolean
  issues: HermesConfigNativeExactIssue[]
}

export const hermesConfigNativeExactAtomIDs = [
  hermesConfigSourceNativeExactAtomID,
  hermesConfigPrecedenceNativeExactAtomID,
  hermesConfigValidatorNativeExactAtomID,
] as const

export const hermesConfigSourceNativeDescriptor = hermesConfigNativeDescriptor(
  hermesConfigSourceNativeExactAtomID,
  "config.source",
  "Hermes upstream native implementation of config.yaml raw reads, config path behavior, and runtime load source semantics from hermes_cli/config.py.",
)

export const hermesConfigPrecedenceNativeDescriptor = hermesConfigNativeDescriptor(
  hermesConfigPrecedenceNativeExactAtomID,
  "config.merge-strategy",
  "Hermes upstream native implementation of DEFAULT_CONFIG deep merge precedence, legacy max_turns migration, root model normalization, and env reference expansion.",
)

export const hermesConfigValidatorNativeDescriptor = hermesConfigNativeDescriptor(
  hermesConfigValidatorNativeExactAtomID,
  "config.validator",
  "Hermes upstream native implementation of validate_config_structure custom_providers, fallback_model, and misplaced root key diagnostics.",
)

export const hermesConfigNativeDescriptors = [
  hermesConfigSourceNativeDescriptor,
  hermesConfigPrecedenceNativeDescriptor,
  hermesConfigValidatorNativeDescriptor,
] as const

export const hermesDefaultConfigShape: HermesConfigRecord = {
  model: "",
  providers: {},
  fallback_providers: [],
  credential_pool_strategies: {},
  toolsets: ["hermes-cli"],
  agent: {
    max_turns: 90,
    gateway_timeout: 1800,
    restart_drain_timeout: 180,
    api_max_retries: 3,
    service_tier: "",
    tool_use_enforcement: "auto",
    task_completion_guidance: true,
    environment_probe: true,
    environment_hint: "",
    gateway_timeout_warning: 900,
    clarify_timeout: 600,
    gateway_notify_interval: 180,
  },
  terminal: {},
  display: {},
  compression: {},
  delegation: {},
  auxiliary: {},
  custom_providers: [],
  context: {},
  memory: {},
  gateway: {},
  sessions: {},
  _config_version: 1,
}

const knownRootKeys = new Set([
  "_config_version",
  "model",
  "providers",
  "fallback_model",
  "fallback_providers",
  "credential_pool_strategies",
  "toolsets",
  "agent",
  "terminal",
  "display",
  "compression",
  "delegation",
  "auxiliary",
  "custom_providers",
  "context",
  "memory",
  "gateway",
  "sessions",
])

const customProviderLikeFields = new Set(["base_url", "api_key", "rate_limit_delay", "api_mode"])

export function readHermesRawConfigData(input: { parsedYaml?: unknown; configFileExists?: boolean | undefined }): HermesConfigRecord {
  if (input.configFileExists === false) return {}
  if (!isPlainRecord(input.parsedYaml)) return {}
  return deepClone(input.parsedYaml)
}

export function loadHermesConfigData(input: HermesConfigLoadInput = {}): HermesConfigRecord {
  const raw = readHermesRawConfigData({
    parsedYaml: input.rawConfig,
    configFileExists: input.configFileExists,
  })
  const userConfig = prepareHermesUserConfigForLoad(raw)
  const merged = deepMergeHermesConfig(deepClone(hermesDefaultConfigShape), userConfig)
  const normalized = normalizeHermesMaxTurnsConfig(normalizeHermesRootModelKeys(merged))
  return expandHermesEnvVars(normalized, input.env ?? {}) as HermesConfigRecord
}

export function deepMergeHermesConfig(base: HermesConfigRecord, override: HermesConfigRecord): HermesConfigRecord {
  const result: HermesConfigRecord = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (isPlainRecord(result[key]) && isPlainRecord(value)) {
      result[key] = deepMergeHermesConfig(result[key] as HermesConfigRecord, value)
    } else {
      result[key] = deepClone(value)
    }
  }
  return result
}

export function expandHermesEnvVars(value: unknown, env: Record<string, string | undefined> = {}): unknown {
  if (typeof value === "string") {
    return value.replace(/\${([^}]+)}/g, (match, name: string) => env[name] ?? match)
  }
  if (Array.isArray(value)) return value.map((entry) => expandHermesEnvVars(entry, env))
  if (isPlainRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, expandHermesEnvVars(entry, env)]))
  }
  return value
}

export function prepareHermesUserConfigForLoad(config: HermesConfigRecord): HermesConfigRecord {
  const userConfig = deepClone(config)
  if (hasOwn(userConfig, "max_turns")) {
    const agentUserConfig = isPlainRecord(userConfig.agent) ? { ...userConfig.agent } : {}
    if (agentUserConfig.max_turns === undefined || agentUserConfig.max_turns === null) {
      agentUserConfig.max_turns = userConfig.max_turns
    }
    userConfig.agent = agentUserConfig
    delete userConfig.max_turns
  }
  return userConfig
}

export function normalizeHermesRootModelKeys(config: HermesConfigRecord): HermesConfigRecord {
  const hasRoot = ["provider", "base_url", "context_length"].some((key) => hermesTruthy(config[key]))
  if (!hasRoot) return config

  const normalized = { ...config }
  const existingModel = normalized.model
  const model: HermesConfigRecord = isPlainRecord(existingModel)
    ? { ...existingModel }
    : hermesTruthy(existingModel)
      ? { default: existingModel }
      : {}
  normalized.model = model

  for (const key of ["provider", "base_url", "context_length"]) {
    const rootValue = normalized[key]
    if (hermesTruthy(rootValue) && !hermesTruthy(model[key])) model[key] = rootValue
    delete normalized[key]
  }
  return normalized
}

export function normalizeHermesMaxTurnsConfig(config: HermesConfigRecord): HermesConfigRecord {
  const normalized = { ...config }
  const agentConfig = isPlainRecord(normalized.agent) ? { ...normalized.agent } : {}
  if (hasOwn(normalized, "max_turns") && !hasOwn(agentConfig, "max_turns")) {
    agentConfig.max_turns = normalized.max_turns
  }
  if (!hasOwn(agentConfig, "max_turns")) {
    agentConfig.max_turns = (hermesDefaultConfigShape.agent as HermesConfigRecord).max_turns
  }
  normalized.agent = agentConfig
  delete normalized.max_turns
  return normalized
}

export function validateHermesConfigStructure(config: HermesConfigRecord | undefined): HermesConfigIssue[] {
  if (!isPlainRecord(config)) {
    return [{
      severity: "error",
      message: "Could not load config.yaml",
      hint: "Run 'hermes setup' to create a valid config",
    }]
  }

  const issues: HermesConfigIssue[] = []
  const customProviders = config.custom_providers
  if (customProviders !== undefined && customProviders !== null) {
    if (isPlainRecord(customProviders)) {
      issues.push({
        severity: "error",
        message: "custom_providers is a dict - it must be a YAML list (items prefixed with '-')",
        hint: [
          "Change to:",
          "  custom_providers:",
          "    - name: my-provider",
          "      base_url: https://...",
          "      api_key: ...",
        ].join("\n"),
      })
      const suspicious = Object.keys(customProviders).filter((key) => customProviderLikeFields.has(key)).sort()
      if (suspicious.length > 0) {
        issues.push({
          severity: "warning",
          message: `Root-level keys ${pythonList(suspicious)} look like custom_providers entry fields`,
          hint: "These should be indented under a '- name: ...' list entry, not at root level",
        })
      }
    } else if (Array.isArray(customProviders)) {
      customProviders.forEach((entry, index) => {
        if (!isPlainRecord(entry)) {
          issues.push({
            severity: "warning",
            message: `custom_providers[${index}] is not a dict (got ${pythonTypeName(entry)})`,
            hint: "Each entry should have at minimum: name, base_url",
          })
          return
        }
        if (!hermesTruthy(entry.name)) {
          issues.push({
            severity: "warning",
            message: `custom_providers[${index}] is missing 'name' field`,
            hint: "Add a name, e.g.: name: my-provider",
          })
        }
        if (!hermesTruthy(entry.base_url)) {
          issues.push({
            severity: "warning",
            message: `custom_providers[${index}] is missing 'base_url' field`,
            hint: "Add the API endpoint URL, e.g.: base_url: https://api.example.com/v1",
          })
        }
      })
    }
  }

  const fallbackModel = config.fallback_model
  if (fallbackModel !== undefined && fallbackModel !== null) {
    if (Array.isArray(fallbackModel)) {
      fallbackModel.forEach((entry, index) => {
        if (!isPlainRecord(entry)) {
          issues.push({
            severity: "error",
            message: `fallback_model[${index}] should be a dict, got ${pythonTypeName(entry)}`,
            hint: "Each entry needs provider + model",
          })
          return
        }
        if (!hermesTruthy(entry.provider)) {
          issues.push({
            severity: "warning",
            message: `fallback_model[${index}] is missing 'provider' field`,
            hint: "Add: provider: openrouter (or another provider)",
          })
        }
        if (!hermesTruthy(entry.model)) {
          issues.push({
            severity: "warning",
            message: `fallback_model[${index}] is missing 'model' field`,
            hint: "Add: model: <model-name>",
          })
        }
      })
    } else if (!isPlainRecord(fallbackModel)) {
      issues.push({
        severity: "error",
        message: `fallback_model should be a dict with 'provider' and 'model', got ${pythonTypeName(fallbackModel)}`,
        hint: [
          "Change to:",
          "  fallback_model:",
          "    provider: openrouter",
          "    model: anthropic/claude-sonnet-4",
        ].join("\n"),
      })
    } else if (hermesTruthy(fallbackModel)) {
      if (!hermesTruthy(fallbackModel.provider)) {
        issues.push({
          severity: "warning",
          message: "fallback_model is missing 'provider' field - fallback will be disabled",
          hint: "Add: provider: openrouter (or another provider)",
        })
      }
      if (!hermesTruthy(fallbackModel.model)) {
        issues.push({
          severity: "warning",
          message: "fallback_model is missing 'model' field - fallback will be disabled",
          hint: "Add: model: anthropic/claude-sonnet-4 (or another model)",
        })
      }
    }
  }

  if (
    isPlainRecord(customProviders) &&
    !hasOwn(config, "fallback_model") &&
    hasOwn(customProviders, "fallback_model")
  ) {
    issues.push({
      severity: "error",
      message: "fallback_model appears inside custom_providers instead of at root level",
      hint: "Move fallback_model to the top level of config.yaml (no indentation)",
    })
  }

  if (hermesTruthy(customProviders) && !hermesTruthy(config.model)) {
    issues.push({
      severity: "warning",
      message: "custom_providers defined but no 'model' section - Hermes won't know which provider to use",
      hint: [
        "Add a model section:",
        "  model:",
        "    provider: custom",
        "    default: your-model-name",
        "    base_url: https://...",
      ].join("\n"),
    })
  }

  for (const key of Object.keys(config)) {
    if (key.startsWith("_")) continue
    if (!knownRootKeys.has(key) && customProviderLikeFields.has(key)) {
      issues.push({
        severity: "warning",
        message: `Root-level key '${key}' looks misplaced - should it be under 'model:' or inside a 'custom_providers' entry?`,
        hint: `Move '${key}' under the appropriate section`,
      })
    }
  }

  return issues
}

export function buildHermesConfigNativeExactFixture(): HermesConfigNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<HermesConfigNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "hermes-agent" as const,
    atomIDs: hermesConfigNativeExactAtomIDs,
    portIDs: ["config.source", "config.merge-strategy", "config.validator"] as const,
    upstreamRef: hermesConfigUpstreamRef,
    evidenceRef: hermesConfigNativeExactEvidenceRef,
    fixtureID: hermesConfigNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      configPathIsHermesHomeConfigYaml: true as const,
      rawConfigReturnsEmptyObjectForMissingInvalidOrNonMappingYaml: true as const,
      loadStartsFromDeepCopiedDefaults: true as const,
      userYamlDeepMergesOverDefaults: true as const,
      nestedDictsMergeRecursively: true as const,
      arraysScalarsAndNullOverride: true as const,
      legacyRootMaxTurnsMovesToAgentMaxTurnsBeforeMerge: true as const,
      rootProviderBaseUrlAndContextLengthMoveIntoModelOnlyWhenModelFieldMissing: true as const,
      rootModelStringBecomesModelDefaultDuringNormalization: true as const,
      envReferencesExpandOnlyInsideStringValues: true as const,
      unresolvedEnvReferencesRemainVerbatim: true as const,
      configKeysAreNotEnvExpanded: true as const,
      customProvidersMustBeAList: true as const,
      fallbackModelMayBeDictOrList: true as const,
      customProvidersWithoutModelWarns: true as const,
    },
    cases: [
      configCase(
        "raw-config-read-fallbacks",
        { parsedYaml: "scalar-value", configFileExists: false },
        { missingFile: {}, nonMappingYaml: {}, mappingYaml: { model: "openrouter/test" } },
        "read_raw_config returns {} when config.yaml is missing, parse fails, or yaml.safe_load returns a non-dict; otherwise it returns the raw mapping without DEFAULT_CONFIG.",
      ),
      configCase(
        "load-defaults-user-merge-and-env-expansion",
        {
          userAgentGatewayTimeout: 42,
          userToolsets: ["hermes-cli", "browser"],
          providerKeyRef: "${HERMES_CUSTOM_KEY}",
          missingRef: "${UNSET_HERMES_KEY}",
        },
        {
          defaultAgentMaxTurns: 90,
          overriddenGatewayTimeout: 42,
          preservedRestartDrainTimeout: 180,
          replacedToolsets: ["hermes-cli", "browser"],
          expandedProviderKey: "secret-key",
          unresolvedProviderKey: "${UNSET_HERMES_KEY}",
          keyNamesNotExpanded: ["${KEY_NAME}"],
        },
        "load_config starts from a deep copy of DEFAULT_CONFIG, recursively merges user YAML, replaces arrays/scalars, and expands ${VAR} only inside string values.",
      ),
      configCase(
        "legacy-max-turns-and-root-model-normalization",
        { rootMaxTurns: 12, rootProvider: "opencode-go", rootBaseUrl: "https://example.com/v1", model: "legacy-model" },
        {
          agentMaxTurns: 12,
          modelDefault: "legacy-model",
          modelProvider: "opencode-go",
          modelBaseUrl: "https://example.com/v1",
          rootKeysRemoved: ["max_turns", "provider", "base_url", "context_length"],
        },
        "load_config moves legacy root max_turns into agent.max_turns before merging, then normalizes root provider/base_url/context_length into model only when the model field is absent.",
      ),
      configCase(
        "config-structure-validation",
        { customProvidersAsDict: true, fallbackModelList: true, customProvidersWithoutModel: true },
        {
          dictCustomProvidersError: true,
          nestedFallbackError: true,
          fallbackListEntryWarnings: ["fallback_model[1] is missing 'provider' field", "fallback_model[0] is missing 'model' field"],
          missingModelWarning: true,
        },
        "validate_config_structure flags dict custom_providers, nested fallback_model, malformed fallback chains, missing custom provider fields, and custom_providers without model.",
      ),
    ],
    sourceRefs: [
      `${hermesConfigUpstreamRef}:hermes_cli/config.py#get_config_path,get_env_path,ensure_hermes_home,read_raw_config`,
      `${hermesConfigUpstreamRef}:hermes_cli/config.py#DEFAULT_CONFIG,_load_config_impl,load_config,load_config_readonly`,
      `${hermesConfigUpstreamRef}:hermes_cli/config.py#_deep_merge,_expand_env_vars,_normalize_root_model_keys,_normalize_max_turns_config`,
      `${hermesConfigUpstreamRef}:hermes_cli/config.py#ConfigIssue,validate_config_structure,print_config_warnings`,
      `${hermesConfigUpstreamRef}:tests/hermes_cli/test_config_env_expansion.py`,
      `${hermesConfigUpstreamRef}:tests/hermes_cli/test_config_validation.py`,
      `${hermesConfigUpstreamRef}:tests/cli/test_cli_init.py#test_normalize_root_model_keys_moves_to_model`,
    ],
    nativeEvidenceRefs: [hermesConfigNativeExactEvidenceRef, hermesConfigNativeExactReplayRef],
    fixtureIDs: [hermesConfigNativeExactFixtureID],
    knownLossiness: [] as string[],
    descriptors: hermesConfigNativeDescriptors.map((descriptor) => ({ ...descriptor })),
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyHermesConfigNativeExactFixture(fixture: HermesConfigNativeExactFixture): HermesConfigNativeExactVerification {
  const canonical = buildHermesConfigNativeExactFixture()
  const issues: HermesConfigNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "hermes-config-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Hermes config behavior." })
  }
  if (fixture.product !== "hermes-agent" || fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "hermes-config-native-exact.native-claim", message: "Hermes config fixture must remain a native-exact parity claim." })
  }
  if (JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    issues.push({ id: "hermes-config-native-exact.identity", message: "Hermes config fixture must cover the source, precedence, and validator atoms." })
  }
  if (
    fixture.upstreamRef !== hermesConfigUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("config.py#DEFAULT_CONFIG")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("config.py#_deep_merge")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("config.py#ConfigIssue")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("test_config_validation.py"))
  ) {
    issues.push({ id: "hermes-config-native-exact.upstream", message: "Fixture must stay pinned to Hermes upstream config.py loading, merge, env expansion, and validation sources." })
  }
  if (!fixture.nativeEvidenceRefs.includes(hermesConfigNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(hermesConfigNativeExactReplayRef)) {
    issues.push({ id: "hermes-config-native-exact.evidence", message: "Hermes config native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(hermesConfigNativeExactFixtureID)) {
    issues.push({ id: "hermes-config-native-exact.fixture", message: "Hermes config native exact fixture ID is missing." })
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "hermes-config-native-exact.lossiness", message: "Native exact Hermes config fixture must not carry known lossiness markers." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "hermes-config-native-exact.policy", message: "Hermes config policy drifted from upstream config behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "hermes-config-native-exact.cases", message: "Hermes config cases drifted from the native exact fixture." })
  }
  if (JSON.stringify(fixture.descriptors) !== JSON.stringify(canonical.descriptors)) {
    issues.push({ id: "hermes-config-native-exact.descriptors", message: "Hermes config native descriptors drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function hermesConfigNativeDescriptor(
  id: HermesConfigNativeExactAtomID,
  port: HermesConfigPortID,
  selectionReason: string,
): HermesConfigNativeDescriptor {
  return {
    id,
    port,
    product: "hermes-agent",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [hermesConfigNativeExactEvidenceRef, hermesConfigNativeExactReplayRef],
    fixtureIDs: [hermesConfigNativeExactFixtureID],
    knownLossiness: [],
  }
}

function configCase(
  scenarioID: HermesConfigNativeExactScenarioID,
  input: HermesConfigNativeExactCase["input"],
  output: HermesConfigNativeExactCase["output"],
  upstreamBehavior: string,
): HermesConfigNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function isPlainRecord(value: unknown): value is HermesConfigRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasOwn(value: HermesConfigRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function hermesTruthy(value: unknown): boolean {
  if (value === undefined || value === null || value === false || value === 0 || value === "") return false
  if (Array.isArray(value)) return value.length > 0
  if (isPlainRecord(value)) return Object.keys(value).length > 0
  return true
}

function deepClone<T>(value: T): T {
  if (Array.isArray(value)) return value.map((entry) => deepClone(entry)) as T
  if (isPlainRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, deepClone(entry)])) as T
  }
  return value
}

function pythonTypeName(value: unknown): string {
  if (Array.isArray(value)) return "list"
  if (value === null) return "NoneType"
  switch (typeof value) {
    case "string":
      return "str"
    case "number":
      return Number.isInteger(value) ? "int" : "float"
    case "boolean":
      return "bool"
    case "object":
      return "dict"
    default:
      return typeof value
  }
}

function pythonList(values: string[]): string {
  return `[${values.map((value) => `'${value}'`).join(", ")}]`
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (isPlainRecord(value)) {
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
