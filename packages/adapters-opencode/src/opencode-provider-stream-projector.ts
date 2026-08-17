import { createHash } from "node:crypto"
import {
  captureOpenCodeProviderEventObserverNativeExactFixture,
  createOpenCodeProviderEventObserverBridge,
  type OpenCodeProviderEventObserverAISDKEvent,
  type OpenCodeProviderEventObserverLLMEvent,
} from "./opencode-provider-event-observer.ts"

export const openCodeProviderStreamUpstreamRef = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
export const openCodeProviderStreamNativeExactFixtureID = "opencode-provider-stream-projector:native-exact-fixture"
export const openCodeProviderStreamNativeExactEvidenceRef = "conformance:opencode-provider-stream-projector-native-exact-fixture"
export const openCodeProviderStreamNativeExactReplayRef = "provider-stream-projector-native-exact:opencode"
export const openCodeProviderStreamingDeltaRecorderNativeExactAtomID = "opencode.provider.streaming-delta-recorder.native-like"
export const openCodeProviderStreamProjectorNativeExactAtomID = "opencode.provider.stream-projector.native-like"

export type OpenCodeProviderStreamNativeExactAtomID =
  | typeof openCodeProviderStreamingDeltaRecorderNativeExactAtomID
  | typeof openCodeProviderStreamProjectorNativeExactAtomID

export type OpenCodeProviderStreamNativeExactPortID = "provider.streaming-delta-recorder" | "provider.stream-projector"
export type OpenCodeProviderStreamNativeExactScenarioID =
  | "session-visible-stream-deltas"
  | "ignored-non-session-visible-chunks"
  | "tool-error-preserves-cause"
  | "finish-resets-stream-state"

export interface OpenCodeProviderStreamProjectionSummary {
  eventTypes: string[]
  deltaEventTypes: string[]
  textDeltaCount: number
  reasoningDeltaCount: number
  toolJSONDeltaCount: number
  finishReasons: string[]
  providerMetadataEventTypes: string[]
  usageEventTypes: string[]
}

export interface OpenCodeProviderStreamNativeExactCase {
  scenarioID: OpenCodeProviderStreamNativeExactScenarioID
  sourceCaseID: string
  actualEvents: OpenCodeProviderEventObserverLLMEvent[]
  expectedEvents: OpenCodeProviderEventObserverLLMEvent[]
  actualProjection: OpenCodeProviderStreamProjectionSummary
  expectedProjection: OpenCodeProviderStreamProjectionSummary
  upstreamBehavior: string
}

export interface OpenCodeProviderStreamNativeDescriptor {
  id: OpenCodeProviderStreamNativeExactAtomID
  port: OpenCodeProviderStreamNativeExactPortID
  product: "opencode"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof openCodeProviderStreamNativeExactEvidenceRef, typeof openCodeProviderStreamNativeExactReplayRef]
  fixtureIDs: [typeof openCodeProviderStreamNativeExactFixtureID]
  knownLossiness: []
}

export interface OpenCodeProviderStreamNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: readonly [
    typeof openCodeProviderStreamingDeltaRecorderNativeExactAtomID,
    typeof openCodeProviderStreamProjectorNativeExactAtomID,
  ]
  portIDs: readonly ["provider.streaming-delta-recorder", "provider.stream-projector"]
  upstreamRef: typeof openCodeProviderStreamUpstreamRef
  evidenceRef: typeof openCodeProviderStreamNativeExactEvidenceRef
  replayRef: typeof openCodeProviderStreamNativeExactReplayRef
  fixtureID: typeof openCodeProviderStreamNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    aiSDKFullStreamIsProjectedThroughLLMEvents: true
    streamingDeltaRecorderUsesProjectedLLMEventOrder: true
    streamProjectorPreservesSessionVisibleTextReasoningToolFinishAndUsage: true
    ignoredAISDKChunksDoNotCreateSessionVisibleDeltas: true
    finishResetsAdapterState: true
  }
  sourceRefs: string[]
  nativeEvidenceRefs: [typeof openCodeProviderStreamNativeExactEvidenceRef, typeof openCodeProviderStreamNativeExactReplayRef]
  fixtureIDs: [typeof openCodeProviderStreamNativeExactFixtureID]
  descriptors: readonly [OpenCodeProviderStreamNativeDescriptor, OpenCodeProviderStreamNativeDescriptor]
  cases: OpenCodeProviderStreamNativeExactCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderStreamNativeExactIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderStreamNativeExactVerification {
  ok: boolean
  issues: OpenCodeProviderStreamNativeExactIssue[]
}

export const openCodeProviderStreamingDeltaRecorderNativeDescriptor = openCodeProviderStreamNativeDescriptor(
  openCodeProviderStreamingDeltaRecorderNativeExactAtomID,
  "provider.streaming-delta-recorder",
  "OpenCode upstream native implementation for recording provider stream deltas after AI SDK fullStream is projected through LLMAISDK.toLLMEvents, preserving session-visible event order, finish reasons, usage, provider metadata, and ignored raw chunk behavior.",
)

export const openCodeProviderStreamProjectorNativeDescriptor = openCodeProviderStreamNativeDescriptor(
  openCodeProviderStreamProjectorNativeExactAtomID,
  "provider.stream-projector",
  "OpenCode upstream native implementation for provider stream projection from AI SDK fullStream to LLMEvent, including text/reasoning/tool/result/error/finish event mapping, implicit block IDs, usage folding, and finish-time adapter reset.",
)

export const openCodeProviderStreamNativeDescriptors = [
  openCodeProviderStreamingDeltaRecorderNativeDescriptor,
  openCodeProviderStreamProjectorNativeDescriptor,
] as const

export const openCodeProviderStreamNativeExactAtomIDs = openCodeProviderStreamNativeDescriptors.map((descriptor) => descriptor.id)

export function projectOpenCodeProviderStreamEvents(
  input: OpenCodeProviderEventObserverAISDKEvent[],
): OpenCodeProviderEventObserverLLMEvent[] {
  const bridge = createOpenCodeProviderEventObserverBridge()
  return bridge.observeEvents(input)
}

export function summarizeOpenCodeProviderStreamProjection(
  events: OpenCodeProviderEventObserverLLMEvent[],
): OpenCodeProviderStreamProjectionSummary {
  return {
    eventTypes: events.map((event) => event.type),
    deltaEventTypes: events.filter(isDeltaEvent).map((event) => event.type),
    textDeltaCount: events.filter((event) => event.type === "text-delta").length,
    reasoningDeltaCount: events.filter((event) => event.type === "reasoning-delta").length,
    toolJSONDeltaCount: events.filter((event) => event.type === "tool-input-delta").length,
    finishReasons: events.flatMap((event) =>
      event.type === "finish" || event.type === "step-finish" ? [event.reason] : [],
    ),
    providerMetadataEventTypes: events.filter(hasProviderMetadata).map((event) => event.type),
    usageEventTypes: events.filter(hasUsage).map((event) => event.type),
  }
}

export function captureOpenCodeProviderStreamProjectorNativeExactFixture(): OpenCodeProviderStreamNativeExactFixture {
  const eventFixture = captureOpenCodeProviderEventObserverNativeExactFixture()
  const cases: OpenCodeProviderStreamNativeExactCase[] = [
    providerStreamCase(eventFixture, "session-visible-stream-deltas", "session-visible-stream-chunks", "OpenCode LLMAISDK.toLLMEvents maps AI SDK start/text/reasoning/tool/result/finish chunks to session-visible LLMEvent deltas without dropping provider metadata, usage, or finish reason fields."),
    providerStreamCase(eventFixture, "ignored-non-session-visible-chunks", "ignored-non-session-visible-chunks", "OpenCode explicitly ignores AI SDK abort/source/file/raw/tool approval chunks at the provider stream projection boundary."),
    providerStreamCase(eventFixture, "tool-error-preserves-cause", "tool-error-preserves-cause", "OpenCode provider stream projection emits tool-error with the upstream error message and original cause object."),
    providerStreamCase(eventFixture, "finish-resets-stream-state", "finish-resets-reused-state", "OpenCode finish resets the adapter state so a reused stream projector starts text/reasoning IDs and step index from zero."),
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomIDs: [
      openCodeProviderStreamingDeltaRecorderNativeExactAtomID,
      openCodeProviderStreamProjectorNativeExactAtomID,
    ] as const,
    portIDs: ["provider.streaming-delta-recorder", "provider.stream-projector"] as const,
    upstreamRef: openCodeProviderStreamUpstreamRef,
    evidenceRef: openCodeProviderStreamNativeExactEvidenceRef,
    replayRef: openCodeProviderStreamNativeExactReplayRef,
    fixtureID: openCodeProviderStreamNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      aiSDKFullStreamIsProjectedThroughLLMEvents: true,
      streamingDeltaRecorderUsesProjectedLLMEventOrder: true,
      streamProjectorPreservesSessionVisibleTextReasoningToolFinishAndUsage: true,
      ignoredAISDKChunksDoNotCreateSessionVisibleDeltas: true,
      finishResetsAdapterState: true,
    },
    sourceRefs: [
      `${openCodeProviderStreamUpstreamRef}:packages/opencode/src/session/llm/ai-sdk.ts#adapterState,toLLMEvents,usage,finishReason`,
      `${openCodeProviderStreamUpstreamRef}:packages/opencode/src/session/llm.ts#LLM.run,fullStream,LLMAISDK.toLLMEvents`,
      `${openCodeProviderStreamUpstreamRef}:packages/opencode/test/session/llm.test.ts#session.llm.ai-sdk adapter`,
      "fixture-share:opencode.provider.event-observer:opencode-provider-event-observer:native-exact-fixture",
    ],
    nativeEvidenceRefs: [openCodeProviderStreamNativeExactEvidenceRef, openCodeProviderStreamNativeExactReplayRef] as const,
    fixtureIDs: [openCodeProviderStreamNativeExactFixtureID] as const,
    descriptors: openCodeProviderStreamNativeDescriptors,
    cases,
    knownLossiness: [] as [],
  } satisfies Omit<OpenCodeProviderStreamNativeExactFixture, "fingerprint">
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderStreamProjectorNativeExactFixture(
  fixture: OpenCodeProviderStreamNativeExactFixture,
): OpenCodeProviderStreamNativeExactVerification {
  const issues: OpenCodeProviderStreamNativeExactIssue[] = []
  const expected = captureOpenCodeProviderStreamProjectorNativeExactFixture()
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture

  if (!sameJSON(fixture.atomIDs, expected.atomIDs) || !sameJSON(fixture.portIDs, expected.portIDs)) {
    issues.push({ id: "opencode-provider-stream-projector-native-exact.identity", message: "OpenCode provider stream fixture identity drifted." })
  }
  if (fixture.upstreamRef !== openCodeProviderStreamUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab") || ref.startsWith("fixture-share:"))) {
    issues.push({ id: "opencode-provider-stream-projector-native-exact.upstream", message: "OpenCode provider stream fixture must stay pinned to the audited upstream source refs." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-provider-stream-projector-native-exact.native-claim", message: "OpenCode provider stream fixture must claim native exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-provider-stream-projector-native-exact.lossiness", message: "Native exact OpenCode provider stream fixture cannot retain known lossiness." })
  }
  if (!sameJSON(fixture.policy, expected.policy) || !sameJSON(fixture.descriptors, expected.descriptors)) {
    issues.push({ id: "opencode-provider-stream-projector-native-exact.policy", message: "OpenCode provider stream native policy or descriptor metadata drifted." })
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actualEvents, item.expectedEvents) || !sameJSON(item.actualProjection, item.expectedProjection)) {
      issues.push({ id: "opencode-provider-stream-projector-native-exact.case", caseID: item.scenarioID, message: `${item.scenarioID} no longer matches pinned upstream provider stream projection behavior.` })
    }
  }
  if (!fixture.cases.some((item) => item.scenarioID === "ignored-non-session-visible-chunks" && item.actualEvents.length === 0)) {
    issues.push({ id: "opencode-provider-stream-projector-native-exact.ignored-events", message: "Ignored AI SDK chunks must not create provider stream deltas." })
  }
  const visible = fixture.cases.find((item) => item.scenarioID === "session-visible-stream-deltas")
  if (!visible || visible.actualProjection.textDeltaCount !== 2 || visible.actualProjection.toolJSONDeltaCount !== 2 || !visible.actualProjection.finishReasons.includes("unknown")) {
    issues.push({ id: "opencode-provider-stream-projector-native-exact.visible-deltas", message: "Visible provider stream delta projection coverage is incomplete." })
  }
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-provider-stream-projector-native-exact.fingerprint", message: "OpenCode provider stream fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function openCodeProviderStreamNativeDescriptor(
  id: OpenCodeProviderStreamNativeExactAtomID,
  port: OpenCodeProviderStreamNativeExactPortID,
  selectionReason: string,
): OpenCodeProviderStreamNativeDescriptor {
  return {
    id,
    port,
    product: "opencode",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [openCodeProviderStreamNativeExactEvidenceRef, openCodeProviderStreamNativeExactReplayRef],
    fixtureIDs: [openCodeProviderStreamNativeExactFixtureID],
    knownLossiness: [],
  }
}

function providerStreamCase(
  eventFixture: ReturnType<typeof captureOpenCodeProviderEventObserverNativeExactFixture>,
  scenarioID: OpenCodeProviderStreamNativeExactScenarioID,
  sourceCaseID: string,
  upstreamBehavior: string,
): OpenCodeProviderStreamNativeExactCase {
  const source = eventFixture.cases.find((item) => item.id === sourceCaseID)
  if (!source) throw new Error(`Missing OpenCode provider event observer source case ${sourceCaseID}`)
  const actualProjection = summarizeOpenCodeProviderStreamProjection(source.actual)
  return {
    scenarioID,
    sourceCaseID,
    actualEvents: source.actual,
    expectedEvents: source.expected,
    actualProjection,
    expectedProjection: summarizeOpenCodeProviderStreamProjection(source.expected),
    upstreamBehavior,
  }
}

function isDeltaEvent(event: OpenCodeProviderEventObserverLLMEvent): boolean {
  return event.type === "text-delta" || event.type === "reasoning-delta" || event.type === "tool-input-delta"
}

function hasProviderMetadata(event: OpenCodeProviderEventObserverLLMEvent): boolean {
  return "providerMetadata" in event && event.providerMetadata !== undefined
}

function hasUsage(event: OpenCodeProviderEventObserverLLMEvent): boolean {
  return "usage" in event && event.usage !== undefined
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableJSON(left) === stableJSON(right)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableJSON(value)).digest("hex").slice(0, 16)
}

function stableJSON(value: unknown): string {
  return JSON.stringify(sortStable(value))
}

function sortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortStable(entry)]),
  )
}
