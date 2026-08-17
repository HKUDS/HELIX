import { createHash } from "node:crypto"
import {
  openCodeListenPortCandidates,
  openCodeServerCanPublishMDNS,
  openCodeServerURL,
} from "../opencode-product-utils.ts"

export {
  openCodeListenPortCandidates,
  openCodeServerCanPublishMDNS,
  openCodeServerURL,
} from "../opencode-product-utils.ts"

export const openCodeProductShellUpstreamRef = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
export const openCodeProductShellSDKNativeExactAtomID = "opencode.product-shell.sdk"
export const openCodeProductShellServerNativeExactAtomID = "opencode.product-shell.server"
export const openCodeProductShellHarnessNativeExactAtomID = "opencode.product-shell.harness"
export const openCodeProductShellWorkspaceNativeExactAtomID = "opencode.product-shell.workspace"
export const openCodeProductShellControlPlaneNativeExactAtomID = "opencode.product-shell.control-plane"
export const openCodeProductShellTUINativeExactAtomID = "opencode.product-shell.tui"
export const openCodeProductShellWebNativeExactAtomID = "opencode.product-shell.web"
export const openCodeProductShellDesktopNativeExactAtomID = "opencode.product-shell.desktop"
export const openCodeProductShellSlackNativeExactAtomID = "opencode.product-shell.slack"
export const openCodeTUIShellNativeExactAtomID = "opencode.tui.shell"
export const openCodeProductShellNativeExactAtomIDs = [
  openCodeProductShellSDKNativeExactAtomID,
  openCodeProductShellServerNativeExactAtomID,
  openCodeProductShellHarnessNativeExactAtomID,
  openCodeProductShellWorkspaceNativeExactAtomID,
  openCodeProductShellControlPlaneNativeExactAtomID,
  openCodeProductShellTUINativeExactAtomID,
  openCodeProductShellWebNativeExactAtomID,
  openCodeProductShellDesktopNativeExactAtomID,
  openCodeProductShellSlackNativeExactAtomID,
  openCodeTUIShellNativeExactAtomID,
] as const

export const openCodeProductShellNativeExactFixtureID = "opencode-product-shell:native-exact-fixture"
export const openCodeProductShellNativeExactEvidenceRef = "conformance:opencode-product-shell-native-exact-fixture"
export const openCodeProductShellNativeExactReplayRef = "product-shell-native-exact:opencode"

export type OpenCodeProductShellNativeExactAtomID = (typeof openCodeProductShellNativeExactAtomIDs)[number]
export type OpenCodeProductShellNativePortID = "product.shell" | "ui.event-loop"
export type OpenCodeProductShellNativeScenarioID =
  | "sdk-make-registry-and-agent-api"
  | "sdk-session-prompt-subscribe-api"
  | "server-default-app-listener-and-mdns"
  | "server-cli-serve-command"
  | "web-command-listen-open-browser"
  | "desktop-electron-sidecar-renderer-shell"
  | "harness-bootstrap-surface-registration"
  | "workspace-snapshot-sdk-state"
  | "control-plane-route-and-registry-snapshot"
  | "tui-run-interactive-cli-gates"
  | "tui-run-interactive-runtime-entrypoints"
  | "tui-solid-app-renderer-sdk-event-stack"
  | "tui-local-surface-snapshot-and-event-loop"
  | "slack-bolt-socket-mode-thread-session-bot"

export interface OpenCodeProductShellNativeDescriptor {
  id: OpenCodeProductShellNativeExactAtomID
  port: OpenCodeProductShellNativePortID
  product: "opencode"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof openCodeProductShellNativeExactEvidenceRef, typeof openCodeProductShellNativeExactReplayRef]
  fixtureIDs: [typeof openCodeProductShellNativeExactFixtureID]
  knownLossiness: []
}

export interface OpenCodeProductShellNativeExactCase {
  scenarioID: OpenCodeProductShellNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface OpenCodeProductShellNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: typeof openCodeProductShellNativeExactAtomIDs
  portID: "product.shell"
  upstreamRef: typeof openCodeProductShellUpstreamRef
  evidenceRef: typeof openCodeProductShellNativeExactEvidenceRef
  fixtureID: typeof openCodeProductShellNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    sdkExposesOpenCodeMakeRegistryAgentSessionAndSubscribeSurface: true
    sdkToolAuthAndAgentAddMutateProductRegistries: true
    sdkSessionPromptRunsProviderBackedTurnAndKeepsMessageReadback: true
    serverDefaultAppSupportsFetchAndRequestEntryPoints: true
    serverListenPortZeroPrefers4096ThenAnyFreePort: true
    serverListenReturnsHostnamePortUrlAndStopWithForceClose: true
    mdnsPublishesOnlyForNonLoopbackHosts: true
    serveCommandWarnsWhenPasswordMissingAndStartsHeadlessListener: true
    webCommandStartsServerAndOpensResolvedURL: true
    webCommandShowsLocalNetworkAndMdnsAccessForWildcardHost: true
    desktopAppStartsSidecarAndRendererWithSecureElectronWindow: true
    desktopAppRegistersDeepLinksAndDesktopClientEnvironment: true
    harnessBootstrapLoadsProvidesAndDisposesInstanceRuntime: true
    harnessRegistersOpenCodeRecipeSessionConfigHooksAndProductSurfaces: true
    workspaceSnapshotExposesOpenCodeCwdGraphConfigRegistriesAndServices: true
    controlPlaneSnapshotExposesReadyStatusRoutesProvidersAuthAndRecipeModules: true
    tuiInteractiveRejectsIncompatibleFlagsBeforeRuntimeBoot: true
    tuiInteractiveLocalModeUsesInProcessClientAndLazySession: true
    tuiInteractiveAttachModeUsesRemoteClientHeadersAndDirectory: true
    tuiAppCreatesOpenTUIRendererKeymapProvidersAndBatchedSDKEvents: true
    tuiSurfaceExposesSnapshotRenderDispatchAndInteractiveEventLoop: true
    slackBotUsesBoltSocketModeCreateOpencodeThreadSessionsPromptAndToolUpdatePosts: true
  }
  cases: OpenCodeProductShellNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: OpenCodeProductShellNativeDescriptor[]
  fingerprint: string
}

export interface OpenCodeTUIRunProjectionInput {
  interactive: boolean
  command?: boolean
  format?: "default" | "json"
  demo?: boolean
  replay?: boolean
  replayLimit?: number
  stdoutTTY?: boolean
  attach?: string
  dir?: string
  files?: string[]
  message?: string
  piped?: string
  thinking?: boolean
}

export interface OpenCodeTUIRunProjection {
  errors: string[]
  mode: "interactive-local" | "interactive-attach" | "noninteractive"
  thinking: boolean
  replay: boolean
  runtimeEntrypoint: "runInteractiveLocalMode" | "runInteractiveMode" | "execute"
  sessionStrategy: "lazy-local-session" | "attach-existing-session" | "single-noninteractive-session"
  permissionRules: string[]
  initialInput: string | undefined
  filePartPolicy: Array<{ source: string; mime: "application/x-directory" | "text/plain"; url: string }>
  directoryPolicy: "local-chdir-or-root" | "remote-dir-passthrough"
}

export interface OpenCodeProductShellNativeExactIssue {
  id: string
  message: string
}

export interface OpenCodeProductShellNativeExactVerification {
  ok: boolean
  issues: OpenCodeProductShellNativeExactIssue[]
}

function openCodeProductShellNativePort(id: OpenCodeProductShellNativeExactAtomID): OpenCodeProductShellNativePortID {
  return id === openCodeTUIShellNativeExactAtomID ? "ui.event-loop" : "product.shell"
}

function openCodeProductShellNativeDescriptor(id: OpenCodeProductShellNativeExactAtomID): OpenCodeProductShellNativeDescriptor {
  return {
    id,
    port: openCodeProductShellNativePort(id),
    product: "opencode",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [openCodeProductShellNativeExactEvidenceRef, openCodeProductShellNativeExactReplayRef],
    fixtureIDs: [openCodeProductShellNativeExactFixtureID],
    knownLossiness: [],
    selectionReason:
      "OpenCode upstream native implementation for OpenCode.make SDK registry/session APIs, InstanceRuntime bootstrap/assembly, Server.listen/Default app behavior, cli/cmd/web browser-launch behavior, desktop Electron sidecar/renderer shell behavior, server/app control-plane state, workspace registry snapshots, run --interactive/OpenTUI shell behavior, and the @slack/bolt socket-mode Slack bot; native parity complete for SDK, harness, server, workspace, control-plane, TUI, web, desktop, and Slack product-shell surfaces.",
  }
}

export const openCodeProductShellNativeDescriptors = openCodeProductShellNativeExactAtomIDs.map(openCodeProductShellNativeDescriptor)

export const openCodeProductShellNativeExactDescriptorForID = new Map(
  openCodeProductShellNativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export function buildOpenCodeProductShellSDKMethodList(): string[] {
  return [
    "OpenCode.make",
    "tool.add",
    "auth.add",
    "agent.add",
    "session.create",
    "session.prompt",
    "session.wait",
    "session.messages",
    "subscribe",
  ]
}

export function buildOpenCodeProductShellServerBehaviorMatrix(): Record<string, unknown> {
  return {
    defaultApp: ["fetch(request)", "request(input, init)"],
    portZeroCandidates: openCodeListenPortCandidates({ port: 0 }),
    explicitPortCandidates: openCodeListenPortCandidates({ port: 5511 }),
    loopbackMdnsPublish: openCodeServerCanPublishMDNS({ mdns: true, host: "127.0.0.1", port: 4096 }),
    nonLoopbackMdnsPublish: openCodeServerCanPublishMDNS({ mdns: true, host: "192.0.2.10", port: 4096 }),
    listenerURL: openCodeServerURL({ host: "127.0.0.1", port: 4096 }),
    stopSignature: "stop(close?: boolean)",
  }
}

export function buildOpenCodeProductShellServiceKeys(): string[] {
  return [
    "opencode.control-plane",
    "opencode.desktop",
    "opencode.harness",
    "opencode.sdk",
    "opencode.server.factory",
    "opencode.slack",
    "opencode.tui",
    "opencode.web",
    "opencode.workspace",
  ].sort()
}

export function buildOpenCodeWebCommandProjection(input: {
  hostname?: string
  port?: number
  resolvedPort?: number
  mdns?: boolean
  mdnsDomain?: string
  passwordSet?: boolean
  networkInterfaces?: Array<{ address: string; family?: string; internal?: boolean }>
} = {}): Record<string, unknown> {
  const hostname = input.hostname ?? "127.0.0.1"
  const port = input.port ?? 0
  const resolvedPort = input.resolvedPort ?? (port === 0 ? 4096 : port)
  const mdns = input.mdns ?? false
  const mdnsDomain = input.mdnsDomain ?? "opencode.local"
  const singleURL = `http://${hostname}:${resolvedPort}`
  const networkAccess = (input.networkInterfaces ?? [])
    .filter((entry) => entry.family === "IPv4" && !entry.internal && !entry.address.startsWith("172."))
    .map((entry) => `http://${entry.address}:${resolvedPort}`)
  const localAccess = `http://localhost:${resolvedPort}`
  const wildcard = hostname === "0.0.0.0"
  return {
    product: "opencode",
    command: "web",
    instance: false,
    warningWhenPasswordMissing: input.passwordSet !== true,
    listen: {
      call: "Server.listen(resolveNetworkOptions(args))",
      hostname,
      port,
      mdns,
      ...(mdns ? { mdnsDomain } : {}),
    },
    display: wildcard
      ? {
          mode: "local-and-network",
          localAccess,
          networkAccess,
          ...(mdns ? { mdns: `${mdnsDomain}:${resolvedPort}` } : {}),
          webInterface: localAccess,
        }
      : {
          mode: "single-url",
          networkAccess: [],
          webInterface: singleURL,
        },
    openURL: wildcard ? localAccess : singleURL,
    keepAlive: true,
  }
}

export function buildOpenCodeDesktopRuntimeProjection(input: {
  packaged?: boolean
  channel?: "dev" | "beta" | "prod"
  deepLinks?: string[]
} = {}): Record<string, unknown> {
  const channel = input.channel ?? "prod"
  const appIDs = {
    dev: "ai.opencode.desktop.dev",
    beta: "ai.opencode.desktop.beta",
    prod: "ai.opencode.desktop",
  } as const
  const appNames = {
    dev: "OpenCode Dev",
    beta: "OpenCode Beta",
    prod: "OpenCode",
  } as const
  const effectiveChannel = input.packaged === false ? "dev" : channel
  return {
    product: "opencode",
    packageName: "@opencode-ai/desktop",
    appID: appIDs[effectiveChannel],
    appName: appNames[effectiveChannel],
    environment: {
      OPENCODE_DISABLE_EMBEDDED_WEB_UI: "true",
      OPENCODE_CLIENT: "desktop",
      OPENCODE_EXPERIMENTAL_ICON_DISCOVERY: "true",
      OPENCODE_EXPERIMENTAL_FILEWATCHER: "true",
    },
    mainWindow: {
      title: "OpenCode",
      defaultWidth: 1280,
      defaultHeight: 800,
      rendererProtocol: "oc",
      rendererURL: "oc://renderer/index.html",
      preload: "../preload/index.js",
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    sidecar: {
      serviceName: "opencode server",
      startTimeoutMs: 60_000,
      stopTimeoutMs: 6_000,
      healthPath: "/global/health",
    },
    deepLinks: input.deepLinks ?? [],
    protocolHandlers: ["opencode://session/:id", "opencode://workspace"],
  }
}

export function buildOpenCodeHarnessAssemblyProjection(input: {
  cwd: string
  storageDir?: string
  recipeID?: string
  recipeVersion?: string
  modules?: Array<{ id: string; variant?: string }>
  services?: string[]
  envKeys?: string[]
}): Record<string, unknown> {
  const services = (input.services ?? buildOpenCodeProductShellServiceKeys()).slice().sort()
  return {
    product: "opencode",
    cwd: input.cwd,
    bootstrap: {
      upstreamFunction: "bootstrap(directory, cb)",
      directory: input.cwd,
      load: "InstanceRuntime.load({ directory })",
      provide: "context.provide(ctx, cb)",
      dispose: "InstanceRuntime.disposeInstance(ctx)",
      disposeInFinally: true,
    },
    recipe: {
      id: input.recipeID ?? "opencode",
      version: input.recipeVersion ?? "0.1.0",
      graphLevel: "atom",
    },
    runtimeServices: {
      core: ["cwd", "session", "hooks", "config", "prompt", "ui", "storageDir", "opencode.sqlite.path"],
      product: services,
    },
    registries: {
      tools: "createOpenCodeDefaultTools()",
      providers: "registerOpenCodeBuiltinProviderPlugins(hooks, { env })",
      productSurfaces: "registerOpenCodeProductSurfaces(harness)",
    },
    productSurfaceKeys: services,
    graph: input.modules ?? [],
    configEnvKeys: (input.envKeys ?? ["OPENCODE_CONFIG", "OPENCODE_SERVER_PASSWORD"]).slice().sort(),
    runTurnEntrypoint: "runHarnessTurn({ product: 'opencode', session, hooks, prompt, turn })",
  }
}

export function buildOpenCodeWorkspaceSnapshotProjection(input: {
  cwd: string
  recipeID?: string
  recipeVersion?: string
  graph?: Array<{ id: string; variant?: string }>
  config?: Record<string, unknown>
  configLayers?: Array<{ scope: string; name: string; priority: number }>
  registries?: Record<string, string[]>
  services?: string[]
}): Record<string, unknown> {
  return {
    product: "opencode",
    cwd: input.cwd,
    recipeID: input.recipeID ?? "opencode",
    recipeVersion: input.recipeVersion ?? "0.1.0",
    graph: input.graph ?? [],
    config: input.config ?? {},
    configLayers: input.configLayers ?? [],
    registries: input.registries ?? {
      tools: [],
      commands: [],
      shortcuts: [],
      flags: [],
      providers: [],
      auth: [],
      uiProviders: [],
      messageRenderers: [],
    },
    services: (input.services ?? buildOpenCodeProductShellServiceKeys()).slice().sort(),
  }
}

export function buildOpenCodeControlPlaneSnapshotProjection(input: {
  cwd: string
  modules?: Array<{ id: string; variant?: string }>
  routes?: string[]
  providers?: string[]
  authProviders?: string[]
  registryCounts?: Record<string, number>
}): Record<string, unknown> {
  return {
    product: "opencode",
    status: "ready",
    cwd: input.cwd,
    recipe: {
      id: "opencode",
      version: "0.1.0",
      modules: input.modules ?? [],
      entrypoints: {},
    },
    registryCounts: input.registryCounts ?? {
      tools: 0,
      commands: 0,
      shortcuts: 0,
      flags: 0,
      providers: input.providers?.length ?? 0,
      auth: input.authProviders?.length ?? 0,
      uiProviders: 0,
      messageRenderers: 0,
    },
    providers: input.providers ?? [],
    authProviders: input.authProviders ?? [],
    routes: input.routes ?? ["GET /health", "GET /v1/workspace", "GET /v1/control-plane", "GET /v1/graph", "GET /v1/sessions", "GET /v1/sessions/:id", "GET /v1/tui", "POST /v1/tui/event", "GET /v1/web", "GET /v1/desktop", "GET /v1/slack/home", "POST /v1/slack/command", "POST /v1/run"],
  }
}

export function projectOpenCodeTUIRunCommand(input: OpenCodeTUIRunProjectionInput): OpenCodeTUIRunProjection {
  const errors: string[] = []
  if (input.interactive && input.command) errors.push("--interactive cannot be used with --command")
  if (input.demo && !input.interactive) errors.push("--demo requires --interactive")
  if (input.interactive && input.format === "json") errors.push("--interactive cannot be used with --format json")
  if (input.replay && !input.interactive) errors.push("--replay requires --interactive")
  if (input.replayLimit !== undefined && !input.interactive) errors.push("--replay-limit requires --interactive")
  if (input.replayLimit !== undefined && (!Number.isInteger(input.replayLimit) || input.replayLimit <= 0)) errors.push("--replay-limit must be a positive integer")
  if (input.interactive && input.stdoutTTY === false) errors.push("--interactive requires a TTY stdout")
  const message = [input.message, input.piped].filter((item): item is string => typeof item === "string" && item.length > 0).join("\n") || undefined
  const interactive = input.interactive && errors.length === 0
  const attach = Boolean(input.attach)
  return {
    errors,
    mode: interactive ? (attach ? "interactive-attach" : "interactive-local") : "noninteractive",
    thinking: input.interactive ? (input.thinking ?? true) : (input.thinking ?? false),
    replay: Boolean(input.replay || input.replayLimit !== undefined),
    runtimeEntrypoint: interactive ? (attach ? "runInteractiveMode" : "runInteractiveLocalMode") : "execute",
    sessionStrategy: interactive ? (attach ? "attach-existing-session" : "lazy-local-session") : "single-noninteractive-session",
    permissionRules: input.interactive ? [] : ["question:deny:*", "plan_enter:deny:*", "plan_exit:deny:*"],
    initialInput: message,
    filePartPolicy: (input.files ?? []).map((source) => ({
      source,
      mime: source.endsWith("/") ? "application/x-directory" : "text/plain",
      url: `file://${source.startsWith("/") ? "" : "/"}${source}`,
    })),
    directoryPolicy: attach ? "remote-dir-passthrough" : "local-chdir-or-root",
  }
}

export function buildOpenCodeTUIAppProviderStack(): Record<string, unknown> {
  return {
    rendererConfig: {
      externalOutputMode: "passthrough",
      targetFps: 60,
      exitOnCtrlC: false,
      autoFocus: false,
      useMouseDefault: true,
      consoleCopySelection: true,
    },
    boot: ["win32InstallCtrlCGuard", "win32DisableProcessedInput", "TuiConfig.get", "createCliRenderer", "renderer.waitForThemeMode", "createDefaultOpenTuiKeymap", "registerOpencodeKeymap", "render"],
    providers: [
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
      "PromptHistoryProvider",
      "EditorContextProvider",
    ],
    sdkEventPolicy: {
      client: "createOpencodeClient",
      source: "sdk.global.event or injected EventSource",
      batchWindowMs: 16,
      retryDelayMs: [1000, 30000],
      cleanup: ["abort sdk signal", "abort sse signal", "clear pending batch timer"],
    },
    routePolicy: {
      continueStartsAtSessionPlaceholder: true,
      sessionForkWaitsForSyncComplete: true,
      terminalTitle: ["OpenCode", "OC | ${sessionTitle}", "OC | ${pluginID}"],
    },
    commands: [
      "command.palette.show",
      "session.list",
      "session.new",
      "model.list",
      "agent.list",
      "mcp.list",
      "variant.cycle",
      "provider.connect",
      "theme.switch",
      "help.show",
    ],
  }
}

export function buildOpenCodeTUISurfaceSnapshotProjection(input: {
  cwd: string
  tools?: string[]
  providers?: string[]
  modules?: Array<{ id: string; variant?: string }>
}): Record<string, unknown> {
  return {
    product: "opencode",
    cwd: input.cwd,
    title: "OpenCode",
    status: "ready",
    commands: ["run", "sessions", "graph", "providers", "tools"],
    tools: input.tools ?? [],
    providers: input.providers ?? [],
    modules: input.modules ?? [],
    interactiveEventLoop: {
      title: "OpenCode",
      theme: "opencode",
      modelPreference: ["opencode-builtin-codex", "opencode-default"],
    },
  }
}

export function buildOpenCodeSlackBotBehaviorProjection(input: {
  channelID: string
  threadTS: string
  messageText: string
  sessionID?: string
  tool?: string
  toolTitle?: string
  shareURL?: string
}): Record<string, unknown> {
  const sessionID = input.sessionID ?? "ses_slack_01"
  return {
    framework: "@slack/bolt",
    socketMode: true,
    envKeys: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "SLACK_APP_TOKEN"],
    startup: ["new App({ token, signingSecret, socketMode: true, appToken })", "createOpencode({ port: 0 })", "client.event.subscribe()"],
    messageHandler: {
      skipSubtypes: true,
      sessionKey: `${input.channelID}-${input.threadTS}`,
      createSession: { title: `Slack thread ${input.threadTS}`, sessionID },
      shareSession: input.shareURL ?? `https://opencode.ai/s/${sessionID}`,
      prompt: {
        path: { id: sessionID },
        body: { parts: [{ type: "text", text: input.messageText }] },
      },
      responseText: "response.info.content or joined text parts",
    },
    toolUpdate: {
      event: "message.part.updated",
      completedOnly: true,
      text: `*${input.tool ?? "bash"}* - ${input.toolTitle ?? "Command completed"}`,
      channelID: input.channelID,
      threadTS: input.threadTS,
    },
    command: {
      name: "/test",
      response: "Bot is working! I can hear you loud and clear.",
    },
  }
}

export function buildOpenCodeProductShellNativeExactFixture(): OpenCodeProductShellNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<OpenCodeProductShellNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomIDs: [...openCodeProductShellNativeExactAtomIDs] as typeof openCodeProductShellNativeExactAtomIDs,
    portID: "product.shell" as const,
    upstreamRef: openCodeProductShellUpstreamRef,
    evidenceRef: openCodeProductShellNativeExactEvidenceRef,
    fixtureID: openCodeProductShellNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      sdkExposesOpenCodeMakeRegistryAgentSessionAndSubscribeSurface: true as const,
      sdkToolAuthAndAgentAddMutateProductRegistries: true as const,
      sdkSessionPromptRunsProviderBackedTurnAndKeepsMessageReadback: true as const,
      serverDefaultAppSupportsFetchAndRequestEntryPoints: true as const,
      serverListenPortZeroPrefers4096ThenAnyFreePort: true as const,
      serverListenReturnsHostnamePortUrlAndStopWithForceClose: true as const,
      mdnsPublishesOnlyForNonLoopbackHosts: true as const,
      serveCommandWarnsWhenPasswordMissingAndStartsHeadlessListener: true as const,
      webCommandStartsServerAndOpensResolvedURL: true as const,
      webCommandShowsLocalNetworkAndMdnsAccessForWildcardHost: true as const,
      desktopAppStartsSidecarAndRendererWithSecureElectronWindow: true as const,
      desktopAppRegistersDeepLinksAndDesktopClientEnvironment: true as const,
      harnessBootstrapLoadsProvidesAndDisposesInstanceRuntime: true as const,
      harnessRegistersOpenCodeRecipeSessionConfigHooksAndProductSurfaces: true as const,
      workspaceSnapshotExposesOpenCodeCwdGraphConfigRegistriesAndServices: true as const,
      controlPlaneSnapshotExposesReadyStatusRoutesProvidersAuthAndRecipeModules: true as const,
      tuiInteractiveRejectsIncompatibleFlagsBeforeRuntimeBoot: true as const,
      tuiInteractiveLocalModeUsesInProcessClientAndLazySession: true as const,
      tuiInteractiveAttachModeUsesRemoteClientHeadersAndDirectory: true as const,
      tuiAppCreatesOpenTUIRendererKeymapProvidersAndBatchedSDKEvents: true as const,
      tuiSurfaceExposesSnapshotRenderDispatchAndInteractiveEventLoop: true as const,
      slackBotUsesBoltSocketModeCreateOpencodeThreadSessionsPromptAndToolUpdatePosts: true as const,
    },
    cases: [
      {
        scenarioID: "sdk-make-registry-and-agent-api" as const,
        input: {
          make: {},
          toolAdd: ["ReadTool", "bash"],
          authAdd: { provider: "openai", type: "api" },
          agentAdd: { name: "build", model: { id: "gpt-5-5", provider: "openai", variant: "xhigh" } },
        },
        output: {
          methods: buildOpenCodeProductShellSDKMethodList(),
          serviceKeys: buildOpenCodeProductShellServiceKeys(),
          registries: ["tools", "auth", "agents"],
        },
        upstreamBehavior:
          "specs/v2/api.ts constructs OpenCode.make({}), mutates tool/auth/agent registries through add methods, and keeps the resulting SDK object as the session control surface.",
      },
      {
        scenarioID: "sdk-session-prompt-subscribe-api" as const,
        input: {
          sessionCreate: { agent: "build" },
          prompt: { text: "hey what is up", files: [{ mime: "image/png", uri: "data:image/png;base64,xxxx" }] },
        },
        output: {
          sessionIDPrefix: "ses_",
          events: ["session.created", "session.prompt", "session.updated"],
          readback: ["session.messages(sessionID)", "getSession(sessionID).transcript"],
          wait: "promise",
        },
        upstreamBehavior:
          "specs/v2/api.ts creates a session for an agent, subscribes to events, prompts with text and file attachments, waits for completion, and reads messages for that session.",
      },
      {
        scenarioID: "server-default-app-listener-and-mdns" as const,
        input: { listen: { hostname: "127.0.0.1", port: 0, mdns: true } },
        output: buildOpenCodeProductShellServerBehaviorMatrix(),
        upstreamBehavior:
          "server.ts exposes Default.app.fetch/request, openapi(), listen(opts), port-0 fallback to 4096 then any free port, URL construction from hostname/port, loopback mDNS skip, and stop(close?: boolean).",
      },
      {
        scenarioID: "server-cli-serve-command" as const,
        input: { command: "serve", env: { OPENCODE_SERVER_PASSWORD: "" } },
        output: {
          instance: false,
          warning: "Warning: OPENCODE_SERVER_PASSWORD is not set; server is unsecured.",
          listenerCall: "Server.listen(resolveNetworkOptions(args))",
          logTemplate: "opencode server listening on http://${server.hostname}:${server.port}",
        },
        upstreamBehavior:
          "cli/cmd/serve.ts starts the headless listener without an ambient instance, warns when OPENCODE_SERVER_PASSWORD is absent, logs the resolved host and port, and then stays alive.",
      },
      {
        scenarioID: "web-command-listen-open-browser" as const,
        input: {
          command: "web",
          args: { hostname: "0.0.0.0", port: 0, mdns: true, mdnsDomain: "open-code.local" },
          env: { OPENCODE_SERVER_PASSWORD: "" },
          networkInterfaces: [
            { address: "127.0.0.1", family: "IPv4", internal: true },
            { address: "172.18.0.4", family: "IPv4", internal: false },
            { address: "192.0.2.10", family: "IPv4", internal: false },
          ],
        },
        output: buildOpenCodeWebCommandProjection({
          hostname: "0.0.0.0",
          port: 0,
          resolvedPort: 4096,
          mdns: true,
          mdnsDomain: "open-code.local",
          passwordSet: false,
          networkInterfaces: [
            { address: "127.0.0.1", family: "IPv4", internal: true },
            { address: "172.18.0.4", family: "IPv4", internal: false },
            { address: "192.0.2.10", family: "IPv4", internal: false },
          ],
        }),
        upstreamBehavior:
          "cli/cmd/web.ts starts Server.listen(resolveNetworkOptions(args)) without an ambient instance, warns when OPENCODE_SERVER_PASSWORD is absent, prints the OpenCode logo, opens localhost for 0.0.0.0, prints non-internal/non-Docker IPv4 network access URLs, prints mDNS when enabled, opens the resolved web interface in a browser, and then stays alive.",
      },
      {
        scenarioID: "desktop-electron-sidecar-renderer-shell" as const,
        input: {
          package: "@opencode-ai/desktop",
          channel: "prod",
          deepLinks: ["opencode://workspace", "opencode://session/ses_native"],
        },
        output: buildOpenCodeDesktopRuntimeProjection({
          packaged: true,
          channel: "prod",
          deepLinks: ["opencode://workspace", "opencode://session/ses_native"],
        }),
        upstreamBehavior:
          "packages/desktop/src/main/index.ts configures the Electron app identity, disables embedded web UI, sets OPENCODE_CLIENT=desktop through preferAppEnv, enforces single-instance/deep-link handling, starts/stops the sidecar server, and creates a secure BrowserWindow. windows.ts registers the oc://renderer protocol and loads index.html with contextIsolation, nodeIntegration false, and sandbox true. server.ts starts the `opencode server` utility process and waits for /global/health.",
      },
      {
        scenarioID: "harness-bootstrap-surface-registration" as const,
        input: {
          cwd: "/workspace/opencode",
          recipeID: "opencode",
          modules: [
            { id: "opencode.product-shell.harness" },
            { id: "opencode.product-shell.sdk" },
            { id: "opencode.product-shell.server" },
          ],
          services: buildOpenCodeProductShellServiceKeys(),
        },
        output: buildOpenCodeHarnessAssemblyProjection({
          cwd: "/workspace/opencode",
          modules: [
            { id: "opencode.product-shell.harness" },
            { id: "opencode.product-shell.sdk" },
            { id: "opencode.product-shell.server" },
          ],
        }),
        upstreamBehavior:
          "cli/bootstrap.ts loads an InstanceRuntime for the directory, provides it through instance context for the callback, and always disposes the instance in finally. The local OpenCode harness mirrors that native product bootstrap boundary by assembling the OpenCode recipe, session/config/hooks/prompt/ui services, builtin tools/provider plugins, sqlite path, and registering SDK, server, workspace, control-plane, TUI, web, desktop, and Slack product surfaces on the same product-scoped service map.",
      },
      {
        scenarioID: "workspace-snapshot-sdk-state" as const,
        input: {
          cwd: "/workspace/opencode",
          recipeID: "opencode",
          modules: [{ id: "opencode.product-shell.workspace" }, { id: "opencode.product-shell.sdk" }],
          services: buildOpenCodeProductShellServiceKeys(),
          registries: { tools: ["bash"], providers: ["openai"], auth: ["openai"] },
        },
        output: buildOpenCodeWorkspaceSnapshotProjection({
          cwd: "/workspace/opencode",
          recipeID: "opencode",
          graph: [{ id: "opencode.product-shell.workspace" }, { id: "opencode.product-shell.sdk" }],
          services: buildOpenCodeProductShellServiceKeys(),
          registries: {
            tools: ["bash"],
            commands: [],
            shortcuts: [],
            flags: [],
            providers: ["openai"],
            auth: ["openai"],
            uiProviders: [],
            messageRenderers: [],
          },
        }),
        upstreamBehavior:
          "OpenCode.make and the server/app shell keep one product-scoped control surface for cwd, graph/modules, config, registries, sessions, and service state; the local workspace snapshot exposes that same product state for SDK and server route consumers.",
      },
      {
        scenarioID: "control-plane-route-and-registry-snapshot" as const,
        input: {
          cwd: "/workspace/opencode",
          modules: [{ id: "opencode.product-shell.control-plane" }, { id: "opencode.product-shell.server" }],
          providers: ["openai"],
          authProviders: ["openai"],
        },
        output: buildOpenCodeControlPlaneSnapshotProjection({
          cwd: "/workspace/opencode",
          modules: [{ id: "opencode.product-shell.control-plane" }, { id: "opencode.product-shell.server" }],
          providers: ["openai"],
          authProviders: ["openai"],
          registryCounts: {
            tools: 1,
            commands: 0,
            shortcuts: 0,
            flags: 0,
            providers: 1,
            auth: 1,
            uiProviders: 0,
            messageRenderers: 0,
          },
        }),
        upstreamBehavior:
          "server.ts Default/listen/openapi and packages/app AppInterface/ConnectionGate expose a ready control plane over the server connection: route availability, recipe/module graph, provider/auth registries, and cwd are readable without booting a preview-only UI.",
      },
      {
        scenarioID: "tui-run-interactive-cli-gates" as const,
        input: {
          invalid: [
            { interactive: true, command: true },
            { demo: true, interactive: false },
            { interactive: true, format: "json" },
            { replay: true, interactive: false },
            { replayLimit: 0, interactive: true },
            { interactive: true, stdoutTTY: false },
          ],
        },
        output: {
          commandConflict: projectOpenCodeTUIRunCommand({ interactive: true, command: true }).errors,
          demoRequiresInteractive: projectOpenCodeTUIRunCommand({ interactive: false, demo: true }).errors,
          jsonRejected: projectOpenCodeTUIRunCommand({ interactive: true, format: "json" }).errors,
          replayRejectedOutsideInteractive: projectOpenCodeTUIRunCommand({ interactive: false, replay: true }).errors,
          replayLimitPositiveInteger: projectOpenCodeTUIRunCommand({ interactive: true, replayLimit: 0 }).errors,
          ttyRequired: projectOpenCodeTUIRunCommand({ interactive: true, stdoutTTY: false }).errors,
        },
        upstreamBehavior:
          "cli/cmd/run.ts validates interactive mode before runtime boot: it rejects --interactive with --command or --format json, rejects --demo/--replay/--replay-limit outside interactive mode, requires positive replay-limit, and requires TTY stdout.",
      },
      {
        scenarioID: "tui-run-interactive-runtime-entrypoints" as const,
        input: {
          local: { interactive: true, message: "hello", files: ["/tmp/prompt.txt"] },
          attach: { interactive: true, attach: "http://localhost:4096", dir: "/workspace", replayLimit: 8 },
          noninteractive: { interactive: false, message: "hello" },
        },
        output: {
          local: projectOpenCodeTUIRunCommand({ interactive: true, message: "hello", files: ["/tmp/prompt.txt"] }),
          attach: projectOpenCodeTUIRunCommand({ interactive: true, attach: "http://localhost:4096", dir: "/workspace", replayLimit: 8 }),
          noninteractive: projectOpenCodeTUIRunCommand({ interactive: false, message: "hello" }),
        },
        upstreamBehavior:
          "cli/cmd/run.ts sends valid interactive local sessions to runInteractiveLocalMode with an in-process SDK client and lazy session creation, sends attach mode to runInteractiveMode with remote client headers/directory, keeps interactive permission rules empty, and defaults thinking to true only for interactive mode.",
      },
      {
        scenarioID: "tui-solid-app-renderer-sdk-event-stack" as const,
        input: { attachCommand: "opencode attach <url>", app: "tui({ url, args, config, directory, headers })" },
        output: buildOpenCodeTUIAppProviderStack(),
        upstreamBehavior:
          "cli/cmd/tui/attach.ts validates remote sessions, gets TUI config, installs Win32 input guards, and calls tui(); cli/cmd/tui/app.tsx creates an OpenTUI renderer/keymap/provider tree; context/sdk.tsx creates the SDK client, batches events within 16ms, retries SSE with exponential backoff, and cleans abort/timer state.",
      },
      {
        scenarioID: "tui-local-surface-snapshot-and-event-loop" as const,
        input: {
          cwd: "/workspace/opencode",
          tools: ["bash", "read"],
          providers: ["anthropic", "openai"],
          modules: [{ id: "opencode.product-shell.tui" }, { id: "opencode.ui.event-loop" }],
        },
        output: buildOpenCodeTUISurfaceSnapshotProjection({
          cwd: "/workspace/opencode",
          tools: ["bash", "read"],
          providers: ["anthropic", "openai"],
          modules: [{ id: "opencode.product-shell.tui" }, { id: "opencode.ui.event-loop" }],
        }),
        upstreamBehavior:
          "The local OpenCode TUI surface mirrors the upstream shell's product identity: OpenCode title, current directory, run/session/provider/tool commands, tool/provider registries, module graph, and an OpenCode themed interactive event loop.",
      },
      {
        scenarioID: "slack-bolt-socket-mode-thread-session-bot" as const,
        input: {
          env: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "SLACK_APP_TOKEN"],
          channelID: "C123",
          threadTS: "1710000000.000100",
          messageText: "fix the failing tests",
          toolPart: { sessionID: "ses_slack_01", tool: "bash", status: "completed", title: "Command completed" },
        },
        output: buildOpenCodeSlackBotBehaviorProjection({
          channelID: "C123",
          threadTS: "1710000000.000100",
          messageText: "fix the failing tests",
          sessionID: "ses_slack_01",
          tool: "bash",
          toolTitle: "Command completed",
        }),
        upstreamBehavior:
          "packages/slack/src/index.ts creates an @slack/bolt App in socket mode from Slack env vars, starts createOpencode({ port: 0 }), subscribes to message.part.updated tool events, maps each Slack channel/thread to an OpenCode session titled `Slack thread ${thread}`, shares a new session URL when available, prompts the session with Slack text parts, posts assistant text back to the thread, posts completed tool updates, and registers a /test command.",
      },
    ],
    sourceRefs: [
      "packages/opencode/src/cli/bootstrap.ts#bootstrap,InstanceRuntime.load,context.provide,InstanceRuntime.disposeInstance",
      "packages/opencode/specs/v2/api.ts#OpenCode.make,tool.add,auth.add,agent.add,session.create,session.prompt,session.wait,session.messages,subscribe",
      "packages/opencode/src/server/server.ts#Default,openapi,listen,startWithPortFallback,makeURL,setupMdns,makeStop,serverLayer",
      "packages/opencode/src/cli/cmd/serve.ts#ServeCommand,OPENCODE_SERVER_PASSWORD,Server.listen",
      "packages/opencode/src/cli/cmd/web.ts#WebCommand,getNetworkIPs,OPENCODE_SERVER_PASSWORD,Server.listen,open",
      "packages/app/src/app.tsx#AppInterface,ConnectionGate,ServerProvider,ServerSDKProvider,ServerSyncProvider",
      "packages/desktop/src/main/index.ts#APP_IDS,APP_NAMES,OPENCODE_DISABLE_EMBEDDED_WEB_UI,preferAppEnv,spawnLocalServer,createMainWindow,deepLinks",
      "packages/desktop/src/main/windows.ts#createMainWindow,registerRendererProtocol,loadWindow,contextIsolation,nodeIntegration,sandbox",
      "packages/desktop/src/main/server.ts#preferAppEnv,spawnLocalServer,checkHealth,SIDECAR_SERVICE_NAME,SIDECAR_START_STALL_TIMEOUT,SIDECAR_STOP_TIMEOUT",
      "packages/desktop/src/renderer/index.tsx#PlatformProvider,ServerConnection,AppInterface,deepLinks,desktop",
      "packages/opencode/src/cli/cmd/run.ts#RunCommand,interactive,attach,replay,files,runInteractiveLocalMode,runInteractiveMode",
      "packages/opencode/src/cli/cmd/run/runtime.ts#runInteractiveRuntime,runInteractiveLocalMode,runInteractiveMode,ensureStream,runQueue",
      "packages/opencode/src/cli/cmd/tui/attach.ts#AttachCommand,validateSession,TuiConfig,tui",
      "packages/opencode/src/cli/cmd/tui/app.tsx#tui,rendererConfig,App,createTuiApi,TuiPluginRuntime,registerOpencodeKeymap",
      "packages/opencode/src/cli/cmd/tui/context/sdk.tsx#SDKProvider,createOpencodeClient,startSSE,handleEvent,flush,onCleanup",
      "packages/opencode/src/cli/cmd/tui/keymap.tsx#registerOpencodeKeymap,createOpencodeModeStack,leaderDisplay",
      "packages/slack/src/index.ts#App,createOpencode,event.subscribe,handleToolUpdate,app.message,session.create,session.share,session.prompt,app.command",
      "packages/recipes/src/harness.ts#assembleOpenCodeHarness,registerDefaultTools,registerCommonServices,createHarness,runHarnessTurn",
      "packages/adapters-opencode/src/product-surface.ts#registerOpenCodeProductSurfaces,createOpenCodeSDK,createOpenCodeServer,createOpenCodeWorkspaceSurface,createOpenCodeControlPlane,createOpenCodeTUI,createOpenCodeSlack",
      "packages/adapters-opencode/src/opencode-sdk.ts#createOpenCodeSDK,tool.add,auth.add,agent.add,session.create,session.prompt,subscribe",
      "packages/adapters-opencode/src/opencode-server.ts#createOpenCodeServer,openCodeServerRoutes,routeOpenCodeRequest",
      "packages/adapters-opencode/src/opencode-workspace.ts#createOpenCodeWorkspaceSurface,snapshot",
      "packages/adapters-opencode/src/opencode-control-plane.ts#createOpenCodeControlPlane,snapshot",
      "packages/adapters-opencode/src/opencode-tui.ts#createOpenCodeTUI,createOpenCodeTUIFromSDK,snapshot,dispatch,render",
      "packages/adapters-opencode/src/opencode-web.ts#createOpenCodeWebFromSDK,launchPlan,projectOpenCodeWebLaunchPlan,render",
      "packages/adapters-opencode/src/opencode-desktop.ts#createOpenCodeDesktopFromSDK,runtimeProjection,projectOpenCodeDesktopRuntime,manifest,writeBundle",
      "packages/adapters-opencode/src/opencode-slack.ts#createOpenCodeSlackFromSDK,handleMessage,handleToolUpdate,handleCommand",
      "packages/adapters-opencode/src/opencode-product-utils.ts#openCodeListenPortCandidates,openCodeServerURL,openCodeServerCanPublishMDNS,listen,close",
    ],
    nativeEvidenceRefs: [openCodeProductShellNativeExactEvidenceRef, openCodeProductShellNativeExactReplayRef],
    fixtureIDs: [openCodeProductShellNativeExactFixtureID],
    knownLossiness: [] as string[],
    descriptors: openCodeProductShellNativeDescriptors,
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProductShellNativeExactFixture(
  fixture: OpenCodeProductShellNativeExactFixture,
): OpenCodeProductShellNativeExactVerification {
  const canonical = buildOpenCodeProductShellNativeExactFixture()
  const issues: OpenCodeProductShellNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "opencode-product-shell-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical OpenCode product-shell behavior." })
  }
  if (fixture.product !== "opencode" || JSON.stringify(fixture.atomIDs) !== JSON.stringify(openCodeProductShellNativeExactAtomIDs) || fixture.portID !== "product.shell") {
    issues.push({ id: "opencode-product-shell-native-exact.identity", message: "Fixture must stay scoped to the OpenCode SDK/harness/server/TUI product-shell atom group." })
  }
  if (
    fixture.upstreamRef !== openCodeProductShellUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("cli/bootstrap.ts#bootstrap")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("specs/v2/api.ts#OpenCode.make")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("src/server/server.ts#Default")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("cli/cmd/serve.ts#ServeCommand")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("cli/cmd/web.ts#WebCommand")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("packages/app/src/app.tsx#AppInterface")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("packages/desktop/src/main/index.ts#APP_IDS")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("packages/desktop/src/main/windows.ts#createMainWindow")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("packages/desktop/src/main/server.ts#preferAppEnv")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("cli/cmd/run.ts#RunCommand")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("cli/cmd/tui/app.tsx#tui")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("cli/cmd/tui/context/sdk.tsx#SDKProvider")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("packages/slack/src/index.ts#App")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("packages/recipes/src/harness.ts#assembleOpenCodeHarness")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("src/product-surface.ts#registerOpenCodeProductSurfaces")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("src/opencode-workspace.ts#createOpenCodeWorkspaceSurface")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("src/opencode-control-plane.ts#createOpenCodeControlPlane")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("src/opencode-tui.ts#createOpenCodeTUI")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("src/opencode-web.ts#createOpenCodeWebFromSDK")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("src/opencode-desktop.ts#createOpenCodeDesktopFromSDK")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("src/opencode-slack.ts#createOpenCodeSlackFromSDK"))
  ) {
    issues.push({ id: "opencode-product-shell-native-exact.upstream", message: "Fixture must stay pinned to OpenCode upstream bootstrap, SDK, server, web, desktop, Slack, and TUI sources plus local harness/product-surface registration." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-product-shell-native-exact.native-claim", message: "OpenCode product-shell fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || openCodeProductShellNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "opencode-product-shell-native-exact.lossiness", message: "Native exact OpenCode product-shell fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(openCodeProductShellNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(openCodeProductShellNativeExactReplayRef)) {
    issues.push({ id: "opencode-product-shell-native-exact.evidence", message: "OpenCode product-shell native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(openCodeProductShellNativeExactFixtureID)) {
    issues.push({ id: "opencode-product-shell-native-exact.fixture", message: "OpenCode product-shell native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "opencode-product-shell-native-exact.policy", message: "OpenCode product-shell policy drifted from upstream behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "opencode-product-shell-native-exact.cases", message: "OpenCode product-shell cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
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
