import { randomBytes } from "node:crypto"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import {
  createID,
  type LegoMessage,
  type LegoMessagePart,
  type MessageID,
  type PartID,
  type SessionID,
  type SessionTranscript,
  type TokenUsage,
  type ToolCallID,
} from "@helix/contracts"
import type { CreateSessionInput, ForkSessionInput, PageMessagesInput, PageMessagesResult, SessionInfo, SessionService } from "./types.ts"
import { cloneMessageForSession, createSessionInfo, ensureDir, now, pageMessages } from "./utils.ts"

type SQLiteDatabaseSync = import("node:sqlite").DatabaseSync
const require = createRequire(import.meta.url)

export interface ProjectionState {
  info: SessionInfo
  messages: LegoMessage[]
  events: Array<{ type: string; data: unknown; timestamp: number }>
  snapshots: ProjectionSnapshot[]
}

export interface ProjectionSnapshot {
  id: string
  sessionID: SessionID
  timestamp: number
  eventIndex: number
  info: SessionInfo
  messages: LegoMessage[]
}

export interface ProjectionStorage {
  readonly kind: string
  readonly capabilities: {
    eventSourcedProjection: true
    snapshot: true
    index: true
    persistent?: boolean
    sqlite?: boolean
  }
  get(sessionID: SessionID): ProjectionState | undefined
  set(sessionID: SessionID, state: ProjectionState): void
  delete(sessionID: SessionID): void
  values(): ProjectionState[]
}

export interface ProjectionRevertInput {
  sessionID: SessionID
  snapshotID?: string
}

export interface ProjectionReplayEvent {
  type: string
  sessionID?: SessionID | string
  data?: unknown
  properties?: unknown
  info?: unknown
  messageID?: MessageID | string
  partID?: PartID | string
  timestamp?: number
}

export class ProjectionMemoryStorage implements ProjectionStorage {
  readonly kind = "eventSourcedProjection"
  readonly capabilities = {
    eventSourcedProjection: true,
    snapshot: true,
    index: true,
  } as const
  private readonly states = new Map<SessionID, ProjectionState>()

  get(sessionID: SessionID): ProjectionState | undefined {
    return this.states.get(sessionID)
  }

  set(sessionID: SessionID, state: ProjectionState): void {
    this.states.set(sessionID, state)
  }

  delete(sessionID: SessionID): void {
    this.states.delete(sessionID)
  }

  values(): ProjectionState[] {
    return Array.from(this.states.values())
  }
}

export class ProjectionSQLiteStorage implements ProjectionStorage {
  readonly kind = "sqliteProjection"
  readonly capabilities = {
    eventSourcedProjection: true,
    snapshot: true,
    index: true,
    persistent: true,
    sqlite: true,
  } as const
  readonly path: string
  private readonly db: SQLiteDatabaseSync

  constructor(path: string) {
    this.path = path === ":memory:" ? path : resolve(path)
    if (this.path !== ":memory:") ensureDir(dirname(this.path))
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite")
    this.db = new DatabaseSync(this.path)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projection_sessions (
        id TEXT PRIMARY KEY,
        cwd TEXT NOT NULL,
        updated INTEGER NOT NULL,
        state_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS projection_sessions_cwd_updated_idx
        ON projection_sessions (cwd, updated DESC, id DESC);
    `)
  }

  get(sessionID: SessionID): ProjectionState | undefined {
    const row = this.db
      .prepare("SELECT state_json FROM projection_sessions WHERE id = ?")
      .get(String(sessionID)) as { state_json: string } | undefined
    return row ? parseProjectionState(row.state_json) : undefined
  }

  set(sessionID: SessionID, state: ProjectionState): void {
    this.db
      .prepare(
        `INSERT INTO projection_sessions (id, cwd, updated, state_json)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           cwd = excluded.cwd,
           updated = excluded.updated,
           state_json = excluded.state_json`,
      )
      .run(String(sessionID), state.info.cwd, state.info.updated, JSON.stringify(state))
  }

  delete(sessionID: SessionID): void {
    this.db.prepare("DELETE FROM projection_sessions WHERE id = ?").run(String(sessionID))
  }

  values(): ProjectionState[] {
    const rows = this.db.prepare("SELECT state_json FROM projection_sessions").all() as Array<{ state_json: string }>
    return rows.map((row) => parseProjectionState(row.state_json))
  }

  close(): void {
    this.db.close()
  }
}

export interface ProjectionSessionServiceOptions {
  cwd?: string
  storage?: ProjectionStorage
  sqlitePath?: string
}

export class ProjectionSessionService implements SessionService {
  readonly kind = "event-projection"
  readonly storage: ProjectionStorage
  private readonly defaultCwd: string

  constructor(options: ProjectionSessionServiceOptions = {}) {
    this.storage = options.storage ?? (options.sqlitePath ? new ProjectionSQLiteStorage(options.sqlitePath) : new ProjectionMemoryStorage())
    this.defaultCwd = options.cwd ?? process.cwd()
  }

  async create(input: CreateSessionInput = {}): Promise<SessionInfo> {
    const info = createSessionInfo({
      id: input.id ?? createOpenCodeSessionID(),
      cwd: input.cwd ?? this.defaultCwd,
      title: input.title,
      parentID: input.parentID,
      path: input.path,
      metadata: input.metadata,
    })
    this.storage.set(info.id, {
      info,
      messages: [],
      events: [{ type: "session.created", data: info, timestamp: now() }],
      snapshots: [],
    })
    return { ...info }
  }

  async open(path: string): Promise<SessionInfo> {
    return this.create({ path, title: `Projection: ${path}` })
  }

  async resume(input: { cwd?: string } = {}): Promise<SessionInfo> {
    const cwd = input.cwd ?? this.defaultCwd
    const existing = (await this.list({ cwd }))[0]
    return existing ?? this.create({ cwd })
  }

  async list(input: { cwd?: string } = {}): Promise<SessionInfo[]> {
    return this.storage
      .values()
      .map((state) => state.info)
      .filter((info) => !input.cwd || info.cwd === input.cwd)
      .sort(compareOpenCodeSessionInfo)
      .map((info) => ({ ...info }))
  }

  async get(sessionID: SessionID): Promise<SessionInfo> {
    return { ...this.mustState(sessionID).info }
  }

  async fork(input: ForkSessionInput): Promise<SessionInfo> {
    const source = this.mustState(input.sessionID)
    const fork = await this.create({
      cwd: input.cwd ?? source.info.cwd,
      title: input.title ?? `Fork: ${source.info.title}`,
      parentID: source.info.id,
    })
    const target = this.mustState(fork.id)
    for (const message of source.messages) {
      if (input.messageID && message.id === input.messageID) break
      target.messages.push(cloneMessageForSession(message, target.info.id))
    }
    this.record(target, "session.forked", { from: source.info.id, to: target.info.id })
    return fork
  }

  async children(sessionID: SessionID): Promise<SessionInfo[]> {
    return this.storage
      .values()
      .map((state) => state.info)
      .filter((info) => info.parentID === sessionID)
      .sort(compareOpenCodeSessionInfo)
      .map((info) => ({ ...info }))
  }

  async branch(): Promise<void> {
    this.recordNoop("session.branch.noop")
  }

  async remove(sessionID: SessionID): Promise<void> {
    this.storage.delete(sessionID)
  }

  async touch(sessionID: SessionID): Promise<void> {
    const state = this.mustState(sessionID)
    state.info.updated = now()
    this.record(state, "session.updated", state.info)
  }

  async setTitle(input: { sessionID: SessionID; title: string }): Promise<void> {
    const state = this.mustState(input.sessionID)
    state.info.title = input.title
    state.info.updated = now()
    this.record(state, "session.updated", { title: input.title })
  }

  async setPermission(input: { sessionID: SessionID; permission: unknown }): Promise<void> {
    const state = this.mustState(input.sessionID)
    state.info.permission = input.permission
    state.info.updated = now()
    this.record(state, "session.updated", { permission: input.permission })
  }

  async messages(input: { sessionID: SessionID; limit?: number }): Promise<LegoMessage[]> {
    const messages = this.mustState(input.sessionID).messages
    return structuredClone(input.limit ? messages.slice(-input.limit) : messages)
  }

  async pageMessages(input: PageMessagesInput): Promise<PageMessagesResult> {
    return pageMessages(this.mustState(input.sessionID).messages, input)
  }

  async transcript(sessionID: SessionID): Promise<SessionTranscript> {
    return { sessionID, messages: await this.messages({ sessionID }) }
  }

  async appendMessage(message: LegoMessage): Promise<LegoMessage> {
    const state = this.mustState(message.sessionID)
    state.messages.push(structuredClone(message))
    state.info.updated = now()
    this.record(state, "message.updated", message)
    return structuredClone(message)
  }

  async updateMessage(message: LegoMessage): Promise<LegoMessage> {
    const state = this.mustState(message.sessionID)
    const index = state.messages.findIndex((candidate) => candidate.id === message.id)
    if (index < 0) throw new Error(`Message ${message.id} not found`)
    state.messages[index] = structuredClone(message)
    state.info.updated = now()
    this.record(state, "message.updated", message)
    return structuredClone(message)
  }

  async appendPart(input: { sessionID: SessionID; messageID: MessageID; part: LegoMessagePart }): Promise<LegoMessagePart> {
    const message = this.mustMessage(input.sessionID, input.messageID)
    ;(message.parts as LegoMessagePart[]).push(structuredClone(input.part))
    await this.updateMessage(message)
    return structuredClone(input.part)
  }

  async updatePart(input: {
    sessionID: SessionID
    messageID: MessageID
    partID: PartID
    part: LegoMessagePart
  }): Promise<LegoMessagePart> {
    const message = this.mustMessage(input.sessionID, input.messageID)
    const index = (message.parts as LegoMessagePart[]).findIndex((part) => part.id === input.partID)
    if (index < 0) throw new Error(`Part ${input.partID} not found`)
    ;(message.parts as LegoMessagePart[])[index] = structuredClone(input.part)
    await this.updateMessage(message)
    return structuredClone(input.part)
  }

  async removeMessage(input: { sessionID: SessionID; messageID: MessageID }): Promise<void> {
    const state = this.mustState(input.sessionID)
    state.messages = state.messages.filter((message) => message.id !== input.messageID)
    state.info.updated = now()
    this.record(state, "message.removed", input)
  }

  async removePart(input: { sessionID: SessionID; messageID: MessageID; partID: PartID }): Promise<void> {
    const message = this.mustMessage(input.sessionID, input.messageID)
    message.parts = (message.parts as LegoMessagePart[]).filter((part) => part.id !== input.partID) as typeof message.parts
    await this.updateMessage(message)
  }

  async diff(sessionID: SessionID): Promise<unknown[]> {
    return this.events(sessionID)
  }

  async snapshot(sessionID: SessionID): Promise<ProjectionSnapshot> {
    const state = this.mustState(sessionID)
    const snapshot: ProjectionSnapshot = {
      id: createID("part"),
      sessionID,
      timestamp: now(),
      eventIndex: state.events.length,
      info: structuredClone(state.info),
      messages: structuredClone(state.messages),
    }
    state.snapshots.push(snapshot)
    this.record(state, "session.snapshot", { snapshotID: snapshot.id, eventIndex: snapshot.eventIndex })
    return structuredClone(snapshot)
  }

  async revert(input: ProjectionRevertInput): Promise<ProjectionSnapshot> {
    const state = this.mustState(input.sessionID)
    const snapshot = input.snapshotID
      ? state.snapshots.find((candidate) => candidate.id === input.snapshotID)
      : state.snapshots.at(-1)
    if (!snapshot) throw new Error(`Snapshot not found for session ${input.sessionID}`)
    state.info = structuredClone(snapshot.info)
    state.messages = structuredClone(snapshot.messages)
    state.info.updated = now()
    this.record(state, "session.reverted", { snapshotID: snapshot.id, eventIndex: snapshot.eventIndex })
    return structuredClone(snapshot)
  }

  events(sessionID: SessionID): Array<{ type: string; data: unknown; timestamp: number }> {
    return structuredClone(this.mustState(sessionID).events)
  }

  async replay(events: ProjectionReplayEvent[]): Promise<SessionInfo[]> {
    for (const event of events) await this.applyEvent(event)
    return this.list()
  }

  async applyEvent(event: ProjectionReplayEvent): Promise<void> {
    if (event.type === "session.created") {
      const info = readInfo(event)
      this.storage.set(info.id, {
        info,
        messages: [],
        events: [{ type: event.type, data: structuredClone(event), timestamp: event.timestamp ?? now() }],
        snapshots: [],
      })
      return
    }

    if (event.type === "session.updated") {
      const sessionID = readSessionID(event)
      const state = this.mustState(sessionID)
      const patch = readInfoPatch(event)
      state.info = { ...state.info, ...patch, updated: event.timestamp ?? now() }
      this.record(state, event.type, event, event.timestamp)
      return
    }

    if (event.type === "session.deleted") {
      const sessionID = readSessionID(event)
      const state = this.storage.get(sessionID)
      if (state) this.record(state, event.type, event, event.timestamp)
      this.storage.delete(sessionID)
      return
    }

    if (event.type === "message.updated") {
      const message = readMessage(event)
      const state = this.mustState(message.sessionID)
      const index = state.messages.findIndex((candidate) => candidate.id === message.id)
      if (index >= 0) state.messages[index] = mergeProjectedMessage(message, state.messages[index]!)
      else state.messages.push(message)
      state.info.updated = event.timestamp ?? now()
      this.record(state, event.type, event, event.timestamp)
      return
    }

    if (event.type === "message.removed") {
      const payload = readEventPayload(event)
      const sessionID = readSessionID(event)
      const messageID = String(event.messageID ?? payload["messageID"]) as MessageID
      const state = this.mustState(sessionID)
      state.messages = state.messages.filter((message) => message.id !== messageID)
      state.info.updated = event.timestamp ?? now()
      this.record(state, event.type, event, event.timestamp)
      return
    }

    if (event.type === "message.part.updated") {
      const payload = readEventPayload(event)
      const rawPart = readRecord(payload["part"] ?? event.info)
      const sessionID = readSessionID(event)
      const messageID = String(rawPart["messageID"] ?? payload["messageID"] ?? event.messageID) as MessageID
      const state = this.mustState(sessionID)
      this.upsertProjectedParts(state, messageID, readParts([rawPart]))
      state.info.updated = event.timestamp ?? now()
      this.record(state, event.type, event, event.timestamp)
      return
    }

    if (event.type === "message.part.removed") {
      const payload = readEventPayload(event)
      const sessionID = readSessionID(event)
      const messageID = String(payload["messageID"] ?? event.messageID) as MessageID
      const partID = String(payload["partID"] ?? event.partID) as PartID
      const state = this.mustState(sessionID)
      const message = state.messages.find((candidate) => candidate.id === messageID)
      if (message) {
        message.parts = message.parts.filter((part) => part.id !== partID && part.id !== (`${partID}:result` as PartID))
        state.info.updated = event.timestamp ?? now()
      }
      this.record(state, event.type, event, event.timestamp)
      return
    }
  }

  private upsertProjectedParts(state: ProjectionState, messageID: MessageID, parts: LegoMessagePart[]): void {
    let message = state.messages.find((candidate) => candidate.id === messageID)
    if (!message) {
      message = {
        id: messageID,
        sessionID: state.info.id,
        role: "assistant",
        time: { created: now() },
        parts: [],
      }
      state.messages.push(message)
    }
    for (const part of parts) {
      const messageParts = message.parts as LegoMessagePart[]
      const index = messageParts.findIndex((candidate) => candidate.id === part.id)
      if (index >= 0) messageParts[index] = part
      else messageParts.push(part)
    }
  }

  private mustState(sessionID: SessionID): ProjectionState {
    const state = this.storage.get(sessionID)
    if (!state) throw new Error(`Session not found: ${sessionID}`)
    return state
  }

  private mustMessage(sessionID: SessionID, messageID: MessageID): LegoMessage {
    const message = this.mustState(sessionID).messages.find((candidate) => candidate.id === messageID)
    if (!message) throw new Error(`Message ${messageID} not found`)
    return structuredClone(message)
  }

  private record(state: ProjectionState, type: string, data: unknown, timestamp = now()): void {
    state.events.push({ type, data: structuredClone(data), timestamp })
    this.storage.set(state.info.id, state)
  }

  private recordNoop(type: string): void {
    const state = this.storage.values()[0]
    if (state) this.record(state, type, { id: createID("part") })
  }
}

function parseProjectionState(json: string): ProjectionState {
  return JSON.parse(json) as ProjectionState
}

function readInfo(event: ProjectionReplayEvent): SessionInfo {
  const info = readInfoRecord(event)
  const time = readRecord(info["time"])
  const created = numberOr(info["created"], numberOr(time["created"], event.timestamp ?? now()))
  const updated = numberOr(info["updated"], numberOr(time["updated"], event.timestamp ?? created))
  const cwd = String(info["cwd"] ?? info["directory"] ?? process.cwd())
  return {
    id: String(info["id"] ?? event.sessionID) as SessionID,
    title: String(info["title"] ?? "Replayed session"),
    cwd,
    created,
    updated,
    ...readInfoFields(info),
  }
}

let lastOpenCodeIDTimestamp = 0
let openCodeIDCounter = 0

function createOpenCodeSessionID(timestamp = now()): SessionID {
  return createOpenCodeID("ses", timestamp) as SessionID
}

function createOpenCodeID(prefix: string, timestamp: number): string {
  if (timestamp !== lastOpenCodeIDTimestamp) {
    lastOpenCodeIDTimestamp = timestamp
    openCodeIDCounter = 0
  }
  openCodeIDCounter++
  let encoded = BigInt(timestamp) * BigInt(0x1000) + BigInt(openCodeIDCounter)
  encoded = ~encoded
  const timeBytes = Buffer.alloc(6)
  for (let index = 0; index < 6; index++) {
    timeBytes[index] = Number((encoded >> BigInt(40 - 8 * index)) & BigInt(0xff))
  }
  return `${prefix}_${timeBytes.toString("hex")}${randomBase62(14)}`
}

function randomBase62(length: number): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  const bytes = randomBytes(length)
  let result = ""
  for (let index = 0; index < length; index++) result += chars[bytes[index]! % chars.length]
  return result
}

function compareOpenCodeSessionInfo(left: SessionInfo, right: SessionInfo): number {
  return right.updated - left.updated || String(right.id).localeCompare(String(left.id))
}

function readInfoPatch(event: ProjectionReplayEvent): Partial<SessionInfo> {
  const info = readInfoRecord(event)
  return readInfoFields(info)
}

function readMessage(event: ProjectionReplayEvent): LegoMessage {
  const payload = readEventPayload(event)
  const message = readRecord(event.info ?? payload["info"] ?? payload["message"] ?? payload)
  const role = message["role"] === "user" ? "user" : message["role"] === "tool" ? "tool" : "assistant"
  const sessionID = readSessionID(event)
  const id = String(message["id"] ?? payload["messageID"] ?? event.messageID ?? createID("message")) as MessageID
  const time = readMessageTime(message, event)
  const parentID = stringValue(message["parentID"]) as MessageID | undefined
  const parts = readParts(arrayOfUnknown(payload["parts"] ?? message["parts"]))
  const metadata = recordValue(message["metadata"])

  if (role === "user") {
    return {
      id,
      sessionID,
      role,
      time,
      parts,
      ...optionalMessageFields(message),
      ...(metadata ? { metadata } : {}),
    }
  }

  if (role === "tool") {
    return {
      id,
      sessionID,
      role,
      time,
      parts: parts.filter((part): part is Extract<LegoMessagePart, { type: "tool_result" }> => part.type === "tool_result"),
      ...(parentID ? { parentID } : {}),
      ...(metadata ? { metadata } : {}),
    }
  }

  return {
    id,
    sessionID,
    role,
    time,
    parts,
    ...optionalMessageFields(message),
    ...optionalAssistantFields(message),
    ...(parentID ? { parentID } : {}),
    ...(metadata ? { metadata } : {}),
  }
}

function mergeProjectedMessage(next: LegoMessage, previous: LegoMessage): LegoMessage {
  if (next.parts.length > 0) return next
  return { ...next, parts: previous.parts } as LegoMessage
}

function readSessionID(event: ProjectionReplayEvent): SessionID {
  const value = readEventPayload(event)
  const info = readRecord(event.info ?? value["info"] ?? value["message"] ?? value["part"])
  return String(event.sessionID ?? value["sessionID"] ?? info["sessionID"]) as SessionID
}

function readInfoRecord(event: ProjectionReplayEvent): Record<string, unknown> {
  const payload = readEventPayload(event)
  return readRecord(event.info ?? payload["info"] ?? payload)
}

function readInfoFields(info: Record<string, unknown>): Partial<SessionInfo> {
  const result: Partial<SessionInfo> = {}
  assignString(result, "slug", info["slug"])
  assignString(result, "projectID", info["projectID"])
  assignString(result, "directory", info["directory"])
  assignString(result, "path", info["path"])
  assignString(result, "workspaceID", info["workspaceID"])
  assignString(result, "version", info["version"])
  assignString(result, "agent", info["agent"])
  assignString(result, "providerID", info["providerID"])
  assignString(result, "modelID", info["modelID"])
  assignString(result, "mode", info["mode"])
  assignString(result, "messageID", info["messageID"])
  if (stringValue(info["parentID"])) result.parentID = stringValue(info["parentID"]) as SessionID
  if (hasOwn(info, "permission")) result.permission = info["permission"]
  if (hasOwn(info, "share")) result.share = info["share"]
  if (hasOwn(info, "summary")) result.summary = info["summary"]
  if (hasOwn(info, "revert")) result.revert = info["revert"]
  const cost = numberValue(info["cost"])
  if (cost !== undefined) result.cost = cost
  const tokens = readSessionTokens(info["tokens"])
  if (tokens) result.tokens = tokens
  const time = readSessionTime(info["time"])
  if (time) result.time = time
  const model = readSessionModel(info)
  if (model) result.model = model
  const metadata = recordValue(info["metadata"])
  if (metadata) result.metadata = metadata
  return result
}

function readParts(values: unknown[]): LegoMessagePart[] {
  return values.flatMap((value) => readPart(value))
}

function readPart(value: unknown): LegoMessagePart[] {
  const part = readRecord(value)
  const type = String(part["type"] ?? "custom")
  const id = String(part["id"] ?? createID("part")) as PartID
  if (type === "text") return [{ id, type: "text", text: String(part["text"] ?? "") }]
  if (type === "reasoning") return [{ id, type: "reasoning", text: String(part["text"] ?? "") }]
  if (type === "tool" || type === "tool_call" || type.startsWith("tool-")) return readToolParts(part, id, type)
  if (type === "tool_result") {
    const content = readParts(arrayOfUnknown(part["content"]))
    return [
      {
        id,
        type: "tool_result",
        toolCallID: String(part["toolCallID"] ?? part["callID"] ?? id) as ToolCallID,
        toolName: String(part["toolName"] ?? part["tool"] ?? "tool"),
        content: content.length ? content : outputToParts(part["output"] ?? part["text"] ?? part["result"]),
        ...(part["isError"] === true ? { isError: true } : {}),
        ...(hasOwn(part, "details") ? { details: part["details"] } : {}),
      },
    ]
  }
  if (type === "compaction") {
    return [
      {
        id,
        type: "compaction",
        reason: part["overflow"] === true ? "overflow" : part["auto"] === true ? "overflow" : "manual",
        summary: String(part["summary"] ?? "OpenCode compaction"),
        ...(stringValue(part["tail_start_id"]) ? { firstKeptMessageID: stringValue(part["tail_start_id"]) as MessageID } : {}),
        metadata: { opencode: part },
      },
    ]
  }
  const display = displayForPart(part)
  return [
    {
      id,
      type: "custom",
      customType: type,
      data: structuredClone(part),
      ...(display ? { display } : {}),
    },
  ]
}

function readToolParts(part: Record<string, unknown>, id: PartID, type: string): LegoMessagePart[] {
  const state = readRecord(part["state"])
  const status = readToolStatus(state["status"] ?? part["status"] ?? (type === "tool_call" ? "pending" : "completed"))
  const toolName = String(part["tool"] ?? part["toolName"] ?? part["name"] ?? type.replace(/^tool-/, "") ?? "tool")
  const toolCallID = String(part["callID"] ?? part["toolCallID"] ?? part["id"] ?? id) as ToolCallID
  const input = recordValue(state["input"] ?? part["input"] ?? part["args"]) ?? {}
  const metadata = recordValue(part["metadata"] ?? state["metadata"])
  const result: LegoMessagePart[] = [
    {
      id,
      type: "tool_call",
      toolCallID,
      toolName,
      input,
      status,
      ...(metadata ? { metadata } : {}),
    },
  ]
  if (status === "completed" && hasOwn(state, "output")) {
    result.push({
      id: `${id}:result` as PartID,
      type: "tool_result",
      toolCallID,
      toolName,
      content: outputToParts(state["output"]),
      ...(metadata ? { details: metadata } : {}),
    })
  }
  if (status === "error") {
    result.push({
      id: `${id}:result` as PartID,
      type: "tool_result",
      toolCallID,
      toolName,
      content: outputToParts(state["error"] ?? state["output"] ?? "Tool execution failed"),
      isError: true,
      ...(metadata ? { details: metadata } : {}),
    })
  }
  return result
}

function readToolStatus(value: unknown): Extract<Extract<LegoMessagePart, { type: "tool_call" }>["status"], string> {
  if (value === "running") return "running"
  if (value === "completed") return "completed"
  if (value === "error") return "error"
  return "pending"
}

function outputToParts(value: unknown): LegoMessagePart[] {
  if (Array.isArray(value)) return readParts(value)
  if (isRecord(value)) {
    if (typeof value["text"] === "string") return [{ id: createID("part"), type: "text", text: value["text"] }]
    if (typeof value["value"] === "string") return [{ id: createID("part"), type: "text", text: value["value"] }]
    return [
      {
        id: createID("part"),
        type: "custom",
        customType: "json",
        data: structuredClone(value),
        display: JSON.stringify(value),
      },
    ]
  }
  return [{ id: createID("part"), type: "text", text: String(value ?? "") }]
}

function optionalMessageFields(message: Record<string, unknown>): Partial<Extract<LegoMessage, { role: "user" | "assistant" }>> {
  const fields: Partial<Extract<LegoMessage, { role: "user" | "assistant" }>> = {}
  const agent = stringValue(message["agent"])
  if (agent) fields.agent = agent
  const model = readLegoModel(message)
  if (model) fields.model = model
  return fields
}

function optionalAssistantFields(message: Record<string, unknown>): Partial<Extract<LegoMessage, { role: "assistant" }>> {
  const fields: Partial<Extract<LegoMessage, { role: "assistant" }>> = {}
  const finish = stringValue(message["finish"])
  if (finish) fields.finish = finish
  const cost = numberValue(message["cost"])
  if (cost !== undefined) fields.cost = cost
  const usage = readTokenUsage(message["usage"] ?? message["tokens"])
  if (usage) fields.usage = usage
  const error = readError(message["error"])
  if (error) fields.error = error
  return fields
}

function readMessageTime(message: Record<string, unknown>, event: ProjectionReplayEvent): LegoMessage["time"] {
  const time = readRecord(message["time"])
  const created = numberOr(time["created"], numberOr(message["created"], event.timestamp ?? now()))
  const updated = numberValue(time["updated"] ?? message["updated"])
  const completed = numberValue(time["completed"] ?? message["completed"])
  return {
    created,
    ...(updated !== undefined ? { updated } : {}),
    ...(completed !== undefined ? { completed } : {}),
  }
}

function readLegoModel(value: Record<string, unknown>): { providerID: string; modelID: string } | undefined {
  const model = readRecord(value["model"])
  const providerID = stringValue(model["providerID"] ?? value["providerID"])
  const modelID = stringValue(model["modelID"] ?? value["modelID"])
  if (!providerID || !modelID) return undefined
  return { providerID, modelID }
}

function readSessionModel(value: Record<string, unknown>): SessionInfo["model"] | undefined {
  const model = readRecord(value["model"])
  const modelID = stringValue(model["modelID"] ?? value["modelID"])
  if (!modelID) return undefined
  const providerID = stringValue(model["providerID"] ?? value["providerID"])
  const variant = stringValue(model["variant"] ?? value["variant"])
  return {
    modelID,
    ...(providerID ? { providerID } : {}),
    ...(variant ? { variant } : {}),
  }
}

function readTokenUsage(value: unknown): TokenUsage | undefined {
  const tokens = readRecord(value)
  const input = numberValue(tokens["input"])
  const output = numberValue(tokens["output"])
  if (input === undefined || output === undefined) return undefined
  const cache = readRecord(tokens["cache"])
  const reasoning = numberValue(tokens["reasoning"])
  const cacheRead = numberValue(tokens["cacheRead"] ?? cache["read"])
  const cacheWrite = numberValue(tokens["cacheWrite"] ?? cache["write"])
  return {
    input,
    output,
    ...(reasoning !== undefined ? { reasoning } : {}),
    ...(cacheRead !== undefined ? { cacheRead } : {}),
    ...(cacheWrite !== undefined ? { cacheWrite } : {}),
  }
}

function readSessionTokens(value: unknown): SessionInfo["tokens"] | undefined {
  const tokens = readRecord(value)
  if (Object.keys(tokens).length === 0) return undefined
  const result: NonNullable<SessionInfo["tokens"]> = {}
  for (const [key, tokenValue] of Object.entries(tokens)) result[key] = tokenValue
  const total = numberValue(tokens["total"])
  const input = numberValue(tokens["input"])
  const output = numberValue(tokens["output"])
  const reasoning = numberValue(tokens["reasoning"])
  const cache = readRecord(tokens["cache"])
  const cacheRead = numberValue(tokens["cacheRead"] ?? cache["read"])
  const cacheWrite = numberValue(tokens["cacheWrite"] ?? cache["write"])
  if (total !== undefined) result.total = total
  if (input !== undefined) result.input = input
  if (output !== undefined) result.output = output
  if (reasoning !== undefined) result.reasoning = reasoning
  if (cacheRead !== undefined) result.cacheRead = cacheRead
  if (cacheWrite !== undefined) result.cacheWrite = cacheWrite
  if (Object.keys(cache).length > 0) {
    const read = numberValue(cache["read"])
    const write = numberValue(cache["write"])
    result.cache = {
      ...(read !== undefined ? { read } : {}),
      ...(write !== undefined ? { write } : {}),
    }
  }
  return result
}

function readSessionTime(value: unknown): SessionInfo["time"] | undefined {
  const time = readRecord(value)
  if (Object.keys(time).length === 0) return undefined
  const result: NonNullable<SessionInfo["time"]> = {}
  for (const [key, timeValue] of Object.entries(time)) result[key] = timeValue
  const created = numberValue(time["created"])
  const updated = numberValue(time["updated"])
  const completed = numberValue(time["completed"])
  if (created !== undefined) result.created = created
  if (updated !== undefined) result.updated = updated
  if (completed !== undefined) result.completed = completed
  return result
}

function readError(value: unknown): Extract<LegoMessage, { role: "assistant" }>["error"] | undefined {
  if (!isRecord(value)) return undefined
  const name = stringValue(value["name"]) ?? "OpenCodeError"
  const message = stringValue(value["message"]) ?? JSON.stringify(value)
  const stack = stringValue(value["stack"])
  return {
    name,
    message,
    ...(stack ? { stack } : {}),
    data: structuredClone(value),
  }
}

function displayForPart(part: Record<string, unknown>): string | undefined {
  if (typeof part["text"] === "string") return part["text"]
  if (typeof part["filename"] === "string") return part["filename"]
  if (typeof part["name"] === "string") return part["name"]
  return undefined
}

function readEventPayload(event: ProjectionReplayEvent): Record<string, unknown> {
  const data = readRecord(event.data)
  if (Object.keys(data).length > 0) return data
  const properties = readRecord(event.properties)
  if (Object.keys(properties).length > 0) return properties
  return {}
}

function readRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  const record = readRecord(value)
  return Object.keys(record).length > 0 ? record : undefined
}

function arrayOfUnknown(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function numberOr(value: unknown, fallback: number): number {
  return numberValue(value) ?? fallback
}

function assignString<T extends object, K extends keyof T>(target: T, key: K, value: unknown): void {
  const parsed = stringValue(value)
  if (parsed) target[key] = parsed as T[K]
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
