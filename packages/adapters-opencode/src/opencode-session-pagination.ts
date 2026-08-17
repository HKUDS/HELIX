import { createHash } from "node:crypto"

export interface OpenCodeSessionPaginationCursor {
  id: string
  time: number
}

export interface OpenCodeSessionPaginationMessageRow {
  id: string
  session_id: string
  time_created: number
  data: Record<string, unknown>
}

export interface OpenCodeSessionPaginationPartRow {
  id: string
  session_id: string
  message_id: string
  data: Record<string, unknown>
}

export interface OpenCodeSessionPaginationWithParts {
  info: Record<string, unknown>
  parts: Array<Record<string, unknown>>
}

export interface OpenCodeSessionPaginationPageResult {
  items: OpenCodeSessionPaginationWithParts[]
  more: boolean
  cursor?: string
}

export interface OpenCodeSessionPaginationBridge {
  cursor: {
    encode(input: OpenCodeSessionPaginationCursor): string
    decode(input: string): OpenCodeSessionPaginationCursor
  }
  older(row: OpenCodeSessionPaginationMessageRow, cursor: OpenCodeSessionPaginationCursor): boolean
  hydrate(input: {
    messageRows: OpenCodeSessionPaginationMessageRow[]
    partRows: OpenCodeSessionPaginationPartRow[]
  }): OpenCodeSessionPaginationWithParts[]
  page(input: {
    sessionID: string
    limit: number
    before?: string
    messageRows: OpenCodeSessionPaginationMessageRow[]
    partRows: OpenCodeSessionPaginationPartRow[]
    sessionExists?: boolean
  }): OpenCodeSessionPaginationPageResult
  stream(input: {
    sessionID: string
    messageRows: OpenCodeSessionPaginationMessageRow[]
    partRows: OpenCodeSessionPaginationPartRow[]
    size?: number
    sessionExists?: boolean
  }): OpenCodeSessionPaginationWithParts[]
}

export interface OpenCodeSessionPaginationNativeExactFixtureCase {
  id:
    | "cursor-base64url-roundtrip"
    | "page-descending-query-reversed-items-and-tail-cursor"
    | "page-before-cursor-uses-older-time-or-id"
    | "empty-existing-session-and-missing-session"
    | "stream-yields-newest-to-oldest-across-pages"
  actual: unknown
  expected: unknown
}

export interface OpenCodeSessionPaginationNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.session.pagination.update-time-cursor"
  portID: "session.pagination"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-session-pagination-native-exact-fixture"
  replayRef: "session-pagination-native-exact:opencode"
  fixtureID: "opencode-session-pagination:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeSessionPaginationNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeSessionPaginationNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeSessionPaginationNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeSessionPaginationNativeExactFixtureIssue[]
}

export function createOpenCodeSessionPaginationBridge(): OpenCodeSessionPaginationBridge {
  const cursor = {
    encode(input: OpenCodeSessionPaginationCursor) {
      return Buffer.from(JSON.stringify(input)).toString("base64url")
    },
    decode(input: string) {
      const value = JSON.parse(Buffer.from(input, "base64url").toString("utf8")) as unknown
      if (!isCursor(value)) throw new Error("Invalid MessageV2 cursor")
      return value
    },
  }

  const older = (row: OpenCodeSessionPaginationMessageRow, marker: OpenCodeSessionPaginationCursor) =>
    row.time_created < marker.time || (row.time_created === marker.time && row.id < marker.id)

  function hydrate(input: {
    messageRows: OpenCodeSessionPaginationMessageRow[]
    partRows: OpenCodeSessionPaginationPartRow[]
  }): OpenCodeSessionPaginationWithParts[] {
    const ids = new Set(input.messageRows.map((row) => row.id))
    const partRows = input.partRows
      .filter((row) => ids.has(row.message_id))
      .sort((left, right) => left.message_id.localeCompare(right.message_id) || left.id.localeCompare(right.id))
    const partByMessage = new Map<string, Array<Record<string, unknown>>>()
    for (const row of partRows) {
      const part = { ...row.data, id: row.id, sessionID: row.session_id, messageID: row.message_id }
      const list = partByMessage.get(row.message_id)
      if (list) list.push(part)
      else partByMessage.set(row.message_id, [part])
    }
    return input.messageRows.map((row) => ({
      info: { ...row.data, id: row.id, sessionID: row.session_id },
      parts: partByMessage.get(row.id) ?? [],
    }))
  }

  function page(input: {
    sessionID: string
    limit: number
    before?: string
    messageRows: OpenCodeSessionPaginationMessageRow[]
    partRows: OpenCodeSessionPaginationPartRow[]
    sessionExists?: boolean
  }): OpenCodeSessionPaginationPageResult {
    const before = input.before ? cursor.decode(input.before) : undefined
    const rows = input.messageRows
      .filter((row) => row.session_id === input.sessionID)
      .filter((row) => before ? older(row, before) : true)
      .sort((left, right) => right.time_created - left.time_created || right.id.localeCompare(left.id))
    if (rows.length === 0) {
      if (input.sessionExists === false) throw new Error(`Session not found: ${input.sessionID}`)
      return { items: [], more: false }
    }
    const more = rows.length > input.limit
    const slice = more ? rows.slice(0, input.limit) : rows
    const items = hydrate({ messageRows: slice, partRows: input.partRows }).reverse()
    const tail = slice.at(-1)
    return {
      items,
      more,
      ...(more && tail ? { cursor: cursor.encode({ id: tail.id, time: tail.time_created }) } : {}),
    }
  }

  function stream(input: {
    sessionID: string
    messageRows: OpenCodeSessionPaginationMessageRow[]
    partRows: OpenCodeSessionPaginationPartRow[]
    size?: number
    sessionExists?: boolean
  }): OpenCodeSessionPaginationWithParts[] {
    const size = input.size ?? 50
    const result: OpenCodeSessionPaginationWithParts[] = []
    let before: string | undefined
    while (true) {
      const next = page({ ...input, limit: size, ...(before ? { before } : {}) })
      if (next.items.length === 0) break
      for (let index = next.items.length - 1; index >= 0; index--) result.push(next.items[index]!)
      if (!next.more || !next.cursor) break
      before = next.cursor
    }
    return result
  }

  return { cursor, older, hydrate, page, stream }
}

export function captureOpenCodeSessionPaginationNativeExactFixture(): OpenCodeSessionPaginationNativeExactFixture {
  const bridge = createOpenCodeSessionPaginationBridge()
  const cases: OpenCodeSessionPaginationNativeExactFixtureCase[] = []
  const messageRows = paginationMessageRows()
  const partRows = paginationPartRows()
  const msgBCursor = "eyJpZCI6Im1zZ19iIiwidGltZSI6MjB9"

  cases.push({
    id: "cursor-base64url-roundtrip",
    actual: {
      encoded: bridge.cursor.encode({ id: "msg_b", time: 20 }),
      decoded: bridge.cursor.decode(msgBCursor),
    },
    expected: {
      encoded: msgBCursor,
      decoded: { id: "msg_b", time: 20 },
    },
  })

  cases.push({
    id: "page-descending-query-reversed-items-and-tail-cursor",
    actual: bridge.page({ sessionID: "ses_page", limit: 2, messageRows, partRows }),
    expected: {
      items: [
        { info: { role: "assistant", id: "msg_b", sessionID: "ses_page" }, parts: [{ type: "tool", id: "prt_b1", sessionID: "ses_page", messageID: "msg_b" }] },
        { info: { role: "assistant", id: "msg_c", sessionID: "ses_page" }, parts: [{ type: "text", id: "prt_c1", sessionID: "ses_page", messageID: "msg_c" }] },
      ],
      more: true,
      cursor: msgBCursor,
    },
  })

  cases.push({
    id: "page-before-cursor-uses-older-time-or-id",
    actual: {
      olderA: bridge.older(messageRows.find((row) => row.id === "msg_a")!, { id: "msg_b", time: 20 }),
      olderBEqual: bridge.older(messageRows.find((row) => row.id === "msg_b")!, { id: "msg_b", time: 20 }),
      olderTieLowerID: bridge.older(messageRows.find((row) => row.id === "msg_aa")!, { id: "msg_b", time: 20 }),
      page: bridge.page({ sessionID: "ses_page", limit: 3, before: msgBCursor, messageRows, partRows }),
    },
    expected: {
      olderA: true,
      olderBEqual: false,
      olderTieLowerID: true,
      page: {
        items: [
          { info: { role: "user", id: "msg_a", sessionID: "ses_page" }, parts: [{ type: "text", id: "prt_a1", sessionID: "ses_page", messageID: "msg_a" }] },
          { info: { role: "user", id: "msg_aa", sessionID: "ses_page" }, parts: [] },
        ],
        more: false,
      },
    },
  })

  cases.push({
    id: "empty-existing-session-and-missing-session",
    actual: {
      existing: bridge.page({ sessionID: "ses_empty", limit: 2, messageRows, partRows, sessionExists: true }),
      missing: captureError(() => bridge.page({ sessionID: "ses_missing", limit: 2, messageRows, partRows, sessionExists: false })),
    },
    expected: {
      existing: { items: [], more: false },
      missing: "Session not found: ses_missing",
    },
  })

  cases.push({
    id: "stream-yields-newest-to-oldest-across-pages",
    actual: bridge.stream({ sessionID: "ses_page", messageRows, partRows, size: 2 }).map((item) => item.info.id),
    expected: ["msg_c", "msg_b", "msg_aa", "msg_a"],
  })

  const fixtureWithoutFingerprint: Omit<OpenCodeSessionPaginationNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.session.pagination.update-time-cursor",
    portID: "session.pagination",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-session-pagination-native-exact-fixture",
    replayRef: "session-pagination-native-exact:opencode",
    fixtureID: "opencode-session-pagination:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#cursor,older,hydrate,page,stream,parts",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.sql.ts#MessageTable,PartTable,SessionTable",
    ],
    cases,
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeSessionPaginationNativeExactFixture(
  fixture: OpenCodeSessionPaginationNativeExactFixture,
): OpenCodeSessionPaginationNativeExactFixtureVerification {
  const issues: OpenCodeSessionPaginationNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeSessionPaginationNativeExactFixtureCase["id"][] = [
    "cursor-base64url-roundtrip",
    "page-descending-query-reversed-items-and-tail-cursor",
    "page-before-cursor-uses-older-time-or-id",
    "empty-existing-session-and-missing-session",
    "stream-yields-newest-to-oldest-across-pages",
  ]
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-session-pagination.schema", "Fixture must use schema version 1.")
  if (fixture.product !== "opencode" || fixture.atomID !== "opencode.session.pagination.update-time-cursor" || fixture.portID !== "session.pagination") {
    add("opencode-session-pagination.target", "Fixture must target opencode.session.pagination.update-time-cursor and session.pagination.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-session-pagination.native-claim", "Session pagination fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-session-pagination.lossiness", "Native session pagination fixture cannot retain known lossiness.")
  for (const source of ["session/message-v2.ts", "session/session.sql.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-session-pagination.source-ref", `Missing source ref ${source}.`)
  }
  for (const expectedID of expectedCaseIDs) {
    const item = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!item) {
      add("opencode-session-pagination.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (!sameJSON(item.actual, item.expected)) add("opencode-session-pagination.case", "Case actual output must match expected OpenCode MessageV2 pagination behavior.", item.id)
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) add("opencode-session-pagination.fingerprint", "Fixture fingerprint must match canonical content.")
  return { ok: issues.length === 0, issues }
}

function isCursor(value: unknown): value is OpenCodeSessionPaginationCursor {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) &&
    typeof (value as OpenCodeSessionPaginationCursor).id === "string" &&
    (value as OpenCodeSessionPaginationCursor).id.startsWith("msg") &&
    typeof (value as OpenCodeSessionPaginationCursor).time === "number" &&
    Number.isFinite((value as OpenCodeSessionPaginationCursor).time) &&
    (value as OpenCodeSessionPaginationCursor).time >= 0
}

function paginationMessageRows(): OpenCodeSessionPaginationMessageRow[] {
  return [
    { id: "msg_c", session_id: "ses_page", time_created: 30, data: { role: "assistant" } },
    { id: "msg_b", session_id: "ses_page", time_created: 20, data: { role: "assistant" } },
    { id: "msg_aa", session_id: "ses_page", time_created: 20, data: { role: "user" } },
    { id: "msg_a", session_id: "ses_page", time_created: 10, data: { role: "user" } },
    { id: "msg_other", session_id: "ses_other", time_created: 40, data: { role: "user" } },
  ]
}

function paginationPartRows(): OpenCodeSessionPaginationPartRow[] {
  return [
    { id: "prt_c1", session_id: "ses_page", message_id: "msg_c", data: { type: "text" } },
    { id: "prt_b1", session_id: "ses_page", message_id: "msg_b", data: { type: "tool" } },
    { id: "prt_a1", session_id: "ses_page", message_id: "msg_a", data: { type: "text" } },
    { id: "prt_other", session_id: "ses_other", message_id: "msg_other", data: { type: "text" } },
  ]
}

function captureError(fn: () => unknown): string | undefined {
  try {
    fn()
    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
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
