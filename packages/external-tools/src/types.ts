export type ExternalToolID = "claude-tap"

export type ExternalToolProduct = "opencode" | "pi-mono" | "hermes-agent" | "nanobot" | "codex"

export type ExternalToolArtifactFormat = "jsonl" | "json" | "compact"
export type ExternalToolRunArtifactFormat = ExternalToolArtifactFormat | "html" | "log" | "unknown"

export type ExternalToolCaptureMode = "real-capture" | "capture-only" | "import-only" | "dry-run"

export type ExternalToolInvocationStrategy = "binary" | "uvx" | "explicitPath"

export interface ExternalToolProfile {
  id: ExternalToolID
  label: string
  homepage: string
  repository: string
  license: string
  licenseURL?: string
  packageURL?: string
  copyrightNotice?: string
  noticePath?: string
  vendoredSource: boolean
  supportedProducts: ExternalToolProduct[]
  unsupportedProducts: ExternalToolProduct[]
  unsupportedGaps?: ExternalToolUnsupportedGap[]
  supportedArtifactFormats: ExternalToolArtifactFormat[]
  supportedCaptureModes: ExternalToolCaptureMode[]
  defaultInvocation: {
    strategy: ExternalToolInvocationStrategy
    command: string
    args: string[]
  }
  versionCommand: {
    command: string
    args: string[]
  }
  securityNotes: string[]
  redactionPolicyRef: string
  minVersion?: string
  knownVersionRange?: string
  installHints?: string[]
  captureExamples?: Array<{ product: ExternalToolProduct; command: string }>
  lossinessNotes?: string[]
  upstreamSupportMatrixRef?: string
}

export interface ExternalToolUnsupportedGap {
  product: ExternalToolProduct
  status: "unsupported-by-tool" | "needs-harness-capture" | "needs-upstream-support"
  reason: string
  nextAction: string
}

export interface ExternalToolRunManifest {
  schemaVersion: 1
  artifactKind: "external-tool-run-manifest"
  runID: string
  toolID: ExternalToolID
  toolVersion: string
  invocation: {
    strategy: ExternalToolInvocationStrategy
    command: string
    resolvedCommand: string
    args: string[]
    cwd: string
    envAllowlist: string[]
  }
  product?: ExternalToolProduct
  taskID?: string
  captureMode: ExternalToolCaptureMode
  startedAt: string
  finishedAt?: string
  exitCode?: number
  artifacts: ExternalToolArtifactManifest[]
}

export interface ExternalToolArtifactManifest {
  path: string
  hash: string
  bytes: number
  format: ExternalToolRunArtifactFormat
  role: "raw-trace" | "viewer" | "log" | "other"
}

export interface ExternalToolCaptureDryRunResult {
  ok: true
  dryRun: true
  manifest: ExternalToolRunManifest
  manifestPath: string
}

export interface ExternalToolCaptureRunResult {
  ok: boolean
  dryRun: false
  manifest: ExternalToolRunManifest
  manifestPath: string
  stdoutPath: string
  stderrPath: string
  rawDir: string
  logsDir: string
  normalizedDir: string
  error?: string
}

export type NativeCaptureStage = "identity" | "session" | "prompt" | "provider" | "tool" | "runtime" | "final"

export interface NativeCaptureArtifact {
  schemaVersion: 1
  artifactKind: "external-tool-native-capture"
  generatedAt: string
  sourceTool: ExternalToolID
  sourceToolVersion: string
  sourceArtifact: {
    format: ExternalToolArtifactFormat
    hash: string
    bytes: number
  }
  product: ExternalToolProduct
  taskID: string
  captureMode: ExternalToolCaptureMode
  lossiness: {
    observability: "external-proxy-capture"
    rawPrompt: "fingerprint-only"
    rawProviderPayload: "shape-summary-only"
    rawToolPayload: "fingerprint-only"
    nativeInternals: "unobservable"
  }
  providerRequests: ProviderRequestEvidence[]
  promptEvidence: PromptEvidence[]
  toolEvidence: ToolEvidence[]
  streamEvidence: StreamEvidence[]
  usageEvidence: UsageEvidence[]
  stageEvidence: StageEvidence[]
  redactionPolicy: {
    version: 1
    containsRawPrompt: false
    credentials: "redacted"
    hostPaths: "normalized"
  }
  summary: {
    records: number
    providerRequests: number
    promptEvidence: number
    toolEvidence: number
    streamEvents: number
    models: string[]
    protocols: string[]
    statusCodes: number[]
  }
}

export interface ProviderRequestEvidence {
  requestID: string
  turn: number
  timestamp?: string
  method: string
  path: string
  upstreamBaseURL?: string
  protocol: string
  modelID: string
  status: number
  durationMs: number
  requestHeaderSummary?: HeaderSummary
  responseHeaderSummary?: HeaderSummary
  requestShape: JSONShapeSummary
  responseShape: JSONShapeSummary
}

export interface HeaderSummary {
  count: number
  names: string[]
  redactedNames: string[]
  fingerprint: string
}

export interface PromptEvidence {
  requestID: string
  turn: number
  protocol: string
  modelID: string
  systemFingerprint?: string
  developerFingerprint?: string
  userFingerprint?: string
  toolNames: string[]
  toolSchemaFingerprints: string[]
  messageCount: number
}

export interface ToolEvidence {
  requestID: string
  turn: number
  source: "request-schema" | "response-call"
  toolName: string
  callID?: string
  argumentFingerprint?: string
  resultFingerprint?: string
  order: number
}

export interface StreamEvidence {
  requestID: string
  turn: number
  protocol: string
  eventCount: number
  finishReason?: string
  reconstructedResponse?: StreamReconstructionSummary
  responseFingerprint: string
}

export interface StreamReconstructionSummary {
  eventTypes: string[]
  chunkTypes: string[]
  textBytes: number
  textFingerprint?: string
  toolCallCount: number
  toolArgumentBytes: number
  toolArgumentFingerprint?: string
  finishReason?: string
  semanticFingerprint: string
}

export interface UsageEvidence {
  requestID: string
  turn: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreateTokens: number
  totalTokens?: number
}

export interface StageEvidence {
  stage: NativeCaptureStage
  observability: "external-proxy-capture" | "aggregated" | "inferred" | "unobservable"
  evidenceCount: number
  summary: string
  fingerprints: string[]
}

export interface JSONShapeSummary {
  type: string
  fingerprint: string
  keys: string[]
  itemCount?: number
  stringBytes?: number
}

export interface ExternalToolCheck {
  id: string
  ok: boolean
  message: string
}

export interface ExternalToolVerificationReport {
  ok: boolean
  checks: ExternalToolCheck[]
  issues: ExternalToolCheck[]
}

export interface ExternalToolDoctorResult {
  toolID: ExternalToolID
  label: string
  ok: boolean
  installed: boolean
  command: string
  args: string[]
  version?: string
  error?: string
  profile: {
    supportedProducts: ExternalToolProduct[]
    supportedArtifactFormats: ExternalToolArtifactFormat[]
    supportedCaptureModes: ExternalToolCaptureMode[]
  }
}
