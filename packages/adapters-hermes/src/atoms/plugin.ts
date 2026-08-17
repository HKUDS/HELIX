import type { HookResult, LegoToolDefinition } from "@helix/contracts"
import type {
  CommandRegistration,
  EventNameAlias,
  HookContext,
  HookScope,
  LegoHookHost,
  ProviderRegistration,
  UIProviderRegistration,
} from "@helix/lego-hooks"
import { normalizeHermesTool } from "./tool.ts"
import type { HermesSpecialAtomDescriptor } from "./types.ts"

export interface HermesPluginLoadInput {
  host: LegoHookHost
  plugin: HermesPlugin
  source?: { id?: string; path?: string; scope?: string }
}

export type HermesPlugin = (api: HermesPluginAPI) => void | Promise<void>

export interface HermesPluginAPI {
  on(event: string, handler: (payload: unknown, ctx: HermesPluginContext) => unknown | Promise<unknown>): void
  registerTool(tool: LegoToolDefinition): void
  registerCommand(name: string, command: Omit<CommandRegistration, "name" | "source">): void
  registerProvider(name: string, config: ProviderRegistration["config"]): void
  registerUIProvider(name: string, provider: UIProviderRegistration["provider"]): void
  addCleanup(cleanup: () => void | Promise<void>): void
  emit(type: string, payload: unknown): Promise<void>
  dispose(): Promise<void>
}

export interface HermesPluginContext extends HookContext {
  cwd: string
  hermesHome: string
}

export const hermesPluginLoaderAtom: HermesSpecialAtomDescriptor = {
  id: "hermes.plugin.loader",
  port: "hook.bus",
  implementation: "Hermes plugin discovery and lifecycle bridge",
  referenceSource: "reference only: hermes_cli/plugins.py",
  implementationKind: "bridge",
}

export function createHermesPluginLoaderAtom(): { load(input: HermesPluginLoadInput): Promise<HermesPluginAPI> } {
  return {
    async load(input) {
      const scope = input.host.createScope({
        id: input.source?.id ?? (input.plugin.name || "hermes-plugin"),
        scope: input.source?.scope ?? "project",
        ...(input.source?.path ? { path: input.source.path } : {}),
      })
      const api = createHermesPluginAPI(input.host, scope)
      await input.plugin(api)
      return api
    },
  }
}

export function loadHermesPlugin(input: HermesPluginLoadInput): Promise<HermesPluginAPI> {
  return createHermesPluginLoaderAtom().load(input)
}

export function createHermesPluginAPI(host: LegoHookHost, scope: HookScope): HermesPluginAPI {
  return {
    on(event, handler) {
      scope.on(hermesHookEventName(event) as EventNameAlias, async (envelope, ctx) =>
        normalizeHermesHookResult(await handler(envelope.payload, toHermesContext(host, ctx))),
      )
    },
    registerTool(tool) {
      scope.addCleanup(host.registerTool(normalizeHermesTool(tool), scope.source))
    },
    registerCommand(name, command) {
      scope.addCleanup(host.registerCommand({ name, ...command }, scope.source))
    },
    registerProvider(name, config) {
      scope.addCleanup(host.registerProvider({ name, config }, scope.source))
    },
    registerUIProvider(name, provider) {
      scope.addCleanup(host.registerUIProvider({ name, provider }, scope.source))
    },
    addCleanup(cleanup) {
      scope.addCleanup(cleanup)
    },
    async emit(type, payload) {
      await host.emit({ type: type as never, timestamp: Date.now(), source: scope.source.id, payload })
    },
    dispose() {
      return scope.dispose()
    },
  }
}

function normalizeHermesHookResult(value: unknown): HookResult {
  if (value === undefined || value === null) return undefined
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>
  return { value }
}

function toHermesContext(host: LegoHookHost, ctx: HookContext): HermesPluginContext {
  const cwd = String(ctx.services.get("cwd") ?? host.services.get("cwd") ?? process.cwd())
  return {
    ...ctx,
    cwd,
    hermesHome: String(ctx.services.get("hermes.home") ?? host.services.get("hermes.home") ?? "~/.hermes"),
  }
}

function hermesHookEventName(event: string): string {
  if (event.startsWith("pre_") || event.startsWith("post_") || event.startsWith("on_")) return event
  return event.replace(/\./g, "_")
}
