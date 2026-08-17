import { createHash } from "node:crypto"

export interface OpenCodeProviderAuthOauth {
  type: "oauth"
  refresh: string
  access: string
  expires: number
  accountId?: string
  enterpriseUrl?: string
}

export interface OpenCodeProviderAuthApi {
  type: "api"
  key: string
  metadata?: Record<string, string>
}

export interface OpenCodeProviderAuthWellKnown {
  type: "wellknown"
  key: string
  token: string
}

export type OpenCodeProviderAuthInfo =
  | OpenCodeProviderAuthOauth
  | OpenCodeProviderAuthApi
  | OpenCodeProviderAuthWellKnown

export interface OpenCodeProviderAuthDescriptorStore {
  all(): Record<string, OpenCodeProviderAuthInfo>
  get(providerID: string): OpenCodeProviderAuthInfo | undefined
  set(providerID: string, info: OpenCodeProviderAuthInfo): void
  remove(providerID: string): void
}

export interface OpenCodeProviderAuthPluginHost {
  services: Map<string, unknown>
  registerAuth(input: { name: string; config: unknown }, source: { id: string }): () => void
}

export interface OpenCodeProviderAuthPluginScope {
  source: { id: string }
  addCleanup(cleanup: () => void): void
}

export interface OpenCodeProviderAuthDescriptor {
  headers(auth: OpenCodeProviderAuthInfo): Record<string, string>
  normalizeKey(providerID: string): string
  createStore(initial?: Record<string, OpenCodeProviderAuthInfo>): OpenCodeProviderAuthDescriptorStore
  registerPluginAuth(input: {
    host: OpenCodeProviderAuthPluginHost
    scope: OpenCodeProviderAuthPluginScope
    auth?: OpenCodeProviderAuthInfo
  }): void
}

export interface OpenCodeProviderAuthNativeExactFixtureCase {
  id: "auth-info-schema" | "store-key-normalization" | "plugin-auth-registration"
  actual: unknown
  expected: unknown
}

export interface OpenCodeProviderAuthNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.auth-descriptor"
  portID: "provider.auth"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-auth-descriptor-native-exact-fixture"
  replayRef: "provider-auth-descriptor-native-exact:opencode"
  fixtureID: "opencode-provider-auth-descriptor:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeProviderAuthNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderAuthNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderAuthNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderAuthNativeExactFixtureIssue[]
}

export function createOpenCodeProviderAuthDescriptor(): OpenCodeProviderAuthDescriptor {
  return {
    headers: openCodeProviderAuthHeaders,
    normalizeKey: openCodeProviderAuthNormalizeKey,
    createStore: createOpenCodeProviderAuthStore,
    registerPluginAuth: openCodeProviderAuthRegisterPluginAuth,
  }
}

export function openCodeProviderAuthHeaders(auth: OpenCodeProviderAuthInfo): Record<string, string> {
  if (auth.type === "api") return { authorization: `Bearer ${auth.key}` }
  if (auth.type === "oauth") return { authorization: `Bearer ${auth.access}` }
  return { authorization: `Bearer ${auth.token}` }
}

export function openCodeProviderAuthNormalizeKey(providerID: string): string {
  return providerID.replace(/\/+$/, "")
}

export function createOpenCodeProviderAuthStore(
  initial: Record<string, OpenCodeProviderAuthInfo> = {},
): OpenCodeProviderAuthDescriptorStore {
  const data: Record<string, OpenCodeProviderAuthInfo> = { ...initial }
  return {
    all() {
      return openCodeProviderAuthClone(data)
    },
    get(providerID) {
      return openCodeProviderAuthCloneInfo(data[providerID])
    },
    set(providerID, info) {
      const normalized = openCodeProviderAuthNormalizeKey(providerID)
      if (normalized !== providerID) delete data[providerID]
      delete data[`${normalized}/`]
      data[normalized] = openCodeProviderAuthCloneInfo(info)
    },
    remove(providerID) {
      const normalized = openCodeProviderAuthNormalizeKey(providerID)
      delete data[providerID]
      delete data[normalized]
    },
  }
}

export function openCodeProviderAuthRegisterPluginAuth(input: {
  host: OpenCodeProviderAuthPluginHost
  scope: OpenCodeProviderAuthPluginScope
  auth?: OpenCodeProviderAuthInfo
}): void {
  if (!input.auth) return
  const key = `opencode.auth:${input.scope.source.id}`
  input.host.services.set(key, input.auth)
  input.scope.addCleanup(() => {
    input.host.services.delete(key)
  })
  input.scope.addCleanup(input.host.registerAuth({ name: input.scope.source.id, config: input.auth }, input.scope.source))
}

export function captureOpenCodeProviderAuthNativeExactFixture(): OpenCodeProviderAuthNativeExactFixture {
  const descriptor = createOpenCodeProviderAuthDescriptor()
  const schemaActual = [
    descriptor.headers({ type: "api", key: "sk-test", metadata: { resourceName: "eastus" } }),
    descriptor.headers({ type: "oauth", refresh: "r1", access: "a1", expires: 123, accountId: "acct" }),
    descriptor.headers({ type: "wellknown", key: "device", token: "token-1" }),
  ]

  const store = descriptor.createStore({
    "openai/": { type: "api", key: "old" },
    anthropic: { type: "api", key: "anthropic-key" },
  })
  store.set("openai/", { type: "api", key: "new", metadata: { resourceName: "westus" } })
  store.remove("anthropic/")
  const storeActual = store.all()

  const cleanup: Array<() => void> = []
  const registerCalls: unknown[] = []
  const host: OpenCodeProviderAuthPluginHost = {
    services: new Map<string, unknown>(),
    registerAuth(input, source) {
      registerCalls.push({ input, source })
      return () => registerCalls.push({ cleanup: input.name })
    },
  }
  const scope: OpenCodeProviderAuthPluginScope = {
    source: { id: "sample-plugin" },
    addCleanup(item) {
      cleanup.push(item)
    },
  }
  descriptor.registerPluginAuth({
    host,
    scope,
    auth: { type: "oauth", refresh: "refresh", access: "access", expires: 456, enterpriseUrl: "https://example.test" },
  })
  const beforeCleanup = {
    services: Array.from(host.services.entries()),
    registerCalls: [...registerCalls],
    cleanupCount: cleanup.length,
  }
  for (const item of cleanup) item()
  const pluginActual = {
    beforeCleanup,
    afterCleanup: {
      services: Array.from(host.services.entries()),
      registerCalls,
    },
  }

  const cases: OpenCodeProviderAuthNativeExactFixtureCase[] = [
    {
      id: "auth-info-schema",
      actual: schemaActual,
      expected: [
        { authorization: "Bearer sk-test" },
        { authorization: "Bearer a1" },
        { authorization: "Bearer token-1" },
      ],
    },
    {
      id: "store-key-normalization",
      actual: storeActual,
      expected: {
        openai: { type: "api", key: "new", metadata: { resourceName: "westus" } },
      },
    },
    {
      id: "plugin-auth-registration",
      actual: pluginActual,
      expected: {
        beforeCleanup: {
          services: [
            [
              "opencode.auth:sample-plugin",
              {
                type: "oauth",
                refresh: "refresh",
                access: "access",
                expires: 456,
                enterpriseUrl: "https://example.test",
              },
            ],
          ],
          registerCalls: [
            {
              input: {
                name: "sample-plugin",
                config: {
                  type: "oauth",
                  refresh: "refresh",
                  access: "access",
                  expires: 456,
                  enterpriseUrl: "https://example.test",
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
                  type: "oauth",
                  refresh: "refresh",
                  access: "access",
                  expires: 456,
                  enterpriseUrl: "https://example.test",
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
    atomID: "opencode.provider.auth-descriptor" as const,
    portID: "provider.auth" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-auth-descriptor-native-exact-fixture" as const,
    replayRef: "provider-auth-descriptor-native-exact:opencode" as const,
    fixtureID: "opencode-provider-auth-descriptor:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/opencode/src/auth/index.ts#Oauth,Api,WellKnown,all,get,set,remove",
      "anomalyco/opencode:packages/core/src/plugin/provider/index.ts#ProviderPlugins",
      "anomalyco/opencode:packages/opencode/src/provider/provider.ts#auth-loader,mergeProvider,resolveSDK",
      "helix:packages/adapters-opencode/src/plugin-atoms.ts#createOpenCodePluginRegistryBridge",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderAuthFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderAuthNativeExactFixture(
  fixture: OpenCodeProviderAuthNativeExactFixture,
): OpenCodeProviderAuthNativeExactFixtureVerification {
  const issues: OpenCodeProviderAuthNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-provider-auth.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.provider.auth-descriptor" || fixture.portID !== "provider.auth") {
    add("opencode-provider-auth.target", "Fixture must target opencode.provider.auth-descriptor and provider.auth.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-provider-auth.native-claim", "Auth descriptor fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-provider-auth.lossiness", "Native auth descriptor fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/opencode/src/auth/index.ts",
    "packages/core/src/plugin/provider/index.ts",
    "packages/opencode/src/provider/provider.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-provider-auth.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodeProviderAuthSameJSON(item.actual, item.expected)) {
      add("opencode-provider-auth.case", "Case actual output must match expected pinned upstream auth behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderAuthFingerprintObject(withoutFingerprint)) {
    add("opencode-provider-auth.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeProviderAuthClone(data: Record<string, OpenCodeProviderAuthInfo>): Record<string, OpenCodeProviderAuthInfo> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, openCodeProviderAuthCloneInfo(value)]))
}

function openCodeProviderAuthCloneInfo<T extends OpenCodeProviderAuthInfo | undefined>(info: T): T {
  return (info === undefined ? undefined : openCodeProviderAuthSortStable(info)) as T
}

function openCodeProviderAuthSameJSON(left: unknown, right: unknown): boolean {
  return openCodeProviderAuthStableJSON(left) === openCodeProviderAuthStableJSON(right)
}

function openCodeProviderAuthFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeProviderAuthStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeProviderAuthStableJSON(value: unknown): string {
  return JSON.stringify(openCodeProviderAuthSortStable(value))
}

function openCodeProviderAuthSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeProviderAuthSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeProviderAuthSortStable(entry)]),
  )
}
