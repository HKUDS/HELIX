import type {
  LegoMessage,
  LegoMessagePart,
  LegoModel,
  LegoProviderAdapter,
  LegoToolDefinition,
  ProviderRequest,
  ProviderStreamEvent,
  TokenUsage,
} from "@helix/contracts"
import {
  createFetchProviderTransport,
  createProviderEventNormalizer,
  createProviderAuthPort,
  createStaticProviderModelRegistry,
  defaultProviderFetch,
  readProviderTextChunks,
  type ProviderAuth,
  type ProviderAuthPort,
  type ProviderEventNormalizerPort,
  type ProviderFetch,
  type ProviderFetchInit,
  type ProviderFetchResponse,
  type ProviderModelRegistryPort,
  type ProviderRequestShapePort,
  type ProviderStreamParserPort,
  type ProviderTransportPort,
} from "./ports"

export type { ProviderAuth, ProviderFetch, ProviderFetchInit, ProviderFetchResponse } from "./ports"

export interface OpenAICompatibleProviderOptions {
  id?: string
  baseURL?: string
  endpoint?: string
  auth?: ProviderAuth
  authPort?: ProviderAuthPort
  apiKey?: string
  headers?: Record<string, string>
  models: Array<string | (Partial<LegoModel> & { modelID: string })>
  fetch?: ProviderFetch
  transport?: ProviderTransportPort
  modelRegistry?: ProviderModelRegistryPort
  requestShape?: ProviderRequestShapePort
  streamParser?: ProviderStreamParserPort
  eventNormalizer?: ProviderEventNormalizerPort
}

interface OpenAIToolCallBuffer {
  id?: string
  name?: string
  arguments: string
  emitted?: boolean
}

export class OpenAICompatibleProviderAdapter implements LegoProviderAdapter {
  readonly id: string
  private readonly baseURL: string
  private readonly endpoint: string
  private readonly auth: ProviderAuth
  private readonly authPort: ProviderAuthPort
  private readonly headers: Record<string, string>
  private readonly modelRegistry: ProviderModelRegistryPort
  private readonly transport: ProviderTransportPort
  private readonly requestShape: ProviderRequestShapePort
  private readonly streamParser: ProviderStreamParserPort
  private readonly eventNormalizer: ProviderEventNormalizerPort

  constructor(options: OpenAICompatibleProviderOptions) {
    this.id = options.id ?? "openai-compatible"
    this.baseURL = (options.baseURL ?? "https://api.openai.com/v1").replace(/\/+$/, "")
    this.endpoint = options.endpoint ?? "/chat/completions"
    this.auth = options.auth ?? (options.apiKey ? { type: "api-key", apiKey: options.apiKey } : { type: "none" })
    this.authPort = options.authPort ?? createProviderAuthPort()
    this.headers = options.headers ?? {}
    this.modelRegistry = options.modelRegistry ?? createStaticProviderModelRegistry(this.id, options.models)
    this.transport = options.transport ?? createFetchProviderTransport(options.fetch ?? defaultProviderFetch)
    this.requestShape = options.requestShape ?? createOpenAICompatibleRequestShape()
    this.streamParser = options.streamParser ?? createOpenAICompatibleStreamParser()
    this.eventNormalizer = options.eventNormalizer ?? createProviderEventNormalizer()
  }

  models(): LegoModel[] {
    return this.modelRegistry.models()
  }

  async *stream(request: ProviderRequest): AsyncIterable<ProviderStreamEvent> {
    const shaped = this.requestShape.shape(request)
    const response = await this.transport.fetch(`${this.baseURL}${shaped.endpoint ?? this.endpoint}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
        ...this.authPort.headers(this.auth),
        ...this.headers,
        ...(shaped.headers ?? {}),
      },
      body: JSON.stringify(shaped.body),
      ...(request.signal ? { signal: request.signal } : {}),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Provider ${this.id} request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ""}): ${text}`)
    }
    if (!response.body) throw new Error(`Provider ${this.id} response did not include a stream body`)
    yield* this.eventNormalizer.normalize(this.streamParser.parse(response.body), { model: request.model })
  }
}

export function createOpenAICompatibleProvider(options: OpenAICompatibleProviderOptions): OpenAICompatibleProviderAdapter {
  return new OpenAICompatibleProviderAdapter(options)
}

export async function* parseOpenAICompatibleStream(chunks: AsyncIterable<string>): AsyncIterable<ProviderStreamEvent> {
  const toolCalls = new Map<number, OpenAIToolCallBuffer>()
  let buffer = ""
  for await (const chunk of chunks) {
    buffer += chunk
    const frames = buffer.split(/\r?\n\r?\n/)
    buffer = frames.pop() ?? ""
    for (const frame of frames) {
      yield* parseSSEFrame(frame, toolCalls)
    }
  }
  if (buffer.trim()) yield* parseSSEFrame(buffer, toolCalls)
}

export function createOpenAICompatibleRequestShape(): ProviderRequestShapePort {
  return {
    shape(request) {
      return { body: toOpenAIChatBody(request) }
    },
  }
}

export function createOpenAICompatibleStreamParser(): ProviderStreamParserPort {
  return {
    parse(body) {
      return parseOpenAICompatibleStream(readProviderTextChunks(body))
    },
  }
}

function toOpenAIChatBody(request: ProviderRequest): Record<string, unknown> {
  const tools = request.tools.map(toOpenAITool)
  return {
    model: request.model.modelID,
    stream: true,
    messages: [
      ...request.system.map((content) => ({ role: "system", content })),
      ...request.messages.flatMap(toOpenAIMessages),
    ],
    ...(tools.length > 0 ? { tools } : {}),
    ...(request.options ?? {}),
  }
}

function toOpenAIMessages(message: LegoMessage): Record<string, unknown>[] {
  if (message.role === "tool") return message.parts.map((part) => toOpenAIToolResultMessage(part))
  if (message.role === "synthetic") return [{ role: "system", content: textFromParts(message.parts) }]
  if (message.role === "shell") return [{ role: "tool", tool_call_id: message.id, content: message.output }]
  const content = textFromParts(message.parts.filter((part) => part.type !== "tool_call" && part.type !== "tool_result"))
  const toolCalls = message.parts.filter((part): part is Extract<LegoMessagePart, { type: "tool_call" }> => part.type === "tool_call")
  const toolResults = message.parts.filter((part): part is Extract<LegoMessagePart, { type: "tool_result" }> => part.type === "tool_result")
  const assistant =
    message.role === "assistant"
      ? [
          {
            role: "assistant",
            content,
            ...(toolCalls.length > 0
              ? {
                  tool_calls: toolCalls.map((part) => ({
                    id: part.toolCallID,
                    type: "function",
                    function: { name: part.toolName, arguments: JSON.stringify(part.input) },
                  })),
                }
              : {}),
          },
        ]
      : [{ role: "user", content }]
  return [...assistant, ...toolResults.map(toOpenAIToolResultMessage)]
}

function toOpenAIToolResultMessage(part: Extract<LegoMessagePart, { type: "tool_result" }>): Record<string, unknown> {
  return {
    role: "tool",
    tool_call_id: part.toolCallID,
    content: textFromParts(part.content),
  }
}

function toOpenAITool(tool: LegoToolDefinition): Record<string, unknown> {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters ?? { type: "object", additionalProperties: true },
    },
  }
}

async function* parseSSEFrame(
  frame: string,
  toolCalls: Map<number, OpenAIToolCallBuffer>,
): AsyncIterable<ProviderStreamEvent> {
  const payloads = frame
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
  for (const payload of payloads) {
    if (!payload || payload === "[DONE]") continue
    const parsed = JSON.parse(payload) as Record<string, unknown>
    for (const choice of arrayOfRecords(parsed["choices"])) {
      const delta = record(choice["delta"])
      if (delta) {
        const content = stringValue(delta["content"])
        if (content) yield { type: "text", text: content }
        const reasoning = stringValue(delta["reasoning_content"]) ?? stringValue(delta["reasoning"])
        if (reasoning) yield { type: "reasoning", text: reasoning }
        for (const rawToolCall of arrayOfRecords(delta["tool_calls"])) {
          mergeToolCall(toolCalls, rawToolCall)
        }
      }
      const finish = stringValue(choice["finish_reason"])
      if (finish) {
        yield* flushToolCalls(toolCalls)
        const usage = usageFromChunk(parsed)
        yield {
          type: "finish",
          finish,
          ...(usage ? { usage } : {}),
        }
      }
    }
  }
}

function mergeToolCall(toolCalls: Map<number, OpenAIToolCallBuffer>, raw: Record<string, unknown>): void {
  const index = typeof raw["index"] === "number" ? raw["index"] : toolCalls.size
  const current = toolCalls.get(index) ?? { arguments: "" }
  const fn = record(raw["function"])
  const id = stringValue(raw["id"]) ?? current.id
  const name = stringValue(fn?.["name"]) ?? current.name
  toolCalls.set(index, {
    ...(id ? { id } : {}),
    ...(name ? { name } : {}),
    arguments: `${current.arguments}${stringValue(fn?.["arguments"]) ?? ""}`,
    ...(current.emitted === undefined ? {} : { emitted: current.emitted }),
  })
}

async function* flushToolCalls(toolCalls: Map<number, OpenAIToolCallBuffer>): AsyncIterable<ProviderStreamEvent> {
  for (const [index, call] of [...toolCalls.entries()].sort(([left], [right]) => left - right)) {
    if (call.emitted || !call.name) continue
    call.emitted = true
    yield {
      type: "tool_call",
      toolName: call.name,
      input: parseToolArguments(call.arguments),
      ...(call.id ? { id: call.id } : {}),
    }
  }
}

function usageFromChunk(chunk: Record<string, unknown>): TokenUsage | undefined {
  const usage = record(chunk["usage"])
  if (!usage) return undefined
  const input = numberValue(usage["prompt_tokens"] ?? usage["input_tokens"])
  const output = numberValue(usage["completion_tokens"] ?? usage["output_tokens"])
  if (input === undefined || output === undefined) return undefined
  const reasoning = numberValue(usage["reasoning_tokens"])
  const cacheRead = numberValue(usage["prompt_tokens_details"] && record(usage["prompt_tokens_details"])?.["cached_tokens"])
  return {
    input,
    output,
    ...(reasoning === undefined ? {} : { reasoning }),
    ...(cacheRead === undefined ? {} : { cacheRead }),
  }
}

function textFromParts(parts: LegoMessagePart[]): string {
  return parts
    .map((part) => {
      if (part.type === "text" || part.type === "reasoning") return part.text
      if (part.type === "tool_call") return `${part.toolName} ${JSON.stringify(part.input)}`
      if (part.type === "tool_result") return textFromParts(part.content)
      if (part.type === "compaction") return part.summary
      if (part.type === "custom") return part.display ?? JSON.stringify(part.data)
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

function parseToolArguments(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value || "{}") as unknown
    return record(parsed) ?? {}
  } catch {
    return { arguments: value }
  }
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(record(item))) : []
}

function record(value: unknown): Record<string, unknown> | undefined {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined
}
