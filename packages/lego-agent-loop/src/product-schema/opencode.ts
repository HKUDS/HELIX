import { createHash } from "node:crypto"
import type { FinalSummaryInput, FinalSummaryResult, RequestBoundaryInput, RequestBoundaryResult } from "../cadence/types.ts"

export const openCodeAgentLoopUpstreamRef = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
export const openCodeAgentLoopRequestBoundaryNativeExactAtomID = "opencode.agent-loop.request-boundary.native-like"
export const openCodeAgentLoopRequestBoundaryNativeExactFixtureID = "opencode-agent-loop-request-boundary:native-exact-fixture"
export const openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef = "conformance:opencode-agent-loop-request-boundary-native-exact-fixture"
export const openCodeAgentLoopRequestBoundaryNativeExactReplayRef = "agent-loop-request-boundary-native-exact:opencode"
export const openCodeAgentLoopFinalSummaryNativeExactAtomID = "opencode.agent-loop.final-summary.native-like"
export const openCodeAgentLoopFinalSummaryNativeExactFixtureID = "opencode-agent-loop-final-summary:native-exact-fixture"
export const openCodeAgentLoopFinalSummaryNativeExactEvidenceRef = "conformance:opencode-agent-loop-final-summary-native-exact-fixture"
export const openCodeAgentLoopFinalSummaryNativeExactReplayRef = "agent-loop-final-summary-native-exact:opencode"
export const openCodeTurnNativeLoopExactDiffFixtureID = "opencode-turn:native-loop-exact-diff-fixture"
export const openCodeTurnNativeLoopExactDiffEvidenceRef = "conformance:opencode-turn-native-loop-exact-diff-fixture"
export const openCodeTurnNativeLoopExactDiffReplayRef = "turn-native-loop-exact-diff:opencode"

const openCodeTurnNativeLoopExactDiffAtomIDs = [
  "opencode.turn.input-normalizer",
  "opencode.turn.context-builder",
  "opencode.turn.prompt-assembler",
  "opencode.turn.provider-request-builder",
  "opencode.turn.provider-stream-runner",
  "opencode.turn.stream-reducer",
  "opencode.turn.tool-call-planner",
  "opencode.turn.tool-executor",
  "opencode.turn.result-recorder",
  "opencode.turn.retry-policy",
  "opencode.turn.continuation-policy",
  "opencode.turn.compaction-policy",
  "opencode.turn.stop-condition",
  openCodeAgentLoopRequestBoundaryNativeExactAtomID,
  openCodeAgentLoopFinalSummaryNativeExactAtomID,
] as const

const openCodeTurnNativeLoopExactDiffSourceRefs = [
  `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/prompt.ts#sha256=7714ff26a3e20f43fae92b9250365b40733d440235c22c10f6c854c0a05aa4f3#runLoop,lastAssistant,isLastStep`,
  `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/processor.ts#sha256=4dbb60fd5682433a5edfd7d99ea5c2bec04614ec99ddc071a07db59b8a78dc55#SessionProcessor.process,handleEvent,step-finish`,
  `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/llm.ts#sha256=3b9dae2e6f5328fc82f6379cc9d06459fe842b53f9734632619e3ddb55b59366#LLM.run,streamText,fullStream`,
  `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/llm/ai-sdk.ts#sha256=6cfc52c823d980ae2ad43a53257ac9c5b4432378404625050a4bf690c29955fb#LLMAISDK.toLLMEvents`,
  `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/message-v2.ts#sha256=c640b5be1a3227cbf92c1526869030a7350e4ba9223d2c62960af7e78e929872#MessageV2.latest,toModelMessagesEffect`,
  `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/tools.ts#sha256=9f7dd64715a9eb272edb42a3ffbaf3ee1e5b49a64aa4bd569c800818b6c88118#SessionTools.resolve,Tool.execute`,
] as const

export type OpenCodeAgentLoopRequestBoundaryScenarioID =
  | "tool-results-continue"
  | "provider-finished-without-tools"
  | "external-acceptance-stop"

export interface OpenCodeAgentLoopRequestBoundaryCase {
  scenarioID: OpenCodeAgentLoopRequestBoundaryScenarioID
  input: Pick<RequestBoundaryInput, "step" | "maxSteps" | "finish" | "toolCallCount" | "accepted" | "syntheticContinues">
  decision: RequestBoundaryResult["decision"]
  reasonCode: string
  upstreamBehavior: string
}

export type OpenCodeAgentLoopFinalSummaryScenarioID =
  | "tool-results-need-visible-finalization"
  | "assistant-visible-text"
  | "empty-final-text"
  | "external-accepted-result"

export interface OpenCodeAgentLoopFinalSummaryCase {
  scenarioID: OpenCodeAgentLoopFinalSummaryScenarioID
  input: Pick<FinalSummaryInput, "finish" | "accepted" | "toolCallCount" | "visibleText">
  decision: FinalSummaryResult["decision"]
  reasonCode: string
  upstreamBehavior: string
}

export interface OpenCodeAgentLoopRequestBoundaryNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: typeof openCodeAgentLoopRequestBoundaryNativeExactAtomID
  portID: "agent-loop.request-boundary"
  upstreamRef: typeof openCodeAgentLoopUpstreamRef
  evidenceRef: typeof openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef
  fixtureID: typeof openCodeAgentLoopRequestBoundaryNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    processorResultDrivesLoopBoundary: true
    toolCallsContinueToNextProviderRound: true
    maxStepsAddsProviderReminderInsteadOfPreBoundaryStop: true
    finishedAssistantWithoutToolsBreaksLoopBeforeNextProviderRequest: true
    externalAcceptanceStopsOutsideNativeLoop: true
  }
  eventBoundary: {
    toolResultContinuationOrder: ["tool-result", "step-finish", "processor-result:continue", "session-readback", "provider-request"]
    finishedAssistantStopOrder: ["step-finish", "processor-result:continue", "session-readback", "last-assistant-finish-check", "loop-break"]
    maxStepProviderReminderOrder: ["session-readback", "isLastStep", "append-max-steps-assistant-message", "provider-request"]
  }
  cases: OpenCodeAgentLoopRequestBoundaryCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface OpenCodeAgentLoopFinalSummaryNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: typeof openCodeAgentLoopFinalSummaryNativeExactAtomID
  portID: "agent-loop.final-summary"
  upstreamRef: typeof openCodeAgentLoopUpstreamRef
  evidenceRef: typeof openCodeAgentLoopFinalSummaryNativeExactEvidenceRef
  fixtureID: typeof openCodeAgentLoopFinalSummaryNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    finalAssistantMessageIsProviderOutput: true
    noSyntheticConciseSummaryProviderRound: true
    sessionSummaryServiceUpdatesDiffMetadataOnly: true
    stepFinishForksSummaryMetadataRefresh: true
    externalAcceptanceKeepsNativeFinalMessage: true
  }
  eventBoundary: {
    finalNoToolTurnOrder: ["step-finish", "assistant-message-update", "summary-metadata-fork", "session-readback", "loop-break"]
    emptyFinalTextAddsNoSyntheticProviderRound: true
    summaryMetadataIsNotVisibleAssistantFinalization: true
  }
  cases: OpenCodeAgentLoopFinalSummaryCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface OpenCodeAgentLoopNativeExactFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeAgentLoopNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeAgentLoopNativeExactFixtureIssue[]
}

export type OpenCodeTurnNativeLoopExactDiffScenarioID = "tool-result-provider-continuation"

export interface OpenCodeTurnNativeLoopProviderRequestRecord {
  index: number
  system: string[]
  messageRoles: string[]
  containsToolResult: boolean
  toolNames: string[]
}

export interface OpenCodeTurnNativeLoopRawStreamFrameRecord {
  index: number
  requestIndex: number
  type: string
  text?: string
  toolName?: string
  finish?: string
}

export interface OpenCodeTurnNativeLoopPipelineEventRecord {
  atomID: string
  phase: string
  step?: number
  attempt?: number
  label?: string
  policyAtomID?: string
}

export interface OpenCodeTurnNativeLoopSessionReadbackRecord {
  steps: number
  finish: string
  contextCompacted: boolean
  transcriptRoles: string[]
  transcriptPartTypes: string[][]
  assistantPartTypes: string[]
  assistantFinish: string
}

export interface OpenCodeTurnNativeLoopEventObjectIdentityRecord {
  providerRequestBeforeSameReference: boolean
  providerRequestMessagesSameReference: boolean
  providerRequestSystemSameReference: boolean
  providerRequestToolsSameReference: boolean
}

export interface OpenCodeTurnNativeLoopExactDiffTrace {
  providerRequests: OpenCodeTurnNativeLoopProviderRequestRecord[]
  rawStreamFrames: OpenCodeTurnNativeLoopRawStreamFrameRecord[]
  streamReducerDeltas: string[]
  pipelineEvents: OpenCodeTurnNativeLoopPipelineEventRecord[]
  hookEventOrder: string[]
  sessionReadback: OpenCodeTurnNativeLoopSessionReadbackRecord
  eventObjectIdentity: OpenCodeTurnNativeLoopEventObjectIdentityRecord
}

export interface OpenCodeTurnNativeLoopExactDiffRecord {
  key: keyof OpenCodeTurnNativeLoopExactDiffTrace
  matches: boolean
  upstreamSha256: string
  harnessSha256: string
}

export interface OpenCodeTurnNativeLoopExactDiffFixture {
  schemaVersion: 1
  product: "opencode"
  scenarioID: OpenCodeTurnNativeLoopExactDiffScenarioID
  upstreamRef: typeof openCodeAgentLoopUpstreamRef
  evidenceRef: typeof openCodeTurnNativeLoopExactDiffEvidenceRef
  replayRef: typeof openCodeTurnNativeLoopExactDiffReplayRef
  fixtureID: typeof openCodeTurnNativeLoopExactDiffFixtureID
  exactDiffStatus: "live-native-loop-exact-diff"
  coverageStatus: "native"
  nativeParityClaim: true
  atomIDs: Array<(typeof openCodeTurnNativeLoopExactDiffAtomIDs)[number]>
  sourceRefs: string[]
  upstreamTrace: OpenCodeTurnNativeLoopExactDiffTrace
  harnessTrace: OpenCodeTurnNativeLoopExactDiffTrace
  diffRecords: OpenCodeTurnNativeLoopExactDiffRecord[]
  mismatchCount: number
  retainedFields: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnNativeLoopExactDiffFixtureInput {
  scenarioID?: OpenCodeTurnNativeLoopExactDiffScenarioID
  harnessTrace: OpenCodeTurnNativeLoopExactDiffTrace
}

export interface OpenCodeTurnNativeLoopExactDiffFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeTurnNativeLoopExactDiffFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnNativeLoopExactDiffFixtureIssue[]
}

export const openCodeAgentLoopRequestBoundaryNativeDescriptor = {
  id: openCodeAgentLoopRequestBoundaryNativeExactAtomID,
  port: "agent-loop.request-boundary",
  product: "opencode",
  implementationKind: "factory",
  selectionReason:
    "OpenCode upstream native implementation for SessionPrompt.runLoop and SessionProcessor.process request-boundary behavior: tool results continue to the next provider round, finished assistant messages stop before another provider request, and max-steps is injected as a provider reminder rather than a pre-boundary stop.",
  parityCoverage: "native",
  nativeEvidenceRefs: [
    openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef,
    openCodeAgentLoopRequestBoundaryNativeExactReplayRef,
  ],
  fixtureIDs: [openCodeAgentLoopRequestBoundaryNativeExactFixtureID],
  knownLossiness: [],
} as const

export const openCodeAgentLoopFinalSummaryNativeDescriptor = {
  id: openCodeAgentLoopFinalSummaryNativeExactAtomID,
  port: "agent-loop.final-summary",
  product: "opencode",
  implementationKind: "factory",
  selectionReason:
    "OpenCode upstream native implementation for final assistant summary behavior: provider output is the final assistant message, step-finish forks SessionSummary metadata refresh, and empty final text does not create a synthetic concise-summary provider round.",
  parityCoverage: "native",
  nativeEvidenceRefs: [
    openCodeAgentLoopFinalSummaryNativeExactEvidenceRef,
    openCodeAgentLoopFinalSummaryNativeExactReplayRef,
  ],
  fixtureIDs: [openCodeAgentLoopFinalSummaryNativeExactFixtureID],
  knownLossiness: [],
} as const

export const openCodeAgentLoopNativeDescriptors = [
  openCodeAgentLoopRequestBoundaryNativeDescriptor,
  openCodeAgentLoopFinalSummaryNativeDescriptor,
] as const

export function decideOpenCodeNativeRequestBoundary(atomID: string, input: RequestBoundaryInput): RequestBoundaryResult {
  if (input.accepted || input.acceptanceStatus === "accept") return { decision: "stop", reasonCode: "accepted", atomID }
  if (input.toolCallCount > 0 || isToolCallFinish(input.finish)) {
    return { decision: "continue", reasonCode: "tool-results-need-provider-continuation", atomID }
  }
  if (input.finish) return { decision: "stop", reasonCode: input.finish, atomID }
  return { decision: "stop", reasonCode: "no-tool-call", atomID }
}

export function decideOpenCodeNativeFinalSummary(atomID: string, input: FinalSummaryInput): FinalSummaryResult {
  if (input.accepted || input.acceptanceStatus === "accept") {
    return { decision: "native-final-message", reasonCode: "accepted-final-summary-policy", atomID }
  }
  if (input.toolCallCount > 0 || isToolCallFinish(input.finish)) {
    return { decision: "native-final-message", reasonCode: "tool-results-need-visible-finalization", atomID }
  }
  if (input.visibleText === "has-text") {
    return { decision: "none", reasonCode: "assistant-already-visible", atomID }
  }
  return { decision: "none", reasonCode: "opencode-upstream-no-synthetic-summary", atomID }
}

export function buildOpenCodeAgentLoopRequestBoundaryNativeExactFixture(): OpenCodeAgentLoopRequestBoundaryNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<OpenCodeAgentLoopRequestBoundaryNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: openCodeAgentLoopRequestBoundaryNativeExactAtomID,
    portID: "agent-loop.request-boundary" as const,
    upstreamRef: openCodeAgentLoopUpstreamRef,
    evidenceRef: openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef,
    fixtureID: openCodeAgentLoopRequestBoundaryNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      processorResultDrivesLoopBoundary: true,
      toolCallsContinueToNextProviderRound: true,
      maxStepsAddsProviderReminderInsteadOfPreBoundaryStop: true,
      finishedAssistantWithoutToolsBreaksLoopBeforeNextProviderRequest: true,
      externalAcceptanceStopsOutsideNativeLoop: true,
    },
    eventBoundary: {
      toolResultContinuationOrder: ["tool-result", "step-finish", "processor-result:continue", "session-readback", "provider-request"] as const,
      finishedAssistantStopOrder: ["step-finish", "processor-result:continue", "session-readback", "last-assistant-finish-check", "loop-break"] as const,
      maxStepProviderReminderOrder: ["session-readback", "isLastStep", "append-max-steps-assistant-message", "provider-request"] as const,
    },
    cases: [
      requestBoundaryCase("tool-results-continue", { step: 0, maxSteps: 4, finish: "tool-calls", toolCallCount: 2, syntheticContinues: 0 }, "Tool-call turns return continue from SessionProcessor.process and runLoop starts another provider request."),
      requestBoundaryCase("provider-finished-without-tools", { step: 0, maxSteps: 4, finish: "stop", toolCallCount: 0, syntheticContinues: 0 }, "A finished assistant message with no runnable tool calls breaks runLoop before another provider request."),
      requestBoundaryCase("external-acceptance-stop", { step: 0, maxSteps: 4, toolCallCount: 0, accepted: true, syntheticContinues: 0 }, "Harness acceptance is outside OpenCode's native loop and stops before entering another provider round."),
    ],
    sourceRefs: [
      `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/prompt.ts#runLoop,lastAssistant.finish,isLastStep,MAX_STEPS,handle.process`,
      `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/processor.ts#SessionProcessor.process,needsCompaction,blocked,error,continue`,
      `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/tools.ts#SessionTools.resolve,Tool.execute,processor.completeToolCall`,
    ],
    nativeEvidenceRefs: [...openCodeAgentLoopRequestBoundaryNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...openCodeAgentLoopRequestBoundaryNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildOpenCodeAgentLoopFinalSummaryNativeExactFixture(): OpenCodeAgentLoopFinalSummaryNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<OpenCodeAgentLoopFinalSummaryNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: openCodeAgentLoopFinalSummaryNativeExactAtomID,
    portID: "agent-loop.final-summary" as const,
    upstreamRef: openCodeAgentLoopUpstreamRef,
    evidenceRef: openCodeAgentLoopFinalSummaryNativeExactEvidenceRef,
    fixtureID: openCodeAgentLoopFinalSummaryNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      finalAssistantMessageIsProviderOutput: true,
      noSyntheticConciseSummaryProviderRound: true,
      sessionSummaryServiceUpdatesDiffMetadataOnly: true,
      stepFinishForksSummaryMetadataRefresh: true,
      externalAcceptanceKeepsNativeFinalMessage: true,
    },
    eventBoundary: {
      finalNoToolTurnOrder: ["step-finish", "assistant-message-update", "summary-metadata-fork", "session-readback", "loop-break"] as const,
      emptyFinalTextAddsNoSyntheticProviderRound: true,
      summaryMetadataIsNotVisibleAssistantFinalization: true,
    },
    cases: [
      finalSummaryCase("tool-results-need-visible-finalization", { finish: "tool-calls", toolCallCount: 1, visibleText: "empty" }, "A tool-call turn continues to a native provider final message instead of synthesizing a summary."),
      finalSummaryCase("assistant-visible-text", { finish: "stop", toolCallCount: 0, visibleText: "has-text" }, "Visible assistant text is already the final native message."),
      finalSummaryCase("empty-final-text", { finish: "stop", toolCallCount: 0, visibleText: "empty" }, "OpenCode does not force a concise-summary provider round for empty final text."),
      finalSummaryCase("external-accepted-result", { accepted: true, toolCallCount: 0, visibleText: "empty" }, "External acceptance keeps the native final assistant message path; no synthetic summary is added."),
    ],
    sourceRefs: [
      `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/processor.ts#step-finish,session.updateMessage,summary.summarize`,
      `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/summary.ts#SessionSummary.summarize,setSummary,session_diff,updateMessage`,
      `${openCodeAgentLoopUpstreamRef}:packages/opencode/src/session/prompt.ts#runLoop,lastAssistant,loop-break`,
    ],
    nativeEvidenceRefs: [...openCodeAgentLoopFinalSummaryNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...openCodeAgentLoopFinalSummaryNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeAgentLoopRequestBoundaryNativeExactFixture(
  fixture: OpenCodeAgentLoopRequestBoundaryNativeExactFixture,
): OpenCodeAgentLoopNativeExactFixtureVerification {
  const issues = verifyBase(fixture, {
    atomID: openCodeAgentLoopRequestBoundaryNativeExactAtomID,
    portID: "agent-loop.request-boundary",
    fixtureID: openCodeAgentLoopRequestBoundaryNativeExactFixtureID,
    prefix: "opencode-agent-loop-request-boundary-native-exact",
  })
  const expected = buildOpenCodeAgentLoopRequestBoundaryNativeExactFixture()
  if (!sameJSON(fixture.policy, expected.policy) || !sameJSON(fixture.eventBoundary, expected.eventBoundary)) {
    issues.push({ id: "opencode-agent-loop-request-boundary-native-exact.policy", message: "OpenCode request-boundary policy or event order drifted from pinned upstream behavior." })
  }
  if (!sameJSON(fixture.cases, expected.cases)) {
    issues.push({ id: "opencode-agent-loop-request-boundary-native-exact.cases", message: "OpenCode request-boundary cases drifted from the native exact fixture." })
  }
  return { ok: issues.length === 0, issues }
}

export function verifyOpenCodeAgentLoopFinalSummaryNativeExactFixture(
  fixture: OpenCodeAgentLoopFinalSummaryNativeExactFixture,
): OpenCodeAgentLoopNativeExactFixtureVerification {
  const issues = verifyBase(fixture, {
    atomID: openCodeAgentLoopFinalSummaryNativeExactAtomID,
    portID: "agent-loop.final-summary",
    fixtureID: openCodeAgentLoopFinalSummaryNativeExactFixtureID,
    prefix: "opencode-agent-loop-final-summary-native-exact",
  })
  const expected = buildOpenCodeAgentLoopFinalSummaryNativeExactFixture()
  if (!sameJSON(fixture.policy, expected.policy) || !sameJSON(fixture.eventBoundary, expected.eventBoundary)) {
    issues.push({ id: "opencode-agent-loop-final-summary-native-exact.policy", message: "OpenCode final-summary policy or event order drifted from pinned upstream behavior." })
  }
  if (!sameJSON(fixture.cases, expected.cases)) {
    issues.push({ id: "opencode-agent-loop-final-summary-native-exact.cases", message: "OpenCode final-summary cases drifted from the native exact fixture." })
  }
  return { ok: issues.length === 0, issues }
}

export function expectedOpenCodeTurnNativeLoopExactDiffTrace(): OpenCodeTurnNativeLoopExactDiffTrace {
  const toolNames = [
    "bash",
    "echo",
    "edit",
    "glob",
    "grep",
    "invalid",
    "question",
    "read",
    "skill",
    "task",
    "todowrite",
    "webfetch",
    "write",
  ]
  return {
    providerRequests: [
      {
        index: 0,
        system: ["base system"],
        messageRoles: ["user"],
        containsToolResult: false,
        toolNames,
      },
      {
        index: 1,
        system: ["base system"],
        messageRoles: ["user", "assistant"],
        containsToolResult: true,
        toolNames,
      },
    ],
    rawStreamFrames: [
      { index: 0, requestIndex: 0, type: "text", text: "looking up" },
      { index: 1, requestIndex: 0, type: "tool_call", toolName: "echo" },
      { index: 2, requestIndex: 0, type: "finish", finish: "tool_calls" },
      { index: 3, requestIndex: 1, type: "text", text: "final answer" },
      { index: 4, requestIndex: 1, type: "finish", finish: "stop" },
    ],
    streamReducerDeltas: ["text", "tool_call", "finish", "text", "finish"],
    pipelineEvents: [
      { atomID: "turn.input-normalizer", phase: "end" },
      { atomID: "turn.prompt-assembler", phase: "end" },
      { atomID: "turn.context-builder", phase: "end" },
      { atomID: "turn.compaction-policy", phase: "decision" },
      { atomID: "turn.provider-request-builder", phase: "end", step: 0, attempt: 0 },
      { atomID: "turn.provider-stream-runner", phase: "start", step: 0, attempt: 0 },
      { atomID: "turn.stream-reducer", phase: "end", label: "text" },
      { atomID: "turn.stream-reducer", phase: "end", label: "tool_call" },
      { atomID: "turn.stream-reducer", phase: "end", label: "finish" },
      { atomID: "turn.provider-stream-runner", phase: "end", step: 0, attempt: 0, label: "tool_calls" },
      { atomID: "turn.tool-call-planner", phase: "end", step: 0, attempt: 0 },
      { atomID: "tools.batch-scheduler", phase: "decision", label: "native-readonly-batch", policyAtomID: "opencode.tools.batch-scheduler.native-like" },
      { atomID: "turn.tool-executor", phase: "end", step: 0, attempt: 0 },
      { atomID: "runtime.acceptance-controller", phase: "decision", step: 0, attempt: 0, label: "no-acceptance-controller-bound", policyAtomID: "common.runtime.acceptance-controller.default" },
      { atomID: "agent-loop.request-boundary", phase: "decision", step: 0, label: "tool-results-need-provider-continuation", policyAtomID: openCodeAgentLoopRequestBoundaryNativeExactAtomID },
      { atomID: "turn.provider-request-builder", phase: "end", step: 1, attempt: 0 },
      { atomID: "turn.provider-stream-runner", phase: "start", step: 1, attempt: 0 },
      { atomID: "turn.stream-reducer", phase: "end", label: "text" },
      { atomID: "turn.stream-reducer", phase: "end", label: "finish" },
      { atomID: "turn.provider-stream-runner", phase: "end", step: 1, attempt: 0, label: "stop" },
      { atomID: "turn.tool-call-planner", phase: "end", step: 1, attempt: 0 },
      { atomID: "turn.tool-executor", phase: "end", step: 1, attempt: 0 },
      { atomID: "runtime.acceptance-controller", phase: "decision", step: 1, attempt: 0, label: "no-acceptance-controller-bound", policyAtomID: "common.runtime.acceptance-controller.default" },
      { atomID: "agent-loop.final-summary", phase: "decision", step: 1, label: "assistant-already-visible", policyAtomID: openCodeAgentLoopFinalSummaryNativeExactAtomID },
      { atomID: "turn.stop-condition", phase: "decision", step: 1, label: "stop" },
      { atomID: "turn.result-recorder", phase: "end", label: "stop" },
    ],
    hookEventOrder: [
      "input",
      "session.start",
      "turn.start",
      "message.start",
      "message.end",
      "before_agent_start",
      "context",
      "agent.start",
      "provider.request.before",
      "tool.call",
      "tool.execution_start",
      "tool.result",
      "tool.execution_end",
      "provider.response.after",
      "provider.request.before",
      "provider.response.after",
      "message.start",
      "message.end",
      "agent.end",
      "turn.end",
      "session.idle",
    ],
    sessionReadback: {
      steps: 2,
      finish: "stop",
      contextCompacted: false,
      transcriptRoles: ["user", "assistant"],
      transcriptPartTypes: [["text"], ["custom", "reasoning", "text", "tool_call", "tool_result", "text", "custom"]],
      assistantPartTypes: ["custom", "reasoning", "text", "tool_call", "tool_result", "text", "custom"],
      assistantFinish: "stop",
    },
    eventObjectIdentity: {
      providerRequestBeforeSameReference: true,
      providerRequestMessagesSameReference: true,
      providerRequestSystemSameReference: true,
      providerRequestToolsSameReference: true,
    },
  }
}

export function captureOpenCodeTurnNativeLoopExactDiffFixture(
  input: OpenCodeTurnNativeLoopExactDiffFixtureInput,
): OpenCodeTurnNativeLoopExactDiffFixture {
  const upstreamTrace = expectedOpenCodeTurnNativeLoopExactDiffTrace()
  const harnessTrace = input.harnessTrace
  const diffRecords = diffOpenCodeTurnNativeLoopTrace(upstreamTrace, harnessTrace)
  const fixtureWithoutFingerprint: Omit<OpenCodeTurnNativeLoopExactDiffFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    scenarioID: input.scenarioID ?? "tool-result-provider-continuation",
    upstreamRef: openCodeAgentLoopUpstreamRef,
    evidenceRef: openCodeTurnNativeLoopExactDiffEvidenceRef,
    replayRef: openCodeTurnNativeLoopExactDiffReplayRef,
    fixtureID: openCodeTurnNativeLoopExactDiffFixtureID,
    exactDiffStatus: "live-native-loop-exact-diff" as const,
    coverageStatus: "native" as const,
    nativeParityClaim: true as const,
    atomIDs: [...openCodeTurnNativeLoopExactDiffAtomIDs],
    sourceRefs: [...openCodeTurnNativeLoopExactDiffSourceRefs],
    upstreamTrace,
    harnessTrace,
    diffRecords,
    mismatchCount: diffRecords.filter((record) => !record.matches).length,
    retainedFields: [
      "provider.request.payload",
      "raw.stream.frames",
      "stream.reducer.delta",
      "tool.execution.side-effects",
      "agent-loop.request-boundary",
      "agent-loop.final-summary",
      "session.write-readback",
      "cleanup.side-effects",
      "event.object-identity",
    ],
    nativeEvidenceRefs: [openCodeTurnNativeLoopExactDiffEvidenceRef, openCodeTurnNativeLoopExactDiffReplayRef],
    fixtureIDs: [openCodeTurnNativeLoopExactDiffFixtureID],
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnNativeLoopExactDiffFixture(
  fixture: OpenCodeTurnNativeLoopExactDiffFixture,
): OpenCodeTurnNativeLoopExactDiffFixtureVerification {
  const issues: OpenCodeTurnNativeLoopExactDiffFixtureIssue[] = []
  const addIssue = (id: string, message: string) => issues.push({ id, message })
  const { fingerprint, ...withoutFingerprint } = fixture

  if (fingerprint !== fingerprintObject(withoutFingerprint)) {
    addIssue("opencode-turn-native-loop-exact-diff.fingerprint", "OpenCode turn native-loop exact-diff fixture fingerprint is not stable.")
  }
  if (
    fixture.product !== "opencode" ||
    fixture.fixtureID !== openCodeTurnNativeLoopExactDiffFixtureID ||
    fixture.evidenceRef !== openCodeTurnNativeLoopExactDiffEvidenceRef ||
    fixture.replayRef !== openCodeTurnNativeLoopExactDiffReplayRef
  ) {
    addIssue("opencode-turn-native-loop-exact-diff.identity", "OpenCode turn native-loop exact-diff fixture identity drifted.")
  }
  if (fixture.exactDiffStatus !== "live-native-loop-exact-diff" || fixture.coverageStatus !== "native" || fixture.nativeParityClaim !== true) {
    addIssue("opencode-turn-native-loop-exact-diff.native-claim", "OpenCode turn native-loop exact-diff fixture must stay native with exact-diff coverage.")
  }
  if (fixture.knownLossiness.length > 0) {
    addIssue("opencode-turn-native-loop-exact-diff.lossiness", "OpenCode turn native-loop exact-diff fixture cannot carry known lossiness.")
  }
  for (const source of openCodeTurnNativeLoopExactDiffSourceRefs) {
    if (!fixture.sourceRefs.includes(source)) {
      addIssue("opencode-turn-native-loop-exact-diff.source-ref", `OpenCode turn native-loop exact-diff fixture lost pinned source ${source}.`)
    }
  }
  for (const atomID of openCodeTurnNativeLoopExactDiffAtomIDs) {
    if (!fixture.atomIDs.includes(atomID)) {
      addIssue("opencode-turn-native-loop-exact-diff.atom-coverage", `OpenCode turn native-loop exact-diff fixture no longer covers ${atomID}.`)
    }
  }
  const recomputedDiff = diffOpenCodeTurnNativeLoopTrace(fixture.upstreamTrace, fixture.harnessTrace)
  const recomputedMismatchCount = recomputedDiff.filter((record) => !record.matches).length
  if (recomputedMismatchCount !== 0 || fixture.mismatchCount !== 0) {
    addIssue("opencode-turn-native-loop-exact-diff.mismatch", "OpenCode upstream native-loop trace and harness trace no longer match exactly.")
  }
  if (!sameJSON(recomputedDiff, fixture.diffRecords)) {
    addIssue("opencode-turn-native-loop-exact-diff.diff-records", "OpenCode turn native-loop diff records drifted from the trace comparison.")
  }
  if (fixture.harnessTrace.providerRequests.length !== 2 || fixture.harnessTrace.providerRequests[1]?.containsToolResult !== true) {
    addIssue("opencode-turn-native-loop-exact-diff.provider-request", "OpenCode native-loop fixture must prove the second provider request includes the prior tool result.")
  }
  if (!sameJSON(fixture.harnessTrace.streamReducerDeltas, ["text", "tool_call", "finish", "text", "finish"])) {
    addIssue("opencode-turn-native-loop-exact-diff.stream-reducer", "OpenCode native-loop fixture lost stream reducer delta coverage.")
  }
  if (
    !fixture.harnessTrace.pipelineEvents.some((event) => event.atomID === "agent-loop.request-boundary" && event.policyAtomID === openCodeAgentLoopRequestBoundaryNativeExactAtomID) ||
    !fixture.harnessTrace.pipelineEvents.some((event) => event.atomID === "agent-loop.final-summary" && event.policyAtomID === openCodeAgentLoopFinalSummaryNativeExactAtomID)
  ) {
    addIssue("opencode-turn-native-loop-exact-diff.agent-loop-policy", "OpenCode native-loop fixture must use OpenCode request-boundary and final-summary policy atoms.")
  }
  if (!fixture.harnessTrace.eventObjectIdentity.providerRequestBeforeSameReference || !fixture.harnessTrace.eventObjectIdentity.providerRequestMessagesSameReference) {
    addIssue("opencode-turn-native-loop-exact-diff.object-identity", "OpenCode native-loop fixture must retain provider request object identity through the provider hook boundary.")
  }
  if (!sameJSON(fixture.harnessTrace.sessionReadback.assistantPartTypes, ["custom", "reasoning", "text", "tool_call", "tool_result", "text", "custom"]) || fixture.harnessTrace.sessionReadback.assistantFinish !== "stop") {
    addIssue("opencode-turn-native-loop-exact-diff.session-readback", "OpenCode native-loop fixture lost assistant message write/readback coverage.")
  }
  return { ok: issues.length === 0, issues }
}

function requestBoundaryCase(
  scenarioID: OpenCodeAgentLoopRequestBoundaryScenarioID,
  input: OpenCodeAgentLoopRequestBoundaryCase["input"],
  upstreamBehavior: string,
): OpenCodeAgentLoopRequestBoundaryCase {
  const result = decideOpenCodeNativeRequestBoundary(openCodeAgentLoopRequestBoundaryNativeExactAtomID, { product: "opencode", ...input })
  return {
    scenarioID,
    input,
    decision: result.decision,
    reasonCode: result.reasonCode,
    upstreamBehavior,
  }
}

function finalSummaryCase(
  scenarioID: OpenCodeAgentLoopFinalSummaryScenarioID,
  input: OpenCodeAgentLoopFinalSummaryCase["input"],
  upstreamBehavior: string,
): OpenCodeAgentLoopFinalSummaryCase {
  const result = decideOpenCodeNativeFinalSummary(openCodeAgentLoopFinalSummaryNativeExactAtomID, { product: "opencode", ...input })
  return {
    scenarioID,
    input,
    decision: result.decision,
    reasonCode: result.reasonCode,
    upstreamBehavior,
  }
}

function isToolCallFinish(finish: string | undefined): boolean {
  return finish === "tool-calls" || finish === "tool_calls"
}

function verifyBase(
  fixture: OpenCodeAgentLoopRequestBoundaryNativeExactFixture | OpenCodeAgentLoopFinalSummaryNativeExactFixture,
  expected: { atomID: string; portID: string; fixtureID: string; prefix: string },
): OpenCodeAgentLoopNativeExactFixtureIssue[] {
  const issues: OpenCodeAgentLoopNativeExactFixtureIssue[] = []
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture

  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: `${expected.prefix}.fingerprint`, message: "OpenCode agent-loop fixture fingerprint is not stable." })
  }
  if (fixture.product !== "opencode" || fixture.atomID !== expected.atomID || fixture.portID !== expected.portID || fixture.fixtureID !== expected.fixtureID) {
    issues.push({ id: `${expected.prefix}.identity`, message: "OpenCode agent-loop fixture identity drifted." })
  }
  if (fixture.upstreamRef !== openCodeAgentLoopUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
    issues.push({ id: `${expected.prefix}.upstream`, message: "OpenCode agent-loop fixture must stay pinned to the upstream OpenCode source refs." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: `${expected.prefix}.native-claim`, message: "OpenCode agent-loop exact fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: `${expected.prefix}.lossiness`, message: "Native exact OpenCode agent-loop fixture must not carry known lossiness markers." })
  }
  if (fixture.nativeEvidenceRefs.length < 2 || fixture.fixtureIDs.length === 0) {
    issues.push({ id: `${expected.prefix}.evidence`, message: "OpenCode agent-loop native exact evidence refs or fixture IDs are missing." })
  }
  return issues
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
}

function diffOpenCodeTurnNativeLoopTrace(
  upstreamTrace: OpenCodeTurnNativeLoopExactDiffTrace,
  harnessTrace: OpenCodeTurnNativeLoopExactDiffTrace,
): OpenCodeTurnNativeLoopExactDiffRecord[] {
  return ([
    "providerRequests",
    "rawStreamFrames",
    "streamReducerDeltas",
    "pipelineEvents",
    "hookEventOrder",
    "sessionReadback",
    "eventObjectIdentity",
  ] as Array<keyof OpenCodeTurnNativeLoopExactDiffTrace>).map((key) => {
    const upstream = stableStringify(upstreamTrace[key])
    const harness = stableStringify(harnessTrace[key])
    return {
      key,
      matches: upstream === harness,
      upstreamSha256: createHash("sha256").update(upstream).digest("hex"),
      harnessSha256: createHash("sha256").update(harness).digest("hex"),
    }
  })
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
