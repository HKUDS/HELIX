import { createHash } from "node:crypto"
import {
  piMonoToolRuntimeNativeExactEvidenceRef,
  piMonoToolRuntimeNativeExactFixtureID,
  piMonoToolRuntimeNativeExactReplayRef,
} from "./tool-runtime.ts"

export const piMonoToolRegistrationUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoToolRegistrationNativeExactFixtureID = "pi-tool-registration:native-exact-fixture"
export const piMonoToolRegistrationNativeExactEvidenceRef = "conformance:pi-tool-registration-native-exact-fixture"
export const piMonoToolRegistrationNativeExactReplayRef = "tool-registration-native-exact:pi-mono"
export const piMonoToolPackCompatibilityNativeExactAtomID = "pi.tool-pack.compatibility"
export const piMonoToolPackCompatibilityNativeExactFixtureID = "pi-tool-pack-compatibility:native-exact-fixture"
export const piMonoToolPackCompatibilityNativeExactEvidenceRef = "conformance:pi-tool-pack-compatibility-native-exact-fixture"
export const piMonoToolPackCompatibilityNativeExactReplayRef = "tool-pack-compatibility-native-exact:pi-mono"
const piMonoToolSchemaNativeExactEvidenceRef = "conformance:pi-tool-schema-native-exact-fixture"
const piMonoToolSchemaNativeExactFixtureID = "pi-tool-schema:native-exact-fixture"
const piMonoToolSchemaNativeExactReplayRef = "tool-schema-native-exact:pi-mono"
const piMonoToolBatchSchedulerNativeExactEvidenceRef = "conformance:pi-tool-batch-scheduler-native-exact-fixture"
const piMonoToolBatchSchedulerNativeExactFixtureID = "pi-tool-batch-scheduler:native-exact-fixture"
const piMonoToolBatchSchedulerNativeExactReplayRef = "tool-batch-scheduler-native-exact:pi-mono"
const piMonoToolResultProjectorNativeExactEvidenceRef = "conformance:pi-tool-result-projector-native-exact-fixture"
const piMonoToolResultProjectorNativeExactFixtureID = "pi-tool-result-projector:native-exact-fixture"
const piMonoToolResultProjectorNativeExactReplayRef = "tool-result-projector-native-exact:pi-mono"

export const piMonoToolRegistrationNativeExactAtomIDs = [
  "pi.extension.dynamic-tool-bridge",
  "pi.tool.register-tool-bridge",
  "pi.extension.typebox-bridge",
  "pi.tool.typebox-bridge",
] as const

export type PiMonoToolRegistrationNativeExactAtomID = (typeof piMonoToolRegistrationNativeExactAtomIDs)[number]
export type PiMonoToolRegistrationNativeExactPortID = "tool.registry" | "tool.definition" | "tool.schema-adapter"

export interface PiMonoToolRegistrationNativeDescriptor {
  id: PiMonoToolRegistrationNativeExactAtomID
  port: PiMonoToolRegistrationNativeExactPortID
  product: "pi-mono"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
}

export interface PiMonoToolPackCompatibilityNativeDescriptor {
  id: typeof piMonoToolPackCompatibilityNativeExactAtomID
  port: "tools"
  product: "pi-mono"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
}

export interface PiMonoToolDefinitionInput {
  name: string
  label: string
  description: string
  parameters: unknown
  promptSnippet?: string
  promptGuidelines?: string[]
  prepareArguments?: (args: unknown) => Record<string, unknown>
  executionMode?: "parallel" | "sequential"
  execute(
    toolCallID: string,
    params: Record<string, unknown>,
    signal: AbortSignal | undefined,
    onUpdate: ((details: unknown) => void) | undefined,
    context: PiMonoExtensionContext | undefined,
  ): PiMonoToolExecutionResult
}

export interface PiMonoWrappedToolDefinition {
  name: string
  label: string
  description: string
  parameters: unknown
  prepareArguments?: (args: unknown) => Record<string, unknown>
  executionMode?: "parallel" | "sequential"
  execute(
    toolCallID: string,
    params: Record<string, unknown>,
    signal?: AbortSignal,
    onUpdate?: (details: unknown) => void,
  ): PiMonoToolExecutionResult
}

export interface PiMonoAgentToolInput {
  name: string
  label?: string
  description: string
  parameters?: unknown
  prepareArguments?: (args: unknown) => Record<string, unknown>
  executionMode?: "parallel" | "sequential"
  execute(
    toolCallID: string,
    params: Record<string, unknown>,
    signal?: AbortSignal,
    onUpdate?: (details: unknown) => void,
  ): PiMonoToolExecutionResult
}

export interface PiMonoExtensionContext {
  cwd: string
  ui: {
    notify(message: string, type?: "info" | "warning" | "error"): void
  }
}

export interface PiMonoToolExecutionResult {
  content: Array<{ type: "text"; text: string }>
  details?: Record<string, unknown>
}

export interface PiMonoTypeBoxSchemaProjection {
  parameterKind: "typebox" | "json-schema" | "standard-schema" | "zod" | "effect-schema" | "unknown"
  jsonSchemaSameObject: boolean
  jsonSchemaType: string | undefined
  requiredFields: string[]
  propertyKeys: string[]
}

export type PiMonoToolRegistrationNativeExactScenarioID =
  | "wrap-tool-definition-injects-extension-context"
  | "agent-tool-definition-roundtrip-retains-runtime-fields"
  | "typebox-parameters-pass-through-as-json-schema"
  | "dynamic-echo-tool-name-validation-and-dedupe"

export interface PiMonoToolRegistrationNativeExactCase {
  scenarioID: PiMonoToolRegistrationNativeExactScenarioID
  input: Record<string, string | string[] | boolean>
  output: Record<string, string | string[] | boolean | number>
  upstreamBehavior: string
}

export interface PiMonoToolRegistrationNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: typeof piMonoToolRegistrationNativeExactAtomIDs
  portIDs: PiMonoToolRegistrationNativeExactPortID[]
  upstreamRef: typeof piMonoToolRegistrationUpstreamRef
  evidenceRef: typeof piMonoToolRegistrationNativeExactEvidenceRef
  fixtureID: typeof piMonoToolRegistrationNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    registerToolAcceptsTypeBoxToolDefinition: true
    wrapperPreservesRuntimeFields: readonly ["name", "label", "description", "parameters", "prepareArguments", "executionMode", "execute"]
    wrapperExecuteAppendsExtensionContext: true
    agentToolRoundtripKeepsDefinitionFirstRegistryFields: true
    dynamicToolNameValidation: "trim-lowercase-nonempty-lowercase-alphanumeric-underscore"
    dynamicToolRegistrationDeduplicatesByName: true
    typeBoxParametersPassThroughAsJsonSchema: true
  }
  cases: PiMonoToolRegistrationNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoToolRegistrationNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoToolRegistrationNativeExactVerification {
  ok: boolean
  issues: PiMonoToolRegistrationNativeExactIssue[]
}

export type PiMonoToolPackCompatibilityNativeExactScenarioID =
  | "default-coding-tool-pack"
  | "read-only-tool-pack"
  | "all-tool-pack"
  | "runtime-pack-ordering"

export interface PiMonoToolPackCompatibilityNativeExactCase {
  scenarioID: PiMonoToolPackCompatibilityNativeExactScenarioID
  input: Record<string, string | string[] | boolean>
  output: Record<string, string | string[] | boolean>
  upstreamBehavior: string
}

export interface PiMonoToolPackCompatibilityNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoToolPackCompatibilityNativeExactAtomID
  portID: "tools"
  upstreamRef: typeof piMonoToolRegistrationUpstreamRef
  evidenceRef: typeof piMonoToolPackCompatibilityNativeExactEvidenceRef
  fixtureID: typeof piMonoToolPackCompatibilityNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    aggregateOnly: true
    defaultActiveTools: ["read", "bash", "edit", "write"]
    readOnlyTools: ["read", "grep", "find", "ls"]
    allTools: ["read", "bash", "edit", "write", "grep", "find", "ls"]
    definitionSource: "createToolDefinition/createCodingToolDefinitions/createReadOnlyToolDefinitions/createAllToolDefinitions"
    runtimeSource: "executeToolCalls/executePreparedToolCall/createToolResultMessage"
    noCompatibilityBridgeLossiness: true
  }
  cases: PiMonoToolPackCompatibilityNativeExactCase[]
  componentEvidenceRefs: string[]
  componentFixtureIDs: string[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoToolPackCompatibilityNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoToolPackCompatibilityNativeExactVerification {
  ok: boolean
  issues: PiMonoToolPackCompatibilityNativeExactIssue[]
}

const descriptorBase = {
  product: "pi-mono" as const,
  implementationKind: "factory" as const,
  parityCoverage: "native" as const,
  nativeEvidenceRefs: [piMonoToolRegistrationNativeExactEvidenceRef, piMonoToolRegistrationNativeExactReplayRef],
  fixtureIDs: [piMonoToolRegistrationNativeExactFixtureID],
  knownLossiness: [] as string[],
}

export const piMonoToolRegistrationNativeDescriptors: PiMonoToolRegistrationNativeDescriptor[] = [
  {
    ...descriptorBase,
    id: "pi.extension.dynamic-tool-bridge",
    port: "tool.registry",
    selectionReason: "Pi upstream native implementation of dynamic extension tool registration with native-exact TypeBox wrapper coverage.",
  },
  {
    ...descriptorBase,
    id: "pi.tool.register-tool-bridge",
    port: "tool.definition",
    selectionReason: "Pi upstream native implementation of registerTool ToolDefinition wrapper with native-exact field and context injection coverage.",
  },
  {
    ...descriptorBase,
    id: "pi.extension.typebox-bridge",
    port: "tool.schema-adapter",
    selectionReason: "Pi upstream native implementation of TypeBox extension schema bridge with native-exact parameter pass-through coverage.",
  },
  {
    ...descriptorBase,
    id: "pi.tool.typebox-bridge",
    port: "tool.schema-adapter",
    selectionReason: "Pi upstream native implementation of core tool TypeBox schema bridge with native-exact parameter pass-through coverage.",
  },
]

export const piMonoToolPackCompatibilityNativeDescriptor: PiMonoToolPackCompatibilityNativeDescriptor = {
  product: "pi-mono",
  implementationKind: "factory",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoToolPackCompatibilityNativeExactEvidenceRef, piMonoToolPackCompatibilityNativeExactReplayRef],
  fixtureIDs: [piMonoToolPackCompatibilityNativeExactFixtureID],
  knownLossiness: [],
  id: piMonoToolPackCompatibilityNativeExactAtomID,
  port: "tools",
  selectionReason: "Pi upstream native implementation with native parity complete tool-pack aggregate fixture coverage over schema, registration, runtime, scheduling, and result projection.",
} as const

export function wrapPiMonoToolDefinition(
  definition: PiMonoToolDefinitionInput,
  contextFactory?: () => PiMonoExtensionContext,
): PiMonoWrappedToolDefinition {
  return {
    name: definition.name,
    label: definition.label,
    description: definition.description,
    parameters: definition.parameters,
    ...(definition.prepareArguments ? { prepareArguments: definition.prepareArguments } : {}),
    ...(definition.executionMode ? { executionMode: definition.executionMode } : {}),
    execute: (toolCallID, params, signal, onUpdate) => definition.execute(toolCallID, params, signal, onUpdate, contextFactory?.()),
  }
}

export function createPiMonoToolDefinitionFromAgentTool(tool: PiMonoAgentToolInput): Omit<PiMonoToolDefinitionInput, "execute"> & {
  execute(
    toolCallID: string,
    params: Record<string, unknown>,
    signal: AbortSignal | undefined,
    onUpdate: ((details: unknown) => void) | undefined,
    context?: PiMonoExtensionContext,
  ): PiMonoToolExecutionResult
} {
  return {
    name: tool.name,
    label: tool.label ?? tool.name,
    description: tool.description,
    parameters: tool.parameters,
    ...(tool.prepareArguments ? { prepareArguments: tool.prepareArguments } : {}),
    ...(tool.executionMode ? { executionMode: tool.executionMode } : {}),
    execute: (toolCallID, params, signal, onUpdate) => tool.execute(toolCallID, params, signal, onUpdate),
  }
}

export function normalizePiMonoDynamicToolName(input: string): string | undefined {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return undefined
  if (!/^[a-z0-9_]+$/.test(trimmed)) return undefined
  return trimmed
}

export function createPiMonoEchoTypeBoxSchema(): Record<PropertyKey, unknown> {
  return {
    [Symbol("TypeBox.Kind")]: "Object",
    type: "object",
    required: ["message"],
    properties: {
      message: { type: "string", description: "Message to echo" },
    },
  }
}

export function projectPiMonoTypeBoxToolParameters(parameters: unknown): PiMonoTypeBoxSchemaProjection {
  const adapted = adaptPiMonoToolParameters(parameters)
  const jsonSchema = isRecord(adapted.jsonSchema) ? adapted.jsonSchema : undefined
  const properties = isRecord(jsonSchema?.properties) ? jsonSchema.properties : {}
  return {
    parameterKind: adapted.kind,
    jsonSchemaSameObject: adapted.jsonSchema === parameters,
    jsonSchemaType: typeof jsonSchema?.type === "string" ? jsonSchema.type : undefined,
    requiredFields: Array.isArray(jsonSchema?.required) ? jsonSchema.required.map(String) : [],
    propertyKeys: Object.keys(properties).sort(),
  }
}

function adaptPiMonoToolParameters(parameters: unknown): {
  kind: PiMonoTypeBoxSchemaProjection["parameterKind"]
  schema: unknown
  jsonSchema?: unknown
} {
  if (isTypeBoxSchema(parameters)) return { kind: "typebox", schema: parameters, jsonSchema: parameters }
  if (isJsonSchema(parameters)) return { kind: "json-schema", schema: parameters, jsonSchema: parameters }
  if (isRecord(parameters) && isRecord(parameters["~standard"])) return { kind: "standard-schema", schema: parameters }
  if (isRecord(parameters) && (isRecord(parameters["_def"]) || typeof parameters["safeParse"] === "function")) return { kind: "zod", schema: parameters }
  if (isRecord(parameters) && isRecord(parameters["ast"])) return { kind: "effect-schema", schema: parameters }
  return { kind: "unknown", schema: parameters }
}

function isTypeBoxSchema(value: unknown): boolean {
  return isRecord(value) && Object.getOwnPropertySymbols(value).some((symbol) => symbol.description === "TypeBox.Kind" || symbol.description === "Kind")
}

function isJsonSchema(value: unknown): boolean {
  return isRecord(value) && (typeof value["type"] === "string" || typeof value["$schema"] === "string" || typeof value["properties"] === "object")
}

export function projectPiMonoDynamicEchoToolRegistration(names: string[]): {
  normalizedNames: string[]
  rejectedInputs: string[]
  registeredNames: string[]
  duplicateSkipped: boolean
} {
  const seen = new Set<string>()
  const normalizedNames: string[] = []
  const rejectedInputs: string[] = []
  const registeredNames: string[] = []
  let duplicateSkipped = false
  for (const nameInput of names) {
    const normalized = normalizePiMonoDynamicToolName(nameInput)
    if (!normalized) {
      rejectedInputs.push(nameInput)
      continue
    }
    normalizedNames.push(normalized)
    if (seen.has(normalized)) {
      duplicateSkipped = true
      continue
    }
    seen.add(normalized)
    registeredNames.push(normalized)
  }
  return { normalizedNames, rejectedInputs, registeredNames, duplicateSkipped }
}

export function projectPiMonoWrappedToolDefinition(): Record<string, string | string[] | boolean> {
  const schema = createPiMonoEchoTypeBoxSchema()
  const wrapped = wrapPiMonoToolDefinition(
    {
      name: "echo_session",
      label: "Echo Session",
      description: "Echo a message with prefix: [session] ",
      parameters: schema,
      prepareArguments: (args) => (isRecord(args) ? args as Record<string, unknown> : {}),
      executionMode: "parallel",
      execute(_toolCallID, params, _signal, _onUpdate, context) {
        return {
          content: [{ type: "text", text: `${context?.cwd ?? ""}:${String(params.message)}` }],
          details: { cwd: context?.cwd, tool: "echo_session" },
        }
      },
    },
    () => ({ cwd: "/workspace/pi", ui: { notify() {} } }),
  )
  const result = wrapped.execute("toolu_1", { message: "hello" })
  return {
    retainedFields: Object.keys(wrapped).sort(),
    contextInjected: result.details?.cwd === "/workspace/pi",
    resultText: result.content[0]?.text ?? "",
  }
}

export function buildPiMonoToolRegistrationNativeExactFixture(): PiMonoToolRegistrationNativeExactFixture {
  const typeBoxProjection = projectPiMonoTypeBoxToolParameters(createPiMonoEchoTypeBoxSchema())
  const dynamicRegistration = projectPiMonoDynamicEchoToolRegistration([" echo_session ", "Echo_Session", "bad-name", "runtime_2"])
  const wrapped = projectPiMonoWrappedToolDefinition()
  const agentRoundtrip = createPiMonoToolDefinitionFromAgentTool({
    name: "echo_session",
    label: "Echo Session",
    description: "Echo a message with prefix: [session] ",
    parameters: createPiMonoEchoTypeBoxSchema(),
    executionMode: "parallel",
    execute(_toolCallID, params) {
      return { content: [{ type: "text", text: String(params.message) }] }
    },
  })
  const fixtureWithoutFingerprint: Omit<PiMonoToolRegistrationNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: piMonoToolRegistrationNativeExactAtomIDs,
    portIDs: ["tool.registry", "tool.definition", "tool.schema-adapter"],
    upstreamRef: piMonoToolRegistrationUpstreamRef,
    evidenceRef: piMonoToolRegistrationNativeExactEvidenceRef,
    fixtureID: piMonoToolRegistrationNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      registerToolAcceptsTypeBoxToolDefinition: true,
      wrapperPreservesRuntimeFields: ["name", "label", "description", "parameters", "prepareArguments", "executionMode", "execute"],
      wrapperExecuteAppendsExtensionContext: true,
      agentToolRoundtripKeepsDefinitionFirstRegistryFields: true,
      dynamicToolNameValidation: "trim-lowercase-nonempty-lowercase-alphanumeric-underscore" as const,
      dynamicToolRegistrationDeduplicatesByName: true,
      typeBoxParametersPassThroughAsJsonSchema: true,
    },
    cases: [
      {
        scenarioID: "wrap-tool-definition-injects-extension-context",
        input: { toolName: "echo_session", contextCwd: "/workspace/pi" },
        output: wrapped,
        upstreamBehavior: "wrapToolDefinition preserves runtime fields and passes ctxFactory output as the fifth execute argument.",
      },
      {
        scenarioID: "agent-tool-definition-roundtrip-retains-runtime-fields",
        input: { toolName: agentRoundtrip.name, executionMode: agentRoundtrip.executionMode ?? "" },
        output: {
          retainedFields: Object.keys(agentRoundtrip).sort(),
          executeIgnoresExtensionContext: agentRoundtrip.execute("toolu_2", { message: "roundtrip" }, undefined, undefined, { cwd: "/ignored", ui: { notify() {} } }).content[0]?.text === "roundtrip",
        },
        upstreamBehavior: "createToolDefinitionFromAgentTool synthesizes a definition-first registry entry from plain AgentTool overrides.",
      },
      {
        scenarioID: "typebox-parameters-pass-through-as-json-schema",
        input: { schemaName: "ECHO_PARAMS" },
        output: {
          parameterKind: typeBoxProjection.parameterKind,
          jsonSchemaSameObject: typeBoxProjection.jsonSchemaSameObject,
          jsonSchemaType: typeBoxProjection.jsonSchemaType ?? "",
          requiredFields: typeBoxProjection.requiredFields,
          propertyKeys: typeBoxProjection.propertyKeys,
        },
        upstreamBehavior: "TypeBox.Object parameters stay as provider-visible JSON schema while retaining TypeBox identity.",
      },
      {
        scenarioID: "dynamic-echo-tool-name-validation-and-dedupe",
        input: { names: [" echo_session ", "Echo_Session", "bad-name", "runtime_2"] },
        output: {
          normalizedNames: dynamicRegistration.normalizedNames,
          rejectedInputs: dynamicRegistration.rejectedInputs,
          registeredNames: dynamicRegistration.registeredNames,
          duplicateSkipped: dynamicRegistration.duplicateSkipped,
        },
        upstreamBehavior: "dynamic-tools normalizes names with trim/lowercase, rejects non alphanumeric underscores, and skips duplicates.",
      },
    ],
    sourceRefs: [
      `${piMonoToolRegistrationUpstreamRef}:packages/coding-agent/src/core/tools/tool-definition-wrapper.ts#wrapToolDefinition,createToolDefinitionFromAgentTool`,
      `${piMonoToolRegistrationUpstreamRef}:packages/coding-agent/src/core/extensions/types.ts#ToolDefinition,ExtensionAPI.registerTool`,
      `${piMonoToolRegistrationUpstreamRef}:packages/coding-agent/src/core/tools/index.ts#ToolName,createToolDefinition,createCodingToolDefinitions,createReadOnlyToolDefinitions,createAllToolDefinitions`,
      `${piMonoToolRegistrationUpstreamRef}:packages/coding-agent/examples/extensions/dynamic-tools.ts#ECHO_PARAMS,normalizeToolName,dynamicToolsExtension`,
    ],
    nativeEvidenceRefs: [piMonoToolRegistrationNativeExactEvidenceRef, piMonoToolRegistrationNativeExactReplayRef],
    fixtureIDs: [piMonoToolRegistrationNativeExactFixtureID],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function buildPiMonoToolPackCompatibilityNativeExactFixture(): PiMonoToolPackCompatibilityNativeExactFixture {
  const componentEvidenceRefs = [
    piMonoToolRegistrationNativeExactEvidenceRef,
    piMonoToolRegistrationNativeExactReplayRef,
    piMonoToolRuntimeNativeExactEvidenceRef,
    piMonoToolRuntimeNativeExactReplayRef,
    piMonoToolSchemaNativeExactEvidenceRef,
    piMonoToolSchemaNativeExactReplayRef,
    piMonoToolBatchSchedulerNativeExactEvidenceRef,
    piMonoToolBatchSchedulerNativeExactReplayRef,
    piMonoToolResultProjectorNativeExactEvidenceRef,
    piMonoToolResultProjectorNativeExactReplayRef,
  ]
  const componentFixtureIDs = [
    piMonoToolRegistrationNativeExactFixtureID,
    piMonoToolRuntimeNativeExactFixtureID,
    piMonoToolSchemaNativeExactFixtureID,
    piMonoToolBatchSchedulerNativeExactFixtureID,
    piMonoToolResultProjectorNativeExactFixtureID,
  ]
  const fixtureWithoutFingerprint: Omit<PiMonoToolPackCompatibilityNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoToolPackCompatibilityNativeExactAtomID,
    portID: "tools" as const,
    upstreamRef: piMonoToolRegistrationUpstreamRef,
    evidenceRef: piMonoToolPackCompatibilityNativeExactEvidenceRef,
    fixtureID: piMonoToolPackCompatibilityNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      aggregateOnly: true,
      defaultActiveTools: ["read", "bash", "edit", "write"],
      readOnlyTools: ["read", "grep", "find", "ls"],
      allTools: ["read", "bash", "edit", "write", "grep", "find", "ls"],
      definitionSource: "createToolDefinition/createCodingToolDefinitions/createReadOnlyToolDefinitions/createAllToolDefinitions" as const,
      runtimeSource: "executeToolCalls/executePreparedToolCall/createToolResultMessage" as const,
      noCompatibilityBridgeLossiness: true,
    },
    cases: [
      {
        scenarioID: "default-coding-tool-pack",
        input: { factory: "createCodingToolDefinitions", cwd: "/workspace/pi" },
        output: { toolNames: ["read", "bash", "edit", "write"], mutatingTools: ["bash", "edit", "write"], schemaEvidence: piMonoToolSchemaNativeExactEvidenceRef },
        upstreamBehavior: "Pi default coding sessions activate read, bash, edit, and write definitions from the native tool index.",
      },
      {
        scenarioID: "read-only-tool-pack",
        input: { factory: "createReadOnlyToolDefinitions", cwd: "/workspace/pi" },
        output: { toolNames: ["read", "grep", "find", "ls"], mutatingTools: [], schemaEvidence: piMonoToolSchemaNativeExactEvidenceRef },
        upstreamBehavior: "Pi read-only sessions use the native read, grep, find, and ls definition pack without write/process mutators.",
      },
      {
        scenarioID: "all-tool-pack",
        input: { factory: "createAllToolDefinitions", cwd: "/workspace/pi" },
        output: { toolNames: ["read", "bash", "edit", "write", "grep", "find", "ls"], registrationEvidence: piMonoToolRegistrationNativeExactEvidenceRef },
        upstreamBehavior: "Pi all-tools registry exposes the seven native tool definitions by ToolName and preserves extension registration wrappers.",
      },
      {
        scenarioID: "runtime-pack-ordering",
        input: { scheduler: "executeToolCalls", mode: "parallel-or-sequential" },
        output: {
          schedulerEvidence: piMonoToolBatchSchedulerNativeExactEvidenceRef,
          runtimeEvidence: piMonoToolRuntimeNativeExactEvidenceRef,
          resultEvidence: piMonoToolResultProjectorNativeExactEvidenceRef,
          resultMessageOrder: "source-tool-call-order",
        },
        upstreamBehavior: "Pi executes the selected tool pack through native batch scheduling, runtime event emission, and toolResult message projection.",
      },
    ],
    componentEvidenceRefs,
    componentFixtureIDs,
    sourceRefs: [
      `${piMonoToolRegistrationUpstreamRef}:packages/coding-agent/src/core/tools/index.ts#ToolName,allToolNames,createToolDefinition,createCodingToolDefinitions,createReadOnlyToolDefinitions,createAllToolDefinitions`,
      `${piMonoToolRegistrationUpstreamRef}:packages/coding-agent/src/core/sdk.ts#defaultActiveToolNames,allowedToolNames,initialActiveToolNames`,
      `${piMonoToolRegistrationUpstreamRef}:packages/coding-agent/src/core/agent-session.ts#_refreshToolRegistry,_createToolDefinitions,getActiveToolNames,setActiveToolsByName`,
      `${piMonoToolRegistrationUpstreamRef}:packages/agent/src/agent-loop.ts#executeToolCalls,executeToolCallsSequential,executeToolCallsParallel,executePreparedToolCall,createToolResultMessage`,
      `${piMonoToolRegistrationUpstreamRef}:packages/coding-agent/src/core/tools/tool-definition-wrapper.ts#wrapToolDefinition,createToolDefinitionFromAgentTool`,
    ],
    nativeEvidenceRefs: [piMonoToolPackCompatibilityNativeExactEvidenceRef, piMonoToolPackCompatibilityNativeExactReplayRef, ...componentEvidenceRefs],
    fixtureIDs: [piMonoToolPackCompatibilityNativeExactFixtureID, ...componentFixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoToolRegistrationNativeExactFixture(
  fixture: PiMonoToolRegistrationNativeExactFixture,
): PiMonoToolRegistrationNativeExactVerification {
  const issues: PiMonoToolRegistrationNativeExactIssue[] = []
  const expected = buildPiMonoToolRegistrationNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "pi-tool-registration-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi tool registration content." })
  }
  if (fixture.product !== "pi-mono" || !sameJSON(fixture.atomIDs, piMonoToolRegistrationNativeExactAtomIDs)) {
    issues.push({ id: "pi-tool-registration-native-exact.identity", message: "Fixture must stay scoped to the Pi tool registration native atom group." })
  }
  if (fixture.upstreamRef !== piMonoToolRegistrationUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("7c2775f6f67c38ed491a1ff68240ee4f8ba688da"))) {
    issues.push({ id: "pi-tool-registration-native-exact.upstream", message: "Fixture must stay pinned to the Pi tool registration upstream sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-tool-registration-native-exact.native-claim", message: "Pi tool registration fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "pi-tool-registration-native-exact.lossiness", message: "Native exact Pi tool registration fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoToolRegistrationNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoToolRegistrationNativeExactReplayRef)) {
    issues.push({ id: "pi-tool-registration-native-exact.evidence", message: "Pi tool registration native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoToolRegistrationNativeExactFixtureID)) {
    issues.push({ id: "pi-tool-registration-native-exact.fixture", message: "Pi tool registration native exact fixture ID is missing." })
  }
  if (!sameJSON(fixture.policy, expected.policy)) {
    issues.push({ id: "pi-tool-registration-native-exact.policy", message: "Pi tool registration native policy drifted from upstream wrapper and dynamic tool semantics." })
  }
  if (!sameJSON(fixture.cases, expected.cases)) {
    issues.push({ id: "pi-tool-registration-native-exact.cases", message: "Pi tool registration native cases drifted from upstream wrapper or TypeBox behavior." })
  }

  return { ok: issues.length === 0, issues }
}

export function verifyPiMonoToolPackCompatibilityNativeExactFixture(
  fixture: PiMonoToolPackCompatibilityNativeExactFixture,
): PiMonoToolPackCompatibilityNativeExactVerification {
  const issues: PiMonoToolPackCompatibilityNativeExactIssue[] = []
  const expected = buildPiMonoToolPackCompatibilityNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "pi-tool-pack-compatibility-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi tool-pack compatibility content." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoToolPackCompatibilityNativeExactAtomID || fixture.portID !== "tools") {
    issues.push({ id: "pi-tool-pack-compatibility-native-exact.identity", message: "Fixture must stay scoped to the Pi tools aggregate atom." })
  }
  if (fixture.upstreamRef !== piMonoToolRegistrationUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("7c2775f6f67c38ed491a1ff68240ee4f8ba688da"))) {
    issues.push({ id: "pi-tool-pack-compatibility-native-exact.upstream", message: "Fixture must stay pinned to the Pi native tool-pack upstream sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-tool-pack-compatibility-native-exact.native-claim", message: "Pi tool-pack fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "pi-tool-pack-compatibility-native-exact.lossiness", message: "Native exact Pi tool-pack fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoToolPackCompatibilityNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoToolPackCompatibilityNativeExactReplayRef)) {
    issues.push({ id: "pi-tool-pack-compatibility-native-exact.evidence", message: "Pi tool-pack native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoToolPackCompatibilityNativeExactFixtureID)) {
    issues.push({ id: "pi-tool-pack-compatibility-native-exact.fixture", message: "Pi tool-pack native exact fixture ID is missing." })
  }
  if (!sameJSON(fixture.policy, expected.policy)) {
    issues.push({ id: "pi-tool-pack-compatibility-native-exact.policy", message: "Pi tool-pack aggregate policy drifted from upstream tool definition and runtime semantics." })
  }
  if (!sameJSON(fixture.componentEvidenceRefs, expected.componentEvidenceRefs) || !sameJSON(fixture.componentFixtureIDs, expected.componentFixtureIDs)) {
    issues.push({ id: "pi-tool-pack-compatibility-native-exact.components", message: "Pi tool-pack component evidence refs drifted from the native schema/registration/runtime group." })
  }
  if (!sameJSON(fixture.cases, expected.cases)) {
    issues.push({ id: "pi-tool-pack-compatibility-native-exact.cases", message: "Pi tool-pack native cases drifted from upstream tool-pack behavior." })
  }

  return { ok: issues.length === 0, issues }
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
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
