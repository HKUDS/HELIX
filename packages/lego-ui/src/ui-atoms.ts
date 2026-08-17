import type { LegoMessagePart, ToolResultPart } from "@helix/contracts"
import { createOpenCodeUIEventLoopAtom, openCodeUIEventLoopNativeExactAtomID } from "./product-schema/opencode"

export interface UIChrome {
  header?: string
  footer?: string
}

export interface UIWidget {
  id: string
  kind: string
  title?: string
  data?: unknown
}

export interface UIOverlay {
  id: string
  kind: string
  title?: string
  data?: unknown
}

export interface UIEditorInput {
  title: string
  content: string
  path?: string
  language?: string
}

export interface UIEditorResult {
  content: string
  saved: boolean
}

export interface UIAutocompleteInput {
  query: string
  options: Array<string | { value: string; label?: string; metadata?: Record<string, unknown> }>
  limit?: number
}

export interface UIAutocompleteOption {
  value: string
  label?: string
  metadata?: Record<string, unknown>
}

export type UIAdapterKind = "tui" | "rpc" | "web" | "desktop"
export type UIProductPersonality = "opencode" | "pi-mono" | "nanobot" | "hermes-agent"

export interface UIAdapterEvent<TPayload = unknown> {
  type:
    | "select"
    | "confirm"
    | "input"
    | "notify"
    | "status"
    | "chrome"
    | "widget.show"
    | "widget.hide"
    | "overlay.show"
    | "overlay.close"
    | "editor.open"
    | "autocomplete"
  payload: TPayload
  timestamp: number
}

export interface UITransportAdapter {
  kind: UIAdapterKind
  emit(event: UIAdapterEvent): void | Promise<void>
  request?(event: UIAdapterEvent): Promise<unknown>
}

export interface RenderContext {
  product?: string
  theme?: string
  metadata?: Record<string, unknown>
}

export type RenderedBlock =
  | { kind: "text"; text: string }
  | { kind: "json"; data: unknown }
  | { kind: "custom"; customType: string; data: unknown }

export interface MessagePartRendererRegistration {
  partType?: LegoMessagePart["type"]
  customType?: string
  render(part: LegoMessagePart, ctx: RenderContext): RenderedBlock
}

export interface ToolResultRendererRegistration {
  toolName: string
  render(part: ToolResultPart, ctx: RenderContext): RenderedBlock
}

export interface UIRendererPort {
  registerMessagePartRenderer(renderer: MessagePartRendererRegistration): () => void
  registerToolResultRenderer(renderer: ToolResultRendererRegistration): () => void
  renderMessagePart(part: LegoMessagePart, ctx?: RenderContext): RenderedBlock
  renderToolResult(part: ToolResultPart, ctx?: RenderContext): RenderedBlock
}

export interface NotificationRecord {
  message: string
  type: "info" | "warning" | "error"
  timestamp: number
}

export type TUIKey = "escape" | "enter" | "up" | "down" | "ctrl-p" | "tab"

export type TUIInputEvent =
  | { type: "text"; text: string }
  | { type: "submit"; text?: string }
  | { type: "command"; command: string; args?: string }
  | { type: "key"; key: TUIKey }
  | { type: "select"; target: "theme" | "model"; value: string }
  | { type: "resize"; width: number; height?: number }
  | { type: "tick"; now?: number }

export interface TUIEventLoopOptions {
  product: "opencode" | "pi-mono" | string
  title: string
  commands: string[]
  themes?: string[]
  models?: string[]
  initialTheme?: string
  initialModel?: string
  width?: number
  height?: number
}

export interface TUIEventLoopSnapshot {
  product: string
  title: string
  status: "ready" | "editing" | "running" | "selecting" | "interrupted"
  mode: "chat" | "command" | "theme" | "model"
  commandLine: string
  cursor: number
  theme: string
  model: string
  width: number
  height: number
  history: string[]
  notifications: Array<{ type: "info" | "warning" | "error"; message: string }>
  events: number
  lastRender: string
}

export interface TUIEventLoopResult {
  handled: boolean
  snapshot: TUIEventLoopSnapshot
  output?: string
  command?: string
  submittedText?: string
  error?: string
}

export interface UIEventLoopPort {
  handle(event: TUIInputEvent): TUIEventLoopResult
  snapshot(): TUIEventLoopSnapshot
  render(): string
}

export interface UIThemeDescriptor {
  id: string
  label?: string
  tokens?: Record<string, string>
}

export interface UIThemeRegistryPort {
  list(): UIThemeDescriptor[]
  get(id: string): UIThemeDescriptor | undefined
  current(): UIThemeDescriptor
  select(id: string): UIThemeDescriptor | undefined
  has(id: string): boolean
}

export type UICommandRouteAction =
  | "help"
  | "open-theme-selector"
  | "select-theme"
  | "open-model-selector"
  | "select-model"
  | "interrupt"
  | "custom"
  | "unknown"

export interface UICommandRouteResult {
  command: string
  args: string
  action: UICommandRouteAction
  handled: boolean
  output?: string
  error?: string
}

export interface UICommandRouterPort {
  route(input: { command: string; args?: string; commands: string[] }): UICommandRouteResult
}

export type UIInputNormalizerInput =
  | TUIInputEvent
  | string
  | { type: "keypress"; key: string }
  | { type: "raw"; value: unknown }

export interface UIInputNormalizerPort {
  normalize(input: UIInputNormalizerInput): TUIInputEvent | undefined
}

export interface UISnapshotPort<TState, TSnapshot> {
  snapshot(state: TState): TSnapshot
}

export interface UIProductProfile {
  product: UIProductPersonality
  atomPrefix: "opencode" | "pi" | "nanobot" | "hermes"
  title: string
  commands: string[]
  themes: string[]
  models: string[]
  initialTheme: string
  initialModel: string
  rendererMode: "opencode-step-events" | "pi-native" | "nanobot-progress" | "hermes-events"
}

export interface UIProductAtoms {
  readonly product: UIProductPersonality
  profile(): UIProductProfile
  atomID(kind: "renderer" | "command-router" | "theme-registry" | "input-normalizer" | "snapshot" | "event-loop"): string
  createEventLoop(options?: Partial<TUIEventLoopOptions>, ports?: UIEventLoopAtomPorts): UIEventLoopPort
  createRenderer(): UIRendererPort
  createCommandRouter(): UICommandRouterPort
  createThemeRegistry(): UIThemeRegistryPort
  createInputNormalizer(): UIInputNormalizerPort
  createSnapshot<TSnapshot>(): UISnapshotPort<TSnapshot, TSnapshot>
}

export interface UIEventLoopAtomPorts {
  commandRouter?: UICommandRouterPort
  inputNormalizer?: UIInputNormalizerPort
  themeRegistry?: UIThemeRegistryPort
  modelRegistry?: UIThemeRegistryPort
  snapshotter?: UISnapshotPort<TUIEventLoopSnapshot, TUIEventLoopSnapshot>
}

export class LegoRendererRegistry implements UIRendererPort {
  private readonly messagePartRenderers: MessagePartRendererRegistration[] = []
  private readonly toolResultRenderers = new Map<string, ToolResultRendererRegistration>()

  registerMessagePartRenderer(renderer: MessagePartRendererRegistration): () => void {
    this.messagePartRenderers.push(renderer)
    return () => removeFromArray(this.messagePartRenderers, renderer)
  }

  registerToolResultRenderer(renderer: ToolResultRendererRegistration): () => void {
    this.toolResultRenderers.set(renderer.toolName, renderer)
    return () => {
      if (this.toolResultRenderers.get(renderer.toolName) === renderer) this.toolResultRenderers.delete(renderer.toolName)
    }
  }

  renderMessagePart(part: LegoMessagePart, ctx: RenderContext = {}): RenderedBlock {
    const renderer = this.messagePartRenderers
      .slice()
      .reverse()
      .find((candidate) => matchesMessagePartRenderer(candidate, part))
    if (renderer) return renderer.render(part, ctx)
    return defaultMessagePartRender(part)
  }

  renderToolResult(part: ToolResultPart, ctx: RenderContext = {}): RenderedBlock {
    const renderer = this.toolResultRenderers.get(part.toolName)
    if (renderer) return renderer.render(part, ctx)
    return { kind: "text", text: part.content.map((content) => blockToText(this.renderMessagePart(content, ctx))).join("\n") }
  }
}

export class TUIEventLoop implements UIEventLoopPort {
  private readonly commands: string[]
  private readonly commandRouter: UICommandRouterPort
  private readonly inputNormalizer: UIInputNormalizerPort
  private readonly themeRegistry: UIThemeRegistryPort
  private readonly modelRegistry: UIThemeRegistryPort
  private readonly snapshotter: UISnapshotPort<TUIEventLoopSnapshot, TUIEventLoopSnapshot>
  private status: TUIEventLoopSnapshot["status"] = "ready"
  private mode: TUIEventLoopSnapshot["mode"] = "chat"
  private commandLine = ""
  private cursor = 0
  private width: number
  private height: number
  private events = 0
  private lastRender = ""
  private readonly history: string[] = []
  private readonly notifications: Array<{ type: "info" | "warning" | "error"; message: string }> = []

  constructor(private readonly options: TUIEventLoopOptions, ports: UIEventLoopAtomPorts = {}) {
    this.commands = [...new Set(options.commands)].sort()
    this.commandRouter = ports.commandRouter ?? createUICommandRouterAtom()
    this.inputNormalizer = ports.inputNormalizer ?? createUIInputNormalizerAtom()
    this.themeRegistry =
      ports.themeRegistry ??
      createUIThemeRegistryAtom({
        themes: options.themes ?? ["dark", "light"],
        ...(options.initialTheme === undefined ? {} : { initialTheme: options.initialTheme }),
      })
    this.modelRegistry =
      ports.modelRegistry ??
      createUIThemeRegistryAtom({
        themes: options.models ?? ["default"],
        ...(options.initialModel === undefined ? {} : { initialTheme: options.initialModel }),
      })
    this.snapshotter = ports.snapshotter ?? createUISnapshotAtom<TUIEventLoopSnapshot>()
    this.width = Math.max(40, options.width ?? 80)
    this.height = Math.max(10, options.height ?? 24)
  }

  handle(event: TUIInputEvent): TUIEventLoopResult {
    const normalized = this.inputNormalizer.normalize(event)
    if (!normalized) return this.result(false, { error: "Unknown input event." })
    this.events += 1

    if (normalized.type === "text") {
      this.status = "editing"
      this.mode = "chat"
      this.commandLine = `${this.commandLine}${normalized.text}`
      this.cursor = this.commandLine.length
      return this.result(true)
    }

    if (normalized.type === "submit") {
      const text = (normalized.text ?? this.commandLine).trim()
      if (!text) return this.result(false, { error: "No input to submit." })
      this.history.push(text)
      this.commandLine = ""
      this.cursor = 0
      this.status = "running"
      this.mode = "chat"
      this.notify("info", `Submitted: ${text}`)
      return this.result(true, { submittedText: text, output: text })
    }

    if (normalized.type === "command") return this.handleCommand(normalized.command, normalized.args)

    if (normalized.type === "key") {
      if (normalized.key === "escape") {
        this.status = "interrupted"
        this.mode = "chat"
        this.notify("warning", "Interrupted current interaction.")
        return this.result(true, { output: "interrupted" })
      }
      if (normalized.key === "ctrl-p") return this.openSelector("model")
      if (normalized.key === "enter") return this.handle({ type: "submit" })
      return this.result(true)
    }

    if (normalized.type === "select") {
      if (normalized.target === "theme") return this.selectTheme(normalized.value)
      return this.selectModel(normalized.value)
    }

    if (normalized.type === "resize") {
      this.width = Math.max(40, normalized.width)
      this.height = Math.max(10, normalized.height ?? this.height)
      return this.result(true)
    }

    return this.result(true)
  }

  snapshot(): TUIEventLoopSnapshot {
    return this.snapshotter.snapshot({
      product: this.options.product,
      title: this.options.title,
      status: this.status,
      mode: this.mode,
      commandLine: this.commandLine,
      cursor: this.cursor,
      theme: this.themeRegistry.current().id,
      model: this.modelRegistry.current().id,
      width: this.width,
      height: this.height,
      history: [...this.history],
      notifications: this.notifications.slice(-8),
      events: this.events,
      lastRender: this.lastRender,
    })
  }

  render(): string {
    const snapshot = this.snapshot()
    const rule = "-".repeat(snapshot.width)
    const lines = [
      `${snapshot.title} :: ${snapshot.status.toUpperCase()} :: ${snapshot.mode}`,
      `theme    ${snapshot.theme}`,
      `model    ${snapshot.model}`,
      `input    ${snapshot.commandLine || "<empty>"}`,
      `history  ${snapshot.history.slice(-3).join(" | ") || "<none>"}`,
      `events   ${snapshot.events}`,
    ]
    this.lastRender = [rule, ...lines.map((line) => line.slice(0, snapshot.width)), rule].join("\n")
    return this.lastRender
  }

  private handleCommand(command: string, args?: string): TUIEventLoopResult {
    const route = this.commandRouter.route({ command, commands: this.commands, ...(args === undefined ? {} : { args }) })
    this.mode = "command"
    this.status = "ready"

    if (route.action === "help") {
      this.notify("info", route.output ?? "")
      return this.result(true, { command: route.command, output: route.output ?? "" })
    }
    if (route.action === "open-theme-selector") return this.openSelector("theme")
    if (route.action === "select-theme") return this.selectTheme(route.args)
    if (route.action === "open-model-selector") return this.openSelector("model")
    if (route.action === "select-model") return this.selectModel(route.args)
    if (route.action === "interrupt") return this.handle({ type: "key", key: "escape" })
    if (route.action === "custom") {
      this.notify("info", `Command accepted: /${route.command}`)
      return this.result(true, { command: route.command, output: route.args })
    }
    return this.result(false, { command: route.command, error: route.error ?? `Unknown command: /${route.command}` })
  }

  private openSelector(target: "theme" | "model"): TUIEventLoopResult {
    this.mode = target
    this.status = "selecting"
    const registry = target === "theme" ? this.themeRegistry : this.modelRegistry
    const output = registry
      .list()
      .map((item) => item.id)
      .join(", ")
    this.notify("info", `${target} selector opened: ${output}`)
    return this.result(true, { command: target, output })
  }

  private selectTheme(value: string): TUIEventLoopResult {
    if (!this.themeRegistry.select(value)) {
      const error = `Unknown theme: ${value}`
      this.notify("error", error)
      return this.result(false, { command: "theme", error })
    }
    this.mode = "theme"
    this.status = "ready"
    this.notify("info", `Theme selected: ${value}`)
    return this.result(true, { command: "theme", output: value })
  }

  private selectModel(value: string): TUIEventLoopResult {
    if (!this.modelRegistry.select(value)) {
      const error = `Unknown model: ${value}`
      this.notify("error", error)
      return this.result(false, { command: "model", error })
    }
    this.mode = "model"
    this.status = "ready"
    this.notify("info", `Model selected: ${value}`)
    return this.result(true, { command: "model", output: value })
  }

  private notify(type: "info" | "warning" | "error", message: string): void {
    this.notifications.push({ type, message })
  }

  private result(handled: boolean, fields: Omit<Partial<TUIEventLoopResult>, "handled" | "snapshot"> = {}): TUIEventLoopResult {
    return {
      handled,
      snapshot: this.snapshot(),
      ...(fields.output === undefined ? {} : { output: fields.output }),
      ...(fields.command === undefined ? {} : { command: fields.command }),
      ...(fields.submittedText === undefined ? {} : { submittedText: fields.submittedText }),
      ...(fields.error === undefined ? {} : { error: fields.error }),
    }
  }
}

export function createUIRendererAtom(): LegoRendererRegistry {
  return new LegoRendererRegistry()
}

export function createUIEventLoopAtom(options: TUIEventLoopOptions, ports: UIEventLoopAtomPorts = {}): UIEventLoopPort {
  return new TUIEventLoop(options, ports)
}

export function createUIThemeRegistryAtom(input: { themes?: Array<string | UIThemeDescriptor>; initialTheme?: string } = {}): UIThemeRegistryPort {
  const descriptors = normalizeThemeDescriptors(input.themes ?? ["default"])
  let selected = descriptors.find((theme) => theme.id === input.initialTheme)?.id ?? descriptors[0]?.id ?? "default"
  return {
    list() {
      return descriptors.map((theme) => structuredClone(theme))
    },
    get(id) {
      const theme = descriptors.find((candidate) => candidate.id === id)
      return theme ? structuredClone(theme) : undefined
    },
    current() {
      return structuredClone(descriptors.find((candidate) => candidate.id === selected) ?? { id: selected })
    },
    select(id) {
      const theme = descriptors.find((candidate) => candidate.id === id)
      if (!theme) return undefined
      selected = theme.id
      return structuredClone(theme)
    },
    has(id) {
      return descriptors.some((candidate) => candidate.id === id)
    },
  }
}

export function createUICommandRouterAtom(): UICommandRouterPort {
  return {
    route(input) {
      const normalized = input.command.startsWith("/") ? input.command.slice(1) : input.command
      const [name, ...rest] = normalized.trim().split(/\s+/)
      const command = name ?? ""
      const args = input.args ?? rest.join(" ")
      if (command === "help") return { command, args, action: "help", handled: true, output: input.commands.map((item) => `/${item}`).join(" ") }
      if (command === "theme") {
        return args
          ? { command, args, action: "select-theme", handled: true }
          : { command, args, action: "open-theme-selector", handled: true }
      }
      if (command === "model" || command === "models") {
        return args
          ? { command, args, action: "select-model", handled: true }
          : { command, args, action: "open-model-selector", handled: true }
      }
      if (command === "interrupt") return { command, args, action: "interrupt", handled: true }
      if (input.commands.includes(command)) return { command, args, action: "custom", handled: true, output: args }
      return { command, args, action: "unknown", handled: false, error: `Unknown command: /${command}` }
    },
  }
}

export function createUIInputNormalizerAtom(): UIInputNormalizerPort {
  return {
    normalize(input) {
      if (typeof input === "string") return input.startsWith("/") ? { type: "command", command: input } : { type: "text", text: input }
      if (isTUIInputEvent(input)) return input
      if (input.type === "keypress" && isTUIKey(input.key)) return { type: "key", key: input.key }
      return undefined
    },
  }
}

export function createUISnapshotAtom<TSnapshot>(): UISnapshotPort<TSnapshot, TSnapshot> {
  return {
    snapshot(state) {
      return structuredClone(state)
    },
  }
}

export function createUIProductAtoms(product: UIProductPersonality): UIProductAtoms {
  const profile = uiProductProfile(product)
  return {
    product,
    profile: () => cloneUIProductProfile(profile),
    atomID(kind) {
      if (kind === "event-loop") {
        if (product === "opencode") return openCodeUIEventLoopNativeExactAtomID
        if (product === "pi-mono") return "pi.ui.event-loop"
        return `${profile.atomPrefix}.tui.shell`
      }
      return `${profile.atomPrefix}.ui.${kind}`
    },
    createEventLoop(options = {}, ports = {}) {
      const eventLoopOptions = {
        product,
        title: profile.title,
        commands: profile.commands,
        themes: profile.themes,
        models: profile.models,
        initialTheme: profile.initialTheme,
        initialModel: profile.initialModel,
        ...options,
      }
      if (product === "opencode") return createOpenCodeUIEventLoopAtom(eventLoopOptions)
      return createUIEventLoopAtom(
        eventLoopOptions,
        ports,
      )
    },
    createRenderer() {
      return createUIRendererAtom()
    },
    createCommandRouter() {
      return createUICommandRouterAtom()
    },
    createThemeRegistry() {
      return createUIThemeRegistryAtom({ themes: profile.themes, initialTheme: profile.initialTheme })
    },
    createInputNormalizer() {
      return createUIInputNormalizerAtom()
    },
    createSnapshot<TSnapshot>() {
      return createUISnapshotAtom<TSnapshot>()
    },
  }
}

export function createOpenCodeUIAtoms(): UIProductAtoms {
  return createUIProductAtoms("opencode")
}

export function createPiMonoUIAtoms(): UIProductAtoms {
  return createUIProductAtoms("pi-mono")
}

export function createNanobotUIAtoms(): UIProductAtoms {
  return createUIProductAtoms("nanobot")
}

export function createHermesAgentUIAtoms(): UIProductAtoms {
  return createUIProductAtoms("hermes-agent")
}

export function uiProductProfile(product: UIProductPersonality): UIProductProfile {
  return cloneUIProductProfile(uiProductProfiles[product])
}

export function normalizeAutocompleteOption(option: string | UIAutocompleteOption): UIAutocompleteOption {
  return typeof option === "string" ? { value: option } : option
}

export function isEditorResult(value: unknown): value is UIEditorResult {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof (value as UIEditorResult).content === "string" && typeof (value as UIEditorResult).saved === "boolean"
}

export function createTUIEventLoop(options: TUIEventLoopOptions): TUIEventLoop {
  return new TUIEventLoop(options)
}

function normalizeThemeDescriptors(themes: Array<string | UIThemeDescriptor>): UIThemeDescriptor[] {
  const seen = new Set<string>()
  return themes
    .map((theme) => (typeof theme === "string" ? { id: theme } : theme))
    .filter((theme) => {
      if (seen.has(theme.id)) return false
      seen.add(theme.id)
      return true
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

function cloneUIProductProfile(profile: UIProductProfile): UIProductProfile {
  return {
    ...profile,
    commands: [...profile.commands],
    themes: [...profile.themes],
    models: [...profile.models],
  }
}

const uiProductProfiles: Record<UIProductPersonality, UIProductProfile> = {
  opencode: {
    product: "opencode",
    atomPrefix: "opencode",
    title: "OpenCode TUI",
    commands: ["help", "model", "theme", "interrupt", "login", "logout", "session", "provider", "share"],
    themes: ["dark", "light", "system"],
    models: ["opencode-builtin-codex", "opencode-builtin-anthropic", "opencode-builtin-xai"],
    initialTheme: "dark",
    initialModel: "opencode-builtin-codex",
    rendererMode: "opencode-step-events",
  },
  "pi-mono": {
    product: "pi-mono",
    atomPrefix: "pi",
    title: "Pi Coding Agent",
    commands: ["help", "model", "theme", "interrupt", "config", "extensions", "sessions", "package"],
    themes: ["dark", "light", "nord"],
    models: ["claude-sonnet-4-5", "claude-opus-4-5", "gpt-5.1"],
    initialTheme: "dark",
    initialModel: "claude-sonnet-4-5",
    rendererMode: "pi-native",
  },
  nanobot: {
    product: "nanobot",
    atomPrefix: "nanobot",
    title: "Nanobot",
    commands: ["help", "model", "theme", "interrupt", "memory", "skills", "cron", "channels", "status"],
    themes: ["dark", "light"],
    models: ["anthropic/claude-opus-4-5", "anthropic/claude-sonnet-4-5", "openai/gpt-5.1"],
    initialTheme: "dark",
    initialModel: "anthropic/claude-opus-4-5",
    rendererMode: "nanobot-progress",
  },
  "hermes-agent": {
    product: "hermes-agent",
    atomPrefix: "hermes",
    title: "Hermes Agent",
    commands: ["help", "model", "theme", "interrupt", "setup", "tools", "skills", "sessions", "gateway", "doctor"],
    themes: ["dark", "light", "system"],
    models: ["nous:hermes-4", "openrouter:anthropic/claude-sonnet-4.6", "openai-api:gpt-5.1"],
    initialTheme: "dark",
    initialModel: "nous:hermes-4",
    rendererMode: "hermes-events",
  },
}

function matchesMessagePartRenderer(renderer: MessagePartRendererRegistration, part: LegoMessagePart): boolean {
  if (renderer.customType && part.type === "custom") return renderer.customType === part.customType
  if (renderer.partType) return renderer.partType === part.type
  return true
}

function defaultMessagePartRender(part: LegoMessagePart): RenderedBlock {
  if (part.type === "text" || part.type === "reasoning") return { kind: "text", text: part.text }
  if (part.type === "tool_call") return { kind: "json", data: { toolName: part.toolName, input: part.input, status: part.status } }
  if (part.type === "tool_result") return { kind: "text", text: part.content.map((content) => blockToText(defaultMessagePartRender(content))).join("\n") }
  if (part.type === "compaction") return { kind: "text", text: part.summary }
  return { kind: "custom", customType: part.customType, data: part.data }
}

function blockToText(block: RenderedBlock): string {
  if (block.kind === "text") return block.text
  return JSON.stringify(block.kind === "json" ? block.data : block.data)
}

function isTUIInputEvent(value: unknown): value is TUIInputEvent {
  if (!isRecord(value) || typeof value["type"] !== "string") return false
  if (value["type"] === "text") return typeof value["text"] === "string"
  if (value["type"] === "submit") return value["text"] === undefined || typeof value["text"] === "string"
  if (value["type"] === "command") return typeof value["command"] === "string"
  if (value["type"] === "key") return isTUIKey(value["key"])
  if (value["type"] === "select") return (value["target"] === "theme" || value["target"] === "model") && typeof value["value"] === "string"
  if (value["type"] === "resize") return typeof value["width"] === "number"
  return value["type"] === "tick"
}

function isTUIKey(value: unknown): value is TUIKey {
  return value === "escape" || value === "enter" || value === "up" || value === "down" || value === "ctrl-p" || value === "tab"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function removeFromArray<T>(items: T[], item: T): void {
  const index = items.indexOf(item)
  if (index >= 0) items.splice(index, 1)
}
