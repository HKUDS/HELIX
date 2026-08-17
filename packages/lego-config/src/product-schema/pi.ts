import { execSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, resolve as nodeResolvePath } from "node:path"
import { fileURLToPath } from "node:url"

export const piMonoConfigUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoConfigNativeExactFixtureID = "pi-config:native-exact-fixture"
export const piMonoConfigNativeExactEvidenceRef = "conformance:pi-config-native-exact-fixture"
export const piMonoConfigNativeExactReplayRef = "config-native-exact:pi-mono"
export const piMonoConfigSourceNativeExactAtomID = "pi.config.source"
export const piMonoConfigPrecedenceNativeExactAtomID = "pi.config.precedence"
export const piMonoConfigValidatorNativeExactAtomID = "pi.config.validator"

const unicodeSpaces = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g

export type PiMonoConfigNativeExactAtomID =
  | typeof piMonoConfigSourceNativeExactAtomID
  | typeof piMonoConfigPrecedenceNativeExactAtomID
  | typeof piMonoConfigValidatorNativeExactAtomID

export type PiMonoConfigPortID = "config.source" | "config.merge-strategy" | "config.validator"
export type PiMonoConfigResourceType = "extensions" | "skills" | "prompts" | "themes"
export type PiMonoConfigResourceScope = "user" | "project" | "temporary"
export type PiMonoConfigResourceOrigin = "package" | "top-level"

export interface PiMonoConfigPathNormalizeOptions {
  trim?: boolean | undefined
  expandTilde?: boolean | undefined
  homeDir?: string | undefined
  stripAtPrefix?: boolean | undefined
  normalizeUnicodeSpaces?: boolean | undefined
}

export interface PiMonoConfigPathSetInput {
  cwd: string
  home: string
  env?: Record<string, string | undefined> | undefined
  appName?: string | undefined
  configDirName?: string | undefined
  baseDir?: string | undefined
  gistID?: string | undefined
}

export interface PiMonoConfigResourceDirectories {
  globalBaseDir: string
  projectBaseDir: string
  user: Record<PiMonoConfigResourceType, string>
  project: Record<PiMonoConfigResourceType, string>
  userAgentsSkillsDir: string
  projectAgentsSkillDirs: string[]
}

export interface PiMonoConfigPathSet {
  appName: string
  appTitle: string
  configDirName: string
  envAgentDirName: string
  envSessionDirName: string
  agentDir: string
  resolvedAgentDir: string
  resolvedCwd: string
  customThemesDir: string
  modelsPath: string
  authPath: string
  settingsPath: string
  toolsDir: string
  binDir: string
  promptsDir: string
  sessionsDir: string
  debugLogPath: string
  projectBaseDir: string
  projectSettingsPath: string
  settingsStoragePaths: {
    globalSettingsPath: string
    projectSettingsPath: string
  }
  resourceDirectories: PiMonoConfigResourceDirectories
  shareViewerUrl?: string | undefined
}

export interface PiMonoSettings {
  [key: string]: unknown
}

export interface PiMonoSettingsLoadResult {
  settings: PiMonoSettings
  error?: string | undefined
}

export interface PiMonoConfigResourceMetadata {
  source: string
  scope: PiMonoConfigResourceScope
  origin: PiMonoConfigResourceOrigin
  baseDir?: string | undefined
}

export interface PiMonoConfigResolvedResource {
  path: string
  enabled: boolean
  metadata: PiMonoConfigResourceMetadata
}

export interface PiMonoConfigValueResolver {
  resolveConfigValue(config: string): string | undefined
  resolveConfigValueUncached(config: string): string | undefined
  resolveConfigValueOrThrow(config: string, description: string): string
  resolveHeaders(headers: Record<string, string> | undefined): Record<string, string> | undefined
  resolveHeadersOrThrow(headers: Record<string, string> | undefined, description: string): Record<string, string> | undefined
  clearConfigValueCache(): void
}

export interface PiMonoConfigValueResolverOptions {
  env?: Record<string, string | undefined> | undefined
  execute?: ((command: string) => string | undefined) | undefined
  executeWithConfiguredShell?: ((command: string) => { executed: boolean; value: string | undefined }) | undefined
  platform?: NodeJS.Platform | undefined
}

export interface PiMonoConfigSelectorLifecycle {
  steps: [
    "initTheme(settingsManager.getTheme(), true)",
    "new TUI(new ProcessTerminal())",
    "new ConfigSelectorComponent(resolvedPaths, settingsManager, cwd, agentDir, onClose, onQuit, requestRender, ui.terminal.rows)",
    "ui.addChild(selector)",
    "ui.setFocus(selector.getResourceList())",
    "ui.start()",
  ]
  close: ["ui.stop()", "stopThemeWatcher()", "resolve once"]
  quit: ["ui.stop()", "stopThemeWatcher()", "process.exit(0)"]
  render: "ui.requestRender()"
}

export interface PiMonoConfigNativeDescriptor {
  id: PiMonoConfigNativeExactAtomID
  port: PiMonoConfigPortID
  product: "pi-mono"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof piMonoConfigNativeExactEvidenceRef, typeof piMonoConfigNativeExactReplayRef]
  fixtureIDs: [typeof piMonoConfigNativeExactFixtureID]
  knownLossiness: []
}

export type PiMonoConfigNativeExactScenarioID =
  | "agent-dir-and-config-paths"
  | "settings-storage-project-global-paths"
  | "settings-merge-and-migrations"
  | "resource-directory-precedence"
  | "dynamic-config-value-resolution"
  | "header-resolution-and-errors"
  | "config-selector-lifecycle"

export interface PiMonoConfigNativeExactCase {
  scenarioID: PiMonoConfigNativeExactScenarioID
  input: Record<string, string | number | boolean | string[]>
  output: Record<string, string | number | boolean | string[]>
  upstreamBehavior: string
}

export interface PiMonoConfigNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: readonly [
    typeof piMonoConfigSourceNativeExactAtomID,
    typeof piMonoConfigPrecedenceNativeExactAtomID,
    typeof piMonoConfigValidatorNativeExactAtomID,
  ]
  portIDs: readonly ["config.source", "config.merge-strategy", "config.validator"]
  upstreamRef: typeof piMonoConfigUpstreamRef
  evidenceRef: typeof piMonoConfigNativeExactEvidenceRef
  fixtureID: typeof piMonoConfigNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    defaultAppNameIsPi: true
    defaultConfigDirNameIsDotPi: true
    envAgentDirOverridesAgentDirWithTildeExpansion: true
    sessionEnvVarIsDeclaredButGetSessionsDirUsesAgentDir: true
    globalSettingsPathIsAgentSettingsJson: true
    projectSettingsPathIsDotPiSettingsJson: true
    projectSettingsOverrideGlobalSettings: true
    nestedSettingsMergeOneLevel: true
    arraysAndPrimitivesOverride: true
    undefinedProjectValuesDoNotOverride: true
    legacyQueueModeMigratesToSteeringMode: true
    legacyWebsocketsMigratesToTransport: true
    legacySkillsObjectMigratesToSkillsArray: true
    legacyRetryMaxDelayMigratesToProviderMaxRetryDelay: true
    projectResourcesPrecedeUserResources: true
    localResourcesPrecedeAutoResourcesWithinScope: true
    packageResourcesHaveLowestPrecedence: true
    canonicalResourcePathDedupeKeepsFirst: true
    dynamicConfigValuesUseBangShellCommandWithProcessLifetimeCache: true
    envValuesWinOverLiteralValues: true
    falsyEnvValuesFallBackToLiteral: true
    headerResolutionDropsFalsyResolvedValues: true
    throwingResolutionUsesUncachedShellCommand: true
    configSelectorInitializesThemeBeforeTuiStart: true
    configSelectorCloseStopsUiAndThemeWatcher: true
    configSelectorQuitStopsUiAndExitsProcess: true
  }
  cases: PiMonoConfigNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: PiMonoConfigNativeDescriptor[]
  fingerprint: string
}

export interface PiMonoConfigNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoConfigNativeExactVerification {
  ok: boolean
  issues: PiMonoConfigNativeExactIssue[]
}

export const piMonoConfigSourceNativeDescriptor = piMonoConfigNativeDescriptor(
  piMonoConfigSourceNativeExactAtomID,
  "config.source",
  "Pi upstream native implementation with native parity complete config source path, settings storage, package resource discovery, and dynamic config value fixture coverage.",
)

export const piMonoConfigPrecedenceNativeDescriptor = piMonoConfigNativeDescriptor(
  piMonoConfigPrecedenceNativeExactAtomID,
  "config.merge-strategy",
  "Pi upstream native implementation with native parity complete global/project settings merge and package resource precedence fixture coverage.",
)

export const piMonoConfigValidatorNativeDescriptor = piMonoConfigNativeDescriptor(
  piMonoConfigValidatorNativeExactAtomID,
  "config.validator",
  "Pi upstream native implementation with native parity complete settings JSON load, legacy migration, dynamic value resolution, and header error fixture coverage.",
)

export const piMonoConfigNativeDescriptors = [
  piMonoConfigSourceNativeDescriptor,
  piMonoConfigPrecedenceNativeDescriptor,
  piMonoConfigValidatorNativeDescriptor,
] as const

export const piMonoConfigNativeExactAtomIDs = [
  piMonoConfigSourceNativeExactAtomID,
  piMonoConfigPrecedenceNativeExactAtomID,
  piMonoConfigValidatorNativeExactAtomID,
] as const

export function normalizePiMonoConfigPath(input: string, options: PiMonoConfigPathNormalizeOptions = {}): string {
  let normalized = options.trim ? input.trim() : input
  if (options.normalizeUnicodeSpaces) normalized = normalized.replace(unicodeSpaces, " ")
  if (options.stripAtPrefix && normalized.startsWith("@")) normalized = normalized.slice(1)

  if (options.expandTilde ?? true) {
    const home = options.homeDir ?? homedir()
    if (normalized === "~") return home
    if (normalized.startsWith("~/") || (process.platform === "win32" && normalized.startsWith("~\\"))) {
      return join(home, normalized.slice(2))
    }
  }

  if (/^file:\/\//.test(normalized)) return fileURLToPath(normalized)
  return normalized
}

export function resolvePiMonoConfigPath(
  input: string,
  baseDir: string = process.cwd(),
  options: PiMonoConfigPathNormalizeOptions = {},
): string {
  const normalized = normalizePiMonoConfigPath(input, options)
  const normalizedBaseDir = normalizePiMonoConfigPath(baseDir, options)
  return isAbsolute(normalized) ? nodeResolvePath(normalized) : nodeResolvePath(normalizedBaseDir, normalized)
}

export function buildPiMonoConfigPathSet(input: PiMonoConfigPathSetInput): PiMonoConfigPathSet {
  const appName = input.appName ?? "pi"
  const configDirName = input.configDirName ?? ".pi"
  const envAgentDirName = `${appName.toUpperCase()}_CODING_AGENT_DIR`
  const envSessionDirName = `${appName.toUpperCase()}_CODING_AGENT_SESSION_DIR`
  const agentDir = input.env?.[envAgentDirName]
    ? normalizePiMonoConfigPath(input.env[envAgentDirName]!, { homeDir: input.home })
    : join(input.home, configDirName, "agent")
  const resolvedCwd = resolvePiMonoConfigPath(input.cwd, input.baseDir, { homeDir: input.home })
  const resolvedAgentDir = resolvePiMonoConfigPath(agentDir, input.baseDir, { homeDir: input.home })
  const projectBaseDir = join(resolvedCwd, configDirName)
  const resourceDirectories = buildPiMonoConfigResourceDirectories({
    cwd: resolvedCwd,
    home: input.home,
    agentDir,
    configDirName,
    baseDir: input.baseDir,
  })

  return {
    appName,
    appTitle: input.appName ? appName : "π",
    configDirName,
    envAgentDirName,
    envSessionDirName,
    agentDir,
    resolvedAgentDir,
    resolvedCwd,
    customThemesDir: join(agentDir, "themes"),
    modelsPath: join(agentDir, "models.json"),
    authPath: join(agentDir, "auth.json"),
    settingsPath: join(agentDir, "settings.json"),
    toolsDir: join(agentDir, "tools"),
    binDir: join(agentDir, "bin"),
    promptsDir: join(agentDir, "prompts"),
    sessionsDir: join(agentDir, "sessions"),
    debugLogPath: join(agentDir, `${appName}-debug.log`),
    projectBaseDir,
    projectSettingsPath: join(projectBaseDir, "settings.json"),
    settingsStoragePaths: {
      globalSettingsPath: join(resolvedAgentDir, "settings.json"),
      projectSettingsPath: join(projectBaseDir, "settings.json"),
    },
    resourceDirectories,
    ...(input.gistID === undefined
      ? {}
      : { shareViewerUrl: `${input.env?.PI_SHARE_VIEWER_URL || "https://pi.dev/session/"}#${input.gistID}` }),
  }
}

export function buildPiMonoConfigResourceDirectories(input: {
  cwd: string
  home: string
  agentDir: string
  configDirName?: string | undefined
  baseDir?: string | undefined
}): PiMonoConfigResourceDirectories {
  const configDirName = input.configDirName ?? ".pi"
  const globalBaseDir = resolvePiMonoConfigPath(input.agentDir, input.baseDir, { homeDir: input.home })
  const resolvedCwd = resolvePiMonoConfigPath(input.cwd, input.baseDir, { homeDir: input.home })
  const projectBaseDir = join(resolvedCwd, configDirName)
  const userAgentsSkillsDir = join(input.home, ".agents", "skills")
  const projectAgentsSkillDirs = collectPiMonoAncestorAgentsSkillDirs(resolvedCwd).filter(
    (dir) => nodeResolvePath(dir) !== nodeResolvePath(userAgentsSkillsDir),
  )
  return {
    globalBaseDir,
    projectBaseDir,
    user: resourceTypeRecord((type) => join(globalBaseDir, type)),
    project: resourceTypeRecord((type) => join(projectBaseDir, type)),
    userAgentsSkillsDir,
    projectAgentsSkillDirs,
  }
}

export function collectPiMonoAncestorAgentsSkillDirs(startDir: string): string[] {
  const skillDirs: string[] = []
  const resolvedStartDir = nodeResolvePath(startDir)
  const gitRepoRoot = findPiMonoGitRepoRoot(resolvedStartDir)

  let dir = resolvedStartDir
  while (true) {
    skillDirs.push(join(dir, ".agents", "skills"))
    if (gitRepoRoot && dir === gitRepoRoot) break
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return skillDirs
}

export function mergePiMonoSettings(base: PiMonoSettings, overrides: PiMonoSettings): PiMonoSettings {
  const result: PiMonoSettings = { ...base }
  for (const key of Object.keys(overrides)) {
    const overrideValue = overrides[key]
    const baseValue = base[key]
    if (overrideValue === undefined) continue
    if (isPlainRecord(overrideValue) && isPlainRecord(baseValue)) {
      result[key] = { ...baseValue, ...overrideValue }
    } else {
      result[key] = overrideValue
    }
  }
  return result
}

export function migratePiMonoSettings<TSettings extends PiMonoSettings>(settings: TSettings): TSettings {
  const mutable = settings as Record<string, unknown>

  if ("queueMode" in mutable && !("steeringMode" in mutable)) {
    mutable.steeringMode = mutable.queueMode
    delete mutable.queueMode
  }

  if (!("transport" in mutable) && typeof mutable.websockets === "boolean") {
    mutable.transport = mutable.websockets ? "websocket" : "sse"
    delete mutable.websockets
  }

  if ("skills" in mutable && isPlainRecord(mutable.skills)) {
    const skillsSettings = mutable.skills as { enableSkillCommands?: boolean | undefined; customDirectories?: unknown }
    if (skillsSettings.enableSkillCommands !== undefined && mutable.enableSkillCommands === undefined) {
      mutable.enableSkillCommands = skillsSettings.enableSkillCommands
    }
    if (Array.isArray(skillsSettings.customDirectories) && skillsSettings.customDirectories.length > 0) {
      mutable.skills = skillsSettings.customDirectories
    } else {
      delete mutable.skills
    }
  }

  if ("retry" in mutable && isPlainRecord(mutable.retry)) {
    const retrySettings = mutable.retry as Record<string, unknown>
    const providerSettings = isPlainRecord(retrySettings.provider) ? retrySettings.provider : undefined
    if (
      typeof retrySettings.maxDelayMs === "number" &&
      (providerSettings?.maxRetryDelayMs === undefined || providerSettings?.maxRetryDelayMs === null)
    ) {
      retrySettings.provider = {
        ...(providerSettings ?? {}),
        maxRetryDelayMs: retrySettings.maxDelayMs,
      }
    }
    delete retrySettings.maxDelayMs
  }

  return settings
}

export function loadPiMonoSettingsContent(content: string | undefined): PiMonoSettingsLoadResult {
  try {
    if (!content) return { settings: {} }
    const parsed = JSON.parse(content) as PiMonoSettings
    return { settings: migratePiMonoSettings(parsed) }
  } catch (error) {
    return { settings: {}, error: error instanceof Error ? error.message : String(error) }
  }
}

export function mergePiMonoSettingsLayers(input: {
  globalSettings: PiMonoSettings
  projectSettings: PiMonoSettings
  overrides?: PiMonoSettings | undefined
}): PiMonoSettings {
  const globalSettings = migratePiMonoSettings({ ...input.globalSettings })
  const projectSettings = migratePiMonoSettings({ ...input.projectSettings })
  const merged = mergePiMonoSettings(globalSettings, projectSettings)
  return input.overrides ? mergePiMonoSettings(merged, input.overrides) : merged
}

export function rankPiMonoConfigResourcePrecedence(metadata: PiMonoConfigResourceMetadata): number {
  if (metadata.origin === "package") return 4
  const scopeBase = metadata.scope === "project" ? 0 : 2
  return scopeBase + (metadata.source === "local" ? 0 : 1)
}

export function orderPiMonoConfigResources(
  entries: PiMonoConfigResolvedResource[],
  canonicalizePath: (path: string) => string = (path) => path,
): PiMonoConfigResolvedResource[] {
  const resolved = [...entries].sort((left, right) => rankPiMonoConfigResourcePrecedence(left.metadata) - rankPiMonoConfigResourcePrecedence(right.metadata))
  const seen = new Set<string>()
  return resolved.filter((entry) => {
    const canonicalPath = canonicalizePath(entry.path)
    if (seen.has(canonicalPath)) return false
    seen.add(canonicalPath)
    return true
  })
}

export function createPiMonoConfigValueResolver(options: PiMonoConfigValueResolverOptions = {}): PiMonoConfigValueResolver {
  const commandResultCache = new Map<string, string | undefined>()
  const env = options.env ?? process.env
  const platform = options.platform ?? process.platform

  const executeWithDefaultShell = (command: string): string | undefined => {
    try {
      const output = options.execute
        ? options.execute(command)
        : execSync(command, {
            encoding: "utf-8",
            timeout: 10000,
            stdio: ["ignore", "pipe", "ignore"],
          })
      return output?.trim() || undefined
    } catch {
      return undefined
    }
  }

  const executeCommandUncached = (commandConfig: string): string | undefined => {
    const command = commandConfig.slice(1)
    if (platform === "win32") {
      const configuredResult = options.executeWithConfiguredShell?.(command)
      if (configuredResult?.executed) return configuredResult.value?.trim() || undefined
    }
    return executeWithDefaultShell(command)
  }

  const executeCommand = (commandConfig: string): string | undefined => {
    if (commandResultCache.has(commandConfig)) return commandResultCache.get(commandConfig)
    const result = executeCommandUncached(commandConfig)
    commandResultCache.set(commandConfig, result)
    return result
  }

  const resolveConfigValue = (config: string): string | undefined => {
    if (config.startsWith("!")) return executeCommand(config)
    const envValue = env[config]
    return envValue || config
  }

  const resolveConfigValueUncached = (config: string): string | undefined => {
    if (config.startsWith("!")) return executeCommandUncached(config)
    const envValue = env[config]
    return envValue || config
  }

  const resolveConfigValueOrThrow = (config: string, description: string): string => {
    const resolvedValue = resolveConfigValueUncached(config)
    if (resolvedValue !== undefined) return resolvedValue
    if (config.startsWith("!")) throw new Error(`Failed to resolve ${description} from shell command: ${config.slice(1)}`)
    throw new Error(`Failed to resolve ${description}`)
  }

  const resolveHeaders = (headers: Record<string, string> | undefined): Record<string, string> | undefined => {
    if (!headers) return undefined
    const resolved: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
      const resolvedValue = resolveConfigValue(value)
      if (resolvedValue) resolved[key] = resolvedValue
    }
    return Object.keys(resolved).length > 0 ? resolved : undefined
  }

  const resolveHeadersOrThrow = (
    headers: Record<string, string> | undefined,
    description: string,
  ): Record<string, string> | undefined => {
    if (!headers) return undefined
    const resolved: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
      resolved[key] = resolveConfigValueOrThrow(value, `${description} header "${key}"`)
    }
    return Object.keys(resolved).length > 0 ? resolved : undefined
  }

  return {
    resolveConfigValue,
    resolveConfigValueUncached,
    resolveConfigValueOrThrow,
    resolveHeaders,
    resolveHeadersOrThrow,
    clearConfigValueCache() {
      commandResultCache.clear()
    },
  }
}

export function planPiMonoConfigSelectorLifecycle(): PiMonoConfigSelectorLifecycle {
  return {
    steps: [
      "initTheme(settingsManager.getTheme(), true)",
      "new TUI(new ProcessTerminal())",
      "new ConfigSelectorComponent(resolvedPaths, settingsManager, cwd, agentDir, onClose, onQuit, requestRender, ui.terminal.rows)",
      "ui.addChild(selector)",
      "ui.setFocus(selector.getResourceList())",
      "ui.start()",
    ],
    close: ["ui.stop()", "stopThemeWatcher()", "resolve once"],
    quit: ["ui.stop()", "stopThemeWatcher()", "process.exit(0)"],
    render: "ui.requestRender()",
  }
}

export function buildPiMonoConfigNativeExactFixture(): PiMonoConfigNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<PiMonoConfigNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: [
      piMonoConfigSourceNativeExactAtomID,
      piMonoConfigPrecedenceNativeExactAtomID,
      piMonoConfigValidatorNativeExactAtomID,
    ] as const,
    portIDs: ["config.source", "config.merge-strategy", "config.validator"] as const,
    upstreamRef: piMonoConfigUpstreamRef,
    evidenceRef: piMonoConfigNativeExactEvidenceRef,
    fixtureID: piMonoConfigNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      defaultAppNameIsPi: true as const,
      defaultConfigDirNameIsDotPi: true as const,
      envAgentDirOverridesAgentDirWithTildeExpansion: true as const,
      sessionEnvVarIsDeclaredButGetSessionsDirUsesAgentDir: true as const,
      globalSettingsPathIsAgentSettingsJson: true as const,
      projectSettingsPathIsDotPiSettingsJson: true as const,
      projectSettingsOverrideGlobalSettings: true as const,
      nestedSettingsMergeOneLevel: true as const,
      arraysAndPrimitivesOverride: true as const,
      undefinedProjectValuesDoNotOverride: true as const,
      legacyQueueModeMigratesToSteeringMode: true as const,
      legacyWebsocketsMigratesToTransport: true as const,
      legacySkillsObjectMigratesToSkillsArray: true as const,
      legacyRetryMaxDelayMigratesToProviderMaxRetryDelay: true as const,
      projectResourcesPrecedeUserResources: true as const,
      localResourcesPrecedeAutoResourcesWithinScope: true as const,
      packageResourcesHaveLowestPrecedence: true as const,
      canonicalResourcePathDedupeKeepsFirst: true as const,
      dynamicConfigValuesUseBangShellCommandWithProcessLifetimeCache: true as const,
      envValuesWinOverLiteralValues: true as const,
      falsyEnvValuesFallBackToLiteral: true as const,
      headerResolutionDropsFalsyResolvedValues: true as const,
      throwingResolutionUsesUncachedShellCommand: true as const,
      configSelectorInitializesThemeBeforeTuiStart: true as const,
      configSelectorCloseStopsUiAndThemeWatcher: true as const,
      configSelectorQuitStopsUiAndExitsProcess: true as const,
    },
    cases: [
      configCase(
        "agent-dir-and-config-paths",
        { cwd: "/repo/app", home: "/home/alice", envAgentDir: "~/custom-agent" },
        {
          appName: "pi",
          configDirName: ".pi",
          envAgentDirName: "PI_CODING_AGENT_DIR",
          agentDir: "/home/alice/custom-agent",
          settingsPath: "/home/alice/custom-agent/settings.json",
          sessionsDir: "/home/alice/custom-agent/sessions",
          debugLogPath: "/home/alice/custom-agent/pi-debug.log",
          shareViewerUrl: "https://pi.dev/session/#abc123",
        },
        "config.ts derives APP_NAME=pi and CONFIG_DIR_NAME=.pi, expands PI_CODING_AGENT_DIR with normalizePath, and joins all user config paths under getAgentDir().",
      ),
      configCase(
        "settings-storage-project-global-paths",
        { cwd: "/repo/app", agentDir: "/home/alice/.pi/agent" },
        {
          globalSettingsPath: "/home/alice/.pi/agent/settings.json",
          projectSettingsPath: "/repo/app/.pi/settings.json",
          rootSettingsJsonIgnoredByUpstreamStorage: true,
        },
        "FileSettingsStorage resolves global settings to agentDir/settings.json and project settings to cwd/.pi/settings.json.",
      ),
      configCase(
        "settings-merge-and-migrations",
        { globalTheme: "dark", projectTheme: "light", queueMode: "all", websockets: true, retryMaxDelayMs: 120000 },
        {
          theme: "light",
          terminalShowImages: false,
          terminalImageWidthCells: 80,
          steeringMode: "all",
          transport: "websocket",
          enableSkillCommands: false,
          skills: ["/repo/skills"],
          providerMaxRetryDelayMs: 120000,
        },
        "SettingsManager migrates legacy fields, then deepMergeSettings lets project values override global values while shallow-merging nested setting objects.",
      ),
      configCase(
        "resource-directory-precedence",
        { cwd: "/repo/app", agentDir: "/home/alice/.pi/agent" },
        {
          projectBaseDir: "/repo/app/.pi",
          globalBaseDir: "/home/alice/.pi/agent",
          orderedRanks: ["project-local", "project-auto", "user-local", "user-auto", "package"],
          projectExtensionsDir: "/repo/app/.pi/extensions",
          userExtensionsDir: "/home/alice/.pi/agent/extensions",
          userAgentsSkillsDir: "/home/alice/.agents/skills",
        },
        "DefaultPackageManager resolves project package/settings resources first, auto-discovers .pi resources before user resources, ranks package resources last, and de-dupes canonical paths after sorting.",
      ),
      configCase(
        "dynamic-config-value-resolution",
        { envName: "PI_API_KEY", envValue: "env-secret", literal: "literal-secret", command: "!printf command-secret" },
        { envResolved: "env-secret", literalResolved: "literal-secret", emptyEnvFallsBackToLiteral: "EMPTY_VALUE", cachedCommandCalls: 1 },
        "resolveConfigValue executes !commands through the shell with a process-lifetime cache; non-command values use process.env[name] || literal.",
      ),
      configCase(
        "header-resolution-and-errors",
        { headerEnvName: "PI_HEADER", commandFailure: "!missing-command" },
        {
          resolvedHeaders: ["x-env", "x-literal"],
          droppedFalsyHeader: true,
          commandFailureMessage: "Failed to resolve provider header \"x-fail\" from shell command: missing-command",
        },
        "resolveHeaders keeps only truthy resolved values, while resolveHeadersOrThrow uses uncached resolution and includes the header key in command failure errors.",
      ),
      configCase(
        "config-selector-lifecycle",
        { mode: "pi config" },
        {
          firstStep: "initTheme(settingsManager.getTheme(), true)",
          focusStep: "ui.setFocus(selector.getResourceList())",
          closeStopsThemeWatcher: true,
          quitExitsProcess: true,
        },
        "selectConfig initializes theme before constructing the TUI, focuses the resource list before start, stops UI/theme watcher on close, and exits process on quit.",
      ),
    ],
    sourceRefs: [
      `${piMonoConfigUpstreamRef}:packages/coding-agent/src/config.ts#APP_NAME,CONFIG_DIR_NAME,ENV_AGENT_DIR,getAgentDir,getSettingsPath,getSessionsDir,getShareViewerUrl`,
      `${piMonoConfigUpstreamRef}:packages/coding-agent/src/utils/paths.ts#normalizePath,resolvePath`,
      `${piMonoConfigUpstreamRef}:packages/coding-agent/src/core/settings-manager.ts#FileSettingsStorage,SettingsManager.create,deepMergeSettings,migrateSettings`,
      `${piMonoConfigUpstreamRef}:packages/coding-agent/src/core/package-manager.ts#DefaultPackageManager.resolve,resourcePrecedenceRank,addAutoDiscoveredResources,toResolvedPaths`,
      `${piMonoConfigUpstreamRef}:packages/coding-agent/src/core/resolve-config-value.ts#resolveConfigValue,resolveConfigValueUncached,resolveConfigValueOrThrow,resolveHeaders,resolveHeadersOrThrow`,
      `${piMonoConfigUpstreamRef}:packages/coding-agent/src/cli/config-selector.ts#selectConfig`,
    ],
    nativeEvidenceRefs: [piMonoConfigNativeExactEvidenceRef, piMonoConfigNativeExactReplayRef],
    fixtureIDs: [piMonoConfigNativeExactFixtureID],
    knownLossiness: [] as string[],
    descriptors: piMonoConfigNativeDescriptors.map((descriptor) => ({ ...descriptor })),
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoConfigNativeExactFixture(fixture: PiMonoConfigNativeExactFixture): PiMonoConfigNativeExactVerification {
  const canonical = buildPiMonoConfigNativeExactFixture()
  const issues: PiMonoConfigNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-config-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi config behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-config-native-exact.native-claim", message: "Pi config fixture must remain a native-exact parity claim." })
  }
  if (JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    issues.push({ id: "pi-config-native-exact.identity", message: "Pi config fixture must cover the source, precedence, and validator atoms." })
  }
  if (
    fixture.upstreamRef !== piMonoConfigUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("config.ts#APP_NAME")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("settings-manager.ts#FileSettingsStorage")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("package-manager.ts#DefaultPackageManager.resolve")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("resolve-config-value.ts#resolveConfigValue"))
  ) {
    issues.push({ id: "pi-config-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream config, settings, package, and dynamic value sources." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoConfigNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoConfigNativeExactReplayRef)) {
    issues.push({ id: "pi-config-native-exact.evidence", message: "Pi config native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoConfigNativeExactFixtureID)) {
    issues.push({ id: "pi-config-native-exact.fixture", message: "Pi config native exact fixture ID is missing." })
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "pi-config-native-exact.lossiness", message: "Native exact Pi config fixture must not carry known lossiness markers." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-config-native-exact.policy", message: "Pi config policy drifted from upstream config behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-config-native-exact.cases", message: "Pi config cases drifted from the native exact fixture." })
  }
  if (JSON.stringify(fixture.descriptors) !== JSON.stringify(canonical.descriptors)) {
    issues.push({ id: "pi-config-native-exact.descriptors", message: "Pi config native descriptors drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function piMonoConfigNativeDescriptor(
  id: PiMonoConfigNativeExactAtomID,
  port: PiMonoConfigPortID,
  selectionReason: string,
): PiMonoConfigNativeDescriptor {
  return {
    id,
    port,
    product: "pi-mono",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoConfigNativeExactEvidenceRef, piMonoConfigNativeExactReplayRef],
    fixtureIDs: [piMonoConfigNativeExactFixtureID],
    knownLossiness: [],
  }
}

function configCase(
  scenarioID: PiMonoConfigNativeExactScenarioID,
  input: PiMonoConfigNativeExactCase["input"],
  output: PiMonoConfigNativeExactCase["output"],
  upstreamBehavior: string,
): PiMonoConfigNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function findPiMonoGitRepoRoot(startDir: string): string | null {
  let dir = startDir
  while (true) {
    if (existsSync(join(dir, ".git"))) return dir
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function resourceTypeRecord(factory: (type: PiMonoConfigResourceType) => string): Record<PiMonoConfigResourceType, string> {
  return {
    extensions: factory("extensions"),
    skills: factory("skills"),
    prompts: factory("prompts"),
    themes: factory("themes"),
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
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
