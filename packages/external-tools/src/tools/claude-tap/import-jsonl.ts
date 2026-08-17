import type {
  ExternalToolArtifactFormat,
  ExternalToolCaptureMode,
  ExternalToolProduct,
  HeaderSummary,
  NativeCaptureArtifact,
  PromptEvidence,
  ProviderRequestEvidence,
  StageEvidence,
  StreamReconstructionSummary,
  StreamEvidence,
  ToolEvidence,
  UsageEvidence,
} from "../../types"
import { fingerprintValue, shapeSummary, sha256Text } from "../../redaction"
import { isClaudeTapCompactBundle, materializeClaudeTapCompactBundle } from "./compact"

type JSONRecord = Record<string, unknown>

export interface ClaudeTapParseResult {
  format: ExternalToolArtifactFormat
  records: JSONRecord[]
}

export interface ImportClaudeTapTraceInput {
  text: string
  artifactBytes: number
  product: ExternalToolProduct
  taskID?: string
  sourceToolVersion?: string
  captureMode?: ExternalToolCaptureMode
  generatedAt?: string
}

export function parseClaudeTapTraceText(text: string): ClaudeTapParseResult {
  const trimmed = text.trim()
  if (!trimmed) return { format: "jsonl", records: [] }
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (Array.isArray(parsed)) return { format: "json", records: parsed.filter(isRecord) }
    if (isClaudeTapCompactBundle(parsed)) return { format: "compact", records: materializeClaudeTapCompactBundle(parsed) }
    if (isRecord(parsed) && Array.isArray(parsed.records)) return { format: "json", records: parsed.records.filter(isRecord) }
  } catch {
    // Fall through to JSONL parsing.
  }
  const records = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const parsed = JSON.parse(line) as unknown
        return isRecord(parsed) ? [parsed] : []
      } catch {
        return []
      }
    })
  return { format: "jsonl", records }
}

export function importClaudeTapTrace(input: ImportClaudeTapTraceInput): NativeCaptureArtifact {
  const parsed = parseClaudeTapTraceText(input.text)
  const providerRequests = parsed.records.map(providerRequestEvidence)
  const promptEvidence = parsed.records.flatMap(promptEvidenceFromRecord)
  const toolEvidence = parsed.records.flatMap(toolEvidenceFromRecord)
  const streamEvidence = parsed.records.map(streamEvidenceFromRecord)
  const usageEvidence = parsed.records.map(usageEvidenceFromRecord).filter((item): item is UsageEvidence => item !== undefined)
  const models = [...new Set(providerRequests.map((item) => item.modelID).filter(Boolean))].sort()
  const protocols = [...new Set(providerRequests.map((item) => item.protocol).filter(Boolean))].sort()
  const statusCodes = [...new Set(providerRequests.map((item) => item.status).filter((item) => Number.isFinite(item)))].sort((left, right) => left - right)
  const streamEvents = streamEvidence.reduce((total, item) => total + item.eventCount, 0)
  return {
    schemaVersion: 1,
    artifactKind: "external-tool-native-capture",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sourceTool: "claude-tap",
    sourceToolVersion: input.sourceToolVersion ?? "unknown",
    sourceArtifact: {
      format: parsed.format,
      hash: sha256Text(input.text),
      bytes: input.artifactBytes,
    },
    product: input.product,
    taskID: input.taskID ?? "manual-import",
    captureMode: input.captureMode ?? "import-only",
    lossiness: {
      observability: "external-proxy-capture",
      rawPrompt: "fingerprint-only",
      rawProviderPayload: "shape-summary-only",
      rawToolPayload: "fingerprint-only",
      nativeInternals: "unobservable",
    },
    providerRequests,
    promptEvidence,
    toolEvidence,
    streamEvidence,
    usageEvidence,
    stageEvidence: stageEvidence({ providerRequests, promptEvidence, toolEvidence, streamEvidence, usageEvidence }),
    redactionPolicy: {
      version: 1,
      containsRawPrompt: false,
      credentials: "redacted",
      hostPaths: "normalized",
    },
    summary: {
      records: parsed.records.length,
      providerRequests: providerRequests.length,
      promptEvidence: promptEvidence.length,
      toolEvidence: toolEvidence.length,
      streamEvents,
      models,
      protocols,
      statusCodes,
    },
  }
}

function providerRequestEvidence(record: JSONRecord): ProviderRequestEvidence {
  const request = objectAt(record.request)
  const response = objectAt(record.response)
  const body = request.body
  const responseBody = response.body
  const path = stringAt(request.path)
  const requestHeaderSummary = headerSummary(request.headerSummary ?? request.headers)
  const responseHeaderSummary = headerSummary(response.headerSummary ?? response.headers)
  return {
    requestID: stringAt(record.request_id) || stringAt(record.requestId) || "unknown",
    turn: numberAt(record.turn),
    ...(stringAt(record.timestamp) ? { timestamp: stringAt(record.timestamp) } : {}),
    method: stringAt(request.method) || "GET",
    path,
    ...(stringAt(record.upstream_base_url) ? { upstreamBaseURL: stringAt(record.upstream_base_url) } : {}),
    protocol: inferProtocol(path, body),
    modelID: modelIDFromRequest(path, body),
    status: numberAt(response.status),
    durationMs: numberAt(record.duration_ms),
    ...(requestHeaderSummary ? { requestHeaderSummary } : {}),
    ...(responseHeaderSummary ? { responseHeaderSummary } : {}),
    requestShape: shapeSummary(body),
    responseShape: shapeSummary(responseBody),
  }
}

function headerSummary(value: unknown): HeaderSummary | undefined {
  const headers = objectAt(value)
  const entries = Object.entries(headers)
  if (entries.length === 0) return undefined
  const names = entries.map(([name]) => name.toLowerCase()).sort()
  const redactedNames = names.filter(secretHeaderName)
  const fingerprintInput = entries
    .map(([name, headerValue]): [string, ReturnType<typeof shapeSummary>] => [name.toLowerCase(), shapeSummary(headerValue)])
    .sort(([left], [right]) => left.localeCompare(right))
  return {
    count: names.length,
    names,
    redactedNames,
    fingerprint: fingerprintValue(fingerprintInput),
  }
}

function secretHeaderName(name: string): boolean {
  const normalized = name.toLowerCase()
  return normalized === "authorization" || normalized === "cookie" || normalized === "set-cookie" || normalized === "x-api-key" || normalized.includes("token") || normalized.includes("secret")
}

function promptEvidenceFromRecord(record: JSONRecord): PromptEvidence[] {
  const request = objectAt(record.request)
  const body = objectAt(request.body)
  if (Object.keys(body).length === 0) return []
  const path = stringAt(request.path)
  const protocol = inferProtocol(path, body)
  const tools = toolDefinitions(body)
  const system = body.system ?? body.instructions ?? body.system_instruction ?? body.systemInstruction
  const developer = roleTextPayload(body, "developer")
  const user = body.messages ?? body.input ?? body.contents ?? body.prompt
  if (system === undefined && developer === undefined && user === undefined && tools.length === 0) return []
  return [
    {
      requestID: stringAt(record.request_id) || "unknown",
      turn: numberAt(record.turn),
      protocol,
      modelID: modelIDFromRequest(path, body),
      ...(system === undefined ? {} : { systemFingerprint: fingerprintValue(system) }),
      ...(developer === undefined ? {} : { developerFingerprint: fingerprintValue(developer) }),
      ...(user === undefined ? {} : { userFingerprint: fingerprintValue(user) }),
      toolNames: tools.map((tool) => tool.name).filter(Boolean).sort(),
      toolSchemaFingerprints: tools.map((tool) => fingerprintValue(tool.raw)).sort(),
      messageCount: messageCount(body),
    },
  ]
}

function toolEvidenceFromRecord(record: JSONRecord): ToolEvidence[] {
  const request = objectAt(record.request)
  const response = objectAt(record.response)
  const requestBody = objectAt(request.body)
  const requestTools = toolDefinitions(requestBody).map((tool, index): ToolEvidence => ({
    requestID: stringAt(record.request_id) || "unknown",
    turn: numberAt(record.turn),
    source: "request-schema",
    toolName: tool.name || "unnamed_tool",
    argumentFingerprint: fingerprintValue(tool.raw),
    order: index,
  }))
  const responseTools = responseToolCalls(response.body).map((tool, index): ToolEvidence => ({
    requestID: stringAt(record.request_id) || "unknown",
    turn: numberAt(record.turn),
    source: "response-call",
    toolName: tool.name || "unnamed_tool",
    ...(tool.id ? { callID: tool.id } : {}),
    ...(tool.input === undefined ? {} : { argumentFingerprint: fingerprintValue(tool.input) }),
    order: requestTools.length + index,
  }))
  return [...requestTools, ...responseTools]
}

function streamEvidenceFromRecord(record: JSONRecord): StreamEvidence {
  const request = objectAt(record.request)
  const response = objectAt(record.response)
  const body = response.body
  const streamEvents = streamEventsFromResponse(response)
  const protocol = inferProtocol(stringAt(request.path), request.body)
  const reconstructedResponse = reconstructSSEResponse(streamEvents)
  const reconstructedFinishReason = reconstructedResponse?.finishReason
  const bodyFinishReason = finishReason(body)
  return {
    requestID: stringAt(record.request_id) || "unknown",
    turn: numberAt(record.turn),
    protocol,
    eventCount: streamEvents.length,
    ...(bodyFinishReason || reconstructedFinishReason ? { finishReason: bodyFinishReason || reconstructedFinishReason || "" } : {}),
    ...(reconstructedResponse ? { reconstructedResponse } : {}),
    responseFingerprint: streamEvents.length > 0 && reconstructedResponse ? reconstructedResponse.semanticFingerprint : fingerprintValue(body),
  }
}

function streamEventsFromResponse(response: JSONRecord): unknown[] {
  if (Array.isArray(response.sse_events)) return response.sse_events
  if (Array.isArray(response.eventstream_events)) return response.eventstream_events
  if (Array.isArray(response.bedrock_events)) return response.bedrock_events
  if (Array.isArray(response.events)) return response.events
  return []
}

function reconstructSSEResponse(events: unknown[]): StreamReconstructionSummary | undefined {
  if (events.length === 0) return undefined
  const normalized = events.map(normalizeSSEEvent)
  const eventTypes = uniqueStrings(normalized.map((event) => event.eventType).filter(Boolean)).sort()
  const chunkTypes = uniqueStrings(normalized.map((event) => event.chunkType).filter(Boolean)).sort()
  const textDeltas = normalized.map((event) => extractSSETextDelta(event.data)).filter((value): value is string => Boolean(value))
  const toolArgumentDeltas = normalized.map((event) => extractSSEToolArgumentDelta(event.data)).filter((value): value is string => Boolean(value))
  const reconstructedFinishReason = normalized.map((event) => finishReason(event.data)).find(Boolean)
  const text = textDeltas.join("")
  const toolArguments = toolArgumentDeltas.join("")
  return {
    eventTypes,
    chunkTypes,
    textBytes: Buffer.byteLength(text, "utf8"),
    ...(text ? { textFingerprint: fingerprintValue(text) } : {}),
    toolCallCount: countSSEToolCalls(normalized.map((event) => event.data)),
    toolArgumentBytes: Buffer.byteLength(toolArguments, "utf8"),
    ...(toolArguments ? { toolArgumentFingerprint: fingerprintValue(toolArguments) } : {}),
    ...(reconstructedFinishReason ? { finishReason: reconstructedFinishReason } : {}),
    semanticFingerprint: fingerprintValue({
      eventTypes,
      chunkTypes,
      text,
      toolArguments,
      finishReason: reconstructedFinishReason,
    }),
  }
}

function normalizeSSEEvent(value: unknown): { eventType: string; chunkType: string; data: unknown } {
  const record = objectAt(value)
  const chunk = objectAt(record.chunk)
  const data = parseSSEData(record.data ?? record.payload ?? chunk.bytes ?? value)
  const dataRecord = objectAt(data)
  const eventType = stringAt(record.event) || stringAt(record.eventType) || stringAt(record.type) || stringAt(record.name) || stringAt(dataRecord.type)
  const chunkType = stringAt(dataRecord.type) || stringAt(dataRecord.object) || eventType
  return { eventType, chunkType, data }
}

function parseSSEData(value: unknown): unknown {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  if (!trimmed || trimmed === "[DONE]") return {}
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    const decoded = decodeBase64JSON(trimmed)
    return decoded ?? { textDelta: trimmed }
  }
}

function decodeBase64JSON(value: string): unknown | undefined {
  if (!/^[A-Za-z0-9+/=_-]+$/.test(value) || value.length < 8) return undefined
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8").trim()
    if (!decoded.startsWith("{") && !decoded.startsWith("[")) return undefined
    return JSON.parse(decoded) as unknown
  } catch {
    return undefined
  }
}

function extractSSETextDelta(value: unknown): string {
  const record = objectAt(value)
  const type = stringAt(record.type)
  if (typeof record.delta === "string" && !isToolArgumentDeltaType(type)) return record.delta
  if (typeof record.text === "string") return record.text
  if (typeof record.textDelta === "string") return record.textDelta
  const delta = objectAt(record.delta)
  if (typeof delta.text === "string") return delta.text
  const choices = Array.isArray(record.choices) ? record.choices : []
  const chatDelta = choices.map((choice) => stringAt(objectAt(objectAt(choice).delta).content)).find(Boolean)
  if (chatDelta) return chatDelta
  const candidates = Array.isArray(record.candidates) ? record.candidates : []
  for (const candidate of candidates) {
    const parts = Array.isArray(objectAt(objectAt(candidate).content).parts) ? objectAt(objectAt(candidate).content).parts as unknown[] : []
    const text = parts.map((part) => stringAt(objectAt(part).text)).find(Boolean)
    if (text) return text
  }
  return ""
}

function extractSSEToolArgumentDelta(value: unknown): string {
  const record = objectAt(value)
  const type = stringAt(record.type)
  if (typeof record.delta === "string" && isToolArgumentDeltaType(type)) return record.delta
  if (typeof record.arguments === "string") return record.arguments
  if (typeof record.input === "string") return record.input
  const delta = objectAt(record.delta)
  if (typeof delta.partial_json === "string") return delta.partial_json
  if (typeof delta.arguments === "string") return delta.arguments
  const choices = Array.isArray(record.choices) ? record.choices : []
  for (const choice of choices) {
    const toolCalls = Array.isArray(objectAt(objectAt(choice).delta).tool_calls) ? objectAt(objectAt(choice).delta).tool_calls as unknown[] : []
    const argument = toolCalls.map((call) => stringAt(objectAt(objectAt(call).function).arguments)).find(Boolean)
    if (argument) return argument
  }
  return ""
}

function countSSEToolCalls(chunks: unknown[]): number {
  return chunks.reduce<number>((count, chunk) => {
    const record = objectAt(chunk)
    const type = stringAt(record.type)
    if (type === "function_call" || type === "tool_call" || type === "tool_use" || isToolArgumentDeltaType(type)) return count + 1
    if (typeof record.arguments === "string" || typeof record.input === "string") return count + 1
    const delta = objectAt(record.delta)
    if (typeof delta.partial_json === "string" || typeof delta.arguments === "string") return count + 1
    const choices = Array.isArray(record.choices) ? record.choices as unknown[] : []
    const chatToolCalls = choices.reduce<number>((total, choice) => {
      const toolCalls = Array.isArray(objectAt(objectAt(choice).delta).tool_calls) ? objectAt(objectAt(choice).delta).tool_calls as unknown[] : []
      return total + toolCalls.length
    }, 0)
    return count + chatToolCalls
  }, 0)
}

function isToolArgumentDeltaType(type: string): boolean {
  return type.includes("function_call_arguments") || type.includes("tool_call") || type.includes("tool_use")
}

function usageEvidenceFromRecord(record: JSONRecord): UsageEvidence | undefined {
  const response = objectAt(record.response)
  const usage = normalizeUsage(usagePayload(response.body))
  const total = usage.inputTokens + usage.outputTokens + usage.cacheReadTokens + usage.cacheCreateTokens + (usage.totalTokens ?? 0)
  if (total === 0) return undefined
  return {
    requestID: stringAt(record.request_id) || "unknown",
    turn: numberAt(record.turn),
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cacheReadTokens: usage.cacheReadTokens,
    cacheCreateTokens: usage.cacheCreateTokens,
    ...(usage.totalTokens === undefined ? {} : { totalTokens: usage.totalTokens }),
  }
}

function stageEvidence(input: {
  providerRequests: ProviderRequestEvidence[]
  promptEvidence: PromptEvidence[]
  toolEvidence: ToolEvidence[]
  streamEvidence: StreamEvidence[]
  usageEvidence: UsageEvidence[]
}): StageEvidence[] {
  return [
    {
      stage: "identity",
      observability: "aggregated",
      evidenceCount: input.providerRequests.length,
      summary: "claude-tap request ids and turn numbers are preserved; native process internals are not captured.",
      fingerprints: input.providerRequests.map((item) => fingerprintValue([item.requestID, item.turn])),
    },
    {
      stage: "session",
      observability: "inferred",
      evidenceCount: input.providerRequests.length,
      summary: "Session continuity is inferred from request order and turn numbers.",
      fingerprints: input.providerRequests.map((item) => fingerprintValue([item.turn, item.path])),
    },
    {
      stage: "prompt",
      observability: input.promptEvidence.length > 0 ? "external-proxy-capture" : "unobservable",
      evidenceCount: input.promptEvidence.length,
      summary: "Prompt evidence stores section and tool fingerprints, not raw prompt text.",
      fingerprints: input.promptEvidence.flatMap((item) => [item.systemFingerprint, item.developerFingerprint, item.userFingerprint].filter((value): value is string => Boolean(value))),
    },
    {
      stage: "provider",
      observability: "external-proxy-capture",
      evidenceCount: input.providerRequests.length,
      summary: "Provider request/response shape, protocol, status, duration, and model are captured.",
      fingerprints: input.providerRequests.map((item) => fingerprintValue([item.path, item.requestShape.fingerprint, item.responseShape.fingerprint])),
    },
    {
      stage: "tool",
      observability: input.toolEvidence.length > 0 ? "external-proxy-capture" : "unobservable",
      evidenceCount: input.toolEvidence.length,
      summary: "Tool schema and call payloads are represented by names and fingerprints.",
      fingerprints: input.toolEvidence.map((item) => fingerprintValue([item.toolName, item.argumentFingerprint, item.resultFingerprint])),
    },
    {
      stage: "runtime",
      observability: "aggregated",
      evidenceCount: input.streamEvidence.reduce((total, item) => total + item.eventCount, 0),
      summary: "Runtime cadence is aggregated from stream event counts and request ordering.",
      fingerprints: input.streamEvidence.map((item) => item.responseFingerprint),
    },
    {
      stage: "final",
      observability: "aggregated",
      evidenceCount: input.usageEvidence.length,
      summary: "Final evidence includes finish reason and token usage when visible in provider responses.",
      fingerprints: input.usageEvidence.map((item) => fingerprintValue(item)),
    },
  ]
}

function inferProtocol(path: string, body: unknown): string {
  if (path.includes("bedrock") || path.includes("invoke-with-response-stream") || path.includes("invoke-model")) return "bedrock-eventstream"
  if (path.startsWith("/v1/messages") || path.startsWith("/model/")) return "anthropic-messages"
  if (path.startsWith("/v1/responses") || path.startsWith("/responses")) return "openai-responses"
  if (path.includes("chat/completions")) return "openai-chat-completions"
  if (path.startsWith("/v1beta/models") || path.startsWith("/v1alpha/models") || path.startsWith("/v1internal")) return "gemini"
  const record = objectAt(body)
  if ("instructions" in record || "input" in record) return "openai-responses"
  if ("messages" in record && "system" in record) return "anthropic-messages"
  if ("messages" in record) return "openai-chat-completions"
  if ("contents" in record || "system_instruction" in record || "systemInstruction" in record) return "gemini"
  return "unknown"
}

function toolDefinitions(body: JSONRecord): Array<{ name: string; raw: unknown }> {
  const tools = body.tools
  if (!Array.isArray(tools)) return []
  return tools.flatMap((tool) => {
    const record = objectAt(tool)
    const fn = objectAt(record.function)
    const declarations = Array.isArray(record.functionDeclarations) ? record.functionDeclarations : []
    if (declarations.length > 0) return declarations.map((item) => ({ name: stringAt(objectAt(item).name), raw: item }))
    return [{ name: stringAt(record.name) || stringAt(fn.name), raw: tool }]
  })
}

function responseToolCalls(body: unknown): Array<{ name: string; id?: string; input?: unknown }> {
  const record = objectAt(body)
  const content = Array.isArray(record.content) ? record.content : []
  const anthropic: Array<{ name: string; id?: string; input?: unknown }> = content.flatMap((item) => {
    const block = objectAt(item)
    if (block.type !== "tool_use") return []
    return [{ name: stringAt(block.name), id: stringAt(block.id), input: block.input }]
  })
  const output = Array.isArray(record.output) ? record.output : []
  const responses: Array<{ name: string; id?: string; input?: unknown }> = output.flatMap((item) => {
    const block = objectAt(item)
    if (block.type !== "function_call" && block.type !== "tool_call") return []
    return [{ name: stringAt(block.name), id: stringAt(block.call_id) || stringAt(block.id), input: block.arguments ?? block.input }]
  })
  const choices = Array.isArray(record.choices) ? record.choices : []
  const chat: Array<{ name: string; id?: string; input?: unknown }> = choices.flatMap((choice) => {
    const message = objectAt(objectAt(choice).message)
    const calls = Array.isArray(message.tool_calls) ? message.tool_calls : []
    return calls.map((call) => {
      const callRecord = objectAt(call)
      const fn = objectAt(callRecord.function)
      return { name: stringAt(fn.name), id: stringAt(callRecord.id), input: fn.arguments }
    })
  })
  const candidates = Array.isArray(record.candidates) ? record.candidates : []
  const gemini: Array<{ name: string; id?: string; input?: unknown }> = candidates.flatMap((candidate) => {
    const parts = Array.isArray(objectAt(objectAt(candidate).content).parts) ? objectAt(objectAt(candidate).content).parts as unknown[] : []
    return parts.flatMap((part) => {
      const functionCall = objectAt(objectAt(part).functionCall)
      return stringAt(functionCall.name) ? [{ name: stringAt(functionCall.name), input: functionCall.args }] : []
    })
  })
  return [...anthropic, ...responses, ...chat, ...gemini].map((item) => ({
    name: item.name,
    ...(item.id ? { id: item.id } : {}),
    ...(item.input === undefined ? {} : { input: item.input }),
  }))
}

function messageCount(body: JSONRecord): number {
  if (Array.isArray(body.messages)) return body.messages.length
  if (Array.isArray(body.input)) return body.input.length
  if (Array.isArray(body.contents)) return body.contents.length
  return 0
}

function roleTextPayload(body: JSONRecord, role: string): unknown {
  const input = Array.isArray(body.input) ? body.input : []
  const messages = Array.isArray(body.messages) ? body.messages : []
  const matches = [...input, ...messages].filter((item) => objectAt(item).role === role)
  return matches.length > 0 ? matches : undefined
}

function modelIDFromRequest(path: string, body: unknown): string {
  const bodyModel = stringAt(objectAt(body).model)
  if (bodyModel) return bodyModel
  const geminiPathModel = /^\/v1(?:beta|alpha|internal)\/models\/([^/:]+)(?::|\/)/.exec(path)?.[1]
  return geminiPathModel ? decodeURIComponent(geminiPathModel) : "unknown"
}

function usagePayload(body: unknown): unknown {
  const record = objectAt(body)
  return record.usage ?? record.usageMetadata ?? record
}

function normalizeUsage(value: unknown): { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreateTokens: number; totalTokens?: number } {
  const usage = objectAt(value)
  const inputTokens = firstNumber(usage.input_tokens, usage.prompt_tokens, usage.promptTokenCount, usage.inputTokens)
  const outputTokens = firstNumber(usage.output_tokens, usage.completion_tokens, usage.candidatesTokenCount, usage.outputTokens)
  const details = objectAt(usage.input_tokens_details ?? usage.prompt_tokens_details)
  const cacheReadTokens = firstNumber(usage.cache_read_input_tokens, usage.cached_tokens, usage.cachedContentTokenCount, usage.cacheReadInputTokens, details.cached_tokens)
  const cacheCreateTokens = firstNumber(usage.cache_creation_input_tokens, usage.cacheWriteInputTokens)
  const totalTokens = optionalNumber(usage.total_tokens) ?? optionalNumber(usage.totalTokens) ?? optionalNumber(usage.totalTokenCount)
  return {
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheCreateTokens,
    ...(totalTokens === undefined ? {} : { totalTokens }),
  }
}

function finishReason(body: unknown): string {
  const record = objectAt(body)
  const choice = Array.isArray(record.choices) ? objectAt(record.choices[0]) : {}
  const candidate = Array.isArray(record.candidates) ? objectAt(record.candidates[0]) : {}
  const response = objectAt(record.response)
  const delta = objectAt(record.delta)
  return stringAt(record.stop_reason) || stringAt(record.status) || stringAt(response.stop_reason) || stringAt(response.status) || stringAt(delta.stop_reason) || stringAt(choice.finish_reason) || stringAt(candidate.finishReason)
}

function objectAt(value: unknown): JSONRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JSONRecord) : {}
}

function stringAt(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function numberAt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function firstNumber(...values: unknown[]): number {
  return values.map(optionalNumber).find((value): value is number => value !== undefined) ?? 0
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

function isRecord(value: unknown): value is JSONRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}
