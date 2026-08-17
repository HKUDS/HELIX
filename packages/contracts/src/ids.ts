export type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand }

export type SessionID = Brand<string, "SessionID">
export type MessageID = Brand<string, "MessageID">
export type PartID = Brand<string, "PartID">
export type ToolCallID = Brand<string, "ToolCallID">
export type WorkspaceID = Brand<string, "WorkspaceID">
export type ProviderID = Brand<string, "ProviderID">
export type ModelID = Brand<string, "ModelID">
export type LegoModuleID = Brand<string, "LegoModuleID">

export type IdKind = "session" | "message" | "part" | "toolcall" | "workspace" | "provider" | "model" | "module"

const prefixes: Record<IdKind, string> = {
  session: "ses",
  message: "msg",
  part: "prt",
  toolcall: "tc",
  workspace: "ws",
  provider: "prv",
  model: "mdl",
  module: "mod",
}

export type IDForKind<TKind extends IdKind> = TKind extends "session"
  ? SessionID
  : TKind extends "message"
    ? MessageID
    : TKind extends "part"
      ? PartID
      : TKind extends "toolcall"
        ? ToolCallID
        : TKind extends "workspace"
          ? WorkspaceID
          : TKind extends "provider"
            ? ProviderID
            : TKind extends "model"
              ? ModelID
              : LegoModuleID

export function createID<TKind extends IdKind>(kind: TKind, seed?: string): IDForKind<TKind> {
  const actualSeed = seed ?? globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return `${prefixes[kind]}_${actualSeed.replace(/[^a-zA-Z0-9_-]/g, "")}` as IDForKind<TKind>
}

export function asSessionID(value: string): SessionID {
  return value as SessionID
}

export function asMessageID(value: string): MessageID {
  return value as MessageID
}

export function asPartID(value: string): PartID {
  return value as PartID
}

export function asToolCallID(value: string): ToolCallID {
  return value as ToolCallID
}

export function asProviderID(value: string): ProviderID {
  return value as ProviderID
}

export function asModelID(value: string): ModelID {
  return value as ModelID
}
