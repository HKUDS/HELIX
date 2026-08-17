import type { LegoMessage, LegoMessagePart, SessionTranscript } from "@helix/contracts"
import type { MessageID, PartID, SessionID } from "@helix/contracts"

export interface SessionInfo {
  id: SessionID
  title: string
  cwd: string
  slug?: string
  projectID?: string
  directory?: string
  path?: string
  workspaceID?: string
  parentID?: SessionID
  messageID?: MessageID
  version?: string
  share?: unknown
  agent?: string
  model?: {
    providerID?: string
    modelID: string
    variant?: string
  }
  providerID?: string
  modelID?: string
  mode?: string
  cost?: number
  tokens?: {
    total?: number
    input?: number
    output?: number
    reasoning?: number
    cacheRead?: number
    cacheWrite?: number
    cache?: {
      read?: number
      write?: number
    }
    [key: string]: unknown
  }
  time?: {
    created?: number
    updated?: number
    completed?: number
    [key: string]: unknown
  }
  summary?: unknown
  revert?: unknown
  created: number
  updated: number
  permission?: unknown
  metadata?: Record<string, unknown>
}

export interface CreateSessionInput {
  id?: SessionID
  cwd?: string
  title?: string
  parentID?: SessionID
  path?: string
  metadata?: Record<string, unknown>
}

export interface ForkSessionInput {
  sessionID: SessionID
  messageID?: MessageID
  cwd?: string
  title?: string
}

export interface BranchSessionInput {
  sessionID: SessionID
  entryID: string | null
}

export interface BranchWithSummaryInput extends BranchSessionInput {
  summary: string
  details?: unknown
  fromHook?: boolean
}

export interface CreateBranchedSessionInput {
  sessionID: SessionID
  leafID: string
  title?: string
  cwd?: string
}

export interface ForkFromSessionInput {
  sourcePath: string
  cwd?: string
  title?: string
}

export interface PageMessagesInput {
  sessionID: SessionID
  limit: number
  before?: string
}

export interface MessagePageCursor {
  id: MessageID
  time: number
}

export interface PageMessagesResult {
  messages: LegoMessage[]
  more: boolean
  cursor?: string
}

export interface SessionContext {
  messages: LegoMessage[]
  thinkingLevel: string
  model: {
    providerID?: string
    modelID: string
  } | null
}

export interface SessionService {
  readonly kind: "jsonl-tree" | "event-projection" | string
  create(input?: CreateSessionInput): Promise<SessionInfo>
  open(path: string): Promise<SessionInfo>
  resume(input?: { cwd?: string }): Promise<SessionInfo>
  list(input?: { cwd?: string }): Promise<SessionInfo[]>
  get(sessionID: SessionID): Promise<SessionInfo>
  fork(input: ForkSessionInput): Promise<SessionInfo>
  branch(input: BranchSessionInput): Promise<void>
  remove(sessionID: SessionID): Promise<void>
  touch(sessionID: SessionID): Promise<void>
  setTitle(input: { sessionID: SessionID; title: string }): Promise<void>
  setPermission(input: { sessionID: SessionID; permission: unknown }): Promise<void>
  messages(input: { sessionID: SessionID; limit?: number }): Promise<LegoMessage[]>
  pageMessages(input: PageMessagesInput): Promise<PageMessagesResult>
  transcript(sessionID: SessionID): Promise<SessionTranscript>
  appendMessage(message: LegoMessage): Promise<LegoMessage>
  updateMessage(message: LegoMessage): Promise<LegoMessage>
  appendPart(input: { sessionID: SessionID; messageID: MessageID; part: LegoMessagePart }): Promise<LegoMessagePart>
  updatePart(input: { sessionID: SessionID; messageID: MessageID; partID: PartID; part: LegoMessagePart }): Promise<LegoMessagePart>
  removeMessage(input: { sessionID: SessionID; messageID: MessageID }): Promise<void>
  removePart(input: { sessionID: SessionID; messageID: MessageID; partID: PartID }): Promise<void>
  diff(sessionID: SessionID): Promise<unknown[]>
}

export interface SessionEntryBase {
  id: string
  parentID: string | null
  timestamp: number
}

export interface MessageEntry extends SessionEntryBase {
  type: "message"
  message: LegoMessage
}

export interface CompactionEntry extends SessionEntryBase {
  type: "compaction"
  summary: string
  firstKeptEntryID?: string
  tokensBefore?: number
  details?: unknown
  fromHook?: boolean
}

export interface BranchSummaryEntry extends SessionEntryBase {
  type: "branch_summary"
  fromID: string
  summary: string
  details?: unknown
  fromHook?: boolean
}

export interface ThinkingLevelChangeEntry extends SessionEntryBase {
  type: "thinking_level_change"
  level: string
  previousLevel?: string
  details?: unknown
}

export interface ModelChangeEntry extends SessionEntryBase {
  type: "model_change"
  model: {
    providerID?: string
    modelID: string
  }
  previousModel?: {
    providerID?: string
    modelID: string
  }
  details?: unknown
}

export interface CustomEntry extends SessionEntryBase {
  type: "custom"
  customType: string
  data?: unknown
}

export interface CustomMessageEntry extends SessionEntryBase {
  type: "custom_message"
  customType: string
  content: unknown
  display?: string
  details?: unknown
}

export interface LabelEntry extends SessionEntryBase {
  type: "label"
  targetID: string
  label?: string
}

export interface SessionInfoEntry extends SessionEntryBase {
  type: "session_info"
  name: string
}

export type SessionTreeEntry =
  | MessageEntry
  | CompactionEntry
  | BranchSummaryEntry
  | ThinkingLevelChangeEntry
  | ModelChangeEntry
  | CustomEntry
  | CustomMessageEntry
  | LabelEntry
  | SessionInfoEntry

export interface SessionHeader {
  type: "session"
  version: number
  id: SessionID
  timestamp: number
  cwd: string
  parentSession?: string
  leafID?: string | null
  title?: string
  metadata?: Record<string, unknown>
}

export type SessionFileEntry = SessionHeader | SessionTreeEntry
