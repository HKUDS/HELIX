import { createHash } from "node:crypto"
import { isAbsolute, relative, resolve } from "node:path"

export const nanobotToolUpstreamRef = "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
export const nanobotToolNativeExactFixtureID = "nanobot-tool:native-exact-fixture"
export const nanobotToolNativeExactEvidenceRef = "conformance:nanobot-tool-native-exact-fixture"
export const nanobotToolNativeExactReplayRef = "tool-native-exact:nanobot"
export const nanobotToolPackCompatibilityNativeExactAtomID = "nanobot.tool-pack.compatibility"
export const nanobotToolBatchSchedulerNativeExactAtomID = "nanobot.tools.batch-scheduler.native-like"
export const nanobotToolBatchSchedulerNativeExactFixtureID = "nanobot-tool-batch-scheduler:native-exact-fixture"
export const nanobotToolBatchSchedulerNativeExactEvidenceRef = "conformance:nanobot-tool-batch-scheduler-native-exact-fixture"
export const nanobotToolBatchSchedulerNativeExactReplayRef = "tool-batch-scheduler-native-exact:nanobot"

export const nanobotToolNativeExactAtomIDs = [
  nanobotToolPackCompatibilityNativeExactAtomID,
  "nanobot.permission.policy-bridge",
  "nanobot.process-runner-bridge",
  "nanobot.tool.definition-plugin-bridge",
  "nanobot.tool.event-render-bridge",
  "nanobot.tool.progress-event-bridge",
  "nanobot.tool.registry-bridge",
  "nanobot.tool.result-event-bridge",
  "nanobot.tool.schema-bridge",
  "nanobot.tools.result-projector.native-like",
  "nanobot.tools.schema.native-like",
  "nanobot.workspace-filesystem-bridge",
] as const

export type NanobotToolNativeExactAtomID = (typeof nanobotToolNativeExactAtomIDs)[number]

export type NanobotToolNativePortID =
  | "filesystem.port"
  | "process-runner.port"
  | "tool.definition"
  | "tool.executor"
  | "tool.audit-log"
  | "tool.permission-policy"
  | "tool.registry"
  | "tool.result-normalizer"
  | "tool.schema-adapter"
  | "tools"
  | "tools.result-projector"
  | "tools.schema"

export interface NanobotToolNativeDescriptor {
  id: NanobotToolNativeExactAtomID
  port: NanobotToolNativePortID
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof nanobotToolNativeExactEvidenceRef, typeof nanobotToolNativeExactReplayRef]
  fixtureIDs: [typeof nanobotToolNativeExactFixtureID]
  knownLossiness: []
}

export interface NanobotToolBatchSchedulerNativeDescriptor {
  id: typeof nanobotToolBatchSchedulerNativeExactAtomID
  port: "tools.batch-scheduler"
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof nanobotToolBatchSchedulerNativeExactEvidenceRef, typeof nanobotToolBatchSchedulerNativeExactReplayRef]
  fixtureIDs: [typeof nanobotToolBatchSchedulerNativeExactFixtureID]
  knownLossiness: []
}

export interface NanobotToolBatchSchedulerNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomID: typeof nanobotToolBatchSchedulerNativeExactAtomID
  portID: "tools.batch-scheduler"
  upstreamRef: typeof nanobotToolUpstreamRef
  evidenceRef: typeof nanobotToolBatchSchedulerNativeExactEvidenceRef
  fixtureID: typeof nanobotToolBatchSchedulerNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  schedulingDecision: {
    disabledConcurrency: "one-tool-call-per-batch"
    enabledConcurrency: "adjacent-concurrency-safe-tools-share-a-batch"
    unsafeToolBoundary: "flush-current-safe-batch-then-run-unsafe-tool-alone"
    batchTraversalOrder: "source-tool-call-order"
  }
  executionSemantics: {
    safeBatchExecution: "asyncio.gather"
    unsafeBatchExecution: "sequential-await"
    resultCollectionOrder: "source-tool-call-order-within-each-batch"
    fatalErrorSelection: "first-error-in-collected-result-order"
    toolResultAppendOrder: "source-tool-call-order"
  }
  toolPreparationPipeline: {
    repeatedExternalLookupBlockedBeforePrepareCall: true
    prepareCallMayCastAndValidateArguments: true
    workspaceViolationCanReturnSoftPayload: true
    failOnToolErrorControlsFatalError: true
  }
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface NanobotToolBatchSchedulerNativeExactFixtureIssue {
  id: string
  message: string
}

export interface NanobotToolBatchSchedulerNativeExactFixtureVerification {
  ok: boolean
  issues: NanobotToolBatchSchedulerNativeExactFixtureIssue[]
}

export const nanobotToolBatchSchedulerNativeDescriptor: NanobotToolBatchSchedulerNativeDescriptor = {
  id: nanobotToolBatchSchedulerNativeExactAtomID,
  port: "tools.batch-scheduler",
  product: "nanobot",
  implementationKind: "factory",
  selectionReason:
    "Nanobot upstream native implementation for AgentRunner._partition_tool_batches/_execute_tools tool batch scheduler: concurrency-safe adjacent tools batch under asyncio.gather, unsafe tools form source-order singleton boundaries, and result messages remain in source order.",
  parityCoverage: "native",
  nativeEvidenceRefs: [nanobotToolBatchSchedulerNativeExactEvidenceRef, nanobotToolBatchSchedulerNativeExactReplayRef],
  fixtureIDs: [nanobotToolBatchSchedulerNativeExactFixtureID],
  knownLossiness: [],
}

export type NanobotJSONSchemaType = "string" | "integer" | "number" | "boolean" | "array" | "object" | "null"

export interface NanobotJSONSchema {
  type?: NanobotJSONSchemaType | NanobotJSONSchemaType[]
  description?: string
  properties?: Record<string, NanobotJSONSchema>
  required?: string[]
  items?: NanobotJSONSchema
  enum?: unknown[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  default?: unknown
  additionalProperties?: boolean | NanobotJSONSchema
  nullable?: boolean
}

export interface NanobotNativeTool {
  name: string
  description: string
  parameters: NanobotJSONSchema
  readOnly?: boolean
  exclusive?: boolean
  execute?: (params: Record<string, unknown>) => unknown | Promise<unknown>
  castParams?: (params: Record<string, unknown>) => Record<string, unknown>
  validateParams?: (params: Record<string, unknown>) => string[]
  toSchema?: () => NanobotOpenAIToolSchema
}

export interface NanobotOpenAIToolSchema {
  type: "function"
  function: {
    name: string
    description: string
    parameters: NanobotJSONSchema
  }
}

export interface NanobotPreparedToolCall {
  tool: NanobotNativeTool | null
  params: unknown
  error: string | null
}

export interface NanobotNativeToolRegistry {
  register(tool: NanobotNativeTool): void
  unregister(name: string): void
  get(name: string): NanobotNativeTool | undefined
  has(name: string): boolean
  getDefinitions(): NanobotOpenAIToolSchema[]
  prepareCall(name: string, params: unknown): NanobotPreparedToolCall
  execute(name: string, params: Record<string, unknown>): Promise<unknown>
  readonly toolNames: string[]
  readonly size: number
}

export interface NanobotToolEventPayload {
  version: 1
  phase: "start" | "end" | "error"
  call_id: string
  name: string
  arguments: Record<string, unknown>
  result: unknown
  error: string | null
  files: unknown[]
  embeds: unknown[]
}

export interface NanobotToolRunEvent {
  name: string
  status: "ok" | "error"
  detail: string
}

export interface NanobotToolNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomIDs: NanobotToolNativeExactAtomID[]
  portIDs: Record<NanobotToolNativeExactAtomID, NanobotToolNativePortID>
  upstreamRef: typeof nanobotToolUpstreamRef
  evidenceRef: typeof nanobotToolNativeExactEvidenceRef
  fixtureID: typeof nanobotToolNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  registryBehavior: {
    definitionOrder: ["edit_file", "exec", "list_dir", "read_file", "write_file", "mcp_memory__search"]
    mcpToolsSortAfterBuiltins: true
    cachedDefinitionsReuseArrayUntilMutation: true
    prepareCallCastsStringScalarsBeforeValidation: true
    missingToolErrorIncludesAvailableNames: true
    listParamsAreRejectedForReadWriteTools: true
    executeAppendsRetryHintToPrepareErrorsAndErrorStringResults: true
  }
  schemaBehavior: {
    schemaFragmentTypes: ["StringSchema", "IntegerSchema", "NumberSchema", "BooleanSchema", "ArraySchema", "ObjectSchema"]
    rootBuilder: "tool_parameters_schema"
    nullabilityUsesTypeUnion: true
    objectRequiredErrorsUseSubpaths: true
    arraysValidateItemsWithIndexedPaths: true
    toolSchemas: NanobotToolSchemaSummary[]
  }
  permissionProcessBehavior: {
    defaultExecTimeoutSeconds: 60
    maxExecTimeoutSeconds: 600
    maxOutputChars: 10000
    denyPatternCount: number
    allowPatternsOverrideDenyPatterns: true
    restrictToWorkspaceChecksWorkingDirAndAbsolutePaths: true
    workspaceBoundaryNote: typeof nanobotWorkspaceBoundaryNote
    benignDevicePaths: string[]
    minimalPosixEnvKeys: ["HOME", "LANG", "TERM", "PYTHONUNBUFFERED"]
  }
  workspaceFilesystemBehavior: {
    blockedDevicePaths: string[]
    readTextLineNumberFormat: "LINE_NUM| CONTENT"
    readDefaultLimit: 2000
    readMaxChars: 128000
    writeCreatesParentDirectories: true
    editMatchFallbacks: ["exact", "line-trimmed", "quote-normalized-trimmed", "quote-normalized-substring"]
    listDirIgnores: string[]
    listDirDefaultMaxEntries: 200
  }
  resultProjection: {
    okEventDetail: "first-120-chars-or-empty-marker"
    errorStringGetsRetryHint: true
    exceptionPayloadPrefix: "Error: TypeError: message"
    emptyToolResultMarker: "(tool_name completed with no output)"
    longStringTruncationSuffix: "\n... (truncated)"
  }
  progressProjection: {
    startPayloadPhase: "start"
    finishOkPhase: "end"
    finishErrorPhase: "error"
    finishPayloadCount: "min(tool_calls, tool_results, tool_events)"
    progressCallbackUsesToolEventsWhenSignatureAcceptsThem: true
    toolHintFormats: Record<string, string>
  }
  toolPackBehavior: {
    portID: "tools"
    aggregateAtomID: typeof nanobotToolPackCompatibilityNativeExactAtomID
    upstreamRegistry: "ToolRegistry.get_definitions/prepare_call/execute"
    upstreamExecution: "AgentRunner._execute_tools/_run_tool/_normalize_tool_result"
    builtinToolsSortBeforeMcpTools: true
    cachedDefinitionsInvalidatedByRegisterUnregister: true
    preservesPrepareValidateExecutePipeline: true
    preservesWorkspacePermissionProcessAndResultProjection: true
    noCompatibilityBridgeLossiness: true
    aggregateIncludes: [
      "tool.registry",
      "tools.schema",
      "tools.batch-scheduler",
      "tools.result-projector",
      "filesystem.port",
      "process-runner.port",
      "tool.permission-policy",
    ]
  }
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: NanobotToolNativeDescriptor[]
  fingerprint: string
}

export interface NanobotToolNativeExactIssue {
  id: string
  message: string
}

export interface NanobotToolNativeExactVerification {
  ok: boolean
  issues: NanobotToolNativeExactIssue[]
}

export interface NanobotToolSchemaSummary {
  name: "read_file" | "write_file" | "edit_file" | "list_dir" | "exec"
  requiredFields: string[]
  optionalFields: string[]
  readOnly: boolean
  exclusive: boolean
}

export const nanobotToolNativeDescriptors = [
  nanobotToolNativeDescriptor(
    nanobotToolPackCompatibilityNativeExactAtomID,
    "tools",
    "Nanobot upstream native implementation aggregate for the tool-pack compatibility surface: ToolRegistry definition/prepare/execute behavior plus AgentRunner tool scheduling, result projection, workspace filesystem, process runner, and permission policy semantics without bridge lossiness.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.permission.policy-bridge",
    "tool.permission-policy",
    "Nanobot upstream native implementation of ExecTool deny/allow filters, workspace restriction checks, and runner safety-boundary classification.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.process-runner-bridge",
    "process-runner.port",
    "Nanobot upstream native implementation of ExecTool subprocess launch contract, timeout/output caps, environment construction, sandbox wrapping surface, and command guard.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.tool.definition-plugin-bridge",
    "tool.definition",
    "Nanobot upstream native implementation of Tool.to_schema, tool_parameters decorator schema attachment, and ToolRegistry definition ordering.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.tool.event-render-bridge",
    "tool.executor",
    "Nanobot upstream native implementation of ToolRegistry.prepare_call/execute and AgentRunner._run_tool result event classification.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.tool.progress-event-bridge",
    "tool.audit-log",
    "Nanobot upstream native implementation of AgentProgressHook tool start/finish payloads and tool hint projection.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.tool.registry-bridge",
    "tool.registry",
    "Nanobot upstream native implementation of ToolRegistry register, unregister, lookup, cached definition ordering, prepare_call, and execute semantics.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.tool.result-event-bridge",
    "tool.result-normalizer",
    "Nanobot upstream native implementation of AgentRunner tool result normalization, empty-result marker, retry hints, and event detail projection.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.tool.schema-bridge",
    "tool.schema-adapter",
    "Nanobot upstream native implementation of JSON Schema fragments, tool_parameters_schema, schema-driven casting, and validation errors.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.tools.result-projector.native-like",
    "tools.result-projector",
    "Nanobot upstream native implementation of tool result projector: ToolRegistry.execute retry hints, AgentRunner._run_tool result normalization, empty-result marker, progress event payloads, and tool run event classification.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.tools.schema.native-like",
    "tools.schema",
    "Nanobot upstream native implementation of tool schema projector: Schema fragments, tool_parameters decorator, Tool.to_schema, ToolRegistry.get_definitions stable ordering/cache, schema-driven casting, and validation errors.",
  ),
  nanobotToolNativeDescriptor(
    "nanobot.workspace-filesystem-bridge",
    "filesystem.port",
    "Nanobot upstream native implementation of filesystem tool path resolution, device blocking, text read pagination, write/edit/list core behavior, and workspace boundary errors.",
  ),
] as const

export const nanobotWorkspaceBoundaryNote = "\n\nNote: this is a hard policy boundary, not a transient failure. Do NOT retry with shell tricks (symlinks, base64 piping, alternative tools, working_dir overrides). If the user genuinely needs this resource, tell them you cannot reach it under the current restrict_to_workspace policy and ask how to proceed."

export const nanobotExecDefaultDenyPatterns = [
  "\\brm\\s+-[rf]{1,2}\\b",
  "\\bdel\\s+/[fq]\\b",
  "\\brmdir\\s+/s\\b",
  "(?:^|[;&|]\\s*)format(?!=)\\b",
  "\\b(mkfs|diskpart)\\b",
  "\\bdd\\s+if=",
  ">\\s*/dev/sd",
  "\\b(shutdown|reboot|poweroff)\\b",
  ":\\(\\)\\s*\\{.*\\};\\s*:",
  ">>?\\s*\\S*(?:history\\.jsonl|\\.dream_cursor)",
  "\\btee\\b[^|;&<>]*(?:history\\.jsonl|\\.dream_cursor)",
  "\\b(?:cp|mv)\\b(?:\\s+[^\\s|;&<>]+)+\\s+\\S*(?:history\\.jsonl|\\.dream_cursor)",
  "\\bdd\\b[^|;&<>]*\\bof=\\S*(?:history\\.jsonl|\\.dream_cursor)",
  "\\bsed\\s+-i[^|;&<>]*(?:history\\.jsonl|\\.dream_cursor)",
] as const

export const nanobotExecBenignDevicePaths = [
  "/dev/null",
  "/dev/zero",
  "/dev/full",
  "/dev/random",
  "/dev/urandom",
  "/dev/stdin",
  "/dev/stdout",
  "/dev/stderr",
  "/dev/tty",
] as const

export const nanobotBlockedDevicePaths = [
  "/dev/zero",
  "/dev/random",
  "/dev/urandom",
  "/dev/full",
  "/dev/stdin",
  "/dev/stdout",
  "/dev/stderr",
  "/dev/tty",
  "/dev/console",
  "/dev/fd/0",
  "/dev/fd/1",
  "/dev/fd/2",
] as const

export const nanobotListDirIgnoredDirs = [
  ".git",
  "node_modules",
  "__pycache__",
  ".venv",
  "venv",
  "dist",
  "build",
  ".tox",
  ".mypy_cache",
  ".pytest_cache",
  ".ruff_cache",
  ".coverage",
  "htmlcov",
] as const

export function stringSchema(description = "", options: { minLength?: number; maxLength?: number; enum?: unknown[]; nullable?: boolean } = {}): NanobotJSONSchema {
  return stripUndefined({
    type: options.nullable ? (["string", "null"] as NanobotJSONSchemaType[]) : ("string" as const),
    description: description || undefined,
    minLength: options.minLength,
    maxLength: options.maxLength,
    enum: options.enum,
  }) as NanobotJSONSchema
}

export function integerSchema(
  _value = 0,
  options: { description?: string; minimum?: number; maximum?: number; enum?: number[]; nullable?: boolean } = {},
): NanobotJSONSchema {
  return stripUndefined({
    type: options.nullable ? (["integer", "null"] as NanobotJSONSchemaType[]) : ("integer" as const),
    description: options.description || undefined,
    minimum: options.minimum,
    maximum: options.maximum,
    enum: options.enum,
  }) as NanobotJSONSchema
}

export function numberSchema(
  _value = 0,
  options: { description?: string; minimum?: number; maximum?: number; enum?: number[]; nullable?: boolean } = {},
): NanobotJSONSchema {
  return stripUndefined({
    type: options.nullable ? (["number", "null"] as NanobotJSONSchemaType[]) : ("number" as const),
    description: options.description || undefined,
    minimum: options.minimum,
    maximum: options.maximum,
    enum: options.enum,
  }) as NanobotJSONSchema
}

export function booleanSchema(options: { description?: string; default?: boolean; nullable?: boolean } = {}): NanobotJSONSchema {
  return stripUndefined({
    type: options.nullable ? (["boolean", "null"] as NanobotJSONSchemaType[]) : ("boolean" as const),
    description: options.description || undefined,
    default: options.default,
  }) as NanobotJSONSchema
}

export function arraySchema(
  items: NanobotJSONSchema = stringSchema(""),
  options: { description?: string; minItems?: number; maxItems?: number; nullable?: boolean } = {},
): NanobotJSONSchema {
  return stripUndefined({
    type: options.nullable ? (["array", "null"] as NanobotJSONSchemaType[]) : ("array" as const),
    items,
    description: options.description || undefined,
    minItems: options.minItems,
    maxItems: options.maxItems,
  }) as NanobotJSONSchema
}

export function objectSchema(
  properties: Record<string, NanobotJSONSchema> = {},
  options: {
    required?: string[]
    description?: string
    additionalProperties?: boolean | NanobotJSONSchema
    nullable?: boolean
  } = {},
): NanobotJSONSchema {
  return stripUndefined({
    type: options.nullable ? (["object", "null"] as NanobotJSONSchemaType[]) : ("object" as const),
    properties,
    required: options.required?.length ? [...options.required] : undefined,
    description: options.description || undefined,
    additionalProperties: options.additionalProperties,
  }) as NanobotJSONSchema
}

export function toolParametersSchema(
  properties: Record<string, NanobotJSONSchema>,
  options: { required?: string[]; description?: string } = {},
): NanobotJSONSchema {
  const objectOptions: { required?: string[]; description?: string } = {}
  if (options.required) objectOptions.required = options.required
  if (options.description) objectOptions.description = options.description
  return objectSchema(properties, objectOptions)
}

export function resolveNanobotJSONSchemaType(type: unknown): NanobotJSONSchemaType | undefined {
  if (Array.isArray(type)) return type.find((item): item is NanobotJSONSchemaType => item !== "null")
  return typeof type === "string" ? type as NanobotJSONSchemaType : undefined
}

export function validateNanobotJSONSchemaValue(value: unknown, schema: NanobotJSONSchema, path = ""): string[] {
  const rawType = schema.type
  const nullable = (Array.isArray(rawType) && rawType.includes("null")) || schema.nullable === true
  const type = resolveNanobotJSONSchemaType(rawType)
  const label = path || "parameter"

  if (nullable && value === null) return []
  if (type === "integer" && (!isInteger(value) || typeof value === "boolean")) return [`${label} should be integer`]
  if (type === "number" && (!isNumber(value) || typeof value === "boolean")) return [`${label} should be number`]
  if (type && type !== "integer" && type !== "number" && type !== "null" && !matchesJSONType(value, type)) {
    return [`${label} should be ${type}`]
  }

  const errors: string[] = []
  if (schema.enum && !schema.enum.some((item) => Object.is(item, value))) {
    errors.push(`${label} must be one of ${JSON.stringify(schema.enum)}`)
  }
  if ((type === "integer" || type === "number") && typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${label} must be >= ${schema.minimum}`)
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${label} must be <= ${schema.maximum}`)
  }
  if (type === "string" && typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${label} must be at least ${schema.minLength} chars`)
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${label} must be at most ${schema.maxLength} chars`)
  }
  if (type === "object" && isRecord(value)) {
    const properties = schema.properties ?? {}
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`missing required ${subpath(path, key)}`)
    }
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) errors.push(...validateNanobotJSONSchemaValue(child, properties[key], subpath(path, key)))
    }
  }
  if (type === "array" && Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${label} must have at least ${schema.minItems} items`)
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${label} must be at most ${schema.maxItems} items`)
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateNanobotJSONSchemaValue(item, schema.items as NanobotJSONSchema, path ? `${path}[${index}]` : `[${index}]`))
      })
    }
  }
  return errors
}

export function castNanobotToolParams(params: Record<string, unknown>, schema: NanobotJSONSchema): Record<string, unknown> {
  if (schema.type && resolveNanobotJSONSchemaType(schema.type) !== "object") return params
  return castNanobotObject(params, schema)
}

export function nanobotToolToOpenAISchema(tool: NanobotNativeTool): NanobotOpenAIToolSchema {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: cloneJSON(tool.parameters),
    },
  }
}

export function createNanobotNativeToolRegistry(tools: NanobotNativeTool[] = []): NanobotNativeToolRegistry {
  const toolMap = new Map<string, NanobotNativeTool>()
  let cachedDefinitions: NanobotOpenAIToolSchema[] | undefined

  const registry: NanobotNativeToolRegistry = {
    register(tool) {
      toolMap.set(tool.name, tool)
      cachedDefinitions = undefined
    },
    unregister(name) {
      toolMap.delete(name)
      cachedDefinitions = undefined
    },
    get(name) {
      return toolMap.get(name)
    },
    has(name) {
      return toolMap.has(name)
    },
    getDefinitions() {
      if (cachedDefinitions) return cachedDefinitions
      const definitions = Array.from(toolMap.values()).map((tool) => tool.toSchema?.() ?? nanobotToolToOpenAISchema(tool))
      const builtins: NanobotOpenAIToolSchema[] = []
      const mcpTools: NanobotOpenAIToolSchema[] = []
      for (const schema of definitions) {
        const name = nanobotSchemaName(schema)
        if (name.startsWith("mcp_")) mcpTools.push(schema)
        else builtins.push(schema)
      }
      builtins.sort((left, right) => nanobotSchemaName(left).localeCompare(nanobotSchemaName(right)))
      mcpTools.sort((left, right) => nanobotSchemaName(left).localeCompare(nanobotSchemaName(right)))
      cachedDefinitions = [...builtins, ...mcpTools]
      return cachedDefinitions
    },
    prepareCall(name, params) {
      if (!isRecord(params) && (name === "write_file" || name === "read_file")) {
        return {
          tool: null,
          params,
          error: `Error: Tool '${name}' parameters must be a JSON object, got ${pythonTypeName(params)}. Use named parameters: tool_name(param1="value1", param2="value2")`,
        }
      }
      const tool = toolMap.get(name)
      if (!tool) {
        return {
          tool: null,
          params,
          error: `Error: Tool '${name}' not found. Available: ${registry.toolNames.join(", ")}`,
        }
      }
      const rawParams = isRecord(params) ? params : {}
      const castParams = tool.castParams?.(rawParams) ?? castNanobotToolParams(rawParams, tool.parameters)
      const errors = tool.validateParams?.(castParams) ?? validateNanobotToolParams(castParams, tool.parameters)
      if (errors.length) {
        return {
          tool,
          params: castParams,
          error: `Error: Invalid parameters for tool '${name}': ${errors.join("; ")}`,
        }
      }
      return { tool, params: castParams, error: null }
    },
    async execute(name, params) {
      const hint = "\n\n[Analyze the error above and try a different approach.]"
      const prepared = registry.prepareCall(name, params)
      if (prepared.error) return prepared.error + hint
      try {
        const result = prepared.tool?.execute ? await prepared.tool.execute(prepared.params as Record<string, unknown>) : undefined
        if (typeof result === "string" && result.startsWith("Error")) return result + hint
        return result
      } catch (error) {
        return `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}` + hint
      }
    },
    get toolNames() {
      return Array.from(toolMap.keys())
    },
    get size() {
      return toolMap.size
    },
  }

  tools.forEach((tool) => registry.register(tool))
  return registry
}

export function createNanobotNativeExactTools(): NanobotNativeTool[] {
  return [
    createNanobotNativeTool("read_file", readFileDescription, readFileParameters(), { readOnly: true }),
    createNanobotNativeTool("write_file", writeFileDescription, writeFileParameters()),
    createNanobotNativeTool("edit_file", editFileDescription, editFileParameters()),
    createNanobotNativeTool("list_dir", listDirDescription, listDirParameters(), { readOnly: true }),
    createNanobotNativeTool("exec", execDescription, execParameters(), { exclusive: true }),
  ]
}

export function isNanobotBlockedDevicePath(path: string, resolvedPath = path): boolean {
  if ((nanobotBlockedDevicePaths as readonly string[]).includes(path) || (nanobotBlockedDevicePaths as readonly string[]).includes(resolvedPath)) return true
  if (/\/proc\/\d+\/fd\/[012]$/.test(path) || /\/proc\/self\/fd\/[012]$/.test(path)) return true
  if (/\/proc\/\d+\/fd\/[012]$/.test(resolvedPath) || /\/proc\/self\/fd\/[012]$/.test(resolvedPath)) return true
  return resolvedPath.startsWith("/dev/")
}

export function resolveNanobotWorkspacePath(input: {
  path: string
  workspace?: string
  allowedDir?: string
  extraAllowedDirs?: string[]
  mediaDir?: string
}): string {
  const raw = expandHome(input.path)
  const resolvedPath = resolve(input.workspace && !isAbsolute(raw) ? resolve(input.workspace, raw) : raw)
  if (!input.allowedDir) return resolvedPath

  const allowedDirs = [
    input.allowedDir,
    input.mediaDir ?? resolve(expandHome("~/.nanobot/media")),
    ...(input.extraAllowedDirs ?? []),
  ].map((dir) => resolve(dir))
  if (!allowedDirs.some((dir) => isUnderPath(resolvedPath, dir))) {
    throw new PermissionError(`Path ${input.path} is outside allowed directory ${input.allowedDir} (this is a hard policy boundary, not a transient failure; do not retry with shell tricks or alternative tools, and ask the user how to proceed if the resource is genuinely required)`)
  }
  return resolvedPath
}

export function formatNanobotTextReadResult(input: {
  content: string
  path: string
  offset?: number
  limit?: number
  maxChars?: number
}): string {
  const offset = Math.max(1, input.offset ?? 1)
  const limit = input.limit ?? 2000
  const maxChars = input.maxChars ?? 128_000
  const lines = input.content.replace(/\r\n/g, "\n").split(/\n/)
  if (lines.length === 1 && lines[0] === "") return `(Empty file: ${input.path})`
  const total = lines.length
  if (offset > total) return `Error: offset ${offset} is beyond end of file (${total} lines)`
  const start = offset - 1
  let end = Math.min(start + limit, total)
  const numbered = lines.slice(start, end).map((line, index) => `${start + index + 1}| ${line}`)
  let selected = numbered
  let chars = 0
  const trimmed: string[] = []
  for (const line of selected) {
    chars += line.length + 1
    if (chars > maxChars) break
    trimmed.push(line)
  }
  if (trimmed.length !== selected.length) {
    selected = trimmed
    end = start + trimmed.length
  }
  let result = selected.join("\n")
  if (end < total) result += `\n\n(Showing lines ${offset}-${end} of ${total}. Use offset=${end + 1} to continue.)`
  else result += `\n\n(End of file - ${total} lines total)`
  return result
}

export function findNanobotEditMatches(content: string, oldText: string): { text: string; line: number }[] {
  const normalizedContent = content.replace(/\r\n/g, "\n")
  const normalizedOld = oldText.replace(/\r\n/g, "\n")
  const exact = findExactMatches(normalizedContent, normalizedOld)
  if (exact.length) return exact
  const trimmed = findTrimMatches(normalizedContent, normalizedOld, false)
  if (trimmed.length) return trimmed
  const quoteTrimmed = findTrimMatches(normalizedContent, normalizedOld, true)
  if (quoteTrimmed.length) return quoteTrimmed
  return findQuoteMatches(normalizedContent, normalizedOld)
}

export function formatNanobotListDirEntries(input: {
  entries: { name: string; directory?: boolean }[]
  recursive?: boolean
  maxEntries?: number
}): string {
  const maxEntries = input.maxEntries ?? 200
  const visible = input.entries
    .filter((entry) => !(nanobotListDirIgnoredDirs as readonly string[]).includes(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name))
  if (!visible.length) return "Directory . is empty"
  const body = visible.slice(0, maxEntries).map((entry) => {
    if (input.recursive) return entry.directory ? `${entry.name}/` : entry.name
    return `${entry.directory ? "📁" : "📄"} ${entry.name}`
  }).join("\n")
  return visible.length > maxEntries ? `${body}\n\n(truncated, showing first ${maxEntries} of ${visible.length} entries)` : body
}

export function extractNanobotExecAbsolutePaths(command: string): string[] {
  const winPaths = Array.from(command.matchAll(/(?:[A-Za-z]:[^\s"'|><;]*|\\\\[^\s"'|><;]+(?:\\[^\s"'|><;]+)*)/g)).map((match) => match[0])
  const posixPaths = Array.from(command.matchAll(/(?:^|[\s|>'"])(\/[^\s"'>;|<]+)/g)).map((match) => match[1]).filter((value): value is string => Boolean(value))
  const homePaths = Array.from(command.matchAll(/(?:^|[\s>'"])(~[^\s"'>;|<]*)/g)).map((match) => match[1]).filter((value): value is string => Boolean(value))
  return [...winPaths, ...posixPaths, ...homePaths]
}

export function guardNanobotExecCommand(input: {
  command: string
  cwd: string
  restrictToWorkspace?: boolean
  workspace?: string
  allowPatterns?: string[]
  denyPatterns?: string[]
  mediaDir?: string
}): string | undefined {
  const lower = input.command.trim().toLowerCase()
  const allowPatterns = input.allowPatterns ?? []
  const denyPatterns = input.denyPatterns ?? [...nanobotExecDefaultDenyPatterns]
  const explicitlyAllowed = allowPatterns.length > 0 && allowPatterns.some((pattern) => new RegExp(pattern).test(lower))

  if (!explicitlyAllowed) {
    for (const pattern of denyPatterns) {
      if (new RegExp(pattern).test(lower)) return "Error: Command blocked by deny pattern filter"
    }
    if (allowPatterns.length) return "Error: Command blocked by allowlist filter (not in allowlist)"
  }

  if (containsNanobotInternalURL(lower)) return "Error: Command blocked by safety guard (internal/private URL detected)"

  if (!input.restrictToWorkspace) return undefined
  if (lower.includes("../") || lower.includes("..\\")) return `Error: Command blocked by safety guard (path traversal detected)${nanobotWorkspaceBoundaryNote}`

  const cwdPath = resolve(input.cwd)
  const workspace = input.workspace ? resolve(input.workspace) : cwdPath
  if (!isUnderPath(cwdPath, workspace)) return `Error: working_dir is outside the configured workspace${nanobotWorkspaceBoundaryNote}`
  const mediaPath = resolve(input.mediaDir ?? expandHome("~/.nanobot/media"))
  for (const raw of extractNanobotExecAbsolutePaths(input.command)) {
    const expanded = resolve(expandHome(raw))
    if (isNanobotBenignDevicePath(raw) || isNanobotBenignDevicePath(expanded)) continue
    if (isAbsolute(expanded) && !isUnderPath(expanded, cwdPath) && !isUnderPath(expanded, mediaPath)) {
      return `Error: Command blocked by safety guard (path outside working dir)${nanobotWorkspaceBoundaryNote}`
    }
  }
  return undefined
}

export function buildNanobotExecEnv(input: {
  env?: Record<string, string | undefined>
  platform?: "posix" | "win32"
  allowedEnvKeys?: string[]
} = {}): Record<string, string> {
  const env = input.env ?? process.env
  const allowedEnvKeys = input.allowedEnvKeys ?? []
  if (input.platform === "win32") {
    const systemRoot = env["SYSTEMROOT"] ?? "C:\\Windows"
    const result: Record<string, string> = {
      SYSTEMROOT: systemRoot,
      COMSPEC: env["COMSPEC"] ?? `${systemRoot}\\system32\\cmd.exe`,
      USERPROFILE: env["USERPROFILE"] ?? "",
      HOMEDRIVE: env["HOMEDRIVE"] ?? "C:",
      HOMEPATH: env["HOMEPATH"] ?? "\\",
      TEMP: env["TEMP"] ?? `${systemRoot}\\Temp`,
      TMP: env["TMP"] ?? `${systemRoot}\\Temp`,
      PATHEXT: env["PATHEXT"] ?? ".COM;.EXE;.BAT;.CMD",
      PATH: env["PATH"] ?? `${systemRoot}\\system32;${systemRoot}`,
      PYTHONUNBUFFERED: "1",
      APPDATA: env["APPDATA"] ?? "",
      LOCALAPPDATA: env["LOCALAPPDATA"] ?? "",
      ProgramData: env["ProgramData"] ?? "",
      ProgramFiles: env["ProgramFiles"] ?? "",
      "ProgramFiles(x86)": env["ProgramFiles(x86)"] ?? "",
      ProgramW6432: env["ProgramW6432"] ?? "",
    }
    for (const key of allowedEnvKeys) {
      if (env[key] !== undefined) result[key] = String(env[key])
    }
    return result
  }
  const result: Record<string, string> = {
    HOME: env["HOME"] ?? "/tmp",
    LANG: env["LANG"] ?? "C.UTF-8",
    TERM: env["TERM"] ?? "dumb",
    PYTHONUNBUFFERED: "1",
  }
  for (const key of allowedEnvKeys) {
    if (env[key] !== undefined) result[key] = String(env[key])
  }
  return result
}

export function normalizeNanobotToolResult(toolName: string, result: unknown, maxChars: number): unknown {
  const nonempty = ensureNanobotNonemptyToolResult(toolName, result)
  if (typeof nonempty === "string" && nonempty.length > maxChars) return truncateNanobotText(nonempty, maxChars)
  return nonempty
}

export function ensureNanobotNonemptyToolResult(toolName: string, content: unknown): unknown {
  if (content === null || content === undefined) return `(${toolName} completed with no output)`
  if (typeof content === "string" && !content.trim()) return `(${toolName} completed with no output)`
  if (Array.isArray(content)) {
    if (!content.length) return `(${toolName} completed with no output)`
    const text = stringifyNanobotTextBlocks(content)
    if (text !== undefined && !text.trim()) return `(${toolName} completed with no output)`
  }
  return content
}

export function truncateNanobotText(text: string, maxChars: number): string {
  if (maxChars <= 0 || text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n... (truncated)`
}

export function projectNanobotToolRunEvent(input: {
  toolName: string
  result: unknown
  failOnToolError?: boolean
  exception?: unknown
}): { payload: unknown; event: NanobotToolRunEvent; fatalError: Error | undefined } {
  const hint = "\n\n[Analyze the error above and try a different approach.]"
  if (input.exception !== undefined) {
    const message = input.exception instanceof Error ? input.exception.message : String(input.exception)
    const name = input.exception instanceof Error ? input.exception.name : "Error"
    const payload = `Error: ${name}: ${message}`
    return {
      payload,
      event: { name: input.toolName, status: "error", detail: message },
      fatalError: input.failOnToolError ? new Error(message) : undefined,
    }
  }
  if (typeof input.result === "string" && input.result.startsWith("Error")) {
    const payload = input.result + hint
    return {
      payload,
      event: { name: input.toolName, status: "error", detail: input.result.replace(/\n/g, " ").trim().slice(0, 120) },
      fatalError: input.failOnToolError ? new Error(input.result) : undefined,
    }
  }
  let detail = input.result === null || input.result === undefined ? "" : String(input.result)
  detail = detail.replace(/\n/g, " ").trim()
  if (!detail) detail = "(empty)"
  else if (detail.length > 120) detail = `${detail.slice(0, 120)}...`
  return {
    payload: input.result,
    event: { name: input.toolName, status: "ok", detail },
    fatalError: undefined,
  }
}

export function buildNanobotToolEventStartPayload(toolCall: { id?: string; name?: string; arguments?: Record<string, unknown> | null }): NanobotToolEventPayload {
  return {
    version: 1,
    phase: "start",
    call_id: String(toolCall.id ?? ""),
    name: toolCall.name ?? "",
    arguments: toolCall.arguments ?? {},
    result: null,
    error: null,
    files: [],
    embeds: [],
  }
}

export function buildNanobotToolEventFinishPayloads(context: {
  toolCalls: { id?: string; name?: string; arguments?: Record<string, unknown> | null }[]
  toolResults: unknown[]
  toolEvents: Partial<NanobotToolRunEvent>[]
}): NanobotToolEventPayload[] {
  const payloads: NanobotToolEventPayload[] = []
  const count = Math.min(context.toolCalls.length, context.toolResults.length, context.toolEvents.length)
  for (let index = 0; index < count; index += 1) {
    const toolCall = context.toolCalls[index] ?? {}
    const result = context.toolResults[index]
    const event = context.toolEvents[index] ?? {}
    const phase = event.status === "ok" ? "end" : "error"
    const extras = toolEventResultExtras(result)
    payloads.push({
      version: 1,
      phase,
      call_id: String(toolCall.id ?? ""),
      name: toolCall.name ?? "",
      arguments: toolCall.arguments ?? {},
      result: phase === "end" ? result : null,
      error: phase === "error" ? (typeof result === "string" && result.trim() ? result.trim() : String(event.detail ?? "Tool execution failed")) : null,
      files: extras.files,
      embeds: extras.embeds,
    })
  }
  return payloads
}

export function formatNanobotToolHints(
  toolCalls: { name: string; arguments?: unknown }[],
  maxLength = 40,
): string {
  const formatted = toolCalls.map((toolCall) => {
    const args = getToolArgs(toolCall.arguments)
    if (toolCall.name === "read_file") return formatKnownToolHint(toolCall.name, args, ["path", "file_path"], "read {}", true, false, maxLength)
    if (toolCall.name === "write_file") return formatKnownToolHint(toolCall.name, args, ["path", "file_path"], "write {}", true, false, maxLength)
    if (toolCall.name === "edit") return formatKnownToolHint(toolCall.name, args, ["file_path", "path"], "edit {}", true, false, maxLength)
    if (toolCall.name === "grep") return formatKnownToolHint(toolCall.name, args, ["pattern"], "grep \"{}\"", false, false, maxLength)
    if (toolCall.name === "exec") return formatKnownToolHint(toolCall.name, args, ["command"], "$ {}", false, true, maxLength)
    if (toolCall.name === "web_search") return formatKnownToolHint(toolCall.name, args, ["query"], "search \"{}\"", false, false, maxLength)
    if (toolCall.name === "web_fetch") return formatKnownToolHint(toolCall.name, args, ["url"], "fetch {}", true, false, maxLength)
    if (toolCall.name === "list_dir") return formatKnownToolHint(toolCall.name, args, ["path"], "ls {}", true, false, maxLength)
    if (toolCall.name.startsWith("mcp_")) return formatMCPToolHint(toolCall.name, args, maxLength)
    const first = Object.values(args).find((value): value is string => typeof value === "string" && value.length > 0)
    return first ? (first.length > maxLength ? `${toolCall.name}(\"${abbreviatePath(first, maxLength)}\")` : `${toolCall.name}(\"${first}\")`) : toolCall.name
  })
  const compressed: { hint: string; count: number }[] = []
  for (const hint of formatted) {
    const previous = compressed[compressed.length - 1]
    if (previous && previous.hint === hint) previous.count += 1
    else compressed.push({ hint, count: 1 })
  }
  return compressed.map((item) => item.count > 1 ? `${item.hint} x ${item.count}` : item.hint).join(", ")
}

export function buildNanobotToolNativeExactFixture(): NanobotToolNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<NanobotToolNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "nanobot",
    atomIDs: [...nanobotToolNativeExactAtomIDs],
    portIDs: Object.fromEntries(nanobotToolNativeDescriptors.map((descriptor) => [descriptor.id, descriptor.port])) as Record<NanobotToolNativeExactAtomID, NanobotToolNativePortID>,
    upstreamRef: nanobotToolUpstreamRef,
    evidenceRef: nanobotToolNativeExactEvidenceRef,
    fixtureID: nanobotToolNativeExactFixtureID,
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    registryBehavior: {
      definitionOrder: ["edit_file", "exec", "list_dir", "read_file", "write_file", "mcp_memory__search"],
      mcpToolsSortAfterBuiltins: true,
      cachedDefinitionsReuseArrayUntilMutation: true,
      prepareCallCastsStringScalarsBeforeValidation: true,
      missingToolErrorIncludesAvailableNames: true,
      listParamsAreRejectedForReadWriteTools: true,
      executeAppendsRetryHintToPrepareErrorsAndErrorStringResults: true,
    },
    schemaBehavior: {
      schemaFragmentTypes: ["StringSchema", "IntegerSchema", "NumberSchema", "BooleanSchema", "ArraySchema", "ObjectSchema"],
      rootBuilder: "tool_parameters_schema",
      nullabilityUsesTypeUnion: true,
      objectRequiredErrorsUseSubpaths: true,
      arraysValidateItemsWithIndexedPaths: true,
      toolSchemas: nanobotToolSchemaSummaries(),
    },
    permissionProcessBehavior: {
      defaultExecTimeoutSeconds: 60,
      maxExecTimeoutSeconds: 600,
      maxOutputChars: 10000,
      denyPatternCount: nanobotExecDefaultDenyPatterns.length,
      allowPatternsOverrideDenyPatterns: true,
      restrictToWorkspaceChecksWorkingDirAndAbsolutePaths: true,
      workspaceBoundaryNote: nanobotWorkspaceBoundaryNote,
      benignDevicePaths: [...nanobotExecBenignDevicePaths],
      minimalPosixEnvKeys: ["HOME", "LANG", "TERM", "PYTHONUNBUFFERED"],
    },
    workspaceFilesystemBehavior: {
      blockedDevicePaths: [...nanobotBlockedDevicePaths],
      readTextLineNumberFormat: "LINE_NUM| CONTENT",
      readDefaultLimit: 2000,
      readMaxChars: 128000,
      writeCreatesParentDirectories: true,
      editMatchFallbacks: ["exact", "line-trimmed", "quote-normalized-trimmed", "quote-normalized-substring"],
      listDirIgnores: [...nanobotListDirIgnoredDirs],
      listDirDefaultMaxEntries: 200,
    },
    resultProjection: {
      okEventDetail: "first-120-chars-or-empty-marker",
      errorStringGetsRetryHint: true,
      exceptionPayloadPrefix: "Error: TypeError: message",
      emptyToolResultMarker: "(tool_name completed with no output)",
      longStringTruncationSuffix: "\n... (truncated)",
    },
    progressProjection: {
      startPayloadPhase: "start",
      finishOkPhase: "end",
      finishErrorPhase: "error",
      finishPayloadCount: "min(tool_calls, tool_results, tool_events)",
      progressCallbackUsesToolEventsWhenSignatureAcceptsThem: true,
      toolHintFormats: {
        read_file: "read {}",
        write_file: "write {}",
        edit: "edit {}",
        grep: "grep \"{}\"",
        exec: "$ {}",
        web_search: "search \"{}\"",
        web_fetch: "fetch {}",
        list_dir: "ls {}",
      },
    },
    toolPackBehavior: {
      portID: "tools",
      aggregateAtomID: nanobotToolPackCompatibilityNativeExactAtomID,
      upstreamRegistry: "ToolRegistry.get_definitions/prepare_call/execute",
      upstreamExecution: "AgentRunner._execute_tools/_run_tool/_normalize_tool_result",
      builtinToolsSortBeforeMcpTools: true,
      cachedDefinitionsInvalidatedByRegisterUnregister: true,
      preservesPrepareValidateExecutePipeline: true,
      preservesWorkspacePermissionProcessAndResultProjection: true,
      noCompatibilityBridgeLossiness: true,
      aggregateIncludes: [
        "tool.registry",
        "tools.schema",
        "tools.batch-scheduler",
        "tools.result-projector",
        "filesystem.port",
        "process-runner.port",
        "tool.permission-policy",
      ],
    },
    sourceRefs: [
      `${nanobotToolUpstreamRef}:nanobot/agent/tools/base.py#Schema,Tool,tool_parameters`,
      `${nanobotToolUpstreamRef}:nanobot/agent/tools/schema.py#StringSchema,IntegerSchema,NumberSchema,BooleanSchema,ArraySchema,ObjectSchema,tool_parameters_schema`,
      `${nanobotToolUpstreamRef}:nanobot/agent/tools/registry.py#ToolRegistry,register,unregister,get,get_definitions,prepare_call,execute,tool_names`,
      `${nanobotToolUpstreamRef}:nanobot/agent/tools/filesystem.py#_FsTool,ReadFileTool,WriteFileTool,EditFileTool,ListDirTool,_is_blocked_device`,
      `${nanobotToolUpstreamRef}:nanobot/agent/tools/path_utils.py#resolve_workspace_path,is_under,WORKSPACE_BOUNDARY_NOTE`,
      `${nanobotToolUpstreamRef}:nanobot/agent/tools/shell.py#ExecToolConfig,ExecTool,enabled,create,_build_env,_guard_command,_extract_absolute_paths`,
      `${nanobotToolUpstreamRef}:nanobot/agent/runner.py#AgentRunner,_execute_tools,_run_tool,_normalize_tool_result,_classify_violation`,
      `${nanobotToolUpstreamRef}:nanobot/agent/progress_hook.py#AgentProgressHook,before_execute_tools,after_iteration,emit_reasoning,finalize_content`,
      `${nanobotToolUpstreamRef}:nanobot/utils/progress_events.py#build_tool_event_start_payload,build_tool_event_finish_payloads,invoke_on_progress`,
      `${nanobotToolUpstreamRef}:nanobot/utils/runtime.py#ensure_nonempty_tool_result,repeated_external_lookup_error,repeated_workspace_violation_error`,
      `${nanobotToolUpstreamRef}:nanobot/utils/helpers.py#truncate_text,maybe_persist_tool_result,stringify_text_blocks`,
    ],
    nativeEvidenceRefs: [nanobotToolNativeExactEvidenceRef, nanobotToolNativeExactReplayRef],
    fixtureIDs: [nanobotToolNativeExactFixtureID],
    knownLossiness: [],
    descriptors: nanobotToolNativeDescriptors.map((descriptor) => ({ ...descriptor })),
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyNanobotToolNativeExactFixture(fixture: NanobotToolNativeExactFixture): NanobotToolNativeExactVerification {
  const issues: NanobotToolNativeExactIssue[] = []
  const expected = buildNanobotToolNativeExactFixture()
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "nanobot-tool-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Nanobot tool content." })
  }
  if (fixture.product !== "nanobot" || fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "nanobot-tool-native-exact.identity", message: "Fixture must remain a Nanobot native-exact parity claim." })
  }
  if (fixture.upstreamRef !== nanobotToolUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"))) {
    issues.push({ id: "nanobot-tool-native-exact.upstream", message: "Fixture must stay pinned to the Nanobot upstream tool sources." })
  }
  if (!sameStringSet(fixture.atomIDs, [...nanobotToolNativeExactAtomIDs])) {
    issues.push({ id: "nanobot-tool-native-exact.atoms", message: "Nanobot tool native exact atom coverage drifted." })
  }
  if (!sameStringSet(fixture.nativeEvidenceRefs, [nanobotToolNativeExactEvidenceRef, nanobotToolNativeExactReplayRef])) {
    issues.push({ id: "nanobot-tool-native-exact.evidence", message: "Nanobot tool native exact evidence refs are missing or changed." })
  }
  if (!sameStringSet(fixture.fixtureIDs, [nanobotToolNativeExactFixtureID]) || fixture.knownLossiness.length > 0) {
    issues.push({ id: "nanobot-tool-native-exact.fixture-lossiness", message: "Nanobot tool native exact fixture must be linked and carry no lossiness." })
  }
  if (!sameJSON(fixture.registryBehavior, expected.registryBehavior)) {
    issues.push({ id: "nanobot-tool-native-exact.registry", message: "Nanobot ToolRegistry semantics drifted from the native exact fixture." })
  }
  if (!sameJSON(fixture.schemaBehavior, expected.schemaBehavior)) {
    issues.push({ id: "nanobot-tool-native-exact.schema", message: "Nanobot tool schema semantics drifted from upstream schema/base.py." })
  }
  if (!sameJSON(fixture.permissionProcessBehavior, expected.permissionProcessBehavior)) {
    issues.push({ id: "nanobot-tool-native-exact.permission-process", message: "Nanobot exec permission/process behavior drifted from upstream shell.py." })
  }
  if (!sameJSON(fixture.workspaceFilesystemBehavior, expected.workspaceFilesystemBehavior)) {
    issues.push({ id: "nanobot-tool-native-exact.filesystem", message: "Nanobot workspace filesystem behavior drifted from upstream filesystem/path_utils.py." })
  }
  if (!sameJSON(fixture.resultProjection, expected.resultProjection) || !sameJSON(fixture.progressProjection, expected.progressProjection)) {
    issues.push({ id: "nanobot-tool-native-exact.projection", message: "Nanobot tool result/progress projection drifted from upstream runner/progress helpers." })
  }
  if (!sameJSON(fixture.toolPackBehavior, expected.toolPackBehavior)) {
    issues.push({ id: "nanobot-tool-native-exact.tool-pack", message: "Nanobot tool-pack aggregate behavior drifted from upstream registry/runner execution." })
  }
  if (!sameJSON(fixture.descriptors, expected.descriptors)) {
    issues.push({ id: "nanobot-tool-native-exact.descriptors", message: "Nanobot native descriptor metadata drifted from the fixture." })
  }

  return { ok: issues.length === 0, issues }
}

export function buildNanobotToolBatchSchedulerNativeExactFixture(): NanobotToolBatchSchedulerNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<NanobotToolBatchSchedulerNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "nanobot",
    atomID: nanobotToolBatchSchedulerNativeExactAtomID,
    portID: "tools.batch-scheduler",
    upstreamRef: nanobotToolUpstreamRef,
    evidenceRef: nanobotToolBatchSchedulerNativeExactEvidenceRef,
    fixtureID: nanobotToolBatchSchedulerNativeExactFixtureID,
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    schedulingDecision: {
      disabledConcurrency: "one-tool-call-per-batch",
      enabledConcurrency: "adjacent-concurrency-safe-tools-share-a-batch",
      unsafeToolBoundary: "flush-current-safe-batch-then-run-unsafe-tool-alone",
      batchTraversalOrder: "source-tool-call-order",
    },
    executionSemantics: {
      safeBatchExecution: "asyncio.gather",
      unsafeBatchExecution: "sequential-await",
      resultCollectionOrder: "source-tool-call-order-within-each-batch",
      fatalErrorSelection: "first-error-in-collected-result-order",
      toolResultAppendOrder: "source-tool-call-order",
    },
    toolPreparationPipeline: {
      repeatedExternalLookupBlockedBeforePrepareCall: true,
      prepareCallMayCastAndValidateArguments: true,
      workspaceViolationCanReturnSoftPayload: true,
      failOnToolErrorControlsFatalError: true,
    },
    sourceRefs: [
      `${nanobotToolUpstreamRef}:nanobot/agent/runner.py#AgentRunSpec.concurrent_tools,AgentRunner._partition_tool_batches,AgentRunner._execute_tools`,
      `${nanobotToolUpstreamRef}:nanobot/agent/runner.py#AgentRunner._run_tool,repeated_external_lookup_error,_classify_violation`,
      `${nanobotToolUpstreamRef}:nanobot/agent/tools/base.py#Tool.concurrency_safe`,
      `${nanobotToolUpstreamRef}:nanobot/agent/tools/registry.py#ToolRegistry.prepare_call,ToolRegistry.execute`,
    ],
    nativeEvidenceRefs: [...nanobotToolBatchSchedulerNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...nanobotToolBatchSchedulerNativeDescriptor.fixtureIDs],
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyNanobotToolBatchSchedulerNativeExactFixture(
  fixture: NanobotToolBatchSchedulerNativeExactFixture,
): NanobotToolBatchSchedulerNativeExactFixtureVerification {
  const issues: NanobotToolBatchSchedulerNativeExactFixtureIssue[] = []
  const expected = buildNanobotToolBatchSchedulerNativeExactFixture()
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "nanobot-tool-batch-scheduler-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Nanobot tool batch scheduler content." })
  }
  if (fixture.product !== "nanobot" || fixture.atomID !== nanobotToolBatchSchedulerNativeExactAtomID || fixture.portID !== "tools.batch-scheduler") {
    issues.push({ id: "nanobot-tool-batch-scheduler-native-exact.identity", message: "Fixture must remain scoped to the Nanobot tools.batch-scheduler atom." })
  }
  if (fixture.upstreamRef !== nanobotToolUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"))) {
    issues.push({ id: "nanobot-tool-batch-scheduler-native-exact.upstream", message: "Fixture must stay pinned to the Nanobot upstream tool scheduler sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true || fixture.knownLossiness.length > 0) {
    issues.push({ id: "nanobot-tool-batch-scheduler-native-exact.native-claim", message: "Nanobot batch scheduler exact fixture must be native and carry no known lossiness." })
  }
  if (!sameStringSet(fixture.nativeEvidenceRefs, [...nanobotToolBatchSchedulerNativeDescriptor.nativeEvidenceRefs]) || !sameStringSet(fixture.fixtureIDs, [...nanobotToolBatchSchedulerNativeDescriptor.fixtureIDs])) {
    issues.push({ id: "nanobot-tool-batch-scheduler-native-exact.evidence", message: "Nanobot batch scheduler native exact evidence refs or fixture ids are missing." })
  }
  if (!sameJSON(fixture.schedulingDecision, expected.schedulingDecision)) {
    issues.push({ id: "nanobot-tool-batch-scheduler-native-exact.scheduling", message: "Nanobot scheduling decision semantics drifted from _partition_tool_batches." })
  }
  if (!sameJSON(fixture.executionSemantics, expected.executionSemantics)) {
    issues.push({ id: "nanobot-tool-batch-scheduler-native-exact.execution", message: "Nanobot tool execution ordering drifted from _execute_tools." })
  }
  if (!sameJSON(fixture.toolPreparationPipeline, expected.toolPreparationPipeline)) {
    issues.push({ id: "nanobot-tool-batch-scheduler-native-exact.pipeline", message: "Nanobot tool preparation/failure semantics drifted from _run_tool." })
  }

  return { ok: issues.length === 0, issues }
}

function nanobotToolNativeDescriptor(
  id: NanobotToolNativeExactAtomID,
  port: NanobotToolNativePortID,
  selectionReason: string,
): NanobotToolNativeDescriptor {
  return {
    id,
    port,
    product: "nanobot",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [nanobotToolNativeExactEvidenceRef, nanobotToolNativeExactReplayRef],
    fixtureIDs: [nanobotToolNativeExactFixtureID],
    knownLossiness: [],
  }
}

function readFileParameters(): NanobotJSONSchema {
  return toolParametersSchema({
    path: stringSchema("The file path to read"),
    offset: integerSchema(1, {
      description: "Line number to start reading from (1-indexed, default 1)",
      minimum: 1,
    }),
    limit: integerSchema(2000, {
      description: "Maximum number of lines to read (default 2000)",
      minimum: 1,
    }),
    pages: stringSchema("Page range for PDF files, e.g. '1-5' (default: all, max 20 pages)"),
  }, { required: ["path"] })
}

function writeFileParameters(): NanobotJSONSchema {
  return toolParametersSchema({
    path: stringSchema("The file path to write to"),
    content: stringSchema("The content to write"),
  }, { required: ["path", "content"] })
}

function editFileParameters(): NanobotJSONSchema {
  return toolParametersSchema({
    path: stringSchema("The file path to edit"),
    old_text: stringSchema("The text to find and replace"),
    new_text: stringSchema("The text to replace with"),
    replace_all: booleanSchema({ description: "Replace all occurrences (default false)" }),
  }, { required: ["path", "old_text", "new_text"] })
}

function listDirParameters(): NanobotJSONSchema {
  return toolParametersSchema({
    path: stringSchema("The directory path to list"),
    recursive: booleanSchema({ description: "Recursively list all files (default false)" }),
    max_entries: integerSchema(200, {
      description: "Maximum entries to return (default 200)",
      minimum: 1,
    }),
  }, { required: ["path"] })
}

function execParameters(): NanobotJSONSchema {
  return toolParametersSchema({
    command: stringSchema("The shell command to execute"),
    working_dir: stringSchema("Optional working directory for the command"),
    timeout: integerSchema(60, {
      description: "Timeout in seconds. Increase for long-running commands like compilation or installation (default 60, max 600).",
      minimum: 1,
      maximum: 600,
    }),
  }, { required: ["command"] })
}

const readFileDescription = "Read a file (text, image, or document). Text output format: LINE_NUM|CONTENT. Images return visual content for analysis. Supports PDF, DOCX, XLSX, PPTX documents. Use offset and limit for large text files. Reads exceeding ~128K chars are truncated."
const writeFileDescription = "Write content to a file. Overwrites if the file already exists; creates parent directories as needed. For partial edits, prefer edit_file instead."
const editFileDescription = "Edit a file by replacing old_text with new_text. Tolerates minor whitespace/indentation differences and curly/straight quote mismatches. If old_text matches multiple times, you must provide more context or set replace_all=true. Shows a diff of the closest match on failure."
const listDirDescription = "List the contents of a directory. Set recursive=true to explore nested structure. Common noise directories (.git, node_modules, __pycache__, etc.) are auto-ignored."
const execDescription = "Execute a shell command and return its output. Prefer read_file/write_file/edit_file over cat/echo/sed, and grep/glob over shell find/grep. Use -y or --yes flags to avoid interactive prompts. Output is truncated at 10 000 chars; timeout defaults to 60s."

function createNanobotNativeTool(
  name: string,
  description: string,
  parameters: NanobotJSONSchema,
  options: { readOnly?: boolean; exclusive?: boolean; execute?: NanobotNativeTool["execute"] } = {},
): NanobotNativeTool {
  return {
    name,
    description,
    parameters,
    readOnly: options.readOnly ?? false,
    exclusive: options.exclusive ?? false,
    ...(options.execute ? { execute: options.execute } : {}),
  }
}

function nanobotToolSchemaSummaries(): NanobotToolSchemaSummary[] {
  return createNanobotNativeExactTools().map((tool) => {
    const properties = tool.parameters.properties ?? {}
    const required = tool.parameters.required ?? []
    return {
      name: tool.name as NanobotToolSchemaSummary["name"],
      requiredFields: [...required],
      optionalFields: Object.keys(properties).filter((key) => !required.includes(key)),
      readOnly: tool.readOnly === true,
      exclusive: tool.exclusive === true,
    }
  })
}

function validateNanobotToolParams(params: Record<string, unknown>, schema: NanobotJSONSchema): string[] {
  return validateNanobotJSONSchemaValue(params, { ...schema, type: "object" }, "")
}

function castNanobotObject(obj: Record<string, unknown>, schema: NanobotJSONSchema): Record<string, unknown> {
  const properties = schema.properties ?? {}
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [
    key,
    properties[key] ? castNanobotValue(value, properties[key]) : value,
  ]))
}

function castNanobotValue(value: unknown, schema: NanobotJSONSchema): unknown {
  const type = resolveNanobotJSONSchemaType(schema.type)
  if (type === "boolean" && typeof value === "boolean") return value
  if (type === "integer" && isInteger(value) && typeof value !== "boolean") return value
  if ((type === "number" || type === "string") && matchesJSONType(value, type)) return value
  if (typeof value === "string" && (type === "integer" || type === "number")) {
    const parsed = type === "integer" ? Number.parseInt(value, 10) : Number.parseFloat(value)
    return Number.isNaN(parsed) ? value : parsed
  }
  if (type === "string") return value === null || value === undefined ? value : String(value)
  if (type === "boolean" && typeof value === "string") {
    const lower = value.toLowerCase()
    if (["true", "1", "yes"].includes(lower)) return true
    if (["false", "0", "no"].includes(lower)) return false
    return value
  }
  if (type === "array" && Array.isArray(value) && schema.items) return value.map((item) => castNanobotValue(item, schema.items as NanobotJSONSchema))
  if (type === "object" && isRecord(value)) return castNanobotObject(value, schema)
  return value
}

function matchesJSONType(value: unknown, type: NanobotJSONSchemaType): boolean {
  if (type === "string") return typeof value === "string"
  if (type === "boolean") return typeof value === "boolean"
  if (type === "integer") return isInteger(value)
  if (type === "number") return isNumber(value)
  if (type === "array") return Array.isArray(value)
  if (type === "object") return isRecord(value)
  if (type === "null") return value === null
  return false
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value)
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function subpath(path: string, key: string): string {
  return path ? `${path}.${key}` : key
}

function nanobotSchemaName(schema: NanobotOpenAIToolSchema | Record<string, unknown>): string {
  const record = schema as Record<string, unknown>
  const fn = record["function"]
  if (isRecord(fn) && typeof fn["name"] === "string") return fn["name"]
  const name = record["name"]
  return typeof name === "string" ? name : ""
}

function pythonTypeName(value: unknown): string {
  if (Array.isArray(value)) return "list"
  if (value === null) return "NoneType"
  if (typeof value === "string") return "str"
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float"
  if (typeof value === "boolean") return "bool"
  if (typeof value === "object") return "dict"
  return typeof value
}

function cloneJSON<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function stripUndefined<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter((entry) => entry[1] !== undefined)) as T
}

class PermissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PermissionError"
  }
}

function expandHome(path: string): string {
  if (path === "~") return process.env["HOME"] ?? "/tmp"
  if (path.startsWith("~/")) return resolve(process.env["HOME"] ?? "/tmp", path.slice(2))
  return path
}

function isUnderPath(path: string, directory: string): boolean {
  const rel = relative(resolve(directory), resolve(path))
  return rel === "" || (rel.length > 0 && !rel.startsWith("..") && !isAbsolute(rel))
}

function isNanobotBenignDevicePath(path: string): boolean {
  return (nanobotExecBenignDevicePaths as readonly string[]).includes(path) || path.startsWith("/dev/fd/")
}

function containsNanobotInternalURL(command: string): boolean {
  return /https?:\/\/(?:localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/i.test(command)
}

function normalizeQuotes(value: string): string {
  return value
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u201c/g, "\"")
    .replace(/\u201d/g, "\"")
}

function findExactMatches(content: string, oldText: string): { text: string; line: number }[] {
  const matches: { text: string; line: number }[] = []
  let start = 0
  while (true) {
    const index = content.indexOf(oldText, start)
    if (index === -1) break
    matches.push({ text: content.slice(index, index + oldText.length), line: countLines(content.slice(0, index)) + 1 })
    start = index + Math.max(1, oldText.length)
  }
  return matches
}

function findTrimMatches(content: string, oldText: string, normalize: boolean): { text: string; line: number }[] {
  const oldLines = oldText.split(/\n/)
  if (!oldLines.length) return []
  const contentLines = content.split(/\n/)
  const expected = oldLines.map((line) => normalize ? normalizeQuotes(line.trim()) : line.trim())
  const matches: { text: string; line: number }[] = []
  for (let index = 0; index <= contentLines.length - expected.length; index += 1) {
    const window = contentLines.slice(index, index + expected.length)
    const actual = window.map((line) => normalize ? normalizeQuotes(line.trim()) : line.trim())
    if (sameJSON(actual, expected)) matches.push({ text: window.join("\n"), line: index + 1 })
  }
  return matches
}

function findQuoteMatches(content: string, oldText: string): { text: string; line: number }[] {
  const normalizedContent = normalizeQuotes(content)
  const normalizedOld = normalizeQuotes(oldText)
  const matches: { text: string; line: number }[] = []
  let start = 0
  while (true) {
    const index = normalizedContent.indexOf(normalizedOld, start)
    if (index === -1) break
    matches.push({ text: content.slice(index, index + oldText.length), line: countLines(content.slice(0, index)) + 1 })
    start = index + Math.max(1, normalizedOld.length)
  }
  return matches
}

function countLines(value: string): number {
  return value.split("\n").length - 1
}

function stringifyNanobotTextBlocks(content: unknown[]): string | undefined {
  const parts: string[] = []
  for (const block of content) {
    if (!isRecord(block) || block["type"] !== "text" || typeof block["text"] !== "string") return undefined
    parts.push(block["text"])
  }
  return parts.join("\n")
}

function toolEventResultExtras(result: unknown): { files: unknown[]; embeds: unknown[] } {
  if (!isRecord(result)) return { files: [], embeds: [] }
  return {
    files: Array.isArray(result["files"]) ? result["files"] : [],
    embeds: Array.isArray(result["embeds"]) ? result["embeds"] : [],
  }
}

function getToolArgs(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return isRecord(value[0]) ? value[0] : {}
  return isRecord(value) ? value : {}
}

function extractFirstArg(args: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = args[key]
    if (typeof value === "string" && value) return value
  }
  return Object.values(args).find((value): value is string => typeof value === "string" && value.length > 0)
}

function formatKnownToolHint(
  fallbackName: string,
  args: Record<string, unknown>,
  keys: string[],
  template: string,
  isPath: boolean,
  isCommand: boolean,
  maxLength: number,
): string {
  let value = extractFirstArg(args, keys)
  if (!value) return fallbackName
  if (isPath) value = abbreviatePath(value, maxLength)
  else if (isCommand) value = abbreviateCommand(value, maxLength)
  return template.replace("{}", value)
}

function formatMCPToolHint(name: string, args: Record<string, unknown>, maxLength: number): string {
  const rest = name.startsWith("mcp_") ? name.slice(4) : name
  const [server, tool = ""] = rest.includes("__") ? rest.split("__", 2) : rest.split("_", 2)
  if (!tool) return name
  const value = Object.values(args).find((item): item is string => typeof item === "string" && item.length > 0)
  return value ? `${server}::${tool}(\"${abbreviatePath(value, maxLength)}\")` : `${server}::${tool}`
}

function abbreviateCommand(command: string, maxLength: number): string {
  const abbreviated = command.replace(/"((?:[A-Za-z]:[/\\]|~\/|\/)[^"]+)"|'((?:[A-Za-z]:[/\\]|~\/|\/)[^']+)'|((?:[A-Za-z]:[/\\]|~\/|(?<=\s)\/)[^\s;&|<>"']+)/g, (match, double, single, bare) => {
    if (double) return `"${abbreviatePath(double, Math.max(Math.floor(maxLength / 2), 25))}"`
    if (single) return `'${abbreviatePath(single, Math.max(Math.floor(maxLength / 2), 25))}'`
    return abbreviatePath(bare, Math.max(Math.floor(maxLength / 2), 25))
  })
  return abbreviated.length <= maxLength ? abbreviated : `${abbreviated.slice(0, maxLength - 1)}...`
}

function abbreviatePath(path: string, maxLength: number): string {
  if (path.length <= maxLength) return path
  const normalized = path.replace(/\\/g, "/")
  const parts = normalized.split("/")
  if (parts.length <= 2) return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`
  const tail = parts.slice(-2).join("/")
  return tail.length + 4 <= maxLength ? `.../${tail}` : `${tail.slice(0, Math.max(0, maxLength - 3))}...`
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  return stableStringify([...left].sort()) === stableStringify([...right].sort())
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
