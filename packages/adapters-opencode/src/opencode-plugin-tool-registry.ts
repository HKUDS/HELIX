import { createHash } from "node:crypto"

import type { OpenCodeHooks } from "./plugin-adapter"

export interface OpenCodePluginToolRegistryHost {
  services: Map<string, unknown>
}

export interface OpenCodePluginToolRegistryScope {
  source: { id: string; path?: string; scope?: string; order?: number }
  addCleanup(cleanup: () => void): void
}

export interface OpenCodePluginToolRegistryBridge {
  register(input: {
    host: OpenCodePluginToolRegistryHost
    scope: OpenCodePluginToolRegistryScope
    hooks: OpenCodeHooks
  }): void
}

export interface OpenCodePluginToolRegistryNativeExactFixtureCase {
  id: "no-tools-noop" | "source-scoped-tool-registration" | "definition-reference-retained"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginToolRegistryNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.registry-bridge"
  coveredAtomIDs: Array<"opencode.plugin.registry-bridge" | "opencode.registry.tool-definition">
  portID: "tool.registry"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-tool-registry-native-exact-fixture"
  replayRef: "plugin-tool-registry-native-exact:opencode"
  fixtureID: "opencode-plugin-tool-registry:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginToolRegistryNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodePluginToolRegistryNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginToolRegistryNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginToolRegistryNativeExactFixtureIssue[]
}

export function createOpenCodePluginToolRegistryBridge(): OpenCodePluginToolRegistryBridge {
  return {
    register: openCodePluginToolRegistryRegister,
  }
}

export function openCodePluginToolRegistryRegister(input: {
  host: OpenCodePluginToolRegistryHost
  scope: OpenCodePluginToolRegistryScope
  hooks: OpenCodeHooks
}): void {
  if (!input.hooks.tool) return
  for (const [name, definition] of Object.entries(input.hooks.tool)) {
    const key = openCodePluginToolRegistryServiceKey(name)
    input.host.services.set(key, { definition, source: input.scope.source })
    input.scope.addCleanup(() => {
      input.host.services.delete(key)
    })
  }
}

export function openCodePluginToolRegistryServiceKey(toolName: string): string {
  return `opencode.tool:${toolName}`
}

export function captureOpenCodePluginToolRegistryNativeExactFixture(): OpenCodePluginToolRegistryNativeExactFixture {
  const bridge = createOpenCodePluginToolRegistryBridge()

  const noopCleanup: Array<() => void> = []
  const noopHost: OpenCodePluginToolRegistryHost = { services: new Map<string, unknown>() }
  bridge.register({
    host: noopHost,
    scope: {
      source: { id: "no-tools", scope: "project" },
      addCleanup(cleanup) {
        noopCleanup.push(cleanup)
      },
    },
    hooks: {},
  })

  const formatterDefinition = {
    description: "Format a source file",
    args: { file: { type: "string" } },
    execute: async () => ({ title: "formatted", output: "ok" }),
  }
  const reviewerDefinition = {
    description: "Review a source file",
    args: { file: { type: "string" }, severity: { type: "string" } },
    execute: async () => ({ title: "reviewed", output: "ok" }),
  }
  const cleanup: Array<() => void> = []
  const host: OpenCodePluginToolRegistryHost = { services: new Map<string, unknown>() }
  const source = { id: "sample-plugin", path: "/workspace/opencode-plugin.ts", scope: "project", order: 2 }
  bridge.register({
    host,
    scope: {
      source,
      addCleanup(item) {
        cleanup.push(item)
      },
    },
    hooks: {
      tool: {
        formatter: formatterDefinition,
        reviewer: reviewerDefinition,
      },
    },
  })
  const registrationActual = {
    beforeCleanup: {
      services: openCodePluginToolRegistrySerializableServices(host.services),
      cleanupCount: cleanup.length,
    },
    afterCleanup: undefined as unknown,
  }
  for (const item of cleanup) item()
  registrationActual.afterCleanup = {
    services: openCodePluginToolRegistrySerializableServices(host.services),
  }

  const retainedCleanup: Array<() => void> = []
  const retainedHost: OpenCodePluginToolRegistryHost = { services: new Map<string, unknown>() }
  const retainedDefinition = { description: "Keep exact object identity", args: {}, execute: async () => "kept" }
  bridge.register({
    host: retainedHost,
    scope: {
      source: { id: "identity-plugin", scope: "global" },
      addCleanup(item) {
        retainedCleanup.push(item)
      },
    },
    hooks: { tool: { identity: retainedDefinition } },
  })
  const retainedValue = retainedHost.services.get(openCodePluginToolRegistryServiceKey("identity")) as { definition?: unknown } | undefined
  const retainedActual = {
    sameDefinitionReference: retainedValue?.definition === retainedDefinition,
    serviceKey: openCodePluginToolRegistryServiceKey("identity"),
    cleanupCount: retainedCleanup.length,
    definition: openCodePluginToolRegistrySerializableDefinition(retainedValue?.definition),
  }

  const cases: OpenCodePluginToolRegistryNativeExactFixtureCase[] = [
    {
      id: "no-tools-noop",
      actual: {
        services: openCodePluginToolRegistrySerializableServices(noopHost.services),
        cleanupCount: noopCleanup.length,
      },
      expected: { services: [], cleanupCount: 0 },
    },
    {
      id: "source-scoped-tool-registration",
      actual: registrationActual,
      expected: {
        beforeCleanup: {
          services: [
            [
              "opencode.tool:formatter",
              {
                definition: {
                  description: "Format a source file",
                  args: { file: { type: "string" } },
                  hasExecute: true,
                },
                source,
              },
            ],
            [
              "opencode.tool:reviewer",
              {
                definition: {
                  description: "Review a source file",
                  args: { file: { type: "string" }, severity: { type: "string" } },
                  hasExecute: true,
                },
                source,
              },
            ],
          ],
          cleanupCount: 2,
        },
        afterCleanup: { services: [] },
      },
    },
    {
      id: "definition-reference-retained",
      actual: retainedActual,
      expected: {
        sameDefinitionReference: true,
        serviceKey: "opencode.tool:identity",
        cleanupCount: 1,
        definition: {
          description: "Keep exact object identity",
          args: {},
          hasExecute: true,
        },
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.plugin.registry-bridge",
    coveredAtomIDs: ["opencode.plugin.registry-bridge", "opencode.registry.tool-definition"],
    portID: "tool.registry",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-plugin-tool-registry-native-exact-fixture",
    replayRef: "plugin-tool-registry-native-exact:opencode",
    fixtureID: "opencode-plugin-tool-registry:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks.tool",
      "anomalyco/opencode:packages/plugin/src/tool.ts#tool,ToolDefinition",
      "anomalyco/opencode:packages/opencode/src/tool/registry.ts#ToolRegistry.state,fromPlugin",
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.list",
    ],
    cases,
    knownLossiness: [],
  } satisfies Omit<OpenCodePluginToolRegistryNativeExactFixture, "fingerprint">
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodePluginToolRegistryFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodePluginToolRegistryNativeExactFixture(
  fixture: OpenCodePluginToolRegistryNativeExactFixture,
): OpenCodePluginToolRegistryNativeExactFixtureVerification {
  const issues: OpenCodePluginToolRegistryNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-tool-registry.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.registry-bridge" || fixture.portID !== "tool.registry") {
    add("opencode-plugin-tool-registry.target", "Fixture must target opencode.plugin.registry-bridge and tool.registry.")
  }
  for (const atomID of ["opencode.plugin.registry-bridge", "opencode.registry.tool-definition"] as const) {
    if (!fixture.coveredAtomIDs.includes(atomID)) add("opencode-plugin-tool-registry.covered-atom", `Fixture must cover ${atomID}.`)
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-plugin-tool-registry.native-claim", "Plugin tool registry fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-plugin-tool-registry.lossiness", "Native plugin tool registry fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/plugin/src/index.ts",
    "packages/plugin/src/tool.ts",
    "packages/opencode/src/tool/registry.ts",
    "packages/opencode/src/plugin/index.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-tool-registry.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginToolRegistrySameJSON(item.actual, item.expected)) {
      add("opencode-plugin-tool-registry.case", "Case actual output must match expected pinned upstream tool registry behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginToolRegistryFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-tool-registry.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodePluginToolRegistrySerializableServices(services: Map<string, unknown>): unknown[] {
  return Array.from(services.entries()).map(([key, value]) => [key, openCodePluginToolRegistrySerializableServiceValue(value)])
}

function openCodePluginToolRegistrySerializableServiceValue(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  const record = value as { definition?: unknown; source?: unknown }
  return {
    definition: openCodePluginToolRegistrySerializableDefinition(record.definition),
    source: record.source,
  }
}

function openCodePluginToolRegistrySerializableDefinition(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  const record = value as { description?: unknown; args?: unknown; execute?: unknown }
  return {
    description: record.description,
    args: record.args,
    hasExecute: typeof record.execute === "function",
  }
}

function openCodePluginToolRegistrySameJSON(left: unknown, right: unknown): boolean {
  return openCodePluginToolRegistryStableJSON(left) === openCodePluginToolRegistryStableJSON(right)
}

function openCodePluginToolRegistryFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodePluginToolRegistryStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodePluginToolRegistryStableJSON(value: unknown): string {
  return JSON.stringify(openCodePluginToolRegistrySortStable(value))
}

function openCodePluginToolRegistrySortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodePluginToolRegistrySortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodePluginToolRegistrySortStable(entry)]),
  )
}
