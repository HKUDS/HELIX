import type { LegoMessage, LegoModel, SessionTranscript } from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import {
  captureOpenCodeLLMRequestSystemExactFixture,
  isOpenCodeSkillResource,
  openCodeAgentPrompt,
  openCodeAgentSkillResources,
  openCodeEnvironmentPrompt,
  openCodeInstructionResourcePrompt,
  openCodeReferencePromptText,
  openCodeSkillsPrompt,
  type OpenCodeLLMRequestSystemExactFixture,
  type OpenCodeLLMRequestSystemExactMessage,
  type OpenCodeLLMRequestSystemExactPluginOperation,
  type OpenCodePromptResource,
} from "@helix/lego-prompt/opencode-system"

export interface OpenCodePromptReferenceAttachment {
  name: string
  content: string
  path?: string
  mime?: string
  metadata?: Record<string, unknown>
}

export interface OpenCodePromptModeBuilderInput {
  product: "opencode" | string
  mode?: string
  cwd: string
  model?: LegoModel
  resources?: OpenCodePromptResource[]
  references?: OpenCodePromptReferenceAttachment[]
  transcript?: SessionTranscript
  basePrompt?: string
  userSystem?: string
  structuredOutputSystem?: string
  pluginOperations?: OpenCodeLLMRequestSystemExactPluginOperation[]
}

export interface OpenCodePromptModeBuilderResult {
  systemPrompt: string
  resources: OpenCodePromptResource[]
  references: OpenCodePromptReferenceAttachment[]
  messages: LegoMessage[]
  providerSystemChunks: string[]
  providerMessages: OpenCodeLLMRequestSystemExactMessage[]
  llmRequestFixture: OpenCodeLLMRequestSystemExactFixture
}

export interface OpenCodeNativePromptModeBuilderAtom {
  readonly manifest: {
    id: "opencode.prompt.mode-builder"
    provides: ["prompt.system-builder"]
    variant: "opencode-system-prompt"
    personality: "opencode"
  }
  build(input: OpenCodePromptModeBuilderInput, hooks?: LegoHookHost): Promise<OpenCodePromptModeBuilderResult>
}

export function createOpenCodeNativePromptModeBuilderAtom(): OpenCodeNativePromptModeBuilderAtom {
  return {
    manifest: {
      id: "opencode.prompt.mode-builder",
      provides: ["prompt.system-builder"],
      variant: "opencode-system-prompt",
      personality: "opencode",
    },
    build(input, hooks) {
      return buildOpenCodeNativePromptMode(input, hooks)
    },
  }
}

export async function buildOpenCodeNativePromptMode(input: OpenCodePromptModeBuilderInput, hooks?: LegoHookHost): Promise<OpenCodePromptModeBuilderResult> {
  const resources = input.resources ?? []
  const references = input.references ?? []
  const basePrompt = input.basePrompt ?? openCodeAgentPrompt(input.mode, input.model)
  const environmentPrompt = openCodeEnvironmentPrompt(input.cwd, input.model)
  const skillResources = openCodeAgentSkillResources(input.cwd, input.mode, resources.filter(isPromptOpenCodeSkillResource))
  const skillPrompt = skillResources.length > 0 ? openCodeSkillsPrompt(skillResources) : ""
  const providerSystemChunks = [
    environmentPrompt,
    ...resources
      .filter((resource) => !isPromptOpenCodeSkillResource(resource))
      .map((resource) => renderOpenCodeResource(resource)),
    skillPrompt,
    input.structuredOutputSystem,
  ].filter(isNonEmptyString)
  const chunks = [
    basePrompt,
    ...providerSystemChunks,
    ...references.map((reference) => renderOpenCodeReferenceAttachment(reference)),
  ].filter(isNonEmptyString)
  let systemPrompt = chunks.join("\n\n")
  const messages = input.transcript?.messages ?? []
  const llmRequestFixture = captureOpenCodeLLMRequestSystemExactFixture({
    ...(input.model ? { model: input.model } : {}),
    agentPrompt: basePrompt,
    system: providerSystemChunks,
    ...(input.userSystem ? { userSystem: input.userSystem } : {}),
    messages: providerInputMessages(messages, references),
    ...(input.pluginOperations ? { pluginOperations: input.pluginOperations } : {}),
  })

  if (hooks) {
    const result = await hooks.emit({
      type: "before_agent_start",
      ...(input.transcript?.sessionID ? { sessionID: input.transcript.sessionID } : {}),
      timestamp: Date.now(),
      payload: {
        prompt: latestUserText(messages),
        systemPrompt,
        messages,
        resources,
      },
    })
    const systemPromptOverride = readSystemPromptOverride(result)
    if (systemPromptOverride !== undefined) systemPrompt = systemPromptOverride
  }

  return {
    systemPrompt,
    resources,
    references,
    messages,
    providerSystemChunks,
    providerMessages: llmRequestFixture.preparedMessages,
    llmRequestFixture,
  }
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0
}

function isPromptOpenCodeSkillResource(resource: OpenCodePromptResource): resource is OpenCodePromptResource {
  return isOpenCodeSkillResource(resource)
}

function providerInputMessages(messages: LegoMessage[], references: OpenCodePromptReferenceAttachment[]): Array<{ role: "user" | "assistant" | "system"; content: string }> {
  return [
    ...messages.flatMap((message) => {
      if (message.role !== "user" && message.role !== "assistant") return []
      const content = message.parts
        .map((part) => (part.type === "text" ? part.text : ""))
        .filter(Boolean)
        .join("\n")
      return content ? [{ role: message.role, content }] : []
    }),
    ...references.map((reference) => ({ role: "user" as const, content: openCodeReferencePromptText(reference) })),
  ]
}

function latestUserText(messages: LegoMessage[]): string {
  const latest = [...messages].reverse().find((message) => message.role === "user")
  if (!latest) return ""
  return latest.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .filter(Boolean)
    .join("\n")
}

function renderOpenCodeResource(resource: OpenCodePromptResource): string {
  return openCodeInstructionResourcePrompt(resource)
}

function renderOpenCodeReferenceAttachment(reference: OpenCodePromptReferenceAttachment): string {
  const location = reference.path ? ` (${reference.path})` : ""
  return `# reference: ${reference.name}${location}\n${reference.content.trim()}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function readSystemPromptOverride(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  const systemPrompt = value["systemPrompt"]
  return typeof systemPrompt === "string" ? systemPrompt : undefined
}
