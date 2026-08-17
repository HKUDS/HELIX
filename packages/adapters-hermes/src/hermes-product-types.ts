import type { LegoMessage, LegoModel, LegoProviderAdapter, LegoRecipe, SessionID } from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { SessionInfo, SessionService } from "@helix/lego-session"
import type { TUIEventLoopResult, TUIEventLoopSnapshot, TUIInputEvent } from "@helix/lego-ui"

export interface HermesSurfaceHarness {
  product: "hermes-agent"
  recipe: LegoRecipe
  reference: Record<string, unknown>
  session: SessionService
  hooks: LegoHookHost
  config?: {
    merge(): { values: Record<string, unknown>; layers: Array<{ scope: string; name: string; priority: number; values: Record<string, unknown> }> }
  }
  graph: Array<{ id: string; variant?: string }>
  runTurn(input: HermesRunTurnInput): Promise<HermesRunTurnResult>
}

export interface HermesRunTurnInput {
  sessionID?: SessionID
  text: string
  provider: LegoProviderAdapter
  model?: LegoModel
  maxSteps?: number
  maxRetries?: number
  syntheticContinue?: boolean
  maxSyntheticContinues?: number
}

export interface HermesRunTurnResult {
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

export type HermesRegistrySnapshot = Record<
  "tools" | "commands" | "shortcuts" | "flags" | "providers" | "auth" | "uiProviders" | "messageRenderers",
  string[]
>

export interface HermesSDK {
  readonly kind: "hermes-sdk"
  workspace(): HermesWorkspaceSnapshot
  graph(): Array<{ id: string; variant?: string }>
  listSessions(input?: { cwd?: string }): Promise<SessionInfo[]>
  getSession(sessionID: SessionID): Promise<{ session: SessionInfo; transcript: LegoMessage[] }>
  runTurn(input: HermesRunTurnInput): Promise<HermesRunTurnResult>
}

export interface HermesWorkspaceSnapshot {
  product: "hermes-agent"
  cwd: string
  recipeID: string
  recipeVersion: string
  reference: Record<string, unknown>
  graph: Array<{ id: string; variant?: string }>
  storageKind: string
  config: Record<string, unknown>
  configLayers: Array<{ scope: string; name: string; priority: number }>
  registries: HermesRegistrySnapshot
  tools: string[]
  commands: string[]
  providers: string[]
  services: string[]
}

export interface HermesCLISurface {
  readonly kind: "hermes-cli"
  commands(): HermesCLICommand[]
  renderHelp(): string
  run(input: { prompt: string; provider: LegoProviderAdapter; model?: LegoModel; json?: boolean }): Promise<string>
}

export interface HermesCLICommand {
  name: string
  flags: string[]
  description: string
}

export interface HermesTUISurface {
  readonly kind: "hermes-tui"
  snapshot(): HermesTUISnapshot
  interactiveSnapshot(): TUIEventLoopSnapshot
  dispatch(event: TUIInputEvent): TUIEventLoopResult
  render(input?: { width?: number }): string
}

export interface HermesTUISnapshot {
  product: "hermes-agent"
  cwd: string
  title: string
  status: "ready"
  storageKind: string
  tools: string[]
  commands: string[]
  modules: Array<{ id: string; variant?: string }>
}

export interface HermesWebDashboardSurface {
  readonly kind: "hermes-web-dashboard"
  render(input?: { title?: string }): string
}

export interface HermesACPSurface {
  readonly kind: "hermes-acp"
  methods(): string[]
  call(method: string, params?: Record<string, unknown>): Promise<unknown>
}

export interface HermesGatewaySurface {
  readonly kind: "hermes-gateway"
  methods(): string[]
  dispatch(event: { platform: string; text: string; userID?: string; provider: LegoProviderAdapter; model?: LegoModel }): Promise<{ text: string; sessionID: SessionID }>
}

export interface HermesAPIServer {
  readonly kind: "hermes-api-server"
  readonly routes: string[]
  listen(input?: { port?: number; host?: string }): Promise<{ url: string; port: number; host: string }>
  close(): Promise<void>
}

export interface HermesProductSurfaces {
  sdk: HermesSDK
  cli: HermesCLISurface
  tui: HermesTUISurface
  acp: HermesACPSurface
  gateway: HermesGatewaySurface
  webDashboard: HermesWebDashboardSurface
  createAPIServer(input?: { provider?: LegoProviderAdapter; model?: LegoModel }): HermesAPIServer
}
