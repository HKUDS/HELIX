import { createHash } from "node:crypto"

export const OPENCODE_MESSAGE_V2_SYNTHETIC_ATTACHMENT_PROMPT = "Attached media from tool result:"

export type OpenCodeMessageV2Role = "user" | "assistant"

export interface OpenCodeMessageV2ModelRef {
  providerID: string
  id: string
  api: {
    npm: string
    id: string
  }
}

export interface OpenCodeMessageV2Info {
  id: string
  sessionID: string
  role: OpenCodeMessageV2Role
  providerID?: string | undefined
  modelID?: string | undefined
  parentID?: string | undefined
  error?: unknown
  [key: string]: unknown
}

export interface OpenCodeMessageV2PartBase {
  id: string
  sessionID: string
  messageID: string
  type: string
  [key: string]: unknown
}

export interface OpenCodeMessageV2TextPart extends OpenCodeMessageV2PartBase {
  type: "text"
  text: string
  ignored?: boolean | undefined
  metadata?: Record<string, unknown> | undefined
}

export interface OpenCodeMessageV2ReasoningPart extends OpenCodeMessageV2PartBase {
  type: "reasoning"
  text: string
  metadata?: Record<string, unknown> | undefined
}

export interface OpenCodeMessageV2FilePart extends OpenCodeMessageV2PartBase {
  type: "file"
  mime: string
  url: string
  filename?: string | undefined
}

export interface OpenCodeMessageV2CompactionPart extends OpenCodeMessageV2PartBase {
  type: "compaction"
  auto: boolean
  tail_start_id?: string | undefined
}

export interface OpenCodeMessageV2SubtaskPart extends OpenCodeMessageV2PartBase {
  type: "subtask"
  prompt: string
  description: string
  agent: string
}

export interface OpenCodeMessageV2ToolStatePending {
  status: "pending"
  input: Record<string, unknown>
  raw: string
}

export interface OpenCodeMessageV2ToolStateRunning {
  status: "running"
  input: Record<string, unknown>
  title?: string | undefined
  metadata?: Record<string, unknown> | undefined
  time: { start: number }
}

export interface OpenCodeMessageV2ToolStateCompleted {
  status: "completed"
  input: Record<string, unknown>
  output: string
  title: string
  metadata: Record<string, unknown>
  time: {
    start: number
    end: number
    compacted?: number | undefined
  }
  attachments?: OpenCodeMessageV2FilePart[] | undefined
}

export interface OpenCodeMessageV2ToolStateError {
  status: "error"
  input: Record<string, unknown>
  error: string
  metadata?: Record<string, unknown> | undefined
  time: {
    start: number
    end: number
  }
}

export type OpenCodeMessageV2ToolState =
  | OpenCodeMessageV2ToolStatePending
  | OpenCodeMessageV2ToolStateRunning
  | OpenCodeMessageV2ToolStateCompleted
  | OpenCodeMessageV2ToolStateError

export interface OpenCodeMessageV2ToolPart extends OpenCodeMessageV2PartBase {
  type: "tool"
  callID: string
  tool: string
  state: OpenCodeMessageV2ToolState
  metadata?: Record<string, unknown> | undefined
}

export interface OpenCodeMessageV2StepStartPart extends OpenCodeMessageV2PartBase {
  type: "step-start"
  snapshot?: string | undefined
}

export type OpenCodeMessageV2Part =
  | OpenCodeMessageV2TextPart
  | OpenCodeMessageV2ReasoningPart
  | OpenCodeMessageV2FilePart
  | OpenCodeMessageV2CompactionPart
  | OpenCodeMessageV2SubtaskPart
  | OpenCodeMessageV2ToolPart
  | OpenCodeMessageV2StepStartPart
  | OpenCodeMessageV2PartBase

export interface OpenCodeMessageV2WithParts {
  info: OpenCodeMessageV2Info
  parts: OpenCodeMessageV2Part[]
}

export interface OpenCodeMessageV2ProjectOptions {
  stripMedia?: boolean | undefined
  toolOutputMaxChars?: number | undefined
  syntheticMessageIDs?: string[] | undefined
}

export interface OpenCodeMessageV2TextUIPart {
  type: "text"
  text: string
  providerMetadata?: Record<string, unknown> | undefined
}

export interface OpenCodeMessageV2FileUIPart {
  type: "file"
  url: string
  mediaType: string
  filename?: string | undefined
}

export interface OpenCodeMessageV2StepStartUIPart {
  type: "step-start"
}

export interface OpenCodeMessageV2ReasoningUIPart {
  type: "reasoning"
  text: string
  providerMetadata?: Record<string, unknown> | undefined
}

export interface OpenCodeMessageV2ToolUIPart {
  type: `tool-${string}`
  state: "output-available" | "output-error"
  toolCallId: string
  input: Record<string, unknown>
  output?: unknown
  errorText?: string | undefined
  providerExecuted?: true | undefined
  callProviderMetadata?: Record<string, unknown> | undefined
}

export type OpenCodeMessageV2UIPart =
  | OpenCodeMessageV2TextUIPart
  | OpenCodeMessageV2FileUIPart
  | OpenCodeMessageV2StepStartUIPart
  | OpenCodeMessageV2ReasoningUIPart
  | OpenCodeMessageV2ToolUIPart

export interface OpenCodeMessageV2UIMessage {
  id: string
  role: OpenCodeMessageV2Role
  parts: OpenCodeMessageV2UIPart[]
}

export interface OpenCodeMessageV2ToolModelOutputInput {
  toolCallId: string
  input: unknown
  output: unknown
}

export type OpenCodeMessageV2ToolModelOutput =
  | { type: "text"; value: string }
  | { type: "json"; value: unknown }
  | { type: "content"; value: Array<{ type: "text"; text: string } | { type: "media"; mediaType: string; data: string }> }

export interface OpenCodeSessionMessageV2ProjectorBridge {
  partKindOrder(): string[]
  inputPartKindOrder(): string[]
  isMedia(mime: string): boolean
  providerMeta(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined
  toModelOutput(input: OpenCodeMessageV2ToolModelOutputInput): OpenCodeMessageV2ToolModelOutput
  projectToUIModelMessages(input: {
    messages: OpenCodeMessageV2WithParts[]
    model: OpenCodeMessageV2ModelRef
    options?: OpenCodeMessageV2ProjectOptions
  }): OpenCodeMessageV2UIMessage[]
}

export interface OpenCodeSessionMessageV2ProjectorNativeExactFixtureCase {
  id:
    | "part-kind-and-prompt-input-kind-order"
    | "user-parts-filter-files-compaction-and-subtask"
    | "assistant-same-model-preserves-provider-metadata-and-tool-output"
    | "assistant-different-model-downgrades-reasoning-and-drops-provider-metadata"
    | "tool-media-extraction-and-state-fallbacks"
    | "aborted-error-content-is-kept-while-other-errors-are-skipped"
    | "tool-model-output-normalizes-string-json-and-data-url-content"
  actual: unknown
  expected: unknown
}

export interface OpenCodeSessionMessageV2ProjectorNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.session.projector.message-v2"
  portID: "session.projector"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-session-message-v2-projector-native-exact-fixture"
  replayRef: "session-message-v2-projector-native-exact:opencode"
  fixtureID: "opencode-session-message-v2-projector:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeSessionMessageV2ProjectorNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeSessionMessageV2ProjectorNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeSessionMessageV2ProjectorNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeSessionMessageV2ProjectorNativeExactFixtureIssue[]
}

const partKindOrder = [
  "text",
  "subtask",
  "reasoning",
  "file",
  "tool",
  "step-start",
  "step-finish",
  "snapshot",
  "patch",
  "agent",
  "retry",
  "compaction",
]

const inputPartKindOrder = ["text", "file", "agent", "subtask"]

export function createOpenCodeSessionMessageV2ProjectorBridge(): OpenCodeSessionMessageV2ProjectorBridge {
  return {
    partKindOrder: () => [...partKindOrder],
    inputPartKindOrder: () => [...inputPartKindOrder],
    isMedia: openCodeMessageV2IsMedia,
    providerMeta: openCodeMessageV2ProviderMeta,
    toModelOutput: openCodeMessageV2ToModelOutput,
    projectToUIModelMessages: openCodeMessageV2ProjectToUIModelMessages,
  }
}

export function openCodeMessageV2IsMedia(mime: string): boolean {
  return mime.startsWith("image/") || mime === "application/pdf"
}

export function openCodeMessageV2ProviderMeta(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!metadata) return undefined
  const { providerExecuted: _providerExecuted, ...rest } = metadata
  return Object.keys(rest).length > 0 ? rest : undefined
}

export function openCodeMessageV2ToModelOutput(input: OpenCodeMessageV2ToolModelOutputInput): OpenCodeMessageV2ToolModelOutput {
  const output = input.output
  if (typeof output === "string") return { type: "text", value: output }
  if (output && typeof output === "object") {
    const outputObject = output as {
      text?: string
      attachments?: Array<{ mime: string; url: string }>
    }
    const attachments = (outputObject.attachments ?? []).filter((attachment) => attachment.url.startsWith("data:") && attachment.url.includes(","))
    return {
      type: "content",
      value: [
        ...(outputObject.text ? [{ type: "text" as const, text: outputObject.text }] : []),
        ...attachments.map((attachment) => ({
          type: "media" as const,
          mediaType: attachment.mime,
          data: attachment.url.slice(attachment.url.indexOf(",") + 1),
        })),
      ],
    }
  }
  return { type: "json", value: output }
}

export function openCodeMessageV2ProjectToUIModelMessages(input: {
  messages: OpenCodeMessageV2WithParts[]
  model: OpenCodeMessageV2ModelRef
  options?: OpenCodeMessageV2ProjectOptions
}): OpenCodeMessageV2UIMessage[] {
  const result: OpenCodeMessageV2UIMessage[] = []
  let syntheticIndex = 0

  const nextSyntheticMessageID = () => {
    const provided = input.options?.syntheticMessageIDs?.[syntheticIndex]
    syntheticIndex += 1
    if (provided) return provided
    return `msg_synthetic_${syntheticIndex.toString().padStart(4, "0")}`
  }

  for (const message of input.messages) {
    if (message.parts.length === 0) continue

    if (message.info.role === "user") {
      const userMessage: OpenCodeMessageV2UIMessage = { id: message.info.id, role: "user", parts: [] }
      for (const part of message.parts) {
        if (isTextPart(part) && !part.ignored && part.text !== "") userMessage.parts.push({ type: "text", text: part.text })
        if (isFilePart(part) && part.mime !== "text/plain" && part.mime !== "application/x-directory") {
          if (input.options?.stripMedia && openCodeMessageV2IsMedia(part.mime)) {
            userMessage.parts.push({ type: "text", text: `[Attached ${part.mime}: ${part.filename ?? "file"}]` })
          } else {
            userMessage.parts.push(compactRecord({
              type: "file",
              url: part.url,
              mediaType: part.mime,
              filename: part.filename,
            }) as OpenCodeMessageV2FileUIPart)
          }
        }
        if (part.type === "compaction") userMessage.parts.push({ type: "text", text: "What did we do so far?" })
        if (part.type === "subtask") userMessage.parts.push({ type: "text", text: "The following tool was executed by the user" })
      }
      if (userMessage.parts.length > 0) result.push(userMessage)
      continue
    }

    if (message.info.role === "assistant") {
      const differentModel = `${input.model.providerID}/${input.model.id}` !== `${message.info.providerID}/${message.info.modelID}`
      const media: Array<{ mime: string; url: string; filename?: string | undefined }> = []
      if (message.info.error && !(isMessageAbortedError(message.info.error) && message.parts.some((part) => part.type !== "step-start" && part.type !== "reasoning"))) {
        continue
      }
      const assistantMessage: OpenCodeMessageV2UIMessage = { id: message.info.id, role: "assistant", parts: [] }
      const hasSignedReasoning = message.parts.some((part) => isReasoningPart(part) && recordAt(part.metadata, ["anthropic", "signature"]) != null)
      for (const part of message.parts) {
        if (isTextPart(part)) {
          assistantMessage.parts.push(compactRecord({
            type: "text",
            text: part.text === "" && hasSignedReasoning ? " " : part.text,
            providerMetadata: differentModel ? undefined : part.metadata,
          }) as OpenCodeMessageV2TextUIPart)
        }
        if (part.type === "step-start") assistantMessage.parts.push({ type: "step-start" })
        if (isToolPart(part)) {
          const projected = projectToolPart(part, {
            model: input.model,
            differentModel,
            stripMedia: input.options?.stripMedia,
            toolOutputMaxChars: input.options?.toolOutputMaxChars,
          })
          if (projected.media.length > 0) media.push(...projected.media)
          assistantMessage.parts.push(...projected.parts)
        }
        if (isReasoningPart(part)) {
          if (differentModel) {
            if (part.text.trim().length > 0) assistantMessage.parts.push({ type: "text", text: part.text })
            continue
          }
          assistantMessage.parts.push(compactRecord({
            type: "reasoning",
            text: part.text,
            providerMetadata: part.metadata,
          }) as OpenCodeMessageV2ReasoningUIPart)
        }
      }
      if (assistantMessage.parts.length > 0) {
        result.push(assistantMessage)
        if (media.length > 0) {
          result.push({
            id: nextSyntheticMessageID(),
            role: "user",
            parts: [
              { type: "text", text: OPENCODE_MESSAGE_V2_SYNTHETIC_ATTACHMENT_PROMPT },
              ...media.map((attachment) => compactRecord({
                type: "file",
                url: attachment.url,
                mediaType: attachment.mime,
                filename: attachment.filename,
              }) as OpenCodeMessageV2FileUIPart),
            ],
          })
        }
      }
    }
  }

  return result.filter((message) => message.parts.some((part) => part.type !== "step-start"))
}

export function captureOpenCodeSessionMessageV2ProjectorNativeExactFixture(): OpenCodeSessionMessageV2ProjectorNativeExactFixture {
  const bridge = createOpenCodeSessionMessageV2ProjectorBridge()
  const sameModel = model("anthropic", "claude-sonnet", "@ai-sdk/anthropic")
  const otherModel = model("openai", "gpt-5", "@ai-sdk/openai")
  const unsupportedMediaToolModel = model("local", "plain", "@ai-sdk/local")

  const userProjection = bridge.projectToUIModelMessages({
    model: sameModel,
    messages: [
      withParts(user("msg_user"), [
        text("msg_user", "prt_text", "keep me"),
        text("msg_user", "prt_empty", ""),
        { ...text("msg_user", "prt_ignored", "hidden"), ignored: true },
        file("msg_user", "prt_plain", "text/plain", "notes.txt", "file:///notes.txt"),
        file("msg_user", "prt_dir", "application/x-directory", "src", "file:///src"),
        file("msg_user", "prt_image", "image/png", "screen.png", "data:image/png;base64,aW1n"),
        compaction("msg_user", "prt_compaction"),
        subtask("msg_user", "prt_subtask"),
      ]),
    ],
  })

  const sameModelAssistant = bridge.projectToUIModelMessages({
    model: sameModel,
    options: { toolOutputMaxChars: 5 },
    messages: [
      withParts(assistant("msg_assistant", "anthropic", "claude-sonnet"), [
        text("msg_assistant", "prt_text", "hello", { vendor: { id: "a" } }),
        reasoning("msg_assistant", "prt_reasoning", "because", { anthropic: { signature: "sig" } }),
        toolCompleted("msg_assistant", "prt_tool", {
          output: "0123456789",
          metadata: { providerExecuted: true, trace: "keep" },
        }),
      ]),
    ],
  })

  const differentModelAssistant = bridge.projectToUIModelMessages({
    model: otherModel,
    messages: [
      withParts(assistant("msg_different", "anthropic", "claude-sonnet"), [
        text("msg_different", "prt_text", "hello", { vendor: { id: "drop" } }),
        reasoning("msg_different", "prt_reasoning", "private chain", { anthropic: { signature: "drop" } }),
        reasoning("msg_different", "prt_empty_reasoning", "   "),
      ]),
    ],
  })

  const toolFallbackProjection = bridge.projectToUIModelMessages({
    model: unsupportedMediaToolModel,
    options: { syntheticMessageIDs: ["msg_synthetic_media"] },
    messages: [
      withParts(assistant("msg_tool", "local", "plain"), [
        toolCompleted("msg_tool", "prt_media_tool", {
          output: "see attachment",
          attachments: [
            file("msg_tool", "prt_pdf", "application/pdf", "paper.pdf", "data:application/pdf;base64,cGRm"),
            file("msg_tool", "prt_log", "text/plain", "tool.log", "data:text/plain;base64,bG9n"),
          ],
        }),
        toolError("msg_tool", "prt_interrupted", { interrupted: true, output: "partial output" }),
        toolError("msg_tool", "prt_error", {}),
        toolPending("msg_tool", "prt_pending"),
        toolRunning("msg_tool", "prt_running"),
      ]),
    ],
  })

  const abortedProjection = bridge.projectToUIModelMessages({
    model: sameModel,
    messages: [
      withParts({ ...assistant("msg_aborted_kept", "anthropic", "claude-sonnet"), error: { name: "MessageAbortedError", message: "stop" } }, [
        { id: "prt_step", sessionID: "ses_msgv2", messageID: "msg_aborted_kept", type: "step-start" },
        text("msg_aborted_kept", "prt_text", "partial"),
      ]),
      withParts({ ...assistant("msg_other_error", "anthropic", "claude-sonnet"), error: { name: "APIError", message: "fail" } }, [
        text("msg_other_error", "prt_text_error", "skip"),
      ]),
      withParts({ ...assistant("msg_step_only", "anthropic", "claude-sonnet"), error: { name: "MessageAbortedError", message: "stop" } }, [
        { id: "prt_step_only", sessionID: "ses_msgv2", messageID: "msg_step_only", type: "step-start" },
      ]),
    ],
  })

  const cases: OpenCodeSessionMessageV2ProjectorNativeExactFixtureCase[] = [
    {
      id: "part-kind-and-prompt-input-kind-order",
      actual: {
        partKindOrder: bridge.partKindOrder(),
        inputPartKindOrder: bridge.inputPartKindOrder(),
        media: ["image/png", "application/pdf", "text/plain"].filter((mime) => bridge.isMedia(mime)),
        providerMeta: bridge.providerMeta({ providerExecuted: true, trace: "keep" }),
        emptyProviderMeta: bridge.providerMeta({ providerExecuted: true }),
      },
      expected: {
        partKindOrder,
        inputPartKindOrder,
        media: ["image/png", "application/pdf"],
        providerMeta: { trace: "keep" },
        emptyProviderMeta: undefined,
      },
    },
    {
      id: "user-parts-filter-files-compaction-and-subtask",
      actual: userProjection,
      expected: [
        {
          id: "msg_user",
          role: "user",
          parts: [
            { type: "text", text: "keep me" },
            { type: "file", url: "data:image/png;base64,aW1n", mediaType: "image/png", filename: "screen.png" },
            { type: "text", text: "What did we do so far?" },
            { type: "text", text: "The following tool was executed by the user" },
          ],
        },
      ],
    },
    {
      id: "assistant-same-model-preserves-provider-metadata-and-tool-output",
      actual: sameModelAssistant,
      expected: [
        {
          id: "msg_assistant",
          role: "assistant",
          parts: [
            { type: "text", text: "hello", providerMetadata: { vendor: { id: "a" } } },
            { type: "reasoning", text: "because", providerMetadata: { anthropic: { signature: "sig" } } },
            {
              type: "tool-bash",
              state: "output-available",
              toolCallId: "call_prt_tool",
              input: { command: "echo hi" },
              output: "01234\n[Tool output truncated for compaction: omitted 5 chars]",
              providerExecuted: true,
              callProviderMetadata: { trace: "keep" },
            },
          ],
        },
      ],
    },
    {
      id: "assistant-different-model-downgrades-reasoning-and-drops-provider-metadata",
      actual: differentModelAssistant,
      expected: [
        {
          id: "msg_different",
          role: "assistant",
          parts: [
            { type: "text", text: "hello" },
            { type: "text", text: "private chain" },
          ],
        },
      ],
    },
    {
      id: "tool-media-extraction-and-state-fallbacks",
      actual: toolFallbackProjection,
      expected: [
        {
          id: "msg_tool",
          role: "assistant",
          parts: [
            {
              type: "tool-bash",
              state: "output-available",
              toolCallId: "call_prt_media_tool",
              input: { command: "echo hi" },
              output: {
                text: "see attachment",
                attachments: [{ id: "prt_log", sessionID: "ses_msgv2", messageID: "msg_tool", type: "file", mime: "text/plain", filename: "tool.log", url: "data:text/plain;base64,bG9n" }],
              },
            },
            {
              type: "tool-bash",
              state: "output-available",
              toolCallId: "call_prt_interrupted",
              input: { command: "echo hi" },
              output: "partial output",
            },
            {
              type: "tool-bash",
              state: "output-error",
              toolCallId: "call_prt_error",
              input: { command: "echo hi" },
              errorText: "boom",
            },
            {
              type: "tool-bash",
              state: "output-error",
              toolCallId: "call_prt_pending",
              input: { command: "echo hi" },
              errorText: "[Tool execution was interrupted]",
            },
            {
              type: "tool-bash",
              state: "output-error",
              toolCallId: "call_prt_running",
              input: { command: "echo hi" },
              errorText: "[Tool execution was interrupted]",
            },
          ],
        },
        {
          id: "msg_synthetic_media",
          role: "user",
          parts: [
            { type: "text", text: OPENCODE_MESSAGE_V2_SYNTHETIC_ATTACHMENT_PROMPT },
            { type: "file", url: "data:application/pdf;base64,cGRm", mediaType: "application/pdf", filename: "paper.pdf" },
          ],
        },
      ],
    },
    {
      id: "aborted-error-content-is-kept-while-other-errors-are-skipped",
      actual: abortedProjection,
      expected: [
        {
          id: "msg_aborted_kept",
          role: "assistant",
          parts: [{ type: "step-start" }, { type: "text", text: "partial" }],
        },
      ],
    },
    {
      id: "tool-model-output-normalizes-string-json-and-data-url-content",
      actual: [
        bridge.toModelOutput({ toolCallId: "call_text", input: {}, output: "plain" }),
        bridge.toModelOutput({ toolCallId: "call_json", input: {}, output: 42 }),
        bridge.toModelOutput({
          toolCallId: "call_content",
          input: {},
          output: {
            text: "caption",
            attachments: [
              { mime: "image/png", url: "data:image/png;base64,aW1n" },
              { mime: "image/png", url: "https://example.test/no-inline.png" },
            ],
          },
        }),
      ],
      expected: [
        { type: "text", value: "plain" },
        { type: "json", value: 42 },
        { type: "content", value: [{ type: "text", text: "caption" }, { type: "media", mediaType: "image/png", data: "aW1n" }] },
      ],
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.session.projector.message-v2" as const,
    portID: "session.projector" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-session-message-v2-projector-native-exact-fixture" as const,
    replayRef: "session-message-v2-projector-native-exact:opencode" as const,
    fixtureID: "opencode-session-message-v2-projector:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#Part,TextPart,FilePart,ToolPart,ToolState,WithParts,toModelMessagesEffect,toModelMessages,providerMeta,SYNTHETIC_ATTACHMENT_PROMPT",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/util/media.ts#isMedia",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeSessionMessageV2ProjectorFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeSessionMessageV2ProjectorNativeExactFixture(
  fixture: OpenCodeSessionMessageV2ProjectorNativeExactFixture,
): OpenCodeSessionMessageV2ProjectorNativeExactFixtureVerification {
  const issues: OpenCodeSessionMessageV2ProjectorNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeSessionMessageV2ProjectorNativeExactFixtureCase["id"][] = [
    "part-kind-and-prompt-input-kind-order",
    "user-parts-filter-files-compaction-and-subtask",
    "assistant-same-model-preserves-provider-metadata-and-tool-output",
    "assistant-different-model-downgrades-reasoning-and-drops-provider-metadata",
    "tool-media-extraction-and-state-fallbacks",
    "aborted-error-content-is-kept-while-other-errors-are-skipped",
    "tool-model-output-normalizes-string-json-and-data-url-content",
  ]
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-session-message-v2-projector.schema", "Fixture must use schema version 1.")
  if (fixture.product !== "opencode" || fixture.atomID !== "opencode.session.projector.message-v2" || fixture.portID !== "session.projector") {
    add("opencode-session-message-v2-projector.target", "Fixture must target opencode.session.projector.message-v2 and session.projector.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-session-message-v2-projector.native-claim", "MessageV2 projector fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-session-message-v2-projector.lossiness", "Native MessageV2 projector fixture cannot retain known lossiness.")
  for (const source of ["session/message-v2.ts", "util/media.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-session-message-v2-projector.source-ref", `Missing source ref ${source}.`)
  }
  for (const expectedID of expectedCaseIDs) {
    const item = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!item) {
      add("opencode-session-message-v2-projector.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (!openCodeSessionMessageV2ProjectorSameJSON(item.actual, item.expected)) {
      add("opencode-session-message-v2-projector.case", "Case actual output must match expected OpenCode MessageV2 projection behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeSessionMessageV2ProjectorFingerprintObject(withoutFingerprint)) {
    add("opencode-session-message-v2-projector.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function projectToolPart(part: OpenCodeMessageV2ToolPart, input: {
  model: OpenCodeMessageV2ModelRef
  differentModel: boolean
  stripMedia?: boolean | undefined
  toolOutputMaxChars?: number | undefined
}): {
  parts: OpenCodeMessageV2ToolUIPart[]
  media: Array<{ mime: string; url: string; filename?: string | undefined }>
} {
  const projected: OpenCodeMessageV2ToolUIPart[] = []
  const media: Array<{ mime: string; url: string; filename?: string | undefined }> = []
  const common = {
    type: `tool-${part.tool}` as `tool-${string}`,
    toolCallId: part.callID,
    input: part.state.input,
    providerExecuted: part.metadata?.providerExecuted ? true as const : undefined,
    callProviderMetadata: input.differentModel ? undefined : openCodeMessageV2ProviderMeta(part.metadata),
  }
  if (part.state.status === "completed") {
    const outputText = part.state.time.compacted
      ? "[Old tool result content cleared]"
      : truncateToolOutput(part.state.output, input.toolOutputMaxChars)
    const attachments = part.state.time.compacted || input.stripMedia ? [] : (part.state.attachments ?? [])
    const mediaAttachments = attachments.filter((attachment) => openCodeMessageV2IsMedia(attachment.mime))
    const extractedMedia = mediaAttachments.filter((attachment) => !supportsMediaInToolResult(input.model, attachment))
    if (extractedMedia.length > 0) media.push(...extractedMedia)
    const finalAttachments = attachments.filter((attachment) => !openCodeMessageV2IsMedia(attachment.mime) || supportsMediaInToolResult(input.model, attachment))
    const output = finalAttachments.length > 0 ? { text: outputText, attachments: finalAttachments } : outputText
    projected.push(compactRecord({ ...common, state: "output-available", output }) as OpenCodeMessageV2ToolUIPart)
  }
  if (part.state.status === "error") {
    const output = part.state.metadata?.interrupted === true ? part.state.metadata.output : undefined
    if (typeof output === "string") {
      projected.push(compactRecord({ ...common, state: "output-available", output }) as OpenCodeMessageV2ToolUIPart)
    } else {
      projected.push(compactRecord({ ...common, state: "output-error", errorText: part.state.error }) as OpenCodeMessageV2ToolUIPart)
    }
  }
  if (part.state.status === "pending" || part.state.status === "running") {
    projected.push(compactRecord({ ...common, state: "output-error", errorText: "[Tool execution was interrupted]" }) as OpenCodeMessageV2ToolUIPart)
  }
  return { parts: projected, media }
}

function supportsMediaInToolResult(model: OpenCodeMessageV2ModelRef, attachment: { mime: string }): boolean {
  if (model.api.npm === "@ai-sdk/anthropic") return true
  if (model.api.npm === "@ai-sdk/openai") return true
  if (model.api.npm === "@ai-sdk/amazon-bedrock") return attachment.mime.startsWith("image/")
  if (model.api.npm === "@ai-sdk/xai") return attachment.mime.startsWith("image/")
  if (model.api.npm === "@ai-sdk/google-vertex/anthropic") return true
  if (model.api.npm === "@ai-sdk/google") {
    const id = model.api.id.toLowerCase()
    return id.includes("gemini-3") && !id.includes("gemini-2")
  }
  return false
}

function truncateToolOutput(text: string, maxChars?: number): string {
  if (!maxChars || text.length <= maxChars) return text
  const omitted = text.length - maxChars
  return `${text.slice(0, maxChars)}\n[Tool output truncated for compaction: omitted ${omitted} chars]`
}

function isMessageAbortedError(error: unknown): boolean {
  return isRecord(error) && error.name === "MessageAbortedError"
}

function isTextPart(part: OpenCodeMessageV2Part): part is OpenCodeMessageV2TextPart {
  return part.type === "text" && typeof (part as OpenCodeMessageV2TextPart).text === "string"
}

function isReasoningPart(part: OpenCodeMessageV2Part): part is OpenCodeMessageV2ReasoningPart {
  return part.type === "reasoning" && typeof (part as OpenCodeMessageV2ReasoningPart).text === "string"
}

function isFilePart(part: OpenCodeMessageV2Part): part is OpenCodeMessageV2FilePart {
  return part.type === "file" && typeof (part as OpenCodeMessageV2FilePart).mime === "string" && typeof (part as OpenCodeMessageV2FilePart).url === "string"
}

function isToolPart(part: OpenCodeMessageV2Part): part is OpenCodeMessageV2ToolPart {
  return part.type === "tool" && isRecord((part as OpenCodeMessageV2ToolPart).state)
}

function model(providerID: string, id: string, npm: string, apiID = id): OpenCodeMessageV2ModelRef {
  return { providerID, id, api: { npm, id: apiID } }
}

function withParts(info: OpenCodeMessageV2Info, parts: OpenCodeMessageV2Part[]): OpenCodeMessageV2WithParts {
  return { info, parts }
}

function user(id: string): OpenCodeMessageV2Info {
  return { id, role: "user", sessionID: "ses_msgv2" }
}

function assistant(id: string, providerID: string, modelID: string): OpenCodeMessageV2Info {
  return { id, role: "assistant", sessionID: "ses_msgv2", parentID: "msg_parent", providerID, modelID }
}

function text(messageID: string, id: string, value: string, metadata?: Record<string, unknown>): OpenCodeMessageV2TextPart {
  return compactRecord({ id, sessionID: "ses_msgv2", messageID, type: "text", text: value, metadata }) as OpenCodeMessageV2TextPart
}

function reasoning(messageID: string, id: string, value: string, metadata?: Record<string, unknown>): OpenCodeMessageV2ReasoningPart {
  return compactRecord({ id, sessionID: "ses_msgv2", messageID, type: "reasoning", text: value, metadata }) as OpenCodeMessageV2ReasoningPart
}

function file(messageID: string, id: string, mime: string, filename: string, url: string): OpenCodeMessageV2FilePart {
  return { id, sessionID: "ses_msgv2", messageID, type: "file", mime, filename, url }
}

function compaction(messageID: string, id: string): OpenCodeMessageV2CompactionPart {
  return { id, sessionID: "ses_msgv2", messageID, type: "compaction", auto: true }
}

function subtask(messageID: string, id: string): OpenCodeMessageV2SubtaskPart {
  return { id, sessionID: "ses_msgv2", messageID, type: "subtask", prompt: "inspect", description: "Inspect", agent: "build" }
}

function toolCompleted(messageID: string, id: string, input: {
  output: string
  metadata?: Record<string, unknown> | undefined
  attachments?: OpenCodeMessageV2FilePart[] | undefined
}): OpenCodeMessageV2ToolPart {
  return {
    id,
    sessionID: "ses_msgv2",
    messageID,
    type: "tool",
    callID: `call_${id}`,
    tool: "bash",
    state: {
      status: "completed",
      input: { command: "echo hi" },
      output: input.output,
      title: "bash",
      metadata: {},
      time: { start: 1, end: 2 },
      ...(input.attachments ? { attachments: input.attachments } : {}),
    },
    ...(input.metadata ? { metadata: input.metadata } : {}),
  }
}

function toolError(messageID: string, id: string, metadata: Record<string, unknown>): OpenCodeMessageV2ToolPart {
  return {
    id,
    sessionID: "ses_msgv2",
    messageID,
    type: "tool",
    callID: `call_${id}`,
    tool: "bash",
    state: {
      status: "error",
      input: { command: "echo hi" },
      error: "boom",
      metadata,
      time: { start: 1, end: 2 },
    },
  }
}

function toolPending(messageID: string, id: string): OpenCodeMessageV2ToolPart {
  return {
    id,
    sessionID: "ses_msgv2",
    messageID,
    type: "tool",
    callID: `call_${id}`,
    tool: "bash",
    state: { status: "pending", input: { command: "echo hi" }, raw: "{}" },
  }
}

function toolRunning(messageID: string, id: string): OpenCodeMessageV2ToolPart {
  return {
    id,
    sessionID: "ses_msgv2",
    messageID,
    type: "tool",
    callID: `call_${id}`,
    tool: "bash",
    state: { status: "running", input: { command: "echo hi" }, time: { start: 1 } },
  }
}

function recordAt(value: unknown, path: string[]): unknown {
  let current = value
  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }
  return current
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function compactRecord<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}

function openCodeSessionMessageV2ProjectorSameJSON(left: unknown, right: unknown): boolean {
  return openCodeSessionMessageV2ProjectorStableJSON(left) === openCodeSessionMessageV2ProjectorStableJSON(right)
}

function openCodeSessionMessageV2ProjectorFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeSessionMessageV2ProjectorStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeSessionMessageV2ProjectorStableJSON(value: unknown): string {
  return JSON.stringify(openCodeSessionMessageV2ProjectorSortStable(value))
}

function openCodeSessionMessageV2ProjectorSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeSessionMessageV2ProjectorSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeSessionMessageV2ProjectorSortStable(entry)]),
  )
}
