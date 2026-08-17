import { createHash } from "node:crypto"

export type OpenCodeTraceToolInvocation =
  | {
    state: "call"
    step?: number
    toolCallId: string
    toolName: string
    args: unknown
  }
  | {
    state: "partial-call"
    step?: number
    toolCallId: string
    toolName: string
    args: unknown
  }
  | {
    state: "result"
    step?: number
    toolCallId: string
    toolName: string
    args: unknown
    result: string
  }

export type OpenCodeTraceMessagePart =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string; providerMetadata?: Record<string, unknown> }
  | { type: "tool-invocation"; toolInvocation: OpenCodeTraceToolInvocation }
  | { type: "source-url"; sourceId: string; url: string; title?: string; providerMetadata?: Record<string, unknown> }
  | { type: "file"; mediaType: string; filename?: string; url: string }
  | { type: "step-start" }

export interface OpenCodeTraceMessageInfo {
  id: string
  role: "user" | "assistant"
  parts: OpenCodeTraceMessagePart[]
  metadata: {
    time: {
      created: number
      completed?: number
    }
    sessionID: string
    tool: Record<string, {
      title: string
      snapshot?: string
      time: {
        start: number
        end: number
      }
      [key: string]: unknown
    }>
    assistant?: {
      system: string[]
      modelID: string
      providerID: string
      path: {
        cwd: string
        root: string
      }
      cost: number
      summary?: boolean
      tokens: {
        input: number
        output: number
        reasoning: number
        cache: {
          read: number
          write: number
        }
      }
    }
    snapshot?: string
  }
}

export type OpenCodeTraceSessionStatus =
  | { type: "idle" }
  | {
    type: "retry"
    attempt: number
    message: string
    action?: {
      reason: string
      provider: string
      title: string
      message: string
      label: string
      link?: string
    }
    next: number
  }
  | { type: "busy" }

export type OpenCodeTraceDebugEvent =
  | {
    type: "message.part"
    traceID: string
    sequence: number
    sessionID: string
    messageID: string
    role: "user" | "assistant"
    partIndex: number
    partType: OpenCodeTraceMessagePart["type"]
    payloadKeys: string[]
    redactedFields: string[]
    toolState?: OpenCodeTraceToolInvocation["state"]
    toolName?: string
    toolCallId?: string
  }
  | {
    type: "session.status"
    traceID: string
    sequence: number
    sessionID: string
    status: OpenCodeTraceSessionStatus
  }
  | {
    type: "session.idle"
    traceID: string
    sequence: number
    sessionID: string
  }

export interface OpenCodeTraceDebugReadback {
  traceID: string
  eventTypes: string[]
  redactedFields: string[]
}

export interface OpenCodeTraceDebugSurface {
  recordMessage(traceID: string, message: OpenCodeTraceMessageInfo): OpenCodeTraceDebugEvent[]
  setStatus(traceID: string, sessionID: string, status: OpenCodeTraceSessionStatus): OpenCodeTraceDebugEvent[]
  getStatus(sessionID: string): OpenCodeTraceSessionStatus
  listStatus(): Array<[string, OpenCodeTraceSessionStatus]>
  events(): OpenCodeTraceDebugEvent[]
  readback(traceID: string): OpenCodeTraceDebugReadback
}

export interface OpenCodeTraceDebugSurfaceNativeExactFixtureCase {
  id: "message-part-shape" | "status-service-order" | "trace-readback-redaction"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTraceDebugSurfaceNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.trace.debug-surface"
  portID: "trace.recorder"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-trace-debug-surface-native-exact-fixture"
  replayRef: "trace-debug-surface-native-exact:opencode"
  fixtureID: "opencode-trace-debug-surface:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: Array<{
    path: "packages/opencode/src/session/message.ts" | "packages/opencode/src/session/status.ts"
    symbols: string[]
    upstreamBehavior: string[]
  }>
  cases: OpenCodeTraceDebugSurfaceNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTraceDebugSurfaceNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTraceDebugSurfaceNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTraceDebugSurfaceNativeExactFixtureIssue[]
}

export function createOpenCodeTraceDebugSurface(): OpenCodeTraceDebugSurface {
  const recorded: OpenCodeTraceDebugEvent[] = []
  const statuses = new Map<string, OpenCodeTraceSessionStatus>()
  const nextSequence = () => recorded.length
  return {
    recordMessage(traceID, message) {
      const events = message.parts.map((part, index) =>
        openCodeTraceDebugMessagePartEvent(traceID, message, part, index, nextSequence() + index)
      )
      recorded.push(...events)
      return events.map(openCodeTraceDebugClone)
    },
    setStatus(traceID, sessionID, status) {
      const events: OpenCodeTraceDebugEvent[] = [
        { type: "session.status", traceID, sequence: nextSequence(), sessionID, status: openCodeTraceDebugClone(status) },
      ]
      if (status.type === "idle") {
        events.push({ type: "session.idle", traceID, sequence: nextSequence() + 1, sessionID })
        statuses.delete(sessionID)
      } else {
        statuses.set(sessionID, openCodeTraceDebugClone(status))
      }
      recorded.push(...events)
      return events.map(openCodeTraceDebugClone)
    },
    getStatus(sessionID) {
      return openCodeTraceDebugClone(statuses.get(sessionID) ?? { type: "idle" as const })
    },
    listStatus() {
      return [...statuses.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([sessionID, status]) => [sessionID, openCodeTraceDebugClone(status)])
    },
    events() {
      return recorded.map(openCodeTraceDebugClone)
    },
    readback(traceID) {
      return openCodeTraceDebugReadback(traceID, recorded)
    },
  }
}

export function openCodeTraceDebugMessagePartEvent(
  traceID: string,
  message: OpenCodeTraceMessageInfo,
  part: OpenCodeTraceMessagePart,
  partIndex: number,
  sequence = partIndex,
): OpenCodeTraceDebugEvent {
  const tool = part.type === "tool-invocation" ? part.toolInvocation : undefined
  return {
    type: "message.part",
    traceID,
    sequence,
    sessionID: message.metadata.sessionID,
    messageID: message.id,
    role: message.role,
    partIndex,
    partType: part.type,
    payloadKeys: openCodeTraceDebugPayloadKeys(part),
    redactedFields: openCodeTraceDebugRedactedFields(part),
    ...(tool ? { toolState: tool.state, toolName: tool.toolName, toolCallId: tool.toolCallId } : {}),
  }
}

export function openCodeTraceDebugReadback(traceID: string, events: OpenCodeTraceDebugEvent[]): OpenCodeTraceDebugReadback {
  const matching = events.filter((event) => event.traceID === traceID)
  return {
    traceID,
    eventTypes: matching.map((event) => event.type),
    redactedFields: uniqueStrings(matching.flatMap((event) => event.type === "message.part" ? event.redactedFields : [])),
  }
}

export function captureOpenCodeTraceDebugSurfaceNativeExactFixture(): OpenCodeTraceDebugSurfaceNativeExactFixture {
  const messageSurface = createOpenCodeTraceDebugSurface()
  const messageEvents = messageSurface.recordMessage("trace_message", openCodeTraceDebugFixtureMessage())

  const statusSurface = createOpenCodeTraceDebugSurface()
  const statusEvents = [
    ...statusSurface.setStatus("trace_status", "ses_status", { type: "busy" }),
    ...statusSurface.setStatus("trace_status", "ses_status", {
      type: "retry",
      attempt: 2,
      message: "rate limit",
      action: {
        reason: "rate-limit",
        provider: "opencode",
        title: "Retry",
        message: "Try again",
        label: "retry",
        link: "https://example.test/retry",
      },
      next: 1234,
    }),
    ...statusSurface.setStatus("trace_status", "ses_status", { type: "idle" }),
  ]
  const statusResult = {
    events: statusEvents,
    current: statusSurface.getStatus("ses_status"),
    list: statusSurface.listStatus(),
  }

  const readbackSurface = createOpenCodeTraceDebugSurface()
  readbackSurface.recordMessage("trace_readback", openCodeTraceDebugFixtureMessage())
  readbackSurface.setStatus("trace_readback", "ses_trace", { type: "busy" })
  const readback = readbackSurface.readback("trace_readback")

  const cases: OpenCodeTraceDebugSurfaceNativeExactFixtureCase[] = [
    {
      id: "message-part-shape",
      actual: messageEvents,
      expected: [
        {
          type: "message.part",
          traceID: "trace_message",
          sequence: 0,
          sessionID: "ses_trace",
          messageID: "msg_trace",
          role: "assistant",
          partIndex: 0,
          partType: "text",
          payloadKeys: ["text"],
          redactedFields: [],
        },
        {
          type: "message.part",
          traceID: "trace_message",
          sequence: 1,
          sessionID: "ses_trace",
          messageID: "msg_trace",
          role: "assistant",
          partIndex: 1,
          partType: "reasoning",
          payloadKeys: ["text", "providerMetadata"],
          redactedFields: ["providerMetadata"],
        },
        {
          type: "message.part",
          traceID: "trace_message",
          sequence: 2,
          sessionID: "ses_trace",
          messageID: "msg_trace",
          role: "assistant",
          partIndex: 2,
          partType: "tool-invocation",
          payloadKeys: ["toolInvocation.args", "toolInvocation.result", "toolInvocation.state", "toolInvocation.step", "toolInvocation.toolCallId", "toolInvocation.toolName"],
          redactedFields: ["toolInvocation.args", "toolInvocation.result"],
          toolState: "result",
          toolName: "bash",
          toolCallId: "call_trace",
        },
        {
          type: "message.part",
          traceID: "trace_message",
          sequence: 3,
          sessionID: "ses_trace",
          messageID: "msg_trace",
          role: "assistant",
          partIndex: 3,
          partType: "source-url",
          payloadKeys: ["sourceId", "url", "title", "providerMetadata"],
          redactedFields: ["url", "providerMetadata"],
        },
        {
          type: "message.part",
          traceID: "trace_message",
          sequence: 4,
          sessionID: "ses_trace",
          messageID: "msg_trace",
          role: "assistant",
          partIndex: 4,
          partType: "file",
          payloadKeys: ["mediaType", "filename", "url"],
          redactedFields: ["url"],
        },
        {
          type: "message.part",
          traceID: "trace_message",
          sequence: 5,
          sessionID: "ses_trace",
          messageID: "msg_trace",
          role: "assistant",
          partIndex: 5,
          partType: "step-start",
          payloadKeys: [],
          redactedFields: [],
        },
      ],
    },
    {
      id: "status-service-order",
      actual: statusResult,
      expected: {
        events: [
          { type: "session.status", traceID: "trace_status", sequence: 0, sessionID: "ses_status", status: { type: "busy" } },
          {
            type: "session.status",
            traceID: "trace_status",
            sequence: 1,
            sessionID: "ses_status",
            status: {
              type: "retry",
              attempt: 2,
              message: "rate limit",
              action: {
                reason: "rate-limit",
                provider: "opencode",
                title: "Retry",
                message: "Try again",
                label: "retry",
                link: "https://example.test/retry",
              },
              next: 1234,
            },
          },
          { type: "session.status", traceID: "trace_status", sequence: 2, sessionID: "ses_status", status: { type: "idle" } },
          { type: "session.idle", traceID: "trace_status", sequence: 3, sessionID: "ses_status" },
        ],
        current: { type: "idle" },
        list: [],
      },
    },
    {
      id: "trace-readback-redaction",
      actual: readback,
      expected: {
        traceID: "trace_readback",
        eventTypes: ["message.part", "message.part", "message.part", "message.part", "message.part", "message.part", "session.status"],
        redactedFields: ["providerMetadata", "toolInvocation.args", "toolInvocation.result", "url"],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.trace.debug-surface" as const,
    portID: "trace.recorder" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-trace-debug-surface-native-exact-fixture" as const,
    replayRef: "trace-debug-surface-native-exact:opencode" as const,
    fixtureID: "opencode-trace-debug-surface:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      {
        path: "packages/opencode/src/session/message.ts" as const,
        symbols: ["MessagePart", "ToolInvocation", "TextPart", "ReasoningPart", "ToolInvocationPart", "SourceUrlPart", "FilePart", "StepStartPart"],
        upstreamBehavior: ["discriminated message part union", "tool invocation state discriminator", "provider metadata and URL redaction boundary"],
      },
      {
        path: "packages/opencode/src/session/status.ts" as const,
        symbols: ["Info", "Event", "Service", "get", "list", "set"],
        upstreamBehavior: ["idle default", "session.status publish before state mutation", "session.idle publish and delete on idle"],
      },
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeTraceDebugSurfaceNativeExactFixture(
  fixture: OpenCodeTraceDebugSurfaceNativeExactFixture,
): OpenCodeTraceDebugSurfaceNativeExactFixtureVerification {
  const issues: OpenCodeTraceDebugSurfaceNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-trace-debug-surface-native-exact.schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.trace.debug-surface" || fixture.portID !== "trace.recorder") {
    add("opencode-trace-debug-surface-native-exact.target", "Fixture must target opencode.trace.debug-surface and trace.recorder.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-trace-debug-surface-native-exact.native-claim", "Trace debug surface fixture must explicitly claim native exact parity.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-trace-debug-surface-native-exact.lossiness", "Native exact trace debug surface fixture cannot retain known lossiness.")
  }
  const sourcePaths = fixture.sourceRefs.map((source) => source.path)
  for (const path of ["packages/opencode/src/session/message.ts", "packages/opencode/src/session/status.ts"]) {
    if (!sourcePaths.includes(path as typeof sourcePaths[number])) {
      add("opencode-trace-debug-surface-native-exact.source", `Missing upstream source ref ${path}.`)
    }
  }
  for (const testCase of fixture.cases) {
    if (!deepEqual(testCase.actual, testCase.expected)) {
      add("opencode-trace-debug-surface-native-exact.case", "Case actual output must match expected pinned upstream trace behavior.", testCase.id)
    }
  }
  const expectedFingerprint = fingerprintObject({
    ...fixture,
    fingerprint: undefined,
  })
  if (fixture.fingerprint !== expectedFingerprint) {
    add("opencode-trace-debug-surface-native-exact.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeTraceDebugFixtureMessage(): OpenCodeTraceMessageInfo {
  return {
    id: "msg_trace",
    role: "assistant",
    parts: [
      { type: "text", text: "visible text" },
      { type: "reasoning", text: "chain summary", providerMetadata: { trace: "hidden" } },
      {
        type: "tool-invocation",
        toolInvocation: {
          state: "result",
          step: 1,
          toolCallId: "call_trace",
          toolName: "bash",
          args: { command: "pwd" },
          result: "/home/project",
        },
      },
      { type: "source-url", sourceId: "src_1", url: "https://example.test/private", title: "doc", providerMetadata: { id: "p1" } },
      { type: "file", mediaType: "text/plain", filename: "notes.txt", url: "file:///tmp/notes.txt" },
      { type: "step-start" },
    ],
    metadata: {
      sessionID: "ses_trace",
      time: { created: 1000, completed: 1100 },
      tool: {},
      assistant: {
        system: ["system prompt"],
        modelID: "gpt-5",
        providerID: "opencode",
        path: { cwd: "/work", root: "/work" },
        cost: 0.01,
        tokens: {
          input: 10,
          output: 5,
          reasoning: 2,
          cache: { read: 1, write: 0 },
        },
      },
    },
  }
}

function openCodeTraceDebugPayloadKeys(part: OpenCodeTraceMessagePart): string[] {
  if (part.type === "text") return ["text"]
  if (part.type === "reasoning") return ["text", ...("providerMetadata" in part ? ["providerMetadata"] : [])]
  if (part.type === "tool-invocation") {
    return [
      "toolInvocation.args",
      ...(part.toolInvocation.state === "result" ? ["toolInvocation.result"] : []),
      "toolInvocation.state",
      ...("step" in part.toolInvocation ? ["toolInvocation.step"] : []),
      "toolInvocation.toolCallId",
      "toolInvocation.toolName",
    ]
  }
  if (part.type === "source-url") return ["sourceId", "url", ...("title" in part ? ["title"] : []), ...("providerMetadata" in part ? ["providerMetadata"] : [])]
  if (part.type === "file") return ["mediaType", ...("filename" in part ? ["filename"] : []), "url"]
  return []
}

function openCodeTraceDebugRedactedFields(part: OpenCodeTraceMessagePart): string[] {
  if (part.type === "reasoning" && "providerMetadata" in part) return ["providerMetadata"]
  if (part.type === "tool-invocation") {
    return ["toolInvocation.args", ...(part.toolInvocation.state === "result" ? ["toolInvocation.result"] : [])]
  }
  if (part.type === "source-url") return ["url", ...("providerMetadata" in part ? ["providerMetadata"] : [])]
  if (part.type === "file") return ["url"]
  return []
}

function openCodeTraceDebugClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort()
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex").slice(0, 16)
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stable(item)]))
  }
  return value
}
