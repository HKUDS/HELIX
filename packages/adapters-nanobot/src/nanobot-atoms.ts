import {
  adaptToolParameters,
  inferLegoBlockImplementationKind,
  type LegoBlockImplementationKind,
  type LegoToolDefinition,
} from "@helix/contracts"
import type {
  CommandRegistration,
  EventNameAlias,
  HookContext,
  HookScope,
  LegoHookHost,
  ProviderRegistration,
  UIProviderRegistration,
} from "@helix/lego-hooks"

export interface NanobotPluginLoadInput {
  host: LegoHookHost
  plugin: NanobotPlugin
  source?: { id?: string; path?: string; scope?: string }
}

export type NanobotPlugin = (api: NanobotPluginAPI) => void | Promise<void>

export interface NanobotPluginAPI {
  on(event: string, handler: (payload: unknown, ctx: NanobotPluginContext) => unknown | Promise<unknown>): void
  registerTool(tool: LegoToolDefinition): void
  registerCommand(name: string, command: Omit<CommandRegistration, "name" | "source">): void
  registerProvider(name: string, config: ProviderRegistration["config"]): void
  registerUIProvider(name: string, provider: UIProviderRegistration["provider"]): void
  addCleanup(cleanup: () => void | Promise<void>): void
  emit(type: string, payload: unknown): Promise<void>
  dispose(): Promise<void>
}

export interface NanobotPluginContext extends HookContext {
  cwd: string
  workspace: string
}

export interface NanobotPluginManifestNormalizerAtom {
  normalize(input: { plugin: NanobotPlugin; source?: NanobotPluginLoadInput["source"] }): { id: string; path?: string; scope: string }
}

export interface NanobotPluginLoaderAtom {
  load(input: NanobotPluginLoadInput): Promise<NanobotPluginAPI>
}

export interface NanobotPluginAPIFactoryAtom {
  create(input: { host: LegoHookHost; source: HookScope | { id: string; order?: number; path?: string; scope?: string } }): NanobotPluginAPI
}

export interface NanobotPluginEventMapperAtom {
  on(input: {
    scope: HookScope
    event: EventNameAlias | string
    handler: (payload: unknown, ctx: NanobotPluginContext) => unknown | Promise<unknown>
    toContext(ctx: HookContext): NanobotPluginContext
  }): void
}

export interface NanobotRegistryBridgeAtom {
  registerTool(input: { host: LegoHookHost; scope: HookScope; tool: LegoToolDefinition }): void
  registerCommand(input: { host: LegoHookHost; scope: HookScope; name: string; command: Omit<CommandRegistration, "name" | "source"> }): void
  registerProvider(input: { host: LegoHookHost; scope: HookScope; name: string; config: ProviderRegistration["config"] }): void
  registerUIProvider(input: { host: LegoHookHost; scope: HookScope; name: string; provider: UIProviderRegistration["provider"] }): void
}

export interface NanobotRuntimeEventBridgeAtom {
  emit(input: { host: LegoHookHost; scope: HookScope; type: string; payload: unknown }): Promise<void>
}

export interface NanobotToolSchemaBridgeAtom {
  inspect(tool: LegoToolDefinition): ReturnType<typeof adaptToolParameters>
  normalizeTool(tool: LegoToolDefinition): LegoToolDefinition
}

export interface NanobotContextBridgeAtom {
  toContext(ctx: HookContext): NanobotPluginContext
}

export interface NanobotSpecialAtomDescriptor {
  id: string
  port: string
  implementation: string
  referenceSource: string
  implementationKind: LegoBlockImplementationKind
}

export interface NanobotSpecialAtomProfile {
  product: "nanobot"
  atoms(): NanobotSpecialAtomDescriptor[]
  atom(id: string): NanobotSpecialAtomDescriptor | undefined
}

interface NanobotSpecialAtomDescriptorInput {
  id: string
  port: string
  implementation: string
  referenceSource: string
  implementationKind?: LegoBlockImplementationKind
}

function nanobotSpecialAtomDescriptor(input: NanobotSpecialAtomDescriptorInput): NanobotSpecialAtomDescriptor {
  return {
    id: input.id,
    port: input.port,
    implementation: input.implementation,
    referenceSource: referenceOnly(input.referenceSource),
    implementationKind: input.implementationKind ?? inferLegoBlockImplementationKind(input.id, { personality: "nanobot" }),
  }
}

function referenceOnly(source: string): string {
  return source.startsWith("reference only:") ? source : `reference only: ${source}`
}

export function createNanobotPluginManifestNormalizer(): NanobotPluginManifestNormalizerAtom {
  return {
    normalize(input) {
      return {
        id: input.source?.id ?? (input.plugin.name || "nanobot-plugin"),
        scope: input.source?.scope ?? "project",
        ...(input.source?.path ? { path: input.source.path } : {}),
      }
    },
  }
}

export function createNanobotPluginLoaderAtom(input: {
  manifestNormalizer?: NanobotPluginManifestNormalizerAtom
  apiFactory?: NanobotPluginAPIFactoryAtom
  eventMapper?: NanobotPluginEventMapperAtom
  registryBridge?: NanobotRegistryBridgeAtom
  runtimeEventBridge?: NanobotRuntimeEventBridgeAtom
  contextBridge?: NanobotContextBridgeAtom
  schemaBridge?: NanobotToolSchemaBridgeAtom
} = {}): NanobotPluginLoaderAtom {
  const manifestNormalizer = input.manifestNormalizer ?? createNanobotPluginManifestNormalizer()
  const apiFactory =
    input.apiFactory ??
    createNanobotPluginAPIFactoryAtom({
      ...(input.eventMapper ? { eventMapper: input.eventMapper } : {}),
      ...(input.registryBridge ? { registryBridge: input.registryBridge } : {}),
      ...(input.runtimeEventBridge ? { runtimeEventBridge: input.runtimeEventBridge } : {}),
      ...(input.contextBridge ? { contextBridge: input.contextBridge } : {}),
      ...(input.schemaBridge ? { schemaBridge: input.schemaBridge } : {}),
    })
  return {
    async load(loadInput) {
      const source = manifestNormalizer.normalize({ plugin: loadInput.plugin, source: loadInput.source })
      const scope = loadInput.host.createScope(source)
      const api = apiFactory.create({ host: loadInput.host, source: scope })
      await loadInput.plugin(api)
      return api
    },
  }
}

export function loadNanobotPlugin(input: NanobotPluginLoadInput): Promise<NanobotPluginAPI> {
  return createNanobotPluginLoaderAtom().load(input)
}

export function createNanobotPluginAPIFactoryAtom(input: {
  eventMapper?: NanobotPluginEventMapperAtom
  registryBridge?: NanobotRegistryBridgeAtom
  runtimeEventBridge?: NanobotRuntimeEventBridgeAtom
  contextBridge?: NanobotContextBridgeAtom
  schemaBridge?: NanobotToolSchemaBridgeAtom
} = {}): NanobotPluginAPIFactoryAtom {
  const eventMapper = input.eventMapper ?? createNanobotPluginEventMapper()
  const registryBridge = input.registryBridge ?? createNanobotRegistryBridge(input.schemaBridge)
  const runtimeEventBridge = input.runtimeEventBridge ?? createNanobotRuntimeEventBridge()
  return {
    create({ host, source }) {
      const scope = isHookScope(source) ? source : host.createScope(source)
      const contextBridge = input.contextBridge ?? createNanobotContextBridge(host)
      return createNanobotPluginAPI(host, scope, {
        eventMapper,
        registryBridge,
        runtimeEventBridge,
        contextBridge,
      })
    },
  }
}

export function createNanobotPluginAPI(
  host: LegoHookHost,
  scope: HookScope,
  atoms: {
    eventMapper?: NanobotPluginEventMapperAtom
    registryBridge?: NanobotRegistryBridgeAtom
    runtimeEventBridge?: NanobotRuntimeEventBridgeAtom
    contextBridge?: NanobotContextBridgeAtom
    schemaBridge?: NanobotToolSchemaBridgeAtom
  } = {},
): NanobotPluginAPI {
  const eventMapper = atoms.eventMapper ?? createNanobotPluginEventMapper()
  const registryBridge = atoms.registryBridge ?? createNanobotRegistryBridge(atoms.schemaBridge)
  const runtimeEventBridge = atoms.runtimeEventBridge ?? createNanobotRuntimeEventBridge()
  const contextBridge = atoms.contextBridge ?? createNanobotContextBridge(host)
  return {
    on(event, handler) {
      eventMapper.on({ scope, event, handler, toContext: (ctx) => contextBridge.toContext(ctx) })
    },
    registerTool(tool) {
      registryBridge.registerTool({ host, scope, tool })
    },
    registerCommand(name, command) {
      registryBridge.registerCommand({ host, scope, name, command })
    },
    registerProvider(name, config) {
      registryBridge.registerProvider({ host, scope, name, config })
    },
    registerUIProvider(name, provider) {
      registryBridge.registerUIProvider({ host, scope, name, provider })
    },
    addCleanup(cleanup) {
      scope.addCleanup(cleanup)
    },
    emit(type, payload) {
      return runtimeEventBridge.emit({ host, scope, type, payload })
    },
    dispose() {
      return scope.dispose()
    },
  }
}

export function createNanobotPluginEventMapper(): NanobotPluginEventMapperAtom {
  return {
    on(input) {
      input.scope.on(nanobotHookEventName(input.event) as EventNameAlias, async (envelope, ctx) => {
        const context = input.toContext(ctx)
        context.services.set("nanobot.originalEvent", input.event)
        return (await input.handler(envelope.payload, context)) as never
      })
    },
  }
}

export function createNanobotRegistryBridge(schemaBridge: NanobotToolSchemaBridgeAtom = createNanobotToolSchemaBridge()): NanobotRegistryBridgeAtom {
  return {
    registerTool({ host, scope, tool }) {
      scope.addCleanup(host.registerTool(schemaBridge.normalizeTool(tool), scope.source))
    },
    registerCommand({ host, scope, name, command }) {
      scope.addCleanup(host.registerCommand({ name, ...command }, scope.source))
    },
    registerProvider({ host, scope, name, config }) {
      scope.addCleanup(host.registerProvider({ name, config }, scope.source))
    },
    registerUIProvider({ host, scope, name, provider }) {
      scope.addCleanup(host.registerUIProvider({ name, provider }, scope.source))
    },
  }
}

export function createNanobotRuntimeEventBridge(): NanobotRuntimeEventBridgeAtom {
  return {
    async emit({ host, scope, type, payload }) {
      await host.emit({ type: type as never, timestamp: Date.now(), source: scope.source.id, payload })
      if (type !== "resources.discover" && hasResources(payload)) {
        await host.emit({ type: "resources.discover", timestamp: Date.now(), source: type, payload })
      }
    },
  }
}

export function createNanobotContextBridge(host: LegoHookHost): NanobotContextBridgeAtom {
  return {
    toContext(ctx) {
      const cwd = String(ctx.services.get("cwd") ?? host.services.get("cwd") ?? process.cwd())
      return {
        ...ctx,
        cwd,
        workspace: String(ctx.services.get("nanobot.workspace") ?? host.services.get("nanobot.workspace") ?? cwd),
      }
    },
  }
}

export function createNanobotToolSchemaBridge(): NanobotToolSchemaBridgeAtom {
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

export function createNanobotSpecialAtomProfile(): NanobotSpecialAtomProfile {
  return {
    product: "nanobot",
    atoms() {
      return nanobotSpecialAtomDescriptors.map((atom) => ({ ...atom }))
    },
    atom(id) {
      const descriptor = nanobotSpecialAtomDescriptors.find((atom) => atom.id === id)
      return descriptor ? { ...descriptor } : undefined
    },
  }
}

export function nanobotHookEventName(event: EventNameAlias | string): EventNameAlias | string {
  const aliases: Record<string, EventNameAlias | string> = {
    before_iteration: "turn.start",
    after_iteration: "turn.end",
    before_execute_tools: "tool.execution_start",
    on_stream: "message.update",
    on_stream_end: "provider.response.after",
    emit_reasoning: "message.update",
    emit_reasoning_end: "message.end",
    finalize_content: "agent.end",
    inbound_message: "input",
    outbound_message: "message.end",
    resources: "resources.discover",
  }
  return aliases[String(event)] ?? event
}

const nanobotSpecialAtomDescriptors: NanobotSpecialAtomDescriptor[] = [
  nanobotSpecialAtomDescriptor({ id: "nanobot.block.compatibility-metadata", port: "block.manifest", implementation: "nanobot-ai@0.2.0 metadata", referenceSource: "config/schema.py + nanobot.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.capability.aliases", port: "capability.ref", implementation: "Nanobot capability names to lego ports", referenceSource: "agent/loop.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.recipe.binding-aliases", port: "recipe.binding", implementation: "Nanobot SDK/CLI/server binding aliases", referenceSource: "cli/commands.py + api/server.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.conformance.product-gate", port: "conformance.ref", implementation: "Pinned nanobot-ai fixture and native contract gate", referenceSource: "nanobot-ai==0.2.0" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.identity.id-generator", port: "identity.id-generator", implementation: "channel/session/message id bridge", referenceSource: "session/manager.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.identity.clock-format", port: "identity.clock", implementation: "timezone-aware runtime context clock", referenceSource: "agent/context.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.identity.workspace-resolver", port: "identity.workspace-resolver", implementation: "workspace/defaults resolver", referenceSource: "config/schema.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.event.envelope-bridge", port: "event.envelope", implementation: "message bus envelope bridge", referenceSource: "bus/events.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.event.bus-bridge", port: "event.log", implementation: "runtime event bridge", referenceSource: "bus/queue.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.trace.debug-surface", port: "trace.recorder", implementation: "turn state trace entries", referenceSource: "agent/loop.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.plugin.loader", port: "hook.bus", implementation: "createNanobotPluginLoaderAtom", referenceSource: "agent/hook.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.plugin.event-mapper", port: "hook.handler-chain", implementation: "createNanobotPluginEventMapper", referenceSource: "agent/hook.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.tool.registry-bridge", port: "tool.registry", implementation: "createNanobotRegistryBridge", referenceSource: "agent/tools/registry.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.plugin.provider-registry-bridge", port: "registry.provider", implementation: "registerProvider", referenceSource: "providers/registry.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.plugin.ui-registry-bridge", port: "registry.ui", implementation: "registerUIProvider", referenceSource: "channels/manager.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.tool.schema-bridge", port: "tool.schema", implementation: "createNanobotToolSchemaBridge", referenceSource: "agent/tools/schema.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.permission.policy-bridge", port: "tool.permission-policy", implementation: "tool policy bridge", referenceSource: "agent/tools/sandbox.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.tool.result-event-bridge", port: "tool.result-normalizer", implementation: "tool result event bridge", referenceSource: "agent/runner.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.tool.progress-event-bridge", port: "tool.audit-log", implementation: "progress event bridge", referenceSource: "agent/progress_hook.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.provider.request-options", port: "provider.request-shape", implementation: "OpenAI-compatible request options", referenceSource: "providers/openai_compat_provider.py" }),
  nanobotSpecialAtomDescriptor({ id: "nanobot.provider.event-observer", port: "provider.event-normalizer", implementation: "provider stream event observer", referenceSource: "providers/base.py" }),
  nanobotSpecialAtomDescriptor({
    id: "nanobot.tui.shell",
    port: "ui.event-loop",
    implementation: "shared Helix UI event-loop preview for Nanobot",
    referenceSource: "cli/stream.py; implemented here as shared UI event-loop preview",
    implementationKind: "preview",
  }),
]

function isHookScope(value: HookScope | { id: string; order?: number; path?: string; scope?: string }): value is HookScope {
  return typeof (value as HookScope).on === "function" && typeof (value as HookScope).dispose === "function"
}

function hasResources(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false
  const record = payload as Record<string, unknown>
  return Array.isArray(record["resources"]) || Boolean(record["resource"])
}
