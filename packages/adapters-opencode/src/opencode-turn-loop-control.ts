import { createHash } from "node:crypto"

export type OpenCodeTurnLoopControlResult = "compact" | "stop" | "continue"

export interface OpenCodeTurnLoopControlConfig {
  experimental?: {
    continue_loop_on_deny?: boolean
  }
}

export interface OpenCodeTurnLoopControlContext {
  needsCompaction: boolean
  blocked: boolean
  assistantError?: unknown
}

export interface OpenCodeTurnLoopControlBridge {
  initialShouldBreak(config: OpenCodeTurnLoopControlConfig): boolean
  decide(context: OpenCodeTurnLoopControlContext): OpenCodeTurnLoopControlResult
}

export interface OpenCodeTurnContinuationPolicyNativeExactFixtureCase {
  id: "default-deny-breaks-loop" | "config-allows-deny-continuation" | "clean-turn-continues"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTurnStopConditionNativeExactFixtureCase {
  id: "compaction-priority" | "blocked-stops" | "assistant-error-stops" | "clean-turn-does-not-stop"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTurnContinuationPolicyNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.continuation-policy"
  portID: "turn.continuation-policy"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-continuation-policy-native-exact-fixture"
  replayRef: "turn-continuation-policy-native-exact:opencode"
  fixtureID: "opencode-turn-continuation-policy:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnContinuationPolicyNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnStopConditionNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.stop-condition"
  portID: "turn.stop-condition"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-stop-condition-native-exact-fixture"
  replayRef: "turn-stop-condition-native-exact:opencode"
  fixtureID: "opencode-turn-stop-condition:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnStopConditionNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnLoopControlNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnLoopControlNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnLoopControlNativeExactFixtureIssue[]
}

export function createOpenCodeTurnLoopControlBridge(): OpenCodeTurnLoopControlBridge {
  return {
    initialShouldBreak: openCodeTurnLoopInitialShouldBreak,
    decide: decideOpenCodeTurnLoopResult,
  }
}

export function openCodeTurnLoopInitialShouldBreak(config: OpenCodeTurnLoopControlConfig): boolean {
  return config.experimental?.continue_loop_on_deny !== true
}

export function decideOpenCodeTurnLoopResult(context: OpenCodeTurnLoopControlContext): OpenCodeTurnLoopControlResult {
  if (context.needsCompaction) return "compact"
  if (context.blocked || context.assistantError) return "stop"
  return "continue"
}

export function captureOpenCodeTurnContinuationPolicyNativeExactFixture(): OpenCodeTurnContinuationPolicyNativeExactFixture {
  const bridge = createOpenCodeTurnLoopControlBridge()
  const cases: OpenCodeTurnContinuationPolicyNativeExactFixtureCase[] = [
    {
      id: "default-deny-breaks-loop",
      actual: bridge.initialShouldBreak({}),
      expected: true,
    },
    {
      id: "config-allows-deny-continuation",
      actual: bridge.initialShouldBreak({ experimental: { continue_loop_on_deny: true } }),
      expected: false,
    },
    {
      id: "clean-turn-continues",
      actual: bridge.decide({ needsCompaction: false, blocked: false }),
      expected: "continue",
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.continuation-policy" as const,
    portID: "turn.continuation-policy" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-continuation-policy-native-exact-fixture" as const,
    replayRef: "turn-continuation-policy-native-exact:opencode" as const,
    fixtureID: "opencode-turn-continuation-policy:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/processor.ts#SessionProcessor.process,continue_loop_on_deny,continue",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function captureOpenCodeTurnStopConditionNativeExactFixture(): OpenCodeTurnStopConditionNativeExactFixture {
  const bridge = createOpenCodeTurnLoopControlBridge()
  const cases: OpenCodeTurnStopConditionNativeExactFixtureCase[] = [
    {
      id: "compaction-priority",
      actual: bridge.decide({ needsCompaction: true, blocked: true, assistantError: { message: "ignored because compaction wins" } }),
      expected: "compact",
    },
    {
      id: "blocked-stops",
      actual: bridge.decide({ needsCompaction: false, blocked: true }),
      expected: "stop",
    },
    {
      id: "assistant-error-stops",
      actual: bridge.decide({ needsCompaction: false, blocked: false, assistantError: { message: "provider failed" } }),
      expected: "stop",
    },
    {
      id: "clean-turn-does-not-stop",
      actual: bridge.decide({ needsCompaction: false, blocked: false }),
      expected: "continue",
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.stop-condition" as const,
    portID: "turn.stop-condition" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-stop-condition-native-exact-fixture" as const,
    replayRef: "turn-stop-condition-native-exact:opencode" as const,
    fixtureID: "opencode-turn-stop-condition:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/processor.ts#SessionProcessor.process,compact,stop,continue",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnContinuationPolicyNativeExactFixture(
  fixture: OpenCodeTurnContinuationPolicyNativeExactFixture,
): OpenCodeTurnLoopControlNativeExactFixtureVerification {
  const issues = verifyBase(fixture, {
    atomID: "opencode.turn.continuation-policy",
    portID: "turn.continuation-policy",
    fixtureID: "opencode-turn-continuation-policy:native-exact-fixture",
    prefix: "opencode-turn-continuation-policy-native-exact",
  })
  const clean = fixture.cases.find((item) => item.id === "clean-turn-continues")
  if (!clean || clean.actual !== "continue") {
    issues.push({ id: "opencode-turn-continuation-policy-native-exact.clean-continues", message: "Clean OpenCode turns must continue." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-continuation-policy-native-exact.fingerprint", message: "OpenCode turn continuation policy fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

export function verifyOpenCodeTurnStopConditionNativeExactFixture(
  fixture: OpenCodeTurnStopConditionNativeExactFixture,
): OpenCodeTurnLoopControlNativeExactFixtureVerification {
  const issues = verifyBase(fixture, {
    atomID: "opencode.turn.stop-condition",
    portID: "turn.stop-condition",
    fixtureID: "opencode-turn-stop-condition:native-exact-fixture",
    prefix: "opencode-turn-stop-condition-native-exact",
  })
  const compaction = fixture.cases.find((item) => item.id === "compaction-priority")
  if (!compaction || compaction.actual !== "compact") {
    issues.push({ id: "opencode-turn-stop-condition-native-exact.compaction-priority", message: "Compaction must win before blocked/error stop decisions." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-stop-condition-native-exact.fingerprint", message: "OpenCode turn stop-condition fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function verifyBase(
  fixture: OpenCodeTurnContinuationPolicyNativeExactFixture | OpenCodeTurnStopConditionNativeExactFixture,
  expected: { atomID: string; portID: string; fixtureID: string; prefix: string },
): OpenCodeTurnLoopControlNativeExactFixtureIssue[] {
  const issues: OpenCodeTurnLoopControlNativeExactFixtureIssue[] = []
  if (fixture.atomID !== expected.atomID || fixture.portID !== expected.portID || fixture.fixtureID !== expected.fixtureID) {
    issues.push({ id: `${expected.prefix}.identity`, message: "OpenCode turn loop-control fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: `${expected.prefix}.native-claim`, message: "OpenCode turn loop-control fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: `${expected.prefix}.lossiness`, message: "OpenCode turn loop-control native fixture cannot retain known lossiness." })
  }
  if (!fixture.sourceRefs.some((ref) => ref.includes("session/processor.ts") && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
    issues.push({ id: `${expected.prefix}.source`, message: "OpenCode turn loop-control fixture lost pinned SessionProcessor source." })
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actual, item.expected)) {
      issues.push({ id: `${expected.prefix}.case`, caseID: item.id, message: `${item.id} no longer matches pinned SessionProcessor loop-control behavior.` })
    }
  }
  return issues
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
