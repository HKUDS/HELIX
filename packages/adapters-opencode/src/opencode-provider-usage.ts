import { createHash } from "node:crypto"
import type { LegoModel, TokenUsage } from "@helix/contracts"

export interface OpenCodeProviderUsage {
  inputTokens?: number
  outputTokens?: number
  reasoningTokens?: number
  totalTokens?: number
  cacheReadInputTokens?: number
  cacheWriteInputTokens?: number
}

export type OpenCodeProviderMetadata = Record<string, unknown>

export interface OpenCodeProviderCostRates {
  input?: number
  output?: number
  cache?: {
    read?: number
    write?: number
  }
}

export interface OpenCodeProviderCostTier extends OpenCodeProviderCostRates {
  tier: {
    type: string
    size: number
  }
}

export interface OpenCodeProviderCostInfo extends OpenCodeProviderCostRates {
  tiers?: OpenCodeProviderCostTier[]
  experimentalOver200K?: OpenCodeProviderCostInfo
}

export interface OpenCodeProviderUsageModel {
  cost?: OpenCodeProviderCostInfo
}

export interface OpenCodeProviderUsageResult {
  cost: number
  tokens: {
    total?: number
    input: number
    output: number
    reasoning: number
    cache: {
      write: number
      read: number
    }
  }
}

export interface OpenCodeProviderUsageNormalizerInput {
  usage?: TokenUsage
  cost?: number
  model?: LegoModel
  finish?: string
  metadata?: OpenCodeProviderMetadata
}

export interface OpenCodeProviderUsageNormalizerResult {
  usage?: TokenUsage
  cost?: number
  finish?: string
}

export interface OpenCodeProviderUsageNormalizerPort {
  normalize(input: OpenCodeProviderUsageNormalizerInput): OpenCodeProviderUsageNormalizerResult
}

export interface OpenCodeProviderUsageNativeExactFixtureCase {
  id: "cache-adjustment" | "metadata-cache-write-fallback" | "over-200k-cost-tier" | "negative-token-safety"
  input: {
    usage: OpenCodeProviderUsage
    model: OpenCodeProviderUsageModel
    metadata?: OpenCodeProviderMetadata
  }
  expected: OpenCodeProviderUsageResult
  portInput?: OpenCodeProviderUsageNormalizerInput
  expectedPortResult?: OpenCodeProviderUsageNormalizerResult
}

export interface OpenCodeProviderUsageNativeExactFixture {
  schemaVersion: 1
  fixtureID: "opencode-provider-usage:native-exact-fixture"
  evidenceRef: "conformance:opencode-provider-usage-native-exact-fixture"
  replayRef: "provider-usage-native-exact:opencode"
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  exactDiffStatus: "pinned-upstream-source-exact"
  nativeParityClaim: true
  sourceRefs: Array<{
    path: "packages/opencode/src/session/session.ts"
    symbols: ["getUsage"]
    upstreamBehavior: string[]
  }>
  cases: OpenCodeProviderUsageNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderUsageNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderUsageNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderUsageNativeExactFixtureIssue[]
}

export function createOpenCodeProviderUsageNormalizer(): OpenCodeProviderUsageNormalizerPort {
  return {
    normalize(input) {
      const result = input.usage
        ? openCodeProviderGetUsage({
          model: openCodeProviderUsageModelFromLego(input.model),
          usage: openCodeProviderUsageFromTokenUsage(input.usage),
          ...openCodeProviderOptionalMetadata(input.metadata ?? openCodeProviderUsageMetadataFromLego(input.model)),
        })
        : undefined
      const cost = input.cost ?? result?.cost
      return {
        ...(result ? { usage: openCodeProviderTokenUsageFromResult(result) } : {}),
        ...(cost === undefined ? {} : { cost }),
        ...(input.finish ? { finish: input.finish } : {}),
      }
    },
  }
}

export function openCodeProviderGetUsage(input: {
  model?: OpenCodeProviderUsageModel
  usage: OpenCodeProviderUsage
  metadata?: OpenCodeProviderMetadata
}): OpenCodeProviderUsageResult {
  const inputTokens = openCodeProviderSafe(input.usage.inputTokens ?? 0)
  const outputTokens = openCodeProviderSafe(input.usage.outputTokens ?? 0)
  const reasoningTokens = openCodeProviderSafe(input.usage.reasoningTokens ?? 0)
  const cacheReadInputTokens = openCodeProviderSafe(input.usage.cacheReadInputTokens ?? 0)
  const cacheWriteInputTokens = openCodeProviderSafe(
    Number(
      input.usage.cacheWriteInputTokens
        ?? openCodeProviderMetadataPath(input.metadata, ["anthropic", "cacheCreationInputTokens"])
        ?? openCodeProviderMetadataPath(input.metadata, ["vertex", "cacheCreationInputTokens"])
        ?? openCodeProviderMetadataPath(input.metadata, ["bedrock", "usage", "cacheWriteInputTokens"])
        ?? openCodeProviderMetadataPath(input.metadata, ["venice", "usage", "cacheCreationInputTokens"])
        ?? 0,
    ),
  )
  const adjustedInputTokens = openCodeProviderSafe(inputTokens - cacheReadInputTokens - cacheWriteInputTokens)
  const total = input.usage.totalTokens
  const tokens: OpenCodeProviderUsageResult["tokens"] = {
    ...(total === undefined ? {} : { total }),
    input: adjustedInputTokens,
    output: openCodeProviderSafe(outputTokens - reasoningTokens),
    reasoning: reasoningTokens,
    cache: {
      write: cacheWriteInputTokens,
      read: cacheReadInputTokens,
    },
  }
  const costInfo = openCodeProviderCostInfoForContext(input.model?.cost, inputTokens)
  return {
    cost: openCodeProviderSafe(
      (tokens.input * (costInfo?.input ?? 0)
        + tokens.output * (costInfo?.output ?? 0)
        + tokens.cache.read * (costInfo?.cache?.read ?? 0)
        + tokens.cache.write * (costInfo?.cache?.write ?? 0)
        + tokens.reasoning * (costInfo?.output ?? 0)) / 1_000_000,
    ),
    tokens,
  }
}

export function captureOpenCodeProviderUsageNativeExactFixture(): OpenCodeProviderUsageNativeExactFixture {
  const cases: OpenCodeProviderUsageNativeExactFixtureCase[] = [
    {
      id: "cache-adjustment",
      input: {
        usage: {
          inputTokens: 1000,
          outputTokens: 500,
          reasoningTokens: 50,
          totalTokens: 1500,
          cacheReadInputTokens: 100,
          cacheWriteInputTokens: 20,
        },
        model: { cost: { input: 2, output: 4, cache: { read: 0.5, write: 1 } } },
      },
      expected: {
        cost: 0.00383,
        tokens: {
          total: 1500,
          input: 880,
          output: 450,
          reasoning: 50,
          cache: { read: 100, write: 20 },
        },
      },
      portInput: {
        finish: "stop",
        usage: { input: 1000, output: 500, reasoning: 50, cacheRead: 100, cacheWrite: 20 },
        model: { providerID: "opencode", modelID: "priced", cost: { input: 2, output: 4, cacheRead: 0.5, cacheWrite: 1 } },
      },
      expectedPortResult: {
        finish: "stop",
        usage: { input: 880, output: 450, reasoning: 50, cacheRead: 100, cacheWrite: 20 },
        cost: 0.00383,
      },
    },
    {
      id: "metadata-cache-write-fallback",
      input: {
        usage: {
          inputTokens: 100,
          outputTokens: 20,
          reasoningTokens: 5,
          cacheReadInputTokens: 10,
        },
        metadata: { anthropic: { cacheCreationInputTokens: 30 } },
        model: { cost: { input: 1, output: 2, cache: { read: 0.1, write: 0.2 } } },
      },
      expected: {
        cost: 0.000107,
        tokens: {
          input: 60,
          output: 15,
          reasoning: 5,
          cache: { read: 10, write: 30 },
        },
      },
      portInput: {
        finish: "tool_calls",
        usage: { input: 100, output: 20, reasoning: 5, cacheRead: 10 },
        metadata: { anthropic: { cacheCreationInputTokens: 30 } },
        model: { providerID: "opencode", modelID: "anthropic", cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 0.2 } },
      },
      expectedPortResult: {
        finish: "tool_calls",
        usage: { input: 60, output: 15, reasoning: 5, cacheRead: 10, cacheWrite: 30 },
        cost: 0.000107,
      },
    },
    {
      id: "over-200k-cost-tier",
      input: {
        usage: {
          inputTokens: 250000,
          outputTokens: 1000,
          reasoningTokens: 100,
        },
        model: {
          cost: {
            input: 1,
            output: 1,
            experimentalOver200K: { input: 10, output: 20, cache: { read: 1, write: 2 } },
          },
        },
      },
      expected: {
        cost: 2.52,
        tokens: {
          input: 250000,
          output: 900,
          reasoning: 100,
          cache: { read: 0, write: 0 },
        },
      },
      portInput: {
        usage: { input: 250000, output: 1000, reasoning: 100 },
        model: {
          providerID: "opencode",
          modelID: "large-context",
          metadata: {
            opencodeCost: {
              input: 1,
              output: 1,
              experimentalOver200K: { input: 10, output: 20, cache: { read: 1, write: 2 } },
            },
          },
        },
      },
      expectedPortResult: {
        usage: { input: 250000, output: 900, reasoning: 100, cacheRead: 0, cacheWrite: 0 },
        cost: 2.52,
      },
    },
    {
      id: "negative-token-safety",
      input: {
        usage: {
          inputTokens: -4,
          outputTokens: -8,
          reasoningTokens: -1,
          cacheReadInputTokens: -2,
          cacheWriteInputTokens: -3,
        },
        model: { cost: { input: 3, output: 5, cache: { read: 7, write: 11 } } },
      },
      expected: {
        cost: 0,
        tokens: {
          input: 0,
          output: 0,
          reasoning: 0,
          cache: { read: 0, write: 0 },
        },
      },
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-provider-usage:native-exact-fixture" as const,
    evidenceRef: "conformance:opencode-provider-usage-native-exact-fixture" as const,
    replayRef: "provider-usage-native-exact:opencode" as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    exactDiffStatus: "pinned-upstream-source-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      {
        path: "packages/opencode/src/session/session.ts" as const,
        symbols: ["getUsage"] as ["getUsage"],
        upstreamBehavior: [
          "safe finite non-negative token coercion",
          "cache read/write subtraction from input tokens",
          "metadata fallback for provider cache creation tokens",
          "context tier and experimentalOver200K cost selection",
          "reasoning tokens charged at output rate",
        ],
      },
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderUsageFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderUsageNativeExactFixture(
  fixture: OpenCodeProviderUsageNativeExactFixture,
): OpenCodeProviderUsageNativeExactFixtureVerification {
  const issues: OpenCodeProviderUsageNativeExactFixtureIssue[] = []
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "pinned-upstream-source-exact") {
    issues.push({ id: "opencode-provider-usage.native-claim", message: "OpenCode provider usage fixture must retain exact native parity status." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-provider-usage.lossiness", message: "OpenCode provider usage native fixture cannot carry known lossiness markers." })
  }
  if (!fixture.sourceRefs.some((sourceRef) => sourceRef.path === "packages/opencode/src/session/session.ts" && sourceRef.symbols.includes("getUsage"))) {
    issues.push({ id: "opencode-provider-usage.source-ref", message: "OpenCode provider usage fixture must anchor upstream session getUsage." })
  }
  for (const item of fixture.cases) {
    const actual = openCodeProviderGetUsage(item.input)
    if (!openCodeProviderUsageSameJSON(actual, item.expected)) {
      issues.push({
        id: "opencode-provider-usage.case-result",
        caseID: item.id,
        message: `${item.id} no longer matches the pinned OpenCode getUsage fixture output.`,
      })
    }
    if (item.portInput && item.expectedPortResult) {
      const actualPortResult = createOpenCodeProviderUsageNormalizer().normalize(item.portInput)
      if (!openCodeProviderUsageSameJSON(actualPortResult, item.expectedPortResult)) {
        issues.push({
          id: "opencode-provider-usage.port-result",
          caseID: item.id,
          message: `${item.id} no longer maps through the OpenCode provider usage port adapter.`,
        })
      }
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderUsageFingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-provider-usage.fingerprint", message: "OpenCode provider usage native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function openCodeProviderUsageFromTokenUsage(usage: TokenUsage): OpenCodeProviderUsage {
  return {
    inputTokens: usage.input,
    outputTokens: usage.output,
    ...(usage.reasoning === undefined ? {} : { reasoningTokens: usage.reasoning }),
    ...(usage.cacheRead === undefined ? {} : { cacheReadInputTokens: usage.cacheRead }),
    ...(usage.cacheWrite === undefined ? {} : { cacheWriteInputTokens: usage.cacheWrite }),
  }
}

function openCodeProviderTokenUsageFromResult(result: OpenCodeProviderUsageResult): TokenUsage {
  return {
    input: result.tokens.input,
    output: result.tokens.output,
    reasoning: result.tokens.reasoning,
    cacheRead: result.tokens.cache.read,
    cacheWrite: result.tokens.cache.write,
  }
}

function openCodeProviderUsageModelFromLego(model: LegoModel | undefined): OpenCodeProviderUsageModel {
  const metadata = openCodeProviderRecord(model?.metadata)
  const metadataCost = openCodeProviderCostInfoFromUnknown(metadata?.["opencodeCost"] ?? metadata?.["cost"])
  const cost = metadataCost ?? openCodeProviderCostInfoFromLego(model)
  return {
    ...(cost ? { cost } : {}),
  }
}

function openCodeProviderUsageMetadataFromLego(model: LegoModel | undefined): OpenCodeProviderMetadata | undefined {
  return openCodeProviderRecord(model?.metadata?.["opencodeUsageMetadata"])
}

function openCodeProviderOptionalMetadata(metadata: OpenCodeProviderMetadata | undefined): { metadata?: OpenCodeProviderMetadata } {
  return metadata ? { metadata } : {}
}

function openCodeProviderCostInfoFromLego(model: LegoModel | undefined): OpenCodeProviderCostInfo | undefined {
  if (!model?.cost) return undefined
  return {
    input: model.cost.input,
    output: model.cost.output,
    ...((model.cost.cacheRead === undefined && model.cost.cacheWrite === undefined)
      ? {}
      : { cache: { ...(model.cost.cacheRead === undefined ? {} : { read: model.cost.cacheRead }), ...(model.cost.cacheWrite === undefined ? {} : { write: model.cost.cacheWrite }) } }),
  }
}

function openCodeProviderCostInfoForContext(cost: OpenCodeProviderCostInfo | undefined, contextTokens: number): OpenCodeProviderCostInfo | undefined {
  const tier = cost?.tiers
    ?.filter((item) => item.tier.type === "context" && contextTokens > item.tier.size)
    .sort((left, right) => right.tier.size - left.tier.size)[0]
  return tier ?? (cost?.experimentalOver200K && contextTokens > 200_000 ? cost.experimentalOver200K : cost)
}

function openCodeProviderCostInfoFromUnknown(value: unknown): OpenCodeProviderCostInfo | undefined {
  const record = openCodeProviderRecord(value)
  if (!record) return undefined
  const input = openCodeProviderNumber(record["input"])
  const output = openCodeProviderNumber(record["output"])
  const cache = openCodeProviderCostCacheFromUnknown(record["cache"], record)
  const tiers = Array.isArray(record["tiers"])
    ? record["tiers"].map(openCodeProviderCostTierFromUnknown).filter((item): item is OpenCodeProviderCostTier => item !== undefined)
    : undefined
  const experimentalOver200K = openCodeProviderCostInfoFromUnknown(record["experimentalOver200K"])
  if (input === undefined && output === undefined && !cache && (!tiers || tiers.length === 0) && !experimentalOver200K) return undefined
  return {
    ...(input === undefined ? {} : { input }),
    ...(output === undefined ? {} : { output }),
    ...(cache ? { cache } : {}),
    ...(tiers && tiers.length > 0 ? { tiers } : {}),
    ...(experimentalOver200K ? { experimentalOver200K } : {}),
  }
}

function openCodeProviderCostTierFromUnknown(value: unknown): OpenCodeProviderCostTier | undefined {
  const record = openCodeProviderRecord(value)
  const tier = openCodeProviderRecord(record?.["tier"])
  const type = typeof tier?.["type"] === "string" ? tier["type"] : undefined
  const size = openCodeProviderNumber(tier?.["size"])
  if (!type || size === undefined) return undefined
  const cost = openCodeProviderCostInfoFromUnknown(record)
  return {
    ...(cost ?? {}),
    tier: { type, size },
  }
}

function openCodeProviderCostCacheFromUnknown(value: unknown, fallback?: Record<string, unknown>): OpenCodeProviderCostInfo["cache"] | undefined {
  const record = openCodeProviderRecord(value)
  const read = openCodeProviderNumber(record?.["read"] ?? fallback?.["cacheRead"])
  const write = openCodeProviderNumber(record?.["write"] ?? fallback?.["cacheWrite"])
  if (read === undefined && write === undefined) return undefined
  return {
    ...(read === undefined ? {} : { read }),
    ...(write === undefined ? {} : { write }),
  }
}

function openCodeProviderMetadataPath(metadata: OpenCodeProviderMetadata | undefined, path: string[]): unknown {
  let value: unknown = metadata
  for (const segment of path) {
    const record = openCodeProviderRecord(value)
    if (!record) return undefined
    value = record[segment]
  }
  return value
}

function openCodeProviderRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function openCodeProviderNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function openCodeProviderSafe(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

function openCodeProviderUsageSameJSON(left: unknown, right: unknown): boolean {
  return openCodeProviderUsageStableJSON(left) === openCodeProviderUsageStableJSON(right)
}

function openCodeProviderUsageFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeProviderUsageStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeProviderUsageStableJSON(value: unknown): string {
  return JSON.stringify(openCodeProviderUsageSortStable(value))
}

function openCodeProviderUsageSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeProviderUsageSortStable)
  const record = openCodeProviderRecord(value)
  if (!record) return value
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, openCodeProviderUsageSortStable(entry)]))
}
