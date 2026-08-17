import { createHash } from "node:crypto"
import {
  asSessionID,
  asToolCallID,
  type ToolCallEventPayload,
} from "@helix/contracts"
import { LegoHookHost, type HookScope } from "@helix/lego-hooks"
import type { OpenCodeHooks } from "./plugin-adapter"
import { createOpenCodeCommandRegistryBridge } from "./opencode-command-registry.ts"
import { createOpenCodeShellEnvBridge } from "./opencode-shell-env.ts"
import { createOpenCodeToolDefinitionPluginBridge } from "./opencode-tool-definition-plugin.ts"
import { createOpenCodeToolResultRenderBridge } from "./opencode-tool-result-render.ts"

export interface OpenCodePluginEventMapperRegistrationInput {
  host: LegoHookHost
  scope: HookScope
  hooks: OpenCodeHooks
}

export interface OpenCodePluginEventMapperBridge {
  register(input: OpenCodePluginEventMapperRegistrationInput): void
}

export interface OpenCodePluginEventMapperNativeExactFixtureCase {
  id:
    | "event-observer-and-tool-before"
    | "provider-request-params-and-headers"
    | "input-context-system-session-and-text-hooks"
    | "delegated-hook-bridges"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginEventMapperNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.event-mapper"
  portID: "hook.handler-chain"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-event-mapper-native-exact-fixture"
  replayRef: "plugin-event-mapper-native-exact:opencode"
  fixtureID: "opencode-plugin-event-mapper:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginEventMapperNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodePluginEventMapperNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginEventMapperNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginEventMapperNativeExactFixtureIssue[]
}

export function createOpenCodeNativePluginEventMapper(): OpenCodePluginEventMapperBridge {
  const toolDefinitionBridge = createOpenCodeToolDefinitionPluginBridge()
  const toolResultRenderBridge = createOpenCodeToolResultRenderBridge()
  const commandRegistry = createOpenCodeCommandRegistryBridge()
  const shellEnv = createOpenCodeShellEnvBridge()
  return {
    register({ host, scope, hooks }) {
      if (hooks.event) {
        scope.observe(async (event) => hooks.event?.({ event }))
      }

      if (hooks["tool.execute.before"]) {
        scope.on("tool.call", async (event) => {
          const payload = event.payload as ToolCallEventPayload
          const output = { args: payload.input }
          await hooks["tool.execute.before"]?.(
            { tool: payload.toolName, sessionID: String(payload.sessionID), callID: String(payload.toolCallID) },
            output,
          )
          payload.input = output.args
        })
      }

      if (hooks["chat.message"]) {
        scope.on("input", async (event) => {
          const input = record(event.payload)
          const output = { ...input }
          await hooks["chat.message"]?.(input, output)
          return output
        })
      }

      if (hooks["chat.params"]) {
        scope.on("provider.request.before", async (event) => {
          const payload = event.payload as Record<string, unknown>
          const output = {
            temperature: Number(payload.temperature ?? 0),
            topP: Number(payload.topP ?? 1),
            topK: Number(payload.topK ?? 0),
            maxOutputTokens: payload.maxOutputTokens as number | undefined,
            options: { ...((payload.options as Record<string, unknown> | undefined) ?? {}) },
          }
          await hooks["chat.params"]?.(payload, output)
          return { providerOptions: output }
        })
      }

      if (hooks["chat.headers"]) {
        scope.on("provider.request.before", async (event) => {
          const output = { headers: {} as Record<string, string> }
          await hooks["chat.headers"]?.(event.payload as Record<string, unknown>, output)
          return { headers: output.headers }
        })
      }

      toolResultRenderBridge.register({ host, scope, hooks })
      shellEnv.register({ host, scope, hooks })
      commandRegistry.register({ host, scope, hooks })

      if (hooks["experimental.chat.messages.transform"]) {
        scope.on("context", async (event) => {
          const input = record(event.payload)
          const output = { ...input }
          await hooks["experimental.chat.messages.transform"]?.(input, output)
          return output
        })
      }

      if (hooks["experimental.chat.system.transform"]) {
        scope.on("before_agent_start", async (event) => {
          const payload = event.payload as { systemPrompt?: string }
          const output = { system: payload.systemPrompt ? [payload.systemPrompt] : [] }
          await hooks["experimental.chat.system.transform"]?.(event.payload as Record<string, unknown>, output)
          return { systemPrompt: output.system.join("\n") }
        })
      }

      if (hooks["experimental.session.compacting"]) {
        scope.on("session.before_compact", async (event) => {
          const sessionID = event.sessionID ?? (event.payload as { sessionID?: string }).sessionID
          if (!sessionID) return
          const output: { context: string[]; prompt?: string } = { context: [] }
          await hooks["experimental.session.compacting"]?.({ sessionID: String(sessionID) }, output)
          return { context: output.context, prompt: output.prompt }
        })
      }

      if (hooks["experimental.compaction.autocontinue"]) {
        scope.on("session.compact", async (event) => {
          const output = { enabled: true }
          await hooks["experimental.compaction.autocontinue"]?.(event.payload as Record<string, unknown>, output)
          return { autocontinue: output.enabled }
        })
      }

      if (hooks["experimental.text.complete"]) {
        scope.on("message.update", async (event) => {
          const payload = record(event.payload)
          const output = { text: String(payload["text"] ?? "") }
          await hooks["experimental.text.complete"]?.(
            {
              sessionID: String(event.sessionID ?? payload["sessionID"] ?? ""),
              messageID: String(payload["messageID"] ?? ""),
              partID: String(payload["partID"] ?? ""),
            },
            output,
          )
          return { text: output.text }
        })
      }

      if (hooks["tool.definition"]) {
        scope.on("tool.definition", async (event) => {
          const payload = record(event.payload)
          const tool = await toolDefinitionBridge.apply({
            tool: {
              id: String(payload["toolID"] ?? payload["name"] ?? ""),
              description: String(payload["description"] ?? ""),
              parameters: payload["parameters"],
              jsonSchema: payload["jsonSchema"],
            },
            hooks: [hooks],
          })
          const output: { description: string; parameters: unknown; jsonSchema?: unknown } = {
            description: tool.description,
            parameters: tool.parameters,
          }
          if (tool.jsonSchema !== undefined) output.jsonSchema = tool.jsonSchema
          return output
        })
      }
    },
  }
}

export async function captureOpenCodePluginEventMapperNativeExactFixture(): Promise<OpenCodePluginEventMapperNativeExactFixture> {
  const eventHost = new LegoHookHost({ errorMode: "throw" })
  const eventScope = eventHost.createScope({ id: "event-mapper-plugin", scope: "project" })
  const observerSeen: string[] = []
  createOpenCodeNativePluginEventMapper().register({
    host: eventHost,
    scope: eventScope,
    hooks: {
      event: ({ event }) => {
        observerSeen.push(event.type)
      },
      "tool.execute.before": (_input, output) => {
        output.args = { ...output.args, patched: true }
      },
    },
  })
  const toolPayload: ToolCallEventPayload = {
    toolName: "bash",
    sessionID: asSessionID("ses_evt"),
    toolCallID: asToolCallID("call_evt"),
    input: { command: "pwd" },
  }
  const toolResult = await eventHost.emit({ type: "tool.call", timestamp: 1, payload: toolPayload })

  const providerHost = new LegoHookHost({ errorMode: "throw" })
  const providerScope = providerHost.createScope({ id: "provider-plugin", scope: "project" })
  const providerCalls: string[] = []
  createOpenCodeNativePluginEventMapper().register({
    host: providerHost,
    scope: providerScope,
    hooks: {
      "chat.params": (_input, output) => {
        providerCalls.push("params")
        output.temperature = 0.75
        output.options = { ...(output.options as Record<string, unknown>), patched: true }
      },
      "chat.headers": (_input, output) => {
        providerCalls.push("headers")
        output.headers["x-opencode-plugin"] = "1"
      },
    },
  })
  const providerResult = await providerHost.emit({
    type: "provider.request.before",
    timestamp: 2,
    payload: { temperature: 0, topP: 1, topK: 0, maxOutputTokens: 128, options: { seed: "base" } },
  })

  const transformHost = new LegoHookHost({ errorMode: "throw" })
  const transformScope = transformHost.createScope({ id: "transform-plugin", scope: "project" })
  createOpenCodeNativePluginEventMapper().register({
    host: transformHost,
    scope: transformScope,
    hooks: {
      "chat.message": (_input, output) => {
        output["text"] = "patched input"
      },
      "experimental.chat.messages.transform": (_input, output) => {
        output["messages"] = [{ role: "user", content: "patched context" }]
      },
      "experimental.chat.system.transform": (_input, output) => {
        output.system.push("plugin system")
      },
      "experimental.session.compacting": (input, output) => {
        output.context.push(`compact:${input.sessionID}`)
        output.prompt = "compact prompt"
      },
      "experimental.compaction.autocontinue": (_input, output) => {
        output.enabled = false
      },
      "experimental.text.complete": (input, output) => {
        output.text = `complete:${input.partID}`
      },
    },
  })
  const transformActual = {
    input: await transformHost.emit({ type: "input", timestamp: 3, payload: { text: "hello", source: "interactive" } }),
    context: await transformHost.emit({ type: "context", timestamp: 4, payload: { messages: [] } }),
    system: await transformHost.emit({ type: "before_agent_start", timestamp: 5, payload: { systemPrompt: "base system" } }),
    compact: await transformHost.emit({
      type: "session.before_compact",
      sessionID: asSessionID("ses_compact"),
      timestamp: 6,
      payload: {},
    }),
    autocontinue: await transformHost.emit({ type: "session.compact", timestamp: 7, payload: { overflow: true } }),
    text: await transformHost.emit({
      type: "message.update",
      sessionID: asSessionID("ses_text"),
      timestamp: 8,
      payload: { messageID: "msg_text", partID: "part_text", text: "draft" },
    }),
  }

  const delegatedHost = new LegoHookHost({ errorMode: "throw" })
  const delegatedScope = delegatedHost.createScope({ id: "delegated-plugin", scope: "project" })
  createOpenCodeNativePluginEventMapper().register({
    host: delegatedHost,
    scope: delegatedScope,
    hooks: {
      "command.execute.before": (_input, output) => {
        output.parts.push({ type: "text", text: "command mapped" })
      },
      "tool.definition": (_input, output) => {
        output.description = "definition mapped"
        output.parameters = { type: "object" }
      },
    },
  })
  const delegatedActual = {
    command: await delegatedHost.emit({
      type: "command.before",
      sessionID: asSessionID("ses_cmd"),
      timestamp: 9,
      payload: { command: "/build", arguments: "--fast" },
    }),
    toolDefinition: await delegatedHost.emit({
      type: "tool.definition",
      timestamp: 10,
      payload: { toolID: "bash", description: "Bash", parameters: { type: "string" } },
    }),
  }

  const cases: OpenCodePluginEventMapperNativeExactFixtureCase[] = [
    {
      id: "event-observer-and-tool-before",
      actual: {
        observerSeen,
        toolPayload,
        toolResult,
      },
      expected: {
        observerSeen: ["tool.call"],
        toolPayload: {
          toolName: "bash",
          sessionID: "ses_evt",
          toolCallID: "call_evt",
          input: { command: "pwd", patched: true },
        },
        toolResult: undefined,
      },
    },
    {
      id: "provider-request-params-and-headers",
      actual: { providerCalls, providerResult },
      expected: {
        providerCalls: ["params", "headers"],
        providerResult: {
          providerOptions: {
            temperature: 0.75,
            topP: 1,
            topK: 0,
            maxOutputTokens: 128,
            options: { seed: "base", patched: true },
          },
          headers: { "x-opencode-plugin": "1" },
        },
      },
    },
    {
      id: "input-context-system-session-and-text-hooks",
      actual: transformActual,
      expected: {
        input: { text: "patched input", source: "interactive" },
        context: { messages: [{ role: "user", content: "patched context" }] },
        system: { systemPrompt: "base system\nplugin system" },
        compact: { context: ["compact:ses_compact"], prompt: "compact prompt" },
        autocontinue: { autocontinue: false },
        text: { text: "complete:part_text" },
      },
    },
    {
      id: "delegated-hook-bridges",
      actual: delegatedActual,
      expected: {
        command: { parts: [{ type: "text", text: "command mapped" }] },
        toolDefinition: {
          description: "definition mapped",
          parameters: { type: "object" },
        },
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.plugin.event-mapper" as const,
    portID: "hook.handler-chain" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-plugin-event-mapper-native-exact-fixture" as const,
    replayRef: "plugin-event-mapper-native-exact:opencode" as const,
    fixtureID: "opencode-plugin-event-mapper:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks.event,Hooks.chat.message,Hooks.chat.params,Hooks.chat.headers,Hooks.tool.execute.before,Hooks.experimental",
      "anomalyco/opencode:packages/core/src/plugin.ts#Plugin.trigger,Plugin.triggerFor",
      "helix:packages/adapters-opencode/src/plugin-atoms.ts#createOpenCodePluginEventMapper",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodePluginEventMapperFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodePluginEventMapperNativeExactFixture(
  fixture: OpenCodePluginEventMapperNativeExactFixture,
): OpenCodePluginEventMapperNativeExactFixtureVerification {
  const issues: OpenCodePluginEventMapperNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-event-mapper.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.event-mapper" || fixture.portID !== "hook.handler-chain") {
    add("opencode-plugin-event-mapper.target", "Fixture must target opencode.plugin.event-mapper and hook.handler-chain.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-plugin-event-mapper.native-claim", "Plugin event mapper fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-plugin-event-mapper.lossiness", "Native plugin event mapper fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/plugin/src/index.ts", "packages/core/src/plugin.ts", "packages/adapters-opencode/src/plugin-atoms.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-event-mapper.source-ref", `Missing source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginEventMapperSameJSON(item.actual, item.expected)) {
      add("opencode-plugin-event-mapper.case", "Case actual output must match expected OpenCode plugin event mapping behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginEventMapperFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-event-mapper.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function record(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function openCodePluginEventMapperSameJSON(left: unknown, right: unknown): boolean {
  return openCodePluginEventMapperStableJSON(left) === openCodePluginEventMapperStableJSON(right)
}

function openCodePluginEventMapperFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodePluginEventMapperStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodePluginEventMapperStableJSON(value: unknown): string {
  return JSON.stringify(openCodePluginEventMapperSortStable(value))
}

function openCodePluginEventMapperSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodePluginEventMapperSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodePluginEventMapperSortStable(entry)]),
  )
}
