import { createHash } from "node:crypto"

export const piMonoSessionUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoSessionIDGeneratorNativeExactAtomID = "pi.session.id-generator"
export const piMonoSessionIDGeneratorNativeExactFixtureID = "pi-session-id-generator:native-exact-fixture"
export const piMonoSessionIDGeneratorNativeExactEvidenceRef = "conformance:pi-session-id-generator-native-exact-fixture"
export const piMonoSessionIDGeneratorNativeExactReplayRef = "session-id-generator-native-exact:pi-mono"
export const piMonoSessionBranchGraphLeafTreeNativeExactAtomID = "pi.session.branch-graph.leaf-tree"
export const piMonoSessionBranchGraphActiveLeafNativeExactAtomID = "pi.session.branch-graph.active-leaf"
export const piMonoSessionBranchGraphNativeExactAtomIDs = [
  piMonoSessionBranchGraphLeafTreeNativeExactAtomID,
  piMonoSessionBranchGraphActiveLeafNativeExactAtomID,
] as const
export const piMonoSessionBranchGraphNativeExactFixtureID = "pi-session-branch-graph:native-exact-fixture"
export const piMonoSessionBranchGraphNativeExactEvidenceRef = "conformance:pi-session-branch-graph-native-exact-fixture"
export const piMonoSessionBranchGraphNativeExactReplayRef = "session-branch-graph-native-exact:pi-mono"
export const piMonoSessionActivePathNativeExactAtomID = "pi.session.pagination.active-path"
export const piMonoSessionContextSelectorActiveLeafNativeExactAtomID = "pi.session.context-selector.active-leaf"
export const piMonoSessionContextSelectorNativeExactAtomIDs = [
  piMonoSessionActivePathNativeExactAtomID,
  piMonoSessionContextSelectorActiveLeafNativeExactAtomID,
] as const
export const piMonoSessionContextSelectorNativeExactFixtureID = "pi-session-context-selector:native-exact-fixture"
export const piMonoSessionContextSelectorNativeExactEvidenceRef = "conformance:pi-session-context-selector-native-exact-fixture"
export const piMonoSessionContextSelectorNativeExactReplayRef = "session-context-selector-native-exact:pi-mono"
export const piMonoSessionStoreJsonlV3NativeExactAtomID = "pi.session.store.jsonl-v3"
export const piMonoSessionStoreJsonlV3NativeExactFixtureID = "pi-session-store-jsonl-v3:native-exact-fixture"
export const piMonoSessionStoreJsonlV3NativeExactEvidenceRef = "conformance:pi-session-store-jsonl-v3-native-exact-fixture"
export const piMonoSessionStoreJsonlV3NativeExactReplayRef = "session-store-jsonl-v3-native-exact:pi-mono"
export const piMonoSessionStoreJsonlV3MigratorNativeExactAtomID = "pi.session.store.jsonl-v3-migrator"
export const piMonoSessionStoreJsonlV3MigratorNativeExactFixtureID = "pi-session-store-jsonl-v3-migrator:native-exact-fixture"
export const piMonoSessionStoreJsonlV3MigratorNativeExactEvidenceRef = "conformance:pi-session-store-jsonl-v3-migrator-native-exact-fixture"
export const piMonoSessionStoreJsonlV3MigratorNativeExactReplayRef = "session-store-jsonl-v3-migrator-native-exact:pi-mono"
export const piMonoSessionProjectorJsonlNativeExactAtomID = "pi.session.projector.jsonl"
export const piMonoSessionProjectorJsonlV3NativeExactAtomID = "pi.session.projector.jsonl-v3"
export const piMonoSessionProjectorJsonlV3NativeExactFixtureID = "pi-session-projector-jsonl-v3:native-exact-fixture"
export const piMonoSessionProjectorJsonlV3NativeExactEvidenceRef = "conformance:pi-session-projector-jsonl-v3-native-exact-fixture"
export const piMonoSessionProjectorJsonlV3NativeExactReplayRef = "session-projector-jsonl-v3-native-exact:pi-mono"
export const piMonoSessionBranchSummaryNativeExactAtomID = "pi.session.branch-summary"
export const piMonoSessionBranchSummaryNativeExactFixtureID = "pi-session-branch-summary:native-exact-fixture"
export const piMonoSessionBranchSummaryNativeExactEvidenceRef = "conformance:pi-session-branch-summary-native-exact-fixture"
export const piMonoSessionBranchSummaryNativeExactReplayRef = "session-branch-summary-native-exact:pi-mono"
export const piMonoSessionMessagePartProjectorNativeExactAtomID = "pi.session.message-part-projector.native-like"
export const piMonoSessionMessagePartProjectorNativeExactFixtureID = "pi-session-message-part-projector:native-exact-fixture"
export const piMonoSessionMessagePartProjectorNativeExactEvidenceRef = "conformance:pi-session-message-part-projector-native-exact-fixture"
export const piMonoSessionMessagePartProjectorNativeExactReplayRef = "session-message-part-projector-native-exact:pi-mono"
export const piMonoSessionEventLogSessionManagerNativeExactAtomID = "pi.session.event-log.session-manager"
export const piMonoSessionReaderSessionManagerNativeExactAtomID = "pi.session.reader.session-manager"
export const piMonoSessionWriterSessionManagerNativeExactAtomID = "pi.session.writer.session-manager"
export const piMonoSessionMessageStoreSessionManagerNativeExactAtomID = "pi.session.message-store.session-manager"
export const piMonoSessionBranchingSessionManagerNativeExactAtomID = "pi.session.branching.session-manager"
export const piMonoSessionDiffSessionManagerNativeExactAtomID = "pi.session.diff.session-manager"
export const piMonoSessionManagerNativeExactAtomIDs = [
  piMonoSessionEventLogSessionManagerNativeExactAtomID,
  piMonoSessionReaderSessionManagerNativeExactAtomID,
  piMonoSessionWriterSessionManagerNativeExactAtomID,
  piMonoSessionMessageStoreSessionManagerNativeExactAtomID,
  piMonoSessionBranchingSessionManagerNativeExactAtomID,
  piMonoSessionDiffSessionManagerNativeExactAtomID,
] as const
export const piMonoSessionManagerNativeExactPortIDs = [
  "session.event-log",
  "session.reader",
  "session.writer",
  "session.message-store",
  "session.branching",
  "session.diff",
] as const
export const piMonoSessionManagerNativeExactFixtureID = "pi-session-manager:native-exact-fixture"
export const piMonoSessionManagerNativeExactEvidenceRef = "conformance:pi-session-manager-native-exact-fixture"
export const piMonoSessionManagerNativeExactReplayRef = "session-manager-native-exact:pi-mono"

export type PiMonoSessionIDGeneratorScenarioID =
  | "short-uuidv7-prefix"
  | "full-uuidv7-after-100-short-id-collisions"
  | "explicit-seed-compatibility"

export interface PiMonoSessionIDGeneratorNativeExactCase {
  scenarioID: PiMonoSessionIDGeneratorScenarioID
  input: {
    timestamp: number
    randomBytes: "all-zero"
    existingIDs: string[]
    seed?: string
  }
  output: string
  outputKind: "short-uuidv7-prefix" | "full-uuidv7" | "explicit-seed"
  upstreamBehavior: string
}

export interface PiMonoSessionIDGeneratorNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoSessionIDGeneratorNativeExactAtomID
  portID: "session.id-generator"
  upstreamRef: typeof piMonoSessionUpstreamRef
  evidenceRef: typeof piMonoSessionIDGeneratorNativeExactEvidenceRef
  fixtureID: typeof piMonoSessionIDGeneratorNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    entryIDUsesUUIDV7: true
    entryIDPrefersFirstEightUUIDChars: true
    entryIDRetriesShortIDCollisionsOneHundredTimes: true
    entryIDFallsBackToFullUUIDV7AfterCollisions: true
    sessionHeaderIDIsCallerProvided: true
    sessionTimestampsUseISOString: true
    seedOverrideIsHarnessCompatibilityOnly: true
  }
  cases: PiMonoSessionIDGeneratorNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoSessionIDGeneratorNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoSessionIDGeneratorNativeExactVerification {
  ok: boolean
  issues: PiMonoSessionIDGeneratorNativeExactIssue[]
}

export interface PiMonoJsonlSessionHeader {
  type: "session"
  version: 3
  id: string
  timestamp: string
  cwd: string
  parentSession?: string
}

export interface PiMonoJsonlSessionEntryBase {
  type: string
  id: string
  parentId: string | null
  timestamp: string
}

export interface PiMonoJsonlGenericEntry extends PiMonoJsonlSessionEntryBase {
  [key: string]: unknown
}

export interface PiMonoJsonlLeafEntry extends PiMonoJsonlSessionEntryBase {
  type: "leaf"
  targetId: string | null
}

export interface PiMonoJsonlLabelEntry extends PiMonoJsonlSessionEntryBase {
  type: "label"
  targetId: string
  label?: string
}

export type PiMonoJsonlSessionEntry = PiMonoJsonlLeafEntry | PiMonoJsonlLabelEntry | PiMonoJsonlGenericEntry

export interface PiMonoJsonlBranchGraphSnapshot {
  entries: PiMonoJsonlSessionEntry[]
  currentLeafId: string | null
  labelsById: Record<string, string>
}

export interface PiMonoJsonlSessionMetadata {
  id: string
  createdAt: string
  cwd: string
  path: string
  parentSessionPath?: string
}

export interface PiMonoJsonlStorageSnapshot {
  metadata: PiMonoJsonlSessionMetadata
  entries: PiMonoJsonlSessionEntry[]
  currentLeafId: string | null
  labelsById: Record<string, string>
  content: string
}

export interface PiMonoMigratableSessionHeader {
  type: "session"
  version?: number
  id: string
  timestamp: string
  cwd: string
  parentSession?: string
  [key: string]: unknown
}

export interface PiMonoMigratableSessionEntry {
  type: string
  id?: string
  parentId?: string | null
  timestamp?: string
  message?: unknown
  firstKeptEntryIndex?: number
  firstKeptEntryId?: string | undefined
  [key: string]: unknown
}

export type PiMonoMigratableSessionFileEntry = PiMonoMigratableSessionHeader | PiMonoMigratableSessionEntry

export interface PiMonoSessionMigrationSnapshot {
  startingVersion: number
  finalVersion: number
  migrated: boolean
  entries: PiMonoMigratableSessionFileEntry[]
}

export interface PiMonoSessionContextSnapshot {
  pathIDs: string[]
  messages: unknown[]
  thinkingLevel: string
  model: { provider: string; modelId: string } | null
}

export type PiMonoSessionNativeErrorCode = "invalid_session" | "invalid_entry" | "not_found"

export class PiMonoSessionNativeError extends Error {
  readonly code: PiMonoSessionNativeErrorCode

  constructor(code: PiMonoSessionNativeErrorCode, message: string, cause?: Error) {
    super(message, cause ? { cause } : undefined)
    this.name = "PiMonoSessionNativeError"
    this.code = code
  }
}

export type PiMonoSessionBranchGraphNativeScenarioID =
  | "append-entry-sets-active-leaf"
  | "leaf-entry-switches-active-leaf"
  | "label-cache-trims-and-deletes"
  | "strict-jsonl-v3-parsing"
  | "repo-cwd-path-encoding"

export interface PiMonoSessionBranchGraphNativeExactCase {
  scenarioID: PiMonoSessionBranchGraphNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoSessionBranchGraphNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: typeof piMonoSessionBranchGraphNativeExactAtomIDs
  portID: "session.branch-graph"
  upstreamRef: typeof piMonoSessionUpstreamRef
  evidenceRef: typeof piMonoSessionBranchGraphNativeExactEvidenceRef
  fixtureID: typeof piMonoSessionBranchGraphNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    appendEntryUpdatesCurrentLeafToEntryID: true
    leafEntryUpdatesCurrentLeafToTargetID: true
    leafEntryParentIsPreviousCurrentLeaf: true
    getPathToRootFollowsParentID: true
    missingPathParentInvalidatesSession: true
    labelCacheTrimsBlankLabelsAndDeletes: true
    jsonlV3RequiresStringTimestamps: true
    cwdDirectoryEncodingMatchesRepo: true
  }
  cases: PiMonoSessionBranchGraphNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoSessionBranchGraphNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoSessionBranchGraphNativeExactVerification {
  ok: boolean
  issues: PiMonoSessionBranchGraphNativeExactIssue[]
}

export type PiMonoSessionContextSelectorNativeScenarioID =
  | "get-branch-follows-active-leaf"
  | "context-selector-follows-active-leaf"
  | "null-leaf-selects-empty-context"
  | "undefined-leaf-falls-back-to-last-entry"

export interface PiMonoSessionContextSelectorNativeExactCase {
  scenarioID: PiMonoSessionContextSelectorNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoSessionContextSelectorNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: typeof piMonoSessionContextSelectorNativeExactAtomIDs
  portIDs: ["session.pagination", "session.context-selector"]
  upstreamRef: typeof piMonoSessionUpstreamRef
  evidenceRef: typeof piMonoSessionContextSelectorNativeExactEvidenceRef
  fixtureID: typeof piMonoSessionContextSelectorNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    getBranchUsesCurrentLeafWhenFromIdMissing: true
    getBranchWalksParentIdsToRoot: true
    buildSessionContextUsesRequestedLeafPath: true
    buildSessionContextNullLeafReturnsEmptyMessages: true
    buildSessionContextUndefinedLeafFallsBackToLastEntry: true
    thinkingAndModelChangesAreResolvedAlongActivePath: true
  }
  cases: PiMonoSessionContextSelectorNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoSessionContextSelectorNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoSessionContextSelectorNativeExactVerification {
  ok: boolean
  issues: PiMonoSessionContextSelectorNativeExactIssue[]
}

export type PiMonoSessionStoreJsonlV3NativeScenarioID =
  | "create-writes-header-metadata"
  | "open-loads-jsonl-v3-ignoring-blank-lines"
  | "append-entry-persists-jsonl-and-current-leaf"
  | "set-leaf-id-appends-pointer-with-previous-parent"
  | "get-leaf-id-validates-loaded-target"

export interface PiMonoSessionStoreJsonlV3NativeExactCase {
  scenarioID: PiMonoSessionStoreJsonlV3NativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoSessionStoreJsonlV3NativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoSessionStoreJsonlV3NativeExactAtomID
  portID: "session.store"
  upstreamRef: typeof piMonoSessionUpstreamRef
  evidenceRef: typeof piMonoSessionStoreJsonlV3NativeExactEvidenceRef
  fixtureID: typeof piMonoSessionStoreJsonlV3NativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    createWritesJsonlV3HeaderAndMetadata: true
    openFiltersBlankLinesBeforeParsing: true
    appendEntryPersistsOneJsonLineAndUpdatesLeaf: true
    setLeafIdAppendsLeafPointerWithPreviousParent: true
    getLeafIdValidatesLoadedLeafTarget: true
    getEntriesReturnsAppendOrder: true
  }
  cases: PiMonoSessionStoreJsonlV3NativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoSessionStoreJsonlV3NativeExactIssue {
  id: string
  message: string
}

export interface PiMonoSessionStoreJsonlV3NativeExactVerification {
  ok: boolean
  issues: PiMonoSessionStoreJsonlV3NativeExactIssue[]
}

export type PiMonoSessionStoreJsonlV3MigratorNativeScenarioID =
  | "v1-linear-entries-gain-tree-links"
  | "v1-compaction-index-becomes-first-kept-entry-id"
  | "v2-hook-message-role-renamed-to-custom"
  | "v3-current-version-is-left-unchanged"
  | "parser-skips-malformed-and-blank-lines"

export interface PiMonoSessionStoreJsonlV3MigratorNativeExactCase {
  scenarioID: PiMonoSessionStoreJsonlV3MigratorNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoSessionStoreJsonlV3MigratorNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoSessionStoreJsonlV3MigratorNativeExactAtomID
  portID: "session.store"
  upstreamRef: typeof piMonoSessionUpstreamRef
  evidenceRef: typeof piMonoSessionStoreJsonlV3MigratorNativeExactEvidenceRef
  fixtureID: typeof piMonoSessionStoreJsonlV3MigratorNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    missingVersionIsTreatedAsV1: true
    v1MigrationAddsShortRandomUUIDIdsAndParentLinks: true
    v1MigrationConvertsCompactionFirstKeptEntryIndex: true
    v2MigrationRenamesHookMessageRoleToCustom: true
    currentVersionSkipsMutation: true
    parserSkipsBlankAndMalformedLines: true
    loaderRequiresSessionHeaderTypeAndStringID: true
  }
  cases: PiMonoSessionStoreJsonlV3MigratorNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoSessionStoreJsonlV3MigratorNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoSessionStoreJsonlV3MigratorNativeExactVerification {
  ok: boolean
  issues: PiMonoSessionStoreJsonlV3MigratorNativeExactIssue[]
}

export type PiMonoSessionProjectorJsonlV3NativeScenarioID =
  | "message-custom-branch-summary-projection"
  | "compaction-keeps-summary-and-tail"
  | "model-and-thinking-resolution"
  | "non-message-entries-are-ignored"

export interface PiMonoSessionProjectorJsonlV3NativeExactCase {
  scenarioID: PiMonoSessionProjectorJsonlV3NativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoSessionProjectorJsonlV3NativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoSessionProjectorJsonlV3NativeExactAtomID
  portID: "session.projector"
  upstreamRef: typeof piMonoSessionUpstreamRef
  evidenceRef: typeof piMonoSessionProjectorJsonlV3NativeExactEvidenceRef
  fixtureID: typeof piMonoSessionProjectorJsonlV3NativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    buildSessionContextEmitsNativeMessages: true
    customMessagesUseNativeFactoryShape: true
    branchSummaryMessagesUseNativeFactoryShape: true
    compactionSummaryPrecedesRetainedTail: true
    thinkingAndModelResolvedBeforeMessageProjection: true
    nonMessageEntriesAreNotEmitted: true
  }
  cases: PiMonoSessionProjectorJsonlV3NativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoSessionProjectorJsonlV3NativeExactIssue {
  id: string
  message: string
}

export interface PiMonoSessionProjectorJsonlV3NativeExactVerification {
  ok: boolean
  issues: PiMonoSessionProjectorJsonlV3NativeExactIssue[]
}

export type PiMonoSessionMessagePartProjectorNativeScenarioID =
  | "assistant-stream-message-lifecycle"
  | "tool-result-message-persistence"
  | "custom-message-entry-persistence"
  | "context-rebuild-preserves-native-message-parts"

export interface PiMonoSessionMessagePartProjectorNativeExactCase {
  scenarioID: PiMonoSessionMessagePartProjectorNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoSessionMessagePartProjectorNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoSessionMessagePartProjectorNativeExactAtomID
  portID: "session.message-part-projector"
  upstreamRef: typeof piMonoSessionUpstreamRef
  evidenceRef: typeof piMonoSessionMessagePartProjectorNativeExactEvidenceRef
  fixtureID: typeof piMonoSessionMessagePartProjectorNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    assistantStreamUsesMessageUpdateUntilFinalMessageEnd: true
    messageEndPersistsFinalAssistantUserAndToolResultMessages: true
    toolResultMessagesPreserveContentDetailsAndErrorState: true
    customMessagesPersistAsCustomMessageEntries: true
    buildSessionContextRehydratesNativeContentBlocks: true
    extensionMessageEndMutationsPrecedePersistence: true
  }
  cases: PiMonoSessionMessagePartProjectorNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoSessionMessagePartProjectorNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoSessionMessagePartProjectorNativeExactVerification {
  ok: boolean
  issues: PiMonoSessionMessagePartProjectorNativeExactIssue[]
}

export type PiMonoSessionBranchSummaryNativeScenarioID =
  | "move-to-target-appends-leaf-pointer-before-summary"
  | "move-to-null-summary-uses-root-from-id"
  | "move-without-summary-leaves-active-target"
  | "invalid-target-rejected-before-write"

export interface PiMonoSessionBranchSummaryMoveSnapshot {
  entries: PiMonoJsonlSessionEntry[]
  previousLeafId: string | null
  targetLeafId: string | null
  currentLeafId: string | null
  leafEntry: PiMonoJsonlLeafEntry
  summaryEntry?: PiMonoJsonlGenericEntry
  pathIDs: string[]
  context: PiMonoSessionContextSnapshot
}

export interface PiMonoSessionBranchSummaryNativeExactCase {
  scenarioID: PiMonoSessionBranchSummaryNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoSessionBranchSummaryNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoSessionBranchSummaryNativeExactAtomID
  portID: "session.compaction-records"
  upstreamRef: typeof piMonoSessionUpstreamRef
  evidenceRef: typeof piMonoSessionBranchSummaryNativeExactEvidenceRef
  fixtureID: typeof piMonoSessionBranchSummaryNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    moveToValidatesTargetBeforeWrite: true
    moveToAppendsLeafPointerBeforeSummary: true
    leafPointerParentIsPreviousCurrentLeaf: true
    branchSummaryParentIsTargetLeaf: true
    nullTargetBranchSummaryUsesRootFromId: true
    summaryEntryBecomesCurrentLeaf: true
    moveWithoutSummaryLeavesTargetAsCurrentLeaf: true
    contextProjectsBranchSummaryMessage: true
  }
  cases: PiMonoSessionBranchSummaryNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoSessionBranchSummaryNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoSessionBranchSummaryNativeExactVerification {
  ok: boolean
  issues: PiMonoSessionBranchSummaryNativeExactIssue[]
}

export type PiMonoSessionManagerNativeExactPortID = (typeof piMonoSessionManagerNativeExactPortIDs)[number]

export type PiMonoSessionManagerNativeScenarioID =
  | "writer-create-header-and-reader-list"
  | "message-store-appends-native-entries"
  | "event-log-reads-append-only-entry-stream"
  | "branching-switches-active-leaf-with-summary"
  | "diff-returns-entry-and-leaf-transition-records"
  | "reader-transcript-follows-active-branch"

export interface PiMonoSessionManagerNativeExactCase {
  scenarioID: PiMonoSessionManagerNativeScenarioID
  portIDs: PiMonoSessionManagerNativeExactPortID[]
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoSessionManagerNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: typeof piMonoSessionManagerNativeExactAtomIDs
  portIDs: typeof piMonoSessionManagerNativeExactPortIDs
  upstreamRef: typeof piMonoSessionUpstreamRef
  evidenceRef: typeof piMonoSessionManagerNativeExactEvidenceRef
  fixtureID: typeof piMonoSessionManagerNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    sameJsonlEntryStreamBacksAllPorts: true
    writerCreatesJsonlV3HeaderAndSessionInfo: true
    messageStoreAppendsParentLinkedEntries: true
    eventLogReadsAppendOnlyEntryStream: true
    readerProjectsActiveLeafContext: true
    branchingWritesLeafPointerBeforeSummary: true
    diffReadsSessionEventProjection: true
  }
  cases: PiMonoSessionManagerNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoSessionManagerNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoSessionManagerNativeExactVerification {
  ok: boolean
  issues: PiMonoSessionManagerNativeExactIssue[]
}

export const piMonoSessionIDGeneratorNativeDescriptor = {
  id: piMonoSessionIDGeneratorNativeExactAtomID,
  port: "session.id-generator",
  product: "pi-mono",
  implementationKind: "factory",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoSessionIDGeneratorNativeExactEvidenceRef, piMonoSessionIDGeneratorNativeExactReplayRef],
  fixtureIDs: [piMonoSessionIDGeneratorNativeExactFixtureID],
  knownLossiness: [],
  selectionReason: "Pi upstream native implementation with native parity complete session id generator exact fixture coverage.",
} as const

function piMonoSessionBranchGraphNativeDescriptor(id: (typeof piMonoSessionBranchGraphNativeExactAtomIDs)[number]) {
  return {
    id,
    port: "session.branch-graph",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoSessionBranchGraphNativeExactEvidenceRef, piMonoSessionBranchGraphNativeExactReplayRef],
    fixtureIDs: [piMonoSessionBranchGraphNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation with native parity complete JsonlSessionStorage active leaf and leaf tree exact fixture coverage.",
  } as const
}

export const piMonoSessionBranchGraphNativeDescriptors = [
  piMonoSessionBranchGraphNativeDescriptor(piMonoSessionBranchGraphLeafTreeNativeExactAtomID),
  piMonoSessionBranchGraphNativeDescriptor(piMonoSessionBranchGraphActiveLeafNativeExactAtomID),
] as const

export const piMonoSessionContextSelectorNativeDescriptors = [
  {
    id: piMonoSessionActivePathNativeExactAtomID,
    port: "session.pagination",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoSessionContextSelectorNativeExactEvidenceRef, piMonoSessionContextSelectorNativeExactReplayRef],
    fixtureIDs: [piMonoSessionContextSelectorNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation with native parity complete active leaf branch path and context selector exact fixture coverage.",
  },
  {
    id: piMonoSessionContextSelectorActiveLeafNativeExactAtomID,
    port: "session.context-selector",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoSessionContextSelectorNativeExactEvidenceRef, piMonoSessionContextSelectorNativeExactReplayRef],
    fixtureIDs: [piMonoSessionContextSelectorNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation with native parity complete active leaf branch path and context selector exact fixture coverage.",
  },
] as const

export const piMonoSessionStoreJsonlV3NativeDescriptor = {
  id: piMonoSessionStoreJsonlV3NativeExactAtomID,
  port: "session.store",
  product: "pi-mono",
  implementationKind: "factory",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoSessionStoreJsonlV3NativeExactEvidenceRef, piMonoSessionStoreJsonlV3NativeExactReplayRef],
  fixtureIDs: [piMonoSessionStoreJsonlV3NativeExactFixtureID],
  knownLossiness: [],
  selectionReason: "Pi upstream native implementation with native parity complete JSONL v3 session storage create/open/append/leaf fixture coverage.",
} as const

export const piMonoSessionStoreJsonlV3MigratorNativeDescriptor = {
  id: piMonoSessionStoreJsonlV3MigratorNativeExactAtomID,
  port: "session.store",
  product: "pi-mono",
  implementationKind: "factory",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoSessionStoreJsonlV3MigratorNativeExactEvidenceRef, piMonoSessionStoreJsonlV3MigratorNativeExactReplayRef],
  fixtureIDs: [piMonoSessionStoreJsonlV3MigratorNativeExactFixtureID],
  knownLossiness: [],
  selectionReason: "Pi upstream native implementation with native parity complete legacy session migration to JSONL v3 fixture coverage.",
} as const

export const piMonoSessionProjectorJsonlV3NativeDescriptor = {
  id: piMonoSessionProjectorJsonlV3NativeExactAtomID,
  port: "session.projector",
  product: "pi-mono",
  implementationKind: "factory",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoSessionProjectorJsonlV3NativeExactEvidenceRef, piMonoSessionProjectorJsonlV3NativeExactReplayRef],
  fixtureIDs: [piMonoSessionProjectorJsonlV3NativeExactFixtureID],
  knownLossiness: [],
  selectionReason: "Pi upstream native implementation with native parity complete JSONL v3 buildSessionContext projector fixture coverage.",
} as const

export const piMonoSessionProjectorJsonlNativeDescriptor = {
  id: piMonoSessionProjectorJsonlNativeExactAtomID,
  port: "session.projector",
  product: "pi-mono",
  implementationKind: "factory",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoSessionProjectorJsonlV3NativeExactEvidenceRef, piMonoSessionProjectorJsonlV3NativeExactReplayRef],
  fixtureIDs: [piMonoSessionProjectorJsonlV3NativeExactFixtureID],
  knownLossiness: [],
  selectionReason: "Pi upstream native implementation with native parity complete legacy JSONL session projector atom backed by the same JSONL v3 buildSessionContext fixture coverage.",
} as const

export const piMonoSessionMessagePartProjectorNativeDescriptor = {
  id: piMonoSessionMessagePartProjectorNativeExactAtomID,
  port: "session.message-part-projector",
  product: "pi-mono",
  implementationKind: "factory",
  parityCoverage: "native",
  nativeEvidenceRefs: [
    piMonoSessionMessagePartProjectorNativeExactEvidenceRef,
    piMonoSessionMessagePartProjectorNativeExactReplayRef,
  ],
  fixtureIDs: [piMonoSessionMessagePartProjectorNativeExactFixtureID],
  knownLossiness: [],
  selectionReason: "Pi upstream native implementation with native parity complete agent-loop message lifecycle and SessionManager message-part persistence fixture coverage.",
} as const

export const piMonoSessionBranchSummaryNativeDescriptor = {
  id: piMonoSessionBranchSummaryNativeExactAtomID,
  port: "session.compaction-records",
  product: "pi-mono",
  implementationKind: "factory",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoSessionBranchSummaryNativeExactEvidenceRef, piMonoSessionBranchSummaryNativeExactReplayRef],
  fixtureIDs: [piMonoSessionBranchSummaryNativeExactFixtureID],
  knownLossiness: [],
  selectionReason: "Pi upstream native implementation with native parity complete Session.moveTo branch_summary exact fixture coverage.",
} as const

export const piMonoSessionManagerNativeDescriptors = [
  {
    id: piMonoSessionEventLogSessionManagerNativeExactAtomID,
    port: "session.event-log",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoSessionManagerNativeExactEvidenceRef, piMonoSessionManagerNativeExactReplayRef],
    fixtureIDs: [piMonoSessionManagerNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation with native parity complete SessionManager append-only entry stream event-log fixture coverage.",
  },
  {
    id: piMonoSessionReaderSessionManagerNativeExactAtomID,
    port: "session.reader",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoSessionManagerNativeExactEvidenceRef, piMonoSessionManagerNativeExactReplayRef],
    fixtureIDs: [piMonoSessionManagerNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation with native parity complete SessionManager get/list/context reader fixture coverage.",
  },
  {
    id: piMonoSessionWriterSessionManagerNativeExactAtomID,
    port: "session.writer",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoSessionManagerNativeExactEvidenceRef, piMonoSessionManagerNativeExactReplayRef],
    fixtureIDs: [piMonoSessionManagerNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation with native parity complete JSONL v3 header and session_info writer fixture coverage.",
  },
  {
    id: piMonoSessionMessageStoreSessionManagerNativeExactAtomID,
    port: "session.message-store",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoSessionManagerNativeExactEvidenceRef, piMonoSessionManagerNativeExactReplayRef],
    fixtureIDs: [piMonoSessionManagerNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation with native parity complete SessionManager message/custom_message append fixture coverage.",
  },
  {
    id: piMonoSessionBranchingSessionManagerNativeExactAtomID,
    port: "session.branching",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoSessionManagerNativeExactEvidenceRef, piMonoSessionManagerNativeExactReplayRef],
    fixtureIDs: [piMonoSessionManagerNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation with native parity complete SessionManager branch and branch_summary fixture coverage.",
  },
  {
    id: piMonoSessionDiffSessionManagerNativeExactAtomID,
    port: "session.diff",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoSessionManagerNativeExactEvidenceRef, piMonoSessionManagerNativeExactReplayRef],
    fixtureIDs: [piMonoSessionManagerNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation with native parity complete SessionManager append-only event projection diff fixture coverage.",
  },
] as const

export const piMonoSessionNativeDescriptors = [
  piMonoSessionIDGeneratorNativeDescriptor,
  ...piMonoSessionBranchGraphNativeDescriptors,
  ...piMonoSessionContextSelectorNativeDescriptors,
  piMonoSessionStoreJsonlV3NativeDescriptor,
  piMonoSessionStoreJsonlV3MigratorNativeDescriptor,
  ...piMonoSessionManagerNativeDescriptors,
  piMonoSessionProjectorJsonlNativeDescriptor,
  piMonoSessionProjectorJsonlV3NativeDescriptor,
  piMonoSessionMessagePartProjectorNativeDescriptor,
  piMonoSessionBranchSummaryNativeDescriptor,
] as const

export const piMonoSessionNativeExactAtomIDs = piMonoSessionNativeDescriptors.map((descriptor) => descriptor.id)

export function buildPiMonoSessionIDGeneratorNativeExactFixture(): PiMonoSessionIDGeneratorNativeExactFixture {
  const shortIDGenerator = createPiMonoNativeSessionIDGenerator({
    now: () => 0,
    randomBytes: zeroRandomBytes,
  })
  const collisionGenerator = createPiMonoNativeSessionIDGenerator({
    now: () => 0,
    randomBytes: zeroRandomBytes,
    existingIDs: ["00000000"],
  })
  const seedGenerator = createPiMonoNativeSessionIDGenerator({
    now: () => 0,
    randomBytes: zeroRandomBytes,
  })
  const fixtureWithoutFingerprint: Omit<PiMonoSessionIDGeneratorNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoSessionIDGeneratorNativeExactAtomID,
    portID: "session.id-generator" as const,
    upstreamRef: piMonoSessionUpstreamRef,
    evidenceRef: piMonoSessionIDGeneratorNativeExactEvidenceRef,
    fixtureID: piMonoSessionIDGeneratorNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      entryIDUsesUUIDV7: true as const,
      entryIDPrefersFirstEightUUIDChars: true as const,
      entryIDRetriesShortIDCollisionsOneHundredTimes: true as const,
      entryIDFallsBackToFullUUIDV7AfterCollisions: true as const,
      sessionHeaderIDIsCallerProvided: true as const,
      sessionTimestampsUseISOString: true as const,
      seedOverrideIsHarnessCompatibilityOnly: true as const,
    },
    cases: [
      {
        scenarioID: "short-uuidv7-prefix" as const,
        input: { timestamp: 0, randomBytes: "all-zero" as const, existingIDs: [] },
        output: shortIDGenerator.next({ timestamp: 0 }),
        outputKind: "short-uuidv7-prefix" as const,
        upstreamBehavior: "generateEntryId calls uuidv7().slice(0, 8) and returns the short ID when it is not already present in byId.",
      },
      {
        scenarioID: "full-uuidv7-after-100-short-id-collisions" as const,
        input: { timestamp: 0, randomBytes: "all-zero" as const, existingIDs: ["00000000"] },
        output: collisionGenerator.next({ timestamp: 0, existingIDs: ["00000000"] }),
        outputKind: "full-uuidv7" as const,
        upstreamBehavior: "generateEntryId retries 100 short uuidv7 prefixes and then returns a full uuidv7 when every short candidate collides.",
      },
      {
        scenarioID: "explicit-seed-compatibility" as const,
        input: { timestamp: 0, randomBytes: "all-zero" as const, existingIDs: [], seed: "seeded-session" },
        output: seedGenerator.next({ seed: "seeded-session", timestamp: 0 }),
        outputKind: "explicit-seed" as const,
        upstreamBehavior: "Helix keeps the public seed override outside the upstream native path; Pi JsonlSessionStorage.create receives the session header ID from its caller.",
      },
    ],
    sourceRefs: [
      "packages/agent/src/harness/session/jsonl-storage.ts#generateEntryId",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.create",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.createEntryId",
      "packages/agent/src/harness/session/uuid.ts#fillRandomBytes,uuidv7,formatUuid",
      "packages/coding-agent/docs/session-format.md#Version 3",
    ],
    nativeEvidenceRefs: [...piMonoSessionIDGeneratorNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoSessionIDGeneratorNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoJsonlSessionHeader(input: {
  id: string
  timestamp: string
  cwd: string
  parentSession?: string
}): PiMonoJsonlSessionHeader {
  const header: PiMonoJsonlSessionHeader = {
    type: "session",
    version: 3,
    id: input.id,
    timestamp: input.timestamp,
    cwd: input.cwd,
  }
  if (input.parentSession !== undefined) header.parentSession = input.parentSession
  return header
}

export function parsePiMonoJsonlSessionHeaderLine(line: string, filePath: string): PiMonoJsonlSessionHeader {
  let parsed: unknown
  try {
    parsed = JSON.parse(line)
  } catch (error) {
    throw invalidPiMonoSession(filePath, "first line is not a valid session header", toError(error))
  }
  if (!isRecord(parsed)) throw invalidPiMonoSession(filePath, "first line is not a valid session header")
  if (parsed.type !== "session") throw invalidPiMonoSession(filePath, "first line is not a valid session header")
  if (parsed.version !== 3) throw invalidPiMonoSession(filePath, "unsupported session version")
  if (typeof parsed.id !== "string" || !parsed.id) throw invalidPiMonoSession(filePath, "session header is missing id")
  if (typeof parsed.timestamp !== "string" || !parsed.timestamp) {
    throw invalidPiMonoSession(filePath, "session header is missing timestamp")
  }
  if (typeof parsed.cwd !== "string" || !parsed.cwd) throw invalidPiMonoSession(filePath, "session header is missing cwd")
  if (parsed.parentSession !== undefined && typeof parsed.parentSession !== "string") {
    throw invalidPiMonoSession(filePath, "session header parentSession must be a string")
  }
  const header: PiMonoJsonlSessionHeader = {
    type: "session",
    version: 3,
    id: parsed.id,
    timestamp: parsed.timestamp,
    cwd: parsed.cwd,
  }
  if (parsed.parentSession !== undefined) header.parentSession = parsed.parentSession
  return header
}

export function parsePiMonoJsonlSessionEntryLine(
  line: string,
  filePath: string,
  lineNumber: number,
): PiMonoJsonlSessionEntry {
  let parsed: unknown
  try {
    parsed = JSON.parse(line)
  } catch (error) {
    throw invalidPiMonoSessionEntry(filePath, lineNumber, "is not valid JSON", toError(error))
  }
  if (!isRecord(parsed)) throw invalidPiMonoSessionEntry(filePath, lineNumber, "is not a valid session entry")
  if (typeof parsed.type !== "string") throw invalidPiMonoSessionEntry(filePath, lineNumber, "is missing entry type")
  if (typeof parsed.id !== "string" || !parsed.id) throw invalidPiMonoSessionEntry(filePath, lineNumber, "is missing entry id")
  if (parsed.parentId !== null && typeof parsed.parentId !== "string") {
    throw invalidPiMonoSessionEntry(filePath, lineNumber, "has invalid parentId")
  }
  if (typeof parsed.timestamp !== "string" || !parsed.timestamp) {
    throw invalidPiMonoSessionEntry(filePath, lineNumber, "is missing timestamp")
  }
  if (parsed.type === "leaf" && parsed.targetId !== null && typeof parsed.targetId !== "string") {
    throw invalidPiMonoSessionEntry(filePath, lineNumber, "has invalid targetId")
  }
  return parsed as unknown as PiMonoJsonlSessionEntry
}

export function leafIDAfterPiMonoJsonlSessionEntry(entry: PiMonoJsonlSessionEntry): string | null {
  return entry.type === "leaf" ? (entry as PiMonoJsonlLeafEntry).targetId : entry.id
}

export function createPiMonoJsonlLeafEntry(input: {
  entries: PiMonoJsonlSessionEntry[]
  currentLeafId: string | null
  targetLeafId: string | null
  timestamp: string
  randomBytes?: () => Uint8Array
}): PiMonoJsonlLeafEntry {
  const byId = new Map(input.entries.map((entry) => [entry.id, entry]))
  if (input.targetLeafId !== null && !byId.has(input.targetLeafId)) {
    throw new PiMonoSessionNativeError("not_found", `Entry ${input.targetLeafId} not found`)
  }
  const timestamp = Date.parse(input.timestamp)
  const idGeneratorOptions: PiMonoNativeSessionIDGeneratorOptions = {
    now: () => timestamp,
    existingIDs: byId.keys(),
  }
  if (input.randomBytes) idGeneratorOptions.randomBytes = input.randomBytes
  const idGenerator = createPiMonoNativeSessionIDGenerator(idGeneratorOptions)
  return {
    type: "leaf",
    id: idGenerator.next({ timestamp }),
    parentId: input.currentLeafId,
    timestamp: input.timestamp,
    targetId: input.targetLeafId,
  }
}

export function buildPiMonoJsonlBranchGraphSnapshot(
  entries: PiMonoJsonlSessionEntry[],
): PiMonoJsonlBranchGraphSnapshot {
  const labelsById = new Map<string, string>()
  let currentLeafId: string | null = null
  for (const entry of entries) {
    updatePiMonoLabelCache(labelsById, entry)
    currentLeafId = leafIDAfterPiMonoJsonlSessionEntry(entry)
  }
  return {
    entries: structuredClone(entries),
    currentLeafId,
    labelsById: Object.fromEntries(labelsById),
  }
}

export function appendPiMonoJsonlBranchGraphEntry(
  snapshot: PiMonoJsonlBranchGraphSnapshot,
  entry: PiMonoJsonlSessionEntry,
): PiMonoJsonlBranchGraphSnapshot {
  return buildPiMonoJsonlBranchGraphSnapshot([...snapshot.entries, entry])
}

export function getPiMonoJsonlPathToRoot(
  entries: PiMonoJsonlSessionEntry[],
  leafId: string | null,
): PiMonoJsonlSessionEntry[] {
  if (leafId === null) return []
  const byId = new Map(entries.map((entry) => [entry.id, entry]))
  const path: PiMonoJsonlSessionEntry[] = []
  let current = byId.get(leafId)
  if (!current) throw new PiMonoSessionNativeError("not_found", `Entry ${leafId} not found`)
  while (current) {
    path.unshift(current)
    if (!current.parentId) break
    const parent = byId.get(current.parentId)
    if (!parent) throw new PiMonoSessionNativeError("invalid_session", `Entry ${current.parentId} not found`)
    current = parent
  }
  return structuredClone(path)
}

export function getPiMonoSessionManagerBranch(
  entries: PiMonoJsonlSessionEntry[],
  input: { currentLeafId: string | null; fromId?: string } = { currentLeafId: null },
): PiMonoJsonlSessionEntry[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]))
  const path: PiMonoJsonlSessionEntry[] = []
  const startId = input.fromId ?? input.currentLeafId
  let current = startId ? byId.get(startId) : undefined
  while (current) {
    path.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return structuredClone(path)
}

export function buildPiMonoSessionContextSnapshot(
  entries: PiMonoJsonlSessionEntry[],
  leafId?: string | null,
): PiMonoSessionContextSnapshot {
  const emptyContext: PiMonoSessionContextSnapshot = {
    pathIDs: [],
    messages: [],
    thinkingLevel: "off",
    model: null,
  }
  const byId = new Map(entries.map((entry) => [entry.id, entry]))
  if (leafId === null) return emptyContext
  let leaf = leafId ? byId.get(leafId) : undefined
  if (!leaf) leaf = entries.at(-1)
  if (!leaf) return emptyContext

  const path: PiMonoJsonlSessionEntry[] = []
  let current: PiMonoJsonlSessionEntry | undefined = leaf
  while (current) {
    path.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }

  let thinkingLevel = "off"
  let model: { provider: string; modelId: string } | null = null
  let compaction: PiMonoJsonlGenericEntry | null = null
  for (const entry of path) {
    const message = piMonoSessionEntryMessage(entry)
    if (entry.type === "thinking_level_change" && typeof entry.thinkingLevel === "string") {
      thinkingLevel = entry.thinkingLevel
    } else if (
      entry.type === "model_change" &&
      typeof entry.provider === "string" &&
      typeof entry.modelId === "string"
    ) {
      model = { provider: entry.provider, modelId: entry.modelId }
    } else if (isRecord(message) && message.role === "assistant") {
      const provider = stringValue(message.provider)
      const modelId = stringValue(message.model)
      if (provider && modelId) model = { provider, modelId }
    } else if (entry.type === "compaction") {
      compaction = entry as PiMonoJsonlGenericEntry
    }
  }

  const messages = buildPiMonoSessionProjectedMessages(path, compaction)
  return {
    pathIDs: path.map((entry) => entry.id),
    messages,
    thinkingLevel,
    model,
  }
}

export function encodePiMonoSessionCwd(cwd: string): string {
  return `--${cwd.replace(/^[/\\]/, "").replace(/[/\\:]/g, "-")}--`
}

export function buildPiMonoJsonlSessionFileName(timestamp: string, sessionID: string): string {
  return `${timestamp.replace(/[:.]/g, "-")}_${sessionID}.jsonl`
}

export function serializePiMonoJsonlStorage(
  header: PiMonoJsonlSessionHeader,
  entries: PiMonoJsonlSessionEntry[] = [],
): string {
  return `${[JSON.stringify(header), ...entries.map((entry) => JSON.stringify(entry))].join("\n")}\n`
}

export function createPiMonoJsonlStorageSnapshot(input: {
  filePath: string
  cwd: string
  sessionId: string
  timestamp: string
  parentSessionPath?: string
}): PiMonoJsonlStorageSnapshot {
  const headerInput: Parameters<typeof buildPiMonoJsonlSessionHeader>[0] = {
    id: input.sessionId,
    timestamp: input.timestamp,
    cwd: input.cwd,
  }
  if (input.parentSessionPath !== undefined) headerInput.parentSession = input.parentSessionPath
  const header = buildPiMonoJsonlSessionHeader(headerInput)
  return piMonoJsonlStorageSnapshotFromParts({
    filePath: input.filePath,
    header,
    entries: [],
    content: serializePiMonoJsonlStorage(header),
  })
}

export function loadPiMonoJsonlStorageSnapshot(content: string, filePath: string): PiMonoJsonlStorageSnapshot {
  const lines = content.split("\n").filter((line) => line.trim())
  if (lines.length === 0) throw invalidPiMonoSession(filePath, "missing session header")
  const header = parsePiMonoJsonlSessionHeaderLine(lines[0]!, filePath)
  const entries: PiMonoJsonlSessionEntry[] = []
  for (let index = 1; index < lines.length; index += 1) {
    entries.push(parsePiMonoJsonlSessionEntryLine(lines[index]!, filePath, index + 1))
  }
  return piMonoJsonlStorageSnapshotFromParts({ filePath, header, entries, content })
}

export function parsePiMonoMigratableSessionEntries(content: string): PiMonoMigratableSessionFileEntry[] {
  const entries: PiMonoMigratableSessionFileEntry[] = []
  const lines = content.trim().split("\n")
  for (const line of lines) {
    if (!line.trim()) continue
    try {
      entries.push(JSON.parse(line) as PiMonoMigratableSessionFileEntry)
    } catch {
      // Pi upstream skips malformed JSONL lines in legacy SessionManager.parseSessionEntries/loadEntriesFromFile.
    }
  }
  return entries
}

export function loadPiMonoMigratableSessionEntries(content: string): PiMonoMigratableSessionFileEntry[] {
  const entries = parsePiMonoMigratableSessionEntries(content)
  if (entries.length === 0) return entries
  const header = entries[0]
  if (header?.type !== "session" || typeof (header as PiMonoMigratableSessionHeader).id !== "string") return []
  return entries
}

export function migratePiMonoSessionEntriesToJsonlV3(
  entries: PiMonoMigratableSessionFileEntry[],
  input: { randomUUID?: () => string } = {},
): PiMonoSessionMigrationSnapshot {
  const header = entries.find((entry): entry is PiMonoMigratableSessionHeader => entry.type === "session")
  const startingVersion = header?.version ?? 1
  if (startingVersion >= 3) {
    return {
      startingVersion,
      finalVersion: startingVersion,
      migrated: false,
      entries: structuredClone(entries),
    }
  }
  if (startingVersion < 2) migratePiMonoSessionV1EntriesToV2(entries, input.randomUUID)
  if (startingVersion < 3) migratePiMonoSessionV2EntriesToV3(entries)
  const finalHeader = entries.find((entry): entry is PiMonoMigratableSessionHeader => entry.type === "session")
  return {
    startingVersion,
    finalVersion: finalHeader?.version ?? startingVersion,
    migrated: true,
    entries: structuredClone(entries),
  }
}

export function appendPiMonoJsonlStorageEntry(
  snapshot: PiMonoJsonlStorageSnapshot,
  entry: PiMonoJsonlSessionEntry,
): PiMonoJsonlStorageSnapshot {
  const header = piMonoJsonlSessionHeaderFromMetadata(snapshot.metadata)
  return piMonoJsonlStorageSnapshotFromParts({
    filePath: snapshot.metadata.path,
    header,
    entries: [...snapshot.entries, structuredClone(entry)],
    content: `${snapshot.content}${JSON.stringify(entry)}\n`,
  })
}

export function setPiMonoJsonlStorageLeafID(
  snapshot: PiMonoJsonlStorageSnapshot,
  input: {
    leafId: string | null
    timestamp: string
    randomBytes?: () => Uint8Array
  },
): PiMonoJsonlStorageSnapshot {
  const leafEntryInput: Parameters<typeof createPiMonoJsonlLeafEntry>[0] = {
    entries: snapshot.entries,
    currentLeafId: snapshot.currentLeafId,
    targetLeafId: input.leafId,
    timestamp: input.timestamp,
  }
  if (input.randomBytes) leafEntryInput.randomBytes = input.randomBytes
  const leafEntry = createPiMonoJsonlLeafEntry(leafEntryInput)
  return appendPiMonoJsonlStorageEntry(snapshot, leafEntry)
}

export function movePiMonoJsonlBranchWithSummary(input: {
  entries: PiMonoJsonlSessionEntry[]
  currentLeafId: string | null
  targetLeafId: string | null
  leafEntryId?: string
  summaryEntryId?: string
  leafTimestamp: string
  summaryTimestamp?: string
  summary?: {
    summary: string
    details?: unknown
    fromHook?: boolean
  }
  randomBytes?: () => Uint8Array
}): PiMonoSessionBranchSummaryMoveSnapshot {
  const byId = new Map(input.entries.map((entry) => [entry.id, entry]))
  if (input.targetLeafId !== null && !byId.has(input.targetLeafId)) {
    throw new PiMonoSessionNativeError("not_found", `Entry ${input.targetLeafId} not found`)
  }
  const existingIDs = new Set(byId.keys())
  const leafTimestampNumber = Date.parse(input.leafTimestamp)
  const leafEntry: PiMonoJsonlLeafEntry = {
    type: "leaf",
    id: input.leafEntryId ?? nextPiMonoNativeJsonlEntryID(existingIDs, leafTimestampNumber, input.randomBytes),
    parentId: input.currentLeafId,
    timestamp: input.leafTimestamp,
    targetId: input.targetLeafId,
  }
  existingIDs.add(leafEntry.id)
  const entriesAfterLeaf = [...input.entries.map((entry) => structuredClone(entry)), leafEntry]

  if (!input.summary) {
    const context = buildPiMonoSessionContextSnapshot(entriesAfterLeaf, input.targetLeafId)
    return {
      entries: entriesAfterLeaf,
      previousLeafId: input.currentLeafId,
      targetLeafId: input.targetLeafId,
      currentLeafId: input.targetLeafId,
      leafEntry,
      pathIDs: context.pathIDs,
      context,
    }
  }

  const summaryTimestamp = input.summaryTimestamp ?? input.leafTimestamp
  const summaryTimestampNumber = Date.parse(summaryTimestamp)
  const summaryEntry: PiMonoJsonlGenericEntry = {
    type: "branch_summary",
    id: input.summaryEntryId ?? nextPiMonoNativeJsonlEntryID(existingIDs, summaryTimestampNumber, input.randomBytes),
    parentId: input.targetLeafId,
    timestamp: summaryTimestamp,
    fromId: input.targetLeafId ?? "root",
    summary: input.summary.summary,
  }
  if (input.summary.details !== undefined) summaryEntry.details = structuredClone(input.summary.details)
  if (input.summary.fromHook !== undefined) summaryEntry.fromHook = input.summary.fromHook
  const entriesAfterSummary = [...entriesAfterLeaf, summaryEntry]
  const context = buildPiMonoSessionContextSnapshot(entriesAfterSummary, summaryEntry.id)
  return {
    entries: entriesAfterSummary,
    previousLeafId: input.currentLeafId,
    targetLeafId: input.targetLeafId,
    currentLeafId: summaryEntry.id,
    leafEntry,
    summaryEntry,
    pathIDs: context.pathIDs,
    context,
  }
}

export function getPiMonoJsonlStorageLeafID(snapshot: PiMonoJsonlStorageSnapshot): string | null {
  if (snapshot.currentLeafId !== null && !snapshot.entries.some((entry) => entry.id === snapshot.currentLeafId)) {
    throw new PiMonoSessionNativeError("invalid_session", `Entry ${snapshot.currentLeafId} not found`)
  }
  return snapshot.currentLeafId
}

export function getPiMonoJsonlStorageEntry(
  snapshot: PiMonoJsonlStorageSnapshot,
  id: string,
): PiMonoJsonlSessionEntry | undefined {
  const entry = snapshot.entries.find((candidate) => candidate.id === id)
  return entry ? structuredClone(entry) : undefined
}

export function findPiMonoJsonlStorageEntries(
  snapshot: PiMonoJsonlStorageSnapshot,
  type: string,
): PiMonoJsonlSessionEntry[] {
  return snapshot.entries.filter((entry) => entry.type === type).map((entry) => structuredClone(entry))
}

export function getPiMonoJsonlStorageEntries(snapshot: PiMonoJsonlStorageSnapshot): PiMonoJsonlSessionEntry[] {
  return snapshot.entries.map((entry) => structuredClone(entry))
}

export function buildPiMonoSessionBranchGraphNativeExactFixture(): PiMonoSessionBranchGraphNativeExactFixture {
  const rootEntry: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "root",
    parentId: null,
    timestamp: "2026-06-01T00:00:00.000Z",
    message: { role: "user", content: [{ type: "text", text: "hello" }] },
  }
  const branchEntry: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "branch",
    parentId: "root",
    timestamp: "2026-06-01T00:00:01.000Z",
    message: { role: "assistant", content: [{ type: "text", text: "hi" }] },
  }
  const appendSnapshot = buildPiMonoJsonlBranchGraphSnapshot([rootEntry, branchEntry])
  const leafEntry = createPiMonoJsonlLeafEntry({
    entries: appendSnapshot.entries,
    currentLeafId: appendSnapshot.currentLeafId,
    targetLeafId: "root",
    timestamp: "1970-01-01T00:00:00.000Z",
    randomBytes: zeroRandomBytes,
  })
  const switchedSnapshot = appendPiMonoJsonlBranchGraphEntry(appendSnapshot, leafEntry)
  const labelSnapshot = buildPiMonoJsonlBranchGraphSnapshot([
    rootEntry,
    { type: "label", id: "label-add", parentId: "root", timestamp: "2026-06-01T00:00:02.000Z", targetId: "root", label: "  Root  " },
    { type: "label", id: "label-delete", parentId: "label-add", timestamp: "2026-06-01T00:00:03.000Z", targetId: "root", label: "   " },
  ])
  const parsedHeader = parsePiMonoJsonlSessionHeaderLine(
    JSON.stringify(buildPiMonoJsonlSessionHeader({
      id: "session-a",
      timestamp: "2026-06-01T00:00:00.000Z",
      cwd: "/workspace/app",
      parentSession: "/workspace/parent.jsonl",
    })),
    "/sessions/session-a.jsonl",
  )
  const parsedEntry = parsePiMonoJsonlSessionEntryLine(
    JSON.stringify({ type: "leaf", id: "leaf-a", parentId: "branch", timestamp: "2026-06-01T00:00:04.000Z", targetId: "root" }),
    "/sessions/session-a.jsonl",
    3,
  )
  const fixtureWithoutFingerprint: Omit<PiMonoSessionBranchGraphNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: [...piMonoSessionBranchGraphNativeExactAtomIDs] as typeof piMonoSessionBranchGraphNativeExactAtomIDs,
    portID: "session.branch-graph" as const,
    upstreamRef: piMonoSessionUpstreamRef,
    evidenceRef: piMonoSessionBranchGraphNativeExactEvidenceRef,
    fixtureID: piMonoSessionBranchGraphNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      appendEntryUpdatesCurrentLeafToEntryID: true as const,
      leafEntryUpdatesCurrentLeafToTargetID: true as const,
      leafEntryParentIsPreviousCurrentLeaf: true as const,
      getPathToRootFollowsParentID: true as const,
      missingPathParentInvalidatesSession: true as const,
      labelCacheTrimsBlankLabelsAndDeletes: true as const,
      jsonlV3RequiresStringTimestamps: true as const,
      cwdDirectoryEncodingMatchesRepo: true as const,
    },
    cases: [
      {
        scenarioID: "append-entry-sets-active-leaf" as const,
        input: { entries: [rootEntry, branchEntry] },
        output: {
          currentLeafId: appendSnapshot.currentLeafId,
          pathToRoot: getPiMonoJsonlPathToRoot(appendSnapshot.entries, appendSnapshot.currentLeafId).map((entry) => entry.id),
        },
        upstreamBehavior: "JsonlSessionStorage.appendEntry appends the raw entry, caches it by id, updates labels, and sets currentLeafId to leafIdAfterEntry(entry).",
      },
      {
        scenarioID: "leaf-entry-switches-active-leaf" as const,
        input: { currentLeafId: "branch", targetLeafId: "root", timestamp: "1970-01-01T00:00:00.000Z" },
        output: {
          leafEntry,
          currentLeafId: switchedSnapshot.currentLeafId,
          pathToRoot: getPiMonoJsonlPathToRoot(switchedSnapshot.entries, switchedSnapshot.currentLeafId).map((entry) => entry.id),
        },
        upstreamBehavior: "JsonlSessionStorage.setLeafId validates the target, appends a leaf entry whose parentId is the previous currentLeafId, and sets currentLeafId to targetId.",
      },
      {
        scenarioID: "label-cache-trims-and-deletes" as const,
        input: { targetId: "root", labels: ["  Root  ", "   "] },
        output: { labelsById: labelSnapshot.labelsById },
        upstreamBehavior: "updateLabelCache trims labels, stores non-empty labels by targetId, and deletes a target label when the trimmed value is empty.",
      },
      {
        scenarioID: "strict-jsonl-v3-parsing" as const,
        input: { headerLine: "session header", entryLine: "leaf entry" },
        output: { header: parsedHeader, entry: parsedEntry },
        upstreamBehavior: "parseHeaderLine and parseEntryLine require JSONL v3 headers, non-empty string ids/timestamps, string cwd, parentId string/null, and leaf targetId string/null.",
      },
      {
        scenarioID: "repo-cwd-path-encoding" as const,
        input: { cwd: "/repo:app/src", timestamp: "2026-06-01T00:00:00.000Z", sessionID: "session-a" },
        output: {
          encodedCwd: encodePiMonoSessionCwd("/repo:app/src"),
          fileName: buildPiMonoJsonlSessionFileName("2026-06-01T00:00:00.000Z", "session-a"),
        },
        upstreamBehavior: "JsonlSessionRepo stores sessions under an encoded cwd directory and names files by timestamp.replace(/[:.]/g, '-') plus the session id.",
      },
    ],
    sourceRefs: [
      "packages/agent/src/harness/session/jsonl-storage.ts#leafIdAfterEntry",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.appendEntry",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.setLeafId",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.getPathToRoot",
      "packages/agent/src/harness/session/jsonl-storage.ts#parseHeaderLine,parseEntryLine",
      "packages/agent/src/harness/session/jsonl-repo.ts#encodeCwd,createSessionFilePath",
    ],
    nativeEvidenceRefs: [...piMonoSessionBranchGraphNativeDescriptors[0].nativeEvidenceRefs],
    fixtureIDs: [...piMonoSessionBranchGraphNativeDescriptors[0].fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoSessionContextSelectorNativeExactFixture(): PiMonoSessionContextSelectorNativeExactFixture {
  const rootEntry: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "root",
    parentId: null,
    timestamp: "2026-06-01T00:00:00.000Z",
    message: { role: "user", content: [{ type: "text", text: "hello" }] },
  }
  const thinkingEntry: PiMonoJsonlGenericEntry = {
    type: "thinking_level_change",
    id: "thinking-high",
    parentId: "root",
    timestamp: "2026-06-01T00:00:01.000Z",
    thinkingLevel: "high",
  }
  const assistantEntry: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "assistant",
    parentId: "thinking-high",
    timestamp: "2026-06-01T00:00:02.000Z",
    message: {
      role: "assistant",
      provider: "anthropic",
      model: "claude-3-7-sonnet-20250219",
      content: [{ type: "text", text: "hi" }],
    },
  }
  const siblingEntry: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "sibling",
    parentId: "root",
    timestamp: "2026-06-01T00:00:03.000Z",
    message: { role: "user", content: [{ type: "text", text: "side branch" }] },
  }
  const entries = [rootEntry, thinkingEntry, assistantEntry, siblingEntry]
  const activeBranch = getPiMonoSessionManagerBranch(entries, { currentLeafId: "assistant" })
  const explicitContext = buildPiMonoSessionContextSnapshot(entries, "assistant")
  const nullContext = buildPiMonoSessionContextSnapshot(entries, null)
  const fallbackContext = buildPiMonoSessionContextSnapshot(entries)
  const fixtureWithoutFingerprint: Omit<PiMonoSessionContextSelectorNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: [...piMonoSessionContextSelectorNativeExactAtomIDs] as typeof piMonoSessionContextSelectorNativeExactAtomIDs,
    portIDs: ["session.pagination", "session.context-selector"] as const,
    upstreamRef: piMonoSessionUpstreamRef,
    evidenceRef: piMonoSessionContextSelectorNativeExactEvidenceRef,
    fixtureID: piMonoSessionContextSelectorNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      getBranchUsesCurrentLeafWhenFromIdMissing: true as const,
      getBranchWalksParentIdsToRoot: true as const,
      buildSessionContextUsesRequestedLeafPath: true as const,
      buildSessionContextNullLeafReturnsEmptyMessages: true as const,
      buildSessionContextUndefinedLeafFallsBackToLastEntry: true as const,
      thinkingAndModelChangesAreResolvedAlongActivePath: true as const,
    },
    cases: [
      {
        scenarioID: "get-branch-follows-active-leaf" as const,
        input: { currentLeafId: "assistant" },
        output: { pathIDs: activeBranch.map((entry) => entry.id) },
        upstreamBehavior: "SessionManager.getBranch starts at the provided id or current leaf and walks parentId links to root in path order.",
      },
      {
        scenarioID: "context-selector-follows-active-leaf" as const,
        input: { leafId: "assistant" },
        output: explicitContext as unknown as Record<string, unknown>,
        upstreamBehavior: "buildSessionContext follows the requested leaf path, emits message entries on that path, and resolves thinking/model changes along the active branch.",
      },
      {
        scenarioID: "null-leaf-selects-empty-context" as const,
        input: { leafId: null },
        output: nullContext as unknown as Record<string, unknown>,
        upstreamBehavior: "buildSessionContext treats an explicit null leaf as navigation before the first entry and returns an empty context.",
      },
      {
        scenarioID: "undefined-leaf-falls-back-to-last-entry" as const,
        input: { leafId: undefined },
        output: fallbackContext as unknown as Record<string, unknown>,
        upstreamBehavior: "buildSessionContext falls back to the last entry when no leaf id is supplied.",
      },
    ],
    sourceRefs: [
      "packages/coding-agent/src/core/session-manager.ts#SessionManager.getBranch",
      "packages/coding-agent/src/core/session-manager.ts#buildSessionContext",
      "packages/coding-agent/src/core/agent-session-runtime.ts#AgentSessionRuntime.fork",
      "packages/agent/src/harness/session/repo-utils.ts#getEntriesToFork",
    ],
    nativeEvidenceRefs: [...piMonoSessionContextSelectorNativeDescriptors[0].nativeEvidenceRefs],
    fixtureIDs: [...piMonoSessionContextSelectorNativeDescriptors[0].fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoSessionStoreJsonlV3NativeExactFixture(): PiMonoSessionStoreJsonlV3NativeExactFixture {
  const filePath = "/sessions/--workspace-app--/2026-06-01T00-00-00-000Z_session-a.jsonl"
  const created = createPiMonoJsonlStorageSnapshot({
    filePath,
    cwd: "/workspace/app",
    sessionId: "session-a",
    timestamp: "2026-06-01T00:00:00.000Z",
    parentSessionPath: "/sessions/parent.jsonl",
  })
  const rootEntry: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "root",
    parentId: null,
    timestamp: "2026-06-01T00:00:01.000Z",
    message: { role: "user", content: [{ type: "text", text: "hello" }] },
  }
  const assistantEntry: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "assistant",
    parentId: "root",
    timestamp: "2026-06-01T00:00:02.000Z",
    message: { role: "assistant", provider: "anthropic", model: "claude-3-7-sonnet-20250219", content: [{ type: "text", text: "hi" }] },
  }
  const labelEntry: PiMonoJsonlLabelEntry = {
    type: "label",
    id: "label-root",
    parentId: "assistant",
    timestamp: "2026-06-01T00:00:03.000Z",
    targetId: "root",
    label: "  Root branch  ",
  }
  const openedContent = [
    JSON.stringify(buildPiMonoJsonlSessionHeader({
      id: "session-a",
      timestamp: "2026-06-01T00:00:00.000Z",
      cwd: "/workspace/app",
      parentSession: "/sessions/parent.jsonl",
    })),
    "",
    JSON.stringify(rootEntry),
    "  ",
    JSON.stringify(assistantEntry),
    JSON.stringify(labelEntry),
    "",
  ].join("\n")
  const opened = loadPiMonoJsonlStorageSnapshot(openedContent, filePath)
  const appended = appendPiMonoJsonlStorageEntry(created, rootEntry)
  const branchSnapshot = appendPiMonoJsonlStorageEntry(appendPiMonoJsonlStorageEntry(created, rootEntry), assistantEntry)
  const switched = setPiMonoJsonlStorageLeafID(branchSnapshot, {
    leafId: "root",
    timestamp: "1970-01-01T00:00:00.000Z",
    randomBytes: zeroRandomBytes,
  })
  const invalidLeafSnapshot = loadPiMonoJsonlStorageSnapshot(
    serializePiMonoJsonlStorage(
      buildPiMonoJsonlSessionHeader({
        id: "session-b",
        timestamp: "2026-06-01T00:00:00.000Z",
        cwd: "/workspace/app",
      }),
      [{ type: "leaf", id: "leaf-missing", parentId: null, timestamp: "2026-06-01T00:00:04.000Z", targetId: "missing" }],
    ),
    "/sessions/session-b.jsonl",
  )
  let invalidLeafError: Record<string, unknown> = {}
  try {
    getPiMonoJsonlStorageLeafID(invalidLeafSnapshot)
  } catch (error) {
    invalidLeafError = {
      code: error instanceof PiMonoSessionNativeError ? error.code : "unknown",
      message: error instanceof Error ? error.message : String(error),
    }
  }

  const fixtureWithoutFingerprint: Omit<PiMonoSessionStoreJsonlV3NativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoSessionStoreJsonlV3NativeExactAtomID,
    portID: "session.store" as const,
    upstreamRef: piMonoSessionUpstreamRef,
    evidenceRef: piMonoSessionStoreJsonlV3NativeExactEvidenceRef,
    fixtureID: piMonoSessionStoreJsonlV3NativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      createWritesJsonlV3HeaderAndMetadata: true as const,
      openFiltersBlankLinesBeforeParsing: true as const,
      appendEntryPersistsOneJsonLineAndUpdatesLeaf: true as const,
      setLeafIdAppendsLeafPointerWithPreviousParent: true as const,
      getLeafIdValidatesLoadedLeafTarget: true as const,
      getEntriesReturnsAppendOrder: true as const,
    },
    cases: [
      {
        scenarioID: "create-writes-header-metadata" as const,
        input: { filePath, cwd: "/workspace/app", sessionId: "session-a", parentSessionPath: "/sessions/parent.jsonl" },
        output: {
          content: created.content,
          metadata: created.metadata,
          currentLeafId: created.currentLeafId,
          entries: created.entries,
        },
        upstreamBehavior: "JsonlSessionStorage.create writes exactly one JSONL v3 session header line with a trailing newline and exposes metadata from that header plus the file path.",
      },
      {
        scenarioID: "open-loads-jsonl-v3-ignoring-blank-lines" as const,
        input: { content: openedContent },
        output: {
          metadata: opened.metadata,
          entryIDs: opened.entries.map((entry) => entry.id),
          currentLeafId: opened.currentLeafId,
          labelsById: opened.labelsById,
          labelEntries: findPiMonoJsonlStorageEntries(opened, "label").map((entry) => entry.id),
        },
        upstreamBehavior: "loadJsonlStorage splits on newlines, filters blank lines before parsing, builds byId/labelsById caches, and sets leafId to leafIdAfterEntry for the last entry.",
      },
      {
        scenarioID: "append-entry-persists-jsonl-and-current-leaf" as const,
        input: { entry: rootEntry },
        output: {
          content: appended.content,
          currentLeafId: appended.currentLeafId,
          entry: getPiMonoJsonlStorageEntry(appended, "root"),
          entries: getPiMonoJsonlStorageEntries(appended).map((entry) => entry.id),
        },
        upstreamBehavior: "JsonlSessionStorage.appendEntry appends JSON.stringify(entry) plus a newline, updates entries/byId/label cache, and moves currentLeafId to leafIdAfterEntry(entry).",
      },
      {
        scenarioID: "set-leaf-id-appends-pointer-with-previous-parent" as const,
        input: { beforeLeafId: branchSnapshot.currentLeafId, targetLeafId: "root" },
        output: {
          appendedEntry: switched.entries.at(-1),
          currentLeafId: switched.currentLeafId,
          contentTail: switched.content.slice(branchSnapshot.content.length),
          pathToRoot: getPiMonoJsonlPathToRoot(switched.entries, switched.currentLeafId).map((entry) => entry.id),
        },
        upstreamBehavior: "JsonlSessionStorage.setLeafId validates the target id, appends a generated leaf pointer whose parentId is the previous current leaf, and sets currentLeafId to the requested target.",
      },
      {
        scenarioID: "get-leaf-id-validates-loaded-target" as const,
        input: { currentLeafId: invalidLeafSnapshot.currentLeafId },
        output: invalidLeafError,
        upstreamBehavior: "JsonlSessionStorage.getLeafId checks a non-null loaded currentLeafId against byId and throws invalid_session when the target entry is absent.",
      },
    ],
    sourceRefs: [
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.create",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.open",
      "packages/agent/src/harness/session/jsonl-storage.ts#loadJsonlStorage",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.appendEntry",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.setLeafId",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.getLeafId",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.getEntry,findEntries,getEntries,getLabel",
      "packages/agent/src/harness/session/jsonl-repo.ts#JsonlSessionRepo.create,open,list,fork",
    ],
    nativeEvidenceRefs: [...piMonoSessionStoreJsonlV3NativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoSessionStoreJsonlV3NativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoSessionStoreJsonlV3MigratorNativeExactFixture(): PiMonoSessionStoreJsonlV3MigratorNativeExactFixture {
  const v1LinearEntries: PiMonoMigratableSessionFileEntry[] = [
    { type: "session", id: "session-v1", timestamp: "2026-06-01T00:00:00.000Z", cwd: "/workspace/app" },
    { type: "message", timestamp: "2026-06-01T00:00:01.000Z", message: { role: "user", content: "hello" } },
    {
      type: "message",
      timestamp: "2026-06-01T00:00:02.000Z",
      message: {
        role: "assistant",
        provider: "anthropic",
        model: "claude-3-7-sonnet-20250219",
        content: [{ type: "text", text: "hi" }],
      },
    },
  ]
  const v1LinearMigration = migratePiMonoSessionEntriesToJsonlV3(structuredClone(v1LinearEntries), {
    randomUUID: piMonoLegacyRandomUUIDSequence([
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ]),
  })

  const v1CompactionEntries: PiMonoMigratableSessionFileEntry[] = [
    { type: "session", id: "session-compact", timestamp: "2026-06-01T00:01:00.000Z", cwd: "/workspace/app" },
    { type: "message", timestamp: "2026-06-01T00:01:01.000Z", message: { role: "user", content: "older" } },
    {
      type: "compaction",
      timestamp: "2026-06-01T00:01:02.000Z",
      summary: "Earlier details were compacted.",
      firstKeptEntryIndex: 1,
      tokensBefore: 1234,
    },
  ]
  const v1CompactionMigration = migratePiMonoSessionEntriesToJsonlV3(structuredClone(v1CompactionEntries), {
    randomUUID: piMonoLegacyRandomUUIDSequence([
      "33333333-3333-4333-8333-333333333333",
      "44444444-4444-4444-8444-444444444444",
    ]),
  })

  const v2HookEntries: PiMonoMigratableSessionFileEntry[] = [
    { type: "session", version: 2, id: "session-v2", timestamp: "2026-06-01T00:02:00.000Z", cwd: "/workspace/app" },
    {
      type: "message",
      id: "hook-msg",
      parentId: null,
      timestamp: "2026-06-01T00:02:01.000Z",
      message: { role: "hookMessage", customType: "notice", content: "heads up", display: true },
    },
  ]
  const v2HookMigration = migratePiMonoSessionEntriesToJsonlV3(structuredClone(v2HookEntries))

  const v3Entries: PiMonoMigratableSessionFileEntry[] = [
    { type: "session", version: 3, id: "session-v3", timestamp: "2026-06-01T00:03:00.000Z", cwd: "/workspace/app" },
    {
      type: "message",
      id: "already-current",
      parentId: null,
      timestamp: "2026-06-01T00:03:01.000Z",
      message: { role: "hookMessage", content: "left untouched because version is current" },
    },
  ]
  const v3Migration = migratePiMonoSessionEntriesToJsonlV3(structuredClone(v3Entries))

  const parserContent = [
    "",
    JSON.stringify({ type: "session", version: 2, id: "parsed-session", timestamp: "2026-06-01T00:04:00.000Z", cwd: "/workspace/app" }),
    "{not json",
    "  ",
    JSON.stringify({ type: "message", id: "parsed-message", parentId: null, timestamp: "2026-06-01T00:04:01.000Z", message: { role: "user", content: "parsed" } }),
    "",
  ].join("\n")
  const parsedEntries = parsePiMonoMigratableSessionEntries(parserContent)
  const invalidHeaderEntries = loadPiMonoMigratableSessionEntries([
    JSON.stringify({ type: "message", id: "not-header", parentId: null, timestamp: "2026-06-01T00:04:02.000Z" }),
    JSON.stringify({ type: "session", id: "too-late", timestamp: "2026-06-01T00:04:03.000Z", cwd: "/workspace/app" }),
  ].join("\n"))

  const fixtureWithoutFingerprint: Omit<PiMonoSessionStoreJsonlV3MigratorNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoSessionStoreJsonlV3MigratorNativeExactAtomID,
    portID: "session.store" as const,
    upstreamRef: piMonoSessionUpstreamRef,
    evidenceRef: piMonoSessionStoreJsonlV3MigratorNativeExactEvidenceRef,
    fixtureID: piMonoSessionStoreJsonlV3MigratorNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      missingVersionIsTreatedAsV1: true as const,
      v1MigrationAddsShortRandomUUIDIdsAndParentLinks: true as const,
      v1MigrationConvertsCompactionFirstKeptEntryIndex: true as const,
      v2MigrationRenamesHookMessageRoleToCustom: true as const,
      currentVersionSkipsMutation: true as const,
      parserSkipsBlankAndMalformedLines: true as const,
      loaderRequiresSessionHeaderTypeAndStringID: true as const,
    },
    cases: [
      {
        scenarioID: "v1-linear-entries-gain-tree-links" as const,
        input: { entries: v1LinearEntries, randomUUIDPrefixes: ["11111111", "22222222"] },
        output: {
          startingVersion: v1LinearMigration.startingVersion,
          finalVersion: v1LinearMigration.finalVersion,
          migrated: v1LinearMigration.migrated,
          entries: v1LinearMigration.entries,
        },
        upstreamBehavior: "migrateToCurrentVersion treats a missing session header version as v1, runs v1->v2 and v2->v3, assigns randomUUID().slice(0, 8) ids to entries, and links each parentId to the previous generated id.",
      },
      {
        scenarioID: "v1-compaction-index-becomes-first-kept-entry-id" as const,
        input: { entries: v1CompactionEntries, firstKeptEntryIndex: 1 },
        output: {
          entries: v1CompactionMigration.entries,
          compaction: v1CompactionMigration.entries.find((entry) => entry.type === "compaction"),
        },
        upstreamBehavior: "migrateV1ToV2 converts compaction.firstKeptEntryIndex to firstKeptEntryId when the indexed target entry exists and is not the session header, then deletes firstKeptEntryIndex.",
      },
      {
        scenarioID: "v2-hook-message-role-renamed-to-custom" as const,
        input: { entries: v2HookEntries },
        output: {
          startingVersion: v2HookMigration.startingVersion,
          finalVersion: v2HookMigration.finalVersion,
          message: (v2HookMigration.entries[1] as PiMonoMigratableSessionEntry).message,
        },
        upstreamBehavior: "migrateV2ToV3 updates the session header to version 3 and renames message.role from hookMessage to custom in place.",
      },
      {
        scenarioID: "v3-current-version-is-left-unchanged" as const,
        input: { entries: v3Entries },
        output: {
          migrated: v3Migration.migrated,
          entries: v3Migration.entries,
        },
        upstreamBehavior: "migrateToCurrentVersion returns without mutation when the header version is already current or newer.",
      },
      {
        scenarioID: "parser-skips-malformed-and-blank-lines" as const,
        input: { content: parserContent },
        output: {
          parsedTypes: parsedEntries.map((entry) => entry.type),
          parsedIDs: parsedEntries.map((entry) => (entry as PiMonoMigratableSessionEntry).id),
          invalidHeaderEntries,
        },
        upstreamBehavior: "parseSessionEntries trims the file, skips blank lines, ignores malformed JSON lines, and loadEntriesFromFile rejects files whose first parsed entry is not a session header with a string id.",
      },
    ],
    sourceRefs: [
      "packages/coding-agent/src/core/session-manager.ts#CURRENT_SESSION_VERSION",
      "packages/coding-agent/src/core/session-manager.ts#migrateV1ToV2",
      "packages/coding-agent/src/core/session-manager.ts#migrateV2ToV3",
      "packages/coding-agent/src/core/session-manager.ts#migrateToCurrentVersion",
      "packages/coding-agent/src/core/session-manager.ts#migrateSessionEntries",
      "packages/coding-agent/src/core/session-manager.ts#parseSessionEntries",
      "packages/coding-agent/src/core/session-manager.ts#loadEntriesFromFile",
      "packages/coding-agent/test/session-manager/migration.test.ts",
    ],
    nativeEvidenceRefs: [...piMonoSessionStoreJsonlV3MigratorNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoSessionStoreJsonlV3MigratorNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoSessionProjectorJsonlV3NativeExactFixture(): PiMonoSessionProjectorJsonlV3NativeExactFixture {
  const rootMessage: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "root",
    parentId: null,
    timestamp: "2026-06-01T00:00:00.000Z",
    message: { role: "user", content: [{ type: "text", text: "hello" }] },
  }
  const customMessage: PiMonoJsonlGenericEntry = {
    type: "custom_message",
    id: "custom-message",
    parentId: "root",
    timestamp: "2026-06-01T00:00:01.000Z",
    customType: "notice",
    content: "heads up",
    display: true,
    details: { source: "fixture" },
  }
  const branchSummary: PiMonoJsonlGenericEntry = {
    type: "branch_summary",
    id: "branch-summary",
    parentId: "custom-message",
    timestamp: "2026-06-01T00:00:02.000Z",
    fromId: "root",
    summary: "Explored an alternate branch.",
  }
  const labelEntry: PiMonoJsonlLabelEntry = {
    type: "label",
    id: "label-root",
    parentId: "branch-summary",
    timestamp: "2026-06-01T00:00:03.000Z",
    targetId: "root",
    label: "Root",
  }
  const sessionInfo: PiMonoJsonlGenericEntry = {
    type: "session_info",
    id: "session-info",
    parentId: "label-root",
    timestamp: "2026-06-01T00:00:04.000Z",
    name: "Projector fixture",
  }
  const customEntry: PiMonoJsonlGenericEntry = {
    type: "custom",
    id: "custom-entry",
    parentId: "session-info",
    timestamp: "2026-06-01T00:00:05.000Z",
    customType: "metadata",
    data: { ignored: true },
  }
  const plainContext = buildPiMonoSessionContextSnapshot([
    rootMessage,
    customMessage,
    branchSummary,
    labelEntry,
    sessionInfo,
    customEntry,
  ], "custom-entry")

  const compactRoot: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "compact-root",
    parentId: null,
    timestamp: "2026-06-01T00:01:00.000Z",
    message: { role: "user", content: [{ type: "text", text: "older" }] },
  }
  const keptAssistant: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "kept-assistant",
    parentId: "compact-root",
    timestamp: "2026-06-01T00:01:01.000Z",
    message: { role: "assistant", provider: "anthropic", model: "claude-3-7-sonnet-20250219", content: [{ type: "text", text: "kept" }] },
  }
  const keptUser: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "kept-user",
    parentId: "kept-assistant",
    timestamp: "2026-06-01T00:01:02.000Z",
    message: { role: "user", content: [{ type: "text", text: "tail" }] },
  }
  const compaction: PiMonoJsonlGenericEntry = {
    type: "compaction",
    id: "compact",
    parentId: "kept-user",
    timestamp: "2026-06-01T00:01:03.000Z",
    summary: "Earlier details were compacted.",
    firstKeptEntryId: "kept-assistant",
    tokensBefore: 1234,
  }
  const afterCompaction: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "after-compact",
    parentId: "compact",
    timestamp: "2026-06-01T00:01:04.000Z",
    message: { role: "user", content: [{ type: "text", text: "after" }] },
  }
  const compactionContext = buildPiMonoSessionContextSnapshot([
    compactRoot,
    keptAssistant,
    keptUser,
    compaction,
    afterCompaction,
  ], "after-compact")

  const thinking: PiMonoJsonlGenericEntry = {
    type: "thinking_level_change",
    id: "thinking-high",
    parentId: null,
    timestamp: "2026-06-01T00:02:00.000Z",
    thinkingLevel: "high",
  }
  const assistantMessage: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "assistant-model",
    parentId: "thinking-high",
    timestamp: "2026-06-01T00:02:01.000Z",
    message: {
      role: "assistant",
      provider: "anthropic",
      model: "claude-3-7-sonnet-20250219",
      content: [{ type: "text", text: "model from assistant" }],
    },
  }
  const modelChange: PiMonoJsonlGenericEntry = {
    type: "model_change",
    id: "model-google",
    parentId: "assistant-model",
    timestamp: "2026-06-01T00:02:02.000Z",
    provider: "google",
    modelId: "gemini-2.5-pro",
  }
  const modelContext = buildPiMonoSessionContextSnapshot([thinking, assistantMessage, modelChange], "model-google")

  const ignoredThinking: PiMonoJsonlGenericEntry = {
    type: "thinking_level_change",
    id: "ignored-thinking",
    parentId: null,
    timestamp: "2026-06-01T00:03:00.000Z",
    thinkingLevel: "medium",
  }
  const ignoredModel: PiMonoJsonlGenericEntry = {
    type: "model_change",
    id: "ignored-model",
    parentId: "ignored-thinking",
    timestamp: "2026-06-01T00:03:01.000Z",
    provider: "openai",
    modelId: "gpt-4.1",
  }
  const ignoredLabel: PiMonoJsonlLabelEntry = {
    type: "label",
    id: "ignored-label",
    parentId: "ignored-model",
    timestamp: "2026-06-01T00:03:02.000Z",
    targetId: "ignored-model",
    label: "Ignored",
  }
  const ignoredContext = buildPiMonoSessionContextSnapshot([ignoredThinking, ignoredModel, ignoredLabel], "ignored-label")

  const fixtureWithoutFingerprint: Omit<PiMonoSessionProjectorJsonlV3NativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoSessionProjectorJsonlV3NativeExactAtomID,
    portID: "session.projector" as const,
    upstreamRef: piMonoSessionUpstreamRef,
    evidenceRef: piMonoSessionProjectorJsonlV3NativeExactEvidenceRef,
    fixtureID: piMonoSessionProjectorJsonlV3NativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      buildSessionContextEmitsNativeMessages: true as const,
      customMessagesUseNativeFactoryShape: true as const,
      branchSummaryMessagesUseNativeFactoryShape: true as const,
      compactionSummaryPrecedesRetainedTail: true as const,
      thinkingAndModelResolvedBeforeMessageProjection: true as const,
      nonMessageEntriesAreNotEmitted: true as const,
    },
    cases: [
      {
        scenarioID: "message-custom-branch-summary-projection" as const,
        input: { leafId: "custom-entry", pathIDs: plainContext.pathIDs },
        output: plainContext as unknown as Record<string, unknown>,
        upstreamBehavior: "buildSessionContext emits message entries, converts custom_message entries with createCustomMessage, converts branch_summary entries with createBranchSummaryMessage, and ignores label/session_info/custom entries.",
      },
      {
        scenarioID: "compaction-keeps-summary-and-tail" as const,
        input: { leafId: "after-compact", firstKeptEntryId: "kept-assistant" },
        output: compactionContext as unknown as Record<string, unknown>,
        upstreamBehavior: "When a compaction exists on the path, buildSessionContext emits a compaction summary first, then the pre-compaction tail from firstKeptEntryId through the compaction point, then messages after the compaction.",
      },
      {
        scenarioID: "model-and-thinking-resolution" as const,
        input: { leafId: "model-google" },
        output: modelContext as unknown as Record<string, unknown>,
        upstreamBehavior: "buildSessionContext scans the whole path for thinking_level_change, model_change, and assistant message model metadata before returning projected messages.",
      },
      {
        scenarioID: "non-message-entries-are-ignored" as const,
        input: { leafId: "ignored-label" },
        output: ignoredContext as unknown as Record<string, unknown>,
        upstreamBehavior: "thinking_level_change, model_change, label, custom, session_info, and leaf entries are not emitted as messages unless they are one of the explicit message-producing entry types.",
      },
    ],
    sourceRefs: [
      "packages/agent/src/harness/session/session.ts#buildSessionContext",
      "packages/agent/src/harness/session/session.ts#Session.buildContext",
      "packages/agent/src/harness/messages.ts#createCustomMessage,createBranchSummaryMessage,createCompactionSummaryMessage",
      "packages/agent/src/harness/types.ts#SessionTreeEntry,SessionContext",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.getPathToRoot",
    ],
    nativeEvidenceRefs: [...piMonoSessionProjectorJsonlV3NativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoSessionProjectorJsonlV3NativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function createPiMonoSessionToolResultMessage(input: {
  toolCallId: string
  toolName: string
  content: unknown[]
  details?: unknown
  isError: boolean
  timestamp: number
}): Record<string, unknown> {
  return {
    role: "toolResult",
    toolCallId: input.toolCallId,
    toolName: input.toolName,
    content: structuredClone(input.content),
    details: input.details === undefined ? undefined : structuredClone(input.details),
    isError: input.isError,
    timestamp: input.timestamp,
  }
}

export function projectPiMonoSessionMessageEndEntry(input: {
  id: string
  parentId: string | null
  timestamp: string
  message: Record<string, unknown>
}): PiMonoJsonlGenericEntry | undefined {
  const role = input.message.role
  if (role === "custom") {
    const entry: PiMonoJsonlGenericEntry = {
      type: "custom_message",
      id: input.id,
      parentId: input.parentId,
      timestamp: input.timestamp,
      customType: input.message.customType,
      content: structuredClone(input.message.content),
      display: input.message.display,
    }
    if (input.message.details !== undefined) entry.details = structuredClone(input.message.details)
    return entry
  }
  if (role === "user" || role === "assistant" || role === "toolResult") {
    return {
      type: "message",
      id: input.id,
      parentId: input.parentId,
      timestamp: input.timestamp,
      message: structuredClone(input.message),
    }
  }
  return undefined
}

export function buildPiMonoSessionMessagePartProjectorNativeExactFixture(): PiMonoSessionMessagePartProjectorNativeExactFixture {
  const userEntry: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "user",
    parentId: null,
    timestamp: "2026-06-01T00:00:00.000Z",
    message: { role: "user", content: [{ type: "text", text: "Inspect the session projector." }], timestamp: 1780272000000 },
  }
  const assistantStartMessage: Record<string, unknown> = {
    role: "assistant",
    provider: "anthropic",
    model: "claude-3-7-sonnet-20250219",
    content: [],
    stopReason: "incomplete",
    timestamp: 1780272001000,
  }
  const assistantTextPartial: Record<string, unknown> = {
    ...assistantStartMessage,
    content: [{ type: "text", text: "Reading" }],
  }
  const assistantThinkingPartial: Record<string, unknown> = {
    ...assistantStartMessage,
    content: [
      { type: "text", text: "Reading" },
      { type: "thinking", thinking: "Need exact session writes.", thinkingSignature: "sig-thinking" },
    ],
  }
  const assistantFinalMessage: Record<string, unknown> = {
    role: "assistant",
    provider: "anthropic",
    model: "claude-3-7-sonnet-20250219",
    content: [
      { type: "text", text: "Reading complete.", textSignature: "sig-text" },
      { type: "thinking", thinking: "Need exact session writes.", thinkingSignature: "sig-thinking" },
      { type: "toolCall", id: "tool-read", name: "read_file", arguments: { path: "packages/lego-session/src/product-schema/pi.ts" } },
    ],
    stopReason: "tool_use",
    usage: { inputTokens: 11, outputTokens: 17 },
    timestamp: 1780272001500,
  }
  const assistantEntry = projectPiMonoSessionMessageEndEntry({
    id: "assistant-final",
    parentId: userEntry.id,
    timestamp: "2026-06-01T00:00:01.600Z",
    message: assistantFinalMessage,
  })!
  const assistantContext = buildPiMonoSessionContextSnapshot([userEntry, assistantEntry], assistantEntry.id)

  const toolResultMessage = createPiMonoSessionToolResultMessage({
    toolCallId: "tool-read",
    toolName: "read_file",
    content: [{ type: "text", text: "export const piMonoSessionUpstreamRef = ..." }],
    details: { bytes: 51, source: "fixture" },
    isError: false,
    timestamp: 1780272002200,
  })
  const toolResultEntry = projectPiMonoSessionMessageEndEntry({
    id: "tool-result",
    parentId: assistantEntry.id,
    timestamp: "2026-06-01T00:00:02.300Z",
    message: toolResultMessage,
  })!
  const toolContext = buildPiMonoSessionContextSnapshot([userEntry, assistantEntry, toolResultEntry], toolResultEntry.id)

  const customMessage: Record<string, unknown> = {
    role: "custom",
    customType: "fixture.notice",
    content: [{ type: "text", text: "Native message part projector fixture" }],
    display: true,
    details: { injectedBy: "extension" },
    timestamp: 1780272003000,
  }
  const customEntry = projectPiMonoSessionMessageEndEntry({
    id: "custom-message",
    parentId: toolResultEntry.id,
    timestamp: "2026-06-01T00:00:03.100Z",
    message: customMessage,
  })!
  const combinedContext = buildPiMonoSessionContextSnapshot([userEntry, assistantEntry, toolResultEntry, customEntry], customEntry.id)
  const combinedMessages = combinedContext.messages as Record<string, unknown>[]
  const projectedAssistant = combinedMessages.find((message) => message.role === "assistant") as Record<string, unknown>
  const projectedToolResult = combinedMessages.find((message) => message.role === "toolResult") as Record<string, unknown>
  const projectedCustom = combinedMessages.find((message) => message.role === "custom") as Record<string, unknown>
  const assistantContent = projectedAssistant.content as Record<string, unknown>[]

  const fixtureWithoutFingerprint: Omit<PiMonoSessionMessagePartProjectorNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoSessionMessagePartProjectorNativeExactAtomID,
    portID: "session.message-part-projector" as const,
    upstreamRef: piMonoSessionUpstreamRef,
    evidenceRef: piMonoSessionMessagePartProjectorNativeExactEvidenceRef,
    fixtureID: piMonoSessionMessagePartProjectorNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      assistantStreamUsesMessageUpdateUntilFinalMessageEnd: true as const,
      messageEndPersistsFinalAssistantUserAndToolResultMessages: true as const,
      toolResultMessagesPreserveContentDetailsAndErrorState: true as const,
      customMessagesPersistAsCustomMessageEntries: true as const,
      buildSessionContextRehydratesNativeContentBlocks: true as const,
      extensionMessageEndMutationsPrecedePersistence: true as const,
    },
    cases: [
      {
        scenarioID: "assistant-stream-message-lifecycle" as const,
        input: {
          providerEvents: ["start", "text_delta", "thinking_end", "toolcall_end", "done"],
          partialMessages: [assistantStartMessage, assistantTextPartial, assistantThinkingPartial],
        },
        output: {
          emittedAgentEvents: ["message_start", "message_update", "message_update", "message_update", "message_end"],
          updateEventTypes: ["text_delta", "thinking_end", "toolcall_end"],
          persistedEntry: assistantEntry,
          projectedAssistant: assistantContext.messages.at(-1),
        },
        upstreamBehavior: "streamAssistantResponse emits message_update for text/thinking/toolcall stream events and only _handleAgentEvent persists the final assistant message on message_end.",
      },
      {
        scenarioID: "tool-result-message-persistence" as const,
        input: {
          toolExecutionEvents: ["tool_execution_start", "tool_execution_update", "tool_execution_end", "message_start", "message_end"],
          finalizedToolCall: { id: "tool-read", name: "read_file", isError: false },
        },
        output: {
          toolResultMessage,
          persistedEntry: toolResultEntry,
          projectedToolResult: toolContext.messages.at(-1),
        },
        upstreamBehavior: "createToolResultMessage preserves toolCallId, toolName, content, details, isError, and timestamp before emitToolResultMessage sends message_start/message_end for SessionManager.appendMessage.",
      },
      {
        scenarioID: "custom-message-entry-persistence" as const,
        input: {
          sendCustomMessageMode: "not-streaming-triggerTurn-false",
          eventOrder: ["appendCustomMessageEntry", "message_start", "message_end"],
          message: customMessage,
        },
        output: {
          persistedEntry: customEntry,
          projectedCustom,
        },
        upstreamBehavior: "AgentSession.sendCustomMessage without triggerTurn writes appendCustomMessageEntry directly before local message_start/message_end, while _handleAgentEvent persists custom message_end events as CustomMessageEntry.",
      },
      {
        scenarioID: "context-rebuild-preserves-native-message-parts" as const,
        input: { leafId: customEntry.id, entryIDs: [userEntry.id, assistantEntry.id, toolResultEntry.id, customEntry.id] },
        output: {
          context: combinedContext,
          messageRoles: combinedMessages.map((message) => message.role),
          assistantContentTypes: assistantContent.map((part) => part.type),
          toolResultDetails: projectedToolResult.details,
          customTimestamp: projectedCustom.timestamp,
        },
        upstreamBehavior: "buildSessionContext emits native message entries unchanged, rehydrates custom_message through createCustomMessage with the entry timestamp, and preserves assistant toolCall/thinking/text content blocks without lossy text projection.",
      },
    ],
    sourceRefs: [
      "packages/agent/src/agent-loop.ts#streamAssistantResponse",
      "packages/agent/src/agent-loop.ts#createToolResultMessage,emitToolResultMessage",
      "packages/agent/src/types.ts#AgentEvent,AssistantMessageEvent",
      "packages/coding-agent/src/core/agent-session.ts#_handleAgentEvent,_emitExtensionEvent,sendCustomMessage,_replaceMessageInPlace",
      "packages/coding-agent/src/core/session-manager.ts#SessionManager.appendMessage,appendCustomMessageEntry,buildSessionContext",
      "packages/coding-agent/src/core/messages.ts#createCustomMessage",
    ],
    nativeEvidenceRefs: [...piMonoSessionMessagePartProjectorNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoSessionMessagePartProjectorNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoSessionBranchSummaryNativeExactFixture(): PiMonoSessionBranchSummaryNativeExactFixture {
  const rootEntry: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "root",
    parentId: null,
    timestamp: "2026-06-01T00:00:00.000Z",
    message: { role: "user", content: [{ type: "text", text: "hello" }] },
  }
  const branchEntry: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "branch",
    parentId: "root",
    timestamp: "2026-06-01T00:00:01.000Z",
    message: { role: "assistant", content: [{ type: "text", text: "branch" }] },
  }
  const baseEntries = [rootEntry, branchEntry]
  const moveToRoot = movePiMonoJsonlBranchWithSummary({
    entries: baseEntries,
    currentLeafId: "branch",
    targetLeafId: "root",
    leafEntryId: "leaf-to-root",
    summaryEntryId: "branch-summary-root",
    leafTimestamp: "2026-06-01T00:10:00.000Z",
    summaryTimestamp: "2026-06-01T00:10:01.000Z",
    summary: {
      summary: "Returned from branch.",
      details: { reason: "fixture" },
      fromHook: true,
    },
  })
  const moveToNull = movePiMonoJsonlBranchWithSummary({
    entries: baseEntries,
    currentLeafId: "branch",
    targetLeafId: null,
    leafEntryId: "leaf-to-rootless",
    summaryEntryId: "branch-summary-rootless",
    leafTimestamp: "2026-06-01T00:11:00.000Z",
    summaryTimestamp: "2026-06-01T00:11:01.000Z",
    summary: {
      summary: "Started a rootless branch.",
    },
  })
  const moveWithoutSummary = movePiMonoJsonlBranchWithSummary({
    entries: baseEntries,
    currentLeafId: "branch",
    targetLeafId: "root",
    leafEntryId: "leaf-only-to-root",
    leafTimestamp: "2026-06-01T00:12:00.000Z",
  })
  let invalidTargetError: Record<string, unknown> = {}
  try {
    movePiMonoJsonlBranchWithSummary({
      entries: baseEntries,
      currentLeafId: "branch",
      targetLeafId: "missing",
      leafEntryId: "leaf-missing",
      summaryEntryId: "branch-summary-missing",
      leafTimestamp: "2026-06-01T00:13:00.000Z",
      summaryTimestamp: "2026-06-01T00:13:01.000Z",
      summary: { summary: "Should not be written." },
    })
  } catch (error) {
    invalidTargetError = {
      code: error instanceof PiMonoSessionNativeError ? error.code : "unknown",
      message: error instanceof Error ? error.message : String(error),
    }
  }

  const fixtureWithoutFingerprint: Omit<PiMonoSessionBranchSummaryNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoSessionBranchSummaryNativeExactAtomID,
    portID: "session.compaction-records" as const,
    upstreamRef: piMonoSessionUpstreamRef,
    evidenceRef: piMonoSessionBranchSummaryNativeExactEvidenceRef,
    fixtureID: piMonoSessionBranchSummaryNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      moveToValidatesTargetBeforeWrite: true as const,
      moveToAppendsLeafPointerBeforeSummary: true as const,
      leafPointerParentIsPreviousCurrentLeaf: true as const,
      branchSummaryParentIsTargetLeaf: true as const,
      nullTargetBranchSummaryUsesRootFromId: true as const,
      summaryEntryBecomesCurrentLeaf: true as const,
      moveWithoutSummaryLeavesTargetAsCurrentLeaf: true as const,
      contextProjectsBranchSummaryMessage: true as const,
    },
    cases: [
      {
        scenarioID: "move-to-target-appends-leaf-pointer-before-summary" as const,
        input: { currentLeafId: "branch", targetLeafId: "root", summary: "Returned from branch." },
        output: {
          previousLeafId: moveToRoot.previousLeafId,
          leafEntry: moveToRoot.leafEntry,
          summaryEntry: moveToRoot.summaryEntry,
          currentLeafId: moveToRoot.currentLeafId,
          entryIDs: moveToRoot.entries.map((entry) => entry.id),
          pathIDs: moveToRoot.pathIDs,
          context: moveToRoot.context,
        },
        upstreamBehavior: "Session.moveTo(target, summary) calls storage.setLeafId(target) first, then appends a branch_summary whose parentId/fromId are the target entry id, and the appended summary becomes the current leaf.",
      },
      {
        scenarioID: "move-to-null-summary-uses-root-from-id" as const,
        input: { currentLeafId: "branch", targetLeafId: null, summary: "Started a rootless branch." },
        output: {
          previousLeafId: moveToNull.previousLeafId,
          leafEntry: moveToNull.leafEntry,
          summaryEntry: moveToNull.summaryEntry,
          currentLeafId: moveToNull.currentLeafId,
          entryIDs: moveToNull.entries.map((entry) => entry.id),
          pathIDs: moveToNull.pathIDs,
          context: moveToNull.context,
        },
        upstreamBehavior: "Session.moveTo(null, summary) appends the leaf pointer to null, then writes branch_summary with parentId null and fromId \"root\".",
      },
      {
        scenarioID: "move-without-summary-leaves-active-target" as const,
        input: { currentLeafId: "branch", targetLeafId: "root" },
        output: {
          previousLeafId: moveWithoutSummary.previousLeafId,
          leafEntry: moveWithoutSummary.leafEntry,
          currentLeafId: moveWithoutSummary.currentLeafId,
          entryIDs: moveWithoutSummary.entries.map((entry) => entry.id),
          pathIDs: moveWithoutSummary.pathIDs,
          context: moveWithoutSummary.context,
        },
        upstreamBehavior: "Session.moveTo(target) returns after storage.setLeafId(target), so the active leaf remains the requested target and no branch_summary entry is appended.",
      },
      {
        scenarioID: "invalid-target-rejected-before-write" as const,
        input: { currentLeafId: "branch", targetLeafId: "missing", summary: "Should not be written." },
        output: {
          error: invalidTargetError,
          currentLeafId: "branch",
          entryIDs: baseEntries.map((entry) => entry.id),
        },
        upstreamBehavior: "Session.moveTo validates a non-null target with storage.getEntry before setLeafId or appendTypedEntry; a missing target throws not_found and writes no leaf or summary entries.",
      },
    ],
    sourceRefs: [
      "packages/agent/src/harness/session/session.ts#Session.moveTo",
      "packages/agent/src/harness/session/session.ts#Session.appendTypedEntry",
      "packages/agent/src/harness/session/session.ts#buildSessionContext",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.setLeafId",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.appendEntry,leafIdAfterEntry",
      "packages/agent/src/harness/types.ts#BranchSummaryEntry,SessionTreeEvent",
      "packages/agent/src/harness/messages.ts#createBranchSummaryMessage",
    ],
    nativeEvidenceRefs: [...piMonoSessionBranchSummaryNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoSessionBranchSummaryNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoSessionManagerNativeExactFixture(): PiMonoSessionManagerNativeExactFixture {
  const sessionID = "pi-session-manager-fixture"
  const filePath = "/sessions/--workspace-app--/2026-06-01T00-00-00-000Z_pi-session-manager-fixture.jsonl"
  const header = buildPiMonoJsonlSessionHeader({
    id: sessionID,
    timestamp: "2026-06-01T00:00:00.000Z",
    cwd: "/workspace/app",
    parentSession: "/sessions/parent.jsonl",
  })
  const root: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "root",
    parentId: null,
    timestamp: "2026-06-01T00:00:01.000Z",
    message: { role: "user", content: [{ type: "text", text: "hello" }] },
  }
  const assistant: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "assistant",
    parentId: "root",
    timestamp: "2026-06-01T00:00:02.000Z",
    message: {
      role: "assistant",
      provider: "anthropic",
      model: "claude-3-7-sonnet-20250219",
      content: [{ type: "text", text: "hi" }],
    },
  }
  const sibling: PiMonoJsonlGenericEntry = {
    type: "message",
    id: "sibling",
    parentId: "root",
    timestamp: "2026-06-01T00:00:03.000Z",
    message: { role: "user", content: [{ type: "text", text: "side branch" }] },
  }
  const customMessage: PiMonoJsonlGenericEntry = {
    type: "custom_message",
    id: "custom-message",
    parentId: "assistant",
    timestamp: "2026-06-01T00:00:04.000Z",
    customType: "notice",
    content: "native event",
    display: true,
    details: { source: "fixture" },
  }
  const sessionInfo: PiMonoJsonlGenericEntry = {
    type: "session_info",
    id: "session-info",
    parentId: "custom-message",
    timestamp: "2026-06-01T00:00:05.000Z",
    name: "  Pi session manager  ",
  }
  const linearEntries = [root, assistant, customMessage, sessionInfo]
  const branchedEntries = [root, assistant, sibling]
  const linearGraph = buildPiMonoJsonlBranchGraphSnapshot(linearEntries)
  const linearContext = buildPiMonoSessionContextSnapshot(linearEntries, linearGraph.currentLeafId)
  const activeSiblingContext = buildPiMonoSessionContextSnapshot(branchedEntries, "sibling")
  const sessionInfoOutput = piMonoSessionManagerInfoFromHeader(header, filePath, linearEntries)
  const moveToAssistant = movePiMonoJsonlBranchWithSummary({
    entries: branchedEntries,
    currentLeafId: "sibling",
    targetLeafId: "assistant",
    leafEntryId: "leaf-to-assistant",
    summaryEntryId: "branch-summary-to-assistant",
    leafTimestamp: "2026-06-01T00:00:06.000Z",
    summaryTimestamp: "2026-06-01T00:00:07.000Z",
    summary: { summary: "Returned to the assistant branch.", details: { reason: "fixture" } },
  })
  const diffRecords = piMonoSessionManagerDiffRecords(sessionID, [root, assistant], moveToAssistant.entries)
  const eventRecords = piMonoSessionManagerEventRecords(sessionID, linearEntries)

  const fixtureWithoutFingerprint: Omit<PiMonoSessionManagerNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: [...piMonoSessionManagerNativeExactAtomIDs] as typeof piMonoSessionManagerNativeExactAtomIDs,
    portIDs: [...piMonoSessionManagerNativeExactPortIDs] as typeof piMonoSessionManagerNativeExactPortIDs,
    upstreamRef: piMonoSessionUpstreamRef,
    evidenceRef: piMonoSessionManagerNativeExactEvidenceRef,
    fixtureID: piMonoSessionManagerNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      sameJsonlEntryStreamBacksAllPorts: true as const,
      writerCreatesJsonlV3HeaderAndSessionInfo: true as const,
      messageStoreAppendsParentLinkedEntries: true as const,
      eventLogReadsAppendOnlyEntryStream: true as const,
      readerProjectsActiveLeafContext: true as const,
      branchingWritesLeafPointerBeforeSummary: true as const,
      diffReadsSessionEventProjection: true as const,
    },
    cases: [
      {
        scenarioID: "writer-create-header-and-reader-list" as const,
        portIDs: ["session.writer", "session.reader"],
        input: {
          sessionID,
          cwd: header.cwd,
          timestamp: header.timestamp,
          parentSession: header.parentSession,
          sessionInfoName: sessionInfo.name,
        },
        output: {
          header,
          filePath,
          fileName: buildPiMonoJsonlSessionFileName(header.timestamp, header.id),
          sessionInfo: sessionInfoOutput,
          readerGet: sessionInfoOutput,
          readerList: [sessionInfoOutput],
        },
        upstreamBehavior: "SessionManager.create writes a JSONL v3 session header, SessionManager.appendSessionInfo appends a session_info entry, getSessionName trims the latest name, and list/get expose the same session metadata.",
      },
      {
        scenarioID: "message-store-appends-native-entries" as const,
        portIDs: ["session.message-store", "session.reader"],
        input: {
          sessionID,
          appendEntryIDs: linearEntries.map((entry) => entry.id),
          appendEntryTypes: linearEntries.map((entry) => entry.type),
        },
        output: {
          entryStream: linearEntries.map(piMonoSessionManagerEntrySummary),
          currentLeafId: linearGraph.currentLeafId,
          context: linearContext,
          readerMessages: linearContext.messages,
        },
        upstreamBehavior: "SessionManager append methods write parent-linked message/custom_message/session_info entries into the same append-only stream; buildSessionContext projects message-producing entries and ignores session_info while the latest entry remains the active leaf.",
      },
      {
        scenarioID: "event-log-reads-append-only-entry-stream" as const,
        portIDs: ["session.event-log"],
        input: {
          sessionID,
          read: { sessionID },
          typeFilter: "session.message",
        },
        output: {
          events: eventRecords,
          messageEvents: eventRecords.filter((event) => event.type === "session.message"),
          customMessageEvents: eventRecords.filter((event) => event.type === "session.custom_message"),
        },
        upstreamBehavior: "SessionManager persists each mutation as an ordered JSONL entry, so the Harness event-log port reads the native append-only entry stream and filters by session/type without changing entry payloads.",
      },
      {
        scenarioID: "branching-switches-active-leaf-with-summary" as const,
        portIDs: ["session.branching", "session.reader"],
        input: {
          sessionID,
          currentLeafId: "sibling",
          targetLeafId: "assistant",
          summary: "Returned to the assistant branch.",
        },
        output: {
          previousLeafId: moveToAssistant.previousLeafId,
          leafEntry: moveToAssistant.leafEntry,
          summaryEntry: moveToAssistant.summaryEntry,
          currentLeafId: moveToAssistant.currentLeafId,
          entryStream: moveToAssistant.entries.map(piMonoSessionManagerEntrySummary),
          context: moveToAssistant.context,
        },
        upstreamBehavior: "Session.moveTo/SessionManager.branchWithSummary validates the target, appends a leaf pointer from the previous active leaf to the target, then appends branch_summary with the target as parent/fromId; that summary becomes the active leaf.",
      },
      {
        scenarioID: "diff-returns-entry-and-leaf-transition-records" as const,
        portIDs: ["session.diff", "session.event-log"],
        input: {
          sessionID,
          beforeEntryIDs: ["root", "assistant"],
          afterEntryIDs: moveToAssistant.entries.map((entry) => entry.id),
        },
        output: {
          records: diffRecords,
          recordTypes: diffRecords.map((record) => record.type),
        },
        upstreamBehavior: "The Harness diff port is replaceable with the same event projection used by the native JSONL session stream: added entries remain ordered and the active leaf transition is derived from native leafIDAfterEntry semantics.",
      },
      {
        scenarioID: "reader-transcript-follows-active-branch" as const,
        portIDs: ["session.reader", "session.branching"],
        input: {
          sessionID,
          activeLeafId: "sibling",
          entryIDs: branchedEntries.map((entry) => entry.id),
        },
        output: {
          pathIDs: activeSiblingContext.pathIDs,
          transcript: { sessionID, messages: activeSiblingContext.messages },
          excludedEntryIDs: ["assistant"],
        },
        upstreamBehavior: "SessionManager.getBranch/buildSessionContext walks parentId links from the active leaf to root, so reader.transcript follows the selected branch and excludes sibling branch entries.",
      },
    ],
    sourceRefs: [
      "packages/coding-agent/src/core/session-manager.ts#SessionManager.create",
      "packages/coding-agent/src/core/session-manager.ts#SessionManager._appendEntry",
      "packages/coding-agent/src/core/session-manager.ts#SessionManager.getSessionName",
      "packages/coding-agent/src/core/session-manager.ts#SessionManager.getBranch",
      "packages/coding-agent/src/core/session-manager.ts#SessionManager.buildSessionContext",
      "packages/coding-agent/src/core/session-manager.ts#SessionManager.branchWithSummary",
      "packages/agent/src/harness/session/session.ts#Session.appendTypedEntry",
      "packages/agent/src/harness/session/session.ts#Session.moveTo",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.appendEntry",
      "packages/agent/src/harness/session/jsonl-storage.ts#JsonlSessionStorage.setLeafId",
      "packages/agent/src/harness/session/jsonl-storage.ts#leafIdAfterEntry",
    ],
    nativeEvidenceRefs: [piMonoSessionManagerNativeExactEvidenceRef, piMonoSessionManagerNativeExactReplayRef],
    fixtureIDs: [piMonoSessionManagerNativeExactFixtureID],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoSessionIDGeneratorNativeExactFixture(
  fixture: PiMonoSessionIDGeneratorNativeExactFixture,
): PiMonoSessionIDGeneratorNativeExactVerification {
  const canonical = buildPiMonoSessionIDGeneratorNativeExactFixture()
  const issues: PiMonoSessionIDGeneratorNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-session-id-generator-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi session id generator behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoSessionIDGeneratorNativeExactAtomID || fixture.portID !== "session.id-generator") {
    issues.push({ id: "pi-session-id-generator-native-exact.identity", message: "Fixture must remain scoped to the Pi session.id-generator atom." })
  }
  if (fixture.upstreamRef !== piMonoSessionUpstreamRef || !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#generateEntryId")) || !fixture.sourceRefs.some((ref) => ref.includes("uuid.ts#fillRandomBytes,uuidv7,formatUuid"))) {
    issues.push({ id: "pi-session-id-generator-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream JSONL id generation sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-session-id-generator-native-exact.native-claim", message: "Pi session id generator fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoSessionIDGeneratorNativeDescriptor.knownLossiness.length > 0) {
    issues.push({ id: "pi-session-id-generator-native-exact.lossiness", message: "Native exact Pi session id generator fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoSessionIDGeneratorNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoSessionIDGeneratorNativeExactReplayRef)) {
    issues.push({ id: "pi-session-id-generator-native-exact.evidence", message: "Pi session id generator native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoSessionIDGeneratorNativeExactFixtureID)) {
    issues.push({ id: "pi-session-id-generator-native-exact.fixture", message: "Pi session id generator native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-session-id-generator-native-exact.policy", message: "Pi session id generator policy drifted from upstream JSONL behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases) || !fixture.cases.some((item) => item.outputKind === "full-uuidv7" && uuidV7Pattern.test(item.output))) {
    issues.push({ id: "pi-session-id-generator-native-exact.cases", message: "Pi session id generator cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyPiMonoSessionManagerNativeExactFixture(
  fixture: PiMonoSessionManagerNativeExactFixture,
): PiMonoSessionManagerNativeExactVerification {
  const canonical = buildPiMonoSessionManagerNativeExactFixture()
  const issues: PiMonoSessionManagerNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-session-manager-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi SessionManager facade behavior." })
  }
  if (
    fixture.product !== "pi-mono" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(piMonoSessionManagerNativeExactAtomIDs) ||
    JSON.stringify(fixture.portIDs) !== JSON.stringify(piMonoSessionManagerNativeExactPortIDs)
  ) {
    issues.push({ id: "pi-session-manager-native-exact.identity", message: "Fixture must remain scoped to the Pi SessionManager facade atoms and ports." })
  }
  if (
    fixture.upstreamRef !== piMonoSessionUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#SessionManager._appendEntry")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#SessionManager.buildSessionContext")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#SessionManager.branchWithSummary")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#JsonlSessionStorage.appendEntry")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#leafIdAfterEntry"))
  ) {
    issues.push({ id: "pi-session-manager-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream SessionManager and JSONL storage sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-session-manager-native-exact.native-claim", message: "Pi SessionManager facade fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoSessionManagerNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "pi-session-manager-native-exact.lossiness", message: "Native exact Pi SessionManager facade fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoSessionManagerNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoSessionManagerNativeExactReplayRef)) {
    issues.push({ id: "pi-session-manager-native-exact.evidence", message: "Pi SessionManager facade native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoSessionManagerNativeExactFixtureID)) {
    issues.push({ id: "pi-session-manager-native-exact.fixture", message: "Pi SessionManager facade native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-session-manager-native-exact.policy", message: "Pi SessionManager facade policy drifted from upstream JSONL behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-session-manager-native-exact.cases", message: "Pi SessionManager facade cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyPiMonoSessionBranchGraphNativeExactFixture(
  fixture: PiMonoSessionBranchGraphNativeExactFixture,
): PiMonoSessionBranchGraphNativeExactVerification {
  const canonical = buildPiMonoSessionBranchGraphNativeExactFixture()
  const issues: PiMonoSessionBranchGraphNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-session-branch-graph-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi session branch graph behavior." })
  }
  if (
    fixture.product !== "pi-mono" ||
    fixture.portID !== "session.branch-graph" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(piMonoSessionBranchGraphNativeExactAtomIDs)
  ) {
    issues.push({ id: "pi-session-branch-graph-native-exact.identity", message: "Fixture must remain scoped to the Pi session branch graph atoms." })
  }
  if (
    fixture.upstreamRef !== piMonoSessionUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#JsonlSessionStorage.setLeafId")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#JsonlSessionStorage.getPathToRoot")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-repo.ts#encodeCwd"))
  ) {
    issues.push({ id: "pi-session-branch-graph-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream JSONL branch graph sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-session-branch-graph-native-exact.native-claim", message: "Pi session branch graph fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoSessionBranchGraphNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "pi-session-branch-graph-native-exact.lossiness", message: "Native exact Pi session branch graph fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoSessionBranchGraphNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoSessionBranchGraphNativeExactReplayRef)) {
    issues.push({ id: "pi-session-branch-graph-native-exact.evidence", message: "Pi session branch graph native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoSessionBranchGraphNativeExactFixtureID)) {
    issues.push({ id: "pi-session-branch-graph-native-exact.fixture", message: "Pi session branch graph native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-session-branch-graph-native-exact.policy", message: "Pi session branch graph policy drifted from upstream JSONL behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-session-branch-graph-native-exact.cases", message: "Pi session branch graph cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyPiMonoSessionContextSelectorNativeExactFixture(
  fixture: PiMonoSessionContextSelectorNativeExactFixture,
): PiMonoSessionContextSelectorNativeExactVerification {
  const canonical = buildPiMonoSessionContextSelectorNativeExactFixture()
  const issues: PiMonoSessionContextSelectorNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-session-context-selector-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi active path/context selector behavior." })
  }
  if (
    fixture.product !== "pi-mono" ||
    JSON.stringify(fixture.portIDs) !== JSON.stringify(["session.pagination", "session.context-selector"]) ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(piMonoSessionContextSelectorNativeExactAtomIDs)
  ) {
    issues.push({ id: "pi-session-context-selector-native-exact.identity", message: "Fixture must remain scoped to the Pi active path and context selector atoms." })
  }
  if (
    fixture.upstreamRef !== piMonoSessionUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#SessionManager.getBranch")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#buildSessionContext")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("repo-utils.ts#getEntriesToFork"))
  ) {
    issues.push({ id: "pi-session-context-selector-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream active path/context selector sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-session-context-selector-native-exact.native-claim", message: "Pi active path/context selector fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoSessionContextSelectorNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "pi-session-context-selector-native-exact.lossiness", message: "Native exact Pi active path/context selector fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoSessionContextSelectorNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoSessionContextSelectorNativeExactReplayRef)) {
    issues.push({ id: "pi-session-context-selector-native-exact.evidence", message: "Pi active path/context selector native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoSessionContextSelectorNativeExactFixtureID)) {
    issues.push({ id: "pi-session-context-selector-native-exact.fixture", message: "Pi active path/context selector native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-session-context-selector-native-exact.policy", message: "Pi active path/context selector policy drifted from upstream behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-session-context-selector-native-exact.cases", message: "Pi active path/context selector cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyPiMonoSessionStoreJsonlV3NativeExactFixture(
  fixture: PiMonoSessionStoreJsonlV3NativeExactFixture,
): PiMonoSessionStoreJsonlV3NativeExactVerification {
  const canonical = buildPiMonoSessionStoreJsonlV3NativeExactFixture()
  const issues: PiMonoSessionStoreJsonlV3NativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-session-store-jsonl-v3-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi JSONL v3 storage behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoSessionStoreJsonlV3NativeExactAtomID || fixture.portID !== "session.store") {
    issues.push({ id: "pi-session-store-jsonl-v3-native-exact.identity", message: "Fixture must remain scoped to the Pi JSONL v3 session store atom." })
  }
  if (
    fixture.upstreamRef !== piMonoSessionUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#JsonlSessionStorage.create")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#loadJsonlStorage")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#JsonlSessionStorage.appendEntry")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#JsonlSessionStorage.setLeafId"))
  ) {
    issues.push({ id: "pi-session-store-jsonl-v3-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream JSONL v3 storage sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-session-store-jsonl-v3-native-exact.native-claim", message: "Pi JSONL v3 session store fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoSessionStoreJsonlV3NativeDescriptor.knownLossiness.length > 0) {
    issues.push({ id: "pi-session-store-jsonl-v3-native-exact.lossiness", message: "Native exact Pi JSONL v3 session store fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoSessionStoreJsonlV3NativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoSessionStoreJsonlV3NativeExactReplayRef)) {
    issues.push({ id: "pi-session-store-jsonl-v3-native-exact.evidence", message: "Pi JSONL v3 session store native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoSessionStoreJsonlV3NativeExactFixtureID)) {
    issues.push({ id: "pi-session-store-jsonl-v3-native-exact.fixture", message: "Pi JSONL v3 session store native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-session-store-jsonl-v3-native-exact.policy", message: "Pi JSONL v3 session store policy drifted from upstream behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-session-store-jsonl-v3-native-exact.cases", message: "Pi JSONL v3 session store cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyPiMonoSessionStoreJsonlV3MigratorNativeExactFixture(
  fixture: PiMonoSessionStoreJsonlV3MigratorNativeExactFixture,
): PiMonoSessionStoreJsonlV3MigratorNativeExactVerification {
  const canonical = buildPiMonoSessionStoreJsonlV3MigratorNativeExactFixture()
  const issues: PiMonoSessionStoreJsonlV3MigratorNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-session-store-jsonl-v3-migrator-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi legacy session migration behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoSessionStoreJsonlV3MigratorNativeExactAtomID || fixture.portID !== "session.store") {
    issues.push({ id: "pi-session-store-jsonl-v3-migrator-native-exact.identity", message: "Fixture must remain scoped to the Pi JSONL v3 session migrator atom." })
  }
  if (
    fixture.upstreamRef !== piMonoSessionUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#migrateV1ToV2")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#migrateV2ToV3")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#migrateToCurrentVersion")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#parseSessionEntries")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#loadEntriesFromFile"))
  ) {
    issues.push({ id: "pi-session-store-jsonl-v3-migrator-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream legacy session migration sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-session-store-jsonl-v3-migrator-native-exact.native-claim", message: "Pi JSONL v3 migrator fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoSessionStoreJsonlV3MigratorNativeDescriptor.knownLossiness.length > 0) {
    issues.push({ id: "pi-session-store-jsonl-v3-migrator-native-exact.lossiness", message: "Native exact Pi JSONL v3 migrator fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoSessionStoreJsonlV3MigratorNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoSessionStoreJsonlV3MigratorNativeExactReplayRef)) {
    issues.push({ id: "pi-session-store-jsonl-v3-migrator-native-exact.evidence", message: "Pi JSONL v3 migrator native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoSessionStoreJsonlV3MigratorNativeExactFixtureID)) {
    issues.push({ id: "pi-session-store-jsonl-v3-migrator-native-exact.fixture", message: "Pi JSONL v3 migrator native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-session-store-jsonl-v3-migrator-native-exact.policy", message: "Pi JSONL v3 migrator policy drifted from upstream behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-session-store-jsonl-v3-migrator-native-exact.cases", message: "Pi JSONL v3 migrator cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyPiMonoSessionProjectorJsonlV3NativeExactFixture(
  fixture: PiMonoSessionProjectorJsonlV3NativeExactFixture,
): PiMonoSessionProjectorJsonlV3NativeExactVerification {
  const canonical = buildPiMonoSessionProjectorJsonlV3NativeExactFixture()
  const issues: PiMonoSessionProjectorJsonlV3NativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-session-projector-jsonl-v3-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi JSONL v3 session projector behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoSessionProjectorJsonlV3NativeExactAtomID || fixture.portID !== "session.projector") {
    issues.push({ id: "pi-session-projector-jsonl-v3-native-exact.identity", message: "Fixture must remain scoped to the Pi JSONL v3 session projector atom." })
  }
  if (
    fixture.upstreamRef !== piMonoSessionUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("session.ts#buildSessionContext")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("messages.ts#createCustomMessage")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("createBranchSummaryMessage")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("createCompactionSummaryMessage"))
  ) {
    issues.push({ id: "pi-session-projector-jsonl-v3-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream JSONL v3 session projector sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-session-projector-jsonl-v3-native-exact.native-claim", message: "Pi JSONL v3 session projector fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoSessionProjectorJsonlV3NativeDescriptor.knownLossiness.length > 0) {
    issues.push({ id: "pi-session-projector-jsonl-v3-native-exact.lossiness", message: "Native exact Pi JSONL v3 session projector fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoSessionProjectorJsonlV3NativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoSessionProjectorJsonlV3NativeExactReplayRef)) {
    issues.push({ id: "pi-session-projector-jsonl-v3-native-exact.evidence", message: "Pi JSONL v3 session projector native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoSessionProjectorJsonlV3NativeExactFixtureID)) {
    issues.push({ id: "pi-session-projector-jsonl-v3-native-exact.fixture", message: "Pi JSONL v3 session projector native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-session-projector-jsonl-v3-native-exact.policy", message: "Pi JSONL v3 session projector policy drifted from upstream behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-session-projector-jsonl-v3-native-exact.cases", message: "Pi JSONL v3 session projector cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyPiMonoSessionMessagePartProjectorNativeExactFixture(
  fixture: PiMonoSessionMessagePartProjectorNativeExactFixture,
): PiMonoSessionMessagePartProjectorNativeExactVerification {
  const canonical = buildPiMonoSessionMessagePartProjectorNativeExactFixture()
  const issues: PiMonoSessionMessagePartProjectorNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-session-message-part-projector-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi session message-part projector behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoSessionMessagePartProjectorNativeExactAtomID || fixture.portID !== "session.message-part-projector") {
    issues.push({ id: "pi-session-message-part-projector-native-exact.identity", message: "Fixture must remain scoped to the Pi session.message-part-projector atom." })
  }
  if (
    fixture.upstreamRef !== piMonoSessionUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent-loop.ts#streamAssistantResponse")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent-loop.ts#createToolResultMessage")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent-session.ts#_handleAgentEvent")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-manager.ts#SessionManager.appendMessage")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("messages.ts#createCustomMessage"))
  ) {
    issues.push({ id: "pi-session-message-part-projector-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream agent-loop and SessionManager message-part projection sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-session-message-part-projector-native-exact.native-claim", message: "Pi session message-part projector fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoSessionMessagePartProjectorNativeDescriptor.knownLossiness.length > 0) {
    issues.push({ id: "pi-session-message-part-projector-native-exact.lossiness", message: "Native exact Pi session message-part projector fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoSessionMessagePartProjectorNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoSessionMessagePartProjectorNativeExactReplayRef)) {
    issues.push({ id: "pi-session-message-part-projector-native-exact.evidence", message: "Pi session message-part projector native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoSessionMessagePartProjectorNativeExactFixtureID)) {
    issues.push({ id: "pi-session-message-part-projector-native-exact.fixture", message: "Pi session message-part projector native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-session-message-part-projector-native-exact.policy", message: "Pi session message-part projector policy drifted from upstream event/session behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-session-message-part-projector-native-exact.cases", message: "Pi session message-part projector cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyPiMonoSessionBranchSummaryNativeExactFixture(
  fixture: PiMonoSessionBranchSummaryNativeExactFixture,
): PiMonoSessionBranchSummaryNativeExactVerification {
  const canonical = buildPiMonoSessionBranchSummaryNativeExactFixture()
  const issues: PiMonoSessionBranchSummaryNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-session-branch-summary-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi branch summary move behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoSessionBranchSummaryNativeExactAtomID || fixture.portID !== "session.compaction-records") {
    issues.push({ id: "pi-session-branch-summary-native-exact.identity", message: "Fixture must remain scoped to the Pi session.compaction-records branch summary atom." })
  }
  if (
    fixture.upstreamRef !== piMonoSessionUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("session.ts#Session.moveTo")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#JsonlSessionStorage.setLeafId")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("jsonl-storage.ts#JsonlSessionStorage.appendEntry")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("types.ts#BranchSummaryEntry")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("messages.ts#createBranchSummaryMessage"))
  ) {
    issues.push({ id: "pi-session-branch-summary-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream Session.moveTo branch summary sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-session-branch-summary-native-exact.native-claim", message: "Pi branch summary fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoSessionBranchSummaryNativeDescriptor.knownLossiness.length > 0) {
    issues.push({ id: "pi-session-branch-summary-native-exact.lossiness", message: "Native exact Pi branch summary fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoSessionBranchSummaryNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoSessionBranchSummaryNativeExactReplayRef)) {
    issues.push({ id: "pi-session-branch-summary-native-exact.evidence", message: "Pi branch summary native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoSessionBranchSummaryNativeExactFixtureID)) {
    issues.push({ id: "pi-session-branch-summary-native-exact.fixture", message: "Pi branch summary native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-session-branch-summary-native-exact.policy", message: "Pi branch summary policy drifted from upstream Session.moveTo behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-session-branch-summary-native-exact.cases", message: "Pi branch summary cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function migratePiMonoSessionV1EntriesToV2(
  entries: PiMonoMigratableSessionFileEntry[],
  randomUUID: (() => string) | undefined,
): void {
  const ids = new Set<string>()
  let previousID: string | null = null
  for (const entry of entries) {
    if (entry.type === "session") {
      entry.version = 2
      continue
    }
    const sessionEntry = entry as PiMonoMigratableSessionEntry
    sessionEntry.id = generatePiMonoLegacySessionEntryID(ids, randomUUID)
    sessionEntry.parentId = previousID
    previousID = sessionEntry.id
    if (sessionEntry.type === "compaction" && typeof sessionEntry.firstKeptEntryIndex === "number") {
      const targetEntry = entries[sessionEntry.firstKeptEntryIndex]
      if (targetEntry && targetEntry.type !== "session") {
        sessionEntry.firstKeptEntryId = (targetEntry as PiMonoMigratableSessionEntry).id
      }
      delete sessionEntry.firstKeptEntryIndex
    }
  }
}

function migratePiMonoSessionV2EntriesToV3(entries: PiMonoMigratableSessionFileEntry[]): void {
  for (const entry of entries) {
    if (entry.type === "session") {
      entry.version = 3
      continue
    }
    if (entry.type === "message") {
      const message = (entry as PiMonoMigratableSessionEntry).message
      if (isRecord(message) && message.role === "hookMessage") {
        message.role = "custom"
      }
    }
  }
}

function generatePiMonoLegacySessionEntryID(
  existingIDs: { has(id: string): boolean },
  randomUUID: (() => string) | undefined,
): string {
  const nextUUID = randomUUID ?? deterministicLegacyRandomUUID
  for (let index = 0; index < 100; index += 1) {
    const id = nextUUID().slice(0, 8)
    if (!existingIDs.has(id)) return id
  }
  return nextUUID()
}

function deterministicLegacyRandomUUID(): string {
  return "00000000-0000-4000-8000-000000000000"
}

function piMonoLegacyRandomUUIDSequence(values: string[]): () => string {
  let index = 0
  return () => values[index++] ?? values.at(-1) ?? deterministicLegacyRandomUUID()
}

const uuidV7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function zeroRandomBytes(): Uint8Array {
  return new Uint8Array(16)
}

interface PiMonoNativeSessionIDGeneratorOptions {
  now?: () => number
  randomBytes?: () => Uint8Array
  existingIDs?: Iterable<string>
}

interface PiMonoNativeUUIDV7State {
  lastTimestamp: number
  sequence: number
}

function createPiMonoNativeSessionIDGenerator(options: PiMonoNativeSessionIDGeneratorOptions = {}) {
  const state: PiMonoNativeUUIDV7State = {
    lastTimestamp: Number.NEGATIVE_INFINITY,
    sequence: 0,
  }
  const issuedIDs = new Set(options.existingIDs ?? [])
  return {
    next(input: { seed?: string; timestamp?: number; existingIDs?: Iterable<string> } = {}): string {
      if (input.seed) return input.seed
      const existingIDs = new Set([...issuedIDs, ...(input.existingIDs ?? [])])
      const generatorOptions: Parameters<typeof generatePiMonoNativeJsonlEntryID>[1] = { state }
      const now = input.timestamp === undefined ? options.now : () => input.timestamp!
      if (now) generatorOptions.now = now
      if (options.randomBytes) generatorOptions.randomBytes = options.randomBytes
      const id = generatePiMonoNativeJsonlEntryID(existingIDs, generatorOptions)
      issuedIDs.add(id)
      return id
    },
  }
}

function nextPiMonoNativeJsonlEntryID(
  existingIDs: ReadonlySet<string>,
  timestamp: number,
  randomBytes?: () => Uint8Array,
): string {
  const generatorOptions: Parameters<typeof generatePiMonoNativeJsonlEntryID>[1] = {
    now: () => timestamp,
    state: {
      lastTimestamp: Number.NEGATIVE_INFINITY,
      sequence: 0,
    },
  }
  if (randomBytes) generatorOptions.randomBytes = randomBytes
  return generatePiMonoNativeJsonlEntryID(existingIDs, generatorOptions)
}

function generatePiMonoNativeJsonlEntryID(
  existingIDs: ReadonlySet<string>,
  options: {
    now?: () => number
    randomBytes?: () => Uint8Array
    state: PiMonoNativeUUIDV7State
  },
): string {
  for (let index = 0; index < 100; index += 1) {
    const id = piMonoNativeUUIDV7(options).slice(0, 8)
    if (!existingIDs.has(id)) return id
  }
  return piMonoNativeUUIDV7(options)
}

function piMonoNativeUUIDV7(options: {
  now?: () => number
  randomBytes?: () => Uint8Array
  state: PiMonoNativeUUIDV7State
}): string {
  const random = new Uint8Array(16)
  fillPiMonoNativeRandomBytes(random, options.randomBytes)
  const timestamp = options.now?.() ?? Date.now()

  if (timestamp > options.state.lastTimestamp) {
    options.state.sequence =
      byteAt(random, 6) * 0x1000000 +
      byteAt(random, 7) * 0x10000 +
      byteAt(random, 8) * 0x100 +
      byteAt(random, 9)
    options.state.lastTimestamp = timestamp
  } else {
    options.state.sequence = (options.state.sequence + 1) >>> 0
    if (options.state.sequence === 0) {
      options.state.lastTimestamp += 1
    }
  }

  const bytes = new Uint8Array(16)
  bytes[0] = (options.state.lastTimestamp / 0x10000000000) & 0xff
  bytes[1] = (options.state.lastTimestamp / 0x100000000) & 0xff
  bytes[2] = (options.state.lastTimestamp / 0x1000000) & 0xff
  bytes[3] = (options.state.lastTimestamp / 0x10000) & 0xff
  bytes[4] = (options.state.lastTimestamp / 0x100) & 0xff
  bytes[5] = options.state.lastTimestamp & 0xff
  bytes[6] = 0x70 | ((options.state.sequence >>> 28) & 0x0f)
  bytes[7] = (options.state.sequence >>> 20) & 0xff
  bytes[8] = 0x80 | ((options.state.sequence >>> 14) & 0x3f)
  bytes[9] = (options.state.sequence >>> 6) & 0xff
  bytes[10] = ((options.state.sequence & 0x3f) << 2) | (byteAt(random, 10) & 0x03)
  bytes[11] = byteAt(random, 11)
  bytes[12] = byteAt(random, 12)
  bytes[13] = byteAt(random, 13)
  bytes[14] = byteAt(random, 14)
  bytes[15] = byteAt(random, 15)

  return formatPiMonoNativeUUID(bytes)
}

function byteAt(bytes: Uint8Array, index: number): number {
  return bytes[index] ?? 0
}

function fillPiMonoNativeRandomBytes(bytes: Uint8Array, randomBytes?: () => Uint8Array): void {
  if (randomBytes) {
    const supplied = randomBytes()
    if (supplied.length !== bytes.length) {
      throw new Error(`Pi session id randomBytes must return ${bytes.length} bytes.`)
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

function formatPiMonoNativeUUID(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`
}

function updatePiMonoLabelCache(labelsById: Map<string, string>, entry: PiMonoJsonlSessionEntry): void {
  if (entry.type !== "label") return
  const targetId = stringValue((entry as PiMonoJsonlLabelEntry).targetId)
  if (!targetId) return
  const label = stringValue((entry as PiMonoJsonlLabelEntry).label)?.trim()
  if (label) {
    labelsById.set(targetId, label)
  } else {
    labelsById.delete(targetId)
  }
}

function buildPiMonoSessionProjectedMessages(
  path: PiMonoJsonlSessionEntry[],
  compaction: PiMonoJsonlGenericEntry | null,
): unknown[] {
  const messages: unknown[] = []
  const appendMessage = (entry: PiMonoJsonlSessionEntry) => {
    const projected = piMonoSessionProjectedMessage(entry)
    if (projected !== undefined) messages.push(projected)
  }

  if (compaction) {
    messages.push(createPiMonoCompactionSummaryMessage(compaction))
    const compactionIndex = path.findIndex((entry) => entry.type === "compaction" && entry.id === compaction.id)
    let foundFirstKept = false
    for (let index = 0; index < compactionIndex; index += 1) {
      const entry = path[index]!
      if (entry.id === compaction.firstKeptEntryId) foundFirstKept = true
      if (foundFirstKept) appendMessage(entry)
    }
    for (let index = compactionIndex + 1; index < path.length; index += 1) {
      appendMessage(path[index]!)
    }
    return messages
  }

  for (const entry of path) appendMessage(entry)
  return messages
}

function piMonoSessionProjectedMessage(entry: PiMonoJsonlSessionEntry): unknown {
  if (entry.type === "message") return structuredClone((entry as PiMonoJsonlGenericEntry).message)
  if (entry.type === "custom_message") return createPiMonoCustomMessage(entry as PiMonoJsonlGenericEntry)
  if (entry.type === "branch_summary" && stringValue((entry as PiMonoJsonlGenericEntry).summary)) {
    return createPiMonoBranchSummaryMessage(entry as PiMonoJsonlGenericEntry)
  }
  return undefined
}

function createPiMonoCustomMessage(entry: PiMonoJsonlGenericEntry): Record<string, unknown> {
  return {
    role: "custom",
    customType: entry.customType,
    content: structuredClone(entry.content),
    display: entry.display,
    details: entry.details === undefined ? undefined : structuredClone(entry.details),
    timestamp: new Date(entry.timestamp).getTime(),
  }
}

function createPiMonoBranchSummaryMessage(entry: PiMonoJsonlGenericEntry): Record<string, unknown> {
  return {
    role: "branchSummary",
    summary: entry.summary,
    fromId: entry.fromId,
    timestamp: new Date(entry.timestamp).getTime(),
  }
}

function createPiMonoCompactionSummaryMessage(entry: PiMonoJsonlGenericEntry): Record<string, unknown> {
  return {
    role: "compactionSummary",
    summary: entry.summary,
    tokensBefore: entry.tokensBefore,
    timestamp: new Date(entry.timestamp).getTime(),
  }
}

function piMonoJsonlStorageSnapshotFromParts(input: {
  filePath: string
  header: PiMonoJsonlSessionHeader
  entries: PiMonoJsonlSessionEntry[]
  content: string
}): PiMonoJsonlStorageSnapshot {
  const branchGraph = buildPiMonoJsonlBranchGraphSnapshot(input.entries)
  return {
    metadata: piMonoJsonlHeaderToSessionMetadata(input.header, input.filePath),
    entries: branchGraph.entries,
    currentLeafId: branchGraph.currentLeafId,
    labelsById: branchGraph.labelsById,
    content: input.content,
  }
}

function piMonoJsonlHeaderToSessionMetadata(
  header: PiMonoJsonlSessionHeader,
  path: string,
): PiMonoJsonlSessionMetadata {
  const metadata: PiMonoJsonlSessionMetadata = {
    id: header.id,
    createdAt: header.timestamp,
    cwd: header.cwd,
    path,
  }
  if (header.parentSession !== undefined) metadata.parentSessionPath = header.parentSession
  return metadata
}

function piMonoJsonlSessionHeaderFromMetadata(metadata: PiMonoJsonlSessionMetadata): PiMonoJsonlSessionHeader {
  const headerInput: Parameters<typeof buildPiMonoJsonlSessionHeader>[0] = {
    id: metadata.id,
    timestamp: metadata.createdAt,
    cwd: metadata.cwd,
  }
  if (metadata.parentSessionPath !== undefined) headerInput.parentSession = metadata.parentSessionPath
  return buildPiMonoJsonlSessionHeader(headerInput)
}

function invalidPiMonoSession(filePath: string, message: string, cause?: Error): PiMonoSessionNativeError {
  return new PiMonoSessionNativeError("invalid_session", `Invalid JSONL session file ${filePath}: ${message}`, cause)
}

function invalidPiMonoSessionEntry(
  filePath: string,
  lineNumber: number,
  message: string,
  cause?: Error,
): PiMonoSessionNativeError {
  return new PiMonoSessionNativeError("invalid_entry", `Invalid JSONL session file ${filePath}: line ${lineNumber} ${message}`, cause)
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function piMonoSessionEntryMessage(entry: PiMonoJsonlSessionEntry): unknown {
  return entry.type === "message" ? (entry as PiMonoJsonlGenericEntry).message : undefined
}

function piMonoSessionManagerInfoFromHeader(
  header: PiMonoJsonlSessionHeader,
  filePath: string,
  entries: PiMonoJsonlSessionEntry[],
): Record<string, unknown> {
  const updatedAt = entries.at(-1)?.timestamp ?? header.timestamp
  return {
    id: header.id,
    title: piMonoSessionManagerSessionName(entries),
    cwd: header.cwd,
    path: filePath,
    created: Date.parse(header.timestamp),
    updated: Date.parse(updatedAt),
    metadata: {
      format: "jsonl-v3",
      parentSession: header.parentSession,
    },
  }
}

function piMonoSessionManagerSessionName(entries: PiMonoJsonlSessionEntry[]): string {
  let name = ""
  for (const entry of entries) {
    if (entry.type !== "session_info") continue
    name = stringValue((entry as PiMonoJsonlGenericEntry).name)?.trim() ?? ""
  }
  return name
}

function piMonoSessionManagerEntrySummary(entry: PiMonoJsonlSessionEntry): Record<string, unknown> {
  const generic = entry as PiMonoJsonlGenericEntry
  return {
    id: entry.id,
    type: entry.type,
    parentId: entry.parentId,
    timestamp: entry.timestamp,
    targetId: entry.type === "leaf" ? (entry as PiMonoJsonlLeafEntry).targetId : undefined,
    fromId: entry.type === "branch_summary" ? generic.fromId : undefined,
    messageRole: isRecord(generic.message) ? generic.message.role : undefined,
  }
}

function piMonoSessionManagerEventRecords(
  sessionID: string,
  entries: PiMonoJsonlSessionEntry[],
): Record<string, unknown>[] {
  return entries.map((entry) => ({
    type: `session.${entry.type}`,
    sessionID,
    timestamp: Date.parse(entry.timestamp),
    data: structuredClone(entry),
  }))
}

function piMonoSessionManagerDiffRecords(
  sessionID: string,
  before: PiMonoJsonlSessionEntry[],
  after: PiMonoJsonlSessionEntry[],
): Record<string, unknown>[] {
  const beforeIDs = new Set(before.map((entry) => entry.id))
  const records: Record<string, unknown>[] = after
    .filter((entry) => !beforeIDs.has(entry.id))
    .map((entry) => ({
      type: "session.entry.appended",
      sessionID,
      timestamp: Date.parse(entry.timestamp),
      entry: piMonoSessionManagerEntrySummary(entry),
    }))
  const beforeLeafId = buildPiMonoJsonlBranchGraphSnapshot(before).currentLeafId
  const afterLeafId = buildPiMonoJsonlBranchGraphSnapshot(after).currentLeafId
  if (beforeLeafId !== afterLeafId) {
    records.push({
      type: "session.leaf.changed",
      sessionID,
      timestamp: Date.parse(after.at(-1)?.timestamp ?? "1970-01-01T00:00:00.000Z"),
      from: beforeLeafId,
      to: afterLeafId,
    })
  }
  return records
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
