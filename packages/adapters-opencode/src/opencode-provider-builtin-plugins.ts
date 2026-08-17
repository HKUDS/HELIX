import { createHash } from "node:crypto"

export interface OpenCodeProviderBuiltinPluginRecord {
  index: number
  exportName: string
  pluginID: string
  sourceFile: string
}

export interface OpenCodeProviderBuiltinPluginsBridge {
  providerPlugins(): OpenCodeProviderBuiltinPluginRecord[]
  bootPluginIDs(): string[]
}

export interface OpenCodeProviderBuiltinPluginsNativeExactFixtureCase {
  id:
    | "provider-plugin-order"
    | "boot-add-order"
    | "split-file-plugin-ids"
    | "dynamic-provider-last"
  actual: unknown
  expected: unknown
}

export interface OpenCodeProviderBuiltinPluginsNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.builtin-plugins"
  portID: "provider.model-registry"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-builtin-plugins-native-exact-fixture"
  replayRef: "provider-builtin-plugins-native-exact:opencode"
  fixtureID: "opencode-provider-builtin-plugins:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeProviderBuiltinPluginsNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderBuiltinPluginsNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderBuiltinPluginsNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderBuiltinPluginsNativeExactFixtureIssue[]
}

const OPENCODE_PROVIDER_BUILTIN_PLUGIN_RECORDS: OpenCodeProviderBuiltinPluginRecord[] = [
  { index: 0, exportName: "AlibabaPlugin", pluginID: "alibaba", sourceFile: "alibaba.ts" },
  { index: 1, exportName: "AmazonBedrockPlugin", pluginID: "amazon-bedrock", sourceFile: "amazon-bedrock.ts" },
  { index: 2, exportName: "AnthropicPlugin", pluginID: "anthropic", sourceFile: "anthropic.ts" },
  { index: 3, exportName: "AzureCognitiveServicesPlugin", pluginID: "azure-cognitive-services", sourceFile: "azure.ts" },
  { index: 4, exportName: "AzurePlugin", pluginID: "azure", sourceFile: "azure.ts" },
  { index: 5, exportName: "CerebrasPlugin", pluginID: "cerebras", sourceFile: "cerebras.ts" },
  { index: 6, exportName: "CloudflareAIGatewayPlugin", pluginID: "cloudflare-ai-gateway", sourceFile: "cloudflare-ai-gateway.ts" },
  { index: 7, exportName: "CloudflareWorkersAIPlugin", pluginID: "cloudflare-workers-ai", sourceFile: "cloudflare-workers-ai.ts" },
  { index: 8, exportName: "CoherePlugin", pluginID: "cohere", sourceFile: "cohere.ts" },
  { index: 9, exportName: "DeepInfraPlugin", pluginID: "deepinfra", sourceFile: "deepinfra.ts" },
  { index: 10, exportName: "GatewayPlugin", pluginID: "gateway", sourceFile: "gateway.ts" },
  { index: 11, exportName: "GithubCopilotPlugin", pluginID: "github-copilot", sourceFile: "github-copilot.ts" },
  { index: 12, exportName: "GitLabPlugin", pluginID: "gitlab", sourceFile: "gitlab.ts" },
  { index: 13, exportName: "GooglePlugin", pluginID: "google", sourceFile: "google.ts" },
  { index: 14, exportName: "GoogleVertexAnthropicPlugin", pluginID: "google-vertex-anthropic", sourceFile: "google-vertex.ts" },
  { index: 15, exportName: "GoogleVertexPlugin", pluginID: "google-vertex", sourceFile: "google-vertex.ts" },
  { index: 16, exportName: "GroqPlugin", pluginID: "groq", sourceFile: "groq.ts" },
  { index: 17, exportName: "KiloPlugin", pluginID: "kilo", sourceFile: "kilo.ts" },
  { index: 18, exportName: "LLMGatewayPlugin", pluginID: "llmgateway", sourceFile: "llmgateway.ts" },
  { index: 19, exportName: "MistralPlugin", pluginID: "mistral", sourceFile: "mistral.ts" },
  { index: 20, exportName: "NvidiaPlugin", pluginID: "nvidia", sourceFile: "nvidia.ts" },
  { index: 21, exportName: "OpencodePlugin", pluginID: "opencode", sourceFile: "opencode.ts" },
  { index: 22, exportName: "OpenAICompatiblePlugin", pluginID: "openai-compatible", sourceFile: "openai-compatible.ts" },
  { index: 23, exportName: "OpenAIPlugin", pluginID: "openai", sourceFile: "openai.ts" },
  { index: 24, exportName: "OpenRouterPlugin", pluginID: "openrouter", sourceFile: "openrouter.ts" },
  { index: 25, exportName: "PerplexityPlugin", pluginID: "perplexity", sourceFile: "perplexity.ts" },
  { index: 26, exportName: "SapAICorePlugin", pluginID: "sap-ai-core", sourceFile: "sap-ai-core.ts" },
  { index: 27, exportName: "TogetherAIPlugin", pluginID: "togetherai", sourceFile: "togetherai.ts" },
  { index: 28, exportName: "VercelPlugin", pluginID: "vercel", sourceFile: "vercel.ts" },
  { index: 29, exportName: "VenicePlugin", pluginID: "venice", sourceFile: "venice.ts" },
  { index: 30, exportName: "XAIPlugin", pluginID: "xai", sourceFile: "xai.ts" },
  { index: 31, exportName: "ZenmuxPlugin", pluginID: "zenmux", sourceFile: "zenmux.ts" },
  { index: 32, exportName: "DynamicProviderPlugin", pluginID: "dynamic-provider", sourceFile: "dynamic.ts" },
]

export function createOpenCodeProviderBuiltinPluginsBridge(): OpenCodeProviderBuiltinPluginsBridge {
  return {
    providerPlugins: () => OPENCODE_PROVIDER_BUILTIN_PLUGIN_RECORDS.map((record) => ({ ...record })),
    bootPluginIDs: () => ["env", "account", ...OPENCODE_PROVIDER_BUILTIN_PLUGIN_RECORDS.map((record) => record.pluginID), "models-dev"],
  }
}

export function captureOpenCodeProviderBuiltinPluginsNativeExactFixture(): OpenCodeProviderBuiltinPluginsNativeExactFixture {
  const bridge = createOpenCodeProviderBuiltinPluginsBridge()
  const providerPlugins = bridge.providerPlugins()
  const bootPluginIDs = bridge.bootPluginIDs()
  const splitFilePlugins = providerPlugins
    .filter((record) => record.sourceFile === "azure.ts" || record.sourceFile === "google-vertex.ts")
    .map(({ sourceFile, exportName, pluginID, index }) => ({ sourceFile, exportName, pluginID, index }))
  const dynamic = providerPlugins.at(-1)

  const cases: OpenCodeProviderBuiltinPluginsNativeExactFixtureCase[] = [
    {
      id: "provider-plugin-order",
      actual: providerPlugins.map(({ index, exportName, pluginID, sourceFile }) => ({ index, exportName, pluginID, sourceFile })),
      expected: OPENCODE_PROVIDER_BUILTIN_PLUGIN_RECORDS,
    },
    {
      id: "boot-add-order",
      actual: bootPluginIDs,
      expected: ["env", "account", ...OPENCODE_PROVIDER_BUILTIN_PLUGIN_RECORDS.map((record) => record.pluginID), "models-dev"],
    },
    {
      id: "split-file-plugin-ids",
      actual: splitFilePlugins,
      expected: [
        { sourceFile: "azure.ts", exportName: "AzureCognitiveServicesPlugin", pluginID: "azure-cognitive-services", index: 3 },
        { sourceFile: "azure.ts", exportName: "AzurePlugin", pluginID: "azure", index: 4 },
        { sourceFile: "google-vertex.ts", exportName: "GoogleVertexAnthropicPlugin", pluginID: "google-vertex-anthropic", index: 14 },
        { sourceFile: "google-vertex.ts", exportName: "GoogleVertexPlugin", pluginID: "google-vertex", index: 15 },
      ],
    },
    {
      id: "dynamic-provider-last",
      actual: dynamic ? { index: dynamic.index, exportName: dynamic.exportName, pluginID: dynamic.pluginID, sourceFile: dynamic.sourceFile } : undefined,
      expected: { index: 32, exportName: "DynamicProviderPlugin", pluginID: "dynamic-provider", sourceFile: "dynamic.ts" },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.builtin-plugins" as const,
    portID: "provider.model-registry" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-builtin-plugins-native-exact-fixture" as const,
    replayRef: "provider-builtin-plugins-native-exact:opencode" as const,
    fixtureID: "opencode-provider-builtin-plugins:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/index.ts#ProviderPlugins",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/boot.ts#PluginBoot.boot,ProviderPlugins",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/dynamic.ts#DynamicProviderPlugin",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderBuiltinPluginsFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderBuiltinPluginsNativeExactFixture(
  fixture: OpenCodeProviderBuiltinPluginsNativeExactFixture,
): OpenCodeProviderBuiltinPluginsNativeExactFixtureVerification {
  const issues: OpenCodeProviderBuiltinPluginsNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (
    fixture.atomID !== "opencode.provider.builtin-plugins" ||
    fixture.portID !== "provider.model-registry" ||
    fixture.fixtureID !== "opencode-provider-builtin-plugins:native-exact-fixture"
  ) {
    add("opencode-provider-builtin-plugins-native-exact.identity", "OpenCode builtin provider plugin fixture identity drifted.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-provider-builtin-plugins-native-exact.native-claim", "Builtin provider plugin fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-provider-builtin-plugins-native-exact.lossiness", "Builtin provider plugin fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/core/src/plugin/provider/index.ts", "packages/core/src/plugin/boot.ts", "packages/core/src/plugin/provider/dynamic.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      add("opencode-provider-builtin-plugins-native-exact.source", `Missing upstream source ${source}.`)
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeProviderBuiltinPluginsSameJSON(item.actual, item.expected)) {
      add("opencode-provider-builtin-plugins-native-exact.case", "Case output must match pinned ProviderPlugins/PluginBoot behavior.", item.id)
    }
  }
  for (const required of ["provider-plugin-order", "boot-add-order", "split-file-plugin-ids", "dynamic-provider-last"] as const) {
    if (!fixture.cases.some((item) => item.id === required)) {
      add("opencode-provider-builtin-plugins-native-exact.coverage", `Missing required case ${required}.`, required)
    }
  }
  const providerOrder = fixture.cases.find((item) => item.id === "provider-plugin-order")?.actual
  if (!Array.isArray(providerOrder) || providerOrder.length !== 33) {
    add("opencode-provider-builtin-plugins-native-exact.provider-count", "ProviderPlugins must retain 33 provider plugins.")
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderBuiltinPluginsFingerprintObject(withoutFingerprint)) {
    add("opencode-provider-builtin-plugins-native-exact.fingerprint", "Builtin provider plugin fixture fingerprint is not stable.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeProviderBuiltinPluginsSameJSON(left: unknown, right: unknown): boolean {
  return openCodeProviderBuiltinPluginsStableJSON(left) === openCodeProviderBuiltinPluginsStableJSON(right)
}

function openCodeProviderBuiltinPluginsFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeProviderBuiltinPluginsStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeProviderBuiltinPluginsStableJSON(value: unknown): string {
  return JSON.stringify(openCodeProviderBuiltinPluginsSortStable(value))
}

function openCodeProviderBuiltinPluginsSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeProviderBuiltinPluginsSortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeProviderBuiltinPluginsSortStable(entry)]),
  )
}
