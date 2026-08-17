import { createHash } from "node:crypto"

const ANTHROPIC_BETA_HEADER = "interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14"

export interface OpenCodeAISDKProviderPluginEvent {
  package: string
  options: Record<string, unknown>
  sdk?: unknown
}

export interface OpenCodeAISDKProviderCatalogItem {
  provider: {
    id: string
    endpoint: {
      type: string
      package: string
    }
    options: {
      headers: Record<string, string>
    }
  }
}

export interface OpenCodeAISDKProviderCatalogTransformEvent {
  data: OpenCodeAISDKProviderCatalogItem[]
  provider: {
    update(providerID: string, update: (provider: OpenCodeAISDKProviderCatalogItem["provider"]) => void): void
  }
}

export interface OpenCodeAISDKProviderLanguageEvent {
  model: {
    providerID: string
    apiID: string
  }
  sdk: {
    responses(apiID: string): unknown
  }
  language?: unknown
}

export interface OpenCodeOpenRouterProviderCatalogItem extends OpenCodeAISDKProviderCatalogItem {
  models: Map<string, Record<string, unknown>>
}

export interface OpenCodeOpenRouterProviderCatalogTransformEvent {
  data: OpenCodeOpenRouterProviderCatalogItem[]
  provider: {
    update(providerID: string, update: (provider: OpenCodeOpenRouterProviderCatalogItem["provider"]) => void): void
  }
  model: {
    update(providerID: string, modelID: string, update: (model: Record<string, unknown>) => void): void
  }
}

export type OpenCodeAnthropicProviderPluginImporter = () =>
  | Promise<{ createAnthropic(options: Record<string, unknown>): unknown }>
  | { createAnthropic(options: Record<string, unknown>): unknown }

export type OpenCodeOpenAICompatibleProviderPluginImporter = () =>
  | Promise<{ createOpenAICompatible(options: Record<string, unknown>): unknown }>
  | { createOpenAICompatible(options: Record<string, unknown>): unknown }

export type OpenCodeGatewayProviderPluginImporter = () =>
  | Promise<{ createGateway(options: Record<string, unknown>): unknown }>
  | { createGateway(options: Record<string, unknown>): unknown }

export type OpenCodePerplexityProviderPluginImporter = () =>
  | Promise<{ createPerplexity(options: Record<string, unknown>): unknown }>
  | { createPerplexity(options: Record<string, unknown>): unknown }

export type OpenCodeGoogleProviderPluginImporter = () =>
  | Promise<{ createGoogleGenerativeAI(options: Record<string, unknown>): unknown }>
  | { createGoogleGenerativeAI(options: Record<string, unknown>): unknown }

export type OpenCodeXAIProviderPluginImporter = () =>
  | Promise<{ createXai(options: Record<string, unknown>): unknown }>
  | { createXai(options: Record<string, unknown>): unknown }

export type OpenCodeOpenRouterProviderPluginImporter = () =>
  | Promise<{ createOpenRouter(options: Record<string, unknown>): unknown }>
  | { createOpenRouter(options: Record<string, unknown>): unknown }

export interface OpenCodeAISDKProviderPluginsBridge {
  applyAnthropicSDK(input: {
    event: OpenCodeAISDKProviderPluginEvent
    importer?: OpenCodeAnthropicProviderPluginImporter
  }): Promise<{
    event: OpenCodeAISDKProviderPluginEvent
    skippedPackage: boolean
  }>
  transformAnthropicCatalog(event: OpenCodeAISDKProviderCatalogTransformEvent): void
  applyOpenAICompatibleSDK(input: {
    event: OpenCodeAISDKProviderPluginEvent
    importer?: OpenCodeOpenAICompatibleProviderPluginImporter
  }): Promise<{
    event: OpenCodeAISDKProviderPluginEvent
    skippedExistingSDK: boolean
    skippedPackage: boolean
  }>
  applyGatewaySDK(input: {
    event: OpenCodeAISDKProviderPluginEvent
    importer?: OpenCodeGatewayProviderPluginImporter
  }): Promise<{ event: OpenCodeAISDKProviderPluginEvent; skippedPackage: boolean }>
  applyPerplexitySDK(input: {
    event: OpenCodeAISDKProviderPluginEvent
    importer?: OpenCodePerplexityProviderPluginImporter
  }): Promise<{ event: OpenCodeAISDKProviderPluginEvent; skippedPackage: boolean }>
  applyGoogleSDK(input: {
    event: OpenCodeAISDKProviderPluginEvent
    importer?: OpenCodeGoogleProviderPluginImporter
  }): Promise<{ event: OpenCodeAISDKProviderPluginEvent; skippedPackage: boolean }>
  applyXAISDK(input: {
    event: OpenCodeAISDKProviderPluginEvent
    importer?: OpenCodeXAIProviderPluginImporter
  }): Promise<{ event: OpenCodeAISDKProviderPluginEvent; skippedPackage: boolean }>
  applyXAILanguage(input: {
    event: OpenCodeAISDKProviderLanguageEvent
  }): { event: OpenCodeAISDKProviderLanguageEvent; skippedProvider: boolean }
  applyOpenRouterSDK(input: {
    event: OpenCodeAISDKProviderPluginEvent
    importer?: OpenCodeOpenRouterProviderPluginImporter
  }): Promise<{ event: OpenCodeAISDKProviderPluginEvent; skippedPackage: boolean }>
  transformOpenRouterCatalog(event: OpenCodeOpenRouterProviderCatalogTransformEvent): void
}

export interface OpenCodeAISDKProviderPluginsNativeExactFixtureCase {
  id:
    | "anthropic-sdk-package-gate"
    | "anthropic-sdk-create-options"
    | "anthropic-catalog-beta-header"
    | "openai-compatible-existing-sdk-short-circuits"
    | "openai-compatible-package-includes-and-usage-default"
    | "openai-compatible-include-usage-false-preserved"
    | "openai-compatible-package-gate"
    | "simple-sdk-package-gates"
    | "gateway-sdk-create-options"
    | "perplexity-sdk-create-options"
    | "google-sdk-create-options"
    | "xai-sdk-create-options"
    | "xai-language-provider-gate"
    | "xai-language-responses-api-id"
    | "openrouter-sdk-create-options"
    | "openrouter-catalog-header-and-alias-disable"
  actual: unknown
  expected: unknown
}

export interface OpenCodeAISDKProviderPluginsNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.aisdk-plugins"
  portID: "provider.model-registry"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-aisdk-plugins-native-exact-fixture"
  replayRef: "provider-aisdk-plugins-native-exact:opencode"
  fixtureID: "opencode-provider-aisdk-plugins:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeAISDKProviderPluginsNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeAISDKProviderPluginsNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeAISDKProviderPluginsNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeAISDKProviderPluginsNativeExactFixtureIssue[]
}

export function createOpenCodeAISDKProviderPluginsBridge(): OpenCodeAISDKProviderPluginsBridge {
  return {
    applyAnthropicSDK: openCodeAISDKProviderPluginsApplyAnthropicSDK,
    transformAnthropicCatalog: openCodeAISDKProviderPluginsTransformAnthropicCatalog,
    applyOpenAICompatibleSDK: openCodeAISDKProviderPluginsApplyOpenAICompatibleSDK,
    applyGatewaySDK: openCodeAISDKProviderPluginsApplyGatewaySDK,
    applyPerplexitySDK: openCodeAISDKProviderPluginsApplyPerplexitySDK,
    applyGoogleSDK: openCodeAISDKProviderPluginsApplyGoogleSDK,
    applyXAISDK: openCodeAISDKProviderPluginsApplyXAISDK,
    applyXAILanguage: openCodeAISDKProviderPluginsApplyXAILanguage,
    applyOpenRouterSDK: openCodeAISDKProviderPluginsApplyOpenRouterSDK,
    transformOpenRouterCatalog: openCodeAISDKProviderPluginsTransformOpenRouterCatalog,
  }
}

export async function openCodeAISDKProviderPluginsApplyAnthropicSDK(input: {
  event: OpenCodeAISDKProviderPluginEvent
  importer?: OpenCodeAnthropicProviderPluginImporter
}): Promise<{
  event: OpenCodeAISDKProviderPluginEvent
  skippedPackage: boolean
}> {
  const event = input.event
  if (event.package !== "@ai-sdk/anthropic") return { event, skippedPackage: true }
  const mod = await (input.importer ?? defaultAnthropicImporter)()
  event.sdk = mod.createAnthropic(event.options)
  return { event, skippedPackage: false }
}

export function openCodeAISDKProviderPluginsTransformAnthropicCatalog(event: OpenCodeAISDKProviderCatalogTransformEvent): void {
  for (const item of event.data) {
    if (item.provider.endpoint.type !== "aisdk") continue
    if (item.provider.endpoint.package !== "@ai-sdk/anthropic") continue
    event.provider.update(item.provider.id, (provider) => {
      provider.options.headers["anthropic-beta"] = ANTHROPIC_BETA_HEADER
    })
  }
}

export async function openCodeAISDKProviderPluginsApplyOpenAICompatibleSDK(input: {
  event: OpenCodeAISDKProviderPluginEvent
  importer?: OpenCodeOpenAICompatibleProviderPluginImporter
}): Promise<{
  event: OpenCodeAISDKProviderPluginEvent
  skippedExistingSDK: boolean
  skippedPackage: boolean
}> {
  const event = input.event
  if (event.sdk) return { event, skippedExistingSDK: true, skippedPackage: false }
  if (!event.package.includes("@ai-sdk/openai-compatible")) return { event, skippedExistingSDK: false, skippedPackage: true }
  if (event.options.includeUsage !== false) event.options.includeUsage = true
  const mod = await (input.importer ?? defaultOpenAICompatibleImporter)()
  event.sdk = mod.createOpenAICompatible(event.options)
  return { event, skippedExistingSDK: false, skippedPackage: false }
}

export async function openCodeAISDKProviderPluginsApplyGatewaySDK(input: {
  event: OpenCodeAISDKProviderPluginEvent
  importer?: OpenCodeGatewayProviderPluginImporter
}): Promise<{ event: OpenCodeAISDKProviderPluginEvent; skippedPackage: boolean }> {
  const event = input.event
  if (event.package !== "@ai-sdk/gateway") return { event, skippedPackage: true }
  const mod = await (input.importer ?? defaultGatewayImporter)()
  event.sdk = mod.createGateway(event.options)
  return { event, skippedPackage: false }
}

export async function openCodeAISDKProviderPluginsApplyPerplexitySDK(input: {
  event: OpenCodeAISDKProviderPluginEvent
  importer?: OpenCodePerplexityProviderPluginImporter
}): Promise<{ event: OpenCodeAISDKProviderPluginEvent; skippedPackage: boolean }> {
  const event = input.event
  if (event.package !== "@ai-sdk/perplexity") return { event, skippedPackage: true }
  const mod = await (input.importer ?? defaultPerplexityImporter)()
  event.sdk = mod.createPerplexity(event.options)
  return { event, skippedPackage: false }
}

export async function openCodeAISDKProviderPluginsApplyGoogleSDK(input: {
  event: OpenCodeAISDKProviderPluginEvent
  importer?: OpenCodeGoogleProviderPluginImporter
}): Promise<{ event: OpenCodeAISDKProviderPluginEvent; skippedPackage: boolean }> {
  const event = input.event
  if (event.package !== "@ai-sdk/google") return { event, skippedPackage: true }
  const mod = await (input.importer ?? defaultGoogleImporter)()
  event.sdk = mod.createGoogleGenerativeAI(event.options)
  return { event, skippedPackage: false }
}

export async function openCodeAISDKProviderPluginsApplyXAISDK(input: {
  event: OpenCodeAISDKProviderPluginEvent
  importer?: OpenCodeXAIProviderPluginImporter
}): Promise<{ event: OpenCodeAISDKProviderPluginEvent; skippedPackage: boolean }> {
  const event = input.event
  if (event.package !== "@ai-sdk/xai") return { event, skippedPackage: true }
  const mod = await (input.importer ?? defaultXAIImporter)()
  event.sdk = mod.createXai(event.options)
  return { event, skippedPackage: false }
}

export function openCodeAISDKProviderPluginsApplyXAILanguage(input: {
  event: OpenCodeAISDKProviderLanguageEvent
}): { event: OpenCodeAISDKProviderLanguageEvent; skippedProvider: boolean } {
  const event = input.event
  if (event.model.providerID !== "xai") return { event, skippedProvider: true }
  event.language = event.sdk.responses(event.model.apiID)
  return { event, skippedProvider: false }
}

export async function openCodeAISDKProviderPluginsApplyOpenRouterSDK(input: {
  event: OpenCodeAISDKProviderPluginEvent
  importer?: OpenCodeOpenRouterProviderPluginImporter
}): Promise<{ event: OpenCodeAISDKProviderPluginEvent; skippedPackage: boolean }> {
  const event = input.event
  if (event.package !== "@openrouter/ai-sdk-provider") return { event, skippedPackage: true }
  const mod = await (input.importer ?? defaultOpenRouterImporter)()
  event.sdk = mod.createOpenRouter(event.options)
  return { event, skippedPackage: false }
}

export function openCodeAISDKProviderPluginsTransformOpenRouterCatalog(event: OpenCodeOpenRouterProviderCatalogTransformEvent): void {
  for (const item of event.data) {
    if (item.provider.endpoint.type !== "aisdk") continue
    if (item.provider.endpoint.package !== "@openrouter/ai-sdk-provider") continue
    event.provider.update(item.provider.id, (provider) => {
      provider.options.headers["HTTP-Referer"] = "https://opencode.ai/"
      provider.options.headers["X-Title"] = "opencode"
    })
    for (const modelID of ["gpt-5-chat-latest", "openai/gpt-5-chat"]) {
      if (!item.models.has(modelID)) continue
      event.model.update(item.provider.id, modelID, (model) => {
        model.enabled = false
      })
    }
  }
}

export async function captureOpenCodeAISDKProviderPluginsNativeExactFixture(): Promise<OpenCodeAISDKProviderPluginsNativeExactFixture> {
  const bridge = createOpenCodeAISDKProviderPluginsBridge()

  const anthropicSkippedCalls: string[] = []
  const anthropicSkipped = await bridge.applyAnthropicSDK({
    event: { package: "@ai-sdk/openai", options: { apiKey: "redacted" } },
    importer() {
      anthropicSkippedCalls.push("called")
      return { createAnthropic: () => ({ unreachable: true }) }
    },
  })

  const anthropicCalls: unknown[] = []
  const anthropicSDK = await bridge.applyAnthropicSDK({
    event: { package: "@ai-sdk/anthropic", options: { apiKey: "redacted", headers: { "x-test": "1" } } },
    importer() {
      return {
        createAnthropic(options: Record<string, unknown>) {
          anthropicCalls.push(options)
          return { provider: "anthropic", options }
        },
      }
    },
  })

  const anthropicCatalogItems = [
    openCodeAISDKProviderCatalogItem("anthropic", "aisdk", "@ai-sdk/anthropic", { existing: "kept" }),
    openCodeAISDKProviderCatalogItem("anthropic-http", "http", "@ai-sdk/anthropic", {}),
    openCodeAISDKProviderCatalogItem("openai-compatible", "aisdk", "@ai-sdk/openai-compatible", {}),
  ]
  const anthropicCatalogUpdates: string[] = []
  bridge.transformAnthropicCatalog({
    data: anthropicCatalogItems,
    provider: {
      update(providerID, update) {
        anthropicCatalogUpdates.push(providerID)
        const item = anthropicCatalogItems.find((entry) => entry.provider.id === providerID)
        if (item) update(item.provider)
      },
    },
  })

  const openAICompatibleExistingCalls: string[] = []
  const openAICompatibleExisting = await bridge.applyOpenAICompatibleSDK({
    event: { package: "@ai-sdk/openai-compatible", options: {}, sdk: { provider: "existing" } },
    importer() {
      openAICompatibleExistingCalls.push("called")
      return { createOpenAICompatible: () => ({ unreachable: true }) }
    },
  })

  const openAICompatibleCalls: unknown[] = []
  const openAICompatibleSDK = await bridge.applyOpenAICompatibleSDK({
    event: { package: "@ai-sdk/openai-compatible", options: { name: "custom-openai" } },
    importer() {
      return {
        createOpenAICompatible(options: Record<string, unknown>) {
          openAICompatibleCalls.push(options)
          return { provider: "openai-compatible", options }
        },
      }
    },
  })

  const openAICompatibleFalseCalls: unknown[] = []
  const openAICompatibleFalse = await bridge.applyOpenAICompatibleSDK({
    event: { package: "@scope/@ai-sdk/openai-compatible-provider", options: { includeUsage: false, name: "no-usage" } },
    importer() {
      return {
        createOpenAICompatible(options: Record<string, unknown>) {
          openAICompatibleFalseCalls.push(options)
          return { provider: "openai-compatible", options }
        },
      }
    },
  })

  const openAICompatibleSkippedCalls: string[] = []
  const openAICompatibleSkipped = await bridge.applyOpenAICompatibleSDK({
    event: { package: "@ai-sdk/anthropic", options: { includeUsage: undefined } },
    importer() {
      openAICompatibleSkippedCalls.push("called")
      return { createOpenAICompatible: () => ({ unreachable: true }) }
    },
  })

  const simpleGateCalls: string[] = []
  const simpleGateResults = {
    gateway: await bridge.applyGatewaySDK({
      event: { package: "@ai-sdk/openai", options: { provider: "gateway" } },
      importer() {
        simpleGateCalls.push("gateway")
        return { createGateway: () => ({ unreachable: true }) }
      },
    }),
    perplexity: await bridge.applyPerplexitySDK({
      event: { package: "@ai-sdk/openai", options: { provider: "perplexity" } },
      importer() {
        simpleGateCalls.push("perplexity")
        return { createPerplexity: () => ({ unreachable: true }) }
      },
    }),
    google: await bridge.applyGoogleSDK({
      event: { package: "@ai-sdk/openai", options: { provider: "google" } },
      importer() {
        simpleGateCalls.push("google")
        return { createGoogleGenerativeAI: () => ({ unreachable: true }) }
      },
    }),
    xai: await bridge.applyXAISDK({
      event: { package: "@ai-sdk/openai", options: { provider: "xai" } },
      importer() {
        simpleGateCalls.push("xai")
        return { createXai: () => ({ unreachable: true }) }
      },
    }),
    openrouter: await bridge.applyOpenRouterSDK({
      event: { package: "@ai-sdk/openai", options: { provider: "openrouter" } },
      importer() {
        simpleGateCalls.push("openrouter")
        return { createOpenRouter: () => ({ unreachable: true }) }
      },
    }),
  }

  const gatewayCalls: unknown[] = []
  const gatewaySDK = await bridge.applyGatewaySDK({
    event: { package: "@ai-sdk/gateway", options: { apiKey: "gateway-key" } },
    importer() {
      return {
        createGateway(options: Record<string, unknown>) {
          gatewayCalls.push(options)
          return { provider: "gateway", options }
        },
      }
    },
  })

  const perplexityCalls: unknown[] = []
  const perplexitySDK = await bridge.applyPerplexitySDK({
    event: { package: "@ai-sdk/perplexity", options: { apiKey: "perplexity-key" } },
    importer() {
      return {
        createPerplexity(options: Record<string, unknown>) {
          perplexityCalls.push(options)
          return { provider: "perplexity", options }
        },
      }
    },
  })

  const googleCalls: unknown[] = []
  const googleSDK = await bridge.applyGoogleSDK({
    event: { package: "@ai-sdk/google", options: { apiKey: "google-key" } },
    importer() {
      return {
        createGoogleGenerativeAI(options: Record<string, unknown>) {
          googleCalls.push(options)
          return { provider: "google", options }
        },
      }
    },
  })

  const xaiCalls: unknown[] = []
  const xaiSDK = await bridge.applyXAISDK({
    event: { package: "@ai-sdk/xai", options: { apiKey: "xai-key" } },
    importer() {
      return {
        createXai(options: Record<string, unknown>) {
          xaiCalls.push(options)
          return { provider: "xai", options }
        },
      }
    },
  })

  const xaiSkippedLanguage = bridge.applyXAILanguage({
    event: {
      model: { providerID: "openai", apiID: "grok-4" },
      sdk: { responses: (apiID) => ({ language: "responses", apiID }) },
    },
  })
  const xaiLanguageCalls: string[] = []
  const xaiLanguage = bridge.applyXAILanguage({
    event: {
      model: { providerID: "xai", apiID: "grok-4" },
      sdk: {
        responses(apiID) {
          xaiLanguageCalls.push(apiID)
          return { language: "responses", apiID }
        },
      },
    },
  })

  const openRouterCalls: unknown[] = []
  const openRouterSDK = await bridge.applyOpenRouterSDK({
    event: { package: "@openrouter/ai-sdk-provider", options: { apiKey: "openrouter-key" } },
    importer() {
      return {
        createOpenRouter(options: Record<string, unknown>) {
          openRouterCalls.push(options)
          return { provider: "openrouter", options }
        },
      }
    },
  })

  const openRouterCatalogItems = [
    openCodeOpenRouterProviderCatalogItem("openrouter", "aisdk", "@openrouter/ai-sdk-provider", { existing: "kept" }, {
      "gpt-5-chat-latest": { enabled: true },
      "openai/gpt-5-chat": { enabled: true },
      "anthropic/claude": { enabled: true },
    }),
    openCodeOpenRouterProviderCatalogItem("openrouter-http", "http", "@openrouter/ai-sdk-provider", {}, {
      "gpt-5-chat-latest": { enabled: true },
    }),
    openCodeOpenRouterProviderCatalogItem("openrouter-compatible", "aisdk", "@ai-sdk/openai-compatible", {}, {
      "openai/gpt-5-chat": { enabled: true },
    }),
  ]
  const openRouterProviderUpdates: string[] = []
  const openRouterModelUpdates: Array<{ providerID: string; modelID: string }> = []
  bridge.transformOpenRouterCatalog({
    data: openRouterCatalogItems,
    provider: {
      update(providerID, update) {
        openRouterProviderUpdates.push(providerID)
        const item = openRouterCatalogItems.find((entry) => entry.provider.id === providerID)
        if (item) update(item.provider)
      },
    },
    model: {
      update(providerID, modelID, update) {
        openRouterModelUpdates.push({ providerID, modelID })
        const item = openRouterCatalogItems.find((entry) => entry.provider.id === providerID)
        const model = item?.models.get(modelID)
        if (model) update(model)
      },
    },
  })

  const cases: OpenCodeAISDKProviderPluginsNativeExactFixtureCase[] = [
    {
      id: "anthropic-sdk-package-gate",
      actual: {
        skippedPackage: anthropicSkipped.skippedPackage,
        sdk: anthropicSkipped.event.sdk,
        importerCalls: anthropicSkippedCalls,
      },
      expected: {
        skippedPackage: true,
        sdk: undefined,
        importerCalls: [],
      },
    },
    {
      id: "anthropic-sdk-create-options",
      actual: {
        skippedPackage: anthropicSDK.skippedPackage,
        sdk: anthropicSDK.event.sdk,
        createAnthropicCalls: anthropicCalls,
      },
      expected: {
        skippedPackage: false,
        sdk: { provider: "anthropic", options: { apiKey: "redacted", headers: { "x-test": "1" } } },
        createAnthropicCalls: [{ apiKey: "redacted", headers: { "x-test": "1" } }],
      },
    },
    {
      id: "anthropic-catalog-beta-header",
      actual: {
        updates: anthropicCatalogUpdates,
        catalog: openCodeAISDKProviderCatalogSummary(anthropicCatalogItems),
      },
      expected: {
        updates: ["anthropic"],
        catalog: [
          {
            providerID: "anthropic",
            endpointType: "aisdk",
            packageName: "@ai-sdk/anthropic",
            headers: {
              existing: "kept",
              "anthropic-beta": ANTHROPIC_BETA_HEADER,
            },
          },
          {
            providerID: "anthropic-http",
            endpointType: "http",
            packageName: "@ai-sdk/anthropic",
            headers: {},
          },
          {
            providerID: "openai-compatible",
            endpointType: "aisdk",
            packageName: "@ai-sdk/openai-compatible",
            headers: {},
          },
        ],
      },
    },
    {
      id: "openai-compatible-existing-sdk-short-circuits",
      actual: {
        skippedExistingSDK: openAICompatibleExisting.skippedExistingSDK,
        skippedPackage: openAICompatibleExisting.skippedPackage,
        sdk: openAICompatibleExisting.event.sdk,
        options: openAICompatibleExisting.event.options,
        importerCalls: openAICompatibleExistingCalls,
      },
      expected: {
        skippedExistingSDK: true,
        skippedPackage: false,
        sdk: { provider: "existing" },
        options: {},
        importerCalls: [],
      },
    },
    {
      id: "openai-compatible-package-includes-and-usage-default",
      actual: {
        skippedExistingSDK: openAICompatibleSDK.skippedExistingSDK,
        skippedPackage: openAICompatibleSDK.skippedPackage,
        sdk: openAICompatibleSDK.event.sdk,
        createOpenAICompatibleCalls: openAICompatibleCalls,
      },
      expected: {
        skippedExistingSDK: false,
        skippedPackage: false,
        sdk: { provider: "openai-compatible", options: { name: "custom-openai", includeUsage: true } },
        createOpenAICompatibleCalls: [{ name: "custom-openai", includeUsage: true }],
      },
    },
    {
      id: "openai-compatible-include-usage-false-preserved",
      actual: {
        sdk: openAICompatibleFalse.event.sdk,
        createOpenAICompatibleCalls: openAICompatibleFalseCalls,
      },
      expected: {
        sdk: { provider: "openai-compatible", options: { includeUsage: false, name: "no-usage" } },
        createOpenAICompatibleCalls: [{ includeUsage: false, name: "no-usage" }],
      },
    },
    {
      id: "openai-compatible-package-gate",
      actual: {
        skippedExistingSDK: openAICompatibleSkipped.skippedExistingSDK,
        skippedPackage: openAICompatibleSkipped.skippedPackage,
        sdk: openAICompatibleSkipped.event.sdk,
        options: openAICompatibleSkipped.event.options,
        importerCalls: openAICompatibleSkippedCalls,
      },
      expected: {
        skippedExistingSDK: false,
        skippedPackage: true,
        sdk: undefined,
        options: { includeUsage: undefined },
        importerCalls: [],
      },
    },
    {
      id: "simple-sdk-package-gates",
      actual: {
        gateway: { skippedPackage: simpleGateResults.gateway.skippedPackage, sdk: simpleGateResults.gateway.event.sdk },
        perplexity: { skippedPackage: simpleGateResults.perplexity.skippedPackage, sdk: simpleGateResults.perplexity.event.sdk },
        google: { skippedPackage: simpleGateResults.google.skippedPackage, sdk: simpleGateResults.google.event.sdk },
        xai: { skippedPackage: simpleGateResults.xai.skippedPackage, sdk: simpleGateResults.xai.event.sdk },
        openrouter: { skippedPackage: simpleGateResults.openrouter.skippedPackage, sdk: simpleGateResults.openrouter.event.sdk },
        importerCalls: simpleGateCalls,
      },
      expected: {
        gateway: { skippedPackage: true, sdk: undefined },
        perplexity: { skippedPackage: true, sdk: undefined },
        google: { skippedPackage: true, sdk: undefined },
        xai: { skippedPackage: true, sdk: undefined },
        openrouter: { skippedPackage: true, sdk: undefined },
        importerCalls: [],
      },
    },
    {
      id: "gateway-sdk-create-options",
      actual: {
        skippedPackage: gatewaySDK.skippedPackage,
        sdk: gatewaySDK.event.sdk,
        createGatewayCalls: gatewayCalls,
      },
      expected: {
        skippedPackage: false,
        sdk: { provider: "gateway", options: { apiKey: "gateway-key" } },
        createGatewayCalls: [{ apiKey: "gateway-key" }],
      },
    },
    {
      id: "perplexity-sdk-create-options",
      actual: {
        skippedPackage: perplexitySDK.skippedPackage,
        sdk: perplexitySDK.event.sdk,
        createPerplexityCalls: perplexityCalls,
      },
      expected: {
        skippedPackage: false,
        sdk: { provider: "perplexity", options: { apiKey: "perplexity-key" } },
        createPerplexityCalls: [{ apiKey: "perplexity-key" }],
      },
    },
    {
      id: "google-sdk-create-options",
      actual: {
        skippedPackage: googleSDK.skippedPackage,
        sdk: googleSDK.event.sdk,
        createGoogleGenerativeAICalls: googleCalls,
      },
      expected: {
        skippedPackage: false,
        sdk: { provider: "google", options: { apiKey: "google-key" } },
        createGoogleGenerativeAICalls: [{ apiKey: "google-key" }],
      },
    },
    {
      id: "xai-sdk-create-options",
      actual: {
        skippedPackage: xaiSDK.skippedPackage,
        sdk: xaiSDK.event.sdk,
        createXaiCalls: xaiCalls,
      },
      expected: {
        skippedPackage: false,
        sdk: { provider: "xai", options: { apiKey: "xai-key" } },
        createXaiCalls: [{ apiKey: "xai-key" }],
      },
    },
    {
      id: "xai-language-provider-gate",
      actual: {
        skippedProvider: xaiSkippedLanguage.skippedProvider,
        language: xaiSkippedLanguage.event.language,
      },
      expected: {
        skippedProvider: true,
        language: undefined,
      },
    },
    {
      id: "xai-language-responses-api-id",
      actual: {
        skippedProvider: xaiLanguage.skippedProvider,
        language: xaiLanguage.event.language,
        languageCalls: xaiLanguageCalls,
      },
      expected: {
        skippedProvider: false,
        language: { language: "responses", apiID: "grok-4" },
        languageCalls: ["grok-4"],
      },
    },
    {
      id: "openrouter-sdk-create-options",
      actual: {
        skippedPackage: openRouterSDK.skippedPackage,
        sdk: openRouterSDK.event.sdk,
        createOpenRouterCalls: openRouterCalls,
      },
      expected: {
        skippedPackage: false,
        sdk: { provider: "openrouter", options: { apiKey: "openrouter-key" } },
        createOpenRouterCalls: [{ apiKey: "openrouter-key" }],
      },
    },
    {
      id: "openrouter-catalog-header-and-alias-disable",
      actual: {
        providerUpdates: openRouterProviderUpdates,
        modelUpdates: openRouterModelUpdates,
        catalog: openCodeOpenRouterProviderCatalogSummary(openRouterCatalogItems),
      },
      expected: {
        providerUpdates: ["openrouter"],
        modelUpdates: [
          { providerID: "openrouter", modelID: "gpt-5-chat-latest" },
          { providerID: "openrouter", modelID: "openai/gpt-5-chat" },
        ],
        catalog: [
          {
            providerID: "openrouter",
            endpointType: "aisdk",
            packageName: "@openrouter/ai-sdk-provider",
            headers: {
              existing: "kept",
              "HTTP-Referer": "https://opencode.ai/",
              "X-Title": "opencode",
            },
            models: {
              "gpt-5-chat-latest": { enabled: false },
              "openai/gpt-5-chat": { enabled: false },
              "anthropic/claude": { enabled: true },
            },
          },
          {
            providerID: "openrouter-http",
            endpointType: "http",
            packageName: "@openrouter/ai-sdk-provider",
            headers: {},
            models: {
              "gpt-5-chat-latest": { enabled: true },
            },
          },
          {
            providerID: "openrouter-compatible",
            endpointType: "aisdk",
            packageName: "@ai-sdk/openai-compatible",
            headers: {},
            models: {
              "openai/gpt-5-chat": { enabled: true },
            },
          },
        ],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.aisdk-plugins" as const,
    portID: "provider.model-registry" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-aisdk-plugins-native-exact-fixture" as const,
    replayRef: "provider-aisdk-plugins-native-exact:opencode" as const,
    fixtureID: "opencode-provider-aisdk-plugins:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/anthropic.ts#AnthropicPlugin,aisdk.sdk,catalog.transform",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/openai-compatible.ts#OpenAICompatiblePlugin,aisdk.sdk,includeUsage",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/gateway.ts#GatewayPlugin,aisdk.sdk",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/perplexity.ts#PerplexityPlugin,aisdk.sdk",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/google.ts#GooglePlugin,aisdk.sdk",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/xai.ts#XAIPlugin,aisdk.sdk,aisdk.language",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/openrouter.ts#OpenRouterPlugin,aisdk.sdk,catalog.transform",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/index.ts#ProviderPlugins,AnthropicPlugin,OpenAICompatiblePlugin,GatewayPlugin,PerplexityPlugin,GooglePlugin,XAIPlugin,OpenRouterPlugin",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeAISDKProviderPluginsFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeAISDKProviderPluginsNativeExactFixture(
  fixture: OpenCodeAISDKProviderPluginsNativeExactFixture,
): OpenCodeAISDKProviderPluginsNativeExactFixtureVerification {
  const issues: OpenCodeAISDKProviderPluginsNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (
    fixture.atomID !== "opencode.provider.aisdk-plugins" ||
    fixture.portID !== "provider.model-registry" ||
    fixture.fixtureID !== "opencode-provider-aisdk-plugins:native-exact-fixture"
  ) {
    add("opencode-provider-aisdk-plugins-native-exact.identity", "OpenCode AI SDK provider plugins fixture identity drifted.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-provider-aisdk-plugins-native-exact.native-claim", "AI SDK provider plugins fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-provider-aisdk-plugins-native-exact.lossiness", "AI SDK provider plugins fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/core/src/plugin/provider/anthropic.ts",
    "packages/core/src/plugin/provider/openai-compatible.ts",
    "packages/core/src/plugin/provider/gateway.ts",
    "packages/core/src/plugin/provider/perplexity.ts",
    "packages/core/src/plugin/provider/google.ts",
    "packages/core/src/plugin/provider/xai.ts",
    "packages/core/src/plugin/provider/openrouter.ts",
    "packages/core/src/plugin/provider/index.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      add("opencode-provider-aisdk-plugins-native-exact.source", `Missing upstream source ${source}.`)
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeAISDKProviderPluginsSameJSON(item.actual, item.expected)) {
      add("opencode-provider-aisdk-plugins-native-exact.case", "Case output must match pinned AI SDK provider plugin behavior.", item.id)
    }
  }
  for (const required of [
    "anthropic-sdk-package-gate",
    "anthropic-sdk-create-options",
    "anthropic-catalog-beta-header",
    "openai-compatible-existing-sdk-short-circuits",
    "openai-compatible-package-includes-and-usage-default",
    "openai-compatible-include-usage-false-preserved",
    "openai-compatible-package-gate",
    "simple-sdk-package-gates",
    "gateway-sdk-create-options",
    "perplexity-sdk-create-options",
    "google-sdk-create-options",
    "xai-sdk-create-options",
    "xai-language-provider-gate",
    "xai-language-responses-api-id",
    "openrouter-sdk-create-options",
    "openrouter-catalog-header-and-alias-disable",
  ] as const) {
    if (!fixture.cases.some((item) => item.id === required)) {
      add("opencode-provider-aisdk-plugins-native-exact.coverage", `Missing required case ${required}.`, required)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeAISDKProviderPluginsFingerprintObject(withoutFingerprint)) {
    add("opencode-provider-aisdk-plugins-native-exact.fingerprint", "AI SDK provider plugins fixture fingerprint is not stable.")
  }
  return { ok: issues.length === 0, issues }
}

async function defaultAnthropicImporter(): Promise<{ createAnthropic(options: Record<string, unknown>): unknown }> {
  const packageName = "@ai-sdk/anthropic"
  const mod = await import(packageName)
  return mod as { createAnthropic(options: Record<string, unknown>): unknown }
}

async function defaultOpenAICompatibleImporter(): Promise<{ createOpenAICompatible(options: Record<string, unknown>): unknown }> {
  const packageName = "@ai-sdk/openai-compatible"
  const mod = await import(packageName)
  return mod as { createOpenAICompatible(options: Record<string, unknown>): unknown }
}

async function defaultGatewayImporter(): Promise<{ createGateway(options: Record<string, unknown>): unknown }> {
  const packageName = "@ai-sdk/gateway"
  const mod = await import(packageName)
  return mod as { createGateway(options: Record<string, unknown>): unknown }
}

async function defaultPerplexityImporter(): Promise<{ createPerplexity(options: Record<string, unknown>): unknown }> {
  const packageName = "@ai-sdk/perplexity"
  const mod = await import(packageName)
  return mod as { createPerplexity(options: Record<string, unknown>): unknown }
}

async function defaultGoogleImporter(): Promise<{ createGoogleGenerativeAI(options: Record<string, unknown>): unknown }> {
  const packageName = "@ai-sdk/google"
  const mod = await import(packageName)
  return mod as { createGoogleGenerativeAI(options: Record<string, unknown>): unknown }
}

async function defaultXAIImporter(): Promise<{ createXai(options: Record<string, unknown>): unknown }> {
  const packageName = "@ai-sdk/xai"
  const mod = await import(packageName)
  return mod as { createXai(options: Record<string, unknown>): unknown }
}

async function defaultOpenRouterImporter(): Promise<{ createOpenRouter(options: Record<string, unknown>): unknown }> {
  const packageName = "@openrouter/ai-sdk-provider"
  const mod = await import(packageName)
  return mod as { createOpenRouter(options: Record<string, unknown>): unknown }
}

function openCodeAISDKProviderCatalogItem(
  providerID: string,
  endpointType: string,
  packageName: string,
  headers: Record<string, string>,
): OpenCodeAISDKProviderCatalogItem {
  return {
    provider: {
      id: providerID,
      endpoint: {
        type: endpointType,
        package: packageName,
      },
      options: {
        headers: { ...headers },
      },
    },
  }
}

function openCodeOpenRouterProviderCatalogItem(
  providerID: string,
  endpointType: string,
  packageName: string,
  headers: Record<string, string>,
  models: Record<string, Record<string, unknown>>,
): OpenCodeOpenRouterProviderCatalogItem {
  return {
    ...openCodeAISDKProviderCatalogItem(providerID, endpointType, packageName, headers),
    models: new Map(Object.entries(models).map(([modelID, model]) => [modelID, { ...model }])),
  }
}

function openCodeAISDKProviderCatalogSummary(items: OpenCodeAISDKProviderCatalogItem[]): unknown[] {
  return items.map((item) => ({
    providerID: item.provider.id,
    endpointType: item.provider.endpoint.type,
    packageName: item.provider.endpoint.package,
    headers: { ...item.provider.options.headers },
  }))
}

function openCodeOpenRouterProviderCatalogSummary(items: OpenCodeOpenRouterProviderCatalogItem[]): unknown[] {
  return items.map((item) => ({
    providerID: item.provider.id,
    endpointType: item.provider.endpoint.type,
    packageName: item.provider.endpoint.package,
    headers: { ...item.provider.options.headers },
    models: Object.fromEntries([...item.models.entries()].map(([modelID, model]) => [modelID, { ...model }])),
  }))
}

function openCodeAISDKProviderPluginsSameJSON(left: unknown, right: unknown): boolean {
  return openCodeAISDKProviderPluginsStableJSON(left) === openCodeAISDKProviderPluginsStableJSON(right)
}

function openCodeAISDKProviderPluginsFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeAISDKProviderPluginsStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeAISDKProviderPluginsStableJSON(value: unknown): string {
  return JSON.stringify(openCodeAISDKProviderPluginsSortStable(value))
}

function openCodeAISDKProviderPluginsSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeAISDKProviderPluginsSortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeAISDKProviderPluginsSortStable(entry)]),
  )
}
