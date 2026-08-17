import { describe, expect, it } from "vitest"
import {
  buildNanobotUINativeExactFixture,
  isNanobotExitCommand,
  nanobotTUIShellNativeExactAtomID,
  nanobotUICommandRouterNativeExactAtomID,
  nanobotUIInputNormalizerNativeExactAtomID,
  nanobotUIRendererNativeExactAtomID,
  nanobotUISnapshotNativeExactAtomID,
  nanobotUIThemeRegistryNativeExactAtomID,
  nanobotUINativeDescriptors,
  nanobotUINativeExactAtomIDs,
  nanobotUINativeExactEvidenceRef,
  nanobotUINativeExactFixtureID,
  nanobotUINativeExactReplayRef,
  normalizeNanobotTUIInput,
  renderNanobotTerminalFrame,
  replayNanobotTerminalStreamNativeScenario,
  replayNanobotUIRendererSnapshotState,
  routeNanobotUICommand,
  verifyNanobotUINativeExactFixture,
} from "@helix/lego-ui/product-schema/nanobot"
import { buildAssemblyContract, routeForAtomBlock } from "@helix/recipes"

describe("Nanobot UI native exact conformance", () => {
  it("pins the Nanobot UI atom group to upstream prompt_toolkit, Rich streaming, WebSocket, WebUI, and terminal shell behavior", () => {
    const fixture = buildNanobotUINativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "nanobot",
      atomIDs: [
        nanobotUICommandRouterNativeExactAtomID,
        nanobotUIInputNormalizerNativeExactAtomID,
        nanobotUIRendererNativeExactAtomID,
        nanobotUISnapshotNativeExactAtomID,
        nanobotUIThemeRegistryNativeExactAtomID,
        nanobotTUIShellNativeExactAtomID,
      ],
      portIDs: ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([nanobotUINativeExactEvidenceRef, nanobotUINativeExactReplayRef]),
      fixtureIDs: [nanobotUINativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "terminal-stream-rich-live-renderer",
      "prompt-toolkit-input-history-and-exit",
      "command-router-cli-webui-and-runtime-actions",
      "input-normalizer-key-text-command-submit-resize",
      "renderer-snapshot-theme-registry-state",
      "legacy-tui-shell-service-surface",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "nanobot/cli/stream.py#_make_console,ThinkingSpinner,StreamRenderer,ensure_header,pause_spinner,on_delta,on_end,stop_for_input",
      "nanobot/cli/commands.py#PromptSession,SafeFileHistory,EXIT_COMMANDS,_read_interactive_input_async,_print_interactive_response,agent",
      "nanobot/cli/commands.py#onboard,serve,gateway,agent,channels_status,channels_login,plugins_list,status,provider_login,provider_logout",
      "nanobot/channels/websocket.py#_dispatch_http,_handle_bootstrap,_handle_sessions_list,_handle_settings,_handle_commands,_handle_session_messages,send_delta,send_turn_end,send_runtime_model_updated",
      "webui/src/App.tsx#SIDEBAR_STORAGE_KEY,RESTART_STARTED_KEY,SIDEBAR_WIDTH,ShellView,AuthForm,App,Shell",
      "webui/src/components/thread/ThreadShell.tsx#projectWebuiThreadMessages,toModelBadgeLabel,QUICK_ACTION_KEYS,IMAGE_QUICK_ACTION_KEYS,PendingFirstMessage,ThreadShell",
      "packages/adapters-nanobot/src/nanobot-tui.ts#createNanobotTUI,createNanobotTUIFromSDK,render,dispatch,interactiveSnapshot",
    ]))

    expect(replayNanobotTerminalStreamNativeScenario()).toMatchObject({
      console: { forceTerminal: "sys.stdout.isatty()", nonTTYPlainText: true },
      spinner: { name: "nanobot", stopsBeforePromptInput: true },
      streaming: { liveRenderer: "rich.live.Live", transientLive: true, finalRenderPersistsAfterLiveStops: true },
      prompt: { toolkit: "prompt_toolkit.PromptSession", promptHTML: "You: " },
    })
    expect(isNanobotExitCommand(":q")).toBe(true)
    expect(routeNanobotUICommand({ command: "/serve --port 8080" })).toMatchObject({ command: "serve", action: "start-api-server", handled: true })
    expect(routeNanobotUICommand({ command: "/gateway" })).toMatchObject({ command: "gateway", action: "start-websocket-gateway", handled: true })
    expect(routeNanobotUICommand({ command: "/provider login" })).toMatchObject({ command: "provider", action: "provider-auth", output: "login" })
    expect(normalizeNanobotTUIInput("/quit")).toEqual({ type: "command", command: "/quit" })
    expect(normalizeNanobotTUIInput("hello")).toEqual({ type: "text", text: "hello" })
    expect(normalizeNanobotTUIInput({ type: "keypress", key: "enter" })).toEqual({ type: "submit" })
    expect(normalizeNanobotTUIInput({ type: "resize", width: 96, height: 32 })).toEqual({ type: "resize", width: 96, height: 32 })
    expect(replayNanobotUIRendererSnapshotState({ width: 72, height: 18 })).toMatchObject({
      renderer: {
        cli: { live: "rich.live.Live", transient: true, finalRenderPersistsAfterLiveStops: true },
        webui: { projectMessages: "projectWebuiThreadMessages" },
        websocketEvents: expect.arrayContaining(["delta", "turn_end", "runtime_model_updated"]),
      },
      snapshot: { product: "nanobot", width: 72, height: 18, sidebarStorageKey: "nanobot-webui.sidebar" },
      themeRegistry: { themes: ["dark", "light"], current: "dark" },
    })
    expect(renderNanobotTerminalFrame({ width: 44 })).toContain("Nanobot TUI :: READY")
    expect(verifyNanobotUINativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    expect(nanobotUINativeDescriptors.map((descriptor) => descriptor.id)).toEqual([...nanobotUINativeExactAtomIDs])
    for (const descriptor of nanobotUINativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "nanobot",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([nanobotUINativeExactEvidenceRef, nanobotUINativeExactReplayRef]),
        fixtureIDs: [nanobotUINativeExactFixtureID],
        knownLossiness: [],
      })
    }

    for (const atomID of nanobotUINativeExactAtomIDs) {
      expect(routeForAtomBlock(atomID)).toMatchObject({
        packageName: "@helix/lego-ui",
        exportPath: "./product-schema/nanobot",
      })
    }

    const contract = buildAssemblyContract({ product: "nanobot" })
    for (const atomID of nanobotUINativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        sourcePackage: "@helix/lego-ui",
        publicExport: "./product-schema/nanobot",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([nanobotUINativeExactEvidenceRef, nanobotUINativeExactReplayRef]),
        fixtureIDs: [nanobotUINativeExactFixtureID],
      })
    }
  })
})
