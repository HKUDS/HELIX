import { createHash, randomBytes as nodeRandomBytes } from "node:crypto"
import path from "node:path"

export type OpenCodeIdentityIDKind =
  | "job"
  | "event"
  | "session"
  | "message"
  | "permission"
  | "question"
  | "part"
  | "pty"
  | "tool"
  | "workspace"

export type OpenCodeIdentityIDDirection = "ascending" | "descending"

export interface OpenCodeIdentityIDGeneratorOptions {
  now?: () => number
  randomBytes?: (length: number) => Uint8Array
}

export interface OpenCodeIdentityClockOptions {
  now?: () => Date
}

export interface OpenCodeNativeIdentityIDGenerator {
  ascending(kind: OpenCodeIdentityIDKind, given?: string): string
  descending(kind: OpenCodeIdentityIDKind, given?: string): string
  create(prefix: string, direction: OpenCodeIdentityIDDirection, timestamp?: number): string
  timestamp(id: string): number
  sessionID(id?: string): string
  messageID(id?: string): string
  partID(id?: string): string
  toolID(id?: string): string
  workspaceID(id?: string): string
}

export interface OpenCodeNativeIdentityClock {
  createDefaultTitle(isChild?: boolean): string
  isDefaultTitle(title: string): boolean
}

export interface OpenCodeNativeIdentityWorkspaceResolver {
  sessionPath(worktree: string, cwd: string): string
  resolve(input: { worktree: string; cwd: string }): {
    worktree: string
    directory: string
    path: string
  }
}

interface OpenCodeMonotonicIDState {
  lastTimestamp: number
  counter: number
}

export interface OpenCodeIdentityIDGeneratorNativeExactFixture {
  schemaVersion: 1
  fixtureID: "opencode-identity:id-generator-native-exact-fixture"
  evidenceRef: "conformance:opencode-identity-id-generator-native-exact-fixture"
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  exactDiffStatus: "pinned-upstream-source-exact"
  nativeParityClaim: true
  sourceRefs: Array<{
    path: string
    symbols: string[]
    sha256: string
  }>
  deterministicInput: {
    timestamp: 1234567890
    randomByte: 0
    callOrder: ["sessionID", "messageID", "partID", "toolID", "workspaceID"]
  }
  generated: Array<{
    kind: "session" | "message" | "part" | "tool" | "workspace"
    value: string
    prefix: "ses" | "msg" | "prt" | "tool" | "wrk"
    direction: OpenCodeIdentityIDDirection
    sequence: number
  }>
  restored: Array<{
    method: "sessionID" | "messageID" | "partID"
    input: string
    output: string
  }>
  validationErrors: Array<{
    method: "messageID" | "partID" | "ascending"
    input: string
    message: string
  }>
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeIdentityIDGeneratorNativeExactFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeIdentityIDGeneratorNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeIdentityIDGeneratorNativeExactFixtureIssue[]
}

export interface OpenCodeIdentityClockNativeExactFixture {
  schemaVersion: 1
  fixtureID: "opencode-identity:clock-title-native-exact-fixture"
  evidenceRef: "conformance:opencode-identity-clock-title-native-exact-fixture"
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  exactDiffStatus: "pinned-upstream-source-exact"
  nativeParityClaim: true
  sourceRefs: Array<{
    path: string
    symbols: string[]
    sha256: string
  }>
  deterministicInput: {
    isoTimestamp: "2026-06-12T13:00:00.123Z"
    parentTitlePrefix: "New session - "
    childTitlePrefix: "Child session - "
  }
  generated: Array<{
    kind: "parent" | "child"
    isChild: boolean
    value: string
  }>
  validationCases: Array<{
    title: string
    expected: boolean
  }>
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeIdentityClockNativeExactFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeIdentityClockNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeIdentityClockNativeExactFixtureIssue[]
}

export interface OpenCodeIdentityWorkspaceResolverNativeExactFixture {
  schemaVersion: 1
  fixtureID: "opencode-identity:workspace-session-path-native-exact-fixture"
  evidenceRef: "conformance:opencode-identity-workspace-session-path-native-exact-fixture"
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  exactDiffStatus: "pinned-upstream-source-exact"
  nativeParityClaim: true
  sourceRefs: Array<{
    path: string
    symbols: string[]
    sha256: string
  }>
  deterministicInput: {
    pathOperation: "path.relative(path.resolve(worktree), cwd).replaceAll(\"\\\\\", \"/\")"
    cases: Array<{
      name: "root" | "nested" | "outside-worktree" | "separator-normalization" | "relative-worktree"
      worktree: string
      cwd: string
      expected: string
    }>
  }
  resolved: Array<{
    name: "root" | "nested" | "outside-worktree" | "separator-normalization" | "relative-worktree"
    worktree: string
    cwd: string
    resolvedWorktree: string
    path: string
  }>
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeIdentityWorkspaceResolverNativeExactFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeIdentityWorkspaceResolverNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeIdentityWorkspaceResolverNativeExactFixtureIssue[]
}

const OPENCODE_ID_PREFIXES = {
  job: "job",
  event: "evt",
  session: "ses",
  message: "msg",
  permission: "per",
  question: "que",
  part: "prt",
  pty: "pty",
  tool: "tool",
  workspace: "wrk",
} as const satisfies Record<OpenCodeIdentityIDKind, string>

const OPENCODE_ID_LENGTH = 26
const OPENCODE_ID_RANDOM_LENGTH = OPENCODE_ID_LENGTH - 12

const OPENCODE_ID_GENERATOR_SOURCE_REFS = [
  {
    path: "packages/opencode/src/id/id.ts",
    symbols: ["ascending", "descending", "create", "timestamp"],
    sha256: "sha256:61afb597e8ae9eb0db30fbff10f2a52fd41f937d70772a0a34e7cece53af27ce",
  },
  {
    path: "packages/opencode/src/session/schema.ts",
    symbols: ["SessionID", "MessageID", "PartID"],
    sha256: "sha256:577d5f4c7dcf7f8ea72d76b5beed954bfe7da6943644b73557633e1a5d4ee1f7",
  },
  {
    path: "packages/core/src/util/identifier.ts",
    symbols: ["Identifier.ascending", "Identifier.descending", "Identifier.create"],
    sha256: "sha256:f196ac2448961421c7868befc5963ee104a8ca49ad45f9c443baaaaf3e5d40fc",
  },
  {
    path: "packages/core/src/session.ts",
    symbols: ["Session.ID.descending"],
    sha256: "sha256:a4da5984b88e9b11ad57f7d5588a4ad15a9e7519fc5131f315ce46d39545890b",
  },
] as const

const OPENCODE_CLOCK_SOURCE_REFS = [
  {
    path: "packages/opencode/src/session/session.ts",
    symbols: ["createDefaultTitle", "isDefaultTitle", "parentTitlePrefix", "childTitlePrefix"],
    sha256: "sha256:48eddd4bb992afab269280731ccd288eac24c2fb36372c6eae09b95f5464d61c",
  },
] as const

const OPENCODE_WORKSPACE_RESOLVER_SOURCE_REFS = [
  {
    path: "packages/opencode/src/session/session.ts",
    symbols: ["sessionPath"],
    sha256: "sha256:48eddd4bb992afab269280731ccd288eac24c2fb36372c6eae09b95f5464d61c",
  },
] as const

const EXACT_FIXTURE_TIMESTAMP = 1234567890 as const
const EXACT_CLOCK_ISO_TIMESTAMP = "2026-06-12T13:00:00.123Z" as const
const OPENCODE_WORKSPACE_PATH_CASES = [
  {
    name: "root",
    worktree: "/repo/project",
    cwd: "/repo/project",
    expected: "",
  },
  {
    name: "nested",
    worktree: "/repo/project",
    cwd: "/repo/project/packages/api",
    expected: "packages/api",
  },
  {
    name: "outside-worktree",
    worktree: "/repo/project",
    cwd: "/repo/other",
    expected: "../other",
  },
  {
    name: "separator-normalization",
    worktree: "/repo/project",
    cwd: "/repo/project/foo\\bar",
    expected: "foo/bar",
  },
  {
    name: "relative-worktree",
    worktree: "repo/project",
    cwd: "repo/project/src",
    expected: "src",
  },
] as const
const EXPECTED_EXACT_VALUES = {
  session: "ses_fb669fd2dffe00000000000000",
  message: "msg_0499602d200100000000000000",
  part: "prt_0499602d200200000000000000",
  tool: "tool_0499602d200300000000000000",
  workspace: "wrk_0499602d200400000000000000",
} as const
const OPENCODE_PARENT_TITLE_PREFIX = "New session - " as const
const OPENCODE_CHILD_TITLE_PREFIX = "Child session - " as const
const OPENCODE_DEFAULT_TITLE_PATTERN = new RegExp(
  `^(${OPENCODE_PARENT_TITLE_PREFIX}|${OPENCODE_CHILD_TITLE_PREFIX})\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$`,
)

export function createOpenCodeNativeIdentityIDGenerator(
  options: OpenCodeIdentityIDGeneratorOptions = {},
): OpenCodeNativeIdentityIDGenerator {
  const now = options.now ?? (() => Date.now())
  const randomBytes = options.randomBytes ?? ((length: number) => nodeRandomBytes(length))
  const prefixedState: OpenCodeMonotonicIDState = { lastTimestamp: 0, counter: 0 }
  const coreState: OpenCodeMonotonicIDState = { lastTimestamp: 0, counter: 0 }

  function createPrefixed(kind: OpenCodeIdentityIDKind, direction: OpenCodeIdentityIDDirection, given?: string): string {
    const prefix = OPENCODE_ID_PREFIXES[kind]
    if (given) {
      if (!given.startsWith(prefix)) {
        throw new Error(`ID ${given} does not start with ${prefix}`)
      }
      return given
    }
    return createMonotonicID(prefixedState, prefix, direction, now(), randomBytes)
  }

  return {
    ascending(kind, given) {
      return createPrefixed(kind, "ascending", given)
    },
    descending(kind, given) {
      return createPrefixed(kind, "descending", given)
    },
    create(prefix, direction, timestamp) {
      return createMonotonicID(prefixedState, prefix, direction, timestamp ?? now(), randomBytes)
    },
    timestamp(id) {
      const prefix = id.split("_")[0] ?? ""
      const hex = id.slice(prefix.length + 1, prefix.length + 13)
      const encoded = BigInt(`0x${hex}`)
      return Number(encoded / BigInt(0x1000))
    },
    sessionID(id) {
      if (id) {
        if (!id.startsWith("ses")) {
          throw new Error(`ID ${id} does not start with ses`)
        }
        return id
      }
      return `ses_${createCoreIdentifier(coreState, "descending", now(), randomBytes)}`
    },
    messageID(id) {
      return createPrefixed("message", "ascending", id)
    },
    partID(id) {
      return createPrefixed("part", "ascending", id)
    },
    toolID(id) {
      return createPrefixed("tool", "ascending", id)
    },
    workspaceID(id) {
      return createPrefixed("workspace", "ascending", id)
    },
  }
}

export function createOpenCodeNativeIdentityClock(options: OpenCodeIdentityClockOptions = {}): OpenCodeNativeIdentityClock {
  const now = options.now ?? (() => new Date())
  return {
    createDefaultTitle(isChild = false) {
      return `${isChild ? OPENCODE_CHILD_TITLE_PREFIX : OPENCODE_PARENT_TITLE_PREFIX}${now().toISOString()}`
    },
    isDefaultTitle(title) {
      return OPENCODE_DEFAULT_TITLE_PATTERN.test(title)
    },
  }
}

export function createOpenCodeNativeIdentityWorkspaceResolver(): OpenCodeNativeIdentityWorkspaceResolver {
  function sessionPath(worktree: string, cwd: string): string {
    return path.relative(path.resolve(worktree), cwd).replaceAll("\\", "/")
  }

  return {
    sessionPath,
    resolve(input) {
      return {
        worktree: path.resolve(input.worktree),
        directory: input.cwd,
        path: sessionPath(input.worktree, input.cwd),
      }
    },
  }
}

export function captureOpenCodeIdentityIDGeneratorNativeExactFixture(): OpenCodeIdentityIDGeneratorNativeExactFixture {
  const generator = createOpenCodeNativeIdentityIDGenerator({
    now: () => EXACT_FIXTURE_TIMESTAMP,
    randomBytes: (length) => new Uint8Array(length),
  })
  const generated = [
    {
      kind: "session" as const,
      value: generator.sessionID(),
      prefix: "ses" as const,
      direction: "descending" as const,
      sequence: 1,
    },
    {
      kind: "message" as const,
      value: generator.messageID(),
      prefix: "msg" as const,
      direction: "ascending" as const,
      sequence: 2,
    },
    {
      kind: "part" as const,
      value: generator.partID(),
      prefix: "prt" as const,
      direction: "ascending" as const,
      sequence: 3,
    },
    {
      kind: "tool" as const,
      value: generator.toolID(),
      prefix: "tool" as const,
      direction: "ascending" as const,
      sequence: 4,
    },
    {
      kind: "workspace" as const,
      value: generator.workspaceID(),
      prefix: "wrk" as const,
      direction: "ascending" as const,
      sequence: 5,
    },
  ]
  const restored = [
    {
      method: "sessionID" as const,
      input: "ses_existing",
      output: generator.sessionID("ses_existing"),
    },
    {
      method: "messageID" as const,
      input: "msg_existing",
      output: generator.messageID("msg_existing"),
    },
    {
      method: "partID" as const,
      input: "prt_existing",
      output: generator.partID("prt_existing"),
    },
  ]
  const validationErrors = [
    captureIDValidationError("messageID", "bad_message", () => generator.messageID("bad_message")),
    captureIDValidationError("partID", "bad_part", () => generator.partID("bad_part")),
    captureIDValidationError("ascending", "bad_tool", () => generator.ascending("tool", "bad_tool")),
  ]
  const snapshotWithoutFingerprint: Omit<OpenCodeIdentityIDGeneratorNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-identity:id-generator-native-exact-fixture" as const,
    evidenceRef: "conformance:opencode-identity-id-generator-native-exact-fixture" as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    exactDiffStatus: "pinned-upstream-source-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: OPENCODE_ID_GENERATOR_SOURCE_REFS.map((ref) => ({ ...ref, symbols: [...ref.symbols] })),
    deterministicInput: {
      timestamp: EXACT_FIXTURE_TIMESTAMP,
      randomByte: 0,
      callOrder: ["sessionID", "messageID", "partID", "toolID", "workspaceID"],
    },
    generated,
    restored,
    validationErrors,
    knownLossiness: [],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeIdentityClockNativeExactFixture(): OpenCodeIdentityClockNativeExactFixture {
  const clock = createOpenCodeNativeIdentityClock({
    now: () => new Date(EXACT_CLOCK_ISO_TIMESTAMP),
  })
  const parentTitle = clock.createDefaultTitle()
  const childTitle = clock.createDefaultTitle(true)
  const generated = [
    {
      kind: "parent" as const,
      isChild: false,
      value: parentTitle,
    },
    {
      kind: "child" as const,
      isChild: true,
      value: childTitle,
    },
  ]
  const validationCases = [
    { title: parentTitle, expected: true },
    { title: childTitle, expected: true },
    { title: "New session - 2026-06-12T13:00:00Z", expected: false },
    { title: "Session - 2026-06-12T13:00:00.123Z", expected: false },
  ]
  const snapshotWithoutFingerprint: Omit<OpenCodeIdentityClockNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    fixtureID: "opencode-identity:clock-title-native-exact-fixture",
    evidenceRef: "conformance:opencode-identity-clock-title-native-exact-fixture",
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    exactDiffStatus: "pinned-upstream-source-exact",
    nativeParityClaim: true,
    sourceRefs: OPENCODE_CLOCK_SOURCE_REFS.map((ref) => ({ ...ref, symbols: [...ref.symbols] })),
    deterministicInput: {
      isoTimestamp: EXACT_CLOCK_ISO_TIMESTAMP,
      parentTitlePrefix: OPENCODE_PARENT_TITLE_PREFIX,
      childTitlePrefix: OPENCODE_CHILD_TITLE_PREFIX,
    },
    generated,
    validationCases,
    knownLossiness: [],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeIdentityWorkspaceResolverNativeExactFixture(): OpenCodeIdentityWorkspaceResolverNativeExactFixture {
  const resolver = createOpenCodeNativeIdentityWorkspaceResolver()
  const resolved = OPENCODE_WORKSPACE_PATH_CASES.map((item) => ({
    name: item.name,
    worktree: item.worktree,
    cwd: item.cwd,
    resolvedWorktree: path.resolve(item.worktree),
    path: resolver.sessionPath(item.worktree, item.cwd),
  }))
  const snapshotWithoutFingerprint: Omit<OpenCodeIdentityWorkspaceResolverNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    fixtureID: "opencode-identity:workspace-session-path-native-exact-fixture",
    evidenceRef: "conformance:opencode-identity-workspace-session-path-native-exact-fixture",
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    exactDiffStatus: "pinned-upstream-source-exact",
    nativeParityClaim: true,
    sourceRefs: OPENCODE_WORKSPACE_RESOLVER_SOURCE_REFS.map((ref) => ({ ...ref, symbols: [...ref.symbols] })),
    deterministicInput: {
      pathOperation: 'path.relative(path.resolve(worktree), cwd).replaceAll("\\\\", "/")',
      cases: OPENCODE_WORKSPACE_PATH_CASES.map((item) => ({ ...item })),
    },
    resolved,
    knownLossiness: [],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeIdentityIDGeneratorNativeExactFixture(
  fixture: OpenCodeIdentityIDGeneratorNativeExactFixture,
): OpenCodeIdentityIDGeneratorNativeExactFixtureVerification {
  const issues: OpenCodeIdentityIDGeneratorNativeExactFixtureIssue[] = []
  if (
    fixture.fixtureID !== "opencode-identity:id-generator-native-exact-fixture" ||
    fixture.evidenceRef !== "conformance:opencode-identity-id-generator-native-exact-fixture"
  ) {
    issues.push({
      id: "opencode-identity-id-generator-native-exact-fixture.identity",
      message: "OpenCode ID generator native exact fixture has an unexpected fixture or evidence ID.",
    })
  }
  if (fixture.exactDiffStatus !== "pinned-upstream-source-exact" || fixture.nativeParityClaim !== true) {
    issues.push({
      id: "opencode-identity-id-generator-native-exact-fixture.native-claim",
      message: "OpenCode ID generator fixture must claim native parity only for the exact upstream ID generator surface.",
    })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({
      id: "opencode-identity-id-generator-native-exact-fixture.lossiness",
      message: "OpenCode ID generator native exact fixture must not carry known lossiness.",
    })
  }
  for (const ref of OPENCODE_ID_GENERATOR_SOURCE_REFS) {
    const match = fixture.sourceRefs.find((candidate) => candidate.path === ref.path)
    if (!match || match.sha256 !== ref.sha256) {
      issues.push({
        id: `opencode-identity-id-generator-native-exact-fixture.source-${ref.path}`,
        message: `OpenCode ID generator fixture lost pinned upstream source ref ${ref.path}.`,
      })
    }
  }
  for (const [kind, expected] of Object.entries(EXPECTED_EXACT_VALUES) as Array<[keyof typeof EXPECTED_EXACT_VALUES, string]>) {
    const generated = fixture.generated.find((item) => item.kind === kind)
    if (!generated || generated.value !== expected) {
      issues.push({
        id: `opencode-identity-id-generator-native-exact-fixture.value-${kind}`,
        message: `OpenCode ID generator fixture no longer matches the pinned upstream deterministic ${kind} ID.`,
      })
    }
  }
  const restoredMismatch = fixture.restored.find((item) => item.input !== item.output)
  if (restoredMismatch) {
    issues.push({
      id: "opencode-identity-id-generator-native-exact-fixture.restore",
      message: "OpenCode ID generator fixture no longer preserves already-valid IDs.",
    })
  }
  for (const expected of [
    ["messageID", "ID bad_message does not start with msg"],
    ["partID", "ID bad_part does not start with prt"],
    ["ascending", "ID bad_tool does not start with tool"],
  ] as const) {
    const found = fixture.validationErrors.find((item) => item.method === expected[0] && item.message === expected[1])
    if (!found) {
      issues.push({
        id: `opencode-identity-id-generator-native-exact-fixture.validation-${expected[0]}`,
        message: `OpenCode ID generator fixture no longer captures upstream prefix validation for ${expected[0]}.`,
      })
    }
  }
  if (fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({
      id: "opencode-identity-id-generator-native-exact-fixture.fingerprint",
      message: "OpenCode ID generator fixture fingerprint no longer matches its contents.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyOpenCodeIdentityClockNativeExactFixture(
  fixture: OpenCodeIdentityClockNativeExactFixture,
): OpenCodeIdentityClockNativeExactFixtureVerification {
  const issues: OpenCodeIdentityClockNativeExactFixtureIssue[] = []
  if (
    fixture.fixtureID !== "opencode-identity:clock-title-native-exact-fixture" ||
    fixture.evidenceRef !== "conformance:opencode-identity-clock-title-native-exact-fixture"
  ) {
    issues.push({
      id: "opencode-identity-clock-title-native-exact-fixture.identity",
      message: "OpenCode clock/title native exact fixture has an unexpected fixture or evidence ID.",
    })
  }
  if (fixture.exactDiffStatus !== "pinned-upstream-source-exact" || fixture.nativeParityClaim !== true) {
    issues.push({
      id: "opencode-identity-clock-title-native-exact-fixture.native-claim",
      message: "OpenCode clock/title fixture must claim native parity only for the exact upstream default title surface.",
    })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({
      id: "opencode-identity-clock-title-native-exact-fixture.lossiness",
      message: "OpenCode clock/title native exact fixture must not carry known lossiness.",
    })
  }
  for (const ref of OPENCODE_CLOCK_SOURCE_REFS) {
    const match = fixture.sourceRefs.find((candidate) => candidate.path === ref.path)
    if (!match || match.sha256 !== ref.sha256) {
      issues.push({
        id: `opencode-identity-clock-title-native-exact-fixture.source-${ref.path}`,
        message: `OpenCode clock/title fixture lost pinned upstream source ref ${ref.path}.`,
      })
    }
  }
  const expectedGenerated = [
    ["parent", `${OPENCODE_PARENT_TITLE_PREFIX}${EXACT_CLOCK_ISO_TIMESTAMP}`],
    ["child", `${OPENCODE_CHILD_TITLE_PREFIX}${EXACT_CLOCK_ISO_TIMESTAMP}`],
  ] as const
  for (const [kind, expected] of expectedGenerated) {
    const generated = fixture.generated.find((item) => item.kind === kind)
    if (!generated || generated.value !== expected) {
      issues.push({
        id: `opencode-identity-clock-title-native-exact-fixture.value-${kind}`,
        message: `OpenCode clock/title fixture no longer matches the pinned upstream deterministic ${kind} title.`,
      })
    }
  }
  const clock = createOpenCodeNativeIdentityClock()
  const validationMismatch = fixture.validationCases.find((item) => clock.isDefaultTitle(item.title) !== item.expected)
  if (validationMismatch) {
    issues.push({
      id: "opencode-identity-clock-title-native-exact-fixture.validation",
      message: "OpenCode clock/title fixture validation cases no longer match the upstream default-title regex.",
    })
  }
  if (fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({
      id: "opencode-identity-clock-title-native-exact-fixture.fingerprint",
      message: "OpenCode clock/title fixture fingerprint no longer matches its contents.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyOpenCodeIdentityWorkspaceResolverNativeExactFixture(
  fixture: OpenCodeIdentityWorkspaceResolverNativeExactFixture,
): OpenCodeIdentityWorkspaceResolverNativeExactFixtureVerification {
  const issues: OpenCodeIdentityWorkspaceResolverNativeExactFixtureIssue[] = []
  if (
    fixture.fixtureID !== "opencode-identity:workspace-session-path-native-exact-fixture" ||
    fixture.evidenceRef !== "conformance:opencode-identity-workspace-session-path-native-exact-fixture"
  ) {
    issues.push({
      id: "opencode-identity-workspace-session-path-native-exact-fixture.identity",
      message: "OpenCode workspace resolver native exact fixture has an unexpected fixture or evidence ID.",
    })
  }
  if (fixture.exactDiffStatus !== "pinned-upstream-source-exact" || fixture.nativeParityClaim !== true) {
    issues.push({
      id: "opencode-identity-workspace-session-path-native-exact-fixture.native-claim",
      message: "OpenCode workspace resolver fixture must claim native parity only for the exact upstream sessionPath surface.",
    })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({
      id: "opencode-identity-workspace-session-path-native-exact-fixture.lossiness",
      message: "OpenCode workspace resolver native exact fixture must not carry known lossiness.",
    })
  }
  for (const ref of OPENCODE_WORKSPACE_RESOLVER_SOURCE_REFS) {
    const match = fixture.sourceRefs.find((candidate) => candidate.path === ref.path)
    if (!match || match.sha256 !== ref.sha256) {
      issues.push({
        id: `opencode-identity-workspace-session-path-native-exact-fixture.source-${ref.path}`,
        message: `OpenCode workspace resolver fixture lost pinned upstream source ref ${ref.path}.`,
      })
    }
  }
  const resolver = createOpenCodeNativeIdentityWorkspaceResolver()
  for (const expected of OPENCODE_WORKSPACE_PATH_CASES) {
    const match = fixture.resolved.find((item) => item.name === expected.name)
    if (!match || match.path !== expected.expected || resolver.sessionPath(expected.worktree, expected.cwd) !== expected.expected) {
      issues.push({
        id: `opencode-identity-workspace-session-path-native-exact-fixture.path-${expected.name}`,
        message: `OpenCode workspace resolver fixture no longer matches upstream sessionPath behavior for ${expected.name}.`,
      })
    }
  }
  if (fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({
      id: "opencode-identity-workspace-session-path-native-exact-fixture.fingerprint",
      message: "OpenCode workspace resolver fixture fingerprint no longer matches its contents.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function createCoreIdentifier(
  state: OpenCodeMonotonicIDState,
  direction: OpenCodeIdentityIDDirection,
  timestamp: number,
  randomBytes: (length: number) => Uint8Array,
): string {
  return createMonotonicID(state, "", direction, timestamp, randomBytes).slice(1)
}

function createMonotonicID(
  state: OpenCodeMonotonicIDState,
  prefix: string,
  direction: OpenCodeIdentityIDDirection,
  timestamp: number,
  randomBytes: (length: number) => Uint8Array,
): string {
  if (timestamp !== state.lastTimestamp) {
    state.lastTimestamp = timestamp
    state.counter = 0
  }
  state.counter++

  let now = BigInt(timestamp) * BigInt(0x1000) + BigInt(state.counter)
  now = direction === "descending" ? ~now : now

  const timeBytes = Buffer.alloc(6)
  for (let index = 0; index < 6; index++) {
    timeBytes[index] = Number((now >> BigInt(40 - 8 * index)) & BigInt(0xff))
  }

  return `${prefix}_${timeBytes.toString("hex")}${randomBase62(randomBytes, OPENCODE_ID_RANDOM_LENGTH)}`
}

function randomBase62(randomBytes: (length: number) => Uint8Array, length: number): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  let result = ""
  const bytes = randomBytes(length)
  for (let index = 0; index < length; index++) {
    result += chars[(bytes[index] ?? 0) % 62]
  }
  return result
}

function captureIDValidationError(
  method: "messageID" | "partID" | "ascending",
  input: string,
  run: () => string,
): OpenCodeIdentityIDGeneratorNativeExactFixture["validationErrors"][number] {
  try {
    run()
    return { method, input, message: "<no-error>" }
  } catch (error) {
    return { method, input, message: error instanceof Error ? error.message : String(error) }
  }
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}
