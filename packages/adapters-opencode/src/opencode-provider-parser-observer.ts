import { createHash } from "node:crypto"
import { STATUS_CODES } from "node:http"

export interface OpenCodeProviderParserAPICallErrorLike {
  message: string
  statusCode?: number
  isRetryable: boolean
  responseHeaders?: Record<string, string>
  responseBody?: string
  url?: string
}

export type OpenCodeProviderParsedStreamError =
  | {
    type: "context_overflow"
    message: string
    responseBody: string
  }
  | {
    type: "api_error"
    message: string
    isRetryable: boolean
    responseBody: string
  }

export type OpenCodeProviderParsedAPICallError =
  | {
    type: "context_overflow"
    message: string
    responseBody?: string
  }
  | {
    type: "api_error"
    message: string
    statusCode?: number
    isRetryable: boolean
    responseHeaders?: Record<string, string>
    responseBody?: string
    metadata?: Record<string, string>
  }

export interface OpenCodeProviderParserObserverBridge {
  parseStreamError(input: unknown): OpenCodeProviderParsedStreamError | undefined
  parseAPICallError(input: {
    providerID: string
    error: OpenCodeProviderParserAPICallErrorLike
  }): OpenCodeProviderParsedAPICallError
}

export interface OpenCodeProviderParserObserverNativeExactFixtureCase {
  id:
    | "stream-context-overflow"
    | "stream-quota-nested-message"
    | "stream-overloaded-retryable"
    | "api-openai-404-retryable"
    | "api-html-401-gateway-message"
    | "api-empty-message-status-fallback"
    | "api-regex-context-overflow"
  parser: "stream" | "api-call"
  input: unknown
  actual: OpenCodeProviderParsedStreamError | OpenCodeProviderParsedAPICallError | undefined
  expected: OpenCodeProviderParsedStreamError | OpenCodeProviderParsedAPICallError | undefined
}

export interface OpenCodeProviderParserObserverNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.parser-observer"
  portID: "provider.stream-parser"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-parser-observer-native-exact-fixture"
  replayRef: "provider-parser-observer-native-exact:opencode"
  fixtureID: "opencode-provider-parser-observer:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeProviderParserObserverNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderParserObserverNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderParserObserverNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderParserObserverNativeExactFixtureIssue[]
}

const OVERFLOW_PATTERNS = [
  /prompt is too long/i,
  /input is too long for requested model/i,
  /exceeds the context window/i,
  /input token count.*exceeds the maximum/i,
  /maximum prompt length is \d+/i,
  /reduce the length of the messages/i,
  /maximum context length is \d+ tokens/i,
  /exceeds the limit of \d+/i,
  /exceeds the available context size/i,
  /greater than the context length/i,
  /context window exceeds limit/i,
  /exceeded model token limit/i,
  /context[_ ]length[_ ]exceeded/i,
  /request entity too large/i,
  /context length is only \d+ tokens/i,
  /input length.*exceeds.*context length/i,
  /prompt too long; exceeded (?:max )?context length/i,
  /too large for model with \d+ maximum context length/i,
  /model_context_window_exceeded/i,
]

export function createOpenCodeProviderParserObserverBridge(): OpenCodeProviderParserObserverBridge {
  return {
    parseStreamError(input) {
      return openCodeProviderParserParseStreamError(input)
    },
    parseAPICallError(input) {
      return openCodeProviderParserParseAPICallError(input)
    },
  }
}

export function openCodeProviderParserParseStreamError(input: unknown): OpenCodeProviderParsedStreamError | undefined {
  const raw = openCodeProviderParserJSON(input)
  const body = typeof raw?.message === "string" ? (openCodeProviderParserJSON(raw.message) ?? raw) : raw
  if (!body) return undefined

  const error = openCodeProviderParserRecord(body.error)
  const responseBody = JSON.stringify(body)
  if (body.type !== "error") return undefined

  switch (error?.code) {
    case "context_length_exceeded":
      return {
        type: "context_overflow",
        message: "Input exceeds context window of this model",
        responseBody,
      }
    case "insufficient_quota":
      return {
        type: "api_error",
        message: "Quota exceeded. Check your plan and billing details.",
        isRetryable: false,
        responseBody,
      }
    case "usage_not_included":
      return {
        type: "api_error",
        message: "To use Codex with your ChatGPT plan, upgrade to Plus: https://chatgpt.com/explore/plus.",
        isRetryable: false,
        responseBody,
      }
    case "invalid_prompt":
      return {
        type: "api_error",
        message: typeof error.message === "string" ? error.message : "Invalid prompt.",
        isRetryable: false,
        responseBody,
      }
    case "server_is_overloaded":
    case "server_error":
      return {
        type: "api_error",
        message: typeof error.message === "string" ? error.message : "Server error.",
        isRetryable: true,
        responseBody,
      }
  }
  return undefined
}

export function openCodeProviderParserParseAPICallError(input: {
  providerID: string
  error: OpenCodeProviderParserAPICallErrorLike
}): OpenCodeProviderParsedAPICallError {
  const parsedMessage = openCodeProviderParserMessage(input.providerID, input.error)
  const body = openCodeProviderParserJSON(input.error.responseBody)
  const error = openCodeProviderParserRecord(body?.error)
  if (
    openCodeProviderParserIsOverflow(parsedMessage) ||
    input.error.statusCode === 413 ||
    error?.code === "context_length_exceeded"
  ) {
    return {
      type: "context_overflow",
      message: parsedMessage,
      ...(input.error.responseBody === undefined ? {} : { responseBody: input.error.responseBody }),
    }
  }

  const metadata = input.error.url ? { url: input.error.url } : undefined
  return {
    type: "api_error",
    message: parsedMessage,
    ...(input.error.statusCode === undefined ? {} : { statusCode: input.error.statusCode }),
    isRetryable: input.providerID.startsWith("openai")
      ? openCodeProviderParserIsOpenAIErrorRetryable(input.error)
      : input.error.isRetryable,
    ...(input.error.responseHeaders === undefined ? {} : { responseHeaders: input.error.responseHeaders }),
    ...(input.error.responseBody === undefined ? {} : { responseBody: input.error.responseBody }),
    ...(metadata === undefined ? {} : { metadata }),
  }
}

export function captureOpenCodeProviderParserObserverNativeExactFixture(): OpenCodeProviderParserObserverNativeExactFixture {
  const bridge = createOpenCodeProviderParserObserverBridge()
  const streamOverflowInput = { type: "error", error: { code: "context_length_exceeded" } }
  const streamQuotaBody = { type: "error", error: { code: "insufficient_quota" } }
  const streamOverloadedInput = { type: "error", error: { code: "server_is_overloaded", message: "Server busy" } }
  const cases: OpenCodeProviderParserObserverNativeExactFixtureCase[] = [
    {
      id: "stream-context-overflow",
      parser: "stream",
      input: streamOverflowInput,
      actual: bridge.parseStreamError(streamOverflowInput),
      expected: {
        type: "context_overflow",
        message: "Input exceeds context window of this model",
        responseBody: JSON.stringify(streamOverflowInput),
      },
    },
    {
      id: "stream-quota-nested-message",
      parser: "stream",
      input: { message: JSON.stringify(streamQuotaBody) },
      actual: bridge.parseStreamError({ message: JSON.stringify(streamQuotaBody) }),
      expected: {
        type: "api_error",
        message: "Quota exceeded. Check your plan and billing details.",
        isRetryable: false,
        responseBody: JSON.stringify(streamQuotaBody),
      },
    },
    {
      id: "stream-overloaded-retryable",
      parser: "stream",
      input: streamOverloadedInput,
      actual: bridge.parseStreamError(streamOverloadedInput),
      expected: {
        type: "api_error",
        message: "Server busy",
        isRetryable: true,
        responseBody: JSON.stringify(streamOverloadedInput),
      },
    },
    {
      id: "api-openai-404-retryable",
      parser: "api-call",
      input: {
        providerID: "openai",
        error: {
          message: "Not Found",
          statusCode: 404,
          isRetryable: false,
          responseHeaders: { "x-request-id": "req_404" },
          responseBody: JSON.stringify({ type: "error", error: "model unavailable" }),
          url: "https://api.openai.com/v1/responses",
        },
      },
      actual: bridge.parseAPICallError({
        providerID: "openai",
        error: {
          message: "Not Found",
          statusCode: 404,
          isRetryable: false,
          responseHeaders: { "x-request-id": "req_404" },
          responseBody: JSON.stringify({ type: "error", error: "model unavailable" }),
          url: "https://api.openai.com/v1/responses",
        },
      }),
      expected: {
        type: "api_error",
        message: "Not Found: model unavailable",
        statusCode: 404,
        isRetryable: true,
        responseHeaders: { "x-request-id": "req_404" },
        responseBody: JSON.stringify({ type: "error", error: "model unavailable" }),
        metadata: { url: "https://api.openai.com/v1/responses" },
      },
    },
    {
      id: "api-html-401-gateway-message",
      parser: "api-call",
      input: {
        providerID: "anthropic",
        error: {
          message: "Unauthorized",
          statusCode: 401,
          isRetryable: false,
          responseBody: "<html><body>gateway</body></html>",
        },
      },
      actual: bridge.parseAPICallError({
        providerID: "anthropic",
        error: {
          message: "Unauthorized",
          statusCode: 401,
          isRetryable: false,
          responseBody: "<html><body>gateway</body></html>",
        },
      }),
      expected: {
        type: "api_error",
        message:
          "Unauthorized: request was blocked by a gateway or proxy. Your authentication token may be missing or expired \u2014 try running `opencode auth login <your provider URL>` to re-authenticate.",
        statusCode: 401,
        isRetryable: false,
        responseBody: "<html><body>gateway</body></html>",
      },
    },
    {
      id: "api-empty-message-status-fallback",
      parser: "api-call",
      input: {
        providerID: "mistral",
        error: {
          message: "",
          statusCode: 418,
          isRetryable: false,
        },
      },
      actual: bridge.parseAPICallError({
        providerID: "mistral",
        error: {
          message: "",
          statusCode: 418,
          isRetryable: false,
        },
      }),
      expected: {
        type: "api_error",
        message: "I'm a Teapot",
        statusCode: 418,
        isRetryable: false,
      },
    },
    {
      id: "api-regex-context-overflow",
      parser: "api-call",
      input: {
        providerID: "anthropic",
        error: {
          message: "prompt is too long",
          statusCode: 400,
          isRetryable: false,
          responseBody: JSON.stringify({ error: { code: "bad_request" } }),
        },
      },
      actual: bridge.parseAPICallError({
        providerID: "anthropic",
        error: {
          message: "prompt is too long",
          statusCode: 400,
          isRetryable: false,
          responseBody: JSON.stringify({ error: { code: "bad_request" } }),
        },
      }),
      expected: {
        type: "context_overflow",
        message: "prompt is too long",
        responseBody: JSON.stringify({ error: { code: "bad_request" } }),
      },
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.parser-observer" as const,
    portID: "provider.stream-parser" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-parser-observer-native-exact-fixture" as const,
    replayRef: "provider-parser-observer-native-exact:opencode" as const,
    fixtureID: "opencode-provider-parser-observer:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/error.ts#parseStreamError,parseAPICallError,OVERFLOW_PATTERNS",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#fromError,ProviderError.parseStreamError,ProviderError.parseAPICallError",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderParserFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderParserObserverNativeExactFixture(
  fixture: OpenCodeProviderParserObserverNativeExactFixture,
): OpenCodeProviderParserObserverNativeExactFixtureVerification {
  const issues: OpenCodeProviderParserObserverNativeExactFixtureIssue[] = []
  if (
    fixture.atomID !== "opencode.provider.parser-observer" ||
    fixture.portID !== "provider.stream-parser" ||
    fixture.fixtureID !== "opencode-provider-parser-observer:native-exact-fixture"
  ) {
    issues.push({ id: "opencode-provider-parser-observer-native-exact.identity", message: "OpenCode parser observer native fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-provider-parser-observer-native-exact.native-claim", message: "OpenCode parser observer fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-provider-parser-observer-native-exact.lossiness", message: "OpenCode parser observer native fixture cannot retain known lossiness." })
  }
  for (const source of ["packages/opencode/src/provider/error.ts", "packages/opencode/src/session/message-v2.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-provider-parser-observer-native-exact.source", message: `OpenCode parser observer fixture lost upstream source ${source}.` })
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeProviderParserSameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-provider-parser-observer-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned parser behavior.` })
    }
  }
  if (!fixture.cases.some((item) => item.id === "stream-context-overflow" && item.actual?.type === "context_overflow")) {
    issues.push({ id: "opencode-provider-parser-observer-native-exact.stream-overflow", message: "Stream context overflow mapping is not covered." })
  }
  const openai404 = fixture.cases.find((item) => item.id === "api-openai-404-retryable")
  if (!openai404 || openai404.actual?.type !== "api_error" || openai404.actual.isRetryable !== true) {
    issues.push({ id: "opencode-provider-parser-observer-native-exact.openai-404", message: "OpenAI 404 retryability special case is not covered." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderParserFingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-provider-parser-observer-native-exact.fingerprint", message: "OpenCode parser observer native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function openCodeProviderParserMessage(providerID: string, error: OpenCodeProviderParserAPICallErrorLike): string {
  const msg = error.message
  const result = (() => {
    if (msg === "") {
      if (error.responseBody) return error.responseBody
      if (error.statusCode) {
        const status = STATUS_CODES[error.statusCode]
        if (status) return status
      }
      return "Unknown error"
    }

    if (!error.responseBody || (error.statusCode && msg !== STATUS_CODES[error.statusCode])) {
      return msg
    }

    const body = openCodeProviderParserJSON(error.responseBody)
    const errMsg = body?.message || body?.error || openCodeProviderParserRecord(body?.error)?.message
    if (typeof errMsg === "string") {
      return `${msg}: ${errMsg}`
    }

    if (/^\s*<!doctype|^\s*<html/i.test(error.responseBody)) {
      if (error.statusCode === 401) {
        return "Unauthorized: request was blocked by a gateway or proxy. Your authentication token may be missing or expired \u2014 try running `opencode auth login <your provider URL>` to re-authenticate."
      }
      if (error.statusCode === 403) {
        return "Forbidden: request was blocked by a gateway or proxy. You may not have permission to access this resource \u2014 check your account and provider settings."
      }
      return msg
    }

    return `${msg}: ${error.responseBody}`
  })()
  return result.trim()
}

function openCodeProviderParserIsOpenAIErrorRetryable(error: OpenCodeProviderParserAPICallErrorLike): boolean {
  const status = error.statusCode
  if (!status) return error.isRetryable
  return status === 404 || error.isRetryable
}

function openCodeProviderParserIsOverflow(message: string): boolean {
  if (OVERFLOW_PATTERNS.some((pattern) => pattern.test(message))) return true
  return /^4(00|13)\s*(status code)?\s*\(no body\)/i.test(message)
}

function openCodeProviderParserJSON(input: unknown): Record<string, unknown> | undefined {
  if (typeof input === "string") {
    try {
      const result = JSON.parse(input)
      return openCodeProviderParserRecord(result)
    } catch {
      return undefined
    }
  }
  return openCodeProviderParserRecord(input)
}

function openCodeProviderParserRecord(input: unknown): Record<string, unknown> | undefined {
  if (input && typeof input === "object" && !Array.isArray(input)) return input as Record<string, unknown>
  return undefined
}

function openCodeProviderParserSameJSON(left: unknown, right: unknown): boolean {
  return openCodeProviderParserStableJSON(left) === openCodeProviderParserStableJSON(right)
}

function openCodeProviderParserFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeProviderParserStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeProviderParserStableJSON(value: unknown): string {
  return JSON.stringify(openCodeProviderParserSortStable(value))
}

function openCodeProviderParserSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeProviderParserSortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeProviderParserSortStable(entry)]),
  )
}
