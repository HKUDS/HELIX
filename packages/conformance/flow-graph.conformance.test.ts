import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { runCli } from "@helix/cli"
import {
  buildAssembledFlowBlueprint,
  buildAssembledFlowRun,
  buildAssemblyContract,
  buildCanonicalFlowCatalog,
  buildCurrentModulePlaceholderAudit,
  buildHarnessFlowComparison,
  createProductTaskParitySplitArtifactSet,
  createProductTaskNativeCadenceFixtureSet,
  createProductTaskNativeCadenceFixtureSplitSet,
  buildOriginalFlowForProduct,
  buildOriginalFlowFromNativeCadenceFixture,
  canonicalFlowStages,
  defaultFlowTaskIDs,
  compareHarnessFlows,
  nativeFlowAdapterProfileForProduct,
  opencodeRecipe,
  runProductTaskParitySuite,
  verifyHarnessFlowArtifact,
  verifyHarnessFlowGraph,
  writeProductTaskParityArtifact,
  writeProductTaskParitySplitArtifactSet,
  writeProductTaskNativeCadenceFixtureSplitSet,
  type HarnessFlowGraph,
  type HarnessFlowLiveProviderSummary,
} from "@helix/recipes"

describe("flow graph conformance", () => {
  it("builds a stable assembled blueprint with every canonical stage", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z" })
    const graph = buildAssembledFlowBlueprint(contract, "2026-06-09T00:00:00.000Z")
    const verification = verifyHarnessFlowGraph(graph)

    expect(verification.ok).toBe(true)
    expect(graph.schemaVersion).toBe(1)
    expect(graph.source).toBe("assembled")
    expect(graph.mode).toBe("blueprint")
    expect(graph.nodes.map((node) => node.id)).toEqual(canonicalFlowStages.map((stage) => stage.id))
    expect(graph.edges).toHaveLength(canonicalFlowStages.length - 1)
    expect(graph.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)
    expect(graph.nodes.find((node) => node.id === "provider.request")?.assembledPortIDs).toEqual(expect.arrayContaining(["provider.request-shape"]))
    expect(graph.nodes.find((node) => node.id === "prompt.assemble")?.metrics).toMatchObject({
      parityTargetRefs: expect.arrayContaining(["anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"]),
      parityTargetSatisfied: true,
      parityTargetBlockers: [],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.prompt.mode-builder",
          sourceProduct: "opencode",
          implementationLevel: "native",
          parityTargetProduct: "opencode",
          parityTargetRef: "anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
          parityCompatible: "satisfied",
          parityTargetSatisfied: true,
          evidenceRefs: expect.arrayContaining(["conformance:opencode-system-prompt-core-exact-fixture", "conformance:opencode-llm-request-system-exact-fixture"]),
          fixtureIDs: expect.arrayContaining(["opencode-prompt:system-prompt-core-exact-fixture", "opencode-prompt:llm-request-system-exact-fixture"]),
          knownLossiness: [],
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.turn.prompt-assembler",
          sourceProduct: "opencode",
          implementationLevel: "native",
          parityTargetProduct: "opencode",
          parityTargetRef: "anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
          parityCompatible: "satisfied",
          parityTargetSatisfied: true,
          evidenceRefs: expect.arrayContaining(["conformance:opencode-turn-prompt-assembler-native-exact-fixture"]),
          fixtureIDs: expect.arrayContaining(["opencode-turn-prompt-assembler:native-exact-fixture"]),
          knownLossiness: [],
          blockers: [],
        }),
      ]),
    })
    expect(graph.nodes.find((node) => node.id === "input.normalize")?.metrics).toMatchObject({
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-turn-input-normalizer-native-exact-fixture",
        "turn-input-normalizer-native-exact:opencode",
        "conformance:opencode-turn-replay-snapshot",
        "turn-replay:opencode:input-normalizer",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-turn-input-normalizer:native-exact-fixture",
        "opencode-turn:input-normalizer",
      ]),
    })
    expect(graph.nodes.find((node) => node.id === "input.normalize")?.metrics.knownLossiness).not.toEqual(expect.arrayContaining(["partial-product-turn-replay"]))
    expect(graph.nodes.find((node) => node.id === "context.build")?.metrics).toMatchObject({
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-turn-context-builder-native-exact-fixture",
        "turn-context-builder-native-exact:opencode",
        "conformance:opencode-turn-replay-snapshot",
        "turn-replay:opencode:context-builder",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-turn-context-builder:native-exact-fixture",
        "opencode-turn:context-builder",
      ]),
    })
    expect(graph.nodes.find((node) => node.id === "context.build")?.metrics.knownLossiness).not.toEqual(expect.arrayContaining(["partial-product-turn-replay", "common-runner-not-full-native-loop"]))
    expect(graph.nodes.find((node) => node.id === "provider.request")?.metrics).toMatchObject({
      implementationLevels: ["native"],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.turn.provider-request-builder",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          knownLossiness: [],
          blockers: [],
          fixtureIDs: expect.arrayContaining(["opencode-turn-provider-request-builder:native-exact-fixture"]),
        }),
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-turn-provider-request-builder-native-exact-fixture",
        "turn-provider-request-builder-native-exact:opencode",
        "conformance:opencode-turn-replay-snapshot",
        "turn-replay:opencode:provider-request-builder",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-turn-provider-request-builder:native-exact-fixture",
        "opencode-turn:provider-request-builder",
      ]),
    })
    const providerStreamMetrics = graph.nodes.find((node) => node.id === "provider.stream")?.metrics
    expect(providerStreamMetrics).toMatchObject({
      implementationLevels: ["native"],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.turn.provider-stream-runner",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          evidenceRefs: expect.arrayContaining(["conformance:opencode-turn-provider-stream-runner-native-exact-fixture"]),
          fixtureIDs: expect.arrayContaining(["opencode-turn-provider-stream-runner:native-exact-fixture"]),
          knownLossiness: [],
          blockers: [],
        }),
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-provider-parser-observer-native-exact-fixture",
        "conformance:opencode-provider-usage-native-exact-fixture",
        "conformance:opencode-turn-provider-stream-runner-native-exact-fixture",
        "turn-provider-stream-runner-native-exact:opencode",
        "conformance:opencode-turn-replay-snapshot",
        "turn-replay:opencode:provider-stream-runner",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-provider-parser-observer:native-exact-fixture",
        "opencode-provider-usage:native-exact-fixture",
        "opencode-turn-provider-stream-runner:native-exact-fixture",
        "opencode-turn:provider-stream-runner",
      ]),
    })
    expect(providerStreamMetrics?.implementationLevels ?? []).not.toContain("native-like")
    expect(providerStreamMetrics?.bridgeLayers ?? []).toEqual([])
    expect(providerStreamMetrics?.knownLossiness ?? []).not.toEqual(expect.arrayContaining([
        "partial-provider-stream-replay",
        "partial-provider-raw-frame-timeline",
        "partial-provider-raw-payload-roundtrip",
        "raw-frame-wall-clock-timing-not-replayed",
        "provider-retry-delay-not-exact",
    ]))
    expect(graph.nodes.find((node) => node.id === "provider.stream")?.metrics.knownLossiness ?? []).not.toContain("partial-product-turn-replay")
    const streamProjectMetrics = graph.nodes.find((node) => node.id === "stream.project")?.metrics
    expect(streamProjectMetrics).toMatchObject({
      implementationLevels: ["native"],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.turn.stream-reducer",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          evidenceRefs: expect.arrayContaining(["conformance:opencode-turn-stream-reducer-native-exact-fixture"]),
          fixtureIDs: expect.arrayContaining(["opencode-turn-stream-reducer:native-exact-fixture"]),
          knownLossiness: [],
          blockers: [],
        }),
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-turn-stream-reducer-native-exact-fixture",
        "turn-stream-reducer-native-exact:opencode",
        "conformance:opencode-turn-replay-snapshot",
        "turn-replay:opencode:stream-reducer",
      ]),
      fixtureIDs: expect.arrayContaining(["opencode-turn-stream-reducer:native-exact-fixture", "opencode-turn:stream-reducer"]),
    })
    expect(streamProjectMetrics?.implementationLevels ?? []).not.toContain("native-like")
    expect(streamProjectMetrics?.bridgeLayers ?? []).toEqual([])
    expect(streamProjectMetrics?.knownLossiness ?? []).not.toEqual(expect.arrayContaining([
        "partial-provider-stream-replay",
        "partial-provider-raw-frame-timeline",
        "partial-provider-raw-payload-roundtrip",
        "partial-session-message-part-replay",
        "partial-session-storage-roundtrip",
        "partial-session-provider-metadata-roundtrip",
        "cancel-abort-race-not-replayed",
    ]))
    expect(graph.nodes.find((node) => node.id === "tool.plan")?.metrics).toMatchObject({
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-turn-tool-call-planner-native-exact-fixture",
        "turn-tool-call-planner-native-exact:opencode",
        "conformance:opencode-turn-replay-snapshot",
        "turn-replay:opencode:tool-call-planner",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-turn-tool-call-planner:native-exact-fixture",
        "opencode-turn:tool-call-planner",
      ]),
    })
    expect(graph.nodes.find((node) => node.id === "tool.plan")?.metrics.knownLossiness ?? []).not.toContain("partial-product-turn-replay")
    expect(graph.nodes.find((node) => node.id === "tool.batch")?.metrics).toMatchObject({
      parityCoverage: "native",
      implementationLevels: ["native"],
      parityTargetSatisfied: true,
      parityTargetBlockers: [],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.tools.batch-scheduler.native-like",
          implementationLevel: "native",
          sourceProduct: "opencode",
          parityTargetSatisfied: true,
        }),
      ]),
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-native-exact-fixture", "tool-native-exact:opencode"]),
      fixtureIDs: expect.arrayContaining(["opencode-tool:native-exact-fixture"]),
    })
    expect(graph.nodes.find((node) => node.id === "tool.batch")?.metrics.knownLossiness ?? []).toEqual([])
    expect(graph.nodes.find((node) => node.id === "tool.execute")?.metrics).toMatchObject({
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-turn-tool-executor-native-exact-fixture",
        "turn-tool-executor-native-exact:opencode",
        "conformance:opencode-turn-replay-snapshot",
        "turn-replay:opencode:tool-executor",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-turn-tool-executor:native-exact-fixture",
        "opencode-turn:tool-executor",
      ]),
    })
    expect(graph.nodes.find((node) => node.id === "tool.execute")?.metrics.knownLossiness ?? []).not.toContain("partial-product-turn-replay")
    expect(graph.nodes.find((node) => node.id === "tool.result")?.metrics).toMatchObject({
      implementationLevels: ["native"],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.tools.result-projector.native-like",
          implementationLevel: "native",
          sourceProduct: "opencode",
          evidenceRefs: expect.arrayContaining([
            "conformance:opencode-tool-native-exact-fixture",
            "tool-native-exact:opencode",
          ]),
          fixtureIDs: ["opencode-tool:native-exact-fixture"],
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.tool.result-render-bridge",
          implementationLevel: "native",
          sourceProduct: "opencode",
          evidenceRefs: expect.arrayContaining([
            "conformance:opencode-tool-native-exact-fixture",
            "tool-native-exact:opencode",
          ]),
          fixtureIDs: ["opencode-tool:native-exact-fixture"],
          blockers: [],
        }),
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-tool-native-exact-fixture",
        "tool-native-exact:opencode",
      ]),
      fixtureIDs: ["opencode-tool:native-exact-fixture"],
    })
    expect(graph.nodes.find((node) => node.id === "tool.result")?.metrics.knownLossiness ?? []).not.toEqual(
      expect.arrayContaining(["partial-tool-cadence-replay", "partial-tool-result-event-stream", "partial-tool-result-envelope-roundtrip"]),
    )
    expect(graph.nodes.find((node) => node.id === "acceptance.check")?.metrics).toMatchObject({
      parityCoverage: "native",
      implementationLevels: ["native"],
      parityTargetSatisfied: true,
      parityTargetBlockers: [],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.runtime.acceptance-controller.native-like",
          implementationLevel: "native",
          parityTargetSatisfied: true,
        }),
        expect.objectContaining({
          atomID: "opencode.runtime.acceptance-evidence.native-like",
          implementationLevel: "native",
          parityTargetSatisfied: true,
        }),
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-runtime-acceptance-native-exact-fixture",
        "runtime-acceptance-native-exact:opencode",
      ]),
      fixtureIDs: ["opencode-runtime-acceptance:native-exact-fixture"],
    })
    expect(graph.nodes.find((node) => node.id === "acceptance.check")?.metrics.knownLossiness ?? []).not.toEqual(
      expect.arrayContaining(["partial-runtime-acceptance-replay", "runtime-acceptance-policy-approximation"]),
    )
    expect(graph.nodes.find((node) => node.id === "session.assistant-write")?.metrics).toMatchObject({
      parityTargetRefs: expect.arrayContaining(["anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"]),
      parityTargetSatisfied: true,
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.session.store.sqlite-projection",
          sourceProduct: "opencode",
          implementationLevel: "native",
          parityCompatible: "satisfied",
          parityTargetSatisfied: true,
          fixtureIDs: expect.arrayContaining(["opencode-session:native-exact-fixture"]),
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.turn.result-recorder",
          sourceProduct: "opencode",
          implementationLevel: "native",
          parityCompatible: "satisfied",
          parityTargetSatisfied: true,
          fixtureIDs: expect.arrayContaining(["opencode-turn-result-recorder:native-exact-fixture", "opencode-turn:result-recorder"]),
          blockers: [],
        }),
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-turn-result-recorder-native-exact-fixture",
        "turn-result-recorder-native-exact:opencode",
        "conformance:opencode-turn-replay-snapshot",
        "turn-replay:opencode:result-recorder",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-turn-result-recorder:native-exact-fixture",
        "opencode-turn:result-recorder",
      ]),
    })
    expect(graph.nodes.find((node) => node.id === "tool.result")?.metrics.knownLossiness ?? []).not.toContain("partial-product-turn-replay")
    const loopBoundaryMetrics = graph.nodes.find((node) => node.id === "loop.boundary")?.metrics
    expect(loopBoundaryMetrics).toMatchObject({
      implementationLevels: ["native"],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.turn.compaction-policy",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          fixtureIDs: expect.arrayContaining(["opencode-turn-compaction-policy:native-exact-fixture"]),
          knownLossiness: [],
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.turn.continuation-policy",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          fixtureIDs: expect.arrayContaining(["opencode-turn-continuation-policy:native-exact-fixture"]),
          knownLossiness: [],
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.turn.retry-policy",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          fixtureIDs: expect.arrayContaining(["opencode-turn-retry-policy:native-exact-fixture"]),
          knownLossiness: [],
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.turn.stop-condition",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          fixtureIDs: expect.arrayContaining(["opencode-turn-stop-condition:native-exact-fixture"]),
          knownLossiness: [],
          blockers: [],
        }),
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-turn-compaction-policy-native-exact-fixture",
        "conformance:opencode-turn-continuation-policy-native-exact-fixture",
        "conformance:opencode-turn-retry-policy-native-exact-fixture",
        "conformance:opencode-turn-stop-condition-native-exact-fixture",
        "conformance:opencode-turn-replay-snapshot",
        "turn-compaction-policy-native-exact:opencode",
        "turn-continuation-policy-native-exact:opencode",
        "turn-retry-policy-native-exact:opencode",
        "turn-stop-condition-native-exact:opencode",
        "turn-replay:opencode:retry-policy",
        "turn-replay:opencode:continuation-policy",
        "turn-replay:opencode:compaction-policy",
        "turn-replay:opencode:stop-condition",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-turn-compaction-policy:native-exact-fixture",
        "opencode-turn-continuation-policy:native-exact-fixture",
        "opencode-turn-retry-policy:native-exact-fixture",
        "opencode-turn-stop-condition:native-exact-fixture",
        "opencode-turn:retry-policy",
        "opencode-turn:continuation-policy",
        "opencode-turn:compaction-policy",
        "opencode-turn:stop-condition",
      ]),
    })
    expect(loopBoundaryMetrics?.implementationLevels ?? []).not.toContain("native-like")
    expect(loopBoundaryMetrics?.bridgeLayers ?? []).toEqual([])
    expect(loopBoundaryMetrics?.knownLossiness ?? []).not.toEqual(expect.arrayContaining(["partial-cadence-replay", "product-projector-partial", "partial-cadence-side-effect-order", "partial-product-turn-replay"]))
    const finalSummaryMetrics = graph.nodes.find((node) => node.id === "final.summary")?.metrics
    expect(finalSummaryMetrics).toMatchObject({
      implementationLevels: ["native"],
      parityCoverage: "native",
      parityTargetSatisfied: true,
      parityTargetBlockers: [],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.agent-loop.final-summary.native-like",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
          evidenceRefs: expect.arrayContaining(["conformance:opencode-agent-loop-final-summary-native-exact-fixture", "agent-loop-final-summary-native-exact:opencode"]),
          fixtureIDs: ["opencode-agent-loop-final-summary:native-exact-fixture"],
        }),
      ]),
    })
    expect(finalSummaryMetrics?.nativeEvidenceRefs ?? []).toEqual(expect.arrayContaining(["conformance:opencode-agent-loop-final-summary-native-exact-fixture", "agent-loop-final-summary-native-exact:opencode"]))
    expect(finalSummaryMetrics?.fixtureIDs ?? []).toEqual(["opencode-agent-loop-final-summary:native-exact-fixture"])
    expect(finalSummaryMetrics?.knownLossiness ?? []).toEqual([])
    expect(finalSummaryMetrics?.bridgeLayers ?? []).toEqual([])
    expect(graph.edges.find((edge) => edge.to === "provider.request")?.hookPoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: "provider.request.before",
          canTransform: true,
          canBlock: false,
          canHandle: false,
        }),
      ]),
    )
    expect(graph.edges.find((edge) => edge.to === "tool.permission")?.hookPoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: "permission.ask",
          canBlock: true,
        }),
      ]),
    )
    expect(graph.nodes.find((node) => node.id === "prompt.assemble")?.metrics).toMatchObject({
      promptAtomID: "opencode.prompt.mode-builder",
      sectionCount: 7,
      resourceCount: expect.any(Number),
      tokenEstimate: expect.any(Number),
      promptFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      identityStatus: "native",
      implementationLevels: ["native"],
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-system-prompt-core-exact-fixture",
        "conformance:opencode-llm-request-system-exact-fixture",
        "conformance:opencode-turn-prompt-assembler-native-exact-fixture",
        "conformance:opencode-turn-replay-snapshot",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-prompt:system-prompt-core-exact-fixture",
        "opencode-prompt:llm-request-system-exact-fixture",
        "opencode-turn-prompt-assembler:native-exact-fixture",
        "opencode-turn:prompt-assembler",
      ]),
      knownLossiness: [],
    })
    expect(graph.evidence.find((item) => item.id.startsWith("prompt.blueprint."))).toMatchObject({
      kind: "prompt",
      label: "prompt assembly blueprint artifact",
      refs: expect.arrayContaining([
        "conformance:opencode-system-prompt-core-exact-fixture",
        "conformance:opencode-llm-request-system-exact-fixture",
        "conformance:opencode-turn-prompt-assembler-native-exact-fixture",
        "conformance:opencode-turn-replay-snapshot",
        "opencode-prompt:system-prompt-core-exact-fixture",
        "opencode-prompt:llm-request-system-exact-fixture",
        "opencode-turn-prompt-assembler:native-exact-fixture",
        "opencode-turn:prompt-assembler",
      ]),
      metadata: {
        stageID: "prompt.assemble",
        artifactKind: "blueprint",
        promptAtomID: "opencode.prompt.mode-builder",
        sections: expect.arrayContaining(["base identity", "resources", "model capability adjustments"]),
        sectionSources: expect.objectContaining({ "base identity": "opencode.prompt.mode-builder" }),
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:opencode-system-prompt-core-exact-fixture",
          "conformance:opencode-llm-request-system-exact-fixture",
          "conformance:opencode-turn-prompt-assembler-native-exact-fixture",
          "conformance:opencode-turn-replay-snapshot",
        ]),
        fixtureIDs: expect.arrayContaining([
          "opencode-prompt:system-prompt-core-exact-fixture",
          "opencode-prompt:llm-request-system-exact-fixture",
          "opencode-turn-prompt-assembler:native-exact-fixture",
          "opencode-turn:prompt-assembler",
        ]),
        parityCoverage: "native",
        knownLossiness: [],
        sanitizedPreview: expect.stringContaining("redacted blueprint prompt artifact"),
        artifactHash: expect.stringMatching(/^[a-f0-9]{16}$/),
      },
    })
  })

  it("can attach current module confirmation status to assembled stage metrics", () => {
    const generatedAt = "2026-06-09T00:00:00.000Z"
    const contracts = (["opencode", "pi-mono", "nanobot", "hermes-agent"] as const).map((product) => buildAssemblyContract({ product, generatedAt }))
    const audit = buildCurrentModulePlaceholderAudit({ contracts, generatedAt })
    const graph = buildAssembledFlowBlueprint(contracts[0]!, generatedAt, { currentModuleAudit: audit })
    const contextNode = graph.nodes.find((node) => node.id === "context.build")
    const promptNode = graph.nodes.find((node) => node.id === "prompt.assemble")

    expect(verifyHarnessFlowGraph(graph).ok).toBe(true)
    expect(contextNode?.metrics).toMatchObject({
      moduleConfirmationStatuses: expect.arrayContaining(["demotion-guard-confirmed"]),
      moduleConfirmationSourceFiles: expect.arrayContaining(["packages/adapters-opencode/src/opencode-turn-context-builder.ts"]),
      moduleConfirmationFixtureTargets: expect.arrayContaining(["metadata.executable-blocker"]),
    })
    expect(promptNode?.metrics).toMatchObject({
      moduleConfirmationStatuses: expect.arrayContaining(["demotion-guard-confirmed"]),
      moduleConfirmationSourceOwners: expect.arrayContaining(["packages/lego-prompt"]),
      moduleConfirmationFixtureTargets: expect.arrayContaining(["metadata.executable-blocker"]),
    })
  })

  it("separates executable binding evidence from runtime metadata overlay evidence", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z" })
    const graph = buildAssembledFlowBlueprint(contract, "2026-06-09T00:00:00.000Z")
    const verification = verifyHarnessFlowGraph(graph)
    const bindingEvidence = graph.evidence.find((item) => item.id === "binding.runtime.capability-resolver")
    const overlayEvidence = graph.evidence.find((item) => item.id === "metadata-overlay.runtime.capability-resolver")
    const assembledAtomIDs = graph.nodes.flatMap((node) => node.assembledAtomIDs)
    const permissionNode = graph.nodes.find((node) => node.id === "tool.permission")

    expect(verification.ok).toBe(true)
    expect(assembledAtomIDs).not.toContain("opencode.runtime.capability-aliases")
    expect(bindingEvidence).toMatchObject({
      kind: "binding",
      refs: ["runtime.capability-resolver", "opencode.runtime.capability-resolver"],
      metadata: {
        edgeKind: "provides-executable",
        executableRequired: true,
        implementationLevel: "native",
      },
    })
    expect(overlayEvidence).toMatchObject({
      kind: "binding",
      refs: expect.arrayContaining(["runtime.capability-resolver", "opencode.runtime.capability-aliases"]),
      metadata: {
        edgeKind: "aliases",
        executableRequired: true,
        implementationLevel: "metadata-only",
        artifactKind: "metadata-overlay",
        artifactHash: expect.stringMatching(/^[a-f0-9]{16}$/),
      },
    })
    expect(permissionNode?.metrics).toMatchObject({
      parityTargetSatisfied: true,
      parityTargetBlockers: [],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.plugin.permission-bridge",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.resource.grant-defaults",
          implementationLevel: "metadata-only",
          parityTargetSatisfied: false,
          blockers: expect.arrayContaining(["module-claim-metadata-only", "not-executable-provider"]),
        }),
      ]),
    })
  })

  it("normalizes original product fixtures into the same canonical graph", () => {
    for (const product of ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const) {
      const graph = buildOriginalFlowForProduct(product, {
        taskID: "read-only-answer",
        generatedAt: "2026-06-09T00:00:00.000Z",
      })
      const verification = verifyHarnessFlowGraph(graph)
      const adapter = nativeFlowAdapterProfileForProduct(product)
      const evidence = graph.evidence.find((item) => item.kind === "differential")

      expect(verification.ok).toBe(true)
      expect(graph.product).toBe(product)
      expect(graph.source).toBe("original")
      expect(graph.mode).toBe("native")
      expect(graph.nodes).toHaveLength(canonicalFlowStages.length)
      expect(evidence?.metadata).toMatchObject({
        adapterID: adapter.adapterID,
        fixtureGlob: adapter.fixtureGlob,
        mappingStrategy: adapter.mappingStrategy,
      })
      expect(evidence?.metadata.evidenceSources).toEqual(expect.arrayContaining(adapter.evidenceSources.slice(0, 2)))
      expect(graph.nodes.find((node) => node.id === "provider.request")?.observability.evidence).toContain(adapter.observedEvidence)
    }
  })

  it("publishes a canonical stage catalog with assembled and original evidence mappings", () => {
    const catalog = buildCanonicalFlowCatalog({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z" })
    const promptStage = catalog.stages.find((stage) => stage.id === "prompt.assemble")
    const providerStage = catalog.stages.find((stage) => stage.id === "provider.request")
    const sessionStage = catalog.stages.find((stage) => stage.id === "session.assistant-write")

    expect(catalog.schemaVersion).toBe(1)
    expect(catalog.product).toBe("opencode")
    expect(catalog.defaultTaskIDs).toEqual([...defaultFlowTaskIDs])
    expect(catalog.stages.map((stage) => stage.id)).toEqual(canonicalFlowStages.map((stage) => stage.id))
    expect(catalog.edges).toHaveLength(canonicalFlowStages.length - 1)
    expect(catalog.summary.dataSources).toBe(11)
    expect(catalog.dataSources.map((source) => source.id)).toEqual(expect.arrayContaining([
      "assembly-contract",
      "compiled-recipe",
      "builder-data",
      "turn-pipeline-atoms",
      "port-fixtures",
      "turn-pipeline-trace",
      "lifecycle-events",
      "provider-events",
      "tool-events",
      "context-compaction-events",
      "product-surface-results",
    ]))
    expect(catalog.nativeAdapter).toMatchObject({
      adapterID: "opencode.fixture-native",
      fixtureGlob: "docs/reports/task-parity-native-cadence-fixtures/attachments/opencode-*.json",
    })
    expect(promptStage?.assembled.portIDs).toEqual(expect.arrayContaining(["prompt.system-builder", "turn.prompt-assembler"]))
    expect(promptStage?.assembled.atomIDs).toEqual(expect.arrayContaining(["opencode.prompt.mode-builder"]))
    expect(promptStage?.assembled.eventTypes).toEqual(expect.arrayContaining(["turn.pipeline.trace:prompt.assemble"]))
    expect(providerStage?.original.evidenceSources).toEqual(expect.arrayContaining(["provider-endpoint", "task-parity-report", "native-cadence-fixture"]))
    expect(providerStage?.original.observability.lossiness).toBe("semantic")
    expect(sessionStage?.original.eventTypes.length).toBeGreaterThan(0)
    expect(catalog.dataSources.find((source) => source.id === "turn-pipeline-trace")?.stageIDs).toEqual(expect.arrayContaining(["prompt.assemble", "provider.request", "tool.execute"]))
    expect(catalog.dataSources.find((source) => source.id === "provider-events")?.observedEventTypes).toEqual(["provider.request.before", "provider.response.after"])
    expect(catalog.dataSources.find((source) => source.id === "tool-events")?.observedEventTypes).toEqual(expect.arrayContaining(["tool.call", "permission.ask", "tool.execution_start", "tool.execution_end", "tool.result"]))
    expect(catalog.dataSources.find((source) => source.id === "context-compaction-events")?.observedEventTypes).toEqual(expect.arrayContaining(["context", "session.before_compact", "session.compacting", "session.compact", "session.compacted"]))
    expect(catalog.dataSources.find((source) => source.id === "port-fixtures")?.evidenceRefs.length).toBeGreaterThan(0)
    const surfaceResults = catalog.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults ?? []
    expect(surfaceResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ surfaceID: "opencode.product-shell.sdk", resultKind: "provider-backed-turn", routeOrMethod: "runTurn(input)" }),
        expect.objectContaining({ surfaceID: "opencode.product-shell.server", resultKind: "server-route-turn", routeOrMethod: "POST /v1/run" }),
        expect.objectContaining({ surfaceID: "opencode.product-shell.tui", resultKind: "render-snapshot", captureModes: ["snapshot"] }),
        expect.objectContaining({ surfaceID: "opencode.product-shell.web", resultKind: "render-snapshot", captureModes: ["snapshot"] }),
      ]),
    )
    expect(surfaceResults.find((surface) => surface.surfaceID === "opencode.product-shell.tui")?.evidenceRefs).toEqual(
      expect.arrayContaining([
        "native-parity.conformance:opencode-product-shell-native-exact-fixture",
        "native-parity.product-shell-native-exact:opencode",
        "native-parity.opencode-product-shell:native-exact-fixture",
      ]),
    )
    expect(surfaceResults.find((surface) => surface.surfaceID === "opencode.product-shell.web")?.evidenceRefs).toEqual(
      expect.arrayContaining([
        "native-parity.conformance:opencode-product-shell-native-exact-fixture",
        "native-parity.product-shell-native-exact:opencode",
        "native-parity.opencode-product-shell:native-exact-fixture",
      ]),
    )
    expect(surfaceResults.find((surface) => surface.surfaceID === "opencode.product-shell.sdk")?.captureModes).toEqual(expect.arrayContaining(["internal-fixture", "provider-backed"]))
    expect(catalog.dataSources.find((source) => source.id === "product-surface-results")?.observedEventTypes).toEqual(expect.arrayContaining(["surface.provider-backed-turn", "surface.server-route-turn", "surface.render-snapshot"]))
    expect(catalog.lossinessRules.map((rule) => rule.lossiness)).toEqual(["lossless", "semantic", "aggregated", "inferred", "unobservable"])
    expect(catalog.lossinessRules.find((rule) => rule.lossiness === "inferred")?.hardBlocker).toBe(false)
    expect(catalog.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)
  })

  it("classifies product surface result coverage without overstating snapshot surfaces", () => {
    const catalogs = (["opencode", "pi-mono", "nanobot", "hermes-agent"] as const).map((product) => buildCanonicalFlowCatalog({ product, generatedAt: "2026-06-09T00:00:00.000Z" }))
    const byProduct = new Map(catalogs.map((catalog) => [catalog.product, catalog]))

    expect(byProduct.get("pi-mono")?.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ surfaceID: "pi.product-shell.rpc", resultKind: "rpc-turn", routeOrMethod: "run.turn" }),
        expect.objectContaining({ surfaceID: "pi.product-shell.server", resultKind: "server-route-turn", routeOrMethod: "POST /v1/run" }),
        expect.objectContaining({ surfaceID: "pi.product-shell.web-ui", resultKind: "render-snapshot", captureModes: ["snapshot"] }),
      ]),
    )
    expect(byProduct.get("nanobot")?.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ surfaceID: "nanobot.product-shell.cli", resultKind: "provider-backed-turn" }),
        expect.objectContaining({ surfaceID: "nanobot.product-shell.server", resultKind: "server-route-turn", routeOrMethod: "POST /v1/agent" }),
      ]),
    )
    expect(byProduct.get("hermes-agent")?.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ surfaceID: "hermes.product-shell.acp", resultKind: "acp-turn", routeOrMethod: "session/prompt" }),
        expect.objectContaining({ surfaceID: "hermes.product-shell.gateway", resultKind: "gateway-turn", routeOrMethod: "gateway.message" }),
        expect.objectContaining({ surfaceID: "hermes.product-shell.api-server", resultKind: "server-route-turn", routeOrMethod: "POST /v1/chat/completions | POST /v1/runs" }),
        expect.objectContaining({ surfaceID: "hermes.product-shell.web-dashboard", resultKind: "render-snapshot", captureModes: ["snapshot"] }),
      ]),
    )
    for (const catalog of catalogs) {
      const surfaceSource = catalog.dataSources.find((source) => source.id === "product-surface-results")
      expect(surfaceSource?.stageIDs).toEqual(["surface.input", "surface.output"])
      expect(surfaceSource?.surfaceResults?.every((surface) => surface.evidenceRefs.every((ref) => !/api[_-]?key|secret|token/i.test(ref)))).toBe(true)
    }
    expect(byProduct.get("pi-mono")?.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults?.find((surface) => surface.surfaceID === "pi.product-shell.web-ui")?.evidenceRefs).toEqual(
      expect.arrayContaining(["native-parity.conformance:pi-product-shell-native-exact-fixture", "native-parity.product-shell-native-exact:pi-mono"]),
    )
    expect(byProduct.get("nanobot")?.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults?.find((surface) => surface.surfaceID === "nanobot.product-shell.tui")?.evidenceRefs).toEqual(
      expect.arrayContaining(["native-parity.conformance:nanobot-product-shell-native-exact-fixture", "native-parity.ui-native-exact:nanobot"]),
    )
    expect(byProduct.get("hermes-agent")?.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults?.find((surface) => surface.surfaceID === "hermes.product-shell.web-dashboard")?.evidenceRefs).toEqual(
      expect.arrayContaining(["native-parity.conformance:hermes-product-shell-native-exact-fixture", "native-parity.ui-native-exact:hermes-agent"]),
    )
  })

  it("links live provider split summary evidence to surface result coverage without raw responses", () => {
    const liveProviderSummary: HarnessFlowLiveProviderSummary = {
      artifactKind: "live-provider-parity-summary",
      artifactPath: "docs/reports/live-provider-parity-split/summary.json",
      generatedAt: "2026-05-30T09:53:22.934Z",
      provider: "anthropic",
      modelID: "claude-test",
      status: "passed",
      ok: true,
      verifierChecks: ["live-provider:configured", "opencode:live-provider-turn", "opencode:live-provider-sdk-readback"],
      products: [
        {
          product: "opencode",
          status: "passed",
          ok: true,
          sessionID: "ses_live_opencode",
          steps: 1,
          readbackChecks: 1,
          attachmentPath: "docs/reports/live-provider-parity-split/attachments/opencode.json",
          attachmentSha256: "a".repeat(64),
        },
      ],
    }
    const opencode = buildCanonicalFlowCatalog({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z", liveProviderSummary })
    const hermes = buildCanonicalFlowCatalog({ product: "hermes-agent", generatedAt: "2026-06-09T00:00:00.000Z", liveProviderSummary })
    const opencodeSurfaceSource = opencode.dataSources.find((source) => source.id === "product-surface-results")
    const opencodeSDK = opencodeSurfaceSource?.surfaceResults?.find((surface) => surface.surfaceID === "opencode.product-shell.sdk")
    const opencodeServer = opencodeSurfaceSource?.surfaceResults?.find((surface) => surface.surfaceID === "opencode.product-shell.server")
    const hermesGateway = hermes.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults?.find((surface) => surface.surfaceID === "hermes.product-shell.gateway")

    expect(opencodeSurfaceSource?.liveProviderSummary).toMatchObject({
      artifactPath: "docs/reports/live-provider-parity-split/summary.json",
      provider: "anthropic",
      products: [expect.objectContaining({ product: "opencode", status: "passed", ok: true })],
    })
    expect(opencodeSDK?.liveProviderArtifact).toMatchObject({
      coverage: "verified-sdk-readback",
      artifactPath: "docs/reports/live-provider-parity-split/summary.json",
      attachmentPath: "docs/reports/live-provider-parity-split/attachments/opencode.json",
      productStatus: "passed",
      readbackChecks: 1,
    })
    expect(opencodeServer?.liveProviderArtifact).toMatchObject({ coverage: "provider-path-linked", productStatus: "passed" })
    expect(hermesGateway?.liveProviderArtifact).toMatchObject({ coverage: "missing-product", productStatus: "missing", ok: false })
    expect(JSON.stringify(opencodeSurfaceSource)).not.toMatch(/api[_-]?key|authorization|secret|assistantText/i)
  })

  it("compares assembled and original flows as a verifiable artifact", () => {
    const comparison = buildHarnessFlowComparison({
      product: "opencode",
      taskID: "read-only-answer",
      generatedAt: "2026-06-09T00:00:00.000Z",
    })
    const verification = verifyHarnessFlowArtifact(comparison)

    expect(verification.ok).toBe(true)
    expect(comparison.schemaVersion).toBe(1)
    expect(comparison.assembled.nodes).toHaveLength(canonicalFlowStages.length)
    expect(comparison.original.nodes).toHaveLength(canonicalFlowStages.length)
    expect(comparison.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)
    expect(comparison.diffs.map((diff) => diff.stageID)).toEqual(expect.arrayContaining(["provider.request"]))
  })

  it("rejects flow artifacts with stale hashes or missing evidence refs", () => {
    const comparison = buildHarnessFlowComparison({
      product: "opencode",
      taskID: "read-only-answer",
      generatedAt: "2026-06-09T00:00:00.000Z",
    })
    const tampered = JSON.parse(JSON.stringify(comparison)) as typeof comparison

    tampered.summary.fingerprint = "0000000000000000"
    tampered.original.summary.fingerprint = "1111111111111111"
    tampered.original.nodes[0]!.originalEvidenceRefs = ["missing.native.evidence"]
    tampered.original.edges[0]!.payloadFingerprint = "2222222222222222"

    const verification = verifyHarnessFlowArtifact(tampered)
    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining([
      "flow-comparison.fingerprint.mismatch",
      "flow.fingerprint.mismatch",
      "flow.edge.surface.input->input.normalize.payload-fingerprint",
      "flow.stage.surface.input.evidence-ref",
    ]))
  })

  it("rejects prompt evidence with a stale sanitized artifact hash", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z" })
    const graph = buildAssembledFlowBlueprint(contract, "2026-06-09T00:00:00.000Z")
    const tampered = JSON.parse(JSON.stringify(graph)) as HarnessFlowGraph
    const promptEvidence = tampered.evidence.find((item) => item.kind === "prompt")
    expect(promptEvidence).toBeDefined()
    if (promptEvidence) promptEvidence.metadata.artifactHash = "3333333333333333"

    const verification = verifyHarnessFlowGraph(tampered)
    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining([
      expect.stringMatching(/^flow\.evidence\.prompt\.blueprint\.[a-f0-9]{16}\.artifact-hash$/),
    ]))
  })

  it("rejects assembled flow graphs with Helix placeholder prompt identity", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z" })
    const promptAtom = contract.atoms.find((atom) => atom.id === "opencode.prompt.mode-builder")
    expect(promptAtom).toBeDefined()
    if (!promptAtom) return
    promptAtom.selectionReason = "You are compatible Helix, not OpenCode."
    const graph = buildAssembledFlowBlueprint(contract, "2026-06-09T00:00:00.000Z")
    const promptNode = graph.nodes.find((node) => node.id === "prompt.assemble")
    expect(promptNode?.metrics).toBeDefined()

    const verification = verifyHarnessFlowGraph(graph)

    expect(verification.ok).toBe(false)
    expect(promptNode?.metrics.identityStatus).toBe("placeholder-risk")
    expect(verification.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining([
      "flow.prompt.identity-placeholder.metrics",
      expect.stringMatching(/^flow\.prompt\.identity-placeholder\.prompt\.blueprint\.[a-f0-9]{16}$/),
    ]))
    expect(verification.issues.map((issue) => issue.message).join("\n")).toContain("Helix-compatible placeholder")
  })

  it("does not mark prompt identity native from selection reason without TODO27 proof", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z" })
    const promptAtom = contract.atoms.find((atom) => atom.id === "opencode.prompt.mode-builder")
    expect(promptAtom).toBeDefined()
    if (!promptAtom) return
    promptAtom.selectionReason = "OpenCode product identity snapshot from pinned upstream prompt assets; full live upstream SystemPrompt invocation remains partial sync until native parity is complete."
    promptAtom.parityCoverage = "native"
    promptAtom.knownLossiness = ["partial-prompt-family"]
    promptAtom.nativeEvidenceRefs = ["conformance:opencode-prompt-resource-policy"]
    promptAtom.fixtureIDs = ["opencode-prompt:resource-policy"]
    const graph = buildAssembledFlowBlueprint(contract, "2026-06-09T00:00:00.000Z")
    const promptNode = graph.nodes.find((node) => node.id === "prompt.assemble")
    const promptEvidence = graph.evidence.find((evidence) => evidence.kind === "prompt" && evidence.metadata.stageID === "prompt.assemble")

    expect(promptNode?.metrics.identityStatus).toBe("partial-sync")
    expect(promptEvidence?.metadata.identityStatus).toBe("partial-sync")
    expect(promptNode?.metrics.identityStatus).not.toBe("native")
    expect(verifyHarnessFlowGraph(graph).ok).toBe(true)
  })

  it("marks product prompt identity snapshots as native once exact fixtures are present", () => {
    const cases = [
      { product: "pi-mono" as const, promptAtomID: "pi.prompt.coding-agent-builder" },
      { product: "nanobot" as const, promptAtomID: "nanobot.prompt.agent-builder" },
      { product: "hermes-agent" as const, promptAtomID: "hermes.prompt.agent-builder" },
    ]
    for (const item of cases) {
      const contract = buildAssemblyContract({ product: item.product, generatedAt: "2026-06-09T00:00:00.000Z" })
      const graph = buildAssembledFlowBlueprint(contract, "2026-06-09T00:00:00.000Z")
      expect(graph.nodes.find((node) => node.id === "prompt.assemble")?.metrics).toMatchObject({
        promptAtomID: item.promptAtomID,
        identityStatus: "native",
      })
      expect(contract.atoms.find((atom) => atom.id === item.promptAtomID)?.selectionReason).toContain("native parity complete")
      if (item.product === "pi-mono") {
        expect(graph.nodes.find((node) => node.id === "prompt.assemble")?.metrics).toMatchObject({
          nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-prompt-family-matrix", "conformance:pi-prompt-upstream-source-matrix"]),
          fixtureIDs: expect.arrayContaining(["pi-prompt:family-matrix", "pi-prompt:upstream-source-matrix"]),
          knownLossiness: [],
        })
        expect(graph.evidence.find((evidence) => evidence.kind === "prompt" && evidence.metadata.stageID === "prompt.assemble")).toMatchObject({
          refs: expect.arrayContaining(["conformance:pi-prompt-family-matrix", "conformance:pi-prompt-upstream-source-matrix", "pi-prompt:family-matrix", "pi-prompt:upstream-source-matrix"]),
          metadata: {
            nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-prompt-family-matrix", "conformance:pi-prompt-upstream-source-matrix"]),
            fixtureIDs: expect.arrayContaining(["pi-prompt:family-matrix", "pi-prompt:upstream-source-matrix"]),
          },
        })
      }
      if (item.product === "hermes-agent") {
        expect(graph.nodes.find((node) => node.id === "prompt.assemble")?.metrics).toMatchObject({
          nativeEvidenceRefs: expect.arrayContaining([
            "conformance:hermes-prompt-factory-options",
            "conformance:hermes-prompt-native-exact-fixture",
            "conformance:hermes-prompt-scanner",
            "conformance:hermes-prompt-registry-snapshot",
            "conformance:hermes-prompt-upstream-registry-source-matrix",
            "conformance:hermes-skills-index-cache",
          ]),
          fixtureIDs: expect.arrayContaining(["hermes-prompt:factory-options", "hermes-prompt:native-exact-fixture", "hermes-prompt:prompt-scanner", "hermes-prompt:registry-snapshot", "hermes-prompt:upstream-registry-source-matrix", "hermes-skills:index-cache"]),
          knownLossiness: [],
        })
        expect(graph.evidence.find((evidence) => evidence.kind === "prompt" && evidence.metadata.stageID === "prompt.assemble")).toMatchObject({
          refs: expect.arrayContaining([
            "conformance:hermes-prompt-factory-options",
            "conformance:hermes-prompt-native-exact-fixture",
            "conformance:hermes-prompt-scanner",
            "conformance:hermes-prompt-registry-snapshot",
            "conformance:hermes-prompt-upstream-registry-source-matrix",
            "hermes-prompt:factory-options",
            "hermes-prompt:native-exact-fixture",
            "hermes-prompt:prompt-scanner",
            "hermes-prompt:registry-snapshot",
            "hermes-prompt:upstream-registry-source-matrix",
          ]),
          metadata: {
            nativeEvidenceRefs: expect.arrayContaining(["conformance:hermes-prompt-factory-options", "conformance:hermes-prompt-native-exact-fixture", "conformance:hermes-prompt-scanner", "conformance:hermes-prompt-upstream-registry-source-matrix", "conformance:hermes-skills-index-cache"]),
            fixtureIDs: expect.arrayContaining(["hermes-prompt:factory-options", "hermes-prompt:native-exact-fixture", "hermes-prompt:prompt-scanner", "hermes-prompt:upstream-registry-source-matrix", "hermes-skills:index-cache"]),
          },
        })
      }
      expect(verifyHarnessFlowGraph(graph).ok).toBe(true)
    }
  })

  it("projects prompt native evidence and lossiness into assembled flow artifacts", () => {
    const contract = buildAssemblyContract({ product: "nanobot", generatedAt: "2026-06-09T00:00:00.000Z" })
    const graph = buildAssembledFlowBlueprint(contract, "2026-06-09T00:00:00.000Z")
    const promptNode = graph.nodes.find((node) => node.id === "prompt.assemble")
    const promptEvidence = graph.evidence.find((item) => item.kind === "prompt" && item.metadata.stageID === "prompt.assemble")

    expect(promptNode?.metrics).toMatchObject({
      promptAtomID: "nanobot.prompt.agent-builder",
      identityStatus: "native",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:nanobot-memory-lifecycle",
        "conformance:nanobot-prompt-native-exact-fixture",
        "conformance:nanobot-prompt-upstream-source-matrix",
        "conformance:nanobot-channel-lifecycle-timing",
        "conformance:nanobot-channel-side-effect-replay",
        "conformance:nanobot-channel-registry-source-matrix",
        "conformance:nanobot-platform-prompt-matrix",
        "conformance:nanobot-platform-router-rendering",
        "conformance:nanobot-workspace-template-sync",
        "conformance:nanobot-skills-index-cache",
      ]),
      fixtureIDs: expect.arrayContaining([
        "nanobot-memory:lifecycle",
        "nanobot-prompt:native-exact-fixture",
        "nanobot-prompt:upstream-source-matrix",
        "nanobot-prompt:channel-lifecycle-timing",
        "nanobot-prompt:channel-side-effect-replay",
        "nanobot-prompt:channel-registry-source-matrix",
        "nanobot-prompt:platform-matrix",
        "nanobot-prompt:platform-router-rendering",
        "nanobot-workspace-sync:templates",
        "nanobot-skills:index-cache",
      ]),
      knownLossiness: [],
    })
    expect(promptEvidence).toMatchObject({
      refs: expect.arrayContaining([
        "conformance:nanobot-memory-lifecycle",
        "conformance:nanobot-prompt-native-exact-fixture",
        "conformance:nanobot-prompt-upstream-source-matrix",
        "conformance:nanobot-channel-lifecycle-timing",
        "conformance:nanobot-channel-side-effect-replay",
        "conformance:nanobot-channel-registry-source-matrix",
        "conformance:nanobot-platform-prompt-matrix",
        "conformance:nanobot-platform-router-rendering",
        "conformance:nanobot-skills-index-cache",
        "nanobot-memory:lifecycle",
        "nanobot-prompt:native-exact-fixture",
        "nanobot-prompt:upstream-source-matrix",
        "nanobot-prompt:channel-lifecycle-timing",
        "nanobot-prompt:channel-side-effect-replay",
        "nanobot-prompt:channel-registry-source-matrix",
        "nanobot-prompt:platform-matrix",
        "nanobot-prompt:platform-router-rendering",
        "nanobot-skills:index-cache",
      ]),
      metadata: {
        promptAtomID: "nanobot.prompt.agent-builder",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:nanobot-memory-lifecycle", "conformance:nanobot-prompt-native-exact-fixture", "conformance:nanobot-prompt-upstream-source-matrix", "conformance:nanobot-channel-lifecycle-timing", "conformance:nanobot-channel-side-effect-replay", "conformance:nanobot-channel-registry-source-matrix", "conformance:nanobot-platform-prompt-matrix", "conformance:nanobot-platform-router-rendering", "conformance:nanobot-skills-index-cache"]),
        fixtureIDs: expect.arrayContaining(["nanobot-memory:lifecycle", "nanobot-prompt:native-exact-fixture", "nanobot-prompt:upstream-source-matrix", "nanobot-prompt:channel-lifecycle-timing", "nanobot-prompt:channel-side-effect-replay", "nanobot-prompt:channel-registry-source-matrix", "nanobot-prompt:platform-matrix", "nanobot-prompt:platform-router-rendering", "nanobot-skills:index-cache"]),
        knownLossiness: [],
      },
    })
    expect(verifyHarnessFlowGraph(graph).ok).toBe(true)
  })

  it("rejects assembled flow graphs with compatible-only prompt identity", () => {
    const contract = buildAssemblyContract({ product: "pi-mono", generatedAt: "2026-06-09T00:00:00.000Z" })
    const graph = buildAssembledFlowBlueprint(contract, "2026-06-09T00:00:00.000Z")
    const tampered = JSON.parse(JSON.stringify(graph)) as HarnessFlowGraph
    const promptNode = tampered.nodes.find((node) => node.id === "prompt.assemble")
    expect(promptNode?.metrics).toBeDefined()
    if (!promptNode?.metrics) return
    promptNode.metrics.identityStatus = "compatible"
    for (const evidence of tampered.evidence) {
      if (evidence.kind === "prompt" && evidence.metadata.stageID === "prompt.assemble") evidence.metadata.identityStatus = "compatible"
    }

    const verification = verifyHarnessFlowGraph(tampered)

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining([
      "flow.prompt.identity-compatible.metrics",
      expect.stringMatching(/^flow\.prompt\.identity-compatible\.prompt\.blueprint\.[a-f0-9]{16}$/),
    ]))
    expect(verification.issues.map((issue) => issue.message).join("\n")).toContain("original prompt snapshot")
  })

  it("rejects flow artifacts that include raw prompt, provider request, or tool result fields", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z" })
    const graph = buildAssembledFlowBlueprint(contract, "2026-06-09T00:00:00.000Z")
    const tampered = JSON.parse(JSON.stringify(graph)) as HarnessFlowGraph
    const promptEvidence = tampered.evidence.find((item) => item.kind === "prompt")
    expect(promptEvidence).toBeDefined()
    if (!promptEvidence) return

    promptEvidence.metadata.prompt = "raw system prompt text that must never be stored in flow artifacts"
    promptEvidence.metadata.requestBody = {
      model: "test-model",
      messages: [{ role: "user", content: "raw provider request message" }],
    }
    promptEvidence.metadata.toolResult = {
      stdout: "raw command output",
      stderr: "raw command error",
    }

    const verification = verifyHarnessFlowGraph(tampered)
    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("flow.redaction.key")
    const messages = verification.issues.map((issue) => issue.message).join("\n")
    expect(messages).toContain("metadata.prompt")
    expect(messages).toContain("metadata.requestBody")
    expect(messages).toContain("metadata.toolResult")
  })

  it("surfaces cadence diff categories for comparison tables", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z" })
    const assembled = buildAssembledFlowRun({
      product: "opencode",
      contract,
      generatedAt: "2026-06-09T00:00:00.000Z",
      runID: "flow-run-assembled",
      taskID: "read-only-answer",
      toolSequence: ["shell"],
      steps: 1,
      finish: "ok",
    }).graph
    const original = JSON.parse(JSON.stringify(assembled)) as HarnessFlowGraph
    original.source = "original"
    original.mode = "native"
    original.nodes = original.nodes.map((node) => {
      if (node.id === "provider.request") return { ...node, metrics: { ...node.metrics, requestCount: 2 } }
      if (node.id === "provider.stream") return { ...node, metrics: { ...node.metrics, traceEventSequence: ["message.delta", "message.delta", "post_llm_call"] } }
      if (node.id === "tool.plan") return { ...node, metrics: { ...node.metrics, toolCount: 2, toolSequence: ["read", "write"] } }
      if (node.id === "tool.batch") return { ...node, metrics: { ...node.metrics, batchSignature: ["read+write"] } }
      if (node.id === "session.assistant-write") return { ...node, metrics: { ...node.metrics, partTypes: ["reasoning", "text"] } }
      if (node.id === "acceptance.check") return { ...node, metrics: { ...node.metrics, acceptedEarly: true } }
      if (node.id === "surface.output") return { ...node, metrics: { ...node.metrics, finish: "stop" } }
      return node
    })

    const comparison = compareHarnessFlows({ assembled, original, generatedAt: "2026-06-09T00:00:00.000Z" })
    const categories = comparison.diffs.map((diff) => diff.category)

    expect(categories).toEqual(expect.arrayContaining([
      "cadence.provider-request-count",
      "cadence.tool-call-count",
      "cadence.tool-sequence",
      "cadence.tool-batch",
      "cadence.message-part-type",
      "cadence.streaming-delta",
      "cadence.final-summary",
      "cadence.early-accept",
    ]))
    expect(comparison.diffs.find((diff) => diff.category === "cadence.streaming-delta")).toMatchObject({
      owningPlane: "native-projector",
      candidateAtomIDs: expect.arrayContaining(["opencode.provider.stream-projector.native-like"]),
    })
    expect(comparison.summary.status).toBe("semantic-drift")
  })

  it("builds a redacted assembled flow run artifact from event envelopes", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z" })
    const run = buildAssembledFlowRun({
      product: "opencode",
      contract,
      generatedAt: "2026-06-09T00:00:00.000Z",
      runID: "flow-run-test",
      taskID: "read-only-answer",
      prompt: "super secret prompt text",
      steps: 2,
      toolSequence: ["shell"],
      finish: "ok",
    })
    const verification = verifyHarnessFlowArtifact(run)

    expect(verification.ok).toBe(true)
    expect(run.schemaVersion).toBe(1)
    expect(run.captureMode).toBe("fixture")
    expect(run.promptFingerprint).toMatch(/^[a-f0-9]{16}$/)
    expect(JSON.stringify(run)).not.toContain("super secret prompt text")
    expect(run.events.map((event) => event.type)).toEqual(expect.arrayContaining(["provider.request.before", "tool.call", "message.end"]))
    expect(run.graph.mode).toBe("trace")
    expect(run.graph.nodes.find((node) => node.id === "prompt.assemble")?.metrics).toMatchObject({
      count: 7,
      sectionCount: 7,
      promptAtomID: "opencode.prompt.mode-builder",
      promptFingerprint: run.promptFingerprint,
      tokenEstimate: expect.any(Number),
    })
    expect(run.graph.evidence.find((item) => item.label === "prompt assembly artifact")).toMatchObject({
      kind: "prompt",
      label: "prompt assembly artifact",
      metadata: {
        stageID: "prompt.assemble",
        artifactKind: "trace",
        promptFingerprint: run.promptFingerprint,
        sections: expect.arrayContaining(["base identity", "rules", "tools", "resources", "compaction", "model capability adjustments"]),
        sanitizedPreview: expect.stringContaining(run.promptFingerprint),
        captureMode: "fixture",
        artifactHash: expect.stringMatching(/^[a-f0-9]{16}$/),
      },
    })
    expect(run.graph.edges.find((edge) => edge.to === "prompt.assemble")?.hookPoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: "before_agent_start",
          handlerCount: 1,
          sources: [
            expect.objectContaining({
              order: 1,
              scope: "assembled-run",
              adapterKind: "opencode-plugin",
              adapterSource: "OpenCode plugin bridge / assembled hook host",
            }),
          ],
        }),
      ]),
    )
    expect(run.graph.nodes.find((node) => node.id === "tool.plan")?.metrics.toolSequence).toEqual(["shell"])
    expect(run.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)
  })

  it("covers no-tools, tools, retry, compaction, and early accept assembled run traces", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-09T00:00:00.000Z" })
    const base = {
      product: "opencode" as const,
      contract,
      generatedAt: "2026-06-09T00:00:00.000Z",
      prompt: "scenario prompt",
      steps: 1,
    }
    const noTools = buildAssembledFlowRun({
      ...base,
      runID: "flow-run-no-tools",
      taskID: "read-only-answer",
      toolSequence: [],
    })
    expect(verifyHarnessFlowArtifact(noTools).ok).toBe(true)
    expect(noTools.events.map((event) => event.type)).not.toContain("tool.call")
    expect(noTools.graph.nodes.find((node) => node.id === "tool.plan")?.metrics).toMatchObject({ toolCount: 0, toolSequence: [] })

    const tools = buildAssembledFlowRun({
      ...base,
      runID: "flow-run-tools",
      taskID: "single-file-edit",
      toolSequence: ["read", "write"],
    })
    expect(verifyHarnessFlowArtifact(tools).ok).toBe(true)
    expect(tools.events.map((event) => event.type)).toEqual(expect.arrayContaining(["tool.call", "permission.ask", "tool.execution_start", "tool.execution_end", "tool.result"]))
    expect(tools.graph.nodes.find((node) => node.id === "tool.plan")?.metrics).toMatchObject({ toolCount: 2, toolSequence: ["read", "write"] })
    expect(tools.graph.nodes.find((node) => node.id === "tool.batch")?.metrics.batchSignature).toEqual(["read+write"])

    const retry = buildAssembledFlowRun({
      ...base,
      runID: "flow-run-retry",
      taskID: "tool-error-retry",
      retryCount: 1,
    })
    expect(verifyHarnessFlowArtifact(retry).ok).toBe(true)
    expect(retry.events.filter((event) => event.type === "provider.request.before")).toHaveLength(2)
    expect(retry.events.find((event) => event.type === "turn.pipeline.trace" && (event.payload as { atomID?: string }).atomID === "turn.retry-policy")).toBeDefined()
    expect(retry.graph.nodes.find((node) => node.id === "loop.boundary")?.metrics.retryCount).toBe(1)
    expect(retry.graph.nodes.find((node) => node.id === "provider.request")?.metrics.requestCount).toBe(2)

    const compaction = buildAssembledFlowRun({
      ...base,
      runID: "flow-run-compaction",
      taskID: "context-compaction",
      compactionTriggered: true,
    })
    expect(verifyHarnessFlowArtifact(compaction).ok).toBe(true)
    expect(compaction.events.map((event) => event.type)).toEqual(expect.arrayContaining(["session.before_compact", "session.compacting", "session.compact", "session.compacted"]))
    expect(compaction.graph.nodes.find((node) => node.id === "context.build")?.metrics).toMatchObject({ compactionTriggered: true })

    const earlyAccept = buildAssembledFlowRun({
      ...base,
      runID: "flow-run-early-accept",
      taskID: "read-only-answer",
      acceptedEarly: true,
    })
    expect(verifyHarnessFlowArtifact(earlyAccept).ok).toBe(true)
    expect(earlyAccept.events.map((event) => event.type)).toContain("runtime.accepted-early")
    expect(earlyAccept.graph.nodes.find((node) => node.id === "acceptance.check")?.metrics).toMatchObject({ acceptedEarly: true })
    expect(earlyAccept.graph.nodes.find((node) => node.id === "acceptance.check")?.status).toBe("matched")
  })

  it("exposes flow graph generation and verification through the CLI", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-flow-graph-"))
    try {
      const out = join(dir, "flow-graph-compare.json")
      const stdout: string[] = []
      const stderr: string[] = []
      const io = {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      }

      expect(await runCli(["flow-graph", "--product", "opencode", "--mode", "compare", "--task", "read-only-answer", "--out", out, "--json"], io)).toBe(0)
      const artifact = JSON.parse(stdout.join("")) as { product: string; diffs: unknown[]; summary: { fingerprint: string } }
      expect(artifact.product).toBe("opencode")
      expect(artifact.diffs.length).toBeGreaterThan(0)
      expect(artifact.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)

      stdout.length = 0
      expect(await runCli(["flow-graph", "--product", "opencode", "--mode", "trace", "--task", "read-only-answer", "--json"], io)).toBe(0)
      const trace = JSON.parse(stdout.join("")) as { runID: string; captureMode: string; graph: { mode: string }; summary: { fingerprint: string } }
      expect(trace.runID).toMatch(/^flow-run-/)
      expect(trace.captureMode).toBe("fixture")
      expect(trace.graph.mode).toBe("trace")
      expect(trace.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)

      const customOpenCodeRecipe = {
        ...opencodeRecipe,
        id: "custom.opencode-nanobot-prompt",
        atoms: [
          ...((opencodeRecipe.atoms ?? []) as Array<{ id: string }>).filter((atom) => atom.id !== "opencode.prompt.mode-builder"),
          { id: "nanobot.prompt.agent-builder" },
        ],
        bindings: ((opencodeRecipe.bindings ?? []) as Array<{ port: string; module: string }>).map((binding) =>
          binding.port === "prompt.system-builder"
            ? { ...binding, module: "nanobot.prompt.agent-builder" }
            : binding,
        ),
        personalities: ["common", "opencode", "nanobot"],
        metadata: {
          ...(opencodeRecipe.metadata ?? {}),
          product: "opencode",
          basedOn: "opencode",
          sourceFingerprint: "custom-opencode-nanobot-prompt",
        },
      }
      const customRecipePath = join(dir, "custom-opencode-nanobot-prompt.json")
      const customOut = join(dir, "flow-graph-custom-opencode-nanobot-prompt.json")
      writeFileSync(customRecipePath, `${JSON.stringify(customOpenCodeRecipe, null, 2)}\n`, "utf8")

      stdout.length = 0
      expect(await runCli(["flow-graph", "--recipe-file", customRecipePath, "--mode", "blueprint", "--out", customOut, "--json"], io)).toBe(0)
      const customFlow = JSON.parse(stdout.join("")) as {
        product?: string
        recipeID?: string
        summary?: { fingerprint?: string }
        nodes?: Array<{
          id?: string
          metrics?: {
            parityTargetBlockers?: string[]
            moduleClaims?: Array<{
              atomID?: string
              sourceProduct?: string
              parityTargetProduct?: string
              parityTargetSatisfied?: boolean
              evidenceRefs?: string[]
              fixtureIDs?: string[]
              knownLossiness?: string[]
              blockers?: string[]
            }>
          }
        }>
      }
      expect(customFlow).toMatchObject({
        product: "opencode",
        recipeID: "custom.opencode-nanobot-prompt",
      })
      expect(customFlow.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(customFlow.nodes?.find((node) => node.id === "prompt.assemble")?.metrics).toMatchObject({
        parityTargetBlockers: expect.arrayContaining(["custom-draft-composition", "native-parity-not-proven", "source-product-mismatch"]),
        moduleClaims: expect.arrayContaining([
          expect.objectContaining({
            atomID: "nanobot.prompt.agent-builder",
            sourceProduct: "nanobot",
            parityTargetProduct: "opencode",
            parityTargetSatisfied: false,
            evidenceRefs: expect.arrayContaining([
              "conformance:nanobot-prompt-native-exact-fixture",
              "conformance:nanobot-prompt-upstream-source-matrix",
              "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
            ]),
            fixtureIDs: expect.arrayContaining(["nanobot-prompt:native-exact-fixture", "nanobot-prompt:upstream-source-matrix"]),
            knownLossiness: [],
            blockers: expect.arrayContaining(["custom-draft-composition", "native-parity-not-proven", "source-product-mismatch"]),
          }),
        ]),
      })
      const nanobotPromptClaim = customFlow.nodes
        ?.find((node) => node.id === "prompt.assemble")
        ?.metrics
        ?.moduleClaims
        ?.find((claim) => claim.atomID === "nanobot.prompt.agent-builder")
      expect(nanobotPromptClaim?.evidenceRefs).not.toContain("upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab")

      stdout.length = 0
      expect(await runCli(["verify-flow-graph", "--artifact", customOut, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, summary: { graphs: 1 } })

      const customSessionRecipe = {
        ...opencodeRecipe,
        id: "custom.opencode-pi-session-store",
        atoms: [
          ...((opencodeRecipe.atoms ?? []) as Array<{ id: string }>).filter((atom) => atom.id !== "opencode.session.store.sqlite-projection"),
          { id: "pi.session.store.jsonl-v3" },
        ],
        bindings: ((opencodeRecipe.bindings ?? []) as Array<{ port: string; module: string }>).map((binding) =>
          binding.port === "session.store"
            ? { ...binding, module: "pi.session.store.jsonl-v3" }
            : binding,
        ),
        personalities: ["common", "opencode", "pi-mono"],
        metadata: {
          ...(opencodeRecipe.metadata ?? {}),
          product: "opencode",
          basedOn: "opencode",
          sourceFingerprint: "custom-opencode-pi-session-store",
        },
      }
      const customSessionRecipePath = join(dir, "custom-opencode-pi-session-store.json")
      const customSessionOut = join(dir, "flow-graph-custom-opencode-pi-session-store.json")
      writeFileSync(customSessionRecipePath, `${JSON.stringify(customSessionRecipe, null, 2)}\n`, "utf8")

      stdout.length = 0
      expect(await runCli(["flow-graph", "--recipe-file", customSessionRecipePath, "--mode", "blueprint", "--out", customSessionOut, "--json"], io)).toBe(0)
      const customSessionFlow = JSON.parse(stdout.join("")) as typeof customFlow
      const piSessionClaim = customSessionFlow.nodes
        ?.find((node) => node.id === "session.assistant-write")
        ?.metrics
        ?.moduleClaims
        ?.find((claim) => claim.atomID === "pi.session.store.jsonl-v3")
      expect(piSessionClaim).toMatchObject({
        sourceProduct: "pi-mono",
        parityTargetProduct: "opencode",
        parityTargetSatisfied: false,
        evidenceRefs: expect.arrayContaining([
          "conformance:pi-session-store-jsonl-v3-native-exact-fixture",
          "session-store-jsonl-v3-native-exact:pi-mono",
          "upstream:https://github.com/earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        ]),
        fixtureIDs: expect.arrayContaining(["pi-session-store-jsonl-v3:native-exact-fixture"]),
        knownLossiness: [],
        blockers: expect.arrayContaining(["custom-draft-composition", "source-product-mismatch"]),
      })
      expect(piSessionClaim?.evidenceRefs).not.toContain("upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab")

      stdout.length = 0
      expect(await runCli(["verify-flow-graph", "--artifact", customSessionOut, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, summary: { graphs: 1 } })

      stdout.length = 0
      expect(await runCli(["verify-flow-graph", "--artifact", out, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, summary: { comparisons: 1, graphs: 2 } })
      expect(stderr.join("")).toBe("")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("writes verified flow graph report artifacts for docs reports", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-flow-graph-reports-"))
    try {
      const taskArtifact = await runProductTaskParitySuite({
        taskIDs: ["read-only-answer"],
        products: ["opencode"],
        modes: ["assembled", "original"],
        provider: "cassette",
      })
      const fixtureSet = createProductTaskNativeCadenceFixtureSet({ artifact: taskArtifact })
      const split = createProductTaskNativeCadenceFixtureSplitSet({ fixtureSet, generatedAt: new Date("2026-06-09T00:00:00.000Z") })
      writeProductTaskNativeCadenceFixtureSplitSet({ outDir: join(dir, "task-parity-native-cadence-fixtures"), fixtureSet: split })

      const stdout: string[] = []
      const stderr: string[] = []
      const io = {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      }

      expect(await runCli(["flow-graph", "reports", "--product", "opencode,minimal", "--task", "read-only-answer", "--out-dir", dir, "--json"], io)).toBe(0)
      const output = JSON.parse(stdout.join("")) as {
        artifacts: Array<{ kind: string; product: string; path: string; verification: { ok: boolean } }>
        summary: { ok: boolean; artifacts: number; graphs: number; comparisons: number }
      }
      const opencodeBlueprint = join(dir, "flow-graph-opencode.json")
      const minimalBlueprint = join(dir, "flow-graph-minimal.json")
      const opencodeCompare = join(dir, "flow-graph-compare-opencode-read-only-answer.json")
      const minimalCompare = join(dir, "flow-graph-compare-minimal-read-only-answer.json")

      expect(output.summary).toMatchObject({ ok: true, artifacts: 3, comparisons: 1 })
      expect(output.artifacts.every((artifact) => artifact.verification.ok)).toBe(true)
      expect(existsSync(opencodeBlueprint)).toBe(true)
      expect(existsSync(minimalBlueprint)).toBe(true)
      expect(existsSync(opencodeCompare)).toBe(true)
      expect(existsSync(minimalCompare)).toBe(false)
      const comparison = JSON.parse(readFileSync(opencodeCompare, "utf8")) as { original?: HarnessFlowGraph }
      expect(comparison.original?.evidence).toEqual(expect.arrayContaining([
        expect.objectContaining({
          kind: "native-cadence",
          metadata: expect.objectContaining({
            projectionLossDetails: expect.arrayContaining([
              expect.objectContaining({ field: "acceptance", lossiness: "unobservable" }),
            ]),
          }),
        }),
      ]))

      for (const artifactPath of [opencodeBlueprint, minimalBlueprint, opencodeCompare]) {
        const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as unknown
        expect(verifyHarnessFlowArtifact(artifact).ok).toBe(true)
        const raw = JSON.stringify(artifact)
        expect(raw).not.toMatch(/"(apiKey|authorization|rawPrompt|providerRequest|toolArgs)"/)
      }
      expect(stderr.join("")).toBe("")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 20000)

  it("builds native flow graphs from split native cadence fixture manifests", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-flow-native-manifest-"))
    try {
      const taskArtifact = await runProductTaskParitySuite({
        taskIDs: ["read-only-answer"],
        products: ["opencode"],
        modes: ["assembled", "original"],
        provider: "cassette",
      })
      const fixtureSet = createProductTaskNativeCadenceFixtureSet({ artifact: taskArtifact })
      const split = createProductTaskNativeCadenceFixtureSplitSet({ fixtureSet, generatedAt: new Date("2026-06-09T00:00:00.000Z") })
      writeProductTaskNativeCadenceFixtureSplitSet({ outDir: dir, fixtureSet: split })

      const stdout: string[] = []
      const stderr: string[] = []
      const io = {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      }

      expect(await runCli(["flow-graph", "--product", "opencode", "--mode", "native", "--task", "read-only-answer", "--artifact", join(dir, "manifest.json"), "--json"], io)).toBe(0)
      const graph = JSON.parse(stdout.join("")) as HarnessFlowGraph
      expect(graph.source).toBe("original")
      expect(graph.mode).toBe("native")
      expect(graph.product).toBe("opencode")
      expect(graph.taskID).toBe("read-only-answer")
      expect(graph.evidence).toEqual(expect.arrayContaining([
        expect.objectContaining({
          kind: "native-cadence",
          id: "native-cadence.opencode.read-only-answer",
          metadata: expect.objectContaining({
            adapterID: "opencode.fixture-native",
            fixtureGlob: "docs/reports/task-parity-native-cadence-fixtures/attachments/opencode-*.json",
            projectionLossDetails: expect.arrayContaining([
              expect.objectContaining({ field: "acceptance", lossiness: "unobservable" }),
            ]),
          }),
        }),
      ]))
      expect(graph.nodes.find((node) => node.id === "provider.request")?.metrics.requestCount).toEqual(expect.any(Number))
      expect(verifyHarnessFlowGraph(graph).ok).toBe(true)
      expect(stderr.join("")).toBe("")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 20000)

  it("surfaces field-level native projection losses in four-product compare graphs", async () => {
    const generatedAt = "2026-06-09T00:00:00.000Z"
    const products = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const
    const expectedLossFields = ["providerBoundary", "streamDelta", "toolLifecycle", "messageWrite", "acceptance", "workspace", "providerRawFrame", "providerRawPayload", "providerTiming"]
    const taskArtifact = await runProductTaskParitySuite({
      taskIDs: ["read-only-answer"],
      products: [...products],
      modes: ["assembled", "original"],
      provider: "cassette",
    })
    const fixtureSet = createProductTaskNativeCadenceFixtureSet({ artifact: taskArtifact })

    for (const product of products) {
      const fixture = fixtureSet.fixtures.find((candidate) => candidate.product === product && candidate.taskID === "read-only-answer")
      expect(fixture, product).toBeDefined()
      if (!fixture) continue
      const assembled = buildAssembledFlowBlueprint(buildAssemblyContract({ product, generatedAt }), generatedAt)
      const original = buildOriginalFlowFromNativeCadenceFixture(fixture, generatedAt)
      const comparison = compareHarnessFlows({ assembled, original, generatedAt })
      const evidence = comparison.original.evidence.find((item) => item.kind === "native-cadence")
      const projectionLossDetails = evidence?.metadata.projectionLossDetails as Array<{ field?: string; lossiness?: string; reason?: string }> | undefined

      expect(projectionLossDetails?.map((loss) => loss.field)).toEqual(expect.arrayContaining(expectedLossFields))
      for (const field of expectedLossFields) {
        const detail = projectionLossDetails?.find((loss) => loss.field === field)
        expect(detail, `${product}:${field}`).toBeDefined()
        expect(detail?.lossiness, `${product}:${field}`).toMatch(/^(semantic|inferred|unobservable)$/)
        expect(detail?.reason, `${product}:${field}`).toContain(field)
        expect(detail?.reason, `${product}:${field}`).toContain("evidence")
      }
      expect(projectionLossDetails?.find((loss) => loss.field === "messageWrite")).toMatchObject({
        lossiness: "semantic",
        reason: expect.stringContaining("message-store evidence"),
      })
      expect(projectionLossDetails?.find((loss) => loss.field === "workspace")).toMatchObject({
        lossiness: "inferred",
        reason: expect.stringContaining("workspace-diff evidence"),
      })
      expect(projectionLossDetails?.find((loss) => loss.field === "providerRawFrame")).toMatchObject({
        lossiness: "semantic",
        reason: expect.stringContaining("raw-frame evidence"),
      })
      expect(projectionLossDetails?.find((loss) => loss.field === "providerRawPayload")).toMatchObject({
        lossiness: "semantic",
        reason: expect.stringContaining("raw payload round-trip evidence"),
      })
      expect(projectionLossDetails?.find((loss) => loss.field === "providerTiming")).toMatchObject({
        lossiness: "inferred",
        reason: expect.stringContaining("timing evidence"),
      })
      const messagePartDiff = comparison.diffs.find((diff) => diff.category === "cadence.message-part-type")
      const prefix = product === "pi-mono" ? "pi" : product === "hermes-agent" ? "hermes" : product
      expect(messagePartDiff, product).toMatchObject({
        owningPlane: "native-projector",
        candidateAtomIDs: expect.arrayContaining([`${prefix}.session.message-part-projector.native-like`]),
      })
    }
  }, 20000)

  it("builds native flow graphs from legacy task parity artifacts and compare graphs from native cadence fixtures", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-flow-task-parity-"))
    try {
      const taskArtifact = await runProductTaskParitySuite({
        taskIDs: ["read-only-answer"],
        products: ["opencode"],
        modes: ["assembled", "original"],
        provider: "cassette",
      })
      const legacyPath = join(dir, "task-parity.json")
      writeProductTaskParityArtifact(legacyPath, taskArtifact)
      const taskParitySplit = createProductTaskParitySplitArtifactSet({ artifact: taskArtifact, generatedAt: new Date("2026-06-09T00:00:00.000Z") })
      const taskParitySplitDir = join(dir, "task-parity-split")
      writeProductTaskParitySplitArtifactSet({ outDir: taskParitySplitDir, artifactSet: taskParitySplit })
      const nativeFixtureSet = createProductTaskNativeCadenceFixtureSet({ artifact: taskArtifact })
      const nativeFixtureSplit = createProductTaskNativeCadenceFixtureSplitSet({ fixtureSet: nativeFixtureSet, generatedAt: new Date("2026-06-09T00:00:00.000Z") })
      const nativeFixtureSplitDir = join(dir, "native-cadence")
      writeProductTaskNativeCadenceFixtureSplitSet({ outDir: nativeFixtureSplitDir, fixtureSet: nativeFixtureSplit })

      const stdout: string[] = []
      const stderr: string[] = []
      const io = {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      }

      expect(await runCli(["flow-graph", "--product", "opencode", "--mode", "native", "--task", "read-only-answer", "--artifact", legacyPath, "--json"], io)).toBe(0)
      const nativeGraph = JSON.parse(stdout.join("")) as HarnessFlowGraph
      expect(nativeGraph.source).toBe("original")
      expect(nativeGraph.mode).toBe("native")
      expect(nativeGraph.evidence).toEqual(expect.arrayContaining([
        expect.objectContaining({
          kind: "task-parity",
          id: "task-parity.opencode.original.read-only-answer",
          metadata: expect.objectContaining({
            adapterID: "opencode.fixture-native",
            reportMode: "original",
          }),
        }),
      ]))
      expect(nativeGraph.nodes.find((node) => node.id === "provider.request")?.metrics.requestCount).toEqual(expect.any(Number))
      expect(verifyHarnessFlowGraph(nativeGraph).ok).toBe(true)

      stdout.length = 0
      expect(await runCli(["flow-graph", "--product", "opencode", "--mode", "compare", "--task", "read-only-answer", "--artifact", join(nativeFixtureSplitDir, "manifest.json"), "--json"], io)).toBe(0)
      const comparison = JSON.parse(stdout.join("")) as { original?: HarnessFlowGraph; summary?: { fingerprint?: string }; diffs?: unknown[] }
      expect(comparison.original?.evidence).toEqual(expect.arrayContaining([
        expect.objectContaining({
          kind: "native-cadence",
          id: "native-cadence.opencode.read-only-answer",
          metadata: expect.objectContaining({
            adapterID: "opencode.fixture-native",
            projectionLossDetails: expect.arrayContaining([
              expect.objectContaining({ field: "acceptance", lossiness: "unobservable" }),
            ]),
          }),
        }),
      ]))
      expect(comparison.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(comparison.diffs?.length).toEqual(expect.any(Number))
      expect(stderr.join("")).toBe("")

      stdout.length = 0
      stderr.length = 0
      expect(await runCli(["flow-graph", "--product", "opencode", "--mode", "compare", "--task", "read-only-answer", "--artifact", join(taskParitySplitDir, "manifest.json"), "--json"], io)).toBe(2)
      expect(stderr.join("")).toContain("Native cadence fixture artifact failed verification")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 20000)
})
