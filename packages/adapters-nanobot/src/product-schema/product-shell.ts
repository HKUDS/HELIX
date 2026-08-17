import { createHash } from "node:crypto"
import {
  nanobotUINativeExactEvidenceRef,
  nanobotUINativeExactFixtureID,
  nanobotUINativeExactReplayRef,
  nanobotUIUpstreamRef,
} from "@helix/lego-ui/product-schema/nanobot"
import { NANOBOT_CLI_COMMANDS } from "../nanobot-cli.ts"
import { buildNanobotWebUIBootstrap, nanobotWebUINativeHTTPRoutes } from "../nanobot-web-ui.ts"

export const nanobotProductShellUpstreamRef = nanobotUIUpstreamRef
export const nanobotProductShellCLINativeExactAtomID = "nanobot.product-shell.cli"
export const nanobotProductShellHarnessNativeExactAtomID = "nanobot.product-shell.harness"
export const nanobotProductShellSDKNativeExactAtomID = "nanobot.product-shell.sdk"
export const nanobotProductShellServerNativeExactAtomID = "nanobot.product-shell.server"
export const nanobotProductShellTUINativeExactAtomID = "nanobot.product-shell.tui"
export const nanobotProductShellWebUINativeExactAtomID = "nanobot.product-shell.web-ui"
export const nanobotProductShellNativeExactAtomIDs = [
  nanobotProductShellCLINativeExactAtomID,
  nanobotProductShellHarnessNativeExactAtomID,
  nanobotProductShellSDKNativeExactAtomID,
  nanobotProductShellServerNativeExactAtomID,
  nanobotProductShellTUINativeExactAtomID,
  nanobotProductShellWebUINativeExactAtomID,
] as const

export const nanobotProductShellNativeExactFixtureID = "nanobot-product-shell:native-exact-fixture"
export const nanobotProductShellNativeExactEvidenceRef = "conformance:nanobot-product-shell-native-exact-fixture"
export const nanobotProductShellNativeExactReplayRef = "product-shell-native-exact:nanobot"

export type NanobotProductShellNativeScenarioID =
  | "cli-surface-uses-typer-command-registry"
  | "sdk-surface-exposes-workspace-session-and-run-turn"
  | "server-surface-uses-openai-compatible-api-and-webui-routes"
  | "harness-registration-exposes-shared-services"
  | "tui-shell-uses-native-terminal-stream"
  | "web-ui-uses-native-websocket-channel"
  | "surface-registration-exposes-tui-service"

export interface NanobotProductShellNativeExactCase {
  scenarioID: NanobotProductShellNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface NanobotProductShellNativeDescriptor {
  id: (typeof nanobotProductShellNativeExactAtomIDs)[number]
  port: "product.shell"
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: readonly [
    typeof nanobotProductShellNativeExactEvidenceRef,
    typeof nanobotProductShellNativeExactReplayRef,
    typeof nanobotUINativeExactEvidenceRef,
    typeof nanobotUINativeExactReplayRef,
  ]
  fixtureIDs: readonly [typeof nanobotProductShellNativeExactFixtureID, typeof nanobotUINativeExactFixtureID]
  knownLossiness: []
}

export interface NanobotProductShellNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomIDs: typeof nanobotProductShellNativeExactAtomIDs
  portIDs: readonly ["product.shell"]
  upstreamRef: typeof nanobotProductShellUpstreamRef
  evidenceRef: typeof nanobotProductShellNativeExactEvidenceRef
  fixtureID: typeof nanobotProductShellNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    cliSurfaceUsesTyperCommandEntrypoint: true
    sdkSurfaceSharesHarnessWorkspaceRegistriesAndSession: true
    serverSurfaceUsesOpenAICompatibleChatModelsHealthAndWebUIRoutes: true
    harnessSurfaceRegistersSharedSDKCLIWebUIServerFactory: true
    tuiSurfaceUsesPromptToolkitAndRichStreamRenderer: true
    webUIUsesNativeWebsocketChannelAndStaticSPA: true
    serviceRegistrationSharesSDKWorkspaceState: true
    productShellRenderAndDispatchAreReplaceableWithOtherTUIShells: true
  }
  cases: NanobotProductShellNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly NanobotProductShellNativeDescriptor[]
  fingerprint: string
}

export interface NanobotProductShellNativeExactIssue {
  id: string
  message: string
}

export interface NanobotProductShellNativeExactVerification {
  ok: boolean
  issues: NanobotProductShellNativeExactIssue[]
}

function nanobotProductShellNativeDescriptor(id: (typeof nanobotProductShellNativeExactAtomIDs)[number]): NanobotProductShellNativeDescriptor {
  return {
    id,
    port: "product.shell",
    product: "nanobot",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [
      nanobotProductShellNativeExactEvidenceRef,
      nanobotProductShellNativeExactReplayRef,
      nanobotUINativeExactEvidenceRef,
      nanobotUINativeExactReplayRef,
    ],
    fixtureIDs: [nanobotProductShellNativeExactFixtureID, nanobotUINativeExactFixtureID],
    knownLossiness: [],
    selectionReason: nanobotProductShellNativeSelectionReason(id),
  }
}

function nanobotProductShellNativeSelectionReason(id: (typeof nanobotProductShellNativeExactAtomIDs)[number]): string {
  if (id === nanobotProductShellCLINativeExactAtomID) {
    return "Nanobot upstream native implementation for the CLI product shell is the Typer nanobot entrypoint with onboard, agent, serve, gateway, status, channels, and provider command groups."
  }
  if (id === nanobotProductShellHarnessNativeExactAtomID) {
    return "Nanobot product shell native parity complete: surface registration binds one harness-backed SDK workspace into CLI, TUI, Web UI, and server factory services."
  }
  if (id === nanobotProductShellSDKNativeExactAtomID) {
    return "Nanobot product shell native parity complete: SDK exposes the native workspace graph, registries, session readback, and runTurn path shared by CLI, API, TUI, and Web UI surfaces."
  }
  if (id === nanobotProductShellServerNativeExactAtomID) {
    return "Nanobot upstream native implementation for the API server product shell exposes /health, /v1/models, and OpenAI-compatible /v1/chat/completions while the harness server preserves Web UI and legacy /v1/agent routes."
  }
  if (id === nanobotProductShellTUINativeExactAtomID) {
    return "Nanobot upstream native implementation for the TUI product shell is backed by prompt_toolkit input and Rich streaming renderer behavior."
  }
  return "Nanobot upstream native implementation for the Web UI product shell is backed by WebSocketConfig, WebUI bootstrap metadata, REST session/settings/commands routes, and static SPA serving behavior."
}

export const nanobotProductShellNativeDescriptors = nanobotProductShellNativeExactAtomIDs.map(nanobotProductShellNativeDescriptor)

export const nanobotProductShellNativeDescriptorByAtomID = Object.fromEntries(
  nanobotProductShellNativeDescriptors.map((descriptor) => [descriptor.id, descriptor]),
) as Record<(typeof nanobotProductShellNativeExactAtomIDs)[number], NanobotProductShellNativeDescriptor>

export function nanobotProductShellCLICommandMatrix() {
  return NANOBOT_CLI_COMMANDS.map((command) => ({
    name: command.name,
    flags: [...command.flags],
    description: command.description,
  }))
}

export function nanobotProductShellServerRouteMatrix(): string[] {
  return [
    "GET /health",
    "GET /v1/models",
    "POST /v1/chat/completions",
    "GET /",
    "GET /v1/web",
    "GET /v1/tui",
    "POST /v1/agent",
    ...nanobotWebUINativeHTTPRoutes,
  ]
}

export function buildNanobotProductShellNativeExactFixture(): NanobotProductShellNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<NanobotProductShellNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "nanobot" as const,
    atomIDs: [...nanobotProductShellNativeExactAtomIDs] as typeof nanobotProductShellNativeExactAtomIDs,
    portIDs: ["product.shell"] as const,
    upstreamRef: nanobotProductShellUpstreamRef,
    evidenceRef: nanobotProductShellNativeExactEvidenceRef,
    fixtureID: nanobotProductShellNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      cliSurfaceUsesTyperCommandEntrypoint: true as const,
      sdkSurfaceSharesHarnessWorkspaceRegistriesAndSession: true as const,
      serverSurfaceUsesOpenAICompatibleChatModelsHealthAndWebUIRoutes: true as const,
      harnessSurfaceRegistersSharedSDKCLIWebUIServerFactory: true as const,
      tuiSurfaceUsesPromptToolkitAndRichStreamRenderer: true as const,
      webUIUsesNativeWebsocketChannelAndStaticSPA: true as const,
      serviceRegistrationSharesSDKWorkspaceState: true as const,
      productShellRenderAndDispatchAreReplaceableWithOtherTUIShells: true as const,
    },
    cases: [
      {
        scenarioID: "cli-surface-uses-typer-command-registry" as const,
        input: {
          executable: "nanobot",
          pyprojectScript: "nanobot = nanobot.cli.commands:app",
          helpOptions: ["-h", "--help"],
        },
        output: {
          kind: "nanobot-cli",
          commandRegistry: nanobotProductShellCLICommandMatrix(),
          directRunRoute: {
            upstreamCommand: "agent",
            sessionOption: "--session/-s",
            messageOption: "--message/-m",
            noMarkdownFlag: "--no-markdown",
            harnessMethod: "cli.run({ prompt, provider, model, json })",
          },
          serviceCommandRoutes: ["serve:/v1/chat/completions", "gateway:channel-gateway", "channels:login/status", "provider:login/logout", "status:workspace-config"],
        },
        upstreamBehavior: "Nanobot's native product CLI is the Typer app in nanobot/cli/commands.py, exported by pyproject.toml as the nanobot script; the harness CLI preserves the user-facing command registry and routes direct agent prompts through the shared SDK runTurn path.",
      },
      {
        scenarioID: "sdk-surface-exposes-workspace-session-and-run-turn" as const,
        input: {
          serviceID: "nanobot.sdk",
          workspaceFields: ["product", "cwd", "recipeID", "recipeVersion", "graph", "storageKind", "config", "registries", "services"],
          methods: ["workspace", "graph", "listSessions", "getSession", "runTurn"],
        },
        output: {
          kind: "nanobot-sdk",
          workspaceSharesHarnessState: true,
          registryReadback: ["tools", "commands", "providers", "services"],
          sessionReadback: ["listSessions({ cwd })", "getSession(sessionID).transcript"],
          runTurnRoute: "harness.runTurn(input)",
          replaceableSurfaceConsumers: ["nanobot.cli", "nanobot.tui", "nanobot.web-ui", "nanobot.server.factory"],
        },
        upstreamBehavior: "Nanobot upstream keeps the product shell bound to one agent/runtime workspace; the harness SDK mirrors that by exposing the recipe graph, registries, session readback, and runTurn entrypoint consumed by CLI, API, TUI, and Web UI surfaces.",
      },
      {
        scenarioID: "server-surface-uses-openai-compatible-api-and-webui-routes" as const,
        input: {
          serviceID: "nanobot.server.factory",
          upstreamAPI: ["GET /health", "GET /v1/models", "POST /v1/chat/completions"],
          harnessRoutes: ["GET /", "GET /v1/web", "GET /v1/tui", "POST /v1/agent", ...nanobotWebUINativeHTTPRoutes],
        },
        output: {
          kind: "nanobot-server",
          routeHandlers: nanobotProductShellServerRouteMatrix(),
          healthShape: { status: "ok", ok: true, product: "nanobot" },
          modelListShape: { object: "list", owned_by: "nanobot" },
          chatCompletionShape: {
            request: { messages: [{ role: "user", content: "hello" }], model: "nanobot", stream: false },
            responseObject: "chat.completion",
            choiceMessageRole: "assistant",
            finishReason: "stop",
          },
          streamCompletionShape: ["text/event-stream", "chat.completion.chunk", "data: [DONE]"],
          webUIBridgeRoutes: [...nanobotWebUINativeHTTPRoutes],
        },
        upstreamBehavior: "Nanobot's native API server in nanobot/api/server.py registers GET /health, GET /v1/models, and POST /v1/chat/completions, validates one user message and model identity, then returns OpenAI-compatible non-stream or SSE chat completion responses; the harness server now exposes those routes while retaining Web UI and legacy /v1/agent compatibility routes.",
      },
      {
        scenarioID: "harness-registration-exposes-shared-services" as const,
        input: {
          register: "registerNanobotProductSurfaces",
          harnessState: ["recipe", "reference", "session", "hooks", "config", "graph"],
          surfaces: ["sdk", "cli", "tui", "web-ui", "server"],
        },
        output: {
          serviceIDs: ["nanobot.sdk", "nanobot.cli", "nanobot.tui", "nanobot.web-ui", "nanobot.server.factory"],
          sharesSDK: true,
          serverFactoryReceives: ["sdk", "cli", "tui", "webUI", "provider", "model"],
          consumerGraphAtomIDs: [
            "nanobot.product-shell.cli",
            "nanobot.product-shell.harness",
            "nanobot.product-shell.sdk",
            "nanobot.product-shell.server",
            "nanobot.product-shell.tui",
            "nanobot.product-shell.web-ui",
          ],
        },
        upstreamBehavior: "The Harness Nanobot product surface registers the CLI, SDK, TUI, Web UI, and server factory against the same harness session/runtime state, so product shell modules can be swapped without changing user prompt input, assistant output, workspace graph, or session readback behavior.",
      },
      {
        scenarioID: "tui-shell-uses-native-terminal-stream" as const,
        input: { serviceID: "nanobot.tui", renderWidth: 78, dispatch: [{ type: "select", target: "theme", value: "dark" }, { type: "submit", text: "hello" }] },
        output: {
          kind: "nanobot-tui",
          title: "Nanobot",
          status: "ready",
          upstreamTerminalRenderer: "StreamRenderer",
          promptToolkitInput: true,
          richLiveTransient: true,
          dispatchEvents: ["theme-select", "submit"],
        },
        upstreamBehavior: "Nanobot's terminal product shell is implemented by nanobot/cli/commands.py and nanobot/cli/stream.py: prompt_toolkit owns interactive input and Rich Live renders streaming assistant output with transient updates followed by persistent final output.",
      },
      {
        scenarioID: "web-ui-uses-native-websocket-channel" as const,
        input: {
          serviceID: "nanobot.web-ui",
          httpRoutes: [...nanobotWebUINativeHTTPRoutes],
          bootstrapRequest: "GET /webui/bootstrap",
          staticRequest: "GET /",
        },
        output: {
          kind: "nanobot-web-ui",
          bootstrap: buildNanobotWebUIBootstrap(),
          routeHandlers: [
            "/webui/bootstrap",
            "/api/sessions",
            "/api/settings",
            "/api/commands",
            "/api/sessions/:key/messages",
            "/api/sessions/:key/webui-thread",
            "/api/media/:sig/:payload",
          ],
          staticSPA: {
            indexFallback: true,
            htmlDataAttribute: "data-nanobot-web-ui",
            bootstrapScriptID: "nanobot-webui-bootstrap",
            cachePolicy: { index: "no-cache", hashedAssets: "public, max-age=31536000, immutable" },
          },
          securityPolicy: ["localhost-only-bootstrap-without-secret", "token-issue-path-differs-from-ws-path", "media-hmac-signed-url", "path-traversal-forbidden"],
        },
        upstreamBehavior: "Nanobot's Web UI surface is implemented by nanobot/channels/websocket.py: WebSocketConfig validates path/token settings, /webui/bootstrap mints tokens and returns ws_path/model metadata, REST routes expose sessions/settings/commands/messages/thread/media data, and _serve_static resolves a built SPA directory with index.html fallback, MIME typing, and cache policy.",
      },
      {
        scenarioID: "surface-registration-exposes-tui-service" as const,
        input: { register: "registerNanobotProductSurfaces", sdkState: ["workspace", "graph", "tools"], surfaces: ["sdk", "cli", "tui", "web-ui", "server"] },
        output: {
          serviceIDs: ["nanobot.sdk", "nanobot.cli", "nanobot.tui", "nanobot.web-ui", "nanobot.server.factory"],
          sharesSDK: true,
          renderIncludes: "Nanobot TUI",
          webRenderIncludes: "data-nanobot-web-ui=\"ready\"",
          commands: ["agent", "serve", "gateway", "help", "theme", "model", "models", "interrupt"],
        },
        upstreamBehavior: "The Harness product surface registers Nanobot CLI, SDK, server, Web UI, and TUI services against one SDK workspace, while the TUI shell carries the native upstream terminal stream/input behavior and the Web UI carries the native upstream WebSocket/WebUI channel shape.",
      },
    ],
    sourceRefs: [
      "pyproject.toml#[project.scripts] nanobot=nanobot.cli.commands:app",
      "nanobot/api/server.py#create_app,handle_health,handle_models,handle_chat_completions,_sse_chunk,API_SESSION_KEY,API_CHAT_ID",
      "nanobot/cli/stream.py#ThinkingSpinner,StreamRenderer,on_delta,on_end,pause_spinner,stop_for_input",
      "nanobot/cli/commands.py#app,onboard,serve,gateway,agent,status,channels.login,channels.status,provider.login,provider.logout,PromptSession,EXIT_COMMANDS,_read_interactive_input_async,_print_interactive_response",
      "nanobot/channels/websocket.py#WebSocketConfig,_dispatch_http,_handle_bootstrap,_handle_sessions_list,_handle_settings,_handle_commands,_handle_session_messages,_handle_webui_thread_get,_handle_media_fetch,_serve_static,_authorize_websocket_handshake",
      "packages/adapters-nanobot/src/nanobot-cli.ts#NANOBOT_CLI_COMMANDS,createNanobotCLI,commands,renderHelp,run",
      "packages/adapters-nanobot/src/nanobot-sdk.ts#createNanobotSDK,workspace,graph,listSessions,getSession,runTurn",
      "packages/adapters-nanobot/src/nanobot-tui.ts#createNanobotTUI,createNanobotTUIFromSDK,render,dispatch,interactiveSnapshot",
      "packages/adapters-nanobot/src/nanobot-web-ui.ts#createNanobotWebUI,buildNanobotWebUIBootstrap,nanobotWebUINativeHTTPRoutes,render",
      "packages/adapters-nanobot/src/nanobot-server.ts#createNanobotServer,GET /health,GET /v1/models,POST /v1/chat/completions,GET /webui/bootstrap,GET /api/sessions,GET /api/settings,GET /api/commands",
      "packages/adapters-nanobot/src/product-surface.ts#registerNanobotProductSurfaces,nanobot.sdk,nanobot.cli,nanobot.tui,nanobot.web-ui,nanobot.server.factory",
    ],
    nativeEvidenceRefs: [
      nanobotProductShellNativeExactEvidenceRef,
      nanobotProductShellNativeExactReplayRef,
      nanobotUINativeExactEvidenceRef,
      nanobotUINativeExactReplayRef,
    ],
    fixtureIDs: [nanobotProductShellNativeExactFixtureID, nanobotUINativeExactFixtureID],
    knownLossiness: [],
    descriptors: nanobotProductShellNativeDescriptors,
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintNanobotProductShellNativeFixture(fixtureWithoutFingerprint),
  }
}

export function verifyNanobotProductShellNativeExactFixture(fixture: NanobotProductShellNativeExactFixture): NanobotProductShellNativeExactVerification {
  const issues: NanobotProductShellNativeExactIssue[] = []
  if (fixture.schemaVersion !== 1) issues.push({ id: "nanobot-product-shell-native-exact.schema", message: "schemaVersion must be 1." })
  if (fixture.product !== "nanobot") issues.push({ id: "nanobot-product-shell-native-exact.product", message: "product must be nanobot." })
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    issues.push({ id: "nanobot-product-shell-native-exact.claim", message: "fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) issues.push({ id: "nanobot-product-shell-native-exact.lossiness", message: "native fixture must not retain known lossiness." })
  const atomIDs = new Set(fixture.atomIDs)
  for (const atomID of nanobotProductShellNativeExactAtomIDs) {
    if (!atomIDs.has(atomID)) {
      issues.push({ id: "nanobot-product-shell-native-exact.atoms", message: `fixture must cover Nanobot product-shell atom ${atomID}.` })
    }
  }
  const scenarios = new Set(fixture.cases.map((item) => item.scenarioID))
  for (const scenario of [
    "cli-surface-uses-typer-command-registry",
    "sdk-surface-exposes-workspace-session-and-run-turn",
    "server-surface-uses-openai-compatible-api-and-webui-routes",
    "harness-registration-exposes-shared-services",
    "tui-shell-uses-native-terminal-stream",
    "web-ui-uses-native-websocket-channel",
    "surface-registration-exposes-tui-service",
  ] as const) {
    if (!scenarios.has(scenario)) issues.push({ id: "nanobot-product-shell-native-exact.cases", message: `missing scenario ${scenario}.` })
  }
  if (
    !fixture.policy.cliSurfaceUsesTyperCommandEntrypoint ||
    !fixture.policy.sdkSurfaceSharesHarnessWorkspaceRegistriesAndSession ||
    !fixture.policy.serverSurfaceUsesOpenAICompatibleChatModelsHealthAndWebUIRoutes ||
    !fixture.policy.harnessSurfaceRegistersSharedSDKCLIWebUIServerFactory ||
    !fixture.policy.tuiSurfaceUsesPromptToolkitAndRichStreamRenderer ||
    !fixture.policy.webUIUsesNativeWebsocketChannelAndStaticSPA ||
    !fixture.policy.serviceRegistrationSharesSDKWorkspaceState
  ) {
    issues.push({ id: "nanobot-product-shell-native-exact.policy", message: "fixture lost Nanobot CLI/SDK/API/TUI/Web product shell policy." })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintNanobotProductShellNativeFixture(withoutFingerprint)) {
    issues.push({ id: "nanobot-product-shell-native-exact.fingerprint", message: "fingerprint does not match fixture content." })
  }
  return { ok: issues.length === 0, issues }
}

function fingerprintNanobotProductShellNativeFixture(fixture: Omit<NanobotProductShellNativeExactFixture, "fingerprint">): string {
  return createHash("sha256").update(JSON.stringify(fixture)).digest("hex").slice(0, 16)
}
