import { createHash } from "node:crypto"
import {
  captureOpenCodeProviderEventObserverNativeExactFixture,
  createOpenCodeProviderEventObserverBridge,
  type OpenCodeProviderEventObserverAISDKEvent,
  type OpenCodeProviderEventObserverLLMEvent,
  type OpenCodeProviderEventObserverNativeExactFixtureCase,
  type OpenCodeProviderEventObserverState,
} from "./opencode-provider-event-observer"

export type OpenCodeTurnStreamReducerInputEvent = OpenCodeProviderEventObserverAISDKEvent
export type OpenCodeTurnStreamReducerEvent = OpenCodeProviderEventObserverLLMEvent
export type OpenCodeTurnStreamReducerState = OpenCodeProviderEventObserverState

export interface OpenCodeTurnStreamReducerBridge {
  createState(): OpenCodeTurnStreamReducerState
  reduceEvent(state: OpenCodeTurnStreamReducerState, event: OpenCodeTurnStreamReducerInputEvent): OpenCodeTurnStreamReducerEvent[]
  reduceEvents(events: OpenCodeTurnStreamReducerInputEvent[], state?: OpenCodeTurnStreamReducerState): OpenCodeTurnStreamReducerEvent[]
}

export interface OpenCodeTurnStreamReducerNativeExactFixtureCase {
  id: OpenCodeProviderEventObserverNativeExactFixtureCase["id"]
  input: OpenCodeTurnStreamReducerInputEvent[]
  actual: OpenCodeTurnStreamReducerEvent[]
  expected: OpenCodeTurnStreamReducerEvent[]
}

export interface OpenCodeTurnStreamReducerNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.stream-reducer"
  portID: "turn.stream-reducer"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-stream-reducer-native-exact-fixture"
  replayRef: "turn-stream-reducer-native-exact:opencode"
  fixtureID: "opencode-turn-stream-reducer:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnStreamReducerNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnStreamReducerNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnStreamReducerNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnStreamReducerNativeExactFixtureIssue[]
}

export function createOpenCodeTurnStreamReducerBridge(): OpenCodeTurnStreamReducerBridge {
  const bridge = createOpenCodeProviderEventObserverBridge()
  return {
    createState: bridge.createState,
    reduceEvent: bridge.observeEvent,
    reduceEvents: bridge.observeEvents,
  }
}

export function captureOpenCodeTurnStreamReducerNativeExactFixture(): OpenCodeTurnStreamReducerNativeExactFixture {
  const providerFixture = captureOpenCodeProviderEventObserverNativeExactFixture()
  const cases = providerFixture.cases.map(
    (item): OpenCodeTurnStreamReducerNativeExactFixtureCase => ({
      id: item.id,
      input: item.input,
      actual: item.actual,
      expected: item.expected,
    }),
  )
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.stream-reducer" as const,
    portID: "turn.stream-reducer" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-stream-reducer-native-exact-fixture" as const,
    replayRef: "turn-stream-reducer-native-exact:opencode" as const,
    fixtureID: "opencode-turn-stream-reducer:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/llm/ai-sdk.ts#adapterState,toLLMEvents",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/llm.ts#LLM.run,fullStream",
      "fixture-share:opencode.provider.event-observer:opencode-provider-event-observer:native-exact-fixture",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnStreamReducerNativeExactFixture(
  fixture: OpenCodeTurnStreamReducerNativeExactFixture,
): OpenCodeTurnStreamReducerNativeExactFixtureVerification {
  const issues: OpenCodeTurnStreamReducerNativeExactFixtureIssue[] = []
  if (
    fixture.atomID !== "opencode.turn.stream-reducer" ||
    fixture.portID !== "turn.stream-reducer" ||
    fixture.fixtureID !== "opencode-turn-stream-reducer:native-exact-fixture"
  ) {
    issues.push({ id: "opencode-turn-stream-reducer-native-exact.identity", message: "OpenCode turn stream reducer fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-turn-stream-reducer-native-exact.native-claim", message: "OpenCode turn stream reducer must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-turn-stream-reducer-native-exact.lossiness", message: "OpenCode turn stream reducer native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/llm/ai-sdk.ts", "session/llm.ts", "opencode.provider.event-observer"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) {
      issues.push({ id: "opencode-turn-stream-reducer-native-exact.source", message: `OpenCode turn stream reducer fixture lost upstream source ${source}.` })
    }
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-turn-stream-reducer-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned stream reducer behavior.` })
    }
  }
  const ignored = fixture.cases.find((item) => item.id === "ignored-non-session-visible-chunks")
  if (!ignored || ignored.actual.length !== 0) {
    issues.push({ id: "opencode-turn-stream-reducer-native-exact.ignored-events", message: "Non-session-visible AI SDK chunks must reduce to no LLM events." })
  }
  const reset = fixture.cases.find((item) => item.id === "finish-resets-reused-state")
  if (!reset || !reset.actual.some((event) => event.type === "text-delta" && event.id === "text-0")) {
    issues.push({ id: "opencode-turn-stream-reducer-native-exact.state-reset", message: "Finish must reset adapter counters before a reused state handles follow-up stream chunks." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-stream-reducer-native-exact.fingerprint", message: "OpenCode turn stream reducer native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableJSON(left) === stableJSON(right)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableJSON(value)).digest("hex").slice(0, 16)
}

function stableJSON(value: unknown): string {
  return JSON.stringify(sortStable(value))
}

function sortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortStable(entry)]),
  )
}
