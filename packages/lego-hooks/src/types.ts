import type { EventEnvelope, HookResult, LegoEventType, LegoToolDefinition } from "@helix/contracts"

export interface HookSourceInfo {
  id: string
  name?: string
  path?: string
  scope?: "global" | "project" | "internal" | string
  order: number
  metadata?: Record<string, unknown>
}

export interface HookContext {
  source?: HookSourceInfo
  signal?: AbortSignal | undefined
  services: Map<string, unknown>
}

export type HookObserver = (event: EventEnvelope, ctx: HookContext) => void | Promise<void>
export type HookHandler<TEvent extends EventEnvelope = EventEnvelope, TResult = HookResult> = (
  event: TEvent,
  ctx: HookContext,
) => TResult | Promise<TResult>

export type HookErrorMode = "continue" | "throw"

export interface HookError {
  source?: HookSourceInfo
  event: EventEnvelope
  error: unknown
}

export interface HookHostOptions {
  errorMode?: HookErrorMode
  onError?: (error: HookError) => void
}

export interface HookScope {
  readonly source: HookSourceInfo
  observe(observer: HookObserver): () => void
  on(type: EventNameAlias, handler: HookHandler): () => void
  addCleanup(cleanup: () => void | Promise<void>): () => void
  dispose(): Promise<void>
}

export interface CommandRegistration {
  name: string
  description?: string
  handler: (args: string, ctx: HookContext) => void | Promise<void>
  source?: HookSourceInfo
}

export interface ShortcutRegistration {
  key: string
  description?: string
  handler: (ctx: HookContext) => void | Promise<void>
  source?: HookSourceInfo
}

export interface FlagRegistration {
  name: string
  description?: string
  type: "boolean" | "string"
  default?: boolean | string
  source?: HookSourceInfo
}

export interface ProviderRegistration {
  name: string
  config: unknown
  source?: HookSourceInfo
}

export interface AuthRegistration {
  name: string
  config: unknown
  source?: HookSourceInfo
}

export interface UIProviderRegistration {
  name: string
  provider: unknown
  source?: HookSourceInfo
}

export interface MessageRendererRegistration {
  customType: string
  render: (...args: unknown[]) => unknown
  source?: HookSourceInfo
}

export interface HookRegistries {
  tools: Map<string, LegoToolDefinition>
  commands: Map<string, CommandRegistration>
  shortcuts: Map<string, ShortcutRegistration>
  flags: Map<string, FlagRegistration>
  providers: Map<string, ProviderRegistration>
  auth: Map<string, AuthRegistration>
  uiProviders: Map<string, UIProviderRegistration>
  messageRenderers: Map<string, MessageRendererRegistration>
}

export type EventNameAlias =
  | LegoEventType
  | "tool_call"
  | "tool_result"
  | "tool_definition"
  | "tool_execution_start"
  | "tool_execution_update"
  | "tool_execution_end"
  | "command_before"
  | "before_agent_start"
  | "agent_start"
  | "agent_end"
  | "turn_start"
  | "turn_end"
  | "message_start"
  | "message_update"
  | "message_end"
  | "session_start"
  | "session_before_switch"
  | "session_before_fork"
  | "session_before_compact"
  | "session_compact"
  | "session_shutdown"
  | "session_before_tree"
  | "session_tree"
  | "model_select"
  | "thinking_level_select"
  | "permission_ask"
  | "shell_env"
  | "before_provider_request"
  | "provider_request_before"
  | "after_provider_response"
  | "provider_response_after"
  | "user_bash"
  | "resources_discover"
