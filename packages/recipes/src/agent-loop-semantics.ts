import {
  createID,
  type EventEnvelope,
  type LegoMessage,
  type LegoMessagePart,
  type LegoProviderAdapter,
  type LegoToolDefinition,
  type ProviderRequest,
} from "@helix/contracts"
import { loadOpenCodePlugin } from "@helix/adapters-opencode"
import { loadPiExtension } from "@helix/adapters-pi"
import { loadNanobotPlugin } from "@helix/adapters-nanobot"
import { createAssistantMessage, createUserMessage } from "@helix/lego-session"
import { assembleNanobotHarness, assembleOpenCodeHarness, assemblePiMonoHarness, type AssembledHarness, type HarnessProduct } from "./harness"

export interface AgentLoopSemanticReplayInput {
  cwd?: string
}

export interface AgentLoopSemanticCheck {
  id: string
  ok: boolean
  message: string
  details?: unknown
}

export interface AgentLoopSemanticProductReplay {
  product: HarnessProduct
  ok: boolean
  events: string[]
  requests: ProviderRequestSnapshot[]
  result: {
    sessionID: string
    steps: number
    finish?: string
    retries?: number
    syntheticContinues?: number
    contextCompacted?: boolean
    transcriptRoles: string[]
  }
  checks: AgentLoopSemanticCheck[]
}

export interface AgentLoopSemanticReplayReport {
  ok: boolean
  products: AgentLoopSemanticProductReplay[]
  issues: AgentLoopSemanticCheck[]
}

export interface ProviderRequestSnapshot {
  call: number
  phase: "retry-error" | "tool" | "length" | "final"
  system: string[]
  roles: string[]
  messageText: string
  tools: string[]
  options?: Record<string, unknown>
}

interface SemanticProviderCapture {
  requests: ProviderRequestSnapshot[]
}

export async function runAgentLoopSemanticReplay(
  input: AgentLoopSemanticReplayInput = {},
): Promise<AgentLoopSemanticReplayReport> {
  const cwd = input.cwd ?? process.cwd()
  const products = [
    await replayProduct(assembleOpenCodeHarness({ cwd })),
    await replayProduct(assemblePiMonoHarness({ cwd })),
    await replayProduct(assembleNanobotHarness({ cwd })),
  ]
  const issues = products.flatMap((product) => product.checks.filter((check) => !check.ok))
  return {
    ok: issues.length === 0,
    products,
    issues,
  }
}

async function replayProduct(harness: AssembledHarness): Promise<AgentLoopSemanticProductReplay> {
  const product = harness.product
  const eventLog: EventEnvelope[] = []
  harness.hooks.observe((event) => {
    eventLog.push(event)
  })
  await installSemanticHooks(harness)

  const session = await harness.session.create({ title: `${product} semantic replay` })
  await harness.session.appendMessage(
    createUserMessage({ sessionID: session.id, text: `${product} old user ${"x".repeat(240)}` }),
  )
  await harness.session.appendMessage(
    createAssistantMessage({ sessionID: session.id, text: `${product} old answer ${"y".repeat(240)}` }),
  )

  const capture: SemanticProviderCapture = { requests: [] }
  const result = await harness.runTurn({
    sessionID: session.id,
    text: `semantic prompt for ${product}`,
    provider: createSemanticProvider(product, capture),
    maxSteps: 5,
    maxInputTokens: 24,
    compactionKeepMessages: 1,
    maxRetries: 1,
    retryDelayMs: 0,
    syntheticContinue: true,
    syntheticContinueText: `${product}:semantic-continue`,
    maxSyntheticContinues: 2,
  })

  const events = eventLog.map((event) => event.type)
  const assistantText = messageText(result.assistantMessage)
  const requestText = capture.requests.map((request) => request.messageText).join("\n")
  const responsePayloads = eventLog
    .filter((event) => event.type === "provider.response.after")
    .map((event) => record(event.payload) ?? {})
  const providerOptions = capture.requests.map((request) => request.options).filter(isRecord)
  const transcriptRoles = result.transcript.map((message) => message.role)
  const checks: AgentLoopSemanticCheck[] = [
    check(
      `${product}:input-transform`,
      messageText(result.userMessage).includes(inputMarker(product)),
      `${product} personality transforms interactive input before persistence.`,
      messageText(result.userMessage),
    ),
    check(
      `${product}:system-transform`,
      capture.requests.some((request) => request.system.join("\n").includes(systemMarker(product))),
      `${product} personality transforms the provider system prompt.`,
      capture.requests.map((request) => request.system),
    ),
    check(
      `${product}:provider-options`,
      providerOptions.some((options) => hasProviderOption(product, options)),
      `${product} personality patches provider request options.`,
      providerOptions,
    ),
    check(
      `${product}:retry`,
      result.retries === 1 &&
        responsePayloads.some((payload) => record(payload["error"])?.["message"] === `${product} transient semantic outage`),
      `${product} agent loop retries a transient provider stream failure and reports it through provider.response.after.`,
      responsePayloads,
    ),
    check(
      `${product}:compaction`,
      result.contextCompacted === true &&
        events.includes("session.before_compact") &&
        events.includes("session.compacted") &&
        requestText.includes(compactionMarker(product)) &&
        !requestText.includes(`${product} old answer`),
      `${product} context overflow compacts old transcript content through product hooks.`,
      { contextCompacted: result.contextCompacted, events, requestText },
    ),
    check(
      `${product}:synthetic-continue`,
      (result.syntheticContinues ?? 0) >= 2 &&
        capture.requests.some((request) => request.phase === "final" && request.messageText.includes(`${product}:semantic-continue`)),
      `${product} uses synthetic continue for compaction autocontinue and length continuation.`,
      { syntheticContinues: result.syntheticContinues, requests: capture.requests },
    ),
    check(
      `${product}:tool-mapping`,
      assistantText.includes(`${product}:tool-result`) &&
        assistantText.includes(toolBeforeMarker(product)) &&
        assistantText.includes(toolAfterMarker(product)) &&
        events.includes("permission.ask") &&
        result.blockedTools.length === 0,
      `${product} maps permission, tool argument mutation, execution, and result patching into the common transcript.`,
      { assistantText, blockedTools: result.blockedTools },
    ),
    check(
      `${product}:multi-step`,
      result.steps === 3 &&
        result.finish === "stop" &&
        capture.requests.some((request) => request.phase === "length" && request.messageText.includes(`${product}:tool-result`)),
      `${product} feeds tool results into the next provider step and finishes after continuation.`,
      { steps: result.steps, finish: result.finish, requests: capture.requests },
    ),
    check(
      `${product}:lifecycle-order`,
      hasOrderedSubsequence(events, [
        "input",
        "session.start",
        "before_agent_start",
        "context",
        "agent.start",
        "provider.request.before",
        "tool.call",
        "permission.ask",
        "tool.execution_start",
        "tool.result",
        "tool.execution_end",
        "provider.response.after",
        "agent.end",
        "session.idle",
      ]),
      `${product} emits the full turn/provider/tool lifecycle in a stable order.`,
      events,
    ),
    check(
      `${product}:transcript-tail`,
      transcriptRoles.slice(-2).join(",") === "user,assistant" && result.finish === "stop",
      `${product} persists the semantic replay as a normal user/assistant turn.`,
      { transcriptRoles, finish: result.finish },
    ),
  ]

  return {
    product,
    ok: checks.every((item) => item.ok),
    events,
    requests: capture.requests,
    result: {
      sessionID: String(result.session.id),
      steps: result.steps,
      ...(result.finish ? { finish: result.finish } : {}),
      ...(result.retries === undefined ? {} : { retries: result.retries }),
      ...(result.syntheticContinues === undefined ? {} : { syntheticContinues: result.syntheticContinues }),
      ...(result.contextCompacted === undefined ? {} : { contextCompacted: result.contextCompacted }),
      transcriptRoles,
    },
    checks,
  }
}

async function installSemanticHooks(harness: AssembledHarness): Promise<void> {
  if (harness.product === "opencode") {
    harness.hooks.registerTool(createSemanticTool(harness.product))
    await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: () => ({
        "chat.message": (input, output) => {
          output["action"] = "transform"
          output["text"] = `${String(input["text"] ?? "")} ${inputMarker("opencode")}`
        },
        "chat.params": (_input, output) => {
          output["temperature"] = 0.125
          output["opencodeSemantic"] = true
          output["options"] = { ...(record(output["options"]) ?? {}), opencodeNested: true }
        },
        "chat.headers": (_input, output) => {
          output.headers["x-opencode-semantic"] = "1"
        },
        "permission.ask": (_input, output) => {
          output.status = "allow"
        },
        "tool.execute.before": (input, output) => {
          if (input.tool !== "semanticAsk") return
          output.args["text"] = `${String(output.args["text"] ?? "")}${toolBeforeMarker("opencode")}`
        },
        "tool.execute.after": (input, output) => {
          if (input.tool !== "semanticAsk") return
          output.output = `${output.output}${toolAfterMarker("opencode")}`
          output.metadata = { ...(record(output.metadata) ?? {}), opencodeAfter: true }
        },
        "experimental.chat.system.transform": (_input, output) => {
          output.system.push(systemMarker("opencode"))
        },
        "experimental.session.compacting": (_input, output) => {
          output.context.push(compactionMarker("opencode"))
        },
        "experimental.compaction.autocontinue": (_input, output) => {
          output.enabled = true
        },
      }),
      pluginInput: { directory: String(harness.hooks.services.get("cwd") ?? process.cwd()) },
      source: { id: "semantic-opencode-plugin" },
    })
    return
  }

  if (harness.product === "pi-mono") {
    await loadPiExtension({
      host: harness.hooks,
      extension: (pi) => {
        pi.registerTool(createSemanticTool("pi-mono"))
        pi.on("input", (event) => ({
          action: "transform",
          text: `${String(record(event)?.["text"] ?? "")} ${inputMarker("pi-mono")}`,
        }))
        pi.on("before_agent_start", (event) => ({
          systemPrompt: `${String(record(event)?.["systemPrompt"] ?? "")}\n${systemMarker("pi-mono")}`,
        }))
        pi.on("provider_request_before", () => ({
          options: { piSemantic: true },
        }))
        pi.on("permission_ask", () => ({
          status: "allow",
        }))
        pi.on("tool_call", (event) => {
          const payload = record(event)
          const input = record(payload?.["input"])
          if (payload?.["toolName"] !== "semanticAsk" || !input) return
          input["text"] = `${String(input["text"] ?? "")}${toolBeforeMarker("pi-mono")}`
        })
        pi.on("tool_result", (event) => {
          const payload = record(event)
          if (payload?.["toolName"] !== "semanticAsk") return undefined
          return {
            content: [
              {
                id: createID("part"),
                type: "text",
                text: `${partsText((payload["content"] as LegoMessagePart[] | undefined) ?? [])}${toolAfterMarker("pi-mono")}`,
              } satisfies LegoMessagePart,
            ],
            details: { ...(record(payload["details"]) ?? {}), piAfter: true },
          }
        })
        pi.on("session_before_compact", () => ({
          summary: compactionMarker("pi-mono"),
        }))
        pi.on("session_compact", () => ({
          autocontinue: true,
        }))
      },
      source: { id: "semantic-pi-extension" },
    })
    return
  }

  await loadNanobotPlugin({
    host: harness.hooks,
    source: { id: "semantic-nanobot-plugin", scope: "nanobot" },
    plugin: (nanobot) => {
      nanobot.registerTool(createSemanticTool("nanobot"))
      nanobot.on("input", (payload) => ({
        action: "transform",
        text: `${String(record(payload)?.["text"] ?? "")} ${inputMarker("nanobot")}`,
      }))
      nanobot.on("before_agent_start", (payload) => ({
        systemPrompt: `${String(record(payload)?.["systemPrompt"] ?? "")}\n${systemMarker("nanobot")}`,
      }))
      nanobot.on("provider_request_before", () => ({
        options: { nanobotSemantic: true },
      }))
      nanobot.on("permission_ask", () => ({
        status: "allow",
      }))
      nanobot.on("tool_call", (payload) => {
        const input = record(record(payload)?.["input"])
        if (record(payload)?.["toolName"] !== "semanticAsk" || !input) return undefined
        input["text"] = `${String(input["text"] ?? "")}${toolBeforeMarker("nanobot")}`
        return undefined
      })
      nanobot.on("tool_result", (payload) => {
        const data = record(payload)
        if (data?.["toolName"] !== "semanticAsk") return undefined
        return {
          content: [
            {
              id: createID("part"),
              type: "text",
              text: `${partsText((data["content"] as LegoMessagePart[] | undefined) ?? [])}${toolAfterMarker("nanobot")}`,
            } satisfies LegoMessagePart,
          ],
          details: { ...(record(data["details"]) ?? {}), nanobotAfter: true },
        }
      })
      nanobot.on("session_before_compact", () => ({
        summary: compactionMarker("nanobot"),
      }))
      nanobot.on("session_compact", () => ({
        autocontinue: true,
      }))
    },
  })
}

function createSemanticProvider(product: HarnessProduct, capture: SemanticProviderCapture): LegoProviderAdapter {
  let calls = 0
  let successfulCalls = 0
  return {
    id: `${product}-semantic-provider`,
    models: () => [{ providerID: `${product}-semantic-provider`, modelID: "semantic-model", contextWindow: 96 }],
    async *stream(request: ProviderRequest) {
      calls++
      if (calls === 1) {
        capture.requests.push(snapshotRequest(request, calls, "retry-error"))
        throw new Error(`${product} transient semantic outage`)
      }

      const phase = successfulCalls === 0 ? "tool" : successfulCalls === 1 ? "length" : "final"
      successfulCalls++
      capture.requests.push(snapshotRequest(request, calls, phase))

      if (phase === "tool") {
        yield { type: "reasoning", text: `${product}:thinking` }
        yield { type: "text", text: `${product}:calling-tool` }
        yield { type: "tool_call", id: `${product}-semantic-tool`, toolName: "semanticAsk", input: { text: product } }
        yield { type: "finish", finish: "tool_calls", usage: { input: 1, output: 1 }, cost: 0 }
        return
      }

      if (phase === "length") {
        yield { type: "text", text: `${product}:partial` }
        yield { type: "finish", finish: "length", usage: { input: 2, output: 2 }, cost: 0 }
        return
      }

      yield { type: "text", text: `${product}:final` }
      yield { type: "finish", finish: "stop", usage: { input: 3, output: 3 }, cost: 0 }
    },
  }
}

function createSemanticTool(product: HarnessProduct): LegoToolDefinition {
  return {
    name: "semanticAsk",
    description: "Ask-gated semantic replay tool.",
    permission: (input) => ({
      status: "ask",
      action: "semantic.ask",
      subject: String(input["text"] ?? product),
    }),
    execute(_toolCallID, input) {
      return {
        content: [
          {
            id: createID("part"),
            type: "text",
            text: `${product}:tool-result:${String(input["text"] ?? "")}`,
          },
        ],
        details: { product, input: structuredClone(input) },
      }
    },
  }
}

function snapshotRequest(
  request: ProviderRequest,
  call: number,
  phase: ProviderRequestSnapshot["phase"],
): ProviderRequestSnapshot {
  const options = cloneRecord(request.options)
  return {
    call,
    phase,
    system: [...request.system],
    roles: request.messages.map((message) => message.role),
    messageText: request.messages.map(messageText).join("\n"),
    tools: request.tools.map((tool) => tool.name),
    ...(options ? { options } : {}),
  }
}

function hasProviderOption(product: HarnessProduct, options: Record<string, unknown>): boolean {
  if (product === "pi-mono") return options["piSemantic"] === true
  if (product === "nanobot") return options["nanobotSemantic"] === true
  const headers = record(options["headers"])
  return options["opencodeSemantic"] === true && options["opencodeNested"] === true && headers?.["x-opencode-semantic"] === "1"
}

function inputMarker(product: HarnessProduct): string {
  if (product === "opencode") return "[opencode-input]"
  if (product === "pi-mono") return "[pi-input]"
  return "[nanobot-input]"
}

function systemMarker(product: HarnessProduct): string {
  if (product === "opencode") return "[opencode-system]"
  if (product === "pi-mono") return "[pi-system]"
  return "[nanobot-system]"
}

function toolBeforeMarker(product: HarnessProduct): string {
  if (product === "opencode") return "|opencode-before"
  if (product === "pi-mono") return "|pi-before"
  return "|nanobot-before"
}

function toolAfterMarker(product: HarnessProduct): string {
  if (product === "opencode") return "|opencode-after"
  if (product === "pi-mono") return "|pi-after"
  return "|nanobot-after"
}

function compactionMarker(product: HarnessProduct): string {
  if (product === "opencode") return "opencode compact semantic summary"
  if (product === "pi-mono") return "pi compact semantic summary"
  return "nanobot compact semantic summary"
}

function check(id: string, ok: boolean, message: string, details?: unknown): AgentLoopSemanticCheck {
  return {
    id,
    ok,
    message,
    ...(details === undefined ? {} : { details }),
  }
}

function hasOrderedSubsequence(events: string[], sequence: string[]): boolean {
  let offset = 0
  for (const type of sequence) {
    const index = events.indexOf(type, offset)
    if (index < 0) return false
    offset = index + 1
  }
  return true
}

function messageText(message: LegoMessage): string {
  return partsText(message.parts)
}

function partsText(parts: LegoMessagePart[]): string {
  return parts.map(partText).filter(Boolean).join("\n")
}

function partText(part: LegoMessagePart): string {
  if (part.type === "text" || part.type === "reasoning") return part.text
  if (part.type === "tool_call") return `${part.toolName} ${JSON.stringify(part.input)} ${part.status}`
  if (part.type === "tool_result") return `${part.toolName} ${partsText(part.content)}`
  if (part.type === "compaction") return part.summary
  if (part.type === "custom") return part.display ?? JSON.stringify(part.data)
  return ""
}

function cloneRecord(value: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined
  const clone: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "function" || item === undefined) continue
    clone[key] = isRecord(item) ? { ...item } : item
  }
  return Object.keys(clone).length > 0 ? clone : undefined
}

function record(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
