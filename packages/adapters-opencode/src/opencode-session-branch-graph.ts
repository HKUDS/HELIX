import { createHash } from "node:crypto"

export type OpenCodeSessionBranchGraphMessageRole = "user" | "assistant"

export interface OpenCodeSessionBranchGraphSessionInfo {
  id: string
  title: string
  directory: string
  path?: string | undefined
  workspaceID?: string | undefined
  parentID?: string | undefined
  time?: { created: number; updated: number }
  [key: string]: unknown
}

export interface OpenCodeSessionBranchGraphMessageInfo {
  id: string
  role: OpenCodeSessionBranchGraphMessageRole
  sessionID: string
  parentID?: string | undefined
  [key: string]: unknown
}

export interface OpenCodeSessionBranchGraphPart {
  id: string
  sessionID: string
  messageID: string
  type: string
  tail_start_id?: string | undefined
  [key: string]: unknown
}

export interface OpenCodeSessionBranchGraphMessage {
  info: OpenCodeSessionBranchGraphMessageInfo
  parts: OpenCodeSessionBranchGraphPart[]
}

export interface OpenCodeSessionBranchGraphForkInput {
  original: OpenCodeSessionBranchGraphSessionInfo
  messages: OpenCodeSessionBranchGraphMessage[]
  beforeMessageID?: string | undefined
  newSessionID: string
  newMessageIDs: string[]
  newPartIDs: string[]
  directory: string
  path?: string | undefined
  sessionDefaults?: Record<string, unknown> | undefined
  time?: { created: number; updated: number } | undefined
}

export interface OpenCodeSessionBranchGraphForkResult {
  session: OpenCodeSessionBranchGraphSessionInfo
  messages: OpenCodeSessionBranchGraphMessage[]
  idMap: Record<string, string>
  skippedMessageIDs: string[]
}

export interface OpenCodeSessionBranchGraphBridge {
  getForkedTitle(title: string): string
  fork(input: OpenCodeSessionBranchGraphForkInput): OpenCodeSessionBranchGraphForkResult
  children(input: { sessions: OpenCodeSessionBranchGraphSessionInfo[]; parentID: string }): OpenCodeSessionBranchGraphSessionInfo[]
}

export interface OpenCodeSessionBranchGraphNativeExactFixtureCase {
  id:
    | "fork-title-increments-existing-suffix"
    | "fork-before-message-clones-prefix-and-remaps-parent"
    | "compaction-tail-start-remaps-through-cloned-id-map"
    | "unmapped-assistant-parent-and-compaction-tail-follow-upstream-spread"
    | "children-filter-by-session-parent-id"
  actual: unknown
  expected: unknown
}

export interface OpenCodeSessionBranchGraphNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.session.branch-graph.fork-before-message"
  portID: "session.branch-graph"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-session-branch-graph-native-exact-fixture"
  replayRef: "session-branch-graph-native-exact:opencode"
  fixtureID: "opencode-session-branch-graph:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeSessionBranchGraphNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeSessionBranchGraphNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeSessionBranchGraphNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeSessionBranchGraphNativeExactFixtureIssue[]
}

export function createOpenCodeSessionBranchGraphBridge(): OpenCodeSessionBranchGraphBridge {
  return {
    getForkedTitle: openCodeSessionGetForkedTitle,
    fork: openCodeSessionForkBeforeMessage,
    children(input) {
      return input.sessions.filter((session) => session.parentID === input.parentID)
    },
  }
}

export function openCodeSessionGetForkedTitle(title: string): string {
  const match = title.match(/^(.+) \(fork #(\d+)\)$/)
  if (match) {
    const base = match[1] ?? title
    const num = parseInt(match[2] ?? "0", 10)
    return `${base} (fork #${num + 1})`
  }
  return `${title} (fork #1)`
}

export function openCodeSessionForkBeforeMessage(input: OpenCodeSessionBranchGraphForkInput): OpenCodeSessionBranchGraphForkResult {
  const bridgeSessionDefaults = { ...(input.sessionDefaults ?? {}) }
  delete bridgeSessionDefaults.parentID
  const session = compactRecord({
    ...bridgeSessionDefaults,
    id: input.newSessionID,
    title: openCodeSessionGetForkedTitle(input.original.title),
    directory: input.directory,
    path: input.path,
    workspaceID: input.original.workspaceID,
    time: input.time,
  }) as OpenCodeSessionBranchGraphSessionInfo
  const idMap = new Map<string, string>()
  const clonedMessages: OpenCodeSessionBranchGraphMessage[] = []
  const skippedMessageIDs: string[] = []
  let nextMessageIndex = 0
  let nextPartIndex = 0

  for (let index = 0; index < input.messages.length; index++) {
    const message = input.messages[index]!
    if (input.beforeMessageID && message.info.id >= input.beforeMessageID) {
      skippedMessageIDs.push(...input.messages.slice(index).map((item) => item.info.id))
      break
    }
    const newID = input.newMessageIDs[nextMessageIndex]
    if (!newID) throw new Error(`Missing fork message id for ${message.info.id}`)
    nextMessageIndex += 1
    idMap.set(message.info.id, newID)
    const mappedParentID = message.info.role === "assistant" && message.info.parentID ? idMap.get(message.info.parentID) : undefined
    const clonedInfo = {
      ...message.info,
      sessionID: session.id,
      id: newID,
      ...(mappedParentID ? { parentID: mappedParentID } : {}),
    }
    const clonedParts = message.parts.map((part) => {
      const newPartID = input.newPartIDs[nextPartIndex]
      if (!newPartID) throw new Error(`Missing fork part id for ${part.id}`)
      nextPartIndex += 1
      const clonedPart: OpenCodeSessionBranchGraphPart = {
        ...part,
        id: newPartID,
        messageID: newID,
        sessionID: session.id,
      }
      if (clonedPart.type === "compaction" && clonedPart.tail_start_id) {
        clonedPart.tail_start_id = idMap.get(clonedPart.tail_start_id)
      }
      return clonedPart
    })
    clonedMessages.push({ info: clonedInfo, parts: clonedParts })
  }

  return { session, messages: clonedMessages, idMap: Object.fromEntries(idMap.entries()), skippedMessageIDs }
}

export function captureOpenCodeSessionBranchGraphNativeExactFixture(): OpenCodeSessionBranchGraphNativeExactFixture {
  const bridge = createOpenCodeSessionBranchGraphBridge()
  const root = session("ses_root", "Fix parser", { workspaceID: "wrk_1" })
  const prefixFork = bridge.fork({
    original: root,
    messages: [
      withParts(user("msg_001"), [text("msg_001", "prt_001", "inspect")]),
      withParts(assistant("msg_002", "msg_001"), [text("msg_002", "prt_002", "done")]),
      withParts(user("msg_003"), [text("msg_003", "prt_003", "next")]),
    ],
    beforeMessageID: "msg_003",
    newSessionID: "ses_fork",
    newMessageIDs: ["msg_new_001", "msg_new_002"],
    newPartIDs: ["prt_new_001", "prt_new_002"],
    directory: "/repo",
    path: "packages/app",
    sessionDefaults: {
      slug: "abc123",
      projectID: "prj_1",
      version: "1.0.0",
      cost: 0,
      tokens: emptyTokens(),
      parentID: "ses_should_not_survive",
    },
    time: { created: 100, updated: 100 },
  })
  const compactionFork = bridge.fork({
    original: session("ses_compact_root", "Compact me"),
    messages: [
      withParts(user("msg_001"), [text("msg_001", "prt_001", "tail")]),
      withParts(user("msg_002"), [compaction("msg_002", "prt_002", "msg_001")]),
    ],
    newSessionID: "ses_compact_fork",
    newMessageIDs: ["msg_new_001", "msg_new_002"],
    newPartIDs: ["prt_new_001", "prt_new_002"],
    directory: "/repo",
    path: ".",
  })
  const unmappedFork = bridge.fork({
    original: session("ses_unmapped_root", "Odd order"),
    messages: [
      withParts(assistant("msg_001", "msg_missing"), [compaction("msg_001", "prt_001", "msg_missing")]),
    ],
    newSessionID: "ses_unmapped_fork",
    newMessageIDs: ["msg_new_001"],
    newPartIDs: ["prt_new_001"],
    directory: "/repo",
  })
  const unmappedPart = unmappedFork.messages[0]?.parts[0]
  const cases: OpenCodeSessionBranchGraphNativeExactFixtureCase[] = [
    {
      id: "fork-title-increments-existing-suffix",
      actual: [
        bridge.getForkedTitle("Fix parser"),
        bridge.getForkedTitle("Fix parser (fork #1)"),
        bridge.getForkedTitle("Fix parser (fork #9)"),
      ],
      expected: ["Fix parser (fork #1)", "Fix parser (fork #2)", "Fix parser (fork #10)"],
    },
    {
      id: "fork-before-message-clones-prefix-and-remaps-parent",
      actual: summarizeFork(prefixFork),
      expected: {
        session: {
          id: "ses_fork",
          title: "Fix parser (fork #1)",
          directory: "/repo",
          path: "packages/app",
          workspaceID: "wrk_1",
          slug: "abc123",
          projectID: "prj_1",
          version: "1.0.0",
          cost: 0,
          tokens: emptyTokens(),
          time: { created: 100, updated: 100 },
        },
        idMap: { msg_001: "msg_new_001", msg_002: "msg_new_002" },
        skippedMessageIDs: ["msg_003"],
        messages: [
          {
            id: "msg_new_001",
            role: "user",
            sessionID: "ses_fork",
            parentID: undefined,
            parts: [{ id: "prt_new_001", messageID: "msg_new_001", sessionID: "ses_fork", type: "text", text: "inspect" }],
          },
          {
            id: "msg_new_002",
            role: "assistant",
            sessionID: "ses_fork",
            parentID: "msg_new_001",
            parts: [{ id: "prt_new_002", messageID: "msg_new_002", sessionID: "ses_fork", type: "text", text: "done" }],
          },
        ],
      },
    },
    {
      id: "compaction-tail-start-remaps-through-cloned-id-map",
      actual: summarizeFork(compactionFork).messages,
      expected: [
        {
          id: "msg_new_001",
          role: "user",
          sessionID: "ses_compact_fork",
          parentID: undefined,
          parts: [{ id: "prt_new_001", messageID: "msg_new_001", sessionID: "ses_compact_fork", type: "text", text: "tail" }],
        },
        {
          id: "msg_new_002",
          role: "user",
          sessionID: "ses_compact_fork",
          parentID: undefined,
          parts: [{
            id: "prt_new_002",
            messageID: "msg_new_002",
            sessionID: "ses_compact_fork",
            type: "compaction",
            auto: true,
            tail_start_id: "msg_new_001",
          }],
        },
      ],
    },
    {
      id: "unmapped-assistant-parent-and-compaction-tail-follow-upstream-spread",
      actual: {
        parentID: unmappedFork.messages[0]?.info.parentID,
        partKeys: unmappedPart ? Object.keys(unmappedPart).sort() : [],
        tailStartValue: unmappedPart?.tail_start_id ?? null,
      },
      expected: {
        parentID: "msg_missing",
        partKeys: ["auto", "id", "messageID", "sessionID", "tail_start_id", "type"],
        tailStartValue: null,
      },
    },
    {
      id: "children-filter-by-session-parent-id",
      actual: bridge.children({
        sessions: [
          session("ses_root", "Root"),
          session("ses_child_b", "Child B", { parentID: "ses_root" }),
          session("ses_other", "Other", { parentID: "ses_else" }),
          session("ses_child_a", "Child A", { parentID: "ses_root" }),
        ],
        parentID: "ses_root",
      }).map((item) => item.id).sort(),
      expected: ["ses_child_a", "ses_child_b"],
    },
  ]
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.session.branch-graph.fork-before-message" as const,
    portID: "session.branch-graph" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-session-branch-graph-native-exact-fixture" as const,
    replayRef: "session-branch-graph-native-exact:opencode" as const,
    fixtureID: "opencode-session-branch-graph:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.ts#getForkedTitle,ForkInput,Session.fork,Session.children",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#Part,CompactionPart",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.sql.ts#SessionTable.parent_id",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeSessionBranchGraphFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeSessionBranchGraphNativeExactFixture(
  fixture: OpenCodeSessionBranchGraphNativeExactFixture,
): OpenCodeSessionBranchGraphNativeExactFixtureVerification {
  const issues: OpenCodeSessionBranchGraphNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeSessionBranchGraphNativeExactFixtureCase["id"][] = [
    "fork-title-increments-existing-suffix",
    "fork-before-message-clones-prefix-and-remaps-parent",
    "compaction-tail-start-remaps-through-cloned-id-map",
    "unmapped-assistant-parent-and-compaction-tail-follow-upstream-spread",
    "children-filter-by-session-parent-id",
  ]
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-session-branch-graph.schema", "Fixture must use schema version 1.")
  if (fixture.product !== "opencode" || fixture.atomID !== "opencode.session.branch-graph.fork-before-message" || fixture.portID !== "session.branch-graph") {
    add("opencode-session-branch-graph.target", "Fixture must target opencode.session.branch-graph.fork-before-message and session.branch-graph.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-session-branch-graph.native-claim", "Branch graph fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-session-branch-graph.lossiness", "Native branch graph fixture cannot retain known lossiness.")
  for (const source of ["session/session.ts", "session/message-v2.ts", "session/session.sql.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-session-branch-graph.source-ref", `Missing source ref ${source}.`)
  }
  for (const expectedID of expectedCaseIDs) {
    const item = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!item) {
      add("opencode-session-branch-graph.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (!openCodeSessionBranchGraphSameJSON(item.actual, item.expected)) {
      add("opencode-session-branch-graph.case", "Case actual output must match expected OpenCode fork-before-message behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeSessionBranchGraphFingerprintObject(withoutFingerprint)) {
    add("opencode-session-branch-graph.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function session(id: string, title: string, input: Partial<OpenCodeSessionBranchGraphSessionInfo> = {}): OpenCodeSessionBranchGraphSessionInfo {
  return compactRecord({
    id,
    title,
    directory: input.directory ?? "/repo",
    path: input.path,
    workspaceID: input.workspaceID,
    parentID: input.parentID,
  }) as OpenCodeSessionBranchGraphSessionInfo
}

function user(id: string): OpenCodeSessionBranchGraphMessageInfo {
  return { id, role: "user", sessionID: "ses_root" }
}

function assistant(id: string, parentID: string): OpenCodeSessionBranchGraphMessageInfo {
  return { id, role: "assistant", sessionID: "ses_root", parentID }
}

function withParts(info: OpenCodeSessionBranchGraphMessageInfo, parts: OpenCodeSessionBranchGraphPart[]): OpenCodeSessionBranchGraphMessage {
  return { info, parts }
}

function text(messageID: string, id: string, value: string): OpenCodeSessionBranchGraphPart {
  return { id, sessionID: "ses_root", messageID, type: "text", text: value }
}

function compaction(messageID: string, id: string, tailStartID: string): OpenCodeSessionBranchGraphPart {
  return { id, sessionID: "ses_root", messageID, type: "compaction", auto: true, tail_start_id: tailStartID }
}

interface OpenCodeSessionBranchGraphForkSummary {
  session: Record<string, unknown>
  idMap: Record<string, string>
  skippedMessageIDs: string[]
  messages: Array<{
    id: string
    role: OpenCodeSessionBranchGraphMessageRole
    sessionID: string
    parentID?: string | undefined
    parts: Record<string, unknown>[]
  }>
}

function summarizeFork(result: OpenCodeSessionBranchGraphForkResult): OpenCodeSessionBranchGraphForkSummary {
  return {
    session: compactRecord(result.session),
    idMap: result.idMap,
    skippedMessageIDs: result.skippedMessageIDs,
    messages: result.messages.map((message) => ({
      id: message.info.id,
      role: message.info.role,
      sessionID: message.info.sessionID,
      parentID: message.info.parentID,
      parts: message.parts.map((part) => compactRecord({ ...part })),
    })),
  }
}

function emptyTokens(): Record<string, Record<string, number> | number> {
  return {
    input: 0,
    output: 0,
    reasoning: 0,
    cache: { read: 0, write: 0 },
  }
}

function compactRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined))
}

function openCodeSessionBranchGraphSameJSON(left: unknown, right: unknown): boolean {
  return openCodeSessionBranchGraphStableJSON(left) === openCodeSessionBranchGraphStableJSON(right)
}

function openCodeSessionBranchGraphFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeSessionBranchGraphStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeSessionBranchGraphStableJSON(value: unknown): string {
  return JSON.stringify(openCodeSessionBranchGraphSortStable(value))
}

function openCodeSessionBranchGraphSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeSessionBranchGraphSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeSessionBranchGraphSortStable(entry)]),
  )
}
