import { createHash } from "node:crypto"

export interface OpenCodeTurnProviderRequestBuilderMessage {
  role: string
  content: unknown
  [key: string]: unknown
}

export interface OpenCodeTurnProviderRequestBuilderTool {
  description?: string
  inputSchema?: unknown
  execute?: unknown
  [key: string]: unknown
}

export interface OpenCodeTurnProviderRequestBuilderPermissionRule {
  permission: string
  pattern: string
  action: "allow" | "deny" | "ask"
}

export interface OpenCodeTurnProviderRequestBuilderUser {
  id: string
  system?: string
  model: { variant?: string }
  tools?: Record<string, boolean | undefined>
  [key: string]: unknown
}

export interface OpenCodeTurnProviderRequestBuilderModel {
  id: string
  providerID: string
  api: { id: string; npm: string }
  capabilities: { temperature?: boolean; reasoning?: boolean }
  limit?: { output: number }
  headers?: Record<string, string>
  options?: Record<string, unknown>
  variants?: Record<string, Record<string, unknown>>
}

export interface OpenCodeTurnProviderRequestBuilderAgent {
  name: string
  prompt?: string
  options?: Record<string, unknown>
  temperature?: number
  topP?: number
  permission?: OpenCodeTurnProviderRequestBuilderPermissionRule[]
}

export interface OpenCodeTurnProviderRequestBuilderProvider {
  id: string
  options?: Record<string, unknown>
}

export interface OpenCodeTurnProviderRequestBuilderAuth {
  type: string
  [key: string]: unknown
}

export interface OpenCodeTurnProviderRequestBuilderFlags {
  client: string
  outputTokenMax?: number
}

export interface OpenCodeTurnProviderRequestBuilderParams {
  temperature?: number | undefined
  topP?: number | undefined
  topK?: number | undefined
  maxOutputTokens?: number | undefined
  options: Record<string, unknown>
}

export interface OpenCodeTurnProviderRequestBuilderPrepared {
  system: string[]
  messages: OpenCodeTurnProviderRequestBuilderMessage[]
  tools: Record<string, OpenCodeTurnProviderRequestBuilderTool>
  params: OpenCodeTurnProviderRequestBuilderParams
  messageTransformOptions: Record<string, unknown>
  headers: Record<string, string>
}

export interface OpenCodeTurnProviderRequestBuilderHookInput {
  sessionID: string
  agent: string
  model: OpenCodeTurnProviderRequestBuilderModel
  provider: OpenCodeTurnProviderRequestBuilderProvider
  message: OpenCodeTurnProviderRequestBuilderUser
}

export interface OpenCodeTurnProviderRequestBuilderHooks {
  "experimental.chat.system.transform"?: (
    input: { sessionID: string; model: OpenCodeTurnProviderRequestBuilderModel },
    output: { system: string[] },
  ) => void | { system?: string[] } | Promise<void | { system?: string[] }>
  "chat.params"?: (
    input: OpenCodeTurnProviderRequestBuilderHookInput,
    output: OpenCodeTurnProviderRequestBuilderParams,
  ) => void | Partial<OpenCodeTurnProviderRequestBuilderParams> | Promise<void | Partial<OpenCodeTurnProviderRequestBuilderParams>>
  "chat.headers"?: (
    input: OpenCodeTurnProviderRequestBuilderHookInput,
    output: { headers: Record<string, string> },
  ) => void | { headers?: Record<string, string> } | Promise<void | { headers?: Record<string, string> }>
}

type TransformValue<TValue, TArgs extends unknown[]> = TValue | ((...args: TArgs) => TValue)

export interface OpenCodeTurnProviderRequestBuilderProviderTransform {
  options?: TransformValue<
    Record<string, unknown>,
    [
      {
        model: OpenCodeTurnProviderRequestBuilderModel
        sessionID: string
        providerOptions?: Record<string, unknown>
      },
    ]
  >
  smallOptions?: TransformValue<Record<string, unknown>, [OpenCodeTurnProviderRequestBuilderModel]>
  temperature?: TransformValue<number | undefined, [OpenCodeTurnProviderRequestBuilderModel]>
  topP?: TransformValue<number | undefined, [OpenCodeTurnProviderRequestBuilderModel]>
  topK?: TransformValue<number | undefined, [OpenCodeTurnProviderRequestBuilderModel]>
  maxOutputTokens?: TransformValue<number | undefined, [OpenCodeTurnProviderRequestBuilderModel, number | undefined]>
}

export interface OpenCodeTurnProviderRequestBuilderInput {
  user: OpenCodeTurnProviderRequestBuilderUser
  sessionID: string
  parentSessionID?: string
  model: OpenCodeTurnProviderRequestBuilderModel
  agent: OpenCodeTurnProviderRequestBuilderAgent
  permission?: OpenCodeTurnProviderRequestBuilderPermissionRule[]
  providerSystemPrompt: string[]
  system: string[]
  messages: OpenCodeTurnProviderRequestBuilderMessage[]
  small?: boolean
  tools: Record<string, OpenCodeTurnProviderRequestBuilderTool>
  provider: OpenCodeTurnProviderRequestBuilderProvider
  auth?: OpenCodeTurnProviderRequestBuilderAuth
  hooks?: OpenCodeTurnProviderRequestBuilderHooks
  flags: OpenCodeTurnProviderRequestBuilderFlags
  isWorkflow: boolean
  projectID?: string
  providerTransform?: OpenCodeTurnProviderRequestBuilderProviderTransform
}

export interface OpenCodeTurnProviderRequestBuilderBridgeOptions {
  userAgent?: string
}

export interface OpenCodeTurnProviderRequestBuilderBridge {
  prepare(input: OpenCodeTurnProviderRequestBuilderInput): Promise<OpenCodeTurnProviderRequestBuilderPrepared>
}

export interface OpenCodeTurnProviderRequestBuilderNativeExactFixtureCase {
  id:
    | "standard-request-system-tools-and-headers"
    | "openai-oauth-instructions"
    | "workflow-opencode-small-request"
    | "copilot-replay-noop-tool"
  actual: OpenCodeTurnProviderRequestBuilderPrepared
  expected: OpenCodeTurnProviderRequestBuilderPrepared
}

export interface OpenCodeTurnProviderRequestBuilderNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.provider-request-builder"
  portID: "turn.provider-request-builder"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-provider-request-builder-native-exact-fixture"
  replayRef: "turn-provider-request-builder-native-exact:opencode"
  fixtureID: "opencode-turn-provider-request-builder:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnProviderRequestBuilderNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnProviderRequestBuilderNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnProviderRequestBuilderNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnProviderRequestBuilderNativeExactFixtureIssue[]
}

const defaultUserAgent = "opencode/fixture"
const editTools = new Set(["edit", "write", "apply_patch"])

export function createOpenCodeTurnProviderRequestBuilderBridge(
  options: OpenCodeTurnProviderRequestBuilderBridgeOptions = {},
): OpenCodeTurnProviderRequestBuilderBridge {
  const userAgent = options.userAgent ?? defaultUserAgent
  return {
    async prepare(input) {
      return prepareOpenCodeTurnProviderRequest(input, userAgent)
    },
  }
}

export async function prepareOpenCodeTurnProviderRequest(
  input: OpenCodeTurnProviderRequestBuilderInput,
  userAgent = defaultUserAgent,
): Promise<OpenCodeTurnProviderRequestBuilderPrepared> {
  const isOpenaiOauth = input.provider.id === "openai" && input.auth?.type === "oauth"
  const system = [
    [
      ...(input.agent.prompt ? [input.agent.prompt] : input.providerSystemPrompt),
      ...input.system,
      ...(input.user.system ? [input.user.system] : []),
    ]
      .filter((item) => item)
      .join("\n"),
  ]

  const header = system[0] ?? ""
  const systemOutput = { system }
  const transformedSystem = await input.hooks?.["experimental.chat.system.transform"]?.(
    { sessionID: input.sessionID, model: input.model },
    systemOutput,
  )
  if (transformedSystem?.system) {
    system.length = 0
    system.push(...transformedSystem.system)
  }
  if (system.length > 2 && system[0] === header) {
    const rest = system.slice(1)
    system.length = 0
    system.push(header, rest.join("\n"))
  }

  const variant =
    !input.small && input.model.variants && input.user.model.variant
      ? input.model.variants[input.user.model.variant] ?? {}
      : {}
  const base = input.small
    ? resolveTransform(input.providerTransform?.smallOptions, [input.model], {})
    : resolveTransform(
        input.providerTransform?.options,
        [{
          model: input.model,
          sessionID: input.sessionID,
          ...(input.provider.options ? { providerOptions: input.provider.options } : {}),
        }],
        {},
      )
  const options = mergeOptions(mergeOptions(mergeOptions(base, input.model.options), input.agent.options), variant)
  if (isOpenaiOauth) options.instructions = system.join("\n")

  const messages =
    isOpenaiOauth || input.isWorkflow
      ? [...input.messages]
      : [
          ...system.map(
            (item): OpenCodeTurnProviderRequestBuilderMessage => ({
              role: "system",
              content: item,
            }),
          ),
          ...input.messages,
        ]

  const hookInput = {
    sessionID: input.sessionID,
    agent: input.agent.name,
    model: input.model,
    provider: input.provider,
    message: input.user,
  }
  const params: OpenCodeTurnProviderRequestBuilderParams = {
    temperature: input.model.capabilities.temperature
      ? input.agent.temperature ?? resolveTransform(input.providerTransform?.temperature, [input.model], undefined)
      : undefined,
    topP: input.agent.topP ?? resolveTransform(input.providerTransform?.topP, [input.model], undefined),
    topK: resolveTransform(input.providerTransform?.topK, [input.model], undefined),
    maxOutputTokens: resolveTransform(input.providerTransform?.maxOutputTokens, [input.model, input.flags.outputTokenMax], undefined),
    options,
  }
  const transformedParams = await input.hooks?.["chat.params"]?.(hookInput, params)
  if (transformedParams) Object.assign(params, transformedParams)

  const headerOutput = { headers: {} as Record<string, string> }
  const transformedHeaders = await input.hooks?.["chat.headers"]?.(hookInput, headerOutput)
  if (transformedHeaders?.headers) headerOutput.headers = transformedHeaders.headers

  const tools = resolveOpenCodeTurnProviderRequestTools(input)
  if (input.model.providerID.includes("github-copilot") && Object.keys(tools).length === 0 && openCodeTurnProviderRequestHasToolCalls(input.messages)) {
    tools["_noop"] = createOpenCodeTurnProviderRequestNoopTool()
  }

  return {
    system,
    messages,
    tools: sortRecord(tools),
    params,
    messageTransformOptions: options,
    headers: {
      ...openCodeTurnProviderRequestDefaultHeaders(input, userAgent),
      ...(input.model.headers ?? {}),
      ...headerOutput.headers,
    },
  }
}

export function resolveOpenCodeTurnProviderRequestTools(
  input: Pick<OpenCodeTurnProviderRequestBuilderInput, "tools" | "agent" | "permission" | "user">,
): Record<string, OpenCodeTurnProviderRequestBuilderTool> {
  const disabled = openCodeTurnProviderRequestDisabledTools(
    Object.keys(input.tools),
    openCodeTurnProviderRequestMergePermissions(input.agent.permission ?? [], input.permission ?? []),
  )
  return Object.fromEntries(
    Object.entries(input.tools).filter(([key]) => input.user.tools?.[key] !== false && !disabled.has(key)),
  )
}

export function openCodeTurnProviderRequestMergePermissions(
  ...rulesets: OpenCodeTurnProviderRequestBuilderPermissionRule[][]
): OpenCodeTurnProviderRequestBuilderPermissionRule[] {
  return rulesets.flat()
}

export function openCodeTurnProviderRequestDisabledTools(
  tools: string[],
  ruleset: OpenCodeTurnProviderRequestBuilderPermissionRule[],
): Set<string> {
  return new Set(
    tools.filter((tool) => {
      const permission = editTools.has(tool) ? "edit" : tool
      const rule = findLast(ruleset, (item) => wildcardMatch(item.permission, permission))
      return rule?.pattern === "*" && rule.action === "deny"
    }),
  )
}

export function openCodeTurnProviderRequestHasToolCalls(messages: OpenCodeTurnProviderRequestBuilderMessage[]): boolean {
  for (const message of messages) {
    if (!Array.isArray(message.content)) continue
    for (const part of message.content) {
      if (isRecord(part) && (part.type === "tool-call" || part.type === "tool-result")) return true
    }
  }
  return false
}

export function openCodeTurnProviderRequestDefaultHeaders(
  input: Pick<
    OpenCodeTurnProviderRequestBuilderInput,
    "model" | "projectID" | "sessionID" | "user" | "flags" | "parentSessionID"
  >,
  userAgent = defaultUserAgent,
): Record<string, string> {
  if (input.model.providerID.startsWith("opencode")) {
    return {
      ...(input.projectID ? { "x-opencode-project": input.projectID } : {}),
      "x-opencode-session": input.sessionID,
      "x-opencode-request": input.user.id,
      "x-opencode-client": input.flags.client,
      "User-Agent": userAgent,
    }
  }
  return {
    "x-session-affinity": input.sessionID,
    ...(input.parentSessionID ? { "x-parent-session-id": input.parentSessionID } : {}),
    "User-Agent": userAgent,
  }
}

export async function captureOpenCodeTurnProviderRequestBuilderNativeExactFixture(): Promise<OpenCodeTurnProviderRequestBuilderNativeExactFixture> {
  const bridge = createOpenCodeTurnProviderRequestBuilderBridge({ userAgent: "opencode/test-version" })
  const standard = await bridge.prepare({
    user: {
      id: "msg_standard",
      system: "user system",
      model: { variant: "deep" },
      tools: { write: false, bash: true, read: true },
    },
    sessionID: "ses_standard",
    parentSessionID: "parent_standard",
    model: model({
      id: "qwen-plus",
      providerID: "openai-compatible",
      headers: { "x-model": "standard" },
      options: { provider: { model: true }, replace: "model" },
      variants: { deep: { provider: { variant: true }, reasoning: { effort: "high" } } },
      capabilities: { temperature: true },
    }),
    agent: {
      name: "build",
      prompt: "agent prompt",
      options: { provider: { agent: true }, replace: "agent" },
      temperature: 0.6,
      permission: [{ permission: "edit", pattern: "*", action: "allow" }],
    },
    permission: [{ permission: "bash", pattern: "*", action: "deny" }],
    providerSystemPrompt: ["provider prompt"],
    system: ["runtime system"],
    messages: [{ role: "user", content: "hello" }],
    tools: {
      bash: { description: "shell" },
      read: { description: "read" },
      write: { description: "write" },
    },
    provider: { id: "openai-compatible", options: { providerSide: true } },
    flags: { client: "cli", outputTokenMax: 4096 },
    isWorkflow: false,
    providerTransform: {
      options: { provider: { base: true }, replace: "base", nested: { a: 1 } },
      temperature: 0.1,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048,
    },
    hooks: {
      "experimental.chat.system.transform": (_input, output) => {
        output.system.push("plugin extra one", "plugin extra two")
      },
      "chat.params": (_input, output) => {
        output.topP = 0.8
        output.options = { plugin: "replaced" }
      },
      "chat.headers": (_input, output) => {
        output.headers["x-hook"] = "headers"
        output.headers["User-Agent"] = "hook-agent"
      },
    },
  })
  const oauth = await bridge.prepare({
    user: { id: "msg_oauth", model: {} },
    sessionID: "ses_oauth",
    model: model({ id: "gpt-5", providerID: "openai", capabilities: { temperature: false }, options: { modelOption: true } }),
    agent: { name: "oauth-agent" },
    providerSystemPrompt: ["provider prompt"],
    system: ["runtime prompt"],
    messages: [{ role: "user", content: "oauth hello" }],
    tools: {},
    provider: { id: "openai", options: {} },
    auth: { type: "oauth" },
    flags: { client: "desktop" },
    isWorkflow: false,
    providerTransform: { options: { store: false }, topP: 1, topK: undefined, maxOutputTokens: 32000 },
  })
  const workflow = await bridge.prepare({
    user: { id: "msg_workflow", model: { variant: "unused-small" } },
    sessionID: "ses_workflow",
    model: model({
      id: "gpt-5",
      providerID: "opencode/gpt-5",
      headers: { "x-model": "opencode" },
      options: { modelOption: true },
      variants: { "unused-small": { reasoningEffort: "low" } },
      capabilities: { temperature: true },
    }),
    agent: { name: "workflow", options: { agentOption: true } },
    providerSystemPrompt: ["provider prompt"],
    system: ["workflow system"],
    messages: [{ role: "user", content: "workflow hello" }],
    small: true,
    tools: {},
    provider: { id: "opencode", options: {} },
    flags: { client: "server" },
    isWorkflow: true,
    projectID: "proj_workflow",
    providerTransform: { smallOptions: { store: false, small: true }, temperature: 0.2, topP: 0.95, topK: 64, maxOutputTokens: 1000 },
  })
  const copilot = await bridge.prepare({
    user: { id: "msg_copilot", model: {} },
    sessionID: "ses_copilot",
    model: model({ id: "copilot", providerID: "github-copilot", capabilities: { temperature: true } }),
    agent: { name: "copilot", permission: [{ permission: "*", pattern: "*", action: "deny" }] },
    providerSystemPrompt: ["provider prompt"],
    system: [],
    messages: [{ role: "assistant", content: [{ type: "tool-call", toolCallId: "call_1" }] }],
    tools: { read: { description: "read" } },
    provider: { id: "github-copilot", options: {} },
    flags: { client: "cli" },
    isWorkflow: false,
    providerTransform: { options: { store: false }, temperature: undefined, topP: undefined, topK: undefined, maxOutputTokens: undefined },
  })
  const cases: OpenCodeTurnProviderRequestBuilderNativeExactFixtureCase[] = [
    {
      id: "standard-request-system-tools-and-headers",
      actual: standard,
      expected: {
        system: ["agent prompt\nruntime system\nuser system", "plugin extra one\nplugin extra two"],
        messages: [
          { role: "system", content: "agent prompt\nruntime system\nuser system" },
          { role: "system", content: "plugin extra one\nplugin extra two" },
          { role: "user", content: "hello" },
        ],
        tools: { read: { description: "read" } },
        params: { temperature: 0.6, topP: 0.8, topK: 40, maxOutputTokens: 2048, options: { plugin: "replaced" } },
        messageTransformOptions: {
          nested: { a: 1 },
          provider: { agent: true, base: true, model: true, variant: true },
          reasoning: { effort: "high" },
          replace: "agent",
        },
        headers: {
          "x-session-affinity": "ses_standard",
          "x-parent-session-id": "parent_standard",
          "User-Agent": "hook-agent",
          "x-model": "standard",
          "x-hook": "headers",
        },
      },
    },
    {
      id: "openai-oauth-instructions",
      actual: oauth,
      expected: {
        system: ["provider prompt\nruntime prompt"],
        messages: [{ role: "user", content: "oauth hello" }],
        tools: {},
        params: {
          temperature: undefined,
          topP: 1,
          topK: undefined,
          maxOutputTokens: 32000,
          options: { store: false, modelOption: true, instructions: "provider prompt\nruntime prompt" },
        },
        messageTransformOptions: { store: false, modelOption: true, instructions: "provider prompt\nruntime prompt" },
        headers: {
          "x-session-affinity": "ses_oauth",
          "User-Agent": "opencode/test-version",
        },
      },
    },
    {
      id: "workflow-opencode-small-request",
      actual: workflow,
      expected: {
        system: ["provider prompt\nworkflow system"],
        messages: [{ role: "user", content: "workflow hello" }],
        tools: {},
        params: {
          temperature: 0.2,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 1000,
          options: { store: false, small: true, modelOption: true, agentOption: true },
        },
        messageTransformOptions: { store: false, small: true, modelOption: true, agentOption: true },
        headers: {
          "x-opencode-project": "proj_workflow",
          "x-opencode-session": "ses_workflow",
          "x-opencode-request": "msg_workflow",
          "x-opencode-client": "server",
          "User-Agent": "opencode/test-version",
          "x-model": "opencode",
        },
      },
    },
    {
      id: "copilot-replay-noop-tool",
      actual: copilot,
      expected: {
        system: ["provider prompt"],
        messages: [
          { role: "system", content: "provider prompt" },
          { role: "assistant", content: [{ type: "tool-call", toolCallId: "call_1" }] },
        ],
        tools: { _noop: createOpenCodeTurnProviderRequestNoopTool() },
        params: { temperature: undefined, topP: undefined, topK: undefined, maxOutputTokens: undefined, options: { store: false } },
        messageTransformOptions: { store: false },
        headers: {
          "x-session-affinity": "ses_copilot",
          "User-Agent": "opencode/test-version",
        },
      },
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.provider-request-builder" as const,
    portID: "turn.provider-request-builder" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-provider-request-builder-native-exact-fixture" as const,
    replayRef: "turn-provider-request-builder-native-exact:opencode" as const,
    fixtureID: "opencode-turn-provider-request-builder:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/llm/request.ts#LLMRequestPrep.prepare",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/permission/index.ts#merge,disabled",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/permission.ts#PermissionV2.disabled",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeTurnProviderRequestBuilderFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnProviderRequestBuilderNativeExactFixture(
  fixture: OpenCodeTurnProviderRequestBuilderNativeExactFixture,
): OpenCodeTurnProviderRequestBuilderNativeExactFixtureVerification {
  const issues: OpenCodeTurnProviderRequestBuilderNativeExactFixtureIssue[] = []
  if (
    fixture.atomID !== "opencode.turn.provider-request-builder" ||
    fixture.portID !== "turn.provider-request-builder" ||
    fixture.fixtureID !== "opencode-turn-provider-request-builder:native-exact-fixture"
  ) {
    issues.push({ id: "opencode-turn-provider-request-builder-native-exact.identity", message: "OpenCode turn request builder native fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-turn-provider-request-builder-native-exact.native-claim", message: "OpenCode turn request builder must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-turn-provider-request-builder-native-exact.lossiness", message: "OpenCode turn request builder native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/llm/request.ts", "permission/index.ts", "packages/core/src/permission.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-turn-provider-request-builder-native-exact.source", message: `OpenCode turn request builder fixture lost upstream source ${source}.` })
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeTurnProviderRequestBuilderSameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-turn-provider-request-builder-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned request builder behavior.` })
    }
  }
  const standard = fixture.cases.find((item) => item.id === "standard-request-system-tools-and-headers")
  if (
    !standard ||
    !openCodeTurnProviderRequestBuilderSameJSON(standard.actual.params.options, { plugin: "replaced" }) ||
    !openCodeTurnProviderRequestBuilderSameJSON(standard.actual.messageTransformOptions, {
      nested: { a: 1 },
      provider: { agent: true, base: true, model: true, variant: true },
      reasoning: { effort: "high" },
      replace: "agent",
    })
  ) {
    issues.push({ id: "opencode-turn-provider-request-builder-native-exact.message-transform-options", message: "Replacing params.options must not replace upstream messageTransformOptions." })
  }
  const oauth = fixture.cases.find((item) => item.id === "openai-oauth-instructions")
  if (!oauth || oauth.actual.messages.some((message) => message.role === "system") || !("instructions" in oauth.actual.messageTransformOptions)) {
    issues.push({ id: "opencode-turn-provider-request-builder-native-exact.oauth-instructions", message: "OpenAI OAuth must store system prompt in options.instructions and avoid prepending system messages." })
  }
  const noop = fixture.cases.find((item) => item.id === "copilot-replay-noop-tool")
  if (!noop || !noop.actual.tools["_noop"]) {
    issues.push({ id: "opencode-turn-provider-request-builder-native-exact.copilot-noop", message: "GitHub Copilot replay must keep a no-op tool when prior tool calls exist." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeTurnProviderRequestBuilderFingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-provider-request-builder-native-exact.fingerprint", message: "OpenCode turn request builder native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function createOpenCodeTurnProviderRequestNoopTool(): OpenCodeTurnProviderRequestBuilderTool {
  return {
    description: "Do not call this tool. It exists only for API compatibility and must never be invoked.",
    inputSchema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Unused" },
      },
    },
    execute: "async-noop",
  }
}

function model(input: Partial<OpenCodeTurnProviderRequestBuilderModel> & Pick<OpenCodeTurnProviderRequestBuilderModel, "id" | "providerID">): OpenCodeTurnProviderRequestBuilderModel {
  return {
    api: { id: input.id, npm: "@ai-sdk/openai-compatible" },
    capabilities: {},
    headers: {},
    ...input,
  }
}

function resolveTransform<TValue, TArgs extends unknown[]>(
  value: TransformValue<TValue, TArgs> | undefined,
  args: TArgs,
  fallback: TValue,
): TValue {
  if (typeof value === "function") return (value as (...items: TArgs) => TValue)(...args)
  return value ?? fallback
}

function mergeOptions(target: Record<string, unknown>, source: Record<string, unknown> | undefined): Record<string, unknown> {
  return deepMerge(target, source ?? {})
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target }
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key]
    result[key] = isPlainObject(existing) && isPlainObject(value) ? deepMerge(existing, value) : cloneValue(value)
  }
  return result
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneValue)
  if (isPlainObject(value)) return deepMerge({}, value)
  return value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.getPrototypeOf(value) === Object.prototype
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object"
}

function findLast<T>(items: T[], predicate: (item: T) => boolean): T | undefined {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index]
    if (item !== undefined && predicate(item)) return item
  }
  return undefined
}

function wildcardMatch(pattern: string, value: string): boolean {
  if (pattern === "*") return true
  const escaped = pattern.split("*").map((part) => part.replace(/[|\\{}()[\]^$+?.]/g, "\\$&"))
  return new RegExp(`^${escaped.join(".*")}$`).test(value)
}

function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)))
}

function openCodeTurnProviderRequestBuilderSameJSON(left: unknown, right: unknown): boolean {
  return openCodeTurnProviderRequestBuilderStableJSON(left) === openCodeTurnProviderRequestBuilderStableJSON(right)
}

function openCodeTurnProviderRequestBuilderFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeTurnProviderRequestBuilderStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeTurnProviderRequestBuilderStableJSON(value: unknown): string {
  return JSON.stringify(openCodeTurnProviderRequestBuilderSortStable(value))
}

function openCodeTurnProviderRequestBuilderSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeTurnProviderRequestBuilderSortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeTurnProviderRequestBuilderSortStable(entry)]),
  )
}
