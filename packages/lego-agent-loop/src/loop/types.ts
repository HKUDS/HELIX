import type {
  LegoMessage,
  LegoMessagePart,
  LegoModel,
  LegoProviderAdapter,
  LegoToolDefinition,
  ProviderStreamEvent,
  ToolCallID,
} from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { SessionInfo } from "@helix/lego-session"
import type { AcceptanceDecision, CadenceProductPersonality } from "../cadence-policies.ts"

export type ToolCallPart = Extract<LegoMessagePart, { type: "tool_call" }>

export interface PreparedToolCall {
  toolCallID: ToolCallID
  toolName: string
  toolInput: Record<string, unknown>
  callPart: ToolCallPart
  tool: LegoToolDefinition | undefined
}

export interface ProviderStepInput {
  provider: LegoProviderAdapter
  hooks: LegoHookHost
  session: SessionInfo
  model: LegoModel
  systemPrompt: string
  messages: LegoMessage[]
  tools: LegoToolDefinition[]
  step: number
  maxSteps: number
  maxRetries: number
  retryDelayMs: number
  maxToolResultTextChars: number
  parts: LegoMessagePart[]
  blockedTools: Array<{ toolName: string; reason?: string }>
  signal?: AbortSignal
  cwd?: string
  cadenceProduct: CadenceProductPersonality
}

export interface ProviderStepResult {
  stepHadToolCall: boolean
  finishEvent?: Extract<ProviderStreamEvent, { type: "finish" }>
  retries: number
  error?: unknown
  acceptedEarly?: boolean
  acceptanceDecision?: AcceptanceDecision
}

export const DEFAULT_MAX_TOOL_RESULT_TEXT_CHARS = 20000
