import { createHash } from "node:crypto"

import type { OpenCodeProviderPluginDescriptorInfo } from "./opencode-provider-plugin-descriptor.ts"

export interface OpenCodePluginProviderRegistryAuthHook {
  provider?: string
  loader?: unknown
  methods?: unknown[]
  [key: string]: unknown
}

export interface OpenCodePluginProviderRegistryHookRecord {
  auth?: OpenCodePluginProviderRegistryAuthHook | null
  provider?: OpenCodeProviderPluginDescriptorInfo | null
}

export interface OpenCodePluginProviderRegistryModelHook {
  providerID: string
  provider: OpenCodeProviderPluginDescriptorInfo
  hasModelsLoader: boolean
}

export interface OpenCodePluginProviderRegistryAuthLoaderHook {
  providerID: string
  auth: OpenCodePluginProviderRegistryAuthHook
  hasLoader: true
}

export interface OpenCodePluginProviderRegistryHost {
  services: Map<string, unknown>
  registerProvider(input: { name: string; config: unknown }, source?: unknown): () => void
}

export interface OpenCodePluginProviderRegistryScope {
  source: { id: string }
  addCleanup(cleanup: () => void): void
}

export interface OpenCodePluginProviderRegistryBridge {
  collectAuthHooks(hooks: OpenCodePluginProviderRegistryHookRecord[]): Record<string, OpenCodePluginProviderRegistryAuthHook>
  collectProviderModelHooks(input: {
    hooks: OpenCodePluginProviderRegistryHookRecord[]
    disabledProviderIDs?: Iterable<string>
    databaseProviderIDs?: Iterable<string>
  }): OpenCodePluginProviderRegistryModelHook[]
  collectAuthLoaderHooks(input: {
    hooks: OpenCodePluginProviderRegistryHookRecord[]
    storedAuthProviderIDs?: Iterable<string>
    disabledProviderIDs?: Iterable<string>
  }): OpenCodePluginProviderRegistryAuthLoaderHook[]
  registerProvider(input: {
    host: OpenCodePluginProviderRegistryHost
    scope: OpenCodePluginProviderRegistryScope
    provider?: OpenCodeProviderPluginDescriptorInfo | null
  }): void
}

export interface OpenCodePluginProviderRegistryNativeExactFixtureCase {
  id: "auth-record-from-plugin-list" | "provider-model-hook-filter" | "auth-loader-hook-filter" | "source-scoped-provider-registration"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginProviderRegistryNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.provider-registry-bridge"
  coveredAtomIDs: Array<"opencode.plugin.provider-registry-bridge" | "opencode.registry.provider-plugin">
  portID: "registry.provider"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-provider-registry-native-exact-fixture"
  replayRef: "plugin-provider-registry-native-exact:opencode"
  fixtureID: "opencode-plugin-provider-registry:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginProviderRegistryNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodePluginProviderRegistryNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginProviderRegistryNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginProviderRegistryNativeExactFixtureIssue[]
}

export function createOpenCodePluginProviderRegistryBridge(): OpenCodePluginProviderRegistryBridge {
  return {
    collectAuthHooks: openCodePluginProviderRegistryCollectAuthHooks,
    collectProviderModelHooks: openCodePluginProviderRegistryCollectProviderModelHooks,
    collectAuthLoaderHooks: openCodePluginProviderRegistryCollectAuthLoaderHooks,
    registerProvider: openCodePluginProviderRegistryRegisterProvider,
  }
}

export function openCodePluginProviderRegistryCollectAuthHooks(
  hooks: OpenCodePluginProviderRegistryHookRecord[],
): Record<string, OpenCodePluginProviderRegistryAuthHook> {
  const result: Record<string, OpenCodePluginProviderRegistryAuthHook> = {}
  for (const hook of hooks) {
    const auth = hook.auth
    if (auth?.provider === undefined) continue
    if (typeof auth.provider !== "string") throw new TypeError("OpenCode provider auth hooks require a string provider id.")
    result[auth.provider] = auth
  }
  return result
}

export function openCodePluginProviderRegistryCollectProviderModelHooks(input: {
  hooks: OpenCodePluginProviderRegistryHookRecord[]
  disabledProviderIDs?: Iterable<string>
  databaseProviderIDs?: Iterable<string>
}): OpenCodePluginProviderRegistryModelHook[] {
  const disabled = new Set(input.disabledProviderIDs ?? [])
  const database = input.databaseProviderIDs ? new Set(input.databaseProviderIDs) : undefined
  const result: OpenCodePluginProviderRegistryModelHook[] = []
  for (const hook of input.hooks) {
    const provider = hook.provider
    const models = provider?.models
    if (!provider || !models) continue
    if (typeof provider.id !== "string") throw new TypeError("OpenCode provider hooks with model loaders require a string provider id.")
    if (disabled.has(provider.id)) continue
    if (database && !database.has(provider.id)) continue
    result.push({
      providerID: provider.id,
      provider,
      hasModelsLoader: typeof models === "function",
    })
  }
  return result
}

export function openCodePluginProviderRegistryCollectAuthLoaderHooks(input: {
  hooks: OpenCodePluginProviderRegistryHookRecord[]
  storedAuthProviderIDs?: Iterable<string>
  disabledProviderIDs?: Iterable<string>
}): OpenCodePluginProviderRegistryAuthLoaderHook[] {
  const storedAuth = input.storedAuthProviderIDs ? new Set(input.storedAuthProviderIDs) : undefined
  const disabled = new Set(input.disabledProviderIDs ?? [])
  const result: OpenCodePluginProviderRegistryAuthLoaderHook[] = []
  for (const hook of input.hooks) {
    const auth = hook.auth
    if (!auth) continue
    if (typeof auth.provider !== "string") throw new TypeError("OpenCode provider auth loader hooks require a string provider id.")
    if (disabled.has(auth.provider)) continue
    if (storedAuth && !storedAuth.has(auth.provider)) continue
    if (!auth.loader) continue
    result.push({ providerID: auth.provider, auth, hasLoader: true })
  }
  return result
}

export function openCodePluginProviderRegistryRegisterProvider(input: {
  host: OpenCodePluginProviderRegistryHost
  scope: OpenCodePluginProviderRegistryScope
  provider?: OpenCodeProviderPluginDescriptorInfo | null
}): void {
  if (!input.provider) return
  const key = openCodePluginProviderRegistryServiceKey(input.scope.source.id)
  input.host.services.set(key, input.provider)
  input.scope.addCleanup(() => {
    input.host.services.delete(key)
  })
  input.scope.addCleanup(
    input.host.registerProvider(
      { name: openCodePluginProviderRegistryRegistryName(input.scope.source.id), config: input.provider },
      input.scope.source,
    ),
  )
}

export function openCodePluginProviderRegistryRegistryName(sourceID: string): string {
  return sourceID
}

export function openCodePluginProviderRegistryServiceKey(sourceID: string): string {
  return `opencode.provider:${sourceID}`
}

export function captureOpenCodePluginProviderRegistryNativeExactFixture(): OpenCodePluginProviderRegistryNativeExactFixture {
  const bridge = createOpenCodePluginProviderRegistryBridge()
  const modelLoader = async () => ({ "plugin-model": { id: "plugin-model" } })
  const authLoader = async () => ({ baseURL: "https://provider.example.test/v1" })
  const hooks: OpenCodePluginProviderRegistryHookRecord[] = [
    {
      auth: { provider: "openai", methods: [{ type: "api" }], marker: "first" },
      provider: { id: "openai", models: modelLoader, marker: "database-match" },
    },
    {
      auth: { provider: "anthropic", methods: [{ type: "oauth" }], loader: authLoader, marker: "stored-auth" },
      provider: { id: "missing-from-database", models: modelLoader },
    },
    {
      auth: { provider: "openai", methods: [{ type: "oauth" }], marker: "last-wins" },
      provider: { id: "disabled-provider", models: modelLoader },
    },
    {
      provider: { id: "no-model-loader" },
    },
  ]

  const authRecordActual = bridge.collectAuthHooks(hooks)
  const providerModelActual = bridge.collectProviderModelHooks({
    hooks,
    disabledProviderIDs: ["disabled-provider"],
    databaseProviderIDs: ["openai", "anthropic"],
  }).map((item) => ({
    providerID: item.providerID,
    hasModelsLoader: item.hasModelsLoader,
    marker: item.provider.marker,
  }))
  const authLoaderActual = bridge.collectAuthLoaderHooks({
    hooks,
    storedAuthProviderIDs: ["anthropic", "openai"],
    disabledProviderIDs: ["openai"],
  }).map((item) => ({
    providerID: item.providerID,
    hasLoader: item.hasLoader,
    marker: item.auth.marker,
  }))

  const cleanup: Array<() => void> = []
  const registerCalls: unknown[] = []
  const host: OpenCodePluginProviderRegistryHost = {
    services: new Map<string, unknown>(),
    registerProvider(input, source) {
      registerCalls.push({ input, source })
      return () => registerCalls.push({ cleanup: input.name })
    },
  }
  const scope: OpenCodePluginProviderRegistryScope = {
    source: { id: "sample-plugin" },
    addCleanup(item) {
      cleanup.push(item)
    },
  }
  bridge.registerProvider({
    host,
    scope,
    provider: { id: "custom-provider", packageName: "@example/provider", models: modelLoader },
  })
  const registrationActual = {
    beforeCleanup: {
      services: Array.from(host.services.entries()).map(([key, provider]) => [
        key,
        typeof provider === "object" && provider !== null
          ? { id: (provider as { id?: unknown }).id, packageName: (provider as { packageName?: unknown }).packageName, hasModelsLoader: typeof (provider as { models?: unknown }).models === "function" }
          : provider,
      ]),
      registerCalls: registerCalls.map(openCodePluginProviderRegistrySerializableRegisterCall),
      cleanupCount: cleanup.length,
    },
    afterCleanup: undefined as unknown,
  }
  for (const item of cleanup) item()
  registrationActual.afterCleanup = {
    services: Array.from(host.services.entries()),
    registerCalls: registerCalls.map(openCodePluginProviderRegistrySerializableRegisterCall),
  }

  const cases: OpenCodePluginProviderRegistryNativeExactFixtureCase[] = [
    {
      id: "auth-record-from-plugin-list",
      actual: authRecordActual,
      expected: {
        anthropic: { provider: "anthropic", methods: [{ type: "oauth" }], marker: "stored-auth" },
        openai: { provider: "openai", methods: [{ type: "oauth" }], marker: "last-wins" },
      },
    },
    {
      id: "provider-model-hook-filter",
      actual: providerModelActual,
      expected: [
        { providerID: "openai", hasModelsLoader: true, marker: "database-match" },
      ],
    },
    {
      id: "auth-loader-hook-filter",
      actual: authLoaderActual,
      expected: [
        { providerID: "anthropic", hasLoader: true, marker: "stored-auth" },
      ],
    },
    {
      id: "source-scoped-provider-registration",
      actual: registrationActual,
      expected: {
        beforeCleanup: {
          services: [
            [
              "opencode.provider:sample-plugin",
              { id: "custom-provider", packageName: "@example/provider", hasModelsLoader: true },
            ],
          ],
          registerCalls: [
            {
              input: {
                name: "sample-plugin",
                config: { id: "custom-provider", packageName: "@example/provider", hasModelsLoader: true },
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
                config: { id: "custom-provider", packageName: "@example/provider", hasModelsLoader: true },
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
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.plugin.provider-registry-bridge",
    coveredAtomIDs: ["opencode.plugin.provider-registry-bridge", "opencode.registry.provider-plugin"],
    portID: "registry.provider",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-plugin-provider-registry-native-exact-fixture",
    replayRef: "plugin-provider-registry-native-exact:opencode",
    fixtureID: "opencode-plugin-provider-registry:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks.auth,Hooks.provider",
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.list",
      "anomalyco/opencode:packages/opencode/src/provider/auth.ts#ProviderAuth.state",
      "anomalyco/opencode:packages/opencode/src/provider/provider.ts#plugins,provider.models,plugin.auth.loader",
    ],
    cases,
    knownLossiness: [],
  } satisfies Omit<OpenCodePluginProviderRegistryNativeExactFixture, "fingerprint">
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodePluginProviderRegistryFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodePluginProviderRegistryNativeExactFixture(
  fixture: OpenCodePluginProviderRegistryNativeExactFixture,
): OpenCodePluginProviderRegistryNativeExactFixtureVerification {
  const issues: OpenCodePluginProviderRegistryNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-provider-registry.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.provider-registry-bridge" || fixture.portID !== "registry.provider") {
    add("opencode-plugin-provider-registry.target", "Fixture must target opencode.plugin.provider-registry-bridge and registry.provider.")
  }
  for (const atomID of ["opencode.plugin.provider-registry-bridge", "opencode.registry.provider-plugin"] as const) {
    if (!fixture.coveredAtomIDs.includes(atomID)) add("opencode-plugin-provider-registry.covered-atom", `Fixture must cover ${atomID}.`)
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-plugin-provider-registry.native-claim", "Plugin provider registry fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-plugin-provider-registry.lossiness", "Native plugin provider registry fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/plugin/src/index.ts",
    "packages/opencode/src/plugin/index.ts",
    "packages/opencode/src/provider/auth.ts",
    "packages/opencode/src/provider/provider.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-provider-registry.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginProviderRegistrySameJSON(item.actual, item.expected)) {
      add("opencode-plugin-provider-registry.case", "Case actual output must match expected pinned upstream provider registry behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginProviderRegistryFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-provider-registry.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodePluginProviderRegistrySerializableRegisterCall(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  if ("cleanup" in value) return value
  const call = value as { input?: { name?: unknown; config?: unknown }; source?: unknown }
  const config = call.input?.config
  return {
    input: {
      name: call.input?.name,
      config: typeof config === "object" && config !== null
        ? { id: (config as { id?: unknown }).id, packageName: (config as { packageName?: unknown }).packageName, hasModelsLoader: typeof (config as { models?: unknown }).models === "function" }
        : config,
    },
    source: call.source,
  }
}

function openCodePluginProviderRegistrySameJSON(left: unknown, right: unknown): boolean {
  return openCodePluginProviderRegistryStableJSON(left) === openCodePluginProviderRegistryStableJSON(right)
}

function openCodePluginProviderRegistryFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodePluginProviderRegistryStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodePluginProviderRegistryStableJSON(value: unknown): string {
  return JSON.stringify(openCodePluginProviderRegistrySortStable(value))
}

function openCodePluginProviderRegistrySortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodePluginProviderRegistrySortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodePluginProviderRegistrySortStable(entry)]),
  )
}
