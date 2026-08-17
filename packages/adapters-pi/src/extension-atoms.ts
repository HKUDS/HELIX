import {
  adaptToolParameters,
  inferLegoBlockImplementationKind,
  type LegoBlockImplementationKind,
  type LegoMessage,
  type LegoToolDefinition,
  type SessionID,
  type SessionTranscript,
} from "@helix/contracts"
import type {
  CommandRegistration,
  EventNameAlias,
  FlagRegistration,
  HookContext,
  HookScope,
  LegoHookHost,
  ShortcutRegistration,
} from "@helix/lego-hooks"
import type { SessionInfo, SessionService } from "@helix/lego-session"
import type {
  PiExtension,
  PiExtensionAPI,
  PiExtensionContext,
  PiReadonlySessionManager,
  PiUIFacade,
} from "./extension-adapter"

export interface PiExtensionLoadInput {
  host: LegoHookHost
  extension: PiExtension
  source?: { id?: string; path?: string; scope?: string }
}

export interface PiExtensionManifestNormalizerAtom {
  normalize(input: { extension: PiExtension; source?: PiExtensionLoadInput["source"] }): { id: string; path?: string; scope: string }
}

export interface PiExtensionLoaderAtom {
  load(input: PiExtensionLoadInput): Promise<PiExtensionAPI>
}

export interface PiExtensionAPIFactoryAtom {
  create(input: { host: LegoHookHost; source: HookScope | { id: string; order?: number; path?: string; scope?: string } }): PiExtensionAPI
}

export interface PiExtensionEventMapperAtom {
  on(input: {
    scope: HookScope
    event: EventNameAlias | string
    handler: (event: unknown, ctx: PiExtensionContext) => unknown | Promise<unknown>
    toContext(ctx: HookContext): PiExtensionContext
  }): void
}

export interface PiDynamicToolBridgeAtom {
  registerTool(input: { host: LegoHookHost; scope: HookScope; tool: LegoToolDefinition }): void
  registerCommand(input: { host: LegoHookHost; scope: HookScope; name: string; options: Omit<CommandRegistration, "name" | "source"> }): void
  registerShortcut(input: { host: LegoHookHost; scope: HookScope; key: string; options: Omit<ShortcutRegistration, "key" | "source"> }): void
  registerFlag(input: { host: LegoHookHost; scope: HookScope; name: string; options: Omit<FlagRegistration, "name" | "source"> }): void
  registerProvider(input: { host: LegoHookHost; scope: HookScope; name: string; config: unknown }): void
  registerUIProvider(input: { host: LegoHookHost; scope: HookScope; name: string; provider: unknown }): void
  registerMessageRenderer(input: { host: LegoHookHost; scope: HookScope; customType: string; render: (...args: unknown[]) => unknown }): void
}

export interface PiRuntimeEventBridgeAtom {
  emit(input: { host: LegoHookHost; scope: HookScope; type: string; payload: unknown }): Promise<void>
}

export interface PiTypeBoxSchemaBridgeAtom {
  inspect(tool: LegoToolDefinition): ReturnType<typeof adaptToolParameters>
  normalizeTool(tool: LegoToolDefinition): LegoToolDefinition
}

export interface PiContextBridgeAtom {
  toContext(ctx: HookContext): PiExtensionContext
}

export interface PiSpecialAtomDescriptor {
  id: string
  port: string
  implementation: string
  referenceSource: string
  implementationKind: LegoBlockImplementationKind
}

export interface PiSpecialAtomProfile {
  product: "pi-mono"
  atoms(): PiSpecialAtomDescriptor[]
  atom(id: string): PiSpecialAtomDescriptor | undefined
}

interface PiSpecialAtomDescriptorInput {
  id: string
  port: string
  implementation: string
  referenceSource: string
  implementationKind?: LegoBlockImplementationKind
}

function piSpecialAtomDescriptor(input: PiSpecialAtomDescriptorInput): PiSpecialAtomDescriptor {
  return {
    id: input.id,
    port: input.port,
    implementation: input.implementation,
    referenceSource: referenceOnly(input.referenceSource),
    implementationKind: input.implementationKind ?? inferLegoBlockImplementationKind(input.id, { personality: "pi-mono" }),
  }
}

function referenceOnly(source: string): string {
  return source.startsWith("reference only:") ? source : `reference only: ${source}`
}

export function createPiExtensionManifestNormalizer(): PiExtensionManifestNormalizerAtom {
  return {
    normalize(input) {
      return {
        id: input.source?.id ?? (input.extension.name || "pi-extension"),
        scope: input.source?.scope ?? "project",
        ...(input.source?.path ? { path: input.source.path } : {}),
      }
    },
  }
}

export function createPiExtensionLoaderAtom(input: {
  manifestNormalizer?: PiExtensionManifestNormalizerAtom
  apiFactory?: PiExtensionAPIFactoryAtom
} = {}): PiExtensionLoaderAtom {
  const manifestNormalizer = input.manifestNormalizer ?? createPiExtensionManifestNormalizer()
  const apiFactory = input.apiFactory ?? createPiExtensionAPIFactoryAtom()
  return {
    async load(loadInput) {
      const source = manifestNormalizer.normalize({ extension: loadInput.extension, source: loadInput.source })
      const scope = loadInput.host.createScope(source)
      const api = apiFactory.create({ host: loadInput.host, source: scope })
      await loadInput.extension(api)
      return api
    },
  }
}

export function createPiExtensionAPIFactoryAtom(input: {
  eventMapper?: PiExtensionEventMapperAtom
  dynamicToolBridge?: PiDynamicToolBridgeAtom
  runtimeEventBridge?: PiRuntimeEventBridgeAtom
  contextBridge?: PiContextBridgeAtom
} = {}): PiExtensionAPIFactoryAtom {
  const eventMapper = input.eventMapper ?? createPiExtensionEventMapper()
  const dynamicToolBridge = input.dynamicToolBridge ?? createPiDynamicToolBridge()
  const runtimeEventBridge = input.runtimeEventBridge ?? createPiRuntimeEventBridge()
  return {
    create({ host, source }) {
      const scope = isHookScope(source) ? source : host.createScope(source)
      const contextBridge = input.contextBridge ?? createPiContextBridge(host)
      return {
        on(event, handler) {
          eventMapper.on({ scope, event, handler, toContext: (ctx) => contextBridge.toContext(ctx) })
        },
        registerTool(tool) {
          dynamicToolBridge.registerTool({ host, scope, tool })
        },
        registerCommand(name, options) {
          dynamicToolBridge.registerCommand({ host, scope, name, options })
        },
        registerShortcut(key, options) {
          dynamicToolBridge.registerShortcut({ host, scope, key, options })
        },
        registerFlag(name, options) {
          dynamicToolBridge.registerFlag({ host, scope, name, options })
        },
        registerProvider(name, config) {
          dynamicToolBridge.registerProvider({ host, scope, name, config })
        },
        registerUIProvider(name, provider) {
          dynamicToolBridge.registerUIProvider({ host, scope, name, provider })
        },
        registerMessageRenderer(customType, render) {
          dynamicToolBridge.registerMessageRenderer({ host, scope, customType, render })
        },
        addCleanup(cleanup) {
          scope.addCleanup(cleanup)
        },
        dispose() {
          return scope.dispose()
        },
        events: {
          emit(type, payload) {
            return runtimeEventBridge.emit({ host, scope, type, payload })
          },
        },
      }
    },
  }
}

export function createPiExtensionEventMapper(): PiExtensionEventMapperAtom {
  return {
    on(input) {
      input.scope.on(input.event as EventNameAlias, async (envelope, ctx) => (await input.handler(envelope.payload, input.toContext(ctx))) as never)
    },
  }
}

export function createPiDynamicToolBridge(schemaBridge: PiTypeBoxSchemaBridgeAtom = createPiTypeBoxSchemaBridge()): PiDynamicToolBridgeAtom {
  return {
    registerTool({ host, scope, tool }) {
      scope.addCleanup(host.registerTool(schemaBridge.normalizeTool(tool), scope.source))
    },
    registerCommand({ host, scope, name, options }) {
      scope.addCleanup(host.registerCommand({ name, ...options }, scope.source))
    },
    registerShortcut({ host, scope, key, options }) {
      scope.addCleanup(host.registerShortcut({ key, ...options }, scope.source))
    },
    registerFlag({ host, scope, name, options }) {
      scope.addCleanup(host.registerFlag({ name, ...options }, scope.source))
    },
    registerProvider({ host, scope, name, config }) {
      scope.addCleanup(host.registerProvider({ name, config }, scope.source))
    },
    registerUIProvider({ host, scope, name, provider }) {
      scope.addCleanup(host.registerUIProvider({ name, provider }, scope.source))
    },
    registerMessageRenderer({ host, scope, customType, render }) {
      scope.addCleanup(host.registerMessageRenderer({ customType, render }, scope.source))
      const ui = host.services.get("ui")
      if (hasRendererRegistry(ui)) {
        const unregister = ui.renderers.registerMessagePartRenderer({
          customType,
          render: (part, ctx) => ({ kind: "custom", customType, data: render(part, ctx) }),
        })
        if (typeof unregister === "function") scope.addCleanup(unregister)
      }
    },
  }
}

export function createPiRuntimeEventBridge(): PiRuntimeEventBridgeAtom {
  return {
    async emit({ host, scope, type, payload }) {
      await host.emit({ type: type as never, timestamp: Date.now(), source: scope.source.id, payload })
      if (type !== "resources.discover" && hasResources(payload)) {
        await host.emit({ type: "resources.discover", timestamp: Date.now(), source: type, payload })
      }
    },
  }
}

export function createPiTypeBoxSchemaBridge(): PiTypeBoxSchemaBridgeAtom {
  return {
    inspect(tool) {
      return adaptToolParameters(tool.parameters)
    },
    normalizeTool(tool) {
      const parameters = adaptToolParameters(tool.parameters)
      return {
        ...tool,
        ...(parameters.jsonSchema ? { parameters: parameters.jsonSchema } : {}),
      }
    },
  }
}

export function createPiContextBridge(host: LegoHookHost): PiContextBridgeAtom {
  return {
    toContext(ctx) {
      const sessionManager = createReadonlySessionManager(ctx.services.get("session"))
      return {
        ...ctx,
        cwd: String(ctx.services.get("cwd") ?? process.cwd()),
        ui: createPiUIFacade(ctx),
        ...(sessionManager ? { sessionManager } : {}),
      }
    },
  }
}

export function createPiUIFacade(ctx: HookContext): PiUIFacade {
  const ui = ctx.services.get("ui")
  if (hasPiUI(ui)) return ui
  return {
    notify(message, type = "info") {
      ctx.services.set(`ui.notification:${Date.now()}`, { message, type })
    },
    async confirm() {
      return true
    },
    async input() {
      return undefined
    },
    async select(_title, options) {
      return options[0]
    },
  }
}

export function createReadonlySessionManager(value: unknown): PiReadonlySessionManager | undefined {
  if (!hasSessionService(value)) return undefined
  return {
    get(sessionID) {
      return value.get(sessionID as SessionID)
    },
    list(input = {}) {
      return value.list(input)
    },
    listAll(input = {}) {
      return hasListAll(value) ? value.listAll(input) : value.list(input)
    },
    messages(input) {
      return value.messages({ sessionID: input.sessionID as SessionID, ...(input.limit === undefined ? {} : { limit: input.limit }) })
    },
    transcript(sessionID) {
      return value.transcript(sessionID as SessionID)
    },
  }
}

export function createPiSpecialAtomProfile(): PiSpecialAtomProfile {
  return {
    product: "pi-mono",
    atoms() {
      return piSpecialAtomDescriptors.map((atom) => ({ ...atom }))
    },
    atom(id) {
      const descriptor = piSpecialAtomDescriptors.find((atom) => atom.id === id)
      return descriptor ? { ...descriptor } : undefined
    },
  }
}

const piSpecialAtomDescriptors: PiSpecialAtomDescriptor[] = [
  piSpecialAtomDescriptor({ id: "pi.block.compatibility-metadata", port: "block.manifest", implementation: "Pi upstream metadata", referenceSource: "recipe metadata" }),
  piSpecialAtomDescriptor({ id: "pi.capability.aliases", port: "capability.ref", implementation: "Pi capability aliases", referenceSource: "coding-agent package graph" }),
  piSpecialAtomDescriptor({ id: "pi.recipe.binding-aliases", port: "recipe.binding", implementation: "Pi recipe binding aliases", referenceSource: "CLI/RPC/Web surfaces" }),
  piSpecialAtomDescriptor({ id: "pi.conformance.product-gate", port: "conformance.ref", implementation: "Pi fixture/native parity gate", referenceSource: "pi-mono fixture replay" }),
  piSpecialAtomDescriptor({ id: "pi.identity.id-generator", port: "identity.id-generator", implementation: "JSONL session id bridge", referenceSource: "session tree" }),
  piSpecialAtomDescriptor({ id: "pi.identity.clock-format", port: "identity.clock", implementation: "Pi timestamp bridge", referenceSource: "JSONL events" }),
  piSpecialAtomDescriptor({ id: "pi.identity.workspace-resolver", port: "identity.workspace-resolver", implementation: "workspace/session resolver", referenceSource: "coding-agent workspace" }),
  piSpecialAtomDescriptor({ id: "pi.event.envelope-bridge", port: "event.envelope", implementation: "runtime event envelope bridge", referenceSource: "extension runtime events" }),
  piSpecialAtomDescriptor({ id: "pi.event.runtime-bridge", port: "event.log", implementation: "createPiRuntimeEventBridge", referenceSource: "extension events" }),
  piSpecialAtomDescriptor({ id: "pi.extension.runtime-event-bridge", port: "event.log", implementation: "createPiRuntimeEventBridge", referenceSource: "extension API" }),
  piSpecialAtomDescriptor({ id: "pi.trace.debug-surface", port: "trace.recorder", implementation: "Pi runtime trace bridge", referenceSource: "TUI/runtime logs" }),
  piSpecialAtomDescriptor({ id: "pi.extension.loader", port: "hook.bus", implementation: "createPiExtensionLoaderAtom", referenceSource: "extension loader" }),
  piSpecialAtomDescriptor({ id: "pi.extension.event-mapper", port: "hook.handler-chain", implementation: "createPiExtensionEventMapper", referenceSource: "extension event API" }),
  piSpecialAtomDescriptor({ id: "pi.extension.dynamic-tool-bridge", port: "tool.registry", implementation: "createPiDynamicToolBridge", referenceSource: "extension dynamic tool API" }),
  piSpecialAtomDescriptor({ id: "pi.extension.provider-registry-bridge", port: "registry.provider", implementation: "registerProvider", referenceSource: "extension provider API" }),
  piSpecialAtomDescriptor({ id: "pi.extension.ui-registry-bridge", port: "registry.ui", implementation: "registerUIProvider/registerMessageRenderer", referenceSource: "extension UI API" }),
  piSpecialAtomDescriptor({ id: "pi.extension.typebox-bridge", port: "tool.schema", implementation: "createPiTypeBoxSchemaBridge", referenceSource: "TypeBox tool schemas" }),
  piSpecialAtomDescriptor({ id: "pi.permission.event-bridge", port: "tool.permission-policy", implementation: "permission event bridge", referenceSource: "extension permission events" }),
  piSpecialAtomDescriptor({ id: "pi.tool.result-event-bridge", port: "tool.result-normalizer", implementation: "tool result runtime event bridge", referenceSource: "tool result events" }),
  piSpecialAtomDescriptor({ id: "pi.tool.runtime-event-bridge", port: "tool.audit-log", implementation: "runtime event bridge", referenceSource: "extension events" }),
  piSpecialAtomDescriptor({ id: "pi.process-runner-bridge", port: "process-runner.port", implementation: "node process runner bridge", referenceSource: "tool execution helpers" }),
  piSpecialAtomDescriptor({ id: "pi.provider.request-options", port: "provider.request-shape", implementation: "Anthropic request options", referenceSource: "provider adapter" }),
  piSpecialAtomDescriptor({ id: "pi.provider.event-observer", port: "provider.event-normalizer", implementation: "provider event observer", referenceSource: "provider stream" }),
  piSpecialAtomDescriptor({
    id: "pi.tui.shell",
    port: "ui.event-loop",
    implementation: "Pi upstream TUI event-loop shell",
    referenceSource: "packages/tui/src/tui.ts",
    implementationKind: "factory",
  }),
]

function hasPiUI(value: unknown): value is PiUIFacade {
  return Boolean(value) && typeof value === "object" && typeof (value as PiUIFacade).notify === "function"
}

function hasSessionService(value: unknown): value is SessionService {
  return Boolean(value) && typeof value === "object" && typeof (value as SessionService).transcript === "function"
}

function hasListAll(value: SessionService): value is SessionService & { listAll(input?: { cwd?: string }): Promise<SessionInfo[]> } {
  return typeof (value as { listAll?: unknown }).listAll === "function"
}

function hasRendererRegistry(value: unknown): value is {
  renderers: {
    registerMessagePartRenderer(input: {
      customType: string
      render(part: unknown, ctx: unknown): unknown
    }): () => void
  }
} {
  return Boolean(value) && typeof value === "object" && typeof (value as { renderers?: unknown }).renderers === "object"
}

function hasResources(value: unknown): value is { resources: unknown[] } {
  return Boolean(value) && typeof value === "object" && Array.isArray((value as { resources?: unknown }).resources)
}

function isHookScope(value: unknown): value is HookScope {
  return Boolean(value) && typeof value === "object" && typeof (value as HookScope).dispose === "function"
}
