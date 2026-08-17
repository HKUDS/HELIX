import { describe, expect, it } from "vitest"
import {
  buildHermesTurnNativeExactFixture,
  hermesAgentLoopUpstreamRef,
  hermesTurnNativeExactAtomKeys,
  hermesTurnNativeExactDescriptors,
  hermesTurnNativeExactEvidenceRef,
  hermesTurnNativeExactFixtureID,
  hermesTurnNativeExactFixtureIDForKey,
  hermesTurnNativeExactReplayRef,
  hermesTurnNativeExactReplayRefForKey,
  verifyHermesTurnNativeExactFixture,
} from "@helix/lego-agent-loop/product-schema/hermes"
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

describe("hermes product turn native exact fixture", () => {
  it("pins Hermes turn atoms to upstream run_conversation behavior", () => {
    const fixture = buildHermesTurnNativeExactFixture()
    const verification = verifyHermesTurnNativeExactFixture(fixture)

    expect(verification.ok).toBe(true)
    expect(fixture).toMatchObject({
      product: "hermes-agent",
      upstreamRef: hermesAgentLoopUpstreamRef,
      evidenceRef: hermesTurnNativeExactEvidenceRef,
      fixtureID: hermesTurnNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(fixture.coveredKeys).toEqual([...hermesTurnNativeExactAtomKeys])
    expect(fixture.atomIDs).toEqual(hermesTurnNativeExactAtomKeys.map((key) => `hermes.turn.${key}`))
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("agent/conversation_loop.py#run_conversation"),
      expect.stringContaining("agent/tool_executor.py#execute_tool_calls_sequential"),
      expect.stringContaining("agent/transports/chat_completions.py#ChatCompletionsTransport"),
      expect.stringContaining("agent/conversation_compression.py#check_compression_model_feasibility"),
    ]))
    expect(fixture.sourceRefs.every((ref) => ref.includes("92a567db2d7a5031df8211efbfdad864c2f51faf"))).toBe(true)

    for (const key of hermesTurnNativeExactAtomKeys) {
      expect(fixture.nativeEvidenceRefs).toContain(hermesTurnNativeExactReplayRefForKey(key))
      expect(fixture.fixtureIDs).toContain(hermesTurnNativeExactFixtureIDForKey(key))
      expect(fixture.records.find((record) => record.key === key)).toMatchObject({
        atomID: `hermes.turn.${key}`,
        portID: `turn.${key}`,
        evidenceRef: hermesTurnNativeExactReplayRefForKey(key),
        fixtureID: hermesTurnNativeExactFixtureIDForKey(key),
      })
    }
  })

  it("fails closed when the native fixture loses pins, records, or lossiness guarantees", () => {
    const fixture = buildHermesTurnNativeExactFixture()
    const drifted = {
      ...fixture,
      sourceRefs: fixture.sourceRefs.map((ref) => ref.replace("92a567db2d7a5031df8211efbfdad864c2f51faf", "HEAD")),
      knownLossiness: ["partial-product-turn-replay"],
      records: fixture.records.slice(1),
    }
    const verification = verifyHermesTurnNativeExactFixture(drifted)
    const issueIDs = verification.issues.map((issue) => issue.id)

    expect(verification.ok).toBe(false)
    expect(issueIDs).toEqual(expect.arrayContaining([
      "hermes-turn-native-exact.fingerprint",
      "hermes-turn-native-exact.lossiness",
      "hermes-turn-native-exact.upstream",
      "hermes-turn-native-exact.record-missing",
      "hermes-turn-native-exact.records",
    ]))
  })
})

describe("hermes product turn native assembly", () => {
  it("selects Hermes turn atoms as native factories across contract, flow, inventory, and current audit", () => {
    const contract = buildAssemblyContract({ product: "hermes-agent", generatedAt: GENERATED_AT })
    const contractVerification = verifyAssemblyContract(contract)
    const atomByID = new Map(contract.atoms.map((atom) => [atom.id, atom]))
    const graph = buildAssembledFlowBlueprint(contract, GENERATED_AT)
    const flowNativeEvidenceRefs = metricStrings(graph, "nativeEvidenceRefs")
    const flowFixtureIDs = metricStrings(graph, "fixtureIDs")
    const flowLossiness = metricStrings(graph, "knownLossiness")
    const inventory = buildTodo27NativeRewriteInventory({ products: ["hermes-agent"], generatedAt: GENERATED_AT })
    const currentAudit = buildCurrentModulePlaceholderAudit({ products: ["hermes-agent"], generatedAt: GENERATED_AT })
    const currentAtomItems = currentAudit.items.filter((item) => item.kind === "product-atom")

    expect(contractVerification.ok).toBe(true)

    for (const descriptor of hermesTurnNativeExactDescriptors) {
      const key = descriptor.id.replace("hermes.turn.", "") as (typeof hermesTurnNativeExactAtomKeys)[number]
      const atom = atomByID.get(descriptor.id)
      const inventoryItem = inventory.items.find((item) => item.atomID === descriptor.id)
      const currentItem = currentAtomItems.find((item) => item.product === "hermes-agent" && item.atomID === descriptor.id)

      expect(atom, descriptor.id).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([hermesTurnNativeExactEvidenceRef, hermesTurnNativeExactReplayRef, hermesTurnNativeExactReplayRefForKey(key)]),
        fixtureIDs: expect.arrayContaining([hermesTurnNativeExactFixtureID, hermesTurnNativeExactFixtureIDForKey(key)]),
        knownLossiness: [],
      })
      expect(flowNativeEvidenceRefs, descriptor.id).toContain(hermesTurnNativeExactReplayRefForKey(key))
      expect(flowFixtureIDs, descriptor.id).toContain(hermesTurnNativeExactFixtureIDForKey(key))
      expect(flowLossiness, descriptor.id).not.toContain("partial-product-turn-replay")

      expect(inventoryItem, descriptor.id).toMatchObject({
        product: "hermes-agent",
        ownerSection: "P0-02 Product Turn Atoms Native Rewrite",
        implementationLevel: "native",
        disposition: "product-native-complete",
        parityCoverage: "native",
        fixtureTarget: expect.stringContaining("native-exact-fixture"),
        nativeEvidenceRefs: expect.arrayContaining([hermesTurnNativeExactEvidenceRef, hermesTurnNativeExactReplayRef, hermesTurnNativeExactReplayRefForKey(key)]),
        fixtureIDs: expect.arrayContaining([hermesTurnNativeExactFixtureID, hermesTurnNativeExactFixtureIDForKey(key)]),
        knownLossiness: [],
        blocker: "Native proof complete for this atom; no open module blocker remains.",
      })
      expect(currentItem, descriptor.id).toMatchObject({
        product: "hermes-agent",
        implementationKind: "factory",
        implementationLevel: "native",
        parityCoverage: "native",
        sourceVerificationStatus: "product-native-exact-fixture",
        pinnedUpstreamBehaviorStatus: "pinned-native-exact",
        ownerTODO: "TODO-027",
        evidenceRefs: expect.arrayContaining([
          `native-evidence:${hermesTurnNativeExactEvidenceRef}`,
          `native-evidence:${hermesTurnNativeExactReplayRefForKey(key)}`,
          `fixture:${hermesTurnNativeExactFixtureIDForKey(key)}`,
        ]),
        knownLossiness: [],
      })
    }
  }, 15000)
})
