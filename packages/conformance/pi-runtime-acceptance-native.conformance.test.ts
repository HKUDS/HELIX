import { describe, expect, it } from "vitest"
import {
  buildPiMonoRuntimeAcceptanceNativeExactFixture,
  piMonoRuntimeAcceptanceControllerNativeExactAtomID,
  piMonoRuntimeAcceptanceEvidenceNativeExactAtomID,
  piMonoRuntimeAcceptanceNativeDescriptors,
  piMonoRuntimeAcceptanceNativeExactAtomIDs,
  piMonoRuntimeAcceptanceNativeExactEvidenceRef,
  piMonoRuntimeAcceptanceNativeExactFixtureID,
  piMonoRuntimeAcceptanceNativeExactReplayRef,
  verifyPiMonoRuntimeAcceptanceNativeExactFixture,
} from "@helix/lego-runtime/product-schema/pi"
import { buildAssemblyContract } from "@helix/recipes"

describe("Pi runtime acceptance native exact conformance", () => {
  it("pins Agent and AgentSession runtime acceptance lifecycle to native exact behavior", () => {
    const fixture = buildPiMonoRuntimeAcceptanceNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
        piMonoRuntimeAcceptanceControllerNativeExactAtomID,
        piMonoRuntimeAcceptanceEvidenceNativeExactAtomID,
      ],
      portIDs: ["runtime.acceptance-controller", "runtime.acceptance-evidence"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoRuntimeAcceptanceNativeExactEvidenceRef,
        piMonoRuntimeAcceptanceNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoRuntimeAcceptanceNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "agent-run-lifecycle-idle-after-agent-end",
      "abort-emits-aborted-assistant-and-cleans-state",
      "post-agent-run-retry-or-compaction-continues",
      "streaming-queue-boundaries",
      "dispose-invalidates-extension-context-and-resources",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "packages/agent/src/agent.ts#Agent.runWithLifecycle,handleRunFailure,finishRun,processEvents,abort,waitForIdle,continue,createLoopConfig",
      "packages/agent/src/agent-loop.ts#runAgentLoop,runAgentLoopContinue",
      "packages/coding-agent/src/core/agent-session.ts#_runAgentPrompt,_handlePostAgentRun,prompt,abort,clearQueue,dispose,_checkCompaction,_runAutoCompaction,abortCompaction,abortBranchSummary",
      "packages/coding-agent/src/core/session-resources.ts#cleanupSessionResources",
    ]))

    const abortCase = fixture.cases.find((item) => item.scenarioID === "abort-emits-aborted-assistant-and-cleans-state")
    expect(abortCase?.output).toMatchObject({
      lifecycle: {
        finalAssistantStopReason: "aborted",
        pendingToolCallsAfterFinish: [],
        isStreamingAfterFinishRun: false,
        idleResolvedAfterListeners: true,
      },
      failureMessage: {
        role: "assistant",
        stopReason: "aborted",
      },
      waitForIdleAfterAbort: true,
    })
    expect(verifyPiMonoRuntimeAcceptanceNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoRuntimeAcceptanceNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      ...piMonoRuntimeAcceptanceNativeExactAtomIDs,
    ])
    for (const descriptor of piMonoRuntimeAcceptanceNativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "pi-mono",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoRuntimeAcceptanceNativeExactEvidenceRef,
          piMonoRuntimeAcceptanceNativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoRuntimeAcceptanceNativeExactFixtureID],
        knownLossiness: [],
      })
    }

    const contract = buildAssemblyContract({ product: "pi-mono" })
    for (const atomID of piMonoRuntimeAcceptanceNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        sourcePackage: "@helix/lego-runtime",
        publicExport: "./product-schema/pi",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoRuntimeAcceptanceNativeExactEvidenceRef,
          piMonoRuntimeAcceptanceNativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoRuntimeAcceptanceNativeExactFixtureID],
      })
    }

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "agent-run-lifecycle-idle-after-agent-end"
          ? { ...item, output: { ...item.output, isStreamingAfterFinishRun: true } }
          : item,
      ),
    }
    expect(verifyPiMonoRuntimeAcceptanceNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-runtime-acceptance-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-runtime-acceptance-native-exact.cases" }),
    ]))
  })
})
