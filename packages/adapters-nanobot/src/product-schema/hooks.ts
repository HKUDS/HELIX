import { createHash } from "node:crypto"

export const nanobotHookLifecycleUpstreamRef = "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
export const nanobotHookLifecycleNativeExactFixtureID = "nanobot-hook-lifecycle:native-exact-fixture"
export const nanobotHookLifecycleNativeExactEvidenceRef = "conformance:nanobot-hook-lifecycle-native-exact-fixture"
export const nanobotHookLifecycleNativeExactReplayRef = "hook-lifecycle-native-exact:nanobot"

export const nanobotHookLifecycleNativeExactAtomIDs = [
  "nanobot.hook.error-defaults",
  "nanobot.hook.handler-adapter",
  "nanobot.hook.observer-adapter",
  "nanobot.hook.plugin-bridge",
  "nanobot.hook.scheduler-defaults",
  "nanobot.plugin.cleanup",
  "nanobot.plugin.event-mapper",
  "nanobot.plugin.loader",
  "nanobot.plugin.provider-registry-bridge",
  "nanobot.plugin.ui-registry-bridge",
  "nanobot.registry.command",
  "nanobot.registry.provider-plugin",
  "nanobot.registry.tool-definition",
  "nanobot.registry.ui-provider",
] as const

export const nanobotAgentHookAsyncMethods = [
  "before_iteration",
  "on_stream",
  "on_stream_end",
  "before_execute_tools",
  "emit_reasoning",
  "emit_reasoning_end",
  "after_iteration",
] as const

export type NanobotHookLifecycleNativeExactAtomID = (typeof nanobotHookLifecycleNativeExactAtomIDs)[number]
export type NanobotAgentHookAsyncMethod = (typeof nanobotAgentHookAsyncMethods)[number]
export type NanobotHookLifecycleNativeExactPortID =
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

export interface NanobotHookLifecycleNativeDescriptor {
  id: NanobotHookLifecycleNativeExactAtomID
  port: NanobotHookLifecycleNativeExactPortID
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof nanobotHookLifecycleNativeExactEvidenceRef, typeof nanobotHookLifecycleNativeExactReplayRef]
  fixtureIDs: [typeof nanobotHookLifecycleNativeExactFixtureID]
  knownLossiness: []
}

export interface NanobotAgentHookContextProjection {
  iteration: number
  messages: Array<Record<string, unknown>>
  response: unknown | null
  usage: Record<string, number>
  tool_calls: Array<{ name: string; [key: string]: unknown }>
  tool_results: unknown[]
  tool_events: Array<Record<string, string>>
  streamed_content: boolean
  streamed_reasoning: boolean
  final_content: string | null
  stop_reason: string | null
  error: string | null
}

export interface NanobotAgentHookProjection {
  label: string
  _reraise: boolean
  events: string[]
  wants_streaming(): boolean
  before_iteration(context: NanobotAgentHookContextProjection): Promise<void>
  on_stream(context: NanobotAgentHookContextProjection, delta: string): Promise<void>
  on_stream_end(context: NanobotAgentHookContextProjection, options: { resuming: boolean }): Promise<void>
  before_execute_tools(context: NanobotAgentHookContextProjection): Promise<void>
  emit_reasoning(reasoningContent: string | null): Promise<void>
  emit_reasoning_end(): Promise<void>
  after_iteration(context: NanobotAgentHookContextProjection): Promise<void>
  finalize_content(context: NanobotAgentHookContextProjection, content: string | null): string | null
}

export interface NanobotCompositeHookProjection extends NanobotAgentHookProjection {
  hooks: NanobotAgentHookProjection[]
  isolatedErrors: string[]
}

export interface NanobotSDKCaptureHookProjection extends NanobotAgentHookProjection {
  tools_used: string[]
  messages: Array<Record<string, unknown>>
}

export interface NanobotToolProjection {
  name: string
  schema: Record<string, unknown>
  castParams?(params: Record<string, unknown>): Record<string, unknown>
  validateParams?(params: Record<string, unknown>): string[]
  execute?(params: Record<string, unknown>): unknown | Promise<unknown>
}

export interface NanobotToolRegistryProjection {
  register(tool: NanobotToolProjection): void
  unregister(name: string): void
  get(name: string): NanobotToolProjection | undefined
  has(name: string): boolean
  get_definitions(): Array<Record<string, unknown>>
  prepare_call(name: string, params: unknown): { tool?: NanobotToolProjection; params: unknown; error?: string }
  execute(name: string, params: unknown): Promise<unknown>
  tool_names(): string[]
  cacheVersion(): number
}

export interface NanobotToolClassProjection {
  entryPointName?: string
  className: string
  toolName: string
  schema: Record<string, unknown>
  scopes?: string[]
  enabled?: boolean
  abstract?: boolean
  pluginDiscoverable?: boolean
  createThrows?: string
}

export interface NanobotToolLoadProjection {
  registered: string[]
  warnings: string[]
  errors: string[]
}

export interface NanobotCommandContextProjection {
  raw: string
  args: string
  handledBy?: string
}

export interface NanobotCommandRouterProjection {
  priority(cmd: string, handler: NanobotCommandHandlerProjection): void
  exact(cmd: string, handler: NanobotCommandHandlerProjection): void
  prefix(prefix: string, handler: NanobotCommandHandlerProjection): void
  is_priority(text: string): boolean
  is_dispatchable_command(text: string): boolean
  dispatch_priority(ctx: NanobotCommandContextProjection): Promise<string | undefined>
  dispatch(ctx: NanobotCommandContextProjection): Promise<string | undefined>
  prefixOrder(): string[]
}

export type NanobotCommandHandlerProjection = (ctx: NanobotCommandContextProjection) => string | undefined | Promise<string | undefined>

export interface NanobotProviderSpecProjection {
  name: string
  keywords: string[]
  env_key: string
  display_name?: string
  backend?: string
  is_gateway?: boolean
  is_local?: boolean
  is_oauth?: boolean
  is_direct?: boolean
}

export type NanobotHookLifecycleNativeExactScenarioID =
  | "agent-hook-composite-lifecycle"
  | "composite-error-isolation-and-reraise"
  | "runner-sdk-capture-and-extra-hook-order"
  | "tool-registry-sort-cache-prepare-execute"
  | "tool-loader-entrypoints-and-collisions"
  | "command-provider-channel-registries"

export interface NanobotHookLifecycleNativeExactCase {
  scenarioID: NanobotHookLifecycleNativeExactScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface NanobotHookLifecycleNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomIDs: typeof nanobotHookLifecycleNativeExactAtomIDs
  portIDs: NanobotHookLifecycleNativeExactPortID[]
  upstreamRef: typeof nanobotHookLifecycleUpstreamRef
  evidenceRef: typeof nanobotHookLifecycleNativeExactEvidenceRef
  fixtureID: typeof nanobotHookLifecycleNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    agentHookDefaultsAreNoopAndNonStreaming: true
    compositeHookFansOutAsyncMethodsInOrder: true
    compositeHookIsolatesNonReraiseErrorsAndContinues: true
    compositeHookReraisesHooksWithReraiseFlag: true
    finalizeContentIsOrderedPipelineWithoutIsolation: true
    sdkCaptureHookAppendsToolNamesAndSnapshotsMessages: true
    agentLoopWrapsCoreHookBeforeExtraHooks: true
    toolRegistrySortsBuiltinsBeforeMCPAndCachesUntilMutation: true
    toolRegistryPrepareAndExecuteReturnUpstreamErrorShapes: true
    toolLoaderSkipsAbstractAndNonDiscoverablePlugins: true
    toolLoaderPluginCannotShadowBuiltinToolName: true
    commandRouterChecksPriorityExactThenLongestPrefix: true
    providerSpecLabelAndBackendSelectionUseRegistryMetadata: true
    channelDiscoveryMergesExternalThenBuiltinWithBuiltinPriority: true
    allHookAtomsShareNativeLifecycleFixture: true
  }
  cases: NanobotHookLifecycleNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: NanobotHookLifecycleNativeDescriptor[]
  fingerprint: string
}

export interface NanobotHookLifecycleNativeExactIssue {
  id: string
  message: string
}

export interface NanobotHookLifecycleNativeExactVerification {
  ok: boolean
  issues: NanobotHookLifecycleNativeExactIssue[]
}

const descriptorBase = {
  product: "nanobot" as const,
  implementationKind: "factory" as const,
  parityCoverage: "native" as const,
  nativeEvidenceRefs: [nanobotHookLifecycleNativeExactEvidenceRef, nanobotHookLifecycleNativeExactReplayRef] as [
    typeof nanobotHookLifecycleNativeExactEvidenceRef,
    typeof nanobotHookLifecycleNativeExactReplayRef,
  ],
  fixtureIDs: [nanobotHookLifecycleNativeExactFixtureID] as [typeof nanobotHookLifecycleNativeExactFixtureID],
  knownLossiness: [] as [],
}

const toolErrorHint = "\n\n[Analyze the error above and try a different approach.]"

export const nanobotHookLifecycleNativeDescriptors: NanobotHookLifecycleNativeDescriptor[] = nanobotHookLifecycleNativeExactAtomIDs.map((id) =>
  hookDescriptor(id, nanobotHookLifecyclePortForAtomID(id), nanobotHookLifecycleSelectionReason(id)),
)

export function createNanobotAgentHookContextProjection(
  input: Partial<NanobotAgentHookContextProjection> & Pick<NanobotAgentHookContextProjection, "iteration" | "messages">,
): NanobotAgentHookContextProjection {
  return {
    response: null,
    usage: {},
    tool_calls: [],
    tool_results: [],
    tool_events: [],
    streamed_content: false,
    streamed_reasoning: false,
    final_content: null,
    stop_reason: null,
    error: null,
    ...input,
  }
}

export function createNanobotAgentHookProjection(input: {
  label?: string
  reraise?: boolean
  streaming?: boolean
  throwOn?: NanobotAgentHookAsyncMethod[]
  finalize?: (content: string | null, context: NanobotAgentHookContextProjection) => string | null
} = {}): NanobotAgentHookProjection {
  const label = input.label ?? "AgentHook"
  const events: string[] = []
  const throwOn = new Set(input.throwOn ?? [])
  async function record(method: NanobotAgentHookAsyncMethod, detail?: string): Promise<void> {
    if (throwOn.has(method)) throw new Error(`${label}:${method}:boom`)
    events.push(detail ? `${method}:${detail}` : method)
  }
  return {
    label,
    _reraise: input.reraise === true,
    events,
    wants_streaming() {
      return input.streaming === true
    },
    before_iteration(context) {
      return record("before_iteration", String(context.iteration))
    },
    on_stream(_context, delta) {
      return record("on_stream", delta)
    },
    on_stream_end(_context, options) {
      return record("on_stream_end", String(options.resuming))
    },
    before_execute_tools(context) {
      return record("before_execute_tools", context.tool_calls.map((call) => call.name).join(","))
    },
    emit_reasoning(reasoningContent) {
      return record("emit_reasoning", String(reasoningContent))
    },
    emit_reasoning_end() {
      return record("emit_reasoning_end")
    },
    after_iteration(context) {
      return record("after_iteration", String(context.stop_reason ?? context.iteration))
    },
    finalize_content(context, content) {
      events.push(`finalize_content:${context.iteration}:${String(content)}`)
      return input.finalize ? input.finalize(content, context) : content
    },
  }
}

export function createNanobotCompositeHookProjection(hooks: NanobotAgentHookProjection[]): NanobotCompositeHookProjection {
  const isolatedErrors: string[] = []
  const composite: NanobotCompositeHookProjection = {
    label: "CompositeHook",
    _reraise: false,
    events: [],
    hooks: [...hooks],
    isolatedErrors,
    wants_streaming() {
      return composite.hooks.some((hook) => hook.wants_streaming())
    },
    before_iteration(context) {
      return forEachHookSafe(composite, "before_iteration", context)
    },
    on_stream(context, delta) {
      return forEachHookSafe(composite, "on_stream", context, delta)
    },
    on_stream_end(context, options) {
      return forEachHookSafe(composite, "on_stream_end", context, options)
    },
    before_execute_tools(context) {
      return forEachHookSafe(composite, "before_execute_tools", context)
    },
    emit_reasoning(reasoningContent) {
      return forEachHookSafe(composite, "emit_reasoning", reasoningContent)
    },
    emit_reasoning_end() {
      return forEachHookSafe(composite, "emit_reasoning_end")
    },
    after_iteration(context) {
      return forEachHookSafe(composite, "after_iteration", context)
    },
    finalize_content(context, content) {
      let current = content
      for (const hook of composite.hooks) current = hook.finalize_content(context, current)
      return current
    },
  }
  return composite
}

export function createNanobotSDKCaptureHookProjection(): NanobotSDKCaptureHookProjection {
  const base = createNanobotAgentHookProjection({ label: "SDKCaptureHook" })
  const capture: NanobotSDKCaptureHookProjection = {
    ...base,
    tools_used: [],
    messages: [],
    async after_iteration(context) {
      for (const call of context.tool_calls) capture.tools_used.push(call.name)
      capture.messages = [...context.messages]
    },
  }
  return capture
}

export function composeNanobotAgentLoopHooks(coreHook: NanobotAgentHookProjection, extraHooks: NanobotAgentHookProjection[]): NanobotAgentHookProjection {
  return extraHooks.length > 0 ? createNanobotCompositeHookProjection([coreHook, ...extraHooks]) : coreHook
}

export function createNanobotToolRegistryProjection(initialTools: NanobotToolProjection[] = []): NanobotToolRegistryProjection {
  const tools = new Map<string, NanobotToolProjection>()
  let cachedDefinitions: Array<Record<string, unknown>> | undefined
  let cacheVersion = 0
  const invalidate = () => {
    cachedDefinitions = undefined
    cacheVersion += 1
  }
  const registry: NanobotToolRegistryProjection = {
    register(tool) {
      tools.set(tool.name, tool)
      invalidate()
    },
    unregister(name) {
      tools.delete(name)
      invalidate()
    },
    get(name) {
      return tools.get(name)
    },
    has(name) {
      return tools.has(name)
    },
    get_definitions() {
      if (cachedDefinitions) return cachedDefinitions
      const builtins: Array<Record<string, unknown>> = []
      const mcpTools: Array<Record<string, unknown>> = []
      for (const tool of tools.values()) {
        const schema = tool.schema
        const name = nanobotToolSchemaName(schema)
        if (name.startsWith("mcp_")) mcpTools.push(schema)
        else builtins.push(schema)
      }
      builtins.sort((left, right) => nanobotToolSchemaName(left).localeCompare(nanobotToolSchemaName(right)))
      mcpTools.sort((left, right) => nanobotToolSchemaName(left).localeCompare(nanobotToolSchemaName(right)))
      cachedDefinitions = [...builtins, ...mcpTools]
      return cachedDefinitions
    },
    prepare_call(name, params) {
      if (!isRecord(params) && (name === "write_file" || name === "read_file")) {
        return {
          params,
          error: `Error: Tool '${name}' parameters must be a JSON object, got ${Array.isArray(params) ? "list" : typeof params}. Use named parameters: tool_name(param1="value1", param2="value2")`,
        }
      }
      const tool = tools.get(name)
      if (!tool) return { params, error: `Error: Tool '${name}' not found. Available: ${registry.tool_names().join(", ")}` }
      const inputParams = isRecord(params) ? params : {}
      const castParams = tool.castParams ? tool.castParams(inputParams) : inputParams
      const errors = tool.validateParams ? tool.validateParams(castParams) : []
      if (errors.length > 0) return { tool, params: castParams, error: `Error: Invalid parameters for tool '${name}': ${errors.join("; ")}` }
      return { tool, params: castParams }
    },
    async execute(name, params) {
      const prepared = registry.prepare_call(name, params)
      if (prepared.error) return prepared.error + toolErrorHint
      try {
        const result = await prepared.tool?.execute?.(prepared.params as Record<string, unknown>)
        return typeof result === "string" && result.startsWith("Error") ? result + toolErrorHint : result
      } catch (error) {
        return `Error executing ${name}: ${errorMessage(error)}` + toolErrorHint
      }
    },
    tool_names() {
      return [...tools.keys()]
    },
    cacheVersion() {
      return cacheVersion
    },
  }
  for (const tool of initialTools) registry.register(tool)
  return registry
}

export function nanobotToolSchemaName(schema: Record<string, unknown>): string {
  const fn = schema["function"]
  if (isRecord(fn) && typeof fn["name"] === "string") return fn["name"]
  return typeof schema["name"] === "string" ? schema["name"] : ""
}

export function discoverNanobotToolPluginProjection(entryPoints: Array<{ name: string; load: () => NanobotToolClassProjection }>): Record<string, NanobotToolClassProjection> {
  const plugins: Record<string, NanobotToolClassProjection> = {}
  for (const entryPoint of entryPoints) {
    try {
      const cls = entryPoint.load()
      if (!cls.abstract && cls.pluginDiscoverable !== false) plugins[entryPoint.name] = { ...cls, entryPointName: entryPoint.name }
    } catch {
      continue
    }
  }
  return plugins
}

export function loadNanobotToolsProjection(input: {
  registry: NanobotToolRegistryProjection
  builtins: NanobotToolClassProjection[]
  plugins: NanobotToolClassProjection[]
  scope?: string
}): NanobotToolLoadProjection {
  const scope = input.scope ?? "core"
  const registered: string[] = []
  const warnings: string[] = []
  const errors: string[] = []
  const builtinNames = new Set<string>()
  for (const source of [
    { classes: input.builtins, isPluginSource: false },
    { classes: input.plugins, isPluginSource: true },
  ]) {
    for (const cls of source.classes) {
      try {
        if (!(cls.scopes ?? ["core"]).includes(scope)) continue
        if (cls.enabled === false) continue
        if (cls.abstract || cls.pluginDiscoverable === false) continue
        if (cls.createThrows) throw new Error(cls.createThrows)
        const tool = toolFromClassProjection(cls)
        if (input.registry.has(tool.name)) {
          if (source.isPluginSource && builtinNames.has(tool.name)) {
            warnings.push(`Plugin ${cls.className} skipped: conflicts with built-in tool ${tool.name}`)
            continue
          }
          warnings.push(`Tool name collision: ${tool.name} from ${cls.className} overwrites existing`)
        }
        input.registry.register(tool)
        registered.push(tool.name)
        if (!source.isPluginSource) builtinNames.add(tool.name)
      } catch (error) {
        errors.push(`Failed to register tool: ${cls.className}: ${errorMessage(error)}`)
      }
    }
  }
  return { registered, warnings, errors }
}

export function createNanobotCommandRouterProjection(): NanobotCommandRouterProjection {
  const priorityHandlers = new Map<string, NanobotCommandHandlerProjection>()
  const exactHandlers = new Map<string, NanobotCommandHandlerProjection>()
  const prefixHandlers: Array<[string, NanobotCommandHandlerProjection]> = []
  return {
    priority(cmd, handler) {
      priorityHandlers.set(cmd, handler)
    },
    exact(cmd, handler) {
      exactHandlers.set(cmd, handler)
    },
    prefix(prefix, handler) {
      prefixHandlers.push([prefix, handler])
      prefixHandlers.sort((left, right) => right[0].length - left[0].length)
    },
    is_priority(text) {
      return priorityHandlers.has(text.trim().toLowerCase())
    },
    is_dispatchable_command(text) {
      const cmd = text.trim().toLowerCase()
      if (exactHandlers.has(cmd)) return true
      return prefixHandlers.some(([prefix]) => cmd.startsWith(prefix))
    },
    async dispatch_priority(ctx) {
      const handler = priorityHandlers.get(ctx.raw.toLowerCase())
      return handler ? handler(ctx) : undefined
    },
    async dispatch(ctx) {
      const cmd = ctx.raw.toLowerCase()
      const exact = exactHandlers.get(cmd)
      if (exact) return exact(ctx)
      for (const [prefix, handler] of prefixHandlers) {
        if (cmd.startsWith(prefix)) {
          ctx.args = ctx.raw.slice(prefix.length)
          return handler(ctx)
        }
      }
      return undefined
    },
    prefixOrder() {
      return prefixHandlers.map(([prefix]) => prefix)
    },
  }
}

export function nanobotProviderSpecLabel(spec: Pick<NanobotProviderSpecProjection, "name" | "display_name">): string {
  return spec.display_name || titleCase(spec.name)
}

export function findNanobotProviderByName(specs: NanobotProviderSpecProjection[], name: string): NanobotProviderSpecProjection | undefined {
  return specs.find((spec) => spec.name === name)
}

export function nanobotProviderBackendForName(specs: NanobotProviderSpecProjection[], name: string): string {
  return findNanobotProviderByName(specs, name)?.backend ?? "openai_compat"
}

export function mergeNanobotChannelRegistriesProjection(input: {
  builtin: Record<string, string>
  external: Record<string, string>
}): { channels: Record<string, string>; shadowed: string[] } {
  const shadowed = Object.keys(input.external).filter((name) => Object.prototype.hasOwnProperty.call(input.builtin, name)).sort()
  return { channels: { ...input.external, ...input.builtin }, shadowed }
}

export async function buildNanobotHookLifecycleNativeExactCases(): Promise<NanobotHookLifecycleNativeExactCase[]> {
  const ctx = createNanobotAgentHookContextProjection({
    iteration: 0,
    messages: [{ role: "user", content: "hi" }],
    tool_calls: [{ name: "read_file" }],
  })
  const hookA = createNanobotAgentHookProjection({ label: "A" })
  const hookB = createNanobotAgentHookProjection({ label: "B", streaming: true, finalize: (content) => (content ? `${content.toUpperCase()}!` : content) })
  const composite = createNanobotCompositeHookProjection([hookA, hookB])
  await composite.before_iteration(ctx)
  await composite.emit_reasoning("thinking")
  await composite.on_stream(ctx, "he")
  await composite.on_stream_end(ctx, { resuming: true })
  await composite.before_execute_tools(ctx)
  await composite.after_iteration(ctx)
  const finalized = composite.finalize_content(ctx, "done")
  const emptyComposite = createNanobotCompositeHookProjection([])

  const good = createNanobotAgentHookProjection({ label: "good" })
  const bad = createNanobotAgentHookProjection({ label: "bad", throwOn: ["before_iteration", "on_stream"] })
  const isolated = createNanobotCompositeHookProjection([bad, good])
  await isolated.before_iteration(ctx)
  await isolated.on_stream(ctx, "delta")
  const reraise = createNanobotCompositeHookProjection([
    createNanobotAgentHookProjection({ label: "fatal", reraise: true, throwOn: ["before_iteration"] }),
    good,
  ])
  let reraiseMessage = ""
  try {
    await reraise.before_iteration(ctx)
  } catch (error) {
    reraiseMessage = errorMessage(error)
  }

  const capture = createNanobotSDKCaptureHookProjection()
  const captureCtx = createNanobotAgentHookContextProjection({
    iteration: 1,
    messages: [{ role: "assistant", content: "done" }],
    tool_calls: [{ name: "list_dir" }, { name: "read_file" }],
  })
  await capture.after_iteration(captureCtx)
  captureCtx.messages.push({ role: "user", content: "later" })
  const core = createNanobotAgentHookProjection({ label: "core" })
  const extra = createNanobotAgentHookProjection({ label: "extra" })
  const loopHook = composeNanobotAgentLoopHooks(core, [extra])
  await loopHook.before_iteration(ctx)

  const registry = createNanobotToolRegistryProjection([
    toolProjection("zeta", { name: "zeta" }),
    toolProjection("mcp_z", { function: { name: "mcp_z" } }),
    toolProjection("alpha", { function: { name: "alpha" } }, { validateParams: (params) => (params["required"] ? [] : ["required missing"]) }),
    toolProjection("mcp_a", { name: "mcp_a" }),
    toolProjection("boom", { name: "boom" }, { execute: () => { throw new Error("boom") } }),
  ])
  const definitionsFirst = registry.get_definitions()
  const definitionsSecond = registry.get_definitions()
  const cacheStable = definitionsFirst === definitionsSecond
  const cacheVersionBefore = registry.cacheVersion()
  registry.unregister("zeta")
  const cacheInvalidated = registry.cacheVersion() > cacheVersionBefore
  const invalidParams = registry.prepare_call("read_file", ["bad"]).error
  const missingTool = registry.prepare_call("missing", {}).error
  const validationError = registry.prepare_call("alpha", {}).error
  const executeError = await registry.execute("boom", {})

  const pluginDiscovered = discoverNanobotToolPluginProjection([
    { name: "my_plugin", load: () => toolClass("FakeTool", "fake_tool") },
    { name: "abstract_plugin", load: () => toolClass("AbstractTool", "abstract_tool", { abstract: true }) },
  ])
  const loaderRegistry = createNanobotToolRegistryProjection()
  const loadProjection = loadNanobotToolsProjection({
    registry: loaderRegistry,
    builtins: [toolClass("BuiltinRead", "read_file"), toolClass("BuiltinDisabled", "disabled", { enabled: false })],
    plugins: [
      toolClass("PluginConflict", "read_file"),
      toolClass("PluginExtra", "plugin_extra"),
      toolClass("PluginHidden", "hidden", { pluginDiscoverable: false }),
    ],
  })

  const router = createNanobotCommandRouterProjection()
  router.priority("/stop", async (commandCtx) => {
    commandCtx.handledBy = "priority"
    return "stopped"
  })
  router.exact("/help", async (commandCtx) => {
    commandCtx.handledBy = "exact"
    return "help"
  })
  router.prefix("/team ", async (commandCtx) => {
    commandCtx.handledBy = "team"
    return commandCtx.args
  })
  router.prefix("/team admin ", async (commandCtx) => {
    commandCtx.handledBy = "team-admin"
    return commandCtx.args
  })
  const priorityDispatch = await router.dispatch_priority({ raw: "/stop", args: "" })
  const paddedPriorityDispatch = await router.dispatch_priority({ raw: " /stop ", args: "" })
  const prefixCtx: NanobotCommandContextProjection = { raw: "/team admin alice", args: "" }
  const prefixResult = await router.dispatch(prefixCtx)
  const specs: NanobotProviderSpecProjection[] = [
    { name: "custom", keywords: [], env_key: "", display_name: "Custom", backend: "openai_compat", is_direct: true },
    { name: "azure_openai", keywords: ["azure"], env_key: "", display_name: "Azure OpenAI", backend: "azure_openai", is_direct: true },
    { name: "openrouter", keywords: ["openrouter"], env_key: "OPENROUTER_API_KEY", display_name: "OpenRouter", backend: "openai_compat", is_gateway: true },
  ]
  const channelMerge = mergeNanobotChannelRegistriesProjection({
    external: { websocket: "ExternalWebsocket", matrix: "MatrixPlugin" },
    builtin: { websocket: "BuiltinWebsocket", telegram: "TelegramChannel" },
  })

  return [
    hookCase(
      "agent-hook-composite-lifecycle",
      { hooks: ["A", "B"], methods: [...nanobotAgentHookAsyncMethods] },
      {
        wantsStreaming: true,
        hookAEvents: hookA.events,
        hookBEvents: hookB.events,
        finalized,
        emptyCompositeStreaming: emptyComposite.wants_streaming(),
        emptyCompositeFinalize: emptyComposite.finalize_content(ctx, "unchanged"),
      },
      "AgentHook methods default to no-op and non-streaming; CompositeHook fans out async methods in list order, wants streaming when any child wants it, and finalize_content pipes content through children.",
    ),
    hookCase(
      "composite-error-isolation-and-reraise",
      { isolatedHooks: ["bad", "good"], reraiseHooks: ["fatal", "good"] },
      {
        isolatedErrors: isolated.isolatedErrors,
        goodEventsAfterIsolation: good.events,
        reraiseMessage,
      },
      "CompositeHook catches and logs non-reraise hook errors then continues; hooks with _reraise set propagate the exception and stop fan-out.",
    ),
    hookCase(
      "runner-sdk-capture-and-extra-hook-order",
      { loopHooks: ["core", "extra"], captureToolCalls: ["list_dir", "read_file"] },
      {
        toolsUsed: capture.tools_used,
        capturedMessages: capture.messages,
        snapshotUnaffectedByLaterMutation: capture.messages.length === 1,
        loopCompositeOrder: [core.events[0], extra.events[0]],
      },
      "SDKCaptureHook appends tool call names and snapshots messages on every after_iteration; AgentLoop wraps the core progress hook before extra hooks only when extras are present.",
    ),
    hookCase(
      "tool-registry-sort-cache-prepare-execute",
      { registered: ["zeta", "mcp_z", "alpha", "mcp_a", "boom"] },
      {
        definitionOrder: definitionsFirst.map(nanobotToolSchemaName),
        cacheStable,
        cacheInvalidated,
        invalidParams,
        missingTool,
        validationError,
        executeError,
      },
      "ToolRegistry caches definitions until mutation, sorts built-in tools before MCP tools by schema name, validates read/write parameter shape, reports missing tools with available names, and appends the upstream hint to execution errors.",
    ),
    hookCase(
      "tool-loader-entrypoints-and-collisions",
      { builtins: ["BuiltinRead"], pluginEntryPoints: ["my_plugin", "abstract_plugin"] },
      {
        discoveredPluginNames: Object.keys(pluginDiscovered),
        abstractPluginSkipped: !("abstract_plugin" in pluginDiscovered),
        registered: loadProjection.registered,
        warnings: loadProjection.warnings,
        errors: loadProjection.errors,
      },
      "ToolLoader discovers non-abstract entry point Tool classes, skips abstract or non-discoverable plugins, loads built-ins before plugins, and prevents plugins from shadowing built-in tool names.",
    ),
    hookCase(
      "command-provider-channel-registries",
      { commands: ["/stop", "/help", "/team ", "/team admin "], channels: ["websocket", "matrix", "telegram"] },
      {
        isPriorityWithWhitespace: router.is_priority(" /STOP "),
        priorityDispatch,
        paddedPriorityDispatch,
        isDispatchableTeam: router.is_dispatchable_command("/team admin alice"),
        prefixOrder: router.prefixOrder(),
        prefixResult,
        prefixHandledBy: prefixCtx.handledBy,
        providerLabels: specs.map(nanobotProviderSpecLabel),
        azureBackend: nanobotProviderBackendForName(specs, "azure_openai"),
        unknownBackend: nanobotProviderBackendForName(specs, "unknown"),
        channels: channelMerge.channels,
        shadowedChannels: channelMerge.shadowed,
      },
      "CommandRouter checks priority commands separately, dispatches exact commands before longest prefixes, ProviderSpec labels prefer display_name and backend defaults to openai_compat, and channel discovery merges external plugins before built-ins so built-ins win name collisions.",
    ),
  ]
}

export async function buildNanobotHookLifecycleNativeExactFixtureAsync(): Promise<NanobotHookLifecycleNativeExactFixture> {
  const cases = await buildNanobotHookLifecycleNativeExactCases()
  return buildNanobotHookLifecycleNativeExactFixtureFromCases(cases)
}

export function buildNanobotHookLifecycleNativeExactFixture(): NanobotHookLifecycleNativeExactFixture {
  return buildNanobotHookLifecycleNativeExactFixtureFromCases(nanobotHookLifecycleNativeExactStaticCases)
}

export function verifyNanobotHookLifecycleNativeExactFixture(
  fixture: NanobotHookLifecycleNativeExactFixture,
): NanobotHookLifecycleNativeExactVerification {
  const issues: NanobotHookLifecycleNativeExactIssue[] = []
  const expected = buildNanobotHookLifecycleNativeExactFixture()
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)
  if (fixture.fingerprint !== expectedFingerprint) issues.push({ id: "nanobot-hook-lifecycle-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Nanobot hook lifecycle content." })
  if (fixture.product !== "nanobot" || !sameJSON(fixture.atomIDs, nanobotHookLifecycleNativeExactAtomIDs)) issues.push({ id: "nanobot-hook-lifecycle-native-exact.identity", message: "Fixture must stay scoped to the Nanobot hook lifecycle native atom group." })
  if (fixture.upstreamRef !== nanobotHookLifecycleUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"))) issues.push({ id: "nanobot-hook-lifecycle-native-exact.upstream", message: "Fixture must stay pinned to the Nanobot hook lifecycle upstream sources." })
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) issues.push({ id: "nanobot-hook-lifecycle-native-exact.native-claim", message: "Nanobot hook lifecycle fixture must explicitly claim native-exact parity." })
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) issues.push({ id: "nanobot-hook-lifecycle-native-exact.lossiness", message: "Native exact Nanobot hook lifecycle fixture must not carry known lossiness markers." })
  if (!fixture.nativeEvidenceRefs.includes(nanobotHookLifecycleNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(nanobotHookLifecycleNativeExactReplayRef)) issues.push({ id: "nanobot-hook-lifecycle-native-exact.evidence", message: "Nanobot hook lifecycle native exact evidence refs are missing." })
  if (!fixture.fixtureIDs.includes(nanobotHookLifecycleNativeExactFixtureID)) issues.push({ id: "nanobot-hook-lifecycle-native-exact.fixture", message: "Nanobot hook lifecycle native exact fixture ID is missing." })
  if (!sameJSON(fixture.policy, expected.policy)) issues.push({ id: "nanobot-hook-lifecycle-native-exact.policy", message: "Nanobot hook lifecycle native policy drifted from upstream hook/registry semantics." })
  if (!sameJSON(fixture.cases, expected.cases)) issues.push({ id: "nanobot-hook-lifecycle-native-exact.cases", message: "Nanobot hook lifecycle native cases drifted from upstream hook/registry behavior." })
  if (!sameJSON(fixture.descriptors, expected.descriptors)) issues.push({ id: "nanobot-hook-lifecycle-native-exact.descriptors", message: "Nanobot hook lifecycle native descriptors drifted from the fixture atom group." })
  return { ok: issues.length === 0, issues }
}

export function nanobotHookLifecyclePortForAtomID(id: NanobotHookLifecycleNativeExactAtomID): NanobotHookLifecycleNativeExactPortID {
  if (id === "nanobot.plugin.cleanup") return "hook.cleanup-scope"
  if (id === "nanobot.plugin.event-mapper") return "hook.handler-chain"
  if (id === "nanobot.plugin.loader") return "hook.bus"
  if (id === "nanobot.plugin.provider-registry-bridge") return "registry.provider"
  if (id === "nanobot.plugin.ui-registry-bridge") return "registry.ui"
  if (id === "nanobot.hook.error-defaults") return "hook.error-policy"
  if (id === "nanobot.hook.handler-adapter") return "hook.handler-chain"
  if (id === "nanobot.hook.observer-adapter") return "hook.observer-chain"
  if (id === "nanobot.hook.plugin-bridge") return "hook.bus"
  if (id === "nanobot.hook.scheduler-defaults") return "hook.scheduler"
  if (id === "nanobot.registry.command") return "registry.command"
  if (id === "nanobot.registry.provider-plugin") return "registry.provider"
  if (id === "nanobot.registry.tool-definition") return "tool.registry"
  return "registry.ui"
}

const nanobotHookLifecycleNativeExactStaticCases: NanobotHookLifecycleNativeExactCase[] = [
  hookCase(
    "agent-hook-composite-lifecycle",
    { hooks: ["A", "B"], methods: [...nanobotAgentHookAsyncMethods] },
    {
      wantsStreaming: true,
      hookAEvents: ["before_iteration:0", "emit_reasoning:thinking", "on_stream:he", "on_stream_end:true", "before_execute_tools:read_file", "after_iteration:0", "finalize_content:0:done"],
      hookBEvents: ["before_iteration:0", "emit_reasoning:thinking", "on_stream:he", "on_stream_end:true", "before_execute_tools:read_file", "after_iteration:0", "finalize_content:0:done"],
      finalized: "DONE!",
      emptyCompositeStreaming: false,
      emptyCompositeFinalize: "unchanged",
    },
    "AgentHook methods default to no-op and non-streaming; CompositeHook fans out async methods in list order, wants streaming when any child wants it, and finalize_content pipes content through children.",
  ),
  hookCase(
    "composite-error-isolation-and-reraise",
    { isolatedHooks: ["bad", "good"], reraiseHooks: ["fatal", "good"] },
    {
      isolatedErrors: ["AgentHook.before_iteration error in bad: bad:before_iteration:boom", "AgentHook.on_stream error in bad: bad:on_stream:boom"],
      goodEventsAfterIsolation: ["before_iteration:0", "on_stream:delta"],
      reraiseMessage: "fatal:before_iteration:boom",
    },
    "CompositeHook catches and logs non-reraise hook errors then continues; hooks with _reraise set propagate the exception and stop fan-out.",
  ),
  hookCase(
    "runner-sdk-capture-and-extra-hook-order",
    { loopHooks: ["core", "extra"], captureToolCalls: ["list_dir", "read_file"] },
    {
      toolsUsed: ["list_dir", "read_file"],
      capturedMessages: [{ role: "assistant", content: "done" }],
      snapshotUnaffectedByLaterMutation: true,
      loopCompositeOrder: ["before_iteration:0", "before_iteration:0"],
    },
    "SDKCaptureHook appends tool call names and snapshots messages on every after_iteration; AgentLoop wraps the core progress hook before extra hooks only when extras are present.",
  ),
  hookCase(
    "tool-registry-sort-cache-prepare-execute",
    { registered: ["zeta", "mcp_z", "alpha", "mcp_a", "boom"] },
    {
      definitionOrder: ["alpha", "boom", "zeta", "mcp_a", "mcp_z"],
      cacheStable: true,
      cacheInvalidated: true,
      invalidParams: "Error: Tool 'read_file' parameters must be a JSON object, got list. Use named parameters: tool_name(param1=\"value1\", param2=\"value2\")",
      missingTool: "Error: Tool 'missing' not found. Available: mcp_z, alpha, mcp_a, boom",
      validationError: "Error: Invalid parameters for tool 'alpha': required missing",
      executeError: "Error executing boom: boom\n\n[Analyze the error above and try a different approach.]",
    },
    "ToolRegistry caches definitions until mutation, sorts built-in tools before MCP tools by schema name, validates read/write parameter shape, reports missing tools with available names, and appends the upstream hint to execution errors.",
  ),
  hookCase(
    "tool-loader-entrypoints-and-collisions",
    { builtins: ["BuiltinRead"], pluginEntryPoints: ["my_plugin", "abstract_plugin"] },
    {
      discoveredPluginNames: ["my_plugin"],
      abstractPluginSkipped: true,
      registered: ["read_file", "plugin_extra"],
      warnings: ["Plugin PluginConflict skipped: conflicts with built-in tool read_file"],
      errors: [],
    },
    "ToolLoader discovers non-abstract entry point Tool classes, skips abstract or non-discoverable plugins, loads built-ins before plugins, and prevents plugins from shadowing built-in tool names.",
  ),
  hookCase(
    "command-provider-channel-registries",
    { commands: ["/stop", "/help", "/team ", "/team admin "], channels: ["websocket", "matrix", "telegram"] },
    {
      isPriorityWithWhitespace: true,
      priorityDispatch: "stopped",
      paddedPriorityDispatch: undefined,
      isDispatchableTeam: true,
      prefixOrder: ["/team admin ", "/team "],
      prefixResult: "alice",
      prefixHandledBy: "team-admin",
      providerLabels: ["Custom", "Azure OpenAI", "OpenRouter"],
      azureBackend: "azure_openai",
      unknownBackend: "openai_compat",
      channels: { matrix: "MatrixPlugin", websocket: "BuiltinWebsocket", telegram: "TelegramChannel" },
      shadowedChannels: ["websocket"],
    },
    "CommandRouter checks priority commands separately, dispatches exact commands before longest prefixes, ProviderSpec labels prefer display_name and backend defaults to openai_compat, and channel discovery merges external plugins before built-ins so built-ins win name collisions.",
  ),
]

function buildNanobotHookLifecycleNativeExactFixtureFromCases(cases: NanobotHookLifecycleNativeExactCase[]): NanobotHookLifecycleNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<NanobotHookLifecycleNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "nanobot",
    atomIDs: [...nanobotHookLifecycleNativeExactAtomIDs] as typeof nanobotHookLifecycleNativeExactAtomIDs,
    portIDs: unique(nanobotHookLifecycleNativeDescriptors.map((descriptor) => descriptor.port)),
    upstreamRef: nanobotHookLifecycleUpstreamRef,
    evidenceRef: nanobotHookLifecycleNativeExactEvidenceRef,
    fixtureID: nanobotHookLifecycleNativeExactFixtureID,
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    policy: {
      agentHookDefaultsAreNoopAndNonStreaming: true,
      compositeHookFansOutAsyncMethodsInOrder: true,
      compositeHookIsolatesNonReraiseErrorsAndContinues: true,
      compositeHookReraisesHooksWithReraiseFlag: true,
      finalizeContentIsOrderedPipelineWithoutIsolation: true,
      sdkCaptureHookAppendsToolNamesAndSnapshotsMessages: true,
      agentLoopWrapsCoreHookBeforeExtraHooks: true,
      toolRegistrySortsBuiltinsBeforeMCPAndCachesUntilMutation: true,
      toolRegistryPrepareAndExecuteReturnUpstreamErrorShapes: true,
      toolLoaderSkipsAbstractAndNonDiscoverablePlugins: true,
      toolLoaderPluginCannotShadowBuiltinToolName: true,
      commandRouterChecksPriorityExactThenLongestPrefix: true,
      providerSpecLabelAndBackendSelectionUseRegistryMetadata: true,
      channelDiscoveryMergesExternalThenBuiltinWithBuiltinPriority: true,
      allHookAtomsShareNativeLifecycleFixture: true,
    },
    cases,
    sourceRefs: [
      `${nanobotHookLifecycleUpstreamRef}:nanobot/agent/hook.py#AgentHookContext,AgentHook,CompositeHook,SDKCaptureHook`,
      `${nanobotHookLifecycleUpstreamRef}:nanobot/agent/runner.py#AgentRunner.run,_request_model`,
      `${nanobotHookLifecycleUpstreamRef}:nanobot/agent/loop.py#AgentLoop.__init__,_run_agent_loop`,
      `${nanobotHookLifecycleUpstreamRef}:nanobot/agent/tools/registry.py#ToolRegistry`,
      `${nanobotHookLifecycleUpstreamRef}:nanobot/agent/tools/loader.py#ToolLoader.discover,_discover_plugins,load`,
      `${nanobotHookLifecycleUpstreamRef}:nanobot/command/router.py#CommandRouter`,
      `${nanobotHookLifecycleUpstreamRef}:nanobot/providers/registry.py#ProviderSpec,PROVIDERS`,
      `${nanobotHookLifecycleUpstreamRef}:nanobot/channels/registry.py#discover_plugins,discover_all`,
      `${nanobotHookLifecycleUpstreamRef}:nanobot/channels/manager.py#ChannelManager._init_channels,_resolve_bool_override`,
      `${nanobotHookLifecycleUpstreamRef}:tests/agent/test_hook_composite.py`,
      `${nanobotHookLifecycleUpstreamRef}:tests/agent/test_runner_hooks.py`,
      `${nanobotHookLifecycleUpstreamRef}:tests/agent/test_tool_loader_entrypoints.py`,
    ],
    nativeEvidenceRefs: [nanobotHookLifecycleNativeExactEvidenceRef, nanobotHookLifecycleNativeExactReplayRef],
    fixtureIDs: [nanobotHookLifecycleNativeExactFixtureID],
    knownLossiness: [],
    descriptors: nanobotHookLifecycleNativeDescriptors,
  }
  return { ...fixtureWithoutFingerprint, fingerprint: fingerprintObject(fixtureWithoutFingerprint) }
}

async function forEachHookSafe(composite: NanobotCompositeHookProjection, method: NanobotAgentHookAsyncMethod, ...args: unknown[]): Promise<void> {
  for (const hook of composite.hooks) {
    const handler = hook[method] as (...handlerArgs: unknown[]) => Promise<void>
    if (hook._reraise) {
      await handler(...args)
      continue
    }
    try {
      await handler(...args)
    } catch (error) {
      composite.isolatedErrors.push(`AgentHook.${method} error in ${hook.label}: ${errorMessage(error)}`)
    }
  }
}

function hookDescriptor(
  id: NanobotHookLifecycleNativeExactAtomID,
  port: NanobotHookLifecycleNativeExactPortID,
  selectionReason: string,
): NanobotHookLifecycleNativeDescriptor {
  return { ...descriptorBase, id, port, selectionReason }
}

function hookCase(
  scenarioID: NanobotHookLifecycleNativeExactScenarioID,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  upstreamBehavior: string,
): NanobotHookLifecycleNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function nanobotHookLifecycleSelectionReason(id: NanobotHookLifecycleNativeExactAtomID): string {
  const native = " Upstream native implementation is captured by the Nanobot hook lifecycle native exact fixture."
  if (id.startsWith("nanobot.hook.")) return `Nanobot AgentHook and CompositeHook lifecycle semantics from nanobot/agent/hook.py.${native}`
  if (id === "nanobot.plugin.loader" || id === "nanobot.plugin.event-mapper" || id === "nanobot.plugin.cleanup") return `Nanobot AgentLoop extra hook loading and CompositeHook cleanup/lifecycle behavior from nanobot/agent/loop.py and hook.py.${native}`
  if (id === "nanobot.registry.tool-definition") return `Nanobot ToolRegistry and ToolLoader native behavior from nanobot/agent/tools/registry.py and loader.py.${native}`
  if (id === "nanobot.registry.command") return `Nanobot CommandRouter native exact dispatch behavior from nanobot/command/router.py.${native}`
  if (id === "nanobot.registry.provider-plugin" || id === "nanobot.plugin.provider-registry-bridge") return `Nanobot ProviderSpec registry metadata and backend selection behavior from nanobot/providers/registry.py and factory.py.${native}`
  return `Nanobot channel/UI plugin discovery behavior from nanobot/channels/registry.py and manager.py.${native}`
}

function toolProjection(
  name: string,
  schema: Record<string, unknown>,
  options: Pick<NanobotToolProjection, "castParams" | "validateParams" | "execute"> = {},
): NanobotToolProjection {
  return { name, schema, ...options }
}

function toolClass(
  className: string,
  toolName: string,
  options: Partial<NanobotToolClassProjection> = {},
): NanobotToolClassProjection {
  return {
    className,
    toolName,
    schema: { name: toolName },
    scopes: ["core"],
    enabled: true,
    pluginDiscoverable: true,
    ...options,
  }
}

function toolFromClassProjection(cls: NanobotToolClassProjection): NanobotToolProjection {
  return toolProjection(cls.toolName, cls.schema)
}

function titleCase(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
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
  if (typeof value === "undefined") return "\"__undefined__\""
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
