import { createHash } from "node:crypto"

export const hermesEventUpstreamRef = "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
export const hermesEventNativeExactFixtureID = "hermes-event:native-exact-fixture"
export const hermesEventNativeExactEvidenceRef = "conformance:hermes-event-native-exact-fixture"
export const hermesEventNativeExactReplayRef = "event-native-exact:hermes-agent"
export const hermesEventEnvelopeNativeExactAtomID = "hermes.event.envelope-bridge"
export const hermesRuntimeEventNativeExactAtomID = "hermes.event.runtime-bridge"
export const hermesEventNativeExactAtomIDs = [
  hermesEventEnvelopeNativeExactAtomID,
  hermesRuntimeEventNativeExactAtomID,
] as const

export type HermesEventNativeExactAtomID = (typeof hermesEventNativeExactAtomIDs)[number]

export interface HermesToolCall {
  id: string | null
  name: string
  arguments: string
  provider_data?: Record<string, unknown> | null
}

export interface HermesUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cached_tokens: number
}

export interface HermesNormalizedResponse {
  content: string | null
  tool_calls: HermesToolCall[] | null
  finish_reason: string
  reasoning?: string | null
  usage?: HermesUsage | null
  provider_data?: Record<string, unknown> | null
}

export interface HermesProjectionResult {
  messages: Array<Record<string, unknown>>
  is_tool_iteration: boolean
  final_text: string | null
}

export interface HermesEventNativeDescriptor {
  id: HermesEventNativeExactAtomID
  port: "event.envelope" | "event.log"
  product: "hermes-agent"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof hermesEventNativeExactEvidenceRef, typeof hermesEventNativeExactReplayRef]
  fixtureIDs: [typeof hermesEventNativeExactFixtureID]
  knownLossiness: []
}

export type HermesEventNativeScenarioID =
  | "tool-call-normalized-response-compat-properties"
  | "codex-event-projector-reasoning-command"
  | "codex-event-projector-file-mcp-dynamic-tools"
  | "codex-event-projector-user-agent-opaque-items"

export interface HermesEventNativeExactCase {
  scenarioID: HermesEventNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface HermesEventNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  atomIDs: readonly [
    typeof hermesEventEnvelopeNativeExactAtomID,
    typeof hermesRuntimeEventNativeExactAtomID,
  ]
  portIDs: readonly ["event.envelope", "event.log"]
  upstreamRef: typeof hermesEventUpstreamRef
  evidenceRef: typeof hermesEventNativeExactEvidenceRef
  fixtureID: typeof hermesEventNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    nonCompletedCodexEventsAreDisplayOnly: true
    reasoningItemsAttachToNextAssistantOrToolCall: true
    userMessagesFlattenTextFragmentsOnly: true
    commandExecutionProjectsExecToolCallAndResult: true
    fileChangeProjectsApplyPatchDigestWithoutFileContents: true
    mcpAndDynamicToolCallsProjectAssistantToolPair: true
    opaqueItemsRemainAssistantNotesWithoutToolCalls: true
    toolCallsExposeBackwardCompatibleFunctionProperties: true
    normalizedResponseExposesProviderDataCompatibilityProperties: true
  }
  cases: HermesEventNativeExactCase[]
  replay: HermesProjectionResult[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: HermesEventNativeDescriptor[]
  fingerprint: string
}

export interface HermesEventNativeExactIssue {
  id: string
  message: string
}

export interface HermesEventNativeExactVerification {
  ok: boolean
  issues: HermesEventNativeExactIssue[]
}

export const hermesEventEnvelopeNativeDescriptor = hermesEventNativeDescriptor(
  hermesEventEnvelopeNativeExactAtomID,
  "event.envelope",
  "Hermes upstream native NormalizedResponse and ToolCall envelope compatibility with native parity complete event fixture coverage.",
)

export const hermesRuntimeEventNativeDescriptor = hermesEventNativeDescriptor(
  hermesRuntimeEventNativeExactAtomID,
  "event.log",
  "Hermes upstream native CodexEventProjector item/completed runtime projection with native parity complete event fixture coverage.",
)

export const hermesEventNativeDescriptors = [
  hermesEventEnvelopeNativeDescriptor,
  hermesRuntimeEventNativeDescriptor,
] as const

export function buildHermesToolCall(
  id: string | null,
  name: string,
  args: unknown,
  providerFields: Record<string, unknown> = {},
): HermesToolCall {
  const provider_data = Object.keys(providerFields).length > 0 ? { ...providerFields } : null
  return {
    id,
    name,
    arguments: isRecord(args) ? pythonJSONDumps(args, { ensureAscii: true, sortKeys: false }) : String(args),
    provider_data,
  }
}

export function hermesToolCallType(_toolCall: HermesToolCall): "function" {
  return "function"
}

export function hermesToolCallFunction(toolCall: HermesToolCall): HermesToolCall {
  return toolCall
}

export function hermesToolCallProviderField(toolCall: HermesToolCall, field: "call_id" | "response_item_id" | "extra_content"): unknown {
  return (toolCall.provider_data ?? {})[field]
}

export function createHermesUsage(input: Partial<HermesUsage> = {}): HermesUsage {
  return {
    prompt_tokens: input.prompt_tokens ?? 0,
    completion_tokens: input.completion_tokens ?? 0,
    total_tokens: input.total_tokens ?? 0,
    cached_tokens: input.cached_tokens ?? 0,
  }
}

export function createHermesNormalizedResponse(input: {
  content: string | null
  tool_calls?: HermesToolCall[] | null
  finish_reason: string
  reasoning?: string | null
  usage?: HermesUsage | null
  provider_data?: Record<string, unknown> | null
}): HermesNormalizedResponse {
  return {
    content: input.content,
    tool_calls: input.tool_calls ?? null,
    finish_reason: input.finish_reason,
    reasoning: input.reasoning ?? null,
    usage: input.usage ?? null,
    provider_data: input.provider_data ?? null,
  }
}

export function hermesNormalizedResponseProviderField(
  response: HermesNormalizedResponse,
  field: "reasoning_content" | "reasoning_details" | "codex_reasoning_items" | "codex_message_items",
): unknown {
  return (response.provider_data ?? {})[field]
}

export function mapHermesFinishReason(reason: string | null | undefined, mapping: Record<string, string>): string {
  if (reason === null || reason === undefined) return "stop"
  return mapping[reason] ?? "stop"
}

export function hermesDeterministicCallID(itemType: string, itemID: string): string {
  if (itemID) return `codex_${itemType}_${itemID}`
  return `codex_${itemType}_${createHash("sha256").update(itemType).digest("hex").slice(0, 16)}`
}

export function formatHermesCodexToolArgs(args: Record<string, unknown>): string {
  return pythonJSONDumps(args, { ensureAscii: false, sortKeys: true })
}

export class HermesCodexEventProjector {
  private pendingReasoning: string[] = []

  project(notification: Record<string, unknown>): HermesProjectionResult {
    const method = stringOr(notification.method, "")
    const params = isRecord(notification.params) ? notification.params : {}
    if (method !== "item/completed") return projectionResult()

    const item = isRecord(params.item) ? params.item : {}
    const itemType = stringOr(item.type, "")
    const itemID = stringOr(item.id, "")
    if (itemType === "agentMessage") return this.projectAgentMessage(item)
    if (itemType === "reasoning") {
      this.pendingReasoning.push(...stringArray(item.summary), ...stringArray(item.content))
      return projectionResult()
    }
    if (itemType === "commandExecution") return this.projectCommand(item, itemID)
    if (itemType === "fileChange") return this.projectFileChange(item, itemID)
    if (itemType === "mcpToolCall") return this.projectMCPToolCall(item, itemID)
    if (itemType === "dynamicToolCall") return this.projectDynamicToolCall(item, itemID)
    if (itemType === "userMessage") return this.projectUserMessage(item)
    return this.projectOpaque(item, itemType)
  }

  private takeReasoning(): string | undefined {
    if (this.pendingReasoning.length === 0) return undefined
    const reasoning = this.pendingReasoning.join("\n")
    this.pendingReasoning = []
    return reasoning
  }

  private attachReasoning(message: Record<string, unknown>): void {
    const reasoning = this.takeReasoning()
    if (reasoning !== undefined) message.reasoning = reasoning
  }

  private projectAgentMessage(item: Record<string, unknown>): HermesProjectionResult {
    const text = stringOr(item.text, "")
    const message: Record<string, unknown> = { role: "assistant", content: text }
    this.attachReasoning(message)
    return projectionResult([message], false, text)
  }

  private projectUserMessage(item: Record<string, unknown>): HermesProjectionResult {
    const textParts: string[] = []
    const content = Array.isArray(item.content) ? item.content : []
    for (const fragment of content) {
      if (!isRecord(fragment)) continue
      if (fragment.type === "text") textParts.push(stringOr(fragment.text, ""))
      else if (Object.prototype.hasOwnProperty.call(fragment, "text")) textParts.push(String(fragment.text))
    }
    return projectionResult([{ role: "user", content: textParts.join("\n") }])
  }

  private projectCommand(item: Record<string, unknown>, itemID: string): HermesProjectionResult {
    const callID = hermesDeterministicCallID("exec", itemID)
    const assistantMessage = toolCallAssistantMessage(callID, "exec_command", {
      command: stringOr(item.command, ""),
      cwd: stringOr(item.cwd, ""),
    })
    this.attachReasoning(assistantMessage)
    const exitCode = item.exitCode
    let output = stringOr(item.aggregatedOutput, "")
    if (exitCode !== null && exitCode !== undefined && exitCode !== 0) output = `[exit ${String(exitCode)}]\n${output}`
    return projectionResult([
      assistantMessage,
      {
        role: "tool",
        tool_call_id: callID,
        content: output,
      },
    ], true)
  }

  private projectFileChange(item: Record<string, unknown>, itemID: string): HermesProjectionResult {
    const callID = hermesDeterministicCallID("apply_patch", itemID)
    const changes = Array.isArray(item.changes) ? item.changes : []
    const changesSummary = changes.map((change) => {
      const entry = isRecord(change) ? change : {}
      const kind = isRecord(entry.kind) ? stringOr(entry.kind.type, "update") : "update"
      return { kind, path: stringOr(entry.path, "") }
    })
    const assistantMessage = toolCallAssistantMessage(callID, "apply_patch", { changes: changesSummary })
    this.attachReasoning(assistantMessage)
    const status = stringOr(item.status, "unknown")
    return projectionResult([
      assistantMessage,
      {
        role: "tool",
        tool_call_id: callID,
        content: `apply_patch status=${status}, ${changesSummary.length} change(s)`,
      },
    ], true)
  }

  private projectMCPToolCall(item: Record<string, unknown>, itemID: string): HermesProjectionResult {
    const server = stringOr(item.server, "mcp")
    const tool = stringOr(item.tool, "unknown")
    const callID = hermesDeterministicCallID(`mcp_${server}_${tool}`, itemID)
    const rawArgs = item.arguments ?? {}
    const args = isRecord(rawArgs) ? rawArgs : { arguments: rawArgs }
    const assistantMessage = toolCallAssistantMessage(callID, `mcp.${server}.${tool}`, args)
    this.attachReasoning(assistantMessage)
    const error = item.error
    const result = item.result
    const content = isPythonTruthy(error)
      ? `[error] ${pythonJSONDumps(error, { ensureAscii: false, sortKeys: false }).slice(0, 1000)}`
      : result !== null && result !== undefined
        ? pythonJSONDumps(result, { ensureAscii: false, sortKeys: false }).slice(0, 4000)
        : ""
    return projectionResult([
      assistantMessage,
      {
        role: "tool",
        tool_call_id: callID,
        content,
      },
    ], true)
  }

  private projectDynamicToolCall(item: Record<string, unknown>, itemID: string): HermesProjectionResult {
    const tool = stringOr(item.tool, "unknown")
    const callID = hermesDeterministicCallID(`dyn_${tool}`, itemID)
    const rawArgs = item.arguments ?? {}
    const args = isRecord(rawArgs) ? rawArgs : { arguments: rawArgs }
    const assistantMessage = toolCallAssistantMessage(callID, tool, args)
    this.attachReasoning(assistantMessage)
    const contentItems = item.contentItems
    const content = Array.isArray(contentItems) && contentItems.length > 0
      ? pythonJSONDumps(contentItems, { ensureAscii: false, sortKeys: false }).slice(0, 4000)
      : `success=${pythonStr(item.success)}`
    return projectionResult([
      assistantMessage,
      {
        role: "tool",
        tool_call_id: callID,
        content,
      },
    ], true)
  }

  private projectOpaque(item: Record<string, unknown>, itemType: string): HermesProjectionResult {
    const payload = pythonJSONDumps(item, { ensureAscii: false, sortKeys: false }).slice(0, 1500)
    return projectionResult([
      {
        role: "assistant",
        content: `[codex ${itemType}] ${payload}`,
      },
    ])
  }
}

export function buildHermesEventNativeExactFixture(): HermesEventNativeExactFixture {
  const projector = new HermesCodexEventProjector()
  const replay = [
    projector.project({ method: "item/outputDelta", params: { item: { type: "agentMessage", text: "streaming" } } }),
    projector.project({ method: "item/completed", params: { item: { type: "reasoning", summary: ["plan"], content: ["detail"] } } }),
    projector.project({
      method: "item/completed",
      params: {
        item: {
          id: "cmd-1",
          type: "commandExecution",
          command: "npm test",
          cwd: "/repo",
          aggregatedOutput: "boom",
          exitCode: 2,
        },
      },
    }),
    projector.project({
      method: "item/completed",
      params: {
        item: {
          id: "file-1",
          type: "fileChange",
          status: "done",
          changes: [
            { kind: { type: "add" }, path: "src/new.ts" },
            { path: "src/existing.ts" },
          ],
        },
      },
    }),
    projector.project({
      method: "item/completed",
      params: {
        item: {
          id: "mcp-1",
          type: "mcpToolCall",
          server: "github",
          tool: "list",
          arguments: { z: 1, a: "你好" },
          result: { ok: true, value: "世界" },
        },
      },
    }),
    projector.project({
      method: "item/completed",
      params: {
        item: {
          id: "dyn-1",
          type: "dynamicToolCall",
          tool: "inspect",
          arguments: ["raw"],
          contentItems: [{ type: "text", text: "done" }],
        },
      },
    }),
    projector.project({
      method: "item/completed",
      params: {
        item: {
          type: "userMessage",
          content: [
            { type: "text", text: "hello" },
            { type: "image", url: "file:///tmp/screen.png" },
            { text: 42 },
          ],
        },
      },
    }),
    projector.project({
      method: "item/completed",
      params: {
        item: {
          type: "plan",
          steps: ["one"],
        },
      },
    }),
    projector.project({ method: "item/completed", params: { item: { type: "agentMessage", text: "final" } } }),
  ]
  const toolCall = buildHermesToolCall("tc-1", "write_file", { b: "β", a: 1 }, { call_id: "call-1", response_item_id: "fc-1", extra_content: { google: { thought_signature: "sig" } } })
  const response = createHermesNormalizedResponse({
    content: "answer",
    tool_calls: [toolCall],
    finish_reason: mapHermesFinishReason("tool_use", { tool_use: "tool_calls" }),
    provider_data: {
      reasoning_content: "think",
      reasoning_details: [{ type: "summary_text", text: "think" }],
      codex_reasoning_items: [{ id: "rs_1" }],
      codex_message_items: [{ id: "msg_1" }],
    },
  })
  const fixtureWithoutFingerprint: Omit<HermesEventNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "hermes-agent" as const,
    atomIDs: [...hermesEventNativeExactAtomIDs] as typeof hermesEventNativeExactAtomIDs,
    portIDs: ["event.envelope", "event.log"] as const,
    upstreamRef: hermesEventUpstreamRef,
    evidenceRef: hermesEventNativeExactEvidenceRef,
    fixtureID: hermesEventNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      nonCompletedCodexEventsAreDisplayOnly: true as const,
      reasoningItemsAttachToNextAssistantOrToolCall: true as const,
      userMessagesFlattenTextFragmentsOnly: true as const,
      commandExecutionProjectsExecToolCallAndResult: true as const,
      fileChangeProjectsApplyPatchDigestWithoutFileContents: true as const,
      mcpAndDynamicToolCallsProjectAssistantToolPair: true as const,
      opaqueItemsRemainAssistantNotesWithoutToolCalls: true as const,
      toolCallsExposeBackwardCompatibleFunctionProperties: true as const,
      normalizedResponseExposesProviderDataCompatibilityProperties: true as const,
    },
    cases: [
      eventCase(
        "tool-call-normalized-response-compat-properties",
        { toolCallID: "tc-1", providerData: ["call_id", "response_item_id", "extra_content"] },
        {
          toolCallType: hermesToolCallType(toolCall),
          functionName: hermesToolCallFunction(toolCall).name,
          arguments: toolCall.arguments,
          callID: hermesToolCallProviderField(toolCall, "call_id"),
          responseItemID: hermesToolCallProviderField(toolCall, "response_item_id"),
          extraContent: hermesToolCallProviderField(toolCall, "extra_content"),
          finishReason: response.finish_reason,
          reasoningContent: hermesNormalizedResponseProviderField(response, "reasoning_content"),
          codexMessageItems: hermesNormalizedResponseProviderField(response, "codex_message_items"),
        },
        "agent.transports.types ToolCall exposes type='function', function=self, call_id/response_item_id/extra_content from provider_data; NormalizedResponse exposes reasoning_content/reasoning_details/codex items from provider_data and map_finish_reason falls back to stop.",
      ),
      eventCase(
        "codex-event-projector-reasoning-command",
        { method: "item/completed", itemTypes: ["reasoning", "commandExecution"] },
        {
          ignoredStreamingMessages: replay[0]?.messages.length,
          commandMessages: replay[2]?.messages,
          commandToolIteration: replay[2]?.is_tool_iteration,
        },
        "CodexEventProjector ignores non-item/completed events, stashes reasoning summary/content, then attaches it to the next commandExecution assistant tool_call and emits a tool result with non-zero exit prefix.",
      ),
      eventCase(
        "codex-event-projector-file-mcp-dynamic-tools",
        { itemTypes: ["fileChange", "mcpToolCall", "dynamicToolCall"] },
        {
          fileMessages: replay[3]?.messages,
          mcpMessages: replay[4]?.messages,
          dynamicMessages: replay[5]?.messages,
        },
        "CodexEventProjector maps fileChange to apply_patch with per-file kind/path digest, mcpToolCall to mcp.server.tool with JSON result/error content, and dynamicToolCall to the dynamic tool name with contentItems or success fallback.",
      ),
      eventCase(
        "codex-event-projector-user-agent-opaque-items",
        { itemTypes: ["userMessage", "plan", "agentMessage"] },
        {
          userMessages: replay[6]?.messages,
          opaqueMessages: replay[7]?.messages,
          finalMessages: replay[8]?.messages,
          finalText: replay[8]?.final_text,
        },
        "CodexEventProjector flattens userMessage text fragments only, records unknown items as opaque assistant notes without tool_calls, and emits agentMessage final_text from item.text.",
      ),
    ],
    replay,
    sourceRefs: [
      `${hermesEventUpstreamRef}:agent/transports/types.py#ToolCall,type,function,call_id,response_item_id,extra_content,Usage,NormalizedResponse,reasoning_content,reasoning_details,codex_reasoning_items,codex_message_items,build_tool_call,map_finish_reason`,
      `${hermesEventUpstreamRef}:agent/transports/codex_event_projector.py#_deterministic_call_id,_format_tool_args,ProjectionResult,CodexEventProjector,project,_project_agent_message,_project_user_message,_project_command,_project_file_change,_project_mcp_tool_call,_project_dynamic_tool_call,_project_opaque`,
    ],
    nativeEvidenceRefs: [hermesEventNativeExactEvidenceRef, hermesEventNativeExactReplayRef],
    fixtureIDs: [hermesEventNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptors: hermesEventNativeDescriptors.map((descriptor) => ({ ...descriptor })),
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyHermesEventNativeExactFixture(
  fixture: HermesEventNativeExactFixture,
): HermesEventNativeExactVerification {
  const canonical = buildHermesEventNativeExactFixture()
  const issues: HermesEventNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push(issue("fingerprint", "Fixture fingerprint no longer matches canonical Hermes event projection behavior."))
  }
  if (fixture.product !== "hermes-agent" || JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    issues.push(issue("identity", "Fixture must remain scoped to Hermes event envelope/runtime atoms and ports."))
  }
  if (
    fixture.upstreamRef !== hermesEventUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent/transports/types.py#ToolCall")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent/transports/codex_event_projector.py#_deterministic_call_id"))
  ) {
    issues.push(issue("upstream", "Fixture must stay pinned to Hermes upstream transport types and Codex event projector source anchors."))
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push(issue("native-claim", "Hermes event fixture must explicitly claim native-exact parity."))
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push(issue("lossiness", "Native exact Hermes event fixture must not carry known lossiness markers."))
  }
  if (!fixture.nativeEvidenceRefs.includes(hermesEventNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(hermesEventNativeExactReplayRef)) {
    issues.push(issue("evidence", "Hermes event native exact evidence refs are missing."))
  }
  if (!fixture.fixtureIDs.includes(hermesEventNativeExactFixtureID)) {
    issues.push(issue("fixture", "Hermes event native exact fixture ID is missing."))
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy) || JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push(issue("cases", "Hermes event policy or cases drifted from the native exact fixture."))
  }
  if (fixture.replay[2]?.messages[0]?.reasoning !== "plan\ndetail") {
    issues.push(issue("reasoning", "Reasoning item content must attach to the next materialized assistant/tool-call message."))
  }
  const commandToolCall = toolCallFromProjection(fixture.replay[2])
  if (commandToolCall?.function?.arguments !== '{"command": "npm test", "cwd": "/repo"}') {
    issues.push(issue("command-args", "Command execution arguments must match Hermes _format_tool_args ordering and separators."))
  }
  const fileToolCall = toolCallFromProjection(fixture.replay[3])
  if (fileToolCall?.function?.arguments !== '{"changes": [{"kind": "add", "path": "src/new.ts"}, {"kind": "update", "path": "src/existing.ts"}]}') {
    issues.push(issue("file-change", "File change projection must summarize kind/path without full file contents."))
  }
  if (fixture.replay[6]?.messages[0]?.content !== "hello\n42") {
    issues.push(issue("user-flatten", "User message projection must flatten text fragments and ignore non-text variants."))
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function hermesEventNativeDescriptor(
  id: HermesEventNativeExactAtomID,
  port: HermesEventNativeDescriptor["port"],
  selectionReason: string,
): HermesEventNativeDescriptor {
  return {
    id,
    port,
    product: "hermes-agent",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [hermesEventNativeExactEvidenceRef, hermesEventNativeExactReplayRef],
    fixtureIDs: [hermesEventNativeExactFixtureID],
    knownLossiness: [],
  }
}

function toolCallAssistantMessage(callID: string, name: string, args: Record<string, unknown>): Record<string, unknown> {
  return {
    role: "assistant",
    content: null,
    tool_calls: [
      {
        id: callID,
        type: "function",
        function: {
          name,
          arguments: formatHermesCodexToolArgs(args),
        },
      },
    ],
  }
}

function toolCallFromProjection(result: HermesProjectionResult | undefined): { function?: { arguments?: string } } | undefined {
  const message = result?.messages[0]
  const calls = Array.isArray(message?.tool_calls) ? message.tool_calls : []
  return calls[0] as { function?: { arguments?: string } } | undefined
}

function projectionResult(messages: Array<Record<string, unknown>> = [], isToolIteration = false, finalText: string | null = null): HermesProjectionResult {
  return { messages, is_tool_iteration: isToolIteration, final_text: finalText }
}

function eventCase(
  scenarioID: HermesEventNativeScenarioID,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  upstreamBehavior: string,
): HermesEventNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function pythonJSONDumps(value: unknown, options: { ensureAscii: boolean; sortKeys: boolean }): string {
  if (value === null || value === undefined) return "null"
  if (typeof value === "string") return quoteJSONString(value, options.ensureAscii)
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : String(value)
  if (typeof value === "boolean") return value ? "true" : "false"
  if (Array.isArray(value)) return `[${value.map((item) => pythonJSONDumps(item, options)).join(", ")}]`
  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, entry]) => entry !== undefined)
    if (options.sortKeys) entries.sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, entry]) => `${quoteJSONString(key, options.ensureAscii)}: ${pythonJSONDumps(entry, options)}`).join(", ")}}`
  }
  return "null"
}

function quoteJSONString(value: string, ensureAscii: boolean): string {
  const quoted = JSON.stringify(value)
  if (!ensureAscii) return quoted
  return quoted.replace(/[^\x00-\x7F]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`)
}

function pythonStr(value: unknown): string {
  if (value === undefined || value === null) return "None"
  if (value === true) return "True"
  if (value === false) return "False"
  return String(value)
}

function isPythonTruthy(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return false
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value)
  if (typeof value === "string") return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  return true
}

function stringOr(value: unknown, fallback: string): string {
  return value ? String(value) : fallback
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function issue(id: string, message: string): HermesEventNativeExactIssue {
  return { id: `hermes-event-native-exact.${id}`, message }
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
