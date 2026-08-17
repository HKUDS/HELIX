import { selectTurnPipelineStrategies, type TurnPipelineStrategyOverride } from "@helix/lego-agent-loop"

export interface RecipeLevelPipelineSwap {
  id: "opencode.pi-continuation-policy" | "pi.opencode-cursor-context" | "neutral.minimal-policy-set"
  baseRecipe: "opencode.full" | "pi-mono.full" | "coding-agent.minimal"
  description: string
  sessionBinding?: {
    port: string
    module: string
  }
  overrides: TurnPipelineStrategyOverride[]
}

export interface RecipeLevelPipelineSwapReport {
  ok: boolean
  issues: string[]
  swaps: RecipeLevelPipelineSwap[]
}

export const recipeLevelPipelineSwaps: RecipeLevelPipelineSwap[] = [
  {
    id: "opencode.pi-continuation-policy",
    baseRecipe: "opencode.full",
    description: "OpenCode session recipe target using Pi continuation semantics through strategy binding only.",
    overrides: [{ atomID: "turn.continuation-policy", strategy: "pi.turn.continuation-policy", personality: "pi-mono" }],
  },
  {
    id: "pi.opencode-cursor-context",
    baseRecipe: "pi-mono.full",
    description: "Pi session recipe target using OpenCode-style cursor context/page selection through strategy binding only.",
    sessionBinding: {
      port: "session.pagination",
      module: "opencode.session.pagination.update-time-cursor",
    },
    overrides: [{ atomID: "turn.context-builder", strategy: "opencode.turn.context-builder", personality: "opencode" }],
  },
  {
    id: "neutral.minimal-policy-set",
    baseRecipe: "coding-agent.minimal",
    description: "Neutral target with common-only retry, continuation, compaction, and stop policies.",
    overrides: [
      { atomID: "turn.retry-policy", strategy: "turn.retry-policy.none", personality: "common" },
      { atomID: "turn.continuation-policy", strategy: "turn.continuation-policy.none", personality: "common" },
      { atomID: "turn.compaction-policy", strategy: "turn.compaction-policy.none", personality: "common" },
      { atomID: "turn.stop-condition", strategy: "turn.stop-condition.max-steps", personality: "common" },
    ],
  },
]

export function auditRecipeLevelPipelineSwaps(swaps: RecipeLevelPipelineSwap[] = recipeLevelPipelineSwaps): RecipeLevelPipelineSwapReport {
  const issues: string[] = []
  for (const swap of swaps) {
    if (swap.overrides.length === 0) issues.push(`${swap.id} has no strategy overrides`)
    const personality = swap.baseRecipe === "opencode.full" ? "opencode" : swap.baseRecipe === "pi-mono.full" ? "pi-mono" : "common"
    const selected = selectTurnPipelineStrategies({ personality, overrides: swap.overrides })
    for (const override of swap.overrides) {
      const selection = selected.find((candidate) => candidate.atomID === override.atomID)
      if (!selection) {
        issues.push(`${swap.id} override ${override.atomID} is not a known turn pipeline atom`)
        continue
      }
      if (selection.strategy !== override.strategy || selection.selectedBy !== "override") {
        issues.push(`${swap.id} did not select override ${override.strategy} for ${override.atomID}`)
      }
    }
  }
  const ids = new Set(swaps.map((swap) => swap.id))
  for (const id of ["opencode.pi-continuation-policy", "pi.opencode-cursor-context", "neutral.minimal-policy-set"] as const) {
    if (!ids.has(id)) issues.push(`missing recipe-level pipeline swap ${id}`)
  }
  return {
    ok: issues.length === 0,
    issues,
    swaps,
  }
}
