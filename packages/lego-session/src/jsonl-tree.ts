import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import {
  createID,
  type LegoMessage,
  type LegoMessagePart,
  type MessageID,
  type PartID,
  type SessionID,
  type SessionTranscript,
  type ToolCallID,
} from "@helix/contracts"
import type {
  BranchSessionInput,
  BranchWithSummaryInput,
  CreateBranchedSessionInput,
  CreateSessionInput,
  ForkFromSessionInput,
  ForkSessionInput,
  LabelEntry,
  MessageEntry,
  PageMessagesInput,
  PageMessagesResult,
  SessionContext,
  SessionFileEntry,
  SessionHeader,
  SessionInfo,
  SessionService,
  SessionTreeEntry,
} from "./types"
import { cloneMessageForSession, createSessionInfo, defaultTitle, ensureDir, listJsonlFiles, now, pageMessages } from "./utils"

interface JsonlState {
  info: SessionInfo
  header: SessionHeader
  file: string
  entries: SessionTreeEntry[]
  leafID: string | null
}

export interface JsonlTreeSessionServiceOptions {
  storageDir: string
  cwd?: string
}

export interface JsonlTreeDocument {
  header: SessionHeader
  entries: SessionTreeEntry[]
}

export class JsonlTreeFileStorage {
  readonly kind = "appendOnlyTree"
  readonly capabilities = {
    appendOnlyTree: true,
    migration: true,
    index: true,
  }
  readonly storageDir: string

  constructor(storageDir: string) {
    this.storageDir = ensureDir(storageDir)
  }

  fileForSession(timestamp: number, sessionID: SessionID): string {
    return join(this.storageDir, `${new Date(timestamp).toISOString().replace(/[:.]/g, "-")}_${sessionID}.jsonl`)
  }

  listFiles(input: { recursive?: boolean } = {}): string[] {
    return input.recursive ? listJsonlFilesRecursive(this.storageDir) : listJsonlFiles(this.storageDir)
  }

  read(path: string): JsonlTreeDocument {
    const file = resolve(path)
    const lines = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    if (!lines[0]) throw new Error(`Empty session file: ${file}`)
    const parsed = migratePiJsonlRecords(
      lines.map((line) => JSON.parse(line) as Record<string, unknown>),
      file,
    )
    const header = normalizePiHeader(parsed[0], file)
    const entries = parsed
      .slice(1)
      .filter((entry) => entry.type !== "session")
      .map((entry) => normalizePiEntry(entry, header.id))
    return { header, entries }
  }

  write(path: string, document: JsonlTreeDocument): void {
    const lines: SessionFileEntry[] = [document.header, ...document.entries]
    writeFileSync(path, `${lines.map((line) => JSON.stringify(serializePiFileEntry(line))).join("\n")}\n`)
  }

  remove(path: string): void {
    if (existsSync(path)) rmSync(path)
  }
}

export class JsonlTreeSessionService implements SessionService {
  readonly kind = "jsonl-tree"
  readonly storage: JsonlTreeFileStorage
  private readonly defaultCwd: string
  private readonly states = new Map<SessionID, JsonlState>()

  constructor(options: JsonlTreeSessionServiceOptions) {
    this.storage = new JsonlTreeFileStorage(options.storageDir)
    this.defaultCwd = resolve(options.cwd ?? process.cwd())
  }

  async create(input: CreateSessionInput = {}): Promise<SessionInfo> {
    const baseInfo = createSessionInfo({
      cwd: input.cwd ?? this.defaultCwd,
      title: input.title,
      parentID: input.parentID,
      path: input.path,
      metadata: input.metadata,
    })
    const timestamp = baseInfo.created
    const file = this.storage.fileForSession(timestamp, baseInfo.id)
    const info: SessionInfo = { ...baseInfo, path: file }
    const header: SessionHeader = {
      type: "session",
      version: 3,
      id: info.id,
      timestamp,
      cwd: info.cwd,
      leafID: null,
      title: info.title,
      ...(input.path ? { parentSession: input.path } : {}),
      ...(info.metadata ? { metadata: info.metadata } : {}),
    }
    const state: JsonlState = { info, header, file, entries: [], leafID: null }
    this.states.set(info.id, state)
    this.rewrite(state)
    return { ...info }
  }

  async open(path: string): Promise<SessionInfo> {
    const state = this.load(path)
    this.states.set(state.info.id, state)
    return { ...state.info }
  }

  async resume(input: { cwd?: string } = {}): Promise<SessionInfo> {
    const cwd = resolve(input.cwd ?? this.defaultCwd)
    const sessions = await this.list({ cwd })
    if (sessions[0]) return sessions[0]
    return this.create({ cwd })
  }

  async continueRecent(input: { cwd?: string } = {}): Promise<SessionInfo> {
    return this.resume(input)
  }

  async list(input: { cwd?: string } = {}): Promise<SessionInfo[]> {
    for (const file of this.storage.listFiles()) {
      const loaded = this.tryLoad(file)
      if (loaded) this.states.set(loaded.info.id, loaded)
    }
    const cwd = input.cwd ? resolve(input.cwd) : undefined
    return Array.from(this.states.values())
      .map((state) => state.info)
      .filter((info) => !cwd || info.cwd === cwd)
      .sort((a, b) => b.updated - a.updated)
      .map((info) => ({ ...info }))
  }

  async listAll(input: { cwd?: string } = {}): Promise<SessionInfo[]> {
    for (const file of this.storage.listFiles({ recursive: true })) {
      const loaded = this.tryLoad(file)
      if (loaded) this.states.set(loaded.info.id, loaded)
    }
    const cwd = input.cwd ? resolve(input.cwd) : undefined
    return Array.from(this.states.values())
      .map((state) => state.info)
      .filter((info) => !cwd || info.cwd === cwd)
      .sort((a, b) => b.updated - a.updated)
      .map((info) => ({ ...info }))
  }

  async get(sessionID: SessionID): Promise<SessionInfo> {
    const state = this.mustState(sessionID)
    return { ...state.info }
  }

  async fork(input: ForkSessionInput): Promise<SessionInfo> {
    const source = this.mustState(input.sessionID)
    const fork = await this.create({
      cwd: input.cwd ?? source.info.cwd,
      title: input.title ?? `Fork: ${source.info.title || defaultTitle(true)}`,
      parentID: source.info.id,
      path: source.file,
    })
    const target = this.mustState(fork.id)
    const branch = this.branchEntries(source)
    for (const entry of branch) {
      if (entry.type !== "message") continue
      if (input.messageID && entry.message.id >= input.messageID) break
      this.appendEntry(target, {
        type: "message",
        id: createID("part"),
        parentID: target.leafID,
        timestamp: now(),
        message: cloneMessageForSession(entry.message, target.info.id),
      })
    }
    return fork
  }

  forkFrom(input: ForkFromSessionInput): SessionInfo {
    const source = this.load(input.sourcePath)
    const baseInfo = createSessionInfo({
      cwd: input.cwd ?? source.info.cwd,
      title: input.title ?? `Fork: ${source.info.title || defaultTitle(true)}`,
      parentID: source.info.id,
      path: source.file,
      metadata: source.info.metadata,
    })
    const file = this.storage.fileForSession(baseInfo.created, baseInfo.id)
    const info: SessionInfo = { ...baseInfo, path: file }
    const header: SessionHeader = {
      type: "session",
      version: 3,
      id: info.id,
      timestamp: info.created,
      cwd: info.cwd,
      parentSession: source.file,
      leafID: source.leafID,
      title: info.title,
      ...(info.metadata ? { metadata: info.metadata } : {}),
    }
    const state: JsonlState = {
      info,
      header,
      file,
      entries: source.entries.map((entry) => cloneEntryForSession(entry, info.id)),
      leafID: source.leafID,
    }
    this.states.set(info.id, state)
    this.rewrite(state)
    return { ...info }
  }

  async branch(input: BranchSessionInput): Promise<void> {
    const state = this.mustState(input.sessionID)
    if (input.entryID !== null && !this.findEntry(state, input.entryID)) {
      throw new Error(`Entry ${input.entryID} not found in session ${input.sessionID}`)
    }
    state.leafID = input.entryID
    state.info.updated = now()
    this.rewrite(state)
  }

  branchWithSummary(input: BranchWithSummaryInput): string {
    const state = this.mustState(input.sessionID)
    if (input.entryID !== null && !this.findEntry(state, input.entryID)) {
      throw new Error(`Entry ${input.entryID} not found in session ${input.sessionID}`)
    }
    state.leafID = input.entryID
    return this.appendBranchSummary({
      sessionID: input.sessionID,
      fromID: input.entryID ?? "root",
      summary: input.summary,
      ...(input.details === undefined ? {} : { details: input.details }),
      ...(input.fromHook === undefined ? {} : { fromHook: input.fromHook }),
    })
  }

  createBranchedSession(input: CreateBranchedSessionInput): SessionInfo {
    const source = this.mustState(input.sessionID)
    const path = this.branchEntriesFrom(source, input.leafID)
    if (path.length === 0) throw new Error(`Entry ${input.leafID} not found in session ${input.sessionID}`)

    const baseInfo = createSessionInfo({
      cwd: input.cwd ?? source.info.cwd,
      title: input.title ?? `Branch: ${source.info.title || defaultTitle(true)}`,
      parentID: source.info.id,
      path: source.file,
      metadata: source.info.metadata,
    })
    const file = this.storage.fileForSession(baseInfo.created, baseInfo.id)
    const info: SessionInfo = { ...baseInfo, path: file }
    const header: SessionHeader = {
      type: "session",
      version: 3,
      id: info.id,
      timestamp: info.created,
      cwd: info.cwd,
      parentSession: source.file,
      leafID: null,
      title: info.title,
      ...(info.metadata ? { metadata: info.metadata } : {}),
    }
    const pathWithoutLabels = cloneBranchPathForSession(path, info.id)
    const labelEntries = this.labelEntriesForPath(source, pathWithoutLabels)
    const entries = [...pathWithoutLabels, ...labelEntries]
    const state: JsonlState = {
      info,
      header,
      file,
      entries,
      leafID: entries.at(-1)?.id ?? null,
    }
    this.states.set(info.id, state)
    this.rewrite(state)
    return { ...info }
  }

  async remove(sessionID: SessionID): Promise<void> {
    const state = this.mustState(sessionID)
    this.storage.remove(state.file)
    this.states.delete(sessionID)
  }

  async touch(sessionID: SessionID): Promise<void> {
    const state = this.mustState(sessionID)
    state.info.updated = now()
    this.rewrite(state)
  }

  async setTitle(input: { sessionID: SessionID; title: string }): Promise<void> {
    const state = this.mustState(input.sessionID)
    state.info.title = input.title
    state.info.updated = now()
    this.appendEntry(state, {
      type: "session_info",
      id: createID("part"),
      parentID: state.leafID,
      timestamp: now(),
      name: input.title,
    })
  }

  async setPermission(input: { sessionID: SessionID; permission: unknown }): Promise<void> {
    const state = this.mustState(input.sessionID)
    state.info.permission = input.permission
    state.info.updated = now()
    this.rewrite(state)
  }

  async messages(input: { sessionID: SessionID; limit?: number }): Promise<LegoMessage[]> {
    const state = this.mustState(input.sessionID)
    const messages = this.branchEntries(state)
      .filter((entry): entry is MessageEntry => entry.type === "message")
      .map((entry) => entry.message)
    return input.limit ? messages.slice(-input.limit) : messages
  }

  async pageMessages(input: PageMessagesInput): Promise<PageMessagesResult> {
    return pageMessages(await this.messages({ sessionID: input.sessionID }), input)
  }

  async transcript(sessionID: SessionID): Promise<SessionTranscript> {
    return { sessionID, messages: await this.messages({ sessionID }) }
  }

  buildContext(input: { sessionID: SessionID; leafID?: string | null }): SessionContext {
    const state = this.mustState(input.sessionID)
    const path = this.branchEntriesFrom(state, input.leafID === undefined ? state.leafID : input.leafID)
    return buildPiSessionContext({
      sessionID: input.sessionID,
      entries: path,
    })
  }

  async appendMessage(message: LegoMessage): Promise<LegoMessage> {
    const state = this.mustState(message.sessionID)
    this.appendEntry(state, {
      type: "message",
      id: String(message.id),
      parentID: state.leafID,
      timestamp: message.time.created,
      message: structuredClone(message),
    })
    return structuredClone(message)
  }

  async updateMessage(message: LegoMessage): Promise<LegoMessage> {
    const state = this.mustState(message.sessionID)
    const entry = state.entries.find((candidate): candidate is MessageEntry => {
      return candidate.type === "message" && candidate.message.id === message.id
    })
    if (!entry) throw new Error(`Message ${message.id} not found`)
    entry.message = structuredClone(message)
    state.info.updated = now()
    this.rewrite(state)
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
    state.entries = state.entries.filter((entry) => entry.type !== "message" || entry.message.id !== input.messageID)
    if (state.leafID === input.messageID) state.leafID = state.entries.at(-1)?.id ?? null
    state.info.updated = now()
    this.rewrite(state)
  }

  async removePart(input: { sessionID: SessionID; messageID: MessageID; partID: PartID }): Promise<void> {
    const message = this.mustMessage(input.sessionID, input.messageID)
    message.parts = (message.parts as LegoMessagePart[]).filter((part) => part.id !== input.partID) as typeof message.parts
    await this.updateMessage(message)
  }

  async diff(_sessionID: SessionID): Promise<unknown[]> {
    return []
  }

  getEntries(sessionID: SessionID): SessionTreeEntry[] {
    return structuredClone(this.mustState(sessionID).entries)
  }

  getHeader(sessionID: SessionID): SessionHeader {
    return structuredClone(this.mustState(sessionID).header)
  }

  getLeafID(sessionID: SessionID): string | null {
    return this.mustState(sessionID).leafID
  }

  appendCompaction(input: {
    sessionID: SessionID
    summary: string
    firstKeptEntryID?: string
    tokensBefore?: number
    details?: unknown
    fromHook?: boolean
  }): string {
    const state = this.mustState(input.sessionID)
    const id = createID("part")
    this.appendEntry(state, {
      type: "compaction",
      id,
      parentID: state.leafID,
      timestamp: now(),
      summary: input.summary,
      ...(input.firstKeptEntryID ? { firstKeptEntryID: input.firstKeptEntryID } : {}),
      ...(input.tokensBefore === undefined ? {} : { tokensBefore: input.tokensBefore }),
      ...(input.details === undefined ? {} : { details: input.details }),
      ...(input.fromHook === undefined ? {} : { fromHook: input.fromHook }),
    })
    return id
  }

  appendBranchSummary(input: { sessionID: SessionID; fromID: string; summary: string; details?: unknown; fromHook?: boolean }): string {
    const state = this.mustState(input.sessionID)
    const id = createID("part")
    this.appendEntry(state, {
      type: "branch_summary",
      id,
      parentID: state.leafID,
      timestamp: now(),
      fromID: input.fromID,
      summary: input.summary,
      ...(input.details === undefined ? {} : { details: input.details }),
      ...(input.fromHook === undefined ? {} : { fromHook: input.fromHook }),
    })
    return id
  }

  appendThinkingLevelChange(input: { sessionID: SessionID; level: string; previousLevel?: string; details?: unknown }): string {
    const state = this.mustState(input.sessionID)
    const id = createID("part")
    this.appendEntry(state, {
      type: "thinking_level_change",
      id,
      parentID: state.leafID,
      timestamp: now(),
      level: input.level,
      ...(input.previousLevel ? { previousLevel: input.previousLevel } : {}),
      ...(input.details === undefined ? {} : { details: input.details }),
    })
    return id
  }

  appendModelChange(input: {
    sessionID: SessionID
    model: { providerID?: string; modelID: string }
    previousModel?: { providerID?: string; modelID: string }
    details?: unknown
  }): string {
    const state = this.mustState(input.sessionID)
    const id = createID("part")
    this.appendEntry(state, {
      type: "model_change",
      id,
      parentID: state.leafID,
      timestamp: now(),
      model: input.model,
      ...(input.previousModel ? { previousModel: input.previousModel } : {}),
      ...(input.details === undefined ? {} : { details: input.details }),
    })
    return id
  }

  appendCustomEntry(input: { sessionID: SessionID; customType: string; data?: unknown }): string {
    const state = this.mustState(input.sessionID)
    const id = createID("part")
    this.appendEntry(state, {
      type: "custom",
      id,
      parentID: state.leafID,
      timestamp: now(),
      customType: input.customType,
      ...(input.data === undefined ? {} : { data: input.data }),
    })
    return id
  }

  appendCustomMessageEntry(input: {
    sessionID: SessionID
    customType: string
    content: unknown
    display?: string
    details?: unknown
  }): string {
    const state = this.mustState(input.sessionID)
    const id = createID("part")
    this.appendEntry(state, {
      type: "custom_message",
      id,
      parentID: state.leafID,
      timestamp: now(),
      customType: input.customType,
      content: input.content,
      ...(input.display ? { display: input.display } : {}),
      ...(input.details === undefined ? {} : { details: input.details }),
    })
    return id
  }

  appendLabel(input: { sessionID: SessionID; targetID: string; label?: string }): string {
    const state = this.mustState(input.sessionID)
    const id = createID("part")
    this.appendEntry(state, {
      type: "label",
      id,
      parentID: state.leafID,
      timestamp: now(),
      targetID: input.targetID,
      ...(input.label ? { label: input.label } : {}),
    })
    return id
  }

  private mustState(sessionID: SessionID): JsonlState {
    const state = this.states.get(sessionID)
    if (!state) throw new Error(`Session not found: ${sessionID}`)
    return state
  }

  private mustMessage(sessionID: SessionID, messageID: MessageID): LegoMessage {
    const state = this.mustState(sessionID)
    const entry = state.entries.find((candidate): candidate is MessageEntry => {
      return candidate.type === "message" && candidate.message.id === messageID
    })
    if (!entry) throw new Error(`Message ${messageID} not found`)
    return structuredClone(entry.message)
  }

  private appendEntry(state: JsonlState, entry: SessionTreeEntry): void {
    state.entries.push(entry)
    state.leafID = entry.id
    state.info.updated = now()
    this.rewrite(state)
  }

  private branchEntries(state: JsonlState): SessionTreeEntry[] {
    return this.branchEntriesFrom(state, state.leafID)
  }

  private branchEntriesFrom(state: JsonlState, leafID: string | null): SessionTreeEntry[] {
    const byID = new Map(state.entries.map((entry) => [entry.id, entry]))
    const result: SessionTreeEntry[] = []
    let cursor = leafID
    while (cursor) {
      const entry = byID.get(cursor)
      if (!entry) break
      result.push(entry)
      cursor = entry.parentID
    }
    return result.reverse()
  }

  private findEntry(state: JsonlState, id: string): SessionTreeEntry | undefined {
    return state.entries.find((entry) => entry.id === id || (entry.type === "message" && entry.message.id === id))
  }

  private labelEntriesForPath(state: JsonlState, path: SessionTreeEntry[]): LabelEntry[] {
    const pathEntryIDs = new Set(path.map((entry) => entry.id))
    const labels = new Map<string, LabelEntry>()
    for (const entry of state.entries) {
      if (entry.type !== "label" || !pathEntryIDs.has(entry.targetID)) continue
      if (entry.label) labels.set(entry.targetID, entry)
      else labels.delete(entry.targetID)
    }
    let parentID = path.at(-1)?.id ?? null
    const result: LabelEntry[] = []
    for (const entry of labels.values()) {
      const cloned: LabelEntry = {
        ...structuredClone(entry),
        id: createID("part"),
        parentID,
      }
      result.push(cloned)
      parentID = cloned.id
    }
    return result
  }

  private rewrite(state: JsonlState): void {
    state.header.title = state.info.title
    state.header.cwd = state.info.cwd
    state.header.leafID = state.leafID
    this.storage.write(state.file, { header: state.header, entries: state.entries })
  }

  private tryLoad(path: string): JsonlState | undefined {
    try {
      return this.load(path)
    } catch {
      return undefined
    }
  }

  private load(path: string): JsonlState {
    const file = resolve(path)
    const { header, entries } = this.storage.read(file)
    if (!header || header.type !== "session") throw new Error(`Invalid session header: ${file}`)
    const info: SessionInfo = {
      id: header.id,
      title: header.title ?? defaultTitle(false),
      cwd: resolve(header.cwd),
      path: file,
      created: header.timestamp,
      updated: entries.at(-1)?.timestamp ?? header.timestamp,
      ...(header.metadata ? { metadata: header.metadata } : {}),
    }
    return {
      info,
      header,
      file,
      entries,
      leafID: header.leafID ?? entries.at(-1)?.id ?? null,
    }
  }
}

function migratePiJsonlRecords(records: Record<string, unknown>[], file: string): Record<string, unknown>[] {
  const rawHeader = records[0]
  if (!rawHeader || rawHeader.type !== "session") return records

  const header = { ...rawHeader }
  const headerTimestamp = timestampMs(header.timestamp)
  if (!stringValue(header.id)) header.id = fallbackSessionID(file)
  if (!stringValue(header.cwd)) header.cwd = process.cwd()
  if (!hasOwn(header, "timestamp")) header.timestamp = headerTimestamp
  header.version = 3

  const idsByParsedIndex = new Map<number, string>()
  const idsByLegacyIndex = new Map<number, string>()
  let legacyIndex = 0
  for (let parsedIndex = 1; parsedIndex < records.length; parsedIndex++) {
    const raw = records[parsedIndex]
    if (!raw || raw.type === "session") continue
    const id = stringValue(raw.id) ?? messageIDValue(raw) ?? legacyEntryID(legacyIndex)
    idsByParsedIndex.set(parsedIndex, id)
    idsByLegacyIndex.set(legacyIndex, id)
    legacyIndex += 1
  }
  if (!stringValue(header.leafID ?? header.leafId)) {
    const leafIndex = numberValue(header.leafEntryIndex ?? header.leafIndex)
    const leafID = leafIndex === undefined ? undefined : idsByParsedIndex.get(leafIndex) ?? idsByLegacyIndex.get(leafIndex)
    if (leafID) header.leafId = leafID
  }

  let previousID: string | null = null
  return records.map((raw, parsedIndex) => {
    if (parsedIndex === 0) return header
    if (raw.type === "session") return raw
    const entry = { ...raw }
    const id = idsByParsedIndex.get(parsedIndex)
    if (id) entry.id = id
    if (!hasOwn(entry, "parentID") && !hasOwn(entry, "parentId")) entry.parentId = previousID
    if (!hasOwn(entry, "timestamp")) entry.timestamp = headerTimestamp + parsedIndex

    if (entry.type === "compaction" && !hasOwn(entry, "firstKeptEntryID") && !hasOwn(entry, "firstKeptEntryId")) {
      const firstKeptEntryIndex = numberValue(entry.firstKeptEntryIndex)
      const firstKeptEntryID =
        firstKeptEntryIndex === undefined
          ? undefined
          : idsByParsedIndex.get(firstKeptEntryIndex) ?? idsByLegacyIndex.get(firstKeptEntryIndex)
      if (firstKeptEntryID) entry.firstKeptEntryId = firstKeptEntryID
    }
    delete entry.firstKeptEntryIndex

    if (id) previousID = id
    return entry
  })
}

function fallbackSessionID(file: string): string {
  const name = basename(file, ".jsonl").replace(/[^0-9A-Za-z_-]/g, "_")
  return `ses_${name || "legacy"}`
}

function legacyEntryID(index: number): string {
  return `mig_${index.toString(16).padStart(8, "0")}`
}

function messageIDValue(raw: Record<string, unknown>): string | undefined {
  if (raw.type !== "message") return undefined
  return stringValue(recordValue(raw.message)?.id)
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function normalizePiHeader(raw: Record<string, unknown> | undefined, file: string): SessionHeader {
  if (!raw || raw.type !== "session") throw new Error(`Invalid session header: ${file}`)
  const parentSession = stringValue(raw.parentSession)
  const leafID = stringValue(raw.leafID ?? raw.leafId)
  const title = stringValue(raw.title)
  const metadata = recordValue(raw.metadata)
  return {
    type: "session",
    version: numberValue(raw.version) ?? 1,
    id: requiredString(raw.id, "session.id") as SessionID,
    timestamp: timestampMs(raw.timestamp),
    cwd: stringValue(raw.cwd) ?? process.cwd(),
    ...(parentSession ? { parentSession } : {}),
    ...(leafID ? { leafID } : {}),
    ...(title ? { title } : {}),
    ...(metadata ? { metadata } : {}),
  }
}

function normalizePiEntry(raw: Record<string, unknown>, sessionID: SessionID): SessionTreeEntry {
  const type = requiredString(raw.type, "entry.type")
  const base = {
    id: requiredString(raw.id, `${type}.id`),
    parentID: nullableString(raw.parentID ?? raw.parentId),
    timestamp: timestampMs(raw.timestamp),
  }

  if (type === "message") {
    return {
      ...base,
      type: "message",
      message: normalizePiMessage(requiredRecord(raw.message, "message.message"), base, sessionID),
    }
  }
  if (type === "compaction") {
    const firstKeptEntryID = stringValue(raw.firstKeptEntryID ?? raw.firstKeptEntryId)
    const tokensBefore = numberValue(raw.tokensBefore)
    return {
      ...base,
      type: "compaction",
      summary: stringValue(raw.summary) ?? "",
      ...(firstKeptEntryID ? { firstKeptEntryID } : {}),
      ...(tokensBefore === undefined ? {} : { tokensBefore }),
      ...(raw.details === undefined ? {} : { details: raw.details }),
      ...(raw.fromHook === undefined ? {} : { fromHook: Boolean(raw.fromHook) }),
    }
  }
  if (type === "branch_summary") {
    return {
      ...base,
      type: "branch_summary",
      fromID: stringValue(raw.fromID ?? raw.fromId) ?? "root",
      summary: stringValue(raw.summary) ?? "",
      ...(raw.details === undefined ? {} : { details: raw.details }),
      ...(raw.fromHook === undefined ? {} : { fromHook: Boolean(raw.fromHook) }),
    }
  }
  if (type === "thinking_level_change") {
    const previousLevel = stringValue(raw.previousLevel)
    return {
      ...base,
      type: "thinking_level_change",
      level: stringValue(raw.level ?? raw.thinkingLevel) ?? "off",
      ...(previousLevel ? { previousLevel } : {}),
      ...(raw.details === undefined ? {} : { details: raw.details }),
    }
  }
  if (type === "model_change") {
    const model = modelValue(raw.model)
    const providerID = stringValue(raw.provider)
    const modelID = stringValue(raw.modelID ?? raw.modelId) ?? ""
    const previousModel = modelValue(raw.previousModel)
    return {
      ...base,
      type: "model_change",
      model: model ?? { ...(providerID ? { providerID } : {}), modelID },
      ...(previousModel ? { previousModel } : {}),
      ...(raw.details === undefined ? {} : { details: raw.details }),
    }
  }
  if (type === "custom") {
    return {
      ...base,
      type: "custom",
      customType: stringValue(raw.customType) ?? "custom",
      ...(raw.data === undefined ? {} : { data: raw.data }),
    }
  }
  if (type === "custom_message") {
    return {
      ...base,
      type: "custom_message",
      customType: stringValue(raw.customType) ?? "custom",
      content: raw.content,
      ...(raw.display === undefined ? {} : { display: String(raw.display) }),
      ...(raw.details === undefined ? {} : { details: raw.details }),
    }
  }
  if (type === "label") {
    const label = stringValue(raw.label)
    return {
      ...base,
      type: "label",
      targetID: stringValue(raw.targetID ?? raw.targetId) ?? "",
      ...(label ? { label } : {}),
    }
  }
  if (type === "session_info") {
    return {
      ...base,
      type: "session_info",
      name: stringValue(raw.name) ?? "",
    }
  }
  throw new Error(`Unsupported Pi session entry type: ${type}`)
}

function normalizePiMessage(
  raw: Record<string, unknown>,
  entry: { id: string; timestamp: number },
  fallbackSessionID: SessionID,
): LegoMessage {
  if (Array.isArray(raw.parts)) return normalizeCommonPiMessage(raw, entry, fallbackSessionID)

  const role = stringValue(raw.role)
  const sessionID = (stringValue(raw.sessionID) ?? fallbackSessionID) as SessionID
  const id = (stringValue(raw.id) ?? `msg_${entry.id}`) as MessageID
  const timestamp = timestampMs(raw.timestamp ?? entry.timestamp)
  if (role === "toolResult") {
    return {
      id,
      sessionID,
      role: "tool",
      time: { created: timestamp, completed: timestamp },
      parts: [
        {
          id: `prt_${entry.id}_tool_result` as PartID,
          type: "tool_result",
          toolCallID: (stringValue(raw.toolCallId ?? raw.toolCallID) ?? entry.id) as ToolCallID,
          toolName: stringValue(raw.toolName ?? raw.name) ?? "tool",
          content: normalizePiContentParts(raw.content, id, sessionID).filter(
            (part) => part.type !== "tool_call" && part.type !== "tool_result",
          ),
          ...(raw.isError === true ? { isError: true } : {}),
          ...(raw.details === undefined ? {} : { details: raw.details }),
        },
      ],
    }
  }

  const parts = normalizePiContentParts(raw.content ?? raw.parts, id, sessionID)
  const metadata = piMessageMetadata(raw)
  const model = piMessageModel(raw)
  if (role === "user") {
    return {
      id,
      sessionID,
      role: "user",
      time: { created: timestamp },
      parts,
      ...(metadata ? { metadata } : {}),
    }
  }

  const providerID = stringValue(raw.provider)
  const modelID = stringValue(raw.model)
  const finish = piFinish(raw.stopReason)
  const usage = piUsage(raw.usage)
  const cost = numberValue(raw.cost)
  const errorMessage = stringValue(raw.errorMessage)
  return {
    id,
    sessionID,
    role: "assistant",
    time: { created: timestamp, completed: timestamp },
    parts,
    ...(model ? { model } : {}),
    ...(providerID ? { providerID } : {}),
    ...(modelID ? { modelID } : {}),
    ...(finish ? { finish } : {}),
    ...(usage ? { usage } : {}),
    ...(cost === undefined ? {} : { cost }),
    ...(errorMessage ? { error: { name: "PiAgentError", message: errorMessage } } : {}),
    ...(metadata ? { metadata } : {}),
  }
}

function normalizeCommonPiMessage(
  raw: Record<string, unknown>,
  entry: { id: string; timestamp: number },
  fallbackSessionID: SessionID,
): LegoMessage {
  const sessionID = (stringValue(raw.sessionID) ?? fallbackSessionID) as SessionID
  const id = (stringValue(raw.id) ?? `msg_${entry.id}`) as MessageID
  const parts = (raw.parts as LegoMessagePart[]).map((part) => structuredClone(part))
  const timeRecord = recordValue(raw.time)
  const created = timestampMs(timeRecord?.created ?? raw.timestamp ?? entry.timestamp)
  const completed = timeRecord?.completed === undefined ? undefined : timestampMs(timeRecord.completed)
  const metadata = recordValue(raw.metadata)
  const base = {
    id,
    sessionID,
    time: { created, ...(completed === undefined ? {} : { completed }) },
    parts,
  }
  if (raw.role === "user") return { ...base, role: "user", ...(metadata ? { metadata } : {}) }
  if (raw.role === "tool") {
    return {
      ...base,
      role: "tool",
      parts: parts.filter((part): part is Extract<LegoMessagePart, { type: "tool_result" }> => part.type === "tool_result"),
      ...(metadata ? { metadata } : {}),
    }
  }
  const finish = stringValue(raw.finish)
  return {
    ...base,
    role: "assistant",
    ...(finish ? { finish } : {}),
    ...(metadata ? { metadata } : {}),
  }
}

function normalizePiContentParts(content: unknown, messageID: MessageID, sessionID: SessionID): LegoMessagePart[] {
  const items = Array.isArray(content) ? content : content === undefined ? [] : [{ type: "text", text: String(content) }]
  return items.flatMap((item, index) => normalizePiContentPart(item, index, messageID, sessionID))
}

function normalizePiContentPart(
  value: unknown,
  index: number,
  messageID: MessageID,
  sessionID: SessionID,
): LegoMessagePart[] {
  const part = recordValue(value)
  if (!part) return [{ id: `prt_${messageID}_${index}` as PartID, type: "text", text: String(value) }]
  const type = stringValue(part.type) ?? "custom"
  const id = (stringValue(part.id) ?? `prt_${messageID}_${index}`) as PartID
  if (type === "text") return [{ id, type: "text", text: String(part.text ?? "") }]
  if (type === "thinking" || type === "reasoning") {
    return [{ id, type: "reasoning", text: String(part.thinking ?? part.text ?? "") }]
  }
  if (type === "toolCall") {
    return [
      {
        id,
        type: "tool_call",
        toolCallID: (stringValue(part.id ?? part.toolCallID ?? part.toolCallId) ?? String(id)) as ToolCallID,
        toolName: stringValue(part.name ?? part.toolName) ?? "tool",
        input: recordValue(part.arguments ?? part.input ?? part.args) ?? {},
        status: "completed",
      },
    ]
  }
  if (type === "toolResult") {
    return [
      {
        id,
        type: "tool_result",
        toolCallID: (stringValue(part.toolCallId ?? part.toolCallID) ?? String(id)) as ToolCallID,
        toolName: stringValue(part.toolName ?? part.name) ?? "tool",
        content: normalizePiContentParts(part.content, messageID, sessionID),
        ...(part.isError === true ? { isError: true } : {}),
        ...(part.details === undefined ? {} : { details: part.details }),
      },
    ]
  }
  const display = stringValue(part.display)
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

function piMessageModel(raw: Record<string, unknown>): { providerID: string; modelID: string } | undefined {
  const modelID = stringValue(raw.model ?? raw.modelID ?? raw.modelId)
  if (!modelID) return undefined
  const providerID = stringValue(raw.provider ?? raw.providerID)
  if (!providerID) return undefined
  return { providerID, modelID }
}

function piUsage(value: unknown): { input: number; output: number; cacheRead?: number; cacheWrite?: number } | undefined {
  const record = recordValue(value)
  if (!record) return undefined
  const input = numberValue(record.input) ?? 0
  const output = numberValue(record.output) ?? 0
  const cacheRead = numberValue(record.cacheRead)
  const cacheWrite = numberValue(record.cacheWrite)
  return {
    input,
    output,
    ...(cacheRead === undefined ? {} : { cacheRead }),
    ...(cacheWrite === undefined ? {} : { cacheWrite }),
  }
}

function piFinish(value: unknown): string | undefined {
  const stopReason = stringValue(value)
  if (!stopReason) return undefined
  if (stopReason === "toolUse") return "tool_calls"
  return stopReason
}

function piMessageMetadata(raw: Record<string, unknown>): Record<string, unknown> | undefined {
  const metadata = omitUndefined({
    api: raw.api,
    provider: raw.provider,
    model: raw.model,
    stopReason: raw.stopReason,
  })
  return Object.keys(metadata).length > 0 ? metadata : undefined
}

function serializePiFileEntry(entry: SessionFileEntry): Record<string, unknown> {
  if (entry.type === "session") {
    return omitUndefined({
      type: "session",
      version: entry.version,
      id: entry.id,
      timestamp: isoTimestamp(entry.timestamp),
      cwd: entry.cwd,
      parentSession: entry.parentSession,
      leafId: entry.leafID,
      title: entry.title,
      metadata: entry.metadata,
    })
  }

  const base = {
    type: entry.type,
    id: entry.id,
    parentId: entry.parentID,
    timestamp: isoTimestamp(entry.timestamp),
  }
  if (entry.type === "message") return omitUndefined({ ...base, message: entry.message })
  if (entry.type === "compaction") {
    return omitUndefined({
      ...base,
      summary: entry.summary,
      firstKeptEntryId: entry.firstKeptEntryID,
      tokensBefore: entry.tokensBefore,
      details: entry.details,
      fromHook: entry.fromHook,
    })
  }
  if (entry.type === "branch_summary") {
    return omitUndefined({
      ...base,
      fromId: entry.fromID,
      summary: entry.summary,
      details: entry.details,
      fromHook: entry.fromHook,
    })
  }
  if (entry.type === "thinking_level_change") {
    return omitUndefined({
      ...base,
      thinkingLevel: entry.level,
      previousLevel: entry.previousLevel,
      details: entry.details,
    })
  }
  if (entry.type === "model_change") {
    return omitUndefined({
      ...base,
      provider: entry.model.providerID,
      modelId: entry.model.modelID,
      previousModel: entry.previousModel ? serializePiModel(entry.previousModel) : undefined,
      details: entry.details,
    })
  }
  if (entry.type === "custom") return omitUndefined({ ...base, customType: entry.customType, data: entry.data })
  if (entry.type === "custom_message") {
    return omitUndefined({
      ...base,
      customType: entry.customType,
      content: entry.content,
      display: entry.display,
      details: entry.details,
    })
  }
  if (entry.type === "label") return omitUndefined({ ...base, targetId: entry.targetID, label: entry.label })
  return omitUndefined({ ...base, name: entry.name })
}

function requiredString(value: unknown, field: string): string {
  const result = stringValue(value)
  if (result === undefined) throw new Error(`Invalid Pi session ${field}`)
  return result
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return stringValue(value) ?? null
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function timestampMs(value: unknown): number {
  const numeric = numberValue(value)
  if (numeric !== undefined) return numeric
  if (typeof value === "string") {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return parsed
    const numericString = Number(value)
    if (Number.isFinite(numericString)) return numericString
  }
  return now()
}

function isoTimestamp(value: unknown): string {
  return new Date(timestampMs(value)).toISOString()
}

function requiredRecord(value: unknown, field: string): Record<string, unknown> {
  const result = recordValue(value)
  if (!result) throw new Error(`Invalid Pi session ${field}`)
  return result
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function modelValue(value: unknown): { providerID?: string; modelID: string } | undefined {
  const record = recordValue(value)
  if (!record) return undefined
  const modelID = stringValue(record.modelID ?? record.modelId)
  if (!modelID) return undefined
  const providerID = stringValue(record.providerID ?? record.provider)
  return {
    ...(providerID ? { providerID } : {}),
    modelID,
  }
}

function serializePiModel(model: { providerID?: string; modelID: string }): Record<string, unknown> {
  return omitUndefined({
    provider: model.providerID,
    modelId: model.modelID,
  })
}

function omitUndefined(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined))
}

function cloneEntryForSession(entry: SessionTreeEntry, sessionID: SessionID): SessionTreeEntry {
  const cloned = structuredClone(entry)
  if (cloned.type !== "message") return cloned
  cloned.message = {
    ...cloned.message,
    sessionID,
  } as LegoMessage
  return cloned
}

function cloneBranchPathForSession(path: SessionTreeEntry[], sessionID: SessionID): SessionTreeEntry[] {
  const kept = new Set<string>()
  const result: SessionTreeEntry[] = []
  let lastKeptID: string | null = null
  for (const entry of path) {
    if (entry.type === "label") continue
    const cloned = cloneEntryForSession(entry, sessionID)
    if (cloned.parentID && !kept.has(cloned.parentID)) cloned.parentID = lastKeptID
    kept.add(cloned.id)
    lastKeptID = cloned.id
    result.push(cloned)
  }
  return result
}

function buildPiSessionContext(input: { sessionID: SessionID; entries: SessionTreeEntry[] }): SessionContext {
  let thinkingLevel = "off"
  let model: SessionContext["model"] = null
  let compaction: Extract<SessionTreeEntry, { type: "compaction" }> | undefined
  for (const entry of input.entries) {
    if (entry.type === "thinking_level_change") thinkingLevel = entry.level
    if (entry.type === "model_change") model = entry.model
    if (entry.type === "message" && entry.message.role === "assistant" && entry.message.model) model = entry.message.model
    if (entry.type === "compaction") compaction = entry
  }

  if (!compaction) {
    return {
      messages: input.entries.flatMap((entry) => contextMessageForEntry(input.sessionID, entry)),
      thinkingLevel,
      model,
    }
  }

  const messages: LegoMessage[] = [compactionContextMessage(input.sessionID, compaction)]
  const compactionIndex = input.entries.findIndex((entry) => entry.id === compaction.id)
  let foundFirstKept = false
  for (let index = 0; index < compactionIndex; index++) {
    const entry = input.entries[index]
    if (!entry) continue
    if (entry.id === compaction.firstKeptEntryID) foundFirstKept = true
    if (foundFirstKept) messages.push(...contextMessageForEntry(input.sessionID, entry))
  }
  for (let index = compactionIndex + 1; index < input.entries.length; index++) {
    const entry = input.entries[index]
    if (entry) messages.push(...contextMessageForEntry(input.sessionID, entry))
  }
  return { messages, thinkingLevel, model }
}

function contextMessageForEntry(sessionID: SessionID, entry: SessionTreeEntry): LegoMessage[] {
  if (entry.type === "message") return [structuredClone(entry.message)]
  if (entry.type === "branch_summary") return [branchSummaryContextMessage(sessionID, entry)]
  if (entry.type === "custom_message") return [customContextMessage(sessionID, entry)]
  return []
}

function compactionContextMessage(sessionID: SessionID, entry: Extract<SessionTreeEntry, { type: "compaction" }>): LegoMessage {
  return userContextTextMessage({
    sessionID,
    id: `ctx_${entry.id}` as MessageID,
    timestamp: entry.timestamp,
    text: `The conversation history before this point was compacted into the following summary:\n\n<summary>\n${entry.summary}\n</summary>`,
    metadata: {
      source: "compaction",
      entryID: entry.id,
      ...(entry.tokensBefore === undefined ? {} : { tokensBefore: entry.tokensBefore }),
      ...(entry.details === undefined ? {} : { details: entry.details }),
      ...(entry.fromHook === undefined ? {} : { fromHook: entry.fromHook }),
    },
  })
}

function branchSummaryContextMessage(sessionID: SessionID, entry: Extract<SessionTreeEntry, { type: "branch_summary" }>): LegoMessage {
  return userContextTextMessage({
    sessionID,
    id: `ctx_${entry.id}` as MessageID,
    timestamp: entry.timestamp,
    text: `The following is a summary of a branch that this conversation came back from:\n\n<summary>\n${entry.summary}\n</summary>`,
    metadata: {
      source: "branch_summary",
      entryID: entry.id,
      fromID: entry.fromID,
      ...(entry.details === undefined ? {} : { details: entry.details }),
      ...(entry.fromHook === undefined ? {} : { fromHook: entry.fromHook }),
    },
  })
}

function customContextMessage(sessionID: SessionID, entry: Extract<SessionTreeEntry, { type: "custom_message" }>): LegoMessage {
  const content = Array.isArray(entry.content) ? entry.content : [{ type: "text", text: String(entry.content) }]
  const parts: LegoMessagePart[] = content.map((part, index) => {
    if (isTextContent(part)) return { id: `ctx_${entry.id}_${index}` as PartID, type: "text", text: part.text }
    return { id: `ctx_${entry.id}_${index}` as PartID, type: "custom", customType: entry.customType, data: part }
  })
  return {
    id: `ctx_${entry.id}` as MessageID,
    sessionID,
    role: "user",
    time: { created: entry.timestamp },
    parts,
    metadata: {
      source: "custom_message",
      entryID: entry.id,
      customType: entry.customType,
      ...(entry.display ? { display: entry.display } : {}),
      ...(entry.details === undefined ? {} : { details: entry.details }),
    },
  }
}

function userContextTextMessage(input: {
  sessionID: SessionID
  id: MessageID
  timestamp: number
  text: string
  metadata: Record<string, unknown>
}): LegoMessage {
  return {
    id: input.id,
    sessionID: input.sessionID,
    role: "user",
    time: { created: input.timestamp },
    parts: [{ id: `${input.id}_text` as PartID, type: "text", text: input.text }],
    metadata: input.metadata,
  }
}

function isTextContent(value: unknown): value is { type: "text"; text: string } {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && (value as { type?: unknown }).type === "text" && typeof (value as { text?: unknown }).text === "string"
}

function listJsonlFilesRecursive(dir: string): string[] {
  const files: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      const stat = statSync(path)
      if (stat.isDirectory()) {
        files.push(...listJsonlFilesRecursive(path))
      } else if (entry.endsWith(".jsonl")) {
        files.push(path)
      }
    }
  } catch {
    return files
  }
  return files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
}
