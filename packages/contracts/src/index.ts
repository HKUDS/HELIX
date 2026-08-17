import {
  buildEventEnvelopeExactDiffBlockerSnapshot,
  buildEventEnvelopePinnedReplaySnapshot,
  buildEventEnvelopeReplayGateSnapshot,
  buildIdentityFormattingExactDiffBlockerSnapshot,
  buildIdentityFormattingPinnedReplaySnapshot,
  buildIdentityFormattingRoundTripGateSnapshot,
  type EventEnvelopeReplayGateDimension,
  type IdentityFormattingRoundTripGateDimension,
} from "./port-fixtures.ts"

export * from "./ids.ts"
export * from "./message.ts"
export * from "./events.ts"
export * from "./module.ts"
export * from "./tool.ts"
export * from "./provider.ts"
export * from "./recipe.ts"
export * from "./schema.ts"
export * from "./port-fixtures.ts"

export type IdentityPublicExportSurfaceFixtureID =
  | "identity:formatting-round-trip-gate"
  | "identity:formatting-exact-diff-blocker-gate"
  | "identity:formatting-pinned-replay-gate"

export type IdentityPublicExportSurfaceBuilder =
  | "buildIdentityFormattingRoundTripGateSnapshot"
  | "buildIdentityFormattingExactDiffBlockerSnapshot"
  | "buildIdentityFormattingPinnedReplaySnapshot"

export type IdentityPublicExportSurfaceVerifier =
  | "verifyIdentityFormattingRoundTripGateSnapshot"
  | "verifyIdentityFormattingExactDiffBlockerSnapshot"
  | "verifyIdentityFormattingPinnedReplaySnapshot"

export interface IdentityPublicExportSurfaceFixtureRef {
  fixtureID: IdentityPublicExportSurfaceFixtureID
  evidenceRef: string
  builder: IdentityPublicExportSurfaceBuilder
  verifier: IdentityPublicExportSurfaceVerifier
  exposure: "partial-lossy-fixture"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  knownLossiness: string[]
  fingerprint: string
}

export interface IdentityPublicExportSurfaceGuard {
  schemaVersion: 1
  evidenceRef: "conformance:identity-public-export-surface-guard"
  fixtureID: "identity:public-export-surface-guard"
  publicSurfacePolicy: "partial-lossy-only"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  exportedBuilders: IdentityPublicExportSurfaceBuilder[]
  exportedVerifiers: IdentityPublicExportSurfaceVerifier[]
  comparisonDimensions: IdentityFormattingRoundTripGateDimension[]
  fixtureRefs: IdentityPublicExportSurfaceFixtureRef[]
  nativeBlockers: string[]
  summary: string
}

export interface IdentityPublicExportSurfaceGuardIssue {
  id: string
  fixtureID?: IdentityPublicExportSurfaceFixtureID
  exportedName?: IdentityPublicExportSurfaceBuilder | IdentityPublicExportSurfaceVerifier
  message: string
}

export interface IdentityPublicExportSurfaceGuardVerification {
  ok: boolean
  issues: IdentityPublicExportSurfaceGuardIssue[]
}

const identityPublicExportSurfaceBuilders: IdentityPublicExportSurfaceBuilder[] = [
  "buildIdentityFormattingRoundTripGateSnapshot",
  "buildIdentityFormattingExactDiffBlockerSnapshot",
  "buildIdentityFormattingPinnedReplaySnapshot",
]

const identityPublicExportSurfaceVerifiers: IdentityPublicExportSurfaceVerifier[] = [
  "verifyIdentityFormattingRoundTripGateSnapshot",
  "verifyIdentityFormattingExactDiffBlockerSnapshot",
  "verifyIdentityFormattingPinnedReplaySnapshot",
]

const identityPublicExportSurfaceDimensions: IdentityFormattingRoundTripGateDimension[] = [
  "id-format",
  "timestamp-format",
  "workspace-path",
  "title-format",
  "serialization",
]

export function buildIdentityPublicExportSurfaceGuard(): IdentityPublicExportSurfaceGuard {
  const roundTripGate = buildIdentityFormattingRoundTripGateSnapshot()
  const exactDiffBlocker = buildIdentityFormattingExactDiffBlockerSnapshot()
  const pinnedReplay = buildIdentityFormattingPinnedReplaySnapshot()
  const fixtureRefs: IdentityPublicExportSurfaceFixtureRef[] = [
    {
      fixtureID: roundTripGate.fixtureID,
      evidenceRef: roundTripGate.evidenceRef,
      builder: "buildIdentityFormattingRoundTripGateSnapshot",
      verifier: "verifyIdentityFormattingRoundTripGateSnapshot",
      exposure: "partial-lossy-fixture",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      knownLossiness: identityPublicExportSurfaceLossiness(roundTripGate.cases.map((item) => item.knownLossiness)),
      fingerprint: roundTripGate.fingerprint,
    },
    {
      fixtureID: exactDiffBlocker.fixtureID,
      evidenceRef: exactDiffBlocker.evidenceRef,
      builder: "buildIdentityFormattingExactDiffBlockerSnapshot",
      verifier: "verifyIdentityFormattingExactDiffBlockerSnapshot",
      exposure: "partial-lossy-fixture",
      exactDiffStatus: exactDiffBlocker.exactDiffStatus,
      nativeParityClaim: false,
      knownLossiness: identityPublicExportSurfaceLossiness(exactDiffBlocker.cases.map((item) => item.knownLossiness)),
      fingerprint: exactDiffBlocker.fingerprint,
    },
    {
      fixtureID: pinnedReplay.fixtureID,
      evidenceRef: pinnedReplay.evidenceRef,
      builder: "buildIdentityFormattingPinnedReplaySnapshot",
      verifier: "verifyIdentityFormattingPinnedReplaySnapshot",
      exposure: "partial-lossy-fixture",
      exactDiffStatus: pinnedReplay.exactDiffStatus,
      nativeParityClaim: false,
      knownLossiness: identityPublicExportSurfaceLossiness(pinnedReplay.cases.map((item) => item.knownLossiness)),
      fingerprint: pinnedReplay.fingerprint,
    },
  ]
  return {
    schemaVersion: 1,
    evidenceRef: "conformance:identity-public-export-surface-guard",
    fixtureID: "identity:public-export-surface-guard",
    publicSurfacePolicy: "partial-lossy-only",
    exactDiffStatus: "exact-diff-partial",
    nativeParityClaim: false,
    exportedBuilders: identityPublicExportSurfaceBuilders,
    exportedVerifiers: identityPublicExportSurfaceVerifiers,
    comparisonDimensions: identityPublicExportSurfaceDimensions,
    fixtureRefs,
    nativeBlockers: [
      "product-native-id-generator:not-proven",
      "exact-clock-runtime:not-proven",
      "workspace-filesystem-side-effects:not-proven",
      "title-serialization-readback:not-proven",
      "persisted-product-readback:not-proven",
    ],
    summary: "The contracts package root exposes identity fixtures only as partial/lossy exact-diff evidence until product-native ID, clock, workspace, title, and persisted readback fixtures are proven.",
  }
}

export function verifyIdentityPublicExportSurfaceGuard(
  guard: IdentityPublicExportSurfaceGuard,
): IdentityPublicExportSurfaceGuardVerification {
  const issues: IdentityPublicExportSurfaceGuardIssue[] = []
  if (guard.publicSurfacePolicy !== "partial-lossy-only" || guard.exactDiffStatus !== "exact-diff-partial" || guard.nativeParityClaim !== false) {
    issues.push({
      id: "identity-public-export.native-claim",
      message: "Identity public exports must stay partial/lossy and cannot claim native parity.",
    })
  }
  for (const builder of identityPublicExportSurfaceBuilders) {
    if (!guard.exportedBuilders.includes(builder)) {
      issues.push({
        id: "identity-public-export.builder",
        exportedName: builder,
        message: `${builder} is no longer listed in the identity public export surface guard.`,
      })
    }
  }
  for (const verifier of identityPublicExportSurfaceVerifiers) {
    if (!guard.exportedVerifiers.includes(verifier)) {
      issues.push({
        id: "identity-public-export.verifier",
        exportedName: verifier,
        message: `${verifier} is no longer listed in the identity public export surface guard.`,
      })
    }
  }
  for (const dimension of identityPublicExportSurfaceDimensions) {
    if (!guard.comparisonDimensions.includes(dimension)) {
      issues.push({
        id: "identity-public-export.dimension",
        message: `Identity public export surface guard no longer records ${dimension}.`,
      })
    }
  }
  const expectedFixtureIDs: IdentityPublicExportSurfaceFixtureID[] = [
    "identity:formatting-round-trip-gate",
    "identity:formatting-exact-diff-blocker-gate",
    "identity:formatting-pinned-replay-gate",
  ]
  for (const fixtureID of expectedFixtureIDs) {
    const fixtureRef = guard.fixtureRefs.find((item) => item.fixtureID === fixtureID)
    if (!fixtureRef) {
      issues.push({
        id: "identity-public-export.fixture",
        fixtureID,
        message: `${fixtureID} is no longer represented in the identity public export surface guard.`,
      })
      continue
    }
    if (fixtureRef.exposure !== "partial-lossy-fixture" || fixtureRef.exactDiffStatus !== "exact-diff-partial" || fixtureRef.nativeParityClaim !== false) {
      issues.push({
        id: "identity-public-export.fixture-native-claim",
        fixtureID,
        message: `${fixtureID} must remain exposed as partial/lossy exact-diff evidence.`,
      })
    }
    if (!identityPublicExportSurfaceHasLossiness(fixtureRef.knownLossiness)) {
      issues.push({
        id: "identity-public-export.lossiness",
        fixtureID,
        message: `${fixtureID} no longer carries partial/lossy identity evidence markers.`,
      })
    }
    if (!/^[a-f0-9]{16}$/.test(fixtureRef.fingerprint)) {
      issues.push({
        id: "identity-public-export.fingerprint",
        fixtureID,
        message: `${fixtureID} no longer carries a stable fixture fingerprint.`,
      })
    }
  }
  if (!guard.nativeBlockers.some((blocker) => /product-native|exact-clock|readback|filesystem/.test(blocker))) {
    issues.push({
      id: "identity-public-export.native-blockers",
      message: "Identity public export surface guard no longer records product-native blockers.",
    })
  }
  if (!/partial|lossy/.test(guard.summary) || /native parity complete|product-native complete|native complete/i.test(guard.summary)) {
    issues.push({
      id: "identity-public-export.summary",
      message: "Identity public export surface summary must describe partial/lossy evidence without complete-native wording.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function identityPublicExportSurfaceLossiness(groups: string[][]): string[] {
  return Array.from(new Set([
    ...groups.flat(),
    "identity-public-export-surface-partial-fixture",
    "identity-public-export-surface-native-parity-not-proven",
  ]))
}

function identityPublicExportSurfaceHasLossiness(values: string[]): boolean {
  return values.some((value) => /partial|lossy|lossiness|not-proven|not-exact/.test(value))
}

export type EventPublicExportSurfaceFixtureID =
  | "event:envelope-replay-gate"
  | "event:envelope-exact-diff-blocker-gate"
  | "event:envelope-pinned-replay-gate"

export type EventPublicExportSurfaceBuilder =
  | "buildEventEnvelopeReplayGateSnapshot"
  | "buildEventEnvelopeExactDiffBlockerSnapshot"
  | "buildEventEnvelopePinnedReplaySnapshot"

export type EventPublicExportSurfaceVerifier =
  | "verifyEventEnvelopeReplayGateSnapshot"
  | "verifyEventEnvelopeExactDiffBlockerSnapshot"
  | "verifyEventEnvelopePinnedReplaySnapshot"

export interface EventPublicExportSurfaceFixtureRef {
  fixtureID: EventPublicExportSurfaceFixtureID
  evidenceRef: string
  builder: EventPublicExportSurfaceBuilder
  verifier: EventPublicExportSurfaceVerifier
  exposure: "partial-lossy-fixture"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  knownLossiness: string[]
  fingerprint: string
}

export interface EventPublicExportSurfaceGuard {
  schemaVersion: 1
  evidenceRef: "conformance:event-public-export-surface-guard"
  fixtureID: "event:public-export-surface-guard"
  publicSurfacePolicy: "partial-lossy-only"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  exportedBuilders: EventPublicExportSurfaceBuilder[]
  exportedVerifiers: EventPublicExportSurfaceVerifier[]
  comparisonDimensions: EventEnvelopeReplayGateDimension[]
  fixtureRefs: EventPublicExportSurfaceFixtureRef[]
  nativeBlockers: string[]
  summary: string
}

export interface EventPublicExportSurfaceGuardIssue {
  id: string
  fixtureID?: EventPublicExportSurfaceFixtureID
  exportedName?: EventPublicExportSurfaceBuilder | EventPublicExportSurfaceVerifier
  message: string
}

export interface EventPublicExportSurfaceGuardVerification {
  ok: boolean
  issues: EventPublicExportSurfaceGuardIssue[]
}

const eventPublicExportSurfaceBuilders: EventPublicExportSurfaceBuilder[] = [
  "buildEventEnvelopeReplayGateSnapshot",
  "buildEventEnvelopeExactDiffBlockerSnapshot",
  "buildEventEnvelopePinnedReplaySnapshot",
]

const eventPublicExportSurfaceVerifiers: EventPublicExportSurfaceVerifier[] = [
  "verifyEventEnvelopeReplayGateSnapshot",
  "verifyEventEnvelopeExactDiffBlockerSnapshot",
  "verifyEventEnvelopePinnedReplaySnapshot",
]

const eventPublicExportSurfaceDimensions: EventEnvelopeReplayGateDimension[] = [
  "field-shape",
  "event-order",
  "dropped-field-negative",
  "persistence",
  "replay",
]

export function buildEventPublicExportSurfaceGuard(): EventPublicExportSurfaceGuard {
  const replayGate = buildEventEnvelopeReplayGateSnapshot()
  const exactDiffBlocker = buildEventEnvelopeExactDiffBlockerSnapshot()
  const pinnedReplay = buildEventEnvelopePinnedReplaySnapshot()
  const fixtureRefs: EventPublicExportSurfaceFixtureRef[] = [
    {
      fixtureID: replayGate.fixtureID,
      evidenceRef: replayGate.evidenceRef,
      builder: "buildEventEnvelopeReplayGateSnapshot",
      verifier: "verifyEventEnvelopeReplayGateSnapshot",
      exposure: "partial-lossy-fixture",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      knownLossiness: eventPublicExportSurfaceLossiness(replayGate.cases.map((item) => item.knownLossiness)),
      fingerprint: replayGate.fingerprint,
    },
    {
      fixtureID: exactDiffBlocker.fixtureID,
      evidenceRef: exactDiffBlocker.evidenceRef,
      builder: "buildEventEnvelopeExactDiffBlockerSnapshot",
      verifier: "verifyEventEnvelopeExactDiffBlockerSnapshot",
      exposure: "partial-lossy-fixture",
      exactDiffStatus: exactDiffBlocker.exactDiffStatus,
      nativeParityClaim: false,
      knownLossiness: eventPublicExportSurfaceLossiness(exactDiffBlocker.cases.map((item) => item.knownLossiness)),
      fingerprint: exactDiffBlocker.fingerprint,
    },
    {
      fixtureID: pinnedReplay.fixtureID,
      evidenceRef: pinnedReplay.evidenceRef,
      builder: "buildEventEnvelopePinnedReplaySnapshot",
      verifier: "verifyEventEnvelopePinnedReplaySnapshot",
      exposure: "partial-lossy-fixture",
      exactDiffStatus: pinnedReplay.exactDiffStatus,
      nativeParityClaim: false,
      knownLossiness: eventPublicExportSurfaceLossiness(pinnedReplay.cases.map((item) => item.knownLossiness)),
      fingerprint: pinnedReplay.fingerprint,
    },
  ]
  return {
    schemaVersion: 1,
    evidenceRef: "conformance:event-public-export-surface-guard",
    fixtureID: "event:public-export-surface-guard",
    publicSurfacePolicy: "partial-lossy-only",
    exactDiffStatus: "exact-diff-partial",
    nativeParityClaim: false,
    exportedBuilders: eventPublicExportSurfaceBuilders,
    exportedVerifiers: eventPublicExportSurfaceVerifiers,
    comparisonDimensions: eventPublicExportSurfaceDimensions,
    fixtureRefs,
    nativeBlockers: [
      "native-event-ordering:not-proven",
      "product-native-event-persistence-readback:not-proven",
      "dropped-field-negative:not-exhaustive",
      "live-product-event-stream-replay:not-proven",
      "source-replay-native-capture:not-proven",
    ],
    summary: "The contracts package root exposes event envelope fixtures only as partial/lossy exact-diff evidence until live product-native event ordering, persistence/readback, dropped-field negatives, and replay capture are proven.",
  }
}

export function verifyEventPublicExportSurfaceGuard(
  guard: EventPublicExportSurfaceGuard,
): EventPublicExportSurfaceGuardVerification {
  const issues: EventPublicExportSurfaceGuardIssue[] = []
  if (guard.publicSurfacePolicy !== "partial-lossy-only" || guard.exactDiffStatus !== "exact-diff-partial" || guard.nativeParityClaim !== false) {
    issues.push({
      id: "event-public-export.native-claim",
      message: "Event public exports must stay partial/lossy and cannot claim native parity.",
    })
  }
  for (const builder of eventPublicExportSurfaceBuilders) {
    if (!guard.exportedBuilders.includes(builder)) {
      issues.push({
        id: "event-public-export.builder",
        exportedName: builder,
        message: `${builder} is no longer listed in the event public export surface guard.`,
      })
    }
  }
  for (const verifier of eventPublicExportSurfaceVerifiers) {
    if (!guard.exportedVerifiers.includes(verifier)) {
      issues.push({
        id: "event-public-export.verifier",
        exportedName: verifier,
        message: `${verifier} is no longer listed in the event public export surface guard.`,
      })
    }
  }
  for (const dimension of eventPublicExportSurfaceDimensions) {
    if (!guard.comparisonDimensions.includes(dimension)) {
      issues.push({
        id: "event-public-export.dimension",
        message: `Event public export surface guard no longer records ${dimension}.`,
      })
    }
  }
  const expectedFixtureIDs: EventPublicExportSurfaceFixtureID[] = [
    "event:envelope-replay-gate",
    "event:envelope-exact-diff-blocker-gate",
    "event:envelope-pinned-replay-gate",
  ]
  for (const fixtureID of expectedFixtureIDs) {
    const fixtureRef = guard.fixtureRefs.find((item) => item.fixtureID === fixtureID)
    if (!fixtureRef) {
      issues.push({
        id: "event-public-export.fixture",
        fixtureID,
        message: `${fixtureID} is no longer represented in the event public export surface guard.`,
      })
      continue
    }
    if (fixtureRef.exposure !== "partial-lossy-fixture" || fixtureRef.exactDiffStatus !== "exact-diff-partial" || fixtureRef.nativeParityClaim !== false) {
      issues.push({
        id: "event-public-export.fixture-native-claim",
        fixtureID,
        message: `${fixtureID} must remain exposed as partial/lossy exact-diff evidence.`,
      })
    }
    if (!eventPublicExportSurfaceHasLossiness(fixtureRef.knownLossiness)) {
      issues.push({
        id: "event-public-export.lossiness",
        fixtureID,
        message: `${fixtureID} no longer carries partial/lossy event evidence markers.`,
      })
    }
    if (!/^[a-f0-9]{16}$/.test(fixtureRef.fingerprint)) {
      issues.push({
        id: "event-public-export.fingerprint",
        fixtureID,
        message: `${fixtureID} no longer carries a stable fixture fingerprint.`,
      })
    }
  }
  if (!guard.nativeBlockers.some((blocker) => /event-ordering|persistence|readback|dropped-field|native-capture/.test(blocker))) {
    issues.push({
      id: "event-public-export.native-blockers",
      message: "Event public export surface guard no longer records product-native blockers.",
    })
  }
  if (!/partial|lossy/.test(guard.summary) || /native parity complete|product-native complete|native complete/i.test(guard.summary)) {
    issues.push({
      id: "event-public-export.summary",
      message: "Event public export surface summary must describe partial/lossy evidence without complete-native wording.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function eventPublicExportSurfaceLossiness(groups: string[][]): string[] {
  return Array.from(new Set([
    ...groups.flat(),
    "event-public-export-surface-partial-fixture",
    "event-public-export-surface-native-parity-not-proven",
  ]))
}

function eventPublicExportSurfaceHasLossiness(values: string[]): boolean {
  return values.some((value) => /partial|lossy|lossiness|not-proven|not-exact|not-exhaustive/.test(value))
}
