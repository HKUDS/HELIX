import type { LegoMessagePart, ToolExecutionMode } from "@helix/contracts"

export type CadenceProductPersonality = "common" | "opencode" | "pi-mono" | "nanobot" | "hermes-agent"

export const requestBoundaryPolicyToken = "agent-loop.request-boundary-policy"
export const toolBatchSchedulerToken = "tools.batch-scheduler"
export const finalSummaryPolicyToken = "agent-loop.final-summary-policy"
export const acceptanceControllerToken = "runtime.acceptance-controller"

export type RequestBoundaryDecision = "continue" | "stop" | "synthetic-continue"
export type FinalSummaryDecision = "none" | "concise-summary" | "native-final-message" | "force-provider-round"
export type AcceptanceStatus = "accept" | "continue" | "summarize" | "fail" | "inconclusive"
export type ToolBatchMode = "parallel" | "sequential" | "native-order" | "dependency-aware"

export interface RequestBoundaryInput {
  product: CadenceProductPersonality
  step: number
  maxSteps: number
  finish?: string
  toolCallCount: number
  accepted?: boolean
  acceptanceStatus?: AcceptanceStatus
  evidenceAvailability?: string[]
  syntheticContinues: number
}

export interface RequestBoundaryResult {
  decision: RequestBoundaryDecision
  reasonCode: string
  atomID: string
}

export interface RequestBoundaryPolicy {
  readonly id: string
  decide(input: RequestBoundaryInput): RequestBoundaryResult
}

export interface ToolBatchCandidate {
  toolCallID: string
  toolName: string
  executionMode?: ToolExecutionMode
  mutating: boolean
  inputShape?: string
}

export interface ToolBatchPlan {
  index: number
  mode: ToolBatchMode
  toolCallIDs: string[]
  reasonCode: string
}

export interface ToolBatchScheduler {
  readonly id: string
  plan(input: { product: CadenceProductPersonality; toolCalls: ToolBatchCandidate[] }): ToolBatchPlan[]
}

export interface FinalSummaryInput {
  product: CadenceProductPersonality
  finish?: string
  accepted?: boolean
  acceptanceStatus?: AcceptanceStatus
  evidenceAvailability?: string[]
  productStopBeforeSummary?: boolean
  toolCallCount: number
  visibleText: "empty" | "has-text"
}

export interface FinalSummaryResult {
  decision: FinalSummaryDecision
  reasonCode: string
  atomID: string
}

export interface FinalSummaryPolicy {
  readonly id: string
  decide(input: FinalSummaryInput): FinalSummaryResult
}

export interface AcceptanceInput {
  product: CadenceProductPersonality
  step: number
  cwd?: string
  parts: LegoMessagePart[]
}

export interface AcceptanceDecision {
  status: AcceptanceStatus
  reasonCode: string
  atomID: string
  evidence?: Record<string, unknown>
}

export interface AcceptanceController {
  readonly id: string
  decide(input: AcceptanceInput): Promise<AcceptanceDecision> | AcceptanceDecision
}

export interface CadencePolicyBundle {
  product: CadenceProductPersonality
  requestBoundary: RequestBoundaryPolicy
  toolBatchScheduler: ToolBatchScheduler
  finalSummary: FinalSummaryPolicy
}

export interface CadencePolicyDescriptor {
  id: string
  port: string
  product: CadenceProductPersonality
  plane: "agent-loop" | "tools" | "runtime" | "session" | "provider" | "prompt"
  role: string
  nativeFixtureSource?: string
  replay?: unknown
}
