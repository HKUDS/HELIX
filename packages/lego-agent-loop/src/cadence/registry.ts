import type { CadenceProductPersonality, FinalSummaryDecision } from "./types.ts"

export interface CadencePolicyProfile {
  product: CadenceProductPersonality
  prefix: string
  requestBoundaryID: string
  toolBatchSchedulerID: string
  finalSummaryID: string
  toolBatch: "default" | "opencode-native" | "native-sequential"
  acceptedFinalSummary: FinalSummaryDecision
}

const cadencePolicyRegistry: Record<CadenceProductPersonality, CadencePolicyProfile> = {
  common: {
    product: "common",
    prefix: "common",
    requestBoundaryID: "common.agent-loop.request-boundary.default",
    toolBatchSchedulerID: "common.tools.batch-scheduler.default",
    finalSummaryID: "common.agent-loop.final-summary.default",
    toolBatch: "default",
    acceptedFinalSummary: "native-final-message",
  },
  opencode: {
    product: "opencode",
    prefix: "opencode",
    requestBoundaryID: "opencode.agent-loop.request-boundary.native-like",
    toolBatchSchedulerID: "opencode.tools.batch-scheduler.native-like",
    finalSummaryID: "opencode.agent-loop.final-summary.native-like",
    toolBatch: "opencode-native",
    acceptedFinalSummary: "native-final-message",
  },
  "pi-mono": {
    product: "pi-mono",
    prefix: "pi",
    requestBoundaryID: "pi.agent-loop.request-boundary.native-like",
    toolBatchSchedulerID: "pi.tools.batch-scheduler.native-like",
    finalSummaryID: "pi.agent-loop.final-summary.native-like",
    toolBatch: "native-sequential",
    acceptedFinalSummary: "none",
  },
  nanobot: {
    product: "nanobot",
    prefix: "nanobot",
    requestBoundaryID: "nanobot.agent-loop.request-boundary.native-like",
    toolBatchSchedulerID: "nanobot.tools.batch-scheduler.native-like",
    finalSummaryID: "nanobot.agent-loop.final-summary.native-like",
    toolBatch: "native-sequential",
    acceptedFinalSummary: "none",
  },
  "hermes-agent": {
    product: "hermes-agent",
    prefix: "hermes",
    requestBoundaryID: "hermes.agent-loop.request-boundary.native-like",
    toolBatchSchedulerID: "hermes.tools.batch-scheduler.native-like",
    finalSummaryID: "hermes.agent-loop.final-summary.native-like",
    toolBatch: "native-sequential",
    acceptedFinalSummary: "native-final-message",
  },
}

export const cadencePolicyProducts = Object.keys(cadencePolicyRegistry) as CadenceProductPersonality[]

export function getCadencePolicyProfile(product: CadenceProductPersonality): CadencePolicyProfile {
  return cadencePolicyRegistry[product]
}
