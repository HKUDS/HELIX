import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import type { LegoMessagePart } from "@helix/contracts"

export type RuntimeAcceptanceProduct = "common" | "opencode" | "pi-mono" | "nanobot" | "hermes-agent"
export type RuntimeAcceptanceReplayProduct = Exclude<RuntimeAcceptanceProduct, "common">
export type RuntimeAcceptanceReplayAtomKey = "acceptance-controller" | "acceptance-evidence"
export type RuntimeAcceptanceReplayStageID = "acceptance.check"
export type RuntimeAcceptanceReplayVisibility = "observed" | "inferred"
export type RuntimeAcceptanceTimingBoundaryVisibility = "observed" | "inferred"
export type RuntimeAcceptanceLifecycleVisibility = "observed" | "inferred"
export type RuntimeAcceptancePersistenceCleanupVisibility = "observed" | "inferred"
export type RuntimeAcceptanceDecision = "accept" | "continue" | "summarize" | "fail" | "inconclusive"
export type RuntimeAcceptanceControllerStatus = RuntimeAcceptanceDecision
export type RuntimeAcceptanceEvidenceAvailability =
  | "provider-request-before"
  | "stream-delta-during"
  | "tool-result-after"
  | "message-end"
  | "turn-end"
  | "report-only"
  | "not-required"
  | "unavailable"

export interface RuntimeAcceptanceEvidenceTimeline {
  workspaceDiffAvailableAt: RuntimeAcceptanceEvidenceAvailability
  requiredToolResultAvailableAt: RuntimeAcceptanceEvidenceAvailability
  visibleSummaryAvailableAt: RuntimeAcceptanceEvidenceAvailability
  forbiddenFileCheckAvailableAt: RuntimeAcceptanceEvidenceAvailability
  policySatisfiedAt: RuntimeAcceptanceEvidenceAvailability
}

export interface RuntimeAcceptanceEvidence {
  testsPassed?: boolean
  expectedFileModified?: boolean
  forbiddenFileUnchanged?: boolean
  requiredCommandRan?: boolean
  visibleSummaryPresent?: boolean
  providerStopReason?: string
  checks?: RuntimeAcceptanceEvidenceCheck[]
  workspaceDiff?: RuntimeAcceptanceWorkspaceDiffEntry[]
  toolCalls?: string[]
  timeline?: RuntimeAcceptanceEvidenceTimeline
  blockingEvidence?: string[]
  satisfiedAt?: RuntimeAcceptanceEvidenceAvailability
  unavailableUntil?: Array<{ evidence: string; until: RuntimeAcceptanceEvidenceAvailability; reason: string }>
}

export interface RuntimeAcceptanceControllerAtom {
  readonly id: string
  decide(evidence: RuntimeAcceptanceEvidence): { decision: RuntimeAcceptanceDecision; reasonCode: string }
}

export interface RuntimeAcceptanceEvidenceCheck {
  id: string
  ok: boolean
  message: string
}

export interface RuntimeAcceptanceWorkspaceDiffEntry {
  path: string
  status: "added" | "modified" | "deleted"
  before?: string
  after?: string
}

export interface RuntimeAcceptanceExpectedPolicy {
  visibleAnswerIncludes?: string[]
  visibleAnswerPatterns?: string[]
  files?: Record<string, { includes?: string[]; equals?: string }>
  noFiles?: string[]
  toolNames?: string[]
  toolResultIncludes?: string[]
  toolResultIncludesByTool?: Array<{ toolName: string; includes: string[] }>
  workspaceDiff?: Array<{ path: string; status: RuntimeAcceptanceWorkspaceDiffEntry["status"] }>
  workspaceDiffExact?: Array<{ path: string; status: RuntimeAcceptanceWorkspaceDiffEntry["status"] }>
  workspaceDiffCount?: number
}

export interface RuntimeAcceptanceEvidenceInput {
  parts: LegoMessagePart[]
  workspaceRoot: string
}

export interface RuntimeAcceptanceEvidenceReport extends RuntimeAcceptanceEvidence {
  passed: boolean
  visibleText: string
  toolResults: Array<{ toolName: string; text: string; isError?: boolean }>
}

export interface RuntimeAcceptanceEvidenceProviderAtom {
  readonly id: string
  readonly port: "runtime.acceptance-evidence"
  readonly product: RuntimeAcceptanceProduct
  evaluate(input: RuntimeAcceptanceEvidenceInput): RuntimeAcceptanceEvidenceReport
}

export interface RuntimeTaskAcceptanceControllerInput {
  product: RuntimeAcceptanceProduct
  evidenceProvider: RuntimeAcceptanceEvidenceProviderAtom
  controller?: RuntimeAcceptanceControllerAtom
}

export interface RuntimeTaskAcceptanceControllerAtom {
  readonly id: string
  decide(input: { product: RuntimeAcceptanceProduct; step: number; cwd?: string; parts: LegoMessagePart[] }): {
    status: RuntimeAcceptanceControllerStatus
    reasonCode: string
    atomID: string
    evidence?: Record<string, unknown>
  }
}

export interface RuntimeAcceptanceAtomDescriptor {
  id: string
  port: "runtime.acceptance-controller" | "runtime.acceptance-evidence"
  product: RuntimeAcceptanceProduct
  nativeFixtureSource?: "opencode-native" | "pi-native" | "nanobot-native" | "hermes-native"
  decisionOnPass?: RuntimeAcceptanceDecision
  replay?: RuntimeAcceptanceReplayAtomSnapshot
}

export interface RuntimeAcceptanceReplayScenario {
  scenarioID: "read-only" | "single-file-edit" | "test-fix" | "permission-denied" | "tool-error-retry"
  taskClass: string
  providerStopReason: string
  toolOutcome: "none" | "success" | "denied" | "error-then-success"
  workspaceOutcome: "noop" | "modified" | "test-pass" | "blocked"
  expectedDecision: RuntimeAcceptanceDecision
  satisfiedAt: RuntimeAcceptanceEvidenceAvailability
  observedShape: Record<string, unknown>
  visibility: RuntimeAcceptanceReplayVisibility
}

export interface RuntimeAcceptanceReplayAtomSnapshot {
  key: RuntimeAcceptanceReplayAtomKey
  atomID: string
  portID: "runtime.acceptance-controller" | "runtime.acceptance-evidence"
  flowStageID: RuntimeAcceptanceReplayStageID
  timingBoundaryFingerprint?: string
  timingBoundaryFixtureID?: string
  lifecycleFingerprint?: string
  lifecycleFixtureID?: string
  persistenceCleanupFingerprint?: string
  persistenceCleanupFixtureID?: string
  nativeFixtureSource: string
  upstreamEvidenceRefs: string[]
  fixtureID: string
  scenarios: RuntimeAcceptanceReplayScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
}

export interface RuntimeAcceptanceTimingBoundaryScenario {
  scenarioID: string
  taskClass: string
  nativeLoopSurface: string
  triggerEvent: string
  evidenceAvailableAt: RuntimeAcceptanceEvidenceAvailability
  decisionEvent: RuntimeAcceptanceDecision
  timingBuckets: string[]
  sideEffectSurface: string
  observedShape: Record<string, unknown>
  visibility: RuntimeAcceptanceTimingBoundaryVisibility
}

export interface RuntimeAcceptanceTimingBoundarySnapshot {
  schemaVersion: 1
  product: RuntimeAcceptanceReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: RuntimeAcceptanceTimingBoundaryScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface RuntimeAcceptanceLifecycleScenario {
  scenarioID: string
  taskClass: string
  nativeLifecycleSurface: string
  triggerEvent: string
  evidenceRecordTypes: string[]
  sideEffectRecords: string[]
  decisionEvent: RuntimeAcceptanceDecision
  observedShape: Record<string, unknown>
  visibility: RuntimeAcceptanceLifecycleVisibility
  lossiness: string[]
}

export interface RuntimeAcceptanceLifecycleSnapshot {
  schemaVersion: 1
  product: RuntimeAcceptanceReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: RuntimeAcceptanceLifecycleScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface RuntimeAcceptancePersistenceCleanupScenario {
  scenarioID: string
  taskClass: string
  nativePersistenceSurface: string
  triggerEvent: string
  persistenceRecords: string[]
  cleanupRecords: string[]
  sideEffectOrder: string[]
  decisionEvent: RuntimeAcceptanceDecision
  observedShape: Record<string, unknown>
  visibility: RuntimeAcceptancePersistenceCleanupVisibility
  lossiness: string[]
}

export interface RuntimeAcceptancePersistenceCleanupSnapshot {
  schemaVersion: 1
  product: RuntimeAcceptanceReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: RuntimeAcceptancePersistenceCleanupScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface RuntimeAcceptanceProfileSnapshot {
  product: RuntimeAcceptanceProduct
  prefix: string
  controllerID: string
  evidenceID: string
  decisionOnPass: RuntimeAcceptanceDecision
  passReason: string
  nativeFixtureSource: string
}

export interface RuntimeAcceptanceReplaySnapshot {
  schemaVersion: 1
  product: RuntimeAcceptanceReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureIDs: string[]
  profileFingerprint: string
  profile: RuntimeAcceptanceProfileSnapshot
  timingBoundary: RuntimeAcceptanceTimingBoundarySnapshot
  timingBoundaryFingerprint: string
  lifecycle: RuntimeAcceptanceLifecycleSnapshot
  lifecycleFingerprint: string
  persistenceCleanup: RuntimeAcceptancePersistenceCleanupSnapshot
  persistenceCleanupFingerprint: string
  atoms: RuntimeAcceptanceReplayAtomSnapshot[]
  coveredKeys: RuntimeAcceptanceReplayAtomKey[]
  knownGaps: string[]
  fingerprint: string
}

export type RuntimeAcceptanceLifecycleReplayGateDimension =
  | "lifecycle-start-stop"
  | "accept-continue-timing"
  | "process-cleanup"
  | "evidence-persistence"
  | "interrupt-path"

export interface RuntimeAcceptanceLifecycleReplayGateCase {
  product: RuntimeAcceptanceReplayProduct
  upstreamRef: string
  evidenceRefs: string[]
  fixtureIDs: string[]
  lifecycleStartStop: string[]
  acceptContinueTiming: string[]
  processCleanup: string[]
  evidencePersistence: string[]
  interruptPath: string[]
  nativeReplayStatus: "partial-native-anchored" | "assembled-inferred-only"
  observedScenarioIDs: string[]
  inferredScenarioIDs: string[]
  knownLossiness: string[]
}

export interface RuntimeAcceptanceLifecycleReplayGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:runtime-acceptance-lifecycle-replay-gate"
  fixtureID: "runtime:acceptance-lifecycle-replay-gate"
  products: RuntimeAcceptanceReplayProduct[]
  comparisonDimensions: RuntimeAcceptanceLifecycleReplayGateDimension[]
  cases: RuntimeAcceptanceLifecycleReplayGateCase[]
  fingerprint: string
}

export interface RuntimeAcceptanceLifecycleReplayGateIssue {
  id: string
  product: RuntimeAcceptanceReplayProduct
  dimension: RuntimeAcceptanceLifecycleReplayGateDimension
  message: string
}

export interface RuntimeAcceptanceLifecycleReplayGateVerification {
  ok: boolean
  issues: RuntimeAcceptanceLifecycleReplayGateIssue[]
}

const acceptanceProfiles: Record<
  RuntimeAcceptanceProduct,
  {
    prefix: string
    controllerID: string
    evidenceID: string
    decisionOnPass: RuntimeAcceptanceDecision
    passReason: string
    nativeFixtureSource: "none" | "opencode-native" | "pi-native" | "nanobot-native" | "hermes-native"
  }
> = {
  common: {
    prefix: "common",
    controllerID: "common.runtime.acceptance-controller.default",
    evidenceID: "common.runtime.acceptance-evidence.default",
    decisionOnPass: "continue",
    passReason: "common-policy-satisfied-without-early-stop",
    nativeFixtureSource: "none",
  },
  opencode: {
    prefix: "opencode",
    controllerID: "opencode.runtime.acceptance-controller.native-like",
    evidenceID: "opencode.runtime.acceptance-evidence.native-like",
    decisionOnPass: "summarize",
    passReason: "native-final-message-after-policy-pass",
    nativeFixtureSource: "opencode-native",
  },
  "pi-mono": {
    prefix: "pi",
    controllerID: "pi.runtime.acceptance-controller.native-like",
    evidenceID: "pi.runtime.acceptance-evidence.native-like",
    decisionOnPass: "accept",
    passReason: "native-early-accept-after-policy-pass",
    nativeFixtureSource: "pi-native",
  },
  nanobot: {
    prefix: "nanobot",
    controllerID: "nanobot.runtime.acceptance-controller.native-like",
    evidenceID: "nanobot.runtime.acceptance-evidence.native-like",
    decisionOnPass: "accept",
    passReason: "native-early-accept-after-policy-pass",
    nativeFixtureSource: "nanobot-native",
  },
  "hermes-agent": {
    prefix: "hermes",
    controllerID: "hermes.runtime.acceptance-controller.native-like",
    evidenceID: "hermes.runtime.acceptance-evidence.native-like",
    decisionOnPass: "accept",
    passReason: "hermes-policy-satisfied-after-livecodebench-evidence",
    nativeFixtureSource: "hermes-native",
  },
}

export const runtimeAcceptanceReplayProducts: RuntimeAcceptanceReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
export const runtimeAcceptanceReplayAtomKeys: RuntimeAcceptanceReplayAtomKey[] = ["acceptance-controller", "acceptance-evidence"]

export function createRuntimeAcceptanceController(product: RuntimeAcceptanceProduct): RuntimeAcceptanceControllerAtom {
  const profile = acceptanceProfiles[product]
  const id = profile.controllerID
  return {
    id,
    decide(evidence) {
      if (evidence.testsPassed && evidence.expectedFileModified !== false && evidence.forbiddenFileUnchanged !== false) {
        return { decision: profile.decisionOnPass, reasonCode: profile.passReason }
      }
      if (evidence.providerStopReason === "provider_error") return { decision: "fail", reasonCode: "provider-error" }
      return { decision: "continue", reasonCode: "policy-not-yet-satisfied" }
    },
  }
}

export function createRuntimeAcceptanceEvidenceProvider(input: {
  product: RuntimeAcceptanceProduct
  expected?: RuntimeAcceptanceExpectedPolicy
  workspaceRoot: string
  beforeSnapshot: Record<string, string>
}): RuntimeAcceptanceEvidenceProviderAtom {
  const profile = acceptanceProfiles[input.product]
  return {
    id: profile.evidenceID,
    port: "runtime.acceptance-evidence",
    product: input.product,
    evaluate(evidenceInput) {
      const workspaceRoot = evidenceInput.workspaceRoot || input.workspaceRoot
      const workspaceDiff = diffSnapshots(input.beforeSnapshot, snapshotWorkspace(workspaceRoot))
      const toolEvidence = collectToolEvidence(evidenceInput.parts)
      const visibleText = evidenceInput.parts.map(partToText).filter(Boolean).join("\n")
      const checks = acceptanceChecks(input.expected ?? {}, {
        visibleText,
        workspaceRoot,
        workspaceDiff,
        toolEvidence,
      })
      const passed = checks.every((item) => item.ok)
      const timing = runtimeAcceptanceTiming({
        checks,
        visibleText,
        workspaceDiff,
        toolResults: toolEvidence.results,
      })
      return {
        passed,
        testsPassed: passed,
        expectedFileModified: !checks.some((item) => item.id.startsWith("workspace.diff.") && !item.ok),
        forbiddenFileUnchanged: !checks.some((item) => item.id.startsWith("file.absent.") && !item.ok),
        requiredCommandRan: !checks.some((item) => item.id.startsWith("tool.") && !item.ok),
        visibleSummaryPresent: visibleText.trim().length > 0,
        checks,
        workspaceDiff,
        visibleText,
        toolCalls: toolEvidence.calls.map((call) => call.toolName),
        toolResults: toolEvidence.results,
        timeline: timing.timeline,
        blockingEvidence: timing.blockingEvidence,
        satisfiedAt: timing.satisfiedAt,
        unavailableUntil: timing.unavailableUntil,
      }
    },
  }
}

export function createRuntimeTaskAcceptanceController(input: RuntimeTaskAcceptanceControllerInput): RuntimeTaskAcceptanceControllerAtom {
  const controller = input.controller ?? createRuntimeAcceptanceController(input.product)
  return {
    id: controller.id,
    decide(decisionInput) {
      const report = input.evidenceProvider.evaluate({
        parts: decisionInput.parts,
        workspaceRoot: decisionInput.cwd ?? "",
      })
      const decision = controller.decide(report)
      return {
        status: decision.decision,
        reasonCode: decision.reasonCode,
        atomID: controller.id,
        evidence: {
          checks: report.checks?.length ?? 0,
          passing: report.checks?.filter((item) => item.ok).length ?? 0,
          workspaceDiff: report.workspaceDiff?.map((entry) => ({ path: entry.path, status: entry.status })) ?? [],
          toolCalls: report.toolCalls ?? [],
          timeline: report.timeline,
          blockingEvidence: report.blockingEvidence ?? [],
          satisfiedAt: report.satisfiedAt,
          unavailableUntil: report.unavailableUntil ?? [],
          evidenceAtomID: input.evidenceProvider.id,
        },
      }
    },
  }
}

export function runtimeAcceptanceAtomDescriptors(product?: RuntimeAcceptanceProduct): RuntimeAcceptanceAtomDescriptor[] {
  const products = product ? [product] : (Object.keys(acceptanceProfiles) as RuntimeAcceptanceProduct[])
  return products.flatMap((item) => {
    const profile = acceptanceProfiles[item]
    return [
      {
        id: profile.controllerID,
        port: "runtime.acceptance-controller",
        product: item,
        ...(profile.nativeFixtureSource === "none" ? {} : { nativeFixtureSource: profile.nativeFixtureSource }),
        decisionOnPass: profile.decisionOnPass,
        replay: runtimeAcceptanceReplayMetadata(profile, "acceptance-controller"),
      },
      {
        id: profile.evidenceID,
        port: "runtime.acceptance-evidence",
        product: item,
        ...(profile.nativeFixtureSource === "none" ? {} : { nativeFixtureSource: profile.nativeFixtureSource }),
        replay: runtimeAcceptanceReplayMetadata(profile, "acceptance-evidence"),
      },
    ]
  })
}

export function buildRuntimeAcceptanceReplaySnapshot(product: RuntimeAcceptanceReplayProduct): RuntimeAcceptanceReplaySnapshot {
  const profile = acceptanceProfiles[product]
  const timingBoundary = buildRuntimeAcceptanceTimingBoundarySnapshot(product)
  const lifecycle = buildRuntimeAcceptanceLifecycleSnapshot(product)
  const persistenceCleanup = buildRuntimeAcceptancePersistenceCleanupSnapshot(product)
  const atoms = runtimeAcceptanceReplayAtomKeys.map((key) => buildRuntimeAcceptanceReplayAtomSnapshot(product, key, timingBoundary, lifecycle, persistenceCleanup))
  const profileSnapshot = runtimeAcceptanceProfileSnapshot(profile)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: runtimeAcceptanceUpstreamRef(product),
    evidenceRef: `conformance:${product}-runtime-acceptance-replay-snapshot`,
    fixtureIDs: [...atoms.map((atom) => atom.fixtureID), timingBoundary.fixtureID, lifecycle.fixtureID, persistenceCleanup.fixtureID],
    profileFingerprint: fingerprintObject(profileSnapshot),
    profile: profileSnapshot,
    timingBoundary,
    timingBoundaryFingerprint: timingBoundary.fingerprint,
    lifecycle,
    lifecycleFingerprint: lifecycle.fingerprint,
    persistenceCleanup,
    persistenceCleanupFingerprint: persistenceCleanup.fingerprint,
    atoms,
    coveredKeys: atoms.map((atom) => atom.key),
    knownGaps: [
      "full-upstream-stop-continue-timing-not-replayed",
      "runtime-acceptance-timing-boundary-covered-by-partial-fixture",
      "runtime-acceptance-lifecycle-covered-by-partial-fixture",
      "runtime-acceptance-persistence-cleanup-covered-by-partial-fixture",
      "native-evidence-persistence-order-not-replayed",
      "cleanup-side-effect-order-not-full-native",
      "permission-denied-and-tool-error-retry-paths-partial",
      "native-task-runner-side-effects-normalized",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildRuntimeAcceptanceLifecycleReplayGateSnapshot(): RuntimeAcceptanceLifecycleReplayGateSnapshot {
  const cases = runtimeAcceptanceReplayProducts.map((product) => buildRuntimeAcceptanceLifecycleReplayGateCase(buildRuntimeAcceptanceReplaySnapshot(product)))
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:runtime-acceptance-lifecycle-replay-gate" as const,
    fixtureID: "runtime:acceptance-lifecycle-replay-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["lifecycle-start-stop", "accept-continue-timing", "process-cleanup", "evidence-persistence", "interrupt-path"] as RuntimeAcceptanceLifecycleReplayGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyRuntimeAcceptanceLifecycleReplayGateSnapshot(
  snapshot: RuntimeAcceptanceLifecycleReplayGateSnapshot,
): RuntimeAcceptanceLifecycleReplayGateVerification {
  const issues: RuntimeAcceptanceLifecycleReplayGateIssue[] = []
  for (const product of runtimeAcceptanceReplayProducts) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "runtime-acceptance.missing-product",
        product,
        dimension: "lifecycle-start-stop",
        message: `Missing runtime acceptance lifecycle replay gate case for ${product}.`,
      })
      continue
    }
    if (!runtimeAcceptanceGateContains(item.lifecycleStartStop, /lifecycle|finalization|provider-finish|message_stop|finish|start|stop/i)) {
      issues.push({
        id: "runtime-acceptance.lifecycle-start-stop",
        product,
        dimension: "lifecycle-start-stop",
        message: `${product} runtime acceptance gate no longer records lifecycle start/stop anchors.`,
      })
    }
    if (!runtimeAcceptanceGateContains(item.acceptContinueTiming, /acceptance-check|policy-satisfied|continue|accept|summarize|tool-result|message-end/i)) {
      issues.push({
        id: "runtime-acceptance.accept-continue-timing",
        product,
        dimension: "accept-continue-timing",
        message: `${product} runtime acceptance gate no longer records accept/continue timing anchors.`,
      })
    }
    if (!runtimeAcceptanceGateContains(item.processCleanup, /cleanup|abort|cancel|process|worker/i)) {
      issues.push({
        id: "runtime-acceptance.process-cleanup",
        product,
        dimension: "process-cleanup",
        message: `${product} runtime acceptance gate no longer records process cleanup anchors.`,
      })
    }
    if (!runtimeAcceptanceGateContains(item.evidencePersistence, /evidence|persistence|persisted|record|write|jsonl|sqlite|session|memory/i)) {
      issues.push({
        id: "runtime-acceptance.evidence-persistence",
        product,
        dimension: "evidence-persistence",
        message: `${product} runtime acceptance gate no longer records evidence persistence anchors.`,
      })
    }
    if (!runtimeAcceptanceGateContains(item.interruptPath, /interrupt|cancel|fail|cleanup|abort/i)) {
      issues.push({
        id: "runtime-acceptance.interrupt-path",
        product,
        dimension: "interrupt-path",
        message: `${product} runtime acceptance gate no longer records interrupt cleanup/fail anchors.`,
      })
    }
    if (item.nativeReplayStatus !== "partial-native-anchored") {
      issues.push({
        id: "runtime-acceptance.native-replay-status",
        product,
        dimension: "accept-continue-timing",
        message: `${product} runtime acceptance gate is assembled-inferred-only and cannot be promoted toward native replay.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildRuntimeAcceptanceLifecycleReplayGateCase(snapshot: RuntimeAcceptanceReplaySnapshot): RuntimeAcceptanceLifecycleReplayGateCase {
  const timingScenarios = snapshot.timingBoundary.scenarios
  const lifecycleScenarios = snapshot.lifecycle.scenarios
  const persistenceScenarios = snapshot.persistenceCleanup.scenarios
  const observedScenarioIDs = runtimeAcceptanceGateScenarioIDs(snapshot, "observed")
  const inferredScenarioIDs = runtimeAcceptanceGateScenarioIDs(snapshot, "inferred")
  const knownLossiness = uniqueStrings([
    ...snapshot.knownGaps,
    ...snapshot.timingBoundary.lossyFields,
    ...snapshot.lifecycle.lossyFields,
    ...snapshot.persistenceCleanup.lossyFields,
    ...snapshot.atoms.flatMap((atom) => atom.lossyFields),
  ])
  return {
    product: snapshot.product,
    upstreamRef: snapshot.upstreamRef,
    evidenceRefs: uniqueStrings([
      snapshot.evidenceRef,
      snapshot.timingBoundary.evidenceRef,
      snapshot.lifecycle.evidenceRef,
      snapshot.persistenceCleanup.evidenceRef,
      ...snapshot.atoms.flatMap((atom) => atom.upstreamEvidenceRefs),
    ]),
    fixtureIDs: snapshot.fixtureIDs,
    lifecycleStartStop: uniqueStrings([
      ...lifecycleScenarios.flatMap((scenario) => [scenario.scenarioID, scenario.nativeLifecycleSurface, scenario.triggerEvent, ...scenario.sideEffectRecords]),
      ...timingScenarios.flatMap((scenario) => [scenario.scenarioID, scenario.nativeLoopSurface, scenario.triggerEvent]),
    ]),
    acceptContinueTiming: uniqueStrings(timingScenarios.flatMap((scenario) => [
      scenario.scenarioID,
      scenario.triggerEvent,
      scenario.evidenceAvailableAt,
      scenario.decisionEvent,
      ...scenario.timingBuckets,
      scenario.sideEffectSurface,
    ])),
    processCleanup: uniqueStrings([
      ...persistenceScenarios.flatMap((scenario) => [scenario.scenarioID, scenario.nativePersistenceSurface, scenario.triggerEvent, ...scenario.cleanupRecords, ...scenario.sideEffectOrder]),
      ...lifecycleScenarios.flatMap((scenario) => [scenario.scenarioID, scenario.nativeLifecycleSurface, ...scenario.sideEffectRecords]),
    ]),
    evidencePersistence: uniqueStrings([
      ...lifecycleScenarios.flatMap((scenario) => [scenario.scenarioID, ...scenario.evidenceRecordTypes, ...scenario.sideEffectRecords]),
      ...persistenceScenarios.flatMap((scenario) => [scenario.scenarioID, ...scenario.persistenceRecords, ...scenario.sideEffectOrder]),
    ]),
    interruptPath: uniqueStrings([
      ...timingScenarios.filter((scenario) => scenario.scenarioID.includes("interrupt")).flatMap((scenario) => [scenario.scenarioID, scenario.triggerEvent, scenario.decisionEvent, scenario.sideEffectSurface, ...scenario.timingBuckets]),
      ...lifecycleScenarios.filter((scenario) => scenario.scenarioID.includes("interrupt")).flatMap((scenario) => [scenario.scenarioID, scenario.triggerEvent, scenario.decisionEvent, ...scenario.evidenceRecordTypes, ...scenario.sideEffectRecords]),
      ...persistenceScenarios.filter((scenario) => scenario.scenarioID.includes("interrupt")).flatMap((scenario) => [scenario.scenarioID, scenario.triggerEvent, scenario.decisionEvent, ...scenario.persistenceRecords, ...scenario.cleanupRecords, ...scenario.sideEffectOrder]),
    ]),
    nativeReplayStatus: observedScenarioIDs.length > 0 && snapshot.profile.nativeFixtureSource !== "none" ? "partial-native-anchored" : "assembled-inferred-only",
    observedScenarioIDs,
    inferredScenarioIDs,
    knownLossiness,
  }
}

function runtimeAcceptanceGateScenarioIDs(snapshot: RuntimeAcceptanceReplaySnapshot, visibility: "observed" | "inferred"): string[] {
  return uniqueStrings([
    ...snapshot.timingBoundary.scenarios.filter((scenario) => scenario.visibility === visibility).map((scenario) => `timing:${scenario.scenarioID}`),
    ...snapshot.lifecycle.scenarios.filter((scenario) => scenario.visibility === visibility).map((scenario) => `lifecycle:${scenario.scenarioID}`),
    ...snapshot.persistenceCleanup.scenarios.filter((scenario) => scenario.visibility === visibility).map((scenario) => `persistence-cleanup:${scenario.scenarioID}`),
    ...snapshot.atoms.flatMap((atom) => atom.scenarios.filter((scenario) => scenario.visibility === visibility).map((scenario) => `${atom.key}:${scenario.scenarioID}`)),
  ])
}

function runtimeAcceptanceGateContains(values: string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

export type RuntimeAcceptanceExactDiffBlockerProduct = RuntimeAcceptanceReplayProduct
export type RuntimeAcceptanceExactDiffBlockerDimension = RuntimeAcceptanceLifecycleReplayGateDimension

export interface RuntimeAcceptanceExactDiffBlockerCase {
  product: RuntimeAcceptanceExactDiffBlockerProduct
  upstreamRef: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  lifecycleStartStop: string[]
  acceptContinueTiming: string[]
  processCleanup: string[]
  evidencePersistence: string[]
  interruptPath: string[]
  runtimeEvidenceAnchors: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "assembled-inferred-only"
  knownLossiness: string[]
}

export interface RuntimeAcceptanceExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:runtime-acceptance-exact-diff-blocker-gate"
  fixtureID: "runtime:acceptance-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: RuntimeAcceptanceExactDiffBlockerProduct[]
  comparisonDimensions: RuntimeAcceptanceExactDiffBlockerDimension[]
  cases: RuntimeAcceptanceExactDiffBlockerCase[]
  fingerprint: string
}

export interface RuntimeAcceptanceExactDiffBlockerIssue {
  id: string
  product: RuntimeAcceptanceExactDiffBlockerProduct
  dimension: RuntimeAcceptanceExactDiffBlockerDimension
  message: string
}

export interface RuntimeAcceptanceExactDiffBlockerVerification {
  ok: boolean
  issues: RuntimeAcceptanceExactDiffBlockerIssue[]
}

export type OpenCodeRuntimeLoopAcceptanceBoundaryBranchID =
  | "provider-finish-to-acceptance"
  | "tool-result-to-acceptance"
  | "session-writeback-readback"
  | "summary-stop-boundary"
  | "cleanup-side-effects"

export type OpenCodeRuntimeLoopAcceptanceBoundaryTurnDimension =
  | "provider-step"
  | "tool-step"
  | "summary-step"
  | "run-turn"

export type OpenCodeRuntimeLoopAcceptanceBoundaryEvent =
  | {
    type: "turn.step"
    branchID: OpenCodeRuntimeLoopAcceptanceBoundaryBranchID
    stepID: string
    turnDimension: OpenCodeRuntimeLoopAcceptanceBoundaryTurnDimension
    sourceAnchor: string
    sideEffectID?: string
    eventKeys: string[]
    sequence: number
  }
  | {
    type: "acceptance.decision"
    decision: RuntimeAcceptanceDecision
    satisfiedAt: RuntimeAcceptanceEvidenceAvailability
    evidenceKeys: string[]
    persistenceKeys: string[]
    sequence: number
  }
  | {
    type: "cleanup.side-effect"
    surface: "provider" | "tool" | "session" | "process" | "ui"
    operation: string
    recordID?: string
    exactOrderObserved?: boolean
    sequence: number
  }

export interface OpenCodeRuntimeLoopAcceptanceBoundaryProjection {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  fixtureID: "opencode-runtime:loop-acceptance-boundary-projection"
  evidenceRef: "conformance:opencode-runtime-loop-acceptance-boundary-projection"
  coveredBranchIDs: OpenCodeRuntimeLoopAcceptanceBoundaryBranchID[]
  retainedFields: string[]
  lossyFields: string[]
  turnSteps: Array<{
    branchID: OpenCodeRuntimeLoopAcceptanceBoundaryBranchID
    stepID: string
    turnDimension: OpenCodeRuntimeLoopAcceptanceBoundaryTurnDimension
    sourceAnchor: string
    sideEffectID: string | null
    eventKeys: string[]
    sequence: number
  }>
  acceptanceDecisions: Array<{
    decision: RuntimeAcceptanceDecision
    satisfiedAt: RuntimeAcceptanceEvidenceAvailability
    evidenceKeys: string[]
    persistenceKeys: string[]
    sequence: number
  }>
  cleanupSideEffects: Array<{
    surface: "provider" | "tool" | "session" | "process" | "ui"
    operation: string
    recordIDObserved: boolean
    exactOrderObserved: boolean
    sequence: number
  }>
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeRuntimeLoopAcceptanceBoundaryProjectionIssue {
  id: string
  branchID: OpenCodeRuntimeLoopAcceptanceBoundaryBranchID
  message: string
}

export interface OpenCodeRuntimeLoopAcceptanceBoundaryProjectionVerification {
  ok: boolean
  issues: OpenCodeRuntimeLoopAcceptanceBoundaryProjectionIssue[]
}

const OPENCODE_RUNTIME_LOOP_ACCEPTANCE_BOUNDARY_BRANCH_ORDER: OpenCodeRuntimeLoopAcceptanceBoundaryBranchID[] = [
  "provider-finish-to-acceptance",
  "tool-result-to-acceptance",
  "session-writeback-readback",
  "summary-stop-boundary",
  "cleanup-side-effects",
]

export function projectOpenCodeRuntimeLoopAcceptanceBoundary(
  events: OpenCodeRuntimeLoopAcceptanceBoundaryEvent[],
): OpenCodeRuntimeLoopAcceptanceBoundaryProjection {
  const turnSteps = events
    .filter((event): event is Extract<OpenCodeRuntimeLoopAcceptanceBoundaryEvent, { type: "turn.step" }> => event.type === "turn.step")
    .map((event) => ({
      branchID: event.branchID,
      stepID: event.stepID,
      turnDimension: event.turnDimension,
      sourceAnchor: event.sourceAnchor,
      sideEffectID: typeof event.sideEffectID === "string" && event.sideEffectID.length > 0 ? event.sideEffectID : null,
      eventKeys: uniqueStrings(event.eventKeys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.branchID.localeCompare(right.branchID) || left.stepID.localeCompare(right.stepID))

  const acceptanceDecisions = events
    .filter((event): event is Extract<OpenCodeRuntimeLoopAcceptanceBoundaryEvent, { type: "acceptance.decision" }> => event.type === "acceptance.decision")
    .map((event) => ({
      decision: event.decision,
      satisfiedAt: event.satisfiedAt,
      evidenceKeys: uniqueStrings(event.evidenceKeys),
      persistenceKeys: uniqueStrings(event.persistenceKeys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.decision.localeCompare(right.decision))

  const cleanupSideEffects = events
    .filter((event): event is Extract<OpenCodeRuntimeLoopAcceptanceBoundaryEvent, { type: "cleanup.side-effect" }> => event.type === "cleanup.side-effect")
    .map((event) => ({
      surface: event.surface,
      operation: event.operation,
      recordIDObserved: typeof event.recordID === "string" && event.recordID.length > 0,
      exactOrderObserved: event.exactOrderObserved === true,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.surface.localeCompare(right.surface) || left.operation.localeCompare(right.operation))

  const covered = new Set<OpenCodeRuntimeLoopAcceptanceBoundaryBranchID>(turnSteps.map((step) => step.branchID))
  if (cleanupSideEffects.length > 0) covered.add("cleanup-side-effects")
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    fixtureID: "opencode-runtime:loop-acceptance-boundary-projection" as const,
    evidenceRef: "conformance:opencode-runtime-loop-acceptance-boundary-projection" as const,
    coveredBranchIDs: OPENCODE_RUNTIME_LOOP_ACCEPTANCE_BOUNDARY_BRANCH_ORDER.filter((branchID) => covered.has(branchID)),
    retainedFields: [
      "branchID",
      "stepID",
      "turnDimension",
      "sourceAnchor",
      "sideEffectID",
      "eventKeys",
      "decision",
      "satisfiedAt",
      "evidenceKeys",
      "persistenceKeys",
      "surface",
      "operation",
      "recordIDObserved",
      "exactOrderObserved",
      "sequence",
    ],
    lossyFields: [
      "native loop wall-clock timing",
      "turn event object identity",
      "provider finish raw payload identity",
      "tool result message-v2 part identity",
      "sqlite session write transaction boundaries",
      "acceptance evidence readback ordering",
      "process cleanup side effects",
    ],
    turnSteps,
    acceptanceDecisions,
    cleanupSideEffects,
    knownGaps: [
      "opencode-runtime-loop-acceptance-boundary-projection-partial-fixture",
      "opencode-full-native-loop-timing-not-replayed",
      "opencode-turn-to-acceptance-event-object-identity-not-exact",
      "opencode-runtime-acceptance-persistence-readback-not-exact",
      "opencode-runtime-cleanup-side-effects-not-exact",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeRuntimeLoopAcceptanceBoundaryProjection(
  projection: OpenCodeRuntimeLoopAcceptanceBoundaryProjection,
): OpenCodeRuntimeLoopAcceptanceBoundaryProjectionVerification {
  const issues: OpenCodeRuntimeLoopAcceptanceBoundaryProjectionIssue[] = []
  for (const branchID of OPENCODE_RUNTIME_LOOP_ACCEPTANCE_BOUNDARY_BRANCH_ORDER) {
    if (!projection.coveredBranchIDs.includes(branchID)) {
      issues.push({
        id: "opencode-runtime-loop-acceptance-boundary.missing-branch",
        branchID,
        message: `OpenCode runtime loop acceptance boundary projection no longer covers ${branchID}.`,
      })
    }
  }
  if (!projection.knownGaps.includes("opencode-runtime-loop-acceptance-boundary-projection-partial-fixture")) {
    issues.push({
      id: "opencode-runtime-loop-acceptance-boundary.native-claim",
      branchID: "provider-finish-to-acceptance",
      message: "OpenCode runtime loop acceptance boundary projection must remain a partial fixture until live native loop exactness is proven.",
    })
  }
  if (!runtimeAcceptanceGateContains(projection.lossyFields, /wall-clock|object identity|transaction|cleanup|readback/i)) {
    issues.push({
      id: "opencode-runtime-loop-acceptance-boundary.lossiness",
      branchID: "summary-stop-boundary",
      message: "OpenCode runtime loop acceptance boundary projection no longer records native loop lossiness.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildRuntimeAcceptanceExactDiffBlockerSnapshot(): RuntimeAcceptanceExactDiffBlockerSnapshot {
  const replayGate = buildRuntimeAcceptanceLifecycleReplayGateSnapshot()
  const cases = replayGate.cases.map(buildRuntimeAcceptanceExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:runtime-acceptance-exact-diff-blocker-gate" as const,
    fixtureID: "runtime:acceptance-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["lifecycle-start-stop", "accept-continue-timing", "process-cleanup", "evidence-persistence", "interrupt-path"] as RuntimeAcceptanceExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyRuntimeAcceptanceExactDiffBlockerSnapshot(
  snapshot: RuntimeAcceptanceExactDiffBlockerSnapshot,
): RuntimeAcceptanceExactDiffBlockerVerification {
  const issues: RuntimeAcceptanceExactDiffBlockerIssue[] = []
  for (const product of runtimeAcceptanceReplayProducts) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "runtime-acceptance-exact-diff.missing-product",
        product,
        dimension: "lifecycle-start-stop",
        message: `Missing runtime acceptance exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "runtime-acceptance-exact-diff.native-claim",
        product,
        dimension: "accept-continue-timing",
        message: `${product} runtime acceptance blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!runtimeAcceptanceGateContains(item.lifecycleStartStop, /lifecycle|finalization|provider-finish|message_stop|finish|start|stop/i)) {
      issues.push({
        id: "runtime-acceptance-exact-diff.lifecycle-start-stop",
        product,
        dimension: "lifecycle-start-stop",
        message: `${product} runtime acceptance blocker no longer records lifecycle start/stop anchors.`,
      })
    }
    if (!runtimeAcceptanceGateContains(item.acceptContinueTiming, /acceptance-check|policy-satisfied|continue|accept|summarize|tool-result|message-end/i)) {
      issues.push({
        id: "runtime-acceptance-exact-diff.accept-continue-timing",
        product,
        dimension: "accept-continue-timing",
        message: `${product} runtime acceptance blocker no longer records accept/continue timing anchors.`,
      })
    }
    if (!runtimeAcceptanceGateContains(item.processCleanup, /cleanup|abort|cancel|process|worker/i)) {
      issues.push({
        id: "runtime-acceptance-exact-diff.process-cleanup",
        product,
        dimension: "process-cleanup",
        message: `${product} runtime acceptance blocker no longer records process cleanup anchors.`,
      })
    }
    if (!runtimeAcceptanceGateContains(item.evidencePersistence, /evidence|persistence|persisted|record|write|jsonl|sqlite|session|memory/i)) {
      issues.push({
        id: "runtime-acceptance-exact-diff.evidence-persistence",
        product,
        dimension: "evidence-persistence",
        message: `${product} runtime acceptance blocker no longer records evidence persistence anchors.`,
      })
    }
    if (!runtimeAcceptanceGateContains(item.interruptPath, /interrupt|cancel|fail|cleanup|abort/i)) {
      issues.push({
        id: "runtime-acceptance-exact-diff.interrupt-path",
        product,
        dimension: "interrupt-path",
        message: `${product} runtime acceptance blocker no longer records interrupt cleanup/fail anchors.`,
      })
    }
    if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.runtimeEvidenceAnchors.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "runtime-acceptance-exact-diff.assembled-inferred-only",
        product,
        dimension: "accept-continue-timing",
        message: `${product} runtime acceptance blocker is not anchored to partial native runtime evidence.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildRuntimeAcceptanceExactDiffBlockerCase(
  replayCase: RuntimeAcceptanceLifecycleReplayGateCase,
): RuntimeAcceptanceExactDiffBlockerCase {
  return {
    product: replayCase.product,
    upstreamRef: replayCase.upstreamRef,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    lifecycleStartStop: uniqueStrings([
      ...replayCase.lifecycleStartStop,
      "native-lifecycle-start-stop:exact-diff-not-proven",
    ]),
    acceptContinueTiming: uniqueStrings([
      ...replayCase.acceptContinueTiming,
      "accept-continue-timing:exact-diff-not-proven",
    ]),
    processCleanup: uniqueStrings([
      ...replayCase.processCleanup,
      "process-cleanup-side-effects:exact-diff-not-proven",
    ]),
    evidencePersistence: uniqueStrings([
      ...replayCase.evidencePersistence,
      "evidence-persistence-readback:exact-diff-not-proven",
    ]),
    interruptPath: uniqueStrings([
      ...replayCase.interruptPath,
      "interrupt-cleanup-path:exact-diff-not-proven",
    ]),
    runtimeEvidenceAnchors: uniqueStrings([
      ...replayCase.evidenceRefs,
      ...replayCase.fixtureIDs,
      ...replayCase.observedScenarioIDs,
    ]),
    fixtureIDs: replayCase.fixtureIDs,
    nativeEvidenceRefs: uniqueStrings(replayCase.evidenceRefs),
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...replayCase.knownLossiness,
      "runtime-acceptance-native-lifecycle-exact-diff-not-proven",
      "runtime-acceptance-stop-continue-timing-exact-diff-not-proven",
      "runtime-acceptance-cleanup-side-effects-exact-diff-not-proven",
      "runtime-acceptance-evidence-persistence-readback-not-proven",
      "runtime-acceptance-interrupt-path-exact-diff-not-proven",
    ]),
  }
}

export type RuntimeAcceptancePinnedReplayProduct = RuntimeAcceptanceReplayProduct
export type RuntimeAcceptancePinnedReplayDimension = RuntimeAcceptanceLifecycleReplayGateDimension

export interface RuntimeAcceptancePinnedReplayRecord {
  dimension: RuntimeAcceptancePinnedReplayDimension
  eventID: string
  value: string
  sourceAnchor: string
  evidenceAnchor: string
  sequence: number
}

export interface RuntimeAcceptancePinnedReplayCase {
  product: RuntimeAcceptancePinnedReplayProduct
  upstreamRef: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  upstreamTrace: RuntimeAcceptancePinnedReplayRecord[]
  productReplayTrace: RuntimeAcceptancePinnedReplayRecord[]
  assembledTrace: RuntimeAcceptancePinnedReplayRecord[]
  replayAnchors: string[]
  runtimeEvidenceAnchors: string[]
  exactDiffRisk: "pinned-runtime-replay-needs-live-native-runtime" | "assembled-inferred-only"
  knownLossiness: string[]
}

export interface RuntimeAcceptancePinnedReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:runtime-acceptance-pinned-replay-gate"
  fixtureID: "runtime:acceptance-pinned-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: RuntimeAcceptancePinnedReplayProduct[]
  comparisonDimensions: RuntimeAcceptancePinnedReplayDimension[]
  cases: RuntimeAcceptancePinnedReplayCase[]
  fingerprint: string
}

export interface RuntimeAcceptancePinnedReplayIssue {
  id: string
  product: RuntimeAcceptancePinnedReplayProduct
  dimension: RuntimeAcceptancePinnedReplayDimension
  message: string
}

export interface RuntimeAcceptancePinnedReplayVerification {
  ok: boolean
  issues: RuntimeAcceptancePinnedReplayIssue[]
}

const runtimeAcceptancePinnedReplayDimensions: RuntimeAcceptancePinnedReplayDimension[] = [
  "lifecycle-start-stop",
  "accept-continue-timing",
  "process-cleanup",
  "evidence-persistence",
  "interrupt-path",
]

export function buildRuntimeAcceptancePinnedReplaySnapshot(): RuntimeAcceptancePinnedReplaySnapshot {
  const replayGate = buildRuntimeAcceptanceLifecycleReplayGateSnapshot()
  const cases = replayGate.cases.map(buildRuntimeAcceptancePinnedReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:runtime-acceptance-pinned-replay-gate" as const,
    fixtureID: "runtime:acceptance-pinned-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: runtimeAcceptancePinnedReplayDimensions,
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyRuntimeAcceptancePinnedReplaySnapshot(
  snapshot: RuntimeAcceptancePinnedReplaySnapshot,
): RuntimeAcceptancePinnedReplayVerification {
  const issues: RuntimeAcceptancePinnedReplayIssue[] = []
  for (const product of runtimeAcceptanceReplayProducts) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "runtime-acceptance-pinned-replay.missing-product",
        product,
        dimension: "lifecycle-start-stop",
        message: `Missing runtime acceptance pinned replay case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "runtime-acceptance-pinned-replay.native-claim",
        product,
        dimension: "accept-continue-timing",
        message: `${product} runtime acceptance pinned replay must remain partial and cannot claim native parity.`,
      })
    }
    if (
      !runtimeAcceptancePinnedReplayOrderMatches(item.upstreamTrace)
      || !runtimeAcceptancePinnedReplayOrderMatches(item.productReplayTrace)
      || !runtimeAcceptancePinnedReplayOrderMatches(item.assembledTrace)
    ) {
      issues.push({
        id: "runtime-acceptance-pinned-replay.order",
        product,
        dimension: "lifecycle-start-stop",
        message: `${product} runtime acceptance pinned replay order no longer covers all dimensions.`,
      })
    }
    for (const dimension of runtimeAcceptancePinnedReplayDimensions) {
      const upstreamRecord = runtimeAcceptancePinnedReplayTraceRecord(item.upstreamTrace, dimension)
      const productReplayRecord = runtimeAcceptancePinnedReplayTraceRecord(item.productReplayTrace, dimension)
      const assembledRecord = runtimeAcceptancePinnedReplayTraceRecord(item.assembledTrace, dimension)
      if (!upstreamRecord || !productReplayRecord || !assembledRecord) {
        issues.push({
          id: `runtime-acceptance-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} runtime acceptance pinned replay no longer records ${dimension}.`,
        })
        continue
      }
      if (
        !runtimeAcceptancePinnedReplayRecordMatches(upstreamRecord, productReplayRecord)
        || !runtimeAcceptancePinnedReplayRecordMatches(upstreamRecord, assembledRecord)
      ) {
        issues.push({
          id: `runtime-acceptance-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} runtime acceptance ${dimension} replay drifted from the pinned upstream trace.`,
        })
      }
    }
    if (item.exactDiffRisk !== "pinned-runtime-replay-needs-live-native-runtime" || item.replayAnchors.length === 0 || item.runtimeEvidenceAnchors.length === 0) {
      issues.push({
        id: "runtime-acceptance-pinned-replay.assembled-inferred-only",
        product,
        dimension: "accept-continue-timing",
        message: `${product} runtime acceptance pinned replay is not anchored to partial native runtime evidence.`,
      })
    }
    if (product !== "opencode" && item.runtimeEvidenceAnchors.some((anchor) => anchor.includes("opencode"))) {
      issues.push({
        id: "runtime-acceptance-pinned-replay.borrowed-source-matrix",
        product,
        dimension: "lifecycle-start-stop",
        message: `${product} runtime acceptance pinned replay cannot borrow OpenCode runtime anchors.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildRuntimeAcceptancePinnedReplayCase(
  replayCase: RuntimeAcceptanceLifecycleReplayGateCase,
): RuntimeAcceptancePinnedReplayCase {
  const upstreamTrace = runtimeAcceptancePinnedReplayRecords(replayCase.product)
  return {
    product: replayCase.product,
    upstreamRef: replayCase.upstreamRef,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    upstreamTrace,
    productReplayTrace: upstreamTrace.map(runtimeAcceptancePinnedReplayRecordClone),
    assembledTrace: upstreamTrace.map(runtimeAcceptancePinnedReplayRecordClone),
    replayAnchors: uniqueStrings([
      ...replayCase.evidenceRefs,
      ...replayCase.fixtureIDs,
    ]),
    runtimeEvidenceAnchors: uniqueStrings([
      ...replayCase.lifecycleStartStop,
      ...replayCase.acceptContinueTiming,
      ...replayCase.processCleanup,
      ...replayCase.evidencePersistence,
      ...replayCase.interruptPath,
      ...replayCase.observedScenarioIDs,
    ]),
    exactDiffRisk: "pinned-runtime-replay-needs-live-native-runtime",
    knownLossiness: uniqueStrings([
      ...replayCase.knownLossiness,
      "runtime-acceptance-pinned-replay-live-native-lifecycle-not-proven",
      "runtime-acceptance-pinned-replay-stop-continue-wall-clock-not-proven",
      "runtime-acceptance-pinned-replay-cleanup-side-effects-not-proven",
      "runtime-acceptance-pinned-replay-evidence-readback-not-proven",
      "runtime-acceptance-pinned-replay-interrupt-cleanup-not-proven",
    ]),
  }
}

function runtimeAcceptancePinnedReplayRecords(product: RuntimeAcceptancePinnedReplayProduct): RuntimeAcceptancePinnedReplayRecord[] {
  if (product === "opencode") {
    return [
      runtimeAcceptancePinnedReplayRecord(product, 1, "lifecycle-start-stop", "provider-finish->acceptance-check->summary-stop", "opencode-runtime:provider-finish-message-end", "opencode-runtime-acceptance:lifecycle"),
      runtimeAcceptancePinnedReplayRecord(product, 2, "accept-continue-timing", "message-end:policy-satisfied:summarize", "opencode-runtime:summary-stop-boundary", "opencode-runtime-acceptance:timing-boundary"),
      runtimeAcceptancePinnedReplayRecord(product, 3, "process-cleanup", "abort-reader-cleanup-after-summary", "opencode-runtime:cleanup-side-effects", "opencode-runtime-acceptance:persistence-cleanup"),
      runtimeAcceptancePinnedReplayRecord(product, 4, "evidence-persistence", "sqlite-session-write/readback:acceptance-record", "opencode-runtime:session-writeback-readback", "opencode-runtime-acceptance:persistence-cleanup"),
      runtimeAcceptancePinnedReplayRecord(product, 5, "interrupt-path", "abort-signal->cleanup->fail-lifecycle", "opencode-runtime:interrupt-boundary", "opencode-runtime-acceptance:lifecycle"),
    ]
  }
  if (product === "pi-mono") {
    return [
      runtimeAcceptancePinnedReplayRecord(product, 1, "lifecycle-start-stop", "AgentHarness.start->coding-agent.accept", "pi-runtime:agent-harness-lifecycle", "pi-mono-runtime-acceptance:lifecycle"),
      runtimeAcceptancePinnedReplayRecord(product, 2, "accept-continue-timing", "tool-result-after:continue-boundary->accept", "pi-runtime:session-replacement-timing", "pi-mono-runtime-acceptance:timing-boundary"),
      runtimeAcceptancePinnedReplayRecord(product, 3, "process-cleanup", "branch/fork/switch cleanup after session replacement", "pi-runtime:branch-fork-switch-cleanup", "pi-mono-runtime-acceptance:persistence-cleanup"),
      runtimeAcceptancePinnedReplayRecord(product, 4, "evidence-persistence", "jsonl-session-write/readback:acceptance-record", "pi-runtime:jsonl-session-tree", "pi-mono-runtime-acceptance:persistence-cleanup"),
      runtimeAcceptancePinnedReplayRecord(product, 5, "interrupt-path", "branch-switch interrupt->cleanup->continue", "pi-runtime:interrupt-cleanup-boundary", "pi-mono-runtime-acceptance:lifecycle"),
    ]
  }
  if (product === "nanobot") {
    return [
      runtimeAcceptancePinnedReplayRecord(product, 1, "lifecycle-start-stop", "runtime-state.started->finalization.retry->accept", "nanobot-runtime:state-finalization", "nanobot-runtime-acceptance:lifecycle"),
      runtimeAcceptancePinnedReplayRecord(product, 2, "accept-continue-timing", "tool-result-recovery:policy-satisfied->accept", "nanobot-runtime:tool-result-recovery", "nanobot-runtime-acceptance:timing-boundary"),
      runtimeAcceptancePinnedReplayRecord(product, 3, "process-cleanup", "length-recovery cleanup before workspace violation check", "nanobot-runtime:length-recovery-cleanup", "nanobot-runtime-acceptance:persistence-cleanup"),
      runtimeAcceptancePinnedReplayRecord(product, 4, "evidence-persistence", "memory/session-state readback after finalization", "nanobot-runtime:memory-state-readback", "nanobot-runtime-acceptance:persistence-cleanup"),
      runtimeAcceptancePinnedReplayRecord(product, 5, "interrupt-path", "workspace-violation->interrupt-cleanup-fail-lifecycle", "nanobot-runtime:workspace-violation-interrupt", "nanobot-runtime-acceptance:lifecycle"),
    ]
  }
  return [
    runtimeAcceptancePinnedReplayRecord(product, 1, "lifecycle-start-stop", "api-worker.start->pending-steer->force-close", "hermes-runtime:api-worker-lifecycle", "hermes-agent-runtime-acceptance:lifecycle"),
    runtimeAcceptancePinnedReplayRecord(product, 2, "accept-continue-timing", "tool-result-application:policy-satisfied->accept", "hermes-runtime:pending-tool-result-application", "hermes-agent-runtime-acceptance:timing-boundary"),
    runtimeAcceptancePinnedReplayRecord(product, 3, "process-cleanup", "transport recovery cleanup before helper close", "hermes-runtime:transport-recovery-cleanup", "hermes-agent-runtime-acceptance:persistence-cleanup"),
    runtimeAcceptancePinnedReplayRecord(product, 4, "evidence-persistence", "trajectory/tool-result persisted-readback", "hermes-runtime:trajectory-readback", "hermes-agent-runtime-acceptance:persistence-cleanup"),
    runtimeAcceptancePinnedReplayRecord(product, 5, "interrupt-path", "force-close->helper-cleanup->failed lifecycle", "hermes-runtime:force-close-cleanup", "hermes-agent-runtime-acceptance:lifecycle"),
  ]
}

function runtimeAcceptancePinnedReplayRecord(
  product: RuntimeAcceptancePinnedReplayProduct,
  sequence: number,
  dimension: RuntimeAcceptancePinnedReplayDimension,
  value: string,
  sourceAnchor: string,
  evidenceAnchor: string,
): RuntimeAcceptancePinnedReplayRecord {
  return {
    dimension,
    eventID: `${product}:runtime-acceptance:${sequence}`,
    value,
    sourceAnchor,
    evidenceAnchor,
    sequence,
  }
}

function runtimeAcceptancePinnedReplayRecordClone(
  record: RuntimeAcceptancePinnedReplayRecord,
): RuntimeAcceptancePinnedReplayRecord {
  return { ...record }
}

function runtimeAcceptancePinnedReplayTraceRecord(
  records: RuntimeAcceptancePinnedReplayRecord[],
  dimension: RuntimeAcceptancePinnedReplayDimension,
): RuntimeAcceptancePinnedReplayRecord | undefined {
  return records.find((record) => record.dimension === dimension)
}

function runtimeAcceptancePinnedReplayRecordMatches(
  upstreamRecord: RuntimeAcceptancePinnedReplayRecord,
  candidateRecord: RuntimeAcceptancePinnedReplayRecord,
): boolean {
  return runtimeAcceptancePinnedReplayRecordSignature(upstreamRecord) === runtimeAcceptancePinnedReplayRecordSignature(candidateRecord)
}

function runtimeAcceptancePinnedReplayOrderMatches(records: RuntimeAcceptancePinnedReplayRecord[]): boolean {
  return records.map((record) => `${record.sequence}:${record.dimension}`).join("|") === runtimeAcceptancePinnedReplayDimensions.map((dimension, index) => `${index + 1}:${dimension}`).join("|")
}

function runtimeAcceptancePinnedReplayRecordSignature(record: RuntimeAcceptancePinnedReplayRecord | undefined): string {
  if (!record) return "<missing>"
  return stableStringify({
    dimension: record.dimension,
    eventID: record.eventID,
    value: record.value,
    sourceAnchor: record.sourceAnchor,
    evidenceAnchor: record.evidenceAnchor,
    sequence: record.sequence,
  })
}

export function buildRuntimeAcceptanceReplayAtomSnapshot(
  product: RuntimeAcceptanceReplayProduct,
  key: RuntimeAcceptanceReplayAtomKey,
  timingBoundary = buildRuntimeAcceptanceTimingBoundarySnapshot(product),
  lifecycle = buildRuntimeAcceptanceLifecycleSnapshot(product),
  persistenceCleanup = buildRuntimeAcceptancePersistenceCleanupSnapshot(product),
): RuntimeAcceptanceReplayAtomSnapshot {
  const profile = acceptanceProfiles[product]
  return {
    key,
    atomID: key === "acceptance-controller" ? profile.controllerID : profile.evidenceID,
    portID: key === "acceptance-controller" ? "runtime.acceptance-controller" : "runtime.acceptance-evidence",
    flowStageID: "acceptance.check",
    timingBoundaryFingerprint: timingBoundary.fingerprint,
    timingBoundaryFixtureID: timingBoundary.fixtureID,
    lifecycleFingerprint: lifecycle.fingerprint,
    lifecycleFixtureID: lifecycle.fixtureID,
    persistenceCleanupFingerprint: persistenceCleanup.fingerprint,
    persistenceCleanupFixtureID: persistenceCleanup.fixtureID,
    nativeFixtureSource: profile.nativeFixtureSource,
    upstreamEvidenceRefs: runtimeAcceptanceUpstreamEvidenceRefs(product, key),
    fixtureID: runtimeAcceptanceReplayFixtureID(product, key),
    scenarios: runtimeAcceptanceReplayScenarios(product, key),
    observedFields: uniqueStrings([...runtimeAcceptanceObservedFields(product, key), ...runtimeAcceptanceLifecycleObservedFields(product), ...runtimeAcceptancePersistenceCleanupObservedFields(product)]),
    inferredFields: uniqueStrings([...runtimeAcceptanceInferredFields(product, key), ...runtimeAcceptanceLifecycleInferredFields(product), ...runtimeAcceptancePersistenceCleanupInferredFields(product)]),
    lossyFields: uniqueStrings([...runtimeAcceptanceLossyFields(product, key), ...runtimeAcceptanceLifecycleLossyFields(product), ...runtimeAcceptancePersistenceCleanupLossyFields(product)]),
  }
}

export function runtimeAcceptanceReplayFixtureID(product: RuntimeAcceptanceReplayProduct, key: RuntimeAcceptanceReplayAtomKey): string {
  return `${product}-runtime-acceptance:${key}`
}

export function runtimeAcceptanceTimingBoundaryFixtureID(product: RuntimeAcceptanceReplayProduct): string {
  return `${product}-runtime-acceptance:timing-boundary`
}

export function runtimeAcceptanceLifecycleFixtureID(product: RuntimeAcceptanceReplayProduct): string {
  return `${product}-runtime-acceptance:lifecycle`
}

export function runtimeAcceptancePersistenceCleanupFixtureID(product: RuntimeAcceptanceReplayProduct): string {
  return `${product}-runtime-acceptance:persistence-cleanup`
}

export function buildRuntimeAcceptanceTimingBoundarySnapshot(product: RuntimeAcceptanceReplayProduct): RuntimeAcceptanceTimingBoundarySnapshot {
  const scenarios = runtimeAcceptanceTimingBoundaryScenarios(product)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: runtimeAcceptanceUpstreamRef(product),
    evidenceRef: `conformance:${product}-runtime-acceptance-timing-boundary`,
    fixtureID: runtimeAcceptanceTimingBoundaryFixtureID(product),
    scenarios,
    observedFields: [
      "nativeLoopSurface",
      "triggerEvent",
      "evidenceAvailableAt",
      "decisionEvent",
      "timingBuckets",
      "sideEffectSurface",
    ],
    inferredFields: runtimeAcceptanceTimingBoundaryInferredFields(product),
    lossyFields: runtimeAcceptanceTimingBoundaryLossyFields(product),
    knownGaps: [
      "full-upstream-stop-continue-timing-not-replayed",
      "process-cleanup-side-effects-not-replayed",
      "native-loop-cancel-race-not-replayed",
      "timestamp-level-acceptance-boundary-not-proven",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildRuntimeAcceptanceLifecycleSnapshot(product: RuntimeAcceptanceReplayProduct): RuntimeAcceptanceLifecycleSnapshot {
  const scenarios = runtimeAcceptanceLifecycleScenarios(product)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: runtimeAcceptanceUpstreamRef(product),
    evidenceRef: `conformance:${product}-runtime-acceptance-lifecycle`,
    fixtureID: runtimeAcceptanceLifecycleFixtureID(product),
    scenarios,
    observedFields: runtimeAcceptanceLifecycleObservedFields(product),
    inferredFields: runtimeAcceptanceLifecycleInferredFields(product),
    lossyFields: runtimeAcceptanceLifecycleLossyFields(product),
    knownGaps: [
      "full-upstream-stop-continue-timing-not-replayed",
      "native-evidence-persistence-order-not-replayed",
      "process-cleanup-side-effects-not-replayed",
      "native-loop-cancel-race-not-replayed",
      "runtime-acceptance-lifecycle-covered-by-partial-fixture",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildRuntimeAcceptancePersistenceCleanupSnapshot(product: RuntimeAcceptanceReplayProduct): RuntimeAcceptancePersistenceCleanupSnapshot {
  const scenarios = runtimeAcceptancePersistenceCleanupScenarios(product)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: runtimeAcceptanceUpstreamRef(product),
    evidenceRef: `conformance:${product}-runtime-acceptance-persistence-cleanup`,
    fixtureID: runtimeAcceptancePersistenceCleanupFixtureID(product),
    scenarios,
    observedFields: runtimeAcceptancePersistenceCleanupObservedFields(product),
    inferredFields: runtimeAcceptancePersistenceCleanupInferredFields(product),
    lossyFields: runtimeAcceptancePersistenceCleanupLossyFields(product),
    knownGaps: [
      "native-evidence-persistence-order-not-replayed",
      "process-cleanup-side-effects-not-replayed",
      "cleanup-side-effect-order-not-full-native",
      "native-loop-cancel-race-not-replayed",
      "runtime-acceptance-persistence-cleanup-covered-by-partial-fixture",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

function runtimeAcceptanceReplayMetadata(
  profile: (typeof acceptanceProfiles)[RuntimeAcceptanceProduct],
  key: RuntimeAcceptanceReplayAtomKey,
): RuntimeAcceptanceReplayAtomSnapshot {
  if (profile.prefix === "common") {
    return commonRuntimeAcceptanceReplayAtomSnapshot(profile, key)
  }
  const product = profile.prefix === "pi" ? "pi-mono" : profile.prefix === "hermes" ? "hermes-agent" : profile.prefix
  return buildRuntimeAcceptanceReplayAtomSnapshot(product as RuntimeAcceptanceReplayProduct, key)
}

function commonRuntimeAcceptanceReplayAtomSnapshot(
  profile: (typeof acceptanceProfiles)[RuntimeAcceptanceProduct],
  key: RuntimeAcceptanceReplayAtomKey,
): RuntimeAcceptanceReplayAtomSnapshot {
  return {
    key,
    atomID: key === "acceptance-controller" ? profile.controllerID : profile.evidenceID,
    portID: key === "acceptance-controller" ? "runtime.acceptance-controller" : "runtime.acceptance-evidence",
    flowStageID: "acceptance.check",
    nativeFixtureSource: profile.nativeFixtureSource,
    upstreamEvidenceRefs: ["common-runtime-acceptance-contract"],
    fixtureID: `common-runtime-acceptance:${key}`,
    scenarios: [
      {
        scenarioID: "read-only",
        taskClass: "read-only-answer",
        providerStopReason: "stop",
        toolOutcome: "none",
        workspaceOutcome: "noop",
        expectedDecision: "continue",
        satisfiedAt: "message-end",
        observedShape: { visibleSummaryPresent: true, policySatisfiedAt: "message-end" },
        visibility: "observed",
      },
    ],
    observedFields: ["checks", "visibleSummaryPresent", "policySatisfiedAt"],
    inferredFields: [],
    lossyFields: [],
  }
}

function runtimeAcceptanceReplayScenarios(product: RuntimeAcceptanceReplayProduct, key: RuntimeAcceptanceReplayAtomKey): RuntimeAcceptanceReplayScenario[] {
  const profile = acceptanceProfiles[product]
  const passDecision = profile.decisionOnPass
  const policyShape = runtimeAcceptancePolicyShape(product)
  const evidenceShape = key === "acceptance-controller" ? { decisionOnPass: passDecision, passReason: profile.passReason } : policyShape
  return [
    {
      scenarioID: "read-only",
      taskClass: "read-only-answer",
      providerStopReason: "stop",
      toolOutcome: "none",
      workspaceOutcome: "noop",
      expectedDecision: passDecision,
      satisfiedAt: product === "opencode" ? "message-end" : "message-end",
      observedShape: { ...evidenceShape, visibleSummaryPresent: true, workspaceDiffCount: 0 },
      visibility: "observed",
    },
    {
      scenarioID: "single-file-edit",
      taskClass: "single-file-edit",
      providerStopReason: "stop",
      toolOutcome: "success",
      workspaceOutcome: "modified",
      expectedDecision: passDecision,
      satisfiedAt: "tool-result-after",
      observedShape: { ...evidenceShape, workspaceDiffStatus: "modified", requiredCommandRan: true },
      visibility: "observed",
    },
    {
      scenarioID: "test-fix",
      taskClass: "test-fix",
      providerStopReason: "stop",
      toolOutcome: "success",
      workspaceOutcome: "test-pass",
      expectedDecision: passDecision,
      satisfiedAt: "tool-result-after",
      observedShape: { ...evidenceShape, testsPassed: true, requiredToolResultAvailableAt: "tool-result-after" },
      visibility: "observed",
    },
    {
      scenarioID: "permission-denied",
      taskClass: "permission-denied",
      providerStopReason: "stop",
      toolOutcome: "denied",
      workspaceOutcome: "blocked",
      expectedDecision: "continue",
      satisfiedAt: "unavailable",
      observedShape: { ...evidenceShape, blockingEvidence: ["permission.ask"], unavailableUntil: "turn-end" },
      visibility: "inferred",
    },
    {
      scenarioID: "tool-error-retry",
      taskClass: "tool-error-retry",
      providerStopReason: "stop",
      toolOutcome: "error-then-success",
      workspaceOutcome: "modified",
      expectedDecision: passDecision,
      satisfiedAt: "tool-result-after",
      observedShape: { ...evidenceShape, retry: "partial", firstToolResult: "error", finalToolResult: "success" },
      visibility: "inferred",
    },
  ]
}

function runtimeAcceptanceTimingBoundaryScenarios(product: RuntimeAcceptanceReplayProduct): RuntimeAcceptanceTimingBoundaryScenario[] {
  const profile = acceptanceProfiles[product]
  const surfaces = runtimeAcceptanceTimingBoundarySurfaces(product)
  return [
    {
      scenarioID: "provider-finish-stop-boundary",
      taskClass: "read-only-answer",
      nativeLoopSurface: surfaces.loop,
      triggerEvent: surfaces.providerFinishEvent,
      evidenceAvailableAt: "message-end",
      decisionEvent: profile.decisionOnPass,
      timingBuckets: ["provider-finish", "message-end", "acceptance-check"],
      sideEffectSurface: surfaces.sideEffects,
      observedShape: {
        providerStopReason: "stop",
        visibleSummaryPresent: true,
        decisionBoundary: product === "opencode" ? "after-final-message" : "after-policy-check",
        timestampExactness: "not-proven",
      },
      visibility: "observed",
    },
    {
      scenarioID: "policy-satisfied-accept-boundary",
      taskClass: "single-file-edit",
      nativeLoopSurface: surfaces.loop,
      triggerEvent: surfaces.toolResultEvent,
      evidenceAvailableAt: "tool-result-after",
      decisionEvent: profile.decisionOnPass,
      timingBuckets: ["tool-result", "workspace-diff", "acceptance-check"],
      sideEffectSurface: surfaces.sideEffects,
      observedShape: {
        workspaceDiffAvailableAt: "tool-result-after",
        policySatisfiedAt: "tool-result-after",
        stopContinueOrder: "partial",
        evidencePersistence: "semantic",
      },
      visibility: "observed",
    },
    {
      scenarioID: "permission-denied-continue-boundary",
      taskClass: "permission-denied",
      nativeLoopSurface: surfaces.loop,
      triggerEvent: surfaces.permissionEvent,
      evidenceAvailableAt: "unavailable",
      decisionEvent: "continue",
      timingBuckets: ["permission-denied", "blocked-evidence", "continue-boundary"],
      sideEffectSurface: surfaces.sideEffects,
      observedShape: {
        blockingEvidence: ["permission.ask"],
        unavailableUntil: "turn-end",
        continueBoundary: "inferred",
        nativeLoopRetry: "not-replayed",
      },
      visibility: "inferred",
    },
    {
      scenarioID: "tool-error-retry-boundary",
      taskClass: "tool-error-retry",
      nativeLoopSurface: surfaces.loop,
      triggerEvent: surfaces.toolErrorEvent,
      evidenceAvailableAt: "tool-result-after",
      decisionEvent: profile.decisionOnPass,
      timingBuckets: ["tool-error", "retry-boundary", "tool-success", "acceptance-check"],
      sideEffectSurface: surfaces.sideEffects,
      observedShape: {
        firstToolResult: "error",
        finalToolResult: "success",
        retryDelay: "bucketed",
        acceptAfterRetry: "partial",
      },
      visibility: "inferred",
    },
    {
      scenarioID: "interrupt-fail-boundary",
      taskClass: "provider-error-or-cancel",
      nativeLoopSurface: surfaces.loop,
      triggerEvent: surfaces.interruptEvent,
      evidenceAvailableAt: "turn-end",
      decisionEvent: "fail",
      timingBuckets: ["interrupt", "cleanup", "fail-boundary"],
      sideEffectSurface: surfaces.cleanup,
      observedShape: {
        processCleanup: "partial",
        terminalDecision: "inferred",
        cancelRace: "not-replayed",
      },
      visibility: "inferred",
    },
  ]
}

function runtimeAcceptanceLifecycleScenarios(product: RuntimeAcceptanceReplayProduct): RuntimeAcceptanceLifecycleScenario[] {
  const profile = acceptanceProfiles[product]
  const surfaces = runtimeAcceptanceLifecycleSurfaces(product)
  return [
    {
      scenarioID: "read-only-finalization-lifecycle",
      taskClass: "read-only-answer",
      nativeLifecycleSurface: surfaces.lifecycle,
      triggerEvent: surfaces.providerFinishRecord,
      evidenceRecordTypes: surfaces.summaryRecords,
      sideEffectRecords: surfaces.finalizationRecords,
      decisionEvent: profile.decisionOnPass,
      observedShape: {
        visibleSummaryPresent: true,
        workspaceDiffCount: 0,
        finalizationRecord: "semantic",
        evidencePersistenceOrder: "partial",
      },
      visibility: "observed",
      lossiness: runtimeAcceptanceLifecycleScenarioLossiness(product, ["native-finalization-record-id-partial"]),
    },
    {
      scenarioID: "policy-pass-evidence-persistence",
      taskClass: "single-file-edit",
      nativeLifecycleSurface: surfaces.lifecycle,
      triggerEvent: surfaces.policyPassRecord,
      evidenceRecordTypes: surfaces.evidenceRecords,
      sideEffectRecords: surfaces.acceptanceRecords,
      decisionEvent: profile.decisionOnPass,
      observedShape: {
        workspaceDiffAvailableAt: "tool-result-after",
        policySatisfiedAt: "tool-result-after",
        evidencePersisted: "semantic",
        acceptanceRecordID: "partial",
      },
      visibility: "observed",
      lossiness: runtimeAcceptanceLifecycleScenarioLossiness(product, ["native-acceptance-record-id-partial"]),
    },
    {
      scenarioID: "permission-denied-continue-lifecycle",
      taskClass: "permission-denied",
      nativeLifecycleSurface: surfaces.lifecycle,
      triggerEvent: surfaces.permissionDeniedRecord,
      evidenceRecordTypes: surfaces.blockedRecords,
      sideEffectRecords: surfaces.continueRecords,
      decisionEvent: "continue",
      observedShape: {
        blockingEvidence: ["permission.ask"],
        unavailableUntil: "turn-end",
        continueRecord: "partial",
        retryQueueOrder: "not-replayed",
      },
      visibility: "inferred",
      lossiness: runtimeAcceptanceLifecycleScenarioLossiness(product, ["permission-denied-continue-record-order-partial"]),
    },
    {
      scenarioID: "tool-error-retry-lifecycle",
      taskClass: "tool-error-retry",
      nativeLifecycleSurface: surfaces.lifecycle,
      triggerEvent: surfaces.toolErrorRecord,
      evidenceRecordTypes: surfaces.retryRecords,
      sideEffectRecords: surfaces.acceptanceRecords,
      decisionEvent: profile.decisionOnPass,
      observedShape: {
        firstToolResult: "error",
        finalToolResult: "success",
        retryRecord: "partial",
        retryDelay: "bucketed",
      },
      visibility: "inferred",
      lossiness: runtimeAcceptanceLifecycleScenarioLossiness(product, ["native-retry-delay-not-exact"]),
    },
    {
      scenarioID: "interrupt-cleanup-fail-lifecycle",
      taskClass: "provider-error-or-cancel",
      nativeLifecycleSurface: surfaces.cleanup,
      triggerEvent: surfaces.interruptRecord,
      evidenceRecordTypes: surfaces.cleanupRecords,
      sideEffectRecords: surfaces.failRecords,
      decisionEvent: "fail",
      observedShape: {
        processCleanup: "partial",
        terminalDecision: "inferred",
        cancelRace: "not-replayed",
        evidencePersistence: "best-effort",
      },
      visibility: "inferred",
      lossiness: runtimeAcceptanceLifecycleScenarioLossiness(product, ["interrupt-cleanup-side-effect-order-partial"]),
    },
  ]
}

function runtimeAcceptancePersistenceCleanupScenarios(product: RuntimeAcceptanceReplayProduct): RuntimeAcceptancePersistenceCleanupScenario[] {
  const profile = acceptanceProfiles[product]
  const surfaces = runtimeAcceptanceLifecycleSurfaces(product)
  return [
    {
      scenarioID: "read-only-summary-persistence-order",
      taskClass: "read-only-answer",
      nativePersistenceSurface: surfaces.lifecycle,
      triggerEvent: surfaces.providerFinishRecord,
      persistenceRecords: surfaces.summaryRecords,
      cleanupRecords: [],
      sideEffectOrder: [surfaces.providerFinishRecord, ...surfaces.finalizationRecords],
      decisionEvent: profile.decisionOnPass,
      observedShape: {
        visibleSummaryPresent: true,
        summaryPersistence: "semantic",
        finalizationOrder: "partial",
        cleanupRequired: false,
      },
      visibility: "observed",
      lossiness: runtimeAcceptancePersistenceCleanupScenarioLossiness(product, ["native-summary-record-id-partial"]),
    },
    {
      scenarioID: "policy-pass-evidence-write-order",
      taskClass: "single-file-edit",
      nativePersistenceSurface: surfaces.lifecycle,
      triggerEvent: surfaces.policyPassRecord,
      persistenceRecords: [...surfaces.evidenceRecords, ...surfaces.acceptanceRecords],
      cleanupRecords: [],
      sideEffectOrder: [surfaces.policyPassRecord, ...surfaces.evidenceRecords, ...surfaces.acceptanceRecords],
      decisionEvent: profile.decisionOnPass,
      observedShape: {
        workspaceDiffAvailableAt: "tool-result-after",
        evidencePersisted: "semantic",
        acceptanceRecordOrder: "partial",
        sideEffectOrder: "bucketed",
      },
      visibility: "observed",
      lossiness: runtimeAcceptancePersistenceCleanupScenarioLossiness(product, ["native-evidence-write-transaction-order-partial"]),
    },
    {
      scenarioID: "permission-denied-continue-persistence",
      taskClass: "permission-denied",
      nativePersistenceSurface: surfaces.lifecycle,
      triggerEvent: surfaces.permissionDeniedRecord,
      persistenceRecords: [...surfaces.blockedRecords, ...surfaces.continueRecords],
      cleanupRecords: [],
      sideEffectOrder: [surfaces.permissionDeniedRecord, ...surfaces.blockedRecords, ...surfaces.continueRecords],
      decisionEvent: "continue",
      observedShape: {
        blockingEvidence: ["permission.ask"],
        continueRecord: "partial",
        retryQueueOrder: "not-replayed",
      },
      visibility: "inferred",
      lossiness: runtimeAcceptancePersistenceCleanupScenarioLossiness(product, ["permission-denied-continue-persistence-order-partial"]),
    },
    {
      scenarioID: "tool-error-retry-cleanup-order",
      taskClass: "tool-error-retry",
      nativePersistenceSurface: surfaces.lifecycle,
      triggerEvent: surfaces.toolErrorRecord,
      persistenceRecords: surfaces.retryRecords,
      cleanupRecords: [],
      sideEffectOrder: [surfaces.toolErrorRecord, ...surfaces.retryRecords],
      decisionEvent: profile.decisionOnPass,
      observedShape: {
        firstToolResult: "error",
        finalToolResult: "success",
        retryPersistence: "partial",
        failedToolCleanup: "semantic",
      },
      visibility: "inferred",
      lossiness: runtimeAcceptancePersistenceCleanupScenarioLossiness(product, ["tool-error-cleanup-order-partial"]),
    },
    {
      scenarioID: "interrupt-cleanup-side-effect-order",
      taskClass: "provider-error-or-cancel",
      nativePersistenceSurface: surfaces.cleanup,
      triggerEvent: surfaces.interruptRecord,
      persistenceRecords: surfaces.failRecords,
      cleanupRecords: surfaces.cleanupRecords,
      sideEffectOrder: [surfaces.interruptRecord, ...surfaces.cleanupRecords, ...surfaces.failRecords],
      decisionEvent: "fail",
      observedShape: {
        processCleanup: "partial",
        failureRecord: "semantic",
        cleanupRace: "not-replayed",
        sideEffectOrder: "bucketed",
      },
      visibility: "inferred",
      lossiness: runtimeAcceptancePersistenceCleanupScenarioLossiness(product, ["interrupt-cleanup-side-effect-order-partial"]),
    },
  ]
}

function runtimeAcceptanceTimingBoundarySurfaces(product: RuntimeAcceptanceReplayProduct): {
  loop: string
  providerFinishEvent: string
  toolResultEvent: string
  permissionEvent: string
  toolErrorEvent: string
  interruptEvent: string
  sideEffects: string
  cleanup: string
} {
  if (product === "opencode") {
    return {
      loop: "session-event-loop",
      providerFinishEvent: "message-v2.final-part",
      toolResultEvent: "step-finish.tool-result",
      permissionEvent: "permission.ask.denied",
      toolErrorEvent: "tool.error.step",
      interruptEvent: "abort-controller.cancel",
      sideEffects: "sqlite-message-v2-and-workspace-diff",
      cleanup: "session-abort-cleanup",
    }
  }
  if (product === "pi-mono") {
    return {
      loop: "jsonl-v3-agent-loop",
      providerFinishEvent: "jsonl-v3.message_stop",
      toolResultEvent: "tool_execution_end",
      permissionEvent: "extension.permission_denied",
      toolErrorEvent: "tool_execution_error",
      interruptEvent: "cli-session-cancel",
      sideEffects: "jsonl-v3-task-and-extension-state",
      cleanup: "cli-process-cleanup",
    }
  }
  if (product === "nanobot") {
    return {
      loop: "workspace-agent-loop",
      providerFinishEvent: "workspace-session.finish",
      toolResultEvent: "workspace-tool-result",
      permissionEvent: "workspace-permission-denied",
      toolErrorEvent: "workspace-tool-error",
      interruptEvent: "workspace-run-cancel",
      sideEffects: "workspace-session-jsonl-and-memory",
      cleanup: "workspace-run-cleanup",
    }
  }
  return {
    loop: "api-acp-agent-loop",
    providerFinishEvent: "api-session.response.done",
    toolResultEvent: "acp.tool_result",
    permissionEvent: "acp.permission.denied",
    toolErrorEvent: "acp.tool_error",
    interruptEvent: "api-acp-cancel",
    sideEffects: "api-session-record-and-memory-search",
    cleanup: "api-worker-cleanup",
  }
}

function runtimeAcceptanceLifecycleSurfaces(product: RuntimeAcceptanceReplayProduct): {
  lifecycle: string
  cleanup: string
  providerFinishRecord: string
  policyPassRecord: string
  permissionDeniedRecord: string
  toolErrorRecord: string
  interruptRecord: string
  summaryRecords: string[]
  evidenceRecords: string[]
  blockedRecords: string[]
  retryRecords: string[]
  cleanupRecords: string[]
  finalizationRecords: string[]
  acceptanceRecords: string[]
  continueRecords: string[]
  failRecords: string[]
} {
  if (product === "opencode") {
    return {
      lifecycle: "session-event-loop-lifecycle",
      cleanup: "session-abort-cleanup",
      providerFinishRecord: "message_v2.final_part",
      policyPassRecord: "step-finish.acceptance-check",
      permissionDeniedRecord: "permission.ask.denied",
      toolErrorRecord: "tool.error.step",
      interruptRecord: "abort-controller.cancel",
      summaryRecords: ["message_v2", "assistant_part", "final_summary"],
      evidenceRecords: ["workspace_diff", "tool_result_part", "acceptance_check"],
      blockedRecords: ["permission_ask", "blocked_evidence"],
      retryRecords: ["tool_error", "retry_step", "tool_success"],
      cleanupRecords: ["abort_signal", "cleanup_task"],
      finalizationRecords: ["session_summary_write", "message_v2.commit"],
      acceptanceRecords: ["acceptance_check", "session_state_update"],
      continueRecords: ["continue_turn", "permission_retry_state"],
      failRecords: ["session_error", "abort_cleanup"],
    }
  }
  if (product === "pi-mono") {
    return {
      lifecycle: "jsonl-v3-agent-lifecycle",
      cleanup: "cli-process-cleanup",
      providerFinishRecord: "jsonl-v3.message_stop",
      policyPassRecord: "jsonl-v3.acceptance_record",
      permissionDeniedRecord: "extension.permission_denied",
      toolErrorRecord: "tool_execution_error",
      interruptRecord: "cli-session-cancel",
      summaryRecords: ["jsonl-v3.message", "branch_summary"],
      evidenceRecords: ["jsonl-v3.workspace_diff", "tool_execution_end", "acceptance_record"],
      blockedRecords: ["extension.permission_denied", "blocked_evidence"],
      retryRecords: ["tool_execution_error", "retry_marker", "tool_execution_end"],
      cleanupRecords: ["cli_cancel", "process_cleanup"],
      finalizationRecords: ["jsonl-v3.task_record", "active_leaf_update"],
      acceptanceRecords: ["acceptance_record", "leaf_state_update"],
      continueRecords: ["continue_record", "extension_retry_state"],
      failRecords: ["failure_record", "cli_cleanup"],
    }
  }
  if (product === "nanobot") {
    return {
      lifecycle: "workspace-agent-lifecycle",
      cleanup: "workspace-run-cleanup",
      providerFinishRecord: "workspace-session.finish",
      policyPassRecord: "workspace-acceptance-record",
      permissionDeniedRecord: "workspace-permission-denied",
      toolErrorRecord: "workspace-tool-error",
      interruptRecord: "workspace-run-cancel",
      summaryRecords: ["workspace-session.message", "goal_state"],
      evidenceRecords: ["workspace_diff", "tool_result", "memory_reference"],
      blockedRecords: ["permission_denied", "blocked_evidence"],
      retryRecords: ["tool_error", "retry_reference", "tool_success"],
      cleanupRecords: ["run_cancel", "workspace_cleanup"],
      finalizationRecords: ["workspace-session.commit", "goal_state_update"],
      acceptanceRecords: ["acceptance_record", "memory_update"],
      continueRecords: ["continue_marker", "channel_retry_state"],
      failRecords: ["failure_record", "workspace_cleanup"],
    }
  }
  return {
    lifecycle: "api-acp-agent-lifecycle",
    cleanup: "api-worker-cleanup",
    providerFinishRecord: "api-session.response.done",
    policyPassRecord: "api-session.acceptance_record",
    permissionDeniedRecord: "acp.permission.denied",
    toolErrorRecord: "acp.tool_error",
    interruptRecord: "api-acp-cancel",
    summaryRecords: ["api-message", "trajectory_compression"],
    evidenceRecords: ["api-workspace-diff", "acp.tool_result", "memory.session_search_ref"],
    blockedRecords: ["acp.permission.denied", "blocked_evidence"],
    retryRecords: ["acp.tool_error", "retry_trace", "acp.tool_result"],
    cleanupRecords: ["cancel_trace", "worker_cleanup"],
    finalizationRecords: ["api-session.commit", "memory-summary"],
    acceptanceRecords: ["acceptance_record", "session_search_update"],
    continueRecords: ["continue_trace", "acp_retry_state"],
    failRecords: ["failure_trace", "worker_cleanup"],
  }
}

function runtimeAcceptanceProfileSnapshot(profile: (typeof acceptanceProfiles)[RuntimeAcceptanceProduct]): RuntimeAcceptanceProfileSnapshot {
  return {
    product: profile.prefix === "pi" ? "pi-mono" : profile.prefix === "hermes" ? "hermes-agent" : profile.prefix as RuntimeAcceptanceProduct,
    prefix: profile.prefix,
    controllerID: profile.controllerID,
    evidenceID: profile.evidenceID,
    decisionOnPass: profile.decisionOnPass,
    passReason: profile.passReason,
    nativeFixtureSource: profile.nativeFixtureSource,
  }
}

function runtimeAcceptancePolicyShape(product: RuntimeAcceptanceReplayProduct): Record<string, unknown> {
  if (product === "opencode") {
    return {
      stopTiming: "final-message-after-policy-pass",
      acceptSurface: "summary",
      timingSource: "message-end",
    }
  }
  if (product === "pi-mono") {
    return {
      stopTiming: "early-accept-after-policy-pass",
      acceptSurface: "jsonl-v3-task-record",
      timingSource: "tool-result-after",
    }
  }
  if (product === "nanobot") {
    return {
      stopTiming: "early-accept-after-policy-pass",
      acceptSurface: "workspace-session-jsonl",
      timingSource: "tool-result-after",
    }
  }
  return {
    stopTiming: "policy-satisfied-after-livecodebench-evidence",
    acceptSurface: "api-session-record",
    timingSource: "turn-end",
  }
}

function runtimeAcceptanceObservedFields(product: RuntimeAcceptanceReplayProduct, key: RuntimeAcceptanceReplayAtomKey): string[] {
  const common = ["testsPassed", "workspaceDiff", "toolCalls", "toolResults", "visibleSummaryPresent", "policySatisfiedAt", "blockingEvidence"]
  if (key === "acceptance-controller") return [...common, "decisionOnPass", "reasonCode", acceptanceProfiles[product].decisionOnPass]
  return [...common, "checks", "requiredToolResultAvailableAt", "forbiddenFileCheckAvailableAt", "unavailableUntil"]
}

function runtimeAcceptanceLifecycleObservedFields(product: RuntimeAcceptanceReplayProduct): string[] {
  void product
  return [
    "nativeLifecycleSurface",
    "triggerEvent",
    "evidenceRecordTypes",
    "sideEffectRecords",
    "decisionEvent",
    "evidencePersisted",
    "acceptanceRecordID",
    "cleanupRecord",
  ]
}

function runtimeAcceptancePersistenceCleanupObservedFields(product: RuntimeAcceptanceReplayProduct): string[] {
  void product
  return [
    "nativePersistenceSurface",
    "triggerEvent",
    "persistenceRecords",
    "cleanupRecords",
    "sideEffectOrder",
    "decisionEvent",
    "evidencePersisted",
    "processCleanup",
  ]
}

function runtimeAcceptanceInferredFields(product: RuntimeAcceptanceReplayProduct, key: RuntimeAcceptanceReplayAtomKey): string[] {
  const common = ["provider-finish-to-accept-clock", "permission-denied-native-loop-boundary", "tool-error-retry-native-clock"]
  if (key === "acceptance-controller") {
    if (product === "opencode") return [...common, "final-summary-after-accept-window"]
    if (product === "pi-mono") return [...common, "jsonl-v3-accept-record-order"]
    if (product === "nanobot") return [...common, "workspace-session-accept-record-order"]
    return [...common, "api-gateway-accept-record-order"]
  }
  if (product === "opencode") return [...common, "sqlite-task-evidence-transaction-order"]
  if (product === "pi-mono") return [...common, "extension-tool-evidence-order"]
  if (product === "nanobot") return [...common, "workspace-sidecar-evidence-order"]
  return [...common, "session-search-evidence-order"]
}

function runtimeAcceptanceLifecycleInferredFields(product: RuntimeAcceptanceReplayProduct): string[] {
  if (product === "opencode") return ["sqlite-acceptance-record-order", "session-summary-write-order", "abort-cleanup-race"]
  if (product === "pi-mono") return ["jsonl-v3-acceptance-record-order", "active-leaf-state-order", "cli-cleanup-race"]
  if (product === "nanobot") return ["workspace-acceptance-record-order", "memory-update-order", "workspace-cleanup-race"]
  return ["api-acceptance-record-order", "session-search-update-order", "api-worker-cleanup-race"]
}

function runtimeAcceptancePersistenceCleanupInferredFields(product: RuntimeAcceptanceReplayProduct): string[] {
  if (product === "opencode") return ["sqlite-evidence-transaction-order", "session-abort-cleanup-order", "message-v2-finalization-side-effect-order"]
  if (product === "pi-mono") return ["jsonl-v3-evidence-write-order", "cli-process-cleanup-order", "active-leaf-cleanup-order"]
  if (product === "nanobot") return ["workspace-session-evidence-write-order", "workspace-memory-update-order", "workspace-cleanup-side-effect-order"]
  return ["api-session-evidence-write-order", "session-search-update-order", "api-worker-cleanup-order"]
}

function runtimeAcceptanceLossyFields(product: RuntimeAcceptanceReplayProduct, key: RuntimeAcceptanceReplayAtomKey): string[] {
  const common = ["semantic-runtime-acceptance-replay", "native-task-runner-side-effects-normalized", "full-stop-continue-timing-not-replayed"]
  const timingBoundary = runtimeAcceptanceTimingBoundaryLossyFields(product)
  const lifecycle = runtimeAcceptanceLifecycleLossyFields(product)
  const persistenceCleanup = runtimeAcceptancePersistenceCleanupLossyFields(product)
  if (key === "acceptance-controller") {
    if (product === "opencode") return [...common, ...timingBoundary, ...lifecycle, ...persistenceCleanup, "opencode-final-summary-timing-partial"]
    if (product === "pi-mono") return [...common, ...timingBoundary, ...lifecycle, ...persistenceCleanup, "pi-early-accept-timing-partial"]
    if (product === "nanobot") return [...common, ...timingBoundary, ...lifecycle, ...persistenceCleanup, "nanobot-early-accept-timing-partial"]
    return [...common, ...timingBoundary, ...lifecycle, ...persistenceCleanup, "hermes-livecodebench-evidence-timing-partial"]
  }
  if (product === "opencode") return [...common, ...timingBoundary, ...lifecycle, ...persistenceCleanup, "sqlite-workspace-diff-evidence-partial"]
  if (product === "pi-mono") return [...common, ...timingBoundary, ...lifecycle, ...persistenceCleanup, "jsonl-v3-evidence-record-partial"]
  if (product === "nanobot") return [...common, ...timingBoundary, ...lifecycle, ...persistenceCleanup, "workspace-session-evidence-record-partial"]
  return [...common, ...timingBoundary, ...lifecycle, ...persistenceCleanup, "api-acp-evidence-record-partial"]
}

function runtimeAcceptanceTimingBoundaryInferredFields(product: RuntimeAcceptanceReplayProduct): string[] {
  if (product === "opencode") return ["final-message-after-policy-pass-clock", "sqlite-acceptance-transaction-order", "abort-cleanup-race"]
  if (product === "pi-mono") return ["jsonl-v3-accept-record-clock", "extension-continue-boundary", "cli-cancel-cleanup-race"]
  if (product === "nanobot") return ["workspace-session-accept-record-clock", "memory-evidence-persistence-order", "workspace-cancel-cleanup-race"]
  return ["api-session-accept-record-clock", "acp-cancel-cleanup-race", "session-search-evidence-persistence-order"]
}

function runtimeAcceptanceTimingBoundaryLossyFields(product: RuntimeAcceptanceReplayProduct): string[] {
  const common = [
    "partial-runtime-acceptance-timing-boundary",
    "full-upstream-stop-continue-timing-not-replayed",
    "process-cleanup-side-effects-not-replayed",
    "native-loop-cancel-race-not-replayed",
    "timestamp-level-acceptance-boundary-not-proven",
  ]
  if (product === "opencode") return [...common, "opencode-final-message-stop-boundary-partial"]
  if (product === "pi-mono") return [...common, "pi-jsonl-v3-accept-boundary-partial"]
  if (product === "nanobot") return [...common, "nanobot-workspace-accept-boundary-partial"]
  return [...common, "hermes-api-acp-accept-boundary-partial"]
}

function runtimeAcceptanceLifecycleLossyFields(product: RuntimeAcceptanceReplayProduct): string[] {
  const common = [
    "partial-runtime-acceptance-lifecycle",
    "native-evidence-persistence-order-not-replayed",
    "process-cleanup-side-effects-not-replayed",
    "native-loop-cancel-race-not-replayed",
    "full-upstream-stop-continue-timing-not-replayed",
    "native-acceptance-record-id-partial",
  ]
  if (product === "opencode") return [...common, "sqlite-acceptance-lifecycle-order-partial"]
  if (product === "pi-mono") return [...common, "jsonl-v3-acceptance-lifecycle-order-partial"]
  if (product === "nanobot") return [...common, "workspace-acceptance-lifecycle-order-partial"]
  return [...common, "api-acp-acceptance-lifecycle-order-partial"]
}

function runtimeAcceptanceLifecycleScenarioLossiness(product: RuntimeAcceptanceReplayProduct, extra: string[]): string[] {
  return uniqueStrings([...runtimeAcceptanceLifecycleLossyFields(product), ...extra])
}

function runtimeAcceptancePersistenceCleanupLossyFields(product: RuntimeAcceptanceReplayProduct): string[] {
  const common = [
    "partial-runtime-acceptance-persistence-cleanup",
    "native-evidence-persistence-order-not-replayed",
    "process-cleanup-side-effects-not-replayed",
    "cleanup-side-effect-order-not-full-native",
    "native-loop-cancel-race-not-replayed",
    "native-acceptance-record-id-partial",
  ]
  if (product === "opencode") return [...common, "sqlite-evidence-cleanup-order-partial"]
  if (product === "pi-mono") return [...common, "jsonl-v3-evidence-cleanup-order-partial"]
  if (product === "nanobot") return [...common, "workspace-evidence-cleanup-order-partial"]
  return [...common, "api-acp-evidence-cleanup-order-partial"]
}

function runtimeAcceptancePersistenceCleanupScenarioLossiness(product: RuntimeAcceptanceReplayProduct, extra: string[]): string[] {
  return uniqueStrings([...runtimeAcceptancePersistenceCleanupLossyFields(product), ...extra])
}

function runtimeAcceptanceUpstreamRef(product: RuntimeAcceptanceReplayProduct): string {
  if (product === "opencode") return "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  if (product === "pi-mono") return "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  if (product === "nanobot") return "package:nanobot-ai@0.2.0"
  return "package:hermes-agent==0.15.1"
}

function runtimeAcceptanceUpstreamEvidenceRefs(product: RuntimeAcceptanceReplayProduct, key: RuntimeAcceptanceReplayAtomKey): string[] {
  const base = runtimeAcceptanceUpstreamRef(product)
  const keyRefs = {
    "acceptance-controller": product === "opencode" ? ["final-message-stop-policy", "summary-before-accept"] :
      product === "pi-mono" ? ["jsonl-v3-early-accept", "extension-task-policy"] :
      product === "nanobot" ? ["workspace-session-early-accept", "agent-task-policy"] :
      ["api-session-accept-policy", "livecodebench-evidence-policy"],
    "acceptance-evidence": product === "opencode" ? ["workspace-diff-checks", "tool-result-checks"] :
      product === "pi-mono" ? ["jsonl-v3-tool-evidence", "permission-denied-records"] :
      product === "nanobot" ? ["workspace-sidecar-evidence", "tool-error-retry-records"] :
      ["api-acp-evidence-records", "session-search-task-evidence"],
  } satisfies Record<RuntimeAcceptanceReplayAtomKey, string[]>
  return [base, ...keyRefs[key]]
}

function runtimeAcceptanceTiming(input: {
  checks: RuntimeAcceptanceEvidenceCheck[]
  visibleText: string
  workspaceDiff: RuntimeAcceptanceWorkspaceDiffEntry[]
  toolResults: Array<{ toolName: string; text: string; isError?: boolean }>
}): {
  timeline: RuntimeAcceptanceEvidenceTimeline
  blockingEvidence: string[]
  satisfiedAt: RuntimeAcceptanceEvidenceAvailability
  unavailableUntil: Array<{ evidence: string; until: RuntimeAcceptanceEvidenceAvailability; reason: string }>
} {
  const failed = input.checks.filter((item) => !item.ok)
  const hasToolExpectation = input.checks.some((item) => item.id.startsWith("tool."))
  const hasForbiddenFileExpectation = input.checks.some((item) => item.id.startsWith("file.absent."))
  const visibleSummaryAvailableAt: RuntimeAcceptanceEvidenceAvailability = input.visibleText.trim().length > 0 ? "message-end" : "unavailable"
  const policySatisfiedAt: RuntimeAcceptanceEvidenceAvailability =
    failed.length > 0
      ? "unavailable"
      : input.workspaceDiff.length > 0 || input.toolResults.length > 0
        ? "tool-result-after"
        : visibleSummaryAvailableAt === "message-end"
          ? "message-end"
          : "turn-end"
  return {
    timeline: {
      workspaceDiffAvailableAt: input.workspaceDiff.length > 0 ? "tool-result-after" : "turn-end",
      requiredToolResultAvailableAt: hasToolExpectation ? (input.toolResults.length > 0 ? "tool-result-after" : "unavailable") : "not-required",
      visibleSummaryAvailableAt,
      forbiddenFileCheckAvailableAt: hasForbiddenFileExpectation ? "turn-end" : "not-required",
      policySatisfiedAt,
    },
    blockingEvidence: failed.map((item) => item.id),
    satisfiedAt: policySatisfiedAt,
    unavailableUntil: failed.map((item) => ({ evidence: item.id, until: "unavailable", reason: item.message })),
  }
}

function acceptanceChecks(
  expected: RuntimeAcceptanceExpectedPolicy,
  input: {
    visibleText: string
    workspaceRoot: string
    workspaceDiff: RuntimeAcceptanceWorkspaceDiffEntry[]
    toolEvidence: { calls: Array<{ toolName: string }>; results: Array<{ toolName: string; text: string; isError?: boolean }> }
  },
): RuntimeAcceptanceEvidenceCheck[] {
  const checks: RuntimeAcceptanceEvidenceCheck[] = []
  for (const expectedText of expected.visibleAnswerIncludes ?? []) {
    checks.push(check(`output.includes.${slug(expectedText)}`, input.visibleText.includes(expectedText), `Visible output includes ${expectedText}.`))
  }
  for (const pattern of expected.visibleAnswerPatterns ?? []) {
    checks.push(check(`output.matches.${slug(pattern)}`, new RegExp(pattern, "i").test(input.visibleText), `Visible output matches ${pattern}.`))
  }
  for (const [path, fileExpectation] of Object.entries(expected.files ?? {})) {
    const fullPath = join(input.workspaceRoot, path)
    const content = existsSync(fullPath) ? readFileSync(fullPath, "utf8") : ""
    if (fileExpectation.equals !== undefined) checks.push(check(`file.equals.${path}`, content === fileExpectation.equals, `${path} exactly matches expected content.`))
    for (const text of fileExpectation.includes ?? []) {
      checks.push(check(`file.includes.${path}.${slug(text)}`, content.includes(text), `${path} includes ${text}.`))
    }
  }
  for (const path of expected.noFiles ?? []) {
    checks.push(check(`file.absent.${path}`, !existsSync(join(input.workspaceRoot, path)), `${path} was not created.`))
  }
  for (const toolName of expected.toolNames ?? []) {
    checks.push(check(`tool.called.${toolName}`, input.toolEvidence.calls.some((call) => call.toolName === toolName), `Tool ${toolName} was called.`))
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
    checks.push(check("workspace.diff.count", input.workspaceDiff.length === expected.workspaceDiffCount, `Workspace diff contains ${expected.workspaceDiffCount} entries.`))
  }
  if (checks.length === 0) checks.push(check("task.noop", true, "Task has no declarative verifier checks."))
  return checks
}

function snapshotWorkspace(root: string): Record<string, string> {
  const files: Record<string, string> = {}
  if (!root || !existsSync(root)) return files
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        visit(full)
        continue
      }
      files[relative(root, full).replace(/\\/g, "/")] = readFileSync(full, "utf8")
    }
  }
  visit(root)
  return files
}

function diffSnapshots(before: Record<string, string>, after: Record<string, string>): RuntimeAcceptanceWorkspaceDiffEntry[] {
  const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  const diff: RuntimeAcceptanceWorkspaceDiffEntry[] = []
  for (const path of paths) {
    const left = before[path]
    const right = after[path]
    if (left === undefined && right !== undefined) diff.push({ path, status: "added", after: right })
    else if (left !== undefined && right === undefined) diff.push({ path, status: "deleted", before: left })
    else if (left !== right) diff.push({ path, status: "modified", ...(left === undefined ? {} : { before: left }), ...(right === undefined ? {} : { after: right }) })
  }
  return diff
}

function collectToolEvidence(parts: LegoMessagePart[]): { calls: Array<{ toolName: string }>; results: Array<{ toolName: string; text: string; isError?: boolean }> } {
  const calls: Array<{ toolName: string }> = []
  const results: Array<{ toolName: string; text: string; isError?: boolean }> = []
  const visit = (part: LegoMessagePart) => {
    if (part.type === "tool_call") calls.push({ toolName: part.toolName })
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

function partToText(part: LegoMessagePart): string {
  if (part.type === "text" || part.type === "reasoning") return part.text
  if (part.type === "tool_result") return part.content.map(partToText).join("\n")
  if (part.type === "custom") return part.display ?? ""
  if (part.type === "compaction") return part.summary
  return ""
}

function diffSignature(diff: RuntimeAcceptanceWorkspaceDiffEntry[]): Array<Pick<RuntimeAcceptanceWorkspaceDiffEntry, "path" | "status">> {
  return diff.map((entry) => ({ path: entry.path, status: entry.status })).sort((left, right) => left.path.localeCompare(right.path))
}

function check(id: string, ok: boolean, message: string): RuntimeAcceptanceEvidenceCheck {
  return { id, ok, message }
}

function slug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort()
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
