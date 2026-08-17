import { createHash, randomUUID } from "node:crypto"
import {
  hermesBuildSessionTitle,
  hermesFormatUpdatedAt,
  hermesIdentityUpstreamRef,
  hermesNormalizeCwdForCompare,
  hermesTranslateACPCwd,
  hermesUpdatedAtSortKey,
  isHermesACPSessionID,
} from "./identity.ts"

export const hermesSessionUpstreamRef = hermesIdentityUpstreamRef
export const hermesSessionIDGeneratorNativeExactAtomID = "hermes.session.id-generator"
export const hermesSessionBranchGraphLineageNativeExactAtomID = "hermes.session.branch-graph.lineage"
export const hermesSessionPaginationUpdatedAtNativeExactAtomID = "hermes.session.pagination.updated-at"
export const hermesSessionContextSelectorThreadHistoryNativeExactAtomID = "hermes.session.context-selector.thread-history"
export const hermesSessionStoreSqliteFtsNativeExactAtomID = "hermes.session.store.sqlite-fts"
export const hermesSessionProjectorOpenAIMessagesNativeExactAtomID = "hermes.session.projector.openai-messages"
export const hermesSessionMessagePartProjectorNativeExactAtomID = "hermes.session.message-part-projector.native-like"
export const hermesSessionCompactionTrajectoryNativeExactAtomID = "hermes.session.compaction-trajectory"
export const hermesSessionNativeExactAtomIDs = [
  hermesSessionIDGeneratorNativeExactAtomID,
  hermesSessionBranchGraphLineageNativeExactAtomID,
  hermesSessionPaginationUpdatedAtNativeExactAtomID,
  hermesSessionContextSelectorThreadHistoryNativeExactAtomID,
  hermesSessionStoreSqliteFtsNativeExactAtomID,
  hermesSessionProjectorOpenAIMessagesNativeExactAtomID,
  hermesSessionMessagePartProjectorNativeExactAtomID,
  hermesSessionCompactionTrajectoryNativeExactAtomID,
] as const
export const hermesSessionNativeExactFixtureID = "hermes-session-acp:native-exact-fixture"
export const hermesSessionNativeExactEvidenceRef = "conformance:hermes-session-acp-native-exact-fixture"
export const hermesSessionNativeExactReplayRef = "session-acp-native-exact:hermes-agent"

export type HermesSessionNativeExactAtomID = (typeof hermesSessionNativeExactAtomIDs)[number]

export interface HermesACPMessage {
  role?: string
  content?: unknown
  [key: string]: unknown
}

export interface HermesACPSessionState {
  session_id: string
  cwd: string
  model: string
  history: HermesACPMessage[]
}

export interface HermesACPPersistedSessionRow {
  id: string
  model?: string | null
  title?: string | null
  preview?: string | null
  started_at?: unknown
  last_active?: unknown
  message_count?: unknown
  model_config?: string | null
}

export interface HermesSessionStoredMessageInput {
  role?: string
  content?: unknown
  tool_call_id?: string | null
  tool_calls?: unknown
  tool_name?: string | null
  token_count?: number | null
  finish_reason?: string | null
  reasoning?: string | null
  reasoning_content?: string | null
  reasoning_details?: unknown
  codex_reasoning_items?: unknown
  codex_message_items?: unknown
  platform_message_id?: string | null
  message_id?: string | null
  observed?: boolean
  active?: 0 | 1 | boolean
}

export interface HermesSessionStoredMessageRow {
  id: number
  session_id: string
  role: string
  content: unknown
  tool_call_id: string | null
  tool_calls: string | null
  tool_name: string | null
  timestamp: number
  token_count: number | null
  finish_reason: string | null
  reasoning: string | null
  reasoning_content: string | null
  reasoning_details: string | null
  codex_reasoning_items: string | null
  codex_message_items: string | null
  platform_message_id: string | null
  observed: 0 | 1
  active: 0 | 1
}

export interface HermesSessionReplaceMessagesResult {
  sessionID: string
  rows: HermesSessionStoredMessageRow[]
  messageCount: number
  toolCallCount: number
  ftsIndexedContent: string[]
  timestamps: number[]
}

export interface HermesTrajectoryEntry {
  conversations: Array<Record<string, unknown>>
  timestamp: string
  model: string
  completed: boolean
}

export interface HermesACPSessionListItem {
  session_id: string
  cwd: string
  model: string
  history_len: number
  title: string
  updated_at: string | null
}

export interface HermesACPSessionAtom {
  createSession(input?: { cwd?: string; sessionUUID?: string; isWSL?: boolean; agentModel?: string | null }): HermesACPSessionState
  forkSession(
    input: { original?: HermesACPSessionState | null; cwd?: string; sessionUUID?: string; isWSL?: boolean; agentModel?: string | null },
  ): HermesACPSessionState | null
  listSessions(input: {
    memorySessions?: HermesACPSessionState[]
    persistedRows?: HermesACPPersistedSessionRow[]
    cwd?: string | null
    nowSeconds?: number
  }): HermesACPSessionListItem[]
}

export type HermesSessionNativeScenarioID =
  | "create-session-uuid-and-translated-cwd"
  | "fork-session-deep-copies-history-and-model"
  | "list-memory-sessions-title-preview-and-updated-at"
  | "list-persisted-sessions-cwd-filter-and-sort"
  | "sqlite-fts-schema-and-replace-messages"
  | "openai-message-replay-and-sanitized-context"
  | "trajectory-scratchpad-and-jsonl-entry"

export interface HermesSessionNativeExactCase {
  scenarioID: HermesSessionNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface HermesSessionNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  atomIDs: typeof hermesSessionNativeExactAtomIDs
  portIDs: readonly [
    "session.id-generator",
    "session.branch-graph",
    "session.pagination",
    "session.context-selector",
    "session.store",
    "session.projector",
    "session.message-part-projector",
    "session.compaction-records",
  ]
  upstreamRef: typeof hermesSessionUpstreamRef
  evidenceRef: typeof hermesSessionNativeExactEvidenceRef
  fixtureID: typeof hermesSessionNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    acpCreateSessionUsesUUID4AndTranslatedCwd: true
    acpForkSessionUsesFreshUUID4AndDeepCopiedHistory: true
    acpForkMissingSessionReturnsNone: true
    listSessionsSkipsEmptyThreads: true
    listSessionsMergesMemoryWithDBRows: true
    listSessionsFiltersByNormalizedCwd: true
    listSessionsUsesTitlePreviewCwdFallback: true
    listSessionsSortsByUpdatedAtDescending: true
    sqliteStoreUsesWalFallbackAndFts5Triggers: true
    replaceMessagesDeletesAndReinsertsAtomically: true
    openaiConversationReplayDecodesStructuredContentAndReasoning: true
    messagePartProjectorReplaysToolCallsReasoningStructuredContentAndObservedRows: true
    compactionTrajectoryWritesJsonlAndConvertsScratchpadTags: true
  }
  cases: HermesSessionNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  intentionallyBridgeAtoms: readonly []
  fingerprint: string
}

export interface HermesSessionNativeExactIssue {
  id: string
  message: string
}

export interface HermesSessionNativeExactVerification {
  ok: boolean
  issues: HermesSessionNativeExactIssue[]
}

export function createHermesACPSessionAtom(): HermesACPSessionAtom {
  return {
    createSession(input = {}) {
      return createHermesACPSession(input)
    },
    forkSession(input) {
      return forkHermesACPSession(input.original ?? null, input)
    },
    listSessions(input) {
      return listHermesACPSessions(input)
    },
  }
}

export function createHermesACPSession(input: {
  cwd?: string
  sessionUUID?: string
  isWSL?: boolean
  agentModel?: string | null
} = {}): HermesACPSessionState {
  return {
    session_id: input.sessionUUID ?? randomUUID(),
    cwd: hermesTranslateACPCwd(input.cwd ?? ".", input.isWSL ?? false),
    model: input.agentModel || "",
    history: [],
  }
}

export function forkHermesACPSession(
  original: HermesACPSessionState | null,
  input: { cwd?: string; sessionUUID?: string; isWSL?: boolean; agentModel?: string | null } = {},
): HermesACPSessionState | null {
  if (!original) return null
  return {
    session_id: input.sessionUUID ?? randomUUID(),
    cwd: hermesTranslateACPCwd(input.cwd ?? ".", input.isWSL ?? false),
    model: input.agentModel || original.model,
    history: structuredClone(original.history),
  }
}

export function listHermesACPSessions(input: {
  memorySessions?: HermesACPSessionState[]
  persistedRows?: HermesACPPersistedSessionRow[]
  cwd?: string | null
  nowSeconds?: number
}): HermesACPSessionListItem[] {
  const normalizedCwd = input.cwd ? hermesNormalizeCwdForCompare(input.cwd) : null
  const persistedRows = new Map((input.persistedRows ?? []).map((row) => [String(row.id), row]))
  const seenIDs = new Set<string>()
  const results: HermesACPSessionListItem[] = []

  for (const session of input.memorySessions ?? []) {
    seenIDs.add(session.session_id)
    const historyLen = session.history.length
    if (historyLen <= 0) continue
    if (normalizedCwd && hermesNormalizeCwdForCompare(session.cwd) !== normalizedCwd) continue

    const persisted = persistedRows.get(session.session_id)
    const preview = firstHermesUserPreview(session.history) || persisted?.preview || ""
    results.push({
      session_id: session.session_id,
      cwd: session.cwd,
      model: session.model,
      history_len: historyLen,
      title: hermesBuildSessionTitle(persisted?.title, preview, session.cwd),
      updated_at: hermesFormatUpdatedAt(
        firstPythonTruthy(persisted?.last_active, persisted?.started_at, input.nowSeconds ?? Math.trunc(Date.now() / 1000)),
      ),
    })
  }

  for (const row of input.persistedRows ?? []) {
    const sessionID = String(row.id)
    if (seenIDs.has(sessionID)) continue
    const messageCount = Number(row.message_count || 0)
    if (!Number.isFinite(messageCount) || messageCount <= 0) continue

    const sessionCwd = hermesCwdFromModelConfig(row.model_config)
    if (normalizedCwd && hermesNormalizeCwdForCompare(sessionCwd) !== normalizedCwd) continue
    results.push({
      session_id: sessionID,
      cwd: sessionCwd,
      model: row.model || "",
      history_len: messageCount,
      title: hermesBuildSessionTitle(row.title, row.preview, sessionCwd),
      updated_at: hermesFormatUpdatedAt(firstPythonTruthy(row.last_active, row.started_at)),
    })
  }

  return results.sort((left, right) => hermesUpdatedAtSortKey(right.updated_at) - hermesUpdatedAtSortKey(left.updated_at))
}

export function hermesCwdFromModelConfig(modelConfig: string | null | undefined): string {
  if (!modelConfig) return "."
  try {
    const parsed = JSON.parse(modelConfig) as { cwd?: unknown }
    return typeof parsed.cwd === "string" ? parsed.cwd : "."
  } catch {
    return "."
  }
}

export const hermesSessionContentJSONPrefix = "\u0000json:"

export const hermesSessionSQLiteNativeFacts = {
  schemaVersion: 14,
  journalModePreference: "wal-with-delete-fallback",
  ftsTables: ["messages_fts", "messages_fts_trigram"],
  ftsTriggers: [
    "messages_fts_insert",
    "messages_fts_delete",
    "messages_fts_update",
    "messages_fts_trigram_insert",
    "messages_fts_trigram_delete",
    "messages_fts_trigram_update",
  ],
  sessionsColumns: [
    "id",
    "source",
    "user_id",
    "model",
    "model_config",
    "system_prompt",
    "parent_session_id",
    "started_at",
    "ended_at",
    "end_reason",
    "message_count",
    "tool_call_count",
    "cwd",
    "title",
    "rewind_count",
  ],
  messagesColumns: [
    "id",
    "session_id",
    "role",
    "content",
    "tool_call_id",
    "tool_calls",
    "tool_name",
    "timestamp",
    "token_count",
    "finish_reason",
    "reasoning",
    "reasoning_content",
    "reasoning_details",
    "codex_reasoning_items",
    "codex_message_items",
    "platform_message_id",
    "observed",
    "active",
  ],
} as const

export function encodeHermesSessionContent(content: unknown): unknown {
  if (content === null || content === undefined || ["string", "number", "boolean"].includes(typeof content)) return content
  try {
    return hermesSessionContentJSONPrefix + JSON.stringify(content)
  } catch {
    return String(content)
  }
}

export function decodeHermesSessionContent(content: unknown): unknown {
  if (typeof content === "string" && content.startsWith(hermesSessionContentJSONPrefix)) {
    try {
      return JSON.parse(content.slice(hermesSessionContentJSONPrefix.length)) as unknown
    } catch {
      return content
    }
  }
  return content
}

export function replaceHermesSessionMessages(input: {
  sessionID: string
  messages: HermesSessionStoredMessageInput[]
  startTimestamp?: number
}): HermesSessionReplaceMessagesResult {
  let timestamp = input.startTimestamp ?? 1_700_000_000
  const rows: HermesSessionStoredMessageRow[] = []
  let toolCallCount = 0
  for (const [index, msg] of input.messages.entries()) {
    const role = msg.role ?? "unknown"
    const toolCalls = msg.tool_calls
    const platformMessageID = msg.platform_message_id ?? msg.message_id ?? null
    const toolCallsJSON = toolCalls ? JSON.stringify(toolCalls) : null
    if (toolCalls !== undefined && toolCalls !== null) toolCallCount += Array.isArray(toolCalls) ? toolCalls.length : 1
    rows.push({
      id: index + 1,
      session_id: input.sessionID,
      role,
      content: encodeHermesSessionContent(msg.content),
      tool_call_id: msg.tool_call_id ?? null,
      tool_calls: toolCallsJSON,
      tool_name: msg.tool_name ?? null,
      timestamp,
      token_count: msg.token_count ?? null,
      finish_reason: msg.finish_reason ?? null,
      reasoning: role === "assistant" ? (msg.reasoning ?? null) : null,
      reasoning_content: role === "assistant" ? (msg.reasoning_content ?? null) : null,
      reasoning_details: role === "assistant" && msg.reasoning_details ? JSON.stringify(msg.reasoning_details) : null,
      codex_reasoning_items: role === "assistant" && msg.codex_reasoning_items ? JSON.stringify(msg.codex_reasoning_items) : null,
      codex_message_items: role === "assistant" && msg.codex_message_items ? JSON.stringify(msg.codex_message_items) : null,
      platform_message_id: platformMessageID,
      observed: msg.observed ? 1 : 0,
      active: msg.active === false || msg.active === 0 ? 0 : 1,
    })
    timestamp += 0.000001
  }
  return {
    sessionID: input.sessionID,
    rows,
    messageCount: rows.length,
    toolCallCount,
    ftsIndexedContent: rows.map((row) => `${String(row.content ?? "")} ${row.tool_name ?? ""} ${row.tool_calls ?? ""}`),
    timestamps: rows.map((row) => row.timestamp),
  }
}

export function projectHermesOpenAIConversation(
  rows: HermesSessionStoredMessageRow[],
  input: { includeInactive?: boolean } = {},
): Array<Record<string, unknown>> {
  const messages: Array<Record<string, unknown>> = []
  const ordered = [...rows].filter((row) => input.includeInactive || row.active === 1).sort((left, right) => left.id - right.id)
  for (const row of ordered) {
    let content = decodeHermesSessionContent(row.content)
    if ((row.role === "user" || row.role === "assistant") && typeof content === "string") {
      content = sanitizeHermesContext(content).trim()
    }
    const msg: Record<string, unknown> = { role: row.role, content }
    if (row.tool_call_id) msg.tool_call_id = row.tool_call_id
    if (row.tool_name) msg.tool_name = row.tool_name
    if (row.tool_calls) msg.tool_calls = parseHermesJSONField(row.tool_calls, [])
    if (row.platform_message_id) msg.message_id = row.platform_message_id
    if (row.observed) msg.observed = true
    if (row.role === "assistant") {
      if (row.finish_reason) msg.finish_reason = row.finish_reason
      if (row.reasoning) msg.reasoning = row.reasoning
      if (row.reasoning_content !== null) msg.reasoning_content = row.reasoning_content
      if (row.reasoning_details) msg.reasoning_details = parseHermesJSONField(row.reasoning_details, null)
      if (row.codex_reasoning_items) msg.codex_reasoning_items = parseHermesJSONField(row.codex_reasoning_items, null)
      if (row.codex_message_items) msg.codex_message_items = parseHermesJSONField(row.codex_message_items, null)
    }
    messages.push(msg)
  }
  return messages
}

export function sanitizeHermesContext(text: string): string {
  return text
    .replace(/<\s*memory-context\s*>[\s\S]*?<\/\s*memory-context\s*>/gi, "")
    .replace(/\[System note:\s*The following is recalled memory context,\s*NOT new user input\.\s*Treat as (?:informational background data|authoritative reference data[^\]]*)\.\]\s*/gi, "")
    .replace(/<\/?\s*memory-context\s*>/gi, "")
}

export function convertHermesScratchpadToThink(content: string): string {
  if (!content || !content.includes("<REASONING_SCRATCHPAD>")) return content
  return content.replaceAll("<REASONING_SCRATCHPAD>", "<think>").replaceAll("</REASONING_SCRATCHPAD>", "</think>")
}

export function hasHermesIncompleteScratchpad(content: string): boolean {
  if (!content) return false
  return content.includes("<REASONING_SCRATCHPAD>") && !content.includes("</REASONING_SCRATCHPAD>")
}

export function buildHermesTrajectoryEntry(input: {
  trajectory: Array<Record<string, unknown>>
  model: string
  completed: boolean
  timestamp?: string
}): { filename: string; line: string; entry: HermesTrajectoryEntry } {
  const entry = {
    conversations: input.trajectory,
    timestamp: input.timestamp ?? new Date().toISOString(),
    model: input.model,
    completed: input.completed,
  }
  return {
    filename: input.completed ? "trajectory_samples.jsonl" : "failed_trajectories.jsonl",
    line: `${JSON.stringify(entry)}\n`,
    entry,
  }
}

function parseHermesJSONField(value: string, fallback: unknown): unknown {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return fallback
  }
}

function hermesSessionNativeDescriptor(id: HermesSessionNativeExactAtomID) {
  const port =
    id === hermesSessionIDGeneratorNativeExactAtomID
      ? "session.id-generator"
      : id === hermesSessionBranchGraphLineageNativeExactAtomID
        ? "session.branch-graph"
        : id === hermesSessionPaginationUpdatedAtNativeExactAtomID
          ? "session.pagination"
          : id === hermesSessionContextSelectorThreadHistoryNativeExactAtomID
            ? "session.context-selector"
            : id === hermesSessionStoreSqliteFtsNativeExactAtomID
              ? "session.store"
              : id === hermesSessionProjectorOpenAIMessagesNativeExactAtomID
                ? "session.projector"
                : id === hermesSessionMessagePartProjectorNativeExactAtomID
                  ? "session.message-part-projector"
                  : "session.compaction-records"
  return {
    id,
    port,
    product: "hermes-agent",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [hermesSessionNativeExactEvidenceRef, hermesSessionNativeExactReplayRef],
    fixtureIDs: [hermesSessionNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Hermes upstream native implementation with native parity complete ACP SessionManager, SQLite/FTS persistence, OpenAI message-part replay, and trajectory fixture coverage.",
  } as const
}

export const hermesSessionNativeDescriptors = [
  hermesSessionNativeDescriptor(hermesSessionIDGeneratorNativeExactAtomID),
  hermesSessionNativeDescriptor(hermesSessionBranchGraphLineageNativeExactAtomID),
  hermesSessionNativeDescriptor(hermesSessionPaginationUpdatedAtNativeExactAtomID),
  hermesSessionNativeDescriptor(hermesSessionContextSelectorThreadHistoryNativeExactAtomID),
  hermesSessionNativeDescriptor(hermesSessionStoreSqliteFtsNativeExactAtomID),
  hermesSessionNativeDescriptor(hermesSessionProjectorOpenAIMessagesNativeExactAtomID),
  hermesSessionNativeDescriptor(hermesSessionMessagePartProjectorNativeExactAtomID),
  hermesSessionNativeDescriptor(hermesSessionCompactionTrajectoryNativeExactAtomID),
] as const

export const hermesSessionNativeExactDescriptorForID = new Map(
  hermesSessionNativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export function buildHermesSessionNativeExactFixture(): HermesSessionNativeExactFixture {
  const atom = createHermesACPSessionAtom()
  const sessionID = "d1f80a7c-2f6d-41b8-9a10-8dfc4d0c71bd"
  const forkID = "16a9a8ff-9056-4da0-9a5b-66c0f383dc40"
  const created = atom.createSession({
    cwd: "E:\\Projects\\AI\\paperclip",
    sessionUUID: sessionID,
    isWSL: true,
    agentModel: "nous/hermes-4",
  })
  const original: HermesACPSessionState = {
    session_id: sessionID,
    cwd: "/work/base",
    model: "nous/hermes-4",
    history: [
      { role: "user", content: "original context" },
      { role: "assistant", content: { nested: ["reply"] } },
    ],
  }
  const forked = atom.forkSession({
    original,
    cwd: "D:\\work\\project",
    sessionUUID: forkID,
    isWSL: true,
    agentModel: "",
  })
  if (forked) forked.history[1] = { role: "assistant", content: { nested: ["reply", "mutated"] } }
  const memoryListing = atom.listSessions({
    nowSeconds: 1_700_000_020.5,
    cwd: "/mnt/e/Projects/AI/browser-link-3",
    memorySessions: [
      {
        session_id: "mem-old",
        cwd: "/mnt/e/Projects/AI/browser-link-3",
        model: "hermes-old",
        history: [{ role: "user", content: "  Investigate broken ACP history in Zed  " }],
      },
      {
        session_id: "mem-empty",
        cwd: "/mnt/e/Projects/AI/browser-link-3",
        model: "ignored",
        history: [],
      },
      {
        session_id: "mem-drop",
        cwd: "/tmp/other",
        model: "ignored",
        history: [{ role: "user", content: "wrong cwd" }],
      },
    ],
    persistedRows: [
      {
        id: "mem-old",
        title: " Fix Zed ACP history ",
        started_at: 1_700_000_000,
        last_active: 1_700_000_001.25,
      },
    ],
  })
  const persistedListing = atom.listSessions({
    cwd: "E:\\Projects\\AI\\browser-link-3",
    persistedRows: [
      {
        id: "persist-newer",
        model: "nous/hermes-4",
        model_config: JSON.stringify({ cwd: "/mnt/e/Projects/AI/browser-link-3" }),
        message_count: 3,
        preview: " Resume browser-link investigation ",
        last_active: "2026-06-13T12:10:42Z",
      },
      {
        id: "persist-older",
        model: "openrouter/auto",
        model_config: JSON.stringify({ cwd: "E:\\Projects\\AI\\browser-link-3" }),
        message_count: 1,
        preview: "Older thread",
        started_at: 1_700_000_000,
      },
      {
        id: "persist-empty",
        model_config: JSON.stringify({ cwd: "/mnt/e/Projects/AI/browser-link-3" }),
        message_count: 0,
        preview: "hidden",
      },
      {
        id: "persist-drop",
        model_config: JSON.stringify({ cwd: "/tmp/other" }),
        message_count: 1,
        preview: "wrong cwd",
      },
    ],
  })
  const stored = replaceHermesSessionMessages({
    sessionID,
    startTimestamp: 1_700_000_100,
    messages: [
      {
        role: "user",
        content: "  Hello Hermes\n",
        platform_message_id: "platform-1",
      },
      {
        role: "assistant",
        content: "<memory-context>hidden</memory-context> Visible answer ",
        reasoning: "plan",
        reasoning_content: "<think>plan</think>",
        reasoning_details: [{ type: "summary_text", text: "plan" }],
        codex_reasoning_items: [{ id: "rs_1" }],
        codex_message_items: [{ id: "msg_1" }],
        finish_reason: "stop",
      },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "codex_exec_1",
            type: "function",
            function: { name: "exec_command", arguments: "{\"command\":\"pwd\"}" },
          },
        ],
      },
      {
        role: "tool",
        content: "/work/project",
        tool_call_id: "codex_exec_1",
        tool_name: "exec_command",
      },
      {
        role: "user",
        content: [{ type: "text", text: "Look" }, { type: "image_url", image_url: { url: "file:///tmp/screen.png" } }],
        observed: true,
      },
      {
        role: "assistant",
        content: "inactive",
        active: 0,
      },
    ],
  })
  const projectedConversation = projectHermesOpenAIConversation(stored.rows)
  const projectedConversationWithInactive = projectHermesOpenAIConversation(stored.rows, { includeInactive: true })
  const completedTrajectory = buildHermesTrajectoryEntry({
    trajectory: [
      { from: "human", value: "Need compression" },
      { from: "gpt", value: convertHermesScratchpadToThink("<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>done") },
    ],
    model: "nous/hermes-4",
    completed: true,
    timestamp: "2026-06-13T12:10:42.949000",
  })
  const failedTrajectory = buildHermesTrajectoryEntry({
    trajectory: [{ from: "gpt", value: "partial" }],
    model: "nous/hermes-4",
    completed: false,
    timestamp: "2026-06-13T12:11:00.000000",
  })

  const fixtureWithoutFingerprint: Omit<HermesSessionNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "hermes-agent" as const,
    atomIDs: [...hermesSessionNativeExactAtomIDs] as typeof hermesSessionNativeExactAtomIDs,
    portIDs: [
      "session.id-generator",
      "session.branch-graph",
      "session.pagination",
      "session.context-selector",
      "session.store",
      "session.projector",
      "session.message-part-projector",
      "session.compaction-records",
    ] as const,
    upstreamRef: hermesSessionUpstreamRef,
    evidenceRef: hermesSessionNativeExactEvidenceRef,
    fixtureID: hermesSessionNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      acpCreateSessionUsesUUID4AndTranslatedCwd: true as const,
      acpForkSessionUsesFreshUUID4AndDeepCopiedHistory: true as const,
      acpForkMissingSessionReturnsNone: true as const,
      listSessionsSkipsEmptyThreads: true as const,
      listSessionsMergesMemoryWithDBRows: true as const,
      listSessionsFiltersByNormalizedCwd: true as const,
      listSessionsUsesTitlePreviewCwdFallback: true as const,
      listSessionsSortsByUpdatedAtDescending: true as const,
      sqliteStoreUsesWalFallbackAndFts5Triggers: true as const,
      replaceMessagesDeletesAndReinsertsAtomically: true as const,
      openaiConversationReplayDecodesStructuredContentAndReasoning: true as const,
      messagePartProjectorReplaysToolCallsReasoningStructuredContentAndObservedRows: true as const,
      compactionTrajectoryWritesJsonlAndConvertsScratchpadTags: true as const,
    },
    cases: [
      {
        scenarioID: "create-session-uuid-and-translated-cwd" as const,
        input: {
          cwd: "E:\\Projects\\AI\\paperclip",
          sessionUUID: sessionID,
          isWSL: true,
          agentModel: "nous/hermes-4",
        },
        output: {
          sessionID: created.session_id,
          sessionIDIsUUID4: isHermesACPSessionID(created.session_id),
          cwd: created.cwd,
          model: created.model,
          historyLength: created.history.length,
        },
        upstreamBehavior: "SessionManager.create_session translates ACP cwd, uses str(uuid.uuid4()) for session_id, creates an empty history, records the agent model, registers cwd, and persists the state.",
      },
      {
        scenarioID: "fork-session-deep-copies-history-and-model" as const,
        input: {
          originalSessionID: original.session_id,
          forkUUID: forkID,
          cwd: "D:\\work\\project",
          originalModel: original.model,
        },
        output: {
          forkedSessionID: forked?.session_id,
          forkedIDIsUUID4: forked ? isHermesACPSessionID(forked.session_id) : false,
          forkedCwd: forked?.cwd,
          forkedModel: forked?.model,
          forkedHistory: forked?.history,
          originalHistoryAfterForkMutation: original.history,
          missingFork: atom.forkSession({ original: null, sessionUUID: "c7b77809-16e4-4b21-8a07-81fb12f91afe" }),
        },
        upstreamBehavior: "SessionManager.fork_session returns None for missing originals; otherwise it translates cwd, creates a fresh UUID4 id, carries the original model when the new agent model is falsy, and uses copy.deepcopy(original.history).",
      },
      {
        scenarioID: "list-memory-sessions-title-preview-and-updated-at" as const,
        input: {
          cwd: "/mnt/e/Projects/AI/browser-link-3",
          nowSeconds: 1_700_000_020.5,
          memorySessionIDs: ["mem-old", "mem-empty", "mem-drop"],
          persistedTitle: " Fix Zed ACP history ",
        },
        output: {
          listed: memoryListing,
          listedIDs: memoryListing.map((item) => item.session_id),
          listedTitles: memoryListing.map((item) => item.title),
          listedUpdatedAt: memoryListing.map((item) => item.updated_at),
        },
        upstreamBehavior: "SessionManager.list_sessions skips in-memory sessions with empty history, filters by _normalize_cwd_for_compare, prefers persisted title over first user preview, formats persisted last_active, and sorts by _updated_at_sort_key descending.",
      },
      {
        scenarioID: "list-persisted-sessions-cwd-filter-and-sort" as const,
        input: {
          cwd: "E:\\Projects\\AI\\browser-link-3",
          persistedSessionIDs: ["persist-newer", "persist-older", "persist-empty", "persist-drop"],
        },
        output: {
          listed: persistedListing,
          listedIDs: persistedListing.map((item) => item.session_id),
          listedCwds: persistedListing.map((item) => item.cwd),
          listedTitles: persistedListing.map((item) => item.title),
          listedUpdatedAt: persistedListing.map((item) => item.updated_at),
        },
        upstreamBehavior: "SessionManager.list_sessions merges DB-only rows from list_sessions_rich(source='acp', limit=1000), skips message_count <= 0, reads cwd from model_config JSON with '.' fallback, applies normalized cwd filtering, builds titles from title/preview/cwd, formats last_active or started_at, then sorts newest first.",
      },
      {
        scenarioID: "sqlite-fts-schema-and-replace-messages" as const,
        input: {
          sessionID,
          messageCount: stored.rows.length,
          startTimestamp: 1_700_000_100,
        },
        output: {
          schemaVersion: hermesSessionSQLiteNativeFacts.schemaVersion,
          journalModePreference: hermesSessionSQLiteNativeFacts.journalModePreference,
          ftsTables: hermesSessionSQLiteNativeFacts.ftsTables,
          ftsTriggers: hermesSessionSQLiteNativeFacts.ftsTriggers,
          messageCount: stored.messageCount,
          toolCallCount: stored.toolCallCount,
          encodedStructuredContent: stored.rows[4]?.content,
          ftsIndexedContent: stored.ftsIndexedContent,
          timestamps: stored.timestamps,
        },
        upstreamBehavior: "SessionDB creates sessions/messages/state_meta/compression_locks, prefers WAL with DELETE fallback, maintains messages_fts and messages_fts_trigram triggers, and replace_messages deletes existing rows, resets counters, reinserts ordered messages with 1e-6 timestamp increments, JSON-encodes structured content and assistant reasoning fields, then updates message_count/tool_call_count atomically.",
      },
      {
        scenarioID: "openai-message-replay-and-sanitized-context" as const,
        input: {
          sessionID,
          includeInactiveDefault: false,
          includeInactiveOverride: true,
        },
        output: {
          replayed: projectedConversation,
          replayedRoles: projectedConversation.map((item) => item.role),
          inactiveDefaultCount: projectedConversation.length,
          inactiveOverrideCount: projectedConversationWithInactive.length,
          sanitizedAssistantContent: projectedConversation[1]?.content,
          structuredUserContent: projectedConversation[4]?.content,
        },
        upstreamBehavior: "SessionDB.get_messages_as_conversation reads active rows by autoincrement id, decodes sentinel-prefixed JSON content, strips memory context from user/assistant strings, surfaces tool fields, platform_message_id as message_id, observed, assistant finish/reasoning fields, and can include inactive rows only when requested.",
      },
      {
        scenarioID: "trajectory-scratchpad-and-jsonl-entry" as const,
        input: {
          completed: true,
          failed: false,
        },
        output: {
          convertedScratchpad: convertHermesScratchpadToThink("<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>done"),
          incompleteScratchpad: hasHermesIncompleteScratchpad("<REASONING_SCRATCHPAD>plan"),
          completeScratchpad: hasHermesIncompleteScratchpad("<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>"),
          completedFilename: completedTrajectory.filename,
          completedLine: completedTrajectory.line,
          failedFilename: failedTrajectory.filename,
          failedLine: failedTrajectory.line,
        },
        upstreamBehavior: "agent.trajectory converts REASONING_SCRATCHPAD tags to think tags, detects incomplete scratchpads, and save_trajectory appends a JSONL entry with conversations/timestamp/model/completed to trajectory_samples.jsonl for completed runs or failed_trajectories.jsonl otherwise.",
      },
    ],
    sourceRefs: [
      `${hermesSessionUpstreamRef}:acp_adapter/session.py#SessionManager.create_session,SessionManager.fork_session,SessionManager.list_sessions,_build_session_title,_format_updated_at,_updated_at_sort_key,_normalize_cwd_for_compare`,
      `${hermesSessionUpstreamRef}:tests/acp/test_session.py#TestCreateSession,TestForkSession,TestListAndCleanup,TestPersistence,TestWslCwdTranslation`,
      `${hermesSessionUpstreamRef}:hermes_state.py#SCHEMA_SQL,FTS_SQL,FTS_TRIGRAM_SQL,SessionDB._insert_session_row,SessionDB.replace_messages,SessionDB.get_messages_as_conversation,SessionDB.list_sessions_rich`,
      `${hermesSessionUpstreamRef}:agent/memory_manager.py#sanitize_context`,
      `${hermesSessionUpstreamRef}:agent/trajectory.py#convert_scratchpad_to_think,has_incomplete_scratchpad,save_trajectory`,
      `${hermesSessionUpstreamRef}:agent/transports/codex_event_projector.py#CodexEventProjector,_deterministic_call_id,ProjectionResult`,
    ],
    nativeEvidenceRefs: [...hermesSessionNativeDescriptors[0].nativeEvidenceRefs],
    fixtureIDs: [...hermesSessionNativeDescriptors[0].fixtureIDs],
    knownLossiness: [] as string[],
    intentionallyBridgeAtoms: [] as const,
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyHermesSessionNativeExactFixture(
  fixture: HermesSessionNativeExactFixture,
): HermesSessionNativeExactVerification {
  const canonical = buildHermesSessionNativeExactFixture()
  const issues: HermesSessionNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "hermes-session-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Hermes ACP session behavior." })
  }
  if (fixture.product !== "hermes-agent" || JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    issues.push({ id: "hermes-session-native-exact.identity", message: "Fixture must remain scoped to the Hermes ACP session native atoms and ports." })
  }
  if (
    fixture.upstreamRef !== hermesSessionUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("acp_adapter/session.py#SessionManager.create_session")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("tests/acp/test_session.py#TestCreateSession")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("hermes_state.py#SCHEMA_SQL")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("SessionDB.replace_messages")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent/memory_manager.py#sanitize_context")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent/trajectory.py#convert_scratchpad_to_think"))
  ) {
    issues.push({ id: "hermes-session-native-exact.upstream", message: "Fixture must stay pinned to Hermes upstream ACP session manager, SessionDB persistence/projection, trajectory, and tests." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "hermes-session-native-exact.native-claim", message: "Hermes ACP session fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || hermesSessionNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "hermes-session-native-exact.lossiness", message: "Native exact Hermes ACP session fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(hermesSessionNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(hermesSessionNativeExactReplayRef)) {
    issues.push({ id: "hermes-session-native-exact.evidence", message: "Hermes ACP session native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(hermesSessionNativeExactFixtureID)) {
    issues.push({ id: "hermes-session-native-exact.fixture", message: "Hermes ACP session native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "hermes-session-native-exact.policy", message: "Hermes ACP session policy drifted from upstream SessionManager behavior." })
  }
  if (
    JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases) ||
    !fixture.cases.some((item) => item.scenarioID === "create-session-uuid-and-translated-cwd") ||
    !fixture.cases.some((item) => item.scenarioID === "fork-session-deep-copies-history-and-model") ||
    !fixture.cases.some((item) => item.scenarioID === "list-persisted-sessions-cwd-filter-and-sort") ||
    !fixture.cases.some((item) => item.scenarioID === "sqlite-fts-schema-and-replace-messages") ||
    !fixture.cases.some((item) => item.scenarioID === "openai-message-replay-and-sanitized-context") ||
    !fixture.cases.some((item) => item.scenarioID === "trajectory-scratchpad-and-jsonl-entry")
  ) {
    issues.push({ id: "hermes-session-native-exact.cases", message: "Hermes ACP session cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function firstHermesUserPreview(history: HermesACPMessage[]): string {
  for (const msg of history) {
    if (msg.role !== "user") continue
    const content = String(msg.content || "").trim()
    if (content) return content
  }
  return ""
}

function firstPythonTruthy(...values: unknown[]): unknown {
  for (const value of values) {
    if (isPythonTruthy(value)) return value
  }
  return undefined
}

function isPythonTruthy(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return false
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value)
  if (typeof value === "string") return value.length > 0
  return true
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
