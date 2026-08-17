import { describe, expect, it } from "vitest"
import { buildDocsSite, buildHarnessBuilderData } from "@helix/docs-site"
import {
  buildAssembledFlowBlueprint,
  buildAssemblyContract,
  buildCurrentModulePlaceholderAudit,
  buildExecutablePlaceholderAudit,
  buildTodo27NativeRewriteInventory,
} from "@helix/recipes"

const PRODUCT_TURN_KEYS = [
  "input-normalizer",
  "context-builder",
  "prompt-assembler",
  "provider-request-builder",
  "provider-stream-runner",
  "stream-reducer",
  "tool-call-planner",
  "tool-executor",
  "result-recorder",
  "retry-policy",
  "continuation-policy",
  "compaction-policy",
  "stop-condition",
]

const PRODUCTS = [
  { product: "opencode", turnPrefix: "opencode", fixturePrefix: "opencode-turn" },
  { product: "pi-mono", turnPrefix: "pi", fixturePrefix: "pi-mono-turn" },
  { product: "nanobot", turnPrefix: "nanobot", fixturePrefix: "nanobot-turn" },
  { product: "hermes-agent", turnPrefix: "hermes", fixturePrefix: "hermes-agent-turn" },
] as const

const expectedProductTurnIDs = PRODUCTS.flatMap(({ turnPrefix }) => PRODUCT_TURN_KEYS.map((key) => `${turnPrefix}.turn.${key}`))
const expectedProductTurnIDSet = new Set(expectedProductTurnIDs)

function metricStrings(graph: ReturnType<typeof buildAssembledFlowBlueprint>, key: "nativeEvidenceRefs" | "fixtureIDs" | "knownLossiness"): Set<string> {
  return new Set(graph.nodes.flatMap((node) => (node.metrics?.[key] ?? []) as string[]))
}

function profileCompatibleBridgeAtomIDs(graph: ReturnType<typeof buildAssembledFlowBlueprint>): Set<string> {
  return new Set(
    graph.nodes.flatMap((node) =>
      (node.metrics?.bridgeLayers ?? [])
        .filter((layer) => layer.implementationLevel === "profile-compatible")
        .flatMap((layer) => layer.atomIDs),
    ),
  )
}

describe("product turn profile-compatible visibility", () => {
  it("keeps product turn atoms visible after the profile-compatible queue drains", () => {
    const docsSite = buildDocsSite({ cwd: process.cwd(), generatedAt: "2026-06-10T00:00:00.000Z" })
    const builderData = buildHarnessBuilderData(docsSite)
    const inventory = buildTodo27NativeRewriteInventory({ generatedAt: "2026-06-10T00:00:00.000Z" })
    const executableAudit = buildExecutablePlaceholderAudit({
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal"],
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const currentModuleAudit = buildCurrentModulePlaceholderAudit({
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      generatedAt: "2026-06-10T00:00:00.000Z",
    })

    const builderTurnAtoms = builderData.atoms.filter((atom) => expectedProductTurnIDSet.has(atom.id))
    const inventoryTurnItems = inventory.items.filter((item) => expectedProductTurnIDSet.has(item.atomID))
    const executableTurnItems = executableAudit.items.filter((item) => expectedProductTurnIDSet.has(item.selectedAtomID))
    const currentTurnAtomItems = currentModuleAudit.items.filter((item) => item.kind === "product-atom" && expectedProductTurnIDSet.has(item.atomID ?? ""))
    const currentTurnBindingItems = currentModuleAudit.items.filter((item) => item.kind === "required-binding" && expectedProductTurnIDSet.has(item.atomID ?? ""))

    expect(expectedProductTurnIDs).toHaveLength(52)
    expect(builderTurnAtoms).toHaveLength(52)
    expect(inventoryTurnItems).toHaveLength(52)
    expect(executableTurnItems).toHaveLength(52)
    expect(currentTurnAtomItems).toHaveLength(52)
    expect(currentTurnBindingItems).toHaveLength(52)

    const profileState = builderData.implementationStates.find((state) => state.level === "profile-compatible")
    expect(profileState?.count ?? 0).toBe(0)
    expect(profileState?.selectedCount ?? 0).toBe(0)
    expect(profileState?.evidenceCount ?? 0).toBe(0)
    expect(profileState?.lossinessCount ?? 0).toBe(0)

    expect(builderTurnAtoms.filter((atom) => atom.implementationLevel === "profile-compatible")).toEqual([])
    expect(inventoryTurnItems.filter((item) => item.implementationLevel === "profile-compatible")).toEqual([])
    expect(executableTurnItems.filter((item) => item.implementationLevel === "profile-compatible")).toEqual([])
    expect(currentTurnAtomItems.filter((item) => item.implementationLevel === "profile-compatible")).toEqual([])
    expect(currentTurnBindingItems.filter((item) => item.implementationLevel === "profile-compatible")).toEqual([])

    for (const { product, turnPrefix } of PRODUCTS) {
      const contract = buildAssemblyContract({ product, generatedAt: "2026-06-10T00:00:00.000Z" })
      const atomByID = new Map(contract.atoms.map((atom) => [atom.id, atom]))
      const graph = buildAssembledFlowBlueprint(contract, "2026-06-10T00:00:00.000Z")
      const flowLossiness = metricStrings(graph, "knownLossiness")
      const flowProfileBridgeAtomIDs = profileCompatibleBridgeAtomIDs(graph)

      for (const key of PRODUCT_TURN_KEYS) {
        const atomID = `${turnPrefix}.turn.${key}`

        expect(atomByID.get(atomID), atomID).toMatchObject({
          implementationKind: "factory",
          parityCoverage: "native",
          knownLossiness: [],
        })

        expect(builderData.atoms.find((atom) => atom.id === atomID), atomID).toMatchObject({
          implementationKind: "factory",
          implementationLevel: "native",
          implementationLabel: "Native",
          parityCoverage: "native",
          knownLossiness: [],
        })

        expect(flowLossiness, atomID).not.toContain("partial-product-turn-replay")
        expect(flowProfileBridgeAtomIDs, atomID).not.toContain(atomID)

        expect(inventoryTurnItems.find((item) => item.atomID === atomID), atomID).toMatchObject({
          product,
          ownerSection: "P0-02 Product Turn Atoms Native Rewrite",
          implementationLevel: "native",
          disposition: "product-native-complete",
          parityCoverage: "native",
          knownLossiness: [],
          blocker: "Native proof complete for this atom; no open module blocker remains.",
        })

        expect(executableTurnItems.find((item) => item.product === product && item.selectedAtomID === atomID), atomID).toMatchObject({
          implementationLevel: "native",
          parityCoverage: "native",
          knownLossiness: [],
        })

        expect(currentTurnAtomItems.find((item) => item.product === product && item.atomID === atomID), atomID).toMatchObject({
          implementationLevel: "native",
          parityCoverage: "native",
          sourceVerificationStatus: "product-native-exact-fixture",
          pinnedUpstreamBehaviorStatus: "pinned-native-exact",
          ownerTODO: "TODO-027",
          knownLossiness: [],
        })

        const bindingItem = currentTurnBindingItems.find((item) => item.product === product && item.atomID === atomID)
        expect(bindingItem?.implementationLevel, atomID).not.toBe("profile-compatible")
        expect(bindingItem?.parityCoverage, atomID).not.toBe("profile-compatible")
        expect(bindingItem?.knownLossiness ?? [], atomID).not.toContain("partial-product-turn-replay")
      }
    }
  }, 15000)
})
