import { createHash } from "node:crypto"
import {
  createOpenCodeSessionMessageV2ProjectorBridge,
  type OpenCodeMessageV2ModelRef,
  type OpenCodeMessageV2UIMessage,
  type OpenCodeMessageV2WithParts,
} from "./opencode-session-message-v2-projector"

export type OpenCodeTurnContextBuilderMessage = OpenCodeMessageV2WithParts
export type OpenCodeTurnContextBuilderPart = OpenCodeTurnContextBuilderMessage["parts"][number]

export interface OpenCodeTurnContextBuilderLatest {
  user?: OpenCodeTurnContextBuilderMessage["info"]
  assistant?: OpenCodeTurnContextBuilderMessage["info"]
  finished?: OpenCodeTurnContextBuilderMessage["info"]
  tasks: OpenCodeTurnContextBuilderPart[]
}

export interface OpenCodeTurnContextBuilderInput {
  stream: OpenCodeTurnContextBuilderMessage[]
  model: OpenCodeMessageV2ModelRef
  step: number
  overflow?: boolean
  toolOutputMaxChars?: number
  stripMedia?: boolean
  syntheticMessageIDs?: string[]
  transformMessages?: (messages: OpenCodeTurnContextBuilderMessage[]) => void
}

export interface OpenCodeTurnContextBuilderOutput {
  selectedMessages: OpenCodeTurnContextBuilderMessage[]
  contextMessages: OpenCodeTurnContextBuilderMessage[]
  latest: {
    userID?: string
    assistantID?: string
    finishedID?: string
    taskTypes: string[]
  }
  decision:
    | { type: "exit"; reason: "finished-assistant"; orphanedInterruptedTool?: string }
    | { type: "subtask"; partID: string; agent: string }
    | { type: "compaction"; partID: string; auto: boolean; overflow?: boolean }
    | { type: "overflow-compaction"; parentID: string; agent: string; model: { providerID: string; modelID: string; variant?: string } }
    | { type: "provider-context"; bypassAgentCheck: boolean; reminderMessageIDs: string[]; transformApplied: boolean; modelMessages: OpenCodeMessageV2UIMessage[] }
}

export interface OpenCodeTurnContextBuilderBridge {
  filterCompacted(messages: OpenCodeTurnContextBuilderMessage[]): OpenCodeTurnContextBuilderMessage[]
  latest(messages: OpenCodeTurnContextBuilderMessage[]): OpenCodeTurnContextBuilderLatest
  buildContext(input: OpenCodeTurnContextBuilderInput): OpenCodeTurnContextBuilderOutput
}

export interface OpenCodeTurnContextBuilderNativeExactFixtureCase {
  id:
    | "filter-compacted-reorders-summary-tail-and-continuation"
    | "latest-uses-monotonic-message-id-and-unfinished-tasks"
    | "finished-assistant-exits-when-only-orphaned-interrupted-tool-remains"
    | "task-stack-pop-selects-newest-subtask-before-provider"
    | "unfinished-compaction-task-routes-to-compaction"
    | "overflow-after-finished-assistant-routes-to-auto-compaction"
    | "step-two-wraps-new-user-text-before-message-transform"
    | "message-v2-context-projects-to-provider-model-messages"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTurnContextBuilderNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.context-builder"
  portID: "turn.context-builder"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-context-builder-native-exact-fixture"
  replayRef: "turn-context-builder-native-exact:opencode"
  fixtureID: "opencode-turn-context-builder:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnContextBuilderNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnContextBuilderNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnContextBuilderNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnContextBuilderNativeExactFixtureIssue[]
}

export function createOpenCodeTurnContextBuilderBridge(): OpenCodeTurnContextBuilderBridge {
  return {
    filterCompacted,
    latest,
    buildContext,
  }
}

export function filterCompacted(messages: OpenCodeTurnContextBuilderMessage[]): OpenCodeTurnContextBuilderMessage[] {
  const result: OpenCodeTurnContextBuilderMessage[] = []
  const completed = new Set<string>()
  let retain: string | undefined
  for (const message of messages) {
    result.push(cloneMessage(message))
    if (retain) {
      if (message.info.id === retain) break
      continue
    }
    if (message.info.role === "user" && completed.has(message.info.id)) {
      const part = message.parts.find((item) => item.type === "compaction")
      if (!part) continue
      const tailStartID = stringAt(part, "tail_start_id")
      if (!tailStartID) break
      retain = tailStartID
      if (message.info.id === retain) break
      continue
    }
    if (message.info.role === "user" && completed.has(message.info.id) && message.parts.some((part) => part.type === "compaction")) break
    if (message.info.role === "assistant" && message.info.summary && message.info.finish && !message.info.error) {
      const parentID = stringAt(message.info, "parentID")
      if (parentID) completed.add(parentID)
    }
  }

  result.reverse()
  const compactionIndex = findLastIndex(result, (message) =>
    message.info.role === "user" &&
    message.parts.some((part) => part.type === "compaction" && stringAt(part, "tail_start_id") !== undefined),
  )
  const compaction = compactionIndex >= 0 ? result[compactionIndex] : undefined
  const part = compaction?.parts.find((item) => item.type === "compaction" && stringAt(item, "tail_start_id") !== undefined)
  const summaryIndex = compaction
    ? result.findIndex((message, index) =>
      index > compactionIndex &&
      message.info.role === "assistant" &&
      Boolean(message.info.summary) &&
      message.info.parentID === compaction.info.id,
    )
    : -1
  const tailStartID = part ? stringAt(part, "tail_start_id") : undefined
  const tailIndex = tailStartID ? result.findIndex((message) => message.info.id === tailStartID) : -1
  if (tailIndex >= 0 && tailIndex < compactionIndex && summaryIndex > compactionIndex) {
    return [
      ...result.slice(compactionIndex, summaryIndex + 1),
      ...result.slice(tailIndex, compactionIndex),
      ...result.slice(summaryIndex + 1),
    ]
  }
  return result
}

export function latest(messages: OpenCodeTurnContextBuilderMessage[]): OpenCodeTurnContextBuilderLatest {
  let user: OpenCodeTurnContextBuilderMessage["info"] | undefined
  let assistant: OpenCodeTurnContextBuilderMessage["info"] | undefined
  let finished: OpenCodeTurnContextBuilderMessage["info"] | undefined
  for (const message of messages) {
    const info = message.info
    if (info.role === "user" && (!user || info.id > user.id)) user = info
    if (info.role === "assistant" && (!assistant || info.id > assistant.id)) assistant = info
    if (info.role === "assistant" && info.finish && (!finished || info.id > finished.id)) finished = info
  }
  const tasks = messages.flatMap((message) =>
    finished && message.info.id <= finished.id
      ? []
      : message.parts.filter((part) => part.type === "compaction" || part.type === "subtask"),
  )
  return {
    ...(user ? { user } : {}),
    ...(assistant ? { assistant } : {}),
    ...(finished ? { finished } : {}),
    tasks,
  }
}

export function buildContext(input: OpenCodeTurnContextBuilderInput): OpenCodeTurnContextBuilderOutput {
  const selectedMessages = filterCompacted(input.stream)
  const summary = latest(selectedMessages)
  if (!summary.user) throw new Error("No user message found in stream. This should never happen.")

  const lastAssistantMessage = findLast(selectedMessages, (message) => message.info.role === "assistant" && message.info.id === summary.assistant?.id)
  const orphanedInterruptedTool = lastAssistantMessage?.parts.find((part) => part.type === "tool" && isOrphanedInterruptedTool(part))
  const hasToolCalls = lastAssistantMessage?.parts.some((part) => part.type === "tool" && !recordAt(part.metadata, ["providerExecuted"]) && !isOrphanedInterruptedTool(part)) ?? false
  if (
    summary.assistant?.finish &&
    !["tool-calls"].includes(String(summary.assistant.finish)) &&
    !hasToolCalls &&
    summary.user.id < summary.assistant.id
  ) {
    return {
      selectedMessages,
      contextMessages: cloneMessages(selectedMessages),
      latest: latestSummary(summary),
      decision: {
        type: "exit",
        reason: "finished-assistant",
        ...(orphanedInterruptedTool ? { orphanedInterruptedTool: stringAt(orphanedInterruptedTool, "callID") ?? orphanedInterruptedTool.id } : {}),
      },
    }
  }

  const task = summary.tasks.at(-1)
  if (task?.type === "subtask") {
    return {
      selectedMessages,
      contextMessages: cloneMessages(selectedMessages),
      latest: latestSummary(summary),
      decision: { type: "subtask", partID: task.id, agent: String(task.agent) },
    }
  }
  if (task?.type === "compaction") {
    return {
      selectedMessages,
      contextMessages: cloneMessages(selectedMessages),
      latest: latestSummary(summary),
      decision: { type: "compaction", partID: task.id, auto: Boolean(task.auto), ...(task.overflow === undefined ? {} : { overflow: Boolean(task.overflow) }) },
    }
  }
  if (summary.finished && !summary.finished.summary && input.overflow) {
    return {
      selectedMessages,
      contextMessages: cloneMessages(selectedMessages),
      latest: latestSummary(summary),
      decision: {
        type: "overflow-compaction",
        parentID: summary.user.id,
        agent: String(summary.user.agent),
        model: cloneUserModel(summary.user.model),
      },
    }
  }

  const contextMessages = cloneMessages(selectedMessages)
  const reminderMessageIDs = applyStepReminder(contextMessages, input.step, summary.finished?.id)
  const lastUserMessage = findLast(contextMessages, (message) => message.info.role === "user")
  const bypassAgentCheck = lastUserMessage?.parts.some((part) => part.type === "agent") ?? false
  input.transformMessages?.(contextMessages)
  const projector = createOpenCodeSessionMessageV2ProjectorBridge()
  const modelMessages = projector.projectToUIModelMessages({
    messages: contextMessages,
    model: input.model,
    options: {
      ...(input.stripMedia !== undefined ? { stripMedia: input.stripMedia } : {}),
      ...(input.toolOutputMaxChars !== undefined ? { toolOutputMaxChars: input.toolOutputMaxChars } : {}),
      ...(input.syntheticMessageIDs ? { syntheticMessageIDs: input.syntheticMessageIDs } : {}),
    },
  })
  return {
    selectedMessages,
    contextMessages,
    latest: latestSummary(summary),
    decision: {
      type: "provider-context",
      bypassAgentCheck,
      reminderMessageIDs,
      transformApplied: Boolean(input.transformMessages),
      modelMessages,
    },
  }
}

export function captureOpenCodeTurnContextBuilderNativeExactFixture(): OpenCodeTurnContextBuilderNativeExactFixture {
  const bridge = createOpenCodeTurnContextBuilderBridge()
  const model = modelRef("anthropic", "claude-sonnet", "@ai-sdk/anthropic")
  const compactedStream = [
    user("msg_060", [text("msg_060", "prt_continue", "continue after compaction")]),
    assistant("msg_050", "msg_040", { summary: true, finish: "stop" }, [text("msg_050", "prt_summary_text", "summary")]),
    user("msg_040", [compaction("msg_040", "prt_compact", { auto: true, tail_start_id: "msg_020" })]),
    assistant("msg_030", "msg_020", { finish: "tool-calls" }, [toolCompleted("msg_030", "prt_tool")]),
    user("msg_020", [text("msg_020", "prt_tail", "tail user")]),
    user("msg_010", [text("msg_010", "prt_old", "old user")]),
  ]
  const selected = bridge.filterCompacted(compactedStream)
  const selectedIDs = selected.map((message) => message.info.id)
  const latestFromSelected = bridge.latest(selected)

  const orphanExit = bridge.buildContext({
    stream: [
      assistant("msg_090", "msg_080", { finish: "stop" }, [
        toolError("msg_090", "prt_orphan", { interrupted: true, output: "partial" }),
      ]),
      user("msg_080", [text("msg_080", "prt_done", "done")]),
    ],
    model,
    step: 1,
  })

  const subtaskContext = bridge.buildContext({
    stream: [
      user("msg_070", [
        text("msg_070", "prt_user_task", "delegate"),
        subtask("msg_070", "prt_subtask", { agent: "reviewer" }),
      ]),
      assistant("msg_050", "msg_040", { finish: "stop" }, [text("msg_050", "prt_done", "done")]),
      user("msg_040", [text("msg_040", "prt_prev", "previous")]),
    ],
    model,
    step: 1,
  })

  const compactionContext = bridge.buildContext({
    stream: [
      user("msg_070", [compaction("msg_070", "prt_compaction_task", { auto: false, overflow: true })]),
      assistant("msg_050", "msg_040", { finish: "stop" }, [text("msg_050", "prt_done", "done")]),
      user("msg_040", [text("msg_040", "prt_prev", "previous")]),
    ],
    model,
    step: 1,
  })

  const overflowContext = bridge.buildContext({
    stream: [
      assistant("msg_070", "msg_060", { finish: "tool-calls", tokens: { total: 9000 } }, [text("msg_070", "prt_large", "large answer")]),
      user("msg_060", [text("msg_060", "prt_large_user", "large prompt")]),
    ],
    model,
    step: 1,
    overflow: true,
  })

  const reminderContext = bridge.buildContext({
    stream: [
      user("msg_070", [text("msg_070", "prt_new", "please continue"), { ...text("msg_070", "prt_ignored", "hidden"), ignored: true }]),
      assistant("msg_050", "msg_040", { finish: "tool-calls" }, [toolCompleted("msg_050", "prt_done_tool")]),
      user("msg_040", [text("msg_040", "prt_old_user", "old")]),
    ],
    model,
    step: 2,
    transformMessages(messages) {
      const firstUser = messages.find((message) => message.info.id === "msg_070")
      const firstText = firstUser?.parts.find((part) => part.type === "text" && !part.ignored)
      if (firstText && "text" in firstText) firstText.text = `${firstText.text}\n[plugin-transform]`
    },
  })

  const projectionContext = bridge.buildContext({
    stream: [
      user("msg_070", [
        text("msg_070", "prt_text", "hello"),
        file("msg_070", "prt_image", "image/png", "screen.png", "data:image/png;base64,aW1n"),
      ]),
      assistant("msg_060", "msg_050", { finish: "tool-calls" }, [
        text("msg_060", "prt_assistant_text", "working", { vendor: { id: "trace" } }),
        reasoning("msg_060", "prt_reasoning", "because", { anthropic: { signature: "sig" } }),
        toolCompleted("msg_060", "prt_tool_project", { output: "0123456789" }),
      ]),
      user("msg_050", [text("msg_050", "prt_prev", "previous")]),
    ],
    model,
    step: 1,
    toolOutputMaxChars: 5,
  })

  const cases: OpenCodeTurnContextBuilderNativeExactFixtureCase[] = [
    {
      id: "filter-compacted-reorders-summary-tail-and-continuation",
      actual: selectedIDs,
      expected: ["msg_040", "msg_050", "msg_020", "msg_030", "msg_060"],
    },
    {
      id: "latest-uses-monotonic-message-id-and-unfinished-tasks",
      actual: latestSummary(latestFromSelected),
      expected: { userID: "msg_060", assistantID: "msg_050", finishedID: "msg_050", taskTypes: [] },
    },
    {
      id: "finished-assistant-exits-when-only-orphaned-interrupted-tool-remains",
      actual: orphanExit.decision,
      expected: { type: "exit", reason: "finished-assistant", orphanedInterruptedTool: "call_prt_orphan" },
    },
    {
      id: "task-stack-pop-selects-newest-subtask-before-provider",
      actual: subtaskContext.decision,
      expected: { type: "subtask", partID: "prt_subtask", agent: "reviewer" },
    },
    {
      id: "unfinished-compaction-task-routes-to-compaction",
      actual: compactionContext.decision,
      expected: { type: "compaction", partID: "prt_compaction_task", auto: false, overflow: true },
    },
    {
      id: "overflow-after-finished-assistant-routes-to-auto-compaction",
      actual: overflowContext.decision,
      expected: { type: "overflow-compaction", parentID: "msg_060", agent: "build", model: { providerID: "anthropic", modelID: "claude-sonnet", variant: "thinking" } },
    },
    {
      id: "step-two-wraps-new-user-text-before-message-transform",
      actual: {
        reminderMessageIDs: reminderContext.decision.type === "provider-context" ? reminderContext.decision.reminderMessageIDs : [],
        text: reminderContext.contextMessages.find((message) => message.info.id === "msg_070")?.parts.find((part) => part.id === "prt_new"),
      },
      expected: {
        reminderMessageIDs: ["msg_070"],
        text: {
          id: "prt_new",
          sessionID: "ses_context",
          messageID: "msg_070",
          type: "text",
          text: [
            "<system-reminder>",
            "The user sent the following message:",
            "please continue",
            "",
            "Please address this message and continue with your tasks.",
            "</system-reminder>",
            "[plugin-transform]",
          ].join("\n"),
        },
      },
    },
    {
      id: "message-v2-context-projects-to-provider-model-messages",
      actual: projectionContext.decision.type === "provider-context" ? projectionContext.decision.modelMessages : [],
      expected: [
        { id: "msg_050", role: "user", parts: [{ type: "text", text: "previous" }] },
        {
          id: "msg_060",
          role: "assistant",
          parts: [
            { type: "text", text: "working", providerMetadata: { vendor: { id: "trace" } } },
            { type: "reasoning", text: "because", providerMetadata: { anthropic: { signature: "sig" } } },
            {
              type: "tool-bash",
              state: "output-available",
              toolCallId: "call_prt_tool_project",
              input: { command: "echo hi" },
              output: "01234\n[Tool output truncated for compaction: omitted 5 chars]",
            },
          ],
        },
        {
          id: "msg_070",
          role: "user",
          parts: [
            { type: "text", text: "hello" },
            { type: "file", url: "data:image/png;base64,aW1n", mediaType: "image/png", filename: "screen.png" },
          ],
        },
      ],
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.context-builder" as const,
    portID: "turn.context-builder" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-context-builder-native-exact-fixture" as const,
    replayRef: "turn-context-builder-native-exact:opencode" as const,
    fixtureID: "opencode-turn-context-builder:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#filterCompacted,latest,toModelMessagesEffect",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/prompt.ts#SessionPrompt.run,SessionReminders.apply,experimental.chat.messages.transform",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.ts#MessageV2.page,stream,findMessage",
      "fixture-share:opencode.session.projector.message-v2:opencode-session-message-v2-projector:native-exact-fixture",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return { ...fixtureWithoutFingerprint, fingerprint: fingerprintObject(fixtureWithoutFingerprint) }
}

export function verifyOpenCodeTurnContextBuilderNativeExactFixture(
  fixture: OpenCodeTurnContextBuilderNativeExactFixture,
): OpenCodeTurnContextBuilderNativeExactFixtureVerification {
  const issues: OpenCodeTurnContextBuilderNativeExactFixtureIssue[] = []
  if (fixture.atomID !== "opencode.turn.context-builder" || fixture.portID !== "turn.context-builder" || fixture.fixtureID !== "opencode-turn-context-builder:native-exact-fixture") {
    issues.push({ id: "opencode-turn-context-builder-native-exact.identity", message: "OpenCode turn context-builder fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-turn-context-builder-native-exact.native-claim", message: "OpenCode turn context-builder must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-turn-context-builder-native-exact.lossiness", message: "OpenCode turn context-builder native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/message-v2.ts", "session/prompt.ts", "session/session.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-turn-context-builder-native-exact.source", message: `OpenCode turn context-builder fixture lost pinned ${source} source.` })
    }
  }
  for (const required of [
    "filter-compacted-reorders-summary-tail-and-continuation",
    "latest-uses-monotonic-message-id-and-unfinished-tasks",
    "step-two-wraps-new-user-text-before-message-transform",
    "message-v2-context-projects-to-provider-model-messages",
  ]) {
    if (!fixture.cases.some((item) => item.id === required)) {
      issues.push({ id: "opencode-turn-context-builder-native-exact.case-coverage", caseID: required, message: `Missing native context-builder case ${required}.` })
    }
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-turn-context-builder-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned OpenCode context-builder behavior.` })
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-context-builder-native-exact.fingerprint", message: "OpenCode turn context-builder native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

function applyStepReminder(messages: OpenCodeTurnContextBuilderMessage[], step: number, lastFinishedID: string | undefined): string[] {
  if (step <= 1 || !lastFinishedID) return []
  const changed = new Set<string>()
  for (const message of messages) {
    if (message.info.role !== "user" || message.info.id <= lastFinishedID) continue
    for (const part of message.parts) {
      if (part.type !== "text" || part.ignored || part.synthetic) continue
      if (!("text" in part) || typeof part.text !== "string" || !part.text.trim()) continue
      part.text = [
        "<system-reminder>",
        "The user sent the following message:",
        part.text,
        "",
        "Please address this message and continue with your tasks.",
        "</system-reminder>",
      ].join("\n")
      changed.add(message.info.id)
    }
  }
  return [...changed]
}

function latestSummary(summary: OpenCodeTurnContextBuilderLatest): OpenCodeTurnContextBuilderOutput["latest"] {
  return {
    ...(summary.user ? { userID: summary.user.id } : {}),
    ...(summary.assistant ? { assistantID: summary.assistant.id } : {}),
    ...(summary.finished ? { finishedID: summary.finished.id } : {}),
    taskTypes: summary.tasks.map((task) => task.type),
  }
}

function isOrphanedInterruptedTool(part: OpenCodeTurnContextBuilderPart): boolean {
  return part.type === "tool" && recordAt(part.state, ["status"]) === "error" && recordAt(part.state, ["metadata", "interrupted"]) === true
}

function cloneUserModel(model: unknown): { providerID: string; modelID: string; variant?: string } {
  const record = isRecord(model) ? model : {}
  const providerID = typeof record.providerID === "string" ? record.providerID : ""
  const modelID = typeof record.modelID === "string" ? record.modelID : ""
  const variant = typeof record.variant === "string" ? record.variant : undefined
  return { providerID, modelID, ...(variant ? { variant } : {}) }
}

function recordAt(value: unknown, path: string[]): unknown {
  let current = value
  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }
  return current
}

function stringAt(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) return undefined
  const entry = value[key]
  return typeof entry === "string" ? entry : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function findLast<T>(items: T[], predicate: (item: T) => boolean): T | undefined {
  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index]
    if (item !== undefined && predicate(item)) return item
  }
  return undefined
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index]
    if (item !== undefined && predicate(item)) return index
  }
  return -1
}

function cloneMessages(messages: OpenCodeTurnContextBuilderMessage[]): OpenCodeTurnContextBuilderMessage[] {
  return messages.map(cloneMessage)
}

function cloneMessage(message: OpenCodeTurnContextBuilderMessage): OpenCodeTurnContextBuilderMessage {
  return JSON.parse(JSON.stringify(message)) as OpenCodeTurnContextBuilderMessage
}

function modelRef(providerID: string, id: string, npm: string): OpenCodeMessageV2ModelRef {
  return { providerID, id, api: { npm, id } }
}

function withParts(info: OpenCodeTurnContextBuilderMessage["info"], parts: OpenCodeTurnContextBuilderPart[]): OpenCodeTurnContextBuilderMessage {
  return { info, parts }
}

function user(id: string, parts: OpenCodeTurnContextBuilderPart[]): OpenCodeTurnContextBuilderMessage {
  return withParts({
    id,
    sessionID: "ses_context",
    role: "user",
    time: { created: Number(id.replace("msg_", "")) },
    agent: "build",
    model: { providerID: "anthropic", modelID: "claude-sonnet", variant: "thinking" },
  }, parts)
}

function assistant(
  id: string,
  parentID: string,
  extra: Record<string, unknown>,
  parts: OpenCodeTurnContextBuilderPart[],
): OpenCodeTurnContextBuilderMessage {
  return withParts({
    id,
    sessionID: "ses_context",
    role: "assistant",
    parentID,
    providerID: "anthropic",
    modelID: "claude-sonnet",
    time: { created: Number(id.replace("msg_", "")) },
    ...extra,
  }, parts)
}

function text(messageID: string, id: string, value: string, metadata?: Record<string, unknown>): OpenCodeTurnContextBuilderPart {
  return compactRecord({
    id,
    sessionID: "ses_context",
    messageID,
    type: "text",
    text: value,
    metadata,
  }) as OpenCodeTurnContextBuilderPart
}

function reasoning(messageID: string, id: string, value: string, metadata?: Record<string, unknown>): OpenCodeTurnContextBuilderPart {
  return compactRecord({
    id,
    sessionID: "ses_context",
    messageID,
    type: "reasoning",
    text: value,
    metadata,
  }) as OpenCodeTurnContextBuilderPart
}

function file(messageID: string, id: string, mime: string, filename: string, url: string): OpenCodeTurnContextBuilderPart {
  return { id, sessionID: "ses_context", messageID, type: "file", mime, filename, url } as OpenCodeTurnContextBuilderPart
}

function compaction(messageID: string, id: string, input: { auto: boolean; overflow?: boolean; tail_start_id?: string }): OpenCodeTurnContextBuilderPart {
  return compactRecord({
    id,
    sessionID: "ses_context",
    messageID,
    type: "compaction",
    auto: input.auto,
    overflow: input.overflow,
    tail_start_id: input.tail_start_id,
  }) as OpenCodeTurnContextBuilderPart
}

function subtask(messageID: string, id: string, input: { agent: string }): OpenCodeTurnContextBuilderPart {
  return {
    id,
    sessionID: "ses_context",
    messageID,
    type: "subtask",
    prompt: "review this",
    description: "review",
    agent: input.agent,
  } as OpenCodeTurnContextBuilderPart
}

function toolCompleted(messageID: string, id: string, input: { output?: string } = {}): OpenCodeTurnContextBuilderPart {
  return {
    id,
    sessionID: "ses_context",
    messageID,
    type: "tool",
    callID: `call_${id}`,
    tool: "bash",
    state: {
      status: "completed",
      input: { command: "echo hi" },
      output: input.output ?? "ok",
      title: "bash",
      metadata: {},
      time: { start: 1, end: 2 },
    },
  } as OpenCodeTurnContextBuilderPart
}

function toolError(messageID: string, id: string, metadata: Record<string, unknown>): OpenCodeTurnContextBuilderPart {
  return {
    id,
    sessionID: "ses_context",
    messageID,
    type: "tool",
    callID: `call_${id}`,
    tool: "bash",
    state: {
      status: "error",
      input: { command: "echo hi" },
      error: "interrupted",
      metadata,
      time: { start: 1, end: 2 },
    },
  } as OpenCodeTurnContextBuilderPart
}

function compactRecord<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableJSON(left) === stableJSON(right)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableJSON(value)).digest("hex").slice(0, 16)
}

function stableJSON(value: unknown): string {
  return JSON.stringify(sortStable(value))
}

function sortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortStable(entry)]),
  )
}
