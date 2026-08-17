import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { dirname, isAbsolute, relative, resolve } from "node:path"
import { check, report } from "./profile-schema"
import { credentialFindings, hostPathFindings } from "./redaction"
import { externalToolProductSupport, isExternalToolID, isExternalToolProduct } from "./registry"
import type { ExternalToolArtifactManifest, ExternalToolCaptureMode, ExternalToolCheck, ExternalToolInvocationStrategy, ExternalToolProduct, ExternalToolRunManifest, ExternalToolVerificationReport, NativeCaptureArtifact } from "./types"

const defaultForbiddenRunManifestEnvNames = [
  "HELIX_EXTERNAL_CAPTURE",
  "HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS",
  "CODEX_MANAGED_BY_NPM",
  "CODEX_MANAGED_PACKAGE_ROOT",
  "CODEX_REMOTE_PAYLOAD",
  "CODEX_THREAD_ID",
]

export interface VerifyNativeCaptureArtifactWithRunManifestOptions {
  artifactPath?: string
  runManifestPath?: string
  forbiddenEnvNames?: readonly string[]
}

export interface VerifyExternalToolRunManifestOptions {
  runManifestPath?: string
  requiredProduct?: ExternalToolProduct
  requiredTaskID?: string
  requiredCaptureMode?: ExternalToolCaptureMode
  requiredInvocationStrategy?: ExternalToolInvocationStrategy
  requiredInvocationCommand?: string
  requiredInvocationArgs?: readonly string[]
  requiredArtifactRoles?: Array<{ path: string; role: ExternalToolArtifactManifest["role"] }>
  allowUnknownToolVersion?: boolean
  allowEmptyArtifacts?: boolean
  forbiddenEnvNames?: readonly string[]
}

export function verifyNativeCaptureArtifact(value: unknown): ExternalToolVerificationReport {
  const artifact = value as Partial<NativeCaptureArtifact>
  const checks = [
    check("schema", artifact.schemaVersion === 1 && artifact.artifactKind === "external-tool-native-capture", "artifact is a native capture artifact"),
    check("source-tool", artifact.sourceTool === "claude-tap", "source tool is supported"),
    check("generated-at", typeof artifact.generatedAt === "string" && !Number.isNaN(Date.parse(artifact.generatedAt)), "artifact records a generated timestamp"),
    check("source-tool-version", typeof artifact.sourceToolVersion === "string" && artifact.sourceToolVersion.length > 0, "artifact records the source tool version"),
    check("source-artifact-hash", typeof artifact.sourceArtifact?.hash === "string" && /^sha256:[a-f0-9]{64}$/.test(artifact.sourceArtifact.hash), "source artifact hash is a sha256 digest"),
    check("source-artifact-format", nativeSourceArtifactFormatSupported(artifact), "source artifact format is jsonl, json, or compact"),
    check("source-artifact-bytes", Number.isSafeInteger(artifact.sourceArtifact?.bytes) && (artifact.sourceArtifact?.bytes ?? -1) >= 0, "source artifact byte size is present"),
    check("product", typeof artifact.product === "string" && artifact.product.length > 0, "product is present"),
    check("product-supported", nativeCaptureProductSupported(artifact), "source tool supports the artifact product"),
    check("task", typeof artifact.taskID === "string" && artifact.taskID.length > 0, "task id is present"),
    check("capture-mode", nativeCaptureModeSupported(artifact), "native capture mode is real-capture, capture-only, or import-only"),
    check("lossiness-policy", nativeCaptureLossinessSupported(artifact), "artifact records the external capture lossiness policy"),
    check("provider-requests", Array.isArray(artifact.providerRequests), "provider request evidence is an array"),
    check("provider-request-shape", nativeProviderRequestsSupported(artifact), "provider requests contain sanitized request and response shape summaries"),
    check("prompt-evidence", Array.isArray(artifact.promptEvidence), "prompt evidence is an array"),
    check("prompt-evidence-shape", nativePromptEvidenceSupported(artifact), "prompt evidence contains sanitized fingerprints and tool names"),
    check("tool-evidence", Array.isArray(artifact.toolEvidence), "tool evidence is an array"),
    check("tool-evidence-shape", nativeToolEvidenceSupported(artifact), "tool evidence contains sanitized tool names and fingerprints"),
    check("stream-evidence", Array.isArray(artifact.streamEvidence), "stream evidence is an array"),
    check("stream-evidence-shape", nativeStreamEvidenceSupported(artifact), "stream evidence contains sanitized cadence summaries and fingerprints"),
    check("usage-evidence", Array.isArray(artifact.usageEvidence), "usage evidence is an array"),
    check("usage-evidence-shape", nativeUsageEvidenceSupported(artifact), "usage evidence contains non-negative token counts"),
    check("stage-evidence", Array.isArray(artifact.stageEvidence) && artifact.stageEvidence.some((stage) => stage.stage === "provider"), "stage evidence includes provider stage"),
    check("stage-evidence-shape", nativeStageEvidenceSupported(artifact), "stage evidence contains sanitized stage summaries and fingerprints"),
    check("stage-evidence-counts", nativeStageEvidenceCountsMatch(artifact), "stage evidence counts match observed evidence arrays"),
    check("summary", nativeCaptureSummarySupported(artifact), "artifact summary contains evidence counts and observed shapes"),
    check("summary-counts", nativeCaptureSummaryCountsMatch(artifact), "artifact summary counts match evidence arrays"),
    check("summary-observed-values", nativeCaptureSummaryObservedValuesMatch(artifact), "artifact summary models, protocols, and status codes match provider requests"),
    check("redaction-policy", nativeRedactionPolicySupported(artifact), "redaction policy records the expected sanitized policy"),
    check("credentials", credentialFindings(value).length === 0, "artifact does not contain credential-shaped strings"),
    check("host-paths", hostPathFindings(value).length === 0, "artifact does not contain unredacted home directory paths"),
    check("raw-payload-keys", forbiddenRawPayloadKeys(value).length === 0, "artifact does not contain raw provider payload keys"),
  ]
  return report(checks)
}

export function verifyNativeCaptureArtifactWithRunManifest(
  value: unknown,
  manifestValue: unknown,
  options: VerifyNativeCaptureArtifactWithRunManifestOptions = {},
): ExternalToolVerificationReport {
  const artifactVerification = verifyNativeCaptureArtifact(value)
  const capture = value as Partial<NativeCaptureArtifact>
  const runManifestVerification = verifyExternalToolRunManifest(manifestValue, {
    ...(options.runManifestPath ? { runManifestPath: options.runManifestPath } : {}),
    ...(capture.product ? { requiredProduct: capture.product } : {}),
    ...(capture.taskID ? { requiredTaskID: capture.taskID } : {}),
    ...(capture.captureMode ? { requiredCaptureMode: capture.captureMode } : {}),
    ...(options.forbiddenEnvNames ? { forbiddenEnvNames: options.forbiddenEnvNames } : {}),
  })
  return report([
    ...artifactVerification.checks,
    ...runManifestVerification.checks,
    ...runManifestLinkChecks(value as Partial<NativeCaptureArtifact>, manifestValue as Partial<ExternalToolRunManifest>, options),
  ])
}

export function verifyExternalToolRunManifest(
  value: unknown,
  options: VerifyExternalToolRunManifestOptions = {},
): ExternalToolVerificationReport {
  const manifest = value as Partial<ExternalToolRunManifest>
  const runDir = options.runManifestPath ? dirname(options.runManifestPath) : undefined
  const invocation = manifest.invocation
  const envAllowlist = Array.isArray(invocation?.envAllowlist) ? invocation.envAllowlist : []
  const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : []
  const forbiddenEnvNames = options.forbiddenEnvNames ?? defaultForbiddenRunManifestEnvNames
  const requiredArtifacts = options.requiredArtifactRoles ?? []
  const expectedArgs = options.requiredInvocationArgs
  const checks: ExternalToolCheck[] = [
    check("run-manifest.schema", manifest.schemaVersion === 1 && manifest.artifactKind === "external-tool-run-manifest", "run manifest schema is valid"),
    check("run-manifest.run-id", typeof manifest.runID === "string" && manifest.runID.length > 0, "run manifest records a run id"),
    check("run-manifest.tool", manifest.toolID === "claude-tap", "run manifest tool is supported"),
    check(
      "run-manifest.product",
      options.requiredProduct ? manifest.product === options.requiredProduct : typeof manifest.product === "string" && manifest.product.length > 0,
      options.requiredProduct ? "run manifest product matches the required product" : "run manifest product is present",
    ),
    check("run-manifest.product-supported", runManifestProductSupported(manifest), "run manifest tool supports the product"),
    check(
      "run-manifest.task",
      options.requiredTaskID ? manifest.taskID === options.requiredTaskID : typeof manifest.taskID === "string" && manifest.taskID.length > 0,
      options.requiredTaskID ? "run manifest task matches the required task" : "run manifest task is present",
    ),
    check(
      "run-manifest.capture-mode",
      runManifestCaptureModeSupported(manifest) && (!options.requiredCaptureMode || manifest.captureMode === options.requiredCaptureMode),
      options.requiredCaptureMode ? "run manifest capture mode matches the required mode" : "run manifest capture mode is a known external tool capture mode",
    ),
    check("run-manifest.exit-code", manifest.exitCode === 0, "run manifest records a successful external tool process"),
    check("run-manifest.started-at", parseableTimestamp(manifest.startedAt), "run manifest records a parseable start time"),
    check("run-manifest.finished-at", parseableTimestamp(manifest.finishedAt), "run manifest records a parseable finish time"),
    check("run-manifest.duration", runManifestDurationSupported(manifest), "run manifest finish time is not earlier than start time"),
    check(
      "run-manifest.tool-version",
      typeof manifest.toolVersion === "string" && manifest.toolVersion.length > 0 && (options.allowUnknownToolVersion || manifest.toolVersion !== "unknown"),
      options.allowUnknownToolVersion ? "run manifest records a tool version value" : "run manifest records a known tool version",
    ),
    check(
      "run-manifest.invocation",
      (invocation?.strategy === "binary" || invocation?.strategy === "uvx" || invocation?.strategy === "explicitPath") &&
        typeof invocation.command === "string" &&
        invocation.command.length > 0 &&
        typeof invocation.resolvedCommand === "string" &&
        invocation.resolvedCommand.length > 0 &&
        stringArray(invocation.args) &&
        typeof invocation.cwd === "string" &&
        invocation.cwd.length > 0 &&
        isAbsolute(invocation.cwd),
      "run manifest records the external tool invocation",
    ),
    check(
      "run-manifest.invocation-strategy",
      !options.requiredInvocationStrategy || invocation?.strategy === options.requiredInvocationStrategy,
      options.requiredInvocationStrategy ? "run manifest invocation strategy matches the required strategy" : "run manifest invocation strategy has no extra requirement",
    ),
    check(
      "run-manifest.invocation-command",
      !options.requiredInvocationCommand || (invocation?.command === options.requiredInvocationCommand && invocation?.resolvedCommand === options.requiredInvocationCommand),
      options.requiredInvocationCommand ? "run manifest invocation command matches the required command" : "run manifest invocation command has no extra requirement",
    ),
    check(
      "run-manifest.invocation-args",
      !expectedArgs || (Array.isArray(invocation?.args) && stringArraysEqual(invocation.args, expectedArgs)),
      expectedArgs ? "run manifest invocation args match the required argv" : "run manifest invocation args have no extra requirement",
    ),
    check("run-manifest.env-allowlist", runManifestEnvAllowlistSupported(invocation?.envAllowlist), "run manifest records a valid environment allowlist"),
    check(
      "run-manifest.env-gates",
      forbiddenEnvNames.every((name) => !envAllowlist.includes(name)),
      "run manifest does not forward forbidden gate flags to the external tool",
    ),
    check(
      "run-manifest.artifacts",
      options.allowEmptyArtifacts ? Array.isArray(manifest.artifacts) : artifacts.length > 0,
      options.allowEmptyArtifacts ? "run manifest records an artifacts array" : "run manifest lists captured artifacts",
    ),
    check("run-manifest.artifact-paths", runArtifactPathsUnique(artifacts), "run manifest artifact paths are unique"),
    ...requiredArtifacts.map((required) => {
      const artifact = artifacts.find((item) => item.path === required.path)
      return check(
        `run-manifest.required-artifact.${required.path}`,
        Boolean(artifact && artifact.role === required.role),
        `run manifest includes ${required.path} as ${required.role}`,
      )
    }),
  ]
  return report([
    ...checks,
    ...runArtifactSchemaChecks(artifacts),
    ...(runDir ? runArtifactIntegrityChecks(runDir, artifacts) : []),
  ])
}

function stringArraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function parseableTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}

function runManifestDurationSupported(manifest: Partial<ExternalToolRunManifest>): boolean {
  return parseableTimestamp(manifest.startedAt) &&
    parseableTimestamp(manifest.finishedAt) &&
    Date.parse(manifest.finishedAt) >= Date.parse(manifest.startedAt)
}

function runManifestEnvAllowlistSupported(value: unknown): boolean {
  return stringArray(value) &&
    value.every((name) => /^[A-Z_][A-Z0-9_]*$/.test(name)) &&
    new Set(value).size === value.length
}

function nativeCaptureProductSupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return typeof artifact.sourceTool === "string" &&
    isExternalToolID(artifact.sourceTool) &&
    typeof artifact.product === "string" &&
    isExternalToolProduct(artifact.product) &&
    externalToolProductSupport(artifact.sourceTool, artifact.product).supported
}

function runManifestProductSupported(manifest: Partial<ExternalToolRunManifest>): boolean {
  return typeof manifest.toolID === "string" &&
    isExternalToolID(manifest.toolID) &&
    typeof manifest.product === "string" &&
    isExternalToolProduct(manifest.product) &&
    externalToolProductSupport(manifest.toolID, manifest.product).supported
}

function runManifestCaptureModeSupported(manifest: Partial<ExternalToolRunManifest>): boolean {
  return manifest.captureMode === "real-capture" || manifest.captureMode === "capture-only" || manifest.captureMode === "import-only" || manifest.captureMode === "dry-run"
}

function nativeCaptureModeSupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return artifact.captureMode === "real-capture" || artifact.captureMode === "capture-only" || artifact.captureMode === "import-only"
}

function nativeSourceArtifactFormatSupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return artifact.sourceArtifact?.format === "jsonl" || artifact.sourceArtifact?.format === "json" || artifact.sourceArtifact?.format === "compact"
}

function nativeCaptureLossinessSupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return artifact.lossiness?.observability === "external-proxy-capture" &&
    artifact.lossiness.rawPrompt === "fingerprint-only" &&
    artifact.lossiness.rawProviderPayload === "shape-summary-only" &&
    artifact.lossiness.rawToolPayload === "fingerprint-only" &&
    artifact.lossiness.nativeInternals === "unobservable"
}

function nativeProviderRequestsSupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return Array.isArray(artifact.providerRequests) && artifact.providerRequests.every(providerRequestSupported)
}

function providerRequestSupported(value: unknown): boolean {
  const request = value as Partial<NativeCaptureArtifact["providerRequests"][number]>
  return typeof request.requestID === "string" &&
    request.requestID.length > 0 &&
    nonNegativeInteger(request.turn) &&
    (!request.timestamp || (typeof request.timestamp === "string" && !Number.isNaN(Date.parse(request.timestamp)))) &&
    typeof request.method === "string" &&
    request.method.length > 0 &&
    typeof request.path === "string" &&
    request.path.length > 0 &&
    typeof request.protocol === "string" &&
    request.protocol.length > 0 &&
    typeof request.modelID === "string" &&
    request.modelID.length > 0 &&
    nonNegativeInteger(request.status) &&
    nonNegativeNumber(request.durationMs) &&
    jsonShapeSummarySupported(request.requestShape) &&
    jsonShapeSummarySupported(request.responseShape) &&
    (!request.requestHeaderSummary || headerSummarySupported(request.requestHeaderSummary)) &&
    (!request.responseHeaderSummary || headerSummarySupported(request.responseHeaderSummary))
}

function jsonShapeSummarySupported(value: unknown): boolean {
  const shape = value as { type?: unknown; fingerprint?: unknown; keys?: unknown; itemCount?: unknown; stringBytes?: unknown }
  return typeof shape.type === "string" &&
    shape.type.length > 0 &&
    typeof shape.fingerprint === "string" &&
    /^sha256:[a-f0-9]{64}$/.test(shape.fingerprint) &&
    Array.isArray(shape.keys) &&
    shape.keys.every((key) => typeof key === "string") &&
    (shape.itemCount === undefined || nonNegativeInteger(shape.itemCount)) &&
    (shape.stringBytes === undefined || nonNegativeInteger(shape.stringBytes))
}

function headerSummarySupported(value: unknown): boolean {
  const summary = value as { count?: unknown; names?: unknown; redactedNames?: unknown; fingerprint?: unknown }
  return nonNegativeInteger(summary.count) &&
    Array.isArray(summary.names) &&
    summary.names.every((name) => typeof name === "string") &&
    Array.isArray(summary.redactedNames) &&
    summary.redactedNames.every((name) => typeof name === "string") &&
    typeof summary.fingerprint === "string" &&
    /^sha256:[a-f0-9]{64}$/.test(summary.fingerprint)
}

function nativePromptEvidenceSupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return Array.isArray(artifact.promptEvidence) && artifact.promptEvidence.every(promptEvidenceSupported)
}

function promptEvidenceSupported(value: unknown): boolean {
  const prompt = value as Partial<NativeCaptureArtifact["promptEvidence"][number]>
  return typeof prompt.requestID === "string" &&
    prompt.requestID.length > 0 &&
    nonNegativeInteger(prompt.turn) &&
    typeof prompt.protocol === "string" &&
    prompt.protocol.length > 0 &&
    typeof prompt.modelID === "string" &&
    prompt.modelID.length > 0 &&
    optionalSHA256(prompt.systemFingerprint) &&
    optionalSHA256(prompt.developerFingerprint) &&
    optionalSHA256(prompt.userFingerprint) &&
    Array.isArray(prompt.toolNames) &&
    prompt.toolNames.every((name) => typeof name === "string" && name.length > 0) &&
    Array.isArray(prompt.toolSchemaFingerprints) &&
    prompt.toolSchemaFingerprints.every((fingerprint) => typeof fingerprint === "string" && /^sha256:[a-f0-9]{64}$/.test(fingerprint)) &&
    nonNegativeInteger(prompt.messageCount)
}

function optionalSHA256(value: unknown): boolean {
  return value === undefined || (typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value))
}

function nativeToolEvidenceSupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return Array.isArray(artifact.toolEvidence) && artifact.toolEvidence.every(toolEvidenceSupported)
}

function toolEvidenceSupported(value: unknown): boolean {
  const tool = value as Partial<NativeCaptureArtifact["toolEvidence"][number]>
  return typeof tool.requestID === "string" &&
    tool.requestID.length > 0 &&
    nonNegativeInteger(tool.turn) &&
    (tool.source === "request-schema" || tool.source === "response-call") &&
    typeof tool.toolName === "string" &&
    tool.toolName.length > 0 &&
    (tool.callID === undefined || (typeof tool.callID === "string" && tool.callID.length > 0)) &&
    optionalSHA256(tool.argumentFingerprint) &&
    optionalSHA256(tool.resultFingerprint) &&
    nonNegativeInteger(tool.order)
}

function nativeStreamEvidenceSupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return Array.isArray(artifact.streamEvidence) && artifact.streamEvidence.every(streamEvidenceSupported)
}

function streamEvidenceSupported(value: unknown): boolean {
  const stream = value as Partial<NativeCaptureArtifact["streamEvidence"][number]>
  return typeof stream.requestID === "string" &&
    stream.requestID.length > 0 &&
    nonNegativeInteger(stream.turn) &&
    typeof stream.protocol === "string" &&
    stream.protocol.length > 0 &&
    nonNegativeInteger(stream.eventCount) &&
    (stream.finishReason === undefined || (typeof stream.finishReason === "string" && stream.finishReason.length > 0)) &&
    (stream.reconstructedResponse === undefined || streamReconstructionSupported(stream.reconstructedResponse)) &&
    typeof stream.responseFingerprint === "string" &&
    /^sha256:[a-f0-9]{64}$/.test(stream.responseFingerprint)
}

function streamReconstructionSupported(value: unknown): boolean {
  if (!isObjectRecord(value)) return false
  const reconstruction = value as Partial<NonNullable<NativeCaptureArtifact["streamEvidence"][number]["reconstructedResponse"]>>
  return Array.isArray(reconstruction.eventTypes) &&
    reconstruction.eventTypes.every((item) => typeof item === "string" && item.length > 0) &&
    Array.isArray(reconstruction.chunkTypes) &&
    reconstruction.chunkTypes.every((item) => typeof item === "string" && item.length > 0) &&
    nonNegativeInteger(reconstruction.textBytes) &&
    optionalSHA256(reconstruction.textFingerprint) &&
    nonNegativeInteger(reconstruction.toolCallCount) &&
    nonNegativeInteger(reconstruction.toolArgumentBytes) &&
    optionalSHA256(reconstruction.toolArgumentFingerprint) &&
    (reconstruction.finishReason === undefined || (typeof reconstruction.finishReason === "string" && reconstruction.finishReason.length > 0)) &&
    typeof reconstruction.semanticFingerprint === "string" &&
    /^sha256:[a-f0-9]{64}$/.test(reconstruction.semanticFingerprint)
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function nativeUsageEvidenceSupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return Array.isArray(artifact.usageEvidence) && artifact.usageEvidence.every(usageEvidenceSupported)
}

function usageEvidenceSupported(value: unknown): boolean {
  const usage = value as Partial<NativeCaptureArtifact["usageEvidence"][number]>
  return typeof usage.requestID === "string" &&
    usage.requestID.length > 0 &&
    nonNegativeInteger(usage.turn) &&
    nonNegativeInteger(usage.inputTokens) &&
    nonNegativeInteger(usage.outputTokens) &&
    nonNegativeInteger(usage.cacheReadTokens) &&
    nonNegativeInteger(usage.cacheCreateTokens) &&
    (usage.totalTokens === undefined || nonNegativeInteger(usage.totalTokens))
}

function nativeStageEvidenceSupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return Array.isArray(artifact.stageEvidence) &&
    artifact.stageEvidence.every(stageEvidenceSupported) &&
    stringArraysEqual(artifact.stageEvidence.map((stage) => stage.stage).sort(), sortedUniqueStrings(artifact.stageEvidence.map((stage) => stage.stage)))
}

function stageEvidenceSupported(value: unknown): boolean {
  const stage = value as Partial<NativeCaptureArtifact["stageEvidence"][number]>
  return nativeCaptureStageSupported(stage.stage) &&
    nativeStageObservabilitySupported(stage.observability) &&
    nonNegativeInteger(stage.evidenceCount) &&
    typeof stage.summary === "string" &&
    stage.summary.length > 0 &&
    Array.isArray(stage.fingerprints) &&
    stage.fingerprints.every((fingerprint) => typeof fingerprint === "string" && /^sha256:[a-f0-9]{64}$/.test(fingerprint))
}

function nativeStageEvidenceCountsMatch(artifact: Partial<NativeCaptureArtifact>): boolean {
  if (!Array.isArray(artifact.stageEvidence)) return false
  const expected = expectedStageEvidenceCounts(artifact)
  if (!expected) return false
  return artifact.stageEvidence.every((stage) => typeof stage.stage === "string" && expected[stage.stage] === stage.evidenceCount)
}

function expectedStageEvidenceCounts(artifact: Partial<NativeCaptureArtifact>): Record<string, number> | undefined {
  if (
    !Array.isArray(artifact.providerRequests) ||
    !Array.isArray(artifact.promptEvidence) ||
    !Array.isArray(artifact.toolEvidence) ||
    !Array.isArray(artifact.streamEvidence) ||
    !Array.isArray(artifact.usageEvidence)
  ) return undefined
  const streamEvents = sumStreamEventCounts(artifact.streamEvidence)
  if (streamEvents === undefined) return undefined
  return {
    identity: artifact.providerRequests.length,
    session: artifact.providerRequests.length,
    prompt: artifact.promptEvidence.length,
    provider: artifact.providerRequests.length,
    tool: artifact.toolEvidence.length,
    runtime: streamEvents,
    final: artifact.usageEvidence.length,
  }
}

function nativeCaptureStageSupported(value: unknown): boolean {
  return value === "identity" ||
    value === "session" ||
    value === "prompt" ||
    value === "provider" ||
    value === "tool" ||
    value === "runtime" ||
    value === "final"
}

function nativeStageObservabilitySupported(value: unknown): boolean {
  return value === "external-proxy-capture" ||
    value === "aggregated" ||
    value === "inferred" ||
    value === "unobservable"
}

function nativeCaptureSummarySupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  const summary = artifact.summary
  return nonNegativeInteger(summary?.records) &&
    nonNegativeInteger(summary?.providerRequests) &&
    nonNegativeInteger(summary?.promptEvidence) &&
    nonNegativeInteger(summary?.toolEvidence) &&
    nonNegativeInteger(summary?.streamEvents) &&
    Array.isArray(summary?.models) &&
    Array.isArray(summary?.protocols) &&
    Array.isArray(summary?.statusCodes)
}

function nativeCaptureSummaryCountsMatch(artifact: Partial<NativeCaptureArtifact>): boolean {
  const summary = artifact.summary
  const streamEvents = Array.isArray(artifact.streamEvidence) ? sumStreamEventCounts(artifact.streamEvidence) : undefined
  return nativeCaptureSummarySupported(artifact) &&
    Array.isArray(artifact.providerRequests) &&
    Array.isArray(artifact.promptEvidence) &&
    Array.isArray(artifact.toolEvidence) &&
    streamEvents !== undefined &&
    summary?.records === artifact.providerRequests.length &&
    summary?.providerRequests === artifact.providerRequests.length &&
    summary.promptEvidence === artifact.promptEvidence.length &&
    summary.toolEvidence === artifact.toolEvidence.length &&
    summary.streamEvents === streamEvents
}

function nativeRedactionPolicySupported(artifact: Partial<NativeCaptureArtifact>): boolean {
  return artifact.redactionPolicy?.version === 1 &&
    artifact.redactionPolicy.containsRawPrompt === false &&
    artifact.redactionPolicy.credentials === "redacted" &&
    artifact.redactionPolicy.hostPaths === "normalized"
}

function nativeCaptureSummaryObservedValuesMatch(artifact: Partial<NativeCaptureArtifact>): boolean {
  const summary = artifact.summary
  if (!nativeCaptureSummarySupported(artifact) || !Array.isArray(artifact.providerRequests)) return false
  const models = sortedUniqueStrings(artifact.providerRequests.map((request) => request.modelID))
  const protocols = sortedUniqueStrings(artifact.providerRequests.map((request) => request.protocol))
  const statusCodes = sortedUniqueNumbers(artifact.providerRequests.map((request) => request.status))
  return stringArraysEqual(summary?.models ?? [], models) &&
    stringArraysEqual(summary?.protocols ?? [], protocols) &&
    numberArraysEqual(summary?.statusCodes ?? [], statusCodes)
}

function nonNegativeInteger(value: unknown): boolean {
  return Number.isSafeInteger(value) && (value as number) >= 0
}

function nonNegativeNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

function sumStreamEventCounts(streamEvidence: unknown[]): number | undefined {
  let total = 0
  for (const item of streamEvidence) {
    const eventCount = (item as { eventCount?: unknown }).eventCount
    if (!nonNegativeInteger(eventCount)) return undefined
    total += eventCount as number
  }
  return total
}

function sortedUniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))].sort()
}

function sortedUniqueNumbers(values: unknown[]): number[] {
  return [...new Set(values.filter((value): value is number => Number.isFinite(value)))].sort((left, right) => left - right)
}

function numberArraysEqual(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function runManifestLinkChecks(
  capture: Partial<NativeCaptureArtifact>,
  manifest: Partial<ExternalToolRunManifest>,
  options: VerifyNativeCaptureArtifactWithRunManifestOptions,
): ExternalToolCheck[] {
  const runDir = options.runManifestPath ? dirname(options.runManifestPath) : undefined
  const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : []
  const rawSourceMatches = artifacts.filter(
    (artifact) =>
      artifact.role === "raw-trace" &&
      artifact.hash === capture.sourceArtifact?.hash &&
      artifact.bytes === capture.sourceArtifact?.bytes &&
      artifact.format === capture.sourceArtifact?.format,
  )
  const artifactStats = options.artifactPath && existsSync(options.artifactPath) ? fileHashAndBytes(options.artifactPath) : undefined
  const relativeArtifactPath = runDir && options.artifactPath ? relative(runDir, options.artifactPath) : undefined
  const artifactIsInsideRunDir = Boolean(relativeArtifactPath && !relativeArtifactPath.startsWith("..") && !isAbsolute(relativeArtifactPath))
  const normalizedManifestArtifact = artifactIsInsideRunDir ? artifacts.find((artifact) => artifact.path === relativeArtifactPath) : undefined

  const checks: ExternalToolCheck[] = [
    check(
      "run-manifest.tool-version",
      typeof manifest.toolVersion === "string" && manifest.toolVersion.length > 0 && manifest.toolVersion !== "unknown" && manifest.toolVersion === capture.sourceToolVersion,
      "run manifest records a known tool version matching the normalized capture",
    ),
    check("run-manifest.source-artifact", rawSourceMatches.length > 0, "run manifest links the normalized capture source artifact"),
    check(
      "run-manifest.normalized-artifact",
      !artifactIsInsideRunDir || Boolean(normalizedManifestArtifact && artifactStats && normalizedManifestArtifact.hash === artifactStats.hash && normalizedManifestArtifact.bytes === artifactStats.bytes),
      artifactIsInsideRunDir ? "run manifest hash matches the normalized artifact on disk" : "normalized artifact is outside the run directory or no run path was supplied",
    ),
  ]

  return checks
}

function runArtifactSchemaChecks(artifacts: Partial<ExternalToolArtifactManifest>[]): ExternalToolCheck[] {
  return artifacts.flatMap((artifact, index) => {
    const idPrefix = `run-manifest.artifact.${index}`
    return [
      check(`${idPrefix}.path`, typeof artifact.path === "string" && artifact.path.length > 0, `manifest artifact path is present: ${artifact.path ?? "<missing>"}`),
      check(`${idPrefix}.format`, runArtifactFormatSupported(artifact), `manifest artifact format is supported: ${artifact.path ?? "<missing>"}`),
      check(`${idPrefix}.role`, runArtifactRoleSupported(artifact), `manifest artifact role is supported: ${artifact.path ?? "<missing>"}`),
      check(`${idPrefix}.hash-format`, runArtifactHashSupported(artifact), `manifest artifact hash is a sha256 digest: ${artifact.path ?? "<missing>"}`),
      check(`${idPrefix}.bytes-format`, runArtifactBytesSupported(artifact), `manifest artifact byte size is a non-negative integer: ${artifact.path ?? "<missing>"}`),
    ]
  })
}

function runArtifactIntegrityChecks(runDir: string, artifacts: Partial<ExternalToolArtifactManifest>[]): ExternalToolCheck[] {
  return artifacts.flatMap((artifact, index) => {
    const idPrefix = `run-manifest.artifact.${index}`
    if (typeof artifact.path !== "string" || artifact.path.length === 0) return []
    const artifactPath = resolve(runDir, artifact.path)
    const relativeArtifactPath = relative(runDir, artifactPath)
    const staysInsideRunDir = relativeArtifactPath !== "" && !relativeArtifactPath.startsWith("..") && !isAbsolute(relativeArtifactPath)
    const exists = staysInsideRunDir && existsSync(artifactPath)
    const checks = [
      check(`${idPrefix}.inside-run-dir`, staysInsideRunDir, `manifest artifact stays inside the run directory: ${artifact.path}`),
      check(`${idPrefix}.exists`, exists, `manifest artifact exists on disk: ${artifact.path}`),
    ]
    if (!exists) return checks
    const stats = fileHashAndBytes(artifactPath)
    return [
      ...checks,
      check(`${idPrefix}.bytes`, artifact.bytes === stats.bytes, `manifest artifact byte size matches: ${artifact.path}`),
      check(`${idPrefix}.hash`, artifact.hash === stats.hash, `manifest artifact sha256 matches: ${artifact.path}`),
    ]
  })
}

function runArtifactPathsUnique(artifacts: Partial<ExternalToolArtifactManifest>[]): boolean {
  const paths = artifacts.map((artifact) => artifact.path).filter((path): path is string => typeof path === "string" && path.length > 0)
  return new Set(paths).size === paths.length
}

function runArtifactFormatSupported(artifact: Partial<ExternalToolArtifactManifest>): boolean {
  return artifact.format === "jsonl" || artifact.format === "json" || artifact.format === "compact" || artifact.format === "html" || artifact.format === "log" || artifact.format === "unknown"
}

function runArtifactRoleSupported(artifact: Partial<ExternalToolArtifactManifest>): boolean {
  return artifact.role === "raw-trace" || artifact.role === "viewer" || artifact.role === "log" || artifact.role === "other"
}

function runArtifactHashSupported(artifact: Partial<ExternalToolArtifactManifest>): boolean {
  return typeof artifact.hash === "string" && /^sha256:[a-f0-9]{64}$/.test(artifact.hash)
}

function runArtifactBytesSupported(artifact: Partial<ExternalToolArtifactManifest>): boolean {
  return nonNegativeInteger(artifact.bytes)
}

function fileHashAndBytes(path: string): { hash: string; bytes: number } {
  const bytes = readFileSync(path)
  return {
    hash: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    bytes: bytes.length,
  }
}

function forbiddenRawPayloadKeys(value: unknown): string[] {
  const keys: string[] = []
  visit(value, (key) => {
    const normalized = key.toLowerCase()
    if (
      normalized === "headers" ||
      normalized === "body" ||
      normalized === "messages" ||
      normalized === "rawrequest" ||
      normalized === "rawresponse" ||
      normalized === "authorization" ||
      normalized === "cookie" ||
      normalized === "set-cookie" ||
      normalized === "x-api-key" ||
      normalized === "api_key" ||
      normalized === "access_token" ||
      normalized === "refresh_token"
    ) keys.push(key)
  })
  return keys
}

function visit(value: unknown, onKey: (key: string) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, onKey)
    return
  }
  if (!value || typeof value !== "object") return
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    onKey(key)
    visit(child, onKey)
  }
}
