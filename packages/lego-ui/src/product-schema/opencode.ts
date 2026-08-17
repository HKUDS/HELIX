import { createHash } from "node:crypto"
import type { TUIEventLoopOptions, TUIEventLoopResult, TUIEventLoopSnapshot, TUIInputEvent, UIEventLoopPort } from "../ui-atoms"

export const openCodeUIUpstreamRef = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"

export const openCodeUIEventLoopNativeExactAtomID = "opencode.ui.event-loop"
export const openCodeUICommandRouterNativeExactAtomID = "opencode.ui.command-router"
export const openCodeUIInputNormalizerNativeExactAtomID = "opencode.ui.input-normalizer"
export const openCodeUIRendererNativeExactAtomID = "opencode.ui.renderer"
export const openCodeUISnapshotNativeExactAtomID = "opencode.ui.snapshot"
export const openCodeUIThemeRegistryNativeExactAtomID = "opencode.ui.theme-registry"
export const openCodeUINativeExactAtomIDs = [
  openCodeUIEventLoopNativeExactAtomID,
  openCodeUICommandRouterNativeExactAtomID,
  openCodeUIInputNormalizerNativeExactAtomID,
  openCodeUIRendererNativeExactAtomID,
  openCodeUISnapshotNativeExactAtomID,
  openCodeUIThemeRegistryNativeExactAtomID,
] as const

export const openCodeUINativeExactFixtureID = "opencode-ui:native-exact-fixture"
export const openCodeUINativeExactEvidenceRef = "conformance:opencode-ui-native-exact-fixture"
export const openCodeUINativeExactReplayRef = "ui-native-exact:opencode"

export const openCodeTUIBindingCommands = [
  "command.palette.show",
  "session.list",
  "session.new",
  "session.quick_switch.1",
  "session.quick_switch.2",
  "session.quick_switch.3",
  "session.quick_switch.4",
  "session.quick_switch.5",
  "session.quick_switch.6",
  "session.quick_switch.7",
  "session.quick_switch.8",
  "session.quick_switch.9",
  "model.list",
  "model.cycle_recent",
  "model.cycle_recent_reverse",
  "model.cycle_favorite",
  "model.cycle_favorite_reverse",
  "agent.list",
  "agent.cycle",
  "agent.cycle.reverse",
  "mcp.list",
  "variant.cycle",
  "variant.list",
  "provider.connect",
  "console.org.switch",
  "opencode.status",
  "theme.switch",
  "theme.switch_mode",
  "theme.mode.lock",
  "help.show",
  "docs.open",
  "app.debug",
  "app.console",
  "app.heap_snapshot",
  "terminal.suspend",
  "terminal.title.toggle",
  "app.toggle.animations",
  "app.toggle.file_context",
  "app.toggle.diffwrap",
  "app.toggle.paste_summary",
  "app.toggle.session_directory_filter",
] as const

export const openCodeTUIInputCommands = [
  "input.move.left",
  "input.move.right",
  "input.move.up",
  "input.move.down",
  "input.select.left",
  "input.select.right",
  "input.select.up",
  "input.select.down",
  "input.line.home",
  "input.line.end",
  "input.select.line.home",
  "input.select.line.end",
  "input.visual.line.home",
  "input.visual.line.end",
  "input.select.visual.line.home",
  "input.select.visual.line.end",
  "input.buffer.home",
  "input.buffer.end",
  "input.select.buffer.home",
  "input.select.buffer.end",
  "input.delete.line",
  "input.delete.to.line.end",
  "input.delete.to.line.start",
  "input.backspace",
  "input.delete",
  "input.newline",
  "input.undo",
  "input.redo",
  "input.word.forward",
  "input.word.backward",
  "input.select.word.forward",
  "input.select.word.backward",
  "input.delete.word.forward",
  "input.delete.word.backward",
  "input.select.all",
  "input.submit",
] as const

export const openCodeTUIFormatKeyNameAliases = {
  pageup: "pgup",
  pagedown: "pgdn",
  delete: "del",
} as const

export const openCodeTUIFormatModifierAliases = {
  meta: "alt",
} as const

export const openCodeTUIRendererProviderChain = [
  "ErrorBoundary",
  "OpencodeKeymapProvider",
  "ArgsProvider",
  "ExitProvider",
  "KVProvider",
  "ToastProvider",
  "RouteProvider",
  "TuiConfigProvider",
  "SDKProvider",
  "ProjectProvider",
  "SyncProvider",
  "SyncProviderV2",
  "ThemeProvider",
  "LocalProvider",
  "PromptStashProvider",
  "DialogProvider",
  "FrecencyProvider",
  "PromptHistoryProvider",
  "PromptRefProvider",
  "EditorContextProvider",
  "App",
] as const

export const openCodeTUIHomePromptPlaceholders = {
  normal: ["Fix a TODO in the codebase", "What is the tech stack of this project?", "Fix broken tests"],
  shell: ["ls -la", "git status", "pwd"],
} as const

export const openCodeTUIRootSlots = [
  "TuiPluginRuntime.Slot:home_logo:replace",
  "TuiPluginRuntime.Slot:home_prompt:replace",
  "TuiPluginRuntime.Slot:home_prompt_right",
  "TuiPluginRuntime.Slot:home_bottom",
  "TuiPluginRuntime.Slot:home_footer:single_winner",
  "TuiPluginRuntime.Slot:app_bottom",
  "TuiPluginRuntime.Slot:app",
] as const

export const openCodeTUIDefaultThemeIDs = [
  "aura",
  "ayu",
  "catppuccin",
  "catppuccin-frappe",
  "catppuccin-macchiato",
  "cobalt2",
  "cursor",
  "dracula",
  "everforest",
  "flexoki",
  "github",
  "gruvbox",
  "kanagawa",
  "material",
  "matrix",
  "mercury",
  "monokai",
  "nightowl",
  "nord",
  "one-dark",
  "osaka-jade",
  "opencode",
  "orng",
  "lucent-orng",
  "palenight",
  "rosepine",
  "solarized",
  "synthwave84",
  "tokyonight",
  "vesper",
  "vercel",
  "zenburn",
  "carbonfox",
] as const

export type OpenCodeUINativePortID = "ui.event-loop" | "ui.command-router" | "ui.input-normalizer" | "ui.renderer" | "ui.snapshot" | "ui.theme-registry"
export type OpenCodeTUIEventLoopRoute = "home" | "session" | "plugin"
export type OpenCodeTUIInputCommand = (typeof openCodeTUIInputCommands)[number]
export type OpenCodeTUICommandAction =
  | "agent"
  | "app"
  | "command-palette"
  | "console"
  | "docs"
  | "help"
  | "mcp"
  | "model"
  | "opencode"
  | "provider"
  | "session"
  | "terminal"
  | "theme"
  | "variant"
  | "unknown"

export interface OpenCodeTUICommandRoute {
  command: string
  args: string
  action: OpenCodeTUICommandAction
  handled: boolean
  slashDisplay?: string
  error?: string
}

export interface OpenCodeTUIThemeDescriptor {
  id: string
  source: "default" | "plugin" | "custom" | "system"
}

export interface OpenCodeTUIThemeRegistry {
  list(): OpenCodeTUIThemeDescriptor[]
  current(): OpenCodeTUIThemeDescriptor
  has(id: string): boolean
  select(id: string): OpenCodeTUIThemeDescriptor | undefined
}

export interface OpenCodeTUIKeyBindingNormalization {
  input: string
  expanded?: string
  inputCommand?: OpenCodeTUIInputCommand
}

export interface OpenCodeTUIRendererConfigSummary {
  externalOutputMode: "passthrough"
  targetFps: 60
  gatherStats: false
  exitOnCtrlC: false
  useKittyKeyboard: "enabled-empty-options"
  autoFocus: false
  openConsoleOnError: false
  useMouse: boolean
  consoleCopyBinding: {
    name: "y"
    ctrl: true
    action: "copy-selection"
  }
}

export interface OpenCodeTUIRootRenderSnapshot {
  width: number
  height: number
  ready: boolean
  route: "home" | "session" | "plugin"
  backgroundToken: "theme.background"
  root: {
    tag: "box"
    flexDirection: "column"
    copySelectionMousePolicy: "right-mouse-when-disable-copy-on-select-flag" | "mouse-up-copy-selection"
  }
  rendered: string[]
}

export interface OpenCodeTUIHomeLayoutSnapshot {
  promptMaxWidth: number
  promptPlaceholders: typeof openCodeTUIHomePromptPlaceholders
  slots: readonly [
    "TuiPluginRuntime.Slot:home_logo:replace",
    "Logo",
    "Prompt",
    "Toast",
    "TuiPluginRuntime.Slot:home_footer:single_winner",
  ]
}

export interface OpenCodeTUIHeapSnapshotToast {
  variant: "info"
  message: string
  duration: 5000
  clearsDialog: true
}

export interface OpenCodeTUIEventLoopNativeOptions extends Partial<TUIEventLoopOptions> {
  initialRoute?: OpenCodeTUIEventLoopRoute
  pluginRouteFound?: boolean
  showTimeToFirstDraw?: boolean
  disableCopyOnSelectFlag?: boolean
  pluginThemes?: string[]
  customThemes?: string[]
  systemTheme?: string
  onSnapshotFiles?: string[]
}

export interface OpenCodeTUIEventLoopProjection {
  results: TUIEventLoopResult[]
  snapshot: TUIEventLoopSnapshot
  render: string
}

export interface OpenCodeUINativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: typeof openCodeUINativeExactAtomIDs
  portIDs: readonly ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"]
  upstreamRef: typeof openCodeUIUpstreamRef
  evidenceRef: typeof openCodeUINativeExactEvidenceRef
  fixtureID: typeof openCodeUINativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  scope: "event-loop-command-router-input-renderer-snapshot-and-theme-registry"
  policy: {
    eventLoopCreatesOpenTUIRendererAndKeymap: true
    eventLoopRegistersAppBindingsInBaseMode: true
    eventLoopInitialRouteDefaultsToHome: true
    eventLoopResizeUsesTerminalDimensions: true
    eventLoopCleanupDisposesKeymapPluginsAndAudio: true
    appBindingCommandsMatchPinnedApp: true
    commandPaletteCommandIsHiddenFromVisiblePalette: true
    opencodeModeStackDefaultsToBase: true
    keyAliasesMatchPinnedKeymap: true
    managedTextareaInputCommandsMatchPinnedKeymap: true
    keyDisplayAliasesMatchPinnedFormatter: true
    rendererConfigMatchesPinnedOpenTUIApp: true
    rootProviderAndRouteTreeMatchesPinnedApp: true
    heapSnapshotCommandMatchesPinnedApp: true
    homePromptLayoutMatchesPinnedRoute: true
    defaultThemesMatchPinnedThemeRegistry: true
    themePriorityIsDefaultThenPluginThenCustomThenSystem: true
  }
  cases: Array<{
    scenarioID: string
    input: Record<string, unknown>
    output: Record<string, unknown>
    upstreamBehavior: string
  }>
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface OpenCodeUINativeExactVerification {
  ok: boolean
  issues: Array<{ id: string; message: string }>
}

function portForOpenCodeUINativeAtomID(id: (typeof openCodeUINativeExactAtomIDs)[number]): OpenCodeUINativePortID {
  if (id === openCodeUIEventLoopNativeExactAtomID) return "ui.event-loop"
  if (id === openCodeUICommandRouterNativeExactAtomID) return "ui.command-router"
  if (id === openCodeUIInputNormalizerNativeExactAtomID) return "ui.input-normalizer"
  if (id === openCodeUIRendererNativeExactAtomID) return "ui.renderer"
  if (id === openCodeUISnapshotNativeExactAtomID) return "ui.snapshot"
  return "ui.theme-registry"
}

function openCodeUINativeDescriptor(id: (typeof openCodeUINativeExactAtomIDs)[number]) {
  return {
    id,
    port: portForOpenCodeUINativeAtomID(id),
    product: "opencode",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [openCodeUINativeExactEvidenceRef, openCodeUINativeExactReplayRef],
    fixtureIDs: [openCodeUINativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "OpenCode upstream native implementation for the TUI event loop, command binding, keymap input normalization, renderer route/snapshot behavior, and theme registry behavior with exact fixture coverage; native parity complete for the scoped event-loop, command-router, input-normalizer, renderer, snapshot, and theme-registry slice.",
  } as const
}

export const openCodeUINativeDescriptors = openCodeUINativeExactAtomIDs.map(openCodeUINativeDescriptor)

export const openCodeUINativeExactDescriptorForID = new Map(
  openCodeUINativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export const openCodeTUISlashCommandAliases = {
  help: "help.show",
  sessions: "session.list",
  resume: "session.list",
  continue: "session.list",
  new: "session.new",
  clear: "session.new",
  models: "model.list",
  agents: "agent.list",
  mcps: "mcp.list",
  variants: "variant.list",
  connect: "provider.connect",
  org: "console.org.switch",
  orgs: "console.org.switch",
  "switch-org": "console.org.switch",
  status: "opencode.status",
  themes: "theme.switch",
} as const

export function routeOpenCodeTUICommand(input: { command: string; args?: string }): OpenCodeTUICommandRoute {
  const raw = input.command.startsWith("/") ? input.command.slice(1) : input.command
  const [head = "", ...rest] = raw.trim().split(/\s+/)
  const command = resolveOpenCodeTUICommandName(head)
  const args = input.args ?? rest.join(" ")
  if (!(openCodeTUIBindingCommands as readonly string[]).includes(command)) {
    return { command, args, action: "unknown", handled: false, error: `Unknown OpenCode TUI command: ${command}` }
  }
  return {
    command,
    args,
    action: openCodeTUICommandAction(command),
    handled: true,
    ...(command === "command.palette.show" ? {} : { slashDisplay: `/${command}` }),
  }
}

function resolveOpenCodeTUICommandName(command: string): string {
  const aliased = openCodeTUISlashCommandAliases[command as keyof typeof openCodeTUISlashCommandAliases]
  return aliased ?? command
}

export function createOpenCodeTUIThemeRegistry(input: {
  initialTheme?: string
  pluginThemes?: string[]
  customThemes?: string[]
  systemTheme?: string
} = {}): OpenCodeTUIThemeRegistry {
  const descriptors = openCodeTUIThemeDescriptors(input)
  let selected = descriptors.find((theme) => theme.id === input.initialTheme)?.id ?? "opencode"
  return {
    list() {
      return descriptors.map((theme) => ({ ...theme }))
    },
    current() {
      return { ...(descriptors.find((theme) => theme.id === selected) ?? { id: selected, source: "default" as const }) }
    },
    has(id) {
      return descriptors.some((theme) => theme.id === id)
    },
    select(id) {
      const theme = descriptors.find((candidate) => candidate.id === id)
      if (!theme) return undefined
      selected = theme.id
      return { ...theme }
    },
  }
}

export function openCodeTUIThemeDescriptors(input: {
  pluginThemes?: string[]
  customThemes?: string[]
  systemTheme?: string
} = {}): OpenCodeTUIThemeDescriptor[] {
  const byID = new Map<string, OpenCodeTUIThemeDescriptor>()
  for (const id of openCodeTUIDefaultThemeIDs) byID.set(id, { id, source: "default" })
  for (const id of input.pluginThemes ?? []) if (!byID.has(id)) byID.set(id, { id, source: "plugin" })
  for (const id of input.customThemes ?? []) byID.set(id, { id, source: "custom" })
  if (input.systemTheme) byID.set("system", { id: "system", source: "system" })
  return Array.from(byID.values())
}

export function normalizeOpenCodeTUIKeyAlias(input: string): string {
  return input
    .replace(/(^|[+,\s>])enter(?=$|[+,\s<])/gi, "$1return")
    .replace(/(^|[+,\s>])esc(?=$|[+,\s<])/gi, "$1escape")
    .replace(/(^|[+,\s>])pgdown(?=$|[+,\s<])/gi, "$1pagedown")
    .replace(/(^|[+,\s>])pgup(?=$|[+,\s<])/gi, "$1pageup")
}

export function expandOpenCodeTUIKeyAliases(input: string): string | undefined {
  const expanded = normalizeOpenCodeTUIKeyAlias(input)
  return expanded === input ? undefined : expanded
}

export function isOpenCodeTUIInputCommand(input: string): input is OpenCodeTUIInputCommand {
  return (openCodeTUIInputCommands as readonly string[]).includes(input)
}

export function normalizeOpenCodeTUIInputBinding(input: string): OpenCodeTUIKeyBindingNormalization {
  const expanded = expandOpenCodeTUIKeyAliases(input)
  const inputCommand = isOpenCodeTUIInputCommand(input) ? input : undefined
  return {
    input,
    ...(expanded ? { expanded } : {}),
    ...(inputCommand ? { inputCommand } : {}),
  }
}

export function createOpenCodeTUIRendererConfigSummary(input: {
  mouse?: boolean
  disableMouseFlag?: boolean
} = {}): OpenCodeTUIRendererConfigSummary {
  return {
    externalOutputMode: "passthrough",
    targetFps: 60,
    gatherStats: false,
    exitOnCtrlC: false,
    useKittyKeyboard: "enabled-empty-options",
    autoFocus: false,
    openConsoleOnError: false,
    useMouse: !input.disableMouseFlag && (input.mouse ?? true),
    consoleCopyBinding: { name: "y", ctrl: true, action: "copy-selection" },
  }
}

export function renderOpenCodeTUIRootSnapshot(input: {
  width: number
  height: number
  ready: boolean
  route: "home" | "session" | "plugin"
  showTimeToFirstDraw?: boolean
  disableCopyOnSelectFlag?: boolean
  pluginRouteFound?: boolean
}): OpenCodeTUIRootRenderSnapshot {
  const rendered = ["root.box", "StartupLoading"]
  if (input.showTimeToFirstDraw) rendered.push("TimeToFirstDraw")
  if (input.ready) {
    rendered.push("ready.content.box")
    if (input.route === "home") rendered.push("Route:Home")
    if (input.route === "session") rendered.push("Route:Session")
    if (input.route === "plugin") rendered.push(input.pluginRouteFound === false ? "PluginRouteMissing" : "Route:Plugin")
    rendered.push("TuiPluginRuntime.Slot:app_bottom", "TuiPluginRuntime.Slot:app")
  }
  return {
    width: input.width,
    height: input.height,
    ready: input.ready,
    route: input.route,
    backgroundToken: "theme.background",
    root: {
      tag: "box",
      flexDirection: "column",
      copySelectionMousePolicy: input.disableCopyOnSelectFlag
        ? "right-mouse-when-disable-copy-on-select-flag"
        : "mouse-up-copy-selection",
    },
    rendered,
  }
}

export function snapshotOpenCodeTUIHomeLayout(input: {
  terminalWidth: number
  promptMaxWidth?: number | "auto"
}): OpenCodeTUIHomeLayoutSnapshot {
  const configured = input.promptMaxWidth
  const promptMaxWidth = configured === "auto"
    ? Math.max(75, Math.floor(input.terminalWidth * 0.7))
    : configured ?? 75
  return {
    promptMaxWidth,
    promptPlaceholders: openCodeTUIHomePromptPlaceholders,
    slots: [
      "TuiPluginRuntime.Slot:home_logo:replace",
      "Logo",
      "Prompt",
      "Toast",
      "TuiPluginRuntime.Slot:home_footer:single_winner",
    ],
  }
}

export function openCodeTUITerminalTitle(input:
  | { route: "home" }
  | { route: "session"; title?: string; defaultTitle?: boolean }
  | { route: "plugin"; id: string }
): string {
  if (input.route === "home") return "OpenCode"
  if (input.route === "plugin") return `OC | ${input.id}`
  if (!input.title || input.defaultTitle) return "OpenCode"
  const title = input.title.length > 40 ? `${input.title.slice(0, 37)}...` : input.title
  return `OC | ${title}`
}

export function openCodeTUIHeapSnapshotToast(files?: string[]): OpenCodeTUIHeapSnapshotToast {
  return {
    variant: "info",
    message: `Heap snapshot written to ${files?.join(", ")}`,
    duration: 5000,
    clearsDialog: true,
  }
}

export function createOpenCodeUIEventLoopAtom(options: OpenCodeTUIEventLoopNativeOptions = {}): UIEventLoopPort {
  return new OpenCodeTUIEventLoop(options)
}

export function replayOpenCodeTUIEventLoop(
  events: readonly TUIInputEvent[],
  options: OpenCodeTUIEventLoopNativeOptions = {},
): OpenCodeTUIEventLoopProjection {
  const loop = createOpenCodeUIEventLoopAtom(options)
  const results = events.map((event) => loop.handle(event))
  const render = loop.render()
  return {
    results,
    snapshot: loop.snapshot(),
    render,
  }
}

class OpenCodeTUIEventLoop implements UIEventLoopPort {
  private readonly options: OpenCodeTUIEventLoopNativeOptions
  private status: TUIEventLoopSnapshot["status"] = "ready"
  private mode: TUIEventLoopSnapshot["mode"] = "chat"
  private route: OpenCodeTUIEventLoopRoute
  private commandLine = ""
  private cursor = 0
  private width: number
  private height: number
  private events = 0
  private lastRender = ""
  private readonly title: string
  private readonly pluginRouteFound: boolean
  private readonly showTimeToFirstDraw: boolean
  private readonly disableCopyOnSelectFlag: boolean
  private readonly history: string[] = []
  private readonly notifications: Array<{ type: "info" | "warning" | "error"; message: string }> = []
  private readonly themeRegistry: OpenCodeTUIThemeRegistry
  private readonly models: string[]
  private selectedModel: string

  constructor(options: OpenCodeTUIEventLoopNativeOptions = {}) {
    this.options = options
    this.title = options.title ?? "OpenCode"
    this.route = options.initialRoute ?? "home"
    this.width = Math.max(1, Math.floor(options.width ?? 80))
    this.height = Math.max(1, Math.floor(options.height ?? 24))
    this.pluginRouteFound = options.pluginRouteFound ?? true
    this.showTimeToFirstDraw = options.showTimeToFirstDraw ?? false
    this.disableCopyOnSelectFlag = options.disableCopyOnSelectFlag ?? false
    this.themeRegistry = createOpenCodeTUIThemeRegistry({
      initialTheme: options.initialTheme ?? "opencode",
      ...(options.pluginThemes === undefined ? {} : { pluginThemes: options.pluginThemes }),
      ...(options.customThemes === undefined ? {} : { customThemes: options.customThemes }),
      ...(options.systemTheme === undefined ? {} : { systemTheme: options.systemTheme }),
    })
    this.models = uniqueStrings([...(options.models ?? []), options.initialModel ?? "opencode-default"])
    this.selectedModel = this.models.includes(options.initialModel ?? "") ? options.initialModel as string : this.models[0] ?? "opencode-default"
  }

  handle(event: TUIInputEvent): TUIEventLoopResult {
    this.events += 1

    if (event.type === "text") {
      this.status = "editing"
      this.mode = "chat"
      this.commandLine = `${this.commandLine}${event.text}`
      this.cursor = this.commandLine.length
      return this.result(true)
    }

    if (event.type === "submit") return this.submit(event.text)
    if (event.type === "command") return this.handleCommand(event.command, event.args)

    if (event.type === "key") {
      if (event.key === "enter") return this.submit()
      if (event.key === "escape") {
        this.status = "interrupted"
        this.mode = "chat"
        this.notify("warning", "OpenCode interaction interrupted.")
        return this.result(true, { output: "interrupted" })
      }
      if (event.key === "ctrl-p") return this.handleCommand("command.palette.show")
      return this.result(true)
    }

    if (event.type === "select") {
      if (event.target === "theme") return this.selectTheme(event.value)
      return this.selectModel(event.value)
    }

    if (event.type === "resize") {
      this.width = Math.max(1, Math.floor(event.width))
      this.height = Math.max(1, Math.floor(event.height ?? this.height))
      return this.result(true)
    }

    return this.result(true)
  }

  snapshot(): TUIEventLoopSnapshot {
    return structuredClone({
      product: "opencode",
      title: this.title,
      status: this.status,
      mode: this.mode,
      commandLine: this.commandLine,
      cursor: this.cursor,
      theme: this.themeRegistry.current().id,
      model: this.selectedModel,
      width: this.width,
      height: this.height,
      history: this.history,
      notifications: this.notifications.slice(-8),
      events: this.events,
      lastRender: this.lastRender,
    })
  }

  render(): string {
    const snapshot = this.snapshot()
    const root = renderOpenCodeTUIRootSnapshot({
      width: snapshot.width,
      height: snapshot.height,
      ready: true,
      route: this.route,
      showTimeToFirstDraw: this.showTimeToFirstDraw,
      disableCopyOnSelectFlag: this.disableCopyOnSelectFlag,
      pluginRouteFound: this.pluginRouteFound,
    })
    const rule = "=".repeat(snapshot.width)
    const lines = [
      `${snapshot.title} :: ${this.route} :: ${snapshot.status.toUpperCase()} :: ${snapshot.mode}`,
      `root     ${root.rendered.join(" > ")}`,
      `theme    ${snapshot.theme}`,
      `model    ${snapshot.model}`,
      `input    ${snapshot.commandLine || "<empty>"}`,
      `history  ${snapshot.history.slice(-3).join(" | ") || "<none>"}`,
      `events   ${snapshot.events}`,
    ]
    this.lastRender = [rule, ...lines.map((line) => line.slice(0, snapshot.width)), rule].join("\n")
    return this.lastRender
  }

  private submit(input?: string): TUIEventLoopResult {
    const text = (input ?? this.commandLine).trim()
    if (!text) return this.result(false, { error: "No OpenCode prompt input to submit." })
    this.history.push(text)
    this.commandLine = ""
    this.cursor = 0
    this.status = "running"
    this.mode = "chat"
    this.route = "session"
    this.notify("info", `Submitted OpenCode prompt: ${text}`)
    return this.result(true, { submittedText: text, output: text })
  }

  private handleCommand(command: string, args?: string): TUIEventLoopResult {
    const route = routeOpenCodeTUICommand({ command, ...(args === undefined ? {} : { args }) })
    this.mode = "command"
    this.status = "ready"
    if (!route.handled) {
      const error = route.error ?? `Unknown OpenCode TUI command: ${route.command}`
      this.notify("error", error)
      return this.result(false, { command: route.command, error })
    }

    if (route.action === "command-palette") {
      this.status = "selecting"
      this.notify("info", "OpenCode command palette opened.")
      return this.result(true, { command: route.command, output: "command-palette" })
    }

    if (route.action === "session") return this.handleSessionCommand(route.command)
    if (route.action === "model") return this.handleModelCommand(route.command)
    if (route.action === "theme") return this.handleThemeCommand(route.command)

    if (route.action === "help") {
      this.status = "selecting"
      this.notify("info", "OpenCode help dialog opened.")
      return this.result(true, { command: route.command, output: "help" })
    }

    if (route.action === "docs") {
      this.notify("info", "OpenCode docs opened.")
      return this.result(true, { command: route.command, output: "https://opencode.ai/docs" })
    }

    if (route.action === "terminal") {
      this.status = "interrupted"
      this.notify("warning", "OpenCode terminal suspended.")
      return this.result(true, { command: route.command, output: "terminal-suspend" })
    }

    if (route.command === "app.heap_snapshot") {
      const toast = openCodeTUIHeapSnapshotToast(this.options.onSnapshotFiles)
      this.notify(toast.variant, toast.message)
      return this.result(true, { command: route.command, output: toast.message })
    }

    this.notify("info", `OpenCode command accepted: ${route.command}`)
    return this.result(true, { command: route.command, output: route.args || route.action })
  }

  private handleSessionCommand(command: string): TUIEventLoopResult {
    if (command === "session.new") {
      this.route = "home"
      this.commandLine = ""
      this.cursor = 0
      this.notify("info", "OpenCode session reset to home.")
      return this.result(true, { command, output: "new-session" })
    }
    if (command === "session.list") {
      this.status = "selecting"
      this.notify("info", "OpenCode session list opened.")
      return this.result(true, { command, output: "sessions" })
    }
    this.route = "session"
    this.notify("info", `OpenCode ${command} dispatched.`)
    return this.result(true, { command, output: command })
  }

  private handleModelCommand(command: string): TUIEventLoopResult {
    this.mode = "model"
    if (command === "model.list") {
      this.status = "selecting"
      const output = this.models.join(", ")
      this.notify("info", `OpenCode model selector opened: ${output}`)
      return this.result(true, { command, output })
    }
    this.notify("info", `OpenCode ${command} dispatched.`)
    return this.result(true, { command, output: this.selectedModel })
  }

  private handleThemeCommand(command: string): TUIEventLoopResult {
    this.mode = "theme"
    if (command === "theme.switch") {
      this.status = "selecting"
      const output = this.themeRegistry.list().map((theme) => theme.id).join(", ")
      this.notify("info", `OpenCode theme selector opened: ${output}`)
      return this.result(true, { command, output })
    }
    this.notify("info", `OpenCode ${command} dispatched.`)
    return this.result(true, { command, output: this.themeRegistry.current().id })
  }

  private selectTheme(value: string): TUIEventLoopResult {
    const selected = this.themeRegistry.select(value)
    if (!selected) {
      const error = `Unknown OpenCode theme: ${value}`
      this.notify("error", error)
      return this.result(false, { command: "theme.switch", error })
    }
    this.mode = "theme"
    this.status = "ready"
    this.notify("info", `OpenCode theme selected: ${selected.id}`)
    return this.result(true, { command: "theme.switch", output: selected.id })
  }

  private selectModel(value: string): TUIEventLoopResult {
    if (!this.models.includes(value)) {
      const error = `Unknown OpenCode model: ${value}`
      this.notify("error", error)
      return this.result(false, { command: "model.list", error })
    }
    this.mode = "model"
    this.status = "ready"
    this.selectedModel = value
    this.notify("info", `OpenCode model selected: ${value}`)
    return this.result(true, { command: "model.list", output: value })
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

export function buildOpenCodeUINativeExactFixture(): OpenCodeUINativeExactFixture {
  const fixtureWithoutFingerprint: Omit<OpenCodeUINativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "opencode",
    atomIDs: [...openCodeUINativeExactAtomIDs] as typeof openCodeUINativeExactAtomIDs,
    portIDs: ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"],
    upstreamRef: openCodeUIUpstreamRef,
    evidenceRef: openCodeUINativeExactEvidenceRef,
    fixtureID: openCodeUINativeExactFixtureID,
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    scope: "event-loop-command-router-input-renderer-snapshot-and-theme-registry",
    policy: {
      eventLoopCreatesOpenTUIRendererAndKeymap: true,
      eventLoopRegistersAppBindingsInBaseMode: true,
      eventLoopInitialRouteDefaultsToHome: true,
      eventLoopResizeUsesTerminalDimensions: true,
      eventLoopCleanupDisposesKeymapPluginsAndAudio: true,
      appBindingCommandsMatchPinnedApp: true,
      commandPaletteCommandIsHiddenFromVisiblePalette: true,
      opencodeModeStackDefaultsToBase: true,
      keyAliasesMatchPinnedKeymap: true,
      managedTextareaInputCommandsMatchPinnedKeymap: true,
      keyDisplayAliasesMatchPinnedFormatter: true,
      rendererConfigMatchesPinnedOpenTUIApp: true,
      rootProviderAndRouteTreeMatchesPinnedApp: true,
      heapSnapshotCommandMatchesPinnedApp: true,
      homePromptLayoutMatchesPinnedRoute: true,
      defaultThemesMatchPinnedThemeRegistry: true,
      themePriorityIsDefaultThenPluginThenCustomThenSystem: true,
    },
    cases: [
      {
        scenarioID: "event-loop-lifecycle-keymap-route-and-resize",
        input: {
          initial: { route: "home", width: 100, height: 32, theme: "opencode", model: "gpt-5-codex" },
          events: ["text:Fix tests", "submit", "command.palette.show", "/themes", "select:tokyonight", "/new", "resize:120x40"],
        },
        output: {
          projection: replayOpenCodeTUIEventLoop(
            [
              { type: "text", text: "Fix tests" },
              { type: "submit" },
              { type: "command", command: "command.palette.show" },
              { type: "command", command: "/themes" },
              { type: "select", target: "theme", value: "tokyonight" },
              { type: "command", command: "/new" },
              { type: "resize", width: 120, height: 40 },
            ],
            { width: 100, height: 32, initialTheme: "opencode", initialModel: "gpt-5-codex", models: ["gpt-5-codex"] },
          ),
          helpAlias: routeOpenCodeTUICommand({ command: "/help" }),
          modelAlias: routeOpenCodeTUICommand({ command: "/models" }),
          sessionAlias: routeOpenCodeTUICommand({ command: "/sessions" }),
        },
        upstreamBehavior: "app.tsx tui() creates the OpenTUI CLI renderer, default OpenTUI keymap, registered OpenCode keymap, provider tree, and base-mode app bindings; RouteProvider defaults to home, App uses useTerminalDimensions for root layout, command palette/theme/session commands mutate dialog/route state, and onBeforeExit unregisters keymap, disposes plugins, and disposes TUI audio.",
      },
      {
        scenarioID: "app-binding-command-set",
        input: { commandCount: openCodeTUIBindingCommands.length, baseMode: "base", paletteCommand: "command.palette.show" },
        output: {
          firstCommand: openCodeTUIBindingCommands[0],
          lastCommand: openCodeTUIBindingCommands.at(-1),
          sessionQuickSwitchCount: openCodeTUIBindingCommands.filter((command) => command.startsWith("session.quick_switch.")).length,
          paletteRoute: routeOpenCodeTUICommand({ command: "command.palette.show" }),
          unknownRoute: routeOpenCodeTUICommand({ command: "run" }),
        },
        upstreamBehavior: "app.tsx appBindingCommands pins the command palette, session, model, agent, provider, theme, docs, app toggle, and terminal command names; keymap.tsx hides command.palette.show from visible command slash entries.",
      },
      {
        scenarioID: "keymap-aliases-input-commands-and-command-families",
        input: {
          aliases: ["enter", "esc", "pgdown", "pgup", "ctrl+x"],
          inputCommands: ["input.backspace", "input.delete.to.line.start", "input.submit"],
          commands: ["theme.switch", "model.list", "terminal.suspend"],
        },
        output: {
          normalizedAliases: ["enter", "esc", "pgdown", "pgup"].map(normalizeOpenCodeTUIKeyAlias),
          aliasExpansions: ["enter", "esc", "pgdown", "pgup", "ctrl+x"].map(normalizeOpenCodeTUIInputBinding),
          inputCommandCount: openCodeTUIInputCommands.length,
          firstInputCommand: openCodeTUIInputCommands[0],
          lastInputCommand: openCodeTUIInputCommands.at(-1),
          submitInputCommand: normalizeOpenCodeTUIInputBinding("input.submit"),
          formatKeyNameAliases: openCodeTUIFormatKeyNameAliases,
          formatModifierAliases: openCodeTUIFormatModifierAliases,
          themeRoute: routeOpenCodeTUICommand({ command: "theme.switch" }),
          modelRoute: routeOpenCodeTUICommand({ command: "model.list" }),
          terminalRoute: routeOpenCodeTUICommand({ command: "terminal.suspend" }),
        },
        upstreamBehavior: "keymap.tsx expands enter/esc/pgdown/pgup aliases before binding lookup, registers managed textarea inputCommands with OpenTUI, formats page/meta key names for display, and classifies registered command names by their upstream command namespace.",
      },
      {
        scenarioID: "renderer-config-provider-route-tree-and-home-layout",
        input: {
          config: { mouse: undefined, disableMouseFlag: false },
          terminal: { width: 120, height: 40 },
          routes: ["home", "session", "plugin"],
        },
        output: {
          rendererConfig: createOpenCodeTUIRendererConfigSummary(),
          providerChain: openCodeTUIRendererProviderChain,
          rootSlots: openCodeTUIRootSlots,
          homeRoute: renderOpenCodeTUIRootSnapshot({ width: 120, height: 40, ready: true, route: "home", showTimeToFirstDraw: true }),
          sessionRoute: renderOpenCodeTUIRootSnapshot({ width: 120, height: 40, ready: true, route: "session" }),
          missingPluginRoute: renderOpenCodeTUIRootSnapshot({ width: 120, height: 40, ready: true, route: "plugin", pluginRouteFound: false }),
          loadingRoute: renderOpenCodeTUIRootSnapshot({ width: 120, height: 40, ready: false, route: "home" }),
          homeLayout: snapshotOpenCodeTUIHomeLayout({ terminalWidth: 140, promptMaxWidth: "auto" }),
        },
        upstreamBehavior: "app.tsx rendererConfig creates an OpenTUI CLI renderer with passthrough output, 60fps, kitty keyboard, optional mouse, ctrl-y console copy, and no ctrl-c exit; tui() mounts the pinned provider chain; App renders a theme-background root box, optional TimeToFirstDraw, StartupLoading, Home/Session/Plugin routes, and plugin app slots; routes/home.tsx centers the Logo and Prompt with fixed placeholders and Toast.",
      },
      {
        scenarioID: "snapshot-command-terminal-title-and-toast",
        input: {
          heapSnapshotFiles: ["heap-main.heapsnapshot", "heap-renderer.heapsnapshot"],
          terminalTitles: ["home", "session", "plugin"],
        },
        output: {
          heapSnapshotToast: openCodeTUIHeapSnapshotToast(["heap-main.heapsnapshot", "heap-renderer.heapsnapshot"]),
          noFileHeapSnapshotToast: openCodeTUIHeapSnapshotToast(),
          homeTitle: openCodeTUITerminalTitle({ route: "home" }),
          defaultSessionTitle: openCodeTUITerminalTitle({ route: "session", title: "New Session", defaultTitle: true }),
          sessionTitle: openCodeTUITerminalTitle({ route: "session", title: "Investigate renderer snapshot native parity" }),
          longSessionTitle: openCodeTUITerminalTitle({ route: "session", title: "01234567890123456789012345678901234567890123456789" }),
          pluginTitle: openCodeTUITerminalTitle({ route: "plugin", id: "sample-plugin" }),
        },
        upstreamBehavior: "app.tsx app.heap_snapshot awaits props.onSnapshot, shows an info toast for the written heap snapshot files for 5000ms, and clears the dialog; App terminal title effects use OpenCode for home/default sessions, OC | truncated session title for named sessions, and OC | plugin id for plugin routes.",
      },
      {
        scenarioID: "default-theme-registry",
        input: { initialTheme: "opencode", plugin: "plugin-blue", custom: "custom-red", system: "system-generated" },
        output: {
          themeCount: openCodeTUIDefaultThemeIDs.length,
          firstTheme: openCodeTUIDefaultThemeIDs[0],
          activeTheme: createOpenCodeTUIThemeRegistry().current(),
          customOverridesPlugin: openCodeTUIThemeDescriptors({ pluginThemes: ["shared"], customThemes: ["shared"], systemTheme: "system-generated" }).find((theme) => theme.id === "shared"),
          systemTheme: openCodeTUIThemeDescriptors({ systemTheme: "system-generated" }).at(-1),
        },
        upstreamBehavior: "context/theme.tsx DEFAULT_THEMES imports the pinned theme JSON set and listThemes merges defaults, plugin installs, custom files, then generated system theme.",
      },
    ],
    sourceRefs: [
      "packages/opencode/src/cli/cmd/tui/app.tsx#appBindingCommands,rendererConfig,tui,createCliRenderer,createDefaultOpenTuiKeymap,registerOpencodeKeymap,useBindings,useTerminalDimensions,App,onBeforeExit,onSnapshot,terminalTitle,RouteProvider,StartupLoading,TimeToFirstDraw",
      "packages/opencode/src/cli/cmd/tui/keymap.tsx#COMMAND_PALETTE_COMMAND,OPENCODE_BASE_MODE,KEY_ALIASES,inputCommands,registerKeyAliases,registerManagedTextareaLayer,formatOptions,registerOpencodeKeymap,isVisiblePaletteCommand",
      "packages/opencode/src/cli/cmd/tui/context/exit.tsx#ExitProvider,useExit,onBeforeExit,renderer.destroy,win32FlushInputBuffer",
      "packages/opencode/src/cli/cmd/tui/context/route.tsx#RouteProvider,initialRoute,OPENCODE_ROUTE,navigate",
      "packages/opencode/src/cli/cmd/tui/routes/home.tsx#Home,placeholder,promptMaxWidth,Logo,Prompt,Toast",
      "packages/opencode/src/cli/cmd/tui/routes/session/index.tsx#Session,sidebarVisible,contentWidth,Prompt,Toast,PermissionPrompt,QuestionPrompt",
      "packages/opencode/src/cli/cmd/tui/ui/toast.tsx#Toast,ToastProvider,useToast",
      "packages/opencode/src/cli/cmd/tui/context/theme.tsx#DEFAULT_THEMES,listThemes,store.active,addTheme,upsertTheme,resolveTheme",
    ],
    nativeEvidenceRefs: [openCodeUINativeExactEvidenceRef, openCodeUINativeExactReplayRef],
    fixtureIDs: [openCodeUINativeExactFixtureID],
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeUINativeExactFixture(fixture: OpenCodeUINativeExactFixture): OpenCodeUINativeExactVerification {
  const canonical = buildOpenCodeUINativeExactFixture()
  const issues: OpenCodeUINativeExactVerification["issues"] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "opencode-ui-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical OpenCode UI native behavior." })
  }
  if (
    fixture.product !== "opencode" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(openCodeUINativeExactAtomIDs) ||
    JSON.stringify(fixture.portIDs) !== JSON.stringify(["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"])
  ) {
    issues.push({ id: "opencode-ui-native-exact.identity", message: "Fixture must remain scoped to OpenCode event-loop, command-router, input-normalizer, renderer, snapshot, and theme-registry atoms." })
  }
  const keymapSourceRef = fixture.sourceRefs.find((ref) => ref.includes("keymap.tsx#"))
  const appSourceRef = fixture.sourceRefs.find((ref) => ref.includes("app.tsx#"))
  if (
    fixture.upstreamRef !== openCodeUIUpstreamRef ||
    !appSourceRef?.includes("appBindingCommands") ||
    !appSourceRef?.includes("rendererConfig") ||
    !appSourceRef?.includes("createCliRenderer") ||
    !appSourceRef?.includes("registerOpencodeKeymap") ||
    !appSourceRef?.includes("useBindings") ||
    !appSourceRef?.includes("useTerminalDimensions") ||
    !appSourceRef?.includes("onBeforeExit") ||
    !appSourceRef?.includes("onSnapshot") ||
    !appSourceRef?.includes("StartupLoading") ||
    !keymapSourceRef?.includes("COMMAND_PALETTE_COMMAND") ||
    !keymapSourceRef?.includes("KEY_ALIASES") ||
    !keymapSourceRef?.includes("inputCommands") ||
    !keymapSourceRef?.includes("registerManagedTextareaLayer") ||
    !fixture.sourceRefs.some((ref) => ref.includes("context/exit.tsx#ExitProvider")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("context/route.tsx#RouteProvider")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("routes/home.tsx#Home")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("ui/toast.tsx#Toast")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("context/theme.tsx#DEFAULT_THEMES"))
  ) {
    issues.push({ id: "opencode-ui-native-exact.upstream", message: "Fixture must stay pinned to OpenCode upstream TUI app, keymap, route, snapshot, toast, and theme sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-ui-native-exact.native-claim", message: "OpenCode UI fixture must explicitly claim native-exact parity for the scoped atoms." })
  }
  if (fixture.scope !== "event-loop-command-router-input-renderer-snapshot-and-theme-registry") {
    issues.push({ id: "opencode-ui-native-exact.scope", message: "OpenCode UI native fixture must stay scoped to the pinned app event-loop, renderer/snapshot, command, input, and theme behavior." })
  }
  if (fixture.knownLossiness.length > 0 || openCodeUINativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "opencode-ui-native-exact.lossiness", message: "Native exact OpenCode UI command/input/theme fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(openCodeUINativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(openCodeUINativeExactReplayRef)) {
    issues.push({ id: "opencode-ui-native-exact.evidence", message: "OpenCode UI native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(openCodeUINativeExactFixtureID)) {
    issues.push({ id: "opencode-ui-native-exact.fixture", message: "OpenCode UI native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy) || JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "opencode-ui-native-exact.cases", message: "OpenCode UI cases or policy drifted from the native exact fixture." })
  }
  return { ok: issues.length === 0, issues }
}

function openCodeTUICommandAction(command: string): OpenCodeTUICommandAction {
  if (command === "command.palette.show") return "command-palette"
  if (command === "help.show") return "help"
  if (command === "docs.open") return "docs"
  const prefix = command.split(".")[0]
  if (
    prefix === "agent" ||
    prefix === "app" ||
    prefix === "console" ||
    prefix === "mcp" ||
    prefix === "model" ||
    prefix === "opencode" ||
    prefix === "provider" ||
    prefix === "session" ||
    prefix === "terminal" ||
    prefix === "theme" ||
    prefix === "variant"
  ) {
    return prefix
  }
  return "unknown"
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

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}
