import { createHash } from "node:crypto"
import type { ProductTurnReplayAtomKey, ProductTurnReplayStageID } from "../product-turn/atoms.ts"

export const hermesAgentLoopUpstreamRef = "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
export const hermesAgentLoopRequestBoundaryNativeExactAtomID = "hermes.agent-loop.request-boundary.native-like"
export const hermesAgentLoopRequestBoundaryNativeExactFixtureID = "hermes-agent-loop-request-boundary:native-exact-fixture"
export const hermesAgentLoopRequestBoundaryNativeExactEvidenceRef = "conformance:hermes-agent-loop-request-boundary-native-exact-fixture"
export const hermesAgentLoopRequestBoundaryNativeExactReplayRef = "agent-loop-request-boundary-native-exact:hermes-agent"
export const hermesAgentLoopFinalSummaryNativeExactAtomID = "hermes.agent-loop.final-summary.native-like"
export const hermesAgentLoopFinalSummaryNativeExactFixtureID = "hermes-agent-loop-final-summary:native-exact-fixture"
export const hermesAgentLoopFinalSummaryNativeExactEvidenceRef = "conformance:hermes-agent-loop-final-summary-native-exact-fixture"
export const hermesAgentLoopFinalSummaryNativeExactReplayRef = "agent-loop-final-summary-native-exact:hermes-agent"
export const hermesTurnNativeExactFixtureID = "hermes-agent-turn:native-exact-fixture"
export const hermesTurnNativeExactEvidenceRef = "conformance:hermes-agent-turn-native-exact-fixture"
export const hermesTurnNativeExactReplayRef = "turn-native-exact:hermes-agent"

export const hermesTurnNativeExactAtomKeys = [
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

export type HermesTurnNativeExactAtomKey = (typeof hermesTurnNativeExactAtomKeys)[number]

export const hermesTurnNativeExactAtomIDs = hermesTurnNativeExactAtomKeys.map((key) => hermesTurnNativeExactAtomID(key))

export interface HermesTurnNativeExactRecord {
  key: HermesTurnNativeExactAtomKey
  atomID: string
  portID: `turn.${HermesTurnNativeExactAtomKey}`
  stageID: ProductTurnReplayStageID
  upstreamAnchors: string[]
  nativeSemantics: string[]
  eventOrder: string[]
  evidenceRef: string
  fixtureID: string
}

export interface HermesTurnNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  upstreamRef: typeof hermesAgentLoopUpstreamRef
  evidenceRef: typeof hermesTurnNativeExactEvidenceRef
  fixtureID: typeof hermesTurnNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  atomIDs: string[]
  coveredKeys: HermesTurnNativeExactAtomKey[]
  records: HermesTurnNativeExactRecord[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface HermesTurnNativeExactFixtureIssue {
  id: string
  key?: HermesTurnNativeExactAtomKey
  message: string
}

export interface HermesTurnNativeExactFixtureVerification {
  ok: boolean
  issues: HermesTurnNativeExactFixtureIssue[]
}

export type HermesAgentLoopNativeExactAtomID =
  | typeof hermesAgentLoopRequestBoundaryNativeExactAtomID
  | typeof hermesAgentLoopFinalSummaryNativeExactAtomID

export interface HermesAgentLoopNativeExactRecord {
  atomID: HermesAgentLoopNativeExactAtomID
  portID: "agent-loop.request-boundary" | "agent-loop.final-summary"
  upstreamAnchors: string[]
  nativeSemantics: string[]
  eventOrder: string[]
  evidenceRef: string
  fixtureID: string
}

export interface HermesAgentLoopNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  upstreamRef: typeof hermesAgentLoopUpstreamRef
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  atomIDs: HermesAgentLoopNativeExactAtomID[]
  records: HermesAgentLoopNativeExactRecord[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface HermesAgentLoopNativeExactFixtureIssue {
  id: string
  atomID?: HermesAgentLoopNativeExactAtomID
  message: string
}

export interface HermesAgentLoopNativeExactFixtureVerification {
  ok: boolean
  issues: HermesAgentLoopNativeExactFixtureIssue[]
}

export const hermesAgentLoopRequestBoundaryNativeDescriptor = {
  id: hermesAgentLoopRequestBoundaryNativeExactAtomID,
  port: "agent-loop.request-boundary",
  product: "hermes-agent",
  implementationKind: "factory",
  selectionReason:
    "Hermes upstream native implementation for run_conversation request-boundary behavior is pinned to the native retry/tool/continuation loop, including tool-call turns, provider recovery, compression restart, interrupt handling, and max-iteration exit metadata.",
  parityCoverage: "native",
  nativeEvidenceRefs: [
    hermesAgentLoopRequestBoundaryNativeExactEvidenceRef,
    hermesAgentLoopRequestBoundaryNativeExactReplayRef,
  ],
  fixtureIDs: [hermesAgentLoopRequestBoundaryNativeExactFixtureID],
  knownLossiness: [],
} as const

export const hermesAgentLoopFinalSummaryNativeDescriptor = {
  id: hermesAgentLoopFinalSummaryNativeExactAtomID,
  port: "agent-loop.final-summary",
  product: "hermes-agent",
  implementationKind: "factory",
  selectionReason:
    "Hermes upstream native implementation for run_conversation final-summary behavior is pinned to native final assistant persistence, interim tool-call emission, scaffold cleanup, trajectory/session save, and diagnostic turn-exit metadata.",
  parityCoverage: "native",
  nativeEvidenceRefs: [
    hermesAgentLoopFinalSummaryNativeExactEvidenceRef,
    hermesAgentLoopFinalSummaryNativeExactReplayRef,
  ],
  fixtureIDs: [hermesAgentLoopFinalSummaryNativeExactFixtureID],
  knownLossiness: [],
} as const

export const hermesAgentLoopNativeExactDescriptors = [
  hermesAgentLoopRequestBoundaryNativeDescriptor,
  hermesAgentLoopFinalSummaryNativeDescriptor,
] as const

export const hermesTurnNativeExactDescriptors = hermesTurnNativeExactAtomKeys.map((key) => ({
  id: hermesTurnNativeExactAtomID(key),
  port: hermesTurnNativeExactPortID(key),
  product: "hermes-agent",
  implementationKind: "factory",
  selectionReason: `Hermes upstream native implementation with native parity complete turn ${key} exact fixture coverage.`,
  parityCoverage: "native",
  nativeEvidenceRefs: [
    hermesTurnNativeExactEvidenceRef,
    hermesTurnNativeExactReplayRef,
    hermesTurnNativeExactReplayRefForKey(key),
  ],
  fixtureIDs: [hermesTurnNativeExactFixtureID, hermesTurnNativeExactFixtureIDForKey(key)],
  knownLossiness: [],
})) as ReadonlyArray<{
  id: string
  port: `turn.${HermesTurnNativeExactAtomKey}`
  product: "hermes-agent"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
}>

export function buildHermesAgentLoopNativeExactFixture(): HermesAgentLoopNativeExactFixture {
  const records = hermesAgentLoopNativeExactRecords()
  const fixtureWithoutFingerprint: Omit<HermesAgentLoopNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "hermes-agent" as const,
    upstreamRef: hermesAgentLoopUpstreamRef,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    atomIDs: [
      hermesAgentLoopRequestBoundaryNativeExactAtomID,
      hermesAgentLoopFinalSummaryNativeExactAtomID,
    ],
    records,
    sourceRefs: [
      `${hermesAgentLoopUpstreamRef}:agent/conversation_loop.py#run_conversation,_restore_or_build_system_prompt,_try_activate_fallback`,
      `${hermesAgentLoopUpstreamRef}:agent/conversation_loop.py#run_conversation.length_continue_retries,_post_tool_empty_retried,_thinking_prefill_retries,_turn_exit_reason`,
      `${hermesAgentLoopUpstreamRef}:agent/tool_executor.py#execute_tool_calls_sequential,execute_tool_calls_concurrent`,
      `${hermesAgentLoopUpstreamRef}:agent/context_engine.py#ContextEngine.should_compress,compress`,
      `${hermesAgentLoopUpstreamRef}:agent/conversation_compression.py#compress_context`,
      `${hermesAgentLoopUpstreamRef}:agent/iteration_budget.py#IterationBudget`,
      `${hermesAgentLoopUpstreamRef}:agent/trajectory.py#save_trajectory,has_incomplete_scratchpad`,
    ],
    nativeEvidenceRefs: [
      hermesAgentLoopRequestBoundaryNativeExactEvidenceRef,
      hermesAgentLoopRequestBoundaryNativeExactReplayRef,
      hermesAgentLoopFinalSummaryNativeExactEvidenceRef,
      hermesAgentLoopFinalSummaryNativeExactReplayRef,
    ],
    fixtureIDs: [
      hermesAgentLoopRequestBoundaryNativeExactFixtureID,
      hermesAgentLoopFinalSummaryNativeExactFixtureID,
    ],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyHermesAgentLoopNativeExactFixture(
  fixture: HermesAgentLoopNativeExactFixture,
): HermesAgentLoopNativeExactFixtureVerification {
  const issues: HermesAgentLoopNativeExactFixtureIssue[] = []
  const expected = buildHermesAgentLoopNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "hermes-agent-loop-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Hermes agent-loop native content." })
  }
  if (fixture.product !== "hermes-agent" || fixture.upstreamRef !== hermesAgentLoopUpstreamRef) {
    issues.push({ id: "hermes-agent-loop-native-exact.identity", message: "Fixture must remain scoped to the pinned Hermes run_conversation loop." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "hermes-agent-loop-native-exact.native-claim", message: "Hermes agent-loop fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "hermes-agent-loop-native-exact.lossiness", message: "Native exact Hermes agent-loop fixture must not carry known lossiness markers." })
  }
  if (!sameJSON(fixture.atomIDs, expected.atomIDs) || !sameJSON(fixture.records, expected.records)) {
    issues.push({ id: "hermes-agent-loop-native-exact.records", message: "Hermes request-boundary/final-summary records drifted from the upstream behavior matrix." })
  }
  if (!fixture.sourceRefs.every((ref) => ref.includes("92a567db2d7a5031df8211efbfdad864c2f51faf"))) {
    issues.push({ id: "hermes-agent-loop-native-exact.upstream", message: "Fixture source refs must stay pinned to the Hermes upstream agent-loop sources." })
  }
  for (const descriptor of hermesAgentLoopNativeExactDescriptors) {
    const record = fixture.records.find((item) => item.atomID === descriptor.id)
    if (!record) {
      issues.push({ id: "hermes-agent-loop-native-exact.record-missing", atomID: descriptor.id, message: `Missing Hermes agent-loop native exact record for ${descriptor.id}.` })
      continue
    }
    if (!fixture.nativeEvidenceRefs.every((ref) => expected.nativeEvidenceRefs.includes(ref)) || !descriptor.nativeEvidenceRefs.every((ref) => fixture.nativeEvidenceRefs.includes(ref))) {
      issues.push({ id: "hermes-agent-loop-native-exact.evidence", atomID: descriptor.id, message: `Missing native replay evidence for ${descriptor.id}.` })
    }
    if (!descriptor.fixtureIDs.every((id) => fixture.fixtureIDs.includes(id))) {
      issues.push({ id: "hermes-agent-loop-native-exact.fixture", atomID: descriptor.id, message: `Missing native fixture id for ${descriptor.id}.` })
    }
    if (descriptor.parityCoverage !== "native" || descriptor.implementationKind !== "factory" || descriptor.knownLossiness.length > 0) {
      issues.push({ id: "hermes-agent-loop-native-exact.descriptor", atomID: descriptor.id, message: `Descriptor for ${descriptor.id} must remain native factory with no known lossiness.` })
    }
  }

  return { ok: issues.length === 0, issues }
}

export function buildHermesTurnNativeExactFixture(): HermesTurnNativeExactFixture {
  const records = hermesTurnNativeExactAtomKeys.map((key) => hermesTurnNativeExactRecord(key))
  const fixtureWithoutFingerprint: Omit<HermesTurnNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "hermes-agent" as const,
    upstreamRef: hermesAgentLoopUpstreamRef,
    evidenceRef: hermesTurnNativeExactEvidenceRef,
    fixtureID: hermesTurnNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    atomIDs: hermesTurnNativeExactAtomIDs,
    coveredKeys: [...hermesTurnNativeExactAtomKeys],
    records,
    sourceRefs: [
      `${hermesAgentLoopUpstreamRef}:agent/conversation_loop.py#run_conversation,_restore_or_build_system_prompt,_ollama_context_limit_error`,
      `${hermesAgentLoopUpstreamRef}:agent/tool_executor.py#execute_tool_calls_sequential,execute_tool_calls_concurrent,_tool_search_scoped_names`,
      `${hermesAgentLoopUpstreamRef}:agent/tool_dispatch_helpers.py#_should_parallelize_tool_batch,make_tool_result_message,_trajectory_normalize_msg`,
      `${hermesAgentLoopUpstreamRef}:agent/transports/chat_completions.py#ChatCompletionsTransport.convert_messages,convert_tools,build_kwargs,normalize_response`,
      `${hermesAgentLoopUpstreamRef}:agent/transports/types.py#ToolCall,Usage,NormalizedResponse,build_tool_call,map_finish_reason`,
      `${hermesAgentLoopUpstreamRef}:agent/context_engine.py#ContextEngine.update_from_response,should_compress,compress,update_model`,
      `${hermesAgentLoopUpstreamRef}:agent/conversation_compression.py#check_compression_model_feasibility,compress_context,replay_compression_warning`,
      `${hermesAgentLoopUpstreamRef}:agent/trajectory.py#save_trajectory,has_incomplete_scratchpad`,
    ],
    nativeEvidenceRefs: [
      hermesTurnNativeExactEvidenceRef,
      hermesTurnNativeExactReplayRef,
      ...hermesTurnNativeExactAtomKeys.map((key) => hermesTurnNativeExactReplayRefForKey(key)),
    ],
    fixtureIDs: [
      hermesTurnNativeExactFixtureID,
      ...hermesTurnNativeExactAtomKeys.map((key) => hermesTurnNativeExactFixtureIDForKey(key)),
    ],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyHermesTurnNativeExactFixture(
  fixture: HermesTurnNativeExactFixture,
): HermesTurnNativeExactFixtureVerification {
  const issues: HermesTurnNativeExactFixtureIssue[] = []
  const expected = buildHermesTurnNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "hermes-turn-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Hermes turn native content." })
  }
  if (fixture.product !== "hermes-agent" || fixture.upstreamRef !== hermesAgentLoopUpstreamRef) {
    issues.push({ id: "hermes-turn-native-exact.identity", message: "Fixture must remain scoped to the pinned Hermes upstream agent loop." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "hermes-turn-native-exact.native-claim", message: "Hermes turn fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "hermes-turn-native-exact.lossiness", message: "Native exact Hermes turn fixture must not carry known lossiness markers." })
  }
  if (!sameJSON(fixture.coveredKeys, expected.coveredKeys) || !sameJSON(fixture.atomIDs, expected.atomIDs)) {
    issues.push({ id: "hermes-turn-native-exact.coverage", message: "Hermes turn native fixture must cover the complete 13 atom turn key set." })
  }
  if (!fixture.sourceRefs.every((ref) => ref.includes("92a567db2d7a5031df8211efbfdad864c2f51faf"))) {
    issues.push({ id: "hermes-turn-native-exact.upstream", message: "Fixture source refs must stay pinned to the Hermes upstream agent loop sources." })
  }
  for (const key of hermesTurnNativeExactAtomKeys) {
    const record = fixture.records.find((item) => item.key === key)
    const descriptor = hermesTurnNativeExactDescriptorForKey(key)
    if (!record) {
      issues.push({ id: "hermes-turn-native-exact.record-missing", key, message: `Missing Hermes turn native exact record for ${key}.` })
      continue
    }
    if (!fixture.nativeEvidenceRefs.includes(hermesTurnNativeExactReplayRefForKey(key)) || !descriptor.nativeEvidenceRefs.includes(hermesTurnNativeExactReplayRefForKey(key))) {
      issues.push({ id: "hermes-turn-native-exact.evidence", key, message: `Missing per-key native replay evidence for ${key}.` })
    }
    if (!fixture.fixtureIDs.includes(hermesTurnNativeExactFixtureIDForKey(key)) || !descriptor.fixtureIDs.includes(hermesTurnNativeExactFixtureIDForKey(key))) {
      issues.push({ id: "hermes-turn-native-exact.fixture", key, message: `Missing per-key native fixture id for ${key}.` })
    }
    if (descriptor.parityCoverage !== "native" || descriptor.implementationKind !== "factory" || descriptor.knownLossiness.length > 0) {
      issues.push({ id: "hermes-turn-native-exact.descriptor", key, message: `Descriptor for ${key} must remain native factory with no known lossiness.` })
    }
  }
  if (!sameJSON(fixture.records, expected.records)) {
    issues.push({ id: "hermes-turn-native-exact.records", message: "Hermes turn native exact records drifted from the upstream behavior matrix." })
  }

  return { ok: issues.length === 0, issues }
}

export function hermesTurnNativeExactDescriptorForID(atomID: string): (typeof hermesTurnNativeExactDescriptors)[number] | undefined {
  return hermesTurnNativeExactDescriptors.find((descriptor) => descriptor.id === atomID)
}

export function hermesTurnNativeExactDescriptorForKey(key: HermesTurnNativeExactAtomKey): (typeof hermesTurnNativeExactDescriptors)[number] {
  const descriptor = hermesTurnNativeExactDescriptorForID(hermesTurnNativeExactAtomID(key))
  if (!descriptor) throw new Error(`Missing Hermes turn native exact descriptor for ${key}`)
  return descriptor
}

export function hermesTurnNativeExactAtomID(key: HermesTurnNativeExactAtomKey): `hermes.turn.${HermesTurnNativeExactAtomKey}` {
  return `hermes.turn.${key}`
}

export function hermesTurnNativeExactPortID(key: HermesTurnNativeExactAtomKey): `turn.${HermesTurnNativeExactAtomKey}` {
  return `turn.${key}`
}

export function hermesTurnNativeExactFixtureIDForKey(key: HermesTurnNativeExactAtomKey): string {
  return `hermes-agent-turn:${key}:native-exact-fixture`
}

export function hermesTurnNativeExactReplayRefForKey(key: HermesTurnNativeExactAtomKey): string {
  return `turn-native-exact:hermes-agent:${key}`
}

function hermesAgentLoopNativeExactRecords(): HermesAgentLoopNativeExactRecord[] {
  return [
    {
      atomID: hermesAgentLoopRequestBoundaryNativeExactAtomID,
      portID: "agent-loop.request-boundary",
      upstreamAnchors: [
        "agent/conversation_loop.py#run_conversation.main while loop",
        "agent/conversation_loop.py#run_conversation.invalid_tool_calls",
        "agent/conversation_loop.py#run_conversation.compression restart",
        "agent/conversation_loop.py#run_conversation._handle_max_iterations",
        "agent/tool_executor.py#execute_tool_calls_sequential,execute_tool_calls_concurrent",
      ],
      nativeSemantics: [
        "Hermes continues the same turn after valid tool calls by appending the assistant tool-call message, executing tools through the native executor, appending ordered tool result messages, applying tool steering, and issuing the next provider request.",
        "Invalid tool names or arguments consume native retry counters and append recovery tool-role messages only when the provider transcript requires role alternation.",
        "Provider context errors can compress and restart the current provider request without turning into a common stop boundary.",
        "User interrupts, guardrail halts, exhausted IterationBudget, provider failures, partial truncation exhaustion, and max_iterations set the native diagnostic turn_exit_reason before persistence.",
      ],
      eventOrder: [
        "budget and interrupt check",
        "build API messages",
        "provider request",
        "normalize response",
        "validate or repair tool calls",
        "append assistant tool-call turn",
        "execute native tool batch",
        "append tool results",
        "continue, recover, or stop",
      ],
      evidenceRef: hermesAgentLoopRequestBoundaryNativeExactReplayRef,
      fixtureID: hermesAgentLoopRequestBoundaryNativeExactFixtureID,
    },
    {
      atomID: hermesAgentLoopFinalSummaryNativeExactAtomID,
      portID: "agent-loop.final-summary",
      upstreamAnchors: [
        "agent/conversation_loop.py#run_conversation._build_assistant_message",
        "agent/conversation_loop.py#run_conversation._emit_interim_assistant_message",
        "agent/conversation_loop.py#run_conversation._persist_session",
        "agent/trajectory.py#save_trajectory",
      ],
      nativeSemantics: [
        "Hermes' final answer is the provider assistant content after native reasoning, scratchpad, truncation, and recovery handling; no common concise-summary round is inserted on successful completion.",
        "Tool-call turns emit interim assistant messages, while final assistant messages remove recovery scaffolding and preserve finish_reason, reasoning, provider metadata, and same-turn reasoning readback.",
        "Turn completion saves trajectory data, persists session state, records token/cost totals, updates memory/skill review nudges, and returns the structured run_conversation result object.",
      ],
      eventOrder: [
        "normalize final assistant content",
        "strip recovery scaffolding",
        "emit interim or final assistant display",
        "save trajectory",
        "persist session",
        "record usage/cost",
        "return structured result",
      ],
      evidenceRef: hermesAgentLoopFinalSummaryNativeExactReplayRef,
      fixtureID: hermesAgentLoopFinalSummaryNativeExactFixtureID,
    },
  ]
}

function hermesTurnNativeExactRecord(key: HermesTurnNativeExactAtomKey): HermesTurnNativeExactRecord {
  const spec = hermesTurnNativeExactSpec(key)
  return {
    key,
    atomID: hermesTurnNativeExactAtomID(key),
    portID: hermesTurnNativeExactPortID(key),
    stageID: hermesTurnNativeExactStageID(key),
    upstreamAnchors: spec.upstreamAnchors,
    nativeSemantics: spec.nativeSemantics,
    eventOrder: spec.eventOrder,
    evidenceRef: hermesTurnNativeExactReplayRefForKey(key),
    fixtureID: hermesTurnNativeExactFixtureIDForKey(key),
  }
}

function hermesTurnNativeExactStageID(key: HermesTurnNativeExactAtomKey): ProductTurnReplayStageID {
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

function hermesTurnNativeExactSpec(key: HermesTurnNativeExactAtomKey): Omit<HermesTurnNativeExactRecord, "key" | "atomID" | "portID" | "stageID" | "evidenceRef" | "fixtureID"> {
  switch (key) {
    case "input-normalizer":
      return {
        upstreamAnchors: [
          "agent/conversation_loop.py#run_conversation.user_message",
          "agent/conversation_loop.py#run_conversation.persist_user_message",
          "gateway/session_context.py#set_session_context",
        ],
        nativeSemantics: [
          "run_conversation sanitizes surrogate input, preserves a persisted display override, binds session/task context, and appends the current user message to a copied conversation history.",
          "Gateway-created agents hydrate todo and turn counters from prior OpenAI-message history before the first provider request.",
          "The effective task id is exposed before tool dispatch so child tools and delegated agents inherit the real turn boundary.",
        ],
        eventOrder: ["ensure db session", "bind runtime/session context", "copy conversation history", "append user message", "hydrate counters"],
      }
    case "context-builder":
      return {
        upstreamAnchors: [
          "agent/conversation_loop.py#_restore_or_build_system_prompt",
          "agent/conversation_loop.py#run_conversation.api_messages",
          "agent/conversation_loop.py#run_conversation._sanitize_api_messages",
          "agent/context_engine.py#ContextEngine",
        ],
        nativeSemantics: [
          "Hermes restores a cached session system prompt from SQLite when continuing a conversation and rebuilds it only when no stored prompt is available or compression invalidates it.",
          "Per-call API messages are a sanitized copy: reasoning fields are copied to provider-facing fields, finish_reason and internal markers are removed, orphan tool results are repaired, and thinking-only turns are dropped from the provider copy.",
          "External recall and plugin pre_llm_call context are injected into the current user message only, leaving the stable system prompt cache prefix unchanged.",
        ],
        eventOrder: ["restore cached system prompt", "copy messages for API", "inject ephemeral user context", "sanitize tool/reasoning fields", "repair provider message sequence"],
      }
    case "prompt-assembler":
      return {
        upstreamAnchors: [
          "agent/conversation_loop.py#run_conversation.active_system_prompt",
          "agent/conversation_loop.py#run_conversation.ephemeral_system_prompt",
          "agent/conversation_loop.py#run_conversation.prefill_messages",
          "agent/prompt_builder.py#DEVELOPER_ROLE_MODELS",
        ],
        nativeSemantics: [
          "The provider prompt is assembled from Hermes' cached system prompt plus optional ephemeral system prompt and prefill messages at API-call time only.",
          "Plugin pre_llm_call additions are intentionally appended to the user message rather than the system prompt to preserve upstream prompt-cache prefix behavior.",
          "ChatCompletionsTransport later swaps system to developer role for model families listed by Hermes prompt_builder.",
        ],
        eventOrder: ["cached system prompt", "append ephemeral system prompt", "insert prefill messages", "transport developer-role swap"],
      }
    case "provider-request-builder":
      return {
        upstreamAnchors: [
          "agent/transports/chat_completions.py#ChatCompletionsTransport.convert_messages",
          "agent/transports/chat_completions.py#ChatCompletionsTransport.convert_tools",
          "agent/transports/chat_completions.py#ChatCompletionsTransport.build_kwargs",
        ],
        nativeSemantics: [
          "ChatCompletionsTransport strips Codex response metadata, tool_name, provider-internal call ids, and underscore-prefixed Hermes scaffolding before building chat.completions.create kwargs.",
          "Tools are passed as OpenAI-format definitions, with Moonshot/Kimi schema normalization when the target model requires it.",
          "Provider profiles or legacy provider flags decide timeout, temperature, max token parameter name, reasoning configuration, OpenRouter routing, Gemini thinking config, request overrides, and extra_body.",
        ],
        eventOrder: ["sanitize messages", "profile or legacy kwargs path", "attach tools", "resolve max tokens", "merge provider extras", "apply request overrides"],
      }
    case "provider-stream-runner":
      return {
        upstreamAnchors: [
          "agent/conversation_loop.py#run_conversation._interruptible_streaming_api_call",
          "agent/conversation_loop.py#run_conversation._interruptible_api_call",
          "agent/retry_utils.py#jittered_backoff",
        ],
        nativeSemantics: [
          "The turn loop chooses Hermes' interruptible streaming call path when stream consumers are active and the interruptible non-streaming path otherwise.",
          "Provider retries keep gateway liveness updated during backoff and abort cleanly when a user interrupt arrives during model wait or retry sleep.",
          "Invalid responses, provider fallback activation, auth refresh, image shrinking, and compression restart all happen inside the native provider retry loop before response reduction.",
        ],
        eventOrder: ["build api kwargs", "choose streaming or sync call", "validate response", "retry or fallback on error", "return normalized response candidate"],
      }
    case "stream-reducer":
      return {
        upstreamAnchors: [
          "agent/transports/chat_completions.py#ChatCompletionsTransport.normalize_response",
          "agent/transports/types.py#NormalizedResponse",
          "agent/transports/types.py#ToolCall",
          "agent/conversation_loop.py#run_conversation.assistant_message",
        ],
        nativeSemantics: [
          "Chat completion choices are reduced to NormalizedResponse content, tool_calls, finish_reason, reasoning, usage, and provider_data.",
          "Provider-specific tool call metadata such as Gemini extra_content is preserved on ToolCall.provider_data while exposing tc.function.name and tc.function.arguments for the loop.",
          "The loop normalizes non-string assistant content into visible text before handling reasoning callbacks, incomplete scratchpads, tool calls, or final text.",
        ],
        eventOrder: ["transport.normalize_response", "normalize assistant content", "emit reasoning progress", "route by finish_reason/tool_calls/content"],
      }
    case "tool-call-planner":
      return {
        upstreamAnchors: [
          "agent/conversation_loop.py#run_conversation.assistant_message.tool_calls",
          "agent/conversation_loop.py#run_conversation._repair_tool_call",
          "agent/tool_dispatch_helpers.py#_should_parallelize_tool_batch",
        ],
        nativeSemantics: [
          "Tool planning is driven by provider-returned tool_calls after Hermes repairs known tool-name aliases and validates the names against the current session registry.",
          "Invalid tool names and invalid JSON arguments consume native retry counters and either retry the model call or append tool-role recovery messages preserving role alternation.",
          "Before execution Hermes caps delegate_task calls, deduplicates tool calls, appends the assistant tool-call message, and relies on batch-parallel rules for executor selection.",
        ],
        eventOrder: ["detect tool_calls", "repair and validate names", "validate JSON arguments", "dedupe/cap calls", "append assistant tool-call turn"],
      }
    case "tool-executor":
      return {
        upstreamAnchors: [
          "agent/tool_executor.py#execute_tool_calls_sequential",
          "agent/tool_executor.py#execute_tool_calls_concurrent",
          "agent/tool_dispatch_helpers.py#make_tool_result_message",
          "tools/tool_result_storage.py#maybe_persist_tool_result,enforce_turn_budget",
        ],
        nativeSemantics: [
          "Sequential and concurrent executor paths parse JSON arguments, unwrap tool_search only when the underlying tool is in the session-scoped deferrable set, and apply plugin/guardrail blocks before real execution.",
          "Concurrent execution collects worker results into original tool-call order before appending role tool messages so provider tool_call_id sequencing remains valid.",
          "Tool result persistence, multimodal conversion, subdirectory hints, per-tool steering drain, aggregate result budget enforcement, and final steering injection all run before the next API call.",
        ],
        eventOrder: ["scope and guard tool calls", "checkpoint mutable tools", "invoke tools", "append ordered tool results", "budget and steer results"],
      }
    case "result-recorder":
      return {
        upstreamAnchors: [
          "agent/conversation_loop.py#run_conversation._build_assistant_message",
          "agent/conversation_loop.py#run_conversation._emit_interim_assistant_message",
          "agent/conversation_loop.py#run_conversation._persist_session",
          "agent/trajectory.py#save_trajectory",
        ],
        nativeSemantics: [
          "Hermes appends native assistant messages before tool execution and final assistant messages after no-tool completion, preserving finish_reason, reasoning, and provider tool ids.",
          "Tool-call turns are emitted as interim assistant messages, while final turns remove internal recovery scaffolding before durable session persistence.",
          "At turn completion Hermes saves trajectory data, persists JSON/SQLite session state, records token/cost totals, extracts last same-turn reasoning, and returns the structured result object.",
        ],
        eventOrder: ["append assistant message", "emit interim or final display", "drop private scaffolding", "save trajectory", "persist session", "return turn result"],
      }
    case "retry-policy":
      return {
        upstreamAnchors: [
          "agent/conversation_loop.py#run_conversation.retry_count",
          "agent/error_classifier.py#classify_api_error",
          "agent/retry_utils.py#jittered_backoff",
          "agent/conversation_loop.py#run_conversation._try_activate_fallback",
        ],
        nativeSemantics: [
          "The provider retry loop classifies API errors for retry, compression, fallback rotation, auth refresh, image shrink, and non-retryable client failure decisions.",
          "Invalid API responses and provider errors use jittered exponential backoff with separate caps and heartbeat activity updates during wait.",
          "Fallback activation resets retry/compression counters and resumes inside the same turn without collapsing the Hermes session history.",
        ],
        eventOrder: ["classify response or API error", "optional recovery mutation", "fallback or retry", "jittered backoff", "abort on exhausted retries"],
      }
    case "continuation-policy":
      return {
        upstreamAnchors: [
          "agent/conversation_loop.py#run_conversation.length_continue_retries",
          "agent/conversation_loop.py#run_conversation._post_tool_empty_retried",
          "agent/conversation_loop.py#run_conversation._thinking_prefill_retries",
          "agent/trajectory.py#has_incomplete_scratchpad",
        ],
        nativeSemantics: [
          "Length-truncated text appends an interim assistant message plus Hermes continuation user prompt, then boosts the next output-token budget for the same turn.",
          "After tool results, an empty assistant response gets one native nudge message that preserves role alternation before retrying the model.",
          "Thinking-only responses are replayed as incomplete assistant prefill up to two times, while incomplete scratchpads and Codex incomplete states have their own bounded retry counters.",
        ],
        eventOrder: ["detect truncation or empty response", "append native recovery scaffold", "continue same turn", "strip scaffold on success", "return partial when exhausted"],
      }
    case "compaction-policy":
      return {
        upstreamAnchors: [
          "agent/conversation_loop.py#run_conversation.preflight compression",
          "agent/context_engine.py#ContextEngine.should_compress",
          "agent/conversation_compression.py#compress_context",
          "agent/conversation_loop.py#run_conversation.restart_with_compressed_messages",
        ],
        nativeSemantics: [
          "Hermes performs preflight context compression when rough request size exceeds the active context engine threshold and repeats up to three passes for very large histories.",
          "Provider context errors can route into compression inside the retry loop, reset retry counters, refund the API-call budget, and restart the provider request with compressed messages.",
          "compress_context runs the configured context engine, rotates/splits the SQLite session, rebuilds the system prompt, notifies memory/context providers, and marks usage as awaiting real post-compression counts.",
        ],
        eventOrder: ["rough token estimate", "should_compress", "compress context and rotate session", "clear conversation_history cursor", "restart provider request"],
      }
    case "stop-condition":
      return {
        upstreamAnchors: [
          "agent/conversation_loop.py#run_conversation.while",
          "agent/iteration_budget.py#IterationBudget",
          "agent/conversation_loop.py#run_conversation._turn_exit_reason",
          "agent/conversation_loop.py#run_conversation._handle_max_iterations",
        ],
        nativeSemantics: [
          "The main loop stops on user interrupt, exhausted max_iterations or IterationBudget, guardrail halt, provider failure, truncated partial return, or a no-tool assistant text response.",
          "Tool-call turns continue the loop after execution, with execute_code-only turns refunded and grace calls consumed explicitly.",
          "Completed status requires final_response, no interrupt, no failure, and api_call_count below max_iterations, while diagnostic turn_exit_reason is persisted into logs and result metadata.",
        ],
        eventOrder: ["loop budget check", "interrupt check", "tool branch continues", "text branch breaks", "max-iteration handler", "persist final result metadata"],
      }
  }
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`
  }
  return JSON.stringify(value)
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
}
