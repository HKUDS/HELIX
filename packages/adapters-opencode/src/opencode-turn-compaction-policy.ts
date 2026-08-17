import { createHash } from "node:crypto"

export interface OpenCodeTurnCompactionPolicyConfig {
  compaction?: {
    auto?: boolean
    reserved?: number
  }
}

export interface OpenCodeTurnCompactionPolicyModel {
  limit: {
    context: number
    input?: number
    output: number
  }
}

export interface OpenCodeTurnCompactionPolicyTokens {
  total?: number
  input: number
  output: number
  cache: {
    read: number
    write: number
  }
}

export interface OpenCodeTurnCompactionPolicyInput {
  cfg: OpenCodeTurnCompactionPolicyConfig
  model: OpenCodeTurnCompactionPolicyModel
  tokens: OpenCodeTurnCompactionPolicyTokens
  outputTokenMax?: number
}

export interface OpenCodeTurnCompactionPolicyDecision {
  auto: boolean
  contextLimit: number
  usableTokens: number
  tokenCount: number
  needsCompaction: boolean
}

export interface OpenCodeTurnCompactionPolicyBridge {
  maxOutputTokens(model: OpenCodeTurnCompactionPolicyModel, outputTokenMax?: number): number
  usable(input: Omit<OpenCodeTurnCompactionPolicyInput, "tokens">): number
  tokenCount(tokens: OpenCodeTurnCompactionPolicyTokens): number
  isOverflow(input: OpenCodeTurnCompactionPolicyInput): boolean
  decide(input: OpenCodeTurnCompactionPolicyInput): OpenCodeTurnCompactionPolicyDecision
}

export interface OpenCodeTurnCompactionPolicyNativeExactFixtureCase {
  id:
    | "auto-disabled-never-compacts"
    | "context-zero-never-compacts"
    | "reserved-config-uses-input-limit"
    | "context-limit-reserves-output-max"
    | "default-buffer-caps-reservation"
    | "output-token-max-override"
    | "zero-total-falls-back-to-component-count"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTurnCompactionPolicyNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.compaction-policy"
  portID: "turn.compaction-policy"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-compaction-policy-native-exact-fixture"
  replayRef: "turn-compaction-policy-native-exact:opencode"
  fixtureID: "opencode-turn-compaction-policy:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnCompactionPolicyNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnCompactionPolicyNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnCompactionPolicyNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnCompactionPolicyNativeExactFixtureIssue[]
}

const COMPACTION_BUFFER = 20_000
const OUTPUT_TOKEN_MAX = 32_000

export function createOpenCodeTurnCompactionPolicyBridge(): OpenCodeTurnCompactionPolicyBridge {
  return {
    maxOutputTokens: openCodeTurnCompactionMaxOutputTokens,
    usable: openCodeTurnCompactionUsableTokens,
    tokenCount: openCodeTurnCompactionTokenCount,
    isOverflow: isOpenCodeTurnCompactionOverflow,
    decide: decideOpenCodeTurnCompaction,
  }
}

export function openCodeTurnCompactionMaxOutputTokens(model: OpenCodeTurnCompactionPolicyModel, outputTokenMax = OUTPUT_TOKEN_MAX): number {
  return Math.min(model.limit.output, outputTokenMax) || outputTokenMax
}

export function openCodeTurnCompactionUsableTokens(input: Omit<OpenCodeTurnCompactionPolicyInput, "tokens">): number {
  const context = input.model.limit.context
  if (context === 0) return 0
  const reserved = input.cfg.compaction?.reserved ?? Math.min(COMPACTION_BUFFER, openCodeTurnCompactionMaxOutputTokens(input.model, input.outputTokenMax))
  return input.model.limit.input
    ? Math.max(0, input.model.limit.input - reserved)
    : Math.max(0, context - openCodeTurnCompactionMaxOutputTokens(input.model, input.outputTokenMax))
}

export function openCodeTurnCompactionTokenCount(tokens: OpenCodeTurnCompactionPolicyTokens): number {
  return tokens.total || tokens.input + tokens.output + tokens.cache.read + tokens.cache.write
}

export function isOpenCodeTurnCompactionOverflow(input: OpenCodeTurnCompactionPolicyInput): boolean {
  if (input.cfg.compaction?.auto === false) return false
  if (input.model.limit.context === 0) return false
  return openCodeTurnCompactionTokenCount(input.tokens) >= openCodeTurnCompactionUsableTokens(input)
}

export function decideOpenCodeTurnCompaction(input: OpenCodeTurnCompactionPolicyInput): OpenCodeTurnCompactionPolicyDecision {
  return {
    auto: input.cfg.compaction?.auto !== false,
    contextLimit: input.model.limit.context,
    usableTokens: openCodeTurnCompactionUsableTokens(input),
    tokenCount: openCodeTurnCompactionTokenCount(input.tokens),
    needsCompaction: isOpenCodeTurnCompactionOverflow(input),
  }
}

export function captureOpenCodeTurnCompactionPolicyNativeExactFixture(): OpenCodeTurnCompactionPolicyNativeExactFixture {
  const bridge = createOpenCodeTurnCompactionPolicyBridge()
  const baseModel: OpenCodeTurnCompactionPolicyModel = { limit: { context: 100_000, input: 50_000, output: 16_000 } }
  const cases: OpenCodeTurnCompactionPolicyNativeExactFixtureCase[] = [
    {
      id: "auto-disabled-never-compacts",
      actual: bridge.decide({
        cfg: { compaction: { auto: false } },
        model: baseModel,
        tokens: tokens({ total: 50_000 }),
      }),
      expected: {
        auto: false,
        contextLimit: 100_000,
        usableTokens: 34_000,
        tokenCount: 50_000,
        needsCompaction: false,
      },
    },
    {
      id: "context-zero-never-compacts",
      actual: bridge.decide({
        cfg: {},
        model: { limit: { context: 0, output: 16_000 } },
        tokens: tokens({ total: 100_000 }),
      }),
      expected: {
        auto: true,
        contextLimit: 0,
        usableTokens: 0,
        tokenCount: 100_000,
        needsCompaction: false,
      },
    },
    {
      id: "reserved-config-uses-input-limit",
      actual: bridge.decide({
        cfg: { compaction: { reserved: 12_000 } },
        model: baseModel,
        tokens: tokens({ total: 38_000 }),
      }),
      expected: {
        auto: true,
        contextLimit: 100_000,
        usableTokens: 38_000,
        tokenCount: 38_000,
        needsCompaction: true,
      },
    },
    {
      id: "context-limit-reserves-output-max",
      actual: bridge.decide({
        cfg: {},
        model: { limit: { context: 100_000, output: 50_000 } },
        tokens: tokens({ total: 67_999 }),
      }),
      expected: {
        auto: true,
        contextLimit: 100_000,
        usableTokens: 68_000,
        tokenCount: 67_999,
        needsCompaction: false,
      },
    },
    {
      id: "default-buffer-caps-reservation",
      actual: bridge.decide({
        cfg: {},
        model: { limit: { context: 100_000, input: 80_000, output: 64_000 } },
        tokens: tokens({ total: 60_000 }),
      }),
      expected: {
        auto: true,
        contextLimit: 100_000,
        usableTokens: 60_000,
        tokenCount: 60_000,
        needsCompaction: true,
      },
    },
    {
      id: "output-token-max-override",
      actual: bridge.decide({
        cfg: {},
        model: { limit: { context: 100_000, output: 64_000 } },
        outputTokenMax: 10_000,
        tokens: tokens({ total: 90_000 }),
      }),
      expected: {
        auto: true,
        contextLimit: 100_000,
        usableTokens: 90_000,
        tokenCount: 90_000,
        needsCompaction: true,
      },
    },
    {
      id: "zero-total-falls-back-to-component-count",
      actual: bridge.decide({
        cfg: { compaction: { reserved: 10_000 } },
        model: { limit: { context: 100_000, input: 50_000, output: 16_000 } },
        tokens: tokens({ total: 0, input: 20_000, output: 10_000, cacheRead: 5_000, cacheWrite: 5_000 }),
      }),
      expected: {
        auto: true,
        contextLimit: 100_000,
        usableTokens: 40_000,
        tokenCount: 40_000,
        needsCompaction: true,
      },
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.compaction-policy" as const,
    portID: "turn.compaction-policy" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-compaction-policy-native-exact-fixture" as const,
    replayRef: "turn-compaction-policy-native-exact:opencode" as const,
    fixtureID: "opencode-turn-compaction-policy:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/overflow.ts#COMPACTION_BUFFER,usable,isOverflow",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/transform.ts#OUTPUT_TOKEN_MAX,maxOutputTokens",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/processor.ts#step-finish,isOverflow,needsCompaction",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnCompactionPolicyNativeExactFixture(
  fixture: OpenCodeTurnCompactionPolicyNativeExactFixture,
): OpenCodeTurnCompactionPolicyNativeExactFixtureVerification {
  const issues: OpenCodeTurnCompactionPolicyNativeExactFixtureIssue[] = []
  if (fixture.atomID !== "opencode.turn.compaction-policy" || fixture.portID !== "turn.compaction-policy" || fixture.fixtureID !== "opencode-turn-compaction-policy:native-exact-fixture") {
    issues.push({ id: "opencode-turn-compaction-policy-native-exact.identity", message: "OpenCode turn compaction-policy fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-turn-compaction-policy-native-exact.native-claim", message: "OpenCode turn compaction-policy fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-turn-compaction-policy-native-exact.lossiness", message: "OpenCode turn compaction-policy native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/overflow.ts", "provider/transform.ts", "session/processor.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-turn-compaction-policy-native-exact.source", message: `OpenCode turn compaction-policy fixture lost pinned ${source} source.` })
    }
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-turn-compaction-policy-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned OpenCode compaction policy behavior.` })
    }
  }
  const zeroTotal = fixture.cases.find((item) => item.id === "zero-total-falls-back-to-component-count")
  if (!zeroTotal || !sameJSON(zeroTotal.actual, zeroTotal.expected)) {
    issues.push({ id: "opencode-turn-compaction-policy-native-exact.zero-total", message: "OpenCode compaction must preserve token.total || component-count fallback semantics." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-compaction-policy-native-exact.fingerprint", message: "OpenCode turn compaction-policy fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function tokens(input: { total?: number; input?: number; output?: number; cacheRead?: number; cacheWrite?: number }): OpenCodeTurnCompactionPolicyTokens {
  return {
    ...(input.total === undefined ? {} : { total: input.total }),
    input: input.input ?? 0,
    output: input.output ?? 0,
    cache: {
      read: input.cacheRead ?? 0,
      write: input.cacheWrite ?? 0,
    },
  }
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
