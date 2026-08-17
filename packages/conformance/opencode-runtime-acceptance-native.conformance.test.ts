import { describe, expect, it } from "vitest"
import {
  buildOpenCodeRuntimeAcceptanceNativeExactFixture,
  openCodeRuntimeAcceptanceControllerNativeExactAtomID,
  openCodeRuntimeAcceptanceEvidenceNativeExactAtomID,
  openCodeRuntimeAcceptanceNativeDescriptors,
  openCodeRuntimeAcceptanceNativeExactAtomIDs,
  openCodeRuntimeAcceptanceNativeExactEvidenceRef,
  openCodeRuntimeAcceptanceNativeExactFixtureID,
  openCodeRuntimeAcceptanceNativeExactReplayRef,
  projectOpenCodeProcessorResult,
  projectOpenCodeRetryDelay,
  verifyOpenCodeRuntimeAcceptanceNativeExactFixture,
} from "@helix/lego-runtime/product-schema/opencode"
import { buildAssemblyContract } from "@helix/recipes"

describe("OpenCode runtime acceptance native exact conformance", () => {
  it("pins SessionRunState, SessionStatus, SessionProcessor, retry, and compaction boundaries to native exact behavior", () => {
    const fixture = buildOpenCodeRuntimeAcceptanceNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomIDs: [
        openCodeRuntimeAcceptanceControllerNativeExactAtomID,
        openCodeRuntimeAcceptanceEvidenceNativeExactAtomID,
      ],
      portIDs: ["runtime.acceptance-controller", "runtime.acceptance-evidence"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeRuntimeAcceptanceNativeExactEvidenceRef,
        openCodeRuntimeAcceptanceNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeRuntimeAcceptanceNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "run-state-busy-idle-shell-and-cancel",
      "status-events-and-idle-removal",
      "processor-tool-result-error-and-cleanup",
      "retry-policy-status-boundary",
      "processor-and-compaction-result-boundary",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "packages/opencode/src/session/run-state.ts#SessionRunState.runner,assertNotBusy,cancel,startShell,cancelBackgroundJobs",
      "packages/opencode/src/session/status.ts#SessionStatus.Info,Event,get,list,set",
      "packages/opencode/src/session/processor.ts#handleEvent,toolResultOutput,failToolCall,cleanup,halt,process",
      "packages/opencode/src/session/retry.ts#delay,retryable,policy",
      "packages/opencode/src/session/compaction.ts#processCompaction,create,prune,select",
    ]))

    const runStateCase = fixture.cases.find((item) => item.scenarioID === "run-state-busy-idle-shell-and-cancel")
    expect(runStateCase?.output["idleCancel"]).toMatchObject({
      cancelledIDs: ["job-root", "job-child", "job-grandchild"],
      cancellationRounds: [["job-root"], ["job-child"], ["job-grandchild"]],
      statusSetWhenRunnerMissingOrIdle: "idle",
      busyRunnerCancelCalled: false,
    })
    expect(runStateCase?.output["busyCancel"]).toMatchObject({
      cancelledIDs: ["job-root", "job-child", "job-grandchild"],
      busyRunnerCancelCalled: true,
    })

    const statusCase = fixture.cases.find((item) => item.scenarioID === "status-events-and-idle-removal")
    expect(statusCase?.output["events"]).toEqual([
      { type: "session.status", sessionID: "ses_7fffffffffffRuntime", status: { type: "busy" } },
      {
        type: "session.status",
        sessionID: "ses_7fffffffffffRuntime",
        status: {
          type: "retry",
          attempt: 2,
          message: "Provider is overloaded",
          next: 1780000002000,
        },
      },
      { type: "session.status", sessionID: "ses_7fffffffffffRuntime", status: { type: "idle" } },
      { type: "session.idle", sessionID: "ses_7fffffffffffRuntime" },
    ])
    expect(statusCase?.output["finalGet"]).toEqual({ type: "idle" })

    const retryCase = fixture.cases.find((item) => item.scenarioID === "retry-policy-status-boundary")
    expect(retryCase?.output).toMatchObject({
      retryAfterMs: 1250,
      retryAfterSeconds: 1500,
      cappedBackoff: 30000,
      retryStatus: {
        status: {
          type: "retry",
          attempt: 4,
          message: "Provider is overloaded",
          next: 1780000001250,
        },
      },
    })
    expect(projectOpenCodeRetryDelay({ attempt: 5 })).toBe(30000)
    expect(projectOpenCodeRetryDelay({ attempt: 3, retryAfter: "2.25" })).toBe(2250)
    expect(projectOpenCodeProcessorResult({ needsCompaction: true })).toBe("compact")
    expect(projectOpenCodeProcessorResult({ blocked: true })).toBe("stop")
    expect(projectOpenCodeProcessorResult({})).toBe("continue")

    expect(verifyOpenCodeRuntimeAcceptanceNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(openCodeRuntimeAcceptanceNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      ...openCodeRuntimeAcceptanceNativeExactAtomIDs,
    ])
    for (const descriptor of openCodeRuntimeAcceptanceNativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "opencode",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeRuntimeAcceptanceNativeExactEvidenceRef,
          openCodeRuntimeAcceptanceNativeExactReplayRef,
        ]),
        fixtureIDs: [openCodeRuntimeAcceptanceNativeExactFixtureID],
        knownLossiness: [],
      })
    }

    const contract = buildAssemblyContract({ product: "opencode" })
    for (const atomID of openCodeRuntimeAcceptanceNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        sourcePackage: "@helix/lego-runtime",
        publicExport: "./product-schema/opencode",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeRuntimeAcceptanceNativeExactEvidenceRef,
          openCodeRuntimeAcceptanceNativeExactReplayRef,
        ]),
        fixtureIDs: [openCodeRuntimeAcceptanceNativeExactFixtureID],
      })
    }

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "retry-policy-status-boundary"
          ? { ...item, output: { ...item.output, cappedBackoff: 32000 } }
          : item,
      ),
    }
    expect(verifyOpenCodeRuntimeAcceptanceNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-runtime-acceptance-native-exact.retry" }),
      expect.objectContaining({ id: "opencode-runtime-acceptance-native-exact.fingerprint" }),
      expect.objectContaining({ id: "opencode-runtime-acceptance-native-exact.cases" }),
    ]))
  })
})
