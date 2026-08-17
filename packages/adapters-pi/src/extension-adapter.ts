import type { LegoMessage, LegoToolDefinition, SessionID, SessionTranscript } from "@helix/contracts"
import type {
  CommandRegistration,
  EventNameAlias,
  FlagRegistration,
  HookContext,
  HookScope,
  LegoHookHost,
  ShortcutRegistration,
} from "@helix/lego-hooks"
import type { SessionInfo, SessionService } from "@helix/lego-session"
import { createPiExtensionAPIFactoryAtom, createPiExtensionLoaderAtom } from "./extension-atoms"
export { createPiUIFacade, createReadonlySessionManager } from "./extension-atoms"

export interface PiUIFacade {
  notify(message: string, type?: "info" | "warning" | "error"): void
  confirm(title: string, message: string): Promise<boolean>
  input(title: string, placeholder?: string): Promise<string | undefined>
  select(title: string, options: string[]): Promise<string | undefined>
}

export interface PiReadonlySessionManager {
  get(sessionID: SessionID | string): Promise<SessionInfo>
  list(input?: { cwd?: string }): Promise<SessionInfo[]>
  listAll(input?: { cwd?: string }): Promise<SessionInfo[]>
  messages(input: { sessionID: SessionID | string; limit?: number }): Promise<LegoMessage[]>
  transcript(sessionID: SessionID | string): Promise<SessionTranscript>
}

export interface PiExtensionContext extends HookContext {
  cwd?: string
  ui: PiUIFacade
  sessionManager?: PiReadonlySessionManager
}

export interface PiExtensionAPI {
  on(event: EventNameAlias | string, handler: (event: unknown, ctx: PiExtensionContext) => unknown | Promise<unknown>): void
  registerTool(tool: LegoToolDefinition): void
  registerCommand(name: string, options: Omit<CommandRegistration, "name" | "source">): void
  registerShortcut(key: string, options: Omit<ShortcutRegistration, "key" | "source">): void
  registerFlag(name: string, options: Omit<FlagRegistration, "name" | "source">): void
  registerProvider(name: string, config: unknown): void
  registerUIProvider(name: string, provider: unknown): void
  registerMessageRenderer(customType: string, render: (...args: unknown[]) => unknown): void
  addCleanup(cleanup: () => void | Promise<void>): void
  dispose(): Promise<void>
  events: {
    emit(type: string, payload: unknown): Promise<void>
  }
}

export type PiExtension = (pi: PiExtensionAPI) => void | Promise<void>

export function definePiExtension(extension: PiExtension): PiExtension {
  return extension
}

export async function loadPiExtension(input: {
  host: LegoHookHost
  extension: PiExtension
  source?: { id: string; path?: string; scope?: string }
}): Promise<PiExtensionAPI> {
  return createPiExtensionLoaderAtom().load(input)
}

export function createPiExtensionAPI(
  host: LegoHookHost,
  source: HookScope | { id: string; order?: number; path?: string; scope?: string },
): PiExtensionAPI {
  return createPiExtensionAPIFactoryAtom().create({ host, source })
}
