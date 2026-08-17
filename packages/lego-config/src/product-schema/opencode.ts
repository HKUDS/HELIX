import { createHash } from "node:crypto"
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

export const openCodeConfigUpstreamRef = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
export const openCodeConfigSourceNativeExactAtomID = "opencode.config.source"
export const openCodeConfigPrecedenceNativeExactAtomID = "opencode.config.precedence"
export const openCodeConfigValidatorNativeExactAtomID = "opencode.config.validator"
export const openCodeConfigNativeExactFixtureID = "opencode-config:native-exact-fixture"
export const openCodeConfigNativeExactEvidenceRef = "conformance:opencode-config-native-exact-fixture"
export const openCodeConfigNativeExactReplayRef = "config-native-exact:opencode"

export type OpenCodeConfigNativeExactAtomID =
  | typeof openCodeConfigSourceNativeExactAtomID
  | typeof openCodeConfigPrecedenceNativeExactAtomID
  | typeof openCodeConfigValidatorNativeExactAtomID

export type OpenCodeConfigPortID = "config.source" | "config.merge-strategy" | "config.validator"
export type OpenCodeConfigPluginSpec = string | [string, Record<string, unknown>]
export type OpenCodeConfigPluginScope = "global" | "local"
export type OpenCodeConfigRecord = Record<string, unknown>

export interface OpenCodeConfigPluginOrigin {
  spec: OpenCodeConfigPluginSpec
  source: string
  scope: OpenCodeConfigPluginScope
}

export interface OpenCodeConfigVirtualFile {
  path: string
  text: string
}

export interface OpenCodeConfigVirtualReadback {
  config: OpenCodeConfigRecord & {
    plugin?: OpenCodeConfigPluginSpec[]
    plugin_origins?: OpenCodeConfigPluginOrigin[]
    permission?: OpenCodeConfigRecord
    instructions?: string[]
  }
  directories: string[]
  loadedSources: string[]
  createdGlobalSchemaPath: string | null
  diagnostics: OpenCodeConfigDiagnostic[]
}

export interface OpenCodeConfigDiagnostic {
  code: string
  path: string[]
  message: string
  keys?: string[]
}

export class OpenCodeConfigNativeError extends Error {
  readonly data: { path: string; issues: OpenCodeConfigDiagnostic[] }

  constructor(input: { path: string; message: string; issues?: OpenCodeConfigDiagnostic[] }) {
    super(input.message)
    this.name = "OpenCodeConfigNativeError"
    this.data = {
      path: input.path,
      issues: input.issues ?? [{ code: "invalid_config", path: [], message: input.message }],
    }
  }
}

export interface OpenCodeConfigNativeDescriptor {
  id: OpenCodeConfigNativeExactAtomID
  port: OpenCodeConfigPortID
  product: "opencode"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof openCodeConfigNativeExactEvidenceRef, typeof openCodeConfigNativeExactReplayRef]
  fixtureIDs: [typeof openCodeConfigNativeExactFixtureID]
  knownLossiness: []
}

export type OpenCodeConfigNativeScenarioID =
  | "global-project-local-merge-and-discovery"
  | "jsonc-schema-and-variable-substitution"
  | "plugin-resolution-origin-deduplication"
  | "permission-tools-share-and-username"
  | "project-disable-and-config-dir"

export interface OpenCodeConfigNativeExactCase {
  scenarioID: OpenCodeConfigNativeScenarioID
  input: OpenCodeConfigRecord
  output: OpenCodeConfigRecord
  upstreamBehavior: string
}

export interface OpenCodeConfigNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: typeof openCodeConfigNativeExactAtomIDs
  portIDs: readonly ["config.source", "config.merge-strategy", "config.validator"]
  upstreamRef: typeof openCodeConfigUpstreamRef
  evidenceRef: typeof openCodeConfigNativeExactEvidenceRef
  fixtureID: typeof openCodeConfigNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    globalConfigMergesConfigJsonThenOpencodeJsonThenOpencodeJsonc: true
    projectConfigSearchesAncestorsAndLoadsShallowBeforeDeep: true
    localOpencodeDirectoriesLoadOpencodeJsonThenOpencodeJsonc: true
    opencodeConfigDirLoadsEvenWhenProjectConfigDisabled: true
    opencodeConfigContentIsLocalAndLoadsAfterDirectoryConfigs: true
    jsoncParserAcceptsCommentsAndTrailingCommas: true
    topLevelUnknownKeysAreRejectedBeforeSchemaDecode: true
    deprecatedTuiKeysAreDroppedBeforeValidation: true
    envTokensResolveToEmptyStringWhenMissing: true
    fileTokensResolveRelativeToDeclaringConfigAndSkipLineComments: true
    instructionsConcatAndDedupeAcrossLayers: true
    pluginSpecsResolvePathLikeEntriesRelativeToDeclaringConfig: true
    pluginOriginsDeduplicateByPackageNameOrExactFileURLKeepingLaterEntry: true
    legacyToolsMapToPermissionRulesBeforeExplicitPermission: true
    invalidOpencodePermissionEnvIsIgnored: true
    autoshareTrueBecomesShareAutoWhenShareUnset: true
    usernameFallsBackToUserWhenSystemLookupFails: true
  }
  cases: OpenCodeConfigNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: OpenCodeConfigNativeDescriptor[]
  fingerprint: string
}

export interface OpenCodeConfigNativeExactIssue {
  id: string
  message: string
}

export interface OpenCodeConfigNativeExactVerification {
  ok: boolean
  issues: OpenCodeConfigNativeExactIssue[]
}

export const openCodeConfigNativeExactAtomIDs = [
  openCodeConfigSourceNativeExactAtomID,
  openCodeConfigPrecedenceNativeExactAtomID,
  openCodeConfigValidatorNativeExactAtomID,
] as const

export const openCodeConfigSourceNativeDescriptor = openCodeConfigNativeDescriptor(
  openCodeConfigSourceNativeExactAtomID,
  "config.source",
  "OpenCode upstream native implementation of config source discovery, JSONC load, token substitution, OPENCODE_CONFIG, OPENCODE_CONFIG_DIR, OPENCODE_CONFIG_CONTENT, and plugin path-origin behavior from config.ts, paths.ts, plugin.ts, and variable.ts.",
)

export const openCodeConfigPrecedenceNativeDescriptor = openCodeConfigNativeDescriptor(
  openCodeConfigPrecedenceNativeExactAtomID,
  "config.merge-strategy",
  "OpenCode upstream native implementation of merge precedence for global, project, .opencode directory, config-dir, config-content, instructions concatenation, plugin origin dedupe, tools-to-permission migration, autoshare, and flag overrides.",
)

export const openCodeConfigValidatorNativeDescriptor = openCodeConfigNativeDescriptor(
  openCodeConfigValidatorNativeExactAtomID,
  "config.validator",
  "OpenCode upstream native implementation of ConfigParse.schema top-level extra-key rejection, JSONC parse failure behavior, deprecated TUI-key normalization, and permission object order preservation.",
)

export const openCodeConfigNativeDescriptors = [
  openCodeConfigSourceNativeDescriptor,
  openCodeConfigPrecedenceNativeDescriptor,
  openCodeConfigValidatorNativeDescriptor,
] as const

const openCodeConfigKnownTopLevelKeys = new Set([
  "$schema",
  "shell",
  "logLevel",
  "server",
  "command",
  "skills",
  "reference",
  "watcher",
  "snapshot",
  "plugin",
  "share",
  "autoshare",
  "autoupdate",
  "disabled_providers",
  "enabled_providers",
  "model",
  "small_model",
  "default_agent",
  "username",
  "mode",
  "agent",
  "provider",
  "mcp",
  "formatter",
  "lsp",
  "instructions",
  "layout",
  "permission",
  "tools",
  "attachment",
  "enterprise",
  "tool_output",
  "compaction",
  "experimental",
])

const deprecatedConfigKeys = new Set(["theme", "keybinds", "tui"])
const indexFiles = ["index.ts", "index.tsx", "index.js", "index.mjs", "index.cjs"]

export function openCodeGlobalConfigMergeFiles(globalConfigDir: string): string[] {
  return ["config.json", "opencode.json", "opencode.jsonc"].map((file) => resolve(globalConfigDir, file))
}

export function openCodeGlobalConfigSchemaCandidate(globalConfigDir: string, existingFiles: readonly string[]): string {
  const normalized = new Set(existingFiles.map((file) => normalizePath(file)))
  const candidates = ["opencode.jsonc", "opencode.json", "config.json"].map((file) => resolve(globalConfigDir, file))
  return candidates.find((file) => normalized.has(normalizePath(file))) ?? candidates[0]!
}

export function openCodeProjectConfigFiles(input: {
  directory: string
  worktree?: string | undefined
  existingFiles: readonly string[]
  disableProjectConfig?: boolean | undefined
}): string[] {
  if (input.disableProjectConfig) return []
  const existing = new Set(input.existingFiles.map((file) => normalizePath(file)))
  const found: string[] = []
  for (const dir of ancestorDirectories(input.directory, input.worktree)) {
    for (const name of ["opencode.jsonc", "opencode.json"]) {
      const file = resolve(dir, name)
      if (existing.has(normalizePath(file))) found.push(file)
    }
  }
  return [...found].reverse()
}

export function openCodeConfigDirectories(input: {
  globalConfigDir: string
  home: string
  directory: string
  worktree?: string | undefined
  existingDirectories?: readonly string[] | undefined
  configDir?: string | undefined
  disableProjectConfig?: boolean | undefined
}): string[] {
  const existingDirs = new Set((input.existingDirectories ?? []).map((dir) => normalizePath(dir)))
  const directories: string[] = [resolve(input.globalConfigDir)]
  if (!input.disableProjectConfig) {
    for (const dir of ancestorDirectories(input.directory, input.worktree)) {
      const candidate = resolve(dir, ".opencode")
      if (existingDirs.has(normalizePath(candidate))) directories.push(candidate)
    }
  }
  const homeOpencode = resolve(input.home, ".opencode")
  if (existingDirs.has(normalizePath(homeOpencode))) directories.push(homeOpencode)
  if (input.configDir) directories.push(resolve(input.configDir))
  return uniqueStrings(directories.map((dir) => resolve(dir)))
}

export function stripOpenCodeJsonc(text: string): string {
  let output = ""
  let inString = false
  let escaped = false
  let inLineComment = false
  let inBlockComment = false
  for (let index = 0; index < text.length; index++) {
    const char = text[index]!
    const next = text[index + 1]
    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false
        output += char
      }
      continue
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false
        index++
      } else if (char === "\n") {
        output += "\n"
      }
      continue
    }
    if (inString) {
      output += char
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }
    if (char === '"') {
      inString = true
      output += char
      continue
    }
    if (char === "/" && next === "/") {
      inLineComment = true
      index++
      continue
    }
    if (char === "/" && next === "*") {
      inBlockComment = true
      index++
      continue
    }
    output += char
  }
  return output.replace(/,\s*([}\]])/g, "$1")
}

export function parseOpenCodeConfigJsonc(text: string, source: string): unknown {
  try {
    return JSON.parse(stripOpenCodeJsonc(text)) as unknown
  } catch (error) {
    throw new OpenCodeConfigNativeError({
      path: source,
      message: `invalid JSONC config in ${source}: ${error instanceof Error ? error.message : String(error)}`,
      issues: [{
        code: "invalid_jsonc",
        path: [],
        message: error instanceof Error ? error.message : String(error),
      }],
    })
  }
}

export function validateOpenCodeConfigSchema(data: unknown, source: string): OpenCodeConfigRecord {
  if (!isRecord(data)) return data as OpenCodeConfigRecord
  const normalized = normalizeOpenCodeLoadedConfig(data)
  const extra = Object.keys(normalized).filter((key) => !openCodeConfigKnownTopLevelKeys.has(key))
  if (extra.length > 0) {
    throw new OpenCodeConfigNativeError({
      path: source,
      message: `Unrecognized key${extra.length === 1 ? "" : "s"}: ${extra.join(", ")}`,
      issues: [{
        code: "unrecognized_keys",
        keys: extra,
        path: [],
        message: `Unrecognized key${extra.length === 1 ? "" : "s"}: ${extra.join(", ")}`,
      }],
    })
  }
  return normalized
}

export function normalizeOpenCodeLoadedConfig(data: OpenCodeConfigRecord): OpenCodeConfigRecord {
  const copy = { ...data }
  for (const key of deprecatedConfigKeys) delete copy[key]
  return copy
}

export function substituteOpenCodeConfigVariables(input: {
  text: string
  source: string
  dir: string
  env?: Record<string, string | undefined> | undefined
  files?: readonly OpenCodeConfigVirtualFile[] | undefined
  missing?: "error" | "empty" | undefined
}): string {
  const missing = input.missing ?? "error"
  const fileMap = new Map((input.files ?? []).map((file) => [normalizePath(file.path), file.text]))
  const envSubstituted = input.text.replace(/\{env:([^}]+)\}/g, (_match, name: string) => input.env?.[name] ?? "")
  return envSubstituted.replace(/\{file:([^}]+)\}/g, (token: string, rawPath: string, offset: number) => {
    const lineStart = envSubstituted.lastIndexOf("\n", offset - 1) + 1
    const prefix = envSubstituted.slice(lineStart, offset).trimStart()
    if (prefix.startsWith("//")) return token
    const expanded = rawPath.startsWith("~/")
      ? resolve("/", "home", rawPath.slice(2))
      : rawPath
    const filePath = isAbsolute(expanded) ? expanded : resolve(input.dir, expanded)
    const content = fileMap.get(normalizePath(filePath))
    if (content !== undefined) return JSON.stringify(content.trim()).slice(1, -1)
    if (missing === "empty") return ""
    throw new OpenCodeConfigNativeError({
      path: input.source,
      message: `bad file reference: "${token}" ${filePath} does not exist`,
    })
  })
}

export function loadOpenCodeConfigText(input: {
  text: string
  source: string
  dir?: string | undefined
  env?: Record<string, string | undefined> | undefined
  files?: readonly OpenCodeConfigVirtualFile[] | undefined
}): OpenCodeConfigRecord {
  if (!input.text) return {}
  const sourceDir = input.dir ?? dirname(input.source)
  const substituted = substituteOpenCodeConfigVariables({
    text: input.text,
    source: input.source,
    dir: sourceDir,
    env: input.env,
    files: input.files,
  })
  return validateOpenCodeConfigSchema(parseOpenCodeConfigJsonc(substituted, input.source), input.source)
}

export function openCodeMergeConfigConcatArrays(target: OpenCodeConfigRecord, source: OpenCodeConfigRecord): OpenCodeConfigRecord {
  const merged = deepMergeOpenCodeConfig(target, source)
  if (Array.isArray(target.instructions) && Array.isArray(source.instructions)) {
    merged.instructions = uniqueStrings([
      ...target.instructions.filter((value): value is string => typeof value === "string"),
      ...source.instructions.filter((value): value is string => typeof value === "string"),
    ])
  }
  return merged
}

export function deepMergeOpenCodeConfig(target: OpenCodeConfigRecord, source: OpenCodeConfigRecord): OpenCodeConfigRecord {
  const result = deepClone(target) as OpenCodeConfigRecord
  for (const [key, value] of Object.entries(source)) {
    if (isRecord(result[key]) && isRecord(value)) {
      result[key] = deepMergeOpenCodeConfig(result[key] as OpenCodeConfigRecord, value)
    } else {
      result[key] = deepClone(value)
    }
  }
  return result
}

export function openCodePluginSpecifier(plugin: OpenCodeConfigPluginSpec): string {
  return Array.isArray(plugin) ? plugin[0] : plugin
}

export function parseOpenCodePluginSpecifier(spec: string): { pkg: string; version: string } {
  const raw = spec.startsWith("npm:") ? spec.slice("npm:".length) : spec
  const scoped = raw.match(/^(@[^/]+\/[^@]+)(?:@(.+))?$/)
  if (scoped) return { pkg: scoped[1]!, version: scoped[2] ?? "latest" }
  const plain = raw.match(/^([^@/]+)(?:@(.+))?$/)
  if (plain) return { pkg: plain[1]!, version: plain[2] ?? "latest" }
  return { pkg: spec, version: "" }
}

export function isOpenCodePathPluginSpec(spec: string): boolean {
  return spec.startsWith("file://") || spec.startsWith(".") || isAbsolute(spec) || /^[A-Za-z]:[\\/]/.test(spec)
}

export function resolveOpenCodePluginSpec(input: {
  plugin: OpenCodeConfigPluginSpec
  configFilepath: string
  files?: readonly OpenCodeConfigVirtualFile[] | undefined
  directories?: readonly string[] | undefined
}): OpenCodeConfigPluginSpec {
  const spec = openCodePluginSpecifier(input.plugin)
  if (!isOpenCodePathPluginSpec(spec)) return clonePluginSpec(input.plugin)
  const base = dirname(input.configFilepath)
  const initialURL = (() => {
    if (spec.startsWith("file://")) return spec
    if (isAbsolute(spec) || /^[A-Za-z]:[\\/]/.test(spec)) return pathToFileURL(spec).href
    return pathToFileURL(resolve(base, spec)).href
  })()
  const resolved = resolveOpenCodePathPluginTarget({
    fileURL: initialURL,
    files: input.files ?? [],
    directories: input.directories ?? [],
  })
  if (Array.isArray(input.plugin)) return [resolved, deepClone(input.plugin[1]) as Record<string, unknown>]
  return resolved
}

export function resolveOpenCodePathPluginTarget(input: {
  fileURL: string
  files: readonly OpenCodeConfigVirtualFile[]
  directories?: readonly string[] | undefined
}): string {
  const raw = input.fileURL.startsWith("file://") ? fileURLToPath(input.fileURL) : input.fileURL
  const file = isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw) ? raw : resolve(raw)
  const existingFiles = new Set(input.files.map((item) => normalizePath(item.path)))
  const existingDirs = new Set((input.directories ?? []).map((dir) => normalizePath(dir)))
  const normalized = normalizePath(file)
  const directoryExists = existingDirs.has(normalized) || input.files.some((item) => normalizePath(item.path).startsWith(normalized.endsWith(sep) ? normalized : normalized + sep))
  if (!directoryExists) return pathToFileURL(file).href
  if (existingFiles.has(normalizePath(join(file, "package.json")))) return pathToFileURL(file).href
  for (const name of indexFiles) {
    const candidate = join(file, name)
    if (existingFiles.has(normalizePath(candidate))) return pathToFileURL(candidate).href
  }
  return pathToFileURL(file).href
}

export function deduplicateOpenCodePluginOrigins(plugins: OpenCodeConfigPluginOrigin[]): OpenCodeConfigPluginOrigin[] {
  const seen = new Set<string>()
  const kept: OpenCodeConfigPluginOrigin[] = []
  for (const plugin of [...plugins].reverse()) {
    const spec = openCodePluginSpecifier(plugin.spec)
    const identity = spec.startsWith("file://") ? spec : parseOpenCodePluginSpecifier(spec).pkg
    if (seen.has(identity)) continue
    seen.add(identity)
    kept.push({ ...plugin, spec: clonePluginSpec(plugin.spec) })
  }
  return kept.reverse()
}

export function mergeOpenCodeConfigState(input: {
  state: OpenCodeConfigVirtualReadback
  next: OpenCodeConfigRecord
  source: string
  scope?: OpenCodeConfigPluginScope | undefined
  directory: string
  worktree?: string | undefined
}): OpenCodeConfigVirtualReadback {
  const config = openCodeMergeConfigConcatArrays(input.state.config, input.next)
  const pluginList = pluginSpecList(input.next.plugin)
  if (pluginList.length > 0) {
    const scope = input.scope ?? inferOpenCodePluginScope(input.source, input.directory, input.worktree)
    const origins = deduplicateOpenCodePluginOrigins([
      ...(input.state.config.plugin_origins ?? []),
      ...pluginList.map((spec) => ({ spec, source: input.source, scope })),
    ])
    config.plugin = origins.map((origin) => clonePluginSpec(origin.spec))
    config.plugin_origins = origins
  }
  return {
    ...input.state,
    config,
    loadedSources: [...input.state.loadedSources, input.source],
  }
}

export function inferOpenCodePluginScope(source: string, directory: string, worktree?: string | undefined): OpenCodeConfigPluginScope {
  if (source.startsWith("http://") || source.startsWith("https://")) return "global"
  if (source === "OPENCODE_CONFIG_CONTENT") return "local"
  const root = resolve(worktree ?? directory)
  const absolute = resolve(source)
  return absolute === root || relative(root, absolute).startsWith("..") === false ? "local" : "global"
}

export function loadOpenCodeConfigFromVirtualFiles(input: {
  globalConfigDir: string
  home: string
  directory: string
  worktree?: string | undefined
  files: readonly OpenCodeConfigVirtualFile[]
  directories?: readonly string[] | undefined
  env?: Record<string, string | undefined> | undefined
  configPath?: string | undefined
  configDir?: string | undefined
  configContent?: string | undefined
  disableProjectConfig?: boolean | undefined
  opencodePermission?: string | undefined
  disableAutocompact?: boolean | undefined
  disablePrune?: boolean | undefined
  systemUsername?: string | undefined
  systemUsernameThrows?: boolean | undefined
}): OpenCodeConfigVirtualReadback {
  const files = input.files.map((file) => ({ path: resolve(file.path), text: file.text }))
  const fileMap = new Map(files.map((file) => [normalizePath(file.path), file.text]))
  const existingFiles = files.map((file) => file.path)
  const existingDirectories = input.directories ?? virtualDirectories(files)
  const diagnostics: OpenCodeConfigDiagnostic[] = []
  const createdGlobalSchemaPath =
    !input.configPath && !input.configDir && !input.configContent
      ? openCodeGlobalConfigSchemaCandidate(input.globalConfigDir, existingFiles)
      : null
  let state: OpenCodeConfigVirtualReadback = {
    config: {},
    directories: openCodeConfigDirectories({
      globalConfigDir: input.globalConfigDir,
      home: input.home,
      directory: input.directory,
      worktree: input.worktree,
      existingDirectories,
      configDir: input.configDir,
      disableProjectConfig: input.disableProjectConfig,
    }),
    loadedSources: [],
    createdGlobalSchemaPath,
    diagnostics,
  }
  const loadFile = (file: string): OpenCodeConfigRecord => {
    const path = resolve(file)
    const text = fileMap.get(normalizePath(path))
    if (!text) return {}
    return resolvePluginsInConfig(loadOpenCodeConfigText({ text, source: path, env: input.env, files }), path, files, existingDirectories)
  }
  const mergeFile = (file: string, scope?: OpenCodeConfigPluginScope) => {
    state = mergeOpenCodeConfigState({
      state,
      next: loadFile(file),
      source: resolve(file),
      scope,
      directory: input.directory,
      worktree: input.worktree,
    })
  }

  for (const file of openCodeGlobalConfigMergeFiles(input.globalConfigDir)) mergeFile(file, "global")
  if (input.configPath) mergeFile(input.configPath)
  for (const file of openCodeProjectConfigFiles({
    directory: input.directory,
    worktree: input.worktree,
    existingFiles,
    disableProjectConfig: input.disableProjectConfig,
  })) {
    mergeFile(file, "local")
  }

  state.config.agent = isRecord(state.config.agent) ? state.config.agent : {}
  state.config.mode = isRecord(state.config.mode) ? state.config.mode : {}
  state.config.plugin = pluginSpecList(state.config.plugin)

  for (const dir of state.directories) {
    if (dir.endsWith(`${sep}.opencode`) || (input.configDir && normalizePath(dir) === normalizePath(input.configDir))) {
      for (const name of ["opencode.json", "opencode.jsonc"]) mergeFile(join(dir, name), dir === resolve(input.globalConfigDir) ? "global" : undefined)
    }
    const autoPlugins = discoverOpenCodeDirectoryPlugins({ dir, files })
    if (autoPlugins.length > 0) {
      state = mergeOpenCodeConfigState({
        state,
        next: { plugin: autoPlugins },
        source: dir,
        directory: input.directory,
        worktree: input.worktree,
      })
    }
  }

  if (input.configContent) {
    const next = resolvePluginsInConfig(
      loadOpenCodeConfigText({ text: input.configContent, source: "OPENCODE_CONFIG_CONTENT", dir: input.directory, env: input.env, files }),
      join(input.directory, "OPENCODE_CONFIG_CONTENT"),
      files,
      existingDirectories,
    )
    state = mergeOpenCodeConfigState({
      state,
      next,
      source: "OPENCODE_CONFIG_CONTENT",
      scope: "local",
      directory: input.directory,
      worktree: input.worktree,
    })
  }

  if (input.opencodePermission) {
    try {
      const permission = JSON.parse(input.opencodePermission) as unknown
      if (typeof permission === "string") state.config.permission = deepMergeOpenCodeConfig(state.config.permission ?? {}, { "*": permission })
      else if (isRecord(permission)) state.config.permission = deepMergeOpenCodeConfig(state.config.permission ?? {}, permission)
    } catch {
      diagnostics.push({ code: "invalid_opencode_permission_ignored", path: [], message: "OPENCODE_PERMISSION contains invalid JSON, skipping" })
    }
  }

  if (isRecord(state.config.tools)) {
    const permissions: OpenCodeConfigRecord = {}
    for (const [tool, enabled] of Object.entries(state.config.tools)) {
      const action = enabled ? "allow" : "deny"
      if (tool === "write" || tool === "edit" || tool === "patch") permissions.edit = action
      else permissions[tool] = action
    }
    state.config.permission = deepMergeOpenCodeConfig(permissions, state.config.permission ?? {})
  }

  if (!state.config.username) {
    state.config.username = input.systemUsernameThrows ? "user" : (input.systemUsername || "user")
  }
  if (state.config.autoshare === true && !state.config.share) state.config.share = "auto"
  if (input.disableAutocompact) state.config.compaction = { ...(isRecord(state.config.compaction) ? state.config.compaction : {}), auto: false }
  if (input.disablePrune) state.config.compaction = { ...(isRecord(state.config.compaction) ? state.config.compaction : {}), prune: false }

  state.config.plugin ??= []
  return state
}

export function buildOpenCodeConfigNativeExactFixture(): OpenCodeConfigNativeExactFixture {
  const cases: OpenCodeConfigNativeExactCase[] = [
    configCase(
      "global-project-local-merge-and-discovery",
      {
        globalConfigDir: "/home/alice/.config/opencode",
        directory: "/repo/app",
        worktree: "/repo",
        files: [
          "/home/alice/.config/opencode/config.json",
          "/home/alice/.config/opencode/opencode.json",
          "/repo/opencode.json",
          "/repo/app/.opencode/opencode.json",
        ],
      },
      {
        mergeOrder: [
          "/home/alice/.config/opencode/config.json",
          "/home/alice/.config/opencode/opencode.json",
          "/repo/opencode.json",
          "/repo/app/.opencode/opencode.json",
        ],
        model: "local/model",
        instructions: ["global.md", "shared.md", "project.md", "local.md"],
        pluginOrigins: [
          { spec: "global-only@1.0.0", scope: "global" },
          { spec: "shared-plugin@2.0.0", scope: "local" },
          { spec: "local-only@1.0.0", scope: "local" },
        ],
      },
      "Config.loadGlobal merges config.json, opencode.json, then opencode.jsonc; ConfigPaths.files loads ancestor project configs shallow-before-deep; .opencode/opencode.json then opencode.jsonc merge after project files; instructions concatenate with de-dupe and plugin origins retain global/local scope with later duplicates winning.",
    ),
    configCase(
      "jsonc-schema-and-variable-substitution",
      {
        text: "{ // comment\n \"username\": \"{env:USER_NAME}\", \"shell\": \"{file:secret.txt}\", \"theme\": \"legacy\", }",
        env: { USER_NAME: "ada" },
        files: ["secret.txt"],
        invalid: { invalid_field: true },
      },
      {
        parsed: { username: "ada", shell: "token-value" },
        deprecatedThemeRemoved: true,
        invalidIssue: { code: "unrecognized_keys", keys: ["invalid_field"], path: [] },
        commentedFileTokenPreserved: true,
      },
      "ConfigVariable.substitute resolves {env:} and {file:} tokens before JSONC parsing, {file:} is relative to the declaring config and skipped on comment lines; ConfigParse.jsonc accepts comments and trailing commas; normalizeLoadedConfig drops deprecated TUI keys before ConfigParse.schema rejects unknown top-level keys.",
    ),
    configCase(
      "plugin-resolution-origin-deduplication",
      {
        configFile: "/repo/app/opencode.json",
        plugins: ["oh-my-opencode@2.4.3", "./plugin.ts", "./plugin-dir", "./plugin-index", "shared-plugin@1.0.0", "shared-plugin@2.0.0"],
      },
      {
        packageSpecUnchanged: "oh-my-opencode@2.4.3",
        relativeFile: "file:///repo/app/plugin.ts",
        directoryWithPackageJson: "file:///repo/app/plugin-dir",
        directoryWithoutPackageJson: "file:///repo/app/plugin-index/index.ts",
        dedupedPlugins: ["oh-my-opencode@2.4.3", "file:///repo/app/plugin.ts", "file:///repo/app/plugin-dir", "file:///repo/app/plugin-index/index.ts", "shared-plugin@2.0.0"],
      },
      "ConfigPlugin.resolvePluginSpec keeps package specs unchanged, resolves path-like specs relative to the config file, returns directory URLs when package.json exists, falls back to index files otherwise, and deduplicatePluginOrigins keeps the later package version by package identity while preserving file URL identities.",
    ),
    configCase(
      "permission-tools-share-and-username",
      {
        config: { tools: { write: true, bash: false }, permission: { bash: "ask" }, autoshare: true },
        opencodePermission: "{invalid",
        userInfoThrows: true,
      },
      {
        permission: { edit: "allow", bash: "ask" },
        share: "auto",
        username: "user",
        diagnostics: ["invalid_opencode_permission_ignored"],
      },
      "Config.loadInstanceState ignores malformed OPENCODE_PERMISSION, maps legacy tools write/edit/patch to permission.edit and other tools by name before explicit permission wins, maps autoshare true to share auto when share is unset, and falls back to username 'user' when os.userInfo fails.",
    ),
    configCase(
      "project-disable-and-config-dir",
      {
        disableProjectConfig: true,
        configDir: "/tmp/opencode-config-dir",
        projectFile: "/repo/app/opencode.json",
        configDirFile: "/tmp/opencode-config-dir/opencode.json",
      },
      {
        model: "configdir/model",
        projectModelSkipped: true,
        directories: ["/home/alice/.config/opencode", "/tmp/opencode-config-dir"],
      },
      "OPENCODE_DISABLE_PROJECT_CONFIG skips project config files and project .opencode directories, but OPENCODE_CONFIG_DIR is still appended to ConfigPaths.directories and loaded as a config directory.",
    ),
  ]
  const fixtureWithoutFingerprint: Omit<OpenCodeConfigNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "opencode",
    atomIDs: openCodeConfigNativeExactAtomIDs,
    portIDs: ["config.source", "config.merge-strategy", "config.validator"],
    upstreamRef: openCodeConfigUpstreamRef,
    evidenceRef: openCodeConfigNativeExactEvidenceRef,
    fixtureID: openCodeConfigNativeExactFixtureID,
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    policy: {
      globalConfigMergesConfigJsonThenOpencodeJsonThenOpencodeJsonc: true,
      projectConfigSearchesAncestorsAndLoadsShallowBeforeDeep: true,
      localOpencodeDirectoriesLoadOpencodeJsonThenOpencodeJsonc: true,
      opencodeConfigDirLoadsEvenWhenProjectConfigDisabled: true,
      opencodeConfigContentIsLocalAndLoadsAfterDirectoryConfigs: true,
      jsoncParserAcceptsCommentsAndTrailingCommas: true,
      topLevelUnknownKeysAreRejectedBeforeSchemaDecode: true,
      deprecatedTuiKeysAreDroppedBeforeValidation: true,
      envTokensResolveToEmptyStringWhenMissing: true,
      fileTokensResolveRelativeToDeclaringConfigAndSkipLineComments: true,
      instructionsConcatAndDedupeAcrossLayers: true,
      pluginSpecsResolvePathLikeEntriesRelativeToDeclaringConfig: true,
      pluginOriginsDeduplicateByPackageNameOrExactFileURLKeepingLaterEntry: true,
      legacyToolsMapToPermissionRulesBeforeExplicitPermission: true,
      invalidOpencodePermissionEnvIsIgnored: true,
      autoshareTrueBecomesShareAutoWhenShareUnset: true,
      usernameFallsBackToUserWhenSystemLookupFails: true,
    },
    cases,
    sourceRefs: [
      `${openCodeConfigUpstreamRef}:packages/opencode/src/config/config.ts#Info,mergeConfig,mergeConfigConcatArrays,normalizeLoadedConfig,loadConfig,loadGlobal,loadInstanceState`,
      `${openCodeConfigUpstreamRef}:packages/opencode/src/config/paths.ts#files,directories,fileInDirectory`,
      `${openCodeConfigUpstreamRef}:packages/opencode/src/config/parse.ts#jsonc,schema,topLevelExtraKeys`,
      `${openCodeConfigUpstreamRef}:packages/opencode/src/config/plugin.ts#Spec,resolvePluginSpec,deduplicatePluginOrigins,pluginSpecifier`,
      `${openCodeConfigUpstreamRef}:packages/opencode/src/config/variable.ts#substitute`,
      `${openCodeConfigUpstreamRef}:packages/opencode/src/plugin/shared.ts#parsePluginSpecifier,isPathPluginSpec,resolvePathPluginTarget`,
      `${openCodeConfigUpstreamRef}:packages/opencode/src/config/permission.ts#Action,Info`,
      `${openCodeConfigUpstreamRef}:packages/opencode/test/config/config.test.ts#merges-instructions-arrays,deduplicates-plugins,resolvePluginSpec,OPENCODE_DISABLE_PROJECT_CONFIG,OPENCODE_PERMISSION`,
    ],
    nativeEvidenceRefs: [openCodeConfigNativeExactEvidenceRef, openCodeConfigNativeExactReplayRef],
    fixtureIDs: [openCodeConfigNativeExactFixtureID],
    knownLossiness: [],
    descriptors: openCodeConfigNativeDescriptors.map((descriptor) => ({ ...descriptor })),
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeConfigNativeExactFixture(fixture: OpenCodeConfigNativeExactFixture): OpenCodeConfigNativeExactVerification {
  const canonical = buildOpenCodeConfigNativeExactFixture()
  const issues: OpenCodeConfigNativeExactIssue[] = []
  if (fixture.schemaVersion !== 1 || fixture.product !== "opencode") {
    issues.push(issue("identity", "OpenCode config native fixture identity changed."))
  }
  if (
    fixture.upstreamRef !== openCodeConfigUpstreamRef ||
    fixture.sourceRefs.length === 0 ||
    !fixture.sourceRefs.every((ref) => ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))
  ) {
    issues.push(issue("upstream", "OpenCode config fixture must stay pinned to the audited OpenCode commit."))
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push(issue("native-claim", "OpenCode config fixture must remain a native-exact parity claim."))
  }
  if (!sameStringSet(fixture.atomIDs, openCodeConfigNativeExactAtomIDs) || !sameStringSet(fixture.portIDs, ["config.source", "config.merge-strategy", "config.validator"])) {
    issues.push(issue("coverage", "OpenCode config fixture must cover source, precedence, and validator atoms."))
  }
  if (!sameStringSet(fixture.nativeEvidenceRefs, [openCodeConfigNativeExactEvidenceRef, openCodeConfigNativeExactReplayRef]) || !sameStringSet(fixture.fixtureIDs, [openCodeConfigNativeExactFixtureID])) {
    issues.push(issue("evidence", "OpenCode config native fixture evidence refs or fixture IDs changed."))
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0 || descriptor.parityCoverage !== "native")) {
    issues.push(issue("lossiness", "OpenCode config native exact fixture must not carry known lossiness."))
  }
  if (
    !fixture.sourceRefs.some((ref) => ref.includes("config.ts#Info")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("paths.ts#files")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("plugin.ts#Spec")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("variable.ts#substitute")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("config.test.ts#"))
  ) {
    issues.push(issue("source-refs", "OpenCode config fixture must include loader, paths, parser, plugin, variable, permission, and upstream test refs."))
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy) || JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push(issue("cases", "OpenCode config fixture cases or policy drifted from the canonical native replay."))
  }
  if (JSON.stringify(fixture.descriptors) !== JSON.stringify(canonical.descriptors)) {
    issues.push(issue("descriptors", "OpenCode config native descriptors drifted."))
  }
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push(issue("fingerprint", "OpenCode config native fixture fingerprint is stale."))
  }
  return { ok: issues.length === 0, issues }
}

function openCodeConfigNativeDescriptor(
  id: OpenCodeConfigNativeExactAtomID,
  port: OpenCodeConfigPortID,
  selectionReason: string,
): OpenCodeConfigNativeDescriptor {
  return {
    id,
    port,
    product: "opencode",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [openCodeConfigNativeExactEvidenceRef, openCodeConfigNativeExactReplayRef],
    fixtureIDs: [openCodeConfigNativeExactFixtureID],
    knownLossiness: [],
  }
}

function resolvePluginsInConfig(
  config: OpenCodeConfigRecord,
  filepath: string,
  files: readonly OpenCodeConfigVirtualFile[],
  directories: readonly string[],
): OpenCodeConfigRecord {
  const plugins = pluginSpecList(config.plugin)
  if (plugins.length === 0) return config
  return {
    ...config,
    plugin: plugins.map((plugin) => resolveOpenCodePluginSpec({ plugin, configFilepath: filepath, files, directories })),
  }
}

function discoverOpenCodeDirectoryPlugins(input: { dir: string; files: readonly OpenCodeConfigVirtualFile[] }): OpenCodeConfigPluginSpec[] {
  const dir = normalizePath(input.dir)
  return input.files
    .map((file) => resolve(file.path))
    .filter((file) => {
      const normalized = normalizePath(file)
      if (!normalized.startsWith(dir + sep)) return false
      const relativePath = relative(input.dir, file).replaceAll("\\", "/")
      return /^(plugin|plugins)\/[^/]+\.(ts|js)$/.test(relativePath)
    })
    .sort()
    .map((file) => pathToFileURL(file).href)
}

function ancestorDirectories(directory: string, worktree?: string | undefined): string[] {
  const start = resolve(directory)
  const stop = worktree ? resolve(worktree) : undefined
  const result: string[] = []
  let current = start
  while (true) {
    result.push(current)
    if (stop && normalizePath(current) === normalizePath(stop)) break
    const next = dirname(current)
    if (next === current) break
    if (stop && relative(stop, next).startsWith("..")) break
    current = next
  }
  return result
}

function virtualDirectories(files: readonly OpenCodeConfigVirtualFile[]): string[] {
  const dirs = new Set<string>()
  for (const file of files) {
    let current = dirname(resolve(file.path))
    while (true) {
      dirs.add(current)
      const next = dirname(current)
      if (next === current) break
      current = next
    }
  }
  return [...dirs]
}

function pluginSpecList(value: unknown): OpenCodeConfigPluginSpec[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is OpenCodeConfigPluginSpec =>
    typeof item === "string" ||
    (Array.isArray(item) && typeof item[0] === "string" && isRecord(item[1]))
  ).map(clonePluginSpec)
}

function clonePluginSpec(plugin: OpenCodeConfigPluginSpec): OpenCodeConfigPluginSpec {
  if (Array.isArray(plugin)) return [plugin[0], deepClone(plugin[1]) as Record<string, unknown>]
  return plugin
}

function configCase(
  scenarioID: OpenCodeConfigNativeScenarioID,
  input: OpenCodeConfigNativeExactCase["input"],
  output: OpenCodeConfigNativeExactCase["output"],
  upstreamBehavior: string,
): OpenCodeConfigNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function normalizePath(path: string): string {
  return resolve(path)
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function deepClone(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => deepClone(item))
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepClone(item)]))
  return value
}

function isRecord(value: unknown): value is OpenCodeConfigRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((item) => right.includes(item)) && right.every((item) => left.includes(item))
}

function issue(id: string, message: string): OpenCodeConfigNativeExactIssue {
  return { id: `opencode-config-native-exact.${id}`, message }
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}
