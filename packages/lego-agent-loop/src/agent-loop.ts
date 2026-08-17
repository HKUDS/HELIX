import { runAgentTurn } from "./loop/run-turn.ts"
import type { AgentLoop } from "./loop/public-types.ts"

export type {
  AgentLoop,
  AgentLoopTurnContext,
  AgentTurnInput,
  AgentTurnResult,
} from "./loop/public-types.ts"

export const defaultAgentLoop: AgentLoop = {
  runTurn: runAgentTurn,
}

export { runAgentTurn } from "./loop/run-turn.ts"
export { DEFAULT_MAX_TOOL_RESULT_TEXT_CHARS } from "./loop/types.ts"
export type { PreparedToolCall, ToolCallPart } from "./loop/types.ts"
