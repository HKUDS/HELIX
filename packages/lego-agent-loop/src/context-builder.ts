import { createID, type LegoMessage, type LegoMessagePart, type LegoModel, type SessionID } from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { SessionInfo, SessionService } from "@helix/lego-session"

export interface ProviderContextInput {
  session: SessionService
  hooks: LegoHookHost
  sessionInfo: SessionInfo
  systemPrompt: string
  messages: LegoMessage[]
  model: LegoModel
  maxInputTokens?: number
  compactionKeepMessages?: number
  autoCompact: boolean
  signal?: AbortSignal
}

export interface ProviderContextResult {
  messages: LegoMessage[]
  compacted: boolean
  tokenEstimate: number
  tokenLimit?: number
  autocontinue?: boolean
}

export async function buildProviderContext(input: ProviderContextInput): Promise<ProviderContextResult> {
  const transcript = await input.session.transcript(input.sessionInfo.id)
  const contextPatch = await input.hooks.emit(
    envelope("context", input.sessionInfo.id, {
      transcript,
      messages: input.messages,
      systemPrompt: input.systemPrompt,
    }),
    input.signal,
  )
  const contextRecord = record(contextPatch)
  const messages = Array.isArray(contextRecord?.["messages"])
    ? (contextRecord["messages"] as LegoMessage[])
    : input.messages
  const tokenEstimate = estimateContextTokens(input.systemPrompt, messages)
  const tokenLimit = input.maxInputTokens ?? input.model.contextWindow
  if (!input.autoCompact || tokenLimit === undefined || tokenEstimate <= tokenLimit) {
    return { messages, compacted: false, tokenEstimate, ...(tokenLimit === undefined ? {} : { tokenLimit }) }
  }

  const before = await input.hooks.emit(
    envelope("session.before_compact", input.sessionInfo.id, {
      sessionID: input.sessionInfo.id,
      reason: "overflow",
      tokenEstimate,
      tokenLimit,
      messages,
    }),
    input.signal,
  )
  const beforeRecord = record(before)
  if (beforeRecord?.["cancel"] === true) {
    return { messages, compacted: false, tokenEstimate, tokenLimit }
  }

  await input.hooks.emit(
    envelope("session.compacting", input.sessionInfo.id, {
      sessionID: input.sessionInfo.id,
      reason: "overflow",
      tokenEstimate,
      tokenLimit,
    }),
    input.signal,
  )

  const keep = Math.max(1, input.compactionKeepMessages ?? 4)
  const keptMessages = messages.slice(-keep)
  const summary = compactionSummary(beforeRecord, messages.slice(0, Math.max(0, messages.length - keptMessages.length)))
  const compactionMessage = createCompactionMessage({
    sessionID: input.sessionInfo.id,
    summary,
    tokenEstimate,
    tokenLimit,
    ...(keptMessages[0]?.id ? { firstKeptMessageID: keptMessages[0].id } : {}),
  })
  recordSessionCompaction(input.session, {
    sessionID: input.sessionInfo.id,
    summary,
    tokenEstimate,
    tokenLimit,
    ...(keptMessages[0]?.id ? { firstKeptEntryID: keptMessages[0].id } : {}),
  })
  const compactedMessages = [compactionMessage, ...keptMessages]

  const compactResult = await input.hooks.emit(
    envelope("session.compact", input.sessionInfo.id, {
      sessionID: input.sessionInfo.id,
      reason: "overflow",
      summary,
      tokenEstimate,
      tokenLimit,
      beforeCount: messages.length,
      afterCount: compactedMessages.length,
    }),
    input.signal,
  )
  const autocontinue = record(compactResult)?.["autocontinue"] === true
  await input.hooks.emit(
    envelope("session.compacted", input.sessionInfo.id, {
      sessionID: input.sessionInfo.id,
      reason: "overflow",
      summary,
      tokenEstimate,
      tokenLimit,
      messages: compactedMessages,
    }),
    input.signal,
  )

  return { messages: compactedMessages, compacted: true, tokenEstimate, tokenLimit, ...(autocontinue ? { autocontinue } : {}) }
}

export function estimateContextTokens(systemPrompt: string, messages: LegoMessage[]): number {
  const text = [systemPrompt, ...messages.flatMap((message) => message.parts.map(partToText))].join("\n")
  return Math.max(1, Math.ceil(text.length / 4))
}

function compactionSummary(beforeRecord: Record<string, unknown> | undefined, compactedMessages: LegoMessage[]): string {
  if (typeof beforeRecord?.["summary"] === "string") return beforeRecord["summary"]
  if (typeof beforeRecord?.["prompt"] === "string") return beforeRecord["prompt"]
  if (Array.isArray(beforeRecord?.["context"])) return beforeRecord["context"].map(String).join("\n")
  const text = compactedMessages
    .map((message) => `${message.role}: ${message.parts.map(partToText).filter(Boolean).join("\n")}`)
    .filter((line) => line.trim().length > 0)
    .join("\n")
  return text ? `Compacted context:\n${text}` : "Compacted earlier conversation context."
}

function createCompactionMessage(input: {
  sessionID: SessionID
  summary: string
  firstKeptMessageID?: LegoMessage["id"]
  tokenEstimate: number
  tokenLimit: number
}): LegoMessage {
  const now = Date.now()
  return {
    id: createID("message"),
    sessionID: input.sessionID,
    role: "synthetic",
    reason: "overflow",
    time: { created: now, completed: now },
    parts: [
      {
        id: createID("part"),
        type: "compaction",
        reason: "overflow",
        summary: input.summary,
        ...(input.firstKeptMessageID ? { firstKeptMessageID: input.firstKeptMessageID } : {}),
        metadata: { tokenEstimate: input.tokenEstimate, tokenLimit: input.tokenLimit },
      },
    ],
  }
}

function recordSessionCompaction(
  session: SessionService,
  input: {
    sessionID: SessionID
    summary: string
    tokenEstimate: number
    tokenLimit: number
    firstKeptEntryID?: string
  },
): void {
  if (!hasAppendCompaction(session)) return
  session.appendCompaction({
    sessionID: input.sessionID,
    summary: input.summary,
    tokensBefore: input.tokenEstimate,
    details: { tokenLimit: input.tokenLimit },
    fromHook: true,
    ...(input.firstKeptEntryID ? { firstKeptEntryID: input.firstKeptEntryID } : {}),
  })
}

function hasAppendCompaction(session: SessionService): session is SessionService & {
  appendCompaction(input: {
    sessionID: SessionID
    summary: string
    firstKeptEntryID?: string
    tokensBefore?: number
    details?: unknown
    fromHook?: boolean
  }): string
} {
  return "appendCompaction" in session && typeof session.appendCompaction === "function"
}

function partToText(part: LegoMessagePart): string {
  if (part.type === "text" || part.type === "reasoning") return part.text
  if (part.type === "tool_call") return `${part.toolName} ${JSON.stringify(part.input)}`
  if (part.type === "tool_result") return part.content.map(partToText).join("\n")
  if (part.type === "compaction") return part.summary
  if (part.type === "custom") return part.display ?? JSON.stringify(part.data)
  return ""
}

function envelope(type: string, sessionID: SessionID, payload: unknown) {
  return {
    type: type as never,
    sessionID,
    timestamp: Date.now(),
    payload,
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
