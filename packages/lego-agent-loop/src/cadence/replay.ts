import { createHash } from "node:crypto"
import { getCadencePolicyProfile, type CadencePolicyProfile } from "./registry.ts"
import {
  openCodeAgentLoopFinalSummaryNativeExactEvidenceRef,
  openCodeAgentLoopFinalSummaryNativeExactFixtureID,
  openCodeAgentLoopFinalSummaryNativeExactReplayRef,
  openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef,
  openCodeAgentLoopRequestBoundaryNativeExactFixtureID,
  openCodeAgentLoopRequestBoundaryNativeExactReplayRef,
} from "../product-schema/opencode.ts"
import {
  buildCadenceProductProjectorSnapshot,
  cadenceProductProjectorNativeFixtureSource,
  cadenceProductProjectorUpstreamRef,
  type CadenceProductProjectorCoverage,
  type CadenceProductProjectorScenario,
  type CadenceProductProjectorSnapshot,
} from "./projectors.ts"
import type { CadenceProductPersonality, FinalSummaryDecision, RequestBoundaryDecision, ToolBatchMode } from "./types.ts"

export type CadenceReplayProduct = Exclude<CadenceProductPersonality, "common">
export type CadenceReplayAtomKey = "request-boundary" | "final-summary" | "tool-batch-scheduler"
export type CadenceReplayStageID = "loop.boundary" | "final.summary" | "tool.batch"
export type CadenceReplayVisibility = "observed" | "inferred"
export type CadenceReplayExactDiffStatus = "native-exact" | "exact-diff-partial"
export type CadenceSideEffectOrderVisibility = "observed" | "inferred"
export type CadenceEventTimingReplayGateDimension =
  | "request-boundary"
  | "tool-batch-order"
  | "final-summary"
  | "continuation"
  | "side-effects"
export type CadenceEventTimingReplayGateRisk =
  | "source-anchored-partial"
  | "assembled-inferred-only"
  | "common-fallback-only"
  | "borrowed-opencode"

export interface CadenceReplayDecision {
  scenarioID: string
  observedDecision: RequestBoundaryDecision | FinalSummaryDecision | ToolBatchMode
  reasonCode: string
  visibility: CadenceReplayVisibility
}

export interface CadenceReplayAtomSnapshot {
  key: CadenceReplayAtomKey
  atomID: string
  portID: "agent-loop.request-boundary" | "agent-loop.final-summary" | "tools.batch-scheduler"
  flowStageID: CadenceReplayStageID
  productProjectorID: string
  productProjectorCoverage: CadenceProductProjectorCoverage
  productProjectorFingerprint: string
  sideEffectOrderFingerprint?: string
  sideEffectOrderFixtureID?: string
  nativeFixtureSource: string
  exactDiffStatus: CadenceReplayExactDiffStatus
  nativeParityClaim: boolean
  nativeExactFixtureIDs: string[]
  nativeEvidenceRefs: string[]
  upstreamEvidenceRefs: string[]
  fixtureID: string
  decisions: CadenceReplayDecision[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
}

export interface CadenceSideEffectOrderScenario {
  scenarioID: string
  key: CadenceReplayAtomKey
  nativeEventOrder: string[]
  sideEffects: string[]
  timingBuckets: string[]
  visibility: CadenceSideEffectOrderVisibility
  upstreamEvidenceRefs: string[]
  observedFields: string[]
  inferredFields: string[]
  lossiness: string[]
}

export interface CadenceSideEffectOrderSnapshot {
  schemaVersion: 1
  product: CadenceReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: CadenceSideEffectOrderScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface CadenceReplaySnapshot {
  schemaVersion: 1
  product: CadenceReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureIDs: string[]
  profileFingerprint: string
  productProjector: CadenceProductProjectorSnapshot
  productProjectorFingerprint: string
  sideEffectOrder: CadenceSideEffectOrderSnapshot
  sideEffectOrderFingerprint: string
  profile: CadencePolicyProfile
  atoms: CadenceReplayAtomSnapshot[]
  coveredKeys: CadenceReplayAtomKey[]
  knownGaps: string[]
  fingerprint: string
}

export interface CadenceEventTimingReplayGateCase {
  product: CadenceReplayProduct
  cadenceSourceID: "opencode" | "pi" | "nanobot" | "hermes"
  evidenceRef: "conformance:cadence-event-timing-replay-gate"
  fixtureID: string
  requestBoundary: string[]
  toolBatchOrder: string[]
  finalSummary: string[]
  continuation: string[]
  sideEffects: string[]
  sourceAnchors: string[]
  cadenceAtomIDs: string[]
  cadencePortIDs: string[]
  fixtureIDs: string[]
  replayRisk: CadenceEventTimingReplayGateRisk
  knownLossiness: string[]
}

export interface CadenceEventTimingReplayGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:cadence-event-timing-replay-gate"
  fixtureID: "cadence:event-timing-replay-gate"
  products: CadenceReplayProduct[]
  comparisonDimensions: CadenceEventTimingReplayGateDimension[]
  cases: CadenceEventTimingReplayGateCase[]
  fingerprint: string
}

export interface CadenceEventTimingReplayGateIssue {
  id: string
  product: CadenceReplayProduct
  dimension: CadenceEventTimingReplayGateDimension
  message: string
}

export interface CadenceEventTimingReplayGateVerification {
  ok: boolean
  issues: CadenceEventTimingReplayGateIssue[]
}

export const cadenceReplayProducts: CadenceReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
export const cadenceReplayAtomKeys: CadenceReplayAtomKey[] = ["request-boundary", "final-summary", "tool-batch-scheduler"]
const cadenceEventTimingReplayGateDimensions: CadenceEventTimingReplayGateDimension[] = [
  "request-boundary",
  "tool-batch-order",
  "final-summary",
  "continuation",
  "side-effects",
]

export function buildCadenceReplaySnapshot(product: CadenceReplayProduct): CadenceReplaySnapshot {
  const profile = getCadencePolicyProfile(product)
  const productProjector = buildCadenceProductProjectorSnapshot(product)
  const sideEffectOrder = buildCadenceSideEffectOrderSnapshot(product)
  const atoms = cadenceReplayAtomKeys.map((key) => buildCadenceReplayAtomSnapshot(product, key, productProjector, sideEffectOrder))
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: cadenceProductProjectorUpstreamRef(product),
    evidenceRef: `conformance:${product}-cadence-replay-snapshot`,
    fixtureIDs: uniqueStrings([
      ...atoms.map((atom) => atom.fixtureID),
      ...atoms.flatMap((atom) => atom.nativeExactFixtureIDs),
      productProjector.fixtureID,
      sideEffectOrder.fixtureID,
    ]),
    profileFingerprint: fingerprintObject(profile),
    productProjector,
    productProjectorFingerprint: productProjector.fingerprint,
    sideEffectOrder,
    sideEffectOrderFingerprint: sideEffectOrder.fingerprint,
    profile,
    atoms,
    coveredKeys: atoms.map((atom) => atom.key),
    knownGaps: [
      "policy-table-replay-not-full-native-loop",
      "product-projector-partial-not-full-native-loop",
      "cadence-side-effect-order-covered-by-partial-fixture",
      "full-native-event-timing-and-side-effects-not-replayed",
      "tool-result-projector-and-provider-stream-projector-covered-by-later-TODO27-slices",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildCadenceEventTimingReplayGateSnapshot(): CadenceEventTimingReplayGateSnapshot {
  const cases = cadenceReplayProducts.map((product) => buildCadenceEventTimingReplayGateCase(buildCadenceReplaySnapshot(product)))
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:cadence-event-timing-replay-gate" as const,
    fixtureID: "cadence:event-timing-replay-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: cadenceEventTimingReplayGateDimensions,
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyCadenceEventTimingReplayGateSnapshot(snapshot: CadenceEventTimingReplayGateSnapshot): CadenceEventTimingReplayGateVerification {
  const issues: CadenceEventTimingReplayGateIssue[] = []

  for (const product of cadenceReplayProducts) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "cadence-event-timing.missing-product",
        product,
        dimension: "request-boundary",
        message: `Missing cadence event timing replay gate case for ${product}.`,
      })
      continue
    }
    if (!cadenceGateContains(item.requestBoundary, /request|boundary|continue|stop|accepted|max|provider|tool-result|loop|finish/i)) {
      issues.push({
        id: "cadence-event-timing.request-boundary",
        product,
        dimension: "request-boundary",
        message: `${product} cadence gate no longer records request boundary anchors.`,
      })
    }
    if (!cadenceGateContains(item.toolBatchOrder, /batch|tool|readonly|mutating|sequential|parallel|dispatch|order|scheduler/i)) {
      issues.push({
        id: "cadence-event-timing.tool-batch-order",
        product,
        dimension: "tool-batch-order",
        message: `${product} cadence gate no longer records tool batch order anchors.`,
      })
    }
    if (!cadenceGateContains(item.finalSummary, /final|summary|visible|accepted|assistant|message|write|output/i)) {
      issues.push({
        id: "cadence-event-timing.final-summary",
        product,
        dimension: "final-summary",
        message: `${product} cadence gate no longer records final summary anchors.`,
      })
    }
    if (!cadenceGateContains(item.continuation, /continue|continuation|provider-continuation|tool-results|synthetic|retry|length|recover/i)) {
      issues.push({
        id: "cadence-event-timing.continuation",
        product,
        dimension: "continuation",
        message: `${product} cadence gate no longer records continuation anchors.`,
      })
    }
    if (!cadenceGateContains(item.sideEffects, /side|effect|order|write|session|provider|cleanup|clock|timing|dispatch|read/i)) {
      issues.push({
        id: "cadence-event-timing.side-effects",
        product,
        dimension: "side-effects",
        message: `${product} cadence gate no longer records side-effect ordering anchors.`,
      })
    }
    if (
      item.fixtureIDs.length < 5 ||
      !cadenceGateContains(item.fixtureIDs, /cadence:(request-boundary|tool-batch-scheduler|final-summary|product-projector|side-effect-order)|event-timing-replay-gate/i)
    ) {
      issues.push({
        id: "cadence-event-timing.fixture-coverage",
        product,
        dimension: "side-effects",
        message: `${product} cadence gate no longer links replay, product projector and side-effect order fixtures.`,
      })
    }
    if (!cadenceGateContains(item.knownLossiness, /partial|not-full|not-replayed|side-effects|timing|lossy|inferred/i)) {
      issues.push({
        id: "cadence-event-timing.runtime-lossiness",
        product,
        dimension: "side-effects",
        message: `${product} cadence gate no longer records partial timing lossiness.`,
      })
    }
    if (item.replayRisk !== "source-anchored-partial") {
      issues.push({
        id: "cadence-event-timing.assembled-inferred-only",
        product,
        dimension: "side-effects",
        message: `${product} cadence gate is not source anchored and cannot be promoted toward native parity.`,
      })
    }
    if (product !== "opencode" && (item.cadenceSourceID === "opencode" || item.fixtureID === "opencode-cadence:replay" || item.replayRisk === "borrowed-opencode" || cadenceGateContains(item.fixtureIDs, /^opencode-cadence:/))) {
      issues.push({
        id: "cadence-event-timing.borrowed-source-matrix",
        product,
        dimension: "request-boundary",
        message: `${product} cadence gate is borrowing the OpenCode cadence source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

export type CadenceEventTimingExactDiffBlockerProduct = CadenceReplayProduct
export type CadenceEventTimingExactDiffBlockerDimension = CadenceEventTimingReplayGateDimension

export interface CadenceEventTimingExactDiffBlockerCase {
  product: CadenceEventTimingExactDiffBlockerProduct
  cadenceSourceID: CadenceEventTimingReplayGateCase["cadenceSourceID"]
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  requestBoundary: string[]
  toolBatchOrder: string[]
  finalSummary: string[]
  continuation: string[]
  sideEffects: string[]
  sourceAnchors: string[]
  cadenceAtomIDs: string[]
  cadencePortIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "assembled-inferred-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface CadenceEventTimingExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:cadence-event-timing-exact-diff-blocker-gate"
  fixtureID: "cadence:event-timing-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: CadenceEventTimingExactDiffBlockerProduct[]
  comparisonDimensions: CadenceEventTimingExactDiffBlockerDimension[]
  cases: CadenceEventTimingExactDiffBlockerCase[]
  fingerprint: string
}

export interface CadenceEventTimingExactDiffBlockerIssue {
  id: string
  product: CadenceEventTimingExactDiffBlockerProduct
  dimension: CadenceEventTimingExactDiffBlockerDimension
  message: string
}

export interface CadenceEventTimingExactDiffBlockerVerification {
  ok: boolean
  issues: CadenceEventTimingExactDiffBlockerIssue[]
}

export type CadenceEventTimingPinnedReplayProduct = CadenceReplayProduct
export type CadenceEventTimingPinnedReplayDimension = CadenceEventTimingReplayGateDimension

export interface CadenceEventTimingPinnedReplayRecord {
  dimension: CadenceEventTimingPinnedReplayDimension
  sequence: number
  traceID: string
  requestBoundaryID: string
  toolBatchID: string
  finalSummaryID: string
  continuationID: string
  sideEffectOrderID: string
  timingBucket: string
  nativeEventOrder: string[]
  sourceAnchor: string
  sideEffectID: string
}

export interface CadenceEventTimingPinnedReplayCase {
  product: CadenceEventTimingPinnedReplayProduct
  cadenceSourceID: CadenceEventTimingReplayGateCase["cadenceSourceID"]
  evidenceRef: "conformance:cadence-event-timing-pinned-replay-gate"
  fixtureID: "cadence:event-timing-pinned-replay-gate"
  sourceFixtureID: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  upstreamTrace: CadenceEventTimingPinnedReplayRecord[]
  productReplayTrace: CadenceEventTimingPinnedReplayRecord[]
  assembledTrace: CadenceEventTimingPinnedReplayRecord[]
  sourceAnchors: string[]
  cadenceAtomIDs: string[]
  cadencePortIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "pinned-timing-replay-needs-live-native-loop" | "assembled-inferred-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface CadenceEventTimingPinnedReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:cadence-event-timing-pinned-replay-gate"
  fixtureID: "cadence:event-timing-pinned-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: CadenceEventTimingPinnedReplayProduct[]
  comparisonDimensions: CadenceEventTimingPinnedReplayDimension[]
  cases: CadenceEventTimingPinnedReplayCase[]
  fingerprint: string
}

export interface CadenceEventTimingPinnedReplayIssue {
  id: string
  product: CadenceEventTimingPinnedReplayProduct
  dimension: CadenceEventTimingPinnedReplayDimension
  message: string
}

export interface CadenceEventTimingPinnedReplayVerification {
  ok: boolean
  issues: CadenceEventTimingPinnedReplayIssue[]
}

export function buildCadenceEventTimingExactDiffBlockerSnapshot(): CadenceEventTimingExactDiffBlockerSnapshot {
  const replayGate = buildCadenceEventTimingReplayGateSnapshot()
  const cases = replayGate.cases.map(buildCadenceEventTimingExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:cadence-event-timing-exact-diff-blocker-gate" as const,
    fixtureID: "cadence:event-timing-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: cadenceEventTimingReplayGateDimensions as CadenceEventTimingExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildCadenceEventTimingPinnedReplaySnapshot(): CadenceEventTimingPinnedReplaySnapshot {
  const replayGate = buildCadenceEventTimingReplayGateSnapshot()
  const cases = replayGate.cases.map(buildCadenceEventTimingPinnedReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:cadence-event-timing-pinned-replay-gate" as const,
    fixtureID: "cadence:event-timing-pinned-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: cadenceEventTimingReplayGateDimensions as CadenceEventTimingPinnedReplayDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyCadenceEventTimingExactDiffBlockerSnapshot(
  snapshot: CadenceEventTimingExactDiffBlockerSnapshot,
): CadenceEventTimingExactDiffBlockerVerification {
  const issues: CadenceEventTimingExactDiffBlockerIssue[] = []

  for (const product of cadenceReplayProducts) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "cadence-event-timing-exact-diff.missing-product",
        product,
        dimension: "request-boundary",
        message: `Missing cadence event timing exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "cadence-event-timing-exact-diff.native-claim",
        product,
        dimension: "request-boundary",
        message: `${product} cadence event timing blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!cadenceGateContains(item.requestBoundary, /request|boundary|continue|stop|accepted|max|provider|tool-result|loop|finish/i)) {
      issues.push({
        id: "cadence-event-timing-exact-diff.request-boundary",
        product,
        dimension: "request-boundary",
        message: `${product} cadence event timing blocker no longer records request boundary anchors.`,
      })
    }
    if (!cadenceGateContains(item.toolBatchOrder, /batch|tool|readonly|mutating|sequential|parallel|dispatch|order|scheduler/i)) {
      issues.push({
        id: "cadence-event-timing-exact-diff.tool-batch-order",
        product,
        dimension: "tool-batch-order",
        message: `${product} cadence event timing blocker no longer records tool batch order anchors.`,
      })
    }
    if (!cadenceGateContains(item.finalSummary, /final|summary|visible|accepted|assistant|message|write|output/i)) {
      issues.push({
        id: "cadence-event-timing-exact-diff.final-summary",
        product,
        dimension: "final-summary",
        message: `${product} cadence event timing blocker no longer records final summary anchors.`,
      })
    }
    if (!cadenceGateContains(item.continuation, /continue|continuation|provider-continuation|tool-results|synthetic|retry|length|recover/i)) {
      issues.push({
        id: "cadence-event-timing-exact-diff.continuation",
        product,
        dimension: "continuation",
        message: `${product} cadence event timing blocker no longer records continuation anchors.`,
      })
    }
    if (!cadenceGateContains(item.sideEffects, /side|effect|order|write|session|provider|cleanup|clock|timing|dispatch|read/i)) {
      issues.push({
        id: "cadence-event-timing-exact-diff.side-effects",
        product,
        dimension: "side-effects",
        message: `${product} cadence event timing blocker no longer records side-effect anchors.`,
      })
    }
    if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.sourceAnchors.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "cadence-event-timing-exact-diff.assembled-inferred-only",
        product,
        dimension: "side-effects",
        message: `${product} cadence event timing blocker is not anchored to product-specific partial replay evidence.`,
      })
    }
    if (product !== "opencode" && (item.cadenceSourceID === "opencode" || item.exactDiffRisk === "borrowed-opencode" || cadenceGateContains(item.fixtureIDs, /^opencode-cadence:/))) {
      issues.push({
        id: "cadence-event-timing-exact-diff.borrowed-source-matrix",
        product,
        dimension: "request-boundary",
        message: `${product} cadence event timing blocker is borrowing the OpenCode cadence source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyCadenceEventTimingPinnedReplaySnapshot(
  snapshot: CadenceEventTimingPinnedReplaySnapshot,
): CadenceEventTimingPinnedReplayVerification {
  const issues: CadenceEventTimingPinnedReplayIssue[] = []

  for (const product of cadenceReplayProducts) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "cadence-event-timing-pinned-replay.missing-product",
        product,
        dimension: "request-boundary",
        message: `Missing cadence event timing pinned replay case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "cadence-event-timing-pinned-replay.native-claim",
        product,
        dimension: "request-boundary",
        message: `${product} cadence timing pinned replay must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!cadencePinnedReplayOrderMatches(item.upstreamTrace) || !cadencePinnedReplayOrderMatches(item.productReplayTrace) || !cadencePinnedReplayOrderMatches(item.assembledTrace)) {
      issues.push({
        id: "cadence-event-timing-pinned-replay.side-effects",
        product,
        dimension: "side-effects",
        message: `${product} cadence timing pinned replay no longer preserves trace event order.`,
      })
    }
    for (const dimension of cadenceEventTimingReplayGateDimensions) {
      const upstream = cadencePinnedReplayTraceRecord(item.upstreamTrace, dimension)
      const productReplay = cadencePinnedReplayTraceRecord(item.productReplayTrace, dimension)
      const assembled = cadencePinnedReplayTraceRecord(item.assembledTrace, dimension)
      if (!upstream || !productReplay || !assembled || !cadencePinnedReplayRecordMatches(upstream, productReplay) || !cadencePinnedReplayRecordMatches(upstream, assembled)) {
        issues.push({
          id: `cadence-event-timing-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} cadence timing pinned replay ${dimension} fixture drifted from the upstream trace sample.`,
        })
      }
    }
    if (item.exactDiffRisk !== "pinned-timing-replay-needs-live-native-loop" || !cadenceGateContains(item.knownLossiness, /pinned-timing-replay|live-native-loop-not-proven|partial|not-full|not-replayed|side-effects|timing|lossy|inferred/i)) {
      issues.push({
        id: "cadence-event-timing-pinned-replay.assembled-inferred-only",
        product,
        dimension: "side-effects",
        message: `${product} cadence timing pinned replay is no longer anchored as partial replay that still needs live native loop proof.`,
      })
    }
    if (product !== "opencode" && (item.cadenceSourceID === "opencode" || item.sourceFixtureID === "opencode-cadence:replay" || item.exactDiffRisk === "borrowed-opencode" || cadenceGateContains(item.fixtureIDs, /^opencode-cadence:/))) {
      issues.push({
        id: "cadence-event-timing-pinned-replay.borrowed-source-matrix",
        product,
        dimension: "request-boundary",
        message: `${product} cadence timing pinned replay is borrowing the OpenCode cadence source matrix.`,
      })
    }
    if (item.sourceAnchors.length === 0 || item.fixtureIDs.length < 5 || item.nativeEvidenceRefs.length === 0) {
      issues.push({
        id: "cadence-event-timing-pinned-replay.missing-evidence",
        product,
        dimension: "side-effects",
        message: `${product} cadence timing pinned replay lost source anchors, fixture IDs, or native evidence refs.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildCadenceEventTimingExactDiffBlockerCase(
  replayCase: CadenceEventTimingReplayGateCase,
): CadenceEventTimingExactDiffBlockerCase {
  return {
    product: replayCase.product,
    cadenceSourceID: replayCase.cadenceSourceID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    requestBoundary: uniqueStrings([
      ...replayCase.requestBoundary,
      "request-boundary-native-timing:exact-diff-not-proven",
    ]),
    toolBatchOrder: uniqueStrings([
      ...replayCase.toolBatchOrder,
      "tool-batch-order-native-scheduler:exact-diff-not-proven",
    ]),
    finalSummary: uniqueStrings([
      ...replayCase.finalSummary,
      "final-summary-native-timing:exact-diff-not-proven",
    ]),
    continuation: uniqueStrings([
      ...replayCase.continuation,
      "continuation-native-retry-stop-boundary:exact-diff-not-proven",
    ]),
    sideEffects: uniqueStrings([
      ...replayCase.sideEffects,
      "cadence-side-effects-native-order:exact-diff-not-proven",
    ]),
    sourceAnchors: replayCase.sourceAnchors,
    cadenceAtomIDs: replayCase.cadenceAtomIDs,
    cadencePortIDs: replayCase.cadencePortIDs,
    fixtureIDs: replayCase.fixtureIDs,
    nativeEvidenceRefs: uniqueStrings([...replayCase.sourceAnchors, ...replayCase.fixtureIDs]),
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...replayCase.knownLossiness,
      "cadence-request-boundary-native-timing-not-proven",
      "cadence-tool-batch-native-order-not-proven",
      "cadence-final-summary-native-timing-not-proven",
      "cadence-continuation-native-replay-not-proven",
      "cadence-side-effects-native-order-not-proven",
    ]),
  }
}

function buildCadenceEventTimingPinnedReplayCase(
  replayCase: CadenceEventTimingReplayGateCase,
): CadenceEventTimingPinnedReplayCase {
  const records = cadencePinnedReplayRecords(replayCase.product)
  return {
    product: replayCase.product,
    cadenceSourceID: replayCase.cadenceSourceID,
    evidenceRef: "conformance:cadence-event-timing-pinned-replay-gate",
    fixtureID: "cadence:event-timing-pinned-replay-gate",
    sourceFixtureID: replayCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    upstreamTrace: records.map(cadencePinnedReplayRecordClone),
    productReplayTrace: records.map(cadencePinnedReplayRecordClone),
    assembledTrace: records.map(cadencePinnedReplayRecordClone),
    sourceAnchors: replayCase.sourceAnchors,
    cadenceAtomIDs: replayCase.cadenceAtomIDs,
    cadencePortIDs: replayCase.cadencePortIDs,
    fixtureIDs: uniqueStrings(["cadence:event-timing-pinned-replay-gate", ...replayCase.fixtureIDs]),
    nativeEvidenceRefs: uniqueStrings([
      replayCase.fixtureID,
      ...replayCase.sourceAnchors,
      ...replayCase.fixtureIDs,
      ...records.map((record) => record.sourceAnchor),
      ...records.map((record) => record.sideEffectID),
    ]),
    exactDiffRisk: "pinned-timing-replay-needs-live-native-loop",
    knownLossiness: uniqueStrings([
      ...replayCase.knownLossiness,
      "cadence-event-timing-pinned-timing-replay-live-native-loop-not-proven",
      "cadence-event-timing-pinned-wall-clock-not-proven",
      "cadence-event-timing-pinned-tool-batch-native-scheduler-not-proven",
      "cadence-event-timing-pinned-final-summary-side-effects-not-proven",
      "cadence-event-timing-pinned-continuation-boundary-not-proven",
      "cadence-event-timing-pinned-side-effect-order-not-proven",
    ]),
  }
}

export function buildCadenceReplayAtomSnapshot(
  product: CadenceReplayProduct,
  key: CadenceReplayAtomKey,
  productProjector = buildCadenceProductProjectorSnapshot(product),
  sideEffectOrder = buildCadenceSideEffectOrderSnapshot(product),
): CadenceReplayAtomSnapshot {
  const profile = getCadencePolicyProfile(product)
  const scenarios = productProjector.scenarios.filter((scenario) => scenario.key === key)
  const nativeExact = cadenceReplayNativeExactEvidence(product, key)
  return {
    key,
    atomID: cadenceReplayAtomID(profile, key),
    portID: cadenceReplayPortID(key),
    flowStageID: cadenceReplayStageID(key),
    productProjectorID: productProjector.projectorID,
    productProjectorCoverage: productProjector.coverage,
    productProjectorFingerprint: productProjector.fingerprint,
    sideEffectOrderFingerprint: sideEffectOrder.fingerprint,
    sideEffectOrderFixtureID: sideEffectOrder.fixtureID,
    nativeFixtureSource: nativeExact.nativeFixtureSource ?? cadenceProductProjectorNativeFixtureSource(product),
    exactDiffStatus: nativeExact.exactDiffStatus,
    nativeParityClaim: nativeExact.nativeParityClaim,
    nativeExactFixtureIDs: nativeExact.nativeExactFixtureIDs,
    nativeEvidenceRefs: nativeExact.nativeEvidenceRefs,
    upstreamEvidenceRefs: uniqueStrings([...scenarios.flatMap((scenario) => scenario.upstreamEvidenceRefs), ...nativeExact.upstreamEvidenceRefs]),
    fixtureID: cadenceReplayFixtureID(product, key),
    decisions: cadenceReplayDecisionsFromProjector(scenarios),
    observedFields: uniqueStrings(scenarios.flatMap((scenario) => scenario.observedFields)),
    inferredFields: uniqueStrings([...scenarios.flatMap((scenario) => scenario.inferredFields), ...sideEffectOrder.scenarios.filter((scenario) => scenario.key === key).flatMap((scenario) => scenario.inferredFields)]),
    lossyFields: uniqueStrings([...scenarios.flatMap((scenario) => scenario.lossyFields), ...sideEffectOrder.lossyFields]),
  }
}

function buildCadenceEventTimingReplayGateCase(replay: CadenceReplaySnapshot): CadenceEventTimingReplayGateCase {
  const requestBoundary = replay.atoms.find((atom) => atom.key === "request-boundary")
  const toolBatch = replay.atoms.find((atom) => atom.key === "tool-batch-scheduler")
  const finalSummary = replay.atoms.find((atom) => atom.key === "final-summary")
  const requestSideEffects = replay.sideEffectOrder.scenarios.filter((scenario) => scenario.key === "request-boundary")
  const toolSideEffects = replay.sideEffectOrder.scenarios.filter((scenario) => scenario.key === "tool-batch-scheduler")
  const finalSideEffects = replay.sideEffectOrder.scenarios.filter((scenario) => scenario.key === "final-summary")

  return {
    product: replay.product,
    cadenceSourceID: cadenceSourceID(replay.product),
    evidenceRef: "conformance:cadence-event-timing-replay-gate",
    fixtureID: `${cadenceSourceID(replay.product)}-cadence:replay`,
    requestBoundary: uniqueStrings([
      ...cadenceDecisionMarkers(requestBoundary),
      ...cadenceSideEffectMarkers(requestSideEffects),
      ...cadenceProjectorMarkers(replay.productProjector.scenarios.filter((scenario) => scenario.key === "request-boundary")),
    ]),
    toolBatchOrder: uniqueStrings([
      ...cadenceDecisionMarkers(toolBatch),
      ...cadenceSideEffectMarkers(toolSideEffects),
      ...cadenceProjectorMarkers(replay.productProjector.scenarios.filter((scenario) => scenario.key === "tool-batch-scheduler")),
    ]),
    finalSummary: uniqueStrings([
      ...cadenceDecisionMarkers(finalSummary),
      ...cadenceSideEffectMarkers(finalSideEffects),
      ...cadenceProjectorMarkers(replay.productProjector.scenarios.filter((scenario) => scenario.key === "final-summary")),
    ]),
    continuation: uniqueStrings([
      ...cadenceDecisionMarkers(requestBoundary).filter((marker) => /continue|continuation|tool-results/i.test(marker)),
      ...cadenceSideEffectMarkers(requestSideEffects).filter((marker) => /provider-continuation|continuation|tool-results/i.test(marker)),
      ...cadenceProjectorMarkers(replay.productProjector.scenarios.filter((scenario) => scenario.key === "request-boundary")).filter((marker) => /continue|continuation|tool-results/i.test(marker)),
    ]),
    sideEffects: uniqueStrings(cadenceSideEffectMarkers(replay.sideEffectOrder.scenarios)),
    sourceAnchors: uniqueStrings([
      replay.upstreamRef,
      replay.evidenceRef,
      replay.productProjector.upstreamRef,
      replay.productProjector.fixtureID,
      replay.sideEffectOrder.evidenceRef,
      ...replay.atoms.flatMap((atom) => atom.upstreamEvidenceRefs),
      ...replay.atoms.flatMap((atom) => atom.nativeEvidenceRefs),
      ...replay.atoms.flatMap((atom) => atom.nativeExactFixtureIDs),
    ]),
    cadenceAtomIDs: uniqueStrings([
      replay.productProjector.projectorID,
      ...replay.atoms.map((atom) => atom.atomID),
    ]),
    cadencePortIDs: uniqueStrings(replay.atoms.map((atom) => atom.portID)),
    fixtureIDs: uniqueStrings(["cadence:event-timing-replay-gate", ...replay.fixtureIDs]),
    replayRisk: "source-anchored-partial",
    knownLossiness: uniqueStrings([
      ...replay.knownGaps,
      ...replay.productProjector.knownGaps,
      ...replay.sideEffectOrder.knownGaps,
      ...replay.sideEffectOrder.lossyFields,
      ...replay.atoms.flatMap((atom) => atom.lossyFields),
      ...replay.sideEffectOrder.scenarios.flatMap((scenario) => scenario.lossiness),
    ]),
  }
}

function cadenceReplayNativeExactEvidence(
  product: CadenceReplayProduct,
  key: CadenceReplayAtomKey,
): {
  exactDiffStatus: CadenceReplayExactDiffStatus
  nativeParityClaim: boolean
  nativeFixtureSource?: string
  nativeExactFixtureIDs: string[]
  nativeEvidenceRefs: string[]
  upstreamEvidenceRefs: string[]
} {
  if (product === "opencode" && key === "request-boundary") {
    return {
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeFixtureSource: "opencode-agent-loop-request-boundary-native-exact",
      nativeExactFixtureIDs: [openCodeAgentLoopRequestBoundaryNativeExactFixtureID],
      nativeEvidenceRefs: [
        openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef,
        openCodeAgentLoopRequestBoundaryNativeExactReplayRef,
      ],
      upstreamEvidenceRefs: [
        openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef,
        openCodeAgentLoopRequestBoundaryNativeExactReplayRef,
        openCodeAgentLoopRequestBoundaryNativeExactFixtureID,
      ],
    }
  }
  if (product === "opencode" && key === "final-summary") {
    return {
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeFixtureSource: "opencode-agent-loop-final-summary-native-exact",
      nativeExactFixtureIDs: [openCodeAgentLoopFinalSummaryNativeExactFixtureID],
      nativeEvidenceRefs: [
        openCodeAgentLoopFinalSummaryNativeExactEvidenceRef,
        openCodeAgentLoopFinalSummaryNativeExactReplayRef,
      ],
      upstreamEvidenceRefs: [
        openCodeAgentLoopFinalSummaryNativeExactEvidenceRef,
        openCodeAgentLoopFinalSummaryNativeExactReplayRef,
        openCodeAgentLoopFinalSummaryNativeExactFixtureID,
      ],
    }
  }
  return {
    exactDiffStatus: "exact-diff-partial",
    nativeParityClaim: false,
    nativeExactFixtureIDs: [],
    nativeEvidenceRefs: [],
    upstreamEvidenceRefs: [],
  }
}

function cadenceDecisionMarkers(atom: CadenceReplayAtomSnapshot | undefined): string[] {
  if (!atom) return []
  return atom.decisions.map((decision) => [
    atom.key,
    decision.scenarioID,
    decision.observedDecision,
    decision.reasonCode,
    decision.visibility,
  ].join(":"))
}

function cadenceProjectorMarkers(scenarios: CadenceProductProjectorScenario[]): string[] {
  return scenarios.flatMap((scenario) => [
    `${scenario.key}:${scenario.scenarioID}:expected:${scenario.expectedDecision}:reason:${scenario.reasonCode}:source:${scenario.source}:visibility:${scenario.visibility}`,
    ...scenario.observedFields.map((field) => `${scenario.key}:${scenario.scenarioID}:observed:${field}`),
    ...scenario.inferredFields.map((field) => `${scenario.key}:${scenario.scenarioID}:inferred:${field}`),
  ])
}

function cadenceSideEffectMarkers(scenarios: CadenceSideEffectOrderScenario[]): string[] {
  return scenarios.flatMap((scenario) => [
    `${scenario.key}:${scenario.scenarioID}:event-order:${scenario.nativeEventOrder.join(">")}:visibility:${scenario.visibility}`,
    `${scenario.key}:${scenario.scenarioID}:side-effects:${scenario.sideEffects.join(">")}`,
    `${scenario.key}:${scenario.scenarioID}:timing:${scenario.timingBuckets.join(">")}`,
    ...scenario.observedFields.map((field) => `${scenario.key}:${scenario.scenarioID}:observed:${field}`),
    ...scenario.inferredFields.map((field) => `${scenario.key}:${scenario.scenarioID}:inferred:${field}`),
  ])
}

function cadencePinnedReplayRecords(product: CadenceReplayProduct): CadenceEventTimingPinnedReplayRecord[] {
  if (product === "opencode") {
    return [
      cadencePinnedReplayRecord(product, "request-boundary", 1, "opencode.request-boundary.tool-results", "continue:tool-results-need-provider-continuation", "parallel:readonly-pair", "summary:accepted-result", "provider-continuation:tool-results-visible", "sqlite-session-read>provider-round-start", "tool-results-visible>request-boundary-check>provider-continuation", ["session.tool-result", "step.finish-boundary", "provider.request"], "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab", "sqlite-tool-result-before-provider-request"),
      cadencePinnedReplayRecord(product, "tool-batch-order", 2, "opencode.tool-batch.readonly-before-edit", "continue:tool-results-need-provider-continuation", "parallel:readonly-pair>sequential:mutating-edit", "summary:accepted-result", "provider-continuation:tool-results-visible", "permission-policy-read>plugin-tool-dispatch>sqlite-tool-result", "permission-or-plan>tool-dispatch>tool-result-record", ["permission.plan", "tool.dispatch", "sqlite.tool-result"], "opencode-cadence:tool-batch-scheduler", "readonly-tool-batch-before-mutating-dispatch"),
      cadencePinnedReplayRecord(product, "final-summary", 3, "opencode.final-summary.sqlite-write", "stop:provider-finish", "parallel:readonly-pair", "summary:provider.finish>sqlite.final-message>tui.visible-output", "stop:no-continuation", "sqlite-final-message-write>tui-output-flush", "finish-boundary>final-message-write>session-visible-output", ["provider.finish", "sqlite.final-message", "tui.visible-output"], "opencode-cadence:final-summary", "provider-finish-before-sqlite-final-message"),
      cadencePinnedReplayRecord(product, "continuation", 4, "opencode.continuation.provider-round", "continue:tool-results-need-provider-continuation", "parallel:readonly-pair", "summary:deferred", "provider-continuation:request-2", "sqlite-session-read>provider-round-start", "tool-results-visible>request-boundary-check>provider-continuation", ["session.tool-result", "step.finish-boundary", "provider.request"], "opencode-cadence:request-boundary", "plugin-hook-boundary"),
      cadencePinnedReplayRecord(product, "side-effects", 5, "opencode.side-effects.accept-cleanup", "stop:accepted", "sequential:cleanup", "summary:accepted-result", "stop:cleanup", "sqlite-accept-record>plugin-cleanup-boundary", "acceptance-check>stop-boundary>cleanup", ["acceptance-check", "provider.request", "cleanup-or-stop"], "opencode-cadence:side-effect-order", "plugin-cleanup-boundary"),
    ]
  }
  if (product === "pi-mono") {
    return [
      cadencePinnedReplayRecord(product, "request-boundary", 1, "pi.request-boundary.tool-results", "continue:jsonl-tool-results", "sequential:mutating-edit", "summary:accepted-result", "synthetic-continue:tool-results", "jsonl-v3-read>provider-round-start", "tool-results-visible>request-boundary-check>provider-continuation", ["jsonl.tool-result", "loop.boundary", "provider.request"], "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da", "jsonl-v3-tool-result-before-provider-request"),
      cadencePinnedReplayRecord(product, "tool-batch-order", 2, "pi.tool-batch.typebox", "continue:jsonl-tool-results", "sequential:typebox-tool-order", "summary:accepted-result", "synthetic-continue:tool-results", "extension-tool-registry-read>cli-tool-dispatch>jsonl-tool-result", "permission-or-plan>tool-dispatch>tool-result-record", ["typebox.tool-plan", "cli.tool-dispatch", "jsonl.tool-result"], "pi-mono-cadence:tool-batch-scheduler", "typebox-tool-order-before-jsonl-result"),
      cadencePinnedReplayRecord(product, "final-summary", 3, "pi.final-summary.jsonl", "stop:end-turn", "sequential:typebox-tool-order", "summary:provider.finish>jsonl.final-message>cli.visible-output", "stop:no-continuation", "jsonl-final-record-write>terminal-output-flush", "finish-boundary>final-message-write>session-visible-output", ["provider.finish", "jsonl.final-message", "cli.visible-output"], "pi-mono-cadence:final-summary", "provider-finish-before-jsonl-final-record"),
      cadencePinnedReplayRecord(product, "continuation", 4, "pi.continuation.synthetic", "continue:synthetic-continue", "sequential:typebox-tool-order", "summary:deferred", "synthetic-continue:request-2", "jsonl-v3-read>provider-round-start", "tool-results-visible>request-boundary-check>provider-continuation", ["jsonl.tool-result", "loop.boundary", "provider.request"], "pi-mono-cadence:request-boundary", "extension-continue-boundary"),
      cadencePinnedReplayRecord(product, "side-effects", 5, "pi.side-effects.accept-cleanup", "stop:accepted", "sequential:cleanup", "summary:accepted-result", "stop:cleanup", "jsonl-accept-record>extension-cleanup-hook", "acceptance-check>stop-boundary>cleanup", ["acceptance-check", "provider.request", "cleanup-or-stop"], "pi-mono-cadence:side-effect-order", "extension-cleanup-hook"),
    ]
  }
  if (product === "nanobot") {
    return [
      cadencePinnedReplayRecord(product, "request-boundary", 1, "nanobot.request-boundary.iteration", "continue:workspace-tool-result", "sequential:workspace-dispatch", "summary:iteration-stop", "iteration-continuation:provider-round", "workspace-session-read>provider-round-start", "tool-results-visible>request-boundary-check>provider-continuation", ["workspace.tool-result", "agent.iteration-boundary", "provider.request"], "upstream:HKUDS/nanobot@0.2.0", "workspace-tool-result-before-agent-iteration"),
      cadencePinnedReplayRecord(product, "tool-batch-order", 2, "nanobot.tool-batch.skills", "continue:workspace-tool-result", "sequential:skill-tool-dispatch", "summary:iteration-stop", "iteration-continuation:provider-round", "skills-index-read>workspace-tool-dispatch>workspace-session-write", "permission-or-plan>tool-dispatch>tool-result-record", ["skill.tool-plan", "workspace.dispatch", "workspace.session-write"], "nanobot-cadence:tool-batch-scheduler", "skill-tool-dispatch-before-workspace-write"),
      cadencePinnedReplayRecord(product, "final-summary", 3, "nanobot.final-summary.workspace", "stop:iteration-finish", "sequential:workspace-dispatch", "summary:agent.iteration-finish>workspace.session-write>visible-response", "stop:no-synthetic-continue", "workspace-session-write>memory-sidecar-read", "finish-boundary>final-message-write>session-visible-output", ["agent.iteration-finish", "workspace.session-write", "visible-response"], "nanobot-cadence:final-summary", "agent-finish-before-workspace-session-write"),
      cadencePinnedReplayRecord(product, "continuation", 4, "nanobot.continuation.iteration", "continue:iteration-round", "sequential:skill-tool-dispatch", "summary:deferred", "iteration-continuation:request-2", "workspace-session-read>provider-round-start", "tool-results-visible>request-boundary-check>provider-continuation", ["workspace.tool-result", "agent.iteration-boundary", "provider.request"], "nanobot-cadence:request-boundary", "provider-round-start"),
      cadencePinnedReplayRecord(product, "side-effects", 5, "nanobot.side-effects.cleanup", "stop:accepted", "sequential:cleanup", "summary:iteration-stop", "stop:cleanup", "workspace-session-accept-record>memory-cleanup-boundary", "acceptance-check>stop-boundary>cleanup", ["acceptance-check", "provider.request", "cleanup-or-stop"], "nanobot-cadence:side-effect-order", "memory-cleanup-boundary"),
    ]
  }
  return [
    cadencePinnedReplayRecord(product, "request-boundary", 1, "hermes.request-boundary.gateway", "continue:api-tool-result", "sequential:computer-use", "summary:interrupt-stop", "persistent-continuation:provider-round", "gateway-state-read>api-provider-round-start", "tool-results-visible>request-boundary-check>provider-continuation", ["api.tool-result", "gateway.loop-boundary", "provider.request"], "upstream:NousResearch/hermes-agent==0.15.1", "api-tool-result-before-gateway-request"),
    cadencePinnedReplayRecord(product, "tool-batch-order", 2, "hermes.tool-batch.computer-use", "continue:api-tool-result", "sequential:computer-use-dispatch", "summary:interrupt-stop", "persistent-continuation:provider-round", "tool-registry-read>computer-use-dispatch>api-tool-result", "permission-or-plan>tool-dispatch>tool-result-record", ["tool.plan", "computer-use.dispatch", "api.tool-result"], "hermes-agent-cadence:tool-batch-scheduler", "computer-use-dispatch-before-api-result"),
    cadencePinnedReplayRecord(product, "final-summary", 3, "hermes.final-summary.api", "stop:gateway-finish", "sequential:computer-use-dispatch", "summary:gateway.finish>api.final-message>acp.visible-output", "interrupt-stop", "api-session-write>acp-final-output", "finish-boundary>final-message-write>session-visible-output", ["gateway.finish", "api.final-message", "acp.visible-output"], "hermes-agent-cadence:final-summary", "gateway-finish-before-api-final-message"),
    cadencePinnedReplayRecord(product, "continuation", 4, "hermes.continuation.persistent", "continue:persistent-loop", "sequential:computer-use-dispatch", "summary:deferred", "persistent-continuation:request-2", "gateway-state-read>api-provider-round-start", "tool-results-visible>request-boundary-check>provider-continuation", ["api.tool-result", "gateway.loop-boundary", "provider.request"], "hermes-agent-cadence:request-boundary", "persistent-loop-boundary"),
    cadencePinnedReplayRecord(product, "side-effects", 5, "hermes.side-effects.force-close", "stop:accepted", "sequential:cleanup", "summary:interrupt-stop", "stop:cleanup", "api-accept-record>acp-cleanup-boundary", "acceptance-check>stop-boundary>cleanup", ["acceptance-check", "provider.request", "cleanup-or-stop"], "hermes-agent-cadence:side-effect-order", "acp-cleanup-boundary"),
  ]
}

function cadencePinnedReplayRecord(
  product: CadenceReplayProduct,
  dimension: CadenceEventTimingPinnedReplayDimension,
  sequence: number,
  traceID: string,
  requestBoundaryID: string,
  toolBatchID: string,
  finalSummaryID: string,
  continuationID: string,
  sideEffectOrderID: string,
  timingBucket: string,
  nativeEventOrder: string[],
  sourceAnchor: string,
  sideEffectID: string,
): CadenceEventTimingPinnedReplayRecord {
  return {
    dimension,
    sequence,
    traceID: `${product}:${traceID}`,
    requestBoundaryID,
    toolBatchID,
    finalSummaryID,
    continuationID,
    sideEffectOrderID,
    timingBucket,
    nativeEventOrder,
    sourceAnchor,
    sideEffectID,
  }
}

function cadencePinnedReplayRecordClone(record: CadenceEventTimingPinnedReplayRecord): CadenceEventTimingPinnedReplayRecord {
  return {
    ...record,
    nativeEventOrder: [...record.nativeEventOrder],
  }
}

function cadencePinnedReplayTraceRecord(
  records: CadenceEventTimingPinnedReplayRecord[],
  dimension: CadenceEventTimingPinnedReplayDimension,
): CadenceEventTimingPinnedReplayRecord | undefined {
  return records.find((record) => record.dimension === dimension)
}

function cadencePinnedReplayRecordMatches(
  upstream: CadenceEventTimingPinnedReplayRecord,
  candidate: CadenceEventTimingPinnedReplayRecord,
): boolean {
  return stableStringify(upstream) === stableStringify(candidate)
}

function cadencePinnedReplayOrderMatches(records: CadenceEventTimingPinnedReplayRecord[]): boolean {
  return records.map((record) => record.dimension).join("|") === cadenceEventTimingReplayGateDimensions.join("|") &&
    records.every((record, index) => record.sequence === index + 1)
}

function cadenceSourceID(product: CadenceReplayProduct): CadenceEventTimingReplayGateCase["cadenceSourceID"] {
  if (product === "pi-mono") return "pi"
  if (product === "hermes-agent") return "hermes"
  return product
}

function cadenceGateContains(values: readonly string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

export function cadenceReplayFixtureID(product: CadenceReplayProduct, key: CadenceReplayAtomKey): string {
  return `${product}-cadence:${key}`
}

export function buildCadenceSideEffectOrderSnapshot(product: CadenceReplayProduct): CadenceSideEffectOrderSnapshot {
  const scenarios = cadenceSideEffectOrderScenarios(product)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: cadenceProductProjectorUpstreamRef(product),
    evidenceRef: `conformance:${product}-cadence-side-effect-order`,
    fixtureID: `${product}-cadence:side-effect-order`,
    scenarios,
    observedFields: uniqueStrings(scenarios.flatMap((scenario) => scenario.observedFields)),
    inferredFields: uniqueStrings(scenarios.flatMap((scenario) => scenario.inferredFields)),
    lossyFields: cadenceSideEffectOrderLossyFields(product),
    knownGaps: [
      "side-effect-order-covered-by-partial-fixture",
      "native-event-wall-clock-timing-not-replayed",
      "native-side-effects-not-fully-replayed",
      "not-full-native-loop-replay",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

function cadenceSideEffectOrderScenarios(product: CadenceReplayProduct): CadenceSideEffectOrderScenario[] {
  return [
    {
      scenarioID: "provider-continuation-side-effect-order",
      key: "request-boundary",
      nativeEventOrder: cadenceSideEffectNativeEventOrder(product, "request-boundary"),
      sideEffects: cadenceSideEffects(product, "request-boundary"),
      timingBuckets: ["tool-results-visible", "request-boundary-check", "provider-continuation"],
      visibility: "observed",
      upstreamEvidenceRefs: cadenceSideEffectOrderEvidenceRefs(product, "request-boundary"),
      observedFields: ["toolResultBeforeContinuation", "providerContinuationBoundary", "stopReason"],
      inferredFields: cadenceSideEffectOrderInferredFields(product, "request-boundary"),
      lossiness: ["native-event-wall-clock-timing-not-replayed", "native-hook-side-effects-partial"],
    },
    {
      scenarioID: "tool-batch-dispatch-side-effect-order",
      key: "tool-batch-scheduler",
      nativeEventOrder: cadenceSideEffectNativeEventOrder(product, "tool-batch-scheduler"),
      sideEffects: cadenceSideEffects(product, "tool-batch-scheduler"),
      timingBuckets: ["permission-or-plan", "tool-dispatch", "tool-result-record"],
      visibility: "observed",
      upstreamEvidenceRefs: cadenceSideEffectOrderEvidenceRefs(product, "tool-batch-scheduler"),
      observedFields: ["readOnlyBatchOrder", "mutatingToolSerialization", "toolResultRecordAfterDispatch"],
      inferredFields: cadenceSideEffectOrderInferredFields(product, "tool-batch-scheduler"),
      lossiness: ["native-tool-dispatch-clock-not-replayed", "native-side-effects-not-fully-replayed"],
    },
    {
      scenarioID: "final-summary-write-side-effect-order",
      key: "final-summary",
      nativeEventOrder: cadenceSideEffectNativeEventOrder(product, "final-summary"),
      sideEffects: cadenceSideEffects(product, "final-summary"),
      timingBuckets: ["finish-boundary", "final-message-write", "session-visible-output"],
      visibility: "observed",
      upstreamEvidenceRefs: cadenceSideEffectOrderEvidenceRefs(product, "final-summary"),
      observedFields: ["finalMessageWriteOrder", "visibleOutputAfterFinalization", "acceptedSummaryPolicy"],
      inferredFields: cadenceSideEffectOrderInferredFields(product, "final-summary"),
      lossiness: ["native-final-message-storage-clock-not-replayed", "native-side-effects-not-fully-replayed"],
    },
    {
      scenarioID: "accept-or-stop-cleanup-side-effect-order",
      key: "request-boundary",
      nativeEventOrder: ["acceptance-check", ...cadenceSideEffectNativeEventOrder(product, "request-boundary").slice(-2), "cleanup-or-stop"],
      sideEffects: cadenceStopSideEffects(product),
      timingBuckets: ["acceptance-check", "stop-boundary", "cleanup"],
      visibility: "inferred",
      upstreamEvidenceRefs: cadenceSideEffectOrderEvidenceRefs(product, "request-boundary"),
      observedFields: ["stopBoundary", "acceptedResult"],
      inferredFields: [...cadenceSideEffectOrderInferredFields(product, "request-boundary"), "cleanupSideEffectOrder"],
      lossiness: ["native-cleanup-side-effects-inferred", "native-event-wall-clock-timing-not-replayed"],
    },
  ]
}

function cadenceSideEffectNativeEventOrder(product: CadenceReplayProduct, key: CadenceReplayAtomKey): string[] {
  if (key === "request-boundary") {
    if (product === "pi-mono") return ["jsonl.tool-result", "loop.boundary", "provider.request"]
    if (product === "nanobot") return ["workspace.tool-result", "agent.iteration-boundary", "provider.request"]
    if (product === "hermes-agent") return ["api.tool-result", "gateway.loop-boundary", "provider.request"]
    return ["session.tool-result", "step.finish-boundary", "provider.request"]
  }
  if (key === "tool-batch-scheduler") {
    if (product === "hermes-agent") return ["tool.plan", "computer-use.dispatch", "api.tool-result"]
    if (product === "nanobot") return ["skill.tool-plan", "workspace.dispatch", "workspace.session-write"]
    if (product === "pi-mono") return ["typebox.tool-plan", "cli.tool-dispatch", "jsonl.tool-result"]
    return ["permission.plan", "tool.dispatch", "sqlite.tool-result"]
  }
  if (product === "pi-mono") return ["provider.finish", "jsonl.final-message", "cli.visible-output"]
  if (product === "nanobot") return ["agent.iteration-finish", "workspace.session-write", "visible-response"]
  if (product === "hermes-agent") return ["gateway.finish", "api.final-message", "acp.visible-output"]
  return ["provider.finish", "sqlite.final-message", "tui.visible-output"]
}

function cadenceSideEffects(product: CadenceReplayProduct, key: CadenceReplayAtomKey): string[] {
  if (key === "request-boundary") {
    if (product === "nanobot") return ["workspace-session-read", "provider-round-start"]
    if (product === "hermes-agent") return ["gateway-state-read", "api-provider-round-start"]
    if (product === "pi-mono") return ["jsonl-v3-read", "provider-round-start"]
    return ["sqlite-session-read", "provider-round-start"]
  }
  if (key === "tool-batch-scheduler") {
    if (product === "hermes-agent") return ["tool-registry-read", "computer-use-dispatch"]
    if (product === "nanobot") return ["skills-index-read", "workspace-tool-dispatch"]
    if (product === "pi-mono") return ["extension-tool-registry-read", "cli-tool-dispatch"]
    return ["permission-policy-read", "plugin-tool-dispatch"]
  }
  if (product === "pi-mono") return ["jsonl-final-record-write", "terminal-output-flush"]
  if (product === "nanobot") return ["workspace-session-write", "memory-sidecar-read"]
  if (product === "hermes-agent") return ["api-session-write", "acp-final-output"]
  return ["sqlite-final-message-write", "tui-output-flush"]
}

function cadenceStopSideEffects(product: CadenceReplayProduct): string[] {
  if (product === "pi-mono") return ["jsonl-accept-record", "extension-cleanup-hook"]
  if (product === "nanobot") return ["workspace-session-accept-record", "memory-cleanup-boundary"]
  if (product === "hermes-agent") return ["api-accept-record", "acp-cleanup-boundary"]
  return ["sqlite-accept-record", "plugin-cleanup-boundary"]
}

function cadenceSideEffectOrderEvidenceRefs(product: CadenceReplayProduct, key: CadenceReplayAtomKey): string[] {
  return [cadenceProductProjectorUpstreamRef(product), ...cadenceSideEffectOrderProductRefs(product, key)]
}

function cadenceSideEffectOrderProductRefs(product: CadenceReplayProduct, key: CadenceReplayAtomKey): string[] {
  if (key === "request-boundary") {
    if (product === "pi-mono") return ["jsonl-v3-tool-result-before-provider-request", "extension-continue-boundary"]
    if (product === "nanobot") return ["workspace-tool-result-before-agent-iteration", "provider-round-start"]
    if (product === "hermes-agent") return ["api-tool-result-before-gateway-request", "persistent-loop-boundary"]
    return ["sqlite-tool-result-before-provider-request", "plugin-hook-boundary"]
  }
  if (key === "tool-batch-scheduler") {
    if (product === "opencode") return ["readonly-tool-batch-before-mutating-dispatch", "plugin-tool-side-effects"]
    if (product === "pi-mono") return ["typebox-tool-order-before-jsonl-result", "extension-tool-side-effects"]
    if (product === "nanobot") return ["skill-tool-dispatch-before-workspace-write", "workspace-tool-side-effects"]
    return ["computer-use-dispatch-before-api-result", "gateway-tool-side-effects"]
  }
  if (product === "pi-mono") return ["provider-finish-before-jsonl-final-record", "cli-visible-output"]
  if (product === "nanobot") return ["agent-finish-before-workspace-session-write", "memory-sidecar-visibility"]
  if (product === "hermes-agent") return ["gateway-finish-before-api-final-message", "acp-visible-output"]
  return ["provider-finish-before-sqlite-final-message", "tui-visible-output"]
}

function cadenceSideEffectOrderInferredFields(product: CadenceReplayProduct, key: CadenceReplayAtomKey): string[] {
  if (key === "request-boundary") {
    return product === "opencode" ? ["pluginHookMutationOrder", "providerRequestClock"] : ["nativeLoopHookOrder", "providerRequestClock"]
  }
  if (key === "tool-batch-scheduler") {
    return product === "hermes-agent" ? ["computerUseAsyncSideEffects", "toolDispatchClock"] : ["toolDispatchClock", "permissionOrExtensionSideEffects"]
  }
  return product === "nanobot" ? ["memorySidecarWriteOrder", "finalOutputClock"] : ["finalMessageStorageClock", "outputFlushOrder"]
}

function cadenceSideEffectOrderLossyFields(product: CadenceReplayProduct): string[] {
  const common = [
    "partial-cadence-side-effect-order",
    "native-event-wall-clock-timing-not-replayed",
    "native-side-effects-not-fully-replayed",
    "not-full-native-loop-replay",
  ]
  if (product === "opencode") return [...common, "opencode-plugin-hook-side-effects-partial"]
  if (product === "pi-mono") return [...common, "pi-extension-side-effects-partial"]
  if (product === "nanobot") return [...common, "nanobot-memory-workspace-side-effects-partial"]
  return [...common, "hermes-acp-gateway-side-effects-partial"]
}

function cadenceReplayAtomID(profile: CadencePolicyProfile, key: CadenceReplayAtomKey): string {
  if (key === "request-boundary") return profile.requestBoundaryID
  if (key === "final-summary") return profile.finalSummaryID
  return profile.toolBatchSchedulerID
}

function cadenceReplayPortID(key: CadenceReplayAtomKey): CadenceReplayAtomSnapshot["portID"] {
  if (key === "request-boundary") return "agent-loop.request-boundary"
  if (key === "final-summary") return "agent-loop.final-summary"
  return "tools.batch-scheduler"
}

function cadenceReplayStageID(key: CadenceReplayAtomKey): CadenceReplayStageID {
  if (key === "request-boundary") return "loop.boundary"
  if (key === "final-summary") return "final.summary"
  return "tool.batch"
}

function cadenceReplayDecisionsFromProjector(scenarios: CadenceProductProjectorScenario[]): CadenceReplayDecision[] {
  return scenarios.map((scenario) => ({
    scenarioID: scenario.scenarioID,
    observedDecision: scenario.expectedDecision,
    reasonCode: scenario.reasonCode,
    visibility: scenario.visibility,
  }))
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
