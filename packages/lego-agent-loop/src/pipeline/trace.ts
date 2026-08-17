import type { EventEnvelope, SessionID } from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { TurnPipelineAtomID } from "./ids.ts"

export interface TurnPipelineTracePayload {
  atomID: TurnPipelineAtomID
  phase: "start" | "end" | "decision" | "error"
  step?: number
  attempt?: number
  details?: Record<string, unknown>
}

export async function emitTurnPipelineTrace(
  hooks: LegoHookHost,
  input: {
    sessionID: SessionID
    atomID: TurnPipelineAtomID
    phase: TurnPipelineTracePayload["phase"]
    step?: number
    attempt?: number
    details?: Record<string, unknown>
    signal?: AbortSignal
  },
): Promise<void> {
  const payload: TurnPipelineTracePayload = {
    atomID: input.atomID,
    phase: input.phase,
    ...(input.step === undefined ? {} : { step: input.step }),
    ...(input.attempt === undefined ? {} : { attempt: input.attempt }),
    ...(input.details ? { details: input.details } : {}),
  }
  await hooks.emit(
    {
      type: "turn.pipeline.trace" as never,
      sessionID: input.sessionID,
      timestamp: Date.now(),
      payload,
    } satisfies EventEnvelope,
    input.signal,
  )
}
