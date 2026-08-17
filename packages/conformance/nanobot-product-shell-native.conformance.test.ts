import { describe, expect, it } from "vitest"
import {
  buildNanobotProductShellNativeExactFixture,
  nanobotProductShellCLINativeExactAtomID,
  nanobotProductShellCLICommandMatrix,
  nanobotProductShellHarnessNativeExactAtomID,
  nanobotProductShellNativeDescriptors,
  nanobotProductShellNativeExactAtomIDs,
  nanobotProductShellNativeExactEvidenceRef,
  nanobotProductShellNativeExactFixtureID,
  nanobotProductShellNativeExactReplayRef,
  nanobotProductShellSDKNativeExactAtomID,
  nanobotProductShellServerNativeExactAtomID,
  nanobotProductShellServerRouteMatrix,
  nanobotProductShellTUINativeExactAtomID,
  nanobotProductShellWebUINativeExactAtomID,
  verifyNanobotProductShellNativeExactFixture,
} from "@helix/adapters-nanobot/product-schema/product-shell"
import {
  nanobotUINativeExactEvidenceRef,
  nanobotUINativeExactFixtureID,
  nanobotUINativeExactReplayRef,
} from "@helix/lego-ui/product-schema/nanobot"
import { buildAssemblyContract, routeForAtomBlock } from "@helix/recipes"

describe("Nanobot product shell native exact conformance", () => {
  it("pins Nanobot CLI, SDK, server, harness, TUI, and Web UI product shells to native behavior", () => {
    const fixture = buildNanobotProductShellNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "nanobot",
      atomIDs: [
        nanobotProductShellCLINativeExactAtomID,
        nanobotProductShellHarnessNativeExactAtomID,
        nanobotProductShellSDKNativeExactAtomID,
        nanobotProductShellServerNativeExactAtomID,
        nanobotProductShellTUINativeExactAtomID,
        nanobotProductShellWebUINativeExactAtomID,
      ],
      portIDs: ["product.shell"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        nanobotProductShellNativeExactEvidenceRef,
        nanobotProductShellNativeExactReplayRef,
        nanobotUINativeExactEvidenceRef,
        nanobotUINativeExactReplayRef,
      ]),
      fixtureIDs: [nanobotProductShellNativeExactFixtureID, nanobotUINativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "cli-surface-uses-typer-command-registry",
      "sdk-surface-exposes-workspace-session-and-run-turn",
      "server-surface-uses-openai-compatible-api-and-webui-routes",
      "harness-registration-exposes-shared-services",
      "tui-shell-uses-native-terminal-stream",
      "web-ui-uses-native-websocket-channel",
      "surface-registration-exposes-tui-service",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "pyproject.toml#[project.scripts] nanobot=nanobot.cli.commands:app",
      "nanobot/api/server.py#create_app,handle_health,handle_models,handle_chat_completions,_sse_chunk,API_SESSION_KEY,API_CHAT_ID",
      "nanobot/cli/stream.py#ThinkingSpinner,StreamRenderer,on_delta,on_end,pause_spinner,stop_for_input",
      "nanobot/cli/commands.py#app,onboard,serve,gateway,agent,status,channels.login,channels.status,provider.login,provider.logout,PromptSession,EXIT_COMMANDS,_read_interactive_input_async,_print_interactive_response",
      "nanobot/channels/websocket.py#WebSocketConfig,_dispatch_http,_handle_bootstrap,_handle_sessions_list,_handle_settings,_handle_commands,_handle_session_messages,_handle_webui_thread_get,_handle_media_fetch,_serve_static,_authorize_websocket_handshake",
      "packages/adapters-nanobot/src/nanobot-cli.ts#NANOBOT_CLI_COMMANDS,createNanobotCLI,commands,renderHelp,run",
      "packages/adapters-nanobot/src/nanobot-sdk.ts#createNanobotSDK,workspace,graph,listSessions,getSession,runTurn",
      "packages/adapters-nanobot/src/nanobot-tui.ts#createNanobotTUI,createNanobotTUIFromSDK,render,dispatch,interactiveSnapshot",
      "packages/adapters-nanobot/src/nanobot-web-ui.ts#createNanobotWebUI,buildNanobotWebUIBootstrap,nanobotWebUINativeHTTPRoutes,render",
    ]))
    const cliCase = fixture.cases.find((item) => item.scenarioID === "cli-surface-uses-typer-command-registry")
    expect(cliCase).toMatchObject({
      output: {
        commandRegistry: nanobotProductShellCLICommandMatrix(),
        directRunRoute: expect.objectContaining({ upstreamCommand: "agent", messageOption: "--message/-m" }),
      },
    })
    const serverCase = fixture.cases.find((item) => item.scenarioID === "server-surface-uses-openai-compatible-api-and-webui-routes")
    expect(serverCase).toMatchObject({
      output: {
        routeHandlers: nanobotProductShellServerRouteMatrix(),
        modelListShape: { object: "list", owned_by: "nanobot" },
        chatCompletionShape: expect.objectContaining({ responseObject: "chat.completion", choiceMessageRole: "assistant", finishReason: "stop" }),
        streamCompletionShape: expect.arrayContaining(["text/event-stream", "data: [DONE]"]),
      },
    })
    const webUICase = fixture.cases.find((item) => item.scenarioID === "web-ui-uses-native-websocket-channel")
    expect(webUICase).toMatchObject({
      output: {
        bootstrap: { token: "harness-local-token", ws_path: "/", expires_in: 300, model_name: "nanobot" },
        routeHandlers: expect.arrayContaining(["/webui/bootstrap", "/api/sessions", "/api/settings", "/api/commands"]),
        staticSPA: expect.objectContaining({ bootstrapScriptID: "nanobot-webui-bootstrap" }),
      },
    })
    expect(verifyNanobotProductShellNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    expect(nanobotProductShellNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([...nanobotProductShellNativeExactAtomIDs])
    for (const descriptor of nanobotProductShellNativeDescriptors) {
      expect(descriptor).toMatchObject({
        port: "product.shell",
        product: "nanobot",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotProductShellNativeExactEvidenceRef,
          nanobotProductShellNativeExactReplayRef,
          nanobotUINativeExactEvidenceRef,
          nanobotUINativeExactReplayRef,
        ]),
        fixtureIDs: [nanobotProductShellNativeExactFixtureID, nanobotUINativeExactFixtureID],
      })
    }

    for (const atomID of nanobotProductShellNativeExactAtomIDs) {
      expect(routeForAtomBlock(atomID), atomID).toMatchObject({
        packageName: "@helix/adapters-nanobot",
        exportPath: "./product-schema/product-shell",
      })
    }

    const contract = buildAssemblyContract({ product: "nanobot" })
    for (const atomID of nanobotProductShellNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom).toMatchObject({
        sourcePackage: "@helix/adapters-nanobot",
        publicExport: "./product-schema/product-shell",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotProductShellNativeExactEvidenceRef,
          nanobotProductShellNativeExactReplayRef,
          nanobotUINativeExactEvidenceRef,
          nanobotUINativeExactReplayRef,
        ]),
        fixtureIDs: [nanobotProductShellNativeExactFixtureID, nanobotUINativeExactFixtureID],
      })
    }
    expect(contract.bindings.find((binding) => binding.capability.id === "product.shell")).toMatchObject({
      providerAtom: expect.any(String),
      replaceable: true,
    })
  })
})
