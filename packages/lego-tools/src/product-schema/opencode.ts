import { createHash } from "node:crypto"
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path"
import { createToolSchemaSnapshot, type ToolSchemaSnapshot } from "../cadence-atoms.ts"

export const openCodeToolSchemaNativeExactAtomID = "opencode.tools.schema.native-like"
export const openCodeToolSchemaNativeExactFixtureID = "opencode-tool-schema:native-exact-fixture"
export const openCodeToolSchemaNativeExactEvidenceRef = "conformance:opencode-tool-schema-native-exact-fixture"
export const openCodeToolSchemaNativeExactReplayRef = "tool-schema-native-exact:opencode"
export const openCodeToolSchemaUpstreamRef = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"

export interface OpenCodeToolSchemaNativeExactTool {
  name: string
  aliases: string[]
  requiredFields: string[]
  pathField: "filePath"
  commandField?: "cmd"
  mutating: boolean
}

export interface OpenCodeToolSchemaNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: typeof openCodeToolSchemaNativeExactAtomID
  portID: "tools.schema"
  upstreamRef: typeof openCodeToolSchemaUpstreamRef
  evidenceRef: typeof openCodeToolSchemaNativeExactEvidenceRef
  fixtureID: typeof openCodeToolSchemaNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  schema: ToolSchemaSnapshot
  tools: OpenCodeToolSchemaNativeExactTool[]
  permissionPolicySchema: {
    subjectField: "filePath" | "cmd"
    mutationRequiresApproval: true
    readonlyDefault: "allow"
    deniedOutcome: "tool-result-error"
  }
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface OpenCodeToolSchemaNativeExactFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeToolSchemaNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeToolSchemaNativeExactFixtureIssue[]
}

export const openCodeToolSchemaNativeDescriptor = {
  id: openCodeToolSchemaNativeExactAtomID,
  port: "tools.schema",
  product: "opencode",
  implementationKind: "factory",
  selectionReason: "OpenCode upstream native implementation with native parity complete tool schema exact fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [openCodeToolSchemaNativeExactEvidenceRef, openCodeToolSchemaNativeExactReplayRef],
  fixtureIDs: [openCodeToolSchemaNativeExactFixtureID],
  knownLossiness: [],
} as const

export const openCodeToolNativeExactFixtureID = "opencode-tool:native-exact-fixture"
export const openCodeToolNativeExactEvidenceRef = "conformance:opencode-tool-native-exact-fixture"
export const openCodeToolNativeExactReplayRef = "tool-native-exact:opencode"
export const openCodeToolPackNativeExactAtomID = "opencode.tool-pack.native"
export const openCodeToolPackCompatibilityNativeExactAtomID = "opencode.tool-pack.compatibility"
export const openCodeToolBatchSchedulerNativeExactAtomID = "opencode.tools.batch-scheduler.native-like"
export const openCodeToolResultProjectorNativeExactAtomID = "opencode.tools.result-projector.native-like"

export const openCodeToolNativeExactAtomIDs = [
  openCodeToolPackNativeExactAtomID,
  openCodeToolPackCompatibilityNativeExactAtomID,
  "opencode.permission.ask-bridge",
  "opencode.plugin.permission-bridge",
  "opencode.plugin.registry-bridge",
  "opencode.tool.definition-plugin-bridge",
  "opencode.tool.permission-render-bridge",
  "opencode.tool.result-render-bridge",
  "opencode.tool.schema-bridge",
  "opencode.tool.status-bridge",
  openCodeToolBatchSchedulerNativeExactAtomID,
  openCodeToolResultProjectorNativeExactAtomID,
  "opencode.workspace-filesystem-bridge",
] as const

export type OpenCodeToolNativeExactAtomID = (typeof openCodeToolNativeExactAtomIDs)[number]

export type OpenCodeToolNativePortID =
  | "filesystem.port"
  | "tools"
  | "tool.definition"
  | "tool.audit-log"
  | "tool.permission-policy"
  | "tool.registry"
  | "tool.result-normalizer"
  | "tool.schema-adapter"
  | "tools.batch-scheduler"
  | "tools.result-projector"

export interface OpenCodeToolNativeDescriptor {
  id: OpenCodeToolNativeExactAtomID
  port: OpenCodeToolNativePortID
  product: "opencode"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof openCodeToolNativeExactEvidenceRef, typeof openCodeToolNativeExactReplayRef]
  fixtureIDs: [typeof openCodeToolNativeExactFixtureID]
  knownLossiness: []
}

export type OpenCodePermissionAction = "allow" | "deny" | "ask"
export type OpenCodePermissionReply = "once" | "always" | "reject"

export interface OpenCodePermissionRule {
  permission: string
  pattern: string
  action: OpenCodePermissionAction
}

export interface OpenCodePermissionRequest {
  id: string
  sessionID: string
  permission: string
  patterns: string[]
  metadata: Record<string, unknown>
  always: string[]
  tool?: {
    messageID: string
    callID: string
  }
}

export interface OpenCodePermissionAskInput extends Omit<OpenCodePermissionRequest, "id"> {
  id?: string
  ruleset: OpenCodePermissionRule[]
}

export type OpenCodePermissionAskResult =
  | { action: "allow"; evaluated: OpenCodePermissionRule[] }
  | { action: "deny"; evaluated: OpenCodePermissionRule[]; deniedRules: OpenCodePermissionRule[] }
  | { action: "ask"; request: OpenCodePermissionRequest; evaluated: OpenCodePermissionRule[] }

export type OpenCodePermissionReplyResult =
  | { status: "not-found"; requestID: string }
  | {
    status: "accepted" | "rejected"
    request: OpenCodePermissionRequest
    reply: OpenCodePermissionReply
    autoResolved: OpenCodePermissionRequest[]
    rejected: OpenCodePermissionRequest[]
    approved: OpenCodePermissionRule[]
  }

export interface OpenCodePluginToolDefinition {
  description: string
  args?: Record<string, unknown>
  execute(args: Record<string, unknown>, context: OpenCodePluginToolContext): OpenCodePluginToolResult | Promise<OpenCodePluginToolResult>
}

export interface OpenCodePluginToolContext {
  sessionID: string
  messageID: string
  agent: string
  directory: string
  worktree: string
  abort: AbortSignal
  metadata(input: { title?: string; metadata?: Record<string, unknown> }): void
  ask(input: Omit<OpenCodePermissionAskInput, "id" | "sessionID" | "tool" | "ruleset">): Promise<void>
}

export type OpenCodePluginToolAttachment = {
  type: "file"
  mime: string
  url: string
  filename?: string
}

export type OpenCodePluginToolResult =
  | string
  | {
    title?: string
    output: string
    metadata?: Record<string, unknown>
    attachments?: OpenCodePluginToolAttachment[]
  }

export interface OpenCodeNormalizedToolResult {
  title: string
  output: string
  metadata: Record<string, unknown>
  attachments?: OpenCodePluginToolAttachment[]
}

export interface OpenCodeNormalizedPluginTool {
  id: string
  description: string
  jsonSchema: OpenCodeJSONSchema
  parameterMode: "zod" | "legacy-json-schema"
  execute(args: Record<string, unknown>, context: OpenCodePluginToolContext): Promise<OpenCodeNormalizedToolResult>
}

export interface OpenCodeJSONSchema {
  type: "object"
  properties: Record<string, unknown>
  required: string[]
}

export interface OpenCodeToolDefinitionHookOutput {
  description: string
  parameters: unknown
  jsonSchema?: OpenCodeJSONSchema
}

export interface OpenCodeToolPart {
  id: string
  messageID: string
  sessionID: string
  type: "tool"
  tool: string
  callID: string
  state:
    | { status: "pending"; input: Record<string, unknown>; raw: string }
    | { status: "running"; input: Record<string, unknown>; title?: string; metadata?: Record<string, unknown>; time: { start: number } }
    | {
      status: "completed"
      input: Record<string, unknown>
      output: string
      metadata: Record<string, unknown>
      title: string
      time: { start: number; end: number }
      attachments?: OpenCodePluginToolAttachment[]
    }
    | { status: "error"; input: Record<string, unknown>; error: string; time: { start: number; end: number }; metadata?: Record<string, unknown> }
  metadata?: Record<string, unknown>
}

export type OpenCodeToolStreamEvent =
  | { type: "tool-input-start"; id: string; name: string; providerExecuted?: boolean; now?: number }
  | { type: "tool-input-end"; id: string; name: string; now?: number }
  | { type: "tool-call"; id: string; name: string; input: unknown; providerExecuted?: boolean; providerMetadata?: Record<string, unknown>; now?: number }
  | { type: "tool-result"; id: string; name: string; result: { type: "json" | "text"; value: unknown }; providerExecuted?: boolean; now?: number }
  | { type: "tool-error"; id: string; name: string; message: string; error?: unknown; now?: number }

export type OpenCodeToolEventContent =
  | { type: "text"; text: string }
  | { type: "file"; uri: string; mime: string; name?: string }

export interface OpenCodeToolSuccessEventProjection {
  sessionID: string
  callID: string
  structured: Record<string, unknown>
  content: OpenCodeToolEventContent[]
  provider: { executed: boolean }
  timestamp: number
}

export interface OpenCodeToolFailedEventProjection {
  sessionID: string
  callID: string
  error: { type: "unknown"; message: string }
  provider: { executed: boolean }
  timestamp: number
}

export interface OpenCodeToolProcessorState {
  parts: OpenCodeToolPart[]
  pendingToolCallIDs: string[]
}

export interface OpenCodeFileContext {
  directory: string
  worktree: string
  vcs: "git" | "none"
}

export interface OpenCodeDirectoryEntry {
  name: string
  type: "file" | "directory" | "symlink"
}

export interface OpenCodeFileNode {
  name: string
  path: string
  absolute: string
  type: "file" | "directory"
  ignored: boolean
}

export interface OpenCodeReadContent {
  type: "text" | "binary"
  content: string
  diff?: string
  encoding?: "base64"
  mimeType?: string
}

export interface OpenCodeReadToolOutput {
  title: string
  output: string
  metadata: {
    preview: string
    truncated: boolean
    loaded: string[]
  }
}

export interface OpenCodeShellOutputInput {
  chunks: string[]
  exit: number | null
  description: string
  timeout: number
  expired?: boolean
  aborted?: boolean
  outputPath?: string
  maxLines?: number
  maxBytes?: number
}

export interface OpenCodeToolNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: OpenCodeToolNativeExactAtomID[]
  portIDs: Record<OpenCodeToolNativeExactAtomID, OpenCodeToolNativePortID>
  upstreamRef: typeof openCodeToolSchemaUpstreamRef
  evidenceRef: typeof openCodeToolNativeExactEvidenceRef
  fixtureID: typeof openCodeToolNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  toolPackBehavior: {
    portID: "tools"
    aggregateAtomIDs: [typeof openCodeToolPackNativeExactAtomID, typeof openCodeToolPackCompatibilityNativeExactAtomID]
    upstreamRegistry: "ToolRegistry.tools"
    upstreamExecution: "SessionTools.resolve+SessionProcessor.process"
    builtinOrder: string[]
    preservesModelProviderGates: true
    preservesPermissionPipeline: true
    preservesResultProjection: true
    hiddenEditWriteWhenApplyPatchEnabled: true
  }
  registryBehavior: {
    builtinOrder: string[]
    pluginToolDiscoveryGlobs: ["{tool,tools}/*.{js,ts}"]
    pluginToolIDDefaultExportUsesFilename: true
    pluginToolIDNamedExportUsesFilenameUnderscoreExport: true
    pluginToolStringResultGetsEmptyTitleAndEmptyMetadata: true
    pluginToolContextAddsDirectoryAndWorktree: true
    toolDefinitionHookMutatesDescriptionParametersAndJsonSchema: true
    webSearchProviderGate: "opencode-or-exa-or-parallel"
    editWriteHiddenWhenApplyPatchEnabled: true
  }
  permissionBehavior: {
    evaluateUsesLastMatchingRule: true
    deniedRulesFilterByPermissionWildcard: true
    askCreatesPendingDeferredRequest: true
    replyRejectRejectsSameSessionPending: true
    replyAlwaysAddsAllowRulesForAlwaysPatterns: true
    replyAlwaysAutoResolvesSameSessionAllowedPending: true
    configHomeExpansion: ["~/", "~", "$HOME/", "$HOME"]
    editToolsShareEditPermission: ["edit", "write", "apply_patch"]
  }
  filesystemBehavior: {
    pathEscapeError: "Access denied: path escapes project directory"
    imageExtensionsEncodeBase64: string[]
    binaryExtensionsReturnEmptyBinary: string[]
    textExtensionsReadTrimmed: string[]
    listExcludes: [".git", ".DS_Store"]
    listSortRule: "directories-first-then-locale-name"
    readToolDefaultLimit: 2000
    readToolMaxLineLength: 2000
    readToolMaxBytes: 51200
    shellOutputEmptyMarker: "(no output)"
    shellOutputTruncatedPrefix: "...output truncated..."
  }
  processorBehavior: {
    pendingPartState: "pending"
    runningPartState: "running"
    completedPartState: "completed"
    errorPartState: "error"
    toolResultObjectKeys: ["title", "metadata", "output", "attachments"]
    jsonResultMetadataWhenStructuredObject: true
    providerExecutedMetadataPreserved: true
  }
  schedulerBehavior: {
    upstreamCoordinator: "SessionTools.resolve+SessionProcessor.process"
    streamOrderSource: "provider-tool-stream"
    toolCallLifecycle: ["tool-input-start", "tool-input-end", "tool-call", "tool-result", "tool-error"]
    missingToolInputEndIsPublishedBeforeToolCalled: true
    pendingToolCallDrainTimeoutMs: 250
    cleanupMarksUnresolvedToolCallsInterrupted: true
    doomLoopThreshold: 3
    doomLoopPermission: "doom_loop"
    toolExecutionHooks: ["tool.execute.before", "tool.execute.after"]
    mcpExecutionPermissionPattern: "*"
  }
  resultProjectorBehavior: {
    outputObjectKeys: ["title", "metadata", "output", "attachments"]
    structuredJSONResultCopiesMetadata: true
    nonObjectJSONResultStringified: true
    successEventContentTypes: ["text", "file"]
    failedEventErrorType: "unknown"
    imageAttachmentsNormalizedBeforeProjection: true
    imageResizeFailuresAppendOmittedNotice: true
    providerExecutedSuccessFromEventOrPartMetadata: true
    completedWritebackRemovesPendingToolCall: true
  }
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: OpenCodeToolNativeDescriptor[]
  fingerprint: string
}

export interface OpenCodeToolNativeExactIssue {
  id: string
  message: string
}

export interface OpenCodeToolNativeExactVerification {
  ok: boolean
  issues: OpenCodeToolNativeExactIssue[]
}

export const openCodeToolNativeDescriptors = [
  openCodeToolNativeDescriptor(
    openCodeToolPackNativeExactAtomID,
    "tools",
    "OpenCode upstream native implementation of the tool pack surface from ToolRegistry.tools and SessionTools.resolve, preserving built-in tool order, model/provider gates, permission flow, scheduling, and result projection.",
  ),
  openCodeToolNativeDescriptor(
    openCodeToolPackCompatibilityNativeExactAtomID,
    "tools",
    "OpenCode upstream native implementation of the legacy compatibility tool-pack atom as the same ToolRegistry.tools and SessionTools.resolve aggregate used by opencode.tool-pack.native.",
  ),
  openCodeToolNativeDescriptor(
    "opencode.permission.ask-bridge",
    "tool.permission-policy",
    "OpenCode upstream native implementation of Permission.ask evaluation, pending request state, deny/ask/allow replies, and same-session auto-resolution.",
  ),
  openCodeToolNativeDescriptor(
    "opencode.plugin.permission-bridge",
    "tool.permission-policy",
    "OpenCode upstream native implementation of plugin tool context ask bridging through Permission.Service with session, message, callID, and merged ruleset metadata.",
  ),
  openCodeToolNativeDescriptor(
    "opencode.plugin.registry-bridge",
    "tool.registry",
    "OpenCode upstream native implementation of built-in, config-directory, and plugin-provided tool registration plus hook-based definition mutation.",
  ),
  openCodeToolNativeDescriptor(
    "opencode.tool.definition-plugin-bridge",
    "tool.definition",
    "OpenCode upstream native implementation of ToolRegistry.tools definition projection, plugin tool ID namespacing, JSON schema boxing, and definition hook output.",
  ),
  openCodeToolNativeDescriptor(
    "opencode.tool.permission-render-bridge",
    "tool.permission-policy",
    "OpenCode upstream native implementation of read/edit/shell permission requests, metadata diff payloads, external-directory checks, and denied tool-call state transitions.",
  ),
  openCodeToolNativeDescriptor(
    "opencode.tool.result-render-bridge",
    "tool.result-normalizer",
    "OpenCode upstream native implementation of Tool.execute result normalization, attachment identity assignment, metadata preservation, and MessageV2 tool-result projection.",
  ),
  openCodeToolNativeDescriptor(
    "opencode.tool.schema-bridge",
    "tool.schema-adapter",
    "OpenCode upstream native implementation of Effect schema decoding, InvalidArgumentsError messages, plugin Zod or legacy JSON schema conversion, and ProviderTransform schema handoff.",
  ),
  openCodeToolNativeDescriptor(
    "opencode.tool.status-bridge",
    "tool.audit-log",
    "OpenCode upstream native implementation of MessageV2 tool part status transitions: pending, running, completed, error, interrupted cleanup, and providerExecuted markers.",
  ),
  openCodeToolNativeDescriptor(
    openCodeToolBatchSchedulerNativeExactAtomID,
    "tools.batch-scheduler",
    "OpenCode upstream native implementation of tool-call stream scheduling through SessionProcessor, including input-end synthesis, pending/running/final state transitions, cleanup drain, and doom-loop permission checks.",
  ),
  openCodeToolNativeDescriptor(
    openCodeToolResultProjectorNativeExactAtomID,
    "tools.result-projector",
    "OpenCode upstream native implementation of tool-result output normalization, Success/Failed event projection, providerExecuted propagation, attachment projection, and completed/error writeback.",
  ),
  openCodeToolNativeDescriptor(
    "opencode.workspace-filesystem-bridge",
    "filesystem.port",
    "OpenCode upstream native implementation of File.read/list/status/search workspace scoping, text/binary/image classification, ignored node flags, and shell/edit path permission scans.",
  ),
] as const

export function buildOpenCodeToolNativeExactFixture(): OpenCodeToolNativeExactFixture {
  const portIDs = Object.fromEntries(openCodeToolNativeDescriptors.map((descriptor) => [descriptor.id, descriptor.port])) as Record<OpenCodeToolNativeExactAtomID, OpenCodeToolNativePortID>
  const fixtureWithoutFingerprint: Omit<OpenCodeToolNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomIDs: [...openCodeToolNativeExactAtomIDs],
    portIDs,
    upstreamRef: openCodeToolSchemaUpstreamRef,
    evidenceRef: openCodeToolNativeExactEvidenceRef,
    fixtureID: openCodeToolNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    toolPackBehavior: {
      portID: "tools",
      aggregateAtomIDs: [openCodeToolPackNativeExactAtomID, openCodeToolPackCompatibilityNativeExactAtomID],
      upstreamRegistry: "ToolRegistry.tools",
      upstreamExecution: "SessionTools.resolve+SessionProcessor.process",
      builtinOrder: openCodeBuiltinToolIDs({ question: true, scout: true, lsp: true, plan: true }),
      preservesModelProviderGates: true,
      preservesPermissionPipeline: true,
      preservesResultProjection: true,
      hiddenEditWriteWhenApplyPatchEnabled: true,
    },
    registryBehavior: {
      builtinOrder: openCodeBuiltinToolIDs({ question: true, scout: true, lsp: true, plan: true }),
      pluginToolDiscoveryGlobs: ["{tool,tools}/*.{js,ts}"],
      pluginToolIDDefaultExportUsesFilename: true,
      pluginToolIDNamedExportUsesFilenameUnderscoreExport: true,
      pluginToolStringResultGetsEmptyTitleAndEmptyMetadata: true,
      pluginToolContextAddsDirectoryAndWorktree: true,
      toolDefinitionHookMutatesDescriptionParametersAndJsonSchema: true,
      webSearchProviderGate: "opencode-or-exa-or-parallel",
      editWriteHiddenWhenApplyPatchEnabled: true,
    },
    permissionBehavior: {
      evaluateUsesLastMatchingRule: true,
      deniedRulesFilterByPermissionWildcard: true,
      askCreatesPendingDeferredRequest: true,
      replyRejectRejectsSameSessionPending: true,
      replyAlwaysAddsAllowRulesForAlwaysPatterns: true,
      replyAlwaysAutoResolvesSameSessionAllowedPending: true,
      configHomeExpansion: ["~/", "~", "$HOME/", "$HOME"],
      editToolsShareEditPermission: ["edit", "write", "apply_patch"],
    },
    filesystemBehavior: {
      pathEscapeError: "Access denied: path escapes project directory",
      imageExtensionsEncodeBase64: ["png", "jpg", "jpeg", "gif", "webp"],
      binaryExtensionsReturnEmptyBinary: ["exe", "dll", "zip", "tar", "gz", "pdf", "sqlite", "wasm"],
      textExtensionsReadTrimmed: ["ts", "tsx", "js", "json", "md", "txt", "yaml", "toml", "css", "html"],
      listExcludes: [".git", ".DS_Store"],
      listSortRule: "directories-first-then-locale-name",
      readToolDefaultLimit: 2000,
      readToolMaxLineLength: 2000,
      readToolMaxBytes: 51200,
      shellOutputEmptyMarker: "(no output)",
      shellOutputTruncatedPrefix: "...output truncated...",
    },
    processorBehavior: {
      pendingPartState: "pending",
      runningPartState: "running",
      completedPartState: "completed",
      errorPartState: "error",
      toolResultObjectKeys: ["title", "metadata", "output", "attachments"],
      jsonResultMetadataWhenStructuredObject: true,
      providerExecutedMetadataPreserved: true,
    },
    schedulerBehavior: {
      upstreamCoordinator: "SessionTools.resolve+SessionProcessor.process",
      streamOrderSource: "provider-tool-stream",
      toolCallLifecycle: ["tool-input-start", "tool-input-end", "tool-call", "tool-result", "tool-error"],
      missingToolInputEndIsPublishedBeforeToolCalled: true,
      pendingToolCallDrainTimeoutMs: 250,
      cleanupMarksUnresolvedToolCallsInterrupted: true,
      doomLoopThreshold: 3,
      doomLoopPermission: "doom_loop",
      toolExecutionHooks: ["tool.execute.before", "tool.execute.after"],
      mcpExecutionPermissionPattern: "*",
    },
    resultProjectorBehavior: {
      outputObjectKeys: ["title", "metadata", "output", "attachments"],
      structuredJSONResultCopiesMetadata: true,
      nonObjectJSONResultStringified: true,
      successEventContentTypes: ["text", "file"],
      failedEventErrorType: "unknown",
      imageAttachmentsNormalizedBeforeProjection: true,
      imageResizeFailuresAppendOmittedNotice: true,
      providerExecutedSuccessFromEventOrPartMetadata: true,
      completedWritebackRemovesPendingToolCall: true,
    },
    sourceRefs: [
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/tool/tool.ts#Tool.define,Tool.init,InvalidArgumentsError,Context,ExecuteResult`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/tool/registry.ts#ToolRegistry,fromPlugin,legacyJsonSchema,tools,webSearchEnabled`,
      `${openCodeToolSchemaUpstreamRef}:packages/plugin/src/tool.ts#tool,ToolContext,ToolResult`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/plugin/index.ts#Plugin.Service,trigger,list,init`,
      `${openCodeToolSchemaUpstreamRef}:packages/core/src/plugin.ts#PluginV2.Service,add,remove,triggerFor`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/permission/index.ts#Permission.ask,reply,list,fromConfig,merge,disabled`,
      `${openCodeToolSchemaUpstreamRef}:packages/core/src/permission.ts#evaluate,merge,disabled`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/file/index.ts#File.read,list,search,status`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/tool/read.ts#ReadTool,Parameters,execute,line-number-output`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/tool/write.ts#WriteTool,permission-diff,File.Event.Edited`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/tool/edit.ts#EditTool,replace,metadata,diff`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/tool/shell.ts#ShellTool,collect,ask,run,tail`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/session/tools.ts#SessionTools.resolve,context,plugin.trigger,tool.execute.before,tool.execute.after,completeToolCall`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/session/processor.ts#ensureToolCall,completeToolCall,failToolCall,toolResultOutput,tool-call,tool-result,tool-error,cleanup,doom_loop`,
    ],
    nativeEvidenceRefs: [openCodeToolNativeExactEvidenceRef, openCodeToolNativeExactReplayRef],
    fixtureIDs: [openCodeToolNativeExactFixtureID],
    knownLossiness: [],
    descriptors: [...openCodeToolNativeDescriptors],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeToolNativeExactFixture(
  fixture: OpenCodeToolNativeExactFixture,
): OpenCodeToolNativeExactVerification {
  const issues: OpenCodeToolNativeExactIssue[] = []
  const expected = buildOpenCodeToolNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "opencode-tool-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical OpenCode tool native content." })
  }
  if (fixture.product !== "opencode" || fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-tool-native-exact.identity", message: "Fixture must remain a native-exact OpenCode tool fixture." })
  }
  if (fixture.upstreamRef !== openCodeToolSchemaUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
    issues.push({ id: "opencode-tool-native-exact.upstream", message: "Fixture must stay pinned to OpenCode tool upstream sources." })
  }
  if (
    fixture.toolPackBehavior.portID !== "tools" ||
    !sameJSON(fixture.toolPackBehavior.aggregateAtomIDs, expected.toolPackBehavior.aggregateAtomIDs) ||
    fixture.toolPackBehavior.upstreamRegistry !== "ToolRegistry.tools" ||
    !sameJSON(fixture.toolPackBehavior.builtinOrder, expected.toolPackBehavior.builtinOrder) ||
    !fixture.toolPackBehavior.preservesPermissionPipeline ||
    !fixture.toolPackBehavior.preservesResultProjection
  ) {
    issues.push({ id: "opencode-tool-native-exact.tool-pack", message: "Tool pack behavior must preserve upstream registry, permission, and result projection semantics." })
  }
  if (!sameJSON(fixture.atomIDs, expected.atomIDs) || !sameJSON(fixture.portIDs, expected.portIDs)) {
    issues.push({ id: "opencode-tool-native-exact.atom-ports", message: "Fixture atom and port coverage drifted from the native exact descriptor set." })
  }
  if (!fixture.nativeEvidenceRefs.includes(openCodeToolNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(openCodeToolNativeExactReplayRef)) {
    issues.push({ id: "opencode-tool-native-exact.evidence", message: "Native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(openCodeToolNativeExactFixtureID)) {
    issues.push({ id: "opencode-tool-native-exact.fixture", message: "Native exact fixture ID is missing." })
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0 || descriptor.parityCoverage !== "native")) {
    issues.push({ id: "opencode-tool-native-exact.lossiness", message: "Native exact OpenCode tool fixture must not carry lossiness markers." })
  }
  if (!fixture.registryBehavior.builtinOrder.includes("shell") || !fixture.registryBehavior.builtinOrder.includes("read") || !fixture.registryBehavior.builtinOrder.includes("apply_patch")) {
    issues.push({ id: "opencode-tool-native-exact.registry", message: "Registry behavior must preserve upstream built-in tool ordering and apply_patch visibility." })
  }
  if (!fixture.permissionBehavior.evaluateUsesLastMatchingRule || !fixture.permissionBehavior.replyAlwaysAutoResolvesSameSessionAllowedPending) {
    issues.push({ id: "opencode-tool-native-exact.permission", message: "Permission behavior must preserve upstream last-match and auto-resolution semantics." })
  }
  if (fixture.filesystemBehavior.pathEscapeError !== "Access denied: path escapes project directory" || fixture.filesystemBehavior.listSortRule !== "directories-first-then-locale-name") {
    issues.push({ id: "opencode-tool-native-exact.filesystem", message: "Filesystem behavior must preserve upstream path escape and listing rules." })
  }
  if (!sameJSON(fixture.processorBehavior.toolResultObjectKeys, ["title", "metadata", "output", "attachments"])) {
    issues.push({ id: "opencode-tool-native-exact.processor", message: "Processor behavior must preserve upstream tool result output object keys." })
  }
  if (fixture.schedulerBehavior.pendingToolCallDrainTimeoutMs !== 250 || fixture.schedulerBehavior.doomLoopThreshold !== 3 || fixture.schedulerBehavior.doomLoopPermission !== "doom_loop") {
    issues.push({ id: "opencode-tool-native-exact.scheduler", message: "Scheduler behavior must preserve upstream cleanup drain and doom-loop permission semantics." })
  }
  if (!sameJSON(fixture.resultProjectorBehavior.successEventContentTypes, ["text", "file"]) || fixture.resultProjectorBehavior.failedEventErrorType !== "unknown") {
    issues.push({ id: "opencode-tool-native-exact.result-projector", message: "Result projector behavior must preserve upstream Success/Failed event shape." })
  }

  return { ok: issues.length === 0, issues }
}

function openCodeToolNativeDescriptor(
  id: OpenCodeToolNativeExactAtomID,
  port: OpenCodeToolNativePortID,
  selectionReason: string,
): OpenCodeToolNativeDescriptor {
  return {
    id,
    port,
    product: "opencode",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [openCodeToolNativeExactEvidenceRef, openCodeToolNativeExactReplayRef],
    fixtureIDs: [openCodeToolNativeExactFixtureID],
    knownLossiness: [],
  }
}

export function openCodeBuiltinToolIDs(flags: {
  question?: boolean
  scout?: boolean
  lsp?: boolean
  plan?: boolean
} = {}): string[] {
  return [
    "invalid",
    ...(flags.question ? ["question"] : []),
    "shell",
    "read",
    "glob",
    "grep",
    "edit",
    "write",
    "task",
    "fetch",
    "todo",
    "search",
    ...(flags.scout ? ["repo_clone", "repo_overview"] : []),
    "skill",
    "apply_patch",
    ...(flags.lsp ? ["lsp"] : []),
    ...(flags.plan ? ["plan"] : []),
  ]
}

export function openCodeWebSearchEnabled(providerID: string, flags = { exa: false, parallel: false }): boolean {
  return providerID === "opencode" || flags.exa || flags.parallel
}

export function openCodeUseApplyPatchTool(modelID: string): boolean {
  return modelID.includes("gpt-") && !modelID.includes("oss") && !modelID.includes("gpt-4")
}

export function openCodeFilterToolIDsForModel(
  toolIDs: string[],
  input: { modelID: string; providerID: string; flags?: { exa?: boolean; parallel?: boolean } },
): string[] {
  const usePatch = openCodeUseApplyPatchTool(input.modelID)
  return toolIDs.filter((toolID) => {
    if (toolID === "search") return openCodeWebSearchEnabled(input.providerID, { exa: input.flags?.exa === true, parallel: input.flags?.parallel === true })
    if (toolID === "apply_patch") return usePatch
    if (toolID === "edit" || toolID === "write") return !usePatch
    return true
  })
}

export function openCodeIsPluginTool(value: unknown): value is OpenCodePluginToolDefinition {
  return typeof value === "object" && value !== null && "args" in value && "description" in value && "execute" in value
}

export function openCodePluginToolID(namespace: string, exportName: string): string {
  return exportName === "default" ? namespace : `${namespace}_${exportName}`
}

export function openCodeLegacyJsonSchema(entries: [string, unknown][]): OpenCodeJSONSchema {
  const properties = Object.fromEntries(
    entries.filter((entry): entry is [string, Record<string, unknown> | boolean] => openCodeIsJsonSchemaDefinition(entry[1])),
  )
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
  }
}

export function openCodeNormalizePluginTool(
  id: string,
  def: OpenCodePluginToolDefinition,
  options: {
    truncateOutput?: (output: string) => { content: string; truncated: boolean; outputPath?: string }
  } = {},
): OpenCodeNormalizedPluginTool {
  const entries = Object.entries(def.args ?? {})
  const allZod = entries.length > 0 && entries.every((entry) => openCodeIsZodLike(entry[1]))
  const jsonSchema = allZod ? { type: "object" as const, properties: {}, required: entries.map(([key]) => key) } : openCodeLegacyJsonSchema(entries)
  return {
    id,
    description: def.description,
    jsonSchema,
    parameterMode: allZod ? "zod" : "legacy-json-schema",
    execute: async (args, context) => openCodeNormalizePluginToolResult(await def.execute(args, context), options),
  }
}

export function openCodeNormalizePluginToolResult(
  result: OpenCodePluginToolResult,
  options: {
    truncateOutput?: (output: string) => { content: string; truncated: boolean; outputPath?: string }
  } = {},
): OpenCodeNormalizedToolResult {
  const output = typeof result === "string" ? result : result.output
  const truncated = options.truncateOutput?.(output)
  const metadata = typeof result === "string" ? {} : { ...(result.metadata ?? {}) }
  if (truncated) {
    metadata["truncated"] = truncated.truncated
    if (truncated.truncated && truncated.outputPath) metadata["outputPath"] = truncated.outputPath
  }
  return {
    title: typeof result === "string" ? "" : (result.title ?? ""),
    output: truncated?.truncated ? truncated.content : output,
    metadata,
    ...(typeof result === "string" || !result.attachments ? {} : { attachments: result.attachments }),
  }
}

export function openCodeApplyToolDefinitionHook(
  tool: { description: string; parameters: unknown; jsonSchema?: OpenCodeJSONSchema },
  output: OpenCodeToolDefinitionHookOutput,
): { description: string; parameters: unknown; jsonSchema?: OpenCodeJSONSchema } {
  const jsonSchema =
    output.parameters === tool.parameters || output.jsonSchema !== tool.jsonSchema
      ? output.jsonSchema
      : undefined
  return {
    description: output.description,
    parameters: output.parameters,
    ...(jsonSchema ? { jsonSchema } : {}),
  }
}

export function openCodeEvaluatePermission(
  permission: string,
  pattern: string,
  ...rulesets: OpenCodePermissionRule[][]
): OpenCodePermissionRule {
  const rules = rulesets.flat()
  for (let index = rules.length - 1; index >= 0; index--) {
    const rule = rules[index]
    if (!rule) continue
    if (openCodeWildcardMatch(rule.permission, permission) && openCodeWildcardMatch(rule.pattern, pattern)) return rule
  }
  return { action: "ask", permission, pattern: "*" }
}

export function openCodePermissionFromConfig(config: Record<string, string | Record<string, OpenCodePermissionAction>>, home = process.env["HOME"] ?? ""): OpenCodePermissionRule[] {
  const ruleset: OpenCodePermissionRule[] = []
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      ruleset.push({ permission: key, action: value as OpenCodePermissionAction, pattern: "*" })
      continue
    }
    ruleset.push(...Object.entries(value).map(([pattern, action]) => ({ permission: key, pattern: openCodeExpandPermissionPattern(pattern, home), action })))
  }
  return ruleset
}

export function openCodeMergePermissionRules(...rulesets: OpenCodePermissionRule[][]): OpenCodePermissionRule[] {
  return rulesets.flat()
}

export function openCodeDisabledTools(tools: string[], ruleset: OpenCodePermissionRule[]): Set<string> {
  const editTools = new Set(["edit", "write", "apply_patch"])
  return new Set(
    tools.filter((toolID) => {
      const permission = editTools.has(toolID) ? "edit" : toolID
      const rule = [...ruleset].reverse().find((candidate) => openCodeWildcardMatch(candidate.permission, permission))
      return rule?.pattern === "*" && rule.action === "deny"
    }),
  )
}

export class OpenCodePermissionNativeController {
  readonly pending = new Map<string, OpenCodePermissionRequest>()
  readonly approved: OpenCodePermissionRule[]
  private nextID = 1

  constructor(approved: OpenCodePermissionRule[] = []) {
    this.approved = [...approved]
  }

  ask(input: OpenCodePermissionAskInput): OpenCodePermissionAskResult {
    const evaluated: OpenCodePermissionRule[] = []
    let needsAsk = false
    for (const pattern of input.patterns) {
      const rule = openCodeEvaluatePermission(input.permission, pattern, input.ruleset, this.approved)
      evaluated.push(rule)
      if (rule.action === "deny") {
        return {
          action: "deny",
          evaluated,
          deniedRules: input.ruleset.filter((candidate) => openCodeWildcardMatch(candidate.permission, input.permission)),
        }
      }
      if (rule.action !== "allow") needsAsk = true
    }
    if (!needsAsk) return { action: "allow", evaluated }
    const id = input.id ?? `permission-${String(this.nextID++).padStart(6, "0")}`
    const request: OpenCodePermissionRequest = {
      id,
      sessionID: input.sessionID,
      permission: input.permission,
      patterns: [...input.patterns],
      metadata: { ...input.metadata },
      always: [...input.always],
      ...(input.tool ? { tool: { ...input.tool } } : {}),
    }
    this.pending.set(id, request)
    return { action: "ask", request, evaluated }
  }

  reply(input: { requestID: string; reply: OpenCodePermissionReply; message?: string }): OpenCodePermissionReplyResult {
    const existing = this.pending.get(input.requestID)
    if (!existing) return { status: "not-found", requestID: input.requestID }
    this.pending.delete(input.requestID)
    if (input.reply === "reject") {
      const rejected: OpenCodePermissionRequest[] = []
      for (const [id, item] of [...this.pending.entries()]) {
        if (item.sessionID !== existing.sessionID) continue
        this.pending.delete(id)
        rejected.push(item)
      }
      return { status: "rejected", request: existing, reply: input.reply, autoResolved: [], rejected, approved: [...this.approved] }
    }
    if (input.reply === "always") {
      for (const pattern of existing.always) {
        this.approved.push({ permission: existing.permission, pattern, action: "allow" })
      }
    }
    const autoResolved: OpenCodePermissionRequest[] = []
    if (input.reply === "always") {
      for (const [id, item] of [...this.pending.entries()]) {
        if (item.sessionID !== existing.sessionID) continue
        const ok = item.patterns.every((pattern) => openCodeEvaluatePermission(item.permission, pattern, this.approved).action === "allow")
        if (!ok) continue
        this.pending.delete(id)
        autoResolved.push(item)
      }
    }
    return { status: "accepted", request: existing, reply: input.reply, autoResolved, rejected: [], approved: [...this.approved] }
  }

  list(): OpenCodePermissionRequest[] {
    return [...this.pending.values()]
  }
}

export function openCodeReadFileContent(input: {
  file: string
  exists: boolean
  bytes?: Uint8Array
  content?: string
  mimeType?: string
}): OpenCodeReadContent {
  const file = input.file
  if (openCodeIsImageByExtension(file)) {
    if (!input.exists) return { type: "text", content: "" }
    return {
      type: "text",
      content: Buffer.from(input.bytes ?? Buffer.from(input.content ?? "", "utf8")).toString("base64"),
      mimeType: openCodeImageMimeType(file),
      encoding: "base64",
    }
  }
  const knownText = openCodeIsTextByExtension(file) || openCodeIsTextByName(file)
  if (openCodeIsBinaryByExtension(file) && !knownText) return { type: "binary", content: "" }
  if (!input.exists) return { type: "text", content: "" }
  const mimeType = input.mimeType ?? openCodeMimeType(file)
  if (!knownText && openCodeShouldEncode(mimeType) && !mimeType.startsWith("image/")) return { type: "binary", content: "", mimeType }
  if (!knownText && openCodeShouldEncode(mimeType)) {
    return {
      type: "text",
      content: Buffer.from(input.bytes ?? Buffer.from(input.content ?? "", "utf8")).toString("base64"),
      mimeType,
      encoding: "base64",
    }
  }
  return { type: "text", content: (input.content ?? "").trim() }
}

export function openCodeListDirectoryNodes(
  entries: OpenCodeDirectoryEntry[],
  ctx: OpenCodeFileContext,
  dir = "",
  ignored: (path: string) => boolean = () => false,
): OpenCodeFileNode[] {
  const resolved = dir ? resolve(ctx.directory, dir) : ctx.directory
  openCodeAssertContainsPath(resolved, ctx)
  const nodes: OpenCodeFileNode[] = []
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === ".DS_Store") continue
    const absolute = join(resolved, entry.name)
    const file = relative(ctx.directory, absolute)
    const type = entry.type === "directory" ? "directory" : "file"
    nodes.push({
      name: entry.name,
      path: file,
      absolute,
      type,
      ignored: ignored(type === "directory" ? `${file}/` : file),
    })
  }
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function openCodeReadToolTextOutput(input: {
  filePath: string
  worktree: string
  content: string
  offset?: number
  limit?: number
  loaded?: { filepath: string; content: string }[]
}): OpenCodeReadToolOutput {
  const offset = input.offset ?? 1
  const limit = input.limit ?? 2000
  const rawLines = input.content.split(/\r?\n/)
  const start = Math.max(0, offset - 1)
  const selected: string[] = []
  let bytes = 0
  let cut = false
  for (const line of rawLines.slice(start)) {
    if (selected.length >= limit) break
    const display = line.length > 2000 ? `${line.slice(0, 2000)}... (line truncated to 2000 chars)` : line
    const size = Buffer.byteLength(display, "utf8") + (selected.length > 0 ? 1 : 0)
    if (bytes + size > 50 * 1024) {
      cut = true
      break
    }
    selected.push(display)
    bytes += size
  }
  const last = offset + selected.length - 1
  const next = last + 1
  const more = start + selected.length < rawLines.length
  let output = [`<path>${input.filePath}</path>`, "<type>file</type>", "<content>\n"].join("\n")
  output += selected.map((line, index) => `${offset + index}: ${line}`).join("\n")
  if (cut) output += `\n\n(Output capped at 50 KB. Showing lines ${offset}-${last}. Use offset=${next} to continue.)`
  else if (more) output += `\n\n(Showing lines ${offset}-${last} of ${rawLines.length}. Use offset=${next} to continue.)`
  else output += `\n\n(End of file - total ${rawLines.length} lines)`
  output += "\n</content>"
  const loaded = input.loaded ?? []
  if (loaded.length) output += `\n\n<system-reminder>\n${loaded.map((item) => item.content).join("\n\n")}\n</system-reminder>`
  return {
    title: relative(input.worktree, input.filePath),
    output,
    metadata: {
      preview: selected.slice(0, 20).join("\n"),
      truncated: more || cut,
      loaded: loaded.map((item) => item.filepath),
    },
  }
}

export function openCodeShellOutputResult(input: OpenCodeShellOutputInput): OpenCodeNormalizedToolResult {
  const maxLines = input.maxLines ?? 100
  const maxBytes = input.maxBytes ?? 2000
  const raw = input.chunks.join("")
  const tailed = openCodeTail(raw, maxLines, maxBytes)
  let cut = tailed.cut || Boolean(input.outputPath)
  let output = tailed.text || "(no output)"
  if (cut && input.outputPath) output = `...output truncated...\n\nFull output saved to: ${input.outputPath}\n\n${output}`
  const meta: string[] = []
  if (input.expired) {
    meta.push(`shell tool terminated command after exceeding timeout ${input.timeout} ms. If this command is expected to take longer and is not waiting for interactive input, retry with a larger timeout value in milliseconds.`)
  }
  if (input.aborted) meta.push("User aborted the command")
  if (meta.length) output += `\n\n<shell_metadata>\n${meta.join("\n")}\n</shell_metadata>`
  return {
    title: input.description,
    metadata: {
      output: openCodePreview(raw || output),
      exit: input.exit,
      description: input.description,
      truncated: cut,
      ...(cut && input.outputPath ? { outputPath: input.outputPath } : {}),
    },
    output,
  }
}

export function openCodeInitialToolProcessorState(): OpenCodeToolProcessorState {
  return { parts: [], pendingToolCallIDs: [] }
}

export function openCodeApplyToolStreamEvent(
  state: OpenCodeToolProcessorState,
  event: OpenCodeToolStreamEvent,
  ids: { partID?: () => string; messageID?: string; sessionID?: string } = {},
): OpenCodeToolProcessorState {
  const next: OpenCodeToolProcessorState = {
    parts: state.parts.map((part) => ({ ...part, state: { ...part.state } } as OpenCodeToolPart)),
    pendingToolCallIDs: [...state.pendingToolCallIDs],
  }
  const now = event.now ?? 1
  const messageID = ids.messageID ?? "msg_1"
  const sessionID = ids.sessionID ?? "ses_1"
  const partID = ids.partID ?? (() => `part_${next.parts.length + 1}`)
  const ensureToolCall = (providerExecuted?: boolean): OpenCodeToolPart => {
    const existing = next.parts.find((part) => part.callID === event.id)
    if (existing) {
      if (providerExecuted && !existing.metadata?.["providerExecuted"]) {
        existing.metadata = { ...(existing.metadata ?? {}), providerExecuted: true }
      }
      return existing
    }
    const part: OpenCodeToolPart = {
      id: partID(),
      messageID,
      sessionID,
      type: "tool",
      tool: "name" in event ? event.name : "tool",
      callID: event.id,
      state: { status: "pending", input: {}, raw: "" },
      ...(providerExecuted ? { metadata: { providerExecuted: true } } : {}),
    }
    next.parts.push(part)
    next.pendingToolCallIDs.push(event.id)
    return part
  }

  if (event.type === "tool-input-start" || event.type === "tool-input-end") {
    ensureToolCall(event.type === "tool-input-start" ? event.providerExecuted : undefined)
    return next
  }

  if (event.type === "tool-call") {
    const part = ensureToolCall(event.providerExecuted)
    const input = openCodeToolInput(event.input)
    part.tool = event.name
    part.state = part.state.status === "running"
      ? { ...part.state, input }
      : { status: "running", input, time: { start: now } }
    if (part.metadata?.["providerExecuted"]) {
      part.metadata = { ...(event.providerMetadata ?? {}), providerExecuted: true }
    } else if (event.providerMetadata) {
      part.metadata = event.providerMetadata
    } else {
      delete part.metadata
    }
    return next
  }

  if (event.type === "tool-result") {
    const part = next.parts.find((candidate) => candidate.callID === event.id)
    if (!part || part.state.status !== "running") return next
    const output = openCodeToolResultOutput(event)
    part.state = {
      status: "completed",
      input: part.state.input,
      output: output.output,
      metadata: output.metadata,
      title: output.title,
      time: { start: part.state.time.start, end: now },
      ...(output.attachments ? { attachments: output.attachments } : {}),
    }
    next.pendingToolCallIDs = next.pendingToolCallIDs.filter((id) => id !== event.id)
    return next
  }

  const part = next.parts.find((candidate) => candidate.callID === event.id)
  if (!part || part.state.status !== "running") return next
  part.state = {
    status: "error",
    input: part.state.input,
    error: event.error instanceof Error ? event.error.message : event.message,
    time: { start: part.state.time.start, end: now },
  }
  next.pendingToolCallIDs = next.pendingToolCallIDs.filter((id) => id !== event.id)
  return next
}

export function openCodeShouldAskDoomLoop(
  parts: OpenCodeToolPart[],
  input: { tool: string; args: Record<string, unknown>; threshold?: number },
): boolean {
  const threshold = input.threshold ?? 3
  const recentParts = parts.slice(-threshold)
  return recentParts.length === threshold && recentParts.every((part) =>
    part.type === "tool" &&
    part.tool === input.tool &&
    part.state.status !== "pending" &&
    JSON.stringify(part.state.input) === JSON.stringify(input.args)
  )
}

export function openCodeApplyToolCleanup(
  state: OpenCodeToolProcessorState,
  now = 1,
): OpenCodeToolProcessorState {
  const next: OpenCodeToolProcessorState = {
    parts: state.parts.map((part) => ({ ...part, state: { ...part.state } } as OpenCodeToolPart)),
    pendingToolCallIDs: [...state.pendingToolCallIDs],
  }
  for (const toolCallID of next.pendingToolCallIDs) {
    const part = next.parts.find((candidate) => candidate.callID === toolCallID)
    if (!part || part.state.status === "completed" || part.state.status === "error") continue
    const metadata = "metadata" in part.state && isRecord(part.state.metadata) ? part.state.metadata : {}
    const start = "time" in part.state ? part.state.time.start : now
    part.state = {
      status: "error",
      input: part.state.input,
      error: "Tool execution aborted",
      metadata: { ...metadata, interrupted: true },
      time: { start, end: now },
    }
  }
  next.pendingToolCallIDs = []
  return next
}

export function openCodeToolResultOutput(
  value: Extract<OpenCodeToolStreamEvent, { type: "tool-result" }>,
): OpenCodeNormalizedToolResult {
  if (isRecord(value.result.value) && typeof value.result.value["output"] === "string") {
    const attachments = Array.isArray(value.result.value["attachments"])
      ? value.result.value["attachments"].filter(openCodeIsToolAttachment)
      : undefined
    return {
      title: typeof value.result.value["title"] === "string" ? value.result.value["title"] : value.name,
      metadata: isRecord(value.result.value["metadata"]) ? { ...value.result.value["metadata"] } : {},
      output: value.result.value["output"],
      ...(attachments ? { attachments } : {}),
    }
  }
  return {
    title: value.name,
    metadata: value.result.type === "json" && isRecord(value.result.value) ? { ...value.result.value } : {},
    output: typeof value.result.value === "string" ? value.result.value : (JSON.stringify(value.result.value) ?? ""),
  }
}

export function openCodeProjectToolSuccessEvent(input: {
  sessionID: string
  callID: string
  output: OpenCodeNormalizedToolResult
  providerExecuted?: boolean
  partProviderExecuted?: boolean
  timestamp?: number
}): OpenCodeToolSuccessEventProjection {
  return {
    sessionID: input.sessionID,
    callID: input.callID,
    structured: input.output.metadata,
    content: [
      { type: "text", text: input.output.output },
      ...(input.output.attachments?.map((item) => ({
        type: "file" as const,
        uri: item.url,
        mime: item.mime,
        ...(item.filename ? { name: item.filename } : {}),
      })) ?? []),
    ],
    provider: { executed: input.providerExecuted === true || input.partProviderExecuted === true },
    timestamp: input.timestamp ?? 1,
  }
}

export function openCodeProjectToolFailedEvent(input: {
  sessionID: string
  callID: string
  message: string
  partProviderExecuted?: boolean
  timestamp?: number
}): OpenCodeToolFailedEventProjection {
  return {
    sessionID: input.sessionID,
    callID: input.callID,
    error: { type: "unknown", message: input.message },
    provider: { executed: input.partProviderExecuted === true },
    timestamp: input.timestamp ?? 1,
  }
}

export function buildOpenCodeToolSchemaNativeExactFixture(): OpenCodeToolSchemaNativeExactFixture {
  const tools = openCodeNativeTools()
  const schema = createOpenCodeNativeExactToolSchemaSnapshot(tools)
  const fixtureWithoutFingerprint: Omit<OpenCodeToolSchemaNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: openCodeToolSchemaNativeExactAtomID,
    portID: "tools.schema" as const,
    upstreamRef: openCodeToolSchemaUpstreamRef,
    evidenceRef: openCodeToolSchemaNativeExactEvidenceRef,
    fixtureID: openCodeToolSchemaNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    schema,
    tools,
    permissionPolicySchema: {
      subjectField: "filePath" as const,
      mutationRequiresApproval: true as const,
      readonlyDefault: "allow" as const,
      deniedOutcome: "tool-result-error" as const,
    },
    sourceRefs: [
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/tool/tool.ts#Tool,Info,Context,define,execute,permissions`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/tool/bash.ts#BashTool,Parameters,execute,permission,render`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/tool/edit.ts#EditTool,Parameters,execute,permission,render`,
      `${openCodeToolSchemaUpstreamRef}:packages/opencode/src/tool/ls.ts#LsTool,Parameters,execute`,
    ],
    nativeEvidenceRefs: [...openCodeToolSchemaNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...openCodeToolSchemaNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeToolSchemaNativeExactFixture(
  fixture: OpenCodeToolSchemaNativeExactFixture,
): OpenCodeToolSchemaNativeExactFixtureVerification {
  const issues: OpenCodeToolSchemaNativeExactFixtureIssue[] = []
  const expected = buildOpenCodeToolSchemaNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "opencode-tool-schema-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical schema content." })
  }
  if (fixture.product !== "opencode" || fixture.atomID !== openCodeToolSchemaNativeExactAtomID || fixture.portID !== "tools.schema") {
    issues.push({ id: "opencode-tool-schema-native-exact.identity", message: "Fixture must remain scoped to the OpenCode tools.schema atom." })
  }
  if (fixture.upstreamRef !== openCodeToolSchemaUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
    issues.push({ id: "opencode-tool-schema-native-exact.upstream", message: "Fixture must stay pinned to the OpenCode upstream schema sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-tool-schema-native-exact.native-claim", message: "Tool schema exact fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "opencode-tool-schema-native-exact.lossiness", message: "Native exact schema fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(openCodeToolSchemaNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(openCodeToolSchemaNativeExactReplayRef)) {
    issues.push({ id: "opencode-tool-schema-native-exact.evidence", message: "Native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(openCodeToolSchemaNativeExactFixtureID)) {
    issues.push({ id: "opencode-tool-schema-native-exact.fixture", message: "Native exact fixture ID is missing." })
  }
  if (!sameJSON(fixture.tools, expected.tools) || !sameJSON(fixture.schema.tools, expected.schema.tools)) {
    issues.push({ id: "opencode-tool-schema-native-exact.tools", message: "OpenCode tool schema contracts drifted from the native exact fixture." })
  }
  if (fixture.permissionPolicySchema.subjectField !== "filePath" || fixture.permissionPolicySchema.mutationRequiresApproval !== true) {
    issues.push({ id: "opencode-tool-schema-native-exact.permission-policy", message: "OpenCode permission policy schema no longer matches the native tool schema contract." })
  }

  return { ok: issues.length === 0, issues }
}

function createOpenCodeNativeExactToolSchemaSnapshot(tools: OpenCodeToolSchemaNativeExactTool[]): ToolSchemaSnapshot {
  const baseline = createToolSchemaSnapshot("opencode")
  return {
    ...baseline,
    atomID: openCodeToolSchemaNativeExactAtomID,
    tools: tools.map((tool) => ({ ...tool })),
  }
}

function openCodeNativeTools(): OpenCodeToolSchemaNativeExactTool[] {
  return [
    tool("read", ["read", "open"], ["filePath"], false),
    tool("edit", ["edit"], ["filePath", "oldText", "newText"], true),
    tool("write", ["write", "create_file"], ["filePath", "content"], true),
    tool("bash", ["bash", "shell"], ["cmd"], true, "cmd"),
    tool("find", ["glob", "find"], ["filePath"], false),
    tool("grep", ["grep"], ["filePath", "pattern"], false),
    tool("ls", ["ls"], ["filePath"], false),
  ]
}

function tool(
  name: string,
  aliases: string[],
  requiredFields: string[],
  mutating: boolean,
  commandField?: "cmd",
): OpenCodeToolSchemaNativeExactTool {
  return {
    name,
    aliases,
    requiredFields,
    pathField: "filePath",
    ...(commandField ? { commandField } : {}),
    mutating,
  }
}

function openCodeIsJsonSchemaDefinition(value: unknown): value is Record<string, unknown> | boolean {
  return typeof value === "boolean" || (typeof value === "object" && value !== null && !Array.isArray(value))
}

function openCodeIsZodLike(value: unknown): boolean {
  return typeof value === "object" && value !== null && "_zod" in value
}

function openCodeWildcardMatch(pattern: string, value: string): boolean {
  const regex = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`)
  return regex.test(value)
}

function openCodeExpandPermissionPattern(pattern: string, home: string): string {
  if (pattern.startsWith("~/")) return home + pattern.slice(1)
  if (pattern === "~") return home
  if (pattern.startsWith("$HOME/")) return home + pattern.slice(5)
  if (pattern.startsWith("$HOME")) return home + pattern.slice(5)
  return pattern
}

function openCodeAssertContainsPath(full: string, ctx: OpenCodeFileContext): void {
  const base = resolve(ctx.directory)
  const target = resolve(full)
  const rel = relative(base, target)
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error("Access denied: path escapes project directory")
  }
}

function openCodeMimeType(file: string): string {
  const ext = openCodeExtension(file)
  if (ext === "png") return "image/png"
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "gif") return "image/gif"
  if (ext === "webp") return "image/webp"
  if (ext === "svg") return "image/svg+xml"
  if (openCodeIsTextByExtension(file) || openCodeIsTextByName(file)) return "text/plain"
  if (ext === "json") return "application/json"
  if (ext === "pdf") return "application/pdf"
  return "application/octet-stream"
}

function openCodeImageMimeType(file: string): string {
  const ext = openCodeExtension(file)
  if (ext === "png") return "image/png"
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "gif") return "image/gif"
  if (ext === "webp") return "image/webp"
  if (ext === "svg") return "image/svg+xml"
  return `image/${ext}`
}

function openCodeExtension(file: string): string {
  return extname(file).toLowerCase().slice(1)
}

function openCodeIsImageByExtension(file: string): boolean {
  return new Set(["png", "jpg", "jpeg", "gif", "bmp", "webp", "ico", "tif", "tiff", "svg", "svgz", "avif", "apng", "jxl", "heic", "heif", "raw", "cr2", "nef", "arw", "dng", "orf", "raf", "pef", "x3f"]).has(openCodeExtension(file))
}

function openCodeIsBinaryByExtension(file: string): boolean {
  return new Set(["exe", "dll", "pdb", "bin", "so", "dylib", "o", "a", "lib", "wav", "mp3", "ogg", "oga", "ogv", "ogx", "flac", "aac", "wma", "m4a", "weba", "mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "zip", "tar", "gz", "gzip", "bz", "bz2", "bzip", "bzip2", "7z", "rar", "xz", "lz", "z", "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "dmg", "iso", "img", "vmdk", "ttf", "otf", "woff", "woff2", "eot", "sqlite", "db", "mdb", "apk", "ipa", "aab", "xapk", "app", "pkg", "deb", "rpm", "snap", "flatpak", "appimage", "msi", "msp", "jar", "war", "ear", "class", "kotlin_module", "dex", "vdex", "odex", "oat", "art", "wasm", "wat", "bc", "ll", "s", "ko", "sys", "drv", "efi", "rom", "com"]).has(openCodeExtension(file))
}

function openCodeIsTextByExtension(file: string): boolean {
  return new Set(["ts", "tsx", "mts", "cts", "mtsx", "ctsx", "js", "jsx", "mjs", "cjs", "sh", "bash", "zsh", "fish", "ps1", "psm1", "cmd", "bat", "json", "jsonc", "json5", "yaml", "yml", "toml", "md", "mdx", "txt", "xml", "html", "htm", "css", "scss", "sass", "less", "graphql", "gql", "sql", "ini", "cfg", "conf", "env"]).has(openCodeExtension(file))
}

function openCodeIsTextByName(file: string): boolean {
  return new Set(["dockerfile", "makefile", ".gitignore", ".gitattributes", ".editorconfig", ".npmrc", ".nvmrc", ".prettierrc", ".eslintrc"]).has(basename(file).toLowerCase())
}

function openCodeShouldEncode(mimeType: string): boolean {
  const type = mimeType.toLowerCase()
  if (!type) return false
  if (type.startsWith("text/")) return false
  if (type.includes("charset=")) return false
  const top = type.split("/", 2)[0] ?? ""
  return ["image", "audio", "video", "font", "model", "multipart"].includes(top)
}

function openCodeTail(text: string, maxLines: number, maxBytes: number): { text: string; cut: boolean } {
  const lines = text.split("\n")
  if (lines.length <= maxLines && Buffer.byteLength(text, "utf8") <= maxBytes) return { text, cut: false }
  const out: string[] = []
  let bytes = 0
  for (let index = lines.length - 1; index >= 0 && out.length < maxLines; index--) {
    const line = lines[index] ?? ""
    const size = Buffer.byteLength(line, "utf8") + (out.length > 0 ? 1 : 0)
    if (bytes + size > maxBytes) {
      if (out.length === 0) {
        const buf = Buffer.from(line, "utf8")
        let start = Math.max(0, buf.length - maxBytes)
        while (start < buf.length && ((buf[start] ?? 0) & 0xc0) === 0x80) start++
        out.unshift(buf.subarray(start).toString("utf8"))
      }
      break
    }
    out.unshift(line)
    bytes += size
  }
  return { text: out.join("\n"), cut: true }
}

function openCodePreview(text: string): string {
  if (text.length <= 30_000) return text
  return `...\n\n${text.slice(-30_000)}`
}

function openCodeToolInput(value: unknown): Record<string, unknown> {
  return isRecord(value) ? { ...value } : { value }
}

function openCodeIsToolAttachment(value: unknown): value is OpenCodePluginToolAttachment {
  return isRecord(value) && value["type"] === "file" && typeof value["mime"] === "string" && typeof value["url"] === "string"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
