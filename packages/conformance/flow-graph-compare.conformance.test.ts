import { describe, expect, it } from "vitest"
import {
  buildHarnessFlowComparison,
  canonicalFlowStages,
  verifyHarnessFlowArtifact,
  type HarnessFlowComparison,
} from "@helix/recipes"
import type { HarnessProduct } from "@helix/recipes"

const products: HarnessProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
const generatedAt = "2026-06-09T00:00:00.000Z"
const canonicalStageIDs = canonicalFlowStages.map((stage) => stage.id)
const canonicalEdgePairs = canonicalFlowStages.slice(0, -1).map((stage, index) => {
  const next = canonicalFlowStages[index + 1]
  if (!next) throw new Error(`Missing next canonical stage after ${stage.id}`)
  return `${stage.id}->${next.id}`
})

describe("flow graph comparison alignment", () => {
  it.each(products)("aligns assembled and original %s flows on canonical stages", (product) => {
    const comparison = buildHarnessFlowComparison({
      product,
      taskID: "read-only-answer",
      generatedAt,
    })
    expect(verifyHarnessFlowArtifact(comparison).ok).toBe(true)
    expect(comparison.product).toBe(product)
    expect(comparison.taskID).toBe("read-only-answer")
    expect(comparison.assembled.source).toBe("assembled")
    expect(comparison.original.source).toBe("original")
    expect(comparison.assembled.product).toBe(product)
    expect(comparison.original.product).toBe(product)
    expect(comparison.assembled.nodes.map((node) => node.id)).toEqual(canonicalStageIDs)
    expect(comparison.original.nodes.map((node) => node.id)).toEqual(canonicalStageIDs)
    expect(comparison.assembled.edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual(canonicalEdgePairs)
    expect(comparison.original.edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual(canonicalEdgePairs)
    expect(comparison.summary.stages).toBe(canonicalFlowStages.length)

    expectSameStageSpine(comparison)
    expectDiffsAreAnchoredToAlignedStages(comparison)
    expectOriginalEvidenceRefsResolve(comparison)
  })

  it("keeps Hermes Agent native-visible stages explicitly lossy without breaking alignment", () => {
    const comparison = buildHarnessFlowComparison({
      product: "hermes-agent",
      taskID: "read-only-answer",
      generatedAt,
    })
    const originalByID = new Map(comparison.original.nodes.map((node) => [node.id, node]))

    expect(originalByID.get("provider.request")?.observability.lossiness).toBe("aggregated")
    expect(originalByID.get("provider.stream")?.observability.lossiness).toBe("aggregated")
    expect(originalByID.get("stream.project")?.observability.lossiness).toBe("aggregated")
    expect(comparison.original.nodes.some((node) => node.observability.lossiness === "inferred" || node.observability.lossiness === "unobservable")).toBe(true)
    expect(comparison.diffs.every((diff) => originalByID.has(diff.stageID))).toBe(true)
    const providerRequestBoundary = comparison.original.edges.find((edge) => edge.id === "prompt.assemble->provider.request")?.hookPoints[0]
    expect(providerRequestBoundary).toMatchObject({
      event: "provider.request.before",
      observerCount: 1,
      handlerCount: 0,
      observability: { lossiness: "aggregated", evidence: "native-event-tap" },
      sources: [expect.objectContaining({ source: "pre_llm_call", adapterSource: "Hermes native plugin event tap" })],
    })
    const permissionBoundary = comparison.original.edges.find((edge) => edge.id === "tool.plan->tool.permission")?.hookPoints[0]
    expect(permissionBoundary).toMatchObject({
      event: "permission.ask",
      observerCount: 0,
      handlerCount: 0,
      sourceCount: 0,
      sources: [],
      observability: { lossiness: "unobservable", evidence: "native-hook-unobservable" },
    })
  })
})

function expectSameStageSpine(comparison: HarnessFlowComparison): void {
  const originalByID = new Map(comparison.original.nodes.map((node) => [node.id, node]))
  for (const assembledNode of comparison.assembled.nodes) {
    const originalNode = originalByID.get(assembledNode.id)
    expect(originalNode, `missing original stage ${assembledNode.id}`).toBeDefined()
    expect(originalNode?.order).toBe(assembledNode.order)
    expect(originalNode?.lane).toBe(assembledNode.lane)
    expect(originalNode?.plane).toBe(assembledNode.plane)
    expect(originalNode?.inputSummary).toBe(assembledNode.inputSummary)
    expect(originalNode?.outputSummary).toBe(assembledNode.outputSummary)
  }
}

function expectDiffsAreAnchoredToAlignedStages(comparison: HarnessFlowComparison): void {
  const assembledByID = new Map(comparison.assembled.nodes.map((node) => [node.id, node]))
  const originalByID = new Map(comparison.original.nodes.map((node) => [node.id, node]))
  for (const diff of comparison.diffs) {
    const assembledNode = assembledByID.get(diff.stageID)
    const originalNode = originalByID.get(diff.stageID)
    expect(assembledNode, `diff ${diff.id} points at missing assembled stage ${diff.stageID}`).toBeDefined()
    expect(originalNode, `diff ${diff.id} points at missing original stage ${diff.stageID}`).toBeDefined()
    expect(originalNode?.order).toBe(assembledNode?.order)
  }
}

function expectOriginalEvidenceRefsResolve(comparison: HarnessFlowComparison): void {
  const evidenceIDs = new Set(comparison.original.evidence.map((item) => item.id))
  const refs = comparison.original.nodes.flatMap((node) => node.originalEvidenceRefs.map((ref) => ({ stageID: node.id, ref })))
  expect(refs.length).toBeGreaterThan(0)
  for (const { stageID, ref } of refs) {
    expect(evidenceIDs.has(ref), `original stage ${stageID} references missing evidence ${ref}`).toBe(true)
  }
}
