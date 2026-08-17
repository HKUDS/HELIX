import { createHash, randomUUID } from "node:crypto"
import { homedir } from "node:os"
import { join, posix } from "node:path"

export const hermesIdentityUpstreamRef = "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
export const hermesIdentityClockNativeExactAtomID = "hermes.identity.clock-format"
export const hermesIdentityIDGeneratorNativeExactAtomID = "hermes.identity.id-generator"
export const hermesIdentityWorkspaceResolverNativeExactAtomID = "hermes.identity.workspace-resolver"
export const hermesIdentityNativeExactAtomIDs = [
  hermesIdentityClockNativeExactAtomID,
  hermesIdentityIDGeneratorNativeExactAtomID,
  hermesIdentityWorkspaceResolverNativeExactAtomID,
] as const
export const hermesIdentityNativeExactFixtureID = "hermes-identity:native-exact-fixture"
export const hermesIdentityNativeExactEvidenceRef = "conformance:hermes-identity-native-exact-fixture"
export const hermesIdentityNativeExactReplayRef = "identity-native-exact:hermes-agent"

export interface HermesIdentityClockAtom {
  formatUpdatedAt(input: { value: unknown }): string | null
  updatedAtSortKey(input: { value: unknown }): number
}

export interface HermesIdentityIDGeneratorAtom {
  createSessionID(input?: { randomUUID?: string }): string
  forkSessionID(input?: { randomUUID?: string }): string
  buildSessionTitle(input: { title?: unknown; preview?: unknown; cwd?: string | null }): string
  isSessionID(input: { sessionID: string }): boolean
}

export interface HermesIdentityWorkspaceResolverAtom {
  windowsPathToWSL(input: { path: string }): string | null
  translateACPCwd(input: { cwd: string; isWSL?: boolean }): string
  normalizeCwdForCompare(input?: { cwd?: string | null; homeDir?: string }): string
  sameWorkspace(input: { left?: string | null; right?: string | null; homeDir?: string }): boolean
  hermesHome(input?: { envHermesHome?: string | null; homeDir?: string }): string
  stateDBPath(input?: { envHermesHome?: string | null; homeDir?: string }): string
}

export type HermesIdentityNativeScenarioID =
  | "acp-session-uuid-and-title"
  | "updated-at-utc-isoformat-and-sort-key"
  | "wsl-cwd-translation"
  | "cwd-normalization-and-filter-match"
  | "hermes-home-state-db-path"

export interface HermesIdentityNativeExactCase {
  scenarioID: HermesIdentityNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface HermesIdentityNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  atomIDs: typeof hermesIdentityNativeExactAtomIDs
  portIDs: readonly ["identity.clock", "identity.id-generator", "identity.workspace-resolver"]
  upstreamRef: typeof hermesIdentityUpstreamRef
  evidenceRef: typeof hermesIdentityNativeExactEvidenceRef
  fixtureID: typeof hermesIdentityNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    acpSessionIDsUsePythonUUID4String: true
    forkedACPSessionsUseFreshUUID4String: true
    titlesPreferExplicitThenPreviewThenCwdLeaf: true
    updatedAtKeepsNonEmptyStringsAndFormatsNumericEpochUTC: true
    updatedAtSortKeyParsesISOThenNumericFallback: true
    wslTranslatesWindowsDrivePathsToMntDrive: true
    offWslLeavesACPPathsUnchanged: true
    workspaceCompareNormalizesHomeWindowsAndMntDrivePaths: true
    sessionDBLivesUnderHermesHomeStateDB: true
  }
  cases: HermesIdentityNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface HermesIdentityNativeExactIssue {
  id: string
  message: string
}

export interface HermesIdentityNativeExactVerification {
  ok: boolean
  issues: HermesIdentityNativeExactIssue[]
}

export function createHermesIdentityClockAtom(): HermesIdentityClockAtom {
  return {
    formatUpdatedAt(input) {
      return hermesFormatUpdatedAt(input.value)
    },
    updatedAtSortKey(input) {
      return hermesUpdatedAtSortKey(input.value)
    },
  }
}

export function createHermesIdentityIDGeneratorAtom(): HermesIdentityIDGeneratorAtom {
  return {
    createSessionID(input = {}) {
      return input.randomUUID ?? randomUUID()
    },
    forkSessionID(input = {}) {
      return input.randomUUID ?? randomUUID()
    },
    buildSessionTitle(input) {
      return hermesBuildSessionTitle(input.title, input.preview, input.cwd)
    },
    isSessionID(input) {
      return isHermesACPSessionID(input.sessionID)
    },
  }
}

export function createHermesIdentityWorkspaceResolverAtom(): HermesIdentityWorkspaceResolverAtom {
  return {
    windowsPathToWSL(input) {
      return hermesWindowsPathToWSL(input.path)
    },
    translateACPCwd(input) {
      return hermesTranslateACPCwd(input.cwd, input.isWSL ?? false)
    },
    normalizeCwdForCompare(input = {}) {
      return hermesNormalizeCwdForCompare(input.cwd, input.homeDir)
    },
    sameWorkspace(input) {
      return hermesNormalizeCwdForCompare(input.left, input.homeDir) === hermesNormalizeCwdForCompare(input.right, input.homeDir)
    },
    hermesHome(input = {}) {
      return hermesHome(input.envHermesHome, input.homeDir)
    },
    stateDBPath(input = {}) {
      return join(hermesHome(input.envHermesHome, input.homeDir), "state.db")
    },
  }
}

export function hermesFormatUpdatedAt(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "string" && value.trim()) return value
  if (typeof value === "string") return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return formatPythonUTCDateTimeFromEpochSeconds(numeric)
}

export function hermesUpdatedAtSortKey(value: unknown): number {
  if (value === null || value === undefined) return Number.NEGATIVE_INFINITY
  if (typeof value === "number") return value
  const raw = String(value).trim()
  if (!raw) return Number.NEGATIVE_INFINITY
  const parsedISO = parseHermesISODateTimeSeconds(raw)
  if (parsedISO !== null) return parsedISO
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? numeric : Number.NEGATIVE_INFINITY
}

export function hermesWindowsPathToWSL(path: string): string | null {
  const match = /^([A-Za-z]):[\\/](.*)$/.exec(path)
  if (!match) return null
  const drive = match[1]!.toLowerCase()
  const tail = match[2]!.replace(/\\/g, "/")
  return `/mnt/${drive}/${tail}`
}

export function hermesTranslateACPCwd(cwd: string, isWSL: boolean): string {
  if (!isWSL) return cwd
  return hermesWindowsPathToWSL(String(cwd)) ?? cwd
}

export function hermesNormalizeCwdForCompare(cwd: string | null | undefined, homeDir = homedir()): string {
  let raw = String(cwd || ".").trim()
  if (!raw) raw = "."
  let expanded = expandHermesUserPath(raw, homeDir)
  expanded = hermesWindowsPathToWSL(expanded) ?? normalizeMntDriveCase(expanded)
  return posix.normalize(expanded)
}

export function hermesBuildSessionTitle(title: unknown, preview: unknown, cwd: string | null | undefined): string {
  const explicit = String(title || "").trim()
  if (explicit) return explicit
  const previewText = String(preview || "").trim()
  if (previewText) return previewText
  const leaf = String(cwd || "").replace(/[\\/]+$/g, "").split("/").pop() ?? ""
  return leaf || "New thread"
}

export function hermesHome(envHermesHome: string | null | undefined, homeDir = homedir()): string {
  const value = String(envHermesHome ?? "").trim()
  return value || join(homeDir, ".hermes")
}

export function isHermesACPSessionID(sessionID: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(sessionID)
}

function hermesIdentityNativeDescriptor(id: (typeof hermesIdentityNativeExactAtomIDs)[number]) {
  const port =
    id === hermesIdentityClockNativeExactAtomID
      ? "identity.clock"
      : id === hermesIdentityIDGeneratorNativeExactAtomID
        ? "identity.id-generator"
        : "identity.workspace-resolver"
  return {
    id,
    port,
    product: "hermes-agent",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [hermesIdentityNativeExactEvidenceRef, hermesIdentityNativeExactReplayRef],
    fixtureIDs: [hermesIdentityNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Hermes upstream native implementation with native parity complete ACP UUID session identity, updated-at formatting, titles, and cwd workspace normalization fixture coverage.",
  } as const
}

export const hermesIdentityNativeDescriptors = [
  hermesIdentityNativeDescriptor(hermesIdentityClockNativeExactAtomID),
  hermesIdentityNativeDescriptor(hermesIdentityIDGeneratorNativeExactAtomID),
  hermesIdentityNativeDescriptor(hermesIdentityWorkspaceResolverNativeExactAtomID),
] as const

export const hermesIdentityNativeExactDescriptorForID = new Map(
  hermesIdentityNativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export function buildHermesIdentityNativeExactFixture(): HermesIdentityNativeExactFixture {
  const ids = createHermesIdentityIDGeneratorAtom()
  const clock = createHermesIdentityClockAtom()
  const workspace = createHermesIdentityWorkspaceResolverAtom()
  const sessionID = "8f14e45f-ea24-4f6d-9f8f-2d37c6bfe9d1"
  const forkedSessionID = "5bb1a275-792d-40f8-a5d0-e1351f4ad5b8"
  const fixtureWithoutFingerprint: Omit<HermesIdentityNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "hermes-agent" as const,
    atomIDs: [...hermesIdentityNativeExactAtomIDs] as typeof hermesIdentityNativeExactAtomIDs,
    portIDs: ["identity.clock", "identity.id-generator", "identity.workspace-resolver"] as const,
    upstreamRef: hermesIdentityUpstreamRef,
    evidenceRef: hermesIdentityNativeExactEvidenceRef,
    fixtureID: hermesIdentityNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      acpSessionIDsUsePythonUUID4String: true as const,
      forkedACPSessionsUseFreshUUID4String: true as const,
      titlesPreferExplicitThenPreviewThenCwdLeaf: true as const,
      updatedAtKeepsNonEmptyStringsAndFormatsNumericEpochUTC: true as const,
      updatedAtSortKeyParsesISOThenNumericFallback: true as const,
      wslTranslatesWindowsDrivePathsToMntDrive: true as const,
      offWslLeavesACPPathsUnchanged: true as const,
      workspaceCompareNormalizesHomeWindowsAndMntDrivePaths: true as const,
      sessionDBLivesUnderHermesHomeStateDB: true as const,
    },
    cases: [
      {
        scenarioID: "acp-session-uuid-and-title" as const,
        input: {
          sessionUUID: sessionID,
          forkUUID: forkedSessionID,
          title: "  Fix Zed ACP history  ",
          preview: " Investigate broken ACP history in Zed ",
          cwd: "/work/browser-link-3/",
        },
        output: {
          sessionID: ids.createSessionID({ randomUUID: sessionID }),
          forkedSessionID: ids.forkSessionID({ randomUUID: forkedSessionID }),
          sessionIDIsUUID4: ids.isSessionID({ sessionID }),
          explicitTitle: ids.buildSessionTitle({ title: "  Fix Zed ACP history  ", preview: "ignored", cwd: "/work/browser-link-3/" }),
          previewTitle: ids.buildSessionTitle({ title: "", preview: " Investigate broken ACP history in Zed ", cwd: "/work/browser-link-3/" }),
          cwdLeafTitle: ids.buildSessionTitle({ title: "", preview: "", cwd: "/work/browser-link-3/" }),
          emptyTitle: ids.buildSessionTitle({ title: "", preview: "", cwd: "" }),
        },
        upstreamBehavior: "SessionManager.create_session and fork_session use str(uuid.uuid4()) for fresh ACP session IDs. _build_session_title returns stripped explicit title, then stripped preview, then basename(cwd.rstrip('/\\\\')), else 'New thread'.",
      },
      {
        scenarioID: "updated-at-utc-isoformat-and-sort-key" as const,
        input: {
          numericEpoch: 1_700_000_000.123456,
          stringUpdatedAt: "2026-06-13T12:10:42+00:00",
          isoForSort: "2026-06-13T12:10:42Z",
          numericStringForSort: "1700000000",
        },
        output: {
          numericUpdatedAt: clock.formatUpdatedAt({ value: 1_700_000_000.123456 }),
          stringUpdatedAt: clock.formatUpdatedAt({ value: "2026-06-13T12:10:42+00:00" }),
          emptyUpdatedAt: clock.formatUpdatedAt({ value: "" }),
          isoSortKey: clock.updatedAtSortKey({ value: "2026-06-13T12:10:42Z" }),
          numericSortKey: clock.updatedAtSortKey({ value: "1700000000" }),
          missingSortKey: clock.updatedAtSortKey({ value: "" }),
        },
        upstreamBehavior: "_format_updated_at preserves non-empty strings and converts numeric epoch seconds with datetime.fromtimestamp(..., tz=timezone.utc).isoformat(); _updated_at_sort_key parses ISO strings after replacing Z with +00:00, then falls back to float(raw).",
      },
      {
        scenarioID: "wsl-cwd-translation" as const,
        input: {
          backslashWindowsPath: "E:\\Projects\\AI\\paperclip",
          slashWindowsPath: "D:/work/project",
          posixPath: "/mnt/e/Projects/AI/paperclip",
        },
        output: {
          backslashToWSL: workspace.translateACPCwd({ cwd: "E:\\Projects\\AI\\paperclip", isWSL: true }),
          slashToWSL: workspace.translateACPCwd({ cwd: "D:/work/project", isWSL: true }),
          offWSLUnchanged: workspace.translateACPCwd({ cwd: "E:\\Projects\\AI\\paperclip", isWSL: false }),
          posixOnWSLUnchanged: workspace.translateACPCwd({ cwd: "/mnt/e/Projects/AI/paperclip", isWSL: true }),
        },
        upstreamBehavior: "_translate_acp_cwd converts Windows drive cwd strings to /mnt/<drive>/... only when hermes_constants.is_wsl() is true; native POSIX paths and off-WSL Windows paths remain unchanged.",
      },
      {
        scenarioID: "cwd-normalization-and-filter-match" as const,
        input: {
          windowsCwd: "E:\\Projects\\AI\\browser-link-3",
          upperMntCwd: "/mnt/E/Projects/AI/browser-link-3/../browser-link-3",
          tildeCwd: "~/code/../paperclip",
          homeDir: "/home/hermes",
        },
        output: {
          windowsNormalized: workspace.normalizeCwdForCompare({ cwd: "E:\\Projects\\AI\\browser-link-3", homeDir: "/home/hermes" }),
          upperMntNormalized: workspace.normalizeCwdForCompare({ cwd: "/mnt/E/Projects/AI/browser-link-3/../browser-link-3", homeDir: "/home/hermes" }),
          tildeNormalized: workspace.normalizeCwdForCompare({ cwd: "~/code/../paperclip", homeDir: "/home/hermes" }),
          emptyNormalized: workspace.normalizeCwdForCompare({ cwd: "", homeDir: "/home/hermes" }),
          windowsMatchesWsl: workspace.sameWorkspace({
            left: "E:\\Projects\\AI\\browser-link-3",
            right: "/mnt/e/Projects/AI/browser-link-3",
            homeDir: "/home/hermes",
          }),
        },
        upstreamBehavior: "SessionManager.list_sessions filters cwd by _normalize_cwd_for_compare, which strips empty cwd to '.', expands '~', maps Windows drives and uppercase /mnt/<drive>/ to lowercase mount paths, then os.path.normpath() compares the results.",
      },
      {
        scenarioID: "hermes-home-state-db-path" as const,
        input: {
          envHermesHome: "/profiles/research",
          homeDir: "/home/hermes",
        },
        output: {
          defaultHermesHome: workspace.hermesHome({ homeDir: "/home/hermes" }),
          envHermesHome: workspace.hermesHome({ envHermesHome: " /profiles/research ", homeDir: "/home/hermes" }),
          defaultStateDB: workspace.stateDBPath({ homeDir: "/home/hermes" }),
          envStateDB: workspace.stateDBPath({ envHermesHome: "/profiles/research", homeDir: "/home/hermes" }),
        },
        upstreamBehavior: "SessionManager._get_db resolves SessionDB at get_hermes_home() / 'state.db'; get_hermes_home uses a non-empty HERMES_HOME value or falls back to Path.home() / '.hermes'.",
      },
    ],
    sourceRefs: [
      `${hermesIdentityUpstreamRef}:acp_adapter/session.py#_win_path_to_wsl,_translate_acp_cwd,_normalize_cwd_for_compare,_build_session_title,_format_updated_at,_updated_at_sort_key,SessionManager.create_session,SessionManager.fork_session,SessionManager.list_sessions,SessionManager._get_db`,
      `${hermesIdentityUpstreamRef}:hermes_constants.py#get_hermes_home`,
      `${hermesIdentityUpstreamRef}:tests/acp/test_session.py#TestCreateSession,TestWslCwdTranslation,TestPersistence`,
      `${hermesIdentityUpstreamRef}:acp_adapter/server.py#ACPAgentServer.list_sessions`,
    ],
    nativeEvidenceRefs: [...hermesIdentityNativeDescriptors[0].nativeEvidenceRefs],
    fixtureIDs: [...hermesIdentityNativeDescriptors[0].fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyHermesIdentityNativeExactFixture(
  fixture: HermesIdentityNativeExactFixture,
): HermesIdentityNativeExactVerification {
  const canonical = buildHermesIdentityNativeExactFixture()
  const issues: HermesIdentityNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "hermes-identity-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Hermes identity behavior." })
  }
  if (fixture.product !== "hermes-agent" || JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    issues.push({ id: "hermes-identity-native-exact.identity", message: "Fixture must remain scoped to the Hermes identity atoms and ports." })
  }
  if (
    fixture.upstreamRef !== hermesIdentityUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("acp_adapter/session.py#_win_path_to_wsl")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("hermes_constants.py#get_hermes_home")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("tests/acp/test_session.py#TestCreateSession"))
  ) {
    issues.push({ id: "hermes-identity-native-exact.upstream", message: "Fixture must stay pinned to Hermes upstream ACP session, home, and test sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "hermes-identity-native-exact.native-claim", message: "Hermes identity fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || hermesIdentityNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "hermes-identity-native-exact.lossiness", message: "Native exact Hermes identity fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(hermesIdentityNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(hermesIdentityNativeExactReplayRef)) {
    issues.push({ id: "hermes-identity-native-exact.evidence", message: "Hermes identity native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(hermesIdentityNativeExactFixtureID)) {
    issues.push({ id: "hermes-identity-native-exact.fixture", message: "Hermes identity native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "hermes-identity-native-exact.policy", message: "Hermes identity policy drifted from upstream ACP session identity behavior." })
  }
  if (
    JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases) ||
    !fixture.cases.some((item) => item.scenarioID === "acp-session-uuid-and-title") ||
    !fixture.cases.some((item) => item.scenarioID === "wsl-cwd-translation") ||
    !fixture.cases.some((item) => item.scenarioID === "cwd-normalization-and-filter-match")
  ) {
    issues.push({ id: "hermes-identity-native-exact.cases", message: "Hermes identity cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function formatPythonUTCDateTimeFromEpochSeconds(epochSeconds: number): string {
  const totalMicros = Math.round(epochSeconds * 1_000_000)
  const epochMillis = Math.trunc(totalMicros / 1000)
  const date = new Date(epochMillis)
  const micros = positiveModulo(totalMicros, 1_000_000)
  const fraction = micros > 0 ? `.${String(micros).padStart(6, "0")}` : ""
  return `${pad4(date.getUTCFullYear())}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}${fraction}+00:00`
}

function parseHermesISODateTimeSeconds(raw: string): number | null {
  if (!/[T:-]/.test(raw)) return null
  const timestamp = Date.parse(raw.replace(/Z$/, "+00:00"))
  return Number.isFinite(timestamp) ? timestamp / 1000 : null
}

function normalizeMntDriveCase(path: string): string {
  if (!/^\/mnt\/[A-Za-z]\//.test(path)) return path
  return `/mnt/${path[5]!.toLowerCase()}/${path.slice(7)}`
}

function expandHermesUserPath(input: string, homeDir: string): string {
  if (input === "~") return homeDir
  if (input.startsWith("~/")) return join(homeDir, input.slice(2))
  return input
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function pad4(value: number): string {
  return String(value).padStart(4, "0")
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
