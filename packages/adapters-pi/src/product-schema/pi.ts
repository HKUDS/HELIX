import { createHash } from "node:crypto"
import { homedir } from "node:os"
import { isAbsolute, join, resolve as resolveNodePath } from "node:path"
import { fileURLToPath } from "node:url"

export const piMonoIdentityUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoIdentityClockNativeExactAtomID = "pi.identity.clock-format"
export const piMonoIdentityClockNativeExactFixtureID = "pi-identity-clock:native-exact-fixture"
export const piMonoIdentityClockNativeExactEvidenceRef = "conformance:pi-identity-clock-native-exact-fixture"
export const piMonoIdentityClockNativeExactReplayRef = "identity-clock-native-exact:pi-mono"
export const piMonoIdentityIDGeneratorNativeExactAtomID = "pi.identity.id-generator"
export const piMonoIdentityIDGeneratorNativeExactFixtureID = "pi-identity-id-generator:native-exact-fixture"
export const piMonoIdentityIDGeneratorNativeExactEvidenceRef = "conformance:pi-identity-id-generator-native-exact-fixture"
export const piMonoIdentityIDGeneratorNativeExactReplayRef = "identity-id-generator-native-exact:pi-mono"
export const piMonoIdentityWorkspaceResolverNativeExactAtomID = "pi.identity.workspace-resolver"
export const piMonoIdentityWorkspaceResolverNativeExactFixtureID = "pi-identity-workspace-resolver:native-exact-fixture"
export const piMonoIdentityWorkspaceResolverNativeExactEvidenceRef = "conformance:pi-identity-workspace-resolver-native-exact-fixture"
export const piMonoIdentityWorkspaceResolverNativeExactReplayRef = "identity-workspace-resolver-native-exact:pi-mono"

export type PiIdentityClockInput = Date | number | string

export interface PiIdentityClockFormatAtom {
  timestamp(input?: { now?: PiIdentityClockInput }): string
  now(input?: { now?: PiIdentityClockInput }): { timestamp: string }
}

export interface PiIdentityIDGeneratorOptions {
  now?: () => number
  randomBytes?: () => Uint8Array
  existingIDs?: Iterable<string>
}

export interface PiIdentityIDGeneratorInput {
  timestamp?: number
  randomBytes?: Uint8Array
  existingIDs?: Iterable<string>
  seed?: string
}

export interface PiIdentityIDGeneratorAtom {
  sessionID(input?: PiIdentityIDGeneratorInput): string
  entryID(input?: PiIdentityIDGeneratorInput): string
  next(input?: PiIdentityIDGeneratorInput): string
}

export interface PiIdentityWorkspaceResolverOptions {
  cwd?: string | (() => string)
  baseDir?: string
  agentDir?: string
  sessionDir?: string
  homeDir?: string
  cwdExists?: (path: string) => boolean
}

export interface PiIdentityWorkspaceResolverInput {
  cwd?: string
  baseDir?: string
  agentDir?: string
  sessionDir?: string
  sessionID?: string
  timestamp?: string
  parentSession?: string
  sessionFile?: string
  sessionHeaderCwd?: string
  cwdOverride?: string
  fallbackCwd?: string
}

export interface PiIdentitySessionHeader {
  type: "session"
  version: 3
  id: string
  timestamp: string
  cwd: string
  parentSession?: string
}

export interface PiIdentityMissingSessionCwdIssue {
  sessionFile?: string
  sessionCwd: string
  fallbackCwd: string
}

export interface PiIdentityWorkspaceResolverAtom {
  cwd(input?: Pick<PiIdentityWorkspaceResolverInput, "cwd" | "baseDir">): string
  encodedCwd(input?: Pick<PiIdentityWorkspaceResolverInput, "cwd" | "baseDir">): string
  sessionDir(input?: Pick<PiIdentityWorkspaceResolverInput, "cwd" | "baseDir" | "agentDir" | "sessionDir">): string
  sessionHeader(input?: PiIdentityWorkspaceResolverInput): PiIdentitySessionHeader
  openCwd(input?: Pick<PiIdentityWorkspaceResolverInput, "cwdOverride" | "sessionHeaderCwd" | "fallbackCwd" | "baseDir">): string
  missingSessionCwdIssue(input: Pick<PiIdentityWorkspaceResolverInput, "sessionFile" | "sessionHeaderCwd" | "fallbackCwd">): PiIdentityMissingSessionCwdIssue | undefined
}

export type PiMonoIdentityClockScenarioID =
  | "epoch-utc-iso-string"
  | "millisecond-precision-utc-iso-string"
  | "numeric-timestamp-utc-iso-string"

export type PiMonoIdentityIDGeneratorScenarioID =
  | "session-id-full-uuidv7"
  | "entry-id-short-uuidv7-prefix"
  | "entry-id-full-uuidv7-after-short-collisions"

export type PiMonoIdentityWorkspaceResolverScenarioID =
  | "default-session-dir-encodes-resolved-cwd"
  | "session-header-persists-resolved-cwd"
  | "open-session-prefers-header-cwd"
  | "open-session-cwd-override-wins"
  | "missing-session-cwd-issue"

export interface PiMonoIdentityClockNativeExactCase {
  scenarioID: PiMonoIdentityClockScenarioID
  input: {
    now: string | number
  }
  output: string
  upstreamBehavior: string
}

export interface PiMonoIdentityIDGeneratorNativeExactCase {
  scenarioID: PiMonoIdentityIDGeneratorScenarioID
  input: {
    timestamp: number
    randomBytes: "all-zero"
    existingIDs: string[]
  }
  output: string
  outputKind: "full-uuidv7" | "short-uuidv7-prefix"
  upstreamBehavior: string
}

export interface PiMonoIdentityWorkspaceResolverNativeExactCase {
  scenarioID: PiMonoIdentityWorkspaceResolverScenarioID
  input: Record<string, string | boolean | undefined>
  output: Record<string, string | PiIdentitySessionHeader | PiIdentityMissingSessionCwdIssue | undefined>
  upstreamBehavior: string
}

export interface PiMonoIdentityClockNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoIdentityClockNativeExactAtomID
  portID: "identity.clock"
  upstreamRef: typeof piMonoIdentityUpstreamRef
  evidenceRef: typeof piMonoIdentityClockNativeExactEvidenceRef
  fixtureID: typeof piMonoIdentityClockNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    timestampsUseDateToISOString: true
    serializedTimestampsAreUTCISOString: true
    timestampPrecisionIsMilliseconds: true
    jsonlSessionHeaderUsesStringTimestamp: true
    jsonlSessionEntriesUseStringTimestamp: true
    noLocaleOrTimezoneFormatting: true
  }
  cases: PiMonoIdentityClockNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoIdentityIDGeneratorNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoIdentityIDGeneratorNativeExactAtomID
  portID: "identity.id-generator"
  upstreamRef: typeof piMonoIdentityUpstreamRef
  evidenceRef: typeof piMonoIdentityIDGeneratorNativeExactEvidenceRef
  fixtureID: typeof piMonoIdentityIDGeneratorNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    sessionIDsUseUUIDV7: true
    entryIDsUseFirstEightUUIDV7Chars: true
    entryIDsRetryShortIDCollisionsOneHundredTimes: true
    entryIDsFallBackToFullUUIDV7AfterCollisions: true
    uuidV7EmbedsUnixMilliseconds: true
    uuidV7SetsVersionAndVariantBits: true
  }
  cases: PiMonoIdentityIDGeneratorNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoIdentityWorkspaceResolverNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoIdentityWorkspaceResolverNativeExactAtomID
  portID: "identity.workspace-resolver"
  upstreamRef: typeof piMonoIdentityUpstreamRef
  evidenceRef: typeof piMonoIdentityWorkspaceResolverNativeExactEvidenceRef
  fixtureID: typeof piMonoIdentityWorkspaceResolverNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    runtimeCwdUsesProcessCwd: true
    cwdResolutionUsesResolvePath: true
    defaultSessionDirUsesAgentDirSessions: true
    sessionDirsEncodeCwdWithDashWrappedPath: true
    sessionHeadersPersistCwd: true
    openSessionUsesHeaderCwdUnlessOverride: true
    missingSessionCwdGuardRequiresExistingPath: true
  }
  cases: PiMonoIdentityWorkspaceResolverNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoIdentityClockNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoIdentityClockNativeExactVerification {
  ok: boolean
  issues: PiMonoIdentityClockNativeExactIssue[]
}

export interface PiMonoIdentityIDGeneratorNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoIdentityIDGeneratorNativeExactVerification {
  ok: boolean
  issues: PiMonoIdentityIDGeneratorNativeExactIssue[]
}

export interface PiMonoIdentityWorkspaceResolverNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoIdentityWorkspaceResolverNativeExactVerification {
  ok: boolean
  issues: PiMonoIdentityWorkspaceResolverNativeExactIssue[]
}

export const piMonoIdentityClockNativeDescriptor = {
  id: piMonoIdentityClockNativeExactAtomID,
  port: "identity.clock",
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: "Pi upstream native implementation with native parity complete identity clock exact fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoIdentityClockNativeExactEvidenceRef, piMonoIdentityClockNativeExactReplayRef],
  fixtureIDs: [piMonoIdentityClockNativeExactFixtureID],
  knownLossiness: [],
} as const

export const piMonoIdentityIDGeneratorNativeDescriptor = {
  id: piMonoIdentityIDGeneratorNativeExactAtomID,
  port: "identity.id-generator",
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: "Pi upstream native implementation with native parity complete identity id generator exact fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoIdentityIDGeneratorNativeExactEvidenceRef, piMonoIdentityIDGeneratorNativeExactReplayRef],
  fixtureIDs: [piMonoIdentityIDGeneratorNativeExactFixtureID],
  knownLossiness: [],
} as const

export const piMonoIdentityWorkspaceResolverNativeDescriptor = {
  id: piMonoIdentityWorkspaceResolverNativeExactAtomID,
  port: "identity.workspace-resolver",
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: "Pi upstream native implementation with native parity complete identity workspace resolver exact fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoIdentityWorkspaceResolverNativeExactEvidenceRef, piMonoIdentityWorkspaceResolverNativeExactReplayRef],
  fixtureIDs: [piMonoIdentityWorkspaceResolverNativeExactFixtureID],
  knownLossiness: [],
} as const

interface PiIdentityUUIDV7State {
  lastTimestamp: number
  sequence: number
}

function createPiIdentityUUIDV7State(): PiIdentityUUIDV7State {
  return {
    lastTimestamp: Number.NEGATIVE_INFINITY,
    sequence: 0,
  }
}

const sharedPiIdentityUUIDV7State = createPiIdentityUUIDV7State()

export function createPiIdentityClockFormatAtom(options: { now?: () => PiIdentityClockInput } = {}): PiIdentityClockFormatAtom {
  return {
    timestamp(input = {}) {
      return formatPiIdentityClockTimestamp(input.now ?? options.now?.() ?? new Date())
    },
    now(input = {}) {
      return { timestamp: formatPiIdentityClockTimestamp(input.now ?? options.now?.() ?? new Date()) }
    },
  }
}

export function createPiIdentityIDGeneratorAtom(options: PiIdentityIDGeneratorOptions = {}): PiIdentityIDGeneratorAtom {
  const state = options.now || options.randomBytes ? createPiIdentityUUIDV7State() : sharedPiIdentityUUIDV7State
  const issuedIDs = new Set(options.existingIDs ?? [])
  return {
    sessionID(input = {}) {
      if (input.seed) return input.seed
      const generatorOptions: Parameters<typeof generatePiIdentityUUIDV7>[0] = { state }
      const now = input.timestamp === undefined ? options.now : () => input.timestamp!
      const randomBytes = input.randomBytes ? () => input.randomBytes! : options.randomBytes
      if (now) generatorOptions.now = now
      if (randomBytes) generatorOptions.randomBytes = randomBytes
      return generatePiIdentityUUIDV7(generatorOptions)
    },
    entryID(input = {}) {
      if (input.seed) return input.seed
      const existingIDs = new Set([...issuedIDs, ...(input.existingIDs ?? [])])
      const generatorOptions: Parameters<typeof generatePiIdentityEntryID>[1] = { state }
      const now = input.timestamp === undefined ? options.now : () => input.timestamp!
      const randomBytes = input.randomBytes ? () => input.randomBytes! : options.randomBytes
      if (now) generatorOptions.now = now
      if (randomBytes) generatorOptions.randomBytes = randomBytes
      const id = generatePiIdentityEntryID(existingIDs, generatorOptions)
      issuedIDs.add(id)
      return id
    },
    next(input = {}) {
      return this.entryID(input)
    },
  }
}

export function createPiIdentityWorkspaceResolverAtom(options: PiIdentityWorkspaceResolverOptions = {}): PiIdentityWorkspaceResolverAtom {
  const cwdExists = options.cwdExists ?? (() => true)
  return {
    cwd(input = {}) {
      const rawCwd = input.cwd ?? readPiIdentityWorkspaceOption(options.cwd) ?? process.cwd()
      return resolvePiIdentityWorkspacePath(rawCwd, input.baseDir ?? options.baseDir)
    },
    encodedCwd(input = {}) {
      return encodePiIdentityWorkspaceCwd(this.cwd(input))
    },
    sessionDir(input = {}) {
      const explicitSessionDir = input.sessionDir ?? options.sessionDir
      if (explicitSessionDir) return normalizePiIdentityWorkspacePath(explicitSessionDir, piIdentityWorkspacePathOptions(options.homeDir))
      return piIdentityDefaultSessionDir(this.cwd(input), input.agentDir ?? options.agentDir, piIdentityDefaultSessionDirOptions(input.baseDir ?? options.baseDir, options.homeDir))
    },
    sessionHeader(input = {}) {
      const header: PiIdentitySessionHeader = {
        type: "session",
        version: 3,
        id: input.sessionID ?? "pi-session-fixture",
        timestamp: input.timestamp ?? "1970-01-01T00:00:00.000Z",
        cwd: this.cwd(input),
      }
      if (input.parentSession) header.parentSession = input.parentSession
      return header
    },
    openCwd(input = {}) {
      return resolvePiIdentityWorkspacePath(input.cwdOverride ?? input.sessionHeaderCwd ?? input.fallbackCwd ?? process.cwd(), input.baseDir ?? options.baseDir)
    },
    missingSessionCwdIssue(input) {
      const sessionCwd = input.sessionHeaderCwd ?? ""
      if (!input.sessionFile || !sessionCwd || cwdExists(sessionCwd)) return undefined
      return {
        sessionFile: input.sessionFile,
        sessionCwd,
        fallbackCwd: input.fallbackCwd ?? process.cwd(),
      }
    },
  }
}

export function formatPiIdentityClockTimestamp(input: PiIdentityClockInput = new Date()): string {
  return (input instanceof Date ? input : new Date(input)).toISOString()
}

export function normalizePiIdentityWorkspacePath(input: string, options: { homeDir?: string } = {}): string {
  if (input === "~") return options.homeDir ?? homedir()
  if (input.startsWith("~/") || (process.platform === "win32" && input.startsWith("~\\"))) {
    return join(options.homeDir ?? homedir(), input.slice(2))
  }
  if (/^file:\/\//.test(input)) return fileURLToPath(input)
  return input
}

export function resolvePiIdentityWorkspacePath(input: string, baseDir = process.cwd(), options: { homeDir?: string } = {}): string {
  const normalized = normalizePiIdentityWorkspacePath(input, options)
  const normalizedBaseDir = normalizePiIdentityWorkspacePath(baseDir, options)
  return isAbsolute(normalized) ? resolveNodePath(normalized) : resolveNodePath(normalizedBaseDir, normalized)
}

export function encodePiIdentityWorkspaceCwd(cwd: string): string {
  return `--${cwd.replace(/^[/\\]/, "").replace(/[/\\:]/g, "-")}--`
}

export function piIdentityDefaultAgentDir(homeDir = homedir(), configDirName = ".pi"): string {
  return join(homeDir, configDirName, "agent")
}

export function piIdentityDefaultSessionDir(
  cwd: string,
  agentDir = piIdentityDefaultAgentDir(),
  options: { baseDir?: string; homeDir?: string } = {},
): string {
  const resolvedCwd = resolvePiIdentityWorkspacePath(cwd, options.baseDir, options)
  const resolvedAgentDir = resolvePiIdentityWorkspacePath(agentDir, options.baseDir, options)
  return join(resolvedAgentDir, "sessions", encodePiIdentityWorkspaceCwd(resolvedCwd))
}

export function generatePiIdentityEntryID(
  existingIDs: ReadonlySet<string>,
  options: {
    now?: () => number
    randomBytes?: () => Uint8Array
    state?: PiIdentityUUIDV7State
  } = {},
): string {
  const state = options.state ?? createPiIdentityUUIDV7State()
  for (let index = 0; index < 100; index += 1) {
    const id = generatePiIdentityUUIDV7({ ...options, state }).slice(0, 8)
    if (!existingIDs.has(id)) return id
  }
  return generatePiIdentityUUIDV7({ ...options, state })
}

export function generatePiIdentityUUIDV7(options: {
  now?: () => number
  randomBytes?: () => Uint8Array
  state?: PiIdentityUUIDV7State
} = {}): string {
  const state = options.state ?? createPiIdentityUUIDV7State()
  const random = new Uint8Array(16)
  fillPiIdentityRandomBytes(random, options.randomBytes)
  const timestamp = options.now?.() ?? Date.now()

  if (timestamp > state.lastTimestamp) {
    state.sequence = byteAt(random, 6) * 0x1000000 + byteAt(random, 7) * 0x10000 + byteAt(random, 8) * 0x100 + byteAt(random, 9)
    state.lastTimestamp = timestamp
  } else {
    state.sequence = (state.sequence + 1) >>> 0
    if (state.sequence === 0) {
      state.lastTimestamp += 1
    }
  }

  const bytes = new Uint8Array(16)
  bytes[0] = (state.lastTimestamp / 0x10000000000) & 0xff
  bytes[1] = (state.lastTimestamp / 0x100000000) & 0xff
  bytes[2] = (state.lastTimestamp / 0x1000000) & 0xff
  bytes[3] = (state.lastTimestamp / 0x10000) & 0xff
  bytes[4] = (state.lastTimestamp / 0x100) & 0xff
  bytes[5] = state.lastTimestamp & 0xff
  bytes[6] = 0x70 | ((state.sequence >>> 28) & 0x0f)
  bytes[7] = (state.sequence >>> 20) & 0xff
  bytes[8] = 0x80 | ((state.sequence >>> 14) & 0x3f)
  bytes[9] = (state.sequence >>> 6) & 0xff
  bytes[10] = ((state.sequence & 0x3f) << 2) | (byteAt(random, 10) & 0x03)
  bytes[11] = byteAt(random, 11)
  bytes[12] = byteAt(random, 12)
  bytes[13] = byteAt(random, 13)
  bytes[14] = byteAt(random, 14)
  bytes[15] = byteAt(random, 15)

  return formatPiIdentityUUID(bytes)
}

export function buildPiMonoIdentityIDGeneratorNativeExactFixture(): PiMonoIdentityIDGeneratorNativeExactFixture {
  const sessionIDGenerator = createPiIdentityIDGeneratorAtom({
    now: () => 0,
    randomBytes: zeroRandomBytes,
  })
  const shortEntryGenerator = createPiIdentityIDGeneratorAtom({
    now: () => 0,
    randomBytes: zeroRandomBytes,
  })
  const collisionEntryGenerator = createPiIdentityIDGeneratorAtom({
    now: () => 0,
    randomBytes: zeroRandomBytes,
    existingIDs: ["00000000"],
  })
  const fixtureWithoutFingerprint: Omit<PiMonoIdentityIDGeneratorNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoIdentityIDGeneratorNativeExactAtomID,
    portID: "identity.id-generator" as const,
    upstreamRef: piMonoIdentityUpstreamRef,
    evidenceRef: piMonoIdentityIDGeneratorNativeExactEvidenceRef,
    fixtureID: piMonoIdentityIDGeneratorNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      sessionIDsUseUUIDV7: true as const,
      entryIDsUseFirstEightUUIDV7Chars: true as const,
      entryIDsRetryShortIDCollisionsOneHundredTimes: true as const,
      entryIDsFallBackToFullUUIDV7AfterCollisions: true as const,
      uuidV7EmbedsUnixMilliseconds: true as const,
      uuidV7SetsVersionAndVariantBits: true as const,
    },
    cases: [
      {
        scenarioID: "session-id-full-uuidv7" as const,
        input: { timestamp: 0, randomBytes: "all-zero" as const, existingIDs: [] },
        output: sessionIDGenerator.sessionID({ timestamp: 0 }),
        outputKind: "full-uuidv7" as const,
        upstreamBehavior: "createSessionId returns uuidv7() for Pi JSONL session header IDs.",
      },
      {
        scenarioID: "entry-id-short-uuidv7-prefix" as const,
        input: { timestamp: 0, randomBytes: "all-zero" as const, existingIDs: [] },
        output: shortEntryGenerator.entryID({ timestamp: 0 }),
        outputKind: "short-uuidv7-prefix" as const,
        upstreamBehavior: "generateEntryId calls uuidv7().slice(0, 8) and returns the short ID when it is not already present in byId.",
      },
      {
        scenarioID: "entry-id-full-uuidv7-after-short-collisions" as const,
        input: { timestamp: 0, randomBytes: "all-zero" as const, existingIDs: ["00000000"] },
        output: collisionEntryGenerator.entryID({ timestamp: 0, existingIDs: ["00000000"] }),
        outputKind: "full-uuidv7" as const,
        upstreamBehavior: "generateEntryId retries 100 short uuidv7 prefixes and then returns a full uuidv7 when every short candidate collides.",
      },
    ],
    sourceRefs: [
      `${piMonoIdentityUpstreamRef}:packages/agent/src/harness/session/repo-utils.ts#createSessionId`,
      `${piMonoIdentityUpstreamRef}:packages/agent/src/harness/session/jsonl-storage.ts#generateEntryId,JsonlSessionStorage.createEntryId`,
      `${piMonoIdentityUpstreamRef}:packages/agent/src/harness/session/memory-storage.ts#generateEntryId,MemorySessionStorage.createEntryId`,
      `${piMonoIdentityUpstreamRef}:packages/agent/src/harness/session/uuid.ts#fillRandomBytes,uuidv7,formatUuid`,
      `${piMonoIdentityUpstreamRef}:packages/coding-agent/src/core/session-manager.ts#createSessionId`,
    ],
    nativeEvidenceRefs: [...piMonoIdentityIDGeneratorNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoIdentityIDGeneratorNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoIdentityWorkspaceResolverNativeExactFixture(): PiMonoIdentityWorkspaceResolverNativeExactFixture {
  const resolver = createPiIdentityWorkspaceResolverAtom({
    baseDir: "/workspace",
    agentDir: "/home/pi/.pi/agent",
    cwdExists: (path) => path !== "/missing/project",
  })
  const fixtureWithoutFingerprint: Omit<PiMonoIdentityWorkspaceResolverNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoIdentityWorkspaceResolverNativeExactAtomID,
    portID: "identity.workspace-resolver" as const,
    upstreamRef: piMonoIdentityUpstreamRef,
    evidenceRef: piMonoIdentityWorkspaceResolverNativeExactEvidenceRef,
    fixtureID: piMonoIdentityWorkspaceResolverNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      runtimeCwdUsesProcessCwd: true as const,
      cwdResolutionUsesResolvePath: true as const,
      defaultSessionDirUsesAgentDirSessions: true as const,
      sessionDirsEncodeCwdWithDashWrappedPath: true as const,
      sessionHeadersPersistCwd: true as const,
      openSessionUsesHeaderCwdUnlessOverride: true as const,
      missingSessionCwdGuardRequiresExistingPath: true as const,
    },
    cases: [
      {
        scenarioID: "default-session-dir-encodes-resolved-cwd" as const,
        input: { cwd: "project/app", baseDir: "/workspace", agentDir: "/home/pi/.pi/agent" },
        output: {
          cwd: resolver.cwd({ cwd: "project/app" }),
          encodedCwd: resolver.encodedCwd({ cwd: "project/app" }),
          sessionDir: resolver.sessionDir({ cwd: "project/app" }),
        },
        upstreamBehavior: "getDefaultSessionDir resolves cwd and agentDir, then stores sessions under <agentDir>/sessions/--encoded-cwd--.",
      },
      {
        scenarioID: "session-header-persists-resolved-cwd" as const,
        input: { cwd: "/workspace/project", sessionID: "pi-session-fixture", timestamp: "2026-06-12T00:00:00.000Z" },
        output: {
          header: resolver.sessionHeader({
            cwd: "/workspace/project",
            sessionID: "pi-session-fixture",
            timestamp: "2026-06-12T00:00:00.000Z",
          }),
        },
        upstreamBehavior: "SessionManager.newSession and JsonlSessionStorage.create persist the resolved cwd in the JSONL session header.",
      },
      {
        scenarioID: "open-session-prefers-header-cwd" as const,
        input: { sessionHeaderCwd: "/workspace/project", fallbackCwd: "/fallback" },
        output: { cwd: resolver.openCwd({ sessionHeaderCwd: "/workspace/project", fallbackCwd: "/fallback" }) },
        upstreamBehavior: "SessionManager.open uses the session header cwd when no cwd override is supplied.",
      },
      {
        scenarioID: "open-session-cwd-override-wins" as const,
        input: { cwdOverride: "/override/project", sessionHeaderCwd: "/workspace/project" },
        output: { cwd: resolver.openCwd({ cwdOverride: "/override/project", sessionHeaderCwd: "/workspace/project" }) },
        upstreamBehavior: "SessionManager.open accepts a cwdOverride and resolves it before using header cwd.",
      },
      {
        scenarioID: "missing-session-cwd-issue" as const,
        input: { sessionFile: "/sessions/missing.jsonl", sessionHeaderCwd: "/missing/project", fallbackCwd: "/workspace/current", cwdExists: false },
        output: {
          issue: resolver.missingSessionCwdIssue({
            sessionFile: "/sessions/missing.jsonl",
            sessionHeaderCwd: "/missing/project",
            fallbackCwd: "/workspace/current",
          }),
        },
        upstreamBehavior: "getMissingSessionCwdIssue reports the session file, missing stored cwd, and current fallback cwd when a persisted session cwd no longer exists.",
      },
    ],
    sourceRefs: [
      `${piMonoIdentityUpstreamRef}:packages/coding-agent/src/utils/paths.ts#normalizePath,resolvePath`,
      `${piMonoIdentityUpstreamRef}:packages/coding-agent/src/config.ts#getAgentDir,getSessionsDir,ENV_SESSION_DIR`,
      `${piMonoIdentityUpstreamRef}:packages/coding-agent/src/core/session-manager.ts#getDefaultSessionDir,SessionManager.create,SessionManager.open,SessionManager.forkFrom,getCwd,getSessionDir,getSessionFile`,
      `${piMonoIdentityUpstreamRef}:packages/coding-agent/src/core/session-cwd.ts#getMissingSessionCwdIssue,MissingSessionCwdError`,
      `${piMonoIdentityUpstreamRef}:packages/coding-agent/src/main.ts#createSessionManager,main`,
      `${piMonoIdentityUpstreamRef}:packages/agent/src/harness/session/jsonl-repo.ts#encodeCwd,JsonlSessionRepo.getSessionDir,JsonlSessionRepo.create`,
      `${piMonoIdentityUpstreamRef}:packages/agent/src/harness/session/jsonl-storage.ts#SessionHeader,JsonlSessionStorage.create,loadJsonlSessionMetadata`,
    ],
    nativeEvidenceRefs: [...piMonoIdentityWorkspaceResolverNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoIdentityWorkspaceResolverNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoIdentityClockNativeExactFixture(): PiMonoIdentityClockNativeExactFixture {
  const clock = createPiIdentityClockFormatAtom()
  const fixtureWithoutFingerprint: Omit<PiMonoIdentityClockNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoIdentityClockNativeExactAtomID,
    portID: "identity.clock" as const,
    upstreamRef: piMonoIdentityUpstreamRef,
    evidenceRef: piMonoIdentityClockNativeExactEvidenceRef,
    fixtureID: piMonoIdentityClockNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      timestampsUseDateToISOString: true as const,
      serializedTimestampsAreUTCISOString: true as const,
      timestampPrecisionIsMilliseconds: true as const,
      jsonlSessionHeaderUsesStringTimestamp: true as const,
      jsonlSessionEntriesUseStringTimestamp: true as const,
      noLocaleOrTimezoneFormatting: true as const,
    },
    cases: [
      {
        scenarioID: "epoch-utc-iso-string" as const,
        input: { now: "1970-01-01T00:00:00.000Z" },
        output: clock.timestamp({ now: new Date("1970-01-01T00:00:00.000Z") }),
        upstreamBehavior: "createTimestamp and JSONL session writes serialize timestamps with new Date().toISOString().",
      },
      {
        scenarioID: "millisecond-precision-utc-iso-string" as const,
        input: { now: "2026-06-12T00:00:00.007Z" },
        output: clock.timestamp({ now: new Date("2026-06-12T00:00:00.007Z") }),
        upstreamBehavior: "Pi JSONL header and entry timestamps preserve millisecond precision in UTC ISO string form.",
      },
      {
        scenarioID: "numeric-timestamp-utc-iso-string" as const,
        input: { now: 1767225599999 },
        output: clock.timestamp({ now: 1767225599999 }),
        upstreamBehavior: "The native clock formatting path is Date#toISOString, independent of locale or timezone formatting.",
      },
    ],
    sourceRefs: [
      `${piMonoIdentityUpstreamRef}:packages/agent/src/harness/session/repo-utils.ts#createTimestamp`,
      `${piMonoIdentityUpstreamRef}:packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.create,setLeafId,append`,
      `${piMonoIdentityUpstreamRef}:packages/coding-agent/src/core/session-manager.ts#newSession,appendMessage,exportSession`,
    ],
    nativeEvidenceRefs: [...piMonoIdentityClockNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoIdentityClockNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoIdentityClockNativeExactFixture(
  fixture: PiMonoIdentityClockNativeExactFixture,
): PiMonoIdentityClockNativeExactVerification {
  const canonical = buildPiMonoIdentityClockNativeExactFixture()
  const issues: PiMonoIdentityClockNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-identity-clock-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi identity clock behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoIdentityClockNativeExactAtomID || fixture.portID !== "identity.clock") {
    issues.push({ id: "pi-identity-clock-native-exact.identity", message: "Fixture must remain scoped to the Pi identity.clock atom." })
  }
  if (fixture.upstreamRef !== piMonoIdentityUpstreamRef || !fixture.sourceRefs.some((ref) => ref.includes("repo-utils.ts#createTimestamp")) || !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#JsonlSessionStorage.create"))) {
    issues.push({ id: "pi-identity-clock-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream timestamp serialization sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-identity-clock-native-exact.native-claim", message: "Pi identity clock fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoIdentityClockNativeDescriptor.knownLossiness.length > 0) {
    issues.push({ id: "pi-identity-clock-native-exact.lossiness", message: "Native exact Pi identity clock fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoIdentityClockNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoIdentityClockNativeExactReplayRef)) {
    issues.push({ id: "pi-identity-clock-native-exact.evidence", message: "Pi identity clock native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoIdentityClockNativeExactFixtureID)) {
    issues.push({ id: "pi-identity-clock-native-exact.fixture", message: "Pi identity clock native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-identity-clock-native-exact.policy", message: "Pi identity clock policy drifted from upstream Date#toISOString behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases) || !fixture.cases.every((item) => utcISOStringPattern.test(item.output))) {
    issues.push({ id: "pi-identity-clock-native-exact.cases", message: "Pi identity clock cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyPiMonoIdentityIDGeneratorNativeExactFixture(
  fixture: PiMonoIdentityIDGeneratorNativeExactFixture,
): PiMonoIdentityIDGeneratorNativeExactVerification {
  const canonical = buildPiMonoIdentityIDGeneratorNativeExactFixture()
  const issues: PiMonoIdentityIDGeneratorNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-identity-id-generator-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi identity ID behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoIdentityIDGeneratorNativeExactAtomID || fixture.portID !== "identity.id-generator") {
    issues.push({ id: "pi-identity-id-generator-native-exact.identity", message: "Fixture must remain scoped to the Pi identity.id-generator atom." })
  }
  if (fixture.upstreamRef !== piMonoIdentityUpstreamRef || !fixture.sourceRefs.some((ref) => ref.includes("repo-utils.ts#createSessionId")) || !fixture.sourceRefs.some((ref) => ref.includes("uuid.ts#fillRandomBytes,uuidv7,formatUuid"))) {
    issues.push({ id: "pi-identity-id-generator-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream UUIDv7 ID sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-identity-id-generator-native-exact.native-claim", message: "Pi identity ID fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoIdentityIDGeneratorNativeDescriptor.knownLossiness.length > 0) {
    issues.push({ id: "pi-identity-id-generator-native-exact.lossiness", message: "Native exact Pi identity ID fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoIdentityIDGeneratorNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoIdentityIDGeneratorNativeExactReplayRef)) {
    issues.push({ id: "pi-identity-id-generator-native-exact.evidence", message: "Pi identity ID native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoIdentityIDGeneratorNativeExactFixtureID)) {
    issues.push({ id: "pi-identity-id-generator-native-exact.fixture", message: "Pi identity ID native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-identity-id-generator-native-exact.policy", message: "Pi identity ID policy drifted from upstream UUIDv7 behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases) || !fixture.cases.every((item) => item.outputKind === "short-uuidv7-prefix" ? shortHexPattern.test(item.output) : uuidV7Pattern.test(item.output))) {
    issues.push({ id: "pi-identity-id-generator-native-exact.cases", message: "Pi identity ID cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyPiMonoIdentityWorkspaceResolverNativeExactFixture(
  fixture: PiMonoIdentityWorkspaceResolverNativeExactFixture,
): PiMonoIdentityWorkspaceResolverNativeExactVerification {
  const canonical = buildPiMonoIdentityWorkspaceResolverNativeExactFixture()
  const issues: PiMonoIdentityWorkspaceResolverNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-identity-workspace-resolver-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi workspace resolver behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoIdentityWorkspaceResolverNativeExactAtomID || fixture.portID !== "identity.workspace-resolver") {
    issues.push({ id: "pi-identity-workspace-resolver-native-exact.identity", message: "Fixture must remain scoped to the Pi identity.workspace-resolver atom." })
  }
  if (fixture.upstreamRef !== piMonoIdentityUpstreamRef || !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#getDefaultSessionDir")) || !fixture.sourceRefs.some((ref) => ref.includes("jsonl-repo.ts#encodeCwd"))) {
    issues.push({ id: "pi-identity-workspace-resolver-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream cwd, session dir, and session header sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-identity-workspace-resolver-native-exact.native-claim", message: "Pi workspace resolver fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoIdentityWorkspaceResolverNativeDescriptor.knownLossiness.length > 0) {
    issues.push({ id: "pi-identity-workspace-resolver-native-exact.lossiness", message: "Native exact Pi workspace resolver fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoIdentityWorkspaceResolverNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoIdentityWorkspaceResolverNativeExactReplayRef)) {
    issues.push({ id: "pi-identity-workspace-resolver-native-exact.evidence", message: "Pi workspace resolver native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoIdentityWorkspaceResolverNativeExactFixtureID)) {
    issues.push({ id: "pi-identity-workspace-resolver-native-exact.fixture", message: "Pi workspace resolver native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-identity-workspace-resolver-native-exact.policy", message: "Pi workspace resolver policy drifted from upstream cwd/session path behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases) || !fixture.cases.some((item) => item.scenarioID === "missing-session-cwd-issue")) {
    issues.push({ id: "pi-identity-workspace-resolver-native-exact.cases", message: "Pi workspace resolver cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

const utcISOStringPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const shortHexPattern = /^[0-9a-f]{8}$/
const uuidV7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function readPiIdentityWorkspaceOption(value: string | (() => string) | undefined): string | undefined {
  return typeof value === "function" ? value() : value
}

function piIdentityWorkspacePathOptions(homeDir: string | undefined): { homeDir?: string } {
  return homeDir ? { homeDir } : {}
}

function piIdentityDefaultSessionDirOptions(baseDir: string | undefined, homeDir: string | undefined): { baseDir?: string; homeDir?: string } {
  const options: { baseDir?: string; homeDir?: string } = {}
  if (baseDir) options.baseDir = baseDir
  if (homeDir) options.homeDir = homeDir
  return options
}

function zeroRandomBytes(): Uint8Array {
  return new Uint8Array(16)
}

function byteAt(bytes: Uint8Array, index: number): number {
  return bytes[index] ?? 0
}

function fillPiIdentityRandomBytes(bytes: Uint8Array, randomBytes?: () => Uint8Array): void {
  if (randomBytes) {
    const supplied = randomBytes()
    if (supplied.length !== bytes.length) {
      throw new Error(`Pi identity id randomBytes must return ${bytes.length} bytes.`)
    }
    bytes.set(supplied)
    return
  }
  const crypto = (globalThis as { crypto?: { getRandomValues?: (target: Uint8Array) => Uint8Array } }).crypto
  if (crypto?.getRandomValues) {
    crypto.getRandomValues(bytes)
    return
  }
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256)
  }
}

function formatPiIdentityUUID(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`
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
