import { createHash } from "node:crypto"

export type OpenCodeSessionMessageRole = "user" | "assistant"

export interface OpenCodeSessionCompactionMessageInfo {
  id: string
  role: OpenCodeSessionMessageRole
  sessionID: string
  parentID?: string
  agent?: string
  model?: unknown
  format?: unknown
  tools?: unknown
  system?: unknown
  summary?: boolean
  finish?: string
  error?: unknown
  time?: { created?: number; updated?: number }
}

export interface OpenCodeSessionCompactionPart {
  id: string
  sessionID: string
  messageID: string
  type: "compaction"
  auto: boolean
  overflow?: boolean
  tail_start_id?: string
}

export interface OpenCodeSessionSubtaskPart {
  id: string
  sessionID: string
  messageID: string
  type: "subtask"
  prompt: string
  description: string
  agent: string
}

export interface OpenCodeSessionTextPart {
  id: string
  sessionID: string
  messageID: string
  type: "text"
  text: string
}

export type OpenCodeSessionCompactionPartLike =
  | OpenCodeSessionCompactionPart
  | OpenCodeSessionSubtaskPart
  | OpenCodeSessionTextPart
  | { id: string; sessionID: string; messageID: string; type: string; [key: string]: unknown }

export interface OpenCodeSessionCompactionWithParts {
  info: OpenCodeSessionCompactionMessageInfo
  parts: OpenCodeSessionCompactionPartLike[]
}

export interface OpenCodeSessionCompactionLatest {
  user?: OpenCodeSessionCompactionMessageInfo
  assistant?: OpenCodeSessionCompactionMessageInfo
  finished?: OpenCodeSessionCompactionMessageInfo
  tasks: Array<OpenCodeSessionCompactionPart | OpenCodeSessionSubtaskPart>
}

export interface OpenCodeSessionCompactionCreateInput {
  sessionID: string
  messageID: string
  partID: string
  agent: string
  model: unknown
  auto: boolean
  overflow?: boolean
  created: number
}

export interface OpenCodeSessionCompactionCreateResult {
  info: OpenCodeSessionCompactionMessageInfo
  part: OpenCodeSessionCompactionPart
}

export interface OpenCodeSessionCompactionEventBridge {
  create(input: OpenCodeSessionCompactionCreateInput): OpenCodeSessionCompactionCreateResult
  filterCompacted(messages: Iterable<OpenCodeSessionCompactionWithParts>): OpenCodeSessionCompactionWithParts[]
  latest(messages: OpenCodeSessionCompactionWithParts[]): OpenCodeSessionCompactionLatest
  updateTailStart(part: OpenCodeSessionCompactionPart, tailStartID: string | undefined): OpenCodeSessionCompactionPart
}

export interface OpenCodeSessionCompactionEventNativeExactFixtureCase {
  id:
    | "create-compaction-part-shape"
    | "filter-compacted-without-tail-stops-at-summary"
    | "filter-compacted-tail-reorders-retained-context"
    | "latest-selects-max-id-and-open-tasks"
  actual: unknown
  expected: unknown
}

export interface OpenCodeSessionCompactionEventNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.session.compaction-event"
  portID: "session.compaction-records"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-session-compaction-event-native-exact-fixture"
  replayRef: "session-compaction-event-native-exact:opencode"
  fixtureID: "opencode-session-compaction-event:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeSessionCompactionEventNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeSessionCompactionEventNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeSessionCompactionEventNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeSessionCompactionEventNativeExactFixtureIssue[]
}

export function createOpenCodeSessionCompactionEventBridge(): OpenCodeSessionCompactionEventBridge {
  return {
    create: openCodeSessionCompactionCreate,
    filterCompacted: openCodeSessionFilterCompacted,
    latest: openCodeSessionCompactionLatest,
    updateTailStart(part, tailStartID) {
      if (tailStartID !== undefined) return { ...part, tail_start_id: tailStartID }
      const { tail_start_id: _tailStartID, ...rest } = part
      return rest
    },
  }
}

export function openCodeSessionCompactionCreate(input: OpenCodeSessionCompactionCreateInput): OpenCodeSessionCompactionCreateResult {
  const info: OpenCodeSessionCompactionMessageInfo = {
    id: input.messageID,
    role: "user",
    model: input.model,
    sessionID: input.sessionID,
    agent: input.agent,
    time: { created: input.created },
  }
  const part: OpenCodeSessionCompactionPart = {
    id: input.partID,
    messageID: input.messageID,
    sessionID: input.sessionID,
    type: "compaction",
    auto: input.auto,
    ...(input.overflow !== undefined ? { overflow: input.overflow } : {}),
  }
  return { info, part }
}

export function openCodeSessionFilterCompacted(messages: Iterable<OpenCodeSessionCompactionWithParts>): OpenCodeSessionCompactionWithParts[] {
  const result: OpenCodeSessionCompactionWithParts[] = []
  const completed = new Set<string>()
  let retain: string | undefined
  for (const msg of messages) {
    result.push(msg)
    if (retain) {
      if (msg.info.id === retain) break
      continue
    }
    if (msg.info.role === "user" && completed.has(msg.info.id)) {
      const part = msg.parts.find(isCompactionPart)
      if (!part) continue
      if (!part.tail_start_id) break
      retain = part.tail_start_id
      if (msg.info.id === retain) break
      continue
    }
    if (msg.info.role === "user" && completed.has(msg.info.id) && msg.parts.some((part) => part.type === "compaction")) break
    if (msg.info.role === "assistant" && msg.info.summary && msg.info.finish && !msg.info.error) completed.add(String(msg.info.parentID))
  }
  result.reverse()
  const compactionIndex = findLastIndex(result, (msg) =>
    msg.info.role === "user" &&
    msg.parts.some((item) => isCompactionPart(item) && item.tail_start_id !== undefined),
  )
  const compaction = result[compactionIndex]
  const part = compaction?.parts.find((item): item is OpenCodeSessionCompactionPart => isCompactionPart(item) && item.tail_start_id !== undefined)
  const summaryIndex = compaction
    ? result.findIndex(
        (msg, index) =>
          index > compactionIndex &&
          msg.info.role === "assistant" &&
          Boolean(msg.info.summary) &&
          msg.info.parentID === compaction.info.id,
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

export function openCodeSessionCompactionLatest(messages: OpenCodeSessionCompactionWithParts[]): OpenCodeSessionCompactionLatest {
  let user: OpenCodeSessionCompactionMessageInfo | undefined
  let assistant: OpenCodeSessionCompactionMessageInfo | undefined
  let finished: OpenCodeSessionCompactionMessageInfo | undefined
  for (const msg of messages) {
    const info = msg.info
    if (info.role === "user" && (!user || info.id > user.id)) user = info
    if (info.role === "assistant" && (!assistant || info.id > assistant.id)) assistant = info
    if (info.role === "assistant" && info.finish && (!finished || info.id > finished.id)) finished = info
  }
  const tasks = messages.flatMap((message) =>
    finished && message.info.id <= finished.id
      ? []
      : message.parts.filter((part): part is OpenCodeSessionCompactionPart | OpenCodeSessionSubtaskPart => part.type === "compaction" || part.type === "subtask"),
  )
  return {
    ...(user ? { user } : {}),
    ...(assistant ? { assistant } : {}),
    ...(finished ? { finished } : {}),
    tasks,
  }
}

export function captureOpenCodeSessionCompactionEventNativeExactFixture(): OpenCodeSessionCompactionEventNativeExactFixture {
  const bridge = createOpenCodeSessionCompactionEventBridge()
  const created = bridge.create({
    sessionID: "ses_compact",
    messageID: "msg_003",
    partID: "prt_compact",
    agent: "build",
    model: { providerID: "openai", modelID: "gpt-5", variant: "fast" },
    auto: true,
    overflow: true,
    created: 1000,
  })

  const noTailInput = [
    assistant("msg_004", "msg_003", { summary: true, finish: "stop" }),
    withParts(user("msg_003"), [{ ...created.part, tail_start_id: undefined }]),
    assistant("msg_002", "msg_001", { finish: "stop" }),
    withParts(user("msg_001"), [text("msg_001", "prt_old", "old request")]),
  ]

  const tailInput = [
    withParts(user("msg_006"), [text("msg_006", "prt_continue", "continue")]),
    assistant("msg_005", "msg_003", { summary: true, finish: "stop" }),
    withParts(user("msg_003"), [bridge.updateTailStart(created.part, "msg_001")]),
    assistant("msg_002", "msg_001", { finish: "stop" }),
    withParts(user("msg_001"), [text("msg_001", "prt_tail", "retained request")]),
  ]

  const latestInput = [
    withParts(user("msg_010"), [text("msg_010", "prt_user", "done")]),
    assistant("msg_011", "msg_010", { finish: "stop" }),
    withParts(user("msg_012"), [bridge.updateTailStart({ ...created.part, id: "prt_task", messageID: "msg_012" }, "msg_010")]),
    withParts(user("msg_013"), [{
      id: "prt_subtask",
      sessionID: "ses_compact",
      messageID: "msg_013",
      type: "subtask",
      prompt: "inspect",
      description: "Inspect later",
      agent: "build",
    }]),
  ]
  const latest = bridge.latest(latestInput)

  const cases: OpenCodeSessionCompactionEventNativeExactFixtureCase[] = [
    {
      id: "create-compaction-part-shape",
      actual: created,
      expected: {
        info: {
          id: "msg_003",
          role: "user",
          model: { providerID: "openai", modelID: "gpt-5", variant: "fast" },
          sessionID: "ses_compact",
          agent: "build",
          time: { created: 1000 },
        },
        part: {
          id: "prt_compact",
          messageID: "msg_003",
          sessionID: "ses_compact",
          type: "compaction",
          auto: true,
          overflow: true,
        },
      },
    },
    {
      id: "filter-compacted-without-tail-stops-at-summary",
      actual: bridge.filterCompacted(noTailInput).map(serializeMessage),
      expected: [
        { id: "msg_003", role: "user", parts: [{ id: "prt_compact", type: "compaction", auto: true, overflow: true }] },
        { id: "msg_004", role: "assistant", parentID: "msg_003", summary: true, finish: "stop", parts: [] },
      ],
    },
    {
      id: "filter-compacted-tail-reorders-retained-context",
      actual: bridge.filterCompacted(tailInput).map((message) => message.info.id),
      expected: ["msg_003", "msg_005", "msg_001", "msg_002", "msg_006"],
    },
    {
      id: "latest-selects-max-id-and-open-tasks",
      actual: {
        userID: latest.user?.id,
        assistantID: latest.assistant?.id,
        finishedID: latest.finished?.id,
        taskIDs: latest.tasks.map((part) => part.id),
        taskTypes: latest.tasks.map((part) => part.type),
      },
      expected: {
        userID: "msg_013",
        assistantID: "msg_011",
        finishedID: "msg_011",
        taskIDs: ["prt_task", "prt_subtask"],
        taskTypes: ["compaction", "subtask"],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.session.compaction-event" as const,
    portID: "session.compaction-records" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-session-compaction-event-native-exact-fixture" as const,
    replayRef: "session-compaction-event-native-exact:opencode" as const,
    fixtureID: "opencode-session-compaction-event:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#CompactionPart,filterCompacted,latest",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/compaction.ts#create,process,tail_start_id",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeSessionCompactionEventFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeSessionCompactionEventNativeExactFixture(
  fixture: OpenCodeSessionCompactionEventNativeExactFixture,
): OpenCodeSessionCompactionEventNativeExactFixtureVerification {
  const issues: OpenCodeSessionCompactionEventNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeSessionCompactionEventNativeExactFixtureCase["id"][] = [
    "create-compaction-part-shape",
    "filter-compacted-without-tail-stops-at-summary",
    "filter-compacted-tail-reorders-retained-context",
    "latest-selects-max-id-and-open-tasks",
  ]
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-session-compaction-event.schema", "Fixture must use schema version 1.")
  if (fixture.product !== "opencode" || fixture.atomID !== "opencode.session.compaction-event" || fixture.portID !== "session.compaction-records") {
    add("opencode-session-compaction-event.target", "Fixture must target opencode.session.compaction-event and session.compaction-records.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-session-compaction-event.native-claim", "Compaction event fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-session-compaction-event.lossiness", "Native compaction event fixture cannot retain known lossiness.")
  for (const source of ["session/message-v2.ts", "session/compaction.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-session-compaction-event.source-ref", `Missing source ref ${source}.`)
  }
  for (const expectedID of expectedCaseIDs) {
    const item = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!item) {
      add("opencode-session-compaction-event.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (!openCodeSessionCompactionEventSameJSON(item.actual, item.expected)) {
      add("opencode-session-compaction-event.case", "Case actual output must match expected OpenCode compaction event behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeSessionCompactionEventFingerprintObject(withoutFingerprint)) {
    add("opencode-session-compaction-event.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function withParts(info: OpenCodeSessionCompactionMessageInfo, parts: OpenCodeSessionCompactionPartLike[]): OpenCodeSessionCompactionWithParts {
  return { info, parts }
}

function user(id: string): OpenCodeSessionCompactionMessageInfo {
  return { id, role: "user", sessionID: "ses_compact" }
}

function assistant(id: string, parentID: string, input: { summary?: boolean; finish?: string; error?: unknown } = {}): OpenCodeSessionCompactionWithParts {
  return {
    info: {
      id,
      role: "assistant" as const,
      sessionID: "ses_compact",
      parentID,
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.finish !== undefined ? { finish: input.finish } : {}),
      ...(input.error !== undefined ? { error: input.error } : {}),
    },
    parts: [],
  }
}

function text(messageID: string, id: string, value: string): OpenCodeSessionTextPart {
  return {
    id,
    sessionID: "ses_compact",
    messageID,
    type: "text",
    text: value,
  }
}

function isCompactionPart(part: OpenCodeSessionCompactionPartLike): part is OpenCodeSessionCompactionPart {
  return part.type === "compaction"
}

function serializeMessage(message: OpenCodeSessionCompactionWithParts): unknown {
  return removeUndefined({
    id: message.info.id,
    role: message.info.role,
    parentID: message.info.parentID,
    summary: message.info.summary,
    finish: message.info.finish,
    parts: message.parts.map(serializePart),
  })
}

function serializePart(part: OpenCodeSessionCompactionPartLike): unknown {
  if (part.type === "compaction") {
    const compaction = part as OpenCodeSessionCompactionPart
    return removeUndefined({
      id: compaction.id,
      type: compaction.type,
      auto: compaction.auto,
      overflow: compaction.overflow,
      tail_start_id: compaction.tail_start_id,
    })
  }
  return { id: part.id, type: part.type }
}

function findLastIndex<T>(items: T[], predicate: (item: T, index: number) => boolean): number {
  for (let index = items.length - 1; index >= 0; index--) {
    if (predicate(items[index] as T, index)) return index
  }
  return -1
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}

function openCodeSessionCompactionEventSameJSON(left: unknown, right: unknown): boolean {
  return openCodeSessionCompactionEventStableJSON(left) === openCodeSessionCompactionEventStableJSON(right)
}

function openCodeSessionCompactionEventFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeSessionCompactionEventStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeSessionCompactionEventStableJSON(value: unknown): string {
  return JSON.stringify(openCodeSessionCompactionEventSortStable(value))
}

function openCodeSessionCompactionEventSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeSessionCompactionEventSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeSessionCompactionEventSortStable(entry)]),
  )
}
