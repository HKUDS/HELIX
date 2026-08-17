import { cadencePolicyProducts, getCadencePolicyProfile } from "./registry.ts"
import { buildCadenceReplayAtomSnapshot, cadenceReplayProducts, type CadenceReplayAtomKey } from "./replay.ts"
import type { CadencePolicyDescriptor, CadenceProductPersonality } from "./types.ts"

export function cadencePolicyDescriptors(product?: CadenceProductPersonality): CadencePolicyDescriptor[] {
  const products = product ? [product] : cadencePolicyProducts
  return products.flatMap((item) => {
    const profile = getCadencePolicyProfile(item)
    const replay = cadenceReplayMetadata(item)
    return [
      {
        id: profile.requestBoundaryID,
        port: "agent-loop.request-boundary",
        product: item,
        plane: "agent-loop",
        role: "provider request and turn continuation boundary policy",
        ...replay("request-boundary"),
      },
      {
        id: profile.toolBatchSchedulerID,
        port: "tools.batch-scheduler",
        product: item,
        plane: "tools",
        role: "tool execution batch planning policy",
        ...replay("tool-batch-scheduler"),
      },
      {
        id: profile.finalSummaryID,
        port: "agent-loop.final-summary",
        product: item,
        plane: "agent-loop",
        role: "final assistant summary and extra provider round policy",
        ...replay("final-summary"),
      },
    ]
  })
}

function cadenceReplayMetadata(product: CadenceProductPersonality): (key: CadenceReplayAtomKey) => Pick<CadencePolicyDescriptor, "nativeFixtureSource" | "replay"> {
  if (!cadenceReplayProducts.includes(product as (typeof cadenceReplayProducts)[number])) return () => ({})
  return (key) => {
    const replay = buildCadenceReplayAtomSnapshot(product as (typeof cadenceReplayProducts)[number], key)
    return {
      nativeFixtureSource: replay.nativeFixtureSource,
      replay,
    }
  }
}
