import { describe, expect, it } from "vitest"
import {
  buildHermesProductShellNativeExactFixture,
  hermesProductShellACPNativeExactAtomID,
  hermesProductShellACPMethodMatrix,
  hermesProductShellAPIServerNativeExactAtomID,
  hermesProductShellAPIServerRouteMatrix,
  hermesProductShellCLINativeExactAtomID,
  hermesProductShellCLICommandMatrix,
  hermesProductShellGatewayMethodMatrix,
  hermesProductShellGatewayNativeExactAtomID,
  hermesProductShellHarnessNativeExactAtomID,
  hermesProductShellNativeDescriptors,
  hermesProductShellNativeExactAtomIDs,
  hermesProductShellNativeExactEvidenceRef,
  hermesProductShellNativeExactFixtureID,
  hermesProductShellNativeExactReplayRef,
  hermesProductShellSDKNativeExactAtomID,
  hermesProductShellTUINativeExactAtomID,
  hermesProductShellWebDashboardNativeExactAtomID,
  verifyHermesProductShellNativeExactFixture,
} from "@helix/adapters-hermes/product-schema/product-shell"
import {
  hermesUINativeExactEvidenceRef,
  hermesUINativeExactFixtureID,
  hermesUINativeExactReplayRef,
} from "@helix/adapters-hermes/product-schema/ui"
import { buildAssemblyContract, routeForAtomBlock } from "@helix/recipes"

describe("Hermes product shell native exact conformance", () => {
  it("pins Hermes CLI, SDK, ACP, gateway, API server, harness, TUI, and Web dashboard product shells to native behavior", () => {
    const fixture = buildHermesProductShellNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "hermes-agent",
      atomIDs: [
        hermesProductShellACPNativeExactAtomID,
        hermesProductShellAPIServerNativeExactAtomID,
        hermesProductShellCLINativeExactAtomID,
        hermesProductShellGatewayNativeExactAtomID,
        hermesProductShellHarnessNativeExactAtomID,
        hermesProductShellSDKNativeExactAtomID,
        hermesProductShellTUINativeExactAtomID,
        hermesProductShellWebDashboardNativeExactAtomID,
      ],
      portIDs: ["product.shell"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        hermesProductShellNativeExactEvidenceRef,
        hermesProductShellNativeExactReplayRef,
        hermesUINativeExactEvidenceRef,
        hermesUINativeExactReplayRef,
      ]),
      fixtureIDs: [hermesProductShellNativeExactFixtureID, hermesUINativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "cli-surface-uses-hermes-cli-command-registry",
      "sdk-surface-exposes-workspace-session-and-run-turn",
      "api-server-surface-uses-openai-compatible-routes",
      "acp-surface-advertises-session-prompt-and-slash-commands",
      "gateway-surface-dispatches-platform-messages",
      "harness-registration-exposes-shared-services",
      "tui-shell-uses-native-display-and-terminal-surface",
      "web-dashboard-uses-native-desktop-dashboard-surface",
      "surface-registration-exposes-tui-dashboard-and-api-services",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "cli.py#HermesCLI,ChatConsole,load_cli_config,main,run,chat,new_session,process_command,_handle_sessions_command,_handle_model_switch,_handle_tools_command",
      "gateway/platforms/api_server.py#APIServerAdapter,_handle_health,_handle_models,_handle_capabilities,_handle_chat_completions,_write_sse_chat_completion,_derive_chat_session_id,_openai_error",
      "acp_adapter/server.py#HermesACPAgent,initialize,authenticate,new_session,prompt,cancel,fork_session,_ADVERTISED_COMMANDS,_available_commands,_handle_slash_command,_cmd_help,_cmd_model,_cmd_tools,_cmd_context,_cmd_reset,_cmd_compact,_cmd_steer,_cmd_queue,_cmd_version",
      "agent/display.py#KawaiiSpinner,set_tool_preview_max_len,build_tool_preview,capture_local_edit_snapshot,extract_edit_diff,_render_inline_unified_diff,render_edit_diff_with_delta",
      "ui-tui/src/app/useInputHandlers.ts#keyboard,paste,submit,slash",
      "ui-tui/packages/hermes-ink/src/ink/render-to-screen.ts#renderToScreen",
      "packages/adapters-hermes/src/hermes-api-server.ts#createHermesAPIServer,GET /health,GET /v1/models,GET /v1/capabilities,POST /v1/chat/completions,POST /v1/acp,POST /v1/gateway",
      "packages/adapters-hermes/src/surfaces/registration.ts#registerHermesSurfaceServices,hermes.sdk,hermes.cli,hermes.tui,hermes.acp,hermes.gateway,hermes.web-dashboard,hermes.api-server.factory",
    ]))
    expect(fixture.cases.find((item) => item.scenarioID === "cli-surface-uses-hermes-cli-command-registry")).toMatchObject({
      output: {
        kind: "hermes-cli",
        commandRegistry: hermesProductShellCLICommandMatrix(),
        directRunRoute: expect.objectContaining({ upstreamCommand: "chat", sharedSDK: "hermes.sdk.runTurn(input)" }),
      },
    })
    expect(fixture.cases.find((item) => item.scenarioID === "api-server-surface-uses-openai-compatible-routes")).toMatchObject({
      output: {
        kind: "hermes-api-server",
        routeHandlers: hermesProductShellAPIServerRouteMatrix(),
        modelListShape: { object: "list", owned_by: "hermes", root: "hermes-agent" },
        chatCompletionShape: expect.objectContaining({ responseObject: "chat.completion", choiceMessageRole: "assistant", finishReason: "stop" }),
        streamCompletionShape: expect.arrayContaining(["text/event-stream", "data: [DONE]"]),
      },
    })
    expect(fixture.cases.find((item) => item.scenarioID === "acp-surface-advertises-session-prompt-and-slash-commands")).toMatchObject({
      output: {
        kind: "hermes-acp",
        methods: hermesProductShellACPMethodMatrix(),
        advertisedSlashCommands: expect.arrayContaining(["help", "model", "tools", "queue", "version"]),
      },
    })
    expect(fixture.cases.find((item) => item.scenarioID === "gateway-surface-dispatches-platform-messages")).toMatchObject({
      output: {
        kind: "hermes-gateway",
        methods: hermesProductShellGatewayMethodMatrix(),
        responseShape: expect.objectContaining({ text: "assistant text", sessionID: "SessionID" }),
      },
    })
    expect(fixture.cases.find((item) => item.scenarioID === "web-dashboard-uses-native-desktop-dashboard-surface")).toMatchObject({
      output: {
        kind: "hermes-web-dashboard",
        htmlDataAttribute: "data-hermes-dashboard=\"ready\"",
        routeHandlers: expect.arrayContaining(["GET /v1/capabilities", "GET /v1/dashboard", "GET /v1/tui"]),
      },
    })
    expect(verifyHermesProductShellNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    expect(hermesProductShellNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([...hermesProductShellNativeExactAtomIDs])
    for (const descriptor of hermesProductShellNativeDescriptors) {
      expect(descriptor).toMatchObject({
        port: "product.shell",
        product: "hermes-agent",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          hermesProductShellNativeExactEvidenceRef,
          hermesProductShellNativeExactReplayRef,
          hermesUINativeExactEvidenceRef,
          hermesUINativeExactReplayRef,
        ]),
        fixtureIDs: [hermesProductShellNativeExactFixtureID, hermesUINativeExactFixtureID],
      })
    }

    for (const atomID of hermesProductShellNativeExactAtomIDs) {
      expect(routeForAtomBlock(atomID), atomID).toMatchObject({
        packageName: "@helix/adapters-hermes",
        exportPath: "./product-schema/product-shell",
      })
    }

    const contract = buildAssemblyContract({ product: "hermes-agent" })
    for (const atomID of hermesProductShellNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom).toMatchObject({
        sourcePackage: "@helix/adapters-hermes",
        publicExport: "./product-schema/product-shell",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          hermesProductShellNativeExactEvidenceRef,
          hermesProductShellNativeExactReplayRef,
          hermesUINativeExactEvidenceRef,
          hermesUINativeExactReplayRef,
        ]),
        fixtureIDs: [hermesProductShellNativeExactFixtureID, hermesUINativeExactFixtureID],
      })
    }
    expect(contract.bindings.find((binding) => binding.capability.id === "product.shell")).toMatchObject({
      providerAtom: expect.any(String),
      replaceable: true,
    })
  })
})
