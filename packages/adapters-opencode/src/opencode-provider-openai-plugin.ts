import { createHash } from "node:crypto"

export interface OpenCodeOpenAIProviderPluginAISDKEvent {
  package: string
  options: Record<string, unknown>
  sdk?: unknown
}

export interface OpenCodeOpenAIProviderPluginLanguageEvent {
  model: {
    providerID: string
    apiID: string
  }
  sdk: {
    responses(apiID: string): unknown
  }
  language?: unknown
}

export interface OpenCodeOpenAIProviderCatalogItem {
  provider: {
    id: string
    endpoint: {
      type: string
      package: string
    }
  }
  models: Map<string, Record<string, unknown>>
}

export interface OpenCodeOpenAIProviderCatalogTransformEvent {
  data: OpenCodeOpenAIProviderCatalogItem[]
  model: {
    update(providerID: string, modelID: string, update: (model: Record<string, unknown>) => void): void
  }
}

export type OpenCodeOpenAIProviderPluginImporter = () =>
  | Promise<{ createOpenAI(options: Record<string, unknown>): unknown }>
  | { createOpenAI(options: Record<string, unknown>): unknown }

export interface OpenCodeOpenAIProviderPluginBridge {
  applySDK(input: {
    event: OpenCodeOpenAIProviderPluginAISDKEvent
    importer?: OpenCodeOpenAIProviderPluginImporter
  }): Promise<{
    event: OpenCodeOpenAIProviderPluginAISDKEvent
    skippedPackage: boolean
  }>
  applyLanguage(input: {
    event: OpenCodeOpenAIProviderPluginLanguageEvent
  }): {
    event: OpenCodeOpenAIProviderPluginLanguageEvent
    skippedProvider: boolean
  }
  transformCatalog(event: OpenCodeOpenAIProviderCatalogTransformEvent): void
}

export interface OpenCodeOpenAIProviderPluginNativeExactFixtureCase {
  id:
    | "sdk-package-gate"
    | "sdk-create-openai-options"
    | "language-provider-gate"
    | "language-responses-api-id"
    | "catalog-transform-disables-chat-only-alias"
  actual: unknown
  expected: unknown
}

export interface OpenCodeOpenAIProviderPluginNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.openai-plugin"
  portID: "provider.model-registry"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-openai-plugin-native-exact-fixture"
  replayRef: "provider-openai-plugin-native-exact:opencode"
  fixtureID: "opencode-provider-openai-plugin:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeOpenAIProviderPluginNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeOpenAIProviderPluginNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeOpenAIProviderPluginNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeOpenAIProviderPluginNativeExactFixtureIssue[]
}

export function createOpenCodeOpenAIProviderPluginBridge(): OpenCodeOpenAIProviderPluginBridge {
  return {
    applySDK: openCodeOpenAIProviderPluginApplySDK,
    applyLanguage: openCodeOpenAIProviderPluginApplyLanguage,
    transformCatalog: openCodeOpenAIProviderPluginTransformCatalog,
  }
}

export async function openCodeOpenAIProviderPluginApplySDK(input: {
  event: OpenCodeOpenAIProviderPluginAISDKEvent
  importer?: OpenCodeOpenAIProviderPluginImporter
}): Promise<{
  event: OpenCodeOpenAIProviderPluginAISDKEvent
  skippedPackage: boolean
}> {
  const event = input.event
  if (event.package !== "@ai-sdk/openai") return { event, skippedPackage: true }
  const mod = await (input.importer ?? defaultOpenAIImporter)()
  event.sdk = mod.createOpenAI(event.options)
  return { event, skippedPackage: false }
}

export function openCodeOpenAIProviderPluginApplyLanguage(input: {
  event: OpenCodeOpenAIProviderPluginLanguageEvent
}): {
  event: OpenCodeOpenAIProviderPluginLanguageEvent
  skippedProvider: boolean
} {
  const event = input.event
  if (event.model.providerID !== "openai") return { event, skippedProvider: true }
  event.language = event.sdk.responses(event.model.apiID)
  return { event, skippedProvider: false }
}

export function openCodeOpenAIProviderPluginTransformCatalog(event: OpenCodeOpenAIProviderCatalogTransformEvent): void {
  for (const item of event.data) {
    if (item.provider.endpoint.type !== "aisdk") continue
    if (item.provider.endpoint.package !== "@ai-sdk/openai") continue
    if (!item.models.has("gpt-5-chat-latest")) continue
    event.model.update(item.provider.id, "gpt-5-chat-latest", (model) => {
      model.enabled = false
    })
  }
}

export async function captureOpenCodeOpenAIProviderPluginNativeExactFixture(): Promise<OpenCodeOpenAIProviderPluginNativeExactFixture> {
  const bridge = createOpenCodeOpenAIProviderPluginBridge()

  const skippedImporterCalls: string[] = []
  const skippedEvent: OpenCodeOpenAIProviderPluginAISDKEvent = {
    package: "@ai-sdk/anthropic",
    options: { apiKey: "redacted" },
  }
  const skippedSDK = await bridge.applySDK({
    event: skippedEvent,
    importer() {
      skippedImporterCalls.push("called")
      return { createOpenAI: () => ({ unreachable: true }) }
    },
  })

  const createOpenAICalls: unknown[] = []
  const sdkEvent: OpenCodeOpenAIProviderPluginAISDKEvent = {
    package: "@ai-sdk/openai",
    options: { apiKey: "redacted", baseURL: "https://api.openai.com/v1" },
  }
  const sdkResult = await bridge.applySDK({
    event: sdkEvent,
    importer() {
      return {
        createOpenAI(options: Record<string, unknown>) {
          createOpenAICalls.push(options)
          return { kind: "openai-sdk", options }
        },
      }
    },
  })

  const skippedLanguageEvent: OpenCodeOpenAIProviderPluginLanguageEvent = {
    model: { providerID: "openai-compatible", apiID: "gpt-4.1" },
    sdk: { responses: (apiID) => ({ language: "responses", apiID }) },
  }
  const skippedLanguage = bridge.applyLanguage({ event: skippedLanguageEvent })

  const languageCalls: string[] = []
  const languageEvent: OpenCodeOpenAIProviderPluginLanguageEvent = {
    model: { providerID: "openai", apiID: "gpt-4.1" },
    sdk: {
      responses(apiID) {
        languageCalls.push(apiID)
        return { language: "responses", apiID }
      },
    },
  }
  const languageResult = bridge.applyLanguage({ event: languageEvent })

  const catalogItems: OpenCodeOpenAIProviderCatalogItem[] = [
    openCodeOpenAIProviderCatalogItem("openai", "aisdk", "@ai-sdk/openai", {
      "gpt-5-chat-latest": { enabled: true, alias: "chat-only" },
      "gpt-4.1": { enabled: true },
    }),
    openCodeOpenAIProviderCatalogItem("openai-compatible", "aisdk", "@ai-sdk/openai-compatible", {
      "gpt-5-chat-latest": { enabled: true },
    }),
    openCodeOpenAIProviderCatalogItem("openai-http", "http", "@ai-sdk/openai", {
      "gpt-5-chat-latest": { enabled: true },
    }),
    openCodeOpenAIProviderCatalogItem("openai-no-alias", "aisdk", "@ai-sdk/openai", {
      "gpt-4o": { enabled: true },
    }),
  ]
  const catalogUpdates: Array<{ providerID: string; modelID: string }> = []
  bridge.transformCatalog({
    data: catalogItems,
    model: {
      update(providerID, modelID, update) {
        catalogUpdates.push({ providerID, modelID })
        const item = catalogItems.find((entry) => entry.provider.id === providerID)
        const model = item?.models.get(modelID)
        if (model) update(model)
      },
    },
  })

  const cases: OpenCodeOpenAIProviderPluginNativeExactFixtureCase[] = [
    {
      id: "sdk-package-gate",
      actual: {
        skippedPackage: skippedSDK.skippedPackage,
        sdk: skippedSDK.event.sdk,
        importerCalls: skippedImporterCalls,
      },
      expected: {
        skippedPackage: true,
        sdk: undefined,
        importerCalls: [],
      },
    },
    {
      id: "sdk-create-openai-options",
      actual: {
        skippedPackage: sdkResult.skippedPackage,
        sdk: sdkResult.event.sdk,
        createOpenAICalls,
      },
      expected: {
        skippedPackage: false,
        sdk: { kind: "openai-sdk", options: { apiKey: "redacted", baseURL: "https://api.openai.com/v1" } },
        createOpenAICalls: [{ apiKey: "redacted", baseURL: "https://api.openai.com/v1" }],
      },
    },
    {
      id: "language-provider-gate",
      actual: {
        skippedProvider: skippedLanguage.skippedProvider,
        language: skippedLanguage.event.language,
      },
      expected: {
        skippedProvider: true,
        language: undefined,
      },
    },
    {
      id: "language-responses-api-id",
      actual: {
        skippedProvider: languageResult.skippedProvider,
        language: languageResult.event.language,
        languageCalls,
      },
      expected: {
        skippedProvider: false,
        language: { language: "responses", apiID: "gpt-4.1" },
        languageCalls: ["gpt-4.1"],
      },
    },
    {
      id: "catalog-transform-disables-chat-only-alias",
      actual: {
        updates: catalogUpdates,
        catalog: openCodeOpenAIProviderCatalogSummary(catalogItems),
      },
      expected: {
        updates: [{ providerID: "openai", modelID: "gpt-5-chat-latest" }],
        catalog: [
          {
            providerID: "openai",
            endpointType: "aisdk",
            packageName: "@ai-sdk/openai",
            models: {
              "gpt-5-chat-latest": { enabled: false, alias: "chat-only" },
              "gpt-4.1": { enabled: true },
            },
          },
          {
            providerID: "openai-compatible",
            endpointType: "aisdk",
            packageName: "@ai-sdk/openai-compatible",
            models: {
              "gpt-5-chat-latest": { enabled: true },
            },
          },
          {
            providerID: "openai-http",
            endpointType: "http",
            packageName: "@ai-sdk/openai",
            models: {
              "gpt-5-chat-latest": { enabled: true },
            },
          },
          {
            providerID: "openai-no-alias",
            endpointType: "aisdk",
            packageName: "@ai-sdk/openai",
            models: {
              "gpt-4o": { enabled: true },
            },
          },
        ],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.openai-plugin" as const,
    portID: "provider.model-registry" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-openai-plugin-native-exact-fixture" as const,
    replayRef: "provider-openai-plugin-native-exact:opencode" as const,
    fixtureID: "opencode-provider-openai-plugin:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/openai.ts#OpenAIPlugin,aisdk.sdk,aisdk.language,catalog.transform",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/index.ts#ProviderPlugins,OpenAIPlugin",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeOpenAIProviderPluginFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeOpenAIProviderPluginNativeExactFixture(
  fixture: OpenCodeOpenAIProviderPluginNativeExactFixture,
): OpenCodeOpenAIProviderPluginNativeExactFixtureVerification {
  const issues: OpenCodeOpenAIProviderPluginNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (
    fixture.atomID !== "opencode.provider.openai-plugin" ||
    fixture.portID !== "provider.model-registry" ||
    fixture.fixtureID !== "opencode-provider-openai-plugin:native-exact-fixture"
  ) {
    add("opencode-provider-openai-plugin-native-exact.identity", "OpenCode OpenAI provider plugin fixture identity drifted.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-provider-openai-plugin-native-exact.native-claim", "OpenAI provider plugin fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-provider-openai-plugin-native-exact.lossiness", "OpenAI provider plugin fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/core/src/plugin/provider/openai.ts", "packages/core/src/plugin/provider/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      add("opencode-provider-openai-plugin-native-exact.source", `Missing upstream source ${source}.`)
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeOpenAIProviderPluginSameJSON(item.actual, item.expected)) {
      add("opencode-provider-openai-plugin-native-exact.case", "Case output must match pinned OpenAIPlugin behavior.", item.id)
    }
  }
  for (const required of [
    "sdk-package-gate",
    "sdk-create-openai-options",
    "language-provider-gate",
    "language-responses-api-id",
    "catalog-transform-disables-chat-only-alias",
  ] as const) {
    if (!fixture.cases.some((item) => item.id === required)) {
      add("opencode-provider-openai-plugin-native-exact.coverage", `Missing required case ${required}.`, required)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeOpenAIProviderPluginFingerprintObject(withoutFingerprint)) {
    add("opencode-provider-openai-plugin-native-exact.fingerprint", "OpenAI provider plugin fixture fingerprint is not stable.")
  }
  return { ok: issues.length === 0, issues }
}

async function defaultOpenAIImporter(): Promise<{ createOpenAI(options: Record<string, unknown>): unknown }> {
  const packageName = "@ai-sdk/openai"
  const mod = await import(packageName)
  return mod as { createOpenAI(options: Record<string, unknown>): unknown }
}

function openCodeOpenAIProviderCatalogItem(
  providerID: string,
  endpointType: string,
  packageName: string,
  models: Record<string, Record<string, unknown>>,
): OpenCodeOpenAIProviderCatalogItem {
  return {
    provider: {
      id: providerID,
      endpoint: {
        type: endpointType,
        package: packageName,
      },
    },
    models: new Map(Object.entries(models).map(([modelID, model]) => [modelID, { ...model }])),
  }
}

function openCodeOpenAIProviderCatalogSummary(items: OpenCodeOpenAIProviderCatalogItem[]): unknown[] {
  return items.map((item) => ({
    providerID: item.provider.id,
    endpointType: item.provider.endpoint.type,
    packageName: item.provider.endpoint.package,
    models: Object.fromEntries([...item.models.entries()].map(([modelID, model]) => [modelID, { ...model }])),
  }))
}

function openCodeOpenAIProviderPluginSameJSON(left: unknown, right: unknown): boolean {
  return openCodeOpenAIProviderPluginStableJSON(left) === openCodeOpenAIProviderPluginStableJSON(right)
}

function openCodeOpenAIProviderPluginFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeOpenAIProviderPluginStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeOpenAIProviderPluginStableJSON(value: unknown): string {
  return JSON.stringify(openCodeOpenAIProviderPluginSortStable(value))
}

function openCodeOpenAIProviderPluginSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeOpenAIProviderPluginSortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeOpenAIProviderPluginSortStable(entry)]),
  )
}
