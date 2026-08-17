import { createHash } from "node:crypto"
import { resolve, sep } from "node:path"
import type { LegoMessagePart } from "@helix/contracts"

export type MessagePartProjectionProduct = "common" | "opencode" | "pi-mono" | "nanobot" | "hermes-agent"
export type SessionMessagePartReplayProduct = Exclude<MessagePartProjectionProduct, "common">
export type SessionMessagePartReplayAtomKey = "message-part-projector"
export type SessionMessagePartReplayStageID = "stream.project"
export type SessionMessagePartReplayVisibility = "observed" | "inferred"
export type SessionStorageRoundTripVisibility = "observed" | "inferred"
export type SessionProviderMetadataRoundTripVisibility = "observed" | "inferred"
export type SessionMessagePartReplayDirection = "common-to-native" | "native-to-common" | "round-trip"
export type SessionMessagePartReplayExactness = "exact" | "semantic" | "inferred" | "raw-only" | "irrecoverable"
export type SessionStorageRoundTripExactness = "exact" | "semantic" | "inferred" | "raw-only" | "irrecoverable"
export type SessionProviderMetadataRoundTripExactness = SessionStorageRoundTripExactness
export type OpenCodeSessionSourceRefID =
  | "session-service"
  | "message-v2"
  | "session-sql"
  | "session-projectors"
  | "session-projectors-next"
  | "local-session-runtime-projection"
  | "local-session-live-runtime-fixture"
export type OpenCodeSessionSourceMatrixBranchID =
  | "id-generator"
  | "store-sqlite-projection"
  | "projector-syncevent"
  | "projector-message-v2"
  | "branch-graph-fork-before-message"
  | "compaction-event"
  | "pagination-update-time-cursor"
  | "full-sqlite-session-roundtrip"
  | "live-syncevent-bus-runtime"
export type OpenCodeSessionSourceMatrixBranchStatus = "native-exact" | "partial" | "missing"
export type OpenCodeSessionSourceMatrixExactDiffStatus = "native-exact" | "pinned-upstream-source-exact" | "exact-diff-partial"
export type ProductSessionSourceMatrixProduct = "pi" | "nanobot" | "hermes"
export type ProductSessionSourceMatrixBranchID =
  | "id-generator"
  | "store-projection"
  | "projector"
  | "branch-graph"
  | "compaction-record"
  | "pagination-context"
  | "provider-metadata"
  | "live-session-runtime"
  | "exact-storage-roundtrip"
  | "exact-branch-side-effects"
export type ProductSessionSourceMatrixBranchStatus = "partial" | "missing"

export interface MessagePartProjection {
  atomID: string
  product: MessagePartProjectionProduct
  sourceType: string
  nativeType: string
  lossy: boolean
}

export interface OpenCodeSessionSourceRef {
  id: OpenCodeSessionSourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: string
}

export interface OpenCodeSessionSourceMatrixBranchAnchor {
  branchID: OpenCodeSessionSourceMatrixBranchID
  status: OpenCodeSessionSourceMatrixBranchStatus
  exactDiffStatus: OpenCodeSessionSourceMatrixExactDiffStatus
  nativeParityClaim: boolean
  sourceRefIDs: OpenCodeSessionSourceRefID[]
  sessionAtomIDs: string[]
  sessionPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
}

export interface OpenCodeSessionSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-session-source-matrix"
  fixtureID: "opencode-session:source-matrix"
  sourceRefs: OpenCodeSessionSourceRef[]
  branchAnchors: OpenCodeSessionSourceMatrixBranchAnchor[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  nativeExactBranchIDs: OpenCodeSessionSourceMatrixBranchID[]
  partialBranchIDs: OpenCodeSessionSourceMatrixBranchID[]
  missingBranchIDs: OpenCodeSessionSourceMatrixBranchID[]
  coveredSessionAtomIDs: string[]
  coveredSessionPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

const OPENCODE_SESSION_NATIVE_EXACT_EVIDENCE_REF = "conformance:opencode-session-native-exact-fixture"
const OPENCODE_SESSION_NATIVE_EXACT_REPLAY_REF = "session-native-exact:opencode"
const OPENCODE_SESSION_NATIVE_EXACT_FIXTURE_ID = "opencode-session:native-exact-fixture"

export type OpenCodeSessionRuntimeProjectionEvent =
  | {
    type: "sqlite.roundtrip"
    table: string
    operation: "read" | "write" | "project"
    rowKeys: string[]
    sessionID?: string
    messageID?: string
    sequence: number
  }
  | {
    type: "syncevent.bus"
    eventType: string
    sessionID?: string
    partKinds?: string[]
    sequence: number
  }

export interface OpenCodeSessionRuntimeProjection {
  schemaVersion: 1
  fixtureID: "opencode-session:runtime-projection"
  evidenceRef: "conformance:opencode-session-runtime-projection"
  coveredBranchIDs: Array<Extract<OpenCodeSessionSourceMatrixBranchID, "full-sqlite-session-roundtrip" | "live-syncevent-bus-runtime">>
  retainedFields: string[]
  lossyFields: string[]
  sqliteRoundTrip: Array<{ table: string; operation: "read" | "write" | "project"; rowKeys: string[]; sessionID: string | null; messageID: string | null; sequence: number }>
  syncEventRuntime: Array<{ eventType: string; sessionID: string | null; partKinds: string[]; sequence: number }>
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeSessionLiveRuntimeFixtureInput {
  cwd: string
  sessionID?: string
  parentSessionID?: string
  forkSessionID?: string
  userMessageID?: string
  assistantMessageID?: string
  textPartID?: string
  toolPartID?: string
  compactionPartID?: string
}

export interface OpenCodeSessionLiveRuntimeFixture {
  schemaVersion: 1
  fixtureID: "opencode-session:live-runtime-fixture"
  evidenceRef: "conformance:opencode-session-live-runtime-fixture"
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  exactDiffStatus: "live-runtime-partial"
  nativeParityClaim: false
  capturedBranchIDs: OpenCodeSessionSourceMatrixBranchID[]
  retainedFields: string[]
  lossyFields: string[]
  sessionReadback: {
    sessionID: string
    parentSessionID: string | null
    forkSessionID: string
    cwd: string
    sessionPath: string
    title: string
    rowKeys: string[]
  }
  messageReadback: {
    userMessageID: string
    assistantMessageID: string
    partIDs: {
      text: string
      tool: string
      compaction: string
    }
    roleOrder: string[]
    partKinds: string[]
    providerMetadataKeys: string[]
    messageRowKeys: string[]
    partRowKeys: string[]
  }
  sqliteRoundTrip: Array<{
    table: string
    operation: "read" | "write" | "project"
    rowKeys: string[]
    sessionID: string | null
    messageID: string | null
    sequence: number
  }>
  syncEventReadback: Array<{
    eventType: string
    sessionID: string | null
    messageID: string | null
    partKinds: string[]
    sequence: number
  }>
  branchReadback: {
    parentSessionID: string
    forkSessionID: string
    forkBeforeMessageID: string
    lineage: string[]
  }
  compactionReadback: {
    partID: string
    partKind: "compaction"
    summaryKey: string
    compactedMessageIDs: string[]
    eventType: string
  }
  paginationReadback: {
    cursorKind: "updated-at-message-id"
    cursorFields: string[]
    pageSize: number
    readbackMessageIDs: string[]
  }
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeSessionLiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeSessionLiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeSessionLiveRuntimeFixtureIssue[]
}

export interface ProductSessionSourceRef {
  id: string
  repo: "earendil-works/pi" | "HKUDS/nanobot" | "NousResearch/hermes-agent"
  ref: string
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11"
}

export interface ProductSessionSourceMatrixBranchAnchor {
  branchID: ProductSessionSourceMatrixBranchID
  status: ProductSessionSourceMatrixBranchStatus
  sourceRefIDs: string[]
  sessionAtomIDs: string[]
  sessionPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface ProductSessionSourceMatrixSnapshot {
  schemaVersion: 1
  product: ProductSessionSourceMatrixProduct
  upstreamRef: string
  pinnedRepo: ProductSessionSourceRef["repo"]
  pinnedRef: string
  evidenceRef: `conformance:${ProductSessionSourceMatrixProduct}-session-source-matrix`
  fixtureID: `${ProductSessionSourceMatrixProduct}-session:source-matrix`
  sourceRefs: ProductSessionSourceRef[]
  branchAnchors: ProductSessionSourceMatrixBranchAnchor[]
  partialBranchIDs: ProductSessionSourceMatrixBranchID[]
  missingBranchIDs: ProductSessionSourceMatrixBranchID[]
  coveredSessionAtomIDs: string[]
  coveredSessionPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface SessionMessagePartReplayScenario {
  scenarioID: string
  direction: SessionMessagePartReplayDirection
  sourcePartTypes: string[]
  nativePartTypes: string[]
  observedShape: Record<string, unknown>
  exactness: SessionMessagePartReplayExactness
  visibility: SessionMessagePartReplayVisibility
}

export interface SessionMessagePartReplayAtomSnapshot {
  key: SessionMessagePartReplayAtomKey
  atomID: string
  portID: "session.message-part-projector"
  flowStageID: SessionMessagePartReplayStageID
  storageRoundTripFingerprint?: string
  storageRoundTripFixtureID?: string
  providerMetadataRoundTripFingerprint?: string
  providerMetadataRoundTripFixtureID?: string
  nativeFixtureSource: string
  upstreamEvidenceRefs: string[]
  fixtureID: string
  scenarios: SessionMessagePartReplayScenario[]
  roundTripFields: string[]
  oneWayExactFields: string[]
  nativeOnlyFields: string[]
  inferredFields: string[]
  irrecoverableFields: string[]
  lossyFields: string[]
}

export interface SessionStorageRoundTripScenario {
  scenarioID: string
  storageSurface: string
  writeRecordTypes: string[]
  readbackRecordTypes: string[]
  observedShape: Record<string, unknown>
  exactness: SessionStorageRoundTripExactness
  visibility: SessionStorageRoundTripVisibility
}

export interface SessionStorageRoundTripSnapshot {
  schemaVersion: 1
  product: SessionMessagePartReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: SessionStorageRoundTripScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface SessionProviderMetadataRoundTripScenario {
  scenarioID: string
  storageSurface: string
  nativeMetadataRecords: string[]
  commonReadbackFields: string[]
  observedShape: Record<string, unknown>
  exactness: SessionProviderMetadataRoundTripExactness
  visibility: SessionProviderMetadataRoundTripVisibility
  lossiness: string[]
}

export interface SessionProviderMetadataRoundTripSnapshot {
  schemaVersion: 1
  product: SessionMessagePartReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: SessionProviderMetadataRoundTripScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface MessagePartProjectorProfileSnapshot {
  product: MessagePartProjectionProduct
  atomID: string
  nativeFixtureSource: MessagePartProjectorAtomDescriptor["nativeFixtureSource"]
  lossiness: MessagePartProjectorAtomDescriptor["lossiness"]
  nativeTypes: Record<string, string>
  lossyTypes: string[]
}

export interface SessionMessagePartReplaySnapshot {
  schemaVersion: 1
  product: SessionMessagePartReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureIDs: string[]
  profileFingerprint: string
  profile: MessagePartProjectorProfileSnapshot
  storageRoundTrip: SessionStorageRoundTripSnapshot
  storageRoundTripFingerprint: string
  providerMetadataRoundTrip: SessionProviderMetadataRoundTripSnapshot
  providerMetadataRoundTripFingerprint: string
  atoms: SessionMessagePartReplayAtomSnapshot[]
  coveredKeys: SessionMessagePartReplayAtomKey[]
  knownGaps: string[]
  fingerprint: string
}

export type SessionStorageRoundTripGateProduct = SessionMessagePartReplayProduct
export type SessionStorageRoundTripGateDimension =
  | "message-part-schema"
  | "store-readback"
  | "branch-graph"
  | "compaction-record"
  | "pagination-context"
  | "provider-metadata"

export interface SessionStorageRoundTripGateCase {
  product: SessionStorageRoundTripGateProduct
  upstreamRef: string
  evidenceRef: "conformance:session-storage-round-trip-gate"
  fixtureID: string
  messagePartSchema: string[]
  storeReadback: string[]
  branchGraph: string[]
  compactionRecord: string[]
  paginationContext: string[]
  providerMetadata: string[]
  sourceAnchors: string[]
  sessionAtomIDs: string[]
  sessionPortIDs: string[]
  fixtureIDs: string[]
  readbackRisk: "source-anchored-partial" | "lossy-field-drop" | "common-transcript-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface SessionStorageRoundTripGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:session-storage-round-trip-gate"
  fixtureID: "session:storage-round-trip-gate"
  products: SessionStorageRoundTripGateProduct[]
  comparisonDimensions: SessionStorageRoundTripGateDimension[]
  cases: SessionStorageRoundTripGateCase[]
  fingerprint: string
}

export interface SessionStorageRoundTripGateIssue {
  id: string
  product: SessionStorageRoundTripGateProduct
  dimension: SessionStorageRoundTripGateDimension
  message: string
}

export interface SessionStorageRoundTripGateVerification {
  ok: boolean
  issues: SessionStorageRoundTripGateIssue[]
}

export type SessionStorageExactDiffBlockerProduct = SessionStorageRoundTripGateProduct
export type SessionStorageExactDiffBlockerDimension = SessionStorageRoundTripGateDimension

export interface SessionStorageExactDiffBlockerCase {
  product: SessionStorageExactDiffBlockerProduct
  upstreamRef: string
  evidenceRef: "conformance:session-storage-exact-diff-blocker-gate"
  fixtureID: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  messagePartSchema: string[]
  storeReadback: string[]
  branchGraph: string[]
  compactionRecord: string[]
  paginationContext: string[]
  providerMetadata: string[]
  sourceAnchors: string[]
  sessionAtomIDs: string[]
  sessionPortIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "lossy-field-drop" | "common-transcript-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface SessionStorageExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:session-storage-exact-diff-blocker-gate"
  fixtureID: "session:storage-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: SessionStorageExactDiffBlockerProduct[]
  comparisonDimensions: SessionStorageExactDiffBlockerDimension[]
  cases: SessionStorageExactDiffBlockerCase[]
  fingerprint: string
}

export interface SessionStorageExactDiffBlockerIssue {
  id: string
  product: SessionStorageExactDiffBlockerProduct
  dimension: SessionStorageExactDiffBlockerDimension
  message: string
}

export interface SessionStorageExactDiffBlockerVerification {
  ok: boolean
  issues: SessionStorageExactDiffBlockerIssue[]
}

export type SessionStoragePinnedReadbackProduct = SessionStorageRoundTripGateProduct
export type SessionStoragePinnedReadbackDimension = SessionStorageRoundTripGateDimension

export interface SessionStoragePinnedReadbackRecord {
  recordID: string
  storageKey: string
  messageID: string
  partID: string
  partType: string
  partText: string | null
  toolCallID: string | null
  branchID: string
  parentBranchID: string | null
  compactionID: string | null
  paginationCursor: string
  providerMetadata: Record<string, string>
  sequence: number
}

export interface SessionStoragePinnedReadbackCase {
  product: SessionStoragePinnedReadbackProduct
  upstreamRef: string
  fixtureID: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  upstreamWrites: SessionStoragePinnedReadbackRecord[]
  productReadback: SessionStoragePinnedReadbackRecord[]
  assembledProjection: SessionStoragePinnedReadbackRecord[]
  sourceAnchors: string[]
  fixtureIDs: string[]
  exactDiffRisk: "pinned-readback-needs-live-storage" | "helix-only"
  knownLossiness: string[]
}

export interface SessionStoragePinnedReadbackSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:session-storage-pinned-readback-gate"
  fixtureID: "session:storage-pinned-readback-gate"
  exactDiffStatus: "exact-diff-partial"
  products: SessionStoragePinnedReadbackProduct[]
  comparisonDimensions: SessionStoragePinnedReadbackDimension[]
  cases: SessionStoragePinnedReadbackCase[]
  fingerprint: string
}

export interface SessionStoragePinnedReadbackIssue {
  id: string
  product: SessionStoragePinnedReadbackProduct
  dimension: SessionStoragePinnedReadbackDimension
  message: string
}

export interface SessionStoragePinnedReadbackVerification {
  ok: boolean
  issues: SessionStoragePinnedReadbackIssue[]
}

export interface MessagePartProjectorAtomDescriptor {
  id: string
  port: "session.message-part-projector"
  product: MessagePartProjectionProduct
  lossiness: "none" | "semantic" | "event-lifecycle"
  nativeFixtureSource: "none" | "opencode-native" | "pi-native" | "nanobot-native" | "hermes-native"
  replay: SessionMessagePartReplayAtomSnapshot & {
    supportedSourceTypes: string[]
    nativeTargetTypes: string[]
    lossyFields: string[]
  }
}

interface MessagePartProjectorProfile {
  product: MessagePartProjectionProduct
  atomID: string
  nativeFixtureSource: MessagePartProjectorAtomDescriptor["nativeFixtureSource"]
  lossiness: MessagePartProjectorAtomDescriptor["lossiness"]
  nativeTypes: Partial<Record<string, string>>
  lossyTypes: Set<string>
}

export const sessionMessagePartReplayProducts: SessionMessagePartReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
export const sessionMessagePartReplayAtomKeys: SessionMessagePartReplayAtomKey[] = ["message-part-projector"]

const OPENCODE_SESSION_SOURCE_REFS: OpenCodeSessionSourceRef[] = [
  {
    id: "session-service",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/session.ts",
    symbols: ["Info", "CreateInput", "ForkInput", "Event", "fromRow", "toRow", "plan", "getUsage", "Session"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "message-v2",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/message-v2.ts",
    symbols: ["Info", "Part", "ToolPart", "TextPart", "CompactionPart", "StepStartPart", "StepFinishPart", "Event", "cursor", "page", "stream", "parts", "MessageV2"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-sql",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/session.sql.ts",
    symbols: ["SessionTable", "MessageTable", "PartTable", "TodoTable", "SessionMessageTable", "PermissionTable"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-projectors",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/projectors.ts",
    symbols: ["DeepPartial", "foreign", "usage", "applyUsage", "grab", "toPartialRow"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-projectors-next",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/projectors-next.ts",
    symbols: ["encodeDateTimes", "encodeMessageData", "sqlite", "update"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "local-session-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-session/src/message-part-projector.ts",
    symbols: ["projectOpenCodeSessionRuntimeProjection", "OpenCodeSessionRuntimeProjection"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-session-live-runtime-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-session/src/message-part-projector.ts",
    symbols: ["captureOpenCodeSessionLiveRuntimeFixture", "verifyOpenCodeSessionLiveRuntimeFixture"],
    evidence: "local-source:2026-06-12",
  },
]

export function projectOpenCodeSessionRuntimeProjection(
  events: OpenCodeSessionRuntimeProjectionEvent[],
): OpenCodeSessionRuntimeProjection {
  const sqliteRoundTrip = events
    .filter((event): event is Extract<OpenCodeSessionRuntimeProjectionEvent, { type: "sqlite.roundtrip" }> => event.type === "sqlite.roundtrip")
    .map((event) => ({
      table: event.table,
      operation: event.operation,
      rowKeys: uniqueStrings(event.rowKeys),
      sessionID: typeof event.sessionID === "string" && event.sessionID.length > 0 ? event.sessionID : null,
      messageID: typeof event.messageID === "string" && event.messageID.length > 0 ? event.messageID : null,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.table.localeCompare(right.table) || left.operation.localeCompare(right.operation))

  const syncEventRuntime = events
    .filter((event): event is Extract<OpenCodeSessionRuntimeProjectionEvent, { type: "syncevent.bus" }> => event.type === "syncevent.bus")
    .map((event) => ({
      eventType: event.eventType,
      sessionID: typeof event.sessionID === "string" && event.sessionID.length > 0 ? event.sessionID : null,
      partKinds: uniqueStrings(event.partKinds ?? []),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.eventType.localeCompare(right.eventType))

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-session:runtime-projection" as const,
    evidenceRef: "conformance:opencode-session-runtime-projection" as const,
    coveredBranchIDs: [
      "full-sqlite-session-roundtrip",
      "live-syncevent-bus-runtime",
    ] as OpenCodeSessionRuntimeProjection["coveredBranchIDs"],
    retainedFields: [
      "table",
      "operation",
      "rowKeys",
      "sessionID",
      "messageID",
      "sequence",
      "eventType",
      "partKinds",
    ],
    lossyFields: [
      "native sqlite transaction boundaries",
      "raw sqlite row values/private provider metadata",
      "storage fsync/write ordering",
      "branch fork transaction side effects",
      "native SyncEvent subscription lifecycle",
      "wall-clock SyncEvent dispatch timing",
    ],
    sqliteRoundTrip,
    syncEventRuntime,
    knownGaps: [
      "opencode-full-sqlite-session-roundtrip-not-proven",
      "opencode-live-syncevent-runtime-not-spawned",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeSessionLiveRuntimeFixture(
  input: OpenCodeSessionLiveRuntimeFixtureInput,
): OpenCodeSessionLiveRuntimeFixture {
  const cwd = resolve(input.cwd)
  const sessionID = input.sessionID ?? "ses_live_session_01"
  const parentSessionID = input.parentSessionID ?? "ses_live_parent_01"
  const forkSessionID = input.forkSessionID ?? "ses_live_fork_01"
  const userMessageID = input.userMessageID ?? "msg_live_user_01"
  const assistantMessageID = input.assistantMessageID ?? "msg_live_assistant_01"
  const textPartID = input.textPartID ?? "prt_live_text_01"
  const toolPartID = input.toolPartID ?? "prt_live_tool_01"
  const compactionPartID = input.compactionPartID ?? "prt_live_compaction_01"
  const pathInput = { cwd }
  const sessionPath = resolve(cwd, ".opencode", "session", sessionID)
  const sqliteRoundTrip: OpenCodeSessionLiveRuntimeFixture["sqliteRoundTrip"] = [
    {
      table: "session",
      operation: "write",
      rowKeys: ["cwd", "id", "parentID", "timeCreated", "timeUpdated", "title"],
      sessionID,
      messageID: null,
      sequence: 1,
    },
    {
      table: "message",
      operation: "write",
      rowKeys: ["id", "modelID", "providerID", "role", "sessionID", "timeCreated", "timeUpdated"],
      sessionID,
      messageID: userMessageID,
      sequence: 2,
    },
    {
      table: "part",
      operation: "write",
      rowKeys: ["data", "id", "messageID", "sessionID", "timeCreated", "type"],
      sessionID,
      messageID: assistantMessageID,
      sequence: 3,
    },
    {
      table: "session_message",
      operation: "write",
      rowKeys: ["idx", "messageID", "sessionID"],
      sessionID,
      messageID: assistantMessageID,
      sequence: 4,
    },
    {
      table: "session",
      operation: "read",
      rowKeys: ["cwd", "id", "parentID", "timeCreated", "timeUpdated", "title"],
      sessionID,
      messageID: null,
      sequence: 5,
    },
    {
      table: "message",
      operation: "read",
      rowKeys: ["id", "modelID", "providerID", "role", "sessionID", "timeCreated", "timeUpdated"],
      sessionID,
      messageID: assistantMessageID,
      sequence: 6,
    },
    {
      table: "part",
      operation: "read",
      rowKeys: ["data", "id", "messageID", "sessionID", "timeCreated", "type"],
      sessionID,
      messageID: assistantMessageID,
      sequence: 7,
    },
    {
      table: "session_message",
      operation: "read",
      rowKeys: ["idx", "messageID", "sessionID"],
      sessionID,
      messageID: assistantMessageID,
      sequence: 8,
    },
  ]
  const syncEventReadback: OpenCodeSessionLiveRuntimeFixture["syncEventReadback"] = [
    { eventType: "session.created", sessionID, messageID: null, partKinds: [], sequence: 9 },
    { eventType: "message.updated", sessionID, messageID: userMessageID, partKinds: ["text"], sequence: 10 },
    { eventType: "part.updated", sessionID, messageID: assistantMessageID, partKinds: ["text", "tool"], sequence: 11 },
    { eventType: "session.forked", sessionID: forkSessionID, messageID: assistantMessageID, partKinds: [], sequence: 12 },
    { eventType: "session.compacted", sessionID, messageID: assistantMessageID, partKinds: ["compaction"], sequence: 13 },
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-session:live-runtime-fixture" as const,
    evidenceRef: "conformance:opencode-session-live-runtime-fixture" as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    nativeParityClaim: false as const,
    capturedBranchIDs: [
      "id-generator",
      "store-sqlite-projection",
      "projector-syncevent",
      "projector-message-v2",
      "branch-graph-fork-before-message",
      "compaction-event",
      "pagination-update-time-cursor",
      "full-sqlite-session-roundtrip",
      "live-syncevent-bus-runtime",
    ] as OpenCodeSessionSourceMatrixBranchID[],
    retainedFields: [
      "session/message/part id readback",
      "normalized workspace/session path",
      "sqlite table and row key coverage",
      "MessageV2 part kind order",
      "provider metadata key readback",
      "SyncEvent event type and part kind readback",
      "fork-before-message branch boundary",
      "compaction part marker",
      "updated-at/message-id pagination cursor",
    ],
    lossyFields: [
      "native sqlite transaction boundaries",
      "raw sqlite row values/private provider metadata",
      "storage fsync/write ordering",
      "branch fork transaction side effects",
      "native SyncEvent subscription lifecycle",
      "wall-clock SyncEvent dispatch timing",
    ],
    sessionReadback: {
      sessionID,
      parentSessionID,
      forkSessionID,
      cwd: normalizeOpenCodeSessionLivePath(cwd, pathInput),
      sessionPath: normalizeOpenCodeSessionLivePath(sessionPath, pathInput),
      title: "New Session",
      rowKeys: ["cwd", "id", "parentID", "timeCreated", "timeUpdated", "title"],
    },
    messageReadback: {
      userMessageID,
      assistantMessageID,
      partIDs: {
        text: textPartID,
        tool: toolPartID,
        compaction: compactionPartID,
      },
      roleOrder: ["user", "assistant"],
      partKinds: ["text", "tool", "compaction"],
      providerMetadataKeys: ["finishReason", "modelID", "providerID", "usage"],
      messageRowKeys: ["id", "modelID", "providerID", "role", "sessionID", "timeCreated", "timeUpdated"],
      partRowKeys: ["data", "id", "messageID", "sessionID", "timeCreated", "type"],
    },
    sqliteRoundTrip,
    syncEventReadback,
    branchReadback: {
      parentSessionID,
      forkSessionID,
      forkBeforeMessageID: assistantMessageID,
      lineage: [parentSessionID, sessionID, forkSessionID],
    },
    compactionReadback: {
      partID: compactionPartID,
      partKind: "compaction" as const,
      summaryKey: "summary",
      compactedMessageIDs: [userMessageID, assistantMessageID],
      eventType: "session.compacted",
    },
    paginationReadback: {
      cursorKind: "updated-at-message-id" as const,
      cursorFields: ["messageID", "timeUpdated"],
      pageSize: 2,
      readbackMessageIDs: [assistantMessageID, userMessageID],
    },
    knownGaps: [
      "opencode-upstream-native-session-runtime-not-spawned",
      "opencode-full-sqlite-session-roundtrip-not-proven",
      "opencode-live-syncevent-runtime-not-spawned",
      "opencode-session-transaction-boundaries-not-upstream-exact",
      "opencode-session-provider-private-metadata-not-upstream-exact",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeSessionLiveRuntimeFixture(
  fixture: OpenCodeSessionLiveRuntimeFixture,
): OpenCodeSessionLiveRuntimeFixtureVerification {
  const issues: OpenCodeSessionLiveRuntimeFixtureIssue[] = []
  if (fixture.fixtureID !== "opencode-session:live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-session-live-runtime-fixture") {
    issues.push({
      id: "opencode-session-live-runtime-fixture.identity",
      message: "OpenCode session live runtime fixture has an unexpected fixture or evidence ID.",
    })
  }
  if (fixture.exactDiffStatus !== "live-runtime-partial" || fixture.nativeParityClaim !== false) {
    issues.push({
      id: "opencode-session-live-runtime-fixture.native-claim",
      message: "OpenCode session live runtime fixture must stay partial and cannot claim native parity.",
    })
  }
  for (const branchID of ["id-generator", "store-sqlite-projection", "projector-syncevent", "projector-message-v2", "branch-graph-fork-before-message", "compaction-event", "pagination-update-time-cursor", "full-sqlite-session-roundtrip", "live-syncevent-bus-runtime"] as const) {
    if (!fixture.capturedBranchIDs.includes(branchID)) {
      issues.push({
        id: `opencode-session-live-runtime-fixture.missing-${branchID}`,
        message: `OpenCode session live runtime fixture no longer captures ${branchID}.`,
      })
    }
  }
  for (const table of ["session", "message", "part"] as const) {
    const hasWrite = fixture.sqliteRoundTrip.some((row) => row.table === table && row.operation === "write")
    const hasRead = fixture.sqliteRoundTrip.some((row) => row.table === table && row.operation === "read")
    if (!hasWrite || !hasRead) {
      issues.push({
        id: `opencode-session-live-runtime-fixture.sqlite-${table}`,
        message: `OpenCode session live runtime fixture no longer captures ${table} sqlite write/readback coverage.`,
      })
    }
  }
  for (const partKind of ["text", "tool", "compaction"] as const) {
    if (!fixture.messageReadback.partKinds.includes(partKind) || fixture.messageReadback.partIDs[partKind].length === 0) {
      issues.push({
        id: `opencode-session-live-runtime-fixture.message-v2-${partKind}`,
        message: `OpenCode session live runtime fixture no longer captures MessageV2 ${partKind} parts.`,
      })
    }
  }
  for (const key of ["providerID", "modelID", "usage", "finishReason"] as const) {
    if (!fixture.messageReadback.providerMetadataKeys.includes(key)) {
      issues.push({
        id: `opencode-session-live-runtime-fixture.provider-metadata-${key}`,
        message: `OpenCode session live runtime fixture no longer captures provider metadata key ${key}.`,
      })
    }
  }
  for (const eventType of ["session.created", "message.updated", "part.updated", "session.forked", "session.compacted"] as const) {
    if (!fixture.syncEventReadback.some((event) => event.eventType === eventType)) {
      issues.push({
        id: `opencode-session-live-runtime-fixture.syncevent-${eventType}`,
        message: `OpenCode session live runtime fixture no longer captures ${eventType}.`,
      })
    }
  }
  if (
    fixture.branchReadback.parentSessionID.length === 0 ||
    fixture.branchReadback.forkSessionID.length === 0 ||
    fixture.branchReadback.forkBeforeMessageID !== fixture.messageReadback.assistantMessageID ||
    fixture.branchReadback.lineage.length < 3
  ) {
    issues.push({
      id: "opencode-session-live-runtime-fixture.branch-readback",
      message: "OpenCode session live runtime fixture no longer captures fork-before-message branch readback.",
    })
  }
  if (
    fixture.compactionReadback.partKind !== "compaction" ||
    fixture.compactionReadback.eventType !== "session.compacted" ||
    fixture.compactionReadback.compactedMessageIDs.length < 2
  ) {
    issues.push({
      id: "opencode-session-live-runtime-fixture.compaction-readback",
      message: "OpenCode session live runtime fixture no longer captures compaction part readback.",
    })
  }
  if (
    fixture.paginationReadback.cursorKind !== "updated-at-message-id" ||
    !fixture.paginationReadback.cursorFields.includes("timeUpdated") ||
    !fixture.paginationReadback.cursorFields.includes("messageID") ||
    fixture.paginationReadback.readbackMessageIDs.length < 2
  ) {
    issues.push({
      id: "opencode-session-live-runtime-fixture.pagination-readback",
      message: "OpenCode session live runtime fixture no longer captures updated-at/message-id pagination readback.",
    })
  }
  if (
    !fixture.knownGaps.includes("opencode-upstream-native-session-runtime-not-spawned") ||
    !fixture.knownGaps.includes("opencode-session-transaction-boundaries-not-upstream-exact") ||
    !fixture.knownGaps.includes("opencode-live-syncevent-runtime-not-spawned")
  ) {
    issues.push({
      id: "opencode-session-live-runtime-fixture.native-gaps",
      message: "OpenCode session live runtime fixture lost the upstream native exact-diff blockers.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

const PI_SESSION_SOURCE_REFS: ProductSessionSourceRef[] = [
  {
    id: "session-manager",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/core/session-manager.ts",
    symbols: ["SessionManager", "createSession", "loadSession", "appendMessage", "saveSession", "forkSession"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-format",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/docs/session-format.md",
    symbols: ["jsonl-v3", "message", "tool_execution_start", "tool_execution_end", "branch_summary"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "active-leaf",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/core/session-tree.ts",
    symbols: ["SessionTree", "activeLeaf", "leafTree", "switchLeaf", "branchSummary"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "context-selector",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/core/context-selector.ts",
    symbols: ["selectContext", "activePath", "readRecentMessages", "maxContextTokens"],
    evidence: "github-tree:2026-06-11",
  },
]

const NANOBOT_SESSION_SOURCE_REFS: ProductSessionSourceRef[] = [
  {
    id: "session-manager",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/session/manager.py",
    symbols: ["Session", "SessionManager", "add_message", "get_history", "save", "flush_all", "list_sessions"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "goal-state",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/session/goal_state.py",
    symbols: ["goal_state_raw", "sustained_goal_active", "parse_goal_state", "goal_state_runtime_lines", "goal_state_ws_blob"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-paths",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/config/paths.py",
    symbols: ["get_data_dir", "get_workspace_path", "get_legacy_sessions_dir", "get_media_dir", "get_logs_dir"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "attachments",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/utils/session_attachments.py",
    symbols: ["stage_media_paths_for_session_replay", "merge_turn_media_into_last_assistant"],
    evidence: "github-tree:2026-06-11",
  },
]

const HERMES_SESSION_SOURCE_REFS: ProductSessionSourceRef[] = [
  {
    id: "acp-session",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "acp_adapter/session.py",
    symbols: ["SessionState", "SessionManager", "create_session", "get_session", "fork_session", "list_sessions", "save_session", "_persist", "_restore"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "trajectory",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/trajectory.py",
    symbols: ["convert_scratchpad_to_think", "has_incomplete_scratchpad", "save_trajectory", "Trajectory"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "runtime-helpers",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/agent_runtime_helpers.py",
    symbols: ["convert_to_trajectory_format", "sanitize_tool_call_arguments"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-storage",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/session_storage.py",
    symbols: ["SessionStorage", "SQLiteSessionStore", "save", "restore", "search"],
    evidence: "github-tree:2026-06-11",
  },
]

function openCodeSessionSourceBranchAnchor(
  input: Omit<OpenCodeSessionSourceMatrixBranchAnchor, "exactDiffStatus" | "nativeParityClaim" | "nativeEvidenceRefs" | "fixtureIDs"> &
    Partial<Pick<OpenCodeSessionSourceMatrixBranchAnchor, "exactDiffStatus" | "nativeParityClaim" | "nativeEvidenceRefs" | "fixtureIDs">>,
): OpenCodeSessionSourceMatrixBranchAnchor {
  return {
    ...input,
    exactDiffStatus: input.exactDiffStatus ?? (input.status === "native-exact" ? "native-exact" : "exact-diff-partial"),
    nativeParityClaim: input.nativeParityClaim ?? (input.status === "native-exact"),
    nativeEvidenceRefs: input.nativeEvidenceRefs ?? [],
    fixtureIDs: input.fixtureIDs ?? [],
  }
}

export function buildOpenCodeSessionSourceMatrixSnapshot(): OpenCodeSessionSourceMatrixSnapshot {
  const branchAnchors: OpenCodeSessionSourceMatrixBranchAnchor[] = [
    openCodeSessionSourceBranchAnchor({
      branchID: "id-generator",
      status: "native-exact",
      exactDiffStatus: "pinned-upstream-source-exact",
      sourceRefIDs: ["session-service", "local-session-live-runtime-fixture"],
      sessionAtomIDs: ["opencode.session.id-generator"],
      sessionPortIDs: ["session.id-generator"],
      localEvidenceRefs: ["session-atoms:id-generator", "conformance:opencode-session-id-generator-native-exact-fixture"],
      localMarkers: ["sessionPath", "CreateInput", "opencode-session-id-prefix", "live-session-id-readback"],
      nativeEvidenceRefs: ["conformance:opencode-session-id-generator-native-exact-fixture"],
      fixtureIDs: ["opencode-session-id-generator:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeSessionSourceBranchAnchor({
      branchID: "store-sqlite-projection",
      status: "native-exact",
      sourceRefIDs: ["session-service", "session-sql", "session-projectors-next", "local-session-live-runtime-fixture"],
      sessionAtomIDs: ["opencode.session.store.sqlite-projection"],
      sessionPortIDs: ["session.store"],
      localEvidenceRefs: ["session-atoms:store", "conformance:opencode-session-sqlite-projection-native-exact-fixture", "session-sqlite-projection-native-exact:opencode"],
      localMarkers: ["SessionTable", "MessageTable", "PartTable", "sqlite", "projection-store", "sqlite-write-readback:projected"],
      nativeEvidenceRefs: ["conformance:opencode-session-sqlite-projection-native-exact-fixture", "session-sqlite-projection-native-exact:opencode"],
      fixtureIDs: ["opencode-session-sqlite-projection:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeSessionSourceBranchAnchor({
      branchID: "projector-syncevent",
      status: "native-exact",
      sourceRefIDs: ["session-service", "message-v2", "session-projectors", "local-session-live-runtime-fixture"],
      sessionAtomIDs: ["opencode.session.projector.syncevent"],
      sessionPortIDs: ["session.projector"],
      localEvidenceRefs: ["session-atoms:projector", "conformance:opencode-session-syncevent-projector-native-exact-fixture", "session-syncevent-projector-native-exact:opencode"],
      localMarkers: ["Event", "stream", "toPartialRow", "SyncEvent", "syncevent-readback:projected"],
      nativeEvidenceRefs: ["conformance:opencode-session-syncevent-projector-native-exact-fixture", "session-syncevent-projector-native-exact:opencode"],
      fixtureIDs: ["opencode-session-syncevent-projector:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeSessionSourceBranchAnchor({
      branchID: "projector-message-v2",
      status: "native-exact",
      sourceRefIDs: ["message-v2", "session-sql", "local-session-live-runtime-fixture"],
      sessionAtomIDs: ["opencode.session.projector.message-v2"],
      sessionPortIDs: ["session.projector"],
      localEvidenceRefs: ["conformance:opencode-session-message-v2-projector-native-exact-fixture", "session-message-v2-projector-native-exact:opencode"],
      localMarkers: ["MessageV2", "WithParts", "ToolPart", "PartTable", "message-v2-part-readback"],
      nativeEvidenceRefs: ["conformance:opencode-session-message-v2-projector-native-exact-fixture", "session-message-v2-projector-native-exact:opencode"],
      fixtureIDs: ["opencode-session-message-v2-projector:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeSessionSourceBranchAnchor({
      branchID: "branch-graph-fork-before-message",
      status: "native-exact",
      sourceRefIDs: ["session-service", "message-v2", "session-sql", "local-session-live-runtime-fixture"],
      sessionAtomIDs: ["opencode.session.branch-graph.fork-before-message"],
      sessionPortIDs: ["session.branch-graph"],
      localEvidenceRefs: ["session-atoms:branch-graph", "conformance:opencode-session-branch-graph-native-exact-fixture", "session-branch-graph-native-exact:opencode"],
      localMarkers: ["ForkInput", "fork-before-message", "SessionMessageTable", "branch-lineage", "fork-before-message-readback"],
      nativeEvidenceRefs: ["conformance:opencode-session-branch-graph-native-exact-fixture", "session-branch-graph-native-exact:opencode"],
      fixtureIDs: ["opencode-session-branch-graph:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeSessionSourceBranchAnchor({
      branchID: "compaction-event",
      status: "native-exact",
      sourceRefIDs: ["session-service", "message-v2", "local-session-live-runtime-fixture"],
      sessionAtomIDs: ["opencode.session.compaction-event"],
      sessionPortIDs: ["session.compaction-records"],
      localEvidenceRefs: ["conformance:opencode-session-compaction-event-native-exact-fixture", "session-compaction-event-native-exact:opencode"],
      localMarkers: ["CompactionPart", "filterCompacted", "compaction-event", "compaction-part-readback"],
      nativeEvidenceRefs: ["conformance:opencode-session-compaction-event-native-exact-fixture", "session-compaction-event-native-exact:opencode"],
      fixtureIDs: ["opencode-session-compaction-event:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeSessionSourceBranchAnchor({
      branchID: "pagination-update-time-cursor",
      status: "native-exact",
      sourceRefIDs: ["session-service", "message-v2", "local-session-live-runtime-fixture"],
      sessionAtomIDs: ["opencode.session.pagination.update-time-cursor"],
      sessionPortIDs: ["session.pagination"],
      localEvidenceRefs: ["session-atoms:pagination", "conformance:opencode-session-pagination-native-exact-fixture", "session-pagination-native-exact:opencode"],
      localMarkers: ["cursor", "page", "updated", "message-v2-pagination", "updated-at-message-id-readback"],
      nativeEvidenceRefs: ["conformance:opencode-session-pagination-native-exact-fixture", "session-pagination-native-exact:opencode"],
      fixtureIDs: ["opencode-session-pagination:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeSessionSourceBranchAnchor({
      branchID: "full-sqlite-session-roundtrip",
      status: "partial",
      sourceRefIDs: ["session-service", "message-v2", "session-sql", "session-projectors-next", "local-session-runtime-projection", "local-session-live-runtime-fixture"],
      sessionAtomIDs: [
        "opencode.session.store.sqlite-projection",
        "opencode.session.projector.message-v2",
        "opencode.session.branch-graph.fork-before-message",
      ],
      sessionPortIDs: ["session.store", "session.projector", "session.branch-graph"],
      localEvidenceRefs: ["opencode-session:source-matrix", "opencode-session:runtime-projection", "opencode-session:live-runtime-fixture", "opencode-session-message-part:storage-roundtrip"],
      localMarkers: ["sqlite-roundtrip:projected", "sqlite-roundtrip:partial", "transaction-boundary:not-exact", "sqlite-live-readback:partial"],
      knownGaps: ["opencode-full-sqlite-session-roundtrip-not-proven", "opencode-session-transaction-boundaries-not-upstream-exact"],
    }),
    openCodeSessionSourceBranchAnchor({
      branchID: "live-syncevent-bus-runtime",
      status: "partial",
      sourceRefIDs: ["session-service", "message-v2", "session-projectors", "local-session-runtime-projection", "local-session-live-runtime-fixture"],
      sessionAtomIDs: ["opencode.session.projector.syncevent", "opencode.session.compaction-event"],
      sessionPortIDs: ["session.projector", "session.compaction-records"],
      localEvidenceRefs: ["opencode-session:source-matrix", "opencode-session:runtime-projection", "opencode-session:live-runtime-fixture"],
      localMarkers: ["syncevent-bus:projected", "bus-runtime:partial", "subscription-lifecycle:not-replayed", "syncevent-live-readback:partial"],
      knownGaps: ["opencode-live-syncevent-runtime-not-spawned", "opencode-upstream-native-session-runtime-not-spawned"],
    }),
  ]
  const nativeEvidenceRefs = uniqueStrings([
    OPENCODE_SESSION_NATIVE_EXACT_EVIDENCE_REF,
    OPENCODE_SESSION_NATIVE_EXACT_REPLAY_REF,
    ...branchAnchors.flatMap((anchor) => anchor.nativeEvidenceRefs),
  ])
  const fixtureIDs = uniqueStrings([
    OPENCODE_SESSION_NATIVE_EXACT_FIXTURE_ID,
    ...branchAnchors.flatMap((anchor) => anchor.fixtureIDs),
  ])
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-session-source-matrix" as const,
    fixtureID: "opencode-session:source-matrix" as const,
    sourceRefs: OPENCODE_SESSION_SOURCE_REFS,
    branchAnchors,
    nativeEvidenceRefs,
    fixtureIDs,
    nativeExactBranchIDs: branchAnchors.filter((anchor) => anchor.status === "native-exact").map((anchor) => anchor.branchID),
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredSessionAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.sessionAtomIDs)),
    coveredSessionPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.sessionPortIDs)),
    knownGaps: uniqueStrings([
      "opencode-session-source-matrix-covered-by-partial-fixture",
      "opencode-session-live-runtime-fixture-partial-native-gap",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildPiSessionSourceMatrixSnapshot(): ProductSessionSourceMatrixSnapshot {
  return buildProductSessionSourceMatrixSnapshot({
    product: "pi",
    pinnedRepo: "earendil-works/pi",
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    sourceRefs: PI_SESSION_SOURCE_REFS,
    branches: [
      productSessionBranch({
        branchID: "id-generator",
        status: "partial",
        sourceRefIDs: ["session-manager", "session-format"],
        sessionAtomIDs: ["pi.session.id-generator"],
        sessionPortIDs: ["session.id-generator"],
        localEvidenceRefs: ["session-atoms:id-generator", "pi-session-message-part:storage-roundtrip"],
        localMarkers: ["jsonl-v3", "session id bridge", "deterministic uuid fallback"],
        knownGaps: ["pi-session-id-runtime-entropy-not-replayed"],
      }),
      productSessionBranch({
        branchID: "store-projection",
        status: "partial",
        sourceRefIDs: ["session-manager", "session-format", "active-leaf"],
        sessionAtomIDs: ["pi.session.store.jsonl-v3", "pi.session.store.jsonl-v3-migrator"],
        sessionPortIDs: ["session.store"],
        localEvidenceRefs: ["pi-session-message-part:storage-roundtrip"],
        localMarkers: ["jsonl-v3-session-tree", "message_update", "tool_execution_start", "tool_execution_end"],
        knownGaps: ["pi-jsonl-v3-write-clock-not-live-replayed"],
      }),
      productSessionBranch({
        branchID: "projector",
        status: "partial",
        sourceRefIDs: ["session-format", "session-manager"],
        sessionAtomIDs: ["pi.session.projector.jsonl", "pi.session.projector.jsonl-v3"],
        sessionPortIDs: ["session.projector"],
        localEvidenceRefs: ["pi-session-message-part:message-part-projector", "pi-session-message-part:provider-metadata-roundtrip"],
        localMarkers: ["jsonl-v3.message_read", "message_update", "tool execution projection"],
        knownGaps: ["pi-jsonl-v3-private-provider-metadata-not-replayed"],
      }),
      productSessionBranch({
        branchID: "branch-graph",
        status: "partial",
        sourceRefIDs: ["active-leaf", "session-manager"],
        sessionAtomIDs: ["pi.session.branch-graph.active-leaf", "pi.session.branch-graph.leaf-tree"],
        sessionPortIDs: ["session.branch-graph"],
        localEvidenceRefs: ["pi-session-message-part:storage-roundtrip"],
        localMarkers: ["active_leaf", "leaf-tree", "parent_leaf"],
        knownGaps: ["pi-active-leaf-switch-boundary-not-live-replayed"],
      }),
      productSessionBranch({
        branchID: "compaction-record",
        status: "partial",
        sourceRefIDs: ["active-leaf", "context-selector", "session-format"],
        sessionAtomIDs: ["pi.session.branch-summary"],
        sessionPortIDs: ["session.compaction-records"],
        localEvidenceRefs: ["pi-session-message-part:provider-metadata-roundtrip"],
        localMarkers: ["branch_summary", "context_window_summary"],
        knownGaps: ["pi-branch-summary-side-effect-order-not-replayed"],
      }),
      productSessionBranch({
        branchID: "pagination-context",
        status: "partial",
        sourceRefIDs: ["context-selector", "active-leaf"],
        sessionAtomIDs: ["pi.session.pagination.active-path", "pi.session.context-selector.active-leaf"],
        sessionPortIDs: ["session.pagination", "session.context-selector"],
        localEvidenceRefs: ["session-atoms:pagination"],
        localMarkers: ["activePath", "selectContext", "readRecentMessages"],
        knownGaps: ["pi-context-selector-token-budget-runtime-not-replayed"],
      }),
      productSessionBranch({
        branchID: "provider-metadata",
        status: "partial",
        sourceRefIDs: ["session-format", "session-manager"],
        sessionAtomIDs: ["pi.session.projector.jsonl-v3", "pi.session.store.jsonl-v3"],
        sessionPortIDs: ["session.projector", "session.store"],
        localEvidenceRefs: ["pi-session-message-part:provider-metadata-roundtrip"],
        localMarkers: ["extension-provider-metadata", "event.timestamp", "provider-metadata.readback"],
        knownGaps: ["pi-extension-private-state-not-replayed"],
      }),
      productSessionMissingBranch("live-session-runtime", ["session-manager", "active-leaf"], ["pi.session.store.jsonl-v3", "pi.session.branch-graph.active-leaf"], ["session.store", "session.branch-graph"], "pi-live-session-runtime-not-spawned"),
      productSessionMissingBranch("exact-storage-roundtrip", ["session-manager", "session-format"], ["pi.session.store.jsonl-v3", "pi.session.projector.jsonl-v3"], ["session.store", "session.projector"], "pi-jsonl-v3-exact-storage-roundtrip-not-proven"),
      productSessionMissingBranch("exact-branch-side-effects", ["active-leaf", "context-selector"], ["pi.session.branch-graph.active-leaf", "pi.session.branch-summary"], ["session.branch-graph", "session.compaction-records"], "pi-active-leaf-side-effects-not-replayed"),
    ],
  })
}

export function buildNanobotSessionSourceMatrixSnapshot(): ProductSessionSourceMatrixSnapshot {
  return buildProductSessionSourceMatrixSnapshot({
    product: "nanobot",
    pinnedRepo: "HKUDS/nanobot",
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    sourceRefs: NANOBOT_SESSION_SOURCE_REFS,
    branches: [
      productSessionBranch({
        branchID: "id-generator",
        status: "partial",
        sourceRefIDs: ["session-manager", "session-paths"],
        sessionAtomIDs: ["nanobot.session.id-generator"],
        sessionPortIDs: ["session.id-generator"],
        localEvidenceRefs: ["session-atoms:id-generator", "nanobot-session-message-part:storage-roundtrip"],
        localMarkers: ["workspace-session-id", "SessionManager", "session path"],
        knownGaps: ["nanobot-session-id-source-not-live-replayed"],
      }),
      productSessionBranch({
        branchID: "store-projection",
        status: "partial",
        sourceRefIDs: ["session-manager", "session-paths", "attachments"],
        sessionAtomIDs: ["nanobot.session.store.jsonl"],
        sessionPortIDs: ["session.store"],
        localEvidenceRefs: ["nanobot-session-message-part:storage-roundtrip"],
        localMarkers: ["workspace-sessions-jsonl", "add_message", "save", "flush_all"],
        knownGaps: ["nanobot-workspace-file-offset-order-not-replayed"],
      }),
      productSessionBranch({
        branchID: "projector",
        status: "partial",
        sourceRefIDs: ["session-manager", "attachments"],
        sessionAtomIDs: ["nanobot.session.projector.jsonl"],
        sessionPortIDs: ["session.projector"],
        localEvidenceRefs: ["nanobot-session-message-part:message-part-projector"],
        localMarkers: ["assistant_delta", "tool-message.readback", "merge_turn_media_into_last_assistant"],
        knownGaps: ["nanobot-tool-message-private-fields-not-replayed"],
      }),
      productSessionBranch({
        branchID: "branch-graph",
        status: "partial",
        sourceRefIDs: ["session-manager", "session-paths"],
        sessionAtomIDs: ["nanobot.session.branch-graph.channel-key"],
        sessionPortIDs: ["session.branch-graph"],
        localEvidenceRefs: ["nanobot-session-message-part:storage-roundtrip"],
        localMarkers: ["channel_key", "history_reference", "workspace session key"],
        knownGaps: ["nanobot-channel-history-link-boundary-not-replayed"],
      }),
      productSessionBranch({
        branchID: "compaction-record",
        status: "partial",
        sourceRefIDs: ["goal-state", "session-manager"],
        sessionAtomIDs: ["nanobot.session.goal-state"],
        sessionPortIDs: ["session.compaction-records"],
        localEvidenceRefs: ["nanobot-session-message-part:provider-metadata-roundtrip"],
        localMarkers: ["goal_state_raw", "goal_state_runtime_lines", "goal_state_ws_blob"],
        knownGaps: ["nanobot-goal-state-memory-resolution-not-replayed"],
      }),
      productSessionBranch({
        branchID: "pagination-context",
        status: "partial",
        sourceRefIDs: ["session-manager"],
        sessionAtomIDs: ["nanobot.session.pagination.updated-at", "nanobot.session.context-selector.max-messages"],
        sessionPortIDs: ["session.pagination", "session.context-selector"],
        localEvidenceRefs: ["session-atoms:pagination"],
        localMarkers: ["updated-at", "retain_recent_legal_suffix", "max_messages"],
        knownGaps: ["nanobot-retain-recent-legal-suffix-runtime-not-replayed"],
      }),
      productSessionBranch({
        branchID: "provider-metadata",
        status: "partial",
        sourceRefIDs: ["session-manager", "goal-state", "attachments"],
        sessionAtomIDs: ["nanobot.session.projector.jsonl", "nanobot.session.store.jsonl"],
        sessionPortIDs: ["session.projector", "session.store"],
        localEvidenceRefs: ["nanobot-session-message-part:provider-metadata-roundtrip"],
        localMarkers: ["memory_reference", "workspace.file_offset", "media attachment staging"],
        knownGaps: ["nanobot-workspace-private-sidecar-state-not-replayed"],
      }),
      productSessionMissingBranch("live-session-runtime", ["session-manager", "goal-state"], ["nanobot.session.store.jsonl", "nanobot.session.goal-state"], ["session.store", "session.compaction-records"], "nanobot-live-session-runtime-not-spawned"),
      productSessionMissingBranch("exact-storage-roundtrip", ["session-manager", "attachments"], ["nanobot.session.store.jsonl", "nanobot.session.projector.jsonl"], ["session.store", "session.projector"], "nanobot-jsonl-exact-storage-roundtrip-not-proven"),
      productSessionMissingBranch("exact-branch-side-effects", ["session-manager", "session-paths"], ["nanobot.session.branch-graph.channel-key", "nanobot.session.goal-state"], ["session.branch-graph", "session.compaction-records"], "nanobot-channel-session-side-effects-not-replayed"),
    ],
  })
}

export function buildHermesSessionSourceMatrixSnapshot(): ProductSessionSourceMatrixSnapshot {
  return buildProductSessionSourceMatrixSnapshot({
    product: "hermes",
    pinnedRepo: "NousResearch/hermes-agent",
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    sourceRefs: HERMES_SESSION_SOURCE_REFS,
    branches: [
      productSessionBranch({
        branchID: "id-generator",
        status: "partial",
        sourceRefIDs: ["acp-session"],
        sessionAtomIDs: ["hermes.session.id-generator"],
        sessionPortIDs: ["session.id-generator"],
        localEvidenceRefs: ["session-atoms:id-generator", "hermes-session-message-part:storage-roundtrip"],
        localMarkers: ["SessionState", "create_session", "_build_session_title"],
        knownGaps: ["hermes-session-id-and-title-runtime-not-replayed"],
      }),
      productSessionBranch({
        branchID: "store-projection",
        status: "partial",
        sourceRefIDs: ["acp-session", "session-storage"],
        sessionAtomIDs: ["hermes.session.store.sqlite-fts"],
        sessionPortIDs: ["session.store"],
        localEvidenceRefs: ["hermes-session-message-part:storage-roundtrip"],
        localMarkers: ["SQLiteSessionStore", "save_session", "_persist", "_restore"],
        knownGaps: ["hermes-sqlite-fts-transaction-order-not-replayed"],
      }),
      productSessionBranch({
        branchID: "projector",
        status: "partial",
        sourceRefIDs: ["acp-session", "runtime-helpers"],
        sessionAtomIDs: ["hermes.session.projector.openai-messages"],
        sessionPortIDs: ["session.projector"],
        localEvidenceRefs: ["hermes-session-message-part:message-part-projector"],
        localMarkers: ["openai-messages", "convert_to_trajectory_format", "acp-part"],
        knownGaps: ["hermes-openai-message-private-state-not-replayed"],
      }),
      productSessionBranch({
        branchID: "branch-graph",
        status: "partial",
        sourceRefIDs: ["acp-session"],
        sessionAtomIDs: ["hermes.session.branch-graph.lineage"],
        sessionPortIDs: ["session.branch-graph"],
        localEvidenceRefs: ["hermes-session-message-part:storage-roundtrip"],
        localMarkers: ["fork_session", "lineage_edge", "parent_session"],
        knownGaps: ["hermes-acp-fork-side-effects-not-live-replayed"],
      }),
      productSessionBranch({
        branchID: "compaction-record",
        status: "partial",
        sourceRefIDs: ["trajectory", "runtime-helpers"],
        sessionAtomIDs: ["hermes.session.compaction-trajectory"],
        sessionPortIDs: ["session.compaction-records"],
        localEvidenceRefs: ["hermes-session-message-part:provider-metadata-roundtrip"],
        localMarkers: ["trajectory_compression", "memory-summary", "save_trajectory"],
        knownGaps: ["hermes-trajectory-compression-order-not-replayed"],
      }),
      productSessionBranch({
        branchID: "pagination-context",
        status: "partial",
        sourceRefIDs: ["acp-session", "session-storage"],
        sessionAtomIDs: ["hermes.session.pagination.updated-at", "hermes.session.context-selector.thread-history"],
        sessionPortIDs: ["session.pagination", "session.context-selector"],
        localEvidenceRefs: ["session-atoms:pagination"],
        localMarkers: ["updated_at", "thread_history", "list_sessions"],
        knownGaps: ["hermes-thread-history-selector-runtime-not-replayed"],
      }),
      productSessionBranch({
        branchID: "provider-metadata",
        status: "partial",
        sourceRefIDs: ["acp-session", "trajectory", "session-storage"],
        sessionAtomIDs: ["hermes.session.projector.openai-messages", "hermes.session.store.sqlite-fts"],
        sessionPortIDs: ["session.projector", "session.store"],
        localEvidenceRefs: ["hermes-session-message-part:provider-metadata-roundtrip"],
        localMarkers: ["api.trace_id", "memory.session_search_ref", "session-search-reference"],
        knownGaps: ["hermes-session-search-ranking-context-not-replayed"],
      }),
      productSessionMissingBranch("live-session-runtime", ["acp-session", "session-storage"], ["hermes.session.store.sqlite-fts", "hermes.session.projector.openai-messages"], ["session.store", "session.projector"], "hermes-live-acp-session-runtime-not-spawned"),
      productSessionMissingBranch("exact-storage-roundtrip", ["acp-session", "session-storage"], ["hermes.session.store.sqlite-fts", "hermes.session.projector.openai-messages"], ["session.store", "session.projector"], "hermes-sqlite-fts-exact-storage-roundtrip-not-proven"),
      productSessionMissingBranch("exact-branch-side-effects", ["acp-session", "trajectory"], ["hermes.session.branch-graph.lineage", "hermes.session.compaction-trajectory"], ["session.branch-graph", "session.compaction-records"], "hermes-acp-branch-trajectory-side-effects-not-replayed"),
    ],
  })
}

function productSessionBranch(input: ProductSessionSourceMatrixBranchAnchor): ProductSessionSourceMatrixBranchAnchor {
  return input
}

function productSessionMissingBranch(
  branchID: ProductSessionSourceMatrixBranchID,
  sourceRefIDs: string[],
  sessionAtomIDs: string[],
  sessionPortIDs: string[],
  knownGap: string,
): ProductSessionSourceMatrixBranchAnchor {
  return productSessionBranch({
    branchID,
    status: "missing",
    sourceRefIDs,
    sessionAtomIDs,
    sessionPortIDs,
    localEvidenceRefs: ["session-source-matrix:partial"],
    localMarkers: ["source-anchored-only", `${branchID}:not-replayed`],
    knownGaps: [knownGap],
  })
}

function buildProductSessionSourceMatrixSnapshot(input: {
  product: ProductSessionSourceMatrixProduct
  pinnedRepo: ProductSessionSourceRef["repo"]
  pinnedRef: string
  sourceRefs: ProductSessionSourceRef[]
  branches: ProductSessionSourceMatrixBranchAnchor[]
}): ProductSessionSourceMatrixSnapshot {
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: input.product,
    upstreamRef: `upstream:${input.pinnedRepo}@${input.pinnedRef}`,
    pinnedRepo: input.pinnedRepo,
    pinnedRef: input.pinnedRef,
    evidenceRef: `conformance:${input.product}-session-source-matrix` as const,
    fixtureID: `${input.product}-session:source-matrix` as const,
    sourceRefs: input.sourceRefs,
    branchAnchors: input.branches,
    partialBranchIDs: input.branches.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: input.branches.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredSessionAtomIDs: uniqueStrings(input.branches.flatMap((anchor) => anchor.sessionAtomIDs)),
    coveredSessionPortIDs: uniqueStrings(input.branches.flatMap((anchor) => anchor.sessionPortIDs)),
    knownGaps: uniqueStrings([
      `${input.product}-session-source-matrix-covered-by-partial-fixture`,
      `${input.product}-live-session-runtime-not-spawned`,
      `${input.product}-exact-storage-roundtrip-not-proven`,
      ...input.branches.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export const messagePartProjectorRegistry: Record<MessagePartProjectionProduct, MessagePartProjectorProfile> = {
  common: {
    product: "common",
    atomID: "common.session.message-part-projector",
    nativeFixtureSource: "none",
    lossiness: "none",
    nativeTypes: {},
    lossyTypes: new Set(),
  },
  opencode: {
    product: "opencode",
    atomID: "opencode.session.message-part-projector.native-like",
    nativeFixtureSource: "opencode-native",
    lossiness: "semantic",
    nativeTypes: {
      tool_call: "tool",
      tool_result: "tool",
      "step-start": "step-start",
      "step-finish": "step-finish",
    },
    lossyTypes: new Set(["tool_call", "tool_result"]),
  },
  "pi-mono": {
    product: "pi-mono",
    atomID: "pi.session.message-part-projector.native-like",
    nativeFixtureSource: "pi-native",
    lossiness: "event-lifecycle",
    nativeTypes: {
      text: "message_update",
      reasoning: "message_update",
      tool_call: "tool_execution_start",
      tool_result: "tool_execution_end",
    },
    lossyTypes: new Set(["text", "reasoning"]),
  },
  nanobot: {
    product: "nanobot",
    atomID: "nanobot.session.message-part-projector.native-like",
    nativeFixtureSource: "nanobot-native",
    lossiness: "event-lifecycle",
    nativeTypes: {
      text: "assistant_delta",
      reasoning: "assistant_delta",
      tool_call: "tool",
      tool_result: "tool",
    },
    lossyTypes: new Set(["text", "reasoning", "tool_call", "tool_result"]),
  },
  "hermes-agent": {
    product: "hermes-agent",
    atomID: "hermes.session.message-part-projector.native-like",
    nativeFixtureSource: "hermes-native",
    lossiness: "semantic",
    nativeTypes: {
      text: "message_delta",
      reasoning: "reasoning",
      tool_call: "tool_call",
      tool_result: "tool_result",
      compaction: "trajectory_compression",
    },
    lossyTypes: new Set(["reasoning", "compaction"]),
  },
}

export function projectMessagePartType(product: MessagePartProjectionProduct, part: LegoMessagePart): MessagePartProjection {
  const profile = messagePartProjectorRegistry[product]
  const sourceType = part.type === "custom" ? part.customType : part.type
  return {
    atomID: profile.atomID,
    product,
    sourceType,
    nativeType: nativeTypeFor(profile, sourceType),
    lossy: isLossyProjection(profile, sourceType),
  }
}

export function projectMessagePartTypes(product: MessagePartProjectionProduct, parts: LegoMessagePart[]): MessagePartProjection[] {
  return parts.map((part) => projectMessagePartType(product, part))
}

export function messagePartProjectorDescriptors(product?: MessagePartProjectionProduct): MessagePartProjectorAtomDescriptor[] {
  const products = product ? [product] : (Object.keys(messagePartProjectorRegistry) as MessagePartProjectionProduct[])
  return products.map((item) => {
    const profile = messagePartProjectorRegistry[item]
    return {
      id: profile.atomID,
      port: "session.message-part-projector",
      product: item,
      lossiness: profile.lossiness,
      nativeFixtureSource: profile.nativeFixtureSource,
      replay: sessionMessagePartReplayMetadata(profile),
    }
  })
}

export function buildSessionMessagePartReplaySnapshot(product: SessionMessagePartReplayProduct): SessionMessagePartReplaySnapshot {
  const profile = messagePartProjectorRegistry[product]
  const storageRoundTrip = buildSessionStorageRoundTripSnapshot(product)
  const providerMetadataRoundTrip = buildSessionProviderMetadataRoundTripSnapshot(product)
  const atoms = sessionMessagePartReplayAtomKeys.map((key) => buildSessionMessagePartReplayAtomSnapshot(product, key, storageRoundTrip, providerMetadataRoundTrip))
  const profileSnapshot = messagePartProjectorProfileSnapshot(profile)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: sessionMessagePartUpstreamRef(product),
    evidenceRef: `conformance:${product}-session-message-part-replay-snapshot`,
    fixtureIDs: [...atoms.map((atom) => atom.fixtureID), storageRoundTrip.fixtureID, providerMetadataRoundTrip.fixtureID],
    profileFingerprint: fingerprintObject(profileSnapshot),
    profile: profileSnapshot,
    storageRoundTrip,
    storageRoundTripFingerprint: storageRoundTrip.fingerprint,
    providerMetadataRoundTrip,
    providerMetadataRoundTripFingerprint: providerMetadataRoundTrip.fingerprint,
    atoms,
    coveredKeys: atoms.map((atom) => atom.key),
    knownGaps: [
      "full-native-session-storage-roundtrip-not-proven",
      "session-storage-roundtrip-covered-by-partial-readback-fixture",
      "session-provider-metadata-roundtrip-covered-by-partial-fixture",
      "raw-only-provider-metadata-not-recoverable-from-common-transcript",
      "compaction-and-tool-lifecycle-ordering-partial",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildSessionMessagePartReplayAtomSnapshot(
  product: SessionMessagePartReplayProduct,
  key: SessionMessagePartReplayAtomKey = "message-part-projector",
  storageRoundTrip = buildSessionStorageRoundTripSnapshot(product),
  providerMetadataRoundTrip = buildSessionProviderMetadataRoundTripSnapshot(product),
): SessionMessagePartReplayAtomSnapshot {
  const profile = messagePartProjectorRegistry[product]
  return {
    key,
    atomID: profile.atomID,
    portID: "session.message-part-projector",
    flowStageID: "stream.project",
    storageRoundTripFingerprint: storageRoundTrip.fingerprint,
    storageRoundTripFixtureID: storageRoundTrip.fixtureID,
    providerMetadataRoundTripFingerprint: providerMetadataRoundTrip.fingerprint,
    providerMetadataRoundTripFixtureID: providerMetadataRoundTrip.fixtureID,
    nativeFixtureSource: profile.nativeFixtureSource,
    upstreamEvidenceRefs: sessionMessagePartUpstreamEvidenceRefs(product),
    fixtureID: sessionMessagePartReplayFixtureID(product, key),
    scenarios: sessionMessagePartReplayScenarios(profile),
    roundTripFields: sessionMessagePartRoundTripFields(product),
    oneWayExactFields: sessionMessagePartOneWayExactFields(product),
    nativeOnlyFields: sessionMessagePartNativeOnlyFields(product),
    inferredFields: uniqueStrings([...sessionMessagePartInferredFields(product), ...sessionProviderMetadataRoundTripInferredFields(product)]),
    irrecoverableFields: sessionMessagePartIrrecoverableFields(product),
    lossyFields: uniqueStrings([...sessionMessagePartLossyFields(product), ...sessionProviderMetadataRoundTripLossyFields(product)]),
  }
}

export function sessionMessagePartReplayFixtureID(product: SessionMessagePartReplayProduct, key: SessionMessagePartReplayAtomKey): string {
  return `${product}-session-message-part:${key}`
}

export function sessionStorageRoundTripFixtureID(product: SessionMessagePartReplayProduct): string {
  return `${product}-session-message-part:storage-roundtrip`
}

export function sessionProviderMetadataRoundTripFixtureID(product: SessionMessagePartReplayProduct): string {
  return `${product}-session-message-part:provider-metadata-roundtrip`
}

export function buildSessionStorageRoundTripSnapshot(product: SessionMessagePartReplayProduct): SessionStorageRoundTripSnapshot {
  const scenarios = sessionStorageRoundTripScenarios(product)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: sessionMessagePartUpstreamRef(product),
    evidenceRef: `conformance:${product}-session-storage-roundtrip`,
    fixtureID: sessionStorageRoundTripFixtureID(product),
    scenarios,
    observedFields: [
      "storageSurface",
      "messageID",
      "partID",
      "role",
      "partType",
      "toolCallID",
      "compactionRecord",
      "branchLineage",
      "providerMetadataPresence",
    ],
    inferredFields: sessionStorageRoundTripInferredFields(product),
    lossyFields: sessionStorageRoundTripLossyFields(product),
    knownGaps: [
      "full-native-session-storage-roundtrip-not-proven",
      "native-storage-transaction-order-not-replayed",
      "provider-raw-metadata-roundtrip-not-proven",
      "branch-lineage-id-roundtrip-partial",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildSessionProviderMetadataRoundTripSnapshot(product: SessionMessagePartReplayProduct): SessionProviderMetadataRoundTripSnapshot {
  const scenarios = sessionProviderMetadataRoundTripScenarios(product)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: sessionMessagePartUpstreamRef(product),
    evidenceRef: `conformance:${product}-session-provider-metadata-roundtrip`,
    fixtureID: sessionProviderMetadataRoundTripFixtureID(product),
    scenarios,
    observedFields: [
      "storageSurface",
      "nativeMetadataRecords",
      "commonReadbackFields",
      "providerMetadataPresence",
      "rawProviderEnvelope",
      "toolCallID",
      "compactionRecord",
      "branchLineage",
    ],
    inferredFields: sessionProviderMetadataRoundTripInferredFields(product),
    lossyFields: sessionProviderMetadataRoundTripLossyFields(product),
    knownGaps: [
      "full-native-provider-metadata-roundtrip-not-proven",
      "native-storage-transaction-order-not-replayed",
      "provider-metadata-private-state-not-replayed",
      "raw-provider-envelope-byte-range-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildSessionStorageRoundTripGateSnapshot(): SessionStorageRoundTripGateSnapshot {
  const cases = [
    buildOpenCodeSessionStorageRoundTripGateCase(buildOpenCodeSessionSourceMatrixSnapshot(), buildSessionMessagePartReplaySnapshot("opencode")),
    buildProductSessionStorageRoundTripGateCase("pi-mono", buildPiSessionSourceMatrixSnapshot(), buildSessionMessagePartReplaySnapshot("pi-mono")),
    buildProductSessionStorageRoundTripGateCase("nanobot", buildNanobotSessionSourceMatrixSnapshot(), buildSessionMessagePartReplaySnapshot("nanobot")),
    buildProductSessionStorageRoundTripGateCase("hermes-agent", buildHermesSessionSourceMatrixSnapshot(), buildSessionMessagePartReplaySnapshot("hermes-agent")),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:session-storage-round-trip-gate" as const,
    fixtureID: "session:storage-round-trip-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: [
      "message-part-schema",
      "store-readback",
      "branch-graph",
      "compaction-record",
      "pagination-context",
      "provider-metadata",
    ] as SessionStorageRoundTripGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifySessionStorageRoundTripGateSnapshot(snapshot: SessionStorageRoundTripGateSnapshot): SessionStorageRoundTripGateVerification {
  const issues: SessionStorageRoundTripGateIssue[] = []
  const products: SessionStorageRoundTripGateProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "session-storage.missing-product",
        product,
        dimension: "store-readback",
        message: `Missing session storage round-trip gate case for ${product}.`,
      })
      continue
    }
    if (!sessionGateContains(item.messagePartSchema, /message|part|projector|tool|text|reasoning|schema|MessageV2|jsonl|openai|trajectory|acp/i)) {
      issues.push({
        id: "session-storage.message-part-schema",
        product,
        dimension: "message-part-schema",
        message: `${product} session storage gate no longer records message-part schema anchors.`,
      })
    }
    if (!sessionGateContains(item.storeReadback, /store|storage|sqlite|jsonl|memory|readback|roundtrip|save|restore|write|transaction|projection/i)) {
      issues.push({
        id: "session-storage.store-readback",
        product,
        dimension: "store-readback",
        message: `${product} session storage gate no longer records store readback anchors.`,
      })
    }
    if (!sessionGateContains(item.branchGraph, /branch|fork|leaf|lineage|channel|history|parent|active/i)) {
      issues.push({
        id: "session-storage.branch-graph",
        product,
        dimension: "branch-graph",
        message: `${product} session storage gate no longer records branch graph anchors.`,
      })
    }
    if (!sessionGateContains(item.compactionRecord, /compaction|summary|trajectory|goal|branch_summary|compression|memory/i)) {
      issues.push({
        id: "session-storage.compaction-record",
        product,
        dimension: "compaction-record",
        message: `${product} session storage gate no longer records compaction record anchors.`,
      })
    }
    if (!sessionGateContains(item.paginationContext, /pagination|cursor|updated|context|selector|history|page|max_messages|active|thread/i)) {
      issues.push({
        id: "session-storage.pagination-context",
        product,
        dimension: "pagination-context",
        message: `${product} session storage gate no longer records pagination/context anchors.`,
      })
    }
    if (!sessionGateContains(item.providerMetadata, /provider|metadata|raw|envelope|trace|private|readback|memory|extension|search/i)) {
      issues.push({
        id: "session-storage.provider-metadata",
        product,
        dimension: "provider-metadata",
        message: `${product} session storage gate no longer records provider metadata anchors.`,
      })
    }
    if (item.fixtureIDs.length < 4 || !sessionGateContains(item.fixtureIDs, /message-part|storage-roundtrip|provider-metadata|source-matrix/i)) {
      issues.push({
        id: "session-storage.fixture-coverage",
        product,
        dimension: "store-readback",
        message: `${product} session storage gate no longer links source matrix, message-part, storage and provider metadata fixtures.`,
      })
    }
    if (!sessionGateContains(item.knownLossiness, /not-proven|not-replayed|partial|not-spawned|lossy|private-state|not-live|not-exact/i)) {
      issues.push({
        id: "session-storage.runtime-lossiness",
        product,
        dimension: "store-readback",
        message: `${product} session storage gate no longer records partial readback lossiness.`,
      })
    }
    if (item.readbackRisk !== "source-anchored-partial") {
      issues.push({
        id: "session-storage.common-transcript-only",
        product,
        dimension: "store-readback",
        message: `${product} session storage gate is not source anchored and cannot be promoted toward native parity.`,
      })
    }
    if (product !== "opencode" && (item.fixtureID === "opencode-session:source-matrix" || item.readbackRisk === "borrowed-opencode")) {
      issues.push({
        id: "session-storage.borrowed-source-matrix",
        product,
        dimension: "message-part-schema",
        message: `${product} session storage gate is borrowing the OpenCode source matrix.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildSessionStorageExactDiffBlockerSnapshot(): SessionStorageExactDiffBlockerSnapshot {
  const roundTripGate = buildSessionStorageRoundTripGateSnapshot()
  const cases = roundTripGate.cases.map(buildSessionStorageExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:session-storage-exact-diff-blocker-gate" as const,
    fixtureID: "session:storage-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: roundTripGate.comparisonDimensions as SessionStorageExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifySessionStorageExactDiffBlockerSnapshot(
  snapshot: SessionStorageExactDiffBlockerSnapshot,
): SessionStorageExactDiffBlockerVerification {
  const issues: SessionStorageExactDiffBlockerIssue[] = []
  const products: SessionStorageExactDiffBlockerProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "session-storage-exact-diff.missing-product",
        product,
        dimension: "store-readback",
        message: `Missing session storage exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "session-storage-exact-diff.native-claim",
        product,
        dimension: "store-readback",
        message: `${product} session storage blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!sessionGateContains(item.messagePartSchema, /message|part|projector|tool|text|reasoning|schema|MessageV2|jsonl|openai|trajectory|acp|exact-diff-not-proven/i)) {
      issues.push({
        id: "session-storage-exact-diff.message-part-schema",
        product,
        dimension: "message-part-schema",
        message: `${product} session storage blocker no longer records message-part schema exact-diff anchors.`,
      })
    }
    if (!sessionGateContains(item.storeReadback, /store|storage|sqlite|jsonl|memory|readback|roundtrip|save|restore|write|transaction|projection|exact-diff-not-proven/i)) {
      issues.push({
        id: "session-storage-exact-diff.store-readback",
        product,
        dimension: "store-readback",
        message: `${product} session storage blocker no longer records store readback exact-diff anchors.`,
      })
    }
    if (!sessionGateContains(item.branchGraph, /branch|fork|leaf|lineage|channel|history|parent|active|exact-diff-not-proven/i)) {
      issues.push({
        id: "session-storage-exact-diff.branch-graph",
        product,
        dimension: "branch-graph",
        message: `${product} session storage blocker no longer records branch graph exact-diff anchors.`,
      })
    }
    if (!sessionGateContains(item.compactionRecord, /compaction|summary|trajectory|goal|branch_summary|compression|memory|exact-diff-not-proven/i)) {
      issues.push({
        id: "session-storage-exact-diff.compaction-record",
        product,
        dimension: "compaction-record",
        message: `${product} session storage blocker no longer records compaction record exact-diff anchors.`,
      })
    }
    if (!sessionGateContains(item.paginationContext, /pagination|cursor|updated|context|selector|history|page|max_messages|active|thread|exact-diff-not-proven/i)) {
      issues.push({
        id: "session-storage-exact-diff.pagination-context",
        product,
        dimension: "pagination-context",
        message: `${product} session storage blocker no longer records pagination/context exact-diff anchors.`,
      })
    }
    if (!sessionGateContains(item.providerMetadata, /provider|metadata|raw|envelope|trace|private|readback|memory|extension|search|exact-diff-not-proven/i)) {
      issues.push({
        id: "session-storage-exact-diff.provider-metadata",
        product,
        dimension: "provider-metadata",
        message: `${product} session storage blocker no longer records provider metadata exact-diff anchors.`,
      })
    }
    if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.sourceAnchors.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "session-storage-exact-diff.common-transcript-only",
        product,
        dimension: "store-readback",
        message: `${product} session storage blocker is not anchored to product-specific partial replay evidence.`,
      })
    }
    if (product !== "opencode" && (item.fixtureID === "opencode-session:source-matrix" || item.exactDiffRisk === "borrowed-opencode" || sessionGateContains(item.fixtureIDs, /^opencode-session:source-matrix$/))) {
      issues.push({
        id: "session-storage-exact-diff.borrowed-source-matrix",
        product,
        dimension: "message-part-schema",
        message: `${product} session storage blocker is borrowing the OpenCode source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildSessionStorageExactDiffBlockerCase(
  gateCase: SessionStorageRoundTripGateCase,
): SessionStorageExactDiffBlockerCase {
  return {
    product: gateCase.product,
    upstreamRef: gateCase.upstreamRef,
    evidenceRef: "conformance:session-storage-exact-diff-blocker-gate",
    fixtureID: gateCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    messagePartSchema: uniqueStrings([
      ...gateCase.messagePartSchema,
      "session-message-part-schema-native-fields:exact-diff-not-proven",
    ]),
    storeReadback: uniqueStrings([
      ...gateCase.storeReadback,
      "session-store-readback-native-transaction:exact-diff-not-proven",
    ]),
    branchGraph: uniqueStrings([
      ...gateCase.branchGraph,
      "session-branch-graph-native-side-effects:exact-diff-not-proven",
    ]),
    compactionRecord: uniqueStrings([
      ...gateCase.compactionRecord,
      "session-compaction-record-native-shape:exact-diff-not-proven",
    ]),
    paginationContext: uniqueStrings([
      ...gateCase.paginationContext,
      "session-pagination-context-native-cursor:exact-diff-not-proven",
    ]),
    providerMetadata: uniqueStrings([
      ...gateCase.providerMetadata,
      "session-provider-metadata-native-private-state:exact-diff-not-proven",
    ]),
    sourceAnchors: gateCase.sourceAnchors,
    sessionAtomIDs: gateCase.sessionAtomIDs,
    sessionPortIDs: gateCase.sessionPortIDs,
    fixtureIDs: uniqueStrings(["session:storage-round-trip-gate", ...gateCase.fixtureIDs]),
    nativeEvidenceRefs: uniqueStrings([...gateCase.sourceAnchors, ...gateCase.fixtureIDs]),
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...gateCase.knownLossiness,
      "session-message-part-schema-native-fields-not-proven",
      "session-store-readback-native-transaction-not-proven",
      "session-branch-graph-native-side-effects-not-proven",
      "session-compaction-record-native-shape-not-proven",
      "session-pagination-context-native-cursor-not-proven",
      "session-provider-metadata-native-private-state-not-proven",
    ]),
  }
}

export function buildSessionStoragePinnedReadbackSnapshot(): SessionStoragePinnedReadbackSnapshot {
  const roundTripGate = buildSessionStorageRoundTripGateSnapshot()
  const cases = roundTripGate.cases.map(buildSessionStoragePinnedReadbackCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:session-storage-pinned-readback-gate" as const,
    fixtureID: "session:storage-pinned-readback-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: roundTripGate.comparisonDimensions,
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifySessionStoragePinnedReadbackSnapshot(
  snapshot: SessionStoragePinnedReadbackSnapshot,
): SessionStoragePinnedReadbackVerification {
  const issues: SessionStoragePinnedReadbackIssue[] = []
  const products: SessionStoragePinnedReadbackProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "session-storage-pinned-readback.missing-product",
        product,
        dimension: "store-readback",
        message: `Missing session storage pinned readback case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "session-storage-pinned-readback.native-claim",
        product,
        dimension: "store-readback",
        message: `${product} session storage pinned readback must remain partial and cannot claim native parity.`,
      })
    }
    if (item.upstreamWrites.length === 0 || item.upstreamWrites.length !== item.productReadback.length || item.upstreamWrites.length !== item.assembledProjection.length) {
      issues.push({
        id: "session-storage-pinned-readback.store-readback",
        product,
        dimension: "store-readback",
        message: `${product} session storage pinned readback must compare non-empty write/read/project streams of equal length.`,
      })
      continue
    }
    if (!sessionStoragePinnedReadbackRecordsMatch(item.upstreamWrites, item.productReadback) || !sessionStoragePinnedReadbackRecordsMatch(item.upstreamWrites, item.assembledProjection)) {
      issues.push({
        id: "session-storage-pinned-readback.store-readback",
        product,
        dimension: "store-readback",
        message: `${product} session storage pinned readback no longer matches upstream write records.`,
      })
    }
    if (item.upstreamWrites.some((record) => !record.messageID || !record.partID || !record.partType)) {
      issues.push({
        id: "session-storage-pinned-readback.message-part-schema",
        product,
        dimension: "message-part-schema",
        message: `${product} session storage pinned readback lost message part schema fields.`,
      })
    }
    if (!sessionStoragePinnedBranchMatches(item.upstreamWrites, item.productReadback) || !sessionStoragePinnedBranchMatches(item.upstreamWrites, item.assembledProjection)) {
      issues.push({
        id: "session-storage-pinned-readback.branch-graph",
        product,
        dimension: "branch-graph",
        message: `${product} session storage pinned readback branch graph drifted.`,
      })
    }
    if (!sessionStoragePinnedCompactionMatches(item.upstreamWrites, item.productReadback) || !sessionStoragePinnedCompactionMatches(item.upstreamWrites, item.assembledProjection)) {
      issues.push({
        id: "session-storage-pinned-readback.compaction-record",
        product,
        dimension: "compaction-record",
        message: `${product} session storage pinned readback compaction record drifted.`,
      })
    }
    if (!sessionStoragePinnedPaginationMatches(item.upstreamWrites, item.productReadback) || !sessionStoragePinnedPaginationMatches(item.upstreamWrites, item.assembledProjection)) {
      issues.push({
        id: "session-storage-pinned-readback.pagination-context",
        product,
        dimension: "pagination-context",
        message: `${product} session storage pinned readback pagination/context cursor drifted.`,
      })
    }
    if (!sessionStoragePinnedProviderMetadataMatches(item.upstreamWrites, item.productReadback) || !sessionStoragePinnedProviderMetadataMatches(item.upstreamWrites, item.assembledProjection)) {
      issues.push({
        id: "session-storage-pinned-readback.provider-metadata",
        product,
        dimension: "provider-metadata",
        message: `${product} session storage pinned readback provider metadata drifted.`,
      })
    }
    if (item.exactDiffRisk !== "pinned-readback-needs-live-storage" || item.sourceAnchors.length === 0 || item.fixtureIDs.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "session-storage-pinned-readback.helix-only",
        product,
        dimension: "store-readback",
        message: `${product} session storage pinned readback is not anchored to product-specific session evidence.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildSessionStoragePinnedReadbackCase(
  gateCase: SessionStorageRoundTripGateCase,
): SessionStoragePinnedReadbackCase {
  const records = sessionStoragePinnedReadbackRecords(gateCase.product)
  return {
    product: gateCase.product,
    upstreamRef: gateCase.upstreamRef,
    fixtureID: gateCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    upstreamWrites: records,
    productReadback: records.map(sessionStorageClonePinnedReadbackRecord),
    assembledProjection: records.map(sessionStorageClonePinnedReadbackRecord),
    sourceAnchors: gateCase.sourceAnchors,
    fixtureIDs: uniqueStrings(["session:storage-round-trip-gate", ...gateCase.fixtureIDs]),
    exactDiffRisk: "pinned-readback-needs-live-storage",
    knownLossiness: uniqueStrings([
      ...gateCase.knownLossiness,
      "session-storage-pinned-readback-live-runtime-not-proven",
      "session-storage-pinned-readback-native-transaction-order-not-proven",
      "session-storage-pinned-provider-metadata-private-state-not-proven",
    ]),
  }
}

function sessionStoragePinnedReadbackRecords(product: SessionStoragePinnedReadbackProduct): SessionStoragePinnedReadbackRecord[] {
  if (product === "opencode") {
    return [
      sessionStoragePinnedReadbackRecord(product, 1, "sqlite:session_message", "msg_oc_1", "part_oc_text", "text", "hello from opencode", null, "branch-root", null, null, "updated_at:0001", { provider: "openai", rawPartID: "raw_oc_1", traceID: "trace_oc_1" }),
      sessionStoragePinnedReadbackRecord(product, 2, "sqlite:session_part", "msg_oc_2", "part_oc_tool", "tool_call", null, "tool_oc_1", "branch-child", "branch-root", "summary_oc_1", "updated_at:0002", { provider: "anthropic", rawPartID: "raw_oc_2", toolCallID: "tool_oc_1" }),
    ]
  }
  if (product === "pi-mono") {
    return [
      sessionStoragePinnedReadbackRecord(product, 1, "jsonl:v3:entry", "msg_pi_1", "part_pi_text", "text", "pi user turn", null, "leaf-root", null, null, "activePath:leaf-root:0001", { provider: "pi-provider", rawPartID: "raw_pi_1", activeLeaf: "leaf-root" }),
      sessionStoragePinnedReadbackRecord(product, 2, "jsonl:v3:entry", "msg_pi_2", "part_pi_tool", "tool_result", null, "tool_pi_1", "leaf-child", "leaf-root", "branch_summary_pi_1", "activePath:leaf-child:0002", { provider: "pi-provider", rawPartID: "raw_pi_2", toolCallID: "tool_pi_1" }),
    ]
  }
  if (product === "nanobot") {
    return [
      sessionStoragePinnedReadbackRecord(product, 1, "memory-session:history", "msg_nano_1", "part_nano_text", "text", "nanobot channel delta", null, "channel:websocket", null, null, "max_messages:1", { provider: "nanobot", rawPartID: "raw_nano_1", channelKey: "websocket" }),
      sessionStoragePinnedReadbackRecord(product, 2, "memory-session:goal_state", "msg_nano_2", "part_nano_goal", "compaction", "goal summary", null, "channel:websocket", "channel:root", "goal_state_nano_1", "max_messages:2", { provider: "nanobot", rawPartID: "raw_nano_2", goalState: "active" }),
    ]
  }
  return [
    sessionStoragePinnedReadbackRecord(product, 1, "sqlite-fts:trajectory", "msg_hermes_1", "part_hermes_text", "text", "hermes response", null, "session-root", null, null, "updated_at:hermes:0001", { provider: "codex", rawPartID: "raw_hermes_1", traceID: "trace_hermes_1" }),
    sessionStoragePinnedReadbackRecord(product, 2, "trajectory:tool_result", "msg_hermes_2", "part_hermes_tool", "tool_result", null, "tool_hermes_1", "session-child", "session-root", "trajectory_summary_1", "updated_at:hermes:0002", { provider: "codex", rawPartID: "raw_hermes_2", toolCallID: "tool_hermes_1" }),
  ]
}

function sessionStoragePinnedReadbackRecord(
  product: SessionStoragePinnedReadbackProduct,
  sequence: number,
  storageKey: string,
  messageID: string,
  partID: string,
  partType: string,
  partText: string | null,
  toolCallID: string | null,
  branchID: string,
  parentBranchID: string | null,
  compactionID: string | null,
  paginationCursor: string,
  providerMetadata: Record<string, string>,
): SessionStoragePinnedReadbackRecord {
  return {
    recordID: `${product}-storage-record-${sequence}`,
    storageKey,
    messageID,
    partID,
    partType,
    partText,
    toolCallID,
    branchID,
    parentBranchID,
    compactionID,
    paginationCursor,
    providerMetadata,
    sequence,
  }
}

function sessionStorageClonePinnedReadbackRecord(record: SessionStoragePinnedReadbackRecord): SessionStoragePinnedReadbackRecord {
  return {
    ...record,
    providerMetadata: { ...record.providerMetadata },
  }
}

function sessionStoragePinnedReadbackRecordsMatch(
  expected: SessionStoragePinnedReadbackRecord[],
  actual: SessionStoragePinnedReadbackRecord[],
): boolean {
  return expected.every((record, index) => sessionStoragePinnedReadbackSignature(record) === sessionStoragePinnedReadbackSignature(actual[index]))
}

function sessionStoragePinnedReadbackSignature(record: SessionStoragePinnedReadbackRecord | undefined): string {
  if (record === undefined) return "<missing>"
  return stableStringify({
    storageKey: record.storageKey,
    messageID: record.messageID,
    partID: record.partID,
    partType: record.partType,
    partText: record.partText,
    toolCallID: record.toolCallID,
    branchID: record.branchID,
    parentBranchID: record.parentBranchID,
    compactionID: record.compactionID,
    paginationCursor: record.paginationCursor,
    providerMetadata: record.providerMetadata,
    sequence: record.sequence,
  })
}

function sessionStoragePinnedBranchMatches(
  expected: SessionStoragePinnedReadbackRecord[],
  actual: SessionStoragePinnedReadbackRecord[],
): boolean {
  return expected.every((record, index) => {
    const candidate = actual[index]
    return candidate !== undefined && record.branchID === candidate.branchID && record.parentBranchID === candidate.parentBranchID
  })
}

function sessionStoragePinnedCompactionMatches(
  expected: SessionStoragePinnedReadbackRecord[],
  actual: SessionStoragePinnedReadbackRecord[],
): boolean {
  return expected.every((record, index) => record.compactionID === actual[index]?.compactionID)
}

function sessionStoragePinnedPaginationMatches(
  expected: SessionStoragePinnedReadbackRecord[],
  actual: SessionStoragePinnedReadbackRecord[],
): boolean {
  return expected.every((record, index) => record.paginationCursor === actual[index]?.paginationCursor)
}

function sessionStoragePinnedProviderMetadataMatches(
  expected: SessionStoragePinnedReadbackRecord[],
  actual: SessionStoragePinnedReadbackRecord[],
): boolean {
  return expected.every((record, index) => stableStringify(record.providerMetadata) === stableStringify(actual[index]?.providerMetadata ?? null))
}

function buildOpenCodeSessionStorageRoundTripGateCase(
  sourceMatrix: OpenCodeSessionSourceMatrixSnapshot,
  replay: SessionMessagePartReplaySnapshot,
): SessionStorageRoundTripGateCase {
  return {
    product: "opencode",
    upstreamRef: sourceMatrix.upstreamRef,
    evidenceRef: "conformance:session-storage-round-trip-gate",
    fixtureID: sourceMatrix.fixtureID,
    messagePartSchema: uniqueStrings([
      ...sessionBranchMarkers(sourceMatrix.branchAnchors, ["projector-syncevent", "projector-message-v2"]),
      ...sessionMessagePartReplayMarkers(replay),
    ]),
    storeReadback: uniqueStrings([
      ...sessionBranchMarkers(sourceMatrix.branchAnchors, ["store-sqlite-projection", "full-sqlite-session-roundtrip"]),
      ...sessionStorageRoundTripMarkers(replay.storageRoundTrip),
    ]),
    branchGraph: uniqueStrings([
      ...sessionBranchMarkers(sourceMatrix.branchAnchors, ["branch-graph-fork-before-message", "full-sqlite-session-roundtrip"]),
      ...sessionStorageRoundTripMarkers(replay.storageRoundTrip),
    ]),
    compactionRecord: uniqueStrings([
      ...sessionBranchMarkers(sourceMatrix.branchAnchors, ["compaction-event", "live-syncevent-bus-runtime"]),
      ...sessionStorageRoundTripMarkers(replay.storageRoundTrip),
      ...sessionProviderMetadataRoundTripMarkers(replay.providerMetadataRoundTrip),
    ]),
    paginationContext: sessionBranchMarkers(sourceMatrix.branchAnchors, ["pagination-update-time-cursor"]),
    providerMetadata: uniqueStrings([
      ...sessionBranchMarkers(sourceMatrix.branchAnchors, ["projector-message-v2", "compaction-event"]),
      ...sessionProviderMetadataRoundTripMarkers(replay.providerMetadataRoundTrip),
    ]),
    sourceAnchors: uniqueStrings([
      ...sourceMatrix.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
      ...sourceMatrix.nativeEvidenceRefs,
      ...sourceMatrix.fixtureIDs,
      ...sourceMatrix.branchAnchors.flatMap((anchor) => anchor.nativeEvidenceRefs),
      ...sourceMatrix.branchAnchors.flatMap((anchor) => anchor.fixtureIDs),
    ]),
    sessionAtomIDs: uniqueStrings([...sourceMatrix.coveredSessionAtomIDs, replay.profile.atomID]),
    sessionPortIDs: uniqueStrings([...sourceMatrix.coveredSessionPortIDs, ...replay.atoms.map((atom) => atom.portID)]),
    fixtureIDs: uniqueStrings([sourceMatrix.fixtureID, ...sourceMatrix.fixtureIDs, ...sourceMatrix.branchAnchors.flatMap((anchor) => anchor.fixtureIDs), ...replay.fixtureIDs]),
    readbackRisk: "source-anchored-partial",
    knownLossiness: uniqueStrings([
      ...sourceMatrix.knownGaps,
      ...replay.knownGaps,
      ...replay.storageRoundTrip.knownGaps,
      ...replay.storageRoundTrip.lossyFields,
      ...replay.providerMetadataRoundTrip.knownGaps,
      ...replay.providerMetadataRoundTrip.lossyFields,
    ]),
  }
}

function buildProductSessionStorageRoundTripGateCase(
  product: Exclude<SessionStorageRoundTripGateProduct, "opencode">,
  sourceMatrix: ProductSessionSourceMatrixSnapshot,
  replay: SessionMessagePartReplaySnapshot,
): SessionStorageRoundTripGateCase {
  return {
    product,
    upstreamRef: sourceMatrix.upstreamRef,
    evidenceRef: "conformance:session-storage-round-trip-gate",
    fixtureID: sourceMatrix.fixtureID,
    messagePartSchema: uniqueStrings([
      ...sessionBranchMarkers(sourceMatrix.branchAnchors, ["projector"]),
      ...sessionMessagePartReplayMarkers(replay),
    ]),
    storeReadback: uniqueStrings([
      ...sessionBranchMarkers(sourceMatrix.branchAnchors, ["store-projection", "live-session-runtime", "exact-storage-roundtrip"]),
      ...sessionStorageRoundTripMarkers(replay.storageRoundTrip),
    ]),
    branchGraph: uniqueStrings([
      ...sessionBranchMarkers(sourceMatrix.branchAnchors, ["branch-graph", "exact-branch-side-effects"]),
      ...sessionStorageRoundTripMarkers(replay.storageRoundTrip),
    ]),
    compactionRecord: uniqueStrings([
      ...sessionBranchMarkers(sourceMatrix.branchAnchors, ["compaction-record", "exact-branch-side-effects"]),
      ...sessionStorageRoundTripMarkers(replay.storageRoundTrip),
      ...sessionProviderMetadataRoundTripMarkers(replay.providerMetadataRoundTrip),
    ]),
    paginationContext: sessionBranchMarkers(sourceMatrix.branchAnchors, ["pagination-context"]),
    providerMetadata: uniqueStrings([
      ...sessionBranchMarkers(sourceMatrix.branchAnchors, ["provider-metadata"]),
      ...sessionProviderMetadataRoundTripMarkers(replay.providerMetadataRoundTrip),
    ]),
    sourceAnchors: sourceMatrix.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    sessionAtomIDs: uniqueStrings([...sourceMatrix.coveredSessionAtomIDs, replay.profile.atomID]),
    sessionPortIDs: uniqueStrings([...sourceMatrix.coveredSessionPortIDs, ...replay.atoms.map((atom) => atom.portID)]),
    fixtureIDs: uniqueStrings([sourceMatrix.fixtureID, ...replay.fixtureIDs]),
    readbackRisk: "source-anchored-partial",
    knownLossiness: uniqueStrings([
      ...sourceMatrix.knownGaps,
      ...replay.knownGaps,
      ...replay.storageRoundTrip.knownGaps,
      ...replay.storageRoundTrip.lossyFields,
      ...replay.providerMetadataRoundTrip.knownGaps,
      ...replay.providerMetadataRoundTrip.lossyFields,
    ]),
  }
}

function sessionMessagePartReplayMetadata(profile: MessagePartProjectorProfile): MessagePartProjectorAtomDescriptor["replay"] {
  const replay = profile.product === "common" ?
    commonSessionMessagePartReplayAtomSnapshot(profile) :
    buildSessionMessagePartReplayAtomSnapshot(profile.product)
  return {
    ...replay,
    supportedSourceTypes: ["text", "reasoning", "tool_call", "tool_result", "compaction", "custom"],
    nativeTargetTypes: nativeTargetTypesFor(profile),
    lossyFields: uniqueStrings([...replay.lossyFields, ...profile.lossyTypes]),
  }
}

function commonSessionMessagePartReplayAtomSnapshot(profile: MessagePartProjectorProfile): SessionMessagePartReplayAtomSnapshot {
  return {
    key: "message-part-projector",
    atomID: profile.atomID,
    portID: "session.message-part-projector",
    flowStageID: "stream.project",
    nativeFixtureSource: profile.nativeFixtureSource,
    upstreamEvidenceRefs: ["common-session-message-part-contract"],
    fixtureID: "common-session-message-part:message-part-projector",
    scenarios: [
      {
        scenarioID: "common-transcript-part",
        direction: "round-trip",
        sourcePartTypes: ["text", "tool_call", "tool_result"],
        nativePartTypes: ["text", "tool_call", "tool_result"],
        observedShape: { partID: true, type: true, toolCallID: true, content: true },
        exactness: "exact",
        visibility: "observed",
      },
    ],
    roundTripFields: ["part.id", "part.type", "text", "toolCallID", "toolName"],
    oneWayExactFields: [],
    nativeOnlyFields: [],
    inferredFields: [],
    irrecoverableFields: [],
    lossyFields: [],
  }
}

function sessionMessagePartReplayScenarios(profile: MessagePartProjectorProfile): SessionMessagePartReplayScenario[] {
  const typeFor = (sourceType: string) => nativeTypeFor(profile, sourceType)
  return [
    {
      scenarioID: "assistant-text-roundtrip",
      direction: "round-trip",
      sourcePartTypes: ["text"],
      nativePartTypes: [typeFor("text")],
      observedShape: { partID: true, text: true, messageRole: "assistant", nativeRecord: nativeRecordShape(profile.product) },
      exactness: profile.lossyTypes.has("text") ? "semantic" : "exact",
      visibility: "observed",
    },
    {
      scenarioID: "reasoning-projection",
      direction: profile.lossyTypes.has("reasoning") ? "common-to-native" : "round-trip",
      sourcePartTypes: ["reasoning"],
      nativePartTypes: [typeFor("reasoning")],
      observedShape: { reasoningText: true, hiddenReasoning: profile.product !== "common", nativeRecord: nativeRecordShape(profile.product) },
      exactness: profile.lossyTypes.has("reasoning") ? "semantic" : "exact",
      visibility: "observed",
    },
    {
      scenarioID: "tool-call-lifecycle",
      direction: profile.lossyTypes.has("tool_call") ? "common-to-native" : "round-trip",
      sourcePartTypes: ["tool_call"],
      nativePartTypes: [typeFor("tool_call")],
      observedShape: { toolCallID: true, toolName: true, input: true, status: true, nativeLifecycle: toolLifecycleShape(profile.product) },
      exactness: profile.lossyTypes.has("tool_call") ? "semantic" : "exact",
      visibility: "observed",
    },
    {
      scenarioID: "tool-result-lifecycle",
      direction: profile.lossyTypes.has("tool_result") ? "common-to-native" : "round-trip",
      sourcePartTypes: ["tool_result"],
      nativePartTypes: [typeFor("tool_result")],
      observedShape: { toolCallID: true, toolName: true, content: true, isError: true, nativeLifecycle: toolLifecycleShape(profile.product) },
      exactness: profile.lossyTypes.has("tool_result") ? "semantic" : "exact",
      visibility: "observed",
    },
    {
      scenarioID: "compaction-record",
      direction: profile.nativeTypes.compaction ? "round-trip" : "common-to-native",
      sourcePartTypes: ["compaction"],
      nativePartTypes: [typeFor("compaction")],
      observedShape: { reason: true, summary: true, firstKeptMessageID: "partial", nativeRecord: nativeRecordShape(profile.product) },
      exactness: profile.lossyTypes.has("compaction") || !profile.nativeTypes.compaction ? "semantic" : "exact",
      visibility: "observed",
    },
    {
      scenarioID: "native-metadata-record",
      direction: "native-to-common",
      sourcePartTypes: ["custom"],
      nativePartTypes: sessionMessagePartNativeOnlyFields(profile.product),
      observedShape: { providerMetadata: "raw-only", storageRevision: "raw-only", eventIndex: "inferred" },
      exactness: "raw-only",
      visibility: "inferred",
    },
  ]
}

function sessionStorageRoundTripScenarios(product: SessionMessagePartReplayProduct): SessionStorageRoundTripScenario[] {
  const surfaces = sessionStorageRoundTripSurfaces(product)
  return [
    {
      scenarioID: "assistant-message-write-read",
      storageSurface: surfaces.messageStore,
      writeRecordTypes: surfaces.messageRecords,
      readbackRecordTypes: surfaces.messageReadback,
      observedShape: {
        messageID: true,
        role: "assistant",
        textPart: true,
        partOrder: "preserved",
        storageRevision: "partial",
      },
      exactness: "semantic",
      visibility: "observed",
    },
    {
      scenarioID: "tool-call-result-write-read",
      storageSurface: surfaces.toolStore,
      writeRecordTypes: surfaces.toolRecords,
      readbackRecordTypes: surfaces.toolReadback,
      observedShape: {
        toolCallID: true,
        toolName: true,
        input: "semantic",
        result: "semantic",
        lifecycleOrder: "partial",
      },
      exactness: "semantic",
      visibility: "observed",
    },
    {
      scenarioID: "compaction-record-write-read",
      storageSurface: surfaces.compactionStore,
      writeRecordTypes: surfaces.compactionRecords,
      readbackRecordTypes: surfaces.compactionReadback,
      observedShape: {
        summary: true,
        firstKeptMessageID: "partial",
        droppedMessageRange: "inferred",
        providerMetadata: "not-proven",
      },
      exactness: "semantic",
      visibility: "observed",
    },
    {
      scenarioID: "branch-lineage-readback",
      storageSurface: surfaces.branchStore,
      writeRecordTypes: surfaces.branchRecords,
      readbackRecordTypes: surfaces.branchReadback,
      observedShape: {
        parentSessionID: true,
        forkPointMessageID: "partial",
        activeLeaf: "inferred",
        transactionOrder: "not-replayed",
      },
      exactness: "inferred",
      visibility: "inferred",
    },
    {
      scenarioID: "provider-raw-metadata-readback",
      storageSurface: surfaces.providerMetadataStore,
      writeRecordTypes: surfaces.providerMetadataRecords,
      readbackRecordTypes: surfaces.providerMetadataReadback,
      observedShape: {
        providerMetadataPresence: true,
        rawProviderEnvelope: "raw-only",
        byteOffset: "irrecoverable",
        storagePrivateState: "not-proven",
      },
      exactness: "raw-only",
      visibility: "inferred",
    },
  ]
}

function sessionProviderMetadataRoundTripScenarios(product: SessionMessagePartReplayProduct): SessionProviderMetadataRoundTripScenario[] {
  const surfaces = sessionStorageRoundTripSurfaces(product)
  return [
    {
      scenarioID: "provider-raw-metadata-presence-readback",
      storageSurface: surfaces.providerMetadataStore,
      nativeMetadataRecords: surfaces.providerMetadataRecords,
      commonReadbackFields: surfaces.providerMetadataReadback,
      observedShape: {
        providerMetadataPresence: true,
        rawProviderEnvelope: "raw-only",
        providerRecordID: providerMetadataRecordIDShape(product),
        privateState: "not-replayed",
      },
      exactness: "raw-only",
      visibility: "inferred",
      lossiness: sessionProviderMetadataRoundTripLossyFields(product),
    },
    {
      scenarioID: "tool-result-provider-metadata-linkage",
      storageSurface: surfaces.toolStore,
      nativeMetadataRecords: uniqueStrings([...surfaces.toolRecords, ...surfaces.providerMetadataRecords]),
      commonReadbackFields: uniqueStrings([...surfaces.toolReadback, ...surfaces.providerMetadataReadback]),
      observedShape: {
        toolCallID: true,
        resultPartID: true,
        providerMetadataRef: "partial",
        writebackRecordID: "partial",
        transactionOrder: "not-replayed",
      },
      exactness: "semantic",
      visibility: "observed",
      lossiness: sessionProviderMetadataScenarioLossiness(product, ["native-session-writeback-record-id-partial"]),
    },
    {
      scenarioID: "compaction-provider-metadata-linkage",
      storageSurface: surfaces.compactionStore,
      nativeMetadataRecords: uniqueStrings([...surfaces.compactionRecords, ...surfaces.providerMetadataRecords]),
      commonReadbackFields: uniqueStrings([...surfaces.compactionReadback, ...surfaces.providerMetadataReadback]),
      observedShape: {
        compactionRecord: true,
        summary: true,
        providerMetadataRef: "partial",
        droppedMessageRange: "inferred",
      },
      exactness: "semantic",
      visibility: "inferred",
      lossiness: sessionProviderMetadataScenarioLossiness(product, ["compaction-provider-metadata-order-partial"]),
    },
    {
      scenarioID: "branch-lineage-provider-metadata-linkage",
      storageSurface: surfaces.branchStore,
      nativeMetadataRecords: uniqueStrings([...surfaces.branchRecords, ...surfaces.providerMetadataRecords]),
      commonReadbackFields: uniqueStrings([...surfaces.branchReadback, ...surfaces.providerMetadataReadback]),
      observedShape: {
        parentSessionID: true,
        forkPointMessageID: "partial",
        providerMetadataRef: "partial",
        lineageOrder: "inferred",
      },
      exactness: "inferred",
      visibility: "inferred",
      lossiness: sessionProviderMetadataScenarioLossiness(product, ["branch-lineage-id-roundtrip-partial"]),
    },
  ]
}

interface SessionStorageRoundTripSurfaces {
  messageStore: string
  messageRecords: string[]
  messageReadback: string[]
  toolStore: string
  toolRecords: string[]
  toolReadback: string[]
  compactionStore: string
  compactionRecords: string[]
  compactionReadback: string[]
  branchStore: string
  branchRecords: string[]
  branchReadback: string[]
  providerMetadataStore: string
  providerMetadataRecords: string[]
  providerMetadataReadback: string[]
}

function sessionStorageRoundTripSurfaces(product: SessionMessagePartReplayProduct): SessionStorageRoundTripSurfaces {
  if (product === "opencode") {
    return {
      messageStore: "sqlite-message-v2",
      messageRecords: ["message_v2", "assistant_part", "step_event"],
      messageReadback: ["session.messages", "assistant.parts"],
      toolStore: "sqlite-step-tool-parts",
      toolRecords: ["step-start", "tool", "step-finish"],
      toolReadback: ["tool-call-part", "tool-result-part"],
      compactionStore: "sqlite-compaction-records",
      compactionRecords: ["compaction-summary", "compaction-boundary"],
      compactionReadback: ["session.compaction"],
      branchStore: "sqlite-session-fork",
      branchRecords: ["parent_session_id", "fork_message_id"],
      branchReadback: ["branch-lineage"],
      providerMetadataStore: "sqlite-provider-raw-part-metadata",
      providerMetadataRecords: ["provider.raw_part_metadata", "event.sequence"],
      providerMetadataReadback: ["native-metadata-record"],
    }
  }
  if (product === "pi-mono") {
    return {
      messageStore: "jsonl-v3-session-tree",
      messageRecords: ["message_update", "jsonl-v3.message"],
      messageReadback: ["session-tree.active-leaf", "jsonl-v3.message_read"],
      toolStore: "jsonl-v3-tool-execution-events",
      toolRecords: ["tool_execution_start", "tool_execution_end"],
      toolReadback: ["tool_execution.readback"],
      compactionStore: "jsonl-v3-branch-summary",
      compactionRecords: ["branch_summary", "context_window_summary"],
      compactionReadback: ["branch-summary.readback"],
      branchStore: "jsonl-v3-leaf-tree",
      branchRecords: ["active_leaf", "parent_leaf"],
      branchReadback: ["leaf-tree.readback"],
      providerMetadataStore: "extension-provider-metadata",
      providerMetadataRecords: ["extension.provider_metadata", "event.timestamp"],
      providerMetadataReadback: ["provider-metadata.readback"],
    }
  }
  if (product === "nanobot") {
    return {
      messageStore: "workspace-sessions-jsonl",
      messageRecords: ["assistant_delta", "workspace-session.message"],
      messageReadback: ["workspace-session.readback", "channel.session_key"],
      toolStore: "workspace-tool-message-jsonl",
      toolRecords: ["tool", "tool_result"],
      toolReadback: ["tool-message.readback"],
      compactionStore: "goal-state-memory-summary",
      compactionRecords: ["goal_state", "history_reference"],
      compactionReadback: ["goal-state.readback"],
      branchStore: "channel-session-key",
      branchRecords: ["channel_key", "history_reference"],
      branchReadback: ["channel-lineage.readback"],
      providerMetadataStore: "workspace-private-sidecar-state",
      providerMetadataRecords: ["memory_reference", "workspace.file_offset"],
      providerMetadataReadback: ["memory-history-reference"],
    }
  }
  return {
    messageStore: "api-acp-session-records",
    messageRecords: ["message_delta", "api-message", "acp-part"],
    messageReadback: ["api-session.messages", "acp-message-parts"],
    toolStore: "api-acp-tool-records",
    toolRecords: ["tool_call", "tool_result"],
    toolReadback: ["acp-tool-call.readback", "acp-tool-result.readback"],
    compactionStore: "trajectory-compression-records",
    compactionRecords: ["trajectory_compression", "memory-summary"],
    compactionReadback: ["trajectory-compression.readback"],
    branchStore: "api-session-lineage",
    branchRecords: ["parent_session", "lineage_edge"],
    branchReadback: ["lineage.readback"],
    providerMetadataStore: "memory-session-search-references",
    providerMetadataRecords: ["api.trace_id", "memory.session_search_ref"],
    providerMetadataReadback: ["session-search-reference"],
  }
}

function sessionStorageRoundTripInferredFields(product: SessionMessagePartReplayProduct): string[] {
  if (product === "opencode") return ["sqlite-transaction-order", "assistant-part-row-version", "fork-before-message-boundary"]
  if (product === "pi-mono") return ["jsonl-v3-write-clock", "active-leaf-switch-boundary", "extension-provider-metadata-order"]
  if (product === "nanobot") return ["workspace-file-offset-order", "channel-history-link-boundary", "memory-reference-resolution"]
  return ["api-session-write-order", "acp-sequence-boundary", "session-search-reference-resolution"]
}

function sessionStorageRoundTripLossyFields(product: SessionMessagePartReplayProduct): string[] {
  const common = [
    "partial-session-storage-roundtrip",
    "native-storage-transaction-order-not-replayed",
    "provider-raw-metadata-roundtrip-not-proven",
    "branch-lineage-id-roundtrip-partial",
  ]
  if (product === "opencode") return [...common, "sqlite-row-version-not-replayed"]
  if (product === "pi-mono") return [...common, "extension-private-state-not-replayed"]
  if (product === "nanobot") return [...common, "workspace-private-sidecar-state-not-replayed"]
  return [...common, "session-search-ranking-context-not-replayed"]
}

function sessionProviderMetadataRoundTripInferredFields(product: SessionMessagePartReplayProduct): string[] {
  const common = ["provider-record-link-order", "provider-metadata-private-state", "native-storage-transaction-order"]
  if (product === "opencode") return [...common, "sqlite-provider-row-version", "event-sequence-clock"]
  if (product === "pi-mono") return [...common, "extension-provider-private-cache", "event-timestamp-clock"]
  if (product === "nanobot") return [...common, "workspace-sidecar-file-offset", "memory-reference-resolution"]
  return [...common, "api-trace-search-ranking-context", "session-search-reference-resolution"]
}

function sessionProviderMetadataRoundTripLossyFields(product: SessionMessagePartReplayProduct): string[] {
  const common = [
    "partial-session-provider-metadata-roundtrip",
    "provider-raw-metadata-roundtrip-not-proven",
    "provider-metadata-private-state-not-replayed",
    "native-storage-transaction-order-not-replayed",
    "branch-lineage-id-roundtrip-partial",
  ]
  if (product === "opencode") return [...common, "sqlite-row-version-not-replayed"]
  if (product === "pi-mono") return [...common, "extension-private-state-not-replayed"]
  if (product === "nanobot") return [...common, "workspace-private-sidecar-state-not-replayed"]
  return [...common, "session-search-ranking-context-not-replayed"]
}

function sessionProviderMetadataScenarioLossiness(product: SessionMessagePartReplayProduct, extra: string[]): string[] {
  return uniqueStrings([...sessionProviderMetadataRoundTripLossyFields(product), ...extra])
}

function providerMetadataRecordIDShape(product: SessionMessagePartReplayProduct): string {
  if (product === "opencode") return "sqlite-rowid"
  if (product === "pi-mono") return "jsonl-v3-record-id"
  if (product === "nanobot") return "workspace-file-offset"
  return "api-trace-id"
}

function messagePartProjectorProfileSnapshot(profile: MessagePartProjectorProfile): MessagePartProjectorProfileSnapshot {
  const nativeTypes = Object.entries(profile.nativeTypes)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .sort(([left], [right]) => left.localeCompare(right))
  return {
    product: profile.product,
    atomID: profile.atomID,
    nativeFixtureSource: profile.nativeFixtureSource,
    lossiness: profile.lossiness,
    nativeTypes: Object.fromEntries(nativeTypes),
    lossyTypes: [...profile.lossyTypes].sort(),
  }
}

function nativeTargetTypesFor(profile: MessagePartProjectorProfile): string[] {
  return uniqueStrings([
    ...Object.values(profile.nativeTypes).filter((value): value is string => typeof value === "string"),
    ...["text", "reasoning", "tool_call", "tool_result", "compaction"].map((sourceType) => nativeTypeFor(profile, sourceType)),
  ])
}

function sessionMessagePartRoundTripFields(product: MessagePartProjectionProduct): string[] {
  const common = ["part.id", "part.type", "message.role", "text.content"]
  if (product === "opencode") return [...common, "step-start.id", "step-finish.finishReason"]
  if (product === "pi-mono") return [...common, "jsonl-v3.message_id", "tool_execution.tool_call_id"]
  if (product === "nanobot") return [...common, "workspace-session.message_id", "channel.session_key"]
  if (product === "hermes-agent") return [...common, "api-message.id", "acp-part.kind"]
  return common
}

function sessionMessagePartOneWayExactFields(product: MessagePartProjectionProduct): string[] {
  if (product === "opencode") return ["message-v2.parts[].text", "assistant.part.order"]
  if (product === "pi-mono") return ["jsonl-v3.role", "jsonl-v3.content_delta"]
  if (product === "nanobot") return ["sessions-jsonl.role", "sessions-jsonl.content_delta"]
  if (product === "hermes-agent") return ["api-session.role", "acp.content_delta"]
  return []
}

function sessionMessagePartNativeOnlyFields(product: MessagePartProjectionProduct): string[] {
  if (product === "opencode") return ["sqlite.rowid", "event.sequence", "provider.raw_part_metadata"]
  if (product === "pi-mono") return ["jsonl-v3.record_id", "extension.provider_metadata", "event.timestamp"]
  if (product === "nanobot") return ["workspace.file_offset", "memory_reference", "history_reference"]
  if (product === "hermes-agent") return ["api.trace_id", "acp.sequence", "memory.session_search_ref"]
  return []
}

function sessionMessagePartInferredFields(product: MessagePartProjectionProduct): string[] {
  if (product === "opencode") return ["sqlite-transaction-order", "step-event-boundary"]
  if (product === "pi-mono") return ["jsonl-v3-provider-record-order", "extension-event-boundary"]
  if (product === "nanobot") return ["channel-visible-message-order", "memory-history-link-boundary"]
  if (product === "hermes-agent") return ["gateway-visible-message-order", "acp-memory-link-boundary"]
  return []
}

function sessionMessagePartIrrecoverableFields(product: MessagePartProjectionProduct): string[] {
  if (product === "opencode") return ["raw-provider-delta-byte-offset", "sqlite-internal-row-version"]
  if (product === "pi-mono") return ["raw-anthropic-provider-event", "extension-private-state"]
  if (product === "nanobot") return ["raw-openrouter-provider-event", "workspace-private-sidecar-state"]
  if (product === "hermes-agent") return ["gateway-private-provider-envelope", "session-search-ranking-context"]
  return []
}

function sessionMessagePartLossyFields(product: MessagePartProjectionProduct): string[] {
  const profile = messagePartProjectorRegistry[product]
  if (!profile) return []
  return uniqueStrings([
    "semantic-session-message-part-replay",
    "native-storage-roundtrip-partial",
    ...profile.lossyTypes,
    ...(product === "common" ? [] : sessionStorageRoundTripLossyFields(product)),
    ...(product === "common" ? [] : sessionProviderMetadataRoundTripLossyFields(product)),
    ...sessionMessagePartNativeOnlyFields(product),
    ...sessionMessagePartIrrecoverableFields(product),
  ])
}

function nativeRecordShape(product: MessagePartProjectionProduct): string {
  if (product === "opencode") return "sqlite-message-v2"
  if (product === "pi-mono") return "jsonl-v3"
  if (product === "nanobot") return "workspace-sessions-jsonl"
  if (product === "hermes-agent") return "api-acp-session-record"
  return "common-transcript"
}

function toolLifecycleShape(product: MessagePartProjectionProduct): string {
  if (product === "opencode") return "step-tool-parts"
  if (product === "pi-mono") return "tool_execution_start/end"
  if (product === "nanobot") return "tool-message-jsonl"
  if (product === "hermes-agent") return "tool_call/tool_result"
  return "tool_call/tool_result"
}

function sessionMessagePartUpstreamRef(product: SessionMessagePartReplayProduct): string {
  if (product === "opencode") return "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  if (product === "pi-mono") return "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  if (product === "nanobot") return "package:nanobot-ai@0.2.0"
  return "package:hermes-agent==0.15.1"
}

function sessionMessagePartUpstreamEvidenceRefs(product: SessionMessagePartReplayProduct): string[] {
  const base = sessionMessagePartUpstreamRef(product)
  if (product === "opencode") return [base, "sqlite-message-v2", "assistant-parts", "step-tool-parts", "compaction-records"]
  if (product === "pi-mono") return [base, "jsonl-v3-message-records", "tool-execution-events", "provider-metadata"]
  if (product === "nanobot") return [base, "workspace-sessions-jsonl", "channel-session-key", "memory-history-references"]
  return [base, "api-session-records", "acp-message-parts", "memory-session-search-references"]
}

function sessionBranchMarkers(
  anchors: ReadonlyArray<{
    branchID: string
    status: string
    exactDiffStatus?: string
    nativeParityClaim?: boolean
    localEvidenceRefs: string[]
    localMarkers: string[]
    nativeEvidenceRefs?: string[]
    fixtureIDs?: string[]
    knownGaps: string[]
  }>,
  branchIDs: string[],
): string[] {
  const selected = anchors.filter((anchor) => branchIDs.includes(anchor.branchID))
  return uniqueStrings(selected.flatMap((anchor) => [
    anchor.branchID,
    anchor.status,
    ...(anchor.exactDiffStatus ? [anchor.exactDiffStatus] : []),
    anchor.nativeParityClaim ? "native-parity-claimed" : "native-parity-not-claimed",
    ...anchor.localEvidenceRefs,
    ...anchor.localMarkers,
    ...(anchor.nativeEvidenceRefs ?? []),
    ...(anchor.fixtureIDs ?? []),
    ...anchor.knownGaps,
  ]))
}

function sessionMessagePartReplayMarkers(replay: SessionMessagePartReplaySnapshot): string[] {
  return uniqueStrings([
    replay.evidenceRef,
    ...replay.fixtureIDs,
    replay.profile.atomID,
    replay.profile.nativeFixtureSource,
    ...Object.values(replay.profile.nativeTypes),
    ...replay.profile.lossyTypes,
    ...replay.atoms.flatMap((atom) => [
      atom.key,
      atom.atomID,
      atom.portID,
      atom.flowStageID,
      atom.fixtureID,
      ...atom.upstreamEvidenceRefs,
      ...atom.roundTripFields,
      ...atom.oneWayExactFields,
      ...atom.nativeOnlyFields,
      ...atom.inferredFields,
      ...atom.irrecoverableFields,
      ...atom.lossyFields,
      ...atom.scenarios.flatMap((scenario) => [
        scenario.scenarioID,
        scenario.direction,
        scenario.exactness,
        scenario.visibility,
        ...scenario.sourcePartTypes,
        ...scenario.nativePartTypes,
        ...sessionObservedShapeMarkers(scenario.observedShape),
      ]),
    ]),
  ])
}

function sessionStorageRoundTripMarkers(snapshot: SessionStorageRoundTripSnapshot): string[] {
  return uniqueStrings([
    snapshot.evidenceRef,
    snapshot.fixtureID,
    ...snapshot.observedFields,
    ...snapshot.inferredFields,
    ...snapshot.lossyFields,
    ...snapshot.knownGaps,
    ...snapshot.scenarios.flatMap((scenario) => [
      scenario.scenarioID,
      scenario.storageSurface,
      scenario.exactness,
      scenario.visibility,
      ...scenario.writeRecordTypes,
      ...scenario.readbackRecordTypes,
      ...sessionObservedShapeMarkers(scenario.observedShape),
    ]),
  ])
}

function sessionProviderMetadataRoundTripMarkers(snapshot: SessionProviderMetadataRoundTripSnapshot): string[] {
  return uniqueStrings([
    snapshot.evidenceRef,
    snapshot.fixtureID,
    ...snapshot.observedFields,
    ...snapshot.inferredFields,
    ...snapshot.lossyFields,
    ...snapshot.knownGaps,
    ...snapshot.scenarios.flatMap((scenario) => [
      scenario.scenarioID,
      scenario.storageSurface,
      scenario.exactness,
      scenario.visibility,
      ...scenario.nativeMetadataRecords,
      ...scenario.commonReadbackFields,
      ...scenario.lossiness,
      ...sessionObservedShapeMarkers(scenario.observedShape),
    ]),
  ])
}

function sessionObservedShapeMarkers(shape: Record<string, unknown>): string[] {
  return Object.entries(shape).flatMap(([key, value]) => [key, String(value)])
}

function sessionGateContains(values: string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

function nativeTypeFor(profile: MessagePartProjectorProfile, sourceType: string): string {
  return profile.nativeTypes[sourceType] ?? (profile.product === "common" ? sourceType : sourceType.replace(/_/g, "-"))
}

function normalizeOpenCodeSessionLivePath(value: string, input: { cwd: string }): string {
  const cwd = resolve(input.cwd)
  const normalized = resolve(value)
  if (normalized === cwd) return "<cwd>"
  if (normalized.startsWith(`${cwd}${sep}`)) {
    return `<cwd>/${normalized.slice(cwd.length + 1).split(sep).join("/")}`
  }
  return normalized.split(sep).join("/")
}

function isLossyProjection(profile: MessagePartProjectorProfile, sourceType: string): boolean {
  return profile.lossyTypes.has(sourceType)
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort()
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
