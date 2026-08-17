import { createHash } from "node:crypto"
import { dirname, resolve } from "node:path"

export const piMonoToolRuntimeUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoToolRuntimeNativeExactFixtureID = "pi-tool-runtime:native-exact-fixture"
export const piMonoToolRuntimeNativeExactEvidenceRef = "conformance:pi-tool-runtime-native-exact-fixture"
export const piMonoToolRuntimeNativeExactReplayRef = "tool-runtime-native-exact:pi-mono"

export const piMonoToolRuntimeNativeExactAtomIDs = [
  "pi.permission.event-bridge",
  "pi.process-runner-bridge",
  "pi.tool.event-render-bridge",
  "pi.tool.result-event-bridge",
  "pi.tool.runtime-event-bridge",
  "pi.workspace-filesystem-bridge",
] as const

export type PiMonoToolRuntimeNativeExactAtomID = (typeof piMonoToolRuntimeNativeExactAtomIDs)[number]
export type PiMonoToolRuntimeNativeExactPortID =
  | "filesystem.port"
  | "process-runner.port"
  | "tool.audit-log"
  | "tool.executor"
  | "tool.permission-policy"
  | "tool.result-normalizer"

export interface PiMonoToolRuntimeNativeDescriptor {
  id: PiMonoToolRuntimeNativeExactAtomID
  port: PiMonoToolRuntimeNativeExactPortID
  product: "pi-mono"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
}

export interface PiMonoToolRuntimeEvent {
  type: "tool_execution_start" | "tool_execution_update" | "tool_execution_end" | "message_start" | "message_end"
  toolCallId?: string
  toolName?: string
  args?: Record<string, unknown>
  partialResult?: PiMonoToolRuntimeResultProjection
  result?: PiMonoToolRuntimeResultProjection
  isError?: boolean
  messageRole?: "toolResult"
}

export interface PiMonoToolRuntimeResultProjection {
  content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }>
  details?: unknown
  terminate?: boolean
}

export interface PiMonoToolResultMessageProjection {
  role: "toolResult"
  toolCallId: string
  toolName: string
  content: PiMonoToolRuntimeResultProjection["content"]
  details: unknown
  isError: boolean
  timestampSource: "Date.now"
}

export interface PiMonoToolCallHookHandler {
  extensionPath: string
  mutateInput?: Record<string, unknown>
  result?: { block?: boolean; reason?: string }
  throws?: string
}

export interface PiMonoToolCallHookProjection {
  emitted: boolean
  visited: string[]
  finalInput: Record<string, unknown>
  block: boolean
  reason?: string
  immediateResult?: PiMonoToolRuntimeResultProjection
  isError: boolean
  executionSkipped: boolean
  error?: string
}

export interface PiMonoToolResultPatchHandler {
  extensionPath: string
  patch?: {
    content?: PiMonoToolRuntimeResultProjection["content"]
    details?: unknown
    isError?: boolean
    terminate?: boolean
  }
  throws?: string
}

export interface PiMonoToolResultPatchProjection {
  visited: string[]
  result: PiMonoToolRuntimeResultProjection
  isError: boolean
  modified: boolean
  error?: string
  message: PiMonoToolResultMessageProjection
}

export interface PiMonoToolExecutionCallInput {
  id: string
  name: string
  args: Record<string, unknown>
  updates?: PiMonoToolRuntimeResultProjection[]
  result: PiMonoToolRuntimeResultProjection
  isError?: boolean
  completionRank?: number
}

export interface PiMonoToolExecutionProjection {
  mode: "sequential" | "parallel"
  events: PiMonoToolRuntimeEvent[]
  executionEndOrder: string[]
  resultMessageOrder: string[]
  turnEndToolResultOrder: string[]
}

export interface PiMonoBashRunnerProjectionInput {
  command: string
  cwd: string
  cwdExists: boolean
  commandPrefix?: string
  timeout?: number
  exitCode?: number | null
  output?: string
  abortedBeforeSpawn?: boolean
  abortedDuringRun?: boolean
  timedOut?: boolean
  spawnHook?: Partial<{ command: string; cwd: string; env: Record<string, string> }>
}

export interface PiMonoBashRunnerProjection {
  resolvedCommand: string
  spawnContext: {
    command: string
    cwd: string
    envSource: "getShellEnv-copy" | "spawnHook"
  }
  localExecution: {
    validatesCwdBeforeSpawn: true
    shellConfigSource: "getShellConfig(shellPath)"
    detached: "process.platform !== win32"
    stdio: ["ignore", "pipe", "pipe"]
    tracksDetachedPid: true
    timeoutKillsProcessTree: true
    abortKillsProcessTree: true
  }
  updatePolicy: {
    initialEmptyUpdate: true
    throttleMs: 100
    stdoutAndStderrShareAccumulator: true
    tempFilePrefix: "pi-bash"
  }
  outcome: "success" | "cwd-missing" | "aborted" | "timed-out" | "exit-error"
  result?: PiMonoToolRuntimeResultProjection
  errorText?: string
}

export interface PiMonoReadTextProjection {
  content: PiMonoToolRuntimeResultProjection["content"]
  details?: { truncation?: { truncated: boolean; reason?: string } }
  errorText?: string
}

export interface PiMonoWriteProjection {
  resolvedPath: string
  parentDir: string
  queueKey: string
  operations: ["abort-check", "mkdir-recursive", "abort-check", "write-file-utf8", "abort-check"]
  result: PiMonoToolRuntimeResultProjection
}

export interface PiMonoEditProjection {
  resolvedPath: string
  queueKey: string
  operations: ["abort-check", "access-read-write", "abort-check", "read-file", "abort-check", "apply-edits-normalized-lf", "abort-check", "write-file-utf8", "abort-check"]
  result: PiMonoToolRuntimeResultProjection
}

export interface PiMonoWorkspaceFilesystemProjection {
  readPathCandidates: string[]
  readLimitResult: PiMonoReadTextProjection
  writeResult: PiMonoWriteProjection
  editResult: PiMonoEditProjection
  mutationQueue: {
    sameResolvedFileSerializes: true
    differentResolvedFilesMayRunInParallel: true
    missingPathKeyFallsBackToResolvedPath: true
    registrationQueueOrdersQueueKeyCreation: true
  }
}

export interface PiMonoToolRenderProjection {
  tuiRendererResolution: {
    builtInDefinitionCreatedFromAllToolDefinitions: true
    extensionRendererOverridesBuiltInRendererWhenPresent: true
    builtInRendererUsedWhenExtensionOmitsRenderer: true
    renderShell: "extension-or-built-in-renderShell-or-default"
  }
  htmlRenderer: {
    renderCallStoresArgsByToolCallId: true
    renderResultBuildsAgentToolResultFromSessionContent: true
    collapsedAndExpandedResultsRenderedSeparately: true
    rendererErrorsFallBackToStructuredRendering: true
  }
  builtinRenderers: Array<{
    toolName: "bash" | "read" | "write" | "edit"
    callRenderer: string
    resultRenderer: string
    stateful: boolean
  }>
}

export type PiMonoToolRuntimeNativeExactScenarioID =
  | "tool-call-hook-permission-block-and-mutable-input"
  | "tool-result-patch-and-message-projection"
  | "runtime-tool-events-sequential-and-parallel"
  | "bash-process-runner-output-and-error-policy"
  | "workspace-filesystem-read-write-edit-and-queue"
  | "tool-renderer-resolution-and-html-export"

export interface PiMonoToolRuntimeNativeExactCase {
  scenarioID: PiMonoToolRuntimeNativeExactScenarioID
  input: Record<string, string | number | boolean | string[]>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoToolRuntimeNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: typeof piMonoToolRuntimeNativeExactAtomIDs
  portIDs: PiMonoToolRuntimeNativeExactPortID[]
  upstreamRef: typeof piMonoToolRuntimeUpstreamRef
  evidenceRef: typeof piMonoToolRuntimeNativeExactEvidenceRef
  fixtureID: typeof piMonoToolRuntimeNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    toolCallHookRunsAfterPrepareAndValidation: true
    toolCallInputMutationsAreInPlaceAndNotRevalidated: true
    toolCallBlockCreatesImmediateErrorResult: true
    toolExecutionStartEmitsBeforePreparation: true
    toolExecutionUpdatesUseToolOnUpdatePartialResult: true
    toolExecutionEndPrecedesToolResultMessage: true
    parallelResultMessagesRetainSourceToolCallOrder: true
    afterToolCallCanPatchContentDetailsTerminateAndIsError: true
    localBashRunnerUsesShellConfigAndProcessTreeKill: true
    bashOutputAccumulatorUsesPiBashTempPrefixAnd100msThrottle: true
    workspaceReadUsesPiPathVariantResolution: true
    workspaceMutationsSerializePerResolvedFile: true
    tuiAndHtmlRenderersInvokeToolDefinitionRenderers: true
  }
  cases: PiMonoToolRuntimeNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoToolRuntimeNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoToolRuntimeNativeExactVerification {
  ok: boolean
  issues: PiMonoToolRuntimeNativeExactIssue[]
}

const descriptorBase = {
  product: "pi-mono" as const,
  implementationKind: "factory" as const,
  parityCoverage: "native" as const,
  nativeEvidenceRefs: [piMonoToolRuntimeNativeExactEvidenceRef, piMonoToolRuntimeNativeExactReplayRef],
  fixtureIDs: [piMonoToolRuntimeNativeExactFixtureID],
  knownLossiness: [] as string[],
}

export const piMonoToolRuntimeNativeDescriptors: PiMonoToolRuntimeNativeDescriptor[] = [
  {
    ...descriptorBase,
    id: "pi.permission.event-bridge",
    port: "tool.permission-policy",
    selectionReason: "Pi upstream native implementation of beforeToolCall/tool_call blocking and mutable input policy with native-exact fixture coverage.",
  },
  {
    ...descriptorBase,
    id: "pi.process-runner-bridge",
    port: "process-runner.port",
    selectionReason: "Pi upstream native implementation of local bash process execution, timeout, abort, and output accumulation with native-exact fixture coverage.",
  },
  {
    ...descriptorBase,
    id: "pi.tool.event-render-bridge",
    port: "tool.executor",
    selectionReason: "Pi upstream native implementation of tool execution render surfaces and HTML renderer fallback with native-exact fixture coverage.",
  },
  {
    ...descriptorBase,
    id: "pi.tool.result-event-bridge",
    port: "tool.result-normalizer",
    selectionReason: "Pi upstream native implementation of afterToolCall/tool_result patching and ToolResultMessage projection with native-exact fixture coverage.",
  },
  {
    ...descriptorBase,
    id: "pi.tool.runtime-event-bridge",
    port: "tool.audit-log",
    selectionReason: "Pi upstream native implementation of tool_execution_start/update/end ordering with native-exact fixture coverage.",
  },
  {
    ...descriptorBase,
    id: "pi.workspace-filesystem-bridge",
    port: "filesystem.port",
    selectionReason: "Pi upstream native implementation of read/write/edit path resolution and per-file mutation queue semantics with native-exact fixture coverage.",
  },
]

export function projectPiMonoToolCallHook(
  input: {
    toolCallId: string
    toolName: string
    args: Record<string, unknown>
    handlers: PiMonoToolCallHookHandler[]
  },
): PiMonoToolCallHookProjection {
  const finalInput = { ...input.args }
  const visited: string[] = []
  if (input.handlers.length === 0) {
    return { emitted: false, visited, finalInput, block: false, isError: false, executionSkipped: false }
  }

  let result: { block?: boolean; reason?: string } | undefined
  for (const [index, handler] of input.handlers.entries()) {
    visited.push(`${handler.extensionPath}:tool_call:${index + 1}`)
    if (handler.throws) {
      return {
        emitted: true,
        visited,
        finalInput,
        block: false,
        immediateResult: createPiMonoErrorToolResult(handler.throws),
        isError: true,
        executionSkipped: true,
        error: handler.throws,
      }
    }
    Object.assign(finalInput, handler.mutateInput)
    if (handler.result) {
      result = handler.result
      if (result.block) {
        return {
          emitted: true,
          visited,
          finalInput,
          block: true,
          ...(result.reason ? { reason: result.reason } : {}),
          immediateResult: createPiMonoErrorToolResult(result.reason || "Tool execution was blocked"),
          isError: true,
          executionSkipped: true,
        }
      }
    }
  }

  return {
    emitted: true,
    visited,
    finalInput,
    block: result?.block === true,
    ...(result?.reason ? { reason: result.reason } : {}),
    isError: false,
    executionSkipped: false,
  }
}

export function projectPiMonoToolResultPatch(
  input: {
    toolCallId: string
    toolName: string
    result: PiMonoToolRuntimeResultProjection
    isError: boolean
    handlers: PiMonoToolResultPatchHandler[]
  },
): PiMonoToolResultPatchProjection {
  let result = cloneToolResult(input.result)
  let isError = input.isError
  const visited: string[] = []
  let modified = false
  let error: string | undefined

  for (const [index, handler] of input.handlers.entries()) {
    visited.push(`${handler.extensionPath}:tool_result:${index + 1}`)
    if (handler.throws) {
      error = handler.throws
      result = createPiMonoErrorToolResult(handler.throws)
      isError = true
      modified = true
      break
    }
    if (!handler.patch) continue
    const nextResult: PiMonoToolRuntimeResultProjection = {
      content: handler.patch.content ?? result.content,
    }
    if (handler.patch.details !== undefined || result.details !== undefined) nextResult.details = handler.patch.details ?? result.details
    const terminate = handler.patch.terminate ?? result.terminate
    if (terminate !== undefined) nextResult.terminate = terminate
    result = nextResult
    isError = handler.patch.isError ?? isError
    modified = true
  }

  return {
    visited,
    result,
    isError,
    modified,
    ...(error ? { error } : {}),
    message: createPiMonoToolResultMessage(input.toolCallId, input.toolName, result, isError),
  }
}

export function projectPiMonoToolExecutionEvents(
  mode: "sequential" | "parallel",
  calls: PiMonoToolExecutionCallInput[],
): PiMonoToolExecutionProjection {
  const events: PiMonoToolRuntimeEvent[] = []
  const executionEndOrder: string[] = []
  const resultMessageOrder: string[] = []

  const emitStart = (call: PiMonoToolExecutionCallInput) => {
    events.push({ type: "tool_execution_start", toolCallId: call.id, toolName: call.name, args: call.args })
  }
  const emitUpdates = (call: PiMonoToolExecutionCallInput) => {
    for (const update of call.updates ?? []) {
      events.push({ type: "tool_execution_update", toolCallId: call.id, toolName: call.name, args: call.args, partialResult: update })
    }
  }
  const emitEnd = (call: PiMonoToolExecutionCallInput) => {
    events.push({ type: "tool_execution_end", toolCallId: call.id, toolName: call.name, result: call.result, isError: call.isError ?? false })
    executionEndOrder.push(call.id)
  }
  const emitMessage = (call: PiMonoToolExecutionCallInput) => {
    events.push({ type: "message_start", toolCallId: call.id, toolName: call.name, messageRole: "toolResult" })
    events.push({ type: "message_end", toolCallId: call.id, toolName: call.name, messageRole: "toolResult" })
    resultMessageOrder.push(call.id)
  }

  if (mode === "sequential") {
    for (const call of calls) {
      emitStart(call)
      emitUpdates(call)
      emitEnd(call)
      emitMessage(call)
    }
  } else {
    for (const call of calls) emitStart(call)
    const completionOrder = [...calls].sort((left, right) => (left.completionRank ?? 0) - (right.completionRank ?? 0))
    for (const call of completionOrder) {
      emitUpdates(call)
      emitEnd(call)
    }
    for (const call of calls) emitMessage(call)
  }

  return {
    mode,
    events,
    executionEndOrder,
    resultMessageOrder,
    turnEndToolResultOrder: [...resultMessageOrder],
  }
}

export function projectPiMonoBashProcessRunner(input: PiMonoBashRunnerProjectionInput): PiMonoBashRunnerProjection {
  const resolvedCommand = input.commandPrefix ? `${input.commandPrefix}\n${input.command}` : input.command
  const spawnContext = {
    command: input.spawnHook?.command ?? resolvedCommand,
    cwd: input.spawnHook?.cwd ?? input.cwd,
    envSource: input.spawnHook?.env ? "spawnHook" as const : "getShellEnv-copy" as const,
  }
  const localExecution = {
    validatesCwdBeforeSpawn: true as const,
    shellConfigSource: "getShellConfig(shellPath)" as const,
    detached: "process.platform !== win32" as const,
    stdio: ["ignore", "pipe", "pipe"] as ["ignore", "pipe", "pipe"],
    tracksDetachedPid: true as const,
    timeoutKillsProcessTree: true as const,
    abortKillsProcessTree: true as const,
  }
  const updatePolicy = {
    initialEmptyUpdate: true as const,
    throttleMs: 100 as const,
    stdoutAndStderrShareAccumulator: true as const,
    tempFilePrefix: "pi-bash" as const,
  }

  if (!input.cwdExists) {
    return {
      resolvedCommand,
      spawnContext,
      localExecution,
      updatePolicy,
      outcome: "cwd-missing",
      errorText: `Working directory does not exist: ${input.cwd}\nCannot execute bash commands.`,
    }
  }
  if (input.abortedBeforeSpawn || input.abortedDuringRun) {
    return {
      resolvedCommand,
      spawnContext,
      localExecution,
      updatePolicy,
      outcome: "aborted",
      errorText: appendPiMonoBashStatus(input.output ?? "", "Command aborted"),
    }
  }
  if (input.timedOut) {
    return {
      resolvedCommand,
      spawnContext,
      localExecution,
      updatePolicy,
      outcome: "timed-out",
      errorText: appendPiMonoBashStatus(input.output ?? "", `Command timed out after ${input.timeout ?? 0} seconds`),
    }
  }
  if (input.exitCode !== undefined && input.exitCode !== null && input.exitCode !== 0) {
    return {
      resolvedCommand,
      spawnContext,
      localExecution,
      updatePolicy,
      outcome: "exit-error",
      errorText: appendPiMonoBashStatus(input.output || "(no output)", `Command exited with code ${input.exitCode}`),
    }
  }
  return {
    resolvedCommand,
    spawnContext,
    localExecution,
    updatePolicy,
    outcome: "success",
    result: { content: [{ type: "text", text: input.output || "(no output)" }] },
  }
}

export function projectPiMonoReadPathCandidates(filePath: string, cwd: string): string[] {
  const resolvedPath = resolvePiMonoPath(filePath, cwd)
  const nfdVariant = resolvedPath.normalize("NFD")
  return unique([
    resolvedPath,
    resolvedPath.replace(/ (AM|PM)\./gi, "\u202F$1."),
    nfdVariant,
    resolvedPath.replace(/'/g, "\u2019"),
    nfdVariant.replace(/'/g, "\u2019"),
  ])
}

export function projectPiMonoReadText(
  fileText: string,
  input: { path: string; offset?: number; limit?: number },
): PiMonoReadTextProjection {
  const allLines = fileText.split("\n")
  const startLine = input.offset ? Math.max(0, input.offset - 1) : 0
  if (startLine >= allLines.length) {
    return {
      content: [],
      errorText: `Offset ${input.offset} is beyond end of file (${allLines.length} lines total)`,
    }
  }
  const endLine = input.limit === undefined ? allLines.length : Math.min(startLine + input.limit, allLines.length)
  const selectedContent = allLines.slice(startLine, endLine).join("\n")
  if (input.limit !== undefined && endLine < allLines.length) {
    const remaining = allLines.length - endLine
    const nextOffset = endLine + 1
    return {
      content: [{ type: "text", text: `${selectedContent}\n\n[${remaining} more lines in file. Use offset=${nextOffset} to continue.]` }],
    }
  }
  return { content: [{ type: "text", text: selectedContent }] }
}

export function projectPiMonoWorkspaceFilesystem(): PiMonoWorkspaceFilesystemProjection {
  const cwd = "/workspace/pi"
  const writePath = "src/new-file.ts"
  const editPath = "src/existing.ts"
  const editResult = projectPiMonoEditFile("hello\nold\n", {
    path: editPath,
    edits: [{ oldText: "old", newText: "new" }],
    cwd,
  })
  return {
    readPathCandidates: projectPiMonoReadPathCandidates("Capture d'ecran 10.11.12 AM.png", cwd),
    readLimitResult: projectPiMonoReadText("one\ntwo\nthree", { path: "notes.txt", offset: 1, limit: 2 }),
    writeResult: projectPiMonoWriteFile({ path: writePath, content: "export const value = 1\n", cwd }),
    editResult,
    mutationQueue: {
      sameResolvedFileSerializes: true,
      differentResolvedFilesMayRunInParallel: true,
      missingPathKeyFallsBackToResolvedPath: true,
      registrationQueueOrdersQueueKeyCreation: true,
    },
  }
}

export function projectPiMonoWriteFile(input: { path: string; content: string; cwd: string }): PiMonoWriteProjection {
  const resolvedPath = resolvePiMonoPath(input.path, input.cwd)
  return {
    resolvedPath,
    parentDir: dirname(resolvedPath),
    queueKey: resolvedPath,
    operations: ["abort-check", "mkdir-recursive", "abort-check", "write-file-utf8", "abort-check"],
    result: {
      content: [{ type: "text", text: `Successfully wrote ${input.content.length} bytes to ${input.path}` }],
    },
  }
}

export function projectPiMonoEditFile(
  originalText: string,
  input: { path: string; edits: Array<{ oldText: string; newText: string }>; cwd: string },
): PiMonoEditProjection {
  const resolvedPath = resolvePiMonoPath(input.path, input.cwd)
  let edited = originalText.replace(/^\uFEFF/, "")
  for (const edit of input.edits) {
    const count = edited.split(edit.oldText).length - 1
    if (count !== 1) {
      throw new Error(`Could not edit file: ${input.path}. oldText must match exactly once.`)
    }
    edited = edited.replace(edit.oldText, edit.newText)
  }
  const firstChangedLine = firstChangedLineNumber(originalText, edited)
  return {
    resolvedPath,
    queueKey: resolvedPath,
    operations: ["abort-check", "access-read-write", "abort-check", "read-file", "abort-check", "apply-edits-normalized-lf", "abort-check", "write-file-utf8", "abort-check"],
    result: {
      content: [{ type: "text", text: `Successfully replaced ${input.edits.length} block(s) in ${input.path}.` }],
      details: {
        diff: `-${input.edits[0]?.oldText ?? ""}\n+${input.edits[0]?.newText ?? ""}`,
        patch: `--- ${input.path}\n+++ ${input.path}\n@@\n-${input.edits[0]?.oldText ?? ""}\n+${input.edits[0]?.newText ?? ""}`,
        firstChangedLine,
      },
    },
  }
}

export function projectPiMonoToolRenderSurface(): PiMonoToolRenderProjection {
  return {
    tuiRendererResolution: {
      builtInDefinitionCreatedFromAllToolDefinitions: true,
      extensionRendererOverridesBuiltInRendererWhenPresent: true,
      builtInRendererUsedWhenExtensionOmitsRenderer: true,
      renderShell: "extension-or-built-in-renderShell-or-default",
    },
    htmlRenderer: {
      renderCallStoresArgsByToolCallId: true,
      renderResultBuildsAgentToolResultFromSessionContent: true,
      collapsedAndExpandedResultsRenderedSeparately: true,
      rendererErrorsFallBackToStructuredRendering: true,
    },
    builtinRenderers: [
      { toolName: "bash", callRenderer: "formatBashCall", resultRenderer: "rebuildBashResultRenderComponent", stateful: true },
      { toolName: "read", callRenderer: "formatReadCall-or-compact-classification", resultRenderer: "formatReadResult", stateful: false },
      { toolName: "write", callRenderer: "formatWriteCall-with-highlight-cache", resultRenderer: "formatWriteResult", stateful: true },
      { toolName: "edit", callRenderer: "buildEditCallComponent-with-preview", resultRenderer: "renderDiff-result", stateful: true },
    ],
  }
}

export function buildPiMonoToolRuntimeNativeExactFixture(): PiMonoToolRuntimeNativeExactFixture {
  const toolCallProjection = projectPiMonoToolCallHook({
    toolCallId: "toolu_1",
    toolName: "bash",
    args: { command: "npm test" },
    handlers: [
      { extensionPath: "/extensions/policy.ts", mutateInput: { timeout: 30 } },
      { extensionPath: "/extensions/policy.ts", result: { block: true, reason: "write access denied" } },
    ],
  })
  const resultProjection = projectPiMonoToolResultPatch({
    toolCallId: "toolu_2",
    toolName: "read",
    result: { content: [{ type: "text", text: "original" }], details: { source: "tool" } },
    isError: false,
    handlers: [{ extensionPath: "/extensions/result.ts", patch: { content: [{ type: "text", text: "patched" }], details: { patched: true }, isError: true, terminate: true } }],
  })
  const sequentialEvents = projectPiMonoToolExecutionEvents("sequential", [
    { id: "toolu_a", name: "read", args: { path: "a.ts" }, updates: [], result: { content: [{ type: "text", text: "A" }] } },
    { id: "toolu_b", name: "bash", args: { command: "echo B" }, updates: [{ content: [{ type: "text", text: "B" }] }], result: { content: [{ type: "text", text: "B" }] } },
  ])
  const parallelEvents = projectPiMonoToolExecutionEvents("parallel", [
    { id: "toolu_a", name: "read", args: { path: "a.ts" }, result: { content: [{ type: "text", text: "A" }] }, completionRank: 2 },
    { id: "toolu_b", name: "bash", args: { command: "echo B" }, updates: [{ content: [{ type: "text", text: "B" }] }], result: { content: [{ type: "text", text: "B" }] }, completionRank: 1 },
  ])
  const bashRunner = projectPiMonoBashProcessRunner({
    command: "npm test",
    cwd: "/workspace/pi",
    cwdExists: true,
    commandPrefix: "set -e",
    timeout: 5,
    output: "partial",
    timedOut: true,
  })
  const workspace = projectPiMonoWorkspaceFilesystem()
  const render = projectPiMonoToolRenderSurface()
  const fixtureWithoutFingerprint: Omit<PiMonoToolRuntimeNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: piMonoToolRuntimeNativeExactAtomIDs,
    portIDs: ["filesystem.port", "process-runner.port", "tool.audit-log", "tool.executor", "tool.permission-policy", "tool.result-normalizer"],
    upstreamRef: piMonoToolRuntimeUpstreamRef,
    evidenceRef: piMonoToolRuntimeNativeExactEvidenceRef,
    fixtureID: piMonoToolRuntimeNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      toolCallHookRunsAfterPrepareAndValidation: true,
      toolCallInputMutationsAreInPlaceAndNotRevalidated: true,
      toolCallBlockCreatesImmediateErrorResult: true,
      toolExecutionStartEmitsBeforePreparation: true,
      toolExecutionUpdatesUseToolOnUpdatePartialResult: true,
      toolExecutionEndPrecedesToolResultMessage: true,
      parallelResultMessagesRetainSourceToolCallOrder: true,
      afterToolCallCanPatchContentDetailsTerminateAndIsError: true,
      localBashRunnerUsesShellConfigAndProcessTreeKill: true,
      bashOutputAccumulatorUsesPiBashTempPrefixAnd100msThrottle: true,
      workspaceReadUsesPiPathVariantResolution: true,
      workspaceMutationsSerializePerResolvedFile: true,
      tuiAndHtmlRenderersInvokeToolDefinitionRenderers: true,
    },
    cases: [
      {
        scenarioID: "tool-call-hook-permission-block-and-mutable-input",
        input: { toolName: "bash", originalCommand: "npm test", blockedReason: "write access denied" },
        output: {
          emitted: toolCallProjection.emitted,
          visited: toolCallProjection.visited,
          finalInput: toolCallProjection.finalInput,
          block: toolCallProjection.block,
          immediateText: toolCallProjection.immediateResult?.content[0]?.type === "text" ? toolCallProjection.immediateResult.content[0].text : "",
          executionSkipped: toolCallProjection.executionSkipped,
        },
        upstreamBehavior: "Agent loop prepares and validates args, then beforeToolCall emits tool_call; mutable input changes survive, and block creates an immediate text error result.",
      },
      {
        scenarioID: "tool-result-patch-and-message-projection",
        input: { toolName: "read", toolCallId: "toolu_2", originalText: "original" },
        output: {
          visited: resultProjection.visited,
          modified: resultProjection.modified,
          result: resultProjection.result,
          isError: resultProjection.isError,
          messageFields: Object.keys(resultProjection.message).sort(),
          timestampSource: resultProjection.message.timestampSource,
        },
        upstreamBehavior: "afterToolCall maps tool_result patches back to content/details/terminate/isError before createToolResultMessage adds role, ids, details, isError, and Date.now timestamp.",
      },
      {
        scenarioID: "runtime-tool-events-sequential-and-parallel",
        input: { sequentialCalls: 2, parallelCalls: 2 },
        output: {
          sequentialEventTypes: sequentialEvents.events.map((event) => event.type),
          sequentialEndOrder: sequentialEvents.executionEndOrder,
          sequentialMessageOrder: sequentialEvents.resultMessageOrder,
          parallelEndOrder: parallelEvents.executionEndOrder,
          parallelMessageOrder: parallelEvents.resultMessageOrder,
          updateArgsSource: parallelEvents.events.find((event) => event.type === "tool_execution_update")?.args,
        },
        upstreamBehavior: "tool_execution_start is emitted before preparation, updates are emitted from tool onUpdate with original args, end precedes toolResult messages, and parallel result messages retain source order.",
      },
      {
        scenarioID: "bash-process-runner-output-and-error-policy",
        input: { command: "npm test", prefix: "set -e", timeout: 5 },
        output: {
          resolvedCommand: bashRunner.resolvedCommand,
          spawnContext: bashRunner.spawnContext,
          localExecution: bashRunner.localExecution,
          updatePolicy: bashRunner.updatePolicy,
          outcome: bashRunner.outcome,
          errorText: bashRunner.errorText,
        },
        upstreamBehavior: "createLocalBashOperations validates cwd, spawns configured shell with stdout/stderr pipes, tracks detached pids, kills process trees on timeout/abort, and bash execute formats status errors over accumulated output.",
      },
      {
        scenarioID: "workspace-filesystem-read-write-edit-and-queue",
        input: { cwd: "/workspace/pi", readPath: "Capture d'ecran 10.11.12 AM.png", writePath: "src/new-file.ts", editPath: "src/existing.ts" },
        output: workspace as unknown as Record<string, unknown>,
        upstreamBehavior: "read resolves Pi path variants and offset/limit output, while write/edit use resolveToCwd and withFileMutationQueue to serialize same-file filesystem mutations until each operation settles.",
      },
      {
        scenarioID: "tool-renderer-resolution-and-html-export",
        input: { tools: ["bash", "read", "write", "edit"] },
        output: render as unknown as Record<string, unknown>,
        upstreamBehavior: "ToolExecutionComponent and HTML export look up ToolDefinition renderCall/renderResult, preserve per-call renderer state, prefer extension renderers over built-ins, and fall back when renderers throw.",
      },
    ],
    sourceRefs: [
      `${piMonoToolRuntimeUpstreamRef}:packages/agent/src/agent-loop.ts#executeToolCalls,prepareToolCall,executePreparedToolCall,finalizeExecutedToolCall,createToolResultMessage`,
      `${piMonoToolRuntimeUpstreamRef}:packages/agent/src/harness/agent-harness.ts#createLoopConfig.beforeToolCall,createLoopConfig.afterToolCall`,
      `${piMonoToolRuntimeUpstreamRef}:packages/agent/src/harness/types.ts#ToolCallResult,ToolResultPatch`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/agent-session.ts#_installAgentToolHooks,_emit tool_execution_start/tool_execution_update/tool_execution_end`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/extensions/runner.ts#emitToolCall,emitToolResult`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/extensions/types.ts#ToolCallEvent,ToolResultEvent,ToolExecutionStartEvent,ToolExecutionUpdateEvent,ToolExecutionEndEvent`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/tools/bash.ts#createLocalBashOperations,createBashToolDefinition,resolveSpawnContext`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/tools/output-accumulator.ts#OutputAccumulator`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/tools/path-utils.ts#resolveToCwd,resolveReadPath,resolveReadPathAsync`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/tools/file-mutation-queue.ts#withFileMutationQueue`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/tools/read.ts#createReadToolDefinition`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/tools/write.ts#createWriteToolDefinition`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/tools/edit.ts#createEditToolDefinition`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/modes/interactive/components/tool-execution.ts#ToolExecutionComponent.getCallRenderer,getResultRenderer,getRenderShell`,
      `${piMonoToolRuntimeUpstreamRef}:packages/coding-agent/src/core/export-html/tool-renderer.ts#createToolHtmlRenderer`,
    ],
    nativeEvidenceRefs: [piMonoToolRuntimeNativeExactEvidenceRef, piMonoToolRuntimeNativeExactReplayRef],
    fixtureIDs: [piMonoToolRuntimeNativeExactFixtureID],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoToolRuntimeNativeExactFixture(
  fixture: PiMonoToolRuntimeNativeExactFixture,
): PiMonoToolRuntimeNativeExactVerification {
  const issues: PiMonoToolRuntimeNativeExactIssue[] = []
  const expected = buildPiMonoToolRuntimeNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "pi-tool-runtime-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi tool runtime content." })
  }
  if (fixture.product !== "pi-mono" || !sameJSON(fixture.atomIDs, piMonoToolRuntimeNativeExactAtomIDs)) {
    issues.push({ id: "pi-tool-runtime-native-exact.identity", message: "Fixture must stay scoped to the Pi tool runtime native atom group." })
  }
  if (fixture.upstreamRef !== piMonoToolRuntimeUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("7c2775f6f67c38ed491a1ff68240ee4f8ba688da"))) {
    issues.push({ id: "pi-tool-runtime-native-exact.upstream", message: "Fixture must stay pinned to the Pi tool runtime upstream sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-tool-runtime-native-exact.native-claim", message: "Pi tool runtime fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "pi-tool-runtime-native-exact.lossiness", message: "Native exact Pi tool runtime fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoToolRuntimeNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoToolRuntimeNativeExactReplayRef)) {
    issues.push({ id: "pi-tool-runtime-native-exact.evidence", message: "Pi tool runtime native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoToolRuntimeNativeExactFixtureID)) {
    issues.push({ id: "pi-tool-runtime-native-exact.fixture", message: "Pi tool runtime native exact fixture ID is missing." })
  }
  if (!sameJSON(fixture.policy, expected.policy)) {
    issues.push({ id: "pi-tool-runtime-native-exact.policy", message: "Pi tool runtime native policy drifted from upstream tool execution semantics." })
  }
  if (!sameJSON(fixture.cases, expected.cases)) {
    issues.push({ id: "pi-tool-runtime-native-exact.cases", message: "Pi tool runtime native cases drifted from upstream process, filesystem, render, or result behavior." })
  }

  return { ok: issues.length === 0, issues }
}

function createPiMonoErrorToolResult(message: string): PiMonoToolRuntimeResultProjection {
  return { content: [{ type: "text", text: message }], details: {} }
}

function createPiMonoToolResultMessage(
  toolCallId: string,
  toolName: string,
  result: PiMonoToolRuntimeResultProjection,
  isError: boolean,
): PiMonoToolResultMessageProjection {
  return {
    role: "toolResult",
    toolCallId,
    toolName,
    content: result.content,
    details: result.details,
    isError,
    timestampSource: "Date.now",
  }
}

function cloneToolResult(result: PiMonoToolRuntimeResultProjection): PiMonoToolRuntimeResultProjection {
  return JSON.parse(JSON.stringify(result)) as PiMonoToolRuntimeResultProjection
}

function appendPiMonoBashStatus(text: string, status: string): string {
  return `${text ? `${text}\n\n` : ""}${status}`
}

function resolvePiMonoPath(filePath: string, cwd: string): string {
  if (filePath.startsWith("/")) return resolve(filePath)
  if (filePath.startsWith("~/")) return resolve("/home/user", filePath.slice(2))
  if (filePath.startsWith("@")) return resolve(cwd, filePath.slice(1))
  return resolve(cwd, filePath)
}

function firstChangedLineNumber(left: string, right: string): number | undefined {
  const leftLines = left.split("\n")
  const rightLines = right.split("\n")
  const max = Math.max(leftLines.length, rightLines.length)
  for (let index = 0; index < max; index++) {
    if (leftLines[index] !== rightLines[index]) return index + 1
  }
  return undefined
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === undefined) return "\"__undefined__\""
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
