import { createHash } from "node:crypto"
import {
  prepareOpenCodeTurnProviderRequest,
  type OpenCodeTurnProviderRequestBuilderAgent,
  type OpenCodeTurnProviderRequestBuilderAuth,
  type OpenCodeTurnProviderRequestBuilderHooks,
  type OpenCodeTurnProviderRequestBuilderMessage,
  type OpenCodeTurnProviderRequestBuilderModel,
  type OpenCodeTurnProviderRequestBuilderProvider,
  type OpenCodeTurnProviderRequestBuilderProviderTransform,
  type OpenCodeTurnProviderRequestBuilderUser,
} from "./opencode-turn-provider-request-builder"

export interface OpenCodeTurnPromptAssemblerInput {
  user: OpenCodeTurnProviderRequestBuilderUser
  sessionID: string
  model: OpenCodeTurnProviderRequestBuilderModel
  agent: OpenCodeTurnProviderRequestBuilderAgent
  providerSystemPrompt: string[]
  system: string[]
  messages: OpenCodeTurnProviderRequestBuilderMessage[]
  small?: boolean
  provider: OpenCodeTurnProviderRequestBuilderProvider
  auth?: OpenCodeTurnProviderRequestBuilderAuth
  hooks?: Pick<OpenCodeTurnProviderRequestBuilderHooks, "experimental.chat.system.transform">
  isWorkflow: boolean
  providerTransform?: OpenCodeTurnProviderRequestBuilderProviderTransform
}

export interface OpenCodeTurnPromptAssemblerPrepared {
  system: string[]
  messages: OpenCodeTurnProviderRequestBuilderMessage[]
  messageTransformOptions: Record<string, unknown>
}

export interface OpenCodeTurnPromptAssemblerBridge {
  assemble(input: OpenCodeTurnPromptAssemblerInput): Promise<OpenCodeTurnPromptAssemblerPrepared>
}

export interface OpenCodeTurnPromptAssemblerNativeExactFixtureCase {
  id: "system-transform-folding" | "openai-oauth-instructions" | "workflow-small-message-policy"
  actual: OpenCodeTurnPromptAssemblerPrepared
  expected: OpenCodeTurnPromptAssemblerPrepared
}

export interface OpenCodeTurnPromptAssemblerNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.prompt-assembler"
  portID: "turn.prompt-assembler"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-prompt-assembler-native-exact-fixture"
  replayRef: "turn-prompt-assembler-native-exact:opencode"
  fixtureID: "opencode-turn-prompt-assembler:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnPromptAssemblerNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnPromptAssemblerNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnPromptAssemblerNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnPromptAssemblerNativeExactFixtureIssue[]
}

export function createOpenCodeTurnPromptAssemblerBridge(): OpenCodeTurnPromptAssemblerBridge {
  return {
    async assemble(input) {
      return assembleOpenCodeTurnPrompt(input)
    },
  }
}

export async function assembleOpenCodeTurnPrompt(input: OpenCodeTurnPromptAssemblerInput): Promise<OpenCodeTurnPromptAssemblerPrepared> {
  const prepared = await prepareOpenCodeTurnProviderRequest({
    ...input,
    tools: {},
    flags: { client: "prompt-assembler" },
  })
  return {
    system: prepared.system,
    messages: prepared.messages,
    messageTransformOptions: prepared.messageTransformOptions,
  }
}

export async function captureOpenCodeTurnPromptAssemblerNativeExactFixture(): Promise<OpenCodeTurnPromptAssemblerNativeExactFixture> {
  const bridge = createOpenCodeTurnPromptAssemblerBridge()
  const transformed = await bridge.assemble({
    user: { id: "msg_prompt", system: "user system", model: { variant: "deep" } },
    sessionID: "ses_prompt",
    model: model({
      id: "qwen-plus",
      providerID: "openai-compatible",
      options: { modelOption: true },
      variants: { deep: { reasoning: { effort: "high" } } },
    }),
    agent: { name: "build", prompt: "agent prompt", options: { agentOption: true } },
    providerSystemPrompt: ["provider prompt"],
    system: ["runtime system"],
    messages: [{ role: "user", content: "hello" }],
    provider: { id: "openai-compatible", options: {} },
    isWorkflow: false,
    providerTransform: { options: { baseOption: true } },
    hooks: {
      "experimental.chat.system.transform": (_input, output) => {
        output.system.push("plugin one", "plugin two")
      },
    },
  })
  const oauth = await bridge.assemble({
    user: { id: "msg_oauth", model: {} },
    sessionID: "ses_oauth",
    model: model({ id: "gpt-5", providerID: "openai", options: { modelOption: true } }),
    agent: { name: "oauth" },
    providerSystemPrompt: ["provider prompt"],
    system: ["runtime prompt"],
    messages: [{ role: "user", content: "oauth hello" }],
    provider: { id: "openai", options: {} },
    auth: { type: "oauth" },
    isWorkflow: false,
    providerTransform: { options: { store: false } },
  })
  const workflow = await bridge.assemble({
    user: { id: "msg_workflow", model: { variant: "unused" } },
    sessionID: "ses_workflow",
    model: model({
      id: "gpt-5",
      providerID: "opencode/gpt-5",
      options: { modelOption: true },
      variants: { unused: { reasoningEffort: "low" } },
    }),
    agent: { name: "workflow", options: { agentOption: true } },
    providerSystemPrompt: ["provider prompt"],
    system: ["workflow system"],
    messages: [{ role: "user", content: "workflow hello" }],
    small: true,
    provider: { id: "opencode", options: {} },
    isWorkflow: true,
    providerTransform: { smallOptions: { small: true } },
  })
  const cases: OpenCodeTurnPromptAssemblerNativeExactFixtureCase[] = [
    {
      id: "system-transform-folding",
      actual: transformed,
      expected: {
        system: ["agent prompt\nruntime system\nuser system", "plugin one\nplugin two"],
        messages: [
          { role: "system", content: "agent prompt\nruntime system\nuser system" },
          { role: "system", content: "plugin one\nplugin two" },
          { role: "user", content: "hello" },
        ],
        messageTransformOptions: { baseOption: true, modelOption: true, agentOption: true, reasoning: { effort: "high" } },
      },
    },
    {
      id: "openai-oauth-instructions",
      actual: oauth,
      expected: {
        system: ["provider prompt\nruntime prompt"],
        messages: [{ role: "user", content: "oauth hello" }],
        messageTransformOptions: { store: false, modelOption: true, instructions: "provider prompt\nruntime prompt" },
      },
    },
    {
      id: "workflow-small-message-policy",
      actual: workflow,
      expected: {
        system: ["provider prompt\nworkflow system"],
        messages: [{ role: "user", content: "workflow hello" }],
        messageTransformOptions: { small: true, modelOption: true, agentOption: true },
      },
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.prompt-assembler" as const,
    portID: "turn.prompt-assembler" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-prompt-assembler-native-exact-fixture" as const,
    replayRef: "turn-prompt-assembler-native-exact:opencode" as const,
    fixtureID: "opencode-turn-prompt-assembler:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/llm/request.ts#system,experimental.chat.system.transform,messages",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/system.ts#SystemPrompt.provider",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeTurnPromptAssemblerNativeExactFixture(
  fixture: OpenCodeTurnPromptAssemblerNativeExactFixture,
): OpenCodeTurnPromptAssemblerNativeExactFixtureVerification {
  const issues: OpenCodeTurnPromptAssemblerNativeExactFixtureIssue[] = []
  if (
    fixture.atomID !== "opencode.turn.prompt-assembler" ||
    fixture.portID !== "turn.prompt-assembler" ||
    fixture.fixtureID !== "opencode-turn-prompt-assembler:native-exact-fixture"
  ) {
    issues.push({ id: "opencode-turn-prompt-assembler-native-exact.identity", message: "OpenCode turn prompt assembler fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-turn-prompt-assembler-native-exact.native-claim", message: "OpenCode turn prompt assembler must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-turn-prompt-assembler-native-exact.lossiness", message: "OpenCode turn prompt assembler native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/llm/request.ts", "session/system.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-turn-prompt-assembler-native-exact.source", message: `OpenCode turn prompt assembler fixture lost upstream source ${source}.` })
    }
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-turn-prompt-assembler-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned prompt assembly behavior.` })
    }
  }
  const oauth = fixture.cases.find((item) => item.id === "openai-oauth-instructions")
  if (!oauth || oauth.actual.messages.some((message) => message.role === "system") || !("instructions" in oauth.actual.messageTransformOptions)) {
    issues.push({ id: "opencode-turn-prompt-assembler-native-exact.oauth-instructions", message: "OpenAI OAuth prompt assembly must keep system content in options.instructions without prepending a system message." })
  }
  const workflow = fixture.cases.find((item) => item.id === "workflow-small-message-policy")
  if (!workflow || workflow.actual.messages.some((message) => message.role === "system") || "reasoningEffort" in workflow.actual.messageTransformOptions) {
    issues.push({ id: "opencode-turn-prompt-assembler-native-exact.workflow-policy", message: "Workflow prompt assembly must not prepend system messages and small mode must not apply user-selected variants." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-prompt-assembler-native-exact.fingerprint", message: "OpenCode turn prompt assembler native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function model(input: Partial<OpenCodeTurnProviderRequestBuilderModel> & Pick<OpenCodeTurnProviderRequestBuilderModel, "id" | "providerID">): OpenCodeTurnProviderRequestBuilderModel {
  return {
    api: { id: input.id, npm: "@ai-sdk/openai-compatible" },
    capabilities: {},
    headers: {},
    ...input,
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
