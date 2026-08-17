import { createID, type ProviderStreamEvent, type TokenUsage } from "@helix/contracts"

export type OpenCodeCustomProviderFrameKind = "text" | "reasoning" | "tool_call" | "finish" | "error" | "part"

export interface OpenCodeCustomProviderFrame {
  type?: OpenCodeCustomProviderFrameKind
  kind?: OpenCodeCustomProviderFrameKind
  event?: OpenCodeCustomProviderFrameKind
  protocol?: "custom" | string
  providerID?: string
  text?: string
  delta?: string
  id?: string
  toolName?: string
  name?: string
  input?: Record<string, unknown>
  arguments?: Record<string, unknown> | string
  finish?: string
  finishReason?: string
  reason?: string
  usage?: Partial<TokenUsage>
  cost?: number
  message?: string
  code?: string
  data?: unknown
}

export async function* parseOpenCodeCustomProviderFrames(chunks: AsyncIterable<string>): AsyncIterable<ProviderStreamEvent> {
  let buffer = ""
  for await (const chunk of chunks) {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""
    for (const line of lines) yield* parseCustomProviderLine(line)
  }
  if (buffer.trim()) yield* parseCustomProviderLine(buffer)
}

async function* parseCustomProviderLine(line: string): AsyncIterable<ProviderStreamEvent> {
  const payload = normalizePayloadLine(line)
  if (!payload) return
  const frame = parseFrame(payload)
  if (!frame) return
  const kind = frameKind(frame)
  if (kind === "text") {
    const text = stringValue(frame.text) ?? stringValue(frame.delta)
    if (text) yield { type: "text", text }
    return
  }
  if (kind === "reasoning") {
    const text = stringValue(frame.text) ?? stringValue(frame.delta)
    if (text) yield { type: "reasoning", text }
    return
  }
  if (kind === "tool_call") {
    const toolName = stringValue(frame.toolName) ?? stringValue(frame.name)
    if (!toolName) return
    yield {
      type: "tool_call",
      toolName,
      input: parseToolInput(frame.input ?? frame.arguments),
      ...(typeof frame.id === "string" ? { id: frame.id } : {}),
    }
    return
  }
  if (kind === "finish") {
    const usage = usageFromFrame(frame.usage)
    yield {
      type: "finish",
      finish: stringValue(frame.finish) ?? stringValue(frame.finishReason) ?? stringValue(frame.reason) ?? "stop",
      ...(usage ? { usage } : {}),
      ...(typeof frame.cost === "number" ? { cost: frame.cost } : {}),
    }
    return
  }
  yield {
    type: "part",
    part: {
      id: createID("part"),
      type: "custom",
      customType: kind === "error" ? "opencode.custom-provider.error-frame" : "opencode.custom-provider.raw-frame",
      display: stringValue(frame.message) ?? stringValue(frame.code) ?? `OpenCode custom provider ${kind} frame`,
      data: {
        providerID: frame.providerID,
        protocol: frame.protocol ?? "custom",
        frame,
      },
    },
  }
}

function normalizePayloadLine(line: string): string | undefined {
  const trimmed = line.trim()
  if (!trimmed || trimmed === "[DONE]") return undefined
  if (trimmed.startsWith("data:")) {
    const data = trimmed.slice("data:".length).trim()
    return data && data !== "[DONE]" ? data : undefined
  }
  return trimmed
}

function parseFrame(payload: string): OpenCodeCustomProviderFrame | undefined {
  try {
    const parsed = JSON.parse(payload) as unknown
    return isRecord(parsed) ? parsed as OpenCodeCustomProviderFrame : undefined
  } catch {
    return {
      type: "part",
      protocol: "custom",
      data: payload,
      message: "unparsed custom provider frame",
    }
  }
}

function frameKind(frame: OpenCodeCustomProviderFrame): OpenCodeCustomProviderFrameKind {
  const kind = frame.type ?? frame.kind ?? frame.event
  if (kind === "text" || kind === "reasoning" || kind === "tool_call" || kind === "finish" || kind === "error" || kind === "part") return kind
  return "part"
}

function parseToolInput(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value
  if (typeof value !== "string") return {}
  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : { arguments: value }
  } catch {
    return { arguments: value }
  }
}

function usageFromFrame(value: unknown): TokenUsage | undefined {
  if (!isRecord(value)) return undefined
  const input = numberValue(value.input)
  const output = numberValue(value.output)
  if (input === undefined || output === undefined) return undefined
  const reasoning = numberValue(value.reasoning)
  const cacheRead = numberValue(value.cacheRead)
  const cacheWrite = numberValue(value.cacheWrite)
  return {
    input,
    output,
    ...(reasoning === undefined ? {} : { reasoning }),
    ...(cacheRead === undefined ? {} : { cacheRead }),
    ...(cacheWrite === undefined ? {} : { cacheWrite }),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined
}
