import { Buffer } from "node:buffer"
import { mkdirSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { createID, type MessageID, type PartID, type SessionID } from "@helix/contracts"
import type { LegoMessage, LegoMessagePart } from "@helix/contracts"
import type { MessagePageCursor, PageMessagesInput, PageMessagesResult } from "./types"

export function now(): number {
  return Date.now()
}

export function defaultTitle(isChild = false): string {
  return isChild ? "Forked session" : "New session"
}

export function ensureDir(path: string): string {
  const resolved = resolve(path)
  mkdirSync(resolved, { recursive: true })
  return resolved
}

export function listJsonlFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((file) => file.endsWith(".jsonl"))
      .map((file) => join(dir, file))
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  } catch {
    return []
  }
}

export function createSessionInfo(input: {
  id?: SessionID | undefined
  cwd: string
  title?: string | undefined
  parentID?: SessionID | undefined
  path?: string | undefined
  metadata?: Record<string, unknown> | undefined
}) {
  const created = now()
  return {
    id: input.id ?? createID("session"),
    title: input.title ?? defaultTitle(Boolean(input.parentID)),
    cwd: resolve(input.cwd),
    ...(input.path ? { path: input.path } : {}),
    ...(input.parentID ? { parentID: input.parentID } : {}),
    created,
    updated: created,
    ...(input.metadata ? { metadata: input.metadata } : {}),
  }
}

export function createUserMessage(input: { sessionID: SessionID; text: string; id?: MessageID }): LegoMessage {
  const time = now()
  return {
    id: input.id ?? createID("message"),
    sessionID: input.sessionID,
    role: "user",
    time: { created: time },
    parts: [{ id: createID("part"), type: "text", text: input.text }],
  }
}

export function createAssistantMessage(input: {
  sessionID: SessionID
  text: string
  id?: MessageID
  parts?: LegoMessagePart[]
}): LegoMessage {
  const time = now()
  return {
    id: input.id ?? createID("message"),
    sessionID: input.sessionID,
    role: "assistant",
    time: { created: time, completed: time },
    parts: input.parts ?? [{ id: createID("part"), type: "text", text: input.text }],
  }
}

export function cloneMessageForSession(message: LegoMessage, sessionID: SessionID): LegoMessage {
  return {
    ...structuredClone(message),
    id: createID("message"),
    sessionID,
    parts: message.parts.map((part) => clonePart(part)),
  } as LegoMessage
}

export function clonePart(part: LegoMessagePart): LegoMessagePart {
  const cloned = structuredClone(part) as LegoMessagePart
  return { ...cloned, id: createID("part") as PartID } as LegoMessagePart
}

export function pageMessages(messages: LegoMessage[], input: PageMessagesInput): PageMessagesResult {
  const limit = Math.max(0, Math.floor(input.limit))
  const before = input.before ? decodeMessagePageCursor(input.before) : undefined
  const older = messages
    .slice()
    .sort(compareMessagesAscending)
    .filter((message) => !before || messageOlderThanCursor(message, before))
    .reverse()
  const slice = older.slice(0, limit)
  const page = slice.slice().reverse()
  const more = older.length > limit
  const tail = slice.at(-1)
  return {
    messages: structuredClone(page),
    more,
    ...(more && tail ? { cursor: encodeMessagePageCursor({ id: tail.id, time: tail.time.created }) } : {}),
  }
}

export function encodeMessagePageCursor(cursor: MessagePageCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url")
}

export function decodeMessagePageCursor(cursor: string): MessagePageCursor {
  const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown
  if (!isMessagePageCursor(parsed)) throw new Error("Invalid message page cursor")
  return parsed
}

function compareMessagesAscending(left: LegoMessage, right: LegoMessage): number {
  return left.time.created - right.time.created || String(left.id).localeCompare(String(right.id))
}

function messageOlderThanCursor(message: LegoMessage, cursor: MessagePageCursor): boolean {
  return message.time.created < cursor.time || (message.time.created === cursor.time && String(message.id) < String(cursor.id))
}

function isMessagePageCursor(value: unknown): value is MessagePageCursor {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof (value as MessagePageCursor).id === "string" && typeof (value as MessagePageCursor).time === "number"
}
