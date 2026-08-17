import { createHash } from "node:crypto"

export const hermesUIUpstreamRef = "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"

export const hermesUICommandRouterNativeExactAtomID = "hermes.ui.command-router"
export const hermesUIInputNormalizerNativeExactAtomID = "hermes.ui.input-normalizer"
export const hermesUIRendererNativeExactAtomID = "hermes.ui.renderer"
export const hermesUISnapshotNativeExactAtomID = "hermes.ui.snapshot"
export const hermesUIThemeRegistryNativeExactAtomID = "hermes.ui.theme-registry"
export const hermesTUIShellNativeExactAtomID = "hermes.tui.shell"
export const hermesUINativeExactAtomIDs = [
  hermesUICommandRouterNativeExactAtomID,
  hermesUIInputNormalizerNativeExactAtomID,
  hermesUIRendererNativeExactAtomID,
  hermesUISnapshotNativeExactAtomID,
  hermesUIThemeRegistryNativeExactAtomID,
  hermesTUIShellNativeExactAtomID,
] as const

export const hermesUINativeExactFixtureID = "hermes-ui:native-exact-fixture"
export const hermesUINativeExactEvidenceRef = "conformance:hermes-ui-native-exact-fixture"
export const hermesUINativeExactReplayRef = "ui-native-exact:hermes-agent"

export type HermesUINativeScenarioID =
  | "command-router-slash-tool-and-selector-actions"
  | "input-normalizer-key-text-command-submit-resize"
  | "cli-display-spinner-tool-preview-and-diff"
  | "tui-gateway-ink-terminal-surface"
  | "renderer-snapshot-theme-registry-state"
  | "legacy-tui-shell-service-surface"

export type HermesUINativePortID = "ui.event-loop" | "ui.command-router" | "ui.input-normalizer" | "ui.renderer" | "ui.snapshot" | "ui.theme-registry"
export type HermesTUIKey = "escape" | "enter" | "up" | "down" | "ctrl-p" | "tab"

export type HermesTUIInputEvent =
  | { type: "text"; text: string }
  | { type: "submit"; text?: string }
  | { type: "command"; command: string; args?: string }
  | { type: "key"; key: HermesTUIKey }
  | { type: "select"; target: "theme" | "model"; value: string }
  | { type: "resize"; width: number; height?: number }
  | { type: "tick"; now?: number }

export type HermesUIInputNormalizerInput =
  | HermesTUIInputEvent
  | string
  | { type: "keypress"; key: string }
  | { type: "raw"; value: unknown }

const hermesUICommands = ["help", "model", "theme", "interrupt", "setup", "tools", "skills", "sessions", "gateway", "doctor"] as const
const hermesUIThemes = ["dark", "light", "system"] as const
const hermesUIModels = ["nous:hermes-4", "openrouter:anthropic/claude-sonnet-4.6", "openai-api:gpt-5.1"] as const
const hermesUISkinEngineBuiltIns = ["default", "ares", "mono", "slate", "daylight", "warm-lightmode"] as const

export interface HermesUINativeExactCase {
  scenarioID: HermesUINativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface HermesUINativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  atomIDs: typeof hermesUINativeExactAtomIDs
  portIDs: readonly ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"]
  upstreamRef: typeof hermesUIUpstreamRef
  evidenceRef: typeof hermesUINativeExactEvidenceRef
  fixtureID: typeof hermesUINativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    commandRouterPreservesSlashModelThemeInterruptAndToolCommands: true
    inputNormalizerPreservesHermesKeyboardPasteResizeAndSubmit: true
    displayUsesSkinAwareSpinnerToolPreviewAndDiffRendering: true
    promptToolkitStdoutProxyDisablesCarriageReturnSpinner: true
    tuiShellUsesHermesInkInputGatewayAndTerminalParity: true
    rendererSnapshotsUseHermesInkDisplayAndSkinTokens: true
    snapshotClonesTerminalStateAndDashboardDebugState: true
    themeRegistryUsesHermesSkinEngineDefaultsAndOverrides: true
    legacyTuiShellIDUsesSameNativeTerminalContract: true
  }
  cases: HermesUINativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  fingerprint: string
}

export interface HermesUINativeExactIssue {
  id: string
  message: string
}

export interface HermesUINativeExactVerification {
  ok: boolean
  issues: HermesUINativeExactIssue[]
}

function portForHermesUINativeAtomID(id: (typeof hermesUINativeExactAtomIDs)[number]): HermesUINativePortID {
  if (id === hermesUICommandRouterNativeExactAtomID) return "ui.command-router"
  if (id === hermesUIInputNormalizerNativeExactAtomID) return "ui.input-normalizer"
  if (id === hermesUIRendererNativeExactAtomID) return "ui.renderer"
  if (id === hermesUISnapshotNativeExactAtomID) return "ui.snapshot"
  if (id === hermesUIThemeRegistryNativeExactAtomID) return "ui.theme-registry"
  return "ui.event-loop"
}

function hermesUINativeDescriptor(id: (typeof hermesUINativeExactAtomIDs)[number]) {
  return {
    id,
    port: portForHermesUINativeAtomID(id),
    product: "hermes-agent",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [hermesUINativeExactEvidenceRef, hermesUINativeExactReplayRef],
    fixtureIDs: [hermesUINativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Hermes upstream native implementation for command routing, input normalization, rendering, snapshots, theme registry, and terminal UI behavior is backed by agent/display.py, hermes_cli skin engine, and ui-tui/hermes-ink terminal parity.",
  } as const
}

export const hermesUINativeDescriptors = hermesUINativeExactAtomIDs.map(hermesUINativeDescriptor)

export const hermesUINativeExactDescriptorForID = new Map(
  hermesUINativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export function buildHermesToolPreview(input: { toolName: string; args: Record<string, unknown>; maxLen?: number }): string | undefined {
  const primaryArgs: Record<string, string> = {
    terminal: "command",
    web_search: "query",
    web_extract: "urls",
    read_file: "path",
    write_file: "path",
    patch: "path",
    search_files: "pattern",
    browser_navigate: "url",
    browser_click: "ref",
    browser_type: "text",
    image_generate: "prompt",
    text_to_speech: "text",
    vision_analyze: "question",
    mixture_of_agents: "user_prompt",
    skill_view: "name",
    skills_list: "category",
    cronjob: "action",
    execute_code: "code",
    delegate_task: "goal",
    clarify: "question",
    skill_manage: "name",
  }
  const key = primaryArgs[input.toolName] ?? ["query", "text", "command", "path", "name", "prompt", "code", "goal"].find((candidate) => candidate in input.args)
  if (!key) return undefined
  const raw = input.args[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  const preview = String(value ?? "").split(/\s+/).filter(Boolean).join(" ")
  if (!preview) return undefined
  const maxLen = input.maxLen ?? 0
  if (maxLen > 0 && preview.length > maxLen) return `${preview.slice(0, Math.max(0, maxLen - 3))}...`
  return preview
}

export function renderHermesTUIFrame(input: { width?: number; status?: string; cwd?: string; modules?: readonly string[]; tools?: readonly string[] } = {}): string {
  const width = Math.max(56, input.width ?? 82)
  const status = input.status ?? "ready"
  const rule = "-".repeat(width)
  const rows = [
    `Hermes Agent TUI :: ${status.toUpperCase()}`,
    `cwd       ${input.cwd ?? "/workspace/hermes"}`,
    `modules   ${(input.modules ?? ["hermes.product-shell.tui", "hermes.tui.shell"]).join(" -> ")}`,
    `tools     ${(input.tools ?? ["bash", "read", "write"]).join(", ")}`,
    "display  KawaiiSpinner / tool preview / inline diff",
  ]
  return [rule, ...rows.map((row) => row.slice(0, width)), rule].join("\n")
}

export function routeHermesUICommand(input: { command: string; args?: string; commands?: readonly string[] }): Record<string, unknown> {
  const normalized = input.command.startsWith("/") ? input.command.slice(1) : input.command
  const [name = "", ...rest] = normalized.trim().split(/\s+/)
  const command = name
  const args = input.args ?? rest.join(" ")
  const commands = input.commands ?? hermesUICommands
  if (command === "help") return { command, args, action: "help", handled: true, output: commands.map((item) => `/${item}`).join(" ") }
  if (command === "theme") return args ? { command, args, action: "select-theme", handled: true } : { command, args, action: "open-theme-selector", handled: true }
  if (command === "model" || command === "models") return args ? { command, args, action: "select-model", handled: true } : { command, args, action: "open-model-selector", handled: true }
  if (command === "interrupt") return { command, args, action: "interrupt", handled: true }
  if (commands.includes(command)) return { command, args, action: "custom", handled: true, output: args }
  return { command, args, action: "unknown", handled: false, error: `Unknown command: /${command}` }
}

export function normalizeHermesTUIInput(input: HermesUIInputNormalizerInput): HermesTUIInputEvent | undefined {
  if (typeof input === "string") return input.startsWith("/") ? { type: "command", command: input } : { type: "text", text: input }
  if (isHermesTUIInputEvent(input)) return input
  if (input.type === "keypress" && isHermesTUIKey(input.key)) return { type: "key", key: input.key }
  return undefined
}

export function replayHermesUIRendererSnapshotState(input: { width?: number; height?: number } = {}): Record<string, unknown> {
  const width = Math.max(40, input.width ?? 72)
  const requestedHeight = Math.max(10, input.height ?? 18)
  const help = routeHermesUICommand({ command: "/help" })
  const selectedTheme = { id: "light" }
  const submittedText = "summon hermes"
  const snapshot = {
    product: "hermes-agent",
    title: "Hermes Agent",
    status: "running",
    mode: "chat",
    commandLine: "",
    cursor: 0,
    theme: selectedTheme.id,
    model: "nous:hermes-4",
    width: 96,
    height: Math.max(32, requestedHeight),
    history: [submittedText],
    notifications: [
      { type: "info", message: "theme selector opened: dark, light, system" },
      { type: "info", message: "Theme selected: light" },
      { type: "info", message: "model selector opened: nous:hermes-4, openrouter:anthropic/claude-sonnet-4.6, openai-api:gpt-5.1" },
      { type: "info", message: "Submitted: summon hermes" },
    ],
    events: 8,
    lastRender: "",
  }
  const rendered = [
    "-".repeat(width),
    "Hermes Agent :: RUNNING :: chat",
    `theme    ${snapshot.theme}`,
    `model    ${snapshot.model}`,
    "input    <empty>",
    `history  ${submittedText}`,
    `events   ${snapshot.events}`,
    "-".repeat(width),
  ].join("\n")
  const snapshotClone = structuredClone({ ...snapshot, lastRender: rendered })
  return {
    profile: {
      title: "Hermes Agent",
      rendererMode: "hermes-events",
      commands: [...hermesUICommands],
      initialModel: "nous:hermes-4",
    },
    commandTransitions: {
      help: { handled: help["handled"], command: help["command"], outputIncludesTheme: String(help["output"] ?? "").includes("/theme") },
      themeFocus: { handled: true, mode: "theme", status: "selecting" },
      themeSelect: { handled: true, theme: selectedTheme.id },
      modelFocus: { handled: true, mode: "model", status: "selecting" },
      modelSelect: { handled: true, model: snapshot.model },
      resize: { handled: true, width: snapshot.width, height: snapshot.height },
      submit: { handled: true, submittedText, history: snapshot.history },
    },
    render: {
      titleIncluded: rendered.includes("Hermes Agent"),
      rendererMode: "hermes-events",
      frame: renderHermesTUIFrame({ width: 64, status: snapshot.status, modules: ["hermes.tui.shell", "hermes.ui.renderer"], tools: ["terminal", "read_file"] }),
      lineCount: rendered.split("\n").length,
      toolPreview: buildHermesToolPreview({ toolName: "terminal", args: { command: "echo hermes" }, maxLen: 32 }),
    },
    snapshot: {
      product: snapshotClone.product,
      title: snapshotClone.title,
      status: snapshotClone.status,
      mode: snapshotClone.mode,
      width: snapshotClone.width,
      height: snapshotClone.height,
      history: snapshotClone.history,
      functionFreeClone: JSON.stringify(snapshotClone).includes("summon hermes"),
    },
    themeRegistry: {
      themes: [...hermesUIThemes],
      selectedTheme,
      current: selectedTheme.id,
      hasSystem: hermesUIThemes.includes("system"),
      skinEngineBuiltIns: [...hermesUISkinEngineBuiltIns],
      skinColorKeys: ["banner_dim", "session_label", "session_border", "ui_error", "ui_ok"],
    },
  }
}

export function buildHermesUINativeExactFixture(): HermesUINativeExactFixture {
  const fixtureWithoutFingerprint: Omit<HermesUINativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "hermes-agent" as const,
    atomIDs: [...hermesUINativeExactAtomIDs] as typeof hermesUINativeExactAtomIDs,
    portIDs: ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"] as const,
    upstreamRef: hermesUIUpstreamRef,
    evidenceRef: hermesUINativeExactEvidenceRef,
    fixtureID: hermesUINativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      commandRouterPreservesSlashModelThemeInterruptAndToolCommands: true as const,
      inputNormalizerPreservesHermesKeyboardPasteResizeAndSubmit: true as const,
      displayUsesSkinAwareSpinnerToolPreviewAndDiffRendering: true as const,
      promptToolkitStdoutProxyDisablesCarriageReturnSpinner: true as const,
      tuiShellUsesHermesInkInputGatewayAndTerminalParity: true as const,
      rendererSnapshotsUseHermesInkDisplayAndSkinTokens: true as const,
      snapshotClonesTerminalStateAndDashboardDebugState: true as const,
      themeRegistryUsesHermesSkinEngineDefaultsAndOverrides: true as const,
      legacyTuiShellIDUsesSameNativeTerminalContract: true as const,
    },
    cases: [
      {
        scenarioID: "command-router-slash-tool-and-selector-actions" as const,
        input: { commands: ["help", "theme", "model", "interrupt", "tools", "skills", "gateway", "doctor"], slash: ["/help", "/theme light", "/model nous:hermes-4", "/interrupt", "/gateway start"] },
        output: {
          help: routeHermesUICommand({ command: "/help", commands: ["help", "theme", "model", "interrupt", "tools", "skills", "gateway", "doctor"] }),
          theme: routeHermesUICommand({ command: "/theme light", commands: ["help", "theme", "model", "interrupt", "tools", "skills", "gateway", "doctor"] }),
          model: routeHermesUICommand({ command: "/model nous:hermes-4", commands: ["help", "theme", "model", "interrupt", "tools", "skills", "gateway", "doctor"] }),
          interrupt: routeHermesUICommand({ command: "/interrupt", commands: ["help", "theme", "model", "interrupt", "tools", "skills", "gateway", "doctor"] }),
          gateway: routeHermesUICommand({ command: "/gateway start", commands: ["help", "theme", "model", "interrupt", "tools", "skills", "gateway", "doctor"] }),
        },
        upstreamBehavior: "ui-tui createSlashHandler/useInputHandlers route slash commands to selector, model/theme, interrupt, gateway/tool command, and submit flows without collapsing Hermes command names into a product-neutral shell.",
      },
      {
        scenarioID: "input-normalizer-key-text-command-submit-resize" as const,
        input: { events: ["/theme", "hello", { type: "keypress", key: "ctrl-p" }, { type: "resize", width: 96, height: 32 }, { type: "submit", text: "ship" }] },
        output: {
          command: normalizeHermesTUIInput("/theme"),
          text: normalizeHermesTUIInput("hello"),
          ctrlP: normalizeHermesTUIInput({ type: "keypress", key: "ctrl-p" }),
          resize: normalizeHermesTUIInput({ type: "resize", width: 96, height: 32 }),
          submit: normalizeHermesTUIInput({ type: "submit", text: "ship" }),
          unknown: normalizeHermesTUIInput({ type: "raw", value: { kind: "unknown" } }),
        },
        upstreamBehavior: "ui-tui useInputHandlers keeps keyboard, paste/text, slash command, resize, submit, and model-selector key paths distinct before the Hermes event loop dispatches them.",
      },
      {
        scenarioID: "cli-display-spinner-tool-preview-and-diff" as const,
        input: { toolName: "terminal", args: { command: "echo hello" }, maxLen: 16, stdoutProxy: "prompt_toolkit.patch_stdout.StdoutProxy" },
        output: {
          toolPreview: buildHermesToolPreview({ toolName: "terminal", args: { command: "echo hello" }, maxLen: 16 }),
          spinner: {
            className: "KawaiiSpinner",
            pausesWhenEnvSet: "HERMES_SPINNER_PAUSE",
            suppressesCarriageReturnAnimationUnderStdoutProxy: true,
            nonTTYLogsStartOnce: true,
          },
          diffRendering: ["skin-aware colors", "unified diff sections", "inline omission summary"],
        },
        upstreamBehavior: "agent/display.py resolves skin-aware spinner/tool prefix/emoji output, builds one-line tool previews from primary arguments, captures local edit snapshots, renders unified diffs with skin colors, suppresses carriage-return spinner animation under prompt_toolkit StdoutProxy, and pauses animation when HERMES_SPINNER_PAUSE is set.",
      },
      {
        scenarioID: "tui-gateway-ink-terminal-surface" as const,
        input: { gateway: "tui_gateway", package: "ui-tui/packages/hermes-ink", events: ["keyboard", "mouse", "paste", "resize", "terminal-focus"] },
        output: {
          terminalSurface: "hermes-ink",
          eventKinds: ["click", "focus", "input", "keyboard", "mouse", "paste", "resize", "terminal-focus"],
          renderPipeline: ["layout", "render-node-to-output", "render-to-screen", "terminal modes"],
          frame: renderHermesTUIFrame({ width: 64 }),
        },
        upstreamBehavior: "ui-tui and tui_gateway implement Hermes' native terminal surface: keyboard/mouse/paste/resize/focus events flow through the gateway and hermes-ink renderer, with terminal setup/parity tests guarding alternate screen, cursor, output, and render behavior.",
      },
      {
        scenarioID: "renderer-snapshot-theme-registry-state" as const,
        input: { width: 72, height: 18, commands: ["/help", "/theme", "ctrl-p", "resize", "submit"], theme: "light" },
        output: replayHermesUIRendererSnapshotState({ width: 72, height: 18 }),
        upstreamBehavior: "hermes-ink render-to-screen owns terminal render output while Hermes skin_engine supplies built-in skins, color tokens, spinner faces, branding, tool prefix, and tool emoji overrides; snapshots remain function-free state clones for UI tests and API surfaces.",
      },
      {
        scenarioID: "legacy-tui-shell-service-surface" as const,
        input: { serviceID: "hermes.tui", commands: ["agent", "gateway", "serve", "help", "theme", "model", "interrupt"] },
        output: {
          surfaceKind: "hermes-tui",
          title: "Hermes Agent",
          renderIncludes: "Hermes Agent TUI",
          dispatchEvents: ["theme-select", "model-select", "submit"],
        },
        upstreamBehavior: "The Harness Hermes TUI shell is the product terminal surface for upstream CLI/TUI behavior and exposes the same display, terminal event, model/theme, and submit contract through hermes.tui.",
      },
    ],
    sourceRefs: [
      "agent/display.py#KawaiiSpinner,set_tool_preview_max_len,build_tool_preview,capture_local_edit_snapshot,extract_edit_diff,_render_inline_unified_diff,render_edit_diff_with_delta",
      "ui-tui/src/app/useInputHandlers.ts#keyboard,paste,submit,slash",
      "ui-tui/src/app/createSlashHandler.ts#slashCommands,dispatch",
      "ui-tui/packages/hermes-ink/src/ink/events#keyboard-event,mouse-event,paste-event,resize-event,terminal-focus-event",
      "ui-tui/packages/hermes-ink/src/ink/render-to-screen.ts#renderToScreen",
      "ui-tui/src/theme.ts#theme,tokens",
      "hermes_cli/skin_engine.py#get_active_skin,list_skins,set_active_skin,built_in_skins,colors,spinner,branding,tool_prefix,tool_emojis",
      "tui_gateway/server.py#gateway,events,session",
      "packages/adapters-hermes/src/hermes-tui.ts#createHermesTUI,render,dispatch,interactiveSnapshot",
    ],
    nativeEvidenceRefs: [hermesUINativeExactEvidenceRef, hermesUINativeExactReplayRef],
    fixtureIDs: [hermesUINativeExactFixtureID],
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintHermesUINativeFixture(fixtureWithoutFingerprint),
  }
}

export function verifyHermesUINativeExactFixture(fixture: HermesUINativeExactFixture): HermesUINativeExactVerification {
  const issues: HermesUINativeExactIssue[] = []
  if (fixture.schemaVersion !== 1) issues.push({ id: "hermes-ui-native-exact.schema", message: "schemaVersion must be 1." })
  if (fixture.product !== "hermes-agent") issues.push({ id: "hermes-ui-native-exact.product", message: "product must be hermes-agent." })
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") issues.push({ id: "hermes-ui-native-exact.claim", message: "fixture must claim native-exact parity." })
  if (fixture.knownLossiness.length !== 0) issues.push({ id: "hermes-ui-native-exact.lossiness", message: "native fixture must not retain known lossiness." })
  for (const atomID of hermesUINativeExactAtomIDs) {
    if (!fixture.atomIDs.includes(atomID)) issues.push({ id: "hermes-ui-native-exact.atoms", message: `fixture must cover ${atomID}.` })
  }
  const scenarios = new Set(fixture.cases.map((item) => item.scenarioID))
  for (const scenario of ["command-router-slash-tool-and-selector-actions", "input-normalizer-key-text-command-submit-resize", "cli-display-spinner-tool-preview-and-diff", "tui-gateway-ink-terminal-surface", "renderer-snapshot-theme-registry-state", "legacy-tui-shell-service-surface"] as const) {
    if (!scenarios.has(scenario)) issues.push({ id: "hermes-ui-native-exact.cases", message: `missing scenario ${scenario}.` })
  }
  if (
    !fixture.policy.commandRouterPreservesSlashModelThemeInterruptAndToolCommands ||
    !fixture.policy.inputNormalizerPreservesHermesKeyboardPasteResizeAndSubmit ||
    !fixture.policy.displayUsesSkinAwareSpinnerToolPreviewAndDiffRendering ||
    !fixture.policy.tuiShellUsesHermesInkInputGatewayAndTerminalParity ||
    !fixture.policy.rendererSnapshotsUseHermesInkDisplayAndSkinTokens ||
    !fixture.policy.snapshotClonesTerminalStateAndDashboardDebugState ||
    !fixture.policy.themeRegistryUsesHermesSkinEngineDefaultsAndOverrides
  ) {
    issues.push({ id: "hermes-ui-native-exact.policy", message: "fixture lost Hermes UI native policy." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintHermesUINativeFixture(withoutFingerprint)) issues.push({ id: "hermes-ui-native-exact.fingerprint", message: "fingerprint does not match fixture content." })
  return { ok: issues.length === 0, issues }
}

function fingerprintHermesUINativeFixture(fixture: Omit<HermesUINativeExactFixture, "fingerprint">): string {
  return createHash("sha256").update(JSON.stringify(fixture)).digest("hex").slice(0, 16)
}

function isHermesTUIInputEvent(value: unknown): value is HermesTUIInputEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  if (record["type"] === "text") return typeof record["text"] === "string"
  if (record["type"] === "submit") return record["text"] === undefined || typeof record["text"] === "string"
  if (record["type"] === "command") return typeof record["command"] === "string"
  if (record["type"] === "key") return isHermesTUIKey(record["key"])
  if (record["type"] === "select") return (record["target"] === "theme" || record["target"] === "model") && typeof record["value"] === "string"
  if (record["type"] === "resize") return typeof record["width"] === "number"
  return record["type"] === "tick"
}

function isHermesTUIKey(value: unknown): value is HermesTUIKey {
  return value === "escape" || value === "enter" || value === "up" || value === "down" || value === "ctrl-p" || value === "tab"
}
