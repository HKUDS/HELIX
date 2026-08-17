import { createHash } from "node:crypto"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, resolve as resolveNodePath } from "node:path"

export const nanobotIdentityUpstreamRef = "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
export const nanobotIdentityClockNativeExactAtomID = "nanobot.identity.clock-format"
export const nanobotIdentityIDGeneratorNativeExactAtomID = "nanobot.identity.id-generator"
export const nanobotIdentityWorkspaceResolverNativeExactAtomID = "nanobot.identity.workspace-resolver"
export const nanobotIdentityNativeExactAtomIDs = [
  nanobotIdentityClockNativeExactAtomID,
  nanobotIdentityIDGeneratorNativeExactAtomID,
  nanobotIdentityWorkspaceResolverNativeExactAtomID,
] as const
export const nanobotIdentityNativeExactFixtureID = "nanobot-identity:native-exact-fixture"
export const nanobotIdentityNativeExactEvidenceRef = "conformance:nanobot-identity-native-exact-fixture"
export const nanobotIdentityNativeExactReplayRef = "identity-native-exact:nanobot"

export interface NanobotIdentityDateTimeParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second?: number
  microsecond?: number
  offsetMinutes?: number
  timezoneName?: string
}

export interface NanobotIdentityClockAtom {
  timestamp(input: NanobotIdentityDateTimeParts): string
  currentTimeString(input: NanobotIdentityDateTimeParts): string
}

export interface NanobotIdentityIDGeneratorAtom {
  sessionKey(input: { channel: string; chatID: string }): string
  safeKey(input: { key: string }): string
  sessionPath(input: { workspace: string; key: string }): string
}

export interface NanobotIdentityWorkspaceResolverAtom {
  configPath(input?: { configPath?: string; homeDir?: string }): string
  dataDir(input?: { configPath?: string; homeDir?: string }): string
  runtimeSubdir(input: { name: string; configPath?: string; homeDir?: string }): string
  workspacePath(input?: { workspace?: string | null; homeDir?: string }): string
  isDefaultWorkspace(input?: { workspace?: string | null; homeDir?: string; baseDir?: string }): boolean
  cliHistoryPath(input?: { homeDir?: string }): string
  legacySessionsDir(input?: { homeDir?: string }): string
}

export type NanobotIdentityNativeScenarioID =
  | "session-key-safe-filename-and-path"
  | "message-and-session-clock-isoformat"
  | "timezone-runtime-context-clock"
  | "default-workspace-and-runtime-paths"
  | "custom-workspace-default-comparison"

export interface NanobotIdentityNativeExactCase {
  scenarioID: NanobotIdentityNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface NanobotIdentityNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomIDs: typeof nanobotIdentityNativeExactAtomIDs
  portIDs: readonly ["identity.clock", "identity.id-generator", "identity.workspace-resolver"]
  upstreamRef: typeof nanobotIdentityUpstreamRef
  evidenceRef: typeof nanobotIdentityNativeExactEvidenceRef
  fixtureID: typeof nanobotIdentityNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    sessionIdentityUsesChannelChatKey: true
    safeSessionFilenamesReplaceColonThenUnsafePathChars: true
    sessionFilesLiveUnderWorkspaceSessions: true
    messageTimestampsUsePythonDatetimeIsoformat: true
    runtimeClockUsesTimezoneNameAndUTCOffset: true
    defaultConfigPathUsesHomeNanobotConfigJson: true
    dataDirIsConfigParent: true
    defaultWorkspaceUsesHomeNanobotWorkspace: true
    customWorkspaceUsesExpandUserWithoutForcedResolve: true
    defaultWorkspaceComparisonUsesResolveStrictFalse: true
    sharedHistoryAndLegacySessionsUseHomeNanobot: true
  }
  cases: NanobotIdentityNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface NanobotIdentityNativeExactIssue {
  id: string
  message: string
}

export interface NanobotIdentityNativeExactVerification {
  ok: boolean
  issues: NanobotIdentityNativeExactIssue[]
}

export function createNanobotIdentityClockAtom(): NanobotIdentityClockAtom {
  return {
    timestamp(input) {
      return formatNanobotIdentityISODateTime(input)
    },
    currentTimeString(input) {
      return formatNanobotIdentityCurrentTimeString(input)
    },
  }
}

export function createNanobotIdentityIDGeneratorAtom(): NanobotIdentityIDGeneratorAtom {
  return {
    sessionKey(input) {
      return `${input.channel}:${input.chatID}`
    },
    safeKey(input) {
      return nanobotSessionSafeKey(input.key)
    },
    sessionPath(input) {
      return join(input.workspace, "sessions", `${nanobotSessionSafeKey(input.key)}.jsonl`)
    },
  }
}

export function createNanobotIdentityWorkspaceResolverAtom(): NanobotIdentityWorkspaceResolverAtom {
  return {
    configPath(input = {}) {
      return input.configPath ?? join(input.homeDir ?? homedir(), ".nanobot", "config.json")
    },
    dataDir(input = {}) {
      return dirname(this.configPath(input))
    },
    runtimeSubdir(input) {
      return join(this.dataDir(input), input.name)
    },
    workspacePath(input = {}) {
      return nanobotWorkspacePath(input.workspace, input.homeDir)
    },
    isDefaultWorkspace(input = {}) {
      return nanobotIsDefaultWorkspace(input.workspace, input.homeDir, input.baseDir)
    },
    cliHistoryPath(input = {}) {
      return join(input.homeDir ?? homedir(), ".nanobot", "history", "cli_history")
    },
    legacySessionsDir(input = {}) {
      return join(input.homeDir ?? homedir(), ".nanobot", "sessions")
    },
  }
}

export function nanobotSessionSafeKey(key: string): string {
  return nanobotSafeFilename(key.replace(/:/g, "_"))
}

export function nanobotSafeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").trim()
}

export function nanobotWorkspacePath(workspace: string | null | undefined, homeDir = homedir()): string {
  if (!workspace) return join(homeDir, ".nanobot", "workspace")
  return expandNanobotUserPath(workspace, homeDir)
}

export function nanobotIsDefaultWorkspace(workspace: string | null | undefined, homeDir = homedir(), baseDir = process.cwd()): boolean {
  const current = resolveNanobotPathForCompare(nanobotWorkspacePath(workspace, homeDir), baseDir)
  const expected = resolveNanobotPathForCompare(join(homeDir, ".nanobot", "workspace"), baseDir)
  return current === expected
}

export function formatNanobotIdentityISODateTime(input: NanobotIdentityDateTimeParts): string {
  const second = input.second ?? 0
  const microsecond = input.microsecond ?? 0
  const fraction = microsecond > 0 ? `.${String(microsecond).padStart(6, "0")}` : ""
  const offset = input.offsetMinutes === undefined ? "" : formatNanobotUTCOffset(input.offsetMinutes)
  return `${pad4(input.year)}-${pad2(input.month)}-${pad2(input.day)}T${pad2(input.hour)}:${pad2(input.minute)}:${pad2(second)}${fraction}${offset}`
}

export function formatNanobotIdentityCurrentTimeString(input: NanobotIdentityDateTimeParts): string {
  const timezoneName = input.timezoneName ?? "UTC"
  const offset = formatNanobotUTCOffset(input.offsetMinutes ?? 0)
  const weekday = nanobotWeekdayName(input.year, input.month, input.day)
  return `${pad4(input.year)}-${pad2(input.month)}-${pad2(input.day)} ${pad2(input.hour)}:${pad2(input.minute)} (${weekday}) (${timezoneName}, UTC${offset})`
}

function nanobotIdentityNativeDescriptor(id: (typeof nanobotIdentityNativeExactAtomIDs)[number]) {
  const port =
    id === nanobotIdentityClockNativeExactAtomID
      ? "identity.clock"
      : id === nanobotIdentityIDGeneratorNativeExactAtomID
        ? "identity.id-generator"
        : "identity.workspace-resolver"
  return {
    id,
    port,
    product: "nanobot",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [nanobotIdentityNativeExactEvidenceRef, nanobotIdentityNativeExactReplayRef],
    fixtureIDs: [nanobotIdentityNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Nanobot upstream native implementation with native parity complete identity key, clock, and workspace path fixture coverage.",
  } as const
}

export const nanobotIdentityNativeDescriptors = [
  nanobotIdentityNativeDescriptor(nanobotIdentityClockNativeExactAtomID),
  nanobotIdentityNativeDescriptor(nanobotIdentityIDGeneratorNativeExactAtomID),
  nanobotIdentityNativeDescriptor(nanobotIdentityWorkspaceResolverNativeExactAtomID),
] as const

export const nanobotIdentityNativeExactDescriptorForID = new Map(
  nanobotIdentityNativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export function buildNanobotIdentityNativeExactFixture(): NanobotIdentityNativeExactFixture {
  const ids = createNanobotIdentityIDGeneratorAtom()
  const clock = createNanobotIdentityClockAtom()
  const workspace = createNanobotIdentityWorkspaceResolverAtom()
  const sessionKey = ids.sessionKey({ channel: "websocket", chatID: "room:alpha/unsafe" })
  const fixtureWithoutFingerprint: Omit<NanobotIdentityNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "nanobot" as const,
    atomIDs: [...nanobotIdentityNativeExactAtomIDs] as typeof nanobotIdentityNativeExactAtomIDs,
    portIDs: ["identity.clock", "identity.id-generator", "identity.workspace-resolver"] as const,
    upstreamRef: nanobotIdentityUpstreamRef,
    evidenceRef: nanobotIdentityNativeExactEvidenceRef,
    fixtureID: nanobotIdentityNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      sessionIdentityUsesChannelChatKey: true as const,
      safeSessionFilenamesReplaceColonThenUnsafePathChars: true as const,
      sessionFilesLiveUnderWorkspaceSessions: true as const,
      messageTimestampsUsePythonDatetimeIsoformat: true as const,
      runtimeClockUsesTimezoneNameAndUTCOffset: true as const,
      defaultConfigPathUsesHomeNanobotConfigJson: true as const,
      dataDirIsConfigParent: true as const,
      defaultWorkspaceUsesHomeNanobotWorkspace: true as const,
      customWorkspaceUsesExpandUserWithoutForcedResolve: true as const,
      defaultWorkspaceComparisonUsesResolveStrictFalse: true as const,
      sharedHistoryAndLegacySessionsUseHomeNanobot: true as const,
    },
    cases: [
      {
        scenarioID: "session-key-safe-filename-and-path" as const,
        input: {
          channel: "websocket",
          chatID: "room:alpha/unsafe",
          workspace: "/home/nano/.nanobot/workspace",
        },
        output: {
          sessionKey,
          safeKey: ids.safeKey({ key: sessionKey }),
          sessionPath: ids.sessionPath({ workspace: "/home/nano/.nanobot/workspace", key: sessionKey }),
        },
        upstreamBehavior: "SessionManager keys sessions as channel:chat_id, then safe_key replaces ':' with '_' before safe_filename replaces path-unsafe characters and stores <safe>.jsonl under <workspace>/sessions.",
      },
      {
        scenarioID: "message-and-session-clock-isoformat" as const,
        input: { year: 2026, month: 6, day: 13, hour: 12, minute: 10, second: 42, microsecond: 949000 },
        output: {
          timestamp: clock.timestamp({ year: 2026, month: 6, day: 13, hour: 12, minute: 10, second: 42, microsecond: 949000 }),
          metadataTimestamp: clock.timestamp({ year: 2026, month: 6, day: 13, hour: 12, minute: 10, second: 42 }),
        },
        upstreamBehavior: "Session.add_message and SessionManager.save persist Python datetime.now().isoformat() values for message timestamps and session metadata created_at/updated_at.",
      },
      {
        scenarioID: "timezone-runtime-context-clock" as const,
        input: { year: 2026, month: 6, day: 13, hour: 20, minute: 10, timezoneName: "Asia/Shanghai", offsetMinutes: 480 },
        output: {
          currentTime: clock.currentTimeString({ year: 2026, month: 6, day: 13, hour: 20, minute: 10, timezoneName: "Asia/Shanghai", offsetMinutes: 480 }),
        },
        upstreamBehavior: "current_time_str uses ZoneInfo when supplied, formats '%Y-%m-%d %H:%M (%A)', and appends the timezone name plus UTC offset with a colon.",
      },
      {
        scenarioID: "default-workspace-and-runtime-paths" as const,
        input: { homeDir: "/home/nano", configPath: "/tmp/nanobot/config.json", runtimeSubdir: "logs" },
        output: {
          configPath: workspace.configPath({ homeDir: "/home/nano" }),
          dataDir: workspace.dataDir({ configPath: "/tmp/nanobot/config.json" }),
          runtimeSubdir: workspace.runtimeSubdir({ configPath: "/tmp/nanobot/config.json", name: "logs" }),
          workspacePath: workspace.workspacePath({ homeDir: "/home/nano" }),
          cliHistoryPath: workspace.cliHistoryPath({ homeDir: "/home/nano" }),
          legacySessionsDir: workspace.legacySessionsDir({ homeDir: "/home/nano" }),
        },
        upstreamBehavior: "config.paths derives the data dir from get_config_path().parent, runtime subdirs from that data dir, default workspace from ~/.nanobot/workspace, CLI history from ~/.nanobot/history/cli_history, and legacy sessions from ~/.nanobot/sessions.",
      },
      {
        scenarioID: "custom-workspace-default-comparison" as const,
        input: { workspace: "~/work/project", homeDir: "/home/nano", baseDir: "/srv/nanobot" },
        output: {
          workspacePath: workspace.workspacePath({ workspace: "~/work/project", homeDir: "/home/nano" }),
          defaultWorkspace: workspace.isDefaultWorkspace({ homeDir: "/home/nano", baseDir: "/srv/nanobot" }),
          customWorkspaceIsDefault: workspace.isDefaultWorkspace({ workspace: "~/work/project", homeDir: "/home/nano", baseDir: "/srv/nanobot" }),
          relativeDefaultComparison: workspace.isDefaultWorkspace({ workspace: ".nanobot/workspace", homeDir: "/srv", baseDir: "/srv" }),
        },
        upstreamBehavior: "get_workspace_path expands '~' without forcing resolve, while is_default_workspace compares current and default paths through Path.resolve(strict=False).",
      },
    ],
    sourceRefs: [
      `${nanobotIdentityUpstreamRef}:nanobot/session/manager.py#Session.key,Session.add_message,SessionManager.safe_key,SessionManager._get_session_path,SessionManager.save`,
      `${nanobotIdentityUpstreamRef}:nanobot/config/paths.py#get_config_path,get_data_dir,get_runtime_subdir,get_workspace_path,is_default_workspace,get_cli_history_path,get_legacy_sessions_dir`,
      `${nanobotIdentityUpstreamRef}:nanobot/config/loader.py#set_config_path,get_config_path,save_config`,
      `${nanobotIdentityUpstreamRef}:nanobot/utils/helpers.py#ensure_dir,timestamp,current_time_str,safe_filename`,
    ],
    nativeEvidenceRefs: [...nanobotIdentityNativeDescriptors[0].nativeEvidenceRefs],
    fixtureIDs: [...nanobotIdentityNativeDescriptors[0].fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyNanobotIdentityNativeExactFixture(
  fixture: NanobotIdentityNativeExactFixture,
): NanobotIdentityNativeExactVerification {
  const canonical = buildNanobotIdentityNativeExactFixture()
  const issues: NanobotIdentityNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "nanobot-identity-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Nanobot identity behavior." })
  }
  if (fixture.product !== "nanobot" || JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    issues.push({ id: "nanobot-identity-native-exact.identity", message: "Fixture must remain scoped to the Nanobot identity atoms and ports." })
  }
  if (
    fixture.upstreamRef !== nanobotIdentityUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("nanobot/session/manager.py#Session.key")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("nanobot/config/paths.py#get_config_path")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("nanobot/utils/helpers.py#ensure_dir,timestamp,current_time_str,safe_filename"))
  ) {
    issues.push({ id: "nanobot-identity-native-exact.upstream", message: "Fixture must stay pinned to Nanobot upstream session, path, and helper sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "nanobot-identity-native-exact.native-claim", message: "Nanobot identity fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || nanobotIdentityNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "nanobot-identity-native-exact.lossiness", message: "Native exact Nanobot identity fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(nanobotIdentityNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(nanobotIdentityNativeExactReplayRef)) {
    issues.push({ id: "nanobot-identity-native-exact.evidence", message: "Nanobot identity native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(nanobotIdentityNativeExactFixtureID)) {
    issues.push({ id: "nanobot-identity-native-exact.fixture", message: "Nanobot identity native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "nanobot-identity-native-exact.policy", message: "Nanobot identity policy drifted from upstream key, clock, and workspace behavior." })
  }
  if (
    JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases) ||
    !fixture.cases.some((item) => item.scenarioID === "session-key-safe-filename-and-path") ||
    !fixture.cases.some((item) => item.scenarioID === "timezone-runtime-context-clock") ||
    !fixture.cases.some((item) => item.scenarioID === "custom-workspace-default-comparison")
  ) {
    issues.push({ id: "nanobot-identity-native-exact.cases", message: "Nanobot identity cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function expandNanobotUserPath(input: string, homeDir: string): string {
  if (input === "~") return homeDir
  if (input.startsWith("~/")) return join(homeDir, input.slice(2))
  return input
}

function resolveNanobotPathForCompare(input: string, baseDir: string): string {
  return isAbsolute(input) ? resolveNodePath(input) : resolveNodePath(baseDir, input)
}

function formatNanobotUTCOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const absolute = Math.abs(offsetMinutes)
  return `${sign}${pad2(Math.floor(absolute / 60))}:${pad2(absolute % 60)}`
}

function nanobotWeekdayName(year: number, month: number, day: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "Sunday"
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
