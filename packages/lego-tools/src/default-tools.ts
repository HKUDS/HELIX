import {
  createID,
  type EventEnvelope,
  type HookResult,
  type LegoToolContext,
  type LegoToolDefinition,
  type LegoToolResult,
  type SessionID,
} from "@helix/contracts"
import { createToolPermission, filesystemPort, processRunnerPort, resolveToolPath } from "./ports"
const todoState = new Map<string, TodoItem[]>()

interface TodoItem {
  id: string
  text: string
  status: "pending" | "in_progress" | "completed"
}

export interface SubagentTaskInput {
  [key: string]: unknown
  description?: string
  prompt?: string
  agent?: string
  metadata?: Record<string, unknown>
}

export interface SubagentTaskRequest {
  description: string
  prompt: string
  agent?: string
  sessionID?: string
  cwd?: string
  metadata?: Record<string, unknown>
}

export interface SubagentRunner {
  runTask(input: SubagentTaskRequest, ctx: LegoToolContext): Promise<LegoToolResult> | LegoToolResult
}

export interface FileMutationQueue {
  run<T>(key: string, operation: () => Promise<T> | T): Promise<T>
}

interface FilePathToolInput extends Record<string, unknown> {
  path?: string
  file_path?: string
  filePath?: string
  filepath?: string
  file?: string
}

interface WriteToolInput extends FilePathToolInput {
  content?: string
  text?: string
  file_text?: string
  contents?: string
  text_body?: string
  textBody?: string
  text_content?: string
  textContent?: string
  text_to_write?: string
  textToWrite?: string
}

interface EditToolInput extends FilePathToolInput {
  oldText?: string
  newText?: string
  old_text?: string
  new_text?: string
  oldString?: string
  newString?: string
  old_string?: string
  new_string?: string
  oldstring?: string
  newstring?: string
  old?: string
  new?: string
  find?: string
  replace?: string
  replace_text?: string
  replaceText?: string
  replaceAll?: boolean
  replace_all?: boolean
}

interface BashToolInput extends Record<string, unknown> {
  command?: string
  command_line?: string
  commandLine?: string
  command_string?: string
  commandString?: string
  cmd?: string
  cwd?: string
}

const fallbackFileMutationQueue = createFileMutationQueue()

export function createEchoTool(): LegoToolDefinition {
  return {
    name: "echo",
    label: "Echo",
    description: "Echo input text.",
    async execute(_toolCallID, input) {
      return {
        content: [{ id: createID("part"), type: "text", text: String(input.text ?? "") }],
        details: { echoed: true },
      }
    },
  }
}

export function createReadTool(): LegoToolDefinition<FilePathToolInput> {
  return {
    name: "read",
    label: "Read",
    description: "Read a UTF-8 file.",
    permission: createToolPermission("read", "file.read", (input, ctx) => resolveToolPath(normalizeToolPath(input), ctx)),
    async execute(_toolCallID, input, ctx) {
      const path = normalizeToolPath(input)
      if (!path) return errorResult("read requires path or file_path")
      const file = await filesystemPort(ctx).readText(path, ctx)
      return {
        content: [{ id: createID("part"), type: "text", text: file.text }],
        details: { path: file.path },
      }
    },
  }
}

export function createWriteTool(): LegoToolDefinition<WriteToolInput> {
  return {
    name: "write",
    label: "Write",
    description: "Write a UTF-8 file.",
    permission: createToolPermission("write", "file.write", (input, ctx) => resolveToolPath(normalizeToolPath(input), ctx)),
    async execute(_toolCallID, input, ctx) {
      const rawPath = normalizeToolPath(input)
      const content = normalizeWriteContent(input)
      if (!rawPath) return errorResult("write requires path or file_path")
      if (content === undefined) return errorResult("write requires content or text", { path: rawPath })
      const path = resolveToolPath(rawPath, ctx)
      return fileMutationQueue(ctx).run(path, async () => {
        const file = await filesystemPort(ctx).writeText(rawPath, content, ctx)
        return {
          content: [{ id: createID("part"), type: "text", text: `Wrote ${file.path}` }],
          details: { path: file.path },
        }
      })
    },
  }
}

export function createEditTool(): LegoToolDefinition<EditToolInput> {
  return {
    name: "edit",
    label: "Edit",
    description: "Replace text in a UTF-8 file.",
    executionMode: "sequential",
    permission: createToolPermission("edit", "file.edit", (input, ctx) => resolveToolPath(normalizeToolPath(input), ctx)),
    async execute(_toolCallID, input, ctx) {
      const rawPath = normalizeToolPath(input)
      const oldText = normalizeOldText(input)
      const newText = normalizeNewText(input)
      const replaceAll = input.replaceAll ?? input.replace_all ?? false
      if (!rawPath) return errorResult("edit requires path or file_path")
      if (oldText === undefined) return errorResult("edit requires oldText or old_text", { path: rawPath })
      if (newText === undefined) return errorResult("edit requires newText or new_text", { path: rawPath })
      const path = resolveToolPath(rawPath, ctx)
      return fileMutationQueue(ctx).run(path, async () => {
        const file = await filesystemPort(ctx).readText(rawPath, ctx)
        const original = file.text
        const matches = countOccurrences(original, oldText)
        if (matches === 0) return errorResult(`Text not found in ${file.path}`, { path: file.path, matches })
        if (matches > 1 && !replaceAll) {
          return errorResult(`Text is ambiguous in ${file.path}; pass replaceAll=true to replace ${matches} occurrences`, {
            path: file.path,
            matches,
          })
        }
        const updated = replaceAll ? original.split(oldText).join(newText) : original.replace(oldText, newText)
        await filesystemPort(ctx).writeText(rawPath, updated, ctx)
        const replaced = replaceAll ? matches : 1
        return {
          content: [
            { id: createID("part"), type: "text", text: `Edited ${file.path} (${replaced} replacement${replaced === 1 ? "" : "s"})` },
          ],
          details: { path: file.path, replaced },
        }
      })
    },
  }
}

export function createLsTool(): LegoToolDefinition<{ path: string }> {
  return {
    name: "ls",
    label: "List",
    description: "List directory entries.",
    permission: createToolPermission("ls", "file.list", (input, ctx) => resolveToolPath(String(input.path), ctx)),
    async execute(_toolCallID, input, ctx) {
      const listing = await filesystemPort(ctx).list(input.path, ctx)
      return {
        content: [{ id: createID("part"), type: "text", text: listing.entries.join("\n") }],
        details: { path: listing.path, count: listing.entries.length },
      }
    },
  }
}

export function createFindTool(): LegoToolDefinition<{ path?: string; query?: string; glob?: string; maxResults?: number }> {
  return {
    name: "find",
    label: "Find",
    description: "Find files using ripgrep's file index.",
    permission: createToolPermission("find", "file.find", (input, ctx) => resolveToolPath(String(input.path ?? "."), ctx)),
    async execute(_toolCallID, input, ctx) {
      const result = await filesystemPort(ctx).find(input, ctx)
      return {
        content: [{ id: createID("part"), type: "text", text: result.files.join("\n") }],
        details: { path: result.path, count: result.files.length },
      }
    },
  }
}

export function createGrepTool(): LegoToolDefinition<{
  query: string
  path?: string
  glob?: string
  regex?: boolean
  ignoreCase?: boolean
  maxResults?: number
}> {
  return {
    name: "grep",
    label: "Grep",
    description: "Search file contents using ripgrep.",
    permission: createToolPermission("grep", "file.search", (input, ctx) => resolveToolPath(String(input.path ?? "."), ctx)),
    async execute(_toolCallID, input, ctx) {
      const result = await filesystemPort(ctx).grep(input, ctx)
      return {
        content: [{ id: createID("part"), type: "text", text: result.lines.join("\n") }],
        details: { path: result.path, count: result.lines.length },
      }
    },
  }
}

export function createBashTool(): LegoToolDefinition<BashToolInput> {
  return {
    name: "bash",
    label: "Bash",
    description: "Run a shell command.",
    executionMode: "sequential",
    permission: createToolPermission("bash", "bash.run", (input) => normalizeShellCommand(input)),
    async execute(toolCallID, input, ctx) {
      const command = normalizeShellCommand(input)
      if (!command) return errorResult("bash requires command or command_line")
      const cwd = input.cwd ?? ctx.cwd
      const env = await shellEnvironment({
        ctx,
        command,
        toolCallID: String(toolCallID),
        ...(cwd ? { cwd } : {}),
      })
      const result = await processRunnerPort(ctx).run(
        {
          command: "bash",
          args: ["-lc", command],
          ...(cwd ? { cwd } : {}),
          env,
        },
        ctx,
      )
      return {
        content: [{ id: createID("part"), type: "text", text: [result.stdout, result.stderr].filter(Boolean).join("\n") }],
        details: { command, exitCode: result.exitCode },
      }
    },
  }
}

export function createTodoTool(): LegoToolDefinition<{
  action?: "add" | "set" | "update" | "list" | "clear"
  id?: string
  text?: string
  status?: TodoItem["status"]
  items?: Array<{ id?: string; text: string; status?: TodoItem["status"] }>
}> {
  return {
    name: "todo",
    label: "Todo",
    description: "Manage the session todo list.",
    execute(_toolCallID, input, ctx) {
      const key = ctx.sessionID ?? "global"
      const current = todoState.get(key) ?? []
      const action = input.action ?? "list"
      if (action === "clear") {
        todoState.set(key, [])
        return todoResult([])
      }
      if (action === "set") {
        const items = (input.items ?? []).map((item) => ({
          id: item.id ?? createID("part"),
          text: item.text,
          status: item.status ?? "pending",
        }))
        todoState.set(key, items)
        return todoResult(items)
      }
      if (action === "add") {
        if (!input.text) return errorResult("todo.add requires text")
        const items = [...current, { id: input.id ?? createID("part"), text: input.text, status: input.status ?? "pending" }]
        todoState.set(key, items)
        return todoResult(items)
      }
      if (action === "update") {
        if (!input.id) return errorResult("todo.update requires id")
        const items = current.map((item) =>
          item.id === input.id
            ? { ...item, ...(input.text ? { text: input.text } : {}), ...(input.status ? { status: input.status } : {}) }
            : item,
        )
        todoState.set(key, items)
        return todoResult(items)
      }
      return todoResult(current)
    },
  }
}

export function createTaskTool(): LegoToolDefinition<SubagentTaskInput> {
  return {
    name: "task",
    label: "Task",
    description: "Dispatch a subagent task through a registered runner, or record it when no runner is available.",
    async execute(_toolCallID, input, ctx) {
      const description = input.description ?? input.prompt ?? ""
      if (!description) return errorResult("task requires description or prompt")
      const request = taskRequest(input, description, ctx)
      const runner = taskRunner(ctx)
      if (!runner) return taskRecordedResult(request)
      const result = await runner.runTask(request, ctx)
      return {
        ...result,
        details: {
          ...(isRecord(result.details) ? result.details : {}),
          request,
          status: result.isError ? "error" : "completed",
        },
      }
    },
  }
}

export function createSubagentTool(): LegoToolDefinition<SubagentTaskInput> {
  return {
    ...createTaskTool(),
    name: "subagent",
    label: "Subagent",
    description: "Dispatch a task to a registered subagent runner.",
  }
}

export function createGlobTool(): LegoToolDefinition<{ path?: string; pattern?: string; query?: string; maxResults?: number }> {
  return {
    name: "glob",
    label: "Glob",
    description: "Find files using a glob pattern.",
    permission: createToolPermission("glob", "file.find", (input, ctx) => resolveToolPath(String(input.path ?? "."), ctx)),
    async execute(_toolCallID, input, ctx) {
      const result = await filesystemPort(ctx).find(
        {
          ...(input.path ? { path: input.path } : {}),
          ...(input.pattern ?? input.query ? { glob: input.pattern ?? input.query } : {}),
          ...(input.maxResults === undefined ? {} : { maxResults: input.maxResults }),
        },
        ctx,
      )
      return {
        content: [{ id: createID("part"), type: "text", text: result.files.join("\n") }],
        details: { path: result.path, count: result.files.length },
      }
    },
  }
}

export function createTodoWriteTool(): LegoToolDefinition<{
  todos?: Array<{ id?: string; content?: string; text?: string; status?: TodoItem["status"] }>
  items?: Array<{ id?: string; content?: string; text?: string; status?: TodoItem["status"] }>
}> {
  return {
    name: "todowrite",
    label: "TodoWrite",
    description: "Replace the session todo list.",
    execute(_toolCallID, input, ctx) {
      const rawItems = input.todos ?? input.items ?? []
      const items = rawItems.map((item) => ({
        id: item.id ?? createID("part"),
        text: item.content ?? item.text ?? "",
        status: item.status ?? "pending",
      }))
      todoState.set(ctx.sessionID ?? "global", items)
      return todoResult(items)
    },
  }
}

export function createSkillTool(): LegoToolDefinition<{ name?: string; input?: string; prompt?: string }> {
  return {
    name: "skill",
    label: "Skill",
    description: "Record or invoke a named skill.",
    execute(_toolCallID, input, ctx) {
      const name = input.name ?? "default"
      const prompt = input.prompt ?? input.input ?? ""
      const runner = taskRunner(ctx)
      if (!runner) {
        return {
          content: [{ id: createID("part"), type: "text", text: `Skill recorded: ${name}${prompt ? ` ${prompt}` : ""}` }],
          details: { name, prompt, status: "recorded" },
        }
      }
      return runner.runTask({ description: `skill:${name}`, prompt, ...(ctx.sessionID ? { sessionID: ctx.sessionID } : {}), ...(ctx.cwd ? { cwd: ctx.cwd } : {}) }, ctx)
    },
  }
}

export function createWebFetchTool(): LegoToolDefinition<{ url: string; method?: string; headers?: Record<string, string>; body?: string }> {
  return {
    name: "webfetch",
    label: "WebFetch",
    description: "Fetch a URL and return response text.",
    permission: createToolPermission("webfetch", "network.fetch", (input) => String(input.url)),
    async execute(_toolCallID, input, ctx) {
      const response = await fetch(input.url, {
        method: input.method ?? "GET",
        ...(input.headers ? { headers: input.headers } : {}),
        ...(input.body ? { body: input.body } : {}),
        ...(ctx.signal ? { signal: ctx.signal } : {}),
      })
      const text = await response.text()
      return {
        content: [{ id: createID("part"), type: "text", text }],
        details: { url: input.url, status: response.status, ok: response.ok },
        ...(response.ok ? {} : { isError: true }),
      }
    },
  }
}

export function createInvalidTool(): LegoToolDefinition<Record<string, unknown>> {
  return {
    name: "invalid",
    label: "Invalid",
    description: "Represent an invalid tool invocation in OpenCode-compatible registries.",
    execute(_toolCallID, input) {
      return errorResult("Invalid tool invocation.", { input })
    },
  }
}

export function createQuestionTool(): LegoToolDefinition<{ questions?: Array<{ question?: string }> }> {
  return {
    name: "question",
    label: "Question",
    description: "Ask user-facing questions in OpenCode-compatible tool registries.",
    execute(_toolCallID, input) {
      const questions = (input.questions ?? []).map((question) => question.question).filter(Boolean)
      return {
        content: [{ id: createID("part"), type: "text", text: questions.length > 0 ? questions.join("\n") : "No question provided." }],
        details: { questions },
      }
    },
  }
}

export function createDefaultTools(): LegoToolDefinition[] {
  return [
    createEchoTool(),
    createReadTool() as LegoToolDefinition,
    createWriteTool() as LegoToolDefinition,
    createEditTool() as LegoToolDefinition,
    createGrepTool() as LegoToolDefinition,
    createFindTool() as LegoToolDefinition,
    createLsTool() as LegoToolDefinition,
    createBashTool() as LegoToolDefinition,
    createTodoTool() as LegoToolDefinition,
    createTaskTool() as LegoToolDefinition,
    createSubagentTool() as LegoToolDefinition,
  ]
}

export function createOpenCodeDefaultTools(): LegoToolDefinition[] {
  return [
    createBashTool() as LegoToolDefinition,
    createEditTool() as LegoToolDefinition,
    createGlobTool() as LegoToolDefinition,
    createGrepTool() as LegoToolDefinition,
    createInvalidTool() as LegoToolDefinition,
    createQuestionTool() as LegoToolDefinition,
    createReadTool() as LegoToolDefinition,
    createSkillTool() as LegoToolDefinition,
    createTaskTool() as LegoToolDefinition,
    createTodoWriteTool() as LegoToolDefinition,
    createWebFetchTool() as LegoToolDefinition,
    createWriteTool() as LegoToolDefinition,
  ]
}

export function createPiDefaultTools(): LegoToolDefinition[] {
  return [
    createBashTool() as LegoToolDefinition,
    createEditTool() as LegoToolDefinition,
    createReadTool() as LegoToolDefinition,
    createWriteTool() as LegoToolDefinition,
  ]
}

export function createFileMutationQueue(): FileMutationQueue {
  const tails = new Map<string, Promise<void>>()
  return {
    async run<T>(key: string, operation: () => Promise<T> | T) {
      const previous = tails.get(key) ?? Promise.resolve()
      let release = () => {}
      const current = new Promise<void>((resolve) => {
        release = resolve
      })
      const tail = previous.catch(() => undefined).then(() => current)
      tails.set(key, tail)
      await previous.catch(() => undefined)
      try {
        return await operation()
      } finally {
        release()
        if (tails.get(key) === tail) tails.delete(key)
      }
    },
  }
}

function fileMutationQueue(ctx: LegoToolContext): FileMutationQueue {
  const candidate = ctx.services?.get("file.mutationQueue")
  if (isFileMutationQueue(candidate)) return candidate
  if (!ctx.services) return fallbackFileMutationQueue
  const queue = createFileMutationQueue()
  ctx.services.set("file.mutationQueue", queue)
  return queue
}

function isFileMutationQueue(value: unknown): value is FileMutationQueue {
  return value !== null && typeof value === "object" && "run" in value && typeof value.run === "function"
}

async function shellEnvironment(input: {
  ctx: LegoToolContext
  command: string
  toolCallID: string
  cwd?: string
}): Promise<NodeJS.ProcessEnv> {
  const env: NodeJS.ProcessEnv = { ...process.env }
  const hooks = input.ctx.services?.get("hooks")
  if (!isHookEmitter(hooks)) return env

  const payload = {
    cwd: input.cwd ?? process.cwd(),
    command: input.command,
    ...(input.ctx.sessionID ? { sessionID: input.ctx.sessionID } : {}),
    callID: input.toolCallID,
  }
  const result = await hooks.emit(
    {
      type: "shell.env",
      ...(input.ctx.sessionID ? { sessionID: input.ctx.sessionID as SessionID } : {}),
      timestamp: Date.now(),
      payload,
    },
    input.ctx.signal,
  )
  const resultRecord = isRecord(result) ? (result as Record<string, unknown>) : undefined
  const rawEnv = resultRecord?.["env"]
  const patch = isRecord(rawEnv) ? rawEnv : undefined
  if (!patch) return env
  for (const [key, value] of Object.entries(patch)) {
    if (typeof value === "string") env[key] = value
  }
  return env
}

function isHookEmitter(value: unknown): value is {
  emit(event: EventEnvelope, signal?: AbortSignal): Promise<HookResult | undefined>
} {
  return value !== null && typeof value === "object" && "emit" in value && typeof value.emit === "function"
}

function normalizeToolPath(input: FilePathToolInput): string {
  return stringField(input, ["path", "file_path", "filePath", "filepath", "file"]) ?? ""
}

function normalizeWriteContent(input: WriteToolInput): string | undefined {
  return stringField(input, [
    "content",
    "text",
    "file_text",
    "contents",
    "text_body",
    "textBody",
    "text_content",
    "textContent",
    "text_to_write",
    "textToWrite",
  ])
}

function normalizeOldText(input: EditToolInput): string | undefined {
  return stringField(input, ["oldText", "old_text", "oldString", "old_string", "oldstring", "old", "find"])
}

function normalizeNewText(input: EditToolInput): string | undefined {
  return stringField(input, [
    "newText",
    "new_text",
    "newString",
    "new_string",
    "newstring",
    "new",
    "replace",
    "replace_text",
    "replaceText",
  ])
}

function normalizeShellCommand(input: BashToolInput): string {
  return stringField(input, ["command", "command_line", "commandLine", "command_string", "commandString", "cmd"]) ?? ""
}

function stringField(input: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === "string") return value
  }
  const canonicalKeys = new Set(keys.map(canonicalToolInputKey))
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" && canonicalKeys.has(canonicalToolInputKey(key))) return value
  }
  return undefined
}

function canonicalToolInputKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function countOccurrences(text: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let index = 0
  while ((index = text.indexOf(needle, index)) >= 0) {
    count++
    index += needle.length
  }
  return count
}

function errorResult(message: string, details?: unknown): LegoToolResult {
  return {
    isError: true,
    content: [{ id: createID("part"), type: "text", text: message }],
    ...(details === undefined ? {} : { details }),
  }
}

function todoResult(items: TodoItem[]): LegoToolResult {
  const text = items.length === 0 ? "No todos" : items.map((item) => `- [${item.status}] ${item.id}: ${item.text}`).join("\n")
  return {
    content: [{ id: createID("part"), type: "text", text }],
    details: { items },
  }
}

function taskRequest(input: SubagentTaskInput, description: string, ctx: LegoToolContext): SubagentTaskRequest {
  return {
    description,
    prompt: input.prompt ?? description,
    ...(input.agent ? { agent: input.agent } : {}),
    ...(ctx.sessionID ? { sessionID: ctx.sessionID } : {}),
    ...(ctx.cwd ? { cwd: ctx.cwd } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  }
}

function taskRunner(ctx: LegoToolContext): SubagentRunner | undefined {
  const candidate = ctx.services?.get("subagent.runner") ?? ctx.services?.get("task.runner")
  return isSubagentRunner(candidate) ? candidate : undefined
}

function isSubagentRunner(value: unknown): value is SubagentRunner {
  return value !== null && typeof value === "object" && "runTask" in value && typeof value.runTask === "function"
}

function taskRecordedResult(request: SubagentTaskRequest): LegoToolResult {
  return {
    content: [{ id: createID("part"), type: "text", text: `Task recorded: ${request.description}` }],
    details: { request, status: "recorded" },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
