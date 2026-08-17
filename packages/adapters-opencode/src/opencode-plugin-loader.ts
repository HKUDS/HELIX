import { createHash } from "node:crypto"
import { LegoHookHost, type HookScope, type HookSourceInfo } from "@helix/lego-hooks"
import type { OpenCodeHooks, OpenCodePlugin, OpenCodePluginInput, OpenCodePluginOptions } from "./plugin-adapter"
import {
  createOpenCodePluginHotReloadCleanup,
  type OpenCodePluginHotReloadCleanup,
} from "./opencode-plugin-hot-reload-cleanup.ts"

export interface OpenCodeNativePluginLoaderSource {
  id?: string
  path?: string
  scope?: string
}

export interface OpenCodeNativePluginLoaderInput {
  host: LegoHookHost
  plugin: OpenCodePlugin
  pluginInput: OpenCodePluginInput
  options?: OpenCodePluginOptions
  source?: OpenCodeNativePluginLoaderSource
  config?: Record<string, unknown>
}

export interface OpenCodeNativePluginManifestNormalizer {
  normalize(input: { plugin: OpenCodePlugin; source?: OpenCodeNativePluginLoaderSource }): { id: string; path?: string; scope: string }
}

export interface OpenCodeNativePluginRegistrationInput {
  host: LegoHookHost
  scope: HookScope
  hooks: OpenCodeHooks
}

export interface OpenCodeNativePluginRegistrationBridge {
  register(input: OpenCodeNativePluginRegistrationInput): void
}

export interface OpenCodeNativePluginWorkspaceBridge {
  withWorkspace(input: { host: LegoHookHost; source: HookSourceInfo; pluginInput: OpenCodePluginInput }): OpenCodePluginInput
}

export interface OpenCodeNativePluginLoaderAtom {
  load(input: OpenCodeNativePluginLoaderInput): Promise<HookScope>
}

export interface OpenCodeNativePluginLoaderDependencies {
  manifestNormalizer?: OpenCodeNativePluginManifestNormalizer
  registryBridge: OpenCodeNativePluginRegistrationBridge
  permissionBridge: OpenCodeNativePluginRegistrationBridge
  eventMapper: OpenCodeNativePluginRegistrationBridge
  workspaceBridge: OpenCodeNativePluginWorkspaceBridge
  hotReloadCleanup?: OpenCodePluginHotReloadCleanup
}

export interface OpenCodePluginLoaderNativeExactFixtureCase {
  id: "source-config-registration-order" | "manifest-fallback-source" | "no-config-hook-registration"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginLoaderNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.loader"
  portID: "hook.bus"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-loader-native-exact-fixture"
  replayRef: "plugin-loader-native-exact:opencode"
  fixtureID: "opencode-plugin-loader:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginLoaderNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodePluginLoaderNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginLoaderNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginLoaderNativeExactFixtureIssue[]
}

export function createOpenCodeNativePluginManifestNormalizer(): OpenCodeNativePluginManifestNormalizer {
  return {
    normalize: normalizeOpenCodeNativePluginManifest,
  }
}

export function normalizeOpenCodeNativePluginManifest(input: {
  plugin: OpenCodePlugin
  source?: OpenCodeNativePluginLoaderSource
}): { id: string; path?: string; scope: string } {
  return {
    id: input.source?.id ?? (input.plugin.name || "opencode-plugin"),
    scope: input.source?.scope ?? "project",
    ...(input.source?.path ? { path: input.source.path } : {}),
  }
}

export function createOpenCodeNativePluginLoaderAtom(input: OpenCodeNativePluginLoaderDependencies): OpenCodeNativePluginLoaderAtom {
  const manifestNormalizer = input.manifestNormalizer ?? createOpenCodeNativePluginManifestNormalizer()
  const hotReloadCleanup = input.hotReloadCleanup ?? createOpenCodePluginHotReloadCleanup()
  return {
    load(loadInput) {
      return openCodeNativePluginLoaderLoad({
        ...loadInput,
        manifestNormalizer,
        registryBridge: input.registryBridge,
        permissionBridge: input.permissionBridge,
        eventMapper: input.eventMapper,
        workspaceBridge: input.workspaceBridge,
        hotReloadCleanup,
      })
    },
  }
}

export async function openCodeNativePluginLoaderLoad(
  input: OpenCodeNativePluginLoaderInput & OpenCodeNativePluginLoaderDependencies & { manifestNormalizer: OpenCodeNativePluginManifestNormalizer },
): Promise<HookScope> {
  const source = input.manifestNormalizer.normalize({
    plugin: input.plugin,
    ...(input.source ? { source: input.source } : {}),
  })
  if (input.hotReloadCleanup) await input.hotReloadCleanup.disposeExisting({ host: input.host, sourceID: source.id })
  const scope = input.host.createScope(source)
  input.hotReloadCleanup?.track({ host: input.host, scope })
  const pluginInput = input.workspaceBridge.withWorkspace({ host: input.host, source: scope.source, pluginInput: input.pluginInput })
  const hooks = await input.plugin(pluginInput, input.options)
  await hooks.config?.(input.config ?? {})
  input.registryBridge.register({ host: input.host, scope, hooks })
  input.permissionBridge.register({ host: input.host, scope, hooks })
  input.eventMapper.register({ host: input.host, scope, hooks })
  return scope
}

export async function captureOpenCodePluginLoaderNativeExactFixture(): Promise<OpenCodePluginLoaderNativeExactFixture> {
  const orderEvents: string[] = []
  const orderLoader = createOpenCodeNativePluginLoaderAtom({
    registryBridge: fixtureBridge("registry", orderEvents),
    permissionBridge: fixtureBridge("permission", orderEvents),
    eventMapper: fixtureBridge("event", orderEvents),
    workspaceBridge: fixtureWorkspaceBridge(orderEvents),
  })
  const orderHost = new LegoHookHost({ errorMode: "throw" })
  let pluginInputActual: unknown
  const orderScope = await orderLoader.load({
    host: orderHost,
    source: { id: "sample-plugin", path: "/workspace/opencode-plugin.ts", scope: "project" },
    pluginInput: { directory: "/workspace", worktree: "/workspace", project: { id: "project-1" }, client: { id: "client-1" } },
    options: { enabled: true, mode: "test" },
    config: { theme: "dark", model: "gpt-test" },
    plugin: async (pluginInput, options) => {
      pluginInputActual = {
        directory: pluginInput.directory,
        worktree: pluginInput.worktree,
        hasDollar: typeof pluginInput.$ === "function",
        hasWorkspaceRegister: typeof pluginInput.experimental_workspace?.register === "function",
        options,
      }
      orderEvents.push(`plugin:${pluginInput.directory}:${Object.keys(options ?? {}).sort().join(",")}`)
      return {
        config: async (config) => {
          orderEvents.push(`config:${Object.keys(config).sort().join(",")}`)
        },
        tool: {
          formatter: { description: "Format file" },
        },
        "chat.message": async () => undefined,
      }
    },
  })
  const orderBeforeCleanup = [...orderEvents]
  await orderScope.dispose()

  async function namedPlugin(): Promise<OpenCodeHooks> {
    return { event: async () => undefined }
  }
  const fallbackEvents: string[] = []
  const fallbackScope = await createOpenCodeNativePluginLoaderAtom({
    registryBridge: fixtureBridge("registry", fallbackEvents),
    permissionBridge: fixtureBridge("permission", fallbackEvents),
    eventMapper: fixtureBridge("event", fallbackEvents),
    workspaceBridge: fixtureWorkspaceBridge(fallbackEvents),
  }).load({
    host: new LegoHookHost({ errorMode: "throw" }),
    plugin: namedPlugin,
    pluginInput: { directory: "/fallback" },
  })

  const noConfigEvents: string[] = []
  await createOpenCodeNativePluginLoaderAtom({
    registryBridge: fixtureBridge("registry", noConfigEvents),
    permissionBridge: fixtureBridge("permission", noConfigEvents),
    eventMapper: fixtureBridge("event", noConfigEvents),
    workspaceBridge: fixtureWorkspaceBridge(noConfigEvents),
  }).load({
    host: new LegoHookHost({ errorMode: "throw" }),
    source: { id: "no-config", scope: "global" },
    pluginInput: { directory: "/no-config" },
    plugin: () => ({ "tool.execute.before": async () => undefined }),
  })

  const cases: OpenCodePluginLoaderNativeExactFixtureCase[] = [
    {
      id: "source-config-registration-order",
      actual: {
        source: serializableSource(orderScope.source),
        pluginInput: pluginInputActual,
        beforeCleanup: orderBeforeCleanup,
        afterCleanup: orderEvents,
      },
      expected: {
        source: { id: "sample-plugin", path: "/workspace/opencode-plugin.ts", scope: "project", order: 0 },
        pluginInput: {
          directory: "/workspace",
          worktree: "/workspace",
          hasDollar: true,
          hasWorkspaceRegister: true,
          options: { enabled: true, mode: "test" },
        },
        beforeCleanup: [
          "workspace:sample-plugin",
          "plugin:/workspace:enabled,mode",
          "config:model,theme",
          "registry:sample-plugin:chat.message,config,tool",
          "permission:sample-plugin:chat.message,config,tool",
          "event:sample-plugin:chat.message,config,tool",
        ],
        afterCleanup: [
          "workspace:sample-plugin",
          "plugin:/workspace:enabled,mode",
          "config:model,theme",
          "registry:sample-plugin:chat.message,config,tool",
          "permission:sample-plugin:chat.message,config,tool",
          "event:sample-plugin:chat.message,config,tool",
          "cleanup:event:sample-plugin",
          "cleanup:permission:sample-plugin",
          "cleanup:registry:sample-plugin",
        ],
      },
    },
    {
      id: "manifest-fallback-source",
      actual: {
        source: serializableSource(fallbackScope.source),
        events: fallbackEvents,
      },
      expected: {
        source: { id: "namedPlugin", scope: "project", order: 0 },
        events: [
          "workspace:namedPlugin",
          "registry:namedPlugin:event",
          "permission:namedPlugin:event",
          "event:namedPlugin:event",
        ],
      },
    },
    {
      id: "no-config-hook-registration",
      actual: noConfigEvents,
      expected: [
        "workspace:no-config",
        "registry:no-config:tool.execute.before",
        "permission:no-config:tool.execute.before",
        "event:no-config:tool.execute.before",
      ],
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.plugin.loader" as const,
    portID: "hook.bus" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-plugin-loader-native-exact-fixture" as const,
    replayRef: "plugin-loader-native-exact:opencode" as const,
    fixtureID: "opencode-plugin-loader:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/plugin/src/index.ts#Plugin,PluginInput,PluginOptions,Hooks.config",
      "anomalyco/opencode:packages/core/src/plugin.ts#Plugin.add,Plugin.trigger,Plugin.remove",
      "anomalyco/opencode:packages/core/src/plugin/boot.ts#PluginBoot.add,PluginBoot.boot",
      "helix:packages/adapters-opencode/src/plugin-atoms.ts#createOpenCodePluginLoaderAtom",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodePluginLoaderFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodePluginLoaderNativeExactFixture(
  fixture: OpenCodePluginLoaderNativeExactFixture,
): OpenCodePluginLoaderNativeExactFixtureVerification {
  const issues: OpenCodePluginLoaderNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-loader.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.loader" || fixture.portID !== "hook.bus") {
    add("opencode-plugin-loader.target", "Fixture must target opencode.plugin.loader and hook.bus.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-plugin-loader.native-claim", "Plugin loader fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-plugin-loader.lossiness", "Native plugin loader fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/plugin/src/index.ts",
    "packages/core/src/plugin.ts",
    "packages/core/src/plugin/boot.ts",
    "packages/adapters-opencode/src/plugin-atoms.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-loader.source-ref", `Missing source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginLoaderSameJSON(item.actual, item.expected)) {
      add("opencode-plugin-loader.case", "Case actual output must match expected pinned plugin loader behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginLoaderFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-loader.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function fixtureBridge(name: string, events: string[]): OpenCodeNativePluginRegistrationBridge {
  return {
    register({ scope, hooks }) {
      events.push(`${name}:${scope.source.id}:${Object.keys(hooks).sort().join(",")}`)
      scope.addCleanup(() => {
        events.push(`cleanup:${name}:${scope.source.id}`)
      })
    },
  }
}

function fixtureWorkspaceBridge(events: string[]): OpenCodeNativePluginWorkspaceBridge {
  return {
    withWorkspace({ source, pluginInput }) {
      events.push(`workspace:${source.id}`)
      return {
        ...pluginInput,
        $: pluginInput.$ ?? (async () => ({ command: "", stdout: "", stderr: "", exitCode: 0, text: () => "" })),
        experimental_workspace: pluginInput.experimental_workspace ?? {
          register() {
            return undefined
          },
        },
      }
    },
  }
}

function serializableSource(source: HookSourceInfo): unknown {
  return {
    id: source.id,
    ...(source.path ? { path: source.path } : {}),
    ...(source.scope ? { scope: source.scope } : {}),
    order: source.order,
  }
}

function openCodePluginLoaderSameJSON(left: unknown, right: unknown): boolean {
  return openCodePluginLoaderStableJSON(left) === openCodePluginLoaderStableJSON(right)
}

function openCodePluginLoaderFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodePluginLoaderStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodePluginLoaderStableJSON(value: unknown): string {
  return JSON.stringify(openCodePluginLoaderSortStable(value))
}

function openCodePluginLoaderSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodePluginLoaderSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodePluginLoaderSortStable(entry)]),
  )
}
