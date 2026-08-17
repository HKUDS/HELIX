import { createHash } from "node:crypto"

export type OpenCodeProviderModelPluginModelsLoader = (
  provider: OpenCodeProviderModelPluginProviderInfo,
  context: { auth?: unknown },
) => Promise<Record<string, OpenCodeProviderModelPluginModelInput>> | Record<string, OpenCodeProviderModelPluginModelInput>

export interface OpenCodeProviderModelPluginModelInput {
  [key: string]: unknown
}

export interface OpenCodeProviderModelPluginModel extends OpenCodeProviderModelPluginModelInput {
  id: string
  providerID: string
}

export interface OpenCodeProviderModelPluginProviderInfo {
  id: string
  name: string
  source: "env" | "config" | "custom" | "api"
  env: string[]
  key?: string
  options: Record<string, unknown>
  models: Record<string, OpenCodeProviderModelPluginModelInput>
  [key: string]: unknown
}

export interface OpenCodeProviderModelPluginDescriptor {
  providerID(provider: { id: string }): string
  toPublicInfo(provider: OpenCodeProviderModelPluginProviderInfo): OpenCodeProviderModelPluginProviderInfo
  shouldLoadProvider(providerID: string, disabled: Iterable<string>): boolean
  loadModels(input: {
    providerID: string
    provider: OpenCodeProviderModelPluginProviderInfo
    auth?: unknown
    models: OpenCodeProviderModelPluginModelsLoader
  }): Promise<Record<string, OpenCodeProviderModelPluginModel>>
}

export interface OpenCodeProviderModelPluginNativeExactFixtureCase {
  id: "public-info-sanitization" | "model-loader-context" | "disabled-provider-filter"
  actual: unknown
  expected: unknown
}

export interface OpenCodeProviderModelPluginNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.model-plugin"
  portID: "provider.model-registry"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-model-plugin-native-exact-fixture"
  replayRef: "provider-model-plugin-native-exact:opencode"
  fixtureID: "opencode-provider-model-plugin:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeProviderModelPluginNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderModelPluginNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderModelPluginNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderModelPluginNativeExactFixtureIssue[]
}

export function createOpenCodeProviderModelPluginDescriptor(): OpenCodeProviderModelPluginDescriptor {
  return {
    providerID: openCodeProviderModelPluginProviderID,
    toPublicInfo: openCodeProviderModelPluginToPublicInfo,
    shouldLoadProvider: openCodeProviderModelPluginShouldLoadProvider,
    loadModels: openCodeProviderModelPluginLoadModels,
  }
}

export function openCodeProviderModelPluginProviderID(provider: { id: string }): string {
  if (typeof provider.id !== "string" || provider.id.length === 0) {
    throw new TypeError("OpenCode provider model plugins require a non-empty provider id.")
  }
  return provider.id
}

export function openCodeProviderModelPluginToPublicInfo(
  provider: OpenCodeProviderModelPluginProviderInfo,
): OpenCodeProviderModelPluginProviderInfo {
  return JSON.parse(
    JSON.stringify(provider, (_key, value) => {
      if (typeof value === "function" || typeof value === "symbol" || value === undefined) return undefined
      if (typeof value === "bigint") return value.toString()
      return value
    }),
  ) as OpenCodeProviderModelPluginProviderInfo
}

export function openCodeProviderModelPluginShouldLoadProvider(providerID: string, disabled: Iterable<string>): boolean {
  return !new Set(disabled).has(providerID)
}

export async function openCodeProviderModelPluginLoadModels(input: {
  providerID: string
  provider: OpenCodeProviderModelPluginProviderInfo
  auth?: unknown
  models: OpenCodeProviderModelPluginModelsLoader
}): Promise<Record<string, OpenCodeProviderModelPluginModel>> {
  const provider = openCodeProviderModelPluginToPublicInfo(input.provider)
  const next = await input.models(provider, { auth: input.auth })
  return Object.fromEntries(
    Object.entries(next).map(([id, model]) => [
      id,
      {
        ...model,
        id,
        providerID: input.providerID,
      },
    ]),
  )
}

export async function captureOpenCodeProviderModelPluginNativeExactFixture(): Promise<OpenCodeProviderModelPluginNativeExactFixture> {
  const descriptor = createOpenCodeProviderModelPluginDescriptor()
  const provider: OpenCodeProviderModelPluginProviderInfo = {
    id: "dynamic-provider",
    name: "Dynamic Provider",
    source: "config",
    env: ["DYNAMIC_PROVIDER_KEY"],
    options: {
      baseURL: "https://provider.example.test/v1",
      requestFactory: () => "private",
      marker: Symbol("private"),
      quota: BigInt("9007199254740993"),
      omitted: undefined,
    },
    models: {
      old: {
        id: "old",
        providerID: "dynamic-provider",
        name: "Old Model",
        internalFactory: () => undefined,
      },
    },
  }
  const publicInfoActual = descriptor.toPublicInfo(provider)

  const loaderObservations: unknown[] = []
  const mappedModels = await descriptor.loadModels({
    providerID: descriptor.providerID({ id: "dynamic-provider" }),
    provider,
    auth: { type: "api", key: "redacted" },
    models: async (publicProvider, context) => {
      loaderObservations.push({ publicProvider, context })
      return {
        "dynamic-small": {
          id: "wrong-id",
          providerID: "wrong-provider",
          name: "Dynamic Small",
          release_date: "2026-01-01",
          cost: { input: 1, output: 2, cache: { read: 0.1, write: 0.2 } },
          limit: { context: 128000, output: 4096 },
          capabilities: { tool_call: true },
        },
      }
    },
  })

  const cases: OpenCodeProviderModelPluginNativeExactFixtureCase[] = [
    {
      id: "public-info-sanitization",
      actual: publicInfoActual,
      expected: {
        id: "dynamic-provider",
        name: "Dynamic Provider",
        source: "config",
        env: ["DYNAMIC_PROVIDER_KEY"],
        options: {
          baseURL: "https://provider.example.test/v1",
          quota: "9007199254740993",
        },
        models: {
          old: {
            id: "old",
            providerID: "dynamic-provider",
            name: "Old Model",
          },
        },
      },
    },
    {
      id: "model-loader-context",
      actual: {
        loaderObservations,
        mappedModels,
      },
      expected: {
        loaderObservations: [
          {
            publicProvider: {
              id: "dynamic-provider",
              name: "Dynamic Provider",
              source: "config",
              env: ["DYNAMIC_PROVIDER_KEY"],
              options: {
                baseURL: "https://provider.example.test/v1",
                quota: "9007199254740993",
              },
              models: {
                old: {
                  id: "old",
                  providerID: "dynamic-provider",
                  name: "Old Model",
                },
              },
            },
            context: { auth: { type: "api", key: "redacted" } },
          },
        ],
        mappedModels: {
          "dynamic-small": {
            id: "dynamic-small",
            providerID: "dynamic-provider",
            name: "Dynamic Small",
            release_date: "2026-01-01",
            cost: { input: 1, output: 2, cache: { read: 0.1, write: 0.2 } },
            limit: { context: 128000, output: 4096 },
            capabilities: { tool_call: true },
          },
        },
      },
    },
    {
      id: "disabled-provider-filter",
      actual: {
        allowed: descriptor.shouldLoadProvider("dynamic-provider", ["other-provider"]),
        disabled: descriptor.shouldLoadProvider("dynamic-provider", ["dynamic-provider"]),
      },
      expected: {
        allowed: true,
        disabled: false,
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.model-plugin" as const,
    portID: "provider.model-registry" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-model-plugin-native-exact-fixture" as const,
    replayRef: "provider-model-plugin-native-exact:opencode" as const,
    fixtureID: "opencode-provider-model-plugin:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/plugin/src/index.ts#ProviderHook,Hooks.provider",
      "anomalyco/opencode:packages/opencode/src/provider/provider.ts#toPublicInfo,Plugin.list,provider.models,ModelID,ProviderID",
      "anomalyco/opencode:packages/core/src/plugin/provider/index.ts#ProviderPlugins",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderModelPluginFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderModelPluginNativeExactFixture(
  fixture: OpenCodeProviderModelPluginNativeExactFixture,
): OpenCodeProviderModelPluginNativeExactFixtureVerification {
  const issues: OpenCodeProviderModelPluginNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-provider-model-plugin.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.provider.model-plugin" || fixture.portID !== "provider.model-registry") {
    add("opencode-provider-model-plugin.target", "Fixture must target opencode.provider.model-plugin and provider.model-registry.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-provider-model-plugin.native-claim", "Provider model plugin fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-provider-model-plugin.lossiness", "Native provider model plugin fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/plugin/src/index.ts",
    "packages/opencode/src/provider/provider.ts",
    "packages/core/src/plugin/provider/index.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-provider-model-plugin.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodeProviderModelPluginSameJSON(item.actual, item.expected)) {
      add("opencode-provider-model-plugin.case", "Case actual output must match expected pinned upstream provider model plugin behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderModelPluginFingerprintObject(withoutFingerprint)) {
    add("opencode-provider-model-plugin.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeProviderModelPluginSameJSON(left: unknown, right: unknown): boolean {
  return openCodeProviderModelPluginStableJSON(left) === openCodeProviderModelPluginStableJSON(right)
}

function openCodeProviderModelPluginFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeProviderModelPluginStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeProviderModelPluginStableJSON(value: unknown): string {
  return JSON.stringify(openCodeProviderModelPluginSortStable(value))
}

function openCodeProviderModelPluginSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeProviderModelPluginSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeProviderModelPluginSortStable(entry)]),
  )
}
