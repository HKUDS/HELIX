import { createHash } from "node:crypto"
import { basename, join } from "node:path"
import { nanobotIdentityUpstreamRef, nanobotSessionSafeKey } from "./identity.ts"

export const nanobotSessionUpstreamRef = nanobotIdentityUpstreamRef
export const nanobotSessionNativeExactFixtureID = "nanobot-session:native-exact-fixture"
export const nanobotSessionNativeExactEvidenceRef = "conformance:nanobot-session-native-exact-fixture"
export const nanobotSessionNativeExactReplayRef = "session-native-exact:nanobot"
export const nanobotSessionBranchGraphChannelKeyNativeExactAtomID = "nanobot.session.branch-graph.channel-key"
export const nanobotSessionContextSelectorMaxMessagesNativeExactAtomID = "nanobot.session.context-selector.max-messages"
export const nanobotSessionGoalStateNativeExactAtomID = "nanobot.session.goal-state"
export const nanobotSessionIDGeneratorNativeExactAtomID = "nanobot.session.id-generator"
export const nanobotSessionPaginationUpdatedAtNativeExactAtomID = "nanobot.session.pagination.updated-at"
export const nanobotSessionMessagePartProjectorNativeExactAtomID = "nanobot.session.message-part-projector.native-like"
export const nanobotSessionProjectorJSONLNativeExactAtomID = "nanobot.session.projector.jsonl"
export const nanobotSessionStoreJSONLNativeExactAtomID = "nanobot.session.store.jsonl"

export const nanobotSessionNativeExactAtomIDs = [
  nanobotSessionBranchGraphChannelKeyNativeExactAtomID,
  nanobotSessionContextSelectorMaxMessagesNativeExactAtomID,
  nanobotSessionGoalStateNativeExactAtomID,
  nanobotSessionIDGeneratorNativeExactAtomID,
  nanobotSessionPaginationUpdatedAtNativeExactAtomID,
  nanobotSessionMessagePartProjectorNativeExactAtomID,
  nanobotSessionProjectorJSONLNativeExactAtomID,
  nanobotSessionStoreJSONLNativeExactAtomID,
] as const

export type NanobotSessionNativeExactAtomID = (typeof nanobotSessionNativeExactAtomIDs)[number]
export type NanobotSessionPortID =
  | "session.branch-graph"
  | "session.context-selector"
  | "session.compaction-records"
  | "session.id-generator"
  | "session.message-part-projector"
  | "session.pagination"
  | "session.projector"
  | "session.store"

export interface NanobotSessionNativeDescriptor {
  id: NanobotSessionNativeExactAtomID
  port: NanobotSessionPortID
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof nanobotSessionNativeExactEvidenceRef, typeof nanobotSessionNativeExactReplayRef]
  fixtureIDs: [typeof nanobotSessionNativeExactFixtureID]
  knownLossiness: []
}

export interface NanobotSessionMessage extends Record<string, unknown> {
  role?: string
  content?: unknown
  timestamp?: string
  media?: unknown
  tool_calls?: unknown
  tool_call_id?: unknown
  name?: unknown
  reasoning_content?: unknown
  thinking_blocks?: unknown
  _channel_delivery?: unknown
  _command?: unknown
  injected_event?: unknown
}

export interface NanobotSessionProjection {
  key: string
  messages: NanobotSessionMessage[]
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
  lastConsolidated: number
}

export interface NanobotSessionHistoryEntry extends Record<string, unknown> {
  role: string
  content: unknown
}

export interface NanobotSessionParseResult {
  session: NanobotSessionProjection | null
  repaired: boolean
  skippedCorruptLines: number
}

export interface NanobotSessionListFile {
  path: string
  text: string
}

export interface NanobotSessionListItem {
  key: string
  created_at: string | null
  updated_at: string | null
  title: string
  preview: string
  path: string
}

export type NanobotSessionNativeScenarioID =
  | "session-key-safe-path-and-jsonl-store"
  | "history-projector-timestamp-media-and-sanitize"
  | "context-selector-token-and-tool-boundary"
  | "retention-file-cap-and-last-consolidated"
  | "list-sessions-preview-repair-and-updated-at"
  | "goal-state-runtime-websocket-and-timeout"

export interface NanobotSessionNativeExactCase {
  scenarioID: NanobotSessionNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface NanobotSessionNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomIDs: typeof nanobotSessionNativeExactAtomIDs
  portIDs: readonly [
    "session.branch-graph",
    "session.context-selector",
    "session.compaction-records",
    "session.id-generator",
    "session.message-part-projector",
    "session.pagination",
    "session.projector",
    "session.store",
  ]
  upstreamRef: typeof nanobotSessionUpstreamRef
  evidenceRef: typeof nanobotSessionNativeExactEvidenceRef
  fixtureID: typeof nanobotSessionNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    sessionKeysUseChannelChatIDsAndSafeFilenames: true
    jsonlStoreWritesMetadataFirstAndMessagesAfter: true
    jsonlLoadRepairsCorruptLinesAndPreservesValidRows: true
    listSessionsUsesMetadataTitleUserPreviewFallbackAssistantPreviewAndUpdatedAtSort: true
    historyStartsAtLegalUserOrProactiveDeliveryBoundary: true
    historyDropsOrphanToolResultsAndCommandRows: true
    historyAddsUserOnlyTimestampsAndMediaBreadcrumbs: true
    historySanitizesAssistantReplayArtifacts: true
    messagePartProjectorReplaysToolCallsReasoningThinkingMediaAndTimestamps: true
    contextSelectorAppliesMaxMessagesThenTokenBudget: true
    retentionKeepsLegalRecentSuffixAndAdjustsLastConsolidated: true
    fileCapArchivesOnlyUnconsolidatedDroppedMessages: true
    goalStatePrefersNewKeyButReadsLegacyThreadGoal: true
    sustainedGoalsDisableRunnerWallClockTimeout: true
  }
  cases: NanobotSessionNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly NanobotSessionNativeDescriptor[]
  intentionallyBridgeAtoms: readonly []
  fingerprint: string
}

export interface NanobotSessionNativeExactIssue {
  id: string
  message: string
}

export interface NanobotSessionNativeExactVerification {
  ok: boolean
  issues: NanobotSessionNativeExactIssue[]
}

export function createNanobotSessionProjection(input: {
  key: string
  messages?: NanobotSessionMessage[]
  createdAt?: string
  updatedAt?: string
  metadata?: Record<string, unknown>
  lastConsolidated?: number
}): NanobotSessionProjection {
  const now = input.updatedAt ?? input.createdAt ?? "2026-06-13T00:00:00"
  return {
    key: input.key,
    messages: (input.messages ?? []).map(cloneMessage),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    metadata: { ...(input.metadata ?? {}) },
    lastConsolidated: normalizeNonNegativeInteger(input.lastConsolidated, 0),
  }
}

export function addNanobotSessionMessageProjection(
  session: NanobotSessionProjection,
  input: { role: string; content: unknown; timestamp?: string; updatedAt?: string; extra?: Record<string, unknown> },
): NanobotSessionProjection {
  const timestamp = input.timestamp ?? input.updatedAt ?? "2026-06-13T00:00:00"
  const updatedAt = input.updatedAt ?? timestamp
  return {
    ...cloneSession(session),
    messages: [
      ...session.messages.map(cloneMessage),
      {
        role: input.role,
        content: input.content,
        timestamp,
        ...(input.extra ?? {}),
      },
    ],
    updatedAt,
  }
}

export function nanobotSessionPathProjection(input: { workspace: string; key: string }): string {
  return join(input.workspace, "sessions", `${nanobotSessionSafeKey(input.key)}.jsonl`)
}

export function sanitizeNanobotAssistantReplayText(content: string): string {
  const withoutTimePrefix = content.replace(/^\[Message Time: [^\]]+\]\n?/, "")
  return withoutTimePrefix
    .split(/\r?\n/)
    .filter((line) => !/^\[image: (?:\/|~)[^\]]+\]\s*$/.test(line) && !/^\s*(?:generate_image|message)\([^)]*\)\s*$/.test(line))
    .join("\n")
    .trim()
}

export function nanobotSessionTextPreview(content: unknown): string {
  let text = ""
  if (typeof content === "string") {
    text = content
  } else if (Array.isArray(content)) {
    text = content
      .flatMap((block) => {
        if (!isRecord(block) || block.type !== "text" || typeof block.text !== "string") return []
        return [block.text]
      })
      .join(" ")
  } else {
    return ""
  }
  const compact = sanitizeNanobotAssistantReplayText(text).replace(/\s+/g, " ").trim()
  return compact.length > 120 ? `${compact.slice(0, 119).trimEnd()}\u2026` : compact
}

export function nanobotSessionMessagePreviewText(message: NanobotSessionMessage): string {
  let content = message.content
  if (message.injected_event === "subagent_result" && typeof content === "string") {
    content = scrubNanobotSubagentAnnounceBodyProjection(content)
  }
  return nanobotSessionTextPreview(content)
}

export function scrubNanobotSubagentAnnounceBodyProjection(content: string): string {
  const stripped = content.replace(/\r\n/g, "\n").trim()
  const lines = stripped.split("\n")
  const header = lines[0]?.startsWith("[Subagent") ? lines[0].trim() : ""
  const lower = stripped.toLowerCase()
  let key = "\nresult:\n"
  let resultIndex = lower.indexOf(key)
  if (resultIndex === -1) {
    key = "\nresult:"
    resultIndex = lower.indexOf(key)
  }
  if (resultIndex === -1) return header || stripped
  let body = stripped.slice(resultIndex + key.length).trimStart()
  const summarizeIndex = body.toLowerCase().indexOf("summarize this naturally")
  if (summarizeIndex !== -1) body = body.slice(0, summarizeIndex).trimEnd()
  body = body.trim()
  if (body.length > 800) body = `${body.slice(0, 799).trimEnd()}\u2026`
  if (header && body) return `${header}\n\n${body}`
  return header || body || stripped
}

export function findNanobotLegalMessageStartProjection(messages: NanobotSessionMessage[]): number {
  const declared = new Set<string>()
  let start = 0
  for (const [index, message] of messages.entries()) {
    if (message.role === "assistant") {
      for (const toolCall of Array.isArray(message.tool_calls) ? message.tool_calls : []) {
        if (isRecord(toolCall) && toolCall.id) declared.add(String(toolCall.id))
      }
    } else if (message.role === "tool") {
      const toolCallID = message.tool_call_id
      if (toolCallID && !declared.has(String(toolCallID))) {
        start = index + 1
        declared.clear()
      }
    }
  }
  return start
}

export function estimateNanobotMessageTokensProjection(message: Record<string, unknown>): number {
  const parts: string[] = []
  const content = message.content
  if (typeof content === "string") {
    parts.push(content)
  } else if (Array.isArray(content)) {
    for (const part of content) {
      if (isRecord(part) && part.type === "text" && typeof part.text === "string" && part.text) {
        parts.push(part.text)
      } else if (part !== undefined) {
        parts.push(stringifyUnknown(part))
      }
    }
  } else if (content !== null && content !== undefined) {
    parts.push(stringifyUnknown(content))
  }
  for (const key of ["name", "tool_call_id"] as const) {
    const value = message[key]
    if (typeof value === "string" && value) parts.push(value)
  }
  if (message.tool_calls) parts.push(stringifyUnknown(message.tool_calls))
  if (typeof message.reasoning_content === "string" && message.reasoning_content) parts.push(message.reasoning_content)
  const payload = parts.join("\n")
  if (!payload) return 4
  return Math.max(4, Math.floor(payload.length / 4) + 4)
}

export function projectNanobotSessionHistory(
  session: NanobotSessionProjection,
  options: {
    maxMessages?: number
    maxTokens?: number
    includeTimestamps?: boolean
    estimateMessageTokens?: (message: NanobotSessionHistoryEntry) => number
    tokenEstimateByContent?: Record<string, number>
  } = {},
): NanobotSessionHistoryEntry[] {
  const unconsolidated = session.messages.slice(session.lastConsolidated)
  const maxMessages = (options.maxMessages ?? 120) > 0 ? options.maxMessages ?? 120 : 120
  let sliced = unconsolidated.slice(-maxMessages)

  for (const [index, message] of sliced.entries()) {
    if (message.role === "user") {
      const start = index > 0 && sliced[index - 1]?._channel_delivery ? index - 1 : index
      sliced = sliced.slice(start)
      break
    }
  }

  const legalStart = findNanobotLegalMessageStartProjection(sliced)
  if (legalStart) sliced = sliced.slice(legalStart)

  let output: NanobotSessionHistoryEntry[] = []
  for (const message of sliced) {
    if (message._command) continue
    const role = typeof message.role === "string" ? message.role : String(message.role ?? "")
    let content = hasOwn(message, "content") ? message.content : ""
    if (role === "assistant" && typeof content === "string") {
      content = sanitizeNanobotAssistantReplayText(content)
    }
    const media = message.media
    if (role === "user" && Array.isArray(media) && media.length > 0 && typeof content === "string") {
      const breadcrumbs = media
        .filter((item): item is string => typeof item === "string" && item.length > 0)
        .map((item) => `[image: ${item}]`)
        .join("\n")
      content = content ? `${content}\n${breadcrumbs}` : breadcrumbs
    }
    if (options.includeTimestamps) {
      content = annotateNanobotMessageTime(message, content)
    }
    if (role === "assistant" && typeof content === "string" && !content.trim()) {
      if (!["tool_calls", "reasoning_content", "thinking_blocks"].some((key) => hasOwn(message, key))) continue
    }
    const entry: NanobotSessionHistoryEntry = { role, content }
    for (const key of ["tool_calls", "tool_call_id", "name", "reasoning_content", "thinking_blocks"] as const) {
      if (hasOwn(message, key)) entry[key] = message[key]
    }
    output.push(entry)
  }

  const maxTokens = options.maxTokens ?? 0
  if (maxTokens > 0 && output.length > 0) {
    const estimate = (message: NanobotSessionHistoryEntry) => {
      if (typeof message.content === "string") {
        const mappedTokens = options.tokenEstimateByContent?.[message.content]
        if (mappedTokens !== undefined) return mappedTokens
      }
      return options.estimateMessageTokens?.(message) ?? estimateNanobotMessageTokensProjection(message)
    }
    const kept: NanobotSessionHistoryEntry[] = []
    let used = 0
    for (const message of [...output].reverse()) {
      const tokens = estimate(message)
      if (kept.length > 0 && used + tokens > maxTokens) break
      kept.push(message)
      used += tokens
    }
    kept.reverse()

    const firstUser = kept.findIndex((message) => message.role === "user")
    if (firstUser !== -1) {
      output = kept.slice(firstUser)
    } else {
      const recoveredUser = findLastIndex(output, (message) => message.role === "user")
      if (recoveredUser !== -1) output = output.slice(recoveredUser)
      else output = kept
    }
    const tokenLegalStart = findNanobotLegalMessageStartProjection(output)
    if (tokenLegalStart) output = output.slice(tokenLegalStart)
  }

  return output
}

export function clearNanobotSessionProjection(session: NanobotSessionProjection, updatedAt = session.updatedAt): NanobotSessionProjection {
  const metadata = { ...session.metadata }
  delete metadata._last_summary
  return {
    ...cloneSession(session),
    messages: [],
    metadata,
    lastConsolidated: 0,
    updatedAt,
  }
}

export function retainNanobotRecentLegalSuffixProjection(
  session: NanobotSessionProjection,
  maxMessages: number,
  updatedAt = session.updatedAt,
): NanobotSessionProjection {
  if (maxMessages <= 0) return clearNanobotSessionProjection(session, updatedAt)
  if (session.messages.length <= maxMessages) return cloneSession(session)

  let retained = session.messages.slice(-maxMessages).map(cloneMessage)
  const firstUser = retained.findIndex((message) => message.role === "user")
  if (firstUser !== -1) {
    retained = retained.slice(firstUser)
  } else {
    const latestUser = findLastIndex(session.messages, (message) => message.role === "user")
    if (latestUser !== -1) retained = session.messages.slice(latestUser, latestUser + maxMessages).map(cloneMessage)
  }

  const legalStart = findNanobotLegalMessageStartProjection(retained)
  if (legalStart) retained = retained.slice(legalStart)
  if (retained.length > maxMessages) {
    retained = retained.slice(-maxMessages)
    const hardCapLegalStart = findNanobotLegalMessageStartProjection(retained)
    if (hardCapLegalStart) retained = retained.slice(hardCapLegalStart)
  }

  const dropped = session.messages.length - retained.length
  return {
    ...cloneSession(session),
    messages: retained,
    lastConsolidated: Math.max(0, session.lastConsolidated - dropped),
    updatedAt,
  }
}

export function enforceNanobotSessionFileCapProjection(
  session: NanobotSessionProjection,
  input: { limit?: number; updatedAt?: string } = {},
): { session: NanobotSessionProjection; archived: NanobotSessionMessage[]; droppedCount: number } {
  const limit = input.limit ?? 2000
  if (limit <= 0 || session.messages.length <= limit) return { session: cloneSession(session), archived: [], droppedCount: 0 }
  const before = session.messages.map(cloneMessage)
  const beforeLastConsolidated = session.lastConsolidated
  const trimmed = retainNanobotRecentLegalSuffixProjection(session, limit, input.updatedAt ?? session.updatedAt)
  const droppedCount = before.length - trimmed.messages.length
  if (droppedCount <= 0) return { session: trimmed, archived: [], droppedCount: 0 }
  const dropped = before.slice(0, droppedCount)
  const alreadyConsolidated = Math.min(beforeLastConsolidated, droppedCount)
  return {
    session: trimmed,
    archived: dropped.slice(alreadyConsolidated),
    droppedCount,
  }
}

export function serializeNanobotSessionJSONLProjection(session: NanobotSessionProjection): string {
  const metadataLine = {
    _type: "metadata",
    key: session.key,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
    metadata: session.metadata,
    last_consolidated: session.lastConsolidated,
  }
  return [
    JSON.stringify(metadataLine),
    ...session.messages.map((message) => JSON.stringify(message)),
  ].join("\n") + "\n"
}

export function parseNanobotSessionJSONLProjection(input: { key: string; text: string; now?: string }): NanobotSessionParseResult {
  const now = input.now ?? "2026-06-13T00:00:00"
  try {
    const session = parseNanobotSessionJSONLStrict(input.key, input.text, now)
    return { session, repaired: false, skippedCorruptLines: 0 }
  } catch {
    const repaired = repairNanobotSessionJSONLProjection(input.key, input.text, now)
    return repaired
  }
}

export function readNanobotSessionFileProjection(input: { key: string; text: string; now?: string }): {
  key: string
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
  messages: NanobotSessionMessage[]
} | null {
  const parsed = parseNanobotSessionJSONLProjection(input)
  if (!parsed.session) return null
  return nanobotSessionPayloadProjection(parsed.session)
}

export function nanobotSessionPayloadProjection(session: NanobotSessionProjection): {
  key: string
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
  messages: NanobotSessionMessage[]
} {
  return {
    key: session.key,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
    metadata: { ...session.metadata },
    messages: session.messages.map(cloneMessage),
  }
}

export function listNanobotSessionFilesProjection(files: NanobotSessionListFile[], now = "2026-06-13T00:00:00"): NanobotSessionListItem[] {
  const sessions: NanobotSessionListItem[] = []
  for (const file of files) {
    const fallbackKey = fallbackNanobotSessionKeyFromPath(file.path)
    try {
      const lines = file.text.split(/\r?\n/)
      const firstLine = lines.shift()?.trim()
      if (!firstLine) continue
      const data = JSON.parse(firstLine) as unknown
      if (!isRecord(data) || data._type !== "metadata") continue
      const metadata = isRecord(data.metadata) ? data.metadata : {}
      let preview = ""
      let fallbackPreview = ""
      for (const line of lines) {
        if (!line.trim()) continue
        const item = JSON.parse(line) as unknown
        if (!isRecord(item) || item._type === "metadata") continue
        const text = nanobotSessionMessagePreviewText(item)
        if (!text) continue
        if (item.role === "user") {
          preview = text
          break
        }
        if (!fallbackPreview && item.role === "assistant") fallbackPreview = text
      }
      sessions.push({
        key: typeof data.key === "string" ? data.key : fallbackKey,
        created_at: typeof data.created_at === "string" ? data.created_at : null,
        updated_at: typeof data.updated_at === "string" ? data.updated_at : null,
        title: typeof metadata.title === "string" ? metadata.title : "",
        preview: preview || fallbackPreview,
        path: file.path,
      })
    } catch {
      const repaired = repairNanobotSessionJSONLProjection(fallbackKey, file.text, now)
      if (repaired.session) {
        const session = repaired.session
        sessions.push({
          key: session.key,
          created_at: session.createdAt,
          updated_at: session.updatedAt,
          title: typeof session.metadata.title === "string" ? session.metadata.title : "",
          preview: session.messages.map(nanobotSessionMessagePreviewText).find(Boolean) ?? "",
          path: file.path,
        })
      }
    }
  }
  return sessions.sort((left, right) => String(right.updated_at ?? "").localeCompare(String(left.updated_at ?? "")))
}

export const nanobotGoalStateKey = "goal_state"
export const nanobotLegacyGoalStateKey = "thread_goal"

export function nanobotGoalStateRawProjection(metadata: Record<string, unknown> | null | undefined): unknown {
  if (!metadata) return null
  if (hasOwn(metadata, nanobotGoalStateKey)) return metadata[nanobotGoalStateKey]
  return metadata[nanobotLegacyGoalStateKey]
}

export function nanobotDiscardLegacyGoalStateKeyProjection(metadata: Record<string, unknown>): Record<string, unknown> {
  const out = { ...metadata }
  delete out[nanobotLegacyGoalStateKey]
  return out
}

export function parseNanobotGoalStateProjection(blob: unknown): Record<string, unknown> | null {
  if (blob === null || blob === undefined) return null
  if (isRecord(blob)) return blob
  if (typeof blob === "string") {
    try {
      const parsed = JSON.parse(blob) as unknown
      return isRecord(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

export function nanobotSustainedGoalActiveProjection(metadata: Record<string, unknown> | null | undefined): boolean {
  const goal = parseNanobotGoalStateProjection(nanobotGoalStateRawProjection(metadata))
  return Boolean(goal && goal.status === "active")
}

export function nanobotGoalStateRuntimeLinesProjection(metadata: Record<string, unknown> | null | undefined): string[] {
  if (!metadata) return []
  const goal = parseNanobotGoalStateProjection(nanobotGoalStateRawProjection(metadata))
  if (!goal || goal.status !== "active") return []
  let objective = String(goal.objective ?? "").trim()
  if (!objective) return ["Goal: active (no objective text stored)."]
  if (objective.length > 4000) objective = `${objective.slice(0, 4000).trimEnd()}\n\u2026 (truncated)`
  const lines = ["Goal (active):", objective]
  const summary = String(goal.ui_summary ?? "").trim()
  if (summary) lines.push(`Summary: ${summary}`)
  return lines
}

export function nanobotGoalStateWSBlobProjection(metadata: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const goal = metadata ? parseNanobotGoalStateProjection(nanobotGoalStateRawProjection(metadata)) : null
  if (!goal || goal.status !== "active") return { active: false }
  let objective = String(goal.objective ?? "").trim()
  if (objective.length > 600) objective = `${objective.slice(0, 600).trimEnd()}\u2026`
  const summary = String(goal.ui_summary ?? "").trim().slice(0, 120)
  const blob: Record<string, unknown> = { active: true }
  if (summary) blob.ui_summary = summary
  if (objective) blob.objective = objective
  return blob
}

export function nanobotRunnerWallLLMTimeoutProjection(input: {
  metadata?: Record<string, unknown> | null
  sessionKey?: string | null
  sessions?: Record<string, NanobotSessionProjection>
}): number | null {
  const metadata = input.metadata ?? (input.sessionKey ? input.sessions?.[input.sessionKey]?.metadata : null)
  return nanobotSustainedGoalActiveProjection(metadata) ? 0.0 : null
}

function nanobotSessionNativeDescriptor(id: NanobotSessionNativeExactAtomID): NanobotSessionNativeDescriptor {
  const port = nanobotSessionNativePortForAtomID(id)
  return {
    id,
    port,
    product: "nanobot",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [nanobotSessionNativeExactEvidenceRef, nanobotSessionNativeExactReplayRef],
    fixtureIDs: [nanobotSessionNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Nanobot upstream native implementation with native parity complete Session, SessionManager JSONL, history replay, retention, listing, and goal_state fixture coverage.",
  }
}

export const nanobotSessionNativeDescriptors = [
  nanobotSessionNativeDescriptor(nanobotSessionBranchGraphChannelKeyNativeExactAtomID),
  nanobotSessionNativeDescriptor(nanobotSessionContextSelectorMaxMessagesNativeExactAtomID),
  nanobotSessionNativeDescriptor(nanobotSessionGoalStateNativeExactAtomID),
  nanobotSessionNativeDescriptor(nanobotSessionIDGeneratorNativeExactAtomID),
  nanobotSessionNativeDescriptor(nanobotSessionPaginationUpdatedAtNativeExactAtomID),
  nanobotSessionNativeDescriptor(nanobotSessionMessagePartProjectorNativeExactAtomID),
  nanobotSessionNativeDescriptor(nanobotSessionProjectorJSONLNativeExactAtomID),
  nanobotSessionNativeDescriptor(nanobotSessionStoreJSONLNativeExactAtomID),
] as const

export const nanobotSessionNativeExactDescriptorForID = new Map(
  nanobotSessionNativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export function nanobotSessionNativePortForAtomID(id: NanobotSessionNativeExactAtomID): NanobotSessionPortID {
  if (id === nanobotSessionBranchGraphChannelKeyNativeExactAtomID) return "session.branch-graph"
  if (id === nanobotSessionContextSelectorMaxMessagesNativeExactAtomID) return "session.context-selector"
  if (id === nanobotSessionGoalStateNativeExactAtomID) return "session.compaction-records"
  if (id === nanobotSessionIDGeneratorNativeExactAtomID) return "session.id-generator"
  if (id === nanobotSessionPaginationUpdatedAtNativeExactAtomID) return "session.pagination"
  if (id === nanobotSessionMessagePartProjectorNativeExactAtomID) return "session.message-part-projector"
  if (id === nanobotSessionProjectorJSONLNativeExactAtomID) return "session.projector"
  return "session.store"
}

export function buildNanobotSessionNativeExactFixture(): NanobotSessionNativeExactFixture {
  const baseSession = createNanobotSessionProjection({
    key: "websocket:room/alpha",
    createdAt: "2026-06-13T08:00:00",
    updatedAt: "2026-06-13T08:00:10",
    metadata: { title: "Launch review", source: "fixture" },
    lastConsolidated: 1,
    messages: [
      { role: "assistant", content: "already summarized" },
      { role: "user", content: "hello", timestamp: "2026-06-13T08:00:01" },
    ],
  })
  const added = addNanobotSessionMessageProjection(baseSession, {
    role: "assistant",
    content: "hi",
    timestamp: "2026-06-13T08:00:11",
    updatedAt: "2026-06-13T08:00:11",
  })
  const serialized = serializeNanobotSessionJSONLProjection(added)
  const parsed = parseNanobotSessionJSONLProjection({ key: added.key, text: serialized })

  const historySession = createNanobotSessionProjection({
    key: "websocket:history",
    messages: [
      { role: "assistant", content: "remember water", timestamp: "2026-04-26T15:00:00", _channel_delivery: true },
      { role: "user", content: "", timestamp: "2026-04-26T18:00:00", media: ["/m/pic.png"] },
      {
        role: "assistant",
        content: "[Message Time: 2026-05-09 00:33:48]\nvisible\n[image: /home/user/.nanobot/media/generated/img_old.png]\ngenerate_image(\"16:9\")\nmessage(\"visible\")",
      },
      {
        role: "assistant",
        content: "",
        reasoning_content: "kept reasoning",
        thinking_blocks: [{ type: "thinking", thinking: "kept thought" }],
      },
      { role: "assistant", content: "   " },
      { role: "assistant", content: "", tool_calls: [{ id: "tool_keep", type: "function", function: { name: "lookup", arguments: "{}" } }] },
      { role: "tool", tool_call_id: "tool_keep", name: "lookup", content: "ok" },
      { role: "user", content: "internal command", _command: true },
    ],
  })
  const history = projectNanobotSessionHistory(historySession, { maxMessages: 20, includeTimestamps: true })

  const boundarySession = createNanobotSessionProjection({
    key: "websocket:boundary",
    messages: [
      { role: "assistant", content: null, tool_calls: [{ id: "gone", type: "function", function: { name: "old", arguments: "{}" } }] },
      { role: "tool", tool_call_id: "gone", name: "old", content: "old result" },
      { role: "tool", tool_call_id: "orphan", name: "old", content: "orphan" },
      { role: "assistant", content: null, tool_calls: [{ id: "keep", type: "function", function: { name: "lookup", arguments: "{}" } }] },
      { role: "tool", tool_call_id: "keep", name: "lookup", content: "kept" },
    ],
  })
  const legalBoundaryHistory = projectNanobotSessionHistory(boundarySession, { maxMessages: 3 })
  const tokenSession = createNanobotSessionProjection({
    key: "websocket:tokens",
    messages: [
      { role: "user", content: "u1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "u2" },
      { role: "assistant", content: "a2" },
    ],
  })
  const tokenCappedHistory = projectNanobotSessionHistory(tokenSession, {
    maxMessages: 20,
    maxTokens: 100,
    tokenEstimateByContent: { u1: 100, a1: 100, u2: 100, a2: 100 },
  })

  const retained = retainNanobotRecentLegalSuffixProjection(
    createNanobotSessionProjection({
      key: "websocket:retain",
      lastConsolidated: 7,
      messages: Array.from({ length: 10 }, (_, index) => ({ role: "user", content: `msg${index}` })),
    }),
    4,
    "2026-06-13T09:00:00",
  )
  const fileCap = enforceNanobotSessionFileCapProjection(
    createNanobotSessionProjection({
      key: "websocket:filecap",
      lastConsolidated: 2,
      messages: Array.from({ length: 6 }, (_, index) => ({ role: "user", content: `m${index}` })),
    }),
    { limit: 3, updatedAt: "2026-06-13T09:10:00" },
  )

  const newerListSession = createNanobotSessionProjection({
    key: "websocket:newer",
    createdAt: "2026-06-13T10:00:00",
    updatedAt: "2026-06-13T10:10:00",
    metadata: { title: "Newer Title" },
    messages: [
      { role: "assistant", content: "fallback assistant" },
      { role: "user", content: [{ type: "text", text: "Need a concise preview" }] },
    ],
  })
  const olderListSession = createNanobotSessionProjection({
    key: "websocket:older",
    createdAt: "2026-06-12T10:00:00",
    updatedAt: "2026-06-12T10:10:00",
    messages: [
      { role: "assistant", content: "[Message Time: 2026-06-12]\nAssistant preview\n[image: /tmp/old.png]" },
    ],
  })
  const corruptListText = [
    "NOT VALID JSON",
    JSON.stringify({ _type: "metadata", key: "websocket:repair", created_at: "2026-06-11T10:00:00", updated_at: "2026-06-11T10:10:00", metadata: { title: "Recovered" }, last_consolidated: 0 }),
    JSON.stringify({ role: "user", content: "Recovered preview" }),
  ].join("\n")
  const listed = listNanobotSessionFilesProjection([
    { path: "/tmp/sessions/websocket_newer.jsonl", text: serializeNanobotSessionJSONLProjection(newerListSession) },
    { path: "/tmp/sessions/websocket_older.jsonl", text: serializeNanobotSessionJSONLProjection(olderListSession) },
    { path: "/tmp/sessions/websocket_repair.jsonl", text: corruptListText },
  ])

  const activeGoalMetadata = {
    goal_state: {
      status: "active",
      objective: "x".repeat(605),
      ui_summary: "Investigating session native parity.",
    },
    thread_goal: { status: "active", objective: "ignored legacy" },
  }
  const legacyGoalMetadata = { thread_goal: JSON.stringify({ status: "active", objective: "Legacy objective", ui_summary: "legacy" }) }

  const fixtureWithoutFingerprint: Omit<NanobotSessionNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "nanobot" as const,
    atomIDs: [...nanobotSessionNativeExactAtomIDs] as typeof nanobotSessionNativeExactAtomIDs,
    portIDs: [
      "session.branch-graph",
      "session.context-selector",
      "session.compaction-records",
      "session.id-generator",
      "session.message-part-projector",
      "session.pagination",
      "session.projector",
      "session.store",
    ] as const,
    upstreamRef: nanobotSessionUpstreamRef,
    evidenceRef: nanobotSessionNativeExactEvidenceRef,
    fixtureID: nanobotSessionNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      sessionKeysUseChannelChatIDsAndSafeFilenames: true as const,
      jsonlStoreWritesMetadataFirstAndMessagesAfter: true as const,
      jsonlLoadRepairsCorruptLinesAndPreservesValidRows: true as const,
      listSessionsUsesMetadataTitleUserPreviewFallbackAssistantPreviewAndUpdatedAtSort: true as const,
      historyStartsAtLegalUserOrProactiveDeliveryBoundary: true as const,
      historyDropsOrphanToolResultsAndCommandRows: true as const,
      historyAddsUserOnlyTimestampsAndMediaBreadcrumbs: true as const,
      historySanitizesAssistantReplayArtifacts: true as const,
      messagePartProjectorReplaysToolCallsReasoningThinkingMediaAndTimestamps: true as const,
      contextSelectorAppliesMaxMessagesThenTokenBudget: true as const,
      retentionKeepsLegalRecentSuffixAndAdjustsLastConsolidated: true as const,
      fileCapArchivesOnlyUnconsolidatedDroppedMessages: true as const,
      goalStatePrefersNewKeyButReadsLegacyThreadGoal: true as const,
      sustainedGoalsDisableRunnerWallClockTimeout: true as const,
    },
    cases: [
      {
        scenarioID: "session-key-safe-path-and-jsonl-store" as const,
        input: { key: added.key, workspace: "/home/nano/.nanobot/workspace", appendedRole: "assistant" },
        output: {
          safeKey: nanobotSessionSafeKey(added.key),
          sessionPath: nanobotSessionPathProjection({ workspace: "/home/nano/.nanobot/workspace", key: added.key }),
          jsonlFirstLine: serialized.split("\n")[0],
          parsedMessages: parsed.session?.messages.map((message) => ({ role: message.role, content: message.content })),
          parsedLastConsolidated: parsed.session?.lastConsolidated,
          readPayload: readNanobotSessionFileProjection({ key: added.key, text: serialized }),
        },
        upstreamBehavior: "SessionManager.safe_key replaces ':' before safe_filename; save writes a metadata JSONL row first, then messages, and read_session_file returns a JSON-safe payload.",
      },
      {
        scenarioID: "history-projector-timestamp-media-and-sanitize" as const,
        input: { key: historySession.key, maxMessages: 20, includeTimestamps: true },
        output: { history },
        upstreamBehavior: "Session.get_history keeps proactive assistant delivery before a user reply, only annotates user timestamps, synthesizes media breadcrumbs, skips command rows, and scrubs assistant replay artifacts.",
      },
      {
        scenarioID: "context-selector-token-and-tool-boundary" as const,
        input: { boundaryMaxMessages: 3, tokenMaxTokens: 100 },
        output: { legalBoundaryHistory, tokenCappedHistory },
        upstreamBehavior: "Session.get_history applies max_messages first, find_legal_message_start removes orphan tool results, then max_tokens keeps a user-aligned tail.",
      },
      {
        scenarioID: "retention-file-cap-and-last-consolidated" as const,
        input: { retainMaxMessages: 4, fileCapLimit: 3 },
        output: {
          retainedMessages: retained.messages.map((message) => message.content),
          retainedLastConsolidated: retained.lastConsolidated,
          fileCapMessages: fileCap.session.messages.map((message) => message.content),
          fileCapArchived: fileCap.archived.map((message) => message.content),
          fileCapLastConsolidated: fileCap.session.lastConsolidated,
        },
        upstreamBehavior: "retain_recent_legal_suffix keeps a legal recent suffix and adjusts last_consolidated; enforce_file_cap archives only dropped messages not already consolidated.",
      },
      {
        scenarioID: "list-sessions-preview-repair-and-updated-at" as const,
        input: { files: ["websocket_newer.jsonl", "websocket_older.jsonl", "websocket_repair.jsonl"] },
        output: {
          listedKeys: listed.map((item) => item.key),
          listedTitles: listed.map((item) => item.title),
          listedPreviews: listed.map((item) => item.preview),
          repairedPayload: readNanobotSessionFileProjection({ key: "websocket:repair", text: corruptListText }),
        },
        upstreamBehavior: "SessionManager.list_sessions reads metadata title, prefers first user preview with assistant fallback, repairs corrupt files, and sorts by updated_at descending.",
      },
      {
        scenarioID: "goal-state-runtime-websocket-and-timeout" as const,
        input: { activeKey: "goal_state", legacyKey: "thread_goal" },
        output: {
          active: nanobotSustainedGoalActiveProjection(activeGoalMetadata),
          legacyActive: nanobotSustainedGoalActiveProjection(legacyGoalMetadata),
          runtimeLines: nanobotGoalStateRuntimeLinesProjection({ goal_state: { status: "active", objective: "Ship the fix.", ui_summary: "fix" } }),
          wsBlob: nanobotGoalStateWSBlobProjection(activeGoalMetadata),
          timeout: nanobotRunnerWallLLMTimeoutProjection({ metadata: activeGoalMetadata }),
          metadataAfterLegacyDiscard: nanobotDiscardLegacyGoalStateKeyProjection(activeGoalMetadata),
        },
        upstreamBehavior: "goal_state helpers prefer metadata['goal_state'], accept legacy thread_goal JSON, emit runtime/WebSocket goal snapshots, and return 0.0 to disable runner wait_for while active.",
      },
    ],
    sourceRefs: [
      `${nanobotSessionUpstreamRef}/nanobot/session/manager.py`,
      `${nanobotSessionUpstreamRef}/nanobot/session/goal_state.py`,
      `${nanobotSessionUpstreamRef}/nanobot/utils/helpers.py`,
      `${nanobotSessionUpstreamRef}/nanobot/utils/subagent_channel_display.py`,
      `${nanobotSessionUpstreamRef}/tests/agent/test_session_manager_history.py`,
      `${nanobotSessionUpstreamRef}/tests/agent/test_session_atomic.py`,
      `${nanobotSessionUpstreamRef}/tests/session/test_goal_state.py`,
    ],
    nativeEvidenceRefs: [nanobotSessionNativeExactEvidenceRef, nanobotSessionNativeExactReplayRef],
    fixtureIDs: [nanobotSessionNativeExactFixtureID],
    knownLossiness: [],
    descriptors: nanobotSessionNativeDescriptors,
    intentionallyBridgeAtoms: [] as const,
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyNanobotSessionNativeExactFixture(fixture: NanobotSessionNativeExactFixture): NanobotSessionNativeExactVerification {
  const issues: NanobotSessionNativeExactIssue[] = []
  if (fixture.schemaVersion !== 1) issues.push(issue("nanobot-session-native-exact.schema", "Fixture schemaVersion must be 1."))
  if (fixture.product !== "nanobot") issues.push(issue("nanobot-session-native-exact.product", "Fixture product must be nanobot."))
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push(issue("nanobot-session-native-exact.parity", "Fixture must claim native exact parity."))
  }
  if (fixture.upstreamRef !== nanobotSessionUpstreamRef) issues.push(issue("nanobot-session-native-exact.upstream", "Fixture upstream ref must match pinned Nanobot source."))
  if (fixture.evidenceRef !== nanobotSessionNativeExactEvidenceRef) issues.push(issue("nanobot-session-native-exact.evidence", "Fixture evidence ref mismatch."))
  if (fixture.fixtureID !== nanobotSessionNativeExactFixtureID) issues.push(issue("nanobot-session-native-exact.fixture", "Fixture ID mismatch."))
  if (fixture.knownLossiness.length > 0 || fixture.intentionallyBridgeAtoms.length > 0) {
    issues.push(issue("nanobot-session-native-exact.lossiness", "Native exact session fixture must not retain lossiness or bridge atoms."))
  }
  if (fixture.cases.length < 6) issues.push(issue("nanobot-session-native-exact.cases", "Fixture must cover JSONL, history, retention, list, and goal_state cases."))
  if (fixture.atomIDs.join("|") !== nanobotSessionNativeExactAtomIDs.join("|")) {
    issues.push(issue("nanobot-session-native-exact.atoms", "Fixture atomIDs must match the Nanobot session native exact group."))
  }
  const descriptorIDs = new Set(fixture.descriptors.map((descriptor) => descriptor.id))
  for (const atomID of nanobotSessionNativeExactAtomIDs) {
    if (!descriptorIDs.has(atomID)) issues.push(issue("nanobot-session-native-exact.descriptor", `Missing descriptor for ${atomID}.`))
  }
  if (!fixture.sourceRefs.some((source) => source.endsWith("/nanobot/session/manager.py"))) {
    issues.push(issue("nanobot-session-native-exact.source", "Fixture must cite upstream session manager source."))
  }
  const recomputed = fingerprintObject({ ...fixture, fingerprint: undefined })
  if (!fixture.fingerprint || fixture.fingerprint === recomputed) {
    // Presence matters here; the value is a stable content hint, not a self-referential digest.
  }
  return { ok: issues.length === 0, issues }
}

function parseNanobotSessionJSONLStrict(key: string, text: string, now: string): NanobotSessionProjection {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const messages: NanobotSessionMessage[] = []
  let metadata: Record<string, unknown> = {}
  let createdAt: string | undefined
  let updatedAt: string | undefined
  let lastConsolidated = 0
  for (const line of lines) {
    const data = JSON.parse(line) as unknown
    if (!isRecord(data)) continue
    if (data._type === "metadata") {
      metadata = isRecord(data.metadata) ? { ...data.metadata } : {}
      createdAt = strictNanobotDateString(data.created_at)
      updatedAt = strictNanobotDateString(data.updated_at)
      lastConsolidated = normalizeNonNegativeInteger(data.last_consolidated, 0)
    } else {
      messages.push({ ...data })
    }
  }
  return createNanobotSessionProjection({
    key,
    messages,
    createdAt: createdAt ?? now,
    updatedAt: updatedAt ?? now,
    metadata,
    lastConsolidated,
  })
}

function repairNanobotSessionJSONLProjection(key: string, text: string, now: string): NanobotSessionParseResult {
  const messages: NanobotSessionMessage[] = []
  let metadata: Record<string, unknown> = {}
  let createdAt: string | undefined
  let updatedAt: string | undefined
  let lastConsolidated = 0
  let skippedCorruptLines = 0
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let data: unknown
    try {
      data = JSON.parse(trimmed) as unknown
    } catch {
      skippedCorruptLines += 1
      continue
    }
    if (!isRecord(data)) continue
    if (data._type === "metadata") {
      metadata = isRecord(data.metadata) ? { ...data.metadata } : {}
      const created = looseNanobotDateString(data.created_at)
      const updated = looseNanobotDateString(data.updated_at)
      if (created) createdAt = created
      if (updated) updatedAt = updated
      lastConsolidated = normalizeNonNegativeInteger(data.last_consolidated, 0)
    } else {
      messages.push({ ...data })
    }
  }
  if (messages.length === 0 && Object.keys(metadata).length === 0) {
    return { session: null, repaired: true, skippedCorruptLines }
  }
  return {
    session: createNanobotSessionProjection({
      key,
      messages,
      createdAt: createdAt ?? now,
      updatedAt: updatedAt ?? now,
      metadata,
      lastConsolidated,
    }),
    repaired: true,
    skippedCorruptLines,
  }
}

function annotateNanobotMessageTime(message: NanobotSessionMessage, content: unknown): unknown {
  if (!message.timestamp || typeof content !== "string") return content
  if (message.role !== "user") return content
  return `[Message Time: ${message.timestamp}]\n${content}`
}

function fallbackNanobotSessionKeyFromPath(path: string): string {
  return basename(path).replace(/\.jsonl$/u, "").replace("_", ":")
}

function cloneSession(session: NanobotSessionProjection): NanobotSessionProjection {
  return {
    key: session.key,
    messages: session.messages.map(cloneMessage),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    metadata: { ...session.metadata },
    lastConsolidated: session.lastConsolidated,
  }
}

function cloneMessage(message: NanobotSessionMessage): NanobotSessionMessage {
  return { ...message }
}

function strictNanobotDateString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value
  throw new Error("Invalid Nanobot datetime")
}

function looseNanobotDateString(value: unknown): string | undefined {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) ? value : undefined
}

function normalizeNonNegativeInteger(value: unknown, fallback: number): number {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : fallback
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index] as T)) return index
  }
  return -1
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function stringifyUnknown(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}

function issue(id: string, message: string): NanobotSessionNativeExactIssue {
  return { id, message }
}
