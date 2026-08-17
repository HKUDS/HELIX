import { describe, expect, it } from "vitest"
import {
  buildHermesAgentLoopNativeExactFixture,
  hermesAgentLoopFinalSummaryNativeExactAtomID,
  hermesAgentLoopFinalSummaryNativeExactEvidenceRef,
  hermesAgentLoopFinalSummaryNativeExactFixtureID,
  hermesAgentLoopFinalSummaryNativeExactReplayRef,
  hermesAgentLoopNativeExactDescriptors,
  hermesAgentLoopRequestBoundaryNativeExactAtomID,
  hermesAgentLoopRequestBoundaryNativeExactEvidenceRef,
  hermesAgentLoopRequestBoundaryNativeExactFixtureID,
  hermesAgentLoopRequestBoundaryNativeExactReplayRef,
  hermesAgentLoopUpstreamRef,
  verifyHermesAgentLoopNativeExactFixture,
} from "@helix/lego-agent-loop/product-schema/hermes"
import {
  buildNanobotAgentLoopNativeExactFixture,
  nanobotAgentLoopFinalSummaryNativeExactAtomID,
  nanobotAgentLoopFinalSummaryNativeExactEvidenceRef,
  nanobotAgentLoopFinalSummaryNativeExactFixtureID,
  nanobotAgentLoopFinalSummaryNativeExactReplayRef,
  nanobotAgentLoopNativeExactDescriptors,
  nanobotAgentLoopRequestBoundaryNativeExactAtomID,
  nanobotAgentLoopRequestBoundaryNativeExactEvidenceRef,
  nanobotAgentLoopRequestBoundaryNativeExactFixtureID,
  nanobotAgentLoopRequestBoundaryNativeExactReplayRef,
  nanobotAgentLoopUpstreamRef,
  verifyNanobotAgentLoopNativeExactFixture,
} from "@helix/lego-agent-loop/product-schema/nanobot"
import {
  buildHermesToolBatchSchedulerNativeExactFixture,
  hermesToolBatchSchedulerNativeDescriptor,
  hermesToolBatchSchedulerNativeExactAtomID,
  hermesToolBatchSchedulerNativeExactEvidenceRef,
  hermesToolBatchSchedulerNativeExactFixtureID,
  hermesToolBatchSchedulerNativeExactReplayRef,
  verifyHermesToolBatchSchedulerNativeExactFixture,
} from "@helix/lego-tools/product-schema/hermes"
import {
  buildNanobotToolBatchSchedulerNativeExactFixture,
  nanobotToolBatchSchedulerNativeDescriptor,
  nanobotToolBatchSchedulerNativeExactAtomID,
  nanobotToolBatchSchedulerNativeExactEvidenceRef,
  nanobotToolBatchSchedulerNativeExactFixtureID,
  nanobotToolBatchSchedulerNativeExactReplayRef,
  verifyNanobotToolBatchSchedulerNativeExactFixture,
} from "@helix/lego-tools/product-schema/nanobot"
import {
  buildAssemblyContract,
  buildCurrentModulePlaceholderAudit,
  buildTodo27NativeRewriteInventory,
  verifyAssemblyContract,
} from "@helix/recipes"

const GENERATED_AT = "2026-06-15T00:00:00.000Z"

const cadenceNativeDescriptors = [
  ...hermesAgentLoopNativeExactDescriptors,
  hermesToolBatchSchedulerNativeDescriptor,
  ...nanobotAgentLoopNativeExactDescriptors,
  nanobotToolBatchSchedulerNativeDescriptor,
]

describe("Hermes and Nanobot cadence native exact fixtures", () => {
  it("pins request-boundary and final-summary behavior to native upstream loops", () => {
    const hermes = buildHermesAgentLoopNativeExactFixture()
    const nanobot = buildNanobotAgentLoopNativeExactFixture()

    expect(verifyHermesAgentLoopNativeExactFixture(hermes)).toEqual({ ok: true, issues: [] })
    expect(verifyNanobotAgentLoopNativeExactFixture(nanobot)).toEqual({ ok: true, issues: [] })

    expect(hermes).toMatchObject({
      product: "hermes-agent",
      upstreamRef: hermesAgentLoopUpstreamRef,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      atomIDs: [hermesAgentLoopRequestBoundaryNativeExactAtomID, hermesAgentLoopFinalSummaryNativeExactAtomID],
      nativeEvidenceRefs: [
        hermesAgentLoopRequestBoundaryNativeExactEvidenceRef,
        hermesAgentLoopRequestBoundaryNativeExactReplayRef,
        hermesAgentLoopFinalSummaryNativeExactEvidenceRef,
        hermesAgentLoopFinalSummaryNativeExactReplayRef,
      ],
      fixtureIDs: [hermesAgentLoopRequestBoundaryNativeExactFixtureID, hermesAgentLoopFinalSummaryNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(hermes.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("agent/conversation_loop.py#run_conversation"),
      expect.stringContaining("agent/tool_executor.py#execute_tool_calls_sequential"),
      expect.stringContaining("agent/context_engine.py#ContextEngine.should_compress"),
    ]))
    expect(hermes.records.find((record) => record.atomID === hermesAgentLoopRequestBoundaryNativeExactAtomID)?.eventOrder).toEqual(expect.arrayContaining([
      "provider request",
      "execute native tool batch",
      "append tool results",
    ]))

    expect(nanobot).toMatchObject({
      product: "nanobot",
      upstreamRef: nanobotAgentLoopUpstreamRef,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      atomIDs: [nanobotAgentLoopRequestBoundaryNativeExactAtomID, nanobotAgentLoopFinalSummaryNativeExactAtomID],
      nativeEvidenceRefs: [
        nanobotAgentLoopRequestBoundaryNativeExactEvidenceRef,
        nanobotAgentLoopRequestBoundaryNativeExactReplayRef,
        nanobotAgentLoopFinalSummaryNativeExactEvidenceRef,
        nanobotAgentLoopFinalSummaryNativeExactReplayRef,
      ],
      fixtureIDs: [nanobotAgentLoopRequestBoundaryNativeExactFixtureID, nanobotAgentLoopFinalSummaryNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(nanobot.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("nanobot/agent/runner.py#AgentRunner.run"),
      expect.stringContaining("nanobot/agent/runner.py#_execute_tools"),
      expect.stringContaining("nanobot/utils/runtime.py#EMPTY_FINAL_RESPONSE_MESSAGE"),
    ]))
    expect(nanobot.records.find((record) => record.atomID === nanobotAgentLoopRequestBoundaryNativeExactAtomID)?.eventOrder).toEqual(expect.arrayContaining([
      "provider request",
      "tool batch execution",
      "tool results appended",
    ]))
  })

  it("pins tool batch scheduling to native upstream schedulers", () => {
    const hermes = buildHermesToolBatchSchedulerNativeExactFixture()
    const nanobot = buildNanobotToolBatchSchedulerNativeExactFixture()

    expect(verifyHermesToolBatchSchedulerNativeExactFixture(hermes)).toEqual({ ok: true, issues: [] })
    expect(verifyNanobotToolBatchSchedulerNativeExactFixture(nanobot)).toEqual({ ok: true, issues: [] })

    expect(hermes).toMatchObject({
      product: "hermes-agent",
      atomID: hermesToolBatchSchedulerNativeExactAtomID,
      evidenceRef: hermesToolBatchSchedulerNativeExactEvidenceRef,
      fixtureID: hermesToolBatchSchedulerNativeExactFixtureID,
      nativeEvidenceRefs: [hermesToolBatchSchedulerNativeExactEvidenceRef, hermesToolBatchSchedulerNativeExactReplayRef],
      fixtureIDs: [hermesToolBatchSchedulerNativeExactFixtureID],
      knownLossiness: [],
      schedulingDecision: {
        defaultMode: "sequential",
        maxWorkers: 8,
        resultAppendOrder: "source-tool-call-order",
      },
      parallelSafety: {
        neverParallelTools: ["clarify"],
        pathOverlapBlocksParallel: true,
        mcpToolsRequireRegistryParallelSafe: true,
      },
    })

    expect(nanobot).toMatchObject({
      product: "nanobot",
      atomID: nanobotToolBatchSchedulerNativeExactAtomID,
      evidenceRef: nanobotToolBatchSchedulerNativeExactEvidenceRef,
      fixtureID: nanobotToolBatchSchedulerNativeExactFixtureID,
      nativeEvidenceRefs: [nanobotToolBatchSchedulerNativeExactEvidenceRef, nanobotToolBatchSchedulerNativeExactReplayRef],
      fixtureIDs: [nanobotToolBatchSchedulerNativeExactFixtureID],
      knownLossiness: [],
      schedulingDecision: {
        disabledConcurrency: "one-tool-call-per-batch",
        enabledConcurrency: "adjacent-concurrency-safe-tools-share-a-batch",
        unsafeToolBoundary: "flush-current-safe-batch-then-run-unsafe-tool-alone",
      },
      executionSemantics: {
        safeBatchExecution: "asyncio.gather",
        toolResultAppendOrder: "source-tool-call-order",
      },
    })
  })

  it("fails closed when cadence fixtures lose pins or native guarantees", () => {
    const hermesAgentLoop = buildHermesAgentLoopNativeExactFixture()
    const nanobotBatch = buildNanobotToolBatchSchedulerNativeExactFixture()

    expect(verifyHermesAgentLoopNativeExactFixture({
      ...hermesAgentLoop,
      sourceRefs: hermesAgentLoop.sourceRefs.map((ref) => ref.replace("92a567db2d7a5031df8211efbfdad864c2f51faf", "HEAD")),
      knownLossiness: ["partial-cadence-replay"],
      records: hermesAgentLoop.records.slice(1),
    }).issues.map((issue) => issue.id)).toEqual(expect.arrayContaining([
      "hermes-agent-loop-native-exact.fingerprint",
      "hermes-agent-loop-native-exact.lossiness",
      "hermes-agent-loop-native-exact.records",
      "hermes-agent-loop-native-exact.upstream",
      "hermes-agent-loop-native-exact.record-missing",
    ]))

    expect(verifyNanobotToolBatchSchedulerNativeExactFixture({
      ...nanobotBatch,
      sourceRefs: [],
      knownLossiness: ["partial-cadence-replay"],
      executionSemantics: {
        ...nanobotBatch.executionSemantics,
        toolResultAppendOrder: "completion-order" as unknown as typeof nanobotBatch.executionSemantics.toolResultAppendOrder,
      },
    }).issues.map((issue) => issue.id)).toEqual(expect.arrayContaining([
      "nanobot-tool-batch-scheduler-native-exact.fingerprint",
      "nanobot-tool-batch-scheduler-native-exact.native-claim",
      "nanobot-tool-batch-scheduler-native-exact.execution",
    ]))
  })
})

describe("Hermes and Nanobot cadence native assembly", () => {
  it("selects the remaining P1-04 cadence atoms as native factories", () => {
    for (const product of ["hermes-agent", "nanobot"] as const) {
      const contract = buildAssemblyContract({ product, generatedAt: GENERATED_AT })
      const verification = verifyAssemblyContract(contract)
      const atomByID = new Map(contract.atoms.map((atom) => [atom.id, atom]))
      const inventory = buildTodo27NativeRewriteInventory({ products: [product], generatedAt: GENERATED_AT })
      const currentAudit = buildCurrentModulePlaceholderAudit({ products: [product], generatedAt: GENERATED_AT })
      const currentAtomItems = currentAudit.items.filter((item) => item.kind === "product-atom")

      expect(verification.ok).toBe(true)

      for (const descriptor of cadenceNativeDescriptors.filter((item) => item.product === product)) {
        const atom = atomByID.get(descriptor.id)
        const inventoryItem = inventory.items.find((item) => item.atomID === descriptor.id)
        const currentItem = currentAtomItems.find((item) => item.product === product && item.atomID === descriptor.id)

        expect(atom, descriptor.id).toMatchObject({
          implementationKind: "factory",
          parityCoverage: "native",
          nativeEvidenceRefs: expect.arrayContaining([...descriptor.nativeEvidenceRefs]),
          fixtureIDs: expect.arrayContaining([...descriptor.fixtureIDs]),
          knownLossiness: [],
        })
        expect(inventoryItem, descriptor.id).toMatchObject({
          product,
          ownerSection: "P1-04 Native-like Cadence Rewrite",
          implementationLevel: "native",
          disposition: "product-native-complete",
          parityCoverage: "native",
          nativeEvidenceRefs: expect.arrayContaining([...descriptor.nativeEvidenceRefs]),
          fixtureIDs: expect.arrayContaining([...descriptor.fixtureIDs]),
          knownLossiness: [],
          blocker: "Native proof complete for this atom; no open module blocker remains.",
        })
        expect(currentItem, descriptor.id).toMatchObject({
          product,
          implementationKind: "factory",
          implementationLevel: "native",
          parityCoverage: "native",
          sourceVerificationStatus: "product-native-exact-fixture",
          pinnedUpstreamBehaviorStatus: "pinned-native-exact",
          ownerTODO: "TODO-027",
          knownLossiness: [],
        })
      }
    }
  }, 15000)
})
