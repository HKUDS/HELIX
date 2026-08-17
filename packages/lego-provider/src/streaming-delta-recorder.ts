import { createHash } from "node:crypto"
import type { ProviderStreamEvent } from "@helix/contracts"

export type StreamingDeltaProduct = "common" | "opencode" | "pi-mono" | "nanobot" | "hermes-agent"
export type ProviderStreamReplayProduct = Exclude<StreamingDeltaProduct, "common">
export type ProviderStreamReplayAtomKey = "streaming-delta-recorder" | "stream-projector"
export type ProviderStreamReplayStageID = "provider.stream" | "stream.project"
export type ProviderStreamReplayVisibility = "observed" | "inferred"
export type ProviderRawFrameTimelineVisibility = "observed" | "inferred"
export type ProviderRawPayloadRoundTripVisibility = "observed" | "inferred"

export interface StreamingDeltaRecord {
  index: number
  eventType: ProviderStreamEvent["type"]
  semanticClass: "text" | "reasoning" | "tool-json" | "finish" | "part"
  rawChunkHash?: string
}

export interface StreamingDeltaSignature {
  atomID: string
  product: StreamingDeltaProduct
  deltaCount: number
  blockTypes: string[]
  textDeltaCount: number
  toolJSONDeltaCount: number
  finishReasons: string[]
}

export interface ProviderStreamReplayScenario {
  scenarioID: string
  providerProtocol: "openai-compatible" | "anthropic" | "google" | "openrouter" | "product-native"
  eventSequence: ProviderStreamEvent["type"][]
  observedShape: Record<string, unknown>
  visibility: ProviderStreamReplayVisibility
}

export interface ProviderStreamReplayAtomSnapshot {
  key: ProviderStreamReplayAtomKey
  atomID: string
  portID: "provider.streaming-delta-recorder" | "provider.stream-projector"
  flowStageID: ProviderStreamReplayStageID
  rawFrameTimelineFingerprint?: string
  rawFrameTimelineFixtureID?: string
  rawPayloadRoundTripFingerprint?: string
  rawPayloadRoundTripFixtureID?: string
  nativeFixtureSource: string
  upstreamEvidenceRefs: string[]
  fixtureID: string
  scenarios: ProviderStreamReplayScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
}

export interface ProviderStreamReplaySnapshot {
  schemaVersion: 1
  product: ProviderStreamReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureIDs: string[]
  profileFingerprint: string
  profile: StreamingDeltaRecorderProfile
  rawFrameTimeline: ProviderRawFrameTimelineSnapshot
  rawFrameTimelineFingerprint: string
  rawPayloadRoundTrip: ProviderRawPayloadRoundTripSnapshot
  rawPayloadRoundTripFingerprint: string
  atoms: ProviderStreamReplayAtomSnapshot[]
  coveredKeys: ProviderStreamReplayAtomKey[]
  knownGaps: string[]
  fingerprint: string
}

export interface ProviderRawFrameTimelineScenario {
  scenarioID: string
  providerProtocol: ProviderStreamReplayScenario["providerProtocol"]
  rawFrameSequence: string[]
  timingBuckets: string[]
  retrySurface: string
  cancelSurface: string
  errorSurface: string
  observedShape: Record<string, unknown>
  visibility: ProviderRawFrameTimelineVisibility
}

export interface ProviderRawFrameTimelineSnapshot {
  schemaVersion: 1
  product: ProviderStreamReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: ProviderRawFrameTimelineScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface ProviderRawPayloadRoundTripScenario {
  scenarioID: string
  providerProtocol: ProviderStreamReplayScenario["providerProtocol"]
  semanticInputShape: Record<string, unknown>
  rawPayloadShape: Record<string, unknown>
  projectedReadbackShape: Record<string, unknown>
  lossiness: string[]
  visibility: ProviderRawPayloadRoundTripVisibility
}

export interface ProviderRawPayloadRoundTripSnapshot {
  schemaVersion: 1
  product: ProviderStreamReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: ProviderRawPayloadRoundTripScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface StreamingDeltaRecorderAtomDescriptor {
  id: string
  port: "provider.streaming-delta-recorder" | "provider.stream-projector"
  product: StreamingDeltaProduct
  lossiness: "none" | "semantic-delta" | "native-projector"
  nativeFixtureSource: "none" | "opencode-native" | "pi-native" | "nanobot-native" | "hermes-native"
  replay: ProviderStreamReplayAtomSnapshot & {
    chunkClasses: StreamingDeltaRecord["semanticClass"][]
    finishReasons: string[]
    toolJSONDelta: boolean
  }
}

export interface StreamingDeltaRecorderProfile {
  product: StreamingDeltaProduct
  recorderID: string
  projectorID: string
  nativeFixtureSource: StreamingDeltaRecorderAtomDescriptor["nativeFixtureSource"]
  lossiness: StreamingDeltaRecorderAtomDescriptor["lossiness"]
}

export const streamingDeltaRecorderRegistry: Record<StreamingDeltaProduct, StreamingDeltaRecorderProfile> = {
  common: {
    product: "common",
    recorderID: "common.provider.streaming-delta-recorder",
    projectorID: "common.provider.stream-projector",
    nativeFixtureSource: "none",
    lossiness: "none",
  },
  opencode: {
    product: "opencode",
    recorderID: "opencode.provider.streaming-delta-recorder.native-like",
    projectorID: "opencode.provider.stream-projector.native-like",
    nativeFixtureSource: "opencode-native",
    lossiness: "native-projector",
  },
  "pi-mono": {
    product: "pi-mono",
    recorderID: "pi.provider.streaming-delta-recorder.native-like",
    projectorID: "pi.provider.stream-projector.native-like",
    nativeFixtureSource: "pi-native",
    lossiness: "semantic-delta",
  },
  nanobot: {
    product: "nanobot",
    recorderID: "nanobot.provider.streaming-delta-recorder.native-like",
    projectorID: "nanobot.provider.stream-projector.native-like",
    nativeFixtureSource: "nanobot-native",
    lossiness: "native-projector",
  },
  "hermes-agent": {
    product: "hermes-agent",
    recorderID: "hermes.provider.streaming-delta-recorder.native-like",
    projectorID: "hermes.provider.stream-projector.native-like",
    nativeFixtureSource: "hermes-native",
    lossiness: "semantic-delta",
  },
}

export const providerStreamReplayProducts: ProviderStreamReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
export const providerStreamReplayAtomKeys: ProviderStreamReplayAtomKey[] = ["streaming-delta-recorder", "stream-projector"]

export function recordStreamingDeltas(
  product: StreamingDeltaProduct,
  events: ProviderStreamEvent[],
  input: { rawChunks?: string[] } = {},
): StreamingDeltaSignature {
  const profile = streamingDeltaRecorderRegistry[product]
  const records = events.map((event, index): StreamingDeltaRecord => {
    const raw = input.rawChunks?.[index]
    return {
      index,
      eventType: event.type,
      semanticClass: semanticClass(event),
      ...(raw ? { rawChunkHash: stableHash(raw) } : {}),
    }
  })
  return {
    atomID: profile.recorderID,
    product,
    deltaCount: records.length,
    blockTypes: records.map((record) => record.semanticClass),
    textDeltaCount: records.filter((record) => record.semanticClass === "text" || record.semanticClass === "reasoning").length,
    toolJSONDeltaCount: records.filter((record) => record.semanticClass === "tool-json").length,
    finishReasons: events.flatMap((event) => (event.type === "finish" ? [event.finish] : [])),
  }
}

export function streamingDeltaRecorderDescriptors(product?: StreamingDeltaProduct): StreamingDeltaRecorderAtomDescriptor[] {
  const products = product ? [product] : (Object.keys(streamingDeltaRecorderRegistry) as StreamingDeltaProduct[])
  return products.flatMap((item) => {
    const profile = streamingDeltaRecorderRegistry[item]
    return [
      {
        id: profile.recorderID,
        port: "provider.streaming-delta-recorder",
        product: item,
        lossiness: profile.lossiness,
        nativeFixtureSource: profile.nativeFixtureSource,
        replay: streamReplayMetadata(profile, "streaming-delta-recorder"),
      },
      {
        id: profile.projectorID,
        port: "provider.stream-projector",
        product: item,
        lossiness: profile.lossiness,
        nativeFixtureSource: profile.nativeFixtureSource,
        replay: streamReplayMetadata(profile, "stream-projector"),
      },
    ]
  })
}

export function buildProviderStreamReplaySnapshot(product: ProviderStreamReplayProduct): ProviderStreamReplaySnapshot {
  const profile = streamingDeltaRecorderRegistry[product]
  const rawFrameTimeline = buildProviderRawFrameTimelineSnapshot(product)
  const rawPayloadRoundTrip = buildProviderRawPayloadRoundTripSnapshot(product)
  const atoms = providerStreamReplayAtomKeys.map((key) => buildProviderStreamReplayAtomSnapshot(product, key, rawFrameTimeline, rawPayloadRoundTrip))
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: providerStreamUpstreamRef(product),
    evidenceRef: `conformance:${product}-provider-stream-replay-snapshot`,
    fixtureIDs: [...atoms.map((atom) => atom.fixtureID), rawFrameTimeline.fixtureID, rawPayloadRoundTrip.fixtureID],
    profileFingerprint: fingerprintObject(profile),
    profile,
    rawFrameTimeline,
    rawFrameTimelineFingerprint: rawFrameTimeline.fingerprint,
    rawPayloadRoundTrip,
    rawPayloadRoundTripFingerprint: rawPayloadRoundTrip.fingerprint,
    atoms,
    coveredKeys: atoms.map((atom) => atom.key),
    knownGaps: [
      "raw-transport-frame-timing-not-replayed",
      "provider-specific-retry-error-cancel-paths-partial",
      "raw-frame-timeline-covered-by-partial-order-buckets",
      "raw-payload-roundtrip-covered-by-partial-fixture",
      "google-provider-raw-transport-not-replayed",
      "native-session-message-part-roundtrip-covered-by-later-TODO27-slices",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildProviderStreamReplayAtomSnapshot(
  product: ProviderStreamReplayProduct,
  key: ProviderStreamReplayAtomKey,
  rawFrameTimeline?: ProviderRawFrameTimelineSnapshot,
  rawPayloadRoundTrip?: ProviderRawPayloadRoundTripSnapshot,
): ProviderStreamReplayAtomSnapshot {
  const profile = streamingDeltaRecorderRegistry[product]
  const resolvedRawFrameTimeline = rawFrameTimeline ?? buildProviderRawFrameTimelineSnapshot(product)
  const resolvedRawPayloadRoundTrip = rawPayloadRoundTrip ?? buildProviderRawPayloadRoundTripSnapshot(product)
  return {
    key,
    atomID: key === "streaming-delta-recorder" ? profile.recorderID : profile.projectorID,
    portID: key === "streaming-delta-recorder" ? "provider.streaming-delta-recorder" : "provider.stream-projector",
    flowStageID: key === "streaming-delta-recorder" ? "provider.stream" : "stream.project",
    rawFrameTimelineFingerprint: resolvedRawFrameTimeline.fingerprint,
    rawFrameTimelineFixtureID: resolvedRawFrameTimeline.fixtureID,
    rawPayloadRoundTripFingerprint: resolvedRawPayloadRoundTrip.fingerprint,
    rawPayloadRoundTripFixtureID: resolvedRawPayloadRoundTrip.fixtureID,
    nativeFixtureSource: profile.nativeFixtureSource,
    upstreamEvidenceRefs: providerStreamUpstreamEvidenceRefs(product, key),
    fixtureID: providerStreamReplayFixtureID(product, key),
    scenarios: providerStreamReplayScenarios(product, key),
    observedFields: providerStreamObservedFields(product, key),
    inferredFields: providerStreamInferredFields(product, key),
    lossyFields: providerStreamLossyFields(product, key),
  }
}

export function providerStreamReplayFixtureID(product: ProviderStreamReplayProduct, key: ProviderStreamReplayAtomKey): string {
  return `${product}-provider-stream:${key}`
}

export function providerRawFrameTimelineFixtureID(product: ProviderStreamReplayProduct): string {
  return `${product}-provider-stream:raw-frame-timeline`
}

export function providerRawPayloadRoundTripFixtureID(product: ProviderStreamReplayProduct): string {
  return `${product}-provider-stream:raw-payload-roundtrip`
}

export function buildProviderRawFrameTimelineSnapshot(product: ProviderStreamReplayProduct): ProviderRawFrameTimelineSnapshot {
  const scenarios = providerRawFrameTimelineScenarios(product)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: providerStreamUpstreamRef(product),
    evidenceRef: `conformance:${product}-provider-raw-frame-timeline`,
    fixtureID: providerRawFrameTimelineFixtureID(product),
    scenarios,
    observedFields: [
      "rawFrameSequence",
      "providerProtocol",
      "frameOrder",
      "relativeTimingBucket",
      "retryBoundary",
      "cancelBoundary",
      "errorBoundary",
      "googleFrameShape",
    ],
    inferredFields: providerRawFrameTimelineInferredFields(product),
    lossyFields: providerRawFrameTimelineLossyFields(product),
    knownGaps: [
      "raw-frame-wall-clock-timing-not-replayed",
      "provider-retry-delay-not-exact",
      "cancel-abort-race-not-replayed",
      "raw-frame-payload-roundtrip-not-proven",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildProviderRawPayloadRoundTripSnapshot(product: ProviderStreamReplayProduct): ProviderRawPayloadRoundTripSnapshot {
  const scenarios = providerRawPayloadRoundTripScenarios(product)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: providerStreamUpstreamRef(product),
    evidenceRef: `conformance:${product}-provider-raw-payload-roundtrip`,
    fixtureID: providerRawPayloadRoundTripFixtureID(product),
    scenarios,
    observedFields: [
      "semanticInputShape",
      "rawPayloadShape",
      "projectedReadbackShape",
      "providerProtocol",
      "textPayload",
      "toolCallArguments",
      "finishPayload",
      "usagePayload",
      "errorPayload",
      "googleFunctionCallPayload",
    ],
    inferredFields: providerRawPayloadRoundTripInferredFields(product),
    lossyFields: providerRawPayloadRoundTripLossyFields(product),
    knownGaps: [
      "raw-payload-roundtrip-not-full-native",
      "raw-frame-wall-clock-timing-not-replayed",
      "provider-retry-delay-not-exact",
      "cancel-abort-race-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

function streamReplayMetadata(profile: StreamingDeltaRecorderProfile, key: ProviderStreamReplayAtomKey): StreamingDeltaRecorderAtomDescriptor["replay"] {
  const replay = profile.product === "common" ?
    commonProviderStreamReplayAtomSnapshot(profile, key) :
    buildProviderStreamReplayAtomSnapshot(profile.product, key)
  return {
    ...replay,
    chunkClasses: ["text", "reasoning", "tool-json", "finish", "part"],
    finishReasons: ["stop", "tool_calls", "length", "error"],
    toolJSONDelta: true,
  }
}

function commonProviderStreamReplayAtomSnapshot(profile: StreamingDeltaRecorderProfile, key: ProviderStreamReplayAtomKey): ProviderStreamReplayAtomSnapshot {
  return {
    key,
    atomID: key === "streaming-delta-recorder" ? profile.recorderID : profile.projectorID,
    portID: key === "streaming-delta-recorder" ? "provider.streaming-delta-recorder" : "provider.stream-projector",
    flowStageID: key === "streaming-delta-recorder" ? "provider.stream" : "stream.project",
    nativeFixtureSource: profile.nativeFixtureSource,
    upstreamEvidenceRefs: ["common-provider-stream-contract"],
    fixtureID: `common-provider-stream:${key}`,
    scenarios: [
      {
        scenarioID: "normalized-provider-stream",
        providerProtocol: "product-native",
        eventSequence: ["text", "tool_call", "finish"],
        observedShape: { chunkClasses: ["text", "tool-json", "finish"], finishReasons: ["stop", "tool_calls", "length", "error"] },
        visibility: "observed",
      },
    ],
    observedFields: ["eventType", "semanticClass", "finishReason"],
    inferredFields: [],
    lossyFields: [],
  }
}

function providerRawFrameTimelineScenarios(product: ProviderStreamReplayProduct): ProviderRawFrameTimelineScenario[] {
  const providerProtocol = providerProtocolForProduct(product)
  const frameNames = providerRawFrameNames(product)
  const surfaces = providerRawFrameSurfaces(product)
  return [
    {
      scenarioID: "raw-text-frame-order",
      providerProtocol,
      rawFrameSequence: frameNames.text,
      timingBuckets: ["attempt-start", "inter-frame-order-only", "finish-boundary"],
      ...surfaces,
      observedShape: {
        frameOrder: "preserved",
        textDelta: true,
        relativeTiming: "order-bucket-only",
        wallClockTiming: "not-replayed",
      },
      visibility: "observed",
    },
    {
      scenarioID: "raw-tool-call-frame-order",
      providerProtocol,
      rawFrameSequence: frameNames.tool,
      timingBuckets: ["attempt-start", "tool-delta-order-only", "finish-boundary"],
      ...surfaces,
      observedShape: {
        frameOrder: "preserved",
        toolDelta: true,
        partialJSON: true,
        payloadRoundTrip: "not-proven",
      },
      visibility: "observed",
    },
    {
      scenarioID: "retry-error-frame-path",
      providerProtocol,
      rawFrameSequence: frameNames.retry,
      timingBuckets: ["error-boundary", "retry-delay-bucket", "next-attempt-start"],
      ...surfaces,
      observedShape: {
        errorBoundary: "partial",
        retryBoundary: "partial",
        retryDelay: "bucketed",
        attemptID: "inferred",
      },
      visibility: "inferred",
    },
    {
      scenarioID: "cancel-frame-path",
      providerProtocol,
      rawFrameSequence: frameNames.cancel,
      timingBuckets: ["cancel-request", "abort-boundary", "terminal-frame-unknown"],
      ...surfaces,
      observedShape: {
        cancelBoundary: "partial",
        abortRace: "not-replayed",
        terminalFrame: "inferred",
      },
      visibility: "inferred",
    },
    {
      scenarioID: "google-raw-frame-shape",
      providerProtocol: "google",
      rawFrameSequence: ["google:candidate.content.parts.text", "google:candidate.content.parts.functionCall", "google:candidate.finishReason"],
      timingBuckets: ["attempt-start", "inter-frame-order-only", "finish-boundary"],
      ...surfaces,
      observedShape: {
        googleFrameShape: "partial",
        textDelta: true,
        toolDelta: true,
        rawTransport: "not-replayed",
      },
      visibility: "inferred",
    },
  ]
}

function providerRawPayloadSurfaces(product: ProviderStreamReplayProduct): {
  transportEnvelope: string
  textField: string
  toolArgumentsField: string
  finishField: string
  usageField: string
  errorField: string
} {
  if (product === "pi-mono") {
    return {
      transportEnvelope: "anthropic.messages.stream",
      textField: "content_block_delta.delta.text",
      toolArgumentsField: "content_block_delta.delta.partial_json",
      finishField: "message_delta.delta.stop_reason",
      usageField: "message_delta.usage",
      errorField: "error.error",
    }
  }
  if (product === "nanobot") {
    return {
      transportEnvelope: "openrouter.chat.completions.stream",
      textField: "choices[].delta.content",
      toolArgumentsField: "choices[].delta.tool_calls[].function.arguments",
      finishField: "choices[].finish_reason",
      usageField: "usage",
      errorField: "error",
    }
  }
  if (product === "hermes-agent") {
    return {
      transportEnvelope: "openai.chat.completions.stream",
      textField: "choices[].delta.content",
      toolArgumentsField: "choices[].delta.tool_calls[].function.arguments",
      finishField: "choices[].finish_reason",
      usageField: "usage",
      errorField: "error",
    }
  }
  return {
    transportEnvelope: "openai-compatible.responses.stream",
    textField: "response.output_text.delta",
    toolArgumentsField: "response.function_call_arguments.delta",
    finishField: "response.completed.finish_reason",
    usageField: "response.completed.usage",
    errorField: "error",
  }
}

function providerRawPayloadRoundTripScenarios(product: ProviderStreamReplayProduct): ProviderRawPayloadRoundTripScenario[] {
  const providerProtocol = providerProtocolForProduct(product)
  const surfaces = providerRawPayloadSurfaces(product)
  return [
    {
      scenarioID: "text-delta-payload-roundtrip",
      providerProtocol,
      semanticInputShape: { eventType: "text", textDelta: "observed" },
      rawPayloadShape: {
        providerField: surfaces.textField,
        transportEnvelope: surfaces.transportEnvelope,
        payloadClass: "text-delta",
      },
      projectedReadbackShape: { eventType: "text", textVisible: true, semanticClass: "text" },
      lossiness: ["raw-sse-event-id", "chunk-wall-clock-timestamp"],
      visibility: "observed",
    },
    {
      scenarioID: "tool-call-arguments-payload-roundtrip",
      providerProtocol,
      semanticInputShape: { eventType: "tool_call", toolJSONDelta: true, partialJSON: true },
      rawPayloadShape: {
        providerField: surfaces.toolArgumentsField,
        transportEnvelope: surfaces.transportEnvelope,
        payloadClass: "tool-call-arguments-delta",
      },
      projectedReadbackShape: { eventType: "tool_call", toolJSONDelta: true, semanticClass: "tool-json" },
      lossiness: ["partial-json-chunk-boundaries", "tool-call-index-id"],
      visibility: "observed",
    },
    {
      scenarioID: "finish-usage-payload-roundtrip",
      providerProtocol,
      semanticInputShape: { eventType: "finish", finishReason: "stop", usage: true },
      rawPayloadShape: {
        finishField: surfaces.finishField,
        usageField: surfaces.usageField,
        transportEnvelope: surfaces.transportEnvelope,
      },
      projectedReadbackShape: { eventType: "finish", finishReason: "stop", usage: "semantic" },
      lossiness: ["provider-token-accounting-detail", "finish-frame-timestamp"],
      visibility: "observed",
    },
    {
      scenarioID: "error-payload-roundtrip",
      providerProtocol,
      semanticInputShape: { eventType: "finish", finishReason: "error", retry: "partial" },
      rawPayloadShape: {
        errorField: surfaces.errorField,
        transportEnvelope: surfaces.transportEnvelope,
        retrySurface: providerRawFrameSurfaces(product).retrySurface,
      },
      projectedReadbackShape: { eventType: "finish", finishReason: "error", retry: "partial" },
      lossiness: ["native-error-id", "retry-attempt-correlation-id"],
      visibility: "inferred",
    },
    {
      scenarioID: "google-function-call-payload-roundtrip",
      providerProtocol: "google",
      semanticInputShape: { eventType: "tool_call", toolJSONDelta: true, providerPathCoverage: "partial-semantic-sample" },
      rawPayloadShape: {
        providerField: "candidate.content.parts.functionCall.args",
        transportEnvelope: "google.generateContentStream",
        payloadClass: "google-function-call",
      },
      projectedReadbackShape: { eventType: "tool_call", toolJSONDelta: true, semanticClass: "tool-json" },
      lossiness: ["google-raw-transport-not-replayed", "function-call-args-chunking"],
      visibility: "inferred",
    },
  ]
}

function providerStreamReplayScenarios(product: ProviderStreamReplayProduct, key: ProviderStreamReplayAtomKey): ProviderStreamReplayScenario[] {
  const protocol = providerProtocolForProduct(product)
  const base: ProviderStreamReplayScenario[] = [
    {
      scenarioID: "text-reasoning-deltas",
      providerProtocol: protocol,
      eventSequence: ["text", "reasoning", "finish"],
      observedShape: { chunkClasses: ["text", "reasoning", "finish"], textDelta: true, reasoningDelta: true, finishReason: "stop" },
      visibility: "observed",
    },
    {
      scenarioID: "tool-json-partial",
      providerProtocol: protocol,
      eventSequence: ["tool_call", "finish"],
      observedShape: { chunkClasses: ["tool-json", "finish"], toolJSONDelta: true, finishReason: "tool_calls" },
      visibility: "observed",
    },
    {
      scenarioID: "usage-and-cost-finish",
      providerProtocol: protocol,
      eventSequence: ["text", "finish"],
      observedShape: { usage: true, cost: true, finishReason: "stop" },
      visibility: "observed",
    },
    {
      scenarioID: "length-finish",
      providerProtocol: protocol,
      eventSequence: ["text", "finish"],
      observedShape: { finishReason: "length" },
      visibility: "observed",
    },
    {
      scenarioID: "google-provider-path",
      providerProtocol: "google",
      eventSequence: ["text", "tool_call", "finish"],
      observedShape: {
        chunkClasses: ["text", "tool-json", "finish"],
        googleEventNames: ["content", "functionCall", "finishReason"],
        toolJSONDelta: true,
        finishReason: "stop",
        providerPathCoverage: "partial-semantic-sample",
      },
      visibility: "inferred",
    },
    {
      scenarioID: "error-retry-cancel",
      providerProtocol: protocol,
      eventSequence: ["finish"],
      observedShape: { finishReason: "error", retry: "partial", cancel: "partial" },
      visibility: "inferred",
    },
  ]
  if (key === "stream-projector") {
    return base.map((scenario) => ({
      ...scenario,
      observedShape: {
        ...scenario.observedShape,
        projectorOutput: product === "pi-mono" ? "jsonl-v3-events" : product === "opencode" ? "step-events" : product === "nanobot" ? "agent-hook-iteration" : "chat-completions-tool-calls",
      },
    }))
  }
  return base
}

function providerStreamObservedFields(product: ProviderStreamReplayProduct, key: ProviderStreamReplayAtomKey): string[] {
  const common = ["eventName", "chunkClass", "chunkOrder", "textDelta", "reasoningDelta", "toolJSONDelta", "finishReason", "usage", "cost"]
  return key === "stream-projector" ? [...common, providerProtocolForProduct(product), "projectorOutputShape"] : [...common, providerProtocolForProduct(product)]
}

function providerStreamInferredFields(product: ProviderStreamReplayProduct, key: ProviderStreamReplayAtomKey): string[] {
  if (key === "streaming-delta-recorder") {
    if (product === "opencode") return ["raw-sse-frame-order", "plugin-provider-intervention-timing", "google-provider-event-shape"]
    if (product === "pi-mono") return ["anthropic-event-indexing", "extension-stream-hook-order", "google-provider-event-shape"]
    if (product === "nanobot") return ["agent-hook-stream-flush-timing", "provider-retry-loop-clock", "google-provider-event-shape"]
    return ["gateway-stream-flush-timing", "persistent-provider-retry-clock", "google-provider-event-shape"]
  }
  if (product === "opencode") return ["message-v2-part-boundary", "sqlite-step-event-transaction-order", "google-provider-projector-shape"]
  if (product === "pi-mono") return ["jsonl-v3-provider-record-id", "typebox-tool-delta-boundary", "google-provider-projector-shape"]
  if (product === "nanobot") return ["workspace-session-jsonl-write-order", "skills-tool-delta-boundary", "google-provider-projector-shape"]
  return ["api-gateway-visible-trace-order", "memory-tool-call-delta-boundary", "google-provider-projector-shape"]
}

function providerStreamLossyFields(product: ProviderStreamReplayProduct, key: ProviderStreamReplayAtomKey): string[] {
  const common = ["semantic-provider-stream-replay", "raw-transport-frame-timing", "partial-provider-raw-frame-timeline", "partial-provider-raw-payload-roundtrip", "provider-specific-error-cancel-paths-partial", "google-provider-raw-event-detail"]
  if (key === "streaming-delta-recorder") {
    if (product === "pi-mono") return [...common, "anthropic-raw-event-detail"]
    if (product === "opencode") return [...common, "openai-compatible-raw-sse-detail"]
    return [...common, "native-provider-transport-detail"]
  }
  if (product === "hermes-agent") return [...common, "gateway-projector-metadata-detail"]
  if (product === "nanobot") return [...common, "agent-hook-projector-state-detail"]
  return [...common, "native-message-part-projector-detail"]
}

function providerRawFrameTimelineInferredFields(product: ProviderStreamReplayProduct): string[] {
  if (product === "opencode") return ["sse-event-id", "plugin-provider-retry-clock", "abort-controller-race"]
  if (product === "pi-mono") return ["anthropic-message-index", "extension-stream-retry-clock", "cli-cancel-race"]
  if (product === "nanobot") return ["openrouter-frame-id", "agent-hook-flush-clock", "workspace-cancel-race"]
  return ["gateway-frame-id", "persistent-agent-retry-clock", "api-cancel-race"]
}

function providerRawFrameTimelineLossyFields(product: ProviderStreamReplayProduct): string[] {
  const common = [
    "partial-provider-raw-frame-timeline",
    "partial-provider-raw-payload-roundtrip",
    "raw-frame-wall-clock-timing-not-replayed",
    "provider-retry-delay-not-exact",
    "cancel-abort-race-not-replayed",
    "raw-frame-payload-roundtrip-not-proven",
  ]
  if (product === "opencode") return [...common, "openai-compatible-sse-frame-detail"]
  if (product === "pi-mono") return [...common, "anthropic-sse-frame-detail"]
  if (product === "nanobot") return [...common, "openrouter-sse-frame-detail"]
  return [...common, "gateway-openai-compatible-frame-detail"]
}

function providerRawPayloadRoundTripInferredFields(product: ProviderStreamReplayProduct): string[] {
  if (product === "opencode") return ["response-output-item-id", "sse-event-id", "plugin-provider-payload-transform-order"]
  if (product === "pi-mono") return ["anthropic-content-block-index", "message-delta-id", "extension-payload-transform-order"]
  if (product === "nanobot") return ["openrouter-choice-index", "agent-hook-payload-flush-order", "workspace-stream-record-id"]
  return ["chat-completion-choice-index", "gateway-frame-id", "api-payload-transform-order"]
}

function providerRawPayloadRoundTripLossyFields(product: ProviderStreamReplayProduct): string[] {
  const common = [
    "partial-provider-raw-payload-roundtrip",
    "raw-payload-roundtrip-not-full-native",
    "raw-frame-wall-clock-timing-not-replayed",
    "provider-retry-delay-not-exact",
    "cancel-abort-race-not-replayed",
  ]
  if (product === "opencode") return [...common, "openai-compatible-sse-payload-detail"]
  if (product === "pi-mono") return [...common, "anthropic-content-block-payload-detail"]
  if (product === "nanobot") return [...common, "openrouter-choice-payload-detail"]
  return [...common, "gateway-chat-completions-payload-detail"]
}

function providerRawFrameSurfaces(product: ProviderStreamReplayProduct): Pick<ProviderRawFrameTimelineScenario, "retrySurface" | "cancelSurface" | "errorSurface"> {
  if (product === "opencode") return { retrySurface: "session-retry-loop", cancelSurface: "abort-controller", errorSurface: "provider-error-event" }
  if (product === "pi-mono") return { retrySurface: "cli-agent-runtime-retry", cancelSurface: "session-switch-cancel", errorSurface: "anthropic-error-event" }
  if (product === "nanobot") return { retrySurface: "agent-hook-retry-loop", cancelSurface: "workspace-run-cancel", errorSurface: "openrouter-error-chunk" }
  return { retrySurface: "persistent-agent-retry-loop", cancelSurface: "api-acp-cancel", errorSurface: "chat-completions-error" }
}

function providerRawFrameNames(product: ProviderStreamReplayProduct): Record<"text" | "tool" | "retry" | "cancel", string[]> {
  if (product === "pi-mono") {
    return {
      text: ["anthropic:message_start", "anthropic:content_block_delta.text_delta", "anthropic:message_stop"],
      tool: ["anthropic:content_block_start.tool_use", "anthropic:content_block_delta.input_json_delta", "anthropic:message_delta.stop_reason"],
      retry: ["anthropic:error", "pi:retry-delay", "anthropic:message_start"],
      cancel: ["pi:cancel-request", "anthropic:stream-abort", "pi:session-boundary"],
    }
  }
  if (product === "nanobot") {
    return {
      text: ["openrouter:chat.completion.chunk.delta.content", "openrouter:chat.completion.chunk.delta.content", "openrouter:finish_reason"],
      tool: ["openrouter:chat.completion.chunk.delta.tool_calls", "openrouter:chat.completion.chunk.delta.tool_calls.arguments", "openrouter:finish_reason.tool_calls"],
      retry: ["openrouter:error", "nanobot:retry-delay", "openrouter:chat.completion.chunk.delta"],
      cancel: ["nanobot:cancel-request", "openrouter:stream-abort", "nanobot:workspace-session-boundary"],
    }
  }
  if (product === "hermes-agent") {
    return {
      text: ["openai:chat.completion.chunk.delta.content", "openai:chat.completion.chunk.delta.content", "openai:finish_reason"],
      tool: ["openai:chat.completion.chunk.delta.tool_calls", "openai:chat.completion.chunk.delta.tool_calls.arguments", "openai:finish_reason.tool_calls"],
      retry: ["openai:error", "hermes:retry-delay", "openai:chat.completion.chunk.delta"],
      cancel: ["hermes:cancel-request", "openai:stream-abort", "hermes:api-session-boundary"],
    }
  }
  return {
    text: ["openai-compatible:response.output_text.delta", "openai-compatible:response.output_text.delta", "openai-compatible:response.completed"],
    tool: ["openai-compatible:response.output_item.added.tool_call", "openai-compatible:response.function_call_arguments.delta", "openai-compatible:response.completed.tool_calls"],
    retry: ["openai-compatible:error", "opencode:retry-delay", "openai-compatible:response.created"],
    cancel: ["opencode:cancel-request", "openai-compatible:stream-abort", "opencode:step-boundary"],
  }
}

function providerProtocolForProduct(product: ProviderStreamReplayProduct): ProviderStreamReplayScenario["providerProtocol"] {
  if (product === "pi-mono") return "anthropic"
  if (product === "hermes-agent") return "openai-compatible"
  if (product === "nanobot") return "openrouter"
  return "openai-compatible"
}

function providerStreamUpstreamRef(product: ProviderStreamReplayProduct): string {
  if (product === "opencode") return "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  if (product === "pi-mono") return "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  if (product === "nanobot") return "package:nanobot-ai@0.2.0"
  return "package:hermes-agent==0.15.1"
}

function providerStreamUpstreamEvidenceRefs(product: ProviderStreamReplayProduct, key: ProviderStreamReplayAtomKey): string[] {
  const base = providerStreamUpstreamRef(product)
  const keyRefs = {
    "streaming-delta-recorder": product === "opencode" ? ["provider-stream-events", "step-finish-semantics"] :
      product === "pi-mono" ? ["anthropic-stream-events", "jsonl-v3-provider-stream"] :
      product === "nanobot" ? ["provider-protocol", "agent-hook-provider-stream"] :
      ["chat-completions-stream", "gateway-visible-trace"],
    "stream-projector": product === "opencode" ? ["assistant-part-protocol", "message-v2-stream-projection"] :
      product === "pi-mono" ? ["jsonl-v3-assistant-parts", "anthropic-tool-delta-projection"] :
      product === "nanobot" ? ["workspace-session-jsonl", "agent-hook-iteration-projection"] :
      ["api-session-record", "chat-completions-tool-call-projection"],
  } satisfies Record<ProviderStreamReplayAtomKey, string[]>
  return [base, ...keyRefs[key]]
}

function semanticClass(event: ProviderStreamEvent): StreamingDeltaRecord["semanticClass"] {
  if (event.type === "tool_call") return "tool-json"
  if (event.type === "reasoning") return "reasoning"
  if (event.type === "finish") return "finish"
  if (event.type === "part") return "part"
  return "text"
}

function stableHash(input: string): string {
  let hash = 0
  for (let index = 0; index < input.length; index++) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
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
