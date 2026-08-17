import type { LegoMessage, LegoModel, LegoProviderAdapter, LegoRecipe, SessionID } from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { SessionInfo, SessionService } from "@helix/lego-session"
import type { TUIEventLoopResult, TUIEventLoopSnapshot, TUIInputEvent } from "@helix/lego-ui"

export interface OpenCodeSurfaceHarness {
  product: "opencode"
  recipe: LegoRecipe
  reference: Record<string, unknown>
  session: SessionService
  hooks: LegoHookHost
  config?: {
    merge(): { values: Record<string, unknown>; layers: Array<{ scope: string; name: string; priority: number; values: Record<string, unknown> }> }
  }
  graph: Array<{ id: string; variant?: string }>
  runTurn(input: OpenCodeRunTurnInput): Promise<OpenCodeRunTurnResult>
}

export interface OpenCodeRunTurnInput {
  sessionID?: SessionID
  text: string
  provider: LegoProviderAdapter
  model?: LegoModel
  maxSteps?: number
  maxRetries?: number
  syntheticContinue?: boolean
  maxSyntheticContinues?: number
}

export interface OpenCodeRunTurnResult {
  session: SessionInfo
  userMessage: LegoMessage
  assistantMessage: LegoMessage
  transcript: LegoMessage[]
  blockedTools: Array<{ toolName: string; reason?: string }>
  steps: number
  finish?: string
  usage?: unknown
  cost?: number
  retries?: number
  error?: unknown
  syntheticContinues?: number
}

export interface OpenCodeSDKToolDefinition {
  name: string
  description?: string
  schema?: unknown
  parameters?: unknown
  execute?: (input: Record<string, unknown>, ctx: Record<string, unknown>) => unknown | Promise<unknown>
}

export interface OpenCodeSDKAuthRegistration {
  provider: string
  type: string
  value?: unknown
  [key: string]: unknown
}

export interface OpenCodeSDKAgentRegistration {
  name: string
  permissions?: unknown[]
  model?: {
    id: string
    provider: string
    variant?: string
  }
  [key: string]: unknown
}

export interface OpenCodeSDKSessionCreateInput {
  agent?: string
  title?: string
  cwd?: string
  metadata?: Record<string, unknown>
}

export interface OpenCodeSDKSessionPromptInput {
  sessionID: SessionID
  text: string
  files?: Array<{ mime: string; uri: string }>
  provider?: LegoProviderAdapter
  model?: LegoModel
  maxSteps?: number
  maxRetries?: number
  syntheticContinue?: boolean
  maxSyntheticContinues?: number
}

export interface OpenCodeSDKEvent {
  type: string
  [key: string]: unknown
}

export interface OpenCodeSDKRegistryFacade<TRegistration> {
  add(registration: TRegistration): void
  list(): string[]
}

export interface OpenCodeSDKSessionFacade {
  create(input?: OpenCodeSDKSessionCreateInput): Promise<SessionID>
  prompt(input: OpenCodeSDKSessionPromptInput): Promise<OpenCodeRunTurnResult>
  wait(): Promise<void>
  messages(sessionID: SessionID): Promise<LegoMessage[]>
}

export interface OpenCodeSDK {
  readonly kind: "opencode-sdk"
  readonly tool: OpenCodeSDKRegistryFacade<OpenCodeSDKToolDefinition>
  readonly auth: OpenCodeSDKRegistryFacade<OpenCodeSDKAuthRegistration>
  readonly agent: OpenCodeSDKRegistryFacade<OpenCodeSDKAgentRegistration>
  readonly session: OpenCodeSDKSessionFacade
  subscribe(listener: (event: OpenCodeSDKEvent) => void): () => void
  workspace(): OpenCodeWorkspaceSnapshot
  controlPlane(): OpenCodeControlPlaneSnapshot
  graph(): Array<{ id: string; variant?: string }>
  listSessions(input?: { cwd?: string }): Promise<SessionInfo[]>
  getSession(sessionID: SessionID): Promise<{ session: SessionInfo; transcript: LegoMessage[] }>
  runTurn(input: OpenCodeRunTurnInput): Promise<OpenCodeRunTurnResult>
}

export interface OpenCodeWorkspaceSurface {
  readonly kind: "opencode-workspace"
  snapshot(): OpenCodeWorkspaceSnapshot
}

export interface OpenCodeWorkspaceSnapshot {
  product: "opencode"
  cwd: string
  recipeID: string
  recipeVersion: string
  reference: Record<string, unknown>
  graph: Array<{ id: string; variant?: string }>
  config: Record<string, unknown>
  configLayers: Array<{ scope: string; name: string; priority: number }>
  registries: Record<"tools" | "commands" | "shortcuts" | "flags" | "providers" | "auth" | "uiProviders" | "messageRenderers", string[]>
  services: string[]
}

export interface OpenCodeControlPlane {
  readonly kind: "opencode-control-plane"
  snapshot(): OpenCodeControlPlaneSnapshot
}

export interface OpenCodeControlPlaneSnapshot {
  product: "opencode"
  status: "ready"
  cwd: string
  recipe: {
    id: string
    version: string
    modules: Array<{ id: string; variant?: string }>
    entrypoints: Record<string, string>
  }
  registryCounts: Record<string, number>
  providers: string[]
  authProviders: string[]
  routes: string[]
}

export interface OpenCodeServer {
  readonly kind: "opencode-server"
  readonly routes: string[]
  listen(input?: { port?: number; host?: string }): Promise<{ url: string; port: number; host: string }>
  close(force?: boolean): Promise<void>
}

export interface OpenCodeTUISurface {
  readonly kind: "opencode-tui"
  snapshot(): OpenCodeTUISnapshot
  interactiveSnapshot(): TUIEventLoopSnapshot
  dispatch(event: TUIInputEvent): TUIEventLoopResult
  render(input?: { width?: number }): string
}

export interface OpenCodeTUISnapshot {
  product: "opencode"
  cwd: string
  title: string
  status: "ready"
  commands: string[]
  tools: string[]
  providers: string[]
  modules: Array<{ id: string; variant?: string }>
}

export interface OpenCodeWebLaunchPlan {
  product: "opencode"
  command: "web"
  instance: false
  warningWhenPasswordMissing: boolean
  listen: {
    call: "Server.listen(resolveNetworkOptions(args))"
    hostname: string
    port: number
    mdns: boolean
    mdnsDomain?: string
  }
  display: {
    mode: "local-and-network" | "single-url"
    localAccess?: string
    networkAccess: string[]
    mdns?: string
    webInterface: string
  }
  openURL: string
  keepAlive: true
}

export interface OpenCodeWebSurface {
  readonly kind: "opencode-web"
  launchPlan(input?: {
    hostname?: string
    port?: number
    resolvedPort?: number
    mdns?: boolean
    mdnsDomain?: string
    passwordSet?: boolean
    networkInterfaces?: Array<{ address: string; family?: string; internal?: boolean }>
  }): OpenCodeWebLaunchPlan
  render(input?: { title?: string }): string
  write(input: { outDir: string; fileName?: string; title?: string }): string
}

export interface OpenCodeDesktopRuntimeProjection {
  product: "opencode"
  packageName: "@opencode-ai/desktop"
  appID: "ai.opencode.desktop" | "ai.opencode.desktop.beta" | "ai.opencode.desktop.dev"
  appName: "OpenCode" | "OpenCode Beta" | "OpenCode Dev"
  environment: {
    OPENCODE_DISABLE_EMBEDDED_WEB_UI: "true"
    OPENCODE_CLIENT: "desktop"
    OPENCODE_EXPERIMENTAL_ICON_DISCOVERY: "true"
    OPENCODE_EXPERIMENTAL_FILEWATCHER: "true"
  }
  mainWindow: {
    title: "OpenCode"
    defaultWidth: 1280
    defaultHeight: 800
    rendererProtocol: "oc"
    rendererURL: "oc://renderer/index.html"
    preload: "../preload/index.js"
    contextIsolation: true
    nodeIntegration: false
    sandbox: true
  }
  sidecar: {
    serviceName: "opencode server"
    startTimeoutMs: 60000
    stopTimeoutMs: 6000
    healthPath: "/global/health"
  }
  deepLinks: string[]
  protocolHandlers: string[]
}

export interface OpenCodeDesktopSurface {
  readonly kind: "opencode-desktop"
  runtimeProjection(input?: { packaged?: boolean; channel?: "dev" | "beta" | "prod"; deepLinks?: string[] }): OpenCodeDesktopRuntimeProjection
  manifest(): OpenCodeDesktopManifest
  writeBundle(input: { outDir: string; manifestFileName?: string; shellFileName?: string }): { manifestPath: string; shellPath: string }
}

export interface OpenCodeDesktopManifest {
  product: "opencode"
  appID: "dev.opencode.helix"
  appName: "OpenCode"
  window: {
    title: string
    width: number
    height: number
    minWidth: number
    minHeight: number
  }
  webEntry: string
  protocolHandlers: string[]
  services: string[]
}

export interface OpenCodeSlackSurface {
  readonly kind: "opencode-slack"
  manifest(): OpenCodeSlackManifest
  home(): OpenCodeSlackView
  handleCommand(input: { text: string; userID?: string; channelID?: string }): Promise<OpenCodeSlackView>
  handleMessage(input: OpenCodeSlackMessageInput): Promise<OpenCodeSlackMessageResult>
  handleToolUpdate(part: OpenCodeSlackToolPartUpdate): Promise<OpenCodeSlackPostedMessage | undefined>
  sessions(): OpenCodeSlackThreadSession[]
  postedMessages(): OpenCodeSlackPostedMessage[]
}

export interface OpenCodeSlackManifest {
  product: "opencode"
  appName: "OpenCode"
  framework?: "@slack/bolt"
  socketMode?: true
  env?: {
    botToken: boolean
    signingSecret: boolean
    appToken: boolean
  }
  commands: string[]
  events: string[]
  interactivity: boolean
}

export interface OpenCodeSlackView {
  response_type: "ephemeral" | "in_channel"
  text: string
  blocks: Array<Record<string, unknown>>
}

export interface OpenCodeSlackMessageInput {
  text?: string
  subtype?: string
  userID?: string
  channelID: string
  ts: string
  threadTS?: string
}

export interface OpenCodeSlackThreadSession {
  key: string
  sessionID: SessionID
  channelID: string
  threadTS: string
  shareURL?: string
}

export interface OpenCodeSlackPostedMessage {
  channelID: string
  threadTS: string
  text: string
  kind: "session-share" | "assistant-response" | "tool-update" | "command-response" | "error"
}

export interface OpenCodeSlackMessageResult {
  ok: boolean
  skipped?: boolean
  reason?: string
  session?: OpenCodeSlackThreadSession
  sharePost?: OpenCodeSlackPostedMessage
  response?: OpenCodeSlackPostedMessage
}

export interface OpenCodeSlackToolPartUpdate {
  sessionID: SessionID
  tool: string
  title?: string
  status: string
}

export interface OpenCodeProductSurfaces {
  harness: OpenCodeSurfaceHarness
  sdk: OpenCodeSDK
  workspace: OpenCodeWorkspaceSurface
  controlPlane: OpenCodeControlPlane
  createServer(input?: { provider?: LegoProviderAdapter; model?: LegoModel }): OpenCodeServer
  tui: OpenCodeTUISurface
  web: OpenCodeWebSurface
  desktop: OpenCodeDesktopSurface
  slack: OpenCodeSlackSurface
}
