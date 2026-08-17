import { describe, expect, it } from "vitest"
import { buildDocsSite, buildHarnessBuilderData } from "@helix/docs-site"
import {
  buildAssembledFlowBlueprint,
  buildAssemblyContract,
  buildCurrentModulePlaceholderAudit,
  buildExecutablePlaceholderAudit,
  buildTodo27NativeRewriteInventory,
} from "@helix/recipes"

const PRODUCTS = ["hermes-agent", "nanobot", "opencode", "pi-mono"] as const

function compatibleBridgeEntries(graph: ReturnType<typeof buildAssembledFlowBlueprint>): Array<{ nodeID: string; atomID: string }> {
  return graph.nodes.flatMap((node) =>
    (node.metrics?.bridgeLayers ?? [])
      .filter((layer) => layer.implementationLevel === "compatible-bridge")
      .flatMap((layer) => layer.atomIDs.map((atomID) => ({ nodeID: node.id, atomID }))),
  )
}

describe("compatible bridge visibility", () => {
  it("keeps the completed TODO27 compatible bridge set empty across Builder, Flow, and audits", () => {
    const generatedAt = "2026-06-10T00:00:00.000Z"
    const docsSite = buildDocsSite({ cwd: process.cwd(), generatedAt })
    const builderData = buildHarnessBuilderData(docsSite)
    const inventory = buildTodo27NativeRewriteInventory({ generatedAt })
    const currentModuleAudit = buildCurrentModulePlaceholderAudit({
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      generatedAt,
    })
    const executableAudit = buildExecutablePlaceholderAudit({
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal"],
      generatedAt,
    })

    const bridgeItems = inventory.items.filter((item) => item.implementationLevel === "compatible-bridge")
    const currentBridgeAtoms = currentModuleAudit.items.filter((item) => item.kind === "product-atom" && item.implementationLevel === "compatible-bridge")
    const currentBridgeBindings = currentModuleAudit.items.filter((item) => item.kind === "required-binding" && item.implementationLevel === "compatible-bridge")
    const executableBridgeItems = executableAudit.items.filter((item) => item.implementationLevel === "compatible-bridge")

    expect(inventory.summary).toMatchObject({
      productNativeComplete: 389,
      rewriteOpenWithPartialEvidence: 0,
      byImplementationLevel: expect.objectContaining({
        "compatible-bridge": 0,
        native: 389,
      }),
    })
    expect(bridgeItems).toHaveLength(0)
    expect(builderData.implementationStates.find((state) => state.level === "compatible-bridge")).toMatchObject({
      count: 0,
      selectedCount: 0,
      evidenceCount: 0,
      lossinessCount: 0,
      exampleAtomIDs: [],
    })
    expect(currentBridgeAtoms).toHaveLength(0)
    expect(currentBridgeBindings).toHaveLength(0)
    expect(executableBridgeItems).toHaveLength(0)

    for (const product of PRODUCTS) {
      const graph = buildAssembledFlowBlueprint(buildAssemblyContract({ product, generatedAt }), generatedAt)
      expect(compatibleBridgeEntries(graph), product).toHaveLength(0)
      expect(graph.nodes.flatMap((node) => node.metrics?.moduleClaims ?? []).filter((claim) => claim.implementationLevel === "compatible-bridge"), product).toHaveLength(0)
      expect(graph.nodes.flatMap((node) => node.metrics?.parityTargetBlockers ?? []), product).not.toContain("module-claim-compatible-bridge")
    }
  }, 15_000)
})
