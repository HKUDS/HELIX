import { createHash } from "node:crypto"
import type { ProductTurnReplayAtomKey, ProductTurnReplayStageID } from "../product-turn/atoms.ts"

export const piMonoAgentLoopUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoAgentLoopRequestBoundaryNativeExactAtomID = "pi.agent-loop.request-boundary.native-like"
export const piMonoAgentLoopRequestBoundaryNativeExactFixtureID = "pi-agent-loop-request-boundary:native-exact-fixture"
export const piMonoAgentLoopRequestBoundaryNativeExactEvidenceRef = "conformance:pi-agent-loop-request-boundary-native-exact-fixture"
export const piMonoAgentLoopRequestBoundaryNativeExactReplayRef = "agent-loop-request-boundary-native-exact:pi-mono"
export const piMonoAgentLoopFinalSummaryNativeExactAtomID = "pi.agent-loop.final-summary.native-like"
export const piMonoAgentLoopFinalSummaryNativeExactFixtureID = "pi-agent-loop-final-summary:native-exact-fixture"
export const piMonoAgentLoopFinalSummaryNativeExactEvidenceRef = "conformance:pi-agent-loop-final-summary-native-exact-fixture"
export const piMonoAgentLoopFinalSummaryNativeExactReplayRef = "agent-loop-final-summary-native-exact:pi-mono"
export const piMonoTurnNativeExactFixtureID = "pi-turn:native-exact-fixture"
export const piMonoTurnNativeExactEvidenceRef = "conformance:pi-turn-native-exact-fixture"
export const piMonoTurnNativeExactReplayRef = "turn-native-exact:pi-mono"

export const piMonoTurnNativeExactAtomKeys = [
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
] as const satisfies readonly ProductTurnReplayAtomKey[]

export type PiMonoTurnNativeExactAtomKey = (typeof piMonoTurnNativeExactAtomKeys)[number]

export const piMonoTurnNativeExactAtomIDs = piMonoTurnNativeExactAtomKeys.map((key) => piMonoTurnNativeExactAtomID(key))

export type PiMonoAgentLoopRequestBoundaryScenarioID =
  | "nonterminating-tool-batch"
  | "terminating-tool-batch"
  | "max-step-does-not-stop-boundary"
  | "provider-finished-without-tools"
  | "should-stop-after-turn"

export type PiMonoAgentLoopRequestBoundaryDecision = "continue" | "stop"

export interface PiMonoAgentLoopRequestBoundaryCase {
  scenarioID: PiMonoAgentLoopRequestBoundaryScenarioID
  input: {
    step: number
    maxSteps: number
    toolCallCount: number
    toolBatchTerminated: boolean
    finish?: string
    shouldStopAfterTurn?: boolean
  }
  decision: PiMonoAgentLoopRequestBoundaryDecision
  reasonCode: string
  upstreamBehavior: string
}

export type PiMonoAgentLoopFinalSummaryScenarioID =
  | "accepted-result"
  | "tool-results-need-visible-finalization"
  | "assistant-visible-text"
  | "empty-final-text"
  | "terminated-tool-batch"

export type PiMonoAgentLoopFinalSummaryDecision = "none" | "native-final-message"

export interface PiMonoAgentLoopFinalSummaryCase {
  scenarioID: PiMonoAgentLoopFinalSummaryScenarioID
  input: {
    accepted: boolean
    toolCallCount: number
    visibleText: "empty" | "has-text"
    toolBatchTerminated: boolean
  }
  decision: PiMonoAgentLoopFinalSummaryDecision
  reasonCode: string
  upstreamBehavior: string
}

export interface PiMonoAgentLoopFinalSummaryNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoAgentLoopFinalSummaryNativeExactAtomID
  portID: "agent-loop.final-summary"
  upstreamRef: typeof piMonoAgentLoopUpstreamRef
  evidenceRef: typeof piMonoAgentLoopFinalSummaryNativeExactEvidenceRef
  fixtureID: typeof piMonoAgentLoopFinalSummaryNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    finalAssistantMessageIsProviderOutput: true
    noSyntheticSummaryProviderRound: true
    acceptedTurnAddsNoSummary: true
    emptyFinalTextAddsNoSummary: true
    visibleFinalTextAddsNoSummary: true
    nonTerminatingToolResultsContinueToProvider: true
    terminatingToolBatchAddsNoSummary: true
  }
  eventBoundary: {
    finalNoToolTurnOrder: ["message_end:assistant", "turn_end", "getFollowUpMessages", "agent_end"]
    shouldStopAfterTurnShortCircuitsFollowUps: true
    prepareNextTurnRunsBeforeContinuation: true
  }
  cases: PiMonoAgentLoopFinalSummaryCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoAgentLoopFinalSummaryNativeExactFixtureIssue {
  id: string
  message: string
}

export interface PiMonoAgentLoopFinalSummaryNativeExactFixtureVerification {
  ok: boolean
  issues: PiMonoAgentLoopFinalSummaryNativeExactFixtureIssue[]
}

export interface PiMonoAgentLoopRequestBoundaryNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoAgentLoopRequestBoundaryNativeExactAtomID
  portID: "agent-loop.request-boundary"
  upstreamRef: typeof piMonoAgentLoopUpstreamRef
  evidenceRef: typeof piMonoAgentLoopRequestBoundaryNativeExactEvidenceRef
  fixtureID: typeof piMonoAgentLoopRequestBoundaryNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    assistantMessageIsProducedBeforeBoundary: true
    nonTerminatingToolResultsContinueToProvider: true
    terminatingToolBatchStopsBeforeProvider: true
    noBuiltInMaxStepBoundaryStop: true
    noToolCallsExitBeforeFollowUpPoll: true
    shouldStopAfterTurnShortCircuitsSteeringAndFollowUps: true
    prepareNextTurnRunsBeforeStopHook: true
  }
  eventBoundary: {
    nonTerminatingToolBatchOrder: ["message_end:assistant", "tool_result:append", "turn_end", "prepareNextTurn", "shouldStopAfterTurn", "getSteeringMessages", "turn_start", "provider_request"]
    terminatingToolBatchOrder: ["message_end:assistant", "tool_result:append", "turn_end", "prepareNextTurn", "shouldStopAfterTurn", "getSteeringMessages", "getFollowUpMessages", "agent_end"]
    finalNoToolTurnOrder: ["message_end:assistant", "turn_end", "prepareNextTurn", "shouldStopAfterTurn", "getSteeringMessages", "getFollowUpMessages", "agent_end"]
  }
  cases: PiMonoAgentLoopRequestBoundaryCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoAgentLoopRequestBoundaryNativeExactFixtureIssue {
  id: string
  message: string
}

export interface PiMonoAgentLoopRequestBoundaryNativeExactFixtureVerification {
  ok: boolean
  issues: PiMonoAgentLoopRequestBoundaryNativeExactFixtureIssue[]
}

export interface PiMonoTurnNativeExactRecord {
  key: PiMonoTurnNativeExactAtomKey
  atomID: string
  portID: `turn.${PiMonoTurnNativeExactAtomKey}`
  stageID: ProductTurnReplayStageID
  upstreamAnchors: string[]
  nativeSemantics: string[]
  eventOrder: string[]
  evidenceRef: string
  fixtureID: string
}

export interface PiMonoTurnNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  upstreamRef: typeof piMonoAgentLoopUpstreamRef
  evidenceRef: typeof piMonoTurnNativeExactEvidenceRef
  fixtureID: typeof piMonoTurnNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  atomIDs: string[]
  coveredKeys: PiMonoTurnNativeExactAtomKey[]
  records: PiMonoTurnNativeExactRecord[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoTurnNativeExactFixtureIssue {
  id: string
  key?: PiMonoTurnNativeExactAtomKey
  message: string
}

export interface PiMonoTurnNativeExactFixtureVerification {
  ok: boolean
  issues: PiMonoTurnNativeExactFixtureIssue[]
}

export const piMonoAgentLoopRequestBoundaryNativeDescriptor = {
  id: piMonoAgentLoopRequestBoundaryNativeExactAtomID,
  port: "agent-loop.request-boundary",
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: "Pi upstream native implementation with native parity complete agent-loop request boundary exact fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoAgentLoopRequestBoundaryNativeExactEvidenceRef, piMonoAgentLoopRequestBoundaryNativeExactReplayRef],
  fixtureIDs: [piMonoAgentLoopRequestBoundaryNativeExactFixtureID],
  knownLossiness: [],
} as const

export const piMonoAgentLoopFinalSummaryNativeDescriptor = {
  id: piMonoAgentLoopFinalSummaryNativeExactAtomID,
  port: "agent-loop.final-summary",
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: "Pi upstream native implementation with native parity complete agent-loop final summary exact fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoAgentLoopFinalSummaryNativeExactEvidenceRef, piMonoAgentLoopFinalSummaryNativeExactReplayRef],
  fixtureIDs: [piMonoAgentLoopFinalSummaryNativeExactFixtureID],
  knownLossiness: [],
} as const

export const piMonoTurnNativeExactDescriptors = piMonoTurnNativeExactAtomKeys.map((key) => ({
  id: piMonoTurnNativeExactAtomID(key),
  port: piMonoTurnNativeExactPortID(key),
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: `Pi upstream native implementation with native parity complete turn ${key} exact fixture coverage.`,
  parityCoverage: "native",
  nativeEvidenceRefs: [
    piMonoTurnNativeExactEvidenceRef,
    piMonoTurnNativeExactReplayRef,
    piMonoTurnNativeExactReplayRefForKey(key),
  ],
  fixtureIDs: [piMonoTurnNativeExactFixtureID, piMonoTurnNativeExactFixtureIDForKey(key)],
  knownLossiness: [],
})) as ReadonlyArray<{
  id: string
  port: `turn.${PiMonoTurnNativeExactAtomKey}`
  product: "pi-mono"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
}>

export function buildPiMonoAgentLoopRequestBoundaryNativeExactFixture(): PiMonoAgentLoopRequestBoundaryNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<PiMonoAgentLoopRequestBoundaryNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoAgentLoopRequestBoundaryNativeExactAtomID,
    portID: "agent-loop.request-boundary" as const,
    upstreamRef: piMonoAgentLoopUpstreamRef,
    evidenceRef: piMonoAgentLoopRequestBoundaryNativeExactEvidenceRef,
    fixtureID: piMonoAgentLoopRequestBoundaryNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      assistantMessageIsProducedBeforeBoundary: true,
      nonTerminatingToolResultsContinueToProvider: true,
      terminatingToolBatchStopsBeforeProvider: true,
      noBuiltInMaxStepBoundaryStop: true,
      noToolCallsExitBeforeFollowUpPoll: true,
      shouldStopAfterTurnShortCircuitsSteeringAndFollowUps: true,
      prepareNextTurnRunsBeforeStopHook: true,
    },
    eventBoundary: {
      nonTerminatingToolBatchOrder: ["message_end:assistant", "tool_result:append", "turn_end", "prepareNextTurn", "shouldStopAfterTurn", "getSteeringMessages", "turn_start", "provider_request"] as const,
      terminatingToolBatchOrder: ["message_end:assistant", "tool_result:append", "turn_end", "prepareNextTurn", "shouldStopAfterTurn", "getSteeringMessages", "getFollowUpMessages", "agent_end"] as const,
      finalNoToolTurnOrder: ["message_end:assistant", "turn_end", "prepareNextTurn", "shouldStopAfterTurn", "getSteeringMessages", "getFollowUpMessages", "agent_end"] as const,
    },
    cases: [
      requestBoundaryCase("nonterminating-tool-batch", { step: 0, maxSteps: 4, toolCallCount: 1, toolBatchTerminated: false }, "continue", "tool-results-need-provider-continuation", "A tool batch with at least one non-terminating result starts another provider turn."),
      requestBoundaryCase("terminating-tool-batch", { step: 0, maxSteps: 4, toolCallCount: 1, toolBatchTerminated: true }, "stop", "tool-batch-terminated", "When every tool result terminates, Pi exits the loop instead of starting another provider request."),
      requestBoundaryCase("max-step-does-not-stop-boundary", { step: 3, maxSteps: 4, toolCallCount: 1, toolBatchTerminated: false }, "continue", "tool-results-need-provider-continuation", "The upstream Pi low-level loop has no built-in max-step request-boundary stop; max-step guards are external policy."),
      requestBoundaryCase("provider-finished-without-tools", { step: 0, maxSteps: 4, toolCallCount: 0, toolBatchTerminated: false, finish: "stop" }, "stop", "stop", "An assistant response without tool calls exits the inner loop and only follow-up messages can reopen the outer loop."),
      requestBoundaryCase("should-stop-after-turn", { step: 0, maxSteps: 4, toolCallCount: 1, toolBatchTerminated: false, shouldStopAfterTurn: true }, "stop", "should-stop-after-turn", "The optional shouldStopAfterTurn hook stops after turn_end before steering or follow-up polling."),
    ],
    sourceRefs: [
      `${piMonoAgentLoopUpstreamRef}:packages/agent/src/agent-loop.ts#runLoop,executeToolCalls,shouldTerminateToolBatch`,
      `${piMonoAgentLoopUpstreamRef}:packages/agent/src/types.ts#ShouldStopAfterTurnContext,AgentLoopConfig.shouldStopAfterTurn,AgentLoopConfig.getSteeringMessages,AgentLoopConfig.getFollowUpMessages`,
      `${piMonoAgentLoopUpstreamRef}:packages/agent/test/agent-loop.test.ts#should stop after the current turn when shouldStopAfterTurn returns true`,
      `${piMonoAgentLoopUpstreamRef}:packages/agent/test/agent-loop.test.ts#should stop after a tool batch when every tool result sets terminate=true`,
      `${piMonoAgentLoopUpstreamRef}:packages/agent/test/agent-loop.test.ts#should continue after parallel tool calls when not all tool results terminate`,
    ],
    nativeEvidenceRefs: [...piMonoAgentLoopRequestBoundaryNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoAgentLoopRequestBoundaryNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoAgentLoopFinalSummaryNativeExactFixture(): PiMonoAgentLoopFinalSummaryNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<PiMonoAgentLoopFinalSummaryNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoAgentLoopFinalSummaryNativeExactAtomID,
    portID: "agent-loop.final-summary" as const,
    upstreamRef: piMonoAgentLoopUpstreamRef,
    evidenceRef: piMonoAgentLoopFinalSummaryNativeExactEvidenceRef,
    fixtureID: piMonoAgentLoopFinalSummaryNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      finalAssistantMessageIsProviderOutput: true,
      noSyntheticSummaryProviderRound: true,
      acceptedTurnAddsNoSummary: true,
      emptyFinalTextAddsNoSummary: true,
      visibleFinalTextAddsNoSummary: true,
      nonTerminatingToolResultsContinueToProvider: true,
      terminatingToolBatchAddsNoSummary: true,
    },
    eventBoundary: {
      finalNoToolTurnOrder: ["message_end:assistant", "turn_end", "getFollowUpMessages", "agent_end"] as const,
      shouldStopAfterTurnShortCircuitsFollowUps: true,
      prepareNextTurnRunsBeforeContinuation: true,
    },
    cases: [
      finalSummaryCase("accepted-result", { accepted: true, toolCallCount: 0, visibleText: "empty", toolBatchTerminated: false }, "none", "accepted-final-summary-policy", "Accepted turns stop without adding a synthetic summary message."),
      finalSummaryCase("tool-results-need-visible-finalization", { accepted: false, toolCallCount: 1, visibleText: "empty", toolBatchTerminated: false }, "native-final-message", "tool-results-need-visible-finalization", "A non-terminating tool batch starts another provider turn; the final assistant message is provider output."),
      finalSummaryCase("assistant-visible-text", { accepted: false, toolCallCount: 0, visibleText: "has-text", toolBatchTerminated: false }, "none", "assistant-already-visible", "A visible assistant response ends the loop without any synthetic final summary."),
      finalSummaryCase("empty-final-text", { accepted: false, toolCallCount: 0, visibleText: "empty", toolBatchTerminated: false }, "none", "pi-upstream-agent-loop-no-synthetic-summary", "Pi runLoop exits after an empty assistant stop; it does not request a concise summary round."),
      finalSummaryCase("terminated-tool-batch", { accepted: false, toolCallCount: 1, visibleText: "empty", toolBatchTerminated: true }, "none", "tool-batch-terminated", "When every tool result terminates, Pi stops after tool results without an extra final-summary provider round."),
    ],
    sourceRefs: [
      `${piMonoAgentLoopUpstreamRef}:packages/agent/src/agent-loop.ts#runLoop,streamAssistantResponse,executeToolCalls,shouldTerminateToolBatch`,
      `${piMonoAgentLoopUpstreamRef}:packages/agent/src/types.ts#ShouldStopAfterTurnContext,PrepareNextTurnContext,AgentLoopConfig.shouldStopAfterTurn,AgentLoopConfig.prepareNextTurn,AgentLoopConfig.getFollowUpMessages`,
      `${piMonoAgentLoopUpstreamRef}:packages/agent/test/agent-loop.test.ts#should stop after the current turn when shouldStopAfterTurn returns true`,
      `${piMonoAgentLoopUpstreamRef}:packages/agent/test/agent-loop.test.ts#should stop after a tool batch when every tool result sets terminate=true`,
      `${piMonoAgentLoopUpstreamRef}:packages/agent/test/agent-loop.test.ts#should continue after parallel tool calls when not all tool results terminate`,
    ],
    nativeEvidenceRefs: [...piMonoAgentLoopFinalSummaryNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoAgentLoopFinalSummaryNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoTurnNativeExactFixture(): PiMonoTurnNativeExactFixture {
  const records = piMonoTurnNativeExactAtomKeys.map((key) => piMonoTurnNativeExactRecord(key))
  const fixtureWithoutFingerprint: Omit<PiMonoTurnNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    upstreamRef: piMonoAgentLoopUpstreamRef,
    evidenceRef: piMonoTurnNativeExactEvidenceRef,
    fixtureID: piMonoTurnNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    atomIDs: piMonoTurnNativeExactAtomIDs,
    coveredKeys: [...piMonoTurnNativeExactAtomKeys],
    records,
    sourceRefs: [
      `${piMonoAgentLoopUpstreamRef}:packages/agent/src/agent-loop.ts#runAgentLoop,runAgentLoopContinue,runLoop,streamAssistantResponse,executeToolCalls,executeToolCallsSequential,executeToolCallsParallel,prepareToolCall,finalizeExecutedToolCall,createToolResultMessage,shouldTerminateToolBatch`,
      `${piMonoAgentLoopUpstreamRef}:packages/agent/src/types.ts#AgentLoopConfig,AgentLoopTurnUpdate,ShouldStopAfterTurnContext,PrepareNextTurnContext,AgentEvent,ToolExecutionMode,QueueMode`,
      `${piMonoAgentLoopUpstreamRef}:packages/coding-agent/src/core/agent-session.ts#_handleAgentEvent,_maybeAutoCompact,_prepareRetryableErrorForContinuation,sendUserMessage,sendCustomMessage,compact,_rebuildSystemPrompt`,
      `${piMonoAgentLoopUpstreamRef}:packages/coding-agent/src/core/resource-loader.ts#loadProjectContextFiles,DefaultResourceLoader.getAgentsFiles,DefaultResourceLoader.getSystemPrompt,DefaultResourceLoader.getAppendSystemPrompt`,
      `${piMonoAgentLoopUpstreamRef}:packages/coding-agent/src/core/system-prompt.ts#BuildSystemPromptOptions,buildSystemPrompt`,
    ],
    nativeEvidenceRefs: [
      piMonoTurnNativeExactEvidenceRef,
      piMonoTurnNativeExactReplayRef,
      ...piMonoTurnNativeExactAtomKeys.map((key) => piMonoTurnNativeExactReplayRefForKey(key)),
    ],
    fixtureIDs: [
      piMonoTurnNativeExactFixtureID,
      ...piMonoTurnNativeExactAtomKeys.map((key) => piMonoTurnNativeExactFixtureIDForKey(key)),
    ],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoTurnNativeExactFixture(
  fixture: PiMonoTurnNativeExactFixture,
): PiMonoTurnNativeExactFixtureVerification {
  const issues: PiMonoTurnNativeExactFixtureIssue[] = []
  const expected = buildPiMonoTurnNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "pi-turn-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi turn native content." })
  }
  if (fixture.product !== "pi-mono" || fixture.upstreamRef !== piMonoAgentLoopUpstreamRef) {
    issues.push({ id: "pi-turn-native-exact.identity", message: "Fixture must remain scoped to the Pi mono pinned upstream turn loop." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-turn-native-exact.native-claim", message: "Pi turn fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "pi-turn-native-exact.lossiness", message: "Native exact Pi turn fixture must not carry known lossiness markers." })
  }
  if (!sameJSON(fixture.coveredKeys, expected.coveredKeys) || !sameJSON(fixture.atomIDs, expected.atomIDs)) {
    issues.push({ id: "pi-turn-native-exact.coverage", message: "Pi turn native fixture must cover the complete 13 atom turn key set." })
  }
  if (!fixture.sourceRefs.every((ref) => ref.includes("7c2775f6f67c38ed491a1ff68240ee4f8ba688da"))) {
    issues.push({ id: "pi-turn-native-exact.upstream", message: "Fixture source refs must stay pinned to the Pi upstream agent-loop/coding-agent sources." })
  }
  for (const key of piMonoTurnNativeExactAtomKeys) {
    const record = fixture.records.find((item) => item.key === key)
    const descriptor = piMonoTurnNativeExactDescriptorForKey(key)
    if (!record) {
      issues.push({ id: "pi-turn-native-exact.record-missing", key, message: `Missing Pi turn native exact record for ${key}.` })
      continue
    }
    if (!fixture.nativeEvidenceRefs.includes(piMonoTurnNativeExactReplayRefForKey(key)) || !descriptor.nativeEvidenceRefs.includes(piMonoTurnNativeExactReplayRefForKey(key))) {
      issues.push({ id: "pi-turn-native-exact.evidence", key, message: `Missing per-key native replay evidence for ${key}.` })
    }
    if (!fixture.fixtureIDs.includes(piMonoTurnNativeExactFixtureIDForKey(key)) || !descriptor.fixtureIDs.includes(piMonoTurnNativeExactFixtureIDForKey(key))) {
      issues.push({ id: "pi-turn-native-exact.fixture", key, message: `Missing per-key native fixture id for ${key}.` })
    }
    if (descriptor.parityCoverage !== "native" || descriptor.implementationKind !== "factory" || descriptor.knownLossiness.length > 0) {
      issues.push({ id: "pi-turn-native-exact.descriptor", key, message: `Descriptor for ${key} must remain native factory with no known lossiness.` })
    }
  }
  if (!sameJSON(fixture.records, expected.records)) {
    issues.push({ id: "pi-turn-native-exact.records", message: "Pi turn native exact records drifted from the upstream behavior matrix." })
  }

  return { ok: issues.length === 0, issues }
}

export function verifyPiMonoAgentLoopFinalSummaryNativeExactFixture(
  fixture: PiMonoAgentLoopFinalSummaryNativeExactFixture,
): PiMonoAgentLoopFinalSummaryNativeExactFixtureVerification {
  const issues: PiMonoAgentLoopFinalSummaryNativeExactFixtureIssue[] = []
  const expected = buildPiMonoAgentLoopFinalSummaryNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "pi-agent-loop-final-summary-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi final summary content." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoAgentLoopFinalSummaryNativeExactAtomID || fixture.portID !== "agent-loop.final-summary") {
    issues.push({ id: "pi-agent-loop-final-summary-native-exact.identity", message: "Fixture must remain scoped to the Pi agent-loop.final-summary atom." })
  }
  if (fixture.upstreamRef !== piMonoAgentLoopUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("7c2775f6f67c38ed491a1ff68240ee4f8ba688da"))) {
    issues.push({ id: "pi-agent-loop-final-summary-native-exact.upstream", message: "Fixture must stay pinned to the Pi upstream agent-loop final summary sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-agent-loop-final-summary-native-exact.native-claim", message: "Pi final summary exact fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "pi-agent-loop-final-summary-native-exact.lossiness", message: "Native exact Pi final summary fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoAgentLoopFinalSummaryNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoAgentLoopFinalSummaryNativeExactReplayRef)) {
    issues.push({ id: "pi-agent-loop-final-summary-native-exact.evidence", message: "Pi final summary native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoAgentLoopFinalSummaryNativeExactFixtureID)) {
    issues.push({ id: "pi-agent-loop-final-summary-native-exact.fixture", message: "Pi final summary native exact fixture ID is missing." })
  }
  if (!sameJSON(fixture.policy, expected.policy) || !sameJSON(fixture.eventBoundary, expected.eventBoundary)) {
    issues.push({ id: "pi-agent-loop-final-summary-native-exact.policy", message: "Pi final summary policy or event boundary drifted from upstream runLoop behavior." })
  }
  if (!sameJSON(fixture.cases, expected.cases)) {
    issues.push({ id: "pi-agent-loop-final-summary-native-exact.cases", message: "Pi final summary decision cases drifted from the native exact fixture." })
  }

  return { ok: issues.length === 0, issues }
}

export function verifyPiMonoAgentLoopRequestBoundaryNativeExactFixture(
  fixture: PiMonoAgentLoopRequestBoundaryNativeExactFixture,
): PiMonoAgentLoopRequestBoundaryNativeExactFixtureVerification {
  const issues: PiMonoAgentLoopRequestBoundaryNativeExactFixtureIssue[] = []
  const expected = buildPiMonoAgentLoopRequestBoundaryNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "pi-agent-loop-request-boundary-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi request boundary content." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoAgentLoopRequestBoundaryNativeExactAtomID || fixture.portID !== "agent-loop.request-boundary") {
    issues.push({ id: "pi-agent-loop-request-boundary-native-exact.identity", message: "Fixture must remain scoped to the Pi agent-loop.request-boundary atom." })
  }
  if (fixture.upstreamRef !== piMonoAgentLoopUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("7c2775f6f67c38ed491a1ff68240ee4f8ba688da"))) {
    issues.push({ id: "pi-agent-loop-request-boundary-native-exact.upstream", message: "Fixture must stay pinned to the Pi upstream request boundary sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-agent-loop-request-boundary-native-exact.native-claim", message: "Pi request boundary exact fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "pi-agent-loop-request-boundary-native-exact.lossiness", message: "Native exact Pi request boundary fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoAgentLoopRequestBoundaryNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoAgentLoopRequestBoundaryNativeExactReplayRef)) {
    issues.push({ id: "pi-agent-loop-request-boundary-native-exact.evidence", message: "Pi request boundary native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoAgentLoopRequestBoundaryNativeExactFixtureID)) {
    issues.push({ id: "pi-agent-loop-request-boundary-native-exact.fixture", message: "Pi request boundary native exact fixture ID is missing." })
  }
  if (!sameJSON(fixture.policy, expected.policy) || !sameJSON(fixture.eventBoundary, expected.eventBoundary)) {
    issues.push({ id: "pi-agent-loop-request-boundary-native-exact.policy", message: "Pi request boundary policy or event boundary drifted from upstream runLoop behavior." })
  }
  if (!sameJSON(fixture.cases, expected.cases)) {
    issues.push({ id: "pi-agent-loop-request-boundary-native-exact.cases", message: "Pi request boundary decision cases drifted from the native exact fixture." })
  }

  return { ok: issues.length === 0, issues }
}

export function piMonoTurnNativeExactDescriptorForID(atomID: string): (typeof piMonoTurnNativeExactDescriptors)[number] | undefined {
  return piMonoTurnNativeExactDescriptors.find((descriptor) => descriptor.id === atomID)
}

export function piMonoTurnNativeExactDescriptorForKey(key: PiMonoTurnNativeExactAtomKey): (typeof piMonoTurnNativeExactDescriptors)[number] {
  const descriptor = piMonoTurnNativeExactDescriptorForID(piMonoTurnNativeExactAtomID(key))
  if (!descriptor) throw new Error(`Missing Pi turn native exact descriptor for ${key}`)
  return descriptor
}

export function piMonoTurnNativeExactAtomID(key: PiMonoTurnNativeExactAtomKey): `pi.turn.${PiMonoTurnNativeExactAtomKey}` {
  return `pi.turn.${key}`
}

export function piMonoTurnNativeExactPortID(key: PiMonoTurnNativeExactAtomKey): `turn.${PiMonoTurnNativeExactAtomKey}` {
  return `turn.${key}`
}

export function piMonoTurnNativeExactFixtureIDForKey(key: PiMonoTurnNativeExactAtomKey): string {
  return `pi-turn:${key}:native-exact-fixture`
}

export function piMonoTurnNativeExactReplayRefForKey(key: PiMonoTurnNativeExactAtomKey): string {
  return `turn-native-exact:pi-mono:${key}`
}

function piMonoTurnNativeExactRecord(key: PiMonoTurnNativeExactAtomKey): PiMonoTurnNativeExactRecord {
  const spec = piMonoTurnNativeExactSpec(key)
  return {
    key,
    atomID: piMonoTurnNativeExactAtomID(key),
    portID: piMonoTurnNativeExactPortID(key),
    stageID: piMonoTurnNativeExactStageID(key),
    upstreamAnchors: spec.upstreamAnchors,
    nativeSemantics: spec.nativeSemantics,
    eventOrder: spec.eventOrder,
    evidenceRef: piMonoTurnNativeExactReplayRefForKey(key),
    fixtureID: piMonoTurnNativeExactFixtureIDForKey(key),
  }
}

function piMonoTurnNativeExactStageID(key: PiMonoTurnNativeExactAtomKey): ProductTurnReplayStageID {
  if (key === "input-normalizer") return "input.normalize"
  if (key === "context-builder") return "context.build"
  if (key === "prompt-assembler") return "prompt.assemble"
  if (key === "provider-request-builder") return "provider.request"
  if (key === "provider-stream-runner") return "provider.stream"
  if (key === "stream-reducer") return "stream.project"
  if (key === "tool-call-planner") return "tool.plan"
  if (key === "tool-executor") return "tool.execute"
  if (key === "result-recorder") return "session.assistant-write"
  return "loop.boundary"
}

function piMonoTurnNativeExactSpec(key: PiMonoTurnNativeExactAtomKey): Omit<PiMonoTurnNativeExactRecord, "key" | "atomID" | "portID" | "stageID" | "evidenceRef" | "fixtureID"> {
  switch (key) {
    case "input-normalizer":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#runAgentLoop",
          "packages/agent/src/agent-loop.ts#runAgentLoopContinue",
          "packages/agent/src/types.ts#QueueMode",
        ],
        nativeSemantics: [
          "Prompt runs copy incoming prompts into newMessages and append them to currentContext before provider streaming.",
          "Continuation runs reject empty contexts and contexts ending in an assistant message.",
          "Initial queued steering messages are polled before the first provider request.",
        ],
        eventOrder: ["agent_start", "turn_start", "prompt:message_start", "prompt:message_end", "runLoop"],
      }
    case "context-builder":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#streamAssistantResponse",
          "packages/agent/src/types.ts#AgentLoopConfig.transformContext",
          "packages/agent/src/types.ts#AgentLoopConfig.convertToLlm",
        ],
        nativeSemantics: [
          "The provider-facing context is the current agent messages after optional transformContext.",
          "convertToLlm runs once per assistant provider turn and receives the transformed AgentMessage array.",
          "The LLM context preserves systemPrompt, converted messages, and current tool definitions.",
        ],
        eventOrder: ["transformContext", "convertToLlm", "build llmContext", "provider.request"],
      }
    case "prompt-assembler":
      return {
        upstreamAnchors: [
          "packages/coding-agent/src/core/agent-session.ts#_rebuildSystemPrompt",
          "packages/coding-agent/src/core/system-prompt.ts#buildSystemPrompt",
          "packages/coding-agent/src/core/resource-loader.ts#DefaultResourceLoader.getSystemPrompt",
          "packages/coding-agent/src/core/resource-loader.ts#DefaultResourceLoader.getAppendSystemPrompt",
        ],
        nativeSemantics: [
          "The coding-agent session rebuilds the Pi system prompt from active tool names, snippets, guidelines, context files, skills, and prompt overrides.",
          "buildSystemPrompt hides tools without snippets and appends project context before skills.",
          "The resulting system prompt is carried into AgentContext.systemPrompt for provider turns.",
        ],
        eventOrder: ["load prompt resources", "_rebuildSystemPrompt", "buildSystemPrompt", "AgentContext.systemPrompt"],
      }
    case "provider-request-builder":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#streamAssistantResponse",
          "packages/agent/src/types.ts#AgentLoopConfig.getApiKey",
          "packages/agent/src/types.ts#StreamFn",
        ],
        nativeSemantics: [
          "Pi builds the provider request from model, llmContext, config options, a freshly resolved provider API key, and the AbortSignal.",
          "streamFn defaults to streamSimple and is invoked after context transform and convertToLlm.",
          "The provider request includes current tools directly from AgentContext.tools.",
        ],
        eventOrder: ["resolve api key", "streamFn(model,llmContext,options)", "provider stream response"],
      }
    case "provider-stream-runner":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#streamAssistantResponse",
          "packages/agent/src/types.ts#StreamFn",
          "packages/coding-agent/src/core/agent-session.ts#_handleAgentEvent",
        ],
        nativeSemantics: [
          "The async AssistantMessageEvent stream is consumed in source order.",
          "A start event appends the partial assistant message to context and emits message_start.",
          "done and error events both resolve response.result() and emit message_end with the final assistant message.",
        ],
        eventOrder: ["provider:start", "message_start", "provider:update*", "message_update*", "provider:done|error", "message_end"],
      }
    case "stream-reducer":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#streamAssistantResponse",
          "packages/agent/src/types.ts#AgentEvent",
          "packages/coding-agent/src/core/agent-session.ts#_handleAgentEvent",
        ],
        nativeSemantics: [
          "Text, thinking, and toolcall deltas replace the current partial assistant message rather than appending duplicate messages.",
          "Each assistant delta emits message_update with the raw assistantMessageEvent and a cloned partial message.",
          "If no start event arrives, the final assistant message is appended and emits message_start before message_end.",
        ],
        eventOrder: ["message_start?", "message_update*", "response.result", "message_end"],
      }
    case "tool-call-planner":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#executeToolCalls",
          "packages/agent/src/types.ts#ToolExecutionMode",
          "packages/agent/src/agent-loop.ts#prepareToolCall",
        ],
        nativeSemantics: [
          "Tool calls are extracted from assistant message content blocks with type toolCall.",
          "Execution is sequential when config.toolExecution is sequential or any requested tool declares executionMode sequential; otherwise it is parallel.",
          "Tool lookup, argument preparation, validation, beforeToolCall blocking, and abort checks happen before execution.",
        ],
        eventOrder: ["extract toolCall blocks", "choose sequential|parallel", "tool_execution_start", "prepareToolCall"],
      }
    case "tool-executor":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#executeToolCallsSequential",
          "packages/agent/src/agent-loop.ts#executeToolCallsParallel",
          "packages/agent/src/agent-loop.ts#executePreparedToolCall",
          "packages/agent/src/agent-loop.ts#finalizeExecutedToolCall",
        ],
        nativeSemantics: [
          "Sequential tools execute and emit result messages one by one; parallel tools prepare in source order, execute concurrently, then emit tool result messages in assistant source order.",
          "executePreparedToolCall relays partial tool updates through tool_execution_update.",
          "afterToolCall can replace content, details, error state, and terminate; thrown hook errors become error tool results.",
        ],
        eventOrder: ["tool_execution_start", "tool_execution_update*", "tool_execution_end", "toolResult:message_start", "toolResult:message_end"],
      }
    case "result-recorder":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#runLoop",
          "packages/agent/src/agent-loop.ts#createToolResultMessage",
          "packages/coding-agent/src/core/agent-session.ts#_handleAgentEvent",
        ],
        nativeSemantics: [
          "The final assistant message is pushed to newMessages immediately after provider streaming.",
          "Tool result messages use role toolResult with toolCallId, toolName, content, details, isError, and Date.now timestamp.",
          "Tool results are appended to currentContext and newMessages before turn_end.",
        ],
        eventOrder: ["assistant:newMessages.push", "toolResult:newMessages.push*", "turn_end", "agent session persistence"],
      }
    case "retry-policy":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#streamAssistantResponse",
          "packages/coding-agent/src/core/agent-session.ts#_handleAgentEvent",
          "packages/coding-agent/src/core/agent-session.ts#_prepareRetryableErrorForContinuation",
          "packages/coding-agent/src/core/agent-session.ts#abortRetry",
        ],
        nativeSemantics: [
          "The low-level loop treats assistant stopReason error or aborted as terminal for that loop invocation after turn_end.",
          "The coding-agent session resets retry count on successful assistant responses.",
          "Retryable provider and transport errors are continued by the session retry controller with abortable exponential backoff.",
        ],
        eventOrder: ["message_end:error|aborted", "turn_end", "agent_end", "auto_retry_start?", "continue?"],
      }
    case "continuation-policy":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#runLoop",
          "packages/agent/src/types.ts#AgentLoopConfig.getSteeringMessages",
          "packages/agent/src/types.ts#AgentLoopConfig.getFollowUpMessages",
          "packages/coding-agent/src/core/agent-session.ts#sendCustomMessage",
        ],
        nativeSemantics: [
          "Steering messages are drained before the next assistant response inside the inner loop.",
          "Follow-up messages are polled only after the loop would otherwise stop and reopen the inner loop when present.",
          "sendCustomMessage can queue messages as steer or followUp while streaming.",
        ],
        eventOrder: ["getSteeringMessages", "pending:message_start/end*", "provider_request", "getFollowUpMessages"],
      }
    case "compaction-policy":
      return {
        upstreamAnchors: [
          "packages/coding-agent/src/core/agent-session.ts#_maybeAutoCompact",
          "packages/coding-agent/src/core/agent-session.ts#compact",
          "packages/coding-agent/src/core/agent-session.ts#getContextUsage",
        ],
        nativeSemantics: [
          "Auto compaction is session-level behavior checked around agent lifecycle events, not a synthetic provider summary turn in runLoop.",
          "Manual and threshold compaction emit compaction_start and compaction_end events with abort state.",
          "Context usage after compaction is taken only from assistant usage after the latest compaction boundary.",
        ],
        eventOrder: ["agent event", "_maybeAutoCompact", "compaction_start?", "compact", "compaction_end?"],
      }
    case "stop-condition":
      return {
        upstreamAnchors: [
          "packages/agent/src/agent-loop.ts#runLoop",
          "packages/agent/src/agent-loop.ts#shouldTerminateToolBatch",
          "packages/agent/src/types.ts#AgentLoopConfig.shouldStopAfterTurn",
        ],
        nativeSemantics: [
          "A provider response without tool calls exits the inner loop and only follow-up messages can continue.",
          "A tool batch terminates only when every finalized tool result has terminate true.",
          "prepareNextTurn runs before shouldStopAfterTurn; shouldStopAfterTurn short-circuits steering and follow-up polling.",
        ],
        eventOrder: ["turn_end", "prepareNextTurn", "shouldStopAfterTurn", "getSteeringMessages?", "getFollowUpMessages?", "agent_end"],
      }
  }
}

function requestBoundaryCase(
  scenarioID: PiMonoAgentLoopRequestBoundaryScenarioID,
  input: PiMonoAgentLoopRequestBoundaryCase["input"],
  decision: PiMonoAgentLoopRequestBoundaryDecision,
  reasonCode: string,
  upstreamBehavior: string,
): PiMonoAgentLoopRequestBoundaryCase {
  return {
    scenarioID,
    input,
    decision,
    reasonCode,
    upstreamBehavior,
  }
}

function finalSummaryCase(
  scenarioID: PiMonoAgentLoopFinalSummaryScenarioID,
  input: PiMonoAgentLoopFinalSummaryCase["input"],
  decision: PiMonoAgentLoopFinalSummaryDecision,
  reasonCode: string,
  upstreamBehavior: string,
): PiMonoAgentLoopFinalSummaryCase {
  return {
    scenarioID,
    input,
    decision,
    reasonCode,
    upstreamBehavior,
  }
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
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
