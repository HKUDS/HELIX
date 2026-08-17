import { describe, expect, it } from "vitest"
import { createID } from "@helix/contracts"
import {
  buildCadenceEventTimingExactDiffBlockerSnapshot,
  buildCadenceEventTimingPinnedReplaySnapshot,
  buildCadenceEventTimingReplayGateSnapshot,
  buildCadenceProductProjectorSnapshot,
  buildCadenceReplaySnapshot,
  buildCadenceSideEffectOrderSnapshot,
  cadencePolicyDescriptors,
  createCadencePolicyBundle,
  verifyCadenceEventTimingExactDiffBlockerSnapshot,
  verifyCadenceEventTimingPinnedReplaySnapshot,
  verifyCadenceEventTimingReplayGateSnapshot,
} from "@helix/lego-agent-loop/cadence-policies"
import { buildProviderRawFrameTimelineSnapshot, buildProviderRawPayloadRoundTripSnapshot, buildProviderStreamReplaySnapshot, recordStreamingDeltas, streamingDeltaRecorderDescriptors } from "@helix/lego-provider/streaming-delta-recorder"
import {
  createRuntimeAcceptanceController,
  createRuntimeAcceptanceEvidenceProvider,
  createRuntimeTaskAcceptanceController,
  buildRuntimeAcceptanceExactDiffBlockerSnapshot,
  buildRuntimeAcceptancePinnedReplaySnapshot,
  buildRuntimeAcceptanceReplaySnapshot,
  buildRuntimeAcceptanceLifecycleReplayGateSnapshot,
  buildRuntimeAcceptanceLifecycleSnapshot,
  buildRuntimeAcceptancePersistenceCleanupSnapshot,
  buildRuntimeAcceptanceTimingBoundarySnapshot,
  runtimeAcceptanceAtomDescriptors,
  projectOpenCodeRuntimeLoopAcceptanceBoundary,
  verifyOpenCodeRuntimeLoopAcceptanceBoundaryProjection,
  verifyRuntimeAcceptanceExactDiffBlockerSnapshot,
  verifyRuntimeAcceptanceLifecycleReplayGateSnapshot,
  verifyRuntimeAcceptancePinnedReplaySnapshot,
} from "@helix/lego-runtime/acceptance-controller"
import { buildSessionMessagePartReplaySnapshot, buildSessionProviderMetadataRoundTripSnapshot, buildSessionStorageRoundTripSnapshot, messagePartProjectorDescriptors, projectMessagePartType } from "@helix/lego-session/message-part-projector"
import { buildToolCadenceReplaySnapshot, buildToolResultEnvelopeRoundTripSnapshot, buildToolResultEventStreamSnapshot, buildToolResultWritebackTimingSnapshot, createToolSchemaSnapshot, projectToolResult, toolCadenceAtomDescriptors } from "@helix/lego-tools/cadence-atoms"

describe("cadence lego atoms", () => {
  it("keeps product cadence behavior behind existing lego planes and pi atom prefixes", () => {
    const policies = createCadencePolicyBundle("pi-mono")
    const toolSchema = createToolSchemaSnapshot("pi-mono")
    const toolResult = projectToolResult("pi-mono", "run_command", { content: [{ id: createID("part"), type: "text", text: "ok" }] })
    const partProjection = projectMessagePartType("pi-mono", { id: createID("part"), type: "text", text: "hello" })
    const streamSignature = recordStreamingDeltas("pi-mono", [
      { type: "text", text: "hello" },
      { type: "finish", finish: "stop" },
    ])
    const acceptance = createRuntimeAcceptanceController("pi-mono")
    const atomIDs = [
      policies.requestBoundary.id,
      policies.toolBatchScheduler.id,
      policies.finalSummary.id,
      toolSchema.atomID,
      toolResult.atomID,
      partProjection.atomID,
      streamSignature.atomID,
      acceptance.id,
    ]

    expect(atomIDs).toEqual([
      "pi.agent-loop.request-boundary.native-like",
      "pi.tools.batch-scheduler.native-like",
      "pi.agent-loop.final-summary.native-like",
      "pi.tools.schema.native-like",
      "pi.tools.result-projector.native-like",
      "pi.session.message-part-projector.native-like",
      "pi.provider.streaming-delta-recorder.native-like",
      "pi.runtime.acceptance-controller.native-like",
    ])
    expect(atomIDs.every((id) => !id.startsWith("cadence."))).toBe(true)
  })

  it("publishes descriptor metadata for cadence-related atoms without introducing a cadence plane", () => {
    const descriptors = [
      ...cadencePolicyDescriptors(),
      ...toolCadenceAtomDescriptors(),
      ...messagePartProjectorDescriptors(),
      ...streamingDeltaRecorderDescriptors(),
      ...runtimeAcceptanceAtomDescriptors(),
    ]

    expect(descriptors.map((descriptor) => descriptor.id)).toEqual(
      expect.arrayContaining([
        "opencode.agent-loop.request-boundary.native-like",
        "pi.tools.schema.native-like",
        "nanobot.session.message-part-projector.native-like",
        "opencode.provider.streaming-delta-recorder.native-like",
        "pi.runtime.acceptance-evidence.native-like",
      ]),
    )
    expect(descriptors.every((descriptor) => !descriptor.id.startsWith("cadence."))).toBe(true)
    expect(descriptors.every((descriptor) => typeof descriptor.port === "string" && descriptor.port.length > 0)).toBe(true)
    expect(cadencePolicyDescriptors("opencode")[0]).toMatchObject({
      id: "opencode.agent-loop.request-boundary.native-like",
      product: "opencode",
      port: "agent-loop.request-boundary",
      nativeFixtureSource: "opencode-agent-loop-request-boundary-native-exact",
      replay: expect.objectContaining({
        key: "request-boundary",
        flowStageID: "loop.boundary",
        fixtureID: "opencode-cadence:request-boundary",
        decisions: expect.arrayContaining([expect.objectContaining({ scenarioID: "tool-results-available", observedDecision: "continue" })]),
      }),
    })
    expect(toolCadenceAtomDescriptors("pi-mono")[0]).toMatchObject({
      id: "pi.tools.schema.native-like",
      product: "pi-mono",
      port: "tools.schema",
      nativeFixtureSource: "pi-native",
      replay: expect.objectContaining({ resultEnvelope: "pi-mono", supportsErrors: true, supportsPermissionDenied: true, supportsProgress: true, supportsNativeMetadata: true }),
    })
    expect(messagePartProjectorDescriptors("nanobot")[0]).toMatchObject({
      id: "nanobot.session.message-part-projector.native-like",
      port: "session.message-part-projector",
      nativeFixtureSource: "nanobot-native",
      replay: expect.objectContaining({ supportedSourceTypes: expect.arrayContaining(["text", "tool_call"]) }),
    })
    expect(streamingDeltaRecorderDescriptors("opencode")[0]).toMatchObject({
      id: "opencode.provider.streaming-delta-recorder.native-like",
      port: "provider.streaming-delta-recorder",
      nativeFixtureSource: "opencode-native",
      replay: expect.objectContaining({ chunkClasses: expect.arrayContaining(["tool-json", "finish"]), toolJSONDelta: true }),
    })
  })

  it("routes native-like cadence replay through product projector snapshots", () => {
    const products = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const
    for (const product of products) {
      const policies = createCadencePolicyBundle(product)
      const projector = buildCadenceProductProjectorSnapshot(product)
      const sideEffectOrder = buildCadenceSideEffectOrderSnapshot(product)
      const replay = buildCadenceReplaySnapshot(product)

      expect(projector).toMatchObject({
        schemaVersion: 1,
        product,
        projectorID: expect.stringMatching(/\.cadence\.product-projector\.partial$/),
        fallbackProjectorID: "common.cadence.projector.fallback",
        coverage: "product-projector-partial",
        fixtureID: `${product}-cadence:product-projector`,
        productSpecificFields: expect.arrayContaining(["requestBoundaryID", "toolBatchSchedulerID", "finalSummaryID"]),
        commonFallbackFields: expect.arrayContaining(["request-boundary-result-shape", "final-summary-result-shape", "tool-batch-plan-shape"]),
        knownGaps: expect.arrayContaining(["common-fallback-still-normalizes-result-shape"]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      expect(replay.productProjectorFingerprint).toBe(projector.fingerprint)
      expect(replay.sideEffectOrderFingerprint).toBe(sideEffectOrder.fingerprint)
      expect(replay.sideEffectOrderFingerprint).toBe(replay.sideEffectOrder.fingerprint)
      expect(replay.fixtureIDs).toEqual(expect.arrayContaining([projector.fixtureID, `${product}-cadence:side-effect-order`]))
      expect(replay.knownGaps).toEqual(expect.arrayContaining(["product-projector-partial-not-full-native-loop", "cadence-side-effect-order-covered-by-partial-fixture"]))
      expect(replay.sideEffectOrder).toMatchObject({
        evidenceRef: `conformance:${product}-cadence-side-effect-order`,
        fixtureID: `${product}-cadence:side-effect-order`,
        scenarios: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "provider-continuation-side-effect-order", key: "request-boundary", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "tool-batch-dispatch-side-effect-order", key: "tool-batch-scheduler", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "final-summary-write-side-effect-order", key: "final-summary", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "accept-or-stop-cleanup-side-effect-order", key: "request-boundary", visibility: "inferred" }),
        ]),
        lossyFields: expect.arrayContaining(["partial-cadence-side-effect-order", "native-event-wall-clock-timing-not-replayed", "native-side-effects-not-fully-replayed"]),
      })
      expect(replay.atoms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "request-boundary",
            productProjectorID: projector.projectorID,
            productProjectorCoverage: "product-projector-partial",
            productProjectorFingerprint: projector.fingerprint,
            sideEffectOrderFingerprint: sideEffectOrder.fingerprint,
            sideEffectOrderFixtureID: `${product}-cadence:side-effect-order`,
            decisions: expect.arrayContaining([expect.objectContaining({ scenarioID: "tool-results-available", observedDecision: "continue" })]),
            lossyFields: expect.arrayContaining(["partial-cadence-side-effect-order", "native-side-effects-not-fully-replayed"]),
          }),
          expect.objectContaining({
            key: "tool-batch-scheduler",
            productProjectorID: projector.projectorID,
            sideEffectOrderFixtureID: `${product}-cadence:side-effect-order`,
            observedFields: expect.arrayContaining(["toolBatchMode", "readOnlyToolOrder", "mutatingToolSerialization"]),
            inferredFields: expect.arrayContaining(["toolDispatchClock"]),
          }),
        ]),
      )

      const requestScenario = projector.scenarios.find((scenario) => scenario.key === "request-boundary" && scenario.scenarioID === "tool-results-available")
      const requestDecision = policies.requestBoundary.decide({ product, step: 0, maxSteps: 4, toolCallCount: 1, syntheticContinues: 0 })
      expect(requestDecision).toMatchObject({
        decision: requestScenario?.expectedDecision,
        reasonCode: requestScenario?.reasonCode,
      })
      const acceptedScenario = projector.scenarios.find((scenario) => scenario.key === "final-summary" && scenario.scenarioID === "accepted-result")
      const acceptedDecision = policies.finalSummary.decide({ product, accepted: true, toolCallCount: 0, visibleText: "empty" })
      expect(acceptedDecision).toMatchObject({
        decision: acceptedScenario?.expectedDecision,
        reasonCode: acceptedScenario?.reasonCode,
      })
    }
  })

  it("records cadence event timing replay positive and negative gates", () => {
    const snapshot = buildCadenceEventTimingReplayGateSnapshot()
    const verification = verifyCadenceEventTimingReplayGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:cadence-event-timing-replay-gate",
      fixtureID: "cadence:event-timing-replay-gate",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "request-boundary",
        "tool-batch-order",
        "final-summary",
        "continuation",
        "side-effects",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-cadence:replay",
      replayRisk: "source-anchored-partial",
      requestBoundary: expect.arrayContaining([
        "request-boundary:tool-results-available:continue:tool-results-need-provider-continuation:observed",
      ]),
      continuation: expect.arrayContaining([
        "request-boundary:tool-results-available:continue:tool-results-need-provider-continuation:observed",
      ]),
      toolBatchOrder: expect.arrayContaining([
        "tool-batch-scheduler:readonly-pair:parallel:native-readonly-batch:observed",
      ]),
      sideEffects: expect.arrayContaining([
        expect.stringContaining("request-boundary:provider-continuation-side-effect-order:event-order:"),
        expect.stringContaining("tool-batch-scheduler:tool-batch-dispatch-side-effect-order:side-effects:"),
      ]),
      fixtureIDs: expect.arrayContaining([
        "cadence:event-timing-replay-gate",
        "opencode-cadence:request-boundary",
        "opencode-cadence:final-summary",
        "opencode-cadence:tool-batch-scheduler",
        "opencode-cadence:product-projector",
        "opencode-cadence:side-effect-order",
      ]),
      knownLossiness: expect.arrayContaining([
        "cadence-side-effect-order-covered-by-partial-fixture",
        "full-native-event-timing-and-side-effects-not-replayed",
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-cadence:replay",
      cadenceSourceID: "pi",
      toolBatchOrder: expect.arrayContaining([
        "tool-batch-scheduler:mutating-edit:sequential:native-mutating-tool-order:observed",
      ]),
      finalSummary: expect.arrayContaining([
        expect.stringContaining("final-summary:final-summary-write-side-effect-order:event-order:provider.finish>jsonl.final-message>cli.visible-output"),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.requestBoundary).toEqual(expect.arrayContaining([
      expect.stringContaining("agent.iteration-boundary"),
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")).toMatchObject({
      cadenceSourceID: "hermes",
      sourceAnchors: expect.arrayContaining(["package:hermes-agent==0.15.1"]),
      sideEffects: expect.arrayContaining([
        expect.stringContaining("gateway-state-read"),
        expect.stringContaining("computer-use.dispatch"),
      ]),
    })

    const requestBoundaryDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, requestBoundary: [] }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingReplayGateSnapshot(requestBoundaryDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing.request-boundary",
        product: "opencode",
        dimension: "request-boundary",
      }),
    ]))

    const toolBatchDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, toolBatchOrder: [] }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingReplayGateSnapshot(toolBatchDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing.tool-batch-order",
        product: "pi-mono",
        dimension: "tool-batch-order",
      }),
    ]))

    const finalSummaryDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, finalSummary: [] }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingReplayGateSnapshot(finalSummaryDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing.final-summary",
        product: "nanobot",
        dimension: "final-summary",
      }),
    ]))

    const continuationDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, continuation: [] }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingReplayGateSnapshot(continuationDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing.continuation",
        product: "hermes-agent",
        dimension: "continuation",
      }),
    ]))

    const sideEffectDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, sideEffects: [] }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingReplayGateSnapshot(sideEffectDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing.side-effects",
        product: "opencode",
        dimension: "side-effects",
      }),
    ]))

    const inferredOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, replayRisk: "assembled-inferred-only" as const }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingReplayGateSnapshot(inferredOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing.assembled-inferred-only",
        product: "pi-mono",
        dimension: "side-effects",
      }),
    ]))

    const borrowedSourceMatrix = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              cadenceSourceID: "opencode" as const,
              fixtureID: "opencode-cadence:replay",
              replayRisk: "borrowed-opencode" as const,
            }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingReplayGateSnapshot(borrowedSourceMatrix).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing.borrowed-source-matrix",
        product: "hermes-agent",
        dimension: "request-boundary",
      }),
    ]))
  })

  it("records cadence event timing exact-diff blockers without claiming native parity", () => {
    const snapshot = buildCadenceEventTimingExactDiffBlockerSnapshot()
    const verification = verifyCadenceEventTimingExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:cadence-event-timing-exact-diff-blocker-gate",
      fixtureID: "cadence:event-timing-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "request-boundary",
        "tool-batch-order",
        "final-summary",
        "continuation",
        "side-effects",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      cadenceSourceID: "opencode",
      requestBoundary: expect.arrayContaining(["request-boundary-native-timing:exact-diff-not-proven"]),
      toolBatchOrder: expect.arrayContaining(["tool-batch-order-native-scheduler:exact-diff-not-proven"]),
      nativeEvidenceRefs: expect.arrayContaining(["opencode-cadence:request-boundary", "opencode-cadence:side-effect-order"]),
      exactDiffRisk: "semantic-fixture-needs-exact-diff",
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      cadenceSourceID: "pi",
      finalSummary: expect.arrayContaining(["final-summary-native-timing:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      requestBoundary: expect.arrayContaining([expect.stringContaining("agent.iteration-boundary")]),
      continuation: expect.arrayContaining(["continuation-native-retry-stop-boundary:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")).toMatchObject({
      cadenceSourceID: "hermes",
      sideEffects: expect.arrayContaining(["cadence-side-effects-native-order:exact-diff-not-proven"]),
    })

    const requestBoundaryDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, requestBoundary: [] }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingExactDiffBlockerSnapshot(requestBoundaryDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-exact-diff.request-boundary",
        product: "opencode",
        dimension: "request-boundary",
      }),
    ]))

    const toolBatchDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, toolBatchOrder: [] }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingExactDiffBlockerSnapshot(toolBatchDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-exact-diff.tool-batch-order",
        product: "pi-mono",
        dimension: "tool-batch-order",
      }),
    ]))

    const finalSummaryDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, finalSummary: [] }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingExactDiffBlockerSnapshot(finalSummaryDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-exact-diff.final-summary",
        product: "nanobot",
        dimension: "final-summary",
      }),
    ]))

    const continuationDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, continuation: [] }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingExactDiffBlockerSnapshot(continuationDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-exact-diff.continuation",
        product: "hermes-agent",
        dimension: "continuation",
      }),
    ]))

    const sideEffectDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, sideEffects: [] }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingExactDiffBlockerSnapshot(sideEffectDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-exact-diff.side-effects",
        product: "opencode",
        dimension: "side-effects",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-exact-diff.native-claim",
        product: "opencode",
        dimension: "request-boundary",
      }),
    ]))

    const inferredOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "assembled-inferred-only" as const }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingExactDiffBlockerSnapshot(inferredOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-exact-diff.assembled-inferred-only",
        product: "pi-mono",
        dimension: "side-effects",
      }),
    ]))

    const borrowedSourceMatrix = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              cadenceSourceID: "opencode" as const,
              exactDiffRisk: "borrowed-opencode" as const,
              fixtureIDs: ["opencode-cadence:request-boundary"],
            }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingExactDiffBlockerSnapshot(borrowedSourceMatrix).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-exact-diff.borrowed-source-matrix",
        product: "hermes-agent",
        dimension: "request-boundary",
      }),
    ]))
  })

  it("records cadence event timing pinned replay fixtures without claiming native parity", () => {
    const snapshot = buildCadenceEventTimingPinnedReplaySnapshot()
    const verification = verifyCadenceEventTimingPinnedReplaySnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:cadence-event-timing-pinned-replay-gate",
      fixtureID: "cadence:event-timing-pinned-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "request-boundary",
        "tool-batch-order",
        "final-summary",
        "continuation",
        "side-effects",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      sourceFixtureID: "opencode-cadence:replay",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "pinned-timing-replay-needs-live-native-loop",
      upstreamTrace: expect.arrayContaining([
        expect.objectContaining({
          dimension: "request-boundary",
          traceID: "opencode:opencode.request-boundary.tool-results",
          requestBoundaryID: "continue:tool-results-need-provider-continuation",
          nativeEventOrder: ["session.tool-result", "step.finish-boundary", "provider.request"],
        }),
        expect.objectContaining({
          dimension: "side-effects",
          sideEffectOrderID: "sqlite-accept-record>plugin-cleanup-boundary",
          sideEffectID: "plugin-cleanup-boundary",
        }),
      ]),
      knownLossiness: expect.arrayContaining(["cadence-event-timing-pinned-timing-replay-live-native-loop-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")?.upstreamTrace).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "tool-batch-order",
        nativeEventOrder: ["typebox.tool-plan", "cli.tool-dispatch", "jsonl.tool-result"],
        sideEffectID: "typebox-tool-order-before-jsonl-result",
      }),
    ]))
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.upstreamTrace).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "final-summary",
        finalSummaryID: "summary:agent.iteration-finish>workspace.session-write>visible-response",
      }),
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.upstreamTrace).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "continuation",
        continuationID: "persistent-continuation:request-2",
        sourceAnchor: "hermes-agent-cadence:request-boundary",
      }),
    ]))

    const requestBoundaryDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledTrace: item.assembledTrace.map((record) =>
                record.dimension === "request-boundary"
                  ? { ...record, requestBoundaryID: "stop:common-boundary" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingPinnedReplaySnapshot(requestBoundaryDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-pinned-replay.request-boundary",
        product: "opencode",
        dimension: "request-boundary",
      }),
    ]))

    const toolBatchDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? {
              ...item,
              productReplayTrace: item.productReplayTrace.map((record) =>
                record.dimension === "tool-batch-order"
                  ? { ...record, toolBatchID: "parallel:common-batch" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingPinnedReplaySnapshot(toolBatchDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-pinned-replay.tool-batch-order",
        product: "pi-mono",
        dimension: "tool-batch-order",
      }),
    ]))

    const finalSummaryDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? {
              ...item,
              assembledTrace: item.assembledTrace.map((record) =>
                record.dimension === "final-summary"
                  ? { ...record, finalSummaryID: "summary:common-final-message" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingPinnedReplaySnapshot(finalSummaryDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-pinned-replay.final-summary",
        product: "nanobot",
        dimension: "final-summary",
      }),
    ]))

    const continuationDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              productReplayTrace: item.productReplayTrace.map((record) =>
                record.dimension === "continuation"
                  ? { ...record, continuationID: "stop:common" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingPinnedReplaySnapshot(continuationDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-pinned-replay.continuation",
        product: "hermes-agent",
        dimension: "continuation",
      }),
    ]))

    const sideEffectDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledTrace: item.assembledTrace.map((record) =>
                record.dimension === "side-effects"
                  ? { ...record, sideEffectOrderID: "common-cleanup-only" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingPinnedReplaySnapshot(sideEffectDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-pinned-replay.side-effects",
        product: "opencode",
        dimension: "side-effects",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingPinnedReplaySnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-pinned-replay.native-claim",
        product: "opencode",
        dimension: "request-boundary",
      }),
    ]))

    const inferredOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "assembled-inferred-only" as const }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingPinnedReplaySnapshot(inferredOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-pinned-replay.assembled-inferred-only",
        product: "pi-mono",
        dimension: "side-effects",
      }),
    ]))

    const borrowedSourceMatrix = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              cadenceSourceID: "opencode" as const,
              sourceFixtureID: "opencode-cadence:replay",
              exactDiffRisk: "borrowed-opencode" as const,
            }
          : item,
      ),
    }
    expect(verifyCadenceEventTimingPinnedReplaySnapshot(borrowedSourceMatrix).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cadence-event-timing-pinned-replay.borrowed-source-matrix",
        product: "hermes-agent",
        dimension: "request-boundary",
      }),
    ]))
  })

  it("records native-like tool schema and result projector replay snapshots", () => {
    const products = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const
    for (const product of products) {
      const snapshot = buildToolCadenceReplaySnapshot(product)
      const eventStream = buildToolResultEventStreamSnapshot(product)
      const envelopeRoundTrip = buildToolResultEnvelopeRoundTripSnapshot(product)
      const writebackTiming = buildToolResultWritebackTimingSnapshot(product)
      const schema = snapshot.atoms.find((atom) => atom.key === "schema")
      const resultProjector = snapshot.atoms.find((atom) => atom.key === "result-projector")

      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        product,
        evidenceRef: `conformance:${product}-tool-cadence-replay-snapshot`,
        fixtureIDs: expect.arrayContaining([`${product}-tool-cadence:schema`, `${product}-tool-cadence:result-projector`, `${product}-tool-cadence:result-event-stream`, `${product}-tool-cadence:result-envelope-roundtrip`, `${product}-tool-cadence:result-writeback-timing`]),
        coveredKeys: ["schema", "result-projector"],
        profileFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        resultEventStreamFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        resultEnvelopeRoundTripFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        resultWritebackTimingFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        resultEventStream: expect.objectContaining({
          evidenceRef: `conformance:${product}-tool-result-event-stream`,
          fixtureID: `${product}-tool-cadence:result-event-stream`,
          scenarios: expect.arrayContaining([
            expect.objectContaining({ scenarioID: "permission-denied-event-stream", eventSequence: ["permission.ask", "permission.denied", "tool.result.error"] }),
            expect.objectContaining({ scenarioID: "progress-update-event-stream", eventSequence: ["tool.start", "tool.progress", "tool.partial-output", "tool.result"] }),
            expect.objectContaining({ scenarioID: "native-metadata-event-stream", eventSequence: ["tool.start", "tool.result", "session.write"], visibility: "inferred" }),
          ]),
          lossyFields: expect.arrayContaining(["partial-tool-result-event-stream", "native-progress-event-timing-not-replayed", "native-result-envelope-roundtrip-not-proven"]),
        }),
        resultEnvelopeRoundTrip: expect.objectContaining({
          evidenceRef: `conformance:${product}-tool-result-envelope-roundtrip`,
          fixtureID: `${product}-tool-cadence:result-envelope-roundtrip`,
          scenarios: expect.arrayContaining([
            expect.objectContaining({ scenarioID: "text-result-envelope-roundtrip", toolName: "read", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "stdout-stderr-envelope-roundtrip", toolName: "bash", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "permission-denied-envelope-roundtrip", toolName: "edit" }),
            expect.objectContaining({ scenarioID: "progress-final-envelope-roundtrip", toolName: "bash" }),
            expect.objectContaining({ scenarioID: "native-metadata-envelope-roundtrip", toolName: "bash", visibility: "inferred" }),
          ]),
          lossyFields: expect.arrayContaining(["partial-tool-result-envelope-roundtrip", "native-result-envelope-roundtrip-not-proven", "native-record-id-readback-partial"]),
        }),
        resultWritebackTiming: expect.objectContaining({
          evidenceRef: `conformance:${product}-tool-result-writeback-timing`,
          fixtureID: `${product}-tool-cadence:result-writeback-timing`,
          scenarios: expect.arrayContaining([
            expect.objectContaining({ scenarioID: "progress-before-final-result", toolName: "bash", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "tool-result-before-session-write", toolName: "bash", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "permission-denied-error-writeback", toolName: "edit" }),
            expect.objectContaining({ scenarioID: "native-metadata-record-id-writeback", toolName: "bash", visibility: "inferred" }),
          ]),
          lossyFields: expect.arrayContaining(["partial-tool-result-writeback-timing", "native-progress-event-timing-not-replayed", "native-session-writeback-record-id-partial"]),
        }),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        knownGaps: expect.arrayContaining(["schema-aliases-not-full-native-tool-registry", "permission-denied-and-progress-events-covered-by-partial-event-stream", "tool-result-envelope-roundtrip-covered-by-partial-fixture", "tool-result-writeback-timing-covered-by-partial-fixture", "full-native-progress-event-stream-not-replayed"]),
      })
      expect(snapshot.resultEventStreamFingerprint).toBe(snapshot.resultEventStream.fingerprint)
      expect(snapshot.resultEventStreamFingerprint).toBe(eventStream.fingerprint)
      expect(snapshot.resultEnvelopeRoundTripFingerprint).toBe(snapshot.resultEnvelopeRoundTrip.fingerprint)
      expect(snapshot.resultEnvelopeRoundTripFingerprint).toBe(envelopeRoundTrip.fingerprint)
      expect(snapshot.resultWritebackTimingFingerprint).toBe(snapshot.resultWritebackTiming.fingerprint)
      expect(snapshot.resultWritebackTimingFingerprint).toBe(writebackTiming.fingerprint)
      expect(schema).toMatchObject({
        atomID: expect.stringMatching(/\.tools\.schema\.native-like$/),
        portID: "tools.schema",
        flowStageID: "tool.plan",
        fixtureID: `${product}-tool-cadence:schema`,
        scenarios: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "read-schema", toolName: "read", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "write-schema", toolName: "write", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "bash-schema", toolName: "bash", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "permission-policy-schema", toolName: "edit" }),
        ]),
        observedFields: expect.arrayContaining(["aliases", "requiredFields", "mutationClass", "permissionSubjectField", "approvalRequiredForMutation"]),
        lossyFields: expect.arrayContaining(["semantic-tool-cadence-replay"]),
      })
      expect(resultProjector).toMatchObject({
        atomID: expect.stringMatching(/\.tools\.result-projector\.native-like$/),
        portID: "tools.result-projector",
        flowStageID: "tool.result",
        fixtureID: `${product}-tool-cadence:result-projector`,
        resultEventStreamFingerprint: snapshot.resultEventStreamFingerprint,
        resultEventStreamFixtureID: `${product}-tool-cadence:result-event-stream`,
        resultEnvelopeRoundTripFingerprint: snapshot.resultEnvelopeRoundTripFingerprint,
        resultEnvelopeRoundTripFixtureID: `${product}-tool-cadence:result-envelope-roundtrip`,
        resultWritebackTimingFingerprint: snapshot.resultWritebackTimingFingerprint,
        resultWritebackTimingFixtureID: `${product}-tool-cadence:result-writeback-timing`,
        scenarios: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "read-text-result", toolName: "read", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "bash-stdout-result", toolName: "bash", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "bash-stderr-result", toolName: "bash", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "tool-error-result", toolName: "edit", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "truncated-result", toolName: "read", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "permission-denied-result", toolName: "edit" }),
          expect.objectContaining({ scenarioID: "progress-update-result", toolName: "bash" }),
          expect.objectContaining({ scenarioID: "native-metadata-result", toolName: "bash", visibility: "inferred" }),
        ]),
        observedFields: expect.arrayContaining(["resultEnvelope", "stdout", "stderr", "error", "truncation", "permissionDenied", "progress", "nativeMetadata"]),
        lossyFields: expect.arrayContaining(["not-full-native-tool-registry-replay", "partial-tool-result-envelope-roundtrip", "partial-tool-result-writeback-timing", "native-result-envelope-roundtrip-not-proven"]),
      })
      expect(schema?.scenarios.find((scenario) => scenario.scenarioID === "write-schema")?.observedShape).toMatchObject({
        requiredFields: expect.arrayContaining(["path", "content"]),
        mutating: true,
      })
      expect(resultProjector?.scenarios.find((scenario) => scenario.scenarioID === "bash-stdout-result")?.observedShape).toMatchObject({
        stdout: true,
        stderr: false,
        error: false,
      })
      expect(resultProjector?.scenarios.find((scenario) => scenario.scenarioID === "bash-stderr-result")?.observedShape).toMatchObject({
        stdout: false,
        stderr: true,
        error: false,
      })
      expect(resultProjector?.scenarios.find((scenario) => scenario.scenarioID === "truncated-result")?.observedShape).toMatchObject({
        truncationSupported: true,
      })
      expect(snapshot.resultEnvelopeRoundTrip.scenarios.find((scenario) => scenario.scenarioID === "stdout-stderr-envelope-roundtrip")?.nativeEnvelopeShape).toMatchObject({
        envelope: product,
        resultRecord: expect.any(String),
        stdoutField: expect.any(String),
        stderrField: expect.any(String),
      })
      expect(snapshot.resultEnvelopeRoundTrip.scenarios.find((scenario) => scenario.scenarioID === "progress-final-envelope-roundtrip")?.lossiness).toEqual(expect.arrayContaining(["progress-event-timestamps"]))
      expect(snapshot.resultWritebackTiming.scenarios.find((scenario) => scenario.scenarioID === "tool-result-before-session-write")?.timingBuckets).toEqual(expect.arrayContaining(["tool-result-record", "session-write"]))
      if (product === "opencode") {
        expect(schema?.scenarios.find((scenario) => scenario.scenarioID === "read-schema")?.observedShape).toMatchObject({
          pathField: "filePath",
          aliases: expect.arrayContaining(["open"]),
        })
        expect(resultProjector?.scenarios.find((scenario) => scenario.scenarioID === "permission-denied-result")?.observedShape).toMatchObject({
          policySurface: "permission-tool-result-part",
        })
      }
      if (product === "hermes-agent") {
        expect(schema?.scenarios.find((scenario) => scenario.scenarioID === "bash-schema")?.observedShape).toMatchObject({
          aliases: expect.arrayContaining(["terminal", "run_shell"]),
        })
        expect(resultProjector?.scenarios.find((scenario) => scenario.scenarioID === "progress-update-result")?.observedShape).toMatchObject({
          progressSurface: "api-acp-progress-event",
        })
      }
    }
  })

  it("records native-like provider stream replay snapshots for delta recorder and stream projector", () => {
    const products = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const
    for (const product of products) {
      const snapshot = buildProviderStreamReplaySnapshot(product)
      const rawFrameTimeline = buildProviderRawFrameTimelineSnapshot(product)
      const rawPayloadRoundTrip = buildProviderRawPayloadRoundTripSnapshot(product)
      const deltaRecorder = snapshot.atoms.find((atom) => atom.key === "streaming-delta-recorder")
      const streamProjector = snapshot.atoms.find((atom) => atom.key === "stream-projector")

      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        product,
        evidenceRef: `conformance:${product}-provider-stream-replay-snapshot`,
        fixtureIDs: expect.arrayContaining([`${product}-provider-stream:streaming-delta-recorder`, `${product}-provider-stream:stream-projector`, `${product}-provider-stream:raw-frame-timeline`, `${product}-provider-stream:raw-payload-roundtrip`]),
        coveredKeys: ["streaming-delta-recorder", "stream-projector"],
        profileFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        rawFrameTimelineFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        rawPayloadRoundTripFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        rawFrameTimeline: expect.objectContaining({
          evidenceRef: `conformance:${product}-provider-raw-frame-timeline`,
          fixtureID: `${product}-provider-stream:raw-frame-timeline`,
          scenarios: expect.arrayContaining([
            expect.objectContaining({ scenarioID: "raw-text-frame-order", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "raw-tool-call-frame-order", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "retry-error-frame-path", visibility: "inferred" }),
            expect.objectContaining({ scenarioID: "cancel-frame-path", visibility: "inferred" }),
            expect.objectContaining({ scenarioID: "google-raw-frame-shape", providerProtocol: "google", visibility: "inferred" }),
          ]),
          lossyFields: expect.arrayContaining(["partial-provider-raw-frame-timeline", "raw-frame-wall-clock-timing-not-replayed", "provider-retry-delay-not-exact", "cancel-abort-race-not-replayed"]),
        }),
        rawPayloadRoundTrip: expect.objectContaining({
          evidenceRef: `conformance:${product}-provider-raw-payload-roundtrip`,
          fixtureID: `${product}-provider-stream:raw-payload-roundtrip`,
          scenarios: expect.arrayContaining([
            expect.objectContaining({ scenarioID: "text-delta-payload-roundtrip", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "tool-call-arguments-payload-roundtrip", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "finish-usage-payload-roundtrip", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "error-payload-roundtrip", visibility: "inferred" }),
            expect.objectContaining({ scenarioID: "google-function-call-payload-roundtrip", providerProtocol: "google", visibility: "inferred" }),
          ]),
          lossyFields: expect.arrayContaining(["partial-provider-raw-payload-roundtrip", "raw-payload-roundtrip-not-full-native", "raw-frame-wall-clock-timing-not-replayed"]),
        }),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        knownGaps: expect.arrayContaining([
          "raw-transport-frame-timing-not-replayed",
          "provider-specific-retry-error-cancel-paths-partial",
          "raw-frame-timeline-covered-by-partial-order-buckets",
          "raw-payload-roundtrip-covered-by-partial-fixture",
          "google-provider-raw-transport-not-replayed",
        ]),
      })
      expect(snapshot.rawFrameTimelineFingerprint).toBe(snapshot.rawFrameTimeline.fingerprint)
      expect(snapshot.rawFrameTimelineFingerprint).toBe(rawFrameTimeline.fingerprint)
      expect(snapshot.rawPayloadRoundTripFingerprint).toBe(snapshot.rawPayloadRoundTrip.fingerprint)
      expect(snapshot.rawPayloadRoundTripFingerprint).toBe(rawPayloadRoundTrip.fingerprint)
      expect(deltaRecorder).toMatchObject({
        atomID: expect.stringMatching(/\.provider\.streaming-delta-recorder\.native-like$/),
        portID: "provider.streaming-delta-recorder",
        flowStageID: "provider.stream",
        fixtureID: `${product}-provider-stream:streaming-delta-recorder`,
        rawFrameTimelineFingerprint: snapshot.rawFrameTimelineFingerprint,
        rawFrameTimelineFixtureID: `${product}-provider-stream:raw-frame-timeline`,
        rawPayloadRoundTripFingerprint: snapshot.rawPayloadRoundTripFingerprint,
        rawPayloadRoundTripFixtureID: `${product}-provider-stream:raw-payload-roundtrip`,
        scenarios: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "text-reasoning-deltas", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "tool-json-partial", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "google-provider-path", providerProtocol: "google", visibility: "inferred" }),
        ]),
        observedFields: expect.arrayContaining(["eventName", "chunkOrder", "toolJSONDelta", "finishReason", "usage", "cost"]),
        inferredFields: expect.arrayContaining(["google-provider-event-shape"]),
        lossyFields: expect.arrayContaining(["semantic-provider-stream-replay", "google-provider-raw-event-detail", "partial-provider-raw-payload-roundtrip"]),
      })
      expect(streamProjector).toMatchObject({
        atomID: expect.stringMatching(/\.provider\.stream-projector\.native-like$/),
        portID: "provider.stream-projector",
        flowStageID: "stream.project",
        fixtureID: `${product}-provider-stream:stream-projector`,
        rawFrameTimelineFingerprint: snapshot.rawFrameTimelineFingerprint,
        rawFrameTimelineFixtureID: `${product}-provider-stream:raw-frame-timeline`,
        rawPayloadRoundTripFingerprint: snapshot.rawPayloadRoundTripFingerprint,
        rawPayloadRoundTripFixtureID: `${product}-provider-stream:raw-payload-roundtrip`,
        scenarios: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "usage-and-cost-finish", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "google-provider-path", providerProtocol: "google", visibility: "inferred" }),
          expect.objectContaining({ scenarioID: "error-retry-cancel", visibility: "inferred" }),
        ]),
        observedFields: expect.arrayContaining(["projectorOutputShape"]),
        inferredFields: expect.arrayContaining(["google-provider-projector-shape"]),
        lossyFields: expect.arrayContaining(["raw-transport-frame-timing", "provider-specific-error-cancel-paths-partial", "partial-provider-raw-payload-roundtrip"]),
      })
      expect(snapshot.rawPayloadRoundTrip.scenarios.find((scenario) => scenario.scenarioID === "tool-call-arguments-payload-roundtrip")?.rawPayloadShape).toMatchObject({
        providerField: expect.any(String),
        payloadClass: "tool-call-arguments-delta",
      })
      expect(snapshot.rawPayloadRoundTrip.scenarios.find((scenario) => scenario.scenarioID === "error-payload-roundtrip")?.lossiness).toEqual(expect.arrayContaining(["native-error-id"]))
      expect(streamProjector?.scenarios.find((scenario) => scenario.scenarioID === "error-retry-cancel")).toMatchObject({
        providerProtocol: product === "pi-mono" ? "anthropic" : product === "nanobot" ? "openrouter" : "openai-compatible",
        eventSequence: ["finish"],
        observedShape: expect.objectContaining({
          finishReason: "error",
          retry: "partial",
          cancel: "partial",
          projectorOutput: expect.any(String),
        }),
        visibility: "inferred",
      })
      if (product === "pi-mono") {
        expect(deltaRecorder?.scenarios[0]?.providerProtocol).toBe("anthropic")
        expect(streamProjector?.scenarios[0]?.observedShape).toMatchObject({ projectorOutput: "jsonl-v3-events" })
      }
      if (product === "nanobot") {
        expect(deltaRecorder?.scenarios[0]?.providerProtocol).toBe("openrouter")
      }
      expect(deltaRecorder?.scenarios.find((scenario) => scenario.scenarioID === "google-provider-path")?.observedShape).toMatchObject({
        providerPathCoverage: "partial-semantic-sample",
        googleEventNames: expect.arrayContaining(["content", "functionCall", "finishReason"]),
      })
    }
  })

  it("records native-like session message part replay snapshots for message part projectors", () => {
    const products = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const
    for (const product of products) {
      const snapshot = buildSessionMessagePartReplaySnapshot(product)
      const storageRoundTrip = buildSessionStorageRoundTripSnapshot(product)
      const providerMetadataRoundTrip = buildSessionProviderMetadataRoundTripSnapshot(product)
      const projector = snapshot.atoms.find((atom) => atom.key === "message-part-projector")

      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        product,
        evidenceRef: `conformance:${product}-session-message-part-replay-snapshot`,
        fixtureIDs: expect.arrayContaining([`${product}-session-message-part:message-part-projector`, `${product}-session-message-part:storage-roundtrip`, `${product}-session-message-part:provider-metadata-roundtrip`]),
        coveredKeys: ["message-part-projector"],
        profileFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        storageRoundTripFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        providerMetadataRoundTripFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        storageRoundTrip: expect.objectContaining({
          evidenceRef: `conformance:${product}-session-storage-roundtrip`,
          fixtureID: `${product}-session-message-part:storage-roundtrip`,
          scenarios: expect.arrayContaining([
            expect.objectContaining({ scenarioID: "assistant-message-write-read", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "tool-call-result-write-read", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "provider-raw-metadata-readback", visibility: "inferred", exactness: "raw-only" }),
          ]),
          lossyFields: expect.arrayContaining(["partial-session-storage-roundtrip", "native-storage-transaction-order-not-replayed", "provider-raw-metadata-roundtrip-not-proven"]),
        }),
        providerMetadataRoundTrip: expect.objectContaining({
          evidenceRef: `conformance:${product}-session-provider-metadata-roundtrip`,
          fixtureID: `${product}-session-message-part:provider-metadata-roundtrip`,
          scenarios: expect.arrayContaining([
            expect.objectContaining({ scenarioID: "provider-raw-metadata-presence-readback", visibility: "inferred", exactness: "raw-only" }),
            expect.objectContaining({ scenarioID: "tool-result-provider-metadata-linkage", visibility: "observed", exactness: "semantic" }),
            expect.objectContaining({ scenarioID: "branch-lineage-provider-metadata-linkage", visibility: "inferred", exactness: "inferred" }),
          ]),
          lossyFields: expect.arrayContaining(["partial-session-provider-metadata-roundtrip", "provider-metadata-private-state-not-replayed", "native-storage-transaction-order-not-replayed"]),
        }),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        knownGaps: expect.arrayContaining(["full-native-session-storage-roundtrip-not-proven", "session-storage-roundtrip-covered-by-partial-readback-fixture", "session-provider-metadata-roundtrip-covered-by-partial-fixture"]),
      })
      expect(snapshot.storageRoundTripFingerprint).toBe(snapshot.storageRoundTrip.fingerprint)
      expect(snapshot.storageRoundTripFingerprint).toBe(storageRoundTrip.fingerprint)
      expect(snapshot.providerMetadataRoundTripFingerprint).toBe(snapshot.providerMetadataRoundTrip.fingerprint)
      expect(snapshot.providerMetadataRoundTripFingerprint).toBe(providerMetadataRoundTrip.fingerprint)
      expect(projector).toMatchObject({
        atomID: expect.stringMatching(/\.session\.message-part-projector\.native-like$/),
        portID: "session.message-part-projector",
        flowStageID: "stream.project",
        storageRoundTripFingerprint: snapshot.storageRoundTripFingerprint,
        storageRoundTripFixtureID: `${product}-session-message-part:storage-roundtrip`,
        providerMetadataRoundTripFingerprint: snapshot.providerMetadataRoundTripFingerprint,
        providerMetadataRoundTripFixtureID: `${product}-session-message-part:provider-metadata-roundtrip`,
        fixtureID: `${product}-session-message-part:message-part-projector`,
        scenarios: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "assistant-text-roundtrip", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "tool-call-lifecycle", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "native-metadata-record", visibility: "inferred", exactness: "raw-only" }),
        ]),
        roundTripFields: expect.arrayContaining(["part.id", "part.type", "message.role"]),
        nativeOnlyFields: expect.any(Array),
        inferredFields: expect.any(Array),
        irrecoverableFields: expect.any(Array),
        lossyFields: expect.arrayContaining(["semantic-session-message-part-replay", "native-storage-roundtrip-partial", "partial-session-storage-roundtrip", "partial-session-provider-metadata-roundtrip"]),
      })
      if (product === "opencode") {
        expect(projector?.scenarios.find((scenario) => scenario.scenarioID === "tool-call-lifecycle")?.observedShape).toMatchObject({
          nativeLifecycle: "step-tool-parts",
        })
        expect(projector?.nativeOnlyFields).toEqual(expect.arrayContaining(["sqlite.rowid", "provider.raw_part_metadata"]))
      }
      if (product === "pi-mono") {
        expect(projector?.scenarios.find((scenario) => scenario.scenarioID === "assistant-text-roundtrip")?.nativePartTypes).toEqual(["message_update"])
        expect(projector?.inferredFields).toEqual(expect.arrayContaining(["jsonl-v3-provider-record-order"]))
      }
      if (product === "nanobot") {
        expect(projector?.scenarios.find((scenario) => scenario.scenarioID === "assistant-text-roundtrip")?.observedShape).toMatchObject({
          nativeRecord: "workspace-sessions-jsonl",
        })
      }
      if (product === "hermes-agent") {
        expect(projector?.scenarios.find((scenario) => scenario.scenarioID === "compaction-record")?.nativePartTypes).toEqual(["trajectory_compression"])
      }
    }
  })

  it("keeps runtime acceptance behavior in bound product atoms", () => {
    const parts = [{ id: createID("part"), type: "text" as const, text: "done" }]
    const statuses = Object.fromEntries(
      (["common", "opencode", "pi-mono", "nanobot"] as const).map((product) => {
        const evidenceProvider = createRuntimeAcceptanceEvidenceProvider({
          product,
          workspaceRoot: "",
          beforeSnapshot: {},
        })
        const controller = createRuntimeTaskAcceptanceController({ product, evidenceProvider })
        const decision = controller.decide({
          product,
          step: 0,
          parts,
        })
        expect(decision.evidence).toMatchObject({
          timeline: expect.objectContaining({ visibleSummaryAvailableAt: "message-end" }),
          satisfiedAt: expect.any(String),
          unavailableUntil: [],
        })
        return [
          product,
          decision.status,
        ]
      }),
    )

    expect(statuses).toEqual({
      common: "continue",
      opencode: "summarize",
      "pi-mono": "accept",
      nanobot: "accept",
    })
  })

  it("records native-like runtime acceptance replay snapshots for controller and evidence timing", () => {
    const products = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const
    for (const product of products) {
      const snapshot = buildRuntimeAcceptanceReplaySnapshot(product)
      const timingBoundary = buildRuntimeAcceptanceTimingBoundarySnapshot(product)
      const lifecycle = buildRuntimeAcceptanceLifecycleSnapshot(product)
      const persistenceCleanup = buildRuntimeAcceptancePersistenceCleanupSnapshot(product)
      const controller = snapshot.atoms.find((atom) => atom.key === "acceptance-controller")
      const evidence = snapshot.atoms.find((atom) => atom.key === "acceptance-evidence")

      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        product,
        evidenceRef: `conformance:${product}-runtime-acceptance-replay-snapshot`,
        fixtureIDs: expect.arrayContaining([`${product}-runtime-acceptance:acceptance-controller`, `${product}-runtime-acceptance:acceptance-evidence`, `${product}-runtime-acceptance:timing-boundary`, `${product}-runtime-acceptance:lifecycle`, `${product}-runtime-acceptance:persistence-cleanup`]),
        coveredKeys: ["acceptance-controller", "acceptance-evidence"],
        profileFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        timingBoundaryFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        lifecycleFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        persistenceCleanupFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        timingBoundary: expect.objectContaining({
          evidenceRef: `conformance:${product}-runtime-acceptance-timing-boundary`,
          fixtureID: `${product}-runtime-acceptance:timing-boundary`,
          scenarios: expect.arrayContaining([
            expect.objectContaining({ scenarioID: "provider-finish-stop-boundary", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "policy-satisfied-accept-boundary", evidenceAvailableAt: "tool-result-after" }),
            expect.objectContaining({ scenarioID: "permission-denied-continue-boundary", decisionEvent: "continue", visibility: "inferred" }),
            expect.objectContaining({ scenarioID: "tool-error-retry-boundary", visibility: "inferred" }),
            expect.objectContaining({ scenarioID: "interrupt-fail-boundary", decisionEvent: "fail", visibility: "inferred" }),
          ]),
          lossyFields: expect.arrayContaining(["partial-runtime-acceptance-timing-boundary", "full-upstream-stop-continue-timing-not-replayed", "process-cleanup-side-effects-not-replayed"]),
        }),
        lifecycle: expect.objectContaining({
          evidenceRef: `conformance:${product}-runtime-acceptance-lifecycle`,
          fixtureID: `${product}-runtime-acceptance:lifecycle`,
          scenarios: expect.arrayContaining([
            expect.objectContaining({ scenarioID: "read-only-finalization-lifecycle", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "policy-pass-evidence-persistence", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "permission-denied-continue-lifecycle", decisionEvent: "continue", visibility: "inferred" }),
            expect.objectContaining({ scenarioID: "tool-error-retry-lifecycle", visibility: "inferred" }),
            expect.objectContaining({ scenarioID: "interrupt-cleanup-fail-lifecycle", decisionEvent: "fail", visibility: "inferred" }),
          ]),
          lossyFields: expect.arrayContaining(["partial-runtime-acceptance-lifecycle", "native-evidence-persistence-order-not-replayed", "native-acceptance-record-id-partial"]),
        }),
        persistenceCleanup: expect.objectContaining({
          evidenceRef: `conformance:${product}-runtime-acceptance-persistence-cleanup`,
          fixtureID: `${product}-runtime-acceptance:persistence-cleanup`,
          scenarios: expect.arrayContaining([
            expect.objectContaining({ scenarioID: "read-only-summary-persistence-order", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "policy-pass-evidence-write-order", visibility: "observed" }),
            expect.objectContaining({ scenarioID: "permission-denied-continue-persistence", decisionEvent: "continue", visibility: "inferred" }),
            expect.objectContaining({ scenarioID: "tool-error-retry-cleanup-order", visibility: "inferred" }),
            expect.objectContaining({ scenarioID: "interrupt-cleanup-side-effect-order", decisionEvent: "fail", visibility: "inferred" }),
          ]),
          lossyFields: expect.arrayContaining(["partial-runtime-acceptance-persistence-cleanup", "native-evidence-persistence-order-not-replayed", "cleanup-side-effect-order-not-full-native"]),
        }),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        knownGaps: expect.arrayContaining([
          "full-upstream-stop-continue-timing-not-replayed",
          "runtime-acceptance-timing-boundary-covered-by-partial-fixture",
          "runtime-acceptance-lifecycle-covered-by-partial-fixture",
          "runtime-acceptance-persistence-cleanup-covered-by-partial-fixture",
          "native-evidence-persistence-order-not-replayed",
          "cleanup-side-effect-order-not-full-native",
          "permission-denied-and-tool-error-retry-paths-partial",
          "native-task-runner-side-effects-normalized",
        ]),
      })
      expect(snapshot.timingBoundaryFingerprint).toBe(snapshot.timingBoundary.fingerprint)
      expect(snapshot.timingBoundaryFingerprint).toBe(timingBoundary.fingerprint)
      expect(snapshot.lifecycleFingerprint).toBe(snapshot.lifecycle.fingerprint)
      expect(snapshot.lifecycleFingerprint).toBe(lifecycle.fingerprint)
      expect(snapshot.persistenceCleanupFingerprint).toBe(snapshot.persistenceCleanup.fingerprint)
      expect(snapshot.persistenceCleanupFingerprint).toBe(persistenceCleanup.fingerprint)
      expect(controller).toMatchObject({
        atomID: expect.stringMatching(/\.runtime\.acceptance-controller\.native-like$/),
        portID: "runtime.acceptance-controller",
        flowStageID: "acceptance.check",
        timingBoundaryFingerprint: snapshot.timingBoundaryFingerprint,
        timingBoundaryFixtureID: `${product}-runtime-acceptance:timing-boundary`,
        lifecycleFingerprint: snapshot.lifecycleFingerprint,
        lifecycleFixtureID: `${product}-runtime-acceptance:lifecycle`,
        persistenceCleanupFingerprint: snapshot.persistenceCleanupFingerprint,
        persistenceCleanupFixtureID: `${product}-runtime-acceptance:persistence-cleanup`,
        fixtureID: `${product}-runtime-acceptance:acceptance-controller`,
        scenarios: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "read-only", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "single-file-edit", satisfiedAt: "tool-result-after", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "test-fix", workspaceOutcome: "test-pass", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "permission-denied", expectedDecision: "continue", visibility: "inferred" }),
          expect.objectContaining({ scenarioID: "tool-error-retry", toolOutcome: "error-then-success", visibility: "inferred" }),
        ]),
        observedFields: expect.arrayContaining(["decisionOnPass", "reasonCode", "policySatisfiedAt"]),
        inferredFields: expect.arrayContaining([
          "provider-finish-to-accept-clock",
          "permission-denied-native-loop-boundary",
          "tool-error-retry-native-clock",
        ]),
        lossyFields: expect.arrayContaining(["semantic-runtime-acceptance-replay", "full-stop-continue-timing-not-replayed", "partial-runtime-acceptance-timing-boundary", "partial-runtime-acceptance-lifecycle", "partial-runtime-acceptance-persistence-cleanup"]),
      })
      expect(evidence).toMatchObject({
        atomID: expect.stringMatching(/\.runtime\.acceptance-evidence\.native-like$/),
        portID: "runtime.acceptance-evidence",
        flowStageID: "acceptance.check",
        timingBoundaryFingerprint: snapshot.timingBoundaryFingerprint,
        timingBoundaryFixtureID: `${product}-runtime-acceptance:timing-boundary`,
        lifecycleFingerprint: snapshot.lifecycleFingerprint,
        lifecycleFixtureID: `${product}-runtime-acceptance:lifecycle`,
        persistenceCleanupFingerprint: snapshot.persistenceCleanupFingerprint,
        persistenceCleanupFixtureID: `${product}-runtime-acceptance:persistence-cleanup`,
        fixtureID: `${product}-runtime-acceptance:acceptance-evidence`,
        scenarios: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "read-only", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "single-file-edit", satisfiedAt: "tool-result-after" }),
          expect.objectContaining({ scenarioID: "test-fix", workspaceOutcome: "test-pass" }),
          expect.objectContaining({ scenarioID: "permission-denied", expectedDecision: "continue", visibility: "inferred" }),
          expect.objectContaining({ scenarioID: "tool-error-retry", toolOutcome: "error-then-success", visibility: "inferred" }),
        ]),
        observedFields: expect.arrayContaining(["checks", "requiredToolResultAvailableAt", "unavailableUntil"]),
        inferredFields: expect.arrayContaining([
          "provider-finish-to-accept-clock",
          "permission-denied-native-loop-boundary",
          "tool-error-retry-native-clock",
        ]),
        lossyFields: expect.arrayContaining(["semantic-runtime-acceptance-replay", "full-stop-continue-timing-not-replayed", "partial-runtime-acceptance-timing-boundary", "partial-runtime-acceptance-lifecycle", "partial-runtime-acceptance-persistence-cleanup"]),
      })
      expect(controller?.scenarios.find((scenario) => scenario.scenarioID === "permission-denied")?.observedShape).toMatchObject({
        blockingEvidence: expect.arrayContaining(["permission.ask"]),
        unavailableUntil: "turn-end",
      })
      expect(controller?.scenarios.find((scenario) => scenario.scenarioID === "tool-error-retry")?.observedShape).toMatchObject({
        retry: "partial",
        firstToolResult: "error",
        finalToolResult: "success",
      })
      if (product === "opencode") {
        expect(controller?.scenarios.find((scenario) => scenario.scenarioID === "read-only")?.expectedDecision).toBe("summarize")
        expect(controller?.lossyFields).toEqual(expect.arrayContaining(["opencode-final-summary-timing-partial"]))
      }
      if (product === "pi-mono") {
        expect(controller?.scenarios.find((scenario) => scenario.scenarioID === "read-only")?.expectedDecision).toBe("accept")
        expect(evidence?.observedFields).toEqual(expect.arrayContaining(["forbiddenFileCheckAvailableAt"]))
      }
      if (product === "hermes-agent") {
        expect(controller?.scenarios.find((scenario) => scenario.scenarioID === "read-only")?.observedShape).toMatchObject({
          passReason: "hermes-policy-satisfied-after-livecodebench-evidence",
        })
      }
    }
  })

  it("records runtime acceptance lifecycle replay positive and negative gates", () => {
    const snapshot = buildRuntimeAcceptanceLifecycleReplayGateSnapshot()
    const verification = verifyRuntimeAcceptanceLifecycleReplayGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:runtime-acceptance-lifecycle-replay-gate",
      fixtureID: "runtime:acceptance-lifecycle-replay-gate",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: ["lifecycle-start-stop", "accept-continue-timing", "process-cleanup", "evidence-persistence", "interrupt-path"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      nativeReplayStatus: "partial-native-anchored",
      evidenceRefs: expect.arrayContaining([
        "conformance:opencode-runtime-acceptance-replay-snapshot",
        "conformance:opencode-runtime-acceptance-timing-boundary",
        "conformance:opencode-runtime-acceptance-lifecycle",
        "conformance:opencode-runtime-acceptance-persistence-cleanup",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-runtime-acceptance:acceptance-controller",
        "opencode-runtime-acceptance:timing-boundary",
        "opencode-runtime-acceptance:lifecycle",
        "opencode-runtime-acceptance:persistence-cleanup",
      ]),
      knownLossiness: expect.arrayContaining([
        "partial-runtime-acceptance-timing-boundary",
        "partial-runtime-acceptance-lifecycle",
        "partial-runtime-acceptance-persistence-cleanup",
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")?.acceptContinueTiming).toEqual(expect.arrayContaining(["continue-boundary", "tool-result-after"]))
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.interruptPath).toEqual(expect.arrayContaining(["interrupt-cleanup-fail-lifecycle", "interrupt-cleanup-side-effect-order"]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.processCleanup.join("|")).toContain("api-worker-cleanup")

    const timingDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, acceptContinueTiming: [] }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptanceLifecycleReplayGateSnapshot(timingDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance.accept-continue-timing",
        product: "pi-mono",
        dimension: "accept-continue-timing",
      }),
    ]))

    const cleanupDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, processCleanup: [] }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptanceLifecycleReplayGateSnapshot(cleanupDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance.process-cleanup",
        product: "hermes-agent",
        dimension: "process-cleanup",
      }),
    ]))

    const inferredOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeReplayStatus: "assembled-inferred-only" as const }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptanceLifecycleReplayGateSnapshot(inferredOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance.native-replay-status",
        product: "opencode",
        dimension: "accept-continue-timing",
      }),
    ]))
  })

  it("records runtime acceptance exact-diff blockers without claiming native parity", () => {
    const snapshot = buildRuntimeAcceptanceExactDiffBlockerSnapshot()
    const verification = verifyRuntimeAcceptanceExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:runtime-acceptance-exact-diff-blocker-gate",
      fixtureID: "runtime:acceptance-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: ["lifecycle-start-stop", "accept-continue-timing", "process-cleanup", "evidence-persistence", "interrupt-path"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      lifecycleStartStop: expect.arrayContaining(["native-lifecycle-start-stop:exact-diff-not-proven"]),
      acceptContinueTiming: expect.arrayContaining(["accept-continue-timing:exact-diff-not-proven"]),
      runtimeEvidenceAnchors: expect.arrayContaining([
        "conformance:opencode-runtime-acceptance-replay-snapshot",
        "opencode-runtime-acceptance:timing-boundary",
      ]),
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-runtime-acceptance-lifecycle"]),
      exactDiffRisk: "semantic-fixture-needs-exact-diff",
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      acceptContinueTiming: expect.arrayContaining(["continue-boundary", "tool-result-after"]),
      evidencePersistence: expect.arrayContaining(["evidence-persistence-readback:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      interruptPath: expect.arrayContaining(["interrupt-cleanup-fail-lifecycle", "interrupt-cleanup-path:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")).toMatchObject({
      processCleanup: expect.arrayContaining(["api-worker-cleanup", "process-cleanup-side-effects:exact-diff-not-proven"]),
    })

    const lifecycleDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, lifecycleStartStop: [] }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptanceExactDiffBlockerSnapshot(lifecycleDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-exact-diff.lifecycle-start-stop",
        product: "opencode",
        dimension: "lifecycle-start-stop",
      }),
    ]))

    const timingDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, acceptContinueTiming: [] }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptanceExactDiffBlockerSnapshot(timingDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-exact-diff.accept-continue-timing",
        product: "pi-mono",
        dimension: "accept-continue-timing",
      }),
    ]))

    const cleanupDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, processCleanup: [] }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptanceExactDiffBlockerSnapshot(cleanupDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-exact-diff.process-cleanup",
        product: "hermes-agent",
        dimension: "process-cleanup",
      }),
    ]))

    const persistenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, evidencePersistence: [] }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptanceExactDiffBlockerSnapshot(persistenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-exact-diff.evidence-persistence",
        product: "opencode",
        dimension: "evidence-persistence",
      }),
    ]))

    const interruptDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, interruptPath: [] }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptanceExactDiffBlockerSnapshot(interruptDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-exact-diff.interrupt-path",
        product: "nanobot",
        dimension: "interrupt-path",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptanceExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-exact-diff.native-claim",
        product: "hermes-agent",
        dimension: "accept-continue-timing",
      }),
    ]))

    const inferredOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "assembled-inferred-only" as const }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptanceExactDiffBlockerSnapshot(inferredOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-exact-diff.assembled-inferred-only",
        product: "pi-mono",
        dimension: "accept-continue-timing",
      }),
    ]))
  })

  it("records runtime acceptance pinned replay fixtures without claiming native parity", () => {
    const snapshot = buildRuntimeAcceptancePinnedReplaySnapshot()
    const verification = verifyRuntimeAcceptancePinnedReplaySnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:runtime-acceptance-pinned-replay-gate",
      fixtureID: "runtime:acceptance-pinned-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: ["lifecycle-start-stop", "accept-continue-timing", "process-cleanup", "evidence-persistence", "interrupt-path"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "pinned-runtime-replay-needs-live-native-runtime",
      upstreamTrace: expect.arrayContaining([
        expect.objectContaining({ dimension: "lifecycle-start-stop", value: "provider-finish->acceptance-check->summary-stop", sourceAnchor: "opencode-runtime:provider-finish-message-end" }),
        expect.objectContaining({ dimension: "evidence-persistence", sourceAnchor: "opencode-runtime:session-writeback-readback" }),
      ]),
      productReplayTrace: expect.arrayContaining([
        expect.objectContaining({ dimension: "accept-continue-timing", evidenceAnchor: "opencode-runtime-acceptance:timing-boundary" }),
      ]),
      replayAnchors: expect.arrayContaining(["conformance:opencode-runtime-acceptance-replay-snapshot", "opencode-runtime-acceptance:timing-boundary"]),
      runtimeEvidenceAnchors: expect.arrayContaining(["provider-finish-stop-boundary", "acceptance-controller:read-only"]),
      knownLossiness: expect.arrayContaining(["runtime-acceptance-pinned-replay-live-native-lifecycle-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      upstreamTrace: expect.arrayContaining([
        expect.objectContaining({ dimension: "accept-continue-timing", sourceAnchor: "pi-runtime:session-replacement-timing" }),
        expect.objectContaining({ dimension: "evidence-persistence", sourceAnchor: "pi-runtime:jsonl-session-tree" }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      upstreamTrace: expect.arrayContaining([
        expect.objectContaining({ dimension: "process-cleanup", sourceAnchor: "nanobot-runtime:length-recovery-cleanup" }),
        expect.objectContaining({ dimension: "interrupt-path", sourceAnchor: "nanobot-runtime:workspace-violation-interrupt" }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")).toMatchObject({
      upstreamTrace: expect.arrayContaining([
        expect.objectContaining({ dimension: "process-cleanup", sourceAnchor: "hermes-runtime:transport-recovery-cleanup" }),
        expect.objectContaining({ dimension: "interrupt-path", sourceAnchor: "hermes-runtime:force-close-cleanup" }),
      ]),
    })

    const lifecycleDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              productReplayTrace: item.productReplayTrace.map((record) =>
                record.dimension === "lifecycle-start-stop"
                  ? { ...record, value: "provider-finish->assembled-policy-only" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptancePinnedReplaySnapshot(lifecycleDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-pinned-replay.lifecycle-start-stop",
        product: "opencode",
        dimension: "lifecycle-start-stop",
      }),
    ]))

    const timingDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? {
              ...item,
              assembledTrace: item.assembledTrace.map((record) =>
                record.dimension === "accept-continue-timing"
                  ? { ...record, value: "local-policy:immediate-accept" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptancePinnedReplaySnapshot(timingDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-pinned-replay.accept-continue-timing",
        product: "pi-mono",
        dimension: "accept-continue-timing",
      }),
    ]))

    const cleanupDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              productReplayTrace: item.productReplayTrace.map((record) =>
                record.dimension === "process-cleanup"
                  ? { ...record, value: "helper-close-before-transport-recovery" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptancePinnedReplaySnapshot(cleanupDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-pinned-replay.process-cleanup",
        product: "hermes-agent",
        dimension: "process-cleanup",
      }),
    ]))

    const persistenceDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledTrace: item.assembledTrace.map((record) =>
                record.dimension === "evidence-persistence"
                  ? { ...record, value: "memory-only-acceptance-record" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptancePinnedReplaySnapshot(persistenceDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-pinned-replay.evidence-persistence",
        product: "opencode",
        dimension: "evidence-persistence",
      }),
    ]))

    const interruptDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? {
              ...item,
              productReplayTrace: item.productReplayTrace.map((record) =>
                record.dimension === "interrupt-path"
                  ? { ...record, value: "workspace-violation->no-cleanup" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptancePinnedReplaySnapshot(interruptDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-pinned-replay.interrupt-path",
        product: "nanobot",
        dimension: "interrupt-path",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptancePinnedReplaySnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-pinned-replay.native-claim",
        product: "hermes-agent",
        dimension: "accept-continue-timing",
      }),
    ]))

    const inferredOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "assembled-inferred-only" as const }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptancePinnedReplaySnapshot(inferredOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-pinned-replay.assembled-inferred-only",
        product: "pi-mono",
        dimension: "accept-continue-timing",
      }),
    ]))

    const borrowedSourceMatrix = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, runtimeEvidenceAnchors: ["opencode-runtime:session-writeback-readback"] }
          : item,
      ),
    }
    expect(verifyRuntimeAcceptancePinnedReplaySnapshot(borrowedSourceMatrix).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-pinned-replay.borrowed-source-matrix",
        product: "nanobot",
        dimension: "lifecycle-start-stop",
      }),
    ]))
  })

  it("projects OpenCode turn steps into runtime acceptance boundary evidence", () => {
    const projection = projectOpenCodeRuntimeLoopAcceptanceBoundary([
      {
        type: "turn.step",
        branchID: "provider-finish-to-acceptance",
        stepID: "opencode.provider.sse-001",
        turnDimension: "provider-step",
        sourceAnchor: "opencode-turn:provider-stream-runner",
        sideEffectID: "raw-sse-frame-order",
        eventKeys: ["provider-finish", "message-end", "provider-finish"],
        sequence: 1,
      },
      {
        type: "turn.step",
        branchID: "tool-result-to-acceptance",
        stepID: "opencode.tool.bash-001",
        turnDimension: "tool-step",
        sourceAnchor: "opencode-turn:tool-executor",
        sideEffectID: "permission-tool-scheduler",
        eventKeys: ["tool-result", "workspace-diff"],
        sequence: 2,
      },
      {
        type: "turn.step",
        branchID: "session-writeback-readback",
        stepID: "opencode.session.sqlite-write-001",
        turnDimension: "summary-step",
        sourceAnchor: "opencode-turn:result-recorder",
        sideEffectID: "sqlite-session-write",
        eventKeys: ["message-v2-assistant-parts", "session-readback"],
        sequence: 3,
      },
      {
        type: "turn.step",
        branchID: "summary-stop-boundary",
        stepID: "opencode.summary.stop-001",
        turnDimension: "summary-step",
        sourceAnchor: "opencode-turn:stop-condition",
        sideEffectID: "message-v2-assistant-parts",
        eventKeys: ["tool-use-stop", "final-summary"],
        sequence: 4,
      },
      {
        type: "acceptance.decision",
        decision: "summarize",
        satisfiedAt: "message-end",
        evidenceKeys: ["visibleSummaryPresent", "workspaceDiffCount", "visibleSummaryPresent"],
        persistenceKeys: ["sqlite-session-write", "acceptance-record"],
        sequence: 5,
      },
      {
        type: "cleanup.side-effect",
        surface: "process",
        operation: "abort-reader-cleanup",
        recordID: "cleanup-1",
        exactOrderObserved: false,
        sequence: 6,
      },
    ])
    const verification = verifyOpenCodeRuntimeLoopAcceptanceBoundaryProjection(projection)

    expect(projection).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      fixtureID: "opencode-runtime:loop-acceptance-boundary-projection",
      evidenceRef: "conformance:opencode-runtime-loop-acceptance-boundary-projection",
      coveredBranchIDs: [
        "provider-finish-to-acceptance",
        "tool-result-to-acceptance",
        "session-writeback-readback",
        "summary-stop-boundary",
        "cleanup-side-effects",
      ],
      retainedFields: expect.arrayContaining(["branchID", "stepID", "decision", "satisfiedAt", "recordIDObserved"]),
      lossyFields: expect.arrayContaining([
        "native loop wall-clock timing",
        "turn event object identity",
        "sqlite session write transaction boundaries",
        "acceptance evidence readback ordering",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-runtime-loop-acceptance-boundary-projection-partial-fixture",
        "opencode-full-native-loop-timing-not-replayed",
        "opencode-runtime-acceptance-persistence-readback-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(projection.turnSteps).toEqual([
      {
        branchID: "provider-finish-to-acceptance",
        stepID: "opencode.provider.sse-001",
        turnDimension: "provider-step",
        sourceAnchor: "opencode-turn:provider-stream-runner",
        sideEffectID: "raw-sse-frame-order",
        eventKeys: ["message-end", "provider-finish"],
        sequence: 1,
      },
      {
        branchID: "tool-result-to-acceptance",
        stepID: "opencode.tool.bash-001",
        turnDimension: "tool-step",
        sourceAnchor: "opencode-turn:tool-executor",
        sideEffectID: "permission-tool-scheduler",
        eventKeys: ["tool-result", "workspace-diff"],
        sequence: 2,
      },
      {
        branchID: "session-writeback-readback",
        stepID: "opencode.session.sqlite-write-001",
        turnDimension: "summary-step",
        sourceAnchor: "opencode-turn:result-recorder",
        sideEffectID: "sqlite-session-write",
        eventKeys: ["message-v2-assistant-parts", "session-readback"],
        sequence: 3,
      },
      {
        branchID: "summary-stop-boundary",
        stepID: "opencode.summary.stop-001",
        turnDimension: "summary-step",
        sourceAnchor: "opencode-turn:stop-condition",
        sideEffectID: "message-v2-assistant-parts",
        eventKeys: ["final-summary", "tool-use-stop"],
        sequence: 4,
      },
    ])
    expect(projection.acceptanceDecisions).toEqual([
      {
        decision: "summarize",
        satisfiedAt: "message-end",
        evidenceKeys: ["visibleSummaryPresent", "workspaceDiffCount"],
        persistenceKeys: ["acceptance-record", "sqlite-session-write"],
        sequence: 5,
      },
    ])
    expect(projection.cleanupSideEffects).toEqual([
      { surface: "process", operation: "abort-reader-cleanup", recordIDObserved: true, exactOrderObserved: false, sequence: 6 },
    ])

    const missingSummary = {
      ...projection,
      coveredBranchIDs: projection.coveredBranchIDs.filter((branchID) => branchID !== "summary-stop-boundary"),
    }
    expect(verifyOpenCodeRuntimeLoopAcceptanceBoundaryProjection(missingSummary).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "opencode-runtime-loop-acceptance-boundary.missing-branch",
        branchID: "summary-stop-boundary",
      }),
    ]))
  })

  it("keeps early accept blocked until required evidence is visible", () => {
    const evidenceProvider = createRuntimeAcceptanceEvidenceProvider({
      product: "pi-mono",
      workspaceRoot: "",
      beforeSnapshot: {},
      expected: {
        toolNames: ["bash"],
        toolResultIncludesByTool: [{ toolName: "bash", includes: ["ok"] }],
      },
    })
    const controller = createRuntimeTaskAcceptanceController({ product: "pi-mono", evidenceProvider })
    const decision = controller.decide({
      product: "pi-mono",
      step: 0,
      parts: [{ id: createID("part"), type: "text", text: "done" }],
    })

    expect(decision.status).toBe("continue")
    expect(decision.evidence).toMatchObject({
      timeline: expect.objectContaining({ requiredToolResultAvailableAt: "unavailable", policySatisfiedAt: "unavailable" }),
      blockingEvidence: expect.arrayContaining(["tool.called.bash", "tool.result.bash.includes.ok"]),
      unavailableUntil: expect.arrayContaining([expect.objectContaining({ evidence: "tool.called.bash", until: "unavailable" })]),
    })
  })
})
