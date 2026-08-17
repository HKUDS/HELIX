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

export interface GoogleProviderOptions {
  id?: string
  baseURL?: string
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

export class GoogleProviderAdapter implements LegoProviderAdapter {
  readonly id: string
  private readonly baseURL: string
  private readonly auth: ProviderAuth
  private readonly authPort: ProviderAuthPort
  private readonly headers: Record<string, string>
  private readonly modelRegistry: ProviderModelRegistryPort
  private readonly transport: ProviderTransportPort
  private readonly requestShape: ProviderRequestShapePort
  private readonly streamParser: ProviderStreamParserPort
  private readonly eventNormalizer: ProviderEventNormalizerPort

  constructor(options: GoogleProviderOptions) {
    this.id = options.id ?? "google"
    this.baseURL = (options.baseURL ?? "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "")
    this.auth = normalizeGoogleAuth(options.auth ?? (options.apiKey ? { type: "api-key", apiKey: options.apiKey } : { type: "none" }))
    this.authPort = options.authPort ?? createProviderAuthPort()
    this.headers = options.headers ?? {}
    this.modelRegistry = options.modelRegistry ?? createStaticProviderModelRegistry(this.id, options.models)
    this.transport = options.transport ?? createFetchProviderTransport(options.fetch ?? defaultProviderFetch)
    this.requestShape = options.requestShape ?? createGoogleRequestShape()
    this.streamParser = options.streamParser ?? createGoogleStreamParser()
    this.eventNormalizer = options.eventNormalizer ?? createProviderEventNormalizer()
  }

  models(): LegoModel[] {
    return this.modelRegistry.models()
  }

  async *stream(request: ProviderRequest): AsyncIterable<ProviderStreamEvent> {
    const shaped = this.requestShape.shape(request)
    const response = await this.transport.fetch(`${this.baseURL}${shaped.endpoint ?? googleEndpoint(request.model.modelID)}`, {
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

export function createGoogleProvider(options: GoogleProviderOptions): GoogleProviderAdapter {
  return new GoogleProviderAdapter(options)
}

export async function* parseGoogleStream(chunks: AsyncIterable<string>): AsyncIterable<ProviderStreamEvent> {
  let buffer = ""
  for await (const chunk of chunks) {
    buffer += chunk
    const frames = buffer.split(/\r?\n\r?\n/)
    buffer = frames.pop() ?? ""
    for (const frame of frames) {
      yield* parseGoogleFrame(frame)
    }
  }
  if (buffer.trim()) yield* parseGoogleFrame(buffer)
}

export function createGoogleRequestShape(): ProviderRequestShapePort {
  return {
    shape(request) {
      return {
        endpoint: googleEndpoint(request.model.modelID),
        body: toGoogleBody(request),
      }
    },
  }
}

export function createGoogleStreamParser(): ProviderStreamParserPort {
  return {
    parse(body) {
      return parseGoogleStream(readProviderTextChunks(body))
    },
  }
}

function toGoogleBody(request: ProviderRequest): Record<string, unknown> {
  const options = request.options ?? {}
  const generationConfig = generationConfigFrom(request, options)
  const topLevelOptions = topLevelGoogleOptions(options)
  const functionDeclarations = request.tools.map(toGoogleFunctionDeclaration)
  return {
    contents: request.messages.flatMap(toGoogleContents),
    ...(request.system.length > 0 ? { systemInstruction: { parts: [{ text: request.system.join("\n\n") }] } } : {}),
    ...(functionDeclarations.length > 0 ? { tools: [{ functionDeclarations }] } : {}),
    ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
    ...topLevelOptions,
  }
}

function generationConfigFrom(request: ProviderRequest, options: Record<string, unknown>): Record<string, unknown> {
  const config = record(options["generationConfig"])
  const output: Record<string, unknown> = {
    ...(request.model.maxOutputTokens ? { maxOutputTokens: request.model.maxOutputTokens } : {}),
  }
  for (const [key, value] of Object.entries(options)) {
    if (isTopLevelGoogleOption(key) || key === "generationConfig") continue
    output[key] = value
  }
  return { ...output, ...(config ?? {}) }
}

function topLevelGoogleOptions(options: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {}
  for (const key of ["toolConfig", "safetySettings", "cachedContent", "serviceTier", "store"]) {
    if (key in options) output[key] = options[key]
  }
  return output
}

function isTopLevelGoogleOption(key: string): boolean {
  return key === "toolConfig" || key === "safetySettings" || key === "cachedContent" || key === "serviceTier" || key === "store"
}

function toGoogleContents(message: LegoMessage): Record<string, unknown>[] {
  if (message.role === "tool") return [{ role: "user", parts: message.parts.map(toGoogleFunctionResponsePart) }]
  if (message.role === "synthetic") return [{ role: "user", parts: [{ text: textFromParts(message.parts) }] }]
  if (message.role === "shell") return [{ role: "user", parts: [{ text: message.output }] }]

  const role = message.role === "assistant" ? "model" : "user"
  const parts = message.parts.flatMap(toGooglePart).filter((part) => !("functionResponse" in part))
  const toolResults = message.parts
    .filter((part): part is Extract<LegoMessagePart, { type: "tool_result" }> => part.type === "tool_result")
    .map((part) => ({ role: "user", parts: [toGoogleFunctionResponsePart(part)] }))
  return [...(parts.length > 0 ? [{ role, parts }] : []), ...toolResults]
}

function toGooglePart(part: LegoMessagePart): Record<string, unknown>[] {
  if (part.type === "text" || part.type === "reasoning") return [{ text: part.text }]
  if (part.type === "tool_call") {
    return [
      {
        functionCall: {
          id: part.toolCallID,
          name: part.toolName,
          args: part.input,
        },
      },
    ]
  }
  if (part.type === "tool_result") return [toGoogleFunctionResponsePart(part)]
  if (part.type === "compaction") return [{ text: part.summary }]
  if (part.type === "custom") return [{ text: part.display ?? JSON.stringify(part.data) }]
  return []
}

function toGoogleFunctionResponsePart(part: Extract<LegoMessagePart, { type: "tool_result" }>): Record<string, unknown> {
  return {
    functionResponse: {
      id: part.toolCallID,
      name: part.toolName,
      response: toolResponseObject(part),
    },
  }
}

function toolResponseObject(part: Extract<LegoMessagePart, { type: "tool_result" }>): Record<string, unknown> {
  const details = record(part.details)
  const content = textFromParts(part.content)
  if (details && content) return { ...details, content }
  if (details) return details
  return { content }
}

function toGoogleFunctionDeclaration(tool: LegoToolDefinition): Record<string, unknown> {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters ?? { type: "object", additionalProperties: true },
  }
}

async function* parseGoogleFrame(frame: string): AsyncIterable<ProviderStreamEvent> {
  const payloads = frame
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
  for (const payload of payloads) {
    if (!payload || payload === "[DONE]") continue
    const parsed = JSON.parse(payload) as Record<string, unknown>
    for (const candidate of arrayOfRecords(parsed["candidates"])) {
      const content = record(candidate["content"])
      for (const part of arrayOfRecords(content?.["parts"])) {
        const text = stringValue(part["text"])
        if (text) yield part["thought"] === true ? { type: "reasoning", text } : { type: "text", text }
        const functionCall = record(part["functionCall"])
        const name = stringValue(functionCall?.["name"])
        if (name) {
          const id = stringValue(functionCall?.["id"])
          yield {
            type: "tool_call",
            toolName: name,
            input: record(functionCall?.["args"]) ?? {},
            ...(id ? { id } : {}),
          }
        }
      }
      const finishReason = stringValue(candidate["finishReason"])
      if (finishReason) {
        const usage = usageFromGoogle(parsed)
        yield {
          type: "finish",
          finish: normalizeFinishReason(finishReason),
          ...(usage ? { usage } : {}),
        }
      }
    }
  }
}

function usageFromGoogle(chunk: Record<string, unknown>): TokenUsage | undefined {
  const usage = record(chunk["usageMetadata"])
  if (!usage) return undefined
  const input = numberValue(usage["promptTokenCount"])
  const output = numberValue(usage["candidatesTokenCount"])
  if (input === undefined || output === undefined) return undefined
  const reasoning = numberValue(usage["thoughtsTokenCount"])
  const cacheRead = numberValue(usage["cachedContentTokenCount"])
  return {
    input,
    output,
    ...(reasoning === undefined ? {} : { reasoning }),
    ...(cacheRead === undefined ? {} : { cacheRead }),
  }
}

function googleModelPath(modelID: string): string {
  const path = modelID.startsWith("models/") || modelID.startsWith("tunedModels/") ? modelID : `models/${modelID}`
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")
}

function googleEndpoint(modelID: string): string {
  return `/${googleModelPath(modelID)}:streamGenerateContent?alt=sse`
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

function normalizeFinishReason(reason: string): string {
  if (reason === "STOP") return "stop"
  if (reason === "MAX_TOKENS") return "length"
  return reason.toLowerCase()
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

function normalizeGoogleAuth(auth: ProviderAuth): ProviderAuth {
  if (auth.type !== "api-key") return auth
  return {
    ...auth,
    header: auth.header ?? "x-goog-api-key",
    prefix: auth.prefix ?? "",
  }
}
