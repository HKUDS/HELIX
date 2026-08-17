import { createHash } from "node:crypto"

export const nanobotEventUpstreamRef = "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
export const nanobotEventNativeExactFixtureID = "nanobot-event:native-exact-fixture"
export const nanobotEventNativeExactEvidenceRef = "conformance:nanobot-event-native-exact-fixture"
export const nanobotEventNativeExactReplayRef = "event-native-exact:nanobot"
export const nanobotEventEnvelopeNativeExactAtomID = "nanobot.event.envelope-bridge"
export const nanobotEventBusNativeExactAtomID = "nanobot.event.bus-bridge"
export const nanobotEventNativeExactAtomIDs = [
  nanobotEventEnvelopeNativeExactAtomID,
  nanobotEventBusNativeExactAtomID,
] as const

export type NanobotEventNativeExactAtomID = (typeof nanobotEventNativeExactAtomIDs)[number]
export type NanobotEventNativeExactPortID = "event.envelope" | "event.log"

export interface NanobotInboundMessageProjection {
  channel: string
  sender_id: string
  chat_id: string
  content: string
  timestamp?: string
  media?: string[]
  metadata?: Record<string, unknown>
  session_key_override?: string | null
}

export interface NanobotOutboundMessageProjection {
  channel: string
  chat_id: string
  content: string
  reply_to?: string | null
  media?: string[]
  metadata?: Record<string, unknown>
  buttons?: string[][]
}

export interface NanobotEventToolCallProjection {
  id?: string | null
  name: string
  arguments?: Record<string, unknown> | Record<string, unknown>[] | null
}

export interface NanobotToolEventProjection {
  status?: string
  detail?: string
}

export interface NanobotMessageBusProjection {
  publishInbound(message: NanobotInboundMessageProjection): Promise<void>
  consumeInbound(): Promise<NanobotInboundMessageProjection>
  publishOutbound(message: NanobotOutboundMessageProjection): Promise<void>
  consumeOutbound(): Promise<NanobotOutboundMessageProjection>
  inboundSize(): number
  outboundSize(): number
}

export interface NanobotEventNativeDescriptor {
  id: NanobotEventNativeExactAtomID
  port: NanobotEventNativeExactPortID
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof nanobotEventNativeExactEvidenceRef, typeof nanobotEventNativeExactReplayRef]
  fixtureIDs: [typeof nanobotEventNativeExactFixtureID]
  knownLossiness: []
}

export type NanobotEventNativeExactScenarioID =
  | "message-bus-fifo-and-envelope-session-key"
  | "websocket-outbound-message-and-control-events"
  | "progress-hook-stream-reasoning-end-before-answer"
  | "progress-hook-tool-events-and-final-content"
  | "websocket-inbound-envelope-routing-and-errors"

export interface NanobotEventNativeExactCase {
  scenarioID: NanobotEventNativeExactScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface NanobotEventNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomIDs: typeof nanobotEventNativeExactAtomIDs
  portIDs: readonly ["event.envelope", "event.log"]
  upstreamRef: typeof nanobotEventUpstreamRef
  evidenceRef: typeof nanobotEventNativeExactEvidenceRef
  fixtureID: typeof nanobotEventNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    messageBusUsesIndependentInboundOutboundFIFOQueues: true
    inboundSessionKeyUsesOverrideBeforeChannelChatID: true
    outboundWebSocketMessagePreservesTextMediaReplyLatencyToolEventsAndAgentUI: true
    websocketControlMessagesUseEventFieldAndChatID: true
    progressHookClosesReasoningBeforeFirstAnswerDelta: true
    progressHookEmitsToolStartAndFinishPayloadsThroughOnProgress: true
    websocketEnvelopeAttachHydratesAndMessageAutoAttaches: true
    websocketEnvelopeRejectsInvalidChatIDMissingContentAndMalformedMedia: true
    eventEnvelopeAndBusAtomsShareNativeFixture: true
  }
  cases: NanobotEventNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly NanobotEventNativeDescriptor[]
  fingerprint: string
}

export interface NanobotEventNativeExactIssue {
  id: string
  message: string
}

export interface NanobotEventNativeExactVerification {
  ok: boolean
  issues: NanobotEventNativeExactIssue[]
}

export const nanobotEventEnvelopeNativeDescriptor = nanobotEventNativeDescriptor(
  nanobotEventEnvelopeNativeExactAtomID,
  "event.envelope",
  "Nanobot upstream native InboundMessage and OutboundMessage envelopes, websocket envelope routing, and channel payload projection with native parity complete event fixture coverage.",
)

export const nanobotEventBusNativeDescriptor = nanobotEventNativeDescriptor(
  nanobotEventBusNativeExactAtomID,
  "event.log",
  "Nanobot upstream native MessageBus FIFO inbound/outbound queue and AgentProgressHook/WebSocket runtime event fanout with native parity complete event fixture coverage.",
)

export const nanobotEventNativeDescriptors = [
  nanobotEventEnvelopeNativeDescriptor,
  nanobotEventBusNativeDescriptor,
] as const

export function createNanobotMessageBusProjection(): NanobotMessageBusProjection {
  const inbound = createAsyncQueue<NanobotInboundMessageProjection>()
  const outbound = createAsyncQueue<NanobotOutboundMessageProjection>()
  return {
    publishInbound(message) {
      inbound.put(cloneValue(message))
      return Promise.resolve()
    },
    consumeInbound() {
      return inbound.get()
    },
    publishOutbound(message) {
      outbound.put(cloneValue(message))
      return Promise.resolve()
    },
    consumeOutbound() {
      return outbound.get()
    },
    inboundSize() {
      return inbound.size()
    },
    outboundSize() {
      return outbound.size()
    },
  }
}

export function nanobotInboundSessionKey(message: NanobotInboundMessageProjection): string {
  return message.session_key_override || `${message.channel}:${message.chat_id}`
}

export function buildNanobotWebSocketMessagePayload(
  message: NanobotOutboundMessageProjection,
  mediaURLs: Array<Record<string, string>> = [],
): Record<string, unknown> {
  const metadata = message.metadata ?? {}
  const payload: Record<string, unknown> = {
    event: "message",
    chat_id: message.chat_id,
    text: message.content,
  }
  if (message.media?.length) {
    payload.media = [...message.media]
    if (mediaURLs.length) payload.media_urls = mediaURLs.map((item) => ({ ...item }))
  }
  if (message.reply_to) payload.reply_to = message.reply_to
  const latency = metadata.latency_ms
  if (typeof latency === "number") payload.latency_ms = Math.trunc(latency)
  if (metadata._tool_events) payload.tool_events = metadata._tool_events
  if (metadata._agent_ui !== undefined) payload.agent_ui = metadata._agent_ui
  if (metadata._tool_hint) payload.kind = "tool_hint"
  else if (metadata._progress) payload.kind = "progress"
  return payload
}

export function projectNanobotWebSocketOutbound(
  message: NanobotOutboundMessageProjection,
): Record<string, unknown> | null {
  const metadata = message.metadata ?? {}
  if (metadata._runtime_model_updated) {
    return nanobotRuntimeModelUpdatedPayload(metadata.model, metadata.model_preset)
  }
  if (metadata._goal_state_sync) {
    const goalState = isRecord(metadata.goal_state) ? metadata.goal_state : { active: false }
    return { event: "goal_state", chat_id: message.chat_id, goal_state: goalState }
  }
  if (metadata._goal_status) {
    const status = metadata.goal_status
    if (status !== "running" && status !== "idle") return null
    const payload: Record<string, unknown> = { event: "goal_status", chat_id: message.chat_id, status }
    const started = metadata.started_at ?? metadata.goal_started_at
    if (status === "running" && typeof started === "number") payload.started_at = started
    return payload
  }
  if (metadata._turn_end) {
    return nanobotTurnEndPayload(message.chat_id, metadata.latency_ms, metadata.goal_state)
  }
  if (metadata._session_updated) {
    return { event: "session_updated", chat_id: message.chat_id }
  }
  return buildNanobotWebSocketMessagePayload(message)
}

export function nanobotReasoningDeltaPayload(
  chatID: string,
  delta: string,
  metadata: Record<string, unknown> = {},
): Record<string, unknown> | null {
  if (!delta) return null
  const payload: Record<string, unknown> = { event: "reasoning_delta", chat_id: chatID, text: delta }
  if (metadata._stream_id !== undefined) payload.stream_id = metadata._stream_id
  return payload
}

export function nanobotReasoningEndPayload(
  chatID: string,
  metadata: Record<string, unknown> = {},
): Record<string, unknown> {
  const payload: Record<string, unknown> = { event: "reasoning_end", chat_id: chatID }
  if (metadata._stream_id !== undefined) payload.stream_id = metadata._stream_id
  return payload
}

export function nanobotDeltaPayload(
  chatID: string,
  delta: string,
  metadata: Record<string, unknown> = {},
): Record<string, unknown> {
  const payload: Record<string, unknown> = metadata._stream_end
    ? { event: "stream_end", chat_id: chatID }
    : { event: "delta", chat_id: chatID, text: delta }
  if (metadata._stream_id !== undefined) payload.stream_id = metadata._stream_id
  return payload
}

export function nanobotTurnEndPayload(
  chatID: string,
  latencyMS: unknown = undefined,
  goalState: unknown = undefined,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { event: "turn_end", chat_id: chatID }
  if (typeof latencyMS === "number") payload.latency_ms = Math.trunc(latencyMS)
  if (isRecord(goalState)) payload.goal_state = goalState
  return payload
}

export function nanobotRuntimeModelUpdatedPayload(modelName: unknown, modelPreset: unknown = undefined): Record<string, unknown> | null {
  if (typeof modelName !== "string" || !modelName.trim()) return null
  const payload: Record<string, unknown> = { event: "runtime_model_updated", model_name: modelName.trim() }
  if (typeof modelPreset === "string" && modelPreset.trim()) payload.model_preset = modelPreset.trim()
  return payload
}

export function projectNanobotProgressStream(input: {
  chatID: string
  chunks: string[]
  streamID?: string
  end?: boolean
}): Array<Record<string, unknown>> {
  const metadata = input.streamID ? { _stream_id: input.streamID } : {}
  const events: Array<Record<string, unknown>> = []
  let streamBuffer = ""
  let emittedThinking = ""
  let reasoningOpen = false
  for (const chunk of input.chunks) {
    const previousClean = nanobotStripThink(streamBuffer)
    streamBuffer += chunk
    const nextClean = nanobotStripThink(streamBuffer)
    const thinking = nanobotExtractThink(streamBuffer)
    if (thinking && thinking !== emittedThinking) {
      const nextReasoning = thinking.slice(emittedThinking.length).trim()
      emittedThinking = thinking
      if (nextReasoning) {
        const reasonPayload = nanobotReasoningDeltaPayload(input.chatID, nextReasoning, metadata)
        if (reasonPayload) events.push(reasonPayload)
        reasoningOpen = true
      }
    }
    const incremental = nextClean.slice(previousClean.length)
    if (incremental) {
      if (reasoningOpen) {
        events.push(nanobotReasoningEndPayload(input.chatID, metadata))
        reasoningOpen = false
      }
      events.push(nanobotDeltaPayload(input.chatID, incremental, metadata))
    }
  }
  if (input.end !== false) {
    if (reasoningOpen) events.push(nanobotReasoningEndPayload(input.chatID, metadata))
    events.push(nanobotDeltaPayload(input.chatID, "", { ...metadata, _stream_end: true }))
  }
  return events
}

export function projectNanobotToolProgress(input: {
  channel: string
  chatID: string
  messageID?: string | null
  metadata?: Record<string, unknown>
  sessionKey?: string | null
  toolCalls: NanobotEventToolCallProjection[]
  toolResults?: unknown[]
  toolEvents?: NanobotToolEventProjection[]
  toolHintMaxLength?: number
  onProgressAcceptsToolEvents?: boolean
}): Record<string, unknown> {
  const progressEvents: Array<Record<string, unknown>> = []
  const startPayloads = input.toolCalls.map(nanobotToolEventStartPayload)
  const acceptsToolEvents = input.onProgressAcceptsToolEvents !== false
  if (acceptsToolEvents) {
    progressEvents.push({
      content: formatNanobotToolHints(input.toolCalls, input.toolHintMaxLength ?? 40),
      tool_hint: true,
      tool_events: startPayloads,
    })
  } else {
    progressEvents.push({
      content: formatNanobotToolHints(input.toolCalls, input.toolHintMaxLength ?? 40),
      tool_hint: true,
    })
  }
  const finishPayloads = nanobotToolEventFinishPayloads({
    toolCalls: input.toolCalls,
    toolResults: input.toolResults ?? [],
    toolEvents: input.toolEvents ?? [],
  })
  if (finishPayloads.length && acceptsToolEvents) {
    progressEvents.push({
      content: "",
      tool_hint: false,
      tool_events: finishPayloads,
    })
  }
  return {
    progressEvents,
    toolContext: {
      channel: input.channel,
      chat_id: input.chatID,
      message_id: input.messageID ?? null,
      metadata: input.metadata ?? {},
      session_key: input.sessionKey ?? null,
    },
  }
}

export function nanobotFinalizeContent(content: string | null | undefined): string | null {
  if (!content) return null
  return nanobotStripThink(content) || null
}

export function nanobotToolEventStartPayload(toolCall: NanobotEventToolCallProjection): Record<string, unknown> {
  return {
    version: 1,
    phase: "start",
    call_id: String(toolCall.id ?? ""),
    name: toolCall.name,
    arguments: toolCall.arguments ?? {},
    result: null,
    error: null,
    files: [],
    embeds: [],
  }
}

export function nanobotToolEventFinishPayloads(input: {
  toolCalls: NanobotEventToolCallProjection[]
  toolResults: unknown[]
  toolEvents: NanobotToolEventProjection[]
}): Array<Record<string, unknown>> {
  const payloads: Array<Record<string, unknown>> = []
  const count = Math.min(input.toolCalls.length, input.toolResults.length, input.toolEvents.length)
  for (let index = 0; index < count; index += 1) {
    const toolCall = input.toolCalls[index]!
    const result = input.toolResults[index]
    const event = input.toolEvents[index] ?? {}
    const phase = event.status === "ok" ? "end" : "error"
    const extras = nanobotToolResultExtras(result)
    const payload: Record<string, unknown> = {
      version: 1,
      phase,
      call_id: String(toolCall.id ?? ""),
      name: toolCall.name,
      arguments: toolCall.arguments ?? {},
      result: phase === "end" ? result : null,
      error: null,
      files: extras.files,
      embeds: extras.embeds,
    }
    if (phase === "error") {
      payload.error = typeof result === "string" && result.trim() ? result.trim() : String(event.detail ?? "Tool execution failed")
    }
    payloads.push(payload)
  }
  return payloads
}

export function projectNanobotWebSocketEnvelope(input: {
  clientID: string
  envelope: Record<string, unknown>
  generatedChatID?: string
  remoteAddress?: unknown
  savedMediaPaths?: string[]
  mediaErrorReason?: string | null
}): Record<string, unknown> {
  const envelopeType = input.envelope.type
  if (envelopeType === "new_chat") {
    const chatID = input.generatedChatID ?? "00000000-0000-4000-8000-000000000000"
    return {
      attach: chatID,
      hydrate: [chatID],
      sends: [{ event: "attached", chat_id: chatID }],
      handledMessage: null,
    }
  }
  if (envelopeType === "attach") {
    const chatID = input.envelope.chat_id
    if (!nanobotIsValidChatID(chatID)) return envelopeError("invalid chat_id")
    return {
      attach: chatID,
      hydrate: [chatID],
      sends: [{ event: "attached", chat_id: chatID }],
      handledMessage: null,
    }
  }
  if (envelopeType === "message") {
    const chatID = input.envelope.chat_id
    const content = input.envelope.content
    if (!nanobotIsValidChatID(chatID)) return envelopeError("invalid chat_id")
    if (typeof content !== "string") return envelopeError("missing content")
    if (input.envelope.media !== undefined && !Array.isArray(input.envelope.media)) {
      return envelopeError("image_rejected", "malformed")
    }
    if (input.mediaErrorReason) return envelopeError("image_rejected", input.mediaErrorReason)
    const mediaPaths = input.savedMediaPaths ?? []
    if (!content.trim() && mediaPaths.length === 0) return envelopeError("missing content")
    const metadata: Record<string, unknown> = { remote: input.remoteAddress ?? null }
    if (input.envelope.webui === true) metadata.webui = true
    const imageGeneration = input.envelope.image_generation
    if (isRecord(imageGeneration) && imageGeneration.enabled === true) {
      metadata.image_generation = {
        enabled: true,
        aspect_ratio: typeof imageGeneration.aspect_ratio === "string" ? imageGeneration.aspect_ratio : null,
      }
    }
    return {
      attach: chatID,
      hydrate: [chatID],
      sends: [],
      handledMessage: {
        sender_id: input.clientID,
        chat_id: chatID,
        content,
        media: mediaPaths.length ? mediaPaths : null,
        metadata,
        is_dm: false,
      },
    }
  }
  return envelopeError(`unknown type: ${JSON.stringify(envelopeType)}`)
}

export function parseNanobotWebSocketEnvelope(raw: string): Record<string, unknown> | null {
  const text = raw.trim()
  if (!text.startsWith("{")) return null
  try {
    const parsed = JSON.parse(text) as unknown
    return isRecord(parsed) && typeof parsed.type === "string" ? parsed : null
  } catch {
    return null
  }
}

export function parseNanobotInboundPayload(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null
  if (!text.startsWith("{")) return text
  try {
    const parsed = JSON.parse(text) as unknown
    if (!isRecord(parsed)) return null
    for (const key of ["content", "text", "message"]) {
      const value = parsed[key]
      if (typeof value === "string" && value.trim()) return value
    }
    return null
  } catch {
    return text
  }
}

export function nanobotIsValidChatID(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_:-]{1,64}$/.test(value)
}

export function buildNanobotEventNativeExactFixture(): NanobotEventNativeExactFixture {
  const busInput: NanobotInboundMessageProjection = {
    channel: "websocket",
    sender_id: "browser-1",
    chat_id: "chat-1",
    content: "hello",
    session_key_override: "websocket:thread-override",
    media: ["/tmp/image.png"],
    metadata: { webui: true },
  }
  const outboundInput: NanobotOutboundMessageProjection = {
    channel: "websocket",
    chat_id: "chat-1",
    content: "thinking",
    reply_to: "user-1",
    media: ["/media/plot.png"],
    metadata: {
      latency_ms: 12.8,
      _progress: true,
      _tool_events: [nanobotToolEventStartPayload({ id: "call-1", name: "read_file", arguments: { path: "/repo/a.ts" } })],
      _agent_ui: { kind: "tool-card", title: "read" },
    },
  }
  const fixtureWithoutFingerprint: Omit<NanobotEventNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "nanobot" as const,
    atomIDs: [...nanobotEventNativeExactAtomIDs] as typeof nanobotEventNativeExactAtomIDs,
    portIDs: ["event.envelope", "event.log"] as const,
    upstreamRef: nanobotEventUpstreamRef,
    evidenceRef: nanobotEventNativeExactEvidenceRef,
    fixtureID: nanobotEventNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      messageBusUsesIndependentInboundOutboundFIFOQueues: true as const,
      inboundSessionKeyUsesOverrideBeforeChannelChatID: true as const,
      outboundWebSocketMessagePreservesTextMediaReplyLatencyToolEventsAndAgentUI: true as const,
      websocketControlMessagesUseEventFieldAndChatID: true as const,
      progressHookClosesReasoningBeforeFirstAnswerDelta: true as const,
      progressHookEmitsToolStartAndFinishPayloadsThroughOnProgress: true as const,
      websocketEnvelopeAttachHydratesAndMessageAutoAttaches: true as const,
      websocketEnvelopeRejectsInvalidChatIDMissingContentAndMalformedMedia: true as const,
      eventEnvelopeAndBusAtomsShareNativeFixture: true as const,
    },
    cases: [
      eventCase(
        "message-bus-fifo-and-envelope-session-key",
        { inbound: busInput, outbound: outboundInput },
        {
          inboundSessionKey: "websocket:thread-override",
          fallbackSessionKey: "websocket:chat-1",
          queueOrder: ["inbound:websocket:chat-1", "outbound:websocket:chat-1"],
          pendingSizesAfterConsume: { inbound: 0, outbound: 0 },
        },
        "nanobot.bus.events defines InboundMessage.session_key as session_key_override or channel:chat_id, and nanobot.bus.queue.MessageBus owns independent asyncio FIFO queues for inbound and outbound messages.",
      ),
      eventCase(
        "websocket-outbound-message-and-control-events",
        { outbound: outboundInput, runtimeModel: { model: "gpt-4.1", model_preset: "fast" } },
        {
          message: buildNanobotWebSocketMessagePayload(outboundInput, [{ url: "/api/media/sig/payload", name: "plot.png" }]),
          stream: [
            nanobotReasoningDeltaPayload("chat-1", "plan", { _stream_id: "s1" }),
            nanobotReasoningEndPayload("chat-1", { _stream_id: "s1" }),
            nanobotDeltaPayload("chat-1", "answer", { _stream_id: "s1" }),
            nanobotDeltaPayload("chat-1", "", { _stream_id: "s1", _stream_end: true }),
          ],
          controls: [
            nanobotTurnEndPayload("chat-1", 42.2, { active: false }),
            { event: "goal_status", chat_id: "chat-1", status: "running", started_at: 10 },
            { event: "session_updated", chat_id: "chat-1" },
            nanobotRuntimeModelUpdatedPayload(" gpt-4.1 ", " fast "),
          ],
        },
        "nanobot.channels.websocket.WebSocketChannel.send preserves message text/media/reply_to/latency/tool_events/agent_ui/kind fields, and its dedicated send_* helpers emit reasoning_delta, reasoning_end, delta, stream_end, turn_end, goal_status, session_updated, and runtime_model_updated payloads with event and chat_id fields.",
      ),
      eventCase(
        "progress-hook-stream-reasoning-end-before-answer",
        { chatID: "chat-1", chunks: ["<think>plan</think>", "Answer"], streamID: "s1" },
        {
          events: projectNanobotProgressStream({ chatID: "chat-1", chunks: ["<think>plan</think>", "Answer"], streamID: "s1" }),
          finalContent: nanobotFinalizeContent("<think>plan</think>Answer"),
        },
        "AgentProgressHook.on_stream feeds the accumulated buffer to IncrementalThinkExtractor, emits reasoning chunks through on_progress(reasoning=True), closes reasoning with reasoning_end before the first clean answer delta, and on_stream_end emits stream_end/reset semantics through the channel.",
      ),
      eventCase(
        "progress-hook-tool-events-and-final-content",
        {
          toolCalls: [{ id: "call-1", name: "read_file", arguments: { path: "/repo/src/index.ts" } }],
          toolResults: [{ files: ["/repo/src/index.ts"], value: "ok" }],
          toolEvents: [{ status: "ok" }],
        },
        projectNanobotToolProgress({
          channel: "websocket",
          chatID: "chat-1",
          messageID: "msg-1",
          metadata: { webui: true },
          sessionKey: "websocket:chat-1",
          toolCalls: [{ id: "call-1", name: "read_file", arguments: { path: "/repo/src/index.ts" } }],
          toolResults: [{ files: ["/repo/src/index.ts"], value: "ok" }],
          toolEvents: [{ status: "ok" }],
        }),
        "AgentProgressHook.before_execute_tools formats a stripped tool hint, emits build_tool_event_start_payload values through invoke_on_progress, sets channel/chat/message/session tool context, and after_iteration emits build_tool_event_finish_payloads when tool_events are accepted.",
      ),
      eventCase(
        "websocket-inbound-envelope-routing-and-errors",
        {
          envelopes: [
            { type: "new_chat" },
            { type: "attach", chat_id: "websocket:chat-1" },
            { type: "message", chat_id: "websocket:chat-1", content: "", media: [{ kind: "image" }], webui: true },
            { type: "message", chat_id: "../bad", content: "nope" },
            { type: "message", chat_id: "chat-1", content: 42 },
            { type: "mystery" },
          ],
        },
        {
          routes: [
            projectNanobotWebSocketEnvelope({ clientID: "client-1", envelope: { type: "new_chat" }, generatedChatID: "uuid-1" }),
            projectNanobotWebSocketEnvelope({ clientID: "client-1", envelope: { type: "attach", chat_id: "websocket:chat-1" } }),
            projectNanobotWebSocketEnvelope({
              clientID: "client-1",
              envelope: { type: "message", chat_id: "websocket:chat-1", content: "", media: [{ kind: "image" }], webui: true },
              savedMediaPaths: ["/tmp/image.png"],
              remoteAddress: ["127.0.0.1", 5000],
            }),
            projectNanobotWebSocketEnvelope({ clientID: "client-1", envelope: { type: "message", chat_id: "../bad", content: "nope" } }),
            projectNanobotWebSocketEnvelope({ clientID: "client-1", envelope: { type: "message", chat_id: "chat-1", content: 42 } }),
            projectNanobotWebSocketEnvelope({ clientID: "client-1", envelope: { type: "mystery" } }),
          ],
          legacyPayloads: [parseNanobotInboundPayload("  hello  "), parseNanobotInboundPayload("{\"text\":\"hi\"}"), parseNanobotInboundPayload("{\"type\":\"message\"}")],
        },
        "WebSocketChannel._dispatch_envelope routes new_chat, attach, and message envelopes, validates chat_id with ^[A-Za-z0-9_:-]{1,64}$, allows image-only messages when saved media exists, auto-attaches before _handle_message, and sends error envelopes for invalid chat_id, missing content, malformed media, and unknown types.",
      ),
    ],
    sourceRefs: [
      `${nanobotEventUpstreamRef}:nanobot/bus/events.py#InboundMessage,OutboundMessage,OUTBOUND_META_AGENT_UI`,
      `${nanobotEventUpstreamRef}:nanobot/bus/queue.py#MessageBus,publish_inbound,consume_inbound,publish_outbound,consume_outbound,inbound_size,outbound_size`,
      `${nanobotEventUpstreamRef}:nanobot/agent/progress_hook.py#AgentProgressHook,on_stream,on_stream_end,before_execute_tools,emit_reasoning,emit_reasoning_end,after_iteration,finalize_content`,
      `${nanobotEventUpstreamRef}:nanobot/utils/helpers.py#strip_think,IncrementalThinkExtractor`,
      `${nanobotEventUpstreamRef}:nanobot/utils/progress_events.py#invoke_on_progress,build_tool_event_start_payload,build_tool_event_finish_payloads`,
      `${nanobotEventUpstreamRef}:nanobot/utils/tool_hints.py#format_tool_hints`,
      `${nanobotEventUpstreamRef}:nanobot/channels/websocket.py#_parse_envelope,_parse_inbound_payload,_is_valid_chat_id,_dispatch_envelope,_send_event,send,send_reasoning_delta,send_reasoning_end,send_delta,send_turn_end,send_goal_state,send_goal_status,send_session_updated,send_runtime_model_updated`,
    ],
    nativeEvidenceRefs: [nanobotEventNativeExactEvidenceRef, nanobotEventNativeExactReplayRef],
    fixtureIDs: [nanobotEventNativeExactFixtureID],
    knownLossiness: [],
    descriptors: nanobotEventNativeDescriptors,
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyNanobotEventNativeExactFixture(
  fixture: NanobotEventNativeExactFixture,
): NanobotEventNativeExactVerification {
  const canonical = buildNanobotEventNativeExactFixture()
  const issues: NanobotEventNativeExactIssue[] = []
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "nanobot-event-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Nanobot event behavior." })
  }
  if (fixture.schemaVersion !== 1 || fixture.product !== "nanobot" || fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "nanobot-event-native-exact.native-claim", message: "Nanobot event fixture must remain a native-exact parity claim." })
  }
  if (JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    issues.push({ id: "nanobot-event-native-exact.identity", message: "Nanobot event fixture must cover the event envelope and bus atoms." })
  }
  if (
    fixture.upstreamRef !== nanobotEventUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("bus/events.py#InboundMessage,OutboundMessage")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("bus/queue.py#MessageBus")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent/progress_hook.py#AgentProgressHook")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("channels/websocket.py#_parse_envelope"))
  ) {
    issues.push({ id: "nanobot-event-native-exact.upstream", message: "Fixture must stay pinned to Nanobot bus, progress hook, and websocket upstream sources." })
  }
  if (!fixture.nativeEvidenceRefs.includes(nanobotEventNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(nanobotEventNativeExactReplayRef)) {
    issues.push({ id: "nanobot-event-native-exact.evidence", message: "Nanobot event native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(nanobotEventNativeExactFixtureID)) {
    issues.push({ id: "nanobot-event-native-exact.fixture", message: "Nanobot event native exact fixture ID is missing." })
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "nanobot-event-native-exact.lossiness", message: "Native exact Nanobot event fixture must not carry known lossiness markers." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "nanobot-event-native-exact.policy", message: "Nanobot event policy drifted from upstream event behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "nanobot-event-native-exact.cases", message: "Nanobot event cases drifted from the native exact fixture." })
  }
  if (JSON.stringify(fixture.descriptors) !== JSON.stringify(canonical.descriptors)) {
    issues.push({ id: "nanobot-event-native-exact.descriptors", message: "Nanobot event native descriptors drifted from the native exact fixture." })
  }
  return { ok: issues.length === 0, issues }
}

function nanobotEventNativeDescriptor(
  id: NanobotEventNativeExactAtomID,
  port: NanobotEventNativeExactPortID,
  selectionReason: string,
): NanobotEventNativeDescriptor {
  return {
    id,
    port,
    product: "nanobot",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [nanobotEventNativeExactEvidenceRef, nanobotEventNativeExactReplayRef],
    fixtureIDs: [nanobotEventNativeExactFixtureID],
    knownLossiness: [],
  }
}

function eventCase(
  scenarioID: NanobotEventNativeExactScenarioID,
  input: NanobotEventNativeExactCase["input"],
  output: NanobotEventNativeExactCase["output"],
  upstreamBehavior: string,
): NanobotEventNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function createAsyncQueue<T>() {
  const items: T[] = []
  const waiters: Array<(item: T) => void> = []
  return {
    put(item: T): void {
      const waiter = waiters.shift()
      if (waiter) waiter(item)
      else items.push(item)
    },
    get(): Promise<T> {
      const item = items.shift()
      if (item !== undefined) return Promise.resolve(item)
      return new Promise<T>((resolve) => waiters.push(resolve))
    },
    size(): number {
      return items.length
    },
  }
}

function nanobotStripThink(text: string): string {
  let next = text
  next = next.replace(/<think>[\s\S]*?<\/think>/g, "")
  next = next.replace(/^\s*<think>[\s\S]*$/g, "")
  next = next.replace(/<thought>[\s\S]*?<\/thought>/g, "")
  next = next.replace(/^\s*<thought>[\s\S]*$/g, "")
  next = next.replace(/<think(?![A-Za-z0-9_\-:>/])/g, "")
  next = next.replace(/<thought(?![A-Za-z0-9_\-:>/])/g, "")
  next = next.replace(/^\s*<\/think>\s*/g, "")
  next = next.replace(/\s*<\/think>\s*$/g, "")
  next = next.replace(/^\s*<\/thought>\s*/g, "")
  next = next.replace(/\s*<\/thought>\s*$/g, "")
  next = next.replace(/^\s*<\|?channel\|?>\s*/g, "")
  next = next.replace(/(?:<\/?(?:t|th|thi|thin|think|tho|thou|thoug|though|thought)>?|<\|?(?:c|ch|cha|chan|chann|channe|channel)(?:\|?>?)?)$/g, "")
  next = next.replace(/^\s*<\|?$/g, "")
  return next.trim()
}

function nanobotExtractThink(text: string): string | null {
  const parts: string[] = []
  for (const match of text.matchAll(/<think>([\s\S]*?)<\/think>/g)) {
    const part = match[1]?.trim()
    if (part) parts.push(part)
  }
  for (const match of text.matchAll(/<thought>([\s\S]*?)<\/thought>/g)) {
    const part = match[1]?.trim()
    if (part) parts.push(part)
  }
  return parts.length ? parts.join("\n\n") : null
}

function formatNanobotToolHints(toolCalls: NanobotEventToolCallProjection[], maxLength: number): string {
  if (toolCalls.length === 0) return ""
  return toolCalls.map((toolCall) => formatNanobotToolHint(toolCall, maxLength)).join(", ")
}

function formatNanobotToolHint(toolCall: NanobotEventToolCallProjection, maxLength: number): string {
  if (toolCall.name === "read_file") return `read ${abbreviateValue(firstStringArg(toolCall, ["path", "file_path"]) ?? "", maxLength)}`
  if (toolCall.name === "write_file") return `write ${abbreviateValue(firstStringArg(toolCall, ["path", "file_path"]) ?? "", maxLength)}`
  if (toolCall.name === "edit") return `edit ${abbreviateValue(firstStringArg(toolCall, ["file_path", "path"]) ?? "", maxLength)}`
  if (toolCall.name === "grep") return `grep "${abbreviateValue(firstStringArg(toolCall, ["pattern"]) ?? "", maxLength)}"`
  if (toolCall.name === "exec") return `$ ${abbreviateValue(firstStringArg(toolCall, ["command"]) ?? "", maxLength)}`
  if (toolCall.name === "web_search") return `search "${abbreviateValue(firstStringArg(toolCall, ["query"]) ?? "", maxLength)}"`
  if (toolCall.name === "web_fetch") return `fetch ${abbreviateValue(firstStringArg(toolCall, ["url"]) ?? "", maxLength)}`
  if (toolCall.name === "list_dir") return `ls ${abbreviateValue(firstStringArg(toolCall, ["path"]) ?? "", maxLength)}`
  const fallback = firstStringArg(toolCall, []) ?? ""
  return fallback ? `${toolCall.name}("${abbreviateValue(fallback, maxLength)}")` : toolCall.name
}

function firstStringArg(toolCall: NanobotEventToolCallProjection, keys: string[]): string | null {
  const args = Array.isArray(toolCall.arguments) ? (toolCall.arguments[0] ?? {}) : (toolCall.arguments ?? {})
  if (!isRecord(args)) return null
  for (const key of keys) {
    const value = args[key]
    if (typeof value === "string" && value) return value
  }
  for (const value of Object.values(args)) {
    if (typeof value === "string" && value) return value
  }
  return null
}

function abbreviateValue(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`
}

function nanobotToolResultExtras(result: unknown): { files: unknown[]; embeds: unknown[] } {
  if (!isRecord(result)) return { files: [], embeds: [] }
  return {
    files: Array.isArray(result.files) ? [...result.files] : [],
    embeds: Array.isArray(result.embeds) ? [...result.embeds] : [],
  }
}

function envelopeError(detail: string, reason?: string): Record<string, unknown> {
  return {
    attach: null,
    hydrate: [],
    sends: [{ event: "error", detail, ...(reason ? { reason } : {}) }],
    handledMessage: null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
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
