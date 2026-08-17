import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"
import { createID, type LegoProviderAdapter, type LegoToolDefinition, type ProviderRequest, type ProviderStreamEvent } from "@helix/contracts"
import { loadOpenCodePlugin } from "@helix/adapters-opencode"
import {
  captureOpenCodeTurnProviderRequestBuilderNativeExactFixture,
  createOpenCodeTurnProviderRequestBuilderBridge,
  verifyOpenCodeTurnProviderRequestBuilderNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-provider-request-builder"
import {
  captureOpenCodeTurnProviderStreamRunnerNativeExactFixture,
  createOpenCodeTurnProviderStreamRunnerBridge,
  verifyOpenCodeTurnProviderStreamRunnerNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-provider-stream-runner"
import {
  captureOpenCodeTurnInputNormalizerNativeExactFixture,
  createOpenCodeTurnInputNormalizerBridge,
  verifyOpenCodeTurnInputNormalizerNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-input-normalizer"
import {
  captureOpenCodeTurnContextBuilderNativeExactFixture,
  createOpenCodeTurnContextBuilderBridge,
  verifyOpenCodeTurnContextBuilderNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-context-builder"
import {
  captureOpenCodeTurnPromptAssemblerNativeExactFixture,
  createOpenCodeTurnPromptAssemblerBridge,
  verifyOpenCodeTurnPromptAssemblerNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-prompt-assembler"
import {
  captureOpenCodeTurnRetryPolicyNativeExactFixture,
  createOpenCodeTurnRetryPolicyBridge,
  openCodeTurnRetryAPIError,
  verifyOpenCodeTurnRetryPolicyNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-retry-policy"
import {
  captureOpenCodeTurnStreamReducerNativeExactFixture,
  createOpenCodeTurnStreamReducerBridge,
  verifyOpenCodeTurnStreamReducerNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-stream-reducer"
import {
  captureOpenCodeTurnContinuationPolicyNativeExactFixture,
  captureOpenCodeTurnStopConditionNativeExactFixture,
  createOpenCodeTurnLoopControlBridge,
  verifyOpenCodeTurnContinuationPolicyNativeExactFixture,
  verifyOpenCodeTurnStopConditionNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-loop-control"
import {
  captureOpenCodeTurnCompactionPolicyNativeExactFixture,
  createOpenCodeTurnCompactionPolicyBridge,
  verifyOpenCodeTurnCompactionPolicyNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-compaction-policy"
import {
  captureOpenCodeTurnResultRecorderNativeExactFixture,
  createOpenCodeTurnResultRecorderBridge,
  verifyOpenCodeTurnResultRecorderNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-result-recorder"
import {
  captureOpenCodeTurnToolCallPlannerNativeExactFixture,
  captureOpenCodeTurnToolExecutorNativeExactFixture,
  createOpenCodeTurnToolLoopBridge,
  verifyOpenCodeTurnToolCallPlannerNativeExactFixture,
  verifyOpenCodeTurnToolExecutorNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-tool-loop"
import {
  buildProviderContext,
  acceptanceControllerToken,
  buildOpenCodeAgentLoopFinalSummaryNativeExactFixture,
  buildOpenCodeAgentLoopRequestBoundaryNativeExactFixture,
  buildCadenceReplaySnapshot,
  captureOpenCodeTurnNativeLoopExactDiffFixture,
  createCadencePolicyBundle,
  buildTurnNativeLoopExactDiffBlockerSnapshot,
  buildTurnNativeLoopPinnedReplaySnapshot,
  buildTurnNativeLoopReplayGateSnapshot,
  projectOpenCodeTurnIdentityReadbackProjection,
  projectOpenCodeTurnLoopControlProjection,
  projectOpenCodeTurnPipelineBoundary,
  projectOpenCodeTurnProviderStepProjection,
  projectOpenCodeTurnSideEffectTimelineProjection,
  buildProductTurnReplaySnapshot,
  finalSummaryPolicyToken,
  requestBoundaryPolicyToken,
  runAgentTurn,
  selectTurnPipelineStrategies,
  toolBatchSchedulerToken,
  turnPipelineAtomIDs,
  type TurnPipelineTracePayload,
  verifyOpenCodeTurnIdentityReadbackProjection,
  verifyOpenCodeTurnLoopControlProjection,
  verifyOpenCodeTurnPipelineBoundaryProjection,
  verifyOpenCodeTurnProviderStepProjection,
  verifyOpenCodeTurnSideEffectTimelineProjection,
  verifyOpenCodeAgentLoopFinalSummaryNativeExactFixture,
  verifyOpenCodeAgentLoopRequestBoundaryNativeExactFixture,
  verifyOpenCodeTurnNativeLoopExactDiffFixture,
  verifyTurnNativeLoopExactDiffBlockerSnapshot,
  verifyTurnNativeLoopPinnedReplaySnapshot,
  verifyTurnNativeLoopReplayGateSnapshot,
} from "@helix/lego-agent-loop"
import { createAssistantMessage, createUserMessage } from "@helix/lego-session"
import { createEchoTool } from "@helix/lego-tools"
import { createAlwaysDenyPermissionPolicy, toolPermissionPolicyToken } from "@helix/lego-tools/ports"
import { assembleOpenCodeHarness, assemblePiMonoHarness } from "@helix/recipes"

describe("agent-loop lifecycle conformance", () => {
  it("proves OpenCode agent-loop request boundary and final summary as native exact module fixtures", () => {
    const requestBoundary = buildOpenCodeAgentLoopRequestBoundaryNativeExactFixture()
    const finalSummary = buildOpenCodeAgentLoopFinalSummaryNativeExactFixture()

    expect(requestBoundary).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.agent-loop.request-boundary.native-like",
      portID: "agent-loop.request-boundary",
      evidenceRef: "conformance:opencode-agent-loop-request-boundary-native-exact-fixture",
      fixtureID: "opencode-agent-loop-request-boundary:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      policy: expect.objectContaining({
        toolCallsContinueToNextProviderRound: true,
        maxStepsAddsProviderReminderInsteadOfPreBoundaryStop: true,
      }),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(finalSummary).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.agent-loop.final-summary.native-like",
      portID: "agent-loop.final-summary",
      evidenceRef: "conformance:opencode-agent-loop-final-summary-native-exact-fixture",
      fixtureID: "opencode-agent-loop-final-summary:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      policy: expect.objectContaining({
        noSyntheticConciseSummaryProviderRound: true,
        sessionSummaryServiceUpdatesDiffMetadataOnly: true,
      }),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(requestBoundary.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/prompt.ts"),
      expect.stringContaining("packages/opencode/src/session/processor.ts"),
    ]))
    expect(finalSummary.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/processor.ts"),
      expect.stringContaining("packages/opencode/src/session/summary.ts"),
    ]))
    expect(requestBoundary.cases).toEqual(expect.arrayContaining([
      expect.objectContaining({ scenarioID: "tool-results-continue", decision: "continue", reasonCode: "tool-results-need-provider-continuation" }),
      expect.objectContaining({ scenarioID: "provider-finished-without-tools", decision: "stop", reasonCode: "stop" }),
    ]))
    expect(finalSummary.cases).toEqual(expect.arrayContaining([
      expect.objectContaining({ scenarioID: "empty-final-text", decision: "none", reasonCode: "opencode-upstream-no-synthetic-summary" }),
      expect.objectContaining({ scenarioID: "tool-results-need-visible-finalization", decision: "native-final-message" }),
    ]))
    expect(verifyOpenCodeAgentLoopRequestBoundaryNativeExactFixture(requestBoundary)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeAgentLoopFinalSummaryNativeExactFixture(finalSummary)).toEqual({ ok: true, issues: [] })

    expect(verifyOpenCodeAgentLoopRequestBoundaryNativeExactFixture({ ...requestBoundary, knownLossiness: ["partial-cadence-replay"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-agent-loop-request-boundary-native-exact.lossiness" }),
    ]))
    expect(verifyOpenCodeAgentLoopFinalSummaryNativeExactFixture({
      ...finalSummary,
      policy: { ...finalSummary.policy, noSyntheticConciseSummaryProviderRound: false },
    } as unknown as typeof finalSummary).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-agent-loop-final-summary-native-exact.policy" }),
    ]))
  })

  it("proves OpenCode turn native-loop tool-result continuation as a live exact-diff fixture", async () => {
    const harness = assembleOpenCodeHarness()
    const policies = createCadencePolicyBundle("opencode")
    const hookEvents: Array<{ type: string; payload: unknown }> = []
    const providerRequestBeforeRefs: ProviderRequest[] = []
    const providerRequests: ProviderRequest[] = []
    const rawStreamFrames: Array<{ requestIndex: number; event: ProviderStreamEvent }> = []
    harness.hooks.services.set(requestBoundaryPolicyToken, policies.requestBoundary)
    harness.hooks.services.set(finalSummaryPolicyToken, policies.finalSummary)
    harness.hooks.services.set(toolBatchSchedulerToken, policies.toolBatchScheduler)
    harness.hooks.registerTool(createEchoTool())
    harness.hooks.observe((event) => {
      hookEvents.push({ type: event.type, payload: event.payload })
      if (event.type === "provider.request.before") {
        const payload = event.payload as { request?: ProviderRequest }
        if (payload.request) providerRequestBeforeRefs.push(payload.request)
      }
    })

    const provider: LegoProviderAdapter = {
      id: "native-loop-exact-diff",
      models: () => [{ providerID: "native-loop-exact-diff", modelID: "model-a" }],
      async *stream(request) {
        providerRequests.push(request)
        const requestIndex = providerRequests.length - 1
        const frames: ProviderStreamEvent[] = requestIndex === 0
          ? [
            { type: "text", text: "looking up" },
            { type: "tool_call", id: "lookup-1", toolName: "echo", input: { text: "native-data" } },
            { type: "finish", finish: "tool_calls", usage: { input: 1, output: 1 }, cost: 0 },
          ]
          : [
            { type: "text", text: "final answer" },
            { type: "finish", finish: "stop", usage: { input: 2, output: 2 }, cost: 0 },
          ]
        for (const event of frames) {
          rawStreamFrames.push({ requestIndex, event })
          yield event
        }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "hello",
        systemPrompt: "base system",
        provider,
        maxSteps: 3,
        cadenceProduct: "opencode",
        assistantPartProtocol: "opencode-step-events",
      },
    })
    const fixture = captureOpenCodeTurnNativeLoopExactDiffFixture({
      harnessTrace: openCodeTurnNativeLoopTraceFromRun({
        result,
        providerRequests,
        rawStreamFrames,
        hookEvents,
        providerRequestBeforeRefs,
      }),
    })

    expect(verifyOpenCodeTurnNativeLoopExactDiffFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      fixtureID: "opencode-turn:native-loop-exact-diff-fixture",
      evidenceRef: "conformance:opencode-turn-native-loop-exact-diff-fixture",
      exactDiffStatus: "live-native-loop-exact-diff",
      coverageStatus: "native",
      nativeParityClaim: true,
      mismatchCount: 0,
      knownLossiness: [],
      retainedFields: expect.arrayContaining([
        "provider.request.payload",
        "raw.stream.frames",
        "stream.reducer.delta",
        "session.write-readback",
        "event.object-identity",
      ]),
    })
    expect(fixture.harnessTrace.providerRequests).toEqual([
      expect.objectContaining({ index: 0, messageRoles: ["user"], containsToolResult: false }),
      expect.objectContaining({ index: 1, messageRoles: ["user", "assistant"], containsToolResult: true }),
    ])
    expect(fixture.harnessTrace.rawStreamFrames.map((frame) => `${frame.requestIndex}:${frame.type}${frame.toolName ? `:${frame.toolName}` : ""}${frame.finish ? `:${frame.finish}` : ""}`)).toEqual([
      "0:text",
      "0:tool_call:echo",
      "0:finish:tool_calls",
      "1:text",
      "1:finish:stop",
    ])
    expect(fixture.harnessTrace.pipelineEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        atomID: "agent-loop.request-boundary",
        label: "tool-results-need-provider-continuation",
        policyAtomID: "opencode.agent-loop.request-boundary.native-like",
      }),
      expect.objectContaining({
        atomID: "agent-loop.final-summary",
        label: "assistant-already-visible",
        policyAtomID: "opencode.agent-loop.final-summary.native-like",
      }),
      expect.objectContaining({ atomID: "turn.stop-condition", label: "stop" }),
    ]))
    expect(fixture.harnessTrace.sessionReadback).toMatchObject({
      steps: 2,
      finish: "stop",
      transcriptRoles: ["user", "assistant"],
      assistantPartTypes: ["custom", "reasoning", "text", "tool_call", "tool_result", "text", "custom"],
      assistantFinish: "stop",
    })
    expect(fixture.harnessTrace.eventObjectIdentity).toEqual({
      providerRequestBeforeSameReference: true,
      providerRequestMessagesSameReference: true,
      providerRequestSystemSameReference: true,
      providerRequestToolsSameReference: true,
    })

    const broken = {
      ...fixture,
      harnessTrace: {
        ...fixture.harnessTrace,
        providerRequests: fixture.harnessTrace.providerRequests.map((request) =>
          request.index === 1 ? { ...request, containsToolResult: false } : request,
        ),
      },
    }
    expect(verifyOpenCodeTurnNativeLoopExactDiffFixture(broken).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-native-loop-exact-diff.mismatch" }),
    ]))
  })

  it("proves OpenCode turn loop continuation and stop conditions as native exact module fixtures", () => {
    const continuation = captureOpenCodeTurnContinuationPolicyNativeExactFixture()
    const stop = captureOpenCodeTurnStopConditionNativeExactFixture()

    expect(continuation).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.continuation-policy",
      portID: "turn.continuation-policy",
      evidenceRef: "conformance:opencode-turn-continuation-policy-native-exact-fixture",
      replayRef: "turn-continuation-policy-native-exact:opencode",
      fixtureID: "opencode-turn-continuation-policy:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(stop).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.stop-condition",
      portID: "turn.stop-condition",
      evidenceRef: "conformance:opencode-turn-stop-condition-native-exact-fixture",
      replayRef: "turn-stop-condition-native-exact:opencode",
      fixtureID: "opencode-turn-stop-condition:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(continuation.sourceRefs).toEqual(expect.arrayContaining([expect.stringContaining("packages/opencode/src/session/processor.ts")]))
    expect(stop.sourceRefs).toEqual(expect.arrayContaining([expect.stringContaining("packages/opencode/src/session/processor.ts")]))
    expect(continuation.cases.map((item) => item.id)).toEqual([
      "default-deny-breaks-loop",
      "config-allows-deny-continuation",
      "clean-turn-continues",
    ])
    expect(stop.cases.map((item) => item.id)).toEqual([
      "compaction-priority",
      "blocked-stops",
      "assistant-error-stops",
      "clean-turn-does-not-stop",
    ])
    expect(verifyOpenCodeTurnContinuationPolicyNativeExactFixture(continuation)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeTurnStopConditionNativeExactFixture(stop)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnLoopControlBridge()
    expect(bridge.initialShouldBreak({ experimental: { continue_loop_on_deny: true } })).toBe(false)
    expect(bridge.decide({ needsCompaction: true, blocked: true, assistantError: { message: "provider failed" } })).toBe("compact")

    expect(verifyOpenCodeTurnStopConditionNativeExactFixture({ ...stop, knownLossiness: ["partial-stop-condition"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-stop-condition-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode turn compaction policy as a native exact module fixture", () => {
    const fixture = captureOpenCodeTurnCompactionPolicyNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.compaction-policy",
      portID: "turn.compaction-policy",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-compaction-policy-native-exact-fixture",
      replayRef: "turn-compaction-policy-native-exact:opencode",
      fixtureID: "opencode-turn-compaction-policy:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/overflow.ts"),
      expect.stringContaining("packages/opencode/src/provider/transform.ts"),
      expect.stringContaining("packages/opencode/src/session/processor.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "auto-disabled-never-compacts",
      "context-zero-never-compacts",
      "reserved-config-uses-input-limit",
      "context-limit-reserves-output-max",
      "default-buffer-caps-reservation",
      "output-token-max-override",
      "zero-total-falls-back-to-component-count",
    ])
    expect(verifyOpenCodeTurnCompactionPolicyNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnCompactionPolicyBridge()
    expect(bridge.usable({
      cfg: {},
      model: { limit: { context: 100_000, input: 80_000, output: 64_000 } },
    })).toBe(60_000)
    expect(bridge.isOverflow({
      cfg: { compaction: { auto: false } },
      model: { limit: { context: 100_000, input: 80_000, output: 64_000 } },
      tokens: { total: 100_000, input: 0, output: 0, cache: { read: 0, write: 0 } },
    })).toBe(false)

    expect(verifyOpenCodeTurnCompactionPolicyNativeExactFixture({ ...fixture, knownLossiness: ["partial-compaction-policy"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-compaction-policy-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode turn result recorder as a native exact module fixture", () => {
    const fixture = captureOpenCodeTurnResultRecorderNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.result-recorder",
      portID: "turn.result-recorder",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-result-recorder-native-exact-fixture",
      replayRef: "turn-result-recorder-native-exact:opencode",
      fixtureID: "opencode-turn-result-recorder:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/processor.ts"),
      expect.stringContaining("packages/opencode/src/session/session.ts"),
      expect.stringContaining("packages/opencode/src/session/summary.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "step-start-records-snapshot-part",
      "text-complete-applies-plugin-transform",
      "reasoning-end-closes-part",
      "step-finish-updates-assistant-and-patch",
      "summary-mode-suppresses-step-events-and-summary",
      "cleanup-finalizes-open-parts-and-assistant",
    ])
    expect(verifyOpenCodeTurnResultRecorderNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnResultRecorderBridge()
    const state = bridge.createState()
    bridge.handleTextStart(state)
    bridge.handleTextDelta(state, { text: "draft" })
    bridge.handleTextEnd(state, { completeText: (text) => text.toUpperCase() })
    expect(state.parts[0]).toMatchObject({ type: "text", text: "DRAFT", time: { start: 100, end: 100 } })
    bridge.cleanup(state)
    expect(state.assistantMessage.time.completed).toBe(100)

    expect(verifyOpenCodeTurnResultRecorderNativeExactFixture({ ...fixture, knownLossiness: ["partial-result-recorder"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-result-recorder-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode turn tool call planner and executor as native exact module fixtures", () => {
    const planner = captureOpenCodeTurnToolCallPlannerNativeExactFixture()
    const executor = captureOpenCodeTurnToolExecutorNativeExactFixture()

    expect(planner).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.tool-call-planner",
      portID: "turn.tool-call-planner",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-tool-call-planner-native-exact-fixture",
      replayRef: "turn-tool-call-planner-native-exact:opencode",
      fixtureID: "opencode-turn-tool-call-planner:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(executor).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.tool-executor",
      portID: "turn.tool-executor",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-tool-executor-native-exact-fixture",
      replayRef: "turn-tool-executor-native-exact:opencode",
      fixtureID: "opencode-turn-tool-executor:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(planner.sourceRefs).toEqual(expect.arrayContaining([expect.stringContaining("packages/opencode/src/session/processor.ts")]))
    expect(executor.sourceRefs).toEqual(expect.arrayContaining([expect.stringContaining("packages/opencode/src/session/processor.ts")]))
    expect(planner.cases.map((item) => item.id)).toEqual([
      "input-start-creates-pending-tool",
      "input-end-marks-call",
      "tool-call-starts-running-state",
      "tool-call-wraps-non-record-input",
      "doom-loop-asks-permission",
      "summary-mode-rejects-tool-call",
    ])
    expect(executor.cases.map((item) => item.id)).toEqual([
      "structured-tool-result-completes-running-call",
      "json-result-falls-back-to-tool-name",
      "tool-error-blocks-when-user-rejected",
      "tool-result-ignored-without-running-call",
    ])
    expect(verifyOpenCodeTurnToolCallPlannerNativeExactFixture(planner)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeTurnToolExecutorNativeExactFixture(executor)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnToolLoopBridge()
    const state = bridge.createState()
    bridge.handlePlannerEvent(state, { type: "tool-call", id: "call_inline", name: "bash", input: "pwd" })
    expect(state.parts[0]).toMatchObject({
      callID: "call_inline",
      tool: "bash",
      state: { status: "running", input: { value: "pwd" }, time: { start: 100 } },
    })
    bridge.handleExecutorEvent(state, { type: "tool-result", id: "call_inline", name: "bash", result: { type: "text", value: "ok" } })
    expect(state.parts[0]?.state).toMatchObject({
      status: "completed",
      input: { value: "pwd" },
      output: "ok",
      metadata: {},
      title: "bash",
      time: { start: 100, end: 100 },
    })
    expect(state.toolcalls).toEqual({})
    expect(state.settled).toEqual(["call_inline"])

    expect(verifyOpenCodeTurnToolCallPlannerNativeExactFixture({ ...planner, knownLossiness: ["partial-tool-planner"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-tool-call-planner-native-exact.lossiness" }),
    ]))
    expect(verifyOpenCodeTurnToolExecutorNativeExactFixture({ ...executor, knownLossiness: ["partial-tool-executor"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-tool-executor-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode turn stream reducer as a native exact module fixture", () => {
    const fixture = captureOpenCodeTurnStreamReducerNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.stream-reducer",
      portID: "turn.stream-reducer",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-stream-reducer-native-exact-fixture",
      replayRef: "turn-stream-reducer-native-exact:opencode",
      fixtureID: "opencode-turn-stream-reducer:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/llm/ai-sdk.ts"),
      expect.stringContaining("packages/opencode/src/session/llm.ts"),
      expect.stringContaining("opencode.provider.event-observer"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "session-visible-stream-chunks",
      "implicit-block-ids",
      "ignored-non-session-visible-chunks",
      "tool-error-preserves-cause",
      "empty-usage-stays-undefined",
      "finish-resets-reused-state",
    ])
    expect(verifyOpenCodeTurnStreamReducerNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnStreamReducerBridge()
    const state = bridge.createState()
    const events = bridge.reduceEvents([
      { type: "text-delta", text: "hi" },
      { type: "text-end" },
      { type: "finish", finishReason: "stop", totalUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } },
      { type: "text-delta", text: "again" },
    ], state)
    expect(events).toEqual([
      { type: "text-delta", id: "text-0", text: "hi" },
      { type: "text-end", id: "text-0" },
      { type: "finish", reason: "stop", usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } },
      { type: "text-delta", id: "text-0", text: "again" },
    ])

    expect(verifyOpenCodeTurnStreamReducerNativeExactFixture({ ...fixture, knownLossiness: ["partial-stream-reducer"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-stream-reducer-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode turn provider stream runner as a native exact module fixture", () => {
    const fixture = captureOpenCodeTurnProviderStreamRunnerNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.provider-stream-runner",
      portID: "turn.provider-stream-runner",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-provider-stream-runner-native-exact-fixture",
      replayRef: "turn-provider-stream-runner-native-exact:opencode",
      fixtureID: "opencode-turn-provider-stream-runner:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/llm.ts"),
      expect.stringContaining("packages/opencode/src/session/llm/ai-sdk.ts"),
      expect.stringContaining("packages/opencode/src/provider/transform.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "native-runtime-selected-when-supported",
      "native-runtime-fallback-records-reason",
      "ai-sdk-stream-text-call-shape",
      "repair-tool-call-lowercase-match",
      "repair-tool-call-invalid-fallback",
      "full-stream-reduces-to-llm-events",
      "error-event-fails-stream",
      "scoped-abort-release",
    ])
    expect(verifyOpenCodeTurnProviderStreamRunnerNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnProviderStreamRunnerBridge()
    expect(bridge.selectRuntime({
      sessionID: "ses_1",
      model: { id: "m", providerID: "p" },
      prepared: { messages: [], tools: {}, params: {} },
    })).toEqual({ runtime: "ai-sdk", stream: "fullStream" })
    expect(bridge.repairToolCall({ toolCall: { toolName: "NoTool", input: {} }, error: { message: "broken" } }, {})).toMatchObject({
      toolName: "invalid",
      input: "{\"tool\":\"NoTool\",\"error\":\"broken\"}",
    })
    expect(() => bridge.consumeAIStream([{ type: "error", error: new Error("boom") }])).toThrow("boom")

    expect(verifyOpenCodeTurnProviderStreamRunnerNativeExactFixture({ ...fixture, knownLossiness: ["partial-provider-stream-runner"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-provider-stream-runner-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode turn input normalizer as a native exact module fixture", () => {
    const fixture = captureOpenCodeTurnInputNormalizerNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.input-normalizer",
      portID: "turn.input-normalizer",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-input-normalizer-native-exact-fixture",
      replayRef: "turn-input-normalizer-native-exact:opencode",
      fixtureID: "opencode-turn-input-normalizer:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/session.ts"),
      expect.stringContaining("packages/opencode/src/session/prompt.ts"),
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "root-session-default-title-and-path",
      "child-session-default-title-and-permission-copy",
      "prompt-input-builds-user-message-with-agent-model-variant",
      "text-part-assigns-native-ids-and-prompted-event",
      "agent-part-adds-task-tool-synthetic-hint",
      "data-text-file-expands-read-tool-context",
      "plugin-chat-message-can-transform-message-and-parts",
      "missing-agent-publishes-error",
    ])
    expect(verifyOpenCodeTurnInputNormalizerNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnInputNormalizerBridge()
    expect(bridge.createSessionInfo({
      id: "ses_1",
      slug: "slug_1",
      projectID: "proj_1",
      worktree: "/work",
      directory: "/work/app",
      now: Date.parse("2026-06-13T00:00:00.000Z"),
    })).toMatchObject({
      id: "ses_1",
      path: "app",
      title: "New session - 2026-06-13T00:00:00.000Z",
      cost: 0,
      tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    })
    expect(bridge.createUserMessage({
      sessionID: "ses_1",
      messageID: "msg_1",
      parts: [{ type: "text", text: "hello" }],
    }, {
      now: 1,
      defaultAgent: { name: "build" },
      defaultModel: { providerID: "openai", modelID: "gpt-5-codex" },
      currentSession: { agent: "build", model: { providerID: "openai", id: "gpt-5-codex", variant: "default" } },
    }).parts).toEqual([{ id: "prt_0", type: "text", text: "hello", messageID: "msg_1", sessionID: "ses_1" }])

    expect(verifyOpenCodeTurnInputNormalizerNativeExactFixture({ ...fixture, knownLossiness: ["partial-input-normalizer"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-input-normalizer-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode turn context builder as a native exact module fixture", () => {
    const fixture = captureOpenCodeTurnContextBuilderNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.context-builder",
      portID: "turn.context-builder",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-context-builder-native-exact-fixture",
      replayRef: "turn-context-builder-native-exact:opencode",
      fixtureID: "opencode-turn-context-builder:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
      expect.stringContaining("packages/opencode/src/session/prompt.ts"),
      expect.stringContaining("packages/opencode/src/session/session.ts"),
      expect.stringContaining("fixture-share:opencode.session.projector.message-v2"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "filter-compacted-reorders-summary-tail-and-continuation",
      "latest-uses-monotonic-message-id-and-unfinished-tasks",
      "finished-assistant-exits-when-only-orphaned-interrupted-tool-remains",
      "task-stack-pop-selects-newest-subtask-before-provider",
      "unfinished-compaction-task-routes-to-compaction",
      "overflow-after-finished-assistant-routes-to-auto-compaction",
      "step-two-wraps-new-user-text-before-message-transform",
      "message-v2-context-projects-to-provider-model-messages",
    ])
    expect(verifyOpenCodeTurnContextBuilderNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnContextBuilderBridge()
    expect(bridge.filterCompacted([
      { info: { id: "msg_2", sessionID: "ses", role: "assistant", parentID: "msg_1", finish: "stop" }, parts: [] },
      { info: { id: "msg_1", sessionID: "ses", role: "user" }, parts: [{ id: "prt_1", sessionID: "ses", messageID: "msg_1", type: "text", text: "hi" }] },
    ]).map((message) => message.info.id)).toEqual(["msg_1", "msg_2"])

    expect(verifyOpenCodeTurnContextBuilderNativeExactFixture({ ...fixture, knownLossiness: ["partial-context-builder"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-context-builder-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode turn retry policy as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeTurnRetryPolicyNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.retry-policy",
      portID: "turn.retry-policy",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-retry-policy-native-exact-fixture",
      replayRef: "turn-retry-policy-native-exact:opencode",
      fixtureID: "opencode-turn-retry-policy:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/retry.ts"),
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "retry-after-ms-header",
      "retry-after-seconds-header",
      "retry-after-date-header",
      "invalid-header-backoff",
      "no-header-backoff-cap",
      "context-overflow-not-retryable",
      "non-retryable-four-hundred",
      "server-error-retryable-even-with-sdk-flag-false",
      "free-tier-limit-action",
      "go-usage-limit-action",
      "plain-text-rate-limit",
      "json-rate-limit-patterns",
    ])
    expect(verifyOpenCodeTurnRetryPolicyNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnRetryPolicyBridge()
    expect(bridge.decision({
      attempt: 3,
      error: openCodeTurnRetryAPIError({
        message: "temporarily unavailable",
        statusCode: 503,
        isRetryable: false,
        responseHeaders: { "retry-after": "1.5" },
      }),
      provider: "opencode",
      now: 1_000,
    })).toMatchObject({
      retryable: { message: "temporarily unavailable" },
      delayMs: 1500,
      nextAttemptAt: 2500,
    })

    expect(verifyOpenCodeTurnRetryPolicyNativeExactFixture({ ...fixture, knownLossiness: ["partial-retry-policy"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-retry-policy-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode turn prompt assembler as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeTurnPromptAssemblerNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.prompt-assembler",
      portID: "turn.prompt-assembler",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-prompt-assembler-native-exact-fixture",
      replayRef: "turn-prompt-assembler-native-exact:opencode",
      fixtureID: "opencode-turn-prompt-assembler:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/llm/request.ts"),
      expect.stringContaining("packages/opencode/src/session/system.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "system-transform-folding",
      "openai-oauth-instructions",
      "workflow-small-message-policy",
    ])
    expect(verifyOpenCodeTurnPromptAssemblerNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnPromptAssemblerBridge()
    const prepared = await bridge.assemble({
      user: { id: "msg_inline", system: "user", model: {} },
      sessionID: "ses_inline",
      model: {
        id: "gpt-5",
        providerID: "openai",
        api: { id: "gpt-5", npm: "@ai-sdk/openai" },
        capabilities: {},
      },
      agent: { name: "build" },
      providerSystemPrompt: ["provider"],
      system: ["runtime"],
      messages: [{ role: "user", content: "hello" }],
      provider: { id: "openai", options: {} },
      isWorkflow: false,
      providerTransform: { options: { store: false } },
    })
    expect(prepared).toMatchObject({
      system: ["provider\nruntime\nuser"],
      messages: [
        { role: "system", content: "provider\nruntime\nuser" },
        { role: "user", content: "hello" },
      ],
      messageTransformOptions: { store: false },
    })

    expect(verifyOpenCodeTurnPromptAssemblerNativeExactFixture({ ...fixture, knownLossiness: ["partial-prompt-assembler"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-prompt-assembler-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode turn provider request builder as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeTurnProviderRequestBuilderNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.turn.provider-request-builder",
      portID: "turn.provider-request-builder",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-turn-provider-request-builder-native-exact-fixture",
      replayRef: "turn-provider-request-builder-native-exact:opencode",
      fixtureID: "opencode-turn-provider-request-builder:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/llm/request.ts"),
      expect.stringContaining("packages/opencode/src/permission/index.ts"),
      expect.stringContaining("packages/core/src/permission.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "standard-request-system-tools-and-headers",
      "openai-oauth-instructions",
      "workflow-opencode-small-request",
      "copilot-replay-noop-tool",
    ])
    expect(verifyOpenCodeTurnProviderRequestBuilderNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeTurnProviderRequestBuilderBridge({ userAgent: "opencode/test" })
    const prepared = await bridge.prepare({
      user: { id: "msg_inline", model: {}, tools: { read: true } },
      sessionID: "ses_inline",
      model: {
        id: "gpt-5",
        providerID: "opencode/gpt-5",
        api: { id: "gpt-5", npm: "@ai-sdk/openai" },
        capabilities: { temperature: true },
        headers: { "x-model": "1" },
      },
      agent: { name: "build" },
      providerSystemPrompt: ["provider prompt"],
      system: ["runtime prompt"],
      messages: [{ role: "user", content: "hello" }],
      tools: { read: { description: "read" } },
      provider: { id: "opencode", options: {} },
      flags: { client: "cli" },
      isWorkflow: false,
      projectID: "proj_inline",
      providerTransform: { options: { store: false }, temperature: 0.3, topP: 1, topK: 64, maxOutputTokens: 1024 },
    })
    expect(prepared).toMatchObject({
      system: ["provider prompt\nruntime prompt"],
      messages: [
        { role: "system", content: "provider prompt\nruntime prompt" },
        { role: "user", content: "hello" },
      ],
      tools: { read: { description: "read" } },
      params: { temperature: 0.3, topP: 1, topK: 64, maxOutputTokens: 1024, options: { store: false } },
      headers: {
        "x-opencode-project": "proj_inline",
        "x-opencode-session": "ses_inline",
        "x-opencode-request": "msg_inline",
        "x-opencode-client": "cli",
        "User-Agent": "opencode/test",
        "x-model": "1",
      },
    })

    expect(verifyOpenCodeTurnProviderRequestBuilderNativeExactFixture({ ...fixture, knownLossiness: ["partial-request-builder"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-turn-provider-request-builder-native-exact.lossiness" }),
    ]))
  })

  it("emits agent, provider, and tool lifecycle events in order", async () => {
    const harness = assembleOpenCodeHarness()
    const seen: string[] = []
    const requests: ProviderRequest[] = []

    harness.hooks.observe((event) => {
      seen.push(event.type)
    })
    harness.hooks.on("provider_request_before", () => ({
      system: ["patched system"],
      options: { temperature: 0 },
    }))

    const provider: LegoProviderAdapter = {
      id: "capture",
      models: () => [{ providerID: "capture", modelID: "model-a" }],
      async *stream(request) {
        requests.push(request)
        yield { type: "text", text: "running" }
        yield { type: "tool_call", id: "tool-1", toolName: "echo", input: { text: "hi" } }
        yield { type: "finish", finish: "stop", usage: { input: 1, output: 1 }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "hello",
        systemPrompt: "base system",
        provider,
      },
    })

    expect(requests[0]?.system).toEqual(["patched system"])
    expect(requests[0]?.options).toEqual({ temperature: 0 })
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("hi")
    expect(seen).toEqual(
      expect.arrayContaining([
        "agent.start",
        "provider.request.before",
        "tool.call",
        "tool.execution_start",
        "tool.result",
        "tool.execution_end",
        "provider.response.after",
        "agent.end",
      ]),
    )
    expect(indexOf(seen, "agent.start")).toBeLessThan(indexOf(seen, "provider.request.before"))
    expect(indexOf(seen, "provider.request.before")).toBeLessThan(indexOf(seen, "tool.call"))
    expect(indexOf(seen, "tool.call")).toBeLessThan(indexOf(seen, "tool.execution_start"))
    expect(indexOf(seen, "tool.execution_start")).toBeLessThan(indexOf(seen, "tool.result"))
    expect(indexOf(seen, "tool.result")).toBeLessThan(indexOf(seen, "tool.execution_end"))
    expect(indexOf(seen, "tool.execution_end")).toBeLessThan(indexOf(seen, "provider.response.after"))
    expect(indexOf(seen, "provider.response.after")).toBeLessThan(indexOf(seen, "agent.end"))
  })

  it("continues provider steps after tool results are available in context", async () => {
    const harness = assembleOpenCodeHarness()
    const requests: ProviderRequest[] = []
    const provider: LegoProviderAdapter = {
      id: "multi-step",
      models: () => [{ providerID: "multi-step", modelID: "model-a" }],
      async *stream(request) {
        requests.push(request)
        if (requests.length === 1) {
          yield { type: "tool_call", id: "lookup-1", toolName: "echo", input: { text: "tool-data" } }
          yield { type: "finish", finish: "tool_calls", usage: { input: 1, output: 1 }, cost: 0 }
          return
        }
        yield { type: "text", text: "final answer" }
        yield { type: "finish", finish: "stop", usage: { input: 2, output: 2 }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "hello",
        systemPrompt: "base system",
        provider,
        maxSteps: 3,
      },
    })

    expect(requests).toHaveLength(2)
    expect(JSON.stringify(requests[1]?.messages)).toContain("tool_result")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("tool-data")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("final answer")
    expect(result.steps).toBe(2)
    expect(result.finish).toBe("stop")
    expect(result.assistantMessage).toMatchObject({ role: "assistant", finish: "stop" })
  })

  it("replays a golden multi-step tool transcript shape", async () => {
    const harness = assembleOpenCodeHarness()
    harness.hooks.registerTool(createEchoTool())
    const provider: LegoProviderAdapter = {
      id: "golden-replay",
      models: () => [{ providerID: "golden-replay", modelID: "model-a" }],
      async *stream(request) {
        if (!JSON.stringify(request.messages).includes("golden-data")) {
          yield { type: "text", text: "looking up" }
          yield { type: "tool_call", id: "golden-tool", toolName: "echo", input: { text: "golden-data" } }
          yield { type: "finish", finish: "tool_calls", usage: { input: 1, output: 1 }, cost: 0 }
          return
        }
        yield { type: "text", text: "done" }
        yield { type: "finish", finish: "stop", usage: { input: 2, output: 2 }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "golden",
        systemPrompt: "base system",
        provider,
        maxSteps: 3,
      },
    })

    expect(result.steps).toBe(2)
    expect(goldenTranscript(result.transcript)).toMatchInlineSnapshot(`
      [
        {
          "parts": [
            {
              "text": "golden",
              "type": "text",
            },
          ],
          "role": "user",
        },
        {
          "finish": "stop",
          "parts": [
            {
              "text": "looking up",
              "type": "text",
            },
            {
              "status": "completed",
              "toolName": "echo",
              "type": "tool_call",
            },
            {
              "text": "golden-data",
              "toolName": "echo",
              "type": "tool_result",
            },
            {
              "text": "done",
              "type": "text",
            },
          ],
          "role": "assistant",
        },
      ]
    `)
  })

  it("runs default tool calls in parallel after ordered preflight", async () => {
    const harness = assembleOpenCodeHarness()
    const preflightOrder: string[] = []
    const lifecycle: string[] = []
    let running = 0
    let maxRunning = 0

    harness.hooks.observe((event) => {
      if (event.type !== "tool.call" && event.type !== "tool.execution_start") return
      const payload = event.payload as { toolName?: string }
      lifecycle.push(`${event.type}:${payload.toolName}`)
    })
    harness.hooks.on("tool_call", (event) => {
      const payload = event.payload as { toolName: string }
      preflightOrder.push(payload.toolName)
    })
    for (const name of ["slowA", "slowB"]) {
      harness.hooks.registerTool({
        name,
        description: `${name} parallel test tool.`,
        async execute() {
          running++
          maxRunning = Math.max(maxRunning, running)
          await wait(25)
          running--
          return {
            content: [{ id: createID("part"), type: "text", text: `done:${name}` }],
          }
        },
      })
    }

    const provider: LegoProviderAdapter = {
      id: "parallel-tools",
      models: () => [{ providerID: "parallel-tools", modelID: "model-a" }],
      async *stream() {
        yield { type: "tool_call", id: "tool-a", toolName: "slowA", input: {} }
        yield { type: "tool_call", id: "tool-b", toolName: "slowB", input: {} }
        yield { type: "finish", finish: "tool_calls", usage: { input: 1, output: 1 }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "parallel",
        systemPrompt: "base system",
        provider,
        maxSteps: 1,
      },
    })

    expect(preflightOrder).toEqual(["slowA", "slowB"])
    expect(lifecycle).toEqual(["tool.call:slowA", "tool.call:slowB", "tool.execution_start:slowA", "tool.execution_start:slowB"])
    expect(maxRunning).toBe(2)
    expect(toolResultNames(result.assistantMessage.parts ?? [])).toEqual(["slowA", "slowB"])
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("done:slowA")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("done:slowB")
  })

  it("keeps sequential tool calls out of parallel batches", async () => {
    const harness = assembleOpenCodeHarness()
    const executionOrder: string[] = []
    let running = 0
    let maxRunning = 0

    for (const tool of [createSequencedTool("seqA"), createSequencedTool("seqB")]) {
      harness.hooks.registerTool(tool)
    }

    const provider: LegoProviderAdapter = {
      id: "sequential-tools",
      models: () => [{ providerID: "sequential-tools", modelID: "model-a" }],
      async *stream() {
        yield { type: "tool_call", id: "tool-a", toolName: "seqA", input: {} }
        yield { type: "tool_call", id: "tool-b", toolName: "seqB", input: {} }
        yield { type: "finish", finish: "tool_calls", usage: { input: 1, output: 1 }, cost: 0 }
      },
    }

    await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "sequential",
        systemPrompt: "base system",
        provider,
        maxSteps: 1,
      },
    })

    expect(maxRunning).toBe(1)
    expect(executionOrder).toEqual(["seqA:start", "seqA:end", "seqB:start", "seqB:end"])

    function createSequencedTool(name: string): LegoToolDefinition {
      return {
        name,
        description: `${name} sequential test tool.`,
        executionMode: "sequential",
        async execute() {
          executionOrder.push(`${name}:start`)
          running++
          maxRunning = Math.max(maxRunning, running)
          await wait(25)
          running--
          executionOrder.push(`${name}:end`)
          return {
            content: [{ id: createID("part"), type: "text", text: `done:${name}` }],
          }
        },
      }
    }
  })

  it("truncates oversized tool results before appending them to the transcript", async () => {
    const harness = assembleOpenCodeHarness()
    harness.hooks.registerTool({
      name: "largeResult",
      description: "Return a large text result.",
      execute() {
        return {
          content: [{ id: createID("part"), type: "text", text: "x".repeat(50) }],
        }
      },
    })
    const provider: LegoProviderAdapter = {
      id: "large-result",
      models: () => [{ providerID: "large-result", modelID: "model-a" }],
      async *stream() {
        yield { type: "tool_call", id: "large-call", toolName: "largeResult", input: {} }
        yield { type: "finish", finish: "tool_calls", usage: { input: 1, output: 1 }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "large",
        systemPrompt: "base system",
        provider,
        maxSteps: 1,
        maxToolResultTextChars: 10,
      },
    })

    expect(JSON.stringify(result.assistantMessage.parts)).toContain("xxxxxxxxxx")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("[truncated 40 chars]")
    expect(JSON.stringify(result.assistantMessage.parts)).not.toContain("xxxxxxxxxxx")
  })

  it("stops tool-calling loops at maxSteps", async () => {
    const harness = assembleOpenCodeHarness()
    let calls = 0
    const provider: LegoProviderAdapter = {
      id: "looping",
      models: () => [{ providerID: "looping", modelID: "model-a" }],
      async *stream() {
        calls++
        yield { type: "tool_call", toolName: "echo", input: { text: `step-${calls}` } }
        yield { type: "finish", finish: "tool_calls", usage: { input: calls, output: calls }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "hello",
        systemPrompt: "base system",
        provider,
        maxSteps: 1,
      },
    })

    expect(calls).toBe(1)
    expect(result.steps).toBe(1)
    expect(result.finish).toBe("max_steps")
    expect(result.assistantMessage).toMatchObject({ role: "assistant", finish: "max_steps" })
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("step-1")
  })

  it("uses synthetic continue when a provider finish requires continuation", async () => {
    const harness = assembleOpenCodeHarness()
    const requests: ProviderRequest[] = []
    const seen: string[] = []
    harness.hooks.observe((event) => {
      seen.push(event.type)
    })
    const provider: LegoProviderAdapter = {
      id: "length-finish",
      models: () => [{ providerID: "length-finish", modelID: "model-a" }],
      async *stream(request) {
        requests.push(request)
        if (requests.length === 1) {
          yield { type: "text", text: "partial" }
          yield { type: "finish", finish: "length", usage: { input: 1, output: 1 }, cost: 0 }
          return
        }
        yield { type: "text", text: " done" }
        yield { type: "finish", finish: "stop", usage: { input: 2, output: 2 }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "hello",
        systemPrompt: "base system",
        provider,
        maxSteps: 3,
        syntheticContinue: true,
        syntheticContinueText: "please continue",
      },
    })

    expect(requests).toHaveLength(2)
    expect(JSON.stringify(requests[1]?.messages)).toContain("please continue")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("partial")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain(" done")
    expect(result.steps).toBe(2)
    expect(result.syntheticContinues).toBe(1)
    expect(result.finish).toBe("stop")
    expect(seen.filter((event) => event === "message.start").length).toBeGreaterThanOrEqual(3)
  })

  it("uses synthetic continue when acceptance evidence is unavailable on a no-tool final", async () => {
    const harness = assembleOpenCodeHarness()
    const requests: ProviderRequest[] = []
    const traces: TurnPipelineTracePayload[] = []
    harness.hooks.observe((event) => {
      if (String(event.type) === "turn.pipeline.trace") traces.push(event.payload as TurnPipelineTracePayload)
    })
    harness.hooks.services.set(acceptanceControllerToken, {
      id: "test.acceptance-controller",
      decide() {
        return {
          status: "continue",
          reasonCode: "missing-bash",
          atomID: "test.acceptance-controller",
          evidence: {
            timeline: { requiredToolResultAvailableAt: "unavailable" },
            unavailableUntil: [{ evidence: "tool.called.bash", until: "unavailable", reason: "bash was not called" }],
          },
        }
      },
    })
    const provider: LegoProviderAdapter = {
      id: "acceptance-gap",
      models: () => [{ providerID: "acceptance-gap", modelID: "model-a" }],
      async *stream(request) {
        requests.push(request)
        yield { type: "text", text: requests.length === 1 ? "draft final" : "after acceptance nudge" }
        yield { type: "finish", finish: "stop", usage: { input: requests.length, output: 1 }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "solve the task",
        systemPrompt: "base system",
        provider,
        maxSteps: 3,
        syntheticContinue: true,
      },
    })

    expect(requests).toHaveLength(2)
    expect(JSON.stringify(requests[1]?.messages)).toContain("The task is not complete yet")
    expect(JSON.stringify(requests[1]?.messages)).toContain("tool.called.bash")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("draft final")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("after acceptance nudge")
    expect(result.syntheticContinues).toBe(1)
    expect(traces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          atomID: "turn.continuation-policy",
          details: expect.objectContaining({
            reason: "acceptance",
            acceptanceStatus: "continue",
            blockedByUnavailableEvidence: ["tool.called.bash"],
          }),
        }),
      ]),
    )
  })

  it("compacts provider context through session compaction hooks on overflow", async () => {
    const harness = assemblePiMonoHarness()
    const session = await harness.session.create()
    await harness.session.appendMessage(createUserMessage({ sessionID: session.id, text: `old user ${"x".repeat(120)}` }))
    await harness.session.appendMessage(createAssistantMessage({ sessionID: session.id, text: `old answer ${"y".repeat(120)}` }))

    const seen: string[] = []
    const requests: ProviderRequest[] = []
    let beforePayload: { tokenEstimate?: number; tokenLimit?: number } | undefined
    harness.hooks.observe((event) => {
      seen.push(event.type)
    })
    harness.hooks.on("session_before_compact", (event) => {
      beforePayload = event.payload as typeof beforePayload
      return { summary: "hook compacted earlier context" }
    })
    harness.hooks.on("session_compact", () => ({ autocontinue: true }))

    const provider: LegoProviderAdapter = {
      id: "compact-capture",
      models: () => [{ providerID: "compact-capture", modelID: "model-a", contextWindow: 200 }],
      async *stream(request) {
        requests.push(request)
        yield { type: "text", text: "after compaction" }
        yield { type: "finish", finish: "stop", usage: { input: 1, output: 1 }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        sessionID: session.id,
        text: `current ${"z".repeat(80)}`,
        systemPrompt: "base system",
        provider,
        maxInputTokens: 20,
        compactionKeepMessages: 1,
      },
    })

    expect(result.contextCompacted).toBe(true)
    expect(result.contextTokenLimit).toBe(20)
    expect(beforePayload?.tokenEstimate).toBeGreaterThan(20)
    expect(JSON.stringify(requests[0]?.messages)).toContain("hook compacted earlier context")
    expect(JSON.stringify(requests[0]?.messages)).toContain("current")
    expect(JSON.stringify(requests[0]?.messages)).toContain("Continue.")
    expect(JSON.stringify(requests[0]?.messages)).not.toContain("old answer")
    expect(result.syntheticContinues).toBe(1)
    expect(seen).toEqual(expect.arrayContaining(["context", "session.before_compact", "session.compacting", "session.compact", "session.compacted"]))
    expect(indexOf(seen, "session.before_compact")).toBeLessThan(indexOf(seen, "provider.request.before"))

    const entries = (
      harness.session as unknown as { getEntries(sessionID: string): Array<{ type: string; summary?: string }> }
    ).getEntries(session.id)
    expect(entries).toEqual(expect.arrayContaining([expect.objectContaining({ type: "compaction", summary: "hook compacted earlier context" })]))
  })

  it("emits trace events for every explicit turn pipeline atom", async () => {
    const harness = assembleOpenCodeHarness()
    const session = await harness.session.create()
    await harness.session.appendMessage(createUserMessage({ sessionID: session.id, text: `old user ${"x".repeat(140)}` }))
    await harness.session.appendMessage(createAssistantMessage({ sessionID: session.id, text: `old assistant ${"y".repeat(140)}` }))
    const traces: TurnPipelineTracePayload[] = []
    harness.hooks.observe((event) => {
      if (String(event.type) === "turn.pipeline.trace") traces.push(event.payload as TurnPipelineTracePayload)
    })
    harness.hooks.on("session_before_compact", () => ({ summary: "pipeline compacted context" }))
    harness.hooks.on("session_compact", () => ({ autocontinue: true }))

    let calls = 0
    const provider: LegoProviderAdapter = {
      id: "pipeline-trace",
      models: () => [{ providerID: "pipeline-trace", modelID: "model-a", contextWindow: 200 }],
      async *stream() {
        calls++
        if (calls === 1) throw new Error("retry once")
        if (calls === 2) {
          yield { type: "tool_call", id: "trace-tool", toolName: "echo", input: { text: "trace-tool-result" } }
          yield { type: "finish", finish: "tool_calls", usage: { input: 1, output: 1 }, cost: 0 }
          return
        }
        if (calls === 3) {
          yield { type: "text", text: "partial trace" }
          yield { type: "finish", finish: "length", usage: { input: 2, output: 1 }, cost: 0 }
          return
        }
        yield { type: "text", text: " final trace" }
        yield { type: "finish", finish: "stop", usage: { input: 3, output: 1 }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        sessionID: session.id,
        text: `pipeline ${"z".repeat(80)}`,
        systemPrompt: "base system",
        provider,
        maxSteps: 4,
        maxRetries: 1,
        retryDelayMs: 0,
        maxInputTokens: 20,
        compactionKeepMessages: 1,
        syntheticContinue: true,
        syntheticContinueText: "trace continue",
        maxSyntheticContinues: 2,
      },
    })

    expect(result.finish).toBe("stop")
    expect(result.syntheticContinues).toBe(2)
    expect(new Set(traces.map((trace) => trace.atomID))).toEqual(new Set(turnPipelineAtomIDs))
    expect(traces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ atomID: "turn.retry-policy", phase: "decision", attempt: 0 }),
        expect.objectContaining({ atomID: "turn.compaction-policy", phase: "decision" }),
        expect.objectContaining({ atomID: "turn.continuation-policy", phase: "decision" }),
        expect.objectContaining({
          atomID: "turn.tool-call-planner",
          details: expect.objectContaining({
            planned: [expect.objectContaining({ toolName: "echo", mode: "parallel" })],
          }),
        }),
        expect.objectContaining({ atomID: "turn.result-recorder", phase: "end" }),
      ]),
    )
    expect(indexOf(traces.map((trace) => trace.atomID), "turn.provider-request-builder")).toBeLessThan(
      indexOf(traces.map((trace) => trace.atomID), "turn.provider-stream-runner"),
    )
  })

  it("selects OpenCode, Pi, neutral, and recipe-overridden pipeline strategies explicitly", () => {
    const opencode = selectTurnPipelineStrategies({ personality: "opencode" })
    const pi = selectTurnPipelineStrategies({ personality: "pi-mono" })
    const nanobot = selectTurnPipelineStrategies({ personality: "nanobot" })
    const hermes = selectTurnPipelineStrategies({ personality: "hermes-agent" })
    const neutral = selectTurnPipelineStrategies({ personality: "common" })
    const swapped = selectTurnPipelineStrategies({
      personality: "opencode",
      overrides: [{ atomID: "turn.continuation-policy", strategy: "pi.turn.continuation-policy", personality: "pi-mono" }],
    })

    expect(opencode).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ atomID: "turn.prompt-assembler", strategy: "opencode.turn.prompt-assembler", selectedBy: "personality" }),
        expect.objectContaining({ atomID: "turn.stream-reducer", strategy: "opencode.turn.stream-reducer", selectedBy: "personality" }),
      ]),
    )
    expect(pi).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ atomID: "turn.context-builder", strategy: "pi.turn.context-builder", selectedBy: "personality" }),
        expect.objectContaining({ atomID: "turn.prompt-assembler", strategy: "pi.turn.prompt-assembler", selectedBy: "personality" }),
      ]),
    )
    expect(nanobot).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ atomID: "turn.input-normalizer", strategy: "nanobot.turn.input-normalizer", selectedBy: "personality" }),
        expect.objectContaining({ atomID: "turn.provider-request-builder", strategy: "nanobot.turn.provider-request-builder", selectedBy: "personality" }),
        expect.objectContaining({ atomID: "turn.tool-call-planner", strategy: "nanobot.turn.tool-call-planner", selectedBy: "personality" }),
        expect.objectContaining({ atomID: "turn.retry-policy", strategy: "nanobot.turn.retry-policy", selectedBy: "personality" }),
      ]),
    )
    expect(hermes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ atomID: "turn.provider-stream-runner", strategy: "hermes.turn.provider-stream-runner", selectedBy: "personality" }),
        expect.objectContaining({ atomID: "turn.result-recorder", strategy: "hermes.turn.result-recorder", selectedBy: "personality" }),
        expect.objectContaining({ atomID: "turn.compaction-policy", strategy: "hermes.turn.compaction-policy", selectedBy: "personality" }),
        expect.objectContaining({ atomID: "turn.stop-condition", strategy: "hermes.turn.stop-condition", selectedBy: "personality" }),
      ]),
    )
    expect(neutral.every((selection) => selection.personality === "common")).toBe(true)
    expect(swapped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ atomID: "turn.continuation-policy", strategy: "pi.turn.continuation-policy", selectedBy: "override" }),
      ]),
    )
  })

  it("records product turn replay snapshots for all product turn atoms", () => {
    const products = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const
    const replayKeys = [
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
    ] as const
    for (const product of products) {
      const snapshot = buildProductTurnReplaySnapshot(product)
      const inputNormalizer = snapshot.atoms.find((atom) => atom.key === "input-normalizer")
      const context = snapshot.atoms.find((atom) => atom.key === "context-builder")
      const prompt = snapshot.atoms.find((atom) => atom.key === "prompt-assembler")
      const providerRequest = snapshot.atoms.find((atom) => atom.key === "provider-request-builder")
      const providerStream = snapshot.atoms.find((atom) => atom.key === "provider-stream-runner")
      const stream = snapshot.atoms.find((atom) => atom.key === "stream-reducer")
      const toolPlanner = snapshot.atoms.find((atom) => atom.key === "tool-call-planner")
      const toolExecutor = snapshot.atoms.find((atom) => atom.key === "tool-executor")
      const resultRecorder = snapshot.atoms.find((atom) => atom.key === "result-recorder")
      const retry = snapshot.atoms.find((atom) => atom.key === "retry-policy")
      const continuation = snapshot.atoms.find((atom) => atom.key === "continuation-policy")
      const compaction = snapshot.atoms.find((atom) => atom.key === "compaction-policy")
      const stop = snapshot.atoms.find((atom) => atom.key === "stop-condition")

      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        product,
        evidenceRef: `conformance:${product}-turn-replay-snapshot`,
        fixtureIDs: expect.arrayContaining(replayKeys.map((key) => `${product}-turn:${key}`)),
        coveredKeys: replayKeys,
        profileFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        knownGaps: expect.arrayContaining(["common-turn-runner-still-executes-profile-strategy"]),
      })
      expect(inputNormalizer).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.input-normalizer$/),
        flowStageID: "input.normalize",
        commonFallbackStrategy: "turn.input-normalizer.text",
        fixtureID: `${product}-turn:input-normalizer`,
        observedFields: expect.arrayContaining(["runtimeContext", "contextVariant"]),
      })
      expect(context).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.context-builder$/),
        flowStageID: "context.build",
        commonFallbackStrategy: "turn.context-builder.transcript",
        fixtureID: `${product}-turn:context-builder`,
        observedFields: expect.arrayContaining(["assistantPartProtocol", "contextVariant"]),
        inferredFields: expect.any(Array),
        lossyFields: expect.arrayContaining(["common-runner-execution"]),
      })
      expect(prompt).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.prompt-assembler$/),
        flowStageID: "prompt.assemble",
        commonFallbackStrategy: "turn.prompt-assembler.common",
        fixtureID: `${product}-turn:prompt-assembler`,
        observedFields: expect.arrayContaining(["requestShape", "runtimeContext"]),
      })
      expect(providerRequest).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.provider-request-builder$/),
        flowStageID: "provider.request",
        commonFallbackStrategy: "turn.provider-request-builder.common",
        fixtureID: `${product}-turn:provider-request-builder`,
        observedFields: expect.arrayContaining(["requestShape", "toolPlanning"]),
      })
      expect(providerStream).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.provider-stream-runner$/),
        flowStageID: "provider.stream",
        commonFallbackStrategy: "turn.provider-stream-runner.common",
        fixtureID: `${product}-turn:provider-stream-runner`,
        observedFields: expect.arrayContaining(["streamProtocol", "retryMode"]),
      })
      expect(stream).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.stream-reducer$/),
        flowStageID: "stream.project",
        commonFallbackStrategy: "turn.stream-reducer.common",
        fixtureID: `${product}-turn:stream-reducer`,
        observedFields: expect.arrayContaining(["streamProtocol", "assistantPartProtocol", "stopReasons"]),
      })
      expect(toolPlanner).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.tool-call-planner$/),
        flowStageID: "tool.plan",
        commonFallbackStrategy: "turn.tool-call-planner.parallel-batch",
        fixtureID: `${product}-turn:tool-call-planner`,
        observedFields: expect.arrayContaining(["toolPlanning", "maxSteps"]),
      })
      expect(toolExecutor).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.tool-executor$/),
        flowStageID: "tool.execute",
        commonFallbackStrategy: "turn.tool-executor.common",
        fixtureID: `${product}-turn:tool-executor`,
        observedFields: expect.arrayContaining(["toolPlanning", "maxToolResultTextChars"]),
      })
      expect(resultRecorder).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.result-recorder$/),
        flowStageID: "session.assistant-write",
        commonFallbackStrategy: "turn.result-recorder.common",
        fixtureID: `${product}-turn:result-recorder`,
        observedFields: expect.arrayContaining(["assistantPartProtocol", "stopReasons"]),
      })
      expect(retry).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.retry-policy$/),
        flowStageID: "loop.boundary",
        commonFallbackStrategy: "turn.retry-policy.fixed",
        fixtureID: `${product}-turn:retry-policy`,
        observedFields: expect.arrayContaining(["retryMode", "requestShape"]),
      })
      expect(continuation).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.continuation-policy$/),
        flowStageID: "loop.boundary",
        commonFallbackStrategy: "turn.continuation-policy.synthetic-continue",
        fixtureID: `${product}-turn:continuation-policy`,
        observedFields: expect.arrayContaining(["syntheticContinue", "maxSyntheticContinues"]),
      })
      expect(compaction).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.compaction-policy$/),
        flowStageID: "loop.boundary",
        commonFallbackStrategy: "turn.compaction-policy.token-threshold",
        fixtureID: `${product}-turn:compaction-policy`,
        observedFields: expect.arrayContaining(["contextVariant"]),
      })
      expect(stop).toMatchObject({
        atomID: expect.stringMatching(/\.turn\.stop-condition$/),
        flowStageID: "loop.boundary",
        commonFallbackStrategy: "turn.stop-condition.no-tool-calls",
        fixtureID: `${product}-turn:stop-condition`,
        observedFields: expect.arrayContaining(["maxSteps", "stopReasons"]),
      })
      expect(snapshot.turnDefaults).toMatchObject({
        assistantPartProtocol: snapshot.profile.assistantPartProtocol,
        maxSteps: snapshot.profile.maxSteps,
      })
      if (product === "nanobot") {
        expect(context?.observedFields).toContain("maxInputTokens")
        expect(snapshot.profile.runtimeContext).toBe("nanobot")
      }
      if (product === "opencode") {
        expect(snapshot.upstreamRef).toBe("github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab")
        expect(snapshot.fixtureIDs).toEqual(expect.arrayContaining(replayKeys.map((key) => `opencode-turn-${key}:native-exact-fixture`)))
        expect(snapshot.atoms.every((atom) => atom.exactDiffStatus === "native-exact" && atom.nativeParityClaim)).toBe(true)
        expect(providerRequest).toMatchObject({
          exactDiffStatus: "native-exact",
          nativeParityClaim: true,
          nativeExactFixtureIDs: ["opencode-turn-provider-request-builder:native-exact-fixture"],
          nativeEvidenceRefs: expect.arrayContaining([
            "conformance:opencode-turn-provider-request-builder-native-exact-fixture",
            "turn-provider-request-builder-native-exact:opencode",
          ]),
        })
        expect(providerStream).toMatchObject({
          exactDiffStatus: "native-exact",
          nativeParityClaim: true,
          nativeExactFixtureIDs: ["opencode-turn-provider-stream-runner:native-exact-fixture"],
        })
        expect(toolExecutor).toMatchObject({
          exactDiffStatus: "native-exact",
          nativeParityClaim: true,
          nativeExactFixtureIDs: ["opencode-turn-tool-executor:native-exact-fixture"],
        })
      } else if (product === "nanobot" || product === "hermes-agent") {
        expect(snapshot.atoms.every((atom) => atom.exactDiffStatus === "native-exact" && atom.nativeParityClaim)).toBe(true)
        expect(snapshot.atoms.every((atom) => atom.nativeExactFixtureIDs.length > 0 && atom.nativeEvidenceRefs.length > 0)).toBe(true)
      } else {
        expect(snapshot.atoms.every((atom) => atom.exactDiffStatus === "exact-diff-partial" && !atom.nativeParityClaim)).toBe(true)
      }
    }
  })

  it("projects OpenCode turn pipeline boundaries into partial replay evidence", () => {
    const projection = projectOpenCodeTurnPipelineBoundary([
      {
        branchID: "input-to-message-v2-context",
        sourceOrder: 1,
        atomKey: "input-normalizer",
        stageID: "input.normalize",
        upstreamAnchor: "packages/opencode/src/session/message-v2.ts:createUserMessage",
        inputMarker: "cli-json-events-input",
        outputMarker: "message-v2-user-part",
        retainedFields: ["messageID", "partKind", "sessionID"],
        lossyFields: ["raw-cli-envelope-object-identity"],
      },
      {
        branchID: "input-to-message-v2-context",
        sourceOrder: 2,
        atomKey: "context-builder",
        stageID: "context.build",
        upstreamAnchor: "packages/opencode/src/session/projectors.ts:session-context",
        inputMarker: "message-v2-user-part",
        outputMarker: "sqlite-session-events:message-v2-context",
        retainedFields: ["contextKey", "messageID", "partKind"],
        lossyFields: ["sqlite-row-object-identity"],
      },
      {
        branchID: "context-to-prompt-assembly",
        sourceOrder: 3,
        atomKey: "prompt-assembler",
        stageID: "prompt.assemble",
        upstreamAnchor: "packages/opencode/src/session/prompt.ts:SystemPrompt",
        inputMarker: "sqlite-session-events:message-v2-context",
        outputMarker: "system-prompt-mode-builder",
        retainedFields: ["mode", "systemPromptHash", "toolNames"],
        lossyFields: ["plugin-transform-execution-identity"],
      },
      {
        branchID: "context-to-prompt-assembly",
        sourceOrder: 4,
        atomKey: "compaction-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/compact.ts:threshold",
        inputMarker: "message-v2-context-window",
        outputMarker: "message-v2-compaction-event",
        retainedFields: ["contextWindow", "keepMessages"],
        lossyFields: ["native-token-counter-drift"],
      },
      {
        branchID: "prompt-to-provider-request",
        sourceOrder: 5,
        atomKey: "provider-request-builder",
        stageID: "provider.request",
        upstreamAnchor: "packages/opencode/src/provider/request.ts:providerOptions",
        inputMarker: "system-prompt-mode-builder",
        outputMarker: "provider-plugin-request-options",
        retainedFields: ["modelID", "providerID", "toolNames"],
        lossyFields: ["provider-request-object-identity"],
      },
      {
        branchID: "prompt-to-provider-request",
        sourceOrder: 6,
        atomKey: "prompt-assembler",
        stageID: "prompt.assemble",
        upstreamAnchor: "packages/opencode/src/session/prompt.ts:providerMessages",
        inputMarker: "message-v2-context",
        outputMarker: "provider-request-messages",
        retainedFields: ["messageCount", "systemPromptHash"],
        lossyFields: ["provider-message-array-identity"],
      },
      {
        branchID: "provider-stream-to-tool-plan",
        sourceOrder: 7,
        atomKey: "provider-stream-runner",
        stageID: "provider.stream",
        upstreamAnchor: "packages/opencode/src/provider/request.ts:stream",
        inputMarker: "provider-plugin-request-options",
        outputMarker: "raw-sse-frame-order",
        retainedFields: ["finishReason", "usageKeys"],
        lossyFields: ["raw-frame-wall-clock-timing"],
      },
      {
        branchID: "provider-stream-to-tool-plan",
        sourceOrder: 8,
        atomKey: "stream-reducer",
        stageID: "stream.project",
        upstreamAnchor: "packages/opencode/src/session/message-v2.ts:assistantParts",
        inputMarker: "raw-sse-frame-order",
        outputMarker: "assistant-part-protocol",
        retainedFields: ["assistantPartKind", "toolCallID"],
        lossyFields: ["raw-provider-chunk-shape"],
      },
      {
        branchID: "provider-stream-to-tool-plan",
        sourceOrder: 9,
        atomKey: "tool-call-planner",
        stageID: "tool.plan",
        upstreamAnchor: "packages/opencode/src/tool/tool.ts:toolCallPlan",
        inputMarker: "assistant-tool-call-parts",
        outputMarker: "permission-tool-scheduler",
        retainedFields: ["toolCallID", "toolName"],
        lossyFields: ["native-tool-priority-order"],
      },
      {
        branchID: "provider-stream-to-tool-plan",
        sourceOrder: 10,
        atomKey: "retry-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/retry.ts:retryPolicy",
        inputMarker: "provider-error-retry",
        outputMarker: "request-boundary-retry",
        retainedFields: ["attempt", "retryable"],
        lossyFields: ["native-backoff-clock"],
      },
      {
        branchID: "tool-result-to-session-write",
        sourceOrder: 11,
        atomKey: "tool-executor",
        stageID: "tool.execute",
        upstreamAnchor: "packages/opencode/src/tool/bash.ts:execute",
        inputMarker: "permission-tool-scheduler",
        outputMarker: "tool-result-render-bridge",
        retainedFields: ["toolCallID", "toolName", "resultPartKind"],
        lossyFields: ["native-permission-and-sandbox-side-effects"],
      },
      {
        branchID: "tool-result-to-session-write",
        sourceOrder: 12,
        atomKey: "result-recorder",
        stageID: "session.assistant-write",
        upstreamAnchor: "packages/opencode/src/session/session.sql.ts:writeAssistant",
        inputMarker: "tool-result-render-bridge",
        outputMarker: "sqlite-session-write",
        retainedFields: ["assistantMessageID", "sessionID", "toolCallID"],
        lossyFields: ["native-session-write-transaction"],
      },
      {
        branchID: "loop-policy-boundary",
        sourceOrder: 13,
        atomKey: "continuation-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:continuePolicy",
        inputMarker: "step-finish-no-synthetic-continue",
        outputMarker: "no-hidden-continuation-message",
        retainedFields: ["finishReason", "syntheticContinue"],
        lossyFields: ["native-continuation-hidden-message-detail"],
      },
      {
        branchID: "loop-policy-boundary",
        sourceOrder: 14,
        atomKey: "stop-condition",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:stopCondition",
        inputMarker: "tool-use-stop",
        outputMarker: "summary_oc_stop_1",
        retainedFields: ["finishReason", "maxSteps", "toolCallCount"],
        lossyFields: ["native-loop-stop-priority"],
      },
    ])
    const verification = verifyOpenCodeTurnPipelineBoundaryProjection(projection)

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(projection).toMatchObject({
      fixtureID: "opencode-turn:pipeline-boundary-projection",
      evidenceRef: "conformance:opencode-turn-pipeline-boundary-projection",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      coveredBranches: [
        "input-to-message-v2-context",
        "context-to-prompt-assembly",
        "prompt-to-provider-request",
        "provider-stream-to-tool-plan",
        "tool-result-to-session-write",
        "loop-policy-boundary",
      ],
      coveredAtomKeys: [
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
      ],
      knownGaps: expect.arrayContaining([
        "opencode-turn-pipeline-boundary-projection-partial-fixture",
        "opencode-full-native-turn-loop-not-replayed",
        "opencode-turn-session-write-readback-not-exact",
      ]),
      lossyFields: expect.arrayContaining([
        "provider-request-object-identity",
        "sqlite-session-write-transaction-readback-not-exact",
        "summary-stop-boundary-timing-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })

    const missingStop = verifyOpenCodeTurnPipelineBoundaryProjection({
      ...projection,
      coveredBranches: projection.coveredBranches.filter((branchID) => branchID !== "loop-policy-boundary"),
      coveredAtomKeys: projection.coveredAtomKeys.filter((key) => key !== "stop-condition"),
    })
    expect(missingStop.ok).toBe(false)
    expect(missingStop.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "opencode-turn-pipeline-boundary.missing-branch", branchID: "loop-policy-boundary" }),
        expect.objectContaining({ id: "opencode-turn-pipeline-boundary.missing-atom", atomKey: "stop-condition" }),
      ]),
    )
  })

  it("projects OpenCode turn identity and readback gaps without claiming native parity", () => {
    const projection = projectOpenCodeTurnIdentityReadbackProjection([
      {
        dimensionID: "message-v2-object",
        sourceOrder: 1,
        atomKey: "input-normalizer",
        stageID: "input.normalize",
        upstreamAnchor: "packages/opencode/src/session/message-v2.ts:createUserMessage",
        nativeObjectMarker: "MessageV2.user.raw-object",
        harnessProjectionMarker: "NormalizedTurnInput.user-text",
        retainedKeys: ["messageID", "partID", "role"],
        readbackMarkers: ["message-v2-user-part:pre-write"],
        lossyFields: ["raw-message-v2-object-identity"],
      },
      {
        dimensionID: "message-v2-object",
        sourceOrder: 2,
        atomKey: "stream-reducer",
        stageID: "stream.project",
        upstreamAnchor: "packages/opencode/src/session/message-v2.ts:assistantParts",
        nativeObjectMarker: "MessageV2.assistant.part-array",
        harnessProjectionMarker: "assistant-part-protocol",
        retainedKeys: ["partKind", "toolCallID"],
        readbackMarkers: ["assistant-part-stream:before-session-write"],
        lossyFields: ["assistant-part-array-object-identity"],
      },
      {
        dimensionID: "context-readback",
        sourceOrder: 3,
        atomKey: "context-builder",
        stageID: "context.build",
        upstreamAnchor: "packages/opencode/src/session/projectors.ts:session-context",
        nativeObjectMarker: "sqlite-session-row.message-v2-context",
        harnessProjectionMarker: "turn.context-builder.transcript",
        retainedKeys: ["contextKey", "sessionID"],
        readbackMarkers: ["sqlite-session-read:branch-main", "message-v2-context-window"],
        lossyFields: ["sqlite-row-object-identity"],
      },
      {
        dimensionID: "context-readback",
        sourceOrder: 4,
        atomKey: "compaction-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/compact.ts:compaction-event",
        nativeObjectMarker: "message-v2.compaction-event",
        harnessProjectionMarker: "turn.compaction-policy.token-threshold",
        retainedKeys: ["contextWindow", "keepMessages"],
        readbackMarkers: ["sqlite-session-read:compaction-cursor"],
        lossyFields: ["native-token-counter-object-state"],
      },
      {
        dimensionID: "provider-request-object",
        sourceOrder: 5,
        atomKey: "prompt-assembler",
        stageID: "prompt.assemble",
        upstreamAnchor: "packages/opencode/src/session/prompt.ts:providerMessages",
        nativeObjectMarker: "provider-message-array",
        harnessProjectionMarker: "prompt.assemble.messages",
        retainedKeys: ["messageCount", "systemPromptHash"],
        readbackMarkers: ["provider-request-message-array:pre-flight"],
        lossyFields: ["provider-message-array-identity"],
      },
      {
        dimensionID: "provider-request-object",
        sourceOrder: 6,
        atomKey: "provider-request-builder",
        stageID: "provider.request",
        upstreamAnchor: "packages/opencode/src/provider/request.ts:providerOptions",
        nativeObjectMarker: "ProviderRequest.options.raw-object",
        harnessProjectionMarker: "provider.request.options",
        retainedKeys: ["modelID", "providerID", "toolNames"],
        readbackMarkers: ["provider-request-before-hook:request-object"],
        lossyFields: ["provider-request-object-identity"],
      },
      {
        dimensionID: "provider-request-object",
        sourceOrder: 7,
        atomKey: "provider-stream-runner",
        stageID: "provider.stream",
        upstreamAnchor: "packages/opencode/src/provider/request.ts:stream",
        nativeObjectMarker: "provider-stream.reader",
        harnessProjectionMarker: "provider-stream-runner.common",
        retainedKeys: ["finishReason", "usageKeys"],
        readbackMarkers: ["provider-stream:raw-frame-order"],
        lossyFields: ["provider-stream-reader-object-identity"],
      },
      {
        dimensionID: "provider-request-object",
        sourceOrder: 8,
        atomKey: "retry-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/retry.ts:retryPolicy",
        nativeObjectMarker: "retry-delay-timer",
        harnessProjectionMarker: "turn.retry-policy.fixed",
        retainedKeys: ["attempt", "retryable"],
        readbackMarkers: ["retry-request-boundary:request-settled"],
        lossyFields: ["native-retry-timer-object-identity"],
      },
      {
        dimensionID: "tool-side-effect",
        sourceOrder: 9,
        atomKey: "tool-call-planner",
        stageID: "tool.plan",
        upstreamAnchor: "packages/opencode/src/tool/tool.ts:toolCallPlan",
        nativeObjectMarker: "tool-call-plan.permission-subject",
        harnessProjectionMarker: "turn.tool-call-planner.parallel-batch",
        retainedKeys: ["toolCallID", "toolName"],
        readbackMarkers: ["permission-tool-scheduler:planned"],
        lossyFields: ["native-tool-priority-object-state"],
      },
      {
        dimensionID: "tool-side-effect",
        sourceOrder: 10,
        atomKey: "tool-executor",
        stageID: "tool.execute",
        upstreamAnchor: "packages/opencode/src/tool/bash.ts:execute",
        nativeObjectMarker: "tool-execution.sandbox-side-effects",
        harnessProjectionMarker: "turn.tool-executor.common",
        retainedKeys: ["resultPartKind", "toolCallID", "toolName"],
        readbackMarkers: ["tool-result-render-bridge:post-execute"],
        lossyFields: ["native-permission-and-sandbox-side-effects"],
      },
      {
        dimensionID: "tool-side-effect",
        sourceOrder: 11,
        atomKey: "result-recorder",
        stageID: "session.assistant-write",
        upstreamAnchor: "packages/opencode/src/session/session.sql.ts:writeAssistant",
        nativeObjectMarker: "tool-result.session-write-side-effect",
        harnessProjectionMarker: "turn.result-recorder.common",
        retainedKeys: ["assistantMessageID", "toolCallID"],
        readbackMarkers: ["sqlite-session-write:tool-result-part"],
        lossyFields: ["tool-result-record-id-object-identity"],
      },
      {
        dimensionID: "session-write-readback",
        sourceOrder: 12,
        atomKey: "result-recorder",
        stageID: "session.assistant-write",
        upstreamAnchor: "packages/opencode/src/session/session.sql.ts:transaction",
        nativeObjectMarker: "sqlite-transaction.assistant-write",
        harnessProjectionMarker: "session.assistant-write",
        retainedKeys: ["assistantMessageID", "sessionID"],
        readbackMarkers: ["sqlite-session-write:assistant", "sqlite-session-read:assistant"],
        lossyFields: ["sqlite-session-write-transaction-readback"],
      },
      {
        dimensionID: "summary-stop-object",
        sourceOrder: 13,
        atomKey: "continuation-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:continuePolicy",
        nativeObjectMarker: "hidden-continuation-message",
        harnessProjectionMarker: "turn.continuation-policy.none",
        retainedKeys: ["finishReason", "syntheticContinue"],
        readbackMarkers: ["no-hidden-continuation-message:checked"],
        lossyFields: ["hidden-continuation-message-object-identity"],
      },
      {
        dimensionID: "summary-stop-object",
        sourceOrder: 14,
        atomKey: "stop-condition",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:stopCondition",
        nativeObjectMarker: "summary-stop.decision-object",
        harnessProjectionMarker: "turn.stop-condition.no-tool-calls",
        retainedKeys: ["finishReason", "maxSteps", "toolCallCount"],
        readbackMarkers: ["summary-stop:assistant-readback"],
        lossyFields: ["summary-stop-wall-clock-order"],
      },
    ])
    const verification = verifyOpenCodeTurnIdentityReadbackProjection(projection)

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(projection).toMatchObject({
      fixtureID: "opencode-turn:identity-readback-projection",
      evidenceRef: "conformance:opencode-turn-identity-readback-projection",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      coveredDimensions: [
        "message-v2-object",
        "context-readback",
        "provider-request-object",
        "tool-side-effect",
        "session-write-readback",
        "summary-stop-object",
      ],
      coveredAtomKeys: [
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
      ],
      knownGaps: expect.arrayContaining([
        "opencode-turn-identity-readback-projection-partial-fixture",
        "opencode-full-native-turn-loop-not-replayed",
        "opencode-turn-session-write-readback-not-exact",
        "opencode-turn-summary-stop-object-identity-not-exact",
      ]),
      readbackMarkers: expect.arrayContaining(["sqlite-session-read:assistant", "provider-request-before-hook:request-object"]),
      lossyFields: expect.arrayContaining([
        "provider-request-object-identity",
        "session-write-transaction-readback-not-exact",
        "summary-stop-hidden-message-object-identity-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })

    const missingReadback = verifyOpenCodeTurnIdentityReadbackProjection({
      ...projection,
      coveredDimensions: projection.coveredDimensions.filter((dimensionID) => dimensionID !== "session-write-readback"),
      coveredAtomKeys: projection.coveredAtomKeys.filter((key) => key !== "result-recorder"),
      readbackMarkers: [],
    })
    expect(missingReadback.ok).toBe(false)
    expect(missingReadback.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "opencode-turn-identity-readback.missing-dimension", dimensionID: "session-write-readback" }),
        expect.objectContaining({ id: "opencode-turn-identity-readback.missing-atom", atomKey: "result-recorder" }),
        expect.objectContaining({ id: "opencode-turn-identity-readback.readback-marker" }),
      ]),
    )
  })

  it("projects OpenCode turn loop-control decisions without claiming native timing parity", () => {
    const projection = projectOpenCodeTurnLoopControlProjection([
      {
        dimensionID: "run-input-seed",
        sourceOrder: 1,
        atomKey: "input-normalizer",
        stageID: "input.normalize",
        upstreamAnchor: "packages/opencode/src/session/session.ts:runTurn.input",
        controlSignal: "run-turn-start:user-message",
        decisionMarker: "seed-message-v2-context-window",
        retainedKeys: ["messageID", "sessionID", "sourceOrder"],
        timingMarkers: ["loop-start-before-context-readback"],
        lossyFields: ["run-turn-start-wall-clock-timing"],
      },
      {
        dimensionID: "run-input-seed",
        sourceOrder: 2,
        atomKey: "context-builder",
        stageID: "context.build",
        upstreamAnchor: "packages/opencode/src/session/projectors.ts:session-context",
        controlSignal: "context-readback:active-branch",
        decisionMarker: "context-window-selected-for-step-1",
        retainedKeys: ["contextKey", "branchID"],
        timingMarkers: ["readback-before-provider-request"],
        lossyFields: ["sqlite-context-readback-transaction-order"],
      },
      {
        dimensionID: "provider-finish-routing",
        sourceOrder: 3,
        atomKey: "provider-request-builder",
        stageID: "provider.request",
        upstreamAnchor: "packages/opencode/src/session/llm/request.ts:providerRequest",
        controlSignal: "provider-request-issued",
        decisionMarker: "request-boundary-open",
        retainedKeys: ["providerID", "modelID", "toolNames"],
        timingMarkers: ["request-boundary-before-provider-stream"],
        lossyFields: ["provider-request-object-identity"],
      },
      {
        dimensionID: "provider-finish-routing",
        sourceOrder: 4,
        atomKey: "provider-stream-runner",
        stageID: "provider.stream",
        upstreamAnchor: "packages/opencode/src/session/retry.ts:providerFinish",
        controlSignal: "finish:tool_calls",
        decisionMarker: "retry-policy-consumes-finish-reason",
        retainedKeys: ["finishReason", "usageKeys"],
        timingMarkers: ["provider-finish-before-retry-decision"],
        lossyFields: ["provider-finish-event-object-identity"],
      },
      {
        dimensionID: "provider-finish-routing",
        sourceOrder: 5,
        atomKey: "stream-reducer",
        stageID: "stream.project",
        upstreamAnchor: "packages/opencode/src/session/message-v2.ts:assistantParts",
        controlSignal: "assistant-parts-projected",
        decisionMarker: "tool-plan-eligible",
        retainedKeys: ["assistantPartKind", "toolCallID"],
        timingMarkers: ["stream-reducer-before-tool-plan"],
        lossyFields: ["raw-provider-chunk-order-wall-clock"],
      },
      {
        dimensionID: "provider-finish-routing",
        sourceOrder: 6,
        atomKey: "retry-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/retry.ts:retryPolicy",
        controlSignal: "retryable-provider-error",
        decisionMarker: "retry-delay-scheduled",
        retainedKeys: ["attempt", "retryable", "delayBucket"],
        timingMarkers: ["retry-delay-wall-clock-bucket"],
        lossyFields: ["native-retry-timer-object-identity"],
      },
      {
        dimensionID: "tool-result-loopback",
        sourceOrder: 7,
        atomKey: "tool-call-planner",
        stageID: "tool.plan",
        upstreamAnchor: "packages/opencode/src/tool/tool.ts:toolCallPlan",
        controlSignal: "tool-call-parts-ready",
        decisionMarker: "permission-and-scheduler-selected",
        retainedKeys: ["toolCallID", "toolName"],
        timingMarkers: ["tool-plan-before-execution"],
        lossyFields: ["native-tool-scheduler-priority-order"],
      },
      {
        dimensionID: "tool-result-loopback",
        sourceOrder: 8,
        atomKey: "tool-executor",
        stageID: "tool.execute",
        upstreamAnchor: "packages/opencode/src/tool/bash.ts:execute",
        controlSignal: "tool-result-produced",
        decisionMarker: "result-recorder-eligible",
        retainedKeys: ["resultPartKind", "toolCallID", "toolName"],
        timingMarkers: ["tool-execute-before-session-write"],
        lossyFields: ["native-tool-permission-sandbox-side-effects"],
      },
      {
        dimensionID: "tool-result-loopback",
        sourceOrder: 9,
        atomKey: "result-recorder",
        stageID: "session.assistant-write",
        upstreamAnchor: "packages/opencode/src/session/session.sql.ts:writeAssistant",
        controlSignal: "assistant-write-complete",
        decisionMarker: "loopback-context-readback-needed",
        retainedKeys: ["assistantMessageID", "sessionID"],
        timingMarkers: ["session-write-before-next-loop-readback"],
        lossyFields: ["sqlite-writeback-transaction-object-identity"],
      },
      {
        dimensionID: "tool-result-loopback",
        sourceOrder: 10,
        atomKey: "continuation-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:continuePolicy",
        controlSignal: "tool-result-finish:continue-or-stop",
        decisionMarker: "continuation-not-hidden-message",
        retainedKeys: ["finishReason", "syntheticContinue"],
        timingMarkers: ["continuation-decision-after-tool-result"],
        lossyFields: ["hidden-continuation-message-object-identity"],
      },
      {
        dimensionID: "context-compaction-gate",
        sourceOrder: 11,
        atomKey: "context-builder",
        stageID: "context.build",
        upstreamAnchor: "packages/opencode/src/session/compact.ts:contextWindow",
        controlSignal: "context-window-size-check",
        decisionMarker: "compaction-policy-evaluated",
        retainedKeys: ["contextWindow", "maxInputTokens"],
        timingMarkers: ["context-readback-before-compaction-check"],
        lossyFields: ["native-token-counter-object-state"],
      },
      {
        dimensionID: "context-compaction-gate",
        sourceOrder: 12,
        atomKey: "prompt-assembler",
        stageID: "prompt.assemble",
        upstreamAnchor: "packages/opencode/src/session/prompt.ts:SystemPrompt",
        controlSignal: "prompt-after-compaction-check",
        decisionMarker: "provider-context-window-ready",
        retainedKeys: ["systemPromptHash", "messageCount"],
        timingMarkers: ["compaction-decision-before-prompt-assembly"],
        lossyFields: ["prompt-message-array-object-identity"],
      },
      {
        dimensionID: "context-compaction-gate",
        sourceOrder: 13,
        atomKey: "compaction-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/compact.ts:compact",
        controlSignal: "compaction-threshold-crossed",
        decisionMarker: "summary-compaction-write-scheduled",
        retainedKeys: ["contextWindow", "keepMessages"],
        timingMarkers: ["compaction-trigger-wall-clock-order"],
        lossyFields: ["compaction-summary-write-readback"],
      },
      {
        dimensionID: "continuation-stop-gate",
        sourceOrder: 14,
        atomKey: "result-recorder",
        stageID: "session.assistant-write",
        upstreamAnchor: "packages/opencode/src/session/session.sql.ts:assistantWrite",
        controlSignal: "assistant-write-finished",
        decisionMarker: "stop-condition-can-read-summary",
        retainedKeys: ["assistantMessageID", "finishReason"],
        timingMarkers: ["assistant-write-before-stop-evaluation"],
        lossyFields: ["assistant-write-readback-order"],
      },
      {
        dimensionID: "continuation-stop-gate",
        sourceOrder: 15,
        atomKey: "continuation-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:continuePolicy",
        controlSignal: "finish:length",
        decisionMarker: "synthetic-continue-eligible",
        retainedKeys: ["finishReason", "syntheticContinue"],
        timingMarkers: ["continuation-decision-before-stop-priority"],
        lossyFields: ["synthetic-continuation-hidden-message-order"],
      },
      {
        dimensionID: "continuation-stop-gate",
        sourceOrder: 16,
        atomKey: "stop-condition",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:stopCondition",
        controlSignal: "finish:stop-or-max_steps",
        decisionMarker: "stop-priority-selected",
        retainedKeys: ["finishReason", "maxSteps", "toolCallCount"],
        timingMarkers: ["stop-condition-wall-clock-priority"],
        lossyFields: ["native-stop-condition-decision-object-identity"],
      },
      {
        dimensionID: "session-readback-next-step",
        sourceOrder: 17,
        atomKey: "context-builder",
        stageID: "context.build",
        upstreamAnchor: "packages/opencode/src/session/projectors-next.ts:readAfterWrite",
        controlSignal: "next-step-context-readback",
        decisionMarker: "loop-step-2-context-window",
        retainedKeys: ["contextKey", "sessionID"],
        timingMarkers: ["readback-after-assistant-write"],
        lossyFields: ["sqlite-read-after-write-transaction-order"],
      },
      {
        dimensionID: "session-readback-next-step",
        sourceOrder: 18,
        atomKey: "compaction-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/compact.ts:postWriteReadback",
        controlSignal: "compaction-readback-after-write",
        decisionMarker: "no-stale-context-window",
        retainedKeys: ["contextWindow", "summaryID"],
        timingMarkers: ["compaction-readback-next-step"],
        lossyFields: ["compaction-readback-cursor-object-identity"],
      },
      {
        dimensionID: "session-readback-next-step",
        sourceOrder: 19,
        atomKey: "stop-condition",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:maxStepGuard",
        controlSignal: "max-step-guard",
        decisionMarker: "stop-before-provider-request",
        retainedKeys: ["maxSteps", "stepIndex"],
        timingMarkers: ["max-step-stop-before-next-provider-request"],
        lossyFields: ["max-step-wall-clock-order"],
      },
    ])
    const verification = verifyOpenCodeTurnLoopControlProjection(projection)

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(projection).toMatchObject({
      fixtureID: "opencode-turn:loop-control-projection",
      evidenceRef: "conformance:opencode-turn-loop-control-projection",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      coveredDimensions: [
        "run-input-seed",
        "provider-finish-routing",
        "tool-result-loopback",
        "context-compaction-gate",
        "continuation-stop-gate",
        "session-readback-next-step",
      ],
      coveredAtomKeys: [
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
      ],
      knownGaps: expect.arrayContaining([
        "opencode-turn-loop-control-projection-partial-fixture",
        "opencode-full-native-turn-loop-not-replayed",
        "opencode-turn-retry-continuation-stop-decision-not-exact",
        "opencode-turn-session-readback-next-step-not-exact",
      ]),
      timingMarkers: expect.arrayContaining([
        "retry-delay-wall-clock-bucket",
        "continuation-decision-before-stop-priority",
        "max-step-stop-before-next-provider-request",
      ]),
      lossyFields: expect.arrayContaining([
        "native-loop-control-wall-clock-timing-not-exact",
        "continuation-stop-decision-order-not-exact",
        "session-readback-next-step-transaction-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })

    const missingStopGate = verifyOpenCodeTurnLoopControlProjection({
      ...projection,
      coveredDimensions: projection.coveredDimensions.filter((dimensionID) => dimensionID !== "continuation-stop-gate"),
      coveredAtomKeys: projection.coveredAtomKeys.filter((key) => key !== "stop-condition"),
      timingMarkers: [],
    })
    expect(missingStopGate.ok).toBe(false)
    expect(missingStopGate.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "opencode-turn-loop-control.missing-dimension", dimensionID: "continuation-stop-gate" }),
        expect.objectContaining({ id: "opencode-turn-loop-control.missing-atom", atomKey: "stop-condition" }),
        expect.objectContaining({ id: "opencode-turn-loop-control.timing-marker" }),
      ]),
    )
  })

  it("projects OpenCode turn side-effect timeline without claiming native side-effect parity", () => {
    const projection = projectOpenCodeTurnSideEffectTimelineProjection([
      {
        dimensionID: "message-context-side-effect",
        sourceOrder: 1,
        atomKey: "input-normalizer",
        stageID: "input.normalize",
        upstreamAnchor: "packages/opencode/src/session/message-v2.ts:createUserMessage",
        sideEffectSignal: "user-message-v2-created",
        harnessProjectionMarker: "normalized-input-to-message-v2",
        retainedKeys: ["messageID", "partKind", "sessionID"],
        orderMarkers: ["message-context-before-provider-request"],
        lossyFields: ["native-message-object-allocation-order"],
      },
      {
        dimensionID: "message-context-side-effect",
        sourceOrder: 2,
        atomKey: "context-builder",
        stageID: "context.build",
        upstreamAnchor: "packages/opencode/src/session/projectors.ts:messageContext",
        sideEffectSignal: "context-window-read",
        harnessProjectionMarker: "session-context-projection-read",
        retainedKeys: ["contextKey", "branchID"],
        orderMarkers: ["context-readback-before-prompt"],
        lossyFields: ["sqlite-context-readback-side-effect"],
      },
      {
        dimensionID: "message-context-side-effect",
        sourceOrder: 3,
        atomKey: "prompt-assembler",
        stageID: "prompt.assemble",
        upstreamAnchor: "packages/opencode/src/session/prompt.ts:SystemPrompt",
        sideEffectSignal: "system-prompt-materialized",
        harnessProjectionMarker: "prompt-segment-array",
        retainedKeys: ["systemPromptHash", "toolNames"],
        orderMarkers: ["prompt-assembly-before-provider-request"],
        lossyFields: ["plugin-transform-side-effect-order"],
      },
      {
        dimensionID: "provider-stream-side-effect",
        sourceOrder: 4,
        atomKey: "provider-request-builder",
        stageID: "provider.request",
        upstreamAnchor: "packages/opencode/src/session/llm/request.ts:providerOptions",
        sideEffectSignal: "provider-request-options-built",
        harnessProjectionMarker: "provider-request-envelope",
        retainedKeys: ["providerID", "modelID", "toolNames"],
        orderMarkers: ["provider-request-before-stream-open"],
        lossyFields: ["provider-request-object-identity"],
      },
      {
        dimensionID: "provider-stream-side-effect",
        sourceOrder: 5,
        atomKey: "provider-stream-runner",
        stageID: "provider.stream",
        upstreamAnchor: "packages/opencode/src/provider/provider.ts:stream",
        sideEffectSignal: "provider-stream-opened",
        harnessProjectionMarker: "sse-frame-sequence",
        retainedKeys: ["frameKind", "providerID"],
        orderMarkers: ["provider-stream-before-reducer"],
        lossyFields: ["provider-stream-wall-clock-frame-order"],
      },
      {
        dimensionID: "provider-stream-side-effect",
        sourceOrder: 6,
        atomKey: "stream-reducer",
        stageID: "stream.project",
        upstreamAnchor: "packages/opencode/src/session/message-v2.ts:assistantParts",
        sideEffectSignal: "assistant-parts-projected",
        harnessProjectionMarker: "assistant-part-protocol",
        retainedKeys: ["assistantPartKind", "toolCallID"],
        orderMarkers: ["stream-reducer-before-tool-plan"],
        lossyFields: ["raw-provider-chunk-object-identity"],
      },
      {
        dimensionID: "provider-stream-side-effect",
        sourceOrder: 7,
        atomKey: "retry-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/retry.ts:retry",
        sideEffectSignal: "retry-timer-scheduled",
        harnessProjectionMarker: "retry-delay-bucket",
        retainedKeys: ["attempt", "retryable"],
        orderMarkers: ["retry-side-effect-before-next-request"],
        lossyFields: ["native-retry-timer-side-effect"],
      },
      {
        dimensionID: "tool-execution-side-effect",
        sourceOrder: 8,
        atomKey: "tool-call-planner",
        stageID: "tool.plan",
        upstreamAnchor: "packages/opencode/src/tool/tool.ts:toolCallPlan",
        sideEffectSignal: "permission-request-created",
        harnessProjectionMarker: "permission-tool-scheduler",
        retainedKeys: ["toolCallID", "toolName"],
        orderMarkers: ["tool-plan-before-permission-side-effect"],
        lossyFields: ["native-tool-scheduler-side-effect-order"],
      },
      {
        dimensionID: "tool-execution-side-effect",
        sourceOrder: 9,
        atomKey: "tool-executor",
        stageID: "tool.execute",
        upstreamAnchor: "packages/opencode/src/tool/bash.ts:execute",
        sideEffectSignal: "tool-process-executed",
        harnessProjectionMarker: "tool-result-render-bridge",
        retainedKeys: ["toolCallID", "exitCode", "resultPartKind"],
        orderMarkers: ["tool-execution-before-session-write"],
        lossyFields: ["native-process-and-filesystem-side-effects"],
      },
      {
        dimensionID: "tool-execution-side-effect",
        sourceOrder: 10,
        atomKey: "result-recorder",
        stageID: "session.assistant-write",
        upstreamAnchor: "packages/opencode/src/session/session.sql.ts:writeToolResult",
        sideEffectSignal: "tool-result-written",
        harnessProjectionMarker: "assistant-tool-result-part",
        retainedKeys: ["assistantMessageID", "toolCallID"],
        orderMarkers: ["tool-result-write-before-syncevent-dispatch"],
        lossyFields: ["tool-result-part-object-identity"],
      },
      {
        dimensionID: "session-writeback-side-effect",
        sourceOrder: 11,
        atomKey: "result-recorder",
        stageID: "session.assistant-write",
        upstreamAnchor: "packages/opencode/src/session/session.sql.ts:writeAssistant",
        sideEffectSignal: "assistant-message-transaction-committed",
        harnessProjectionMarker: "sqlite-writeback-record",
        retainedKeys: ["assistantMessageID", "sessionID", "transactionMarker"],
        orderMarkers: ["session-write-before-readback"],
        lossyFields: ["sqlite-transaction-fsync-order"],
      },
      {
        dimensionID: "session-writeback-side-effect",
        sourceOrder: 12,
        atomKey: "context-builder",
        stageID: "context.build",
        upstreamAnchor: "packages/opencode/src/session/projectors-next.ts:readAfterWrite",
        sideEffectSignal: "session-readback-after-write",
        harnessProjectionMarker: "readback-context-window",
        retainedKeys: ["contextKey", "readbackCursor"],
        orderMarkers: ["session-readback-before-next-provider-request"],
        lossyFields: ["read-after-write-transaction-object-identity"],
      },
      {
        dimensionID: "compaction-readback-side-effect",
        sourceOrder: 13,
        atomKey: "compaction-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/compact.ts:writeSummary",
        sideEffectSignal: "compaction-summary-write",
        harnessProjectionMarker: "compaction-summary-record",
        retainedKeys: ["summaryID", "contextWindow"],
        orderMarkers: ["compaction-write-before-continuation-check"],
        lossyFields: ["summary-compaction-write-side-effect-order"],
      },
      {
        dimensionID: "compaction-readback-side-effect",
        sourceOrder: 14,
        atomKey: "continuation-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:continuePolicy",
        sideEffectSignal: "continuation-readback-after-compaction",
        harnessProjectionMarker: "continuation-policy-projection",
        retainedKeys: ["finishReason", "syntheticContinue"],
        orderMarkers: ["compaction-readback-before-continuation"],
        lossyFields: ["continuation-readback-side-effect-order"],
      },
      {
        dimensionID: "summary-cleanup-side-effect",
        sourceOrder: 15,
        atomKey: "stop-condition",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:stopCondition",
        sideEffectSignal: "summary-stop-cleanup",
        harnessProjectionMarker: "stop-condition-projection",
        retainedKeys: ["finishReason", "maxSteps"],
        orderMarkers: ["summary-cleanup-after-stop"],
        lossyFields: ["summary-cleanup-side-effect-order"],
      },
    ])
    const verification = verifyOpenCodeTurnSideEffectTimelineProjection(projection)

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(projection).toMatchObject({
      fixtureID: "opencode-turn:side-effect-timeline-projection",
      evidenceRef: "conformance:opencode-turn-side-effect-timeline-projection",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      coveredDimensions: [
        "message-context-side-effect",
        "provider-stream-side-effect",
        "tool-execution-side-effect",
        "session-writeback-side-effect",
        "compaction-readback-side-effect",
        "summary-cleanup-side-effect",
      ],
      coveredAtomKeys: [
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
      ],
      knownGaps: expect.arrayContaining([
        "opencode-turn-side-effect-timeline-projection-partial-fixture",
        "opencode-full-native-turn-loop-not-replayed",
        "opencode-provider-stream-side-effects-not-exact",
        "opencode-session-writeback-side-effects-not-exact",
        "opencode-summary-cleanup-side-effects-not-exact",
      ]),
      orderMarkers: expect.arrayContaining([
        "provider-stream-before-reducer",
        "tool-result-write-before-syncevent-dispatch",
        "session-readback-before-next-provider-request",
        "summary-cleanup-after-stop",
      ]),
      lossyFields: expect.arrayContaining([
        "provider-stream-event-side-effect-timing-not-exact",
        "tool-permission-execution-side-effects-not-exact",
        "session-writeback-readback-transaction-not-exact",
        "syncevent-dispatch-async-interleaving-not-exact",
        "summary-stop-cleanup-side-effect-order-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })

    const missingCleanup = verifyOpenCodeTurnSideEffectTimelineProjection({
      ...projection,
      coveredDimensions: projection.coveredDimensions.filter((dimensionID) => dimensionID !== "summary-cleanup-side-effect"),
      coveredAtomKeys: projection.coveredAtomKeys.filter((key) => key !== "stop-condition"),
      orderMarkers: [],
    })
    expect(missingCleanup.ok).toBe(false)
    expect(missingCleanup.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "opencode-turn-side-effect-timeline.missing-dimension", dimensionID: "summary-cleanup-side-effect" }),
        expect.objectContaining({ id: "opencode-turn-side-effect-timeline.missing-atom", atomKey: "stop-condition" }),
        expect.objectContaining({ id: "opencode-turn-side-effect-timeline.order-marker" }),
      ]),
    )
  })

  it("projects OpenCode turn provider-step replay gaps without claiming native stream parity", () => {
    const projection = projectOpenCodeTurnProviderStepProjection([
      {
        dimensionID: "provider-request-shape",
        sourceOrder: 1,
        atomKey: "provider-request-builder",
        stageID: "provider.request",
        upstreamAnchor: "packages/opencode/src/session/llm/request.ts:providerRequest",
        providerSignal: "ProviderRequest.messages/options",
        harnessProjectionMarker: "turn.provider-request-builder.common request-shape projection",
        retainedKeys: ["messages", "model", "system", "tools", "options", "providerMetadata"],
        timingMarkers: ["provider request created after prompt assembly before stream start"],
        lossyFields: ["provider-request-payload-object-identity-not-exact"],
      },
      {
        dimensionID: "provider-stream-frame",
        sourceOrder: 2,
        atomKey: "provider-stream-runner",
        stageID: "provider.stream",
        upstreamAnchor: "packages/opencode/src/provider/provider.ts:stream",
        providerSignal: "raw-provider-frame",
        harnessProjectionMarker: "provider stream event projector",
        retainedKeys: ["frameType", "providerEventType", "sequence", "finishReason"],
        timingMarkers: ["provider stream frame arrival wall-clock order"],
        lossyFields: ["provider-stream-frame-wall-clock-timing-not-exact"],
      },
      {
        dimensionID: "stream-reducer-delta",
        sourceOrder: 3,
        atomKey: "stream-reducer",
        stageID: "stream.project",
        upstreamAnchor: "packages/opencode/src/session/message-v2.ts:assistantParts",
        providerSignal: "assistant-delta/tool-call-delta",
        harnessProjectionMarker: "stream.reducer.common delta projection",
        retainedKeys: ["deltaType", "messagePart", "toolCallID", "sequence"],
        timingMarkers: ["stream reducer delta projection order"],
        lossyFields: ["stream-reducer-delta-object-identity-not-exact"],
      },
      {
        dimensionID: "retry-continuation-decision",
        sourceOrder: 4,
        atomKey: "retry-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/retry.ts:retryProviderStep",
        providerSignal: "retry-after-provider-error",
        harnessProjectionMarker: "turn.retry-policy.fixed provider retry projection",
        retainedKeys: ["attempt", "retryable", "delayBucket", "errorClass"],
        timingMarkers: ["retry decision after provider stream finish/error"],
        lossyFields: ["retry-continuation-decision-order-not-exact"],
      },
      {
        dimensionID: "retry-continuation-decision",
        sourceOrder: 5,
        atomKey: "continuation-policy",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:continuePolicy",
        providerSignal: "synthetic-continue-after-finish",
        harnessProjectionMarker: "turn.continuation-policy.none provider finish projection",
        retainedKeys: ["finishReason", "syntheticContinue", "maxSyntheticContinues"],
        timingMarkers: ["continuation decision after provider finish before stop"],
        lossyFields: ["provider-finish-continuation-decision-object-identity"],
      },
      {
        dimensionID: "cancellation-cleanup-boundary",
        sourceOrder: 6,
        atomKey: "provider-stream-runner",
        stageID: "provider.stream",
        upstreamAnchor: "packages/opencode/src/provider/provider.ts:abortSignal",
        providerSignal: "provider-stream-abort",
        harnessProjectionMarker: "provider stream cancellation cleanup projection",
        retainedKeys: ["abortSignal", "streamID", "providerID"],
        timingMarkers: ["cancel abort cleanup while provider stream is open"],
        lossyFields: ["provider-cancel-cleanup-race-not-exact"],
      },
      {
        dimensionID: "cancellation-cleanup-boundary",
        sourceOrder: 7,
        atomKey: "stop-condition",
        stageID: "loop.boundary",
        upstreamAnchor: "packages/opencode/src/session/session.ts:stopConditionAfterProvider",
        providerSignal: "provider-step-stop-cleanup",
        harnessProjectionMarker: "turn.stop-condition.no-tool-calls provider cleanup projection",
        retainedKeys: ["finishReason", "maxSteps", "toolCallCount"],
        timingMarkers: ["provider cleanup before stop condition finalization"],
        lossyFields: ["provider-stop-cleanup-object-identity"],
      },
    ])
    const verification = verifyOpenCodeTurnProviderStepProjection(projection)

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(projection).toMatchObject({
      fixtureID: "opencode-turn:provider-step-projection",
      evidenceRef: "conformance:opencode-turn-provider-step-projection",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      coveredDimensions: [
        "provider-request-shape",
        "provider-stream-frame",
        "stream-reducer-delta",
        "retry-continuation-decision",
        "cancellation-cleanup-boundary",
      ],
      coveredAtomKeys: [
        "provider-request-builder",
        "provider-stream-runner",
        "stream-reducer",
        "retry-policy",
        "continuation-policy",
        "stop-condition",
      ],
      knownGaps: expect.arrayContaining([
        "opencode-turn-provider-step-projection-partial-fixture",
        "opencode-full-native-turn-loop-not-replayed",
        "opencode-turn-provider-request-payload-not-exact",
        "opencode-turn-provider-stream-frame-timing-not-exact",
        "opencode-turn-stream-reducer-delta-not-exact",
        "opencode-turn-retry-continuation-decision-not-exact",
        "opencode-turn-provider-cancel-cleanup-not-exact",
      ]),
      retainedKeys: expect.arrayContaining([
        "providerSignal",
        "harnessProjectionMarker",
        "messages",
        "frameType",
        "deltaType",
        "abortSignal",
      ]),
      timingMarkers: expect.arrayContaining([
        "provider request created after prompt assembly before stream start",
        "provider stream frame arrival wall-clock order",
        "retry decision after provider stream finish/error",
        "cancel abort cleanup while provider stream is open",
      ]),
      lossyFields: expect.arrayContaining([
        "provider-request-payload-object-identity-not-exact",
        "provider-stream-frame-wall-clock-timing-not-exact",
        "stream-reducer-delta-object-identity-not-exact",
        "retry-continuation-decision-order-not-exact",
        "provider-cancel-cleanup-race-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })

    const missingCleanup = verifyOpenCodeTurnProviderStepProjection({
      ...projection,
      coveredDimensions: projection.coveredDimensions.filter((dimensionID) => dimensionID !== "cancellation-cleanup-boundary"),
      coveredAtomKeys: projection.coveredAtomKeys.filter((key) => key !== "stop-condition"),
      timingMarkers: [],
    })
    expect(missingCleanup.ok).toBe(false)
    expect(missingCleanup.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "opencode-turn-provider-step.missing-dimension", dimensionID: "cancellation-cleanup-boundary" }),
        expect.objectContaining({ id: "opencode-turn-provider-step.missing-atom", atomKey: "stop-condition" }),
        expect.objectContaining({ id: "opencode-turn-provider-step.timing-marker" }),
      ]),
    )
  })

  it("records turn native-loop replay positive and negative gates", () => {
    const snapshot = buildTurnNativeLoopReplayGateSnapshot()
    const verification = verifyTurnNativeLoopReplayGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:turn-native-loop-replay-gate",
      fixtureID: "turn:native-loop-replay-gate",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: ["run-turn", "context-builder", "provider-step", "tool-step", "summary-step"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      nativeClaimRisk: "profile-compatible-partial",
      runTurn: expect.arrayContaining(["opencode-turn:input-normalizer", "provider-error-retry", "tool-use-stop"]),
      providerStep: expect.arrayContaining(["opencode-turn:provider-request-builder", "provider-plugin-request-options", "raw-sse-frame-order"]),
      fixtureIDs: expect.arrayContaining([
        "opencode-agent-loop-request-boundary:native-exact-fixture",
        "opencode-agent-loop-final-summary:native-exact-fixture",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-agent-loop-request-boundary-native-exact-fixture",
        "agent-loop-request-boundary-native-exact:opencode",
        "conformance:opencode-agent-loop-final-summary-native-exact-fixture",
        "agent-loop-final-summary-native-exact:opencode",
      ]),
      knownLossiness: expect.arrayContaining(["common-turn-runner-still-executes-profile-strategy", "not-full-native-loop-replay"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      contextBuilder: expect.arrayContaining(["jsonl-v3-session-records", "active-leaf-context"]),
      summaryStep: expect.arrayContaining(["syntheticContinue", "maxSyntheticContinues", "jsonl-v3-assistant-record"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.toolStep).toEqual(expect.arrayContaining([
      "skill-tool-iteration",
      "workspace-tool-dispatch",
      "skill-tool-iteration-state",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.providerStep).toEqual(expect.arrayContaining([
      "chat-completions-request-shape",
      "persistent-provider-retry",
      "gateway-visible-trace",
    ]))

    const providerDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, providerStep: [] }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopReplayGateSnapshot(providerDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop.provider-step",
        product: "opencode",
        dimension: "provider-step",
      }),
    ]))

    const toolDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, toolStep: [] }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopReplayGateSnapshot(toolDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop.tool-step",
        product: "nanobot",
        dimension: "tool-step",
      }),
    ]))

    const missingFixture = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, fixtureIDs: item.fixtureIDs.slice(0, 3) }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopReplayGateSnapshot(missingFixture).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop.missing-fixture",
        product: "pi-mono",
        dimension: "run-turn",
      }),
    ]))

    const agentLoopNativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              nativeEvidenceRefs: item.nativeEvidenceRefs.filter((ref) => ref !== "agent-loop-request-boundary-native-exact:opencode"),
              fixtureIDs: item.fixtureIDs.filter((fixtureID) => fixtureID !== "opencode-agent-loop-request-boundary:native-exact-fixture"),
            }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopReplayGateSnapshot(agentLoopNativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop.agent-loop-native-evidence",
        product: "opencode",
        dimension: "run-turn",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, nativeClaimRisk: "native-claim-without-upstream-fixture" as const }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopReplayGateSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop.native-claim-without-exact-fixture",
        product: "hermes-agent",
        dimension: "run-turn",
      }),
    ]))
  })

  it("records turn native-loop exact-diff blockers without claiming native parity", () => {
    const snapshot = buildTurnNativeLoopExactDiffBlockerSnapshot()
    const verification = verifyTurnNativeLoopExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:turn-native-loop-exact-diff-blocker-gate",
      fixtureID: "turn:native-loop-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: ["run-turn", "context-builder", "provider-step", "tool-step", "summary-step"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "turn:native-loop-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "semantic-fixture-needs-exact-diff",
      runTurn: expect.arrayContaining(["turn-run-control-native-loop:exact-diff-not-proven", "provider-error-retry"]),
      contextBuilder: expect.arrayContaining(["turn-context-builder-native-readback:exact-diff-not-proven", "sqlite-session-events"]),
      providerStep: expect.arrayContaining(["turn-provider-step-native-stream:exact-diff-not-proven", "raw-sse-frame-order"]),
      toolStep: expect.arrayContaining(["turn-tool-step-native-side-effects:exact-diff-not-proven", "permission-tool-scheduler"]),
      summaryStep: expect.arrayContaining(["turn-summary-step-native-stop-policy:exact-diff-not-proven", "message-v2-compaction-event"]),
      fixtureIDs: expect.arrayContaining([
        "opencode-agent-loop-request-boundary:native-exact-fixture",
        "opencode-agent-loop-final-summary:native-exact-fixture",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "turn:native-loop-replay-gate",
        "opencode-turn:provider-stream-runner",
        "provider-stream-events",
        "conformance:opencode-agent-loop-request-boundary-native-exact-fixture",
        "agent-loop-request-boundary-native-exact:opencode",
        "opencode-agent-loop-request-boundary:native-exact-fixture",
        "conformance:opencode-agent-loop-final-summary-native-exact-fixture",
        "agent-loop-final-summary-native-exact:opencode",
        "opencode-agent-loop-final-summary:native-exact-fixture",
      ]),
      knownLossiness: expect.arrayContaining(["turn-run-control-native-loop-not-proven", "turn-summary-step-native-stop-policy-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      contextBuilder: expect.arrayContaining(["jsonl-v3-session-records", "turn-context-builder-native-readback:exact-diff-not-proven"]),
      summaryStep: expect.arrayContaining(["syntheticContinue", "turn-summary-step-native-stop-policy:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.toolStep).toEqual(expect.arrayContaining([
      "skill-tool-iteration",
      "turn-tool-step-native-side-effects:exact-diff-not-proven",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.providerStep).toEqual(expect.arrayContaining([
      "chat-completions-request-shape",
      "turn-provider-step-native-stream:exact-diff-not-proven",
    ]))

    const runTurnDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, runTurn: [] }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopExactDiffBlockerSnapshot(runTurnDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-exact-diff.run-turn",
        product: "opencode",
        dimension: "run-turn",
      }),
    ]))

    const contextDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, contextBuilder: [] }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopExactDiffBlockerSnapshot(contextDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-exact-diff.context-builder",
        product: "pi-mono",
        dimension: "context-builder",
      }),
    ]))

    const providerDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, providerStep: [] }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopExactDiffBlockerSnapshot(providerDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-exact-diff.provider-step",
        product: "hermes-agent",
        dimension: "provider-step",
      }),
    ]))

    const toolDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, toolStep: [] }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopExactDiffBlockerSnapshot(toolDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-exact-diff.tool-step",
        product: "nanobot",
        dimension: "tool-step",
      }),
    ]))

    const summaryDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, summaryStep: [] }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopExactDiffBlockerSnapshot(summaryDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-exact-diff.summary-step",
        product: "opencode",
        dimension: "summary-step",
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
    expect(verifyTurnNativeLoopExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-exact-diff.native-claim",
        product: "opencode",
        dimension: "run-turn",
      }),
    ]))

    const commonRunnerOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "common-runner-only" as const }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopExactDiffBlockerSnapshot(commonRunnerOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-exact-diff.common-runner-only",
        product: "pi-mono",
        dimension: "run-turn",
      }),
    ]))

    const agentLoopNativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              nativeEvidenceRefs: item.nativeEvidenceRefs.filter((ref) => ref !== "conformance:opencode-agent-loop-final-summary-native-exact-fixture"),
              fixtureIDs: item.fixtureIDs.filter((fixtureID) => fixtureID !== "opencode-agent-loop-final-summary:native-exact-fixture"),
            }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopExactDiffBlockerSnapshot(agentLoopNativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-exact-diff.agent-loop-native-evidence",
        product: "opencode",
        dimension: "run-turn",
      }),
    ]))

    const missingFixture = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, fixtureIDs: item.fixtureIDs.slice(0, 3), nativeEvidenceRefs: item.nativeEvidenceRefs.slice(0, 3) }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopExactDiffBlockerSnapshot(missingFixture).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-exact-diff.missing-fixture",
        product: "hermes-agent",
        dimension: "run-turn",
      }),
    ]))
  })

  it("records turn native-loop pinned step replay fixtures without upgrading native parity", () => {
    const snapshot = buildTurnNativeLoopPinnedReplaySnapshot()
    const verification = verifyTurnNativeLoopPinnedReplaySnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:turn-native-loop-pinned-step-replay-gate",
      fixtureID: "turn:native-loop-pinned-step-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: ["run-turn", "context-builder", "provider-step", "tool-step", "summary-step"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "pinned-step-replay-needs-live-loop",
      upstreamSteps: expect.arrayContaining([
        expect.objectContaining({
          dimension: "run-turn",
          stepID: "opencode.run-turn.msg-001",
          inputID: "opencode:msg_oc_1",
          stopReason: "tool-use-stop",
        }),
        expect.objectContaining({
          dimension: "provider-step",
          providerRequestID: "req_oc_provider_1",
          retryAttempt: 1,
          sideEffectID: "raw-sse-frame-order",
        }),
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-agent-loop-request-boundary:native-exact-fixture",
        "opencode-agent-loop-final-summary:native-exact-fixture",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-agent-loop-request-boundary-native-exact-fixture",
        "agent-loop-request-boundary-native-exact:opencode",
        "opencode-agent-loop-request-boundary:native-exact-fixture",
        "conformance:opencode-agent-loop-final-summary-native-exact-fixture",
        "agent-loop-final-summary-native-exact:opencode",
        "opencode-agent-loop-final-summary:native-exact-fixture",
      ]),
      knownLossiness: expect.arrayContaining(["turn-native-loop-pinned-step-replay-live-loop-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")?.upstreamSteps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "context-builder",
        contextKey: "jsonl-v3-session-records:active-leaf-context",
        sourceAnchor: "pi-mono-turn:context-builder",
      }),
      expect.objectContaining({
        dimension: "summary-step",
        continuationState: "synthetic-continue-consumed",
      }),
    ]))
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.upstreamSteps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "provider-step",
        continuationState: "agent-hook-provider-retry",
        sourceAnchor: "nanobot-turn:provider-stream-runner",
      }),
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.upstreamSteps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "tool-step",
        toolCallID: "tool_hermes_acp_1",
        sessionWritebackID: "write_hermes_tool_result_1",
      }),
      expect.objectContaining({
        dimension: "summary-step",
        stopReason: "interrupt-stop",
      }),
    ]))

    const runTurnDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledSteps: item.assembledSteps.map((step) =>
                step.dimension === "run-turn"
                  ? { ...step, continuationState: "drifted-continuation" }
                  : step,
              ),
            }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopPinnedReplaySnapshot(runTurnDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-pinned-replay.run-turn",
        product: "opencode",
        dimension: "run-turn",
      }),
    ]))

    const contextDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? {
              ...item,
              productReplaySteps: item.productReplaySteps.map((step) =>
                step.dimension === "context-builder"
                  ? { ...step, contextKey: "common-context-builder" }
                  : step,
              ),
            }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopPinnedReplaySnapshot(contextDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-pinned-replay.context-builder",
        product: "pi-mono",
        dimension: "context-builder",
      }),
    ]))

    const providerDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? {
              ...item,
              productReplaySteps: item.productReplaySteps.map((step) =>
                step.dimension === "provider-step"
                  ? { ...step, retryAttempt: 2 }
                  : step,
              ),
            }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopPinnedReplaySnapshot(providerDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-pinned-replay.provider-step",
        product: "nanobot",
        dimension: "provider-step",
      }),
    ]))

    const toolDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              productReplaySteps: item.productReplaySteps.map((step) =>
                step.dimension === "tool-step"
                  ? { ...step, sessionWritebackID: "common-tool-writeback" }
                  : step,
              ),
            }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopPinnedReplaySnapshot(toolDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-pinned-replay.tool-step",
        product: "hermes-agent",
        dimension: "tool-step",
      }),
    ]))

    const summaryDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledSteps: item.assembledSteps.map((step) =>
                step.dimension === "summary-step"
                  ? { ...step, stopReason: "common-stop" }
                  : step,
              ),
            }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopPinnedReplaySnapshot(summaryDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-pinned-replay.summary-step",
        product: "opencode",
        dimension: "summary-step",
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
    expect(verifyTurnNativeLoopPinnedReplaySnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-pinned-replay.native-claim",
        product: "hermes-agent",
        dimension: "run-turn",
      }),
    ]))

    const commonRunnerOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "common-runner-only" as const }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopPinnedReplaySnapshot(commonRunnerOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-pinned-replay.common-runner-only",
        product: "pi-mono",
        dimension: "run-turn",
      }),
    ]))

    const agentLoopNativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              nativeEvidenceRefs: item.nativeEvidenceRefs.filter((ref) => ref !== "agent-loop-final-summary-native-exact:opencode"),
              fixtureIDs: item.fixtureIDs.filter((fixtureID) => fixtureID !== "opencode-agent-loop-final-summary:native-exact-fixture"),
            }
          : item,
      ),
    }
    expect(verifyTurnNativeLoopPinnedReplaySnapshot(agentLoopNativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "turn-native-loop-pinned-replay.agent-loop-native-evidence",
        product: "opencode",
        dimension: "run-turn",
      }),
    ]))
  })

  it("records native-like cadence replay snapshots for request boundary, final summary, and tool batching", () => {
    const products = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const
    const replayKeys = ["request-boundary", "final-summary", "tool-batch-scheduler"] as const
    for (const product of products) {
      const snapshot = buildCadenceReplaySnapshot(product)
      const requestBoundary = snapshot.atoms.find((atom) => atom.key === "request-boundary")
      const finalSummary = snapshot.atoms.find((atom) => atom.key === "final-summary")
      const toolBatch = snapshot.atoms.find((atom) => atom.key === "tool-batch-scheduler")

      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        product,
        evidenceRef: `conformance:${product}-cadence-replay-snapshot`,
        fixtureIDs: expect.arrayContaining([...replayKeys.map((key) => `${product}-cadence:${key}`), `${product}-cadence:product-projector`]),
        coveredKeys: replayKeys,
        profileFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        productProjectorFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        productProjector: expect.objectContaining({
          projectorID: expect.stringMatching(/\.cadence\.product-projector\.partial$/),
          fixtureID: `${product}-cadence:product-projector`,
          coverage: "product-projector-partial",
        }),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        knownGaps: expect.arrayContaining(["policy-table-replay-not-full-native-loop", "product-projector-partial-not-full-native-loop"]),
      })
      expect(requestBoundary).toMatchObject({
        atomID: expect.stringMatching(/\.agent-loop\.request-boundary\.native-like$/),
        portID: "agent-loop.request-boundary",
        flowStageID: "loop.boundary",
        productProjectorCoverage: "product-projector-partial",
        productProjectorFingerprint: snapshot.productProjectorFingerprint,
        fixtureID: `${product}-cadence:request-boundary`,
        decisions: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "tool-results-available", observedDecision: "continue", visibility: "observed" }),
          expect.objectContaining({ scenarioID: "accepted-result", observedDecision: "stop", visibility: "observed" }),
        ]),
        observedFields: expect.arrayContaining(["toolResultContinuation", "providerFinishStop"]),
        lossyFields: expect.arrayContaining(["policy-table-replay"]),
      })
      expect(finalSummary).toMatchObject({
        atomID: expect.stringMatching(/\.agent-loop\.final-summary\.native-like$/),
        portID: "agent-loop.final-summary",
        flowStageID: "final.summary",
        fixtureID: `${product}-cadence:final-summary`,
        decisions: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "accepted-result", reasonCode: "accepted-final-summary-policy", visibility: "observed" }),
          expect.objectContaining({
            scenarioID: "empty-final-text",
            observedDecision: product === "opencode" ? "none" : "concise-summary",
            visibility: "observed",
          }),
        ]),
        observedFields: expect.arrayContaining(["acceptedFinalSummary", "emptyFinalTextSummary"]),
        lossyFields: expect.arrayContaining(["native-event-timing-not-replayed"]),
      })
      expect(toolBatch).toMatchObject({
        atomID: expect.stringMatching(/\.tools\.batch-scheduler\.native-like$/),
        portID: "tools.batch-scheduler",
        flowStageID: "tool.batch",
        fixtureID: `${product}-cadence:tool-batch-scheduler`,
        decisions: expect.arrayContaining([
          expect.objectContaining({ scenarioID: "mutating-edit", observedDecision: "sequential", visibility: "observed" }),
        ]),
        observedFields: expect.arrayContaining(["toolBatchMode", "mutatingToolSerialization"]),
        lossyFields: expect.arrayContaining(["not-full-native-loop-replay"]),
      })
      if (product === "opencode") {
        expect(toolBatch?.decisions).toEqual(expect.arrayContaining([expect.objectContaining({ scenarioID: "readonly-pair", observedDecision: "parallel" })]))
        expect(requestBoundary?.decisions).toEqual(expect.arrayContaining([expect.objectContaining({ scenarioID: "max-step-reached", observedDecision: "stop", reasonCode: "no-tool-call" })]))
        expect(snapshot.fixtureIDs).toEqual(expect.arrayContaining([
          "opencode-agent-loop-request-boundary:native-exact-fixture",
          "opencode-agent-loop-final-summary:native-exact-fixture",
        ]))
        expect(requestBoundary).toMatchObject({
          exactDiffStatus: "native-exact",
          nativeParityClaim: true,
          nativeFixtureSource: "opencode-agent-loop-request-boundary-native-exact",
          nativeExactFixtureIDs: ["opencode-agent-loop-request-boundary:native-exact-fixture"],
          nativeEvidenceRefs: expect.arrayContaining([
            "conformance:opencode-agent-loop-request-boundary-native-exact-fixture",
            "agent-loop-request-boundary-native-exact:opencode",
          ]),
        })
        expect(finalSummary).toMatchObject({
          exactDiffStatus: "native-exact",
          nativeParityClaim: true,
          nativeFixtureSource: "opencode-agent-loop-final-summary-native-exact",
          nativeExactFixtureIDs: ["opencode-agent-loop-final-summary:native-exact-fixture"],
          nativeEvidenceRefs: expect.arrayContaining([
            "conformance:opencode-agent-loop-final-summary-native-exact-fixture",
            "agent-loop-final-summary-native-exact:opencode",
          ]),
        })
        expect(toolBatch).toMatchObject({
          exactDiffStatus: "exact-diff-partial",
          nativeParityClaim: false,
          nativeExactFixtureIDs: [],
          nativeEvidenceRefs: [],
        })
      }
      if (product === "pi-mono") {
        expect(finalSummary?.decisions).toEqual(expect.arrayContaining([expect.objectContaining({ scenarioID: "accepted-result", observedDecision: "none" })]))
      }
    }
  })

  it("keeps cadence policy atoms product-scoped under existing lego planes", () => {
    const pi = createCadencePolicyBundle("pi-mono")
    const opencode = createCadencePolicyBundle("opencode")
    const common = createCadencePolicyBundle("common")

    expect(pi.requestBoundary.id).toBe("pi.agent-loop.request-boundary.native-like")
    expect(pi.toolBatchScheduler.id).toBe("pi.tools.batch-scheduler.native-like")
    expect(pi.finalSummary.id).toBe("pi.agent-loop.final-summary.native-like")
    expect(opencode.requestBoundary.id).toBe("opencode.agent-loop.request-boundary.native-like")
    expect(common.requestBoundary.id).toBe("common.agent-loop.request-boundary.default")

    expect(
      pi.toolBatchScheduler.plan({
        product: "pi-mono",
        toolCalls: [
          { toolCallID: "read-1", toolName: "read", mutating: false },
          { toolCallID: "edit-1", toolName: "edit", mutating: true },
          { toolCallID: "bash-1", toolName: "bash", mutating: true },
        ],
      }),
    ).toEqual([
      expect.objectContaining({ mode: "native-order", toolCallIDs: ["read-1"] }),
      expect.objectContaining({ mode: "sequential", toolCallIDs: ["edit-1"] }),
      expect.objectContaining({ mode: "sequential", toolCallIDs: ["bash-1"] }),
    ])
  })

  it("falls back to common cadence atoms when product services are not bound", async () => {
    const harness = assembleOpenCodeHarness()
    for (const token of [requestBoundaryPolicyToken, toolBatchSchedulerToken, finalSummaryPolicyToken, acceptanceControllerToken]) {
      harness.hooks.services.delete(token)
    }
    const traces: TurnPipelineTracePayload[] = []
    harness.hooks.observe((event) => {
      if (String(event.type) === "turn.pipeline.trace") traces.push(event.payload as TurnPipelineTracePayload)
    })
    let calls = 0
    const provider: LegoProviderAdapter = {
      id: "fallback-cadence",
      models: () => [{ providerID: "fallback-cadence", modelID: "model-a" }],
      async *stream() {
        calls++
        if (calls === 1) {
          yield { type: "tool_call", id: "fallback-tool", toolName: "echo", input: { text: "fallback" } }
          yield { type: "finish", finish: "tool_calls", usage: { input: 1, output: 1 }, cost: 0 }
          return
        }
        yield { type: "text", text: "done" }
        yield { type: "finish", finish: "stop", usage: { input: 2, output: 1 }, cost: 0 }
      },
    }

    await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "fallback",
        systemPrompt: "base system",
        provider,
        cadenceProduct: "pi-mono",
        maxSteps: 2,
      },
    })

    expect(policyAtomIDs(traces, "tools.batch-scheduler")).toContain("common.tools.batch-scheduler.default")
    expect(policyAtomIDs(traces, "runtime.acceptance-controller")).toContain("common.runtime.acceptance-controller.default")
    expect(policyAtomIDs(traces, "agent-loop.request-boundary")).toContain("common.agent-loop.request-boundary.default")
    expect(policyAtomIDs(traces, "agent-loop.final-summary")).toContain("common.agent-loop.final-summary.default")
  })

  it("builds compacted provider context as a direct module boundary", async () => {
    const harness = assemblePiMonoHarness()
    const session = await harness.session.create()
    await harness.session.appendMessage(createUserMessage({ sessionID: session.id, text: `old user ${"x".repeat(120)}` }))
    await harness.session.appendMessage(createAssistantMessage({ sessionID: session.id, text: `old answer ${"y".repeat(120)}` }))
    await harness.session.appendMessage(createUserMessage({ sessionID: session.id, text: "current user" }))
    const seen: string[] = []
    harness.hooks.observe((event) => {
      seen.push(event.type)
    })
    harness.hooks.on("session_before_compact", () => ({ summary: "direct compact summary" }))
    harness.hooks.on("session_compact", () => ({ autocontinue: true }))

    const context = await buildProviderContext({
      session: harness.session,
      hooks: harness.hooks,
      sessionInfo: session,
      systemPrompt: "base system",
      messages: await harness.session.messages({ sessionID: session.id }),
      model: { providerID: "context", modelID: "model-a", contextWindow: 200 },
      maxInputTokens: 20,
      compactionKeepMessages: 1,
      autoCompact: true,
    })

    expect(context.compacted).toBe(true)
    expect(context.autocontinue).toBe(true)
    expect(context.messages).toHaveLength(2)
    expect(JSON.stringify(context.messages[0])).toContain("direct compact summary")
    expect(JSON.stringify(context.messages[1])).toContain("current user")
    expect(JSON.stringify(context.messages)).not.toContain("old answer")
    expect(seen).toEqual(expect.arrayContaining(["context", "session.before_compact", "session.compacting", "session.compact", "session.compacted"]))
  })

  it("honors session_before_compact cancel without writing a compaction entry", async () => {
    const harness = assemblePiMonoHarness()
    const session = await harness.session.create()
    await harness.session.appendMessage(createUserMessage({ sessionID: session.id, text: `old user ${"x".repeat(120)}` }))
    await harness.session.appendMessage(createAssistantMessage({ sessionID: session.id, text: `old answer ${"y".repeat(120)}` }))
    const seen: string[] = []
    harness.hooks.observe((event) => {
      seen.push(event.type)
    })
    harness.hooks.on("session_before_compact", () => ({ cancel: true, reason: "keep full context" }))

    const context = await buildProviderContext({
      session: harness.session,
      hooks: harness.hooks,
      sessionInfo: session,
      systemPrompt: "base system",
      messages: await harness.session.messages({ sessionID: session.id }),
      model: { providerID: "context", modelID: "model-a", contextWindow: 200 },
      maxInputTokens: 20,
      autoCompact: true,
    })

    expect(context.compacted).toBe(false)
    expect(context.messages.map((message) => message.role)).toEqual(["user", "assistant"])
    expect(seen).toContain("session.before_compact")
    expect(seen).not.toContain("session.compacting")
    expect(
      (harness.session as unknown as { getEntries(sessionID: string): Array<{ type: string }> }).getEntries(session.id).map((entry) => entry.type),
    ).not.toContain("compaction")
  })

  it("retries a transient provider stream failure and preserves the successful attempt", async () => {
    const harness = assembleOpenCodeHarness()
    let calls = 0
    const responses: Array<{ attempt?: number; retrying?: boolean; error?: unknown; finish?: string }> = []
    harness.hooks.on("provider_response_after", (event) => {
      responses.push(event.payload as (typeof responses)[number])
    })
    const provider: LegoProviderAdapter = {
      id: "transient",
      models: () => [{ providerID: "transient", modelID: "model-a" }],
      async *stream() {
        calls++
        if (calls === 1) throw new Error("temporary provider outage")
        yield { type: "text", text: "recovered" }
        yield { type: "finish", finish: "stop", usage: { input: 1, output: 1 }, cost: 0 }
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "hello",
        systemPrompt: "base system",
        provider,
        maxRetries: 1,
      },
    })

    expect(calls).toBe(2)
    expect(result.retries).toBe(1)
    expect(result.finish).toBe("stop")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("recovered")
    expect(responses).toMatchObject([
      { attempt: 0, retrying: true, error: { message: "temporary provider outage" } },
      { attempt: 1, finish: "stop" },
    ])
  })

  it("records a provider_error assistant message when retries are exhausted", async () => {
    const harness = assembleOpenCodeHarness()
    let calls = 0
    const provider: LegoProviderAdapter = {
      id: "down",
      models: () => [{ providerID: "down", modelID: "model-a" }],
      async *stream() {
        calls++
        throw new Error("provider still down")
      },
    }

    const result = await runAgentTurn({
      session: harness.session,
      hooks: harness.hooks,
      turn: {
        text: "hello",
        systemPrompt: "base system",
        provider,
        maxRetries: 1,
      },
    })

    expect(calls).toBe(2)
    expect(result.retries).toBe(1)
    expect(result.finish).toBe("provider_error")
    expect(result.error).toMatchObject({ message: "provider still down" })
    expect(result.assistantMessage).toMatchObject({ role: "assistant", finish: "provider_error" })
    expect(result.assistantMessage).toHaveProperty("error")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("Provider error: provider still down")
    expect(result.transcript.map((message) => message.role)).toEqual(["user", "assistant"])
  })

  it("passes hook host services into task tools for subagent dispatch", async () => {
    const harness = assembleOpenCodeHarness()
    const calls: unknown[] = []
    harness.hooks.services.set("subagent.runner", {
      runTask(input: unknown) {
        calls.push(input)
        return {
          content: [{ id: "part_subagent", type: "text" as const, text: `subagent:${(input as { description: string }).description}` }],
          details: { runner: "harness" },
        }
      },
    })

    const result = await harness.runFixtureTurn({
      text: "delegate",
      assistantText: "delegating",
      toolCalls: [{ toolName: "task", input: { description: "inspect repo", agent: "explorer" } }],
    })

    expect(calls).toEqual([expect.objectContaining({ description: "inspect repo", agent: "explorer", sessionID: String(result.session.id) })])
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("subagent:inspect repo")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain('"status":"completed"')
  })

  it("routes ask-scoped tool permissions through permission.ask before execution", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-permission-deny-"))
    const target = join(cwd, "denied.txt")
    const harness = assembleOpenCodeHarness({ cwd })
    const seen: string[] = []
    let permissionPayload: { action?: string; subject?: string } | undefined
    harness.hooks.observe((event) => {
      seen.push(event.type)
    })
    await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: () => ({
        "permission.ask": (input, output) => {
          permissionPayload = input
          output.status = "deny"
        },
      }),
      pluginInput: { directory: cwd },
      source: { id: "deny-write-plugin" },
    })

    try {
      const result = await harness.runFixtureTurn({
        text: "write",
        assistantText: "writing",
        toolCalls: [{ toolName: "write", input: { path: target, content: "blocked" } }],
      })

      expect(permissionPayload).toMatchObject({ action: "file.write", subject: target })
      expect(existsSync(target)).toBe(false)
      expect(result.blockedTools).toEqual([{ toolName: "write", reason: "permission denied" }])
      expect(JSON.stringify(result.assistantMessage.parts)).toContain("permission denied")
      expect(seen).toContain("permission.ask")
      expect(seen).not.toContain("tool.execution_start")
      expect(seen).toContain("tool.execution_end")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("falls back to the UI facade when permission handlers leave status as ask", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-permission-allow-"))
    const target = join(cwd, "allowed.txt")
    const harness = assembleOpenCodeHarness({ cwd })
    const seen: string[] = []
    harness.hooks.observe((event) => {
      seen.push(event.type)
    })

    try {
      const result = await harness.runFixtureTurn({
        text: "write",
        assistantText: "writing",
        toolCalls: [{ toolName: "write", input: { path: target, content: "allowed" } }],
      })

      expect(seen).toContain("permission.ask")
      expect(seen).toContain("tool.execution_start")
      expect(result.blockedTools).toEqual([])
      expect(readFileSync(target, "utf8")).toBe("allowed")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("lets recipe-provided permission policy atoms decide tool access before product hooks", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-permission-policy-"))
    const target = join(cwd, "policy-denied.txt")
    const harness = assembleOpenCodeHarness({ cwd })
    harness.hooks.services.set(toolPermissionPolicyToken, createAlwaysDenyPermissionPolicy("recipe policy denied"))

    try {
      const result = await harness.runFixtureTurn({
        text: "write",
        assistantText: "writing",
        toolCalls: [{ toolName: "write", input: { path: target, content: "blocked" } }],
      })

      expect(existsSync(target)).toBe(false)
      expect(result.blockedTools).toEqual([{ toolName: "write", reason: "recipe policy denied" }])
      expect(JSON.stringify(result.assistantMessage.parts)).toContain("recipe policy denied")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

function indexOf(events: string[], type: string): number {
  const index = events.indexOf(type)
  expect(index).toBeGreaterThanOrEqual(0)
  return index
}

function policyAtomIDs(traces: TurnPipelineTracePayload[], atomID: string): string[] {
  return traces
    .filter((trace) => trace.atomID === atomID)
    .map((trace) => {
      const details = trace.details as { policyAtomID?: unknown } | undefined
      return typeof details?.policyAtomID === "string" ? details.policyAtomID : ""
    })
    .filter(Boolean)
}

function toolResultNames(parts: NonNullable<ReturnType<typeof createAssistantMessage>["parts"]>): string[] {
  const names: string[] = []
  for (const part of parts) {
    if (part.type === "tool_result") names.push(part.toolName)
  }
  return names
}

function goldenTranscript(messages: ReturnType<typeof createAssistantMessage>[]): unknown[] {
  return messages.map((message) => ({
    role: message.role,
    ...(message.role === "assistant" && message.finish ? { finish: message.finish } : {}),
    parts: message.parts.map((part) => {
      if (part.type === "text" || part.type === "reasoning") return { type: part.type, text: part.text }
      if (part.type === "tool_call") return { type: part.type, toolName: part.toolName, status: part.status }
      if (part.type === "tool_result") {
        return {
          type: part.type,
          toolName: part.toolName,
          text: part.content.map((content) => (content.type === "text" ? content.text : "")).join("\n"),
        }
      }
      if (part.type === "compaction") return { type: part.type, summary: part.summary }
      return { type: part.type, customType: part.customType }
    }),
  }))
}

function openCodeTurnNativeLoopTraceFromRun(input: {
  result: Awaited<ReturnType<typeof runAgentTurn>>
  providerRequests: ProviderRequest[]
  rawStreamFrames: Array<{ requestIndex: number; event: ProviderStreamEvent }>
  hookEvents: Array<{ type: string; payload: unknown }>
  providerRequestBeforeRefs: ProviderRequest[]
}) {
  return {
    providerRequests: input.providerRequests.map((request, index) => ({
      index,
      system: [...request.system],
      messageRoles: request.messages.map((message) => message.role),
      containsToolResult: JSON.stringify(request.messages).includes("tool_result"),
      toolNames: request.tools.map((tool) => tool.name).sort(),
    })),
    rawStreamFrames: input.rawStreamFrames.map(({ requestIndex, event }, index) => ({
      index,
      requestIndex,
      type: event.type,
      ...(event.type === "text" ? { text: event.text } : {}),
      ...(event.type === "tool_call" ? { toolName: event.toolName } : {}),
      ...(event.type === "finish" ? { finish: event.finish } : {}),
    })),
    streamReducerDeltas: input.hookEvents
      .map((event) => event.payload as { atomID?: unknown; details?: { eventType?: unknown } })
      .filter((payload) => payload.atomID === "turn.stream-reducer")
      .map((payload) => String(payload.details?.eventType ?? "")),
    pipelineEvents: input.hookEvents
      .filter((event) => event.type === "turn.pipeline.trace")
      .map((event) => normalizeTurnPipelineEvent(event.payload)),
    hookEventOrder: input.hookEvents
      .filter((event) => event.type !== "turn.pipeline.trace")
      .map((event) => event.type),
    sessionReadback: {
      steps: input.result.steps,
      finish: input.result.finish ?? "",
      contextCompacted: input.result.contextCompacted === true,
      transcriptRoles: input.result.transcript.map((message) => message.role),
      transcriptPartTypes: input.result.transcript.map((message) => message.parts.map((part) => part.type)),
      assistantPartTypes: input.result.assistantMessage.parts.map((part) => part.type),
      assistantFinish: messageFinish(input.result.assistantMessage),
    },
    eventObjectIdentity: {
      providerRequestBeforeSameReference: input.providerRequestBeforeRefs.every((request, index) => request === input.providerRequests[index]),
      providerRequestMessagesSameReference: input.providerRequestBeforeRefs.every((request, index) => request.messages === input.providerRequests[index]?.messages),
      providerRequestSystemSameReference: input.providerRequestBeforeRefs.every((request, index) => request.system === input.providerRequests[index]?.system),
      providerRequestToolsSameReference: input.providerRequestBeforeRefs.every((request, index) => request.tools === input.providerRequests[index]?.tools),
    },
  }
}

function normalizeTurnPipelineEvent(payload: unknown): {
  atomID: string
  phase: string
  step?: number
  attempt?: number
  label?: string
  policyAtomID?: string
} {
  const event = payload as TurnPipelineTracePayload
  const details = event.details as Record<string, unknown> | undefined
  const label = firstString(
    details?.["eventType"],
    details?.["finish"],
    details?.["reason"],
    details?.["decision"],
    details?.["mode"],
  )
  const policyAtomID = typeof details?.["policyAtomID"] === "string" ? details["policyAtomID"] : undefined
  return {
    atomID: event.atomID,
    phase: event.phase,
    ...(event.step === undefined ? {} : { step: event.step }),
    ...(event.attempt === undefined ? {} : { attempt: event.attempt }),
    ...(label ? { label } : {}),
    ...(policyAtomID ? { policyAtomID } : {}),
  }
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.length > 0)
}

function messageFinish(message: ReturnType<typeof createAssistantMessage>): string {
  return message.role === "assistant" ? message.finish ?? "" : ""
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}
