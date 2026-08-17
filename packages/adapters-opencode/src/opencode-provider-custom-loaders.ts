import { createHash } from "node:crypto"

const ANTHROPIC_BETA_HEADER = "interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14"

export interface OpenCodeProviderCustomLoaderModelInfo {
  cost: {
    input: number
  }
}

export interface OpenCodeProviderCustomLoaderProviderInfo {
  id: string
  source?: string
  env?: string[]
  options?: Record<string, unknown>
  models?: Record<string, OpenCodeProviderCustomLoaderModelInfo>
}

export interface OpenCodeProviderCustomLoaderAuthInfo {
  type: string
  key?: string
  access?: string
  metadata?: Record<string, unknown>
}

export interface OpenCodeProviderCustomLoaderConfigInfo {
  provider?: Record<string, { options?: Record<string, unknown> }>
}

export interface OpenCodeProviderCustomLoaderDeps {
  env?: Record<string, string | undefined>
  auth?: Record<string, OpenCodeProviderCustomLoaderAuthInfo | undefined>
  config?: OpenCodeProviderCustomLoaderConfigInfo
  get?: Record<string, string | undefined>
  googleAccessToken?: string
  fetch?: (input: unknown, init?: Record<string, unknown>) => Promise<unknown> | unknown
}

export type OpenCodeProviderCustomGetModel = (
  sdk: unknown,
  modelID: string,
  options?: Record<string, unknown>,
) => Promise<unknown> | unknown

export type OpenCodeProviderCustomVarsLoader = (options: Record<string, unknown>) => Record<string, string>

export interface OpenCodeProviderCustomLoaderResult {
  providerID: string
  autoload: boolean
  options: Record<string, unknown>
  vars?: OpenCodeProviderCustomVarsLoader
  getModel?: OpenCodeProviderCustomGetModel
  models?: Record<string, OpenCodeProviderCustomLoaderModelInfo>
}

export interface OpenCodeProviderCustomLoadersBridge {
  load(input: {
    providerID: string
    provider: OpenCodeProviderCustomLoaderProviderInfo
    deps?: OpenCodeProviderCustomLoaderDeps
  }): Promise<OpenCodeProviderCustomLoaderResult | undefined>
}

export interface OpenCodeProviderCustomLoadersNativeExactFixtureCase {
  id:
    | "opencode-public-key-filters-paid-models"
    | "opencode-auth-keeps-paid-models"
    | "openai-and-xai-use-responses"
    | "github-copilot-language-selection"
    | "azure-resource-precedence-vars-and-selection"
    | "azure-missing-resource-getmodel-error"
    | "azure-cognitive-services-base-url"
    | "provider-header-options"
    | "google-vertex-project-vars-fetch-and-trim"
    | "google-vertex-anthropic-base-url-and-trim"
  actual: unknown
  expected: unknown
}

export interface OpenCodeProviderCustomLoadersNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.custom-loaders"
  portID: "provider.model-registry"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-custom-loaders-native-exact-fixture"
  replayRef: "provider-custom-loaders-native-exact:opencode"
  fixtureID: "opencode-provider-custom-loaders:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeProviderCustomLoadersNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderCustomLoadersNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderCustomLoadersNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderCustomLoadersNativeExactFixtureIssue[]
}

export function createOpenCodeProviderCustomLoadersBridge(): OpenCodeProviderCustomLoadersBridge {
  return {
    load: openCodeProviderCustomLoadersLoad,
  }
}

export async function openCodeProviderCustomLoadersLoad(input: {
  providerID: string
  provider: OpenCodeProviderCustomLoaderProviderInfo
  deps?: OpenCodeProviderCustomLoaderDeps
}): Promise<OpenCodeProviderCustomLoaderResult | undefined> {
  const deps = input.deps ?? {}
  const provider = input.provider
  const env = deps.env ?? {}
  const auth = deps.auth ?? {}
  const config = deps.config ?? {}
  switch (input.providerID) {
    case "anthropic":
      return {
        providerID: input.providerID,
        autoload: false,
        options: {
          headers: {
            "anthropic-beta": ANTHROPIC_BETA_HEADER,
          },
        },
      }
    case "opencode": {
      const models = provider.models ?? {}
      const hasKey = (provider.env ?? []).some((item) => env[item])
      const ok = hasKey || Boolean(auth[provider.id]) || Boolean(config.provider?.opencode?.options?.apiKey)
      if (!ok) {
        for (const [key, value] of Object.entries(models)) {
          if (value.cost.input === 0) continue
          delete models[key]
        }
      }
      return {
        providerID: input.providerID,
        autoload: Object.keys(models).length > 0,
        options: ok ? {} : { apiKey: "public" },
        models,
      }
    }
    case "openai":
    case "xai":
      return {
        providerID: input.providerID,
        autoload: false,
        options: {},
        async getModel(sdk, modelID) {
          return openCodeProviderCustomLoadersCallSDK(sdk, "responses", modelID)
        },
      }
    case "github-copilot":
      return {
        providerID: input.providerID,
        autoload: false,
        options: {},
        async getModel(sdk, modelID) {
          const record = openCodeProviderCustomLoadersRecord(sdk)
          if (openCodeProviderCustomLoadersUseLanguageModel(record)) return openCodeProviderCustomLoadersCallSDK(record, "languageModel", modelID)
          return openCodeProviderCustomLoadersShouldUseCopilotResponsesApi(modelID)
            ? openCodeProviderCustomLoadersCallSDK(record, "responses", modelID)
            : openCodeProviderCustomLoadersCallSDK(record, "chat", modelID)
        },
      }
    case "azure": {
      const resource = [
        provider.options?.resourceName,
        auth[provider.id]?.type === "api" ? auth[provider.id]?.metadata?.resourceName : undefined,
        env.AZURE_RESOURCE_NAME,
      ].find((name) => typeof name === "string" && name.trim() !== "")
      if (!resource && !provider.options?.baseURL) {
        return {
          providerID: input.providerID,
          autoload: false,
          options: {},
          async getModel() {
            throw new Error("AZURE_RESOURCE_NAME is missing, set it using env var or reconnecting the azure provider and setting it")
          },
        }
      }
      return {
        providerID: input.providerID,
        autoload: false,
        options: {
          resourceName: resource,
        },
        vars() {
          return resource ? { AZURE_RESOURCE_NAME: String(resource) } : {}
        },
        async getModel(sdk, modelID, options) {
          return openCodeProviderCustomLoadersSelectAzureLanguageModel(sdk, modelID, Boolean(options?.useCompletionUrls))
        },
      }
    }
    case "azure-cognitive-services": {
      const resourceName = deps.get?.AZURE_COGNITIVE_SERVICES_RESOURCE_NAME
      return {
        providerID: input.providerID,
        autoload: false,
        options: {
          baseURL: resourceName ? `https://${resourceName}.cognitiveservices.azure.com/openai` : undefined,
        },
        async getModel(sdk, modelID, options) {
          return openCodeProviderCustomLoadersSelectAzureLanguageModel(sdk, modelID, Boolean(options?.useCompletionUrls))
        },
      }
    }
    case "llmgateway":
      return {
        providerID: input.providerID,
        autoload: false,
        options: { headers: { "HTTP-Referer": "https://opencode.ai/", "X-Title": "opencode", "X-Source": "opencode" } },
      }
    case "openrouter":
    case "zenmux":
      return {
        providerID: input.providerID,
        autoload: false,
        options: { headers: { "HTTP-Referer": "https://opencode.ai/", "X-Title": "opencode" } },
      }
    case "nvidia":
      return {
        providerID: input.providerID,
        autoload: provider.source === "config",
        options: { headers: { "HTTP-Referer": "https://opencode.ai/", "X-Title": "opencode", "X-BILLING-INVOKE-ORIGIN": "OpenCode" } },
      }
    case "vercel":
      return {
        providerID: input.providerID,
        autoload: false,
        options: { headers: { "http-referer": "https://opencode.ai/", "x-title": "opencode" } },
      }
    case "google-vertex": {
      const project =
        provider.options?.project ??
        env.GOOGLE_VERTEX_PROJECT ??
        env.GOOGLE_CLOUD_PROJECT ??
        env.GCP_PROJECT ??
        env.GCLOUD_PROJECT
      const location = String(
        provider.options?.location ??
          env.GOOGLE_VERTEX_LOCATION ??
          env.GOOGLE_CLOUD_LOCATION ??
          env.VERTEX_LOCATION ??
          "us-central1",
      )
      if (!project) return { providerID: input.providerID, autoload: false, options: {} }
      return {
        providerID: input.providerID,
        autoload: true,
        vars() {
          const endpoint = location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`
          return {
            GOOGLE_VERTEX_PROJECT: String(project),
            GOOGLE_VERTEX_LOCATION: location,
            GOOGLE_VERTEX_ENDPOINT: endpoint,
          }
        },
        options: {
          project,
          location,
          fetch: async (request: unknown, init?: Record<string, unknown>) => {
            const headers = new Headers(init?.headers as ConstructorParameters<typeof Headers>[0])
            headers.set("Authorization", `Bearer ${deps.googleAccessToken ?? ""}`)
            return (deps.fetch ?? defaultFetch)(request, { ...(init ?? {}), headers })
          },
        },
        async getModel(sdk, modelID) {
          return openCodeProviderCustomLoadersCallSDK(sdk, "languageModel", String(modelID).trim())
        },
      }
    }
    case "google-vertex-anthropic": {
      const project = env.GOOGLE_CLOUD_PROJECT ?? env.GCP_PROJECT ?? env.GCLOUD_PROJECT
      const location = env.GOOGLE_CLOUD_LOCATION ?? env.VERTEX_LOCATION ?? "global"
      if (!project) return { providerID: input.providerID, autoload: false, options: {} }
      const baseURL = openCodeProviderCustomLoadersGoogleVertexAnthropicBaseURL(project, location)
      return {
        providerID: input.providerID,
        autoload: true,
        options: {
          project,
          location,
          ...(baseURL ? { baseURL } : {}),
        },
        async getModel(sdk, modelID) {
          return openCodeProviderCustomLoadersCallSDK(sdk, "languageModel", String(modelID).trim())
        },
      }
    }
  }
  return undefined
}

export function openCodeProviderCustomLoadersShouldUseCopilotResponsesApi(modelID: string): boolean {
  const match = /^gpt-(\d+)/.exec(modelID)
  if (!match) return false
  return Number(match[1]) >= 5 && !modelID.startsWith("gpt-5-mini")
}

export function openCodeProviderCustomLoadersUseLanguageModel(sdk: Record<string, unknown>): boolean {
  return sdk.responses === undefined && sdk.chat === undefined
}

export function openCodeProviderCustomLoadersSelectAzureLanguageModel(
  sdk: unknown,
  modelID: string,
  useChat: boolean,
): unknown {
  const record = openCodeProviderCustomLoadersRecord(sdk)
  if (useChat && typeof record.chat === "function") return openCodeProviderCustomLoadersCallSDK(record, "chat", modelID)
  if (typeof record.responses === "function") return openCodeProviderCustomLoadersCallSDK(record, "responses", modelID)
  if (typeof record.messages === "function") return openCodeProviderCustomLoadersCallSDK(record, "messages", modelID)
  if (typeof record.chat === "function") return openCodeProviderCustomLoadersCallSDK(record, "chat", modelID)
  return openCodeProviderCustomLoadersCallSDK(record, "languageModel", modelID)
}

export function openCodeProviderCustomLoadersGoogleVertexAnthropicBaseURL(
  project: string | undefined,
  location: string | undefined,
): string | undefined {
  if (!project) return undefined
  if (location !== "eu" && location !== "us") return undefined
  return `https://aiplatform.${location}.rep.googleapis.com/v1/projects/${project}/locations/${location}/publishers/anthropic/models`
}

export async function captureOpenCodeProviderCustomLoadersNativeExactFixture(): Promise<OpenCodeProviderCustomLoadersNativeExactFixture> {
  const bridge = createOpenCodeProviderCustomLoadersBridge()

  const publicProvider = providerInfo("opencode", {
    env: ["OPENCODE_API_KEY"],
    models: {
      free: { cost: { input: 0 } },
      paid: { cost: { input: 1 } },
    },
  })
  const publicOpenCode = await bridge.load({ providerID: "opencode", provider: publicProvider, deps: { env: {} } })

  const authProvider = providerInfo("opencode", {
    env: ["OPENCODE_API_KEY"],
    models: {
      free: { cost: { input: 0 } },
      paid: { cost: { input: 1 } },
    },
  })
  const authOpenCode = await bridge.load({
    providerID: "opencode",
    provider: authProvider,
    deps: { auth: { opencode: { type: "api", key: "sk-opencode" } } },
  })

  const responsesCalls: string[] = []
  const responsesSDK = {
    responses(modelID: string) {
      responsesCalls.push(modelID)
      return { selected: "responses", modelID }
    },
  }
  const openai = await bridge.load({ providerID: "openai", provider: providerInfo("openai") })
  const xai = await bridge.load({ providerID: "xai", provider: providerInfo("xai") })
  const openaiModel = await openai?.getModel?.(responsesSDK, "gpt-5")
  const xaiModel = await xai?.getModel?.(responsesSDK, "grok-4")

  const copilotCalls: string[] = []
  const copilotSDK = {
    responses(modelID: string) {
      copilotCalls.push(`responses:${modelID}`)
      return { selected: "responses", modelID }
    },
    chat(modelID: string) {
      copilotCalls.push(`chat:${modelID}`)
      return { selected: "chat", modelID }
    },
    languageModel(modelID: string) {
      copilotCalls.push(`languageModel:${modelID}`)
      return { selected: "languageModel", modelID }
    },
  }
  const copilotLanguageOnlySDK = {
    languageModel(modelID: string) {
      copilotCalls.push(`languageModel:${modelID}`)
      return { selected: "languageModel", modelID }
    },
  }
  const copilot = await bridge.load({ providerID: "github-copilot", provider: providerInfo("github-copilot") })
  const copilotLanguageOnly = await copilot?.getModel?.(copilotLanguageOnlySDK, "claude-haiku-4.5")
  const copilotResponses = await copilot?.getModel?.(copilotSDK, "gpt-5.1")
  const copilotMini = await copilot?.getModel?.(copilotSDK, "gpt-5-mini")
  const copilotChat = await copilot?.getModel?.(copilotSDK, "gpt-4.1")

  const azureCalls: string[] = []
  const azureSDK = {
    responses(modelID: string) {
      azureCalls.push(`responses:${modelID}`)
      return { selected: "responses", modelID }
    },
    chat(modelID: string) {
      azureCalls.push(`chat:${modelID}`)
      return { selected: "chat", modelID }
    },
    messages(modelID: string) {
      azureCalls.push(`messages:${modelID}`)
      return { selected: "messages", modelID }
    },
    languageModel(modelID: string) {
      azureCalls.push(`languageModel:${modelID}`)
      return { selected: "languageModel", modelID }
    },
  }
  const azure = await bridge.load({
    providerID: "azure",
    provider: providerInfo("azure", { options: { resourceName: "from-provider" } }),
    deps: {
      auth: { azure: { type: "api", key: "sk-azure", metadata: { resourceName: "from-auth" } } },
      env: { AZURE_RESOURCE_NAME: "from-env" },
    },
  })
  const azureChat = await azure?.getModel?.(azureSDK, "gpt-4.1", { useCompletionUrls: true })
  const azureResponses = await azure?.getModel?.(azureSDK, "gpt-4.1", {})
  const azureMissing = await bridge.load({ providerID: "azure", provider: providerInfo("azure") })
  const azureMissingError = await captureCustomLoaderError(() => azureMissing?.getModel?.(azureSDK, "gpt-4.1"))

  const azureCognitive = await bridge.load({
    providerID: "azure-cognitive-services",
    provider: providerInfo("azure-cognitive-services"),
    deps: { get: { AZURE_COGNITIVE_SERVICES_RESOURCE_NAME: "cog-westus" } },
  })

  const headerProviders = {
    anthropic: await bridge.load({ providerID: "anthropic", provider: providerInfo("anthropic") }),
    llmgateway: await bridge.load({ providerID: "llmgateway", provider: providerInfo("llmgateway") }),
    openrouter: await bridge.load({ providerID: "openrouter", provider: providerInfo("openrouter") }),
    nvidiaConfig: await bridge.load({ providerID: "nvidia", provider: providerInfo("nvidia", { source: "config" }) }),
    nvidiaEnv: await bridge.load({ providerID: "nvidia", provider: providerInfo("nvidia", { source: "env" }) }),
    vercel: await bridge.load({ providerID: "vercel", provider: providerInfo("vercel") }),
    zenmux: await bridge.load({ providerID: "zenmux", provider: providerInfo("zenmux") }),
  }

  const vertexFetchCalls: Array<{ input: unknown; authorization: string | null }> = []
  const vertex = await bridge.load({
    providerID: "google-vertex",
    provider: providerInfo("google-vertex"),
    deps: {
      env: { GOOGLE_CLOUD_PROJECT: "vertex-project", GOOGLE_CLOUD_LOCATION: "global" },
      googleAccessToken: "vertex-token",
      fetch(input, init) {
        const headers = init?.headers instanceof Headers ? init.headers : new Headers(init?.headers as ConstructorParameters<typeof Headers>[0])
        vertexFetchCalls.push({ input, authorization: headers.get("Authorization") })
        return { ok: true }
      },
    },
  })
  const vertexModelCalls: string[] = []
  const vertexModel = await vertex?.getModel?.({
    languageModel(modelID: string) {
      vertexModelCalls.push(modelID)
      return { selected: "languageModel", modelID }
    },
  }, " gemini-2.5-pro ")
  await (vertex?.options.fetch as (input: unknown, init?: Record<string, unknown>) => Promise<unknown>)?.("/v1/models", { headers: { existing: "kept" } })

  const vertexAnthropicEU = await bridge.load({
    providerID: "google-vertex-anthropic",
    provider: providerInfo("google-vertex-anthropic"),
    deps: { env: { GOOGLE_CLOUD_PROJECT: "anthropic-project", GOOGLE_CLOUD_LOCATION: "eu" } },
  })
  const vertexAnthropicGlobal = await bridge.load({
    providerID: "google-vertex-anthropic",
    provider: providerInfo("google-vertex-anthropic"),
    deps: { env: { GCP_PROJECT: "anthropic-project" } },
  })
  const vertexAnthropicMissing = await bridge.load({
    providerID: "google-vertex-anthropic",
    provider: providerInfo("google-vertex-anthropic"),
    deps: { env: {} },
  })
  const vertexAnthropicModel = await vertexAnthropicEU?.getModel?.({
    languageModel(modelID: string) {
      return { selected: "languageModel", modelID }
    },
  }, " claude-sonnet-4 ")

  const cases: OpenCodeProviderCustomLoadersNativeExactFixtureCase[] = [
    {
      id: "opencode-public-key-filters-paid-models",
      actual: {
        autoload: publicOpenCode?.autoload,
        options: publicOpenCode?.options,
        models: Object.keys(publicProvider.models ?? {}),
      },
      expected: {
        autoload: true,
        options: { apiKey: "public" },
        models: ["free"],
      },
    },
    {
      id: "opencode-auth-keeps-paid-models",
      actual: {
        autoload: authOpenCode?.autoload,
        options: authOpenCode?.options,
        models: Object.keys(authProvider.models ?? {}),
      },
      expected: {
        autoload: true,
        options: {},
        models: ["free", "paid"],
      },
    },
    {
      id: "openai-and-xai-use-responses",
      actual: {
        openai: openaiModel,
        xai: xaiModel,
        calls: responsesCalls,
        openaiOptions: openai?.options,
        xaiOptions: xai?.options,
      },
      expected: {
        openai: { selected: "responses", modelID: "gpt-5" },
        xai: { selected: "responses", modelID: "grok-4" },
        calls: ["gpt-5", "grok-4"],
        openaiOptions: {},
        xaiOptions: {},
      },
    },
    {
      id: "github-copilot-language-selection",
      actual: {
        languageOnly: copilotLanguageOnly,
        responses: copilotResponses,
        mini: copilotMini,
        chat: copilotChat,
        calls: copilotCalls,
        helper: {
          gpt5: openCodeProviderCustomLoadersShouldUseCopilotResponsesApi("gpt-5.1"),
          mini: openCodeProviderCustomLoadersShouldUseCopilotResponsesApi("gpt-5-mini"),
          claude: openCodeProviderCustomLoadersShouldUseCopilotResponsesApi("claude-haiku-4.5"),
        },
      },
      expected: {
        languageOnly: { selected: "languageModel", modelID: "claude-haiku-4.5" },
        responses: { selected: "responses", modelID: "gpt-5.1" },
        mini: { selected: "chat", modelID: "gpt-5-mini" },
        chat: { selected: "chat", modelID: "gpt-4.1" },
        calls: ["languageModel:claude-haiku-4.5", "responses:gpt-5.1", "chat:gpt-5-mini", "chat:gpt-4.1"],
        helper: { gpt5: true, mini: false, claude: false },
      },
    },
    {
      id: "azure-resource-precedence-vars-and-selection",
      actual: {
        options: summarizeCustomLoaderValue(azure?.options),
        vars: azure?.vars?.({}),
        chat: azureChat,
        responses: azureResponses,
        calls: azureCalls,
      },
      expected: {
        options: { resourceName: "from-provider" },
        vars: { AZURE_RESOURCE_NAME: "from-provider" },
        chat: { selected: "chat", modelID: "gpt-4.1" },
        responses: { selected: "responses", modelID: "gpt-4.1" },
        calls: ["chat:gpt-4.1", "responses:gpt-4.1"],
      },
    },
    {
      id: "azure-missing-resource-getmodel-error",
      actual: azureMissingError,
      expected: {
        rejected: true,
        message: "AZURE_RESOURCE_NAME is missing, set it using env var or reconnecting the azure provider and setting it",
      },
    },
    {
      id: "azure-cognitive-services-base-url",
      actual: summarizeCustomLoaderValue(azureCognitive?.options),
      expected: {
        baseURL: "https://cog-westus.cognitiveservices.azure.com/openai",
      },
    },
    {
      id: "provider-header-options",
      actual: summarizeCustomLoaderValue(headerProviders),
      expected: {
        anthropic: {
          providerID: "anthropic",
          autoload: false,
          options: { headers: { "anthropic-beta": ANTHROPIC_BETA_HEADER } },
        },
        llmgateway: {
          providerID: "llmgateway",
          autoload: false,
          options: { headers: { "HTTP-Referer": "https://opencode.ai/", "X-Title": "opencode", "X-Source": "opencode" } },
        },
        openrouter: {
          providerID: "openrouter",
          autoload: false,
          options: { headers: { "HTTP-Referer": "https://opencode.ai/", "X-Title": "opencode" } },
        },
        nvidiaConfig: {
          providerID: "nvidia",
          autoload: true,
          options: { headers: { "HTTP-Referer": "https://opencode.ai/", "X-Title": "opencode", "X-BILLING-INVOKE-ORIGIN": "OpenCode" } },
        },
        nvidiaEnv: {
          providerID: "nvidia",
          autoload: false,
          options: { headers: { "HTTP-Referer": "https://opencode.ai/", "X-Title": "opencode", "X-BILLING-INVOKE-ORIGIN": "OpenCode" } },
        },
        vercel: {
          providerID: "vercel",
          autoload: false,
          options: { headers: { "http-referer": "https://opencode.ai/", "x-title": "opencode" } },
        },
        zenmux: {
          providerID: "zenmux",
          autoload: false,
          options: { headers: { "HTTP-Referer": "https://opencode.ai/", "X-Title": "opencode" } },
        },
      },
    },
    {
      id: "google-vertex-project-vars-fetch-and-trim",
      actual: {
        autoload: vertex?.autoload,
        options: summarizeCustomLoaderValue(vertex?.options),
        vars: vertex?.vars?.({}),
        model: vertexModel,
        modelCalls: vertexModelCalls,
        fetchCalls: vertexFetchCalls,
      },
      expected: {
        autoload: true,
        options: { project: "vertex-project", location: "global", fetch: "<function>" },
        vars: {
          GOOGLE_VERTEX_PROJECT: "vertex-project",
          GOOGLE_VERTEX_LOCATION: "global",
          GOOGLE_VERTEX_ENDPOINT: "aiplatform.googleapis.com",
        },
        model: { selected: "languageModel", modelID: "gemini-2.5-pro" },
        modelCalls: ["gemini-2.5-pro"],
        fetchCalls: [{ input: "/v1/models", authorization: "Bearer vertex-token" }],
      },
    },
    {
      id: "google-vertex-anthropic-base-url-and-trim",
      actual: {
        eu: summarizeCustomLoaderValue(vertexAnthropicEU),
        global: summarizeCustomLoaderValue(vertexAnthropicGlobal),
        missing: summarizeCustomLoaderValue(vertexAnthropicMissing),
        model: vertexAnthropicModel,
        baseURL: {
          us: openCodeProviderCustomLoadersGoogleVertexAnthropicBaseURL("p", "us"),
          eu: openCodeProviderCustomLoadersGoogleVertexAnthropicBaseURL("p", "eu"),
          asia: openCodeProviderCustomLoadersGoogleVertexAnthropicBaseURL("p", "asia"),
        },
      },
      expected: {
        eu: {
          providerID: "google-vertex-anthropic",
          autoload: true,
          options: {
            project: "anthropic-project",
            location: "eu",
            baseURL: "https://aiplatform.eu.rep.googleapis.com/v1/projects/anthropic-project/locations/eu/publishers/anthropic/models",
          },
          getModel: "<function>",
        },
        global: {
          providerID: "google-vertex-anthropic",
          autoload: true,
          options: { project: "anthropic-project", location: "global" },
          getModel: "<function>",
        },
        missing: {
          providerID: "google-vertex-anthropic",
          autoload: false,
          options: {},
        },
        model: { selected: "languageModel", modelID: "claude-sonnet-4" },
        baseURL: {
          us: "https://aiplatform.us.rep.googleapis.com/v1/projects/p/locations/us/publishers/anthropic/models",
          eu: "https://aiplatform.eu.rep.googleapis.com/v1/projects/p/locations/eu/publishers/anthropic/models",
          asia: undefined,
        },
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.custom-loaders" as const,
    portID: "provider.model-registry" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-custom-loaders-native-exact-fixture" as const,
    replayRef: "provider-custom-loaders-native-exact:opencode" as const,
    fixtureID: "opencode-provider-custom-loaders:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/provider.ts#custom(dep),shouldUseCopilotResponsesApi,useLanguageModel,selectAzureLanguageModel,googleVertexAnthropicBaseURL",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/schema.ts#ProviderID,ModelID",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderCustomLoadersFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderCustomLoadersNativeExactFixture(
  fixture: OpenCodeProviderCustomLoadersNativeExactFixture,
): OpenCodeProviderCustomLoadersNativeExactFixtureVerification {
  const issues: OpenCodeProviderCustomLoadersNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (
    fixture.atomID !== "opencode.provider.custom-loaders" ||
    fixture.portID !== "provider.model-registry" ||
    fixture.fixtureID !== "opencode-provider-custom-loaders:native-exact-fixture"
  ) {
    add("opencode-provider-custom-loaders-native-exact.identity", "OpenCode provider custom loaders fixture identity drifted.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-provider-custom-loaders-native-exact.native-claim", "OpenCode provider custom loaders fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-provider-custom-loaders-native-exact.lossiness", "OpenCode provider custom loaders fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/opencode/src/provider/provider.ts", "packages/opencode/src/provider/schema.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      add("opencode-provider-custom-loaders-native-exact.source", `Missing upstream source ${source}.`)
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeProviderCustomLoadersSameJSON(item.actual, item.expected)) {
      add("opencode-provider-custom-loaders-native-exact.case", "Case output must match pinned Provider.custom(dep) behavior.", item.id)
    }
  }
  for (const required of [
    "opencode-public-key-filters-paid-models",
    "opencode-auth-keeps-paid-models",
    "openai-and-xai-use-responses",
    "github-copilot-language-selection",
    "azure-resource-precedence-vars-and-selection",
    "azure-missing-resource-getmodel-error",
    "azure-cognitive-services-base-url",
    "provider-header-options",
    "google-vertex-project-vars-fetch-and-trim",
    "google-vertex-anthropic-base-url-and-trim",
  ] as const) {
    if (!fixture.cases.some((item) => item.id === required)) {
      add("opencode-provider-custom-loaders-native-exact.coverage", `Missing required case ${required}.`, required)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderCustomLoadersFingerprintObject(withoutFingerprint)) {
    add("opencode-provider-custom-loaders-native-exact.fingerprint", "OpenCode provider custom loaders fixture fingerprint is not stable.")
  }
  return { ok: issues.length === 0, issues }
}

function providerInfo(
  id: string,
  input: Partial<OpenCodeProviderCustomLoaderProviderInfo> = {},
): OpenCodeProviderCustomLoaderProviderInfo {
  const result: OpenCodeProviderCustomLoaderProviderInfo = {
    id,
    env: input.env ?? [],
    options: input.options ?? {},
  }
  if (input.source !== undefined) result.source = input.source
  if (input.models !== undefined) result.models = input.models
  return result
}

async function defaultFetch(input: unknown, init?: Record<string, unknown>): Promise<unknown> {
  return { input, init }
}

function openCodeProviderCustomLoadersRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function openCodeProviderCustomLoadersCallSDK(sdk: unknown, method: string, modelID: string): unknown {
  const fn = openCodeProviderCustomLoadersRecord(sdk)[method]
  if (typeof fn !== "function") throw new Error(`SDK has no ${method} function`)
  return (fn as (modelID: string) => unknown)(modelID)
}

function summarizeCustomLoaderValue(value: unknown): unknown {
  if (typeof value === "function") return "<function>"
  if (value instanceof Headers) return Object.fromEntries(value.entries())
  if (Array.isArray(value)) return value.map(summarizeCustomLoaderValue)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, summarizeCustomLoaderValue(item)]),
  )
}

async function captureCustomLoaderError(run: () => Promise<unknown> | unknown): Promise<Record<string, unknown>> {
  try {
    await run()
    return { rejected: false }
  } catch (error) {
    return {
      rejected: true,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

function openCodeProviderCustomLoadersSameJSON(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function openCodeProviderCustomLoadersFingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}
