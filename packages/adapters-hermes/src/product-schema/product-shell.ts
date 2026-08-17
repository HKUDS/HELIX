import { createHash } from "node:crypto"
import { HERMES_CLI_COMMANDS } from "../hermes-cli.ts"
import {
  hermesUINativeExactEvidenceRef,
  hermesUINativeExactFixtureID,
  hermesUINativeExactReplayRef,
  hermesUIUpstreamRef,
  renderHermesTUIFrame,
} from "./ui.ts"

export const hermesProductShellUpstreamRef = hermesUIUpstreamRef
export const hermesProductShellACPNativeExactAtomID = "hermes.product-shell.acp"
export const hermesProductShellAPIServerNativeExactAtomID = "hermes.product-shell.api-server"
export const hermesProductShellCLINativeExactAtomID = "hermes.product-shell.cli"
export const hermesProductShellGatewayNativeExactAtomID = "hermes.product-shell.gateway"
export const hermesProductShellHarnessNativeExactAtomID = "hermes.product-shell.harness"
export const hermesProductShellSDKNativeExactAtomID = "hermes.product-shell.sdk"
export const hermesProductShellTUINativeExactAtomID = "hermes.product-shell.tui"
export const hermesProductShellWebDashboardNativeExactAtomID = "hermes.product-shell.web-dashboard"
export const hermesProductShellNativeExactAtomIDs = [
  hermesProductShellACPNativeExactAtomID,
  hermesProductShellAPIServerNativeExactAtomID,
  hermesProductShellCLINativeExactAtomID,
  hermesProductShellGatewayNativeExactAtomID,
  hermesProductShellHarnessNativeExactAtomID,
  hermesProductShellSDKNativeExactAtomID,
  hermesProductShellTUINativeExactAtomID,
  hermesProductShellWebDashboardNativeExactAtomID,
] as const

export const hermesProductShellNativeExactFixtureID = "hermes-product-shell:native-exact-fixture"
export const hermesProductShellNativeExactEvidenceRef = "conformance:hermes-product-shell-native-exact-fixture"
export const hermesProductShellNativeExactReplayRef = "product-shell-native-exact:hermes-agent"

export type HermesProductShellNativeAtomID = (typeof hermesProductShellNativeExactAtomIDs)[number]

export type HermesProductShellNativeScenarioID =
  | "cli-surface-uses-hermes-cli-command-registry"
  | "sdk-surface-exposes-workspace-session-and-run-turn"
  | "api-server-surface-uses-openai-compatible-routes"
  | "acp-surface-advertises-session-prompt-and-slash-commands"
  | "gateway-surface-dispatches-platform-messages"
  | "harness-registration-exposes-shared-services"
  | "tui-shell-uses-native-display-and-terminal-surface"
  | "web-dashboard-uses-native-desktop-dashboard-surface"
  | "surface-registration-exposes-tui-dashboard-and-api-services"

export interface HermesProductShellNativeExactCase {
  scenarioID: HermesProductShellNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface HermesProductShellNativeDescriptor {
  id: HermesProductShellNativeAtomID
  port: "product.shell"
  product: "hermes-agent"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: readonly [
    typeof hermesProductShellNativeExactEvidenceRef,
    typeof hermesProductShellNativeExactReplayRef,
    typeof hermesUINativeExactEvidenceRef,
    typeof hermesUINativeExactReplayRef,
  ]
  fixtureIDs: readonly [typeof hermesProductShellNativeExactFixtureID, typeof hermesUINativeExactFixtureID]
  knownLossiness: []
}

export interface HermesProductShellNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  atomIDs: typeof hermesProductShellNativeExactAtomIDs
  portIDs: readonly ["product.shell"]
  upstreamRef: typeof hermesProductShellUpstreamRef
  evidenceRef: typeof hermesProductShellNativeExactEvidenceRef
  fixtureID: typeof hermesProductShellNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    cliSurfaceUsesHermesInteractiveEntrypointAndSlashCommands: true
    sdkSurfaceSharesHarnessWorkspaceRegistriesSessionAndRunTurn: true
    apiServerUsesOpenAICompatibleChatModelsCapabilitiesHealthAndSSE: true
    acpSurfaceAdvertisesSessionPromptAndSlashCommands: true
    gatewaySurfaceDispatchesPlatformMessagesThroughSharedSDK: true
    harnessSurfaceRegistersSharedSDKCLIACPAPIAndGateway: true
    tuiSurfaceUsesHermesDisplaySpinnerPreviewDiffAndInkTerminalPipeline: true
    webDashboardUsesNativeDesktopInspectionAndServerDashboardRoute: true
    surfaceRegistrationSharesSDKWorkspaceState: true
    productShellRenderAndDispatchAreReplaceableWithOtherTUIShells: true
  }
  cases: HermesProductShellNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly HermesProductShellNativeDescriptor[]
  fingerprint: string
}

export interface HermesProductShellNativeExactIssue {
  id: string
  message: string
}

export interface HermesProductShellNativeExactVerification {
  ok: boolean
  issues: HermesProductShellNativeExactIssue[]
}

function hermesProductShellNativeDescriptor(id: HermesProductShellNativeAtomID): HermesProductShellNativeDescriptor {
  return {
    id,
    port: "product.shell",
    product: "hermes-agent",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [
      hermesProductShellNativeExactEvidenceRef,
      hermesProductShellNativeExactReplayRef,
      hermesUINativeExactEvidenceRef,
      hermesUINativeExactReplayRef,
    ],
    fixtureIDs: [hermesProductShellNativeExactFixtureID, hermesUINativeExactFixtureID],
    knownLossiness: [],
    selectionReason: hermesProductShellNativeSelectionReason(id),
  }
}

function hermesProductShellNativeSelectionReason(id: HermesProductShellNativeAtomID): string {
  if (id === hermesProductShellACPNativeExactAtomID) {
    return "Hermes upstream native implementation for the ACP product shell is HermesACPAgent, which exposes initialize/auth/session prompt, advertised slash commands, streaming message updates, and cancellation/fork hooks."
  }
  if (id === hermesProductShellAPIServerNativeExactAtomID) {
    return "Hermes upstream native implementation for the API server product shell exposes health, models, capabilities, OpenAI-compatible chat completions, SSE, session headers, responses, and run endpoints."
  }
  if (id === hermesProductShellCLINativeExactAtomID) {
    return "Hermes upstream native implementation for the CLI product shell is cli.py HermesCLI and ChatConsole, including config loading, interactive prompt_toolkit input, slash commands, sessions, model switching, tool commands, gateway, and API launch flags."
  }
  if (id === hermesProductShellGatewayNativeExactAtomID) {
    return "Hermes upstream native implementation for the gateway product shell routes external platform messages through the API server adapter, response store, session continuity, and shared agent dispatch path."
  }
  if (id === hermesProductShellHarnessNativeExactAtomID) {
    return "Hermes product shell native parity complete: the harness assembly registers one shared SDK workspace into CLI, TUI, ACP, gateway, API server, and Web dashboard services."
  }
  if (id === hermesProductShellSDKNativeExactAtomID) {
    return "Hermes product shell native parity complete: SDK exposes the native workspace graph, registries, session readback, and runTurn path consumed by CLI, ACP, gateway, API server, TUI, and dashboard surfaces."
  }
  if (id === hermesProductShellTUINativeExactAtomID) {
    return "Hermes upstream native implementation for the TUI product shell is backed by agent/display.py spinner/tool-preview/diff output and the ui-tui gateway terminal surface."
  }
  return "Hermes upstream native implementation for the Web dashboard product shell is backed by the desktop dashboard surface, Hermes API dashboard route, and shared SDK workspace registration."
}

export const hermesProductShellNativeDescriptors = hermesProductShellNativeExactAtomIDs.map(hermesProductShellNativeDescriptor)

export const hermesProductShellNativeDescriptorByAtomID = Object.fromEntries(
  hermesProductShellNativeDescriptors.map((descriptor) => [descriptor.id, descriptor]),
) as Record<HermesProductShellNativeAtomID, HermesProductShellNativeDescriptor>

export function hermesProductShellCLICommandMatrix() {
  return HERMES_CLI_COMMANDS.map((command) => ({
    name: command.name,
    flags: [...command.flags],
    description: command.description,
  }))
}

export function hermesProductShellAPIServerRouteMatrix(): string[] {
  return [
    "GET /health",
    "GET /v1/capabilities",
    "GET /v1/models",
    "GET /v1/dashboard",
    "GET /v1/tui",
    "POST /v1/chat/completions",
    "POST /v1/runs",
    "POST /v1/acp",
    "POST /v1/gateway",
  ]
}

export function hermesProductShellACPMethodMatrix(): string[] {
  return ["initialize", "session/new", "session/prompt", "session/cancel", "session/fork", "auth/status"]
}

export function hermesProductShellGatewayMethodMatrix(): string[] {
  return ["gateway.message", "gateway.status", "gateway.interrupt"]
}

export function buildHermesProductShellNativeExactFixture(): HermesProductShellNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<HermesProductShellNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "hermes-agent" as const,
    atomIDs: [...hermesProductShellNativeExactAtomIDs] as typeof hermesProductShellNativeExactAtomIDs,
    portIDs: ["product.shell"] as const,
    upstreamRef: hermesProductShellUpstreamRef,
    evidenceRef: hermesProductShellNativeExactEvidenceRef,
    fixtureID: hermesProductShellNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      cliSurfaceUsesHermesInteractiveEntrypointAndSlashCommands: true as const,
      sdkSurfaceSharesHarnessWorkspaceRegistriesSessionAndRunTurn: true as const,
      apiServerUsesOpenAICompatibleChatModelsCapabilitiesHealthAndSSE: true as const,
      acpSurfaceAdvertisesSessionPromptAndSlashCommands: true as const,
      gatewaySurfaceDispatchesPlatformMessagesThroughSharedSDK: true as const,
      harnessSurfaceRegistersSharedSDKCLIACPAPIAndGateway: true as const,
      tuiSurfaceUsesHermesDisplaySpinnerPreviewDiffAndInkTerminalPipeline: true as const,
      webDashboardUsesNativeDesktopInspectionAndServerDashboardRoute: true as const,
      surfaceRegistrationSharesSDKWorkspaceState: true as const,
      productShellRenderAndDispatchAreReplaceableWithOtherTUIShells: true as const,
    },
    cases: [
      {
        scenarioID: "cli-surface-uses-hermes-cli-command-registry" as const,
        input: {
          executable: "hermes",
          upstreamEntrypoint: "cli.py#main",
          commandFamilies: ["chat", "setup", "tools", "skills", "gateway", "acp", "api", "doctor"],
        },
        output: {
          kind: "hermes-cli",
          commandRegistry: hermesProductShellCLICommandMatrix(),
          directRunRoute: {
            upstreamCommand: "chat",
            harnessMethod: "cli.run({ prompt, provider, model, json })",
            sharedSDK: "hermes.sdk.runTurn(input)",
          },
          nativeInteractiveFeatures: ["prompt_toolkit input area", "slash command dispatch", "session resume", "model switch", "toolset management"],
        },
        upstreamBehavior: "Hermes' native CLI product shell is cli.py HermesCLI and ChatConsole: config/env loading selects providers and terminal state, prompt_toolkit owns the interactive input loop, process_command dispatches slash commands, and chat/new_session/session/model/tool handlers route user prompts into the shared agent run path.",
      },
      {
        scenarioID: "sdk-surface-exposes-workspace-session-and-run-turn" as const,
        input: {
          serviceID: "hermes.sdk",
          workspaceFields: ["product", "cwd", "recipeID", "recipeVersion", "graph", "storageKind", "config", "registries", "services"],
          methods: ["workspace", "graph", "listSessions", "getSession", "runTurn"],
        },
        output: {
          kind: "hermes-sdk",
          workspaceSharesHarnessState: true,
          registryReadback: ["tools", "commands", "shortcuts", "flags", "providers", "auth", "uiProviders", "messageRenderers"],
          sessionReadback: ["listSessions({ cwd })", "getSession(sessionID).transcript"],
          runTurnRoute: "harness.runTurn(input)",
          replaceableSurfaceConsumers: ["hermes.cli", "hermes.acp", "hermes.gateway", "hermes.api-server.factory", "hermes.tui", "hermes.web-dashboard"],
        },
        upstreamBehavior: "Hermes upstream keeps CLI, ACP, gateway, and API server behavior bound to one agent/session runtime; the harness SDK mirrors that native workspace graph, registry state, session readback, and runTurn entrypoint so public product shells remain interchangeable.",
      },
      {
        scenarioID: "api-server-surface-uses-openai-compatible-routes" as const,
        input: {
          serviceID: "hermes.api-server.factory",
          upstreamAPI: ["GET /health", "GET /v1/models", "GET /v1/capabilities", "POST /v1/chat/completions"],
          request: { model: "hermes-agent", stream: false, messages: [{ role: "user", content: "hello" }] },
        },
        output: {
          kind: "hermes-api-server",
          routeHandlers: hermesProductShellAPIServerRouteMatrix(),
          healthShape: { status: "ok", ok: true, platform: "hermes-agent", product: "hermes-agent" },
          modelListShape: { object: "list", owned_by: "hermes", root: "hermes-agent" },
          capabilitiesShape: {
            object: "hermes.api_server.capabilities",
            features: ["chat_completions", "chat_completions_streaming", "run_submission", "session_continuity_header", "session_key_header"],
          },
          chatCompletionShape: {
            responseObject: "chat.completion",
            choiceMessageRole: "assistant",
            finishReason: "stop",
            sessionHeader: "X-Hermes-Session-Id",
          },
          streamCompletionShape: ["text/event-stream", "chat.completion.chunk", "data: [DONE]"],
        },
        upstreamBehavior: "Hermes' native API server in gateway/platforms/api_server.py publishes health, model list, capability discovery, and OpenAI-compatible /v1/chat/completions with non-streaming and SSE responses; the harness server preserves those wire shapes while keeping ACP, gateway, dashboard, TUI, and legacy /v1/runs routes available.",
      },
      {
        scenarioID: "acp-surface-advertises-session-prompt-and-slash-commands" as const,
        input: {
          serviceID: "hermes.acp",
          upstreamAgent: "HermesACPAgent",
          methods: hermesProductShellACPMethodMatrix(),
        },
        output: {
          kind: "hermes-acp",
          methods: hermesProductShellACPMethodMatrix(),
          initializeShape: { product: "hermes-agent", capabilities: hermesProductShellACPMethodMatrix() },
          promptRoute: "session/prompt -> sdk.runTurn({ text, provider, model })",
          advertisedSlashCommands: ["help", "model", "tools", "context", "reset", "compact", "steer", "queue", "version"],
        },
        upstreamBehavior: "HermesACPAgent initializes the ACP protocol with agent capabilities, advertises native slash commands, creates/resumes/forks sessions, maps user prompt blocks into agent input, streams message/thought/tool updates, and supports cancel/reset/queue behavior.",
      },
      {
        scenarioID: "gateway-surface-dispatches-platform-messages" as const,
        input: {
          serviceID: "hermes.gateway",
          methods: hermesProductShellGatewayMethodMatrix(),
          event: { platform: "api", text: "hello", userID: "U1" },
        },
        output: {
          kind: "hermes-gateway",
          methods: hermesProductShellGatewayMethodMatrix(),
          dispatchRoute: "gateway.message -> sdk.runTurn({ text, provider, model })",
          responseShape: { text: "assistant text", sessionID: "SessionID" },
          sharesAPIServerAdapter: true,
        },
        upstreamBehavior: "Hermes gateway platform adapters route external channel messages through the same server-side agent/session path used by the API server, preserving response text, session continuity, and interrupt/status control surfaces.",
      },
      {
        scenarioID: "harness-registration-exposes-shared-services" as const,
        input: {
          register: "registerHermesProductSurfaces",
          harnessState: ["recipe", "reference", "session", "hooks", "config", "graph"],
          surfaces: ["sdk", "cli", "tui", "acp", "gateway", "web-dashboard", "api-server"],
        },
        output: {
          serviceIDs: ["hermes.sdk", "hermes.cli", "hermes.tui", "hermes.acp", "hermes.gateway", "hermes.web-dashboard", "hermes.api-server.factory", "hermes.server.factory"],
          sharesSDK: true,
          serverFactoryReceives: ["sdk", "cli", "tui", "acp", "gateway", "webDashboard", "provider", "model"],
          consumerGraphAtomIDs: [
            "hermes.product-shell.acp",
            "hermes.product-shell.api-server",
            "hermes.product-shell.cli",
            "hermes.product-shell.gateway",
            "hermes.product-shell.harness",
            "hermes.product-shell.sdk",
            "hermes.product-shell.tui",
            "hermes.product-shell.web-dashboard",
          ],
        },
        upstreamBehavior: "The Harness Hermes product surface registers CLI, SDK, TUI, ACP, gateway, Web dashboard, and API server factory services against the same harness session/runtime state, so public product shell modules can be swapped without changing prompt input, assistant output, workspace graph, or session readback behavior.",
      },
      {
        scenarioID: "tui-shell-uses-native-display-and-terminal-surface" as const,
        input: {
          serviceID: "hermes.tui",
          renderWidth: 72,
          dispatch: [
            { type: "select", target: "model", value: "nous:hermes-4" },
            { type: "select", target: "theme", value: "dark" },
            { type: "submit", text: "hello" },
          ],
        },
        output: {
          kind: "hermes-tui",
          title: "Hermes Agent",
          status: "ready",
          upstreamTerminalRenderer: "hermes-ink",
          displayRenderer: "KawaiiSpinner",
          toolPreviewAndInlineDiff: true,
          frame: renderHermesTUIFrame({ width: 72, status: "ready" }),
          dispatchEvents: ["model-select", "theme-select", "submit"],
        },
        upstreamBehavior: "Hermes' terminal product shell combines agent/display.py KawaiiSpinner, tool preview, local edit snapshot, and inline unified diff rendering with the ui-tui gateway and hermes-ink terminal event/render pipeline.",
      },
      {
        scenarioID: "web-dashboard-uses-native-desktop-dashboard-surface" as const,
        input: {
          serviceID: "hermes.web-dashboard",
          httpRoutes: ["GET /v1/capabilities", "GET /v1/dashboard", "GET /v1/tui"],
          desktopSources: ["apps/desktop/src/app/chat", "apps/desktop/src/app/composer", "apps/desktop/src/app/settings", "apps/desktop/src/app/shell"],
        },
        output: {
          kind: "hermes-web-dashboard",
          htmlDataAttribute: "data-hermes-dashboard=\"ready\"",
          routeHandlers: ["GET /v1/capabilities", "GET /v1/dashboard", "GET /v1/tui"],
          desktopSurface: ["chat timeline", "composer", "settings/model picker", "shell/status"],
          localPreview: true,
        },
        upstreamBehavior: "Hermes' inspection dashboard maps the desktop app chat/composer/settings/shell surface and the API server dashboard/capabilities/TUI routes onto a replaceable product shell that shares the SDK workspace graph and service state.",
      },
      {
        scenarioID: "surface-registration-exposes-tui-dashboard-and-api-services" as const,
        input: { register: "registerHermesProductSurfaces", sdkState: ["workspace", "graph", "tools", "services"], surfaces: ["cli", "tui", "web-dashboard", "acp", "gateway", "api-server"] },
        output: {
          serviceIDs: ["hermes.sdk", "hermes.cli", "hermes.tui", "hermes.web-dashboard", "hermes.api-server.factory", "hermes.server.factory", "hermes.acp", "hermes.gateway"],
          sharesSDK: true,
          renderIncludes: "Hermes Agent TUI",
          webRenderIncludes: "data-hermes-dashboard=\"ready\"",
          commands: ["chat", "setup", "tools", "skills", "gateway", "acp", "api", "doctor"],
          apiRoutes: hermesProductShellAPIServerRouteMatrix(),
        },
        upstreamBehavior: "The Harness Hermes product surface registers CLI, TUI, ACP, gateway, API server, and Web dashboard services against one SDK workspace, while the TUI carries native upstream terminal behavior and the dashboard/API routes carry the native desktop and OpenAI-compatible inspection surfaces.",
      },
    ],
    sourceRefs: [
      "cli.py#HermesCLI,ChatConsole,load_cli_config,main,run,chat,new_session,process_command,_handle_sessions_command,_handle_model_switch,_handle_tools_command",
      "gateway/platforms/api_server.py#APIServerAdapter,_handle_health,_handle_models,_handle_capabilities,_handle_chat_completions,_write_sse_chat_completion,_derive_chat_session_id,_openai_error",
      "agent/display.py#KawaiiSpinner,set_tool_preview_max_len,build_tool_preview,capture_local_edit_snapshot,extract_edit_diff,_render_inline_unified_diff,render_edit_diff_with_delta",
      "acp_adapter/server.py#HermesACPAgent,initialize,authenticate,new_session,prompt,cancel,fork_session,_ADVERTISED_COMMANDS,_available_commands,_handle_slash_command,_cmd_help,_cmd_model,_cmd_tools,_cmd_context,_cmd_reset,_cmd_compact,_cmd_steer,_cmd_queue,_cmd_version",
      "ui-tui/src/app/useInputHandlers.ts#keyboard,paste,submit,slash",
      "ui-tui/src/app/createSlashHandler.ts#slashCommands,dispatch",
      "ui-tui/packages/hermes-ink/src/ink/render-to-screen.ts#renderToScreen",
      "tui_gateway/server.py#gateway,events,session",
      "apps/desktop/src/app/chat#chat,composer,settings,shell",
      "packages/recipes/src/harness-atoms.ts#createHermesAgentHarnessAssemblyAtom,assembleHermesAgentHarness,hermes.product-shell.harness",
      "packages/adapters-hermes/src/hermes-sdk.ts#createHermesSDK,workspace,graph,listSessions,getSession,runTurn",
      "packages/adapters-hermes/src/hermes-cli.ts#HERMES_CLI_COMMANDS,createHermesCLI,commands,renderHelp,run",
      "packages/adapters-hermes/src/hermes-acp.ts#createHermesACP,methods,call,session/prompt",
      "packages/adapters-hermes/src/hermes-gateway.ts#createHermesGateway,methods,dispatch",
      "packages/adapters-hermes/src/hermes-tui.ts#createHermesTUI,render,dispatch,interactiveSnapshot",
      "packages/adapters-hermes/src/hermes-web-dashboard.ts#createHermesWebDashboard,render",
      "packages/adapters-hermes/src/hermes-api-server.ts#createHermesAPIServer,GET /health,GET /v1/models,GET /v1/capabilities,POST /v1/chat/completions,POST /v1/acp,POST /v1/gateway",
      "packages/adapters-hermes/src/surfaces/assembly.ts#createHermesProductSurfaces",
      "packages/adapters-hermes/src/surfaces/registration.ts#registerHermesSurfaceServices,hermes.sdk,hermes.cli,hermes.tui,hermes.acp,hermes.gateway,hermes.web-dashboard,hermes.api-server.factory",
    ],
    nativeEvidenceRefs: [
      hermesProductShellNativeExactEvidenceRef,
      hermesProductShellNativeExactReplayRef,
      hermesUINativeExactEvidenceRef,
      hermesUINativeExactReplayRef,
    ],
    fixtureIDs: [hermesProductShellNativeExactFixtureID, hermesUINativeExactFixtureID],
    knownLossiness: [],
    descriptors: hermesProductShellNativeDescriptors,
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintHermesProductShellNativeFixture(fixtureWithoutFingerprint),
  }
}

export function verifyHermesProductShellNativeExactFixture(fixture: HermesProductShellNativeExactFixture): HermesProductShellNativeExactVerification {
  const issues: HermesProductShellNativeExactIssue[] = []
  if (fixture.schemaVersion !== 1) issues.push({ id: "hermes-product-shell-native-exact.schema", message: "schemaVersion must be 1." })
  if (fixture.product !== "hermes-agent") issues.push({ id: "hermes-product-shell-native-exact.product", message: "product must be hermes-agent." })
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    issues.push({ id: "hermes-product-shell-native-exact.claim", message: "fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) issues.push({ id: "hermes-product-shell-native-exact.lossiness", message: "native fixture must not retain known lossiness." })
  for (const atomID of hermesProductShellNativeExactAtomIDs) {
    if (!fixture.atomIDs.includes(atomID)) issues.push({ id: "hermes-product-shell-native-exact.atoms", message: `fixture must cover ${atomID}.` })
  }
  const scenarios = new Set(fixture.cases.map((item) => item.scenarioID))
  for (const scenario of [
    "cli-surface-uses-hermes-cli-command-registry",
    "sdk-surface-exposes-workspace-session-and-run-turn",
    "api-server-surface-uses-openai-compatible-routes",
    "acp-surface-advertises-session-prompt-and-slash-commands",
    "gateway-surface-dispatches-platform-messages",
    "harness-registration-exposes-shared-services",
    "tui-shell-uses-native-display-and-terminal-surface",
    "web-dashboard-uses-native-desktop-dashboard-surface",
    "surface-registration-exposes-tui-dashboard-and-api-services",
  ] as const) {
    if (!scenarios.has(scenario)) issues.push({ id: "hermes-product-shell-native-exact.cases", message: `missing scenario ${scenario}.` })
  }
  if (
    !fixture.policy.cliSurfaceUsesHermesInteractiveEntrypointAndSlashCommands ||
    !fixture.policy.sdkSurfaceSharesHarnessWorkspaceRegistriesSessionAndRunTurn ||
    !fixture.policy.apiServerUsesOpenAICompatibleChatModelsCapabilitiesHealthAndSSE ||
    !fixture.policy.acpSurfaceAdvertisesSessionPromptAndSlashCommands ||
    !fixture.policy.gatewaySurfaceDispatchesPlatformMessagesThroughSharedSDK ||
    !fixture.policy.harnessSurfaceRegistersSharedSDKCLIACPAPIAndGateway ||
    !fixture.policy.tuiSurfaceUsesHermesDisplaySpinnerPreviewDiffAndInkTerminalPipeline ||
    !fixture.policy.webDashboardUsesNativeDesktopInspectionAndServerDashboardRoute ||
    !fixture.policy.surfaceRegistrationSharesSDKWorkspaceState
  ) {
    issues.push({ id: "hermes-product-shell-native-exact.policy", message: "fixture lost Hermes product shell native policy." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintHermesProductShellNativeFixture(withoutFingerprint)) {
    issues.push({ id: "hermes-product-shell-native-exact.fingerprint", message: "fingerprint does not match fixture content." })
  }
  return { ok: issues.length === 0, issues }
}

function fingerprintHermesProductShellNativeFixture(fixture: Omit<HermesProductShellNativeExactFixture, "fingerprint">): string {
  return createHash("sha256").update(JSON.stringify(fixture)).digest("hex").slice(0, 16)
}
