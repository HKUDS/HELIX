import { describe, expect, it } from "vitest"
import {
  buildNanobotTurnNativeExactFixture,
  nanobotAgentLoopUpstreamRef,
  nanobotTurnNativeExactAtomKeys,
  nanobotTurnNativeExactDescriptors,
  nanobotTurnNativeExactEvidenceRef,
  nanobotTurnNativeExactFixtureID,
  nanobotTurnNativeExactFixtureIDForKey,
  nanobotTurnNativeExactReplayRef,
  nanobotTurnNativeExactReplayRefForKey,
  verifyNanobotTurnNativeExactFixture,
} from "@helix/lego-agent-loop/product-schema/nanobot"
import {
  buildAssembledFlowBlueprint,
  buildAssemblyContract,
  buildCurrentModulePlaceholderAudit,
  buildTodo27NativeRewriteInventory,
  verifyAssemblyContract,
} from "@helix/recipes"

const GENERATED_AT = "2026-06-15T00:00:00.000Z"

function metricStrings(graph: ReturnType<typeof buildAssembledFlowBlueprint>, key: "nativeEvidenceRefs" | "fixtureIDs" | "knownLossiness"): Set<string> {
  return new Set(graph.nodes.flatMap((node) => (node.metrics?.[key] ?? []) as string[]))
}

describe("nanobot product turn native exact fixture", () => {
  it("pins Nanobot turn atoms to upstream AgentRunner behavior", () => {
    const fixture = buildNanobotTurnNativeExactFixture()
    const verification = verifyNanobotTurnNativeExactFixture(fixture)

    expect(verification.ok).toBe(true)
    expect(fixture).toMatchObject({
      product: "nanobot",
      upstreamRef: nanobotAgentLoopUpstreamRef,
      evidenceRef: nanobotTurnNativeExactEvidenceRef,
      fixtureID: nanobotTurnNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(fixture.coveredKeys).toEqual([...nanobotTurnNativeExactAtomKeys])
    expect(fixture.atomIDs).toEqual(nanobotTurnNativeExactAtomKeys.map((key) => `nanobot.turn.${key}`))
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("nanobot/agent/runner.py#AgentRunSpec,AgentRunResult,AgentRunner.run"),
      expect.stringContaining("nanobot/agent/tools/registry.py#ToolRegistry.get_definitions"),
      expect.stringContaining("nanobot/providers/openai_compat_provider.py#OpenAICompatibleProvider"),
      expect.stringContaining("nanobot/utils/runtime.py#EMPTY_FINAL_RESPONSE_MESSAGE"),
    ]))
    expect(fixture.sourceRefs.every((ref) => ref.includes("c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"))).toBe(true)

    for (const key of nanobotTurnNativeExactAtomKeys) {
      expect(fixture.nativeEvidenceRefs).toContain(nanobotTurnNativeExactReplayRefForKey(key))
      expect(fixture.fixtureIDs).toContain(nanobotTurnNativeExactFixtureIDForKey(key))
      expect(fixture.records.find((record) => record.key === key)).toMatchObject({
        atomID: `nanobot.turn.${key}`,
        portID: `turn.${key}`,
        evidenceRef: nanobotTurnNativeExactReplayRefForKey(key),
        fixtureID: nanobotTurnNativeExactFixtureIDForKey(key),
      })
    }
  })

  it("fails closed when the native fixture loses pins, records, or lossiness guarantees", () => {
    const fixture = buildNanobotTurnNativeExactFixture()
    const drifted = {
      ...fixture,
      sourceRefs: fixture.sourceRefs.map((ref) => ref.replace("c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7", "HEAD")),
      knownLossiness: ["partial-product-turn-replay"],
      records: fixture.records.slice(1),
    }
    const verification = verifyNanobotTurnNativeExactFixture(drifted)
    const issueIDs = verification.issues.map((issue) => issue.id)

    expect(verification.ok).toBe(false)
    expect(issueIDs).toEqual(expect.arrayContaining([
      "nanobot-turn-native-exact.fingerprint",
      "nanobot-turn-native-exact.lossiness",
      "nanobot-turn-native-exact.upstream",
      "nanobot-turn-native-exact.record-missing",
      "nanobot-turn-native-exact.records",
    ]))
  })
})

describe("nanobot product turn native assembly", () => {
  it("selects Nanobot turn atoms as native factories across contract, flow, inventory, and current audit", () => {
    const contract = buildAssemblyContract({ product: "nanobot", generatedAt: GENERATED_AT })
    const contractVerification = verifyAssemblyContract(contract)
    const atomByID = new Map(contract.atoms.map((atom) => [atom.id, atom]))
    const graph = buildAssembledFlowBlueprint(contract, GENERATED_AT)
    const flowNativeEvidenceRefs = metricStrings(graph, "nativeEvidenceRefs")
    const flowFixtureIDs = metricStrings(graph, "fixtureIDs")
    const flowLossiness = metricStrings(graph, "knownLossiness")
    const inventory = buildTodo27NativeRewriteInventory({ products: ["nanobot"], generatedAt: GENERATED_AT })
    const currentAudit = buildCurrentModulePlaceholderAudit({ products: ["nanobot"], generatedAt: GENERATED_AT })
    const currentAtomItems = currentAudit.items.filter((item) => item.kind === "product-atom")

    expect(contractVerification.ok).toBe(true)

    for (const descriptor of nanobotTurnNativeExactDescriptors) {
      const key = descriptor.id.replace("nanobot.turn.", "") as (typeof nanobotTurnNativeExactAtomKeys)[number]
      const atom = atomByID.get(descriptor.id)
      const inventoryItem = inventory.items.find((item) => item.atomID === descriptor.id)
      const currentItem = currentAtomItems.find((item) => item.product === "nanobot" && item.atomID === descriptor.id)

      expect(atom, descriptor.id).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([nanobotTurnNativeExactEvidenceRef, nanobotTurnNativeExactReplayRef, nanobotTurnNativeExactReplayRefForKey(key)]),
        fixtureIDs: expect.arrayContaining([nanobotTurnNativeExactFixtureID, nanobotTurnNativeExactFixtureIDForKey(key)]),
        knownLossiness: [],
      })
      expect(flowNativeEvidenceRefs, descriptor.id).toContain(nanobotTurnNativeExactReplayRefForKey(key))
      expect(flowFixtureIDs, descriptor.id).toContain(nanobotTurnNativeExactFixtureIDForKey(key))
      expect(flowLossiness, descriptor.id).not.toContain("partial-product-turn-replay")

      expect(inventoryItem, descriptor.id).toMatchObject({
        product: "nanobot",
        ownerSection: "P0-02 Product Turn Atoms Native Rewrite",
        implementationLevel: "native",
        disposition: "product-native-complete",
        parityCoverage: "native",
        fixtureTarget: expect.stringContaining("native-exact-fixture"),
        nativeEvidenceRefs: expect.arrayContaining([nanobotTurnNativeExactEvidenceRef, nanobotTurnNativeExactReplayRef, nanobotTurnNativeExactReplayRefForKey(key)]),
        fixtureIDs: expect.arrayContaining([nanobotTurnNativeExactFixtureID, nanobotTurnNativeExactFixtureIDForKey(key)]),
        knownLossiness: [],
        blocker: "Native proof complete for this atom; no open module blocker remains.",
      })
      expect(currentItem, descriptor.id).toMatchObject({
        product: "nanobot",
        implementationKind: "factory",
        implementationLevel: "native",
        parityCoverage: "native",
        sourceVerificationStatus: "product-native-exact-fixture",
        pinnedUpstreamBehaviorStatus: "pinned-native-exact",
        ownerTODO: "TODO-027",
        evidenceRefs: expect.arrayContaining([
          `native-evidence:${nanobotTurnNativeExactEvidenceRef}`,
          `native-evidence:${nanobotTurnNativeExactReplayRefForKey(key)}`,
          `fixture:${nanobotTurnNativeExactFixtureIDForKey(key)}`,
        ]),
        knownLossiness: [],
      })
    }
  }, 15000)
})
