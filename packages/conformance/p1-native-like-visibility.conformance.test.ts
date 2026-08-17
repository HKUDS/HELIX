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

const NATIVE_CADENCE_ATOMS = [
  { product: "hermes-agent", atomID: "hermes.agent-loop.request-boundary.native-like" },
  { product: "hermes-agent", atomID: "hermes.agent-loop.final-summary.native-like" },
  { product: "hermes-agent", atomID: "hermes.tools.batch-scheduler.native-like" },
  { product: "nanobot", atomID: "nanobot.agent-loop.request-boundary.native-like" },
  { product: "nanobot", atomID: "nanobot.agent-loop.final-summary.native-like" },
  { product: "nanobot", atomID: "nanobot.tools.batch-scheduler.native-like" },
  { product: "nanobot", atomID: "nanobot.tools.result-projector.native-like" },
  { product: "nanobot", atomID: "nanobot.tools.schema.native-like" },
  { product: "hermes-agent", atomID: "hermes.tools.result-projector.native-like" },
  { product: "hermes-agent", atomID: "hermes.tools.schema.native-like" },
  { product: "nanobot", atomID: "nanobot.session.message-part-projector.native-like" },
  { product: "hermes-agent", atomID: "hermes.session.message-part-projector.native-like" },
] as const

function nativeLikeBridgeAtomIDs(graph: ReturnType<typeof buildAssembledFlowBlueprint>): Set<string> {
  return new Set(
    graph.nodes.flatMap((node) =>
      (node.metrics?.bridgeLayers ?? [])
        .filter((layer) => layer.implementationLevel === "native-like")
        .flatMap((layer) => layer.atomIDs),
    ),
  )
}

describe("P1 native-like projection visibility", () => {
  it("keeps P1 native-like projections completed and prevents any native-like residuals", () => {
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
    const nativeLikeItems = inventory.items.filter((item) => item.implementationLevel === "native-like")
    const builderNativeLikeAtoms = builderData.atoms.filter((atom) => atom.implementationLevel === "native-like")
    const currentNativeLikeAtoms = currentModuleAudit.items.filter((item) => item.kind === "product-atom" && item.implementationLevel === "native-like")

    expect(inventory.summary).toMatchObject({
      productNativeComplete: 389,
      rewriteOpenWithPartialEvidence: 0,
      byImplementationLevel: expect.objectContaining({
        "native-like": 0,
        native: 389,
      }),
    })
    expect(nativeLikeItems).toHaveLength(0)
    expect(builderNativeLikeAtoms).toHaveLength(0)
    expect(currentNativeLikeAtoms).toHaveLength(0)
    expect(executableAudit.items.filter((item) => item.implementationLevel === "native-like")).toHaveLength(0)
    expect(currentModuleAudit.items.filter((item) => item.kind === "required-binding" && item.implementationLevel === "native-like")).toHaveLength(0)
    expect(builderData.implementationStates.find((state) => state.level === "native-like")).toMatchObject({
      count: 0,
      selectedCount: 0,
      evidenceCount: 0,
      lossinessCount: 0,
      exampleAtomIDs: [],
    })

    for (const { product, atomID } of NATIVE_CADENCE_ATOMS) {
      const inventoryItem = inventory.items.find((item) => item.product === product && item.atomID === atomID)
      const currentAtom = currentModuleAudit.items.find((item) => item.kind === "product-atom" && item.product === product && item.atomID === atomID)
      const builderAtom = builderData.atoms.find((atom) => atom.id === atomID)

      expect(inventoryItem, atomID).toMatchObject({
        implementationLevel: "native",
        parityCoverage: "native",
        disposition: "product-native-complete",
        knownLossiness: [],
      })
      expect(currentAtom, atomID).toMatchObject({
        implementationLevel: "native",
        parityCoverage: "native",
        sourceVerificationStatus: "product-native-exact-fixture",
        pinnedUpstreamBehaviorStatus: "pinned-native-exact",
        knownLossiness: [],
      })
      expect(builderAtom, atomID).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        parityCoverage: "native",
        knownLossiness: [],
      })
      expect([...(builderAtom?.fixtureIDs ?? []), ...(builderAtom?.nativeEvidenceRefs ?? [])].some((ref) => ref.includes("native-exact")), atomID).toBe(true)
    }

    for (const product of PRODUCTS) {
      const graph = buildAssembledFlowBlueprint(buildAssemblyContract({ product, generatedAt }), generatedAt)
      expect(nativeLikeBridgeAtomIDs(graph).size, product).toBe(0)
      expect(graph.nodes.flatMap((node) => node.metrics?.moduleClaims ?? []).filter((claim) => claim.implementationLevel === "native-like"), product).toHaveLength(0)
    }
  }, 15_000)
})
