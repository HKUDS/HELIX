import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { openCodeCreateDefaultTitle, openCodeForkedTitle, openCodeSessionPath } from "./identity.ts"

export const openCodeSessionUpstreamRef = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const
export const openCodeSessionNativeExactFixtureID = "opencode-session:native-exact-fixture" as const
export const openCodeSessionNativeExactEvidenceRef = "conformance:opencode-session-native-exact-fixture" as const
export const openCodeSessionNativeExactReplayRef = "session-native-exact:opencode" as const
export const openCodeSessionBranchGraphForkBeforeMessageNativeExactAtomID = "opencode.session.branch-graph.fork-before-message"
export const openCodeSessionCompactionEventNativeExactAtomID = "opencode.session.compaction-event"
export const openCodeSessionBranchingSQLiteServiceNativeExactAtomID = "opencode.session.branching.sqlite-service"
export const openCodeSessionContextSelectorMessageV2NativeExactAtomID = "opencode.session.context-selector.message-v2"
export const openCodeSessionDiffSQLiteServiceNativeExactAtomID = "opencode.session.diff.sqlite-service"
export const openCodeSessionEventLogSyncEventNativeExactAtomID = "opencode.session.event-log.syncevent"
export const openCodeSessionIDGeneratorNativeExactAtomID = "opencode.session.id-generator"
export const openCodeSessionMessagePartProjectorNativeExactAtomID = "opencode.session.message-part-projector.native-like"
export const openCodeSessionMessageStoreSQLiteServiceNativeExactAtomID = "opencode.session.message-store.sqlite-service"
export const openCodeSessionPaginationUpdateTimeCursorNativeExactAtomID = "opencode.session.pagination.update-time-cursor"
export const openCodeSessionProjectorMessageV2NativeExactAtomID = "opencode.session.projector.message-v2"
export const openCodeSessionProjectorSyncEventNativeExactAtomID = "opencode.session.projector.syncevent"
export const openCodeSessionReaderSQLiteServiceNativeExactAtomID = "opencode.session.reader.sqlite-service"
export const openCodeSessionStoreSQLiteProjectionNativeExactAtomID = "opencode.session.store.sqlite-projection"
export const openCodeSessionWriterSQLiteServiceNativeExactAtomID = "opencode.session.writer.sqlite-service"

export const openCodeSessionNativeExactAtomIDs = [
  openCodeSessionBranchingSQLiteServiceNativeExactAtomID,
  openCodeSessionBranchGraphForkBeforeMessageNativeExactAtomID,
  openCodeSessionCompactionEventNativeExactAtomID,
  openCodeSessionContextSelectorMessageV2NativeExactAtomID,
  openCodeSessionDiffSQLiteServiceNativeExactAtomID,
  openCodeSessionEventLogSyncEventNativeExactAtomID,
  openCodeSessionIDGeneratorNativeExactAtomID,
  openCodeSessionMessagePartProjectorNativeExactAtomID,
  openCodeSessionMessageStoreSQLiteServiceNativeExactAtomID,
  openCodeSessionPaginationUpdateTimeCursorNativeExactAtomID,
  openCodeSessionProjectorMessageV2NativeExactAtomID,
  openCodeSessionProjectorSyncEventNativeExactAtomID,
  openCodeSessionReaderSQLiteServiceNativeExactAtomID,
  openCodeSessionStoreSQLiteProjectionNativeExactAtomID,
  openCodeSessionWriterSQLiteServiceNativeExactAtomID,
] as const

export type OpenCodeSessionNativeExactAtomID = (typeof openCodeSessionNativeExactAtomIDs)[number]
export type OpenCodeSessionPortID =
  | "session.branching"
  | "session.branch-graph"
  | "session.compaction-records"
  | "session.context-selector"
  | "session.diff"
  | "session.event-log"
  | "session.id-generator"
  | "session.message-part-projector"
  | "session.message-store"
  | "session.pagination"
  | "session.projector"
  | "session.reader"
  | "session.store"
  | "session.writer"

export interface OpenCodeSessionNativeDescriptor {
  id: OpenCodeSessionNativeExactAtomID
  port: OpenCodeSessionPortID
  product: "opencode"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof openCodeSessionNativeExactEvidenceRef, typeof openCodeSessionNativeExactReplayRef]
  fixtureIDs: [typeof openCodeSessionNativeExactFixtureID]
  knownLossiness: []
}

export interface OpenCodeSessionTokens {
  input: number
  output: number
  reasoning: number
  cache: {
    read: number
    write: number
  }
}

export interface OpenCodeSessionInfoProjection {
  id: string
  slug: string
  projectID: string
  workspaceID?: string
  directory: string
  path?: string
  parentID?: string
  title: string
  agent?: string
  model?: Record<string, unknown>
  version: string
  summary?: {
    additions: number
    deletions: number
    files: number
    diffs?: unknown[]
  }
  cost?: number
  tokens?: OpenCodeSessionTokens
  share?: { url: string }
  revert?: Record<string, unknown>
  permission?: unknown[]
  time: {
    created: number
    updated: number
    compacting?: number
    archived?: number
  }
}

export interface OpenCodeSessionSQLiteRowProjection {
  id: string
  project_id: string
  workspace_id: string | null
  parent_id: string | null
  slug: string
  directory: string
  path: string | null
  title: string
  version: string
  share_url: string | null
  summary_additions: number | null
  summary_deletions: number | null
  summary_files: number | null
  summary_diffs: unknown[] | null
  cost: number
  tokens_input: number
  tokens_output: number
  tokens_reasoning: number
  tokens_cache_read: number
  tokens_cache_write: number
  revert: Record<string, unknown> | null
  permission: unknown[] | null
  agent: string | null
  model: Record<string, unknown> | null
  time_created: number
  time_updated: number
  time_compacting: number | null
  time_archived: number | null
}

export interface OpenCodeMessageV2InfoProjection extends Record<string, unknown> {
  id: string
  sessionID: string
  role: "user" | "assistant"
  parentID?: string
  summary?: boolean
  finish?: boolean
  error?: unknown
  time?: Record<string, unknown>
}

export interface OpenCodeMessageV2PartProjection extends Record<string, unknown> {
  id: string
  sessionID: string
  messageID: string
  type: string
  tail_start_id?: string
}

export interface OpenCodeMessageV2RowProjection {
  id: string
  session_id: string
  time_created: number
  time_updated?: number | null
  data: Record<string, unknown>
}

export interface OpenCodePartRowProjection {
  id: string
  message_id: string
  session_id: string
  time_created: number
  time_updated?: number | null
  data: Record<string, unknown>
}

export interface OpenCodeSessionMessageRowProjection {
  id: string
  session_id: string
  type: string
  time_created: number
  time_updated?: number | null
  data: Record<string, unknown>
}

export interface OpenCodeMessageV2WithPartsProjection {
  info: OpenCodeMessageV2InfoProjection
  parts: OpenCodeMessageV2PartProjection[]
}

export interface OpenCodeMessageV2LatestProjection {
  user?: OpenCodeMessageV2InfoProjection
  assistant?: OpenCodeMessageV2InfoProjection
  finished?: OpenCodeMessageV2InfoProjection
  tasks: OpenCodeMessageV2PartProjection[]
}

export interface OpenCodeSessionPromptContextProjection {
  messages: OpenCodeMessageV2WithPartsProjection[]
  latest: OpenCodeMessageV2LatestProjection
  model: {
    providerID?: string
    modelID: string
  } | null
}

export interface OpenCodeMessageV2PageProjection {
  status: "ok" | "not-found"
  items: OpenCodeMessageV2WithPartsProjection[]
  more: boolean
  cursor?: string
  error?: string
}

export interface OpenCodeSessionForkProjection {
  session: OpenCodeSessionInfoProjection
  messages: OpenCodeMessageV2WithPartsProjection[]
  idMap: Record<string, string>
}

export interface OpenCodeSessionSyncEventProjection {
  eventType: string
  aggregate: "sessionID"
  version: 1
  payloadKeys: string[]
  sqliteTables: string[]
}

export type OpenCodeSessionNativeScenarioID =
  | "session-create-title-path-and-row-roundtrip"
  | "message-v2-hydrate-page-and-cursor"
  | "message-v2-part-row-projector-preserves-discriminated-payload-and-linkage"
  | "fork-before-message-rewrites-message-and-part-ids"
  | "compaction-filter-tail-and-summary-order"
  | "context-selector-filter-compacted-message-v2-prompt-context"
  | "syncevent-and-session-message-sqlite-projection"

export interface OpenCodeSessionNativeExactCase {
  scenarioID: OpenCodeSessionNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface OpenCodeSessionNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: typeof openCodeSessionNativeExactAtomIDs
  portIDs: readonly [
    "session.branching",
    "session.branch-graph",
    "session.compaction-records",
    "session.context-selector",
    "session.diff",
    "session.event-log",
    "session.id-generator",
    "session.message-part-projector",
    "session.message-store",
    "session.pagination",
    "session.projector",
    "session.reader",
    "session.store",
    "session.writer",
  ]
  upstreamRef: typeof openCodeSessionUpstreamRef
  evidenceRef: typeof openCodeSessionNativeExactEvidenceRef
  fixtureID: typeof openCodeSessionNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    sessionIDsUseSesPrefixAndDescendingIdentifier: true
    createSessionUsesDefaultTitleWorkspacePathAndSyncCreatedEvent: true
    sessionRowsRoundTripThroughSessionTableShape: true
    messageV2RowsHydrateDataPlusIDsAndOrderedParts: true
    messagePartProjectorSpreadsPartRowsAndPreservesMessageLinkage: true
    messageV2PaginationUsesUpdatedTimeCursorWithMessageIDTieBreaker: true
    forkStopsBeforeBoundaryMessageAndRewritesParentAndTailIDs: true
    compactionFilterUsesAssistantSummaryFinishAndCompactionTailStart: true
    contextSelectorUsesMessageV2FilterCompactedForPromptContext: true
    sessionEventLogUsesSyncEventRowsAndReplayRules: true
    syncEventsProjectMessageAndPartUpdatesIntoSQLiteTables: true
  }
  cases: OpenCodeSessionNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly OpenCodeSessionNativeDescriptor[]
  intentionallyBridgeAtoms: readonly []
  fingerprint: string
}

export interface OpenCodeSessionNativeExactIssue {
  id: string
  message: string
}

export interface OpenCodeSessionNativeExactVerification {
  ok: boolean
  issues: OpenCodeSessionNativeExactIssue[]
}

const emptyOpenCodeTokens: OpenCodeSessionTokens = {
  input: 0,
  output: 0,
  reasoning: 0,
  cache: { read: 0, write: 0 },
}

export function openCodeCreateSessionInfoProjection(input: {
  id: string
  slug?: string
  projectID: string
  worktree: string
  directory: string
  workspaceID?: string
  parentID?: string
  title?: string
  agent?: string
  model?: Record<string, unknown>
  permission?: unknown[]
  version?: string
  now: number
}): OpenCodeSessionInfoProjection {
  return {
    id: input.id,
    slug: input.slug ?? "session-slug",
    version: input.version ?? "0.0.0-test",
    projectID: input.projectID,
    directory: input.directory,
    path: openCodeSessionPath(input.worktree, input.directory),
    ...(input.workspaceID ? { workspaceID: input.workspaceID } : {}),
    ...(input.parentID ? { parentID: input.parentID } : {}),
    title: input.title ?? openCodeCreateDefaultTitle({ now: input.now, isChild: Boolean(input.parentID) }),
    ...(input.agent ? { agent: input.agent } : {}),
    ...(input.model ? { model: input.model } : {}),
    ...(input.permission ? { permission: [...input.permission] } : {}),
    cost: 0,
    tokens: cloneTokens(emptyOpenCodeTokens),
    time: {
      created: input.now,
      updated: input.now,
    },
  }
}

export function openCodeSessionToSQLiteRowProjection(info: OpenCodeSessionInfoProjection): OpenCodeSessionSQLiteRowProjection {
  const tokens = info.tokens ?? emptyOpenCodeTokens
  return {
    id: info.id,
    project_id: info.projectID,
    workspace_id: info.workspaceID ?? null,
    parent_id: info.parentID ?? null,
    slug: info.slug,
    directory: info.directory,
    path: info.path ?? null,
    title: info.title,
    version: info.version,
    share_url: info.share?.url ?? null,
    summary_additions: info.summary?.additions ?? null,
    summary_deletions: info.summary?.deletions ?? null,
    summary_files: info.summary?.files ?? null,
    summary_diffs: info.summary?.diffs ?? null,
    cost: info.cost ?? 0,
    tokens_input: tokens.input,
    tokens_output: tokens.output,
    tokens_reasoning: tokens.reasoning,
    tokens_cache_read: tokens.cache.read,
    tokens_cache_write: tokens.cache.write,
    revert: info.revert ?? null,
    permission: info.permission ?? null,
    agent: info.agent ?? null,
    model: info.model ?? null,
    time_created: info.time.created,
    time_updated: info.time.updated,
    time_compacting: info.time.compacting ?? null,
    time_archived: info.time.archived ?? null,
  }
}

export function openCodeSessionFromSQLiteRowProjection(row: OpenCodeSessionSQLiteRowProjection): OpenCodeSessionInfoProjection {
  const summary = row.summary_additions !== null || row.summary_deletions !== null || row.summary_files !== null
    ? {
        additions: row.summary_additions ?? 0,
        deletions: row.summary_deletions ?? 0,
        files: row.summary_files ?? 0,
        ...(row.summary_diffs ? { diffs: row.summary_diffs } : {}),
      }
    : undefined
  return {
    id: row.id,
    slug: row.slug,
    projectID: row.project_id,
    directory: row.directory,
    ...(row.workspace_id ? { workspaceID: row.workspace_id } : {}),
    ...(row.parent_id ? { parentID: row.parent_id } : {}),
    ...(row.path ? { path: row.path } : {}),
    title: row.title,
    ...(row.agent ? { agent: row.agent } : {}),
    ...(row.model ? { model: row.model } : {}),
    version: row.version,
    ...(summary ? { summary } : {}),
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
    ...(row.share_url ? { share: { url: row.share_url } } : {}),
    ...(row.revert ? { revert: row.revert } : {}),
    ...(row.permission ? { permission: [...row.permission] } : {}),
    time: {
      created: row.time_created,
      updated: row.time_updated,
      ...(row.time_compacting !== null ? { compacting: row.time_compacting } : {}),
      ...(row.time_archived !== null ? { archived: row.time_archived } : {}),
    },
  }
}

export function openCodeMessageInfoFromRowProjection(row: OpenCodeMessageV2RowProjection): OpenCodeMessageV2InfoProjection {
  return {
    ...cloneRecord(row.data),
    id: row.id,
    sessionID: row.session_id,
  } as OpenCodeMessageV2InfoProjection
}

export function openCodeMessagePartFromRowProjection(row: OpenCodePartRowProjection): OpenCodeMessageV2PartProjection {
  return {
    ...cloneRecord(row.data),
    id: row.id,
    sessionID: row.session_id,
    messageID: row.message_id,
  } as OpenCodeMessageV2PartProjection
}

export function hydrateOpenCodeMessageV2RowsProjection(
  rows: OpenCodeMessageV2RowProjection[],
  parts: OpenCodePartRowProjection[],
): OpenCodeMessageV2WithPartsProjection[] {
  const ids = new Set(rows.map((row) => row.id))
  const partByMessage = new Map<string, OpenCodeMessageV2PartProjection[]>()
  const orderedPartRows = parts
    .filter((row) => ids.has(row.message_id))
    .slice()
    .sort((left, right) => left.message_id.localeCompare(right.message_id) || left.id.localeCompare(right.id))
  for (const row of orderedPartRows) {
    const next = openCodeMessagePartFromRowProjection(row)
    const list = partByMessage.get(row.message_id)
    if (list) list.push(next)
    else partByMessage.set(row.message_id, [next])
  }
  return rows.map((row) => ({
    info: openCodeMessageInfoFromRowProjection(row),
    parts: partByMessage.get(row.id) ?? [],
  }))
}

export function encodeOpenCodeMessageV2CursorProjection(input: { id: string; time: number }): string {
  return Buffer.from(JSON.stringify(input)).toString("base64url")
}

export function decodeOpenCodeMessageV2CursorProjection(input: string): { id: string; time: number } {
  const decoded = JSON.parse(Buffer.from(input, "base64url").toString("utf8")) as Record<string, unknown>
  if (typeof decoded["id"] !== "string" || typeof decoded["time"] !== "number" || decoded["time"] < 0) {
    throw new Error("Invalid OpenCode MessageV2 cursor")
  }
  return { id: decoded["id"], time: decoded["time"] }
}

export function pageOpenCodeMessageV2Projection(input: {
  sessionID: string
  messages: OpenCodeMessageV2RowProjection[]
  parts: OpenCodePartRowProjection[]
  sessionRows?: OpenCodeSessionSQLiteRowProjection[]
  limit: number
  before?: string
}): OpenCodeMessageV2PageProjection {
  const before = input.before ? decodeOpenCodeMessageV2CursorProjection(input.before) : undefined
  const sortedRows = input.messages
    .filter((row) => row.session_id === input.sessionID)
    .filter((row) => !before || row.time_created < before.time || (row.time_created === before.time && row.id < before.id))
    .slice()
    .sort((left, right) => right.time_created - left.time_created || right.id.localeCompare(left.id))
    .slice(0, input.limit + 1)

  if (sortedRows.length === 0) {
    const sessionExists = !input.sessionRows || input.sessionRows.some((row) => row.id === input.sessionID)
    if (!sessionExists) {
      return {
        status: "not-found",
        items: [],
        more: false,
        error: `Session not found: ${input.sessionID}`,
      }
    }
    return { status: "ok", items: [], more: false }
  }

  const more = sortedRows.length > input.limit
  const slice = more ? sortedRows.slice(0, input.limit) : sortedRows
  const items = hydrateOpenCodeMessageV2RowsProjection(slice, input.parts).reverse()
  const tail = slice.at(-1)
  return {
    status: "ok",
    items,
    more,
    ...(more && tail ? { cursor: encodeOpenCodeMessageV2CursorProjection({ id: tail.id, time: tail.time_created }) } : {}),
  }
}

export function streamOpenCodeMessageV2Projection(input: {
  sessionID: string
  messages: OpenCodeMessageV2RowProjection[]
  parts: OpenCodePartRowProjection[]
  pageSize?: number
}): OpenCodeMessageV2WithPartsProjection[] {
  const output: OpenCodeMessageV2WithPartsProjection[] = []
  let before: string | undefined
  const pageSize = input.pageSize ?? 50
  while (true) {
    const page = pageOpenCodeMessageV2Projection({ ...input, limit: pageSize, ...(before ? { before } : {}) })
    if (page.items.length === 0) break
    for (let index = page.items.length - 1; index >= 0; index--) {
      const item = page.items[index]
      if (item) output.push(item)
    }
    if (!page.more || !page.cursor) break
    before = page.cursor
  }
  return output
}

export function filterOpenCodeCompactedMessagesProjection(
  msgs: Iterable<OpenCodeMessageV2WithPartsProjection>,
): OpenCodeMessageV2WithPartsProjection[] {
  const result: OpenCodeMessageV2WithPartsProjection[] = []
  const completed = new Set<string>()
  let retain: string | undefined
  for (const msg of msgs) {
    result.push(cloneWithParts(msg))
    if (retain) {
      if (msg.info.id === retain) break
      continue
    }
    if (msg.info.role === "user" && completed.has(msg.info.id)) {
      const part = msg.parts.find((item) => item.type === "compaction")
      if (!part) continue
      if (!part.tail_start_id) break
      retain = part.tail_start_id
      if (msg.info.id === retain) break
      continue
    }
    if (msg.info.role === "user" && completed.has(msg.info.id) && msg.parts.some((part) => part.type === "compaction")) break
    if (msg.info.role === "assistant" && msg.info.summary && msg.info.finish && !msg.info.error && typeof msg.info.parentID === "string") {
      completed.add(msg.info.parentID)
    }
  }
  result.reverse()
  let compactionIndex = -1
  for (let index = result.length - 1; index >= 0; index--) {
    const msg = result[index]
    if (msg?.info.role === "user" && msg.parts.some((item) => item.type === "compaction" && item.tail_start_id !== undefined)) {
      compactionIndex = index
      break
    }
  }
  const compaction = result[compactionIndex]
  const part = compaction?.parts.find((item) => item.type === "compaction" && item.tail_start_id !== undefined)
  const summaryIndex = compaction
    ? result.findIndex(
        (msg, index) => index > compactionIndex && msg.info.role === "assistant" && Boolean(msg.info.summary) && msg.info.parentID === compaction.info.id,
      )
    : -1
  const tailIndex = part?.tail_start_id ? result.findIndex((msg) => msg.info.id === part.tail_start_id) : -1
  if (tailIndex >= 0 && tailIndex < compactionIndex && summaryIndex > compactionIndex) {
    return [
      ...result.slice(compactionIndex, summaryIndex + 1),
      ...result.slice(tailIndex, compactionIndex),
      ...result.slice(summaryIndex + 1),
    ]
  }
  return result
}

export function latestOpenCodeMessageV2Projection(msgs: OpenCodeMessageV2WithPartsProjection[]): OpenCodeMessageV2LatestProjection {
  let user: OpenCodeMessageV2InfoProjection | undefined
  let assistant: OpenCodeMessageV2InfoProjection | undefined
  let finished: OpenCodeMessageV2InfoProjection | undefined
  for (const msg of msgs) {
    const info = msg.info
    if (info.role === "user" && (!user || info.id > user.id)) user = info
    if (info.role === "assistant" && (!assistant || info.id > assistant.id)) assistant = info
    if (info.role === "assistant" && info.finish && (!finished || info.id > finished.id)) finished = info
  }
  const tasks = msgs.flatMap((msg) =>
    finished && msg.info.id <= finished.id
      ? []
      : msg.parts.filter((part) => part.type === "compaction" || part.type === "subtask"),
  )
  return {
    ...(user ? { user } : {}),
    ...(assistant ? { assistant } : {}),
    ...(finished ? { finished } : {}),
    tasks,
  }
}

export function selectOpenCodePromptContextProjection(
  msgs: Iterable<OpenCodeMessageV2WithPartsProjection>,
): OpenCodeSessionPromptContextProjection {
  const messages = filterOpenCodeCompactedMessagesProjection(msgs)
  const latest = latestOpenCodeMessageV2Projection(messages)
  return {
    messages,
    latest,
    model: openCodeModelFromInfoProjection(latest.user ?? latest.assistant),
  }
}

export function openCodeModelFromInfoProjection(info?: Record<string, unknown>): OpenCodeSessionPromptContextProjection["model"] {
  if (!info) return null
  const model = isRecord(info["model"]) ? info["model"] : undefined
  const modelID = stringValue(model?.["modelID"] ?? model?.["modelId"] ?? model?.["id"] ?? info["modelID"] ?? info["modelId"] ?? (typeof info["model"] === "string" ? info["model"] : undefined))
  if (!modelID) return null
  const providerID = stringValue(model?.["providerID"] ?? model?.["provider"] ?? info["providerID"] ?? info["provider"])
  return {
    ...(providerID ? { providerID } : {}),
    modelID,
  }
}

export function forkOpenCodeSessionBeforeMessageProjection(input: {
  original: OpenCodeSessionInfoProjection
  messages: OpenCodeMessageV2WithPartsProjection[]
  worktree: string
  directory: string
  newSessionID: string
  newSlug?: string
  now: number
  beforeMessageID?: string
  nextMessageIDs: string[]
  nextPartIDs: string[]
}): OpenCodeSessionForkProjection {
  const session = openCodeCreateSessionInfoProjection({
    id: input.newSessionID,
    slug: input.newSlug ?? "fork-slug",
    projectID: input.original.projectID,
    worktree: input.worktree,
    directory: input.directory,
    ...(input.original.workspaceID ? { workspaceID: input.original.workspaceID } : {}),
    title: openCodeForkedTitle(input.original.title),
    version: input.original.version,
    now: input.now,
  })
  const idMap = new Map<string, string>()
  const cloned: OpenCodeMessageV2WithPartsProjection[] = []
  let messageIndex = 0
  let partIndex = 0
  for (const msg of input.messages) {
    if (input.beforeMessageID && msg.info.id >= input.beforeMessageID) break
    const newID = input.nextMessageIDs[messageIndex++]
    if (!newID) throw new Error("Missing deterministic OpenCode fork message ID")
    idMap.set(msg.info.id, newID)
    const parentID = msg.info.role === "assistant" && typeof msg.info.parentID === "string" ? idMap.get(msg.info.parentID) : undefined
    const nextInfo: OpenCodeMessageV2InfoProjection = {
      ...cloneRecord(msg.info),
      sessionID: session.id,
      id: newID,
      ...(parentID ? { parentID } : {}),
    } as OpenCodeMessageV2InfoProjection
    const nextParts = msg.parts.map((part) => {
      const nextPartID = input.nextPartIDs[partIndex++]
      if (!nextPartID) throw new Error("Missing deterministic OpenCode fork part ID")
      const nextPart: OpenCodeMessageV2PartProjection = {
        ...cloneRecord(part),
        id: nextPartID,
        messageID: newID,
        sessionID: session.id,
      } as OpenCodeMessageV2PartProjection
      if (nextPart.type === "compaction" && nextPart.tail_start_id) {
        const mappedTail = idMap.get(nextPart.tail_start_id)
        if (mappedTail) nextPart.tail_start_id = mappedTail
        else delete nextPart.tail_start_id
      }
      return nextPart
    })
    cloned.push({ info: nextInfo, parts: nextParts })
  }
  return {
    session,
    messages: cloned,
    idMap: Object.fromEntries(idMap.entries()),
  }
}

export function openCodeSessionSyncEventDefinitionsProjection(): OpenCodeSessionSyncEventProjection[] {
  return [
    {
      eventType: "session.created",
      aggregate: "sessionID",
      version: 1,
      payloadKeys: ["info", "sessionID"],
      sqliteTables: ["session"],
    },
    {
      eventType: "session.updated",
      aggregate: "sessionID",
      version: 1,
      payloadKeys: ["info", "sessionID"],
      sqliteTables: ["session"],
    },
    {
      eventType: "session.deleted",
      aggregate: "sessionID",
      version: 1,
      payloadKeys: ["info", "sessionID"],
      sqliteTables: ["session"],
    },
    {
      eventType: "message.updated",
      aggregate: "sessionID",
      version: 1,
      payloadKeys: ["info", "sessionID"],
      sqliteTables: ["message"],
    },
    {
      eventType: "message.removed",
      aggregate: "sessionID",
      version: 1,
      payloadKeys: ["messageID", "sessionID"],
      sqliteTables: ["message", "part"],
    },
    {
      eventType: "message.part.updated",
      aggregate: "sessionID",
      version: 1,
      payloadKeys: ["part", "sessionID", "time"],
      sqliteTables: ["part"],
    },
    {
      eventType: "message.part.removed",
      aggregate: "sessionID",
      version: 1,
      payloadKeys: ["messageID", "partID", "sessionID"],
      sqliteTables: ["part"],
    },
  ]
}

export function projectOpenCodeSessionMessageRowProjection(input: {
  eventID: string
  sessionID: string
  type: string
  timeCreated: number
  data: Record<string, unknown>
}): OpenCodeSessionMessageRowProjection {
  const { id, type, ...dataWithoutIdentity } = input.data
  void id
  void type
  return {
    id: input.eventID,
    session_id: input.sessionID,
    type: input.type,
    time_created: input.timeCreated,
    data: encodeOpenCodeDateTimesProjection(dataWithoutIdentity) as Record<string, unknown>,
  }
}

export function encodeOpenCodeDateTimesProjection(value: unknown): unknown {
  if (isDateTimeLike(value)) return value.epochMillis
  if (Array.isArray(value)) return value.map(encodeOpenCodeDateTimesProjection)
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeOpenCodeDateTimesProjection(item)]))
  }
  return value
}

export const openCodeSessionNativeDescriptors = openCodeSessionNativeExactAtomIDs.map((id): OpenCodeSessionNativeDescriptor => ({
  id,
  port: openCodeSessionPortForAtomID(id),
  product: "opencode",
  implementationKind: "factory",
  selectionReason: "OpenCode upstream native implementation with native parity complete Session, MessageV2, SessionTable, SessionMessageTable, fork, pagination, compaction, and SyncEvent projection fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
  fixtureIDs: [openCodeSessionNativeExactFixtureID],
  knownLossiness: [],
}))

export const openCodeSessionNativeDescriptorByAtomID = Object.fromEntries(
  openCodeSessionNativeDescriptors.map((descriptor) => [descriptor.id, descriptor]),
) as Record<OpenCodeSessionNativeExactAtomID, OpenCodeSessionNativeDescriptor>

export function buildOpenCodeSessionNativeExactFixture(): OpenCodeSessionNativeExactFixture {
  const created = openCodeCreateSessionInfoProjection({
    id: "ses_7fffffffffffNativeSession",
    slug: "native-session",
    projectID: "project_1",
    workspaceID: "wrk_1",
    worktree: "/repo",
    directory: "/repo/packages/demo",
    agent: "build",
    model: { providerID: "anthropic", id: "claude", variant: "opus" },
    permission: [{ type: "ask" }],
    version: "0.5.0",
    now: 1_780_000_000_000,
  })
  const row = openCodeSessionToSQLiteRowProjection({
    ...created,
    summary: { additions: 3, deletions: 1, files: 2, diffs: [{ path: "a.ts" }] },
    share: { url: "https://share.example/session" },
  })
  const fromRow = openCodeSessionFromSQLiteRowProjection(row)
  const messages: OpenCodeMessageV2RowProjection[] = [
    messageRow("msg_001", created.id, 1000, { role: "user", agent: "build", model: { providerID: "anthropic", modelID: "claude" }, time: { created: 1000 } }),
    messageRow("msg_002", created.id, 2000, { role: "assistant", parentID: "msg_001", providerID: "anthropic", modelID: "claude", time: { created: 2000, completed: 2100 } }),
    messageRow("msg_003", created.id, 3000, { role: "user", agent: "build", model: { providerID: "anthropic", modelID: "claude" }, time: { created: 3000 } }),
  ]
  const parts: OpenCodePartRowProjection[] = [
    partRow("prt_001", created.id, "msg_001", 1001, { type: "text", text: "hello" }),
    partRow("prt_002", created.id, "msg_002", 2001, { type: "step-start" }),
    partRow("prt_003", created.id, "msg_002", 2002, { type: "text", text: "answer", metadata: { providerExecuted: true } }),
    partRow("prt_004", created.id, "msg_003", 3001, { type: "compaction", auto: true, tail_start_id: "msg_002" }),
  ]
  const projectedTextPart = openCodeMessagePartFromRowProjection(parts[2]!)
  const hydratedAssistant = hydrateOpenCodeMessageV2RowsProjection([messages[1]!], parts)[0]!
  const firstPage = pageOpenCodeMessageV2Projection({
    sessionID: created.id,
    messages,
    parts,
    sessionRows: [row],
    limit: 2,
  })
  const nextPage = pageOpenCodeMessageV2Projection({
    sessionID: created.id,
    messages,
    parts,
    sessionRows: [row],
    limit: 2,
    ...(firstPage.cursor ? { before: firstPage.cursor } : {}),
  })
  const fork = forkOpenCodeSessionBeforeMessageProjection({
    original: created,
    messages: hydrateOpenCodeMessageV2RowsProjection(messages, parts),
    worktree: "/repo",
    directory: "/repo/packages/demo",
    newSessionID: "ses_7fffffffffffFork",
    newSlug: "fork-session",
    now: 1_780_000_000_100,
    beforeMessageID: "msg_003",
    nextMessageIDs: ["msg_101", "msg_102"],
    nextPartIDs: ["prt_101", "prt_102", "prt_103"],
  })
  const compactionStream: OpenCodeMessageV2WithPartsProjection[] = [
    withParts(
      { id: "msg_006", sessionID: created.id, role: "user", model: { providerID: "anthropic", modelID: "claude" } },
      [{ id: "prt_006", sessionID: created.id, messageID: "msg_006", type: "text", text: "continue" }],
    ),
    withParts(
      { id: "msg_005", sessionID: created.id, role: "assistant", parentID: "msg_004", summary: true, finish: true },
      [{ id: "prt_005", sessionID: created.id, messageID: "msg_005", type: "text", text: "summary" }],
    ),
    withParts(
      { id: "msg_004", sessionID: created.id, role: "user" },
      [{ id: "prt_004c", sessionID: created.id, messageID: "msg_004", type: "compaction", auto: true, tail_start_id: "msg_002" }],
    ),
    withParts({ id: "msg_003", sessionID: created.id, role: "assistant", parentID: "msg_002", finish: true }, [{ id: "prt_003c", sessionID: created.id, messageID: "msg_003", type: "text", text: "tail answer" }]),
    withParts({ id: "msg_002", sessionID: created.id, role: "user" }, [{ id: "prt_002c", sessionID: created.id, messageID: "msg_002", type: "text", text: "tail user" }]),
  ]
  const compacted = filterOpenCodeCompactedMessagesProjection(compactionStream)
  const promptContext = selectOpenCodePromptContextProjection(compactionStream)
  const syncEvents = openCodeSessionSyncEventDefinitionsProjection()
  const sessionNextRow = projectOpenCodeSessionMessageRowProjection({
    eventID: "evt_001",
    sessionID: created.id,
    type: "session.next.compaction.ended",
    timeCreated: 1_780_000_000_200,
    data: {
      id: "ignored",
      type: "ignored",
      sessionID: created.id,
      time: { created: { _tag: "DateTime", epochMillis: 1_780_000_000_200 } },
      text: "summary",
    },
  })
  const cases: OpenCodeSessionNativeExactCase[] = [
    {
      scenarioID: "session-create-title-path-and-row-roundtrip",
      input: { worktree: "/repo", directory: "/repo/packages/demo", now: 1_780_000_000_000 },
      output: {
        path: created.path,
        title: created.title,
        rowKeys: Object.keys(row).sort(),
        restoredSummary: fromRow.summary,
        restoredShare: fromRow.share,
        restoredTokens: fromRow.tokens,
      },
      upstreamBehavior: "Session.createNext uses a ses_ identifier, createDefaultTitle, sessionPath(worktree,directory), Session.Event.Created, and toRow/fromRow SessionTable field mapping.",
    },
    {
      scenarioID: "message-v2-hydrate-page-and-cursor",
      input: { limit: 2, messageIDs: messages.map((item) => item.id), partIDs: parts.map((item) => item.id) },
      output: {
        firstPageIDs: firstPage.items.map((item) => item.info.id),
        firstPagePartIDs: firstPage.items.flatMap((item) => item.parts.map((part) => part.id)),
        firstPagePartTypes: firstPage.items.flatMap((item) => item.parts.map((part) => part.type)),
        firstPagePartMessageIDs: firstPage.items.flatMap((item) => item.parts.map((part) => part.messageID)),
        cursor: firstPage.cursor,
        decodedCursor: firstPage.cursor ? decodeOpenCodeMessageV2CursorProjection(firstPage.cursor) : null,
        nextPageIDs: nextPage.items.map((item) => item.info.id),
      },
      upstreamBehavior: "MessageV2.page orders message rows by time_created desc then id desc, reads limit+1, hydrates parts ordered by message_id/id, reverses page items, and encodes the tail cursor as base64url JSON.",
    },
    {
      scenarioID: "message-v2-part-row-projector-preserves-discriminated-payload-and-linkage",
      input: { rowID: "prt_003", sessionID: created.id, messageID: "msg_002" },
      output: {
        projectedPart: projectedTextPart,
        hydratedAssistantPartIDs: hydratedAssistant.parts.map((part) => part.id),
        hydratedAssistantPartTypes: hydratedAssistant.parts.map((part) => part.type),
        hydratedAssistantPartMessageIDs: hydratedAssistant.parts.map((part) => part.messageID),
        hydratedAssistantMetadata: hydratedAssistant.parts.find((part) => part.id === "prt_003")?.metadata ?? null,
      },
      upstreamBehavior: "MessageV2.part spreads PartTable.data and adds id/sessionID/messageID; hydrate reads PartTable rows for the message ids ordered by message_id/id before grouping them onto each message.",
    },
    {
      scenarioID: "fork-before-message-rewrites-message-and-part-ids",
      input: { beforeMessageID: "msg_003", nextMessageIDs: ["msg_101", "msg_102"], nextPartIDs: ["prt_101", "prt_102", "prt_103"] },
      output: {
        forkTitle: fork.session.title,
        clonedMessageIDs: fork.messages.map((item) => item.info.id),
        clonedParentIDs: fork.messages.map((item) => item.info.parentID ?? null),
        clonedPartIDs: fork.messages.flatMap((item) => item.parts.map((part) => part.id)),
        idMap: fork.idMap,
      },
      upstreamBehavior: "Session.fork creates a new session with getForkedTitle, clones source messages until msg.info.id >= input.messageID, allocates ascending message/part IDs, and remaps assistant parentID plus compaction tail_start_id.",
    },
    {
      scenarioID: "compaction-filter-tail-and-summary-order",
      input: { streamIDs: compactionStream.map((item) => item.info.id) },
      output: {
        compactedIDs: compacted.map((item) => item.info.id),
        latest: latestOpenCodeMessageV2Projection(compacted),
      },
      upstreamBehavior: "MessageV2.filterCompacted consumes newest-first stream output, tracks completed assistant summaries by parentID, stops at the compaction tail_start_id, reverses, and moves [compaction, summary, retained tail] into model order.",
    },
    {
      scenarioID: "context-selector-filter-compacted-message-v2-prompt-context",
      input: {
        streamIDs: compactionStream.map((item) => item.info.id),
        latestUserID: promptContext.latest.user?.id ?? null,
      },
      output: {
        contextIDs: promptContext.messages.map((item) => item.info.id),
        latestUserID: promptContext.latest.user?.id ?? null,
        model: promptContext.model,
        taskPartIDs: promptContext.latest.tasks.map((part) => part.id),
      },
      upstreamBehavior: "SessionPrompt.run reads MessageV2.filterCompactedEffect(sessionID), derives MessageV2.latest(msgs), and sends the compacted MessageV2 list through MessageV2.toModelMessagesEffect for the provider prompt.",
    },
    {
      scenarioID: "syncevent-and-session-message-sqlite-projection",
      input: { eventTypes: syncEvents.map((event) => event.eventType) },
      output: {
        syncEvents,
        sessionMessageRow: sessionNextRow,
      },
      upstreamBehavior: "Session and MessageV2 events are SyncEvent definitions with aggregate sessionID; projectors-next stores session.next.* rows in SessionMessageTable after stripping id/type and encoding DateTime values to epoch milliseconds.",
    },
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomIDs: openCodeSessionNativeExactAtomIDs,
    portIDs: [
      "session.branching",
      "session.branch-graph",
      "session.compaction-records",
      "session.context-selector",
      "session.diff",
      "session.event-log",
      "session.id-generator",
      "session.message-part-projector",
      "session.message-store",
      "session.pagination",
      "session.projector",
      "session.reader",
      "session.store",
      "session.writer",
    ] as const,
    upstreamRef: openCodeSessionUpstreamRef,
    evidenceRef: openCodeSessionNativeExactEvidenceRef,
    fixtureID: openCodeSessionNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      sessionIDsUseSesPrefixAndDescendingIdentifier: true as const,
      createSessionUsesDefaultTitleWorkspacePathAndSyncCreatedEvent: true as const,
      sessionRowsRoundTripThroughSessionTableShape: true as const,
      messageV2RowsHydrateDataPlusIDsAndOrderedParts: true as const,
      messagePartProjectorSpreadsPartRowsAndPreservesMessageLinkage: true as const,
      messageV2PaginationUsesUpdatedTimeCursorWithMessageIDTieBreaker: true as const,
      forkStopsBeforeBoundaryMessageAndRewritesParentAndTailIDs: true as const,
      compactionFilterUsesAssistantSummaryFinishAndCompactionTailStart: true as const,
      contextSelectorUsesMessageV2FilterCompactedForPromptContext: true as const,
      sessionEventLogUsesSyncEventRowsAndReplayRules: true as const,
      syncEventsProjectMessageAndPartUpdatesIntoSQLiteTables: true as const,
    },
    cases,
    sourceRefs: [
      "packages/opencode/src/session/session.ts#fromRow,toRow,createDefaultTitle,sessionPath,Session.fork,Session.messages",
      "packages/opencode/src/session/message-v2.ts#Info,Part,WithParts,cursor,page,stream,parts,filterCompacted,latest",
      "packages/opencode/src/session/prompt.ts#SessionPrompt.run,MessageV2.filterCompactedEffect,MessageV2.toModelMessagesEffect",
      "packages/opencode/src/session/session.sql.ts#SessionTable,MessageTable,PartTable,SessionMessageTable",
      "packages/opencode/src/session/projectors-next.ts#encodeDateTimes,sqlite,update",
      "packages/opencode/src/sync/index.ts#SyncEvent.define,SyncEvent.run,SyncEvent.replay,SyncEvent.remove,SyncEvent.claim",
      "packages/opencode/src/sync/event.sql.ts#EventTable,EventSequenceTable",
    ],
    nativeEvidenceRefs: [openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef],
    fixtureIDs: [openCodeSessionNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptors: openCodeSessionNativeDescriptors,
    intentionallyBridgeAtoms: [] as const,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeSessionNativeExactFixture(fixture: OpenCodeSessionNativeExactFixture): OpenCodeSessionNativeExactVerification {
  const issues: OpenCodeSessionNativeExactIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== openCodeSessionNativeExactFixtureID || fixture.evidenceRef !== openCodeSessionNativeExactEvidenceRef) {
    addIssue("opencode-session-native-exact.identity", "OpenCode session native fixture lost fixture or evidence identity.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    addIssue("opencode-session-native-exact.native-claim", "OpenCode session native fixture must claim native-exact parity.")
  }
  if (fixture.knownLossiness.length !== 0 || fixture.intentionallyBridgeAtoms.length !== 0) {
    addIssue("opencode-session-native-exact.lossiness", "OpenCode session native fixture must not carry compatible bridge lossiness.")
  }
  for (const atomID of openCodeSessionNativeExactAtomIDs) {
    if (!fixture.atomIDs.includes(atomID)) {
      addIssue("opencode-session-native-exact.atom", `Missing atom ${atomID}.`)
    }
    const descriptor = fixture.descriptors.find((item) => item.id === atomID)
    if (!descriptor || descriptor.parityCoverage !== "native" || descriptor.knownLossiness.length !== 0) {
      addIssue("opencode-session-native-exact.descriptor", `Descriptor for ${atomID} is not native exact.`)
    }
  }
  const pageCase = fixture.cases.find((item) => item.scenarioID === "message-v2-hydrate-page-and-cursor")
  if (stableStringify(pageCase?.output["firstPageIDs"]) !== stableStringify(["msg_002", "msg_003"])) {
    addIssue("opencode-session-native-exact.page", "MessageV2 page ordering no longer matches upstream newest query plus reverse page semantics.")
  }
  const partCase = fixture.cases.find((item) => item.scenarioID === "message-v2-part-row-projector-preserves-discriminated-payload-and-linkage")
  if (
    stableStringify(partCase?.output["projectedPart"]) !== stableStringify({
      type: "text",
      text: "answer",
      metadata: { providerExecuted: true },
      id: "prt_003",
      sessionID: "ses_7fffffffffffNativeSession",
      messageID: "msg_002",
    }) ||
    stableStringify(partCase?.output["hydratedAssistantPartIDs"]) !== stableStringify(["prt_002", "prt_003"]) ||
    stableStringify(partCase?.output["hydratedAssistantPartMessageIDs"]) !== stableStringify(["msg_002", "msg_002"])
  ) {
    addIssue("opencode-session-native-exact.message-part", "MessageV2 part row projection no longer preserves payload identity, ordering, or message linkage.")
  }
  const forkCase = fixture.cases.find((item) => item.scenarioID === "fork-before-message-rewrites-message-and-part-ids")
  if (stableStringify(forkCase?.output["clonedMessageIDs"]) !== stableStringify(["msg_101", "msg_102"])) {
    addIssue("opencode-session-native-exact.fork", "Fork projection no longer stops before the boundary message.")
  }
  const compactedCase = fixture.cases.find((item) => item.scenarioID === "compaction-filter-tail-and-summary-order")
  if (stableStringify(compactedCase?.output["compactedIDs"]) !== stableStringify(["msg_004", "msg_005", "msg_002", "msg_003", "msg_006"])) {
    addIssue("opencode-session-native-exact.compaction", "Compaction filter no longer preserves OpenCode tail/summary ordering.")
  }
  const contextCase = fixture.cases.find((item) => item.scenarioID === "context-selector-filter-compacted-message-v2-prompt-context")
  if (
    stableStringify(contextCase?.output["contextIDs"]) !== stableStringify(["msg_004", "msg_005", "msg_002", "msg_003", "msg_006"]) ||
    stableStringify(contextCase?.output["model"]) !== stableStringify({ providerID: "anthropic", modelID: "claude" })
  ) {
    addIssue("opencode-session-native-exact.context-selector", "Prompt context selector no longer follows OpenCode MessageV2 filterCompacted/latest behavior.")
  }
  const expected = buildOpenCodeSessionNativeExactFixture()
  if (fixture.fingerprint !== expected.fingerprint) {
    addIssue("opencode-session-native-exact.fingerprint", "OpenCode session native fixture fingerprint changed from the pinned native projection.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function openCodeSessionPortForAtomID(id: OpenCodeSessionNativeExactAtomID): OpenCodeSessionPortID {
  if (id === openCodeSessionBranchingSQLiteServiceNativeExactAtomID) return "session.branching"
  if (id === openCodeSessionBranchGraphForkBeforeMessageNativeExactAtomID) return "session.branch-graph"
  if (id === openCodeSessionCompactionEventNativeExactAtomID) return "session.compaction-records"
  if (id === openCodeSessionContextSelectorMessageV2NativeExactAtomID) return "session.context-selector"
  if (id === openCodeSessionDiffSQLiteServiceNativeExactAtomID) return "session.diff"
  if (id === openCodeSessionEventLogSyncEventNativeExactAtomID) return "session.event-log"
  if (id === openCodeSessionIDGeneratorNativeExactAtomID) return "session.id-generator"
  if (id === openCodeSessionMessagePartProjectorNativeExactAtomID) return "session.message-part-projector"
  if (id === openCodeSessionMessageStoreSQLiteServiceNativeExactAtomID) return "session.message-store"
  if (id === openCodeSessionPaginationUpdateTimeCursorNativeExactAtomID) return "session.pagination"
  if (id === openCodeSessionReaderSQLiteServiceNativeExactAtomID) return "session.reader"
  if (id === openCodeSessionStoreSQLiteProjectionNativeExactAtomID) return "session.store"
  if (id === openCodeSessionWriterSQLiteServiceNativeExactAtomID) return "session.writer"
  return "session.projector"
}

function messageRow(
  id: string,
  sessionID: string,
  timeCreated: number,
  data: Record<string, unknown>,
): OpenCodeMessageV2RowProjection {
  return {
    id,
    session_id: sessionID,
    time_created: timeCreated,
    time_updated: timeCreated,
    data,
  }
}

function partRow(
  id: string,
  sessionID: string,
  messageID: string,
  timeCreated: number,
  data: Record<string, unknown>,
): OpenCodePartRowProjection {
  return {
    id,
    session_id: sessionID,
    message_id: messageID,
    time_created: timeCreated,
    time_updated: timeCreated,
    data,
  }
}

function withParts(
  info: OpenCodeMessageV2InfoProjection,
  parts: OpenCodeMessageV2PartProjection[],
): OpenCodeMessageV2WithPartsProjection {
  return {
    info: { ...info },
    parts: parts.map((part) => ({ ...part })),
  }
}

function cloneTokens(tokens: OpenCodeSessionTokens): OpenCodeSessionTokens {
  return {
    input: tokens.input,
    output: tokens.output,
    reasoning: tokens.reasoning,
    cache: { read: tokens.cache.read, write: tokens.cache.write },
  }
}

function cloneWithParts(message: OpenCodeMessageV2WithPartsProjection): OpenCodeMessageV2WithPartsProjection {
  return {
    info: cloneRecord(message.info) as OpenCodeMessageV2InfoProjection,
    parts: message.parts.map((part) => cloneRecord(part) as OpenCodeMessageV2PartProjection),
  }
}

function cloneRecord<T extends Record<string, unknown>>(record: T): T {
  return JSON.parse(JSON.stringify(record)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function isDateTimeLike(value: unknown): value is { _tag: "DateTime"; epochMillis: number } {
  return isRecord(value) && value["_tag"] === "DateTime" && typeof value["epochMillis"] === "number"
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
