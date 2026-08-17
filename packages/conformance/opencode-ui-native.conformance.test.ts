import { describe, expect, it } from "vitest"
import {
  buildOpenCodeUINativeExactFixture,
  createOpenCodeUIEventLoopAtom,
  createOpenCodeTUIRendererConfigSummary,
  createOpenCodeTUIThemeRegistry,
  expandOpenCodeTUIKeyAliases,
  isOpenCodeTUIInputCommand,
  normalizeOpenCodeTUIInputBinding,
  normalizeOpenCodeTUIKeyAlias,
  openCodeTUIHeapSnapshotToast,
  openCodeTUIBindingCommands,
  openCodeTUIDefaultThemeIDs,
  openCodeTUIFormatKeyNameAliases,
  openCodeTUIFormatModifierAliases,
  openCodeTUIInputCommands,
  openCodeTUIRendererProviderChain,
  openCodeTUIRootSlots,
  openCodeTUITerminalTitle,
  openCodeUIEventLoopNativeExactAtomID,
  openCodeUICommandRouterNativeExactAtomID,
  openCodeUIInputNormalizerNativeExactAtomID,
  openCodeUIRendererNativeExactAtomID,
  openCodeUISnapshotNativeExactAtomID,
  openCodeUIThemeRegistryNativeExactAtomID,
  openCodeUINativeDescriptors,
  openCodeUINativeExactEvidenceRef,
  openCodeUINativeExactFixtureID,
  replayOpenCodeTUIEventLoop,
  renderOpenCodeTUIRootSnapshot,
  routeOpenCodeTUICommand,
  snapshotOpenCodeTUIHomeLayout,
  verifyOpenCodeUINativeExactFixture,
} from "@helix/lego-ui/product-schema/opencode"
import { buildAssemblyContract } from "@helix/recipes"

describe("OpenCode UI native exact fixture", () => {
  it("pins upstream TUI command bindings, input keymap, and theme registry behavior", () => {
    const fixture = buildOpenCodeUINativeExactFixture()

    expect(verifyOpenCodeUINativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      product: "opencode",
      atomIDs: [
        openCodeUIEventLoopNativeExactAtomID,
        openCodeUICommandRouterNativeExactAtomID,
        openCodeUIInputNormalizerNativeExactAtomID,
        openCodeUIRendererNativeExactAtomID,
        openCodeUISnapshotNativeExactAtomID,
        openCodeUIThemeRegistryNativeExactAtomID,
      ],
      portIDs: ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"],
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      scope: "event-loop-command-router-input-renderer-snapshot-and-theme-registry",
      nativeEvidenceRefs: expect.arrayContaining([openCodeUINativeExactEvidenceRef, "ui-native-exact:opencode"]),
      fixtureIDs: [openCodeUINativeExactFixtureID],
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("app.tsx#appBindingCommands"),
        expect.stringContaining("createCliRenderer"),
        expect.stringContaining("registerOpencodeKeymap"),
        expect.stringContaining("useBindings"),
        expect.stringContaining("useTerminalDimensions"),
        expect.stringContaining("onBeforeExit"),
        expect.stringContaining("rendererConfig"),
        expect.stringContaining("onSnapshot"),
        expect.stringContaining("StartupLoading"),
        expect.stringContaining("keymap.tsx#COMMAND_PALETTE_COMMAND"),
        expect.stringContaining("KEY_ALIASES"),
        expect.stringContaining("inputCommands"),
        expect.stringContaining("registerManagedTextareaLayer"),
        expect.stringContaining("context/exit.tsx#ExitProvider"),
        expect.stringContaining("context/route.tsx#RouteProvider"),
        expect.stringContaining("routes/home.tsx#Home"),
        expect.stringContaining("ui/toast.tsx#Toast"),
        expect.stringContaining("context/theme.tsx#DEFAULT_THEMES"),
      ]),
    })
    expect(openCodeTUIBindingCommands).toEqual(expect.arrayContaining([
      "command.palette.show",
      "session.list",
      "session.quick_switch.9",
      "model.cycle_favorite_reverse",
      "theme.mode.lock",
      "app.toggle.session_directory_filter",
    ]))
    expect(openCodeTUIInputCommands).toEqual(expect.arrayContaining([
      "input.backspace",
      "input.delete.to.line.start",
      "input.submit",
    ]))
    expect(openCodeTUIDefaultThemeIDs).toEqual(expect.arrayContaining(["aura", "carbonfox", "opencode", "tokyonight", "zenburn"]))
  })

  it("models the pinned OpenTUI renderer config, root route tree, and snapshot command", () => {
    expect(createOpenCodeTUIRendererConfigSummary()).toEqual({
      externalOutputMode: "passthrough",
      targetFps: 60,
      gatherStats: false,
      exitOnCtrlC: false,
      useKittyKeyboard: "enabled-empty-options",
      autoFocus: false,
      openConsoleOnError: false,
      useMouse: true,
      consoleCopyBinding: { name: "y", ctrl: true, action: "copy-selection" },
    })
    expect(createOpenCodeTUIRendererConfigSummary({ mouse: false })).toMatchObject({ useMouse: false })
    expect(createOpenCodeTUIRendererConfigSummary({ disableMouseFlag: true })).toMatchObject({ useMouse: false })
    expect(openCodeTUIRendererProviderChain).toEqual([
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
    ])
    expect(openCodeTUIRootSlots).toEqual(expect.arrayContaining(["TuiPluginRuntime.Slot:app_bottom", "TuiPluginRuntime.Slot:app"]))
    expect(renderOpenCodeTUIRootSnapshot({ width: 100, height: 32, ready: true, route: "home", showTimeToFirstDraw: true })).toMatchObject({
      backgroundToken: "theme.background",
      rendered: expect.arrayContaining(["TimeToFirstDraw", "Route:Home", "TuiPluginRuntime.Slot:app"]),
    })
    expect(renderOpenCodeTUIRootSnapshot({ width: 100, height: 32, ready: true, route: "plugin", pluginRouteFound: false }).rendered).toContain("PluginRouteMissing")
    expect(renderOpenCodeTUIRootSnapshot({ width: 100, height: 32, ready: false, route: "session" }).rendered).not.toContain("Route:Session")
    expect(snapshotOpenCodeTUIHomeLayout({ terminalWidth: 140, promptMaxWidth: "auto" })).toMatchObject({
      promptMaxWidth: 98,
      promptPlaceholders: {
        normal: ["Fix a TODO in the codebase", "What is the tech stack of this project?", "Fix broken tests"],
        shell: ["ls -la", "git status", "pwd"],
      },
      slots: expect.arrayContaining(["Logo", "Prompt", "Toast"]),
    })
    expect(openCodeTUIHeapSnapshotToast(["main.heapsnapshot", "renderer.heapsnapshot"])).toEqual({
      variant: "info",
      message: "Heap snapshot written to main.heapsnapshot, renderer.heapsnapshot",
      duration: 5000,
      clearsDialog: true,
    })
    expect(openCodeTUIHeapSnapshotToast()).toMatchObject({ message: "Heap snapshot written to undefined" })
    expect(openCodeTUITerminalTitle({ route: "home" })).toBe("OpenCode")
    expect(openCodeTUITerminalTitle({ route: "session", title: "New Session", defaultTitle: true })).toBe("OpenCode")
    expect(openCodeTUITerminalTitle({ route: "session", title: "Investigate renderer" })).toBe("OC | Investigate renderer")
    expect(openCodeTUITerminalTitle({ route: "session", title: "01234567890123456789012345678901234567890123456789" })).toBe("OC | 0123456789012345678901234567890123456...")
    expect(openCodeTUITerminalTitle({ route: "plugin", id: "plugin-id" })).toBe("OC | plugin-id")
  })

  it("drives the pinned OpenCode TUI event loop lifecycle and route aliases", () => {
    const loop = createOpenCodeUIEventLoopAtom({
      width: 100,
      height: 32,
      initialTheme: "opencode",
      initialModel: "gpt-5-codex",
      models: ["gpt-5-codex", "claude-sonnet-4-5"],
      showTimeToFirstDraw: true,
    })

    expect(loop.snapshot()).toMatchObject({
      product: "opencode",
      title: "OpenCode",
      status: "ready",
      mode: "chat",
      theme: "opencode",
      model: "gpt-5-codex",
      width: 100,
      height: 32,
    })
    expect(loop.handle({ type: "text", text: "Fix tests" })).toMatchObject({
      handled: true,
      snapshot: expect.objectContaining({ status: "editing", commandLine: "Fix tests" }),
    })
    expect(loop.handle({ type: "submit" })).toMatchObject({
      handled: true,
      submittedText: "Fix tests",
      snapshot: expect.objectContaining({ status: "running", history: ["Fix tests"] }),
    })
    expect(loop.render()).toContain("Route:Session")
    expect(loop.handle({ type: "command", command: "/models" })).toMatchObject({
      handled: true,
      command: "model.list",
      snapshot: expect.objectContaining({ status: "selecting", mode: "model" }),
    })
    expect(loop.handle({ type: "select", target: "model", value: "claude-sonnet-4-5" })).toMatchObject({
      handled: true,
      snapshot: expect.objectContaining({ model: "claude-sonnet-4-5" }),
    })
    expect(loop.handle({ type: "command", command: "/themes" })).toMatchObject({
      handled: true,
      command: "theme.switch",
      snapshot: expect.objectContaining({ status: "selecting", mode: "theme" }),
    })
    expect(loop.handle({ type: "select", target: "theme", value: "tokyonight" })).toMatchObject({
      handled: true,
      snapshot: expect.objectContaining({ theme: "tokyonight" }),
    })
    expect(loop.handle({ type: "command", command: "/new" })).toMatchObject({
      handled: true,
      command: "session.new",
    })
    expect(loop.render()).toContain("Route:Home")
    expect(loop.handle({ type: "resize", width: 120, height: 40 })).toMatchObject({
      handled: true,
      snapshot: expect.objectContaining({ width: 120, height: 40 }),
    })
    expect(loop.handle({ type: "key", key: "ctrl-p" })).toMatchObject({
      handled: true,
      command: "command.palette.show",
      snapshot: expect.objectContaining({ status: "selecting", mode: "command" }),
    })
    expect(loop.handle({ type: "command", command: "/theme" })).toMatchObject({
      handled: false,
      error: "Unknown OpenCode TUI command: theme",
    })
    expect(replayOpenCodeTUIEventLoop([{ type: "command", command: "/help" }]).render).toContain("OpenCode")
  })

  it("routes only pinned OpenCode TUI commands and normalizes the pinned keymap input surface", () => {
    expect(routeOpenCodeTUICommand({ command: "command.palette.show" })).toMatchObject({
      command: "command.palette.show",
      action: "command-palette",
      handled: true,
    })
    expect(routeOpenCodeTUICommand({ command: "/session.list" })).toMatchObject({
      command: "session.list",
      action: "session",
      handled: true,
      slashDisplay: "/session.list",
    })
    expect(routeOpenCodeTUICommand({ command: "/sessions" })).toMatchObject({
      command: "session.list",
      action: "session",
      handled: true,
    })
    expect(routeOpenCodeTUICommand({ command: "/models" })).toMatchObject({
      command: "model.list",
      action: "model",
      handled: true,
    })
    expect(routeOpenCodeTUICommand({ command: "/themes" })).toMatchObject({
      command: "theme.switch",
      action: "theme",
      handled: true,
    })
    expect(routeOpenCodeTUICommand({ command: "/help" })).toMatchObject({
      command: "help.show",
      action: "help",
      handled: true,
    })
    expect(routeOpenCodeTUICommand({ command: "/new" })).toMatchObject({
      command: "session.new",
      action: "session",
      handled: true,
    })
    expect(routeOpenCodeTUICommand({ command: "theme.switch_mode" })).toMatchObject({
      action: "theme",
      handled: true,
    })
    expect(routeOpenCodeTUICommand({ command: "run" })).toMatchObject({
      action: "unknown",
      handled: false,
      error: "Unknown OpenCode TUI command: run",
    })
    expect(normalizeOpenCodeTUIKeyAlias("ctrl+enter esc pgdown pgup")).toBe("ctrl+return escape pagedown pageup")
    expect(expandOpenCodeTUIKeyAliases("ctrl+x")).toBeUndefined()
    expect(normalizeOpenCodeTUIInputBinding("enter")).toEqual({ input: "enter", expanded: "return" })
    expect(normalizeOpenCodeTUIInputBinding("input.submit")).toEqual({ input: "input.submit", inputCommand: "input.submit" })
    expect(isOpenCodeTUIInputCommand("input.delete.to.line.start")).toBe(true)
    expect(isOpenCodeTUIInputCommand("input.run")).toBe(false)
    expect(openCodeTUIFormatKeyNameAliases).toMatchObject({ pageup: "pgup", pagedown: "pgdn", delete: "del" })
    expect(openCodeTUIFormatModifierAliases).toMatchObject({ meta: "alt" })
  })

  it("models the pinned default/plugin/custom/system theme priority", () => {
    const registry = createOpenCodeTUIThemeRegistry({
      initialTheme: "carbonfox",
      pluginThemes: ["plugin-blue", "shared"],
      customThemes: ["shared"],
      systemTheme: "generated",
    })

    expect(registry.current()).toMatchObject({ id: "carbonfox", source: "default" })
    expect(registry.has("opencode")).toBe(true)
    expect(registry.has("system")).toBe(true)
    expect(registry.select("shared")).toMatchObject({ id: "shared", source: "custom" })
    expect(registry.select("missing")).toBeUndefined()
    expect(registry.list().find((theme) => theme.id === "plugin-blue")).toMatchObject({ source: "plugin" })
    expect(registry.list().at(-1)).toMatchObject({ id: "system", source: "system" })
  })

  it("rejects fixture drift and lossiness on the native scoped atoms", () => {
    const fixture = buildOpenCodeUINativeExactFixture()

    expect(verifyOpenCodeUINativeExactFixture({
      ...fixture,
      knownLossiness: ["opencode-ui-source-matrix-partial-fixture"],
    }).issues).toEqual(expect.arrayContaining([expect.objectContaining({ id: "opencode-ui-native-exact.fingerprint" }), expect.objectContaining({ id: "opencode-ui-native-exact.lossiness" })]))
    expect(verifyOpenCodeUINativeExactFixture({
      ...fixture,
      scope: "event-loop-command-router-input-renderer-snapshot-and-theme-registry",
      sourceRefs: fixture.sourceRefs.filter((ref) => !ref.includes("context/theme.tsx")),
    }).issues).toEqual(expect.arrayContaining([expect.objectContaining({ id: "opencode-ui-native-exact.fingerprint" }), expect.objectContaining({ id: "opencode-ui-native-exact.upstream" })]))
  })

  it("upgrades the OpenCode event-loop, command-router, input-normalizer, renderer, snapshot, and theme-registry assembly atoms", () => {
    const contract = buildAssemblyContract({ product: "opencode" })
    const byID = new Map(contract.atoms.map((atom) => [atom.id, atom]))

    for (const descriptor of openCodeUINativeDescriptors) {
      expect(byID.get(descriptor.id)).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([openCodeUINativeExactEvidenceRef, "ui-native-exact:opencode"]),
        fixtureIDs: [openCodeUINativeExactFixtureID],
        knownLossiness: [],
        sourcePackage: "@helix/lego-ui",
        publicExport: "./product-schema/opencode",
      })
    }
  })
})
