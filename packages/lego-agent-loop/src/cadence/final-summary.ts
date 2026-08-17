import { createCadenceProductProjector } from "./projectors.ts"
import type { CadenceProductPersonality, FinalSummaryPolicy } from "./types.ts"

export function createFinalSummaryPolicy(product: CadenceProductPersonality): FinalSummaryPolicy {
  const projector = createCadenceProductProjector(product)
  const id = projector.profile.finalSummaryID
  return {
    id,
    decide(input) {
      return projector.decideFinalSummary(input)
    },
  }
}
