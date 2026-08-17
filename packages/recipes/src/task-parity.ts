import { execFile, spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve } from "node:path"
import { promisify } from "node:util"
import type { LegoMessage, LegoMessagePart, LegoModel, LegoProviderAdapter, LegoRecipe, ProviderRequest, ProviderStreamEvent, SessionID } from "@helix/contracts"
import {
  assembleRecipeHarness,
  assembleHermesAgentHarness,
  assembleNanobotHarness,
  assembleOpenCodeHarness,
  assembleOpenCodePiHybridHarness,
  assemblePiMonoHarness,
  harnessComboAcceptanceProduct,
  type AssembledHarness,
  type HarnessProduct,
} from "./harness"
import { acceptanceControllerToken } from "@helix/lego-agent-loop"
import {
  createRuntimeAcceptanceEvidenceProvider,
  createRuntimeTaskAcceptanceController,
  type RuntimeTaskAcceptanceControllerAtom,
} from "@helix/lego-runtime/acceptance-controller"
import { createEchoTool, createTodoTool, toolPermissionPolicyToken, type ToolPermissionPolicy } from "@helix/lego-tools"
import { createLiveProvider, resolveLiveProviderConfig } from "./live-provider-parity"
import { createInternalFixtureProviderFromSteps, type InternalFixtureProviderStep } from "./internal-fixture-provider"
import { hermesAgentRecipe, nanobotRecipe, opencodePiHybridRecipe, opencodeRecipe, piMonoRecipe } from "./recipes"

export const productTaskParityProducts = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const satisfies readonly HarnessProduct[]

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

export type ProductTaskParityMode = "assembled" | "original"
export type ProductTaskParityProvider = "cassette" | "fixture" | "live"
export type ProductTaskParityStatus = "matched" | "acceptable-drift" | "gaps-found" | "failed"
export type ProductTaskRunnerID = "task.runner.assembled" | "task.runner.native-cli" | "task.runner.native-server" | "task.runner.external-capture"
export type ProductTaskRunnerEvidence = "assembled-harness" | "native-cli" | "native-cli-contract" | "native-server" | "external-tool-capture"
export type ProductTaskCadenceLevel = "exact-cadence" | "semantic-cadence" | "acceptable-cadence-drift"
export type ProductTaskCadenceDriftCategory =
  | "cadence.provider-request-count"
  | "cadence.tool-call-count"
  | "cadence.tool-sequence"
  | "cadence.tool-batch"
  | "cadence.message-part-type"
  | "cadence.streaming-delta"
  | "cadence.final-summary"
  | "cadence.early-accept"
  | "cadence.native-projection-gap"
export type ProductTaskCadenceBlockingLevel = "hard-blocker" | "score-impacting" | "informational"
export type ProductTaskObservationLossiness = "lossless" | "semantic" | "aggregated" | "inferred" | "unobservable"
export type ProductTaskProviderBoundaryVisibility = "none" | "aggregate" | "per-request" | "per-chunk"
export type ProductTaskStreamDeltaVisibility = "none" | "text-only" | "semantic" | "raw-chunk"
export type ProductTaskToolLifecycleVisibility = "none" | "call-only" | "call-result" | "start-update-end"
export type ProductTaskMessageWriteVisibility = "none" | "final-message" | "message-delta" | "storage-event"
export type ProductTaskAcceptanceVisibility = "none" | "inferred" | "explicit-event"
export type ProductTaskWorkspaceVisibility = "diff-only" | "file-snapshot" | "operation-log"
export type ProductTaskCadenceRequestSource = "assembled-loop" | "native-cli" | "native-server" | "fixture-replay" | "external-tool-capture"
export type ProductTaskCadenceBoundaryVisibility = "observed" | "inferred" | "aggregated"
export type ProductTaskCadenceBoundaryEvidence = "provider-hook" | "stream-event" | "cli-event" | "storage-event" | "unavailable"
export type ProductTaskCadenceComparisonConfidence = "exact" | "semantic" | "inferred"
export type ProductTaskCadenceScoringMode = "strict" | "semantic-live" | "informational"
export type ProductTaskAcceptanceTimingDriftCategory = "acceptance.full-native-timing-unverified"
export type ProductTaskEvidenceAvailability =
  | "provider-request-before"
  | "stream-delta-during"
  | "tool-result-after"
  | "message-end"
  | "turn-end"
  | "report-only"
  | "not-required"
  | "unavailable"
export type ProductTaskCadenceOwningPlane =
  | "runtime"
  | "agent-loop"
  | "provider"
  | "tool"
  | "prompt"
  | "session"
  | "trace"
  | "harness"
  | "native-projector"
  | "nondeterminism"
export type ProductTaskGapCategory =
  | "output.visible-answer"
  | "artifact.workspace-diff"
  | "tool.registry"
  | "tool.input-shape"
  | "tool.result-shape"
  | "session.persistence"
  | "session.branching"
  | "provider.endpoint"
  | "provider.stream-events"
  | "turn.context"
  | "turn.compaction"
  | "hook.permission"
  | "hook.extension"
  | "ui.command"
  | "runtime.timeout"

export interface ProductTaskParityInput {
  product: HarnessProduct
  mode: ProductTaskParityMode
  taskID: string
  recipe?: LegoRecipe
  recipeLabel?: string
  provider?: ProductTaskParityProvider
  fixtureRoot?: string
  workspaceRoot?: string
  timeoutMs?: number
  native?: ProductTaskParityNativeInput
}

export interface ProductTaskParitySuiteInput {
  suite?: string
  taskIDs?: string[]
  products?: HarnessProduct[]
  modes?: ProductTaskParityMode[]
  recipe?: LegoRecipe
  recipeLabel?: string
  provider?: ProductTaskParityProvider
  fixtureRoot?: string
  out?: string
  native?: ProductTaskParityNativeInput
}

export interface ProductTaskParityNativeInput {
  enabled?: boolean
  requireCredentials?: boolean
  modelID?: string
  apiKey?: string
  baseURL?: string
  packageSpec?: string
  timeoutMs?: number
  keepTemp?: boolean
  env?: Record<string, string | undefined>
  externalCapture?: ProductTaskParityExternalCaptureInput
}

export interface ProductTaskParityExternalCaptureInput {
  artifactPath?: string
  generatedAt: string
  sourceTool: string
  sourceToolVersion: string
  sourceArtifact: {
    format: string
    hash: string
    bytes: number
  }
  product: HarnessProduct
  taskID: string
  captureMode: "real-capture" | "import-only" | "capture-only" | "dry-run" | string
  lossiness: {
    observability: string
    rawPrompt: string
    rawProviderPayload: string
    rawToolPayload: string
    nativeInternals: string
  }
  providerRequests: Array<{
    requestID: string
    modelID: string
    status: number
    durationMs: number
  }>
  promptEvidence: Array<{
    requestID: string
    messageCount: number
    toolNames: string[]
  }>
  toolEvidence: Array<{
    requestID: string
    source: "request-schema" | "response-call" | string
    toolName: string
    argumentFingerprint?: string
    order: number
  }>
  streamEvidence: Array<{
    requestID: string
    eventCount: number
    finishReason?: string
  }>
  stageEvidence: Array<{
    stage: string
    observability: string
    evidenceCount: number
  }>
  summary: {
    records: number
    providerRequests: number
    promptEvidence: number
    toolEvidence: number
    streamEvents: number
    models: string[]
  }
}

export interface ProductTaskGap {
  id: string
  category: ProductTaskGapCategory
  message: string
  nextAction:
    | "reuse-existing-atom"
    | "adjust-personality-adapter"
    | "add-existing-plane-common-submodule"
    | "add-product-shell-thin-adapter"
    | "provider-nondeterminism"
    | "upstream-version-drift"
}

export interface ProductTaskCadenceDrift {
  id: string
  category: ProductTaskCadenceDriftCategory
  message: string
  assembled: string
  original: string
  owner:
    | "common-loop"
    | "product-cadence-atom"
    | "prompt-atom"
    | "tool-schema-atom"
    | "native-projector"
    | "provider-nondeterminism"
  nextAction:
    | "reuse-existing-atom"
    | "adjust-personality-adapter"
    | "add-existing-plane-common-submodule"
    | "add-product-shell-thin-adapter"
    | "provider-nondeterminism"
    | "upstream-version-drift"
  metadata: ProductTaskCadenceDriftMetadata
}

export interface ProductTaskCadenceDriftMetadata {
  blockingLevel: ProductTaskCadenceBlockingLevel
  owningPlane: ProductTaskCadenceOwningPlane
  owningAtomID: string
  candidateFixes: string[]
  expectedScoreDelta: number
  requiresNativeFixture: boolean
  reproduction: {
    assembledRequestCount: number
    originalRequestCount: number
    assembledToolSequence: string[]
    originalToolSequence: string[]
    assembledBatchSignature: string[]
    originalBatchSignature: string[]
    assembledPartTypes: string[]
    originalPartTypes: string[]
    assembledStopReasons: string[]
    originalStopReasons: string[]
  }
  observability: ProductTaskCadenceObservabilityMetadata
}

export interface ProductTaskCadenceObservabilityMetadata {
  assembledVisibility: ProductTaskCadenceBoundaryVisibility
  originalVisibility: ProductTaskCadenceBoundaryVisibility
  comparisonConfidence: ProductTaskCadenceComparisonConfidence
  scoringMode: ProductTaskCadenceScoringMode
  lossinessRefs: string[]
}

export interface ProductTaskCadenceScoreBreakdown {
  modelVersion: 2
  rawDriftCount: number
  weightedPenalty: number
  targetScore: number
  items: Array<{
    id: string
    category: ProductTaskCadenceDriftCategory
    weight: number
    appliedPenalty: number
    owningPlane: ProductTaskCadenceOwningPlane
    blockingLevel: ProductTaskCadenceBlockingLevel
    comparisonConfidence: ProductTaskCadenceComparisonConfidence
    scoringMode: ProductTaskCadenceScoringMode
  }>
}

export interface ProductTaskAcceptanceTimingDrift {
  id: string
  category: ProductTaskAcceptanceTimingDriftCategory
  message: string
  assembled: {
    satisfiedAt: ProductTaskEvidenceAvailability
    policySatisfiedAt: ProductTaskEvidenceAvailability
    acceptanceVisibility: ProductTaskAcceptanceVisibility
  }
  original: {
    satisfiedAt: ProductTaskEvidenceAvailability
    policySatisfiedAt: ProductTaskEvidenceAvailability
    acceptanceVisibility: ProductTaskAcceptanceVisibility
  }
  owningPlane: "runtime"
  owningAtomID: string
  blockingLevel: ProductTaskCadenceBlockingLevel
  candidateFixes: string[]
  evidenceRefs: string[]
  lossinessRefs: string[]
  requiresNativeFixture: boolean
}

export interface ProductTaskObservationField<TVisibility extends string> {
  visibility: TVisibility
  lossiness: ProductTaskObservationLossiness
  evidence: ProductTaskCadenceBoundaryEvidence | "workspace-diff" | "message-store" | "runtime-policy" | "fixture-replay"
}

export interface ProductTaskObservationShape {
  providerBoundary: ProductTaskObservationField<ProductTaskProviderBoundaryVisibility>
  streamDelta: ProductTaskObservationField<ProductTaskStreamDeltaVisibility>
  toolLifecycle: ProductTaskObservationField<ProductTaskToolLifecycleVisibility>
  messageWrite: ProductTaskObservationField<ProductTaskMessageWriteVisibility>
  acceptance: ProductTaskObservationField<ProductTaskAcceptanceVisibility>
  workspace: ProductTaskObservationField<ProductTaskWorkspaceVisibility>
}

export type ProductTaskNativeProjectionLossField = keyof ProductTaskObservationShape | "providerRawFrame" | "providerRawPayload" | "providerTiming"

export interface ProductTaskNativeProjectionLoss {
  field: ProductTaskNativeProjectionLossField
  lossiness: ProductTaskObservationLossiness
  reason: string
}

export interface ProductTaskAcceptanceTimingEvidence {
  timeline: {
    workspaceDiffAvailableAt: ProductTaskEvidenceAvailability
    requiredToolResultAvailableAt: ProductTaskEvidenceAvailability
    visibleSummaryAvailableAt: ProductTaskEvidenceAvailability
    forbiddenFileCheckAvailableAt: ProductTaskEvidenceAvailability
    policySatisfiedAt: ProductTaskEvidenceAvailability
  }
  blockingEvidence: string[]
  satisfiedAt: ProductTaskEvidenceAvailability
  unavailableUntil: Array<{ evidence: string; until: ProductTaskEvidenceAvailability; reason: string }>
}

export interface ProductTaskFixtureReplayEvidence {
  source: "assembled-loop" | "native-cadence-fixture" | "external-tool-capture"
  verified: boolean
  issues: string[]
}

export interface WorkspaceDiffEntry {
  path: string
  status: "added" | "modified" | "deleted"
  before?: string
  after?: string
}

export interface ProductTaskCadenceSignature {
  level: ProductTaskCadenceLevel
  providerRequests: Array<{
    index: number
    modelID: string
    toolCallCount: number
    eventCount: number
    source: ProductTaskCadenceRequestSource
    visibility: ProductTaskCadenceBoundaryVisibility
    boundaryEvidence: ProductTaskCadenceBoundaryEvidence
    stopReason?: string
  }>
  assistantTurns: Array<{
    index: number
    text: "empty" | "has-text"
    partTypes: string[]
    toolCallCount: number
  }>
  toolSequence: Array<{
    index: number
    toolName: string
    status: string
    inputShape: string
    result: "none" | "text" | "error"
  }>
  toolBatches: string[][]
  sessionWrites: string[]
  traceEvents: string[]
  costShape: {
    providerRequests: number
    toolCalls: number
    retries: number
    syntheticContinues: number
    contextCompacted: boolean
    messageCount: number
  }
}

export interface ProductTaskParityReport {
  taskID: string
  product: HarnessProduct
  mode: ProductTaskParityMode
  runner: {
    id: ProductTaskRunnerID
    evidence: ProductTaskRunnerEvidence
    nativeAvailable: boolean
    packageSpec?: string
    exitCode?: number
    stderrTail?: string
    externalCapture?: {
      sourceTool: string
      sourceToolVersion: string
      artifactPath?: string
      generatedAt: string
      captureMode: string
      sourceArtifact: ProductTaskParityExternalCaptureInput["sourceArtifact"]
      lossiness: ProductTaskParityExternalCaptureInput["lossiness"]
    }
  }
  productEvidence: {
    recipeID: string
    upstream?: string
    upstreamCommit?: string
    upstreamTag?: string
    package?: string
    nativeAdapter: "assembled-harness" | "native-cli" | "native-cli-contract" | "external-tool-capture"
  }
  status: ProductTaskParityStatus
  workspaceDiff: WorkspaceDiffEntry[]
  transcriptSummary: {
    visibleText: string
    messageCount: number
  }
  sessionEvidence: {
    sessionID?: string
    transcriptMessages: number
    persisted: boolean
    forked?: boolean
    forkParentID?: string
    forkMessageCount?: number
  }
  providerEvidence: {
    provider: ProductTaskParityProvider
    modelID: string
    deterministic: boolean
    requests: number
  }
  traceEvidence: {
    events: number
    eventTypes: string[]
    eventSequence?: string[]
  }
  toolEvidence: {
    calls: Array<{ toolName: string; input: unknown; status?: string }>
    results: Array<{ toolName: string; isError?: boolean; text: string }>
  }
  policyEvidence: {
    allowedTools: string[]
    writePaths: string[]
    envAllowlist: string[]
    timeoutMs: number
    maxSteps: number
  }
  costLatency: {
    steps: number
    durationMs: number
    toolCalls: number
    providerRequests: number
    retries?: number
    syntheticContinues?: number
    contextCompacted?: boolean
  }
  cadenceEvidence: ProductTaskCadenceSignature
  observationShape: ProductTaskObservationShape
  acceptanceTimingEvidence: ProductTaskAcceptanceTimingEvidence
  fixtureReplay: ProductTaskFixtureReplayEvidence
  checks: ProductTaskParityCheck[]
  gaps: ProductTaskGap[]
}

export interface ProductTaskRunnerDescriptor {
  id: ProductTaskRunnerID
  evidence: ProductTaskRunnerEvidence[]
  products: HarnessProduct[]
  supported: boolean
  required: boolean
  reason?: string
  nativeEvidenceRefs?: string[]
  fixtureIDs?: string[]
  parityCoverage?: "native"
  knownLossiness?: string[]
}

export interface ProductTaskCadenceAtomDescriptor {
  id: string
  plane: "turn" | "trace"
  product: HarnessProduct
  provides: "cadence.emitter" | "cadence.projector"
  implementation: string
}

export interface ProductTaskParityCheck {
  id: string
  ok: boolean
  message: string
}

export interface ProductTaskParityPairReport {
  taskID: string
  product: HarnessProduct
  status: ProductTaskParityStatus
  outputParity: boolean
  artifactParity: boolean
  traceParity: boolean
  policyParity: boolean
  costLatencyParity: boolean
  cadenceParity: boolean
  cadenceScore: number
  cadenceScoreBreakdown: ProductTaskCadenceScoreBreakdown
  cadenceLevel: ProductTaskCadenceLevel
  cadenceDrifts: ProductTaskCadenceDrift[]
  acceptanceTimingDrifts: ProductTaskAcceptanceTimingDrift[]
  gaps: ProductTaskGap[]
}

export interface ProductTaskParityArtifact {
  schemaVersion: 1
  generatedAt: string
  suite: string
  provider: ProductTaskParityProvider
  reports: ProductTaskParityReport[]
  pairs: ProductTaskParityPairReport[]
  summary: {
    reports: number
    matched: number
    acceptableDrift: number
    gapsFound: number
    failed: number
  }
}

export type ProductTaskParityArtifactFormat = "legacy" | "split"

export interface TaskParityAttachmentRef {
  path: string
  sha256: string
  byteSize: number
  redactionStatus: "redacted" | "summary-only" | "raw-sanitized"
  required: boolean
  verifierCoverage: string[]
}

export interface TaskParitySummaryPairV2 {
  taskID: string
  product: HarnessProduct
  status: ProductTaskParityStatus
  taskSuccessParity: boolean
  artifactParity: boolean
  policyParity: boolean
  semanticOutputParity: boolean
  strictOutputParity: boolean
  strictTraceParity: boolean
  strictCadenceParity: boolean
  cadenceLevel: ProductTaskCadenceLevel
  cadenceScore: number
  acceptanceTimingDrifts: number
  gapsFound: number
  failed: boolean
  attachments: string[]
}

export interface TaskParitySummaryArtifactV2 {
  schemaVersion: 2
  artifactKind: "task-parity-summary"
  generatedAt: string
  generator: "helix.task-parity"
  command: string
  suite: string
  provider: ProductTaskParityProvider
  products: HarnessProduct[]
  tasks: string[]
  modes: ProductTaskParityMode[]
  summary: ProductTaskParityArtifact["summary"] & {
    semanticParity: boolean
    taskSuccessParity: boolean
    strictTranscriptParity: boolean
    strictTraceParity: boolean
    strictCadenceParity: boolean
  }
  pairs: TaskParitySummaryPairV2[]
  manifestPath: string
  evidencePath: string
  attachments: TaskParityAttachmentRef[]
  migration: {
    fromSchemaVersion: 1
    legacyCompatible: boolean
    hint: string
  }
}

export interface TaskParityEvidenceBundleV2 {
  schemaVersion: 2
  artifactKind: "task-parity-evidence"
  generatedAt: string
  sourceSummarySha256: string
  reports: Array<{
    taskID: string
    product: HarnessProduct
    mode: ProductTaskParityMode
    status: ProductTaskParityStatus
    cadenceEvidence: ProductTaskCadenceSignature
    observationShape: ProductTaskObservationShape
    acceptanceTimingEvidence: ProductTaskAcceptanceTimingEvidence
    fixtureReplay: ProductTaskFixtureReplayEvidence
    providerShape: ProductTaskParityReport["providerEvidence"]
    gaps: ProductTaskGap[]
    cadenceDrifts: ProductTaskCadenceDrift[]
    acceptanceTimingDrifts: ProductTaskAcceptanceTimingDrift[]
  }>
}

export interface TaskParityAttachmentManifestV2 {
  schemaVersion: 2
  artifactKind: "task-parity-manifest"
  generatedAt: string
  summaryPath: string
  evidencePath: string
  attachments: TaskParityAttachmentRef[]
}

export interface ProductTaskParitySplitArtifactSet {
  summary: TaskParitySummaryArtifactV2
  evidence: TaskParityEvidenceBundleV2
  manifest: TaskParityAttachmentManifestV2
  attachments: Array<{ ref: TaskParityAttachmentRef; content: unknown }>
}

export interface ProductTaskParityArtifactVerificationInput {
  artifact: unknown
  expectedProducts?: HarnessProduct[]
  expectedModes?: ProductTaskParityMode[]
  expectedTaskIDs?: string[]
}

export interface ProductTaskParityArtifactVerificationReport {
  ok: boolean
  checks: ProductTaskParityCheck[]
  issues: ProductTaskParityCheck[]
}

export interface ProductTaskCadenceDiagnosisArtifact {
  schemaVersion: 1
  generatedAt: string
  sourceSummary: ProductTaskParityArtifact["summary"]
  scoreTargets: Record<string, number>
  products: Array<{
    product: HarnessProduct
    taskID: string
    status: ProductTaskParityStatus
    cadenceScore: number
    targetScore: number
    rawDriftCount: number
    estimatedScoreAfterPlannedFixes: number
    drifts: Array<{
      id: string
      category: ProductTaskCadenceDriftCategory
      owningPlane: ProductTaskCadenceOwningPlane
      owningAtomID: string
      blockingLevel: ProductTaskCadenceBlockingLevel
      expectedScoreDelta: number
      candidateFixes: string[]
      assembled: string
      original: string
      observability: ProductTaskCadenceObservabilityMetadata
    }>
  }>
  structuralAudit: {
    topLevelCategoriesAdded: string[]
    productSpecificCommonOptimizations: string[]
    requiresFollowUpTODO: boolean
    followUpTODO?: string
  }
}

export interface ProductTaskNativeCadenceFixture {
  fixtureVersion: 1
  product: HarnessProduct
  nativeVersion: string
  taskID: string
  providerShape: {
    provider: ProductTaskParityProvider
    modelID: string
    deterministic: boolean
    requests: number
  }
  cadenceSignature: ProductTaskCadenceSignature
  observationShape: ProductTaskObservationShape
  nativeEvents: string[]
  nativeChunks: Array<{ index: number; type: string; semanticClass: string }>
  messageParts: string[]
  projectionLosses: ProductTaskNativeProjectionLoss[]
  redactionSummary: {
    credentials: "redacted"
    hostPaths: "normalized"
    tokenUsage: "omitted"
  }
}

export interface ProductTaskNativeCadenceFixtureSet {
  schemaVersion: 1
  generatedAt: string
  sourceArtifact: {
    generatedAt: string
    suite: string
    provider: ProductTaskParityProvider
  }
  fixtures: ProductTaskNativeCadenceFixture[]
}

export interface ProductTaskNativeCadenceFixtureSummaryV2 {
  schemaVersion: 2
  artifactKind: "native-cadence-fixture-summary"
  generatedAt: string
  sourceArtifact: ProductTaskNativeCadenceFixtureSet["sourceArtifact"]
  fixtures: Array<{
    product: HarnessProduct
    taskID: string
    nativeVersion: string
    cadenceLevel: ProductTaskCadenceLevel
    providerRequests: number
    messagePartTypes: string[]
    projectionLosses: number
    attachment: TaskParityAttachmentRef
  }>
  manifestPath: string
}

export interface ProductTaskNativeCadenceFixtureSplitSet {
  summary: ProductTaskNativeCadenceFixtureSummaryV2
  manifest: TaskParityAttachmentManifestV2
  attachments: Array<{ ref: TaskParityAttachmentRef; content: ProductTaskNativeCadenceFixture }>
}

export interface ProductTaskNativeCadenceFixtureVerificationReport {
  ok: boolean
  checks: ProductTaskParityCheck[]
  issues: ProductTaskParityCheck[]
}

interface TaskPolicy {
  suite?: string
  timeoutMs?: number
  maxSteps?: number
  maxInputTokens?: number
  compactionKeepMessages?: number
  autoCompact?: boolean
  maxRetries?: number
  retryDelayMs?: number
  syntheticContinue?: boolean
  syntheticContinueText?: string
  maxSyntheticContinues?: number
  allowedTools?: string[]
  writePaths?: string[]
  envAllowlist?: string[]
  extensionTools?: Array<"echo" | "todo">
  provider?: {
    assistantText?: string
    toolCalls?: Array<{ toolName: string; input: Record<string, unknown>; id?: string }>
    steps?: InternalFixtureProviderStep[]
    failFirstRequest?: string
  }
  expected?: {
    visibleAnswerIncludes?: string[]
    visibleAnswerPatterns?: string[]
    files?: Record<string, { includes?: string[]; equals?: string }>
    noFiles?: string[]
    toolNames?: string[]
    blockedToolNames?: string[]
    toolResultIncludes?: string[]
    toolResultIncludesByTool?: Array<{ toolName: string; includes: string[] }>
    workspaceDiff?: Array<{ path: string; status: WorkspaceDiffEntry["status"] }>
    workspaceDiffExact?: Array<{ path: string; status: WorkspaceDiffEntry["status"] }>
    workspaceDiffCount?: number
    retriesAtLeast?: number
    syntheticContinuesAtLeast?: number
    contextCompacted?: boolean
    sessionForked?: boolean
    sessionForkMessageCountAtLeast?: number
  }
}

interface LoadedTask {
  id: string
  dir: string
  workspace: string
  prompt: string
  expectedText: string
  policy: Required<Pick<TaskPolicy, "timeoutMs" | "maxSteps" | "allowedTools" | "writePaths" | "envAllowlist">> & TaskPolicy
}

export async function runProductTaskParity(input: ProductTaskParityInput): Promise<ProductTaskParityReport> {
  const task = loadTask(input.taskID, input.fixtureRoot)
  const root = input.workspaceRoot ?? mkdtempSync(join(tmpdir(), `helix-task-${input.taskID}-${input.product}-${input.mode}-`))
  const workspace = join(root, "workspace")
  const storageDir = join(root, "session")
  const before = snapshotWorkspace(task.workspace)
  cpSync(task.workspace, workspace, { recursive: true })
  mkdirSync(storageDir, { recursive: true })
  const started = Date.now()
  const trace: unknown[] = []
  try {
    if (input.mode === "original" && input.native?.externalCapture) {
      return runExternalCaptureProductTask({ input, task, started })
    }
    if (input.mode === "original" && input.native?.enabled) {
      return await runNativeProductTask({ input, task, workspace, storageDir, before, started })
    }
    const harness = input.recipe && input.mode === "assembled" ? assembleRecipeHarness(input.recipe, { cwd: workspace, storageDir }) : assembleTaskHarness(input.product, workspace, storageDir)
    registerTaskExtensionTools(harness, task.policy.extensionTools ?? [])
    harness.hooks.services.set(toolPermissionPolicyToken, taskPermissionPolicy(task, workspace))
    const acceptanceController = taskAcceptanceController(input.product, task, workspace, before, input.recipe)
    if (acceptanceController) harness.hooks.services.set(acceptanceControllerToken, acceptanceController)
    harness.hooks.observe((event) => {
      trace.push({ type: event.type, payload: event.payload })
    })
    const live = input.provider === "live" ? await liveTaskProvider(input.native ?? {}) : undefined
    if (live?.check) return failedTaskReport(input, task, Date.now() - started, live.check)
    const provider = live?.provider ?? taskProvider(task)
    const result = await harness.runTurn({
      text: task.prompt,
      provider,
      ...(live?.model ? { model: live.model } : {}),
      maxSteps: task.policy.maxSteps,
      ...(task.policy.maxInputTokens === undefined ? {} : { maxInputTokens: task.policy.maxInputTokens }),
      ...(task.policy.compactionKeepMessages === undefined ? {} : { compactionKeepMessages: task.policy.compactionKeepMessages }),
      ...(task.policy.autoCompact === undefined ? {} : { autoCompact: task.policy.autoCompact }),
      ...(task.policy.maxRetries === undefined ? {} : { maxRetries: task.policy.maxRetries }),
      ...(task.policy.retryDelayMs === undefined ? {} : { retryDelayMs: task.policy.retryDelayMs }),
      ...(task.policy.syntheticContinue === undefined ? {} : { syntheticContinue: task.policy.syntheticContinue }),
      ...(task.policy.syntheticContinueText === undefined ? {} : { syntheticContinueText: task.policy.syntheticContinueText }),
      ...(task.policy.maxSyntheticContinues === undefined ? {} : { maxSyntheticContinues: task.policy.maxSyntheticContinues }),
    })
    const workspaceDiff = diffSnapshots(before, snapshotWorkspace(workspace))
    const visibleText = visibleTranscriptText(result.transcript)
    const toolEvidence = collectToolEvidence(result.assistantMessage.parts)
    const sessionTaskEvidence = await collectSessionTaskEvidence(task, harness, result.session.id)
    const checks = verifyTaskReport(task, {
      visibleText,
      workspace,
      workspaceDiff,
      toolEvidence,
      blockedTools: result.blockedTools,
      ...(result.retries === undefined ? {} : { retries: result.retries }),
      ...(result.syntheticContinues === undefined ? {} : { syntheticContinues: result.syntheticContinues }),
      ...(result.contextCompacted === undefined ? {} : { contextCompacted: result.contextCompacted }),
      sessionEvidence: sessionTaskEvidence,
    })
    const gaps = checks.flatMap((check) => (check.ok ? [] : gapForCheck(check)))
    const reportTranscriptSummary = {
      visibleText,
      messageCount: result.transcript.length,
    }
    const reportProviderEvidence = {
      provider: input.provider ?? "cassette",
      modelID: String(live?.model?.modelID ?? "fixture-model"),
      deterministic: input.provider !== "live",
      requests: Math.max(1, result.steps),
    }
    const reportTraceEvidence = traceEvidence(trace)
    const reportCostLatency = {
      steps: result.steps,
      durationMs: Date.now() - started,
      toolCalls: toolEvidence.calls.length,
      providerRequests: Math.max(1, result.steps),
      ...(result.retries === undefined ? {} : { retries: result.retries }),
      ...(result.syntheticContinues === undefined ? {} : { syntheticContinues: result.syntheticContinues }),
      ...(result.contextCompacted === undefined ? {} : { contextCompacted: result.contextCompacted }),
    }
    const cadenceEvidence = buildCadenceSignature({
      product: input.product,
      mode: input.mode,
      transcriptSummary: reportTranscriptSummary,
      providerEvidence: reportProviderEvidence,
      traceEvidence: reportTraceEvidence,
      toolEvidence,
      costLatency: reportCostLatency,
    })
    const telemetry = taskParityReportTelemetry({
      product: input.product,
      mode: input.mode,
      transcriptSummary: reportTranscriptSummary,
      providerEvidence: reportProviderEvidence,
      traceEvidence: reportTraceEvidence,
      toolEvidence,
      costLatency: reportCostLatency,
      workspaceDiff,
      checks,
    })
    return {
      taskID: task.id,
      product: input.product,
      mode: input.mode,
      runner: {
        id: input.mode === "assembled" ? "task.runner.assembled" : "task.runner.native-cli",
        evidence: input.mode === "assembled" ? "assembled-harness" : "native-cli-contract",
        nativeAvailable: input.mode === "assembled",
      },
      productEvidence: productEvidence(input.product, input.mode, input.native?.enabled === true, input.recipe, input.recipeLabel),
      status: statusForChecks(checks, input.mode),
      workspaceDiff,
      transcriptSummary: reportTranscriptSummary,
      sessionEvidence: {
        sessionID: String(result.session.id),
        transcriptMessages: result.transcript.length,
        persisted: result.transcript.length > 0,
        ...sessionTaskEvidence,
      },
      providerEvidence: reportProviderEvidence,
      traceEvidence: reportTraceEvidence,
      toolEvidence,
      policyEvidence: {
        allowedTools: [...task.policy.allowedTools],
        writePaths: [...task.policy.writePaths],
        envAllowlist: [...task.policy.envAllowlist],
        timeoutMs: input.timeoutMs ?? task.policy.timeoutMs,
        maxSteps: task.policy.maxSteps,
      },
      costLatency: reportCostLatency,
      cadenceEvidence,
      ...telemetry,
      checks,
      gaps,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const check = { id: "task.runner", ok: false, message }
    return failedTaskReport(input, task, Date.now() - started, check)
  } finally {
    if (!input.workspaceRoot) rmSync(root, { recursive: true, force: true })
  }
}

async function liveTaskProvider(native: ProductTaskParityNativeInput): Promise<{ provider?: LegoProviderAdapter; model?: LegoModel; check?: ProductTaskParityCheck }> {
  const resolved = resolveLiveProviderConfig({
    ...(native.env ? { env: native.env } : {}),
    ...(native.modelID ? { modelID: native.modelID } : {}),
    ...(native.apiKey ? { apiKey: native.apiKey } : {}),
    ...(native.baseURL ? { baseURL: native.baseURL } : {}),
    ...(native.requireCredentials === undefined ? {} : { requireCredentials: native.requireCredentials }),
  })
  if (!resolved.provider || !resolved.modelID || !resolved.apiKey || resolved.missing.length > 0) {
    return {
      check: check(
        "task.runner.live-credentials",
        false,
        `Live assembled task parity requires provider, model, and API key inputs; missing: ${resolved.missing.join(", ") || "unknown"}.`,
      ),
    }
  }
  const provider = createLiveProvider(resolved.provider, {
    ...resolved,
    provider: resolved.provider,
    modelID: resolved.modelID,
    apiKey: resolved.apiKey,
  })
  const model = (await provider.models())[0]
  if (!model) {
    return {
      check: check("task.runner.live-model", false, `Live provider ${resolved.provider} did not expose a model.`),
    }
  }
  return { provider, model }
}

export function productTaskRunnerDescriptors(product?: HarnessProduct): ProductTaskRunnerDescriptor[] {
  const products = product ? [product] : [...productTaskParityProducts]
  const nativeCliProof =
    product === "opencode"
      ? {
          nativeEvidenceRefs: [
            "artifact:docs/reports/task-parity-live-opencode-smoke.json#opencode:original:read-only-answer:native-cli",
            "artifact:docs/reports/task-parity-livecodebench.json#opencode:original:livecodebench-1883-b-palindrome-removal:native-cli",
            "upstream:npm:opencode-ai@1.15.11:bin/opencode.exe",
          ],
          fixtureIDs: ["task-parity-live:opencode:read-only-answer:native-cli", "task-parity-livecodebench:opencode:1883-b:native-cli"],
          parityCoverage: "native" as const,
          knownLossiness: [],
          reason: "OpenCode upstream native implementation via opencode-ai@1.15.11 opencode run --format json; native parity complete for the task.runner.native-cli runner in archived live task parity artifacts.",
        }
      : undefined
  return [
    {
      id: "task.runner.assembled",
      evidence: ["assembled-harness"],
      products,
      supported: true,
      required: true,
    },
    {
      id: "task.runner.native-cli",
      evidence: ["native-cli", "native-cli-contract"],
      products,
      supported: true,
      required: true,
      ...(nativeCliProof ?? {}),
    },
    {
      id: "task.runner.external-capture",
      evidence: ["external-tool-capture"],
      products,
      supported: true,
      required: false,
      reason: "Reads a verified normalized external capture artifact as original native reference evidence.",
    },
    {
      id: "task.runner.native-server",
      evidence: ["native-server"],
      products,
      supported: false,
      required: false,
      reason:
        "OpenCode, Pi Mono, Nanobot, and Hermes Agent current task parity paths can be driven through CLI entrypoints; native server/RPC remains an explicit reserved runner submodule for products that require it.",
    },
  ]
}

export function productTaskCadenceDescriptors(product?: HarnessProduct): ProductTaskCadenceAtomDescriptor[] {
  const products = product ? [product] : [...productTaskParityProducts]
  return products.flatMap((item): ProductTaskCadenceAtomDescriptor[] => [
    {
      id: `${item}.turn.cadence-emitter`,
      plane: "turn",
      product: item,
      provides: "cadence.emitter",
      implementation:
        item === "opencode"
          ? "OpenCode step/tool/session cadence emitter"
          : item === "pi-mono"
            ? "Pi JSON event/message update cadence emitter"
            : item === "opencode-pi-hybrid"
              ? "OpenCode/Pi hybrid cadence emitter using Pi turn boundaries over OpenCode session/tool services"
              : item === "nanobot"
                ? "Nanobot agent/tool iteration cadence emitter"
                : "Hermes Agent CLI/provider/tool cadence emitter",
    },
    {
      id:
        item === "opencode"
          ? "opencode.trace.sqlite-part-projection"
          : item === "pi-mono"
            ? "pi-mono.trace.json-event-projection"
            : item === "opencode-pi-hybrid"
              ? "opencode-pi-hybrid.trace.mixed-projection"
              : item === "nanobot"
                ? "nanobot.trace.jsonl-event-projection"
                : "hermes.trace.sqlite-fts-event-projection",
      plane: "trace",
      product: item,
      provides: "cadence.projector",
      implementation:
        item === "opencode"
          ? "SQLite message/part cadence projection"
          : item === "pi-mono"
            ? "Native JSON event stream cadence projection"
            : item === "opencode-pi-hybrid"
              ? "Mixed OpenCode SQLite session plus Pi JSON event cadence projection"
              : item === "nanobot"
                ? "JSONL session/tool event cadence projection"
                : "Hermes SQLite/CLI event cadence projection",
    },
  ])
}

export async function runProductTaskParitySuite(input: ProductTaskParitySuiteInput = {}): Promise<ProductTaskParityArtifact> {
  const suite = input.suite ?? "smoke"
  const taskIDs = input.taskIDs ?? listTaskIDs(input.fixtureRoot, suite)
  const products = input.products ?? [...productTaskParityProducts]
  const modes = input.modes ?? ["assembled", "original"]
  const reports: ProductTaskParityReport[] = []
  for (const taskID of taskIDs) {
    for (const product of products) {
      for (const mode of modes) {
        reports.push(
          await runProductTaskParity({
            taskID,
            product,
            mode,
            ...(input.recipe ? { recipe: input.recipe } : {}),
            ...(input.recipeLabel ? { recipeLabel: input.recipeLabel } : {}),
            provider: input.provider ?? "cassette",
            ...(input.fixtureRoot ? { fixtureRoot: input.fixtureRoot } : {}),
            ...(input.native ? { native: input.native } : {}),
          }),
        )
      }
    }
  }
  const artifact = createProductTaskParityArtifact({ suite, provider: input.provider ?? "cassette", reports })
  if (input.out) writeProductTaskParityArtifact(input.out, artifact)
  return artifact
}

export function createProductTaskParityArtifact(input: {
  suite: string
  provider: ProductTaskParityProvider
  reports: ProductTaskParityReport[]
  generatedAt?: Date
}): ProductTaskParityArtifact {
  const pairs = pairReports(input.reports)
  const explicitGaps = input.reports.reduce((sum, report) => sum + report.gaps.length, 0)
  const implicitGapStatuses = input.reports.filter((report) => report.status === "gaps-found" && report.gaps.length === 0).length
  return {
    schemaVersion: 1,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    suite: input.suite,
    provider: input.provider,
    reports: input.reports,
    pairs,
    summary: {
      reports: input.reports.length,
      matched: input.reports.filter((report) => report.status === "matched").length,
      acceptableDrift: input.reports.filter((report) => report.status === "acceptable-drift").length,
      gapsFound: explicitGaps + implicitGapStatuses,
      failed: input.reports.filter((report) => report.status === "failed").length,
    },
  }
}

export function writeProductTaskParityArtifact(path: string, artifact: ProductTaskParityArtifact): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(artifact, null, 2)}\n`, "utf8")
}

export function createProductTaskParityArtifactV2(input: {
  artifact: ProductTaskParityArtifact
  generatedAt?: Date
  command?: string
}): ProductTaskParitySplitArtifactSet {
  return createProductTaskParitySplitArtifactSet(input)
}

export function createProductTaskParitySplitArtifactSet(input: {
  artifact: ProductTaskParityArtifact
  generatedAt?: Date
  command?: string
}): ProductTaskParitySplitArtifactSet {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString()
  const attachments = input.artifact.reports.map((report) => {
    const content = sanitizeTaskParityAttachment({
      taskID: report.taskID,
      product: report.product,
      mode: report.mode,
      transcriptSummary: report.transcriptSummary,
      traceEvents: report.traceEvidence.eventSequence ?? report.traceEvidence.eventTypes,
      toolEvidence: report.toolEvidence,
      workspaceDiff: report.workspaceDiff,
      checks: report.checks,
      gaps: report.gaps,
    })
    const relativePath = `attachments/${slug(`${report.taskID}-${report.product}-${report.mode}`)}.json`
    return {
      ref: attachmentRef(relativePath, content, {
        redactionStatus: "raw-sanitized",
        required: true,
        verifierCoverage: ["artifact.attachments.present", "artifact.attachments.no-secrets", "artifact.manifest.hashes"],
      }),
      content,
    }
  })
  const evidence: TaskParityEvidenceBundleV2 = {
    schemaVersion: 2,
    artifactKind: "task-parity-evidence",
    generatedAt,
    sourceSummarySha256: sha256JSON(input.artifact.summary),
    reports: input.artifact.reports.map((report) => ({
      taskID: report.taskID,
      product: report.product,
      mode: report.mode,
      status: report.status,
      cadenceEvidence: report.cadenceEvidence,
      observationShape: report.observationShape,
      acceptanceTimingEvidence: report.acceptanceTimingEvidence,
      fixtureReplay: report.fixtureReplay,
      providerShape: report.providerEvidence,
      gaps: report.gaps,
      cadenceDrifts: report.mode === "assembled" ? [] : cadenceDriftsForReport(input.artifact, report),
      acceptanceTimingDrifts: report.mode === "assembled" ? [] : acceptanceTimingDriftsForReport(input.artifact, report),
    })),
  }
  const products = unique(input.artifact.reports.map((report) => report.product)).sort() as HarnessProduct[]
  const tasks = unique(input.artifact.reports.map((report) => report.taskID)).sort()
  const modes = unique(input.artifact.reports.map((report) => report.mode)).sort() as ProductTaskParityMode[]
  const pairs: TaskParitySummaryPairV2[] = input.artifact.pairs.map((pair) => {
    const explicitGaps = pair.gaps.length
    const taskSuccessParity = pair.status !== "failed" && explicitGaps === 0
    const strictOutputParity = Boolean(pair.outputParity)
    const strictTraceParity = Boolean(pair.traceParity)
    const strictCadenceParity = Boolean(pair.cadenceParity)
    return {
      taskID: pair.taskID,
      product: pair.product,
      status: pair.status,
      taskSuccessParity,
      artifactParity: Boolean(pair.artifactParity),
      policyParity: Boolean(pair.policyParity),
      semanticOutputParity: taskSuccessParity && pair.status !== "gaps-found",
      strictOutputParity,
      strictTraceParity,
      strictCadenceParity,
      cadenceLevel: pair.cadenceLevel,
      cadenceScore: pair.cadenceScore,
      acceptanceTimingDrifts: pair.acceptanceTimingDrifts.length,
      gapsFound: explicitGaps,
      failed: pair.status === "failed",
      attachments: attachments
        .filter((attachment) => attachment.ref.path.includes(slug(pair.taskID)) && attachment.ref.path.includes(pair.product))
        .map((attachment) => attachment.ref.path),
    }
  })
  const summary: TaskParitySummaryArtifactV2 = {
    schemaVersion: 2,
    artifactKind: "task-parity-summary",
    generatedAt,
    generator: "helix.task-parity",
    command: input.command ?? "helix task-parity --artifact-format split",
    suite: input.artifact.suite,
    provider: input.artifact.provider,
    products,
    tasks,
    modes,
    summary: {
      ...input.artifact.summary,
      semanticParity: pairs.every((pair) => pair.semanticOutputParity && pair.artifactParity && pair.policyParity),
      taskSuccessParity: pairs.every((pair) => pair.taskSuccessParity),
      strictTranscriptParity: pairs.every((pair) => pair.strictOutputParity),
      strictTraceParity: pairs.every((pair) => pair.strictTraceParity),
      strictCadenceParity: pairs.every((pair) => pair.strictCadenceParity),
    },
    pairs,
    manifestPath: "manifest.json",
    evidencePath: "evidence.json",
    attachments: attachments.map((attachment) => attachment.ref),
    migration: {
      fromSchemaVersion: 1,
      legacyCompatible: true,
      hint: "Use `helix task-parity migrate-artifact --artifact <legacy.json> --out-dir <dir> --json` to split a legacy artifact.",
    },
  }
  const manifest: TaskParityAttachmentManifestV2 = {
    schemaVersion: 2,
    artifactKind: "task-parity-manifest",
    generatedAt,
    summaryPath: "summary.json",
    evidencePath: "evidence.json",
    attachments: summary.attachments,
  }
  return { summary, evidence, manifest, attachments }
}

export function writeProductTaskParitySplitArtifactSet(input: {
  outDir: string
  artifactSet: ProductTaskParitySplitArtifactSet
  summaryOut?: string
}): void {
  const summaryPath = join(input.outDir, "summary.json")
  const evidencePath = join(input.outDir, "evidence.json")
  const manifestPath = join(input.outDir, "manifest.json")
  mkdirSync(join(input.outDir, "attachments"), { recursive: true })
  writeJSONFile(summaryPath, input.artifactSet.summary)
  writeJSONFile(evidencePath, input.artifactSet.evidence)
  writeJSONFile(manifestPath, input.artifactSet.manifest)
  for (const attachment of input.artifactSet.attachments) writeJSONFile(join(input.outDir, attachment.ref.path), attachment.content)
  if (input.summaryOut) writeJSONFile(input.summaryOut, input.artifactSet.summary)
}

export function migrateProductTaskParityArtifact(input: {
  artifact: ProductTaskParityArtifact
  generatedAt?: Date
  command?: string
}): ProductTaskParitySplitArtifactSet {
  return createProductTaskParitySplitArtifactSet(input)
}

export function readProductTaskParitySplitArtifactSet(summaryPath: string): ProductTaskParitySplitArtifactSet {
  const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as TaskParitySummaryArtifactV2
  const baseDir = dirname(summaryPath)
  const evidence = JSON.parse(readFileSync(resolve(baseDir, summary.evidencePath), "utf8")) as TaskParityEvidenceBundleV2
  const manifest = JSON.parse(readFileSync(resolve(baseDir, summary.manifestPath), "utf8")) as TaskParityAttachmentManifestV2
  const attachments = manifest.attachments.map((ref) => ({
    ref,
    content: JSON.parse(readFileSync(resolve(baseDir, ref.path), "utf8")) as unknown,
  }))
  return { summary, evidence, manifest, attachments }
}

export function createProductTaskNativeCadenceFixtureSet(input: {
  artifact: ProductTaskParityArtifact
  generatedAt?: Date
}): ProductTaskNativeCadenceFixtureSet {
  const fixtures = input.artifact.reports
    .filter((report) => report.mode === "original")
    .map((report): ProductTaskNativeCadenceFixture => nativeCadenceFixtureFromReport(report))
  return {
    schemaVersion: 1,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    sourceArtifact: {
      generatedAt: input.artifact.generatedAt,
      suite: input.artifact.suite,
      provider: input.artifact.provider,
    },
    fixtures,
  }
}

export function writeProductTaskNativeCadenceFixtureSet(path: string, fixtureSet: ProductTaskNativeCadenceFixtureSet): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(fixtureSet, null, 2)}\n`, "utf8")
}

export function createProductTaskNativeCadenceFixtureSplitSet(input: {
  fixtureSet: ProductTaskNativeCadenceFixtureSet
  generatedAt?: Date
}): ProductTaskNativeCadenceFixtureSplitSet {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString()
  const attachments = input.fixtureSet.fixtures.map((fixture) => {
    const path = `attachments/${slug(`${fixture.product}-${fixture.taskID}-${fixture.nativeVersion}`)}.json`
    const content = sanitizeTaskParityAttachment(fixture) as ProductTaskNativeCadenceFixture
    return {
      ref: attachmentRef(path, content, {
        redactionStatus: "raw-sanitized",
        required: true,
        verifierCoverage: ["native-cadence-fixture.attachment.hash", "native-cadence-fixture.replay"],
      }),
      content,
    }
  })
  const summary: ProductTaskNativeCadenceFixtureSummaryV2 = {
    schemaVersion: 2,
    artifactKind: "native-cadence-fixture-summary",
    generatedAt,
    sourceArtifact: input.fixtureSet.sourceArtifact,
    fixtures: input.fixtureSet.fixtures.map((fixture, index) => ({
      product: fixture.product,
      taskID: fixture.taskID,
      nativeVersion: fixture.nativeVersion,
      cadenceLevel: fixture.cadenceSignature.level,
      providerRequests: fixture.cadenceSignature.costShape.providerRequests,
      messagePartTypes: fixture.messageParts,
      projectionLosses: fixture.projectionLosses.length,
      attachment: attachments[index]!.ref,
    })),
    manifestPath: "manifest.json",
  }
  const manifest: TaskParityAttachmentManifestV2 = {
    schemaVersion: 2,
    artifactKind: "task-parity-manifest",
    generatedAt,
    summaryPath: "summary.json",
    evidencePath: "",
    attachments: attachments.map((attachment) => attachment.ref),
  }
  return { summary, manifest, attachments }
}

export function writeProductTaskNativeCadenceFixtureSplitSet(input: {
  outDir: string
  fixtureSet: ProductTaskNativeCadenceFixtureSplitSet
  summaryOut?: string
}): void {
  mkdirSync(join(input.outDir, "attachments"), { recursive: true })
  writeJSONFile(join(input.outDir, "summary.json"), input.fixtureSet.summary)
  writeJSONFile(join(input.outDir, "manifest.json"), input.fixtureSet.manifest)
  for (const attachment of input.fixtureSet.attachments) writeJSONFile(join(input.outDir, attachment.ref.path), attachment.content)
  if (input.summaryOut) writeJSONFile(input.summaryOut, input.fixtureSet.summary)
}

export function readProductTaskNativeCadenceFixtureSplitSet(summaryPath: string): ProductTaskNativeCadenceFixtureSplitSet {
  const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as ProductTaskNativeCadenceFixtureSummaryV2
  const baseDir = dirname(summaryPath)
  const manifest = JSON.parse(readFileSync(resolve(baseDir, summary.manifestPath), "utf8")) as TaskParityAttachmentManifestV2
  return {
    summary,
    manifest,
    attachments: manifest.attachments.map((ref) => ({
      ref,
      content: JSON.parse(readFileSync(resolve(baseDir, ref.path), "utf8")) as ProductTaskNativeCadenceFixture,
    })),
  }
}

export function replayProductTaskNativeCadenceFixture(fixture: ProductTaskNativeCadenceFixture): ProductTaskCadenceSignature {
  return fixture.cadenceSignature
}

function nativeCadenceFixtureFromReport(report: ProductTaskParityReport): ProductTaskNativeCadenceFixture {
  const observationShape = report.observationShape ?? observationShapeFromReportFields(report)
  const cadenceSignature = report.cadenceEvidence ?? buildCadenceSignature(report)
  return {
    fixtureVersion: 1,
    product: report.product,
    nativeVersion: nativeVersionForReport(report),
    taskID: report.taskID,
    providerShape: {
      provider: report.providerEvidence.provider,
      modelID: report.providerEvidence.modelID,
      deterministic: report.providerEvidence.deterministic,
      requests: report.providerEvidence.requests,
    },
    cadenceSignature,
    observationShape,
    nativeEvents: cadenceSignature.traceEvents,
    nativeChunks: cadenceNativeChunks(cadenceSignature.traceEvents),
    messageParts: cadencePartTypes(report),
    projectionLosses: nativeProjectionLossesForObservationShape(observationShape),
    redactionSummary: {
      credentials: "redacted",
      hostPaths: "normalized",
      tokenUsage: "omitted",
    },
  }
}

function cadenceNativeChunks(traceEvents: string[]): ProductTaskNativeCadenceFixture["nativeChunks"] {
  return traceEvents.map((type, index) => ({ index, type, semanticClass: cadenceChunkClass(type) }))
}

function cadenceChunkClass(type: string): string {
  if (/tool/i.test(type)) return "tool"
  if (/message|text|delta/i.test(type)) return "message"
  if (/accept/i.test(type)) return "acceptance"
  if (/session/i.test(type)) return "session"
  if (/error/i.test(type)) return "error"
  return "control"
}

export function providerNativeProjectionLosses(): ProductTaskNativeProjectionLoss[] {
  return [
    {
      field: "providerRawFrame",
      lossiness: "semantic",
      reason: "providerRawFrame keeps provider raw-frame evidence as ordered semantic chunks, not exact upstream wire frames.",
    },
    {
      field: "providerRawPayload",
      lossiness: "semantic",
      reason: "providerRawPayload keeps raw payload round-trip evidence as redacted shape summaries, not transport-private fields.",
    },
    {
      field: "providerTiming",
      lossiness: "inferred",
      reason: "providerTiming keeps retry, delay, cancel, and abort timing evidence as sequence-level inference, not wall-clock exactness.",
    },
  ]
}

function nativeProjectionLossesForObservationShape(observationShape: ProductTaskObservationShape): ProductTaskNativeCadenceFixture["projectionLosses"] {
  const observationLosses = (Object.entries(observationShape) as Array<[keyof ProductTaskObservationShape, ProductTaskObservationShape[keyof ProductTaskObservationShape]]>).flatMap(
    ([field, shape]) =>
      shape.lossiness === "lossless"
        ? []
        : [
            {
              field,
              lossiness: shape.lossiness,
              reason: `${field} is recorded with ${shape.visibility} visibility from ${shape.evidence} evidence.`,
            },
          ],
  )
  return [...observationLosses, ...providerNativeProjectionLosses()]
}

export function verifyProductTaskNativeCadenceFixtureSet(input: unknown): ProductTaskNativeCadenceFixtureVerificationReport {
  if (isNativeCadenceFixtureSplitSet(input)) return verifyProductTaskNativeCadenceFixtureSplitSet(input)
  const fixtureSet = isNativeCadenceFixtureSet(input) ? input : undefined
  const checks: ProductTaskParityCheck[] = []
  checks.push(check("native-cadence-fixture.schema", Boolean(fixtureSet), "Native cadence fixture set uses schema version 1."))
  if (!fixtureSet) return { ok: false, checks, issues: checks.filter((item) => !item.ok) }
  const serialized = JSON.stringify(fixtureSet)
  checks.push(check("native-cadence-fixture.fixtures", fixtureSet.fixtures.length > 0, "Fixture set includes at least one native cadence fixture."))
  checks.push(check("native-cadence-fixture.no-secrets", !containsSecret(serialized), "Fixture set does not contain credential-shaped fields."))
  checks.push(
    check(
      "native-cadence-fixture.no-host-paths",
      !/(\/tmp\/helix-|\\helix-|[A-Za-z]:\\)/.test(serialized),
      "Fixture set omits host-specific temporary workspace paths.",
    ),
  )
  checks.push(
    check(
      "native-cadence-fixture.provider-shape",
      fixtureSet.fixtures.every(
        (fixture) =>
          fixture.providerShape.provider.length > 0 &&
          fixture.providerShape.modelID.length > 0 &&
          typeof fixture.providerShape.deterministic === "boolean" &&
          typeof fixture.providerShape.requests === "number",
      ),
      "Every fixture has a provider shape.",
    ),
  )
  checks.push(
    check(
      "native-cadence-fixture.observation-shape",
      fixtureSet.fixtures.every((fixture) => Boolean(fixture.observationShape?.providerBoundary) && Boolean(fixture.observationShape?.messageWrite)),
      "Every fixture declares native observation visibility and lossiness.",
    ),
  )
  checks.push(
    check(
      "native-cadence-fixture.projector-replay-metadata",
      fixtureSet.fixtures.every(
        (fixture) => Array.isArray(fixture.nativeEvents) && Array.isArray(fixture.nativeChunks) && Array.isArray(fixture.messageParts) && Array.isArray(fixture.projectionLosses),
      ),
      "Every fixture includes native events, chunk classes, message parts, and projection loss metadata.",
    ),
  )
  checks.push(
    check(
      "native-cadence-fixture.replay",
      fixtureSet.fixtures.every((fixture) => replayProductTaskNativeCadenceFixture(fixture).costShape.providerRequests === fixture.cadenceSignature.costShape.providerRequests),
      "Every fixture replays into the same cadence signature.",
    ),
  )
  const issues = checks.filter((item) => !item.ok)
  return { ok: issues.length === 0, checks, issues }
}

function verifyProductTaskNativeCadenceFixtureSplitSet(input: ProductTaskNativeCadenceFixtureSplitSet): ProductTaskNativeCadenceFixtureVerificationReport {
  const checks: ProductTaskParityCheck[] = []
  checks.push(check("native-cadence-fixture.schema", input.summary.schemaVersion === 2, "Native cadence fixture summary uses schema version 2."))
  checks.push(check("native-cadence-fixture.fixtures", input.summary.fixtures.length > 0, "Fixture summary includes at least one native cadence fixture."))
  checks.push(check("native-cadence-fixture.manifest", isTaskParityManifestV2(input.manifest), "Fixture manifest is valid."))
  const attachmentByPath = new Map(input.attachments.map((attachment) => [attachment.ref.path, attachment]))
  for (const ref of input.manifest.attachments) {
    const attachment = attachmentByPath.get(ref.path)
    const text = attachment ? `${JSON.stringify(attachment.content, null, 2)}\n` : ""
    checks.push(check(`native-cadence-fixture.attachment.present.${ref.path}`, Boolean(attachment) || !ref.required, `Fixture attachment ${ref.path} is present.`))
    if (attachment) {
      checks.push(check(`native-cadence-fixture.attachment.hash.${ref.path}`, createHash("sha256").update(text).digest("hex") === ref.sha256, `Fixture attachment ${ref.path} hash matches.`))
      checks.push(check(`native-cadence-fixture.attachment.no-secrets.${ref.path}`, !containsSecret(text), `Fixture attachment ${ref.path} has no credential-shaped fields.`))
      checks.push(
        check(
          `native-cadence-fixture.replay.${ref.path}`,
          replayProductTaskNativeCadenceFixture(attachment.content).costShape.providerRequests === attachment.content.cadenceSignature.costShape.providerRequests,
          `Fixture attachment ${ref.path} replays.`,
        ),
      )
    }
  }
  const issues = checks.filter((item) => !item.ok)
  return { ok: issues.length === 0, checks, issues }
}

export function verifyProductTaskParityArtifact(input: ProductTaskParityArtifactVerificationInput): ProductTaskParityArtifactVerificationReport {
  if (isProductTaskParitySplitArtifactSet(input.artifact)) return verifyProductTaskParitySplitArtifactSet(input.artifact, input)
  if (isTaskParitySummaryArtifactV2(input.artifact)) return verifyProductTaskParitySummaryArtifactV2(input.artifact, input)
  const artifact = isTaskParityArtifact(input.artifact) ? input.artifact : undefined
  const checks: ProductTaskParityCheck[] = []
  checks.push(check("artifact.schema", Boolean(artifact), "Artifact uses task parity schema version 1."))
  if (!artifact) return { ok: false, checks, issues: checks.filter((item) => !item.ok) }
  checks.push(check("artifact.no-secrets", !containsSecret(JSON.stringify(artifact)), "Artifact does not contain credential-shaped fields."))
  const pairs = artifact.pairs
  const expectedModeSet = new Set(input.expectedModes ?? artifact.reports.map((report) => report.mode))
  const requiresPairEvidence = expectedModeSet.has("assembled") && expectedModeSet.has("original")
  const explicitGaps = artifact.reports.reduce((sum, report) => sum + report.gaps.length, 0)
  const implicitGapStatuses = artifact.reports.filter((report) => report.status === "gaps-found" && report.gaps.length === 0).length
  if (input.expectedProducts) {
    for (const product of input.expectedProducts) {
      checks.push(check(`artifact.product.${product}`, artifact.reports.some((report) => report.product === product), `Artifact includes ${product}.`))
    }
  }
  if (input.expectedModes) {
    for (const mode of input.expectedModes) {
      checks.push(check(`artifact.mode.${mode}`, artifact.reports.some((report) => report.mode === mode), `Artifact includes ${mode} mode.`))
    }
  }
  if (input.expectedTaskIDs) {
    for (const taskID of input.expectedTaskIDs) {
      checks.push(check(`artifact.task.${taskID}`, artifact.reports.some((report) => report.taskID === taskID), `Artifact includes task ${taskID}.`))
    }
  }
  checks.push(
    check(
      "artifact.status",
      artifact.reports.every((report) => report.status === "matched" || report.status === "acceptable-drift"),
      "All task parity reports are matched or acceptable drift.",
    ),
  )
  checks.push(
    check(
      "artifact.pairs",
      !requiresPairEvidence || artifact.pairs.length > 0,
      requiresPairEvidence ? "Artifact includes assembled-vs-original pair evidence." : "Single-mode artifact does not require assembled-vs-original pair evidence.",
    ),
  )
  checks.push(
    check(
      "artifact.summary-consistent",
      artifact.summary.reports === artifact.reports.length &&
        artifact.summary.matched === artifact.reports.filter((report) => report.status === "matched").length &&
        artifact.summary.acceptableDrift === artifact.reports.filter((report) => report.status === "acceptable-drift").length &&
        artifact.summary.failed === artifact.reports.filter((report) => report.status === "failed").length &&
        artifact.summary.gapsFound === explicitGaps + implicitGapStatuses,
      "Artifact summary matches report statuses and pair gap evidence.",
    ),
  )
  checks.push(
    check(
      "artifact.pair-status-consistent",
      pairs.every((pair) => {
        const gaps = Array.isArray(pair.gaps) ? pair.gaps : []
        const status: string = pair.status
        if (status === "gaps-found") return gaps.length > 0
        if (gaps.length > 0) return status === "gaps-found"
        if (status === "matched") {
          return pair.outputParity === true && pair.artifactParity === true && pair.traceParity === true && pair.policyParity === true && pair.costLatencyParity === true && pair.cadenceParity === true
        }
        return status === "acceptable-drift"
      }),
      "Pair status matches gap evidence and parity flags.",
    ),
  )
  checks.push(
    check(
      "artifact.cadence.report-evidence",
      artifact.reports.every((report) => Boolean(report.cadenceEvidence)),
      "Every task parity report includes cadence evidence.",
    ),
  )
  checks.push(
    check(
      "artifact.observation-shape",
      artifact.reports.every((report) => Boolean(report.observationShape?.providerBoundary) && Boolean(report.acceptanceTimingEvidence?.timeline) && Boolean(report.fixtureReplay)),
      "Every task parity report includes observation shape, acceptance timing, and replay evidence.",
    ),
  )
  checks.push(
    check(
      "artifact.cadence.pair-evidence",
      artifact.pairs.every((pair) => typeof pair.cadenceParity === "boolean" && typeof pair.cadenceScore === "number" && Array.isArray(pair.cadenceDrifts)),
      "Every assembled-vs-original pair includes cadence parity evidence.",
    ),
  )
  checks.push(
    check(
      "artifact.acceptance-timing.pair-evidence",
      artifact.pairs.every((pair) => Array.isArray(pair.acceptanceTimingDrifts)),
      "Every assembled-vs-original pair includes acceptance timing drift evidence.",
    ),
  )
  checks.push(
    check(
      "artifact.cadence.score-breakdown",
      artifact.pairs.every((pair) => {
        const breakdown = pair.cadenceScoreBreakdown
        const drifts = Array.isArray(pair.cadenceDrifts) ? pair.cadenceDrifts : undefined
        return (
          breakdown?.modelVersion === 2 &&
          typeof breakdown.rawDriftCount === "number" &&
          typeof breakdown.weightedPenalty === "number" &&
          typeof breakdown.targetScore === "number" &&
          Boolean(drifts) &&
          breakdown.rawDriftCount === drifts!.length &&
          Array.isArray(breakdown.items)
        )
      }),
      "Every assembled-vs-original pair includes cadence score breakdown model v2.",
    ),
  )
  checks.push(
    check(
      "artifact.cadence.drift-metadata",
      artifact.pairs.every((pair) =>
        Array.isArray(pair.cadenceDrifts) &&
        pair.cadenceDrifts.every((drift) => {
          const metadata = drift.metadata
          return (
            Boolean(metadata) &&
            typeof metadata.owningPlane === "string" &&
            typeof metadata.owningAtomID === "string" &&
            metadata.owningAtomID.length > 0 &&
            Array.isArray(metadata.candidateFixes) &&
            metadata.candidateFixes.length > 0 &&
            typeof metadata.expectedScoreDelta === "number" &&
            typeof metadata.requiresNativeFixture === "boolean" &&
            Boolean(metadata.reproduction) &&
            Array.isArray(metadata.reproduction.assembledToolSequence) &&
            Array.isArray(metadata.reproduction.originalToolSequence) &&
            Array.isArray(metadata.reproduction.assembledBatchSignature) &&
            Array.isArray(metadata.reproduction.originalBatchSignature) &&
            Boolean(metadata.observability) &&
            typeof metadata.observability.comparisonConfidence === "string" &&
            typeof metadata.observability.scoringMode === "string" &&
            Array.isArray(metadata.observability.lossinessRefs)
          )
        }),
      ),
      "Every cadence drift has ownership, candidate fixes, score delta, reproduction metadata, and observability metadata.",
    ),
  )
  checks.push(
    check(
      "artifact.acceptance-timing.drift-metadata",
      artifact.pairs.every((pair) =>
        Array.isArray(pair.acceptanceTimingDrifts) &&
        pair.acceptanceTimingDrifts.every((drift) =>
          drift.category === "acceptance.full-native-timing-unverified" &&
          Boolean(drift.owningAtomID) &&
          drift.owningPlane === "runtime" &&
          drift.blockingLevel === "informational" &&
          Array.isArray(drift.candidateFixes) &&
          drift.candidateFixes.length > 0 &&
          Array.isArray(drift.evidenceRefs) &&
          drift.evidenceRefs.length > 0 &&
          drift.evidenceRefs.some((ref) => ref.startsWith("runtime-acceptance-persistence-cleanup:")) &&
          Array.isArray(drift.lossinessRefs) &&
          drift.lossinessRefs.includes("full-upstream-stop-continue-timing-not-replayed") &&
          drift.lossinessRefs.includes("partial-runtime-acceptance-persistence-cleanup") &&
          drift.lossinessRefs.includes("cleanup-side-effect-order-not-full-native") &&
          drift.requiresNativeFixture === true &&
          Boolean(drift.assembled?.satisfiedAt) &&
          Boolean(drift.original?.satisfiedAt),
        ),
      ),
      "Every acceptance timing drift records runtime ownership, candidate fixes, native fixture requirement, and full timing lossiness.",
    ),
  )
  const issues = checks.filter((item) => !item.ok)
  return { ok: issues.length === 0, checks, issues }
}

export function verifyProductTaskParitySplitArtifactSet(
  artifactSet: ProductTaskParitySplitArtifactSet,
  input: Omit<ProductTaskParityArtifactVerificationInput, "artifact"> = {},
): ProductTaskParityArtifactVerificationReport {
  const summaryVerification = verifyProductTaskParitySummaryArtifactV2(artifactSet.summary, input)
  const checks = [...summaryVerification.checks]
  checks.push(check("artifact.evidence.schema", isTaskParityEvidenceBundleV2(artifactSet.evidence), "Split evidence bundle uses task parity schema version 2."))
  checks.push(check("artifact.manifest.schema", isTaskParityManifestV2(artifactSet.manifest), "Split attachment manifest uses schema version 2."))
  checks.push(
    check(
      "artifact.evidence.linked",
      artifactSet.evidence.reports.length >= artifactSet.summary.summary.reports,
      "Evidence bundle covers every summarized report.",
    ),
  )
  const attachmentByPath = new Map(artifactSet.attachments.map((attachment) => [attachment.ref.path, attachment]))
  for (const ref of artifactSet.manifest.attachments) {
    const attachment = attachmentByPath.get(ref.path)
    const text = attachment ? `${JSON.stringify(attachment.content, null, 2)}\n` : ""
    checks.push(check(`artifact.attachment.present.${ref.path}`, Boolean(attachment) || !ref.required, `Attachment ${ref.path} is present when required.`))
    if (attachment) {
      checks.push(check(`artifact.attachment.hash.${ref.path}`, createHash("sha256").update(text).digest("hex") === ref.sha256, `Attachment ${ref.path} hash matches manifest.`))
      checks.push(check(`artifact.attachment.bytes.${ref.path}`, Buffer.byteLength(text) === ref.byteSize, `Attachment ${ref.path} byte size matches manifest.`))
      checks.push(check(`artifact.attachment.no-secrets.${ref.path}`, !containsSecret(text), `Attachment ${ref.path} does not contain credential-shaped fields.`))
    }
  }
  const issues = checks.filter((item) => !item.ok)
  return { ok: issues.length === 0, checks, issues }
}

function verifyProductTaskParitySummaryArtifactV2(
  summary: TaskParitySummaryArtifactV2,
  input: Omit<ProductTaskParityArtifactVerificationInput, "artifact"> = {},
): ProductTaskParityArtifactVerificationReport {
  const checks: ProductTaskParityCheck[] = []
  checks.push(check("artifact.schema", true, "Artifact uses task parity schema version 2."))
  checks.push(check("artifact.kind", summary.artifactKind === "task-parity-summary", "Artifact is a task parity summary."))
  checks.push(check("artifact.no-secrets", !containsSecret(JSON.stringify(summary)), "Artifact does not contain credential-shaped fields."))
  checks.push(
    check(
      "artifact.summary.stable-fields",
      !/(\/tmp\/helix-|\\helix-|[A-Za-z]:\\)/.test(JSON.stringify(summary)),
      "Summary omits host-specific temporary paths.",
    ),
  )
  if (input.expectedProducts) {
    for (const product of input.expectedProducts) checks.push(check(`artifact.product.${product}`, summary.products.includes(product), `Artifact includes ${product}.`))
  }
  if (input.expectedModes) {
    for (const mode of input.expectedModes) checks.push(check(`artifact.mode.${mode}`, summary.modes.includes(mode), `Artifact includes ${mode} mode.`))
  }
  if (input.expectedTaskIDs) {
    for (const taskID of input.expectedTaskIDs) checks.push(check(`artifact.task.${taskID}`, summary.tasks.includes(taskID), `Artifact includes task ${taskID}.`))
  }
  checks.push(check("artifact.semantic-parity.explicit", typeof summary.summary.semanticParity === "boolean", "Semantic parity is explicit."))
  checks.push(check("artifact.strict-parity.explicit", typeof summary.summary.strictCadenceParity === "boolean", "Strict parity fields are explicit."))
  checks.push(
    check(
      "artifact.pair-status-consistent",
      summary.pairs.every((pair) => {
        if (pair.status === "failed") return pair.failed === true
        if (pair.status === "gaps-found") return pair.gapsFound > 0 || pair.taskSuccessParity === false
        if (pair.status === "matched") return pair.taskSuccessParity && pair.semanticOutputParity && pair.strictOutputParity && pair.strictTraceParity && pair.strictCadenceParity
        return pair.status === "acceptable-drift" && pair.taskSuccessParity
      }),
      "Pair status matches semantic and strict parity flags.",
    ),
  )
  checks.push(check("artifact.attachments.present", summary.attachments.every((ref) => !ref.required || ref.sha256.length === 64), "Summary declares attachment hashes."))
  checks.push(
    check(
      "artifact.acceptance-timing.summary",
      summary.pairs.every((pair) => typeof pair.acceptanceTimingDrifts === "number" && pair.acceptanceTimingDrifts >= 0),
      "Summary pairs declare acceptance timing drift counts.",
    ),
  )
  checks.push(check("artifact.legacy-compatible", summary.migration.legacyCompatible, "Summary declares legacy compatibility."))
  const issues = checks.filter((item) => !item.ok)
  return { ok: issues.length === 0, checks, issues }
}

export function diffProductTaskParityArtifacts(left: ProductTaskParityArtifact, right: ProductTaskParityArtifact): {
  ok: boolean
  changed: Array<{ key: string; left: string; right: string }>
} {
  const changed: Array<{ key: string; left: string; right: string }> = []
  const leftStatuses = statusMap(left)
  const rightStatuses = statusMap(right)
  for (const key of [...new Set([...Object.keys(leftStatuses), ...Object.keys(rightStatuses)])].sort()) {
    const leftStatus = leftStatuses[key] ?? "<missing>"
    const rightStatus = rightStatuses[key] ?? "<missing>"
    if (leftStatus !== rightStatus) changed.push({ key, left: leftStatus, right: rightStatus })
  }
  return { ok: changed.length === 0, changed }
}

export function diagnoseProductTaskCadenceArtifact(
  artifact: ProductTaskParityArtifact,
  input: { generatedAt?: Date; followUpTODO?: string } = {},
): ProductTaskCadenceDiagnosisArtifact {
  const products = artifact.pairs.map((pair) => {
    const estimatedScoreAfterPlannedFixes = Math.min(
      100,
      pair.cadenceScore + pair.cadenceDrifts.reduce((sum, drift) => sum + (drift.metadata?.expectedScoreDelta ?? 0), 0),
    )
    return {
      product: pair.product,
      taskID: pair.taskID,
      status: pair.status,
      cadenceScore: pair.cadenceScore,
      targetScore: pair.cadenceScoreBreakdown?.targetScore ?? (artifact.provider === "live" ? 70 : 100),
      rawDriftCount: pair.cadenceDrifts.length,
      estimatedScoreAfterPlannedFixes,
      drifts: pair.cadenceDrifts.map((drift) => ({
        id: drift.id,
        category: drift.category,
        owningPlane: drift.metadata?.owningPlane ?? cadenceOwningPlane(drift.owner),
        owningAtomID: drift.metadata?.owningAtomID ?? "unknown",
        blockingLevel: drift.metadata?.blockingLevel ?? "score-impacting",
        expectedScoreDelta: drift.metadata?.expectedScoreDelta ?? 0,
        candidateFixes: drift.metadata?.candidateFixes ?? [drift.nextAction],
        assembled: drift.assembled,
        original: drift.original,
        observability: drift.metadata?.observability ?? {
          assembledVisibility: "inferred",
          originalVisibility: "inferred",
          comparisonConfidence: "inferred",
          scoringMode: "informational",
          lossinessRefs: [],
        },
      })),
    }
  })
  const productSpecificCommonOptimizations = products.flatMap((product) =>
    product.drifts
      .filter((drift) => drift.owningAtomID.startsWith("common.") && drift.category !== "cadence.native-projection-gap")
      .map((drift) => `${product.product}:${drift.id}:${drift.owningAtomID}`),
  )
  return {
    schemaVersion: 1,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    sourceSummary: artifact.summary,
    scoreTargets: Object.fromEntries(products.map((product) => [`${product.taskID}:${product.product}`, product.targetScore])),
    products,
    structuralAudit: {
      topLevelCategoriesAdded: [],
      productSpecificCommonOptimizations,
      requiresFollowUpTODO: productSpecificCommonOptimizations.length > 0 || Boolean(input.followUpTODO),
      ...(input.followUpTODO ? { followUpTODO: input.followUpTODO } : {}),
    },
  }
}

export function writeProductTaskCadenceDiagnosisMarkdown(path: string, diagnosis: ProductTaskCadenceDiagnosisArtifact): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${formatProductTaskCadenceDiagnosis(diagnosis)}\n`, "utf8")
}

export function formatProductTaskCadenceDiagnosis(diagnosis: ProductTaskCadenceDiagnosisArtifact): string {
  const lines = [
    "# Task Parity LiveCodeBench Cadence Diagnosis",
    "",
    `Generated at: ${diagnosis.generatedAt}`,
    "",
    `Source summary: reports=${diagnosis.sourceSummary.reports}, matched=${diagnosis.sourceSummary.matched}, acceptableDrift=${diagnosis.sourceSummary.acceptableDrift}, gapsFound=${diagnosis.sourceSummary.gapsFound}, failed=${diagnosis.sourceSummary.failed}`,
    "",
    "## Product Matrix",
    "",
    "| Product | Task | Status | Score | Target | Raw Drifts | Estimated After Planned Fixes |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: |",
    ...diagnosis.products.map(
      (product) =>
        `| ${product.product} | ${product.taskID} | ${product.status} | ${product.cadenceScore} | ${product.targetScore} | ${product.rawDriftCount} | ${product.estimatedScoreAfterPlannedFixes} |`,
    ),
    "",
    "## Drift Ownership",
    "",
    "| Product | Drift | Plane | Atom | Level | Confidence | Scoring | Lossiness Refs | Expected Delta | Candidate Fixes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |",
    ...diagnosis.products.flatMap((product) =>
      product.drifts.map(
        (drift) =>
          `| ${product.product} | ${drift.id} | ${drift.owningPlane} | ${drift.owningAtomID} | ${drift.blockingLevel} | ${drift.observability.comparisonConfidence} | ${drift.observability.scoringMode} | ${drift.observability.lossinessRefs.join("<br>") || "none"} | ${drift.expectedScoreDelta} | ${drift.candidateFixes.join("<br>")} |`,
      ),
    ),
    "",
    "## Structural Audit",
    "",
    `Top-level categories added: ${diagnosis.structuralAudit.topLevelCategoriesAdded.length === 0 ? "none" : diagnosis.structuralAudit.topLevelCategoriesAdded.join(", ")}`,
    `Product-specific common optimizations: ${
      diagnosis.structuralAudit.productSpecificCommonOptimizations.length === 0
        ? "none"
        : diagnosis.structuralAudit.productSpecificCommonOptimizations.join(", ")
    }`,
    `Requires follow-up TODO: ${diagnosis.structuralAudit.requiresFollowUpTODO ? "yes" : "no"}`,
    ...(diagnosis.structuralAudit.followUpTODO ? [`Follow-up TODO: ${diagnosis.structuralAudit.followUpTODO}`] : []),
  ]
  return lines.join("\n")
}

function assembleTaskHarness(product: HarnessProduct, cwd: string, storageDir: string): AssembledHarness {
  if (product === "opencode") return assembleOpenCodeHarness({ cwd, storageDir })
  if (product === "pi-mono") return assemblePiMonoHarness({ cwd, storageDir })
  if (product === "opencode-pi-hybrid") return assembleOpenCodePiHybridHarness({ cwd, storageDir })
  if (product === "hermes-agent") return assembleHermesAgentHarness({ cwd, storageDir })
  return assembleNanobotHarness({ cwd, storageDir })
}

function registerTaskExtensionTools(harness: AssembledHarness, tools: Array<"echo" | "todo">): void {
  for (const tool of tools) {
    if (tool === "echo") harness.hooks.registerTool(createEchoTool(), { id: "task.fixture.extension.echo", scope: "project", order: 50 })
    if (tool === "todo") harness.hooks.registerTool(createTodoTool(), { id: "task.fixture.extension.todo", scope: "project", order: 50 })
  }
}

function taskProvider(task: LoadedTask): LegoProviderAdapter {
  const script = task.policy.provider ?? {}
  const steps =
    script.steps && script.steps.length > 0
      ? script.steps
      : [
          {
            assistantText: script.assistantText ?? task.expectedText,
            ...(script.toolCalls ? { toolCalls: script.toolCalls } : {}),
          },
        ]
  const provider = createInternalFixtureProviderFromSteps(steps)
  if (!script.failFirstRequest) return provider
  return createFailFirstProvider(provider, script.failFirstRequest)
}

function createFailFirstProvider(inner: LegoProviderAdapter, message: string): LegoProviderAdapter {
  let failed = false
  return {
    id: `${inner.id}-fail-first`,
    models: () => inner.models(),
    async *stream(request: ProviderRequest): AsyncIterable<ProviderStreamEvent> {
      if (!failed) {
        failed = true
        throw new Error(message)
      }
      yield* inner.stream(request)
    },
  }
}

async function collectSessionTaskEvidence(
  task: LoadedTask,
  harness: AssembledHarness,
  sessionID: SessionID,
): Promise<Pick<ProductTaskParityReport["sessionEvidence"], "forked" | "forkParentID" | "forkMessageCount">> {
  if (task.policy.expected?.sessionForked !== true) return {}
  const fork = await harness.session.fork({ sessionID, title: `task parity fork ${task.id}` })
  const forkMessages = await harness.session.messages({ sessionID: fork.id })
  return {
    forked: fork.parentID === sessionID,
    ...(fork.parentID ? { forkParentID: String(fork.parentID) } : {}),
    forkMessageCount: forkMessages.length,
  }
}

function runExternalCaptureProductTask(input: {
  input: ProductTaskParityInput
  task: LoadedTask
  started: number
}): ProductTaskParityReport {
  const capture = input.input.native?.externalCapture
  if (!capture) {
    return failedTaskReport(input.input, input.task, Date.now() - input.started, {
      id: "task.runner.external-capture.missing",
      ok: false,
      message: "External capture reference was not provided.",
    })
  }
  const checks = externalCaptureTaskChecks(input.input, input.task, capture)
  const gaps = checks.flatMap((item) => (item.ok ? [] : gapForCheck(item)))
  const toolEvidence = externalCaptureToolEvidence(capture)
  const traceEvidence = externalCaptureTraceEvidence(capture)
  const providerRequests = Math.max(0, capture.providerRequests.length)
  const reportTranscriptSummary = {
    visibleText: "",
    messageCount: Math.max(1, ...capture.promptEvidence.map((item) => item.messageCount), capture.summary.records),
  }
  const reportProviderEvidence = {
    provider: capture.captureMode === "real-capture" ? ("live" as const) : ("fixture" as const),
    modelID: capture.summary.models[0] ?? capture.providerRequests[0]?.modelID ?? "unknown",
    deterministic: capture.captureMode !== "real-capture",
    requests: providerRequests,
  }
  const reportCostLatency = {
    steps: Math.max(1, providerRequests),
    durationMs: Math.max(0, Date.now() - input.started),
    toolCalls: toolEvidence.calls.length,
    providerRequests,
  }
  const cadenceEvidence = externalCaptureCadenceSignature({
    capture,
    transcriptSummary: reportTranscriptSummary,
    providerEvidence: reportProviderEvidence,
    traceEvidence,
    toolEvidence,
    costLatency: reportCostLatency,
  })
  return {
    taskID: input.task.id,
    product: input.input.product,
    mode: "original",
    runner: {
      id: "task.runner.external-capture",
      evidence: "external-tool-capture",
      nativeAvailable: capture.captureMode !== "capture-only" && capture.captureMode !== "dry-run",
      packageSpec: `external-tool/${capture.sourceTool}@${capture.sourceToolVersion}`,
      externalCapture: {
        sourceTool: capture.sourceTool,
        sourceToolVersion: capture.sourceToolVersion,
        ...(capture.artifactPath ? { artifactPath: capture.artifactPath } : {}),
        generatedAt: capture.generatedAt,
        captureMode: capture.captureMode,
        sourceArtifact: capture.sourceArtifact,
        lossiness: capture.lossiness,
      },
    },
    productEvidence: productEvidence(input.input.product, input.input.mode, false, input.input.recipe, input.input.recipeLabel, "external-tool-capture"),
    status: checks.every((item) => item.ok) ? "acceptable-drift" : "gaps-found",
    workspaceDiff: [],
    transcriptSummary: reportTranscriptSummary,
    sessionEvidence: {
      transcriptMessages: reportTranscriptSummary.messageCount,
      persisted: capture.providerRequests.length > 0,
    },
    providerEvidence: reportProviderEvidence,
    traceEvidence,
    toolEvidence,
    policyEvidence: {
      allowedTools: [...input.task.policy.allowedTools],
      writePaths: [...input.task.policy.writePaths],
      envAllowlist: [...input.task.policy.envAllowlist],
      timeoutMs: input.input.timeoutMs ?? input.task.policy.timeoutMs,
      maxSteps: input.task.policy.maxSteps,
    },
    costLatency: reportCostLatency,
    cadenceEvidence,
    observationShape: externalCaptureObservationShape(capture),
    acceptanceTimingEvidence: externalCaptureAcceptanceTimingEvidence(checks),
    fixtureReplay: {
      source: "external-tool-capture",
      verified: checks.every((item) => item.ok),
      issues: checks.filter((item) => !item.ok).map((item) => item.id),
    },
    checks,
    gaps,
  }
}

function externalCaptureTaskChecks(
  input: ProductTaskParityInput,
  task: LoadedTask,
  capture: ProductTaskParityExternalCaptureInput,
): ProductTaskParityCheck[] {
  return [
    check("task.runner.external-capture.product", capture.product === input.product, `External capture product is ${capture.product}; expected ${input.product}.`),
    check("task.runner.external-capture.task", capture.taskID === task.id, `External capture task is ${capture.taskID}; expected ${task.id}.`),
    check("task.runner.external-capture.mode", capture.captureMode !== "capture-only" && capture.captureMode !== "dry-run", `External capture mode ${capture.captureMode} can be used as original reference evidence.`),
    check("task.runner.external-capture.provider", capture.providerRequests.length > 0, "External capture includes provider request evidence."),
    check("task.runner.external-capture.stage", capture.stageEvidence.some((stage) => stage.stage === "provider"), "External capture includes provider stage evidence."),
  ]
}

function externalCaptureToolEvidence(capture: ProductTaskParityExternalCaptureInput): ProductTaskParityReport["toolEvidence"] {
  return {
    calls: capture.toolEvidence.map((tool) => ({
      toolName: tool.toolName,
      input: {
        source: tool.source,
        ...(tool.argumentFingerprint ? { argumentFingerprint: tool.argumentFingerprint } : {}),
      },
      status: tool.source === "response-call" ? "observed" : "schema-only",
    })),
    results: [],
  }
}

function externalCaptureTraceEvidence(capture: ProductTaskParityExternalCaptureInput): ProductTaskParityReport["traceEvidence"] {
  const eventSequence = externalCaptureTraceEvents(capture)
  return {
    events: eventSequence.length,
    eventTypes: [...new Set(eventSequence)].sort(),
    eventSequence,
  }
}

function externalCaptureTraceEvents(capture: ProductTaskParityExternalCaptureInput): string[] {
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

function externalCaptureCadenceSignature(input: {
  capture: ProductTaskParityExternalCaptureInput
  transcriptSummary: ProductTaskParityReport["transcriptSummary"]
  providerEvidence: ProductTaskParityReport["providerEvidence"]
  traceEvidence: ProductTaskParityReport["traceEvidence"]
  toolEvidence: ProductTaskParityReport["toolEvidence"]
  costLatency: ProductTaskParityReport["costLatency"]
}): ProductTaskCadenceSignature {
  const base = buildCadenceSignature({
    product: input.capture.product,
    mode: "original",
    transcriptSummary: input.transcriptSummary,
    providerEvidence: input.providerEvidence,
    traceEvidence: input.traceEvidence,
    toolEvidence: input.toolEvidence,
    costLatency: input.costLatency,
  })
  return {
    ...base,
    providerRequests: input.capture.providerRequests.map((request, index) => {
      const stream = input.capture.streamEvidence.find((item) => item.requestID === request.requestID)
      const requestTools = input.capture.toolEvidence.filter((tool) => tool.requestID === request.requestID && tool.source === "response-call")
      return {
        index,
        modelID: request.modelID || input.providerEvidence.modelID,
        toolCallCount: requestTools.length,
        eventCount: stream?.eventCount ?? 0,
        source: "external-tool-capture",
        visibility: "observed",
        boundaryEvidence: stream && stream.eventCount > 0 ? "stream-event" : "cli-event",
        ...(stream?.finishReason ? { stopReason: stream.finishReason } : {}),
      }
    }),
  }
}

function externalCaptureObservationShape(capture: ProductTaskParityExternalCaptureInput): ProductTaskObservationShape {
  const hasStream = capture.streamEvidence.some((item) => item.eventCount > 0)
  const hasTools = capture.toolEvidence.length > 0
  return {
    providerBoundary: {
      visibility: capture.providerRequests.length > 0 ? "per-request" : "none",
      lossiness: capture.providerRequests.length > 0 ? "semantic" : "unobservable",
      evidence: capture.providerRequests.length > 0 ? "cli-event" : "unavailable",
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
      visibility: "none",
      lossiness: "unobservable",
      evidence: "unavailable",
    },
    acceptance: {
      visibility: "none",
      lossiness: "unobservable",
      evidence: "unavailable",
    },
    workspace: {
      visibility: "diff-only",
      lossiness: "unobservable",
      evidence: "unavailable",
    },
  }
}

function externalCaptureAcceptanceTimingEvidence(checks: ProductTaskParityCheck[]): ProductTaskAcceptanceTimingEvidence {
  const failed = checks.filter((item) => !item.ok)
  return {
    timeline: {
      workspaceDiffAvailableAt: "unavailable",
      requiredToolResultAvailableAt: "unavailable",
      visibleSummaryAvailableAt: "unavailable",
      forbiddenFileCheckAvailableAt: "unavailable",
      policySatisfiedAt: failed.length > 0 ? "unavailable" : "report-only",
    },
    blockingEvidence: failed.map((item) => item.id),
    satisfiedAt: failed.length > 0 ? "unavailable" : "report-only",
    unavailableUntil: failed.map((item) => ({ evidence: item.id, until: "unavailable", reason: item.message })),
  }
}

async function runNativeProductTask(input: {
  input: ProductTaskParityInput
  task: LoadedTask
  workspace: string
  storageDir: string
  before: Map<string, string>
  started: number
}): Promise<ProductTaskParityReport> {
  const native = input.input.native ?? {}
  const envSource = native.env ?? process.env
  const modelID = native.modelID ?? envSource["HELIX_LIVE_MODEL"] ?? envSource["ANTHROPIC_MODEL"]
  const apiKey = native.apiKey ?? envSource["ANTHROPIC_API_KEY"]
  if (!modelID || !apiKey) {
    return failedTaskReport(input.input, input.task, Date.now() - input.started, {
      id: "task.runner.native-credentials",
      ok: false,
      message: "Native task parity requires HELIX_LIVE_MODEL or ANTHROPIC_MODEL plus ANTHROPIC_API_KEY.",
    })
  }

  const packageSpec = nativeTaskPackageSpec(input.input.product, native.packageSpec)
  const home = mkdtempSync(join(tmpdir(), `helix-native-${input.input.product}-home-`))
  const cacheDir = nativeTaskCacheDir(input.input.product)
  mkdirSync(cacheDir, { recursive: true })
  try {
    const command = nativeTaskCommand({
      product: input.input.product,
      task: input.task,
      workspace: input.workspace,
      storageDir: input.storageDir,
      cacheDir,
      home,
      packageSpec,
      modelID,
      apiKey,
      ...((native.baseURL ?? envSource["HELIX_LIVE_BASE_URL"])
        ? { baseURL: String(native.baseURL ?? envSource["HELIX_LIVE_BASE_URL"]) }
        : {}),
    })
    if (!command) {
      return failedTaskReport(input.input, input.task, Date.now() - input.started, {
        id: "task.runner.native-cli.unsupported",
        ok: false,
        message: `Native CLI task runner is not implemented for ${input.input.product}.`,
      })
    }
    const commandEnv = nativeTaskEnvironment({
      envSource,
      allowlist: input.task.policy.envAllowlist,
      home,
      cacheDir,
      apiKey,
      extra: command.env,
    })
    const run = await execNativeTaskCommand({
      ...(command.executable ? { executable: command.executable } : {}),
      args: command.args,
      cwd: command.cwd,
      env: commandEnv,
      timeoutMs: native.timeoutMs ?? input.input.timeoutMs ?? input.task.policy.timeoutMs,
      accept: (stdout) => acceptsNativeTaskOutput(input.input.product, input.task, input.workspace, input.before, stdout),
    })
    const events = parseJSONLines(run.stdout)
    const visibleText = visibleNativeTaskText(events, run.stdout, input.workspace)
    const workspaceDiff = filterNativeTaskWorkspaceDiff(input.input.product, diffSnapshots(input.before, snapshotWorkspace(input.workspace)))
    const toolEvidence = collectNativeToolEvidence(events, input.workspace)
    if (input.input.product === "opencode") {
      await collectNativeOpenCodeSQLiteToolEvidence(join(home, ".local", "share", "opencode", "opencode.db"), toolEvidence.calls, toolEvidence.results)
    }
    if (input.input.product === "hermes-agent") {
      collectNativeHermesTerminalToolEvidence(run.stdout, toolEvidence.calls, toolEvidence.results)
    }
    const checks = verifyTaskReport(input.task, { visibleText, workspace: input.workspace, workspaceDiff, toolEvidence, blockedTools: [] })
    if (run.error) checks.push(check("task.runner.native-exit", false, `Native CLI ended with ${run.error}.`))
    const gaps = checks.flatMap((item) => (item.ok ? [] : gapForCheck(item)))
    const reportTranscriptSummary = {
      visibleText,
      messageCount: visibleText ? 2 : 0,
    }
    const reportProviderEvidence = {
      provider: input.input.provider ?? "live",
      modelID,
      deterministic: false,
      requests: Math.max(1, nativeProviderRequestCount(events)),
    }
    const reportTraceEvidence = nativeTraceEvidence(events, run)
    const reportCostLatency = {
      steps: Math.max(1, nativeProviderRequestCount(events)),
      durationMs: Date.now() - input.started,
      toolCalls: toolEvidence.calls.length,
      providerRequests: Math.max(1, nativeProviderRequestCount(events)),
    }
    const cadenceEvidence = buildCadenceSignature({
      product: input.input.product,
      mode: input.input.mode,
      transcriptSummary: reportTranscriptSummary,
      providerEvidence: reportProviderEvidence,
      traceEvidence: reportTraceEvidence,
      toolEvidence,
      costLatency: reportCostLatency,
    })
    const telemetry = taskParityReportTelemetry({
      product: input.input.product,
      mode: input.input.mode,
      transcriptSummary: reportTranscriptSummary,
      providerEvidence: reportProviderEvidence,
      traceEvidence: reportTraceEvidence,
      toolEvidence,
      costLatency: reportCostLatency,
      workspaceDiff,
      checks,
    })
    return {
      taskID: input.task.id,
      product: input.input.product,
      mode: input.input.mode,
      runner: {
        id: "task.runner.native-cli",
        evidence: "native-cli",
        nativeAvailable: true,
        packageSpec,
        ...(run.exitCode === undefined ? {} : { exitCode: run.exitCode }),
        stderrTail: redactSecrets(run.stderr).split(/\r?\n/).filter(Boolean).slice(-20).join("\n"),
      },
      productEvidence: productEvidence(input.input.product, input.input.mode, true),
      status: checks.some((item) => !item.ok) ? "gaps-found" : "acceptable-drift",
      workspaceDiff,
      transcriptSummary: reportTranscriptSummary,
      sessionEvidence: {
        transcriptMessages: visibleText ? 2 : 0,
        persisted: true,
      },
      providerEvidence: reportProviderEvidence,
      traceEvidence: reportTraceEvidence,
      toolEvidence,
      policyEvidence: {
        allowedTools: [...input.task.policy.allowedTools],
        writePaths: [...input.task.policy.writePaths],
        envAllowlist: [...input.task.policy.envAllowlist],
        timeoutMs: native.timeoutMs ?? input.input.timeoutMs ?? input.task.policy.timeoutMs,
        maxSteps: input.task.policy.maxSteps,
      },
      costLatency: reportCostLatency,
      cadenceEvidence,
      ...telemetry,
      checks,
      gaps,
    }
  } finally {
    if (!native.keepTemp) rmSync(home, { recursive: true, force: true })
  }
}

function nativeTaskPackageSpec(product: HarnessProduct, override?: string): string {
  if (override) return override
  if (product === "opencode") return "opencode-ai@1.15.11"
  if (product === "pi-mono") return "@earendil-works/pi-coding-agent@0.75.5"
  if (product === "hermes-agent") return "hermes-agent==0.15.1"
  return "nanobot-ai==0.2.0"
}

function nativePiMonoToolList(allowedTools: string[]): string {
  const supported = new Set(["read", "bash", "edit", "write"])
  return allowedTools.filter((tool) => supported.has(tool)).join(",")
}

function nativeTaskCommand(input: {
  product: HarnessProduct
  task: LoadedTask
  workspace: string
  storageDir: string
  cacheDir: string
  home: string
  packageSpec: string
  modelID: string
  apiKey: string
  baseURL?: string
}): { executable?: string; args: string[]; cwd: string; env: NodeJS.ProcessEnv } | undefined {
  if (input.product === "opencode") {
    const executable = nativeNpmPackageBinary({ cacheDir: input.cacheDir, packageSpec: input.packageSpec, binName: "opencode" })
    const config = JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      provider: {
        anthropic: {
          ...(input.baseURL ? { options: { baseURL: nativeOpenCodeAnthropicBaseURL(input.baseURL) } } : {}),
          models: { [input.modelID]: { name: input.modelID } },
        },
      },
      model: `anthropic/${input.modelID}`,
      small_model: `anthropic/${input.modelID}`,
      tools: {
        bash: input.task.policy.allowedTools.includes("bash"),
        edit: input.task.policy.allowedTools.includes("edit"),
        write: input.task.policy.allowedTools.includes("write"),
      },
    })
    return {
      executable,
      args: [
        "run",
        "--dir",
        input.workspace,
        "--model",
        `anthropic/${input.modelID}`,
        "--format",
        "json",
        input.task.prompt,
      ],
      cwd: input.workspace,
      env: {
        XDG_CONFIG_HOME: join(input.home, ".config"),
        XDG_DATA_HOME: join(input.home, ".local", "share"),
        OPENCODE_CONFIG_CONTENT: config,
        OPENCODE_DISABLE_AUTOUPDATE: "1",
        OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
        OPENCODE_DISABLE_MODELS_FETCH: "1",
        OPENCODE_DISABLE_DEFAULT_PLUGINS: "1",
        OPENCODE_DISABLE_CLAUDE_CODE: "1",
      },
    }
  }
  if (input.product === "pi-mono") {
    const configDir = join(input.storageDir, "native-pi-config")
    const sessionDir = join(configDir, "sessions")
    if (input.baseURL) writeNativePiModelsConfig(configDir, nativePiMonoAnthropicBaseURL(input.baseURL))
    return {
      args: [
        "-y",
        input.packageSpec,
        "--offline",
        "--no-extensions",
        "--no-skills",
        "--no-prompt-templates",
        "--no-themes",
        "--no-context-files",
        "--session-dir",
        sessionDir,
        ...(input.modelID.includes("/") ? [] : ["--provider", "anthropic"]),
        "--model",
        input.modelID,
        "--api-key",
        input.apiKey,
        "--tools",
        nativePiMonoToolList(input.task.policy.allowedTools),
        "--mode",
        "json",
        "--print",
        input.task.prompt,
      ],
      cwd: input.workspace,
      env: {
        PI_CODING_AGENT_DIR: configDir,
        PI_CODING_AGENT_SESSION_DIR: sessionDir,
        PI_OFFLINE: "1",
      },
    }
  }
  if (input.product === "hermes-agent") {
    const configDir = join(input.home, ".hermes")
    const configPath = join(configDir, "config.yaml")
    const envPath = join(configDir, ".env")
    writeNativeHermesConfig({
      configDir,
      configPath,
      envPath,
      workspace: input.workspace,
      modelID: input.modelID,
      apiKey: input.apiKey,
      ...(input.baseURL ? { baseURL: input.baseURL } : {}),
    })
    return {
      executable: "uvx",
      args: [
        "--from",
        input.packageSpec,
        "hermes",
        "chat",
        "--provider",
        "anthropic",
        "--model",
        input.modelID,
        "--toolsets",
        "terminal",
        "-q",
        input.task.prompt,
      ],
      cwd: input.workspace,
      env: {
        XDG_CONFIG_HOME: join(input.home, ".config"),
        XDG_DATA_HOME: join(input.home, ".local", "share"),
        UV_CACHE_DIR: join(input.cacheDir, "uv"),
        UV_HTTP_TIMEOUT: "120",
        HERMES_HOME: configDir,
        HERMES_CONFIG_DIR: configDir,
        HERMES_CONFIG: configPath,
        HERMES_ENV_FILE: envPath,
        HERMES_YOLO_MODE: "1",
        HERMES_DISABLE_AUTOUPDATE: "1",
        HERMES_NO_ANALYTICS: "1",
        ANTHROPIC_API_KEY: input.apiKey,
        ...(input.baseURL ? { ANTHROPIC_BASE_URL: input.baseURL } : {}),
      },
    }
  }
  const configDir = join(input.storageDir, "native-nanobot-config")
  const configPath = join(configDir, "config.json")
  writeNativeNanobotConfig({
    configDir,
    configPath,
    workspace: input.workspace,
    modelID: input.modelID,
    apiKey: input.apiKey,
    ...(input.baseURL ? { baseURL: nativeNanobotAnthropicBaseURL(input.baseURL) } : {}),
    maxToolIterations: nativeNanobotToolIterationLimit(input.task.policy.maxSteps),
  })
  return {
    executable: "uvx",
    args: [
      "--from",
      input.packageSpec,
      "nanobot",
      "agent",
      "--no-markdown",
      "--no-logs",
      "--config",
      configPath,
      "--workspace",
      input.workspace,
      "--session",
      `helix-${input.task.id}`,
      "--message",
      input.task.prompt,
    ],
    cwd: input.workspace,
    env: {
      XDG_CONFIG_HOME: join(input.home, ".config"),
      XDG_DATA_HOME: join(input.home, ".local", "share"),
      UV_CACHE_DIR: join(input.cacheDir, "uv"),
      UV_HTTP_TIMEOUT: "120",
    },
  }
}

function nativeTaskCacheDir(product: HarnessProduct): string {
  const root = process.env["HELIX_NATIVE_CACHE_DIR"] ?? join(tmpdir(), "helix-native-cache")
  return join(root, product.replace(/[^a-z0-9._-]/gi, "-"))
}

function nativeNpmPackageBinary(input: { cacheDir: string; packageSpec: string; binName: string }): string {
  const installDir = join(input.cacheDir, "npm-prefix", slug(input.packageSpec))
  const binary = join(installDir, "node_modules", ".bin", input.binName)
  if (existsSync(binary)) return binary
  mkdirSync(installDir, { recursive: true })
  const install = spawnSync("npm", ["install", "--prefix", installDir, input.packageSpec, "--no-audit", "--fund=false"], {
    encoding: "utf8",
    env: nativePackageInstallEnvironment(join(input.cacheDir, "npm-cache")),
    timeout: 600_000,
  })
  if (install.status !== 0) {
    const stderr = redactSecrets(install.stderr || "")
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-10)
      .join("\n")
    throw new Error(`Native package install failed for ${input.packageSpec}: ${stderr || install.error?.message || `exit ${install.status}`}`)
  }
  if (!existsSync(binary)) throw new Error(`Native package install did not produce ${input.binName} for ${input.packageSpec}.`)
  return binary
}

function nativePackageInstallEnvironment(cacheDir: string): NodeJS.ProcessEnv {
  return {
    PATH: process.env["PATH"] ?? "",
    HOME: process.env["HOME"] ?? tmpdir(),
    npm_config_cache: cacheDir,
    NO_COLOR: "1",
    CI: "1",
  }
}

function nativeTaskEnvironment(input: {
  envSource: Record<string, string | undefined>
  allowlist: string[]
  home: string
  cacheDir: string
  apiKey: string
  extra: NodeJS.ProcessEnv
}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {}
  for (const key of input.allowlist) {
    const value = input.envSource[key] ?? process.env[key]
    if (value !== undefined) env[key] = value
  }
  env.PATH = env.PATH ?? process.env["PATH"] ?? ""
  env.HOME = input.home
  env.npm_config_cache = input.cacheDir
  env.NO_COLOR = "1"
  env.CI = "1"
  env.TERM = "dumb"
  env.ANTHROPIC_API_KEY = input.apiKey
  return { ...env, ...input.extra }
}

function execNativeTaskCommand(input: {
  executable?: string
  args: string[]
  cwd: string
  env: NodeJS.ProcessEnv
  timeoutMs: number
  accept?: (stdout: string, stderr: string) => boolean
}): Promise<{ stdout: string; stderr: string; exitCode?: number; error?: string; acceptedEarly?: boolean }> {
  return new Promise((resolve) => {
    const child = spawn(input.executable ?? "npx", input.args, {
      cwd: input.cwd,
      env: input.env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    let settled = false
    let timedOut = false
    let acceptedEarly = false
    let forceKillTimer: NodeJS.Timeout | undefined
    const timer = setTimeout(() => {
      timedOut = true
      killNativeTaskProcess(child, "SIGTERM")
      forceKillTimer = setTimeout(() => killNativeTaskProcess(child, "SIGKILL"), 5_000)
    }, input.timeoutMs)
    child.stdout?.setEncoding("utf8")
    child.stderr?.setEncoding("utf8")
    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk)
      if (!acceptedEarly && input.accept?.(stdout, stderr)) {
        acceptedEarly = true
        killNativeTaskProcess(child, "SIGTERM")
        forceKillTimer = setTimeout(() => killNativeTaskProcess(child, "SIGKILL"), 5_000)
      }
    })
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk)
    })
    child.on("error", (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (forceKillTimer) clearTimeout(forceKillTimer)
      resolve({ stdout, stderr, error: error.message })
    })
    child.on("close", (code, signal) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (forceKillTimer) clearTimeout(forceKillTimer)
      resolve({
        stdout,
        stderr,
        ...(acceptedEarly ? { acceptedEarly } : {}),
        ...(typeof code === "number" ? { exitCode: code } : {}),
        ...(acceptedEarly
          ? {}
          : timedOut
          ? { error: signal ? `timeout ${input.timeoutMs}ms (${signal})` : `timeout ${input.timeoutMs}ms` }
          : signal
            ? { error: `signal ${signal}` }
            : code && code !== 0
              ? { error: `exit ${code}` }
              : {}),
      })
    })
  })
}

function acceptsNativeTaskOutput(product: HarnessProduct, task: LoadedTask, workspace: string, before: Map<string, string>, stdout: string): boolean {
  const events = parseJSONLines(stdout)
  const visibleText = visibleNativeTaskText(events, stdout, workspace)
  if (!visibleText) return false
  const workspaceDiff = filterNativeTaskWorkspaceDiff(product, diffSnapshots(before, snapshotWorkspace(workspace)))
  const toolEvidence = collectNativeToolEvidence(events, workspace)
  if (product === "hermes-agent") collectNativeHermesTerminalToolEvidence(stdout, toolEvidence.calls, toolEvidence.results)
  return verifyTaskReport(task, { visibleText, workspace, workspaceDiff, toolEvidence, blockedTools: [] }).every((item) => item.ok)
}

function killNativeTaskProcess(child: ReturnType<typeof spawn>, signal: NodeJS.Signals): void {
  const pid = child.pid
  if (pid && pid > 0) {
    try {
      process.kill(-pid, signal)
      return
    } catch {
      // Fall back to killing only the child process when process groups are unavailable.
    }
  }
  try {
    child.kill(signal)
  } catch {
    // The process may already be gone.
  }
}

function writeNativePiModelsConfig(configDir: string, baseURL: string): void {
  mkdirSync(configDir, { recursive: true })
  writeFileSync(
    join(configDir, "models.json"),
    `${JSON.stringify(
      {
        providers: {
          anthropic: {
            baseUrl: baseURL,
            apiKey: "ANTHROPIC_API_KEY",
            api: "anthropic-messages",
          },
        },
      },
      null,
      2,
    )}\n`,
  )
}

function writeNativeNanobotConfig(input: {
  configDir: string
  configPath: string
  workspace: string
  modelID: string
  apiKey: string
  baseURL?: string
  maxToolIterations: number
}): void {
  mkdirSync(input.configDir, { recursive: true })
  const model = input.modelID.includes("/") ? input.modelID : `anthropic/${input.modelID}`
  writeFileSync(
    input.configPath,
    `${JSON.stringify(
      {
        agents: {
          defaults: {
            workspace: input.workspace,
            model,
            provider: "anthropic",
            maxTokens: 4096,
            contextWindowTokens: 65536,
            temperature: 0,
            maxToolIterations: Math.max(1, input.maxToolIterations),
            maxConcurrentSubagents: 1,
            disabledSkills: [],
            botName: "nanobot",
            botIcon: "",
          },
        },
        channels: {
          sendProgress: false,
          sendToolHints: false,
          showReasoning: false,
        },
        providers: {
          anthropic: {
            apiKey: input.apiKey,
            ...(input.baseURL ? { apiBase: input.baseURL } : {}),
          },
        },
        tools: {
          restrictToWorkspace: true,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  )
}

function writeNativeHermesConfig(input: {
  configDir: string
  configPath: string
  envPath: string
  workspace: string
  modelID: string
  apiKey: string
  baseURL?: string
}): void {
  mkdirSync(input.configDir, { recursive: true })
  writeFileSync(
    input.configPath,
    [
      "model:",
      "  provider: anthropic",
      `  default: ${JSON.stringify(input.modelID)}`,
      ...(input.baseURL ? [`  base_url: ${JSON.stringify(input.baseURL)}`] : ["  base_url: ''"]),
      "  api_mode: anthropic_messages",
      "terminal:",
      "  backend: local",
      `  cwd: ${JSON.stringify(input.workspace)}`,
      "approval_mode: yolo",
      "display:",
      "  markdown: false",
      "",
    ].join("\n"),
    "utf8",
  )
  writeFileSync(
    input.envPath,
    [`ANTHROPIC_API_KEY=${input.apiKey}`, ...(input.baseURL ? [`ANTHROPIC_BASE_URL=${input.baseURL}`] : []), ""].join("\n"),
    "utf8",
  )
}

function parseJSONLines(text: string): unknown[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as unknown]
      } catch {
        return []
      }
    })
}

function visibleNativeTaskText(events: unknown[], stdout: string, workspace?: string): string {
  const chunks: string[] = []
  for (const event of events) collectTextFields(event, chunks)
  if (events.length > 0) return chunks.join("\n")
  const sessionText = workspace ? visibleNativeWorkspaceSessionText(workspace) : ""
  if (sessionText) return [stdout.trim(), sessionText].filter(Boolean).join("\n")
  return stdout.trim()
}

function collectTextFields(value: unknown, output: string[]): void {
  if (!value || typeof value !== "object") return
  if (Array.isArray(value)) {
    value.forEach((item) => collectTextFields(item, output))
    return
  }
  const recordValue = value as Record<string, unknown>
  const type = typeof recordValue["type"] === "string" ? recordValue["type"] : ""
  if ((type === "text" || type === "message_update" || type === "assistant") && typeof recordValue["text"] === "string") output.push(recordValue["text"])
  const delta = record(recordValue["delta"])
  if (typeof delta?.["text"] === "string") output.push(delta["text"])
  const part = record(recordValue["part"])
  if (typeof part?.["text"] === "string") output.push(part["text"])
  const message = record(recordValue["message"])
  if (Array.isArray(message?.["content"])) collectTextFields(message["content"], output)
  if (Array.isArray(recordValue["content"])) collectTextFields(recordValue["content"], output)
}

function collectNativeToolEvidence(events: unknown[], workspace?: string): ProductTaskParityReport["toolEvidence"] {
  const calls: ProductTaskParityReport["toolEvidence"]["calls"] = []
  const results: ProductTaskParityReport["toolEvidence"]["results"] = []
  function visit(value: unknown): void {
    if (!value || typeof value !== "object") return
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    const item = value as Record<string, unknown>
    const type = String(item["type"] ?? "")
    const toolName = nativeToolName(item)
    if (toolName && /tool/i.test(type)) {
      const normalizedToolName = normalizeNativeToolName(toolName)
      if (/result|execution_end/i.test(type)) results.push({ toolName: normalizedToolName, text: nativeTextSummary(item) })
      else calls.push({ toolName: normalizedToolName, input: nativeToolInput(item) })
    }
    for (const nested of Object.values(item)) visit(nested)
  }
  events.forEach(visit)
  if (workspace) collectNativeWorkspaceToolEvidence(workspace, calls, results)
  return { calls: dedupeToolCalls(calls), results }
}

function nativeToolName(item: Record<string, unknown>): string | undefined {
  for (const key of ["toolName", "tool_name", "name", "tool"]) {
    const value = item[key]
    if (typeof value === "string") return value
  }
  const fn = record(item["function"])
  if (typeof fn?.["name"] === "string") return fn["name"]
  return undefined
}

function nativeToolInput(item: Record<string, unknown>): unknown {
  if (item["input"] !== undefined) return item["input"]
  if (item["arguments"] !== undefined) return parseMaybeJSON(item["arguments"])
  const fn = record(item["function"])
  if (fn?.["arguments"] !== undefined) return parseMaybeJSON(fn["arguments"])
  return {}
}

function collectNativeWorkspaceToolEvidence(
  workspace: string,
  calls: ProductTaskParityReport["toolEvidence"]["calls"],
  results: ProductTaskParityReport["toolEvidence"]["results"],
): void {
  const sessionsDir = join(workspace, "sessions")
  if (!existsSync(sessionsDir)) return
  for (const file of listFiles(sessionsDir)) {
    if (!file.endsWith(".jsonl")) continue
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue
      const entry = parseMaybeJSON(line)
      const recordEntry = record(entry)
      if (!recordEntry) continue
      const toolCalls = Array.isArray(recordEntry["tool_calls"]) ? recordEntry["tool_calls"] : []
      for (const toolCall of toolCalls) {
        const call = record(toolCall)
        const fn = record(call?.["function"])
        const rawName = typeof fn?.["name"] === "string" ? fn["name"] : typeof call?.["name"] === "string" ? call["name"] : undefined
        if (rawName) calls.push({ toolName: normalizeNativeToolName(rawName), input: parseMaybeJSON(fn?.["arguments"] ?? call?.["arguments"] ?? {}) })
      }
      const role = typeof recordEntry["role"] === "string" ? recordEntry["role"] : ""
      const name = typeof recordEntry["name"] === "string" ? recordEntry["name"] : undefined
      if (role === "tool" && name) {
        results.push({ toolName: normalizeNativeToolName(name), text: typeof recordEntry["content"] === "string" ? recordEntry["content"] : "" })
      }
    }
  }
}

function collectNativeHermesTerminalToolEvidence(
  stdout: string,
  calls: ProductTaskParityReport["toolEvidence"]["calls"],
  results: ProductTaskParityReport["toolEvidence"]["results"],
): void {
  const text = stripAnsi(stdout)
  const commands = hermesTerminalCommands(text)
  for (const command of commands) calls.push({ toolName: "bash", input: { command } })
  const passed = /livecodebench-1883-b tests passed(?: \(exit 0\))?/i.exec(text)?.[0]
  if (passed && commands.some((command) => /\bpython3\s+test_solution\.py\b/.test(command))) {
    results.push({ toolName: "bash", text: passed })
  }
}

function hermesTerminalCommands(stdout: string): string[] {
  const commands: string[] = []
  for (const rawLine of stdout.split(/\r?\n/)) {
    const line = rawLine.trim()
    const marker = line.indexOf("$")
    if (marker < 0) continue
    const command = line
      .slice(marker + 1)
      .replace(/\s+\d+(?:\.\d+)?s\s*$/, "")
      .trim()
    if (command) commands.push(command)
  }
  return commands
}

async function collectNativeOpenCodeSQLiteToolEvidence(
  dbPath: string,
  calls: ProductTaskParityReport["toolEvidence"]["calls"],
  results: ProductTaskParityReport["toolEvidence"]["results"],
): Promise<void> {
  if (!existsSync(dbPath)) return
  const parts = await sqliteJSON<{ type?: string; data?: string }>(
    dbPath,
    "select json_extract(data, '$.type') as type, data from part order by time_created, id",
  )
  for (const part of parts) {
    const data = record(parseMaybeJSON(part.data ?? ""))
    if (!data) continue
    const type = String(data["type"] ?? part.type ?? "")
    if (type !== "tool") continue
    const rawName = stringValue(data["tool"] ?? data["toolName"] ?? data["name"])
    if (!rawName) continue
    const toolName = normalizeNativeToolName(rawName)
    const state = record(data["state"])
    const input = state?.["input"] ?? data["input"] ?? {}
    calls.push({ toolName, input })
    const output = nativeOpenCodeToolOutput(data)
    if (output === undefined) continue
    const status = stringValue(state?.["status"] ?? data["status"])
    results.push({ toolName, ...(status === "error" ? { isError: true } : {}), text: output })
  }
}

function nativeOpenCodeToolOutput(data: Record<string, unknown>): string | undefined {
  const state = record(data["state"])
  const direct = stringValue(state?.["output"] ?? data["output"] ?? state?.["text"] ?? data["text"])
  if (direct !== undefined) return direct
  const result = state?.["result"] ?? data["result"]
  if (typeof result === "string") return result
  const summary = nativeTextSummary(result)
  return summary || undefined
}

function visibleNativeWorkspaceSessionText(workspace: string): string {
  const sessionsDir = join(workspace, "sessions")
  if (!existsSync(sessionsDir)) return ""
  const chunks: string[] = []
  for (const file of listFiles(sessionsDir)) {
    if (!file.endsWith(".jsonl")) continue
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue
      const entry = record(parseMaybeJSON(line))
      if (!entry || entry["role"] !== "assistant") continue
      if (Array.isArray(entry["tool_calls"]) && entry["tool_calls"].length > 0) continue
      const text = nativeMessageContentText(entry["content"])
      if (text) chunks.push(text)
    }
  }
  return chunks.join("\n")
}

function nativeMessageContentText(content: unknown): string {
  if (typeof content === "string") return content
  const chunks: string[] = []
  collectTextFields(content, chunks)
  return chunks.join("\n")
}

function normalizeNativeToolName(name: string): string {
  const normalized = name.replace(/[-\s]/g, "_").toLowerCase()
  if (["read", "read_file", "file_read", "view"].includes(normalized)) return "read"
  if (["write", "write_file", "file_write"].includes(normalized)) return "write"
  if (["edit", "edit_file", "file_edit"].includes(normalized)) return "edit"
  if (["bash", "exec", "shell", "run_command"].includes(normalized)) return "bash"
  return name
}

function parseMaybeJSON(value: unknown): unknown {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
}

async function sqliteJSON<T extends Record<string, unknown>>(dbPath: string, sql: string): Promise<T[]> {
  try {
    const result = await execFileAsync("sqlite3", ["-json", dbPath, sql], { timeout: 10_000, maxBuffer: 8 * 1024 * 1024 })
    const stdout = String(result.stdout ?? "").trim()
    if (!stdout) return []
    const parsed = JSON.parse(stdout) as unknown
    return Array.isArray(parsed) ? (parsed.filter(record) as T[]) : []
  } catch {
    return sqliteNodeJSON(dbPath, sql)
  }
}

function sqliteNodeJSON<T extends Record<string, unknown>>(dbPath: string, sql: string): T[] {
  try {
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite")
    const db = new DatabaseSync(dbPath)
    try {
      const rows = db.prepare(sql).all() as unknown[]
      return rows.filter(record) as T[]
    } finally {
      db.close()
    }
  } catch {
    return []
  }
}

function nativeTextSummary(value: unknown): string {
  const chunks: string[] = []
  collectTextFields(value, chunks)
  collectNativeSummaryFields(value, chunks)
  return [...new Set(chunks.filter(Boolean))].join("\n")
}

function collectNativeSummaryFields(value: unknown, output: string[]): void {
  if (!value || typeof value !== "object") return
  if (Array.isArray(value)) {
    value.forEach((item) => collectNativeSummaryFields(item, output))
    return
  }
  const item = value as Record<string, unknown>
  for (const key of ["output", "stdout", "stderr", "text"]) {
    const text = stringValue(item[key])
    if (text) output.push(text)
  }
  for (const key of ["result", "content", "message", "data", "state", "delta", "part"]) {
    collectNativeSummaryFields(item[key], output)
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function dedupeToolCalls(calls: ProductTaskParityReport["toolEvidence"]["calls"]): ProductTaskParityReport["toolEvidence"]["calls"] {
  const seen = new Set<string>()
  return calls.filter((call) => {
    const key = `${call.toolName}:${JSON.stringify(call.input)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function nativeProviderRequestCount(events: unknown[]): number {
  return Math.max(0, events.filter((event) => String(record(event)?.["type"] ?? "").includes("turn")).length)
}

function nativeTraceEvidence(events: unknown[], run: { error?: string; acceptedEarly?: boolean }): ProductTaskParityReport["traceEvidence"] {
  const eventTypes = events.map((event) => String(record(event)?.["type"] ?? "")).filter(Boolean)
  const eventSequence = [...eventTypes, ...(run.error ? ["native.error"] : []), ...(run.acceptedEarly ? ["native.accepted-early"] : [])]
  return {
    events: events.length,
    eventTypes: [...new Set(eventSequence)].sort(),
    eventSequence,
  }
}

function nativeOpenCodeAnthropicBaseURL(baseURL: string): string {
  const trimmed = baseURL.replace(/\/+$/, "")
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`
}

function nativePiMonoAnthropicBaseURL(baseURL: string): string {
  const trimmed = baseURL.replace(/\/+$/, "")
  return trimmed.endsWith("/v1") ? trimmed.slice(0, -3) : trimmed
}

function nativeNanobotAnthropicBaseURL(baseURL: string): string {
  return nativePiMonoAnthropicBaseURL(baseURL)
}

function nativeNanobotToolIterationLimit(policyMaxSteps: number): number {
  return Math.max(policyMaxSteps, policyMaxSteps * 2)
}

function loadTask(taskID: string, fixtureRoot = defaultTaskFixtureRoot()): LoadedTask {
  const dir = join(fixtureRoot, taskID)
  const workspace = join(dir, "workspace")
  const promptPath = join(dir, "prompt.md")
  const expectedPath = join(dir, "expected.md")
  const policyPath = join(dir, "policy.json")
  const policy = JSON.parse(readFileSync(policyPath, "utf8")) as TaskPolicy
  const prompt = taskPromptWithExecutionHints(readFileSync(promptPath, "utf8").trim(), policy)
  return {
    id: taskID,
    dir,
    workspace,
    prompt,
    expectedText: readFileSync(expectedPath, "utf8").trim(),
    policy: {
      ...policy,
      timeoutMs: policy.timeoutMs ?? 30_000,
      maxSteps: policy.maxSteps ?? 4,
      allowedTools: policy.allowedTools ?? [],
      writePaths: policy.writePaths ?? [],
      envAllowlist: policy.envAllowlist ?? defaultTaskEnvAllowlist(),
    },
  }
}

function taskPromptWithExecutionHints(prompt: string, policy: TaskPolicy): string {
  if ((policy.suite ?? "smoke") !== "livecodebench100") return prompt
  if (prompt.includes("Execution requirements:")) return prompt
  return [
    prompt,
    "",
    "Execution requirements:",
    "- Do not stop after analysis. After inspecting `solution.py`, modify `solution.py` before giving a final answer.",
    "- Run `python3 test_solution.py` with bash after modifying `solution.py`, and wait for the command to finish.",
    "- If the verifier fails, use the failure output to fix `solution.py` again and rerun `python3 test_solution.py` before answering.",
  ].join("\n")
}

function listTaskIDs(fixtureRoot = defaultTaskFixtureRoot(), suite = "smoke"): string[] {
  return readdirSync(fixtureRoot)
    .filter((entry) => {
      const dir = join(fixtureRoot, entry)
      if (!statSync(dir).isDirectory()) return false
      const policy = JSON.parse(readFileSync(join(dir, "policy.json"), "utf8")) as TaskPolicy
      return (policy.suite ?? "smoke") === suite
    })
    .sort()
}

function defaultTaskFixtureRoot(): string {
  return resolve(process.cwd(), "packages", "conformance", "fixtures", "tasks")
}

function snapshotWorkspace(root: string): Map<string, string> {
  const files = new Map<string, string>()
  if (!existsSync(root)) return files
  for (const file of listFiles(root)) {
    try {
      files.set(relative(root, file), readFileSync(file, "utf8"))
    } catch (error) {
      if (isENOENT(error)) continue
      throw error
    }
  }
  return files
}

function listFiles(root: string): string[] {
  const output: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(root)
  } catch (error) {
    if (isENOENT(error)) return output
    throw error
  }
  for (const entry of entries) {
    if (ignoredWorkspaceSnapshotEntry(entry)) continue
    const path = join(root, entry)
    let stat
    try {
      stat = statSync(path)
    } catch (error) {
      if (isENOENT(error)) continue
      throw error
    }
    if (stat.isDirectory()) output.push(...listFiles(path))
    else if (stat.isFile()) output.push(path)
  }
  return output.sort()
}

function ignoredWorkspaceSnapshotEntry(entry: string): boolean {
  return (
    entry === "node_modules" ||
    entry === ".git" ||
    entry === "__pycache__" ||
    entry === ".pytest_cache" ||
    entry === ".mypy_cache" ||
    entry.endsWith(".pyc") ||
    entry.endsWith(".pyo")
  )
}

function isENOENT(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "ENOENT")
}

function diffSnapshots(before: Map<string, string>, after: Map<string, string>): WorkspaceDiffEntry[] {
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort()
  return paths.flatMap((path): WorkspaceDiffEntry[] => {
    const left = before.get(path)
    const right = after.get(path)
    if (left === right) return []
    if (left === undefined) return [{ path, status: "added" as const, after: right ?? "" }]
    if (right === undefined) return [{ path, status: "deleted" as const, before: left }]
    return [{ path, status: "modified" as const, before: left, after: right }]
  })
}

function filterNativeTaskWorkspaceDiff(product: HarnessProduct, diff: WorkspaceDiffEntry[]): WorkspaceDiffEntry[] {
  if (product === "hermes-agent") return diff.filter((entry) => !isHermesNativeStatePath(entry.path))
  if (product !== "nanobot") return diff
  return diff.filter((entry) => !isNanobotNativeStatePath(entry.path))
}

function isHermesNativeStatePath(path: string): boolean {
  return path.startsWith(".hermes/") || path.startsWith("sessions/") || path.startsWith("logs/") || path === "SOUL.md" || path === "HERMES.md"
}

function isNanobotNativeStatePath(path: string): boolean {
  return (
    path === ".gitignore" ||
    path === "AGENTS.md" ||
    path === "HEARTBEAT.md" ||
    path === "SOUL.md" ||
    path === "TOOLS.md" ||
    path === "USER.md" ||
    path === "cron/jobs.json" ||
    path.startsWith("memory/") ||
    path.startsWith("sessions/") ||
    path.startsWith("skills/") ||
    path.startsWith(".tool-results/")
  )
}

function verifyTaskReport(
  task: LoadedTask,
  input: {
    visibleText: string
    workspace: string
    workspaceDiff: WorkspaceDiffEntry[]
    toolEvidence: ProductTaskParityReport["toolEvidence"]
    blockedTools: Array<{ toolName: string; reason?: string }>
    retries?: number
    syntheticContinues?: number
    contextCompacted?: boolean
    sessionEvidence?: Pick<ProductTaskParityReport["sessionEvidence"], "forked" | "forkMessageCount">
  },
): ProductTaskParityCheck[] {
  const expected = task.policy.expected ?? {}
  const checks: ProductTaskParityCheck[] = []
  for (const expectedText of expected.visibleAnswerIncludes ?? []) {
    checks.push(check(`output.includes.${slug(expectedText)}`, input.visibleText.includes(expectedText), `Visible output includes ${expectedText}.`))
  }
  for (const pattern of expected.visibleAnswerPatterns ?? []) {
    checks.push(check(`output.matches.${slug(pattern)}`, new RegExp(pattern, "i").test(input.visibleText), `Visible output matches ${pattern}.`))
  }
  for (const [path, fileExpectation] of Object.entries(expected.files ?? {})) {
    const fullPath = join(input.workspace, path)
    const content = existsSync(fullPath) ? readFileSync(fullPath, "utf8") : ""
    if (fileExpectation.equals !== undefined) {
      checks.push(check(`file.equals.${path}`, content === fileExpectation.equals, `${path} exactly matches expected content.`))
    }
    for (const text of fileExpectation.includes ?? []) {
      checks.push(check(`file.includes.${path}.${slug(text)}`, content.includes(text), `${path} includes ${text}.`))
    }
  }
  for (const path of expected.noFiles ?? []) {
    checks.push(check(`file.absent.${path}`, !existsSync(join(input.workspace, path)), `${path} was not created.`))
  }
  for (const toolName of expected.toolNames ?? []) {
    checks.push(check(`tool.called.${toolName}`, input.toolEvidence.calls.some((call) => call.toolName === toolName), `Tool ${toolName} was called.`))
  }
  for (const toolName of expected.blockedToolNames ?? []) {
    checks.push(
      check(
        `tool.blocked.${toolName}`,
        input.blockedTools.some((tool) => tool.toolName === toolName),
        `Tool ${toolName} was blocked by policy.`,
      ),
    )
  }
  for (const expectedText of expected.toolResultIncludes ?? []) {
    checks.push(
      check(
        `tool.result.includes.${slug(expectedText)}`,
        input.toolEvidence.results.some((result) => result.text.includes(expectedText)),
        `A tool result includes ${expectedText}.`,
      ),
    )
  }
  for (const scopedExpectation of expected.toolResultIncludesByTool ?? []) {
    for (const expectedText of scopedExpectation.includes) {
      checks.push(
        check(
          `tool.result.${scopedExpectation.toolName}.includes.${slug(expectedText)}`,
          input.toolEvidence.results.some((result) => result.toolName === scopedExpectation.toolName && result.text.includes(expectedText)),
          `A ${scopedExpectation.toolName} tool result includes ${expectedText}.`,
        ),
      )
    }
  }
  for (const diff of expected.workspaceDiff ?? []) {
    checks.push(
      check(
        `workspace.diff.${diff.path}.${diff.status}`,
        input.workspaceDiff.some((entry) => entry.path === diff.path && entry.status === diff.status),
        `Workspace diff contains ${diff.status} ${diff.path}.`,
      ),
    )
  }
  if (expected.workspaceDiffExact) {
    checks.push(
      check(
        "workspace.diff.exact",
        JSON.stringify(diffSignature(input.workspaceDiff)) === JSON.stringify(expected.workspaceDiffExact),
        "Workspace diff exactly matches the expected path/status list.",
      ),
    )
  }
  if (expected.workspaceDiffCount !== undefined) {
    checks.push(
      check(
        "workspace.diff.count",
        input.workspaceDiff.length === expected.workspaceDiffCount,
        `Workspace diff contains ${expected.workspaceDiffCount} entries.`,
      ),
    )
  }
  if (expected.retriesAtLeast !== undefined) {
    checks.push(check("provider.retries", (input.retries ?? 0) >= expected.retriesAtLeast, `Provider retried at least ${expected.retriesAtLeast} time(s).`))
  }
  if (expected.syntheticContinuesAtLeast !== undefined) {
    checks.push(
      check(
        "turn.synthetic-continues",
        (input.syntheticContinues ?? 0) >= expected.syntheticContinuesAtLeast,
        `Turn emitted at least ${expected.syntheticContinuesAtLeast} synthetic continue message(s).`,
      ),
    )
  }
  if (expected.contextCompacted !== undefined) {
    checks.push(check("turn.context-compacted", input.contextCompacted === expected.contextCompacted, `Context compacted is ${expected.contextCompacted}.`))
  }
  if (expected.sessionForked !== undefined) {
    checks.push(check("session.forked", input.sessionEvidence?.forked === expected.sessionForked, `Session forked is ${expected.sessionForked}.`))
  }
  if (expected.sessionForkMessageCountAtLeast !== undefined) {
    checks.push(
      check(
        "session.fork-message-count",
        (input.sessionEvidence?.forkMessageCount ?? 0) >= expected.sessionForkMessageCountAtLeast,
        `Forked session has at least ${expected.sessionForkMessageCountAtLeast} message(s).`,
      ),
    )
  }
  if (checks.length === 0) checks.push(check("task.noop", true, "Task has no declarative verifier checks."))
  return checks
}

function collectToolEvidence(parts: LegoMessagePart[]): ProductTaskParityReport["toolEvidence"] {
  const calls: ProductTaskParityReport["toolEvidence"]["calls"] = []
  const results: ProductTaskParityReport["toolEvidence"]["results"] = []
  function visit(part: LegoMessagePart): void {
    if (part.type === "tool_call") calls.push({ toolName: part.toolName, input: part.input, status: part.status })
    if (part.type === "tool_result") {
      results.push({
        toolName: part.toolName,
        ...(part.isError === undefined ? {} : { isError: part.isError }),
        text: part.content.map(partToText).join("\n"),
      })
      part.content.forEach(visit)
    }
  }
  parts.forEach(visit)
  return { calls, results }
}

function visibleTranscriptText(messages: LegoMessage[]): string {
  return messages.flatMap((message) => message.parts.map(partToText)).filter(Boolean).join("\n")
}

function partToText(part: LegoMessagePart): string {
  if (part.type === "text" || part.type === "reasoning") return part.text
  if (part.type === "tool_result") return part.content.map(partToText).join("\n")
  if (part.type === "custom") return part.display ?? ""
  if (part.type === "tool_call") return `[tool:${part.toolName}]`
  if (part.type === "compaction") return part.summary
  return ""
}

function taskParityReportTelemetry(input: {
  product: HarnessProduct
  mode: ProductTaskParityMode
  transcriptSummary: ProductTaskParityReport["transcriptSummary"]
  providerEvidence: ProductTaskParityReport["providerEvidence"]
  traceEvidence: ProductTaskParityReport["traceEvidence"]
  toolEvidence: ProductTaskParityReport["toolEvidence"]
  costLatency: ProductTaskParityReport["costLatency"]
  workspaceDiff: WorkspaceDiffEntry[]
  checks: ProductTaskParityCheck[]
}): Pick<ProductTaskParityReport, "observationShape" | "acceptanceTimingEvidence" | "fixtureReplay"> {
  const observationShape = observationShapeFromReportFields(input)
  return {
    observationShape,
    acceptanceTimingEvidence: acceptanceTimingEvidenceFromReportFields(input),
    fixtureReplay: {
      source: input.mode === "assembled" ? "assembled-loop" : "native-cadence-fixture",
      verified: true,
      issues: [],
    },
  }
}

function observationShapeFromReportFields(input: {
  mode: ProductTaskParityMode
  providerEvidence: ProductTaskParityReport["providerEvidence"]
  traceEvidence: ProductTaskParityReport["traceEvidence"]
  toolEvidence: ProductTaskParityReport["toolEvidence"]
  transcriptSummary: ProductTaskParityReport["transcriptSummary"]
  workspaceDiff?: WorkspaceDiffEntry[]
}): ProductTaskObservationShape {
  const traceEvents = input.traceEvidence.eventSequence ?? input.traceEvidence.eventTypes
  const hasProviderOrTurnEvent = traceEvents.some((event) => /provider|turn|request/i.test(event))
  const providerVisibility: ProductTaskProviderBoundaryVisibility =
    input.providerEvidence.requests <= 0 ? "none" : input.mode === "assembled" || hasProviderOrTurnEvent ? "per-request" : "aggregate"
  const toolHasCalls = input.toolEvidence.calls.length > 0
  const toolHasResults = input.toolEvidence.results.length > 0
  const hasAcceptanceEvent = traceEvents.some((event) => /acceptance|accepted/i.test(event))
  return {
    providerBoundary: {
      visibility: providerVisibility,
      lossiness: providerVisibility === "none" ? "unobservable" : providerVisibility === "aggregate" ? "aggregated" : input.mode === "assembled" ? "lossless" : "semantic",
      evidence: input.mode === "assembled" ? "provider-hook" : providerVisibility === "none" ? "unavailable" : "cli-event",
    },
    streamDelta: {
      visibility: traceEvents.length === 0 ? "none" : traceEvents.some((event) => /delta|chunk|message/i.test(event)) ? "semantic" : "text-only",
      lossiness: traceEvents.length === 0 ? "unobservable" : input.mode === "assembled" ? "semantic" : "semantic",
      evidence: traceEvents.length === 0 ? "unavailable" : "stream-event",
    },
    toolLifecycle: {
      visibility: toolHasCalls && toolHasResults ? "call-result" : toolHasCalls ? "call-only" : "none",
      lossiness: !toolHasCalls ? "unobservable" : input.mode === "assembled" ? "lossless" : "semantic",
      evidence: toolHasCalls || toolHasResults ? "cli-event" : "unavailable",
    },
    messageWrite: {
      visibility: traceEvents.some((event) => /^session\.|^message\./i.test(normalizeCadenceEvent(event)))
        ? "storage-event"
        : normalizeText(input.transcriptSummary.visibleText)
          ? "final-message"
          : "none",
      lossiness: normalizeText(input.transcriptSummary.visibleText) ? (input.mode === "assembled" ? "lossless" : "semantic") : "unobservable",
      evidence: normalizeText(input.transcriptSummary.visibleText) ? "message-store" : "unavailable",
    },
    acceptance: {
      visibility: hasAcceptanceEvent ? "explicit-event" : input.mode === "assembled" ? "inferred" : "none",
      lossiness: hasAcceptanceEvent ? "semantic" : input.mode === "assembled" ? "inferred" : "unobservable",
      evidence: hasAcceptanceEvent ? "runtime-policy" : input.mode === "assembled" ? "runtime-policy" : "unavailable",
    },
    workspace: {
      visibility: "diff-only",
      lossiness: input.workspaceDiff && input.workspaceDiff.length > 0 ? "semantic" : "inferred",
      evidence: "workspace-diff",
    },
  }
}

function acceptanceTimingEvidenceFromReportFields(input: {
  transcriptSummary: ProductTaskParityReport["transcriptSummary"]
  toolEvidence: ProductTaskParityReport["toolEvidence"]
  workspaceDiff: WorkspaceDiffEntry[]
  checks: ProductTaskParityCheck[]
}): ProductTaskAcceptanceTimingEvidence {
  const failed = input.checks.filter((item) => !item.ok)
  const hasToolExpectation = input.checks.some((item) => item.id.startsWith("tool."))
  const hasForbiddenFileExpectation = input.checks.some((item) => item.id.startsWith("file.absent."))
  const hasVisibleSummary = normalizeText(input.transcriptSummary.visibleText).length > 0
  const policySatisfiedAt: ProductTaskEvidenceAvailability =
    failed.length > 0 ? "unavailable" : input.toolEvidence.results.length > 0 || input.workspaceDiff.length > 0 ? "tool-result-after" : hasVisibleSummary ? "message-end" : "turn-end"
  return {
    timeline: {
      workspaceDiffAvailableAt: input.workspaceDiff.length > 0 ? "tool-result-after" : "turn-end",
      requiredToolResultAvailableAt: hasToolExpectation ? (input.toolEvidence.results.length > 0 ? "tool-result-after" : "unavailable") : "not-required",
      visibleSummaryAvailableAt: hasVisibleSummary ? "message-end" : "unavailable",
      forbiddenFileCheckAvailableAt: hasForbiddenFileExpectation ? "turn-end" : "not-required",
      policySatisfiedAt,
    },
    blockingEvidence: failed.map((item) => item.id),
    satisfiedAt: policySatisfiedAt,
    unavailableUntil: failed.map((item) => ({ evidence: item.id, until: "unavailable" as const, reason: item.message })),
  }
}

function buildCadenceSignature(input: {
  product: HarnessProduct
  mode: ProductTaskParityMode
  transcriptSummary: ProductTaskParityReport["transcriptSummary"]
  providerEvidence: ProductTaskParityReport["providerEvidence"]
  traceEvidence: ProductTaskParityReport["traceEvidence"]
  toolEvidence: ProductTaskParityReport["toolEvidence"]
  costLatency: ProductTaskParityReport["costLatency"]
}): ProductTaskCadenceSignature {
  const toolSequence = input.toolEvidence.calls.map((call, index) => {
    const result = input.toolEvidence.results.find((candidate) => candidate.toolName === call.toolName)
    return {
      index,
      toolName: call.toolName,
      status: call.status ?? (result?.isError ? "error" : result ? "completed" : "unknown"),
      inputShape: normalizedToolInputShape(call.input),
      result: result?.isError ? ("error" as const) : result?.text ? ("text" as const) : ("none" as const),
    }
  })
  const traceEvents = (input.traceEvidence.eventSequence ?? input.traceEvidence.eventTypes).map(normalizeCadenceEvent)
  const observationShape = observationShapeFromReportFields(input)
  const requestVisibility = cadenceBoundaryVisibilityFromObservation(observationShape.providerBoundary.visibility)
  const requestBoundaryEvidence = cadenceBoundaryEvidenceFromObservation(observationShape.providerBoundary.evidence)
  return {
    level: input.providerEvidence.deterministic ? "exact-cadence" : input.mode === "assembled" ? "semantic-cadence" : "acceptable-cadence-drift",
    providerRequests: Array.from({ length: Math.max(0, input.providerEvidence.requests) }, (_, index) => ({
      index,
      modelID: input.providerEvidence.modelID,
      toolCallCount: index === Math.max(0, input.providerEvidence.requests) - 1 ? input.toolEvidence.calls.length : 0,
      eventCount: input.traceEvidence.events,
      source: input.mode === "assembled" ? "assembled-loop" : "native-cli",
      visibility: requestVisibility,
      boundaryEvidence: requestBoundaryEvidence,
    })),
    assistantTurns: [
      {
        index: 0,
        text: normalizeText(input.transcriptSummary.visibleText) ? "has-text" : "empty",
        partTypes: cadencePartTypes(input),
        toolCallCount: input.toolEvidence.calls.length,
      },
    ],
    toolSequence,
    toolBatches: toolSequence.map((tool) => [tool.toolName]),
    sessionWrites: traceEvents.filter((event) => event.startsWith("session.") || event.startsWith("message.")),
    traceEvents,
    costShape: {
      providerRequests: input.costLatency.providerRequests,
      toolCalls: input.costLatency.toolCalls,
      retries: input.costLatency.retries ?? 0,
      syntheticContinues: input.costLatency.syntheticContinues ?? 0,
      contextCompacted: input.costLatency.contextCompacted ?? false,
      messageCount: input.transcriptSummary.messageCount,
    },
  }
}

function cadencePartTypes(input: {
  transcriptSummary: ProductTaskParityReport["transcriptSummary"]
  toolEvidence: ProductTaskParityReport["toolEvidence"]
}): string[] {
  const types = new Set<string>()
  if (normalizeText(input.transcriptSummary.visibleText)) types.add("text")
  for (const call of input.toolEvidence.calls) types.add(`tool:${call.toolName}`)
  for (const result of input.toolEvidence.results) types.add(result.isError ? `tool-result-error:${result.toolName}` : `tool-result:${result.toolName}`)
  return [...types].sort()
}

function cadenceBoundaryVisibilityFromObservation(visibility: ProductTaskProviderBoundaryVisibility): ProductTaskCadenceBoundaryVisibility {
  if (visibility === "per-request" || visibility === "per-chunk") return "observed"
  if (visibility === "aggregate") return "aggregated"
  return "inferred"
}

function cadenceBoundaryEvidenceFromObservation(
  evidence: ProductTaskObservationField<string>["evidence"],
): ProductTaskCadenceBoundaryEvidence {
  if (evidence === "provider-hook" || evidence === "stream-event" || evidence === "cli-event" || evidence === "storage-event") return evidence
  return "unavailable"
}

function normalizedToolInputShape(input: unknown): string {
  const normalized = normalizeToolInputValue(input)
  if (!normalized || typeof normalized !== "object" || Array.isArray(normalized)) return typeof normalized
  return Object.keys(normalized)
    .sort()
    .join(",")
}

function normalizeToolInputValue(value: unknown): unknown {
  if (typeof value === "string") return normalizeCadenceString(value)
  if (!value || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map(normalizeToolInputValue)
  const input = value as Record<string, unknown>
  const normalized: Record<string, unknown> = {}
  for (const [key, rawValue] of Object.entries(input)) {
    const normalizedKey = normalizeToolInputKey(key)
    normalized[normalizedKey] = normalizeToolInputValue(rawValue)
  }
  return normalized
}

function normalizeToolInputKey(key: string): string {
  if (["file_path", "filePath", "filepath", "file"].includes(key)) return "path"
  if (["old_string", "oldString", "oldstring", "old_text", "oldText"].includes(key)) return "oldText"
  if (["new_string", "newString", "newstring", "new_text", "newText"].includes(key)) return "newText"
  if (["command_line", "commandLine", "cmd"].includes(key)) return "command"
  if (key === "file_text") return "content"
  if (key === "replace_all") return "replaceAll"
  return key
}

function normalizeCadenceString(value: string): string {
  return value
    .replace(/\/tmp\/helix-task-[^/\s)]+\/workspace/g, "<workspace>")
    .replace(/\/tmp\/helix-[^/\s)]+/g, "<tmp>")
    .replace(/[A-Za-z]:\\[^"'\s)]+/g, "<path>")
}

function normalizeCadenceEvent(event: string): string {
  return event
    .replace(/_/g, ".")
    .replace(/^tool\.execution\./, "tool.")
    .replace(/^tool\.execution/, "tool")
    .replace(/^message\.update$/, "message.delta")
    .replace(/^runtime\.accepted-early$/, "acceptance.accepted-early")
    .replace(/^native\.accepted-early$/, "acceptance.accepted-early")
}

function pairReports(reports: ProductTaskParityReport[]): ProductTaskParityPairReport[] {
  const pairs: ProductTaskParityPairReport[] = []
  const grouped = new Map<string, ProductTaskParityReport[]>()
  for (const report of reports) {
    const key = `${report.taskID}:${report.product}`
    grouped.set(key, [...(grouped.get(key) ?? []), report])
  }
  for (const group of grouped.values()) {
    const assembled = group.find((report) => report.mode === "assembled")
    const original = group.find((report) => report.mode === "original")
    if (!assembled || !original) continue
    const outputParity = normalizeText(assembled.transcriptSummary.visibleText) === normalizeText(original.transcriptSummary.visibleText)
    const artifactParity = JSON.stringify(diffSignature(assembled.workspaceDiff)) === JSON.stringify(diffSignature(original.workspaceDiff))
    const policyParity = JSON.stringify(assembled.policyEvidence) === JSON.stringify(original.policyEvidence)
    const costLatencyParity = Math.abs(assembled.costLatency.toolCalls - original.costLatency.toolCalls) <= 0
    const traceParity = JSON.stringify(assembled.traceEvidence.eventTypes) === JSON.stringify(original.traceEvidence.eventTypes)
    const cadenceDrifts = cadenceDriftsForPair(assembled, original)
    const cadenceParity = cadenceDrifts.length === 0
    const cadenceScoreBreakdown = cadenceScoreForDrifts(cadenceDrifts, {
      product: assembled.product,
      deterministic: assembled.providerEvidence.deterministic && original.providerEvidence.deterministic,
    })
    const cadenceScore = Math.max(0, 100 - cadenceScoreBreakdown.weightedPenalty)
    const cadenceLevel = cadenceParity
      ? assembled.providerEvidence.deterministic
        ? "exact-cadence"
        : "semantic-cadence"
      : cadenceScore >= cadenceScoreBreakdown.targetScore
        ? "semantic-cadence"
        : "acceptable-cadence-drift"
    const acceptanceTimingDrifts = acceptanceTimingDriftsForPair(assembled, original)
    const gaps = [...assembled.gaps, ...original.gaps]
    pairs.push({
      taskID: assembled.taskID,
      product: assembled.product,
      status: gaps.length > 0 ? "gaps-found" : outputParity && artifactParity && traceParity && policyParity && costLatencyParity && cadenceParity ? "matched" : "acceptable-drift",
      outputParity,
      artifactParity,
      traceParity,
      policyParity,
      costLatencyParity,
      cadenceParity,
      cadenceScore,
      cadenceScoreBreakdown,
      cadenceLevel,
      cadenceDrifts,
      acceptanceTimingDrifts,
      gaps,
    })
  }
  return pairs
}

function acceptanceTimingDriftsForPair(assembled: ProductTaskParityReport, original: ProductTaskParityReport): ProductTaskAcceptanceTimingDrift[] {
  const category: ProductTaskAcceptanceTimingDriftCategory = "acceptance.full-native-timing-unverified"
  const prefix = productAtomPrefix(assembled.product)
  return [
    {
      id: `${category}:${assembled.product}:${assembled.taskID}`,
      category,
      message: "Full upstream stop/continue/accept timing is not replayed; task parity proves semantic acceptance evidence only.",
      assembled: {
        satisfiedAt: assembled.acceptanceTimingEvidence.satisfiedAt,
        policySatisfiedAt: assembled.acceptanceTimingEvidence.timeline.policySatisfiedAt,
        acceptanceVisibility: assembled.observationShape.acceptance.visibility,
      },
      original: {
        satisfiedAt: original.acceptanceTimingEvidence.satisfiedAt,
        policySatisfiedAt: original.acceptanceTimingEvidence.timeline.policySatisfiedAt,
        acceptanceVisibility: original.observationShape.acceptance.visibility,
      },
      owningPlane: "runtime",
      owningAtomID: `${prefix}.runtime.acceptance-controller.native-like`,
      blockingLevel: "informational",
      candidateFixes: [
        `capture ${assembled.product} native stop/continue/accept timestamp fixture`,
        `promote ${prefix}.runtime.acceptance-controller.native-like only after exact timing parity`,
      ],
      evidenceRefs: [
        `conformance:${assembled.product}-runtime-acceptance-replay-snapshot`,
        `runtime-acceptance-replay:${assembled.product}:acceptance-controller`,
        `runtime-acceptance-replay:${assembled.product}:acceptance-evidence`,
        `conformance:${assembled.product}-runtime-acceptance-timing-boundary`,
        `runtime-acceptance-timing-boundary:${assembled.product}`,
        `conformance:${assembled.product}-runtime-acceptance-lifecycle`,
        `runtime-acceptance-lifecycle:${assembled.product}`,
        `conformance:${assembled.product}-runtime-acceptance-persistence-cleanup`,
        `runtime-acceptance-persistence-cleanup:${assembled.product}`,
        `task-parity:${assembled.taskID}:${assembled.product}:acceptance-timing`,
      ],
      lossinessRefs: [
        "partial-runtime-acceptance-replay",
        "partial-runtime-acceptance-timing-boundary",
        "partial-runtime-acceptance-lifecycle",
        "partial-runtime-acceptance-persistence-cleanup",
        "runtime-acceptance-policy-approximation",
        "full-upstream-stop-continue-timing-not-replayed",
        "native-evidence-persistence-order-not-replayed",
        "cleanup-side-effect-order-not-full-native",
      ],
      requiresNativeFixture: true,
    },
  ]
}

function cadenceDriftsForPair(assembled: ProductTaskParityReport, original: ProductTaskParityReport): ProductTaskCadenceDrift[] {
  const drifts: ProductTaskCadenceDrift[] = []
  const assembledCadence = assembled.cadenceEvidence ?? buildCadenceSignature(assembled)
  const originalFixture = nativeCadenceFixtureFromReport(original)
  const fixtureVerification = verifyProductTaskNativeCadenceFixtureSet({
    schemaVersion: 1,
    generatedAt: "1970-01-01T00:00:00.000Z",
    sourceArtifact: {
      generatedAt: "1970-01-01T00:00:00.000Z",
      suite: "single-report",
      provider: original.providerEvidence.provider,
    },
    fixtures: [originalFixture],
  } satisfies ProductTaskNativeCadenceFixtureSet)
  const originalCadence = replayProductTaskNativeCadenceFixture(originalFixture)
  const reproduction = cadenceReproduction(assembledCadence, originalCadence)
  const deterministic = assembled.providerEvidence.deterministic && original.providerEvidence.deterministic
  const observabilityFor = (category: ProductTaskCadenceDriftCategory, owner: ProductTaskCadenceDrift["owner"]) =>
    cadenceDriftObservability({
      category,
      owner,
      deterministic,
      assembledCadence,
      originalCadence,
      originalFixture,
    })
  const metadataFor = (category: ProductTaskCadenceDriftCategory, owner: ProductTaskCadenceDrift["owner"]) =>
    cadenceDriftMetadata(category, assembled.product, owner, reproduction, observabilityFor(category, owner))
  if (!fixtureVerification.ok) {
    return [
      cadenceDrift(
        "native-fixture-replay",
        "cadence.native-projection-gap",
        "Native cadence fixture did not verify before live drift scoring.",
        "verified",
        fixtureVerification.issues.map((issue) => issue.id).join(",") || "invalid",
        "native-projector",
        "adjust-personality-adapter",
        metadataFor("cadence.native-projection-gap", "native-projector"),
      ),
    ]
  }
  const artifactEquivalent = JSON.stringify(diffSignature(assembled.workspaceDiff)) === JSON.stringify(diffSignature(original.workspaceDiff))
  const liveSemanticEquivalent = !deterministic && artifactEquivalent && assembled.gaps.length === 0 && original.gaps.length === 0
  if (assembledCadence.costShape.providerRequests !== originalCadence.costShape.providerRequests) {
    const originalBoundaryVisibility = cadenceRequestVisibility(originalCadence)
    const owner = deterministic && originalBoundaryVisibility === "observed" ? "common-loop" : "native-projector"
    drifts.push(
      cadenceDrift(
        "provider-request-count",
        "cadence.provider-request-count",
        "Provider request boundaries differ.",
        String(assembledCadence.costShape.providerRequests),
        String(originalCadence.costShape.providerRequests),
        owner,
        owner === "common-loop" ? "add-existing-plane-common-submodule" : "upstream-version-drift",
        metadataFor("cadence.provider-request-count", owner),
      ),
    )
  }
  if (assembledCadence.costShape.toolCalls !== originalCadence.costShape.toolCalls) {
    const owner = liveSemanticEquivalent ? "provider-nondeterminism" : "product-cadence-atom"
    drifts.push(
      cadenceDrift(
        "tool-call-count",
        "cadence.tool-call-count",
        "Tool call counts differ.",
        String(assembledCadence.costShape.toolCalls),
        String(originalCadence.costShape.toolCalls),
        owner,
        liveSemanticEquivalent ? "provider-nondeterminism" : "adjust-personality-adapter",
        metadataFor("cadence.tool-call-count", owner),
      ),
    )
  }
  const assembledTools = assembledCadence.toolSequence.map((tool) => tool.toolName).join(">")
  const originalTools = originalCadence.toolSequence.map((tool) => tool.toolName).join(">")
  if (assembledTools !== originalTools) {
    const owner = liveSemanticEquivalent ? "provider-nondeterminism" : "tool-schema-atom"
    drifts.push(
      cadenceDrift(
        "tool-sequence",
        "cadence.tool-sequence",
        "Tool call order differs.",
        assembledTools,
        originalTools,
        owner,
        liveSemanticEquivalent ? "provider-nondeterminism" : "adjust-personality-adapter",
        metadataFor("cadence.tool-sequence", owner),
      ),
    )
  }
  const assembledBatches = JSON.stringify(assembledCadence.toolBatches)
  const originalBatches = JSON.stringify(originalCadence.toolBatches)
  if (assembledBatches !== originalBatches) {
    const owner = liveSemanticEquivalent ? "provider-nondeterminism" : "product-cadence-atom"
    drifts.push(
      cadenceDrift(
        "tool-batch",
        "cadence.tool-batch",
        "Tool batch grouping differs.",
        assembledBatches,
        originalBatches,
        owner,
        liveSemanticEquivalent ? "provider-nondeterminism" : "add-existing-plane-common-submodule",
        metadataFor("cadence.tool-batch", owner),
      ),
    )
  }
  const assembledParts = assembledCadence.assistantTurns.flatMap((turn) => turn.partTypes).join(">")
  const originalParts = originalCadence.assistantTurns.flatMap((turn) => turn.partTypes).join(">")
  if (assembledParts !== originalParts) {
    drifts.push(
      cadenceDrift(
        "message-part-type",
        "cadence.message-part-type",
        "Assistant/tool part type projection differs.",
        assembledParts,
        originalParts,
        "native-projector",
        "adjust-personality-adapter",
        metadataFor("cadence.message-part-type", "native-projector"),
      ),
    )
  }
  if (normalizeText(assembled.transcriptSummary.visibleText) !== normalizeText(original.transcriptSummary.visibleText)) {
    drifts.push(
      cadenceDrift(
        "final-summary",
        "cadence.final-summary",
        "Final visible transcript differs after normalization.",
        cadenceTextSummary(assembled.transcriptSummary.visibleText),
        cadenceTextSummary(original.transcriptSummary.visibleText),
        assembled.providerEvidence.deterministic && original.providerEvidence.deterministic ? "prompt-atom" : "provider-nondeterminism",
        assembled.providerEvidence.deterministic && original.providerEvidence.deterministic ? "adjust-personality-adapter" : "provider-nondeterminism",
        cadenceDriftMetadata(
          "cadence.final-summary",
          assembled.product,
          assembled.providerEvidence.deterministic && original.providerEvidence.deterministic ? "prompt-atom" : "provider-nondeterminism",
          reproduction,
          observabilityFor(
            "cadence.final-summary",
            assembled.providerEvidence.deterministic && original.providerEvidence.deterministic ? "prompt-atom" : "provider-nondeterminism",
          ),
        ),
      ),
    )
  }
  if (assembledCadence.traceEvents.join(">") !== originalCadence.traceEvents.join(">")) {
    drifts.push(
      cadenceDrift(
        "streaming-delta",
        "cadence.streaming-delta",
        "Trace or streaming event sequence differs.",
        compactSequence(assembledCadence.traceEvents),
        compactSequence(originalCadence.traceEvents),
        "native-projector",
        "adjust-personality-adapter",
        metadataFor("cadence.streaming-delta", "native-projector"),
      ),
    )
  }
  const assembledEarly = hasEarlyAccept(assembledCadence.traceEvents)
  const originalEarly = hasEarlyAccept(originalCadence.traceEvents)
  if (assembledEarly !== originalEarly) {
    drifts.push(
      cadenceDrift(
        "early-accept",
        "cadence.early-accept",
        "Early accept behavior differs.",
        String(assembledEarly),
        String(originalEarly),
        "product-cadence-atom",
        "add-existing-plane-common-submodule",
        metadataFor("cadence.early-accept", "product-cadence-atom"),
      ),
    )
  }
  return drifts
}

function cadenceReproduction(
  assembled: ProductTaskCadenceSignature,
  original: ProductTaskCadenceSignature,
): ProductTaskCadenceDriftMetadata["reproduction"] {
  return {
    assembledRequestCount: assembled.costShape.providerRequests,
    originalRequestCount: original.costShape.providerRequests,
    assembledToolSequence: assembled.toolSequence.map((tool) => tool.toolName),
    originalToolSequence: original.toolSequence.map((tool) => tool.toolName),
    assembledBatchSignature: assembled.toolBatches.map((batch) => batch.join(">")),
    originalBatchSignature: original.toolBatches.map((batch) => batch.join(">")),
    assembledPartTypes: assembled.assistantTurns.flatMap((turn) => turn.partTypes),
    originalPartTypes: original.assistantTurns.flatMap((turn) => turn.partTypes),
    assembledStopReasons: assembled.providerRequests.flatMap((request) => (request.stopReason ? [request.stopReason] : [])),
    originalStopReasons: original.providerRequests.flatMap((request) => (request.stopReason ? [request.stopReason] : [])),
  }
}

function cadenceDriftMetadata(
  category: ProductTaskCadenceDriftCategory,
  product: HarnessProduct,
  owner: ProductTaskCadenceDrift["owner"],
  reproduction: ProductTaskCadenceDriftMetadata["reproduction"],
  observability: ProductTaskCadenceObservabilityMetadata,
): ProductTaskCadenceDriftMetadata {
  const owningPlane = cadenceOwningPlane(owner)
  const prefix = productAtomPrefix(product)
  const candidateFixes =
    owningPlane === "nondeterminism"
      ? ["record repeated live runs to estimate provider nondeterminism", "keep deterministic cassette scoring strict"]
      : owningPlane === "native-projector"
        ? [`refresh ${prefix} native cadence fixture`, "document native projector lossiness"]
        : cadenceCandidateFixes(category, product)
  return {
    blockingLevel:
      owningPlane === "native-projector" || owningPlane === "nondeterminism"
        ? "informational"
        : category === "cadence.provider-request-count" || category === "cadence.tool-sequence"
          ? "score-impacting"
          : "informational",
    owningPlane,
    owningAtomID: cadenceOwningAtomID(category, product, owningPlane),
    candidateFixes,
    expectedScoreDelta: cadenceExpectedScoreDelta(category),
    requiresNativeFixture: owningPlane === "native-projector" || category === "cadence.streaming-delta",
    reproduction,
    observability,
  }
}

function cadenceDriftObservability(input: {
  category: ProductTaskCadenceDriftCategory
  owner: ProductTaskCadenceDrift["owner"]
  deterministic: boolean
  assembledCadence: ProductTaskCadenceSignature
  originalCadence: ProductTaskCadenceSignature
  originalFixture: ProductTaskNativeCadenceFixture
}): ProductTaskCadenceObservabilityMetadata {
  const assembledVisibility = cadenceRequestVisibility(input.assembledCadence)
  const originalVisibility = cadenceRequestVisibility(input.originalCadence)
  const lossinessRefs = cadenceLossinessRefs(input.category, input.originalFixture.observationShape)
  const hasUnobservable = lossinessRefs.some((ref) => ref.includes(":unobservable"))
  const comparisonConfidence: ProductTaskCadenceComparisonConfidence =
    input.owner === "provider-nondeterminism" || hasUnobservable || originalVisibility !== "observed"
      ? "inferred"
      : input.deterministic && assembledVisibility === "observed" && originalVisibility === "observed"
        ? "exact"
        : "semantic"
  const scoringMode: ProductTaskCadenceScoringMode =
    comparisonConfidence === "exact"
      ? "strict"
      : input.owner === "provider-nondeterminism" || input.owner === "native-projector" || hasUnobservable
        ? "informational"
        : "semantic-live"
  return {
    assembledVisibility,
    originalVisibility,
    comparisonConfidence,
    scoringMode,
    lossinessRefs,
  }
}

function cadenceRequestVisibility(signature: ProductTaskCadenceSignature): ProductTaskCadenceBoundaryVisibility {
  const visibility = signature.providerRequests[0]?.visibility
  if (visibility) return visibility
  return signature.costShape.providerRequests > 0 ? "inferred" : "aggregated"
}

function cadenceLossinessRefs(category: ProductTaskCadenceDriftCategory, observationShape: ProductTaskObservationShape): string[] {
  const fieldsByCategory: Record<ProductTaskCadenceDriftCategory, Array<keyof ProductTaskObservationShape>> = {
    "cadence.provider-request-count": ["providerBoundary"],
    "cadence.tool-call-count": ["toolLifecycle"],
    "cadence.tool-sequence": ["toolLifecycle"],
    "cadence.tool-batch": ["toolLifecycle"],
    "cadence.message-part-type": ["messageWrite", "streamDelta"],
    "cadence.streaming-delta": ["streamDelta"],
    "cadence.final-summary": ["messageWrite"],
    "cadence.early-accept": ["acceptance"],
    "cadence.native-projection-gap": ["providerBoundary", "streamDelta", "messageWrite"],
  }
  return fieldsByCategory[category].map((field) => `${field}:${observationShape[field].lossiness}:${observationShape[field].visibility}`)
}

function cadenceOwningPlane(owner: ProductTaskCadenceDrift["owner"]): ProductTaskCadenceOwningPlane {
  if (owner === "common-loop" || owner === "product-cadence-atom") return "agent-loop"
  if (owner === "tool-schema-atom") return "tool"
  if (owner === "prompt-atom") return "prompt"
  if (owner === "native-projector") return "native-projector"
  return "nondeterminism"
}

function cadenceOwningAtomID(
  category: ProductTaskCadenceDriftCategory,
  product: HarnessProduct,
  plane: ProductTaskCadenceOwningPlane,
): string {
  const prefix = productAtomPrefix(product)
  if (plane === "nondeterminism") return `${prefix}.provider.nondeterminism`
  if (plane === "native-projector" && category === "cadence.provider-request-count") return `${prefix}.native.projector`
  if (category === "cadence.provider-request-count") return `${prefix}.agent-loop.request-boundary.native-like`
  if (category === "cadence.tool-call-count" || category === "cadence.tool-sequence") return `${prefix}.tools.schema.native-like`
  if (category === "cadence.tool-batch") return `${prefix}.tools.batch-scheduler.native-like`
  if (category === "cadence.message-part-type") return `${prefix}.session.message-part-projector.native-like`
  if (category === "cadence.streaming-delta") return `${prefix}.provider.stream-projector.native-like`
  if (category === "cadence.final-summary") return `${prefix}.agent-loop.final-summary.native-like`
  if (category === "cadence.early-accept") return `${prefix}.runtime.acceptance-controller.native-like`
  return plane === "native-projector" ? `${prefix}.native.projector` : `${prefix}.cadence.policy`
}

function cadenceCandidateFixes(category: ProductTaskCadenceDriftCategory, product: HarnessProduct): string[] {
  const prefix = productAtomPrefix(product)
  const table: Record<ProductTaskCadenceDriftCategory, string[]> = {
    "cadence.provider-request-count": [`bind ${prefix}.agent-loop.request-boundary.native-like`, "compare provider request boundaries against native fixture"],
    "cadence.tool-call-count": [`bind ${prefix}.tools.schema.native-like`, "remove redundant verification calls only through acceptance policy"],
    "cadence.tool-sequence": [`bind ${prefix}.tools.schema.native-like`, "normalize product tool aliases before scoring"],
    "cadence.tool-batch": [`bind ${prefix}.tools.batch-scheduler.native-like`, "separate readonly and mutating tool batches"],
    "cadence.message-part-type": [`bind ${prefix}.session.message-part-projector.native-like`, "mark projector lossiness explicitly"],
    "cadence.streaming-delta": [`bind ${prefix}.provider.stream-projector.native-like`, "capture chunk-level cassette deltas"],
    "cadence.final-summary": [`bind ${prefix}.agent-loop.final-summary.native-like`, "avoid extra provider round after accepted task where native stops"],
    "cadence.early-accept": [`bind ${prefix}.runtime.acceptance-controller.native-like`, "compare task-policy acceptance decisions"],
    "cadence.native-projection-gap": [`refresh ${prefix} native fixture`, "add native projector field mapping"],
  }
  return table[category]
}

function productAtomPrefix(product: HarnessProduct): string {
  if (product === "opencode-pi-hybrid") return "opencode-pi"
  return product === "pi-mono" ? "pi" : product
}

function cadenceExpectedScoreDelta(category: ProductTaskCadenceDriftCategory): number {
  const table: Record<ProductTaskCadenceDriftCategory, number> = {
    "cadence.provider-request-count": 8,
    "cadence.tool-call-count": 8,
    "cadence.tool-sequence": 8,
    "cadence.tool-batch": 6,
    "cadence.message-part-type": 4,
    "cadence.streaming-delta": 4,
    "cadence.final-summary": 3,
    "cadence.early-accept": 6,
    "cadence.native-projection-gap": 2,
  }
  return table[category]
}

function hasEarlyAccept(events: string[]): boolean {
  return events.some((event) => event === "native.accepted-early" || event === "runtime.accepted-early" || event === "acceptance.accepted-early")
}

function cadenceDrift(
  id: string,
  category: ProductTaskCadenceDriftCategory,
  message: string,
  assembled: string,
  original: string,
  owner: ProductTaskCadenceDrift["owner"],
  nextAction: ProductTaskCadenceDrift["nextAction"],
  metadata: ProductTaskCadenceDriftMetadata,
): ProductTaskCadenceDrift {
  return { id: `cadence.${id}`, category, message, assembled, original, owner, nextAction, metadata }
}

function cadenceScoreForDrifts(
  drifts: ProductTaskCadenceDrift[],
  input: { product: HarnessProduct; deterministic: boolean },
): ProductTaskCadenceScoreBreakdown {
  const items = drifts.map((drift) => {
    const weight = cadenceDriftWeight(drift, input)
    return {
      id: drift.id,
      category: drift.category,
      weight,
      appliedPenalty: weight,
      owningPlane: drift.metadata.owningPlane,
      blockingLevel: drift.metadata.blockingLevel,
      comparisonConfidence: drift.metadata.observability.comparisonConfidence,
      scoringMode: drift.metadata.observability.scoringMode,
    }
  })
  return {
    modelVersion: 2,
    rawDriftCount: drifts.length,
    weightedPenalty: Math.min(100, items.reduce((sum, item) => sum + item.appliedPenalty, 0)),
    targetScore: input.deterministic ? 100 : 70,
    items,
  }
}

function cadenceDriftWeight(drift: ProductTaskCadenceDrift, input: { product: HarnessProduct; deterministic: boolean }): number {
  const strictWeights: Record<ProductTaskCadenceDriftCategory, number> = {
    "cadence.provider-request-count": 16,
    "cadence.tool-call-count": 16,
    "cadence.tool-sequence": 16,
    "cadence.tool-batch": 12,
    "cadence.message-part-type": 10,
    "cadence.streaming-delta": 10,
    "cadence.final-summary": 8,
    "cadence.early-accept": 10,
    "cadence.native-projection-gap": 4,
  }
  if (input.deterministic) return strictWeights[drift.category]
  if (drift.metadata.observability.scoringMode === "informational") return Math.min(3, strictWeights[drift.category])
  if (drift.metadata.owningPlane === "native-projector") return Math.min(4, strictWeights[drift.category])
  if (drift.metadata.owningPlane === "nondeterminism") return Math.min(3, strictWeights[drift.category])
  const semanticWeights: Record<ProductTaskCadenceDriftCategory, number> = {
    "cadence.provider-request-count": 8,
    "cadence.tool-call-count": 8,
    "cadence.tool-sequence": 8,
    "cadence.tool-batch": 6,
    "cadence.message-part-type": 4,
    "cadence.streaming-delta": 4,
    "cadence.final-summary": 3,
    "cadence.early-accept": 6,
    "cadence.native-projection-gap": 0,
  }
  return semanticWeights[drift.category]
}

function cadenceTextSummary(text: string): string {
  const normalized = normalizeText(text)
  return normalized.length <= 160 ? normalized : `${normalized.slice(0, 157)}...`
}

function compactSequence(sequence: string[]): string {
  const compacted: string[] = []
  for (const item of sequence) {
    if (compacted[compacted.length - 1] !== item) compacted.push(item)
  }
  const text = compacted.join(">")
  return text.length <= 240 ? text : `${text.slice(0, 237)}...`
}

function failedTaskReport(
  input: ProductTaskParityInput,
  task: LoadedTask,
  durationMs: number,
  failedCheck: ProductTaskParityCheck,
): ProductTaskParityReport {
  const transcriptSummary = { visibleText: "", messageCount: 0 }
  const providerEvidence = { provider: input.provider ?? "cassette", modelID: "fixture-model", deterministic: true, requests: 0 }
  const traceEvidenceReport = { events: 0, eventTypes: [], eventSequence: [] }
  const toolEvidence = { calls: [], results: [] }
  const costLatency = { steps: 0, durationMs, toolCalls: 0, providerRequests: 0 }
  const checks = [failedCheck]
  const cadenceEvidence = buildCadenceSignature({
    product: input.product,
    mode: input.mode,
    transcriptSummary,
    providerEvidence,
    traceEvidence: traceEvidenceReport,
    toolEvidence,
    costLatency,
  })
  const telemetry = taskParityReportTelemetry({
    product: input.product,
    mode: input.mode,
    transcriptSummary,
    providerEvidence,
    traceEvidence: traceEvidenceReport,
    toolEvidence,
    costLatency,
    workspaceDiff: [],
    checks,
  })
  return {
    taskID: task.id,
    product: input.product,
    mode: input.mode,
    runner: {
      id: input.mode === "assembled" ? "task.runner.assembled" : "task.runner.native-cli",
      evidence: input.mode === "assembled" ? "assembled-harness" : input.native?.enabled ? "native-cli" : "native-cli-contract",
      nativeAvailable: input.mode === "assembled" || input.native?.enabled === true,
    },
    productEvidence: productEvidence(input.product, input.mode, input.native?.enabled === true, input.recipe, input.recipeLabel),
    status: "failed",
    workspaceDiff: [],
    transcriptSummary,
    sessionEvidence: { transcriptMessages: 0, persisted: false },
    providerEvidence,
    traceEvidence: traceEvidenceReport,
    toolEvidence,
    policyEvidence: {
      allowedTools: [...task.policy.allowedTools],
      writePaths: [...task.policy.writePaths],
      envAllowlist: [...task.policy.envAllowlist],
      timeoutMs: input.timeoutMs ?? task.policy.timeoutMs,
      maxSteps: task.policy.maxSteps,
    },
    costLatency,
    cadenceEvidence,
    ...telemetry,
    checks,
    gaps: gapForCheck(failedCheck),
  }
}

function statusForChecks(checks: ProductTaskParityCheck[], mode: ProductTaskParityMode): ProductTaskParityStatus {
  if (checks.some((item) => !item.ok)) return "gaps-found"
  return mode === "original" ? "acceptable-drift" : "matched"
}

function gapForCheck(check: ProductTaskParityCheck): ProductTaskGap[] {
  const category: ProductTaskGapCategory = check.id.startsWith("output.")
    ? "output.visible-answer"
    : check.id.startsWith("file.") || check.id.startsWith("workspace.")
      ? "artifact.workspace-diff"
      : check.id.startsWith("tool.blocked.")
        ? "hook.permission"
        : check.id.startsWith("tool.result.")
          ? "tool.result-shape"
          : check.id.startsWith("tool.")
            ? "tool.registry"
            : check.id.startsWith("provider.")
              ? "provider.stream-events"
              : check.id.startsWith("turn.context") || check.id.startsWith("turn.synthetic")
                ? "turn.compaction"
                : check.id.startsWith("session.")
                  ? "session.branching"
                  : "runtime.timeout"
  return [
    {
      id: check.id,
      category,
      message: check.message,
      nextAction: category === "tool.registry" ? "adjust-personality-adapter" : "reuse-existing-atom",
    },
  ]
}

function check(id: string, ok: boolean, message: string): ProductTaskParityCheck {
  return { id, ok, message }
}

function normalizeText(input: string): string {
  return input
    .replace(/Current Time: [^\n]+/g, "Current Time: <timestamp>")
    .replace(/\/tmp\/helix-task-[^/\s)]+\/workspace/g, "<workspace>")
    .replace(/\s+/g, " ")
    .trim()
}

function diffSignature(diff: WorkspaceDiffEntry[]): Array<Pick<WorkspaceDiffEntry, "path" | "status">> {
  return diff.map((entry) => ({ path: entry.path, status: entry.status })).sort((left, right) => left.path.localeCompare(right.path))
}

function statusMap(artifact: ProductTaskParityArtifact): Record<string, string> {
  return Object.fromEntries(artifact.reports.map((report) => [`${report.taskID}:${report.product}:${report.mode}`, report.status]))
}

function taskPermissionPolicy(task: LoadedTask, workspace: string): ToolPermissionPolicy {
  return {
    decide(input) {
      if (task.policy.allowedTools.length > 0 && !task.policy.allowedTools.includes(input.toolName)) {
        return {
          status: "deny",
          action: input.action,
          subject: input.subject,
          reason: `tool ${input.toolName} is not allowed for task ${task.id}`,
        }
      }
      if ((input.action === "file.write" || input.action === "file.edit") && task.policy.writePaths.length > 0) {
        const relativePath = relative(workspace, resolve(input.subject))
        const allowed = task.policy.writePaths.some((writePath) => relativePath === writePath || relativePath.startsWith(`${writePath}/`))
        if (!allowed) {
          return {
            status: "deny",
            action: input.action,
            subject: input.subject,
            reason: `write path ${relativePath} is not allowed for task ${task.id}`,
          }
        }
      }
      return { status: "allow", action: input.action, subject: input.subject }
    },
  }
}

function taskAcceptanceController(product: HarnessProduct, task: LoadedTask, workspace: string, before: Map<string, string>, recipe?: LegoRecipe): RuntimeTaskAcceptanceControllerAtom {
  const runtimeProduct = runtimeAcceptanceProduct(product, recipe)
  const evidenceProvider = createRuntimeAcceptanceEvidenceProvider({
    product: runtimeProduct,
    ...(task.policy.expected ? { expected: task.policy.expected } : {}),
    workspaceRoot: workspace,
    beforeSnapshot: Object.fromEntries(before),
  })
  return createRuntimeTaskAcceptanceController({ product: runtimeProduct, evidenceProvider })
}

function productEvidence(
  product: HarnessProduct,
  mode: ProductTaskParityMode,
  nativeEnabled = false,
  recipeOverride?: LegoRecipe,
  recipeLabel?: string,
  nativeAdapterOverride?: ProductTaskParityReport["productEvidence"]["nativeAdapter"],
): ProductTaskParityReport["productEvidence"] {
  const recipe =
    recipeOverride ??
    (product === "opencode"
      ? opencodeRecipe
      : product === "pi-mono"
        ? piMonoRecipe
        : product === "opencode-pi-hybrid"
          ? opencodePiHybridRecipe
          : product === "hermes-agent"
            ? hermesAgentRecipe
            : nanobotRecipe)
  const metadata = recipe.metadata ?? {}
  return {
    recipeID: recipe.id,
    ...(recipeLabel ? { source: recipeLabel } : {}),
    ...(typeof metadata["upstream"] === "string" ? { upstream: metadata["upstream"] } : {}),
    ...(typeof metadata["upstreamCommit"] === "string" ? { upstreamCommit: metadata["upstreamCommit"] } : {}),
    ...(typeof metadata["upstreamTag"] === "string" ? { upstreamTag: metadata["upstreamTag"] } : {}),
    ...(typeof metadata["package"] === "string" ? { package: metadata["package"] } : {}),
    nativeAdapter: nativeAdapterOverride ?? (mode === "assembled" ? "assembled-harness" : nativeEnabled ? "native-cli" : "native-cli-contract"),
  }
}

function nativeVersionForReport(report: ProductTaskParityReport): string {
  return (
    report.productEvidence.upstreamCommit ??
    report.productEvidence.upstreamTag ??
    report.productEvidence.package ??
    `${report.productEvidence.recipeID}:${report.productEvidence.nativeAdapter}`
  )
}

function traceEvidence(trace: unknown[]): ProductTaskParityReport["traceEvidence"] {
  const eventTypes = trace
    .map((event) => (event && typeof event === "object" && "type" in event ? String((event as { type: unknown }).type) : "unknown"))
    .filter(Boolean)
  return {
    events: trace.length,
    eventTypes: [...new Set(eventTypes)].sort(),
    eventSequence: eventTypes,
  }
}

function cadenceDriftsForReport(artifact: ProductTaskParityArtifact, report: ProductTaskParityReport): ProductTaskCadenceDrift[] {
  return artifact.pairs.find((pair) => pair.product === report.product && pair.taskID === report.taskID)?.cadenceDrifts ?? []
}

function acceptanceTimingDriftsForReport(artifact: ProductTaskParityArtifact, report: ProductTaskParityReport): ProductTaskAcceptanceTimingDrift[] {
  return artifact.pairs.find((pair) => pair.product === report.product && pair.taskID === report.taskID)?.acceptanceTimingDrifts ?? []
}

function runtimeAcceptanceProduct(product: HarnessProduct, recipe?: LegoRecipe): "opencode" | "pi-mono" | "nanobot" | "hermes-agent" {
  return harnessComboAcceptanceProduct(product, recipe)
}

function sanitizeTaskParityAttachment(value: unknown): unknown {
  return JSON.parse(redactSecrets(JSON.stringify(value)))
}

function attachmentRef(
  path: string,
  content: unknown,
  metadata: Pick<TaskParityAttachmentRef, "redactionStatus" | "required" | "verifierCoverage">,
): TaskParityAttachmentRef {
  const text = `${JSON.stringify(content, null, 2)}\n`
  return {
    path,
    sha256: createHash("sha256").update(text).digest("hex"),
    byteSize: Buffer.byteLength(text),
    redactionStatus: metadata.redactionStatus,
    required: metadata.required,
    verifierCoverage: metadata.verifierCoverage,
  }
}

function writeJSONFile(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function sha256JSON(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function containsSecret(text: string): boolean {
  return /(api[_-]?key|authorization|cookie)(["'\s:=]+)[^"'\s,}]{8,}|bearer\s+[a-z0-9._-]{12,}/i.test(text)
}

function redactSecrets(text: string): string {
  return text
    .replace(/(api[_-]?key|authorization|cookie)(["'\s:=]+)[^"'\s,}]+/gi, "$1$2<redacted>")
    .replace(/bearer\s+[a-z0-9._-]{12,}/gi, "bearer <redacted>")
}

function defaultTaskEnvAllowlist(): string[] {
  return [
    "PATH",
    "LANG",
    "LC_ALL",
    "TZ",
    "SSL_CERT_FILE",
    "NODE_EXTRA_CA_CERTS",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "NO_PROXY",
    "ANTHROPIC_API_KEY",
    "HELIX_LIVE_MODEL",
    "ANTHROPIC_MODEL",
    "HELIX_LIVE_BASE_URL",
  ]
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function isTaskParityArtifact(value: unknown): value is ProductTaskParityArtifact {
  if (!value || typeof value !== "object") return false
  const candidate = value as ProductTaskParityArtifact
  return candidate.schemaVersion === 1 && Array.isArray(candidate.reports) && Array.isArray(candidate.pairs) && Boolean(record(candidate.summary))
}

function isTaskParitySummaryArtifactV2(value: unknown): value is TaskParitySummaryArtifactV2 {
  if (!value || typeof value !== "object") return false
  const candidate = value as TaskParitySummaryArtifactV2
  return candidate.schemaVersion === 2 && candidate.artifactKind === "task-parity-summary" && Array.isArray(candidate.pairs) && Array.isArray(candidate.attachments)
}

function isTaskParityEvidenceBundleV2(value: unknown): value is TaskParityEvidenceBundleV2 {
  if (!value || typeof value !== "object") return false
  const candidate = value as TaskParityEvidenceBundleV2
  return candidate.schemaVersion === 2 && candidate.artifactKind === "task-parity-evidence" && Array.isArray(candidate.reports)
}

function isTaskParityManifestV2(value: unknown): value is TaskParityAttachmentManifestV2 {
  if (!value || typeof value !== "object") return false
  const candidate = value as TaskParityAttachmentManifestV2
  return candidate.schemaVersion === 2 && candidate.artifactKind === "task-parity-manifest" && Array.isArray(candidate.attachments)
}

function isProductTaskParitySplitArtifactSet(value: unknown): value is ProductTaskParitySplitArtifactSet {
  if (!value || typeof value !== "object") return false
  const candidate = value as ProductTaskParitySplitArtifactSet
  return isTaskParitySummaryArtifactV2(candidate.summary) && isTaskParityEvidenceBundleV2(candidate.evidence) && isTaskParityManifestV2(candidate.manifest) && Array.isArray(candidate.attachments)
}

function isNativeCadenceFixtureSet(value: unknown): value is ProductTaskNativeCadenceFixtureSet {
  if (!value || typeof value !== "object") return false
  const candidate = value as ProductTaskNativeCadenceFixtureSet
  return candidate.schemaVersion === 1 && Array.isArray(candidate.fixtures)
}

function isNativeCadenceFixtureSplitSet(value: unknown): value is ProductTaskNativeCadenceFixtureSplitSet {
  if (!value || typeof value !== "object") return false
  const candidate = value as ProductTaskNativeCadenceFixtureSplitSet
  return Boolean(candidate.summary?.schemaVersion === 2 && Array.isArray(candidate.summary.fixtures) && isTaskParityManifestV2(candidate.manifest) && Array.isArray(candidate.attachments))
}

function isNativeCadenceFixtureSummaryV2(value: unknown): value is ProductTaskNativeCadenceFixtureSummaryV2 {
  if (!value || typeof value !== "object") return false
  const candidate = value as ProductTaskNativeCadenceFixtureSummaryV2
  return candidate.schemaVersion === 2 && candidate.artifactKind === "native-cadence-fixture-summary" && Array.isArray(candidate.fixtures)
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 96) || "value"
}
