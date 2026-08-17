import { createHash } from "node:crypto"
import type { ToolSchemaSnapshot } from "../cadence-atoms"

export const piMonoToolSchemaNativeExactAtomID = "pi.tools.schema.native-like"
export const piMonoToolSchemaNativeExactFixtureID = "pi-tool-schema:native-exact-fixture"
export const piMonoToolSchemaNativeExactEvidenceRef = "conformance:pi-tool-schema-native-exact-fixture"
export const piMonoToolSchemaNativeExactReplayRef = "tool-schema-native-exact:pi-mono"
export const piMonoToolSchemaUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoToolBatchSchedulerNativeExactAtomID = "pi.tools.batch-scheduler.native-like"
export const piMonoToolBatchSchedulerNativeExactFixtureID = "pi-tool-batch-scheduler:native-exact-fixture"
export const piMonoToolBatchSchedulerNativeExactEvidenceRef = "conformance:pi-tool-batch-scheduler-native-exact-fixture"
export const piMonoToolBatchSchedulerNativeExactReplayRef = "tool-batch-scheduler-native-exact:pi-mono"
export const piMonoToolResultProjectorNativeExactAtomID = "pi.tools.result-projector.native-like"
export const piMonoToolResultProjectorNativeExactFixtureID = "pi-tool-result-projector:native-exact-fixture"
export const piMonoToolResultProjectorNativeExactEvidenceRef = "conformance:pi-tool-result-projector-native-exact-fixture"
export const piMonoToolResultProjectorNativeExactReplayRef = "tool-result-projector-native-exact:pi-mono"

export interface PiMonoToolSchemaNativeExactTool {
  name: "read" | "bash" | "edit" | "write" | "grep" | "find" | "ls"
  aliases: string[]
  requiredFields: string[]
  optionalFields: string[]
  pathField: "path"
  commandField?: "command"
  mutating: boolean
  parametersKind: "TypeBox.Object"
  nestedRequiredFields?: Record<string, string[]>
}

export interface PiMonoDynamicToolSchemaNativeExactFixture {
  registrationToolName: "echo_session"
  dynamicNameValidation: "lowercase-alphanumeric-underscore"
  requiredFields: ["message"]
  parametersKind: "TypeBox.Object"
  wrapperRetainedFields: ["name", "label", "description", "parameters", "prepareArguments", "executionMode", "execute"]
}

export interface PiMonoToolSchemaNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoToolSchemaNativeExactAtomID
  portID: "tools.schema"
  upstreamRef: typeof piMonoToolSchemaUpstreamRef
  evidenceRef: typeof piMonoToolSchemaNativeExactEvidenceRef
  fixtureID: typeof piMonoToolSchemaNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  schema: ToolSchemaSnapshot
  tools: PiMonoToolSchemaNativeExactTool[]
  dynamicToolSchema: PiMonoDynamicToolSchemaNativeExactFixture
  toolSets: {
    coding: ["read", "bash", "edit", "write"]
    readOnly: ["read", "grep", "find", "ls"]
    all: ["read", "bash", "edit", "write", "grep", "find", "ls"]
  }
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoToolSchemaNativeExactFixtureIssue {
  id: string
  message: string
}

export interface PiMonoToolSchemaNativeExactFixtureVerification {
  ok: boolean
  issues: PiMonoToolSchemaNativeExactFixtureIssue[]
}

export type PiMonoToolBatchSchedulerEvent = "tool_execution_start" | "tool_execution_end" | "message_start" | "message_end"

export interface PiMonoToolBatchSchedulerNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoToolBatchSchedulerNativeExactAtomID
  portID: "tools.batch-scheduler"
  upstreamRef: typeof piMonoToolSchemaUpstreamRef
  evidenceRef: typeof piMonoToolBatchSchedulerNativeExactEvidenceRef
  fixtureID: typeof piMonoToolBatchSchedulerNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  schedulingDecision: {
    defaultMode: "parallel"
    forcedSequentialConfig: "config.toolExecution === sequential"
    forcedSequentialToolMode: "any requested tool executionMode === sequential"
    parallelToolMode: "all requested tools omit executionMode or declare parallel"
  }
  sequentialExecution: {
    toolCallTraversalOrder: "source-tool-call-order"
    eventOrderPerCall: PiMonoToolBatchSchedulerEvent[]
    resultMessageTiming: "immediate-after-each-finalized-call"
    steeringMessagesInjectedAfterBatch: true
    abortStopsFurtherScheduling: true
  }
  parallelExecution: {
    toolExecutionStartOrder: "source-tool-call-order"
    preparedToolCallsExecuteConcurrently: true
    immediateOutcomesFinalizeDuringScheduling: true
    toolExecutionEndOrder: "completion-order"
    resultMessageOrder: "source-tool-call-order"
    resultMessagesEmittedAfterAllFinalized: true
  }
  toolPreparationPipeline: {
    prepareArgumentsBeforeValidation: true
    validateArgumentsBeforeBeforeHook: true
    beforeToolCallCanBlock: true
    executeReceivesPreparedValidatedArgs: true
    afterToolCallFinalizesPreparedResultsOnly: true
  }
  immediateOutcomeSources: ["unknown-tool", "argument-validation-error", "beforeToolCall-block", "abort"]
  executionOutcomeSources: ["tool-return", "tool-throw", "afterToolCall-override", "afterToolCall-throw"]
  termination: {
    batchTerminatesWhen: "every-finalized-result-terminate-true"
    emptyBatchTerminates: false
    partialTerminateContinues: true
  }
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoToolBatchSchedulerNativeExactFixtureIssue {
  id: string
  message: string
}

export interface PiMonoToolBatchSchedulerNativeExactFixtureVerification {
  ok: boolean
  issues: PiMonoToolBatchSchedulerNativeExactFixtureIssue[]
}

export type PiMonoToolResultMessageField = "role" | "toolCallId" | "toolName" | "content" | "details" | "isError" | "timestamp"

export interface PiMonoToolResultProjectorNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomID: typeof piMonoToolResultProjectorNativeExactAtomID
  portID: "tools.result-projector"
  upstreamRef: typeof piMonoToolSchemaUpstreamRef
  evidenceRef: typeof piMonoToolResultProjectorNativeExactEvidenceRef
  fixtureID: typeof piMonoToolResultProjectorNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  messageShape: {
    interface: "ToolResultMessage"
    fields: PiMonoToolResultMessageField[]
    role: "toolResult"
    contentKinds: ["text", "image"]
    timestampSource: "Date.now"
  }
  successProjection: {
    toolCallId: "toolCall.id"
    toolName: "toolCall.name"
    content: "result.content"
    details: "result.details"
    isError: false
  }
  errorProjection: {
    content: [{ type: "text"; text: "error message" }]
    details: Record<string, never>
    isError: true
    sources: ["unknown-tool", "argument-validation-error", "beforeToolCall-block", "tool-throw", "afterToolCall-throw", "abort"]
  }
  eventProjection: {
    executionEndBeforeResultMessage: true
    resultMessageEvents: ["message_start", "message_end"]
    turnEndCarriesToolResults: true
    contextWritebackBeforeTurnEndCallback: true
  }
  parallelOrdering: {
    toolExecutionEndOrder: "completion-order"
    resultMessageOrder: "source-tool-call-order"
    turnEndToolResultsOrder: "source-tool-call-order"
  }
  termination: {
    batchTerminatesWhen: "every-finalized-result-terminate-true"
    partialTerminateContinues: true
  }
  afterToolCallProjection: {
    canOverride: ["content", "details", "terminate", "isError"]
    thrownErrorBecomesTextErrorResult: true
  }
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoToolResultProjectorNativeExactFixtureIssue {
  id: string
  message: string
}

export interface PiMonoToolResultProjectorNativeExactFixtureVerification {
  ok: boolean
  issues: PiMonoToolResultProjectorNativeExactFixtureIssue[]
}

export const piMonoToolSchemaNativeDescriptor = {
  id: piMonoToolSchemaNativeExactAtomID,
  port: "tools.schema",
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: "Pi upstream native implementation with native parity complete TypeBox tool schema exact fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoToolSchemaNativeExactEvidenceRef, piMonoToolSchemaNativeExactReplayRef],
  fixtureIDs: [piMonoToolSchemaNativeExactFixtureID],
  knownLossiness: [],
} as const

export const piMonoToolBatchSchedulerNativeDescriptor = {
  id: piMonoToolBatchSchedulerNativeExactAtomID,
  port: "tools.batch-scheduler",
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: "Pi upstream native implementation with native parity complete tool batch scheduler exact fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoToolBatchSchedulerNativeExactEvidenceRef, piMonoToolBatchSchedulerNativeExactReplayRef],
  fixtureIDs: [piMonoToolBatchSchedulerNativeExactFixtureID],
  knownLossiness: [],
} as const

export const piMonoToolResultProjectorNativeDescriptor = {
  id: piMonoToolResultProjectorNativeExactAtomID,
  port: "tools.result-projector",
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: "Pi upstream native implementation with native parity complete tool result projector exact fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoToolResultProjectorNativeExactEvidenceRef, piMonoToolResultProjectorNativeExactReplayRef],
  fixtureIDs: [piMonoToolResultProjectorNativeExactFixtureID],
  knownLossiness: [],
} as const

export function buildPiMonoToolSchemaNativeExactFixture(): PiMonoToolSchemaNativeExactFixture {
  const tools = piMonoNativeTools()
  const schema = createPiMonoNativeExactToolSchemaSnapshot(tools)
  const fixtureWithoutFingerprint: Omit<PiMonoToolSchemaNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoToolSchemaNativeExactAtomID,
    portID: "tools.schema" as const,
    upstreamRef: piMonoToolSchemaUpstreamRef,
    evidenceRef: piMonoToolSchemaNativeExactEvidenceRef,
    fixtureID: piMonoToolSchemaNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    schema,
    tools,
    dynamicToolSchema: {
      registrationToolName: "echo_session" as const,
      dynamicNameValidation: "lowercase-alphanumeric-underscore" as const,
      requiredFields: ["message"] as const,
      parametersKind: "TypeBox.Object" as const,
      wrapperRetainedFields: ["name", "label", "description", "parameters", "prepareArguments", "executionMode", "execute"] as const,
    },
    toolSets: {
      coding: ["read", "bash", "edit", "write"] as const,
      readOnly: ["read", "grep", "find", "ls"] as const,
      all: ["read", "bash", "edit", "write", "grep", "find", "ls"] as const,
    },
    sourceRefs: [
      `${piMonoToolSchemaUpstreamRef}:packages/coding-agent/src/core/tools/index.ts#ToolName,allToolNames,createCodingToolDefinitions,createReadOnlyToolDefinitions,createAllToolDefinitions`,
      `${piMonoToolSchemaUpstreamRef}:packages/coding-agent/src/core/tools/read.ts#readSchema,createReadToolDefinition`,
      `${piMonoToolSchemaUpstreamRef}:packages/coding-agent/src/core/tools/bash.ts#bashSchema,createBashToolDefinition`,
      `${piMonoToolSchemaUpstreamRef}:packages/coding-agent/src/core/tools/edit.ts#replaceEditSchema,editSchema,createEditToolDefinition`,
      `${piMonoToolSchemaUpstreamRef}:packages/coding-agent/src/core/tools/write.ts#writeSchema,createWriteToolDefinition`,
      `${piMonoToolSchemaUpstreamRef}:packages/coding-agent/src/core/tools/grep.ts#grepSchema,createGrepToolDefinition`,
      `${piMonoToolSchemaUpstreamRef}:packages/coding-agent/src/core/tools/find.ts#findSchema,createFindToolDefinition`,
      `${piMonoToolSchemaUpstreamRef}:packages/coding-agent/src/core/tools/ls.ts#lsSchema,createLsToolDefinition`,
      `${piMonoToolSchemaUpstreamRef}:packages/coding-agent/src/core/tools/tool-definition-wrapper.ts#wrapToolDefinition,createToolDefinitionFromAgentTool`,
      `${piMonoToolSchemaUpstreamRef}:packages/coding-agent/examples/extensions/dynamic-tools.ts#ECHO_PARAMS,normalizeToolName,dynamicToolsExtension`,
    ],
    nativeEvidenceRefs: [...piMonoToolSchemaNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoToolSchemaNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoToolSchemaNativeExactFixture(
  fixture: PiMonoToolSchemaNativeExactFixture,
): PiMonoToolSchemaNativeExactFixtureVerification {
  const issues: PiMonoToolSchemaNativeExactFixtureIssue[] = []
  const expected = buildPiMonoToolSchemaNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "pi-tool-schema-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi tool schema content." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoToolSchemaNativeExactAtomID || fixture.portID !== "tools.schema") {
    issues.push({ id: "pi-tool-schema-native-exact.identity", message: "Fixture must remain scoped to the Pi tools.schema atom." })
  }
  if (fixture.upstreamRef !== piMonoToolSchemaUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("7c2775f6f67c38ed491a1ff68240ee4f8ba688da"))) {
    issues.push({ id: "pi-tool-schema-native-exact.upstream", message: "Fixture must stay pinned to the Pi upstream schema sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-tool-schema-native-exact.native-claim", message: "Pi tool schema exact fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "pi-tool-schema-native-exact.lossiness", message: "Native exact Pi schema fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoToolSchemaNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoToolSchemaNativeExactReplayRef)) {
    issues.push({ id: "pi-tool-schema-native-exact.evidence", message: "Pi native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoToolSchemaNativeExactFixtureID)) {
    issues.push({ id: "pi-tool-schema-native-exact.fixture", message: "Pi native exact fixture ID is missing." })
  }
  if (!sameJSON(fixture.tools, expected.tools) || !sameJSON(fixture.schema.tools, expected.schema.tools)) {
    issues.push({ id: "pi-tool-schema-native-exact.tools", message: "Pi tool schema contracts drifted from the native exact fixture." })
  }
  if (!sameJSON(fixture.toolSets, expected.toolSets)) {
    issues.push({ id: "pi-tool-schema-native-exact.tool-sets", message: "Pi core tool set membership drifted from upstream index.ts." })
  }
  if (!sameJSON(fixture.dynamicToolSchema, expected.dynamicToolSchema)) {
    issues.push({ id: "pi-tool-schema-native-exact.dynamic-tool", message: "Pi dynamic TypeBox tool schema bridge drifted from upstream dynamic-tools.ts or wrapper behavior." })
  }

  return { ok: issues.length === 0, issues }
}

export function buildPiMonoToolBatchSchedulerNativeExactFixture(): PiMonoToolBatchSchedulerNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<PiMonoToolBatchSchedulerNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoToolBatchSchedulerNativeExactAtomID,
    portID: "tools.batch-scheduler" as const,
    upstreamRef: piMonoToolSchemaUpstreamRef,
    evidenceRef: piMonoToolBatchSchedulerNativeExactEvidenceRef,
    fixtureID: piMonoToolBatchSchedulerNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    schedulingDecision: {
      defaultMode: "parallel" as const,
      forcedSequentialConfig: "config.toolExecution === sequential" as const,
      forcedSequentialToolMode: "any requested tool executionMode === sequential" as const,
      parallelToolMode: "all requested tools omit executionMode or declare parallel" as const,
    },
    sequentialExecution: {
      toolCallTraversalOrder: "source-tool-call-order" as const,
      eventOrderPerCall: ["tool_execution_start", "tool_execution_end", "message_start", "message_end"],
      resultMessageTiming: "immediate-after-each-finalized-call" as const,
      steeringMessagesInjectedAfterBatch: true,
      abortStopsFurtherScheduling: true,
    },
    parallelExecution: {
      toolExecutionStartOrder: "source-tool-call-order" as const,
      preparedToolCallsExecuteConcurrently: true,
      immediateOutcomesFinalizeDuringScheduling: true,
      toolExecutionEndOrder: "completion-order" as const,
      resultMessageOrder: "source-tool-call-order" as const,
      resultMessagesEmittedAfterAllFinalized: true,
    },
    toolPreparationPipeline: {
      prepareArgumentsBeforeValidation: true,
      validateArgumentsBeforeBeforeHook: true,
      beforeToolCallCanBlock: true,
      executeReceivesPreparedValidatedArgs: true,
      afterToolCallFinalizesPreparedResultsOnly: true,
    },
    immediateOutcomeSources: ["unknown-tool", "argument-validation-error", "beforeToolCall-block", "abort"] as const,
    executionOutcomeSources: ["tool-return", "tool-throw", "afterToolCall-override", "afterToolCall-throw"] as const,
    termination: {
      batchTerminatesWhen: "every-finalized-result-terminate-true" as const,
      emptyBatchTerminates: false,
      partialTerminateContinues: true,
    },
    sourceRefs: [
      `${piMonoToolSchemaUpstreamRef}:packages/agent/src/agent-loop.ts#executeToolCalls,executeToolCallsSequential,executeToolCallsParallel,prepareToolCall,executePreparedToolCall,finalizeExecutedToolCall,shouldTerminateToolBatch`,
      `${piMonoToolSchemaUpstreamRef}:packages/agent/src/types.ts#AgentTool.executionMode,AgentLoopConfig.toolExecution,BeforeToolCallContext,AfterToolCallContext`,
      `${piMonoToolSchemaUpstreamRef}:packages/agent/test/agent-loop.test.ts#should emit tool_execution_end in completion order but persist tool results in source order`,
      `${piMonoToolSchemaUpstreamRef}:packages/agent/test/agent-loop.test.ts#should force sequential execution when a tool has executionMode=sequential even with default parallel config`,
      `${piMonoToolSchemaUpstreamRef}:packages/agent/test/agent-loop.test.ts#should force sequential execution when one of multiple tools has executionMode=sequential`,
      `${piMonoToolSchemaUpstreamRef}:packages/agent/test/agent-loop.test.ts#should allow parallel execution when all tools have executionMode=parallel`,
      `${piMonoToolSchemaUpstreamRef}:packages/agent/test/agent-loop.test.ts#should inject queued messages after all tool calls complete`,
    ],
    nativeEvidenceRefs: [...piMonoToolBatchSchedulerNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoToolBatchSchedulerNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoToolBatchSchedulerNativeExactFixture(
  fixture: PiMonoToolBatchSchedulerNativeExactFixture,
): PiMonoToolBatchSchedulerNativeExactFixtureVerification {
  const issues: PiMonoToolBatchSchedulerNativeExactFixtureIssue[] = []
  const expected = buildPiMonoToolBatchSchedulerNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi tool batch scheduler content." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoToolBatchSchedulerNativeExactAtomID || fixture.portID !== "tools.batch-scheduler") {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.identity", message: "Fixture must remain scoped to the Pi tools.batch-scheduler atom." })
  }
  if (fixture.upstreamRef !== piMonoToolSchemaUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("7c2775f6f67c38ed491a1ff68240ee4f8ba688da"))) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.upstream", message: "Fixture must stay pinned to the Pi upstream tool scheduling sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.native-claim", message: "Pi tool batch scheduler exact fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.lossiness", message: "Native exact Pi batch scheduler fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoToolBatchSchedulerNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoToolBatchSchedulerNativeExactReplayRef)) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.evidence", message: "Pi batch scheduler native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoToolBatchSchedulerNativeExactFixtureID)) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.fixture", message: "Pi batch scheduler native exact fixture ID is missing." })
  }
  if (!sameJSON(fixture.schedulingDecision, expected.schedulingDecision)) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.scheduling-decision", message: "Pi tool scheduling mode selection drifted from upstream executeToolCalls." })
  }
  if (!sameJSON(fixture.sequentialExecution, expected.sequentialExecution)) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.sequential", message: "Pi sequential tool scheduling semantics drifted from upstream executeToolCallsSequential." })
  }
  if (!sameJSON(fixture.parallelExecution, expected.parallelExecution)) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.parallel", message: "Pi parallel tool scheduling semantics drifted from upstream executeToolCallsParallel." })
  }
  if (!sameJSON(fixture.toolPreparationPipeline, expected.toolPreparationPipeline) || !sameJSON(fixture.immediateOutcomeSources, expected.immediateOutcomeSources) || !sameJSON(fixture.executionOutcomeSources, expected.executionOutcomeSources)) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.pipeline", message: "Pi tool preparation, hook, or outcome pipeline drifted from upstream agent-loop scheduling." })
  }
  if (!sameJSON(fixture.termination, expected.termination)) {
    issues.push({ id: "pi-tool-batch-scheduler-native-exact.termination", message: "Pi tool batch termination semantics drifted from upstream shouldTerminateToolBatch." })
  }

  return { ok: issues.length === 0, issues }
}

export function buildPiMonoToolResultProjectorNativeExactFixture(): PiMonoToolResultProjectorNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<PiMonoToolResultProjectorNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomID: piMonoToolResultProjectorNativeExactAtomID,
    portID: "tools.result-projector" as const,
    upstreamRef: piMonoToolSchemaUpstreamRef,
    evidenceRef: piMonoToolResultProjectorNativeExactEvidenceRef,
    fixtureID: piMonoToolResultProjectorNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    messageShape: {
      interface: "ToolResultMessage" as const,
      fields: ["role", "toolCallId", "toolName", "content", "details", "isError", "timestamp"],
      role: "toolResult" as const,
      contentKinds: ["text", "image"] as const,
      timestampSource: "Date.now" as const,
    },
    successProjection: {
      toolCallId: "toolCall.id" as const,
      toolName: "toolCall.name" as const,
      content: "result.content" as const,
      details: "result.details" as const,
      isError: false as const,
    },
    errorProjection: {
      content: [{ type: "text" as const, text: "error message" as const }],
      details: {},
      isError: true as const,
      sources: ["unknown-tool", "argument-validation-error", "beforeToolCall-block", "tool-throw", "afterToolCall-throw", "abort"] as const,
    },
    eventProjection: {
      executionEndBeforeResultMessage: true,
      resultMessageEvents: ["message_start", "message_end"] as const,
      turnEndCarriesToolResults: true,
      contextWritebackBeforeTurnEndCallback: true,
    },
    parallelOrdering: {
      toolExecutionEndOrder: "completion-order" as const,
      resultMessageOrder: "source-tool-call-order" as const,
      turnEndToolResultsOrder: "source-tool-call-order" as const,
    },
    termination: {
      batchTerminatesWhen: "every-finalized-result-terminate-true" as const,
      partialTerminateContinues: true,
    },
    afterToolCallProjection: {
      canOverride: ["content", "details", "terminate", "isError"] as const,
      thrownErrorBecomesTextErrorResult: true,
    },
    sourceRefs: [
      `${piMonoToolSchemaUpstreamRef}:packages/agent/src/agent-loop.ts#executeToolCallsSequential,executeToolCallsParallel,createToolResultMessage,emitToolResultMessage,finalizeExecutedToolCall,createErrorToolResult,shouldTerminateToolBatch`,
      `${piMonoToolSchemaUpstreamRef}:packages/ai/src/types.ts#ToolResultMessage`,
      `${piMonoToolSchemaUpstreamRef}:packages/agent/test/agent-loop.test.ts#should emit tool_execution_end in completion order but persist tool results in source order`,
      `${piMonoToolSchemaUpstreamRef}:packages/agent/test/agent-loop.test.ts#should stop after a tool batch when every tool result sets terminate=true`,
      `${piMonoToolSchemaUpstreamRef}:packages/agent/test/agent-loop.test.ts#should continue after parallel tool calls when not all tool results terminate`,
      `${piMonoToolSchemaUpstreamRef}:packages/agent/test/agent-loop.test.ts#should stop after the current turn when shouldStopAfterTurn returns true`,
    ],
    nativeEvidenceRefs: [...piMonoToolResultProjectorNativeDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...piMonoToolResultProjectorNativeDescriptor.fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoToolResultProjectorNativeExactFixture(
  fixture: PiMonoToolResultProjectorNativeExactFixture,
): PiMonoToolResultProjectorNativeExactFixtureVerification {
  const issues: PiMonoToolResultProjectorNativeExactFixtureIssue[] = []
  const expected = buildPiMonoToolResultProjectorNativeExactFixture()
  const { fingerprint: _fixtureFingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = fingerprintObject(withoutFingerprint)

  if (fixture.fingerprint !== expectedFingerprint) {
    issues.push({ id: "pi-tool-result-projector-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi tool result projector content." })
  }
  if (fixture.product !== "pi-mono" || fixture.atomID !== piMonoToolResultProjectorNativeExactAtomID || fixture.portID !== "tools.result-projector") {
    issues.push({ id: "pi-tool-result-projector-native-exact.identity", message: "Fixture must remain scoped to the Pi tools.result-projector atom." })
  }
  if (fixture.upstreamRef !== piMonoToolSchemaUpstreamRef || !fixture.sourceRefs.every((ref) => ref.includes("7c2775f6f67c38ed491a1ff68240ee4f8ba688da"))) {
    issues.push({ id: "pi-tool-result-projector-native-exact.upstream", message: "Fixture must stay pinned to the Pi upstream tool result projector sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-tool-result-projector-native-exact.native-claim", message: "Pi tool result projector exact fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0) {
    issues.push({ id: "pi-tool-result-projector-native-exact.lossiness", message: "Native exact Pi result projector fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoToolResultProjectorNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoToolResultProjectorNativeExactReplayRef)) {
    issues.push({ id: "pi-tool-result-projector-native-exact.evidence", message: "Pi result projector native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoToolResultProjectorNativeExactFixtureID)) {
    issues.push({ id: "pi-tool-result-projector-native-exact.fixture", message: "Pi result projector native exact fixture ID is missing." })
  }
  if (!sameJSON(fixture.messageShape, expected.messageShape) || !sameJSON(fixture.successProjection, expected.successProjection)) {
    issues.push({ id: "pi-tool-result-projector-native-exact.message-shape", message: "Pi tool result message projection drifted from upstream createToolResultMessage/ToolResultMessage." })
  }
  if (!sameJSON(fixture.errorProjection, expected.errorProjection) || !sameJSON(fixture.afterToolCallProjection, expected.afterToolCallProjection)) {
    issues.push({ id: "pi-tool-result-projector-native-exact.error-projection", message: "Pi tool result error/afterToolCall projection drifted from upstream finalize/error handling." })
  }
  if (!sameJSON(fixture.eventProjection, expected.eventProjection) || !sameJSON(fixture.parallelOrdering, expected.parallelOrdering)) {
    issues.push({ id: "pi-tool-result-projector-native-exact.ordering", message: "Pi tool result event or parallel ordering evidence drifted from upstream agent-loop tests." })
  }
  if (!sameJSON(fixture.termination, expected.termination)) {
    issues.push({ id: "pi-tool-result-projector-native-exact.termination", message: "Pi tool result termination semantics drifted from upstream shouldTerminateToolBatch." })
  }

  return { ok: issues.length === 0, issues }
}

function createPiMonoNativeExactToolSchemaSnapshot(tools: PiMonoToolSchemaNativeExactTool[]): ToolSchemaSnapshot {
  return {
    product: "pi-mono",
    atomID: piMonoToolSchemaNativeExactAtomID,
    tools: tools.map((tool) => ({
      name: tool.name,
      aliases: [...tool.aliases],
      requiredFields: [...tool.requiredFields],
      pathField: tool.pathField,
      ...(tool.commandField ? { commandField: tool.commandField } : {}),
      mutating: tool.mutating,
    })),
  }
}

function piMonoNativeTools(): PiMonoToolSchemaNativeExactTool[] {
  return [
    tool("read", ["read"], ["path"], ["offset", "limit"], false),
    tool("bash", ["bash"], ["command"], ["timeout"], true, { commandField: "command" }),
    tool("edit", ["edit"], ["path", "edits"], [], true, { nestedRequiredFields: { "edits[]": ["oldText", "newText"] } }),
    tool("write", ["write"], ["path", "content"], [], true),
    tool("grep", ["grep"], ["pattern"], ["path", "glob", "ignoreCase", "literal", "context", "limit"], false),
    tool("find", ["find"], ["pattern"], ["path", "limit"], false),
    tool("ls", ["ls"], [], ["path", "limit"], false),
  ]
}

function tool(
  name: PiMonoToolSchemaNativeExactTool["name"],
  aliases: string[],
  requiredFields: string[],
  optionalFields: string[],
  mutating: boolean,
  options: {
    commandField?: "command"
    nestedRequiredFields?: Record<string, string[]>
  } = {},
): PiMonoToolSchemaNativeExactTool {
  return {
    name,
    aliases,
    requiredFields,
    optionalFields,
    pathField: "path",
    ...(options.commandField ? { commandField: options.commandField } : {}),
    mutating,
    parametersKind: "TypeBox.Object",
    ...(options.nestedRequiredFields ? { nestedRequiredFields: options.nestedRequiredFields } : {}),
  }
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
