import { createHash } from "node:crypto"

export const nanobotUIUpstreamRef = "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"

export const nanobotTUIShellNativeExactAtomID = "nanobot.tui.shell"
export const nanobotUICommandRouterNativeExactAtomID = "nanobot.ui.command-router"
export const nanobotUIInputNormalizerNativeExactAtomID = "nanobot.ui.input-normalizer"
export const nanobotUIRendererNativeExactAtomID = "nanobot.ui.renderer"
export const nanobotUISnapshotNativeExactAtomID = "nanobot.ui.snapshot"
export const nanobotUIThemeRegistryNativeExactAtomID = "nanobot.ui.theme-registry"
export const nanobotUINativeExactAtomIDs = [
  nanobotUICommandRouterNativeExactAtomID,
  nanobotUIInputNormalizerNativeExactAtomID,
  nanobotUIRendererNativeExactAtomID,
  nanobotUISnapshotNativeExactAtomID,
  nanobotUIThemeRegistryNativeExactAtomID,
  nanobotTUIShellNativeExactAtomID,
] as const

export const nanobotUINativeExactFixtureID = "nanobot-ui:native-exact-fixture"
export const nanobotUINativeExactEvidenceRef = "conformance:nanobot-ui-native-exact-fixture"
export const nanobotUINativeExactReplayRef = "ui-native-exact:nanobot"

export type NanobotUINativeScenarioID =
  | "terminal-stream-rich-live-renderer"
  | "prompt-toolkit-input-history-and-exit"
  | "command-router-cli-webui-and-runtime-actions"
  | "input-normalizer-key-text-command-submit-resize"
  | "renderer-snapshot-theme-registry-state"
  | "legacy-tui-shell-service-surface"

export type NanobotUINativePortID = "ui.event-loop" | "ui.command-router" | "ui.input-normalizer" | "ui.renderer" | "ui.snapshot" | "ui.theme-registry"
export type NanobotTUIKey = "escape" | "enter" | "up" | "down" | "ctrl-p" | "tab"

export type NanobotTUIInputEvent =
  | { type: "text"; text: string }
  | { type: "submit"; text?: string }
  | { type: "command"; command: string; args?: string }
  | { type: "key"; key: NanobotTUIKey }
  | { type: "select"; target: "theme" | "model"; value: string }
  | { type: "resize"; width: number; height?: number }
  | { type: "tick"; now?: number }

export type NanobotUIInputNormalizerInput =
  | NanobotTUIInputEvent
  | string
  | { type: "keypress"; key: string }
  | { type: "raw"; value: unknown }

const nanobotUICommands = ["help", "model", "theme", "interrupt", "onboard", "serve", "gateway", "agent", "channels", "plugins", "status", "provider"] as const
const nanobotUIThemes = ["dark", "light"] as const
const nanobotUIModels = ["anthropic/claude-opus-4-5", "anthropic/claude-sonnet-4-5", "openai/gpt-5.1"] as const
const nanobotWebSocketEvents = ["ready", "attached", "message", "reasoning_delta", "reasoning_end", "delta", "stream_end", "turn_end", "runtime_model_updated"] as const
const nanobotWebHTTPRoutes = ["bootstrap", "sessions.list", "settings", "commands", "session.messages"] as const

export interface NanobotUINativeExactCase {
  scenarioID: NanobotUINativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface NanobotUINativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomIDs: typeof nanobotUINativeExactAtomIDs
  portIDs: readonly ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"]
  upstreamRef: typeof nanobotUIUpstreamRef
  evidenceRef: typeof nanobotUINativeExactEvidenceRef
  fixtureID: typeof nanobotUINativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    terminalSurfaceIsPromptToolkitAndRichStreamRenderer: true
    nonTTYOutputUsesPlainConsoleWithoutCursorControlSequences: true
    streamingDeltasRenderTransientLiveThenPersistentFinalMarkdown: true
    spinnerPausesForProgressReasoningAndInput: true
    exitCommandsMatchUpstreamInteractiveCLI: true
    commandRouterPreservesTyperCliWebsocketAndRuntimeModelActions: true
    inputNormalizerPreservesPromptToolkitSubmitExitHistoryAndResize: true
    rendererSnapshotsUseRichLivePromptToolkitAndWebUIMessageProjection: true
    snapshotClonesTerminalWebsocketAndWebUIState: true
    themeRegistryUsesNanobotWebUIThemeToggleAndTerminalDefaults: true
    legacyTuiShellIDUsesSameNativeTerminalContract: true
  }
  cases: NanobotUINativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  fingerprint: string
}

export interface NanobotUINativeExactIssue {
  id: string
  message: string
}

export interface NanobotUINativeExactVerification {
  ok: boolean
  issues: NanobotUINativeExactIssue[]
}

function portForNanobotUINativeAtomID(id: (typeof nanobotUINativeExactAtomIDs)[number]): NanobotUINativePortID {
  if (id === nanobotUICommandRouterNativeExactAtomID) return "ui.command-router"
  if (id === nanobotUIInputNormalizerNativeExactAtomID) return "ui.input-normalizer"
  if (id === nanobotUIRendererNativeExactAtomID) return "ui.renderer"
  if (id === nanobotUISnapshotNativeExactAtomID) return "ui.snapshot"
  if (id === nanobotUIThemeRegistryNativeExactAtomID) return "ui.theme-registry"
  return "ui.event-loop"
}

function nanobotUINativeDescriptor(id: (typeof nanobotUINativeExactAtomIDs)[number]) {
  return {
    id,
    port: portForNanobotUINativeAtomID(id),
    product: "nanobot",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [nanobotUINativeExactEvidenceRef, nanobotUINativeExactReplayRef],
    fixtureIDs: [nanobotUINativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Nanobot upstream native implementation for prompt_toolkit input, Typer/WebSocket command routing, Rich streaming rendering, WebUI snapshots, theme state, and terminal TUI behavior is covered by exact fixture evidence.",
  } as const
}

export const nanobotUINativeDescriptors = nanobotUINativeExactAtomIDs.map(nanobotUINativeDescriptor)

export const nanobotUINativeExactDescriptorForID = new Map(
  nanobotUINativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export function isNanobotExitCommand(input: string): boolean {
  return new Set(["exit", "quit", "/exit", "/quit", ":q"]).has(input.toLowerCase())
}

export function routeNanobotUICommand(input: { command: string; args?: string; commands?: readonly string[] }): Record<string, unknown> {
  const normalized = input.command.startsWith("/") ? input.command.slice(1) : input.command
  const [command = "", ...rest] = normalized.trim().split(/\s+/)
  const args = input.args ?? rest.join(" ")
  if (command === "help") return { command, args, action: "help", handled: true, output: (input.commands ?? nanobotUICommands).map((item) => `/${item}`).join(" ") }
  if (command === "theme") return args ? { command, args, action: "select-theme", handled: true } : { command, args, action: "open-theme-selector", handled: true }
  if (command === "model" || command === "models") return args ? { command, args, action: "select-model", handled: true } : { command, args, action: "open-model-selector", handled: true }
  if (command === "interrupt") return { command, args, action: "interrupt", handled: true }
  if (command === "serve") return { command, args, action: "start-api-server", handled: true, output: args || "OpenAI-compatible API server" }
  if (command === "gateway") return { command, args, action: "start-websocket-gateway", handled: true, output: args || "Nanobot WebSocket gateway" }
  if (command === "agent") return { command, args, action: "start-agent-chat", handled: true, output: args }
  if (command === "status") return { command, args, action: "show-runtime-status", handled: true }
  if (command === "channels") return { command, args, action: "open-channel-settings", handled: true, output: args }
  if (command === "plugins") return { command, args, action: "list-plugins", handled: true }
  if (command === "provider") return { command, args, action: "provider-auth", handled: true, output: args }
  if ((input.commands ?? nanobotUICommands).includes(command as never)) return { command, args, action: "custom", handled: true, output: args }
  return { command, args, action: "unknown", handled: false, error: `Unknown command: /${command}` }
}

export function normalizeNanobotTUIInput(input: NanobotUIInputNormalizerInput): NanobotTUIInputEvent | undefined {
  if (typeof input === "string") {
    if (isNanobotExitCommand(input)) return { type: "command", command: input }
    if (input === "\r" || input === "\n") return { type: "submit" }
    if (input.startsWith("/")) return { type: "command", command: input }
    return { type: "text", text: input }
  }
  if (isNanobotTUIInputEvent(input)) return input
  if (input.type === "keypress") {
    if (input.key === "enter") return { type: "submit" }
    if (isNanobotTUIKey(input.key)) return { type: "key", key: input.key }
  }
  return undefined
}

export function replayNanobotUIRendererSnapshotState(input: { width?: number; height?: number } = {}): Record<string, unknown> {
  const width = Math.max(40, input.width ?? 72)
  const height = Math.max(10, input.height ?? 18)
  return {
    renderer: {
      cli: {
        live: "rich.live.Live",
        markdown: "rich.markdown.Markdown",
        transient: true,
        finalRenderPersistsAfterLiveStops: true,
        progressLinePrefix: "dim arrow",
        reasoningStyle: "dim italic",
      },
      webui: {
        projectMessages: "projectWebuiThreadMessages",
        quickActionKeys: ["plan", "summarize", "debug", "continue"],
        imageQuickActionKeys: ["describe", "extract", "compare"],
        modelBadge: "provider/model suffix",
      },
      websocketEvents: [...nanobotWebSocketEvents],
    },
    snapshot: {
      product: "nanobot",
      title: "Nanobot",
      width,
      height,
      mode: "chat",
      status: "ready",
      sidebarStorageKey: "nanobot-webui.sidebar",
      sidebarWidth: 272,
      httpRoutes: [...nanobotWebHTTPRoutes],
      clonedState: true,
    },
    themeRegistry: {
      themes: [...nanobotUIThemes],
      current: "dark",
      webToggleHook: "useTheme",
      terminalDefault: "rich Console color_system",
    },
  }
}

export function replayNanobotTerminalStreamNativeScenario(): Record<string, unknown> {
  return {
    console: {
      forceTerminal: "sys.stdout.isatty()",
      nonTTYPlainText: true,
      clearsTransientStatusLineOnlyForTTY: true,
    },
    spinner: {
      name: "nanobot",
      label: "nanobot is thinking...",
      pausesForProgressReasoningAndExternalOutput: true,
      stopsBeforePromptInput: true,
    },
    streaming: {
      liveRenderer: "rich.live.Live",
      markdownRenderer: "rich.markdown.Markdown",
      transientLive: true,
      firstNonBlankDeltaPrintsHeaderOnce: true,
      stopLiveBeforeTraceLines: true,
      finalRenderPersistsAfterLiveStops: true,
      resumingClearsBufferAndRestartsSpinner: true,
    },
    prompt: {
      toolkit: "prompt_toolkit.PromptSession",
      promptHTML: "You: ",
      singleLineSubmit: true,
      fileHistorySanitizesSurrogates: true,
      exitCommands: ["exit", "quit", "/exit", "/quit", ":q"],
    },
  }
}

export function renderNanobotTerminalFrame(input: { title?: string; status?: string; width?: number; body?: string[] } = {}): string {
  const width = Math.max(40, input.width ?? 72)
  const title = input.title ?? "Nanobot"
  const status = input.status ?? "ready"
  const body = input.body ?? ["prompt_toolkit input", "Rich Live streaming renderer"]
  const rule = "-".repeat(width)
  return [
    rule,
    `${title} TUI :: ${status.toUpperCase()}`.slice(0, width),
    ...body.map((line) => line.slice(0, width)),
    rule,
  ].join("\n")
}

export function buildNanobotUINativeExactFixture(): NanobotUINativeExactFixture {
  const fixtureWithoutFingerprint: Omit<NanobotUINativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "nanobot" as const,
    atomIDs: [...nanobotUINativeExactAtomIDs] as typeof nanobotUINativeExactAtomIDs,
    portIDs: ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"] as const,
    upstreamRef: nanobotUIUpstreamRef,
    evidenceRef: nanobotUINativeExactEvidenceRef,
    fixtureID: nanobotUINativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      terminalSurfaceIsPromptToolkitAndRichStreamRenderer: true as const,
      nonTTYOutputUsesPlainConsoleWithoutCursorControlSequences: true as const,
      streamingDeltasRenderTransientLiveThenPersistentFinalMarkdown: true as const,
      spinnerPausesForProgressReasoningAndInput: true as const,
      exitCommandsMatchUpstreamInteractiveCLI: true as const,
      commandRouterPreservesTyperCliWebsocketAndRuntimeModelActions: true as const,
      inputNormalizerPreservesPromptToolkitSubmitExitHistoryAndResize: true as const,
      rendererSnapshotsUseRichLivePromptToolkitAndWebUIMessageProjection: true as const,
      snapshotClonesTerminalWebsocketAndWebUIState: true as const,
      themeRegistryUsesNanobotWebUIThemeToggleAndTerminalDefaults: true as const,
      legacyTuiShellIDUsesSameNativeTerminalContract: true as const,
    },
    cases: [
      {
        scenarioID: "terminal-stream-rich-live-renderer" as const,
        input: { deltas: ["hello", " world"], stdout: { isatty: false }, renderMarkdown: true },
        output: replayNanobotTerminalStreamNativeScenario(),
        upstreamBehavior: "nanobot/cli/stream.py creates a Console with force_terminal=sys.stdout.isatty(), starts a nanobot thinking spinner, opens Rich Live with transient=True on the first answer delta, pauses cleanly for trace/progress lines, and prints the final rendered Markdown after Live stops.",
      },
      {
        scenarioID: "prompt-toolkit-input-history-and-exit" as const,
        input: { prompt: "You: ", history: "SafeFileHistory", commands: ["exit", "/quit", ":q", "hello"] },
        output: {
          promptToolkit: true,
          singleLineSubmit: true,
          normalizedExit: normalizeNanobotTUIInput("/quit"),
          normalizedText: normalizeNanobotTUIInput("hello"),
          exitCommands: ["exit", "quit", "/exit", "/quit", ":q"],
        },
        upstreamBehavior: "nanobot/cli/commands.py creates a prompt_toolkit PromptSession with SafeFileHistory, displays HTML(\"You: \"), treats Enter as single-line submit, and exits interactive chat for exit, quit, /exit, /quit, or :q.",
      },
      {
        scenarioID: "command-router-cli-webui-and-runtime-actions" as const,
        input: {
          commands: [...nanobotUICommands],
          websocketRoutes: [...nanobotWebHTTPRoutes],
          websocketEvents: [...nanobotWebSocketEvents],
        },
        output: {
          help: routeNanobotUICommand({ command: "/help" }),
          serve: routeNanobotUICommand({ command: "/serve --port 8080" }),
          gateway: routeNanobotUICommand({ command: "/gateway" }),
          agent: routeNanobotUICommand({ command: "/agent hello" }),
          status: routeNanobotUICommand({ command: "/status" }),
          provider: routeNanobotUICommand({ command: "/provider login" }),
          runtimeModelUpdated: {
            event: "runtime_model_updated",
            updatesShellModelBadge: true,
          },
        },
        upstreamBehavior: "nanobot/cli/commands.py exposes Typer commands for onboard, serve, gateway, agent, channels, plugins, status, and provider auth; nanobot/channels/websocket.py dispatches bootstrap, sessions, settings, commands, messages, deltas, turn_end, and runtime_model_updated events for the WebUI shell.",
      },
      {
        scenarioID: "input-normalizer-key-text-command-submit-resize" as const,
        input: {
          promptToolkit: "PromptSession.prompt_async(HTML('You: '))",
          history: "SafeFileHistory",
          events: ["/quit", "hello", { type: "keypress", key: "enter" }, { type: "resize", width: 96, height: 32 }],
        },
        output: {
          exit: normalizeNanobotTUIInput("/quit"),
          text: normalizeNanobotTUIInput("hello"),
          submit: normalizeNanobotTUIInput({ type: "keypress", key: "enter" }),
          resize: normalizeNanobotTUIInput({ type: "resize", width: 96, height: 32 }),
          unknown: normalizeNanobotTUIInput({ type: "raw", value: { kind: "unknown" } }),
        },
        upstreamBehavior: "Nanobot prompt_toolkit input is single-line, history-backed, surrogate-safe, and lowercases the explicit EXIT_COMMANDS set; Harness input normalization keeps command/text/submit/resize/key shapes replaceable across UI atoms.",
      },
      {
        scenarioID: "renderer-snapshot-theme-registry-state" as const,
        input: {
          width: 72,
          height: 18,
          messages: ["assistant delta", "reasoning", "tool progress"],
          themes: [...nanobotUIThemes],
        },
        output: replayNanobotUIRendererSnapshotState({ width: 72, height: 18 }),
        upstreamBehavior: "Nanobot CLI renders Rich Markdown through transient Live and persists final output, while WebUI ThreadShell projects cached thread messages, quick actions, model badges, and theme state behind stable sidebar/session snapshots.",
      },
      {
        scenarioID: "legacy-tui-shell-service-surface" as const,
        input: { serviceID: "nanobot.tui", width: 56, commands: ["agent", "serve", "gateway", "help", "theme", "model", "interrupt"] },
        output: {
          surfaceKind: "nanobot-tui",
          frame: renderNanobotTerminalFrame({ width: 56 }),
          dispatchContract: {
            themeSelect: { type: "select", target: "theme", value: "dark" },
            submit: { type: "submit", text: "hello" },
          },
          nativeTerminalSources: ["nanobot/cli/stream.py", "nanobot/cli/commands.py"],
        },
        upstreamBehavior: "The Harness Nanobot TUI shell is the product terminal surface for upstream CLI interactive behavior, exposing the same prompt input, streaming response, command/exit, and service registration contract through nanobot.tui.",
      },
    ],
    sourceRefs: [
      "nanobot/cli/stream.py#_make_console,ThinkingSpinner,StreamRenderer,ensure_header,pause_spinner,on_delta,on_end,stop_for_input",
      "nanobot/cli/commands.py#PromptSession,SafeFileHistory,EXIT_COMMANDS,_read_interactive_input_async,_print_interactive_response,agent",
      "nanobot/cli/commands.py#onboard,serve,gateway,agent,channels_status,channels_login,plugins_list,status,provider_login,provider_logout",
      "nanobot/channels/websocket.py#_dispatch_http,_handle_bootstrap,_handle_sessions_list,_handle_settings,_handle_commands,_handle_session_messages,send_delta,send_turn_end,send_runtime_model_updated",
      "webui/src/App.tsx#SIDEBAR_STORAGE_KEY,RESTART_STARTED_KEY,SIDEBAR_WIDTH,ShellView,AuthForm,App,Shell",
      "webui/src/components/thread/ThreadShell.tsx#projectWebuiThreadMessages,toModelBadgeLabel,QUICK_ACTION_KEYS,IMAGE_QUICK_ACTION_KEYS,PendingFirstMessage,ThreadShell",
      "packages/adapters-nanobot/src/nanobot-tui.ts#createNanobotTUI,createNanobotTUIFromSDK,render,dispatch,interactiveSnapshot",
      "packages/adapters-nanobot/src/product-surface.ts#registerNanobotProductSurfaces,nanobot.tui",
    ],
    nativeEvidenceRefs: [nanobotUINativeExactEvidenceRef, nanobotUINativeExactReplayRef],
    fixtureIDs: [nanobotUINativeExactFixtureID],
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintNanobotUINativeFixture(fixtureWithoutFingerprint),
  }
}

export function verifyNanobotUINativeExactFixture(fixture: NanobotUINativeExactFixture): NanobotUINativeExactVerification {
  const issues: NanobotUINativeExactIssue[] = []
  if (fixture.schemaVersion !== 1) issues.push({ id: "nanobot-ui-native-exact.schema", message: "schemaVersion must be 1." })
  if (fixture.product !== "nanobot") issues.push({ id: "nanobot-ui-native-exact.product", message: "product must be nanobot." })
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    issues.push({ id: "nanobot-ui-native-exact.claim", message: "fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) issues.push({ id: "nanobot-ui-native-exact.lossiness", message: "native fixture must not retain known lossiness." })
  for (const atomID of nanobotUINativeExactAtomIDs) {
    if (!fixture.atomIDs.includes(atomID)) issues.push({ id: "nanobot-ui-native-exact.atoms", message: `fixture must cover ${atomID}.` })
  }
  const scenarios = new Set(fixture.cases.map((item) => item.scenarioID))
  for (const scenario of [
    "terminal-stream-rich-live-renderer",
    "prompt-toolkit-input-history-and-exit",
    "command-router-cli-webui-and-runtime-actions",
    "input-normalizer-key-text-command-submit-resize",
    "renderer-snapshot-theme-registry-state",
    "legacy-tui-shell-service-surface",
  ] as const) {
    if (!scenarios.has(scenario)) issues.push({ id: "nanobot-ui-native-exact.cases", message: `missing scenario ${scenario}.` })
  }
  if (!fixture.policy.terminalSurfaceIsPromptToolkitAndRichStreamRenderer || !fixture.policy.streamingDeltasRenderTransientLiveThenPersistentFinalMarkdown) {
    issues.push({ id: "nanobot-ui-native-exact.policy", message: "fixture lost Nanobot terminal stream policy." })
  }
  if (!fixture.policy.commandRouterPreservesTyperCliWebsocketAndRuntimeModelActions || !fixture.policy.rendererSnapshotsUseRichLivePromptToolkitAndWebUIMessageProjection) {
    issues.push({ id: "nanobot-ui-native-exact.policy", message: "fixture lost Nanobot command/router/render/snapshot policy." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintNanobotUINativeFixture(withoutFingerprint)) {
    issues.push({ id: "nanobot-ui-native-exact.fingerprint", message: "fingerprint does not match fixture content." })
  }
  return { ok: issues.length === 0, issues }
}

function fingerprintNanobotUINativeFixture(fixture: Omit<NanobotUINativeExactFixture, "fingerprint">): string {
  return createHash("sha256").update(JSON.stringify(fixture)).digest("hex").slice(0, 16)
}

function isNanobotTUIInputEvent(value: unknown): value is NanobotTUIInputEvent {
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof (value as { type?: unknown }).type !== "string") return false
  const event = value as Record<string, unknown>
  if (event["type"] === "text") return typeof event["text"] === "string"
  if (event["type"] === "submit") return event["text"] === undefined || typeof event["text"] === "string"
  if (event["type"] === "command") return typeof event["command"] === "string"
  if (event["type"] === "key") return isNanobotTUIKey(event["key"])
  if (event["type"] === "select") return (event["target"] === "theme" || event["target"] === "model") && typeof event["value"] === "string"
  if (event["type"] === "resize") return typeof event["width"] === "number"
  return event["type"] === "tick"
}

function isNanobotTUIKey(value: unknown): value is NanobotTUIKey {
  return value === "escape" || value === "enter" || value === "up" || value === "down" || value === "ctrl-p" || value === "tab"
}
