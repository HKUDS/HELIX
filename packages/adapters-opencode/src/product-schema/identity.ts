import { createHash, randomBytes as cryptoRandomBytes } from "node:crypto"
import { relative, resolve } from "node:path"

export const openCodeIdentityUpstreamRef = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
export const openCodeIdentityClockNativeExactAtomID = "opencode.identity.clock-format"
export const openCodeIdentityIDGeneratorNativeExactAtomID = "opencode.identity.id-generator"
export const openCodeIdentityWorkspaceResolverNativeExactAtomID = "opencode.identity.workspace-resolver"
export const openCodeIdentityNativeExactAtomIDs = [
  openCodeIdentityClockNativeExactAtomID,
  openCodeIdentityIDGeneratorNativeExactAtomID,
  openCodeIdentityWorkspaceResolverNativeExactAtomID,
] as const
export const openCodeIdentityNativeExactFixtureID = "opencode-identity:native-exact-fixture"
export const openCodeIdentityNativeExactEvidenceRef = "conformance:opencode-identity-native-exact-fixture"
export const openCodeIdentityNativeExactReplayRef = "identity-native-exact:opencode"

export type OpenCodeIdentityNativeExactAtomID = (typeof openCodeIdentityNativeExactAtomIDs)[number]
export type OpenCodeIdentityPortID = "identity.clock" | "identity.id-generator" | "identity.workspace-resolver"
export type OpenCodeIDDirection = "ascending" | "descending"
export type OpenCodeIDKind = "session" | "message" | "part" | "workspace"

export interface OpenCodeIDState {
  lastTimestamp: number
  counter: number
}

export interface OpenCodeIDInput {
  timestamp?: number
  randomBytes?: number[]
  given?: string
}

export interface OpenCodeIdentityClockAtom {
  createDefaultTitle(input?: { now?: string | number | Date; isChild?: boolean }): string
  isDefaultTitle(input: { title: string }): boolean
  forkTitle(input: { title: string }): string
}

export interface OpenCodeIdentityIDGeneratorAtom {
  sessionID(input?: OpenCodeIDInput): string
  messageID(input?: OpenCodeIDInput): string
  partID(input?: OpenCodeIDInput): string
  workspaceID(input?: OpenCodeIDInput): string
  timestampFromAscendingID(input: { id: string }): number
}

export interface OpenCodeIdentityWorkspaceResolverAtom {
  sessionPath(input: { worktree: string; cwd: string }): string
}

export interface OpenCodeIdentityNativeDescriptor {
  id: OpenCodeIdentityNativeExactAtomID
  port: OpenCodeIdentityPortID
  product: "opencode"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof openCodeIdentityNativeExactEvidenceRef, typeof openCodeIdentityNativeExactReplayRef]
  fixtureIDs: [typeof openCodeIdentityNativeExactFixtureID]
  knownLossiness: []
}

export type OpenCodeIdentityNativeScenarioID =
  | "descending-session-and-ascending-child-ids"
  | "default-title-clock-and-fork-title"
  | "workspace-session-path"
  | "id-validation-and-timestamp-readback"

export interface OpenCodeIdentityNativeExactCase {
  scenarioID: OpenCodeIdentityNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface OpenCodeIdentityNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: typeof openCodeIdentityNativeExactAtomIDs
  portIDs: readonly ["identity.clock", "identity.id-generator", "identity.workspace-resolver"]
  upstreamRef: typeof openCodeIdentityUpstreamRef
  evidenceRef: typeof openCodeIdentityNativeExactEvidenceRef
  fixtureID: typeof openCodeIdentityNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    sessionIDsUseCoreSessionDescendingWithSesPrefix: true
    messageAndPartIDsUseOpenCodeAscendingPrefixes: true
    workspaceIDsUseOpenCodeAscendingWrkPrefix: true
    timestampSegmentStoresLowSixBytesOfMillisecondsTimes4096PlusCounter: true
    descendingIDsInvertTheTimestampSegment: true
    randomSuffixUsesCryptoBytesModuloBase62: true
    sameTimestampIncrementsCounterInsideEachIdentifierModule: true
    defaultSessionTitlesUseNewSessionPrefixAndISODate: true
    childSessionTitlesUseChildSessionPrefixAndISODate: true
    forkTitlesAppendOrIncrementForkSuffix: true
    sessionPathIsRelativeToResolvedWorktreeWithForwardSlashes: true
  }
  cases: OpenCodeIdentityNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: OpenCodeIdentityNativeDescriptor[]
  fingerprint: string
}

export interface OpenCodeIdentityNativeExactIssue {
  id: string
  message: string
}

export interface OpenCodeIdentityNativeExactVerification {
  ok: boolean
  issues: OpenCodeIdentityNativeExactIssue[]
}

const parentTitlePrefix = "New session - "
const childTitlePrefix = "Child session - "
const openCodeIDRandomSuffixLength = 14
const openCodeBase62Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const prefixedIDPrefixes: Record<Exclude<OpenCodeIDKind, "session">, string> = {
  message: "msg",
  part: "prt",
  workspace: "wrk",
}

export function createOpenCodeIdentityClockAtom(): OpenCodeIdentityClockAtom {
  return {
    createDefaultTitle(input = {}) {
      return openCodeCreateDefaultTitle(input)
    },
    isDefaultTitle(input) {
      return openCodeIsDefaultTitle(input.title)
    },
    forkTitle(input) {
      return openCodeForkedTitle(input.title)
    },
  }
}

export function createOpenCodeIdentityIDGeneratorAtom(): OpenCodeIdentityIDGeneratorAtom {
  const coreState: OpenCodeIDState = { lastTimestamp: 0, counter: 0 }
  const productState: OpenCodeIDState = { lastTimestamp: 0, counter: 0 }
  return {
    sessionID(input = {}) {
      if (input.given) return validateOpenCodeIDPrefix(input.given, "ses")
      return `ses_${createOpenCodeCoreIdentifier({ ...input, direction: "descending", state: coreState })}`
    },
    messageID(input = {}) {
      return createOpenCodePrefixedIdentifier({ ...input, kind: "message", direction: "ascending", state: productState })
    },
    partID(input = {}) {
      return createOpenCodePrefixedIdentifier({ ...input, kind: "part", direction: "ascending", state: productState })
    },
    workspaceID(input = {}) {
      return createOpenCodePrefixedIdentifier({ ...input, kind: "workspace", direction: "ascending", state: productState })
    },
    timestampFromAscendingID(input) {
      return openCodeTimestampFromAscendingID(input.id)
    },
  }
}

export function createOpenCodeIdentityWorkspaceResolverAtom(): OpenCodeIdentityWorkspaceResolverAtom {
  return {
    sessionPath(input) {
      return openCodeSessionPath(input.worktree, input.cwd)
    },
  }
}

export function openCodeCreateDefaultTitle(input: { now?: string | number | Date; isChild?: boolean } = {}): string {
  return `${input.isChild ? childTitlePrefix : parentTitlePrefix}${new Date(input.now ?? Date.now()).toISOString()}`
}

export function openCodeIsDefaultTitle(title: string): boolean {
  return new RegExp(
    `^(${parentTitlePrefix}|${childTitlePrefix})\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$`,
  ).test(title)
}

export function openCodeForkedTitle(title: string): string {
  const match = title.match(/^(.+) \(fork #(\d+)\)$/)
  if (!match) return `${title} (fork #1)`
  return `${match[1]} (fork #${Number.parseInt(match[2]!, 10) + 1})`
}

export function openCodeSessionPath(worktree: string, cwd: string): string {
  return relative(resolve(worktree), cwd).replaceAll("\\", "/")
}

export function createOpenCodeCoreIdentifier(input: {
  direction: OpenCodeIDDirection
  timestamp?: number
  randomBytes?: number[]
  state?: OpenCodeIDState
}): string {
  const counter = nextOpenCodeCounter(input.state, input.timestamp)
  const timeSegment = openCodeTimeSegment(input.timestamp ?? Date.now(), counter, input.direction)
  return `${timeSegment}${openCodeRandomBase62(openCodeIDRandomSuffixLength, input.randomBytes)}`
}

export function createOpenCodePrefixedIdentifier(input: {
  kind: Exclude<OpenCodeIDKind, "session">
  direction: OpenCodeIDDirection
  timestamp?: number
  randomBytes?: number[]
  state?: OpenCodeIDState
  given?: string
}): string {
  const prefix = prefixedIDPrefixes[input.kind]
  if (input.given) return validateOpenCodeIDPrefix(input.given, prefix)
  return `${prefix}_${createOpenCodeCoreIdentifier(input)}`
}

export function openCodeTimestampFromAscendingID(id: string): number {
  const prefix = id.split("_")[0] ?? ""
  const hex = id.slice(prefix.length + 1, prefix.length + 13)
  return Number(BigInt(`0x${hex}`) / BigInt(0x1000))
}

function openCodeIdentityNativeDescriptor(id: OpenCodeIdentityNativeExactAtomID): OpenCodeIdentityNativeDescriptor {
  const port =
    id === openCodeIdentityClockNativeExactAtomID
      ? "identity.clock"
      : id === openCodeIdentityIDGeneratorNativeExactAtomID
        ? "identity.id-generator"
        : "identity.workspace-resolver"
  return {
    id,
    port,
    product: "opencode",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [openCodeIdentityNativeExactEvidenceRef, openCodeIdentityNativeExactReplayRef],
    fixtureIDs: [openCodeIdentityNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "OpenCode upstream native implementation with native parity complete identifier, default title, fork title, and session path fixture coverage.",
  }
}

export const openCodeIdentityNativeDescriptors = [
  openCodeIdentityNativeDescriptor(openCodeIdentityClockNativeExactAtomID),
  openCodeIdentityNativeDescriptor(openCodeIdentityIDGeneratorNativeExactAtomID),
  openCodeIdentityNativeDescriptor(openCodeIdentityWorkspaceResolverNativeExactAtomID),
] as const

export const openCodeIdentityNativeExactDescriptorForID = new Map(
  openCodeIdentityNativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export function buildOpenCodeIdentityNativeExactFixture(): OpenCodeIdentityNativeExactFixture {
  const ids = createOpenCodeIdentityIDGeneratorAtom()
  const clock = createOpenCodeIdentityClockAtom()
  const workspace = createOpenCodeIdentityWorkspaceResolverAtom()
  const timestamp = 1_718_190_000_123
  const fixtureWithoutFingerprint: Omit<OpenCodeIdentityNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomIDs: [...openCodeIdentityNativeExactAtomIDs] as typeof openCodeIdentityNativeExactAtomIDs,
    portIDs: ["identity.clock", "identity.id-generator", "identity.workspace-resolver"] as const,
    upstreamRef: openCodeIdentityUpstreamRef,
    evidenceRef: openCodeIdentityNativeExactEvidenceRef,
    fixtureID: openCodeIdentityNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      sessionIDsUseCoreSessionDescendingWithSesPrefix: true as const,
      messageAndPartIDsUseOpenCodeAscendingPrefixes: true as const,
      workspaceIDsUseOpenCodeAscendingWrkPrefix: true as const,
      timestampSegmentStoresLowSixBytesOfMillisecondsTimes4096PlusCounter: true as const,
      descendingIDsInvertTheTimestampSegment: true as const,
      randomSuffixUsesCryptoBytesModuloBase62: true as const,
      sameTimestampIncrementsCounterInsideEachIdentifierModule: true as const,
      defaultSessionTitlesUseNewSessionPrefixAndISODate: true as const,
      childSessionTitlesUseChildSessionPrefixAndISODate: true as const,
      forkTitlesAppendOrIncrementForkSuffix: true as const,
      sessionPathIsRelativeToResolvedWorktreeWithForwardSlashes: true as const,
    },
    cases: [
      {
        scenarioID: "descending-session-and-ascending-child-ids" as const,
        input: {
          timestamp,
          sessionRandomBytes: range(0, openCodeIDRandomSuffixLength),
          messageRandomBytes: range(14, openCodeIDRandomSuffixLength),
          partRandomBytes: range(28, openCodeIDRandomSuffixLength),
          workspaceRandomBytes: range(42, openCodeIDRandomSuffixLength),
        },
        output: {
          sessionID: ids.sessionID({ timestamp, randomBytes: range(0, openCodeIDRandomSuffixLength) }),
          nextSessionIDSameTimestamp: ids.sessionID({ timestamp, randomBytes: range(1, openCodeIDRandomSuffixLength) }),
          messageID: ids.messageID({ timestamp, randomBytes: range(14, openCodeIDRandomSuffixLength) }),
          partID: ids.partID({ timestamp, randomBytes: range(28, openCodeIDRandomSuffixLength) }),
          workspaceID: ids.workspaceID({ timestamp, randomBytes: range(42, openCodeIDRandomSuffixLength) }),
        },
        upstreamBehavior: "CoreSession.ID.descending returns 'ses_' plus core Identifier.descending(); MessageID.ascending, PartID.ascending, and WorkspaceID.ascending use the OpenCode prefixed Identifier module with msg/prt/wrk prefixes. Both identifier modules encode timestamp * 0x1000 + counter into six bytes, invert that segment for descending IDs, and append randomBytes(length) modulo the base62 alphabet.",
      },
      {
        scenarioID: "default-title-clock-and-fork-title" as const,
        input: { now: "2026-06-13T12:10:42.949Z", childNow: "2026-06-13T12:11:00.001Z" },
        output: {
          parentTitle: clock.createDefaultTitle({ now: "2026-06-13T12:10:42.949Z" }),
          childTitle: clock.createDefaultTitle({ now: "2026-06-13T12:11:00.001Z", isChild: true }),
          parentTitleIsDefault: clock.isDefaultTitle({ title: "New session - 2026-06-13T12:10:42.949Z" }),
          childTitleIsDefault: clock.isDefaultTitle({ title: "Child session - 2026-06-13T12:11:00.001Z" }),
          explicitTitleIsDefault: clock.isDefaultTitle({ title: "Investigate replay" }),
          firstForkTitle: clock.forkTitle({ title: "Investigate replay" }),
          secondForkTitle: clock.forkTitle({ title: "Investigate replay (fork #1)" }),
        },
        upstreamBehavior: "createDefaultTitle prefixes parent sessions with 'New session - ', child sessions with 'Child session - ', then appends new Date().toISOString(); isDefaultTitle accepts either prefix plus a millisecond UTC ISO timestamp; getForkedTitle appends '(fork #1)' or increments an existing fork suffix.",
      },
      {
        scenarioID: "workspace-session-path" as const,
        input: { worktree: "/workspace/opencode", cwd: "/workspace/opencode/packages/app" },
        output: {
          nestedPath: workspace.sessionPath({ worktree: "/workspace/opencode", cwd: "/workspace/opencode/packages/app" }),
          rootPath: workspace.sessionPath({ worktree: "/workspace/opencode", cwd: "/workspace/opencode" }),
          siblingPath: workspace.sessionPath({ worktree: "/workspace/opencode/packages/app", cwd: "/workspace/opencode/packages/cli" }),
        },
        upstreamBehavior: "sessionPath(worktree, cwd) returns path.relative(path.resolve(worktree), cwd).replaceAll('\\\\', '/'), so session info stores a worktree-relative forward-slash path.",
      },
      {
        scenarioID: "id-validation-and-timestamp-readback" as const,
        input: {
          givenMessageID: "msg_existing",
          invalidPartID: "msg_wrong_prefix",
          timestamp,
          randomBytes: range(56, openCodeIDRandomSuffixLength),
        },
        output: {
          givenMessageID: ids.messageID({ given: "msg_existing" }),
          invalidPartIDError: captureErrorMessage(() => ids.partID({ given: "msg_wrong_prefix" })),
          ascendingTimestamp: ids.timestampFromAscendingID({
            id: createOpenCodePrefixedIdentifier({
              kind: "message",
              direction: "ascending",
              timestamp,
              randomBytes: range(56, openCodeIDRandomSuffixLength),
            }),
          }),
        },
        upstreamBehavior: "OpenCode prefixed Identifier.ascending/descending returns a supplied ID only when it starts with the expected prefix; otherwise it throws. timestamp(id) slices the low six-byte timestamp segment after '<prefix>_' and divides it by 0x1000, so modern millisecond values read back modulo 2^36.",
      },
    ],
    sourceRefs: [
      `${openCodeIdentityUpstreamRef}:packages/core/src/util/identifier.ts#Identifier.create,Identifier.ascending,Identifier.descending`,
      `${openCodeIdentityUpstreamRef}:packages/core/src/session.ts#Session.ID.descending`,
      `${openCodeIdentityUpstreamRef}:packages/opencode/src/id/id.ts#ascending,descending,create,timestamp`,
      `${openCodeIdentityUpstreamRef}:packages/opencode/src/session/schema.ts#MessageID.ascending,PartID.ascending`,
      `${openCodeIdentityUpstreamRef}:packages/opencode/src/control-plane/schema.ts#WorkspaceID.ascending`,
      `${openCodeIdentityUpstreamRef}:packages/opencode/src/session/session.ts#createDefaultTitle,isDefaultTitle,getForkedTitle,sessionPath,Service.create,Service.fork`,
    ],
    nativeEvidenceRefs: [...openCodeIdentityNativeDescriptors[0].nativeEvidenceRefs],
    fixtureIDs: [...openCodeIdentityNativeDescriptors[0].fixtureIDs],
    knownLossiness: [] as string[],
    descriptors: [...openCodeIdentityNativeDescriptors],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeIdentityNativeExactFixture(
  fixture: OpenCodeIdentityNativeExactFixture,
): OpenCodeIdentityNativeExactVerification {
  const canonical = buildOpenCodeIdentityNativeExactFixture()
  const issues: OpenCodeIdentityNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "opencode-identity-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical OpenCode identity behavior." })
  }
  if (fixture.product !== "opencode" || JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    issues.push({ id: "opencode-identity-native-exact.identity", message: "Fixture must remain scoped to the OpenCode identity atoms and ports." })
  }
  if (
    fixture.upstreamRef !== openCodeIdentityUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("packages/core/src/util/identifier.ts#Identifier.create")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("packages/opencode/src/session/session.ts#createDefaultTitle")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("packages/opencode/src/session/schema.ts#MessageID.ascending"))
  ) {
    issues.push({ id: "opencode-identity-native-exact.upstream", message: "Fixture must stay pinned to OpenCode upstream identifier, session schema, and session service sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-identity-native-exact.native-claim", message: "OpenCode identity fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || openCodeIdentityNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "opencode-identity-native-exact.lossiness", message: "Native exact OpenCode identity fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(openCodeIdentityNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(openCodeIdentityNativeExactReplayRef)) {
    issues.push({ id: "opencode-identity-native-exact.evidence", message: "OpenCode identity native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(openCodeIdentityNativeExactFixtureID)) {
    issues.push({ id: "opencode-identity-native-exact.fixture", message: "OpenCode identity native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "opencode-identity-native-exact.policy", message: "OpenCode identity policy drifted from upstream identifier and session behavior." })
  }
  if (
    JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases) ||
    !fixture.cases.some((item) => item.scenarioID === "descending-session-and-ascending-child-ids") ||
    !fixture.cases.some((item) => item.scenarioID === "default-title-clock-and-fork-title") ||
    !fixture.cases.some((item) => item.scenarioID === "workspace-session-path")
  ) {
    issues.push({ id: "opencode-identity-native-exact.cases", message: "OpenCode identity cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function nextOpenCodeCounter(state: OpenCodeIDState | undefined, timestamp: number | undefined): number {
  const currentTimestamp = timestamp ?? Date.now()
  if (!state) return 1
  if (currentTimestamp !== state.lastTimestamp) {
    state.lastTimestamp = currentTimestamp
    state.counter = 0
  }
  state.counter += 1
  return state.counter
}

function openCodeTimeSegment(timestamp: number, counter: number, direction: OpenCodeIDDirection): string {
  let encoded = BigInt(timestamp) * BigInt(0x1000) + BigInt(counter)
  if (direction === "descending") encoded = ~encoded
  const timeBytes = Buffer.alloc(6)
  for (let index = 0; index < 6; index += 1) {
    timeBytes[index] = Number((encoded >> BigInt(40 - 8 * index)) & BigInt(0xff))
  }
  return timeBytes.toString("hex")
}

function openCodeRandomBase62(length: number, randomBytes?: number[]): string {
  const bytes = randomBytes ?? Array.from(cryptoRandomBytes(length))
  if (bytes.length < length) throw new Error(`OpenCode identifier needs ${length} random bytes`)
  let result = ""
  for (let index = 0; index < length; index += 1) {
    const byte = bytes[index]!
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) throw new Error(`Invalid OpenCode random byte: ${byte}`)
    result += openCodeBase62Chars[byte % 62]
  }
  return result
}

function validateOpenCodeIDPrefix(id: string, prefix: string): string {
  if (!id.startsWith(prefix)) throw new Error(`ID ${id} does not start with ${prefix}`)
  return id
}

function captureErrorMessage(callback: () => unknown): string {
  try {
    callback()
    return ""
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

function range(start: number, length: number): number[] {
  return Array.from({ length }, (_unused, index) => start + index)
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
