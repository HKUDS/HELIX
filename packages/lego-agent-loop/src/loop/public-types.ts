import type {
  LegoMessage,
  LegoModel,
  LegoProviderAdapter,
  LegoSerializedError,
  SessionID,
} from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { SessionInfo, SessionService } from "@helix/lego-session"
import type { CadenceProductPersonality } from "../cadence-policies.ts"

export interface AgentTurnInput {
  sessionID?: SessionID
  text: string
  systemPrompt: string
  provider: LegoProviderAdapter
  model?: LegoModel
  maxSteps?: number
  maxInputTokens?: number
  compactionKeepMessages?: number
  autoCompact?: boolean
  maxRetries?: number
  retryDelayMs?: number
  maxToolResultTextChars?: number
  syntheticContinue?: boolean
  syntheticContinueText?: string
  maxSyntheticContinues?: number
  assistantPartProtocol?: "common" | "opencode-step-events" | "pi-native"
  cadenceProduct?: CadenceProductPersonality
  signal?: AbortSignal
}

export interface AgentTurnResult {
  session: SessionInfo
  userMessage: LegoMessage
  assistantMessage: LegoMessage
  transcript: LegoMessage[]
  blockedTools: Array<{ toolName: string; reason?: string }>
  steps: number
  finish?: string
  usage?: unknown
  cost?: number
  contextCompacted?: boolean
  contextTokenEstimate?: number
  contextTokenLimit?: number
  retries?: number
  error?: LegoSerializedError
  syntheticContinues?: number
}

export interface AgentLoopTurnContext {
  session: SessionService
  hooks: LegoHookHost
  cwd?: string
  turn: AgentTurnInput
}

export interface AgentLoop {
  runTurn(input: AgentLoopTurnContext): Promise<AgentTurnResult>
}
