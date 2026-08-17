import { createHash } from "node:crypto"

export interface OpenCodeProviderRequestOptionsModel {
  providerID: string
  headers?: Record<string, string>
}

export interface OpenCodeProviderRequestOptionsProvider {
  id: string
  options?: Record<string, unknown>
}

export interface OpenCodeProviderRequestOptionsMessage {
  id: string
  [key: string]: unknown
}

export interface OpenCodeProviderRequestOptionsContext {
  sessionID: string
  parentSessionID?: string
  agent: string
  model: OpenCodeProviderRequestOptionsModel & Record<string, unknown>
  provider: OpenCodeProviderRequestOptionsProvider & Record<string, unknown>
  message: OpenCodeProviderRequestOptionsMessage
  client: string
  projectID?: string
}

export interface OpenCodeProviderRequestParams {
  temperature?: number | undefined
  topP?: number | undefined
  topK?: number | undefined
  maxOutputTokens?: number | undefined
  options: Record<string, unknown>
}

export interface OpenCodeProviderRequestOptionsHooks {
  "chat.params"?: (
    input: {
      sessionID: string
      agent: string
      model: OpenCodeProviderRequestOptionsContext["model"]
      provider: OpenCodeProviderRequestOptionsContext["provider"]
      message: OpenCodeProviderRequestOptionsMessage
    },
    output: OpenCodeProviderRequestParams,
  ) => void | Promise<void>
  "chat.headers"?: (
    input: {
      sessionID: string
      agent: string
      model: OpenCodeProviderRequestOptionsContext["model"]
      provider: OpenCodeProviderRequestOptionsContext["provider"]
      message: OpenCodeProviderRequestOptionsMessage
    },
    output: { headers: Record<string, string> },
  ) => void | Promise<void>
}

export interface OpenCodeProviderRequestOptionsInput {
  context: OpenCodeProviderRequestOptionsContext
  params: OpenCodeProviderRequestParams
  hooks?: OpenCodeProviderRequestOptionsHooks
}

export interface OpenCodeProviderRequestOptionsPrepared {
  params: OpenCodeProviderRequestParams
  messageTransformOptions: Record<string, unknown>
  headers: Record<string, string>
}

export interface OpenCodeProviderRequestOptionsBridgeOptions {
  userAgent?: string
}

export interface OpenCodeProviderRequestOptionsBridge {
  prepare(input: OpenCodeProviderRequestOptionsInput): Promise<OpenCodeProviderRequestOptionsPrepared>
}

export interface OpenCodeProviderRequestOptionsNativeExactFixtureCase {
  id: "non-opencode-hooked-request" | "opencode-default-headers" | "missing-hooks-preserve-defaults"
  actual: OpenCodeProviderRequestOptionsPrepared
  expected: OpenCodeProviderRequestOptionsPrepared
}

export interface OpenCodeProviderRequestOptionsNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.request-options"
  portID: "provider.request-shape"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-request-options-native-exact-fixture"
  replayRef: "provider-request-options-native-exact:opencode"
  fixtureID: "opencode-provider-request-options:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeProviderRequestOptionsNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderRequestOptionsNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderRequestOptionsNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderRequestOptionsNativeExactFixtureIssue[]
}

export function createOpenCodeProviderRequestOptionsBridge(
  options: OpenCodeProviderRequestOptionsBridgeOptions = {},
): OpenCodeProviderRequestOptionsBridge {
  const userAgent = options.userAgent ?? "opencode/fixture"
  return {
    async prepare(input) {
      return openCodeProviderRequestOptionsPrepare(input, userAgent)
    },
  }
}

export async function openCodeProviderRequestOptionsPrepare(
  input: OpenCodeProviderRequestOptionsInput,
  userAgent = "opencode/fixture",
): Promise<OpenCodeProviderRequestOptionsPrepared> {
  const hookInput = {
    sessionID: input.context.sessionID,
    agent: input.context.agent,
    model: input.context.model,
    provider: input.context.provider,
    message: input.context.message,
  }
  const params = { ...input.params, options: { ...input.params.options } }
  const messageTransformOptions = params.options
  await input.hooks?.["chat.params"]?.(hookInput, params)

  const headerOutput = { headers: {} as Record<string, string> }
  await input.hooks?.["chat.headers"]?.(hookInput, headerOutput)

  return {
    params,
    messageTransformOptions,
    headers: {
      ...openCodeProviderRequestOptionsDefaultHeaders(input.context, userAgent),
      ...(input.context.model.headers ?? {}),
      ...headerOutput.headers,
    },
  }
}

export function openCodeProviderRequestOptionsDefaultHeaders(
  context: OpenCodeProviderRequestOptionsContext,
  userAgent = "opencode/fixture",
): Record<string, string> {
  if (context.model.providerID.startsWith("opencode")) {
    return {
      ...(context.projectID ? { "x-opencode-project": context.projectID } : {}),
      "x-opencode-session": context.sessionID,
      "x-opencode-request": context.message.id,
      "x-opencode-client": context.client,
      "User-Agent": userAgent,
    }
  }
  return {
    "x-session-affinity": context.sessionID,
    ...(context.parentSessionID ? { "x-parent-session-id": context.parentSessionID } : {}),
    "User-Agent": userAgent,
  }
}

export async function captureOpenCodeProviderRequestOptionsNativeExactFixture(): Promise<OpenCodeProviderRequestOptionsNativeExactFixture> {
  const bridge = createOpenCodeProviderRequestOptionsBridge({ userAgent: "opencode/test-version" })
  const nonOpenCode = await bridge.prepare({
    context: openCodeProviderRequestOptionsContext({
      sessionID: "ses_001",
      parentSessionID: "parent_001",
      agent: "build",
      model: { providerID: "openai", headers: { "x-model": "model", "User-Agent": "model-agent" }, id: "gpt-5" },
      provider: { id: "openai", options: { provider: true } },
      message: { id: "msg_001", role: "user" },
      client: "cli",
    }),
    params: {
      temperature: 0.7,
      topP: 0.9,
      topK: 0,
      maxOutputTokens: 4000,
      options: { base: true, nested: { source: "base" } },
    },
    hooks: {
      "chat.params": (_input, output) => {
        output.temperature = 0.2
        output.options = { plugin: "replaced" }
      },
      "chat.headers": (_input, output) => {
        output.headers["x-plugin"] = "hook"
        output.headers["User-Agent"] = "hook-agent"
      },
    },
  })
  const openCode = await bridge.prepare({
    context: openCodeProviderRequestOptionsContext({
      sessionID: "ses_002",
      agent: "plan",
      model: { providerID: "opencode/local", headers: { "x-model": "native" } },
      provider: { id: "opencode", options: {} },
      message: { id: "msg_002" },
      client: "desktop",
      projectID: "proj_001",
    }),
    params: { topP: 1, topK: 0, options: { opencode: true } },
    hooks: {
      "chat.headers": (_input, output) => {
        output.headers["x-extra"] = "yes"
      },
    },
  })
  const missingHooks = await bridge.prepare({
    context: openCodeProviderRequestOptionsContext({
      sessionID: "ses_003",
      agent: "build",
      model: { providerID: "anthropic", headers: {} },
      provider: { id: "anthropic", options: {} },
      message: { id: "msg_003" },
      client: "server",
    }),
    params: { temperature: undefined, topP: 1, topK: 0, maxOutputTokens: undefined, options: { small: false } },
  })
  const cases: OpenCodeProviderRequestOptionsNativeExactFixtureCase[] = [
    {
      id: "non-opencode-hooked-request",
      actual: nonOpenCode,
      expected: {
        params: {
          temperature: 0.2,
          topP: 0.9,
          topK: 0,
          maxOutputTokens: 4000,
          options: { plugin: "replaced" },
        },
        messageTransformOptions: { base: true, nested: { source: "base" } },
        headers: {
          "x-session-affinity": "ses_001",
          "x-parent-session-id": "parent_001",
          "User-Agent": "hook-agent",
          "x-model": "model",
          "x-plugin": "hook",
        },
      },
    },
    {
      id: "opencode-default-headers",
      actual: openCode,
      expected: {
        params: { topP: 1, topK: 0, options: { opencode: true } },
        messageTransformOptions: { opencode: true },
        headers: {
          "x-opencode-project": "proj_001",
          "x-opencode-session": "ses_002",
          "x-opencode-request": "msg_002",
          "x-opencode-client": "desktop",
          "User-Agent": "opencode/test-version",
          "x-model": "native",
          "x-extra": "yes",
        },
      },
    },
    {
      id: "missing-hooks-preserve-defaults",
      actual: missingHooks,
      expected: {
        params: { temperature: undefined, topP: 1, topK: 0, maxOutputTokens: undefined, options: { small: false } },
        messageTransformOptions: { small: false },
        headers: {
          "x-session-affinity": "ses_003",
          "User-Agent": "opencode/test-version",
        },
      },
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.request-options" as const,
    portID: "provider.request-shape" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-request-options-native-exact-fixture" as const,
    replayRef: "provider-request-options-native-exact:opencode" as const,
    fixtureID: "opencode-provider-request-options:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/llm/request.ts#prepare,chat.params,chat.headers,headers",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/plugin/src/index.ts#Hooks,chat.params,chat.headers",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderRequestOptionsFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderRequestOptionsNativeExactFixture(
  fixture: OpenCodeProviderRequestOptionsNativeExactFixture,
): OpenCodeProviderRequestOptionsNativeExactFixtureVerification {
  const issues: OpenCodeProviderRequestOptionsNativeExactFixtureIssue[] = []
  if (
    fixture.atomID !== "opencode.provider.request-options" ||
    fixture.portID !== "provider.request-shape" ||
    fixture.fixtureID !== "opencode-provider-request-options:native-exact-fixture"
  ) {
    issues.push({ id: "opencode-provider-request-options-native-exact.identity", message: "OpenCode request options native fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-provider-request-options-native-exact.native-claim", message: "OpenCode request options fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-provider-request-options-native-exact.lossiness", message: "OpenCode request options native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/llm/request.ts", "packages/plugin/src/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-provider-request-options-native-exact.source", message: `OpenCode request options fixture lost upstream source ${source}.` })
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeProviderRequestOptionsSameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-provider-request-options-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned request option behavior.` })
    }
  }
  const replacementCase = fixture.cases.find((item) => item.id === "non-opencode-hooked-request")
  if (
    !replacementCase ||
    !openCodeProviderRequestOptionsSameJSON(replacementCase.actual.params.options, { plugin: "replaced" }) ||
    !openCodeProviderRequestOptionsSameJSON(replacementCase.actual.messageTransformOptions, { base: true, nested: { source: "base" } })
  ) {
    issues.push({ id: "opencode-provider-request-options-native-exact.message-transform-options", message: "Replacing params.options must not replace upstream messageTransformOptions." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderRequestOptionsFingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-provider-request-options-native-exact.fingerprint", message: "OpenCode request options native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function openCodeProviderRequestOptionsContext(input: OpenCodeProviderRequestOptionsContext): OpenCodeProviderRequestOptionsContext {
  return input
}

function openCodeProviderRequestOptionsSameJSON(left: unknown, right: unknown): boolean {
  return openCodeProviderRequestOptionsStableJSON(left) === openCodeProviderRequestOptionsStableJSON(right)
}

function openCodeProviderRequestOptionsFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeProviderRequestOptionsStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeProviderRequestOptionsStableJSON(value: unknown): string {
  return JSON.stringify(openCodeProviderRequestOptionsSortStable(value))
}

function openCodeProviderRequestOptionsSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeProviderRequestOptionsSortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeProviderRequestOptionsSortStable(entry)]),
  )
}
