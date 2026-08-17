import type { EventEnvelope } from "@helix/contracts"
import type { LegoHookHost, HookScope } from "@helix/lego-hooks"
import type { HookSourceInfo } from "@helix/lego-hooks"
import {
  createOpenCodePluginEventMapper,
  createOpenCodePluginLoaderAtom,
  createOpenCodePluginPermissionBridge,
  createOpenCodePluginRegistryBridge,
} from "./plugin-atoms"
export { createOpenCodeShellDollar } from "./plugin-atoms"

export type OpenCodePluginInput = {
  client?: unknown
  project?: unknown
  directory: string
  worktree?: string
  serverUrl?: URL
  $?: OpenCodeShellDollar
  experimental_workspace?: {
    register(type: string, adapter: unknown): void
  }
}

export type OpenCodePluginOptions = Record<string, unknown>

export interface OpenCodeShellResult {
  command: string
  stdout: string
  stderr: string
  exitCode: number
  text(): string
}

export interface OpenCodeShellDollar {
  (strings: TemplateStringsArray | string, ...values: unknown[]): Promise<OpenCodeShellResult>
}

export interface OpenCodeWorkspaceRegistration {
  type: string
  adapter: unknown
  source: HookSourceInfo
}

export interface OpenCodeHooks {
  event?: (input: { event: EventEnvelope }) => Promise<void> | void
  config?: (input: Record<string, unknown>) => Promise<void> | void
  tool?: Record<string, unknown>
  auth?: unknown
  provider?: unknown
  ui?: unknown
  "chat.message"?: (input: Record<string, unknown>, output: Record<string, unknown>) => Promise<void> | void
  "chat.params"?: (input: Record<string, unknown>, output: Record<string, unknown>) => Promise<void> | void
  "chat.headers"?: (input: Record<string, unknown>, output: { headers: Record<string, string> }) => Promise<void> | void
  "permission.ask"?: (
    input: Record<string, unknown>,
    output: { status: "ask" | "deny" | "allow" },
  ) => Promise<void> | void
  "command.execute.before"?: (
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: unknown[] },
  ) => Promise<void> | void
  "tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: Record<string, unknown> },
  ) => Promise<void> | void
  "shell.env"?: (
    input: { cwd: string; sessionID?: string; callID?: string },
    output: { env: Record<string, string> },
  ) => Promise<void> | void
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string; args: Record<string, unknown> },
    output: { title: string; output: string; metadata: unknown },
  ) => Promise<void> | void
  "experimental.chat.messages.transform"?: (
    input: Record<string, unknown>,
    output: Record<string, unknown>,
  ) => Promise<void> | void
  "experimental.chat.system.transform"?: (
    input: Record<string, unknown>,
    output: { system: string[] },
  ) => Promise<void> | void
  "experimental.session.compacting"?: (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ) => Promise<void> | void
  "experimental.compaction.autocontinue"?: (
    input: Record<string, unknown>,
    output: { enabled: boolean },
  ) => Promise<void> | void
  "experimental.text.complete"?: (
    input: { sessionID: string; messageID: string; partID: string },
    output: { text: string },
  ) => Promise<void> | void
  "tool.definition"?: (
    input: { toolID: string },
    output: { description: string; parameters: unknown; jsonSchema?: unknown },
  ) => Promise<void> | void
}

export type OpenCodePlugin = (input: OpenCodePluginInput, options?: OpenCodePluginOptions) => Promise<OpenCodeHooks> | OpenCodeHooks

export function defineOpenCodePlugin(plugin: OpenCodePlugin): OpenCodePlugin {
  return plugin
}

export async function loadOpenCodePlugin(input: {
  host: LegoHookHost
  plugin: OpenCodePlugin
  pluginInput: OpenCodePluginInput
  options?: OpenCodePluginOptions
  source?: { id: string; path?: string; scope?: string }
  config?: Record<string, unknown>
}): Promise<HookScope> {
  return createOpenCodePluginLoaderAtom().load(input)
}

export function registerOpenCodeHooks(host: LegoHookHost, scope: HookScope, hooks: OpenCodeHooks): void {
  createOpenCodePluginRegistryBridge().register({ host, scope, hooks })
  createOpenCodePluginPermissionBridge().register({ host, scope, hooks })
  createOpenCodePluginEventMapper().register({ host, scope, hooks })
}
