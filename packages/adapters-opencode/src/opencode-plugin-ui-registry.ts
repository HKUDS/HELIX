import { createHash } from "node:crypto"

import type { OpenCodeHooks } from "./plugin-adapter"

export interface OpenCodePluginUIRegistryHost {
  services: Map<string, unknown>
  registerUIProvider(input: { name: string; provider: unknown }, source?: unknown): () => void
}

export interface OpenCodePluginUIRegistryScope {
  source: { id: string; path?: string; scope?: string; order?: number }
  addCleanup(cleanup: () => void): void
}

export interface OpenCodePluginUIRegistryBridge {
  register(input: {
    host: OpenCodePluginUIRegistryHost
    scope: OpenCodePluginUIRegistryScope
    hooks: OpenCodeHooks
  }): void
}

export interface OpenCodePluginUIRegistryNativeExactFixtureCase {
  id: "no-ui-noop" | "source-scoped-ui-registration" | "provider-reference-retained"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginUIRegistryNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.ui-registry-bridge"
  coveredAtomIDs: Array<"opencode.plugin.ui-registry-bridge" | "opencode.registry.ui-provider">
  portID: "registry.ui"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-ui-registry-native-exact-fixture"
  replayRef: "plugin-ui-registry-native-exact:opencode"
  fixtureID: "opencode-plugin-ui-registry:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginUIRegistryNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodePluginUIRegistryNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginUIRegistryNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginUIRegistryNativeExactFixtureIssue[]
}

export function createOpenCodePluginUIRegistryBridge(): OpenCodePluginUIRegistryBridge {
  return {
    register: openCodePluginUIRegistryRegister,
  }
}

export function openCodePluginUIRegistryRegister(input: {
  host: OpenCodePluginUIRegistryHost
  scope: OpenCodePluginUIRegistryScope
  hooks: OpenCodeHooks
}): void {
  if (!input.hooks.ui) return
  const serviceKey = openCodePluginUIRegistryServiceKey(input.scope.source.id)
  input.host.services.set(serviceKey, input.hooks.ui)
  input.scope.addCleanup(() => {
    input.host.services.delete(serviceKey)
  })
  input.scope.addCleanup(
    input.host.registerUIProvider(
      { name: openCodePluginUIRegistryProviderName(input.scope.source.id), provider: input.hooks.ui },
      input.scope.source,
    ),
  )
}

export function openCodePluginUIRegistryProviderName(sourceID: string): string {
  return sourceID
}

export function openCodePluginUIRegistryServiceKey(sourceID: string): string {
  return `opencode.ui:${sourceID}`
}

export function captureOpenCodePluginUIRegistryNativeExactFixture(): OpenCodePluginUIRegistryNativeExactFixture {
  const bridge = createOpenCodePluginUIRegistryBridge()

  const noopCleanup: Array<() => void> = []
  const noopHost: OpenCodePluginUIRegistryHost = {
    services: new Map<string, unknown>(),
    registerUIProvider() {
      throw new Error("registerUIProvider should not be called without hooks.ui")
    },
  }
  bridge.register({
    host: noopHost,
    scope: {
      source: { id: "no-ui", scope: "project" },
      addCleanup(cleanup) {
        noopCleanup.push(cleanup)
      },
    },
    hooks: {},
  })

  const cleanup: Array<() => void> = []
  const registerCalls: unknown[] = []
  const host: OpenCodePluginUIRegistryHost = {
    services: new Map<string, unknown>(),
    registerUIProvider(input, source) {
      registerCalls.push({ input, source })
      return () => registerCalls.push({ cleanup: input.name })
    },
  }
  const source = { id: "sample-plugin", path: "/workspace/opencode-ui-plugin.ts", scope: "project", order: 4 }
  const provider = {
    render: "panel",
    slots: ["status.right", "sidebar.footer"],
    open: () => "panel-opened",
  }
  bridge.register({
    host,
    scope: {
      source,
      addCleanup(item) {
        cleanup.push(item)
      },
    },
    hooks: { ui: provider },
  })
  const registeredValue = host.services.get(openCodePluginUIRegistryServiceKey(source.id))
  const registrationActual = {
    beforeCleanup: {
      services: openCodePluginUIRegistrySerializableServices(host.services),
      registerCalls: registerCalls.map(openCodePluginUIRegistrySerializableRegisterCall),
      cleanupCount: cleanup.length,
      sameProviderReference: registeredValue === provider,
    },
    afterCleanup: undefined as unknown,
  }
  for (const item of cleanup) item()
  registrationActual.afterCleanup = {
    services: openCodePluginUIRegistrySerializableServices(host.services),
    registerCalls: registerCalls.map(openCodePluginUIRegistrySerializableRegisterCall),
  }

  const retainedCleanup: Array<() => void> = []
  const retainedHost: OpenCodePluginUIRegistryHost = {
    services: new Map<string, unknown>(),
    registerUIProvider() {
      return () => undefined
    },
  }
  const retainedProvider = { component: "exact-object" }
  bridge.register({
    host: retainedHost,
    scope: {
      source: { id: "identity-ui", scope: "global" },
      addCleanup(item) {
        retainedCleanup.push(item)
      },
    },
    hooks: { ui: retainedProvider },
  })
  const retainedActual = {
    serviceKey: openCodePluginUIRegistryServiceKey("identity-ui"),
    providerName: openCodePluginUIRegistryProviderName("identity-ui"),
    sameProviderReference: retainedHost.services.get(openCodePluginUIRegistryServiceKey("identity-ui")) === retainedProvider,
    cleanupCount: retainedCleanup.length,
    provider: openCodePluginUIRegistrySerializableProvider(retainedProvider),
  }

  const cases: OpenCodePluginUIRegistryNativeExactFixtureCase[] = [
    {
      id: "no-ui-noop",
      actual: {
        services: openCodePluginUIRegistrySerializableServices(noopHost.services),
        cleanupCount: noopCleanup.length,
      },
      expected: { services: [], cleanupCount: 0 },
    },
    {
      id: "source-scoped-ui-registration",
      actual: registrationActual,
      expected: {
        beforeCleanup: {
          services: [
            [
              "opencode.ui:sample-plugin",
              {
                render: "panel",
                slots: ["status.right", "sidebar.footer"],
                hasOpen: true,
              },
            ],
          ],
          registerCalls: [
            {
              input: {
                name: "sample-plugin",
                provider: {
                  render: "panel",
                  slots: ["status.right", "sidebar.footer"],
                  hasOpen: true,
                },
              },
              source,
            },
          ],
          cleanupCount: 2,
          sameProviderReference: true,
        },
        afterCleanup: {
          services: [],
          registerCalls: [
            {
              input: {
                name: "sample-plugin",
                provider: {
                  render: "panel",
                  slots: ["status.right", "sidebar.footer"],
                  hasOpen: true,
                },
              },
              source,
            },
            { cleanup: "sample-plugin" },
          ],
        },
      },
    },
    {
      id: "provider-reference-retained",
      actual: retainedActual,
      expected: {
        serviceKey: "opencode.ui:identity-ui",
        providerName: "identity-ui",
        sameProviderReference: true,
        cleanupCount: 2,
        provider: { component: "exact-object" },
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.plugin.ui-registry-bridge",
    coveredAtomIDs: ["opencode.plugin.ui-registry-bridge", "opencode.registry.ui-provider"],
    portID: "registry.ui",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-plugin-ui-registry-native-exact-fixture",
    replayRef: "plugin-ui-registry-native-exact:opencode",
    fixtureID: "opencode-plugin-ui-registry:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "anomalyco/opencode:packages/plugin/src/index.ts#PluginModule,Hooks",
      "anomalyco/opencode:packages/plugin/src/tui.ts#TuiPluginApi.ui,TuiPluginModule",
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.list,applyPlugin",
      "anomalyco/opencode:packages/opencode/src/cli/cmd/tui/plugin/api.tsx#createTuiApi.ui",
      "anomalyco/opencode:packages/opencode/src/cli/cmd/tui/plugin/runtime.ts#pluginApi.ui,lifecycle",
    ],
    cases,
    knownLossiness: [],
  } satisfies Omit<OpenCodePluginUIRegistryNativeExactFixture, "fingerprint">
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodePluginUIRegistryFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodePluginUIRegistryNativeExactFixture(
  fixture: OpenCodePluginUIRegistryNativeExactFixture,
): OpenCodePluginUIRegistryNativeExactFixtureVerification {
  const issues: OpenCodePluginUIRegistryNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-ui-registry.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.ui-registry-bridge" || fixture.portID !== "registry.ui") {
    add("opencode-plugin-ui-registry.target", "Fixture must target opencode.plugin.ui-registry-bridge and registry.ui.")
  }
  for (const atomID of ["opencode.plugin.ui-registry-bridge", "opencode.registry.ui-provider"] as const) {
    if (!fixture.coveredAtomIDs.includes(atomID)) add("opencode-plugin-ui-registry.covered-atom", `Fixture must cover ${atomID}.`)
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-plugin-ui-registry.native-claim", "Plugin UI registry fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-plugin-ui-registry.lossiness", "Native plugin UI registry fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/plugin/src/index.ts",
    "packages/plugin/src/tui.ts",
    "packages/opencode/src/plugin/index.ts",
    "packages/opencode/src/cli/cmd/tui/plugin/api.tsx",
    "packages/opencode/src/cli/cmd/tui/plugin/runtime.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-ui-registry.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginUIRegistrySameJSON(item.actual, item.expected)) {
      add("opencode-plugin-ui-registry.case", "Case actual output must match expected pinned upstream UI registry behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginUIRegistryFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-ui-registry.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodePluginUIRegistrySerializableServices(services: Map<string, unknown>): unknown[] {
  return Array.from(services.entries()).map(([key, provider]) => [key, openCodePluginUIRegistrySerializableProvider(provider)])
}

function openCodePluginUIRegistrySerializableRegisterCall(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  if ("cleanup" in value) return value
  const call = value as { input?: { name?: unknown; provider?: unknown }; source?: unknown }
  return {
    input: {
      name: call.input?.name,
      provider: openCodePluginUIRegistrySerializableProvider(call.input?.provider),
    },
    source: call.source,
  }
}

function openCodePluginUIRegistrySerializableProvider(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  const record = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  if ("render" in record) result.render = record.render
  if ("slots" in record) result.slots = record.slots
  if ("component" in record) result.component = record.component
  if ("open" in record) result.hasOpen = typeof record.open === "function"
  return result
}

function openCodePluginUIRegistrySameJSON(left: unknown, right: unknown): boolean {
  return openCodePluginUIRegistryStableJSON(left) === openCodePluginUIRegistryStableJSON(right)
}

function openCodePluginUIRegistryFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodePluginUIRegistryStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodePluginUIRegistryStableJSON(value: unknown): string {
  return JSON.stringify(openCodePluginUIRegistrySortStable(value))
}

function openCodePluginUIRegistrySortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodePluginUIRegistrySortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, openCodePluginUIRegistrySortStable(item)]),
  )
}
