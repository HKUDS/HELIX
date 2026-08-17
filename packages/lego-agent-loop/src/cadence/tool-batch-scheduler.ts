import { createCadenceProductProjector } from "./projectors.ts"
import type { CadenceProductPersonality, ToolBatchScheduler } from "./types.ts"

export function createToolBatchScheduler(product: CadenceProductPersonality): ToolBatchScheduler {
  const projector = createCadenceProductProjector(product)
  const id = projector.profile.toolBatchSchedulerID
  return {
    id,
    plan(input) {
      if (input.toolCalls.length === 0) return []
      return projector.planToolBatches(input.toolCalls)
    },
  }
}
