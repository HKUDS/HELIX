import type { LegoMessagePart } from "./message"
import type { ToolCallID } from "./ids"

export type ToolExecutionMode = "parallel" | "sequential"
export type PermissionStatus = "ask" | "deny" | "allow"
export type LegoToolParameterSchemaKind = "json-schema" | "standard-schema" | "zod" | "effect-schema" | "typebox" | "unknown"

export interface LegoToolContext {
  sessionID?: string
  cwd?: string
  signal?: AbortSignal
  services?: Map<string, unknown>
  metadata?: Record<string, unknown>
}

export interface LegoToolPermissionRequest {
  status?: PermissionStatus
  action?: string
  subject?: string
  reason?: string
  metadata?: Record<string, unknown>
}

export type LegoToolPermission<TInput extends Record<string, unknown> = Record<string, unknown>> =
  | PermissionStatus
  | LegoToolPermissionRequest
  | ((input: TInput, ctx: LegoToolContext) => LegoToolPermissionRequest | PermissionStatus | Promise<LegoToolPermissionRequest | PermissionStatus>)

export interface LegoToolResult<TDetails = unknown> {
  content: LegoMessagePart[]
  details?: TDetails
  isError?: boolean
}

export interface LegoToolParameterSchema {
  kind: LegoToolParameterSchemaKind
  schema: unknown
  jsonSchema?: unknown
}

export interface LegoToolDefinition<TInput extends Record<string, unknown> = Record<string, unknown>, TDetails = unknown> {
  name: string
  label?: string
  description: string
  parameters?: unknown
  executionMode?: ToolExecutionMode
  permission?: LegoToolPermission<TInput>
  renderCall?(input: TInput, ctx: LegoToolContext): unknown
  renderResult?(result: LegoToolResult<TDetails>, ctx: LegoToolContext): unknown
  execute(
    toolCallID: ToolCallID | string,
    input: TInput,
    ctx: LegoToolContext,
  ): Promise<LegoToolResult<TDetails>> | LegoToolResult<TDetails>
}

export function adaptToolParameters(parameters: unknown): LegoToolParameterSchema {
  if (isTypeBoxSchema(parameters)) return { kind: "typebox", schema: parameters, jsonSchema: parameters }
  if (isJsonSchema(parameters)) return { kind: "json-schema", schema: parameters, jsonSchema: parameters }
  if (isStandardSchema(parameters)) return { kind: "standard-schema", schema: parameters }
  if (isZodSchema(parameters)) return { kind: "zod", schema: parameters }
  if (isEffectSchema(parameters)) return { kind: "effect-schema", schema: parameters }
  return { kind: "unknown", schema: parameters }
}

function isJsonSchema(value: unknown): boolean {
  if (!isRecord(value)) return false
  return typeof value["type"] === "string" || typeof value["$schema"] === "string" || typeof value["properties"] === "object"
}

function isTypeBoxSchema(value: unknown): boolean {
  if (!isRecord(value)) return false
  return Object.getOwnPropertySymbols(value).some((symbol) => symbol.description === "TypeBox.Kind" || symbol.description === "Kind")
}

function isStandardSchema(value: unknown): boolean {
  return isRecord(value) && isRecord(value["~standard"])
}

function isZodSchema(value: unknown): boolean {
  return isRecord(value) && (isRecord(value["_def"]) || typeof value["safeParse"] === "function")
}

function isEffectSchema(value: unknown): boolean {
  return isRecord(value) && isRecord(value["ast"])
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
