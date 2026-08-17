import type { LegoMessagePart } from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import {
  acceptanceControllerToken,
  type AcceptanceController,
  type AcceptanceDecision,
  type CadenceProductPersonality,
} from "../cadence-policies.ts"
import { record } from "./events.ts"

export async function evaluateAcceptanceController(input: {
  hooks: LegoHookHost
  product: CadenceProductPersonality
  step: number
  parts: LegoMessagePart[]
  cwd?: string
  signal?: AbortSignal
}): Promise<AcceptanceDecision> {
  const controller = acceptanceControllerFromServices(input.hooks.services)
  if (!controller) {
    return {
      status: "inconclusive",
      reasonCode: "no-acceptance-controller-bound",
      atomID: "common.runtime.acceptance-controller.default",
    }
  }
  return controller.decide({
    product: input.product,
    step: input.step,
    parts: input.parts,
    ...(input.cwd ? { cwd: input.cwd } : {}),
  })
}

export function acceptanceEvidenceAvailability(decision?: AcceptanceDecision): string[] {
  const evidence = record(decision?.evidence)
  if (!evidence) return []
  const timeline = record(evidence["timeline"])
  const values = timeline ? Object.values(timeline).map(String) : []
  return [...new Set(values)]
}

export function acceptanceUnavailableEvidence(decision?: AcceptanceDecision): string[] {
  const evidence = record(decision?.evidence)
  const unavailableUntil = Array.isArray(evidence?.["unavailableUntil"]) ? evidence["unavailableUntil"] : []
  return unavailableUntil.flatMap((item) => {
    const entry = record(item)
    const evidenceID = typeof entry?.["evidence"] === "string" ? entry["evidence"] : undefined
    return evidenceID ? [evidenceID] : []
  })
}

function acceptanceControllerFromServices(services: Map<string, unknown>): AcceptanceController | undefined {
  const value = services.get(acceptanceControllerToken)
  return Boolean(value) && typeof value === "object" && typeof (value as { decide?: unknown }).decide === "function"
    ? (value as AcceptanceController)
    : undefined
}
