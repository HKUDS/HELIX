import { createHash } from "node:crypto"
import path from "node:path"

export interface OpenCodeTurnInputNormalizerModelRef {
  providerID: string
  modelID: string
  variant?: string
}

export interface OpenCodeTurnInputNormalizerSessionModel {
  providerID: string
  id: string
  variant?: string
}

export interface OpenCodeTurnInputNormalizerTokens {
  input: number
  output: number
  reasoning: number
  cache: {
    read: number
    write: number
  }
}

export interface OpenCodeTurnInputNormalizerSessionInfo {
  id: string
  slug: string
  projectID: string
  workspaceID?: string
  directory: string
  path?: string
  parentID?: string
  title: string
  agent?: string
  model?: OpenCodeTurnInputNormalizerModelRef
  version: string
  cost: number
  tokens: OpenCodeTurnInputNormalizerTokens
  permission?: OpenCodeTurnInputNormalizerPermissionRule[]
  time: {
    created: number
    updated: number
  }
}

export type OpenCodeTurnInputNormalizerFormat =
  | { type: "text" }
  | { type: "json_schema"; schema: Record<string, unknown>; retryCount?: number }

export interface OpenCodeTurnInputNormalizerUserMessage {
  id: string
  sessionID: string
  role: "user"
  time: {
    created: number
  }
  tools?: Record<string, boolean>
  agent: string
  model: OpenCodeTurnInputNormalizerModelRef
  system?: string
  format?: OpenCodeTurnInputNormalizerFormat
}

export interface OpenCodeTurnInputNormalizerPartSourceText {
  value: string
  start: number
  end: number
}

export type OpenCodeTurnInputNormalizerFilePartSource =
  | { type: "file"; path: string; text: OpenCodeTurnInputNormalizerPartSourceText }
  | { type: "resource"; clientName: string; uri: string; text: OpenCodeTurnInputNormalizerPartSourceText }
  | { type: "symbol"; path: string; range: unknown; name: string; kind: number; text: OpenCodeTurnInputNormalizerPartSourceText }

export type OpenCodeTurnInputNormalizerPromptPart =
  | {
    id?: string
    type: "text"
    text: string
    synthetic?: boolean
    ignored?: boolean
    time?: { start: number; end?: number }
    metadata?: Record<string, unknown>
  }
  | {
    id?: string
    type: "file"
    mime: string
    filename?: string
    url: string
    source?: OpenCodeTurnInputNormalizerFilePartSource
    synthetic?: boolean
  }
  | {
    id?: string
    type: "agent"
    name: string
    source?: OpenCodeTurnInputNormalizerPartSourceText
  }
  | {
    id?: string
    type: "subtask"
    prompt: string
    description: string
    agent: string
    model?: OpenCodeTurnInputNormalizerModelRef
    command?: string
  }

export type OpenCodeTurnInputNormalizerResolvedPart =
  | (Extract<OpenCodeTurnInputNormalizerPromptPart, { type: "text" }> & { id: string; messageID: string; sessionID: string })
  | (Extract<OpenCodeTurnInputNormalizerPromptPart, { type: "file" }> & { id: string; messageID: string; sessionID: string })
  | (Extract<OpenCodeTurnInputNormalizerPromptPart, { type: "agent" }> & { id: string; messageID: string; sessionID: string })
  | (Extract<OpenCodeTurnInputNormalizerPromptPart, { type: "subtask" }> & { id: string; messageID: string; sessionID: string })

export interface OpenCodeTurnInputNormalizerPromptInput {
  sessionID: string
  messageID?: string
  model?: OpenCodeTurnInputNormalizerModelRef
  agent?: string
  noReply?: boolean
  tools?: Record<string, boolean>
  format?: OpenCodeTurnInputNormalizerFormat
  system?: string
  variant?: string
  parts: OpenCodeTurnInputNormalizerPromptPart[]
}

export interface OpenCodeTurnInputNormalizerPermissionRule {
  permission: string
  action: "allow" | "deny"
  pattern: string
}

export interface OpenCodeTurnInputNormalizerAgentInfo {
  name: string
  model?: OpenCodeTurnInputNormalizerModelRef
  variant?: string
  permission?: OpenCodeTurnInputNormalizerPermissionRule[]
}

export interface OpenCodeTurnInputNormalizerCurrentSession {
  agent?: string
  model?: OpenCodeTurnInputNormalizerSessionModel
}

export interface OpenCodeTurnInputNormalizerProviderModelInfo {
  variants?: Record<string, unknown>
}

export interface OpenCodeTurnInputNormalizerFileReadResult {
  output: string
  attachments?: Array<Extract<OpenCodeTurnInputNormalizerPromptPart, { type: "file" }>>
}

export interface OpenCodeTurnInputNormalizerEnvironment {
  now: number
  defaultAgent: OpenCodeTurnInputNormalizerAgentInfo
  agents?: Record<string, OpenCodeTurnInputNormalizerAgentInfo>
  defaultModel: OpenCodeTurnInputNormalizerModelRef
  currentSession?: OpenCodeTurnInputNormalizerCurrentSession
  providerModels?: Record<string, OpenCodeTurnInputNormalizerProviderModelInfo>
  fileReads?: Record<string, OpenCodeTurnInputNormalizerFileReadResult | { error: string }>
  directories?: string[]
  pluginTransform?: (input: {
    message: OpenCodeTurnInputNormalizerUserMessage
    parts: OpenCodeTurnInputNormalizerResolvedPart[]
  }) => void
}

export type OpenCodeTurnInputNormalizerEvent =
  | { type: "SessionEvent.AgentSwitched"; sessionID: string; timestamp: number; agent: string }
  | { type: "SessionEvent.ModelSwitched"; sessionID: string; timestamp: number; model: { id: string; providerID: string; variant: string } }
  | {
    type: "SessionEvent.Prompted"
    sessionID: string
    timestamp: number
    prompt: {
      text: string
      files: Array<{ mime: string; filename?: string; url: string }>
      agents: Array<{ name: string }>
      references: Array<{ value: string; source: unknown }>
    }
  }
  | { type: "Session.Event.Error"; sessionID: string; error: { name: "Unknown"; message: string } }

export interface OpenCodeTurnInputNormalizerOutput {
  info: OpenCodeTurnInputNormalizerUserMessage
  parts: OpenCodeTurnInputNormalizerResolvedPart[]
  events: OpenCodeTurnInputNormalizerEvent[]
  writes: {
    messages: OpenCodeTurnInputNormalizerUserMessage[]
    parts: OpenCodeTurnInputNormalizerResolvedPart[]
  }
}

export interface OpenCodeTurnInputNormalizerSessionInput {
  id?: string
  slug?: string
  projectID: string
  workspaceID?: string
  directory: string
  worktree?: string
  path?: string
  parentID?: string
  title?: string
  agent?: string
  model?: OpenCodeTurnInputNormalizerModelRef
  permission?: OpenCodeTurnInputNormalizerPermissionRule[]
  now: number
  installationVersion?: string
}

export interface OpenCodeTurnInputNormalizerBridge {
  createSessionInfo(input: OpenCodeTurnInputNormalizerSessionInput): OpenCodeTurnInputNormalizerSessionInfo
  createUserMessage(
    input: OpenCodeTurnInputNormalizerPromptInput,
    environment: OpenCodeTurnInputNormalizerEnvironment,
  ): OpenCodeTurnInputNormalizerOutput
}

export interface OpenCodeTurnInputNormalizerNativeExactFixtureCase {
  id:
    | "root-session-default-title-and-path"
    | "child-session-default-title-and-permission-copy"
    | "prompt-input-builds-user-message-with-agent-model-variant"
    | "text-part-assigns-native-ids-and-prompted-event"
    | "agent-part-adds-task-tool-synthetic-hint"
    | "data-text-file-expands-read-tool-context"
    | "plugin-chat-message-can-transform-message-and-parts"
    | "missing-agent-publishes-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodeTurnInputNormalizerNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.turn.input-normalizer"
  portID: "turn.input-normalizer"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-turn-input-normalizer-native-exact-fixture"
  replayRef: "turn-input-normalizer-native-exact:opencode"
  fixtureID: "opencode-turn-input-normalizer:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeTurnInputNormalizerNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeTurnInputNormalizerNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeTurnInputNormalizerNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeTurnInputNormalizerNativeExactFixtureIssue[]
}

const emptyTokens: OpenCodeTurnInputNormalizerTokens = {
  input: 0,
  output: 0,
  reasoning: 0,
  cache: { read: 0, write: 0 },
}

export function createOpenCodeTurnInputNormalizerBridge(): OpenCodeTurnInputNormalizerBridge {
  return {
    createSessionInfo,
    createUserMessage,
  }
}

function createSessionInfo(input: OpenCodeTurnInputNormalizerSessionInput): OpenCodeTurnInputNormalizerSessionInfo {
  const isChild = Boolean(input.parentID)
  const sessionPath = input.path ?? (input.worktree ? path.relative(path.resolve(input.worktree), input.directory).replaceAll("\\", "/") : undefined)
  const result: OpenCodeTurnInputNormalizerSessionInfo = {
    id: sessionIDDescending(input.id, input.now),
    slug: input.slug ?? `slug-${input.now}`,
    projectID: input.projectID,
    directory: input.directory,
    title: input.title ?? `${isChild ? "Child session - " : "New session - "}${new Date(input.now).toISOString()}`,
    version: input.installationVersion ?? "0.0.0-test",
    cost: 0,
    tokens: cloneTokens(emptyTokens),
    time: {
      created: input.now,
      updated: input.now,
    },
  }
  if (input.workspaceID) result.workspaceID = input.workspaceID
  if (sessionPath !== undefined) result.path = sessionPath
  if (input.parentID) result.parentID = input.parentID
  if (input.agent) result.agent = input.agent
  if (input.model) result.model = cloneModel(input.model)
  if (input.permission) result.permission = input.permission.map((rule) => ({ ...rule }))
  return result
}

function createUserMessage(
  input: OpenCodeTurnInputNormalizerPromptInput,
  environment: OpenCodeTurnInputNormalizerEnvironment,
): OpenCodeTurnInputNormalizerOutput {
  const events: OpenCodeTurnInputNormalizerEvent[] = []
  const agent = resolveAgent(input, environment)
  if (!agent) {
    const message = `Agent not found: "${input.agent}".${availableAgentHint(environment)}`
    events.push({ type: "Session.Event.Error", sessionID: input.sessionID, error: { name: "Unknown", message } })
    throw Object.assign(new Error(message), { events })
  }

  const model = input.model ?? agent.model ?? currentModel(environment) ?? environment.defaultModel
  const variant = resolveVariant(input, agent, model, environment)
  const info: OpenCodeTurnInputNormalizerUserMessage = {
    id: input.messageID ?? messageIDAscending(environment.now),
    role: "user",
    sessionID: input.sessionID,
    time: { created: environment.now },
    agent: agent.name,
    model: {
      providerID: model.providerID,
      modelID: model.modelID,
      ...(variant ? { variant } : {}),
    },
    ...(input.tools ? { tools: { ...input.tools } } : {}),
    ...(input.system ? { system: input.system } : {}),
    ...(input.format ? { format: cloneFormat(input.format) } : {}),
  }

  if (environment.currentSession?.agent !== info.agent) {
    events.push({ type: "SessionEvent.AgentSwitched", sessionID: input.sessionID, timestamp: info.time.created, agent: info.agent })
  }
  const current = environment.currentSession
  const currentVariant = current?.model?.variant === "default" ? undefined : current?.model?.variant
  if (
    current?.model?.providerID !== info.model.providerID ||
    current?.model?.id !== info.model.modelID ||
    currentVariant !== info.model.variant
  ) {
    events.push({
      type: "SessionEvent.ModelSwitched",
      sessionID: input.sessionID,
      timestamp: info.time.created,
      model: {
        id: info.model.modelID,
        providerID: info.model.providerID,
        variant: info.model.variant ?? "default",
      },
    })
  }

  const partState = { next: 0 }
  const resolvedParts = input.parts.flatMap((part) => resolvePart(part, input, info, agent, environment))
    .map((part) => assignPart(part, input.sessionID, info.id, partState))
  environment.pluginTransform?.({ message: info, parts: resolvedParts })
  events.push(promptedEvent(info, resolvedParts))
  return {
    info,
    parts: resolvedParts,
    events,
    writes: {
      messages: [{ ...info, model: cloneModel(info.model) }],
      parts: resolvedParts.map(clonePart),
    },
  }
}

function resolveAgent(
  input: OpenCodeTurnInputNormalizerPromptInput,
  environment: OpenCodeTurnInputNormalizerEnvironment,
): OpenCodeTurnInputNormalizerAgentInfo | undefined {
  if (!input.agent) return environment.defaultAgent
  return environment.agents?.[input.agent]
}

function availableAgentHint(environment: OpenCodeTurnInputNormalizerEnvironment): string {
  const available = Object.values(environment.agents ?? {})
    .map((agent) => agent.name)
    .filter(Boolean)
    .sort()
  return available.length ? ` Available agents: ${available.join(", ")}` : ""
}

function currentModel(environment: OpenCodeTurnInputNormalizerEnvironment): OpenCodeTurnInputNormalizerModelRef | undefined {
  const model = environment.currentSession?.model
  return model ? { providerID: model.providerID, modelID: model.id, ...(model.variant && model.variant !== "default" ? { variant: model.variant } : {}) } : undefined
}

function resolveVariant(
  input: OpenCodeTurnInputNormalizerPromptInput,
  agent: OpenCodeTurnInputNormalizerAgentInfo,
  model: OpenCodeTurnInputNormalizerModelRef,
  environment: OpenCodeTurnInputNormalizerEnvironment,
): string | undefined {
  if (input.variant) return input.variant
  const sameAgentModel = Boolean(agent.model && model.providerID === agent.model.providerID && model.modelID === agent.model.modelID)
  if (!agent.variant || !sameAgentModel) return undefined
  return environment.providerModels?.[modelKey(model)]?.variants?.[agent.variant] ? agent.variant : undefined
}

function resolvePart(
  part: OpenCodeTurnInputNormalizerPromptPart,
  input: OpenCodeTurnInputNormalizerPromptInput,
  info: OpenCodeTurnInputNormalizerUserMessage,
  agent: OpenCodeTurnInputNormalizerAgentInfo,
  environment: OpenCodeTurnInputNormalizerEnvironment,
): OpenCodeTurnInputNormalizerPromptPart[] {
  if (part.type === "file" && part.source?.type === "resource") {
    return [
      { type: "text", synthetic: true, text: `Reading MCP resource: ${part.filename} (${part.source.uri})` },
      stripSyntheticFileFlag(part),
    ]
  }
  if (part.type === "file" && part.url.startsWith("data:") && part.mime === "text/plain") {
    return [
      { type: "text", synthetic: true, text: `Called the Read tool with the following input: ${JSON.stringify({ filePath: part.filename })}` },
      { type: "text", synthetic: true, text: decodeDataUrl(part.url) },
      stripSyntheticFileFlag(part),
    ]
  }
  if (part.type === "file" && part.url.startsWith("file:")) {
    return resolveFilePart(part, environment)
  }
  if (part.type === "agent") {
    const hint = evaluateTaskPermission(agent.permission, part.name) === "deny" ? " . Invoked by user; guaranteed to exist." : ""
    return [
      part,
      {
        type: "text",
        synthetic: true,
        text: ` Use the above message and context to generate a prompt and call the task tool with subagent: ${part.name}${hint}`,
      },
    ]
  }
  return [part]
}

function resolveFilePart(
  part: Extract<OpenCodeTurnInputNormalizerPromptPart, { type: "file" }>,
  environment: OpenCodeTurnInputNormalizerEnvironment,
): OpenCodeTurnInputNormalizerPromptPart[] {
  const url = new URL(part.url)
  const filepath = pathFromFileUrl(part.url)
  const mime = environment.directories?.includes(filepath) ? "application/x-directory" : part.mime
  const args = readToolArgs(filepath, url.searchParams.get("start"), url.searchParams.get("end"))
  const read = environment.fileReads?.[filepath]
  const pieces: OpenCodeTurnInputNormalizerPromptPart[] = [
    { type: "text", synthetic: true, text: `Called the Read tool with the following input: ${JSON.stringify(args)}` },
  ]
  if (!read) {
    pieces.push({ ...stripSyntheticFileFlag(part), mime })
    return pieces
  }
  if ("error" in read) {
    pieces.push({ type: "text", synthetic: true, text: `Read tool failed to read ${filepath} with the following error: ${read.error}` })
    return pieces
  }
  pieces.push({ type: "text", synthetic: true, text: read.output })
  if (read.attachments?.length) {
    pieces.push(...read.attachments.map((attachment) => {
      const filename = attachment.filename ?? part.filename
      return { ...stripSyntheticFileFlag(attachment), synthetic: true, ...(filename ? { filename } : {}) }
    }))
    return pieces
  }
  pieces.push({ ...stripSyntheticFileFlag(part), mime })
  return pieces
}

function assignPart(
  part: OpenCodeTurnInputNormalizerPromptPart,
  sessionID: string,
  messageID: string,
  state: { next: number },
): OpenCodeTurnInputNormalizerResolvedPart {
  const id = part.id ?? partIDAscending(state.next++)
  return {
    ...part,
    id,
    messageID,
    sessionID,
  } as OpenCodeTurnInputNormalizerResolvedPart
}

function promptedEvent(
  info: OpenCodeTurnInputNormalizerUserMessage,
  parts: OpenCodeTurnInputNormalizerResolvedPart[],
): OpenCodeTurnInputNormalizerEvent {
  const text: string[] = []
  const files: Array<{ mime: string; filename?: string; url: string }> = []
  const agents: Array<{ name: string }> = []
  const references: Array<{ value: string; source: unknown }> = []
  for (const part of parts) {
    if (part.type === "text" && !part.synthetic) text.push(part.text)
    if (part.type === "file") files.push({ mime: part.mime, ...(part.filename ? { filename: part.filename } : {}), url: part.url })
    if (part.type === "agent") agents.push({ name: part.name })
    if (part.type === "text" && part.metadata?.reference) references.push({ value: part.text, source: part.metadata.reference })
  }
  return {
    type: "SessionEvent.Prompted",
    sessionID: info.sessionID,
    timestamp: info.time.created,
    prompt: {
      text: text.join("\n"),
      files,
      agents,
      references,
    },
  }
}

function readToolArgs(filepath: string, rawStart: string | null, rawEnd: string | null): { filePath: string; offset?: number; limit?: number } {
  if (rawStart == null) return { filePath: filepath }
  const start = Math.max(parseInt(rawStart, 10), 1)
  const end = rawEnd ? parseInt(rawEnd, 10) : undefined
  return {
    filePath: filepath,
    offset: start,
    ...(end ? { limit: end - (start - 1) } : {}),
  }
}

function decodeDataUrl(url: string): string {
  const [header, body = ""] = url.split(",", 2)
  if (header?.endsWith(";base64")) return Buffer.from(body, "base64").toString("utf8")
  return decodeURIComponent(body)
}

function pathFromFileUrl(url: string): string {
  const parsed = new URL(url)
  return decodeURIComponent(parsed.pathname)
}

function stripSyntheticFileFlag(
  part: Extract<OpenCodeTurnInputNormalizerPromptPart, { type: "file" }>,
): Extract<OpenCodeTurnInputNormalizerPromptPart, { type: "file" }> {
  const { synthetic: _synthetic, ...rest } = part
  return rest
}

function evaluateTaskPermission(permission: OpenCodeTurnInputNormalizerPermissionRule[] | undefined, agentName: string): "allow" | "deny" {
  const match = permission?.find((rule) => rule.permission === "task" && (rule.pattern === "*" || rule.pattern === agentName))
  return match?.action ?? "allow"
}

function sessionIDDescending(id: string | undefined, now: number): string {
  return id ?? `ses_desc_${now}`
}

function messageIDAscending(now: number): string {
  return `msg_${now}`
}

function partIDAscending(index: number): string {
  return `prt_${index}`
}

function modelKey(model: OpenCodeTurnInputNormalizerModelRef): string {
  return `${model.providerID}/${model.modelID}`
}

function cloneModel(model: OpenCodeTurnInputNormalizerModelRef): OpenCodeTurnInputNormalizerModelRef {
  return { providerID: model.providerID, modelID: model.modelID, ...(model.variant ? { variant: model.variant } : {}) }
}

function cloneFormat(format: OpenCodeTurnInputNormalizerFormat): OpenCodeTurnInputNormalizerFormat {
  if (format.type === "text") return { type: "text" }
  return { type: "json_schema", schema: { ...format.schema }, ...(format.retryCount !== undefined ? { retryCount: format.retryCount } : {}) }
}

function cloneTokens(tokens: OpenCodeTurnInputNormalizerTokens): OpenCodeTurnInputNormalizerTokens {
  return {
    input: tokens.input,
    output: tokens.output,
    reasoning: tokens.reasoning,
    cache: { read: tokens.cache.read, write: tokens.cache.write },
  }
}

function clonePart(part: OpenCodeTurnInputNormalizerResolvedPart): OpenCodeTurnInputNormalizerResolvedPart {
  return JSON.parse(JSON.stringify(part)) as OpenCodeTurnInputNormalizerResolvedPart
}

export function captureOpenCodeTurnInputNormalizerNativeExactFixture(): OpenCodeTurnInputNormalizerNativeExactFixture {
  const bridge = createOpenCodeTurnInputNormalizerBridge()
  const now = Date.parse("2026-06-13T10:20:30.456Z")
  const baseEnvironment: OpenCodeTurnInputNormalizerEnvironment = {
    now,
    defaultAgent: {
      name: "build",
      model: { providerID: "anthropic", modelID: "claude-sonnet-4" },
      variant: "thinking",
      permission: [{ permission: "task", action: "deny", pattern: "reviewer" }],
    },
    agents: {
      build: {
        name: "build",
        model: { providerID: "anthropic", modelID: "claude-sonnet-4" },
        variant: "thinking",
        permission: [{ permission: "task", action: "deny", pattern: "reviewer" }],
      },
      reviewer: { name: "reviewer" },
    },
    defaultModel: { providerID: "openai", modelID: "gpt-5-codex" },
    currentSession: { agent: "old", model: { providerID: "openai", id: "gpt-4.1", variant: "default" } },
    providerModels: {
      "anthropic/claude-sonnet-4": { variants: { thinking: {} } },
    },
  }

  let missingAgentError: unknown
  try {
    bridge.createUserMessage({ sessionID: "ses_1", agent: "missing", parts: [{ type: "text", text: "hello" }] }, baseEnvironment)
  } catch (error) {
    missingAgentError = {
      message: error instanceof Error ? error.message : String(error),
      events: typeof error === "object" && error !== null && "events" in error ? (error as { events: unknown }).events : [],
    }
  }

  const pluginEnvironment: OpenCodeTurnInputNormalizerEnvironment = {
    ...baseEnvironment,
    pluginTransform: ({ message, parts }) => {
      message.system = "plugin-system"
      const first = parts[0]
      if (first?.type === "text") first.text = "plugin text"
    },
  }

  const cases: OpenCodeTurnInputNormalizerNativeExactFixtureCase[] = [
    {
      id: "root-session-default-title-and-path",
      actual: bridge.createSessionInfo({
        id: "ses_root",
        slug: "root-slug",
        projectID: "proj_1",
        workspaceID: "wrk_1",
        worktree: "/repo",
        directory: "/repo/packages/app",
        agent: "build",
        model: { providerID: "anthropic", modelID: "claude-sonnet-4" },
        now,
        installationVersion: "0.7.0",
      }),
      expected: {
        id: "ses_root",
        slug: "root-slug",
        projectID: "proj_1",
        workspaceID: "wrk_1",
        directory: "/repo/packages/app",
        path: "packages/app",
        title: "New session - 2026-06-13T10:20:30.456Z",
        agent: "build",
        model: { providerID: "anthropic", modelID: "claude-sonnet-4" },
        version: "0.7.0",
        cost: 0,
        tokens: emptyTokens,
        time: { created: now, updated: now },
      },
    },
    {
      id: "child-session-default-title-and-permission-copy",
      actual: bridge.createSessionInfo({
        id: "ses_child",
        slug: "child-slug",
        projectID: "proj_1",
        directory: "/repo",
        parentID: "ses_parent",
        permission: [{ permission: "bash", action: "allow", pattern: "git status" }],
        now,
      }),
      expected: {
        id: "ses_child",
        slug: "child-slug",
        projectID: "proj_1",
        directory: "/repo",
        parentID: "ses_parent",
        title: "Child session - 2026-06-13T10:20:30.456Z",
        version: "0.0.0-test",
        cost: 0,
        tokens: emptyTokens,
        permission: [{ permission: "bash", action: "allow", pattern: "git status" }],
        time: { created: now, updated: now },
      },
    },
    {
      id: "prompt-input-builds-user-message-with-agent-model-variant",
      actual: bridge.createUserMessage({
        sessionID: "ses_1",
        messageID: "msg_user",
        agent: "build",
        tools: { bash: true, edit: false },
        system: "prefer terse answers",
        format: { type: "json_schema", schema: { type: "object" }, retryCount: 3 },
        parts: [{ type: "text", text: "ship it" }],
      }, baseEnvironment),
      expected: {
        info: {
          id: "msg_user",
          role: "user",
          sessionID: "ses_1",
          time: { created: now },
          tools: { bash: true, edit: false },
          agent: "build",
          model: { providerID: "anthropic", modelID: "claude-sonnet-4", variant: "thinking" },
          system: "prefer terse answers",
          format: { type: "json_schema", schema: { type: "object" }, retryCount: 3 },
        },
        parts: [{ id: "prt_0", type: "text", text: "ship it", messageID: "msg_user", sessionID: "ses_1" }],
        events: [
          { type: "SessionEvent.AgentSwitched", sessionID: "ses_1", timestamp: now, agent: "build" },
          { type: "SessionEvent.ModelSwitched", sessionID: "ses_1", timestamp: now, model: { id: "claude-sonnet-4", providerID: "anthropic", variant: "thinking" } },
          { type: "SessionEvent.Prompted", sessionID: "ses_1", timestamp: now, prompt: { text: "ship it", files: [], agents: [], references: [] } },
        ],
        writes: {
          messages: [{
            id: "msg_user",
            role: "user",
            sessionID: "ses_1",
            time: { created: now },
            tools: { bash: true, edit: false },
            agent: "build",
            model: { providerID: "anthropic", modelID: "claude-sonnet-4", variant: "thinking" },
            system: "prefer terse answers",
            format: { type: "json_schema", schema: { type: "object" }, retryCount: 3 },
          }],
          parts: [{ id: "prt_0", type: "text", text: "ship it", messageID: "msg_user", sessionID: "ses_1" }],
        },
      },
    },
    {
      id: "text-part-assigns-native-ids-and-prompted-event",
      actual: bridge.createUserMessage({
        sessionID: "ses_2",
        messageID: "msg_text",
        parts: [{ type: "text", text: "hello" }, { type: "text", text: "hidden", synthetic: true }],
      }, baseEnvironment),
      expected: {
        info: {
          id: "msg_text",
          role: "user",
          sessionID: "ses_2",
          time: { created: now },
          agent: "build",
          model: { providerID: "anthropic", modelID: "claude-sonnet-4", variant: "thinking" },
        },
        parts: [
          { id: "prt_0", type: "text", text: "hello", messageID: "msg_text", sessionID: "ses_2" },
          { id: "prt_1", type: "text", text: "hidden", synthetic: true, messageID: "msg_text", sessionID: "ses_2" },
        ],
        events: [
          { type: "SessionEvent.AgentSwitched", sessionID: "ses_2", timestamp: now, agent: "build" },
          { type: "SessionEvent.ModelSwitched", sessionID: "ses_2", timestamp: now, model: { id: "claude-sonnet-4", providerID: "anthropic", variant: "thinking" } },
          { type: "SessionEvent.Prompted", sessionID: "ses_2", timestamp: now, prompt: { text: "hello", files: [], agents: [], references: [] } },
        ],
        writes: {
          messages: [{
            id: "msg_text",
            role: "user",
            sessionID: "ses_2",
            time: { created: now },
            agent: "build",
            model: { providerID: "anthropic", modelID: "claude-sonnet-4", variant: "thinking" },
          }],
          parts: [
            { id: "prt_0", type: "text", text: "hello", messageID: "msg_text", sessionID: "ses_2" },
            { id: "prt_1", type: "text", text: "hidden", synthetic: true, messageID: "msg_text", sessionID: "ses_2" },
          ],
        },
      },
    },
    {
      id: "agent-part-adds-task-tool-synthetic-hint",
      actual: bridge.createUserMessage({
        sessionID: "ses_3",
        messageID: "msg_agent",
        parts: [{ type: "agent", name: "reviewer", source: { value: "@reviewer", start: 0, end: 9 } }],
      }, baseEnvironment).parts,
      expected: [
        { id: "prt_0", type: "agent", name: "reviewer", source: { value: "@reviewer", start: 0, end: 9 }, messageID: "msg_agent", sessionID: "ses_3" },
        {
          id: "prt_1",
          type: "text",
          synthetic: true,
          text: " Use the above message and context to generate a prompt and call the task tool with subagent: reviewer . Invoked by user; guaranteed to exist.",
          messageID: "msg_agent",
          sessionID: "ses_3",
        },
      ],
    },
    {
      id: "data-text-file-expands-read-tool-context",
      actual: bridge.createUserMessage({
        sessionID: "ses_4",
        messageID: "msg_file",
        parts: [{ type: "file", mime: "text/plain", filename: "README.md", url: "data:text/plain;base64,SGVsbG8gZnJvbSBmaWxl" }],
      }, baseEnvironment).parts,
      expected: [
        { id: "prt_0", type: "text", synthetic: true, text: "Called the Read tool with the following input: {\"filePath\":\"README.md\"}", messageID: "msg_file", sessionID: "ses_4" },
        { id: "prt_1", type: "text", synthetic: true, text: "Hello from file", messageID: "msg_file", sessionID: "ses_4" },
        { id: "prt_2", type: "file", mime: "text/plain", filename: "README.md", url: "data:text/plain;base64,SGVsbG8gZnJvbSBmaWxl", messageID: "msg_file", sessionID: "ses_4" },
      ],
    },
    {
      id: "plugin-chat-message-can-transform-message-and-parts",
      actual: bridge.createUserMessage({
        sessionID: "ses_5",
        messageID: "msg_plugin",
        parts: [{ type: "text", text: "before plugin" }],
      }, pluginEnvironment),
      expected: {
        info: {
          id: "msg_plugin",
          role: "user",
          sessionID: "ses_5",
          time: { created: now },
          agent: "build",
          model: { providerID: "anthropic", modelID: "claude-sonnet-4", variant: "thinking" },
          system: "plugin-system",
        },
        parts: [{ id: "prt_0", type: "text", text: "plugin text", messageID: "msg_plugin", sessionID: "ses_5" }],
        events: [
          { type: "SessionEvent.AgentSwitched", sessionID: "ses_5", timestamp: now, agent: "build" },
          { type: "SessionEvent.ModelSwitched", sessionID: "ses_5", timestamp: now, model: { id: "claude-sonnet-4", providerID: "anthropic", variant: "thinking" } },
          { type: "SessionEvent.Prompted", sessionID: "ses_5", timestamp: now, prompt: { text: "plugin text", files: [], agents: [], references: [] } },
        ],
        writes: {
          messages: [{
            id: "msg_plugin",
            role: "user",
            sessionID: "ses_5",
            time: { created: now },
            agent: "build",
            model: { providerID: "anthropic", modelID: "claude-sonnet-4", variant: "thinking" },
            system: "plugin-system",
          }],
          parts: [{ id: "prt_0", type: "text", text: "plugin text", messageID: "msg_plugin", sessionID: "ses_5" }],
        },
      },
    },
    {
      id: "missing-agent-publishes-error",
      actual: missingAgentError,
      expected: {
        message: "Agent not found: \"missing\". Available agents: build, reviewer",
        events: [{
          type: "Session.Event.Error",
          sessionID: "ses_1",
          error: { name: "Unknown", message: "Agent not found: \"missing\". Available agents: build, reviewer" },
        }],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.turn.input-normalizer" as const,
    portID: "turn.input-normalizer" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-turn-input-normalizer-native-exact-fixture" as const,
    replayRef: "turn-input-normalizer-native-exact:opencode" as const,
    fixtureID: "opencode-turn-input-normalizer:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.ts#Session.createNext,createDefaultTitle,sessionPath,EmptyTokens",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/prompt.ts#PromptInput,SessionPrompt.createUserMessage,resolveUserPart,chat.message,SessionEvent.Prompted",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#User,TextPart,FilePart,AgentPart,SubtaskPart,Format",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return { ...fixtureWithoutFingerprint, fingerprint: fingerprintObject(fixtureWithoutFingerprint) }
}

export function verifyOpenCodeTurnInputNormalizerNativeExactFixture(
  fixture: OpenCodeTurnInputNormalizerNativeExactFixture,
): OpenCodeTurnInputNormalizerNativeExactFixtureVerification {
  const issues: OpenCodeTurnInputNormalizerNativeExactFixtureIssue[] = []
  if (fixture.atomID !== "opencode.turn.input-normalizer" || fixture.portID !== "turn.input-normalizer" || fixture.fixtureID !== "opencode-turn-input-normalizer:native-exact-fixture") {
    issues.push({ id: "opencode-turn-input-normalizer-native-exact.identity", message: "OpenCode turn input-normalizer fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-turn-input-normalizer-native-exact.native-claim", message: "OpenCode turn input-normalizer must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-turn-input-normalizer-native-exact.lossiness", message: "OpenCode turn input-normalizer native fixture cannot retain known lossiness." })
  }
  for (const source of ["session/session.ts", "session/prompt.ts", "session/message-v2.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      issues.push({ id: "opencode-turn-input-normalizer-native-exact.source", message: `OpenCode turn input-normalizer fixture lost pinned ${source} source.` })
    }
  }
  for (const required of [
    "root-session-default-title-and-path",
    "prompt-input-builds-user-message-with-agent-model-variant",
    "agent-part-adds-task-tool-synthetic-hint",
    "data-text-file-expands-read-tool-context",
    "plugin-chat-message-can-transform-message-and-parts",
  ]) {
    if (!fixture.cases.some((item) => item.id === required)) {
      issues.push({ id: "opencode-turn-input-normalizer-native-exact.case-coverage", caseID: required, message: `Missing native input normalizer case ${required}.` })
    }
  }
  for (const item of fixture.cases) {
    if (!sameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-turn-input-normalizer-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned Session input normalization behavior.` })
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-turn-input-normalizer-native-exact.fingerprint", message: "OpenCode turn input-normalizer native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
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
