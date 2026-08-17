import type { MessageID, ModelID, PartID, ProviderID, SessionID, ToolCallID } from "./ids"

export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[]

export interface LegoFileAttachment {
  type: "file"
  path: string
  mime?: string
  metadata?: Record<string, unknown>
}

export interface LegoImageAttachment {
  type: "image"
  mediaType: string
  data: string
  metadata?: Record<string, unknown>
}

export type LegoAttachment = LegoFileAttachment | LegoImageAttachment

export interface TextPart {
  id: PartID
  type: "text"
  text: string
}

export interface ReasoningPart {
  id: PartID
  type: "reasoning"
  text: string
}

export interface ToolCallPart {
  id: PartID
  type: "tool_call"
  toolCallID: ToolCallID
  toolName: string
  input: Record<string, unknown>
  status: "pending" | "running" | "completed" | "error"
  metadata?: Record<string, unknown>
}

export interface ToolResultPart {
  id: PartID
  type: "tool_result"
  toolCallID: ToolCallID
  toolName: string
  content: LegoMessagePart[]
  isError?: boolean
  details?: unknown
}

export interface CompactionPart {
  id: PartID
  type: "compaction"
  reason: "manual" | "overflow" | "branch" | "hook"
  summary: string
  firstKeptMessageID?: MessageID
  metadata?: Record<string, unknown>
}

export interface CustomPart {
  id: PartID
  type: "custom"
  customType: string
  data: unknown
  display?: string
}

export type LegoMessagePart = TextPart | ReasoningPart | ToolCallPart | ToolResultPart | CompactionPart | CustomPart

export interface LegoMessageBase {
  id: MessageID
  sessionID: SessionID
  parentID?: MessageID
  time: {
    created: number
    updated?: number
    completed?: number
  }
  metadata?: Record<string, unknown>
}

export interface UserMessage extends LegoMessageBase {
  role: "user"
  parts: LegoMessagePart[]
  attachments?: LegoAttachment[]
  agent?: string
  model?: LegoModelRef
}

export interface AssistantMessage extends LegoMessageBase {
  role: "assistant"
  agent?: string
  model?: LegoModelRef
  parts: LegoMessagePart[]
  finish?: string
  usage?: TokenUsage
  cost?: number
  error?: LegoSerializedError
}

export interface ToolMessage extends LegoMessageBase {
  role: "tool"
  parts: ToolResultPart[]
}

export interface SyntheticMessage extends LegoMessageBase {
  role: "synthetic"
  parts: LegoMessagePart[]
  reason?: string
}

export interface ShellMessage extends LegoMessageBase {
  role: "shell"
  command: string
  output: string
  exitCode?: number
  parts: LegoMessagePart[]
}

export type LegoMessage = UserMessage | AssistantMessage | ToolMessage | SyntheticMessage | ShellMessage

export interface LegoModelRef {
  providerID: ProviderID | string
  modelID: ModelID | string
}

export interface TokenUsage {
  input: number
  output: number
  reasoning?: number
  cacheRead?: number
  cacheWrite?: number
}

export interface LegoSerializedError {
  name: string
  message: string
  stack?: string
  data?: unknown
}

export interface SessionTranscript {
  sessionID: SessionID
  messages: LegoMessage[]
  metadata?: Record<string, unknown>
}
