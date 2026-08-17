import { createHash } from "node:crypto"
import { pathToFileURL } from "node:url"

export interface OpenCodeProviderSDKResolverProvider {
  id: string
  key?: string
  options: Record<string, unknown>
}

export interface OpenCodeProviderSDKResolverModel {
  id: string
  providerID: string
  api: {
    id: string
    npm: string
    url?: string
  }
  headers?: Record<string, string>
  options?: Record<string, unknown>
}

export interface OpenCodeProviderSDKResolverState {
  providers: Record<string, OpenCodeProviderSDKResolverProvider>
  sdk: Map<string, unknown>
  models: Map<string, unknown>
  modelLoaders: Record<string, OpenCodeProviderSDKResolverModelLoader>
  varsLoaders: Record<string, OpenCodeProviderSDKResolverVarsLoader>
}

export interface OpenCodeProviderSDKResolverNpmAddResult {
  entrypoint?: string
}

export type OpenCodeProviderSDKResolverNpmAdd = (
  packageName: string,
) => Promise<OpenCodeProviderSDKResolverNpmAddResult> | OpenCodeProviderSDKResolverNpmAddResult

export type OpenCodeProviderSDKResolverImporter = (
  specifier: string,
) => Promise<Record<string, unknown>> | Record<string, unknown>

export type OpenCodeProviderSDKResolverFactory = (options: Record<string, unknown>) => unknown

export type OpenCodeProviderSDKResolverBundledLoader = () =>
  | Promise<OpenCodeProviderSDKResolverFactory>
  | OpenCodeProviderSDKResolverFactory

export type OpenCodeProviderSDKResolverModelLoader = (
  sdk: unknown,
  modelID: string,
  options?: Record<string, unknown>,
) => Promise<unknown> | unknown

export type OpenCodeProviderSDKResolverVarsLoader = (options: Record<string, unknown>) => Record<string, string>

export interface OpenCodeProviderSDKResolverDependencies {
  bundledLoaders?: Record<string, OpenCodeProviderSDKResolverBundledLoader>
  npmAdd?: OpenCodeProviderSDKResolverNpmAdd
  importer?: OpenCodeProviderSDKResolverImporter
  env?: Record<string, string | undefined>
}

export interface OpenCodeProviderSDKResolveResult {
  sdk: unknown
  cacheHit: boolean
  cacheKey: string
  packageName: string
  bundled: boolean
  installedPath?: string
  importSpecifier?: string
  factoryExport?: string
  factoryOptions: Record<string, unknown>
}

export interface OpenCodeProviderSDKLanguageResult {
  language: unknown
  cacheHit: boolean
  sdkCacheHit: boolean
  modelCacheKey: string
  sdkCacheKey: string
  loader: "custom" | "languageModel"
  loaderOptions?: Record<string, unknown>
}

export interface OpenCodeProviderSDKResolverBridge {
  resolveSDK(input: {
    state: OpenCodeProviderSDKResolverState
    model: OpenCodeProviderSDKResolverModel
    deps?: OpenCodeProviderSDKResolverDependencies
  }): Promise<OpenCodeProviderSDKResolveResult>
  getLanguage(input: {
    state: OpenCodeProviderSDKResolverState
    model: OpenCodeProviderSDKResolverModel
    deps?: OpenCodeProviderSDKResolverDependencies
  }): Promise<OpenCodeProviderSDKLanguageResult>
}

export interface OpenCodeProviderSDKResolverNativeExactFixtureCase {
  id:
    | "bundled-provider-options-cache-and-vars"
    | "openai-compatible-include-usage-default"
    | "openai-compatible-include-usage-false-preserved"
    | "non-bundled-npm-import-create-factory"
    | "file-url-import-create-factory"
    | "google-vertex-fetch-deleted-for-non-compatible"
    | "custom-model-loader-and-language-cache"
    | "default-language-model-and-language-cache"
    | "missing-entrypoint-init-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodeProviderSDKResolverNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.sdk-resolver"
  portID: "provider.model-registry"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-sdk-resolver-native-exact-fixture"
  replayRef: "provider-sdk-resolver-native-exact:opencode"
  fixtureID: "opencode-provider-sdk-resolver:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeProviderSDKResolverNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderSDKResolverNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderSDKResolverNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderSDKResolverNativeExactFixtureIssue[]
}

export class OpenCodeProviderSDKResolverInitError extends Error {
  readonly providerID: string
  readonly cause: unknown

  constructor(input: { providerID: string; cause: unknown }) {
    super(`Provider ${input.providerID} failed to initialize`)
    this.name = "InitError"
    this.providerID = input.providerID
    this.cause = input.cause
  }
}

export function createOpenCodeProviderSDKResolverBridge(): OpenCodeProviderSDKResolverBridge {
  return {
    resolveSDK: openCodeProviderSDKResolverResolveSDK,
    getLanguage: openCodeProviderSDKResolverGetLanguage,
  }
}

export function createOpenCodeProviderSDKResolverState(input: {
  providers: Record<string, OpenCodeProviderSDKResolverProvider>
  sdk?: Map<string, unknown>
  models?: Map<string, unknown>
  modelLoaders?: Record<string, OpenCodeProviderSDKResolverModelLoader>
  varsLoaders?: Record<string, OpenCodeProviderSDKResolverVarsLoader>
}): OpenCodeProviderSDKResolverState {
  return {
    providers: input.providers,
    sdk: input.sdk ?? new Map(),
    models: input.models ?? new Map(),
    modelLoaders: input.modelLoaders ?? {},
    varsLoaders: input.varsLoaders ?? {},
  }
}

export async function openCodeProviderSDKResolverResolveSDK(input: {
  state: OpenCodeProviderSDKResolverState
  model: OpenCodeProviderSDKResolverModel
  deps?: OpenCodeProviderSDKResolverDependencies
}): Promise<OpenCodeProviderSDKResolveResult> {
  const { state, model } = input
  const deps = input.deps ?? {}
  try {
    const provider = state.providers[model.providerID]
    if (!provider) throw new Error(`Provider ${model.providerID} is not configured`)
    const options: Record<string, unknown> = { ...provider.options }

    if (model.providerID === "google-vertex" && !model.api.npm.includes("@ai-sdk/openai-compatible")) {
      delete options.fetch
    }

    if (model.api.npm.includes("@ai-sdk/openai-compatible") && options.includeUsage !== false) {
      options.includeUsage = true
    }

    const baseURL = openCodeProviderSDKResolverBaseURL({
      model,
      options,
      ...(state.varsLoaders[model.providerID] ? { varsLoader: state.varsLoaders[model.providerID] } : {}),
      env: deps.env ?? {},
    })
    if (baseURL !== undefined) options.baseURL = baseURL
    if (options.apiKey === undefined && provider.key) options.apiKey = provider.key
    if (model.headers) {
      options.headers = {
        ...openCodeProviderSDKResolverRecord(options.headers),
        ...model.headers,
      }
    }

    const cacheKey = openCodeProviderSDKResolverHashFast(JSON.stringify({
      providerID: model.providerID,
      npm: model.api.npm,
      options,
    }))
    const existing = state.sdk.get(cacheKey)
    if (existing) {
      return {
        sdk: existing,
        cacheHit: true,
        cacheKey,
        packageName: model.api.npm,
        bundled: Boolean((deps.bundledLoaders ?? {})[model.api.npm]),
        factoryOptions: openCodeProviderSDKResolverSummarizeOptions(options),
      }
    }

    const customFetch = options.fetch
    const chunkTimeout = options.chunkTimeout
    delete options.chunkTimeout
    options.fetch = async (request: unknown, init?: Record<string, unknown>) => {
      const fetchFn = typeof customFetch === "function" ? customFetch as (request: unknown, init?: Record<string, unknown>) => Promise<unknown> : fetch as unknown as (request: unknown, init?: Record<string, unknown>) => Promise<unknown>
      const fetchInit = { ...(init ?? {}), timeout: false }
      const response = await fetchFn(request, fetchInit)
      return chunkTimeout ? response : response
    }

    const bundledLoader = (deps.bundledLoaders ?? {})[model.api.npm]
    if (bundledLoader) {
      const factory = await bundledLoader()
      const factoryOptions = { name: model.providerID, ...options }
      const loaded = factory(factoryOptions)
      state.sdk.set(cacheKey, loaded)
      return {
        sdk: loaded,
        cacheHit: false,
        cacheKey,
        packageName: model.api.npm,
        bundled: true,
        factoryOptions: openCodeProviderSDKResolverSummarizeOptions(factoryOptions),
      }
    }

    const installedPath = model.api.npm.startsWith("file://")
      ? model.api.npm
      : (await (deps.npmAdd ?? defaultNpmAdd)(model.api.npm)).entrypoint
    if (!installedPath) throw new Error(`Package ${model.api.npm} has no import entrypoint`)

    const importSpecifier = installedPath.startsWith("file://") ? installedPath : pathToFileURL(installedPath).href
    const mod = await (deps.importer ?? defaultImporter)(importSpecifier)
    const factoryExport = Object.keys(mod).find((key) => key.startsWith("create"))
    if (!factoryExport) throw new TypeError("fn is not a function")
    const factory = mod[factoryExport]
    const factoryOptions = { name: model.providerID, ...options }
    const loaded = (factory as OpenCodeProviderSDKResolverFactory)(factoryOptions)
    state.sdk.set(cacheKey, loaded)
    return {
      sdk: loaded,
      cacheHit: false,
      cacheKey,
      packageName: model.api.npm,
      bundled: false,
      installedPath,
      importSpecifier,
      factoryExport,
      factoryOptions: openCodeProviderSDKResolverSummarizeOptions(factoryOptions),
    }
  } catch (cause) {
    throw new OpenCodeProviderSDKResolverInitError({ providerID: input.model.providerID, cause })
  }
}

export async function openCodeProviderSDKResolverGetLanguage(input: {
  state: OpenCodeProviderSDKResolverState
  model: OpenCodeProviderSDKResolverModel
  deps?: OpenCodeProviderSDKResolverDependencies
}): Promise<OpenCodeProviderSDKLanguageResult> {
  const { state, model } = input
  const modelCacheKey = `${model.providerID}/${model.id}`
  const cachedLanguage = state.models.get(modelCacheKey)
  if (cachedLanguage) {
    return {
      language: cachedLanguage,
      cacheHit: true,
      sdkCacheHit: true,
      modelCacheKey,
      sdkCacheKey: "<cached-language>",
      loader: state.modelLoaders[model.providerID] ? "custom" : "languageModel",
    }
  }

  const resolved = await openCodeProviderSDKResolverResolveSDK(input)
  const provider = state.providers[model.providerID]
  if (!provider) throw new Error(`Provider ${model.providerID} is not configured`)
  const customLoader = state.modelLoaders[model.providerID]
  const loaderOptions = customLoader ? { ...provider.options, ...(model.options ?? {}) } : undefined
  const language = customLoader
    ? await customLoader(resolved.sdk, model.api.id, loaderOptions)
    : openCodeProviderSDKResolverLanguageModel(resolved.sdk, model.api.id)
  state.models.set(modelCacheKey, language)
  return {
    language,
    cacheHit: false,
    sdkCacheHit: resolved.cacheHit,
    modelCacheKey,
    sdkCacheKey: resolved.cacheKey,
    loader: customLoader ? "custom" : "languageModel",
    ...(loaderOptions ? { loaderOptions } : {}),
  }
}

export async function captureOpenCodeProviderSDKResolverNativeExactFixture(): Promise<OpenCodeProviderSDKResolverNativeExactFixture> {
  const bridge = createOpenCodeProviderSDKResolverBridge()

  const bundledFactoryCalls: Record<string, unknown>[] = []
  const bundledState = createOpenCodeProviderSDKResolverState({
    providers: {
      openrouter: {
        id: "openrouter",
        key: "sk-openrouter",
        options: {
          baseURL: "https://${OPENROUTER_HOST}/api",
          headers: { "X-Provider": "provider" },
          timeout: 1000,
          chunkTimeout: 250,
        },
      },
    },
    varsLoaders: {
      openrouter() {
        return { OPENROUTER_HOST: "openrouter.ai" }
      },
    },
  })
  const bundledModel = openCodeProviderSDKResolverModel({
    providerID: "openrouter",
    modelID: "openai/gpt-4o",
    apiID: "openai/gpt-4o",
    npm: "@openrouter/ai-sdk-provider",
    url: "https://${OPENROUTER_HOST}/fallback",
    headers: { "X-Model": "model" },
  })
  const bundledDeps = {
    bundledLoaders: {
      "@openrouter/ai-sdk-provider": () => (options: Record<string, unknown>) => {
        bundledFactoryCalls.push(openCodeProviderSDKResolverSummarizeOptions(options))
        return { provider: "openrouter", options: openCodeProviderSDKResolverSummarizeOptions(options) }
      },
    },
  }
  const bundledFirst = await bridge.resolveSDK({ state: bundledState, model: bundledModel, deps: bundledDeps })
  const bundledSecond = await bridge.resolveSDK({ state: bundledState, model: bundledModel, deps: bundledDeps })

  const includeUsageDefaultCalls: Record<string, unknown>[] = []
  const includeUsageDefault = await bridge.resolveSDK({
    state: createOpenCodeProviderSDKResolverState({
      providers: {
        compatible: {
          id: "compatible",
          key: "sk-compatible",
          options: {},
        },
      },
    }),
    model: openCodeProviderSDKResolverModel({
      providerID: "compatible",
      modelID: "custom-model",
      apiID: "custom-model",
      npm: "@ai-sdk/openai-compatible",
      url: "https://${COMPAT_HOST}/v1",
    }),
    deps: {
      env: { COMPAT_HOST: "compat.example" },
      bundledLoaders: {
        "@ai-sdk/openai-compatible": () => (options: Record<string, unknown>) => {
          includeUsageDefaultCalls.push(openCodeProviderSDKResolverSummarizeOptions(options))
          return { provider: "compatible", options: openCodeProviderSDKResolverSummarizeOptions(options) }
        },
      },
    },
  })

  const includeUsageFalseCalls: Record<string, unknown>[] = []
  const includeUsageFalse = await bridge.resolveSDK({
    state: createOpenCodeProviderSDKResolverState({
      providers: {
        compatible: {
          id: "compatible",
          options: { includeUsage: false },
        },
      },
    }),
    model: openCodeProviderSDKResolverModel({
      providerID: "compatible",
      modelID: "custom-model",
      apiID: "custom-model",
      npm: "@scope/@ai-sdk/openai-compatible-provider",
      url: "https://compat.example/v1",
    }),
    deps: {
      npmAdd: () => ({ entrypoint: "/repo/node_modules/@scope/@ai-sdk/openai-compatible-provider/index.js" }),
      importer: () => ({
        createCompatible(options: Record<string, unknown>) {
          includeUsageFalseCalls.push(openCodeProviderSDKResolverSummarizeOptions(options))
          return { provider: "compatible", options: openCodeProviderSDKResolverSummarizeOptions(options) }
        },
      }),
    },
  })

  const npmAddCalls: string[] = []
  const npmImportCalls: string[] = []
  const npmFactoryCalls: Record<string, unknown>[] = []
  const npmResolve = await bridge.resolveSDK({
    state: createOpenCodeProviderSDKResolverState({
      providers: {
        "custom-provider": {
          id: "custom-provider",
          key: "sk-custom",
          options: { baseURL: "", headers: { "X-Provider": "provider" } },
        },
      },
    }),
    model: openCodeProviderSDKResolverModel({
      providerID: "custom-provider",
      modelID: "custom-large",
      apiID: "custom-large",
      npm: "@example/custom-ai-sdk",
      url: "https://custom.example/v1",
      headers: { "X-Model": "model" },
    }),
    deps: {
      npmAdd(packageName) {
        npmAddCalls.push(packageName)
        return { entrypoint: "/repo/node_modules/@example/custom-ai-sdk/index.js" }
      },
      importer(specifier) {
        npmImportCalls.push(specifier)
        return {
          helper: true,
          createCustomProvider(options: Record<string, unknown>) {
            npmFactoryCalls.push(openCodeProviderSDKResolverSummarizeOptions(options))
            return { provider: "custom", options: openCodeProviderSDKResolverSummarizeOptions(options) }
          },
        }
      },
    },
  })

  const fileImportCalls: string[] = []
  const fileResolve = await bridge.resolveSDK({
    state: createOpenCodeProviderSDKResolverState({
      providers: {
        fileprovider: {
          id: "fileprovider",
          options: { apiKey: "file-key" },
        },
      },
    }),
    model: openCodeProviderSDKResolverModel({
      providerID: "fileprovider",
      modelID: "file-model",
      apiID: "file-model",
      npm: "file:///repo/provider-file.mjs",
    }),
    deps: {
      importer(specifier) {
        fileImportCalls.push(specifier)
        return {
          createFileProvider(options: Record<string, unknown>) {
            return { provider: "fileprovider", options: openCodeProviderSDKResolverSummarizeOptions(options) }
          },
        }
      },
    },
  })

  const googleVertexFactoryCalls: Record<string, unknown>[] = []
  const googleVertex = await bridge.resolveSDK({
    state: createOpenCodeProviderSDKResolverState({
      providers: {
        "google-vertex": {
          id: "google-vertex",
          options: { fetch: "custom-fetch-sentinel", project: "vertex-project" },
        },
      },
    }),
    model: openCodeProviderSDKResolverModel({
      providerID: "google-vertex",
      modelID: "gemini-2.5-pro",
      apiID: "gemini-2.5-pro",
      npm: "@ai-sdk/google-vertex",
    }),
    deps: {
      bundledLoaders: {
        "@ai-sdk/google-vertex": () => (options: Record<string, unknown>) => {
          googleVertexFactoryCalls.push(openCodeProviderSDKResolverSummarizeOptions(options))
          return { provider: "google-vertex", options: openCodeProviderSDKResolverSummarizeOptions(options) }
        },
      },
    },
  })

  const loaderCalls: Array<{ modelID: string; options: Record<string, unknown> | undefined }> = []
  const customLanguageState = createOpenCodeProviderSDKResolverState({
    providers: {
      xai: {
        id: "xai",
        options: { temperature: 0.2 },
      },
    },
    modelLoaders: {
      xai(_sdk, modelID, options) {
        loaderCalls.push({ modelID, options })
        return { selected: "custom-loader", modelID, options }
      },
    },
  })
  const xaiModel = openCodeProviderSDKResolverModel({
    providerID: "xai",
    modelID: "grok-4",
    apiID: "grok-4",
    npm: "@ai-sdk/xai",
    options: { reasoningEffort: "high" },
  })
  const customLanguageDeps = {
    bundledLoaders: {
      "@ai-sdk/xai": () => () => ({ provider: "xai-sdk" }),
    },
  }
  const customLanguageFirst = await bridge.getLanguage({ state: customLanguageState, model: xaiModel, deps: customLanguageDeps })
  const customLanguageSecond = await bridge.getLanguage({ state: customLanguageState, model: xaiModel, deps: customLanguageDeps })

  const languageModelCalls: string[] = []
  const defaultLanguageState = createOpenCodeProviderSDKResolverState({
    providers: {
      plain: {
        id: "plain",
        options: {},
      },
    },
  })
  const plainModel = openCodeProviderSDKResolverModel({
    providerID: "plain",
    modelID: "plain-large",
    apiID: "plain-api",
    npm: "@example/plain-provider",
  })
  const defaultLanguageFirst = await bridge.getLanguage({
    state: defaultLanguageState,
    model: plainModel,
    deps: {
      npmAdd: () => ({ entrypoint: "/repo/node_modules/@example/plain-provider/index.js" }),
      importer: () => ({
        createPlainProvider() {
          return {
            languageModel(modelID: string) {
              languageModelCalls.push(modelID)
              return { selected: "languageModel", modelID }
            },
          }
        },
      }),
    },
  })
  const defaultLanguageSecond = await bridge.getLanguage({ state: defaultLanguageState, model: plainModel })

  const missingEntrypoint = await openCodeProviderSDKResolverCaptureError(() =>
    bridge.resolveSDK({
      state: createOpenCodeProviderSDKResolverState({
        providers: {
          missing: {
            id: "missing",
            options: {},
          },
        },
      }),
      model: openCodeProviderSDKResolverModel({
        providerID: "missing",
        modelID: "missing-model",
        apiID: "missing-model",
        npm: "@example/missing-provider",
      }),
      deps: {
        npmAdd: () => ({}),
      },
    }),
  )

  const cases: OpenCodeProviderSDKResolverNativeExactFixtureCase[] = [
    {
      id: "bundled-provider-options-cache-and-vars",
      actual: {
        first: {
          bundled: bundledFirst.bundled,
          cacheHit: bundledFirst.cacheHit,
          factoryOptions: bundledFirst.factoryOptions,
        },
        second: {
          cacheHit: bundledSecond.cacheHit,
          sameSDK: bundledFirst.sdk === bundledSecond.sdk,
        },
        factoryCalls: bundledFactoryCalls,
        sdkCacheSize: bundledState.sdk.size,
      },
      expected: {
        first: {
          bundled: true,
          cacheHit: false,
          factoryOptions: {
            name: "openrouter",
            baseURL: "https://openrouter.ai/api",
            headers: { "X-Provider": "provider", "X-Model": "model" },
            timeout: 1000,
            apiKey: "sk-openrouter",
            fetch: "<function>",
          },
        },
        second: {
          cacheHit: true,
          sameSDK: true,
        },
        factoryCalls: [
          {
            name: "openrouter",
            baseURL: "https://openrouter.ai/api",
            headers: { "X-Provider": "provider", "X-Model": "model" },
            timeout: 1000,
            apiKey: "sk-openrouter",
            fetch: "<function>",
          },
        ],
        sdkCacheSize: 1,
      },
    },
    {
      id: "openai-compatible-include-usage-default",
      actual: {
        bundled: includeUsageDefault.bundled,
        factoryOptions: includeUsageDefault.factoryOptions,
        factoryCalls: includeUsageDefaultCalls,
      },
      expected: {
        bundled: true,
        factoryOptions: {
          name: "compatible",
          includeUsage: true,
          baseURL: "https://compat.example/v1",
          apiKey: "sk-compatible",
          fetch: "<function>",
        },
        factoryCalls: [
          {
            name: "compatible",
            includeUsage: true,
            baseURL: "https://compat.example/v1",
            apiKey: "sk-compatible",
            fetch: "<function>",
          },
        ],
      },
    },
    {
      id: "openai-compatible-include-usage-false-preserved",
      actual: {
        importSpecifier: includeUsageFalse.importSpecifier,
        factoryExport: includeUsageFalse.factoryExport,
        factoryOptions: includeUsageFalse.factoryOptions,
        factoryCalls: includeUsageFalseCalls,
      },
      expected: {
        importSpecifier: pathToFileURL("/repo/node_modules/@scope/@ai-sdk/openai-compatible-provider/index.js").href,
        factoryExport: "createCompatible",
        factoryOptions: {
          name: "compatible",
          includeUsage: false,
          baseURL: "https://compat.example/v1",
          fetch: "<function>",
        },
        factoryCalls: [
          {
            name: "compatible",
            includeUsage: false,
            baseURL: "https://compat.example/v1",
            fetch: "<function>",
          },
        ],
      },
    },
    {
      id: "non-bundled-npm-import-create-factory",
      actual: {
        npmAddCalls,
        npmImportCalls,
        installedPath: npmResolve.installedPath,
        importSpecifier: npmResolve.importSpecifier,
        factoryExport: npmResolve.factoryExport,
        factoryOptions: npmResolve.factoryOptions,
        factoryCalls: npmFactoryCalls,
      },
      expected: {
        npmAddCalls: ["@example/custom-ai-sdk"],
        npmImportCalls: [pathToFileURL("/repo/node_modules/@example/custom-ai-sdk/index.js").href],
        installedPath: "/repo/node_modules/@example/custom-ai-sdk/index.js",
        importSpecifier: pathToFileURL("/repo/node_modules/@example/custom-ai-sdk/index.js").href,
        factoryExport: "createCustomProvider",
        factoryOptions: {
          name: "custom-provider",
          baseURL: "https://custom.example/v1",
          headers: { "X-Provider": "provider", "X-Model": "model" },
          apiKey: "sk-custom",
          fetch: "<function>",
        },
        factoryCalls: [
          {
            name: "custom-provider",
            baseURL: "https://custom.example/v1",
            headers: { "X-Provider": "provider", "X-Model": "model" },
            apiKey: "sk-custom",
            fetch: "<function>",
          },
        ],
      },
    },
    {
      id: "file-url-import-create-factory",
      actual: {
        installedPath: fileResolve.installedPath,
        importSpecifier: fileResolve.importSpecifier,
        factoryExport: fileResolve.factoryExport,
        fileImportCalls,
        factoryOptions: fileResolve.factoryOptions,
      },
      expected: {
        installedPath: "file:///repo/provider-file.mjs",
        importSpecifier: "file:///repo/provider-file.mjs",
        factoryExport: "createFileProvider",
        fileImportCalls: ["file:///repo/provider-file.mjs"],
        factoryOptions: {
          name: "fileprovider",
          apiKey: "file-key",
          fetch: "<function>",
        },
      },
    },
    {
      id: "google-vertex-fetch-deleted-for-non-compatible",
      actual: {
        factoryOptions: googleVertex.factoryOptions,
        factoryCalls: googleVertexFactoryCalls,
      },
      expected: {
        factoryOptions: {
          name: "google-vertex",
          project: "vertex-project",
          fetch: "<function>",
        },
        factoryCalls: [
          {
            name: "google-vertex",
            project: "vertex-project",
            fetch: "<function>",
          },
        ],
      },
    },
    {
      id: "custom-model-loader-and-language-cache",
      actual: {
        first: {
          cacheHit: customLanguageFirst.cacheHit,
          sdkCacheHit: customLanguageFirst.sdkCacheHit,
          loader: customLanguageFirst.loader,
          language: customLanguageFirst.language,
          loaderOptions: customLanguageFirst.loaderOptions,
        },
        second: {
          cacheHit: customLanguageSecond.cacheHit,
          loader: customLanguageSecond.loader,
          language: customLanguageSecond.language,
        },
        loaderCalls,
        modelCacheSize: customLanguageState.models.size,
        sdkCacheSize: customLanguageState.sdk.size,
      },
      expected: {
        first: {
          cacheHit: false,
          sdkCacheHit: false,
          loader: "custom",
          language: {
            selected: "custom-loader",
            modelID: "grok-4",
            options: { temperature: 0.2, reasoningEffort: "high" },
          },
          loaderOptions: { temperature: 0.2, reasoningEffort: "high" },
        },
        second: {
          cacheHit: true,
          loader: "custom",
          language: {
            selected: "custom-loader",
            modelID: "grok-4",
            options: { temperature: 0.2, reasoningEffort: "high" },
          },
        },
        loaderCalls: [{ modelID: "grok-4", options: { temperature: 0.2, reasoningEffort: "high" } }],
        modelCacheSize: 1,
        sdkCacheSize: 1,
      },
    },
    {
      id: "default-language-model-and-language-cache",
      actual: {
        first: {
          cacheHit: defaultLanguageFirst.cacheHit,
          sdkCacheHit: defaultLanguageFirst.sdkCacheHit,
          loader: defaultLanguageFirst.loader,
          language: defaultLanguageFirst.language,
        },
        second: {
          cacheHit: defaultLanguageSecond.cacheHit,
          loader: defaultLanguageSecond.loader,
          language: defaultLanguageSecond.language,
        },
        languageModelCalls,
        modelCacheSize: defaultLanguageState.models.size,
        sdkCacheSize: defaultLanguageState.sdk.size,
      },
      expected: {
        first: {
          cacheHit: false,
          sdkCacheHit: false,
          loader: "languageModel",
          language: { selected: "languageModel", modelID: "plain-api" },
        },
        second: {
          cacheHit: true,
          loader: "languageModel",
          language: { selected: "languageModel", modelID: "plain-api" },
        },
        languageModelCalls: ["plain-api"],
        modelCacheSize: 1,
        sdkCacheSize: 1,
      },
    },
    {
      id: "missing-entrypoint-init-error",
      actual: missingEntrypoint,
      expected: {
        rejected: true,
        errorName: "InitError",
        providerID: "missing",
        causeMessage: "Package @example/missing-provider has no import entrypoint",
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.sdk-resolver" as const,
    portID: "provider.model-registry" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-sdk-resolver-native-exact-fixture" as const,
    replayRef: "provider-sdk-resolver-native-exact:opencode" as const,
    fixtureID: "opencode-provider-sdk-resolver:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/provider.ts#resolveSDK,getLanguage,BUNDLED_PROVIDERS,includeUsage,varsLoaders,modelLoaders,pathToFileURL",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/util/hash.ts#Hash.fast,sha1",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/schema.ts#ProviderID,ModelID",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderSDKResolverFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderSDKResolverNativeExactFixture(
  fixture: OpenCodeProviderSDKResolverNativeExactFixture,
): OpenCodeProviderSDKResolverNativeExactFixtureVerification {
  const issues: OpenCodeProviderSDKResolverNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (
    fixture.atomID !== "opencode.provider.sdk-resolver" ||
    fixture.portID !== "provider.model-registry" ||
    fixture.fixtureID !== "opencode-provider-sdk-resolver:native-exact-fixture"
  ) {
    add("opencode-provider-sdk-resolver-native-exact.identity", "OpenCode provider SDK resolver fixture identity drifted.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-provider-sdk-resolver-native-exact.native-claim", "OpenCode provider SDK resolver fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-provider-sdk-resolver-native-exact.lossiness", "OpenCode provider SDK resolver fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/opencode/src/provider/provider.ts",
    "packages/core/src/util/hash.ts",
    "packages/opencode/src/provider/schema.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      add("opencode-provider-sdk-resolver-native-exact.source", `Missing upstream source ${source}.`)
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeProviderSDKResolverSameJSON(item.actual, item.expected)) {
      add("opencode-provider-sdk-resolver-native-exact.case", "Case output must match pinned Provider.resolveSDK/getLanguage behavior.", item.id)
    }
  }
  for (const required of [
    "bundled-provider-options-cache-and-vars",
    "openai-compatible-include-usage-default",
    "openai-compatible-include-usage-false-preserved",
    "non-bundled-npm-import-create-factory",
    "file-url-import-create-factory",
    "google-vertex-fetch-deleted-for-non-compatible",
    "custom-model-loader-and-language-cache",
    "default-language-model-and-language-cache",
    "missing-entrypoint-init-error",
  ] as const) {
    if (!fixture.cases.some((item) => item.id === required)) {
      add("opencode-provider-sdk-resolver-native-exact.coverage", `Missing required case ${required}.`, required)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderSDKResolverFingerprintObject(withoutFingerprint)) {
    add("opencode-provider-sdk-resolver-native-exact.fingerprint", "OpenCode provider SDK resolver fixture fingerprint is not stable.")
  }
  return { ok: issues.length === 0, issues }
}

export function openCodeProviderSDKResolverHashFast(input: string | Buffer): string {
  return createHash("sha1").update(input).digest("hex")
}

function openCodeProviderSDKResolverBaseURL(input: {
  model: OpenCodeProviderSDKResolverModel
  options: Record<string, unknown>
  varsLoader?: OpenCodeProviderSDKResolverVarsLoader
  env: Record<string, string | undefined>
}): string | undefined {
  let url = typeof input.options.baseURL === "string" && input.options.baseURL !== "" ? input.options.baseURL : input.model.api.url
  if (!url) return undefined
  if (input.varsLoader) {
    const vars = input.varsLoader(input.options)
    for (const [key, value] of Object.entries(vars)) {
      url = url.replaceAll("${" + key + "}", value)
    }
  }
  return url.replace(/\$\{([^}]+)\}/g, (item, key) => input.env[String(key)] ?? item)
}

function openCodeProviderSDKResolverLanguageModel(sdk: unknown, modelID: string): unknown {
  const languageModel = openCodeProviderSDKResolverRecord(sdk).languageModel
  if (typeof languageModel !== "function") throw new Error("SDK has no languageModel function")
  return (languageModel as (modelID: string) => unknown)(modelID)
}

function openCodeProviderSDKResolverModel(input: {
  providerID: string
  modelID: string
  apiID: string
  npm: string
  url?: string
  headers?: Record<string, string>
  options?: Record<string, unknown>
}): OpenCodeProviderSDKResolverModel {
  return {
    id: input.modelID,
    providerID: input.providerID,
    api: {
      id: input.apiID,
      npm: input.npm,
      ...(input.url ? { url: input.url } : {}),
    },
    ...(input.headers ? { headers: input.headers } : {}),
    ...(input.options ? { options: input.options } : {}),
  }
}

function openCodeProviderSDKResolverRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function openCodeProviderSDKResolverSummarizeOptions(options: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(options)) {
    if (typeof value === "function") {
      result[key] = "<function>"
      continue
    }
    result[key] = value
  }
  return result
}

async function openCodeProviderSDKResolverCaptureError(run: () => Promise<unknown>): Promise<Record<string, unknown>> {
  try {
    await run()
    return { rejected: false }
  } catch (error) {
    const cause = error instanceof OpenCodeProviderSDKResolverInitError ? error.cause : undefined
    return {
      rejected: true,
      errorName: error instanceof Error ? error.name : typeof error,
      providerID: error instanceof OpenCodeProviderSDKResolverInitError ? error.providerID : undefined,
      causeMessage: cause instanceof Error ? cause.message : cause ? String(cause) : undefined,
    }
  }
}

async function defaultNpmAdd(): Promise<OpenCodeProviderSDKResolverNpmAddResult> {
  return {}
}

async function defaultImporter(specifier: string): Promise<Record<string, unknown>> {
  return import(specifier) as Promise<Record<string, unknown>>
}

function openCodeProviderSDKResolverSameJSON(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function openCodeProviderSDKResolverFingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}
