import { createHash } from "node:crypto"
import type { EventEnvelope } from "@helix/contracts"
import { turnPipelineAtoms } from "@helix/lego-agent-loop"
import { buildAssemblyContract, previewDemotionEvidenceRefsForAtomID, type AssemblyContract, type AssemblyContractPlane, type AssemblyContractProduct, type AssemblyContractSurface } from "./assembly-contract"
import type { CurrentModulePlaceholderAudit, CurrentModuleSourceModuleConfirmationStatus } from "./current-module-placeholder-audit"
import { executableImplementationLevelForAtom, executablePortRuleFor, type ExecutableImplementationLevel } from "./executable-port-rules"
import type { HarnessProduct } from "./harness"
import {
  originalHermesAgentFixtureTrace,
  originalNanobotFixtureTrace,
  originalOpenCodeFixtureTrace,
  originalPiMonoFixtureTrace,
  type OpenCodeDifferentialScenario,
  type OpenCodeDifferentialTrace,
} from "./opencode-differential"
import { providerNativeProjectionLosses, type ProductTaskCadenceSignature, type ProductTaskNativeCadenceFixture, type ProductTaskParityReport } from "./task-parity"

export type CanonicalFlowStageID =
  | "surface.input"
  | "input.normalize"
  | "session.open"
  | "session.user-write"
  | "context.build"
  | "prompt.assemble"
  | "provider.request"
  | "provider.stream"
  | "stream.project"
  | "tool.plan"
  | "tool.permission"
  | "tool.batch"
  | "tool.execute"
  | "tool.result"
  | "acceptance.check"
  | "loop.boundary"
  | "final.summary"
  | "session.assistant-write"
  | "surface.output"

export type HarnessFlowLane = "surface" | "session" | "prompt" | "provider" | "tool" | "runtime"
export type HarnessFlowSource = "assembled" | "original"
export type HarnessFlowGraphMode = "blueprint" | "trace" | "native"
export type HarnessFlowVisibility = "none" | "aggregate" | "per-request" | "per-chunk" | "semantic" | "storage-event" | "final-message" | "explicit-event"
export type HarnessFlowLossiness = "lossless" | "semantic" | "aggregated" | "inferred" | "unobservable"
export type HarnessFlowConfidence = "exact" | "semantic" | "inferred"
export type HarnessFlowStatus = "matched" | "semantic-match" | "drift" | "missing" | "inferred" | "unobservable" | "unknown"
export type HarnessFlowDiffStatus = "same" | "changed" | "assembled-only" | "original-only" | "inferred"
export type HarnessFlowRunCaptureMode = "live" | "fixture"
export type HarnessFlowPromptIdentityStatus = "native" | "native-like" | "compatible" | "placeholder-risk" | "partial-sync" | "missing-evidence"
export type HarnessFlowParityCompatibility = "satisfied" | "partial" | "blocked" | "not-targeted"

export interface HarnessNativeProjectionLossDetail {
  field: string
  lossiness: HarnessFlowLossiness
  reason: string
}

export interface HarnessFlowStageDescriptor {
  id: CanonicalFlowStageID
  label: string
  lane: HarnessFlowLane
  order: number
  plane: AssemblyContractPlane | "surface"
  inputSummary: string
  outputSummary: string
}

export interface HarnessFlowLossinessRule {
  lossiness: HarnessFlowLossiness
  visibility: HarnessFlowVisibility
  confidence: HarnessFlowConfidence
  label: string
  hardBlocker: boolean
  description: string
}

export interface HarnessNativeFlowAdapterProfile {
  product: HarnessProduct
  adapterID: string
  label: string
  fixtureGlob: string
  evidenceSources: string[]
  observedStages: CanonicalFlowStageID[]
  inferredStages: CanonicalFlowStageID[]
  observedVisibility: HarnessFlowVisibility
  observedLossiness: HarnessFlowLossiness
  observedEvidence: string
  inferredEvidence: string
  mappingStrategy: string
}

export interface HarnessFlowStageCatalogEntry {
  id: CanonicalFlowStageID
  label: string
  lane: HarnessFlowLane
  order: number
  plane: AssemblyContractPlane | "surface"
  inputSummary: string
  outputSummary: string
  assembled: {
    portIDs: string[]
    atomIDs: string[]
    bindingIDs: string[]
    eventTypes: string[]
  }
  original: {
    adapterID: string
    evidenceSources: string[]
    fixtureGlob: string
    eventTypes: string[]
    storageRefs: string[]
    observability: HarnessFlowObservability
  }
}

export type HarnessFlowSurfaceResultKind =
  | "provider-backed-turn"
  | "server-route-turn"
  | "rpc-turn"
  | "acp-turn"
  | "gateway-turn"
  | "slack-command-turn"
  | "render-snapshot"
  | "state-snapshot"
  | "artifact-output"

export type HarnessFlowSurfaceRunMode = "internal-fixture" | "provider-backed" | "snapshot"
export type HarnessFlowLiveProviderSurfaceArtifactCoverage =
  | "verified-sdk-readback"
  | "provider-path-linked"
  | "failed-or-incomplete"
  | "missing-product"

export interface HarnessFlowSurfaceRunCoverage {
  product: AssemblyContractProduct
  surfaceID: string
  surfaceType: AssemblyContractSurface["type"]
  atomID: string
  resultKind: HarnessFlowSurfaceResultKind
  captureModes: HarnessFlowSurfaceRunMode[]
  stageIDs: CanonicalFlowStageID[]
  routeOrMethod?: string
  evidenceRefs: string[]
  liveProviderArtifact?: HarnessFlowLiveProviderSurfaceArtifact
}

export interface HarnessFlowLiveProviderSurfaceArtifact {
  coverage: HarnessFlowLiveProviderSurfaceArtifactCoverage
  artifactPath: string
  generatedAt: string
  provider?: string
  modelID?: string
  productStatus: "passed" | "skipped" | "failed" | "missing"
  ok: boolean
  sessionID?: string
  steps?: number
  readbackChecks: number
  attachmentPath?: string
  attachmentSha256?: string
  verifierChecks: string[]
}

export interface HarnessFlowLiveProviderProductEvidence {
  product: HarnessProduct
  status: "passed" | "skipped" | "failed"
  ok: boolean
  sessionID?: string
  steps?: number
  readbackChecks: number
  attachmentPath?: string
  attachmentSha256?: string
}

export interface HarnessFlowLiveProviderSummary {
  artifactKind: "live-provider-parity-summary"
  artifactPath: string
  generatedAt: string
  provider?: string
  modelID?: string
  status: "passed" | "skipped" | "failed"
  ok: boolean
  products: HarnessFlowLiveProviderProductEvidence[]
  verifierChecks: string[]
}

export interface HarnessFlowDataSourceCoverage {
  id:
    | "assembly-contract"
    | "compiled-recipe"
    | "builder-data"
    | "turn-pipeline-atoms"
    | "port-fixtures"
    | "turn-pipeline-trace"
    | "lifecycle-events"
    | "provider-events"
    | "tool-events"
    | "context-compaction-events"
    | "product-surface-results"
  scope: "static-blueprint" | "runtime-trace"
  label: string
  status: "covered"
  stageIDs: CanonicalFlowStageID[]
  evidenceRefs: string[]
  observedEventTypes: string[]
  surfaceResults?: HarnessFlowSurfaceRunCoverage[]
  liveProviderSummary?: {
    artifactPath: string
    generatedAt: string
    provider?: string
    modelID?: string
    status: "passed" | "skipped" | "failed"
    ok: boolean
    products: Array<{ product: HarnessProduct; status: "passed" | "skipped" | "failed"; ok: boolean }>
  }
}

export interface HarnessFlowStageCatalog {
  schemaVersion: 1
  generatedAt: string
  product: HarnessProduct
  defaultTaskIDs: string[]
  stages: HarnessFlowStageCatalogEntry[]
  edges: Array<Pick<HarnessFlowEdge, "from" | "to" | "label" | "dataKind" | "diffStatus"> & { hookEvents: string[] }>
  dataSources: HarnessFlowDataSourceCoverage[]
  nativeAdapter: HarnessNativeFlowAdapterProfile
  lossinessRules: HarnessFlowLossinessRule[]
  summary: {
    stages: number
    edges: number
    dataSources: number
    assembledMappedStages: number
    originalObservedStages: number
    inferredStages: number
    fingerprint: string
  }
}

export interface HarnessFlowObservability {
  visibility: HarnessFlowVisibility
  lossiness: HarnessFlowLossiness
  confidence: HarnessFlowConfidence
  evidence: string
}

export interface HarnessFlowEvidence {
  id: string
  source: HarnessFlowSource
  kind: "contract" | "binding" | "event" | "prompt" | "fixture" | "differential" | "native-cadence" | "task-parity" | "storage" | "cli"
  label: string
  refs: string[]
  lossiness: HarnessFlowLossiness
  metadata: Record<string, unknown>
}

export interface HarnessFlowMetrics {
  count?: number
  durationMs?: number
  tokenEstimate?: number
  sectionCount?: number
  resourceCount?: number
  promptFingerprint?: string
  promptAtomID?: string
  identityStatus?: HarnessFlowPromptIdentityStatus
  implementationLevels?: ExecutableImplementationLevel[]
  bridgeLayers?: HarnessFlowBridgeLayerSummary[]
  moduleClaims?: HarnessFlowModuleClaim[]
  parityTargetRefs?: string[]
  parityTargetSatisfied?: boolean
  parityTargetBlockers?: string[]
  nativeEvidenceRefs?: string[]
  fixtureIDs?: string[]
  parityCoverage?: AssemblyContract["atoms"][number]["parityCoverage"]
  knownLossiness?: string[]
  moduleConfirmationStatuses?: CurrentModuleSourceModuleConfirmationStatus[]
  moduleConfirmationSourceFiles?: string[]
  moduleConfirmationSourceOwners?: string[]
  moduleConfirmationFixtureTargets?: string[]
  moduleConfirmationSummaries?: string[]
  toolCount?: number
  requestCount?: number
  eventCount?: number
  traceEventSequence?: string[]
  partTypes?: string[]
  finish?: string
  acceptedEarly?: boolean
  retryCount?: number
  compactionTriggered?: boolean
  toolSequence?: string[]
  batchSignature?: string[]
}

export interface HarnessFlowBridgeLayerSummary {
  layer: AssemblyContractPlane | "surface"
  implementationLevel: ExecutableImplementationLevel
  atomIDs: string[]
}

export interface HarnessFlowModuleClaim {
  atomID: string
  portIDs: string[]
  sourceProduct: AssemblyContractProduct | "common" | "unknown"
  sourceScope: AssemblyContract["atoms"][number]["scope"]
  implementationLevel: ExecutableImplementationLevel
  parityTargetProduct?: AssemblyContractProduct
  parityTargetRef?: string
  parityCompatible: HarnessFlowParityCompatibility
  parityTargetSatisfied: boolean
  evidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  blockers: string[]
  summary: string
}

export interface BuildAssembledFlowBlueprintOptions {
  currentModuleAudit?: CurrentModulePlaceholderAudit | null | undefined
  compositionClaim?: "custom-composition" | "experimental-hybrid" | undefined
}

export interface HarnessFlowHookPoint {
  event: string
  observerCount: number
  handlerCount: number
  sourceCount: number
  sources: Array<{
    order: number
    id: string
    name: string
    scope: string
    source: string
    adapterKind?: "assembled-hook-host" | "opencode-plugin" | "pi-extension" | "nanobot-plugin" | "hermes-plugin" | "native-event-tap"
    adapterSource?: string
    adapterProduct?: AssemblyContractProduct
  }>
  capabilities: Array<"observe" | "transform" | "block" | "handle" | "cleanup" | "permission">
  canTransform: boolean
  canBlock: boolean
  canHandle: boolean
  observability: HarnessFlowObservability
}

export interface HarnessFlowNode {
  id: CanonicalFlowStageID
  label: string
  lane: HarnessFlowLane
  order: number
  plane: AssemblyContractPlane | "surface"
  inputSummary: string
  outputSummary: string
  assembledPortIDs: string[]
  assembledAtomIDs: string[]
  bindingIDs: string[]
  originalEventTypes: string[]
  originalStorageRefs: string[]
  originalEvidenceRefs: string[]
  observability: HarnessFlowObservability
  metrics: HarnessFlowMetrics
  status: HarnessFlowStatus
}

export interface HarnessFlowEdge {
  id: string
  from: CanonicalFlowStageID
  to: CanonicalFlowStageID
  label: string
  dataKind: string
  hookPoints: HarnessFlowHookPoint[]
  payloadFingerprint: string
  diffStatus: HarnessFlowDiffStatus
}

export interface HarnessFlowGraph {
  schemaVersion: 1
  generatedAt: string
  product: AssemblyContractProduct
  source: HarnessFlowSource
  mode: HarnessFlowGraphMode
  recipeID?: string
  contractFingerprint?: string
  scenarioID?: string
  taskID?: string
  nodes: HarnessFlowNode[]
  edges: HarnessFlowEdge[]
  evidence: HarnessFlowEvidence[]
  summary: {
    stages: number
    edges: number
    observedStages: number
    inferredStages: number
    unobservableStages: number
    driftCount: number
    fingerprint: string
  }
}

export interface HarnessFlowRunSummaryInput {
  finish?: string
  steps?: number
  providerRequestCount?: number
  toolSequence?: string[]
  batchSignature?: string[]
  assistantPartTypes?: string[]
  retryCount?: number
  compactionTriggered?: boolean
  acceptedEarly?: boolean
}

export interface HarnessFlowRun {
  schemaVersion: 1
  generatedAt: string
  runID: string
  product: AssemblyContractProduct
  source: "assembled"
  captureMode: HarnessFlowRunCaptureMode
  taskID?: string
  promptFingerprint: string
  redaction: {
    prompt: "fingerprint-only"
    providerRequest: "omitted"
    toolArgs: "summary-only"
  }
  events: EventEnvelope[]
  graph: HarnessFlowGraph
  summary: {
    finish: string
    steps: number
    events: number
    observedStages: number
    fingerprint: string
  }
}

export interface HarnessFlowDiff {
  id: string
  stageID: CanonicalFlowStageID
  status: HarnessFlowDiffStatus
  category:
    | "stage.observability"
    | "cadence.provider-request-count"
    | "cadence.tool-call-count"
    | "cadence.tool-sequence"
    | "cadence.tool-batch"
    | "cadence.message-part-type"
    | "cadence.streaming-delta"
    | "cadence.final-summary"
    | "cadence.early-accept"
    | "cadence.native-projection-gap"
  message: string
  assembled: unknown
  original: unknown
  owningPlane: AssemblyContractPlane | "surface" | "native-projector"
  candidateAtomIDs: string[]
  confidence: HarnessFlowConfidence
}

export interface HarnessFlowComparison {
  schemaVersion: 1
  generatedAt: string
  product: HarnessProduct
  taskID?: string
  assembled: HarnessFlowGraph
  original: HarnessFlowGraph
  diffs: HarnessFlowDiff[]
  summary: {
    status: "matched" | "semantic-drift" | "missing-evidence"
    stages: number
    matchedStages: number
    driftCount: number
    inferredStages: number
    unobservableStages: number
    fingerprint: string
  }
}

export interface HarnessFlowVerification {
  ok: boolean
  issues: Array<{ id: string; message: string }>
  summary: {
    graphs: number
    comparisons: number
    stages: number
  }
}

export interface BuildAssembledFlowRunInput extends HarnessFlowRunSummaryInput {
  product: AssemblyContractProduct
  contract?: AssemblyContract
  currentModuleAudit?: CurrentModulePlaceholderAudit | null
  generatedAt?: string
  runID?: string
  taskID?: string
  prompt?: string
  captureMode?: HarnessFlowRunCaptureMode
}

export const canonicalFlowStages: HarnessFlowStageDescriptor[] = [
  {
    id: "surface.input",
    label: "Surface Input",
    lane: "surface",
    order: 0,
    plane: "surface",
    inputSummary: "CLI, TUI, Web, SDK, RPC, ACP, gateway, or product shell request",
    outputSummary: "product-scoped user input envelope",
  },
  {
    id: "input.normalize",
    label: "Input Normalize",
    lane: "runtime",
    order: 1,
    plane: "agent-loop",
    inputSummary: "raw product/user input and shell metadata",
    outputSummary: "normalized prompt, source metadata, or handled result",
  },
  {
    id: "session.open",
    label: "Session Open",
    lane: "session",
    order: 2,
    plane: "session",
    inputSummary: "workspace, session id, branch, resume, or fork metadata",
    outputSummary: "active session context",
  },
  {
    id: "session.user-write",
    label: "User Write",
    lane: "session",
    order: 3,
    plane: "session",
    inputSummary: "normalized user prompt",
    outputSummary: "persisted user message",
  },
  {
    id: "context.build",
    label: "Context Build",
    lane: "session",
    order: 4,
    plane: "agent-loop",
    inputSummary: "transcript, token budget, context selector, compaction state",
    outputSummary: "provider-ready context messages and compaction decision",
  },
  {
    id: "prompt.assemble",
    label: "Prompt Assemble",
    lane: "prompt",
    order: 5,
    plane: "prompt",
    inputSummary: "prompt resources, rules, tools, model capabilities, hooks",
    outputSummary: "system/developer/tool prompt artifact",
  },
  {
    id: "provider.request",
    label: "Provider Request",
    lane: "provider",
    order: 6,
    plane: "provider",
    inputSummary: "context, prompt artifact, model, tools, options",
    outputSummary: "provider request boundary",
  },
  {
    id: "provider.stream",
    label: "Provider Stream",
    lane: "provider",
    order: 7,
    plane: "provider",
    inputSummary: "provider request and retry policy",
    outputSummary: "provider stream events",
  },
  {
    id: "stream.project",
    label: "Stream Project",
    lane: "provider",
    order: 8,
    plane: "provider",
    inputSummary: "raw or normalized provider stream events",
    outputSummary: "assistant parts and tool-call candidates",
  },
  {
    id: "tool.plan",
    label: "Tool Plan",
    lane: "tool",
    order: 9,
    plane: "tool",
    inputSummary: "tool-call parts and tool registry",
    outputSummary: "ordered tool execution candidates",
  },
  {
    id: "tool.permission",
    label: "Tool Permission",
    lane: "tool",
    order: 10,
    plane: "tool",
    inputSummary: "tool action, subject, policy, hook bridge",
    outputSummary: "allow, deny, ask, or blocked result",
  },
  {
    id: "tool.batch",
    label: "Tool Batch",
    lane: "tool",
    order: 11,
    plane: "tool",
    inputSummary: "prepared tool calls and execution modes",
    outputSummary: "parallel or sequential batches",
  },
  {
    id: "tool.execute",
    label: "Tool Execute",
    lane: "tool",
    order: 12,
    plane: "tool",
    inputSummary: "prepared tool calls and resource grants",
    outputSummary: "tool execution lifecycle events",
  },
  {
    id: "tool.result",
    label: "Tool Result",
    lane: "tool",
    order: 13,
    plane: "tool",
    inputSummary: "tool result content, details, and error state",
    outputSummary: "normalized/truncated tool result part",
  },
  {
    id: "acceptance.check",
    label: "Acceptance Check",
    lane: "runtime",
    order: 14,
    plane: "runtime",
    inputSummary: "task policy evidence, workspace/tool/message state",
    outputSummary: "acceptance decision or unavailable evidence",
  },
  {
    id: "loop.boundary",
    label: "Loop Boundary",
    lane: "runtime",
    order: 15,
    plane: "agent-loop",
    inputSummary: "step result, finish reason, acceptance state",
    outputSummary: "continue, stop, retry, or synthetic continuation decision",
  },
  {
    id: "final.summary",
    label: "Final Summary",
    lane: "runtime",
    order: 16,
    plane: "agent-loop",
    inputSummary: "accepted/tool/final text state",
    outputSummary: "native-like final summary decision",
  },
  {
    id: "session.assistant-write",
    label: "Assistant Write",
    lane: "session",
    order: 17,
    plane: "session",
    inputSummary: "assistant parts and metadata",
    outputSummary: "persisted assistant message or native storage projection",
  },
  {
    id: "surface.output",
    label: "Surface Output",
    lane: "surface",
    order: 18,
    plane: "surface",
    inputSummary: "session result, message projection, renderer state",
    outputSummary: "CLI JSON, TUI/Web render, SDK/server response, or gateway dispatch",
  },
]

export const defaultFlowTaskIDs = ["read-only-answer", "single-file-edit", "tool-error-retry", "context-compaction"] as const

export const canonicalFlowLossinessRules: HarnessFlowLossinessRule[] = [
  {
    lossiness: "lossless",
    visibility: "explicit-event",
    confidence: "exact",
    label: "Exact event or artifact",
    hardBlocker: false,
    description: "The stage is backed by a direct event, contract binding, fixture field, or verified artifact summary.",
  },
  {
    lossiness: "semantic",
    visibility: "semantic",
    confidence: "semantic",
    label: "Semantic native parity",
    hardBlocker: false,
    description: "The native product exposes enough shape to compare meaning, counts, order, or part types without raw payload parity.",
  },
  {
    lossiness: "aggregated",
    visibility: "aggregate",
    confidence: "semantic",
    label: "Aggregated visible flow",
    hardBlocker: false,
    description: "Only boundary-level native evidence is visible; use it for drift hints, not exact internal lifecycle claims.",
  },
  {
    lossiness: "inferred",
    visibility: "none",
    confidence: "inferred",
    label: "Inferred from surrounding evidence",
    hardBlocker: false,
    description: "The canonical stage is inferred from neighboring events or cadence; do not treat it as a hard parity blocker by itself.",
  },
  {
    lossiness: "unobservable",
    visibility: "none",
    confidence: "inferred",
    label: "Native evidence unavailable",
    hardBlocker: false,
    description: "The source product does not expose this internal stage; keep the assembled blueprint usable and surface the gap in the inspector.",
  },
]

export const nativeFlowAdapterProfiles: Record<HarnessProduct, HarnessNativeFlowAdapterProfile> = {
  opencode: {
    product: "opencode",
    adapterID: "opencode.fixture-native",
    label: "OpenCode fixture/native adapter",
    fixtureGlob: "docs/reports/task-parity-native-cadence-fixtures/attachments/opencode-*.json",
    evidenceSources: ["cli-json-events", "stdout-event-types", "sqlite-native-schema", "assistant-part-protocol", "tool-registry", "provider-endpoint", "task-parity-report", "native-cadence-fixture"],
    observedStages: ["surface.input", "session.open", "session.user-write", "provider.request", "provider.stream", "stream.project", "tool.plan", "tool.batch", "tool.execute", "tool.result", "session.assistant-write", "surface.output"],
    inferredStages: ["context.build", "prompt.assemble", "tool.permission", "acceptance.check", "loop.boundary", "final.summary"],
    observedVisibility: "semantic",
    observedLossiness: "semantic",
    observedEvidence: "opencode-native-cli-storage-fixture",
    inferredEvidence: "opencode-surrounding-cli-storage-evidence",
    mappingStrategy: "High confidence around provider boundary, assistant part protocol, session storage projection, tool registry, and CLI event cadence; internal prompt/hook details stay summary-only.",
  },
  "pi-mono": {
    product: "pi-mono",
    adapterID: "pi-mono.fixture-native",
    label: "Pi Mono fixture/native adapter",
    fixtureGlob: "docs/reports/task-parity-native-cadence-fixtures/attachments/pi-mono-*.json",
    evidenceSources: ["pinned-jsonl-fixture", "native-cli-json-event-stream", "jsonl-v3-session-records", "typebox-tool-schema", "task-parity-report", "native-cadence-fixture"],
    observedStages: ["surface.input", "session.open", "session.user-write", "provider.request", "provider.stream", "stream.project", "tool.plan", "tool.batch", "tool.execute", "tool.result", "session.assistant-write", "surface.output"],
    inferredStages: ["context.build", "prompt.assemble", "tool.permission", "acceptance.check", "loop.boundary", "final.summary"],
    observedVisibility: "semantic",
    observedLossiness: "semantic",
    observedEvidence: "pi-jsonl-v3-cli-fixture",
    inferredEvidence: "pi-surrounding-jsonl-cli-evidence",
    mappingStrategy: "Session/write and CLI events are strong; internal prompt/tool adapter details are semantic or inferred until native extension hooks expose more detail.",
  },
  "opencode-pi-hybrid": {
    product: "opencode-pi-hybrid",
    adapterID: "opencode-pi-hybrid.assembled-native",
    label: "OpenCode/Pi hybrid assembled adapter",
    fixtureGlob: "docs/reports/task-parity-livecodebench-opencode-pi-hybrid/attachments/opencode-pi-hybrid-*.json",
    evidenceSources: ["opencode-session-runtime-trace", "opencode-tool-registry", "pi-turn-cadence", "pi-jsonl-v3-session-records", "task-parity-report", "assembled-loop"],
    observedStages: ["surface.input", "session.open", "session.user-write", "provider.request", "provider.stream", "stream.project", "tool.plan", "tool.batch", "tool.execute", "tool.result", "session.assistant-write", "surface.output"],
    inferredStages: ["context.build", "prompt.assemble", "tool.permission", "acceptance.check", "loop.boundary", "final.summary"],
    observedVisibility: "semantic",
    observedLossiness: "semantic",
    observedEvidence: "opencode-session-plus-pi-turn-runtime-trace",
    inferredEvidence: "hybrid-assembled-runtime-surrounding-evidence",
    mappingStrategy: "Composes OpenCode session/tool evidence with Pi turn cadence; no single upstream native binary exists, so native comparison is semantic against the assembled hybrid trace.",
  },
  nanobot: {
    product: "nanobot",
    adapterID: "nanobot.fixture-native",
    label: "Nanobot fixture/native adapter",
    fixtureGlob: "docs/reports/task-parity-native-cadence-fixtures/attachments/nanobot-*.json",
    evidenceSources: ["pinned-nanobot-baseline", "native-cli-capture", "workspace-jsonl-session", "provider-protocol", "plugin-tool-baseline", "task-parity-report", "native-cadence-fixture"],
    observedStages: ["surface.input", "session.open", "session.user-write", "provider.request", "provider.stream", "stream.project", "tool.plan", "tool.batch", "tool.execute", "tool.result", "session.assistant-write", "surface.output"],
    inferredStages: ["context.build", "prompt.assemble", "tool.permission", "acceptance.check", "loop.boundary", "final.summary"],
    observedVisibility: "semantic",
    observedLossiness: "semantic",
    observedEvidence: "nanobot-native-baseline-fixture",
    inferredEvidence: "nanobot-surrounding-session-provider-evidence",
    mappingStrategy: "Message/provider/tool cadence is semantic; missing plugin and default tool details are marked native-projection-gap or inferred.",
  },
  "hermes-agent": {
    product: "hermes-agent",
    adapterID: "hermes-agent.visible-native",
    label: "Hermes Agent visible-native adapter",
    fixtureGlob: "docs/reports/task-parity-native-cadence-fixtures/attachments/hermes-agent-*.json",
    evidenceSources: ["hermes-cli-json-event-stream", "sqlite-fts-storage", "live-task-parity-visible-trace", "assembly-contract-nativeFixtureSource", "task-parity-report"],
    observedStages: ["session.open", "provider.request", "provider.stream", "stream.project", "session.assistant-write", "surface.output"],
    inferredStages: ["context.build", "prompt.assemble", "tool.plan", "tool.permission", "tool.batch", "tool.execute", "tool.result", "acceptance.check", "loop.boundary", "final.summary"],
    observedVisibility: "aggregate",
    observedLossiness: "aggregated",
    observedEvidence: "hermes-visible-cli-trace",
    inferredEvidence: "hermes-visible-flow-surrounding-evidence",
    mappingStrategy: "Maps session.created, pre_llm_call, message.delta, and post_llm_call conservatively; internal prompt/hook/tool lifecycle remains aggregated or inferred.",
  },
}

export function nativeFlowAdapterProfileForProduct(product: HarnessProduct): HarnessNativeFlowAdapterProfile {
  return nativeFlowAdapterProfiles[product]
}

export function buildCanonicalFlowCatalog(input: { product?: HarnessProduct; generatedAt?: string; taskID?: string; liveProviderSummary?: HarnessFlowLiveProviderSummary | null } = {}): HarnessFlowStageCatalog {
  const product = input.product ?? "opencode"
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const taskID = input.taskID ?? defaultFlowTaskIDs[0]
  const contract = buildAssemblyContract({ product, generatedAt })
  const assembled = buildAssembledFlowBlueprint(contract, generatedAt)
  const original = buildOriginalFlowForProduct(product, { taskID, generatedAt })
  const adapter = nativeFlowAdapterProfileForProduct(product)
  const stages = canonicalFlowStages.map((stage): HarnessFlowStageCatalogEntry => {
    const assembledNode = assembled.nodes.find((node) => node.id === stage.id)
    const originalNode = original.nodes.find((node) => node.id === stage.id)
    return {
      ...stage,
      assembled: {
        portIDs: assembledNode?.assembledPortIDs ?? [],
        atomIDs: assembledNode?.assembledAtomIDs ?? [],
        bindingIDs: assembledNode?.bindingIDs ?? [],
        eventTypes: assembledEventTypesForStage(stage.id),
      },
      original: {
        adapterID: adapter.adapterID,
        evidenceSources: adapter.evidenceSources,
        fixtureGlob: adapter.fixtureGlob,
        eventTypes: originalNode && originalNode.originalEventTypes.length > 0 ? originalNode.originalEventTypes : originalEventTypesForStage(stage.id, product),
        storageRefs: originalNode?.originalStorageRefs ?? [],
        observability: originalNode?.observability ?? originalObservabilityForStage(product, stage.id, false),
      },
    }
  })
  const edges = buildCanonicalEdges("assembled", [], product).map((edge) => ({
    from: edge.from,
    to: edge.to,
    label: edge.label,
    dataKind: edge.dataKind,
    diffStatus: edge.diffStatus,
    hookEvents: edge.hookPoints.map((hook) => hook.event),
  }))
  const dataSources = buildFlowDataSourceCoverage(contract, stages, input.liveProviderSummary ?? null)
  const summary = {
    stages: stages.length,
    edges: edges.length,
    dataSources: dataSources.length,
    assembledMappedStages: stages.filter((stage) => stage.assembled.portIDs.length > 0 || stage.assembled.atomIDs.length > 0).length,
    originalObservedStages: stages.filter((stage) => stage.original.observability.lossiness !== "inferred" && stage.original.observability.lossiness !== "unobservable").length,
    inferredStages: stages.filter((stage) => stage.original.observability.lossiness === "inferred").length,
  }
  return {
    schemaVersion: 1,
    generatedAt,
    product,
    defaultTaskIDs: [...defaultFlowTaskIDs],
    stages,
    edges,
    dataSources,
    nativeAdapter: adapter,
    lossinessRules: canonicalFlowLossinessRules,
    summary: { ...summary, fingerprint: hashStable({ product, stages, edges, dataSources, adapter: adapter.adapterID, tasks: defaultFlowTaskIDs, lossinessRules: canonicalFlowLossinessRules }) },
  }
}

function buildFlowDataSourceCoverage(
  contract: AssemblyContract,
  stages: HarnessFlowStageCatalogEntry[],
  liveProviderSummary: HarnessFlowLiveProviderSummary | null,
): HarnessFlowDataSourceCoverage[] {
  const allStageIDs = stages.map((stage) => stage.id)
  const surfaceResults = buildProductSurfaceRunCoverage(contract, liveProviderSummary)
  const mappedStaticStageIDs = stages
    .filter((stage) => stage.assembled.portIDs.length > 0 || stage.assembled.atomIDs.length > 0 || stage.assembled.bindingIDs.length > 0)
    .map((stage) => stage.id)
  const portFixtureStageIDs = stages
    .filter((stage) => stage.assembled.portIDs.some((portID) => {
      const port = contract.ports.find((candidate) => candidate.id === portID)
      return Boolean(port && (port.traces.length > 0 || port.errors.length > 0 || port.conformance.length > 0))
    }))
    .map((stage) => stage.id)
  const coverage: HarnessFlowDataSourceCoverage[] = [
    {
      id: "assembly-contract",
      scope: "static-blueprint",
      label: "buildAssemblyContract atoms/ports/bindings/surfaces/swap-points/capabilities",
      status: "covered",
      stageIDs: mappedStaticStageIDs,
      evidenceRefs: [`contract.${contract.product}.${contract.fingerprints.contract}`, "buildAssemblyContract()"],
      observedEventTypes: [],
    },
    {
      id: "compiled-recipe",
      scope: "static-blueprint",
      label: "compileRecipe expanded modules, bundles, entrypoints, lockfile graph",
      status: "covered",
      stageIDs: mappedStaticStageIDs,
      evidenceRefs: [`recipe.${contract.recipeID}`, "compileRecipe()", "expanded-bundles", "entrypoints", "lockfile-graph"],
      observedEventTypes: [],
    },
    {
      id: "builder-data",
      scope: "static-blueprint",
      label: "buildHarnessBuilderData presets, slots, bundle states, selected atom set",
      status: "covered",
      stageIDs: allStageIDs,
      evidenceRefs: ["HarnessBuilderData.presets", "HarnessBuilderData.slots", "HarnessBuilderData.bundleStates", "HarnessBuilderData.flowCatalogs"],
      observedEventTypes: [],
    },
    {
      id: "turn-pipeline-atoms",
      scope: "static-blueprint",
      label: "turnPipelineAtoms canonical order, input summaries, and output summaries",
      status: "covered",
      stageIDs: stageIDsForTurnPipelineAtoms(),
      evidenceRefs: turnPipelineAtoms.map((atom) => atom.id),
      observedEventTypes: ["turn.pipeline.trace"],
    },
    {
      id: "port-fixtures",
      scope: "static-blueprint",
      label: "Port fixture traces, errors, and conformance descriptions for prompt/tool/provider/session/hook/runtime stages",
      status: "covered",
      stageIDs: portFixtureStageIDs,
      evidenceRefs: uniqueStrings(contract.ports.flatMap((port) => [...port.traces, ...port.errors, ...port.conformance])),
      observedEventTypes: [],
    },
    {
      id: "turn-pipeline-trace",
      scope: "runtime-trace",
      label: "turn.pipeline.trace stageID, atom phase, step, attempt, and decision details",
      status: "covered",
      stageIDs: stageIDsForAssembledEvents(["turn.pipeline.trace"]),
      evidenceRefs: turnPipelineAtoms.map((atom) => `${atom.id}:${atom.traceEvent}`),
      observedEventTypes: ["turn.pipeline.trace"],
    },
    {
      id: "lifecycle-events",
      scope: "runtime-trace",
      label: "session/turn/message/agent lifecycle events",
      status: "covered",
      stageIDs: stageIDsForAssembledEvents(["session.start", "turn.start", "turn.end", "message.start", "message.end", "agent.start", "agent.end"]),
      evidenceRefs: ["session.start", "turn.start/end", "message.start/end", "agent.start/end"],
      observedEventTypes: ["session.start", "turn.start", "turn.end", "message.start", "message.end", "agent.start", "agent.end"],
    },
    {
      id: "provider-events",
      scope: "runtime-trace",
      label: "provider request and response boundary events",
      status: "covered",
      stageIDs: stageIDsForAssembledEvents(["provider.request.before", "provider.response.after"]),
      evidenceRefs: ["provider.request.before", "provider.response.after"],
      observedEventTypes: ["provider.request.before", "provider.response.after"],
    },
    {
      id: "tool-events",
      scope: "runtime-trace",
      label: "tool planning, permission, execution, and result events",
      status: "covered",
      stageIDs: stageIDsForAssembledEvents(["tool.call", "permission.ask", "tool.execution_start", "tool.execution_update", "tool.execution_end", "tool.result"]),
      evidenceRefs: ["tool.call", "permission.ask", "tool.execution_start/update/end", "tool.result"],
      observedEventTypes: ["tool.call", "permission.ask", "tool.execution_start", "tool.execution_update", "tool.execution_end", "tool.result"],
    },
    {
      id: "context-compaction-events",
      scope: "runtime-trace",
      label: "context and session compaction lifecycle events",
      status: "covered",
      stageIDs: stageIDsForAssembledEvents(["context", "session.before_compact", "session.compacting", "session.compact", "session.compacted"]),
      evidenceRefs: ["context", "session.before_compact", "session.compacting", "session.compact", "session.compacted"],
      observedEventTypes: ["context", "session.before_compact", "session.compacting", "session.compact", "session.compacted"],
    },
    {
      id: "product-surface-results",
      scope: "runtime-trace",
      label: "SDK/CLI/TUI/RPC/Web/server internal fixture replay, provider-backed run, and render/snapshot response summaries",
      status: "covered",
      stageIDs: uniqueStrings(surfaceResults.flatMap((result) => result.stageIDs)) as CanonicalFlowStageID[],
      evidenceRefs: [
        "product-shell-surfaces.conformance.test.ts",
        "reverse-assembly.conformance.test.ts",
        "live-provider-parity opt-in",
        "docs-site /api/harness-flow/run",
        ...surfaceResults.flatMap((result) => result.evidenceRefs),
      ],
      observedEventTypes: uniqueStrings([
        "input",
        "session.idle",
        "agent.end",
        ...surfaceResults.map((result) => `surface.${result.resultKind}`),
        ...(surfaceResults.some((result) => result.liveProviderArtifact) ? ["live-provider-parity-summary"] : []),
      ]),
      surfaceResults,
      ...(liveProviderSummary ? { liveProviderSummary: summarizeLiveProviderEvidence(liveProviderSummary) } : {}),
    },
  ]
  return coverage.map((source): HarnessFlowDataSourceCoverage => ({
    ...source,
    stageIDs: uniqueStrings(source.stageIDs) as CanonicalFlowStageID[],
    evidenceRefs: uniqueStrings(source.evidenceRefs),
    observedEventTypes: uniqueStrings(source.observedEventTypes),
    ...(source.surfaceResults ? { surfaceResults: source.surfaceResults.map((result) => ({ ...result, evidenceRefs: uniqueStrings(result.evidenceRefs), stageIDs: uniqueStrings(result.stageIDs) as CanonicalFlowStageID[] })) } : {}),
  }))
}

function buildProductSurfaceRunCoverage(contract: AssemblyContract, liveProviderSummary: HarnessFlowLiveProviderSummary | null): HarnessFlowSurfaceRunCoverage[] {
  return contract.surfaces
    .map((surface) => surfaceRunCoverage(surface, liveProviderSummary))
    .sort((left, right) => left.surfaceID.localeCompare(right.surfaceID))
}

function surfaceRunCoverage(surface: AssemblyContractSurface, liveProviderSummary: HarnessFlowLiveProviderSummary | null): HarnessFlowSurfaceRunCoverage {
  const descriptor = surfaceResultDescriptor(surface)
  const liveProviderArtifact = liveProviderArtifactForSurface(surface, descriptor.resultKind, liveProviderSummary)
  return {
    product: surface.product,
    surfaceID: surface.id,
    surfaceType: surface.type,
    atomID: surface.atomID,
    resultKind: descriptor.resultKind,
    captureModes: descriptor.captureModes,
    stageIDs: ["surface.input", "surface.output"],
    ...(descriptor.routeOrMethod ? { routeOrMethod: descriptor.routeOrMethod } : {}),
    ...(liveProviderArtifact ? { liveProviderArtifact } : {}),
    evidenceRefs: uniqueStrings([
      `assembly-contract.surface.${surface.id}`,
      `atom.${surface.atomID}`,
      ...surface.nativeParityEvidence.map((evidence) => `native-parity.${evidence}`),
      ...previewDemotionEvidenceRefsForAtomID(surface.atomID),
      ...descriptor.evidenceRefs,
      ...(liveProviderArtifact ? [`live-provider.${liveProviderArtifact.coverage}`, liveProviderArtifact.artifactPath, ...(liveProviderArtifact.attachmentPath ? [liveProviderArtifact.attachmentPath] : [])] : []),
    ]),
  }
}

function liveProviderArtifactForSurface(
  surface: AssemblyContractSurface,
  resultKind: HarnessFlowSurfaceResultKind,
  liveProviderSummary: HarnessFlowLiveProviderSummary | null,
): HarnessFlowLiveProviderSurfaceArtifact | undefined {
  if (!liveProviderSummary || resultKind === "render-snapshot" || resultKind === "state-snapshot" || resultKind === "artifact-output") return undefined
  if (!isHarnessProduct(surface.product)) return undefined
  const product = liveProviderSummary.products.find((candidate) => candidate.product === surface.product)
  const base = {
    artifactPath: liveProviderSummary.artifactPath,
    generatedAt: liveProviderSummary.generatedAt,
    ...(liveProviderSummary.provider ? { provider: liveProviderSummary.provider } : {}),
    ...(liveProviderSummary.modelID ? { modelID: liveProviderSummary.modelID } : {}),
    verifierChecks: liveProviderSummary.verifierChecks,
  }
  if (!product) {
    return {
      ...base,
      coverage: "missing-product",
      productStatus: "missing",
      ok: false,
      readbackChecks: 0,
    }
  }
  const ok = product.status === "passed" && product.ok
  const coverage: HarnessFlowLiveProviderSurfaceArtifactCoverage = !ok
    ? "failed-or-incomplete"
    : surface.type === "sdk" || surface.id.endsWith(".product-shell.sdk") || surface.id === "sdk"
      ? "verified-sdk-readback"
      : "provider-path-linked"
  return {
    ...base,
    coverage,
    productStatus: product.status,
    ok,
    ...(product.sessionID ? { sessionID: product.sessionID } : {}),
    ...(product.steps === undefined ? {} : { steps: product.steps }),
    readbackChecks: product.readbackChecks,
    ...(product.attachmentPath ? { attachmentPath: product.attachmentPath } : {}),
    ...(product.attachmentSha256 ? { attachmentSha256: product.attachmentSha256 } : {}),
  }
}

function summarizeLiveProviderEvidence(summary: HarnessFlowLiveProviderSummary): NonNullable<HarnessFlowDataSourceCoverage["liveProviderSummary"]> {
  return {
    artifactPath: summary.artifactPath,
    generatedAt: summary.generatedAt,
    ...(summary.provider ? { provider: summary.provider } : {}),
    ...(summary.modelID ? { modelID: summary.modelID } : {}),
    status: summary.status,
    ok: summary.ok,
    products: summary.products.map((product) => ({
      product: product.product,
      status: product.status,
      ok: product.ok,
    })),
  }
}

function surfaceResultDescriptor(surface: AssemblyContractSurface): {
  resultKind: HarnessFlowSurfaceResultKind
  captureModes: HarnessFlowSurfaceRunMode[]
  routeOrMethod?: string
  evidenceRefs: string[]
} {
  const id = surface.id.toLowerCase()
  if (surface.type === "sdk") return providerSurfaceDescriptor("provider-backed-turn", "runTurn(input)")
  if (surface.type === "cli") return providerSurfaceDescriptor("provider-backed-turn", "run({ prompt, provider })")
  if (surface.type === "rpc") return providerSurfaceDescriptor("rpc-turn", "run.turn")
  if (surface.type === "server") return providerSurfaceDescriptor("server-route-turn", serverRunRoute(surface.product))
  if (surface.type === "tui") return snapshotSurfaceDescriptor("render-snapshot", "render() / dispatch(event)")
  if (surface.type === "web" || surface.type === "desktop") return snapshotSurfaceDescriptor("render-snapshot", "render() / write()")
  if (id.includes("api-server") || id.includes("apiserver")) return providerSurfaceDescriptor("server-route-turn", serverRunRoute(surface.product))
  if (id.includes("acp")) return providerSurfaceDescriptor("acp-turn", "session/prompt")
  if (id.includes("gateway")) return providerSurfaceDescriptor("gateway-turn", "gateway.message")
  if (id.includes("slack")) return providerSurfaceDescriptor("slack-command-turn", "/opencode run <prompt>")
  if (id.includes("release") || id.includes("package") || id.includes("example") || id.includes("browser-smoke")) {
    return snapshotSurfaceDescriptor("artifact-output", "snapshot() / write() / verify()")
  }
  return snapshotSurfaceDescriptor("state-snapshot", "snapshot()")
}

function providerSurfaceDescriptor(
  resultKind: HarnessFlowSurfaceResultKind,
  routeOrMethod: string,
): {
  resultKind: HarnessFlowSurfaceResultKind
  captureModes: HarnessFlowSurfaceRunMode[]
  routeOrMethod: string
  evidenceRefs: string[]
} {
  return {
    resultKind,
    captureModes: ["internal-fixture", "provider-backed"],
    routeOrMethod,
    evidenceRefs: ["HarnessTurnResult", "runtimeTrace.events", "internal-fixture-provider", "live-provider-parity"],
  }
}

function snapshotSurfaceDescriptor(
  resultKind: HarnessFlowSurfaceResultKind,
  routeOrMethod: string,
): {
  resultKind: HarnessFlowSurfaceResultKind
  captureModes: HarnessFlowSurfaceRunMode[]
  routeOrMethod: string
  evidenceRefs: string[]
} {
  return {
    resultKind,
    captureModes: ["snapshot"],
    routeOrMethod,
    evidenceRefs: ["surface.snapshot", "surface.render", "surface.write"],
  }
}

function serverRunRoute(product: AssemblyContractProduct): string {
  if (product === "nanobot") return "POST /v1/agent"
  if (product === "hermes-agent") return "POST /v1/chat/completions | POST /v1/runs"
  return "POST /v1/run"
}

function stageIDsForTurnPipelineAtoms(): CanonicalFlowStageID[] {
  return uniqueStrings(turnPipelineAtoms.flatMap((atom) => canonicalFlowStages.filter((stage) => stageOwnsPort(stage.id, atom.id)).map((stage) => stage.id))) as CanonicalFlowStageID[]
}

function stageIDsForAssembledEvents(events: string[]): CanonicalFlowStageID[] {
  if (events.includes("turn.pipeline.trace")) return canonicalFlowStages.filter((stage) => assembledEventTypesForStage(stage.id).some((event) => event.startsWith("turn.pipeline.trace"))).map((stage) => stage.id)
  return canonicalFlowStages.filter((stage) => events.some((event) => eventMapsToStage(event, stage.id) || assembledEventTypesForStage(stage.id).includes(event))).map((stage) => stage.id)
}

const stageByID = new Map(canonicalFlowStages.map((stage) => [stage.id, stage]))

interface PromptFlowArtifact {
  metrics: HarnessFlowMetrics
  evidence: HarnessFlowEvidence
  metadata: Record<string, unknown>
}

type HookEventInput = EventEnvelope | string

const promptBlueprintSections = [
  "base identity",
  "rules",
  "tools",
  "resources",
  "context",
  "compaction",
  "model capability adjustments",
]

function selectedAtomIDsByPortForContract(contract: AssemblyContract): Map<string, string[]> {
  const selectedAtomIDsByPort = new Map<string, string[]>()
  for (const binding of contract.bindings) {
    selectedAtomIDsByPort.set(binding.portID, uniqueStrings([...(selectedAtomIDsByPort.get(binding.portID) ?? []), binding.providerAtomID]))
  }
  return selectedAtomIDsByPort
}

function selectedReplayEvidenceAtomIDsForStage(contract: AssemblyContract, stageID: CanonicalFlowStageID): string[] {
  return contract.atoms
    .filter((atom) =>
      atom.selected &&
      atom.scope === "product" &&
      atom.nativeEvidenceRefs.some((ref) =>
        ref.startsWith("cadence-replay:") ||
        ref.startsWith("cadence-projector:") ||
        ref.startsWith("cadence-side-effect-order:") ||
        ref.startsWith("tool-cadence-replay:") ||
        ref.startsWith("tool-result-event-stream:") ||
        ref.startsWith("tool-result-envelope-roundtrip:") ||
        ref.startsWith("tool-result-writeback-timing:") ||
        ref.startsWith("provider-stream-replay:") ||
        ref.startsWith("provider-raw-frame-timeline:") ||
        ref.startsWith("provider-raw-payload-roundtrip:") ||
        ref.startsWith("session-message-part-replay:") ||
        ref.startsWith("session-storage-roundtrip:") ||
        ref.startsWith("session-provider-metadata-roundtrip:") ||
        ref.startsWith("runtime-acceptance-replay:") ||
        ref.startsWith("runtime-acceptance-timing-boundary:") ||
        ref.startsWith("runtime-acceptance-lifecycle:") ||
        ref.startsWith("runtime-acceptance-persistence-cleanup:"),
      ) &&
      atom.provides.some((portID) => stageOwnsPort(stageID, portID)),
    )
    .map((atom) => atom.id)
    .sort()
}

function metadataOverlayAtomIDsByPortForContract(contract: AssemblyContract): Map<string, string[]> {
  const providerByPort = new Map(contract.bindings.map((binding) => [binding.portID, binding.providerAtomID]))
  const overlayAtomIDsByPort = new Map<string, string[]>()
  for (const atom of contract.atoms) {
    if (!atom.selected) continue
    if (executableImplementationLevelForAtom(atom) !== "metadata-only") continue
    for (const portID of atom.provides) {
      if (providerByPort.get(portID) === atom.id) continue
      overlayAtomIDsByPort.set(portID, uniqueStrings([...(overlayAtomIDsByPort.get(portID) ?? []), atom.id]))
    }
  }
  return overlayAtomIDsByPort
}

function buildPromptBlueprintArtifact(contract: AssemblyContract, selectedAtomIDsByPort = selectedAtomIDsByPortForContract(contract)): PromptFlowArtifact | undefined {
  const atomByID = new Map(contract.atoms.map((atom) => [atom.id, atom]))
  const promptPorts = contract.ports.filter((port) => stageOwnsPort("prompt.assemble", port.id))
  const promptPortIDs = promptPorts.map((port) => port.id).sort()
  const promptAtomIDs = uniqueStrings(promptPortIDs.flatMap((portID) => selectedAtomIDsByPort.get(portID) ?? []))
  if (promptPortIDs.length === 0 && promptAtomIDs.length === 0) return undefined
  const promptAtoms = promptAtomIDs.map((atomID) => atomByID.get(atomID)).filter((atom): atom is AssemblyContract["atoms"][number] => Boolean(atom))
  const promptAtom = promptAtoms.find((atom) => atom.provides.includes("prompt.system-builder")) ??
    promptAtoms.find((atom) => atom.id.includes(".prompt.") && atom.kind.includes("builder")) ??
    promptAtoms.find((atom) => atom.id.includes("prompt"))
  const resourceAtomIDs = promptAtomIDs.filter((atomID) => atomID.includes("resource") || atomID.includes("prompt.resource"))
  const resourceKeys = uniqueStrings([
    ...promptAtoms.flatMap((atom) => atom.resources.map(resourceRefKey)),
    ...promptPorts.flatMap((port) => port.resources.map(resourceRefKey)),
    ...resourceAtomIDs.map((atomID) => `atom:${atomID}`),
  ])
  const sourceFor = (portID: string, fallback: string): string => {
    const atomIDs = selectedAtomIDsByPort.get(portID) ?? []
    return atomIDs.length > 0 ? atomIDs.join("+") : fallback
  }
  const sectionSources: Record<string, string> = {
    "base identity": promptAtom?.id ?? sourceFor("prompt.system-builder", "product-profile"),
    rules: sourceFor("turn.prompt-assembler", "assembly-contract"),
    tools: sourceFor("prompt.tool-renderer", "tool-registry"),
    resources: uniqueStrings([sourceFor("resource.discovery", "resource-discovery"), sourceFor("prompt.resource-loader", "prompt-resource-loader")]).join("+"),
    context: sourceFor("turn.context-builder", "session-context"),
    compaction: sourceFor("prompt.compaction-adapter", "compaction-adapter"),
    "model capability adjustments": sourceFor("prompt.model-capability-adapter", "model-capability-adapter"),
  }
  const identityStatus = promptIdentityStatusForArtifact(contract.product, promptAtom)
  const nativeEvidenceRefs = uniqueStrings(promptAtoms.flatMap((atom) => atom.nativeEvidenceRefs))
  const fixtureIDs = uniqueStrings(promptAtoms.flatMap((atom) => atom.fixtureIDs))
  const knownLossiness = uniqueStrings(promptAtoms.flatMap((atom) => atom.knownLossiness))
  const parityCoverage = promptAtom?.parityCoverage ?? "none"
  const promptFingerprint = hashStable({
    contractFingerprint: contract.fingerprints.contract,
    promptAtomID: promptAtom?.id ?? "missing",
    promptAtomIDs,
    promptPortIDs,
    resourceKeys,
    sections: promptBlueprintSections,
    sectionSources,
  })
  const tokenEstimate = 384 + promptBlueprintSections.length * 32 + promptAtomIDs.length * 12 + resourceKeys.length * 24
  const metadata: Record<string, unknown> = {
    stageID: "prompt.assemble",
    artifactKind: "blueprint",
    promptFingerprint,
    sections: promptBlueprintSections,
    sectionSources,
    resourceCount: resourceKeys.length,
    tokenEstimate,
    identityStatus,
    sanitizedPreview: `redacted blueprint prompt artifact ${promptFingerprint}`,
    sourceAtomIDs: promptAtomIDs,
    sourcePortIDs: promptPortIDs,
    artifactPath: "inline:assembly-contract",
    generatedAt: contract.generatedAt,
    captureMode: "blueprint",
    nativeEvidenceRefs,
    fixtureIDs,
    parityCoverage,
    knownLossiness,
  }
  if (promptAtom) metadata.promptAtomID = promptAtom.id
  metadata.artifactHash = hashStable(metadata)
  const metrics: HarnessFlowMetrics = {
    count: promptBlueprintSections.length,
    sectionCount: promptBlueprintSections.length,
    resourceCount: resourceKeys.length,
    tokenEstimate,
    promptFingerprint,
    identityStatus,
    nativeEvidenceRefs,
    fixtureIDs,
    parityCoverage,
    knownLossiness,
  }
  if (promptAtom) metrics.promptAtomID = promptAtom.id
  return {
    metrics,
    evidence: {
      id: `prompt.blueprint.${promptFingerprint}`,
      source: "assembled",
      kind: "prompt",
      label: "prompt assembly blueprint artifact",
      refs: uniqueStrings([promptFingerprint, ...promptBlueprintSections, ...nativeEvidenceRefs, ...fixtureIDs]),
      lossiness: "semantic",
      metadata,
    },
    metadata,
  }
}

function promptIdentityStatusForArtifact(
  product: AssemblyContractProduct,
  atom: AssemblyContract["atoms"][number] | undefined,
): HarnessFlowPromptIdentityStatus {
  if (!atom) return "missing-evidence"
  const sourceText = [atom.id, atom.kind, atom.scope, atom.productScope, atom.sourcePackage, atom.selectionReason].join(" ")
  if (/(?:compatible Helix|Helix-compatible|You are .*Helix|Helix runtime)/i.test(sourceText)) return "placeholder-risk"
  const reason = atom.selectionReason.toLowerCase()
  if (hasPromptIdentityNativeProof(atom)) return "native"
  if (atom.id.includes(".native-like")) return "native-like"
  if (reason.includes("product identity snapshot") && reason.includes("partial sync")) return "partial-sync"
  if (product === "opencode" && atom.id.startsWith("opencode.prompt.") && atom.implementationKind === "bridge") return "partial-sync"
  if (atom.implementationKind === "metadata-only" || atom.implementationKind === "preview") return "missing-evidence"
  return "compatible"
}

function hasPromptIdentityNativeProof(atom: AssemblyContract["atoms"][number]): boolean {
  const reason = atom.selectionReason.toLowerCase()
  return (
    atom.implementationKind === "factory" &&
    atom.parityCoverage === "native" &&
    atom.nativeEvidenceRefs.length > 0 &&
    atom.fixtureIDs.length > 0 &&
    atom.knownLossiness.length === 0 &&
    (reason.includes("native parity complete") || reason.includes("upstream native implementation"))
  )
}

function resourceRefKey(resource: unknown): string {
  const record = objectRecord(resource)
  const id = stringValue(record.id) ?? stringValue(record.uri) ?? stringValue(record.path) ?? stringValue(record.name)
  return id ?? stableStringify(resource)
}

function promptIdentityStatusValue(value: unknown): HarnessFlowPromptIdentityStatus | undefined {
  if (
    value === "native" ||
    value === "native-like" ||
    value === "compatible" ||
    value === "placeholder-risk" ||
    value === "partial-sync" ||
    value === "missing-evidence"
  ) {
    return value
  }
  return undefined
}

function implementationLevelsForStageAtoms(stageAtoms: Array<AssemblyContract["atoms"][number]>): ExecutableImplementationLevel[] {
  return uniqueStrings(stageAtoms.map((atom) => executableImplementationLevelForAtom(atom))) as ExecutableImplementationLevel[]
}

function moduleConfirmationMetricsForStageAtoms(
  stageAtoms: Array<AssemblyContract["atoms"][number]>,
  audit: CurrentModulePlaceholderAudit | null | undefined,
): Pick<HarnessFlowMetrics, "moduleConfirmationStatuses" | "moduleConfirmationSourceFiles" | "moduleConfirmationSourceOwners" | "moduleConfirmationFixtureTargets" | "moduleConfirmationSummaries"> {
  if (!audit) return {}
  const atomIDs = new Set(stageAtoms.map((atom) => atom.id))
  if (atomIDs.size === 0) return {}
  const items = audit.items.filter((item) => item.atomID && atomIDs.has(item.atomID))
  if (items.length === 0) return {}
  const sourceSummaryByFile = new Map(audit.currentSourceFileSummaries.map((summary) => [summary.currentSourceFile, summary]))
  const sourceFiles = uniqueStrings(items.flatMap((item) => item.currentSourceFiles))
  const sourceSummaries = sourceFiles.map((file) => sourceSummaryByFile.get(file)).filter((summary): summary is NonNullable<typeof summary> => Boolean(summary))
  const statuses = uniqueStrings(sourceSummaries.map((summary) => summary.moduleConfirmationStatus)) as CurrentModuleSourceModuleConfirmationStatus[]
  if (statuses.length === 0) return {}
  const sourceOwners = uniqueStrings(sourceSummaries.map((summary) => summary.sourceOwnerPackagePath))
  const fixtureTargets = uniqueStrings([
    ...items.flatMap((item) => item.pinnedUpstreamDivergences.map((divergence) => divergence.fixtureDiffTarget)),
    ...sourceSummaries.flatMap((summary) => Object.keys(summary.byFixtureDiffTarget)),
  ])
  const summaries = uniqueStrings(sourceSummaries.map((summary) => summary.moduleConfirmationSummary)).slice(0, 6)
  return {
    moduleConfirmationStatuses: statuses,
    moduleConfirmationSourceFiles: sourceFiles,
    moduleConfirmationSourceOwners: sourceOwners,
    moduleConfirmationFixtureTargets: fixtureTargets,
    moduleConfirmationSummaries: summaries,
  }
}

function bridgeLayerSummaryForStageAtoms(stageAtoms: Array<AssemblyContract["atoms"][number]>): HarnessFlowBridgeLayerSummary[] {
  const buckets = new Map<string, HarnessFlowBridgeLayerSummary>()
  for (const atom of stageAtoms) {
    const implementationLevel = executableImplementationLevelForAtom(atom)
    if (!isBridgeLayerImplementationLevel(implementationLevel)) continue
    const key = `${atom.plane}:${implementationLevel}`
    const existing = buckets.get(key)
    if (existing) {
      existing.atomIDs.push(atom.id)
      continue
    }
    buckets.set(key, {
      layer: atom.plane,
      implementationLevel,
      atomIDs: [atom.id],
    })
  }
  return [...buckets.values()]
    .map((summary) => ({ ...summary, atomIDs: uniqueStrings(summary.atomIDs) }))
    .sort((left, right) => `${left.layer}:${left.implementationLevel}`.localeCompare(`${right.layer}:${right.implementationLevel}`))
}

function moduleClaimsForStageAtoms(
  stageAtoms: Array<AssemblyContract["atoms"][number]>,
  stagePortIDs: string[],
  presetProduct: AssemblyContractProduct,
  compositionClaim?: BuildAssembledFlowBlueprintOptions["compositionClaim"],
): HarnessFlowModuleClaim[] {
  const target = parityTargetForProduct(presetProduct)
  const compositionBlocker = compositionClaim === "custom-composition" ? "custom-draft-composition" : compositionClaim === "experimental-hybrid" ? "experimental-hybrid-composition" : ""
  return stageAtoms
    .map((atom): HarnessFlowModuleClaim => {
      const sourceProduct = productFamilyForAtom(atom.id)
      const implementationLevel = executableImplementationLevelForAtom(atom)
      const portIDs = atom.provides.filter((portID) => stagePortIDs.includes(portID))
      const nativeProof = Boolean(
        target &&
          sourceProduct === target.product &&
          implementationLevel === "native" &&
          atom.parityCoverage === "native" &&
          atom.nativeEvidenceRefs.length > 0 &&
          atom.fixtureIDs.length > 0 &&
          atom.knownLossiness.length === 0,
      )
      const parityTargetSatisfied = Boolean(target && nativeProof && !compositionBlocker)
      const blockers = uniqueStrings([
        ...(compositionBlocker ? [compositionBlocker] : []),
        ...(!target ? ["no-parity-target"] : []),
        ...(target && sourceProduct !== target.product ? ["source-product-mismatch"] : []),
        ...(implementationLevel !== "native" ? [`module-claim-${implementationLevel}`] : []),
        ...(!nativeProof && target ? ["native-parity-not-proven"] : []),
        ...(implementationLevel === "common-shared" ? ["module-claim-common-shared"] : []),
        ...atom.knownLossiness,
      ])
      const parityCompatible: HarnessFlowParityCompatibility = !target
        ? "not-targeted"
        : parityTargetSatisfied
          ? "satisfied"
          : implementationLevel === "metadata-only" || implementationLevel === "preview-shell"
            ? "blocked"
            : "partial"
      return {
        atomID: atom.id,
        portIDs: portIDs.length > 0 ? portIDs : atom.provides,
        sourceProduct,
        sourceScope: atom.scope,
        implementationLevel,
        ...(target ? { parityTargetProduct: target.product, parityTargetRef: target.ref } : {}),
        parityCompatible,
        parityTargetSatisfied,
        evidenceRefs: atom.nativeEvidenceRefs,
        fixtureIDs: atom.fixtureIDs,
        knownLossiness: atom.knownLossiness,
        blockers,
        summary: flowModuleClaimSummary(atom.id, implementationLevel, sourceProduct, target?.ref, parityCompatible, blockers),
      }
    })
    .sort((left, right) => left.atomID.localeCompare(right.atomID))
}

function stageParityBlockingModuleClaims(moduleClaims: HarnessFlowModuleClaim[]): HarnessFlowModuleClaim[] {
  return moduleClaims.filter((claim) => claim.implementationLevel !== "metadata-only")
}

function flowModuleClaimSummary(
  atomID: string,
  implementationLevel: ExecutableImplementationLevel,
  sourceProduct: HarnessFlowModuleClaim["sourceProduct"],
  targetRef: string | undefined,
  parityCompatible: HarnessFlowParityCompatibility,
  blockers: string[],
): string {
  if (!targetRef) return `${atomID} is ${implementationLevel} from ${sourceProduct}; no upstream parity target is attached to this flow graph.`
  if (parityCompatible === "satisfied") return `${atomID} satisfies ${targetRef} with native proof.`
  const blockerText = blockers.slice(0, 4).join(", ") || parityCompatible
  return `${atomID} is ${implementationLevel} from ${sourceProduct}; it does not satisfy ${targetRef} yet (${blockerText}).`
}

function parityTargetForProduct(product: AssemblyContractProduct): { product: AssemblyContractProduct; ref: string } | undefined {
  if (product === "opencode") return { product, ref: "anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" }
  if (product === "pi-mono") return { product, ref: "earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da" }
  if (product === "opencode-pi-hybrid") return { product, ref: "anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab + earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da" }
  if (product === "nanobot") return { product, ref: "HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7" }
  if (product === "hermes-agent") return { product, ref: "NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf" }
  return undefined
}

function productFamilyForAtom(atomID: string): HarnessFlowModuleClaim["sourceProduct"] {
  if (atomID.startsWith("opencode-pi.")) return "opencode-pi-hybrid"
  if (atomID.startsWith("opencode.")) return "opencode"
  if (atomID.startsWith("pi.") || atomID.startsWith("pi-mono.")) return "pi-mono"
  if (atomID.startsWith("nanobot.")) return "nanobot"
  if (atomID.startsWith("hermes.") || atomID.startsWith("hermes-agent.")) return "hermes-agent"
  if (atomID.startsWith("common.") || !atomID.includes(".")) return "common"
  return "common"
}

function isBridgeLayerImplementationLevel(level: ExecutableImplementationLevel): boolean {
  return level !== "native" && level !== "common-shared"
}

function metadataOverlayEvidenceForContract(contract: AssemblyContract): HarnessFlowEvidence[] {
  const overlaysByPort = metadataOverlayAtomIDsByPortForContract(contract)
  return [...overlaysByPort.entries()]
    .map(([portID, atomIDs]): HarnessFlowEvidence => {
      const edgeKinds = uniqueStrings(atomIDs.map(metadataOverlayEdgeKind))
      const metadata: Record<string, unknown> = {
        edgeKind: edgeKinds.length === 1 ? edgeKinds[0] : "annotates",
        overlayAtomIDs: atomIDs,
        executableRequired: executablePortRuleFor(portID).executableRequired,
        implementationLevel: "metadata-only",
        artifactKind: "metadata-overlay",
      }
      metadata.artifactHash = hashStable(metadata)
      return {
        id: `metadata-overlay.${portID}`,
        source: "assembled",
        kind: "binding",
        label: `${portID} metadata overlay`,
        refs: [portID, ...atomIDs],
        lossiness: "semantic",
        metadata,
      }
    })
    .sort((left, right) => left.id.localeCompare(right.id))
}

function metadataOverlayEdgeKind(atomID: string): string {
  const id = atomID.toLowerCase()
  if (id.includes("aliases")) return "aliases"
  if (id.includes("defaults")) return "defaults-for"
  if (id.includes("labels")) return "labels"
  return "annotates"
}

export function buildAssembledFlowBlueprint(contract: AssemblyContract, generatedAt = new Date().toISOString(), options: BuildAssembledFlowBlueprintOptions = {}): HarnessFlowGraph {
  const bindingsByPort = new Map(contract.bindings.map((binding) => [binding.portID, binding]))
  const selectedAtomIDsByPort = selectedAtomIDsByPortForContract(contract)
  const atomByID = new Map(contract.atoms.map((atom) => [atom.id, atom]))
  const promptArtifact = buildPromptBlueprintArtifact(contract, selectedAtomIDsByPort)

  const nodes = canonicalFlowStages.map((stage): HarnessFlowNode => {
    const ports = contract.ports.filter((port) => stageOwnsPort(stage.id, port.id))
    const portIDs = ports.map((port) => port.id).sort()
    const atomIDs = uniqueStrings([
      ...portIDs.flatMap((portID) => selectedAtomIDsByPort.get(portID) ?? []),
      ...selectedReplayEvidenceAtomIDsForStage(contract, stage.id),
    ])
    const stageAtoms = atomIDs.map((atomID) => atomByID.get(atomID)).filter((atom): atom is AssemblyContract["atoms"][number] => Boolean(atom))
    const bindingIDs = portIDs.filter((portID) => bindingsByPort.has(portID)).sort()
    const metricRecord: HarnessFlowMetrics = {}
    const nativeEvidenceRefs = uniqueStrings(stageAtoms.flatMap((atom) => atom.nativeEvidenceRefs))
    const fixtureIDs = uniqueStrings(stageAtoms.flatMap((atom) => atom.fixtureIDs))
    const knownLossiness = uniqueStrings(stageAtoms.flatMap((atom) => atom.knownLossiness))
    const parityCoverage = uniqueStrings(stageAtoms.map((atom) => atom.parityCoverage).filter(Boolean))
    const implementationLevels = implementationLevelsForStageAtoms(stageAtoms)
    const bridgeLayers = bridgeLayerSummaryForStageAtoms(stageAtoms)
    const moduleClaims = moduleClaimsForStageAtoms(stageAtoms, portIDs, contract.product, options.compositionClaim)
    const moduleConfirmationMetrics = moduleConfirmationMetricsForStageAtoms(stageAtoms, options.currentModuleAudit)
    if (implementationLevels.length > 0) metricRecord.implementationLevels = implementationLevels
    if (bridgeLayers.length > 0) metricRecord.bridgeLayers = bridgeLayers
    if (moduleClaims.length > 0) {
      const parityTargetRefs = uniqueStrings(moduleClaims.flatMap((claim) => (claim.parityTargetRef ? [claim.parityTargetRef] : [])))
      const parityBlockingClaims = stageParityBlockingModuleClaims(moduleClaims)
      const parityBlockerSourceClaims = parityBlockingClaims.length > 0 ? parityBlockingClaims : moduleClaims
      metricRecord.moduleClaims = moduleClaims
      metricRecord.parityTargetSatisfied = parityTargetRefs.length > 0 && parityBlockingClaims.length > 0 && parityBlockingClaims.every((claim) => claim.parityTargetSatisfied)
      if (parityTargetRefs.length > 0) metricRecord.parityTargetRefs = parityTargetRefs
      metricRecord.parityTargetBlockers = metricRecord.parityTargetSatisfied ? [] : uniqueStrings(parityBlockerSourceClaims.flatMap((claim) => claim.blockers))
    }
    Object.assign(metricRecord, moduleConfirmationMetrics)
    if (nativeEvidenceRefs.length > 0) metricRecord.nativeEvidenceRefs = nativeEvidenceRefs
    if (fixtureIDs.length > 0) metricRecord.fixtureIDs = fixtureIDs
    if (knownLossiness.length > 0) metricRecord.knownLossiness = knownLossiness
    const singleParityCoverage = parityCoverage.length === 1 ? parityCoverage[0] : undefined
    if (singleParityCoverage) metricRecord.parityCoverage = singleParityCoverage as NonNullable<HarnessFlowMetrics["parityCoverage"]>
    if (stage.id === "surface.input" || stage.id === "surface.output") metricRecord.count = contract.surfaces.length
    if (stage.id === "provider.request") metricRecord.requestCount = 0
    if (stage.id === "tool.plan") metricRecord.toolCount = atomIDs.filter((id) => id.includes("tool")).length
    if (stage.id === "prompt.assemble" && promptArtifact) Object.assign(metricRecord, promptArtifact.metrics)
    return {
      id: stage.id,
      label: stage.label,
      lane: stage.lane,
      order: stage.order,
      plane: stage.plane,
      inputSummary: stage.inputSummary,
      outputSummary: stage.outputSummary,
      assembledPortIDs: portIDs,
      assembledAtomIDs: atomIDs,
      bindingIDs,
      originalEventTypes: [],
      originalStorageRefs: [],
      originalEvidenceRefs: [],
      observability: {
        visibility: atomIDs.length > 0 || portIDs.length > 0 ? "semantic" : "none",
        lossiness: atomIDs.length > 0 || portIDs.length > 0 ? "lossless" : "inferred",
        confidence: atomIDs.length > 0 || portIDs.length > 0 ? "exact" : "inferred",
        evidence: atomIDs.length > 0 || portIDs.length > 0 ? "assembly-contract" : "canonical-stage",
      },
      metrics: metricRecord,
      status: atomIDs.length > 0 || portIDs.length > 0 ? "matched" : "inferred",
    }
  })
  const evidence: HarnessFlowEvidence[] = [
    {
      id: `contract.${contract.product}.${contract.fingerprints.contract}`,
      source: "assembled",
      kind: "contract",
      label: `${contract.product} assembly contract`,
      refs: [contract.recipeID, contract.fingerprints.contract],
      lossiness: "lossless",
      metadata: {
        atoms: contract.atoms.filter((atom) => atom.selected).length,
        ports: contract.ports.length,
        bindings: contract.bindings.length,
        surfaces: contract.surfaces.length,
      },
    },
    ...contract.bindings.map((binding): HarnessFlowEvidence => ({
      id: `binding.${binding.portID}`,
      source: "assembled",
      kind: "binding",
      label: `${binding.portID} -> ${binding.providerAtomID}`,
      refs: [binding.portID, binding.providerAtomID],
      lossiness: "lossless",
      metadata: {
        consumerAtomID: binding.consumerAtomID,
        source: binding.bindingSource,
        edgeKind: "provides-executable",
        executableRequired: executablePortRuleFor(binding.portID).executableRequired,
        implementationLevel: executableImplementationLevelForAtom(atomByID.get(binding.providerAtomID)),
      },
    })),
    ...metadataOverlayEvidenceForContract(contract),
    ...(promptArtifact ? [promptArtifact.evidence] : []),
  ]

  return finalizeFlowGraph({
    product: contract.product,
    source: "assembled",
    mode: "blueprint",
    generatedAt,
    recipeID: contract.recipeID,
    contractFingerprint: contract.fingerprints.contract,
    nodes,
    edges: buildCanonicalEdges("assembled", [], contract.product),
    evidence,
  })
}

export function buildAssembledFlowTrace(input: {
  product: AssemblyContractProduct
  events: EventEnvelope[]
  contract?: AssemblyContract
  currentModuleAudit?: CurrentModulePlaceholderAudit | null
  generatedAt?: string
  taskID?: string
  run?: HarnessFlowRunSummaryInput
}): HarnessFlowGraph {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const blueprint = input.contract
    ? buildAssembledFlowBlueprint(input.contract, generatedAt, { currentModuleAudit: input.currentModuleAudit })
    : emptyGraph({ product: input.product, source: "assembled", mode: "trace", generatedAt })
  const eventTypes = input.events.map((event) => String(event.type))
  const nodes = blueprint.nodes.map((node): HarnessFlowNode => {
    const relevant = input.events.filter((event) => eventEnvelopeMapsToStage(event, node.id))
    const metrics = metricsFromEvents(node.id, relevant)
    const runMetrics = runMetricsForStage(node.id, input.run)
    const observed = relevant.length > 0
    return {
      ...node,
      originalEventTypes: [],
      observability: observed
        ? { visibility: "semantic", lossiness: "lossless", confidence: "exact", evidence: "event-envelope" }
        : node.observability,
      metrics: { ...node.metrics, ...metrics, ...runMetrics, ...(observed ? { eventCount: relevant.length } : {}) },
      status: observed ? "matched" : node.status,
    }
  })
  const evidence: HarnessFlowEvidence[] = [
    ...blueprint.evidence,
    {
      id: `events.${hashStable(eventTypes)}`,
      source: "assembled",
      kind: "event",
      label: "assembled event timeline",
      refs: eventTypes,
      lossiness: "lossless",
      metadata: { events: input.events.length, uniqueEventTypes: uniqueStrings(eventTypes).length },
    },
    ...promptEvidenceFromEvents(input.events),
  ]
  return finalizeFlowGraph({
    ...blueprint,
    mode: "trace",
    generatedAt,
    ...(input.taskID ? { taskID: input.taskID } : {}),
    nodes,
    edges: buildCanonicalEdges("assembled", input.events, input.product),
    evidence,
  })
}

export function buildAssembledFlowRun(input: BuildAssembledFlowRunInput): HarnessFlowRun {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const runID = input.runID ?? `flow-run-${hashStable({ product: input.product, taskID: input.taskID, generatedAt, prompt: input.prompt ?? "" })}`
  const promptFingerprint = hashStable({ prompt: input.prompt ?? "", taskID: input.taskID ?? "ad-hoc" })
  const promptArtifact = input.contract ? buildPromptBlueprintArtifact(input.contract)?.metadata : undefined
  const retryCount = Math.max(0, input.retryCount ?? 0)
  const summary: Required<HarnessFlowRunSummaryInput> = {
    finish: input.finish ?? "ok",
    steps: input.steps ?? 1,
    providerRequestCount: input.providerRequestCount ?? Math.max(1, input.steps ?? 1, retryCount + 1),
    toolSequence: input.toolSequence ?? [],
    batchSignature: input.batchSignature ?? (input.toolSequence && input.toolSequence.length > 0 ? [input.toolSequence.join("+")] : []),
    assistantPartTypes: input.assistantPartTypes ?? ["text"],
    retryCount,
    compactionTriggered: input.compactionTriggered ?? false,
    acceptedEarly: input.acceptedEarly ?? false,
  }
  const events = buildAssembledFlowRunEvents({
    generatedAt,
    runID,
    product: input.product,
    promptFingerprint,
    ...(promptArtifact ? { promptArtifact } : {}),
    captureMode: input.captureMode ?? "fixture",
    summary,
    ...(input.taskID ? { taskID: input.taskID } : {}),
  })
  const graph = buildAssembledFlowTrace({
    product: input.product,
    events,
    ...(input.contract ? { contract: input.contract } : {}),
    ...(input.currentModuleAudit ? { currentModuleAudit: input.currentModuleAudit } : {}),
    generatedAt,
    ...(input.taskID ? { taskID: input.taskID } : {}),
    run: summary,
  })
  const fingerprint = hashStable({
    runID,
    product: input.product,
    taskID: input.taskID,
    captureMode: input.captureMode ?? "fixture",
    promptFingerprint,
    events: events.map((event) => event.type),
    graph: graph.summary.fingerprint,
  })
  return {
    schemaVersion: 1,
    generatedAt,
    runID,
    product: input.product,
    source: "assembled",
    captureMode: input.captureMode ?? "fixture",
    ...(input.taskID ? { taskID: input.taskID } : {}),
    promptFingerprint,
    redaction: {
      prompt: "fingerprint-only",
      providerRequest: "omitted",
      toolArgs: "summary-only",
    },
    events,
    graph,
    summary: {
      finish: summary.finish,
      steps: summary.steps,
      events: events.length,
      observedStages: graph.summary.observedStages,
      fingerprint,
    },
  }
}

export function mergeFlowBlueprintAndTrace(blueprint: HarnessFlowGraph, trace: HarnessFlowGraph): HarnessFlowGraph {
  const traceByID = new Map(trace.nodes.map((node) => [node.id, node]))
  return finalizeFlowGraph({
    ...blueprint,
    mode: "trace",
    generatedAt: trace.generatedAt,
    nodes: blueprint.nodes.map((node) => {
      const observed = traceByID.get(node.id)
      if (!observed) return node
      return {
        ...node,
        observability: observed.observability,
        metrics: { ...node.metrics, ...observed.metrics },
        status: observed.status,
      }
    }),
    edges: trace.edges.length > 0 ? trace.edges : blueprint.edges,
    evidence: [...blueprint.evidence, ...trace.evidence],
  })
}

export function buildOriginalFlowForProduct(
  product: HarnessProduct,
  input: { taskID?: string; scenario?: OpenCodeDifferentialScenario; generatedAt?: string } = {},
): HarnessFlowGraph {
  return buildOriginalFlowFromDifferentialTrace(originalFixtureTraceForProduct(product, input.scenario ?? scenarioForProduct(product, input.taskID)), {
    ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}),
    ...(input.taskID ? { taskID: input.taskID } : {}),
  })
}

export function buildOriginalFlowFromDifferentialTrace(
  trace: OpenCodeDifferentialTrace,
  input: { generatedAt?: string; taskID?: string } = {},
): HarnessFlowGraph {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const adapter = nativeFlowAdapterProfileForProduct(trace.product)
  const cliEvents = trace.cli.stdoutEventTypes.map(normalizeNativeEvent)
  const storageRefs = [trace.storage.kind, ...(trace.storage.tables ?? [])]
  const evidence: HarnessFlowEvidence[] = [
    {
      id: `differential.${trace.product}.${trace.scenarioID}`,
      source: "original",
      kind: "differential",
      label: trace.sourceLabel,
      refs: [trace.scenarioID, trace.capture?.packageSpec ?? trace.provider.kind],
      lossiness: originalLossiness(trace.product),
      metadata: {
        ...nativeFlowAdapterMetadata(adapter),
        capture: trace.capture?.mode ?? "fixture",
        provider: trace.provider.kind,
        cliProtocol: trace.cli.protocol,
        storage: trace.storage.kind,
      },
    },
  ]
  const nodes = canonicalFlowStages.map((stage): HarnessFlowNode => {
    const stageEvents = cliEvents.filter((event) => nativeEventMapsToStage(event, stage.id, trace.product))
    const nodeStorageRefs = stage.id === "session.open" || stage.id === "session.user-write" || stage.id === "session.assistant-write" ? storageRefs : []
    const metrics = originalTraceMetricsForStage(stage.id, trace, stageEvents)
    const observed = stageEvents.length > 0 || nodeStorageRefs.length > 0 || Object.keys(metrics).length > 0
    const observability = originalObservabilityForStage(trace.product, stage.id, observed)
    return {
      id: stage.id,
      label: stage.label,
      lane: stage.lane,
      order: stage.order,
      plane: stage.plane,
      inputSummary: stage.inputSummary,
      outputSummary: stage.outputSummary,
      assembledPortIDs: [],
      assembledAtomIDs: [],
      bindingIDs: [],
      originalEventTypes: stageEvents,
      originalStorageRefs: nodeStorageRefs,
      originalEvidenceRefs: [`differential.${trace.product}.${trace.scenarioID}`],
      observability,
      metrics,
      status: observability.lossiness === "unobservable" ? "unobservable" : observability.lossiness === "inferred" ? "inferred" : "semantic-match",
    }
  })
  return finalizeFlowGraph({
    product: trace.product,
    source: "original",
    mode: "native",
    generatedAt,
    scenarioID: trace.scenarioID,
    ...(input.taskID ? { taskID: input.taskID } : {}),
    nodes,
    edges: buildCanonicalEdges("original", cliEvents, trace.product),
    evidence,
  })
}

export function buildOriginalFlowFromNativeCadenceFixture(fixture: ProductTaskNativeCadenceFixture, generatedAt = new Date().toISOString()): HarnessFlowGraph {
  const signature = fixture.cadenceSignature
  const evidenceID = `native-cadence.${fixture.product}.${fixture.taskID}`
  const adapter = nativeFlowAdapterProfileForProduct(fixture.product)
  const nativeEvents = fixture.nativeEvents.map(normalizeNativeEvent)
  const projectionLossDetails = nativeProjectionLossDetailsForFixture(fixture)
  const nodes = canonicalFlowStages.map((stage): HarnessFlowNode => {
    const stageEvents = nativeEvents.filter((event) => nativeEventMapsToStage(event, stage.id, fixture.product))
    const metrics = cadenceMetricsForStage(stage.id, signature)
    const observed = stageEvents.length > 0 || Object.keys(metrics).length > 0
    const observation = observationForStage(fixture, stage.id)
    const observability: HarnessFlowObservability = observation
      ? {
          visibility: flowVisibilityFromTaskVisibility(observation.visibility),
          lossiness: observation.lossiness,
          confidence: observation.lossiness === "lossless" ? "exact" : observation.lossiness === "inferred" ? "inferred" : "semantic",
          evidence: observation.evidence,
        }
      : originalObservabilityForStage(fixture.product, stage.id, observed)
    return {
      id: stage.id,
      label: stage.label,
      lane: stage.lane,
      order: stage.order,
      plane: stage.plane,
      inputSummary: stage.inputSummary,
      outputSummary: stage.outputSummary,
      assembledPortIDs: [],
      assembledAtomIDs: [],
      bindingIDs: [],
      originalEventTypes: stageEvents,
      originalStorageRefs: signature.sessionWrites,
      originalEvidenceRefs: [evidenceID],
      observability,
      metrics,
      status: observability.lossiness === "unobservable" ? "unobservable" : observability.lossiness === "inferred" ? "inferred" : "semantic-match",
    }
  })
  return finalizeFlowGraph({
    product: fixture.product,
    source: "original",
    mode: "native",
    generatedAt,
    taskID: fixture.taskID,
    nodes,
    edges: buildCanonicalEdges("original", nativeEvents, fixture.product),
    evidence: [
      {
        id: evidenceID,
        source: "original",
        kind: "native-cadence",
        label: `${fixture.product} native cadence fixture`,
        refs: [fixture.nativeVersion, fixture.taskID],
        lossiness: projectionLossDetails.length > 0 ? "semantic" : "lossless",
        metadata: {
          ...nativeFlowAdapterMetadata(adapter),
          providerRequests: fixture.providerShape.requests,
          cadenceLevel: signature.level,
          projectionLosses: projectionLossDetails.length,
          projectionLossDetails,
          fixtureGlob: adapter.fixtureGlob,
        },
      },
    ],
  })
}

export function buildOriginalFlowFromTaskParityReport(report: ProductTaskParityReport, generatedAt = new Date().toISOString()): HarnessFlowGraph {
  const signature = report.cadenceEvidence
  const evidenceID = `task-parity.${report.product}.${report.mode}.${report.taskID}`
  const runnerID = report.runner?.id ?? `${report.mode}-task-parity`
  const adapter = nativeFlowAdapterProfileForProduct(report.product)
  const events = signature.traceEvents.map(normalizeNativeEvent)
  const nodes = canonicalFlowStages.map((stage): HarnessFlowNode => {
    const stageEvents = events.filter((event) => nativeEventMapsToStage(event, stage.id, report.product))
    const metrics = cadenceMetricsForStage(stage.id, signature)
    const observed = stageEvents.length > 0 || Object.keys(metrics).length > 0
    return {
      id: stage.id,
      label: stage.label,
      lane: stage.lane,
      order: stage.order,
      plane: stage.plane,
      inputSummary: stage.inputSummary,
      outputSummary: stage.outputSummary,
      assembledPortIDs: [],
      assembledAtomIDs: [],
      bindingIDs: [],
      originalEventTypes: stageEvents,
      originalStorageRefs: signature.sessionWrites,
      originalEvidenceRefs: [evidenceID],
      observability: originalObservabilityForStage(report.product, stage.id, observed),
      metrics,
      status: observed ? "semantic-match" : "inferred",
    }
  })
  return finalizeFlowGraph({
    product: report.product,
    source: report.mode === "assembled" ? "assembled" : "original",
    mode: report.mode === "assembled" ? "trace" : "native",
    generatedAt,
    taskID: report.taskID,
    nodes,
    edges: buildCanonicalEdges(report.mode === "assembled" ? "assembled" : "original", events, report.product),
    evidence: [
      {
        id: evidenceID,
        source: report.mode === "assembled" ? "assembled" : "original",
        kind: "task-parity",
        label: `${report.product} ${report.mode} task parity report`,
        refs: [report.taskID, runnerID],
        lossiness: report.mode === "assembled" ? "lossless" : "semantic",
        metadata: {
          ...nativeFlowAdapterMetadata(adapter),
          status: report.status,
          providerRequests: signature.costShape.providerRequests,
          traceEvents: signature.traceEvents.length,
          reportMode: report.mode,
        },
      },
    ],
  })
}

export function buildOriginalFlowFromHermesVisibleTrace(report: ProductTaskParityReport, generatedAt = new Date().toISOString()): HarnessFlowGraph {
  const graph = buildOriginalFlowFromTaskParityReport(report, generatedAt)
  if (report.product !== "hermes-agent") return graph
  return finalizeFlowGraph({
    ...graph,
    nodes: graph.nodes.map((node) => {
      if (node.id === "provider.request" || node.id === "provider.stream" || node.id === "stream.project" || node.id === "surface.output") {
        return {
          ...node,
          observability: { visibility: "aggregate", lossiness: "aggregated", confidence: "semantic", evidence: "hermes-visible-cli-trace" },
          status: "semantic-match",
        }
      }
      return node
    }),
  })
}

export function compareHarnessFlows(input: { assembled: HarnessFlowGraph; original: HarnessFlowGraph; generatedAt?: string }): HarnessFlowComparison {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  if (input.assembled.product !== input.original.product) {
    throw new Error(`Cannot compare flow graphs for different products: ${input.assembled.product} vs ${input.original.product}`)
  }
  const product = input.assembled.product
  if (!isHarnessProduct(product)) throw new Error(`Native flow comparison requires a product with native evidence, received: ${product}`)
  const originalByID = new Map(input.original.nodes.map((node) => [node.id, node]))
  const diffs: HarnessFlowDiff[] = []
  for (const assembledNode of input.assembled.nodes) {
    const originalNode = originalByID.get(assembledNode.id)
    if (!originalNode) {
      diffs.push(flowDiff("stage.missing-original", assembledNode.id, "original-only", "Original flow has no aligned canonical stage.", assembledNode.status, undefined, assembledNode.plane, assembledNode.assembledAtomIDs, "inferred"))
      continue
    }
    if (originalNode.observability.lossiness === "unobservable") {
      diffs.push(flowDiff("stage.unobservable", assembledNode.id, "inferred", "Original product does not expose enough evidence for this stage.", assembledNode.status, originalNode.status, "native-projector", assembledNode.assembledAtomIDs, "inferred"))
    } else if (originalNode.observability.lossiness === "inferred") {
      diffs.push(flowDiff("stage.inferred", assembledNode.id, "inferred", "Original product stage is inferred from surrounding evidence.", assembledNode.status, originalNode.status, "native-projector", assembledNode.assembledAtomIDs, "inferred"))
    }
  }
  compareMetric(input.assembled, input.original, "provider.request", "requestCount", "cadence.provider-request-count", "Provider request count differs.", diffs)
  compareMetric(input.assembled, input.original, "tool.plan", "toolCount", "cadence.tool-call-count", "Tool call count differs.", diffs)
  compareArrayMetric(input.assembled, input.original, "tool.plan", "toolSequence", "cadence.tool-sequence", "Tool sequence differs.", diffs)
  compareArrayMetric(input.assembled, input.original, "tool.batch", "batchSignature", "cadence.tool-batch", "Tool batch signature differs.", diffs)
  compareArrayMetric(input.assembled, input.original, "session.assistant-write", "partTypes", "cadence.message-part-type", "Assistant message part protocol differs.", diffs)
  compareArrayMetric(input.assembled, input.original, "provider.stream", "traceEventSequence", "cadence.streaming-delta", "Trace or streaming event sequence differs.", diffs)
  compareMetric(input.assembled, input.original, "surface.output", "finish", "cadence.final-summary", "Final finish/summary shape differs.", diffs)
  compareMetric(input.assembled, input.original, "acceptance.check", "acceptedEarly", "cadence.early-accept", "Early accept behavior differs.", diffs)

  const inferredStages = input.original.nodes.filter((node) => node.observability.lossiness === "inferred").length
  const unobservableStages = input.original.nodes.filter((node) => node.observability.lossiness === "unobservable").length
  const driftCount = diffs.filter((diff) => diff.status === "changed" || diff.status === "assembled-only" || diff.status === "original-only").length
  const summary = {
    status: driftCount > 0 ? ("semantic-drift" as const) : unobservableStages > 0 ? ("missing-evidence" as const) : ("matched" as const),
    stages: input.assembled.nodes.length,
    matchedStages: input.assembled.nodes.length - diffs.length,
    driftCount,
    inferredStages,
    unobservableStages,
    fingerprint: "",
  }
  const fingerprint = hashStable({ assembled: input.assembled.summary.fingerprint, original: input.original.summary.fingerprint, diffs: jsonSerializableValue(diffs) })
  return {
    schemaVersion: 1,
    generatedAt,
    product,
    ...(input.assembled.taskID || input.original.taskID ? { taskID: input.assembled.taskID ?? input.original.taskID } : {}),
    assembled: input.assembled,
    original: input.original,
    diffs,
    summary: { ...summary, fingerprint },
  }
}

export function buildHarnessFlowComparison(input: { product: HarnessProduct; taskID?: string; contract?: AssemblyContract; generatedAt?: string; currentModuleAudit?: CurrentModulePlaceholderAudit | null }): HarnessFlowComparison {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const contract = input.contract ?? buildAssemblyContract({ product: input.product })
  const assembled = buildAssembledFlowBlueprint(contract, generatedAt, input.currentModuleAudit === undefined ? {} : { currentModuleAudit: input.currentModuleAudit })
  const original = buildOriginalFlowForProduct(input.product, { generatedAt, ...(input.taskID ? { taskID: input.taskID } : {}) })
  return compareHarnessFlows({ assembled, original, generatedAt })
}

export function verifyHarnessFlowGraph(graph: HarnessFlowGraph): HarnessFlowVerification {
  const issues: HarnessFlowVerification["issues"] = []
  if (graph.schemaVersion !== 1) issues.push({ id: "flow.schema-version", message: "Flow graph must use schemaVersion 1." })
  const nodeIDs = new Set(graph.nodes.map((node) => node.id))
  for (const stage of canonicalFlowStages) {
    if (!nodeIDs.has(stage.id)) issues.push({ id: `flow.stage.${stage.id}`, message: `Missing canonical flow stage ${stage.id}.` })
  }
  for (const edge of graph.edges) {
    if (!nodeIDs.has(edge.from)) issues.push({ id: `flow.edge.${edge.id}.from`, message: `Edge ${edge.id} has unknown from stage ${edge.from}.` })
    if (!nodeIDs.has(edge.to)) issues.push({ id: `flow.edge.${edge.id}.to`, message: `Edge ${edge.id} has unknown to stage ${edge.to}.` })
    const expectedPayloadFingerprint = hashStable({ from: edge.from, to: edge.to, hooks: edge.hookPoints.map((hook) => hook.event) })
    if (edge.payloadFingerprint !== expectedPayloadFingerprint) {
      issues.push({ id: `flow.edge.${edge.id}.payload-fingerprint`, message: `Edge ${edge.id} payload fingerprint does not match its boundary and hook events.` })
    }
  }
  if (!graph.summary.fingerprint) issues.push({ id: "flow.fingerprint", message: "Flow graph summary must include a fingerprint." })
  else if (graph.summary.fingerprint !== expectedFlowGraphFingerprint(graph)) {
    issues.push({ id: "flow.fingerprint.mismatch", message: "Flow graph summary fingerprint does not match graph content." })
  }
  issues.push(...flowPromptIdentityIssues(graph))
  issues.push(...flowExecutableBindingIssues(graph))
  issues.push(...flowEvidenceIntegrityIssues(graph))
  issues.push(...flowRedactionIssues(graph))
  return { ok: issues.length === 0, issues, summary: { graphs: 1, comparisons: 0, stages: graph.nodes.length } }
}

export function verifyHarnessFlowArtifact(artifact: unknown): HarnessFlowVerification {
  const record = objectRecord(artifact)
  if (isFlowGraph(record)) return verifyHarnessFlowGraph(record)
  if (isFlowRun(record)) return verifyHarnessFlowRun(record)
  if (isFlowComparison(record)) {
    const assembled = verifyHarnessFlowGraph(record.assembled)
    const original = verifyHarnessFlowGraph(record.original)
    const issues = [...assembled.issues, ...original.issues, ...flowRedactionIssues(record)]
    if (record.schemaVersion !== 1) issues.push({ id: "flow-comparison.schema-version", message: "Flow comparison must use schemaVersion 1." })
    if (!record.summary.fingerprint) issues.push({ id: "flow-comparison.fingerprint", message: "Flow comparison summary must include a fingerprint." })
    else if (record.summary.fingerprint !== expectedFlowComparisonFingerprint(record)) {
      issues.push({ id: "flow-comparison.fingerprint.mismatch", message: "Flow comparison summary fingerprint does not match assembled/original fingerprints and diffs." })
    }
    return {
      ok: issues.length === 0,
      issues,
      summary: { graphs: 2, comparisons: 1, stages: record.assembled.nodes.length + record.original.nodes.length },
    }
  }
  return {
    ok: false,
    issues: [{ id: "flow-artifact.shape", message: "Expected a HarnessFlowGraph or HarnessFlowComparison artifact." }],
    summary: { graphs: 0, comparisons: 0, stages: 0 },
  }
}

export function verifyHarnessFlowRun(run: HarnessFlowRun): HarnessFlowVerification {
  const issues: HarnessFlowVerification["issues"] = []
  if (run.schemaVersion !== 1) issues.push({ id: "flow-run.schema-version", message: "Flow run must use schemaVersion 1." })
  if (run.source !== "assembled") issues.push({ id: "flow-run.source", message: "Flow run must be an assembled run artifact." })
  if (!run.runID) issues.push({ id: "flow-run.run-id", message: "Flow run must include runID." })
  if (!run.promptFingerprint) issues.push({ id: "flow-run.prompt-fingerprint", message: "Flow run must include a prompt fingerprint instead of raw prompt text." })
  if (run.redaction.prompt !== "fingerprint-only" || run.redaction.providerRequest !== "omitted") {
    issues.push({ id: "flow-run.redaction", message: "Flow run redaction policy must omit raw prompt/provider request payloads." })
  }
  if (!Array.isArray(run.events) || run.events.length === 0) issues.push({ id: "flow-run.events", message: "Flow run must include a non-empty event timeline." })
  const graph = verifyHarnessFlowGraph(run.graph)
  if (!run.summary.fingerprint) issues.push({ id: "flow-run.fingerprint", message: "Flow run summary must include a fingerprint." })
  else if (run.summary.fingerprint !== expectedFlowRunFingerprint(run)) {
    issues.push({ id: "flow-run.fingerprint.mismatch", message: "Flow run summary fingerprint does not match run content." })
  }
  issues.push(...flowRedactionIssues(run))
  return {
    ok: issues.length === 0 && graph.ok,
    issues: [...issues, ...graph.issues],
    summary: { graphs: 1, comparisons: 0, stages: run.graph.nodes.length },
  }
}

function expectedFlowGraphFingerprint(graph: HarnessFlowGraph): string {
  return hashStable({
    product: graph.product,
    source: graph.source,
    mode: graph.mode,
    recipeID: graph.recipeID,
    contractFingerprint: graph.contractFingerprint,
    scenarioID: graph.scenarioID,
    taskID: graph.taskID,
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      atoms: node.assembledAtomIDs,
      events: node.originalEventTypes,
      status: node.status,
      metrics: node.metrics,
      observability: node.observability,
    })),
    evidence: graph.evidence.map((item) => item.id),
  })
}

function expectedFlowComparisonFingerprint(comparison: HarnessFlowComparison): string {
  return hashStable({
    assembled: comparison.assembled.summary.fingerprint,
    original: comparison.original.summary.fingerprint,
    diffs: jsonSerializableValue(comparison.diffs),
  })
}

function expectedFlowRunFingerprint(run: HarnessFlowRun): string {
  return hashStable({
    runID: run.runID,
    product: run.product,
    taskID: run.taskID,
    captureMode: run.captureMode,
    promptFingerprint: run.promptFingerprint,
    events: run.events.map((event) => event.type),
    graph: run.graph.summary.fingerprint,
  })
}

function flowPromptIdentityIssues(graph: HarnessFlowGraph): HarnessFlowVerification["issues"] {
  if (graph.source !== "assembled") return []
  const issues: HarnessFlowVerification["issues"] = []
  const statuses = new Map<string, HarnessFlowPromptIdentityStatus>()
  const promptNode = graph.nodes.find((node) => node.id === "prompt.assemble")
  if (promptNode?.metrics.identityStatus) statuses.set("metrics", promptNode.metrics.identityStatus)
  for (const evidence of graph.evidence) {
    if (evidence.kind !== "prompt") continue
    const stageID = stringValue(evidence.metadata.stageID)
    if (stageID !== "prompt.assemble") continue
    const status = promptIdentityStatusValue(evidence.metadata.identityStatus)
    if (status) statuses.set(evidence.id, status)
  }
  for (const [source, status] of statuses) {
    if (status === "placeholder-risk") {
      issues.push({
        id: `flow.prompt.identity-placeholder.${source}`,
        message: "Assembled prompt identity still contains a Helix-compatible placeholder and cannot pass verification.",
      })
    } else if (status === "compatible" && graph.product !== "minimal") {
      issues.push({
        id: `flow.prompt.identity-compatible.${source}`,
        message: "Assembled prompt identity is only marked compatible; provide a target product original prompt snapshot or keep it blocked as unverified.",
      })
    } else if (status === "missing-evidence" && graph.product !== "minimal") {
      issues.push({
        id: `flow.prompt.identity-missing-evidence.${source}`,
        message: "Assembled prompt identity is missing evidence for the selected prompt.system-builder atom.",
      })
    }
  }
  return issues
}

function flowExecutableBindingIssues(graph: HarnessFlowGraph): HarnessFlowVerification["issues"] {
  if (graph.source !== "assembled") return []
  const issues: HarnessFlowVerification["issues"] = []
  for (const evidence of graph.evidence) {
    if (evidence.kind !== "binding") continue
    const metadata = objectRecord(evidence.metadata)
    if (stringValue(metadata.edgeKind) !== "provides-executable") continue
    const portID = evidence.refs[0]
    const atomID = evidence.refs[1]
    if (!portID || !atomID) continue
    const rule = executablePortRuleFor(portID)
    if (!rule.executableRequired) continue
    const level = stringValue(metadata.implementationLevel)
    if (level === "metadata-only") {
      issues.push({
        id: `flow.binding.${portID}.metadata-only-provider`,
        message: `Flow binding ${portID} points to metadata-only provider ${atomID}; metadata overlays must use a metadata edge kind.`,
      })
    }
    if (portID === "product.shell" && level === "preview-shell") {
      issues.push({
        id: `flow.binding.${portID}.preview-provider`,
        message: `Flow binding ${portID} points to preview-only provider ${atomID}; primary product shells must be executable.`,
      })
    }
  }
  return issues
}

function flowEvidenceIntegrityIssues(graph: HarnessFlowGraph): HarnessFlowVerification["issues"] {
  const issues: HarnessFlowVerification["issues"] = []
  const evidenceIDs = new Set<string>()
  for (const evidence of graph.evidence) {
    if (!evidence.id) issues.push({ id: "flow.evidence.id", message: "Flow evidence must include a stable id." })
    else if (evidenceIDs.has(evidence.id)) issues.push({ id: "flow.evidence.duplicate", message: `Flow evidence id ${evidence.id} is duplicated.` })
    evidenceIDs.add(evidence.id)
    if (!Array.isArray(evidence.refs) || evidence.refs.length === 0) {
      issues.push({ id: `flow.evidence.${evidence.id || "unknown"}.refs`, message: `Flow evidence ${evidence.id || "unknown"} must include at least one source ref.` })
    }
    const metadata = objectRecord(evidence.metadata)
    const artifactHash = stringValue(metadata.artifactHash)
    if (artifactHash && artifactHash !== expectedEvidenceArtifactHash(metadata)) {
      issues.push({ id: `flow.evidence.${evidence.id}.artifact-hash`, message: `Flow evidence ${evidence.id} artifactHash does not match its sanitized metadata.` })
    }
  }
  for (const node of graph.nodes) {
    for (const ref of node.originalEvidenceRefs) {
      if (!evidenceIDs.has(ref)) {
        issues.push({ id: `flow.stage.${node.id}.evidence-ref`, message: `Stage ${node.id} references missing evidence ${ref}.` })
      }
    }
  }
  return issues
}

function expectedEvidenceArtifactHash(metadata: Record<string, unknown>): string {
  const artifactKind = stringValue(metadata.artifactKind)
  const hashInput: Record<string, unknown> = { ...metadata }
  delete hashInput.artifactHash
  if (artifactKind === "trace") {
    delete hashInput.stageID
    delete hashInput.generatedAt
  }
  return hashStable(hashInput)
}

function flowRedactionIssues(value: unknown): HarnessFlowVerification["issues"] {
  const issues: HarnessFlowVerification["issues"] = []
  const forbiddenKeys = new Set([
    "apiKey",
    "api_key",
    "authorization",
    "messages",
    "prompt",
    "fullPrompt",
    "providerRequest",
    "provider_request",
    "providerBody",
    "providerPayload",
    "providerResponse",
    "provider_messages",
    "requestBody",
    "request_body",
    "rawProviderRequest",
    "rawProviderResponse",
    "rawPrompt",
    "rawMessages",
    "promptText",
    "prompt_text",
    "toolInput",
    "tool_input",
    "toolOutput",
    "tool_output",
    "toolArgs",
    "tool_args",
    "toolResult",
    "tool_result",
    "rawToolResult",
    "arguments",
    "args",
    "stdout",
    "stderr",
    "content",
  ])
  const visit = (current: unknown, path: string): void => {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (current && typeof current === "object") {
      for (const [key, inner] of Object.entries(current as Record<string, unknown>)) {
        const nextPath = path ? `${path}.${key}` : key
        if (forbiddenKeys.has(key) && path !== "redaction") {
          issues.push({ id: "flow.redaction.key", message: `Flow artifact includes forbidden raw field ${nextPath}.` })
        }
        visit(inner, nextPath)
      }
      return
    }
    if (typeof current !== "string") return
    if (/\b(?:sk|pk|ak)-[A-Za-z0-9_-]{16,}\b/.test(current) || /Bearer\s+[A-Za-z0-9._-]{16,}/i.test(current)) {
      issues.push({ id: "flow.redaction.secret", message: `Flow artifact includes credential-shaped value at ${path}.` })
    }
  }
  visit(value, "")
  return issues
}

function finalizeFlowGraph(input: Omit<HarnessFlowGraph, "schemaVersion" | "summary">): HarnessFlowGraph {
  const nodes = input.nodes
    .map((node) => ({
      ...node,
      assembledPortIDs: uniqueStrings(node.assembledPortIDs),
      assembledAtomIDs: uniqueStrings(node.assembledAtomIDs),
      bindingIDs: uniqueStrings(node.bindingIDs),
      originalEventTypes: uniqueStrings(node.originalEventTypes),
      originalStorageRefs: uniqueStrings(node.originalStorageRefs),
      originalEvidenceRefs: uniqueStrings(node.originalEvidenceRefs),
    }))
    .sort((left, right) => left.order - right.order)
  const evidence = dedupeEvidence(input.evidence)
  const driftCount = nodes.filter((node) => node.status === "drift" || node.status === "missing").length
  const summaryBase = {
    stages: nodes.length,
    edges: input.edges.length,
    observedStages: nodes.filter((node) => node.status === "matched" || node.status === "semantic-match").length,
    inferredStages: nodes.filter((node) => node.status === "inferred" || node.observability.lossiness === "inferred").length,
    unobservableStages: nodes.filter((node) => node.status === "unobservable" || node.observability.lossiness === "unobservable").length,
    driftCount,
  }
  const fingerprint = hashStable({
    product: input.product,
    source: input.source,
    mode: input.mode,
    recipeID: input.recipeID,
    contractFingerprint: input.contractFingerprint,
    scenarioID: input.scenarioID,
    taskID: input.taskID,
    nodes: nodes.map((node) => ({
      id: node.id,
      atoms: node.assembledAtomIDs,
      events: node.originalEventTypes,
      status: node.status,
      metrics: node.metrics,
      observability: node.observability,
    })),
    evidence: evidence.map((item) => item.id),
  })
  return {
    schemaVersion: 1,
    generatedAt: input.generatedAt,
    product: input.product,
    source: input.source,
    mode: input.mode,
    ...(input.recipeID ? { recipeID: input.recipeID } : {}),
    ...(input.contractFingerprint ? { contractFingerprint: input.contractFingerprint } : {}),
    ...(input.scenarioID ? { scenarioID: input.scenarioID } : {}),
    ...(input.taskID ? { taskID: input.taskID } : {}),
    nodes,
    edges: input.edges,
    evidence,
    summary: { ...summaryBase, fingerprint },
  }
}

function emptyGraph(input: { product: AssemblyContractProduct; source: HarnessFlowSource; mode: HarnessFlowGraphMode; generatedAt: string }): HarnessFlowGraph {
  return finalizeFlowGraph({
    ...input,
    nodes: canonicalFlowStages.map((stage): HarnessFlowNode => ({
      id: stage.id,
      label: stage.label,
      lane: stage.lane,
      order: stage.order,
      plane: stage.plane,
      inputSummary: stage.inputSummary,
      outputSummary: stage.outputSummary,
      assembledPortIDs: [],
      assembledAtomIDs: [],
      bindingIDs: [],
      originalEventTypes: [],
      originalStorageRefs: [],
      originalEvidenceRefs: [],
      observability: { visibility: "none", lossiness: "unobservable", confidence: "inferred", evidence: "missing" },
      metrics: {},
      status: "unobservable",
    })),
    edges: buildCanonicalEdges(input.source, [], input.product),
    evidence: [],
  })
}

function buildCanonicalEdges(source: HarnessFlowSource, events: HookEventInput[] = [], product: AssemblyContractProduct = "opencode"): HarnessFlowEdge[] {
  return canonicalFlowStages.slice(0, -1).map((stage, index) => {
    const next = canonicalFlowStages[index + 1]
    if (!next) throw new Error(`Missing canonical next stage after ${stage.id}`)
    const hookPoints = hookPointsForBoundary(stage.id, next.id, source, events, product)
    return {
      id: `${stage.id}->${next.id}`,
      from: stage.id,
      to: next.id,
      label: `${stage.label} -> ${next.label}`,
      dataKind: edgeDataKind(stage.id, next.id),
      hookPoints,
      payloadFingerprint: hashStable({ from: stage.id, to: next.id, hooks: hookPoints.map((hook) => hook.event) }),
      diffStatus: hookPoints.some((hook) => hook.observability.lossiness === "unobservable") ? "inferred" : "same",
    }
  })
}

function hookPointsForBoundary(
  from: CanonicalFlowStageID,
  to: CanonicalFlowStageID,
  source: HarnessFlowSource,
  events: HookEventInput[],
  product: AssemblyContractProduct,
): HarnessFlowHookPoint[] {
  const names = boundaryHookNames(from, to)
  return names.map((event) => {
    const matchingEvents = hookEventsForBoundary(events, event, from, to, source, product)
    const observed = matchingEvents.length
    const adapter = hookAdapterForProduct(product, source)
    const sourceRecords = source === "original"
      ? matchingEvents.map((nativeEvent, index) => ({
          order: index + 1,
          id: `${event}.native.${index + 1}`,
          name: "native event tap",
          scope: "native-fixture",
          source: nativeEvent,
          adapterKind: adapter.kind,
          adapterSource: adapter.source,
          adapterProduct: product,
        }))
      : Array.from({ length: observed }, (_, index) => ({
          order: index + 1,
          id: `${event}.source.${index + 1}`,
          name: "assembled trace collector",
          scope: "assembled-run",
          source: "harness-flow",
          adapterKind: adapter.kind,
          adapterSource: adapter.source,
          adapterProduct: product,
        }))
    const observability: HarnessFlowObservability = source === "assembled"
      ? {
          visibility: observed > 0 ? "semantic" : "none",
          lossiness: observed > 0 ? "lossless" : "inferred",
          confidence: observed > 0 ? "exact" : "inferred",
          evidence: observed > 0 ? "event-envelope" : "hook-boundary",
        }
      : {
          visibility: observed > 0 ? "aggregate" : "none",
          lossiness: observed > 0 ? "aggregated" : "unobservable",
          confidence: observed > 0 ? "semantic" : "inferred",
          evidence: observed > 0 ? "native-event-tap" : "native-hook-unobservable",
        }
    const capabilities = hookCapabilities(event)
    return {
      event,
      observerCount: source === "original" ? observed : 0,
      handlerCount: source === "assembled" ? observed : 0,
      sourceCount: observed,
      sources: sourceRecords,
      capabilities,
      canTransform: capabilities.includes("transform"),
      canBlock: capabilities.includes("block") || capabilities.includes("permission"),
      canHandle: capabilities.includes("handle"),
      observability,
    }
  })
}

function hookEventsForBoundary(
  events: HookEventInput[],
  hookEvent: string,
  from: CanonicalFlowStageID,
  to: CanonicalFlowStageID,
  source: HarnessFlowSource,
  product: AssemblyContractProduct,
): string[] {
  const nativeProduct = isHarnessProduct(product) ? product : "opencode"
  return events
    .map(hookEventType)
    .filter((event) => {
      if (event === hookEvent) return true
      if (source === "assembled") return false
      return nativeEventMapsToStage(event, to, nativeProduct) || nativeEventMapsToStage(event, from, nativeProduct)
    })
}

function hookEventType(event: HookEventInput): string {
  return normalizeNativeEvent(typeof event === "string" ? event : String(event.type))
}

function hookAdapterForProduct(
  product: AssemblyContractProduct,
  source: HarnessFlowSource,
): { kind: NonNullable<HarnessFlowHookPoint["sources"][number]["adapterKind"]>; source: string } {
  if (source === "assembled") {
    if (product === "opencode") return { kind: "opencode-plugin", source: "OpenCode plugin bridge / assembled hook host" }
    if (product === "pi-mono") return { kind: "pi-extension", source: "Pi extension bridge / assembled hook host" }
    if (product === "nanobot") return { kind: "nanobot-plugin", source: "Nanobot plugin bridge / assembled hook host" }
    if (product === "hermes-agent") return { kind: "hermes-plugin", source: "Hermes plugin bridge / assembled hook host" }
    return { kind: "assembled-hook-host", source: "Common assembled hook host" }
  }
  if (product === "opencode") return { kind: "opencode-plugin", source: "OpenCode native plugin event tap" }
  if (product === "pi-mono") return { kind: "pi-extension", source: "Pi native extension event tap" }
  if (product === "nanobot") return { kind: "nanobot-plugin", source: "Nanobot native plugin event tap" }
  if (product === "hermes-agent") return { kind: "hermes-plugin", source: "Hermes native plugin event tap" }
  return { kind: "native-event-tap", source: "Native event tap" }
}

function boundaryHookNames(from: CanonicalFlowStageID, to: CanonicalFlowStageID): string[] {
  if (from === "surface.input" && to === "input.normalize") return ["input"]
  if (to === "context.build") return ["context", "session.before_compact", "session.compact"]
  if (to === "prompt.assemble") return ["before_agent_start", "resources.discover"]
  if (to === "provider.request") return ["provider.request.before"]
  if (to === "tool.plan") return ["tool.call"]
  if (to === "tool.permission") return ["permission.ask"]
  if (to === "tool.result") return ["tool.result"]
  if (to === "session.assistant-write") return ["message.start", "message.end"]
  if (to === "surface.output") return ["agent.end", "turn.end", "session.idle"]
  return []
}

function hookCapabilities(event: string): HarnessFlowHookPoint["capabilities"] {
  if (event === "input" || event === "before_agent_start" || event === "context" || event === "provider.request.before" || event === "tool.result") return ["observe", "transform"]
  if (event === "tool.call") return ["observe", "block"]
  if (event === "permission.ask") return ["permission", "block"]
  if (event.startsWith("session.")) return ["observe", "handle"]
  return ["observe"]
}

function stageOwnsPort(stageID: CanonicalFlowStageID, portID: string): boolean {
  if (stageID === "surface.input" || stageID === "surface.output") return portID === "product.shell" || portID.startsWith("ui.") || portID === "ui.event-loop" || portID === "ui.renderer" || portID === "ui.snapshot"
  if (stageID === "input.normalize") return portID === "turn.input-normalizer" || portID === "ui.input-normalizer" || portID === "ui.command-router"
  if (stageID === "session.open") return portID.startsWith("session.") || portID.startsWith("identity.") || portID.startsWith("event.")
  if (stageID === "session.user-write") return portID === "session.writer" || portID === "session.message-store" || portID === "session.event-log"
  if (stageID === "context.build") return portID === "turn.context-builder" || portID === "session.context-selector" || portID === "session.reader" || portID === "session.compaction-records"
  if (stageID === "prompt.assemble") return portID.startsWith("prompt.") || portID === "resource.discovery" || portID === "turn.prompt-assembler"
  if (stageID === "provider.request") return portID === "turn.provider-request-builder" || portID === "provider.request-shape" || portID === "provider.model-registry" || portID === "provider.auth"
  if (stageID === "provider.stream") return portID === "turn.provider-stream-runner" || portID === "provider.stream" || portID === "provider.transport" || portID === "provider.stream-parser" || portID === "provider.event-normalizer" || portID === "provider.streaming-delta-recorder" || portID === "provider.usage-normalizer"
  if (stageID === "stream.project") return portID === "turn.stream-reducer" || portID === "provider.stream-projector" || portID === "session.message-part-projector"
  if (stageID === "tool.plan") return portID === "turn.tool-call-planner" || portID === "tool.registry" || portID === "tool.definition" || portID === "tools" || portID === "tools.schema" || portID === "tool.schema-adapter"
  if (stageID === "tool.permission") return portID === "tool.permission-policy" || portID === "resource.grant"
  if (stageID === "tool.batch") return portID === "tools.batch-scheduler"
  if (stageID === "tool.execute") return portID === "turn.tool-executor" || portID === "tool.executor" || portID === "filesystem.port" || portID === "process-runner.port" || portID === "tool.audit-log"
  if (stageID === "tool.result") return portID === "tool.result-normalizer" || portID === "tools.result-projector"
  if (stageID === "acceptance.check") return portID === "runtime.acceptance-controller" || portID === "runtime.acceptance-evidence"
  if (stageID === "loop.boundary") return portID === "agent-loop.request-boundary" || portID === "turn.stop-condition" || portID === "turn.continuation-policy" || portID === "turn.retry-policy" || portID === "turn.compaction-policy"
  if (stageID === "final.summary") return portID === "agent-loop.final-summary"
  if (stageID === "session.assistant-write") return portID === "turn.result-recorder" || portID === "session.writer" || portID === "session.projector" || portID === "session.store" || portID === "session.message-store"
  return false
}

function eventEnvelopeMapsToStage(event: EventEnvelope, stageID: CanonicalFlowStageID): boolean {
  if (String(event.type) === "turn.pipeline.trace") {
    return stringValue(objectRecord(event.payload).stageID) === stageID
  }
  return eventMapsToStage(String(event.type), stageID)
}

function eventMapsToStage(event: string, stageID: CanonicalFlowStageID): boolean {
  const normalized = normalizeNativeEvent(event)
  if (normalized === "turn.pipeline.trace") return false
  return nativeEventMapsToStage(normalized, stageID, "opencode")
}

function assembledEventTypesForStage(stageID: CanonicalFlowStageID): string[] {
  if (stageID === "surface.input") return ["input"]
  if (stageID === "input.normalize") return ["turn.pipeline.trace:input.normalize", "turn.start"]
  if (stageID === "session.open") return ["session.created", "session.start", "agent.start"]
  if (stageID === "session.user-write") return ["message.start"]
  if (stageID === "context.build") return ["turn.pipeline.trace:context.build", "context", "session.before_compact", "session.compacting", "session.compact", "session.compacted"]
  if (stageID === "prompt.assemble") return ["turn.pipeline.trace:prompt.assemble", "before_agent_start", "pre_llm_call"]
  if (stageID === "provider.request") return ["turn.pipeline.trace:provider.request", "provider.request.before"]
  if (stageID === "provider.stream") return ["turn.pipeline.trace:provider.stream", "provider.response.after", "message.update"]
  if (stageID === "stream.project") return ["turn.pipeline.trace:stream.project", "message.update"]
  if (stageID === "tool.plan") return ["turn.pipeline.trace:tool.plan", "tool.call"]
  if (stageID === "tool.permission") return ["turn.pipeline.trace:tool.permission", "permission.ask"]
  if (stageID === "tool.batch") return ["turn.pipeline.trace:tool.batch"]
  if (stageID === "tool.execute") return ["turn.pipeline.trace:tool.execute", "tool.execution_start", "tool.execution_update", "tool.execution_end"]
  if (stageID === "tool.result") return ["turn.pipeline.trace:tool.result", "tool.result"]
  if (stageID === "acceptance.check") return ["turn.pipeline.trace:acceptance.check", "acceptance.check"]
  if (stageID === "loop.boundary") return ["turn.pipeline.trace:loop.boundary", "turn.end"]
  if (stageID === "final.summary") return ["turn.pipeline.trace:final.summary", "agent.end"]
  if (stageID === "session.assistant-write") return ["turn.pipeline.trace:session.assistant-write", "message.end", "session.updated"]
  return ["session.idle"]
}

function originalEventTypesForStage(stageID: CanonicalFlowStageID, product: HarnessProduct): string[] {
  const events = [
    "session.created",
    "input",
    "message.start",
    "context",
    "pre_llm_call",
    "provider.request.before",
    "message.delta",
    "tool.call",
    "permission.ask",
    "tool.execution.start",
    "tool.result",
    "post_llm_call",
    "agent.end",
    "message.end",
    "session.updated",
    "text",
  ]
  return uniqueStrings(events.map(normalizeNativeEvent).filter((event) => nativeEventMapsToStage(event, stageID, product)))
}

function nativeEventMapsToStage(event: string, stageID: CanonicalFlowStageID, product: HarnessProduct): boolean {
  if (stageID === "surface.input") return event === "session" || event === "session.created" || event === "agent_start" || event === "agent.start"
  if (stageID === "input.normalize") return event === "input" || event === "turn_start" || event === "turn.start"
  if (stageID === "session.open") return event.startsWith("session")
  if (stageID === "session.user-write") return event === "message_start" || event === "message.start"
  if (stageID === "context.build") return event === "context" || event.includes("compact")
  if (stageID === "prompt.assemble") return event === "before_agent_start" || event === "pre_llm_call" || (product === "hermes-agent" && event === "pre-llm-call")
  if (stageID === "provider.request") return event === "provider.request.before" || event === "pre_llm_call" || event.includes("request")
  if (stageID === "provider.stream") return event.includes("delta") || event.includes("chunk") || event === "text" || event === "assistant_delta" || event === "message.update"
  if (stageID === "stream.project") return event === "text" || event === "assistant_delta" || event === "message.delta" || event === "message_update" || event === "message.update"
  if (stageID === "tool.plan") return event === "tool.call" || event === "tool_call"
  if (stageID === "tool.permission") return event === "permission.ask" || event.includes("permission")
  if (stageID === "tool.execute") return event.startsWith("tool.execution") || event.includes("tool_execution")
  if (stageID === "tool.result") return event === "tool.result" || event === "tool_result"
  if (stageID === "acceptance.check") return event.includes("accept")
  if (stageID === "loop.boundary") return event === "post_llm_call" || event === "provider.response.after" || event === "turn.end" || event === "turn_end"
  if (stageID === "final.summary") return event === "agent.end" || event === "agent_end" || event === "post_llm_call"
  if (stageID === "session.assistant-write") return event === "message.end" || event === "message_end" || event === "message" || event === "message.delta" || event === "session.updated"
  if (stageID === "surface.output") return event === "agent.end" || event === "agent_end" || event === "post_llm_call" || event === "text"
  return false
}

function originalTraceMetricsForStage(stageID: CanonicalFlowStageID, trace: OpenCodeDifferentialTrace, events: string[]): HarnessFlowMetrics {
  if (stageID === "provider.request") return { requestCount: Math.max(0, trace.steps ?? 0), eventCount: events.length }
  if (stageID === "provider.stream" || stageID === "stream.project") return { eventCount: events.length, traceEventSequence: events }
  if (stageID === "tool.plan") return { toolCount: trace.toolNames.length, toolSequence: trace.toolNames }
  if (stageID === "tool.batch") return trace.toolNames.length ? { batchSignature: [trace.toolNames.join("+")] } : {}
  if (stageID === "acceptance.check") return { acceptedEarly: events.some(isEarlyAcceptEvent) }
  if (stageID === "session.assistant-write") return { partTypes: trace.assistantPartTypes, ...(trace.finish ? { finish: trace.finish } : {}) }
  if (stageID === "surface.output") return { ...(trace.finish ? { finish: trace.finish } : {}), count: trace.transcriptRoles.length }
  return events.length > 0 ? { eventCount: events.length } : {}
}

function cadenceMetricsForStage(stageID: CanonicalFlowStageID, signature: ProductTaskCadenceSignature): HarnessFlowMetrics {
  if (stageID === "provider.request") return { requestCount: signature.costShape.providerRequests, eventCount: signature.traceEvents.length }
  if (stageID === "provider.stream" || stageID === "stream.project") return { eventCount: signature.traceEvents.length, traceEventSequence: signature.traceEvents }
  if (stageID === "tool.plan") return { toolCount: signature.costShape.toolCalls, toolSequence: signature.toolSequence.map((tool) => tool.toolName) }
  if (stageID === "tool.batch") return { batchSignature: signature.toolBatches.map((batch) => batch.join("+")) }
  if (stageID === "acceptance.check") return { acceptedEarly: signature.traceEvents.some(isEarlyAcceptEvent) }
  if (stageID === "session.assistant-write") return { partTypes: uniqueStrings(signature.assistantTurns.flatMap((turn) => turn.partTypes)) }
  if (stageID === "surface.output") return { count: signature.costShape.messageCount, finish: signature.providerRequests.flatMap((request) => (request.stopReason ? [request.stopReason] : [])).join(",") }
  return {}
}

function metricsFromEvents(stageID: CanonicalFlowStageID, events: EventEnvelope[]): HarnessFlowMetrics {
  const payloads = events.map((event) => objectRecord(event.payload))
  if (stageID === "context.build") return {
    eventCount: events.length,
    ...(events.some((event) => String(event.type).includes("compact")) ? { compactionTriggered: true } : {}),
  }
  if (stageID === "provider.request") return { requestCount: events.length, eventCount: events.length }
  if (stageID === "provider.stream") return { eventCount: payloads.reduce((count, payload) => count + numberValue(payload.eventCount), 0) || events.length, traceEventSequence: events.map((event) => String(event.type)) }
  if (stageID === "prompt.assemble") {
    const sections = uniqueStrings(payloads.flatMap((payload) => stringArray(payload.sections)))
    const tokenEstimate = payloads.reduce((sum, payload) => sum + numberValue(payload.tokenEstimate), 0)
    const resourceCount = Math.max(0, ...payloads.map((payload) => numberValue(payload.resourceCount)))
    const promptFingerprint = payloads.map((payload) => stringValue(payload.promptFingerprint)).find(Boolean)
    const promptAtomID = payloads.map((payload) => stringValue(payload.promptAtomID)).find(Boolean)
    const identityStatus = payloads.map((payload) => promptIdentityStatusValue(payload.identityStatus)).find(Boolean)
    const metrics: HarnessFlowMetrics = {
      eventCount: events.length,
      count: sections.length || events.length,
      sectionCount: sections.length,
      ...(tokenEstimate ? { tokenEstimate } : {}),
    }
    if (resourceCount > 0) metrics.resourceCount = resourceCount
    if (promptFingerprint) metrics.promptFingerprint = promptFingerprint
    if (promptAtomID) metrics.promptAtomID = promptAtomID
    if (identityStatus) metrics.identityStatus = identityStatus
    return metrics
  }
  if (stageID === "tool.plan") return { toolSequence: payloads.map((payload) => stringValue(payload.toolName)).filter((value): value is string => Boolean(value)), toolCount: events.length }
  if (stageID === "acceptance.check") return { acceptedEarly: events.some((event) => isEarlyAcceptEvent(String(event.type))), eventCount: events.length }
  if (stageID === "loop.boundary") {
    const retryCount = Math.max(0, ...payloads.map((payload) => numberValue(payload.retries)))
    return {
      eventCount: events.length,
      ...(retryCount > 0 ? { retryCount } : {}),
    }
  }
  if (stageID === "surface.output") {
    const finish = payloads.map((payload) => stringValue(payload.finish)).find(Boolean)
    return finish ? { finish } : {}
  }
  return events.length > 0 ? { eventCount: events.length } : {}
}

function runMetricsForStage(stageID: CanonicalFlowStageID, run: HarnessFlowRunSummaryInput | undefined): HarnessFlowMetrics {
  if (!run) return {}
  if (stageID === "context.build") return run.compactionTriggered ? { compactionTriggered: true } : {}
  if (stageID === "provider.request") return { requestCount: run.providerRequestCount ?? run.steps ?? 1 }
  if (stageID === "provider.stream") return { traceEventSequence: ["provider.request.before", "message.update", "provider.response.after"] }
  if (stageID === "tool.plan") return { toolCount: run.toolSequence?.length ?? 0, ...(run.toolSequence ? { toolSequence: run.toolSequence } : {}) }
  if (stageID === "tool.batch") return run.batchSignature ? { batchSignature: run.batchSignature } : {}
  if (stageID === "acceptance.check") return { acceptedEarly: run.acceptedEarly ?? false }
  if (stageID === "session.assistant-write") return {
    ...(run.assistantPartTypes ? { partTypes: uniqueStrings(run.assistantPartTypes) } : {}),
    ...(run.finish ? { finish: run.finish } : {}),
  }
  if (stageID === "loop.boundary" || stageID === "final.summary" || stageID === "surface.output") return {
    ...(run.finish ? { finish: run.finish } : {}),
    ...(run.steps !== undefined ? { count: run.steps } : {}),
    ...(run.retryCount !== undefined ? { retryCount: run.retryCount } : {}),
  }
  return {}
}

function promptEvidenceFromEvents(events: EventEnvelope[]): HarnessFlowEvidence[] {
  const promptTraceEvents = events.filter((event) => String(event.type) === "turn.pipeline.trace" && stringValue(objectRecord(event.payload).stageID) === "prompt.assemble")
  const promptEvents = promptTraceEvents.length > 0
    ? promptTraceEvents
    : events.filter((event) => String(event.type) === "before_agent_start")
  return promptEvents
    .map((event, index): HarnessFlowEvidence => {
      const payload = objectRecord(event.payload)
      const promptFingerprint = stringValue(payload.promptFingerprint) ?? hashStable({ event: event.type, timestamp: event.timestamp, index })
      const sections = stringArray(payload.sections)
      const sectionSources = objectRecord(payload.sectionSources)
      const tokenEstimate = numberValue(payload.tokenEstimate)
      const generatedAt = typeof event.timestamp === "number" && Number.isFinite(event.timestamp) ? new Date(event.timestamp).toISOString() : undefined
      const metadata: Record<string, unknown> = {
        stageID: "prompt.assemble",
        artifactKind: "trace",
        promptFingerprint,
        sections,
        sectionSources,
        tokenEstimate,
        resourceCount: numberValue(payload.resourceCount),
        sanitizedPreview: stringValue(payload.sanitizedPreview) ?? `prompt fingerprint ${promptFingerprint}`,
        captureMode: stringValue(objectRecord(event.metadata).captureMode) ?? stringValue(payload.captureMode) ?? "fixture",
      }
      const promptAtomID = stringValue(payload.promptAtomID)
      const identityStatus = stringValue(payload.identityStatus)
      const blueprintArtifactHash = stringValue(payload.blueprintArtifactHash)
      if (promptAtomID) metadata.promptAtomID = promptAtomID
      if (identityStatus) metadata.identityStatus = identityStatus
      if (blueprintArtifactHash) metadata.blueprintArtifactHash = blueprintArtifactHash
      if (generatedAt) metadata.generatedAt = generatedAt
      const traceHashInput: Record<string, unknown> = { ...metadata }
      delete traceHashInput.stageID
      delete traceHashInput.generatedAt
      metadata.artifactHash = stringValue(payload.artifactHash) ?? hashStable(traceHashInput)
      return {
        id: `prompt.${promptFingerprint}`,
        source: "assembled",
        kind: "prompt",
        label: "prompt assembly artifact",
        refs: [promptFingerprint, ...sections],
        lossiness: "lossless",
        metadata,
      }
    })
}

function promptRunPayload(input: {
  promptFingerprint: string
  promptArtifact?: Record<string, unknown>
  captureMode: HarnessFlowRunCaptureMode
  summary: Required<HarnessFlowRunSummaryInput>
}): Record<string, unknown> {
  const artifact = objectRecord(input.promptArtifact)
  const sections = stringArray(artifact.sections)
  const sectionSources = objectRecord(artifact.sectionSources)
  const tokenEstimate = numberValue(artifact.tokenEstimate) || 512 + input.summary.toolSequence.length * 48
  const payload: Record<string, unknown> = {
    promptFingerprint: input.promptFingerprint,
    sections: sections.length > 0 ? sections : promptBlueprintSections,
    sectionSources: Object.keys(sectionSources).length > 0
      ? sectionSources
      : {
          "base identity": "product-profile",
          rules: "assembly-contract",
          tools: "tool-registry",
          resources: "resource-discovery+prompt-resource-loader",
          context: "session-context",
          compaction: "compaction-adapter",
          "model capability adjustments": "model-capability-adapter",
        },
    tokenEstimate,
    resourceCount: numberValue(artifact.resourceCount),
    sanitizedPreview: `redacted prompt artifact ${input.promptFingerprint}`,
    artifactKind: "trace",
    captureMode: input.captureMode,
  }
  const promptAtomID = stringValue(artifact.promptAtomID)
  const identityStatus = stringValue(artifact.identityStatus)
  const artifactHash = stringValue(artifact.artifactHash)
  if (promptAtomID) payload.promptAtomID = promptAtomID
  if (identityStatus) payload.identityStatus = identityStatus
  if (artifactHash) payload.blueprintArtifactHash = artifactHash
  payload.artifactHash = hashStable(payload)
  return payload
}

function buildAssembledFlowRunEvents(input: {
  generatedAt: string
  runID: string
  product: AssemblyContractProduct
  promptFingerprint: string
  promptArtifact?: Record<string, unknown>
  taskID?: string
  captureMode: HarnessFlowRunCaptureMode
  summary: Required<HarnessFlowRunSummaryInput>
}): EventEnvelope[] {
  const baseTimestamp = Date.parse(input.generatedAt) || 0
  const sessionID = `session-${hashStable({ runID: input.runID, product: input.product })}`
  let offset = 0
  const next = (
    type: EventEnvelope["type"],
    payload: Record<string, unknown>,
    metadata: Record<string, unknown> = {},
  ): EventEnvelope => ({
    type,
    sessionID: sessionID as NonNullable<EventEnvelope["sessionID"]>,
    traceID: input.runID,
    timestamp: baseTimestamp + offset++,
    source: `harness-flow.${input.captureMode}`,
    payload,
    metadata: {
      product: input.product,
      captureMode: input.captureMode,
      ...(input.taskID ? { taskID: input.taskID } : {}),
      ...metadata,
    },
  })
  const promptPayload = promptRunPayload(input)
  const providerRequests = Math.max(1, input.summary.providerRequestCount)
  const retryCount = Math.min(Math.max(0, input.summary.retryCount), Math.max(0, providerRequests - 1))
  const events: EventEnvelope[] = [
    next("session.created", { sessionID, product: input.product }),
    next("input", { source: "interactive", promptFingerprint: input.promptFingerprint }),
    next("turn.start", { runID: input.runID, maxSteps: input.summary.steps }),
    next("message.start", { role: "user", promptFingerprint: input.promptFingerprint }),
    next("context", { transcriptMessages: 1, promptFingerprint: input.promptFingerprint }),
  ]
  if (input.summary.compactionTriggered) {
    events.push(
      next("turn.pipeline.trace", {
        atomID: "turn.compaction-policy",
        phase: "decision",
        step: 0,
        details: { compacting: true, reason: "context-budget" },
      }),
      next("session.before_compact", { reason: "context-budget", tokenEstimate: promptPayload.tokenEstimate }),
      next("session.compacting", { reason: "context-budget" }),
      next("session.compact", { strategy: "semantic-summary", promptFingerprint: input.promptFingerprint }),
      next("session.compacted", { compacted: true, summaryFingerprint: hashStable({ runID: input.runID, compacted: true }) }),
    )
  }
  events.push(
    next("before_agent_start", promptPayload),
  )
  for (let attempt = 0; attempt < providerRequests; attempt += 1) {
    events.push(next("provider.request.before", {
      requestFingerprint: hashStable({ runID: input.runID, promptFingerprint: input.promptFingerprint, attempt, providerRequests }),
      requestCount: providerRequests,
      attempt,
    }))
    if (attempt < retryCount) {
      const errorFingerprint = hashStable({ runID: input.runID, attempt, error: "synthetic retry" })
      events.push(
        next("turn.pipeline.trace", {
          atomID: "turn.retry-policy",
          phase: "decision",
          step: 0,
          attempt,
          details: { retrying: true, errorFingerprint },
        }),
        next("provider.response.after", {
          finish: "error",
          steps: input.summary.steps,
          attempt,
          retries: attempt,
          retrying: true,
          errorFingerprint,
        }),
      )
    }
  }
  events.push(next("message.update", { eventCount: Math.max(1, input.summary.steps), partTypes: input.summary.assistantPartTypes }))
  if (input.summary.acceptedEarly) {
    events.push(
      next("turn.pipeline.trace", {
        atomID: "runtime.acceptance-controller",
        phase: "end",
        step: 0,
        attempt: retryCount,
        details: { status: "accept", reason: "accepted-early" },
      }),
      next("runtime.accepted-early", { step: 0, reason: "accepted-early" }),
    )
  }
  for (const [index, toolName] of input.summary.toolSequence.entries()) {
    const toolCallID = `tool-${index + 1}-${hashStable({ runID: input.runID, toolName })}`
    events.push(next("tool.call", { toolName, toolCallID, inputFingerprint: hashStable({ toolName, index }) }))
    events.push(next("permission.ask", { toolName, toolCallID, decision: "allow" }))
    events.push(next("tool.execution_start", { toolName, toolCallID }))
    events.push(next("tool.execution_end", { toolName, toolCallID, status: "ok" }))
    events.push(next("tool.result", { toolName, toolCallID, resultFingerprint: hashStable({ toolName, status: "ok" }) }))
  }
  events.push(
    next("provider.response.after", { finish: input.summary.finish, steps: input.summary.steps, attempt: retryCount, retries: retryCount }),
    next("agent.end", { finish: input.summary.finish, steps: input.summary.steps }),
    next("message.end", { role: "assistant", partTypes: input.summary.assistantPartTypes, finish: input.summary.finish }),
    next("turn.end", { finish: input.summary.finish, steps: input.summary.steps }),
    next("session.updated", { sessionID, assistantParts: input.summary.assistantPartTypes.length }),
    next("session.idle", { sessionID }),
  )
  return events
}

function observationForStage(fixture: ProductTaskNativeCadenceFixture, stageID: CanonicalFlowStageID) {
  if (stageID === "provider.request" || stageID === "loop.boundary") return fixture.observationShape.providerBoundary
  if (stageID === "provider.stream" || stageID === "stream.project") return fixture.observationShape.streamDelta
  if (stageID === "tool.plan" || stageID === "tool.batch" || stageID === "tool.execute" || stageID === "tool.result") return fixture.observationShape.toolLifecycle
  if (stageID === "session.user-write" || stageID === "session.assistant-write" || stageID === "surface.output") return fixture.observationShape.messageWrite
  if (stageID === "acceptance.check") return fixture.observationShape.acceptance
  return undefined
}

export function nativeProjectionLossDetailsForFixture(fixture: ProductTaskNativeCadenceFixture): HarnessNativeProjectionLossDetail[] {
  const fields = new Set(fixture.projectionLosses.map((loss) => String(loss.field)))
  const providerLosses = providerNativeProjectionLosses().filter((loss) => !fields.has(loss.field))
  return [...fixture.projectionLosses, ...providerLosses].map((loss) => ({
    field: String(loss.field),
    lossiness: loss.lossiness,
    reason: loss.reason,
  }))
}

function originalObservabilityForStage(product: HarnessProduct, stageID: CanonicalFlowStageID, observed: boolean): HarnessFlowObservability {
  const adapter = nativeFlowAdapterProfileForProduct(product)
  if (observed && adapter.observedStages.includes(stageID)) {
    return {
      visibility: adapter.observedVisibility,
      lossiness: adapter.observedLossiness,
      confidence: "semantic",
      evidence: adapter.observedEvidence,
    }
  }
  if (observed) {
    return { visibility: "aggregate", lossiness: "aggregated", confidence: "semantic", evidence: `${adapter.observedEvidence}.aggregate` }
  }
  if (adapter.inferredStages.includes(stageID)) {
    return { visibility: "none", lossiness: "inferred", confidence: "inferred", evidence: adapter.inferredEvidence }
  }
  return { visibility: "none", lossiness: "unobservable", confidence: "inferred", evidence: "unavailable" }
}

function flowVisibilityFromTaskVisibility(value: string): HarnessFlowVisibility {
  if (value === "per-request" || value === "per-chunk" || value === "aggregate" || value === "none" || value === "storage-event" || value === "final-message" || value === "explicit-event") return value
  if (value === "raw-chunk") return "per-chunk"
  return "semantic"
}

function originalLossiness(product: HarnessProduct): HarnessFlowLossiness {
  return nativeFlowAdapterProfileForProduct(product).observedLossiness
}

function nativeFlowAdapterMetadata(adapter: HarnessNativeFlowAdapterProfile): Record<string, unknown> {
  return {
    adapterID: adapter.adapterID,
    adapterLabel: adapter.label,
    fixtureGlob: adapter.fixtureGlob,
    evidenceSources: adapter.evidenceSources,
    observedStages: adapter.observedStages,
    inferredStages: adapter.inferredStages,
    mappingStrategy: adapter.mappingStrategy,
  }
}

function originalFixtureTraceForProduct(product: HarnessProduct, scenario: OpenCodeDifferentialScenario): OpenCodeDifferentialTrace {
  if (product === "opencode") return originalOpenCodeFixtureTrace(scenario)
  if (product === "pi-mono") return originalPiMonoFixtureTrace(scenario)
  if (product === "opencode-pi-hybrid") return originalPiMonoFixtureTrace(scenario)
  if (product === "nanobot") return originalNanobotFixtureTrace(scenario)
  return originalHermesAgentFixtureTrace(scenario)
}

function scenarioForProduct(product: HarnessProduct, taskID?: string): OpenCodeDifferentialScenario {
  const id = `${product}.${taskID ?? "flow-graph"}`
  return {
    id,
    prompt: `Reply with exactly: ${product}-flow-ok`,
    assistantText: `${product}-flow-ok`,
  }
}

function compareMetric(
  assembled: HarnessFlowGraph,
  original: HarnessFlowGraph,
  stageID: CanonicalFlowStageID,
  metric: keyof HarnessFlowMetrics,
  category: HarnessFlowDiff["category"],
  message: string,
  diffs: HarnessFlowDiff[],
): void {
  const rawAssembledValue = nodeMetric(assembled, stageID, metric)
  const rawOriginalValue = nodeMetric(original, stageID, metric)
  const assembledValue = metric === "acceptedEarly" ? Boolean(rawAssembledValue) : rawAssembledValue
  const originalValue = metric === "acceptedEarly" ? Boolean(rawOriginalValue) : rawOriginalValue
  if (assembledValue === undefined && originalValue === undefined) return
  if (assembledValue === originalValue) return
  const status = metric === "acceptedEarly" ? "changed" : assembledValue === undefined ? "original-only" : originalValue === undefined ? "assembled-only" : "changed"
  diffs.push(flowDiff(`${String(metric)}.${status}`, stageID, status, message, assembledValue, originalValue, owningPlaneForCategory(category, stageID), candidateAtomsForCategory(assembled, stageID, category), status === "changed" ? "semantic" : "inferred", category))
}

function compareArrayMetric(
  assembled: HarnessFlowGraph,
  original: HarnessFlowGraph,
  stageID: CanonicalFlowStageID,
  metric: keyof HarnessFlowMetrics,
  category: HarnessFlowDiff["category"],
  message: string,
  diffs: HarnessFlowDiff[],
): void {
  const assembledValue = arrayMetric(nodeMetric(assembled, stageID, metric))
  const originalValue = arrayMetric(nodeMetric(original, stageID, metric))
  if (assembledValue.length === 0 && originalValue.length === 0) return
  if (arraysEqual(assembledValue, originalValue)) return
  const status = assembledValue.length === 0 ? "original-only" : originalValue.length === 0 ? "assembled-only" : "changed"
  diffs.push(flowDiff(`${String(metric)}.${status}`, stageID, status, message, assembledValue, originalValue, owningPlaneForCategory(category, stageID), candidateAtomsForCategory(assembled, stageID, category), status === "changed" ? "semantic" : "inferred", category))
}

function flowDiff(
  id: string,
  stageID: CanonicalFlowStageID,
  status: HarnessFlowDiffStatus,
  message: string,
  assembled: unknown,
  original: unknown,
  owningPlane: HarnessFlowDiff["owningPlane"],
  candidateAtomIDs: string[],
  confidence: HarnessFlowConfidence,
  category: HarnessFlowDiff["category"] = "stage.observability",
): HarnessFlowDiff {
  return { id: `${stageID}.${id}`, stageID, status, category, message, assembled, original, owningPlane, candidateAtomIDs, confidence }
}

function nodeMetric(graph: HarnessFlowGraph, stageID: CanonicalFlowStageID, metric: keyof HarnessFlowMetrics): unknown {
  return graph.nodes.find((node) => node.id === stageID)?.metrics[metric]
}

function nodeAtoms(graph: HarnessFlowGraph, stageID: CanonicalFlowStageID): string[] {
  return graph.nodes.find((node) => node.id === stageID)?.assembledAtomIDs ?? []
}

function owningPlaneForCategory(category: HarnessFlowDiff["category"], stageID: CanonicalFlowStageID): HarnessFlowDiff["owningPlane"] {
  if (category === "cadence.message-part-type" || category === "cadence.streaming-delta" || category === "cadence.native-projection-gap") return "native-projector"
  if (category === "cadence.provider-request-count") return "provider"
  if (category === "cadence.tool-call-count" || category === "cadence.tool-sequence" || category === "cadence.tool-batch") return "tool"
  if (category === "cadence.final-summary" || category === "cadence.early-accept") return "agent-loop"
  return stageByID.get(stageID)?.plane ?? "native-projector"
}

function candidateAtomsForCategory(graph: HarnessFlowGraph, stageID: CanonicalFlowStageID, category: HarnessFlowDiff["category"]): string[] {
  const atoms = nodeAtoms(graph, stageID)
  const prefix = graph.product === "pi-mono" || graph.product === "opencode-pi-hybrid" ? "pi" : graph.product === "hermes-agent" ? "hermes" : graph.product
  const hinted =
    category === "cadence.provider-request-count" ? [`${prefix}.agent-loop.request-boundary.native-like`] :
    category === "cadence.tool-call-count" || category === "cadence.tool-sequence" ? [`${prefix}.tools.schema.native-like`] :
    category === "cadence.tool-batch" ? [`${prefix}.tools.batch-scheduler.native-like`] :
    category === "cadence.message-part-type" ? [`${prefix}.session.message-part-projector.native-like`] :
    category === "cadence.streaming-delta" ? [`${prefix}.provider.stream-projector.native-like`] :
    category === "cadence.final-summary" ? [`${prefix}.agent-loop.final-summary.native-like`] :
    category === "cadence.early-accept" ? [`${prefix}.runtime.acceptance-controller.native-like`] :
    []
  return uniqueStrings([...atoms, ...hinted])
}

function arrayMetric(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function edgeDataKind(from: CanonicalFlowStageID, to: CanonicalFlowStageID): string {
  if (to.startsWith("provider.")) return "provider-request"
  if (to.startsWith("tool.")) return "tool-call"
  if (to.startsWith("session.")) return "message"
  if (to.startsWith("prompt.")) return "prompt-artifact"
  if (to === "surface.output") return "product-output"
  return "control"
}

function normalizeNativeEvent(value: string): string {
  return value.trim().replace(/-/g, "_")
}

function isEarlyAcceptEvent(value: string): boolean {
  return value === "native.accepted-early" || value === "runtime.accepted-early" || value === "acceptance.accepted-early" || value === "native.accepted_early" || value === "runtime.accepted_early" || value === "acceptance.accepted_early"
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort()
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, inner]) => `${JSON.stringify(key)}:${stableStringify(inner)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function jsonSerializableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(jsonSerializableValue)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, inner]) => inner !== undefined)
        .map(([key, inner]) => [key, jsonSerializableValue(inner)]),
    )
  }
  return value
}

function dedupeEvidence(evidence: HarnessFlowEvidence[]): HarnessFlowEvidence[] {
  const byID = new Map<string, HarnessFlowEvidence>()
  for (const item of evidence) byID.set(item.id, item)
  return [...byID.values()].sort((left, right) => left.id.localeCompare(right.id))
}

function isHarnessProduct(value: string): value is HarnessProduct {
  return value === "opencode" || value === "pi-mono" || value === "nanobot" || value === "hermes-agent"
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.length > 0)
  if (typeof value === "string" && value.length > 0) return value.split(",").map((item) => item.trim()).filter(Boolean)
  return []
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function isFlowGraph(value: unknown): value is HarnessFlowGraph {
  const record = objectRecord(value)
  return record["schemaVersion"] === 1 && Array.isArray(record["nodes"]) && Array.isArray(record["edges"]) && objectRecord(record["summary"])["fingerprint"] !== undefined
}

function isFlowRun(value: unknown): value is HarnessFlowRun {
  const record = objectRecord(value)
  const redaction = objectRecord(record["redaction"])
  return record["schemaVersion"] === 1 && record["source"] === "assembled" && typeof record["runID"] === "string" && redaction["prompt"] === "fingerprint-only" && Array.isArray(record["events"]) && isFlowGraph(record["graph"])
}

function isFlowComparison(value: unknown): value is HarnessFlowComparison {
  const record = objectRecord(value)
  return record["schemaVersion"] === 1 && isFlowGraph(record["assembled"]) && isFlowGraph(record["original"]) && Array.isArray(record["diffs"])
}
