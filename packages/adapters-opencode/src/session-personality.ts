import { mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import type { LegoMessage, LegoMessagePart, LegoModuleManifest, MessageID, PartID, SessionID, SessionTranscript } from "@helix/contracts"
import type { SessionContextSelectorAtom, SessionEventLogAtom, SessionEventRecord } from "@helix/lego-session/atoms"
import { ProjectionSessionService, type ProjectionReplayEvent } from "@helix/lego-session/projection"
import type { BranchSessionInput, CreateSessionInput, ForkSessionInput, PageMessagesInput, PageMessagesResult, SessionContext, SessionInfo, SessionService } from "@helix/lego-session/types"
import {
  hydrateOpenCodeMessageV2RowsProjection,
  openCodeModelFromInfoProjection,
  openCodeSessionContextSelectorMessageV2NativeExactAtomID,
  selectOpenCodePromptContextProjection,
  type OpenCodeMessageV2RowProjection,
  type OpenCodePartRowProjection,
} from "./product-schema/session.ts"

type SQLiteDatabaseSync = import("node:sqlite").DatabaseSync
const require = createRequire(import.meta.url)

export interface OpenCodeSessionPersonalityOptions {
  cwd?: string
  storageDir?: string
  sqlitePath?: string
}

export const openCodeNativeSQLiteTables = ["event", "message", "part", "permission", "session", "session_message", "todo", "workspace"] as const

export function createOpenCodeSessionPersonality(options: OpenCodeSessionPersonalityOptions = {}): OpenCodeNativeSQLiteSessionService {
  return new OpenCodeNativeSQLiteSessionService(options)
}

export function createOpenCodeSessionEventLogAtom(service = createOpenCodeSessionPersonality()): SessionEventLogAtom {
  return {
    manifest: openCodeSessionEventLogManifest(),
    append: (event) => service.appendEventLogRecord(event),
    read: (input) => service.readEventLogRecords(input),
    clear: (input) => service.clearEventLogRecords(input),
  }
}

export function createOpenCodeSessionContextSelectorAtom(service = createOpenCodeSessionPersonality()): SessionContextSelectorAtom {
  return {
    manifest: openCodeSessionContextSelectorManifest(),
    select: (input) => service.buildContext(input),
  }
}

function openCodeSessionEventLogManifest(): LegoModuleManifest {
  return {
    id: "opencode.session.event-log.syncevent",
    version: "0.1.0",
    kind: "atom",
    blockType: "atom",
    layer: "session",
    personality: "opencode",
    provides: [
      {
        id: "session.event-log",
        kind: "implementation",
        variant: "opencode-syncevent",
        multiplicity: "single",
        stability: "stable",
        personality: "opencode",
      },
    ],
    conformance: ["session-atoms:event-log"],
  }
}

function openCodeSessionContextSelectorManifest(): LegoModuleManifest {
  return {
    id: openCodeSessionContextSelectorMessageV2NativeExactAtomID,
    version: "0.1.0",
    kind: "atom",
    blockType: "atom",
    layer: "session",
    personality: "opencode",
    provides: [
      {
        id: "session.context-selector",
        kind: "implementation",
        variant: "opencode-message-v2",
        multiplicity: "single",
        stability: "stable",
        personality: "opencode",
      },
    ],
    conformance: ["session-atoms:context-selector"],
  }
}

export class OpenCodeNativeSQLiteSessionService implements SessionService {
  readonly kind = "opencode-sqlite-native"
  readonly sqlitePath: string
  private readonly inner: ProjectionSessionService
  private readonly db: SQLiteDatabaseSync
  private eventSequence = 0

  constructor(options: OpenCodeSessionPersonalityOptions = {}) {
    this.sqlitePath = resolve(options.sqlitePath ?? join(options.storageDir ?? process.cwd(), "opencode.db"))
    mkdirSync(dirname(this.sqlitePath), { recursive: true })
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite")
    this.db = new DatabaseSync(this.sqlitePath)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        time_created INTEGER NOT NULL,
        time_updated INTEGER NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS message (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        time_created INTEGER NOT NULL,
        time_completed INTEGER,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS part (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        time_created INTEGER NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS event (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        time_created INTEGER NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS session_message (
        session_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        PRIMARY KEY (session_id, message_id)
      );
      CREATE TABLE IF NOT EXISTS permission (id TEXT PRIMARY KEY, session_id TEXT, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS todo (id TEXT PRIMARY KEY, session_id TEXT, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS workspace (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS message_session_time_idx ON message (session_id, time_created, id);
      CREATE INDEX IF NOT EXISTS part_message_time_idx ON part (message_id, time_created, id);
    `)
    this.inner = new ProjectionSessionService(options.cwd ? { cwd: options.cwd } : {})
  }

  async create(input: CreateSessionInput = {}): Promise<SessionInfo> {
    const info = await this.inner.create(input)
    this.upsertSession(info)
    this.recordEvent(info.id, "session.created", info)
    return info
  }

  async open(path: string): Promise<SessionInfo> {
    const info = await this.inner.open(path)
    this.upsertSession(info)
    this.recordEvent(info.id, "session.opened", { path })
    return info
  }

  async resume(input: { cwd?: string } = {}): Promise<SessionInfo> {
    const info = await this.inner.resume(input)
    this.upsertSession(info)
    return info
  }

  list(input?: { cwd?: string }): Promise<SessionInfo[]> {
    return this.inner.list(input)
  }

  get(sessionID: SessionID): Promise<SessionInfo> {
    return this.inner.get(sessionID)
  }

  async fork(input: ForkSessionInput): Promise<SessionInfo> {
    const info = await this.inner.fork(input)
    this.upsertSession(info)
    for (const message of await this.inner.messages({ sessionID: info.id })) this.upsertMessage(message)
    this.recordEvent(info.id, "session.forked", input)
    return info
  }

  async branch(input: BranchSessionInput): Promise<void> {
    await this.inner.branch()
    this.recordEvent(input.sessionID, "session.branch", input)
  }

  async remove(sessionID: SessionID): Promise<void> {
    await this.inner.remove(sessionID)
    this.db.prepare("DELETE FROM part WHERE session_id = ?").run(String(sessionID))
    this.db.prepare("DELETE FROM message WHERE session_id = ?").run(String(sessionID))
    this.db.prepare("DELETE FROM session_message WHERE session_id = ?").run(String(sessionID))
    this.db.prepare("DELETE FROM session WHERE id = ?").run(String(sessionID))
  }

  async touch(sessionID: SessionID): Promise<void> {
    await this.inner.touch(sessionID)
    this.upsertSession(await this.inner.get(sessionID))
  }

  async setTitle(input: { sessionID: SessionID; title: string }): Promise<void> {
    await this.inner.setTitle(input)
    this.upsertSession(await this.inner.get(input.sessionID))
  }

  async setPermission(input: { sessionID: SessionID; permission: unknown }): Promise<void> {
    await this.inner.setPermission(input)
    this.upsertSession(await this.inner.get(input.sessionID))
    this.db
      .prepare("INSERT OR REPLACE INTO permission (id, session_id, data) VALUES (?, ?, ?)")
      .run(`permission:${String(input.sessionID)}`, String(input.sessionID), JSON.stringify(input.permission))
  }

  messages(input: { sessionID: SessionID; limit?: number }): Promise<LegoMessage[]> {
    return this.inner.messages(input)
  }

  pageMessages(input: PageMessagesInput): Promise<PageMessagesResult> {
    return this.inner.pageMessages(input)
  }

  transcript(sessionID: SessionID): Promise<SessionTranscript> {
    return this.inner.transcript(sessionID)
  }

  async buildContext(input: { sessionID: SessionID; leafID?: string | null }): Promise<SessionContext> {
    void input.leafID
    const sessionInfo = await this.tryGet(input.sessionID)
    const commonMessages = await this.inner.messages({ sessionID: input.sessionID })
    const messageRows = this.readMessageV2Rows(input.sessionID)
    if (messageRows.length === 0) {
      return {
        messages: structuredClone(commonMessages),
        thinkingLevel: "off",
        model: sessionInfo ? openCodeModelFromInfoProjection(sessionInfo as unknown as Record<string, unknown>) : null,
      }
    }
    const nativeContext = selectOpenCodePromptContextProjection(
      hydrateOpenCodeMessageV2RowsProjection(messageRows, this.readPartRows(input.sessionID)),
    )
    const byID = new Map(commonMessages.map((message) => [String(message.id), message]))
    return {
      messages: nativeContext.messages
        .map((message) => byID.get(message.info.id))
        .filter((message): message is LegoMessage => Boolean(message))
        .map((message) => structuredClone(message)),
      thinkingLevel: "off",
      model: nativeContext.model ?? (sessionInfo ? openCodeModelFromInfoProjection(sessionInfo as unknown as Record<string, unknown>) : null),
    }
  }

  async appendMessage(message: LegoMessage): Promise<LegoMessage> {
    const saved = await this.inner.appendMessage(message)
    this.upsertMessage(saved)
    this.recordEvent(saved.sessionID, "message.updated", saved)
    return saved
  }

  async updateMessage(message: LegoMessage): Promise<LegoMessage> {
    const saved = await this.inner.updateMessage(message)
    this.upsertMessage(saved)
    this.recordEvent(saved.sessionID, "message.updated", saved)
    return saved
  }

  async appendPart(input: { sessionID: SessionID; messageID: MessageID; part: LegoMessagePart }): Promise<LegoMessagePart> {
    const part = await this.inner.appendPart(input)
    this.upsertPart(input.sessionID, input.messageID, part)
    return part
  }

  async updatePart(input: { sessionID: SessionID; messageID: MessageID; partID: PartID; part: LegoMessagePart }): Promise<LegoMessagePart> {
    const part = await this.inner.updatePart(input)
    this.upsertPart(input.sessionID, input.messageID, part)
    return part
  }

  async removeMessage(input: { sessionID: SessionID; messageID: MessageID }): Promise<void> {
    await this.inner.removeMessage(input)
    this.db.prepare("DELETE FROM part WHERE message_id = ?").run(String(input.messageID))
    this.db.prepare("DELETE FROM message WHERE id = ?").run(String(input.messageID))
    this.db.prepare("DELETE FROM session_message WHERE message_id = ?").run(String(input.messageID))
  }

  async removePart(input: { sessionID: SessionID; messageID: MessageID; partID: PartID }): Promise<void> {
    await this.inner.removePart(input)
    this.db.prepare("DELETE FROM part WHERE id = ?").run(String(input.partID))
  }

  diff(sessionID: SessionID): Promise<unknown[]> {
    return this.inner.diff(sessionID)
  }

  events(sessionID: SessionID): Array<{ type: string; data: unknown; timestamp: number }> {
    return this.inner.events(sessionID)
  }

  appendEventLogRecord(event: Omit<SessionEventRecord, "timestamp"> & { timestamp?: number }): SessionEventRecord {
    const record = normalizeEventLogRecord(event)
    this.writeEventLogRecord(record)
    return structuredClone(record)
  }

  readEventLogRecords(input: { sessionID?: SessionID; type?: string } = {}): SessionEventRecord[] {
    const filters: string[] = []
    const args: string[] = []
    if (input.sessionID) {
      filters.push("session_id = ?")
      args.push(String(input.sessionID))
    }
    const rows = this.db
      .prepare(`SELECT session_id, time_created, data FROM event${filters.length ? ` WHERE ${filters.join(" AND ")}` : ""} ORDER BY time_created ASC, id ASC`)
      .all(...args) as Array<{ session_id: string | null; time_created: number; data: string }>
    return rows.map((row) => eventLogRecordFromRow(row)).filter((event) => !input.type || event.type === input.type)
  }

  clearEventLogRecords(input: { sessionID?: SessionID } = {}): void {
    if (input.sessionID) {
      this.db.prepare("DELETE FROM event WHERE session_id = ?").run(String(input.sessionID))
      return
    }
    this.db.prepare("DELETE FROM event").run()
  }

  async replay(events: ProjectionReplayEvent[]): Promise<SessionInfo[]> {
    const infos = await this.inner.replay(events)
    for (const info of infos) {
      this.upsertSession(info)
      for (const message of await this.inner.messages({ sessionID: info.id })) this.upsertMessage(message)
    }
    return infos
  }

  async applyEvent(event: ProjectionReplayEvent): Promise<void> {
    await this.inner.applyEvent(event)
    const sessionID = readReplaySessionID(event)
    if (!sessionID) return
    const info = await this.inner.get(sessionID)
    this.upsertSession(info)
    for (const message of await this.inner.messages({ sessionID })) this.upsertMessage(message)
  }

  close(): void {
    this.db.close()
  }

  private upsertSession(info: SessionInfo): void {
    this.db
      .prepare(
        `INSERT INTO session (id, time_created, time_updated, data)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           time_updated = excluded.time_updated,
           data = excluded.data`,
      )
      .run(String(info.id), info.created, info.updated, JSON.stringify(info))
    this.db
      .prepare("INSERT OR REPLACE INTO workspace (id, data) VALUES (?, ?)")
      .run(info.cwd, JSON.stringify({ id: info.cwd, directory: info.cwd }))
  }

  private upsertMessage(message: LegoMessage): void {
    this.db
      .prepare(
        `INSERT INTO message (id, session_id, time_created, time_completed, data)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           time_completed = excluded.time_completed,
           data = excluded.data`,
      )
      .run(
        String(message.id),
        String(message.sessionID),
        message.time.created,
        message.time.completed ?? message.time.updated ?? null,
        JSON.stringify(message),
      )
    this.db
      .prepare("INSERT OR REPLACE INTO session_message (session_id, message_id) VALUES (?, ?)")
      .run(String(message.sessionID), String(message.id))
    this.db.prepare("DELETE FROM part WHERE message_id = ?").run(String(message.id))
    for (const part of message.parts) this.upsertPart(message.sessionID, message.id, part)
  }

  private upsertPart(sessionID: SessionID, messageID: MessageID, part: LegoMessagePart): void {
    const data = nativePartData(part)
    this.db
      .prepare(
        `INSERT INTO part (id, session_id, message_id, time_created, data)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
      )
      .run(String(part.id), String(sessionID), String(messageID), Date.now(), JSON.stringify(data))
  }

  private recordEvent(sessionID: SessionID, type: string, data: unknown): void {
    this.writeEventLogRecord({
      type,
      sessionID,
      timestamp: Date.now(),
      data,
    })
  }

  private writeEventLogRecord(record: SessionEventRecord): void {
    const payload = {
      type: record.type,
      ...(record.data === undefined ? {} : { data: record.data }),
    }
    this.db
      .prepare("INSERT OR REPLACE INTO event (id, session_id, time_created, data) VALUES (?, ?, ?, ?)")
      .run(
        this.nextEventID(record),
        record.sessionID ? String(record.sessionID) : null,
        record.timestamp,
        JSON.stringify(payload),
      )
  }

  private nextEventID(record: SessionEventRecord): string {
    this.eventSequence += 1
    return `${record.type}:${record.sessionID ? String(record.sessionID) : "global"}:${record.timestamp}:${this.eventSequence}`
  }

  private async tryGet(sessionID: SessionID): Promise<SessionInfo | undefined> {
    try {
      return await this.inner.get(sessionID)
    } catch {
      return undefined
    }
  }

  private readMessageV2Rows(sessionID: SessionID): OpenCodeMessageV2RowProjection[] {
    const rows = this.db
      .prepare("SELECT id, session_id, time_created, data FROM message WHERE session_id = ? ORDER BY time_created DESC, id DESC")
      .all(String(sessionID)) as Array<{ id: string; session_id: string; time_created: number; data: string }>
    return rows.map((row) => ({
      id: row.id,
      session_id: row.session_id,
      time_created: row.time_created,
      data: readJsonRecord(row.data),
    }))
  }

  private readPartRows(sessionID: SessionID): OpenCodePartRowProjection[] {
    const rows = this.db
      .prepare("SELECT id, session_id, message_id, time_created, data FROM part WHERE session_id = ? ORDER BY message_id ASC, id ASC")
      .all(String(sessionID)) as Array<{ id: string; session_id: string; message_id: string; time_created: number; data: string }>
    return rows.map((row) => ({
      id: row.id,
      session_id: row.session_id,
      message_id: row.message_id,
      time_created: row.time_created,
      data: readJsonRecord(row.data),
    }))
  }
}

function normalizeEventLogRecord(event: Omit<SessionEventRecord, "timestamp"> & { timestamp?: number }): SessionEventRecord {
  return {
    type: event.type,
    timestamp: event.timestamp ?? Date.now(),
    ...(event.sessionID ? { sessionID: event.sessionID } : {}),
    ...(event.data === undefined ? {} : { data: structuredClone(event.data) }),
  }
}

function eventLogRecordFromRow(row: { session_id: string | null; time_created: number; data: string }): SessionEventRecord {
  const payload = readJsonRecord(row.data)
  const type = typeof payload["type"] === "string" ? payload["type"] : "unknown"
  return {
    type,
    timestamp: row.time_created,
    ...(row.session_id ? { sessionID: row.session_id as SessionID } : {}),
    ...("data" in payload ? { data: structuredClone(payload["data"]) } : {}),
  }
}

function readJsonRecord(json: string): Record<string, unknown> {
  const parsed = JSON.parse(json) as unknown
  return isRecord(parsed) ? parsed : {}
}

function nativePartData(part: LegoMessagePart): Record<string, unknown> {
  if (part.type === "custom") {
    return {
      type: part.customType,
      ...(part.display ? { text: part.display } : {}),
      data: part.data,
    }
  }
  if (part.type === "text" || part.type === "reasoning") return { type: part.type, text: part.text }
  if (part.type === "tool_call") {
    return {
      type: "tool",
      id: part.toolCallID,
      name: part.toolName,
      input: part.input,
      status: part.status,
    }
  }
  if (part.type === "tool_result") {
    return {
      type: "tool-result",
      id: part.toolCallID,
      name: part.toolName,
      text: part.content.map((item) => (item.type === "text" || item.type === "reasoning" ? item.text : "")).filter(Boolean).join("\n"),
      isError: part.isError === true,
      details: part.details,
    }
  }
  if (part.type === "compaction") {
    const tailStartID = isRecord(part) && typeof part["tail_start_id"] === "string" ? part["tail_start_id"] : undefined
    return {
      type: "compaction",
      text: part.summary,
      reason: part.reason,
      ...(tailStartID ? { tail_start_id: tailStartID } : {}),
    }
  }
  return { type: "unknown" }
}

function readReplaySessionID(event: ProjectionReplayEvent): SessionID | undefined {
  const candidate = event.sessionID ?? (isRecord(event.properties) ? event.properties["sessionID"] : undefined)
  return typeof candidate === "string" ? (candidate as SessionID) : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export const openCodeReference = {
  repository: "https://github.com/anomalyco/opencode",
  branch: "dev",
  commit: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
  sessionFiles: [
    "packages/opencode/src/session/session.ts",
    "packages/opencode/src/session/prompt.ts",
    "packages/opencode/src/session/processor.ts",
    "packages/opencode/src/session/compaction.ts",
  ],
  pluginFiles: ["packages/plugin/src/index.ts", "packages/opencode/src/plugin/index.ts"],
}
