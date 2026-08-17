import type { LegoMessage, LegoModel, LegoProviderAdapter, LegoRecipe, SessionID } from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { SessionInfo, SessionService } from "@helix/lego-session"
import type { TUIEventLoopResult, TUIEventLoopSnapshot, TUIInputEvent } from "@helix/lego-ui"

export interface NanobotSurfaceHarness {
  product: "nanobot"
  recipe: LegoRecipe
  reference: Record<string, unknown>
  session: SessionService
  hooks: LegoHookHost
  config?: {
    merge(): { values: Record<string, unknown>; layers: Array<{ scope: string; name: string; priority: number; values: Record<string, unknown> }> }
  }
  graph: Array<{ id: string; variant?: string }>
  runTurn(input: NanobotRunTurnInput): Promise<NanobotRunTurnResult>
}

export interface NanobotRunTurnInput {
  sessionID?: SessionID
  text: string
  provider: LegoProviderAdapter
  model?: LegoModel
  maxSteps?: number
  maxRetries?: number
  syntheticContinue?: boolean
  maxSyntheticContinues?: number
}

export interface NanobotRunTurnResult {
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

export type NanobotRegistrySnapshot = Record<
  "tools" | "commands" | "shortcuts" | "flags" | "providers" | "auth" | "uiProviders" | "messageRenderers",
  string[]
>

export interface NanobotSDK {
  readonly kind: "nanobot-sdk"
  workspace(): NanobotWorkspaceSnapshot
  graph(): Array<{ id: string; variant?: string }>
  listSessions(input?: { cwd?: string }): Promise<SessionInfo[]>
  getSession(sessionID: SessionID): Promise<{ session: SessionInfo; transcript: LegoMessage[] }>
  runTurn(input: NanobotRunTurnInput): Promise<NanobotRunTurnResult>
}

export interface NanobotWorkspaceSnapshot {
  product: "nanobot"
  cwd: string
  recipeID: string
  recipeVersion: string
  reference: Record<string, unknown>
  graph: Array<{ id: string; variant?: string }>
  storageKind: string
  config: Record<string, unknown>
  configLayers: Array<{ scope: string; name: string; priority: number }>
  registries: NanobotRegistrySnapshot
  tools: string[]
  commands: string[]
  providers: string[]
  services: string[]
}

export interface NanobotCLISurface {
  readonly kind: "nanobot-cli"
  commands(): NanobotCLICommand[]
  renderHelp(): string
  run(input: { prompt: string; provider: LegoProviderAdapter; model?: LegoModel; json?: boolean }): Promise<string>
}

export interface NanobotCLICommand {
  name: string
  flags: string[]
  description: string
}

export interface NanobotTUISurface {
  readonly kind: "nanobot-tui"
  snapshot(): NanobotTUISnapshot
  interactiveSnapshot(): TUIEventLoopSnapshot
  dispatch(event: TUIInputEvent): TUIEventLoopResult
  render(input?: { width?: number }): string
}

export interface NanobotTUISnapshot {
  product: "nanobot"
  cwd: string
  title: string
  status: "ready"
  storageKind: string
  tools: string[]
  commands: string[]
  modules: Array<{ id: string; variant?: string }>
}

export interface NanobotWebUIBootstrap {
  token: string
  ws_path: string
  expires_in: number
  model_name: string | null
}

export interface NanobotWebUIRenderInput {
  title?: string
  bootstrap?: NanobotWebUIBootstrap
  apiRoutes?: readonly string[]
}

export interface NanobotWebUISurface {
  readonly kind: "nanobot-web-ui"
  render(input?: NanobotWebUIRenderInput): string
}

export interface NanobotServer {
  readonly kind: "nanobot-server"
  readonly routes: string[]
  listen(input?: { port?: number; host?: string }): Promise<{ url: string; port: number; host: string }>
  close(): Promise<void>
}

export interface NanobotProductSurfaces {
  sdk: NanobotSDK
  cli: NanobotCLISurface
  tui: NanobotTUISurface
  webUI: NanobotWebUISurface
  createServer(input?: { provider?: LegoProviderAdapter; model?: LegoModel }): NanobotServer
}
