import { createFinalSummaryPolicy } from "./final-summary.ts"
import { createRequestBoundaryPolicy } from "./request-boundary.ts"
import { createToolBatchScheduler } from "./tool-batch-scheduler.ts"
import type { CadencePolicyBundle, CadenceProductPersonality } from "./types.ts"

export function createCadencePolicyBundle(product: CadenceProductPersonality): CadencePolicyBundle {
  return {
    product,
    requestBoundary: createRequestBoundaryPolicy(product),
    toolBatchScheduler: createToolBatchScheduler(product),
    finalSummary: createFinalSummaryPolicy(product),
  }
}
