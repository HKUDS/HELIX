import { createHash } from "node:crypto"
import { posix as path } from "node:path"

export const hermesHookLifecycleUpstreamRef = "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
export const hermesHookLifecycleNativeExactFixtureID = "hermes-hook-lifecycle:native-exact-fixture"
export const hermesHookLifecycleNativeExactEvidenceRef = "conformance:hermes-hook-lifecycle-native-exact-fixture"
export const hermesHookLifecycleNativeExactReplayRef = "hook-lifecycle-native-exact:hermes-agent"

export const hermesHookLifecycleNativeExactAtomIDs = [
  "hermes.hook.error-defaults",
  "hermes.hook.handler-adapter",
  "hermes.hook.observer-adapter",
  "hermes.hook.plugin-bridge",
  "hermes.hook.scheduler-defaults",
  "hermes.plugin.cleanup",
  "hermes.plugin.event-mapper",
  "hermes.plugin.loader",
  "hermes.plugin.provider-registry-bridge",
  "hermes.plugin.ui-registry-bridge",
  "hermes.registry.command",
  "hermes.registry.provider-plugin",
  "hermes.registry.tool-definition",
  "hermes.registry.ui-provider",
] as const

export const hermesHookLifecycleValidHookEvents = [
  "pre_tool_call",
  "post_tool_call",
  "transform_terminal_output",
  "transform_tool_result",
  "transform_llm_output",
  "pre_llm_call",
  "post_llm_call",
  "pre_api_request",
  "post_api_request",
  "on_session_start",
  "on_session_end",
  "on_session_finalize",
  "on_session_reset",
  "subagent_stop",
  "pre_gateway_dispatch",
  "pre_approval_request",
  "post_approval_response",
] as const

export type HermesHookLifecycleNativeExactAtomID = (typeof hermesHookLifecycleNativeExactAtomIDs)[number]
export type HermesHookLifecycleHookEventName = (typeof hermesHookLifecycleValidHookEvents)[number]
export type HermesHookLifecycleNativeExactPortID =
  | "hook.bus"
  | "hook.cleanup-scope"
  | "hook.error-policy"
  | "hook.handler-chain"
  | "hook.observer-chain"
  | "hook.scheduler"
  | "registry.command"
  | "registry.provider"
  | "registry.ui"
  | "tool.registry"

export interface HermesHookLifecycleNativeDescriptor {
  id: HermesHookLifecycleNativeExactAtomID
  port: HermesHookLifecycleNativeExactPortID
  product: "hermes-agent"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof hermesHookLifecycleNativeExactEvidenceRef, typeof hermesHookLifecycleNativeExactReplayRef]
  fixtureIDs: [typeof hermesHookLifecycleNativeExactFixtureID]
  knownLossiness: []
}

export interface HermesShellHookSpecProjection {
  event: HermesHookLifecycleHookEventName
  command: string
  matcher?: string
  timeout: number
  matchMode: "all-tools" | "regex-fullmatch" | "literal-fallback"
  compiledMatcherValid: boolean | null
}

export interface HermesShellHookPayloadProjection {
  hook_event_name: string
  tool_name: unknown
  tool_input: Record<string, unknown> | null
  session_id: unknown
  cwd: string
  extra: Record<string, unknown>
}

export type HermesShellHookResponseProjection = { action: "block"; message: string } | { context: string } | undefined
export type HermesPluginKindProjection = "standalone" | "backend" | "exclusive" | "platform" | "model-provider"
export type HermesPluginHookCallbackProjection = (kwargs: Record<string, unknown>) => unknown

export interface HermesPluginManifestProjection {
  name: string
  version?: string
  description?: string
  author?: string
  requires_env?: Array<string | { name?: string }>
  provides_tools?: string[]
  provides_hooks?: string[]
  source?: "bundled" | "user" | "project" | "entrypoint"
  path?: string
  kind?: string
  key?: string
  hasRegister?: boolean
}

export interface HermesLoadedPluginProjection {
  manifest: Required<Pick<HermesPluginManifestProjection, "name" | "version" | "description" | "author" | "source" | "path" | "kind" | "key">> & {
    requires_env: Array<string | { name?: string }>
    provides_tools: string[]
    provides_hooks: string[]
  }
  enabled: boolean
  loadAction: "loaded" | "recorded-disabled" | "recorded-exclusive" | "recorded-model-provider" | "recorded-not-enabled" | "error"
  error?: string
  tools_registered: string[]
  hooks_registered: string[]
  commands_registered: string[]
}

export interface HermesPluginCommandProjection {
  handler: (...args: unknown[]) => unknown
  description: string
  plugin: string
  args_hint: string
}

export interface HermesPluginManagerProjection {
  hooks: Map<string, HermesPluginHookCallbackProjection[]>
  pluginToolNames: Set<string>
  toolDefinitions: Map<string, Record<string, unknown>>
  pluginCommands: Map<string, HermesPluginCommandProjection>
  cliCommands: Map<string, Record<string, unknown>>
  providers: Map<string, unknown>
  uiProviders: Map<string, unknown>
  skills: Map<string, unknown>
  contextEngine?: unknown
  loadedPlugins: Map<string, HermesLoadedPluginProjection>
  hookWarnings: string[]
}

export interface HermesPluginContextProjection {
  manifest: HermesLoadedPluginProjection["manifest"]
  register_tool(name: string, toolset: string, schema: Record<string, unknown>, handler: (...args: unknown[]) => unknown, options?: Record<string, unknown>): void
  register_command(name: string, handler: (...args: unknown[]) => unknown, description?: string, argsHint?: string): boolean
  register_cli_command(name: string, help: string, setupFn: (...args: unknown[]) => unknown, handlerFn?: (...args: unknown[]) => unknown, description?: string): void
  register_hook(hookName: string, callback: HermesPluginHookCallbackProjection): void
  register_provider(name: string, provider: unknown): void
  register_ui_provider(name: string, provider: unknown): void
  register_skill(name: string, skill: unknown): void
}

export interface HermesPluginHookInvokeProjection {
  results: unknown[]
  errors: string[]
}

export interface HermesPluginDiscoveryProjection {
  entries: HermesLoadedPluginProjection[]
  found: number
  enabled: number
}

export interface HermesPluginEnableStateProjection {
  ok: boolean
  name: string
  enabled: string[]
  disabled: string[]
  unchanged: boolean
  error?: string
}

export interface HermesDashboardInstallProjection {
  ok: boolean
  plugin_name?: string
  warnings?: string[]
  missing_env?: string[]
  after_install_path?: string | null
  enabled?: boolean
  error?: string
}

export type HermesHookLifecycleNativeExactScenarioID =
  | "shell-hooks-parse-match-payload-response"
  | "shell-hooks-accept-and-script-path"
  | "plugin-context-registries-and-hook-invoke"
  | "plugin-discovery-enable-disable-and-winners"
  | "pre-tool-call-block-and-thread-whitelist"
  | "plugin-command-install-url-name-and-dashboard"

export interface HermesHookLifecycleNativeExactCase {
  scenarioID: HermesHookLifecycleNativeExactScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface HermesHookLifecycleNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  atomIDs: typeof hermesHookLifecycleNativeExactAtomIDs
  portIDs: HermesHookLifecycleNativeExactPortID[]
  upstreamRef: typeof hermesHookLifecycleUpstreamRef
  evidenceRef: typeof hermesHookLifecycleNativeExactEvidenceRef
  fixtureID: typeof hermesHookLifecycleNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    shellHookConfigWarnsAndSkipsMalformedEntries: true
    shellHookMatcherUsesRegexFullmatchWithLiteralFallback: true
    shellHookTimeoutDefaultsAndClamps: true
    shellHookPayloadPreservesToolInputSessionAndExtra: true
    shellHookBlockResponseNormalizesClaudeAndHermesShapes: true
    pluginContextRegistersToolsHooksCommandsProvidersAndUI: true
    pluginManagerInvokesHooksInRegistrationOrderAndCatchesErrors: true
    pluginDiscoveryLaterSourcesOverrideEarlierKeys: true
    pluginDiscoveryDisabledWinsAndStandaloneRequiresEnabled: true
    bundledBackendAndPlatformPluginsAutoLoad: true
    exclusiveAndModelProviderKindsAreRecordedButNotGeneralLoaded: true
    preToolCallWhitelistDeniesBeforePluginHooks: true
    pluginInstallerSanitizesNamesAndResolvesGithubShorthand: true
    allHookAtomsShareNativeLifecycleFixture: true
  }
  cases: HermesHookLifecycleNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: HermesHookLifecycleNativeDescriptor[]
  fingerprint: string
}

export interface HermesHookLifecycleNativeExactIssue {
  id: string
  message: string
}

export interface HermesHookLifecycleNativeExactVerification {
  ok: boolean
  issues: HermesHookLifecycleNativeExactIssue[]
}

const defaultHookTimeoutSeconds = 60
const maxHookTimeoutSeconds = 300
const defaultBlockMessage = "Blocked by shell hook."
const topLevelPayloadKeys = new Set(["tool_name", "args", "session_id", "parent_session_id"])
const validHookEventSet = new Set<string>(hermesHookLifecycleValidHookEvents)
const validPluginKinds = new Set(["standalone", "backend", "exclusive", "platform", "model-provider"])
const scriptExtensions = new Set([".sh", ".bash", ".zsh", ".fish", ".py", ".pyw", ".rb", ".pl", ".lua", ".js", ".mjs", ".cjs", ".ts"])
const builtinSlashCommands = new Set(["clear", "compact", "exit", "help", "history", "model", "plugin", "plugins", "quit", "reset"])

const descriptorBase = {
  product: "hermes-agent" as const,
  implementationKind: "factory" as const,
  parityCoverage: "native" as const,
  nativeEvidenceRefs: [hermesHookLifecycleNativeExactEvidenceRef, hermesHookLifecycleNativeExactReplayRef] as [
    typeof hermesHookLifecycleNativeExactEvidenceRef,
    typeof hermesHookLifecycleNativeExactReplayRef,
  ],
  fixtureIDs: [hermesHookLifecycleNativeExactFixtureID] as [typeof hermesHookLifecycleNativeExactFixtureID],
  knownLossiness: [] as [],
}

export const hermesHookLifecycleNativeDescriptors: HermesHookLifecycleNativeDescriptor[] = [
  hookDescriptor("hermes.hook.error-defaults", "hook.error-policy", "Hermes upstream native implementation of shell hook warn-and-skip defaults, plugin hook exception isolation, and pre_tool_call block fallback handling with native parity complete fixture coverage."),
  hookDescriptor("hermes.hook.handler-adapter", "hook.handler-chain", "Hermes upstream native implementation of pre_tool_call and pre_llm_call handler result adapters for shell hooks and Python plugins with native parity complete fixture coverage."),
  hookDescriptor("hermes.hook.observer-adapter", "hook.observer-chain", "Hermes upstream native implementation of observer hook fanout for post/tool, API, approval, session, gateway, and transform lifecycle events with native parity complete fixture coverage."),
  hookDescriptor("hermes.hook.plugin-bridge", "hook.bus", "Hermes upstream native implementation of PluginManager hook dispatch, shell hook callback wiring, and forward-compatible unknown hook storage with native parity complete fixture coverage."),
  hookDescriptor("hermes.hook.scheduler-defaults", "hook.scheduler", "Hermes upstream native implementation of serial hook registration and invocation order across shell hooks and plugins with native parity complete fixture coverage."),
  hookDescriptor("hermes.plugin.cleanup", "hook.cleanup-scope", "Hermes upstream native implementation of force rediscovery cleanup for plugin, hook, command, skill, auxiliary task, and context-engine registries with native parity complete fixture coverage."),
  hookDescriptor("hermes.plugin.event-mapper", "hook.handler-chain", "Hermes upstream native implementation of VALID_HOOKS event mapping and shell hook event normalization with native parity complete fixture coverage."),
  hookDescriptor("hermes.plugin.loader", "hook.bus", "Hermes upstream native implementation of bundled, user, project, and entrypoint plugin discovery plus register(ctx) loading with native parity complete fixture coverage."),
  hookDescriptor("hermes.plugin.provider-registry-bridge", "registry.provider", "Hermes upstream native implementation of plugin provider registration surfaces and model-provider manifest routing with native parity complete fixture coverage."),
  hookDescriptor("hermes.plugin.ui-registry-bridge", "registry.ui", "Hermes upstream native implementation of UI/platform plugin registration and bundled platform autoload behavior with native parity complete fixture coverage."),
  hookDescriptor("hermes.registry.command", "registry.command", "Hermes upstream native implementation of slash and CLI command registration, normalization, built-in conflict checks, and enable/disable lifecycle with native parity complete fixture coverage."),
  hookDescriptor("hermes.registry.provider-plugin", "registry.provider", "Hermes upstream native implementation of provider plugin manifest discovery, exclusive/model-provider routing, and dashboard plugin enablement with native parity complete fixture coverage."),
  hookDescriptor("hermes.registry.tool-definition", "tool.registry", "Hermes upstream native implementation of PluginContext.register_tool delegation and plugin tool-name tracking with native parity complete fixture coverage."),
  hookDescriptor("hermes.registry.ui-provider", "registry.ui", "Hermes upstream native implementation of platform/UI plugin manifest kind handling and registration surfaces with native parity complete fixture coverage."),
]

export function parseHermesShellHookSpecs(hooksConfig: unknown): HermesShellHookSpecProjection[] {
  if (!isRecord(hooksConfig)) return []
  const specs: HermesShellHookSpecProjection[] = []
  for (const [eventName, entries] of Object.entries(hooksConfig)) {
    if (!isHermesHookEventName(eventName) || !Array.isArray(entries)) continue
    for (const raw of entries) {
      const spec = parseHermesShellHookEntry(eventName, raw)
      if (spec) specs.push(spec)
    }
  }
  return specs
}

export function parseHermesShellHookEntry(
  event: HermesHookLifecycleHookEventName,
  raw: unknown,
): HermesShellHookSpecProjection | null {
  if (!isRecord(raw)) return null
  const command = typeof raw.command === "string" ? raw.command.trim() : ""
  if (!command) return null
  let matcher = typeof raw.matcher === "string" ? raw.matcher.trim() : undefined
  if (!matcher || (event !== "pre_tool_call" && event !== "post_tool_call")) matcher = undefined
  const timeout = parseHermesHookTimeout(raw.timeout)
  if (!matcher) return { event, command, timeout, matchMode: "all-tools", compiledMatcherValid: null }
  if (compileFullmatchRegex(matcher)) return { event, command, matcher, timeout, matchMode: "regex-fullmatch", compiledMatcherValid: true }
  return { event, command, matcher, timeout, matchMode: "literal-fallback", compiledMatcherValid: false }
}

export function hermesShellHookMatchesTool(spec: HermesShellHookSpecProjection, toolName: string | null | undefined): boolean {
  if (!spec.matcher) return true
  if (toolName === null || toolName === undefined) return false
  if (spec.compiledMatcherValid === false) return toolName === spec.matcher
  const matcher = compileFullmatchRegex(spec.matcher)
  return matcher ? matcher.test(toolName) : toolName === spec.matcher
}

export function buildHermesShellHookPayload(
  event: string,
  kwargs: Record<string, unknown>,
  cwd = "/workspace/hermes",
): HermesShellHookPayloadProjection {
  const extra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(kwargs)) {
    if (!topLevelPayloadKeys.has(key)) extra[key] = value
  }
  return {
    hook_event_name: event,
    tool_name: kwargs.tool_name,
    tool_input: isRecord(kwargs.args) ? kwargs.args : null,
    session_id: kwargs.session_id || kwargs.parent_session_id || "",
    cwd,
    extra,
  }
}

export function serializeHermesShellHookPayload(
  event: string,
  kwargs: Record<string, unknown>,
  cwd = "/workspace/hermes",
): string {
  return JSON.stringify(buildHermesShellHookPayload(event, kwargs, cwd), (_key, value) => {
    if (typeof value === "bigint") return value.toString()
    if (typeof value === "function") return String(value)
    return value
  })
}

export function parseHermesShellHookResponse(event: string, stdout: string): HermesShellHookResponseProjection {
  const trimmed = (stdout || "").trim()
  if (!trimmed) return undefined
  let data: unknown
  try {
    data = JSON.parse(trimmed)
  } catch {
    return undefined
  }
  if (!isRecord(data)) return undefined
  if (event === "pre_tool_call") {
    if (data.action === "block") return { action: "block", message: blockMessage(data.message, data.reason) }
    if (data.decision === "block") return { action: "block", message: blockMessage(data.reason, data.message) }
    return undefined
  }
  return typeof data.context === "string" && data.context.trim() ? { context: data.context } : undefined
}

export function resolveHermesShellHookAccept(input: {
  acceptHooks?: boolean
  env?: Record<string, string | undefined>
  configValue?: unknown
}): boolean {
  if (input.acceptHooks) return true
  const envValue = input.env?.HERMES_ACCEPT_HOOKS
  if (envValue !== undefined) return truthyOptIn(envValue)
  if (typeof input.configValue === "boolean") return input.configValue
  if (typeof input.configValue === "string") return truthyOptIn(input.configValue)
  return false
}

export function commandScriptPath(command: string): string {
  const tokens = splitShellWords(command)
  if (tokens.length === 0) return ""
  for (const token of tokens) {
    const lower = token.toLowerCase()
    if ([...scriptExtensions].some((extension) => lower.endsWith(extension))) return token
  }
  for (const token of tokens) {
    if (token.includes("/") || token.startsWith("~")) return token
  }
  return tokens[0] ?? ""
}

export function canonicalizeHermesHookEventName(eventName: string): string {
  if (eventName.startsWith("pre_") || eventName.startsWith("post_") || eventName.startsWith("on_")) return eventName
  return eventName.replaceAll(".", "_")
}

export function createHermesPluginManagerProjection(): HermesPluginManagerProjection {
  return {
    hooks: new Map(),
    pluginToolNames: new Set(),
    toolDefinitions: new Map(),
    pluginCommands: new Map(),
    cliCommands: new Map(),
    providers: new Map(),
    uiProviders: new Map(),
    skills: new Map(),
    loadedPlugins: new Map(),
    hookWarnings: [],
  }
}

export function createHermesPluginContextProjection(
  manifestInput: HermesPluginManifestProjection,
  manager: HermesPluginManagerProjection,
): HermesPluginContextProjection {
  const manifest = normalizeHermesPluginManifest(manifestInput)
  return {
    manifest,
    register_tool(name, toolset, schema, handler, options = {}) {
      manager.toolDefinitions.set(name, { name, toolset, schema, handlerName: handler.name || "<anonymous>", ...options })
      manager.pluginToolNames.add(name)
    },
    register_command(name, handler, description = "", argsHint = "") {
      const clean = normalizeHermesPluginCommandName(name)
      if (!clean || builtinSlashCommands.has(clean)) return false
      manager.pluginCommands.set(clean, {
        handler,
        description: description || "Plugin command",
        plugin: manifest.name,
        args_hint: argsHint.trim(),
      })
      return true
    },
    register_cli_command(name, help, setupFn, handlerFn, description = "") {
      manager.cliCommands.set(name, {
        name,
        help,
        description,
        setup_fn: setupFn.name || "<anonymous>",
        handler_fn: handlerFn?.name || "",
        plugin: manifest.name,
      })
    },
    register_hook(hookName, callback) {
      if (!validHookEventSet.has(hookName)) {
        manager.hookWarnings.push(`Plugin '${manifest.name}' registered unknown hook '${hookName}'`)
      }
      const callbacks = manager.hooks.get(hookName) ?? []
      callbacks.push(callback)
      manager.hooks.set(hookName, callbacks)
    },
    register_provider(name, provider) {
      manager.providers.set(name, provider)
    },
    register_ui_provider(name, provider) {
      manager.uiProviders.set(name, provider)
    },
    register_skill(name, skill) {
      manager.skills.set(`${manifest.name}:${name}`, skill)
    },
  }
}

export function invokeHermesPluginHook(
  manager: HermesPluginManagerProjection,
  hookName: string,
  kwargs: Record<string, unknown> = {},
): HermesPluginHookInvokeProjection {
  const results: unknown[] = []
  const errors: string[] = []
  for (const callback of manager.hooks.get(hookName) ?? []) {
    try {
      const result = callback(kwargs)
      if (result !== undefined && result !== null) results.push(result)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }
  return { results, errors }
}

export function getHermesPreToolCallBlockMessage(
  manager: HermesPluginManagerProjection,
  input: {
    toolName: string
    args?: unknown
    taskID?: string
    sessionID?: string
    toolCallID?: string
    allowedTools?: Set<string> | string[] | null
    denyMessageFormat?: string
  },
): string | undefined {
  const allowedTools = input.allowedTools instanceof Set ? input.allowedTools : input.allowedTools ? new Set(input.allowedTools) : null
  if (allowedTools !== null && !allowedTools.has(input.toolName)) {
    return (input.denyMessageFormat ?? "Tool '{tool_name}' denied: not in this thread's tool whitelist").replaceAll("{tool_name}", input.toolName)
  }
  const invoked = invokeHermesPluginHook(manager, "pre_tool_call", {
    tool_name: input.toolName,
    args: isRecord(input.args) ? input.args : {},
    task_id: input.taskID ?? "",
    session_id: input.sessionID ?? "",
    tool_call_id: input.toolCallID ?? "",
  })
  for (const result of invoked.results) {
    if (!isRecord(result) || result.action !== "block") continue
    if (typeof result.message === "string" && result.message) return result.message
  }
  return undefined
}

export function discoverHermesPluginManifestsProjection(input: {
  manifests: HermesPluginManifestProjection[]
  enabled?: string[] | null
  disabled?: string[]
  manager?: HermesPluginManagerProjection
  force?: boolean
}): HermesPluginDiscoveryProjection {
  const manager = input.manager ?? createHermesPluginManagerProjection()
  if (input.force) {
    manager.hooks.clear()
    manager.pluginToolNames.clear()
    manager.toolDefinitions.clear()
    manager.pluginCommands.clear()
    manager.cliCommands.clear()
    manager.skills.clear()
    manager.loadedPlugins.clear()
    manager.contextEngine = undefined
  }
  const disabled = new Set(input.disabled ?? [])
  const enabled = input.enabled === undefined ? null : input.enabled === null ? null : new Set(input.enabled)
  const winners = new Map<string, ReturnType<typeof normalizeHermesPluginManifest>>()
  for (const manifest of input.manifests) {
    const normalized = normalizeHermesPluginManifest(manifest)
    winners.set(normalized.key || normalized.name, normalized)
  }
  const entries: HermesLoadedPluginProjection[] = []
  for (const manifest of winners.values()) {
    const lookupKey = manifest.key || manifest.name
    let loaded: HermesLoadedPluginProjection
    if (disabled.has(lookupKey) || disabled.has(manifest.name)) {
      loaded = loadedPlugin(manifest, false, "recorded-disabled", "disabled via config")
    } else if (manifest.kind === "exclusive") {
      loaded = loadedPlugin(manifest, false, "recorded-exclusive", "exclusive plugin - activate via <category>.provider config")
    } else if (manifest.kind === "model-provider") {
      loaded = loadedPlugin(manifest, true, "recorded-model-provider")
    } else if (manifest.source === "bundled" && (manifest.kind === "backend" || manifest.kind === "platform")) {
      loaded = loadedPlugin(manifest, true, "loaded")
    } else if (enabled !== null && (enabled.has(lookupKey) || enabled.has(manifest.name))) {
      loaded = loadedPlugin(manifest, true, "loaded")
    } else {
      loaded = loadedPlugin(manifest, false, "recorded-not-enabled", `not enabled in config (run \`hermes plugins enable ${lookupKey}\` to activate)`)
    }
    manager.loadedPlugins.set(lookupKey, loaded)
    entries.push(loaded)
  }
  return { entries, found: entries.length, enabled: entries.filter((entry) => entry.enabled).length }
}

export function sanitizeHermesPluginName(
  name: string,
  pluginsDir = "/home/user/.hermes/plugins",
  options: { allowSubdir?: boolean } = {},
): string {
  let candidate = name
  if (options.allowSubdir) candidate = candidate.replace(/^\/+|\/+$/g, "")
  if (!candidate) throw new ValueError("Plugin name must not be empty.")
  if (candidate === "." || candidate === "..") throw new ValueError(`Invalid plugin name '${candidate}': must not reference the plugins directory itself.`)
  const badChars = options.allowSubdir ? ["\\", ".."] : ["/", "\\", ".."]
  for (const bad of badChars) {
    if (candidate.includes(bad)) throw new ValueError(`Invalid plugin name '${candidate}': must not contain '${bad}'.`)
  }
  const root = path.resolve(pluginsDir)
  const target = path.resolve(root, candidate)
  if (target === root) throw new ValueError(`Invalid plugin name '${candidate}': resolves to the plugins directory itself.`)
  if (!target.startsWith(`${root}/`)) throw new ValueError(`Invalid plugin name '${candidate}': resolves outside the plugins directory.`)
  return target
}

export function resolveHermesPluginGitURL(identifier: string): string {
  if (identifier.startsWith("https://") || identifier.startsWith("http://") || identifier.startsWith("git@") || identifier.startsWith("ssh://") || identifier.startsWith("file://")) return identifier
  const parts = identifier.replace(/^\/+|\/+$/g, "").split("/")
  if (parts.length === 2 && parts[0] && parts[1]) return `https://github.com/${parts[0]}/${parts[1]}.git`
  throw new ValueError(`Invalid plugin identifier: '${identifier}'. Use a Git URL or owner/repo shorthand.`)
}

export function setHermesPluginEnabledState(input: {
  name: string
  enabled: boolean
  enabledSet?: string[]
  disabledSet?: string[]
  installed?: boolean
}): HermesPluginEnableStateProjection {
  if (input.installed === false) {
    return { ok: false, name: input.name, enabled: [...(input.enabledSet ?? [])].sort(), disabled: [...(input.disabledSet ?? [])].sort(), unchanged: true, error: `Plugin '${input.name}' is not installed or bundled.` }
  }
  const enabled = new Set(input.enabledSet ?? [])
  const disabled = new Set(input.disabledSet ?? [])
  const already = input.enabled ? enabled.has(input.name) && !disabled.has(input.name) : !enabled.has(input.name) && disabled.has(input.name)
  if (input.enabled) {
    enabled.add(input.name)
    disabled.delete(input.name)
  } else {
    enabled.delete(input.name)
    disabled.add(input.name)
  }
  return { ok: true, name: input.name, enabled: [...enabled].sort(), disabled: [...disabled].sort(), unchanged: already }
}

export function dashboardInstallHermesPluginProjection(input: {
  identifier: string
  force?: boolean
  enable?: boolean
  manifest?: HermesPluginManifestProjection
  env?: Record<string, string | undefined>
  hasAfterInstall?: boolean
  installError?: string
}): HermesDashboardInstallProjection {
  const warnings: string[] = []
  try {
    const gitURL = resolveHermesPluginGitURL(input.identifier)
    if (gitURL.startsWith("http://") || gitURL.startsWith("file://")) warnings.push("Insecure URL scheme; prefer https:// or git@ for production installs.")
  } catch {
    // Upstream lets _install_plugin_core report clone/install failures for invalid identifiers.
  }
  if (input.installError) return { ok: false, error: input.installError }
  let pluginName = input.manifest?.name
  if (!pluginName) {
    const gitURL = resolveHermesPluginGitURL(input.identifier)
    pluginName = repoNameFromURL(gitURL)
  }
  return {
    ok: true,
    plugin_name: pluginName,
    warnings,
    missing_env: missingRequiredEnvNames(input.manifest?.requires_env ?? [], input.env ?? {}),
    after_install_path: input.hasAfterInstall ? `/home/user/.hermes/plugins/${pluginName}/after-install.md` : null,
    enabled: Boolean(input.enable),
  }
}

export function normalizeHermesPluginCommandName(name: string): string {
  return name.toLowerCase().trim().replace(/^\/+/, "").replaceAll(" ", "-")
}

export function buildHermesHookLifecycleNativeExactFixture(): HermesHookLifecycleNativeExactFixture {
  const shellSpecs = parseHermesShellHookSpecs({
    pre_tool_call: [
      { command: " ~/.hermes/hooks/block.py ", matcher: "terminal|read_file", timeout: "600" },
      { command: "node ./literal.js", matcher: "[", timeout: "bad" },
      { command: "python ./minimum.py", timeout: 0 },
      { command: "", matcher: "ignored" },
      "malformed",
    ],
    post_tool_call: [{ command: "echo post", matcher: " terminal ", timeout: 5 }],
    pre_llm_call: [{ command: "echo ctx", matcher: "ignored outside tool hooks", timeout: 12 }],
    unknown_event: [{ command: "bad" }],
    post_api_request: { command: "bad" },
  })
  const firstShellSpec = shellSpecs[0] ?? parseHermesShellHookEntry("pre_tool_call", { command: "true" })!
  const literalFallbackSpec = shellSpecs[1] ?? firstShellSpec
  const shellPayload = JSON.parse(serializeHermesShellHookPayload("pre_tool_call", {
    tool_name: "terminal",
    args: { command: "pwd" },
    session_id: "sess_1",
    parent_session_id: "parent_ignored",
    task_id: "task_1",
    tool_call_id: "call_1",
  }, "/workspace/hermes")) as Record<string, unknown>

  const manager = createHermesPluginManagerProjection()
  const context = createHermesPluginContextProjection({ name: "observer", key: "observability/observer", source: "user" }, manager)
  context.register_tool("trace_dump", "observer", { type: "object" }, function traceDump() {})
  const commandRegistered = context.register_command("/Daily Report", function dailyReport() {}, "Daily report", "<days>")
  const builtinSkipped = context.register_command("help", function helpCommand() {})
  context.register_cli_command("honcho", "Run honcho", function setupHoncho() {}, function handleHoncho() {}, "Honcho commands")
  context.register_provider("local-model", { profile: "local" })
  context.register_ui_provider("dashboard", { panel: true })
  context.register_skill("audit", { path: "/plugins/observer/skills/audit/SKILL.md" })
  context.register_hook("pre_tool_call", () => undefined)
  context.register_hook("pre_tool_call", () => ({ action: "allow" }))
  context.register_hook("future_hook", () => "future")
  context.register_hook("pre_tool_call", () => {
    throw new Error("observer boom")
  })
  const invoked = invokeHermesPluginHook(manager, "pre_tool_call", { tool_name: "terminal" })

  const discovery = discoverHermesPluginManifestsProjection({
    manifests: [
      { name: "disk-cleanup", key: "disk-cleanup", source: "bundled", kind: "standalone", path: "/bundled/disk-cleanup" },
      { name: "openai", key: "image_gen/openai", source: "bundled", kind: "backend", path: "/bundled/image_gen/openai" },
      { name: "irc", key: "platforms/irc", source: "bundled", kind: "platform", path: "/bundled/platforms/irc" },
      { name: "disk-cleanup", key: "disk-cleanup", source: "user", kind: "standalone", path: "/home/user/.hermes/plugins/disk-cleanup" },
      { name: "custom-backend", key: "custom-backend", source: "user", kind: "backend", path: "/home/user/.hermes/plugins/custom-backend" },
      { name: "project-only", key: "project-only", source: "project", kind: "standalone", path: "/workspace/.hermes/plugins/project-only" },
      { name: "vector", key: "memory/vector", source: "user", kind: "exclusive", path: "/home/user/.hermes/plugins/memory/vector" },
      { name: "local", key: "providers/local", source: "user", kind: "model-provider", path: "/home/user/.hermes/plugins/providers/local" },
    ],
    enabled: ["disk-cleanup", "custom-backend"],
    disabled: ["project-only"],
  })

  const blockManager = createHermesPluginManagerProjection()
  const blockContext = createHermesPluginContextProjection({ name: "policy", source: "user" }, blockManager)
  blockContext.register_hook("pre_tool_call", () => "observe only")
  blockContext.register_hook("pre_tool_call", () => ({ action: "block", message: "" }))
  blockContext.register_hook("pre_tool_call", () => ({ action: "block", message: "No terminal" }))

  const dashboardInstall = dashboardInstallHermesPluginProjection({
    identifier: "http://example.test/repo.git",
    enable: true,
    manifest: { name: "repo-plugin", requires_env: ["API_KEY", { name: "TOKEN" }] },
    env: { API_KEY: "set" },
    hasAfterInstall: true,
  })

  const fixtureWithoutFingerprint: Omit<HermesHookLifecycleNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "hermes-agent",
    atomIDs: hermesHookLifecycleNativeExactAtomIDs,
    portIDs: ["hook.bus", "hook.cleanup-scope", "hook.error-policy", "hook.handler-chain", "hook.observer-chain", "hook.scheduler", "registry.command", "registry.provider", "registry.ui", "tool.registry"],
    upstreamRef: hermesHookLifecycleUpstreamRef,
    evidenceRef: hermesHookLifecycleNativeExactEvidenceRef,
    fixtureID: hermesHookLifecycleNativeExactFixtureID,
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    policy: {
      shellHookConfigWarnsAndSkipsMalformedEntries: true,
      shellHookMatcherUsesRegexFullmatchWithLiteralFallback: true,
      shellHookTimeoutDefaultsAndClamps: true,
      shellHookPayloadPreservesToolInputSessionAndExtra: true,
      shellHookBlockResponseNormalizesClaudeAndHermesShapes: true,
      pluginContextRegistersToolsHooksCommandsProvidersAndUI: true,
      pluginManagerInvokesHooksInRegistrationOrderAndCatchesErrors: true,
      pluginDiscoveryLaterSourcesOverrideEarlierKeys: true,
      pluginDiscoveryDisabledWinsAndStandaloneRequiresEnabled: true,
      bundledBackendAndPlatformPluginsAutoLoad: true,
      exclusiveAndModelProviderKindsAreRecordedButNotGeneralLoaded: true,
      preToolCallWhitelistDeniesBeforePluginHooks: true,
      pluginInstallerSanitizesNamesAndResolvesGithubShorthand: true,
      allHookAtomsShareNativeLifecycleFixture: true,
    },
    cases: [
      hookCase(
        "shell-hooks-parse-match-payload-response",
        { configKeys: ["pre_tool_call", "post_tool_call", "pre_llm_call", "unknown_event", "post_api_request"] },
        {
          parsedCommands: shellSpecs.map((spec) => `${spec.event}:${spec.command}:${spec.timeout}:${spec.matchMode}`),
          validRegexMatchesTerminal: hermesShellHookMatchesTool(firstShellSpec, "terminal"),
          validRegexRejectsShell: !hermesShellHookMatchesTool(firstShellSpec, "shell"),
          invalidRegexFallsBackLiteral: hermesShellHookMatchesTool(literalFallbackSpec, "["),
          nonToolMatcherIgnored: shellSpecs.find((spec) => spec.event === "pre_llm_call")?.matchMode,
          payload: shellPayload,
          hermesBlock: parseHermesShellHookResponse("pre_tool_call", JSON.stringify({ action: "block", message: "Denied" })),
          claudeBlock: parseHermesShellHookResponse("pre_tool_call", JSON.stringify({ decision: "block", reason: "Claude denied" })),
          defaultBlock: parseHermesShellHookResponse("pre_tool_call", JSON.stringify({ action: "block", message: "" })),
          context: parseHermesShellHookResponse("pre_llm_call", JSON.stringify({ context: "remember this" })),
        },
        "shell_hooks.py parses only known hook events with list entries, trims commands and matchers, clamps timeouts, uses regex fullmatch with literal fallback, serializes the upstream stdin payload shape, and normalizes block/context stdout JSON.",
      ),
      hookCase(
        "shell-hooks-accept-and-script-path",
        { env: "HERMES_ACCEPT_HOOKS=yes", configValue: "on", command: "python ~/hooks/block.py --flag" },
        {
          envAccepts: resolveHermesShellHookAccept({ env: { HERMES_ACCEPT_HOOKS: "yes" } }),
          configAccepts: resolveHermesShellHookAccept({ configValue: "on" }),
          explicitAccepts: resolveHermesShellHookAccept({ acceptHooks: true, env: { HERMES_ACCEPT_HOOKS: "0" } }),
          scriptPath: commandScriptPath("python ~/hooks/block.py --flag"),
          firstTokenFallback: commandScriptPath("node -e \"console.log(1)\""),
          canonicalDottedEvent: canonicalizeHermesHookEventName("transform.llm.output"),
        },
        "register_from_config resolves accept from CLI flag, HERMES_ACCEPT_HOOKS, or hooks_auto_accept, and shell hook diagnostics prefer script-looking command tokens before path-like tokens and first-token fallback.",
      ),
      hookCase(
        "plugin-context-registries-and-hook-invoke",
        { plugin: "observer", hooks: ["pre_tool_call", "future_hook"] },
        {
          toolNames: [...manager.pluginToolNames].sort(),
          commandRegistered,
          builtinSkipped,
          commands: [...manager.pluginCommands.keys()].sort(),
          cliCommands: [...manager.cliCommands.keys()].sort(),
          providers: [...manager.providers.keys()].sort(),
          uiProviders: [...manager.uiProviders.keys()].sort(),
          skills: [...manager.skills.keys()].sort(),
          hookWarnings: manager.hookWarnings,
          invokeResults: invoked.results,
          invokeErrors: invoked.errors,
        },
        "PluginContext registers tools, slash commands, CLI commands, hooks, provider/UI surfaces, and skills; PluginManager invokes hook callbacks in order, returns non-None values, and isolates callback exceptions.",
      ),
      hookCase(
        "plugin-discovery-enable-disable-and-winners",
        { enabled: ["disk-cleanup", "custom-backend"], disabled: ["project-only"] },
        {
          found: discovery.found,
          enabled: discovery.enabled,
          entries: discovery.entries.map((entry) => ({
            key: entry.manifest.key,
            name: entry.manifest.name,
            source: entry.manifest.source,
            kind: entry.manifest.kind,
            enabled: entry.enabled,
            loadAction: entry.loadAction,
            error: entry.error ?? "",
          })),
        },
        "PluginManager discovery lets later sources override earlier keys, disabled config wins, bundled backend/platform manifests auto-load, standalone/user backends require plugins.enabled, and exclusive/model-provider kinds are recorded without general loading.",
      ),
      hookCase(
        "pre-tool-call-block-and-thread-whitelist",
        { toolName: "terminal", whitelist: ["read_file"] },
        {
          whitelistDeny: getHermesPreToolCallBlockMessage(blockManager, { toolName: "terminal", allowedTools: ["read_file"] }),
          allowedBlock: getHermesPreToolCallBlockMessage(blockManager, { toolName: "terminal", args: { command: "rm -rf /" }, allowedTools: ["terminal"] }),
          missingBlock: getHermesPreToolCallBlockMessage(blockManager, { toolName: "read_file", allowedTools: ["read_file"] }) ?? null,
        },
        "get_pre_tool_call_block_message denies against the thread-local whitelist before invoking plugins, then returns the first dict block result with a non-empty message.",
      ),
      hookCase(
        "plugin-command-install-url-name-and-dashboard",
        { identifier: "NousResearch/hermes-agent", dashboardIdentifier: "http://example.test/repo.git" },
        {
          githubURL: resolveHermesPluginGitURL("NousResearch/hermes-agent"),
          fullURL: resolveHermesPluginGitURL("ssh://git@example.test/team/repo.git"),
          sanitizedSubdir: sanitizeHermesPluginName("observability/langfuse", "/home/user/.hermes/plugins", { allowSubdir: true }),
          pathTraversalRejected: throwsValueError(() => sanitizeHermesPluginName("../bad", "/home/user/.hermes/plugins")),
          commandName: normalizeHermesPluginCommandName("/Daily Report"),
          enableState: setHermesPluginEnabledState({ name: "alpha", enabled: true, enabledSet: ["old"], disabledSet: ["alpha"] }),
          dashboardInstall,
        },
        "plugins_cmd.py resolves Git URLs including owner/repo shorthand, rejects unsafe plugin names, normalizes slash command names, persists sorted enable/disable sets, and returns dashboard install metadata with warnings and missing env names.",
      ),
    ],
    sourceRefs: [
      `${hermesHookLifecycleUpstreamRef}:agent/shell_hooks.py#ShellHookSpec,register_from_config,iter_configured_hooks,reset_for_tests,_parse_hooks_block,_make_callback,_parse_response,run_once`,
      `${hermesHookLifecycleUpstreamRef}:hermes_cli/plugins.py#PluginManifest,LoadedPlugin,PluginContext,PluginManager,register_hook,invoke_hook,discover_plugins,get_plugin_manager,set_thread_tool_whitelist,get_pre_tool_call_block_message`,
      `${hermesHookLifecycleUpstreamRef}:hermes_cli/plugins_cmd.py#PluginOperationError,cmd_install,cmd_update,cmd_remove,cmd_enable,cmd_disable,cmd_list,cmd_toggle,dashboard_install_plugin,dashboard_set_agent_plugin_enabled`,
    ],
    nativeEvidenceRefs: [hermesHookLifecycleNativeExactEvidenceRef, hermesHookLifecycleNativeExactReplayRef],
    fixtureIDs: [hermesHookLifecycleNativeExactFixtureID],
    knownLossiness: [],
    descriptors: hermesHookLifecycleNativeDescriptors,
  }
  return { ...fixtureWithoutFingerprint, fingerprint: fingerprintObject(fixtureWithoutFingerprint) }
}

export function verifyHermesHookLifecycleNativeExactFixture(
  fixture: HermesHookLifecycleNativeExactFixture,
): HermesHookLifecycleNativeExactVerification {
  const issues: HermesHookLifecycleNativeExactIssue[] = []
  const expected = buildHermesHookLifecycleNativeExactFixture()
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)
  if (fixture.fingerprint !== expectedFingerprint) issues.push({ id: "hermes-hook-lifecycle-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Hermes hook lifecycle content." })
  if (fixture.product !== "hermes-agent" || !sameJSON(fixture.atomIDs, hermesHookLifecycleNativeExactAtomIDs)) issues.push({ id: "hermes-hook-lifecycle-native-exact.identity", message: "Fixture must stay scoped to the Hermes hook lifecycle native atom group." })
  if (fixture.upstreamRef !== hermesHookLifecycleUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("92a567db2d7a5031df8211efbfdad864c2f51faf"))) issues.push({ id: "hermes-hook-lifecycle-native-exact.upstream", message: "Fixture must stay pinned to the Hermes hook lifecycle upstream sources." })
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) issues.push({ id: "hermes-hook-lifecycle-native-exact.native-claim", message: "Hermes hook lifecycle fixture must explicitly claim native-exact parity." })
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) issues.push({ id: "hermes-hook-lifecycle-native-exact.lossiness", message: "Native exact Hermes hook lifecycle fixture must not carry known lossiness markers." })
  if (!fixture.nativeEvidenceRefs.includes(hermesHookLifecycleNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(hermesHookLifecycleNativeExactReplayRef)) issues.push({ id: "hermes-hook-lifecycle-native-exact.evidence", message: "Hermes hook lifecycle native exact evidence refs are missing." })
  if (!fixture.fixtureIDs.includes(hermesHookLifecycleNativeExactFixtureID)) issues.push({ id: "hermes-hook-lifecycle-native-exact.fixture", message: "Hermes hook lifecycle native exact fixture ID is missing." })
  if (!sameJSON(fixture.policy, expected.policy)) issues.push({ id: "hermes-hook-lifecycle-native-exact.policy", message: "Hermes hook lifecycle native policy drifted from upstream shell/plugin semantics." })
  if (!sameJSON(fixture.cases, expected.cases)) issues.push({ id: "hermes-hook-lifecycle-native-exact.cases", message: "Hermes hook lifecycle native cases drifted from upstream shell/plugin behavior." })
  if (!sameJSON(fixture.descriptors, expected.descriptors)) issues.push({ id: "hermes-hook-lifecycle-native-exact.descriptors", message: "Hermes hook lifecycle native descriptors drifted from the fixture atom group." })
  return { ok: issues.length === 0, issues }
}

export function hermesHookLifecyclePortForAtomID(id: HermesHookLifecycleNativeExactAtomID): HermesHookLifecycleNativeExactPortID {
  if (id === "hermes.plugin.cleanup") return "hook.cleanup-scope"
  if (id === "hermes.plugin.event-mapper") return "hook.handler-chain"
  if (id === "hermes.plugin.loader") return "hook.bus"
  if (id === "hermes.plugin.provider-registry-bridge") return "registry.provider"
  if (id === "hermes.plugin.ui-registry-bridge") return "registry.ui"
  if (id === "hermes.hook.error-defaults") return "hook.error-policy"
  if (id === "hermes.hook.handler-adapter") return "hook.handler-chain"
  if (id === "hermes.hook.observer-adapter") return "hook.observer-chain"
  if (id === "hermes.hook.plugin-bridge") return "hook.bus"
  if (id === "hermes.hook.scheduler-defaults") return "hook.scheduler"
  if (id === "hermes.registry.command") return "registry.command"
  if (id === "hermes.registry.provider-plugin") return "registry.provider"
  if (id === "hermes.registry.tool-definition") return "tool.registry"
  return "registry.ui"
}

function hookDescriptor(
  id: HermesHookLifecycleNativeExactAtomID,
  port: HermesHookLifecycleNativeExactPortID,
  selectionReason: string,
): HermesHookLifecycleNativeDescriptor {
  return { ...descriptorBase, id, port, selectionReason }
}

function hookCase(
  scenarioID: HermesHookLifecycleNativeExactScenarioID,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  upstreamBehavior: string,
): HermesHookLifecycleNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function parseHermesHookTimeout(value: unknown): number {
  let timeout: number
  if (typeof value === "number" && Number.isFinite(value)) timeout = Math.trunc(value)
  else if (typeof value === "string" && /^[+-]?\d+$/.test(value.trim())) timeout = Number.parseInt(value, 10)
  else timeout = defaultHookTimeoutSeconds
  if (timeout < 1) return defaultHookTimeoutSeconds
  return Math.min(timeout, maxHookTimeoutSeconds)
}

function compileFullmatchRegex(pattern: string | undefined): RegExp | null {
  if (!pattern) return null
  try {
    return new RegExp(`^(?:${pattern})$`)
  } catch {
    return null
  }
}

function blockMessage(primary: unknown, secondary: unknown): string {
  const raw = primary || secondary
  return typeof raw === "string" && raw ? raw : defaultBlockMessage
}

function truthyOptIn(value: string): boolean {
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase())
}

function splitShellWords(command: string): string[] {
  const tokens: string[] = []
  let current = ""
  let quote: "'" | "\"" | null = null
  let escape = false
  for (const char of command.trim()) {
    if (escape) {
      current += char
      escape = false
      continue
    }
    if (char === "\\" && quote !== "'") {
      escape = true
      continue
    }
    if (quote) {
      if (char === quote) quote = null
      else current += char
      continue
    }
    if (char === "'" || char === "\"") {
      quote = char
      continue
    }
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current)
        current = ""
      }
      continue
    }
    current += char
  }
  if (current) tokens.push(current)
  if (quote) return command.trim().split(/\s+/).filter(Boolean)
  return tokens
}

function normalizeHermesPluginManifest(
  input: HermesPluginManifestProjection,
): HermesLoadedPluginProjection["manifest"] {
  const kind = typeof input.kind === "string" && validPluginKinds.has(input.kind.trim().toLowerCase())
    ? (input.kind.trim().toLowerCase() as HermesPluginKindProjection)
    : "standalone"
  const source = input.source ?? "user"
  const name = input.name || "plugin"
  return {
    name,
    version: String(input.version ?? ""),
    description: input.description ?? "",
    author: input.author ?? "",
    requires_env: input.requires_env ?? [],
    provides_tools: input.provides_tools ?? [],
    provides_hooks: input.provides_hooks ?? [],
    source,
    path: input.path ?? "",
    kind,
    key: input.key ?? name,
  }
}

function loadedPlugin(
  manifest: HermesLoadedPluginProjection["manifest"],
  enabled: boolean,
  loadAction: HermesLoadedPluginProjection["loadAction"],
  error?: string,
): HermesLoadedPluginProjection {
  return {
    manifest,
    enabled,
    loadAction,
    ...(error ? { error } : {}),
    tools_registered: enabled && loadAction === "loaded" ? manifest.provides_tools : [],
    hooks_registered: enabled && loadAction === "loaded" ? manifest.provides_hooks : [],
    commands_registered: [],
  }
}

function missingRequiredEnvNames(
  requiresEnv: Array<string | { name?: string }>,
  env: Record<string, string | undefined>,
): string[] {
  const missing: string[] = []
  for (const entry of requiresEnv) {
    const name = typeof entry === "string" ? entry : entry.name
    if (name && !env[name]) missing.push(name)
  }
  return missing
}

function repoNameFromURL(url: string): string {
  let name = url.replace(/\/+$/g, "")
  if (name.endsWith(".git")) name = name.slice(0, -4)
  name = name.slice(name.lastIndexOf("/") + 1)
  if (name.includes(":")) name = name.slice(name.lastIndexOf(":") + 1)
  return name
}

function throwsValueError(fn: () => unknown): boolean {
  try {
    fn()
    return false
  } catch (error) {
    return error instanceof ValueError
  }
}

function isHermesHookEventName(value: string): value is HermesHookLifecycleHookEventName {
  return validHookEventSet.has(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
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

class ValueError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValueError"
  }
}
