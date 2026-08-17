import { createHash } from "node:crypto"

export const OPENCODE_TURN_RETRY_GO_UPSELL_MESSAGE = "Free usage exceeded, subscribe to Go"
export const OPENCODE_TURN_RETRY_GO_UPSELL_URL = "https://opencode.ai/go"
export const OPENCODE_TURN_RETRY_INITIAL_DELAY = 2000
export const OPENCODE_TURN_RETRY_BACKOFF_FACTOR = 2
export const OPENCODE_TURN_RETRY_MAX_DELAY_NO_HEADERS = 30_000
export const OPENCODE_TURN_RETRY_MAX_DELAY = 2_147_483_647

export type OpenCodeTurnRetryReason = "free_tier_limit" | "account_rate_limit" | (string & {})

export interface OpenCodeTurnRetryAction {
  reason: OpenCodeTurnRetryReason
  provider: string
  title: string
  message: string
  label: string
  link?: string
}

export interface OpenCodeTurnRetryable {
  message: string
  action?: OpenCodeTurnRetryAction
}

export interface OpenCodeTurnRetryAPIErrorData {
  message: string
  statusCode?: number
  isRetryable: boolean
  responseHeaders?: Record<string, string>
  responseBody?: string
}

export interface OpenCodeTurnRetryError {
  name: string
  data?: unknown
}

export interface OpenCodeTurnRetryDecision {
  retryable?: OpenCodeTurnRetryable
  delayMs?: number
  nextAttemptAt?: number
}

export interface OpenCodeTurnRetryPolicyBridge {
  delay(attempt: number, error?: OpenCodeTurnRetryError, now?: number): number
  retryable(error: OpenCodeTurnRetryError, provider: string): OpenCodeTurnRetryable | undefined
  decision(input: { attempt: number; error: OpenCodeTurnRetryError; provider: string; now: number }): OpenCodeTurnRetryDecision
}

export interface OpenCodeTurnRetryPolicyNativeExactFixtureCase {
  id:
    | "retry-after-ms-header"
    | "retry-after-seconds-header"
    | "retry-after-date-header"
    | "invalid-header-backoff"
    | "no-header-backoff-cap"
    | "context-overflow-not-retryable"
    | "non-retryable-four-hundred"
    | "server-error-retryable-even-with-sdk-flag-false"
    | "free-tier-limit-action"
    | "go-usage-limit-action"
    | "plain-text-rate-limit"
    | "json-rate-limit-patterns"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTurnRetryPolicyNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.retry-policy"
  portID: "turn.retry-policy"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-retry-policy-native-exact-fixture"
  replayRef: "turn-retry-policy-native-exact:opencode"
  fixtureID: "opencode-turn-retry-policy:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnRetryPolicyNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnRetryPolicyNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnRetryPolicyNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnRetryPolicyNativeExactFixtureIssue[]
}

export function createOpenCodeTurnRetryPolicyBridge(): OpenCodeTurnRetryPolicyBridge {
  return {
    delay: openCodeTurnRetryDelay,
    retryable: openCodeTurnRetryable,
    decision(input) {
      const retryable = openCodeTurnRetryable(input.error, input.provider)
      if (!retryable) return {}
      const delayMs = openCodeTurnRetryDelay(input.attempt, input.error, input.now)
      return {
        retryable,
        delayMs,
        nextAttemptAt: input.now + delayMs,
      }
    },
  }
}

export function openCodeTurnRetryDelay(attempt: number, error?: OpenCodeTurnRetryError, now = Date.now()): number {
  const apiError = openCodeTurnRetryAPIErrorData(error)
  if (apiError) {
    const headers = apiError.responseHeaders
    if (headers) {
      const retryAfterMs = headers["retry-after-ms"]
      if (retryAfterMs) {
        const parsedMs = Number.parseFloat(retryAfterMs)
        if (!Number.isNaN(parsedMs)) return openCodeTurnRetryCap(parsedMs)
      }

      const retryAfter = headers["retry-after"]
      if (retryAfter) {
        const parsedSeconds = Number.parseFloat(retryAfter)
        if (!Number.isNaN(parsedSeconds)) return openCodeTurnRetryCap(Math.ceil(parsedSeconds * 1000))
        const parsed = Date.parse(retryAfter) - now
        if (!Number.isNaN(parsed) && parsed > 0) return openCodeTurnRetryCap(Math.ceil(parsed))
      }

      return openCodeTurnRetryCap(OPENCODE_TURN_RETRY_INITIAL_DELAY * Math.pow(OPENCODE_TURN_RETRY_BACKOFF_FACTOR, attempt - 1))
    }
  }

  return openCodeTurnRetryCap(
    Math.min(
      OPENCODE_TURN_RETRY_INITIAL_DELAY * Math.pow(OPENCODE_TURN_RETRY_BACKOFF_FACTOR, attempt - 1),
      OPENCODE_TURN_RETRY_MAX_DELAY_NO_HEADERS,
    ),
  )
}

export function openCodeTurnRetryable(error: OpenCodeTurnRetryError, provider: string): OpenCodeTurnRetryable | undefined {
  if (openCodeTurnRetryIsContextOverflowError(error)) return undefined
  const apiError = openCodeTurnRetryAPIErrorData(error)
  if (apiError) {
    const status = apiError.statusCode
    if (!apiError.isRetryable && !(status !== undefined && status >= 500)) return undefined
    if (apiError.responseBody?.includes("FreeUsageLimitError")) {
      return {
        message: OPENCODE_TURN_RETRY_GO_UPSELL_MESSAGE,
        action: {
          reason: "free_tier_limit",
          provider,
          title: "Free limit reached",
          message: "Subscribe to OpenCode Go for reliable access to the best open-source models, starting at $5/month.",
          label: "subscribe",
          link: OPENCODE_TURN_RETRY_GO_UPSELL_URL,
        },
      }
    }
    if (apiError.responseBody?.includes("GoUsageLimitError")) {
      const body = parseJSON(apiError.responseBody)
      const workspace = str(record(body)?.metadata && record(record(body)?.metadata)?.workspace)
      const limitName = str(record(body)?.metadata && record(record(body)?.metadata)?.limitName)
      const retryAfter = num(apiError.responseHeaders?.["retry-after"])
      const resetIn = resetInText(retryAfter)
      const message = `${limitName ? `${limitName} usage limit` : "Usage limit"} reached. It will reset in ${resetIn}. To continue using this model now, enable usage from your available balance`
      const link = `https://opencode.ai/workspace/${workspace}/go`
      return {
        message: `${message} - ${link}`,
        action: {
          reason: "account_rate_limit",
          provider,
          title: "Go limit reached",
          message,
          label: "open settings",
          link,
        },
      }
    }
    return { message: apiError.message.includes("Overloaded") ? "Provider is overloaded" : apiError.message }
  }

  const msg = isRecord(error.data) ? error.data.message : undefined
  if (typeof msg === "string") {
    const lower = msg.toLowerCase()
    if (lower.includes("rate increased too quickly") || lower.includes("rate limit") || lower.includes("too many requests")) {
      return { message: msg }
    }
  }

  const json = parseJSON(msg)
  if (!isRecord(json)) return undefined
  const code = typeof json.code === "string" ? json.code : ""
  if (json.type === "error" && isRecord(json.error) && json.error.type === "too_many_requests") return { message: "Too Many Requests" }
  if (code.includes("exhausted") || code.includes("unavailable")) return { message: "Provider is overloaded" }
  if (json.type === "error" && isRecord(json.error) && typeof json.error.code === "string" && json.error.code.includes("rate_limit")) {
    return { message: "Rate Limited" }
  }
  return undefined
}

export function openCodeTurnRetryAPIError(data: OpenCodeTurnRetryAPIErrorData): OpenCodeTurnRetryError {
  return { name: "APIError", data }
}

export function openCodeTurnRetryContextOverflowError(message = "context overflow"): OpenCodeTurnRetryError {
  return { name: "ContextOverflowError", data: { message } }
}

export async function captureOpenCodeTurnRetryPolicyNativeExactFixture(): Promise<OpenCodeTurnRetryPolicyNativeExactFixture> {
  const bridge = createOpenCodeTurnRetryPolicyBridge()
  const now = Date.parse("2026-06-13T00:00:00.000Z")
  const goBody = JSON.stringify({
    type: "GoUsageLimitError",
    metadata: { workspace: "workspace_123", limitName: "Claude" },
  })
  const cases: OpenCodeTurnRetryPolicyNativeExactFixtureCase[] = [
    {
      id: "retry-after-ms-header",
      actual: bridge.delay(3, openCodeTurnRetryAPIError({ message: "retry", isRetryable: true, responseHeaders: { "retry-after-ms": "125.4" } }), now),
      expected: 125.4,
    },
    {
      id: "retry-after-seconds-header",
      actual: bridge.delay(2, openCodeTurnRetryAPIError({ message: "retry", isRetryable: true, responseHeaders: { "retry-after": "2.25" } }), now),
      expected: 2250,
    },
    {
      id: "retry-after-date-header",
      actual: bridge.delay(2, openCodeTurnRetryAPIError({ message: "retry", isRetryable: true, responseHeaders: { "retry-after": "Sat, 13 Jun 2026 00:00:03 GMT" } }), now),
      expected: 3000,
    },
    {
      id: "invalid-header-backoff",
      actual: bridge.delay(4, openCodeTurnRetryAPIError({ message: "retry", isRetryable: true, responseHeaders: { "retry-after": "later" } }), now),
      expected: 16_000,
    },
    {
      id: "no-header-backoff-cap",
      actual: bridge.delay(10, openCodeTurnRetryAPIError({ message: "retry", isRetryable: true }), now),
      expected: 30_000,
    },
    {
      id: "context-overflow-not-retryable",
      actual: bridge.decision({ attempt: 1, error: openCodeTurnRetryContextOverflowError(), provider: "opencode", now }),
      expected: {},
    },
    {
      id: "non-retryable-four-hundred",
      actual: bridge.decision({ attempt: 1, error: openCodeTurnRetryAPIError({ message: "bad request", statusCode: 400, isRetryable: false }), provider: "opencode", now }),
      expected: {},
    },
    {
      id: "server-error-retryable-even-with-sdk-flag-false",
      actual: bridge.decision({ attempt: 2, error: openCodeTurnRetryAPIError({ message: "Overloaded upstream", statusCode: 503, isRetryable: false }), provider: "anthropic", now }),
      expected: {
        retryable: { message: "Provider is overloaded" },
        delayMs: 4000,
        nextAttemptAt: now + 4000,
      },
    },
    {
      id: "free-tier-limit-action",
      actual: bridge.retryable(openCodeTurnRetryAPIError({ message: "limit", statusCode: 429, isRetryable: true, responseBody: "FreeUsageLimitError" }), "opencode"),
      expected: {
        message: OPENCODE_TURN_RETRY_GO_UPSELL_MESSAGE,
        action: {
          reason: "free_tier_limit",
          provider: "opencode",
          title: "Free limit reached",
          message: "Subscribe to OpenCode Go for reliable access to the best open-source models, starting at $5/month.",
          label: "subscribe",
          link: OPENCODE_TURN_RETRY_GO_UPSELL_URL,
        },
      },
    },
    {
      id: "go-usage-limit-action",
      actual: bridge.retryable(openCodeTurnRetryAPIError({ message: "limit", statusCode: 429, isRetryable: true, responseBody: goBody, responseHeaders: { "retry-after": "93660" } }), "opencode"),
      expected: {
        message: "Claude usage limit reached. It will reset in 1 day 2 hours. To continue using this model now, enable usage from your available balance - https://opencode.ai/workspace/workspace_123/go",
        action: {
          reason: "account_rate_limit",
          provider: "opencode",
          title: "Go limit reached",
          message: "Claude usage limit reached. It will reset in 1 day 2 hours. To continue using this model now, enable usage from your available balance",
          label: "open settings",
          link: "https://opencode.ai/workspace/workspace_123/go",
        },
      },
    },
    {
      id: "plain-text-rate-limit",
      actual: bridge.retryable({ name: "ProviderError", data: { message: "rate limit reached" } }, "openrouter"),
      expected: { message: "rate limit reached" },
    },
    {
      id: "json-rate-limit-patterns",
      actual: [
        bridge.retryable({ name: "ProviderError", data: { message: JSON.stringify({ type: "error", error: { type: "too_many_requests" } }) } }, "x"),
        bridge.retryable({ name: "ProviderError", data: { message: JSON.stringify({ code: "quota_exhausted" }) } }, "x"),
        bridge.retryable({ name: "ProviderError", data: { message: JSON.stringify({ type: "error", error: { code: "rate_limit_exceeded" } }) } }, "x"),
      ],
      expected: [{ message: "Too Many Requests" }, { message: "Provider is overloaded" }, { message: "Rate Limited" }],
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.retry-policy" as const,
    portID: "turn.retry-policy" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-retry-policy-native-exact-fixture" as const,
    replayRef: "turn-retry-policy-native-exact:opencode" as const,
    fixtureID: "opencode-turn-retry-policy:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/retry.ts#delay,retryable,policy",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#APIError,ContextOverflowError",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnRetryPolicyNativeExactFixture(
  fixture: OpenCodeTurnRetryPolicyNativeExactFixture,
): OpenCodeTurnRetryPolicyNativeExactFixtureVerification {
  const issues: OpenCodeTurnRetryPolicyNativeExactFixtureIssue[] = []
  if (
    fixture.atomID !== "opencode.turn.retry-policy" ||
    fixture.portID !== "turn.retry-policy" ||
    fixture.fixtureID !== "opencode-turn-retry-policy:native-exact-fixture"
  ) {
    issues.push({ id: "opencode-turn-retry-policy-native-exact.identity", message: "OpenCode turn retry policy fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-turn-retry-policy-native-exact.native-claim", message: "OpenCode turn retry policy must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-turn-retry-policy-native-exact.lossiness", message: "OpenCode turn retry policy native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/retry.ts", "session/message-v2.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-turn-retry-policy-native-exact.source", message: `OpenCode turn retry policy fixture lost upstream source ${source}.` })
    }
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-turn-retry-policy-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned retry policy behavior.` })
    }
  }
  const freeTier = fixture.cases.find((item) => item.id === "free-tier-limit-action")
  if (!freeTier || !sameJSON((freeTier.actual as OpenCodeTurnRetryable | undefined)?.action?.reason, "free_tier_limit")) {
    issues.push({ id: "opencode-turn-retry-policy-native-exact.free-tier-action", message: "FreeUsageLimitError must produce the OpenCode Go upsell action." })
  }
  const context = fixture.cases.find((item) => item.id === "context-overflow-not-retryable")
  if (!context || !sameJSON(context.actual, {})) {
    issues.push({ id: "opencode-turn-retry-policy-native-exact.context-overflow", message: "Context overflow errors must not be retried." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-retry-policy-native-exact.fingerprint", message: "OpenCode turn retry policy native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function openCodeTurnRetryCap(ms: number): number {
  return Math.min(ms, OPENCODE_TURN_RETRY_MAX_DELAY)
}

function openCodeTurnRetryAPIErrorData(error: OpenCodeTurnRetryError | undefined): OpenCodeTurnRetryAPIErrorData | undefined {
  if (!error || error.name !== "APIError" || !isRecord(error.data)) return undefined
  const data = error.data
  return typeof data.message === "string" && typeof data.isRetryable === "boolean"
    ? {
      message: data.message,
      isRetryable: data.isRetryable,
      ...(typeof data.statusCode === "number" ? { statusCode: data.statusCode } : {}),
      ...(isStringRecord(data.responseHeaders) ? { responseHeaders: data.responseHeaders } : {}),
      ...(typeof data.responseBody === "string" ? { responseBody: data.responseBody } : {}),
    }
    : undefined
}

function openCodeTurnRetryIsContextOverflowError(error: OpenCodeTurnRetryError): boolean {
  return error.name === "ContextOverflowError"
}

function resetInText(retryAfter: number | undefined): string {
  if (retryAfter === undefined) return ""
  const seconds = Math.max(0, Math.ceil(retryAfter))
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.ceil((seconds % 3_600) / 60)
  const unit = (value: number, name: string) => `${value} ${name}${value === 1 ? "" : "s"}`
  if (days > 0) return hours > 0 ? `${unit(days, "day")} ${unit(hours, "hour")}` : unit(days, "day")
  if (hours > 0) return minutes > 0 ? `${unit(hours, "hour")} ${unit(minutes, "minute")}` : unit(hours, "hour")
  return minutes > 0 ? unit(minutes, "minute") : "less than a minute"
}

function str(value: unknown): string {
  if (value === undefined || value === null) return ""
  return String(value)
}

function num(value: unknown): number | undefined {
  const parsed = Number.parseFloat(str(value))
  return Number.isNaN(parsed) ? undefined : parsed
}

function parseJSON(value: unknown): unknown {
  try {
    if (typeof value !== "string") return undefined
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object"
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string")
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
