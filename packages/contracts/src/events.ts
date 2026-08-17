import type { LegoMessage, LegoMessagePart, SessionTranscript } from "./message"
import type { MessageID, ModelID, ProviderID, SessionID, ToolCallID } from "./ids"

export type LegoEventType =
  | "session.created"
  | "session.updated"
  | "session.deleted"
  | "session.resumed"
  | "session.forked"
  | "session.start"
  | "session.before_switch"
  | "session.before_fork"
  | "session.before_compact"
  | "session.compact"
  | "session.shutdown"
  | "session.before_tree"
  | "session.tree"
  | "session.compacting"
  | "session.compacted"
  | "session.idle"
  | "input"
  | "context"
  | "before_agent_start"
  | "agent.start"
  | "agent.end"
  | "turn.start"
  | "turn.end"
  | "message.start"
  | "message.update"
  | "message.end"
  | "tool.call"
  | "tool.result"
  | "tool.definition"
  | "tool.execution_start"
  | "tool.execution_update"
  | "tool.execution_end"
  | "command.before"
  | "provider.request.before"
  | "provider.response.after"
  | "permission.ask"
  | "model.select"
  | "thinking_level.select"
  | "shell.env"
  | "user_bash"
  | "resources.discover"
  | "turn.pipeline.trace"
  | "runtime.accepted-early"

export interface EventEnvelope<TType extends LegoEventType = LegoEventType, TPayload = unknown> {
  type: TType
  sessionID?: SessionID
  traceID?: string
  timestamp: number
  source?: string
  payload: TPayload
  metadata?: Record<string, unknown>
}

export interface InputEventPayload {
  text: string
  images?: unknown[]
  source: "interactive" | "rpc" | "extension" | "command"
}

export type InputEventResult =
  | { action: "continue" }
  | { action: "transform"; text: string; images?: unknown[] }
  | { action: "handled" }

export interface ContextEventPayload {
  transcript: SessionTranscript
  messages: LegoMessage[]
}

export interface ContextEventResult {
  messages?: LegoMessage[]
}

export interface BeforeAgentStartPayload {
  prompt: string
  systemPrompt: string
  messages: LegoMessage[]
  model?: {
    providerID: ProviderID | string
    modelID: ModelID | string
  }
}

export interface BeforeAgentStartResult {
  systemPrompt?: string
  message?: LegoMessage
}

export interface ToolCallEventPayload {
  toolName: string
  toolCallID: ToolCallID
  sessionID: SessionID
  input: Record<string, unknown>
  messageID?: MessageID
}

export interface ToolCallEventResult {
  block?: boolean
  reason?: string
}

export interface ToolResultEventPayload {
  toolName: string
  toolCallID: ToolCallID
  sessionID: SessionID
  input: Record<string, unknown>
  content: LegoMessagePart[]
  details?: unknown
  isError?: boolean
}

export interface ToolResultEventResult {
  content?: LegoMessagePart[]
  details?: unknown
  isError?: boolean
}

export interface PermissionAskPayload {
  sessionID: SessionID
  action: string
  subject: string
  metadata?: Record<string, unknown>
}

export interface PermissionAskResult {
  status?: "ask" | "deny" | "allow"
}

export interface ShellEnvPayload {
  cwd: string
  command: string
  sessionID?: SessionID | string
  callID?: ToolCallID | string
}

export interface ShellEnvResult {
  env?: Record<string, string>
}

export interface SessionBeforeResult {
  cancel?: boolean
  reason?: string
}

export type HookResult =
  | InputEventResult
  | ContextEventResult
  | BeforeAgentStartResult
  | ToolCallEventResult
  | ToolResultEventResult
  | PermissionAskResult
  | ShellEnvResult
  | SessionBeforeResult
  | Record<string, unknown>
  | void
