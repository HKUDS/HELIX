import { createHash } from "node:crypto"
import type { AgentTurnInput } from "../agent-loop"
import {
  hermesTurnNativeExactEvidenceRef,
  hermesTurnNativeExactFixtureID,
  hermesTurnNativeExactFixtureIDForKey,
  hermesTurnNativeExactReplayRef,
  hermesTurnNativeExactReplayRefForKey,
} from "../product-schema/hermes.ts"
import {
  nanobotTurnNativeExactEvidenceRef,
  nanobotTurnNativeExactFixtureID,
  nanobotTurnNativeExactFixtureIDForKey,
  nanobotTurnNativeExactReplayRef,
  nanobotTurnNativeExactReplayRefForKey,
} from "../product-schema/nanobot.ts"
import {
  openCodeAgentLoopFinalSummaryNativeExactEvidenceRef,
  openCodeAgentLoopFinalSummaryNativeExactFixtureID,
  openCodeAgentLoopFinalSummaryNativeExactReplayRef,
  openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef,
  openCodeAgentLoopRequestBoundaryNativeExactFixtureID,
  openCodeAgentLoopRequestBoundaryNativeExactReplayRef,
} from "../product-schema/opencode.ts"
import { renderRuntimeContext, type RuntimeContextInput } from "./runtime-context.ts"
import { turnProductProfile, type ProductTurnProfile, type TurnAtomKey, type TurnProductPersonality } from "./profiles.ts"

const openCodeAgentLoopNativeLoopEvidenceRefs = [
  openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef,
  openCodeAgentLoopRequestBoundaryNativeExactReplayRef,
  openCodeAgentLoopFinalSummaryNativeExactEvidenceRef,
  openCodeAgentLoopFinalSummaryNativeExactReplayRef,
]

const openCodeAgentLoopNativeLoopFixtureIDs = [
  openCodeAgentLoopRequestBoundaryNativeExactFixtureID,
  openCodeAgentLoopFinalSummaryNativeExactFixtureID,
]

export interface NormalizedTurnInput {
  text: string
  metadata: Record<string, unknown>
}

export type ProductTurnReplayAtomKey =
  | "input-normalizer"
  | "context-builder"
  | "prompt-assembler"
  | "provider-request-builder"
  | "provider-stream-runner"
  | "stream-reducer"
  | "tool-call-planner"
  | "tool-executor"
  | "result-recorder"
  | "retry-policy"
  | "continuation-policy"
  | "compaction-policy"
  | "stop-condition"
export type ProductTurnReplayStageID =
  | "input.normalize"
  | "context.build"
  | "prompt.assemble"
  | "provider.request"
  | "provider.stream"
  | "stream.project"
  | "tool.plan"
  | "tool.execute"
  | "session.assistant-write"
  | "loop.boundary"
export type ProductTurnReplayExactDiffStatus = "native-exact" | "exact-diff-partial"

export interface ProductTurnReplayAtomSnapshot {
  key: ProductTurnReplayAtomKey
  atomID: string
  flowStageID: ProductTurnReplayStageID
  selectedStrategy: string
  commonFallbackStrategy: string
  exactDiffStatus: ProductTurnReplayExactDiffStatus
  nativeParityClaim: boolean
  nativeExactFixtureIDs: string[]
  nativeEvidenceRefs: string[]
  upstreamEvidenceRefs: string[]
  fixtureID: string
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
}

export interface ProductTurnReplaySnapshot {
  schemaVersion: 1
  product: TurnProductPersonality
  upstreamRef: string
  evidenceRef: string
  fixtureIDs: string[]
  profileFingerprint: string
  profile: ProductTurnProfile
  turnDefaults: Partial<AgentTurnInput>
  atoms: ProductTurnReplayAtomSnapshot[]
  coveredKeys: ProductTurnReplayAtomKey[]
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeTurnPipelineBoundaryBranchID =
  | "input-to-message-v2-context"
  | "context-to-prompt-assembly"
  | "prompt-to-provider-request"
  | "provider-stream-to-tool-plan"
  | "tool-result-to-session-write"
  | "loop-policy-boundary"

export type OpenCodeTurnPipelineBoundaryStageID = ProductTurnReplayStageID

export interface OpenCodeTurnPipelineBoundaryEvent {
  branchID: OpenCodeTurnPipelineBoundaryBranchID
  sourceOrder: number
  atomKey: ProductTurnReplayAtomKey
  stageID: OpenCodeTurnPipelineBoundaryStageID
  upstreamAnchor: string
  inputMarker: string
  outputMarker: string
  retainedFields?: string[]
  lossyFields?: string[]
}

export interface OpenCodeTurnPipelineBoundaryProjection {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-pipeline-boundary-projection"
  fixtureID: "opencode-turn:pipeline-boundary-projection"
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  branchOrder: OpenCodeTurnPipelineBoundaryBranchID[]
  events: OpenCodeTurnPipelineBoundaryEvent[]
  coveredBranches: OpenCodeTurnPipelineBoundaryBranchID[]
  coveredAtomKeys: ProductTurnReplayAtomKey[]
  turnAtomIDs: string[]
  fixtureIDs: string[]
  retainedFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeTurnPipelineBoundaryIssue {
  id: string
  branchID?: OpenCodeTurnPipelineBoundaryBranchID
  atomKey?: ProductTurnReplayAtomKey
  message: string
}

export interface OpenCodeTurnPipelineBoundaryVerification {
  ok: boolean
  issues: OpenCodeTurnPipelineBoundaryIssue[]
}

export type OpenCodeTurnIdentityReadbackDimensionID =
  | "message-v2-object"
  | "context-readback"
  | "provider-request-object"
  | "tool-side-effect"
  | "session-write-readback"
  | "summary-stop-object"

export interface OpenCodeTurnIdentityReadbackRecord {
  dimensionID: OpenCodeTurnIdentityReadbackDimensionID
  sourceOrder: number
  atomKey: ProductTurnReplayAtomKey
  stageID: ProductTurnReplayStageID
  upstreamAnchor: string
  nativeObjectMarker: string
  harnessProjectionMarker: string
  retainedKeys?: string[]
  readbackMarkers?: string[]
  lossyFields?: string[]
}

export interface OpenCodeTurnIdentityReadbackProjection {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-identity-readback-projection"
  fixtureID: "opencode-turn:identity-readback-projection"
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  dimensionOrder: OpenCodeTurnIdentityReadbackDimensionID[]
  records: OpenCodeTurnIdentityReadbackRecord[]
  coveredDimensions: OpenCodeTurnIdentityReadbackDimensionID[]
  coveredAtomKeys: ProductTurnReplayAtomKey[]
  turnAtomIDs: string[]
  fixtureIDs: string[]
  retainedKeys: string[]
  readbackMarkers: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeTurnIdentityReadbackIssue {
  id: string
  dimensionID?: OpenCodeTurnIdentityReadbackDimensionID
  atomKey?: ProductTurnReplayAtomKey
  message: string
}

export interface OpenCodeTurnIdentityReadbackVerification {
  ok: boolean
  issues: OpenCodeTurnIdentityReadbackIssue[]
}

export type OpenCodeTurnLoopControlDimensionID =
  | "run-input-seed"
  | "provider-finish-routing"
  | "tool-result-loopback"
  | "context-compaction-gate"
  | "continuation-stop-gate"
  | "session-readback-next-step"

export interface OpenCodeTurnLoopControlRecord {
  dimensionID: OpenCodeTurnLoopControlDimensionID
  sourceOrder: number
  atomKey: ProductTurnReplayAtomKey
  stageID: ProductTurnReplayStageID
  upstreamAnchor: string
  controlSignal: string
  decisionMarker: string
  retainedKeys?: string[]
  timingMarkers?: string[]
  lossyFields?: string[]
}

export interface OpenCodeTurnLoopControlProjection {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-loop-control-projection"
  fixtureID: "opencode-turn:loop-control-projection"
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  dimensionOrder: OpenCodeTurnLoopControlDimensionID[]
  records: OpenCodeTurnLoopControlRecord[]
  coveredDimensions: OpenCodeTurnLoopControlDimensionID[]
  coveredAtomKeys: ProductTurnReplayAtomKey[]
  turnAtomIDs: string[]
  fixtureIDs: string[]
  retainedKeys: string[]
  timingMarkers: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeTurnLoopControlIssue {
  id: string
  dimensionID?: OpenCodeTurnLoopControlDimensionID
  atomKey?: ProductTurnReplayAtomKey
  message: string
}

export interface OpenCodeTurnLoopControlVerification {
  ok: boolean
  issues: OpenCodeTurnLoopControlIssue[]
}

export type OpenCodeTurnSideEffectTimelineDimensionID =
  | "message-context-side-effect"
  | "provider-stream-side-effect"
  | "tool-execution-side-effect"
  | "session-writeback-side-effect"
  | "compaction-readback-side-effect"
  | "summary-cleanup-side-effect"

export interface OpenCodeTurnSideEffectTimelineRecord {
  dimensionID: OpenCodeTurnSideEffectTimelineDimensionID
  sourceOrder: number
  atomKey: ProductTurnReplayAtomKey
  stageID: ProductTurnReplayStageID
  upstreamAnchor: string
  sideEffectSignal: string
  harnessProjectionMarker: string
  retainedKeys?: string[]
  orderMarkers?: string[]
  lossyFields?: string[]
}

export interface OpenCodeTurnSideEffectTimelineProjection {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-side-effect-timeline-projection"
  fixtureID: "opencode-turn:side-effect-timeline-projection"
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  dimensionOrder: OpenCodeTurnSideEffectTimelineDimensionID[]
  records: OpenCodeTurnSideEffectTimelineRecord[]
  coveredDimensions: OpenCodeTurnSideEffectTimelineDimensionID[]
  coveredAtomKeys: ProductTurnReplayAtomKey[]
  turnAtomIDs: string[]
  fixtureIDs: string[]
  retainedKeys: string[]
  orderMarkers: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeTurnSideEffectTimelineIssue {
  id: string
  dimensionID?: OpenCodeTurnSideEffectTimelineDimensionID
  atomKey?: ProductTurnReplayAtomKey
  message: string
}

export interface OpenCodeTurnSideEffectTimelineVerification {
  ok: boolean
  issues: OpenCodeTurnSideEffectTimelineIssue[]
}

export type OpenCodeTurnProviderStepDimensionID =
  | "provider-request-shape"
  | "provider-stream-frame"
  | "stream-reducer-delta"
  | "retry-continuation-decision"
  | "cancellation-cleanup-boundary"

export interface OpenCodeTurnProviderStepRecord {
  dimensionID: OpenCodeTurnProviderStepDimensionID
  sourceOrder: number
  atomKey: ProductTurnReplayAtomKey
  stageID: ProductTurnReplayStageID
  upstreamAnchor: string
  providerSignal: string
  harnessProjectionMarker: string
  retainedKeys?: string[]
  timingMarkers?: string[]
  lossyFields?: string[]
}

export interface OpenCodeTurnProviderStepProjection {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-provider-step-projection"
  fixtureID: "opencode-turn:provider-step-projection"
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  dimensionOrder: OpenCodeTurnProviderStepDimensionID[]
  records: OpenCodeTurnProviderStepRecord[]
  coveredDimensions: OpenCodeTurnProviderStepDimensionID[]
  coveredAtomKeys: ProductTurnReplayAtomKey[]
  turnAtomIDs: string[]
  fixtureIDs: string[]
  retainedKeys: string[]
  timingMarkers: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeTurnProviderStepIssue {
  id: string
  dimensionID?: OpenCodeTurnProviderStepDimensionID
  atomKey?: ProductTurnReplayAtomKey
  message: string
}

export interface OpenCodeTurnProviderStepVerification {
  ok: boolean
  issues: OpenCodeTurnProviderStepIssue[]
}

export interface ProductTurnAtoms {
  readonly product: TurnProductPersonality
  profile(): ProductTurnProfile
  atomID(key: TurnAtomKey): string
  normalizeInput(input: { text: string } & RuntimeContextInput): NormalizedTurnInput
  runtimeContext(input?: RuntimeContextInput): string | undefined
  turnDefaults(): Partial<AgentTurnInput>
}

export function createProductTurnAtoms(product: TurnProductPersonality): ProductTurnAtoms {
  const profile = turnProductProfile(product)
  return {
    product,
    profile: () => turnProductProfile(product),
    atomID(key) {
      return `${profile.atomPrefix}.turn.${key}`
    },
    normalizeInput(input) {
      const runtimeContext = renderRuntimeContext(profile, input)
      if (!runtimeContext) return { text: input.text, metadata: { product } }
      return {
        text: input.text ? `${input.text}\n\n${runtimeContext}` : runtimeContext,
        metadata: {
          product,
          runtimeContext: true,
          ...(input.channel ? { channel: input.channel } : {}),
          ...(input.chatID ? { chatID: input.chatID } : {}),
          ...(input.senderID ? { senderID: input.senderID } : {}),
        },
      }
    },
    runtimeContext(input = {}) {
      return renderRuntimeContext(profile, input)
    },
    turnDefaults() {
      return {
        assistantPartProtocol: profile.assistantPartProtocol,
        maxSteps: profile.maxSteps,
        ...(profile.maxInputTokens === undefined ? {} : { maxInputTokens: profile.maxInputTokens }),
        ...(profile.compactionKeepMessages === undefined ? {} : { compactionKeepMessages: profile.compactionKeepMessages }),
        maxToolResultTextChars: profile.maxToolResultTextChars,
        syntheticContinue: profile.syntheticContinue,
        maxSyntheticContinues: profile.maxSyntheticContinues,
      }
    },
  }
}

export const OPENCODE_TURN_PIPELINE_BOUNDARY_BRANCH_ORDER: OpenCodeTurnPipelineBoundaryBranchID[] = [
  "input-to-message-v2-context",
  "context-to-prompt-assembly",
  "prompt-to-provider-request",
  "provider-stream-to-tool-plan",
  "tool-result-to-session-write",
  "loop-policy-boundary",
]

export const OPENCODE_TURN_IDENTITY_READBACK_DIMENSION_ORDER: OpenCodeTurnIdentityReadbackDimensionID[] = [
  "message-v2-object",
  "context-readback",
  "provider-request-object",
  "tool-side-effect",
  "session-write-readback",
  "summary-stop-object",
]

export const OPENCODE_TURN_LOOP_CONTROL_DIMENSION_ORDER: OpenCodeTurnLoopControlDimensionID[] = [
  "run-input-seed",
  "provider-finish-routing",
  "tool-result-loopback",
  "context-compaction-gate",
  "continuation-stop-gate",
  "session-readback-next-step",
]

export const OPENCODE_TURN_SIDE_EFFECT_TIMELINE_DIMENSION_ORDER: OpenCodeTurnSideEffectTimelineDimensionID[] = [
  "message-context-side-effect",
  "provider-stream-side-effect",
  "tool-execution-side-effect",
  "session-writeback-side-effect",
  "compaction-readback-side-effect",
  "summary-cleanup-side-effect",
]

export const OPENCODE_TURN_PROVIDER_STEP_DIMENSION_ORDER: OpenCodeTurnProviderStepDimensionID[] = [
  "provider-request-shape",
  "provider-stream-frame",
  "stream-reducer-delta",
  "retry-continuation-decision",
  "cancellation-cleanup-boundary",
]

export function projectOpenCodeTurnPipelineBoundary(
  events: OpenCodeTurnPipelineBoundaryEvent[],
): OpenCodeTurnPipelineBoundaryProjection {
  const normalizedEvents = [...events]
    .map((event) => ({
      ...event,
      retainedFields: uniqueStrings(event.retainedFields ?? []),
      lossyFields: uniqueStrings(event.lossyFields ?? []),
    }))
    .sort((left, right) => {
      const branchDelta = OPENCODE_TURN_PIPELINE_BOUNDARY_BRANCH_ORDER.indexOf(left.branchID) - OPENCODE_TURN_PIPELINE_BOUNDARY_BRANCH_ORDER.indexOf(right.branchID)
      return branchDelta === 0 ? left.sourceOrder - right.sourceOrder : branchDelta
    })
  const coveredAtomKeys = uniqueProductTurnKeys(normalizedEvents.map((event) => event.atomKey))
  const projectionWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-pipeline-boundary-projection" as const,
    fixtureID: "opencode-turn:pipeline-boundary-projection" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    branchOrder: OPENCODE_TURN_PIPELINE_BOUNDARY_BRANCH_ORDER,
    events: normalizedEvents,
    coveredBranches: uniqueOpenCodeTurnBranches(normalizedEvents.map((event) => event.branchID)),
    coveredAtomKeys,
    turnAtomIDs: coveredAtomKeys.map((key) => `opencode.turn.${key}`),
    fixtureIDs: coveredAtomKeys.map((key) => `opencode-turn:${key}`),
    retainedFields: uniqueStrings(normalizedEvents.flatMap((event) => event.retainedFields ?? [])),
    lossyFields: uniqueStrings([
      ...normalizedEvents.flatMap((event) => event.lossyFields ?? []),
      "native-turn-loop-wall-clock-order-not-exact",
      "raw-message-v2-context-object-identity-not-exact",
      "provider-request-object-identity-not-exact",
      "tool-permission-sandbox-side-effects-not-exact",
      "sqlite-session-write-transaction-readback-not-exact",
      "summary-stop-boundary-timing-not-exact",
    ]),
    knownGaps: [
      "opencode-turn-pipeline-boundary-projection-partial-fixture",
      "opencode-full-native-turn-loop-not-replayed",
      "opencode-turn-raw-message-v2-context-not-exact",
      "opencode-turn-provider-request-object-identity-not-exact",
      "opencode-turn-tool-side-effects-not-exact",
      "opencode-turn-session-write-readback-not-exact",
      "opencode-turn-summary-stop-timing-not-exact",
    ],
  }
  return {
    ...projectionWithoutFingerprint,
    fingerprint: fingerprintObject(projectionWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnPipelineBoundaryProjection(
  projection: OpenCodeTurnPipelineBoundaryProjection,
): OpenCodeTurnPipelineBoundaryVerification {
  const issues: OpenCodeTurnPipelineBoundaryIssue[] = []
  if (projection.fixtureID !== "opencode-turn:pipeline-boundary-projection" || projection.evidenceRef !== "conformance:opencode-turn-pipeline-boundary-projection") {
    issues.push({
      id: "opencode-turn-pipeline-boundary.identity",
      message: "OpenCode turn pipeline boundary projection lost its fixture or evidence identity.",
    })
  }
  if (projection.nativeParityClaim !== false || projection.exactDiffStatus !== "exact-diff-partial" || projection.coverageStatus !== "partial") {
    issues.push({
      id: "opencode-turn-pipeline-boundary.native-claim",
      message: "OpenCode turn pipeline boundary projection must stay partial and cannot claim native parity.",
    })
  }
  for (const branchID of OPENCODE_TURN_PIPELINE_BOUNDARY_BRANCH_ORDER) {
    if (!projection.coveredBranches.includes(branchID)) {
      issues.push({
        id: "opencode-turn-pipeline-boundary.missing-branch",
        branchID,
        message: `OpenCode turn pipeline boundary projection is missing ${branchID}.`,
      })
    }
    const branchKeys = opencodeTurnPipelineBoundaryAtomKeys(branchID)
    for (const atomKey of branchKeys) {
      if (!projection.coveredAtomKeys.includes(atomKey)) {
        issues.push({
          id: "opencode-turn-pipeline-boundary.missing-atom",
          branchID,
          atomKey,
          message: `OpenCode turn pipeline boundary projection is missing opencode.turn.${atomKey}.`,
        })
      }
    }
  }
  if (!projection.knownGaps.includes("opencode-turn-pipeline-boundary-projection-partial-fixture")) {
    issues.push({
      id: "opencode-turn-pipeline-boundary.lossiness",
      message: "OpenCode turn pipeline boundary projection no longer records partial fixture lossiness.",
    })
  }
  if (!projection.lossyFields.some((field) => /object-identity|side-effects|transaction|timing|wall-clock/i.test(field))) {
    issues.push({
      id: "opencode-turn-pipeline-boundary.lossy-fields",
      message: "OpenCode turn pipeline boundary projection must name native timing, identity, side-effect, and readback lossiness.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function projectOpenCodeTurnIdentityReadbackProjection(
  records: OpenCodeTurnIdentityReadbackRecord[],
): OpenCodeTurnIdentityReadbackProjection {
  const normalizedRecords = [...records]
    .map((record) => ({
      ...record,
      retainedKeys: uniqueStrings(record.retainedKeys ?? []),
      readbackMarkers: uniqueStrings(record.readbackMarkers ?? []),
      lossyFields: uniqueStrings(record.lossyFields ?? []),
    }))
    .sort((left, right) => {
      const dimensionDelta = OPENCODE_TURN_IDENTITY_READBACK_DIMENSION_ORDER.indexOf(left.dimensionID) - OPENCODE_TURN_IDENTITY_READBACK_DIMENSION_ORDER.indexOf(right.dimensionID)
      return dimensionDelta === 0 ? left.sourceOrder - right.sourceOrder : dimensionDelta
    })
  const coveredAtomKeys = uniqueProductTurnKeys(normalizedRecords.map((record) => record.atomKey))
  const projectionWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-identity-readback-projection" as const,
    fixtureID: "opencode-turn:identity-readback-projection" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    dimensionOrder: OPENCODE_TURN_IDENTITY_READBACK_DIMENSION_ORDER,
    records: normalizedRecords,
    coveredDimensions: uniqueOpenCodeTurnIdentityReadbackDimensions(normalizedRecords.map((record) => record.dimensionID)),
    coveredAtomKeys,
    turnAtomIDs: coveredAtomKeys.map((key) => `opencode.turn.${key}`),
    fixtureIDs: coveredAtomKeys.map((key) => `opencode-turn:${key}`),
    retainedKeys: uniqueStrings(normalizedRecords.flatMap((record) => record.retainedKeys ?? [])),
    readbackMarkers: uniqueStrings(normalizedRecords.flatMap((record) => record.readbackMarkers ?? [])),
    lossyFields: uniqueStrings([
      ...normalizedRecords.flatMap((record) => record.lossyFields ?? []),
      "message-v2-object-identity-not-exact",
      "context-sqlite-row-object-identity-not-exact",
      "provider-request-object-identity-not-exact",
      "tool-permission-sandbox-side-effects-not-exact",
      "session-write-transaction-readback-not-exact",
      "summary-stop-hidden-message-object-identity-not-exact",
    ]),
    knownGaps: [
      "opencode-turn-identity-readback-projection-partial-fixture",
      "opencode-full-native-turn-loop-not-replayed",
      "opencode-turn-message-v2-object-identity-not-exact",
      "opencode-turn-provider-request-object-identity-not-exact",
      "opencode-turn-tool-side-effects-not-exact",
      "opencode-turn-session-write-readback-not-exact",
      "opencode-turn-summary-stop-object-identity-not-exact",
    ],
  }
  return {
    ...projectionWithoutFingerprint,
    fingerprint: fingerprintObject(projectionWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnIdentityReadbackProjection(
  projection: OpenCodeTurnIdentityReadbackProjection,
): OpenCodeTurnIdentityReadbackVerification {
  const issues: OpenCodeTurnIdentityReadbackIssue[] = []
  if (projection.fixtureID !== "opencode-turn:identity-readback-projection" || projection.evidenceRef !== "conformance:opencode-turn-identity-readback-projection") {
    issues.push({
      id: "opencode-turn-identity-readback.identity",
      message: "OpenCode turn identity/readback projection lost its fixture or evidence identity.",
    })
  }
  if (projection.nativeParityClaim !== false || projection.exactDiffStatus !== "exact-diff-partial" || projection.coverageStatus !== "partial") {
    issues.push({
      id: "opencode-turn-identity-readback.native-claim",
      message: "OpenCode turn identity/readback projection must stay partial and cannot claim native parity.",
    })
  }
  for (const dimensionID of OPENCODE_TURN_IDENTITY_READBACK_DIMENSION_ORDER) {
    if (!projection.coveredDimensions.includes(dimensionID)) {
      issues.push({
        id: "opencode-turn-identity-readback.missing-dimension",
        dimensionID,
        message: `OpenCode turn identity/readback projection is missing ${dimensionID}.`,
      })
    }
    const dimensionKeys = opencodeTurnIdentityReadbackAtomKeys(dimensionID)
    for (const atomKey of dimensionKeys) {
      if (!projection.coveredAtomKeys.includes(atomKey)) {
        issues.push({
          id: "opencode-turn-identity-readback.missing-atom",
          dimensionID,
          atomKey,
          message: `OpenCode turn identity/readback projection is missing opencode.turn.${atomKey}.`,
        })
      }
    }
  }
  if (!projection.knownGaps.includes("opencode-turn-identity-readback-projection-partial-fixture")) {
    issues.push({
      id: "opencode-turn-identity-readback.lossiness",
      message: "OpenCode turn identity/readback projection no longer records partial fixture lossiness.",
    })
  }
  if (!projection.readbackMarkers.some((marker) => /read|write|sqlite|transaction|session/i.test(marker))) {
    issues.push({
      id: "opencode-turn-identity-readback.readback-marker",
      message: "OpenCode turn identity/readback projection must keep sqlite/session readback markers visible.",
    })
  }
  if (!projection.lossyFields.some((field) => /object-identity|side-effects|readback|transaction/i.test(field))) {
    issues.push({
      id: "opencode-turn-identity-readback.lossy-fields",
      message: "OpenCode turn identity/readback projection must name object identity, side-effect, transaction, and readback lossiness.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function projectOpenCodeTurnLoopControlProjection(
  records: OpenCodeTurnLoopControlRecord[],
): OpenCodeTurnLoopControlProjection {
  const normalizedRecords = [...records]
    .map((record) => ({
      ...record,
      retainedKeys: uniqueStrings(record.retainedKeys ?? []),
      timingMarkers: uniqueStrings(record.timingMarkers ?? []),
      lossyFields: uniqueStrings(record.lossyFields ?? []),
    }))
    .sort((left, right) => {
      const dimensionDelta = OPENCODE_TURN_LOOP_CONTROL_DIMENSION_ORDER.indexOf(left.dimensionID) - OPENCODE_TURN_LOOP_CONTROL_DIMENSION_ORDER.indexOf(right.dimensionID)
      return dimensionDelta === 0 ? left.sourceOrder - right.sourceOrder : dimensionDelta
    })
  const coveredAtomKeys = uniqueProductTurnKeys(normalizedRecords.map((record) => record.atomKey))
  const projectionWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-loop-control-projection" as const,
    fixtureID: "opencode-turn:loop-control-projection" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    dimensionOrder: OPENCODE_TURN_LOOP_CONTROL_DIMENSION_ORDER,
    records: normalizedRecords,
    coveredDimensions: uniqueOpenCodeTurnLoopControlDimensions(normalizedRecords.map((record) => record.dimensionID)),
    coveredAtomKeys,
    turnAtomIDs: coveredAtomKeys.map((key) => `opencode.turn.${key}`),
    fixtureIDs: coveredAtomKeys.map((key) => `opencode-turn:${key}`),
    retainedKeys: uniqueStrings([
      ...normalizedRecords.flatMap((record) => record.retainedKeys ?? []),
      "controlSignal",
      "decisionMarker",
      "sourceOrder",
      "upstreamAnchor",
      "stageID",
    ]),
    timingMarkers: uniqueStrings(normalizedRecords.flatMap((record) => record.timingMarkers ?? [])),
    lossyFields: uniqueStrings([
      ...normalizedRecords.flatMap((record) => record.lossyFields ?? []),
      "native-loop-control-wall-clock-timing-not-exact",
      "provider-finish-retry-decision-object-identity-not-exact",
      "tool-result-loopback-side-effects-not-exact",
      "context-compaction-trigger-readback-not-exact",
      "continuation-stop-decision-order-not-exact",
      "session-readback-next-step-transaction-not-exact",
    ]),
    knownGaps: [
      "opencode-turn-loop-control-projection-partial-fixture",
      "opencode-full-native-turn-loop-not-replayed",
      "opencode-turn-loop-control-wall-clock-timing-not-exact",
      "opencode-turn-retry-continuation-stop-decision-not-exact",
      "opencode-turn-compaction-trigger-readback-not-exact",
      "opencode-turn-session-readback-next-step-not-exact",
    ],
  }
  return {
    ...projectionWithoutFingerprint,
    fingerprint: fingerprintObject(projectionWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnLoopControlProjection(
  projection: OpenCodeTurnLoopControlProjection,
): OpenCodeTurnLoopControlVerification {
  const issues: OpenCodeTurnLoopControlIssue[] = []
  if (projection.fixtureID !== "opencode-turn:loop-control-projection" || projection.evidenceRef !== "conformance:opencode-turn-loop-control-projection") {
    issues.push({
      id: "opencode-turn-loop-control.identity",
      message: "OpenCode turn loop-control projection lost its fixture or evidence identity.",
    })
  }
  if (projection.nativeParityClaim !== false || projection.exactDiffStatus !== "exact-diff-partial" || projection.coverageStatus !== "partial") {
    issues.push({
      id: "opencode-turn-loop-control.native-claim",
      message: "OpenCode turn loop-control projection must stay partial and cannot claim native parity.",
    })
  }
  for (const dimensionID of OPENCODE_TURN_LOOP_CONTROL_DIMENSION_ORDER) {
    if (!projection.coveredDimensions.includes(dimensionID)) {
      issues.push({
        id: "opencode-turn-loop-control.missing-dimension",
        dimensionID,
        message: `OpenCode turn loop-control projection is missing ${dimensionID}.`,
      })
    }
    const dimensionKeys = opencodeTurnLoopControlAtomKeys(dimensionID)
    for (const atomKey of dimensionKeys) {
      if (!projection.coveredAtomKeys.includes(atomKey)) {
        issues.push({
          id: "opencode-turn-loop-control.missing-atom",
          dimensionID,
          atomKey,
          message: `OpenCode turn loop-control projection is missing opencode.turn.${atomKey}.`,
        })
      }
    }
  }
  if (!projection.knownGaps.includes("opencode-turn-loop-control-projection-partial-fixture")) {
    issues.push({
      id: "opencode-turn-loop-control.lossiness",
      message: "OpenCode turn loop-control projection no longer records partial fixture lossiness.",
    })
  }
  if (!projection.timingMarkers.some((marker) => /retry|continue|continuation|compact|stop|loop|max-step|readback/i.test(marker))) {
    issues.push({
      id: "opencode-turn-loop-control.timing-marker",
      message: "OpenCode turn loop-control projection must keep retry, continuation, compaction, stop, or readback timing markers visible.",
    })
  }
  if (!projection.lossyFields.some((field) => /timing|wall-clock|decision|identity|side-effects|readback|transaction/i.test(field))) {
    issues.push({
      id: "opencode-turn-loop-control.lossy-fields",
      message: "OpenCode turn loop-control projection must name timing, decision, identity, side-effect, and readback lossiness.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function projectOpenCodeTurnSideEffectTimelineProjection(
  records: OpenCodeTurnSideEffectTimelineRecord[],
): OpenCodeTurnSideEffectTimelineProjection {
  const normalizedRecords = [...records]
    .map((record) => ({
      ...record,
      retainedKeys: uniqueStrings(record.retainedKeys ?? []),
      orderMarkers: uniqueStrings(record.orderMarkers ?? []),
      lossyFields: uniqueStrings(record.lossyFields ?? []),
    }))
    .sort((left, right) => {
      const dimensionDelta = OPENCODE_TURN_SIDE_EFFECT_TIMELINE_DIMENSION_ORDER.indexOf(left.dimensionID) - OPENCODE_TURN_SIDE_EFFECT_TIMELINE_DIMENSION_ORDER.indexOf(right.dimensionID)
      return dimensionDelta === 0 ? left.sourceOrder - right.sourceOrder : dimensionDelta
    })
  const coveredAtomKeys = uniqueProductTurnKeys(normalizedRecords.map((record) => record.atomKey))
  const projectionWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-side-effect-timeline-projection" as const,
    fixtureID: "opencode-turn:side-effect-timeline-projection" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    dimensionOrder: OPENCODE_TURN_SIDE_EFFECT_TIMELINE_DIMENSION_ORDER,
    records: normalizedRecords,
    coveredDimensions: uniqueOpenCodeTurnSideEffectTimelineDimensions(normalizedRecords.map((record) => record.dimensionID)),
    coveredAtomKeys,
    turnAtomIDs: coveredAtomKeys.map((key) => `opencode.turn.${key}`),
    fixtureIDs: coveredAtomKeys.map((key) => `opencode-turn:${key}`),
    retainedKeys: uniqueStrings([
      ...normalizedRecords.flatMap((record) => record.retainedKeys ?? []),
      "sideEffectSignal",
      "harnessProjectionMarker",
      "sourceOrder",
      "upstreamAnchor",
      "stageID",
    ]),
    orderMarkers: uniqueStrings(normalizedRecords.flatMap((record) => record.orderMarkers ?? [])),
    lossyFields: uniqueStrings([
      ...normalizedRecords.flatMap((record) => record.lossyFields ?? []),
      "provider-stream-event-side-effect-timing-not-exact",
      "tool-permission-execution-side-effects-not-exact",
      "session-writeback-readback-transaction-not-exact",
      "syncevent-dispatch-async-interleaving-not-exact",
      "summary-stop-cleanup-side-effect-order-not-exact",
      "native-side-effect-object-identity-not-exact",
    ]),
    knownGaps: [
      "opencode-turn-side-effect-timeline-projection-partial-fixture",
      "opencode-full-native-turn-loop-not-replayed",
      "opencode-provider-stream-side-effects-not-exact",
      "opencode-tool-execution-side-effects-not-exact",
      "opencode-session-writeback-side-effects-not-exact",
      "opencode-syncevent-dispatch-readback-not-exact",
      "opencode-summary-cleanup-side-effects-not-exact",
    ],
  }
  return {
    ...projectionWithoutFingerprint,
    fingerprint: fingerprintObject(projectionWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnSideEffectTimelineProjection(
  projection: OpenCodeTurnSideEffectTimelineProjection,
): OpenCodeTurnSideEffectTimelineVerification {
  const issues: OpenCodeTurnSideEffectTimelineIssue[] = []
  if (projection.fixtureID !== "opencode-turn:side-effect-timeline-projection" || projection.evidenceRef !== "conformance:opencode-turn-side-effect-timeline-projection") {
    issues.push({
      id: "opencode-turn-side-effect-timeline.identity",
      message: "OpenCode turn side-effect timeline projection lost its fixture or evidence identity.",
    })
  }
  if (projection.nativeParityClaim !== false || projection.exactDiffStatus !== "exact-diff-partial" || projection.coverageStatus !== "partial") {
    issues.push({
      id: "opencode-turn-side-effect-timeline.native-claim",
      message: "OpenCode turn side-effect timeline projection must stay partial and cannot claim native parity.",
    })
  }
  for (const dimensionID of OPENCODE_TURN_SIDE_EFFECT_TIMELINE_DIMENSION_ORDER) {
    if (!projection.coveredDimensions.includes(dimensionID)) {
      issues.push({
        id: "opencode-turn-side-effect-timeline.missing-dimension",
        dimensionID,
        message: `OpenCode turn side-effect timeline projection is missing ${dimensionID}.`,
      })
    }
    const dimensionKeys = opencodeTurnSideEffectTimelineAtomKeys(dimensionID)
    for (const atomKey of dimensionKeys) {
      if (!projection.coveredAtomKeys.includes(atomKey)) {
        issues.push({
          id: "opencode-turn-side-effect-timeline.missing-atom",
          dimensionID,
          atomKey,
          message: `OpenCode turn side-effect timeline projection is missing opencode.turn.${atomKey}.`,
        })
      }
    }
  }
  if (!projection.knownGaps.includes("opencode-turn-side-effect-timeline-projection-partial-fixture")) {
    issues.push({
      id: "opencode-turn-side-effect-timeline.lossiness",
      message: "OpenCode turn side-effect timeline projection no longer records partial fixture lossiness.",
    })
  }
  if (!projection.orderMarkers.some((marker) => /provider|tool|session|syncevent|summary|cleanup|write|dispatch|readback/i.test(marker))) {
    issues.push({
      id: "opencode-turn-side-effect-timeline.order-marker",
      message: "OpenCode turn side-effect timeline projection must keep provider, tool, session, SyncEvent, summary, cleanup, write, dispatch, or readback order markers visible.",
    })
  }
  if (!projection.lossyFields.some((field) => /side-effects|timing|transaction|identity|dispatch|readback|cleanup|interleaving/i.test(field))) {
    issues.push({
      id: "opencode-turn-side-effect-timeline.lossy-fields",
      message: "OpenCode turn side-effect timeline projection must name side-effect, timing, transaction, identity, dispatch, readback, cleanup, and interleaving lossiness.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function projectOpenCodeTurnProviderStepProjection(
  records: OpenCodeTurnProviderStepRecord[],
): OpenCodeTurnProviderStepProjection {
  const normalizedRecords = [...records]
    .map((record) => ({
      ...record,
      retainedKeys: uniqueStrings(record.retainedKeys ?? []),
      timingMarkers: uniqueStrings(record.timingMarkers ?? []),
      lossyFields: uniqueStrings(record.lossyFields ?? []),
    }))
    .sort((left, right) => {
      const dimensionDelta = OPENCODE_TURN_PROVIDER_STEP_DIMENSION_ORDER.indexOf(left.dimensionID) - OPENCODE_TURN_PROVIDER_STEP_DIMENSION_ORDER.indexOf(right.dimensionID)
      return dimensionDelta === 0 ? left.sourceOrder - right.sourceOrder : dimensionDelta
    })
  const coveredAtomKeys = uniqueProductTurnKeys(normalizedRecords.map((record) => record.atomKey))
  const projectionWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-provider-step-projection" as const,
    fixtureID: "opencode-turn:provider-step-projection" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    dimensionOrder: OPENCODE_TURN_PROVIDER_STEP_DIMENSION_ORDER,
    records: normalizedRecords,
    coveredDimensions: uniqueOpenCodeTurnProviderStepDimensions(normalizedRecords.map((record) => record.dimensionID)),
    coveredAtomKeys,
    turnAtomIDs: coveredAtomKeys.map((key) => `opencode.turn.${key}`),
    fixtureIDs: coveredAtomKeys.map((key) => `opencode-turn:${key}`),
    retainedKeys: uniqueStrings([
      ...normalizedRecords.flatMap((record) => record.retainedKeys ?? []),
      "providerSignal",
      "harnessProjectionMarker",
      "sourceOrder",
      "upstreamAnchor",
      "stageID",
    ]),
    timingMarkers: uniqueStrings(normalizedRecords.flatMap((record) => record.timingMarkers ?? [])),
    lossyFields: uniqueStrings([
      ...normalizedRecords.flatMap((record) => record.lossyFields ?? []),
      "provider-request-payload-object-identity-not-exact",
      "provider-stream-frame-wall-clock-timing-not-exact",
      "stream-reducer-delta-object-identity-not-exact",
      "retry-continuation-decision-order-not-exact",
      "provider-cancel-cleanup-race-not-exact",
    ]),
    knownGaps: [
      "opencode-turn-provider-step-projection-partial-fixture",
      "opencode-full-native-turn-loop-not-replayed",
      "opencode-turn-provider-request-payload-not-exact",
      "opencode-turn-provider-stream-frame-timing-not-exact",
      "opencode-turn-stream-reducer-delta-not-exact",
      "opencode-turn-retry-continuation-decision-not-exact",
      "opencode-turn-provider-cancel-cleanup-not-exact",
    ],
  }
  return {
    ...projectionWithoutFingerprint,
    fingerprint: fingerprintObject(projectionWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnProviderStepProjection(
  projection: OpenCodeTurnProviderStepProjection,
): OpenCodeTurnProviderStepVerification {
  const issues: OpenCodeTurnProviderStepIssue[] = []
  if (projection.fixtureID !== "opencode-turn:provider-step-projection" || projection.evidenceRef !== "conformance:opencode-turn-provider-step-projection") {
    issues.push({
      id: "opencode-turn-provider-step.identity",
      message: "OpenCode turn provider-step projection lost its fixture or evidence identity.",
    })
  }
  if (projection.nativeParityClaim !== false || projection.exactDiffStatus !== "exact-diff-partial" || projection.coverageStatus !== "partial") {
    issues.push({
      id: "opencode-turn-provider-step.native-claim",
      message: "OpenCode turn provider-step projection must stay partial and cannot claim native parity.",
    })
  }
  for (const dimensionID of OPENCODE_TURN_PROVIDER_STEP_DIMENSION_ORDER) {
    if (!projection.coveredDimensions.includes(dimensionID)) {
      issues.push({
        id: "opencode-turn-provider-step.missing-dimension",
        dimensionID,
        message: `OpenCode turn provider-step projection is missing ${dimensionID}.`,
      })
    }
    const dimensionKeys = opencodeTurnProviderStepAtomKeys(dimensionID)
    for (const atomKey of dimensionKeys) {
      if (!projection.coveredAtomKeys.includes(atomKey)) {
        issues.push({
          id: "opencode-turn-provider-step.missing-atom",
          dimensionID,
          atomKey,
          message: `OpenCode turn provider-step projection is missing opencode.turn.${atomKey}.`,
        })
      }
    }
  }
  if (!projection.knownGaps.includes("opencode-turn-provider-step-projection-partial-fixture")) {
    issues.push({
      id: "opencode-turn-provider-step.lossiness",
      message: "OpenCode turn provider-step projection no longer records partial fixture lossiness.",
    })
  }
  if (!projection.timingMarkers.some((marker) => /provider|stream|retry|cancel|abort|cleanup|continuation|finish/i.test(marker))) {
    issues.push({
      id: "opencode-turn-provider-step.timing-marker",
      message: "OpenCode turn provider-step projection must keep provider, stream, retry, cancellation, cleanup, continuation, or finish timing markers visible.",
    })
  }
  if (!projection.lossyFields.some((field) => /payload|frame|timing|wall-clock|identity|decision|cancel|cleanup|race/i.test(field))) {
    issues.push({
      id: "opencode-turn-provider-step.lossy-fields",
      message: "OpenCode turn provider-step projection must name payload, frame, timing, identity, decision, cancellation, cleanup, and race lossiness.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildProductTurnReplaySnapshot(product: TurnProductPersonality): ProductTurnReplaySnapshot {
  const atoms = createProductTurnAtoms(product)
  const profile = atoms.profile()
  const replayAtoms = productTurnReplayAtomKeys.map((key): ProductTurnReplayAtomSnapshot => {
    const nativeExact = productTurnNativeExactEvidence(product, key)
    return {
      key,
      atomID: atoms.atomID(key),
      flowStageID: productTurnReplayStageID(key),
      selectedStrategy: atoms.atomID(key),
      commonFallbackStrategy: commonTurnStrategy(key),
      exactDiffStatus: nativeExact.exactDiffStatus,
      nativeParityClaim: nativeExact.nativeParityClaim,
      nativeExactFixtureIDs: nativeExact.nativeExactFixtureIDs,
      nativeEvidenceRefs: nativeExact.nativeEvidenceRefs,
      upstreamEvidenceRefs: uniqueStrings([...productTurnUpstreamEvidenceRefs(product, key), ...nativeExact.upstreamEvidenceRefs]),
      fixtureID: productTurnReplayFixtureID(product, key),
      observedFields: productTurnObservedFields(profile, key),
      inferredFields: productTurnInferredFields(profile, key),
      lossyFields: productTurnLossyFields(product, key),
    }
  })
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: productTurnUpstreamRef(product),
    evidenceRef: `conformance:${product}-turn-replay-snapshot`,
    fixtureIDs: uniqueStrings([...replayAtoms.map((atom) => atom.fixtureID), ...replayAtoms.flatMap((atom) => atom.nativeExactFixtureIDs)]),
    profileFingerprint: fingerprintObject(profile),
    profile,
    turnDefaults: atoms.turnDefaults(),
    atoms: replayAtoms,
    coveredKeys: replayAtoms.map((atom) => atom.key),
    knownGaps: [
      "common-turn-runner-still-executes-profile-strategy",
      "full-native-loop-event-order-not-yet-replayed",
      "cadence-final-summary-and-cross-step-native-timing-covered-by-later-TODO27-slices",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type TurnNativeLoopReplayGateProduct = TurnProductPersonality
export type TurnNativeLoopReplayGateDimension = "run-turn" | "context-builder" | "provider-step" | "tool-step" | "summary-step"

export interface TurnNativeLoopReplayGateCase {
  product: TurnNativeLoopReplayGateProduct
  upstreamRef: string
  evidenceRef: "conformance:turn-native-loop-replay-gate"
  fixtureID: "turn:native-loop-replay-gate"
  runTurn: string[]
  contextBuilder: string[]
  providerStep: string[]
  toolStep: string[]
  summaryStep: string[]
  turnAtomIDs: string[]
  fixtureIDs: string[]
  upstreamEvidenceRefs: string[]
  nativeEvidenceRefs: string[]
  nativeClaimRisk: "profile-compatible-partial" | "common-runner-only" | "native-claim-without-upstream-fixture"
  knownLossiness: string[]
}

export interface TurnNativeLoopReplayGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:turn-native-loop-replay-gate"
  fixtureID: "turn:native-loop-replay-gate"
  products: TurnNativeLoopReplayGateProduct[]
  comparisonDimensions: TurnNativeLoopReplayGateDimension[]
  cases: TurnNativeLoopReplayGateCase[]
  fingerprint: string
}

export interface TurnNativeLoopReplayGateIssue {
  id: string
  product: TurnNativeLoopReplayGateProduct
  dimension: TurnNativeLoopReplayGateDimension
  message: string
}

export interface TurnNativeLoopReplayGateVerification {
  ok: boolean
  issues: TurnNativeLoopReplayGateIssue[]
}

export type TurnNativeLoopExactDiffBlockerProduct = TurnNativeLoopReplayGateProduct
export type TurnNativeLoopExactDiffBlockerDimension = TurnNativeLoopReplayGateDimension

export interface TurnNativeLoopExactDiffBlockerCase {
  product: TurnNativeLoopExactDiffBlockerProduct
  upstreamRef: string
  evidenceRef: "conformance:turn-native-loop-exact-diff-blocker-gate"
  fixtureID: "turn:native-loop-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  runTurn: string[]
  contextBuilder: string[]
  providerStep: string[]
  toolStep: string[]
  summaryStep: string[]
  turnAtomIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "common-runner-only" | "native-claim-without-upstream-fixture"
  knownLossiness: string[]
}

export interface TurnNativeLoopExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:turn-native-loop-exact-diff-blocker-gate"
  fixtureID: "turn:native-loop-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: TurnNativeLoopExactDiffBlockerProduct[]
  comparisonDimensions: TurnNativeLoopExactDiffBlockerDimension[]
  cases: TurnNativeLoopExactDiffBlockerCase[]
  fingerprint: string
}

export interface TurnNativeLoopExactDiffBlockerIssue {
  id: string
  product: TurnNativeLoopExactDiffBlockerProduct
  dimension: TurnNativeLoopExactDiffBlockerDimension
  message: string
}

export interface TurnNativeLoopExactDiffBlockerVerification {
  ok: boolean
  issues: TurnNativeLoopExactDiffBlockerIssue[]
}

export type TurnNativeLoopPinnedReplayProduct = TurnNativeLoopReplayGateProduct
export type TurnNativeLoopPinnedReplayDimension = TurnNativeLoopReplayGateDimension

export interface TurnNativeLoopPinnedReplayRecord {
  dimension: TurnNativeLoopPinnedReplayDimension
  sequence: number
  stepID: string
  inputID: string
  contextKey: string
  providerRequestID: string
  toolCallID: string
  sessionWritebackID: string
  summaryID: string
  stopReason: string
  retryAttempt: number
  continuationState: string
  sourceAnchor: string
  sideEffectID: string
}

export interface TurnNativeLoopPinnedReplayCase {
  product: TurnNativeLoopPinnedReplayProduct
  upstreamRef: string
  evidenceRef: "conformance:turn-native-loop-pinned-step-replay-gate"
  fixtureID: "turn:native-loop-pinned-step-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  upstreamSteps: TurnNativeLoopPinnedReplayRecord[]
  productReplaySteps: TurnNativeLoopPinnedReplayRecord[]
  assembledSteps: TurnNativeLoopPinnedReplayRecord[]
  turnAtomIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "pinned-step-replay-needs-live-loop" | "common-runner-only" | "native-claim-without-upstream-fixture"
  knownLossiness: string[]
}

export interface TurnNativeLoopPinnedReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:turn-native-loop-pinned-step-replay-gate"
  fixtureID: "turn:native-loop-pinned-step-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: TurnNativeLoopPinnedReplayProduct[]
  comparisonDimensions: TurnNativeLoopPinnedReplayDimension[]
  cases: TurnNativeLoopPinnedReplayCase[]
  fingerprint: string
}

export interface TurnNativeLoopPinnedReplayIssue {
  id: string
  product: TurnNativeLoopPinnedReplayProduct
  dimension: TurnNativeLoopPinnedReplayDimension
  message: string
}

export interface TurnNativeLoopPinnedReplayVerification {
  ok: boolean
  issues: TurnNativeLoopPinnedReplayIssue[]
}

export function buildTurnNativeLoopReplayGateSnapshot(): TurnNativeLoopReplayGateSnapshot {
  const products: TurnNativeLoopReplayGateProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  const cases = products.map((product) => buildTurnNativeLoopReplayGateCase(buildProductTurnReplaySnapshot(product)))
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:turn-native-loop-replay-gate" as const,
    fixtureID: "turn:native-loop-replay-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["run-turn", "context-builder", "provider-step", "tool-step", "summary-step"] as TurnNativeLoopReplayGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyTurnNativeLoopReplayGateSnapshot(snapshot: TurnNativeLoopReplayGateSnapshot): TurnNativeLoopReplayGateVerification {
  const issues: TurnNativeLoopReplayGateIssue[] = []
  const products: TurnNativeLoopReplayGateProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "turn-native-loop.missing-product",
        product,
        dimension: "run-turn",
        message: `Missing turn native-loop replay gate case for ${product}.`,
      })
      continue
    }
    if (!turnGateContains(item.runTurn, /input|run|loop|boundary|maxSteps|retry|continuation|stop|fixture|native-loop/i)) {
      issues.push({
        id: "turn-native-loop.run-turn",
        product,
        dimension: "run-turn",
        message: `${product} turn gate no longer records run-turn loop-control anchors.`,
      })
    }
    if (!turnGateContains(item.contextBuilder, /context|session|message|history|resource|runtime|compaction/i)) {
      issues.push({
        id: "turn-native-loop.context-builder",
        product,
        dimension: "context-builder",
        message: `${product} turn gate no longer records context-builder anchors.`,
      })
    }
    if (!turnGateContains(item.providerStep, /provider|request|stream|retry|transport|raw|finish|model/i)) {
      issues.push({
        id: "turn-native-loop.provider-step",
        product,
        dimension: "provider-step",
        message: `${product} turn gate no longer records provider-step anchors.`,
      })
    }
    if (!turnGateContains(item.toolStep, /tool|permission|executor|planner|sandbox|result/i)) {
      issues.push({
        id: "turn-native-loop.tool-step",
        product,
        dimension: "tool-step",
        message: `${product} turn gate no longer records tool-step anchors.`,
      })
    }
    if (!turnGateContains(item.summaryStep, /summary|continuation|compaction|stop|session|write|final|assistant/i)) {
      issues.push({
        id: "turn-native-loop.summary-step",
        product,
        dimension: "summary-step",
        message: `${product} turn gate no longer records summary/stop anchors.`,
      })
    }
    if (!turnGateContains(item.knownLossiness, /common-turn-runner|not-full-native-loop|partial|full-native-loop-event-order-not-yet-replayed/i)) {
      issues.push({
        id: "turn-native-loop.lossiness",
        product,
        dimension: "run-turn",
        message: `${product} turn gate no longer records partial native-loop lossiness.`,
      })
    }
    if (item.fixtureIDs.length < productTurnReplayAtomKeys.length) {
      issues.push({
        id: "turn-native-loop.missing-fixture",
        product,
        dimension: "run-turn",
        message: `${product} turn gate no longer carries every product turn replay fixture.`,
      })
    }
    if (
      product === "opencode" &&
      (!turnIncludesAll(item.nativeEvidenceRefs, openCodeAgentLoopNativeLoopEvidenceRefs) ||
        !turnIncludesAll(item.fixtureIDs, openCodeAgentLoopNativeLoopFixtureIDs))
    ) {
      issues.push({
        id: "turn-native-loop.agent-loop-native-evidence",
        product,
        dimension: "run-turn",
        message: "OpenCode turn native-loop gate lost agent-loop request-boundary or final-summary native exact evidence.",
      })
    }
    if (item.nativeClaimRisk !== "profile-compatible-partial") {
      issues.push({
        id: "turn-native-loop.native-claim-without-exact-fixture",
        product,
        dimension: "run-turn",
        message: `${product} turn gate cannot be promoted from profile-compatible partial replay to native complete.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildTurnNativeLoopExactDiffBlockerSnapshot(): TurnNativeLoopExactDiffBlockerSnapshot {
  const replayGate = buildTurnNativeLoopReplayGateSnapshot()
  const cases = replayGate.cases.map(buildTurnNativeLoopExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:turn-native-loop-exact-diff-blocker-gate" as const,
    fixtureID: "turn:native-loop-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: replayGate.comparisonDimensions as TurnNativeLoopExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildTurnNativeLoopPinnedReplaySnapshot(): TurnNativeLoopPinnedReplaySnapshot {
  const replayGate = buildTurnNativeLoopReplayGateSnapshot()
  const cases = replayGate.cases.map(buildTurnNativeLoopPinnedReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:turn-native-loop-pinned-step-replay-gate" as const,
    fixtureID: "turn:native-loop-pinned-step-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: replayGate.comparisonDimensions as TurnNativeLoopPinnedReplayDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyTurnNativeLoopExactDiffBlockerSnapshot(
  snapshot: TurnNativeLoopExactDiffBlockerSnapshot,
): TurnNativeLoopExactDiffBlockerVerification {
  const issues: TurnNativeLoopExactDiffBlockerIssue[] = []
  const products: TurnNativeLoopExactDiffBlockerProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "turn-native-loop-exact-diff.missing-product",
        product,
        dimension: "run-turn",
        message: `Missing turn native-loop exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "turn-native-loop-exact-diff.native-claim",
        product,
        dimension: "run-turn",
        message: `${product} turn native-loop blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!turnGateContains(item.runTurn, /input|run|loop|boundary|maxSteps|retry|continuation|stop|fixture|native-loop|exact-diff-not-proven/i)) {
      issues.push({
        id: "turn-native-loop-exact-diff.run-turn",
        product,
        dimension: "run-turn",
        message: `${product} turn native-loop blocker no longer records run-turn exact-diff anchors.`,
      })
    }
    if (!turnGateContains(item.contextBuilder, /context|session|message|history|resource|runtime|compaction|readback|exact-diff-not-proven/i)) {
      issues.push({
        id: "turn-native-loop-exact-diff.context-builder",
        product,
        dimension: "context-builder",
        message: `${product} turn native-loop blocker no longer records context-builder exact-diff anchors.`,
      })
    }
    if (!turnGateContains(item.providerStep, /provider|request|stream|retry|transport|raw|finish|model|exact-diff-not-proven/i)) {
      issues.push({
        id: "turn-native-loop-exact-diff.provider-step",
        product,
        dimension: "provider-step",
        message: `${product} turn native-loop blocker no longer records provider-step exact-diff anchors.`,
      })
    }
    if (!turnGateContains(item.toolStep, /tool|permission|executor|planner|sandbox|result|side-effects|exact-diff-not-proven/i)) {
      issues.push({
        id: "turn-native-loop-exact-diff.tool-step",
        product,
        dimension: "tool-step",
        message: `${product} turn native-loop blocker no longer records tool-step exact-diff anchors.`,
      })
    }
    if (!turnGateContains(item.summaryStep, /summary|continuation|compaction|stop|session|write|final|assistant|exact-diff-not-proven/i)) {
      issues.push({
        id: "turn-native-loop-exact-diff.summary-step",
        product,
        dimension: "summary-step",
        message: `${product} turn native-loop blocker no longer records summary/stop exact-diff anchors.`,
      })
    }
    if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.turnAtomIDs.length === 0 || !turnGateContains(item.knownLossiness, /not-proven|common-turn-runner|not-full-native-loop|partial/i)) {
      issues.push({
        id: "turn-native-loop-exact-diff.common-runner-only",
        product,
        dimension: "run-turn",
        message: `${product} turn native-loop blocker is not anchored to product-specific partial replay evidence.`,
      })
    }
    if (item.fixtureIDs.length < productTurnReplayAtomKeys.length || item.nativeEvidenceRefs.length < productTurnReplayAtomKeys.length) {
      issues.push({
        id: "turn-native-loop-exact-diff.missing-fixture",
        product,
        dimension: "run-turn",
        message: `${product} turn native-loop blocker no longer carries every product turn replay fixture.`,
      })
    }
    if (
      product === "opencode" &&
      (!turnIncludesAll(item.nativeEvidenceRefs, openCodeAgentLoopNativeLoopEvidenceRefs) ||
        !turnIncludesAll(item.fixtureIDs, openCodeAgentLoopNativeLoopFixtureIDs))
    ) {
      issues.push({
        id: "turn-native-loop-exact-diff.agent-loop-native-evidence",
        product,
        dimension: "run-turn",
        message: "OpenCode turn native-loop exact-diff blocker lost agent-loop request-boundary or final-summary native exact evidence.",
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyTurnNativeLoopPinnedReplaySnapshot(
  snapshot: TurnNativeLoopPinnedReplaySnapshot,
): TurnNativeLoopPinnedReplayVerification {
  const issues: TurnNativeLoopPinnedReplayIssue[] = []
  const products: TurnNativeLoopPinnedReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  const dimensions: TurnNativeLoopPinnedReplayDimension[] = ["run-turn", "context-builder", "provider-step", "tool-step", "summary-step"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "turn-native-loop-pinned-replay.missing-product",
        product,
        dimension: "run-turn",
        message: `Missing turn native-loop pinned replay case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "turn-native-loop-pinned-replay.native-claim",
        product,
        dimension: "run-turn",
        message: `${product} turn pinned replay must remain partial and cannot claim native parity.`,
      })
    }
    if (!turnPinnedReplayStepOrderMatches(item.upstreamSteps) || !turnPinnedReplayStepOrderMatches(item.productReplaySteps) || !turnPinnedReplayStepOrderMatches(item.assembledSteps)) {
      issues.push({
        id: "turn-native-loop-pinned-replay.run-turn",
        product,
        dimension: "run-turn",
        message: `${product} turn pinned replay no longer preserves native-loop step order.`,
      })
    }
    for (const dimension of dimensions) {
      const upstream = turnPinnedReplayStep(item.upstreamSteps, dimension)
      const productReplay = turnPinnedReplayStep(item.productReplaySteps, dimension)
      const assembled = turnPinnedReplayStep(item.assembledSteps, dimension)
      if (!upstream || !productReplay || !assembled || !turnPinnedReplayRecordMatches(upstream, productReplay) || !turnPinnedReplayRecordMatches(upstream, assembled)) {
        issues.push({
          id: `turn-native-loop-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} turn pinned replay ${dimension} fixture drifted from the upstream step sample.`,
        })
      }
    }
    if (item.exactDiffRisk !== "pinned-step-replay-needs-live-loop" || !turnGateContains(item.knownLossiness, /pinned-step-replay|live-loop-not-proven|common-turn-runner|not-full-native-loop|partial/i)) {
      issues.push({
        id: "turn-native-loop-pinned-replay.common-runner-only",
        product,
        dimension: "run-turn",
        message: `${product} turn pinned replay is no longer anchored as partial replay that still needs a live native loop.`,
      })
    }
    if (item.fixtureIDs.length < productTurnReplayAtomKeys.length || item.nativeEvidenceRefs.length < productTurnReplayAtomKeys.length) {
      issues.push({
        id: "turn-native-loop-pinned-replay.missing-fixture",
        product,
        dimension: "run-turn",
        message: `${product} turn pinned replay no longer carries every product turn fixture and evidence ref.`,
      })
    }
    if (
      product === "opencode" &&
      (!turnIncludesAll(item.nativeEvidenceRefs, openCodeAgentLoopNativeLoopEvidenceRefs) ||
        !turnIncludesAll(item.fixtureIDs, openCodeAgentLoopNativeLoopFixtureIDs))
    ) {
      issues.push({
        id: "turn-native-loop-pinned-replay.agent-loop-native-evidence",
        product,
        dimension: "run-turn",
        message: "OpenCode turn native-loop pinned replay lost agent-loop request-boundary or final-summary native exact evidence.",
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildTurnNativeLoopExactDiffBlockerCase(
  gateCase: TurnNativeLoopReplayGateCase,
): TurnNativeLoopExactDiffBlockerCase {
  return {
    product: gateCase.product,
    upstreamRef: gateCase.upstreamRef,
    evidenceRef: "conformance:turn-native-loop-exact-diff-blocker-gate",
    fixtureID: gateCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    runTurn: uniqueStrings([
      ...gateCase.runTurn,
      "turn-run-control-native-loop:exact-diff-not-proven",
    ]),
    contextBuilder: uniqueStrings([
      ...gateCase.contextBuilder,
      "turn-context-builder-native-readback:exact-diff-not-proven",
    ]),
    providerStep: uniqueStrings([
      ...gateCase.providerStep,
      "turn-provider-step-native-stream:exact-diff-not-proven",
    ]),
    toolStep: uniqueStrings([
      ...gateCase.toolStep,
      "turn-tool-step-native-side-effects:exact-diff-not-proven",
    ]),
    summaryStep: uniqueStrings([
      ...gateCase.summaryStep,
      "turn-summary-step-native-stop-policy:exact-diff-not-proven",
    ]),
    turnAtomIDs: gateCase.turnAtomIDs,
    fixtureIDs: gateCase.fixtureIDs,
    nativeEvidenceRefs: uniqueStrings([
      gateCase.fixtureID,
      ...gateCase.fixtureIDs,
      ...gateCase.upstreamEvidenceRefs,
      ...gateCase.nativeEvidenceRefs,
    ]),
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...gateCase.knownLossiness,
      "turn-run-control-native-loop-not-proven",
      "turn-context-builder-native-readback-not-proven",
      "turn-provider-step-native-stream-not-proven",
      "turn-tool-step-native-side-effects-not-proven",
      "turn-summary-step-native-stop-policy-not-proven",
    ]),
  }
}

function buildTurnNativeLoopPinnedReplayCase(
  gateCase: TurnNativeLoopReplayGateCase,
): TurnNativeLoopPinnedReplayCase {
  const records = turnNativeLoopPinnedReplayRecords(gateCase.product)
  return {
    product: gateCase.product,
    upstreamRef: gateCase.upstreamRef,
    evidenceRef: "conformance:turn-native-loop-pinned-step-replay-gate",
    fixtureID: "turn:native-loop-pinned-step-replay-gate",
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    upstreamSteps: records.map(turnPinnedReplayRecordClone),
    productReplaySteps: records.map(turnPinnedReplayRecordClone),
    assembledSteps: records.map(turnPinnedReplayRecordClone),
    turnAtomIDs: gateCase.turnAtomIDs,
    fixtureIDs: gateCase.fixtureIDs,
    nativeEvidenceRefs: uniqueStrings([
      gateCase.fixtureID,
      ...gateCase.fixtureIDs,
      ...gateCase.upstreamEvidenceRefs,
      ...gateCase.nativeEvidenceRefs,
      ...records.map((record) => record.sourceAnchor),
      ...records.map((record) => record.sideEffectID),
    ]),
    exactDiffRisk: "pinned-step-replay-needs-live-loop",
    knownLossiness: uniqueStrings([
      ...gateCase.knownLossiness,
      "turn-native-loop-pinned-step-replay-live-loop-not-proven",
      "turn-native-loop-pinned-provider-retry-timing-not-proven",
      "turn-native-loop-pinned-tool-side-effects-not-proven",
      "turn-native-loop-pinned-session-writeback-not-proven",
      "turn-native-loop-pinned-summary-stop-timing-not-proven",
    ]),
  }
}

function buildTurnNativeLoopReplayGateCase(snapshot: ProductTurnReplaySnapshot): TurnNativeLoopReplayGateCase {
  const agentLoopNativeEvidenceRefs = snapshot.product === "opencode" ? openCodeAgentLoopNativeLoopEvidenceRefs : []
  const agentLoopNativeFixtureIDs = snapshot.product === "opencode" ? openCodeAgentLoopNativeLoopFixtureIDs : []
  return {
    product: snapshot.product,
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: "conformance:turn-native-loop-replay-gate",
    fixtureID: "turn:native-loop-replay-gate",
    runTurn: turnAtomMarkers(snapshot, ["input-normalizer", "retry-policy", "continuation-policy", "stop-condition"]),
    contextBuilder: turnAtomMarkers(snapshot, ["context-builder", "prompt-assembler", "compaction-policy"]),
    providerStep: turnAtomMarkers(snapshot, ["provider-request-builder", "provider-stream-runner", "stream-reducer", "retry-policy"]),
    toolStep: turnAtomMarkers(snapshot, ["tool-call-planner", "tool-executor", "result-recorder"]),
    summaryStep: turnAtomMarkers(snapshot, ["result-recorder", "continuation-policy", "compaction-policy", "stop-condition"]),
    turnAtomIDs: snapshot.atoms.map((atom) => atom.atomID),
    fixtureIDs: uniqueStrings([...snapshot.fixtureIDs, ...agentLoopNativeFixtureIDs]),
    upstreamEvidenceRefs: uniqueStrings([
      ...snapshot.atoms.flatMap((atom) => atom.upstreamEvidenceRefs),
      ...agentLoopNativeEvidenceRefs,
      ...agentLoopNativeFixtureIDs,
    ]),
    nativeEvidenceRefs: agentLoopNativeEvidenceRefs,
    nativeClaimRisk: "profile-compatible-partial",
    knownLossiness: uniqueStrings([...snapshot.knownGaps, ...snapshot.atoms.flatMap((atom) => atom.lossyFields)]),
  }
}

function turnAtomMarkers(snapshot: ProductTurnReplaySnapshot, keys: ProductTurnReplayAtomKey[]): string[] {
  const selected = snapshot.atoms.filter((atom) => keys.includes(atom.key))
  return uniqueStrings(selected.flatMap((atom) => [
    atom.key,
    atom.atomID,
    atom.flowStageID,
    atom.selectedStrategy,
    atom.commonFallbackStrategy,
    atom.exactDiffStatus,
    atom.nativeParityClaim ? "native-parity-claimed" : "native-parity-not-claimed",
    atom.fixtureID,
    ...atom.nativeExactFixtureIDs,
    ...atom.nativeEvidenceRefs,
    ...atom.upstreamEvidenceRefs,
    ...atom.observedFields,
    ...atom.inferredFields,
    ...atom.lossyFields,
  ]))
}

function turnNativeLoopPinnedReplayRecords(product: TurnNativeLoopPinnedReplayProduct): TurnNativeLoopPinnedReplayRecord[] {
  if (product === "opencode") {
    return [
      turnPinnedReplayRecord(product, "run-turn", 1, "opencode.run-turn.msg-001", "msg_oc_1", "message-v2-context", "req_oc_provider_1", "tool_oc_bash_1", "write_oc_assistant_1", "summary_oc_stop_1", "tool-use-stop", 0, "enter-provider", "opencode-turn:input-normalizer", "sqlite-session-events:read-before-run"),
      turnPinnedReplayRecord(product, "context-builder", 2, "opencode.context.sqlite-001", "msg_oc_1", "sqlite-session-events:message-v2-context", "req_oc_provider_1", "tool_oc_bash_1", "write_oc_assistant_1", "summary_oc_stop_1", "tool-use-stop", 0, "context-selected", "opencode-turn:context-builder", "sqlite-session-read:branch-main"),
      turnPinnedReplayRecord(product, "provider-step", 3, "opencode.provider.sse-001", "msg_oc_1", "message-v2-context", "req_oc_provider_1", "tool_oc_bash_1", "write_oc_assistant_1", "summary_oc_stop_1", "tool-use-stop", 1, "provider-retry-resolved", "opencode-turn:provider-stream-runner", "raw-sse-frame-order"),
      turnPinnedReplayRecord(product, "tool-step", 4, "opencode.tool.bash-001", "msg_oc_1", "message-v2-context", "req_oc_provider_1", "tool_oc_bash_1", "write_oc_tool_result_1", "summary_oc_stop_1", "tool-use-stop", 1, "tool-result-recorded", "opencode-turn:tool-executor", "permission-tool-scheduler"),
      turnPinnedReplayRecord(product, "summary-step", 5, "opencode.summary.stop-001", "msg_oc_1", "message-v2-context", "req_oc_provider_1", "tool_oc_bash_1", "write_oc_assistant_1", "summary_oc_stop_1", "tool-use-stop", 1, "stop-no-synthetic-continue", "opencode-turn:stop-condition", "message-v2-assistant-parts"),
    ]
  }
  if (product === "pi-mono") {
    return [
      turnPinnedReplayRecord(product, "run-turn", 1, "pi.run-turn.leaf-001", "leaf_pi_1", "active-leaf-context", "req_pi_anthropic_1", "tool_pi_read_file_1", "write_pi_jsonl_v3_1", "summary_pi_branch_1", "end-turn-and-tool-use-stop", 0, "synthetic-continue-allowed", "pi-mono-turn:input-normalizer", "cli-args-and-jsonl-v3-input"),
      turnPinnedReplayRecord(product, "context-builder", 2, "pi.context.leaf-001", "leaf_pi_1", "jsonl-v3-session-records:active-leaf-context", "req_pi_anthropic_1", "tool_pi_read_file_1", "write_pi_jsonl_v3_1", "summary_pi_branch_1", "end-turn-and-tool-use-stop", 0, "leaf-context-selected", "pi-mono-turn:context-builder", "active-leaf-context"),
      turnPinnedReplayRecord(product, "provider-step", 3, "pi.provider.anthropic-001", "leaf_pi_1", "active-leaf-context", "req_pi_anthropic_1", "tool_pi_read_file_1", "write_pi_jsonl_v3_1", "summary_pi_branch_1", "end-turn-and-tool-use-stop", 1, "anthropic-retry-recorded", "pi-mono-turn:provider-stream-runner", "jsonl-v3-provider-stream"),
      turnPinnedReplayRecord(product, "tool-step", 4, "pi.tool.read-file-001", "leaf_pi_1", "active-leaf-context", "req_pi_anthropic_1", "tool_pi_read_file_1", "write_pi_tool_result_1", "summary_pi_branch_1", "end-turn-and-tool-use-stop", 1, "extension-tool-result-recorded", "pi-mono-turn:tool-executor", "extension-tool-execution"),
      turnPinnedReplayRecord(product, "summary-step", 5, "pi.summary.branch-001", "leaf_pi_1", "active-leaf-context", "req_pi_anthropic_1", "tool_pi_read_file_1", "write_pi_jsonl_v3_1", "summary_pi_branch_1", "end-turn-and-tool-use-stop", 1, "synthetic-continue-consumed", "pi-mono-turn:result-recorder", "jsonl-v3-assistant-record"),
    ]
  }
  if (product === "nanobot") {
    return [
      turnPinnedReplayRecord(product, "run-turn", 1, "nanobot.run-turn.channel-001", "channel_nb_1", "workspace-channel-runtime-context", "req_nb_provider_1", "tool_nb_workspace_file_1", "write_nb_memory_history_1", "summary_nb_iteration_stop_1", "tool-call-stop", 0, "iteration-open", "nanobot-turn:input-normalizer", "workspace-channel-input"),
      turnPinnedReplayRecord(product, "context-builder", 2, "nanobot.context.memory-001", "channel_nb_1", "memory-history-context", "req_nb_provider_1", "tool_nb_workspace_file_1", "write_nb_memory_history_1", "summary_nb_iteration_stop_1", "tool-call-stop", 0, "memory-context-selected", "nanobot-turn:context-builder", "workspace-session-jsonl"),
      turnPinnedReplayRecord(product, "provider-step", 3, "nanobot.provider.hook-001", "channel_nb_1", "memory-history-context", "req_nb_provider_1", "tool_nb_workspace_file_1", "write_nb_memory_history_1", "summary_nb_iteration_stop_1", "tool-call-stop", 1, "agent-hook-provider-retry", "nanobot-turn:provider-stream-runner", "provider-retry-loop"),
      turnPinnedReplayRecord(product, "tool-step", 4, "nanobot.tool.workspace-file-001", "channel_nb_1", "memory-history-context", "req_nb_provider_1", "tool_nb_workspace_file_1", "write_nb_tool_result_1", "summary_nb_iteration_stop_1", "tool-call-stop", 1, "skill-tool-result-recorded", "nanobot-turn:tool-executor", "workspace-file-tool"),
      turnPinnedReplayRecord(product, "summary-step", 5, "nanobot.summary.iteration-001", "channel_nb_1", "memory-history-context", "req_nb_provider_1", "tool_nb_workspace_file_1", "write_nb_memory_history_1", "summary_nb_iteration_stop_1", "tool-call-stop", 1, "no-synthetic-continue", "nanobot-turn:stop-condition", "memory-history-session-write"),
    ]
  }
  return [
    turnPinnedReplayRecord(product, "run-turn", 1, "hermes.run-turn.api-001", "api_hermes_1", "volatile-registry-context", "req_hermes_chat_1", "tool_hermes_acp_1", "write_hermes_sqlite_1", "summary_hermes_interrupt_1", "tool-calls-stop", 0, "persistent-continuation-open", "hermes-agent-turn:input-normalizer", "api-acp-gateway-input"),
    turnPinnedReplayRecord(product, "context-builder", 2, "hermes.context.registry-001", "api_hermes_1", "stable-context-volatile-registry", "req_hermes_chat_1", "tool_hermes_acp_1", "write_hermes_sqlite_1", "summary_hermes_interrupt_1", "tool-calls-stop", 0, "volatile-context-selected", "hermes-agent-turn:context-builder", "sqlite-fts-storage"),
    turnPinnedReplayRecord(product, "provider-step", 3, "hermes.provider.chat-001", "api_hermes_1", "stable-context-volatile-registry", "req_hermes_chat_1", "tool_hermes_acp_1", "write_hermes_sqlite_1", "summary_hermes_interrupt_1", "tool-calls-stop", 1, "persistent-provider-retry", "hermes-agent-turn:provider-stream-runner", "chat-completions-stream"),
    turnPinnedReplayRecord(product, "tool-step", 4, "hermes.tool.acp-001", "api_hermes_1", "stable-context-volatile-registry", "req_hermes_chat_1", "tool_hermes_acp_1", "write_hermes_tool_result_1", "summary_hermes_interrupt_1", "tool-calls-stop", 1, "acp-tool-result-recorded", "hermes-agent-turn:tool-executor", "acp-api-tool-execution"),
    turnPinnedReplayRecord(product, "summary-step", 5, "hermes.summary.interrupt-001", "api_hermes_1", "stable-context-volatile-registry", "req_hermes_chat_1", "tool_hermes_acp_1", "write_hermes_sqlite_1", "summary_hermes_interrupt_1", "interrupt-stop", 1, "persistent-assistant-continuation", "hermes-agent-turn:stop-condition", "api-session-record"),
  ]
}

function turnPinnedReplayRecord(
  product: TurnNativeLoopPinnedReplayProduct,
  dimension: TurnNativeLoopPinnedReplayDimension,
  sequence: number,
  stepID: string,
  inputID: string,
  contextKey: string,
  providerRequestID: string,
  toolCallID: string,
  sessionWritebackID: string,
  summaryID: string,
  stopReason: string,
  retryAttempt: number,
  continuationState: string,
  sourceAnchor: string,
  sideEffectID: string,
): TurnNativeLoopPinnedReplayRecord {
  return {
    dimension,
    sequence,
    stepID,
    inputID: `${product}:${inputID}`,
    contextKey,
    providerRequestID,
    toolCallID,
    sessionWritebackID,
    summaryID,
    stopReason,
    retryAttempt,
    continuationState,
    sourceAnchor,
    sideEffectID,
  }
}

function turnPinnedReplayRecordClone(record: TurnNativeLoopPinnedReplayRecord): TurnNativeLoopPinnedReplayRecord {
  return { ...record }
}

function turnPinnedReplayStep(
  records: TurnNativeLoopPinnedReplayRecord[],
  dimension: TurnNativeLoopPinnedReplayDimension,
): TurnNativeLoopPinnedReplayRecord | undefined {
  return records.find((record) => record.dimension === dimension)
}

function turnPinnedReplayRecordMatches(
  upstream: TurnNativeLoopPinnedReplayRecord,
  candidate: TurnNativeLoopPinnedReplayRecord,
): boolean {
  return stableStringify(upstream) === stableStringify(candidate)
}

function turnPinnedReplayStepOrderMatches(records: TurnNativeLoopPinnedReplayRecord[]): boolean {
  const dimensions: TurnNativeLoopPinnedReplayDimension[] = ["run-turn", "context-builder", "provider-step", "tool-step", "summary-step"]
  return records.map((record) => record.dimension).join("|") === dimensions.join("|") &&
    records.every((record, index) => record.sequence === index + 1)
}

function turnGateContains(values: string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

function turnIncludesAll(values: string[], requiredValues: string[]): boolean {
  return requiredValues.every((requiredValue) => values.includes(requiredValue))
}

function opencodeTurnPipelineBoundaryAtomKeys(branchID: OpenCodeTurnPipelineBoundaryBranchID): ProductTurnReplayAtomKey[] {
  if (branchID === "input-to-message-v2-context") return ["input-normalizer", "context-builder"]
  if (branchID === "context-to-prompt-assembly") return ["context-builder", "prompt-assembler", "compaction-policy"]
  if (branchID === "prompt-to-provider-request") return ["prompt-assembler", "provider-request-builder"]
  if (branchID === "provider-stream-to-tool-plan") return ["provider-stream-runner", "stream-reducer", "tool-call-planner", "retry-policy"]
  if (branchID === "tool-result-to-session-write") return ["tool-executor", "result-recorder"]
  return ["retry-policy", "continuation-policy", "compaction-policy", "stop-condition"]
}

function uniqueProductTurnKeys(values: ProductTurnReplayAtomKey[]): ProductTurnReplayAtomKey[] {
  return productTurnReplayAtomKeys.filter((key) => values.includes(key))
}

function uniqueOpenCodeTurnBranches(values: OpenCodeTurnPipelineBoundaryBranchID[]): OpenCodeTurnPipelineBoundaryBranchID[] {
  return OPENCODE_TURN_PIPELINE_BOUNDARY_BRANCH_ORDER.filter((branchID) => values.includes(branchID))
}

function opencodeTurnIdentityReadbackAtomKeys(dimensionID: OpenCodeTurnIdentityReadbackDimensionID): ProductTurnReplayAtomKey[] {
  if (dimensionID === "message-v2-object") return ["input-normalizer", "context-builder", "stream-reducer"]
  if (dimensionID === "context-readback") return ["context-builder", "prompt-assembler", "compaction-policy"]
  if (dimensionID === "provider-request-object") return ["prompt-assembler", "provider-request-builder", "provider-stream-runner", "retry-policy"]
  if (dimensionID === "tool-side-effect") return ["tool-call-planner", "tool-executor", "result-recorder"]
  if (dimensionID === "session-write-readback") return ["context-builder", "result-recorder", "compaction-policy"]
  return ["result-recorder", "continuation-policy", "stop-condition"]
}

function uniqueOpenCodeTurnIdentityReadbackDimensions(values: OpenCodeTurnIdentityReadbackDimensionID[]): OpenCodeTurnIdentityReadbackDimensionID[] {
  return OPENCODE_TURN_IDENTITY_READBACK_DIMENSION_ORDER.filter((dimensionID) => values.includes(dimensionID))
}

function opencodeTurnLoopControlAtomKeys(dimensionID: OpenCodeTurnLoopControlDimensionID): ProductTurnReplayAtomKey[] {
  if (dimensionID === "run-input-seed") return ["input-normalizer", "context-builder"]
  if (dimensionID === "provider-finish-routing") return ["provider-request-builder", "provider-stream-runner", "stream-reducer", "retry-policy"]
  if (dimensionID === "tool-result-loopback") return ["tool-call-planner", "tool-executor", "result-recorder", "continuation-policy"]
  if (dimensionID === "context-compaction-gate") return ["context-builder", "prompt-assembler", "compaction-policy"]
  if (dimensionID === "continuation-stop-gate") return ["result-recorder", "continuation-policy", "stop-condition"]
  return ["context-builder", "result-recorder", "compaction-policy", "stop-condition"]
}

function uniqueOpenCodeTurnLoopControlDimensions(values: OpenCodeTurnLoopControlDimensionID[]): OpenCodeTurnLoopControlDimensionID[] {
  return OPENCODE_TURN_LOOP_CONTROL_DIMENSION_ORDER.filter((dimensionID) => values.includes(dimensionID))
}

function opencodeTurnSideEffectTimelineAtomKeys(dimensionID: OpenCodeTurnSideEffectTimelineDimensionID): ProductTurnReplayAtomKey[] {
  if (dimensionID === "message-context-side-effect") return ["input-normalizer", "context-builder", "prompt-assembler"]
  if (dimensionID === "provider-stream-side-effect") return ["provider-request-builder", "provider-stream-runner", "stream-reducer", "retry-policy"]
  if (dimensionID === "tool-execution-side-effect") return ["tool-call-planner", "tool-executor", "result-recorder"]
  if (dimensionID === "session-writeback-side-effect") return ["context-builder", "result-recorder"]
  if (dimensionID === "compaction-readback-side-effect") return ["context-builder", "continuation-policy", "compaction-policy"]
  return ["result-recorder", "continuation-policy", "stop-condition"]
}

function uniqueOpenCodeTurnSideEffectTimelineDimensions(values: OpenCodeTurnSideEffectTimelineDimensionID[]): OpenCodeTurnSideEffectTimelineDimensionID[] {
  return OPENCODE_TURN_SIDE_EFFECT_TIMELINE_DIMENSION_ORDER.filter((dimensionID) => values.includes(dimensionID))
}

function opencodeTurnProviderStepAtomKeys(dimensionID: OpenCodeTurnProviderStepDimensionID): ProductTurnReplayAtomKey[] {
  if (dimensionID === "provider-request-shape") return ["provider-request-builder"]
  if (dimensionID === "provider-stream-frame") return ["provider-stream-runner"]
  if (dimensionID === "stream-reducer-delta") return ["stream-reducer"]
  if (dimensionID === "retry-continuation-decision") return ["retry-policy", "continuation-policy"]
  return ["provider-stream-runner", "stop-condition"]
}

function uniqueOpenCodeTurnProviderStepDimensions(values: OpenCodeTurnProviderStepDimensionID[]): OpenCodeTurnProviderStepDimensionID[] {
  return OPENCODE_TURN_PROVIDER_STEP_DIMENSION_ORDER.filter((dimensionID) => values.includes(dimensionID))
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort()
}

export function createOpenCodeTurnAtoms(): ProductTurnAtoms {
  return createProductTurnAtoms("opencode")
}

export function createPiMonoTurnAtoms(): ProductTurnAtoms {
  return createProductTurnAtoms("pi-mono")
}

export function createNanobotTurnAtoms(): ProductTurnAtoms {
  return createProductTurnAtoms("nanobot")
}

export function createHermesAgentTurnAtoms(): ProductTurnAtoms {
  return createProductTurnAtoms("hermes-agent")
}

const productTurnReplayAtomKeys: ProductTurnReplayAtomKey[] = [
  "input-normalizer",
  "context-builder",
  "prompt-assembler",
  "provider-request-builder",
  "provider-stream-runner",
  "stream-reducer",
  "tool-call-planner",
  "tool-executor",
  "result-recorder",
  "retry-policy",
  "continuation-policy",
  "compaction-policy",
  "stop-condition",
]

function productTurnReplayStageID(key: ProductTurnReplayAtomKey): ProductTurnReplayStageID {
  if (key === "input-normalizer") return "input.normalize"
  if (key === "context-builder") return "context.build"
  if (key === "prompt-assembler") return "prompt.assemble"
  if (key === "provider-request-builder") return "provider.request"
  if (key === "provider-stream-runner") return "provider.stream"
  if (key === "stream-reducer") return "stream.project"
  if (key === "tool-call-planner") return "tool.plan"
  if (key === "tool-executor") return "tool.execute"
  if (key === "result-recorder") return "session.assistant-write"
  return "loop.boundary"
}

function commonTurnStrategy(key: ProductTurnReplayAtomKey): string {
  if (key === "input-normalizer") return "turn.input-normalizer.text"
  if (key === "context-builder") return "turn.context-builder.transcript"
  if (key === "prompt-assembler") return "turn.prompt-assembler.common"
  if (key === "provider-request-builder") return "turn.provider-request-builder.common"
  if (key === "provider-stream-runner") return "turn.provider-stream-runner.common"
  if (key === "stream-reducer") return "turn.stream-reducer.common"
  if (key === "tool-call-planner") return "turn.tool-call-planner.parallel-batch"
  if (key === "tool-executor") return "turn.tool-executor.common"
  if (key === "result-recorder") return "turn.result-recorder.common"
  if (key === "retry-policy") return "turn.retry-policy.fixed"
  if (key === "continuation-policy") return "turn.continuation-policy.synthetic-continue"
  if (key === "compaction-policy") return "turn.compaction-policy.token-threshold"
  return "turn.stop-condition.no-tool-calls"
}

function productTurnReplayFixtureID(product: TurnProductPersonality, key: ProductTurnReplayAtomKey): string {
  return `${product}-turn:${key}`
}

function productTurnNativeExactEvidence(
  product: TurnProductPersonality,
  key: ProductTurnReplayAtomKey,
): {
  exactDiffStatus: ProductTurnReplayExactDiffStatus
  nativeParityClaim: boolean
  nativeExactFixtureIDs: string[]
  nativeEvidenceRefs: string[]
  upstreamEvidenceRefs: string[]
} {
  if (product === "nanobot") {
    const nativeExactFixtureIDs = [nanobotTurnNativeExactFixtureID, nanobotTurnNativeExactFixtureIDForKey(key)]
    const nativeEvidenceRefs = [
      nanobotTurnNativeExactEvidenceRef,
      nanobotTurnNativeExactReplayRef,
      nanobotTurnNativeExactReplayRefForKey(key),
    ]
    return {
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeExactFixtureIDs,
      nativeEvidenceRefs,
      upstreamEvidenceRefs: [...nativeEvidenceRefs, ...nativeExactFixtureIDs],
    }
  }
  if (product === "hermes-agent") {
    const nativeExactFixtureIDs = [hermesTurnNativeExactFixtureID, hermesTurnNativeExactFixtureIDForKey(key)]
    const nativeEvidenceRefs = [
      hermesTurnNativeExactEvidenceRef,
      hermesTurnNativeExactReplayRef,
      hermesTurnNativeExactReplayRefForKey(key),
    ]
    return {
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeExactFixtureIDs,
      nativeEvidenceRefs,
      upstreamEvidenceRefs: [...nativeEvidenceRefs, ...nativeExactFixtureIDs],
    }
  }
  if (product !== "opencode") {
    return {
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      nativeExactFixtureIDs: [],
      nativeEvidenceRefs: [],
      upstreamEvidenceRefs: [],
    }
  }
  const fixtureStem = opencodeTurnNativeExactFixtureStem(key)
  return {
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    nativeExactFixtureIDs: [`opencode-turn-${fixtureStem}:native-exact-fixture`],
    nativeEvidenceRefs: [
      `conformance:opencode-turn-${fixtureStem}-native-exact-fixture`,
      `turn-${fixtureStem}-native-exact:opencode`,
    ],
    upstreamEvidenceRefs: [
      `conformance:opencode-turn-${fixtureStem}-native-exact-fixture`,
      `turn-${fixtureStem}-native-exact:opencode`,
      `opencode-turn-${fixtureStem}:native-exact-fixture`,
    ],
  }
}

function opencodeTurnNativeExactFixtureStem(key: ProductTurnReplayAtomKey): string {
  return key
}

function productTurnUpstreamRef(product: TurnProductPersonality): string {
  if (product === "opencode") return "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  if (product === "pi-mono") return "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  if (product === "nanobot") return "package:nanobot-ai@0.2.0"
  return "package:hermes-agent==0.15.1"
}

function productTurnUpstreamEvidenceRefs(product: TurnProductPersonality, key: ProductTurnReplayAtomKey): string[] {
  const base = productTurnUpstreamRef(product)
  const keyRefs = {
    "input-normalizer": product === "pi-mono" ? ["cli-args-and-jsonl-v3-input", "custom-system-prompt-input"] :
      product === "nanobot" ? ["workspace-channel-input", "chat-sender-runtime-context"] :
      product === "hermes-agent" ? ["api-acp-gateway-input", "platform-session-input"] :
      ["cli-json-events-input", "session-user-message-input"],
    "context-builder": product === "pi-mono" ? ["jsonl-v3-session-records", "active-leaf-context"] :
      product === "nanobot" ? ["workspace-session-jsonl", "memory-history-context"] :
      product === "hermes-agent" ? ["stable-context-volatile-registry", "sqlite-fts-storage"] :
      ["sqlite-session-events", "message-v2-context"],
    "prompt-assembler": product === "pi-mono" ? ["custom-system-prompt", "extension-context"] :
      product === "nanobot" ? ["bootstrap-memory-skills-prompt"] :
      product === "hermes-agent" ? ["prompt-builder-block-registry"] :
      ["system-prompt-mode-builder", "plugin-pre-llm-hooks"],
    "provider-request-builder": product === "pi-mono" ? ["anthropic-request-shape", "extension-tool-schema-context"] :
      product === "nanobot" ? ["provider-config-env", "skills-tool-registry"] :
      product === "hermes-agent" ? ["chat-completions-request-shape", "platform-tool-registry"] :
      ["provider-plugin-request-options", "model-registry-selection"],
    "provider-stream-runner": product === "pi-mono" ? ["anthropic-stream-events", "jsonl-v3-provider-stream"] :
      product === "nanobot" ? ["agent-hook-provider-stream", "provider-retry-loop"] :
      product === "hermes-agent" ? ["chat-completions-stream", "gateway-visible-trace"] :
      ["provider-stream-events", "step-finish-semantics"],
    "stream-reducer": product === "pi-mono" ? ["anthropic-events", "jsonl-v3-assistant-parts"] :
      product === "nanobot" ? ["provider-protocol", "agent-hook-iteration"] :
      product === "hermes-agent" ? ["chat-completions-tool-calls", "message-delta-visible-trace"] :
      ["step-events", "assistant-part-protocol"],
    "tool-call-planner": product === "pi-mono" ? ["typebox-tool-planning", "extension-tool-order"] :
      product === "nanobot" ? ["skill-tool-iteration", "workspace-tool-dispatch"] :
      product === "hermes-agent" ? ["computer-use-tool-gating", "sequential-tool-dispatch"] :
      ["permission-tool-scheduler", "parallel-tool-batch"],
    "tool-executor": product === "pi-mono" ? ["extension-tool-execution", "jsonl-tool-result-part"] :
      product === "nanobot" ? ["workspace-file-tool", "skills-bin-env-tool"] :
      product === "hermes-agent" ? ["acp-api-tool-execution", "memory-tool-execution"] :
      ["permission-plugin-bridge", "tool-result-render-bridge"],
    "result-recorder": product === "pi-mono" ? ["jsonl-v3-assistant-record", "tool-result-message-parts"] :
      product === "nanobot" ? ["workspace-session-jsonl", "memory-history-session-write"] :
      product === "hermes-agent" ? ["api-session-record", "sqlite-fts-session-write"] :
      ["sqlite-session-write", "message-v2-assistant-parts"],
    "retry-policy": product === "pi-mono" ? ["anthropic-error-retry", "jsonl-v3-retry-trace"] :
      product === "nanobot" ? ["provider-retry-loop", "agent-iteration-error"] :
      product === "hermes-agent" ? ["persistent-provider-retry", "gateway-error-trace"] :
      ["provider-error-retry", "request-boundary-retry"],
    "continuation-policy": product === "pi-mono" ? ["synthetic-continue", "max-synthetic-continues"] :
      product === "nanobot" ? ["iteration-stop-without-synthetic-continue"] :
      product === "hermes-agent" ? ["persistent-assistant-continuation", "interrupt-stop"] :
      ["step-finish-no-synthetic-continue"],
    "compaction-policy": product === "pi-mono" ? ["active-leaf-context-window", "context-file-order"] :
      product === "nanobot" ? ["memory-history-compaction", "session-keep-messages"] :
      product === "hermes-agent" ? ["volatile-memory-context-window", "context-scanner-threshold"] :
      ["message-v2-compaction-event", "token-threshold-compaction"],
    "stop-condition": product === "pi-mono" ? ["end-turn-and-tool-use-stop", "max-steps"] :
      product === "nanobot" ? ["max-iterations", "tool-call-stop"] :
      product === "hermes-agent" ? ["max-iterations-interrupt-stop", "tool-calls-stop"] :
      ["max-steps", "tool-use-stop"],
  } satisfies Record<ProductTurnReplayAtomKey, string[]>
  return [base, ...keyRefs[key]]
}

function productTurnObservedFields(profile: ProductTurnProfile, key: ProductTurnReplayAtomKey): string[] {
  if (key === "input-normalizer") return ["runtimeContext", "contextVariant", "assistantPartProtocol"]
  if (key === "context-builder") return ["assistantPartProtocol", "contextVariant", "maxInputTokens", "compactionKeepMessages"].filter((field) => profile[field as keyof ProductTurnProfile] !== undefined)
  if (key === "prompt-assembler") return ["requestShape", "runtimeContext", "maxToolResultTextChars"]
  if (key === "provider-request-builder") return ["requestShape", "assistantPartProtocol", "toolPlanning", "maxToolResultTextChars"]
  if (key === "provider-stream-runner") return ["streamProtocol", "requestShape", "retryMode", "stopReasons"]
  if (key === "stream-reducer") return ["streamProtocol", "assistantPartProtocol", "stopReasons"]
  if (key === "tool-call-planner") return ["toolPlanning", "assistantPartProtocol", "maxSteps"]
  if (key === "tool-executor") return ["toolPlanning", "runtimeContext", "maxToolResultTextChars"]
  if (key === "result-recorder") return ["assistantPartProtocol", "stopReasons", "contextVariant"]
  if (key === "retry-policy") return ["retryMode", "requestShape", "stopReasons"]
  if (key === "continuation-policy") return ["syntheticContinue", "maxSyntheticContinues", "stopReasons"]
  if (key === "compaction-policy") return ["maxInputTokens", "compactionKeepMessages", "contextVariant"].filter((field) => profile[field as keyof ProductTurnProfile] !== undefined)
  return ["maxSteps", "stopReasons", "toolPlanning"]
}

function productTurnInferredFields(profile: ProductTurnProfile, key: ProductTurnReplayAtomKey): string[] {
  if (key === "input-normalizer") return profile.runtimeContext === "nanobot" ? ["channel-metadata-normalization"] : ["shell-source-metadata-normalization"]
  if (key === "context-builder") return profile.runtimeContext === "nanobot" ? ["channel-runtime-context-order"] : ["native-context-file-read-side-effects"]
  if (key === "prompt-assembler") return ["hook-intervention-order", "prompt-token-accounting"]
  if (key === "provider-request-builder") return ["provider-option-normalization", "model-registry-resolution", "auth-header-materialization"]
  if (key === "provider-stream-runner") return ["transport-retry-timing", "raw-sse-frame-order"]
  if (key === "stream-reducer") return ["partial-tool-json-boundaries", "provider-usage-finalization"]
  if (key === "tool-call-planner") return ["native-tool-priority-heuristics", "permission-preflight-side-effects"]
  if (key === "tool-executor") return ["native-sandbox-side-effects", "tool-output-streaming-progress"]
  if (key === "result-recorder") return ["native-session-write-transaction", "raw-message-id-allocation"]
  if (key === "retry-policy") return ["native-backoff-clock", "provider-error-classification"]
  if (key === "continuation-policy") return ["native-hidden-continuation-prompt", "provider-finish-reason-normalization"]
  if (key === "compaction-policy") return ["native-token-counter-drift", "compaction-side-effect-order"]
  return ["native-loop-break-priority", "provider-stop-reason-normalization"]
}

function productTurnLossyFields(product: TurnProductPersonality, key: ProductTurnReplayAtomKey): string[] {
  const common = ["common-runner-execution", "not-full-native-loop-replay"]
  if (key === "input-normalizer") return product === "nanobot" ? [...common, "native-channel-envelope-detail"] : [...common, "native-shell-envelope-detail"]
  if (key === "context-builder") return product === "opencode" ? [...common, "sqlite-session-branch-detail"] : [...common, "native-session-store-detail"]
  if (key === "prompt-assembler") return [...common, "native-hook-side-effects"]
  if (key === "provider-request-builder") return [...common, "raw-provider-request-header-shape"]
  if (key === "provider-stream-runner") return [...common, "provider-transport-chunk-timing"]
  if (key === "stream-reducer") return [...common, "raw-provider-chunk-shape"]
  if (key === "tool-call-planner") return product === "nanobot" ? [...common, "skill-tool-iteration-state"] : [...common, "native-tool-priority-order"]
  if (key === "tool-executor") return [...common, "native-permission-and-sandbox-side-effects"]
  if (key === "result-recorder") return [...common, "native-session-storage-transaction-detail"]
  if (key === "retry-policy") return [...common, "native-retry-backoff-timing"]
  if (key === "continuation-policy") return [...common, "native-continuation-hidden-message-detail"]
  if (key === "compaction-policy") return [...common, "native-compaction-write-side-effects"]
  return [...common, "native-loop-stop-priority"]
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
