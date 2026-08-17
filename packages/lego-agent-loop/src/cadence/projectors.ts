import { createHash } from "node:crypto"
import { decideOpenCodeNativeFinalSummary, decideOpenCodeNativeRequestBoundary } from "../product-schema/opencode.ts"
import { getCadencePolicyProfile, type CadencePolicyProfile } from "./registry.ts"
import type {
  CadenceProductPersonality,
  FinalSummaryDecision,
  FinalSummaryInput,
  FinalSummaryResult,
  RequestBoundaryDecision,
  RequestBoundaryInput,
  RequestBoundaryResult,
  ToolBatchCandidate,
  ToolBatchMode,
  ToolBatchPlan,
} from "./types.ts"

export type CadenceProjectorProduct = Exclude<CadenceProductPersonality, "common">
export type CadenceProjectorAtomKey = "request-boundary" | "final-summary" | "tool-batch-scheduler"
export type CadenceProductProjectorCoverage = "common-fallback" | "product-projector-partial"
export type CadenceProductProjectorScenarioVisibility = "observed" | "inferred"

export interface CadenceProductProjector {
  readonly id: string
  readonly product: CadenceProductPersonality
  readonly profile: CadencePolicyProfile
  readonly fallbackProjectorID: string
  readonly coverage: CadenceProductProjectorCoverage
  decideRequestBoundary(input: RequestBoundaryInput): RequestBoundaryResult
  decideFinalSummary(input: FinalSummaryInput): FinalSummaryResult
  planToolBatches(toolCalls: ToolBatchCandidate[]): ToolBatchPlan[]
}

export interface CadenceProductProjectorScenario {
  key: CadenceProjectorAtomKey
  scenarioID: string
  expectedDecision: RequestBoundaryDecision | FinalSummaryDecision | ToolBatchMode
  reasonCode: string
  source: "common-fallback" | "product-policy-overlay"
  visibility: CadenceProductProjectorScenarioVisibility
  upstreamEvidenceRefs: string[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
}

export interface CadenceProductProjectorSnapshot {
  schemaVersion: 1
  product: CadenceProjectorProduct
  projectorID: string
  fallbackProjectorID: string
  coverage: CadenceProductProjectorCoverage
  upstreamRef: string
  nativeFixtureSource: string
  fixtureID: string
  profileFingerprint: string
  productSpecificFields: string[]
  commonFallbackFields: string[]
  scenarios: CadenceProductProjectorScenario[]
  coveredKeys: CadenceProjectorAtomKey[]
  knownGaps: string[]
  fingerprint: string
}

export function createCadenceProductProjector(product: CadenceProductPersonality): CadenceProductProjector {
  const profile = getCadencePolicyProfile(product)
  const fallbackProjectorID = "common.cadence.projector.fallback"
  const id = product === "common" ? fallbackProjectorID : `${profile.prefix}.cadence.product-projector.partial`
  const coverage: CadenceProductProjectorCoverage = product === "common" ? "common-fallback" : "product-projector-partial"
  return {
    id,
    product,
    profile,
    fallbackProjectorID,
    coverage,
    decideRequestBoundary(input) {
      if (product === "opencode") return decideOpenCodeNativeRequestBoundary(profile.requestBoundaryID, input)
      return commonRequestBoundaryDecision(profile.requestBoundaryID, input)
    },
    decideFinalSummary(input) {
      if (product === "opencode") return decideOpenCodeNativeFinalSummary(profile.finalSummaryID, input)
      return commonFinalSummaryDecision(profile, input)
    },
    planToolBatches(toolCalls) {
      return toolBatchPlannerRegistry[profile.toolBatch](toolCalls)
    },
  }
}

export function buildCadenceProductProjectorSnapshot(product: CadenceProjectorProduct): CadenceProductProjectorSnapshot {
  const projector = createCadenceProductProjector(product)
  const scenarios = cadenceProductProjectorScenarios(projector)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    projectorID: projector.id,
    fallbackProjectorID: projector.fallbackProjectorID,
    coverage: projector.coverage,
    upstreamRef: cadenceProductProjectorUpstreamRef(product),
    nativeFixtureSource: cadenceProductProjectorNativeFixtureSource(product),
    fixtureID: `${product}-cadence:product-projector`,
    profileFingerprint: fingerprintObject(projector.profile),
    productSpecificFields: cadenceProductProjectorSpecificFields(projector.profile),
    commonFallbackFields: [
      "request-boundary-result-shape",
      "final-summary-result-shape",
      "tool-batch-plan-shape",
      "lego-port-contract",
    ],
    scenarios,
    coveredKeys: uniqueStrings(scenarios.map((scenario) => scenario.key)) as CadenceProjectorAtomKey[],
    knownGaps: [
      "product-projector-is-partial-replay-not-full-native-loop",
      "native-event-timing-and-side-effects-not-yet-replayed",
      "common-fallback-still-normalizes-result-shape",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function cadenceProductProjectorUpstreamRef(product: CadenceProjectorProduct): string {
  if (product === "opencode") return "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  if (product === "pi-mono") return "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  if (product === "nanobot") return "package:nanobot-ai@0.2.0"
  return "package:hermes-agent==0.15.1"
}

export function cadenceProductProjectorNativeFixtureSource(product: CadenceProjectorProduct): string {
  if (product === "pi-mono") return "pi-cadence-native"
  if (product === "hermes-agent") return "hermes-cadence-native"
  return `${product}-cadence-native`
}

function commonRequestBoundaryDecision(id: string, input: RequestBoundaryInput): RequestBoundaryResult {
  if (input.accepted) return { decision: "stop", reasonCode: "accepted", atomID: id }
  if (input.step >= input.maxSteps - 1) return { decision: "stop", reasonCode: "max-steps", atomID: id }
  if (input.toolCallCount > 0) return { decision: "continue", reasonCode: "tool-results-need-provider-continuation", atomID: id }
  return { decision: "stop", reasonCode: input.finish ?? "no-tool-call", atomID: id }
}

function commonFinalSummaryDecision(profile: CadencePolicyProfile, input: FinalSummaryInput): FinalSummaryResult {
  if (input.accepted) return { decision: profile.acceptedFinalSummary, reasonCode: "accepted-final-summary-policy", atomID: profile.finalSummaryID }
  if (input.toolCallCount > 0) return { decision: "native-final-message", reasonCode: "tool-results-need-visible-finalization", atomID: profile.finalSummaryID }
  if (input.visibleText === "has-text") return { decision: "none", reasonCode: "assistant-already-visible", atomID: profile.finalSummaryID }
  return { decision: "concise-summary", reasonCode: "empty-final-text", atomID: profile.finalSummaryID }
}

const toolBatchPlannerRegistry: Record<CadencePolicyProfile["toolBatch"], (toolCalls: ToolBatchCandidate[]) => ToolBatchPlan[]> = {
  default: defaultToolBatches,
  "opencode-native": (toolCalls) => nativeLikeToolBatches(toolCalls, { readOnlyMayBatch: true, mutatingSequential: true }),
  "native-sequential": (toolCalls) => nativeLikeToolBatches(toolCalls, { readOnlyMayBatch: false, mutatingSequential: true }),
}

function defaultToolBatches(toolCalls: ToolBatchCandidate[]): ToolBatchPlan[] {
  const batches: ToolBatchPlan[] = []
  for (let index = 0; index < toolCalls.length; ) {
    const current = toolCalls[index]
    if (!current) break
    if (current.executionMode === "sequential") {
      batches.push({ index: batches.length, mode: "sequential", toolCallIDs: [current.toolCallID], reasonCode: "tool-declared-sequential" })
      index++
      continue
    }
    const batch: ToolBatchCandidate[] = []
    while (index < toolCalls.length) {
      const next = toolCalls[index]
      if (!next || next.executionMode === "sequential") break
      batch.push(next)
      index++
    }
    batches.push({
      index: batches.length,
      mode: batch.length > 1 ? "parallel" : "native-order",
      toolCallIDs: batch.map((call) => call.toolCallID),
      reasonCode: batch.length > 1 ? "contiguous-parallel-tools" : "single-native-order-tool",
    })
  }
  return batches
}

function nativeLikeToolBatches(
  toolCalls: ToolBatchCandidate[],
  options: { readOnlyMayBatch: boolean; mutatingSequential: boolean },
): ToolBatchPlan[] {
  const batches: ToolBatchPlan[] = []
  let readOnlyBatch: ToolBatchCandidate[] = []
  const flushReadOnly = () => {
    if (readOnlyBatch.length === 0) return
    batches.push({
      index: batches.length,
      mode: options.readOnlyMayBatch && readOnlyBatch.length > 1 ? "parallel" : "native-order",
      toolCallIDs: readOnlyBatch.map((call) => call.toolCallID),
      reasonCode: options.readOnlyMayBatch ? "native-readonly-batch" : "native-readonly-order",
    })
    readOnlyBatch = []
  }
  for (const call of toolCalls) {
    if (!call.mutating && call.executionMode !== "sequential") {
      readOnlyBatch.push(call)
      continue
    }
    flushReadOnly()
    batches.push({
      index: batches.length,
      mode: options.mutatingSequential || call.executionMode === "sequential" ? "sequential" : "native-order",
      toolCallIDs: [call.toolCallID],
      reasonCode: call.mutating ? "native-mutating-tool-order" : "tool-declared-sequential",
    })
  }
  flushReadOnly()
  return batches
}

function cadenceProductProjectorScenarios(projector: CadenceProductProjector): CadenceProductProjectorScenario[] {
  if (projector.product === "common") return []
  const product = projector.product as CadenceProjectorProduct
  const toolBatchPlans = projector.planToolBatches([
    { toolCallID: "read-1", toolName: "read", mutating: false },
    { toolCallID: "read-2", toolName: "grep", mutating: false },
    { toolCallID: "write-1", toolName: "edit", mutating: true },
    { toolCallID: "shell-1", toolName: "bash", executionMode: "sequential", mutating: false },
  ])
  const readonlyPlan = toolBatchPlans.find((plan) => plan.toolCallIDs.includes("read-1"))
  const mutatingPlan = toolBatchPlans.find((plan) => plan.toolCallIDs.includes("write-1"))
  const sequentialPlan = toolBatchPlans.find((plan) => plan.toolCallIDs.includes("shell-1"))
  const requestBoundaryCases = [
    projector.decideRequestBoundary({ product, step: 0, maxSteps: 4, toolCallCount: 0, accepted: true, syntheticContinues: 0 }),
    projector.decideRequestBoundary({ product, step: 0, maxSteps: 4, toolCallCount: 2, syntheticContinues: 0 }),
    projector.decideRequestBoundary({ product, step: 3, maxSteps: 4, toolCallCount: 0, syntheticContinues: 0 }),
    projector.decideRequestBoundary({ product, step: 0, maxSteps: 4, finish: "stop", toolCallCount: 0, syntheticContinues: 0 }),
  ] as const
  const finalSummaryCases = [
    projector.decideFinalSummary({ product, accepted: true, toolCallCount: 0, visibleText: "empty" }),
    projector.decideFinalSummary({ product, toolCallCount: 1, visibleText: "empty" }),
    projector.decideFinalSummary({ product, toolCallCount: 0, visibleText: "has-text" }),
    projector.decideFinalSummary({ product, toolCallCount: 0, visibleText: "empty" }),
  ] as const
  return [
    projectorScenario(product, "request-boundary", "accepted-result", requestBoundaryCases[0].decision, requestBoundaryCases[0].reasonCode, ["acceptedStop"]),
    projectorScenario(product, "request-boundary", "tool-results-available", requestBoundaryCases[1].decision, requestBoundaryCases[1].reasonCode, ["toolResultContinuation"]),
    projectorScenario(product, "request-boundary", "max-step-reached", requestBoundaryCases[2].decision, requestBoundaryCases[2].reasonCode, ["maxStepStop"]),
    projectorScenario(product, "request-boundary", "provider-finished-without-tools", requestBoundaryCases[3].decision, requestBoundaryCases[3].reasonCode, ["providerFinishStop"]),
    projectorScenario(product, "final-summary", "accepted-result", finalSummaryCases[0].decision, finalSummaryCases[0].reasonCode, ["acceptedFinalSummary"]),
    projectorScenario(product, "final-summary", "tool-results-need-visible-finalization", finalSummaryCases[1].decision, finalSummaryCases[1].reasonCode, ["toolResultFinalization"]),
    projectorScenario(product, "final-summary", "assistant-visible-text", finalSummaryCases[2].decision, finalSummaryCases[2].reasonCode, ["visibleTextNoSummary"]),
    projectorScenario(product, "final-summary", "empty-final-text", finalSummaryCases[3].decision, finalSummaryCases[3].reasonCode, ["emptyFinalTextSummary"]),
    projectorScenario(product, "tool-batch-scheduler", "readonly-pair", readonlyPlan?.mode ?? "native-order", readonlyPlan?.reasonCode ?? "native-readonly-order", ["toolBatchMode", "readOnlyToolOrder"]),
    projectorScenario(product, "tool-batch-scheduler", "mutating-edit", mutatingPlan?.mode ?? "sequential", mutatingPlan?.reasonCode ?? "native-mutating-tool-order", ["mutatingToolSerialization"]),
    projectorScenario(product, "tool-batch-scheduler", "declared-sequential", sequentialPlan?.mode ?? "sequential", sequentialPlan?.reasonCode ?? "tool-declared-sequential", ["declaredSequentialToolOrder"]),
  ]
}

function projectorScenario(
  product: CadenceProjectorProduct,
  key: CadenceProjectorAtomKey,
  scenarioID: string,
  expectedDecision: RequestBoundaryDecision | FinalSummaryDecision | ToolBatchMode,
  reasonCode: string,
  observedFields: string[],
): CadenceProductProjectorScenario {
  return {
    key,
    scenarioID,
    expectedDecision,
    reasonCode,
    source: key === "final-summary" && scenarioID === "accepted-result" ? "product-policy-overlay" : "common-fallback",
    visibility: "observed",
    upstreamEvidenceRefs: cadenceProductProjectorEvidenceRefs(product, key),
    observedFields,
    inferredFields: cadenceProductProjectorInferredFields(product, key),
    lossyFields: cadenceProductProjectorLossyFields(product, key),
  }
}

function cadenceProductProjectorEvidenceRefs(product: CadenceProjectorProduct, key: CadenceProjectorAtomKey): string[] {
  const base = cadenceProductProjectorUpstreamRef(product)
  const keyRefs = {
    "request-boundary": product === "pi-mono" ? ["jsonl-v3-provider-round-boundary", "tool-use-continuation"] :
      product === "nanobot" ? ["agent-iteration-boundary", "workspace-tool-result-continuation"] :
      product === "hermes-agent" ? ["persistent-agent-loop-boundary", "gateway-visible-stop"] :
      ["step-finish-boundary", "tool-result-provider-continuation"],
    "final-summary": product === "pi-mono" ? ["accepted-task-no-extra-summary", "empty-final-text-summary"] :
      product === "nanobot" ? ["dreamless-accepted-finalization", "session-visible-final-text"] :
      product === "hermes-agent" ? ["native-final-message-policy", "interrupt-visible-finalization"] :
      ["native-final-message-policy", "assistant-visible-final-text"],
    "tool-batch-scheduler": product === "opencode" ? ["readonly-tool-batch", "mutating-tool-serialization"] :
      product === "nanobot" ? ["skill-tool-iteration-order", "workspace-mutating-tool-serialization"] :
      product === "hermes-agent" ? ["sequential-tool-dispatch", "computer-use-tool-order"] :
      ["typebox-tool-order", "mutating-tool-serialization"],
  } satisfies Record<CadenceProjectorAtomKey, string[]>
  return [base, ...keyRefs[key]]
}

function cadenceProductProjectorSpecificFields(profile: CadencePolicyProfile): string[] {
  return [
    "requestBoundaryID",
    "toolBatchSchedulerID",
    "finalSummaryID",
    `toolBatch:${profile.toolBatch}`,
    `acceptedFinalSummary:${profile.acceptedFinalSummary}`,
  ]
}

function cadenceProductProjectorInferredFields(product: CadenceProjectorProduct, key: CadenceProjectorAtomKey): string[] {
  if (key === "request-boundary") {
    return product === "nanobot" ? ["native-agent-iteration-clock", "workspace-session-write-before-boundary"] : ["native-provider-boundary-hook-order", "acceptance-check-timing"]
  }
  if (key === "final-summary") {
    return product === "pi-mono" ? ["native-jsonl-final-record-timing", "extension-post-summary-hooks"] : ["native-final-message-storage-timing", "provider-round-trigger-detail"]
  }
  return product === "hermes-agent" ? ["computer-use-dependency-priority", "gateway-tool-dispatch-side-effects"] : ["native-tool-dependency-graph", "permission-side-effect-order"]
}

function cadenceProductProjectorLossyFields(product: CadenceProjectorProduct, key: CadenceProjectorAtomKey): string[] {
  const common = ["policy-table-replay", "native-event-timing-not-replayed", "not-full-native-loop-replay"]
  if (key === "request-boundary") return product === "opencode" ? [...common, "plugin-hook-intervention-order"] : [...common, "native-loop-break-priority"]
  if (key === "final-summary") return product === "pi-mono" ? [...common, "native-extension-finalization-side-effects"] : [...common, "native-final-message-side-effects"]
  return product === "nanobot" ? [...common, "skill-tool-iteration-state"] : [...common, "native-tool-scheduler-side-effects"]
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values))
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
