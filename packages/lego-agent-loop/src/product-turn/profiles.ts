import type { AgentTurnInput } from "../agent-loop"

export type TurnProductPersonality = "opencode" | "pi-mono" | "nanobot" | "hermes-agent"

export type TurnAtomKey =
  | "input-normalizer"
  | "context-builder"
  | "prompt-assembler"
  | "provider-request-builder"
  | "provider-stream-runner"
  | "stream-reducer"
  | "tool-call-planner"
  | "tool-executor"
  | "result-recorder"
  | "retry-policy"
  | "continuation-policy"
  | "compaction-policy"
  | "stop-condition"

export interface ProductTurnProfile {
  product: TurnProductPersonality
  atomPrefix: "opencode" | "pi" | "nanobot" | "hermes"
  assistantPartProtocol: NonNullable<AgentTurnInput["assistantPartProtocol"]>
  maxSteps: number
  maxInputTokens?: number
  compactionKeepMessages?: number
  maxToolResultTextChars: number
  syntheticContinue: boolean
  maxSyntheticContinues: number
  retryMode: "none" | "fixed" | "standard" | "persistent"
  requestShape: "openai-compatible" | "anthropic"
  contextVariant: string
  streamProtocol: string
  toolPlanning: "parallel-batch" | "sequential" | "nanobot-iteration"
  runtimeContext: "none" | "nanobot"
  stopReasons: string[]
}

export function turnProductProfile(product: TurnProductPersonality): ProductTurnProfile {
  return cloneProductTurnProfile(turnProductProfiles[product])
}

export function cloneProductTurnProfile(profile: ProductTurnProfile): ProductTurnProfile {
  return {
    ...profile,
    stopReasons: [...profile.stopReasons],
  }
}

const turnProductProfiles: Record<TurnProductPersonality, ProductTurnProfile> = {
  opencode: {
    product: "opencode",
    atomPrefix: "opencode",
    assistantPartProtocol: "opencode-step-events",
    maxSteps: 8,
    maxToolResultTextChars: 20_000,
    syntheticContinue: false,
    maxSyntheticContinues: 0,
    retryMode: "fixed",
    requestShape: "openai-compatible",
    contextVariant: "opencode-prompt-context",
    streamProtocol: "step-events",
    toolPlanning: "parallel-batch",
    runtimeContext: "none",
    stopReasons: ["stop", "length", "tool_use", "max_steps", "provider_error"],
  },
  "pi-mono": {
    product: "pi-mono",
    atomPrefix: "pi",
    assistantPartProtocol: "pi-native",
    maxSteps: 8,
    maxToolResultTextChars: 20_000,
    syntheticContinue: true,
    maxSyntheticContinues: 2,
    retryMode: "fixed",
    requestShape: "anthropic",
    contextVariant: "pi-active-leaf-context",
    streamProtocol: "anthropic-events",
    toolPlanning: "parallel-batch",
    runtimeContext: "none",
    stopReasons: ["end_turn", "max_tokens", "tool_use", "max_steps", "provider_error"],
  },
  nanobot: {
    product: "nanobot",
    atomPrefix: "nanobot",
    assistantPartProtocol: "common",
    maxSteps: 200,
    maxInputTokens: 65_536,
    compactionKeepMessages: 120,
    maxToolResultTextChars: 16_000,
    syntheticContinue: true,
    maxSyntheticContinues: 2,
    retryMode: "standard",
    requestShape: "openai-compatible",
    contextVariant: "nanobot-session-history",
    streamProtocol: "agent-hook-iteration",
    toolPlanning: "nanobot-iteration",
    runtimeContext: "nanobot",
    stopReasons: ["stop", "length", "tool_calls", "max_iterations", "provider_error"],
  },
  "hermes-agent": {
    product: "hermes-agent",
    atomPrefix: "hermes",
    assistantPartProtocol: "common",
    maxSteps: 90,
    maxInputTokens: 131_072,
    compactionKeepMessages: 120,
    maxToolResultTextChars: 24_000,
    syntheticContinue: true,
    maxSyntheticContinues: 2,
    retryMode: "persistent",
    requestShape: "openai-compatible",
    contextVariant: "hermes-prompt-builder",
    streamProtocol: "chat-completions-tool-calls",
    toolPlanning: "sequential",
    runtimeContext: "none",
    stopReasons: ["stop", "length", "tool_calls", "max_iterations", "interrupt", "provider_error"],
  },
}
