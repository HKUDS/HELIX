import { createHash } from "node:crypto"

export const nanobotTraceUpstreamRef = "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
export const nanobotWebUITranscriptSchemaVersion = 3
export const nanobotMaxTranscriptFileBytes = 8 * 1024 * 1024
export const nanobotTraceDebugSurfaceNativeExactAtomID = "nanobot.trace.debug-surface"
export const nanobotTraceDebugSurfaceNativeExactFixtureID = "nanobot-trace-debug-surface:native-exact-fixture"
export const nanobotTraceDebugSurfaceNativeExactEvidenceRef = "conformance:nanobot-trace-debug-surface-native-exact-fixture"
export const nanobotTraceDebugSurfaceNativeExactReplayRef = "trace-debug-surface-native-exact:nanobot"

export type NanobotTraceDebugSurfaceNativeExactAtomID = typeof nanobotTraceDebugSurfaceNativeExactAtomID
export type NanobotTraceRecordSource = "webui_transcript" | "agent.runner"
export type NanobotTraceRecordEvent =
  | "transcript_path_resolved"
  | "transcript_jsonl_append"
  | "transcript_jsonl_readback"
  | "tool_trace_line"
  | "ui_message_fold"
  | "runner_checkpoint"
export type NanobotTraceFlowProjection =
  | "jsonl-transcript"
  | "tool-trace-format"
  | "webui-message-fold"
  | "runner-checkpoint-order"
export type NanobotTraceRedaction = "none-upstream-webui-transcript" | "not-applicable"

export interface NanobotTraceDebugRecord {
  sequence: number
  event: NanobotTraceRecordEvent
  source: NanobotTraceRecordSource
  transcriptEvent?: string | undefined
  sessionKey?: string | undefined
  transcriptPath?: string | undefined
  jsonlLine?: string | undefined
  messageRole?: string | undefined
  messageKind?: string | undefined
  content?: string | undefined
  traces?: string[] | undefined
  toolName?: string | undefined
  checkpointPhase?: string | undefined
  pendingToolCallCount?: number | undefined
  completedToolResultCount?: number | undefined
  redaction: NanobotTraceRedaction
  flowProjection: NanobotTraceFlowProjection
}

export interface NanobotTranscriptRecord {
  event?: unknown
  text?: unknown
  kind?: unknown
  media_paths?: unknown
  media_urls?: unknown
  tool_events?: unknown
  latency_ms?: unknown
  [key: string]: unknown
}

export interface NanobotUIMedia {
  kind?: string | undefined
  url?: string | undefined
  name?: string | undefined
  [key: string]: unknown
}

export interface NanobotUIMessage {
  id: string
  role: string
  content?: string | undefined
  kind?: string | undefined
  traces?: string[] | undefined
  reasoning?: string | undefined
  media?: NanobotUIMedia[] | undefined
  images?: Array<{ url: string | undefined; name: string | undefined }> | undefined
  latencyMs?: number | undefined
  createdAt: number
  isStreaming?: boolean | undefined
  reasoningStreaming?: boolean | undefined
  [key: string]: unknown
}

export interface NanobotTranscriptReadback {
  lines: NanobotTranscriptRecord[]
  skippedBecauseTooLarge: boolean
  skippedBadJSONLines: number
  skippedNonObjectLines: number
}

export interface NanobotRunnerCheckpointTraceInput {
  phase: "awaiting_tools" | "tools_completed" | "final_response" | string
  pendingToolCalls?: unknown[] | undefined
  completedToolResults?: unknown[] | undefined
  model?: string | undefined
}

export interface NanobotTraceReplayInput {
  sessionKey: string
  webuiDir: string
  transcriptObjects: NanobotTranscriptRecord[]
  rawTranscriptContent?: string | undefined
  timestampBaseMS?: number | undefined
  idSuffix?: string | undefined
  runnerCheckpoints?: NanobotRunnerCheckpointTraceInput[] | undefined
  augmentUserMedia?: ((paths: string[]) => NanobotUIMedia[]) | undefined
}

export interface NanobotWebUIThreadResponse {
  schemaVersion: typeof nanobotWebUITranscriptSchemaVersion
  sessionKey: string
  messages: NanobotUIMessage[]
}

export interface NanobotTraceReplayResult {
  records: NanobotTraceDebugRecord[]
  transcriptPath: string
  appendedLines: string[]
  readback: NanobotTranscriptReadback
  toolTraceLines: string[]
  uiMessages: NanobotUIMessage[]
  threadResponse: NanobotWebUIThreadResponse | null
}

export interface NanobotTraceNativeDescriptor {
  id: typeof nanobotTraceDebugSurfaceNativeExactAtomID
  port: "trace.recorder"
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof nanobotTraceDebugSurfaceNativeExactEvidenceRef, typeof nanobotTraceDebugSurfaceNativeExactReplayRef]
  fixtureIDs: [typeof nanobotTraceDebugSurfaceNativeExactFixtureID]
  knownLossiness: []
}

export type NanobotTraceNativeScenarioID =
  | "webui-transcript-jsonl-path-read-write"
  | "tool-trace-lines-from-progress-events"
  | "webui-message-fold-stream-reasoning-media-turn-end"
  | "runner-checkpoint-and-tool-event-order"

export interface NanobotTraceNativeExactCase {
  scenarioID: NanobotTraceNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface NanobotTraceNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomID: typeof nanobotTraceDebugSurfaceNativeExactAtomID
  portID: "trace.recorder"
  upstreamRef: typeof nanobotTraceUpstreamRef
  evidenceRef: typeof nanobotTraceDebugSurfaceNativeExactEvidenceRef
  fixtureID: typeof nanobotTraceDebugSurfaceNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    transcriptSchemaVersionIsThree: true
    transcriptPathUsesSessionManagerSafeKeyAndWebUIDir: true
    transcriptAppendUsesCompactJSONEnsureASCIIFalseAndFsyncBoundary: true
    transcriptReadSkipsMissingOversizeBlankBadJSONAndNonObjectLines: true
    toolTraceUsesOnlyStartEventsAndFunctionOrTopLevelName: true
    toolTraceStringArgumentsArePreservedAndDictArgumentsUsePythonJSONDumps: true
    replayFoldPreservesUserMediaReasoningDeltaToolTraceDeltaMessageAndTurnEndOrder: true
    mediaMessageSuppressesProgressUntilTurnEnd: true
    runnerCheckpointsPreserveAwaitingToolsToolsCompletedFinalResponseOrder: true
  }
  cases: NanobotTraceNativeExactCase[]
  replay: NanobotTraceReplayResult
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptor: NanobotTraceNativeDescriptor
  fingerprint: string
}

export interface NanobotTraceNativeExactIssue {
  id: string
  message: string
}

export interface NanobotTraceNativeExactVerification {
  ok: boolean
  issues: NanobotTraceNativeExactIssue[]
}

export const nanobotTraceDebugSurfaceNativeDescriptor: NanobotTraceNativeDescriptor = {
  id: nanobotTraceDebugSurfaceNativeExactAtomID,
  port: "trace.recorder",
  product: "nanobot",
  implementationKind: "factory",
  selectionReason: "Nanobot upstream native WebUI transcript JSONL, tool trace formatting, transcript-to-UI replay fold, and AgentRunner checkpoint ordering with native parity complete trace replay coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [nanobotTraceDebugSurfaceNativeExactEvidenceRef, nanobotTraceDebugSurfaceNativeExactReplayRef],
  fixtureIDs: [nanobotTraceDebugSurfaceNativeExactFixtureID],
  knownLossiness: [],
}

export const nanobotTraceNativeDescriptors = [nanobotTraceDebugSurfaceNativeDescriptor] as const

export function nanobotSafeTranscriptStem(sessionKey: string): string {
  return sessionKey.replaceAll(":", "_").replace(/[<>:"/\\|?*]/g, "_").trim()
}

export function nanobotWebUITranscriptPath(webuiDir: string, sessionKey: string): string {
  const base = webuiDir.replace(/\/+$/, "")
  return `${base}/${nanobotSafeTranscriptStem(sessionKey)}.jsonl`
}

export function appendNanobotTranscriptObject(
  obj: Record<string, unknown>,
  options: { maxBytes?: number | undefined } = {},
): string {
  const raw = JSON.stringify(obj)
  if (!raw) throw new Error("webui transcript object is not JSON serializable")
  if (Buffer.byteLength(raw, "utf8") > (options.maxBytes ?? nanobotMaxTranscriptFileBytes)) {
    throw new Error("webui transcript line too large")
  }
  return `${raw}\n`
}

export function readNanobotTranscriptLinesFromContent(
  content: string,
  options: { byteSize?: number | undefined; maxBytes?: number | undefined } = {},
): NanobotTranscriptReadback {
  const maxBytes = options.maxBytes ?? nanobotMaxTranscriptFileBytes
  const byteSize = options.byteSize ?? Buffer.byteLength(content, "utf8")
  if (byteSize > maxBytes) {
    return {
      lines: [],
      skippedBecauseTooLarge: true,
      skippedBadJSONLines: 0,
      skippedNonObjectLines: 0,
    }
  }
  const lines: NanobotTranscriptRecord[] = []
  let skippedBadJSONLines = 0
  let skippedNonObjectLines = 0
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(line) as unknown
    } catch {
      skippedBadJSONLines++
      continue
    }
    if (!isRecord(parsed)) {
      skippedNonObjectLines++
      continue
    }
    lines.push(parsed as NanobotTranscriptRecord)
  }
  return {
    lines,
    skippedBecauseTooLarge: false,
    skippedBadJSONLines,
    skippedNonObjectLines,
  }
}

export function formatNanobotToolCallTrace(call: unknown): string | null {
  if (!isRecord(call)) return null
  const fn = isRecord(call.function) ? call.function : undefined
  let name = typeof fn?.name === "string" ? fn.name : ""
  if (!name) name = typeof call.name === "string" ? call.name : ""
  if (!name) return null
  const fnArgs = fn?.arguments
  const args = isPythonTruthy(fnArgs) ? fnArgs : call.arguments
  if (typeof args === "string" && args.trim()) return `${name}(${args})`
  if (isPythonTruthy(args) && isRecord(args)) return `${name}(${pythonJSONDumps(args)})`
  return `${name}()`
}

export function nanobotToolTraceLinesFromEvents(events: unknown): string[] {
  if (!Array.isArray(events)) return []
  const lines: string[] = []
  for (const event of events) {
    if (!isRecord(event) || event.phase !== "start") continue
    const trace = formatNanobotToolCallTrace(event)
    if (trace) lines.push(trace)
  }
  return lines
}

export function replayNanobotTranscriptToUIMessages(
  lines: NanobotTranscriptRecord[],
  options: {
    augmentUserMedia?: ((paths: string[]) => NanobotUIMedia[]) | undefined
    timestampBaseMS?: number | undefined
    idSuffix?: string | undefined
  } = {},
): NanobotUIMessage[] {
  let messages: NanobotUIMessage[] = []
  let bufferMessageID: string | null = null
  let bufferParts: string[] = []
  let suppressUntilTurnEnd = false
  const timestampBaseMS = options.timestampBaseMS ?? 0
  const idSuffix = options.idSuffix ?? "00000000"

  const newID = (prefix: string, idx: number): string => `${prefix}-${idx}-${idSuffix}`
  const attachReasoningChunk = (prev: NanobotUIMessage[], chunk: string, idx: number): void => {
    for (let i = prev.length - 1; i >= 0; i--) {
      const candidate = prev[i]
      if (!candidate) continue
      if (candidate.role === "user") break
      if (candidate.kind === "trace") break
      if (candidate.role !== "assistant") continue
      const content = String(candidate.content ?? "")
      const hasAnswer = content.length > 0
      if (candidate.reasoningStreaming || candidate.reasoning !== undefined || hasAnswer || candidate.isStreaming) {
        prev[i] = {
          ...candidate,
          reasoning: String(candidate.reasoning ?? "") + chunk,
          reasoningStreaming: true,
        }
        return
      }
      if (!hasAnswer && candidate.isStreaming) {
        prev[i] = { ...candidate, reasoning: chunk, reasoningStreaming: true }
        return
      }
      break
    }
    prev.push({
      id: newID("as", idx),
      role: "assistant",
      content: "",
      isStreaming: true,
      reasoning: chunk,
      reasoningStreaming: true,
      createdAt: timestampBaseMS + idx,
    })
  }
  const findActivePlaceholder = (prev: NanobotUIMessage[]): string | null => {
    const last = prev[prev.length - 1]
    if (!last) return null
    if (last.role !== "assistant" || last.kind === "trace") return null
    if (String(last.content ?? "")) return null
    if (!last.isStreaming) return null
    return String(last.id)
  }
  const closeReasoning = (prev: NanobotUIMessage[]): void => {
    for (let i = prev.length - 1; i >= 0; i--) {
      if (prev[i]?.reasoningStreaming) {
        prev[i] = { ...prev[i]!, reasoningStreaming: false }
        return
      }
    }
  }
  const isReasoningOnlyPlaceholder = (message: NanobotUIMessage): boolean =>
    message.role === "assistant" &&
    message.kind !== "trace" &&
    !String(message.content ?? "").trim() &&
    Boolean(message.reasoning) &&
    !message.reasoningStreaming &&
    !message.media
  const isToolTraceAt = (index: number): boolean => {
    const message = messages[index]
    return Boolean(message && message.kind === "trace")
  }
  const pruneReasoningOnly = (): void => {
    const kept: NanobotUIMessage[] = []
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]
      if (message && isReasoningOnlyPlaceholder(message) && !isToolTraceAt(i + 1)) continue
      if (message) kept.push(message)
    }
    messages = kept
  }
  const stampLatency = (latencyMS: number): void => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      if (message?.role === "assistant" && message.kind !== "trace") {
        messages[i] = { ...message, latencyMs: Math.trunc(latencyMS), isStreaming: false }
        return
      }
    }
  }
  const absorbComplete = (extra: Partial<NanobotUIMessage>, idx: number): void => {
    const last = messages[messages.length - 1]
    if (last && isReasoningOnlyPlaceholder(last)) {
      messages[messages.length - 1] = {
        ...last,
        ...extra,
        isStreaming: false,
        reasoningStreaming: false,
      }
      return
    }
    messages.push({
      id: newID("as", idx),
      role: "assistant",
      createdAt: timestampBaseMS + idx,
      ...extra,
    })
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const rec = lines[idx]!
    const ev = rec.event
    if (ev === "user") {
      const text = rec.text
      const textValue = typeof text === "string" ? text : ""
      const mediaPaths = rec.media_paths
      const paths = Array.isArray(mediaPaths) ? mediaPaths.filter(Boolean).map((path) => String(path)) : []
      const mediaAttachments = paths.length > 0 && options.augmentUserMedia ? options.augmentUserMedia(paths) : undefined
      const row: NanobotUIMessage = {
        id: newID("u", idx),
        role: "user",
        content: textValue,
        createdAt: timestampBaseMS + idx,
      }
      if (mediaAttachments && mediaAttachments.length > 0) {
        row.media = mediaAttachments
        if (mediaAttachments.every((media) => media.kind === "image")) {
          row.images = mediaAttachments.map((media) => ({ url: media.url, name: media.name }))
        }
      }
      messages.push(row)
      continue
    }

    if (ev === "delta") {
      if (suppressUntilTurnEnd) continue
      const chunk = rec.text
      if (typeof chunk !== "string") continue
      const adopted: string | null = bufferMessageID === null ? findActivePlaceholder(messages) : null
      if (bufferMessageID === null) {
        if (adopted) {
          bufferMessageID = adopted
        } else {
          bufferMessageID = newID("buf", idx)
          messages.push({
            id: bufferMessageID,
            role: "assistant",
            content: "",
            isStreaming: true,
            createdAt: timestampBaseMS + idx,
          })
        }
      }
      bufferParts.push(chunk)
      const combined = bufferParts.join("")
      for (let i = 0; i < messages.length; i++) {
        if (messages[i]?.id === bufferMessageID) {
          messages[i] = { ...messages[i]!, content: combined, isStreaming: true }
          break
        }
      }
      continue
    }

    if (ev === "stream_end") {
      bufferMessageID = null
      bufferParts = []
      continue
    }

    if (ev === "reasoning_delta") {
      if (suppressUntilTurnEnd) continue
      const chunk = rec.text
      if (typeof chunk !== "string" || !chunk) continue
      attachReasoningChunk(messages, chunk, idx)
      continue
    }

    if (ev === "reasoning_end") {
      if (suppressUntilTurnEnd) continue
      closeReasoning(messages)
      continue
    }

    if (ev === "message") {
      const kind = rec.kind
      if (suppressUntilTurnEnd && (kind === "tool_hint" || kind === "progress" || kind === "reasoning")) continue
      if (kind === "reasoning") {
        const line = rec.text
        if (typeof line !== "string" || !line) continue
        attachReasoningChunk(messages, line, idx)
        closeReasoning(messages)
        continue
      }
      if (kind === "tool_hint" || kind === "progress") {
        const structured = nanobotToolTraceLinesFromEvents(rec.tool_events)
        const text = rec.text
        const traceLines = structured.length > 0 ? structured : (typeof text === "string" && text ? [text] : [])
        if (traceLines.length === 0) continue
        const last = messages[messages.length - 1]
        if (last && last.kind === "trace" && !last.isStreaming) {
          const previousTraces = Array.isArray(last.traces) ? [...last.traces] : [String(last.content ?? "")]
          const mergedTraces = [...previousTraces, ...traceLines]
          messages[messages.length - 1] = {
            ...last,
            traces: mergedTraces,
            content: traceLines[traceLines.length - 1],
          }
        } else {
          messages.push({
            id: newID("tr", idx),
            role: "tool",
            kind: "trace",
            content: traceLines[traceLines.length - 1],
            traces: traceLines,
            createdAt: timestampBaseMS + idx,
          })
        }
        continue
      }

      bufferMessageID = null
      bufferParts = []
      const content = typeof rec.text === "string" ? rec.text : ""
      const mediaURLs = rec.media_urls
      const media: NanobotUIMedia[] = []
      if (Array.isArray(mediaURLs)) {
        for (const item of mediaURLs) {
          if (isRecord(item) && item.url) {
            media.push({
              kind: "image",
              url: String(item.url),
              name: String(item.name || ""),
            })
          }
        }
      }
      const extra: Partial<NanobotUIMessage> = { content }
      if (media.length > 0) extra.media = media
      const latency = rec.latency_ms
      if (typeof latency === "number" && latency >= 0) extra.latencyMs = Math.trunc(latency)
      absorbComplete(extra, idx)
      if (media.length > 0) suppressUntilTurnEnd = true
      continue
    }

    if (ev === "turn_end") {
      suppressUntilTurnEnd = false
      for (let i = 0; i < messages.length; i++) {
        if (messages[i]?.isStreaming) messages[i] = { ...messages[i]!, isStreaming: false }
      }
      pruneReasoningOnly()
      const latency = rec.latency_ms
      if (typeof latency === "number" && latency >= 0) stampLatency(latency)
      bufferMessageID = null
      bufferParts = []
    }
  }

  return messages.map((message) => {
    const copy = { ...message }
    delete copy.isStreaming
    delete copy.reasoningStreaming
    return copy
  })
}

export function buildNanobotWebUIThreadResponse(
  sessionKey: string,
  lines: NanobotTranscriptRecord[],
  options: {
    augmentUserMedia?: ((paths: string[]) => NanobotUIMedia[]) | undefined
    timestampBaseMS?: number | undefined
    idSuffix?: string | undefined
  } = {},
): NanobotWebUIThreadResponse | null {
  if (lines.length === 0) return null
  return {
    schemaVersion: nanobotWebUITranscriptSchemaVersion,
    sessionKey,
    messages: replayNanobotTranscriptToUIMessages(lines, options),
  }
}

export function replayNanobotTraceDebugSurface(input: NanobotTraceReplayInput): NanobotTraceReplayResult {
  const records: NanobotTraceDebugRecord[] = []
  let sequence = 0
  const push = (record: Omit<NanobotTraceDebugRecord, "sequence">): void => {
    records.push({ sequence: sequence++, ...record })
  }
  const transcriptPath = nanobotWebUITranscriptPath(input.webuiDir, input.sessionKey)
  push({
    event: "transcript_path_resolved",
    source: "webui_transcript",
    sessionKey: input.sessionKey,
    transcriptPath,
    redaction: "not-applicable",
    flowProjection: "jsonl-transcript",
  })
  const appendedLines = input.transcriptObjects.map((obj) => {
    const line = appendNanobotTranscriptObject(obj)
    push({
      event: "transcript_jsonl_append",
      source: "webui_transcript",
      transcriptEvent: typeof obj.event === "string" ? obj.event : undefined,
      sessionKey: input.sessionKey,
      transcriptPath,
      jsonlLine: line,
      redaction: "none-upstream-webui-transcript",
      flowProjection: "jsonl-transcript",
    })
    return line
  })
  const rawTranscriptContent = input.rawTranscriptContent ?? appendedLines.join("")
  const readback = readNanobotTranscriptLinesFromContent(rawTranscriptContent)
  for (const line of readback.lines) {
    push({
      event: "transcript_jsonl_readback",
      source: "webui_transcript",
      transcriptEvent: typeof line.event === "string" ? line.event : undefined,
      sessionKey: input.sessionKey,
      transcriptPath,
      content: typeof line.text === "string" ? line.text : undefined,
      redaction: "none-upstream-webui-transcript",
      flowProjection: "jsonl-transcript",
    })
  }
  const toolTraceLines: string[] = []
  for (const line of readback.lines) {
    for (const trace of nanobotToolTraceLinesFromEvents(line.tool_events)) {
      toolTraceLines.push(trace)
      push({
        event: "tool_trace_line",
        source: "webui_transcript",
        transcriptEvent: typeof line.event === "string" ? line.event : undefined,
        messageKind: typeof line.kind === "string" ? line.kind : undefined,
        toolName: trace.slice(0, Math.max(0, trace.indexOf("("))),
        content: trace,
        redaction: "none-upstream-webui-transcript",
        flowProjection: "tool-trace-format",
      })
    }
  }
  const uiMessages = replayNanobotTranscriptToUIMessages(readback.lines, {
    augmentUserMedia: input.augmentUserMedia,
    timestampBaseMS: input.timestampBaseMS,
    idSuffix: input.idSuffix,
  })
  for (const message of uiMessages) {
    push({
      event: "ui_message_fold",
      source: "webui_transcript",
      messageRole: message.role,
      messageKind: message.kind,
      content: typeof message.content === "string" ? message.content : undefined,
      traces: message.traces ? [...message.traces] : undefined,
      redaction: "none-upstream-webui-transcript",
      flowProjection: "webui-message-fold",
    })
  }
  for (const checkpoint of input.runnerCheckpoints ?? []) {
    push({
      event: "runner_checkpoint",
      source: "agent.runner",
      checkpointPhase: checkpoint.phase,
      pendingToolCallCount: checkpoint.pendingToolCalls?.length ?? 0,
      completedToolResultCount: checkpoint.completedToolResults?.length ?? 0,
      content: checkpoint.model,
      redaction: "not-applicable",
      flowProjection: "runner-checkpoint-order",
    })
  }
  const threadResponse = buildNanobotWebUIThreadResponse(input.sessionKey, readback.lines, {
    augmentUserMedia: input.augmentUserMedia,
    timestampBaseMS: input.timestampBaseMS,
    idSuffix: input.idSuffix,
  })
  return {
    records,
    transcriptPath,
    appendedLines,
    readback,
    toolTraceLines,
    uiMessages,
    threadResponse,
  }
}

export function buildNanobotTraceNativeExactFixture(): NanobotTraceNativeExactFixture {
  const sessionKey = "websocket:chat-1"
  const transcriptObjects: NanobotTranscriptRecord[] = [
    { event: "user", text: "Inspect trace", media_paths: ["/tmp/plot.png"] },
    { event: "reasoning_delta", text: "plan " },
    {
      event: "message",
      kind: "progress",
      text: "running tools",
      tool_events: [
        { phase: "start", function: { name: "read_file", arguments: "{\"path\":\"/repo/a.ts\"}" } },
        { phase: "finish", name: "read_file", status: "ok" },
        { phase: "start", name: "write_file", arguments: { path: "/repo/out.txt", content: "你好" } },
      ],
    },
    { event: "message", kind: "tool_hint", text: "legacy hint" },
    { event: "delta", text: "Answer" },
    { event: "stream_end" },
    { event: "message", text: "Final with image", media_urls: [{ url: "/api/media/image.png", name: "image.png" }], latency_ms: 14.8 },
    { event: "message", kind: "progress", text: "suppressed until turn end" },
    { event: "turn_end", latency_ms: 15.2 },
  ]
  const appendedLines = transcriptObjects.map((obj) => appendNanobotTranscriptObject(obj))
  const rawTranscriptContent = `${appendedLines[0]}\nnot-json\n[]\n${appendedLines.slice(1).join("")}`
  const replay = replayNanobotTraceDebugSurface({
    sessionKey,
    webuiDir: "/repo/.nanobot/webui",
    transcriptObjects,
    rawTranscriptContent,
    timestampBaseMS: 1_780_000_000_000,
    idSuffix: "abcd1234",
    augmentUserMedia: (paths) => paths.map((path) => ({ kind: "image", url: `/api/media/local/${path.split("/").pop() ?? "file"}`, name: path.split("/").pop() ?? "" })),
    runnerCheckpoints: [
      { phase: "awaiting_tools", model: "gpt-4.1", pendingToolCalls: [{ name: "read_file" }], completedToolResults: [] },
      { phase: "tools_completed", model: "gpt-4.1", pendingToolCalls: [], completedToolResults: [{ name: "read_file" }] },
      { phase: "final_response", model: "gpt-4.1", pendingToolCalls: [], completedToolResults: [] },
    ],
  })
  const fixtureWithoutFingerprint: Omit<NanobotTraceNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "nanobot" as const,
    atomID: nanobotTraceDebugSurfaceNativeExactAtomID,
    portID: "trace.recorder" as const,
    upstreamRef: nanobotTraceUpstreamRef,
    evidenceRef: nanobotTraceDebugSurfaceNativeExactEvidenceRef,
    fixtureID: nanobotTraceDebugSurfaceNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      transcriptSchemaVersionIsThree: true as const,
      transcriptPathUsesSessionManagerSafeKeyAndWebUIDir: true as const,
      transcriptAppendUsesCompactJSONEnsureASCIIFalseAndFsyncBoundary: true as const,
      transcriptReadSkipsMissingOversizeBlankBadJSONAndNonObjectLines: true as const,
      toolTraceUsesOnlyStartEventsAndFunctionOrTopLevelName: true as const,
      toolTraceStringArgumentsArePreservedAndDictArgumentsUsePythonJSONDumps: true as const,
      replayFoldPreservesUserMediaReasoningDeltaToolTraceDeltaMessageAndTurnEndOrder: true as const,
      mediaMessageSuppressesProgressUntilTurnEnd: true as const,
      runnerCheckpointsPreserveAwaitingToolsToolsCompletedFinalResponseOrder: true as const,
    },
    cases: [
      traceCase(
        "webui-transcript-jsonl-path-read-write",
        { sessionKey, webuiDir: "/repo/.nanobot/webui", badLines: ["not-json", "[]"] },
        {
          schemaVersion: nanobotWebUITranscriptSchemaVersion,
          transcriptPath: replay.transcriptPath,
          firstLine: replay.appendedLines[0],
          readbackEvents: replay.readback.lines.map((line) => line.event),
          skippedBadJSONLines: replay.readback.skippedBadJSONLines,
          skippedNonObjectLines: replay.readback.skippedNonObjectLines,
        },
        "nanobot.utils.webui_transcript resolves get_webui_dir()/SessionManager.safe_key(session_key).jsonl, appends compact json.dumps(..., ensure_ascii=False, separators=(',', ':')) plus newline and fsync, and read_transcript_lines skips missing, oversize, blank, bad JSON, and non-dict JSONL entries.",
      ),
      traceCase(
        "tool-trace-lines-from-progress-events",
        { toolEvents: transcriptObjects[2]?.tool_events },
        { traceLines: replay.toolTraceLines },
        "tool_trace_lines_from_events reads only events with phase == 'start', formats function.name or top-level name, preserves non-empty string arguments verbatim, formats dict arguments with json.dumps(..., ensure_ascii=False), and ignores finish events.",
      ),
      traceCase(
        "webui-message-fold-stream-reasoning-media-turn-end",
        { transcriptEvents: transcriptObjects.map((line) => line.event) },
        {
          roles: replay.uiMessages.map((message) => message.role),
          traceLines: replay.uiMessages.find((message) => message.kind === "trace")?.traces,
          suppressedProgressAbsent: !replay.uiMessages.some((message) => message.content === "suppressed until turn end"),
          finalLatency: replay.uiMessages.at(-1)?.latencyMs,
          userImages: replay.uiMessages[0]?.images,
        },
        "replay_transcript_to_ui_messages folds user media, delta buffers, reasoning deltas, progress/tool_hint trace messages, media assistant messages, suppression until turn_end, turn_end latency stamping, and final removal of streaming flags in input order.",
      ),
      traceCase(
        "runner-checkpoint-and-tool-event-order",
        { phases: ["awaiting_tools", "tools_completed", "final_response"] },
        {
          checkpointPhases: replay.records.filter((record) => record.event === "runner_checkpoint").map((record) => record.checkpointPhase),
          pendingBeforeCompleted: replay.records.findIndex((record) => record.checkpointPhase === "awaiting_tools") < replay.records.findIndex((record) => record.checkpointPhase === "tools_completed"),
        },
        "AgentRunner emits checkpoint payloads at awaiting_tools, tools_completed, and final_response boundaries while tool_events are collected in execution order and later exposed to progress/webui transcript surfaces.",
      ),
    ],
    replay,
    sourceRefs: [
      `${nanobotTraceUpstreamRef}:nanobot/utils/webui_transcript.py#WEBUI_TRANSCRIPT_SCHEMA_VERSION,_MAX_TRANSCRIPT_FILE_BYTES,webui_transcript_path,read_transcript_lines,append_transcript_object,delete_webui_transcript,_format_tool_call_trace,tool_trace_lines_from_events,replay_transcript_to_ui_messages,build_webui_thread_response`,
      `${nanobotTraceUpstreamRef}:nanobot/session/manager.py#SessionManager.safe_key`,
      `${nanobotTraceUpstreamRef}:nanobot/utils/helpers.py#safe_filename`,
      `${nanobotTraceUpstreamRef}:nanobot/agent/runner.py#AgentRunSpec,AgentRunResult,AgentRunner,_build_request_kwargs,_request_model,_execute_tools,_run_tool,_emit_checkpoint,_normalize_tool_result`,
    ],
    nativeEvidenceRefs: [nanobotTraceDebugSurfaceNativeExactEvidenceRef, nanobotTraceDebugSurfaceNativeExactReplayRef],
    fixtureIDs: [nanobotTraceDebugSurfaceNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptor: { ...nanobotTraceDebugSurfaceNativeDescriptor },
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyNanobotTraceNativeExactFixture(
  fixture: NanobotTraceNativeExactFixture,
): NanobotTraceNativeExactVerification {
  const canonical = buildNanobotTraceNativeExactFixture()
  const issues: NanobotTraceNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push(issue("fingerprint", "Fixture fingerprint no longer matches canonical Nanobot trace debug-surface behavior."))
  }
  if (fixture.product !== "nanobot" || fixture.atomID !== nanobotTraceDebugSurfaceNativeExactAtomID || fixture.portID !== "trace.recorder") {
    issues.push(issue("identity", "Fixture must remain scoped to nanobot.trace.debug-surface on trace.recorder."))
  }
  if (
    fixture.upstreamRef !== nanobotTraceUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("nanobot/utils/webui_transcript.py#WEBUI_TRANSCRIPT_SCHEMA_VERSION")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("nanobot/agent/runner.py#AgentRunSpec"))
  ) {
    issues.push(issue("upstream", "Fixture must stay pinned to Nanobot upstream webui_transcript and AgentRunner source anchors."))
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push(issue("native-claim", "Nanobot trace fixture must explicitly claim native-exact parity."))
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptor.knownLossiness.length > 0) {
    issues.push(issue("lossiness", "Native exact Nanobot trace fixture must not carry known lossiness markers."))
  }
  if (!fixture.nativeEvidenceRefs.includes(nanobotTraceDebugSurfaceNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(nanobotTraceDebugSurfaceNativeExactReplayRef)) {
    issues.push(issue("evidence", "Nanobot trace native exact evidence refs are missing."))
  }
  if (!fixture.fixtureIDs.includes(nanobotTraceDebugSurfaceNativeExactFixtureID)) {
    issues.push(issue("fixture", "Nanobot trace native exact fixture ID is missing."))
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push(issue("policy", "Nanobot trace policy drifted from upstream transcript behavior."))
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push(issue("cases", "Nanobot trace cases drifted from the native exact fixture."))
  }
  const events = fixture.replay.records.map((record) => record.event)
  for (const expected of ["transcript_path_resolved", "transcript_jsonl_append", "transcript_jsonl_readback", "tool_trace_line", "ui_message_fold", "runner_checkpoint"] as const) {
    if (!events.includes(expected)) issues.push(issue(`event-${expected}`, `Replay is missing ${expected}.`))
  }
  const firstLine = fixture.replay.appendedLines[0] ?? ""
  if (!firstLine.endsWith("\n") || firstLine.includes("\\u4f60")) {
    issues.push(issue("jsonl-append", "Transcript append must use compact JSON with a newline and preserve non-ASCII text."))
  }
  if (fixture.replay.readback.skippedBadJSONLines !== 1 || fixture.replay.readback.skippedNonObjectLines !== 1) {
    issues.push(issue("readback-skip", "Transcript readback must skip one bad JSON line and one non-object line in the fixture."))
  }
  const traceMessage = fixture.replay.uiMessages.find((message) => message.kind === "trace")
  if (!traceMessage?.traces?.includes("legacy hint") || !traceMessage.traces.some((trace) => trace.includes("write_file"))) {
    issues.push(issue("tool-trace-fold", "Progress and tool_hint messages must fold into an ordered tool trace message."))
  }
  if (fixture.replay.uiMessages.some((message) => message.content === "suppressed until turn end")) {
    issues.push(issue("media-suppression", "Progress messages after media output must be suppressed until turn_end."))
  }
  if (fixture.replay.threadResponse?.schemaVersion !== nanobotWebUITranscriptSchemaVersion) {
    issues.push(issue("thread-response", "Thread response must carry WebUI transcript schema version 3."))
  }
  const checkpointPhases = fixture.replay.records.filter((record) => record.event === "runner_checkpoint").map((record) => record.checkpointPhase)
  if (checkpointPhases.join(">") !== "awaiting_tools>tools_completed>final_response") {
    issues.push(issue("runner-checkpoints", "Runner checkpoint trace must preserve awaiting_tools -> tools_completed -> final_response order."))
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function traceCase(
  scenarioID: NanobotTraceNativeScenarioID,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  upstreamBehavior: string,
): NanobotTraceNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function pythonJSONDumps(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : String(value)
  if (typeof value === "boolean") return value ? "true" : "false"
  if (Array.isArray(value)) return `[${value.map(pythonJSONDumps).join(", ")}]`
  if (isRecord(value)) {
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => `${JSON.stringify(key)}: ${pythonJSONDumps(entry)}`)
      .join(", ")}}`
  }
  return "null"
}

function isPythonTruthy(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return false
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value)
  if (typeof value === "string") return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function issue(id: string, message: string): NanobotTraceNativeExactIssue {
  return { id: `nanobot-trace-native-exact.${id}`, message }
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
