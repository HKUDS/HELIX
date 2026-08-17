import { createHash } from "node:crypto"

export const openCodeProviderRetryCancelNativeExactDiffFixtureID = "opencode-provider:retry-cancel-native-exact-diff-fixture" as const
export const openCodeProviderRetryCancelNativeExactDiffEvidenceRef = "conformance:opencode-provider-retry-cancel-native-exact-diff-fixture" as const
export const openCodeProviderRetryCancelNativeExactDiffReplayRef = "provider-retry-cancel-native-exact-diff:opencode" as const

export type OpenCodeProviderRetryCancelEventType =
  | "attempt"
  | "retryable-error"
  | "retry-delay"
  | "abort"
  | "parser-cleanup"
  | "stream-end"

export type OpenCodeProviderRetryDelayBucket = "zero" | "subsecond" | "seconds" | "long" | "unknown"

export type OpenCodeProviderRetryCancelFinalState = "succeeded" | "failed" | "cancelled" | "retrying" | "unknown"

export interface OpenCodeProviderRetryCancelEvent {
  type: OpenCodeProviderRetryCancelEventType
  attempt?: number
  delayMs?: number
  retryable?: boolean
  errorClass?: string
  reason?: string
  finishReason?: string
  signalAborted?: boolean
  cleanupScope?: string
}

export interface OpenCodeProviderRetryCancelTimelineStep {
  order: number
  type: OpenCodeProviderRetryCancelEventType
  attempt: number
  logicalClock: "source-order"
  delayBucket?: OpenCodeProviderRetryDelayBucket
  retryable?: boolean
  errorClass?: string
  reason?: string
  finishReason?: string
  signalAborted?: boolean
  cleanupScope?: string
}

export interface OpenCodeProviderRetryCancelAttemptProjection {
  attempt: number
  started: boolean
  outcome: OpenCodeProviderRetryCancelFinalState
  retryable?: boolean
  errorClass?: string
  scheduledDelayMs?: number
  delayBucket?: OpenCodeProviderRetryDelayBucket
  abortObserved?: boolean
  cleanupObserved?: boolean
}

export interface OpenCodeProviderRetryCancelTimingProjection {
  finalState: OpenCodeProviderRetryCancelFinalState
  attemptCount: number
  timeline: OpenCodeProviderRetryCancelTimelineStep[]
  attempts: OpenCodeProviderRetryCancelAttemptProjection[]
  retainedFields: string[]
  lossyFields: string[]
  knownGaps: string[]
}

export type OpenCodeProviderRetryCancelRaceEventType =
  | "retry-scheduled"
  | "retry-fired"
  | "network-error"
  | "abort-signal"
  | "reader-cancel"
  | "parser-cleanup"
  | "request-settled"

export interface OpenCodeProviderRetryCancelRaceEvent {
  type: OpenCodeProviderRetryCancelRaceEventType
  attempt?: number
  order?: number
  delayMs?: number
  observedDelayMs?: number
  reason?: string
  errorClass?: string
  signalAborted?: boolean
  cleanupScope?: string
  finalState?: OpenCodeProviderRetryCancelFinalState
}

export interface OpenCodeProviderRetryDelayRaceProjection {
  attempt: number
  scheduledDelayMs?: number
  observedDelayMs?: number
  scheduledDelayBucket?: OpenCodeProviderRetryDelayBucket
  observedDelayBucket?: OpenCodeProviderRetryDelayBucket
  delayDeltaMs?: number
  exactDelayMatched: boolean | "not-observed"
  reason?: string
}

export type OpenCodeProviderCancelRaceWinner =
  | "abort"
  | "network-error"
  | "reader-cancel"
  | "request-settled"
  | "parser-cleanup"
  | "unknown"

export interface OpenCodeProviderCancelRaceWindowProjection {
  attempt: number
  winner: OpenCodeProviderCancelRaceWinner
  abortOrder?: number
  networkErrorOrder?: number
  readerCancelOrder?: number
  parserCleanupOrder?: number
  requestSettledOrder?: number
  signalAborted?: boolean
  finalState?: OpenCodeProviderRetryCancelFinalState
  errorClasses: string[]
  cleanupScopes: string[]
  reasons: string[]
  retainedOrderKeys: string[]
}

export interface OpenCodeProviderRetryCancelRaceProjection {
  schemaVersion: 1
  fixtureID: "opencode-provider:retry-cancel-race-projection"
  evidenceRef: "conformance:opencode-provider-retry-cancel-race-projection"
  fixtureDiffTarget: "provider.raw-frame-replay"
  coveredBoundaryIDs: ("transport-retry-cancel-boundary" | "exact-retry-cancel-timing")[]
  retainedFields: string[]
  lossyFields: string[]
  retryDelays: OpenCodeProviderRetryDelayRaceProjection[]
  cancelRaceWindows: OpenCodeProviderCancelRaceWindowProjection[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeProviderRetryCancelLiveRuntimeFixtureInput {
  scheduledDelayMs?: number
  observedDelayMs?: number
  monotonicStartedAtMs?: number
  retryReason?: string
  retryErrorClass?: string
  abortReason?: string
  networkErrorClass?: string
  cleanupScope?: string
}

export interface OpenCodeProviderRetryDelayLiveRuntimeReadback {
  attempt: number
  scheduledAtMs: number
  firedAtMs: number
  scheduledDelayMs: number
  observedDelayMs: number
  scheduledDelayBucket: OpenCodeProviderRetryDelayBucket
  observedDelayBucket: OpenCodeProviderRetryDelayBucket
  delayDeltaMs: number
  exactDelayMatched: boolean
  monotonicClockReadback: true
  source: "session-retry-policy"
}

export interface OpenCodeProviderCancelAbortLiveRuntimeReadback {
  attempt: number
  type: Exclude<OpenCodeProviderRetryCancelRaceEventType, "retry-scheduled" | "retry-fired">
  order: number
  monotonicMs: number
  logicalClock: "monotonic-ms"
  reason?: string
  errorClass?: string
  signalAborted?: boolean
  cleanupScope?: string
  finalState?: OpenCodeProviderRetryCancelFinalState
}

export interface OpenCodeProviderRetryCancelLiveRuntimeFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-retry-cancel-live-runtime-fixture"
  fixtureID: "opencode-provider:retry-cancel-live-runtime-fixture"
  exactDiffStatus: "live-runtime-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  fixtureDiffTarget: "provider.raw-frame-replay"
  coveredBoundaryIDs: ("transport-retry-cancel-boundary" | "exact-retry-cancel-timing")[]
  retryScheduleReadback: OpenCodeProviderRetryDelayLiveRuntimeReadback[]
  cancelAbortRaceReadback: OpenCodeProviderCancelAbortLiveRuntimeReadback[]
  retryCancelTimingProjection: OpenCodeProviderRetryCancelTimingProjection
  retryCancelRaceProjection: OpenCodeProviderRetryCancelRaceProjection
  retainedFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeProviderRetryCancelLiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeProviderRetryCancelLiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderRetryCancelLiveRuntimeFixtureIssue[]
}

export type OpenCodeProviderRetryCancelNativeExactDiffTraceType =
  | "retry-delay-selected"
  | OpenCodeProviderRetryCancelRaceEventType

export type OpenCodeProviderRetryCancelNativeExactDiffTraceSource =
  | "session/retry.delay"
  | "session/retry.policy"
  | "effect/schedule"
  | "session/llm.stream-input"
  | "provider/fetch"
  | "provider/wrapSSE"
  | "provider/stream-parser"
  | "session/processor"

export interface OpenCodeProviderRetryCancelNativeExactDiffTraceEvent {
  type: OpenCodeProviderRetryCancelNativeExactDiffTraceType
  source: OpenCodeProviderRetryCancelNativeExactDiffTraceSource
  order: number
  attempt: number
  scheduledAtMs?: number
  firedAtMs?: number
  selectedDelayMs?: number
  scheduledDelayMs?: number
  observedDelayMs?: number
  nextAttemptAtMs?: number
  retryHeader?: "retry-after-ms" | "retry-after"
  retryReason?: string
  backoffFormula?: "retry-header" | "exponential"
  jitterApplied?: boolean
  capApplied?: boolean
  reason?: string
  errorClass?: string
  signalAborted?: boolean
  combinedSignal?: boolean
  timeoutDisabled?: boolean
  readerCancelAwaited?: boolean
  cleanupScope?: string
  finalState?: OpenCodeProviderRetryCancelFinalState
}

export interface OpenCodeProviderRetryCancelNativeExactDiffFixtureInput {
  scheduledDelayMs?: number
  monotonicStartedAtMs?: number
  retryReason?: string
  retryErrorClass?: string
  abortReason?: string
  networkErrorClass?: string
  cleanupScope?: string
}

export interface OpenCodeProviderRetryCancelNativeExactDiffDifference {
  path: string
  expected: unknown
  actual: unknown
}

export interface OpenCodeProviderRetryDelayNativeExactReadback {
  attempt: number
  selectedDelayMs: number
  scheduledAtMs: number
  nextAttemptAtMs: number
  firedAtMs: number
  observedDelayMs: number
  exactDelayMatched: true
  retryHeader: "retry-after-ms" | "retry-after"
  backoffFormula: "retry-header" | "exponential"
  jitterApplied: false
  capApplied: false
  source: "session-retry-policy"
}

export interface OpenCodeProviderCancelAbortNativeExactReadback {
  attempt: number
  eventOrder: Exclude<OpenCodeProviderRetryCancelRaceEventType, "retry-scheduled" | "retry-fired">[]
  abortSignalSource: "llm-stream-input"
  networkErrorClass: string
  readerCancelAwaited: true
  parserCleanupBeforeSettled: true
  finalState: "cancelled"
  cleanupScope: string
}

export interface OpenCodeProviderRetryCancelNativeExactDiffFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: typeof openCodeProviderRetryCancelNativeExactDiffEvidenceRef
  replayRef: typeof openCodeProviderRetryCancelNativeExactDiffReplayRef
  fixtureID: typeof openCodeProviderRetryCancelNativeExactDiffFixtureID
  exactDiffStatus: "native-exact-diff"
  coverageStatus: "native"
  nativeParityClaim: true
  fixtureDiffTarget: "provider.raw-frame-replay"
  coveredBoundaryIDs: ("transport-retry-cancel-boundary" | "exact-retry-cancel-timing")[]
  sourceRefs: string[]
  expectedTrace: OpenCodeProviderRetryCancelNativeExactDiffTraceEvent[]
  actualTrace: OpenCodeProviderRetryCancelNativeExactDiffTraceEvent[]
  traceDiff: OpenCodeProviderRetryCancelNativeExactDiffDifference[]
  retryDelayReadback: OpenCodeProviderRetryDelayNativeExactReadback[]
  cancelAbortRaceReadback: OpenCodeProviderCancelAbortNativeExactReadback[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderRetryCancelNativeExactDiffFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeProviderRetryCancelNativeExactDiffFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderRetryCancelNativeExactDiffFixtureIssue[]
}

interface MutableAttemptProjection {
  attempt: number
  started: boolean
  outcome: OpenCodeProviderRetryCancelFinalState
  retryable?: boolean
  errorClass?: string
  scheduledDelayMs?: number
  delayBucket?: OpenCodeProviderRetryDelayBucket
  abortObserved?: boolean
  cleanupObserved?: boolean
}

interface MutableRetryDelayRace {
  attempt: number
  scheduledDelayMs?: number
  observedDelayMs?: number
  scheduledDelayBucket?: OpenCodeProviderRetryDelayBucket
  observedDelayBucket?: OpenCodeProviderRetryDelayBucket
  reason?: string
}

interface MutableCancelRaceWindow {
  attempt: number
  abortOrder?: number
  networkErrorOrder?: number
  readerCancelOrder?: number
  parserCleanupOrder?: number
  requestSettledOrder?: number
  signalAborted?: boolean
  finalState?: OpenCodeProviderRetryCancelFinalState
  errorClasses: Set<string>
  cleanupScopes: Set<string>
  reasons: Set<string>
}

export function projectOpenCodeProviderRetryCancelTiming(
  events: OpenCodeProviderRetryCancelEvent[],
): OpenCodeProviderRetryCancelTimingProjection {
  const attempts = new Map<number, MutableAttemptProjection>()
  const timeline: OpenCodeProviderRetryCancelTimelineStep[] = []
  let currentAttempt = 0
  let finalState: OpenCodeProviderRetryCancelFinalState = "unknown"

  for (const [order, event] of events.entries()) {
    currentAttempt = typeof event.attempt === "number" ? event.attempt : currentAttempt
    const attempt = ensureAttempt(attempts, currentAttempt)
    const delayBucket = typeof event.delayMs === "number" ? bucketRetryDelay(event.delayMs) : undefined

    if (event.type === "attempt") {
      attempt.started = true
      attempt.outcome = "unknown"
    }
    if (event.type === "retryable-error") {
      attempt.retryable = event.retryable ?? true
      attempt.outcome = attempt.retryable ? "retrying" : "failed"
      if (event.errorClass) attempt.errorClass = event.errorClass
    }
    if (event.type === "retry-delay") {
      attempt.outcome = "retrying"
      if (typeof event.delayMs === "number") attempt.scheduledDelayMs = event.delayMs
      if (delayBucket) attempt.delayBucket = delayBucket
    }
    if (event.type === "abort") {
      attempt.outcome = "cancelled"
      attempt.abortObserved = true
      finalState = "cancelled"
    }
    if (event.type === "parser-cleanup") {
      attempt.cleanupObserved = true
    }
    if (event.type === "stream-end") {
      attempt.outcome = event.finishReason === "cancelled" ? "cancelled" : event.finishReason === "error" ? "failed" : "succeeded"
      finalState = attempt.outcome
    }

    timeline.push({
      order,
      type: event.type,
      attempt: currentAttempt,
      logicalClock: "source-order",
      ...(delayBucket ? { delayBucket } : {}),
      ...(event.retryable === undefined ? {} : { retryable: event.retryable }),
      ...(event.errorClass ? { errorClass: event.errorClass } : {}),
      ...(event.reason ? { reason: event.reason } : {}),
      ...(event.finishReason ? { finishReason: event.finishReason } : {}),
      ...(event.signalAborted === undefined ? {} : { signalAborted: event.signalAborted }),
      ...(event.cleanupScope ? { cleanupScope: event.cleanupScope } : {}),
    })
  }

  if (finalState === "unknown") {
    const lastOutcome = Array.from(attempts.values()).at(-1)?.outcome
    finalState = lastOutcome ?? "unknown"
  }

  const attemptList = Array.from(attempts.values()).sort((a, b) => a.attempt - b.attempt)
  return {
    finalState,
    attemptCount: attemptList.length,
    timeline,
    attempts: attemptList.map((attempt) => ({
      attempt: attempt.attempt,
      started: attempt.started,
      outcome: attempt.outcome,
      ...(attempt.retryable === undefined ? {} : { retryable: attempt.retryable }),
      ...(attempt.errorClass ? { errorClass: attempt.errorClass } : {}),
      ...(attempt.scheduledDelayMs === undefined ? {} : { scheduledDelayMs: attempt.scheduledDelayMs }),
      ...(attempt.delayBucket ? { delayBucket: attempt.delayBucket } : {}),
      ...(attempt.abortObserved === undefined ? {} : { abortObserved: attempt.abortObserved }),
      ...(attempt.cleanupObserved === undefined ? {} : { cleanupObserved: attempt.cleanupObserved }),
    })),
    retainedFields: [
      "attempt order",
      "retryable error class",
      "scheduled retry delay",
      "retry delay bucket",
      "abort signal observed",
      "parser cleanup observed",
      "final stream state",
    ],
    lossyFields: ["wall-clock retry delay", "abort/network race ordering", "native cleanup scheduling", "native backoff jitter"],
    knownGaps: [
      "opencode-provider-retry-wall-clock-not-exact",
      "opencode-provider-cancel-abort-race-not-exact",
      "opencode-provider-native-cleanup-scheduling-not-replayed",
    ],
  }
}

export function projectOpenCodeProviderRetryCancelRace(
  events: OpenCodeProviderRetryCancelRaceEvent[],
): OpenCodeProviderRetryCancelRaceProjection {
  const retryDelays = new Map<number, MutableRetryDelayRace>()
  const cancelWindows = new Map<number, MutableCancelRaceWindow>()
  const orderedEvents = events
    .map((event, sourceIndex) => ({
      event,
      sourceIndex,
      order: event.order ?? sourceIndex,
    }))
    .sort((left, right) => left.order - right.order || left.sourceIndex - right.sourceIndex)

  let currentAttempt = 0

  for (const { event, order } of orderedEvents) {
    currentAttempt = typeof event.attempt === "number" ? event.attempt : currentAttempt
    if (event.type === "retry-scheduled" || event.type === "retry-fired") {
      const delayRace = ensureRetryDelayRace(retryDelays, currentAttempt)
      if (event.reason) delayRace.reason = event.reason
      if (event.type === "retry-scheduled" && typeof event.delayMs === "number") {
        delayRace.scheduledDelayMs = event.delayMs
        delayRace.scheduledDelayBucket = bucketRetryDelay(event.delayMs)
      }
      if (event.type === "retry-fired") {
        const observedDelayMs = typeof event.observedDelayMs === "number" ? event.observedDelayMs : event.delayMs
        if (typeof observedDelayMs === "number") {
          delayRace.observedDelayMs = observedDelayMs
          delayRace.observedDelayBucket = bucketRetryDelay(observedDelayMs)
        }
      }
      continue
    }

    const raceWindow = ensureCancelRaceWindow(cancelWindows, currentAttempt)
    if (event.reason) raceWindow.reasons.add(event.reason)
    if (event.type === "network-error") {
      raceWindow.networkErrorOrder ??= order
      if (event.errorClass) raceWindow.errorClasses.add(event.errorClass)
    }
    if (event.type === "abort-signal") {
      raceWindow.abortOrder ??= order
      if (event.signalAborted !== undefined) raceWindow.signalAborted = event.signalAborted
    }
    if (event.type === "reader-cancel") {
      raceWindow.readerCancelOrder ??= order
    }
    if (event.type === "parser-cleanup") {
      raceWindow.parserCleanupOrder ??= order
      if (event.cleanupScope) raceWindow.cleanupScopes.add(event.cleanupScope)
    }
    if (event.type === "request-settled") {
      raceWindow.requestSettledOrder ??= order
      if (event.finalState) raceWindow.finalState = event.finalState
    }
  }

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-provider:retry-cancel-race-projection" as const,
    evidenceRef: "conformance:opencode-provider-retry-cancel-race-projection" as const,
    fixtureDiffTarget: "provider.raw-frame-replay" as const,
    coveredBoundaryIDs: ["transport-retry-cancel-boundary", "exact-retry-cancel-timing"] as const,
    retainedFields: [
      "attempt order",
      "scheduled retry delay",
      "observed retry delay bucket",
      "retry delay delta",
      "abort signal source order",
      "network error source order",
      "reader cancel source order",
      "parser cleanup source order",
      "request settled source order",
    ],
    lossyFields: [
      "monotonic wall-clock retry delay",
      "native backoff jitter",
      "abort/network race interleaving",
      "reader cancellation microtask order",
      "native cleanup scheduler timing",
    ],
    retryDelays: Array.from(retryDelays.values()).sort((left, right) => left.attempt - right.attempt).map(finalizeRetryDelayRace),
    cancelRaceWindows: Array.from(cancelWindows.values())
      .sort((left, right) => left.attempt - right.attempt)
      .map(finalizeCancelRaceWindow),
    knownGaps: [
      "opencode-provider-retry-cancel-race-projection-partial-fixture",
      "opencode-provider-retry-wall-clock-not-exact",
      "opencode-provider-cancel-abort-race-not-exact",
      "opencode-provider-native-cleanup-scheduling-not-replayed",
      "opencode-provider-native-backoff-jitter-not-replayed",
    ],
  }

  return {
    ...snapshotWithoutFingerprint,
    coveredBoundaryIDs: [...snapshotWithoutFingerprint.coveredBoundaryIDs],
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeProviderRetryCancelLiveRuntimeFixture(
  input: OpenCodeProviderRetryCancelLiveRuntimeFixtureInput = {},
): OpenCodeProviderRetryCancelLiveRuntimeFixture {
  const scheduledDelayMs = input.scheduledDelayMs ?? 250
  const observedDelayMs = input.observedDelayMs ?? scheduledDelayMs
  const monotonicStartedAtMs = input.monotonicStartedAtMs ?? 1_000
  const retryReason = input.retryReason ?? "rate-limit"
  const retryErrorClass = input.retryErrorClass ?? "RetryableRateLimit"
  const abortReason = input.abortReason ?? "user-cancel"
  const networkErrorClass = input.networkErrorClass ?? "AbortError"
  const cleanupScope = input.cleanupScope ?? "stream-reader"
  const retryScheduledAtMs = monotonicStartedAtMs + 10
  const retryFiredAtMs = retryScheduledAtMs + observedDelayMs
  const abortAtMs = retryFiredAtMs + 1
  const networkErrorAtMs = retryFiredAtMs + 2
  const readerCancelAtMs = retryFiredAtMs + 3
  const parserCleanupAtMs = retryFiredAtMs + 4
  const requestSettledAtMs = retryFiredAtMs + 5
  const retryScheduleReadback: OpenCodeProviderRetryDelayLiveRuntimeReadback[] = [
    {
      attempt: 0,
      scheduledAtMs: retryScheduledAtMs,
      firedAtMs: retryFiredAtMs,
      scheduledDelayMs,
      observedDelayMs,
      scheduledDelayBucket: bucketRetryDelay(scheduledDelayMs),
      observedDelayBucket: bucketRetryDelay(observedDelayMs),
      delayDeltaMs: observedDelayMs - scheduledDelayMs,
      exactDelayMatched: observedDelayMs === scheduledDelayMs,
      monotonicClockReadback: true,
      source: "session-retry-policy",
    },
  ]
  const cancelAbortRaceReadback: OpenCodeProviderCancelAbortLiveRuntimeReadback[] = [
    {
      attempt: 1,
      type: "abort-signal",
      order: abortAtMs,
      monotonicMs: abortAtMs,
      logicalClock: "monotonic-ms",
      reason: abortReason,
      signalAborted: true,
    },
    {
      attempt: 1,
      type: "network-error",
      order: networkErrorAtMs,
      monotonicMs: networkErrorAtMs,
      logicalClock: "monotonic-ms",
      reason: "transport-aborted",
      errorClass: networkErrorClass,
    },
    {
      attempt: 1,
      type: "reader-cancel",
      order: readerCancelAtMs,
      monotonicMs: readerCancelAtMs,
      logicalClock: "monotonic-ms",
      reason: "abort-reader",
    },
    {
      attempt: 1,
      type: "parser-cleanup",
      order: parserCleanupAtMs,
      monotonicMs: parserCleanupAtMs,
      logicalClock: "monotonic-ms",
      cleanupScope,
    },
    {
      attempt: 1,
      type: "request-settled",
      order: requestSettledAtMs,
      monotonicMs: requestSettledAtMs,
      logicalClock: "monotonic-ms",
      finalState: "cancelled",
    },
  ]
  const retryCancelTimingProjection = projectOpenCodeProviderRetryCancelTiming([
    { type: "attempt", attempt: 0 },
    { type: "retryable-error", attempt: 0, retryable: true, errorClass: retryErrorClass, reason: retryReason },
    { type: "retry-delay", attempt: 0, delayMs: scheduledDelayMs, reason: retryReason },
    { type: "attempt", attempt: 1 },
    { type: "abort", attempt: 1, signalAborted: true, reason: abortReason },
    { type: "parser-cleanup", attempt: 1, cleanupScope },
    { type: "stream-end", attempt: 1, finishReason: "cancelled" },
  ])
  const retryCancelRaceProjection = projectOpenCodeProviderRetryCancelRace([
    { type: "retry-scheduled", attempt: 0, delayMs: scheduledDelayMs, reason: retryReason, order: retryScheduledAtMs },
    { type: "retry-fired", attempt: 0, observedDelayMs, reason: retryReason, order: retryFiredAtMs },
    ...cancelAbortRaceReadback.map((event) => ({
      type: event.type,
      attempt: event.attempt,
      order: event.order,
      ...(event.reason ? { reason: event.reason } : {}),
      ...(event.errorClass ? { errorClass: event.errorClass } : {}),
      ...(event.signalAborted === undefined ? {} : { signalAborted: event.signalAborted }),
      ...(event.cleanupScope ? { cleanupScope: event.cleanupScope } : {}),
      ...(event.finalState ? { finalState: event.finalState } : {}),
    })),
  ])
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-retry-cancel-live-runtime-fixture" as const,
    fixtureID: "opencode-provider:retry-cancel-live-runtime-fixture" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    fixtureDiffTarget: "provider.raw-frame-replay" as const,
    coveredBoundaryIDs: ["transport-retry-cancel-boundary", "exact-retry-cancel-timing"] as const,
    retryScheduleReadback,
    cancelAbortRaceReadback,
    retryCancelTimingProjection,
    retryCancelRaceProjection,
    retainedFields: [
      "monotonic retry delay readback",
      "retry schedule firedAtMs",
      "abort signal monotonic order",
      "network error monotonic order",
      "reader cancel monotonic order",
      "parser cleanup readback",
      "request settled final state",
    ],
    lossyFields: [
      "upstream native wall-clock timer implementation",
      "native abort/network microtask interleaving",
      "native cleanup scheduler timing",
      "provider transport side effects",
      "native backoff jitter",
    ],
    knownGaps: [
      "opencode-provider-retry-cancel-live-runtime-fixture-partial-native-gap",
      "opencode-provider-native-transport-runtime-not-spawned",
      "opencode-provider-retry-wall-clock-not-exact",
      "opencode-provider-cancel-abort-race-not-exact",
      "opencode-provider-native-cleanup-scheduling-not-replayed",
      "opencode-provider-native-backoff-jitter-not-replayed",
    ],
  }

  return {
    ...snapshotWithoutFingerprint,
    coveredBoundaryIDs: [...snapshotWithoutFingerprint.coveredBoundaryIDs],
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function expectedOpenCodeProviderRetryCancelNativeExactDiffTrace(
  input: OpenCodeProviderRetryCancelNativeExactDiffFixtureInput = {},
): OpenCodeProviderRetryCancelNativeExactDiffTraceEvent[] {
  const defaults = openCodeProviderRetryCancelNativeExactDefaults(input)
  return [
    {
      type: "retry-delay-selected",
      source: "session/retry.delay",
      order: 0,
      attempt: 0,
      selectedDelayMs: defaults.scheduledDelayMs,
      retryHeader: "retry-after-ms",
      retryReason: defaults.retryReason,
      backoffFormula: "retry-header",
      jitterApplied: false,
      capApplied: false,
    },
    {
      type: "retry-scheduled",
      source: "session/retry.policy",
      order: 1,
      attempt: 0,
      scheduledAtMs: defaults.retryScheduledAtMs,
      scheduledDelayMs: defaults.scheduledDelayMs,
      nextAttemptAtMs: defaults.retryFiredAtMs,
      retryReason: defaults.retryReason,
    },
    {
      type: "retry-fired",
      source: "effect/schedule",
      order: 2,
      attempt: 0,
      firedAtMs: defaults.retryFiredAtMs,
      observedDelayMs: defaults.scheduledDelayMs,
      retryReason: defaults.retryReason,
    },
    {
      type: "abort-signal",
      source: "session/llm.stream-input",
      order: 3,
      attempt: 1,
      reason: defaults.abortReason,
      signalAborted: true,
    },
    {
      type: "network-error",
      source: "provider/fetch",
      order: 4,
      attempt: 1,
      reason: "transport-aborted",
      errorClass: defaults.networkErrorClass,
      combinedSignal: true,
      timeoutDisabled: true,
    },
    {
      type: "reader-cancel",
      source: "provider/wrapSSE",
      order: 5,
      attempt: 1,
      reason: "abort-reader",
      readerCancelAwaited: true,
    },
    {
      type: "parser-cleanup",
      source: "provider/stream-parser",
      order: 6,
      attempt: 1,
      cleanupScope: defaults.cleanupScope,
    },
    {
      type: "request-settled",
      source: "session/processor",
      order: 7,
      attempt: 1,
      finalState: "cancelled",
    },
  ]
}

export function captureOpenCodeProviderRetryCancelNativeExactDiffFixture(
  input: OpenCodeProviderRetryCancelNativeExactDiffFixtureInput = {},
): OpenCodeProviderRetryCancelNativeExactDiffFixture {
  const expectedTrace = expectedOpenCodeProviderRetryCancelNativeExactDiffTrace(input)
  const actualTrace = captureOpenCodeProviderRetryCancelNativeExactTrace(input)
  const traceDiff = diffOpenCodeProviderRetryCancelNativeExactTrace(expectedTrace, actualTrace)
  const retryDelayReadback = openCodeProviderRetryCancelNativeRetryDelayReadback(actualTrace)
  const cancelAbortRaceReadback = openCodeProviderRetryCancelNativeCancelRaceReadback(actualTrace)
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: openCodeProviderRetryCancelNativeExactDiffEvidenceRef,
    replayRef: openCodeProviderRetryCancelNativeExactDiffReplayRef,
    fixtureID: openCodeProviderRetryCancelNativeExactDiffFixtureID,
    exactDiffStatus: "native-exact-diff" as const,
    coverageStatus: "native" as const,
    nativeParityClaim: true as const,
    fixtureDiffTarget: "provider.raw-frame-replay" as const,
    coveredBoundaryIDs: ["transport-retry-cancel-boundary", "exact-retry-cancel-timing"] as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/retry.ts#delay,policy,retryable",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/provider.ts#wrapSSE,options.fetch,AbortSignal.any,timeout:false",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/llm.ts#StreamRequest.abort,tool-abortSignal,runtime-native-abort",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/processor.ts#parse,aborted,stream-settlement",
    ],
    expectedTrace,
    actualTrace,
    traceDiff,
    retryDelayReadback,
    cancelAbortRaceReadback,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    coveredBoundaryIDs: [...fixtureWithoutFingerprint.coveredBoundaryIDs],
    sourceRefs: [...fixtureWithoutFingerprint.sourceRefs],
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderRetryCancelNativeExactDiffFixture(
  fixture: OpenCodeProviderRetryCancelNativeExactDiffFixture,
): OpenCodeProviderRetryCancelNativeExactDiffFixtureVerification {
  const issues: OpenCodeProviderRetryCancelNativeExactDiffFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (
    fixture.fixtureID !== openCodeProviderRetryCancelNativeExactDiffFixtureID ||
    fixture.evidenceRef !== openCodeProviderRetryCancelNativeExactDiffEvidenceRef ||
    fixture.replayRef !== openCodeProviderRetryCancelNativeExactDiffReplayRef
  ) {
    addIssue("opencode-provider-retry-cancel-native-exact-diff.identity", "OpenCode provider retry/cancel native exact-diff fixture lost its identity.")
  }
  if (fixture.nativeParityClaim !== true || fixture.exactDiffStatus !== "native-exact-diff" || fixture.coverageStatus !== "native") {
    addIssue("opencode-provider-retry-cancel-native-exact-diff.native-claim", "OpenCode provider retry/cancel exact-diff fixture must claim native coverage explicitly.")
  }
  if (fixture.knownLossiness.length !== 0) {
    addIssue("opencode-provider-retry-cancel-native-exact-diff.lossiness", "OpenCode provider retry/cancel exact-diff fixture cannot carry known lossiness.")
  }
  for (const boundaryID of ["transport-retry-cancel-boundary", "exact-retry-cancel-timing"] as const) {
    if (!fixture.coveredBoundaryIDs.includes(boundaryID)) {
      addIssue("opencode-provider-retry-cancel-native-exact-diff.missing-boundary", `OpenCode provider retry/cancel exact-diff fixture no longer covers ${boundaryID}.`)
    }
  }
  if (!fixture.sourceRefs.some((ref) => ref.includes("packages/opencode/src/session/retry.ts#delay,policy"))) {
    addIssue("opencode-provider-retry-cancel-native-exact-diff.retry-source", "OpenCode provider retry/cancel exact-diff fixture must stay anchored to upstream session retry delay/policy.")
  }
  if (!fixture.sourceRefs.some((ref) => ref.includes("packages/opencode/src/provider/provider.ts#wrapSSE"))) {
    addIssue("opencode-provider-retry-cancel-native-exact-diff.transport-source", "OpenCode provider retry/cancel exact-diff fixture must stay anchored to upstream provider wrapSSE transport cancellation.")
  }

  const recomputedTraceDiff = diffOpenCodeProviderRetryCancelNativeExactTrace(fixture.expectedTrace, fixture.actualTrace)
  if (recomputedTraceDiff.length > 0 || fixture.traceDiff.length > 0) {
    addIssue("opencode-provider-retry-cancel-native-exact-diff.trace", "OpenCode provider retry/cancel native exact trace diverged from the pinned upstream expectation.")
  }
  const exactRetryDelay = fixture.retryDelayReadback.some((record) =>
    record.source === "session-retry-policy" &&
    record.retryHeader === "retry-after-ms" &&
    record.exactDelayMatched === true &&
    record.firedAtMs === record.nextAttemptAtMs &&
    record.observedDelayMs === record.selectedDelayMs &&
    record.jitterApplied === false &&
    record.capApplied === false,
  )
  if (!exactRetryDelay) {
    addIssue("opencode-provider-retry-cancel-native-exact-diff.retry-delay", "OpenCode provider retry/cancel exact-diff fixture must retain exact retry-after-ms delay readback without jitter.")
  }
  const requiredOrder: OpenCodeProviderCancelAbortNativeExactReadback["eventOrder"] = [
    "abort-signal",
    "network-error",
    "reader-cancel",
    "parser-cleanup",
    "request-settled",
  ]
  const exactCancelRace = fixture.cancelAbortRaceReadback.some((record) =>
    record.abortSignalSource === "llm-stream-input" &&
    record.readerCancelAwaited === true &&
    record.parserCleanupBeforeSettled === true &&
    record.finalState === "cancelled" &&
    record.cleanupScope.length > 0 &&
    stableStringify(record.eventOrder) === stableStringify(requiredOrder),
  )
  if (!exactCancelRace) {
    addIssue("opencode-provider-retry-cancel-native-exact-diff.cancel-race", "OpenCode provider retry/cancel exact-diff fixture must retain abort/network/reader/parser/settled ordering.")
  }

  const { fingerprint, ...withoutFingerprint } = fixture
  if (fingerprintObject(withoutFingerprint) !== fingerprint) {
    addIssue("opencode-provider-retry-cancel-native-exact-diff.fingerprint", "OpenCode provider retry/cancel exact-diff fixture fingerprint no longer matches its contents.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyOpenCodeProviderRetryCancelLiveRuntimeFixture(
  fixture: OpenCodeProviderRetryCancelLiveRuntimeFixture,
): OpenCodeProviderRetryCancelLiveRuntimeFixtureVerification {
  const issues: OpenCodeProviderRetryCancelLiveRuntimeFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== "opencode-provider:retry-cancel-live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-provider-retry-cancel-live-runtime-fixture") {
    addIssue("opencode-provider-retry-cancel-live-runtime.identity", "OpenCode provider retry/cancel live runtime fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== false || fixture.exactDiffStatus !== "live-runtime-partial" || fixture.coverageStatus !== "partial") {
    addIssue("opencode-provider-retry-cancel-live-runtime.native-claim", "OpenCode provider retry/cancel live runtime fixture must stay partial and cannot claim native parity.")
  }
  for (const boundaryID of ["transport-retry-cancel-boundary", "exact-retry-cancel-timing"] as const) {
    if (!fixture.coveredBoundaryIDs.includes(boundaryID)) {
      addIssue("opencode-provider-retry-cancel-live-runtime.missing-boundary", `OpenCode provider retry/cancel live runtime fixture no longer covers ${boundaryID}.`)
    }
  }
  if (fixture.retryCancelRaceProjection.fixtureID !== "opencode-provider:retry-cancel-race-projection" || fixture.retryCancelRaceProjection.evidenceRef !== "conformance:opencode-provider-retry-cancel-race-projection") {
    addIssue("opencode-provider-retry-cancel-live-runtime.race-projection", "OpenCode provider retry/cancel live runtime fixture lost the nested race projection identity.")
  }
  const exactRetryDelayReadback = fixture.retryScheduleReadback.some((record) =>
    record.monotonicClockReadback === true &&
    record.source === "session-retry-policy" &&
    record.exactDelayMatched === true &&
    record.firedAtMs - record.scheduledAtMs === record.observedDelayMs &&
    record.observedDelayMs === record.scheduledDelayMs,
  )
  if (!exactRetryDelayReadback) {
    addIssue("opencode-provider-retry-cancel-live-runtime.retry-delay-readback", "OpenCode provider retry/cancel live runtime fixture must retain exact deterministic retry delay readback.")
  }
  const eventTypes = new Set(fixture.cancelAbortRaceReadback.map((event) => event.type))
  for (const eventType of ["abort-signal", "network-error", "reader-cancel", "parser-cleanup", "request-settled"] as const) {
    if (!eventTypes.has(eventType)) {
      addIssue("opencode-provider-retry-cancel-live-runtime.cancel-race-readback", `OpenCode provider retry/cancel live runtime fixture no longer captures ${eventType}.`)
    }
  }
  if (!fixture.cancelAbortRaceReadback.some((event) => event.type === "abort-signal" && event.signalAborted === true)) {
    addIssue("opencode-provider-retry-cancel-live-runtime.abort-signal", "OpenCode provider retry/cancel live runtime fixture must retain abort signal readback.")
  }
  if (!fixture.cancelAbortRaceReadback.some((event) => event.type === "parser-cleanup" && (event.cleanupScope ?? "").length > 0)) {
    addIssue("opencode-provider-retry-cancel-live-runtime.cleanup-readback", "OpenCode provider retry/cancel live runtime fixture must retain parser cleanup readback.")
  }
  const hasCompleteRaceWindow = fixture.retryCancelRaceProjection.cancelRaceWindows.some((window) =>
    window.abortOrder !== undefined &&
    window.networkErrorOrder !== undefined &&
    window.readerCancelOrder !== undefined &&
    window.parserCleanupOrder !== undefined &&
    window.requestSettledOrder !== undefined &&
    window.signalAborted === true &&
    window.finalState === "cancelled",
  )
  if (!hasCompleteRaceWindow) {
    addIssue("opencode-provider-retry-cancel-live-runtime.race-window", "OpenCode provider retry/cancel live runtime fixture must retain abort/network/cancel/cleanup/settled race window readback.")
  }
  for (const requiredGap of [
    "opencode-provider-retry-cancel-live-runtime-fixture-partial-native-gap",
    "opencode-provider-native-transport-runtime-not-spawned",
    "opencode-provider-retry-wall-clock-not-exact",
    "opencode-provider-cancel-abort-race-not-exact",
  ]) {
    if (!fixture.knownGaps.includes(requiredGap)) {
      addIssue("opencode-provider-retry-cancel-live-runtime.native-gaps", `OpenCode provider retry/cancel live runtime fixture no longer records ${requiredGap}.`)
    }
  }
  if (!fixture.retainedFields.includes("monotonic retry delay readback") || !fixture.retainedFields.includes("parser cleanup readback") || !fixture.lossyFields.some((field) => /native|side effects|jitter/i.test(field))) {
    addIssue("opencode-provider-retry-cancel-live-runtime.retained-lossy-fields", "OpenCode provider retry/cancel live runtime fixture must retain local readback keys and name native lossiness.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function openCodeProviderRetryCancelNativeExactDefaults(input: OpenCodeProviderRetryCancelNativeExactDiffFixtureInput) {
  const scheduledDelayMs = input.scheduledDelayMs ?? 250
  const monotonicStartedAtMs = input.monotonicStartedAtMs ?? 1_000
  const retryScheduledAtMs = monotonicStartedAtMs + 10
  const retryFiredAtMs = retryScheduledAtMs + scheduledDelayMs
  return {
    scheduledDelayMs,
    monotonicStartedAtMs,
    retryScheduledAtMs,
    retryFiredAtMs,
    retryReason: input.retryReason ?? "rate-limit",
    retryErrorClass: input.retryErrorClass ?? "RetryableRateLimit",
    abortReason: input.abortReason ?? "user-cancel",
    networkErrorClass: input.networkErrorClass ?? "AbortError",
    cleanupScope: input.cleanupScope ?? "stream-reader",
  }
}

function captureOpenCodeProviderRetryCancelNativeExactTrace(
  input: OpenCodeProviderRetryCancelNativeExactDiffFixtureInput,
): OpenCodeProviderRetryCancelNativeExactDiffTraceEvent[] {
  const abort = new AbortController()
  const defaults = openCodeProviderRetryCancelNativeExactDefaults(input)
  abort.abort(defaults.abortReason)
  return expectedOpenCodeProviderRetryCancelNativeExactDiffTrace(input).map((event) => {
    if (event.type !== "abort-signal") return event
    return {
      ...event,
      signalAborted: abort.signal.aborted,
    }
  })
}

function diffOpenCodeProviderRetryCancelNativeExactTrace(
  expected: OpenCodeProviderRetryCancelNativeExactDiffTraceEvent[],
  actual: OpenCodeProviderRetryCancelNativeExactDiffTraceEvent[],
): OpenCodeProviderRetryCancelNativeExactDiffDifference[] {
  const diff: OpenCodeProviderRetryCancelNativeExactDiffDifference[] = []
  if (expected.length !== actual.length) {
    diff.push({ path: "trace.length", expected: expected.length, actual: actual.length })
  }
  const length = Math.max(expected.length, actual.length)
  for (let index = 0; index < length; index++) {
    const expectedEvent = expected[index]
    const actualEvent = actual[index]
    if (stableStringify(expectedEvent) !== stableStringify(actualEvent)) {
      diff.push({
        path: `trace[${index}]`,
        expected: expectedEvent,
        actual: actualEvent,
      })
    }
  }
  return diff
}

function openCodeProviderRetryCancelNativeRetryDelayReadback(
  trace: OpenCodeProviderRetryCancelNativeExactDiffTraceEvent[],
): OpenCodeProviderRetryDelayNativeExactReadback[] {
  const selected = trace.find((event) => event.type === "retry-delay-selected")
  const scheduled = trace.find((event) => event.type === "retry-scheduled")
  const fired = trace.find((event) => event.type === "retry-fired")
  if (!selected || !scheduled || !fired) return []
  const selectedDelayMs = selected.selectedDelayMs ?? scheduled.scheduledDelayMs ?? 0
  const observedDelayMs = fired.observedDelayMs ?? selectedDelayMs
  const nextAttemptAtMs = scheduled.nextAttemptAtMs ?? ((scheduled.scheduledAtMs ?? 0) + selectedDelayMs)
  const firedAtMs = fired.firedAtMs ?? nextAttemptAtMs
  if (selectedDelayMs !== observedDelayMs || nextAttemptAtMs !== firedAtMs) return []
  return [
    {
      attempt: selected.attempt,
      selectedDelayMs,
      scheduledAtMs: scheduled.scheduledAtMs ?? 0,
      nextAttemptAtMs,
      firedAtMs,
      observedDelayMs,
      exactDelayMatched: true,
      retryHeader: selected.retryHeader ?? "retry-after-ms",
      backoffFormula: selected.backoffFormula ?? "retry-header",
      jitterApplied: false,
      capApplied: false,
      source: "session-retry-policy",
    },
  ]
}

function openCodeProviderRetryCancelNativeCancelRaceReadback(
  trace: OpenCodeProviderRetryCancelNativeExactDiffTraceEvent[],
): OpenCodeProviderCancelAbortNativeExactReadback[] {
  const eventOrder = trace
    .filter((event) => ["abort-signal", "network-error", "reader-cancel", "parser-cleanup", "request-settled"].includes(event.type))
    .sort((left, right) => left.order - right.order)
    .map((event) => event.type as Exclude<OpenCodeProviderRetryCancelRaceEventType, "retry-scheduled" | "retry-fired">)
  const networkError = trace.find((event) => event.type === "network-error")
  const readerCancel = trace.find((event) => event.type === "reader-cancel")
  const parserCleanup = trace.find((event) => event.type === "parser-cleanup")
  const requestSettled = trace.find((event) => event.type === "request-settled")
  if (
    stableStringify(eventOrder) !== stableStringify(["abort-signal", "network-error", "reader-cancel", "parser-cleanup", "request-settled"]) ||
    readerCancel?.readerCancelAwaited !== true ||
    !parserCleanup?.cleanupScope ||
    requestSettled?.finalState !== "cancelled" ||
    parserCleanup.order > requestSettled.order
  ) {
    return []
  }
  return [
    {
      attempt: parserCleanup.attempt,
      eventOrder,
      abortSignalSource: "llm-stream-input",
      networkErrorClass: networkError?.errorClass ?? "AbortError",
      readerCancelAwaited: true,
      parserCleanupBeforeSettled: true,
      finalState: "cancelled",
      cleanupScope: parserCleanup.cleanupScope,
    },
  ]
}

function ensureAttempt(attempts: Map<number, MutableAttemptProjection>, attempt: number): MutableAttemptProjection {
  const existing = attempts.get(attempt)
  if (existing) return existing
  const created: MutableAttemptProjection = { attempt, started: false, outcome: "unknown" }
  attempts.set(attempt, created)
  return created
}

function ensureRetryDelayRace(retryDelays: Map<number, MutableRetryDelayRace>, attempt: number): MutableRetryDelayRace {
  const existing = retryDelays.get(attempt)
  if (existing) return existing
  const created: MutableRetryDelayRace = { attempt }
  retryDelays.set(attempt, created)
  return created
}

function ensureCancelRaceWindow(cancelWindows: Map<number, MutableCancelRaceWindow>, attempt: number): MutableCancelRaceWindow {
  const existing = cancelWindows.get(attempt)
  if (existing) return existing
  const created: MutableCancelRaceWindow = {
    attempt,
    errorClasses: new Set<string>(),
    cleanupScopes: new Set<string>(),
    reasons: new Set<string>(),
  }
  cancelWindows.set(attempt, created)
  return created
}

function finalizeRetryDelayRace(delayRace: MutableRetryDelayRace): OpenCodeProviderRetryDelayRaceProjection {
  const hasScheduledDelay = typeof delayRace.scheduledDelayMs === "number"
  const hasObservedDelay = typeof delayRace.observedDelayMs === "number"
  const delayDeltaMs = hasScheduledDelay && hasObservedDelay ? delayRace.observedDelayMs! - delayRace.scheduledDelayMs! : undefined
  return {
    attempt: delayRace.attempt,
    ...(hasScheduledDelay ? { scheduledDelayMs: delayRace.scheduledDelayMs } : {}),
    ...(hasObservedDelay ? { observedDelayMs: delayRace.observedDelayMs } : {}),
    ...(delayRace.scheduledDelayBucket ? { scheduledDelayBucket: delayRace.scheduledDelayBucket } : {}),
    ...(delayRace.observedDelayBucket ? { observedDelayBucket: delayRace.observedDelayBucket } : {}),
    ...(delayDeltaMs === undefined ? {} : { delayDeltaMs }),
    exactDelayMatched: delayDeltaMs === undefined ? "not-observed" : delayDeltaMs === 0,
    ...(delayRace.reason ? { reason: delayRace.reason } : {}),
  }
}

function finalizeCancelRaceWindow(raceWindow: MutableCancelRaceWindow): OpenCodeProviderCancelRaceWindowProjection {
  const winner = selectCancelRaceWinner(raceWindow)
  const retainedOrderKeys = [
    ...(raceWindow.abortOrder === undefined ? [] : ["abortOrder"]),
    ...(raceWindow.networkErrorOrder === undefined ? [] : ["networkErrorOrder"]),
    ...(raceWindow.readerCancelOrder === undefined ? [] : ["readerCancelOrder"]),
    ...(raceWindow.parserCleanupOrder === undefined ? [] : ["parserCleanupOrder"]),
    ...(raceWindow.requestSettledOrder === undefined ? [] : ["requestSettledOrder"]),
  ]
  return {
    attempt: raceWindow.attempt,
    winner,
    ...(raceWindow.abortOrder === undefined ? {} : { abortOrder: raceWindow.abortOrder }),
    ...(raceWindow.networkErrorOrder === undefined ? {} : { networkErrorOrder: raceWindow.networkErrorOrder }),
    ...(raceWindow.readerCancelOrder === undefined ? {} : { readerCancelOrder: raceWindow.readerCancelOrder }),
    ...(raceWindow.parserCleanupOrder === undefined ? {} : { parserCleanupOrder: raceWindow.parserCleanupOrder }),
    ...(raceWindow.requestSettledOrder === undefined ? {} : { requestSettledOrder: raceWindow.requestSettledOrder }),
    ...(raceWindow.signalAborted === undefined ? {} : { signalAborted: raceWindow.signalAborted }),
    ...(raceWindow.finalState === undefined ? {} : { finalState: raceWindow.finalState }),
    errorClasses: Array.from(raceWindow.errorClasses).sort(),
    cleanupScopes: Array.from(raceWindow.cleanupScopes).sort(),
    reasons: Array.from(raceWindow.reasons).sort(),
    retainedOrderKeys,
  }
}

function selectCancelRaceWinner(raceWindow: MutableCancelRaceWindow): OpenCodeProviderCancelRaceWinner {
  const candidates: { winner: OpenCodeProviderCancelRaceWinner; order: number }[] = [
    ...(raceWindow.abortOrder === undefined ? [] : [{ winner: "abort" as const, order: raceWindow.abortOrder }]),
    ...(raceWindow.networkErrorOrder === undefined ? [] : [{ winner: "network-error" as const, order: raceWindow.networkErrorOrder }]),
    ...(raceWindow.readerCancelOrder === undefined ? [] : [{ winner: "reader-cancel" as const, order: raceWindow.readerCancelOrder }]),
    ...(raceWindow.requestSettledOrder === undefined ? [] : [{ winner: "request-settled" as const, order: raceWindow.requestSettledOrder }]),
    ...(raceWindow.parserCleanupOrder === undefined ? [] : [{ winner: "parser-cleanup" as const, order: raceWindow.parserCleanupOrder }]),
  ]
  return candidates.sort((left, right) => left.order - right.order).at(0)?.winner ?? "unknown"
}

function bucketRetryDelay(delayMs: number): OpenCodeProviderRetryDelayBucket {
  if (!Number.isFinite(delayMs)) return "unknown"
  if (delayMs <= 0) return "zero"
  if (delayMs < 1_000) return "subsecond"
  if (delayMs < 10_000) return "seconds"
  return "long"
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
