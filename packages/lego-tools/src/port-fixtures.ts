import { createHash } from "node:crypto"
import type { LegoPortContractFixture } from "@helix/contracts"
import {
  buildToolCadenceReplaySnapshot,
  type ToolCadenceReplayProduct,
  type ToolCadenceReplaySnapshot,
  type ToolResultEnvelopeRoundTripSnapshot,
  type ToolResultEventStreamSnapshot,
  type ToolResultWritebackTimingSnapshot,
} from "./cadence-atoms"
import {
  openCodeToolNativeExactEvidenceRef,
  openCodeToolNativeExactFixtureID,
  openCodeToolNativeExactReplayRef,
} from "./product-schema/opencode"

export type OpenCodeToolSourceRefID =
  | "tool-core"
  | "tool-bash"
  | "tool-edit"
  | "tool-task"
  | "tool-todowrite"
  | "tool-skill"
  | "tool-registry"
  | "session-tools"
  | "session-processor"
  | "message-v2"
  | "error-util"
  | "plugin-core"
  | "plugin-boot"
  | "plugin-permission"
  | "file-system"
  | "local-tool-runtime-projection"
  | "local-tool-contract-render-projection"
  | "local-tool-live-runtime-fixture"

export interface OpenCodeToolSourceRef {
  id: OpenCodeToolSourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-12"
}

export type OpenCodeToolSourceMatrixBranchID =
  | "tool-definition-plugin"
  | "tool-schema-bridge"
  | "permission-ask-hook"
  | "plugin-permission-bridge"
  | "plugin-tool-registry"
  | "permission-render"
  | "result-render"
  | "status-stream"
  | "workspace-filesystem"
  | "live-plugin-tool-runtime"
  | "permission-ui-side-effects"
  | "exact-workspace-fs-side-effects"

export type OpenCodeToolSourceMatrixBranchStatus = "partial" | "missing" | "native-exact"
export type OpenCodeToolSourceMatrixExactDiffStatus = "native-exact" | "exact-diff-partial"

export interface OpenCodeToolSourceMatrixBranchAnchor {
  branchID: OpenCodeToolSourceMatrixBranchID
  status: OpenCodeToolSourceMatrixBranchStatus
  exactDiffStatus: OpenCodeToolSourceMatrixExactDiffStatus
  nativeParityClaim: boolean
  sourceRefIDs: OpenCodeToolSourceRefID[]
  toolAtomIDs: string[]
  toolPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
}

export interface OpenCodeToolSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-tool-source-matrix"
  fixtureID: "opencode-tool:source-matrix"
  sourceRefs: OpenCodeToolSourceRef[]
  branchAnchors: OpenCodeToolSourceMatrixBranchAnchor[]
  nativeExactBranchIDs: OpenCodeToolSourceMatrixBranchID[]
  partialBranchIDs: OpenCodeToolSourceMatrixBranchID[]
  missingBranchIDs: OpenCodeToolSourceMatrixBranchID[]
  coveredToolAtomIDs: string[]
  coveredToolPortIDs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeToolRuntimeProjectionEvent =
  | {
    type: "plugin.tool"
    toolName: string
    pluginID?: string
    schemaKeys: string[]
    sequence: number
  }
  | {
    type: "permission.ui"
    permissionID: string
    status: "allow" | "deny" | "ask" | "pending"
    subject?: string
    sequence: number
  }
  | {
    type: "workspace.fs"
    operation: "read" | "write" | "list" | "watch"
    pathKind: "file" | "directory" | "glob" | "unknown"
    policy?: string
    sideEffectKeys: string[]
    sequence: number
  }

export interface OpenCodeToolRuntimeProjection {
  schemaVersion: 1
  fixtureID: "opencode-tool:runtime-projection"
  evidenceRef: "conformance:opencode-tool-runtime-projection"
  coveredBranchIDs: Array<Extract<OpenCodeToolSourceMatrixBranchID, "live-plugin-tool-runtime" | "permission-ui-side-effects" | "exact-workspace-fs-side-effects">>
  retainedFields: string[]
  lossyFields: string[]
  pluginToolRuntime: Array<{ toolName: string; pluginID: string | null; schemaKeys: string[]; sequence: number }>
  permissionUISideEffects: Array<{ permissionID: string; status: "allow" | "deny" | "ask" | "pending"; subjectObserved: boolean; sequence: number }>
  workspaceFSSideEffects: Array<{ operation: "read" | "write" | "list" | "watch"; pathKind: "file" | "directory" | "glob" | "unknown"; policy: string | null; sideEffectKeys: string[]; sequence: number }>
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeToolContractRenderProjectionEvent =
  | {
    type: "schema"
    toolName: string
    schemaKeys: string[]
    requiredKeys?: string[]
    permissionSubjectField?: string
    sequence: number
  }
  | {
    type: "permission.render"
    toolName: string
    permissionID?: string
    status: "allow" | "deny" | "ask" | "pending"
    renderKeys: string[]
    subject?: string
    sequence: number
  }
  | {
    type: "result.render"
    toolName: string
    partKind: "text" | "json" | "error" | "metadata" | "unknown"
    outputKind?: "stdout" | "stderr" | "tool-result" | "permission-denied" | "unknown"
    metadataKeys: string[]
    sequence: number
  }
  | {
    type: "status.bridge"
    toolName: string
    status: "queued" | "running" | "complete" | "error" | "permission-denied"
    recordID?: string
    eventKeys: string[]
    sequence: number
  }

export interface OpenCodeToolContractRenderProjection {
  schemaVersion: 1
  fixtureID: "opencode-tool:contract-render-projection"
  evidenceRef: "conformance:opencode-tool-contract-render-projection"
  coveredBranchIDs: Array<Extract<OpenCodeToolSourceMatrixBranchID, "tool-schema-bridge" | "permission-render" | "result-render" | "status-stream">>
  retainedFields: string[]
  lossyFields: string[]
  schemas: Array<{ toolName: string; schemaKeys: string[]; requiredKeys: string[]; permissionSubjectFieldObserved: boolean; sequence: number }>
  permissionRenders: Array<{ toolName: string; permissionID: string | null; status: "allow" | "deny" | "ask" | "pending"; renderKeys: string[]; subjectObserved: boolean; sequence: number }>
  resultRenders: Array<{ toolName: string; partKind: "text" | "json" | "error" | "metadata" | "unknown"; outputKind: "stdout" | "stderr" | "tool-result" | "permission-denied" | "unknown" | null; metadataKeys: string[]; sequence: number }>
  statusBridges: Array<{ toolName: string; status: "queued" | "running" | "complete" | "error" | "permission-denied"; recordIDObserved: boolean; eventKeys: string[]; sequence: number }>
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeToolLiveRuntimeFixtureInput {
  toolName?: string
  pluginID?: string
  permissionID?: string
  command?: string
  rawResultPayload?: string
  statusRecordID?: string
  workspacePolicy?: string
}

export interface OpenCodeToolSchemaLiveReadback {
  toolName: string
  schemaKeys: string[]
  requiredKeys: string[]
  permissionSubjectField: string
  schemaObjectHash: string
  pluginID: string
  sequence: number
}

export interface OpenCodeToolPermissionLiveReadback {
  toolName: string
  permissionID: string
  status: "allow" | "deny" | "ask" | "pending"
  subject: string
  renderKeys: string[]
  requestOrder: number
  responseOrder: number
  uiSideEffectKeys: string[]
  sequence: number
}

export interface OpenCodeToolResultLiveReadback {
  toolName: string
  partKind: "text" | "json" | "error" | "metadata" | "unknown"
  outputKind: "stdout" | "stderr" | "tool-result" | "permission-denied" | "unknown"
  metadataKeys: string[]
  messagePartID: string
  rawPayloadHash: string
  writebackRecordID: string
  sequence: number
}

export interface OpenCodeToolStatusLiveReadback {
  toolName: string
  status: "queued" | "running" | "complete" | "error" | "permission-denied"
  recordID: string
  uiOrder: number
  eventKeys: string[]
  sequence: number
}

export interface OpenCodeToolWorkspaceFSLiveReadback {
  operation: "read" | "write" | "list" | "watch"
  pathKind: "file" | "directory" | "glob" | "unknown"
  policy: string
  sideEffectKeys: string[]
  watchEventID: string
  syscallHash: string
  sequence: number
}

export interface OpenCodeToolPluginLifecycleLiveReadback {
  pluginID: string
  registeredToolNames: string[]
  disposeOrder: number
  reloadGeneration: number
  cleanupKeys: string[]
  sequence: number
}

export interface OpenCodeToolLiveRuntimeFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-tool-live-runtime-fixture"
  fixtureID: "opencode-tool:live-runtime-fixture"
  exactDiffStatus: "live-runtime-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  fixtureDiffTarget: "tool.contract-envelope-replay"
  relatedFixtureDiffTargets: Array<"hook.plugin-lifecycle-replay">
  coveredBranchIDs: Array<Extract<OpenCodeToolSourceMatrixBranchID, "tool-schema-bridge" | "permission-render" | "result-render" | "status-stream" | "live-plugin-tool-runtime" | "permission-ui-side-effects" | "exact-workspace-fs-side-effects">>
  schemaReadback: OpenCodeToolSchemaLiveReadback[]
  permissionReadback: OpenCodeToolPermissionLiveReadback[]
  resultReadback: OpenCodeToolResultLiveReadback[]
  statusReadback: OpenCodeToolStatusLiveReadback[]
  workspaceFSReadback: OpenCodeToolWorkspaceFSLiveReadback[]
  pluginLifecycleReadback: OpenCodeToolPluginLifecycleLiveReadback[]
  toolRuntimeProjection: OpenCodeToolRuntimeProjection
  toolContractRenderProjection: OpenCodeToolContractRenderProjection
  retainedFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeToolLiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeToolLiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeToolLiveRuntimeFixtureIssue[]
}

const OPENCODE_TOOL_SOURCE_REFS: OpenCodeToolSourceRef[] = [
  {
    id: "tool-core",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/tool/tool.ts",
    symbols: ["Tool", "Info", "Context", "define", "execute", "permissions"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-bash",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/tool/bash.ts",
    symbols: ["BashTool", "Parameters", "execute", "permission", "render"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-edit",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/tool/edit.ts",
    symbols: ["EditTool", "Parameters", "execute", "permission", "render"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-task",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/tool/task.ts",
    symbols: ["TaskTool", "Parameters", "execute", "render"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-todowrite",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/tool/todowrite.ts",
    symbols: ["TodoWriteTool", "Parameters", "execute", "render"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-skill",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/tool/skill.ts",
    symbols: ["SkillTool", "Parameters"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-registry",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/tools.ts",
    symbols: ["SessionTools", "resolve"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-tools",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/tools.ts",
    symbols: ["SessionTools", "resolve", "context", "metadata", "execute"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "session-processor",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/processor.ts",
    symbols: ["SessionProcessor", "ensureToolCall", "updateToolCall", "completeToolCall", "failToolCall", "toolInput"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "message-v2",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/message-v2.ts",
    symbols: ["ToolPart", "ToolStatePending", "ToolStateRunning", "ToolStateCompleted", "ToolStateError"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "error-util",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/util/error.ts",
    symbols: ["errorMessage", "errorFormat"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "plugin-core",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin.ts",
    symbols: ["Hooks", "HookFunctions", "PluginV2", "Service", "define"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "plugin-boot",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/boot.ts",
    symbols: ["PluginBoot", "Service", "Interface"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "plugin-permission",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/permission/index.ts",
    symbols: ["Permission", "ask", "respond", "status"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "file-system",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/file/index.ts",
    symbols: ["File", "read", "write", "list", "watch"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "local-tool-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-tools/src/port-fixtures.ts",
    symbols: ["projectOpenCodeToolRuntimeProjection", "OpenCodeToolRuntimeProjection"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-tool-contract-render-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-tools/src/port-fixtures.ts",
    symbols: ["projectOpenCodeToolContractRenderProjection", "OpenCodeToolContractRenderProjection"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-tool-live-runtime-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-tools/src/port-fixtures.ts",
    symbols: ["captureOpenCodeToolLiveRuntimeFixture", "verifyOpenCodeToolLiveRuntimeFixture", "OpenCodeToolLiveRuntimeFixture"],
    evidence: "local-source:2026-06-12",
  },
]

export function projectOpenCodeToolRuntimeProjection(events: OpenCodeToolRuntimeProjectionEvent[]): OpenCodeToolRuntimeProjection {
  const pluginToolRuntime = events
    .filter((event): event is Extract<OpenCodeToolRuntimeProjectionEvent, { type: "plugin.tool" }> => event.type === "plugin.tool")
    .map((event) => ({
      toolName: event.toolName,
      pluginID: typeof event.pluginID === "string" && event.pluginID.length > 0 ? event.pluginID : null,
      schemaKeys: uniqueStrings(event.schemaKeys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.toolName.localeCompare(right.toolName))

  const permissionUISideEffects = events
    .filter((event): event is Extract<OpenCodeToolRuntimeProjectionEvent, { type: "permission.ui" }> => event.type === "permission.ui")
    .map((event) => ({
      permissionID: event.permissionID,
      status: event.status,
      subjectObserved: typeof event.subject === "string" && event.subject.length > 0,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.permissionID.localeCompare(right.permissionID))

  const workspaceFSSideEffects = events
    .filter((event): event is Extract<OpenCodeToolRuntimeProjectionEvent, { type: "workspace.fs" }> => event.type === "workspace.fs")
    .map((event) => ({
      operation: event.operation,
      pathKind: event.pathKind,
      policy: typeof event.policy === "string" && event.policy.length > 0 ? event.policy : null,
      sideEffectKeys: uniqueStrings(event.sideEffectKeys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.operation.localeCompare(right.operation))

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-tool:runtime-projection" as const,
    evidenceRef: "conformance:opencode-tool-runtime-projection" as const,
    coveredBranchIDs: [
      "live-plugin-tool-runtime",
      "permission-ui-side-effects",
      "exact-workspace-fs-side-effects",
    ] as OpenCodeToolRuntimeProjection["coveredBranchIDs"],
    retainedFields: [
      "toolName",
      "pluginID",
      "schemaKeys",
      "permissionID",
      "status",
      "subjectObserved",
      "operation",
      "pathKind",
      "policy",
      "sideEffectKeys",
      "sequence",
    ],
    lossyFields: [
      "native plugin module execution side effects",
      "plugin lifecycle/dispose ordering",
      "permission UI render timing",
      "permission response race/order",
      "raw file contents",
      "filesystem watch event ordering",
      "workspace filesystem syscall side effects",
    ],
    pluginToolRuntime,
    permissionUISideEffects,
    workspaceFSSideEffects,
    knownGaps: [
      "opencode-live-plugin-tool-runtime-not-spawned",
      "opencode-permission-ui-side-effects-not-replayed",
      "opencode-workspace-filesystem-side-effects-not-exact",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function projectOpenCodeToolContractRenderProjection(events: OpenCodeToolContractRenderProjectionEvent[]): OpenCodeToolContractRenderProjection {
  const schemas = events
    .filter((event): event is Extract<OpenCodeToolContractRenderProjectionEvent, { type: "schema" }> => event.type === "schema")
    .map((event) => ({
      toolName: event.toolName,
      schemaKeys: uniqueStrings(event.schemaKeys),
      requiredKeys: uniqueStrings(event.requiredKeys ?? []),
      permissionSubjectFieldObserved: typeof event.permissionSubjectField === "string" && event.permissionSubjectField.length > 0,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.toolName.localeCompare(right.toolName))

  const permissionRenders = events
    .filter((event): event is Extract<OpenCodeToolContractRenderProjectionEvent, { type: "permission.render" }> => event.type === "permission.render")
    .map((event) => ({
      toolName: event.toolName,
      permissionID: typeof event.permissionID === "string" && event.permissionID.length > 0 ? event.permissionID : null,
      status: event.status,
      renderKeys: uniqueStrings(event.renderKeys),
      subjectObserved: typeof event.subject === "string" && event.subject.length > 0,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.toolName.localeCompare(right.toolName))

  const resultRenders = events
    .filter((event): event is Extract<OpenCodeToolContractRenderProjectionEvent, { type: "result.render" }> => event.type === "result.render")
    .map((event) => ({
      toolName: event.toolName,
      partKind: event.partKind,
      outputKind: typeof event.outputKind === "string" && event.outputKind.length > 0 ? event.outputKind : null,
      metadataKeys: uniqueStrings(event.metadataKeys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.toolName.localeCompare(right.toolName))

  const statusBridges = events
    .filter((event): event is Extract<OpenCodeToolContractRenderProjectionEvent, { type: "status.bridge" }> => event.type === "status.bridge")
    .map((event) => ({
      toolName: event.toolName,
      status: event.status,
      recordIDObserved: typeof event.recordID === "string" && event.recordID.length > 0,
      eventKeys: uniqueStrings(event.eventKeys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.toolName.localeCompare(right.toolName))

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-tool:contract-render-projection" as const,
    evidenceRef: "conformance:opencode-tool-contract-render-projection" as const,
    coveredBranchIDs: [
      "tool-schema-bridge",
      "permission-render",
      "result-render",
      "status-stream",
    ] as OpenCodeToolContractRenderProjection["coveredBranchIDs"],
    retainedFields: [
      "toolName",
      "schemaKeys",
      "requiredKeys",
      "permissionSubjectFieldObserved",
      "permissionID",
      "status",
      "renderKeys",
      "subjectObserved",
      "partKind",
      "outputKind",
      "metadataKeys",
      "recordIDObserved",
      "eventKeys",
      "sequence",
    ],
    lossyFields: [
      "native Parameters schema object identity",
      "schema validation diagnostic object identity",
      "permission render tree and UI timing",
      "permission render side effects",
      "tool result raw payload and message-v2 part identity",
      "status record ID and UI order",
      "wall-clock timing between permission/result/status events",
    ],
    schemas,
    permissionRenders,
    resultRenders,
    statusBridges,
    knownGaps: [
      "opencode-tool-contract-render-full-upstream-fixture-not-proven",
      "opencode-tool-schema-hidden-plugin-fields-not-exact",
      "opencode-permission-render-side-effects-not-exact",
      "opencode-tool-result-render-native-part-detail-not-exact",
      "opencode-tool-status-record-id-and-ui-order-not-exact",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeToolLiveRuntimeFixture(
  input: OpenCodeToolLiveRuntimeFixtureInput = {},
): OpenCodeToolLiveRuntimeFixture {
  const toolName = input.toolName ?? "bash"
  const pluginID = input.pluginID ?? "opencode.plugin:runtime"
  const permissionID = input.permissionID ?? "perm_bash_001"
  const command = input.command ?? "ls -la"
  const rawResultPayload = input.rawResultPayload ?? "total 0\n"
  const statusRecordID = input.statusRecordID ?? "status_tool_001"
  const workspacePolicy = input.workspacePolicy ?? "workspace-scoped"
  const schemaKeys = uniqueStrings(["command", "description", "timeout"])
  const requiredKeys = uniqueStrings(["command"])
  const renderKeys = uniqueStrings(["permissionID", "status", "subject", "toolName"])
  const metadataKeys = uniqueStrings(["exitCode", "toolCallID"])
  const statusEventKeys = uniqueStrings(["recordID", "status", "tool"])
  const fsSideEffectKeys = uniqueStrings(["path-policy", "watch", "write"])
  const cleanupKeys = uniqueStrings(["permission.ui", "tool.registry", "workspace.watch"])
  const schemaReadback: OpenCodeToolSchemaLiveReadback[] = [
    {
      toolName,
      schemaKeys,
      requiredKeys,
      permissionSubjectField: "command",
      schemaObjectHash: fingerprintObject({ toolName, schemaKeys, requiredKeys, permissionSubjectField: "command" }),
      pluginID,
      sequence: 1,
    },
  ]
  const permissionReadback: OpenCodeToolPermissionLiveReadback[] = [
    {
      toolName,
      permissionID,
      status: "ask",
      subject: command,
      renderKeys,
      requestOrder: 2,
      responseOrder: 3,
      uiSideEffectKeys: uniqueStrings(["permission-card", "permission-store", "response-event"]),
      sequence: 2,
    },
  ]
  const resultReadback: OpenCodeToolResultLiveReadback[] = [
    {
      toolName,
      partKind: "text",
      outputKind: "stdout",
      metadataKeys,
      messagePartID: "part_tool_001",
      rawPayloadHash: fingerprintObject({ rawResultPayload }),
      writebackRecordID: "tool-writeback-001",
      sequence: 3,
    },
  ]
  const statusReadback: OpenCodeToolStatusLiveReadback[] = [
    {
      toolName,
      status: "complete",
      recordID: statusRecordID,
      uiOrder: 4,
      eventKeys: statusEventKeys,
      sequence: 4,
    },
  ]
  const workspaceFSReadback: OpenCodeToolWorkspaceFSLiveReadback[] = [
    {
      operation: "write",
      pathKind: "file",
      policy: workspacePolicy,
      sideEffectKeys: fsSideEffectKeys,
      watchEventID: "watch_evt_tool_001",
      syscallHash: fingerprintObject({ operation: "write", pathKind: "file", policy: workspacePolicy, sideEffectKeys: fsSideEffectKeys }),
      sequence: 5,
    },
  ]
  const pluginLifecycleReadback: OpenCodeToolPluginLifecycleLiveReadback[] = [
    {
      pluginID,
      registeredToolNames: [toolName],
      disposeOrder: 6,
      reloadGeneration: 1,
      cleanupKeys,
      sequence: 6,
    },
  ]
  const toolRuntimeProjection = projectOpenCodeToolRuntimeProjection([
    {
      type: "plugin.tool",
      toolName,
      pluginID,
      schemaKeys,
      sequence: 1,
    },
    {
      type: "permission.ui",
      permissionID,
      status: "ask",
      subject: command,
      sequence: 2,
    },
    {
      type: "workspace.fs",
      operation: "write",
      pathKind: "file",
      policy: workspacePolicy,
      sideEffectKeys: fsSideEffectKeys,
      sequence: 5,
    },
  ])
  const toolContractRenderProjection = projectOpenCodeToolContractRenderProjection([
    {
      type: "schema",
      toolName,
      schemaKeys,
      requiredKeys,
      permissionSubjectField: "command",
      sequence: 1,
    },
    {
      type: "permission.render",
      toolName,
      permissionID,
      status: "ask",
      renderKeys,
      subject: command,
      sequence: 2,
    },
    {
      type: "result.render",
      toolName,
      partKind: "text",
      outputKind: "stdout",
      metadataKeys,
      sequence: 3,
    },
    {
      type: "status.bridge",
      toolName,
      status: "complete",
      recordID: statusRecordID,
      eventKeys: statusEventKeys,
      sequence: 4,
    },
  ])
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-tool-live-runtime-fixture" as const,
    fixtureID: "opencode-tool:live-runtime-fixture" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    fixtureDiffTarget: "tool.contract-envelope-replay" as const,
    relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay" as const],
    coveredBranchIDs: uniqueStrings([
      ...toolRuntimeProjection.coveredBranchIDs,
      ...toolContractRenderProjection.coveredBranchIDs,
    ]) as OpenCodeToolLiveRuntimeFixture["coveredBranchIDs"],
    schemaReadback,
    permissionReadback,
    resultReadback,
    statusReadback,
    workspaceFSReadback,
    pluginLifecycleReadback,
    toolRuntimeProjection,
    toolContractRenderProjection,
    retainedFields: [
      "tool schema key readback",
      "required parameter readback",
      "permission subject field readback",
      "permission UI request/response order readback",
      "permission render key readback",
      "tool result raw payload hash",
      "message-v2 part ID marker",
      "status record ID and UI order marker",
      "workspace filesystem policy and side-effect key readback",
      "plugin registration and dispose marker",
    ],
    lossyFields: [
      "real OpenCode plugin tool runtime execution",
      "native Parameters schema object identity",
      "permission UI render tree and wall-clock timing",
      "permission response race/order",
      "tool result raw payload object identity",
      "message-v2 part object identity",
      "status record ID allocation and UI order",
      "raw workspace filesystem contents",
      "filesystem watch ordering",
      "native syscall side effects",
      "plugin lifecycle dispose/reload ordering",
    ],
    knownGaps: [
      "opencode-tool-live-runtime-fixture-partial-native-gap",
      "opencode-live-plugin-tool-runtime-not-spawned",
      "opencode-permission-ui-side-effects-not-replayed",
      "opencode-workspace-filesystem-side-effects-not-exact",
      "opencode-tool-schema-hidden-plugin-fields-not-exact",
      "opencode-permission-render-side-effects-not-exact",
      "opencode-tool-result-render-native-part-detail-not-exact",
      "opencode-tool-status-record-id-and-ui-order-not-exact",
      "opencode-tool-message-v2-part-identity-not-exact",
      "opencode-tool-plugin-lifecycle-dispose-order-not-exact",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeToolLiveRuntimeFixture(
  fixture: OpenCodeToolLiveRuntimeFixture,
): OpenCodeToolLiveRuntimeFixtureVerification {
  const issues: OpenCodeToolLiveRuntimeFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== "opencode-tool:live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-tool-live-runtime-fixture") {
    addIssue("opencode-tool-live-runtime.identity", "OpenCode tool live runtime fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== false || fixture.exactDiffStatus !== "live-runtime-partial" || fixture.coverageStatus !== "partial") {
    addIssue("opencode-tool-live-runtime.native-claim", "OpenCode tool live runtime fixture must stay partial and cannot claim native parity.")
  }
  for (const branchID of ["tool-schema-bridge", "permission-render", "result-render", "status-stream", "live-plugin-tool-runtime", "permission-ui-side-effects", "exact-workspace-fs-side-effects"] as const) {
    if (!fixture.coveredBranchIDs.includes(branchID)) {
      addIssue("opencode-tool-live-runtime.missing-branch", `OpenCode tool live runtime fixture no longer covers ${branchID}.`)
    }
  }
  if (fixture.toolRuntimeProjection.fixtureID !== "opencode-tool:runtime-projection" || fixture.toolRuntimeProjection.evidenceRef !== "conformance:opencode-tool-runtime-projection") {
    addIssue("opencode-tool-live-runtime.runtime-projection", "OpenCode tool live runtime fixture lost the nested runtime projection identity.")
  }
  if (fixture.toolContractRenderProjection.fixtureID !== "opencode-tool:contract-render-projection" || fixture.toolContractRenderProjection.evidenceRef !== "conformance:opencode-tool-contract-render-projection") {
    addIssue("opencode-tool-live-runtime.contract-render-projection", "OpenCode tool live runtime fixture lost the nested contract render projection identity.")
  }
  const schema = fixture.schemaReadback.some((record) =>
    record.schemaObjectHash.length === 16 &&
    record.schemaKeys.includes("command") &&
    record.requiredKeys.includes("command") &&
    record.permissionSubjectField === "command" &&
    record.pluginID.length > 0,
  )
  if (!schema) {
    addIssue("opencode-tool-live-runtime.schema-readback", "OpenCode tool live runtime fixture must retain schema key, required key, permission subject, and schema hash readback.")
  }
  const permission = fixture.permissionReadback.some((record) =>
    record.status === "ask" &&
    record.permissionID.length > 0 &&
    record.subject.length > 0 &&
    record.renderKeys.includes("status") &&
    record.responseOrder >= record.requestOrder &&
    record.uiSideEffectKeys.includes("permission-store"),
  )
  if (!permission) {
    addIssue("opencode-tool-live-runtime.permission-readback", "OpenCode tool live runtime fixture must retain permission render and UI request/response readback.")
  }
  const result = fixture.resultReadback.some((record) =>
    record.rawPayloadHash.length === 16 &&
    record.messagePartID.length > 0 &&
    record.writebackRecordID.length > 0 &&
    record.metadataKeys.includes("toolCallID"),
  )
  if (!result) {
    addIssue("opencode-tool-live-runtime.result-readback", "OpenCode tool live runtime fixture must retain result payload hash, message part, writeback, and metadata readback.")
  }
  const status = fixture.statusReadback.some((record) =>
    record.recordID.length > 0 &&
    record.uiOrder > 0 &&
    record.eventKeys.includes("status") &&
    record.eventKeys.includes("tool"),
  )
  if (!status) {
    addIssue("opencode-tool-live-runtime.status-readback", "OpenCode tool live runtime fixture must retain status record and UI order readback.")
  }
  const workspaceFS = fixture.workspaceFSReadback.some((record) =>
    record.policy.length > 0 &&
    record.watchEventID.length > 0 &&
    record.syscallHash.length === 16 &&
    record.sideEffectKeys.includes("watch"),
  )
  if (!workspaceFS) {
    addIssue("opencode-tool-live-runtime.workspace-fs-readback", "OpenCode tool live runtime fixture must retain workspace filesystem policy, watch, and syscall hash readback.")
  }
  const pluginLifecycle = fixture.pluginLifecycleReadback.some((record) =>
    record.pluginID.length > 0 &&
    record.disposeOrder > 0 &&
    record.reloadGeneration > 0 &&
    record.registeredToolNames.length > 0 &&
    record.cleanupKeys.includes("tool.registry"),
  )
  if (!pluginLifecycle) {
    addIssue("opencode-tool-live-runtime.plugin-lifecycle-readback", "OpenCode tool live runtime fixture must retain plugin registration, cleanup, and dispose marker readback.")
  }
  for (const requiredGap of [
    "opencode-tool-live-runtime-fixture-partial-native-gap",
    "opencode-live-plugin-tool-runtime-not-spawned",
    "opencode-permission-ui-side-effects-not-replayed",
    "opencode-workspace-filesystem-side-effects-not-exact",
    "opencode-tool-schema-hidden-plugin-fields-not-exact",
    "opencode-tool-result-render-native-part-detail-not-exact",
    "opencode-tool-status-record-id-and-ui-order-not-exact",
    "opencode-tool-message-v2-part-identity-not-exact",
    "opencode-tool-plugin-lifecycle-dispose-order-not-exact",
  ]) {
    if (!fixture.knownGaps.includes(requiredGap)) {
      addIssue("opencode-tool-live-runtime.native-gaps", `OpenCode tool live runtime fixture no longer records ${requiredGap}.`)
    }
  }
  if (!fixture.retainedFields.includes("tool result raw payload hash") || !fixture.retainedFields.includes("plugin registration and dispose marker") || !fixture.lossyFields.some((field) => /native|identity|side effects/i.test(field))) {
    addIssue("opencode-tool-live-runtime.retained-lossy-fields", "OpenCode tool live runtime fixture must retain local readback keys and name native lossiness.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function openCodeToolSourceBranchAnchor(
  input: Omit<OpenCodeToolSourceMatrixBranchAnchor, "exactDiffStatus" | "nativeParityClaim" | "nativeEvidenceRefs" | "fixtureIDs"> &
    Partial<Pick<OpenCodeToolSourceMatrixBranchAnchor, "exactDiffStatus" | "nativeParityClaim" | "nativeEvidenceRefs" | "fixtureIDs">>,
): OpenCodeToolSourceMatrixBranchAnchor {
  return {
    ...input,
    exactDiffStatus: input.exactDiffStatus ?? (input.status === "native-exact" ? "native-exact" : "exact-diff-partial"),
    nativeParityClaim: input.nativeParityClaim ?? (input.status === "native-exact"),
    nativeEvidenceRefs: input.nativeEvidenceRefs ?? [],
    fixtureIDs: input.fixtureIDs ?? [],
  }
}

export function buildOpenCodeToolSourceMatrixSnapshot(): OpenCodeToolSourceMatrixSnapshot {
  const branchAnchors: OpenCodeToolSourceMatrixBranchAnchor[] = [
    openCodeToolSourceBranchAnchor({
      branchID: "tool-definition-plugin",
      status: "native-exact",
      sourceRefIDs: ["tool-core", "tool-registry", "plugin-core", "plugin-boot"],
      toolAtomIDs: ["opencode.tool.definition-plugin-bridge"],
      toolPortIDs: ["tool.definition", "tool.registry"],
      localEvidenceRefs: ["tool-port:tool.definition", "conformance:opencode-tool-definition-plugin-native-exact-fixture", "tool-definition-plugin-native-exact:opencode"],
      localMarkers: ["tool.definition hook bridge", "SessionTools", "PluginV2", "json-schema-override", "source-order-mutable-output"],
      nativeEvidenceRefs: ["conformance:opencode-tool-definition-plugin-native-exact-fixture", "tool-definition-plugin-native-exact:opencode"],
      fixtureIDs: ["opencode-tool-definition-plugin:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "tool-schema-bridge",
      status: "native-exact",
      sourceRefIDs: ["tool-core", "tool-bash", "tool-edit", "tool-task", "tool-todowrite", "tool-skill", "tool-registry"],
      toolAtomIDs: ["opencode.tool.schema-bridge"],
      toolPortIDs: ["tool.schema-adapter", "tools.schema"],
      localEvidenceRefs: ["opencode-tool-cadence:schema", "conformance:opencode-tool-schema-bridge-native-exact-fixture", "tool-schema-bridge-native-exact:opencode"],
      localMarkers: ["Parameters", "schema", "permissionSubjectField", "plugin-tool-schema", "legacy-json-schema", "zod-defs-renamed"],
      nativeEvidenceRefs: ["conformance:opencode-tool-schema-bridge-native-exact-fixture", "tool-schema-bridge-native-exact:opencode"],
      fixtureIDs: ["opencode-tool-schema-bridge:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "permission-ask-hook",
      status: "native-exact",
      sourceRefIDs: ["plugin-permission", "tool-core", "tool-bash", "tool-edit"],
      toolAtomIDs: ["opencode.permission.ask-bridge"],
      toolPortIDs: ["tool.permission-policy"],
      localEvidenceRefs: ["tool-port:tool.permission-policy", "conformance:opencode-plugin-permission-bridge-native-exact-fixture", "plugin-permission-bridge-native-exact:opencode"],
      localMarkers: ["permission.ask", "allow", "deny", "ask", "source-order-output-mutation"],
      nativeEvidenceRefs: ["conformance:opencode-plugin-permission-bridge-native-exact-fixture", "plugin-permission-bridge-native-exact:opencode"],
      fixtureIDs: ["opencode-plugin-permission-bridge:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "plugin-permission-bridge",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "plugin-boot", "plugin-permission"],
      toolAtomIDs: ["opencode.plugin.permission-bridge"],
      toolPortIDs: ["tool.permission-policy"],
      localEvidenceRefs: ["tool-port:tool.permission-policy", "conformance:opencode-plugin-permission-bridge-native-exact-fixture", "plugin-permission-bridge-native-exact:opencode"],
      localMarkers: ["permission.ask hook", "PluginBoot", "hook output status", "fail-fast-hook-error"],
      nativeEvidenceRefs: ["conformance:opencode-plugin-permission-bridge-native-exact-fixture", "plugin-permission-bridge-native-exact:opencode"],
      fixtureIDs: ["opencode-plugin-permission-bridge:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "plugin-tool-registry",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "plugin-boot", "tool-registry"],
      toolAtomIDs: ["opencode.plugin.registry-bridge"],
      toolPortIDs: ["tool.registry", "registry.tool"],
      localEvidenceRefs: ["current-module:opencode-tool-source-locations", "conformance:opencode-plugin-tool-registry-native-exact-fixture", "plugin-tool-registry-native-exact:opencode"],
      localMarkers: ["opencode.tool:", "plugin tool/provider/ui registries", "SessionTools", "source-scoped-tool-registration"],
      nativeEvidenceRefs: ["conformance:opencode-plugin-tool-registry-native-exact-fixture", "plugin-tool-registry-native-exact:opencode"],
      fixtureIDs: ["opencode-plugin-tool-registry:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "permission-render",
      status: "native-exact",
      sourceRefIDs: ["tool-core", "tool-bash", "tool-edit", "plugin-permission"],
      toolAtomIDs: ["opencode.tool.permission-render-bridge"],
      toolPortIDs: ["tool.executor", "tool.permission-policy"],
      localEvidenceRefs: ["opencode-tool-cadence:result-event-stream", "conformance:opencode-tool-permission-render-native-exact-fixture", "tool-permission-render-native-exact:opencode"],
      localMarkers: ["permissionDenied", "permission tool", "render", "corrected-error-message", "reply-body-shape"],
      nativeEvidenceRefs: ["conformance:opencode-tool-permission-render-native-exact-fixture", "tool-permission-render-native-exact:opencode"],
      fixtureIDs: ["opencode-tool-permission-render:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "result-render",
      status: "native-exact",
      sourceRefIDs: ["tool-core", "tool-bash", "tool-edit", "tool-task", "tool-todowrite", "plugin-core"],
      toolAtomIDs: ["opencode.tool.result-render-bridge"],
      toolPortIDs: ["tool.result-normalizer", "tools.result-projector"],
      localEvidenceRefs: ["opencode-tool-cadence:result-event-stream", "conformance:opencode-tool-result-render-native-exact-fixture", "tool-result-render-native-exact:opencode"],
      localMarkers: ["message-v2-tool-result-parts", "resultEnvelope", "tool.execute.after bridge", "source-order-shared-output", "nested-tool-result-text"],
      nativeEvidenceRefs: ["conformance:opencode-tool-result-render-native-exact-fixture", "tool-result-render-native-exact:opencode"],
      fixtureIDs: ["opencode-tool-result-render:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "status-stream",
      status: "native-exact",
      sourceRefIDs: ["tool-core", "session-tools", "session-processor", "message-v2", "error-util"],
      toolAtomIDs: ["opencode.tool.status-bridge"],
      toolPortIDs: ["tool.audit-log"],
      localEvidenceRefs: ["conformance:opencode-tool-status-native-exact-fixture", "opencode-tool-status:native-exact-fixture", "tool-status-native-exact:opencode"],
      localMarkers: ["ToolPart", "ToolStatePending", "ToolStateRunning", "ToolStateCompleted", "ToolStateError", "errorMessage"],
      nativeEvidenceRefs: ["conformance:opencode-tool-status-native-exact-fixture", "tool-status-native-exact:opencode"],
      fixtureIDs: ["opencode-tool-status:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "workspace-filesystem",
      status: "native-exact",
      sourceRefIDs: ["file-system", "tool-bash", "tool-edit", "tool-core"],
      toolAtomIDs: ["opencode.workspace-filesystem-bridge"],
      toolPortIDs: ["filesystem.port"],
      localEvidenceRefs: ["tool-port:filesystem.port", "conformance:opencode-workspace-filesystem-native-exact-fixture", "workspace-filesystem-native-exact:opencode"],
      localMarkers: ["workspace filesystem", "read", "write", "list", "watch", "project-scoped-custom-adapter-registration"],
      nativeEvidenceRefs: ["conformance:opencode-workspace-filesystem-native-exact-fixture", "workspace-filesystem-native-exact:opencode"],
      fixtureIDs: ["opencode-workspace-filesystem:native-exact-fixture"],
      knownGaps: [],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "live-plugin-tool-runtime",
      status: "partial",
      sourceRefIDs: ["plugin-core", "plugin-boot", "tool-registry", "local-tool-runtime-projection", "local-tool-live-runtime-fixture"],
      toolAtomIDs: ["opencode.tool.definition-plugin-bridge", "opencode.plugin.registry-bridge"],
      toolPortIDs: ["tool.definition", "tool.registry"],
      localEvidenceRefs: ["opencode-tool:source-matrix", "opencode-tool:runtime-projection", "opencode-tool:live-runtime-fixture"],
      localMarkers: ["plugin-tool-runtime:projected", "schema-keys:retained", "plugin-module-side-effects:not-exact", "plugin-lifecycle-readback:partial"],
      knownGaps: ["opencode-tool-live-runtime-fixture-partial-native-gap", "opencode-live-plugin-tool-runtime-not-spawned"],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "permission-ui-side-effects",
      status: "partial",
      sourceRefIDs: ["plugin-permission", "tool-core", "local-tool-runtime-projection", "local-tool-live-runtime-fixture"],
      toolAtomIDs: ["opencode.permission.ask-bridge", "opencode.plugin.permission-bridge", "opencode.tool.permission-render-bridge"],
      toolPortIDs: ["tool.permission-policy", "tool.executor"],
      localEvidenceRefs: ["opencode-tool-cadence:result-event-stream", "opencode-tool:runtime-projection", "opencode-tool:live-runtime-fixture"],
      localMarkers: ["permission-ui:projected", "approval-request-id:partial", "ui-response-order:not-exact", "permission-ui-readback:partial"],
      knownGaps: ["opencode-tool-live-runtime-fixture-partial-native-gap", "opencode-permission-ui-side-effects-not-replayed"],
    }),
    openCodeToolSourceBranchAnchor({
      branchID: "exact-workspace-fs-side-effects",
      status: "partial",
      sourceRefIDs: ["file-system", "tool-bash", "tool-edit", "local-tool-runtime-projection", "local-tool-live-runtime-fixture"],
      toolAtomIDs: ["opencode.workspace-filesystem-bridge"],
      toolPortIDs: ["filesystem.port"],
      localEvidenceRefs: ["opencode-tool:source-matrix", "opencode-tool:runtime-projection", "opencode-tool:live-runtime-fixture"],
      localMarkers: ["watch:projected", "path-policy:partial", "filesystem-side-effects:not-exact", "workspace-fs-readback:partial"],
      knownGaps: ["opencode-tool-live-runtime-fixture-partial-native-gap", "opencode-workspace-filesystem-side-effects-not-exact"],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-tool-source-matrix" as const,
    fixtureID: "opencode-tool:source-matrix" as const,
    sourceRefs: OPENCODE_TOOL_SOURCE_REFS,
    branchAnchors,
    nativeExactBranchIDs: branchAnchors.filter((anchor) => anchor.status === "native-exact").map((anchor) => anchor.branchID),
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredToolAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.toolAtomIDs)),
    coveredToolPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.toolPortIDs)),
    nativeEvidenceRefs: uniqueStrings([
      "conformance:opencode-tool-source-matrix",
      openCodeToolNativeExactEvidenceRef,
      openCodeToolNativeExactReplayRef,
      ...branchAnchors.flatMap((anchor) => anchor.nativeEvidenceRefs),
    ]),
    fixtureIDs: uniqueStrings([
      "opencode-tool:source-matrix",
      openCodeToolNativeExactFixtureID,
      ...branchAnchors.flatMap((anchor) => anchor.fixtureIDs),
    ]),
    knownGaps: uniqueStrings([
      "opencode-tool-source-matrix-covered-by-partial-fixture",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type ProductToolSourceMatrixProduct = "pi" | "nanobot" | "hermes"

export type ProductToolSourceMatrixBranchID =
  | "tool-definition-registry"
  | "tool-schema-bridge"
  | "permission-policy"
  | "executor-render"
  | "result-envelope"
  | "progress-audit-event"
  | "process-runner"
  | "workspace-filesystem"
  | "live-tool-runtime"
  | "permission-side-effects"
  | "exact-result-writeback"

export type ProductToolSourceMatrixBranchStatus = "partial" | "missing"

export interface ProductToolSourceRef {
  id: string
  product: ProductToolSourceMatrixProduct
  repo: string
  ref: string
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11"
}

export interface ProductToolSourceMatrixBranchAnchor {
  branchID: ProductToolSourceMatrixBranchID
  status: ProductToolSourceMatrixBranchStatus
  sourceRefIDs: string[]
  toolAtomIDs: string[]
  toolPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface ProductToolSourceMatrixSnapshot {
  schemaVersion: 1
  product: ProductToolSourceMatrixProduct
  upstreamRef: string
  pinnedRepo: string
  pinnedRef: string
  evidenceRef: string
  fixtureID: string
  sourceRefs: ProductToolSourceRef[]
  branchAnchors: ProductToolSourceMatrixBranchAnchor[]
  partialBranchIDs: ProductToolSourceMatrixBranchID[]
  missingBranchIDs: ProductToolSourceMatrixBranchID[]
  coveredToolAtomIDs: string[]
  coveredToolPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export type ToolContractEnvelopeReplayGateProduct = ToolCadenceReplayProduct
export type ToolContractEnvelopeReplayGateDimension =
  | "schema"
  | "permission-decision"
  | "denial-behavior"
  | "progress-event"
  | "result-envelope"
  | "session-writeback"

export interface ToolContractEnvelopeReplayGateCase {
  product: ToolContractEnvelopeReplayGateProduct
  upstreamRef: string
  evidenceRef: "conformance:tool-contract-envelope-replay-gate"
  fixtureID: string
  schemaShape: string[]
  permissionDecision: string[]
  denialBehavior: string[]
  progressEvent: string[]
  resultEnvelope: string[]
  sessionWriteback: string[]
  sourceAnchors: string[]
  toolAtomIDs: string[]
  toolPortIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  envelopeRisk: "source-anchored-partial" | "common-tool-only" | "lossy-field-drop" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface ToolContractEnvelopeReplayGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:tool-contract-envelope-replay-gate"
  fixtureID: "tool:contract-envelope-replay-gate"
  products: ToolContractEnvelopeReplayGateProduct[]
  comparisonDimensions: ToolContractEnvelopeReplayGateDimension[]
  cases: ToolContractEnvelopeReplayGateCase[]
  fingerprint: string
}

export interface ToolContractEnvelopeReplayGateIssue {
  id: string
  product: ToolContractEnvelopeReplayGateProduct
  dimension: ToolContractEnvelopeReplayGateDimension
  message: string
}

export interface ToolContractEnvelopeReplayGateVerification {
  ok: boolean
  issues: ToolContractEnvelopeReplayGateIssue[]
}

export type ToolContractEnvelopeExactDiffBlockerProduct = ToolContractEnvelopeReplayGateProduct
export type ToolContractEnvelopeExactDiffBlockerDimension = ToolContractEnvelopeReplayGateDimension

export interface ToolContractEnvelopeExactDiffBlockerCase {
  product: ToolContractEnvelopeExactDiffBlockerProduct
  upstreamRef: string
  evidenceRef: "conformance:tool-contract-envelope-exact-diff-blocker-gate"
  fixtureID: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  schemaShape: string[]
  permissionDecision: string[]
  denialBehavior: string[]
  progressEvent: string[]
  resultEnvelope: string[]
  sessionWriteback: string[]
  sourceAnchors: string[]
  toolAtomIDs: string[]
  toolPortIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "common-tool-only" | "lossy-field-drop" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface ToolContractEnvelopeExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:tool-contract-envelope-exact-diff-blocker-gate"
  fixtureID: "tool:contract-envelope-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: ToolContractEnvelopeExactDiffBlockerProduct[]
  comparisonDimensions: ToolContractEnvelopeExactDiffBlockerDimension[]
  cases: ToolContractEnvelopeExactDiffBlockerCase[]
  fingerprint: string
}

export interface ToolContractEnvelopeExactDiffBlockerIssue {
  id: string
  product: ToolContractEnvelopeExactDiffBlockerProduct
  dimension: ToolContractEnvelopeExactDiffBlockerDimension
  message: string
}

export interface ToolContractEnvelopeExactDiffBlockerVerification {
  ok: boolean
  issues: ToolContractEnvelopeExactDiffBlockerIssue[]
}

export type ToolContractEnvelopePinnedReplayProduct = ToolContractEnvelopeReplayGateProduct
export type ToolContractEnvelopePinnedReplayDimension = ToolContractEnvelopeReplayGateDimension

export interface ToolContractEnvelopePinnedReplayRecord {
  dimension: ToolContractEnvelopePinnedReplayDimension
  sequence: number
  fixtureCaseID: string
  toolName: string
  schemaFingerprint: string
  permissionDecision: "allow" | "ask" | "deny" | "guarded"
  denialResultID: string
  progressEventID: string
  resultEnvelopeID: string
  sessionWritebackID: string
  metadataKeys: string[]
  sourceAnchor: string
  sideEffectID: string
}

export interface ToolContractEnvelopePinnedReplayCase {
  product: ToolContractEnvelopePinnedReplayProduct
  upstreamRef: string
  evidenceRef: "conformance:tool-contract-envelope-pinned-replay-gate"
  fixtureID: "tool:contract-envelope-pinned-replay-gate"
  sourceFixtureID: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  upstreamEnvelopes: ToolContractEnvelopePinnedReplayRecord[]
  productReplayEnvelopes: ToolContractEnvelopePinnedReplayRecord[]
  assembledEnvelopes: ToolContractEnvelopePinnedReplayRecord[]
  sourceAnchors: string[]
  toolAtomIDs: string[]
  toolPortIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "pinned-envelope-replay-needs-live-tool-runtime" | "common-tool-only" | "lossy-field-drop" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface ToolContractEnvelopePinnedReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:tool-contract-envelope-pinned-replay-gate"
  fixtureID: "tool:contract-envelope-pinned-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: ToolContractEnvelopePinnedReplayProduct[]
  comparisonDimensions: ToolContractEnvelopePinnedReplayDimension[]
  cases: ToolContractEnvelopePinnedReplayCase[]
  fingerprint: string
}

export interface ToolContractEnvelopePinnedReplayIssue {
  id: string
  product: ToolContractEnvelopePinnedReplayProduct
  dimension: ToolContractEnvelopePinnedReplayDimension
  message: string
}

export interface ToolContractEnvelopePinnedReplayVerification {
  ok: boolean
  issues: ToolContractEnvelopePinnedReplayIssue[]
}

const PI_TOOL_SOURCE_REFS: ProductToolSourceRef[] = [
  {
    id: "core-tools",
    product: "pi",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/core/tools/index.ts",
    symbols: ["Tool", "ToolDef", "ToolName", "createToolDefinition", "createCodingToolDefinitions", "createAllTools"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-definition-wrapper",
    product: "pi",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/core/tools/tool-definition-wrapper.ts",
    symbols: ["wrapToolDefinition", "wrapToolDefinitions", "createToolDefinitionFromAgentTool"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "dynamic-tools-example",
    product: "pi",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/examples/extensions/dynamic-tools.ts",
    symbols: ["normalizeToolName", "dynamicToolsExtension"],
    evidence: "github-tree:2026-06-11",
  },
]

const NANOBOT_TOOL_SOURCE_REFS: ProductToolSourceRef[] = [
  {
    id: "tool-registry",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/agent/tools/registry.py",
    symbols: ["ToolRegistry", "register", "unregister", "get", "get_definitions", "prepare_call", "tool_names"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "filesystem-tools",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/agent/tools/filesystem.py",
    symbols: ["_FsTool", "ReadFileTool", "WriteFileTool", "EditFileTool", "ListDirTool", "_is_blocked_device"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "shell-tool",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/agent/tools/shell.py",
    symbols: ["ExecToolConfig", "ExecTool", "config_cls", "enabled", "create", "_guard_command", "_extract_absolute_paths"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-schema",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/agent/tools/schema.py",
    symbols: ["StringSchema", "IntegerSchema", "NumberSchema", "BooleanSchema", "ArraySchema", "ObjectSchema", "tool_parameters_schema"],
    evidence: "github-tree:2026-06-11",
  },
]

const HERMES_TOOL_SOURCE_REFS: ProductToolSourceRef[] = [
  {
    id: "tool-executor",
    product: "hermes",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/tool_executor.py",
    symbols: ["execute_tool_calls_concurrent", "_run_tool", "execute_tool_calls_sequential"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-dispatch",
    product: "hermes",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/tool_dispatch_helpers.py",
    symbols: ["_should_parallelize_tool_batch", "_extract_parallel_scope_path", "_paths_overlap", "_extract_file_mutation_targets", "make_tool_result_message"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-guardrails",
    product: "hermes",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/tool_guardrails.py",
    symbols: ["ToolCallGuardrailConfig", "ToolCallSignature", "ToolGuardrailDecision", "ToolCallGuardrailController", "canonical_tool_args", "classify_tool_failure", "toolguard_synthetic_result"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "tool-result-classification",
    product: "hermes",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/tool_result_classification.py",
    symbols: ["file_mutation_result_landed"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "acp-tools",
    product: "hermes",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "acp_adapter/tools.py",
    symbols: ["get_tool_kind", "make_tool_call_id", "build_tool_title", "build_tool_start", "build_tool_complete", "extract_locations"],
    evidence: "github-tree:2026-06-11",
  },
]

export function buildPiMonoToolSourceMatrixSnapshot(): ProductToolSourceMatrixSnapshot {
  return buildProductToolSourceMatrixSnapshot({
    product: "pi",
    upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    pinnedRepo: "earendil-works/pi",
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    evidenceRef: "conformance:pi-tool-source-matrix",
    fixtureID: "pi-tool:source-matrix",
    sourceRefs: PI_TOOL_SOURCE_REFS,
    atomIDs: {
      definition: ["pi.tool.register-tool-bridge", "pi.extension.dynamic-tool-bridge"],
      schema: ["pi.tool.typebox-bridge", "pi.extension.typebox-bridge"],
      permission: ["pi.permission.event-bridge"],
      executor: ["pi.tool.event-render-bridge"],
      result: ["pi.tool.result-event-bridge"],
      progress: ["pi.tool.runtime-event-bridge"],
      process: ["pi.process-runner-bridge"],
      workspace: ["pi.workspace-filesystem-bridge"],
    },
    sourceRefsByBranch: {
      definition: ["core-tools", "tool-definition-wrapper", "dynamic-tools-example"],
      schema: ["core-tools", "tool-definition-wrapper", "dynamic-tools-example"],
      permission: ["core-tools", "dynamic-tools-example"],
      executor: ["core-tools", "dynamic-tools-example"],
      result: ["core-tools", "tool-definition-wrapper"],
      progress: ["core-tools", "dynamic-tools-example"],
      process: ["core-tools"],
      workspace: ["core-tools"],
      missingRuntime: ["dynamic-tools-example", "core-tools"],
      missingPermission: ["dynamic-tools-example", "core-tools"],
      missingResult: ["core-tools", "tool-definition-wrapper"],
    },
    localEvidencePrefix: "pi-tool-cadence",
    localMarkers: {
      definition: ["Pi dynamic tool registry", "registerTool", "extension dynamic tool API"],
      schema: ["TypeBox", "tool-definition-wrapper", "parameter schema"],
      permission: ["permission event bridge", "extension permission events"],
      executor: ["tool event render", "extension tool execution"],
      result: ["tool result runtime event", "result envelope"],
      progress: ["runtime event bridge", "tool audit log"],
      process: ["node process runner bridge"],
      workspace: ["workspace filesystem bridge"],
    },
  })
}

export function buildNanobotToolSourceMatrixSnapshot(): ProductToolSourceMatrixSnapshot {
  return buildProductToolSourceMatrixSnapshot({
    product: "nanobot",
    upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    pinnedRepo: "HKUDS/nanobot",
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    evidenceRef: "conformance:nanobot-tool-source-matrix",
    fixtureID: "nanobot-tool:source-matrix",
    sourceRefs: NANOBOT_TOOL_SOURCE_REFS,
    atomIDs: {
      definition: ["nanobot.tool.definition-plugin-bridge", "nanobot.tool.registry-bridge"],
      schema: ["nanobot.tool.schema-bridge"],
      permission: ["nanobot.permission.policy-bridge"],
      executor: ["nanobot.tool.event-render-bridge"],
      result: ["nanobot.tool.result-event-bridge"],
      progress: ["nanobot.tool.progress-event-bridge"],
      process: ["nanobot.process-runner-bridge"],
      workspace: ["nanobot.workspace-filesystem-bridge"],
    },
    sourceRefsByBranch: {
      definition: ["tool-registry", "filesystem-tools", "shell-tool"],
      schema: ["tool-schema", "tool-registry"],
      permission: ["shell-tool", "filesystem-tools"],
      executor: ["tool-registry", "shell-tool", "filesystem-tools"],
      result: ["tool-registry", "filesystem-tools", "shell-tool"],
      progress: ["tool-registry", "shell-tool"],
      process: ["shell-tool"],
      workspace: ["filesystem-tools", "shell-tool"],
      missingRuntime: ["tool-registry", "shell-tool"],
      missingPermission: ["shell-tool", "filesystem-tools"],
      missingResult: ["tool-registry", "filesystem-tools"],
    },
    localEvidencePrefix: "nanobot-tool-cadence",
    localMarkers: {
      definition: ["ToolRegistry", "get_definitions", "prepare_call"],
      schema: ["tool_parameters_schema", "ObjectSchema"],
      permission: ["sandbox policy", "guard command", "workspace restrictions"],
      executor: ["tool event render", "prepared call"],
      result: ["tool result event", "filesystem/shell envelope"],
      progress: ["progress event bridge", "tool audit log"],
      process: ["ExecTool", "process runner bridge"],
      workspace: ["ReadFileTool", "WriteFileTool", "EditFileTool", "ListDirTool"],
    },
  })
}

export function buildHermesAgentToolSourceMatrixSnapshot(): ProductToolSourceMatrixSnapshot {
  return buildProductToolSourceMatrixSnapshot({
    product: "hermes",
    upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
    pinnedRepo: "NousResearch/hermes-agent",
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    evidenceRef: "conformance:hermes-tool-source-matrix",
    fixtureID: "hermes-tool:source-matrix",
    sourceRefs: HERMES_TOOL_SOURCE_REFS,
    atomIDs: {
      definition: ["hermes.tool.definition-registry-bridge", "hermes.tool.registry-bridge"],
      schema: ["hermes.tool.schema-bridge"],
      permission: ["hermes.permission.hook-bridge", "hermes.tool.permission-render-bridge"],
      executor: ["hermes.tool.permission-render-bridge"],
      result: ["hermes.tool.result-event-bridge"],
      progress: ["hermes.tool.progress-event-bridge"],
      process: ["hermes.process-runner-bridge"],
      workspace: ["hermes.workspace-filesystem-bridge"],
    },
    sourceRefsByBranch: {
      definition: ["acp-tools", "tool-dispatch", "tool-executor"],
      schema: ["acp-tools", "tool-guardrails"],
      permission: ["tool-guardrails", "tool-dispatch"],
      executor: ["tool-executor", "tool-dispatch", "tool-guardrails"],
      result: ["tool-dispatch", "tool-result-classification", "acp-tools"],
      progress: ["acp-tools", "tool-executor"],
      process: ["tool-executor", "tool-dispatch"],
      workspace: ["tool-dispatch", "tool-result-classification"],
      missingRuntime: ["tool-executor", "tool-dispatch"],
      missingPermission: ["tool-guardrails"],
      missingResult: ["tool-dispatch", "tool-result-classification", "acp-tools"],
    },
    localEvidencePrefix: "hermes-tool-cadence",
    localMarkers: {
      definition: ["ACP tools", "tool registry schema/dispatch bridge"],
      schema: ["tool guardrail canonical args", "ACP tool kind"],
      permission: ["ToolCallGuardrailDecision", "permission hook bridge"],
      executor: ["execute_tool_calls_concurrent", "_run_tool"],
      result: ["make_tool_result_message", "file_mutation_result_landed"],
      progress: ["build_tool_start", "build_tool_complete"],
      process: ["tool executor subprocess bridge"],
      workspace: ["file mutation targets", "workspace filesystem bridge"],
    },
  })
}

interface ProductToolSourceMatrixInput {
  product: ProductToolSourceMatrixProduct
  upstreamRef: string
  pinnedRepo: string
  pinnedRef: string
  evidenceRef: string
  fixtureID: string
  sourceRefs: ProductToolSourceRef[]
  atomIDs: Record<"definition" | "schema" | "permission" | "executor" | "result" | "progress" | "process" | "workspace", string[]>
  sourceRefsByBranch: Record<"definition" | "schema" | "permission" | "executor" | "result" | "progress" | "process" | "workspace" | "missingRuntime" | "missingPermission" | "missingResult", string[]>
  localEvidencePrefix: string
  localMarkers: Record<"definition" | "schema" | "permission" | "executor" | "result" | "progress" | "process" | "workspace", string[]>
}

function buildProductToolSourceMatrixSnapshot(input: ProductToolSourceMatrixInput): ProductToolSourceMatrixSnapshot {
  const prefix = input.product
  const branchAnchors: ProductToolSourceMatrixBranchAnchor[] = [
    productToolSourceBranchAnchor({
      branchID: "tool-definition-registry",
      status: "partial",
      sourceRefIDs: input.sourceRefsByBranch.definition,
      toolAtomIDs: input.atomIDs.definition,
      toolPortIDs: ["tool.definition", "tool.registry"],
      localEvidenceRefs: [`${input.localEvidencePrefix}:schema`, "tool-port:tool.definition"],
      localMarkers: input.localMarkers.definition,
      knownGaps: [`${prefix}-tool-definition-registry-live-runtime-not-replayed`],
    }),
    productToolSourceBranchAnchor({
      branchID: "tool-schema-bridge",
      status: "partial",
      sourceRefIDs: input.sourceRefsByBranch.schema,
      toolAtomIDs: input.atomIDs.schema,
      toolPortIDs: ["tool.schema-adapter", "tools.schema"],
      localEvidenceRefs: [`${input.localEvidencePrefix}:schema`, `tool-cadence-replay:${productCadenceID(prefix)}:schema`],
      localMarkers: input.localMarkers.schema,
      knownGaps: [`${prefix}-tool-schema-product-defaults-not-exact`],
    }),
    productToolSourceBranchAnchor({
      branchID: "permission-policy",
      status: "partial",
      sourceRefIDs: input.sourceRefsByBranch.permission,
      toolAtomIDs: input.atomIDs.permission,
      toolPortIDs: ["tool.permission-policy"],
      localEvidenceRefs: [`${input.localEvidencePrefix}:result-event-stream`, "tool-port:tool.permission-policy"],
      localMarkers: input.localMarkers.permission,
      knownGaps: [`${prefix}-tool-permission-side-effects-not-replayed`],
    }),
    productToolSourceBranchAnchor({
      branchID: "executor-render",
      status: "partial",
      sourceRefIDs: input.sourceRefsByBranch.executor,
      toolAtomIDs: input.atomIDs.executor,
      toolPortIDs: ["tool.executor"],
      localEvidenceRefs: [`${input.localEvidencePrefix}:result-envelope-roundtrip`, "tool-port:tool.executor"],
      localMarkers: input.localMarkers.executor,
      knownGaps: [`${prefix}-tool-executor-live-side-effects-not-exact`],
    }),
    productToolSourceBranchAnchor({
      branchID: "result-envelope",
      status: "partial",
      sourceRefIDs: input.sourceRefsByBranch.result,
      toolAtomIDs: input.atomIDs.result,
      toolPortIDs: ["tool.result-normalizer", "tools.result-projector"],
      localEvidenceRefs: [`${input.localEvidencePrefix}:result-event-stream`, `${input.localEvidencePrefix}:result-envelope-roundtrip`],
      localMarkers: input.localMarkers.result,
      knownGaps: [`${prefix}-tool-result-envelope-native-fields-not-exact`],
    }),
    productToolSourceBranchAnchor({
      branchID: "progress-audit-event",
      status: "partial",
      sourceRefIDs: input.sourceRefsByBranch.progress,
      toolAtomIDs: input.atomIDs.progress,
      toolPortIDs: ["tool.audit-log"],
      localEvidenceRefs: [`${input.localEvidencePrefix}:result-writeback-timing`, `tool-result-writeback-timing:${productCadenceID(prefix)}`],
      localMarkers: input.localMarkers.progress,
      knownGaps: [`${prefix}-tool-progress-event-id-and-order-not-exact`],
    }),
    productToolSourceBranchAnchor({
      branchID: "process-runner",
      status: "partial",
      sourceRefIDs: input.sourceRefsByBranch.process,
      toolAtomIDs: input.atomIDs.process,
      toolPortIDs: ["process-runner.port"],
      localEvidenceRefs: ["tool-port:process-runner.port", `${input.localEvidencePrefix}:result-envelope-roundtrip`],
      localMarkers: input.localMarkers.process,
      knownGaps: [`${prefix}-process-runner-side-effects-not-exact`],
    }),
    productToolSourceBranchAnchor({
      branchID: "workspace-filesystem",
      status: "partial",
      sourceRefIDs: input.sourceRefsByBranch.workspace,
      toolAtomIDs: input.atomIDs.workspace,
      toolPortIDs: ["filesystem.port"],
      localEvidenceRefs: ["tool-port:filesystem.port", `${input.localEvidencePrefix}:result-envelope-roundtrip`],
      localMarkers: input.localMarkers.workspace,
      knownGaps: [`${prefix}-workspace-filesystem-side-effects-not-exact`],
    }),
    productToolSourceBranchAnchor({
      branchID: "live-tool-runtime",
      status: "missing",
      sourceRefIDs: input.sourceRefsByBranch.missingRuntime,
      toolAtomIDs: uniqueStrings([...input.atomIDs.definition, ...input.atomIDs.executor, ...input.atomIDs.process]),
      toolPortIDs: ["tool.definition", "tool.executor", "process-runner.port"],
      localEvidenceRefs: [input.fixtureID],
      localMarkers: ["source-anchored-only"],
      knownGaps: [`${prefix}-live-tool-runtime-not-spawned`],
    }),
    productToolSourceBranchAnchor({
      branchID: "permission-side-effects",
      status: "missing",
      sourceRefIDs: input.sourceRefsByBranch.missingPermission,
      toolAtomIDs: input.atomIDs.permission,
      toolPortIDs: ["tool.permission-policy"],
      localEvidenceRefs: [`${input.localEvidencePrefix}:result-event-stream`],
      localMarkers: ["permission-side-effects:not-replayed"],
      knownGaps: [`${prefix}-permission-side-effects-not-replayed`],
    }),
    productToolSourceBranchAnchor({
      branchID: "exact-result-writeback",
      status: "missing",
      sourceRefIDs: input.sourceRefsByBranch.missingResult,
      toolAtomIDs: uniqueStrings([...input.atomIDs.result, ...input.atomIDs.progress, ...input.atomIDs.workspace]),
      toolPortIDs: ["tool.result-normalizer", "tool.audit-log", "filesystem.port"],
      localEvidenceRefs: [`${input.localEvidencePrefix}:result-writeback-timing`],
      localMarkers: ["record-id:not-exact", "native-side-effects:not-exact"],
      knownGaps: [`${prefix}-exact-result-writeback-not-replayed`],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: input.product,
    upstreamRef: input.upstreamRef,
    pinnedRepo: input.pinnedRepo,
    pinnedRef: input.pinnedRef,
    evidenceRef: input.evidenceRef,
    fixtureID: input.fixtureID,
    sourceRefs: input.sourceRefs,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredToolAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.toolAtomIDs)),
    coveredToolPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.toolPortIDs)),
    knownGaps: uniqueStrings([
      `${prefix}-tool-source-matrix-covered-by-partial-fixture`,
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

function productToolSourceBranchAnchor(input: ProductToolSourceMatrixBranchAnchor): ProductToolSourceMatrixBranchAnchor {
  return input
}

function productCadenceID(product: ProductToolSourceMatrixProduct): string {
  if (product === "pi") return "pi-mono"
  if (product === "hermes") return "hermes-agent"
  return product
}

export function buildToolContractEnvelopeReplayGateSnapshot(): ToolContractEnvelopeReplayGateSnapshot {
  const cases = [
    buildOpenCodeToolContractEnvelopeReplayGateCase(buildOpenCodeToolSourceMatrixSnapshot(), buildToolCadenceReplaySnapshot("opencode")),
    buildProductToolContractEnvelopeReplayGateCase("pi-mono", buildPiMonoToolSourceMatrixSnapshot(), buildToolCadenceReplaySnapshot("pi-mono")),
    buildProductToolContractEnvelopeReplayGateCase("nanobot", buildNanobotToolSourceMatrixSnapshot(), buildToolCadenceReplaySnapshot("nanobot")),
    buildProductToolContractEnvelopeReplayGateCase("hermes-agent", buildHermesAgentToolSourceMatrixSnapshot(), buildToolCadenceReplaySnapshot("hermes-agent")),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:tool-contract-envelope-replay-gate" as const,
    fixtureID: "tool:contract-envelope-replay-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: [
      "schema",
      "permission-decision",
      "denial-behavior",
      "progress-event",
      "result-envelope",
      "session-writeback",
    ] as ToolContractEnvelopeReplayGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyToolContractEnvelopeReplayGateSnapshot(snapshot: ToolContractEnvelopeReplayGateSnapshot): ToolContractEnvelopeReplayGateVerification {
  const issues: ToolContractEnvelopeReplayGateIssue[] = []
  const products: ToolContractEnvelopeReplayGateProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "tool-contract.missing-product",
        product,
        dimension: "schema",
        message: `Missing tool contract envelope replay gate case for ${product}.`,
      })
      continue
    }
    if (!toolGateContains(item.schemaShape, /schema|typebox|parameters|tool\.definition|registry|Tool|ObjectSchema|canonical|alias|required|permissionSubjectField|tool-schema/i)) {
      issues.push({
        id: "tool-contract.schema",
        product,
        dimension: "schema",
        message: `${product} tool contract gate no longer records tool schema anchors.`,
      })
    }
    if (!toolGateContains(item.permissionDecision, /permission|allow|deny|ask|policy|guard|approval|sandbox|hook|denied|ToolCallGuardrailDecision/i)) {
      issues.push({
        id: "tool-contract.permission-decision",
        product,
        dimension: "permission-decision",
        message: `${product} tool contract gate no longer records permission decision anchors.`,
      })
    }
    if (!toolGateContains(item.denialBehavior, /denied|error|permission|policy|reject|guard|synthetic|tool-result-error|permissionDenied/i)) {
      issues.push({
        id: "tool-contract.denial-behavior",
        product,
        dimension: "denial-behavior",
        message: `${product} tool contract gate no longer records denial behavior anchors.`,
      })
    }
    if (!toolGateContains(item.progressEvent, /progress|status|audit|event|start|complete|partial|running|tool\.start|tool\.progress|build_tool/i)) {
      issues.push({
        id: "tool-contract.progress-event",
        product,
        dimension: "progress-event",
        message: `${product} tool contract gate no longer records progress event anchors.`,
      })
    }
    if (!toolGateContains(item.resultEnvelope, /result|envelope|stdout|stderr|text|json|error|metadata|roundtrip|part|readback|make_tool_result/i)) {
      issues.push({
        id: "tool-contract.result-envelope",
        product,
        dimension: "result-envelope",
        message: `${product} tool contract gate no longer records result envelope anchors.`,
      })
    }
    if (!toolGateContains(item.sessionWriteback, /writeback|session|record|message|part|metadata|timing|native|write|tool-result-record|session\.write/i)) {
      issues.push({
        id: "tool-contract.session-writeback",
        product,
        dimension: "session-writeback",
        message: `${product} tool contract gate no longer records session writeback anchors.`,
      })
    }
    if (item.fixtureIDs.length < 5 || !toolGateContains(item.fixtureIDs, /source-matrix|tool-cadence|result-event-stream|result-envelope-roundtrip|result-writeback-timing/i)) {
      issues.push({
        id: "tool-contract.fixture-coverage",
        product,
        dimension: "result-envelope",
        message: `${product} tool contract gate no longer links source matrix, cadence, result event, envelope and writeback fixtures.`,
      })
    }
    if (
      product === "opencode" &&
      (!toolIncludesAll(item.nativeEvidenceRefs, [openCodeToolNativeExactEvidenceRef, openCodeToolNativeExactReplayRef]) ||
        !item.fixtureIDs.includes(openCodeToolNativeExactFixtureID))
    ) {
      issues.push({
        id: "tool-contract.native-exact-evidence",
        product,
        dimension: "schema",
        message: "OpenCode tool contract gate no longer carries the consolidated native exact tool fixture evidence.",
      })
    }
    if (!toolGateContains(item.knownLossiness, /not-exact|not-replayed|not-spawned|partial|lossy|not-proven|side-effect|side-effects/i)) {
      issues.push({
        id: "tool-contract.runtime-lossiness",
        product,
        dimension: "result-envelope",
        message: `${product} tool contract gate no longer records partial replay lossiness.`,
      })
    }
    if (item.envelopeRisk !== "source-anchored-partial") {
      issues.push({
        id: "tool-contract.common-tool-only",
        product,
        dimension: "result-envelope",
        message: `${product} tool contract gate is not source anchored and cannot be promoted toward native parity.`,
      })
    }
    if (product !== "opencode" && (item.fixtureID === "opencode-tool:source-matrix" || item.envelopeRisk === "borrowed-opencode")) {
      issues.push({
        id: "tool-contract.borrowed-source-matrix",
        product,
        dimension: "schema",
        message: `${product} tool contract gate is borrowing the OpenCode source matrix.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildToolContractEnvelopeExactDiffBlockerSnapshot(): ToolContractEnvelopeExactDiffBlockerSnapshot {
  const replayGate = buildToolContractEnvelopeReplayGateSnapshot()
  const cases = replayGate.cases.map(buildToolContractEnvelopeExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:tool-contract-envelope-exact-diff-blocker-gate" as const,
    fixtureID: "tool:contract-envelope-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: replayGate.comparisonDimensions as ToolContractEnvelopeExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildToolContractEnvelopePinnedReplaySnapshot(): ToolContractEnvelopePinnedReplaySnapshot {
  const replayGate = buildToolContractEnvelopeReplayGateSnapshot()
  const cases = replayGate.cases.map(buildToolContractEnvelopePinnedReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:tool-contract-envelope-pinned-replay-gate" as const,
    fixtureID: "tool:contract-envelope-pinned-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: replayGate.comparisonDimensions as ToolContractEnvelopePinnedReplayDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyToolContractEnvelopeExactDiffBlockerSnapshot(
  snapshot: ToolContractEnvelopeExactDiffBlockerSnapshot,
): ToolContractEnvelopeExactDiffBlockerVerification {
  const issues: ToolContractEnvelopeExactDiffBlockerIssue[] = []
  const products: ToolContractEnvelopeExactDiffBlockerProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "tool-contract-exact-diff.missing-product",
        product,
        dimension: "schema",
        message: `Missing tool contract exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "tool-contract-exact-diff.native-claim",
        product,
        dimension: "schema",
        message: `${product} tool contract blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!toolGateContains(item.schemaShape, /schema|typebox|parameters|tool\.definition|registry|Tool|ObjectSchema|canonical|alias|required|permissionSubjectField|tool-schema|exact-diff-not-proven/i)) {
      issues.push({
        id: "tool-contract-exact-diff.schema",
        product,
        dimension: "schema",
        message: `${product} tool contract blocker no longer records schema exact-diff anchors.`,
      })
    }
    if (!toolGateContains(item.permissionDecision, /permission|allow|deny|ask|policy|guard|approval|sandbox|hook|denied|ToolCallGuardrailDecision|exact-diff-not-proven/i)) {
      issues.push({
        id: "tool-contract-exact-diff.permission-decision",
        product,
        dimension: "permission-decision",
        message: `${product} tool contract blocker no longer records permission decision exact-diff anchors.`,
      })
    }
    if (!toolGateContains(item.denialBehavior, /denied|error|permission|policy|reject|guard|synthetic|tool-result-error|permissionDenied|exact-diff-not-proven/i)) {
      issues.push({
        id: "tool-contract-exact-diff.denial-behavior",
        product,
        dimension: "denial-behavior",
        message: `${product} tool contract blocker no longer records denial behavior exact-diff anchors.`,
      })
    }
    if (!toolGateContains(item.progressEvent, /progress|status|audit|event|start|complete|partial|running|tool\.start|tool\.progress|build_tool|exact-diff-not-proven/i)) {
      issues.push({
        id: "tool-contract-exact-diff.progress-event",
        product,
        dimension: "progress-event",
        message: `${product} tool contract blocker no longer records progress event exact-diff anchors.`,
      })
    }
    if (!toolGateContains(item.resultEnvelope, /result|envelope|stdout|stderr|text|json|error|metadata|roundtrip|part|readback|make_tool_result|exact-diff-not-proven/i)) {
      issues.push({
        id: "tool-contract-exact-diff.result-envelope",
        product,
        dimension: "result-envelope",
        message: `${product} tool contract blocker no longer records result envelope exact-diff anchors.`,
      })
    }
    if (!toolGateContains(item.sessionWriteback, /writeback|session|record|message|part|metadata|timing|native|write|tool-result-record|session\.write|exact-diff-not-proven/i)) {
      issues.push({
        id: "tool-contract-exact-diff.session-writeback",
        product,
        dimension: "session-writeback",
        message: `${product} tool contract blocker no longer records session writeback exact-diff anchors.`,
      })
    }
    if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.sourceAnchors.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "tool-contract-exact-diff.assembled-inferred-only",
        product,
        dimension: "result-envelope",
        message: `${product} tool contract blocker is not anchored to product-specific partial replay evidence.`,
      })
    }
    if (product !== "opencode" && (item.fixtureID === "opencode-tool:source-matrix" || item.exactDiffRisk === "borrowed-opencode" || toolGateContains(item.fixtureIDs, /^opencode-tool:source-matrix$/))) {
      issues.push({
        id: "tool-contract-exact-diff.borrowed-source-matrix",
        product,
        dimension: "schema",
        message: `${product} tool contract blocker is borrowing the OpenCode source matrix.`,
      })
    }
    if (
      product === "opencode" &&
      (!toolIncludesAll(item.nativeEvidenceRefs, [openCodeToolNativeExactEvidenceRef, openCodeToolNativeExactReplayRef]) ||
        !item.fixtureIDs.includes(openCodeToolNativeExactFixtureID))
    ) {
      issues.push({
        id: "tool-contract-exact-diff.native-exact-evidence",
        product,
        dimension: "schema",
        message: "OpenCode tool contract exact-diff blocker no longer carries the consolidated native exact tool fixture evidence.",
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyToolContractEnvelopePinnedReplaySnapshot(
  snapshot: ToolContractEnvelopePinnedReplaySnapshot,
): ToolContractEnvelopePinnedReplayVerification {
  const issues: ToolContractEnvelopePinnedReplayIssue[] = []
  const products: ToolContractEnvelopePinnedReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  const dimensions: ToolContractEnvelopePinnedReplayDimension[] = [
    "schema",
    "permission-decision",
    "denial-behavior",
    "progress-event",
    "result-envelope",
    "session-writeback",
  ]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "tool-contract-pinned-replay.missing-product",
        product,
        dimension: "schema",
        message: `Missing tool contract pinned replay case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "tool-contract-pinned-replay.native-claim",
        product,
        dimension: "schema",
        message: `${product} tool contract pinned replay must remain partial and cannot claim native parity.`,
      })
    }
    if (!toolPinnedReplayOrderMatches(item.upstreamEnvelopes) || !toolPinnedReplayOrderMatches(item.productReplayEnvelopes) || !toolPinnedReplayOrderMatches(item.assembledEnvelopes)) {
      issues.push({
        id: "tool-contract-pinned-replay.progress-event",
        product,
        dimension: "progress-event",
        message: `${product} tool contract pinned replay no longer preserves envelope event order.`,
      })
    }
    for (const dimension of dimensions) {
      const upstream = toolPinnedReplayEnvelope(item.upstreamEnvelopes, dimension)
      const productReplay = toolPinnedReplayEnvelope(item.productReplayEnvelopes, dimension)
      const assembled = toolPinnedReplayEnvelope(item.assembledEnvelopes, dimension)
      if (!upstream || !productReplay || !assembled || !toolPinnedReplayRecordMatches(upstream, productReplay) || !toolPinnedReplayRecordMatches(upstream, assembled)) {
        issues.push({
          id: `tool-contract-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} tool contract pinned replay ${dimension} fixture drifted from the upstream envelope sample.`,
        })
      }
    }
    if (item.exactDiffRisk !== "pinned-envelope-replay-needs-live-tool-runtime" || !toolGateContains(item.knownLossiness, /pinned-envelope-replay|live-tool-runtime-not-proven|not-exact|not-replayed|partial|lossy/i)) {
      issues.push({
        id: "tool-contract-pinned-replay.common-tool-only",
        product,
        dimension: "result-envelope",
        message: `${product} tool contract pinned replay is no longer anchored as partial replay that still needs live tool runtime proof.`,
      })
    }
    if (product !== "opencode" && (item.sourceFixtureID === "opencode-tool:source-matrix" || item.exactDiffRisk === "borrowed-opencode" || toolGateContains(item.fixtureIDs, /^opencode-tool:source-matrix$/))) {
      issues.push({
        id: "tool-contract-pinned-replay.borrowed-source-matrix",
        product,
        dimension: "schema",
        message: `${product} tool contract pinned replay is borrowing the OpenCode source matrix.`,
      })
    }
    if (item.sourceAnchors.length === 0 || item.fixtureIDs.length < 5 || item.nativeEvidenceRefs.length === 0) {
      issues.push({
        id: "tool-contract-pinned-replay.missing-evidence",
        product,
        dimension: "result-envelope",
        message: `${product} tool contract pinned replay lost source anchors, fixture IDs, or native evidence refs.`,
      })
    }
    if (
      product === "opencode" &&
      (!toolIncludesAll(item.nativeEvidenceRefs, [openCodeToolNativeExactEvidenceRef, openCodeToolNativeExactReplayRef]) ||
        !item.fixtureIDs.includes(openCodeToolNativeExactFixtureID))
    ) {
      issues.push({
        id: "tool-contract-pinned-replay.native-exact-evidence",
        product,
        dimension: "schema",
        message: "OpenCode tool contract pinned replay no longer carries the consolidated native exact tool fixture evidence.",
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildToolContractEnvelopeExactDiffBlockerCase(
  replayCase: ToolContractEnvelopeReplayGateCase,
): ToolContractEnvelopeExactDiffBlockerCase {
  return {
    product: replayCase.product,
    upstreamRef: replayCase.upstreamRef,
    evidenceRef: "conformance:tool-contract-envelope-exact-diff-blocker-gate",
    fixtureID: replayCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    schemaShape: uniqueStrings([
      ...replayCase.schemaShape,
      "tool-schema-native-registry:exact-diff-not-proven",
    ]),
    permissionDecision: uniqueStrings([
      ...replayCase.permissionDecision,
      "permission-decision-native-side-effects:exact-diff-not-proven",
    ]),
    denialBehavior: uniqueStrings([
      ...replayCase.denialBehavior,
      "denial-behavior-native-ui-hook:exact-diff-not-proven",
    ]),
    progressEvent: uniqueStrings([
      ...replayCase.progressEvent,
      "progress-event-native-order:exact-diff-not-proven",
    ]),
    resultEnvelope: uniqueStrings([
      ...replayCase.resultEnvelope,
      "result-envelope-native-fields:exact-diff-not-proven",
    ]),
    sessionWriteback: uniqueStrings([
      ...replayCase.sessionWriteback,
      "session-writeback-native-record-id:exact-diff-not-proven",
    ]),
    sourceAnchors: replayCase.sourceAnchors,
    toolAtomIDs: replayCase.toolAtomIDs,
    toolPortIDs: replayCase.toolPortIDs,
    fixtureIDs: uniqueStrings(["tool:contract-envelope-replay-gate", ...replayCase.fixtureIDs]),
    nativeEvidenceRefs: uniqueStrings([
      ...replayCase.sourceAnchors,
      ...replayCase.fixtureIDs,
      ...replayCase.nativeEvidenceRefs,
    ]),
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...replayCase.knownLossiness,
      "tool-schema-native-registry-not-proven",
      "permission-decision-native-side-effects-not-proven",
      "denial-behavior-native-ui-hook-not-proven",
      "progress-event-native-order-not-proven",
      "result-envelope-native-fields-not-proven",
      "session-writeback-native-record-id-not-proven",
    ]),
  }
}

function buildToolContractEnvelopePinnedReplayCase(
  replayCase: ToolContractEnvelopeReplayGateCase,
): ToolContractEnvelopePinnedReplayCase {
  const records = toolContractEnvelopePinnedReplayRecords(replayCase.product)
  return {
    product: replayCase.product,
    upstreamRef: replayCase.upstreamRef,
    evidenceRef: "conformance:tool-contract-envelope-pinned-replay-gate",
    fixtureID: "tool:contract-envelope-pinned-replay-gate",
    sourceFixtureID: replayCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    upstreamEnvelopes: records.map(toolPinnedReplayRecordClone),
    productReplayEnvelopes: records.map(toolPinnedReplayRecordClone),
    assembledEnvelopes: records.map(toolPinnedReplayRecordClone),
    sourceAnchors: replayCase.sourceAnchors,
    toolAtomIDs: replayCase.toolAtomIDs,
    toolPortIDs: replayCase.toolPortIDs,
    fixtureIDs: uniqueStrings(["tool:contract-envelope-replay-gate", ...replayCase.fixtureIDs]),
    nativeEvidenceRefs: uniqueStrings([
      replayCase.fixtureID,
      ...replayCase.sourceAnchors,
      ...replayCase.fixtureIDs,
      ...replayCase.nativeEvidenceRefs,
      ...records.map((record) => record.sourceAnchor),
      ...records.map((record) => record.sideEffectID),
    ]),
    exactDiffRisk: "pinned-envelope-replay-needs-live-tool-runtime",
    knownLossiness: uniqueStrings([
      ...replayCase.knownLossiness,
      "tool-contract-pinned-envelope-replay-live-tool-runtime-not-proven",
      "tool-contract-pinned-permission-ui-side-effects-not-proven",
      "tool-contract-pinned-progress-order-not-proven",
      "tool-contract-pinned-result-envelope-native-fields-not-proven",
      "tool-contract-pinned-session-writeback-record-id-not-proven",
    ]),
  }
}

function buildOpenCodeToolContractEnvelopeReplayGateCase(
  sourceMatrix: OpenCodeToolSourceMatrixSnapshot,
  cadence: ToolCadenceReplaySnapshot,
): ToolContractEnvelopeReplayGateCase {
  return {
    product: "opencode",
    upstreamRef: sourceMatrix.upstreamRef,
    evidenceRef: "conformance:tool-contract-envelope-replay-gate",
    fixtureID: sourceMatrix.fixtureID,
    schemaShape: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["tool-definition-plugin", "tool-schema-bridge", "plugin-tool-registry", "live-plugin-tool-runtime"]),
      ...toolCadenceSchemaMarkers(cadence),
    ]),
    permissionDecision: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["permission-ask-hook", "plugin-permission-bridge", "permission-render", "permission-ui-side-effects"]),
      ...toolResultEventStreamMarkers(cadence.resultEventStream),
      ...toolResultEnvelopeRoundTripMarkers(cadence.resultEnvelopeRoundTrip),
    ]),
    denialBehavior: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["permission-render", "permission-ui-side-effects"]),
      ...toolResultEventStreamMarkers(cadence.resultEventStream),
      ...toolResultEnvelopeRoundTripMarkers(cadence.resultEnvelopeRoundTrip),
    ]),
    progressEvent: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["status-stream"]),
      ...toolResultEventStreamMarkers(cadence.resultEventStream),
      ...toolResultWritebackTimingMarkers(cadence.resultWritebackTiming),
    ]),
    resultEnvelope: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["result-render", "workspace-filesystem", "exact-workspace-fs-side-effects"]),
      ...toolCadenceResultMarkers(cadence),
      ...toolResultEnvelopeRoundTripMarkers(cadence.resultEnvelopeRoundTrip),
    ]),
    sessionWriteback: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["status-stream", "result-render"]),
      ...toolResultWritebackTimingMarkers(cadence.resultWritebackTiming),
    ]),
    sourceAnchors: uniqueStrings([
      ...sourceMatrix.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
      ...sourceMatrix.branchAnchors.flatMap((anchor) => anchor.nativeEvidenceRefs),
      ...sourceMatrix.branchAnchors.flatMap((anchor) => anchor.fixtureIDs),
    ]),
    toolAtomIDs: uniqueStrings([...sourceMatrix.coveredToolAtomIDs, ...cadence.atoms.map((atom) => atom.atomID)]),
    toolPortIDs: uniqueStrings([...sourceMatrix.coveredToolPortIDs, ...cadence.atoms.map((atom) => atom.portID)]),
    fixtureIDs: uniqueStrings([...sourceMatrix.fixtureIDs, ...cadence.fixtureIDs]),
    nativeEvidenceRefs: sourceMatrix.nativeEvidenceRefs,
    envelopeRisk: "source-anchored-partial",
    knownLossiness: uniqueStrings([
      ...sourceMatrix.knownGaps,
      ...cadence.knownGaps,
      ...cadence.resultEventStream.knownGaps,
      ...cadence.resultEventStream.lossyFields,
      ...cadence.resultEnvelopeRoundTrip.knownGaps,
      ...cadence.resultEnvelopeRoundTrip.lossyFields,
      ...cadence.resultWritebackTiming.knownGaps,
      ...cadence.resultWritebackTiming.lossyFields,
    ]),
  }
}

function buildProductToolContractEnvelopeReplayGateCase(
  product: Exclude<ToolContractEnvelopeReplayGateProduct, "opencode">,
  sourceMatrix: ProductToolSourceMatrixSnapshot,
  cadence: ToolCadenceReplaySnapshot,
): ToolContractEnvelopeReplayGateCase {
  return {
    product,
    upstreamRef: sourceMatrix.upstreamRef,
    evidenceRef: "conformance:tool-contract-envelope-replay-gate",
    fixtureID: sourceMatrix.fixtureID,
    schemaShape: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["tool-definition-registry", "tool-schema-bridge", "live-tool-runtime"]),
      ...toolCadenceSchemaMarkers(cadence),
    ]),
    permissionDecision: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["permission-policy", "permission-side-effects"]),
      ...toolResultEventStreamMarkers(cadence.resultEventStream),
      ...toolResultEnvelopeRoundTripMarkers(cadence.resultEnvelopeRoundTrip),
    ]),
    denialBehavior: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["permission-policy", "executor-render", "permission-side-effects"]),
      ...toolResultEventStreamMarkers(cadence.resultEventStream),
      ...toolResultEnvelopeRoundTripMarkers(cadence.resultEnvelopeRoundTrip),
    ]),
    progressEvent: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["progress-audit-event"]),
      ...toolResultEventStreamMarkers(cadence.resultEventStream),
      ...toolResultWritebackTimingMarkers(cadence.resultWritebackTiming),
    ]),
    resultEnvelope: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["executor-render", "result-envelope", "workspace-filesystem", "exact-result-writeback"]),
      ...toolCadenceResultMarkers(cadence),
      ...toolResultEnvelopeRoundTripMarkers(cadence.resultEnvelopeRoundTrip),
    ]),
    sessionWriteback: uniqueStrings([
      ...toolBranchMarkers(sourceMatrix.branchAnchors, ["result-envelope", "progress-audit-event", "exact-result-writeback"]),
      ...toolResultWritebackTimingMarkers(cadence.resultWritebackTiming),
    ]),
    sourceAnchors: sourceMatrix.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    toolAtomIDs: uniqueStrings([...sourceMatrix.coveredToolAtomIDs, ...cadence.atoms.map((atom) => atom.atomID)]),
    toolPortIDs: uniqueStrings([...sourceMatrix.coveredToolPortIDs, ...cadence.atoms.map((atom) => atom.portID)]),
    fixtureIDs: uniqueStrings([sourceMatrix.fixtureID, ...cadence.fixtureIDs]),
    nativeEvidenceRefs: [sourceMatrix.evidenceRef],
    envelopeRisk: "source-anchored-partial",
    knownLossiness: uniqueStrings([
      ...sourceMatrix.knownGaps,
      ...cadence.knownGaps,
      ...cadence.resultEventStream.knownGaps,
      ...cadence.resultEventStream.lossyFields,
      ...cadence.resultEnvelopeRoundTrip.knownGaps,
      ...cadence.resultEnvelopeRoundTrip.lossyFields,
      ...cadence.resultWritebackTiming.knownGaps,
      ...cadence.resultWritebackTiming.lossyFields,
    ]),
  }
}

export const toolPortContractFixtures: LegoPortContractFixture[] = [
  {
    id: "tools",
    input: "recipe-selected tool pack or compatibility tool bundle with definitions, executors, schema adapters, permissions, and result handling",
    output: "registered tool surface for the current agent loop while recipes migrate toward fully atom-level tool bindings",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [
      { id: "filesystem", mode: "write", scope: "workspace" },
      { id: "shell", mode: "execute", scope: "process" },
    ],
    conformance: "tools:pack-compatibility",
    implementations: ["tool-pack.echo", "tool-pack.filesystem", "tool-pack.shell", "tool-pack.meta"],
    personalityAtoms: ["opencode.tool-pack.native", "opencode.tool-pack.compatibility", "pi.tool-pack.compatibility", "nanobot.tool-pack.compatibility", "hermes.tool-pack.compatibility"],
  },
  {
    id: "tool.definition",
    input: "tool name, description, parameter schema, execution mode, render metadata, and source metadata",
    output: "normalized LegoToolDefinition manifest that can be registered by a tool registry",
    lifecycle: ["process", "workspace"],
    resources: [],
    conformance: "tools:definition",
    implementations: ["tool.definition.echo", "tool.definition.filesystem", "tool.definition.shell", "tool.definition.meta"],
    personalityAtoms: [
      "opencode.tool.definition-plugin-bridge",
      "pi.tool.register-tool-bridge",
      "nanobot.tool.definition-plugin-bridge",
      "hermes.tool.definition-registry-bridge",
    ],
  },
  {
    id: "tool.schema-adapter",
    input: "product-native tool parameter schema or validator shape",
    output: "normalized schema metadata usable by providers, prompts, validation, and product renderers",
    lifecycle: ["process", "workspace"],
    resources: [],
    conformance: "tools:schema-adapter",
    implementations: [
      "tool.schema.json-schema",
      "tool.schema.typebox",
      "tool.schema.zod-compatible",
      "tool.schema.effect-compatible",
      "tool.schema.typescript-validator",
    ],
    personalityAtoms: [
      "opencode.tool.schema-bridge",
      "pi.tool.typebox-bridge",
      "pi.extension.typebox-bridge",
      "nanobot.tool.schema-bridge",
      "hermes.tool.schema-bridge",
    ],
  },
  {
    id: "tools.schema",
    input: "registered tool definitions, product-native aliases, parameter naming conventions, and provider-visible descriptions",
    output: "tool schema snapshot with canonical names, aliases, required fields, mutation class, and provider render hints",
    lifecycle: ["process", "workspace", "turn"],
    resources: [],
    conformance: "tools:schema-cadence",
    implementations: ["common.tools.schema.default"],
    personalityAtoms: ["opencode.tools.schema.native-like", "pi.tools.schema.native-like", "nanobot.tools.schema.native-like", "hermes.tools.schema.native-like"],
    personalityAtomImplementationKinds: {
      "opencode.tools.schema.native-like": "factory",
    },
  },
  {
    id: "tools.batch-scheduler",
    input: "assistant tool calls, tool metadata, permission policy result, mutation class, and product ordering strategy",
    output: "deterministic tool execution batches with parallel/sequential/native-order evidence",
    lifecycle: ["turn", "tool-call"],
    resources: [],
    conformance: "tools:batch-scheduler",
    implementations: ["common.tools.batch-scheduler.default"],
    personalityAtoms: [
      "opencode.tools.batch-scheduler.native-like",
      "pi.tools.batch-scheduler.native-like",
      "nanobot.tools.batch-scheduler.native-like",
      "hermes.tools.batch-scheduler.native-like",
    ],
  },
  {
    id: "tool.permission-policy",
    input: "tool call context, resource intent, workspace scope, and product permission hooks",
    output: "allow, deny, or ask decision with optional reason and patched arguments",
    lifecycle: ["turn", "tool-call"],
    resources: [],
    conformance: "tools:permission-policy",
    implementations: [
      "tool.permission.always-allow",
      "tool.permission.always-deny",
      "tool.permission.ask-hook",
      "tool.permission.workspace-scoped",
      "tool.permission.product-personality",
    ],
    personalityAtoms: [
      "opencode.permission.ask-bridge",
      "opencode.plugin.permission-bridge",
      "pi.permission.event-bridge",
      "nanobot.permission.policy-bridge",
      "hermes.permission.hook-bridge",
    ],
  },
  {
    id: "tool.executor",
    input: "tool call id, typed input, session/workspace context, permission state, and abort signal",
    output: "LegoToolResult content, details, error flag, and optional render metadata",
    lifecycle: ["turn", "tool-call"],
    resources: [
      { id: "filesystem", mode: "write", scope: "workspace" },
      { id: "shell", mode: "execute", scope: "process" },
    ],
    conformance: "tools:executor",
    implementations: ["tool.executor.default", "tool.executor.echo-only"],
    personalityAtoms: ["opencode.tool.permission-render-bridge", "pi.tool.event-render-bridge", "nanobot.tool.event-render-bridge", "hermes.tool.permission-render-bridge"],
  },
  {
    id: "tool.result-normalizer",
    input: "raw executor output, thrown errors, stdout/stderr, file diffs, and render hints",
    output: "normalized LegoToolResult content, metadata, error state, and transcript-safe text",
    lifecycle: ["tool-call"],
    resources: [],
    conformance: "tools:result-normalizer",
    implementations: ["tool.result.text", "tool.result.json", "tool.result.error", "tool.result.truncated"],
    personalityAtoms: ["opencode.tool.result-render-bridge", "pi.tool.result-event-bridge", "nanobot.tool.result-event-bridge", "hermes.tool.result-event-bridge"],
  },
  {
    id: "tools.result-projector",
    input: "LegoToolResult plus product native result envelope requirements",
    output: "product-native result text, metadata, error envelope, and transcript-safe projection",
    lifecycle: ["tool-call"],
    resources: [],
    conformance: "tools:result-projector",
    implementations: ["common.tools.result-projector.default"],
    personalityAtoms: [
      "opencode.tools.result-projector.native-like",
      "pi.tools.result-projector.native-like",
      "nanobot.tools.result-projector.native-like",
      "hermes.tools.result-projector.native-like",
    ],
  },
  {
    id: "tool.audit-log",
    input: "tool execution lifecycle event with source, permission decision, arguments, result metadata, and timing",
    output: "append-only audit record for traces, product status views, and replay diagnostics",
    lifecycle: ["turn", "tool-call"],
    resources: [],
    conformance: "tools:audit-log",
    implementations: ["tool.audit.memory", "tool.audit.jsonl"],
    personalityAtoms: ["opencode.tool.status-bridge", "pi.tool.runtime-event-bridge", "nanobot.tool.progress-event-bridge", "hermes.tool.progress-event-bridge"],
  },
  {
    id: "filesystem.port",
    input: "workspace-scoped path operation with mode, content/query payload, cwd, and abort signal",
    output: "normalized file read/write/list/search result with path, diff, or error metadata",
    lifecycle: ["workspace", "turn", "tool-call"],
    resources: [{ id: "filesystem", mode: "write", scope: "workspace" }],
    conformance: "tools:filesystem-port",
    implementations: ["filesystem.local", "filesystem.memory", "filesystem.readonly", "filesystem.workspace-scoped"],
    personalityAtoms: ["opencode.workspace-filesystem-bridge", "pi.workspace-filesystem-bridge", "nanobot.workspace-filesystem-bridge", "hermes.workspace-filesystem-bridge"],
  },
  {
    id: "process-runner.port",
    input: "command, arguments, cwd, environment patch, timeout, stdin, and abort signal",
    output: "exit code, signal, stdout, stderr, duration, and normalized execution error",
    lifecycle: ["tool-call"],
    resources: [{ id: "shell", mode: "execute", scope: "process" }],
    conformance: "tools:process-runner-port",
    implementations: ["process-runner.disabled", "process-runner.local", "process-runner.dry-run", "process-runner.sandbox"],
    personalityAtoms: ["opencode.shell.env-bridge", "pi.process-runner-bridge", "nanobot.process-runner-bridge", "hermes.process-runner-bridge"],
  },
]

function toolBranchMarkers(
  anchors: ReadonlyArray<{
    branchID: string
    status?: string
    exactDiffStatus?: string
    nativeParityClaim?: boolean
    localEvidenceRefs: string[]
    localMarkers: string[]
    nativeEvidenceRefs?: string[]
    fixtureIDs?: string[]
    knownGaps: string[]
  }>,
  branchIDs: string[],
): string[] {
  const selected = anchors.filter((anchor) => branchIDs.includes(anchor.branchID))
  return uniqueStrings(selected.flatMap((anchor) => [
    anchor.branchID,
    ...(anchor.status ? [anchor.status] : []),
    ...(anchor.exactDiffStatus ? [anchor.exactDiffStatus] : []),
    anchor.nativeParityClaim ? "native-parity-claimed" : "native-parity-not-claimed",
    ...anchor.localEvidenceRefs,
    ...anchor.localMarkers,
    ...(anchor.nativeEvidenceRefs ?? []),
    ...(anchor.fixtureIDs ?? []),
    ...anchor.knownGaps,
  ]))
}

function toolCadenceSchemaMarkers(snapshot: ToolCadenceReplaySnapshot): string[] {
  const schemaAtoms = snapshot.atoms.filter((atom) => atom.key === "schema")
  return uniqueStrings(schemaAtoms.flatMap((atom) => [
    snapshot.evidenceRef,
    atom.key,
    atom.atomID,
    atom.portID,
    atom.flowStageID,
    atom.fixtureID,
    ...atom.upstreamEvidenceRefs,
    ...atom.observedFields,
    ...atom.inferredFields,
    ...atom.lossyFields,
    ...atom.scenarios.flatMap((scenario) => [
      scenario.scenarioID,
      scenario.toolName,
      scenario.visibility,
      ...toolObservedShapeMarkers(scenario.observedShape),
    ]),
  ]))
}

function toolCadenceResultMarkers(snapshot: ToolCadenceReplaySnapshot): string[] {
  const resultAtoms = snapshot.atoms.filter((atom) => atom.key === "result-projector")
  return uniqueStrings(resultAtoms.flatMap((atom) => [
    snapshot.evidenceRef,
    atom.key,
    atom.atomID,
    atom.portID,
    atom.flowStageID,
    atom.fixtureID,
    atom.resultEventStreamFixtureID ?? "",
    atom.resultEnvelopeRoundTripFixtureID ?? "",
    atom.resultWritebackTimingFixtureID ?? "",
    ...atom.upstreamEvidenceRefs,
    ...atom.observedFields,
    ...atom.inferredFields,
    ...atom.lossyFields,
    ...atom.scenarios.flatMap((scenario) => [
      scenario.scenarioID,
      scenario.toolName,
      scenario.visibility,
      ...toolObservedShapeMarkers(scenario.observedShape),
    ]),
  ]))
}

function toolResultEventStreamMarkers(snapshot: ToolResultEventStreamSnapshot): string[] {
  return uniqueStrings([
    snapshot.evidenceRef,
    snapshot.fixtureID,
    ...snapshot.observedFields,
    ...snapshot.inferredFields,
    ...snapshot.lossyFields,
    ...snapshot.knownGaps,
    ...snapshot.scenarios.flatMap((scenario) => [
      scenario.scenarioID,
      scenario.toolName,
      scenario.resultEnvelope,
      scenario.progressSurface,
      scenario.permissionSurface,
      scenario.metadataSurface,
      scenario.visibility,
      ...scenario.eventSequence,
      ...toolObservedShapeMarkers(scenario.observedShape),
    ]),
  ])
}

function toolResultEnvelopeRoundTripMarkers(snapshot: ToolResultEnvelopeRoundTripSnapshot): string[] {
  return uniqueStrings([
    snapshot.evidenceRef,
    snapshot.fixtureID,
    ...snapshot.observedFields,
    ...snapshot.inferredFields,
    ...snapshot.lossyFields,
    ...snapshot.knownGaps,
    ...snapshot.scenarios.flatMap((scenario) => [
      scenario.scenarioID,
      scenario.toolName,
      scenario.visibility,
      ...scenario.lossiness,
      ...toolObservedShapeMarkers(scenario.commonInputShape),
      ...toolObservedShapeMarkers(scenario.nativeEnvelopeShape),
      ...toolObservedShapeMarkers(scenario.commonReadbackShape),
    ]),
  ])
}

function toolResultWritebackTimingMarkers(snapshot: ToolResultWritebackTimingSnapshot): string[] {
  return uniqueStrings([
    snapshot.evidenceRef,
    snapshot.fixtureID,
    ...snapshot.observedFields,
    ...snapshot.inferredFields,
    ...snapshot.lossyFields,
    ...snapshot.knownGaps,
    ...snapshot.scenarios.flatMap((scenario) => [
      scenario.scenarioID,
      scenario.toolName,
      scenario.writebackSurface,
      scenario.recordIDSurface,
      scenario.visibility,
      ...scenario.eventSequence,
      ...scenario.timingBuckets,
      ...scenario.lossiness,
      ...toolObservedShapeMarkers(scenario.observedShape),
    ]),
  ])
}

function toolObservedShapeMarkers(shape: Record<string, unknown>): string[] {
  return Object.entries(shape).flatMap(([key, value]) => [key, String(value)])
}

function toolContractEnvelopePinnedReplayRecords(
  product: ToolContractEnvelopePinnedReplayProduct,
): ToolContractEnvelopePinnedReplayRecord[] {
  if (product === "opencode") {
    return [
      toolPinnedReplayRecord(product, "schema", 1, "opencode.schema.bash", "bash", "schema:bash:command+description+timeout", "ask", "deny:permission-tool-result", "progress:tool.start.bash", "result:bash.stdout+metadata", "writeback:message-v2-tool-result-record", ["command", "description", "timeout", "permissionSubject"], "tool-bash:packages/opencode/src/tool/bash.ts", "schema-permission-subject:observed"),
      toolPinnedReplayRecord(product, "permission-decision", 2, "opencode.permission.edit.ask", "edit", "schema:edit:file+oldString+newString", "ask", "deny:edit-permission-render", "progress:permission.ask.edit", "result:permission.pending", "writeback:permission-decision-event", ["permissionID", "subject", "status", "renderKeys"], "plugin-permission:packages/opencode/src/permission/index.ts", "permission-ui-render:ask"),
      toolPinnedReplayRecord(product, "denial-behavior", 3, "opencode.denial.bash", "bash", "schema:bash:command+timeout", "deny", "deny:bash-policy-result-error", "progress:tool.denied.bash", "result:permissionDenied+stderr", "writeback:denied-tool-result-part", ["permissionDenied", "stderr", "policy", "toolCallID"], "plugin-permission:packages/opencode/src/permission/index.ts", "denial-result:synthetic-tool-result"),
      toolPinnedReplayRecord(product, "progress-event", 4, "opencode.progress.todowrite", "todo", "schema:todo:items", "allow", "deny:none", "progress:queued>running>complete", "result:todo.json", "writeback:tool-status-record", ["queued", "running", "complete", "recordID"], "tool-todowrite:packages/opencode/src/tool/todowrite.ts", "status-stream:message-v2"),
      toolPinnedReplayRecord(product, "result-envelope", 5, "opencode.result.task", "task", "schema:task:description+subagent", "allow", "deny:none", "progress:task.complete", "result:task.text+metadata+subtaskID", "writeback:message-v2-task-result", ["text", "metadata", "subtaskID", "tool-result"], "tool-task:packages/opencode/src/tool/task.ts", "result-envelope:message-v2-parts"),
      toolPinnedReplayRecord(product, "session-writeback", 6, "opencode.writeback.edit", "edit", "schema:edit:file+replacement", "allow", "deny:none", "progress:edit.complete", "result:edit.diff+file", "writeback:sqlite-message-v2-tool-result", ["recordID", "messageID", "partID", "providerMetadata"], "tool-edit:packages/opencode/src/tool/edit.ts", "session-writeback:sqlite-record-id"),
    ]
  }
  if (product === "pi-mono") {
    return [
      toolPinnedReplayRecord(product, "schema", 1, "pi.schema.read-file", "read_file", "schema:typebox:path+encoding", "allow", "deny:none", "progress:tool.start.read_file", "result:read_file.stdout", "writeback:jsonl-v3-tool-result-record", ["TypeBox", "path", "encoding", "required"], "pi-tool-wrapper:packages/coding-agent/src/core/tools/tool-definition-wrapper.ts", "pi-schema:typebox"),
      toolPinnedReplayRecord(product, "permission-decision", 2, "pi.permission.dynamic-tool", "dynamic_tool", "schema:typebox:input", "ask", "deny:extension-permission-render", "progress:permission.ask.dynamic_tool", "result:permission.pending", "writeback:jsonl-v3-permission-event", ["permissionID", "extensionID", "subject", "status"], "pi-dynamic-tool-example:packages/coding-agent/src/core/extensions/examples/dynamic-tool.ts", "pi-permission:extension-policy"),
      toolPinnedReplayRecord(product, "denial-behavior", 3, "pi.denial.shell", "shell", "schema:typebox:command", "deny", "deny:tool-result-error-jsonl", "progress:tool.denied.shell", "result:permissionDenied+jsonl-error", "writeback:jsonl-v3-denied-record", ["permissionDenied", "error", "jsonl-v3", "toolCallID"], "pi-core-tools:packages/coding-agent/src/core/tools/index.ts", "pi-denial:jsonl-tool-result"),
      toolPinnedReplayRecord(product, "progress-event", 4, "pi.progress.register-tool", "register_tool", "schema:typebox:name+schema", "allow", "deny:none", "progress:runtime-event>audit-log>complete", "result:register-tool.json", "writeback:jsonl-v3-tool-status", ["runtimeEvent", "auditLog", "recordID", "complete"], "pi-extension-runner:packages/coding-agent/src/core/extensions/runner.ts", "pi-progress:runtime-event"),
      toolPinnedReplayRecord(product, "result-envelope", 5, "pi.result.read-file", "read_file", "schema:typebox:path", "allow", "deny:none", "progress:read_file.complete", "result:stdout+metadata+jsonl-part", "writeback:jsonl-v3-tool-result-record", ["stdout", "metadata", "tool-result", "jsonl-v3"], "pi-core-tools:packages/coding-agent/src/core/tools/index.ts", "pi-result-envelope:jsonl-part"),
      toolPinnedReplayRecord(product, "session-writeback", 6, "pi.writeback.dynamic-tool", "dynamic_tool", "schema:typebox:input", "allow", "deny:none", "progress:dynamic_tool.complete", "result:dynamic-tool.json", "writeback:jsonl-v3-record-id", ["recordID", "leafID", "messageID", "providerMetadata"], "pi-extension-wrapper:packages/coding-agent/src/core/extensions/wrapper.ts", "pi-writeback:jsonl-v3-record-id"),
    ]
  }
  if (product === "nanobot") {
    return [
      toolPinnedReplayRecord(product, "schema", 1, "nanobot.schema.workspace-file", "workspace_file", "schema:json:path+mode", "guarded", "deny:none", "progress:tool.start.workspace_file", "result:file.text", "writeback:memory-history-tool-result", ["path", "mode", "workspace", "required"], "nanobot-tool-schema:nanobot/agent/tools/schema.py", "nanobot-schema:workspace-tool"),
      toolPinnedReplayRecord(product, "permission-decision", 2, "nanobot.permission.shell", "shell", "schema:json:command+cwd", "guarded", "deny:workspace-restriction", "progress:permission.guard.shell", "result:permission.pending", "writeback:channel-permission-event", ["guard", "workspace", "sandbox", "channel"], "nanobot-tool-registry:nanobot/agent/tools/registry.py", "nanobot-permission:workspace-restriction"),
      toolPinnedReplayRecord(product, "denial-behavior", 3, "nanobot.denial.filesystem", "filesystem", "schema:json:path", "deny", "deny:workspace-violation-result", "progress:tool.denied.filesystem", "result:permissionDenied+channel-error", "writeback:memory-history-denied-tool", ["permissionDenied", "workspaceViolation", "channel", "toolCallID"], "nanobot-filesystem-tool:nanobot/agent/tools/filesystem.py", "nanobot-denial:workspace-guard"),
      toolPinnedReplayRecord(product, "progress-event", 4, "nanobot.progress.shell", "shell", "schema:json:command", "guarded", "deny:none", "progress:channel.dispatch>running>complete", "result:shell.stdout", "writeback:channel-tool-status", ["channelDispatch", "running", "complete", "progress"], "nanobot-shell-tool:nanobot/agent/tools/shell.py", "nanobot-progress:channel-dispatch"),
      toolPinnedReplayRecord(product, "result-envelope", 5, "nanobot.result.filesystem", "filesystem", "schema:json:path+content", "allow", "deny:none", "progress:filesystem.complete", "result:text+metadata+memory", "writeback:memory-history-tool-result", ["text", "metadata", "memory", "tool-result"], "nanobot-filesystem-tool:nanobot/agent/tools/filesystem.py", "nanobot-result-envelope:memory"),
      toolPinnedReplayRecord(product, "session-writeback", 6, "nanobot.writeback.shell", "shell", "schema:json:command", "guarded", "deny:none", "progress:shell.complete", "result:shell.stdout+stderr", "writeback:memory-history-record-id", ["recordID", "channelID", "goalState", "providerMetadata"], "nanobot-tool-registry:nanobot/agent/tools/registry.py", "nanobot-writeback:memory-record-id"),
    ]
  }
  return [
    toolPinnedReplayRecord(product, "schema", 1, "hermes.schema.acp-tool", "acp_tool", "schema:pydantic:name+arguments", "guarded", "deny:none", "progress:tool.start.acp", "result:acp.message", "writeback:api-acp-tool-result-event", ["name", "arguments", "pydantic", "required"], "hermes-tool-executor:agent/tool_executor.py", "hermes-schema:pydantic"),
    toolPinnedReplayRecord(product, "permission-decision", 2, "hermes.permission.guardrail", "memory_tool", "schema:pydantic:query", "guarded", "deny:guardrail-decision", "progress:guardrail.check", "result:permission.pending", "writeback:guardrail-event", ["ToolCallGuardrailDecision", "policy", "subject", "status"], "hermes-tool-guardrails:agent/tool_guardrails.py", "hermes-permission:guardrail"),
    toolPinnedReplayRecord(product, "denial-behavior", 3, "hermes.denial.dispatch", "computer_use", "schema:pydantic:action", "deny", "deny:guardrail-tool-result", "progress:tool.denied.computer_use", "result:guardrail-error+acp", "writeback:api-acp-denied-result", ["permissionDenied", "guardrail", "acp", "toolCallID"], "hermes-dispatch-helpers:agent/tool_dispatch_helpers.py", "hermes-denial:guardrail-result"),
    toolPinnedReplayRecord(product, "progress-event", 4, "hermes.progress.file-mutation", "file_mutation", "schema:pydantic:path+patch", "allow", "deny:none", "progress:queued>file_mutation_landed>complete", "result:file_mutation_result_landed", "writeback:api-acp-tool-status", ["queued", "file_mutation_landed", "complete", "eventID"], "hermes-result-classification:agent/tool_result_classification.py", "hermes-progress:file-mutation"),
    toolPinnedReplayRecord(product, "result-envelope", 5, "hermes.result.acp", "acp_tool", "schema:pydantic:name+arguments", "allow", "deny:none", "progress:acp.complete", "result:make_tool_result_message+metadata", "writeback:api-acp-tool-result-event", ["make_tool_result_message", "metadata", "acp", "tool-result"], "hermes-acp-tools:acp_adapter/tools.py", "hermes-result-envelope:acp"),
    toolPinnedReplayRecord(product, "session-writeback", 6, "hermes.writeback.memory-tool", "memory_tool", "schema:pydantic:query", "guarded", "deny:none", "progress:memory_tool.complete", "result:memory_tool.json", "writeback:api-acp-tool-result-event-id", ["eventID", "sessionID", "trajectoryID", "providerMetadata"], "hermes-tool-executor:agent/tool_executor.py", "hermes-writeback:api-acp-event-id"),
  ]
}

function toolPinnedReplayRecord(
  product: ToolContractEnvelopePinnedReplayProduct,
  dimension: ToolContractEnvelopePinnedReplayDimension,
  sequence: number,
  fixtureCaseID: string,
  toolName: string,
  schemaFingerprint: string,
  permissionDecision: ToolContractEnvelopePinnedReplayRecord["permissionDecision"],
  denialResultID: string,
  progressEventID: string,
  resultEnvelopeID: string,
  sessionWritebackID: string,
  metadataKeys: string[],
  sourceAnchor: string,
  sideEffectID: string,
): ToolContractEnvelopePinnedReplayRecord {
  return {
    dimension,
    sequence,
    fixtureCaseID: `${product}:${fixtureCaseID}`,
    toolName,
    schemaFingerprint,
    permissionDecision,
    denialResultID,
    progressEventID,
    resultEnvelopeID,
    sessionWritebackID,
    metadataKeys,
    sourceAnchor,
    sideEffectID,
  }
}

function toolPinnedReplayRecordClone(record: ToolContractEnvelopePinnedReplayRecord): ToolContractEnvelopePinnedReplayRecord {
  return {
    ...record,
    metadataKeys: [...record.metadataKeys],
  }
}

function toolPinnedReplayEnvelope(
  records: ToolContractEnvelopePinnedReplayRecord[],
  dimension: ToolContractEnvelopePinnedReplayDimension,
): ToolContractEnvelopePinnedReplayRecord | undefined {
  return records.find((record) => record.dimension === dimension)
}

function toolPinnedReplayRecordMatches(
  upstream: ToolContractEnvelopePinnedReplayRecord,
  candidate: ToolContractEnvelopePinnedReplayRecord,
): boolean {
  return JSON.stringify(upstream) === JSON.stringify(candidate)
}

function toolPinnedReplayOrderMatches(records: ToolContractEnvelopePinnedReplayRecord[]): boolean {
  const dimensions: ToolContractEnvelopePinnedReplayDimension[] = [
    "schema",
    "permission-decision",
    "denial-behavior",
    "progress-event",
    "result-envelope",
    "session-writeback",
  ]
  return records.map((record) => record.dimension).join("|") === dimensions.join("|") &&
    records.every((record, index) => record.sequence === index + 1)
}

function toolGateContains(values: string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

function toolIncludesAll(values: string[], required: readonly string[]): boolean {
  return required.every((value) => values.includes(value))
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort()
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}
