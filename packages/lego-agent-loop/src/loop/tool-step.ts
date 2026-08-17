import {
  createID,
  type LegoMessagePart,
  type LegoToolContext,
  type LegoToolDefinition,
  type LegoToolPermissionRequest,
  type LegoToolResult,
  type PermissionStatus,
  type ProviderStreamEvent,
  type SessionID,
  type ToolCallID,
} from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { SessionInfo } from "@helix/lego-session"
import {
  createToolBatchScheduler,
  toolBatchSchedulerToken,
  type CadenceProductPersonality,
  type ToolBatchPlan,
  type ToolBatchScheduler,
} from "../cadence-policies.ts"
import { emitTurnPipelineTrace } from "../pipeline/index.ts"
import { envelope, record } from "./events.ts"
import type { PreparedToolCall, ToolCallPart } from "./types.ts"

export async function consumeProviderEvent(input: {
  event: ProviderStreamEvent
  session: SessionInfo
  parts: LegoMessagePart[]
  blockedTools: Array<{ toolName: string; reason?: string }>
  hooks: LegoHookHost
  signal?: AbortSignal
  cwd?: string
}): Promise<{ toolCall: boolean; preparedToolCall?: PreparedToolCall }> {
  if (input.event.type === "text") {
    input.parts.push({ id: createID("part"), type: "text", text: input.event.text })
    await emitTurnPipelineTrace(input.hooks, {
      sessionID: input.session.id,
      atomID: "turn.stream-reducer",
      phase: "end",
      details: { eventType: "text" },
      ...(input.signal ? { signal: input.signal } : {}),
    })
    return { toolCall: false }
  }
  if (input.event.type === "reasoning") {
    input.parts.push({ id: createID("part"), type: "reasoning", text: input.event.text })
    await emitTurnPipelineTrace(input.hooks, {
      sessionID: input.session.id,
      atomID: "turn.stream-reducer",
      phase: "end",
      details: { eventType: "reasoning" },
      ...(input.signal ? { signal: input.signal } : {}),
    })
    return { toolCall: false }
  }
  if (input.event.type === "part") {
    input.parts.push(input.event.part)
    await emitTurnPipelineTrace(input.hooks, {
      sessionID: input.session.id,
      atomID: "turn.stream-reducer",
      phase: "end",
      details: { eventType: "part" },
      ...(input.signal ? { signal: input.signal } : {}),
    })
    return { toolCall: false }
  }
  if (input.event.type !== "tool_call") {
    await emitTurnPipelineTrace(input.hooks, {
      sessionID: input.session.id,
      atomID: "turn.stream-reducer",
      phase: "end",
      details: { eventType: input.event.type },
      ...(input.signal ? { signal: input.signal } : {}),
    })
    return { toolCall: false }
  }

  const toolCallID = String(input.event.id ?? createID("toolcall")) as ToolCallID
  const mutableInput = structuredClone(input.event.input)
  const callPart: ToolCallPart = {
    id: createID("part"),
    type: "tool_call",
    toolCallID,
    toolName: input.event.toolName,
    input: mutableInput,
    status: "running",
  }
  input.parts.push(callPart)
  await emitTurnPipelineTrace(input.hooks, {
    sessionID: input.session.id,
    atomID: "turn.stream-reducer",
    phase: "end",
    details: { eventType: "tool_call", toolName: input.event.toolName },
    ...(input.signal ? { signal: input.signal } : {}),
  })

  const preflight = await input.hooks.emit(
    envelope("tool.call", input.session.id, {
      toolName: input.event.toolName,
      toolCallID,
      sessionID: input.session.id,
      input: mutableInput,
    }),
    input.signal,
  )
  const preflightRecord = record(preflight)
  if (preflightRecord?.["block"] === true) {
    const reason = typeof preflightRecord["reason"] === "string" ? preflightRecord["reason"] : undefined
    input.blockedTools.push({ toolName: input.event.toolName, ...(reason ? { reason } : {}) })
    callPart.status = "error"
    const resultPart: LegoMessagePart = {
      id: createID("part"),
      type: "tool_result",
      toolCallID,
      toolName: input.event.toolName,
      isError: true,
      content: [{ id: createID("part"), type: "text", text: reason ?? "blocked" }],
    }
    input.parts.push(resultPart)
    await input.hooks.emit(
      envelope("tool.execution_end", input.session.id, {
        toolName: input.event.toolName,
        toolCallID,
        sessionID: input.session.id,
        input: mutableInput,
        status: "blocked",
        isError: true,
        content: resultPart.content,
        ...(reason ? { reason } : {}),
      }),
      input.signal,
    )
    return { toolCall: true }
  }

  const tool = input.hooks.registries.tools.get(input.event.toolName)
  const permission = await resolveToolPermission({
    tool,
    toolCallID,
    toolName: input.event.toolName,
    toolInput: mutableInput,
    session: input.session,
    hooks: input.hooks,
    cwd: input.cwd ?? input.session.cwd,
    ...(input.signal ? { signal: input.signal } : {}),
  })
  if (!permission.allowed) {
    const reason = permission.reason ?? "permission denied"
    input.blockedTools.push({ toolName: input.event.toolName, reason })
    callPart.status = "error"
    const resultPart: LegoMessagePart = {
      id: createID("part"),
      type: "tool_result",
      toolCallID,
      toolName: input.event.toolName,
      isError: true,
      content: [{ id: createID("part"), type: "text", text: reason }],
    }
    input.parts.push(resultPart)
    await input.hooks.emit(
      envelope("tool.execution_end", input.session.id, {
        toolName: input.event.toolName,
        toolCallID,
        sessionID: input.session.id,
        input: mutableInput,
        status: "denied",
        isError: true,
        content: resultPart.content,
        reason,
      }),
      input.signal,
    )
    return { toolCall: true }
  }

  return {
    toolCall: true,
    preparedToolCall: {
      toolCallID,
      toolName: input.event.toolName,
      toolInput: mutableInput,
      callPart,
      tool,
    },
  }
}

export async function executePreparedToolCalls(input: {
  preparedToolCalls: PreparedToolCall[]
  session: SessionInfo
  parts: LegoMessagePart[]
  hooks: LegoHookHost
  services: Map<string, unknown>
  maxToolResultTextChars: number
  product: CadenceProductPersonality
  signal?: AbortSignal
  cwd?: string
}): Promise<void> {
  const scheduler = toolBatchSchedulerFromServices(input.services, input.product)
  const plan = scheduler.plan({
    product: input.product,
    toolCalls: input.preparedToolCalls.map((call) => ({
      toolCallID: call.toolCallID,
      toolName: call.toolName,
      ...(call.tool?.executionMode ? { executionMode: call.tool.executionMode } : {}),
      mutating: isMutatingTool(call.toolName),
      inputShape: Object.keys(call.toolInput).sort().join(","),
    })),
  })
  const byID = new Map(input.preparedToolCalls.map((call) => [String(call.toolCallID), call]))
  for (const batch of plan) {
    await emitToolBatchTrace(input, scheduler, batch)
    const preparedBatch = batch.toolCallIDs.map((id) => byID.get(String(id))).filter((call): call is PreparedToolCall => Boolean(call))
    if (batch.mode === "parallel") {
      const results = await Promise.all(preparedBatch.map((preparedToolCall) => executePreparedToolCall({ ...input, preparedToolCall })))
      for (const [index, result] of results.entries()) {
        const preparedToolCall = preparedBatch[index]
        if (preparedToolCall) await appendToolResult({ ...input, preparedToolCall, result })
      }
      continue
    }
    for (const preparedToolCall of preparedBatch) {
      const result = await executePreparedToolCall({ ...input, preparedToolCall })
      await appendToolResult({ ...input, preparedToolCall, result })
    }
  }
}

async function executePreparedToolCall(input: {
  preparedToolCall: PreparedToolCall
  session: SessionInfo
  hooks: LegoHookHost
  services: Map<string, unknown>
  maxToolResultTextChars: number
  signal?: AbortSignal
  cwd?: string
}): Promise<LegoToolResult> {
  await input.hooks.emit(
    envelope("tool.execution_start", input.session.id, {
      toolName: input.preparedToolCall.toolName,
      toolCallID: input.preparedToolCall.toolCallID,
      sessionID: input.session.id,
      input: input.preparedToolCall.toolInput,
      cwd: input.cwd ?? input.session.cwd,
    }),
    input.signal,
  )
  const result = await executeTool({
    tool: input.preparedToolCall.tool,
    toolCallID: input.preparedToolCall.toolCallID,
    toolName: input.preparedToolCall.toolName,
    toolInput: input.preparedToolCall.toolInput,
    sessionID: input.session.id,
    cwd: input.cwd ?? input.session.cwd,
    services: input.services,
  })
  return result
}

async function appendToolResult(input: {
  preparedToolCall: PreparedToolCall
  result: LegoToolResult
  session: SessionInfo
  parts: LegoMessagePart[]
  hooks: LegoHookHost
  maxToolResultTextChars: number
  signal?: AbortSignal
}): Promise<void> {
  const { preparedToolCall, result } = input
  const resultPatch = await input.hooks.emit(
    envelope("tool.result", input.session.id, {
      toolName: preparedToolCall.toolName,
      toolCallID: preparedToolCall.toolCallID,
      sessionID: input.session.id,
      input: preparedToolCall.toolInput,
      content: result.content,
      details: result.details,
      isError: result.isError,
    }),
    input.signal,
  )
  const resultPatchRecord = record(resultPatch)
  const resultIsError =
    resultPatchRecord && typeof resultPatchRecord["isError"] === "boolean" ? resultPatchRecord["isError"] : result.isError
  preparedToolCall.callPart.status = resultIsError ? "error" : "completed"
  const content =
    resultPatchRecord && Array.isArray(resultPatchRecord["content"])
      ? (resultPatchRecord["content"] as LegoMessagePart[])
      : result.content
  const truncated = truncateToolResultContent(content, input.maxToolResultTextChars)
  const resultPart: LegoMessagePart = {
    id: createID("part"),
    type: "tool_result",
    toolCallID: preparedToolCall.toolCallID,
    toolName: preparedToolCall.toolName,
    content: truncated.content,
    ...(resultPatchRecord && "details" in resultPatchRecord
      ? { details: resultPatchRecord["details"] }
      : result.details === undefined
        ? {}
        : { details: result.details }),
    ...(resultIsError === undefined ? {} : { isError: resultIsError }),
  }
  input.parts.push(resultPart)
  await input.hooks.emit(
    envelope("tool.execution_end", input.session.id, {
      toolName: preparedToolCall.toolName,
      toolCallID: preparedToolCall.toolCallID,
      sessionID: input.session.id,
      input: preparedToolCall.toolInput,
      status: preparedToolCall.callPart.status,
      content: resultPart.content,
      ...(resultPart.isError === undefined ? {} : { isError: resultPart.isError }),
      ...("details" in resultPart ? { details: resultPart.details } : {}),
    }),
    input.signal,
  )
}

function truncateToolResultContent(
  content: LegoMessagePart[],
  maxTextChars: number,
): { content: LegoMessagePart[]; truncated: boolean } {
  let remaining = maxTextChars
  let truncated = false

  function visit(part: LegoMessagePart): LegoMessagePart {
    if (part.type === "text" || part.type === "reasoning") {
      if (part.text.length <= remaining) {
        remaining -= part.text.length
        return part
      }
      const keep = Math.max(0, remaining)
      const omitted = part.text.length - keep
      remaining = 0
      truncated = true
      const prefix = keep > 0 ? `${part.text.slice(0, keep)}\n` : ""
      return { ...part, text: `${prefix}[truncated ${omitted} chars]` }
    }
    if (part.type === "tool_result") return { ...part, content: part.content.map(visit) }
    return part
  }

  return { content: content.map(visit), truncated }
}

async function executeTool(input: {
  tool: LegoToolDefinition | undefined
  toolCallID: ToolCallID
  toolName: string
  toolInput: Record<string, unknown>
  sessionID: SessionID
  cwd?: string
  services: Map<string, unknown>
}): Promise<LegoToolResult> {
  if (!input.tool) {
    return {
      isError: true,
      content: [
        { id: createID("part"), type: "text", text: `Tool not registered: ${input.toolName}` } satisfies LegoMessagePart,
      ],
    }
  }
  try {
    return await input.tool.execute(input.toolCallID, input.toolInput, {
      sessionID: String(input.sessionID),
      ...(input.cwd ? { cwd: input.cwd } : {}),
      services: input.services,
    })
  } catch (error) {
    return {
      isError: true,
      content: [{ id: createID("part"), type: "text", text: error instanceof Error ? error.message : String(error) }],
      details: {
        error: error instanceof Error ? error.name : "Error",
      },
    }
  }
}

async function resolveToolPermission(input: {
  tool: LegoToolDefinition | undefined
  toolCallID: ToolCallID
  toolName: string
  toolInput: Record<string, unknown>
  session: SessionInfo
  hooks: LegoHookHost
  cwd?: string
  signal?: AbortSignal
}): Promise<{ allowed: true } | { allowed: false; reason?: string }> {
  if (!input.tool?.permission) return { allowed: true }

  const context: LegoToolContext = {
    sessionID: String(input.session.id),
    ...(input.cwd ? { cwd: input.cwd } : {}),
    ...(input.signal ? { signal: input.signal } : {}),
    services: input.hooks.services,
  }
  const rawPermission =
    typeof input.tool.permission === "function"
      ? await input.tool.permission(input.toolInput, context)
      : input.tool.permission
  const request = normalizePermission(rawPermission, input.toolName)
  if (request.status === "allow") return { allowed: true }
  if (request.status === "deny") return { allowed: false, ...(request.reason ? { reason: request.reason } : {}) }

  const result = await input.hooks.emit(
    envelope("permission.ask", input.session.id, {
      sessionID: input.session.id,
      action: request.action ?? `tool.${input.toolName}`,
      subject: request.subject ?? input.toolName,
      metadata: {
        ...request.metadata,
        toolName: input.toolName,
        toolCallID: input.toolCallID,
        input: input.toolInput,
      },
    }),
    input.signal,
  )
  const resultRecord = record(result)
  const status = permissionStatus(resultRecord?.["status"])
  if (status === "allow") return { allowed: true }
  if (status === "deny") {
    const reason = typeof resultRecord?.["reason"] === "string" ? resultRecord["reason"] : request.reason
    return { allowed: false, ...(reason ? { reason } : {}) }
  }

  const confirmed = await confirmWithUi({
    hooks: input.hooks,
    action: request.action ?? `tool.${input.toolName}`,
    subject: request.subject ?? input.toolName,
  })
  return confirmed ? { allowed: true } : { allowed: false, reason: request.reason ?? "permission denied" }
}

function normalizePermission(
  permission: LegoToolPermissionRequest | PermissionStatus,
  toolName: string,
): Required<Pick<LegoToolPermissionRequest, "status" | "action" | "subject">> &
  Omit<LegoToolPermissionRequest, "status" | "action" | "subject"> {
  if (typeof permission === "string") {
    return {
      status: permission,
      action: `tool.${toolName}`,
      subject: toolName,
    }
  }
  return {
    status: permission.status ?? "ask",
    action: permission.action ?? `tool.${toolName}`,
    subject: permission.subject ?? toolName,
    ...(permission.reason ? { reason: permission.reason } : {}),
    ...(permission.metadata ? { metadata: permission.metadata } : {}),
  }
}

async function confirmWithUi(input: { hooks: LegoHookHost; action: string; subject: string }): Promise<boolean> {
  const ui = input.hooks.services.get("ui")
  if (!isConfirmingUI(ui)) return false
  return ui.confirm(input.action, input.subject)
}

function isConfirmingUI(value: unknown): value is { confirm(title: string, message: string): Promise<boolean> | boolean } {
  return value !== null && typeof value === "object" && "confirm" in value && typeof value.confirm === "function"
}

function permissionStatus(value: unknown): PermissionStatus | undefined {
  return value === "allow" || value === "deny" || value === "ask" ? value : undefined
}

function toolBatchSchedulerFromServices(services: Map<string, unknown>, product: CadenceProductPersonality): ToolBatchScheduler {
  const value = services.get(toolBatchSchedulerToken)
  void product
  return isToolBatchScheduler(value) ? value : createToolBatchScheduler("common")
}

function isToolBatchScheduler(value: unknown): value is ToolBatchScheduler {
  return Boolean(value) && typeof value === "object" && typeof (value as { plan?: unknown }).plan === "function"
}

async function emitToolBatchTrace(
  input: {
    session: SessionInfo
    hooks: LegoHookHost
    signal?: AbortSignal
  },
  scheduler: ToolBatchScheduler,
  batch: ToolBatchPlan,
): Promise<void> {
  await emitTurnPipelineTrace(input.hooks, {
    sessionID: input.session.id,
    atomID: "tools.batch-scheduler",
    phase: "decision",
    details: {
      policyAtomID: scheduler.id,
      batchIndex: batch.index,
      mode: batch.mode,
      reason: batch.reasonCode,
      toolCallCount: batch.toolCallIDs.length,
    },
    ...(input.signal ? { signal: input.signal } : {}),
  })
}

function isMutatingTool(toolName: string): boolean {
  return ["edit", "write", "bash", "shell", "run_command"].includes(toolName.replace(/[-\s]/g, "_").toLowerCase())
}
