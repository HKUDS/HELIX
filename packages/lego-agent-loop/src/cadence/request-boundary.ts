import { createCadenceProductProjector } from "./projectors.ts"
import type { CadenceProductPersonality, RequestBoundaryPolicy } from "./types.ts"

export function createRequestBoundaryPolicy(product: CadenceProductPersonality): RequestBoundaryPolicy {
  const projector = createCadenceProductProjector(product)
  const id = projector.profile.requestBoundaryID
  return {
    id,
    decide(input) {
      return projector.decideRequestBoundary(input)
    },
  }
}
