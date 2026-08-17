import type {
  HarnessProduct,
  ProductTaskCadenceSignature,
  ProductTaskNativeCadenceFixture,
  ProductTaskNativeCadenceFixtureSet,
  ProductTaskNativeProjectionLoss,
  ProductTaskObservationShape,
} from "@helix/recipes"
import type { ExternalToolProduct, NativeCaptureArtifact } from "./types"

export interface NativeCadenceFixtureSetFromExternalCaptureOptions {
  generatedAt?: string
}

export function nativeCadenceFixtureSetFromExternalCapture(
  capture: NativeCaptureArtifact,
  options: NativeCadenceFixtureSetFromExternalCaptureOptions = {},
): ProductTaskNativeCadenceFixtureSet {
  const product = externalCaptureHarnessProduct(capture.product)
  const fixture = nativeCadenceFixtureFromExternalCapture(capture, product)
  return {
    schemaVersion: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    sourceArtifact: {
      generatedAt: capture.generatedAt,
      suite: `external-tool/${capture.sourceTool}`,
      provider: "live",
    },
    fixtures: [fixture],
  }
}

export function nativeCadenceFixtureFromExternalCapture(capture: NativeCaptureArtifact, product = externalCaptureHarnessProduct(capture.product)): ProductTaskNativeCadenceFixture {
  const traceEvents = externalCaptureTraceEvents(capture)
  const toolSequence = capture.toolEvidence.map((tool, index) => ({
    index,
    toolName: tool.toolName,
    status: tool.source === "response-call" ? "observed" : "schema-only",
    inputShape: tool.argumentFingerprint ? "fingerprint" : "none",
    result: "none" as const,
  }))
  const messageParts = externalCaptureMessageParts(capture)
  const cadenceSignature: ProductTaskCadenceSignature = {
    level: "acceptable-cadence-drift",
    providerRequests: capture.providerRequests.map((request, index) => {
      const stream = capture.streamEvidence.find((candidate) => candidate.requestID === request.requestID)
      const requestTools = capture.toolEvidence.filter((tool) => tool.requestID === request.requestID && tool.source === "response-call")
      return {
        index,
        modelID: request.modelID || "unknown",
        toolCallCount: requestTools.length,
        eventCount: stream?.eventCount ?? 0,
        source: "native-cli",
        visibility: "observed",
        boundaryEvidence: stream && stream.eventCount > 0 ? "stream-event" : "cli-event",
        ...(stream?.finishReason ? { stopReason: stream.finishReason } : {}),
      }
    }),
    assistantTurns: [
      {
        index: 0,
        text: capture.streamEvidence.length > 0 ? "has-text" : "empty",
        partTypes: messageParts,
        toolCallCount: capture.toolEvidence.filter((tool) => tool.source === "response-call").length,
      },
    ],
    toolSequence,
    toolBatches: toolSequence.map((tool) => [tool.toolName]),
    sessionWrites: traceEvents.filter((event) => event.startsWith("message.") || event.startsWith("session.")),
    traceEvents,
    costShape: {
      providerRequests: capture.providerRequests.length,
      toolCalls: toolSequence.length,
      retries: 0,
      syntheticContinues: 0,
      contextCompacted: false,
      messageCount: Math.max(1, ...capture.promptEvidence.map((item) => item.messageCount)),
    },
  }
  return {
    fixtureVersion: 1,
    product,
    nativeVersion: `external-tool/${capture.sourceTool}@${capture.sourceToolVersion}`,
    taskID: capture.taskID,
    providerShape: {
      provider: "live",
      modelID: capture.summary.models[0] ?? "unknown",
      deterministic: capture.captureMode === "capture-only",
      requests: capture.providerRequests.length,
    },
    cadenceSignature,
    observationShape: externalCaptureObservationShape(capture),
    nativeEvents: traceEvents,
    nativeChunks: traceEvents.map((type, index) => ({ index, type, semanticClass: externalCaptureChunkClass(type) })),
    messageParts,
    projectionLosses: externalCaptureProjectionLosses(),
    redactionSummary: {
      credentials: "redacted",
      hostPaths: "normalized",
      tokenUsage: "omitted",
    },
  }
}

export function externalCaptureHarnessProduct(product: ExternalToolProduct): HarnessProduct {
  if (product === "codex") throw new Error("External capture native-cadence projection only supports Helix products; codex is a protocol reference, not a Helix product.")
  if (product === "opencode" || product === "pi-mono" || product === "nanobot" || product === "hermes-agent") return product
  throw new Error(`External capture product is not supported by Helix native-cadence projection: ${String(product)}`)
}

function externalCaptureTraceEvents(capture: NativeCaptureArtifact): string[] {
  const events: string[] = []
  for (const request of capture.providerRequests) {
    events.push("provider.request")
    const stream = capture.streamEvidence.find((item) => item.requestID === request.requestID)
    if (stream && stream.eventCount > 0) events.push("message.delta")
    events.push("provider.response")
  }
  for (const tool of capture.toolEvidence) events.push(tool.source === "response-call" ? "tool.call" : "tool.schema")
  if (events.length === 0) events.push("provider.unobservable")
  return events
}

function externalCaptureMessageParts(capture: NativeCaptureArtifact): string[] {
  const parts = new Set<string>()
  if (capture.streamEvidence.length > 0) parts.add("text")
  for (const tool of capture.toolEvidence) parts.add(tool.source === "response-call" ? `tool:${tool.toolName}` : `tool-schema:${tool.toolName}`)
  return [...parts].sort()
}

function externalCaptureObservationShape(capture: NativeCaptureArtifact): ProductTaskObservationShape {
  const hasStream = capture.streamEvidence.some((item) => item.eventCount > 0)
  const hasTools = capture.toolEvidence.length > 0
  return {
    providerBoundary: {
      visibility: "per-request",
      lossiness: "semantic",
      evidence: hasStream ? "stream-event" : "cli-event",
    },
    streamDelta: {
      visibility: hasStream ? "semantic" : "none",
      lossiness: hasStream ? "semantic" : "unobservable",
      evidence: hasStream ? "stream-event" : "unavailable",
    },
    toolLifecycle: {
      visibility: hasTools ? "call-only" : "none",
      lossiness: hasTools ? "semantic" : "unobservable",
      evidence: hasTools ? "cli-event" : "unavailable",
    },
    messageWrite: {
      visibility: "final-message",
      lossiness: "inferred",
      evidence: "message-store",
    },
    acceptance: {
      visibility: "inferred",
      lossiness: "inferred",
      evidence: "runtime-policy",
    },
    workspace: {
      visibility: "diff-only",
      lossiness: "unobservable",
      evidence: "workspace-diff",
    },
  }
}

function externalCaptureProjectionLosses(): ProductTaskNativeProjectionLoss[] {
  return [
    {
      field: "providerRawFrame",
      lossiness: "semantic",
      reason: "external-tool capture keeps provider frame evidence as normalized request and stream summaries.",
    },
    {
      field: "providerRawPayload",
      lossiness: "semantic",
      reason: "raw provider payloads are reduced to shape summaries and fingerprints before Helix publication.",
    },
    {
      field: "providerTiming",
      lossiness: "inferred",
      reason: "external-tool capture records request duration and order, not full native in-process timing.",
    },
    {
      field: "acceptance",
      lossiness: "inferred",
      reason: "external-tool capture can infer final/finish evidence but cannot observe Helix runtime acceptance policy internals.",
    },
    {
      field: "workspace",
      lossiness: "unobservable",
      reason: "claude-tap captures provider traffic, not workspace filesystem diffs.",
    },
  ]
}

function externalCaptureChunkClass(type: string): string {
  if (/tool/i.test(type)) return "tool"
  if (/message|text|delta/i.test(type)) return "message"
  if (/accept/i.test(type)) return "acceptance"
  if (/session/i.test(type)) return "session"
  if (/error/i.test(type)) return "error"
  return "control"
}
