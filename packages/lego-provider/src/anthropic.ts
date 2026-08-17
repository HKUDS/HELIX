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
  createProviderAuthPort,
  createProviderEventNormalizer,
  createStaticProviderModelRegistry,
  defaultProviderFetch,
  readProviderTextChunks,
  type ProviderAuth,
  type ProviderAuthPort,
  type ProviderEventNormalizerPort,
  type ProviderFetch,
  type ProviderModelRegistryPort,
  type ProviderRequestShapePort,
  type ProviderStreamParserPort,
  type ProviderTransportPort,
} from "./ports"

export interface AnthropicProviderOptions {
  id?: string
  baseURL?: string
  endpoint?: string
  auth?: ProviderAuth
  authPort?: ProviderAuthPort
  apiKey?: string
  version?: string
  headers?: Record<string, string>
  models: Array<string | (Partial<LegoModel> & { modelID: string })>
  fetch?: ProviderFetch
  transport?: ProviderTransportPort
  modelRegistry?: ProviderModelRegistryPort
  requestShape?: ProviderRequestShapePort
  streamParser?: ProviderStreamParserPort
  eventNormalizer?: ProviderEventNormalizerPort
}

interface AnthropicContentBlock {
  type?: string
  id?: string
  name?: string
  text?: string
  thinking?: string
  inputJson: string
}

export class AnthropicProviderAdapter implements LegoProviderAdapter {
  readonly id: string
  private readonly baseURL: string
  private readonly endpoint: string
  private readonly auth: ProviderAuth
  private readonly authPort: ProviderAuthPort
  private readonly version: string
  private readonly headers: Record<string, string>
  private readonly modelRegistry: ProviderModelRegistryPort
  private readonly transport: ProviderTransportPort
  private readonly requestShape: ProviderRequestShapePort
  private readonly streamParser: ProviderStreamParserPort
  private readonly eventNormalizer: ProviderEventNormalizerPort

  constructor(options: AnthropicProviderOptions) {
    this.id = options.id ?? "anthropic"
    this.baseURL = normalizeAnthropicMessagesBaseURL(options.baseURL ?? "https://api.anthropic.com/v1")
    this.endpoint = options.endpoint ?? "/messages"
    this.auth = normalizeAnthropicAuth(options.auth ?? (options.apiKey ? { type: "api-key", apiKey: options.apiKey } : { type: "none" }))
    this.authPort = options.authPort ?? createProviderAuthPort()
    this.version = options.version ?? "2023-06-01"
    this.headers = options.headers ?? {}
    this.modelRegistry = options.modelRegistry ?? createStaticProviderModelRegistry(this.id, options.models)
    this.transport = options.transport ?? createFetchProviderTransport(options.fetch ?? defaultProviderFetch)
    this.requestShape = options.requestShape ?? createAnthropicRequestShape()
    this.streamParser = options.streamParser ?? createAnthropicStreamParser()
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
        "anthropic-version": this.version,
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

export function createAnthropicProvider(options: AnthropicProviderOptions): AnthropicProviderAdapter {
  return new AnthropicProviderAdapter(options)
}

export function normalizeAnthropicMessagesBaseURL(baseURL: string): string {
  const trimmed = baseURL.replace(/\/+$/, "")
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`
}

export async function* parseAnthropicStream(chunks: AsyncIterable<string>): AsyncIterable<ProviderStreamEvent> {
  const blocks = new Map<number, AnthropicContentBlock>()
  let inputTokens: number | undefined
  let outputTokens: number | undefined
  let stopReason: string | undefined
  let buffer = ""

  for await (const chunk of chunks) {
    buffer += chunk
    const frames = buffer.split(/\r?\n\r?\n/)
    buffer = frames.pop() ?? ""
    for (const frame of frames) {
      for (const event of parseAnthropicFrame(frame)) {
        const data = record(event.data)
        if (!data) continue
        if (event.event === "message_start") {
          inputTokens = numberValue(record(record(data["message"])?.["usage"])?.["input_tokens"]) ?? inputTokens
          continue
        }
        if (event.event === "content_block_start") {
          const index = numberValue(data["index"]) ?? blocks.size
          const content = record(data["content_block"]) ?? {}
          const type = stringValue(content["type"])
          const id = stringValue(content["id"])
          const name = stringValue(content["name"])
          const text = stringValue(content["text"])
          const thinking = stringValue(content["thinking"])
          blocks.set(index, {
            ...(type ? { type } : {}),
            ...(id ? { id } : {}),
            ...(name ? { name } : {}),
            ...(text ? { text } : {}),
            ...(thinking ? { thinking } : {}),
            inputJson: initialInputJson(content["input"]),
          })
          continue
        }
        if (event.event === "content_block_delta") {
          const index = numberValue(data["index"]) ?? blocks.size
          const block = blocks.get(index) ?? { inputJson: "" }
          const delta = record(data["delta"]) ?? {}
          if (delta["type"] === "text_delta") {
            const text = stringValue(delta["text"])
            if (text) {
              block.text = `${block.text ?? ""}${text}`
              yield { type: "text", text }
            }
          }
          if (delta["type"] === "thinking_delta") {
            const thinking = stringValue(delta["thinking"])
            if (thinking) {
              block.thinking = `${block.thinking ?? ""}${thinking}`
              yield { type: "reasoning", text: thinking }
            }
          }
          if (delta["type"] === "input_json_delta") {
            block.inputJson = `${block.inputJson}${stringValue(delta["partial_json"]) ?? ""}`
          }
          blocks.set(index, block)
          continue
        }
        if (event.event === "content_block_stop") {
          const index = numberValue(data["index"])
          const block = index === undefined ? undefined : blocks.get(index)
          if (block?.type === "tool_use" && block.name) {
            yield {
              type: "tool_call",
              toolName: block.name,
              input: parseToolArguments(block.inputJson),
              ...(block.id ? { id: block.id } : {}),
            }
          }
          continue
        }
        if (event.event === "message_delta") {
          const delta = record(data["delta"])
          stopReason = stringValue(delta?.["stop_reason"]) ?? stopReason
          outputTokens = numberValue(record(data["usage"])?.["output_tokens"]) ?? outputTokens
          continue
        }
        if (event.event === "message_stop") {
          yield {
            type: "finish",
            finish: stopReason ?? "stop",
            ...(inputTokens !== undefined && outputTokens !== undefined
              ? { usage: { input: inputTokens, output: outputTokens } satisfies TokenUsage }
              : {}),
          }
        }
      }
    }
  }
}

export function createAnthropicRequestShape(): ProviderRequestShapePort {
  return {
    shape(request) {
      return { body: toAnthropicBody(request) }
    },
  }
}

export function createAnthropicStreamParser(): ProviderStreamParserPort {
  return {
    parse(body) {
      return parseAnthropicStream(readProviderTextChunks(body))
    },
  }
}

function toAnthropicBody(request: ProviderRequest): Record<string, unknown> {
  const tools = request.tools.map(toAnthropicTool)
  return {
    model: request.model.modelID,
    stream: true,
    system: request.system.join("\n\n"),
    messages: request.messages.flatMap(toAnthropicMessages),
    ...(tools.length > 0 ? { tools } : {}),
    ...(request.model.maxOutputTokens ? { max_tokens: request.model.maxOutputTokens } : { max_tokens: 4096 }),
    ...(request.options ?? {}),
  }
}

function toAnthropicMessages(message: LegoMessage): Record<string, unknown>[] {
  if (message.role === "synthetic") return [{ role: "user", content: textFromParts(message.parts) }]
  if (message.role === "shell") return [{ role: "user", content: message.output }]
  if (message.role === "tool") {
    return [
      {
        role: "user",
        content: message.parts.map((part) => ({
          type: "tool_result",
          tool_use_id: part.toolCallID,
          content: textFromParts(part.content),
        })),
      },
    ]
  }

  const content: Array<Record<string, unknown>> = []
  const text = textFromParts(message.parts.filter((part) => part.type !== "tool_call" && part.type !== "tool_result"))
  if (text) content.push({ type: "text", text })
  for (const part of message.parts) {
    if (part.type === "tool_call") {
      content.push({
        type: "tool_use",
        id: part.toolCallID,
        name: part.toolName,
        input: part.input,
      })
    }
  }
  const role = message.role === "assistant" ? "assistant" : "user"
  const current = content.length > 0 ? [{ role, content }] : []
  const toolResults = message.parts
    .filter((part): part is Extract<LegoMessagePart, { type: "tool_result" }> => part.type === "tool_result")
    .map((part) => ({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: part.toolCallID, content: textFromParts(part.content) }],
    }))
  return [...current, ...toolResults]
}

function toAnthropicTool(tool: LegoToolDefinition): Record<string, unknown> {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters ?? { type: "object", additionalProperties: true },
  }
}

function parseAnthropicFrame(frame: string): Array<{ event?: string; data?: unknown }> {
  const output: Array<{ event?: string; data?: unknown }> = []
  let event: string | undefined
  const dataLines: string[] = []
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice("event:".length).trim()
    if (line.startsWith("data:")) dataLines.push(line.slice("data:".length).trim())
  }
  if (dataLines.length === 0) return output
  const dataText = dataLines.join("\n")
  output.push({
    ...(event ? { event } : {}),
    data: dataText ? JSON.parse(dataText) : undefined,
  })
  return output
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

function initialInputJson(value: unknown): string {
  if (value === undefined) return ""
  const valueRecord = record(value)
  if (valueRecord && Object.keys(valueRecord).length === 0) return ""
  return JSON.stringify(value)
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

function normalizeAnthropicAuth(auth: ProviderAuth): ProviderAuth {
  if (auth.type !== "api-key") return auth
  return {
    ...auth,
    header: auth.header ?? "x-api-key",
    prefix: auth.prefix ?? "",
  }
}
