import { createHash } from "node:crypto"
import { posix as path } from "node:path"

export const openCodeHookLifecycleUpstreamRef = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
export const openCodeHookLifecycleNativeExactFixtureID = "opencode-hook-lifecycle:native-exact-fixture"
export const openCodeHookLifecycleNativeExactEvidenceRef = "conformance:opencode-hook-lifecycle-native-exact-fixture"
export const openCodeHookLifecycleNativeExactReplayRef = "hook-lifecycle-native-exact:opencode"

export const openCodeHookLifecycleNativeExactAtomIDs = [
  "opencode.hook.error-defaults",
  "opencode.hook.handler-adapter",
  "opencode.hook.observer-adapter",
  "opencode.hook.plugin-bridge",
  "opencode.hook.scheduler-defaults",
  "opencode.plugin.event-mapper",
  "opencode.plugin.hot-reload-cleanup",
  "opencode.plugin.loader",
  "opencode.plugin.provider-registry-bridge",
  "opencode.plugin.ui-registry-bridge",
  "opencode.registry.command",
  "opencode.registry.provider-plugin",
  "opencode.registry.tool-definition",
  "opencode.registry.ui-provider",
] as const

export const openCodePublicHookNames = [
  "event",
  "config",
  "chat.message",
  "chat.params",
  "chat.headers",
  "permission.ask",
  "command.execute.before",
  "tool.execute.before",
  "shell.env",
  "tool.execute.after",
  "experimental.chat.messages.transform",
  "experimental.chat.system.transform",
  "experimental.session.compacting",
  "experimental.compaction.autocontinue",
  "experimental.text.complete",
  "tool.definition",
] as const

export type OpenCodeHookLifecycleNativeExactAtomID = (typeof openCodeHookLifecycleNativeExactAtomIDs)[number]
export type OpenCodePublicHookName = (typeof openCodePublicHookNames)[number]
export type OpenCodeHookLifecycleNativeExactPortID =
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

export interface OpenCodeHookLifecycleNativeDescriptor {
  id: OpenCodeHookLifecycleNativeExactAtomID
  port: OpenCodeHookLifecycleNativeExactPortID
  product: "opencode"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof openCodeHookLifecycleNativeExactEvidenceRef, typeof openCodeHookLifecycleNativeExactReplayRef]
  fixtureIDs: [typeof openCodeHookLifecycleNativeExactFixtureID]
  knownLossiness: []
}

export type OpenCodeHookOutput = Record<string, unknown>
export type OpenCodeHookFunction = (input: Record<string, unknown>, output: OpenCodeHookOutput) => Promise<void> | void
export type OpenCodeEventHookFunction = (input: { event: Record<string, unknown> }) => Promise<void> | void
export type OpenCodeConfigHookFunction = (input: Record<string, unknown>) => Promise<void> | void

export interface OpenCodeHooksProjection {
  event?: OpenCodeEventHookFunction
  config?: OpenCodeConfigHookFunction
  tool?: Record<string, OpenCodePluginToolDefinitionProjection>
  auth?: { provider: string; methods?: unknown[]; loader?: unknown }
  provider?: { id: string; models?: unknown }
  ui?: unknown
  "chat.message"?: OpenCodeHookFunction
  "chat.params"?: OpenCodeHookFunction
  "chat.headers"?: OpenCodeHookFunction
  "permission.ask"?: OpenCodeHookFunction
  "command.execute.before"?: OpenCodeHookFunction
  "tool.execute.before"?: OpenCodeHookFunction
  "shell.env"?: OpenCodeHookFunction
  "tool.execute.after"?: OpenCodeHookFunction
  "experimental.chat.messages.transform"?: OpenCodeHookFunction
  "experimental.chat.system.transform"?: OpenCodeHookFunction
  "experimental.session.compacting"?: OpenCodeHookFunction
  "experimental.compaction.autocontinue"?: OpenCodeHookFunction
  "experimental.text.complete"?: OpenCodeHookFunction
  "tool.definition"?: OpenCodeHookFunction
}

export interface OpenCodePluginInputProjection {
  client?: unknown
  project?: unknown
  directory: string
  worktree: string
  experimental_workspace?: {
    register(type: string, adapter: unknown): void
  }
  serverUrl?: URL
  $?: unknown
}

export type OpenCodePluginOptionsProjection = Record<string, unknown>
export type OpenCodePluginProjection = (
  input: OpenCodePluginInputProjection,
  options?: OpenCodePluginOptionsProjection,
) => Promise<OpenCodeHooksProjection> | OpenCodeHooksProjection

export interface OpenCodeLoadedPluginProjection {
  spec: string
  source: "file" | "npm"
  target: string
  entry: string
  pkg?: OpenCodePluginPackageProjection
  options?: OpenCodePluginOptionsProjection
  mod: Record<string, unknown>
}

export interface OpenCodePluginPackageProjection {
  dir: string
  pkg: string
  json: Record<string, unknown>
}

export interface OpenCodePluginServiceProjection {
  init(input: {
    internal?: OpenCodePluginProjection[]
    loaded?: OpenCodeLoadedPluginProjection[]
    pluginInput: OpenCodePluginInputProjection
    config?: Record<string, unknown>
    pure?: boolean
  }): Promise<void>
  trigger(name: OpenCodePublicHookName, input: Record<string, unknown>, output: OpenCodeHookOutput): Promise<OpenCodeHookOutput>
  publishEvent(event: Record<string, unknown>): void
  list(): OpenCodeHooksProjection[]
  configErrors(): string[]
  eventCalls(): string[]
}

export type OpenCodePluginSpecProjection = string | [string, Record<string, unknown>]

export interface OpenCodePluginOriginProjection {
  spec: OpenCodePluginSpecProjection
  source: string
  scope: "global" | "local"
}

export type OpenCodePluginLoaderOutcome =
  | { type: "loaded"; entry?: string; target?: string; mod?: Record<string, unknown> }
  | { type: "deprecated" }
  | { type: "missing"; message?: string }
  | { type: "install-error"; message: string; retryOutcome?: OpenCodePluginLoaderOutcome }
  | { type: "entry-error"; message: string }
  | { type: "compatibility-error"; message: string }
  | { type: "load-error"; message: string }

export interface OpenCodePluginLoaderCandidateProjection {
  origin: OpenCodePluginOriginProjection
  outcome: OpenCodePluginLoaderOutcome
}

export interface OpenCodePluginLoaderReportProjection {
  start: string[]
  missing: string[]
  errors: string[]
  waitCount: number
}

export interface OpenCodePluginLoadExternalProjection {
  loaded: Array<{ spec: string; source: "file" | "npm"; entry: string; retry: boolean }>
  report: OpenCodePluginLoaderReportProjection
}

export interface OpenCodePluginToolDefinitionProjection {
  description: string
  args?: Record<string, unknown>
  execute(args: Record<string, unknown>, context: OpenCodePluginToolContextProjection): Promise<OpenCodePluginToolResultProjection> | OpenCodePluginToolResultProjection
}

export interface OpenCodePluginToolContextProjection {
  sessionID: string
  messageID: string
  agent: string
  directory: string
  worktree: string
  callID?: string
  ask(input: Record<string, unknown>): Promise<void>
}

export type OpenCodePluginToolResultProjection =
  | string
  | {
    title?: string
    output: string
    metadata?: Record<string, unknown>
    attachments?: unknown[]
  }

export interface OpenCodeToolDefinitionProjection {
  id: string
  description: string
  jsonSchema?: Record<string, unknown>
  parameters: unknown
  execute(args: Record<string, unknown>, context: Omit<OpenCodePluginToolContextProjection, "directory" | "worktree"> & { ask(input: Record<string, unknown>): Promise<void> }): Promise<{
    title: string
    output: string
    metadata: Record<string, unknown>
    attachments?: unknown[]
  }>
}

export interface OpenCodeToolRegistryProjection {
  ids(): string[]
  all(): OpenCodeToolDefinitionProjection[]
  tools(input: {
    providerID: string
    modelID: string
    agent: string
    flags?: { exa?: boolean; parallel?: boolean; experimentalScout?: boolean; experimentalPlanMode?: boolean; experimentalLspTool?: boolean; client?: string }
  }): Promise<OpenCodeToolDefinitionProjection[]>
  named(): { task: OpenCodeToolDefinitionProjection; read: OpenCodeToolDefinitionProjection }
}

export interface OpenCodeCommandInfoProjection {
  name: string
  description?: string
  agent?: string
  model?: string
  source?: "command" | "mcp" | "skill"
  template: string
  subtask?: boolean
  hints: string[]
}

export interface OpenCodeCommandRegistryProjection {
  get(name: string): OpenCodeCommandInfoProjection | undefined
  list(): OpenCodeCommandInfoProjection[]
}

export type OpenCodeHookLifecycleNativeExactScenarioID =
  | "plugin-service-trigger-and-event-order"
  | "plugin-loader-config-dedupe-and-entrypoints"
  | "tool-registry-plugin-tools-and-definition-hook"
  | "command-registry-default-config-mcp-skill"
  | "event-mapper-provider-workspace-registries"
  | "shared-plugin-resolution-and-v1-legacy"

export interface OpenCodeHookLifecycleNativeExactCase {
  scenarioID: OpenCodeHookLifecycleNativeExactScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface OpenCodeHookLifecycleNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: typeof openCodeHookLifecycleNativeExactAtomIDs
  portIDs: OpenCodeHookLifecycleNativeExactPortID[]
  upstreamRef: typeof openCodeHookLifecycleUpstreamRef
  evidenceRef: typeof openCodeHookLifecycleNativeExactEvidenceRef
  fixtureID: typeof openCodeHookLifecycleNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    hooksUsePublicPluginApiMethodNames: true
    pluginTriggerAwaitsHooksSequentiallyAndMutatesSharedOutput: true
    configHookRunsAfterAllPluginsAndConfigErrorsAreIgnored: true
    busEventHookIsInvokedForEveryLoadedHookWithoutBlockingPublisher: true
    loaderSkipsDeprecatedPackagesAndReportsStageSpecificFailures: true
    loaderRetriesOnlyRetryableFilePluginInstallFailuresAfterDependencyWait: true
    configPluginOriginsDedupeByFileURLOrNpmPackageWithLastConfigWinning: true
    pluginServerAndTuiEntrypointsUseTheSameSharedResolver: true
    v1PluginModulesRequireExactlyOneServerOrTuiFunction: true
    legacyPluginExportsAreDedupeByExportIdentityAndMustResolveToServerFunctions: true
    pathPluginsMustExportAnExplicitIDWhileNpmPluginsFallbackToPackageName: true
    toolRegistryOrdersBuiltinThenCustomThenPluginTools: true
    pluginToolArgsDefaultToEmptyObjectAndLegacyJsonSchemaRequiresAllProperties: true
    pluginToolExecuteBridgesAskDirectoryWorktreeAndNormalizesStringOrObjectResults: true
    toolDefinitionHookMutatesFilteredToolDescriptionsBeforeProviderCall: true
    commandRegistryAppliesDefaultThenConfigThenMcpThenNonDuplicateSkills: true
    eventMapperTranslatesLegoEventsToOpenCodeHookInputsAndOutputs: true
    pluginRegistriesExposeToolAuthProviderAndTuiTargetsFromNativeHooks: true
    allHookAtomsShareNativeLifecycleFixture: true
  }
  cases: OpenCodeHookLifecycleNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: OpenCodeHookLifecycleNativeDescriptor[]
  fingerprint: string
}

export interface OpenCodeHookLifecycleNativeExactIssue {
  id: string
  message: string
}

export interface OpenCodeHookLifecycleNativeExactVerification {
  ok: boolean
  issues: OpenCodeHookLifecycleNativeExactIssue[]
}

const descriptorBase = {
  product: "opencode" as const,
  implementationKind: "factory" as const,
  parityCoverage: "native" as const,
  nativeEvidenceRefs: [openCodeHookLifecycleNativeExactEvidenceRef, openCodeHookLifecycleNativeExactReplayRef] as [
    typeof openCodeHookLifecycleNativeExactEvidenceRef,
    typeof openCodeHookLifecycleNativeExactReplayRef,
  ],
  fixtureIDs: [openCodeHookLifecycleNativeExactFixtureID] as [typeof openCodeHookLifecycleNativeExactFixtureID],
  knownLossiness: [] as [],
}

const deprecatedPluginPackages = ["opencode-openai-codex-auth", "opencode-copilot-auth"]
const builtinToolOrder = [
  "invalid",
  "question",
  "shell",
  "read",
  "glob",
  "grep",
  "edit",
  "write",
  "task",
  "fetch",
  "todo",
  "search",
  "repo_clone",
  "repo_overview",
  "skill",
  "patch",
  "lsp",
  "plan",
] as const

export const openCodeHookLifecycleNativeDescriptors: OpenCodeHookLifecycleNativeDescriptor[] = openCodeHookLifecycleNativeExactAtomIDs.map((id) =>
  hookDescriptor(id, openCodeHookLifecyclePortForAtomID(id), openCodeHookLifecycleSelectionReason(id)),
)

export function createOpenCodePluginServiceProjection(): OpenCodePluginServiceProjection {
  const hooks: OpenCodeHooksProjection[] = []
  const errors: string[] = []
  const events: string[] = []
  return {
    async init(input) {
      hooks.length = 0
      errors.length = 0
      events.length = 0
      for (const plugin of input.internal ?? []) {
        hooks.push(await plugin(input.pluginInput))
      }
      if (!input.pure) {
        for (const loaded of input.loaded ?? []) {
          await applyOpenCodeLoadedPluginProjection(loaded, input.pluginInput, hooks)
        }
      }
      for (const hook of hooks) {
        try {
          await hook.config?.(input.config ?? {})
        } catch (error) {
          errors.push(errorMessage(error))
        }
      }
    },
    async trigger(name, input, output) {
      for (const hook of hooks) {
        const fn = hook[name] as OpenCodeHookFunction | undefined
        if (!fn) continue
        await fn(input, output)
      }
      return output
    },
    publishEvent(event) {
      for (const hook of hooks) {
        if (!hook.event) continue
        events.push(String(event.type ?? "event"))
        void hook.event({ event })
      }
    },
    list() {
      return [...hooks]
    },
    configErrors() {
      return [...errors]
    },
    eventCalls() {
      return [...events]
    },
  }
}

export async function applyOpenCodeLoadedPluginProjection(
  load: OpenCodeLoadedPluginProjection,
  input: OpenCodePluginInputProjection,
  hooks: OpenCodeHooksProjection[],
): Promise<void> {
  const v1 = readOpenCodeV1PluginProjection(load.mod, load.spec, "server", "detect")
  if (v1 && "server" in v1) {
    await resolveOpenCodePluginIDProjection(load.source, load.spec, load.target, readOpenCodePluginIDProjection(v1.id, load.spec), load.pkg)
    hooks.push(await v1.server(input, load.options))
    return
  }
  for (const server of openCodeLegacyServerPluginsProjection(load.mod)) {
    hooks.push(await server(input, load.options))
  }
}

export function readOpenCodeV1PluginProjection(
  mod: Record<string, unknown>,
  spec: string,
  kind: "server" | "tui",
  mode: "strict" | "detect" = "strict",
): { id?: string; server: OpenCodePluginProjection; tui?: never } | { id?: string; tui: unknown; server?: never } | undefined {
  const value = mod["default"]
  if (!isRecord(value)) {
    if (mode === "detect") return undefined
    throw new TypeError(`Plugin ${spec} must default export an object with ${kind}()`)
  }
  if (mode === "detect" && !("id" in value) && !("server" in value) && !("tui" in value)) return undefined
  const server = value["server"]
  const tui = value["tui"]
  if (server !== undefined && typeof server !== "function") throw new TypeError(`Plugin ${spec} has invalid server export`)
  if (tui !== undefined && typeof tui !== "function") throw new TypeError(`Plugin ${spec} has invalid tui export`)
  if (server !== undefined && tui !== undefined) throw new TypeError(`Plugin ${spec} must default export either server() or tui(), not both`)
  if (kind === "server" && server === undefined) throw new TypeError(`Plugin ${spec} must default export an object with server()`)
  if (kind === "tui" && tui === undefined) throw new TypeError(`Plugin ${spec} must default export an object with tui()`)
  return {
    ...(readOpenCodePluginIDProjection(value["id"], spec) ? { id: readOpenCodePluginIDProjection(value["id"], spec) } : {}),
    ...(server ? { server: server as OpenCodePluginProjection } : { tui }),
  } as { id?: string; server: OpenCodePluginProjection; tui?: never } | { id?: string; tui: unknown; server?: never }
}

export function openCodeLegacyServerPluginsProjection(mod: Record<string, unknown>): OpenCodePluginProjection[] {
  const seen = new Set<unknown>()
  const result: OpenCodePluginProjection[] = []
  for (const entry of Object.values(mod)) {
    if (seen.has(entry)) continue
    seen.add(entry)
    const plugin = openCodeServerPluginFromExport(entry)
    if (!plugin) throw new TypeError("Plugin export is not a function")
    result.push(plugin)
  }
  return result
}

export function readOpenCodePluginIDProjection(id: unknown, spec: string): string | undefined {
  if (id === undefined) return undefined
  if (typeof id !== "string") throw new TypeError(`Plugin ${spec} has invalid id type ${typeof id}`)
  const value = id.trim()
  if (!value) throw new TypeError(`Plugin ${spec} has an empty id`)
  return value
}

export function resolveOpenCodePluginIDProjection(
  source: "file" | "npm",
  spec: string,
  _target: string,
  id?: string,
  pkg?: OpenCodePluginPackageProjection,
): string {
  if (source === "file") {
    if (id) return id
    throw new TypeError(`Path plugin ${spec} must export id`)
  }
  if (id) return id
  const name = pkg?.json["name"]
  if (typeof name !== "string" || !name.trim()) throw new TypeError(`Plugin package ${pkg?.pkg ?? spec} is missing name`)
  return name.trim()
}

export function openCodePluginSpecifier(plugin: OpenCodePluginSpecProjection): string {
  return Array.isArray(plugin) ? plugin[0] : plugin
}

export function openCodePluginOptions(plugin: OpenCodePluginSpecProjection): Record<string, unknown> | undefined {
  return Array.isArray(plugin) ? plugin[1] : undefined
}

export function openCodeParsePluginSpecifier(spec: string): { pkg: string; version: string } {
  const raw = spec.startsWith("npm:") ? spec.slice("npm:".length) : spec
  const aliasIndex = raw.lastIndexOf("npm:")
  const value = aliasIndex >= 0 ? raw.slice(aliasIndex + "npm:".length) : raw
  if (value.startsWith("@")) {
    const slash = value.indexOf("/")
    if (slash < 0) return { pkg: value, version: "" }
    const afterName = value.indexOf("@", slash + 1)
    if (afterName < 0) return { pkg: value, version: "latest" }
    return { pkg: value.slice(0, afterName), version: value.slice(afterName + 1) || "latest" }
  }
  const at = value.lastIndexOf("@")
  if (at > 0) return { pkg: value.slice(0, at), version: value.slice(at + 1) || "latest" }
  return { pkg: value, version: "latest" }
}

export function deduplicateOpenCodePluginOriginsProjection(plugins: OpenCodePluginOriginProjection[]): OpenCodePluginOriginProjection[] {
  const seen = new Set<string>()
  const list: OpenCodePluginOriginProjection[] = []
  for (const plugin of [...plugins].reverse()) {
    const spec = openCodePluginSpecifier(plugin.spec)
    const name = spec.startsWith("file://") ? spec : openCodeParsePluginSpecifier(spec).pkg
    if (seen.has(name)) continue
    seen.add(name)
    list.push(plugin)
  }
  return list.reverse()
}

export function openCodePluginManifestTargetsProjection(pkg: OpenCodePluginPackageProjection): Array<{ kind: "server" | "tui"; opts?: Record<string, unknown> }> {
  const targets: Array<{ kind: "server" | "tui"; opts?: Record<string, unknown> }> = []
  const exports = isRecord(pkg.json["exports"]) ? pkg.json["exports"] : {}
  const serverExport = exportTargetProjection(exports["./server"])
  const tuiExport = exportTargetProjection(exports["./tui"])
  const main = typeof pkg.json["main"] === "string" && pkg.json["main"].trim() ? pkg.json["main"] : undefined
  const themes = Array.isArray(pkg.json["oc-themes"]) ? pkg.json["oc-themes"].filter((item) => typeof item === "string" && item.trim()) : []
  if (serverExport) targets.push({ kind: "server", ...(serverExport.opts ? { opts: serverExport.opts } : {}) })
  else if (main) targets.push({ kind: "server" })
  if (tuiExport) targets.push({ kind: "tui", ...(tuiExport.opts ? { opts: tuiExport.opts } : {}) })
  else if (themes.length) targets.push({ kind: "tui" })
  return targets
}

export function loadOpenCodeExternalPluginsProjection(input: {
  candidates: OpenCodePluginLoaderCandidateProjection[]
  kind: "server" | "tui"
  wait?: () => void
}): OpenCodePluginLoadExternalProjection {
  const report: OpenCodePluginLoaderReportProjection = { start: [], missing: [], errors: [], waitCount: 0 }
  const attempts = input.candidates.map((candidate) => openCodePluginLoaderAttemptProjection(candidate, input.kind, false, report))
  if (input.wait) {
    let waited = false
    for (let i = 0; i < attempts.length; i++) {
      const previous = attempts[i]
      const candidate = input.candidates[i]
      if (!previous || !candidate || previous.value || !previous.retry) continue
      if (openCodePluginSourceForSpec(openCodePluginSpecifier(candidate.origin.spec)) !== "file") continue
      if (!waited) {
        input.wait()
        waited = true
        report.waitCount++
      }
      const retryOutcome = candidate.outcome.type === "install-error" ? candidate.outcome.retryOutcome : undefined
      attempts[i] = openCodePluginLoaderAttemptProjection(
        { ...candidate, outcome: retryOutcome ?? candidate.outcome },
        input.kind,
        true,
        report,
      )
    }
  }
  return {
    loaded: attempts.flatMap((item) => (item.value ? [item.value] : [])),
    report,
  }
}

export function openCodeToolFromPluginProjection(
  id: string,
  def: OpenCodePluginToolDefinitionProjection,
  options: { directory: string; worktree: string; maxOutputLength?: number } = { directory: "", worktree: "" },
): OpenCodeToolDefinitionProjection {
  const args = def.args ?? {}
  const entries = Object.entries(args)
  const allZod = entries.every((entry) => isZodLike(entry[1]))
  const jsonSchema = allZod ? { type: "object", properties: Object.fromEntries(entries.map(([key]) => [key, { "x-zod": true }])) } : legacyJsonSchema(entries)
  return {
    id,
    description: def.description,
    parameters: allZod ? { kind: "zod", keys: entries.map(([key]) => key) } : "unknown",
    jsonSchema,
    async execute(argsInput, toolCtx) {
      const asked: Record<string, unknown>[] = []
      const result = await def.execute(argsInput, {
        ...toolCtx,
        directory: options.directory,
        worktree: options.worktree,
        ask: async (req) => {
          asked.push(req)
          await toolCtx.ask(req)
        },
      })
      const output = typeof result === "string" ? result : result.output
      const truncated = truncateOpenCodeToolOutput(output, options.maxOutputLength)
      const metadata = typeof result === "string" ? {} : (result.metadata ?? {})
      return {
        title: typeof result === "string" ? "" : (result.title ?? ""),
        output: truncated.truncated ? truncated.content : output,
        ...(typeof result === "string" || result.attachments === undefined ? {} : { attachments: result.attachments }),
        metadata: {
          ...metadata,
          asked,
          truncated: truncated.truncated,
          ...(truncated.truncated ? { outputPath: truncated.outputPath } : {}),
        },
      }
    },
  }
}

export function createOpenCodeToolRegistryProjection(input: {
  builtin?: OpenCodeToolDefinitionProjection[]
  custom?: OpenCodeToolDefinitionProjection[]
  pluginHooks?: OpenCodeHooksProjection[]
  pluginInput?: { directory: string; worktree: string }
  maxOutputLength?: number
  pluginService?: Pick<OpenCodePluginServiceProjection, "trigger">
} = {}): OpenCodeToolRegistryProjection {
  const builtin = input.builtin ?? builtinToolOrder.map((id) => basicTool(String(id)))
  const custom = [...(input.custom ?? [])]
  for (const hook of input.pluginHooks ?? []) {
    for (const [id, def] of Object.entries(hook.tool ?? {})) {
      custom.push(openCodeToolFromPluginProjection(id, def, {
        directory: input.pluginInput?.directory ?? "",
        worktree: input.pluginInput?.worktree ?? "",
        ...(input.maxOutputLength === undefined ? {} : { maxOutputLength: input.maxOutputLength }),
      }))
    }
  }
  const all = () => [...builtin, ...custom]
  return {
    ids() {
      return all().map((tool) => tool.id)
    },
    all,
    async tools(model) {
      const flags = model.flags ?? {}
      const filtered = all().filter((tool) => {
        if (tool.id === "search") return model.providerID === "opencode" || Boolean(flags.exa) || Boolean(flags.parallel)
        if (tool.id === "patch") return model.modelID.includes("gpt-") && !model.modelID.includes("oss") && !model.modelID.includes("gpt-4")
        if (tool.id === "repo_clone" || tool.id === "repo_overview") return Boolean(flags.experimentalScout)
        if (tool.id === "lsp") return Boolean(flags.experimentalLspTool)
        if (tool.id === "plan") return Boolean(flags.experimentalPlanMode) && flags.client === "cli"
        return true
      })
      if (!input.pluginService) return filtered
      const projected: OpenCodeToolDefinitionProjection[] = []
      for (const tool of filtered) {
        const output = {
          description: tool.description,
          parameters: tool.parameters,
          jsonSchema: tool.jsonSchema,
        }
        await input.pluginService.trigger("tool.definition", { toolID: tool.id }, output)
        const next: OpenCodeToolDefinitionProjection = {
          ...tool,
          description: String(output.description),
          parameters: output.parameters,
        }
        if (output.jsonSchema !== undefined && output.jsonSchema !== tool.jsonSchema) next.jsonSchema = output.jsonSchema
        projected.push(next)
      }
      return projected
    },
    named() {
      const task = all().find((tool) => tool.id === "task") ?? basicTool("task")
      const read = all().find((tool) => tool.id === "read") ?? basicTool("read")
      return { task, read }
    },
  }
}

export function openCodeCommandHints(template: string): string[] {
  const result: string[] = []
  const numbered = template.match(/\$\d+/g)
  if (numbered) result.push(...[...new Set(numbered)].sort())
  if (template.includes("$ARGUMENTS")) result.push("$ARGUMENTS")
  return result
}

export function createOpenCodeCommandRegistryProjection(input: {
  worktree: string
  configCommands?: Record<string, { template: string; description?: string; agent?: string; model?: string; subtask?: boolean }>
  mcpPrompts?: Record<string, { description?: string; template: string; arguments?: string[] }>
  skills?: Array<{ name: string; description?: string; content: string }>
}): OpenCodeCommandRegistryProjection {
  const commands: Record<string, OpenCodeCommandInfoProjection> = {
    init: {
      name: "init",
      description: "guided AGENTS.md setup",
      source: "command",
      template: `Initialize project instructions for ${input.worktree}`,
      hints: [],
    },
    review: {
      name: "review",
      description: "review changes [commit|branch|pr], defaults to uncommitted",
      source: "command",
      template: `Review changes in ${input.worktree} with $ARGUMENTS`,
      subtask: true,
      hints: ["$ARGUMENTS"],
    },
  }
  for (const [name, command] of Object.entries(input.configCommands ?? {})) {
    const next: OpenCodeCommandInfoProjection = {
      name,
      source: "command",
      template: command.template,
      hints: openCodeCommandHints(command.template),
    }
    if (command.agent !== undefined) next.agent = command.agent
    if (command.model !== undefined) next.model = command.model
    if (command.description !== undefined) next.description = command.description
    if (command.subtask !== undefined) next.subtask = command.subtask
    commands[name] = next
  }
  for (const [name, prompt] of Object.entries(input.mcpPrompts ?? {})) {
    const next: OpenCodeCommandInfoProjection = {
      name,
      source: "mcp",
      template: prompt.template,
      hints: prompt.arguments?.map((_, index) => `$${index + 1}`) ?? [],
    }
    if (prompt.description !== undefined) next.description = prompt.description
    commands[name] = next
  }
  for (const item of input.skills ?? []) {
    if (commands[item.name]) continue
    const next: OpenCodeCommandInfoProjection = {
      name: item.name,
      source: "skill",
      template: item.content,
      hints: [],
    }
    if (item.description !== undefined) next.description = item.description
    commands[item.name] = next
  }
  return {
    get(name) {
      return commands[name]
    },
    list() {
      return Object.values(commands)
    },
  }
}

export function createOpenCodeHookEventMapperProjection(hooks: OpenCodeHooksProjection): {
  dispatch(name: string, event: { payload?: unknown; sessionID?: string }): Promise<unknown>
  observed: string[]
} {
  const observed: string[] = []
  return {
    async dispatch(name, event) {
      if (name === "event" && hooks.event) {
        observed.push(String((event.payload as { type?: string } | undefined)?.type ?? "event"))
        await hooks.event({ event: record(event.payload) })
        return undefined
      }
      if (name === "tool.call" && hooks["tool.execute.before"]) {
        const payload = record(event.payload)
        const output = { args: record(payload["input"]) }
        await hooks["tool.execute.before"](
          { tool: String(payload["toolName"] ?? ""), sessionID: String(payload["sessionID"] ?? ""), callID: String(payload["toolCallID"] ?? "") },
          output,
        )
        return { input: output.args }
      }
      if (name === "tool.result" && hooks["tool.execute.after"]) {
        const payload = record(event.payload)
        const output = { title: String(payload["toolName"] ?? ""), output: textFromParts(payload["content"]), metadata: payload["details"] }
        await hooks["tool.execute.after"](
          { tool: String(payload["toolName"] ?? ""), sessionID: String(payload["sessionID"] ?? ""), callID: String(payload["toolCallID"] ?? ""), args: record(payload["input"]) },
          output,
        )
        return { content: [{ type: "text", text: output.output }], details: output.metadata }
      }
      if (name === "input" && hooks["chat.message"]) {
        const input = record(event.payload)
        const output = { ...input }
        await hooks["chat.message"](input, output)
        return output
      }
      if (name === "provider.request.before") {
        const result: Record<string, unknown> = {}
        if (hooks["chat.params"]) {
          const payload = record(event.payload)
          const output = {
            temperature: Number(payload["temperature"] ?? 0),
            topP: Number(payload["topP"] ?? 1),
            topK: Number(payload["topK"] ?? 0),
            maxOutputTokens: payload["maxOutputTokens"],
            options: record(payload["options"]),
          }
          await hooks["chat.params"](payload, output)
          result["providerOptions"] = output
        }
        if (hooks["chat.headers"]) {
          const output = { headers: {} as Record<string, string> }
          await hooks["chat.headers"](record(event.payload), output)
          result["headers"] = output.headers
        }
        return result
      }
      if (name === "shell.env" && hooks["shell.env"]) {
        const payload = record(event.payload)
        const output = { env: {} as Record<string, string> }
        await hooks["shell.env"](
          {
            cwd: String(payload["cwd"] ?? ""),
            ...(payload["sessionID"] ? { sessionID: String(payload["sessionID"]) } : {}),
            ...(payload["callID"] ? { callID: String(payload["callID"]) } : {}),
          },
          output,
        )
        return { env: output.env }
      }
      if (name === "command.before" && hooks["command.execute.before"]) {
        const payload = record(event.payload)
        const output = { parts: [] as unknown[] }
        await hooks["command.execute.before"](
          {
            command: String(payload["command"] ?? ""),
            sessionID: String(payload["sessionID"] ?? event.sessionID ?? ""),
            arguments: String(payload["arguments"] ?? ""),
          },
          output,
        )
        return output
      }
      if (name === "context" && hooks["experimental.chat.messages.transform"]) {
        const input = record(event.payload)
        const output = { ...input }
        await hooks["experimental.chat.messages.transform"](input, output)
        return output
      }
      if (name === "before_agent_start" && hooks["experimental.chat.system.transform"]) {
        const payload = record(event.payload)
        const output = { system: payload["systemPrompt"] ? [String(payload["systemPrompt"])] : [] }
        await hooks["experimental.chat.system.transform"](payload, output)
        return { systemPrompt: output.system.join("\n") }
      }
      if (name === "session.before_compact" && hooks["experimental.session.compacting"]) {
        const payload = record(event.payload)
        const sessionID = event.sessionID ?? (typeof payload["sessionID"] === "string" ? payload["sessionID"] : undefined)
        if (!sessionID) return undefined
        const output: { context: string[]; prompt?: string } = { context: [] }
        await hooks["experimental.session.compacting"]({ sessionID }, output)
        return { context: output.context, prompt: output.prompt }
      }
      if (name === "session.compact" && hooks["experimental.compaction.autocontinue"]) {
        const output = { enabled: true }
        await hooks["experimental.compaction.autocontinue"](record(event.payload), output)
        return { autocontinue: output.enabled }
      }
      if (name === "tool.definition" && hooks["tool.definition"]) {
        const payload = record(event.payload)
        const output = { description: "", parameters: undefined as unknown }
        await hooks["tool.definition"]({ toolID: String(payload["toolID"] ?? payload["name"] ?? "") }, output)
        return output
      }
      return undefined
    },
    observed,
  }
}

export function openCodeCollectPluginRegistriesProjection(input: {
  hooks: OpenCodeHooksProjection[]
  packages?: OpenCodePluginPackageProjection[]
}): {
    tools: string[]
    authProviders: string[]
    providerPlugins: string[]
    tuiTargets: string[]
  } {
  const tools = new Set<string>()
  const authProviders = new Set<string>()
  const providerPlugins = new Set<string>()
  const tuiTargets = new Set<string>()
  for (const hook of input.hooks) {
    for (const key of Object.keys(hook.tool ?? {})) tools.add(key)
    if (hook.auth?.provider) authProviders.add(hook.auth.provider)
    if (hook.provider?.id) providerPlugins.add(hook.provider.id)
  }
  for (const pkg of input.packages ?? []) {
    for (const target of openCodePluginManifestTargetsProjection(pkg)) {
      if (target.kind === "tui") tuiTargets.add(String(pkg.json["name"] ?? pkg.pkg))
    }
  }
  return {
    tools: [...tools].sort(),
    authProviders: [...authProviders].sort(),
    providerPlugins: [...providerPlugins].sort(),
    tuiTargets: [...tuiTargets].sort(),
  }
}

export async function buildOpenCodeHookLifecycleNativeExactFixtureAsync(): Promise<OpenCodeHookLifecycleNativeExactFixture> {
  const cases = await buildOpenCodeHookLifecycleNativeExactCases()
  return buildOpenCodeHookLifecycleNativeExactFixtureFromCases(cases)
}

export function buildOpenCodeHookLifecycleNativeExactFixture(): OpenCodeHookLifecycleNativeExactFixture {
  return buildOpenCodeHookLifecycleNativeExactFixtureFromCases(openCodeHookLifecycleNativeExactStaticCases)
}

export function verifyOpenCodeHookLifecycleNativeExactFixture(
  fixture: OpenCodeHookLifecycleNativeExactFixture,
): OpenCodeHookLifecycleNativeExactVerification {
  const issues: OpenCodeHookLifecycleNativeExactIssue[] = []
  const expected = buildOpenCodeHookLifecycleNativeExactFixture()
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)
  if (fixture.fingerprint !== expectedFingerprint) issues.push({ id: "opencode-hook-lifecycle-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical OpenCode hook lifecycle content." })
  if (fixture.product !== "opencode" || !sameJSON(fixture.atomIDs, openCodeHookLifecycleNativeExactAtomIDs)) issues.push({ id: "opencode-hook-lifecycle-native-exact.identity", message: "Fixture must stay scoped to the OpenCode hook lifecycle native atom group." })
  if (fixture.upstreamRef !== openCodeHookLifecycleUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) issues.push({ id: "opencode-hook-lifecycle-native-exact.upstream", message: "Fixture must stay pinned to the OpenCode hook lifecycle upstream sources." })
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) issues.push({ id: "opencode-hook-lifecycle-native-exact.native-claim", message: "OpenCode hook lifecycle fixture must explicitly claim native-exact parity." })
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) issues.push({ id: "opencode-hook-lifecycle-native-exact.lossiness", message: "Native exact OpenCode hook lifecycle fixture must not carry known lossiness markers." })
  if (!fixture.nativeEvidenceRefs.includes(openCodeHookLifecycleNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(openCodeHookLifecycleNativeExactReplayRef)) issues.push({ id: "opencode-hook-lifecycle-native-exact.evidence", message: "OpenCode hook lifecycle native exact evidence refs are missing." })
  if (!fixture.fixtureIDs.includes(openCodeHookLifecycleNativeExactFixtureID)) issues.push({ id: "opencode-hook-lifecycle-native-exact.fixture", message: "OpenCode hook lifecycle native exact fixture ID is missing." })
  if (!sameJSON(fixture.policy, expected.policy)) issues.push({ id: "opencode-hook-lifecycle-native-exact.policy", message: "OpenCode hook lifecycle native policy drifted from upstream plugin/registry semantics." })
  if (!sameJSON(fixture.cases, expected.cases)) issues.push({ id: "opencode-hook-lifecycle-native-exact.cases", message: "OpenCode hook lifecycle native cases drifted from upstream plugin/registry behavior." })
  if (!sameJSON(fixture.descriptors, expected.descriptors)) issues.push({ id: "opencode-hook-lifecycle-native-exact.descriptors", message: "OpenCode hook lifecycle native descriptors drifted from the fixture atom group." })
  return { ok: issues.length === 0, issues }
}

export function openCodeHookLifecyclePortForAtomID(id: OpenCodeHookLifecycleNativeExactAtomID): OpenCodeHookLifecycleNativeExactPortID {
  if (id === "opencode.plugin.hot-reload-cleanup") return "hook.cleanup-scope"
  if (id === "opencode.plugin.event-mapper") return "hook.handler-chain"
  if (id === "opencode.plugin.loader") return "hook.bus"
  if (id === "opencode.plugin.provider-registry-bridge") return "registry.provider"
  if (id === "opencode.plugin.ui-registry-bridge") return "registry.ui"
  if (id === "opencode.hook.error-defaults") return "hook.error-policy"
  if (id === "opencode.hook.handler-adapter") return "hook.handler-chain"
  if (id === "opencode.hook.observer-adapter") return "hook.observer-chain"
  if (id === "opencode.hook.plugin-bridge") return "hook.bus"
  if (id === "opencode.hook.scheduler-defaults") return "hook.scheduler"
  if (id === "opencode.registry.command") return "registry.command"
  if (id === "opencode.registry.provider-plugin") return "registry.provider"
  if (id === "opencode.registry.tool-definition") return "tool.registry"
  return "registry.ui"
}

async function buildOpenCodeHookLifecycleNativeExactCases(): Promise<OpenCodeHookLifecycleNativeExactCase[]> {
  const sequence: string[] = []
  const service = createOpenCodePluginServiceProjection()
  const pluginInput = { directory: "/repo", worktree: "/repo" }
  const firstPlugin: OpenCodePluginProjection = async () => ({
    event: ({ event }) => {
      sequence.push(`event:${event.type}`)
    },
    config: (config) => {
      sequence.push(`first.config:${config["mode"]}`)
    },
    "chat.params": async (_input, output) => {
      sequence.push("first.params")
      output["temperature"] = Number(output["temperature"]) + 0.1
      output["options"] = { ...(record(output["options"])), first: true }
    },
    "tool.definition": async (input, output) => {
      sequence.push(`first.definition:${input["toolID"]}`)
      output["description"] = `${output["description"]}|first`
    },
  })
  const secondPlugin: OpenCodePluginProjection = async () => ({
    config: () => {
      sequence.push("second.config")
      throw new Error("config boom")
    },
    "chat.params": async (_input, output) => {
      sequence.push("second.params")
      output["topP"] = 0.42
      output["options"] = { ...(record(output["options"])), second: true }
    },
    "tool.definition": async (_input, output) => {
      sequence.push("second.definition")
      output["parameters"] = { changed: true }
    },
  })
  await service.init({
    pluginInput,
    config: { mode: "native" },
    loaded: [
      {
        spec: "plugin-a",
        source: "npm",
        target: "/npm/plugin-a",
        entry: "file:///npm/plugin-a/server.js",
        pkg: packageProjection("plugin-a"),
        mod: { default: { server: firstPlugin } },
      },
      {
        spec: "plugin-b",
        source: "npm",
        target: "/npm/plugin-b",
        entry: "file:///npm/plugin-b/server.js",
        pkg: packageProjection("plugin-b"),
        mod: { default: { server: secondPlugin } },
      },
    ],
  })
  const params = await service.trigger("chat.params", { sessionID: "ses_1" }, { temperature: 0.2, topP: 1, topK: 0, options: {} })
  const definition = await service.trigger("tool.definition", { toolID: "shell" }, { description: "Shell", parameters: { type: "object" } })
  service.publishEvent({ type: "session.updated" })

  const origins = deduplicateOpenCodePluginOriginsProjection([
    { spec: "opencode-a@1.0.0", source: "/global/opencode.json", scope: "global" },
    { spec: ["opencode-a@2.0.0", { color: "blue" }], source: "/repo/.opencode/opencode.json", scope: "local" },
    { spec: "file:///repo/plugin.ts", source: "/repo/.opencode/opencode.json", scope: "local" },
    { spec: "file:///repo/plugin.ts", source: "/repo/.opencode/tui.json", scope: "local" },
  ])
  const loadProjection = loadOpenCodeExternalPluginsProjection({
    kind: "server",
    wait: () => {},
    candidates: [
      { origin: { spec: "opencode-openai-codex-auth", source: "/global", scope: "global" }, outcome: { type: "deprecated" } },
      { origin: { spec: "file:///repo/new-plugin", source: "/repo", scope: "local" }, outcome: { type: "install-error", message: "Plugin directory /repo/new-plugin is missing package.json or index file", retryOutcome: { type: "loaded", entry: "file:///repo/new-plugin/index.ts" } } },
      { origin: { spec: "theme-only", source: "/repo", scope: "local" }, outcome: { type: "missing", message: "Plugin theme-only does not expose a server entrypoint" } },
      { origin: { spec: "broken", source: "/repo", scope: "local" }, outcome: { type: "load-error", message: "Cannot find module broken" } },
      { origin: { spec: ["ok", { level: 1 }], source: "/repo", scope: "local" }, outcome: { type: "loaded", entry: "file:///repo/ok/server.js" } },
    ],
  })
  const packageTargets = openCodePluginManifestTargetsProjection({
    dir: "/pkg",
    pkg: "/pkg/package.json",
    json: {
      name: "pkg",
      main: "./main.js",
      exports: {
        "./tui": { import: "./tui.js", config: { slot: "home" } },
      },
      "oc-themes": ["./theme.json"],
    },
  })

  const toolDefinitionHook: OpenCodeHooksProjection = {
    "tool.definition": (_input, output) => {
      output["description"] = `${output["description"]} [plugin]`
      output["parameters"] = { type: "object", properties: { plugin: { type: "boolean" } } }
    },
    tool: {
      oc_trace: {
        description: "Trace",
        execute: async (_args, ctx) => {
          await ctx.ask({ permission: "tool", patterns: ["trace"], always: ["trace"], metadata: {} })
          return { title: "Trace", output: "abcdef", metadata: { source: "plugin" } }
        },
      },
      oc_schema: {
        description: "Schema",
        args: { name: { type: "string" }, depth: { type: "number" } },
        execute: () => "schema-ok",
      },
    },
  }
  const toolService = createOpenCodePluginServiceProjection()
  await toolService.init({ pluginInput, internal: [async () => toolDefinitionHook] })
  const registry = createOpenCodeToolRegistryProjection({
    pluginHooks: [toolDefinitionHook],
    pluginInput,
    maxOutputLength: 4,
    pluginService: toolService,
  })
  const opencodeTools = await registry.tools({ providerID: "opencode", modelID: "gpt-5", agent: "build", flags: { client: "cli", experimentalPlanMode: true } })
  const anthropicTools = await registry.tools({ providerID: "anthropic", modelID: "claude-sonnet-4", agent: "build", flags: { client: "cli" } })
  const pluginTrace = registry.all().find((tool) => tool.id === "oc_trace")!
  const traceResult = await pluginTrace.execute(
    {},
    {
      sessionID: "ses_1",
      messageID: "msg_1",
      agent: "build",
      ask: async () => {},
    },
  )

  const commands = createOpenCodeCommandRegistryProjection({
    worktree: "/repo",
    configCommands: {
      init: { template: "Project init $ARGUMENTS", description: "override init" },
      deploy: { template: "Deploy $2 then $1 and $ARGUMENTS", description: "deploy" },
    },
    mcpPrompts: {
      deploy: { template: "MCP deploy $1", description: "mcp deploy", arguments: ["env"] },
      docs: { template: "Docs prompt", description: "docs" },
    },
    skills: [
      { name: "deploy", description: "skill deploy skipped", content: "skip" },
      { name: "reviewer", description: "review skill", content: "Review skill" },
    ],
  })

  const mapperHook: OpenCodeHooksProjection = {
    event: ({ event }) => {
      sequence.push(`mapper.event:${event.type}`)
    },
    "tool.execute.before": (_input, output) => {
      output["args"] = { ...record(output["args"]), patched: true }
    },
    "tool.execute.after": (_input, output) => {
      output["title"] = "updated"
      output["output"] = `${output["output"]}!`
      output["metadata"] = { ok: true }
    },
    "chat.params": (_input, output) => {
      output["temperature"] = 0.5
      output["options"] = { ...(record(output["options"])), routed: true }
    },
    "chat.headers": (_input, output) => {
      output["headers"] = { "x-plugin": "yes" }
    },
    "experimental.chat.system.transform": (_input, output) => {
      const system = output["system"] as string[]
      system.push("plugin system")
    },
    "experimental.session.compacting": (_input, output) => {
      const context = output["context"] as string[]
      context.push("plugin context")
      output["prompt"] = "plugin prompt"
    },
    "experimental.compaction.autocontinue": (_input, output) => {
      output.enabled = false
    },
  }
  const mapper = createOpenCodeHookEventMapperProjection(mapperHook)
  const toolBefore = await mapper.dispatch("tool.call", { payload: { toolName: "shell", sessionID: "ses_1", toolCallID: "call_1", input: { cmd: "pwd" } } })
  const toolAfter = await mapper.dispatch("tool.result", { payload: { toolName: "shell", sessionID: "ses_1", toolCallID: "call_1", input: {}, content: [{ type: "text", text: "done" }], details: { exitCode: 0 } } })
  const providerBefore = await mapper.dispatch("provider.request.before", { payload: { temperature: 1, topP: 1, options: { base: true } } })
  const compactMissing = await mapper.dispatch("session.before_compact", { payload: {} })
  const compactReady = await mapper.dispatch("session.before_compact", { payload: { sessionID: "ses_1" } })
  const system = await mapper.dispatch("before_agent_start", { payload: { systemPrompt: "base" } })
  const autocontinue = await mapper.dispatch("session.compact", { payload: { sessionID: "ses_1" } })
  const registries = openCodeCollectPluginRegistriesProjection({
    hooks: [
      {
        tool: { ask_docs: toolDefinition("Docs") },
        auth: { provider: "github-copilot" },
        provider: { id: "custom-provider" },
      },
    ],
    packages: [
      {
        dir: "/pkg",
        pkg: "/pkg/package.json",
        json: { name: "slot-pack", exports: { "./tui": "./tui.js" } },
      },
    ],
  })

  const v1Module = {
    default: {
      id: "local-plugin",
      server: async () => ({ "chat.headers": (_input: Record<string, unknown>, output: OpenCodeHookOutput) => { output["headers"] = { local: "1" } } }),
    },
  }
  const legacy = async () => ({ tool: { legacy_tool: toolDefinition("Legacy") } })
  const shared = { server: legacy }
  const legacyPlugins = openCodeLegacyServerPluginsProjection({ first: shared, second: shared })
  const v1Hooks: OpenCodeHooksProjection[] = []
  await applyOpenCodeLoadedPluginProjection({ spec: "file:///repo/plugin.ts", source: "file", target: "file:///repo/plugin.ts", entry: "file:///repo/plugin.ts", mod: v1Module }, pluginInput, v1Hooks)
  const fileIDError = captureError(() => resolveOpenCodePluginIDProjection("file", "file:///repo/no-id.ts", "file:///repo/no-id.ts"))
  const bothError = captureError(() => readOpenCodeV1PluginProjection({ default: { server: async () => ({}), tui: async () => undefined } }, "bad", "server"))

  return [
    hookCase(
      "plugin-service-trigger-and-event-order",
      { plugins: ["plugin-a", "plugin-b"], hooks: ["config", "chat.params", "tool.definition", "event"] },
      {
        hookCount: service.list().length,
        sequence,
        configErrors: service.configErrors(),
        params,
        definition,
        eventCalls: service.eventCalls(),
      },
      "Plugin.layer applies loaded server plugins sequentially, invokes config on every hook after loading while ignoring config failures, trigger awaits each matching hook in state order and returns the mutated output, and bus events call each hook.event without blocking publisher state.",
    ),
    hookCase(
      "plugin-loader-config-dedupe-and-entrypoints",
      { origins: ["opencode-a@1.0.0", "opencode-a@2.0.0", "file:///repo/plugin.ts"], candidates: ["deprecated", "retry-file", "missing", "broken", "ok"] },
      {
        deduped: origins.map((origin) => [openCodePluginSpecifier(origin.spec), origin.source]),
        loaded: loadProjection.loaded,
        report: loadProjection.report,
        packageTargets,
      },
      "ConfigPlugin.deduplicatePluginOrigins walks merged origins from the end so the last config wins by npm package or exact file URL; PluginLoader skips deprecated packages, reports missing/install/entry/compat/load stages, retries only retryable file install failures after dependency wait, and uses the same shared resolver for server and tui entrypoints.",
    ),
    hookCase(
      "tool-registry-plugin-tools-and-definition-hook",
      { providerIDs: ["opencode", "anthropic"], pluginTools: ["oc_trace", "oc_schema"] },
      {
        allOrder: registry.ids(),
        named: Object.keys(registry.named()),
        opencodeTools: opencodeTools.map((tool) => [tool.id, tool.description]),
        anthropicHasSearch: anthropicTools.some((tool) => tool.id === "search"),
        pluginSchema: registry.all().find((tool) => tool.id === "oc_schema")?.jsonSchema,
        traceResult,
      },
      "ToolRegistry builds builtins first, then config/custom tools, then plugin hook tools; plugin tool args default to {}, non-Zod args produce a legacy required JSON schema, execute bridges ask/directory/worktree and normalizes string or object results with truncation metadata, and tool.definition hooks mutate the filtered tool definitions before model use.",
    ),
    hookCase(
      "command-registry-default-config-mcp-skill",
      { defaults: ["init", "review"], config: ["init", "deploy"], mcp: ["deploy", "docs"], skills: ["deploy", "reviewer"] },
      {
        names: commands.list().map((command) => `${command.name}:${command.source}`),
        init: commands.get("init"),
        deploy: commands.get("deploy"),
        reviewer: commands.get("reviewer"),
        hints: openCodeCommandHints("Run $2 then $1 with $ARGUMENTS and $1"),
      },
      "Command.layer seeds init/review defaults, config commands overwrite defaults, MCP prompts overwrite config commands and lazily supply argument hints, and skills are added only when their name is not already registered.",
    ),
    hookCase(
      "event-mapper-provider-workspace-registries",
      { events: ["tool.call", "tool.result", "provider.request.before", "before_agent_start", "session.before_compact", "session.compact"], registries: ["tool", "auth", "provider", "tui"] },
      {
        toolBefore,
        toolAfter,
        providerBefore,
        compactMissing,
        compactReady,
        system,
        autocontinue,
        registries,
      },
      "OpenCode Hooks expose event, provider request, tool execution, command, context, system, session compaction, and tool.definition hooks; the adapter event mapper preserves upstream input/output defaults, and plugin registries expose tool/auth/provider hooks plus tui plugin entrypoint targets.",
    ),
    hookCase(
      "shared-plugin-resolution-and-v1-legacy",
      { modules: ["v1", "legacy", "invalid"], ids: ["file", "npm"] },
      {
        v1HookCount: v1Hooks.length,
        legacyCount: legacyPlugins.length,
        npmFallbackID: resolveOpenCodePluginIDProjection("npm", "pkg-a", "/npm/pkg-a", undefined, packageProjection("pkg-a")),
        fileIDError,
        bothError,
      },
      "readV1Plugin detects default object plugins and requires exactly one server or tui function; path plugins must export a non-empty id, npm plugins fallback to package.json name, and legacy modules are deduped by export identity while every export must resolve to a server function.",
    ),
  ]
}

function buildOpenCodeHookLifecycleNativeExactFixtureFromCases(cases: OpenCodeHookLifecycleNativeExactCase[]): OpenCodeHookLifecycleNativeExactFixture {
  const fixture = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomIDs: openCodeHookLifecycleNativeExactAtomIDs,
    portIDs: unique(openCodeHookLifecycleNativeExactAtomIDs.map(openCodeHookLifecyclePortForAtomID)),
    upstreamRef: openCodeHookLifecycleUpstreamRef,
    evidenceRef: openCodeHookLifecycleNativeExactEvidenceRef,
    fixtureID: openCodeHookLifecycleNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      hooksUsePublicPluginApiMethodNames: true,
      pluginTriggerAwaitsHooksSequentiallyAndMutatesSharedOutput: true,
      configHookRunsAfterAllPluginsAndConfigErrorsAreIgnored: true,
      busEventHookIsInvokedForEveryLoadedHookWithoutBlockingPublisher: true,
      loaderSkipsDeprecatedPackagesAndReportsStageSpecificFailures: true,
      loaderRetriesOnlyRetryableFilePluginInstallFailuresAfterDependencyWait: true,
      configPluginOriginsDedupeByFileURLOrNpmPackageWithLastConfigWinning: true,
      pluginServerAndTuiEntrypointsUseTheSameSharedResolver: true,
      v1PluginModulesRequireExactlyOneServerOrTuiFunction: true,
      legacyPluginExportsAreDedupeByExportIdentityAndMustResolveToServerFunctions: true,
      pathPluginsMustExportAnExplicitIDWhileNpmPluginsFallbackToPackageName: true,
      toolRegistryOrdersBuiltinThenCustomThenPluginTools: true,
      pluginToolArgsDefaultToEmptyObjectAndLegacyJsonSchemaRequiresAllProperties: true,
      pluginToolExecuteBridgesAskDirectoryWorktreeAndNormalizesStringOrObjectResults: true,
      toolDefinitionHookMutatesFilteredToolDescriptionsBeforeProviderCall: true,
      commandRegistryAppliesDefaultThenConfigThenMcpThenNonDuplicateSkills: true,
      eventMapperTranslatesLegoEventsToOpenCodeHookInputsAndOutputs: true,
      pluginRegistriesExposeToolAuthProviderAndTuiTargetsFromNativeHooks: true,
      allHookAtomsShareNativeLifecycleFixture: true,
    },
    cases,
    sourceRefs: [
      `${openCodeHookLifecycleUpstreamRef}:packages/plugin/src/index.ts#Hooks,PluginInput,PluginModule`,
      `${openCodeHookLifecycleUpstreamRef}:packages/plugin/src/tool.ts#tool,ToolDefinition,ToolContext`,
      `${openCodeHookLifecycleUpstreamRef}:packages/plugin/src/tui.ts#TuiPlugin,TuiPluginModule,TuiPluginApi`,
      `${openCodeHookLifecycleUpstreamRef}:packages/opencode/src/plugin/index.ts#Plugin.layer,trigger,list,applyPlugin,getLegacyPlugins`,
      `${openCodeHookLifecycleUpstreamRef}:packages/opencode/src/plugin/loader.ts#PluginLoader.plan,resolve,load,loadExternal`,
      `${openCodeHookLifecycleUpstreamRef}:packages/opencode/src/plugin/shared.ts#readV1Plugin,resolvePluginId,createPluginEntry,readPackageThemes`,
      `${openCodeHookLifecycleUpstreamRef}:packages/opencode/src/config/plugin.ts#resolvePluginSpec,deduplicatePluginOrigins`,
      `${openCodeHookLifecycleUpstreamRef}:packages/opencode/src/tool/registry.ts#ToolRegistry.fromPlugin,tools,named,webSearchEnabled`,
      `${openCodeHookLifecycleUpstreamRef}:packages/opencode/src/command/index.ts#Command.layer,hints`,
      `${openCodeHookLifecycleUpstreamRef}:packages/opencode/src/permission/index.ts#Permission.ask,reply,evaluate,fromConfig`,
      `${openCodeHookLifecycleUpstreamRef}:packages/opencode/src/plugin/install.ts#packageTargets,patchPluginConfig`,
    ],
    nativeEvidenceRefs: [openCodeHookLifecycleNativeExactEvidenceRef, openCodeHookLifecycleNativeExactReplayRef],
    fixtureIDs: [openCodeHookLifecycleNativeExactFixtureID],
    knownLossiness: [],
    descriptors: openCodeHookLifecycleNativeDescriptors,
  } satisfies Omit<OpenCodeHookLifecycleNativeExactFixture, "fingerprint">
  return { ...fixture, fingerprint: fingerprintObject(fixture) }
}

const openCodeHookLifecycleNativeExactStaticCases: OpenCodeHookLifecycleNativeExactCase[] = [
  hookCase(
    "plugin-service-trigger-and-event-order",
    { plugins: ["plugin-a", "plugin-b"], hooks: ["config", "chat.params", "tool.definition", "event"] },
    {
      hookCount: 2,
      sequence: [
        "first.config:native",
        "second.config",
        "first.params",
        "second.params",
        "first.definition:shell",
        "second.definition",
        "event:session.updated",
      ],
      configErrors: ["config boom"],
      params: { temperature: 0.30000000000000004, topP: 0.42, topK: 0, options: { first: true, second: true } },
      definition: { description: "Shell|first", parameters: { changed: true } },
      eventCalls: ["session.updated"],
    },
    "Plugin.layer applies loaded server plugins sequentially, invokes config on every hook after loading while ignoring config failures, trigger awaits each matching hook in state order and returns the mutated output, and bus events call each hook.event without blocking publisher state.",
  ),
  hookCase(
    "plugin-loader-config-dedupe-and-entrypoints",
    { origins: ["opencode-a@1.0.0", "opencode-a@2.0.0", "file:///repo/plugin.ts"], candidates: ["deprecated", "retry-file", "missing", "broken", "ok"] },
    {
      deduped: [["opencode-a@2.0.0", "/repo/.opencode/opencode.json"], ["file:///repo/plugin.ts", "/repo/.opencode/tui.json"]],
      loaded: [
        { spec: "file:///repo/new-plugin", source: "file", entry: "file:///repo/new-plugin/index.ts", retry: true },
        { spec: "ok", source: "npm", entry: "file:///repo/ok/server.js", retry: false },
      ],
      report: {
        start: ["file:///repo/new-plugin:false", "theme-only:false", "broken:false", "ok:false", "file:///repo/new-plugin:true"],
        missing: ["theme-only:false:Plugin theme-only does not expose a server entrypoint"],
        errors: [
          "file:///repo/new-plugin:false:install:Plugin directory /repo/new-plugin is missing package.json or index file",
          "broken:false:load:Cannot find module broken",
        ],
        waitCount: 1,
      },
      packageTargets: [{ kind: "server" }, { kind: "tui", opts: { slot: "home" } }],
    },
    "ConfigPlugin.deduplicatePluginOrigins walks merged origins from the end so the last config wins by npm package or exact file URL; PluginLoader skips deprecated packages, reports missing/install/entry/compat/load stages, retries only retryable file install failures after dependency wait, and uses the same shared resolver for server and tui entrypoints.",
  ),
  hookCase(
    "tool-registry-plugin-tools-and-definition-hook",
    { providerIDs: ["opencode", "anthropic"], pluginTools: ["oc_trace", "oc_schema"] },
    {
      allOrder: ["invalid", "question", "shell", "read", "glob", "grep", "edit", "write", "task", "fetch", "todo", "search", "repo_clone", "repo_overview", "skill", "patch", "lsp", "plan", "oc_trace", "oc_schema"],
      named: ["task", "read"],
      opencodeTools: [
        ["invalid", "invalid [plugin]"],
        ["question", "question [plugin]"],
        ["shell", "shell [plugin]"],
        ["read", "read [plugin]"],
        ["glob", "glob [plugin]"],
        ["grep", "grep [plugin]"],
        ["edit", "edit [plugin]"],
        ["write", "write [plugin]"],
        ["task", "task [plugin]"],
        ["fetch", "fetch [plugin]"],
        ["todo", "todo [plugin]"],
        ["search", "search [plugin]"],
        ["skill", "skill [plugin]"],
        ["patch", "patch [plugin]"],
        ["plan", "plan [plugin]"],
        ["oc_trace", "Trace [plugin]"],
        ["oc_schema", "Schema [plugin]"],
      ],
      anthropicHasSearch: false,
      pluginSchema: { type: "object", properties: { name: { type: "string" }, depth: { type: "number" } }, required: ["name", "depth"] },
      traceResult: { title: "Trace", output: "abcd", metadata: { source: "plugin", asked: [{ permission: "tool", patterns: ["trace"], always: ["trace"], metadata: {} }], truncated: true, outputPath: "/tmp/opencode-tool-output.txt" } },
    },
    "ToolRegistry builds builtins first, then config/custom tools, then plugin hook tools; plugin tool args default to {}, non-Zod args produce a legacy required JSON schema, execute bridges ask/directory/worktree and normalizes string or object results with truncation metadata, and tool.definition hooks mutate the filtered tool definitions before model use.",
  ),
  hookCase(
    "command-registry-default-config-mcp-skill",
    { defaults: ["init", "review"], config: ["init", "deploy"], mcp: ["deploy", "docs"], skills: ["deploy", "reviewer"] },
    {
      names: ["init:command", "review:command", "deploy:mcp", "docs:mcp", "reviewer:skill"],
      init: { name: "init", description: "override init", source: "command", template: "Project init $ARGUMENTS", hints: ["$ARGUMENTS"] },
      deploy: { name: "deploy", source: "mcp", description: "mcp deploy", template: "MCP deploy $1", hints: ["$1"] },
      reviewer: { name: "reviewer", description: "review skill", source: "skill", template: "Review skill", hints: [] },
      hints: ["$1", "$2", "$ARGUMENTS"],
    },
    "Command.layer seeds init/review defaults, config commands overwrite defaults, MCP prompts overwrite config commands and lazily supply argument hints, and skills are added only when their name is not already registered.",
  ),
  hookCase(
    "event-mapper-provider-workspace-registries",
    { events: ["tool.call", "tool.result", "provider.request.before", "before_agent_start", "session.before_compact", "session.compact"], registries: ["tool", "auth", "provider", "tui"] },
    {
      toolBefore: { input: { cmd: "pwd", patched: true } },
      toolAfter: { content: [{ type: "text", text: "done!" }], details: { ok: true } },
      providerBefore: { providerOptions: { temperature: 0.5, topP: 1, topK: 0, maxOutputTokens: undefined, options: { base: true, routed: true } }, headers: { "x-plugin": "yes" } },
      compactMissing: undefined,
      compactReady: { context: ["plugin context"], prompt: "plugin prompt" },
      system: { systemPrompt: "base\nplugin system" },
      autocontinue: { autocontinue: false },
      registries: {
        tools: ["ask_docs"],
        authProviders: ["github-copilot"],
        providerPlugins: ["custom-provider"],
        tuiTargets: ["slot-pack"],
      },
    },
    "OpenCode Hooks expose event, provider request, tool execution, command, context, system, session compaction, and tool.definition hooks; the adapter event mapper preserves upstream input/output defaults, and plugin registries expose tool/auth/provider hooks plus tui plugin entrypoint targets.",
  ),
  hookCase(
    "shared-plugin-resolution-and-v1-legacy",
    { modules: ["v1", "legacy", "invalid"], ids: ["file", "npm"] },
    {
      v1HookCount: 1,
      legacyCount: 1,
      npmFallbackID: "pkg-a",
      fileIDError: "Path plugin file:///repo/no-id.ts must export id",
      bothError: "Plugin bad must default export either server() or tui(), not both",
    },
    "readV1Plugin detects default object plugins and requires exactly one server or tui function; path plugins must export a non-empty id, npm plugins fallback to package.json name, and legacy modules are deduped by export identity while every export must resolve to a server function.",
  ),
]

function hookDescriptor(
  id: OpenCodeHookLifecycleNativeExactAtomID,
  port: OpenCodeHookLifecycleNativeExactPortID,
  selectionReason: string,
): OpenCodeHookLifecycleNativeDescriptor {
  return { ...descriptorBase, id, port, selectionReason }
}

function hookCase(
  scenarioID: OpenCodeHookLifecycleNativeExactScenarioID,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  upstreamBehavior: string,
): OpenCodeHookLifecycleNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function openCodeHookLifecycleSelectionReason(id: OpenCodeHookLifecycleNativeExactAtomID): string {
  const native = " Upstream native implementation is captured by the OpenCode hook lifecycle native exact fixture."
  if (id.startsWith("opencode.hook.")) return `OpenCode public Hooks trigger, event subscription, config hook, and source-ordered plugin lifecycle behavior from packages/plugin/src/index.ts and packages/opencode/src/plugin/index.ts.${native}`
  if (id === "opencode.plugin.loader") return `OpenCode PluginLoader, shared server/tui entrypoint resolver, V1 module reader, and config origin dedupe behavior from plugin/loader.ts, plugin/shared.ts, and config/plugin.ts.${native}`
  if (id === "opencode.plugin.event-mapper") return `OpenCode Hooks API event mapper behavior for tool, provider, command, context, system, session compaction, and tool.definition hooks from packages/plugin/src/index.ts.${native}`
  if (id === "opencode.plugin.hot-reload-cleanup") return `OpenCode plugin metadata touch, reload identity, and loader cleanup semantics from plugin/meta.ts, plugin/loader.ts, and TUI plugin lifecycle sources.${native}`
  if (id === "opencode.registry.tool-definition") return `OpenCode ToolRegistry native plugin-tool wrapping and tool.definition mutation behavior from tool/registry.ts and packages/plugin/src/tool.ts.${native}`
  if (id === "opencode.registry.command") return `OpenCode Command registry default/config/MCP/skill merge behavior from command/index.ts.${native}`
  if (id === "opencode.registry.provider-plugin" || id === "opencode.plugin.provider-registry-bridge") return `OpenCode auth/provider plugin hook registry behavior from packages/plugin/src/index.ts and provider/provider.ts.${native}`
  return `OpenCode TUI plugin target and UI registry behavior from packages/plugin/src/tui.ts, plugin/shared.ts, and plugin/install.ts.${native}`
}

function openCodePluginLoaderAttemptProjection(
  candidate: OpenCodePluginLoaderCandidateProjection,
  kind: "server" | "tui",
  retry: boolean,
  report: OpenCodePluginLoaderReportProjection,
): { value?: { spec: string; source: "file" | "npm"; entry: string; retry: boolean }; retry: boolean } {
  const spec = openCodePluginSpecifier(candidate.origin.spec)
  const source = openCodePluginSourceForSpec(spec)
  if (candidate.outcome.type === "deprecated" || deprecatedPluginPackages.some((pkg) => spec.includes(pkg))) return { retry: false }
  report.start.push(`${spec}:${retry}`)
  if (candidate.outcome.type === "missing") {
    const message = candidate.outcome.message ?? `Plugin ${spec} does not expose a ${kind} entrypoint`
    report.missing.push(`${spec}:${retry}:${message}`)
    return { retry: false }
  }
  if (candidate.outcome.type === "loaded") {
    return {
      value: {
        spec,
        source,
        entry: candidate.outcome.entry ?? `${source === "file" ? spec : `file:///node_modules/${spec}`}/${kind}.js`,
        retry,
      },
      retry: false,
    }
  }
  const stage = candidate.outcome.type === "install-error"
    ? "install"
    : candidate.outcome.type === "entry-error"
      ? "entry"
      : candidate.outcome.type === "compatibility-error"
        ? "compatibility"
        : "load"
  report.errors.push(`${spec}:${retry}:${stage}:${candidate.outcome.message}`)
  return {
    retry: source === "file" && stage === "install" && candidate.outcome.message.includes("missing package.json or index file"),
  }
}

function openCodePluginSourceForSpec(spec: string): "file" | "npm" {
  return spec.startsWith("file://") || spec.startsWith(".") || spec.startsWith("/") || /^[A-Za-z]:[\\/]/.test(spec) ? "file" : "npm"
}

function openCodeServerPluginFromExport(value: unknown): OpenCodePluginProjection | undefined {
  if (typeof value === "function") return value as OpenCodePluginProjection
  if (!isRecord(value)) return undefined
  const server = value["server"]
  return typeof server === "function" ? server as OpenCodePluginProjection : undefined
}

function exportTargetProjection(value: unknown): { opts?: Record<string, unknown> } | undefined {
  const entry = (() => {
    if (typeof value === "string") return value.trim()
    if (!isRecord(value)) return undefined
    for (const key of ["import", "default"]) {
      const nested = value[key]
      if (typeof nested === "string" && nested.trim()) return nested.trim()
    }
    return undefined
  })()
  if (!entry) return undefined
  const opts = isRecord(value) && isRecord(value["config"]) ? value["config"] : undefined
  return { ...(opts ? { opts } : {}) }
}

function basicTool(id: string): OpenCodeToolDefinitionProjection {
  return {
    id,
    description: id,
    parameters: { type: "object" },
    jsonSchema: { type: "object", properties: {}, required: [] },
    async execute() {
      return { title: id, output: id, metadata: { truncated: false } }
    },
  }
}

function toolDefinition(description: string): OpenCodePluginToolDefinitionProjection {
  return {
    description,
    execute: () => description,
  }
}

function packageProjection(name: string): OpenCodePluginPackageProjection {
  return { dir: `/npm/${name}`, pkg: `/npm/${name}/package.json`, json: { name } }
}

function legacyJsonSchema(entries: [string, unknown][]): Record<string, unknown> {
  const properties = Object.fromEntries(entries.filter((entry): entry is [string, Record<string, unknown> | boolean] => isJsonSchemaDefinition(entry[1])))
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
  }
}

function isJsonSchemaDefinition(value: unknown): value is Record<string, unknown> | boolean {
  return typeof value === "boolean" || (typeof value === "object" && value !== null && !Array.isArray(value))
}

function isZodLike(value: unknown): boolean {
  return typeof value === "object" && value !== null && "_zod" in value
}

function truncateOpenCodeToolOutput(output: string, maxOutputLength: number | undefined): { truncated: boolean; content: string; outputPath?: string } {
  if (!maxOutputLength || output.length <= maxOutputLength) return { truncated: false, content: output }
  return { truncated: true, content: output.slice(0, maxOutputLength), outputPath: path.join("/tmp", "opencode-tool-output.txt") }
}

function textFromParts(parts: unknown): string {
  if (!Array.isArray(parts)) return ""
  return parts
    .map((part) => {
      if (!isRecord(part)) return ""
      if (part["type"] === "text" || part["type"] === "reasoning") return String(part["text"] ?? "")
      if (part["type"] === "tool_result") return textFromParts(part["content"])
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

function captureError(fn: () => unknown): string {
  try {
    fn()
    return ""
  } catch (error) {
    return errorMessage(error)
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function record(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function sameJSON(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (typeof value === "undefined") return "\"__undefined__\""
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const item = value as Record<string, unknown>
  return `{${Object.keys(item).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(item[key])}`).join(",")}}`
}
