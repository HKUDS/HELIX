import { createHash } from "node:crypto"

type MutableRow = Record<string, unknown>

export type OpenCodeSessionSyncEventType =
  | "session.created"
  | "session.updated"
  | "session.deleted"
  | "message.updated"
  | "message.removed"
  | "message.part.updated"
  | "message.part.removed"

export interface OpenCodeSessionSyncEventProjectorState {
  sessions: Map<string, MutableRow>
  messages: Map<string, MutableRow>
  parts: Map<string, MutableRow>
  workspaces: Map<string, MutableRow>
  operations: MutableRow[]
  warnings: MutableRow[]
}

export interface OpenCodeSessionSyncEventProjector {
  createState(): OpenCodeSessionSyncEventProjectorState
  toSessionRow(info: MutableRow): MutableRow
  fromSessionRow(row: MutableRow): MutableRow
  toPartialRow(info: MutableRow): MutableRow
  project(input: {
    state: OpenCodeSessionSyncEventProjectorState
    type: OpenCodeSessionSyncEventType | `${OpenCodeSessionSyncEventType}.1`
    data: MutableRow
  }): void
}

export interface OpenCodeSessionSyncEventProjectorNativeExactFixtureCase {
  id:
    | "session-row-roundtrip-and-partial-update"
    | "session-created-updated-deleted-workspace-touch"
    | "message-upsert-remove-and-usage-rollback"
    | "part-update-remove-usage-delta"
    | "late-foreign-updates-are-ignored"
  actual: unknown
  expected: unknown
}

export interface OpenCodeSessionSyncEventProjectorNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.session.projector.syncevent"
  portID: "session.projector"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-session-syncevent-projector-native-exact-fixture"
  replayRef: "session-syncevent-projector-native-exact:opencode"
  fixtureID: "opencode-session-syncevent-projector:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeSessionSyncEventProjectorNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeSessionSyncEventProjectorNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeSessionSyncEventProjectorNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeSessionSyncEventProjectorNativeExactFixtureIssue[]
}

const emptyTokens = { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } }

export function createOpenCodeSessionSyncEventProjector(options: { now?: () => number } = {}): OpenCodeSessionSyncEventProjector {
  const now = options.now ?? (() => Date.now())

  function toSessionRow(info: MutableRow): MutableRow {
    const tokens = isRecord(info.tokens) ? info.tokens : emptyTokens
    const cache = isRecord(tokens.cache) ? tokens.cache : emptyTokens.cache
    const share = isRecord(info.share) ? info.share : undefined
    const summary = isRecord(info.summary) ? info.summary : undefined
    const time = isRecord(info.time) ? info.time : {}
    return {
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
    }
  }

  function fromSessionRow(row: MutableRow): MutableRow {
    const hasSummary = row.summary_additions !== null || row.summary_deletions !== null || row.summary_files !== null
    const model = isRecord(row.model) ? row.model : undefined
    return {
      id: row.id,
      slug: row.slug,
      projectID: row.project_id,
      workspaceID: row.workspace_id ?? undefined,
      directory: row.directory,
      path: row.path ?? undefined,
      parentID: row.parent_id ?? undefined,
      title: row.title,
      agent: row.agent ?? undefined,
      model: model ? { id: model.id, providerID: model.providerID, variant: model.variant } : undefined,
      version: row.version,
      summary: hasSummary
        ? {
            additions: row.summary_additions ?? 0,
            deletions: row.summary_deletions ?? 0,
            files: row.summary_files ?? 0,
            diffs: row.summary_diffs ?? undefined,
          }
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
      time: {
        created: row.time_created,
        updated: row.time_updated,
        compacting: row.time_compacting ?? undefined,
        archived: row.time_archived ?? undefined,
      },
    }
  }

  function grab<X>(obj: MutableRow | null | undefined, field: string, cb?: (value: MutableRow) => X): X | unknown {
    if (obj == undefined || !(field in obj)) return undefined
    const value = obj[field]
    if (value && typeof value === "object" && !Array.isArray(value) && cb) return cb(value as MutableRow)
    if (value === undefined) {
      throw new Error("Session update failure: pass `null` to clear a field instead of `undefined`: " + JSON.stringify(obj))
    }
    return value
  }

  function toPartialRow(info: MutableRow): MutableRow {
    const row: MutableRow = {
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
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined))
  }

  function applyUsage(state: OpenCodeSessionSyncEventProjectorState, sessionID: string, value: MutableRow, sign = 1) {
    const row = state.sessions.get(sessionID)
    if (!row) return
    const tokens = isRecord(value.tokens) ? value.tokens : emptyTokens
    const cache = isRecord(tokens.cache) ? tokens.cache : emptyTokens.cache
    row.cost = asNumber(row.cost, 0) + asNumber(value.cost, 0) * sign
    row.tokens_input = asNumber(row.tokens_input, 0) + asNumber(tokens.input, 0) * sign
    row.tokens_output = asNumber(row.tokens_output, 0) + asNumber(tokens.output, 0) * sign
    row.tokens_reasoning = asNumber(row.tokens_reasoning, 0) + asNumber(tokens.reasoning, 0) * sign
    row.tokens_cache_read = asNumber(row.tokens_cache_read, 0) + asNumber(cache.read, 0) * sign
    row.tokens_cache_write = asNumber(row.tokens_cache_write, 0) + asNumber(cache.write, 0) * sign
    state.operations.push({ op: "session.applyUsage", sessionID, sign, cost: value.cost, tokens: cloneForFixture(tokens) })
  }

  function project(input: { state: OpenCodeSessionSyncEventProjectorState; type: OpenCodeSessionSyncEventType | `${OpenCodeSessionSyncEventType}.1`; data: MutableRow }) {
    const type = input.type.endsWith(".1") ? input.type.slice(0, -2) as OpenCodeSessionSyncEventType : input.type
    const data = input.data
    if (type === "session.created") {
      const info = data.info as MutableRow
      const row = toSessionRow(info)
      input.state.sessions.set(String(info.id), row)
      input.state.operations.push({ op: "session.insert", row: cloneForFixture(row) })
      if (info.workspaceID) {
        input.state.workspaces.set(String(info.workspaceID), { id: info.workspaceID, time_used: now() })
        input.state.operations.push({ op: "workspace.touch", workspaceID: info.workspaceID })
      }
      return
    }
    if (type === "session.updated") {
      const sessionID = String(data.sessionID)
      const current = input.state.sessions.get(sessionID)
      if (!current) throw new Error(`Session not found: ${sessionID}`)
      const partial = toPartialRow(data.info as MutableRow)
      Object.assign(current, partial)
      input.state.operations.push({ op: "session.update", sessionID, row: cloneForFixture(partial) })
      return
    }
    if (type === "session.deleted") {
      const sessionID = String(data.sessionID)
      input.state.sessions.delete(sessionID)
      input.state.operations.push({ op: "session.delete", sessionID })
      return
    }
    if (type === "message.updated") {
      const info = data.info as MutableRow
      const sessionID = String(info.sessionID)
      const id = String(info.id)
      if (!input.state.sessions.has(sessionID)) {
        input.state.warnings.push({ message: "ignored late message update", messageID: id, sessionID })
        return
      }
      const { id: _id, sessionID: _sessionID, ...rest } = info
      const existing = input.state.messages.get(id)
      const row = existing ?? { id, session_id: sessionID, time_created: readTimeCreated(info), data: rest }
      row.data = rest
      input.state.messages.set(id, row)
      input.state.operations.push({ op: existing ? "message.update" : "message.insert", row: cloneForFixture(row) })
      return
    }
    if (type === "message.removed") {
      const sessionID = String(data.sessionID)
      const messageID = String(data.messageID)
      for (const [partID, row] of [...input.state.parts]) {
        if (row.message_id === messageID && row.session_id === sessionID) {
          const previous = usage(row.data)
          if (previous) applyUsage(input.state, sessionID, previous, -1)
          input.state.parts.delete(partID)
        }
      }
      input.state.messages.delete(messageID)
      input.state.operations.push({ op: "message.delete", sessionID, messageID })
      return
    }
    if (type === "message.part.updated") {
      const part = data.part as MutableRow
      const id = String(part.id)
      const sessionID = String(part.sessionID)
      const messageID = String(part.messageID)
      if (!input.state.sessions.has(sessionID) || !input.state.messages.has(messageID)) {
        input.state.warnings.push({ message: "ignored late part update", partID: id, messageID, sessionID })
        return
      }
      const previousRow = input.state.parts.get(id)
      const previous = previousRow && usage(previousRow.data)
      const { id: _id, messageID: _messageID, sessionID: _sessionID, ...rest } = part
      const row = { id, message_id: messageID, session_id: sessionID, time_created: data.time, data: rest }
      input.state.parts.set(id, row)
      if (previous && previousRow) applyUsage(input.state, String(previousRow.session_id), previous, -1)
      const next = usage(part)
      if (next) applyUsage(input.state, sessionID, next)
      input.state.operations.push({ op: previousRow ? "part.update" : "part.insert", row: cloneForFixture(row) })
      return
    }
    if (type === "message.part.removed") {
      const sessionID = String(data.sessionID)
      const partID = String(data.partID)
      const row = input.state.parts.get(partID)
      const previous = row && usage(row.data)
      if (previous) applyUsage(input.state, sessionID, previous, -1)
      input.state.parts.delete(partID)
      input.state.operations.push({ op: "part.delete", sessionID, partID })
    }
  }

  return {
    createState() {
      return {
        sessions: new Map<string, MutableRow>(),
        messages: new Map<string, MutableRow>(),
        parts: new Map<string, MutableRow>(),
        workspaces: new Map<string, MutableRow>(),
        operations: [],
        warnings: [],
      }
    },
    toSessionRow,
    fromSessionRow,
    toPartialRow,
    project,
  }
}

export function captureOpenCodeSessionSyncEventProjectorNativeExactFixture(): OpenCodeSessionSyncEventProjectorNativeExactFixture {
  const projector = createOpenCodeSessionSyncEventProjector({ now: () => 1234 })
  const cases: OpenCodeSessionSyncEventProjectorNativeExactFixtureCase[] = []
  const info = sessionInfoFixture()

  cases.push({
    id: "session-row-roundtrip-and-partial-update",
    actual: {
      row: projector.toSessionRow(info),
      roundtrip: projector.fromSessionRow(projector.toSessionRow(info)),
      partial: projector.toPartialRow({
        title: "renamed",
        share: { url: null },
        summary: { additions: 3, deletions: 0 },
        tokens: { input: 7, cache: { read: 2 } },
        revert: null,
        time: { updated: 20, compacting: null },
      }),
      undefinedError: captureError(() => projector.toPartialRow({ title: undefined })),
    },
    expected: {
      row: sessionRowFixture(),
      roundtrip: roundtripInfoFixture(),
      partial: {
        title: "renamed",
        share_url: null,
        summary_additions: 3,
        summary_deletions: 0,
        tokens_input: 7,
        tokens_cache_read: 2,
        revert: null,
        time_updated: 20,
        time_compacting: null,
      },
      undefinedError: "Session update failure: pass `null` to clear a field instead of `undefined`: {}",
    },
  })

  const sessionState = projector.createState()
  projector.project({ state: sessionState, type: "session.created.1", data: { sessionID: "ses_native", info } })
  projector.project({ state: sessionState, type: "session.updated.1", data: { sessionID: "ses_native", info: { title: "native updated", time: { updated: 22 } } } })
  projector.project({ state: sessionState, type: "session.deleted.1", data: { sessionID: "ses_native", info } })
  cases.push({
    id: "session-created-updated-deleted-workspace-touch",
    actual: {
      sessions: mapToRecord(sessionState.sessions),
      workspaces: mapToRecord(sessionState.workspaces),
      operations: sessionState.operations,
    },
    expected: {
      sessions: {},
      workspaces: { wsp_native: { id: "wsp_native", time_used: 1234 } },
      operations: [
        { op: "session.insert", row: sessionRowFixture() },
        { op: "workspace.touch", workspaceID: "wsp_native" },
        { op: "session.update", sessionID: "ses_native", row: { title: "native updated", time_updated: 22 } },
        { op: "session.delete", sessionID: "ses_native" },
      ],
    },
  })

  const messageState = projector.createState()
  messageState.sessions.set("ses_native", sessionRowFixture())
  projector.project({ state: messageState, type: "message.updated.1", data: { sessionID: "ses_native", info: messageInfoFixture("user") } })
  projector.project({ state: messageState, type: "message.updated.1", data: { sessionID: "ses_native", info: messageInfoFixture("assistant") } })
  projector.project({ state: messageState, type: "message.part.updated.1", data: { sessionID: "ses_native", messageID: "msg_native", part: stepFinishPartFixture("prt_step", 2), time: 12 } })
  projector.project({ state: messageState, type: "message.removed.1", data: { sessionID: "ses_native", messageID: "msg_native" } })
  cases.push({
    id: "message-upsert-remove-and-usage-rollback",
    actual: {
      sessions: mapToRecord(messageState.sessions),
      messages: mapToRecord(messageState.messages),
      parts: mapToRecord(messageState.parts),
      operations: messageState.operations,
    },
    expected: {
      sessions: { ses_native: sessionRowFixture() },
      messages: {},
      parts: {},
      operations: [
        { op: "message.insert", row: { id: "msg_native", session_id: "ses_native", time_created: 10, data: { role: "user", time: { created: 10 }, model: "model-a" } } },
        { op: "message.update", row: { id: "msg_native", session_id: "ses_native", time_created: 10, data: { role: "assistant", time: { created: 10 }, model: "model-a" } } },
        { op: "session.applyUsage", sessionID: "ses_native", sign: 1, cost: 2, tokens: stepFinishTokens(2) },
        { op: "part.insert", row: { id: "prt_step", message_id: "msg_native", session_id: "ses_native", time_created: 12, data: stepFinishPartData(2) } },
        { op: "session.applyUsage", sessionID: "ses_native", sign: -1, cost: 2, tokens: stepFinishTokens(2) },
        { op: "message.delete", sessionID: "ses_native", messageID: "msg_native" },
      ],
    },
  })

  const partState = projector.createState()
  partState.sessions.set("ses_native", sessionRowFixture())
  partState.messages.set("msg_native", { id: "msg_native", session_id: "ses_native", time_created: 10, data: {} })
  projector.project({ state: partState, type: "message.part.updated.1", data: { sessionID: "ses_native", messageID: "msg_native", part: stepFinishPartFixture("prt_step", 1), time: 12 } })
  projector.project({ state: partState, type: "message.part.updated.1", data: { sessionID: "ses_native", messageID: "msg_native", part: stepFinishPartFixture("prt_step", 3), time: 13 } })
  projector.project({ state: partState, type: "message.part.removed.1", data: { sessionID: "ses_native", messageID: "msg_native", partID: "prt_step" } })
  cases.push({
    id: "part-update-remove-usage-delta",
    actual: {
      sessions: mapToRecord(partState.sessions),
      parts: mapToRecord(partState.parts),
      operations: partState.operations,
    },
    expected: {
      sessions: { ses_native: sessionRowFixture() },
      parts: {},
      operations: [
        { op: "session.applyUsage", sessionID: "ses_native", sign: 1, cost: 1, tokens: stepFinishTokens(1) },
        { op: "part.insert", row: { id: "prt_step", message_id: "msg_native", session_id: "ses_native", time_created: 12, data: stepFinishPartData(1) } },
        { op: "session.applyUsage", sessionID: "ses_native", sign: -1, cost: 1, tokens: stepFinishTokens(1) },
        { op: "session.applyUsage", sessionID: "ses_native", sign: 1, cost: 3, tokens: stepFinishTokens(3) },
        { op: "part.update", row: { id: "prt_step", message_id: "msg_native", session_id: "ses_native", time_created: 13, data: stepFinishPartData(3) } },
        { op: "session.applyUsage", sessionID: "ses_native", sign: -1, cost: 3, tokens: stepFinishTokens(3) },
        { op: "part.delete", sessionID: "ses_native", partID: "prt_step" },
      ],
    },
  })

  const lateState = projector.createState()
  projector.project({ state: lateState, type: "message.updated.1", data: { sessionID: "missing", info: messageInfoFixture("user") } })
  projector.project({ state: lateState, type: "message.part.updated.1", data: { sessionID: "missing", messageID: "missing_msg", part: stepFinishPartFixture("prt_late", 1), time: 1 } })
  cases.push({
    id: "late-foreign-updates-are-ignored",
    actual: {
      messages: mapToRecord(lateState.messages),
      parts: mapToRecord(lateState.parts),
      warnings: lateState.warnings,
    },
    expected: {
      messages: {},
      parts: {},
      warnings: [
        { message: "ignored late message update", messageID: "msg_native", sessionID: "ses_native" },
        { message: "ignored late part update", partID: "prt_late", messageID: "msg_native", sessionID: "ses_native" },
      ],
    },
  })

  const fixtureWithoutFingerprint: Omit<OpenCodeSessionSyncEventProjectorNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.session.projector.syncevent",
    portID: "session.projector",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-session-syncevent-projector-native-exact-fixture",
    replayRef: "session-syncevent-projector-native-exact:opencode",
    fixtureID: "opencode-session-syncevent-projector:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/projectors.ts#toPartialRow,Session.Event,MessageV2.Event,usage,applyUsage",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.ts#toRow,fromRow,Event",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.sql.ts#SessionTable,MessageTable,PartTable",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#Event,StepFinishPart",
    ],
    cases,
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeSessionSyncEventProjectorNativeExactFixture(
  fixture: OpenCodeSessionSyncEventProjectorNativeExactFixture,
): OpenCodeSessionSyncEventProjectorNativeExactFixtureVerification {
  const issues: OpenCodeSessionSyncEventProjectorNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeSessionSyncEventProjectorNativeExactFixtureCase["id"][] = [
    "session-row-roundtrip-and-partial-update",
    "session-created-updated-deleted-workspace-touch",
    "message-upsert-remove-and-usage-rollback",
    "part-update-remove-usage-delta",
    "late-foreign-updates-are-ignored",
  ]
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-session-syncevent-projector.schema", "Fixture must use schema version 1.")
  if (fixture.product !== "opencode" || fixture.atomID !== "opencode.session.projector.syncevent" || fixture.portID !== "session.projector") {
    add("opencode-session-syncevent-projector.target", "Fixture must target opencode.session.projector.syncevent and session.projector.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-session-syncevent-projector.native-claim", "Session SyncEvent projector fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-session-syncevent-projector.lossiness", "Native Session SyncEvent projector fixture cannot retain known lossiness.")
  for (const source of ["session/projectors.ts", "session/session.ts", "session/session.sql.ts", "session/message-v2.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-session-syncevent-projector.source-ref", `Missing source ref ${source}.`)
  }
  for (const expectedID of expectedCaseIDs) {
    const item = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!item) {
      add("opencode-session-syncevent-projector.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (!sameJSON(item.actual, item.expected)) {
      add("opencode-session-syncevent-projector.case", "Case actual output must match expected OpenCode session projector behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    add("opencode-session-syncevent-projector.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function usage(part: unknown): MutableRow | undefined {
  if (!isRecord(part)) return undefined
  if (part.type !== "step-finish") return undefined
  if (!("cost" in part) || !("tokens" in part)) return undefined
  return { cost: part.cost, tokens: part.tokens }
}

function readTimeCreated(info: MutableRow): unknown {
  return isRecord(info.time) ? info.time.created : undefined
}

function sessionInfoFixture(): MutableRow {
  return {
    id: "ses_native",
    projectID: "prj_native",
    workspaceID: "wsp_native",
    parentID: "ses_parent",
    slug: "native-session",
    directory: "/repo",
    path: "packages/demo",
    title: "Native Session",
    agent: "build",
    model: { id: "model-a", providerID: "provider-a", variant: "fast" },
    version: "1.0.0",
    share: { url: "https://share.example/ses_native" },
    summary: { additions: 1, deletions: 2, files: 3, diffs: [{ path: "a.ts" }] },
    cost: 4,
    tokens: stepFinishTokens(5),
    revert: { messageID: "msg_native", partID: "prt_step" },
    permission: [{ type: "allow", pattern: "*" }],
    time: { created: 10, updated: 11, compacting: 12, archived: 13 },
  }
}

function sessionRowFixture(): MutableRow {
  return {
    id: "ses_native",
    project_id: "prj_native",
    workspace_id: "wsp_native",
    parent_id: "ses_parent",
    slug: "native-session",
    directory: "/repo",
    path: "packages/demo",
    title: "Native Session",
    agent: "build",
    model: { id: "model-a", providerID: "provider-a", variant: "fast" },
    version: "1.0.0",
    share_url: "https://share.example/ses_native",
    summary_additions: 1,
    summary_deletions: 2,
    summary_files: 3,
    summary_diffs: [{ path: "a.ts" }],
    cost: 4,
    tokens_input: 5,
    tokens_output: 6,
    tokens_reasoning: 7,
    tokens_cache_read: 8,
    tokens_cache_write: 9,
    revert: { messageID: "msg_native", partID: "prt_step" },
    permission: [{ type: "allow", pattern: "*" }],
    time_created: 10,
    time_updated: 11,
    time_compacting: 12,
    time_archived: 13,
  }
}

function roundtripInfoFixture(): MutableRow {
  return {
    id: "ses_native",
    slug: "native-session",
    projectID: "prj_native",
    workspaceID: "wsp_native",
    directory: "/repo",
    path: "packages/demo",
    parentID: "ses_parent",
    title: "Native Session",
    agent: "build",
    model: { id: "model-a", providerID: "provider-a", variant: "fast" },
    version: "1.0.0",
    summary: { additions: 1, deletions: 2, files: 3, diffs: [{ path: "a.ts" }] },
    cost: 4,
    tokens: { input: 5, output: 6, reasoning: 7, cache: { read: 8, write: 9 } },
    share: { url: "https://share.example/ses_native" },
    revert: { messageID: "msg_native", partID: "prt_step" },
    permission: [{ type: "allow", pattern: "*" }],
    time: { created: 10, updated: 11, compacting: 12, archived: 13 },
  }
}

function messageInfoFixture(role: string): MutableRow {
  return {
    id: "msg_native",
    sessionID: "ses_native",
    role,
    time: { created: 10 },
    model: "model-a",
  }
}

function stepFinishTokens(seed: number): MutableRow {
  return {
    input: seed,
    output: seed + 1,
    reasoning: seed + 2,
    cache: { read: seed + 3, write: seed + 4 },
  }
}

function stepFinishPartFixture(partID: string, seed: number): MutableRow {
  return {
    id: partID,
    sessionID: "ses_native",
    messageID: "msg_native",
    type: "step-finish",
    reason: "stop",
    cost: seed,
    tokens: stepFinishTokens(seed),
  }
}

function stepFinishPartData(seed: number): MutableRow {
  return {
    type: "step-finish",
    reason: "stop",
    cost: seed,
    tokens: stepFinishTokens(seed),
  }
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback
}

function isRecord(value: unknown): value is MutableRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function captureError(fn: () => unknown): string | undefined {
  try {
    fn()
    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

function mapToRecord<T>(map: Map<string, T>): Record<string, T> {
  return Object.fromEntries([...map.entries()].sort(([left], [right]) => left.localeCompare(right)))
}

function cloneForFixture<T>(input: T): T {
  return structuredClone(input)
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
}

function fingerprintObject(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === undefined) return "undefined"
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
