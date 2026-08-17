import { createHash } from "node:crypto"

type MutableRow = Record<string, unknown>

export type OpenCodeSessionSQLiteProjectionEventType =
  | "session.created"
  | "session.updated"
  | "session.deleted"
  | "message.updated"
  | "message.removed"
  | "message.part.updated"
  | "message.part.removed"

export interface OpenCodeSessionSQLiteProjectionState {
  sessions: Map<string, MutableRow>
  workspaces: Map<string, MutableRow>
  messages: Map<string, MutableRow>
  parts: Map<string, MutableRow>
  sessionMessages: Map<string, MutableRow>
  permissions: Map<string, MutableRow>
  todos: Map<string, MutableRow>
  operations: MutableRow[]
  warnings: MutableRow[]
}

export interface OpenCodeSessionSQLiteProjectionBridge {
  tableSchema(): OpenCodeSessionSQLiteProjectionTable[]
  createState(): OpenCodeSessionSQLiteProjectionState
  toSessionRow(info: MutableRow): MutableRow
  fromSessionRow(row: MutableRow): MutableRow
  toPartialRow(info: MutableRow): MutableRow
  project(input: {
    state: OpenCodeSessionSQLiteProjectionState
    type: OpenCodeSessionSQLiteProjectionEventType | `${OpenCodeSessionSQLiteProjectionEventType}.1`
    data: MutableRow
  }): void
  appendSessionMessage(input: {
    state: OpenCodeSessionSQLiteProjectionState
    sessionID: string
    message: MutableRow
  }): void
  updateSessionMessage(input: {
    state: OpenCodeSessionSQLiteProjectionState
    sessionID: string
    message: MutableRow
  }): void
  getCurrentAssistant(state: OpenCodeSessionSQLiteProjectionState, sessionID: string): MutableRow | undefined
  getCurrentCompaction(state: OpenCodeSessionSQLiteProjectionState, sessionID: string): MutableRow | undefined
  getCurrentShell(state: OpenCodeSessionSQLiteProjectionState, sessionID: string, callID: string): MutableRow | undefined
  encodeDateTimes(value: unknown): unknown
}

export interface OpenCodeSessionSQLiteProjectionTable {
  table: "session" | "message" | "part" | "todo" | "session_message" | "permission"
  columns: string[]
  indexes: string[]
}

export interface OpenCodeSessionSQLiteProjectionNativeExactFixtureCase {
  id:
    | "session-sql-schema-columns-and-indexes"
    | "session-row-roundtrip-and-partial-update"
    | "session-create-update-delete-and-workspace-touch"
    | "message-part-upsert-remove-and-usage-rollback"
    | "late-foreign-message-and-part-updates-are-ignored"
    | "session-message-current-select-and-date-time-encoding"
  actual: unknown
  expected: unknown
}

export interface OpenCodeSessionSQLiteProjectionNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.session.store.sqlite-projection"
  portID: "session.store"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-session-sqlite-projection-native-exact-fixture"
  replayRef: "session-sqlite-projection-native-exact:opencode"
  fixtureID: "opencode-session-sqlite-projection:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeSessionSQLiteProjectionNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeSessionSQLiteProjectionNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeSessionSQLiteProjectionNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeSessionSQLiteProjectionNativeExactFixtureIssue[]
}

const emptyTokens = { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }

const schema: OpenCodeSessionSQLiteProjectionTable[] = [
  {
    table: "session",
    columns: [
      "id",
      "project_id",
      "workspace_id",
      "parent_id",
      "slug",
      "directory",
      "path",
      "title",
      "version",
      "share_url",
      "summary_additions",
      "summary_deletions",
      "summary_files",
      "summary_diffs",
      "cost",
      "tokens_input",
      "tokens_output",
      "tokens_reasoning",
      "tokens_cache_read",
      "tokens_cache_write",
      "revert",
      "permission",
      "agent",
      "model",
      "time_created",
      "time_updated",
      "time_compacting",
      "time_archived",
    ],
    indexes: ["session_project_idx(project_id)", "session_workspace_idx(workspace_id)", "session_parent_idx(parent_id)"],
  },
  {
    table: "message",
    columns: ["id", "session_id", "time_created", "time_updated", "data"],
    indexes: ["message_session_time_created_id_idx(session_id,time_created,id)"],
  },
  {
    table: "part",
    columns: ["id", "message_id", "session_id", "time_created", "time_updated", "data"],
    indexes: ["part_message_id_id_idx(message_id,id)", "part_session_idx(session_id)"],
  },
  {
    table: "todo",
    columns: ["session_id", "content", "status", "priority", "position", "time_created", "time_updated"],
    indexes: ["primary(session_id,position)", "todo_session_idx(session_id)"],
  },
  {
    table: "session_message",
    columns: ["id", "session_id", "type", "time_created", "time_updated", "data"],
    indexes: ["session_message_session_idx(session_id)", "session_message_session_type_idx(session_id,type)", "session_message_time_created_idx(time_created)"],
  },
  {
    table: "permission",
    columns: ["project_id", "time_created", "time_updated", "data"],
    indexes: ["primary(project_id)"],
  },
]

export function createOpenCodeSessionSQLiteProjectionBridge(): OpenCodeSessionSQLiteProjectionBridge {
  return {
    tableSchema: () => schema.map((table) => ({ ...table, columns: [...table.columns], indexes: [...table.indexes] })),
    createState,
    toSessionRow,
    fromSessionRow,
    toPartialRow,
    project,
    appendSessionMessage,
    updateSessionMessage,
    getCurrentAssistant,
    getCurrentCompaction,
    getCurrentShell,
    encodeDateTimes,
  }
}

export function createState(): OpenCodeSessionSQLiteProjectionState {
  return {
    sessions: new Map(),
    workspaces: new Map(),
    messages: new Map(),
    parts: new Map(),
    sessionMessages: new Map(),
    permissions: new Map(),
    todos: new Map(),
    operations: [],
    warnings: [],
  }
}

export function toSessionRow(info: MutableRow): MutableRow {
  const tokens = isRecord(info.tokens) ? info.tokens : emptyTokens
  const cache = isRecord(tokens.cache) ? tokens.cache : emptyTokens.cache
  const share = isRecord(info.share) ? info.share : undefined
  const summary = isRecord(info.summary) ? info.summary : undefined
  const time = isRecord(info.time) ? info.time : {}
  return compactRecord({
    id: info.id,
    project_id: info.projectID,
    workspace_id: info.workspaceID,
    parent_id: info.parentID,
    slug: info.slug,
    directory: info.directory,
    path: info.path,
    title: info.title,
    agent: info.agent,
    model: info.model,
    version: info.version,
    share_url: share?.url,
    summary_additions: summary?.additions,
    summary_deletions: summary?.deletions,
    summary_files: summary?.files,
    summary_diffs: summary?.diffs,
    cost: typeof info.cost === "number" ? info.cost : 0,
    tokens_input: asNumber(tokens.input, 0),
    tokens_output: asNumber(tokens.output, 0),
    tokens_reasoning: asNumber(tokens.reasoning, 0),
    tokens_cache_read: asNumber(cache.read, 0),
    tokens_cache_write: asNumber(cache.write, 0),
    revert: info.revert ?? null,
    permission: info.permission,
    time_created: time.created,
    time_updated: time.updated,
    time_compacting: time.compacting,
    time_archived: time.archived,
  })
}

export function fromSessionRow(row: MutableRow): MutableRow {
  const hasSummary = row.summary_additions != null || row.summary_deletions != null || row.summary_files != null
  const model = isRecord(row.model) ? row.model : undefined
  return compactRecord({
    id: row.id,
    slug: row.slug,
    projectID: row.project_id,
    workspaceID: row.workspace_id ?? undefined,
    directory: row.directory,
    path: row.path ?? undefined,
    parentID: row.parent_id ?? undefined,
    title: row.title,
    agent: row.agent ?? undefined,
    model: model ? compactRecord({ id: model.id, providerID: model.providerID, variant: model.variant }) : undefined,
    version: row.version,
    summary: hasSummary
      ? compactRecord({
          additions: row.summary_additions ?? 0,
          deletions: row.summary_deletions ?? 0,
          files: row.summary_files ?? 0,
          diffs: row.summary_diffs ?? undefined,
        })
      : undefined,
    cost: row.cost,
    tokens: {
      input: row.tokens_input,
      output: row.tokens_output,
      reasoning: row.tokens_reasoning,
      cache: {
        read: row.tokens_cache_read,
        write: row.tokens_cache_write,
      },
    },
    share: row.share_url ? { url: row.share_url } : undefined,
    revert: row.revert ?? undefined,
    permission: Array.isArray(row.permission) ? [...row.permission] : undefined,
    time: compactRecord({
      created: row.time_created,
      updated: row.time_updated,
      compacting: row.time_compacting ?? undefined,
      archived: row.time_archived ?? undefined,
    }),
  })
}

export function toPartialRow(info: MutableRow): MutableRow {
  const row = {
    id: grab(info, "id"),
    project_id: grab(info, "projectID"),
    workspace_id: grab(info, "workspaceID"),
    parent_id: grab(info, "parentID"),
    slug: grab(info, "slug"),
    directory: grab(info, "directory"),
    path: grab(info, "path"),
    title: grab(info, "title"),
    version: grab(info, "version"),
    share_url: grab(info, "share", (value) => grab(value, "url")),
    summary_additions: grab(info, "summary", (value) => grab(value, "additions")),
    summary_deletions: grab(info, "summary", (value) => grab(value, "deletions")),
    summary_files: grab(info, "summary", (value) => grab(value, "files")),
    summary_diffs: grab(info, "summary", (value) => grab(value, "diffs")),
    cost: grab(info, "cost"),
    tokens_input: grab(info, "tokens", (value) => grab(value, "input")),
    tokens_output: grab(info, "tokens", (value) => grab(value, "output")),
    tokens_reasoning: grab(info, "tokens", (value) => grab(value, "reasoning")),
    tokens_cache_read: grab(info, "tokens", (value) => grab(value, "cache", (cache) => grab(cache, "read"))),
    tokens_cache_write: grab(info, "tokens", (value) => grab(value, "cache", (cache) => grab(cache, "write"))),
    revert: grab(info, "revert"),
    permission: grab(info, "permission"),
    time_created: grab(info, "time", (value) => grab(value, "created")),
    time_updated: grab(info, "time", (value) => grab(value, "updated")),
    time_compacting: grab(info, "time", (value) => grab(value, "compacting")),
    time_archived: grab(info, "time", (value) => grab(value, "archived")),
  }
  return compactRecord(row)
}

export function project(input: {
  state: OpenCodeSessionSQLiteProjectionState
  type: OpenCodeSessionSQLiteProjectionEventType | `${OpenCodeSessionSQLiteProjectionEventType}.1`
  data: MutableRow
}): void {
  const type = input.type.endsWith(".1") ? input.type.slice(0, -2) as OpenCodeSessionSQLiteProjectionEventType : input.type
  const state = input.state
  const data = input.data
  if (type === "session.created") {
    const info = data.info
    if (!isRecord(info)) throw new Error("session.created requires info")
    const row = toSessionRow(info)
    state.sessions.set(String(row.id), row)
    if (info.workspaceID) {
      state.workspaces.set(String(info.workspaceID), { id: info.workspaceID, time_used: "Date.now()" })
      state.operations.push({ op: "workspace.touch", workspaceID: info.workspaceID })
    }
    state.operations.push({ op: "session.insert", sessionID: row.id })
    return
  }
  if (type === "session.updated") {
    const sessionID = String(data.sessionID)
    const row = state.sessions.get(sessionID)
    if (!row) throw new Error(`Session not found: ${sessionID}`)
    const patch = isRecord(data.info) ? toPartialRow(data.info) : {}
    state.sessions.set(sessionID, { ...row, ...patch })
    state.operations.push({ op: "session.update", sessionID, keys: Object.keys(patch).sort() })
    return
  }
  if (type === "session.deleted") {
    const sessionID = String(data.sessionID)
    state.sessions.delete(sessionID)
    state.operations.push({ op: "session.delete", sessionID })
    return
  }
  if (type === "message.updated") {
    const info = data.info
    if (!isRecord(info)) throw new Error("message.updated requires info")
    const sessionID = String(info.sessionID)
    const id = String(info.id)
    if (!state.sessions.has(sessionID)) {
      state.warnings.push({ warning: "ignored late message update", messageID: id, sessionID })
      return
    }
    const { id: _id, sessionID: _sessionID, ...rest } = info
    const existing = state.messages.get(id)
    state.messages.set(id, {
      ...(existing ?? {}),
      id,
      session_id: sessionID,
      time_created: readNumber(readPath(info, ["time", "created"]), 0),
      data: rest,
    })
    state.operations.push({ op: existing ? "message.upsert.update" : "message.upsert.insert", messageID: id, sessionID })
    return
  }
  if (type === "message.removed") {
    const sessionID = String(data.sessionID)
    const messageID = String(data.messageID)
    for (const row of [...state.parts.values()].filter((part) => part.message_id === messageID && part.session_id === sessionID)) {
      const previous = usage(row.data)
      if (previous) applyUsage(state, sessionID, previous, -1)
    }
    state.messages.delete(messageID)
    state.operations.push({ op: "message.delete", messageID, sessionID })
    return
  }
  if (type === "message.part.removed") {
    const sessionID = String(data.sessionID)
    const partID = String(data.partID)
    const row = state.parts.get(partID)
    const previous = row && usage(row.data)
    if (previous) applyUsage(state, sessionID, previous, -1)
    state.parts.delete(partID)
    state.operations.push({ op: "part.delete", partID, sessionID })
    return
  }
  if (type === "message.part.updated") {
    const part = data.part
    if (!isRecord(part)) throw new Error("message.part.updated requires part")
    const id = String(part.id)
    const messageID = String(part.messageID)
    const sessionID = String(part.sessionID)
    if (!state.messages.has(messageID)) {
      state.warnings.push({ warning: "ignored late part update", partID: id, messageID, sessionID })
      return
    }
    const existing = state.parts.get(id)
    const { id: _id, messageID: _messageID, sessionID: _sessionID, ...rest } = part
    state.parts.set(id, {
      id,
      message_id: messageID,
      session_id: sessionID,
      time_created: readNumber(data.time, 0),
      data: rest,
    })
    const previous = existing && usage(existing.data)
    const next = usage(part)
    if (previous) applyUsage(state, String(existing.session_id), previous, -1)
    if (next) applyUsage(state, sessionID, next)
    state.operations.push({ op: existing ? "part.upsert.update" : "part.upsert.insert", partID: id, messageID, sessionID })
  }
}

export function appendSessionMessage(input: {
  state: OpenCodeSessionSQLiteProjectionState
  sessionID: string
  message: MutableRow
}): void {
  const { id, type, ...data } = input.message
  const row = {
    id,
    session_id: input.sessionID,
    type,
    time_created: epochMillis(readPath(input.message, ["time", "created"])),
    data: encodeMessageData(data),
  }
  input.state.sessionMessages.set(String(id), row)
  input.state.operations.push({ op: "session_message.insert", id, sessionID: input.sessionID, type })
}

export function updateSessionMessage(input: {
  state: OpenCodeSessionSQLiteProjectionState
  sessionID: string
  message: MutableRow
}): void {
  const { id, type, ...data } = input.message
  const existing = input.state.sessionMessages.get(String(id))
  if (!existing || existing.session_id !== input.sessionID || existing.type !== type) return
  input.state.sessionMessages.set(String(id), { ...existing, data: encodeMessageData(data) })
  input.state.operations.push({ op: "session_message.update", id, sessionID: input.sessionID, type })
}

export function getCurrentAssistant(state: OpenCodeSessionSQLiteProjectionState, sessionID: string): MutableRow | undefined {
  return currentSessionMessage(state, sessionID, "assistant", (message) => !isRecord(message.time) || readPath(message, ["time", "completed"]) == null)
}

export function getCurrentCompaction(state: OpenCodeSessionSQLiteProjectionState, sessionID: string): MutableRow | undefined {
  return currentSessionMessage(state, sessionID, "compaction", () => true)
}

export function getCurrentShell(state: OpenCodeSessionSQLiteProjectionState, sessionID: string, callID: string): MutableRow | undefined {
  return currentSessionMessage(state, sessionID, "shell", (message) => message.callID === callID)
}

export function encodeDateTimes(value: unknown): unknown {
  if (isEpochMarker(value)) return typeof value.epochMillis === "number" ? value.epochMillis : value.__opencodeDateTimeEpochMillis
  if (value instanceof Date) return value.getTime()
  if (Array.isArray(value)) return value.map(encodeDateTimes)
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeDateTimes(item)]))
  return value
}

export function captureOpenCodeSessionSQLiteProjectionNativeExactFixture(): OpenCodeSessionSQLiteProjectionNativeExactFixture {
  const bridge = createOpenCodeSessionSQLiteProjectionBridge()
  const fullInfo = sessionInfo()
  const row = bridge.toSessionRow(fullInfo)
  const partialInput = {
    title: "Renamed",
    share: { url: null },
    summary: { additions: 2, diffs: null },
    tokens: { input: 10, cache: { read: 3 } },
    time: { updated: 200, archived: null },
  }
  const schemaSummary = bridge.tableSchema().map((table) => ({
    table: table.table,
    columns: table.columns,
    indexes: table.indexes,
  }))

  const sessionState = bridge.createState()
  bridge.project({ state: sessionState, type: "session.created", data: { sessionID: "ses_sql", info: fullInfo } })
  bridge.project({ state: sessionState, type: "session.updated.1", data: { sessionID: "ses_sql", info: partialInput } })
  const afterUpdate = sessionState.sessions.get("ses_sql")
  bridge.project({ state: sessionState, type: "session.deleted", data: { sessionID: "ses_sql" } })

  const usageState = bridge.createState()
  bridge.project({ state: usageState, type: "session.created", data: { sessionID: "ses_sql", info: fullInfo } })
  bridge.project({ state: usageState, type: "message.updated", data: { sessionID: "ses_sql", info: userMessage("msg_001") } })
  bridge.project({ state: usageState, type: "message.part.updated", data: { sessionID: "ses_sql", part: stepFinishPart("prt_usage", "msg_001", 0.25, 10), time: 20 } })
  const afterFirstUsage = usageSummary(usageState.sessions.get("ses_sql"))
  bridge.project({ state: usageState, type: "message.part.updated", data: { sessionID: "ses_sql", part: stepFinishPart("prt_usage", "msg_001", 0.5, 20), time: 21 } })
  const afterSecondUsage = usageSummary(usageState.sessions.get("ses_sql"))
  bridge.project({ state: usageState, type: "message.removed", data: { sessionID: "ses_sql", messageID: "msg_001" } })
  const afterMessageRemoved = usageSummary(usageState.sessions.get("ses_sql"))

  const lateState = bridge.createState()
  bridge.project({ state: lateState, type: "message.updated", data: { info: userMessage("msg_late") } })
  bridge.project({ state: lateState, type: "session.created", data: { sessionID: "ses_sql", info: fullInfo } })
  bridge.project({ state: lateState, type: "message.part.updated", data: { part: stepFinishPart("prt_late", "msg_missing", 1, 1), time: 1 } })

  const nextState = bridge.createState()
  bridge.appendSessionMessage({ state: nextState, sessionID: "ses_sql", message: sessionMessage("msg_a", "assistant", 10, { completed: 11 }) })
  bridge.appendSessionMessage({ state: nextState, sessionID: "ses_sql", message: sessionMessage("msg_b", "assistant", 12) })
  bridge.appendSessionMessage({ state: nextState, sessionID: "ses_sql", message: sessionMessage("msg_c", "compaction", 13) })
  bridge.appendSessionMessage({ state: nextState, sessionID: "ses_sql", message: { ...sessionMessage("msg_d", "shell", 14), callID: "call_1" } })
  const currentAssistantBeforeCompletion = bridge.getCurrentAssistant(nextState, "ses_sql")
  bridge.updateSessionMessage({
    state: nextState,
    sessionID: "ses_sql",
    message: {
      id: "msg_b",
      type: "assistant",
      time: { created: epoch(12), completed: epoch(15) },
      nested: { at: epoch(16), values: [epoch(17)] },
    },
  })

  const cases: OpenCodeSessionSQLiteProjectionNativeExactFixtureCase[] = [
    {
      id: "session-sql-schema-columns-and-indexes",
      actual: schemaSummary,
      expected: schema,
    },
    {
      id: "session-row-roundtrip-and-partial-update",
      actual: {
        row,
        roundtrip: bridge.fromSessionRow({ ...row, workspace_id: null, path: null, parent_id: null, agent: null, time_compacting: null, time_archived: null }),
        partial: bridge.toPartialRow(partialInput),
        undefinedError: captureError(() => bridge.toPartialRow({ title: undefined })),
      },
      expected: {
        row: {
          id: "ses_sql",
          project_id: "prj_sql",
          workspace_id: "wrk_sql",
          parent_id: "ses_parent",
          slug: "slug-sql",
          directory: "/repo",
          path: "packages/app",
          title: "SQLite",
          agent: "build",
          model: { id: "gpt-5", providerID: "openai", variant: "fast" },
          version: "1.0.0",
          share_url: "https://share.test/ses_sql",
          summary_additions: 3,
          summary_deletions: 1,
          summary_files: 2,
          summary_diffs: [{ path: "a.ts" }],
          cost: 1.5,
          tokens_input: 100,
          tokens_output: 50,
          tokens_reasoning: 20,
          tokens_cache_read: 10,
          tokens_cache_write: 10,
          revert: { messageID: "msg_old" },
          permission: [{ type: "allow", pattern: "*" }],
          time_created: 100,
          time_updated: 110,
        },
        roundtrip: {
          id: "ses_sql",
          slug: "slug-sql",
          projectID: "prj_sql",
          directory: "/repo",
          title: "SQLite",
          model: { id: "gpt-5", providerID: "openai", variant: "fast" },
          version: "1.0.0",
          summary: { additions: 3, deletions: 1, files: 2, diffs: [{ path: "a.ts" }] },
          cost: 1.5,
          tokens: { input: 100, output: 50, reasoning: 20, cache: { read: 10, write: 10 } },
          share: { url: "https://share.test/ses_sql" },
          revert: { messageID: "msg_old" },
          permission: [{ type: "allow", pattern: "*" }],
          time: { created: 100, updated: 110 },
        },
        partial: {
          title: "Renamed",
          share_url: null,
          summary_additions: 2,
          summary_diffs: null,
          tokens_input: 10,
          tokens_cache_read: 3,
          time_updated: 200,
          time_archived: null,
        },
        undefinedError: "Session update failure: pass `null` to clear a field instead of `undefined`: {\"title\":undefined}",
      },
    },
    {
      id: "session-create-update-delete-and-workspace-touch",
      actual: {
        afterUpdate,
        deleted: !sessionState.sessions.has("ses_sql"),
        workspace: sessionState.workspaces.get("wrk_sql"),
        operations: sessionState.operations,
      },
      expected: {
        afterUpdate: { ...row, ...bridge.toPartialRow(partialInput) },
        deleted: true,
        workspace: { id: "wrk_sql", time_used: "Date.now()" },
        operations: [
          { op: "workspace.touch", workspaceID: "wrk_sql" },
          { op: "session.insert", sessionID: "ses_sql" },
          { op: "session.update", sessionID: "ses_sql", keys: ["share_url", "summary_additions", "summary_diffs", "time_archived", "time_updated", "title", "tokens_cache_read", "tokens_input"] },
          { op: "session.delete", sessionID: "ses_sql" },
        ],
      },
    },
    {
      id: "message-part-upsert-remove-and-usage-rollback",
      actual: {
        message: usageState.messages.get("msg_001"),
        partAfterRemoveMessage: usageState.parts.get("prt_usage"),
        afterFirstUsage,
        afterSecondUsage,
        afterMessageRemoved,
        operations: usageState.operations.filter((item) => String(item.op).startsWith("session.applyUsage")),
      },
      expected: {
        message: undefined,
        partAfterRemoveMessage: {
          id: "prt_usage",
          message_id: "msg_001",
          session_id: "ses_sql",
          time_created: 21,
          data: stepFinishData(0.5, 20),
        },
        afterFirstUsage: { cost: 1.75, input: 110, output: 55, reasoning: 22, cacheRead: 11, cacheWrite: 11 },
        afterSecondUsage: { cost: 2, input: 120, output: 60, reasoning: 24, cacheRead: 12, cacheWrite: 12 },
        afterMessageRemoved: { cost: 1.5, input: 100, output: 50, reasoning: 20, cacheRead: 10, cacheWrite: 10 },
        operations: [
          { op: "session.applyUsage", sessionID: "ses_sql", sign: 1, cost: 0.25, tokens: tokens(10) },
          { op: "session.applyUsage", sessionID: "ses_sql", sign: -1, cost: 0.25, tokens: tokens(10) },
          { op: "session.applyUsage", sessionID: "ses_sql", sign: 1, cost: 0.5, tokens: tokens(20) },
          { op: "session.applyUsage", sessionID: "ses_sql", sign: -1, cost: 0.5, tokens: tokens(20) },
        ],
      },
    },
    {
      id: "late-foreign-message-and-part-updates-are-ignored",
      actual: {
        warnings: lateState.warnings,
        messageIDs: [...lateState.messages.keys()],
        partIDs: [...lateState.parts.keys()],
      },
      expected: {
        warnings: [
          { warning: "ignored late message update", messageID: "msg_late", sessionID: "ses_sql" },
          { warning: "ignored late part update", partID: "prt_late", messageID: "msg_missing", sessionID: "ses_sql" },
        ],
        messageIDs: [],
        partIDs: [],
      },
    },
    {
      id: "session-message-current-select-and-date-time-encoding",
      actual: {
        currentAssistant: currentAssistantBeforeCompletion,
        currentCompaction: bridge.getCurrentCompaction(nextState, "ses_sql"),
        currentShell: bridge.getCurrentShell(nextState, "ses_sql", "call_1"),
        updatedRow: nextState.sessionMessages.get("msg_b"),
      },
      expected: {
        currentAssistant: { id: "msg_b", type: "assistant", time: { created: 12 } },
        currentCompaction: { id: "msg_c", type: "compaction", time: { created: 13 } },
        currentShell: { id: "msg_d", type: "shell", time: { created: 14 }, callID: "call_1" },
        updatedRow: {
          id: "msg_b",
          session_id: "ses_sql",
          type: "assistant",
          time_created: 12,
          data: {
            time: { created: 12, completed: 15 },
            nested: { at: 16, values: [17] },
          },
        },
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.session.store.sqlite-projection" as const,
    portID: "session.store" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-session-sqlite-projection-native-exact-fixture" as const,
    replayRef: "session-sqlite-projection-native-exact:opencode" as const,
    fixtureID: "opencode-session-sqlite-projection:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.sql.ts#SessionTable,MessageTable,PartTable,TodoTable,SessionMessageTable,PermissionTable",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.ts#fromRow,toRow,Session.Event",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/projectors.ts#toPartialRow,foreign,usage,applyUsage,MessageV2.Event",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/projectors-next.ts#encodeDateTimes,encodeMessageData,sqlite,update",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeSessionSQLiteProjectionFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeSessionSQLiteProjectionNativeExactFixture(
  fixture: OpenCodeSessionSQLiteProjectionNativeExactFixture,
): OpenCodeSessionSQLiteProjectionNativeExactFixtureVerification {
  const issues: OpenCodeSessionSQLiteProjectionNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeSessionSQLiteProjectionNativeExactFixtureCase["id"][] = [
    "session-sql-schema-columns-and-indexes",
    "session-row-roundtrip-and-partial-update",
    "session-create-update-delete-and-workspace-touch",
    "message-part-upsert-remove-and-usage-rollback",
    "late-foreign-message-and-part-updates-are-ignored",
    "session-message-current-select-and-date-time-encoding",
  ]
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-session-sqlite-projection.schema", "Fixture must use schema version 1.")
  if (fixture.product !== "opencode" || fixture.atomID !== "opencode.session.store.sqlite-projection" || fixture.portID !== "session.store") {
    add("opencode-session-sqlite-projection.target", "Fixture must target opencode.session.store.sqlite-projection and session.store.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-session-sqlite-projection.native-claim", "SQLite projection fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-session-sqlite-projection.lossiness", "Native SQLite projection fixture cannot retain known lossiness.")
  for (const source of ["session/session.sql.ts", "session/session.ts", "session/projectors.ts", "session/projectors-next.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-session-sqlite-projection.source-ref", `Missing source ref ${source}.`)
  }
  for (const expectedID of expectedCaseIDs) {
    const item = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!item) {
      add("opencode-session-sqlite-projection.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (!openCodeSessionSQLiteProjectionSameJSON(item.actual, item.expected)) {
      add("opencode-session-sqlite-projection.case", "Case actual output must match expected OpenCode SQLite projection behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeSessionSQLiteProjectionFingerprintObject(withoutFingerprint)) {
    add("opencode-session-sqlite-projection.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function currentSessionMessage(
  state: OpenCodeSessionSQLiteProjectionState,
  sessionID: string,
  type: string,
  predicate: (message: MutableRow) => boolean,
): MutableRow | undefined {
  return [...state.sessionMessages.values()]
    .filter((row) => row.session_id === sessionID && row.type === type)
    .sort((left, right) => String(right.id).localeCompare(String(left.id)))
    .map((row) => ({ ...row.data as MutableRow, id: row.id, type: row.type }))
    .find(predicate)
}

function encodeMessageData(value: unknown): MutableRow {
  return encodeDateTimes(value) as MutableRow
}

function applyUsage(state: OpenCodeSessionSQLiteProjectionState, sessionID: string, value: { cost: number; tokens: MutableRow }, sign = 1): void {
  const row = state.sessions.get(sessionID)
  if (!row) return
  const valueTokens = isRecord(value.tokens) ? value.tokens : emptyTokens
  const cache = isRecord(valueTokens.cache) ? valueTokens.cache : emptyTokens.cache
  row.cost = asNumber(row.cost, 0) + value.cost * sign
  row.tokens_input = asNumber(row.tokens_input, 0) + asNumber(valueTokens.input, 0) * sign
  row.tokens_output = asNumber(row.tokens_output, 0) + asNumber(valueTokens.output, 0) * sign
  row.tokens_reasoning = asNumber(row.tokens_reasoning, 0) + asNumber(valueTokens.reasoning, 0) * sign
  row.tokens_cache_read = asNumber(row.tokens_cache_read, 0) + asNumber(cache.read, 0) * sign
  row.tokens_cache_write = asNumber(row.tokens_cache_write, 0) + asNumber(cache.write, 0) * sign
  state.operations.push({ op: "session.applyUsage", sessionID, sign, cost: value.cost, tokens: clone(valueTokens) })
}

function usage(value: unknown): { cost: number; tokens: MutableRow } | undefined {
  if (!isRecord(value) || value.type !== "step-finish") return undefined
  if (!("cost" in value) || !("tokens" in value)) return undefined
  return { cost: asNumber(value.cost, 0), tokens: isRecord(value.tokens) ? value.tokens : emptyTokens }
}

function grab(obj: MutableRow | null | undefined, field: string, cb?: (value: MutableRow) => unknown): unknown {
  if (obj == null || !(field in obj)) return undefined
  const value = obj[field]
  if (value && typeof value === "object" && !Array.isArray(value) && cb) return cb(value as MutableRow)
  if (value === undefined) {
    throw new Error("Session update failure: pass `null` to clear a field instead of `undefined`: " + stableInlineJSON(obj))
  }
  return value
}

function sessionInfo(): MutableRow {
  return {
    id: "ses_sql",
    projectID: "prj_sql",
    workspaceID: "wrk_sql",
    parentID: "ses_parent",
    slug: "slug-sql",
    directory: "/repo",
    path: "packages/app",
    title: "SQLite",
    agent: "build",
    model: { id: "gpt-5", providerID: "openai", variant: "fast" },
    version: "1.0.0",
    share: { url: "https://share.test/ses_sql" },
    summary: { additions: 3, deletions: 1, files: 2, diffs: [{ path: "a.ts" }] },
    cost: 1.5,
    tokens: tokens(100),
    revert: { messageID: "msg_old" },
    permission: [{ type: "allow", pattern: "*" }],
    time: { created: 100, updated: 110 },
  }
}

function userMessage(id: string): MutableRow {
  return {
    id,
    sessionID: "ses_sql",
    role: "user",
    agent: "build",
    model: { providerID: "openai", modelID: "gpt-5" },
    time: { created: 10 },
  }
}

function stepFinishPart(id: string, messageID: string, cost: number, input: number): MutableRow {
  return {
    id,
    messageID,
    sessionID: "ses_sql",
    ...stepFinishData(cost, input),
  }
}

function stepFinishData(cost: number, input: number): MutableRow {
  return {
    type: "step-finish",
    reason: "stop",
    cost,
    tokens: tokens(input),
  }
}

function tokens(input: number): MutableRow {
  return {
    input,
    output: input / 2,
    reasoning: input / 5,
    cache: { read: input / 10, write: input / 10 },
  }
}

function usageSummary(row: MutableRow | undefined): MutableRow | undefined {
  if (!row) return undefined
  return {
    cost: row.cost,
    input: row.tokens_input,
    output: row.tokens_output,
    reasoning: row.tokens_reasoning,
    cacheRead: row.tokens_cache_read,
    cacheWrite: row.tokens_cache_write,
  }
}

function sessionMessage(id: string, type: string, created: number, time: MutableRow = {}): MutableRow {
  return { id, type, time: { created: epoch(created), ...time } }
}

function epoch(epochMillis: number): MutableRow {
  return { __opencodeDateTimeEpochMillis: epochMillis }
}

function isEpochMarker(value: unknown): value is { epochMillis?: number; __opencodeDateTimeEpochMillis?: number } {
  return isRecord(value)
    && (typeof value.epochMillis === "number" || typeof value.__opencodeDateTimeEpochMillis === "number")
}

function epochMillis(value: unknown): number {
  const encoded = encodeDateTimes(value)
  return typeof encoded === "number" ? encoded : 0
}

function readPath(value: unknown, path: string[]): unknown {
  let current = value
  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }
  return current
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback
}

function isRecord(value: unknown): value is MutableRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function compactRecord<T extends MutableRow>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function captureError(fn: () => unknown): string | undefined {
  try {
    fn()
    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

function stableInlineJSON(value: unknown): string {
  if (!isRecord(value)) return JSON.stringify(value)
  return `{${Object.entries(value).map(([key, entry]) => `${JSON.stringify(key)}:${entry === undefined ? "undefined" : JSON.stringify(entry)}`).join(",")}}`
}

function openCodeSessionSQLiteProjectionSameJSON(left: unknown, right: unknown): boolean {
  return openCodeSessionSQLiteProjectionStableJSON(left) === openCodeSessionSQLiteProjectionStableJSON(right)
}

function openCodeSessionSQLiteProjectionFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeSessionSQLiteProjectionStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeSessionSQLiteProjectionStableJSON(value: unknown): string {
  return JSON.stringify(openCodeSessionSQLiteProjectionSortStable(value))
}

function openCodeSessionSQLiteProjectionSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeSessionSQLiteProjectionSortStable)
  if (value instanceof Map) return openCodeSessionSQLiteProjectionSortStable(Object.fromEntries(value.entries()))
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as MutableRow)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeSessionSQLiteProjectionSortStable(entry)]),
  )
}
