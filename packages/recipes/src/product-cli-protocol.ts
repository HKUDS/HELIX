import type { LegoMessagePart } from "@helix/contracts"
import type { HarnessTurnResult } from "./harness"

export type ProductCLIProtocol =
  | "opencode-run-json-events"
  | "pi-coding-agent-json-event-stream"
  | "nanobot-cli-json-event-stream"
  | "hermes-cli-json-event-stream"

export interface ProductCLIProtocolTrace {
  protocol: ProductCLIProtocol
  stdoutEventTypes: string[]
  stdoutTextVisible: boolean
  jsonTopLevelKeys: string[]
}

export interface ProductCLIEvent {
  type: string
  timestamp?: number | string
  sessionID?: string
  id?: string
  version?: number
  cwd?: string
  part?: Record<string, unknown>
  message?: Record<string, unknown>
  messages?: Array<Record<string, unknown>>
  toolResults?: Array<Record<string, unknown>>
  assistantMessageEvent?: Record<string, unknown>
  [key: string]: unknown
}

export function productCLIProtocolTrace(product: "opencode" | "pi-mono" | "nanobot" | "hermes-agent", result: HarnessTurnResult): ProductCLIProtocolTrace {
  const events = productCLIEvents(product, result)
  const first = events[0]
  return {
    protocol:
      product === "opencode"
        ? "opencode-run-json-events"
        : product === "pi-mono"
          ? "pi-coding-agent-json-event-stream"
          : product === "hermes-agent"
            ? "hermes-cli-json-event-stream"
            : "nanobot-cli-json-event-stream",
    stdoutEventTypes: events.map((event) => event.type),
    stdoutTextVisible: product !== "opencode" ? events.some((event) => JSON.stringify(event).includes(visibleText(result.assistantMessage.parts))) : false,
    jsonTopLevelKeys: first ? Object.keys(first) : [],
  }
}

export function productCLIEventJSONLines(product: "opencode" | "pi-mono" | "nanobot" | "hermes-agent", result: HarnessTurnResult): string {
  return `${productCLIEvents(product, result).map((event) => JSON.stringify(event)).join("\n")}\n`
}

export function productCLIEvents(product: "opencode" | "pi-mono" | "nanobot" | "hermes-agent", result: HarnessTurnResult): ProductCLIEvent[] {
  if (product === "opencode") return openCodeEvents(result)
  if (product === "pi-mono") return piEvents(result)
  if (product === "hermes-agent") return hermesEvents(result)
  return nanobotEvents(result)
}

function openCodeEvents(result: HarnessTurnResult): ProductCLIEvent[] {
  const stepStart = result.assistantMessage.parts.find((part) => logicalPartType(part) === "step-start") ?? result.assistantMessage.parts[0]
  const text = visibleText(result.assistantMessage.parts.filter((part) => part.type === "text"))
  return [
    {
      type: "step_start",
      timestamp: result.assistantMessage.time.created,
      sessionID: String(result.session.id),
      part: {
        id: stepStart?.id,
        type: "step-start",
      },
    },
    ...(text
      ? [
          {
            type: "text",
            timestamp: result.assistantMessage.time.created,
            sessionID: String(result.session.id),
            part: {
              id: result.assistantMessage.parts.find((part) => part.type === "text")?.id,
              type: "text",
              text,
            },
          },
        ]
      : []),
  ]
}

function piEvents(result: HarnessTurnResult): ProductCLIEvent[] {
  const timestamp = result.assistantMessage.time.created
  const timestampISO = new Date(timestamp).toISOString()
  const userMessage = piUserMessage(result)
  const assistantMessage = piAgentMessage(result)
  const toolResults = result.assistantMessage.parts.flatMap((part) => (part.type === "tool_result" ? [piToolResultMessage(part)] : []))
  return [
    {
      type: "session",
      version: 3,
      id: String(result.session.id),
      timestamp: timestampISO,
      cwd: result.session.cwd,
    },
    {
      type: "agent_start",
    },
    {
      type: "turn_start",
    },
    {
      type: "message_start",
      message: userMessage,
    },
    {
      type: "message_end",
      message: userMessage,
    },
    {
      type: "message_start",
      message: { ...assistantMessage, content: [] },
    },
    {
      type: "message_update",
      message: assistantMessage,
      assistantMessageEvent: {
        type: "text_delta",
        delta: visibleText(result.assistantMessage.parts),
      },
    },
    {
      type: "message_end",
      message: assistantMessage,
    },
    {
      type: "turn_end",
      message: assistantMessage,
      toolResults,
    },
    {
      type: "agent_end",
      messages: [userMessage, assistantMessage, ...toolResults],
    },
  ]
}

function nanobotEvents(result: HarnessTurnResult): ProductCLIEvent[] {
  const timestampISO = new Date(result.assistantMessage.time.created).toISOString()
  const assistantText = visibleText(result.assistantMessage.parts)
  return [
    {
      type: "session",
      version: 1,
      id: String(result.session.id),
      timestamp: timestampISO,
      cwd: result.session.cwd,
    },
    {
      type: "agent_start",
      timestamp: timestampISO,
    },
    {
      type: "message",
      timestamp: new Date(result.userMessage.time.created).toISOString(),
      message: {
        role: "user",
        content: result.userMessage.parts.flatMap(piContentPart),
      },
    },
    {
      type: "assistant_delta",
      timestamp: timestampISO,
      message: {
        role: "assistant",
        content: result.assistantMessage.parts.flatMap(piContentPart),
      },
      delta: assistantText,
    },
    {
      type: "agent_end",
      timestamp: timestampISO,
      messages: [piUserMessage(result), piAgentMessage(result)],
    },
  ]
}

function hermesEvents(result: HarnessTurnResult): ProductCLIEvent[] {
  const timestampISO = new Date(result.assistantMessage.time.created).toISOString()
  return [
    {
      type: "session.created",
      version: 1,
      id: String(result.session.id),
      timestamp: timestampISO,
      cwd: result.session.cwd,
    },
    {
      type: "pre_llm_call",
      timestamp: timestampISO,
      sessionID: String(result.session.id),
      messageCount: result.transcript.length,
    },
    ...result.assistantMessage.parts.flatMap((part) => hermesPartEvents(result, part)),
    {
      type: "post_llm_call",
      timestamp: timestampISO,
      sessionID: String(result.session.id),
      finishReason: result.finish ?? "stop",
    },
  ]
}

function hermesPartEvents(result: HarnessTurnResult, part: LegoMessagePart): ProductCLIEvent[] {
  const timestampISO = new Date(result.assistantMessage.time.created).toISOString()
  if (part.type === "tool_call") {
    return [
      {
        type: "pre_tool_call",
        timestamp: timestampISO,
        sessionID: String(result.session.id),
        toolName: part.toolName,
        toolCallID: String(part.toolCallID),
        args: part.input,
      },
    ]
  }
  if (part.type === "tool_result") {
    return [
      {
        type: "post_tool_call",
        timestamp: timestampISO,
        sessionID: String(result.session.id),
        toolName: part.toolName,
        toolCallID: String(part.toolCallID),
        isError: part.isError === true,
        result: visibleText(part.content),
      },
    ]
  }
  return [
    {
      type: part.type === "reasoning" ? "reasoning.delta" : "message.delta",
      timestamp: timestampISO,
      sessionID: String(result.session.id),
      delta: partText(part),
    },
  ]
}

function piUserMessage(result: HarnessTurnResult): Record<string, unknown> {
  return {
    role: "user",
    content: result.userMessage.parts.flatMap(piContentPart),
    timestamp: result.userMessage.time.created,
  }
}

function piAgentMessage(result: HarnessTurnResult): Record<string, unknown> {
  const model = result.assistantMessage.role === "assistant" ? result.assistantMessage.model : undefined
  return {
    role: "assistant",
    content: result.assistantMessage.parts.flatMap(piContentPart),
    provider: model?.providerID ?? "anthropic",
    model: model?.modelID ?? "unknown",
    stopReason: result.finish ?? "stop",
    timestamp: result.assistantMessage.time.created,
  }
}

function piToolResultMessage(part: Extract<LegoMessagePart, { type: "tool_result" }>): Record<string, unknown> {
  return {
    role: "toolResult",
    toolCallId: part.toolCallID,
    toolName: part.toolName,
    content: part.content.flatMap(piContentPart),
    isError: part.isError === true,
    timestamp: Date.now(),
  }
}

function piContentPart(part: LegoMessagePart): Array<Record<string, unknown>> {
  if (part.type === "text") return [{ type: "text", text: part.text }]
  if (part.type === "reasoning") return [{ type: "thinking", thinking: part.text }]
  if (part.type === "tool_call") return [{ type: "toolCall", id: part.toolCallID, name: part.toolName, arguments: part.input }]
  if (part.type === "tool_result") return [{ type: "toolResult", toolCallId: part.toolCallID, toolName: part.toolName, content: part.content.flatMap(piContentPart), isError: part.isError === true }]
  if (part.type === "compaction") return [{ type: "text", text: part.summary }]
  if (part.type === "custom") return [{ type: part.customType, ...(part.data && typeof part.data === "object" ? part.data : {}), ...(part.display ? { display: part.display } : {}) }]
  return []
}

function visibleText(parts: LegoMessagePart[]): string {
  return parts.map(partText).filter(Boolean).join("\n")
}

function partText(part: LegoMessagePart): string {
  if (part.type === "text" || part.type === "reasoning") return part.text
  if (part.type === "tool_result") return visibleText(part.content)
  if (part.type === "compaction") return part.summary
  if (part.type === "custom") return part.display ?? ""
  return ""
}

function logicalPartType(part: LegoMessagePart): string {
  return part.type === "custom" ? part.customType : part.type
}
