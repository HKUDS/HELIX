import type { LegoProviderAdapter, LegoToolDefinition, LegoToolResult, PartID, SessionID, ToolCallID } from "@helix/contracts"
import type {
  OpenCodeControlPlane,
  OpenCodeRunTurnResult,
  OpenCodeSDK,
  OpenCodeSDKAgentRegistration,
  OpenCodeSDKAuthRegistration,
  OpenCodeSDKEvent,
  OpenCodeSDKSessionPromptInput,
  OpenCodeSDKToolDefinition,
  OpenCodeSurfaceHarness,
  OpenCodeWorkspaceSurface,
} from "./opencode-product-types"
import { createOpenCodeControlPlane } from "./opencode-control-plane"
import { currentOpenCodeCwd } from "./opencode-product-utils"
import { createOpenCodeWorkspaceSurface } from "./opencode-workspace"

export function createOpenCodeSDK(
  harness: OpenCodeSurfaceHarness,
  workspace: OpenCodeWorkspaceSurface = createOpenCodeWorkspaceSurface(harness),
  controlPlane: OpenCodeControlPlane = createOpenCodeControlPlane(harness, workspace),
): OpenCodeSDK {
  const subscribers = new Set<(event: OpenCodeSDKEvent) => void>()
  const emit = (event: OpenCodeSDKEvent) => {
    for (const subscriber of subscribers) subscriber(event)
  }
  return {
    kind: "opencode-sdk",
    tool: {
      add(tool) {
        const definition = normalizeOpenCodeSDKToolDefinition(tool)
        harness.hooks.registries.tools.set(definition.name, definition)
        harness.hooks.services.set(`tool:${definition.name}`, {
          tool: definition,
          source: openCodeSDKSource("tool.add"),
        })
        emit({ type: "tool.added", tool: definition.name })
      },
      list: () => Array.from(harness.hooks.registries.tools.keys()).sort(),
    },
    auth: {
      add(auth) {
        harness.hooks.registries.auth.set(auth.provider, {
          name: auth.provider,
          config: { ...auth },
          source: openCodeSDKSource("auth.add"),
        })
        harness.hooks.services.set(`auth:${auth.provider}`, { auth: { ...auth }, source: openCodeSDKSource("auth.add") })
        emit({ type: "auth.added", provider: auth.provider, authType: auth.type })
      },
      list: () => Array.from(harness.hooks.registries.auth.keys()).sort(),
    },
    agent: {
      add(agent) {
        harness.hooks.services.set(openCodeSDKAgentServiceKey(agent.name), { ...agent })
        emit({ type: "agent.added", agent: agent.name, model: agent.model })
      },
      list: () => Array.from(harness.hooks.services.keys()).filter((key) => key.startsWith("opencode.agent:")).map((key) => key.slice("opencode.agent:".length)).sort(),
    },
    session: {
      async create(input = {}) {
        const session = await harness.session.create({
          cwd: input.cwd ?? currentOpenCodeCwd(harness),
          ...(input.title !== undefined ? { title: input.title } : {}),
          metadata: {
            ...(input.metadata ?? {}),
            ...(input.agent ? { agent: input.agent } : {}),
          },
        })
        emit({ type: "session.created", sessionID: session.id, agent: input.agent })
        return session.id
      },
      async prompt(input) {
        emit({
          type: "session.prompt",
          sessionID: input.sessionID,
          text: input.text,
          files: input.files?.map((file) => ({ mime: file.mime, uri: file.uri })),
        })
        const provider = resolveOpenCodeSDKPromptProvider(harness, input)
        const result = await harness.runTurn({
          sessionID: input.sessionID,
          text: input.text,
          provider,
          ...(input.model ? { model: input.model } : {}),
          ...(typeof input.maxSteps === "number" ? { maxSteps: input.maxSteps } : {}),
          ...(typeof input.maxRetries === "number" ? { maxRetries: input.maxRetries } : {}),
          ...(typeof input.syntheticContinue === "boolean" ? { syntheticContinue: input.syntheticContinue } : {}),
          ...(typeof input.maxSyntheticContinues === "number" ? { maxSyntheticContinues: input.maxSyntheticContinues } : {}),
        })
        emit(openCodeSDKSessionUpdatedEvent(result))
        return result
      },
      wait: async () => undefined,
      messages: (sessionID) => harness.session.messages({ sessionID }),
    },
    subscribe(listener) {
      subscribers.add(listener)
      return () => {
        subscribers.delete(listener)
      }
    },
    workspace: () => workspace.snapshot(),
    controlPlane: () => controlPlane.snapshot(),
    graph: () => [...harness.graph],
    listSessions: (input = {}) => harness.session.list({ cwd: input.cwd ?? currentOpenCodeCwd(harness) }),
    async getSession(sessionID: SessionID) {
      const [session, transcript] = await Promise.all([harness.session.get(sessionID), harness.session.messages({ sessionID })])
      return { session, transcript }
    },
    runTurn: (input) => harness.runTurn(input),
  }
}

function openCodeSDKSource(id: string) {
  return { id: `opencode-sdk:${id}`, scope: "internal" as const, order: 0 }
}

function openCodeSDKAgentServiceKey(agentName: string): string {
  return `opencode.agent:${agentName}`
}

function normalizeOpenCodeSDKToolDefinition(tool: OpenCodeSDKToolDefinition): LegoToolDefinition {
  return {
    name: tool.name,
    description: tool.description ?? tool.name,
    parameters: tool.parameters ?? tool.schema,
    async execute(toolCallID: ToolCallID | string, input: Record<string, unknown>, ctx) {
      const result = await tool.execute?.(input, { ...ctx, toolCallID })
      return normalizeOpenCodeSDKToolResult(result)
    },
  }
}

function normalizeOpenCodeSDKToolResult(result: unknown): LegoToolResult {
  if (isOpenCodeSDKToolResult(result)) return result
  if (typeof result === "string") {
    return { content: [{ id: "sdk-tool-result" as PartID, type: "text", text: result }] }
  }
  if (result === undefined) return { content: [] }
  return { content: [{ id: "sdk-tool-result" as PartID, type: "text", text: JSON.stringify(result) }], details: result }
}

function isOpenCodeSDKToolResult(result: unknown): result is LegoToolResult {
  return Boolean(result && typeof result === "object" && Array.isArray((result as { content?: unknown }).content))
}

function resolveOpenCodeSDKPromptProvider(
  harness: OpenCodeSurfaceHarness,
  input: OpenCodeSDKSessionPromptInput,
) {
  if (input.provider) return input.provider
  const defaultProvider = harness.hooks.services.get("opencode.sdk.default-provider")
  if (isProviderAdapter(defaultProvider)) return defaultProvider
  throw new Error("OpenCode SDK session.prompt requires a live provider adapter.")
}

function isProviderAdapter(value: unknown): value is LegoProviderAdapter {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { models?: unknown }).models === "function" &&
      typeof (value as { stream?: unknown }).stream === "function",
  )
}

function openCodeSDKSessionUpdatedEvent(result: OpenCodeRunTurnResult): OpenCodeSDKEvent {
  return {
    type: "session.updated",
    sessionID: result.session.id,
    messageIDs: [result.userMessage.id, result.assistantMessage.id],
    steps: result.steps,
    finish: result.finish,
  }
}

export type { OpenCodeRunTurnInput, OpenCodeRunTurnResult, OpenCodeSDK, OpenCodeSurfaceHarness } from "./opencode-product-types"
