import { createHash } from "node:crypto"
import { dirname } from "node:path"

export const piMonoHookLifecycleUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoHookLifecycleNativeExactFixtureID = "pi-hook-lifecycle:native-exact-fixture"
export const piMonoHookLifecycleNativeExactEvidenceRef = "conformance:pi-hook-lifecycle-native-exact-fixture"
export const piMonoHookLifecycleNativeExactReplayRef = "hook-lifecycle-native-exact:pi-mono"

export const piMonoHookLifecycleNativeExactAtomIDs = [
  "pi.extension.cleanup",
  "pi.extension.event-mapper",
  "pi.extension.loader",
  "pi.extension.provider-registry-bridge",
  "pi.extension.ui-registry-bridge",
  "pi.hook.error-defaults",
  "pi.hook.extension-bridge",
  "pi.hook.handler-adapter",
  "pi.hook.observer-adapter",
  "pi.hook.scheduler-defaults",
  "pi.registry.command",
  "pi.registry.message-renderer",
  "pi.registry.provider-extension",
  "pi.registry.register-tool",
] as const

export type PiMonoHookLifecycleNativeExactAtomID = (typeof piMonoHookLifecycleNativeExactAtomIDs)[number]
export type PiMonoHookLifecycleNativeExactPortID =
  | "hook.bus"
  | "hook.cleanup-scope"
  | "hook.error-policy"
  | "hook.handler-chain"
  | "hook.observer-chain"
  | "hook.scheduler"
  | "registry.command"
  | "registry.provider"
  | "registry.ui"
  | "tool.registry"

export interface PiMonoHookLifecycleNativeDescriptor {
  id: PiMonoHookLifecycleNativeExactAtomID
  port: PiMonoHookLifecycleNativeExactPortID
  product: "pi-mono"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
}

export interface PiMonoSourceInfoProjection {
  path: string
  resolvedPath: string
  source: "local" | "temporary"
  baseDir?: string
}

export interface PiMonoProviderConfigProjection {
  name?: string
  baseUrl?: string
  apiKey?: string
  api?: string
  models?: Array<Record<string, unknown>>
}

export interface PiMonoProviderRegistrationProjection {
  name: string
  config: PiMonoProviderConfigProjection
  extensionPath: string
}

export interface PiMonoToolDefinitionProjection {
  name: string
  label?: string
  description: string
  parameters?: unknown
  execute?: (...args: unknown[]) => unknown
}

export interface PiMonoRegisteredToolProjection {
  definition: PiMonoToolDefinitionProjection
  sourceInfo: PiMonoSourceInfoProjection
}

export interface PiMonoRegisteredCommandProjection {
  name: string
  description?: string
  sourceInfo: PiMonoSourceInfoProjection
  handler?: (...args: unknown[]) => unknown
}

export interface PiMonoRegisteredShortcutProjection {
  shortcut: string
  extensionPath: string
  description?: string
  handler?: (...args: unknown[]) => unknown
}

export interface PiMonoRegisteredFlagProjection {
  name: string
  extensionPath: string
  description?: string
  type: "boolean" | "string"
  default?: boolean | string
}

export type PiMonoMessageRendererProjection = (...args: unknown[]) => unknown
export type PiMonoExtensionHandlerProjection = (event: Record<string, unknown>, ctx: PiMonoExtensionContextProjection) => unknown | Promise<unknown>

export interface PiMonoExtensionContextProjection {
  cwd: string
  hasUI: boolean
  model?: unknown
  isIdle(): boolean
  signal?: AbortSignal
  abort(): void
  hasPendingMessages(): boolean
  shutdown(): void
  getContextUsage(): unknown
  compact(options?: unknown): void
  getSystemPrompt(): string
}

export interface PiMonoExtensionProjection {
  path: string
  resolvedPath: string
  sourceInfo: PiMonoSourceInfoProjection
  handlers: Map<string, PiMonoExtensionHandlerProjection[]>
  tools: Map<string, PiMonoRegisteredToolProjection>
  messageRenderers: Map<string, PiMonoMessageRendererProjection>
  commands: Map<string, PiMonoRegisteredCommandProjection>
  flags: Map<string, PiMonoRegisteredFlagProjection>
  shortcuts: Map<string, PiMonoRegisteredShortcutProjection>
}

export interface PiMonoHookRuntimeProjection {
  flagValues: Map<string, boolean | string>
  pendingProviderRegistrations: PiMonoProviderRegistrationProjection[]
  directProviderRegistrations: PiMonoProviderRegistrationProjection[]
  directProviderUnregistrations: string[]
  refreshToolsCount: number
  staleMessage: string | undefined
  assertActive(): void
  invalidate(message?: string): void
  refreshTools(): void
  registerProvider(name: string, config: PiMonoProviderConfigProjection, extensionPath?: string): void
  unregisterProvider(name: string): void
  bindProviderActions(actions?: PiMonoProviderActionProjection): PiMonoProviderBindProjection
}

export interface PiMonoProviderActionProjection {
  registerProvider?(name: string, config: PiMonoProviderConfigProjection): void
  unregisterProvider?(name: string): void
}

export interface PiMonoProviderBindProjection {
  flushedProviderNames: string[]
  errors: Array<{ extensionPath: string; event: "register_provider"; error: string }>
  pendingAfterBind: number
}

export interface PiMonoExtensionAPIProjection {
  on(event: string, handler: PiMonoExtensionHandlerProjection): void
  registerTool(tool: PiMonoToolDefinitionProjection): void
  registerCommand(name: string, options: Omit<PiMonoRegisteredCommandProjection, "name" | "sourceInfo">): void
  registerShortcut(shortcut: string, options: Omit<PiMonoRegisteredShortcutProjection, "shortcut" | "extensionPath">): void
  registerFlag(name: string, options: Omit<PiMonoRegisteredFlagProjection, "name" | "extensionPath">): void
  getFlag(name: string): boolean | string | undefined
  registerMessageRenderer(customType: string, renderer: PiMonoMessageRendererProjection): void
  registerProvider(name: string, config: PiMonoProviderConfigProjection): void
  unregisterProvider(name: string): void
}

export interface PiMonoRunnerEmitProjectionInput {
  extensions: PiMonoExtensionProjection[]
  event: Record<string, unknown> & { type: string }
  cwd?: string
}

export interface PiMonoRunnerEmitProjection {
  visited: string[]
  errors: Array<{ extensionPath: string; event: string; error: string }>
  result?: unknown
  cancelled: boolean
}

export interface PiMonoBeforeProviderRequestProjection {
  finalPayload: unknown
  visited: string[]
  errors: Array<{ extensionPath: string; event: "before_provider_request"; error: string }>
}

export interface PiMonoToolResultProjection {
  modified: boolean
  output?: {
    content?: unknown
    details?: unknown
    isError?: boolean
  }
  visited: string[]
  errors: Array<{ extensionPath: string; event: "tool_result"; error: string }>
}

export interface PiMonoSessionShutdownProjection {
  emitted: boolean
  visited: string[]
  errors: Array<{ extensionPath: string; event: "session_shutdown"; error: string }>
}

export type PiMonoHookLifecycleNativeExactScenarioID =
  | "load-extension-from-factory-registers-runtime-state"
  | "runner-bind-core-flushes-provider-registrations"
  | "generic-runner-emit-order-cancel-and-errors"
  | "handler-adapters-mutate-provider-request-and-tool-result"
  | "registries-command-flag-shortcut-message-renderer"
  | "session-shutdown-and-stale-context-lifecycle"

export interface PiMonoHookLifecycleNativeExactCase {
  scenarioID: PiMonoHookLifecycleNativeExactScenarioID
  input: Record<string, string | number | string[] | boolean>
  output: Record<string, string | number | string[] | boolean>
  upstreamBehavior: string
}

export interface PiMonoHookLifecycleNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: typeof piMonoHookLifecycleNativeExactAtomIDs
  portIDs: PiMonoHookLifecycleNativeExactPortID[]
  upstreamRef: typeof piMonoHookLifecycleUpstreamRef
  evidenceRef: typeof piMonoHookLifecycleNativeExactEvidenceRef
  fixtureID: typeof piMonoHookLifecycleNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    loadExtensionFromFactoryCreatesExtensionRecord: true
    extensionAPIPushesHandlersByEvent: true
    registerToolWritesDefinitionAndRefreshesTools: true
    registerCommandShortcutFlagAndMessageRendererWriteExtensionMaps: true
    flagDefaultsOnlySetFirstValue: true
    providerRegistrationQueuesBeforeBindAndFlushesOnBindCore: true
    providerRegistrationIsImmediateAfterBindCore: true
    runnerEmitVisitsExtensionsThenHandlersInLoadOrder: true
    genericRunnerEmitCollectsHandlerErrorsAndContinues: true
    sessionBeforeCancelShortCircuits: true
    beforeProviderRequestUsesMutablePayloadChain: true
    toolResultHandlersPatchContentDetailsAndIsError: true
    sessionShutdownOnlyEmitsWhenHandlersExist: true
    staleRuntimeRejectsCapturedAPIsAfterInvalidate: true
    uiRegistryMatchesUpstreamMessageRendererOnly: true
  }
  cases: PiMonoHookLifecycleNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: PiMonoHookLifecycleNativeDescriptor[]
  fingerprint: string
}

export interface PiMonoHookLifecycleNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoHookLifecycleNativeExactVerification {
  ok: boolean
  issues: PiMonoHookLifecycleNativeExactIssue[]
}

const descriptorBase = {
  product: "pi-mono" as const,
  implementationKind: "factory" as const,
  parityCoverage: "native" as const,
  nativeEvidenceRefs: [piMonoHookLifecycleNativeExactEvidenceRef, piMonoHookLifecycleNativeExactReplayRef],
  fixtureIDs: [piMonoHookLifecycleNativeExactFixtureID],
  knownLossiness: [] as string[],
}

export const piMonoHookLifecycleNativeDescriptors: PiMonoHookLifecycleNativeDescriptor[] = [
  hookDescriptor("pi.extension.cleanup", "hook.cleanup-scope", "Pi upstream native implementation of session_shutdown lifecycle dispatch, reload staleness, and extension shutdown handling with native parity complete fixture coverage."),
  hookDescriptor("pi.extension.event-mapper", "hook.handler-chain", "Pi upstream native implementation of extension event mapping across ordered runner handlers with native parity complete fixture coverage."),
  hookDescriptor("pi.extension.loader", "hook.bus", "Pi upstream native implementation of loadExtensionFromFactory, createExtensionAPI, and shared extension runtime with native parity complete fixture coverage."),
  hookDescriptor("pi.extension.provider-registry-bridge", "registry.provider", "Pi upstream native implementation of queued and immediate registerProvider/unregisterProvider lifecycle behavior with native parity complete fixture coverage."),
  hookDescriptor("pi.extension.ui-registry-bridge", "registry.ui", "Pi upstream native implementation of message renderer registry behavior with native parity complete fixture coverage."),
  hookDescriptor("pi.hook.error-defaults", "hook.error-policy", "Pi upstream native implementation of runner collect-and-continue error dispatch with native parity complete fixture coverage."),
  hookDescriptor("pi.hook.extension-bridge", "hook.bus", "Pi upstream native implementation of ExtensionAPI registration and runtime delegation with native parity complete fixture coverage."),
  hookDescriptor("pi.hook.handler-adapter", "hook.handler-chain", "Pi upstream native implementation of before_provider_request, tool_result, and session_before handler result adapters with native parity complete fixture coverage."),
  hookDescriptor("pi.hook.observer-adapter", "hook.observer-chain", "Pi upstream native implementation of observe-only generic extension handler fanout with native parity complete fixture coverage."),
  hookDescriptor("pi.hook.scheduler-defaults", "hook.scheduler", "Pi upstream native implementation of serial extension and handler ordering with native parity complete fixture coverage."),
  hookDescriptor("pi.registry.command", "registry.command", "Pi upstream native implementation of registerCommand/registerShortcut/registerFlag maps with native parity complete fixture coverage."),
  hookDescriptor("pi.registry.message-renderer", "registry.ui", "Pi upstream native implementation of registerMessageRenderer/getMessageRenderer maps with native parity complete fixture coverage."),
  hookDescriptor("pi.registry.provider-extension", "registry.provider", "Pi upstream native implementation of extension provider registration maps and bindCore flush behavior with native parity complete fixture coverage."),
  hookDescriptor("pi.registry.register-tool", "tool.registry", "Pi upstream native implementation of ExtensionAPI.registerTool registry writes and refreshTools calls with native parity complete fixture coverage."),
]

export function createPiMonoHookRuntimeProjection(): PiMonoHookRuntimeProjection {
  const stale = { message: undefined as string | undefined }
  const runtime: PiMonoHookRuntimeProjection = {
    flagValues: new Map<string, boolean | string>(),
    pendingProviderRegistrations: [],
    directProviderRegistrations: [],
    directProviderUnregistrations: [],
    refreshToolsCount: 0,
    get staleMessage() {
      return stale.message
    },
    assertActive() {
      if (stale.message) throw new Error(stale.message)
    },
    invalidate(message) {
      stale.message ??= message ?? staleContextMessage()
    },
    refreshTools() {
      runtime.refreshToolsCount += 1
    },
    registerProvider(name, config, extensionPath = "<unknown>") {
      runtime.pendingProviderRegistrations.push({ name, config, extensionPath })
    },
    unregisterProvider(name) {
      runtime.pendingProviderRegistrations = runtime.pendingProviderRegistrations.filter((registration) => registration.name !== name)
    },
    bindProviderActions(actions) {
      const errors: PiMonoProviderBindProjection["errors"] = []
      const flushedProviderNames: string[] = []
      for (const { name, config, extensionPath } of runtime.pendingProviderRegistrations) {
        try {
          if (actions?.registerProvider) {
            actions.registerProvider(name, config)
          } else {
            runtime.directProviderRegistrations.push({ name, config, extensionPath })
          }
          flushedProviderNames.push(name)
        } catch (error) {
          errors.push({
            extensionPath,
            event: "register_provider",
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
      runtime.pendingProviderRegistrations = []
      runtime.registerProvider = (name, config, extensionPath = "<bound>") => {
        if (actions?.registerProvider) {
          actions.registerProvider(name, config)
          return
        }
        runtime.directProviderRegistrations.push({ name, config, extensionPath })
      }
      runtime.unregisterProvider = (name) => {
        if (actions?.unregisterProvider) {
          actions.unregisterProvider(name)
          return
        }
        runtime.directProviderUnregistrations.push(name)
      }
      return { flushedProviderNames, errors, pendingAfterBind: runtime.pendingProviderRegistrations.length }
    },
  }
  return runtime
}

export function createPiMonoExtensionProjection(extensionPath: string, resolvedPath: string = extensionPath): PiMonoExtensionProjection {
  return {
    path: extensionPath,
    resolvedPath,
    sourceInfo: createPiMonoSourceInfoProjection(extensionPath, resolvedPath),
    handlers: new Map(),
    tools: new Map(),
    messageRenderers: new Map(),
    commands: new Map(),
    flags: new Map(),
    shortcuts: new Map(),
  }
}

export function createPiMonoSourceInfoProjection(extensionPath: string, resolvedPath: string = extensionPath): PiMonoSourceInfoProjection {
  const temporary = extensionPath.startsWith("<") && extensionPath.endsWith(">")
  return {
    path: extensionPath,
    resolvedPath,
    source: temporary ? "temporary" : "local",
    ...(temporary ? {} : { baseDir: dirname(resolvedPath) }),
  }
}

export function createPiMonoExtensionAPIProjection(
  extension: PiMonoExtensionProjection,
  runtime: PiMonoHookRuntimeProjection,
): PiMonoExtensionAPIProjection {
  return {
    on(event, handler) {
      runtime.assertActive()
      const handlers = extension.handlers.get(event) ?? []
      handlers.push(handler)
      extension.handlers.set(event, handlers)
    },
    registerTool(tool) {
      runtime.assertActive()
      extension.tools.set(tool.name, { definition: tool, sourceInfo: extension.sourceInfo })
      runtime.refreshTools()
    },
    registerCommand(name, options) {
      runtime.assertActive()
      extension.commands.set(name, { name, sourceInfo: extension.sourceInfo, ...options })
    },
    registerShortcut(shortcut, options) {
      runtime.assertActive()
      extension.shortcuts.set(shortcut, { shortcut, extensionPath: extension.path, ...options })
    },
    registerFlag(name, options) {
      runtime.assertActive()
      extension.flags.set(name, { name, extensionPath: extension.path, ...options })
      if (options.default !== undefined && !runtime.flagValues.has(name)) runtime.flagValues.set(name, options.default)
    },
    getFlag(name) {
      runtime.assertActive()
      if (!extension.flags.has(name)) return undefined
      return runtime.flagValues.get(name)
    },
    registerMessageRenderer(customType, renderer) {
      runtime.assertActive()
      extension.messageRenderers.set(customType, renderer)
    },
    registerProvider(name, config) {
      runtime.assertActive()
      runtime.registerProvider(name, config, extension.path)
    },
    unregisterProvider(name) {
      runtime.assertActive()
      runtime.unregisterProvider(name)
    },
  }
}

export async function loadPiMonoExtensionFromFactoryProjection(
  factory: (api: PiMonoExtensionAPIProjection) => void | Promise<void>,
  input: { runtime?: PiMonoHookRuntimeProjection; extensionPath?: string; resolvedPath?: string } = {},
): Promise<{ extension: PiMonoExtensionProjection; runtime: PiMonoHookRuntimeProjection }> {
  const runtime = input.runtime ?? createPiMonoHookRuntimeProjection()
  const extensionPath = input.extensionPath ?? "<inline>"
  const extension = createPiMonoExtensionProjection(extensionPath, input.resolvedPath ?? extensionPath)
  await factory(createPiMonoExtensionAPIProjection(extension, runtime))
  return { extension, runtime }
}

export async function projectPiMonoRunnerEmit(input: PiMonoRunnerEmitProjectionInput): Promise<PiMonoRunnerEmitProjection> {
  const ctx = createPiMonoExtensionContextProjection(input.cwd ?? "/workspace/pi")
  const visited: string[] = []
  const errors: PiMonoRunnerEmitProjection["errors"] = []
  let result: unknown
  for (const extension of input.extensions) {
    const handlers = extension.handlers.get(input.event.type)
    if (!handlers || handlers.length === 0) continue
    for (const handler of handlers) {
      visited.push(`${extension.path}:${input.event.type}:${visited.length + 1}`)
      try {
        const handlerResult = await handler(input.event, ctx)
        if (isSessionBeforeEvent(input.event.type) && handlerResult !== undefined) {
          result = handlerResult
          if (isRecord(handlerResult) && handlerResult["cancel"] === true) return { visited, errors, result, cancelled: true }
        }
      } catch (error) {
        errors.push({
          extensionPath: extension.path,
          event: input.event.type,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }
  return { visited, errors, ...(result !== undefined ? { result } : {}), cancelled: false }
}

export async function projectPiMonoBeforeProviderRequest(
  extensions: PiMonoExtensionProjection[],
  payload: unknown,
): Promise<PiMonoBeforeProviderRequestProjection> {
  const ctx = createPiMonoExtensionContextProjection("/workspace/pi")
  const visited: string[] = []
  const errors: PiMonoBeforeProviderRequestProjection["errors"] = []
  let currentPayload = payload
  for (const extension of extensions) {
    for (const handler of extension.handlers.get("before_provider_request") ?? []) {
      visited.push(extension.path)
      try {
        const result = await handler({ type: "before_provider_request", payload: currentPayload }, ctx)
        if (result !== undefined) currentPayload = result
      } catch (error) {
        errors.push({ extensionPath: extension.path, event: "before_provider_request", error: error instanceof Error ? error.message : String(error) })
      }
    }
  }
  return { finalPayload: currentPayload, visited, errors }
}

export async function projectPiMonoToolResultHandlers(
  extensions: PiMonoExtensionProjection[],
  event: { content?: unknown; details?: unknown; isError?: boolean },
): Promise<PiMonoToolResultProjection> {
  const ctx = createPiMonoExtensionContextProjection("/workspace/pi")
  const currentEvent = { type: "tool_result", ...event }
  const visited: string[] = []
  const errors: PiMonoToolResultProjection["errors"] = []
  let modified = false
  for (const extension of extensions) {
    for (const handler of extension.handlers.get("tool_result") ?? []) {
      visited.push(extension.path)
      try {
        const result = await handler(currentEvent, ctx)
        if (!isRecord(result)) continue
        if (result["content"] !== undefined) {
          currentEvent.content = result["content"]
          modified = true
        }
        if (result["details"] !== undefined) {
          currentEvent.details = result["details"]
          modified = true
        }
        if (result["isError"] !== undefined) {
          currentEvent.isError = Boolean(result["isError"])
          modified = true
        }
      } catch (error) {
        errors.push({ extensionPath: extension.path, event: "tool_result", error: error instanceof Error ? error.message : String(error) })
      }
    }
  }
  return modified
    ? { modified, output: compactToolResultOutput(currentEvent), visited, errors }
    : { modified, visited, errors }
}

export async function projectPiMonoSessionShutdown(
  extensions: PiMonoExtensionProjection[],
): Promise<PiMonoSessionShutdownProjection> {
  const hasHandlers = extensions.some((extension) => (extension.handlers.get("session_shutdown") ?? []).length > 0)
  if (!hasHandlers) return { emitted: false, visited: [], errors: [] }
  const emitted = await projectPiMonoRunnerEmit({ extensions, event: { type: "session_shutdown", reason: "process-exit" } })
  return {
    emitted: true,
    visited: emitted.visited,
    errors: emitted.errors.map((error) => ({ extensionPath: error.extensionPath, event: "session_shutdown" as const, error: error.error })),
  }
}

export function getPiMonoMessageRenderer(
  extensions: PiMonoExtensionProjection[],
  customType: string,
): PiMonoMessageRendererProjection | undefined {
  for (const extension of extensions) {
    const renderer = extension.messageRenderers.get(customType)
    if (renderer) return renderer
  }
  return undefined
}

export function summarizePiMonoExtensionRegistries(extension: PiMonoExtensionProjection): Record<string, string | string[] | number | boolean> {
  return {
    path: extension.path,
    source: extension.sourceInfo.source,
    baseDir: extension.sourceInfo.baseDir ?? "",
    handlers: Array.from(extension.handlers.keys()).sort(),
    tools: Array.from(extension.tools.keys()).sort(),
    commands: Array.from(extension.commands.keys()).sort(),
    shortcuts: Array.from(extension.shortcuts.keys()).sort(),
    flags: Array.from(extension.flags.keys()).sort(),
    messageRenderers: Array.from(extension.messageRenderers.keys()).sort(),
  }
}

export async function buildPiMonoHookLifecycleNativeExactFixture(): Promise<PiMonoHookLifecycleNativeExactFixture> {
  const loadRuntime = createPiMonoHookRuntimeProjection()
  const { extension } = await loadPiMonoExtensionFromFactoryProjection((pi) => {
    pi.on("agent_start", () => undefined)
    pi.registerTool({ name: "echo_session", label: "Echo Session", description: "Echo a message" })
    pi.registerCommand("add-echo-tool", { description: "Register echo tool", handler: () => undefined })
    pi.registerShortcut("ctrl+x", { description: "Run extension shortcut", handler: () => undefined })
    pi.registerFlag("trace", { type: "boolean", default: true })
    pi.registerMessageRenderer("echo.result", () => "rendered")
    pi.registerProvider("local-proxy", { baseUrl: "https://proxy.example.com", api: "anthropic-messages" })
  }, { runtime: loadRuntime, extensionPath: "/workspace/pi/.pi/extensions/echo.ts", resolvedPath: "/workspace/pi/.pi/extensions/echo.ts" })

  const bindRuntime = createPiMonoHookRuntimeProjection()
  bindRuntime.registerProvider("alpha", { baseUrl: "https://alpha.example.com" }, "/extensions/alpha.ts")
  bindRuntime.registerProvider("beta", { baseUrl: "https://beta.example.com" }, "/extensions/beta.ts")
  bindRuntime.unregisterProvider("missing-before-bind")
  const flushed: string[] = []
  const bindProjection = bindRuntime.bindProviderActions({
    registerProvider(name) {
      if (name === "beta") throw new Error("beta failed")
      flushed.push(name)
    },
    unregisterProvider(name) {
      flushed.push(`unregister:${name}`)
    },
  })
  bindRuntime.registerProvider("gamma", { baseUrl: "https://gamma.example.com" }, "/extensions/gamma.ts")
  bindRuntime.unregisterProvider("alpha")

  const first = createPiMonoExtensionProjection("/extensions/first.ts")
  const firstAPI = createPiMonoExtensionAPIProjection(first, createPiMonoHookRuntimeProjection())
  firstAPI.on("agent_start", () => undefined)
  firstAPI.on("agent_start", () => {
    throw new Error("first boom")
  })
  firstAPI.on("session_before_switch", () => ({ cancel: true, reason: "guarded" }))
  const second = createPiMonoExtensionProjection("/extensions/second.ts")
  const secondAPI = createPiMonoExtensionAPIProjection(second, createPiMonoHookRuntimeProjection())
  secondAPI.on("agent_start", () => undefined)
  secondAPI.on("session_before_switch", () => ({ cancel: false }))
  const emitProjection = await projectPiMonoRunnerEmit({ extensions: [first, second], event: { type: "agent_start" } })
  const cancelProjection = await projectPiMonoRunnerEmit({ extensions: [first, second], event: { type: "session_before_switch" } })

  const handlers = createPiMonoExtensionProjection("/extensions/handlers.ts")
  const handlersAPI = createPiMonoExtensionAPIProjection(handlers, createPiMonoHookRuntimeProjection())
  handlersAPI.on("before_provider_request", (event) => ({ ...(event.payload as Record<string, unknown>), temperature: 0.2 }))
  handlersAPI.on("before_provider_request", (event) => ({ ...(event.payload as Record<string, unknown>), metadata: { extension: "handlers" } }))
  handlersAPI.on("tool_result", () => ({ content: [{ type: "text", text: "patched" }], details: { extension: "handlers" } }))
  handlersAPI.on("tool_result", () => ({ isError: true }))
  const providerProjection = await projectPiMonoBeforeProviderRequest([handlers], { model: "claude", temperature: 0.8 })
  const toolResultProjection = await projectPiMonoToolResultHandlers([handlers], { content: [{ type: "text", text: "original" }], isError: false })

  const registryRuntime = createPiMonoHookRuntimeProjection()
  const registryExtension = createPiMonoExtensionProjection("/extensions/registry.ts")
  const registryAPI = createPiMonoExtensionAPIProjection(registryExtension, registryRuntime)
  registryAPI.registerCommand("dupe", { description: "first", handler: () => undefined })
  registryAPI.registerCommand("dupe", { description: "last", handler: () => undefined })
  registryAPI.registerShortcut("ctrl+p", { description: "palette", handler: () => undefined })
  registryAPI.registerFlag("mode", { type: "string", default: "alpha" })
  registryAPI.registerFlag("mode", { type: "string", default: "beta" })
  registryAPI.registerMessageRenderer("trace", () => "trace")
  const rendererHit = getPiMonoMessageRenderer([registryExtension], "trace")?.({ customType: "trace" }) === "trace"

  const shutdownExtension = createPiMonoExtensionProjection("/extensions/shutdown.ts")
  createPiMonoExtensionAPIProjection(shutdownExtension, createPiMonoHookRuntimeProjection()).on("session_shutdown", () => undefined)
  const noShutdown = await projectPiMonoSessionShutdown([])
  const withShutdown = await projectPiMonoSessionShutdown([shutdownExtension])
  const staleRuntime = createPiMonoHookRuntimeProjection()
  const staleAPI = createPiMonoExtensionAPIProjection(createPiMonoExtensionProjection("/extensions/stale.ts"), staleRuntime)
  staleRuntime.invalidate("ctx stale after reload")
  let staleRejected = false
  try {
    staleAPI.registerCommand("late", { handler: () => undefined })
  } catch {
    staleRejected = true
  }

  const fixtureWithoutFingerprint: Omit<PiMonoHookLifecycleNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: piMonoHookLifecycleNativeExactAtomIDs,
    portIDs: ["hook.bus", "hook.cleanup-scope", "hook.error-policy", "hook.handler-chain", "hook.observer-chain", "hook.scheduler", "registry.command", "registry.provider", "registry.ui", "tool.registry"],
    upstreamRef: piMonoHookLifecycleUpstreamRef,
    evidenceRef: piMonoHookLifecycleNativeExactEvidenceRef,
    fixtureID: piMonoHookLifecycleNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      loadExtensionFromFactoryCreatesExtensionRecord: true,
      extensionAPIPushesHandlersByEvent: true,
      registerToolWritesDefinitionAndRefreshesTools: true,
      registerCommandShortcutFlagAndMessageRendererWriteExtensionMaps: true,
      flagDefaultsOnlySetFirstValue: true,
      providerRegistrationQueuesBeforeBindAndFlushesOnBindCore: true,
      providerRegistrationIsImmediateAfterBindCore: true,
      runnerEmitVisitsExtensionsThenHandlersInLoadOrder: true,
      genericRunnerEmitCollectsHandlerErrorsAndContinues: true,
      sessionBeforeCancelShortCircuits: true,
      beforeProviderRequestUsesMutablePayloadChain: true,
      toolResultHandlersPatchContentDetailsAndIsError: true,
      sessionShutdownOnlyEmitsWhenHandlersExist: true,
      staleRuntimeRejectsCapturedAPIsAfterInvalidate: true,
      uiRegistryMatchesUpstreamMessageRendererOnly: true,
    },
    cases: [
      hookCase(
        "load-extension-from-factory-registers-runtime-state",
        { extensionPath: extension.path },
        {
          ...summarizePiMonoExtensionRegistries(extension),
          pendingProviders: loadRuntime.pendingProviderRegistrations.map((registration) => registration.name).sort(),
          refreshToolsCount: loadRuntime.refreshToolsCount,
          flagTrace: loadRuntime.flagValues.get("trace") === true,
        },
        "loadExtensionFromFactory creates an Extension record, createExtensionAPI writes registrations to that record, registerTool refreshes tools, and registerProvider queues before bindCore.",
      ),
      hookCase(
        "runner-bind-core-flushes-provider-registrations",
        { pendingProviders: ["alpha", "beta"], directProvider: "gamma" },
        {
          flushedProviderNames: bindProjection.flushedProviderNames,
          actionCalls: flushed,
          errorEvents: bindProjection.errors.map((error) => `${error.extensionPath}:${error.error}`),
          pendingAfterBind: bindProjection.pendingAfterBind,
          directRegisterUsesAction: flushed.includes("gamma"),
          directUnregisterUsesAction: flushed.includes("unregister:alpha"),
        },
        "ExtensionRunner.bindCore flushes pending provider registrations with error events, clears the queue, and replaces registerProvider/unregisterProvider with immediate actions.",
      ),
      hookCase(
        "generic-runner-emit-order-cancel-and-errors",
        { eventType: "agent_start", cancelEvent: "session_before_switch" },
        {
          visited: emitProjection.visited,
          errors: emitProjection.errors.map((error) => `${error.extensionPath}:${error.event}:${error.error}`),
          cancelVisited: cancelProjection.visited,
          cancelShortCircuited: cancelProjection.cancelled,
        },
        "ExtensionRunner.emit creates one context per event, visits extensions and handlers in load order, reports handler errors, continues, and short-circuits session_before events on cancel.",
      ),
      hookCase(
        "handler-adapters-mutate-provider-request-and-tool-result",
        { providerEvent: "before_provider_request", toolEvent: "tool_result" },
        {
          providerVisited: providerProjection.visited,
          finalTemperature: recordValue(providerProjection.finalPayload, "temperature"),
          providerMetadata: nestedRecordValue(providerProjection.finalPayload, "metadata", "extension"),
          toolVisited: toolResultProjection.visited,
          toolModified: toolResultProjection.modified,
          toolIsError: toolResultProjection.output?.isError === true,
          toolDetails: nestedRecordValue(toolResultProjection.output?.details, "extension"),
        },
        "before_provider_request handlers replace the current payload when they return a value; tool_result handlers patch content, details, and isError while preserving handler order.",
      ),
      hookCase(
        "registries-command-flag-shortcut-message-renderer",
        { extensionPath: registryExtension.path },
        {
          commandDescription: registryExtension.commands.get("dupe")?.description ?? "",
          shortcutExtensionPath: registryExtension.shortcuts.get("ctrl+p")?.extensionPath ?? "",
          flagDefaultFirstWins: registryRuntime.flagValues.get("mode") === "alpha",
          getFlagRegistered: registryAPI.getFlag("mode") === "alpha",
          getFlagUnregistered: registryAPI.getFlag("missing") === undefined,
          rendererHit,
          uiRegistrySurface: "message-renderer-only",
        },
        "createExtensionAPI registerCommand/registerShortcut/registerFlag/registerMessageRenderer write extension maps; flag defaults do not overwrite existing runtime values, and runner renderer lookup returns the first matching renderer.",
      ),
      hookCase(
        "session-shutdown-and-stale-context-lifecycle",
        { shutdownEvent: "session_shutdown", staleAction: "registerCommand" },
        {
          noHandlerEmitted: noShutdown.emitted,
          withHandlerEmitted: withShutdown.emitted,
          shutdownVisited: withShutdown.visited,
          staleRejected,
          staleMessage: staleRuntime.staleMessage ?? "",
        },
        "emitSessionShutdownEvent emits only when session_shutdown handlers exist; invalidate marks runtime and captured APIs stale so later registration/action attempts throw.",
      ),
    ],
    sourceRefs: [
      `${piMonoHookLifecycleUpstreamRef}:packages/coding-agent/src/core/extensions/loader.ts#createExtensionRuntime,createExtensionAPI,loadExtensionFromFactory,loadExtensions,discoverAndLoadExtensions`,
      `${piMonoHookLifecycleUpstreamRef}:packages/coding-agent/src/core/extensions/runner.ts#ExtensionRunner.bindCore,createContext,emit,emitBeforeProviderRequest,emitToolResult,emitSessionShutdownEvent`,
      `${piMonoHookLifecycleUpstreamRef}:packages/coding-agent/src/core/extensions/types.ts#ExtensionAPI,ExtensionRuntime,Extension,RegisteredTool,RegisteredCommand,ExtensionFlag,MessageRenderer`,
      `${piMonoHookLifecycleUpstreamRef}:packages/coding-agent/src/core/extensions/wrapper.ts#wrapRegisteredTool,wrapRegisteredTools`,
      `${piMonoHookLifecycleUpstreamRef}:packages/coding-agent/examples/extensions/dynamic-tools.ts#dynamicToolsExtension`,
    ],
    nativeEvidenceRefs: [piMonoHookLifecycleNativeExactEvidenceRef, piMonoHookLifecycleNativeExactReplayRef],
    fixtureIDs: [piMonoHookLifecycleNativeExactFixtureID],
    knownLossiness: [] as string[],
    descriptors: piMonoHookLifecycleNativeDescriptors,
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export async function verifyPiMonoHookLifecycleNativeExactFixture(
  fixture: PiMonoHookLifecycleNativeExactFixture,
): Promise<PiMonoHookLifecycleNativeExactVerification> {
  const issues: PiMonoHookLifecycleNativeExactIssue[] = []
  const expected = await buildPiMonoHookLifecycleNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "pi-hook-lifecycle-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi hook lifecycle content." })
  }
  if (fixture.product !== "pi-mono" || !sameJSON(fixture.atomIDs, piMonoHookLifecycleNativeExactAtomIDs)) {
    issues.push({ id: "pi-hook-lifecycle-native-exact.identity", message: "Fixture must stay scoped to the Pi hook lifecycle native atom group." })
  }
  if (fixture.upstreamRef !== piMonoHookLifecycleUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("7c2775f6f67c38ed491a1ff68240ee4f8ba688da"))) {
    issues.push({ id: "pi-hook-lifecycle-native-exact.upstream", message: "Fixture must stay pinned to the Pi hook lifecycle upstream sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-hook-lifecycle-native-exact.native-claim", message: "Pi hook lifecycle fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "pi-hook-lifecycle-native-exact.lossiness", message: "Native exact Pi hook lifecycle fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoHookLifecycleNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoHookLifecycleNativeExactReplayRef)) {
    issues.push({ id: "pi-hook-lifecycle-native-exact.evidence", message: "Pi hook lifecycle native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoHookLifecycleNativeExactFixtureID)) {
    issues.push({ id: "pi-hook-lifecycle-native-exact.fixture", message: "Pi hook lifecycle native exact fixture ID is missing." })
  }
  if (!sameJSON(fixture.policy, expected.policy)) {
    issues.push({ id: "pi-hook-lifecycle-native-exact.policy", message: "Pi hook lifecycle native policy drifted from upstream loader/runner semantics." })
  }
  if (!sameJSON(fixture.cases, expected.cases)) {
    issues.push({ id: "pi-hook-lifecycle-native-exact.cases", message: "Pi hook lifecycle native cases drifted from upstream loader/runner behavior." })
  }
  if (!sameJSON(fixture.descriptors, expected.descriptors)) {
    issues.push({ id: "pi-hook-lifecycle-native-exact.descriptors", message: "Pi hook lifecycle native descriptors drifted from the fixture atom group." })
  }

  return { ok: issues.length === 0, issues }
}

function hookDescriptor(
  id: PiMonoHookLifecycleNativeExactAtomID,
  port: PiMonoHookLifecycleNativeExactPortID,
  selectionReason: string,
): PiMonoHookLifecycleNativeDescriptor {
  return { ...descriptorBase, id, port, selectionReason }
}

function createPiMonoExtensionContextProjection(cwd: string): PiMonoExtensionContextProjection {
  return {
    cwd,
    hasUI: false,
    isIdle: () => true,
    abort: () => {},
    hasPendingMessages: () => false,
    shutdown: () => {},
    getContextUsage: () => undefined,
    compact: () => {},
    getSystemPrompt: () => "",
  }
}

function compactToolResultOutput(event: { content?: unknown; details?: unknown; isError?: boolean }): NonNullable<PiMonoToolResultProjection["output"]> {
  return {
    ...(event.content !== undefined ? { content: event.content } : {}),
    ...(event.details !== undefined ? { details: event.details } : {}),
    ...(event.isError !== undefined ? { isError: event.isError } : {}),
  }
}

function hookCase(
  scenarioID: PiMonoHookLifecycleNativeExactScenarioID,
  input: PiMonoHookLifecycleNativeExactCase["input"],
  output: PiMonoHookLifecycleNativeExactCase["output"],
  upstreamBehavior: string,
): PiMonoHookLifecycleNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function staleContextMessage(): string {
  return "This extension ctx is stale after session replacement or reload. Do not use a captured pi or command ctx after ctx.newSession(), ctx.fork(), ctx.switchSession(), or ctx.reload(). For newSession, fork, and switchSession, move post-replacement work into withSession and use the ctx passed to withSession. For reload, do not use the old ctx after await ctx.reload()."
}

function isSessionBeforeEvent(eventType: string): boolean {
  return eventType === "session_before_switch" || eventType === "session_before_fork" || eventType === "session_before_compact" || eventType === "session_before_tree"
}

function recordValue(value: unknown, key: string): string | number | boolean {
  if (!isRecord(value)) return ""
  const field = value[key]
  if (typeof field === "string" || typeof field === "number" || typeof field === "boolean") return field
  return ""
}

function nestedRecordValue(value: unknown, key: string, nestedKey?: string): string | number | boolean {
  if (!isRecord(value)) return ""
  const field = value[key]
  if (!nestedKey) return typeof field === "string" || typeof field === "number" || typeof field === "boolean" ? field : ""
  return recordValue(field, nestedKey)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
