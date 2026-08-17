import {
  createID,
  type AssistantMessage,
  type LegoMessage,
  type LegoMessagePart,
  type LegoSerializedError,
  type SessionID,
} from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import {
  createRequestBoundaryPolicy,
  finalSummaryPolicyToken,
  requestBoundaryPolicyToken,
  type CadenceProductPersonality,
  type FinalSummaryPolicy,
  type RequestBoundaryPolicy,
} from "../cadence-policies.ts"
import { envelope } from "./events.ts"
import type { AgentTurnInput } from "./public-types.ts"

export function applyAssistantPartProtocol(
  parts: LegoMessagePart[],
  input: {
    protocol: NonNullable<AgentTurnInput["assistantPartProtocol"]>
    sessionID: SessionID
    finish?: string
    steps: number
    providerID: string
    modelID: string
  },
): LegoMessagePart[] {
  if (input.protocol !== "opencode-step-events") return parts
  if (parts.some((part) => part.type === "custom" && part.customType === "step-start")) return parts
  return [
    {
      id: createID("part"),
      type: "custom",
      customType: "step-start",
      data: {
        sessionID: input.sessionID,
        providerID: input.providerID,
        modelID: input.modelID,
        step: 0,
        steps: input.steps,
      },
    },
    ...(parts.some((part) => part.type === "reasoning")
      ? []
      : [
          {
            id: createID("part"),
            type: "reasoning" as const,
            text: "",
          },
        ]),
    ...parts,
    {
      id: createID("part"),
      type: "custom",
      customType: "step-finish",
      data: {
        reason: input.finish ?? "stop",
        step: Math.max(0, input.steps - 1),
      },
    },
  ]
}

export function shouldSyntheticContinue(finish: string): boolean {
  return ["length", "max_tokens", "max_output", "output_limit", "continue"].includes(finish)
}

export function createSyntheticContinueMessage(input: {
  sessionID: SessionID
  text: string
  reason: string
  metadata?: Record<string, unknown>
}): LegoMessage {
  const now = Date.now()
  return {
    id: createID("message"),
    sessionID: input.sessionID,
    role: "synthetic",
    reason: input.reason,
    time: { created: now, completed: now },
    ...(input.metadata ? { metadata: input.metadata } : {}),
    parts: [{ id: createID("part"), type: "text", text: input.text }],
  }
}

export async function emitSyntheticMessage(hooks: LegoHookHost, message: LegoMessage, signal?: AbortSignal): Promise<void> {
  await hooks.emit(envelope("message.start", message.sessionID, { message }), signal)
  await hooks.emit(envelope("message.end", message.sessionID, { message }), signal)
}

export function applyAssistantMetadata(
  message: LegoMessage,
  metadata: { finish?: string; usage?: unknown; cost?: number; error?: LegoSerializedError },
): asserts message is AssistantMessage {
  if (message.role !== "assistant") return
  if (metadata.finish) message.finish = metadata.finish
  if (metadata.usage) message.usage = metadata.usage as NonNullable<AssistantMessage["usage"]>
  if (metadata.cost !== undefined) message.cost = metadata.cost
  if (metadata.error) message.error = metadata.error
}

export function cadenceProductFromAssistantProtocol(protocol: AgentTurnInput["assistantPartProtocol"]): CadenceProductPersonality {
  if (protocol === "opencode-step-events") return "opencode"
  if (protocol === "pi-native") return "pi-mono"
  return "common"
}

export function requestBoundaryPolicyFromServices(services: Map<string, unknown>, product: CadenceProductPersonality): RequestBoundaryPolicy {
  const value = services.get(requestBoundaryPolicyToken)
  void product
  return isRequestBoundaryPolicy(value) ? value : createRequestBoundaryPolicy("common")
}

export function finalSummaryPolicyFromServices(services: Map<string, unknown>, product: CadenceProductPersonality): FinalSummaryPolicy {
  const value = services.get(finalSummaryPolicyToken)
  void product
  return isFinalSummaryPolicy(value) ? value : createRequestFinalSummaryFallback()
}

export function partToTextForPolicy(part: LegoMessagePart): string {
  if (part.type === "text" || part.type === "reasoning") return part.text
  if (part.type === "tool_result") return part.content.map(partToTextForPolicy).join("\n")
  if (part.type === "custom") return part.display ?? ""
  if (part.type === "compaction") return part.summary
  return ""
}

function createRequestFinalSummaryFallback(): FinalSummaryPolicy {
  const id = "common.agent-loop.final-summary.default"
  return {
    id,
    decide(input) {
      if (input.toolCallCount > 0) return { decision: "native-final-message", reasonCode: "tool-results-need-visible-finalization", atomID: id }
      return { decision: input.visibleText === "has-text" ? "none" : "concise-summary", reasonCode: "default-final-summary", atomID: id }
    },
  }
}

function isRequestBoundaryPolicy(value: unknown): value is RequestBoundaryPolicy {
  return Boolean(value) && typeof value === "object" && typeof (value as { decide?: unknown }).decide === "function"
}

function isFinalSummaryPolicy(value: unknown): value is FinalSummaryPolicy {
  return Boolean(value) && typeof value === "object" && typeof (value as { decide?: unknown }).decide === "function"
}
