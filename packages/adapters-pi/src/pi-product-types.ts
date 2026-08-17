import type { LegoMessage, LegoModel, LegoProviderAdapter, LegoRecipe, SessionID } from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { SessionInfo, SessionService } from "@helix/lego-session"
import type { TUIEventLoopResult, TUIEventLoopSnapshot, TUIInputEvent } from "@helix/lego-ui"
import type { LoadedPiExtension, PiExtensionImporter, PiExtensionSpec } from "./extension-loader"

export interface PiSurfaceHarness {
  product: "pi-mono"
  recipe: LegoRecipe
  reference: Record<string, unknown>
  session: SessionService
  hooks: LegoHookHost
  config?: {
    merge(): { values: Record<string, unknown>; layers: Array<{ scope: string; name: string; priority: number; values: Record<string, unknown> }> }
  }
  graph: Array<{ id: string; variant?: string }>
  runTurn(input: PiRunTurnInput): Promise<PiRunTurnResult>
}

export interface PiRunTurnInput {
  sessionID?: SessionID
  text: string
  provider: LegoProviderAdapter
  model?: LegoModel
  maxSteps?: number
  maxRetries?: number
  syntheticContinue?: boolean
  maxSyntheticContinues?: number
}

export interface PiRunTurnResult {
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

export interface PiSDK {
  readonly kind: "pi-sdk"
  workspace(): PiWorkspaceSnapshot
  graph(): Array<{ id: string; variant?: string }>
  listSessions(input?: { cwd?: string }): Promise<SessionInfo[]>
  getSession(sessionID: SessionID): Promise<{ session: SessionInfo; transcript: LegoMessage[] }>
  runTurn(input: PiRunTurnInput): Promise<PiRunTurnResult>
  packagePlan(input?: { packages?: PiPackageInput[]; extensions?: PiPackageInput[]; cwd?: string }): PiPackagePlan
  releaseSnapshot(): PiReleaseSnapshot
}

export type PiRegistrySnapshot = Record<
  "tools" | "commands" | "shortcuts" | "flags" | "providers" | "auth" | "uiProviders" | "messageRenderers",
  string[]
>

export interface PiWorkspaceSnapshot {
  product: "pi-mono"
  cwd: string
  recipeID: string
  recipeVersion: string
  reference: Record<string, unknown>
  graph: Array<{ id: string; variant?: string }>
  storageKind: string
  config: Record<string, unknown>
  configLayers: Array<{ scope: string; name: string; priority: number }>
  registries: PiRegistrySnapshot
  tools: string[]
  commands: string[]
  flags: string[]
  providers: string[]
  services: string[]
}

export interface PiCLISurface {
  readonly kind: "pi-cli"
  commands(): PiCLICommand[]
  renderHelp(): string
  run(input: { prompt: string; provider: LegoProviderAdapter; model?: LegoModel; json?: boolean }): Promise<string>
}

export interface PiCLICommand {
  name: string
  flags: string[]
  description: string
}

export interface PiTUISurface {
  readonly kind: "pi-tui"
  snapshot(): PiTUISnapshot
  interactiveSnapshot(): TUIEventLoopSnapshot
  dispatch(event: TUIInputEvent): TUIEventLoopResult
  render(input?: { width?: number }): string
}

export interface PiTUISnapshot {
  product: "pi-mono"
  cwd: string
  title: string
  status: "ready"
  storageKind: string
  tools: string[]
  commands: string[]
  modules: Array<{ id: string; variant?: string }>
}

export interface PiRPCSurface {
  readonly kind: "pi-rpc"
  methods(): string[]
  call(method: string, params?: Record<string, unknown>): Promise<unknown>
}

export interface PiWebUISurface {
  readonly kind: "pi-web-ui"
  render(input?: { title?: string }): string
  write(input: { outDir: string; fileName?: string; title?: string }): string
}

export interface PiServer {
  readonly kind: "pi-server"
  readonly routes: string[]
  listen(input?: { port?: number; host?: string }): Promise<{ url: string; port: number; host: string }>
  close(): Promise<void>
}

export type PiPackageRole = "extension" | "package"
export type PiPackageKind = "npm" | "git" | "local" | "file" | "specifier"

export interface PiPackageSpecObject {
  spec: string
  role?: PiPackageRole
  enabled?: boolean
  integrity?: string
  source?: { id?: string; path?: string; scope?: string }
}

export type PiPackageInput = string | PiPackageSpecObject

export interface PiResolvedPackage {
  id: string
  spec: string
  role: PiPackageRole
  kind: PiPackageKind
  importSpecifier: string
  enabled: boolean
  integrity?: string
  path?: string
  source: { id: string; scope: string; path?: string }
}

export interface PiPackagePlan {
  product: "pi-mono"
  cwd: string
  packages: PiResolvedPackage[]
  extensions: PiResolvedPackage[]
  all: PiResolvedPackage[]
}

export interface PiPackageManager {
  readonly kind: "pi-package-manager"
  plan(input?: { packages?: PiPackageInput[]; extensions?: PiPackageInput[]; cwd?: string }): PiPackagePlan
  extensionSpecs(input?: { extensions?: PiPackageInput[]; cwd?: string }): PiExtensionSpec[]
  loadExtensions(input?: {
    extensions?: PiPackageInput[]
    cwd?: string
    importer?: PiExtensionImporter
  }): Promise<LoadedPiExtension[]>
  shrinkwrap(input?: { packages?: PiPackageInput[]; extensions?: PiPackageInput[]; cwd?: string }): PiPackageShrinkwrap
}

export interface PiPackageShrinkwrap {
  lockfileVersion: 1
  product: "pi-mono"
  cwd: string
  generatedBy: "helix"
  packages: Array<{
    id: string
    spec: string
    role: PiPackageRole
    kind: PiPackageKind
    importSpecifier: string
    integrity?: string
    path?: string
  }>
}

export interface PiExtensionExample {
  id: string
  title: string
  path: string
  source: string
}

export interface PiExtensionExamples {
  readonly kind: "pi-extension-examples"
  list(): PiExtensionExample[]
  materialize(input: { outDir: string }): string[]
}

export interface PiBrowserSmoke {
  readonly kind: "pi-browser-smoke"
  render(input?: { title?: string }): string
  write(input: { outDir: string; fileName?: string; title?: string }): string
}

export interface PiReleaseHardening {
  readonly kind: "pi-release-hardening"
  snapshot(): PiReleaseSnapshot
  verify(): PiReleaseVerification
  writeShrinkwrap(input: { outDir: string; fileName?: string }): string
}

export interface PiReleaseSnapshot {
  product: "pi-mono"
  recipeID: string
  recipeVersion: string
  upstreamCommit?: string
  modules: Array<{ id: string; variant?: string }>
  packageShrinkwrap: PiPackageShrinkwrap
  services: string[]
  browserSmoke: {
    fileName: string
    dataAttribute: string
    entryPoint: "scripts/browser-smoke-entry.ts"
    bundler: "esbuild"
    platform: "browser"
  }
  webExport: {
    dataAttribute: "data-pi-web-ui"
    sessionDataElementID: "session-data"
    encoding: "base64-json"
    templateAssets: readonly ["template.html", "template.css", "template.js", "marked.min.js", "highlight.min.js"]
  }
  releasePolicy: {
    checkScript: "npm run check"
    localReleaseScript: "npm run release:local"
    shrinkwrapScript: "npm run shrinkwrap:coding-agent"
    installCommands: readonly ["npm install --omit=dev --ignore-scripts", "bun install --production --ignore-scripts"]
    outputDirectoryPolicy: "outside-repository"
    dependencyPolicy: readonly ["save-exact", "min-release-age", "pinned-direct-dependencies", "review-lockfile-lifecycle-scripts"]
  }
}

export interface PiReleaseVerification {
  ok: boolean
  checks: Array<{ id: string; ok: boolean; message: string }>
}

export interface PiProductSurfaces {
  sdk: PiSDK
  cli: PiCLISurface
  tui: PiTUISurface
  rpc: PiRPCSurface
  webUI: PiWebUISurface
  createServer(input?: { provider?: LegoProviderAdapter; model?: LegoModel }): PiServer
  packageManager: PiPackageManager
  examples: PiExtensionExamples
  browserSmoke: PiBrowserSmoke
  release: PiReleaseHardening
}
