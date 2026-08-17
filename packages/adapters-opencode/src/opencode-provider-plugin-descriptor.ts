import { createHash } from "node:crypto"

export type OpenCodeProviderPluginModelsLoader = (
  provider: unknown,
  context: { auth?: unknown },
) => Promise<Record<string, unknown>> | Record<string, unknown>

export interface OpenCodeProviderPluginDescriptorInfo {
  id?: string
  models?: OpenCodeProviderPluginModelsLoader
  [key: string]: unknown
}

export interface OpenCodeProviderPluginHost {
  services: Map<string, unknown>
  registerProvider(input: { name: string; config: unknown }, source?: any): () => void
}

export interface OpenCodeProviderPluginScope {
  source: { id: string }
  addCleanup(cleanup: () => void): void
}

export interface OpenCodeProviderPluginDescriptor {
  providerID(provider: OpenCodeProviderPluginDescriptorInfo): string
  registryName(sourceID: string): string
  serviceKey(sourceID: string): string
  selectProviderHooks(hooks: Array<{ provider?: OpenCodeProviderPluginDescriptorInfo }>): OpenCodeProviderPluginDescriptorInfo[]
  registerPluginProvider(input: {
    host: OpenCodeProviderPluginHost
    scope: OpenCodeProviderPluginScope
    provider?: OpenCodeProviderPluginDescriptorInfo
  }): void
}

export interface OpenCodeProviderPluginNativeExactFixtureCase {
  id: "provider-hook-schema" | "provider-scope-identity" | "plugin-provider-registration"
  actual: unknown
  expected: unknown
}

export interface OpenCodeProviderPluginNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.plugin-descriptor"
  portID: "provider.stream"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-plugin-descriptor-native-exact-fixture"
  replayRef: "provider-plugin-descriptor-native-exact:opencode"
  fixtureID: "opencode-provider-plugin-descriptor:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeProviderPluginNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderPluginNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderPluginNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderPluginNativeExactFixtureIssue[]
}

export function createOpenCodeProviderPluginDescriptor(): OpenCodeProviderPluginDescriptor {
  return {
    providerID: openCodeProviderPluginProviderID,
    registryName: openCodeProviderPluginRegistryName,
    serviceKey: openCodeProviderPluginServiceKey,
    selectProviderHooks: openCodeProviderPluginSelectProviderHooks,
    registerPluginProvider: openCodeProviderPluginRegisterProvider,
  }
}

export function openCodeProviderPluginProviderID(provider: OpenCodeProviderPluginDescriptorInfo): string {
  if (typeof provider.id !== "string" || provider.id.length === 0) {
    throw new TypeError("OpenCode provider plugin descriptors require a non-empty id.")
  }
  return provider.id
}

export function openCodeProviderPluginRegistryName(sourceID: string): string {
  return sourceID
}

export function openCodeProviderPluginServiceKey(sourceID: string): string {
  return `opencode.provider:${sourceID}`
}

export function openCodeProviderPluginSelectProviderHooks(
  hooks: Array<{ provider?: OpenCodeProviderPluginDescriptorInfo }>,
): OpenCodeProviderPluginDescriptorInfo[] {
  return hooks.flatMap((hook) => (hook.provider ? [hook.provider] : []))
}

export function openCodeProviderPluginRegisterProvider(input: {
  host: OpenCodeProviderPluginHost
  scope: OpenCodeProviderPluginScope
  provider?: OpenCodeProviderPluginDescriptorInfo
}): void {
  if (!input.provider) return
  const key = openCodeProviderPluginServiceKey(input.scope.source.id)
  input.host.services.set(key, input.provider)
  input.scope.addCleanup(() => {
    input.host.services.delete(key)
  })
  input.scope.addCleanup(
    input.host.registerProvider(
      { name: openCodeProviderPluginRegistryName(input.scope.source.id), config: input.provider },
      input.scope.source,
    ),
  )
}

export function captureOpenCodeProviderPluginNativeExactFixture(): OpenCodeProviderPluginNativeExactFixture {
  const descriptor = createOpenCodeProviderPluginDescriptor()
  const dynamicProvider: OpenCodeProviderPluginDescriptorInfo = {
    id: "dynamic-provider",
    models: async () => ({
      "dynamic-model": { id: "dynamic-model", name: "Dynamic Model" },
    }),
  }
  const schemaActual = descriptor.selectProviderHooks([
    { provider: { id: "openai-compatible" } },
    {},
    { provider: dynamicProvider },
  ]).map((provider) => ({
    id: descriptor.providerID(provider),
    hasModelsLoader: typeof provider.models === "function",
  }))

  const provider = {
    id: "custom-provider",
    label: "Custom Provider",
    packageName: "@example/provider",
    auth: { source: "sample-plugin", env: ["CUSTOM_PROVIDER_KEY"] },
    protocol: "openai-compatible",
    baseURL: "https://provider.example.test/v1",
  } satisfies OpenCodeProviderPluginDescriptorInfo
  const scopeActual = {
    providerID: descriptor.providerID(provider),
    registryName: descriptor.registryName("sample-plugin"),
    serviceKey: descriptor.serviceKey("sample-plugin"),
  }

  const cleanup: Array<() => void> = []
  const registerCalls: unknown[] = []
  const host: OpenCodeProviderPluginHost = {
    services: new Map<string, unknown>(),
    registerProvider(input, source) {
      registerCalls.push({ input, source })
      return () => registerCalls.push({ cleanup: input.name })
    },
  }
  const scope: OpenCodeProviderPluginScope = {
    source: { id: "sample-plugin" },
    addCleanup(item) {
      cleanup.push(item)
    },
  }
  descriptor.registerPluginProvider({ host, scope, provider })
  const beforeCleanup = {
    services: Array.from(host.services.entries()),
    registerCalls: [...registerCalls],
    cleanupCount: cleanup.length,
  }
  for (const item of cleanup) item()
  const registrationActual = {
    beforeCleanup,
    afterCleanup: {
      services: Array.from(host.services.entries()),
      registerCalls,
    },
  }

  const cases: OpenCodeProviderPluginNativeExactFixtureCase[] = [
    {
      id: "provider-hook-schema",
      actual: schemaActual,
      expected: [
        { id: "openai-compatible", hasModelsLoader: false },
        { id: "dynamic-provider", hasModelsLoader: true },
      ],
    },
    {
      id: "provider-scope-identity",
      actual: scopeActual,
      expected: {
        providerID: "custom-provider",
        registryName: "sample-plugin",
        serviceKey: "opencode.provider:sample-plugin",
      },
    },
    {
      id: "plugin-provider-registration",
      actual: registrationActual,
      expected: {
        beforeCleanup: {
          services: [
            [
              "opencode.provider:sample-plugin",
              {
                id: "custom-provider",
                label: "Custom Provider",
                packageName: "@example/provider",
                auth: { source: "sample-plugin", env: ["CUSTOM_PROVIDER_KEY"] },
                protocol: "openai-compatible",
                baseURL: "https://provider.example.test/v1",
              },
            ],
          ],
          registerCalls: [
            {
              input: {
                name: "sample-plugin",
                config: {
                  id: "custom-provider",
                  label: "Custom Provider",
                  packageName: "@example/provider",
                  auth: { source: "sample-plugin", env: ["CUSTOM_PROVIDER_KEY"] },
                  protocol: "openai-compatible",
                  baseURL: "https://provider.example.test/v1",
                },
              },
              source: { id: "sample-plugin" },
            },
          ],
          cleanupCount: 2,
        },
        afterCleanup: {
          services: [],
          registerCalls: [
            {
              input: {
                name: "sample-plugin",
                config: {
                  id: "custom-provider",
                  label: "Custom Provider",
                  packageName: "@example/provider",
                  auth: { source: "sample-plugin", env: ["CUSTOM_PROVIDER_KEY"] },
                  protocol: "openai-compatible",
                  baseURL: "https://provider.example.test/v1",
                },
              },
              source: { id: "sample-plugin" },
            },
            { cleanup: "sample-plugin" },
          ],
        },
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.plugin-descriptor" as const,
    portID: "provider.stream" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-plugin-descriptor-native-exact-fixture" as const,
    replayRef: "provider-plugin-descriptor-native-exact:opencode" as const,
    fixtureID: "opencode-provider-plugin-descriptor:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/plugin/src/index.ts#ProviderHook,Hooks.provider",
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#applyPlugin,Plugin.list",
      "anomalyco/opencode:packages/opencode/src/provider/provider.ts#Plugin.list,provider.models",
      "anomalyco/opencode:packages/core/src/plugin/provider/index.ts#ProviderPlugins",
      "helix:packages/adapters-opencode/src/plugin-atoms.ts#createOpenCodePluginRegistryBridge",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderPluginFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderPluginNativeExactFixture(
  fixture: OpenCodeProviderPluginNativeExactFixture,
): OpenCodeProviderPluginNativeExactFixtureVerification {
  const issues: OpenCodeProviderPluginNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-provider-plugin.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.provider.plugin-descriptor" || fixture.portID !== "provider.stream") {
    add("opencode-provider-plugin.target", "Fixture must target opencode.provider.plugin-descriptor and provider.stream.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-provider-plugin.native-claim", "Provider plugin descriptor fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-provider-plugin.lossiness", "Native provider plugin descriptor fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/plugin/src/index.ts",
    "packages/opencode/src/plugin/index.ts",
    "packages/opencode/src/provider/provider.ts",
    "packages/core/src/plugin/provider/index.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-provider-plugin.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodeProviderPluginSameJSON(item.actual, item.expected)) {
      add("opencode-provider-plugin.case", "Case actual output must match expected pinned upstream provider plugin descriptor behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderPluginFingerprintObject(withoutFingerprint)) {
    add("opencode-provider-plugin.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeProviderPluginSameJSON(left: unknown, right: unknown): boolean {
  return openCodeProviderPluginStableJSON(left) === openCodeProviderPluginStableJSON(right)
}

function openCodeProviderPluginFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeProviderPluginStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeProviderPluginStableJSON(value: unknown): string {
  return JSON.stringify(openCodeProviderPluginSortStable(value))
}

function openCodeProviderPluginSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeProviderPluginSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeProviderPluginSortStable(entry)]),
  )
}
