export type TurnPipelineAtomID =
  | "turn.input-normalizer"
  | "turn.context-builder"
  | "turn.prompt-assembler"
  | "turn.provider-request-builder"
  | "turn.provider-stream-runner"
  | "turn.stream-reducer"
  | "turn.tool-call-planner"
  | "turn.tool-executor"
  | "turn.result-recorder"
  | "turn.retry-policy"
  | "turn.continuation-policy"
  | "turn.compaction-policy"
  | "turn.stop-condition"
  | "agent-loop.request-boundary"
  | "agent-loop.final-summary"
  | "tools.batch-scheduler"
  | "runtime.acceptance-controller"

export interface TurnPipelineAtom {
  id: TurnPipelineAtomID
  input: string
  output: string
  traceEvent: "turn.pipeline.trace"
}

export const turnPipelineAtoms: TurnPipelineAtom[] = [
  { id: "turn.input-normalizer", input: "AgentTurnInput", output: "normalized prompt", traceEvent: "turn.pipeline.trace" },
  { id: "turn.context-builder", input: "session transcript + system prompt", output: "provider context messages", traceEvent: "turn.pipeline.trace" },
  { id: "turn.prompt-assembler", input: "base system prompt + hooks", output: "provider system prompt", traceEvent: "turn.pipeline.trace" },
  { id: "turn.provider-request-builder", input: "context + model + tools", output: "ProviderRequest", traceEvent: "turn.pipeline.trace" },
  { id: "turn.provider-stream-runner", input: "ProviderRequest", output: "ProviderStreamEvent[]", traceEvent: "turn.pipeline.trace" },
  { id: "turn.stream-reducer", input: "ProviderStreamEvent", output: "assistant message parts", traceEvent: "turn.pipeline.trace" },
  { id: "turn.tool-call-planner", input: "tool call parts", output: "ordered/parallel execution plan", traceEvent: "turn.pipeline.trace" },
  { id: "turn.tool-executor", input: "planned tool calls", output: "tool result parts", traceEvent: "turn.pipeline.trace" },
  { id: "turn.result-recorder", input: "assistant parts + metadata", output: "persisted assistant message", traceEvent: "turn.pipeline.trace" },
  { id: "turn.retry-policy", input: "provider error + retry budget", output: "retry decision", traceEvent: "turn.pipeline.trace" },
  { id: "turn.continuation-policy", input: "finish reason + continuation budget", output: "synthetic continuation decision", traceEvent: "turn.pipeline.trace" },
  { id: "turn.compaction-policy", input: "token estimate + context limit", output: "compaction decision", traceEvent: "turn.pipeline.trace" },
  { id: "turn.stop-condition", input: "step result + max steps", output: "continue/stop decision", traceEvent: "turn.pipeline.trace" },
  { id: "agent-loop.request-boundary", input: "step result + acceptance state", output: "request boundary decision", traceEvent: "turn.pipeline.trace" },
  { id: "agent-loop.final-summary", input: "accepted/tool/final text state", output: "final summary decision", traceEvent: "turn.pipeline.trace" },
  { id: "tools.batch-scheduler", input: "planned tool calls", output: "tool execution batches", traceEvent: "turn.pipeline.trace" },
  { id: "runtime.acceptance-controller", input: "task policy evidence", output: "acceptance decision", traceEvent: "turn.pipeline.trace" },
]

export const turnPipelineAtomIDs = turnPipelineAtoms.map((atom) => atom.id)
