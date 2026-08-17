import type { LegoMessage, LegoMessagePart, TokenUsage } from "./message"
import type { ModelID, ProviderID } from "./ids"
import type { LegoToolDefinition } from "./tool"

export interface LegoModel {
  providerID: ProviderID | string
  modelID: ModelID | string
  name?: string
  contextWindow?: number
  maxOutputTokens?: number
  input?: Array<"text" | "image" | "audio">
  cost?: {
    input: number
    output: number
    cacheRead?: number
    cacheWrite?: number
  }
  metadata?: Record<string, unknown>
}

export interface ProviderRequest {
  model: LegoModel
  system: string[]
  messages: LegoMessage[]
  tools: LegoToolDefinition[]
  signal?: AbortSignal
  options?: Record<string, unknown>
}

export type ProviderStreamEvent =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "tool_call"; toolName: string; input: Record<string, unknown>; id?: string }
  | { type: "finish"; finish: string; usage?: TokenUsage; cost?: number }
  | { type: "part"; part: LegoMessagePart }

export interface LegoProviderAdapter {
  id: ProviderID | string
  models(): Promise<LegoModel[]> | LegoModel[]
  stream(request: ProviderRequest): AsyncIterable<ProviderStreamEvent>
}
