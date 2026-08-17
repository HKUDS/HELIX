import { createHash } from "node:crypto"
import type { ProductTurnReplayAtomKey, ProductTurnReplayStageID } from "../product-turn/atoms.ts"

export const nanobotAgentLoopUpstreamRef = "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
export const nanobotAgentLoopRequestBoundaryNativeExactAtomID = "nanobot.agent-loop.request-boundary.native-like"
export const nanobotAgentLoopRequestBoundaryNativeExactFixtureID = "nanobot-agent-loop-request-boundary:native-exact-fixture"
export const nanobotAgentLoopRequestBoundaryNativeExactEvidenceRef = "conformance:nanobot-agent-loop-request-boundary-native-exact-fixture"
export const nanobotAgentLoopRequestBoundaryNativeExactReplayRef = "agent-loop-request-boundary-native-exact:nanobot"
export const nanobotAgentLoopFinalSummaryNativeExactAtomID = "nanobot.agent-loop.final-summary.native-like"
export const nanobotAgentLoopFinalSummaryNativeExactFixtureID = "nanobot-agent-loop-final-summary:native-exact-fixture"
export const nanobotAgentLoopFinalSummaryNativeExactEvidenceRef = "conformance:nanobot-agent-loop-final-summary-native-exact-fixture"
export const nanobotAgentLoopFinalSummaryNativeExactReplayRef = "agent-loop-final-summary-native-exact:nanobot"
export const nanobotTurnNativeExactFixtureID = "nanobot-turn:native-exact-fixture"
export const nanobotTurnNativeExactEvidenceRef = "conformance:nanobot-turn-native-exact-fixture"
export const nanobotTurnNativeExactReplayRef = "turn-native-exact:nanobot"

export const nanobotTurnNativeExactAtomKeys = [
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

export type NanobotTurnNativeExactAtomKey = (typeof nanobotTurnNativeExactAtomKeys)[number]

export const nanobotTurnNativeExactAtomIDs = nanobotTurnNativeExactAtomKeys.map((key) => nanobotTurnNativeExactAtomID(key))

export interface NanobotTurnNativeExactRecord {
  key: NanobotTurnNativeExactAtomKey
  atomID: string
  portID: `turn.${NanobotTurnNativeExactAtomKey}`
  stageID: ProductTurnReplayStageID
  upstreamAnchors: string[]
  nativeSemantics: string[]
  eventOrder: string[]
  evidenceRef: string
  fixtureID: string
}

export interface NanobotTurnNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  upstreamRef: typeof nanobotAgentLoopUpstreamRef
  evidenceRef: typeof nanobotTurnNativeExactEvidenceRef
  fixtureID: typeof nanobotTurnNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  atomIDs: string[]
  coveredKeys: NanobotTurnNativeExactAtomKey[]
  records: NanobotTurnNativeExactRecord[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface NanobotTurnNativeExactFixtureIssue {
  id: string
  key?: NanobotTurnNativeExactAtomKey
  message: string
}

export interface NanobotTurnNativeExactFixtureVerification {
  ok: boolean
  issues: NanobotTurnNativeExactFixtureIssue[]
}

export type NanobotAgentLoopNativeExactAtomID =
  | typeof nanobotAgentLoopRequestBoundaryNativeExactAtomID
  | typeof nanobotAgentLoopFinalSummaryNativeExactAtomID

export interface NanobotAgentLoopNativeExactRecord {
  atomID: NanobotAgentLoopNativeExactAtomID
  portID: "agent-loop.request-boundary" | "agent-loop.final-summary"
  upstreamAnchors: string[]
  nativeSemantics: string[]
  eventOrder: string[]
  evidenceRef: string
  fixtureID: string
}

export interface NanobotAgentLoopNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  upstreamRef: typeof nanobotAgentLoopUpstreamRef
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  atomIDs: NanobotAgentLoopNativeExactAtomID[]
  records: NanobotAgentLoopNativeExactRecord[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface NanobotAgentLoopNativeExactFixtureIssue {
  id: string
  atomID?: NanobotAgentLoopNativeExactAtomID
  message: string
}

export interface NanobotAgentLoopNativeExactFixtureVerification {
  ok: boolean
  issues: NanobotAgentLoopNativeExactFixtureIssue[]
}

export const nanobotAgentLoopRequestBoundaryNativeDescriptor = {
  id: nanobotAgentLoopRequestBoundaryNativeExactAtomID,
  port: "agent-loop.request-boundary",
  product: "nanobot",
  implementationKind: "factory",
  selectionReason:
    "Nanobot upstream native implementation for AgentRunner.run request-boundary behavior is pinned to the native iteration loop: tool-call responses append assistant/tool messages and continue, injected user messages are drained before continuation, and no-tool/error/max-iteration branches stop in the upstream order.",
  parityCoverage: "native",
  nativeEvidenceRefs: [
    nanobotAgentLoopRequestBoundaryNativeExactEvidenceRef,
    nanobotAgentLoopRequestBoundaryNativeExactReplayRef,
  ],
  fixtureIDs: [nanobotAgentLoopRequestBoundaryNativeExactFixtureID],
  knownLossiness: [],
} as const

export const nanobotAgentLoopFinalSummaryNativeDescriptor = {
  id: nanobotAgentLoopFinalSummaryNativeExactAtomID,
  port: "agent-loop.final-summary",
  product: "nanobot",
  implementationKind: "factory",
  selectionReason:
    "Nanobot upstream native implementation for AgentRunner.run final-summary behavior is pinned to native final assistant persistence, empty-response recovery, length recovery, model/tool error branches, and max-iteration final message handling.",
  parityCoverage: "native",
  nativeEvidenceRefs: [
    nanobotAgentLoopFinalSummaryNativeExactEvidenceRef,
    nanobotAgentLoopFinalSummaryNativeExactReplayRef,
  ],
  fixtureIDs: [nanobotAgentLoopFinalSummaryNativeExactFixtureID],
  knownLossiness: [],
} as const

export const nanobotAgentLoopNativeExactDescriptors = [
  nanobotAgentLoopRequestBoundaryNativeDescriptor,
  nanobotAgentLoopFinalSummaryNativeDescriptor,
] as const

export const nanobotTurnNativeExactDescriptors = nanobotTurnNativeExactAtomKeys.map((key) => ({
  id: nanobotTurnNativeExactAtomID(key),
  port: nanobotTurnNativeExactPortID(key),
  product: "nanobot",
  implementationKind: "factory",
  selectionReason: `Nanobot upstream native implementation with native parity complete turn ${key} exact fixture coverage.`,
  parityCoverage: "native",
  nativeEvidenceRefs: [
    nanobotTurnNativeExactEvidenceRef,
    nanobotTurnNativeExactReplayRef,
    nanobotTurnNativeExactReplayRefForKey(key),
  ],
  fixtureIDs: [nanobotTurnNativeExactFixtureID, nanobotTurnNativeExactFixtureIDForKey(key)],
  knownLossiness: [],
})) as ReadonlyArray<{
  id: string
  port: `turn.${NanobotTurnNativeExactAtomKey}`
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
}>

export function buildNanobotAgentLoopNativeExactFixture(): NanobotAgentLoopNativeExactFixture {
  const records = nanobotAgentLoopNativeExactRecords()
  const fixtureWithoutFingerprint: Omit<NanobotAgentLoopNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "nanobot" as const,
    upstreamRef: nanobotAgentLoopUpstreamRef,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    atomIDs: [
      nanobotAgentLoopRequestBoundaryNativeExactAtomID,
      nanobotAgentLoopFinalSummaryNativeExactAtomID,
    ],
    records,
    sourceRefs: [
      `${nanobotAgentLoopUpstreamRef}:nanobot/agent/runner.py#AgentRunner.run,_try_drain_injections,_request_finalization_retry`,
      `${nanobotAgentLoopUpstreamRef}:nanobot/agent/runner.py#_execute_tools,_partition_tool_batches,_run_tool,_normalize_tool_result`,
      `${nanobotAgentLoopUpstreamRef}:nanobot/utils/runtime.py#EMPTY_FINAL_RESPONSE_MESSAGE,build_length_recovery_message,build_finalization_retry_message`,
      `${nanobotAgentLoopUpstreamRef}:nanobot/utils/prompt_templates.py#render_template(agent/max_iterations_message.md)`,
      `${nanobotAgentLoopUpstreamRef}:nanobot/agent/hook.py#AgentHook,AgentHookContext`,
    ],
    nativeEvidenceRefs: [
      nanobotAgentLoopRequestBoundaryNativeExactEvidenceRef,
      nanobotAgentLoopRequestBoundaryNativeExactReplayRef,
      nanobotAgentLoopFinalSummaryNativeExactEvidenceRef,
      nanobotAgentLoopFinalSummaryNativeExactReplayRef,
    ],
    fixtureIDs: [
      nanobotAgentLoopRequestBoundaryNativeExactFixtureID,
      nanobotAgentLoopFinalSummaryNativeExactFixtureID,
    ],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyNanobotAgentLoopNativeExactFixture(
  fixture: NanobotAgentLoopNativeExactFixture,
): NanobotAgentLoopNativeExactFixtureVerification {
  const issues: NanobotAgentLoopNativeExactFixtureIssue[] = []
  const expected = buildNanobotAgentLoopNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "nanobot-agent-loop-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Nanobot agent-loop native content." })
  }
  if (fixture.product !== "nanobot" || fixture.upstreamRef !== nanobotAgentLoopUpstreamRef) {
    issues.push({ id: "nanobot-agent-loop-native-exact.identity", message: "Fixture must remain scoped to the pinned Nanobot AgentRunner loop." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "nanobot-agent-loop-native-exact.native-claim", message: "Nanobot agent-loop fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "nanobot-agent-loop-native-exact.lossiness", message: "Native exact Nanobot agent-loop fixture must not carry known lossiness markers." })
  }
  if (!sameJSON(fixture.atomIDs, expected.atomIDs) || !sameJSON(fixture.records, expected.records)) {
    issues.push({ id: "nanobot-agent-loop-native-exact.records", message: "Nanobot request-boundary/final-summary records drifted from the upstream behavior matrix." })
  }
  if (!fixture.sourceRefs.every((ref) => ref.includes("c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"))) {
    issues.push({ id: "nanobot-agent-loop-native-exact.upstream", message: "Fixture source refs must stay pinned to the Nanobot upstream AgentRunner sources." })
  }
  for (const descriptor of nanobotAgentLoopNativeExactDescriptors) {
    const record = fixture.records.find((item) => item.atomID === descriptor.id)
    if (!record) {
      issues.push({ id: "nanobot-agent-loop-native-exact.record-missing", atomID: descriptor.id, message: `Missing Nanobot agent-loop native exact record for ${descriptor.id}.` })
      continue
    }
    if (!fixture.nativeEvidenceRefs.every((ref) => expected.nativeEvidenceRefs.includes(ref)) || !descriptor.nativeEvidenceRefs.every((ref) => fixture.nativeEvidenceRefs.includes(ref))) {
      issues.push({ id: "nanobot-agent-loop-native-exact.evidence", atomID: descriptor.id, message: `Missing native replay evidence for ${descriptor.id}.` })
    }
    if (!descriptor.fixtureIDs.every((id) => fixture.fixtureIDs.includes(id))) {
      issues.push({ id: "nanobot-agent-loop-native-exact.fixture", atomID: descriptor.id, message: `Missing native fixture id for ${descriptor.id}.` })
    }
    if (descriptor.parityCoverage !== "native" || descriptor.implementationKind !== "factory" || descriptor.knownLossiness.length > 0) {
      issues.push({ id: "nanobot-agent-loop-native-exact.descriptor", atomID: descriptor.id, message: `Descriptor for ${descriptor.id} must remain native factory with no known lossiness.` })
    }
  }

  return { ok: issues.length === 0, issues }
}

export function buildNanobotTurnNativeExactFixture(): NanobotTurnNativeExactFixture {
  const records = nanobotTurnNativeExactAtomKeys.map((key) => nanobotTurnNativeExactRecord(key))
  const fixtureWithoutFingerprint: Omit<NanobotTurnNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "nanobot" as const,
    upstreamRef: nanobotAgentLoopUpstreamRef,
    evidenceRef: nanobotTurnNativeExactEvidenceRef,
    fixtureID: nanobotTurnNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    atomIDs: nanobotTurnNativeExactAtomIDs,
    coveredKeys: [...nanobotTurnNativeExactAtomKeys],
    records,
    sourceRefs: [
      `${nanobotAgentLoopUpstreamRef}:nanobot/agent/runner.py#AgentRunSpec,AgentRunResult,AgentRunner.run,_build_request_kwargs,_request_model,_try_drain_injections,_execute_tools,_microcompact,_snip_history`,
      `${nanobotAgentLoopUpstreamRef}:nanobot/agent/tools/registry.py#ToolRegistry.get_definitions,ToolRegistry.execute`,
      `${nanobotAgentLoopUpstreamRef}:nanobot/providers/base.py#LLMProvider,LLMResponse,ToolCallRequest`,
      `${nanobotAgentLoopUpstreamRef}:nanobot/providers/openai_compat_provider.py#OpenAICompatibleProvider.chat_with_retry,chat_stream_with_retry`,
      `${nanobotAgentLoopUpstreamRef}:nanobot/utils/helpers.py#build_assistant_message,extract_reasoning,strip_think,estimate_message_tokens,maybe_persist_tool_result`,
      `${nanobotAgentLoopUpstreamRef}:nanobot/utils/runtime.py#EMPTY_FINAL_RESPONSE_MESSAGE,build_length_recovery_message,build_finalization_retry_message,ensure_nonempty_tool_result`,
    ],
    nativeEvidenceRefs: [
      nanobotTurnNativeExactEvidenceRef,
      nanobotTurnNativeExactReplayRef,
      ...nanobotTurnNativeExactAtomKeys.map((key) => nanobotTurnNativeExactReplayRefForKey(key)),
    ],
    fixtureIDs: [
      nanobotTurnNativeExactFixtureID,
      ...nanobotTurnNativeExactAtomKeys.map((key) => nanobotTurnNativeExactFixtureIDForKey(key)),
    ],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyNanobotTurnNativeExactFixture(
  fixture: NanobotTurnNativeExactFixture,
): NanobotTurnNativeExactFixtureVerification {
  const issues: NanobotTurnNativeExactFixtureIssue[] = []
  const expected = buildNanobotTurnNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "nanobot-turn-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Nanobot turn native content." })
  }
  if (fixture.product !== "nanobot" || fixture.upstreamRef !== nanobotAgentLoopUpstreamRef) {
    issues.push({ id: "nanobot-turn-native-exact.identity", message: "Fixture must remain scoped to the pinned Nanobot upstream agent runner." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "nanobot-turn-native-exact.native-claim", message: "Nanobot turn fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "nanobot-turn-native-exact.lossiness", message: "Native exact Nanobot turn fixture must not carry known lossiness markers." })
  }
  if (!sameJSON(fixture.coveredKeys, expected.coveredKeys) || !sameJSON(fixture.atomIDs, expected.atomIDs)) {
    issues.push({ id: "nanobot-turn-native-exact.coverage", message: "Nanobot turn native fixture must cover the complete 13 atom turn key set." })
  }
  if (!fixture.sourceRefs.every((ref) => ref.includes("c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"))) {
    issues.push({ id: "nanobot-turn-native-exact.upstream", message: "Fixture source refs must stay pinned to the Nanobot upstream agent runner sources." })
  }
  for (const key of nanobotTurnNativeExactAtomKeys) {
    const record = fixture.records.find((item) => item.key === key)
    const descriptor = nanobotTurnNativeExactDescriptorForKey(key)
    if (!record) {
      issues.push({ id: "nanobot-turn-native-exact.record-missing", key, message: `Missing Nanobot turn native exact record for ${key}.` })
      continue
    }
    if (!fixture.nativeEvidenceRefs.includes(nanobotTurnNativeExactReplayRefForKey(key)) || !descriptor.nativeEvidenceRefs.includes(nanobotTurnNativeExactReplayRefForKey(key))) {
      issues.push({ id: "nanobot-turn-native-exact.evidence", key, message: `Missing per-key native replay evidence for ${key}.` })
    }
    if (!fixture.fixtureIDs.includes(nanobotTurnNativeExactFixtureIDForKey(key)) || !descriptor.fixtureIDs.includes(nanobotTurnNativeExactFixtureIDForKey(key))) {
      issues.push({ id: "nanobot-turn-native-exact.fixture", key, message: `Missing per-key native fixture id for ${key}.` })
    }
    if (descriptor.parityCoverage !== "native" || descriptor.implementationKind !== "factory" || descriptor.knownLossiness.length > 0) {
      issues.push({ id: "nanobot-turn-native-exact.descriptor", key, message: `Descriptor for ${key} must remain native factory with no known lossiness.` })
    }
  }
  if (!sameJSON(fixture.records, expected.records)) {
    issues.push({ id: "nanobot-turn-native-exact.records", message: "Nanobot turn native exact records drifted from the upstream behavior matrix." })
  }

  return { ok: issues.length === 0, issues }
}

export function nanobotTurnNativeExactDescriptorForID(atomID: string): (typeof nanobotTurnNativeExactDescriptors)[number] | undefined {
  return nanobotTurnNativeExactDescriptors.find((descriptor) => descriptor.id === atomID)
}

export function nanobotTurnNativeExactDescriptorForKey(key: NanobotTurnNativeExactAtomKey): (typeof nanobotTurnNativeExactDescriptors)[number] {
  const descriptor = nanobotTurnNativeExactDescriptorForID(nanobotTurnNativeExactAtomID(key))
  if (!descriptor) throw new Error(`Missing Nanobot turn native exact descriptor for ${key}`)
  return descriptor
}

export function nanobotTurnNativeExactAtomID(key: NanobotTurnNativeExactAtomKey): `nanobot.turn.${NanobotTurnNativeExactAtomKey}` {
  return `nanobot.turn.${key}`
}

export function nanobotTurnNativeExactPortID(key: NanobotTurnNativeExactAtomKey): `turn.${NanobotTurnNativeExactAtomKey}` {
  return `turn.${key}`
}

export function nanobotTurnNativeExactFixtureIDForKey(key: NanobotTurnNativeExactAtomKey): string {
  return `nanobot-turn:${key}:native-exact-fixture`
}

export function nanobotTurnNativeExactReplayRefForKey(key: NanobotTurnNativeExactAtomKey): string {
  return `turn-native-exact:nanobot:${key}`
}

function nanobotAgentLoopNativeExactRecords(): NanobotAgentLoopNativeExactRecord[] {
  return [
    {
      atomID: nanobotAgentLoopRequestBoundaryNativeExactAtomID,
      portID: "agent-loop.request-boundary",
      upstreamAnchors: [
        "nanobot/agent/runner.py#AgentRunner.run.response.should_execute_tools",
        "nanobot/agent/runner.py#AgentRunner.run._try_drain_injections(after tool execution)",
        "nanobot/agent/runner.py#AgentRunner.run.response.has_tool_calls",
        "nanobot/agent/runner.py#AgentRunner.run.max_iterations",
      ],
      nativeSemantics: [
        "Provider responses with executable tool calls append the assistant tool-call message, checkpoint awaiting_tools, execute the native batch, append role=tool messages, checkpoint tools_completed, drain injections, run after_iteration, and continue to the next provider request.",
        "Tool fatal errors stop the native loop after appending a final error message unless injection draining supplies another user message.",
        "Provider responses without executable tool calls enter finalization/error/empty/length branches instead of scheduling another provider request.",
        "The for-loop else branch appends Nanobot's configured or templated max-iterations message after the native iteration budget is exhausted.",
      ],
      eventOrder: [
        "context governance repair",
        "before_iteration",
        "provider request",
        "assistant tool-call checkpoint",
        "tool batch execution",
        "tool results appended",
        "tools_completed checkpoint",
        "drain injections",
        "after_iteration",
        "continue or stop",
      ],
      evidenceRef: nanobotAgentLoopRequestBoundaryNativeExactReplayRef,
      fixtureID: nanobotAgentLoopRequestBoundaryNativeExactFixtureID,
    },
    {
      atomID: nanobotAgentLoopFinalSummaryNativeExactAtomID,
      portID: "agent-loop.final-summary",
      upstreamAnchors: [
        "nanobot/agent/runner.py#AgentRunner.run.clean = hook.finalize_content",
        "nanobot/agent/runner.py#AgentRunner.run._request_finalization_retry",
        "nanobot/agent/runner.py#AgentRunner.run.build_assistant_message",
        "nanobot/agent/runner.py#AgentRunner.run._emit_checkpoint(final_response)",
      ],
      nativeSemantics: [
        "Final visible text is the provider output after hook.finalize_content; Nanobot does not synthesize a common concise-summary provider round on successful no-tool completion.",
        "Blank non-error output first consumes the native empty-response retry budget, then requests Nanobot's finalization retry, and finally appends EMPTY_FINAL_RESPONSE_MESSAGE when still blank.",
        "Length finish with nonblank text appends the assistant message plus build_length_recovery_message and continues within the bounded length recovery loop.",
        "The final_response checkpoint captures the exact assistant message before AgentRunResult exposes final_content, stop_reason, error, usage, tool_events, and injection state.",
      ],
      eventOrder: [
        "finalize provider content",
        "empty retry or length recovery if needed",
        "drain mid-turn injections",
        "stream end",
        "append final assistant/error message",
        "final_response checkpoint",
        "after_iteration",
        "return AgentRunResult",
      ],
      evidenceRef: nanobotAgentLoopFinalSummaryNativeExactReplayRef,
      fixtureID: nanobotAgentLoopFinalSummaryNativeExactFixtureID,
    },
  ]
}

function nanobotTurnNativeExactRecord(key: NanobotTurnNativeExactAtomKey): NanobotTurnNativeExactRecord {
  const spec = nanobotTurnNativeExactSpec(key)
  return {
    key,
    atomID: nanobotTurnNativeExactAtomID(key),
    portID: nanobotTurnNativeExactPortID(key),
    stageID: nanobotTurnNativeExactStageID(key),
    upstreamAnchors: spec.upstreamAnchors,
    nativeSemantics: spec.nativeSemantics,
    eventOrder: spec.eventOrder,
    evidenceRef: nanobotTurnNativeExactReplayRefForKey(key),
    fixtureID: nanobotTurnNativeExactFixtureIDForKey(key),
  }
}

function nanobotTurnNativeExactStageID(key: NanobotTurnNativeExactAtomKey): ProductTurnReplayStageID {
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

function nanobotTurnNativeExactSpec(key: NanobotTurnNativeExactAtomKey): Omit<NanobotTurnNativeExactRecord, "key" | "atomID" | "portID" | "stageID" | "evidenceRef" | "fixtureID"> {
  switch (key) {
    case "input-normalizer":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#AgentRunSpec.initial_messages",
          "nanobot/agent/runner.py#AgentRunner.run",
          "nanobot/session/goal_state.py#GoalState",
        ],
        nativeSemantics: [
          "AgentRunner seeds each run from a shallow copy of AgentRunSpec.initial_messages before any provider request.",
          "Workspace, session_key, hook, max_iterations, and injected messages remain run-spec inputs instead of being collapsed into a shared text prompt.",
          "Injected user messages are drained between provider/tool phases and merged into the native messages list before the next iteration.",
        ],
        eventOrder: ["copy initial_messages", "before_iteration", "provider request", "drain injections"],
      }
    case "context-builder":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#_drop_orphan_tool_results",
          "nanobot/agent/runner.py#_backfill_missing_tool_results",
          "nanobot/agent/runner.py#_microcompact",
          "nanobot/agent/runner.py#_apply_tool_result_budget",
          "nanobot/agent/runner.py#_snip_history",
        ],
        nativeSemantics: [
          "Each iteration normalizes tool-result adjacency by dropping orphan tool results and backfilling missing tool results before model IO.",
          "Microcompaction, tool-result budgeting, and snipping run on the mutable message history before the provider request is built.",
          "Orphan cleanup and tool-result backfill are repeated after compaction so the final provider-facing context stays OpenAI tool-call valid.",
        ],
        eventOrder: ["drop orphan tool results", "backfill missing tool results", "microcompact", "budget tool results", "snip history", "repeat cleanup"],
      }
    case "prompt-assembler":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#AgentHookContext",
          "nanobot/agent/runner.py#hook.before_iteration",
          "nanobot/utils/runtime.py#build_finalization_retry_message",
          "nanobot/utils/runtime.py#build_length_recovery_message",
        ],
        nativeSemantics: [
          "Prompt assembly is the governed message list plus hook-visible AgentHookContext, not a synthetic common prompt wrapper.",
          "Before-iteration hooks can inspect and mutate the native run context immediately before the provider request.",
          "Finalization retry, max-iteration, and length recovery prompts come from Nanobot runtime templates when those native branches fire.",
        ],
        eventOrder: ["build hook context", "hook.before_iteration", "provider request kwargs", "runtime template on recovery branch"],
      }
    case "provider-request-builder":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#_build_request_kwargs",
          "nanobot/agent/tools/registry.py#ToolRegistry.get_definitions",
          "nanobot/providers/openai_compat_provider.py#OpenAICompatibleProvider",
        ],
        nativeSemantics: [
          "_build_request_kwargs passes messages, tools from ToolRegistry.get_definitions, model, retry mode, and retry callback as the provider request core.",
          "Temperature, max_tokens, and reasoning_effort are included only when the AgentRunSpec provides them.",
          "Provider retry mode defaults to standard and remains part of the provider request boundary.",
        ],
        eventOrder: ["collect tool definitions", "_build_request_kwargs", "provider.chat*"],
      }
    case "provider-stream-runner":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#_request_model",
          "nanobot/providers/base.py#LLMProvider.chat_stream_with_retry",
          "nanobot/providers/base.py#LLMProvider.chat_with_retry",
        ],
        nativeSemantics: [
          "_request_model chooses chat_stream_with_retry when the hook wants streaming, progress-delta streaming when the provider supports it, or chat_with_retry otherwise.",
          "LLM timeout is scoped to the request path and defaults from NANOBOT_LLM_TIMEOUT_S when the run spec does not override it.",
          "Reasoning, content, and retry-wait callbacks are surfaced through the native hook/progress interfaces rather than through a common stream shim.",
        ],
        eventOrder: ["choose stream/progress/sync path", "provider retry loop", "content/reasoning callbacks", "LLMResponse"],
      }
    case "stream-reducer":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#_request_model",
          "nanobot/utils/helpers.py#extract_reasoning",
          "nanobot/utils/helpers.py#strip_think",
          "nanobot/utils/helpers.py#build_assistant_message",
        ],
        nativeSemantics: [
          "The provider LLMResponse is reduced into reasoning, visible content, tool calls, finish reason, and usage before loop routing.",
          "Reasoning is extracted and emitted separately from visible assistant content when the hook requests it.",
          "Assistant messages are built from the native LLMResponse content and tool call request objects without changing tool_call_id identity.",
        ],
        eventOrder: ["LLMResponse", "extract reasoning", "emit reasoning/content", "build assistant message"],
      }
    case "tool-call-planner":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#response.should_execute_tools",
          "nanobot/agent/runner.py#response.tool_calls",
          "nanobot/agent/runner.py#hook.before_execute_tools",
        ],
        nativeSemantics: [
          "Tool planning is gated by response.should_execute_tools and the provider-returned tool_calls array.",
          "The assistant message is appended before tool execution so tool results reference the native provider tool_call_id values.",
          "before_execute_tools observes the native call list and can intervene before _execute_tools starts.",
        ],
        eventOrder: ["provider response", "append assistant tool-call message", "checkpoint awaiting_tools", "hook.before_execute_tools"],
      }
    case "tool-executor":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#_execute_tools",
          "nanobot/agent/tools/registry.py#ToolRegistry.execute",
          "nanobot/utils/runtime.py#ensure_nonempty_tool_result",
          "nanobot/utils/helpers.py#maybe_persist_tool_result",
        ],
        nativeSemantics: [
          "_execute_tools dispatches the native tool call requests through the Nanobot ToolRegistry and records tool_events.",
          "Tool results are normalized to nonempty role tool messages with tool_call_id and name preserved from the provider request.",
          "Fatal tool errors respect fail_on_tool_error and stop the run with tool_error instead of entering a synthetic continuation loop.",
        ],
        eventOrder: ["_execute_tools", "registry.execute", "normalize result", "append role tool message", "checkpoint tools_completed"],
      }
    case "result-recorder":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#AgentRunResult",
          "nanobot/agent/runner.py#checkpoint",
          "nanobot/utils/helpers.py#maybe_persist_tool_result",
        ],
        nativeSemantics: [
          "Assistant, tool, recovery, injection, and final messages are appended to the same native messages list returned by AgentRunResult.",
          "Checkpoints expose awaiting_tools, tools_completed, final_response, max_iterations, and error boundaries to the native hook layer.",
          "AgentRunResult carries final_content, messages, tools_used, usage, stop_reason, error, tool_events, and injection state directly from the run loop.",
        ],
        eventOrder: ["append assistant/tool/final message", "checkpoint", "AgentRunResult"],
      }
    case "retry-policy":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#provider_retry_mode",
          "nanobot/agent/runner.py#_request_model",
          "nanobot/agent/runner.py#_request_finalization_retry",
          "nanobot/utils/runtime.py#EMPTY_FINAL_RESPONSE_MESSAGE",
        ],
        nativeSemantics: [
          "Provider retries are delegated to the selected provider with retry_mode standard and a retry wait callback.",
          "Empty assistant content is retried up to the native empty-response budget before returning the EMPTY_FINAL_RESPONSE_MESSAGE branch.",
          "Length stops run the native finalization retry and length-recovery message branches instead of a common fixed retry atom.",
        ],
        eventOrder: ["provider retry callback", "empty response retry", "finalization retry", "length recovery"],
      }
    case "continuation-policy":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#AgentRunner.run",
          "nanobot/agent/runner.py#_try_drain_injections",
          "nanobot/utils/runtime.py#build_length_recovery_message",
        ],
        nativeSemantics: [
          "Tool-call turns continue by re-entering the next iteration with appended native role tool messages.",
          "Injected user messages are drained after tool and final branches so out-of-band user input becomes ordinary native messages.",
          "Length recovery appends Nanobot's recovery message and continues within the bounded recovery loop.",
        ],
        eventOrder: ["tool messages appended", "continue iteration", "drain injections", "length recovery message"],
      }
    case "compaction-policy":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#_microcompact",
          "nanobot/agent/runner.py#_apply_tool_result_budget",
          "nanobot/agent/runner.py#_snip_history",
          "nanobot/utils/helpers.py#estimate_message_tokens",
        ],
        nativeSemantics: [
          "Context governance is tied to AgentRunSpec.context_window_tokens, context_block_limit, max_tool_result_chars, and native token estimates.",
          "_microcompact targets compactable tool outputs while preserving recent context according to Nanobot's keep-recent policy.",
          "_snip_history trims older history only after tool-result budgeting and adjacency repair have run.",
        ],
        eventOrder: ["estimate tokens", "microcompact", "tool result budget", "snip history", "repair adjacency"],
      }
    case "stop-condition":
      return {
        upstreamAnchors: [
          "nanobot/agent/runner.py#AgentRunner.run",
          "nanobot/agent/runner.py#_MAX_EMPTY_RETRIES",
          "nanobot/agent/runner.py#_MAX_LENGTH_RECOVERIES",
          "nanobot/utils/runtime.py#max_iterations_message.md",
        ],
        nativeSemantics: [
          "A provider response without executable tool calls appends the final assistant message and stops with final_response.",
          "Max iterations appends the configured or templated max-iterations message after bounded recovery/injection handling.",
          "Error, empty response, tool_error, max_iterations, and length recovery exhaustion are explicit native stop branches.",
        ],
        eventOrder: ["no tool calls final_response", "tool_error?", "empty_response?", "length_recovery?", "max_iterations?"],
      }
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
