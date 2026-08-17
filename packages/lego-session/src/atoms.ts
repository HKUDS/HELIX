import { randomBytes, randomUUID } from "node:crypto"
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import {
  asSessionID,
  createID,
  type LegoCapabilityRef,
  type LegoMessage,
  type LegoMessagePart,
  type LegoModuleManifest,
  type LegoPortContractFixture,
  type MessageID,
  type PartID,
  type SessionID,
  type SessionTranscript,
} from "@helix/contracts"
import { JsonlTreeSessionService } from "./jsonl-tree"
import { ProjectionSessionService, type ProjectionReplayEvent } from "./projection"
import { cloneMessageForSession, createSessionInfo, pageMessages } from "./utils"
import type {
  BranchSessionInput,
  ForkSessionInput,
  PageMessagesInput,
  PageMessagesResult,
  SessionContext,
  SessionInfo,
  SessionService,
} from "./types"

export const SESSION_PORT_IDS = [
  "session.id-generator",
  "session.store",
  "session.event-log",
  "session.reader",
  "session.writer",
  "session.message-store",
  "session.branching",
  "session.branch-graph",
  "session.projector",
  "session.pagination",
  "session.context-selector",
  "session.compaction-records",
  "session.diff",
  "session.message-part-projector",
] as const

export type SessionPortID = (typeof SESSION_PORT_IDS)[number]

export interface SessionPortContractFixture extends LegoPortContractFixture {
  id: SessionPortID
}

export const sessionPortContractFixtures: SessionPortContractFixture[] = [
  {
    id: "session.id-generator",
    input: "kind + optional seed",
    output: "stable SessionID",
    lifecycle: ["process", "workspace", "session"],
    resources: [],
    conformance: "session-atoms:id-generator",
    implementations: ["session.id-generator.deterministic"],
    personalityAtoms: ["opencode.session.id-generator", "pi.session.id-generator", "nanobot.session.id-generator", "hermes.session.id-generator"],
  },
  {
    id: "session.store",
    input: "session metadata, transcript mutations, raw storage records, and workspace/session scope",
    output: "durable session state readable by session reader/writer/message-store atoms",
    lifecycle: ["workspace", "session"],
    resources: [{ id: "filesystem", mode: "write", scope: "workspace" }],
    conformance: "session-atoms:store",
    implementations: ["session.store.memory", "session.store.jsonl-tree", "session.store.sqlite-projection"],
    personalityAtoms: [
      "opencode.session.store.sqlite-projection",
      "pi.session.store.jsonl-v3",
      "pi.session.store.jsonl-v3-migrator",
      "nanobot.session.store.jsonl",
      "hermes.session.store.sqlite-fts",
    ],
  },
  {
    id: "session.event-log",
    input: "session event append/read",
    output: "ordered event records",
    lifecycle: ["workspace", "session"],
    resources: [{ id: "filesystem", mode: "write", scope: "workspace" }],
    conformance: "session-atoms:event-log",
    implementations: ["session.event-log.memory", "session.event-log.jsonl", "session.event-log.projection"],
    personalityAtoms: ["opencode.session.event-log.syncevent", "pi.session.event-log.session-manager"],
  },
  {
    id: "session.reader",
    input: "session id/query",
    output: "SessionInfo + transcript/messages",
    lifecycle: ["session"],
    resources: [{ id: "filesystem", mode: "read", scope: "workspace" }],
    conformance: "session-atoms:reader",
    implementations: ["session.reader.memory", "session.reader.service"],
    personalityAtoms: ["opencode.session.reader.sqlite-service", "pi.session.reader.session-manager"],
  },
  {
    id: "session.writer",
    input: "create/update/remove session mutations",
    output: "persisted session state",
    lifecycle: ["session"],
    resources: [{ id: "filesystem", mode: "write", scope: "workspace" }],
    conformance: "session-atoms:writer",
    implementations: ["session.writer.memory", "session.writer.service"],
    personalityAtoms: ["opencode.session.writer.sqlite-service", "pi.session.writer.session-manager"],
  },
  {
    id: "session.message-store",
    input: "message/part mutations",
    output: "message transcript readback",
    lifecycle: ["session"],
    resources: [{ id: "filesystem", mode: "write", scope: "workspace" }],
    conformance: "session-atoms:message-store",
    implementations: ["session.message-store.memory", "session.message-store.service"],
    personalityAtoms: ["opencode.session.message-store.sqlite-service", "pi.session.message-store.session-manager"],
  },
  {
    id: "session.branching",
    input: "fork/branch/diff operations",
    output: "branch graph mutations",
    lifecycle: ["session"],
    resources: [{ id: "filesystem", mode: "write", scope: "workspace" }],
    conformance: "session-atoms:branching",
    implementations: ["session.branching.memory", "session.branching.service"],
    personalityAtoms: ["opencode.session.branching.sqlite-service", "pi.session.branching.session-manager"],
  },
  {
    id: "session.branch-graph",
    input: "message/session parent ids, leaf pointer, branch labels, and fork targets",
    output: "normalized branch graph with active leaf and child relationships",
    lifecycle: ["session"],
    resources: [{ id: "filesystem", mode: "write", scope: "workspace" }],
    conformance: "session-atoms:branch-graph",
    implementations: ["session.branch-graph.memory", "session.branch-graph.service"],
    personalityAtoms: [
      "opencode.session.branch-graph.fork-before-message",
      "pi.session.branch-graph.leaf-tree",
      "pi.session.branch-graph.active-leaf",
      "nanobot.session.branch-graph.channel-key",
      "hermes.session.branch-graph.lineage",
    ],
  },
  {
    id: "session.projector",
    input: "raw session representation",
    output: "common SessionTranscript",
    lifecycle: ["session"],
    resources: [],
    conformance: "session-atoms:projector",
    implementations: ["session.projector.common-transcript"],
    personalityAtoms: [
      "opencode.session.projector.syncevent",
      "opencode.session.projector.message-v2",
      "pi.session.projector.jsonl",
      "pi.session.projector.jsonl-v3",
      "nanobot.session.projector.jsonl",
      "hermes.session.projector.openai-messages",
    ],
  },
  {
    id: "session.message-part-projector",
    input: "common transcript message parts and product-native message/part protocol requirements",
    output: "product-native message part type projection with lossiness annotations and reverse projection hints",
    lifecycle: ["session", "turn"],
    resources: [],
    conformance: "session-atoms:message-part-projector",
    implementations: ["common.session.message-part-projector"],
    personalityAtoms: [
      "opencode.session.message-part-projector.native-like",
      "pi.session.message-part-projector.native-like",
      "nanobot.session.message-part-projector.native-like",
      "hermes.session.message-part-projector.native-like",
    ],
  },
  {
    id: "session.pagination",
    input: "cursor page request",
    output: "PageMessagesResult",
    lifecycle: ["session"],
    resources: [],
    conformance: "session-atoms:pagination",
    implementations: ["session.pagination.memory", "session.pagination.service"],
    personalityAtoms: [
      "opencode.session.pagination.update-time-cursor",
      "pi.session.pagination.active-path",
      "nanobot.session.pagination.updated-at",
      "hermes.session.pagination.updated-at",
    ],
  },
  {
    id: "session.context-selector",
    input: "session id + optional leaf",
    output: "provider SessionContext",
    lifecycle: ["session", "turn"],
    resources: [],
    conformance: "session-atoms:context-selector",
    implementations: ["session.context-selector.memory", "session.context-selector.service"],
    personalityAtoms: [
      "opencode.session.context-selector.message-v2",
      "pi.session.context-selector.active-leaf",
      "nanobot.session.context-selector.max-messages",
      "hermes.session.context-selector.thread-history",
    ],
  },
  {
    id: "session.compaction-records",
    input: "session id, compaction summary, retained message ids, token estimate, and source event metadata",
    output: "persisted compaction record that can be selected into later provider context",
    lifecycle: ["session", "turn"],
    resources: [{ id: "filesystem", mode: "write", scope: "workspace" }],
    conformance: "session-atoms:compaction-records",
    implementations: ["session.compaction-records.memory", "session.compaction-records.service"],
    personalityAtoms: ["opencode.session.compaction-event", "pi.session.branch-summary", "nanobot.session.goal-state", "hermes.session.compaction-trajectory"],
  },
  {
    id: "session.diff",
    input: "session id",
    output: "diff records",
    lifecycle: ["session"],
    resources: [],
    conformance: "session-atoms:diff",
    implementations: ["session.branching.memory", "session.branching.service"],
    personalityAtoms: ["opencode.session.diff.sqlite-service", "pi.session.diff.session-manager"],
  },
]

export interface SessionIDGeneratorAtom {
  readonly manifest: LegoModuleManifest
  next(input?: { seed?: string; timestamp?: number }): SessionID
}

export interface OpenCodeSessionIDGeneratorOptions {
  now?: () => number
  randomBytes?: (length: number) => Uint8Array
}

export interface SessionEventRecord {
  type: string
  sessionID?: SessionID
  timestamp: number
  data?: unknown
}

export interface SessionEventLogAtom {
  readonly manifest: LegoModuleManifest
  append(event: Omit<SessionEventRecord, "timestamp"> & { timestamp?: number }): SessionEventRecord
  read(input?: { sessionID?: SessionID; type?: string }): SessionEventRecord[]
  clear(input?: { sessionID?: SessionID }): void
}

export interface SessionReaderAtom {
  readonly manifest: LegoModuleManifest
  get(sessionID: SessionID): Promise<SessionInfo>
  list(input?: { cwd?: string }): Promise<SessionInfo[]>
  messages(input: { sessionID: SessionID; limit?: number }): Promise<LegoMessage[]>
  transcript(sessionID: SessionID): Promise<SessionTranscript>
}

export interface SessionWriterAtom {
  readonly manifest: LegoModuleManifest
  create(input?: Parameters<SessionService["create"]>[0]): Promise<SessionInfo>
  touch(sessionID: SessionID): Promise<void>
  setTitle(input: { sessionID: SessionID; title: string }): Promise<void>
  remove(sessionID: SessionID): Promise<void>
}

export interface SessionMessageStoreAtom {
  readonly manifest: LegoModuleManifest
  appendMessage(message: LegoMessage): Promise<LegoMessage>
  updateMessage(message: LegoMessage): Promise<LegoMessage>
  appendPart(input: { sessionID: SessionID; messageID: MessageID; part: LegoMessagePart }): Promise<LegoMessagePart>
  updatePart(input: { sessionID: SessionID; messageID: MessageID; partID: PartID; part: LegoMessagePart }): Promise<LegoMessagePart>
  removeMessage(input: { sessionID: SessionID; messageID: MessageID }): Promise<void>
  removePart(input: { sessionID: SessionID; messageID: MessageID; partID: PartID }): Promise<void>
}

export interface SessionBranchingAtom {
  readonly manifest: LegoModuleManifest
  fork(input: ForkSessionInput): Promise<SessionInfo>
  branch(input: BranchSessionInput): Promise<void>
  diff(sessionID: SessionID): Promise<unknown[]>
}

export interface SessionProjectorAtom<TRaw = unknown> {
  readonly manifest: LegoModuleManifest
  project(raw: TRaw): Promise<SessionTranscript>
}

export interface SessionPaginationAtom {
  readonly manifest: LegoModuleManifest
  pageMessages(input: PageMessagesInput): Promise<PageMessagesResult>
}

export interface SessionContextSelectorAtom {
  readonly manifest: LegoModuleManifest
  select(input: { sessionID: SessionID; leafID?: string | null }): Promise<SessionContext>
}

export interface SessionAtomSet {
  idGenerator: SessionIDGeneratorAtom
  eventLog: SessionEventLogAtom
  reader: SessionReaderAtom
  writer: SessionWriterAtom
  messageStore: SessionMessageStoreAtom
  branching: SessionBranchingAtom
  projector: SessionProjectorAtom<{ sessionID: SessionID; messages: LegoMessage[] }>
  pagination: SessionPaginationAtom
  contextSelector: SessionContextSelectorAtom
}

interface InMemorySessionAtomState {
  info: SessionInfo
  messages: LegoMessage[]
}

export interface InMemorySessionAtomsOptions {
  cwd?: string
  idGenerator?: SessionIDGeneratorAtom
  eventLog?: SessionEventLogAtom
}

export function createDeterministicSessionIDGenerator(prefix = "ses_test"): SessionIDGeneratorAtom {
  let counter = 0
  return {
    manifest: sessionAtomManifest("session.id-generator.deterministic", "session.id-generator", {
      variant: "deterministic",
      stability: "stable",
    }),
    next(input = {}) {
      counter += 1
      return asSessionID(`${prefix}_${input.seed ?? String(counter).padStart(4, "0")}`)
    },
  }
}

export function createOpenCodeSessionIDGenerator(options: OpenCodeSessionIDGeneratorOptions = {}): SessionIDGeneratorAtom {
  let lastTimestamp = 0
  let counter = 0
  const now = options.now ?? (() => Date.now())
  const entropy = options.randomBytes ?? ((length: number) => randomBytes(length))
  return {
    manifest: sessionAtomManifest("opencode.session.id-generator", "session.id-generator", {
      variant: "opencode-ses",
      personality: "opencode",
    }),
    next(input = {}) {
      if (input.seed) {
        if (!input.seed.startsWith("ses")) throw new Error(`ID ${input.seed} does not start with ses`)
        return asSessionID(input.seed)
      }
      const timestamp = input.timestamp ?? now()
      if (timestamp !== lastTimestamp) {
        lastTimestamp = timestamp
        counter = 0
      }
      counter += 1
      return asSessionID(`ses_${createOpenCodeCoreIdentifier(timestamp, counter, entropy)}`)
    },
  }
}

function createOpenCodeCoreIdentifier(timestamp: number, counter: number, entropy: (length: number) => Uint8Array): string {
  let encoded = BigInt(timestamp) * BigInt(0x1000) + BigInt(counter)
  encoded = ~encoded
  const timeBytes = Buffer.alloc(6)
  for (let index = 0; index < 6; index++) {
    timeBytes[index] = Number((encoded >> BigInt(40 - 8 * index)) & BigInt(0xff))
  }
  return `${timeBytes.toString("hex")}${openCodeRandomBase62(entropy, 14)}`
}

function openCodeRandomBase62(entropy: (length: number) => Uint8Array, length: number): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  const bytes = entropy(length)
  let result = ""
  for (let index = 0; index < length; index++) result += chars[(bytes[index] ?? 0) % chars.length]
  return result
}

export function createPiSessionIDGenerator(): SessionIDGeneratorAtom {
  return {
    manifest: sessionAtomManifest("pi.session.id-generator", "session.id-generator", {
      variant: "pi-uuid",
      personality: "pi-mono",
    }),
    next(input = {}) {
      return asSessionID(input.seed ?? randomUUID())
    },
  }
}

export function createInMemorySessionAtoms(options: InMemorySessionAtomsOptions = {}): SessionAtomSet {
  const idGenerator = options.idGenerator ?? createDeterministicSessionIDGenerator()
  const eventLog = options.eventLog ?? createInMemorySessionEventLog()
  const cwd = options.cwd ?? process.cwd()
  const states = new Map<SessionID, InMemorySessionAtomState>()

  const reader: SessionReaderAtom = {
    manifest: sessionAtomManifest("session.reader.memory", "session.reader", { variant: "memory" }),
    async get(sessionID) {
      return { ...mustMemoryState(states, sessionID).info }
    },
    async list(input = {}) {
      return Array.from(states.values())
        .map((state) => state.info)
        .filter((info) => !input.cwd || info.cwd === input.cwd)
        .sort((left, right) => right.updated - left.updated)
        .map((info) => ({ ...info }))
    },
    async messages(input) {
      const messages = mustMemoryState(states, input.sessionID).messages
      return structuredClone(input.limit ? messages.slice(-input.limit) : messages)
    },
    async transcript(sessionID) {
      return { sessionID, messages: await reader.messages({ sessionID }) }
    },
  }

  const writer: SessionWriterAtom = {
    manifest: sessionAtomManifest("session.writer.memory", "session.writer", { variant: "memory" }),
    async create(input = {}) {
      const info = createSessionInfo({
        id: input.id ?? idGenerator.next(input.id ? { seed: input.id } : {}),
        cwd: input.cwd ?? cwd,
        title: input.title,
        parentID: input.parentID,
        path: input.path,
        metadata: input.metadata,
      })
      states.set(info.id, { info, messages: [] })
      eventLog.append({ sessionID: info.id, type: "session.created", data: info, timestamp: info.created })
      return { ...info }
    },
    async touch(sessionID) {
      const state = mustMemoryState(states, sessionID)
      state.info.updated = Date.now()
      eventLog.append({ sessionID, type: "session.updated", data: state.info, timestamp: state.info.updated })
    },
    async setTitle(input) {
      const state = mustMemoryState(states, input.sessionID)
      state.info.title = input.title
      state.info.updated = Date.now()
      eventLog.append({ sessionID: input.sessionID, type: "session.updated", data: { title: input.title }, timestamp: state.info.updated })
    },
    async remove(sessionID) {
      states.delete(sessionID)
      eventLog.append({ sessionID, type: "session.deleted", timestamp: Date.now() })
    },
  }

  const messageStore: SessionMessageStoreAtom = {
    manifest: sessionAtomManifest("session.message-store.memory", "session.message-store", { variant: "memory" }),
    async appendMessage(message) {
      const state = mustMemoryState(states, message.sessionID)
      state.messages.push(structuredClone(message))
      state.info.updated = Date.now()
      eventLog.append({ sessionID: message.sessionID, type: "message.updated", data: message, timestamp: state.info.updated })
      return structuredClone(message)
    },
    async updateMessage(message) {
      const state = mustMemoryState(states, message.sessionID)
      const index = state.messages.findIndex((candidate) => candidate.id === message.id)
      if (index < 0) throw new Error(`Message ${message.id} not found`)
      state.messages[index] = structuredClone(message)
      state.info.updated = Date.now()
      eventLog.append({ sessionID: message.sessionID, type: "message.updated", data: message, timestamp: state.info.updated })
      return structuredClone(message)
    },
    async appendPart(input) {
      const message = memoryMessage(states, input.sessionID, input.messageID)
      ;(message.parts as LegoMessagePart[]).push(structuredClone(input.part))
      await messageStore.updateMessage(message)
      return structuredClone(input.part)
    },
    async updatePart(input) {
      const message = memoryMessage(states, input.sessionID, input.messageID)
      const index = (message.parts as LegoMessagePart[]).findIndex((part) => part.id === input.partID)
      if (index < 0) throw new Error(`Part ${input.partID} not found`)
      ;(message.parts as LegoMessagePart[])[index] = structuredClone(input.part)
      await messageStore.updateMessage(message)
      return structuredClone(input.part)
    },
    async removeMessage(input) {
      const state = mustMemoryState(states, input.sessionID)
      state.messages = state.messages.filter((message) => message.id !== input.messageID)
      state.info.updated = Date.now()
      eventLog.append({ sessionID: input.sessionID, type: "message.removed", data: input, timestamp: state.info.updated })
    },
    async removePart(input) {
      const message = memoryMessage(states, input.sessionID, input.messageID)
      message.parts = (message.parts as LegoMessagePart[]).filter((part) => part.id !== input.partID) as typeof message.parts
      await messageStore.updateMessage(message)
    },
  }

  const branching: SessionBranchingAtom = {
    manifest: sessionAtomManifest("session.branching.memory", "session.branching", { variant: "memory" }),
    async fork(input) {
      const source = mustMemoryState(states, input.sessionID)
      const fork = await writer.create({
        cwd: input.cwd ?? source.info.cwd,
        title: input.title ?? `Fork: ${source.info.title}`,
        parentID: source.info.id,
      })
      mustMemoryState(states, fork.id).messages = source.messages.map((message) => cloneMessageForSession(message, fork.id))
      eventLog.append({ sessionID: source.info.id, type: "session.forked", data: { to: fork.id }, timestamp: Date.now() })
      return fork
    },
    async branch(input) {
      eventLog.append({ sessionID: input.sessionID, type: "session.branch.selected", data: input, timestamp: Date.now() })
    },
    async diff(sessionID) {
      return eventLog.read({ sessionID })
    },
  }

  const pagination: SessionPaginationAtom = {
    manifest: sessionAtomManifest("session.pagination.memory", "session.pagination", { variant: "memory" }),
    async pageMessages(input) {
      return pageMessages(mustMemoryState(states, input.sessionID).messages, input)
    },
  }

  const contextSelector: SessionContextSelectorAtom = {
    manifest: sessionAtomManifest("session.context-selector.memory", "session.context-selector", { variant: "memory" }),
    async select(input) {
      return {
        messages: await reader.messages({ sessionID: input.sessionID }),
        thinkingLevel: "off",
        model: null,
      }
    },
  }

  return {
    idGenerator,
    eventLog,
    reader,
    writer,
    messageStore,
    branching,
    projector: createCommonTranscriptProjector(),
    pagination,
    contextSelector,
  }
}

export function createInMemorySessionEventLog(): SessionEventLogAtom {
  const events: SessionEventRecord[] = []
  return {
    manifest: sessionAtomManifest("session.event-log.memory", "session.event-log", { variant: "memory" }),
    append(event) {
      const record: SessionEventRecord = {
        type: event.type,
        timestamp: event.timestamp ?? Date.now(),
        ...(event.sessionID ? { sessionID: event.sessionID } : {}),
        ...(event.data === undefined ? {} : { data: structuredClone(event.data) }),
      }
      events.push(record)
      return structuredClone(record)
    },
    read(input = {}) {
      return structuredClone(
        events.filter((event) => (!input.sessionID || event.sessionID === input.sessionID) && (!input.type || event.type === input.type)),
      )
    },
    clear(input = {}) {
      if (!input.sessionID) {
        events.length = 0
        return
      }
      for (let index = events.length - 1; index >= 0; index--) {
        if (events[index]?.sessionID === input.sessionID) events.splice(index, 1)
      }
    },
  }
}

export function createJsonlSessionEventLog(path: string): SessionEventLogAtom {
  mkdirSync(dirname(path), { recursive: true })
  return {
    manifest: sessionAtomManifest("session.event-log.jsonl", "session.event-log", { variant: "jsonl" }),
    append(event) {
      const record: SessionEventRecord = {
        type: event.type,
        timestamp: event.timestamp ?? Date.now(),
        ...(event.sessionID ? { sessionID: event.sessionID } : {}),
        ...(event.data === undefined ? {} : { data: structuredClone(event.data) }),
      }
      appendFileSync(path, `${JSON.stringify(record)}\n`, "utf8")
      return structuredClone(record)
    },
    read(input = {}) {
      return readEventLogJsonl(path).filter(
        (event) => (!input.sessionID || event.sessionID === input.sessionID) && (!input.type || event.type === input.type),
      )
    },
    clear(input = {}) {
      if (!input.sessionID) {
        writeFileSync(path, "", "utf8")
        return
      }
      const retained = readEventLogJsonl(path).filter((event) => event.sessionID !== input.sessionID)
      writeFileSync(path, retained.map((event) => JSON.stringify(event)).join("\n") + (retained.length > 0 ? "\n" : ""), "utf8")
    },
  }
}

export function createProjectionSessionEventLog(service = new ProjectionSessionService()): SessionEventLogAtom {
  const appended: SessionEventRecord[] = []
  return {
    manifest: sessionAtomManifest("session.event-log.projection", "session.event-log", { variant: "projection-service" }),
    append(event) {
      const record: SessionEventRecord = {
        type: event.type,
        timestamp: event.timestamp ?? Date.now(),
        ...(event.sessionID ? { sessionID: event.sessionID } : {}),
        ...(event.data === undefined ? {} : { data: structuredClone(event.data) }),
      }
      appended.push(record)
      void service.applyEvent({
        type: record.type,
        timestamp: record.timestamp,
        ...(record.sessionID ? { sessionID: record.sessionID } : {}),
        ...(record.data === undefined ? {} : { data: record.data }),
      })
      return structuredClone(record)
    },
    read(input = {}) {
      if (input.sessionID) {
        try {
          return service
            .events(input.sessionID)
            .filter((event) => !input.type || event.type === input.type)
            .map((event) => ({
              type: event.type,
              timestamp: event.timestamp,
              sessionID: input.sessionID!,
              data: structuredClone(event.data),
            }))
        } catch {
          return []
        }
      }
      return structuredClone(appended.filter((event) => !input.type || event.type === input.type))
    },
    clear(input = {}) {
      if (!input.sessionID) {
        appended.length = 0
        return
      }
      for (let index = appended.length - 1; index >= 0; index--) {
        if (appended[index]?.sessionID === input.sessionID) appended.splice(index, 1)
      }
      void service.remove(input.sessionID)
    },
  }
}

export function createSessionReaderAtom(service: SessionService): SessionReaderAtom {
  return {
    manifest: serviceBackedManifest("session.reader.service", "session.reader", service.kind),
    get: (sessionID) => service.get(sessionID),
    list: (input) => service.list(input),
    messages: (input) => service.messages(input),
    transcript: (sessionID) => service.transcript(sessionID),
  }
}

export function createSessionWriterAtom(service: SessionService): SessionWriterAtom {
  return {
    manifest: serviceBackedManifest("session.writer.service", "session.writer", service.kind),
    create: (input) => service.create(input),
    touch: (sessionID) => service.touch(sessionID),
    setTitle: (input) => service.setTitle(input),
    remove: (sessionID) => service.remove(sessionID),
  }
}

export function createSessionMessageStoreAtom(service: SessionService): SessionMessageStoreAtom {
  return {
    manifest: serviceBackedManifest("session.message-store.service", "session.message-store", service.kind),
    appendMessage: (message) => service.appendMessage(message),
    updateMessage: (message) => service.updateMessage(message),
    appendPart: (input) => service.appendPart(input),
    updatePart: (input) => service.updatePart(input),
    removeMessage: (input) => service.removeMessage(input),
    removePart: (input) => service.removePart(input),
  }
}

export function createSessionBranchingAtom(service: SessionService): SessionBranchingAtom {
  return {
    manifest: serviceBackedManifest("session.branching.service", "session.branching", service.kind),
    fork: (input) => service.fork(input),
    branch: (input) => service.branch(input),
    diff: (sessionID) => service.diff(sessionID),
  }
}

export function createSessionPaginationAtom(service: SessionService): SessionPaginationAtom {
  return {
    manifest: serviceBackedManifest("session.pagination.service", "session.pagination", service.kind),
    pageMessages: (input) => service.pageMessages(input),
  }
}

export function createSessionContextSelectorAtom(service: SessionService): SessionContextSelectorAtom {
  return {
    manifest: serviceBackedManifest("session.context-selector.service", "session.context-selector", service.kind),
    async select(input) {
      if (hasBuildContext(service)) return service.buildContext(input)
      return {
        messages: await service.messages({ sessionID: input.sessionID }),
        thinkingLevel: "off",
        model: null,
      }
    },
  }
}

export function createCommonTranscriptProjector(): SessionProjectorAtom<{ sessionID: SessionID; messages: LegoMessage[] }> {
  return {
    manifest: sessionAtomManifest("session.projector.common-transcript", "session.projector", { variant: "common-transcript" }),
    async project(raw) {
      return {
        sessionID: raw.sessionID,
        messages: structuredClone(raw.messages),
      }
    },
  }
}

export interface OpenCodeSyncEventProjectorInput {
  events: ProjectionReplayEvent[]
  sessionID?: SessionID
}

export function createOpenCodeSyncEventProjector(): SessionProjectorAtom<OpenCodeSyncEventProjectorInput> {
  return {
    manifest: sessionAtomManifest("opencode.session.projector.syncevent", "session.projector", {
      variant: "opencode-syncevent",
      personality: "opencode",
    }),
    async project(raw) {
      const service = new ProjectionSessionService()
      const infos = await service.replay(raw.events)
      const info = raw.sessionID ? infos.find((candidate) => candidate.id === raw.sessionID) : infos[0]
      if (!info) throw new Error(`OpenCode projector could not find session ${raw.sessionID ?? "<first>"}`)
      return service.transcript(info.id)
    },
  }
}

export interface PiJsonlProjectorInput {
  path: string
  storageDir?: string
}

export function createPiJsonlProjector(): SessionProjectorAtom<PiJsonlProjectorInput> {
  return {
    manifest: sessionAtomManifest("pi.session.projector.jsonl", "session.projector", {
      variant: "pi-jsonl-v1-v2-v3",
      personality: "pi-mono",
    }),
    async project(raw) {
      const service = new JsonlTreeSessionService({ storageDir: raw.storageDir ?? dirname(raw.path) })
      const info = await service.open(raw.path)
      return service.transcript(info.id)
    },
  }
}

export function createServiceBackedSessionAtoms(service: SessionService): SessionAtomSet {
  return {
    idGenerator: createDeterministicSessionIDGenerator(),
    eventLog: createInMemorySessionEventLog(),
    reader: createSessionReaderAtom(service),
    writer: createSessionWriterAtom(service),
    messageStore: createSessionMessageStoreAtom(service),
    branching: createSessionBranchingAtom(service),
    projector: createCommonTranscriptProjector(),
    pagination: createSessionPaginationAtom(service),
    contextSelector: createSessionContextSelectorAtom(service),
  }
}

function readEventLogJsonl(path: string): SessionEventRecord[] {
  try {
    return readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as SessionEventRecord)
  } catch {
    return []
  }
}

function mustMemoryState(states: Map<SessionID, InMemorySessionAtomState>, sessionID: SessionID): InMemorySessionAtomState {
  const state = states.get(sessionID)
  if (!state) throw new Error(`Session ${sessionID} not found`)
  return state
}

function memoryMessage(states: Map<SessionID, InMemorySessionAtomState>, sessionID: SessionID, messageID: MessageID): LegoMessage {
  const message = mustMemoryState(states, sessionID).messages.find((candidate) => candidate.id === messageID)
  if (!message) throw new Error(`Message ${messageID} not found`)
  return structuredClone(message)
}

export function sessionAtomManifest(
  id: string,
  capabilityID: SessionPortID,
  options: { variant?: string; personality?: "common" | "opencode" | "pi-mono"; stability?: LegoCapabilityRef["stability"] } = {},
): LegoModuleManifest {
  return {
    id,
    version: "0.1.0",
    kind: "atom",
    blockType: "atom",
    layer: "session",
    personality: options.personality ?? "common",
    provides: [
      {
        id: capabilityID,
        kind: "implementation",
        ...(options.variant ? { variant: options.variant } : {}),
        multiplicity: "single",
        stability: options.stability ?? "experimental",
        ...(options.personality ? { personality: options.personality } : {}),
      },
    ],
    conformance: [`session-atoms:${capabilityID.split(".").at(-1) ?? capabilityID}`],
  }
}

function serviceBackedManifest(id: string, capabilityID: SessionPortID, serviceKind: string): LegoModuleManifest {
  return sessionAtomManifest(id, capabilityID, { variant: `service:${serviceKind}` })
}

function hasBuildContext(service: SessionService): service is SessionService & {
  buildContext(input: { sessionID: SessionID; leafID?: string | null }): SessionContext
} {
  return "buildContext" in service && typeof service.buildContext === "function"
}
