import { createHash } from "node:crypto"
import { existsSync, mkdirSync, realpathSync } from "node:fs"
import { resolve, sep } from "node:path"
import { createID } from "./ids.ts"
import type { LegoPortContractFixture } from "./module"

export type OpenCodeIdentitySourceRefID =
  | "session-service"
  | "contracts-id-helper"
  | "local-identity-runtime-projection"
  | "local-identity-live-runtime-fixture"

const OPENCODE_IDENTITY_NATIVE_EXACT_EVIDENCE_REFS = [
  "conformance:opencode-identity-id-generator-native-exact-fixture",
  "conformance:opencode-identity-clock-title-native-exact-fixture",
  "conformance:opencode-identity-workspace-session-path-native-exact-fixture",
  "conformance:opencode-identity-native-exact-fixture",
  "identity-native-exact:opencode",
] as const

const OPENCODE_IDENTITY_NATIVE_EXACT_FIXTURE_IDS = [
  "opencode-identity:id-generator-native-exact-fixture",
  "opencode-identity:clock-title-native-exact-fixture",
  "opencode-identity:workspace-session-path-native-exact-fixture",
  "opencode-identity:native-exact-fixture",
] as const

export interface OpenCodeIdentitySourceRef {
  id: OpenCodeIdentitySourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11" | "local-source:2026-06-12"
}

export type OpenCodeIdentitySourceMatrixBranchID =
  | "session-title-format"
  | "session-path-workspace"
  | "local-id-kind-serialization"
  | "upstream-id-generator-runtime"
  | "exact-clock-timestamp-format"
  | "workspace-filesystem-side-effects"

export type OpenCodeIdentitySourceMatrixBranchStatus = "partial" | "missing"

export interface OpenCodeIdentitySourceMatrixBranchAnchor {
  branchID: OpenCodeIdentitySourceMatrixBranchID
  status: OpenCodeIdentitySourceMatrixBranchStatus
  sourceRefIDs: OpenCodeIdentitySourceRefID[]
  identityAtomIDs: string[]
  identityPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface OpenCodeIdentitySourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-identity-source-matrix"
  fixtureID: "opencode-identity:source-matrix"
  sourceRefs: OpenCodeIdentitySourceRef[]
  branchAnchors: OpenCodeIdentitySourceMatrixBranchAnchor[]
  partialBranchIDs: OpenCodeIdentitySourceMatrixBranchID[]
  missingBranchIDs: OpenCodeIdentitySourceMatrixBranchID[]
  coveredIdentityAtomIDs: string[]
  coveredIdentityPortIDs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeIdentityRuntimeProjectionEvent =
  | {
    type: "id.generated"
    idKind: string
    idValue: string
    source?: string
    sequence: number
  }
  | {
    type: "clock.timestamp"
    formatted: string
    title?: string
    timezone?: string
    sequence: number
  }
  | {
    type: "workspace.path"
    cwd: string
    sessionPath: string
    realpath?: string
    fsChecks?: string[]
    sequence: number
  }

export interface OpenCodeIdentityRuntimeProjection {
  schemaVersion: 1
  fixtureID: "opencode-identity:runtime-projection"
  evidenceRef: "conformance:opencode-identity-runtime-projection"
  coveredBranchIDs: Array<Extract<OpenCodeIdentitySourceMatrixBranchID, "upstream-id-generator-runtime" | "exact-clock-timestamp-format" | "workspace-filesystem-side-effects">>
  retainedFields: string[]
  lossyFields: string[]
  idRuntime: Array<{ idKind: string; idPrefix: string | null; idLength: number; source: string | null; sequence: number }>
  clockRuntime: Array<{ formatted: string; titleObserved: boolean; timezone: string | null; sequence: number }>
  workspaceRuntime: Array<{ cwd: string; sessionPath: string; realpathObserved: boolean; fsChecks: string[]; sequence: number }>
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeIdentityLiveRuntimeFixtureInput {
  cwd: string
  seeds?: {
    session?: string
    message?: string
    part?: string
    workspace?: string
  }
  now?: string | Date
  timezone?: string
  createSessionDirectory?: boolean
}

export interface OpenCodeIdentityLiveRuntimeFixture {
  schemaVersion: 1
  fixtureID: "opencode-identity:live-runtime-fixture"
  evidenceRef: "conformance:opencode-identity-live-runtime-fixture"
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  exactDiffStatus: "live-runtime-partial"
  nativeParityClaim: false
  capturedBranchIDs: OpenCodeIdentitySourceMatrixBranchID[]
  retainedFields: string[]
  lossyFields: string[]
  idReadback: Array<{
    kind: "session" | "message" | "part" | "workspace"
    value: string
    prefix: string | null
    length: number
    seedProvided: boolean
    sequence: number
  }>
  clockReadback: {
    isoTimestamp: string
    timezone: string
    defaultTitle: string
    isDefaultTitle: boolean
    sequence: number
  }
  workspaceReadback: {
    cwd: string
    realpath: string | null
    sessionPath: string
    sessionDirectoryBeforeExists: boolean
    sessionDirectoryAfterExists: boolean
    fsChecks: string[]
    sequence: number
  }
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeIdentityLiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeIdentityLiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeIdentityLiveRuntimeFixtureIssue[]
}

const OPENCODE_IDENTITY_SOURCE_REFS: OpenCodeIdentitySourceRef[] = [
  {
    id: "session-service",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/session.ts",
    symbols: ["createDefaultTitle", "isDefaultTitle", "sessionPath"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "contracts-id-helper",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/ids.ts",
    symbols: ["createID", "formatUuid", "uuidv7"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-identity-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["projectOpenCodeIdentityRuntimeProjection", "OpenCodeIdentityRuntimeProjection"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-identity-live-runtime-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["captureOpenCodeIdentityLiveRuntimeFixture", "verifyOpenCodeIdentityLiveRuntimeFixture"],
    evidence: "local-source:2026-06-12",
  },
]

export function projectOpenCodeIdentityRuntimeProjection(
  events: OpenCodeIdentityRuntimeProjectionEvent[],
): OpenCodeIdentityRuntimeProjection {
  const idRuntime = events
    .filter((event): event is Extract<OpenCodeIdentityRuntimeProjectionEvent, { type: "id.generated" }> => event.type === "id.generated")
    .map((event) => ({
      idKind: event.idKind,
      idPrefix: event.idValue.includes("_") ? event.idValue.split("_")[0] ?? null : null,
      idLength: event.idValue.length,
      source: typeof event.source === "string" && event.source.length > 0 ? event.source : null,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.idKind.localeCompare(right.idKind))

  const clockRuntime = events
    .filter((event): event is Extract<OpenCodeIdentityRuntimeProjectionEvent, { type: "clock.timestamp" }> => event.type === "clock.timestamp")
    .map((event) => ({
      formatted: event.formatted,
      titleObserved: typeof event.title === "string" && event.title.length > 0,
      timezone: typeof event.timezone === "string" && event.timezone.length > 0 ? event.timezone : null,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.formatted.localeCompare(right.formatted))

  const workspaceRuntime = events
    .filter((event): event is Extract<OpenCodeIdentityRuntimeProjectionEvent, { type: "workspace.path" }> => event.type === "workspace.path")
    .map((event) => ({
      cwd: event.cwd,
      sessionPath: event.sessionPath,
      realpathObserved: typeof event.realpath === "string" && event.realpath.length > 0,
      fsChecks: uniqueStrings(event.fsChecks ?? []),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.sessionPath.localeCompare(right.sessionPath))

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-identity:runtime-projection" as const,
    evidenceRef: "conformance:opencode-identity-runtime-projection" as const,
    coveredBranchIDs: [
      "upstream-id-generator-runtime",
      "exact-clock-timestamp-format",
      "workspace-filesystem-side-effects",
    ] as OpenCodeIdentityRuntimeProjection["coveredBranchIDs"],
    retainedFields: [
      "idKind",
      "idPrefix",
      "idLength",
      "source",
      "sequence",
      "formatted",
      "titleObserved",
      "timezone",
      "cwd",
      "sessionPath",
      "realpathObserved",
      "fsChecks",
    ],
    lossyFields: [
      "native id generator entropy source",
      "raw generated id value",
      "wall-clock timestamp instant",
      "locale/timezone environment side effects",
      "workspace realpath syscall side effects",
      "session directory fs create/read ordering",
    ],
    idRuntime,
    clockRuntime,
    workspaceRuntime,
    knownGaps: [
      "opencode-upstream-id-generator-runtime-not-replayed",
      "opencode-exact-clock-timestamp-format-not-proven",
      "opencode-workspace-filesystem-side-effects-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeIdentityLiveRuntimeFixture(
  input: OpenCodeIdentityLiveRuntimeFixtureInput,
): OpenCodeIdentityLiveRuntimeFixture {
  const cwd = resolve(input.cwd)
  const seeds = {
    session: input.seeds?.session ?? "01HYOPENCODESESSION",
    message: input.seeds?.message ?? "01HYOPENCODEMESSAGE",
    part: input.seeds?.part ?? "01HYOPENCODEPART",
    workspace: input.seeds?.workspace ?? "01HYOPENCODEWORKSPACE",
  }
  const sessionID = createID("session", seeds.session)
  const messageID = createID("message", seeds.message)
  const partID = createID("part", seeds.part)
  const workspaceID = createID("workspace", seeds.workspace)
  const now = input.now instanceof Date ? input.now : new Date(input.now ?? "2026-06-12T00:00:00.000Z")
  const defaultTitle = "New Session"
  const sessionDirectory = resolve(cwd, ".opencode", "session", sessionID)
  const beforeExists = existsSync(sessionDirectory)
  if (input.createSessionDirectory !== false) {
    mkdirSync(sessionDirectory, { recursive: true })
  }
  const afterExists = existsSync(sessionDirectory)
  const cwdRealpath = safeRealpath(cwd)
  const pathInput = { cwd }
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-identity:live-runtime-fixture" as const,
    evidenceRef: "conformance:opencode-identity-live-runtime-fixture" as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    nativeParityClaim: false as const,
    capturedBranchIDs: [
      "session-title-format",
      "session-path-workspace",
      "local-id-kind-serialization",
      "upstream-id-generator-runtime",
      "exact-clock-timestamp-format",
      "workspace-filesystem-side-effects",
    ] as OpenCodeIdentitySourceMatrixBranchID[],
    retainedFields: [
      "seeded local ID values and prefixes",
      "ISO clock readback",
      "default title predicate",
      "normalized workspace/session path",
      "realpath readback",
      "session directory existence before/after mkdir",
    ],
    lossyFields: [
      "upstream native ID entropy source",
      "upstream session title runtime side effects",
      "exact upstream clock locale/timezone environment",
      "upstream workspace resolver syscall ordering",
      "native persisted session row readback",
    ],
    idReadback: [
      identityLiveIDReadback("session", sessionID, input.seeds?.session, 1),
      identityLiveIDReadback("message", messageID, input.seeds?.message, 2),
      identityLiveIDReadback("part", partID, input.seeds?.part, 3),
      identityLiveIDReadback("workspace", workspaceID, input.seeds?.workspace, 4),
    ],
    clockReadback: {
      isoTimestamp: now.toISOString(),
      timezone: input.timezone ?? "UTC",
      defaultTitle,
      isDefaultTitle: defaultTitle === "New Session",
      sequence: 5,
    },
    workspaceReadback: {
      cwd: normalizeOpenCodeIdentityLivePath(cwd, pathInput),
      realpath: cwdRealpath ? normalizeOpenCodeIdentityLivePath(cwdRealpath, pathInput) : null,
      sessionPath: normalizeOpenCodeIdentityLivePath(sessionDirectory, pathInput),
      sessionDirectoryBeforeExists: beforeExists,
      sessionDirectoryAfterExists: afterExists,
      fsChecks: uniqueStrings(["exists:before", input.createSessionDirectory === false ? "mkdir:skipped" : "mkdir:recursive", "exists:after", cwdRealpath ? "realpath" : "realpath:unavailable"]),
      sequence: 6,
    },
    knownGaps: [
      "opencode-upstream-native-identity-runtime-not-spawned",
      "opencode-upstream-id-generator-entropy-not-proven",
      "opencode-exact-upstream-clock-locale-timezone-not-proven",
      "opencode-workspace-filesystem-side-effects-not-upstream-exact",
      "opencode-persisted-session-title-readback-not-proven",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeIdentityLiveRuntimeFixture(
  fixture: OpenCodeIdentityLiveRuntimeFixture,
): OpenCodeIdentityLiveRuntimeFixtureVerification {
  const issues: OpenCodeIdentityLiveRuntimeFixtureIssue[] = []
  if (fixture.fixtureID !== "opencode-identity:live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-identity-live-runtime-fixture") {
    issues.push({
      id: "opencode-identity-live-runtime-fixture.identity",
      message: "OpenCode identity live runtime fixture has an unexpected fixture or evidence ID.",
    })
  }
  if (fixture.exactDiffStatus !== "live-runtime-partial" || fixture.nativeParityClaim !== false) {
    issues.push({
      id: "opencode-identity-live-runtime-fixture.native-claim",
      message: "OpenCode identity live runtime fixture must stay partial and cannot claim native parity.",
    })
  }
  for (const branchID of ["session-title-format", "session-path-workspace", "local-id-kind-serialization", "upstream-id-generator-runtime", "exact-clock-timestamp-format", "workspace-filesystem-side-effects"] as const) {
    if (!fixture.capturedBranchIDs.includes(branchID)) {
      issues.push({
        id: `opencode-identity-live-runtime-fixture.missing-${branchID}`,
        message: `OpenCode identity live runtime fixture no longer captures ${branchID}.`,
      })
    }
  }
  for (const [kind, prefix] of [["session", "ses"], ["message", "msg"], ["part", "prt"], ["workspace", "ws"]] as const) {
    const readback = fixture.idReadback.find((item) => item.kind === kind)
    if (!readback || readback.prefix !== prefix || !readback.value.startsWith(`${prefix}_`) || readback.length <= prefix.length + 1) {
      issues.push({
        id: `opencode-identity-live-runtime-fixture.id-${kind}`,
        message: `OpenCode identity live runtime fixture no longer captures a valid ${kind} ID readback.`,
      })
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(fixture.clockReadback.isoTimestamp) || fixture.clockReadback.defaultTitle !== "New Session" || fixture.clockReadback.isDefaultTitle !== true) {
    issues.push({
      id: "opencode-identity-live-runtime-fixture.clock-title",
      message: "OpenCode identity live runtime fixture no longer captures ISO clock and default title readback.",
    })
  }
  if (
    fixture.workspaceReadback.cwd !== "<cwd>" ||
    !fixture.workspaceReadback.sessionPath.startsWith("<cwd>/.opencode/session/ses_") ||
    fixture.workspaceReadback.sessionDirectoryAfterExists !== true ||
    !fixture.workspaceReadback.fsChecks.includes("mkdir:recursive") ||
    !fixture.workspaceReadback.fsChecks.includes("realpath")
  ) {
    issues.push({
      id: "opencode-identity-live-runtime-fixture.workspace",
      message: "OpenCode identity live runtime fixture no longer captures workspace/session path and filesystem readback.",
    })
  }
  if (
    !fixture.knownGaps.includes("opencode-upstream-native-identity-runtime-not-spawned") ||
    !fixture.knownGaps.includes("opencode-workspace-filesystem-side-effects-not-upstream-exact")
  ) {
    issues.push({
      id: "opencode-identity-live-runtime-fixture.native-gaps",
      message: "OpenCode identity live runtime fixture lost the upstream native exact-diff blockers.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function openCodeIdentitySourceBranchAnchor(input: OpenCodeIdentitySourceMatrixBranchAnchor): OpenCodeIdentitySourceMatrixBranchAnchor {
  return input
}

export function buildOpenCodeIdentitySourceMatrixSnapshot(): OpenCodeIdentitySourceMatrixSnapshot {
  const branchAnchors: OpenCodeIdentitySourceMatrixBranchAnchor[] = [
    openCodeIdentitySourceBranchAnchor({
      branchID: "session-title-format",
      status: "partial",
      sourceRefIDs: ["session-service", "local-identity-live-runtime-fixture"],
      identityAtomIDs: ["opencode.identity.clock-format"],
      identityPortIDs: ["identity.clock"],
      localEvidenceRefs: uniqueStrings([
        "opencode-identity:source-matrix",
        "opencode-identity:live-runtime-fixture",
        "conformance:opencode-identity-clock-title-native-exact-fixture",
        "opencode-identity:clock-title-native-exact-fixture",
        "conformance:opencode-identity-native-exact-fixture",
        "identity-native-exact:opencode",
        "opencode-identity:native-exact-fixture",
      ]),
      localMarkers: ["createDefaultTitle", "isDefaultTitle", "session-title", "identity-live:title-readback", "clock-title:native-exact"],
      knownGaps: ["opencode-title-format-live-session-runtime-not-replayed", "opencode-persisted-session-title-readback-not-proven"],
    }),
    openCodeIdentitySourceBranchAnchor({
      branchID: "session-path-workspace",
      status: "partial",
      sourceRefIDs: ["session-service", "local-identity-live-runtime-fixture"],
      identityAtomIDs: ["opencode.identity.workspace-resolver"],
      identityPortIDs: ["identity.workspace-resolver"],
      localEvidenceRefs: uniqueStrings([
        "opencode-identity:source-matrix",
        "opencode-identity:live-runtime-fixture",
        "conformance:opencode-identity-workspace-session-path-native-exact-fixture",
        "opencode-identity:workspace-session-path-native-exact-fixture",
        "conformance:opencode-identity-native-exact-fixture",
        "identity-native-exact:opencode",
        "opencode-identity:native-exact-fixture",
      ]),
      localMarkers: ["sessionPath", "workspace", "session-directory", "identity-live:session-directory-readback", "workspace-session-path:native-exact"],
      knownGaps: ["opencode-workspace-realpath-and-fs-side-effects-not-replayed", "opencode-workspace-filesystem-side-effects-not-upstream-exact"],
    }),
    openCodeIdentitySourceBranchAnchor({
      branchID: "local-id-kind-serialization",
      status: "partial",
      sourceRefIDs: ["contracts-id-helper", "session-service", "local-identity-live-runtime-fixture"],
      identityAtomIDs: ["opencode.identity.id-generator"],
      identityPortIDs: ["identity.id-generator"],
      localEvidenceRefs: uniqueStrings([
        "contracts-schema:id-generator",
        "opencode-identity:source-matrix",
        "opencode-identity:live-runtime-fixture",
        "conformance:opencode-identity-id-generator-native-exact-fixture",
        "opencode-identity:id-generator-native-exact-fixture",
        "conformance:opencode-identity-native-exact-fixture",
        "identity-native-exact:opencode",
        "opencode-identity:native-exact-fixture",
      ]),
      localMarkers: ["createID", "uuidv7", "typed-id", "sessionID", "identity-live:id-readback", "id-generator:native-exact"],
      knownGaps: ["opencode-upstream-id-generator-runtime-not-replayed", "opencode-upstream-id-generator-entropy-not-proven"],
    }),
    openCodeIdentitySourceBranchAnchor({
      branchID: "upstream-id-generator-runtime",
      status: "partial",
      sourceRefIDs: ["session-service", "local-identity-runtime-projection", "local-identity-live-runtime-fixture"],
      identityAtomIDs: ["opencode.identity.id-generator"],
      identityPortIDs: ["identity.id-generator"],
      localEvidenceRefs: uniqueStrings([
        "opencode-identity:source-matrix",
        "opencode-identity:runtime-projection",
        "opencode-identity:live-runtime-fixture",
        "conformance:opencode-identity-id-generator-native-exact-fixture",
        "opencode-identity:id-generator-native-exact-fixture",
        "conformance:opencode-identity-native-exact-fixture",
        "identity-native-exact:opencode",
        "opencode-identity:native-exact-fixture",
      ]),
      localMarkers: ["id-runtime:projected", "id-prefix-length:retained", "identity-live:seeded-id-readback", "id-entropy:not-exact", "id-generator:native-exact"],
      knownGaps: ["opencode-upstream-id-generator-runtime-not-replayed", "opencode-upstream-native-identity-runtime-not-spawned"],
    }),
    openCodeIdentitySourceBranchAnchor({
      branchID: "exact-clock-timestamp-format",
      status: "partial",
      sourceRefIDs: ["session-service", "local-identity-runtime-projection", "local-identity-live-runtime-fixture"],
      identityAtomIDs: ["opencode.identity.clock-format"],
      identityPortIDs: ["identity.clock"],
      localEvidenceRefs: uniqueStrings([
        "opencode-identity:source-matrix",
        "opencode-identity:runtime-projection",
        "opencode-identity:live-runtime-fixture",
        "conformance:opencode-identity-clock-title-native-exact-fixture",
        "opencode-identity:clock-title-native-exact-fixture",
        "conformance:opencode-identity-native-exact-fixture",
        "identity-native-exact:opencode",
        "opencode-identity:native-exact-fixture",
      ]),
      localMarkers: ["clock-runtime:projected", "timestamp-format:partial", "identity-live:iso-clock-readback", "wall-clock:not-exact", "clock-title:native-exact"],
      knownGaps: ["opencode-exact-clock-timestamp-format-not-proven", "opencode-exact-upstream-clock-locale-timezone-not-proven"],
    }),
    openCodeIdentitySourceBranchAnchor({
      branchID: "workspace-filesystem-side-effects",
      status: "partial",
      sourceRefIDs: ["session-service", "local-identity-runtime-projection", "local-identity-live-runtime-fixture"],
      identityAtomIDs: ["opencode.identity.workspace-resolver"],
      identityPortIDs: ["identity.workspace-resolver"],
      localEvidenceRefs: uniqueStrings([
        "opencode-identity:source-matrix",
        "opencode-identity:runtime-projection",
        "opencode-identity:live-runtime-fixture",
        "conformance:opencode-identity-workspace-session-path-native-exact-fixture",
        "opencode-identity:workspace-session-path-native-exact-fixture",
        "conformance:opencode-identity-native-exact-fixture",
        "identity-native-exact:opencode",
        "opencode-identity:native-exact-fixture",
      ]),
      localMarkers: ["workspace-fs-side-effects:projected", "realpath:partial", "identity-live:mkdir-readback", "fs-side-effects:not-exact", "workspace-session-path:native-exact"],
      knownGaps: ["opencode-workspace-filesystem-side-effects-not-replayed", "opencode-workspace-filesystem-side-effects-not-upstream-exact"],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-identity-source-matrix" as const,
    fixtureID: "opencode-identity:source-matrix" as const,
    sourceRefs: OPENCODE_IDENTITY_SOURCE_REFS,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredIdentityAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.identityAtomIDs)),
    coveredIdentityPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.identityPortIDs)),
    nativeEvidenceRefs: uniqueStrings([
      "conformance:opencode-identity-source-matrix",
      ...OPENCODE_IDENTITY_NATIVE_EXACT_EVIDENCE_REFS,
    ]),
    fixtureIDs: uniqueStrings([
      "opencode-identity:source-matrix",
      ...OPENCODE_IDENTITY_NATIVE_EXACT_FIXTURE_IDS,
    ]),
    knownGaps: uniqueStrings([
      "opencode-identity-source-matrix-covered-by-partial-fixture",
      "opencode-identity-live-runtime-fixture-partial-native-gap",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type ProductIdentitySourceMatrixProduct = "pi" | "nanobot" | "hermes"

type ProductIdentityPinnedRepo = "earendil-works/pi" | "HKUDS/nanobot" | "NousResearch/hermes-agent"
type ProductIdentityPinnedRef =
  | "7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  | "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  | "92a567db2d7a5031df8211efbfdad864c2f51faf"
type ProductIdentityUpstreamRef =
  | "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  | "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  | "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
type ProductIdentityEvidenceRef =
  | "conformance:pi-identity-source-matrix"
  | "conformance:nanobot-identity-source-matrix"
  | "conformance:hermes-identity-source-matrix"
type ProductIdentityFixtureID = "pi-identity:source-matrix" | "nanobot-identity:source-matrix" | "hermes-identity:source-matrix"
type ProductIdentitySourceRefID =
  | "pi-session-uuid"
  | "pi-initial-message"
  | "pi-local-identity-atoms"
  | "nanobot-config-paths"
  | "nanobot-goal-state"
  | "nanobot-local-identity-atoms"
  | "hermes-runtime-helpers"
  | "hermes-acp-session"
  | "hermes-local-identity-atoms"
  | "contracts-port-fixtures"

export interface ProductIdentitySourceRef {
  id: ProductIdentitySourceRefID
  repo: ProductIdentityPinnedRepo | "helix/local"
  ref: ProductIdentityPinnedRef | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11"
}

export type ProductIdentitySourceMatrixBranchID =
  | "id-format-surface"
  | "timestamp-format-surface"
  | "workspace-path-surface"
  | "title-serialization-surface"
  | "upstream-id-generator-runtime"
  | "exact-clock-runtime-format"
  | "workspace-filesystem-side-effects"

export type ProductIdentitySourceMatrixBranchStatus = "partial" | "missing"

export interface ProductIdentitySourceMatrixBranchAnchor {
  branchID: ProductIdentitySourceMatrixBranchID
  status: ProductIdentitySourceMatrixBranchStatus
  sourceRefIDs: ProductIdentitySourceRefID[]
  identityAtomIDs: string[]
  identityPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface ProductIdentitySourceMatrixSnapshot {
  schemaVersion: 1
  product: ProductIdentitySourceMatrixProduct
  upstreamRef: ProductIdentityUpstreamRef
  pinnedRepo: ProductIdentityPinnedRepo
  pinnedRef: ProductIdentityPinnedRef
  evidenceRef: ProductIdentityEvidenceRef
  fixtureID: ProductIdentityFixtureID
  sourceRefs: ProductIdentitySourceRef[]
  branchAnchors: ProductIdentitySourceMatrixBranchAnchor[]
  partialBranchIDs: ProductIdentitySourceMatrixBranchID[]
  missingBranchIDs: ProductIdentitySourceMatrixBranchID[]
  coveredIdentityAtomIDs: string[]
  coveredIdentityPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

interface ProductIdentitySourceMatrixConfig {
  product: ProductIdentitySourceMatrixProduct
  atomPrefix: "pi" | "nanobot" | "hermes"
  upstreamRef: ProductIdentityUpstreamRef
  pinnedRepo: ProductIdentityPinnedRepo
  pinnedRef: ProductIdentityPinnedRef
  evidenceRef: ProductIdentityEvidenceRef
  fixtureID: ProductIdentityFixtureID
  sourceRefs: ProductIdentitySourceRef[]
  partialRefs: {
    id: ProductIdentitySourceRefID[]
    timestamp: ProductIdentitySourceRefID[]
    workspace: ProductIdentitySourceRefID[]
    title: ProductIdentitySourceRefID[]
  }
  localMarkers: {
    id: string[]
    timestamp: string[]
    workspace: string[]
    title: string[]
  }
  missingRuntimeGaps: {
    id: string
    clock: string
    workspace: string
  }
}

const PRODUCT_IDENTITY_SOURCE_MATRIX_CONFIGS: Record<ProductIdentitySourceMatrixProduct, ProductIdentitySourceMatrixConfig> = {
  pi: {
    product: "pi",
    atomPrefix: "pi",
    upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    pinnedRepo: "earendil-works/pi",
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    evidenceRef: "conformance:pi-identity-source-matrix",
    fixtureID: "pi-identity:source-matrix",
    sourceRefs: [
      {
        id: "pi-session-uuid",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/agent/src/harness/session/uuid.ts",
        symbols: ["fillRandomBytes", "uuidv7", "formatUuid"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "pi-initial-message",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/src/cli/initial-message.ts",
        symbols: ["InitialMessageInput", "InitialMessageResult", "buildInitialMessage"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "pi-local-identity-atoms",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/extension-atoms.ts",
        symbols: ["pi.identity.id-generator", "pi.identity.clock-format", "pi.identity.workspace-resolver"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "contracts-port-fixtures",
        repo: "helix/local",
        ref: "current",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: ["buildPiIdentitySourceMatrixSnapshot", "identity.id-generator", "identity.clock", "identity.workspace-resolver"],
        evidence: "local-source:2026-06-11",
      },
    ],
    partialRefs: {
      id: ["pi-session-uuid", "contracts-port-fixtures"],
      timestamp: ["pi-session-uuid", "pi-initial-message"],
      workspace: ["pi-initial-message"],
      title: ["pi-initial-message"],
    },
    localMarkers: {
      id: ["uuidv7", "formatUuid", "JSONL-session-id"],
      timestamp: ["timestamp-format", "initial-message-runtime-context"],
      workspace: ["workspace-resolver", "cwd-initial-message"],
      title: ["initial-message-title", "serialization-input"],
    },
    missingRuntimeGaps: {
      id: "pi-live-session-id-generator-runtime-not-replayed",
      clock: "pi-exact-clock-format-runtime-not-proven",
      workspace: "pi-workspace-filesystem-side-effects-not-replayed",
    },
  },
  nanobot: {
    product: "nanobot",
    atomPrefix: "nanobot",
    upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    pinnedRepo: "HKUDS/nanobot",
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    evidenceRef: "conformance:nanobot-identity-source-matrix",
    fixtureID: "nanobot-identity:source-matrix",
    sourceRefs: [
      {
        id: "nanobot-config-paths",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/config/paths.py",
        symbols: [
          "get_config_path",
          "get_data_dir",
          "get_runtime_subdir",
          "get_media_dir",
          "get_cron_dir",
          "get_logs_dir",
          "get_webui_dir",
          "get_workspace_path",
          "is_default_workspace",
          "get_cli_history_path",
          "get_bridge_install_dir",
          "get_legacy_sessions_dir",
        ],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "nanobot-goal-state",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/session/goal_state.py",
        symbols: [
          "GOAL_STATE_KEY",
          "_LEGACY_GOAL_STATE_SESSION_KEY",
          "_MAX_OBJECTIVE_IN_RUNTIME",
          "_MAX_OBJECTIVE_WS",
          "_session_goal_raw",
          "discard_legacy_goal_state_key",
          "goal_state_raw",
          "sustained_goal_active",
          "parse_goal_state",
          "goal_state_runtime_lines",
          "goal_state_ws_blob",
          "runner_wall_llm_timeout_s",
        ],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "nanobot-local-identity-atoms",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-nanobot/src/nanobot-atoms.ts",
        symbols: ["nanobot.identity.id-generator", "nanobot.identity.clock-format", "nanobot.identity.workspace-resolver"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "contracts-port-fixtures",
        repo: "helix/local",
        ref: "current",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: ["buildNanobotIdentitySourceMatrixSnapshot", "identity.id-generator", "identity.clock", "identity.workspace-resolver"],
        evidence: "local-source:2026-06-11",
      },
    ],
    partialRefs: {
      id: ["nanobot-goal-state", "contracts-port-fixtures"],
      timestamp: ["nanobot-goal-state"],
      workspace: ["nanobot-config-paths"],
      title: ["nanobot-goal-state", "nanobot-config-paths"],
    },
    localMarkers: {
      id: ["goal-state-session-key", "channel-session-id"],
      timestamp: ["runner-wall-timeout", "runtime-lines"],
      workspace: ["get_workspace_path", "is_default_workspace", "cli-history-path"],
      title: ["goal-state-runtime-lines", "workspace-blob"],
    },
    missingRuntimeGaps: {
      id: "nanobot-live-session-id-generator-runtime-not-replayed",
      clock: "nanobot-exact-runtime-clock-format-not-proven",
      workspace: "nanobot-workspace-path-filesystem-side-effects-not-replayed",
    },
  },
  hermes: {
    product: "hermes",
    atomPrefix: "hermes",
    upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
    pinnedRepo: "NousResearch/hermes-agent",
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    evidenceRef: "conformance:hermes-identity-source-matrix",
    fixtureID: "hermes-identity:source-matrix",
    sourceRefs: [
      {
        id: "hermes-runtime-helpers",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "agent/agent_runtime_helpers.py",
        symbols: ["_ra", "convert_to_trajectory_format", "sanitize_tool_call_arguments"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "hermes-acp-session",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "acp_adapter/session.py",
        symbols: [
          "_win_path_to_wsl",
          "_translate_acp_cwd",
          "_normalize_cwd_for_compare",
          "_build_session_title",
          "_format_updated_at",
          "_updated_at_sort_key",
          "_register_task_cwd",
          "_clear_task_cwd",
          "SessionState",
          "SessionManager",
          "create_session",
          "get_session",
          "remove_session",
          "fork_session",
          "list_sessions",
          "update_cwd",
          "cleanup",
          "save_session",
          "_persist",
          "_restore",
        ],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "hermes-local-identity-atoms",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-hermes/src/atoms/profile.ts",
        symbols: ["hermes.identity.id-generator", "hermes.identity.clock-format", "hermes.identity.workspace-resolver"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "contracts-port-fixtures",
        repo: "helix/local",
        ref: "current",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: ["buildHermesIdentitySourceMatrixSnapshot", "identity.id-generator", "identity.clock", "identity.workspace-resolver"],
        evidence: "local-source:2026-06-11",
      },
    ],
    partialRefs: {
      id: ["hermes-acp-session", "contracts-port-fixtures"],
      timestamp: ["hermes-acp-session"],
      workspace: ["hermes-acp-session"],
      title: ["hermes-acp-session", "hermes-runtime-helpers"],
    },
    localMarkers: {
      id: ["SessionState", "create_session", "session-id"],
      timestamp: ["_format_updated_at", "_updated_at_sort_key"],
      workspace: ["_normalize_cwd_for_compare", "_translate_acp_cwd", "update_cwd"],
      title: ["_build_session_title", "trajectory-format"],
    },
    missingRuntimeGaps: {
      id: "hermes-live-acp-session-id-runtime-not-replayed",
      clock: "hermes-exact-updated-at-clock-format-not-proven",
      workspace: "hermes-cwd-translation-filesystem-side-effects-not-replayed",
    },
  },
}

function productIdentityAtomIDs(prefix: ProductIdentitySourceMatrixConfig["atomPrefix"]): string[] {
  return [`${prefix}.identity.id-generator`, `${prefix}.identity.clock-format`, `${prefix}.identity.workspace-resolver`]
}

function buildProductIdentitySourceMatrixBranchAnchors(config: ProductIdentitySourceMatrixConfig): ProductIdentitySourceMatrixBranchAnchor[] {
  const evidenceRefs = [config.fixtureID]
  const idAtom = `${config.atomPrefix}.identity.id-generator`
  const clockAtom = `${config.atomPrefix}.identity.clock-format`
  const workspaceAtom = `${config.atomPrefix}.identity.workspace-resolver`
  return [
    {
      branchID: "id-format-surface",
      status: "partial",
      sourceRefIDs: config.partialRefs.id,
      identityAtomIDs: [idAtom],
      identityPortIDs: ["identity.id-generator"],
      localEvidenceRefs: evidenceRefs,
      localMarkers: config.localMarkers.id,
      knownGaps: [config.missingRuntimeGaps.id],
    },
    {
      branchID: "timestamp-format-surface",
      status: "partial",
      sourceRefIDs: config.partialRefs.timestamp,
      identityAtomIDs: [clockAtom],
      identityPortIDs: ["identity.clock"],
      localEvidenceRefs: evidenceRefs,
      localMarkers: config.localMarkers.timestamp,
      knownGaps: [config.missingRuntimeGaps.clock],
    },
    {
      branchID: "workspace-path-surface",
      status: "partial",
      sourceRefIDs: config.partialRefs.workspace,
      identityAtomIDs: [workspaceAtom],
      identityPortIDs: ["identity.workspace-resolver"],
      localEvidenceRefs: evidenceRefs,
      localMarkers: config.localMarkers.workspace,
      knownGaps: [config.missingRuntimeGaps.workspace],
    },
    {
      branchID: "title-serialization-surface",
      status: "partial",
      sourceRefIDs: config.partialRefs.title,
      identityAtomIDs: productIdentityAtomIDs(config.atomPrefix),
      identityPortIDs: ["identity.id-generator", "identity.clock", "identity.workspace-resolver"],
      localEvidenceRefs: evidenceRefs,
      localMarkers: config.localMarkers.title,
      knownGaps: [`${config.product}-title-and-serialization-live-runtime-not-replayed`],
    },
    {
      branchID: "upstream-id-generator-runtime",
      status: "missing",
      sourceRefIDs: config.partialRefs.id,
      identityAtomIDs: [idAtom],
      identityPortIDs: ["identity.id-generator"],
      localEvidenceRefs: evidenceRefs,
      localMarkers: ["source-anchored-only", "id-runtime:not-spawned"],
      knownGaps: [config.missingRuntimeGaps.id],
    },
    {
      branchID: "exact-clock-runtime-format",
      status: "missing",
      sourceRefIDs: config.partialRefs.timestamp,
      identityAtomIDs: [clockAtom],
      identityPortIDs: ["identity.clock"],
      localEvidenceRefs: evidenceRefs,
      localMarkers: ["clock-runtime:not-spawned", "timestamp-format:not-exact"],
      knownGaps: [config.missingRuntimeGaps.clock],
    },
    {
      branchID: "workspace-filesystem-side-effects",
      status: "missing",
      sourceRefIDs: config.partialRefs.workspace,
      identityAtomIDs: [workspaceAtom],
      identityPortIDs: ["identity.workspace-resolver"],
      localEvidenceRefs: evidenceRefs,
      localMarkers: ["workspace-fs-side-effects:not-replayed", "realpath:not-proven"],
      knownGaps: [config.missingRuntimeGaps.workspace],
    },
  ]
}

function buildProductIdentitySourceMatrixSnapshotFromConfig(config: ProductIdentitySourceMatrixConfig): ProductIdentitySourceMatrixSnapshot {
  const branchAnchors = buildProductIdentitySourceMatrixBranchAnchors(config)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: config.product,
    upstreamRef: config.upstreamRef,
    pinnedRepo: config.pinnedRepo,
    pinnedRef: config.pinnedRef,
    evidenceRef: config.evidenceRef,
    fixtureID: config.fixtureID,
    sourceRefs: config.sourceRefs,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredIdentityAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.identityAtomIDs)),
    coveredIdentityPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.identityPortIDs)),
    knownGaps: uniqueStrings([
      `${config.product}-identity-source-matrix-covered-by-partial-fixture`,
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildProductIdentitySourceMatrixSnapshot(product: ProductIdentitySourceMatrixProduct): ProductIdentitySourceMatrixSnapshot {
  return buildProductIdentitySourceMatrixSnapshotFromConfig(PRODUCT_IDENTITY_SOURCE_MATRIX_CONFIGS[product])
}

export function buildPiIdentitySourceMatrixSnapshot(): ProductIdentitySourceMatrixSnapshot {
  return buildProductIdentitySourceMatrixSnapshot("pi")
}

export function buildNanobotIdentitySourceMatrixSnapshot(): ProductIdentitySourceMatrixSnapshot {
  return buildProductIdentitySourceMatrixSnapshot("nanobot")
}

export function buildHermesIdentitySourceMatrixSnapshot(): ProductIdentitySourceMatrixSnapshot {
  return buildProductIdentitySourceMatrixSnapshot("hermes")
}

export type IdentityFormattingRoundTripGateProduct = "opencode" | ProductIdentitySourceMatrixProduct
export type IdentityFormattingRoundTripGateDimension = "id-format" | "timestamp-format" | "workspace-path" | "title-format" | "serialization"

export interface IdentityFormattingRoundTripGateCase {
  product: IdentityFormattingRoundTripGateProduct
  upstreamRef: OpenCodeIdentitySourceMatrixSnapshot["upstreamRef"] | ProductIdentityUpstreamRef
  evidenceRef: OpenCodeIdentitySourceMatrixSnapshot["evidenceRef"] | ProductIdentityEvidenceRef
  fixtureID: OpenCodeIdentitySourceMatrixSnapshot["fixtureID"] | ProductIdentityFixtureID
  idFormat: string[]
  timestampFormat: string[]
  workspacePath: string[]
  titleFormat: string[]
  serialization: string[]
  sourceAnchors: string[]
  evidenceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  formatRisk: "source-anchored-partial" | "helix-only"
  knownLossiness: string[]
}

export interface IdentityFormattingRoundTripGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:identity-formatting-round-trip-gate"
  fixtureID: "identity:formatting-round-trip-gate"
  products: IdentityFormattingRoundTripGateProduct[]
  comparisonDimensions: IdentityFormattingRoundTripGateDimension[]
  cases: IdentityFormattingRoundTripGateCase[]
  fingerprint: string
}

export interface IdentityFormattingRoundTripGateIssue {
  id: string
  product: IdentityFormattingRoundTripGateProduct
  dimension: IdentityFormattingRoundTripGateDimension
  message: string
}

export interface IdentityFormattingRoundTripGateVerification {
  ok: boolean
  issues: IdentityFormattingRoundTripGateIssue[]
}

export function buildIdentityFormattingRoundTripGateSnapshot(): IdentityFormattingRoundTripGateSnapshot {
  const cases = [
    buildOpenCodeIdentityFormattingRoundTripGateCase(buildOpenCodeIdentitySourceMatrixSnapshot()),
    buildProductIdentityFormattingRoundTripGateCase(buildPiIdentitySourceMatrixSnapshot()),
    buildProductIdentityFormattingRoundTripGateCase(buildNanobotIdentitySourceMatrixSnapshot()),
    buildProductIdentityFormattingRoundTripGateCase(buildHermesIdentitySourceMatrixSnapshot()),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:identity-formatting-round-trip-gate" as const,
    fixtureID: "identity:formatting-round-trip-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["id-format", "timestamp-format", "workspace-path", "title-format", "serialization"] as IdentityFormattingRoundTripGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyIdentityFormattingRoundTripGateSnapshot(
  snapshot: IdentityFormattingRoundTripGateSnapshot,
): IdentityFormattingRoundTripGateVerification {
  const issues: IdentityFormattingRoundTripGateIssue[] = []
  const products: IdentityFormattingRoundTripGateProduct[] = ["opencode", "pi", "nanobot", "hermes"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "identity-formatting.missing-product",
        product,
        dimension: "id-format",
        message: `Missing identity formatting gate case for ${product}.`,
      })
      continue
    }
    if (!identityGateContains(item.idFormat, /id|uuid|session/i)) {
      issues.push({
        id: "identity-formatting.id-format",
        product,
        dimension: "id-format",
        message: `${product} identity formatting gate no longer records ID format anchors.`,
      })
    }
    if (!identityGateContains(item.timestampFormat, /timestamp|clock|updated|runtime|date/i)) {
      issues.push({
        id: "identity-formatting.timestamp-format",
        product,
        dimension: "timestamp-format",
        message: `${product} identity formatting gate no longer records timestamp format anchors.`,
      })
    }
    if (!identityGateContains(item.workspacePath, /workspace|cwd|path|realpath/i)) {
      issues.push({
        id: "identity-formatting.workspace-path",
        product,
        dimension: "workspace-path",
        message: `${product} identity formatting gate no longer records workspace path anchors.`,
      })
    }
    if (!identityGateContains(item.titleFormat, /title|initial-message|goal-state|trajectory/i)) {
      issues.push({
        id: "identity-formatting.title-format",
        product,
        dimension: "title-format",
        message: `${product} identity formatting gate no longer records title format anchors.`,
      })
    }
    if (!identityGateContains(item.serialization, /serialization|persist|restore|state|session|format/i)) {
      issues.push({
        id: "identity-formatting.serialization",
        product,
        dimension: "serialization",
        message: `${product} identity formatting gate no longer records serialization/readback anchors.`,
      })
    }
    if (item.formatRisk !== "source-anchored-partial") {
      issues.push({
        id: "identity-formatting.helix-only-format",
        product,
        dimension: "id-format",
        message: `${product} identity formatting gate is Helix-only and cannot be promoted toward native parity.`,
      })
    }
    if (
      product === "opencode" &&
      (!identityIncludesAll(item.nativeEvidenceRefs, OPENCODE_IDENTITY_NATIVE_EXACT_EVIDENCE_REFS) ||
        !identityIncludesAll(item.fixtureIDs, OPENCODE_IDENTITY_NATIVE_EXACT_FIXTURE_IDS))
    ) {
      issues.push({
        id: "identity-formatting.native-exact-evidence",
        product,
        dimension: "id-format",
        message: "OpenCode identity formatting gate no longer carries native exact identity fixture evidence.",
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildOpenCodeIdentityFormattingRoundTripGateCase(snapshot: OpenCodeIdentitySourceMatrixSnapshot): IdentityFormattingRoundTripGateCase {
  return {
    product: "opencode",
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    idFormat: identityBranchMarkers(snapshot.branchAnchors, ["local-id-kind-serialization", "upstream-id-generator-runtime"]),
    timestampFormat: identityBranchMarkers(snapshot.branchAnchors, ["session-title-format", "exact-clock-timestamp-format"]),
    workspacePath: identityBranchMarkers(snapshot.branchAnchors, ["session-path-workspace", "workspace-filesystem-side-effects"]),
    titleFormat: identityBranchMarkers(snapshot.branchAnchors, ["session-title-format"]),
    serialization: identityBranchMarkers(snapshot.branchAnchors, ["local-id-kind-serialization", "session-path-workspace", "session-title-format"]),
    sourceAnchors: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    evidenceRefs: uniqueStrings([
      snapshot.evidenceRef,
      snapshot.fixtureID,
      "contracts-schema:id-generator",
      ...snapshot.nativeEvidenceRefs,
      ...snapshot.fixtureIDs,
    ]),
    nativeEvidenceRefs: snapshot.nativeEvidenceRefs,
    fixtureIDs: snapshot.fixtureIDs,
    formatRisk: "source-anchored-partial",
    knownLossiness: snapshot.knownGaps,
  }
}

function buildProductIdentityFormattingRoundTripGateCase(snapshot: ProductIdentitySourceMatrixSnapshot): IdentityFormattingRoundTripGateCase {
  return {
    product: snapshot.product,
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    idFormat: identityBranchMarkers(snapshot.branchAnchors, ["id-format-surface", "upstream-id-generator-runtime"]),
    timestampFormat: identityBranchMarkers(snapshot.branchAnchors, ["timestamp-format-surface", "exact-clock-runtime-format"]),
    workspacePath: identityBranchMarkers(snapshot.branchAnchors, ["workspace-path-surface", "workspace-filesystem-side-effects"]),
    titleFormat: identityBranchMarkers(snapshot.branchAnchors, ["title-serialization-surface"]),
    serialization: identityBranchMarkers(snapshot.branchAnchors, ["title-serialization-surface", "id-format-surface", "timestamp-format-surface", "workspace-path-surface"]),
    sourceAnchors: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    evidenceRefs: [snapshot.evidenceRef, snapshot.fixtureID],
    nativeEvidenceRefs: [snapshot.evidenceRef],
    fixtureIDs: [snapshot.fixtureID],
    formatRisk: "source-anchored-partial",
    knownLossiness: snapshot.knownGaps,
  }
}

function identityBranchMarkers<TAnchor extends { branchID: string; localMarkers: string[]; knownGaps: string[] }>(anchors: TAnchor[], branchIDs: string[]): string[] {
  const selected = anchors.filter((anchor) => branchIDs.includes(anchor.branchID))
  return uniqueStrings(selected.flatMap((anchor) => [anchor.branchID, ...anchor.localMarkers, ...anchor.knownGaps]))
}

function identityGateContains(values: string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

function identityIncludesAll(values: string[], required: readonly string[]): boolean {
  return required.every((value) => values.includes(value))
}

export type IdentityFormattingExactDiffBlockerProduct = IdentityFormattingRoundTripGateProduct
export type IdentityFormattingExactDiffBlockerDimension = IdentityFormattingRoundTripGateDimension

export interface IdentityFormattingExactDiffBlockerCase {
  product: IdentityFormattingExactDiffBlockerProduct
  upstreamRef: IdentityFormattingRoundTripGateCase["upstreamRef"]
  fixtureID: IdentityFormattingRoundTripGateCase["fixtureID"]
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  idFormat: string[]
  timestampFormat: string[]
  workspacePath: string[]
  titleFormat: string[]
  serialization: string[]
  sourceAnchors: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "helix-only"
  knownLossiness: string[]
}

export interface IdentityFormattingExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:identity-formatting-exact-diff-blocker-gate"
  fixtureID: "identity:formatting-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: IdentityFormattingExactDiffBlockerProduct[]
  comparisonDimensions: IdentityFormattingExactDiffBlockerDimension[]
  cases: IdentityFormattingExactDiffBlockerCase[]
  fingerprint: string
}

export interface IdentityFormattingExactDiffBlockerIssue {
  id: string
  product: IdentityFormattingExactDiffBlockerProduct
  dimension: IdentityFormattingExactDiffBlockerDimension
  message: string
}

export interface IdentityFormattingExactDiffBlockerVerification {
  ok: boolean
  issues: IdentityFormattingExactDiffBlockerIssue[]
}

export function buildIdentityFormattingExactDiffBlockerSnapshot(): IdentityFormattingExactDiffBlockerSnapshot {
  const roundTripGate = buildIdentityFormattingRoundTripGateSnapshot()
  const cases = roundTripGate.cases.map(buildIdentityFormattingExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:identity-formatting-exact-diff-blocker-gate" as const,
    fixtureID: "identity:formatting-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["id-format", "timestamp-format", "workspace-path", "title-format", "serialization"] as IdentityFormattingExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyIdentityFormattingExactDiffBlockerSnapshot(
  snapshot: IdentityFormattingExactDiffBlockerSnapshot,
): IdentityFormattingExactDiffBlockerVerification {
  const issues: IdentityFormattingExactDiffBlockerIssue[] = []
  const products: IdentityFormattingExactDiffBlockerProduct[] = ["opencode", "pi", "nanobot", "hermes"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "identity-formatting-exact-diff.missing-product",
        product,
        dimension: "id-format",
        message: `Missing identity formatting exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "identity-formatting-exact-diff.native-claim",
        product,
        dimension: "id-format",
        message: `${product} identity formatting blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!identityGateContains(item.idFormat, /id|uuid|session|generator|runtime/i)) {
      issues.push({
        id: "identity-formatting-exact-diff.id-format",
        product,
        dimension: "id-format",
        message: `${product} identity formatting blocker no longer records product ID format anchors.`,
      })
    }
    if (!identityGateContains(item.timestampFormat, /timestamp|clock|updated|runtime|date|timezone/i)) {
      issues.push({
        id: "identity-formatting-exact-diff.timestamp-format",
        product,
        dimension: "timestamp-format",
        message: `${product} identity formatting blocker no longer records timestamp format anchors.`,
      })
    }
    if (!identityGateContains(item.workspacePath, /workspace|cwd|path|realpath|filesystem|default/i)) {
      issues.push({
        id: "identity-formatting-exact-diff.workspace-path",
        product,
        dimension: "workspace-path",
        message: `${product} identity formatting blocker no longer records workspace path anchors.`,
      })
    }
    if (!identityGateContains(item.titleFormat, /title|initial-message|goal-state|trajectory|session/i)) {
      issues.push({
        id: "identity-formatting-exact-diff.title-format",
        product,
        dimension: "title-format",
        message: `${product} identity formatting blocker no longer records title format anchors.`,
      })
    }
    if (!identityGateContains(item.serialization, /serialization|persist|restore|state|session|readback|format/i)) {
      issues.push({
        id: "identity-formatting-exact-diff.serialization",
        product,
        dimension: "serialization",
        message: `${product} identity formatting blocker no longer records serialization/readback anchors.`,
      })
    }
    if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.sourceAnchors.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "identity-formatting-exact-diff.helix-only",
        product,
        dimension: "id-format",
        message: `${product} identity formatting blocker is not anchored to source-matrix partial evidence.`,
      })
    }
    if (
      product === "opencode" &&
      (!identityIncludesAll(item.nativeEvidenceRefs, OPENCODE_IDENTITY_NATIVE_EXACT_EVIDENCE_REFS) ||
        !identityIncludesAll(item.fixtureIDs, OPENCODE_IDENTITY_NATIVE_EXACT_FIXTURE_IDS))
    ) {
      issues.push({
        id: "identity-formatting-exact-diff.native-exact-evidence",
        product,
        dimension: "id-format",
        message: "OpenCode identity formatting blocker no longer carries native exact identity fixture evidence.",
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildIdentityFormattingExactDiffBlockerCase(
  roundTripCase: IdentityFormattingRoundTripGateCase,
): IdentityFormattingExactDiffBlockerCase {
  return {
    product: roundTripCase.product,
    upstreamRef: roundTripCase.upstreamRef,
    fixtureID: roundTripCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    idFormat: uniqueStrings([
      ...roundTripCase.idFormat,
      "product-native-id-generator:not-exact",
    ]),
    timestampFormat: uniqueStrings([
      ...roundTripCase.timestampFormat,
      "exact-clock-runtime:not-exact",
    ]),
    workspacePath: uniqueStrings([
      ...roundTripCase.workspacePath,
      "workspace-filesystem-side-effects:not-exact",
    ]),
    titleFormat: uniqueStrings([
      ...roundTripCase.titleFormat,
      "title-generation:not-exact",
    ]),
    serialization: uniqueStrings([
      ...roundTripCase.serialization,
      "persisted-readback:not-exact",
    ]),
    sourceAnchors: uniqueStrings(roundTripCase.sourceAnchors),
    nativeEvidenceRefs: uniqueStrings([
      ...roundTripCase.evidenceRefs,
      ...roundTripCase.nativeEvidenceRefs,
      ...roundTripCase.fixtureIDs,
    ]),
    fixtureIDs: roundTripCase.fixtureIDs,
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...roundTripCase.knownLossiness,
      "identity-native-id-generator-not-proven",
      "identity-exact-clock-runtime-not-proven",
      "identity-workspace-filesystem-side-effects-not-proven",
      "identity-title-serialization-not-proven",
      "identity-persisted-readback-not-proven",
    ]),
  }
}

export type IdentityFormattingPinnedReplayProduct = IdentityFormattingRoundTripGateProduct
export type IdentityFormattingPinnedReplayDimension = IdentityFormattingRoundTripGateDimension

export interface IdentityFormattingPinnedReplayRecord {
  dimension: IdentityFormattingPinnedReplayDimension
  value: string
  sourceAnchor: string
  evidenceAnchor: string
  sequence: number
}

export interface IdentityFormattingPinnedReplayCase {
  product: IdentityFormattingPinnedReplayProduct
  upstreamRef: IdentityFormattingRoundTripGateCase["upstreamRef"]
  fixtureID: IdentityFormattingRoundTripGateCase["fixtureID"]
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  upstreamRecords: IdentityFormattingPinnedReplayRecord[]
  productReplayRecords: IdentityFormattingPinnedReplayRecord[]
  assembledRecords: IdentityFormattingPinnedReplayRecord[]
  replayAnchors: string[]
  sourceAnchors: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  exactDiffRisk: "pinned-formatting-replay-needs-live-native-runtime" | "helix-only"
  knownLossiness: string[]
}

export interface IdentityFormattingPinnedReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:identity-formatting-pinned-replay-gate"
  fixtureID: "identity:formatting-pinned-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: IdentityFormattingPinnedReplayProduct[]
  comparisonDimensions: IdentityFormattingPinnedReplayDimension[]
  cases: IdentityFormattingPinnedReplayCase[]
  fingerprint: string
}

export interface IdentityFormattingPinnedReplayIssue {
  id: string
  product: IdentityFormattingPinnedReplayProduct
  dimension: IdentityFormattingPinnedReplayDimension
  message: string
}

export interface IdentityFormattingPinnedReplayVerification {
  ok: boolean
  issues: IdentityFormattingPinnedReplayIssue[]
}

const identityFormattingPinnedReplayDimensions: IdentityFormattingPinnedReplayDimension[] = [
  "id-format",
  "timestamp-format",
  "workspace-path",
  "title-format",
  "serialization",
]

export function buildIdentityFormattingPinnedReplaySnapshot(): IdentityFormattingPinnedReplaySnapshot {
  const roundTripGate = buildIdentityFormattingRoundTripGateSnapshot()
  const cases = roundTripGate.cases.map(buildIdentityFormattingPinnedReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:identity-formatting-pinned-replay-gate" as const,
    fixtureID: "identity:formatting-pinned-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: identityFormattingPinnedReplayDimensions,
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyIdentityFormattingPinnedReplaySnapshot(
  snapshot: IdentityFormattingPinnedReplaySnapshot,
): IdentityFormattingPinnedReplayVerification {
  const issues: IdentityFormattingPinnedReplayIssue[] = []
  const products: IdentityFormattingPinnedReplayProduct[] = ["opencode", "pi", "nanobot", "hermes"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "identity-formatting-pinned-replay.missing-product",
        product,
        dimension: "id-format",
        message: `Missing identity formatting pinned replay case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "identity-formatting-pinned-replay.native-claim",
        product,
        dimension: "id-format",
        message: `${product} identity formatting pinned replay must remain partial and cannot claim native parity.`,
      })
    }
    if (
      !identityFormattingPinnedReplayOrderMatches(item.upstreamRecords)
      || !identityFormattingPinnedReplayOrderMatches(item.productReplayRecords)
      || !identityFormattingPinnedReplayOrderMatches(item.assembledRecords)
    ) {
      issues.push({
        id: "identity-formatting-pinned-replay.order",
        product,
        dimension: "id-format",
        message: `${product} identity formatting pinned replay record order no longer covers all dimensions.`,
      })
    }
    for (const dimension of identityFormattingPinnedReplayDimensions) {
      const upstreamRecord = identityFormattingPinnedReplayRecord(item.upstreamRecords, dimension)
      const productReplayRecord = identityFormattingPinnedReplayRecord(item.productReplayRecords, dimension)
      const assembledRecord = identityFormattingPinnedReplayRecord(item.assembledRecords, dimension)
      if (!upstreamRecord || !productReplayRecord || !assembledRecord) {
        issues.push({
          id: `identity-formatting-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} identity formatting pinned replay no longer records ${dimension}.`,
        })
        continue
      }
      if (
        !identityFormattingPinnedReplayRecordMatches(upstreamRecord, productReplayRecord)
        || !identityFormattingPinnedReplayRecordMatches(upstreamRecord, assembledRecord)
      ) {
        issues.push({
          id: `identity-formatting-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} identity formatting ${dimension} replay drifted from the pinned upstream record.`,
        })
      }
    }
    if (item.replayAnchors.length === 0 || item.sourceAnchors.length === 0 || item.exactDiffRisk !== "pinned-formatting-replay-needs-live-native-runtime") {
      issues.push({
        id: "identity-formatting-pinned-replay.helix-only",
        product,
        dimension: "id-format",
        message: `${product} identity formatting pinned replay is not anchored to upstream source evidence.`,
      })
    }
    if (
      product === "opencode" &&
      (!identityIncludesAll(item.nativeEvidenceRefs, OPENCODE_IDENTITY_NATIVE_EXACT_EVIDENCE_REFS) ||
        !identityIncludesAll(item.fixtureIDs, OPENCODE_IDENTITY_NATIVE_EXACT_FIXTURE_IDS))
    ) {
      issues.push({
        id: "identity-formatting-pinned-replay.native-exact-evidence",
        product,
        dimension: "id-format",
        message: "OpenCode identity formatting pinned replay no longer carries native exact identity fixture evidence.",
      })
    }
    if (product !== "opencode" && item.sourceAnchors.some((anchor) => anchor.includes("opencode"))) {
      issues.push({
        id: "identity-formatting-pinned-replay.borrowed-source-matrix",
        product,
        dimension: "id-format",
        message: `${product} identity formatting pinned replay cannot borrow OpenCode source anchors.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildIdentityFormattingPinnedReplayCase(
  roundTripCase: IdentityFormattingRoundTripGateCase,
): IdentityFormattingPinnedReplayCase {
  const upstreamRecords = identityFormattingPinnedReplayRecords(roundTripCase.product)
  return {
    product: roundTripCase.product,
    upstreamRef: roundTripCase.upstreamRef,
    fixtureID: roundTripCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    upstreamRecords,
    productReplayRecords: upstreamRecords.map(identityFormattingPinnedReplayRecordClone),
    assembledRecords: upstreamRecords.map(identityFormattingPinnedReplayRecordClone),
    replayAnchors: uniqueStrings([
      roundTripCase.evidenceRef,
      roundTripCase.fixtureID,
      ...roundTripCase.evidenceRefs,
      ...roundTripCase.nativeEvidenceRefs,
      ...roundTripCase.fixtureIDs,
    ]),
    sourceAnchors: uniqueStrings(roundTripCase.sourceAnchors),
    nativeEvidenceRefs: uniqueStrings([
      ...roundTripCase.evidenceRefs,
      ...roundTripCase.nativeEvidenceRefs,
      ...roundTripCase.fixtureIDs,
    ]),
    fixtureIDs: roundTripCase.fixtureIDs,
    exactDiffRisk: "pinned-formatting-replay-needs-live-native-runtime",
    knownLossiness: uniqueStrings([
      ...roundTripCase.knownLossiness,
      "identity-formatting-pinned-replay-live-native-id-generator-not-proven",
      "identity-formatting-pinned-replay-live-clock-runtime-not-proven",
      "identity-formatting-pinned-replay-workspace-filesystem-side-effects-not-proven",
      "identity-formatting-pinned-replay-persisted-readback-not-proven",
    ]),
  }
}

function identityFormattingPinnedReplayRecords(product: IdentityFormattingPinnedReplayProduct): IdentityFormattingPinnedReplayRecord[] {
  if (product === "opencode") {
    return [
      identityFormattingPinnedReplayRecordValue(product, 1, "id-format", "sessionID:ses_pinned_01/createID(uuidv7)", "session-service:createDefaultTitle", "opencode-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 2, "timestamp-format", "updatedAt:2026-06-12T00:00:00.000Z/utc-sort-key", "local-identity-runtime-projection:clock.timestamp", "opencode-identity:runtime-projection"),
      identityFormattingPinnedReplayRecordValue(product, 3, "workspace-path", "sessionPath:/workspaces/opencode/.opencode/session/ses_pinned_01", "session-service:sessionPath", "opencode-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 4, "title-format", "title:New Session/default-title", "session-service:createDefaultTitle", "opencode-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 5, "serialization", "session-row:{id,title,updatedAt,workspacePath}", "session-service:Session", "opencode-identity:source-matrix"),
    ]
  }
  if (product === "pi") {
    return [
      identityFormattingPinnedReplayRecordValue(product, 1, "id-format", "session_uuid:pi-session-uuid-0001", "pi-session-uuid:uuid", "pi-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 2, "timestamp-format", "jsonl-time:2026-06-12T00:00:00.000Z", "pi-jsonl-session:timestamp", "pi-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 3, "workspace-path", "workspace:/tmp/pi-agent/session/pi-session-uuid-0001", "pi-agent-harness:workspace", "pi-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 4, "title-format", "initial-message-title:refactor harness", "pi-agent-harness:initial-message", "pi-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 5, "serialization", "jsonl-session:{uuid,title,workspace,timestamp}", "pi-jsonl-session:session-tree", "pi-identity:source-matrix"),
    ]
  }
  if (product === "nanobot") {
    return [
      identityFormattingPinnedReplayRecordValue(product, 1, "id-format", "goal-state-session:nanobot-goal-0001", "nanobot-goal-state:GOAL_STATE_KEY", "nanobot-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 2, "timestamp-format", "runtime-line:runner_wall_llm_timeout_s", "nanobot-goal-state:goal_state_runtime_lines", "nanobot-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 3, "workspace-path", "workspace:/home/user/.nanobot/workspaces/default", "nanobot-config-paths:get_workspace_path", "nanobot-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 4, "title-format", "workspace-blob:objective-summary", "nanobot-goal-state:goal_state_ws_blob", "nanobot-identity:source-matrix"),
      identityFormattingPinnedReplayRecordValue(product, 5, "serialization", "goal-state:{objective,runtime,workspace}", "nanobot-goal-state:parse_goal_state", "nanobot-identity:source-matrix"),
    ]
  }
  return [
    identityFormattingPinnedReplayRecordValue(product, 1, "id-format", "acp-session:hermes-session-0001", "hermes-acp-session:SessionState", "hermes-identity:source-matrix"),
    identityFormattingPinnedReplayRecordValue(product, 2, "timestamp-format", "updated_at:2026-06-12T00:00:00.000Z/sort-key", "hermes-acp-session:_format_updated_at", "hermes-identity:source-matrix"),
    identityFormattingPinnedReplayRecordValue(product, 3, "workspace-path", "cwd:/mnt/c/Users/demo/project", "hermes-acp-session:_normalize_cwd_for_compare", "hermes-identity:source-matrix"),
    identityFormattingPinnedReplayRecordValue(product, 4, "title-format", "session-title:trajectory-format", "hermes-acp-session:_build_session_title", "hermes-identity:source-matrix"),
    identityFormattingPinnedReplayRecordValue(product, 5, "serialization", "persisted-session:{id,title,cwd,updated_at}", "hermes-acp-session:_persist", "hermes-identity:source-matrix"),
  ]
}

function identityFormattingPinnedReplayRecordValue(
  product: IdentityFormattingPinnedReplayProduct,
  sequence: number,
  dimension: IdentityFormattingPinnedReplayDimension,
  value: string,
  sourceAnchor: string,
  evidenceAnchor: string,
): IdentityFormattingPinnedReplayRecord {
  return {
    dimension,
    value: `${product}:${value}`,
    sourceAnchor,
    evidenceAnchor,
    sequence,
  }
}

function identityFormattingPinnedReplayRecordClone(
  record: IdentityFormattingPinnedReplayRecord,
): IdentityFormattingPinnedReplayRecord {
  return { ...record }
}

function identityFormattingPinnedReplayRecord(
  records: IdentityFormattingPinnedReplayRecord[],
  dimension: IdentityFormattingPinnedReplayDimension,
): IdentityFormattingPinnedReplayRecord | undefined {
  return records.find((record) => record.dimension === dimension)
}

function identityFormattingPinnedReplayRecordMatches(
  upstreamRecord: IdentityFormattingPinnedReplayRecord,
  candidateRecord: IdentityFormattingPinnedReplayRecord,
): boolean {
  return identityFormattingPinnedReplaySignature(upstreamRecord) === identityFormattingPinnedReplaySignature(candidateRecord)
}

function identityFormattingPinnedReplayOrderMatches(records: IdentityFormattingPinnedReplayRecord[]): boolean {
  return records.map((record) => `${record.sequence}:${record.dimension}`).join("|") === identityFormattingPinnedReplayDimensions.map((dimension, index) => `${index + 1}:${dimension}`).join("|")
}

function identityFormattingPinnedReplaySignature(record: IdentityFormattingPinnedReplayRecord | undefined): string {
  if (!record) return "<missing>"
  return stableStringify({
    dimension: record.dimension,
    value: record.value,
    sourceAnchor: record.sourceAnchor,
    evidenceAnchor: record.evidenceAnchor,
    sequence: record.sequence,
  })
}

export type OpenCodeEventSourceRefID =
  | "session-service"
  | "message-v2"
  | "session-projectors"
  | "session-projectors-next"
  | "local-event-runtime-projection"
  | "local-event-live-runtime-fixture"

const OPENCODE_EVENT_NATIVE_EXACT_EVIDENCE_REFS = [
  "conformance:opencode-event-envelope-native-exact-fixture",
  "event-envelope-native-exact:opencode",
  "conformance:opencode-sync-event-log-native-exact-fixture",
  "sync-event-log-native-exact:opencode",
  "conformance:opencode-event-native-exact-fixture",
  "event-native-exact:opencode",
] as const

const OPENCODE_EVENT_NATIVE_EXACT_FIXTURE_IDS = [
  "opencode-event-envelope:native-exact-fixture",
  "opencode-sync-event-log:native-exact-fixture",
  "opencode-event:native-exact-fixture",
] as const

export interface OpenCodeEventSourceRef {
  id: OpenCodeEventSourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-12"
}

export type OpenCodeEventSourceMatrixBranchID =
  | "event-envelope-shape"
  | "syncevent-stream-projection"
  | "message-v2-event-stream"
  | "session-projector-row-mapping"
  | "event-log-readback"
  | "live-syncevent-bus-runtime"
  | "exact-event-ordering"
  | "sqlite-event-side-effects"

export type OpenCodeEventSourceMatrixBranchStatus = "partial" | "missing"

export interface OpenCodeEventSourceMatrixBranchAnchor {
  branchID: OpenCodeEventSourceMatrixBranchID
  status: OpenCodeEventSourceMatrixBranchStatus
  sourceRefIDs: OpenCodeEventSourceRefID[]
  eventAtomIDs: string[]
  eventPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface OpenCodeEventSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-event-source-matrix"
  fixtureID: "opencode-event:source-matrix"
  sourceRefs: OpenCodeEventSourceRef[]
  branchAnchors: OpenCodeEventSourceMatrixBranchAnchor[]
  partialBranchIDs: OpenCodeEventSourceMatrixBranchID[]
  missingBranchIDs: OpenCodeEventSourceMatrixBranchID[]
  coveredEventAtomIDs: string[]
  coveredEventPortIDs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeEventRuntimeProjectionEvent =
  | {
    type: "syncevent.bus"
    eventType: string
    sessionID?: string
    traceID?: string
    source?: string
    payloadKeys: string[]
    sequence: number
  }
  | {
    type: "event.order"
    streamID: string
    eventType: string
    sequence: number
    timestamp?: string
  }
  | {
    type: "sqlite.write"
    table: string
    operation: "insert" | "update" | "delete" | "upsert"
    rowKeys: string[]
    transactionID?: string
    sequence: number
  }

export interface OpenCodeEventRuntimeProjection {
  schemaVersion: 1
  fixtureID: "opencode-event:runtime-projection"
  evidenceRef: "conformance:opencode-event-runtime-projection"
  coveredBranchIDs: Array<Extract<OpenCodeEventSourceMatrixBranchID, "live-syncevent-bus-runtime" | "exact-event-ordering" | "sqlite-event-side-effects">>
  retainedFields: string[]
  lossyFields: string[]
  busRuntime: Array<{ eventType: string; sessionID: string | null; traceID: string | null; source: string | null; payloadKeys: string[]; sequence: number }>
  eventOrdering: Array<{ streamID: string; eventType: string; sequence: number; timestampObserved: boolean }>
  sqliteSideEffects: Array<{ table: string; operation: "insert" | "update" | "delete" | "upsert"; rowKeys: string[]; transactionID: string | null; sequence: number }>
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeEventLiveRuntimeFixtureInput {
  sessionID?: string
  traceID?: string
  streamID?: string
  eventType?: string
  source?: string
  transactionID?: string
}

export interface OpenCodeEventBusLiveReadback {
  eventType: string
  sessionID: string
  traceID: string
  source: string
  payloadKeys: string[]
  subscriberCount: number
  deliveryID: string
  payloadHash: string
  sequence: number
}

export interface OpenCodeEventOrderingLiveReadback {
  streamID: string
  eventType: string
  sequence: number
  timestamp: string
  timestampHash: string
  monotonicOrderMarker: string
  previousEventType: string | null
}

export interface OpenCodeEventSqliteLiveReadback {
  table: string
  operation: "insert" | "update" | "delete" | "upsert"
  rowKeys: string[]
  transactionID: string
  beforeRowHash: string
  afterRowHash: string
  cursorKey: string
  fsyncMarker: string
  sequence: number
}

export interface OpenCodeEventLogLiveReadback {
  streamID: string
  eventTypes: string[]
  envelopeKeys: string[]
  messagePartKinds: string[]
  readbackCursor: string
  sequenceCount: number
}

export interface OpenCodeEventLiveRuntimeFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-event-live-runtime-fixture"
  fixtureID: "opencode-event:live-runtime-fixture"
  exactDiffStatus: "live-runtime-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  fixtureDiffTarget: "event.envelope-replay"
  relatedFixtureDiffTargets: Array<"session.storage-round-trip">
  coveredBranchIDs: OpenCodeEventSourceMatrixBranchID[]
  busReadback: OpenCodeEventBusLiveReadback[]
  orderingReadback: OpenCodeEventOrderingLiveReadback[]
  sqliteReadback: OpenCodeEventSqliteLiveReadback[]
  eventLogReadback: OpenCodeEventLogLiveReadback[]
  eventRuntimeProjection: OpenCodeEventRuntimeProjection
  retainedFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeEventLiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeEventLiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeEventLiveRuntimeFixtureIssue[]
}

const OPENCODE_EVENT_SOURCE_REFS: OpenCodeEventSourceRef[] = [
  {
    id: "session-service",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/session.ts",
    symbols: ["Event", "Session", "fromRow", "toRow", "plan", "getUsage"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "message-v2",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/message-v2.ts",
    symbols: ["Event", "Part", "MessageV2", "cursor", "page", "stream"],
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
    id: "local-event-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["projectOpenCodeEventRuntimeProjection", "OpenCodeEventRuntimeProjection"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-event-live-runtime-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["captureOpenCodeEventLiveRuntimeFixture", "verifyOpenCodeEventLiveRuntimeFixture", "OpenCodeEventLiveRuntimeFixture"],
    evidence: "local-source:2026-06-12",
  },
]

export function projectOpenCodeEventRuntimeProjection(
  events: OpenCodeEventRuntimeProjectionEvent[],
): OpenCodeEventRuntimeProjection {
  const busRuntime = events
    .filter((event): event is Extract<OpenCodeEventRuntimeProjectionEvent, { type: "syncevent.bus" }> => event.type === "syncevent.bus")
    .map((event) => ({
      eventType: event.eventType,
      sessionID: typeof event.sessionID === "string" && event.sessionID.length > 0 ? event.sessionID : null,
      traceID: typeof event.traceID === "string" && event.traceID.length > 0 ? event.traceID : null,
      source: typeof event.source === "string" && event.source.length > 0 ? event.source : null,
      payloadKeys: uniqueStrings(event.payloadKeys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.eventType.localeCompare(right.eventType))

  const eventOrdering = events
    .filter((event): event is Extract<OpenCodeEventRuntimeProjectionEvent, { type: "event.order" }> => event.type === "event.order")
    .map((event) => ({
      streamID: event.streamID,
      eventType: event.eventType,
      sequence: event.sequence,
      timestampObserved: typeof event.timestamp === "string" && event.timestamp.length > 0,
    }))
    .sort((left, right) => left.streamID.localeCompare(right.streamID) || left.sequence - right.sequence || left.eventType.localeCompare(right.eventType))

  const sqliteSideEffects = events
    .filter((event): event is Extract<OpenCodeEventRuntimeProjectionEvent, { type: "sqlite.write" }> => event.type === "sqlite.write")
    .map((event) => ({
      table: event.table,
      operation: event.operation,
      rowKeys: uniqueStrings(event.rowKeys),
      transactionID: typeof event.transactionID === "string" && event.transactionID.length > 0 ? event.transactionID : null,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.table.localeCompare(right.table) || left.operation.localeCompare(right.operation))

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-event:runtime-projection" as const,
    evidenceRef: "conformance:opencode-event-runtime-projection" as const,
    coveredBranchIDs: [
      "live-syncevent-bus-runtime",
      "exact-event-ordering",
      "sqlite-event-side-effects",
    ] as OpenCodeEventRuntimeProjection["coveredBranchIDs"],
    retainedFields: [
      "eventType",
      "sessionID",
      "traceID",
      "source",
      "payloadKeys",
      "sequence",
      "streamID",
      "timestampObserved",
      "table",
      "operation",
      "rowKeys",
      "transactionID",
    ],
    lossyFields: [
      "native SyncEvent bus subscription lifecycle",
      "wall-clock event dispatch timing",
      "exact async event interleaving",
      "raw payload/private fields",
      "sqlite transaction side effects",
      "storage write ordering/fsync/cursor",
    ],
    busRuntime,
    eventOrdering,
    sqliteSideEffects,
    knownGaps: [
      "opencode-live-syncevent-bus-runtime-not-replayed",
      "opencode-event-ordering-not-exact",
      "opencode-sqlite-event-side-effects-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeEventLiveRuntimeFixture(
  input: OpenCodeEventLiveRuntimeFixtureInput = {},
): OpenCodeEventLiveRuntimeFixture {
  const sessionID = input.sessionID ?? "sess_event_fixture"
  const traceID = input.traceID ?? "trace_event_fixture"
  const streamID = input.streamID ?? sessionID
  const eventType = input.eventType ?? "message.update"
  const source = input.source ?? "session.projector"
  const transactionID = input.transactionID ?? "tx_event_fixture"
  const payloadKeys = uniqueStrings(["messageID", "parts", "sessionID", "time", "type"])
  const rowKeys = uniqueStrings(["id", "messageID", "payload", "sessionID", "time", "type"])
  const envelopeKeys = uniqueStrings(["id", "payload", "sessionID", "source", "time", "traceID", "type"])
  const messagePartKinds = uniqueStrings(["text", "tool-call", "tool-result"])
  const busReadback: OpenCodeEventBusLiveReadback[] = [
    {
      eventType,
      sessionID,
      traceID,
      source,
      payloadKeys,
      subscriberCount: 2,
      deliveryID: "delivery_event_fixture_001",
      payloadHash: fingerprintObject({ eventType, payloadKeys, sessionID, traceID }),
      sequence: 1,
    },
  ]
  const orderingReadback: OpenCodeEventOrderingLiveReadback[] = [
    {
      streamID,
      eventType: "session.created",
      sequence: 1,
      timestamp: "2026-06-12T00:00:00.000Z",
      timestampHash: fingerprintObject({ streamID, eventType: "session.created", sequence: 1 }),
      monotonicOrderMarker: "source-order-0001",
      previousEventType: null,
    },
    {
      streamID,
      eventType,
      sequence: 2,
      timestamp: "2026-06-12T00:00:00.010Z",
      timestampHash: fingerprintObject({ streamID, eventType, sequence: 2 }),
      monotonicOrderMarker: "source-order-0002",
      previousEventType: "session.created",
    },
  ]
  const sqliteReadback: OpenCodeEventSqliteLiveReadback[] = [
    {
      table: "session_event",
      operation: "insert",
      rowKeys,
      transactionID,
      beforeRowHash: fingerprintObject({ table: "session_event", transactionID, phase: "before" }),
      afterRowHash: fingerprintObject({ table: "session_event", transactionID, rowKeys, phase: "after" }),
      cursorKey: "updated_at:id",
      fsyncMarker: "deterministic-local",
      sequence: 3,
    },
  ]
  const eventLogReadback: OpenCodeEventLogLiveReadback[] = [
    {
      streamID,
      eventTypes: orderingReadback.map((record) => record.eventType),
      envelopeKeys,
      messagePartKinds,
      readbackCursor: "updated_at:id:0002",
      sequenceCount: orderingReadback.length,
    },
  ]
  const eventRuntimeProjection = projectOpenCodeEventRuntimeProjection([
    {
      type: "syncevent.bus",
      eventType,
      sessionID,
      traceID,
      source,
      payloadKeys,
      sequence: 1,
    },
    ...orderingReadback.map((record): OpenCodeEventRuntimeProjectionEvent => ({
      type: "event.order",
      streamID,
      eventType: record.eventType,
      sequence: record.sequence,
      timestamp: record.timestamp,
    })),
    {
      type: "sqlite.write",
      table: "session_event",
      operation: "insert",
      rowKeys,
      transactionID,
      sequence: 3,
    },
  ])
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-event-live-runtime-fixture" as const,
    fixtureID: "opencode-event:live-runtime-fixture" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    fixtureDiffTarget: "event.envelope-replay" as const,
    relatedFixtureDiffTargets: ["session.storage-round-trip" as const],
    coveredBranchIDs: uniqueStrings([
      "event-envelope-shape",
      "syncevent-stream-projection",
      "message-v2-event-stream",
      "session-projector-row-mapping",
      "event-log-readback",
      ...eventRuntimeProjection.coveredBranchIDs,
    ]) as OpenCodeEventSourceMatrixBranchID[],
    busReadback,
    orderingReadback,
    sqliteReadback,
    eventLogReadback,
    eventRuntimeProjection,
    retainedFields: [
      "SyncEvent bus payload key readback",
      "bus subscriber and delivery ID marker",
      "ordered event stream timestamp readback",
      "monotonic source-order marker",
      "sqlite table/row/transaction readback",
      "event log cursor and envelope key readback",
      "MessageV2 event part kind readback",
    ],
    lossyFields: [
      "native SyncEvent bus subscription lifecycle",
      "native event dispatch wall-clock timing",
      "native async event interleaving",
      "raw event payload/private fields",
      "native sqlite transaction side effects",
      "storage fsync and cursor allocation ordering",
      "live upstream projector side effects",
    ],
    knownGaps: [
      "opencode-event-live-runtime-fixture-partial-native-gap",
      "opencode-live-syncevent-bus-runtime-not-replayed",
      "opencode-event-ordering-not-exact",
      "opencode-sqlite-event-side-effects-not-replayed",
      "opencode-event-raw-payload-private-fields-not-replayed",
      "opencode-event-projector-side-effects-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeEventLiveRuntimeFixture(
  fixture: OpenCodeEventLiveRuntimeFixture,
): OpenCodeEventLiveRuntimeFixtureVerification {
  const issues: OpenCodeEventLiveRuntimeFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== "opencode-event:live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-event-live-runtime-fixture") {
    addIssue("opencode-event-live-runtime.identity", "OpenCode event live runtime fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== false || fixture.exactDiffStatus !== "live-runtime-partial" || fixture.coverageStatus !== "partial") {
    addIssue("opencode-event-live-runtime.native-claim", "OpenCode event live runtime fixture must stay partial and cannot claim native parity.")
  }
  for (const branchID of ["event-envelope-shape", "syncevent-stream-projection", "message-v2-event-stream", "session-projector-row-mapping", "event-log-readback", "live-syncevent-bus-runtime", "exact-event-ordering", "sqlite-event-side-effects"] as const) {
    if (!fixture.coveredBranchIDs.includes(branchID)) {
      addIssue("opencode-event-live-runtime.missing-branch", `OpenCode event live runtime fixture no longer covers ${branchID}.`)
    }
  }
  if (fixture.eventRuntimeProjection.fixtureID !== "opencode-event:runtime-projection" || fixture.eventRuntimeProjection.evidenceRef !== "conformance:opencode-event-runtime-projection") {
    addIssue("opencode-event-live-runtime.runtime-projection", "OpenCode event live runtime fixture lost the nested runtime projection identity.")
  }
  const busReadback = fixture.busReadback.some((record) =>
    record.eventType === "message.update" &&
    record.sessionID.length > 0 &&
    record.traceID.length > 0 &&
    record.payloadKeys.includes("messageID") &&
    record.subscriberCount > 0 &&
    record.deliveryID.length > 0 &&
    record.payloadHash.length === 16,
  )
  if (!busReadback) {
    addIssue("opencode-event-live-runtime.bus-readback", "OpenCode event live runtime fixture must retain bus payload, subscriber, delivery, and payload hash readback.")
  }
  const orderingReadback = fixture.orderingReadback.some((record) =>
    record.eventType === "message.update" &&
    record.previousEventType === "session.created" &&
    record.timestampHash.length === 16 &&
    record.monotonicOrderMarker === "source-order-0002" &&
    record.sequence > 1,
  )
  if (!orderingReadback) {
    addIssue("opencode-event-live-runtime.ordering-readback", "OpenCode event live runtime fixture must retain source-ordered event timing readback.")
  }
  const sqliteReadback = fixture.sqliteReadback.some((record) =>
    record.table === "session_event" &&
    record.operation === "insert" &&
    record.rowKeys.includes("payload") &&
    record.transactionID.length > 0 &&
    record.beforeRowHash.length === 16 &&
    record.afterRowHash.length === 16 &&
    record.cursorKey === "updated_at:id" &&
    record.fsyncMarker === "deterministic-local",
  )
  if (!sqliteReadback) {
    addIssue("opencode-event-live-runtime.sqlite-readback", "OpenCode event live runtime fixture must retain sqlite table, row, transaction, cursor, and fsync readback.")
  }
  const eventLogReadback = fixture.eventLogReadback.some((record) =>
    record.eventTypes.includes("session.created") &&
    record.eventTypes.includes("message.update") &&
    record.envelopeKeys.includes("traceID") &&
    record.messagePartKinds.includes("tool-call") &&
    record.readbackCursor.length > 0 &&
    record.sequenceCount >= 2,
  )
  if (!eventLogReadback) {
    addIssue("opencode-event-live-runtime.event-log-readback", "OpenCode event live runtime fixture must retain ordered event log, envelope key, part kind, and cursor readback.")
  }
  for (const requiredGap of [
    "opencode-event-live-runtime-fixture-partial-native-gap",
    "opencode-live-syncevent-bus-runtime-not-replayed",
    "opencode-event-ordering-not-exact",
    "opencode-sqlite-event-side-effects-not-replayed",
    "opencode-event-raw-payload-private-fields-not-replayed",
    "opencode-event-projector-side-effects-not-replayed",
  ]) {
    if (!fixture.knownGaps.includes(requiredGap)) {
      addIssue("opencode-event-live-runtime.native-gaps", `OpenCode event live runtime fixture no longer records ${requiredGap}.`)
    }
  }
  if (!fixture.retainedFields.includes("SyncEvent bus payload key readback") || !fixture.retainedFields.includes("event log cursor and envelope key readback") || !fixture.lossyFields.some((field) => /native|private|side effects/i.test(field))) {
    addIssue("opencode-event-live-runtime.retained-lossy-fields", "OpenCode event live runtime fixture must retain local readback keys and name native lossiness.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function openCodeEventSourceBranchAnchor(input: OpenCodeEventSourceMatrixBranchAnchor): OpenCodeEventSourceMatrixBranchAnchor {
  return input
}

export function buildOpenCodeEventSourceMatrixSnapshot(): OpenCodeEventSourceMatrixSnapshot {
  const branchAnchors: OpenCodeEventSourceMatrixBranchAnchor[] = [
    openCodeEventSourceBranchAnchor({
      branchID: "event-envelope-shape",
      status: "partial",
      sourceRefIDs: ["session-service", "message-v2"],
      eventAtomIDs: ["opencode.event.envelope-bridge"],
      eventPortIDs: ["event.envelope"],
      localEvidenceRefs: uniqueStrings([
        "contracts-schema:event-envelope",
        "opencode-event:source-matrix",
        "opencode-event:live-runtime-fixture",
        "conformance:opencode-event-envelope-native-exact-fixture",
        "event-envelope-native-exact:opencode",
        "opencode-event-envelope:native-exact-fixture",
        "conformance:opencode-event-native-exact-fixture",
        "event-native-exact:opencode",
        "opencode-event:native-exact-fixture",
      ]),
      localMarkers: ["EventEnvelope", "Event", "sessionID", "traceID", "event-envelope:live-readback", "event-envelope:native-exact"],
      knownGaps: [],
    }),
    openCodeEventSourceBranchAnchor({
      branchID: "syncevent-stream-projection",
      status: "partial",
      sourceRefIDs: ["session-service", "message-v2", "session-projectors", "local-event-live-runtime-fixture"],
      eventAtomIDs: ["opencode.event.envelope-bridge", "opencode.event.syncevent-bridge"],
      eventPortIDs: ["event.envelope", "event.log"],
      localEvidenceRefs: uniqueStrings([
        "session-atoms:projector",
        "opencode-session:source-matrix",
        "opencode-event:live-runtime-fixture",
        "conformance:opencode-sync-event-log-native-exact-fixture",
        "sync-event-log-native-exact:opencode",
        "opencode-sync-event-log:native-exact-fixture",
        "conformance:opencode-event-native-exact-fixture",
        "event-native-exact:opencode",
        "opencode-event:native-exact-fixture",
      ]),
      localMarkers: ["SyncEvent", "Event", "stream", "projection", "syncevent-bus:live-readback", "syncevent-log:native-exact"],
      knownGaps: ["opencode-event-live-runtime-fixture-partial-native-gap", "opencode-live-syncevent-bus-runtime-not-replayed"],
    }),
    openCodeEventSourceBranchAnchor({
      branchID: "message-v2-event-stream",
      status: "partial",
      sourceRefIDs: ["message-v2", "local-event-live-runtime-fixture"],
      eventAtomIDs: ["opencode.event.syncevent-bridge"],
      eventPortIDs: ["event.log"],
      localEvidenceRefs: uniqueStrings([
        "opencode-session-message-part:message-part-projector",
        "opencode-event:live-runtime-fixture",
        "conformance:opencode-sync-event-log-native-exact-fixture",
        "sync-event-log-native-exact:opencode",
        "opencode-sync-event-log:native-exact-fixture",
        "conformance:opencode-event-native-exact-fixture",
        "event-native-exact:opencode",
        "opencode-event:native-exact-fixture",
      ]),
      localMarkers: ["MessageV2", "Part", "cursor", "page", "message-part-kind:live-readback", "message-v2-event-stream:native-exact"],
      knownGaps: ["opencode-event-live-runtime-fixture-partial-native-gap", "opencode-message-v2-event-private-state-not-fully-replayed"],
    }),
    openCodeEventSourceBranchAnchor({
      branchID: "session-projector-row-mapping",
      status: "partial",
      sourceRefIDs: ["session-projectors", "session-projectors-next", "local-event-live-runtime-fixture"],
      eventAtomIDs: ["opencode.event.envelope-bridge", "opencode.event.syncevent-bridge"],
      eventPortIDs: ["event.envelope", "event.log"],
      localEvidenceRefs: uniqueStrings([
        "current-module:opencode-event-source-locations",
        "opencode-session-message-part:storage-roundtrip",
        "opencode-event:live-runtime-fixture",
        "conformance:opencode-sync-event-log-native-exact-fixture",
        "sync-event-log-native-exact:opencode",
        "opencode-sync-event-log:native-exact-fixture",
        "conformance:opencode-event-native-exact-fixture",
        "event-native-exact:opencode",
        "opencode-event:native-exact-fixture",
      ]),
      localMarkers: ["toPartialRow", "encodeDateTimes", "encodeMessageData", "sqlite", "sqlite-row:live-readback", "session-projectors-next:native-exact"],
      knownGaps: ["opencode-event-live-runtime-fixture-partial-native-gap", "opencode-event-row-mapping-roundtrip-not-proven"],
    }),
    openCodeEventSourceBranchAnchor({
      branchID: "event-log-readback",
      status: "partial",
      sourceRefIDs: ["session-service", "message-v2", "local-event-live-runtime-fixture"],
      eventAtomIDs: ["opencode.event.syncevent-bridge"],
      eventPortIDs: ["event.log"],
      localEvidenceRefs: uniqueStrings([
        "contracts-schema:event-envelope",
        "session-atoms:event-log",
        "opencode-event:live-runtime-fixture",
        "conformance:opencode-sync-event-log-native-exact-fixture",
        "sync-event-log-native-exact:opencode",
        "opencode-sync-event-log:native-exact-fixture",
        "conformance:opencode-event-native-exact-fixture",
        "event-native-exact:opencode",
        "opencode-event:native-exact-fixture",
      ]),
      localMarkers: ["event.log", "ordered EventEnvelope", "session.created", "message.update", "event-log-cursor:live-readback", "sync-event-log:native-exact"],
      knownGaps: ["opencode-event-live-runtime-fixture-partial-native-gap", "opencode-event-log-readback-order-not-exact"],
    }),
    openCodeEventSourceBranchAnchor({
      branchID: "live-syncevent-bus-runtime",
      status: "partial",
      sourceRefIDs: ["session-service", "message-v2", "session-projectors", "local-event-runtime-projection", "local-event-live-runtime-fixture"],
      eventAtomIDs: ["opencode.event.envelope-bridge", "opencode.event.syncevent-bridge"],
      eventPortIDs: ["event.envelope", "event.log"],
      localEvidenceRefs: ["opencode-event:source-matrix", "opencode-event:runtime-projection", "opencode-event:live-runtime-fixture"],
      localMarkers: ["syncevent-bus:projected", "bus-runtime:partial", "subscription-lifecycle:not-replayed", "bus-delivery:live-readback"],
      knownGaps: ["opencode-event-live-runtime-fixture-partial-native-gap", "opencode-live-syncevent-bus-runtime-not-replayed"],
    }),
    openCodeEventSourceBranchAnchor({
      branchID: "exact-event-ordering",
      status: "partial",
      sourceRefIDs: ["session-service", "message-v2", "local-event-runtime-projection", "local-event-live-runtime-fixture"],
      eventAtomIDs: ["opencode.event.syncevent-bridge"],
      eventPortIDs: ["event.log"],
      localEvidenceRefs: ["opencode-event:source-matrix", "opencode-event:runtime-projection", "opencode-event:live-runtime-fixture"],
      localMarkers: ["event-order:projected", "timestamp-order:partial", "async-interleaving:not-exact", "source-order:live-readback"],
      knownGaps: ["opencode-event-live-runtime-fixture-partial-native-gap", "opencode-event-ordering-not-exact"],
    }),
    openCodeEventSourceBranchAnchor({
      branchID: "sqlite-event-side-effects",
      status: "partial",
      sourceRefIDs: ["session-projectors-next", "local-event-runtime-projection", "local-event-live-runtime-fixture"],
      eventAtomIDs: ["opencode.event.syncevent-bridge"],
      eventPortIDs: ["event.log"],
      localEvidenceRefs: ["opencode-event:source-matrix", "opencode-event:runtime-projection", "opencode-event:live-runtime-fixture", "opencode-session-message-part:storage-roundtrip"],
      localMarkers: ["sqlite-side-effects:projected", "transaction-order:partial", "storage-write:not-exact", "sqlite-transaction:live-readback"],
      knownGaps: ["opencode-event-live-runtime-fixture-partial-native-gap", "opencode-sqlite-event-side-effects-not-replayed"],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-event-source-matrix" as const,
    fixtureID: "opencode-event:source-matrix" as const,
    sourceRefs: OPENCODE_EVENT_SOURCE_REFS,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredEventAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.eventAtomIDs)),
    coveredEventPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.eventPortIDs)),
    nativeEvidenceRefs: uniqueStrings([
      "conformance:opencode-event-source-matrix",
      ...OPENCODE_EVENT_NATIVE_EXACT_EVIDENCE_REFS,
    ]),
    fixtureIDs: uniqueStrings([
      "opencode-event:source-matrix",
      ...OPENCODE_EVENT_NATIVE_EXACT_FIXTURE_IDS,
    ]),
    knownGaps: uniqueStrings([
      "opencode-event-source-matrix-covered-by-partial-fixture",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type ProductEventSourceMatrixProduct = "pi" | "nanobot" | "hermes"
export type ProductEventSourceMatrixPinnedRepo = "earendil-works/pi" | "HKUDS/nanobot" | "NousResearch/hermes-agent"
export type ProductEventSourceMatrixPinnedRef =
  | "7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  | "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  | "92a567db2d7a5031df8211efbfdad864c2f51faf"
export type ProductEventSourceMatrixUpstreamRef =
  | "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  | "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  | "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
export type ProductEventSourceMatrixEvidenceRef =
  | "conformance:pi-event-source-matrix"
  | "conformance:nanobot-event-source-matrix"
  | "conformance:hermes-event-source-matrix"
export type ProductEventSourceMatrixFixtureID = "pi-event:source-matrix" | "nanobot-event:source-matrix" | "hermes-event:source-matrix"
export type ProductEventSourceRefID =
  | "upstream-session-runtime"
  | "upstream-message-envelope"
  | "upstream-progress-hook"
  | "upstream-channel-envelope"
  | "upstream-transport-types"
  | "upstream-codex-event-projector"
  | "local-event-atoms"
  | "local-event-adapter"
  | "local-contract-port-fixtures"

export interface ProductEventSourceRef {
  id: ProductEventSourceRefID
  repo: ProductEventSourceMatrixPinnedRepo | "helix/local"
  ref: ProductEventSourceMatrixPinnedRef | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11"
}

export type ProductEventSourceMatrixBranchID =
  | "event-envelope-shape-surface"
  | "runtime-event-stream-surface"
  | "event-persistence-surface"
  | "dropped-field-negative-surface"
  | "native-event-ordering"
  | "native-event-persistence-readback"
  | "native-dropped-field-negative"

export type ProductEventSourceMatrixBranchStatus = "partial" | "missing"

export interface ProductEventSourceMatrixBranchAnchor {
  branchID: ProductEventSourceMatrixBranchID
  status: ProductEventSourceMatrixBranchStatus
  sourceRefIDs: ProductEventSourceRefID[]
  eventAtomIDs: string[]
  eventPortIDs: string[]
  localEvidenceRefs: ProductEventSourceMatrixFixtureID[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface ProductEventSourceMatrixSnapshot {
  schemaVersion: 1
  product: ProductEventSourceMatrixProduct
  upstreamRef: ProductEventSourceMatrixUpstreamRef
  pinnedRepo: ProductEventSourceMatrixPinnedRepo
  pinnedRef: ProductEventSourceMatrixPinnedRef
  evidenceRef: ProductEventSourceMatrixEvidenceRef
  fixtureID: ProductEventSourceMatrixFixtureID
  sourceRefs: ProductEventSourceRef[]
  branchAnchors: ProductEventSourceMatrixBranchAnchor[]
  partialBranchIDs: ProductEventSourceMatrixBranchID[]
  missingBranchIDs: ProductEventSourceMatrixBranchID[]
  coveredEventAtomIDs: string[]
  coveredEventPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

interface ProductEventSourceMatrixConfig {
  product: ProductEventSourceMatrixProduct
  atomPrefix: "pi" | "nanobot" | "hermes"
  upstreamRef: ProductEventSourceMatrixUpstreamRef
  pinnedRepo: ProductEventSourceMatrixPinnedRepo
  pinnedRef: ProductEventSourceMatrixPinnedRef
  evidenceRef: ProductEventSourceMatrixEvidenceRef
  fixtureID: ProductEventSourceMatrixFixtureID
  sourceRefs: ProductEventSourceRef[]
  envelopeAtomID: string
  runtimeAtomIDs: string[]
  sourceRefGroups: {
    envelope: ProductEventSourceRefID[]
    runtime: ProductEventSourceRefID[]
    persistence: ProductEventSourceRefID[]
    negative: ProductEventSourceRefID[]
  }
}

const PRODUCT_EVENT_SOURCE_MATRIX_CONFIGS: Record<ProductEventSourceMatrixProduct, ProductEventSourceMatrixConfig> = {
  pi: {
    product: "pi",
    atomPrefix: "pi",
    upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    pinnedRepo: "earendil-works/pi",
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    evidenceRef: "conformance:pi-event-source-matrix",
    fixtureID: "pi-event:source-matrix",
    envelopeAtomID: "pi.event.envelope-bridge",
    runtimeAtomIDs: ["pi.event.runtime-bridge", "pi.extension.runtime-event-bridge"],
    sourceRefGroups: {
      envelope: ["upstream-message-envelope", "upstream-session-runtime", "local-event-atoms", "local-contract-port-fixtures"],
      runtime: ["upstream-session-runtime", "local-event-atoms", "local-event-adapter", "local-contract-port-fixtures"],
      persistence: ["upstream-session-runtime", "upstream-message-envelope", "local-event-atoms", "local-event-adapter"],
      negative: ["upstream-message-envelope", "local-event-atoms", "local-contract-port-fixtures"],
    },
    sourceRefs: [
      {
        id: "upstream-session-runtime",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/src/core/agent-session-runtime.ts",
        symbols: ["CreateAgentSessionRuntimeResult", "AgentSessionRuntime", "emitBeforeSwitch", "emitBeforeFork", "switchSession", "newSession", "fork", "importFromJsonl"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-message-envelope",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/agent/src/harness/messages.ts",
        symbols: ["BashExecutionMessage", "CustomMessage", "BranchSummaryMessage", "CompactionSummaryMessage", "createBranchSummaryMessage", "createCompactionSummaryMessage", "convertToLlm"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "local-event-atoms",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/extension-atoms.ts",
        symbols: ["pi.event.envelope-bridge", "pi.event.runtime-bridge", "pi.extension.runtime-event-bridge"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-event-adapter",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/extension-adapter.ts",
        symbols: ["createPiRuntimeEventBridge", "PiRuntimeEvent", "ExtensionRuntime"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-contract-port-fixtures",
        repo: "helix/local",
        ref: "current",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: ["eventPortContractFixtures", "buildPiEventSourceMatrixSnapshot", "event.envelope", "event.log"],
        evidence: "local-source:2026-06-11",
      },
    ],
  },
  nanobot: {
    product: "nanobot",
    atomPrefix: "nanobot",
    upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    pinnedRepo: "HKUDS/nanobot",
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    evidenceRef: "conformance:nanobot-event-source-matrix",
    fixtureID: "nanobot-event:source-matrix",
    envelopeAtomID: "nanobot.event.envelope-bridge",
    runtimeAtomIDs: ["nanobot.event.bus-bridge"],
    sourceRefGroups: {
      envelope: ["upstream-progress-hook", "upstream-channel-envelope", "local-event-atoms", "local-contract-port-fixtures"],
      runtime: ["upstream-channel-envelope", "upstream-progress-hook", "local-event-atoms", "local-contract-port-fixtures"],
      persistence: ["upstream-channel-envelope", "local-event-atoms"],
      negative: ["upstream-progress-hook", "upstream-channel-envelope", "local-event-atoms", "local-contract-port-fixtures"],
    },
    sourceRefs: [
      {
        id: "upstream-progress-hook",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/agent/progress_hook.py",
        symbols: ["AgentProgressHook", "on_stream", "on_stream_end", "before_execute_tools", "emit_reasoning", "emit_reasoning_end", "after_iteration", "finalize_content"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-channel-envelope",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/channels/websocket.py",
        symbols: ["WebSocketConfig", "WebSocketChannel", "_send_event", "_dispatch_envelope", "send_reasoning_delta", "send_delta", "send_turn_end", "send_session_updated"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "local-event-atoms",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-nanobot/src/nanobot-atoms.ts",
        symbols: ["nanobot.event.envelope-bridge", "nanobot.event.bus-bridge", "nanobotSpecialAtomDescriptor"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-contract-port-fixtures",
        repo: "helix/local",
        ref: "current",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: ["eventPortContractFixtures", "buildNanobotEventSourceMatrixSnapshot", "event.envelope", "event.log"],
        evidence: "local-source:2026-06-11",
      },
    ],
  },
  hermes: {
    product: "hermes",
    atomPrefix: "hermes",
    upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
    pinnedRepo: "NousResearch/hermes-agent",
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    evidenceRef: "conformance:hermes-event-source-matrix",
    fixtureID: "hermes-event:source-matrix",
    envelopeAtomID: "hermes.event.envelope-bridge",
    runtimeAtomIDs: ["hermes.event.runtime-bridge"],
    sourceRefGroups: {
      envelope: ["upstream-transport-types", "upstream-codex-event-projector", "local-event-atoms", "local-contract-port-fixtures"],
      runtime: ["upstream-codex-event-projector", "upstream-transport-types", "local-event-atoms", "local-contract-port-fixtures"],
      persistence: ["upstream-codex-event-projector", "local-event-atoms"],
      negative: ["upstream-transport-types", "upstream-codex-event-projector", "local-event-atoms", "local-contract-port-fixtures"],
    },
    sourceRefs: [
      {
        id: "upstream-transport-types",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "agent/transports/types.py",
        symbols: ["ToolCall", "Usage", "NormalizedResponse", "build_tool_call", "map_finish_reason"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-codex-event-projector",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "agent/transports/codex_event_projector.py",
        symbols: ["ProjectionResult", "CodexEventProjector", "project", "_project_command", "_project_dynamic_tool_call", "_project_opaque"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "local-event-atoms",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-hermes/src/atoms/types.ts",
        symbols: ["HermesSpecialAtomDescriptor", "hermes.event.envelope-bridge", "hermes.event.runtime-bridge"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-contract-port-fixtures",
        repo: "helix/local",
        ref: "current",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: ["eventPortContractFixtures", "buildHermesEventSourceMatrixSnapshot", "event.envelope", "event.log"],
        evidence: "local-source:2026-06-11",
      },
    ],
  },
}

function productEventSourceBranchAnchor(input: ProductEventSourceMatrixBranchAnchor): ProductEventSourceMatrixBranchAnchor {
  return input
}

function buildProductEventSourceMatrixSnapshotFromConfig(config: ProductEventSourceMatrixConfig): ProductEventSourceMatrixSnapshot {
  const fixtureID = config.fixtureID
  const eventAtomIDs = [config.envelopeAtomID, ...config.runtimeAtomIDs]
  const gap = (suffix: string) => `${config.atomPrefix}-event-${suffix}`
  const branchAnchors: ProductEventSourceMatrixBranchAnchor[] = [
    productEventSourceBranchAnchor({
      branchID: "event-envelope-shape-surface",
      status: "partial",
      sourceRefIDs: config.sourceRefGroups.envelope,
      eventAtomIDs: [config.envelopeAtomID],
      eventPortIDs: ["event.envelope"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["EventEnvelope", "field-shape", "source", "traceID", "payload"],
      knownGaps: [gap("envelope-native-field-coverage-not-exhaustive")],
    }),
    productEventSourceBranchAnchor({
      branchID: "runtime-event-stream-surface",
      status: "partial",
      sourceRefIDs: config.sourceRefGroups.runtime,
      eventAtomIDs: config.runtimeAtomIDs,
      eventPortIDs: ["event.log"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["runtime-event", "event.log", "stream", "projection"],
      knownGaps: [gap("runtime-event-stream-not-replayed")],
    }),
    productEventSourceBranchAnchor({
      branchID: "event-persistence-surface",
      status: "partial",
      sourceRefIDs: config.sourceRefGroups.persistence,
      eventAtomIDs,
      eventPortIDs: ["event.envelope", "event.log"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["persistence", "readback", "replay", "ordered EventEnvelope"],
      knownGaps: [gap("persistence-readback-not-exact")],
    }),
    productEventSourceBranchAnchor({
      branchID: "dropped-field-negative-surface",
      status: "partial",
      sourceRefIDs: config.sourceRefGroups.negative,
      eventAtomIDs,
      eventPortIDs: ["event.envelope", "event.log"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["dropped-field-negative", "field-shape", "lossy-projection-guard"],
      knownGaps: [gap("dropped-field-negative-not-exhaustive")],
    }),
    productEventSourceBranchAnchor({
      branchID: "native-event-ordering",
      status: "missing",
      sourceRefIDs: config.sourceRefGroups.runtime,
      eventAtomIDs,
      eventPortIDs: ["event.envelope", "event.log"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["event-order:not-exact", "timestamp-order:partial", "runtime-clock:not-spawned"],
      knownGaps: [gap("native-event-ordering-not-replayed")],
    }),
    productEventSourceBranchAnchor({
      branchID: "native-event-persistence-readback",
      status: "missing",
      sourceRefIDs: config.sourceRefGroups.persistence,
      eventAtomIDs,
      eventPortIDs: ["event.log"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["persistence-readback:not-replayed", "storage-side-effects:not-exact"],
      knownGaps: [gap("native-event-persistence-readback-not-replayed")],
    }),
    productEventSourceBranchAnchor({
      branchID: "native-dropped-field-negative",
      status: "missing",
      sourceRefIDs: config.sourceRefGroups.negative,
      eventAtomIDs,
      eventPortIDs: ["event.envelope", "event.log"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["dropped-field-negative:not-exact", "upstream-field-loss:not-exhaustive"],
      knownGaps: [gap("native-dropped-field-negative-not-replayed")],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: config.product,
    upstreamRef: config.upstreamRef,
    pinnedRepo: config.pinnedRepo,
    pinnedRef: config.pinnedRef,
    evidenceRef: config.evidenceRef,
    fixtureID: config.fixtureID,
    sourceRefs: config.sourceRefs,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredEventAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.eventAtomIDs)),
    coveredEventPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.eventPortIDs)),
    knownGaps: uniqueStrings([
      `${config.product}-event-source-matrix-covered-by-partial-fixture`,
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildProductEventSourceMatrixSnapshot(product: ProductEventSourceMatrixProduct): ProductEventSourceMatrixSnapshot {
  return buildProductEventSourceMatrixSnapshotFromConfig(PRODUCT_EVENT_SOURCE_MATRIX_CONFIGS[product])
}

export function buildPiEventSourceMatrixSnapshot(): ProductEventSourceMatrixSnapshot {
  return buildProductEventSourceMatrixSnapshot("pi")
}

export function buildNanobotEventSourceMatrixSnapshot(): ProductEventSourceMatrixSnapshot {
  return buildProductEventSourceMatrixSnapshot("nanobot")
}

export function buildHermesEventSourceMatrixSnapshot(): ProductEventSourceMatrixSnapshot {
  return buildProductEventSourceMatrixSnapshot("hermes")
}

export type EventEnvelopeReplayGateProduct = "opencode" | ProductEventSourceMatrixProduct
export type EventEnvelopeReplayGateDimension = "field-shape" | "event-order" | "dropped-field-negative" | "persistence" | "replay"

export interface EventEnvelopeReplayGateCase {
  product: EventEnvelopeReplayGateProduct
  upstreamRef: OpenCodeEventSourceMatrixSnapshot["upstreamRef"] | ProductEventSourceMatrixUpstreamRef
  evidenceRef: OpenCodeEventSourceMatrixSnapshot["evidenceRef"] | ProductEventSourceMatrixEvidenceRef
  fixtureID: OpenCodeEventSourceMatrixSnapshot["fixtureID"] | ProductEventSourceMatrixFixtureID
  fieldShape: string[]
  eventOrder: string[]
  persistence: string[]
  replay: string[]
  droppedFieldNegative: string[]
  evidenceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
}

export interface EventEnvelopeReplayGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:event-envelope-replay-gate"
  fixtureID: "event:envelope-replay-gate"
  products: EventEnvelopeReplayGateProduct[]
  comparisonDimensions: EventEnvelopeReplayGateDimension[]
  cases: EventEnvelopeReplayGateCase[]
  fingerprint: string
}

export interface EventEnvelopeReplayGateIssue {
  id: string
  product: EventEnvelopeReplayGateProduct
  dimension: EventEnvelopeReplayGateDimension
  message: string
}

export interface EventEnvelopeReplayGateVerification {
  ok: boolean
  issues: EventEnvelopeReplayGateIssue[]
}

export function buildEventEnvelopeReplayGateSnapshot(): EventEnvelopeReplayGateSnapshot {
  const cases = [
    buildOpenCodeEventEnvelopeReplayGateCase(buildOpenCodeEventSourceMatrixSnapshot()),
    buildProductEventEnvelopeReplayGateCase(buildPiEventSourceMatrixSnapshot()),
    buildProductEventEnvelopeReplayGateCase(buildNanobotEventSourceMatrixSnapshot()),
    buildProductEventEnvelopeReplayGateCase(buildHermesEventSourceMatrixSnapshot()),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:event-envelope-replay-gate" as const,
    fixtureID: "event:envelope-replay-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["field-shape", "event-order", "dropped-field-negative", "persistence", "replay"] as EventEnvelopeReplayGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyEventEnvelopeReplayGateSnapshot(snapshot: EventEnvelopeReplayGateSnapshot): EventEnvelopeReplayGateVerification {
  const issues: EventEnvelopeReplayGateIssue[] = []
  const products: EventEnvelopeReplayGateProduct[] = ["opencode", "pi", "nanobot", "hermes"]
  const requiredFields = ["type", "timestamp", "payload"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "event-envelope.missing-product",
        product,
        dimension: "replay",
        message: `Missing event envelope replay gate case for ${product}.`,
      })
      continue
    }
    const missingFields = requiredFields.filter((field) => !item.fieldShape.includes(field))
    if (missingFields.length > 0) {
      issues.push({
        id: "event-envelope.field-shape",
        product,
        dimension: "field-shape",
        message: `${product} event envelope gate dropped required field(s): ${missingFields.join(", ")}.`,
      })
    }
    if (!eventReplayOrderMatchesProduct(product, item.eventOrder)) {
      issues.push({
        id: "event-envelope.event-order",
        product,
        dimension: "event-order",
        message: `${product} event envelope replay order no longer matches the pinned partial source matrix.`,
      })
    }
    if (!item.persistence.some((entry) => /event-log|persistence|readback|projector|sqlite|websocket|transport/i.test(entry))) {
      issues.push({
        id: "event-envelope.persistence",
        product,
        dimension: "persistence",
        message: `${product} event envelope replay gate no longer records persistence or readback coverage.`,
      })
    }
    if (item.replay.length === 0) {
      issues.push({
        id: "event-envelope.replay",
        product,
        dimension: "replay",
        message: `${product} event envelope replay gate does not retain source replay anchors.`,
      })
    }
    if (
      product === "opencode" &&
      (!eventIncludesAll(item.nativeEvidenceRefs, OPENCODE_EVENT_NATIVE_EXACT_EVIDENCE_REFS) ||
        !eventIncludesAll(item.fixtureIDs, OPENCODE_EVENT_NATIVE_EXACT_FIXTURE_IDS))
    ) {
      issues.push({
        id: "event-envelope.native-exact-evidence",
        product,
        dimension: "replay",
        message: "OpenCode event envelope replay gate no longer carries native exact event fixture evidence.",
      })
    }
    const negativeMissingFields = requiredFields.filter((field) => !item.droppedFieldNegative.includes(field))
    if (negativeMissingFields.length > 0) {
      issues.push({
        id: "event-envelope.dropped-field-negative",
        product,
        dimension: "dropped-field-negative",
        message: `${product} event envelope negative gate does not guard dropped field(s): ${negativeMissingFields.join(", ")}.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildOpenCodeEventEnvelopeReplayGateCase(snapshot: OpenCodeEventSourceMatrixSnapshot): EventEnvelopeReplayGateCase {
  return {
    product: "opencode",
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    fieldShape: ["type", "timestamp", "payload", "sessionID", "traceID", "source", "metadata", "SyncEvent"],
    eventOrder: snapshot.partialBranchIDs,
    persistence: eventReplayBranchMarkers(snapshot.branchAnchors, ["session-projector-row-mapping", "event-log-readback"]),
    replay: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    droppedFieldNegative: ["type", "timestamp", "payload", "sessionID", "traceID", "source"],
    evidenceRefs: uniqueStrings([
      snapshot.evidenceRef,
      snapshot.fixtureID,
      "contracts-schema:event-envelope",
      "session-atoms:event-log",
      ...snapshot.nativeEvidenceRefs,
      ...snapshot.fixtureIDs,
    ]),
    nativeEvidenceRefs: snapshot.nativeEvidenceRefs,
    fixtureIDs: snapshot.fixtureIDs,
    knownLossiness: snapshot.knownGaps,
  }
}

function buildProductEventEnvelopeReplayGateCase(snapshot: ProductEventSourceMatrixSnapshot): EventEnvelopeReplayGateCase {
  return {
    product: snapshot.product,
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    fieldShape: ["type", "timestamp", "payload", "sessionID", "traceID", "source", "metadata", `${snapshot.product}:runtime-event`],
    eventOrder: snapshot.partialBranchIDs,
    persistence: eventReplayBranchMarkers(snapshot.branchAnchors, ["event-persistence-surface"]),
    replay: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    droppedFieldNegative: ["type", "timestamp", "payload", "sessionID", "traceID", "source"],
    evidenceRefs: [snapshot.evidenceRef, snapshot.fixtureID],
    nativeEvidenceRefs: [snapshot.evidenceRef],
    fixtureIDs: [snapshot.fixtureID],
    knownLossiness: snapshot.knownGaps,
  }
}

function eventReplayBranchMarkers<TAnchor extends { branchID: string; localMarkers: string[] }>(anchors: TAnchor[], branchIDs: string[]): string[] {
  const selected = anchors.filter((anchor) => branchIDs.includes(anchor.branchID))
  return uniqueStrings(selected.flatMap((anchor) => [anchor.branchID, ...anchor.localMarkers]))
}

function eventReplayOrderMatchesProduct(product: EventEnvelopeReplayGateProduct, eventOrder: string[]): boolean {
  if (product === "opencode") return eventReplayOrderContainsInOrder(eventOrder, ["event-envelope-shape", "syncevent-stream-projection", "event-log-readback"])
  return eventReplayOrderContainsInOrder(eventOrder, ["event-envelope-shape-surface", "runtime-event-stream-surface", "event-persistence-surface", "dropped-field-negative-surface"])
}

function eventReplayOrderContainsInOrder(eventOrder: string[], markers: string[]): boolean {
  let cursor = -1
  for (const marker of markers) {
    const index = eventOrder.findIndex((entry, candidateIndex) => candidateIndex > cursor && entry.includes(marker))
    if (index < 0) return false
    cursor = index
  }
  return true
}

export type EventEnvelopeExactDiffBlockerProduct = EventEnvelopeReplayGateProduct
export type EventEnvelopeExactDiffBlockerDimension = EventEnvelopeReplayGateDimension

export interface EventEnvelopeExactDiffBlockerCase {
  product: EventEnvelopeExactDiffBlockerProduct
  upstreamRef: EventEnvelopeReplayGateCase["upstreamRef"]
  fixtureID: EventEnvelopeReplayGateCase["fixtureID"]
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  fieldShape: string[]
  eventOrder: string[]
  droppedFieldNegative: string[]
  persistence: string[]
  replay: string[]
  sourceAnchors: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "helix-only"
  knownLossiness: string[]
}

export interface EventEnvelopeExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:event-envelope-exact-diff-blocker-gate"
  fixtureID: "event:envelope-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: EventEnvelopeExactDiffBlockerProduct[]
  comparisonDimensions: EventEnvelopeExactDiffBlockerDimension[]
  cases: EventEnvelopeExactDiffBlockerCase[]
  fingerprint: string
}

export interface EventEnvelopeExactDiffBlockerIssue {
  id: string
  product: EventEnvelopeExactDiffBlockerProduct
  dimension: EventEnvelopeExactDiffBlockerDimension
  message: string
}

export interface EventEnvelopeExactDiffBlockerVerification {
  ok: boolean
  issues: EventEnvelopeExactDiffBlockerIssue[]
}

export function buildEventEnvelopeExactDiffBlockerSnapshot(): EventEnvelopeExactDiffBlockerSnapshot {
  const replayGate = buildEventEnvelopeReplayGateSnapshot()
  const cases = replayGate.cases.map(buildEventEnvelopeExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:event-envelope-exact-diff-blocker-gate" as const,
    fixtureID: "event:envelope-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["field-shape", "event-order", "dropped-field-negative", "persistence", "replay"] as EventEnvelopeExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyEventEnvelopeExactDiffBlockerSnapshot(
  snapshot: EventEnvelopeExactDiffBlockerSnapshot,
): EventEnvelopeExactDiffBlockerVerification {
  const issues: EventEnvelopeExactDiffBlockerIssue[] = []
  const products: EventEnvelopeExactDiffBlockerProduct[] = ["opencode", "pi", "nanobot", "hermes"]
  const requiredFields = ["type", "timestamp", "payload"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "event-envelope-exact-diff.missing-product",
        product,
        dimension: "replay",
        message: `Missing event envelope exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "event-envelope-exact-diff.native-claim",
        product,
        dimension: "field-shape",
        message: `${product} event envelope blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    const missingFields = requiredFields.filter((field) => !item.fieldShape.includes(field))
    if (missingFields.length > 0 || !eventExactDiffContains(item.fieldShape, /upstream|required|field|shape|event/i)) {
      issues.push({
        id: "event-envelope-exact-diff.field-shape",
        product,
        dimension: "field-shape",
        message: `${product} event envelope blocker no longer records required upstream field shape anchors.`,
      })
    }
    if (!eventReplayOrderMatchesProduct(product, item.eventOrder) || !eventExactDiffContains(item.eventOrder, /event|order|stream|runtime|native/i)) {
      issues.push({
        id: "event-envelope-exact-diff.event-order",
        product,
        dimension: "event-order",
        message: `${product} event envelope blocker no longer records event-order drift anchors.`,
      })
    }
    if (!eventExactDiffContains(item.droppedFieldNegative, /dropped|negative|field|loss/i) || requiredFields.some((field) => !item.droppedFieldNegative.includes(field))) {
      issues.push({
        id: "event-envelope-exact-diff.dropped-field-negative",
        product,
        dimension: "dropped-field-negative",
        message: `${product} event envelope blocker no longer records dropped-field negative anchors.`,
      })
    }
    if (!eventExactDiffContains(item.persistence, /persistence|readback|event-log|sqlite|websocket|trajectory|projector|transport/i)) {
      issues.push({
        id: "event-envelope-exact-diff.persistence",
        product,
        dimension: "persistence",
        message: `${product} event envelope blocker no longer records persistence/readback anchors.`,
      })
    }
    if (!eventExactDiffContains(item.replay, /source|upstream|replay|matrix|projector|runtime|event/i)) {
      issues.push({
        id: "event-envelope-exact-diff.replay",
        product,
        dimension: "replay",
        message: `${product} event envelope blocker no longer records source replay anchors.`,
      })
    }
    if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.sourceAnchors.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "event-envelope-exact-diff.helix-only",
        product,
        dimension: "replay",
        message: `${product} event envelope blocker is not anchored to source-matrix partial evidence.`,
      })
    }
    if (
      product === "opencode" &&
      (!eventIncludesAll(item.nativeEvidenceRefs, OPENCODE_EVENT_NATIVE_EXACT_EVIDENCE_REFS) ||
        !eventIncludesAll(item.fixtureIDs, OPENCODE_EVENT_NATIVE_EXACT_FIXTURE_IDS))
    ) {
      issues.push({
        id: "event-envelope-exact-diff.native-exact-evidence",
        product,
        dimension: "replay",
        message: "OpenCode event envelope blocker no longer carries native exact event fixture evidence.",
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildEventEnvelopeExactDiffBlockerCase(
  replayCase: EventEnvelopeReplayGateCase,
): EventEnvelopeExactDiffBlockerCase {
  return {
    product: replayCase.product,
    upstreamRef: replayCase.upstreamRef,
    fixtureID: replayCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    fieldShape: uniqueStrings([
      ...replayCase.fieldShape,
      "upstream-required-field-shape:not-exact",
    ]),
    eventOrder: eventExactDiffUniqueInOrder([
      ...replayCase.eventOrder,
      "native-event-ordering:not-exact",
    ]),
    droppedFieldNegative: uniqueStrings([
      ...replayCase.droppedFieldNegative,
      "dropped-field-negative:partial",
      "upstream-required-field-loss:not-exhaustive",
    ]),
    persistence: uniqueStrings([
      ...replayCase.persistence,
      "persistence-readback:not-exact",
      "native-storage-side-effects:not-replayed",
    ]),
    replay: uniqueStrings([
      ...replayCase.replay,
      "source-replay:not-native-capture",
      "upstream-event-stream:exact-diff-not-proven",
    ]),
    sourceAnchors: uniqueStrings(replayCase.replay),
    nativeEvidenceRefs: uniqueStrings([
      ...replayCase.evidenceRefs,
      ...replayCase.nativeEvidenceRefs,
      ...replayCase.fixtureIDs,
    ]),
    fixtureIDs: replayCase.fixtureIDs,
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...replayCase.knownLossiness,
      "event-envelope-native-ordering-not-proven",
      "event-envelope-persistence-readback-not-proven",
      "event-envelope-dropped-field-negative-not-exhaustive",
      "event-envelope-source-replay-not-native-capture",
    ]),
  }
}

function eventExactDiffContains(values: string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

function eventIncludesAll(values: string[], required: readonly string[]): boolean {
  return required.every((value) => values.includes(value))
}

function eventExactDiffUniqueInOrder(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean)
}

export type EventEnvelopePinnedReplayProduct = EventEnvelopeReplayGateProduct
export type EventEnvelopePinnedReplayDimension = EventEnvelopeReplayGateDimension

export interface EventEnvelopePinnedReplayEvent {
  eventID: string
  type: string
  timestamp: string
  sessionID: string
  traceID: string
  source: string
  payload: Record<string, unknown>
  persistenceRef: string
  sequence: number
}

export interface EventEnvelopePinnedReplayCase {
  product: EventEnvelopePinnedReplayProduct
  upstreamRef: EventEnvelopeReplayGateCase["upstreamRef"]
  fixtureID: EventEnvelopeReplayGateCase["fixtureID"]
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  upstreamEvents: EventEnvelopePinnedReplayEvent[]
  assembledEvents: EventEnvelopePinnedReplayEvent[]
  droppedFieldNegative: string[]
  persistenceReadback: string[]
  replayAnchors: string[]
  sourceAnchors: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  exactDiffRisk: "pinned-stream-needs-live-readback" | "helix-only"
  knownLossiness: string[]
}

export interface EventEnvelopePinnedReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:event-envelope-pinned-replay-gate"
  fixtureID: "event:envelope-pinned-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: EventEnvelopePinnedReplayProduct[]
  comparisonDimensions: EventEnvelopePinnedReplayDimension[]
  cases: EventEnvelopePinnedReplayCase[]
  fingerprint: string
}

export interface EventEnvelopePinnedReplayIssue {
  id: string
  product: EventEnvelopePinnedReplayProduct
  dimension: EventEnvelopePinnedReplayDimension
  message: string
}

export interface EventEnvelopePinnedReplayVerification {
  ok: boolean
  issues: EventEnvelopePinnedReplayIssue[]
}

export function buildEventEnvelopePinnedReplaySnapshot(): EventEnvelopePinnedReplaySnapshot {
  const replayGate = buildEventEnvelopeReplayGateSnapshot()
  const cases = replayGate.cases.map(buildEventEnvelopePinnedReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:event-envelope-pinned-replay-gate" as const,
    fixtureID: "event:envelope-pinned-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["field-shape", "event-order", "dropped-field-negative", "persistence", "replay"] as EventEnvelopePinnedReplayDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyEventEnvelopePinnedReplaySnapshot(
  snapshot: EventEnvelopePinnedReplaySnapshot,
): EventEnvelopePinnedReplayVerification {
  const issues: EventEnvelopePinnedReplayIssue[] = []
  const products: EventEnvelopePinnedReplayProduct[] = ["opencode", "pi", "nanobot", "hermes"]
  const requiredFields: Array<keyof EventEnvelopePinnedReplayEvent> = ["type", "timestamp", "sessionID", "traceID", "source"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "event-envelope-pinned-replay.missing-product",
        product,
        dimension: "replay",
        message: `Missing event envelope pinned replay case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "event-envelope-pinned-replay.native-claim",
        product,
        dimension: "replay",
        message: `${product} event envelope pinned replay must remain partial and cannot claim native parity.`,
      })
    }
    if (item.upstreamEvents.length === 0 || item.upstreamEvents.length !== item.assembledEvents.length) {
      issues.push({
        id: "event-envelope-pinned-replay.replay",
        product,
        dimension: "replay",
        message: `${product} event envelope pinned replay must compare non-empty upstream and assembled event streams of equal length.`,
      })
      continue
    }
    for (const field of requiredFields) {
      if (item.upstreamEvents.some((event) => event[field] === "" || event[field] === undefined)) {
        issues.push({
          id: "event-envelope-pinned-replay.field-shape",
          product,
          dimension: "field-shape",
          message: `${product} event envelope pinned replay lost required upstream field ${field}.`,
        })
        break
      }
    }
    if (!eventPinnedReplayStreamsMatch(item.upstreamEvents, item.assembledEvents)) {
      issues.push({
        id: "event-envelope-pinned-replay.field-shape",
        product,
        dimension: "field-shape",
        message: `${product} event envelope assembled fields no longer match the pinned upstream stream.`,
      })
    }
    if (!eventPinnedReplayOrderMatches(item.upstreamEvents, item.assembledEvents)) {
      issues.push({
        id: "event-envelope-pinned-replay.event-order",
        product,
        dimension: "event-order",
        message: `${product} event envelope assembled order no longer matches the pinned upstream stream.`,
      })
    }
    if (item.droppedFieldNegative.some((field) => !["type", "timestamp", "payload"].includes(field))) {
      issues.push({
        id: "event-envelope-pinned-replay.dropped-field-negative",
        product,
        dimension: "dropped-field-negative",
        message: `${product} event envelope dropped-field negative list contains an unknown required field.`,
      })
    }
    if (!eventExactDiffContains(item.persistenceReadback, /persistence|readback|exact-match|fixture-level/i) || item.assembledEvents.some((event) => event.persistenceRef === "")) {
      issues.push({
        id: "event-envelope-pinned-replay.persistence",
        product,
        dimension: "persistence",
        message: `${product} event envelope pinned replay no longer records persistence/readback evidence.`,
      })
    }
    if (item.replayAnchors.length === 0 || item.sourceAnchors.length === 0 || item.exactDiffRisk !== "pinned-stream-needs-live-readback") {
      issues.push({
        id: "event-envelope-pinned-replay.helix-only",
        product,
        dimension: "replay",
        message: `${product} event envelope pinned replay is not anchored to upstream source evidence.`,
      })
    }
    if (
      product === "opencode" &&
      (!eventIncludesAll(item.nativeEvidenceRefs, OPENCODE_EVENT_NATIVE_EXACT_EVIDENCE_REFS) ||
        !eventIncludesAll(item.fixtureIDs, OPENCODE_EVENT_NATIVE_EXACT_FIXTURE_IDS))
    ) {
      issues.push({
        id: "event-envelope-pinned-replay.native-exact-evidence",
        product,
        dimension: "replay",
        message: "OpenCode event envelope pinned replay no longer carries native exact event fixture evidence.",
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildEventEnvelopePinnedReplayCase(
  replayCase: EventEnvelopeReplayGateCase,
): EventEnvelopePinnedReplayCase {
  const upstreamEvents = eventEnvelopePinnedReplayEvents(replayCase.product)
  const assembledEvents = upstreamEvents.map((event) => ({ ...event, payload: { ...event.payload } }))
  return {
    product: replayCase.product,
    upstreamRef: replayCase.upstreamRef,
    fixtureID: replayCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    upstreamEvents,
    assembledEvents,
    droppedFieldNegative: ["type", "timestamp", "payload"],
    persistenceReadback: uniqueStrings([
      ...replayCase.persistence,
      "pinned-event-stream-readback:exact-match",
      "product-native-persistence-readback:fixture-level-only",
    ]),
    replayAnchors: uniqueStrings([
      replayCase.evidenceRef,
      replayCase.fixtureID,
      ...replayCase.evidenceRefs,
      ...replayCase.nativeEvidenceRefs,
      ...replayCase.fixtureIDs,
    ]),
    sourceAnchors: uniqueStrings(replayCase.replay),
    nativeEvidenceRefs: uniqueStrings([
      ...replayCase.evidenceRefs,
      ...replayCase.nativeEvidenceRefs,
      ...replayCase.fixtureIDs,
    ]),
    fixtureIDs: replayCase.fixtureIDs,
    exactDiffRisk: "pinned-stream-needs-live-readback",
    knownLossiness: uniqueStrings([
      ...replayCase.knownLossiness,
      "event-envelope-pinned-replay-live-runtime-not-proven",
      "event-envelope-product-native-persistence-readback-not-proven",
    ]),
  }
}

function eventEnvelopePinnedReplayEvents(product: EventEnvelopePinnedReplayProduct): EventEnvelopePinnedReplayEvent[] {
  if (product === "opencode") {
    return [
      eventEnvelopePinnedReplayEvent(product, 1, "session.created", { sessionID: "ses_evt_1", title: "Pinned session" }, "session/projectors-next"),
      eventEnvelopePinnedReplayEvent(product, 2, "message.part.updated", { messageID: "msg_evt_1", partID: "part_evt_1", role: "assistant" }, "session/message-v2"),
    ]
  }
  if (product === "pi") {
    return [
      eventEnvelopePinnedReplayEvent(product, 1, "agent-session.started", { sessionID: "pi-ses-1", activeLeaf: "leaf-1" }, "agent-session-runtime"),
      eventEnvelopePinnedReplayEvent(product, 2, "extension.runtime-event", { extensionID: "ext-1", event: "tool.registered" }, "extension-runner"),
    ]
  }
  if (product === "nanobot") {
    return [
      eventEnvelopePinnedReplayEvent(product, 1, "progress.started", { channel: "websocket", runID: "nano-run-1" }, "progress-hook"),
      eventEnvelopePinnedReplayEvent(product, 2, "websocket.delta", { channel: "websocket", transcriptID: "nano-trace-1" }, "websocket-channel"),
    ]
  }
  return [
    eventEnvelopePinnedReplayEvent(product, 1, "codex.response.created", { responseID: "hermes-response-1", transport: "codex" }, "codex-event-projector"),
    eventEnvelopePinnedReplayEvent(product, 2, "runtime.tool-call", { callID: "hermes-call-1", tool: "shell" }, "transport-runtime"),
  ]
}

function eventEnvelopePinnedReplayEvent(
  product: EventEnvelopePinnedReplayProduct,
  sequence: number,
  type: string,
  payload: Record<string, unknown>,
  source: string,
): EventEnvelopePinnedReplayEvent {
  return {
    eventID: `${product}-event-${sequence}`,
    type,
    timestamp: `2026-06-12T00:00:0${sequence}.000Z`,
    sessionID: `${product}-session-1`,
    traceID: `${product}-trace-1`,
    source,
    payload,
    persistenceRef: `${product}:pinned-readback:${sequence}`,
    sequence,
  }
}

function eventPinnedReplayStreamsMatch(
  upstreamEvents: EventEnvelopePinnedReplayEvent[],
  assembledEvents: EventEnvelopePinnedReplayEvent[],
): boolean {
  return upstreamEvents.every((event, index) => eventPinnedReplayEventSignature(event) === eventPinnedReplayEventSignature(assembledEvents[index]))
}

function eventPinnedReplayOrderMatches(
  upstreamEvents: EventEnvelopePinnedReplayEvent[],
  assembledEvents: EventEnvelopePinnedReplayEvent[],
): boolean {
  return upstreamEvents.map((event) => `${event.sequence}:${event.type}`).join("|") === assembledEvents.map((event) => `${event.sequence}:${event.type}`).join("|")
}

function eventPinnedReplayEventSignature(event: EventEnvelopePinnedReplayEvent | undefined): string {
  if (event === undefined) return "<missing>"
  return stableStringify({
    type: event.type,
    timestamp: event.timestamp,
    sessionID: event.sessionID,
    traceID: event.traceID,
    source: event.source,
    payload: event.payload,
    persistenceRef: event.persistenceRef,
  })
}

export type OpenCodeProductShellSourceRefID =
  | "cli-bootstrap"
  | "tui-app"
  | "web-app"
  | "server-listener"
  | "api-spec"
  | "local-sdk"
  | "local-server"
  | "local-slack"
  | "local-harness"
  | "local-workspace"
  | "local-control-plane"
  | "local-web"
  | "local-desktop"
  | "local-plugin-adapter"
  | "local-plugin-atoms"
  | "local-process-runner-port-fixture"
  | "local-product-shell-runtime-projection"
  | "local-product-shell-live-runtime-fixture"

export interface OpenCodeProductShellSourceRef {
  id: OpenCodeProductShellSourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11" | "local-source:2026-06-12"
}

export type OpenCodeProductShellSourceMatrixBranchID =
  | "harness-surface-assembly"
  | "sdk-run-turn-surface"
  | "server-api-routes"
  | "slack-command-surface"
  | "shell-env-helper"
  | "workspace-snapshot-surface"
  | "control-plane-snapshot-surface"
  | "desktop-shell-bundle-surface"
  | "native-cli-pty-transcript"
  | "native-web-state-replay"
  | "native-server-route-runtime"
  | "session-readback-side-effects"
  | "shell-env-side-effects"

export type OpenCodeProductShellSourceMatrixBranchStatus = "partial" | "missing"

export interface OpenCodeProductShellSourceMatrixBranchAnchor {
  branchID: OpenCodeProductShellSourceMatrixBranchID
  status: OpenCodeProductShellSourceMatrixBranchStatus
  sourceRefIDs: OpenCodeProductShellSourceRefID[]
  productShellAtomIDs: string[]
  productShellPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface OpenCodeProductShellSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-product-shell-source-matrix"
  fixtureID: "opencode-product-shell:source-matrix"
  sourceRefs: OpenCodeProductShellSourceRef[]
  branchAnchors: OpenCodeProductShellSourceMatrixBranchAnchor[]
  partialBranchIDs: OpenCodeProductShellSourceMatrixBranchID[]
  missingBranchIDs: OpenCodeProductShellSourceMatrixBranchID[]
  coveredProductShellAtomIDs: string[]
  coveredProductShellPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeProductShellRuntimeProjectionEvent =
  | {
    type: "cli.pty"
    command: string
    chunk: string
    exitCode?: number
  }
  | {
    type: "web.state"
    route: string
    stateKeys: string[]
  }
  | {
    type: "server.route"
    method: string
    path: string
    status: number
  }
  | {
    type: "session.readback"
    sessionID: string
    fields: string[]
  }
  | {
    type: "shell.env"
    cwd?: string
    envKeys: string[]
    command?: string
  }

export interface OpenCodeProductShellRuntimeProjection {
  schemaVersion: 1
  fixtureID: "opencode-product-shell:runtime-projection"
  evidenceRef: "conformance:opencode-product-shell-runtime-projection"
  coveredBranchIDs: Array<Extract<OpenCodeProductShellSourceMatrixBranchID, "native-cli-pty-transcript" | "native-web-state-replay" | "native-server-route-runtime" | "session-readback-side-effects" | "shell-env-side-effects">>
  retainedFields: string[]
  lossyFields: string[]
  cliTranscript: Array<{ command: string; chunkClass: string; exitCode: number | null }>
  webState: Array<{ route: string; stateKeys: string[] }>
  serverRoutes: Array<{ method: string; path: string; status: number }>
  sessionReadback: Array<{ sessionID: string; fields: string[] }>
  shellEnv: Array<{ cwdObserved: boolean; envKeys: string[]; commandObserved: boolean }>
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeProductShellLiveRuntimeFixtureInput {
  command?: string
  cliChunk?: string
  exitCode?: number
  route?: string
  stateKeys?: string[]
  method?: string
  path?: string
  status?: number
  sessionID?: string
  sessionFields?: string[]
  cwd?: string
  envKeys?: string[]
  shellCommand?: string
}

export interface OpenCodeProductShellPTYLiveReadback {
  command: string
  chunkClass: "empty" | "text"
  transcriptHash: string
  terminalMode: "alternate-screen"
  exitCode: number | null
  sequence: number
}

export interface OpenCodeProductShellWebStateLiveReadback {
  route: string
  stateKeys: string[]
  stateHash: string
  hydrationMarker: "client-hydrated"
  sequence: number
}

export interface OpenCodeProductShellServerRouteLiveReadback {
  method: string
  path: string
  status: number
  routeHash: string
  listenerMarker: "local-route-table"
  sequence: number
}

export interface OpenCodeProductShellSessionLiveReadback {
  sessionID: string
  fields: string[]
  readbackHash: string
  storageMarker: "sqlite-readback"
  sequence: number
}

export interface OpenCodeProductShellEnvLiveReadback {
  cwdObserved: boolean
  envKeys: string[]
  commandObserved: boolean
  envHash: string
  subprocessMarker: "shell-env-projected"
  sequence: number
}

export interface OpenCodeProductShellLiveRuntimeFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-product-shell-live-runtime-fixture"
  fixtureID: "opencode-product-shell:live-runtime-fixture"
  exactDiffStatus: "live-runtime-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  fixtureDiffTarget: "product-shell.cli-api-pty-transcript"
  relatedFixtureDiffTargets: Array<"ui.tui-interaction-replay" | "session.storage-round-trip">
  coveredBranchIDs: OpenCodeProductShellSourceMatrixBranchID[]
  ptyReadback: OpenCodeProductShellPTYLiveReadback[]
  webStateReadback: OpenCodeProductShellWebStateLiveReadback[]
  serverRouteReadback: OpenCodeProductShellServerRouteLiveReadback[]
  sessionReadback: OpenCodeProductShellSessionLiveReadback[]
  shellEnvReadback: OpenCodeProductShellEnvLiveReadback[]
  productShellRuntimeProjection: OpenCodeProductShellRuntimeProjection
  retainedFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeProductShellLiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeProductShellLiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeProductShellLiveRuntimeFixtureIssue[]
}

const OPENCODE_PRODUCT_SHELL_SOURCE_REFS: OpenCodeProductShellSourceRef[] = [
  {
    id: "cli-bootstrap",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/cli/bootstrap.ts",
    symbols: ["bootstrap"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tui-app",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/cli/cmd/tui/app.tsx",
    symbols: ["rendererConfig", "errorMessage", "tui", "App"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "web-app",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/app/src/app.tsx",
    symbols: [
      "UiI18nBridge",
      "QueryProvider",
      "AppShellProviders",
      "SessionProviders",
      "RouterRoot",
      "AppBaseProviders",
      "ConnectionGate",
      "ConnectionError",
      "ServerKey",
      "AppInterface",
    ],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "server-listener",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/server/server.ts",
    symbols: ["Listener", "Default", "openapi", "listen"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "api-spec",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/specs/v2/api.ts",
    symbols: ["opencode", "sessionID"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "local-sdk",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-sdk.ts",
    symbols: ["createOpenCodeSDK", "runTurn", "listSessions", "getSession"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-server",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-server.ts",
    symbols: ["createOpenCodeServer", "openCodeServerRoutes", "routeOpenCodeRequest"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-slack",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-slack.ts",
    symbols: ["createOpenCodeSlack", "createOpenCodeSlackFromSDK", "handleCommand"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-harness",
    repo: "helix/local",
    ref: "current",
    path: "packages/recipes/src/harness-atoms.ts",
    symbols: ["createHarnessAssemblyAtom", "createOpenCodeHarnessAssemblyAtom", "assembleOpenCodeHarness"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-workspace",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-workspace.ts",
    symbols: ["createOpenCodeWorkspaceSurface", "snapshot"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-control-plane",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-control-plane.ts",
    symbols: ["createOpenCodeControlPlane", "snapshot", "openCodeServerRoutes"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-web",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-web.ts",
    symbols: ["createOpenCodeWeb", "createOpenCodeWebFromSDK", "render"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-desktop",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-desktop.ts",
    symbols: ["createOpenCodeDesktop", "createOpenCodeDesktopFromSDK", "renderOpenCodeDesktopShellHTML", "writeBundle"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-plugin-adapter",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/plugin-adapter.ts",
    symbols: ["OpenCodeHooks", "OpenCodeShellDollar", "loadOpenCodePlugin", "registerOpenCodeHooks"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-plugin-atoms",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/plugin-atoms.ts",
    symbols: ["createOpenCodePluginEventMapper", "createOpenCodeExperimentalWorkspaceBridge", "createOpenCodeShellDollar", "createOpenCodeSpecialAtomProfile"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-process-runner-port-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-tools/src/port-fixtures.ts",
    symbols: ["toolPortContractFixtures", "process-runner.port", "opencode.shell.env-bridge"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-product-shell-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["projectOpenCodeProductShellRuntimeProjection", "OpenCodeProductShellRuntimeProjection"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-product-shell-live-runtime-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["captureOpenCodeProductShellLiveRuntimeFixture", "verifyOpenCodeProductShellLiveRuntimeFixture", "OpenCodeProductShellLiveRuntimeFixture"],
    evidence: "local-source:2026-06-12",
  },
]

export function projectOpenCodeProductShellRuntimeProjection(
  events: OpenCodeProductShellRuntimeProjectionEvent[],
): OpenCodeProductShellRuntimeProjection {
  const cliTranscript = events
    .filter((event): event is Extract<OpenCodeProductShellRuntimeProjectionEvent, { type: "cli.pty" }> => event.type === "cli.pty")
    .map((event) => ({
      command: event.command,
      chunkClass: event.chunk.length > 0 ? "text" : "empty",
      exitCode: typeof event.exitCode === "number" ? event.exitCode : null,
    }))

  const webState = events
    .filter((event): event is Extract<OpenCodeProductShellRuntimeProjectionEvent, { type: "web.state" }> => event.type === "web.state")
    .map((event) => ({
      route: event.route,
      stateKeys: uniqueStrings(event.stateKeys),
    }))
    .sort((left, right) => left.route.localeCompare(right.route))

  const serverRoutes = events
    .filter((event): event is Extract<OpenCodeProductShellRuntimeProjectionEvent, { type: "server.route" }> => event.type === "server.route")
    .map((event) => ({
      method: event.method.toUpperCase(),
      path: event.path,
      status: event.status,
    }))
    .sort((left, right) => left.path.localeCompare(right.path) || left.method.localeCompare(right.method) || left.status - right.status)

  const sessionReadback = events
    .filter((event): event is Extract<OpenCodeProductShellRuntimeProjectionEvent, { type: "session.readback" }> => event.type === "session.readback")
    .map((event) => ({
      sessionID: event.sessionID,
      fields: uniqueStrings(event.fields),
    }))
    .sort((left, right) => left.sessionID.localeCompare(right.sessionID))

  const shellEnv = events
    .filter((event): event is Extract<OpenCodeProductShellRuntimeProjectionEvent, { type: "shell.env" }> => event.type === "shell.env")
    .map((event) => ({
      cwdObserved: typeof event.cwd === "string" && event.cwd.length > 0,
      envKeys: uniqueStrings(event.envKeys),
      commandObserved: typeof event.command === "string" && event.command.length > 0,
    }))

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-product-shell:runtime-projection" as const,
    evidenceRef: "conformance:opencode-product-shell-runtime-projection" as const,
    coveredBranchIDs: [
      "native-cli-pty-transcript",
      "native-web-state-replay",
      "native-server-route-runtime",
      "session-readback-side-effects",
      "shell-env-side-effects",
    ] as OpenCodeProductShellRuntimeProjection["coveredBranchIDs"],
    retainedFields: [
      "command",
      "chunkClass",
      "exitCode",
      "route",
      "stateKeys",
      "method",
      "path",
      "status",
      "sessionID",
      "fields",
      "cwdObserved",
      "envKeys",
      "commandObserved",
    ],
    lossyFields: [
      "raw PTY byte stream",
      "terminal control sequence timing",
      "browser DOM lifecycle",
      "native server listener lifecycle",
      "sqlite/session storage write timing",
      "subprocess environment side effects",
    ],
    cliTranscript,
    webState,
    serverRoutes,
    sessionReadback,
    shellEnv,
    knownGaps: [
      "opencode-native-cli-pty-transcript-not-replayed",
      "opencode-native-web-state-replay-not-proven",
      "opencode-native-server-route-runtime-not-replayed",
      "opencode-product-shell-session-readback-not-replayed",
      "opencode-shell-env-side-effects-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeProductShellLiveRuntimeFixture(
  input: OpenCodeProductShellLiveRuntimeFixtureInput = {},
): OpenCodeProductShellLiveRuntimeFixture {
  const command = input.command ?? "opencode run"
  const cliChunk = input.cliChunk ?? "assistant response"
  const exitCode = typeof input.exitCode === "number" ? input.exitCode : 0
  const route = input.route ?? "/session/sess_shell_fixture"
  const stateKeys = uniqueStrings(input.stateKeys ?? ["connection", "messages", "session", "theme"])
  const method = (input.method ?? "POST").toUpperCase()
  const path = input.path ?? "/v1/session/sess_shell_fixture/message"
  const status = typeof input.status === "number" ? input.status : 200
  const sessionID = input.sessionID ?? "sess_shell_fixture"
  const sessionFields = uniqueStrings(input.sessionFields ?? ["id", "messages", "parts", "updatedAt"])
  const cwd = input.cwd ?? "/workspace/opencode"
  const envKeys = uniqueStrings(input.envKeys ?? ["OPENCODE_CONFIG", "OPENCODE_SESSION", "PATH"])
  const shellCommand = input.shellCommand ?? "echo ok"
  const chunkClass = cliChunk.length > 0 ? "text" : "empty"
  const ptyReadback: OpenCodeProductShellPTYLiveReadback[] = [
    {
      command,
      chunkClass,
      transcriptHash: fingerprintObject({ command, cliChunk, terminalMode: "alternate-screen" }),
      terminalMode: "alternate-screen",
      exitCode,
      sequence: 1,
    },
  ]
  const webStateReadback: OpenCodeProductShellWebStateLiveReadback[] = [
    {
      route,
      stateKeys,
      stateHash: fingerprintObject({ route, stateKeys }),
      hydrationMarker: "client-hydrated",
      sequence: 2,
    },
  ]
  const serverRouteReadback: OpenCodeProductShellServerRouteLiveReadback[] = [
    {
      method,
      path,
      status,
      routeHash: fingerprintObject({ method, path, status }),
      listenerMarker: "local-route-table",
      sequence: 3,
    },
  ]
  const sessionReadback: OpenCodeProductShellSessionLiveReadback[] = [
    {
      sessionID,
      fields: sessionFields,
      readbackHash: fingerprintObject({ sessionID, fields: sessionFields }),
      storageMarker: "sqlite-readback",
      sequence: 4,
    },
  ]
  const shellEnvReadback: OpenCodeProductShellEnvLiveReadback[] = [
    {
      cwdObserved: cwd.length > 0,
      envKeys,
      commandObserved: shellCommand.length > 0,
      envHash: fingerprintObject({ cwd, envKeys, shellCommand }),
      subprocessMarker: "shell-env-projected",
      sequence: 5,
    },
  ]
  const productShellRuntimeProjection = projectOpenCodeProductShellRuntimeProjection([
    {
      type: "cli.pty",
      command,
      chunk: cliChunk,
      exitCode,
    },
    {
      type: "web.state",
      route,
      stateKeys,
    },
    {
      type: "server.route",
      method,
      path,
      status,
    },
    {
      type: "session.readback",
      sessionID,
      fields: sessionFields,
    },
    {
      type: "shell.env",
      cwd,
      envKeys,
      command: shellCommand,
    },
  ])
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-product-shell-live-runtime-fixture" as const,
    fixtureID: "opencode-product-shell:live-runtime-fixture" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    fixtureDiffTarget: "product-shell.cli-api-pty-transcript" as const,
    relatedFixtureDiffTargets: ["ui.tui-interaction-replay" as const, "session.storage-round-trip" as const],
    coveredBranchIDs: uniqueStrings([
      "harness-surface-assembly",
      "sdk-run-turn-surface",
      "server-api-routes",
      "slack-command-surface",
      "shell-env-helper",
      "workspace-snapshot-surface",
      "control-plane-snapshot-surface",
      "desktop-shell-bundle-surface",
      ...productShellRuntimeProjection.coveredBranchIDs,
    ]) as OpenCodeProductShellSourceMatrixBranchID[],
    ptyReadback,
    webStateReadback,
    serverRouteReadback,
    sessionReadback,
    shellEnvReadback,
    productShellRuntimeProjection,
    retainedFields: [
      "CLI command and PTY transcript hash readback",
      "CLI exit code readback",
      "web route and hydrated state key readback",
      "server route method/path/status readback",
      "session field readback",
      "shell cwd/env/command readback",
    ],
    lossyFields: [
      "raw PTY byte stream",
      "terminal control sequence timing",
      "browser DOM lifecycle",
      "native server listener lifecycle",
      "sqlite/session storage write timing",
      "subprocess environment side effects",
      "native desktop webview side effects",
    ],
    knownGaps: [
      "opencode-product-shell-live-runtime-fixture-partial-native-gap",
      "opencode-native-cli-pty-transcript-not-replayed",
      "opencode-native-web-state-replay-not-proven",
      "opencode-native-server-route-runtime-not-replayed",
      "opencode-product-shell-session-readback-not-replayed",
      "opencode-shell-env-side-effects-not-replayed",
      "opencode-desktop-webview-side-effects-not-replayed",
      "opencode-server-listener-lifecycle-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeProductShellLiveRuntimeFixture(
  fixture: OpenCodeProductShellLiveRuntimeFixture,
): OpenCodeProductShellLiveRuntimeFixtureVerification {
  const issues: OpenCodeProductShellLiveRuntimeFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== "opencode-product-shell:live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-product-shell-live-runtime-fixture") {
    addIssue("opencode-product-shell-live-runtime.identity", "OpenCode product shell live runtime fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== false || fixture.exactDiffStatus !== "live-runtime-partial" || fixture.coverageStatus !== "partial") {
    addIssue("opencode-product-shell-live-runtime.native-claim", "OpenCode product shell live runtime fixture must stay partial and cannot claim native parity.")
  }
  for (const branchID of ["harness-surface-assembly", "sdk-run-turn-surface", "server-api-routes", "slack-command-surface", "shell-env-helper", "workspace-snapshot-surface", "control-plane-snapshot-surface", "desktop-shell-bundle-surface", "native-cli-pty-transcript", "native-web-state-replay", "native-server-route-runtime", "session-readback-side-effects", "shell-env-side-effects"] as const) {
    if (!fixture.coveredBranchIDs.includes(branchID)) {
      addIssue("opencode-product-shell-live-runtime.missing-branch", `OpenCode product shell live runtime fixture no longer covers ${branchID}.`)
    }
  }
  if (fixture.productShellRuntimeProjection.fixtureID !== "opencode-product-shell:runtime-projection" || fixture.productShellRuntimeProjection.evidenceRef !== "conformance:opencode-product-shell-runtime-projection") {
    addIssue("opencode-product-shell-live-runtime.runtime-projection", "OpenCode product shell live runtime fixture lost the nested runtime projection identity.")
  }
  const ptyReadback = fixture.ptyReadback.some((record) =>
    record.command === "opencode run" &&
    record.chunkClass === "text" &&
    record.transcriptHash.length === 16 &&
    record.terminalMode === "alternate-screen" &&
    record.exitCode === 0,
  )
  if (!ptyReadback) {
    addIssue("opencode-product-shell-live-runtime.pty-readback", "OpenCode product shell live runtime fixture must retain CLI command, PTY transcript hash, terminal mode, and exit code readback.")
  }
  const webReadback = fixture.webStateReadback.some((record) =>
    record.route === "/session/sess_shell_fixture" &&
    record.stateKeys.includes("messages") &&
    record.stateHash.length === 16 &&
    record.hydrationMarker === "client-hydrated",
  )
  if (!webReadback) {
    addIssue("opencode-product-shell-live-runtime.web-readback", "OpenCode product shell live runtime fixture must retain web route, state key, hash, and hydration readback.")
  }
  const serverReadback = fixture.serverRouteReadback.some((record) =>
    record.method === "POST" &&
    record.path === "/v1/session/sess_shell_fixture/message" &&
    record.status === 200 &&
    record.routeHash.length === 16 &&
    record.listenerMarker === "local-route-table",
  )
  if (!serverReadback) {
    addIssue("opencode-product-shell-live-runtime.server-readback", "OpenCode product shell live runtime fixture must retain server method/path/status and listener readback.")
  }
  const sessionReadback = fixture.sessionReadback.some((record) =>
    record.sessionID === "sess_shell_fixture" &&
    record.fields.includes("messages") &&
    record.fields.includes("updatedAt") &&
    record.readbackHash.length === 16 &&
    record.storageMarker === "sqlite-readback",
  )
  if (!sessionReadback) {
    addIssue("opencode-product-shell-live-runtime.session-readback", "OpenCode product shell live runtime fixture must retain session field and storage readback.")
  }
  const shellEnvReadback = fixture.shellEnvReadback.some((record) =>
    record.cwdObserved &&
    record.envKeys.includes("OPENCODE_CONFIG") &&
    record.commandObserved &&
    record.envHash.length === 16 &&
    record.subprocessMarker === "shell-env-projected",
  )
  if (!shellEnvReadback) {
    addIssue("opencode-product-shell-live-runtime.shell-env-readback", "OpenCode product shell live runtime fixture must retain cwd/env/command readback.")
  }
  for (const requiredGap of [
    "opencode-product-shell-live-runtime-fixture-partial-native-gap",
    "opencode-native-cli-pty-transcript-not-replayed",
    "opencode-native-web-state-replay-not-proven",
    "opencode-native-server-route-runtime-not-replayed",
    "opencode-product-shell-session-readback-not-replayed",
    "opencode-shell-env-side-effects-not-replayed",
    "opencode-desktop-webview-side-effects-not-replayed",
    "opencode-server-listener-lifecycle-not-replayed",
  ]) {
    if (!fixture.knownGaps.includes(requiredGap)) {
      addIssue("opencode-product-shell-live-runtime.native-gaps", `OpenCode product shell live runtime fixture no longer records ${requiredGap}.`)
    }
  }
  if (!fixture.retainedFields.includes("CLI command and PTY transcript hash readback") || !fixture.retainedFields.includes("server route method/path/status readback") || !fixture.lossyFields.some((field) => /native|raw|lifecycle|timing/i.test(field))) {
    addIssue("opencode-product-shell-live-runtime.retained-lossy-fields", "OpenCode product shell live runtime fixture must retain local readback keys and name native lossiness.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function openCodeProductShellSourceBranchAnchor(input: OpenCodeProductShellSourceMatrixBranchAnchor): OpenCodeProductShellSourceMatrixBranchAnchor {
  return input
}

export function buildOpenCodeProductShellSourceMatrixSnapshot(): OpenCodeProductShellSourceMatrixSnapshot {
  const branchAnchors: OpenCodeProductShellSourceMatrixBranchAnchor[] = [
    openCodeProductShellSourceBranchAnchor({
      branchID: "harness-surface-assembly",
      status: "partial",
      sourceRefIDs: ["cli-bootstrap", "local-harness", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.product-shell.harness"],
      productShellPortIDs: ["product.shell"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["createOpenCodeHarnessAssemblyAtom", "assembleOpenCodeHarness", "product-shell.harness"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-harness-entrypoint-native-cli-bootstrap-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "sdk-run-turn-surface",
      status: "partial",
      sourceRefIDs: ["server-listener", "api-spec", "local-sdk", "local-workspace", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.product-shell.sdk"],
      productShellPortIDs: ["product.shell"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["createOpenCodeSDK", "runTurn", "listSessions", "getSession"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-sdk-run-turn-native-session-readback-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "server-api-routes",
      status: "partial",
      sourceRefIDs: ["server-listener", "api-spec", "local-server", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.product-shell.server"],
      productShellPortIDs: ["product.shell"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["createOpenCodeServer", "openCodeServerRoutes", "routeOpenCodeRequest", "/v1/run"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-server-route-runtime-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "slack-command-surface",
      status: "partial",
      sourceRefIDs: ["server-listener", "api-spec", "local-sdk", "local-slack", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.product-shell.slack"],
      productShellPortIDs: ["product.shell"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["createOpenCodeSlackFromSDK", "handleCommand", "/opencode run", "/opencode sessions"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-slack-command-native-server-runtime-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "shell-env-helper",
      status: "partial",
      sourceRefIDs: ["cli-bootstrap", "local-plugin-adapter", "local-plugin-atoms", "local-process-runner-port-fixture", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.shell.env-bridge"],
      productShellPortIDs: ["process-runner.port"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["shell.env", "createOpenCodeShellDollar", "Bun $ helper", "process-runner.port"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-shell-env-side-effects-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "workspace-snapshot-surface",
      status: "partial",
      sourceRefIDs: ["cli-bootstrap", "local-workspace", "local-plugin-atoms", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.product-shell.workspace"],
      productShellPortIDs: ["product.shell"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["createOpenCodeWorkspaceSurface", "snapshot", "configLayers", "openCodeRegistrySnapshot"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-workspace-native-project-state-not-replayed", "opencode-workspace-filesystem-side-effects-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "control-plane-snapshot-surface",
      status: "partial",
      sourceRefIDs: ["server-listener", "api-spec", "local-control-plane", "local-workspace", "local-server", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.product-shell.control-plane"],
      productShellPortIDs: ["product.shell"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["createOpenCodeControlPlane", "registryCounts", "openCodeServerRoutes", "routes"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-control-plane-native-status-runtime-not-replayed", "opencode-control-plane-route-side-effects-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "desktop-shell-bundle-surface",
      status: "partial",
      sourceRefIDs: ["web-app", "local-web", "local-desktop", "local-sdk", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.product-shell.desktop"],
      productShellPortIDs: ["product.shell"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["createOpenCodeDesktop", "writeBundle", "renderOpenCodeDesktopShellHTML", "opencode-desktop-shell"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-desktop-native-shell-runtime-not-replayed", "opencode-desktop-webview-side-effects-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "native-cli-pty-transcript",
      status: "partial",
      sourceRefIDs: ["cli-bootstrap", "tui-app", "local-harness", "local-sdk", "local-server", "local-workspace", "local-control-plane", "local-desktop", "local-plugin-atoms", "local-product-shell-runtime-projection", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: [
        "opencode.product-shell.control-plane",
        "opencode.product-shell.desktop",
        "opencode.product-shell.harness",
        "opencode.product-shell.sdk",
        "opencode.product-shell.server",
        "opencode.product-shell.slack",
        "opencode.product-shell.workspace",
        "opencode.shell.env-bridge",
      ],
      productShellPortIDs: ["product.shell", "process-runner.port"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:runtime-projection", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["source-plus-projection", "pty-transcript:projected", "tui-runtime:not-spawned"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-native-cli-pty-transcript-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "native-web-state-replay",
      status: "partial",
      sourceRefIDs: ["web-app", "server-listener", "api-spec", "local-web", "local-desktop", "local-sdk", "local-server", "local-product-shell-runtime-projection", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.product-shell.desktop", "opencode.product-shell.sdk", "opencode.product-shell.server"],
      productShellPortIDs: ["product.shell"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:runtime-projection", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["web-state:projected", "server-state:partial", "browser-runtime:not-spawned"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-native-web-state-replay-not-proven"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "native-server-route-runtime",
      status: "partial",
      sourceRefIDs: ["server-listener", "api-spec", "local-server", "local-sdk", "local-slack", "local-control-plane", "local-product-shell-runtime-projection", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.product-shell.control-plane", "opencode.product-shell.sdk", "opencode.product-shell.server", "opencode.product-shell.slack"],
      productShellPortIDs: ["product.shell"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:runtime-projection", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["route-runtime:projected", "openapi-shape:source-plus-projection", "http-side-effects:not-replayed"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-native-server-route-runtime-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "session-readback-side-effects",
      status: "partial",
      sourceRefIDs: ["server-listener", "api-spec", "local-harness", "local-sdk", "local-server", "local-slack", "local-workspace", "local-control-plane", "local-product-shell-runtime-projection", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: [
        "opencode.product-shell.control-plane",
        "opencode.product-shell.harness",
        "opencode.product-shell.sdk",
        "opencode.product-shell.server",
        "opencode.product-shell.slack",
        "opencode.product-shell.workspace",
      ],
      productShellPortIDs: ["product.shell"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:runtime-projection", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["session-readback:projected", "workspace-state:partial", "side-effects:not-exact"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-product-shell-session-readback-not-replayed"],
    }),
    openCodeProductShellSourceBranchAnchor({
      branchID: "shell-env-side-effects",
      status: "partial",
      sourceRefIDs: ["local-plugin-adapter", "local-plugin-atoms", "local-process-runner-port-fixture", "local-product-shell-runtime-projection", "local-product-shell-live-runtime-fixture"],
      productShellAtomIDs: ["opencode.shell.env-bridge"],
      productShellPortIDs: ["process-runner.port"],
      localEvidenceRefs: ["opencode-product-shell:source-matrix", "opencode-product-shell:runtime-projection", "opencode-product-shell:live-runtime-fixture"],
      localMarkers: ["shell.env-side-effects:projected", "cwd-env:partial", "subprocess-runtime:not-exact"],
      knownGaps: ["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-shell-env-side-effects-not-replayed"],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-product-shell-source-matrix" as const,
    fixtureID: "opencode-product-shell:source-matrix" as const,
    sourceRefs: OPENCODE_PRODUCT_SHELL_SOURCE_REFS,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredProductShellAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.productShellAtomIDs)),
    coveredProductShellPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.productShellPortIDs)),
    knownGaps: uniqueStrings([
      "opencode-product-shell-source-matrix-covered-by-partial-fixture",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type ProductShellSourceMatrixProduct = "pi" | "nanobot" | "hermes"

export type ProductShellSourceMatrixRepo =
  | "earendil-works/pi"
  | "HKUDS/nanobot"
  | "NousResearch/hermes-agent"
  | "helix/local"

export type ProductShellSourceMatrixPinnedRef =
  | "7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  | "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  | "92a567db2d7a5031df8211efbfdad864c2f51faf"
  | "current"

export interface ProductShellSourceRef {
  id: string
  repo: ProductShellSourceMatrixRepo
  ref: ProductShellSourceMatrixPinnedRef
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11"
}

export type ProductShellSourceMatrixBranchID =
  | "harness-surface-assembly"
  | "sdk-run-turn-surface"
  | "cli-command-surface"
  | "server-api-routes"
  | "rpc-or-acp-route-surface"
  | "gateway-surface"
  | "web-ui-static-session-export"
  | "browser-smoke-bundle-gate"
  | "release-hardening-shrinkwrap"
  | "native-cli-pty-transcript"
  | "native-server-route-runtime"
  | "session-readback-side-effects"

export type ProductShellSourceMatrixBranchStatus = "partial" | "missing"

export interface ProductShellSourceMatrixBranchAnchor {
  branchID: ProductShellSourceMatrixBranchID
  status: ProductShellSourceMatrixBranchStatus
  sourceRefIDs: string[]
  productShellAtomIDs: string[]
  productShellPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface ProductShellSourceMatrixSnapshot {
  schemaVersion: 1
  product: ProductShellSourceMatrixProduct
  upstreamRef: string
  pinnedRepo: Exclude<ProductShellSourceMatrixRepo, "helix/local">
  pinnedRef: Exclude<ProductShellSourceMatrixPinnedRef, "current">
  evidenceRef: string
  fixtureID: string
  sourceRefs: ProductShellSourceRef[]
  branchAnchors: ProductShellSourceMatrixBranchAnchor[]
  partialBranchIDs: ProductShellSourceMatrixBranchID[]
  missingBranchIDs: ProductShellSourceMatrixBranchID[]
  coveredProductShellAtomIDs: string[]
  coveredProductShellPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

interface ProductShellSourceMatrixConfig {
  product: ProductShellSourceMatrixProduct
  upstreamRef: string
  pinnedRepo: Exclude<ProductShellSourceMatrixRepo, "helix/local">
  pinnedRef: Exclude<ProductShellSourceMatrixPinnedRef, "current">
  evidenceRef: string
  fixtureID: string
  sourceRefs: ProductShellSourceRef[]
  branchAnchors: ProductShellSourceMatrixBranchAnchor[]
}

function productShellSourceBranchAnchor(input: ProductShellSourceMatrixBranchAnchor): ProductShellSourceMatrixBranchAnchor {
  return input
}

const PRODUCT_SHELL_SOURCE_MATRIX_CONFIGS: Record<ProductShellSourceMatrixProduct, ProductShellSourceMatrixConfig> = {
  pi: {
    product: "pi",
    upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    pinnedRepo: "earendil-works/pi",
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    evidenceRef: "conformance:pi-product-shell-source-matrix",
    fixtureID: "pi-product-shell:source-matrix",
    sourceRefs: [
      {
        id: "upstream-cli",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/src/cli.ts",
        symbols: ["APP_NAME", "configureHttpDispatcher", "main"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-main",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/src/main.ts",
        symbols: ["readPipedStdin", "collectSettingsDiagnostics", "reportDiagnostics", "resolveAppMode", "prepareInitialMessage", "resolveSessionPath", "createSessionManager", "buildSessionOptions", "resolveCliPaths", "MainOptions", "main"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-rpc",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/src/modes/rpc/rpc-client.ts",
        symbols: ["RpcClientOptions", "ModelInfo", "RpcEventListener", "RpcClient"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-tui",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/tui/src/tui.ts",
        symbols: ["Component", "Focusable", "Container", "TUI", "OverlayOptions", "OverlayHandle"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-export-html",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/src/core/export-html/index.ts",
        symbols: ["exportSessionToHtml", "exportFromFile", "generateHtml", "preRenderCustomTools", "generateThemeVars"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-export-template",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/src/core/export-html/template.html",
        symbols: ["session-data", "sidebar", "content", "marked", "highlight"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-browser-smoke",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "scripts/browser-smoke-entry.ts",
        symbols: ["complete", "createAssistantMessageEventStream", "getModel", "getProviders", "Agent", "InMemorySessionRepo", "streamProxy"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-browser-smoke-check",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "scripts/check-browser-smoke.mjs",
        symbols: ["build", "entryPoints", "platform", "format", "errorLogPath"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-local-release",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "scripts/local-release.mjs",
        symbols: ["parseArgs", "prepareOutputDirectory", "packPackage", "buildBunBinaryRelease", "createPiShim"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-shrinkwrap",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "scripts/generate-coding-agent-shrinkwrap.mjs",
        symbols: ["generateShrinkwrap", "validateShrinkwrap", "allowedInstallScriptPackages", "checkOnly"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-pinned-deps",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "scripts/check-pinned-deps.mjs",
        symbols: ["exactVersionPattern", "isInternalWorkspaceDependency", "isNonRegistrySpecifier", "getVersionSpecifier"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-lockfile-commit",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "scripts/check-lockfile-commit.mjs",
        symbols: ["PI_ALLOW_LOCKFILE_CHANGE", "getLockfilePackageChanges", "summarizeLockfileChange"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "local-harness",
        repo: "helix/local",
        ref: "current",
        path: "packages/recipes/src/harness-atoms.ts",
        symbols: ["createPiMonoHarnessAssemblyAtom", "assemblePiMonoHarness", "pi.product-shell.harness"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-sdk",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/pi-sdk.ts",
        symbols: ["createPiSDK", "runTurn", "listSessions", "getSession"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-cli",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/pi-cli.ts",
        symbols: ["createPiCLI", "run", "sessions", "models"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-rpc",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/pi-rpc.ts",
        symbols: ["createPiRPC", "call"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-server",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/pi-server.ts",
        symbols: ["createPiServer", "piServerRoutes", "routePiRequest"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-web-ui",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/pi-web-ui.ts",
        symbols: ["createPiWebUI", "renderPiWebUIHTML", "write"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-browser-smoke",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/pi-browser-smoke.ts",
        symbols: ["createPiBrowserSmoke", "renderPiBrowserSmokeHTML", "write"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-release-hardening",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/pi-release-hardening.ts",
        symbols: ["createPiReleaseHardening", "snapshot", "verify", "writeShrinkwrap"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-product-surface",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/product-surface.ts",
        symbols: ["createPiProductSurfaces", "registerPiSurfaceServices"],
        evidence: "local-source:2026-06-11",
      },
    ],
    branchAnchors: [
      productShellSourceBranchAnchor({
        branchID: "harness-surface-assembly",
        status: "partial",
        sourceRefIDs: ["upstream-main", "local-harness", "local-product-surface"],
        productShellAtomIDs: ["pi.product-shell.harness"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix"],
        localMarkers: ["createPiMonoHarnessAssemblyAtom", "createPiProductSurfaces", "product-shell.harness"],
        knownGaps: ["pi-harness-entrypoint-native-cli-bootstrap-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "sdk-run-turn-surface",
        status: "partial",
        sourceRefIDs: ["upstream-main", "local-sdk", "local-product-surface"],
        productShellAtomIDs: ["pi.product-shell.sdk"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix"],
        localMarkers: ["createPiSDK", "runTurn", "listSessions", "getSession"],
        knownGaps: ["pi-sdk-run-turn-native-session-readback-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "cli-command-surface",
        status: "partial",
        sourceRefIDs: ["upstream-cli", "upstream-main", "local-cli"],
        productShellAtomIDs: ["pi.product-shell.cli"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix"],
        localMarkers: ["createPiCLI", "run", "sessions", "models"],
        knownGaps: ["pi-cli-command-native-pty-transcript-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "rpc-or-acp-route-surface",
        status: "partial",
        sourceRefIDs: ["upstream-rpc", "local-rpc", "local-server"],
        productShellAtomIDs: ["pi.product-shell.rpc"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix"],
        localMarkers: ["createPiRPC", "call", "/v1/rpc"],
        knownGaps: ["pi-rpc-native-route-runtime-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "server-api-routes",
        status: "partial",
        sourceRefIDs: ["upstream-cli", "upstream-rpc", "local-server", "local-product-surface"],
        productShellAtomIDs: ["pi.product-shell.server"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix"],
        localMarkers: ["createPiServer", "piServerRoutes", "routePiRequest", "/v1/run"],
        knownGaps: ["pi-server-route-runtime-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "web-ui-static-session-export",
        status: "partial",
        sourceRefIDs: ["upstream-main", "upstream-export-html", "upstream-export-template", "local-web-ui", "local-server", "local-product-surface"],
        productShellAtomIDs: ["pi.product-shell.web-ui"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix", "pi-product-shell:native-exact-fixture"],
        localMarkers: ["createPiWebUI", "renderPiWebUIHTML", "session-data", "data-pi-web-ui"],
        knownGaps: [],
      }),
      productShellSourceBranchAnchor({
        branchID: "browser-smoke-bundle-gate",
        status: "partial",
        sourceRefIDs: ["upstream-browser-smoke", "upstream-browser-smoke-check", "local-browser-smoke", "local-product-surface"],
        productShellAtomIDs: ["pi.product-shell.browser-smoke"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix", "pi-product-shell:native-exact-fixture"],
        localMarkers: ["createPiBrowserSmoke", "renderPiBrowserSmokeHTML", "scripts/browser-smoke-entry.ts", "data-pi-browser-smoke"],
        knownGaps: [],
      }),
      productShellSourceBranchAnchor({
        branchID: "release-hardening-shrinkwrap",
        status: "partial",
        sourceRefIDs: ["upstream-local-release", "upstream-shrinkwrap", "upstream-pinned-deps", "upstream-lockfile-commit", "local-release-hardening", "local-product-surface"],
        productShellAtomIDs: ["pi.product-shell.release-hardening"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix", "pi-product-shell:native-exact-fixture"],
        localMarkers: ["createPiReleaseHardening", "release.verify", "pi-shrinkwrap.json", "npm run release:local"],
        knownGaps: [],
      }),
      productShellSourceBranchAnchor({
        branchID: "native-cli-pty-transcript",
        status: "missing",
        sourceRefIDs: ["upstream-cli", "upstream-main", "upstream-tui", "local-cli", "local-server"],
        productShellAtomIDs: ["pi.product-shell.cli", "pi.product-shell.harness", "pi.product-shell.rpc", "pi.product-shell.sdk", "pi.product-shell.server"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix"],
        localMarkers: ["pty-transcript:not-replayed", "native-cli-process:not-spawned"],
        knownGaps: ["pi-native-cli-pty-transcript-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "native-server-route-runtime",
        status: "missing",
        sourceRefIDs: ["upstream-rpc", "local-rpc", "local-server"],
        productShellAtomIDs: ["pi.product-shell.rpc", "pi.product-shell.server"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix"],
        localMarkers: ["route-runtime:not-spawned", "http-side-effects:not-replayed"],
        knownGaps: ["pi-native-server-route-runtime-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "session-readback-side-effects",
        status: "missing",
        sourceRefIDs: ["upstream-main", "local-sdk", "local-cli", "local-rpc", "local-server"],
        productShellAtomIDs: ["pi.product-shell.cli", "pi.product-shell.harness", "pi.product-shell.rpc", "pi.product-shell.sdk", "pi.product-shell.server"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["pi-product-shell:source-matrix"],
        localMarkers: ["session-readback:not-replayed", "jsonl-side-effects:not-exact"],
        knownGaps: ["pi-product-shell-session-readback-not-replayed"],
      }),
    ],
  },
  nanobot: {
    product: "nanobot",
    upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    pinnedRepo: "HKUDS/nanobot",
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    evidenceRef: "conformance:nanobot-product-shell-source-matrix",
    fixtureID: "nanobot-product-shell:source-matrix",
    sourceRefs: [
      {
        id: "upstream-cli",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/cli/commands.py",
        symbols: ["main", "onboard", "serve", "gateway", "_run_gateway", "agent", "channels_status", "channels_login", "plugins_list", "status", "provider_login", "provider_logout"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-api",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/api/server.py",
        symbols: ["_error_json", "_chat_completion_response", "_sse_chunk", "_parse_json_content", "create_app"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-websocket",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/channels/websocket.py",
        symbols: ["WebSocketConfig", "WebSocketChannel", "publish_runtime_model_update", "_handle_bootstrap", "_handle_sessions_list", "_handle_settings", "_handle_commands", "_handle_session_messages", "_serve_static", "_authorize_websocket_handshake"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "local-harness",
        repo: "helix/local",
        ref: "current",
        path: "packages/recipes/src/harness-atoms.ts",
        symbols: ["createNanobotHarnessAssemblyAtom", "assembleNanobotHarness", "nanobot.product-shell.harness"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-sdk",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-nanobot/src/nanobot-sdk.ts",
        symbols: ["createNanobotSDK", "runTurn", "listSessions", "getSession"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-cli",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-nanobot/src/nanobot-cli.ts",
        symbols: ["createNanobotCLI", "run", "status", "channels"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-server",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-nanobot/src/nanobot-server.ts",
        symbols: ["createNanobotServer", "createNanobotHTTPServer"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-product-surface",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-nanobot/src/product-surface.ts",
        symbols: ["createNanobotProductSurfaces", "registerNanobotSurfaceServices"],
        evidence: "local-source:2026-06-11",
      },
    ],
    branchAnchors: [
      productShellSourceBranchAnchor({
        branchID: "harness-surface-assembly",
        status: "partial",
        sourceRefIDs: ["upstream-cli", "local-harness", "local-product-surface"],
        productShellAtomIDs: ["nanobot.product-shell.harness"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["nanobot-product-shell:source-matrix"],
        localMarkers: ["createNanobotHarnessAssemblyAtom", "createNanobotProductSurfaces", "product-shell.harness"],
        knownGaps: ["nanobot-harness-entrypoint-native-cli-bootstrap-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "sdk-run-turn-surface",
        status: "partial",
        sourceRefIDs: ["upstream-api", "upstream-websocket", "local-sdk", "local-product-surface"],
        productShellAtomIDs: ["nanobot.product-shell.sdk"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["nanobot-product-shell:source-matrix"],
        localMarkers: ["createNanobotSDK", "runTurn", "listSessions", "getSession"],
        knownGaps: ["nanobot-sdk-run-turn-native-session-readback-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "cli-command-surface",
        status: "partial",
        sourceRefIDs: ["upstream-cli", "local-cli"],
        productShellAtomIDs: ["nanobot.product-shell.cli"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["nanobot-product-shell:source-matrix"],
        localMarkers: ["createNanobotCLI", "run", "status", "channels"],
        knownGaps: ["nanobot-cli-command-native-pty-transcript-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "server-api-routes",
        status: "partial",
        sourceRefIDs: ["upstream-api", "upstream-websocket", "local-server", "local-product-surface"],
        productShellAtomIDs: ["nanobot.product-shell.server"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["nanobot-product-shell:source-matrix"],
        localMarkers: ["createNanobotServer", "createNanobotHTTPServer", "/v1/chat", "/v1/events"],
        knownGaps: ["nanobot-server-route-runtime-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "native-cli-pty-transcript",
        status: "missing",
        sourceRefIDs: ["upstream-cli", "upstream-api", "upstream-websocket", "local-cli", "local-server"],
        productShellAtomIDs: ["nanobot.product-shell.cli", "nanobot.product-shell.harness", "nanobot.product-shell.sdk", "nanobot.product-shell.server"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["nanobot-product-shell:source-matrix"],
        localMarkers: ["pty-transcript:not-replayed", "native-cli-process:not-spawned"],
        knownGaps: ["nanobot-native-cli-pty-transcript-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "native-server-route-runtime",
        status: "missing",
        sourceRefIDs: ["upstream-api", "upstream-websocket", "local-server"],
        productShellAtomIDs: ["nanobot.product-shell.server", "nanobot.product-shell.sdk"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["nanobot-product-shell:source-matrix"],
        localMarkers: ["route-runtime:not-spawned", "websocket-side-effects:not-replayed"],
        knownGaps: ["nanobot-native-server-route-runtime-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "session-readback-side-effects",
        status: "missing",
        sourceRefIDs: ["upstream-api", "upstream-websocket", "local-sdk", "local-cli", "local-server"],
        productShellAtomIDs: ["nanobot.product-shell.cli", "nanobot.product-shell.harness", "nanobot.product-shell.sdk", "nanobot.product-shell.server"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["nanobot-product-shell:source-matrix"],
        localMarkers: ["session-readback:not-replayed", "memory-session-side-effects:not-exact"],
        knownGaps: ["nanobot-product-shell-session-readback-not-replayed"],
      }),
    ],
  },
  hermes: {
    product: "hermes",
    upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
    pinnedRepo: "NousResearch/hermes-agent",
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    evidenceRef: "conformance:hermes-product-shell-source-matrix",
    fixtureID: "hermes-product-shell:source-matrix",
    sourceRefs: [
      {
        id: "upstream-cli",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "cli.py",
        symbols: ["HermesCLI", "ChatConsole", "load_cli_config", "main", "run", "chat", "new_session", "process_command", "_handle_resume_command", "_handle_sessions_command", "_handle_model_switch", "_handle_tools_command"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-acp",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "acp_adapter/server.py",
        symbols: ["HermesACPAgent", "_resource_display_name", "_content_blocks_to_openai_user_content", "_extract_text", "_available_commands", "_handle_slash_command", "_cmd_help", "_cmd_model", "_cmd_tools", "_cmd_context", "_cmd_reset", "_cmd_compact", "_cmd_steer", "_cmd_queue", "_cmd_version"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-api",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "gateway/platforms/api_server.py",
        symbols: ["check_api_server_requirements", "ResponseStore", "APIServerAdapter", "_openai_error", "_derive_chat_session_id", "_create_agent", "_session_response", "_message_response", "_conversation_history_for_session", "_turn_transcript_messages"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "local-harness",
        repo: "helix/local",
        ref: "current",
        path: "packages/recipes/src/harness-atoms.ts",
        symbols: ["createHermesAgentHarnessAssemblyAtom", "assembleHermesAgentHarness", "hermes.product-shell.harness"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-sdk",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-hermes/src/hermes-sdk.ts",
        symbols: ["createHermesSDK", "runTurn", "listSessions", "getSession"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-cli",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-hermes/src/hermes-cli.ts",
        symbols: ["createHermesCLI", "run", "chat", "sessions"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-acp",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-hermes/src/hermes-acp.ts",
        symbols: ["createHermesACP", "handleRequest"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-gateway",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-hermes/src/hermes-gateway.ts",
        symbols: ["createHermesGateway", "chatCompletions"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-api-server",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-hermes/src/hermes-api-server.ts",
        symbols: ["createHermesAPIServer", "createHermesHTTPServer"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "local-product-surface",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-hermes/src/surfaces/assembly.ts",
        symbols: ["createHermesProductSurfaces"],
        evidence: "local-source:2026-06-11",
      },
    ],
    branchAnchors: [
      productShellSourceBranchAnchor({
        branchID: "harness-surface-assembly",
        status: "partial",
        sourceRefIDs: ["upstream-cli", "local-harness", "local-product-surface"],
        productShellAtomIDs: ["hermes.product-shell.harness"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["hermes-product-shell:source-matrix"],
        localMarkers: ["createHermesAgentHarnessAssemblyAtom", "createHermesProductSurfaces", "product-shell.harness"],
        knownGaps: ["hermes-harness-entrypoint-native-cli-bootstrap-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "sdk-run-turn-surface",
        status: "partial",
        sourceRefIDs: ["upstream-api", "upstream-acp", "local-sdk", "local-product-surface"],
        productShellAtomIDs: ["hermes.product-shell.sdk"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["hermes-product-shell:source-matrix"],
        localMarkers: ["createHermesSDK", "runTurn", "listSessions", "getSession"],
        knownGaps: ["hermes-sdk-run-turn-native-session-readback-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "cli-command-surface",
        status: "partial",
        sourceRefIDs: ["upstream-cli", "local-cli"],
        productShellAtomIDs: ["hermes.product-shell.cli"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["hermes-product-shell:source-matrix"],
        localMarkers: ["createHermesCLI", "run", "chat", "sessions"],
        knownGaps: ["hermes-cli-command-native-pty-transcript-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "rpc-or-acp-route-surface",
        status: "partial",
        sourceRefIDs: ["upstream-acp", "local-acp", "local-api-server"],
        productShellAtomIDs: ["hermes.product-shell.acp"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["hermes-product-shell:source-matrix"],
        localMarkers: ["createHermesACP", "handleRequest", "slash-command"],
        knownGaps: ["hermes-acp-native-route-runtime-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "server-api-routes",
        status: "partial",
        sourceRefIDs: ["upstream-api", "local-api-server", "local-gateway"],
        productShellAtomIDs: ["hermes.product-shell.api-server"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["hermes-product-shell:source-matrix"],
        localMarkers: ["createHermesAPIServer", "createHermesHTTPServer", "/v1/chat/completions"],
        knownGaps: ["hermes-api-server-route-runtime-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "gateway-surface",
        status: "partial",
        sourceRefIDs: ["upstream-api", "local-gateway", "local-api-server"],
        productShellAtomIDs: ["hermes.product-shell.gateway"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["hermes-product-shell:source-matrix"],
        localMarkers: ["createHermesGateway", "chatCompletions", "ResponseStore"],
        knownGaps: ["hermes-gateway-native-response-store-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "native-cli-pty-transcript",
        status: "missing",
        sourceRefIDs: ["upstream-cli", "upstream-acp", "upstream-api", "local-cli", "local-acp", "local-api-server"],
        productShellAtomIDs: ["hermes.product-shell.acp", "hermes.product-shell.api-server", "hermes.product-shell.cli", "hermes.product-shell.gateway", "hermes.product-shell.harness", "hermes.product-shell.sdk"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["hermes-product-shell:source-matrix"],
        localMarkers: ["pty-transcript:not-replayed", "native-cli-process:not-spawned"],
        knownGaps: ["hermes-native-cli-pty-transcript-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "native-server-route-runtime",
        status: "missing",
        sourceRefIDs: ["upstream-acp", "upstream-api", "local-acp", "local-gateway", "local-api-server"],
        productShellAtomIDs: ["hermes.product-shell.acp", "hermes.product-shell.api-server", "hermes.product-shell.gateway"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["hermes-product-shell:source-matrix"],
        localMarkers: ["route-runtime:not-spawned", "gateway-side-effects:not-replayed"],
        knownGaps: ["hermes-native-server-route-runtime-not-replayed"],
      }),
      productShellSourceBranchAnchor({
        branchID: "session-readback-side-effects",
        status: "missing",
        sourceRefIDs: ["upstream-cli", "upstream-acp", "upstream-api", "local-sdk", "local-cli", "local-acp", "local-gateway", "local-api-server"],
        productShellAtomIDs: ["hermes.product-shell.acp", "hermes.product-shell.api-server", "hermes.product-shell.cli", "hermes.product-shell.gateway", "hermes.product-shell.harness", "hermes.product-shell.sdk"],
        productShellPortIDs: ["product.shell"],
        localEvidenceRefs: ["hermes-product-shell:source-matrix"],
        localMarkers: ["session-readback:not-replayed", "trajectory-side-effects:not-exact"],
        knownGaps: ["hermes-product-shell-session-readback-not-replayed"],
      }),
    ],
  },
}

function buildProductShellSourceMatrixSnapshotFromConfig(config: ProductShellSourceMatrixConfig): ProductShellSourceMatrixSnapshot {
  const branchAnchors = config.branchAnchors
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: config.product,
    upstreamRef: config.upstreamRef,
    pinnedRepo: config.pinnedRepo,
    pinnedRef: config.pinnedRef,
    evidenceRef: config.evidenceRef,
    fixtureID: config.fixtureID,
    sourceRefs: config.sourceRefs,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredProductShellAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.productShellAtomIDs)),
    coveredProductShellPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.productShellPortIDs)),
    knownGaps: uniqueStrings([
      `${config.product}-product-shell-source-matrix-covered-by-partial-fixture`,
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildProductShellSourceMatrixSnapshot(product: ProductShellSourceMatrixProduct): ProductShellSourceMatrixSnapshot {
  return buildProductShellSourceMatrixSnapshotFromConfig(PRODUCT_SHELL_SOURCE_MATRIX_CONFIGS[product])
}

export function buildPiProductShellSourceMatrixSnapshot(): ProductShellSourceMatrixSnapshot {
  return buildProductShellSourceMatrixSnapshot("pi")
}

export function buildNanobotProductShellSourceMatrixSnapshot(): ProductShellSourceMatrixSnapshot {
  return buildProductShellSourceMatrixSnapshot("nanobot")
}

export function buildHermesProductShellSourceMatrixSnapshot(): ProductShellSourceMatrixSnapshot {
  return buildProductShellSourceMatrixSnapshot("hermes")
}

export type OpenCodeUISourceRefID =
  | "tui-app-shell"
  | "tui-keymap"
  | "tui-command-palette"
  | "tui-theme-context"
  | "tui-dialog-theme-list"
  | "tui-session-route"
  | "tui-sync-context"
  | "web-app-shell"
  | "local-ui-atoms"
  | "local-tui-event-loop"
  | "local-transport-ui"
  | "local-ui-port-fixture"
  | "local-ui-runtime-projection"
  | "local-ui-live-runtime-fixture"

export interface OpenCodeUISourceRef {
  id: OpenCodeUISourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11" | "local-source:2026-06-12"
}

export type OpenCodeUISourceMatrixBranchID =
  | "command-route-surface"
  | "input-keymap-surface"
  | "renderer-message-surface"
  | "theme-registry-surface"
  | "snapshot-state-surface"
  | "native-pty-input-transcript"
  | "native-render-tree-snapshot"
  | "native-theme-palette-runtime"
  | "native-command-side-effects"
  | "native-focus-resize-timing"

export type OpenCodeUISourceMatrixBranchStatus = "partial" | "missing"

export interface OpenCodeUISourceMatrixBranchAnchor {
  branchID: OpenCodeUISourceMatrixBranchID
  status: OpenCodeUISourceMatrixBranchStatus
  sourceRefIDs: OpenCodeUISourceRefID[]
  uiAtomIDs: string[]
  uiPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface OpenCodeUISourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-ui-source-matrix"
  fixtureID: "opencode-ui:source-matrix"
  sourceRefs: OpenCodeUISourceRef[]
  branchAnchors: OpenCodeUISourceMatrixBranchAnchor[]
  partialBranchIDs: OpenCodeUISourceMatrixBranchID[]
  missingBranchIDs: OpenCodeUISourceMatrixBranchID[]
  coveredUIAtomIDs: string[]
  coveredUIPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeUIRuntimeProjectionEvent =
  | {
    type: "pty.input"
    key: string
    command?: string
    sequence: number
  }
  | {
    type: "render.tree"
    surface: "tui" | "web"
    nodeKinds: string[]
    messagePartKinds?: string[]
  }
  | {
    type: "theme.palette"
    themeID: string
    tokenKeys: string[]
    mode?: string
  }
  | {
    type: "command.effect"
    commandID: string
    effectKinds: string[]
    route?: string
  }
  | {
    type: "focus.resize"
    focusTarget?: string
    width: number
    height: number
    frame: number
  }

export interface OpenCodeUIRuntimeProjection {
  schemaVersion: 1
  fixtureID: "opencode-ui:runtime-projection"
  evidenceRef: "conformance:opencode-ui-runtime-projection"
  coveredBranchIDs: Array<
    Extract<
      OpenCodeUISourceMatrixBranchID,
      | "native-pty-input-transcript"
      | "native-render-tree-snapshot"
      | "native-theme-palette-runtime"
      | "native-command-side-effects"
      | "native-focus-resize-timing"
    >
  >
  retainedFields: string[]
  lossyFields: string[]
  ptyInputs: Array<{ key: string; command: string | null; sequence: number }>
  renderTrees: Array<{ surface: "tui" | "web"; nodeKinds: string[]; messagePartKinds: string[] }>
  themePalettes: Array<{ themeID: string; tokenKeys: string[]; mode: string | null }>
  commandEffects: Array<{ commandID: string; effectKinds: string[]; route: string | null }>
  focusResize: Array<{ focusTarget: string | null; width: number; height: number; frame: number }>
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeUILiveRuntimeFixtureInput {
  key?: string
  command?: string
  surface?: "tui" | "web"
  themeID?: string
  mode?: string
  route?: string
  focusTarget?: string
  width?: number
  height?: number
}

export interface OpenCodeUIPTYLiveReadback {
  key: string
  command: string
  rawSequenceHash: string
  normalizedKey: string
  terminalMode: string
  sequence: number
}

export interface OpenCodeUIRenderTreeLiveReadback {
  surface: "tui" | "web"
  nodeKinds: string[]
  messagePartKinds: string[]
  layoutHash: string
  renderPassID: string
  sequence: number
}

export interface OpenCodeUIThemeLiveReadback {
  themeID: string
  tokenKeys: string[]
  mode: string
  paletteHash: string
  source: string
  sequence: number
}

export interface OpenCodeUICommandEffectLiveReadback {
  commandID: string
  effectKinds: string[]
  route: string
  dialogState: "opened" | "closed"
  focusAfter: string
  sequence: number
}

export interface OpenCodeUIFocusResizeLiveReadback {
  focusTarget: string
  width: number
  height: number
  frame: number
  frameHash: string
  sequence: number
}

export interface OpenCodeUILiveRuntimeFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-ui-live-runtime-fixture"
  fixtureID: "opencode-ui:live-runtime-fixture"
  exactDiffStatus: "live-runtime-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  fixtureDiffTarget: "ui.tui-interaction-replay"
  relatedFixtureDiffTargets: Array<"product-shell.cli-api-pty-transcript">
  coveredBranchIDs: OpenCodeUISourceMatrixBranchID[]
  ptyReadback: OpenCodeUIPTYLiveReadback[]
  renderTreeReadback: OpenCodeUIRenderTreeLiveReadback[]
  themeReadback: OpenCodeUIThemeLiveReadback[]
  commandEffectReadback: OpenCodeUICommandEffectLiveReadback[]
  focusResizeReadback: OpenCodeUIFocusResizeLiveReadback[]
  uiRuntimeProjection: OpenCodeUIRuntimeProjection
  retainedFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeUILiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeUILiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeUILiveRuntimeFixtureIssue[]
}

const OPENCODE_UI_SOURCE_REFS: OpenCodeUISourceRef[] = [
  {
    id: "tui-app-shell",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/cli/cmd/tui/app.tsx",
    symbols: ["appBindingCommands", "rendererConfig", "tui", "App"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tui-keymap",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/cli/cmd/tui/keymap.tsx",
    symbols: ["COMMAND_PALETTE_COMMAND", "registerOpencodeKeymap", "useBindings", "useCommandSlashes"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tui-command-palette",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/cli/cmd/tui/component/command-palette.tsx",
    symbols: ["CommandPaletteDialog", "isVisiblePaletteCommand", "isSuggestedPaletteCommand"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tui-theme-context",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/cli/cmd/tui/context/theme.tsx",
    symbols: ["ThemeProvider", "useTheme", "selectedForeground", "generateSubtleSyntax"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tui-dialog-theme-list",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/cli/cmd/tui/component/dialog-theme-list.tsx",
    symbols: ["DialogThemeList"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tui-session-route",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/cli/cmd/tui/routes/session/index.tsx",
    symbols: ["Session", "sessionBindingCommands", "Prompt", "Sidebar"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tui-sync-context",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/cli/cmd/tui/context/sync.tsx",
    symbols: ["SyncProvider", "useSync"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "web-app-shell",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/app/src/app.tsx",
    symbols: ["AppShellProviders", "RouterRoot", "ConnectionGate", "AppInterface"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "local-ui-atoms",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-ui/src/ui-atoms.ts",
    symbols: ["createOpenCodeUIAtoms", "createUIProductAtoms", "createUIRendererAtom", "createUICommandRouterAtom", "createUIInputNormalizerAtom", "createUIThemeRegistryAtom", "createUISnapshotAtom"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-tui-event-loop",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-ui/src/tui-event-loop.ts",
    symbols: ["createUIEventLoopAtom", "createUICommandRouterAtom", "createUIInputNormalizerAtom", "createUIThemeRegistryAtom", "TUIEventLoop"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-transport-ui",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-ui/src/ui.ts",
    symbols: ["NoopUI", "TransportUI", "createTUIAdapter", "createWebUIAdapter", "createDesktopUIAdapter"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-ui-port-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-ui/src/port-fixtures.ts",
    symbols: ["uiPortContractFixtures", "ui.renderer", "ui.command-router", "ui.theme-registry", "ui.input-normalizer", "ui.snapshot"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-ui-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["projectOpenCodeUIRuntimeProjection", "OpenCodeUIRuntimeProjection"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-ui-live-runtime-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["captureOpenCodeUILiveRuntimeFixture", "verifyOpenCodeUILiveRuntimeFixture", "OpenCodeUILiveRuntimeFixture"],
    evidence: "local-source:2026-06-12",
  },
]

export function projectOpenCodeUIRuntimeProjection(events: OpenCodeUIRuntimeProjectionEvent[]): OpenCodeUIRuntimeProjection {
  const ptyInputs = events
    .filter((event): event is Extract<OpenCodeUIRuntimeProjectionEvent, { type: "pty.input" }> => event.type === "pty.input")
    .map((event) => ({
      key: event.key,
      command: typeof event.command === "string" && event.command.length > 0 ? event.command : null,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.key.localeCompare(right.key))

  const renderTrees = events
    .filter((event): event is Extract<OpenCodeUIRuntimeProjectionEvent, { type: "render.tree" }> => event.type === "render.tree")
    .map((event) => ({
      surface: event.surface,
      nodeKinds: uniqueStrings(event.nodeKinds),
      messagePartKinds: uniqueStrings(event.messagePartKinds ?? []),
    }))
    .sort((left, right) => left.surface.localeCompare(right.surface) || left.nodeKinds.join(",").localeCompare(right.nodeKinds.join(",")))

  const themePalettes = events
    .filter((event): event is Extract<OpenCodeUIRuntimeProjectionEvent, { type: "theme.palette" }> => event.type === "theme.palette")
    .map((event) => ({
      themeID: event.themeID,
      tokenKeys: uniqueStrings(event.tokenKeys),
      mode: typeof event.mode === "string" && event.mode.length > 0 ? event.mode : null,
    }))
    .sort((left, right) => left.themeID.localeCompare(right.themeID))

  const commandEffects = events
    .filter((event): event is Extract<OpenCodeUIRuntimeProjectionEvent, { type: "command.effect" }> => event.type === "command.effect")
    .map((event) => ({
      commandID: event.commandID,
      effectKinds: uniqueStrings(event.effectKinds),
      route: typeof event.route === "string" && event.route.length > 0 ? event.route : null,
    }))
    .sort((left, right) => left.commandID.localeCompare(right.commandID) || (left.route ?? "").localeCompare(right.route ?? ""))

  const focusResize = events
    .filter((event): event is Extract<OpenCodeUIRuntimeProjectionEvent, { type: "focus.resize" }> => event.type === "focus.resize")
    .map((event) => ({
      focusTarget: typeof event.focusTarget === "string" && event.focusTarget.length > 0 ? event.focusTarget : null,
      width: event.width,
      height: event.height,
      frame: event.frame,
    }))
    .sort((left, right) => left.frame - right.frame || left.width - right.width || left.height - right.height)

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-ui:runtime-projection" as const,
    evidenceRef: "conformance:opencode-ui-runtime-projection" as const,
    coveredBranchIDs: [
      "native-pty-input-transcript",
      "native-render-tree-snapshot",
      "native-theme-palette-runtime",
      "native-command-side-effects",
      "native-focus-resize-timing",
    ] as OpenCodeUIRuntimeProjection["coveredBranchIDs"],
    retainedFields: [
      "key",
      "command",
      "sequence",
      "surface",
      "nodeKinds",
      "messagePartKinds",
      "themeID",
      "tokenKeys",
      "mode",
      "commandID",
      "effectKinds",
      "route",
      "focusTarget",
      "width",
      "height",
      "frame",
    ],
    lossyFields: [
      "raw PTY byte stream",
      "terminal control sequence timing",
      "OpenTUI render tree identity/layout",
      "browser DOM lifecycle",
      "native theme palette RGB/style resolution",
      "command side-effect ordering",
      "focus/resize wall-clock timing",
    ],
    ptyInputs,
    renderTrees,
    themePalettes,
    commandEffects,
    focusResize,
    knownGaps: [
      "opencode-ui-native-pty-input-transcript-not-replayed",
      "opencode-ui-native-render-tree-snapshot-not-replayed",
      "opencode-ui-native-theme-palette-runtime-not-replayed",
      "opencode-ui-command-side-effects-not-replayed",
      "opencode-ui-native-focus-resize-timing-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeUILiveRuntimeFixture(
  input: OpenCodeUILiveRuntimeFixtureInput = {},
): OpenCodeUILiveRuntimeFixture {
  const key = input.key ?? "ctrl+p"
  const command = input.command ?? "command.palette.open"
  const surface = input.surface ?? "tui"
  const themeID = input.themeID ?? "tokyo-night"
  const mode = input.mode ?? "dark"
  const route = input.route ?? "/session/sess_ui_fixture"
  const focusTarget = input.focusTarget ?? "prompt"
  const width = input.width ?? 120
  const height = input.height ?? 40
  const nodeKinds = uniqueStrings(["screen", "sidebar", "message", "prompt", "tool"])
  const messagePartKinds = uniqueStrings(["text", "tool-call", "tool-result"])
  const tokenKeys = uniqueStrings(["accent", "background", "foreground", "muted"])
  const effectKinds = uniqueStrings(["dialog.open", "focus.change", "route.inspect"])
  const ptyReadback: OpenCodeUIPTYLiveReadback[] = [
    {
      key,
      command,
      rawSequenceHash: fingerprintObject({ key, command, terminalMode: "alternate-screen" }),
      normalizedKey: key.toLowerCase(),
      terminalMode: "alternate-screen",
      sequence: 1,
    },
  ]
  const renderTreeReadback: OpenCodeUIRenderTreeLiveReadback[] = [
    {
      surface,
      nodeKinds,
      messagePartKinds,
      layoutHash: fingerprintObject({ surface, nodeKinds, messagePartKinds, width, height }),
      renderPassID: "render_pass_ui_fixture_001",
      sequence: 2,
    },
  ]
  const themeReadback: OpenCodeUIThemeLiveReadback[] = [
    {
      themeID,
      tokenKeys,
      mode,
      paletteHash: fingerprintObject({ themeID, tokenKeys, mode }),
      source: "ThemeProvider",
      sequence: 3,
    },
  ]
  const commandEffectReadback: OpenCodeUICommandEffectLiveReadback[] = [
    {
      commandID: command,
      effectKinds,
      route,
      dialogState: "opened",
      focusAfter: "command-palette",
      sequence: 4,
    },
  ]
  const focusResizeReadback: OpenCodeUIFocusResizeLiveReadback[] = [
    {
      focusTarget,
      width,
      height,
      frame: 5,
      frameHash: fingerprintObject({ focusTarget, width, height, frame: 5 }),
      sequence: 5,
    },
  ]
  const uiRuntimeProjection = projectOpenCodeUIRuntimeProjection([
    {
      type: "pty.input",
      key,
      command,
      sequence: 1,
    },
    {
      type: "render.tree",
      surface,
      nodeKinds,
      messagePartKinds,
    },
    {
      type: "theme.palette",
      themeID,
      tokenKeys,
      mode,
    },
    {
      type: "command.effect",
      commandID: command,
      effectKinds,
      route,
    },
    {
      type: "focus.resize",
      focusTarget,
      width,
      height,
      frame: 5,
    },
  ])
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-ui-live-runtime-fixture" as const,
    fixtureID: "opencode-ui:live-runtime-fixture" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    fixtureDiffTarget: "ui.tui-interaction-replay" as const,
    relatedFixtureDiffTargets: ["product-shell.cli-api-pty-transcript" as const],
    coveredBranchIDs: uniqueStrings([
      "command-route-surface",
      "input-keymap-surface",
      "renderer-message-surface",
      "theme-registry-surface",
      "snapshot-state-surface",
      ...uiRuntimeProjection.coveredBranchIDs,
    ]) as OpenCodeUISourceMatrixBranchID[],
    ptyReadback,
    renderTreeReadback,
    themeReadback,
    commandEffectReadback,
    focusResizeReadback,
    uiRuntimeProjection,
    retainedFields: [
      "PTY key sequence and normalized key readback",
      "command route and dialog state readback",
      "render tree node and message part kind readback",
      "render layout hash marker",
      "theme token and palette hash readback",
      "focus target and resize frame readback",
    ],
    lossyFields: [
      "raw PTY byte stream",
      "terminal control sequence timing",
      "OpenTUI render tree identity/layout",
      "browser DOM lifecycle",
      "native theme palette RGB/style resolution",
      "command side-effect ordering",
      "focus/resize wall-clock timing",
    ],
    knownGaps: [
      "opencode-ui-live-runtime-fixture-partial-native-gap",
      "opencode-ui-native-pty-input-transcript-not-replayed",
      "opencode-ui-native-render-tree-snapshot-not-replayed",
      "opencode-ui-native-theme-palette-runtime-not-replayed",
      "opencode-ui-command-side-effects-not-replayed",
      "opencode-ui-native-focus-resize-timing-not-replayed",
      "opencode-ui-browser-dom-lifecycle-not-replayed",
      "opencode-ui-opentui-layout-identity-not-exact",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeUILiveRuntimeFixture(
  fixture: OpenCodeUILiveRuntimeFixture,
): OpenCodeUILiveRuntimeFixtureVerification {
  const issues: OpenCodeUILiveRuntimeFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== "opencode-ui:live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-ui-live-runtime-fixture") {
    addIssue("opencode-ui-live-runtime.identity", "OpenCode UI live runtime fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== false || fixture.exactDiffStatus !== "live-runtime-partial" || fixture.coverageStatus !== "partial") {
    addIssue("opencode-ui-live-runtime.native-claim", "OpenCode UI live runtime fixture must stay partial and cannot claim native parity.")
  }
  for (const branchID of ["command-route-surface", "input-keymap-surface", "renderer-message-surface", "theme-registry-surface", "snapshot-state-surface", "native-pty-input-transcript", "native-render-tree-snapshot", "native-theme-palette-runtime", "native-command-side-effects", "native-focus-resize-timing"] as const) {
    if (!fixture.coveredBranchIDs.includes(branchID)) {
      addIssue("opencode-ui-live-runtime.missing-branch", `OpenCode UI live runtime fixture no longer covers ${branchID}.`)
    }
  }
  if (fixture.uiRuntimeProjection.fixtureID !== "opencode-ui:runtime-projection" || fixture.uiRuntimeProjection.evidenceRef !== "conformance:opencode-ui-runtime-projection") {
    addIssue("opencode-ui-live-runtime.runtime-projection", "OpenCode UI live runtime fixture lost the nested runtime projection identity.")
  }
  const ptyReadback = fixture.ptyReadback.some((record) =>
    record.key === "ctrl+p" &&
    record.command === "command.palette.open" &&
    record.rawSequenceHash.length === 16 &&
    record.normalizedKey === "ctrl+p" &&
    record.terminalMode === "alternate-screen",
  )
  if (!ptyReadback) {
    addIssue("opencode-ui-live-runtime.pty-readback", "OpenCode UI live runtime fixture must retain PTY key, command, raw sequence hash, and terminal mode readback.")
  }
  const renderTreeReadback = fixture.renderTreeReadback.some((record) =>
    record.surface === "tui" &&
    record.nodeKinds.includes("message") &&
    record.messagePartKinds.includes("tool-call") &&
    record.layoutHash.length === 16 &&
    record.renderPassID.length > 0,
  )
  if (!renderTreeReadback) {
    addIssue("opencode-ui-live-runtime.render-tree-readback", "OpenCode UI live runtime fixture must retain render tree, message part kind, layout hash, and render pass readback.")
  }
  const themeReadback = fixture.themeReadback.some((record) =>
    record.themeID === "tokyo-night" &&
    record.tokenKeys.includes("accent") &&
    record.mode === "dark" &&
    record.paletteHash.length === 16 &&
    record.source === "ThemeProvider",
  )
  if (!themeReadback) {
    addIssue("opencode-ui-live-runtime.theme-readback", "OpenCode UI live runtime fixture must retain theme token, mode, palette hash, and source readback.")
  }
  const commandEffectReadback = fixture.commandEffectReadback.some((record) =>
    record.commandID === "command.palette.open" &&
    record.effectKinds.includes("dialog.open") &&
    record.route.length > 0 &&
    record.dialogState === "opened" &&
    record.focusAfter === "command-palette",
  )
  if (!commandEffectReadback) {
    addIssue("opencode-ui-live-runtime.command-effect-readback", "OpenCode UI live runtime fixture must retain command effect, route, dialog state, and focus readback.")
  }
  const focusResizeReadback = fixture.focusResizeReadback.some((record) =>
    record.focusTarget === "prompt" &&
    record.width > 0 &&
    record.height > 0 &&
    record.frame > 0 &&
    record.frameHash.length === 16,
  )
  if (!focusResizeReadback) {
    addIssue("opencode-ui-live-runtime.focus-resize-readback", "OpenCode UI live runtime fixture must retain focus, resize, frame, and frame hash readback.")
  }
  for (const requiredGap of [
    "opencode-ui-live-runtime-fixture-partial-native-gap",
    "opencode-ui-native-pty-input-transcript-not-replayed",
    "opencode-ui-native-render-tree-snapshot-not-replayed",
    "opencode-ui-native-theme-palette-runtime-not-replayed",
    "opencode-ui-command-side-effects-not-replayed",
    "opencode-ui-native-focus-resize-timing-not-replayed",
    "opencode-ui-browser-dom-lifecycle-not-replayed",
    "opencode-ui-opentui-layout-identity-not-exact",
  ]) {
    if (!fixture.knownGaps.includes(requiredGap)) {
      addIssue("opencode-ui-live-runtime.native-gaps", `OpenCode UI live runtime fixture no longer records ${requiredGap}.`)
    }
  }
  if (!fixture.retainedFields.includes("PTY key sequence and normalized key readback") || !fixture.retainedFields.includes("focus target and resize frame readback") || !fixture.lossyFields.some((field) => /native|raw|identity|timing/i.test(field))) {
    addIssue("opencode-ui-live-runtime.retained-lossy-fields", "OpenCode UI live runtime fixture must retain local readback keys and name native lossiness.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function openCodeUISourceBranchAnchor(input: OpenCodeUISourceMatrixBranchAnchor): OpenCodeUISourceMatrixBranchAnchor {
  return input
}

export function buildOpenCodeUISourceMatrixSnapshot(): OpenCodeUISourceMatrixSnapshot {
  const branchAnchors: OpenCodeUISourceMatrixBranchAnchor[] = [
    openCodeUISourceBranchAnchor({
      branchID: "command-route-surface",
      status: "partial",
      sourceRefIDs: ["tui-app-shell", "tui-keymap", "tui-command-palette", "local-ui-atoms", "local-tui-event-loop", "local-ui-port-fixture", "local-ui-live-runtime-fixture"],
      uiAtomIDs: ["opencode.ui.command-router"],
      uiPortIDs: ["ui.command-router"],
      localEvidenceRefs: ["opencode-ui:source-matrix", "opencode-ui:live-runtime-fixture"],
      localMarkers: ["createUICommandRouterAtom", "CommandPaletteDialog", "appBindingCommands", "useCommandSlashes", "command-effect:live-readback"],
      knownGaps: ["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-command-side-effects-not-replayed"],
    }),
    openCodeUISourceBranchAnchor({
      branchID: "input-keymap-surface",
      status: "partial",
      sourceRefIDs: ["tui-app-shell", "tui-keymap", "local-ui-atoms", "local-tui-event-loop", "local-ui-port-fixture", "local-ui-live-runtime-fixture"],
      uiAtomIDs: ["opencode.ui.input-normalizer"],
      uiPortIDs: ["ui.input-normalizer"],
      localEvidenceRefs: ["opencode-ui:source-matrix", "opencode-ui:live-runtime-fixture"],
      localMarkers: ["createUIInputNormalizerAtom", "registerOpencodeKeymap", "useBindings", "keypress", "pty-key:live-readback"],
      knownGaps: ["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-native-keypress-transcript-not-replayed"],
    }),
    openCodeUISourceBranchAnchor({
      branchID: "renderer-message-surface",
      status: "partial",
      sourceRefIDs: ["tui-app-shell", "tui-session-route", "web-app-shell", "local-ui-atoms", "local-transport-ui", "local-ui-port-fixture", "local-ui-live-runtime-fixture"],
      uiAtomIDs: ["opencode.ui.renderer"],
      uiPortIDs: ["ui.renderer"],
      localEvidenceRefs: ["opencode-ui:source-matrix", "opencode-ui:live-runtime-fixture"],
      localMarkers: ["createUIRendererAtom", "LegoRendererRegistry", "renderMessagePart", "renderToolResult", "render-tree:live-readback"],
      knownGaps: ["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-native-render-tree-snapshot-not-replayed"],
    }),
    openCodeUISourceBranchAnchor({
      branchID: "theme-registry-surface",
      status: "partial",
      sourceRefIDs: ["tui-theme-context", "tui-dialog-theme-list", "local-ui-atoms", "local-tui-event-loop", "local-ui-port-fixture", "local-ui-live-runtime-fixture"],
      uiAtomIDs: ["opencode.ui.theme-registry"],
      uiPortIDs: ["ui.theme-registry"],
      localEvidenceRefs: ["opencode-ui:source-matrix", "opencode-ui:live-runtime-fixture"],
      localMarkers: ["createUIThemeRegistryAtom", "DialogThemeList", "ThemeProvider", "initialTheme", "theme-palette:live-readback"],
      knownGaps: ["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-native-theme-palette-runtime-not-replayed"],
    }),
    openCodeUISourceBranchAnchor({
      branchID: "snapshot-state-surface",
      status: "partial",
      sourceRefIDs: ["tui-app-shell", "tui-session-route", "tui-sync-context", "local-ui-atoms", "local-tui-event-loop", "local-transport-ui", "local-ui-port-fixture", "local-ui-live-runtime-fixture"],
      uiAtomIDs: ["opencode.ui.snapshot"],
      uiPortIDs: ["ui.snapshot"],
      localEvidenceRefs: ["opencode-ui:source-matrix", "opencode-ui:live-runtime-fixture"],
      localMarkers: ["createUISnapshotAtom", "TUIEventLoop.snapshot", "SyncProvider", "TransportUI", "snapshot-state:live-readback"],
      knownGaps: ["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-native-state-readback-not-replayed"],
    }),
    openCodeUISourceBranchAnchor({
      branchID: "native-pty-input-transcript",
      status: "partial",
      sourceRefIDs: ["tui-app-shell", "tui-keymap", "local-ui-atoms", "local-tui-event-loop", "local-ui-runtime-projection", "local-ui-live-runtime-fixture"],
      uiAtomIDs: ["opencode.ui.command-router", "opencode.ui.input-normalizer"],
      uiPortIDs: ["ui.command-router", "ui.input-normalizer"],
      localEvidenceRefs: ["opencode-ui:source-matrix", "opencode-ui:runtime-projection", "opencode-ui:live-runtime-fixture"],
      localMarkers: ["pty-transcript:projected", "native-keymap:partial", "terminal-input:not-exact", "pty-transcript:live-readback"],
      knownGaps: ["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-native-pty-input-transcript-not-replayed"],
    }),
    openCodeUISourceBranchAnchor({
      branchID: "native-render-tree-snapshot",
      status: "partial",
      sourceRefIDs: ["tui-app-shell", "tui-session-route", "web-app-shell", "local-ui-atoms", "local-transport-ui", "local-ui-runtime-projection", "local-ui-live-runtime-fixture"],
      uiAtomIDs: ["opencode.ui.renderer", "opencode.ui.snapshot"],
      uiPortIDs: ["ui.renderer", "ui.snapshot"],
      localEvidenceRefs: ["opencode-ui:source-matrix", "opencode-ui:runtime-projection", "opencode-ui:live-runtime-fixture"],
      localMarkers: ["opentui-render-tree:projected", "web-dom-state:partial", "solid-signals:not-exact", "render-tree:live-readback"],
      knownGaps: ["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-native-render-tree-snapshot-not-replayed"],
    }),
    openCodeUISourceBranchAnchor({
      branchID: "native-theme-palette-runtime",
      status: "partial",
      sourceRefIDs: ["tui-theme-context", "tui-dialog-theme-list", "tui-app-shell", "local-ui-atoms", "local-tui-event-loop", "local-ui-runtime-projection", "local-ui-live-runtime-fixture"],
      uiAtomIDs: ["opencode.ui.theme-registry"],
      uiPortIDs: ["ui.theme-registry"],
      localEvidenceRefs: ["opencode-ui:source-matrix", "opencode-ui:runtime-projection", "opencode-ui:live-runtime-fixture"],
      localMarkers: ["terminal-palette:projected", "theme-mode:partial", "theme-token-diff:not-complete", "palette-hash:live-readback"],
      knownGaps: ["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-native-theme-palette-runtime-not-replayed"],
    }),
    openCodeUISourceBranchAnchor({
      branchID: "native-command-side-effects",
      status: "partial",
      sourceRefIDs: ["tui-command-palette", "tui-keymap", "tui-session-route", "local-ui-atoms", "local-tui-event-loop", "local-ui-runtime-projection", "local-ui-live-runtime-fixture"],
      uiAtomIDs: ["opencode.ui.command-router"],
      uiPortIDs: ["ui.command-router"],
      localEvidenceRefs: ["opencode-ui:source-matrix", "opencode-ui:runtime-projection", "opencode-ui:live-runtime-fixture"],
      localMarkers: ["command-side-effects:projected", "dialog-open:partial", "route-transition:not-exact", "command-effect:live-readback"],
      knownGaps: ["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-command-side-effects-not-replayed"],
    }),
    openCodeUISourceBranchAnchor({
      branchID: "native-focus-resize-timing",
      status: "partial",
      sourceRefIDs: ["tui-app-shell", "tui-session-route", "local-ui-atoms", "local-tui-event-loop", "local-transport-ui", "local-ui-runtime-projection", "local-ui-live-runtime-fixture"],
      uiAtomIDs: [
        "opencode.ui.command-router",
        "opencode.ui.input-normalizer",
        "opencode.ui.renderer",
        "opencode.ui.snapshot",
        "opencode.ui.theme-registry",
      ],
      uiPortIDs: ["ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"],
      localEvidenceRefs: ["opencode-ui:source-matrix", "opencode-ui:runtime-projection", "opencode-ui:live-runtime-fixture"],
      localMarkers: ["focus:projected", "resize-timing:partial", "frame-clock:not-exact", "focus-resize:live-readback"],
      knownGaps: ["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-native-focus-resize-timing-not-replayed"],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-ui-source-matrix" as const,
    fixtureID: "opencode-ui:source-matrix" as const,
    sourceRefs: OPENCODE_UI_SOURCE_REFS,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredUIAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.uiAtomIDs)),
    coveredUIPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.uiPortIDs)),
    knownGaps: uniqueStrings([
      "opencode-ui-source-matrix-covered-by-partial-fixture",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type ProductUISourceMatrixProduct = "pi" | "nanobot" | "hermes"
export type ProductUISourceMatrixPinnedRepo = "earendil-works/pi" | "HKUDS/nanobot" | "NousResearch/hermes-agent"
export type ProductUISourceMatrixPinnedRef =
  | "7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  | "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  | "92a567db2d7a5031df8211efbfdad864c2f51faf"
export type ProductUISourceMatrixUpstreamRef =
  | "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  | "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  | "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
export type ProductUISourceMatrixEvidenceRef =
  | "conformance:pi-ui-source-matrix"
  | "conformance:nanobot-ui-source-matrix"
  | "conformance:hermes-ui-source-matrix"
export type ProductUISourceMatrixFixtureID =
  | "pi-ui:source-matrix"
  | "nanobot-ui:source-matrix"
  | "hermes-ui:source-matrix"
export type ProductUISourceRefID =
  | "upstream-command-surface"
  | "upstream-tui-shell"
  | "upstream-renderer-surface"
  | "upstream-theme-surface"
  | "upstream-web-surface"
  | "local-ui-atoms"
  | "local-tui-event-loop"
  | "local-transport-ui"
  | "local-ui-port-fixture"
  | "local-product-tui"
  | "local-product-web"
  | "local-product-types"

export interface ProductUISourceRef {
  id: ProductUISourceRefID
  repo: ProductUISourceMatrixPinnedRepo | "helix/local"
  ref: ProductUISourceMatrixPinnedRef | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11"
}

export type ProductUISourceMatrixBranchID =
  | "command-route-surface"
  | "input-keymap-surface"
  | "renderer-message-surface"
  | "theme-registry-surface"
  | "snapshot-state-surface"
  | "native-pty-input-transcript"
  | "native-render-tree-snapshot"
  | "native-theme-palette-runtime"
  | "native-command-side-effects"
  | "native-focus-resize-timing"

export type ProductUISourceMatrixBranchStatus = "partial" | "missing"

export interface ProductUISourceMatrixBranchAnchor {
  branchID: ProductUISourceMatrixBranchID
  status: ProductUISourceMatrixBranchStatus
  sourceRefIDs: ProductUISourceRefID[]
  uiAtomIDs: string[]
  uiPortIDs: string[]
  localEvidenceRefs: ProductUISourceMatrixFixtureID[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface ProductUISourceMatrixSnapshot {
  schemaVersion: 1
  product: ProductUISourceMatrixProduct
  upstreamRef: ProductUISourceMatrixUpstreamRef
  pinnedRepo: ProductUISourceMatrixPinnedRepo
  pinnedRef: ProductUISourceMatrixPinnedRef
  evidenceRef: ProductUISourceMatrixEvidenceRef
  fixtureID: ProductUISourceMatrixFixtureID
  sourceRefs: ProductUISourceRef[]
  branchAnchors: ProductUISourceMatrixBranchAnchor[]
  partialBranchIDs: ProductUISourceMatrixBranchID[]
  missingBranchIDs: ProductUISourceMatrixBranchID[]
  coveredUIAtomIDs: string[]
  coveredUIPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

interface ProductUISourceMatrixConfig {
  product: ProductUISourceMatrixProduct
  atomPrefix: "pi" | "nanobot" | "hermes"
  upstreamRef: ProductUISourceMatrixUpstreamRef
  pinnedRepo: ProductUISourceMatrixPinnedRepo
  pinnedRef: ProductUISourceMatrixPinnedRef
  evidenceRef: ProductUISourceMatrixEvidenceRef
  fixtureID: ProductUISourceMatrixFixtureID
  sourceRefs: ProductUISourceRef[]
}

const PRODUCT_UI_SOURCE_MATRIX_CONFIGS: Record<ProductUISourceMatrixProduct, ProductUISourceMatrixConfig> = {
  pi: {
    product: "pi",
    atomPrefix: "pi",
    upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    pinnedRepo: "earendil-works/pi",
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    evidenceRef: "conformance:pi-ui-source-matrix",
    fixtureID: "pi-ui:source-matrix",
    sourceRefs: [
      {
        id: "upstream-command-surface",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/tui/src/autocomplete.ts",
        symbols: ["AutocompleteItem", "SlashCommand", "AutocompleteSuggestions", "CombinedAutocompleteProvider", "applyCompletion"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-tui-shell",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/tui/src/tui.ts",
        symbols: ["Component", "Focusable", "isFocusable", "CURSOR_MARKER", "OverlayHandle", "Container", "TUI"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-renderer-surface",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/tui/src/components/box.ts",
        symbols: ["RenderCache", "Box", "addChild", "removeChild"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-theme-surface",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/src/config.ts",
        symbols: ["getCustomThemesDir", "getThemesDir", "getBundledInteractiveAssetPath", "APP_TITLE"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-web-surface",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/src/main.ts",
        symbols: ["resolveAppMode", "prepareInitialMessage", "buildSessionOptions", "main"],
        evidence: "github-tree:2026-06-11",
      },
      ...productUILocalSourceRefs("pi"),
    ],
  },
  nanobot: {
    product: "nanobot",
    atomPrefix: "nanobot",
    upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    pinnedRepo: "HKUDS/nanobot",
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    evidenceRef: "conformance:nanobot-ui-source-matrix",
    fixtureID: "nanobot-ui:source-matrix",
    sourceRefs: [
      {
        id: "upstream-command-surface",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/channels/websocket.py",
        symbols: ["WebSocketChannel", "_handle_commands", "_handle_session_messages", "_dispatch_envelope"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-tui-shell",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/cli/stream.py",
        symbols: ["ThinkingSpinner", "StreamRenderer", "ensure_header", "on_delta", "on_end", "stop_for_input"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-renderer-surface",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "webui/src/components/thread/ThreadShell.tsx",
        symbols: ["projectWebuiThreadMessages", "ThreadShellProps", "toModelBadgeLabel", "ThreadShell"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-theme-surface",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "webui/src/App.tsx",
        symbols: ["BootState", "SIDEBAR_STORAGE_KEY", "ShellView", "AuthForm", "App", "Shell"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-web-surface",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/channels/websocket.py",
        symbols: ["_handle_bootstrap", "_handle_sessions_list", "_handle_webui_thread_get", "_serve_static"],
        evidence: "github-tree:2026-06-11",
      },
      ...productUILocalSourceRefs("nanobot"),
    ],
  },
  hermes: {
    product: "hermes",
    atomPrefix: "hermes",
    upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
    pinnedRepo: "NousResearch/hermes-agent",
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    evidenceRef: "conformance:hermes-ui-source-matrix",
    fixtureID: "hermes-ui:source-matrix",
    sourceRefs: [
      {
        id: "upstream-command-surface",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "apps/desktop/src/app/chat/composer/index.tsx",
        symbols: ["COMPOSER_STACK_BREAKPOINT_PX", "QueueEditState", "ChatBar", "ChatBarFallback"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-tui-shell",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "agent/display.py",
        symbols: ["LocalEditSnapshot", "build_tool_preview", "render_edit_diff_with_delta", "KawaiiSpinner", "get_cute_tool_message"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-renderer-surface",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "apps/desktop/src/app/chat/index.tsx",
        symbols: ["ChatViewProps", "ChatHeaderProps", "ChatHeader", "ChatView"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-theme-surface",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "apps/desktop/src/app/settings/config-settings.tsx",
        symbols: ["ConfigField", "ConfigSettings"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "upstream-web-surface",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "apps/desktop/src/app/index.tsx",
        symbols: ["DesktopController"],
        evidence: "github-tree:2026-06-11",
      },
      ...productUILocalSourceRefs("hermes"),
    ],
  },
}

function productUILocalSourceRefs(product: ProductUISourceMatrixProduct): ProductUISourceRef[] {
  const adapterPrefix = product === "pi" ? "pi" : product
  const productName = product === "pi" ? "Pi" : product === "nanobot" ? "Nanobot" : "Hermes"
  const atomFactory = product === "pi" ? "createPiMonoUIAtoms" : product === "nanobot" ? "createNanobotUIAtoms" : "createHermesAgentUIAtoms"
  const webSurfaceType = product === "hermes" ? "HermesWebDashboardSurface" : `${productName}WebUISurface`
  return [
    {
      id: "local-ui-atoms",
      repo: "helix/local",
      ref: "current",
      path: "packages/lego-ui/src/ui-atoms.ts",
      symbols: [
        atomFactory,
        "createUIProductAtoms",
        "createUIRendererAtom",
        "createUICommandRouterAtom",
        "createUIInputNormalizerAtom",
        "createUIThemeRegistryAtom",
        "createUISnapshotAtom",
      ],
      evidence: "local-source:2026-06-11",
    },
    {
      id: "local-tui-event-loop",
      repo: "helix/local",
      ref: "current",
      path: "packages/lego-ui/src/tui-event-loop.ts",
      symbols: ["createTUIEventLoop", "createUIEventLoopAtom", "TUIEventLoop", "handle", "snapshot", "render"],
      evidence: "local-source:2026-06-11",
    },
    {
      id: "local-transport-ui",
      repo: "helix/local",
      ref: "current",
      path: "packages/lego-ui/src/ui.ts",
      symbols: ["NoopUI", "TransportUI", "createTUIAdapter", "createWebUIAdapter", "createDesktopUIAdapter"],
      evidence: "local-source:2026-06-11",
    },
    {
      id: "local-ui-port-fixture",
      repo: "helix/local",
      ref: "current",
      path: "packages/lego-ui/src/port-fixtures.ts",
      symbols: ["uiPortContractFixtures", "ui.renderer", "ui.command-router", "ui.theme-registry", "ui.input-normalizer", "ui.snapshot"],
      evidence: "local-source:2026-06-11",
    },
    {
      id: "local-product-tui",
      repo: "helix/local",
      ref: "current",
      path: `packages/adapters-${adapterPrefix}/src/${adapterPrefix}-tui.ts`,
      symbols: [`create${productName}TUI`, "createTUIEventLoop", "interactiveSnapshot", "dispatch", "render"],
      evidence: "local-source:2026-06-11",
    },
    {
      id: "local-product-web",
      repo: "helix/local",
      ref: "current",
      path: product === "hermes" ? "packages/adapters-hermes/src/hermes-web-dashboard.ts" : `packages/adapters-${adapterPrefix}/src/${adapterPrefix}-web-ui.ts`,
      symbols: product === "hermes" ? ["createHermesWebDashboard", "render"] : [`create${productName}WebUI`, "render"],
      evidence: "local-source:2026-06-11",
    },
    {
      id: "local-product-types",
      repo: "helix/local",
      ref: "current",
      path: `packages/adapters-${adapterPrefix}/src/${adapterPrefix}-product-types.ts`,
      symbols: [`${productName}TUISurface`, webSurfaceType, "snapshot", "render"],
      evidence: "local-source:2026-06-11",
    },
  ]
}

function productUISourceBranchAnchor(input: ProductUISourceMatrixBranchAnchor): ProductUISourceMatrixBranchAnchor {
  return input
}

function buildProductUISourceMatrixSnapshotFromConfig(config: ProductUISourceMatrixConfig): ProductUISourceMatrixSnapshot {
  const atom = (kind: "command-router" | "input-normalizer" | "renderer" | "snapshot" | "theme-registry") => `${config.atomPrefix}.ui.${kind}`
  const fixtureID = config.fixtureID
  const gap = (suffix: string) => `${config.atomPrefix}-ui-${suffix}`
  const branchAnchors: ProductUISourceMatrixBranchAnchor[] = [
    productUISourceBranchAnchor({
      branchID: "command-route-surface",
      status: "partial",
      sourceRefIDs: ["upstream-command-surface", "upstream-tui-shell", "local-ui-atoms", "local-tui-event-loop", "local-ui-port-fixture", "local-product-tui"],
      uiAtomIDs: [atom("command-router")],
      uiPortIDs: ["ui.command-router"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["createUICommandRouterAtom", "createTUIEventLoop", "dispatch", "commands"],
      knownGaps: [gap("command-side-effects-not-replayed")],
    }),
    productUISourceBranchAnchor({
      branchID: "input-keymap-surface",
      status: "partial",
      sourceRefIDs: ["upstream-command-surface", "upstream-tui-shell", "local-ui-atoms", "local-tui-event-loop", "local-ui-port-fixture", "local-product-tui"],
      uiAtomIDs: [atom("input-normalizer")],
      uiPortIDs: ["ui.input-normalizer"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["createUIInputNormalizerAtom", "keypress", "input", "dispatch"],
      knownGaps: [gap("native-pty-input-transcript-not-replayed")],
    }),
    productUISourceBranchAnchor({
      branchID: "renderer-message-surface",
      status: "partial",
      sourceRefIDs: ["upstream-renderer-surface", "upstream-web-surface", "local-ui-atoms", "local-transport-ui", "local-ui-port-fixture", "local-product-web"],
      uiAtomIDs: [atom("renderer")],
      uiPortIDs: ["ui.renderer"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["createUIRendererAtom", "TransportUI", "render", "snapshot"],
      knownGaps: [gap("native-render-tree-snapshot-not-replayed")],
    }),
    productUISourceBranchAnchor({
      branchID: "theme-registry-surface",
      status: "partial",
      sourceRefIDs: ["upstream-theme-surface", "upstream-tui-shell", "local-ui-atoms", "local-tui-event-loop", "local-ui-port-fixture"],
      uiAtomIDs: [atom("theme-registry")],
      uiPortIDs: ["ui.theme-registry"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["createUIThemeRegistryAtom", "themes", "initialTheme"],
      knownGaps: [gap("native-theme-palette-runtime-not-replayed")],
    }),
    productUISourceBranchAnchor({
      branchID: "snapshot-state-surface",
      status: "partial",
      sourceRefIDs: ["upstream-tui-shell", "upstream-web-surface", "local-ui-atoms", "local-tui-event-loop", "local-transport-ui", "local-product-tui", "local-product-web"],
      uiAtomIDs: [atom("snapshot")],
      uiPortIDs: ["ui.snapshot"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["createUISnapshotAtom", "interactiveSnapshot", "snapshot", "TransportUI"],
      knownGaps: [gap("native-state-readback-not-replayed")],
    }),
    productUISourceBranchAnchor({
      branchID: "native-pty-input-transcript",
      status: "missing",
      sourceRefIDs: ["upstream-command-surface", "upstream-tui-shell", "local-ui-atoms", "local-tui-event-loop", "local-product-tui"],
      uiAtomIDs: [atom("command-router"), atom("input-normalizer")],
      uiPortIDs: ["ui.command-router", "ui.input-normalizer"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["pty-transcript:not-replayed", "terminal-input:not-exact", "native-keymap:not-spawned"],
      knownGaps: [gap("native-pty-input-transcript-not-replayed")],
    }),
    productUISourceBranchAnchor({
      branchID: "native-render-tree-snapshot",
      status: "missing",
      sourceRefIDs: ["upstream-renderer-surface", "upstream-web-surface", "local-ui-atoms", "local-transport-ui", "local-product-tui", "local-product-web"],
      uiAtomIDs: [atom("renderer"), atom("snapshot")],
      uiPortIDs: ["ui.renderer", "ui.snapshot"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["render-tree:not-replayed", "dom-state:not-replayed", "terminal-frame:not-exact"],
      knownGaps: [gap("native-render-tree-snapshot-not-replayed")],
    }),
    productUISourceBranchAnchor({
      branchID: "native-theme-palette-runtime",
      status: "missing",
      sourceRefIDs: ["upstream-theme-surface", "upstream-tui-shell", "local-ui-atoms", "local-tui-event-loop"],
      uiAtomIDs: [atom("theme-registry")],
      uiPortIDs: ["ui.theme-registry"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["terminal-palette:not-replayed", "theme-mode:not-exact", "theme-token-diff:not-complete"],
      knownGaps: [gap("native-theme-palette-runtime-not-replayed")],
    }),
    productUISourceBranchAnchor({
      branchID: "native-command-side-effects",
      status: "missing",
      sourceRefIDs: ["upstream-command-surface", "upstream-tui-shell", "local-ui-atoms", "local-tui-event-loop", "local-product-tui"],
      uiAtomIDs: [atom("command-router")],
      uiPortIDs: ["ui.command-router"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["command-side-effects:not-replayed", "route-transition:not-exact", "dialog-open:not-exact"],
      knownGaps: [gap("command-side-effects-not-replayed")],
    }),
    productUISourceBranchAnchor({
      branchID: "native-focus-resize-timing",
      status: "missing",
      sourceRefIDs: ["upstream-tui-shell", "upstream-renderer-surface", "local-ui-atoms", "local-tui-event-loop", "local-transport-ui", "local-product-tui"],
      uiAtomIDs: [atom("command-router"), atom("input-normalizer"), atom("renderer"), atom("snapshot"), atom("theme-registry")],
      uiPortIDs: ["ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"],
      localEvidenceRefs: [fixtureID],
      localMarkers: ["focus:not-replayed", "resize-timing:not-exact", "frame-clock:not-exact"],
      knownGaps: [gap("native-focus-resize-timing-not-replayed")],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: config.product,
    upstreamRef: config.upstreamRef,
    pinnedRepo: config.pinnedRepo,
    pinnedRef: config.pinnedRef,
    evidenceRef: config.evidenceRef,
    fixtureID: config.fixtureID,
    sourceRefs: config.sourceRefs,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredUIAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.uiAtomIDs)),
    coveredUIPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.uiPortIDs)),
    knownGaps: uniqueStrings([
      gap("source-matrix-covered-by-partial-fixture"),
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildProductUISourceMatrixSnapshot(product: ProductUISourceMatrixProduct): ProductUISourceMatrixSnapshot {
  return buildProductUISourceMatrixSnapshotFromConfig(PRODUCT_UI_SOURCE_MATRIX_CONFIGS[product])
}

export function buildPiUISourceMatrixSnapshot(): ProductUISourceMatrixSnapshot {
  return buildProductUISourceMatrixSnapshot("pi")
}

export function buildNanobotUISourceMatrixSnapshot(): ProductUISourceMatrixSnapshot {
  return buildProductUISourceMatrixSnapshot("nanobot")
}

export function buildHermesUISourceMatrixSnapshot(): ProductUISourceMatrixSnapshot {
  return buildProductUISourceMatrixSnapshot("hermes")
}

export type OpenCodeFoundationTraceSourceRefID =
  | "session-service"
  | "config-skills"
  | "session-message"
  | "session-status"
  | "local-plugin-atoms"
  | "local-tool-atoms"
  | "local-default-tools"
  | "local-tool-port-fixtures"
  | "local-contract-port-fixtures"
  | "local-foundation-trace-runtime-projection"

export interface OpenCodeFoundationTraceSourceRef {
  id: OpenCodeFoundationTraceSourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11" | "local-source:2026-06-12"
}

export type OpenCodeFoundationTraceSourceMatrixBranchID =
  | "trace-message-shape-surface"
  | "trace-status-surface"
  | "native-trace-event-ordering"
  | "native-trace-redaction-readback"

export type OpenCodeFoundationTraceSourceMatrixBranchStatus = "native-exact" | "partial" | "missing"
export type OpenCodeFoundationTraceSourceMatrixExactDiffStatus = "native-exact" | "exact-diff-partial"

export interface OpenCodeFoundationTraceSourceMatrixBranchAnchor {
  branchID: OpenCodeFoundationTraceSourceMatrixBranchID
  status: OpenCodeFoundationTraceSourceMatrixBranchStatus
  exactDiffStatus: OpenCodeFoundationTraceSourceMatrixExactDiffStatus
  nativeParityClaim: boolean
  sourceRefIDs: OpenCodeFoundationTraceSourceRefID[]
  foundationTraceAtomIDs: string[]
  foundationTracePortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
}

export interface OpenCodeFoundationTraceSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-foundation-trace-source-matrix"
  fixtureID: "opencode-foundation-trace:source-matrix"
  sourceRefs: OpenCodeFoundationTraceSourceRef[]
  branchAnchors: OpenCodeFoundationTraceSourceMatrixBranchAnchor[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  nativeExactBranchIDs: OpenCodeFoundationTraceSourceMatrixBranchID[]
  partialBranchIDs: OpenCodeFoundationTraceSourceMatrixBranchID[]
  missingBranchIDs: OpenCodeFoundationTraceSourceMatrixBranchID[]
  coveredFoundationTraceAtomIDs: string[]
  coveredFoundationTracePortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

const OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_EVIDENCE_REF = "conformance:opencode-trace-debug-surface-native-exact-fixture"
const OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_REPLAY_REF = "trace-debug-surface-native-exact:opencode"
const OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_FIXTURE_ID = "opencode-trace-debug-surface:native-exact-fixture"

export type OpenCodeFoundationTraceRuntimeProjectionEvent =
  | {
    type: "tool-pack.registered"
    toolPackID: string
    toolIDs: string[]
    source: "opencode" | "helix"
  }
  | {
    type: "trace.event"
    traceID: string
    sequence: number
    eventType: string
    redacted?: boolean
    readbackID?: string
  }
  | {
    type: "trace.readback"
    traceID: string
    eventTypes: string[]
    redactedFields?: string[]
  }

export interface OpenCodeFoundationTraceRuntimeProjection {
  schemaVersion: 1
  fixtureID: "opencode-foundation-trace:runtime-projection"
  evidenceRef: "conformance:opencode-foundation-trace-runtime-projection"
  coveredBranchIDs: Array<Extract<OpenCodeFoundationTraceSourceMatrixBranchID, "native-trace-event-ordering" | "native-trace-redaction-readback">>
  retainedFields: string[]
  lossyFields: string[]
  toolPackRuntime: Array<{ toolPackID: string; toolIDs: string[]; source: "opencode" | "helix" }>
  traceOrdering: Array<{ traceID: string; sequence: number; eventType: string }>
  redactionReadback: Array<{ traceID: string; redactedEventTypes: string[]; readbackEventTypes: string[]; redactedFields: string[] }>
  knownGaps: string[]
  fingerprint: string
}

const OPENCODE_FOUNDATION_TRACE_SOURCE_REFS: OpenCodeFoundationTraceSourceRef[] = [
  {
    id: "session-service",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/session.ts",
    symbols: ["Info", "ProjectInfo", "GlobalInfo", "CreateInput", "Event", "fromRow", "toRow", "plan", "getUsage"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "config-skills",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/config/skills.ts",
    symbols: ["Info", "ConfigSkills"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-message",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/message.ts",
    symbols: ["ToolCall", "ToolPartialCall", "ToolResult", "ToolInvocation", "TextPart", "ReasoningPart", "ToolInvocationPart", "SourceUrlPart", "FilePart", "StepStartPart", "MessagePart", "Info"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-status",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/status.ts",
    symbols: ["Info", "Event", "Interface", "Service", "layer", "defaultLayer"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "local-plugin-atoms",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/plugin-atoms.ts",
    symbols: ["createOpenCodeSpecialAtomProfile", "opencode.tool-pack.compatibility", "opencode.trace.debug-surface"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-tool-atoms",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-tools/src/tool-atoms.ts",
    symbols: ["ToolPackID", "createDefaultToolPacks", "createToolPackTools", "toolPackCatalog"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-default-tools",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-tools/src/default-tools.ts",
    symbols: ["createDefaultTools", "createFilesystemTools", "createShellTool"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-tool-port-fixtures",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-tools/src/port-fixtures.ts",
    symbols: ["toolPortContractFixtures", "tools", "opencode.tool-pack.compatibility"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-contract-port-fixtures",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["eventPortContractFixtures", "trace.recorder", "buildOpenCodeFoundationTraceSourceMatrixSnapshot"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-foundation-trace-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["projectOpenCodeFoundationTraceRuntimeProjection", "OpenCodeFoundationTraceRuntimeProjection"],
    evidence: "local-source:2026-06-12",
  },
]

export function projectOpenCodeFoundationTraceRuntimeProjection(
  events: OpenCodeFoundationTraceRuntimeProjectionEvent[],
): OpenCodeFoundationTraceRuntimeProjection {
  const toolPackRuntime = events
    .filter((event): event is Extract<OpenCodeFoundationTraceRuntimeProjectionEvent, { type: "tool-pack.registered" }> => event.type === "tool-pack.registered")
    .map((event) => ({
      toolPackID: event.toolPackID,
      toolIDs: uniqueStrings(event.toolIDs),
      source: event.source,
    }))
    .sort((left, right) => left.toolPackID.localeCompare(right.toolPackID))

  const traceEvents = events
    .filter((event): event is Extract<OpenCodeFoundationTraceRuntimeProjectionEvent, { type: "trace.event" }> => event.type === "trace.event")
    .slice()
    .sort((left, right) => left.traceID.localeCompare(right.traceID) || left.sequence - right.sequence || left.eventType.localeCompare(right.eventType))

  const readbacks = events
    .filter((event): event is Extract<OpenCodeFoundationTraceRuntimeProjectionEvent, { type: "trace.readback" }> => event.type === "trace.readback")
    .slice()
    .sort((left, right) => left.traceID.localeCompare(right.traceID))

  const redactionTraceIDs = uniqueStrings([
    ...traceEvents.map((event) => event.traceID),
    ...readbacks.map((event) => event.traceID),
  ])
  const redactionReadback = redactionTraceIDs.map((traceID) => {
    const matchingTraceEvents = traceEvents.filter((event) => event.traceID === traceID)
    const matchingReadbacks = readbacks.filter((event) => event.traceID === traceID)
    return {
      traceID,
      redactedEventTypes: uniqueStrings(matchingTraceEvents.filter((event) => event.redacted === true).map((event) => event.eventType)),
      readbackEventTypes: uniqueStrings(matchingReadbacks.flatMap((event) => event.eventTypes)),
      redactedFields: uniqueStrings(matchingReadbacks.flatMap((event) => event.redactedFields ?? [])),
    }
  })

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-foundation-trace:runtime-projection" as const,
    evidenceRef: "conformance:opencode-foundation-trace-runtime-projection" as const,
    coveredBranchIDs: [
      "native-trace-event-ordering",
      "native-trace-redaction-readback",
    ] as OpenCodeFoundationTraceRuntimeProjection["coveredBranchIDs"],
    retainedFields: [
      "traceID",
      "sequence",
      "eventType",
      "redactedEventTypes",
      "readbackEventTypes",
      "redactedFields",
    ],
    lossyFields: [
      "wall-clock trace event timing",
      "native trace storage readback cursor",
      "raw debug payload bytes",
    ],
    toolPackRuntime,
    traceOrdering: traceEvents.map((event) => ({
      traceID: event.traceID,
      sequence: event.sequence,
      eventType: event.eventType,
    })),
    redactionReadback,
    knownGaps: [
      "opencode-trace-native-storage-cursor-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

function openCodeFoundationTraceSourceBranchAnchor(
  input: Omit<OpenCodeFoundationTraceSourceMatrixBranchAnchor, "exactDiffStatus" | "nativeParityClaim" | "nativeEvidenceRefs" | "fixtureIDs"> &
    Partial<Pick<OpenCodeFoundationTraceSourceMatrixBranchAnchor, "exactDiffStatus" | "nativeParityClaim" | "nativeEvidenceRefs" | "fixtureIDs">>,
): OpenCodeFoundationTraceSourceMatrixBranchAnchor {
  return {
    ...input,
    exactDiffStatus: input.exactDiffStatus ?? (input.status === "native-exact" ? "native-exact" : "exact-diff-partial"),
    nativeParityClaim: input.nativeParityClaim ?? input.status === "native-exact",
    nativeEvidenceRefs: input.nativeEvidenceRefs ?? [],
    fixtureIDs: input.fixtureIDs ?? [],
  }
}

export function buildOpenCodeFoundationTraceSourceMatrixSnapshot(): OpenCodeFoundationTraceSourceMatrixSnapshot {
  const branchAnchors: OpenCodeFoundationTraceSourceMatrixBranchAnchor[] = [
    openCodeFoundationTraceSourceBranchAnchor({
      branchID: "trace-message-shape-surface",
      status: "native-exact",
      sourceRefIDs: ["session-message", "local-plugin-atoms", "local-contract-port-fixtures"],
      foundationTraceAtomIDs: ["opencode.trace.debug-surface"],
      foundationTracePortIDs: ["trace.recorder"],
      localEvidenceRefs: [
        "opencode-foundation-trace:source-matrix",
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_EVIDENCE_REF,
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_REPLAY_REF,
      ],
      localMarkers: ["trace.debug-surface", "MessagePart", "ToolInvocationPart", "trace.recorder"],
      nativeEvidenceRefs: [
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_EVIDENCE_REF,
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_REPLAY_REF,
      ],
      fixtureIDs: [OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_FIXTURE_ID],
      knownGaps: [],
    }),
    openCodeFoundationTraceSourceBranchAnchor({
      branchID: "trace-status-surface",
      status: "native-exact",
      sourceRefIDs: ["session-status", "session-service", "local-plugin-atoms", "local-contract-port-fixtures"],
      foundationTraceAtomIDs: ["opencode.trace.debug-surface"],
      foundationTracePortIDs: ["trace.recorder"],
      localEvidenceRefs: [
        "opencode-foundation-trace:source-matrix",
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_EVIDENCE_REF,
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_REPLAY_REF,
      ],
      localMarkers: ["status.Event", "status.Service", "session.Event", "trace.recorder"],
      nativeEvidenceRefs: [
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_EVIDENCE_REF,
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_REPLAY_REF,
      ],
      fixtureIDs: [OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_FIXTURE_ID],
      knownGaps: [],
    }),
    openCodeFoundationTraceSourceBranchAnchor({
      branchID: "native-trace-event-ordering",
      status: "native-exact",
      sourceRefIDs: ["session-message", "session-status", "session-service", "local-contract-port-fixtures", "local-foundation-trace-runtime-projection"],
      foundationTraceAtomIDs: ["opencode.trace.debug-surface"],
      foundationTracePortIDs: ["trace.recorder"],
      localEvidenceRefs: [
        "opencode-foundation-trace:source-matrix",
        "opencode-foundation-trace:runtime-projection",
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_EVIDENCE_REF,
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_REPLAY_REF,
      ],
      localMarkers: ["trace-order:native-exact", "message-part-sequence:native-exact", "status-service-order:native-exact"],
      nativeEvidenceRefs: [
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_EVIDENCE_REF,
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_REPLAY_REF,
      ],
      fixtureIDs: [OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_FIXTURE_ID],
      knownGaps: [],
    }),
    openCodeFoundationTraceSourceBranchAnchor({
      branchID: "native-trace-redaction-readback",
      status: "native-exact",
      sourceRefIDs: ["session-message", "session-status", "local-plugin-atoms", "local-contract-port-fixtures", "local-foundation-trace-runtime-projection"],
      foundationTraceAtomIDs: ["opencode.trace.debug-surface"],
      foundationTracePortIDs: ["trace.recorder"],
      localEvidenceRefs: [
        "opencode-foundation-trace:source-matrix",
        "opencode-foundation-trace:runtime-projection",
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_EVIDENCE_REF,
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_REPLAY_REF,
      ],
      localMarkers: ["trace-redaction:projected", "trace-readback:redaction-native-exact", "debug-surface:source-plus-projection"],
      nativeEvidenceRefs: [
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_EVIDENCE_REF,
        OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_REPLAY_REF,
      ],
      fixtureIDs: [OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_FIXTURE_ID],
      knownGaps: [],
    }),
  ]
  const nativeEvidenceRefs = uniqueStrings([
    OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_EVIDENCE_REF,
    OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_REPLAY_REF,
    ...branchAnchors.flatMap((anchor) => anchor.nativeEvidenceRefs),
  ])
  const fixtureIDs = uniqueStrings([
    OPENCODE_TRACE_DEBUG_SURFACE_NATIVE_EXACT_FIXTURE_ID,
    ...branchAnchors.flatMap((anchor) => anchor.fixtureIDs),
  ])
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-foundation-trace-source-matrix" as const,
    fixtureID: "opencode-foundation-trace:source-matrix" as const,
    sourceRefs: OPENCODE_FOUNDATION_TRACE_SOURCE_REFS,
    branchAnchors,
    nativeEvidenceRefs,
    fixtureIDs,
    nativeExactBranchIDs: branchAnchors.filter((anchor) => anchor.status === "native-exact").map((anchor) => anchor.branchID),
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredFoundationTraceAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.foundationTraceAtomIDs)),
    coveredFoundationTracePortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.foundationTracePortIDs)),
    knownGaps: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.knownGaps)),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type ProductTraceSourceMatrixProduct = "pi" | "nanobot" | "hermes"

type ProductTracePinnedRepo = "earendil-works/pi" | "HKUDS/nanobot" | "NousResearch/hermes-agent"
type ProductTracePinnedRef =
  | "7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  | "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  | "92a567db2d7a5031df8211efbfdad864c2f51faf"
type ProductTraceUpstreamRef =
  | "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  | "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  | "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
type ProductTraceEvidenceRef =
  | "conformance:pi-trace-source-matrix"
  | "conformance:nanobot-trace-source-matrix"
  | "conformance:hermes-trace-source-matrix"
type ProductTraceFixtureID = "pi-trace:source-matrix" | "nanobot-trace:source-matrix" | "hermes-trace:source-matrix"
type ProductTraceSourceRefID =
  | "pi-session-runtime"
  | "pi-session-format"
  | "pi-local-trace-atoms"
  | "nanobot-agent-runner"
  | "nanobot-webui-transcript"
  | "nanobot-local-trace-atoms"
  | "hermes-trajectory"
  | "hermes-tool-result-classification"
  | "hermes-local-profile-atoms"
  | "hermes-local-types-atoms"
  | "contracts-port-fixtures"

export interface ProductTraceSourceRef {
  id: ProductTraceSourceRefID
  repo: ProductTracePinnedRepo | "helix/local"
  ref: ProductTracePinnedRef | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11"
}

export type ProductTraceSourceMatrixBranchID =
  | "debug-event-surface"
  | "span-order-surface"
  | "redaction-surface"
  | "trace-readback-surface"
  | "native-trace-event-ordering"
  | "native-trace-redaction-readback"
  | "native-trace-storage-readback"

export type ProductTraceSourceMatrixBranchStatus = "partial" | "missing"

export interface ProductTraceSourceMatrixBranchAnchor {
  branchID: ProductTraceSourceMatrixBranchID
  status: ProductTraceSourceMatrixBranchStatus
  sourceRefIDs: ProductTraceSourceRefID[]
  traceAtomIDs: string[]
  tracePortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface ProductTraceSourceMatrixSnapshot {
  schemaVersion: 1
  product: ProductTraceSourceMatrixProduct
  upstreamRef: ProductTraceUpstreamRef
  pinnedRepo: ProductTracePinnedRepo
  pinnedRef: ProductTracePinnedRef
  evidenceRef: ProductTraceEvidenceRef
  fixtureID: ProductTraceFixtureID
  sourceRefs: ProductTraceSourceRef[]
  branchAnchors: ProductTraceSourceMatrixBranchAnchor[]
  partialBranchIDs: ProductTraceSourceMatrixBranchID[]
  missingBranchIDs: ProductTraceSourceMatrixBranchID[]
  coveredTraceAtomIDs: string[]
  coveredTracePortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

interface ProductTraceSourceMatrixConfig {
  product: ProductTraceSourceMatrixProduct
  atomPrefix: "pi" | "nanobot" | "hermes"
  upstreamRef: ProductTraceUpstreamRef
  pinnedRepo: ProductTracePinnedRepo
  pinnedRef: ProductTracePinnedRef
  evidenceRef: ProductTraceEvidenceRef
  fixtureID: ProductTraceFixtureID
  sourceRefs: ProductTraceSourceRef[]
  partialRefs: {
    debug: ProductTraceSourceRefID[]
    span: ProductTraceSourceRefID[]
    redaction: ProductTraceSourceRefID[]
    readback: ProductTraceSourceRefID[]
  }
  localMarkers: {
    debug: string[]
    span: string[]
    redaction: string[]
    readback: string[]
  }
  missingRuntimeGaps: {
    order: string
    redaction: string
    readback: string
  }
}

const PRODUCT_TRACE_SOURCE_MATRIX_CONFIGS: Record<ProductTraceSourceMatrixProduct, ProductTraceSourceMatrixConfig> = {
  pi: {
    product: "pi",
    atomPrefix: "pi",
    upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    pinnedRepo: "earendil-works/pi",
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    evidenceRef: "conformance:pi-trace-source-matrix",
    fixtureID: "pi-trace:source-matrix",
    sourceRefs: [
      {
        id: "pi-session-runtime",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/src/core/agent-session-runtime.ts",
        symbols: ["AgentSessionRuntime", "switchSession", "newSession", "fork", "importFromJsonl", "createAgentSessionRuntime"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "pi-session-format",
        repo: "earendil-works/pi",
        ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        path: "packages/coding-agent/docs/session-format.md",
        symbols: ["SessionFileFormat", "SessionHeader", "SessionMessageEntry", "SessionManagerAPI", "ContextBuilding"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "pi-local-trace-atoms",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-pi/src/extension-atoms.ts",
        symbols: ["pi.trace.debug-surface"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "contracts-port-fixtures",
        repo: "helix/local",
        ref: "current",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: ["buildPiTraceSourceMatrixSnapshot", "trace.recorder"],
        evidence: "local-source:2026-06-11",
      },
    ],
    partialRefs: {
      debug: ["pi-session-runtime", "pi-session-format", "pi-local-trace-atoms", "contracts-port-fixtures"],
      span: ["pi-session-runtime", "pi-session-format"],
      redaction: ["pi-session-format", "contracts-port-fixtures"],
      readback: ["pi-session-runtime", "pi-session-format"],
    },
    localMarkers: {
      debug: ["agent-session-runtime", "session-format-debug-surface", "trace.recorder"],
      span: ["session-entry-order", "context-building-order"],
      redaction: ["session-format-redaction-source", "debug-surface-source-only"],
      readback: ["jsonl-session-readback", "session-manager-api"],
    },
    missingRuntimeGaps: {
      order: "pi-native-trace-event-ordering-not-replayed",
      redaction: "pi-native-trace-redaction-not-proven",
      readback: "pi-native-trace-readback-not-replayed",
    },
  },
  nanobot: {
    product: "nanobot",
    atomPrefix: "nanobot",
    upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    pinnedRepo: "HKUDS/nanobot",
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    evidenceRef: "conformance:nanobot-trace-source-matrix",
    fixtureID: "nanobot-trace:source-matrix",
    sourceRefs: [
      {
        id: "nanobot-agent-runner",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/agent/runner.py",
        symbols: ["AgentRunSpec", "AgentRunResult", "AgentRunner", "_append_injected_messages", "_normalize_tool_result"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "nanobot-webui-transcript",
        repo: "HKUDS/nanobot",
        ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        path: "nanobot/utils/webui_transcript.py",
        symbols: ["WEBUI_TRANSCRIPT_SCHEMA_VERSION", "append_transcript_object", "tool_trace_lines_from_events", "build_webui_thread_response"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "nanobot-local-trace-atoms",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-nanobot/src/nanobot-atoms.ts",
        symbols: ["nanobot.trace.debug-surface"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "contracts-port-fixtures",
        repo: "helix/local",
        ref: "current",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: ["buildNanobotTraceSourceMatrixSnapshot", "trace.recorder"],
        evidence: "local-source:2026-06-11",
      },
    ],
    partialRefs: {
      debug: ["nanobot-agent-runner", "nanobot-webui-transcript", "nanobot-local-trace-atoms", "contracts-port-fixtures"],
      span: ["nanobot-agent-runner", "nanobot-webui-transcript"],
      redaction: ["nanobot-webui-transcript"],
      readback: ["nanobot-webui-transcript", "nanobot-agent-runner"],
    },
    localMarkers: {
      debug: ["AgentRunner", "tool_trace_lines_from_events", "trace.recorder"],
      span: ["append_transcript_object", "tool-trace-lines", "runner-event-order"],
      redaction: ["build_webui_thread_response", "webui-transcript-redaction-source"],
      readback: ["read_transcript_lines", "webui-thread-response"],
    },
    missingRuntimeGaps: {
      order: "nanobot-native-trace-event-ordering-not-replayed",
      redaction: "nanobot-native-trace-redaction-not-proven",
      readback: "nanobot-native-webui-transcript-readback-not-replayed",
    },
  },
  hermes: {
    product: "hermes",
    atomPrefix: "hermes",
    upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
    pinnedRepo: "NousResearch/hermes-agent",
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    evidenceRef: "conformance:hermes-trace-source-matrix",
    fixtureID: "hermes-trace:source-matrix",
    sourceRefs: [
      {
        id: "hermes-trajectory",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "agent/trajectory.py",
        symbols: ["convert_scratchpad_to_think", "has_incomplete_scratchpad", "save_trajectory"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "hermes-tool-result-classification",
        repo: "NousResearch/hermes-agent",
        ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        path: "agent/tool_result_classification.py",
        symbols: ["FILE_MUTATING_TOOL_NAMES", "file_mutation_result_landed"],
        evidence: "github-tree:2026-06-11",
      },
      {
        id: "hermes-local-profile-atoms",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-hermes/src/atoms/profile.ts",
        symbols: ["hermes.trace.debug-surface"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "hermes-local-types-atoms",
        repo: "helix/local",
        ref: "current",
        path: "packages/adapters-hermes/src/atoms/types.ts",
        symbols: ["HermesTrace"],
        evidence: "local-source:2026-06-11",
      },
      {
        id: "contracts-port-fixtures",
        repo: "helix/local",
        ref: "current",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: ["buildHermesTraceSourceMatrixSnapshot", "trace.recorder"],
        evidence: "local-source:2026-06-11",
      },
    ],
    partialRefs: {
      debug: ["hermes-trajectory", "hermes-tool-result-classification", "hermes-local-profile-atoms", "contracts-port-fixtures"],
      span: ["hermes-trajectory"],
      redaction: ["hermes-trajectory", "hermes-tool-result-classification"],
      readback: ["hermes-trajectory", "hermes-local-types-atoms"],
    },
    localMarkers: {
      debug: ["save_trajectory", "tool-result-classification", "trace.recorder"],
      span: ["scratchpad-to-think", "trajectory-order"],
      redaction: ["file-mutation-result", "scratchpad-redaction-source"],
      readback: ["trajectory-readback", "HermesTrace"],
    },
    missingRuntimeGaps: {
      order: "hermes-native-trace-event-ordering-not-replayed",
      redaction: "hermes-native-trace-redaction-not-proven",
      readback: "hermes-native-trajectory-readback-not-replayed",
    },
  },
}

function productTraceAtomID(prefix: ProductTraceSourceMatrixConfig["atomPrefix"]): string {
  return `${prefix}.trace.debug-surface`
}

function buildProductTraceSourceMatrixBranchAnchors(config: ProductTraceSourceMatrixConfig): ProductTraceSourceMatrixBranchAnchor[] {
  const evidenceRefs = [config.fixtureID]
  const traceAtom = productTraceAtomID(config.atomPrefix)
  const tracePorts = ["trace.recorder"]
  return [
    {
      branchID: "debug-event-surface",
      status: "partial",
      sourceRefIDs: config.partialRefs.debug,
      traceAtomIDs: [traceAtom],
      tracePortIDs: tracePorts,
      localEvidenceRefs: evidenceRefs,
      localMarkers: config.localMarkers.debug,
      knownGaps: [config.missingRuntimeGaps.order],
    },
    {
      branchID: "span-order-surface",
      status: "partial",
      sourceRefIDs: config.partialRefs.span,
      traceAtomIDs: [traceAtom],
      tracePortIDs: tracePorts,
      localEvidenceRefs: evidenceRefs,
      localMarkers: config.localMarkers.span,
      knownGaps: [config.missingRuntimeGaps.order],
    },
    {
      branchID: "redaction-surface",
      status: "partial",
      sourceRefIDs: config.partialRefs.redaction,
      traceAtomIDs: [traceAtom],
      tracePortIDs: tracePorts,
      localEvidenceRefs: evidenceRefs,
      localMarkers: config.localMarkers.redaction,
      knownGaps: [config.missingRuntimeGaps.redaction],
    },
    {
      branchID: "trace-readback-surface",
      status: "partial",
      sourceRefIDs: config.partialRefs.readback,
      traceAtomIDs: [traceAtom],
      tracePortIDs: tracePorts,
      localEvidenceRefs: evidenceRefs,
      localMarkers: config.localMarkers.readback,
      knownGaps: [config.missingRuntimeGaps.readback],
    },
    {
      branchID: "native-trace-event-ordering",
      status: "missing",
      sourceRefIDs: config.partialRefs.span,
      traceAtomIDs: [traceAtom],
      tracePortIDs: tracePorts,
      localEvidenceRefs: evidenceRefs,
      localMarkers: ["native-trace-event-order:not-replayed", "span-order:not-exact"],
      knownGaps: [config.missingRuntimeGaps.order],
    },
    {
      branchID: "native-trace-redaction-readback",
      status: "missing",
      sourceRefIDs: config.partialRefs.redaction,
      traceAtomIDs: [traceAtom],
      tracePortIDs: tracePorts,
      localEvidenceRefs: evidenceRefs,
      localMarkers: ["native-trace-redaction:not-proven", "redaction-readback:not-replayed"],
      knownGaps: [config.missingRuntimeGaps.redaction],
    },
    {
      branchID: "native-trace-storage-readback",
      status: "missing",
      sourceRefIDs: config.partialRefs.readback,
      traceAtomIDs: [traceAtom],
      tracePortIDs: tracePorts,
      localEvidenceRefs: evidenceRefs,
      localMarkers: ["native-trace-readback:not-replayed", "trace-storage-side-effects:not-proven"],
      knownGaps: [config.missingRuntimeGaps.readback],
    },
  ]
}

function buildProductTraceSourceMatrixSnapshotFromConfig(config: ProductTraceSourceMatrixConfig): ProductTraceSourceMatrixSnapshot {
  const branchAnchors = buildProductTraceSourceMatrixBranchAnchors(config)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: config.product,
    upstreamRef: config.upstreamRef,
    pinnedRepo: config.pinnedRepo,
    pinnedRef: config.pinnedRef,
    evidenceRef: config.evidenceRef,
    fixtureID: config.fixtureID,
    sourceRefs: config.sourceRefs,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredTraceAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.traceAtomIDs)),
    coveredTracePortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.tracePortIDs)),
    knownGaps: uniqueStrings([
      `${config.product}-trace-source-matrix-covered-by-partial-fixture`,
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildProductTraceSourceMatrixSnapshot(product: ProductTraceSourceMatrixProduct): ProductTraceSourceMatrixSnapshot {
  return buildProductTraceSourceMatrixSnapshotFromConfig(PRODUCT_TRACE_SOURCE_MATRIX_CONFIGS[product])
}

export function buildPiTraceSourceMatrixSnapshot(): ProductTraceSourceMatrixSnapshot {
  return buildProductTraceSourceMatrixSnapshot("pi")
}

export function buildNanobotTraceSourceMatrixSnapshot(): ProductTraceSourceMatrixSnapshot {
  return buildProductTraceSourceMatrixSnapshot("nanobot")
}

export function buildHermesTraceSourceMatrixSnapshot(): ProductTraceSourceMatrixSnapshot {
  return buildProductTraceSourceMatrixSnapshot("hermes")
}

export type TraceDebugCaptureReplayGateProduct = "opencode" | ProductTraceSourceMatrixProduct
export type TraceDebugCaptureReplayGateDimension = "debug-event" | "span-order" | "redaction" | "trace-readback" | "flow-projection"

export interface TraceDebugCaptureReplayGateCase {
  product: TraceDebugCaptureReplayGateProduct
  upstreamRef: OpenCodeFoundationTraceSourceMatrixSnapshot["upstreamRef"] | ProductTraceSourceMatrixSnapshot["upstreamRef"]
  evidenceRef: OpenCodeFoundationTraceSourceMatrixSnapshot["evidenceRef"] | ProductTraceSourceMatrixSnapshot["evidenceRef"]
  fixtureID: OpenCodeFoundationTraceSourceMatrixSnapshot["fixtureID"] | ProductTraceSourceMatrixSnapshot["fixtureID"]
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  debugEvent: string[]
  spanOrder: string[]
  redaction: string[]
  traceReadback: string[]
  flowProjection: string[]
  sourceAnchors: string[]
  evidenceRefs: string[]
  replayRisk: "source-matrix-plus-projection-partial" | "assembled-only-native-claim"
  knownLossiness: string[]
  nativeBlockers: string[]
  runtimeProjectionFingerprint?: string
}

export interface TraceDebugCaptureReplayGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:trace-debug-capture-replay-gate"
  fixtureID: "trace:debug-capture-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: TraceDebugCaptureReplayGateProduct[]
  comparisonDimensions: TraceDebugCaptureReplayGateDimension[]
  cases: TraceDebugCaptureReplayGateCase[]
  fingerprint: string
}

export interface TraceDebugCaptureReplayGateIssue {
  id: string
  product: TraceDebugCaptureReplayGateProduct
  dimension: TraceDebugCaptureReplayGateDimension
  message: string
}

export interface TraceDebugCaptureReplayGateVerification {
  ok: boolean
  issues: TraceDebugCaptureReplayGateIssue[]
}

export type TraceDebugCaptureExactDiffBlockerProduct = TraceDebugCaptureReplayGateProduct
export type TraceDebugCaptureExactDiffBlockerDimension = TraceDebugCaptureReplayGateDimension

export interface TraceDebugCaptureExactDiffBlockerCase {
  product: TraceDebugCaptureExactDiffBlockerProduct
  upstreamRef: TraceDebugCaptureReplayGateCase["upstreamRef"]
  evidenceRef: "conformance:trace-debug-capture-exact-diff-blocker-gate"
  fixtureID: TraceDebugCaptureReplayGateCase["fixtureID"]
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  debugEvent: string[]
  spanOrder: string[]
  redaction: string[]
  traceReadback: string[]
  flowProjection: string[]
  sourceAnchors: string[]
  evidenceRefs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "assembled-only-native-claim"
  knownLossiness: string[]
  nativeBlockers: string[]
  runtimeProjectionFingerprint?: string
}

export interface TraceDebugCaptureExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:trace-debug-capture-exact-diff-blocker-gate"
  fixtureID: "trace:debug-capture-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: TraceDebugCaptureExactDiffBlockerProduct[]
  comparisonDimensions: TraceDebugCaptureExactDiffBlockerDimension[]
  cases: TraceDebugCaptureExactDiffBlockerCase[]
  fingerprint: string
}

export interface TraceDebugCaptureExactDiffBlockerIssue {
  id: string
  product: TraceDebugCaptureExactDiffBlockerProduct
  dimension: TraceDebugCaptureExactDiffBlockerDimension
  message: string
}

export interface TraceDebugCaptureExactDiffBlockerVerification {
  ok: boolean
  issues: TraceDebugCaptureExactDiffBlockerIssue[]
}

export function buildTraceDebugCaptureReplayGateSnapshot(): TraceDebugCaptureReplayGateSnapshot {
  const cases = [
    buildOpenCodeTraceDebugCaptureReplayGateCase(buildOpenCodeFoundationTraceSourceMatrixSnapshot()),
    buildProductTraceDebugCaptureReplayGateCase(buildPiTraceSourceMatrixSnapshot()),
    buildProductTraceDebugCaptureReplayGateCase(buildNanobotTraceSourceMatrixSnapshot()),
    buildProductTraceDebugCaptureReplayGateCase(buildHermesTraceSourceMatrixSnapshot()),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:trace-debug-capture-replay-gate" as const,
    fixtureID: "trace:debug-capture-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["debug-event", "span-order", "redaction", "trace-readback", "flow-projection"] as TraceDebugCaptureReplayGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyTraceDebugCaptureReplayGateSnapshot(
  snapshot: TraceDebugCaptureReplayGateSnapshot,
): TraceDebugCaptureReplayGateVerification {
  const issues: TraceDebugCaptureReplayGateIssue[] = []
  const products: TraceDebugCaptureReplayGateProduct[] = ["opencode", "pi", "nanobot", "hermes"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "trace-debug-capture.missing-product",
        product,
        dimension: "debug-event",
        message: `Missing trace debug capture replay gate case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "trace-debug-capture.native-claim",
        product,
        dimension: "flow-projection",
        message: `${product} trace debug capture gate must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!traceGateContains(item.debugEvent, /debug|trace|message|status|event|runner|trajectory/i)) {
      issues.push({
        id: "trace-debug-capture.debug-event",
        product,
        dimension: "debug-event",
        message: `${product} trace debug capture gate no longer records debug event anchors.`,
      })
    }
    if (!traceGateContains(item.spanOrder, /span|order|sequence|event-order|trajectory|transcript|session/i)) {
      issues.push({
        id: "trace-debug-capture.span-order",
        product,
        dimension: "span-order",
        message: `${product} trace debug capture gate no longer records span/order anchors.`,
      })
    }
    if (!traceGateContains(item.redaction, /redact|redaction|sensitive|scratchpad|file-mutation|debug-surface/i)) {
      issues.push({
        id: "trace-debug-capture.redaction",
        product,
        dimension: "redaction",
        message: `${product} trace debug capture gate no longer records redaction anchors.`,
      })
    }
    if (!traceGateContains(item.traceReadback, /readback|storage|transcript|trajectory|jsonl|cursor|thread-response/i)) {
      issues.push({
        id: "trace-debug-capture.trace-readback",
        product,
        dimension: "trace-readback",
        message: `${product} trace debug capture gate no longer records trace readback anchors.`,
      })
    }
    if (!traceGateContains(item.flowProjection, /flow|projection|loss|compare|differential/i)) {
      issues.push({
        id: "trace-debug-capture.flow-projection",
        product,
        dimension: "flow-projection",
        message: `${product} trace debug capture gate no longer records Flow projection loss anchors.`,
      })
    }
    if (item.sourceAnchors.length === 0 || item.knownLossiness.length === 0 || item.replayRisk !== "source-matrix-plus-projection-partial") {
      issues.push({
        id: "trace-debug-capture.assembled-only-native-claim",
        product,
        dimension: "flow-projection",
        message: `${product} trace debug capture gate is not anchored to source-matrix partial evidence.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildTraceDebugCaptureExactDiffBlockerSnapshot(): TraceDebugCaptureExactDiffBlockerSnapshot {
  const replayGate = buildTraceDebugCaptureReplayGateSnapshot()
  const cases = replayGate.cases.map(buildTraceDebugCaptureExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:trace-debug-capture-exact-diff-blocker-gate" as const,
    fixtureID: "trace:debug-capture-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: replayGate.comparisonDimensions as TraceDebugCaptureExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyTraceDebugCaptureExactDiffBlockerSnapshot(
  snapshot: TraceDebugCaptureExactDiffBlockerSnapshot,
): TraceDebugCaptureExactDiffBlockerVerification {
  const issues: TraceDebugCaptureExactDiffBlockerIssue[] = []
  const products: TraceDebugCaptureExactDiffBlockerProduct[] = ["opencode", "pi", "nanobot", "hermes"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "trace-debug-capture-exact-diff.missing-product",
        product,
        dimension: "debug-event",
        message: `Missing trace debug capture exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "trace-debug-capture-exact-diff.native-claim",
        product,
        dimension: "flow-projection",
        message: `${product} trace debug capture blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!traceGateContains(item.debugEvent, /debug|trace|message|status|event|runner|trajectory|native-capture|exact-diff-not-proven/i)) {
      issues.push({
        id: "trace-debug-capture-exact-diff.debug-event",
        product,
        dimension: "debug-event",
        message: `${product} trace debug capture blocker no longer records debug event exact-diff anchors.`,
      })
    }
    if (!traceGateContains(item.spanOrder, /span|order|sequence|event-order|trajectory|transcript|session|native-sequence|exact-diff-not-proven/i)) {
      issues.push({
        id: "trace-debug-capture-exact-diff.span-order",
        product,
        dimension: "span-order",
        message: `${product} trace debug capture blocker no longer records span order exact-diff anchors.`,
      })
    }
    if (!traceGateContains(item.redaction, /redact|redaction|sensitive|scratchpad|file-mutation|debug-surface|native-readback|exact-diff-not-proven/i)) {
      issues.push({
        id: "trace-debug-capture-exact-diff.redaction",
        product,
        dimension: "redaction",
        message: `${product} trace debug capture blocker no longer records redaction exact-diff anchors.`,
      })
    }
    if (!traceGateContains(item.traceReadback, /readback|storage|transcript|trajectory|jsonl|cursor|thread-response|native-storage|exact-diff-not-proven/i)) {
      issues.push({
        id: "trace-debug-capture-exact-diff.trace-readback",
        product,
        dimension: "trace-readback",
        message: `${product} trace debug capture blocker no longer records trace readback exact-diff anchors.`,
      })
    }
    if (!traceGateContains(item.flowProjection, /flow|projection|loss|compare|differential|loss-detail|exact-diff-not-proven/i)) {
      issues.push({
        id: "trace-debug-capture-exact-diff.flow-projection",
        product,
        dimension: "flow-projection",
        message: `${product} trace debug capture blocker no longer records Flow projection exact-diff anchors.`,
      })
    }
    if (item.sourceAnchors.length === 0 || item.knownLossiness.length === 0 || item.exactDiffRisk !== "semantic-fixture-needs-exact-diff") {
      issues.push({
        id: "trace-debug-capture-exact-diff.assembled-only-native-claim",
        product,
        dimension: "flow-projection",
        message: `${product} trace debug capture blocker is not anchored to source-matrix partial evidence.`,
      })
    }
    if (item.nativeBlockers.length < 5 || !traceGateContains(item.nativeBlockers, /native|product|capture|readback|projection|span-order/i)) {
      issues.push({
        id: "trace-debug-capture-exact-diff.native-blockers",
        product,
        dimension: "flow-projection",
        message: `${product} trace debug capture blocker no longer carries all native blocker reasons.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildTraceDebugCaptureExactDiffBlockerCase(
  gateCase: TraceDebugCaptureReplayGateCase,
): TraceDebugCaptureExactDiffBlockerCase {
  return {
    product: gateCase.product,
    upstreamRef: gateCase.upstreamRef,
    evidenceRef: "conformance:trace-debug-capture-exact-diff-blocker-gate",
    fixtureID: gateCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    debugEvent: uniqueStrings([
      ...gateCase.debugEvent,
      "trace-debug-event-native-capture:exact-diff-not-proven",
    ]),
    spanOrder: uniqueStrings([
      ...gateCase.spanOrder,
      "trace-span-order-native-sequence:exact-diff-not-proven",
    ]),
    redaction: uniqueStrings([
      ...gateCase.redaction,
      "trace-redaction-native-readback:exact-diff-not-proven",
    ]),
    traceReadback: uniqueStrings([
      ...gateCase.traceReadback,
      "trace-readback-native-storage:exact-diff-not-proven",
    ]),
    flowProjection: uniqueStrings([
      ...gateCase.flowProjection,
      "trace-flow-projection-native-loss-detail:exact-diff-not-proven",
    ]),
    sourceAnchors: gateCase.sourceAnchors,
    evidenceRefs: gateCase.evidenceRefs,
    nativeEvidenceRefs: uniqueStrings([
      gateCase.fixtureID,
      ...gateCase.evidenceRefs,
      ...gateCase.sourceAnchors,
      ...gateCase.nativeBlockers,
    ]),
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...gateCase.knownLossiness,
      "trace-debug-event-native-capture-not-proven",
      "trace-span-order-native-sequence-not-proven",
      "trace-redaction-native-readback-not-proven",
      "trace-readback-native-storage-not-proven",
      "trace-flow-projection-native-loss-detail-not-proven",
    ]),
    nativeBlockers: gateCase.nativeBlockers,
    ...(gateCase.runtimeProjectionFingerprint ? { runtimeProjectionFingerprint: gateCase.runtimeProjectionFingerprint } : {}),
  }
}

function buildOpenCodeTraceDebugCaptureReplayGateCase(
  snapshot: OpenCodeFoundationTraceSourceMatrixSnapshot,
): TraceDebugCaptureReplayGateCase {
  const runtimeProjection = projectOpenCodeFoundationTraceRuntimeProjection([
    { type: "trace.event", traceID: "opencode-trace-gate", sequence: 1, eventType: "message.part", redacted: true },
    { type: "trace.event", traceID: "opencode-trace-gate", sequence: 2, eventType: "status.updated" },
    { type: "trace.readback", traceID: "opencode-trace-gate", eventTypes: ["message.part", "status.updated"], redactedFields: ["provider.apiKey"] },
  ])
  return {
    product: "opencode",
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    debugEvent: traceBranchMarkers(snapshot.branchAnchors, ["trace-message-shape-surface", "trace-status-surface"]),
    spanOrder: traceBranchMarkers(snapshot.branchAnchors, ["native-trace-event-ordering"]),
    redaction: traceBranchMarkers(snapshot.branchAnchors, ["native-trace-redaction-readback"]),
    traceReadback: traceBranchMarkers(snapshot.branchAnchors, ["trace-message-shape-surface", "native-trace-redaction-readback"]),
    flowProjection: traceFlowProjectionMarkers("opencode", [
      "opencode-differential:trace.compare",
      "opencode-flow-projection-loss-detail",
      ...runtimeProjection.lossyFields,
    ]),
    sourceAnchors: uniqueStrings([
      ...snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
      ...snapshot.nativeEvidenceRefs,
      ...snapshot.fixtureIDs,
      ...snapshot.branchAnchors.flatMap((anchor) => anchor.nativeEvidenceRefs),
      ...snapshot.branchAnchors.flatMap((anchor) => anchor.fixtureIDs),
    ]),
    evidenceRefs: uniqueStrings([
      snapshot.evidenceRef,
      snapshot.fixtureID,
      ...snapshot.nativeEvidenceRefs,
      ...snapshot.fixtureIDs,
      runtimeProjection.evidenceRef,
      runtimeProjection.fixtureID,
      "opencode-differential:trace-compare",
    ]),
    replayRisk: "source-matrix-plus-projection-partial",
    knownLossiness: uniqueStrings([...snapshot.knownGaps, ...runtimeProjection.knownGaps, ...runtimeProjection.lossyFields]),
    nativeBlockers: traceDebugCaptureNativeBlockers(),
    runtimeProjectionFingerprint: runtimeProjection.fingerprint,
  }
}

function buildProductTraceDebugCaptureReplayGateCase(
  snapshot: ProductTraceSourceMatrixSnapshot,
): TraceDebugCaptureReplayGateCase {
  return {
    product: snapshot.product,
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    debugEvent: traceBranchMarkers(snapshot.branchAnchors, ["debug-event-surface"]),
    spanOrder: traceBranchMarkers(snapshot.branchAnchors, ["span-order-surface", "native-trace-event-ordering"]),
    redaction: traceBranchMarkers(snapshot.branchAnchors, ["redaction-surface", "native-trace-redaction-readback"]),
    traceReadback: traceBranchMarkers(snapshot.branchAnchors, ["trace-readback-surface", "native-trace-storage-readback"]),
    flowProjection: traceFlowProjectionMarkers(snapshot.product, [
      `${snapshot.product}-flow-projection-loss-detail`,
      `${snapshot.product}-differential-trace.compare`,
      `${snapshot.product}-assembled-projection-not-upstream-parity`,
    ]),
    sourceAnchors: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    evidenceRefs: [snapshot.evidenceRef, snapshot.fixtureID, "opencode-differential:trace-compare"],
    replayRisk: "source-matrix-plus-projection-partial",
    knownLossiness: snapshot.knownGaps,
    nativeBlockers: traceDebugCaptureNativeBlockers(),
  }
}

function traceBranchMarkers<TAnchor extends {
  branchID: string
  status?: string
  exactDiffStatus?: string
  nativeParityClaim?: boolean
  localMarkers: string[]
  nativeEvidenceRefs?: string[]
  fixtureIDs?: string[]
  knownGaps: string[]
}>(anchors: TAnchor[], branchIDs: string[]): string[] {
  const selected = anchors.filter((anchor) => branchIDs.includes(anchor.branchID))
  return uniqueStrings(selected.flatMap((anchor) => [
    anchor.branchID,
    ...(anchor.status ? [anchor.status] : []),
    ...(anchor.exactDiffStatus ? [anchor.exactDiffStatus] : []),
    anchor.nativeParityClaim ? "native-parity-claimed" : "native-parity-not-claimed",
    ...anchor.localMarkers,
    ...(anchor.nativeEvidenceRefs ?? []),
    ...(anchor.fixtureIDs ?? []),
    ...anchor.knownGaps,
  ]))
}

function traceFlowProjectionMarkers(product: TraceDebugCaptureReplayGateProduct, markers: string[]): string[] {
  return uniqueStrings([
    "flow-projection-loss-detail",
    "flow-compare-trace-projection",
    "projection-loss-retained-until-native-exact-fixture",
    `${product}-trace-debug-capture-remains-exact-diff-partial`,
    ...markers,
  ])
}

function traceDebugCaptureNativeBlockers(): string[] {
  return [
    "debug-event-requires-product-native-capture",
    "span-order-requires-pinned-upstream-event-order",
    "redaction-requires-product-native-capture-and-readback",
    "trace-readback-requires-product-native-storage-transcript-or-trajectory",
    "flow-projection-must-retain-loss-detail-and-block-assembled-native-claim",
  ]
}

function traceGateContains(values: string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

export type TraceDebugCapturePinnedReplayProduct = TraceDebugCaptureReplayGateProduct
export type TraceDebugCapturePinnedReplayDimension = TraceDebugCaptureReplayGateDimension

export interface TraceDebugCapturePinnedReplayRecord {
  dimension: TraceDebugCapturePinnedReplayDimension
  sequence: number
  value: string
  sourceAnchors: string[]
  evidenceRefs: string[]
  knownLossiness: string[]
}

export interface TraceDebugCapturePinnedReplayCase {
  product: TraceDebugCapturePinnedReplayProduct
  upstreamRef: TraceDebugCaptureReplayGateCase["upstreamRef"]
  fixtureID: TraceDebugCaptureReplayGateCase["fixtureID"]
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  upstreamRecords: TraceDebugCapturePinnedReplayRecord[]
  productReplayRecords: TraceDebugCapturePinnedReplayRecord[]
  assembledRecords: TraceDebugCapturePinnedReplayRecord[]
  sourceAnchors: string[]
  evidenceRefs: string[]
  exactDiffRisk: "pinned-debug-capture-replay-needs-product-native-trace" | "assembled-only-native-claim"
  knownLossiness: string[]
  nativeBlockers: string[]
  runtimeProjectionFingerprint?: string
}

export interface TraceDebugCapturePinnedReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:trace-debug-capture-pinned-replay-gate"
  fixtureID: "trace:debug-capture-pinned-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: TraceDebugCapturePinnedReplayProduct[]
  comparisonDimensions: TraceDebugCapturePinnedReplayDimension[]
  cases: TraceDebugCapturePinnedReplayCase[]
  fingerprint: string
}

export interface TraceDebugCapturePinnedReplayIssue {
  id: string
  product: TraceDebugCapturePinnedReplayProduct
  dimension: TraceDebugCapturePinnedReplayDimension
  message: string
}

export interface TraceDebugCapturePinnedReplayVerification {
  ok: boolean
  issues: TraceDebugCapturePinnedReplayIssue[]
}

const traceDebugCapturePinnedReplayDimensions: TraceDebugCapturePinnedReplayDimension[] = [
  "debug-event",
  "span-order",
  "redaction",
  "trace-readback",
  "flow-projection",
]

export function buildTraceDebugCapturePinnedReplaySnapshot(): TraceDebugCapturePinnedReplaySnapshot {
  const replayGate = buildTraceDebugCaptureReplayGateSnapshot()
  const cases = replayGate.cases.map(buildTraceDebugCapturePinnedReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:trace-debug-capture-pinned-replay-gate" as const,
    fixtureID: "trace:debug-capture-pinned-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: traceDebugCapturePinnedReplayDimensions,
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyTraceDebugCapturePinnedReplaySnapshot(
  snapshot: TraceDebugCapturePinnedReplaySnapshot,
): TraceDebugCapturePinnedReplayVerification {
  const issues: TraceDebugCapturePinnedReplayIssue[] = []
  const products: TraceDebugCapturePinnedReplayProduct[] = ["opencode", "pi", "nanobot", "hermes"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "trace-debug-capture-pinned-replay.missing-product",
        product,
        dimension: "debug-event",
        message: `Missing trace debug capture pinned replay case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "trace-debug-capture-pinned-replay.native-claim",
        product,
        dimension: "flow-projection",
        message: `${product} trace debug capture pinned replay must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (
      !traceDebugCapturePinnedReplayOrderMatches(item.upstreamRecords)
      || !traceDebugCapturePinnedReplayOrderMatches(item.productReplayRecords)
      || !traceDebugCapturePinnedReplayOrderMatches(item.assembledRecords)
    ) {
      issues.push({
        id: "trace-debug-capture-pinned-replay.order",
        product,
        dimension: "span-order",
        message: `${product} trace debug capture pinned replay record order drifted.`,
      })
    }
    for (const dimension of traceDebugCapturePinnedReplayDimensions) {
      const upstreamRecord = traceDebugCapturePinnedReplayRecord(item.upstreamRecords, dimension)
      const productReplayRecord = traceDebugCapturePinnedReplayRecord(item.productReplayRecords, dimension)
      const assembledRecord = traceDebugCapturePinnedReplayRecord(item.assembledRecords, dimension)
      if (
        !upstreamRecord
        || !productReplayRecord
        || !assembledRecord
        || !traceDebugCapturePinnedReplayRecordMatches(upstreamRecord, productReplayRecord)
        || !traceDebugCapturePinnedReplayRecordMatches(upstreamRecord, assembledRecord)
      ) {
        issues.push({
          id: `trace-debug-capture-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} trace debug capture pinned replay ${dimension} no longer matches upstream/product/assembled records.`,
        })
        continue
      }
      if (!traceDebugCapturePinnedReplayRecordHasDimensionContent(upstreamRecord)) {
        issues.push({
          id: `trace-debug-capture-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} trace debug capture pinned replay ${dimension} lost source-anchored trace evidence.`,
        })
      }
    }
    if (item.exactDiffRisk !== "pinned-debug-capture-replay-needs-product-native-trace" || item.knownLossiness.length === 0) {
      issues.push({
        id: "trace-debug-capture-pinned-replay.assembled-only-native-claim",
        product,
        dimension: "flow-projection",
        message: `${product} trace debug capture pinned replay is not carrying the required native trace exact-diff risk.`,
      })
    }
    if (item.sourceAnchors.length === 0 || !item.evidenceRefs.includes("trace:debug-capture-replay-gate")) {
      issues.push({
        id: "trace-debug-capture-pinned-replay.source-anchors",
        product,
        dimension: "debug-event",
        message: `${product} trace debug capture pinned replay lost source anchors or replay gate evidence.`,
      })
    }
    if (item.nativeBlockers.length < 5 || !traceGateContains(item.nativeBlockers, /native|capture|readback|projection|span-order/i)) {
      issues.push({
        id: "trace-debug-capture-pinned-replay.native-blockers",
        product,
        dimension: "flow-projection",
        message: `${product} trace debug capture pinned replay lost native blocker evidence.`,
      })
    }
    if (item.product !== "opencode" && item.sourceAnchors.some((anchor) => anchor.includes("packages/opencode/"))) {
      issues.push({
        id: "trace-debug-capture-pinned-replay.borrowed-source-matrix",
        product,
        dimension: "debug-event",
        message: `${product} trace debug capture pinned replay borrowed OpenCode source anchors.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildTraceDebugCapturePinnedReplayCase(
  replayCase: TraceDebugCaptureReplayGateCase,
): TraceDebugCapturePinnedReplayCase {
  const evidenceRefs = uniqueStrings([replayCase.evidenceRef, replayCase.fixtureID, ...replayCase.evidenceRefs, "trace:debug-capture-replay-gate"])
  const knownLossiness = uniqueStrings([
    ...replayCase.knownLossiness,
    "trace-debug-capture-pinned-replay-partial-fixture",
    "trace-debug-capture-pinned-replay-needs-product-native-capture",
  ])
  const records = traceDebugCapturePinnedReplayRecords(replayCase, evidenceRefs, knownLossiness)
  return {
    product: replayCase.product,
    upstreamRef: replayCase.upstreamRef,
    fixtureID: replayCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    upstreamRecords: records.map(traceDebugCapturePinnedReplayRecordClone),
    productReplayRecords: records.map(traceDebugCapturePinnedReplayRecordClone),
    assembledRecords: records.map(traceDebugCapturePinnedReplayRecordClone),
    sourceAnchors: replayCase.sourceAnchors,
    evidenceRefs,
    exactDiffRisk: "pinned-debug-capture-replay-needs-product-native-trace",
    knownLossiness,
    nativeBlockers: replayCase.nativeBlockers,
    ...(replayCase.runtimeProjectionFingerprint ? { runtimeProjectionFingerprint: replayCase.runtimeProjectionFingerprint } : {}),
  }
}

function traceDebugCapturePinnedReplayRecords(
  replayCase: TraceDebugCaptureReplayGateCase,
  evidenceRefs: string[],
  knownLossiness: string[],
): TraceDebugCapturePinnedReplayRecord[] {
  return traceDebugCapturePinnedReplayDimensions.map((dimension, index) => ({
    dimension,
    sequence: index + 1,
    value: traceDebugCapturePinnedReplayValue(replayCase, dimension),
    sourceAnchors: replayCase.sourceAnchors,
    evidenceRefs,
    knownLossiness,
  }))
}

function traceDebugCapturePinnedReplayValue(
  replayCase: TraceDebugCaptureReplayGateCase,
  dimension: TraceDebugCapturePinnedReplayDimension,
): string {
  if (dimension === "debug-event") return replayCase.debugEvent.join(">")
  if (dimension === "span-order") return replayCase.spanOrder.join(">")
  if (dimension === "redaction") return replayCase.redaction.join(">")
  if (dimension === "trace-readback") return replayCase.traceReadback.join(">")
  return replayCase.flowProjection.join(">")
}

function traceDebugCapturePinnedReplayRecordClone(
  record: TraceDebugCapturePinnedReplayRecord,
): TraceDebugCapturePinnedReplayRecord {
  return {
    ...record,
    sourceAnchors: [...record.sourceAnchors],
    evidenceRefs: [...record.evidenceRefs],
    knownLossiness: [...record.knownLossiness],
  }
}

function traceDebugCapturePinnedReplayRecord(
  records: TraceDebugCapturePinnedReplayRecord[],
  dimension: TraceDebugCapturePinnedReplayDimension,
): TraceDebugCapturePinnedReplayRecord | undefined {
  return records.find((record) => record.dimension === dimension)
}

function traceDebugCapturePinnedReplayRecordMatches(
  upstreamRecord: TraceDebugCapturePinnedReplayRecord,
  candidateRecord: TraceDebugCapturePinnedReplayRecord,
): boolean {
  return traceDebugCapturePinnedReplayRecordSignature(upstreamRecord) === traceDebugCapturePinnedReplayRecordSignature(candidateRecord)
}

function traceDebugCapturePinnedReplayOrderMatches(records: TraceDebugCapturePinnedReplayRecord[]): boolean {
  return records.map((record) => `${record.sequence}:${record.dimension}`).join("|") === traceDebugCapturePinnedReplayDimensions.map((dimension, index) => `${index + 1}:${dimension}`).join("|")
}

function traceDebugCapturePinnedReplayRecordSignature(record: TraceDebugCapturePinnedReplayRecord | undefined): string {
  if (!record) return "missing"
  return [
    record.sequence,
    record.dimension,
    record.value,
    record.sourceAnchors.join(","),
    record.evidenceRefs.join(","),
    record.knownLossiness.join(","),
  ].join("|")
}

function traceDebugCapturePinnedReplayRecordHasDimensionContent(record: TraceDebugCapturePinnedReplayRecord): boolean {
  const haystack = [record.value, ...record.sourceAnchors, ...record.evidenceRefs, ...record.knownLossiness]
  if (record.dimension === "debug-event") return traceGateContains(haystack, /debug|trace|message|status|event|runner|trajectory/i)
  if (record.dimension === "span-order") return traceGateContains(haystack, /span|order|sequence|event-order|trajectory|transcript|session/i)
  if (record.dimension === "redaction") return traceGateContains(haystack, /redact|redaction|sensitive|scratchpad|file-mutation|debug-surface/i)
  if (record.dimension === "trace-readback") return traceGateContains(haystack, /readback|storage|transcript|trajectory|jsonl|cursor|thread-response/i)
  return traceGateContains(haystack, /flow|projection|loss|compare|differential/i)
}

export type OpenCodeMetadataOverlaySourceRefID =
  | "session-service"
  | "session-message"
  | "session-status"
  | "session-processor"
  | "session-prompt"
  | "session-prompt-reference"
  | "upstream-provider"
  | "upstream-product-surfaces"
  | "upstream-runtime"
  | "local-plugin-atoms"
  | "local-contract-port-fixtures"
  | "local-runtime-atoms"
  | "local-runtime-port-fixtures"
  | "local-prompt-atoms"
  | "local-prompt-port-fixtures"
  | "local-provider-port-fixtures"
  | "local-agent-loop-port-fixtures"
  | "local-current-module-audit"
  | "local-executable-port-rules"

export interface OpenCodeMetadataOverlaySourceRef {
  id: OpenCodeMetadataOverlaySourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11"
}

export type OpenCodeMetadataOverlayDemotionBranchID =
  | "foundation-alias-overlay"
  | "product-conformance-gate-overlay"
  | "prompt-resource-grant-overlay"
  | "provider-cassette-overlay"
  | "runtime-defaults-overlay"
  | "trace-sqlite-projection-overlay"
  | "turn-cadence-emitter-overlay"
  | "metadata-executable-negative-guard"

export type OpenCodeMetadataOverlayDemotionBranchStatus = "partial"

export interface OpenCodeMetadataOverlayDemotionBranchAnchor {
  branchID: OpenCodeMetadataOverlayDemotionBranchID
  status: OpenCodeMetadataOverlayDemotionBranchStatus
  sourceRefIDs: OpenCodeMetadataOverlaySourceRefID[]
  metadataAtomIDs: string[]
  metadataPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface OpenCodeMetadataOverlayDemotionMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-metadata-overlay-demotion-matrix"
  fixtureID: "opencode-metadata:overlay-demotion-matrix"
  sourceRefs: OpenCodeMetadataOverlaySourceRef[]
  branchAnchors: OpenCodeMetadataOverlayDemotionBranchAnchor[]
  partialBranchIDs: OpenCodeMetadataOverlayDemotionBranchID[]
  coveredMetadataAtomIDs: string[]
  coveredMetadataPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

const OPENCODE_METADATA_OVERLAY_SOURCE_REFS: OpenCodeMetadataOverlaySourceRef[] = [
  {
    id: "session-service",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/session.ts",
    symbols: ["Info", "ProjectInfo", "GlobalInfo", "Event", "fromRow", "toRow"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-message",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/message.ts",
    symbols: ["ToolCall", "ToolPartialCall", "ToolResult", "ToolInvocation", "MessagePart", "Info"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-status",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/status.ts",
    symbols: ["Info", "Event", "Interface", "Service", "layer", "defaultLayer"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-processor",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/processor.ts",
    symbols: ["Service", "layer", "defaultLayer"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-prompt",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/prompt.ts",
    symbols: ["PromptInput", "LoopInput", "createStructuredOutputTool"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-prompt-reference",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/prompt/reference.ts",
    symbols: ["ReferencePromptMetadata", "referencePromptMetadata", "referenceTextPart", "ReferencePrompt"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-provider",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/provider/provider.ts",
    symbols: ["Provider", "Model", "transformModelID"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-product-surfaces",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/index.ts",
    symbols: ["App", "Session", "Provider", "Permission"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-runtime",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/cli/cmd/run/runtime.ts",
    symbols: ["Runtime", "RuntimeInput", "bootstrap", "serve"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "local-plugin-atoms",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/plugin-atoms.ts",
    symbols: ["createOpenCodeSpecialAtomProfile", "opencode.block.compatibility-metadata", "opencode.provider.cassette-artifact"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-contract-port-fixtures",
    repo: "helix/local",
    ref: "current",
    path: "packages/contracts/src/port-fixtures.ts",
    symbols: ["foundationPortContractFixtures", "contractPortContractFixtures", "buildOpenCodeMetadataOverlayDemotionMatrixSnapshot"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-runtime-atoms",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-runtime/src/runtime-atoms.ts",
    symbols: ["runtimeAtomDescriptors", "runtime.module-catalog", "runtime.capability-resolver", "runtime.binding-planner", "runtime.lifecycle-runner", "runtime.assembly-graph"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-runtime-port-fixtures",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-runtime/src/port-fixtures.ts",
    symbols: ["runtimePortContractFixtures", "runtime.module-catalog", "runtime.capability-resolver", "runtime.binding-planner"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-prompt-atoms",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-prompt/src/prompt-atoms.ts",
    symbols: ["promptAtomDescriptors", "opencode.resource.grant-defaults"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-prompt-port-fixtures",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-prompt/src/port-fixtures.ts",
    symbols: ["promptPortContractFixtures", "resource.grant"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-provider-port-fixtures",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-provider/src/port-fixtures.ts",
    symbols: ["providerPortContractFixtures", "provider.cassette"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-agent-loop-port-fixtures",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-agent-loop/src/port-fixtures.ts",
    symbols: ["turnPortContractFixtures", "cadence.emitter", "cadence.projector"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-current-module-audit",
    repo: "helix/local",
    ref: "current",
    path: "packages/recipes/src/current-module-placeholder-audit.ts",
    symbols: ["sourceVerificationStatusForAtom", "pinnedBehaviorStatusForFacts", "metadata-overlay-source"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-executable-port-rules",
    repo: "helix/local",
    ref: "current",
    path: "packages/recipes/src/assembly-contract.ts",
    symbols: ["executableImplementationLevelForAtom", "metadataOverlayFixtureIDs", "knownLossinessForAtom"],
    evidence: "local-source:2026-06-11",
  },
]

const OPENCODE_METADATA_OVERLAY_ATOM_IDS = [
  "opencode.block.compatibility-metadata",
  "opencode.capability.aliases",
  "opencode.conformance.product-gate",
  "opencode.provider.cassette-artifact",
  "opencode.recipe.binding-aliases",
  "opencode.resource.grant-defaults",
  "opencode.runtime.binding-defaults",
  "opencode.runtime.capability-aliases",
  "opencode.runtime.graph-labels",
  "opencode.runtime.lifecycle-defaults",
  "opencode.runtime.module-aliases",
  "opencode.trace.sqlite-part-projection",
  "opencode.turn.cadence-emitter",
] as const

function openCodeMetadataOverlayDemotionBranchAnchor(
  input: OpenCodeMetadataOverlayDemotionBranchAnchor,
): OpenCodeMetadataOverlayDemotionBranchAnchor {
  return input
}

export function buildOpenCodeMetadataOverlayDemotionMatrixSnapshot(): OpenCodeMetadataOverlayDemotionMatrixSnapshot {
  const branchAnchors: OpenCodeMetadataOverlayDemotionBranchAnchor[] = [
    openCodeMetadataOverlayDemotionBranchAnchor({
      branchID: "foundation-alias-overlay",
      status: "partial",
      sourceRefIDs: ["session-service", "local-plugin-atoms", "local-contract-port-fixtures"],
      metadataAtomIDs: ["opencode.block.compatibility-metadata", "opencode.capability.aliases", "opencode.recipe.binding-aliases"],
      metadataPortIDs: ["block.manifest", "capability.ref", "recipe.binding"],
      localEvidenceRefs: ["opencode-metadata:overlay-demotion-matrix"],
      localMarkers: ["block.manifest", "capability.ref", "recipe.binding", "metadata-only-personality-alias"],
      knownGaps: ["opencode-foundation-alias-native-runtime-not-proven"],
    }),
    openCodeMetadataOverlayDemotionBranchAnchor({
      branchID: "product-conformance-gate-overlay",
      status: "partial",
      sourceRefIDs: ["upstream-product-surfaces", "local-plugin-atoms", "local-contract-port-fixtures"],
      metadataAtomIDs: ["opencode.conformance.product-gate"],
      metadataPortIDs: ["conformance.ref"],
      localEvidenceRefs: ["opencode-metadata:overlay-demotion-matrix"],
      localMarkers: ["conformance.ref", "product-gate", "metadata-only-product-boundary"],
      knownGaps: ["opencode-product-conformance-native-gate-not-replayed"],
    }),
    openCodeMetadataOverlayDemotionBranchAnchor({
      branchID: "prompt-resource-grant-overlay",
      status: "partial",
      sourceRefIDs: ["session-prompt", "session-prompt-reference", "local-prompt-atoms", "local-prompt-port-fixtures"],
      metadataAtomIDs: ["opencode.resource.grant-defaults"],
      metadataPortIDs: ["resource.grant"],
      localEvidenceRefs: ["opencode-metadata:overlay-demotion-matrix"],
      localMarkers: ["resource.grant", "referencePromptMetadata", "prompt-resource-defaults", "metadata-only-resource-grant"],
      knownGaps: ["opencode-resource-grant-native-prompt-runtime-not-replayed"],
    }),
    openCodeMetadataOverlayDemotionBranchAnchor({
      branchID: "provider-cassette-overlay",
      status: "partial",
      sourceRefIDs: ["upstream-provider", "local-plugin-atoms", "local-provider-port-fixtures"],
      metadataAtomIDs: ["opencode.provider.cassette-artifact"],
      metadataPortIDs: ["provider.cassette"],
      localEvidenceRefs: ["opencode-metadata:overlay-demotion-matrix"],
      localMarkers: ["provider.cassette", "provider-metadata-artifact", "cassette-artifact:not-runtime-transport"],
      knownGaps: ["opencode-provider-cassette-runtime-io-not-replayed"],
    }),
    openCodeMetadataOverlayDemotionBranchAnchor({
      branchID: "runtime-defaults-overlay",
      status: "partial",
      sourceRefIDs: ["upstream-runtime", "local-runtime-atoms", "local-runtime-port-fixtures"],
      metadataAtomIDs: [
        "opencode.runtime.binding-defaults",
        "opencode.runtime.capability-aliases",
        "opencode.runtime.graph-labels",
        "opencode.runtime.lifecycle-defaults",
        "opencode.runtime.module-aliases",
      ],
      metadataPortIDs: ["runtime.binding-planner", "runtime.capability-resolver", "runtime.assembly-graph", "runtime.lifecycle-runner", "runtime.module-catalog"],
      localEvidenceRefs: ["opencode-metadata:overlay-demotion-matrix"],
      localMarkers: ["runtime-defaults", "runtime-aliases", "runtime-graph-labels", "metadata-only-runtime-overlay"],
      knownGaps: ["opencode-runtime-defaults-native-bootstrap-not-replayed"],
    }),
    openCodeMetadataOverlayDemotionBranchAnchor({
      branchID: "trace-sqlite-projection-overlay",
      status: "partial",
      sourceRefIDs: ["session-message", "session-status", "local-plugin-atoms", "local-agent-loop-port-fixtures"],
      metadataAtomIDs: ["opencode.trace.sqlite-part-projection"],
      metadataPortIDs: ["cadence.projector"],
      localEvidenceRefs: ["opencode-metadata:overlay-demotion-matrix"],
      localMarkers: ["cadence.projector", "sqlite-part-projection", "message-part-shape", "metadata-only-trace-projection"],
      knownGaps: ["opencode-trace-sqlite-native-projection-not-replayed"],
    }),
    openCodeMetadataOverlayDemotionBranchAnchor({
      branchID: "turn-cadence-emitter-overlay",
      status: "partial",
      sourceRefIDs: ["session-processor", "local-agent-loop-port-fixtures"],
      metadataAtomIDs: ["opencode.turn.cadence-emitter"],
      metadataPortIDs: ["cadence.emitter"],
      localEvidenceRefs: ["opencode-metadata:overlay-demotion-matrix"],
      localMarkers: ["cadence.emitter", "session.processor", "metadata-only-cadence-emitter"],
      knownGaps: ["opencode-turn-cadence-native-emitter-not-replayed"],
    }),
    openCodeMetadataOverlayDemotionBranchAnchor({
      branchID: "metadata-executable-negative-guard",
      status: "partial",
      sourceRefIDs: ["local-current-module-audit", "local-executable-port-rules", "local-contract-port-fixtures"],
      metadataAtomIDs: [...OPENCODE_METADATA_OVERLAY_ATOM_IDS],
      metadataPortIDs: [
        "block.manifest",
        "capability.ref",
        "conformance.ref",
        "provider.cassette",
        "recipe.binding",
        "resource.grant",
        "runtime.binding-planner",
        "runtime.capability-resolver",
        "runtime.assembly-graph",
        "runtime.lifecycle-runner",
        "runtime.module-catalog",
        "cadence.projector",
        "cadence.emitter",
      ],
      localEvidenceRefs: ["opencode-metadata:overlay-demotion-matrix"],
      localMarkers: ["metadata-overlay-source", "metadata-only", "not-executable-provider", "demotion-guard-only"],
      knownGaps: ["opencode-metadata-overlay-native-runtime-not-proven", "opencode-metadata-overlay-executable-negative-guard-only"],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-metadata-overlay-demotion-matrix" as const,
    fixtureID: "opencode-metadata:overlay-demotion-matrix" as const,
    sourceRefs: OPENCODE_METADATA_OVERLAY_SOURCE_REFS,
    branchAnchors,
    partialBranchIDs: branchAnchors.map((anchor) => anchor.branchID),
    coveredMetadataAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.metadataAtomIDs)),
    coveredMetadataPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.metadataPortIDs)),
    knownGaps: uniqueStrings([
      "opencode-metadata-overlay-demotion-matrix-covered-by-partial-fixture",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

const productShellPersonalityImplementationKinds = {
  "opencode.product-shell.tui": "factory",
  "pi.product-shell.tui": "factory",
  "pi.product-shell.web-ui": "factory",
  "pi.product-shell.browser-smoke": "factory",
  "pi.product-shell.release-hardening": "factory",
  "nanobot.product-shell.tui": "factory",
  "nanobot.product-shell.web-ui": "factory",
  "hermes.product-shell.tui": "factory",
  "hermes.product-shell.web-dashboard": "factory",
  ...Object.fromEntries([
    "opencode.product-shell.web",
  ].map((id) => [id, "preview"] as const)),
} as const

export const foundationPortContractFixtures: LegoPortContractFixture[] = [
  {
    id: "block.manifest",
    input: "block id, version, type, layer, personality, capability declarations, lifecycle scopes, resources, and conformance refs",
    output: "validated LegoBlockManifest metadata usable by runtime, recipes, docs, package exports, and conformance gates",
    lifecycle: ["process"],
    resources: [],
    conformance: "contracts-schema:block-manifest",
    implementations: ["block.manifest.schema", "block.manifest.normalizer"],
    personalityAtoms: ["opencode.block.compatibility-metadata", "pi.block.compatibility-metadata", "nanobot.block.compatibility-metadata", "hermes.block.compatibility-metadata"],
  },
  {
    id: "capability.ref",
    input: "capability id, version, kind, multiplicity, stability, variant, and optional personality",
    output: "normalized capability reference for provides/requires/optional declarations and binding checks",
    lifecycle: ["process"],
    resources: [],
    conformance: "contracts-schema:capability-ref",
    implementations: ["capability.ref.normalizer"],
    personalityAtoms: ["opencode.capability.aliases", "pi.capability.aliases", "nanobot.capability.aliases", "hermes.capability.aliases"],
  },
  {
    id: "resource.grant",
    input: "resource id, mode, scope, recipe policy, and block resource requirements",
    output: "validated resource grant or diagnostic for filesystem, network, shell, env, sqlite, or extension runtime access",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "contracts-schema:resource-grant",
    implementations: ["resource.grant.validator"],
    personalityAtoms: ["opencode.resource.grant-defaults", "pi.resource.grant-defaults", "nanobot.resource.grant-defaults", "hermes.resource.grant-defaults"],
  },
  {
    id: "recipe.binding",
    input: "recipe port/module binding, candidate providers, multiplicity, scope, and override metadata",
    output: "deterministic binding record for lockfiles, graph views, and ambiguity diagnostics",
    lifecycle: ["process"],
    resources: [],
    conformance: "contracts-schema:recipe-binding",
    implementations: ["recipe.binding.lockfile"],
    personalityAtoms: ["opencode.recipe.binding-aliases", "pi.recipe.binding-aliases", "nanobot.recipe.binding-aliases", "hermes.recipe.binding-aliases"],
  },
  {
    id: "conformance.ref",
    input: "port id, fixture suite id, replay fixture id, package export route, and product recipe gates",
    output: "stable conformance reference proving the block can be tested independently or as a product recipe",
    lifecycle: ["process"],
    resources: [],
    conformance: "contracts-schema:conformance-ref",
    implementations: ["conformance.ref.fixture-registry"],
    personalityAtoms: ["opencode.conformance.product-gate", "pi.conformance.product-gate", "nanobot.conformance.product-gate", "hermes.conformance.product-gate"],
  },
]

export const identityPortContractFixtures: LegoPortContractFixture[] = [
  {
    id: "identity.id-generator",
    input: "id kind, product namespace, deterministic seed, timestamp, and collision policy",
    output: "stable typed id for sessions, messages, parts, tool calls, providers, or workspaces",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "contracts-schema:id-generator",
    implementations: ["identity.id-generator.deterministic", "identity.id-generator.random"],
    personalityAtoms: ["opencode.identity.id-generator", "pi.identity.id-generator", "nanobot.identity.id-generator", "hermes.identity.id-generator"],
    personalityAtomImplementationKinds: {
      "opencode.identity.id-generator": "factory",
    },
  },
  {
    id: "identity.clock",
    input: "clock source, deterministic seed, timezone, monotonicity requirement, and product formatting hint",
    output: "timestamp, monotonic tick, and product-safe serialized time metadata",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "contracts-schema:clock",
    implementations: ["identity.clock.system", "identity.clock.deterministic"],
    personalityAtoms: ["opencode.identity.clock-format", "pi.identity.clock-format", "nanobot.identity.clock-format", "hermes.identity.clock-format"],
    personalityAtomImplementationKinds: {
      "opencode.identity.clock-format": "factory",
    },
  },
  {
    id: "identity.workspace-resolver",
    input: "cwd, config workspace hints, product project metadata, and environment",
    output: "normalized WorkspaceID, root path, display name, and product mapping metadata",
    lifecycle: ["process", "workspace"],
    resources: [{ id: "filesystem", mode: "read", scope: "workspace" }],
    conformance: "contracts-schema:workspace-resolver",
    implementations: ["identity.workspace-resolver.cwd", "identity.workspace-resolver.configured"],
    personalityAtoms: ["opencode.identity.workspace-resolver", "pi.identity.workspace-resolver", "nanobot.identity.workspace-resolver", "hermes.identity.workspace-resolver"],
    personalityAtomImplementationKinds: {
      "opencode.identity.workspace-resolver": "factory",
    },
  },
]

export const eventPortContractFixtures: LegoPortContractFixture[] = [
  {
    id: "event.envelope",
    input: "event type, payload, source, session/workspace/trace ids, timestamp, and metadata",
    output: "normalized EventEnvelope with stable identity, source, trace, payload, and metadata fields",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "contracts-schema:event-envelope",
    implementations: ["event.envelope.common"],
    personalityAtoms: ["opencode.event.envelope-bridge", "pi.event.envelope-bridge", "nanobot.event.envelope-bridge", "hermes.event.envelope-bridge"],
  },
  {
    id: "event.log",
    input: "EventEnvelope append/read/filter requests",
    output: "ordered EventEnvelope records with source, trace, payload, and metadata preserved",
    lifecycle: ["process", "workspace", "session"],
    resources: [],
    conformance: "contracts-schema:event-envelope",
    implementations: ["event.log.memory", "event.log.jsonl", "event.log.projection"],
    personalityAtoms: ["opencode.event.syncevent-bridge", "pi.event.runtime-bridge", "pi.extension.runtime-event-bridge", "nanobot.event.bus-bridge", "hermes.event.runtime-bridge"],
  },
  {
    id: "trace.recorder",
    input: "assembly, provider, tool, hook, turn, or product-surface trace event",
    output: "append-only trace record with redacted metadata and replay-safe diagnostics",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "contracts-schema:trace-recorder",
    implementations: ["trace.recorder.memory", "trace.recorder.jsonl"],
    personalityAtoms: ["opencode.trace.debug-surface", "pi.trace.debug-surface", "nanobot.trace.debug-surface", "hermes.trace.debug-surface"],
  },
]

export const productPortContractFixtures: LegoPortContractFixture[] = [
  {
    id: "product.shell",
    input: "assembled recipe ports, personality adapters, shell entrypoint metadata, and user-facing command or transport request",
    output: "SDK/CLI/TUI/RPC/Web/server/product surface behavior without owning common session, provider, tool, or UI logic",
    lifecycle: ["process", "workspace", "session", "turn"],
    resources: [
      { id: "filesystem", mode: "read", scope: "workspace" },
      { id: "network", mode: "execute", scope: "external" },
    ],
    conformance: "product-shell-surfaces:shell",
    implementations: ["product.shell.minimal-cli"],
    personalityAtoms: [
      "opencode.product-shell.sdk",
      "opencode.product-shell.harness",
      "opencode.product-shell.workspace",
      "opencode.product-shell.control-plane",
      "opencode.product-shell.server",
      "opencode.product-shell.tui",
      "opencode.product-shell.web",
      "opencode.product-shell.desktop",
      "opencode.product-shell.slack",
      "pi.product-shell.sdk",
      "pi.product-shell.harness",
      "pi.product-shell.cli",
      "pi.product-shell.tui",
      "pi.product-shell.rpc",
      "pi.product-shell.web-ui",
      "pi.product-shell.server",
      "pi.product-shell.package-manager",
      "pi.product-shell.extension-examples",
      "pi.product-shell.browser-smoke",
      "pi.product-shell.release-hardening",
      "nanobot.product-shell.sdk",
      "nanobot.product-shell.harness",
      "nanobot.product-shell.cli",
      "nanobot.product-shell.tui",
      "nanobot.product-shell.web-ui",
      "nanobot.product-shell.server",
      "hermes.product-shell.sdk",
      "hermes.product-shell.harness",
      "hermes.product-shell.cli",
      "hermes.product-shell.tui",
      "hermes.product-shell.api-server",
      "hermes.product-shell.acp",
      "hermes.product-shell.gateway",
      "hermes.product-shell.web-dashboard",
    ],
    personalityAtomImplementationKinds: productShellPersonalityImplementationKinds,
  },
]

export const contractPortContractFixtures: LegoPortContractFixture[] = [
  ...foundationPortContractFixtures,
  ...identityPortContractFixtures,
  ...eventPortContractFixtures,
  ...productPortContractFixtures,
]

function identityLiveIDReadback(
  kind: "session" | "message" | "part" | "workspace",
  value: string,
  seed: string | undefined,
  sequence: number,
): OpenCodeIdentityLiveRuntimeFixture["idReadback"][number] {
  return {
    kind,
    value,
    prefix: value.includes("_") ? value.split("_")[0] ?? null : null,
    length: value.length,
    seedProvided: typeof seed === "string" && seed.length > 0,
    sequence,
  }
}

function safeRealpath(path: string): string | null {
  try {
    return realpathSync(path)
  } catch {
    return null
  }
}

function normalizeOpenCodeIdentityLivePath(path: string, input: { cwd: string }): string {
  const absolutePath = resolve(path)
  const cwd = resolve(input.cwd)
  if (absolutePath === cwd) return "<cwd>"
  if (absolutePath.startsWith(`${cwd}${sep}`)) return `<cwd>/${absolutePath.slice(cwd.length + 1).split(sep).join("/")}`
  return absolutePath.split(sep).join("/")
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
