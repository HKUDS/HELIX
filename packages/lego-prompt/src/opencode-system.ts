import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import type { LegoModel } from "@helix/contracts"

export type OpenCodeAgentPromptMode = "build" | "plan" | "general" | "subagent" | "compaction"
export type OpenCodePromptResourceKind = "rule" | "skill" | "template" | "theme" | "agent" | "memory"
export type OpenCodePromptResourceSource = "builtin" | "project" | "global" | "extension"
export type OpenCodeConfigRecord = { path: string; source: OpenCodePromptResourceSource; values: Record<string, unknown> }
export type OpenCodeSkillDir = { path: string; source: OpenCodePromptResourceSource }
export type OpenCodePermissionAction = "allow" | "ask" | "deny"
export type OpenCodeSkillPermissionRule = { pattern: string; action: OpenCodePermissionAction }

export interface OpenCodePromptResource {
  kind: OpenCodePromptResourceKind
  name: string
  path?: string
  content: string
  source: OpenCodePromptResourceSource
  metadata?: Record<string, unknown>
}

export interface OpenCodePromptReferenceAttachment {
  name: string
  path?: string
  content: string
  mime?: string
}

export type OpenCodeSystemPromptSegmentKind = "base-prompt" | "environment" | "resource" | "skills" | "reference"
export type OpenCodeSystemPromptBaseID = OpenCodePromptAssetName | "plan-composite" | "compaction-summary"

export interface OpenCodeSystemPromptOrderingSegment {
  order: number
  kind: OpenCodeSystemPromptSegmentKind
  name: string
  sha256: string
  lineCount: number
  charCount: number
  source?: OpenCodePromptResourceSource | "model-runtime" | "attachment"
  resourceKind?: OpenCodePromptResourceKind
  includedSkillNames?: string[]
}

export interface OpenCodeRenderedSystemPromptSegment extends OpenCodeSystemPromptOrderingSegment {
  content: string
}

export interface OpenCodeSystemPromptOrderingSnapshot {
  schemaVersion: 1
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  cwd: string
  mode: OpenCodeAgentPromptMode
  promptAsset: OpenCodeSystemPromptBaseID
  separator: "\n\n"
  segments: OpenCodeSystemPromptOrderingSegment[]
  segmentOrder: string[]
  renderedResourceNames: string[]
  includedSkillNames: string[]
  deniedSkillNames: string[]
  referenceNames: string[]
  assembledSha256: string
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeRenderedSystemPromptSnapshot {
  schemaVersion: 1
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  cwd: string
  mode: OpenCodeAgentPromptMode
  promptAsset: OpenCodeSystemPromptBaseID
  separator: "\n\n"
  segments: OpenCodeRenderedSystemPromptSegment[]
  segmentOrder: string[]
  renderedResourceNames: string[]
  includedSkillNames: string[]
  deniedSkillNames: string[]
  referenceNames: string[]
  assembledPrompt: string
  assembledSha256: string
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodePinnedUpstreamSystemPromptSource {
  path: string
  sha256: string
  anchors: string[]
}

export type OpenCodeUpstreamSystemPromptAnchorStatus = "matched" | "partial" | "missing"

export interface OpenCodeUpstreamSystemPromptAnchor {
  id: string
  upstreamPath: string
  upstreamExpectation: string
  renderedSegmentKind?: OpenCodeSystemPromptSegmentKind
  renderedSegmentName?: string
  status: OpenCodeUpstreamSystemPromptAnchorStatus
  evidence?: string
  gap?: string
}

export interface OpenCodeUpstreamSystemPromptMatrixCase {
  name: string
  mode: OpenCodeAgentPromptMode
  providerID: string
  modelID: string
  promptAsset: OpenCodeSystemPromptBaseID
  upstreamRequestOrder: string[]
  renderedSegmentOrder: string[]
  anchors: OpenCodeUpstreamSystemPromptAnchor[]
  matchedAnchorIDs: string[]
  partialAnchorIDs: string[]
  missingAnchorIDs: string[]
  assembledSha256: string
  status: "source-anchored-partial"
}

export interface OpenCodeUpstreamSystemPromptMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  cwd: string
  sourceRefs: OpenCodePinnedUpstreamSystemPromptSource[]
  cases: OpenCodeUpstreamSystemPromptMatrixCase[]
  provenAnchors: string[]
  partialAnchors: string[]
  missingAnchors: string[]
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeSystemPromptRuntimeOutputSource =
  | "agent.prompt-or-SystemPrompt.provider"
  | "SystemPrompt.environment"
  | "Instruction.system"
  | "SystemPrompt.skills"
  | "STRUCTURED_OUTPUT_SYSTEM_PROMPT"
  | "input.user.system"
  | "experimental.chat.system.transform"
  | "ReferencePrompt"

export type OpenCodeSystemPromptRuntimeProjectedOutputStepID =
  | "prompt-input:structured-output-system"
  | "prompt-input:user-system"
  | "plugin:experimental-chat-system-transform"
  | "session-prompt:reference-attachment"

export type OpenCodeSystemPromptRuntimeOutputEvent =
  | {
    type: "system.chunk"
    source: OpenCodeSystemPromptRuntimeOutputSource
    upstreamRequestSlot: string
    segmentName?: string
    contentSha256?: string
    sequence: number
  }
  | {
    type: "plugin.transform"
    pluginID?: string
    beforeCount: number
    afterCount: number
    mutatedSlots: string[]
    sequence: number
  }
  | {
    type: "reference.attachment"
    name: string
    path?: string
    mime?: string
    syntheticMessagePartObserved: boolean
    sequence: number
  }

export interface OpenCodeSystemPromptRuntimeSystemChunkProjection {
  source: OpenCodeSystemPromptRuntimeOutputSource
  upstreamRequestSlot: string
  segmentName: string | null
  contentSha256: string | null
  sequence: number
}

export interface OpenCodeSystemPromptRuntimePluginTransformProjection {
  pluginID: string | null
  beforeCount: number
  afterCount: number
  mutatedSlots: string[]
  sequence: number
}

export interface OpenCodeSystemPromptRuntimeReferenceAttachmentProjection {
  name: string
  path: string | null
  mime: string | null
  syntheticMessagePartObserved: boolean
  sequence: number
}

export interface OpenCodeSystemPromptRuntimeOutputProjection {
  schemaVersion: 1
  fixtureID: "opencode-prompt:runtime-system-output-projection"
  evidenceRef: "conformance:opencode-system-prompt-runtime-output-projection"
  coveredOutputStepIDs: OpenCodeSystemPromptRuntimeProjectedOutputStepID[]
  retainedFields: string[]
  lossyFields: string[]
  systemChunks: OpenCodeSystemPromptRuntimeSystemChunkProjection[]
  pluginTransforms: OpenCodeSystemPromptRuntimePluginTransformProjection[]
  referenceAttachments: OpenCodeSystemPromptRuntimeReferenceAttachmentProjection[]
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeSystemPromptInvocationBoundaryID =
  | "llm-request:provider-or-agent-prompt"
  | "session-system:environment"
  | "session-instruction:system"
  | "session-system:skills"
  | "prompt-input:structured-output-system"
  | "prompt-input:user-system"
  | "plugin:experimental-chat-system-transform"
  | "session-prompt:reference-attachment"

export interface OpenCodeSystemPromptInvocationBoundaryRecord {
  boundaryID: OpenCodeSystemPromptInvocationBoundaryID
  sourceOrder: number
  upstreamPath: string
  upstreamSymbol: string
  upstreamRequestSlot: string
  harnessSegment?: string
  retainedFields?: string[]
  sideEffectMarkers?: string[]
  lossyFields?: string[]
}

export interface OpenCodeSystemPromptInvocationBoundaryProjection {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-system-prompt-invocation-boundary-projection"
  fixtureID: "opencode-prompt:system-invocation-boundary-projection"
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  boundaryOrder: OpenCodeSystemPromptInvocationBoundaryID[]
  records: OpenCodeSystemPromptInvocationBoundaryRecord[]
  coveredBoundaries: OpenCodeSystemPromptInvocationBoundaryID[]
  retainedFields: string[]
  sideEffectMarkers: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeSystemPromptInvocationBoundaryIssue {
  id: string
  boundaryID?: OpenCodeSystemPromptInvocationBoundaryID
  message: string
}

export interface OpenCodeSystemPromptInvocationBoundaryVerification {
  ok: boolean
  issues: OpenCodeSystemPromptInvocationBoundaryIssue[]
}

export type OpenCodeSystemPromptProviderMessageSlotID = OpenCodeSystemPromptInvocationBoundaryID
export type OpenCodeSystemPromptProviderMessageRole = "system" | "user" | "assistant" | "tool"

export interface OpenCodeSystemPromptProviderMessageRecord {
  slotID: OpenCodeSystemPromptProviderMessageSlotID
  sourceOrder: number
  upstreamPath: string
  upstreamSymbol: string
  providerMessageRole: OpenCodeSystemPromptProviderMessageRole
  providerRequestSlot: string
  source: OpenCodeSystemPromptRuntimeOutputSource
  harnessSegment?: string
  retainedFields?: string[]
  serializationMarkers?: string[]
  lossyFields?: string[]
}

export interface OpenCodeSystemPromptProviderMessageProjection {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-system-prompt-provider-message-projection"
  fixtureID: "opencode-prompt:provider-message-projection"
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  slotOrder: OpenCodeSystemPromptProviderMessageSlotID[]
  records: OpenCodeSystemPromptProviderMessageRecord[]
  coveredSlots: OpenCodeSystemPromptProviderMessageSlotID[]
  retainedFields: string[]
  serializationMarkers: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeSystemPromptProviderMessageIssue {
  id: string
  slotID?: OpenCodeSystemPromptProviderMessageSlotID
  message: string
}

export interface OpenCodeSystemPromptProviderMessageVerification {
  ok: boolean
  issues: OpenCodeSystemPromptProviderMessageIssue[]
}

export interface OpenCodeSystemPromptLiveRuntimeFixtureInput {
  cwd: string
  mode?: string
  model?: LegoModel
  resources?: OpenCodePromptResource[]
  references?: OpenCodePromptReferenceAttachment[]
  now?: Date
  structuredOutputSchema?: string
  userSystem?: string
  pluginID?: string
}

export interface OpenCodeSystemPromptLiveRuntimeProviderMessageReadback {
  slotID: OpenCodeSystemPromptProviderMessageSlotID
  providerMessageRole: OpenCodeSystemPromptProviderMessageRole
  providerRequestSlot: string
  source: OpenCodeSystemPromptRuntimeOutputSource
  harnessSegment: string | null
  contentSha256: string | null
  sequence: number
}

export interface OpenCodeSystemPromptLiveRuntimeFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-system-prompt-live-runtime-fixture"
  fixtureID: "opencode-prompt:live-runtime-fixture"
  exactDiffStatus: "live-runtime-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  cwd: string
  mode: OpenCodeAgentPromptMode
  providerID: string
  modelID: string
  capturedAt: string
  orderingReadback: {
    promptAsset: OpenCodeSystemPromptBaseID
    segmentOrder: string[]
    renderedResourceNames: string[]
    includedSkillNames: string[]
    deniedSkillNames: string[]
    referenceNames: string[]
    assembledSha256: string
  }
  capturedOutputStepIDs: OpenCodeSystemPromptRuntimeProjectedOutputStepID[]
  capturedBoundaryIDs: OpenCodeSystemPromptInvocationBoundaryID[]
  capturedProviderSlotIDs: OpenCodeSystemPromptProviderMessageSlotID[]
  runtimeOutputProjection: OpenCodeSystemPromptRuntimeOutputProjection
  invocationBoundaryProjection: OpenCodeSystemPromptInvocationBoundaryProjection
  providerMessageProjection: OpenCodeSystemPromptProviderMessageProjection
  providerMessageReadback: OpenCodeSystemPromptLiveRuntimeProviderMessageReadback[]
  structuredOutputReadback: {
    schemaSha256: string
    providerRequestSlot: string
    sequence: number
  }
  userSystemReadback: {
    contentSha256: string
    providerRequestSlot: string
    sequence: number
  }
  pluginTransformReadback: OpenCodeSystemPromptRuntimePluginTransformProjection
  referenceReadback: OpenCodeSystemPromptRuntimeReferenceAttachmentProjection
  retainedFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeSystemPromptLiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeSystemPromptLiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeSystemPromptLiveRuntimeFixtureIssue[]
}

export type OpenCodeLLMRequestSystemExactPluginOperation =
  | { type: "append-system"; content: string }
  | { type: "replace-system"; index: number; content: string }

export interface OpenCodeLLMRequestSystemExactFixtureInput {
  model?: LegoModel
  agentPrompt?: string
  system: string[]
  userSystem?: string
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>
  pluginOperations?: OpenCodeLLMRequestSystemExactPluginOperation[]
  isOpenaiOauth?: boolean
  isWorkflow?: boolean
}

export interface OpenCodeLLMRequestSystemExactSourceRef {
  path: "packages/opencode/src/session/llm/request.ts" | "packages/opencode/src/session/system.ts"
  sha256: string
  anchors: string[]
}

export interface OpenCodeLLMRequestSystemExactMessage {
  role: "system" | "user" | "assistant"
  contentSha256: string
  content: string
  source: "prepared-system" | "input-message"
  index: number
}

export interface OpenCodeLLMRequestSystemExactFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-llm-request-system-exact-fixture"
  fixtureID: "opencode-prompt:llm-request-system-exact-fixture"
  exactDiffStatus: "pinned-upstream-source-exact"
  coverageStatus: "native-exact-subpath"
  nativeParityClaim: true
  sourceRefs: OpenCodeLLMRequestSystemExactSourceRef[]
  providerID: string
  modelID: string
  systemBeforePlugin: string[]
  systemAfterPlugin: string[]
  collapseApplied: boolean
  preparedMessages: OpenCodeLLMRequestSystemExactMessage[]
  retainedFields: string[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeLLMRequestSystemExactFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeLLMRequestSystemExactFixtureVerification {
  ok: boolean
  issues: OpenCodeLLMRequestSystemExactFixtureIssue[]
}

export interface OpenCodeSystemPromptLiveUpstreamExactDiffFixtureInput {
  cwd: string
  mode?: string
  model?: LegoModel
  resources?: OpenCodePromptResource[]
  references?: OpenCodePromptReferenceAttachment[]
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>
  userSystem?: string
  structuredOutputSystem?: string
  pluginOperations?: OpenCodeLLMRequestSystemExactPluginOperation[]
  harnessFixture?: OpenCodeLLMRequestSystemExactFixture
  now?: Date
}

export interface OpenCodeSystemPromptLiveUpstreamExactDiffRecord {
  index: number
  roleMatches: boolean
  contentMatches: boolean
  upstreamRole: "system" | "user" | "assistant" | null
  harnessRole: "system" | "user" | "assistant" | null
  upstreamSha256: string | null
  harnessSha256: string | null
}

export interface OpenCodeSystemPromptLiveUpstreamExactDiffFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-system-prompt-live-upstream-exact-diff-fixture"
  fixtureID: "opencode-prompt:live-upstream-exact-diff-fixture"
  exactDiffStatus: "live-upstream-exact-diff"
  coverageStatus: "native"
  nativeParityClaim: true
  sourceRefs: OpenCodePinnedUpstreamSystemPromptSource[]
  cwd: string
  mode: OpenCodeAgentPromptMode
  providerID: string
  modelID: string
  promptAsset: OpenCodePromptAssetName
  upstreamFixture: OpenCodeLLMRequestSystemExactFixture
  harnessFixture: OpenCodeLLMRequestSystemExactFixture
  diffRecords: OpenCodeSystemPromptLiveUpstreamExactDiffRecord[]
  mismatchCount: number
  retainedFields: string[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeSystemPromptLiveUpstreamExactDiffFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeSystemPromptLiveUpstreamExactDiffFixtureVerification {
  ok: boolean
  issues: OpenCodeSystemPromptLiveUpstreamExactDiffFixtureIssue[]
}

export interface OpenCodeSystemPromptCoreExactSourceRef {
  path: "packages/opencode/src/session/system.ts" | "packages/opencode/src/skill/index.ts"
  sha256: string
  anchors: string[]
}

export interface OpenCodeSystemPromptCoreExactProviderCase {
  modelAPIID: string
  expectedPromptAsset: OpenCodePromptAssetName
  promptSha256: string
  sourceBranch: string
}

export interface OpenCodeSystemPromptCoreExactEnvironmentReadback {
  directory: string
  worktree: string
  vcs: "git" | "none"
  platform: NodeJS.Platform
  dateString: string
  output: string[]
  outputSha256: string
}

export interface OpenCodeSystemPromptCoreExactSkill {
  name: string
  description?: string
  location: string
}

export interface OpenCodeSystemPromptCoreExactSkillsReadback {
  permissionDisabledOutput: null
  allowedOutput: string
  allowedOutputSha256: string
  sortedSkillNames: string[]
}

export interface OpenCodeSystemPromptCoreExactLocalDivergence {
  id: "copilot-gpt-5-local-extension"
  upstreamModelAPIID: "gpt-5"
  upstreamPromptAsset: "gpt"
  localProviderID: "github-copilot"
  localModelID: "gpt-5"
  localPromptAsset: OpenCodePromptAssetName
}

export interface OpenCodeSystemPromptCoreExactFixtureInput {
  model?: LegoModel
  directory?: string
  worktree?: string
  vcs?: "git" | "none"
  now?: Date
  providerModelAPIIDs?: string[]
  skills?: OpenCodeSystemPromptCoreExactSkill[]
}

export interface OpenCodeSystemPromptCoreExactFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-system-prompt-core-exact-fixture"
  fixtureID: "opencode-prompt:system-prompt-core-exact-fixture"
  exactDiffStatus: "pinned-upstream-source-exact"
  coverageStatus: "native-exact-subpath"
  nativeParityClaim: true
  sourceRefs: OpenCodeSystemPromptCoreExactSourceRef[]
  providerID: string
  modelID: string
  providerBranchCases: OpenCodeSystemPromptCoreExactProviderCase[]
  environmentReadback: OpenCodeSystemPromptCoreExactEnvironmentReadback
  skillsReadback: OpenCodeSystemPromptCoreExactSkillsReadback
  retainedFields: string[]
  knownLocalDivergences: OpenCodeSystemPromptCoreExactLocalDivergence[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeSystemPromptCoreExactFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeSystemPromptCoreExactFixtureVerification {
  ok: boolean
  issues: OpenCodeSystemPromptCoreExactFixtureIssue[]
}

export interface OpenCodeUpstreamSystemPromptOutputStep {
  id: string
  outputIndex: number
  upstreamPath: string
  upstreamExpectation: string
  upstreamOutputSource: string
  upstreamRequestSlot: string
  sourceAnchorStatus: OpenCodeUpstreamSystemPromptAnchorStatus
  renderedSegmentKind?: OpenCodeSystemPromptSegmentKind
  renderedSegmentName?: string
  renderedSha256?: string
  status: OpenCodeUpstreamSystemPromptAnchorStatus
  evidence?: string
  gap?: string
}

export interface OpenCodeUpstreamSystemPromptOutputMatrixCase {
  name: string
  mode: OpenCodeAgentPromptMode
  providerID: string
  modelID: string
  promptAsset: OpenCodeSystemPromptBaseID
  sourceMatrixFingerprint: string
  renderedFingerprint: string
  upstreamRequestOrder: string[]
  upstreamOutputOrder: string[]
  renderedSegmentOrder: string[]
  outputSteps: OpenCodeUpstreamSystemPromptOutputStep[]
  matchedOutputStepIDs: string[]
  partialOutputStepIDs: string[]
  missingOutputStepIDs: string[]
  assembledSha256: string
  status: "pinned-output-partial"
}

export interface OpenCodeUpstreamSystemPromptOutputMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  cwd: string
  evidenceRef: "conformance:opencode-upstream-system-prompt-output-matrix"
  fixtureID: "opencode-prompt:upstream-system-output-matrix"
  sourceMatrixFingerprint: string
  sourceRefs: OpenCodePinnedUpstreamSystemPromptSource[]
  cases: OpenCodeUpstreamSystemPromptOutputMatrixCase[]
  matchedOutputStepIDs: string[]
  partialOutputStepIDs: string[]
  missingOutputStepIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeSystemPromptOrderingSnapshotOptions {
  mode?: string
  model?: LegoModel
  resources?: OpenCodePromptResource[]
  references?: OpenCodePromptReferenceAttachment[]
  now?: Date
  runtimeOutputProjection?: OpenCodeSystemPromptRuntimeOutputProjection
}

export interface OpenCodeSystemPromptOrderingPolicy {
  includedSkillNames: string[]
  deniedSkillNames: string[]
}

export interface OpenCodeSystemPromptOrderingSnapshotInput {
  cwd: string
  mode: OpenCodeAgentPromptMode
  model?: LegoModel
  resources: OpenCodePromptResource[]
  references?: OpenCodePromptReferenceAttachment[]
  now?: Date
  runtimeOutputProjection?: OpenCodeSystemPromptRuntimeOutputProjection
  policy: OpenCodeSystemPromptOrderingPolicy
}

const OPENCODE_UPSTREAM_REF = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const
const OPENCODE_STRUCTURED_OUTPUT_SYSTEM_PROMPT =
  "IMPORTANT: The user has requested structured output. You MUST use the StructuredOutput tool to provide your final response. Do NOT respond with plain text - you MUST call the StructuredOutput tool with your answer formatted according to the schema."

const OPENCODE_PROMPT_RUNTIME_PROJECTED_OUTPUT_STEP_ORDER: OpenCodeSystemPromptRuntimeProjectedOutputStepID[] = [
  "prompt-input:structured-output-system",
  "prompt-input:user-system",
  "plugin:experimental-chat-system-transform",
  "session-prompt:reference-attachment",
]

export const OPENCODE_SYSTEM_PROMPT_INVOCATION_BOUNDARY_ORDER: OpenCodeSystemPromptInvocationBoundaryID[] = [
  "llm-request:provider-or-agent-prompt",
  "session-system:environment",
  "session-instruction:system",
  "session-system:skills",
  "prompt-input:structured-output-system",
  "prompt-input:user-system",
  "plugin:experimental-chat-system-transform",
  "session-prompt:reference-attachment",
]

export const OPENCODE_SYSTEM_PROMPT_PROVIDER_MESSAGE_SLOT_ORDER: OpenCodeSystemPromptProviderMessageSlotID[] = [
  ...OPENCODE_SYSTEM_PROMPT_INVOCATION_BOUNDARY_ORDER,
]

const OPENCODE_PROMPT_RUNTIME_PROJECTED_OUTPUT_STEP_GAPS: Record<OpenCodeSystemPromptRuntimeProjectedOutputStepID, string> = {
  "prompt-input:structured-output-system": "structured-output-system-prompt-output-not-exact",
  "prompt-input:user-system": "prompt-input-user-system-output-not-exact",
  "plugin:experimental-chat-system-transform": "plugin-system-transform-side-effects-not-exact",
  "session-prompt:reference-attachment": "reference-attachment-synthetic-message-output-path-not-exact",
}

const OPENCODE_SYSTEM_PROMPT_LIVE_RUNTIME_FIXTURE_GAPS = [
  "opencode-system-prompt-live-runtime-fixture-partial-native-gap",
  "opencode-system-prompt-live-runtime-not-spawned",
  "opencode-system-prompt-provider-message-object-identity-not-exact",
  "opencode-system-prompt-provider-message-serialization-not-exact",
  "opencode-system-prompt-provider-serialization-tokenization-not-exact",
  "opencode-system-prompt-plugin-transform-side-effects-not-exact",
  "opencode-system-prompt-plugin-transform-post-serialization-not-exact",
  "opencode-system-prompt-structured-output-system-not-exact",
  "opencode-system-prompt-user-system-output-not-exact",
  "opencode-system-prompt-reference-attachment-message-part-not-exact",
] as const

const OPENCODE_UPSTREAM_SYSTEM_PROMPT_SOURCES: OpenCodePinnedUpstreamSystemPromptSource[] = [
  {
    path: "packages/opencode/src/session/system.ts",
    sha256: "ffd848b0be54d2bb43626a4df6b5d5c76c3d94558dfce971c6102060d3119f17",
    anchors: [
      "SystemPrompt.provider(model)",
      "SystemPrompt.environment(model)",
      "SystemPrompt.skills(agent)",
    ],
  },
  {
    path: "packages/opencode/src/session/prompt.ts",
    sha256: "7714ff26a3e20f43fae92b9250365b40733d440235c22c10f6c854c0a05aa4f3",
    anchors: [
      "sys.skills(agent), sys.environment(model), instruction.system(), MessageV2.toModelMessagesEffect(msgs, model)",
      "const system = [...env, ...instructions, ...(skills ? [skills] : [])]",
      "json_schema appends STRUCTURED_OUTPUT_SYSTEM_PROMPT",
    ],
  },
  {
    path: "packages/opencode/src/session/llm/request.ts",
    sha256: "03fb806ef79cb216b3cba5b57d5dd1323a190ce67b2092b10dad571c09b4d150",
    anchors: [
      "agent.prompt ? [agent.prompt] : SystemPrompt.provider(input.model)",
      "...input.system",
      "...(input.user.system ? [input.user.system] : [])",
      "experimental.chat.system.transform",
      "collapse extra system chunks after plugin transform",
    ],
  },
  {
    path: "packages/opencode/src/session/prompt/reference.ts",
    sha256: "6d7432adeb322c0585212cb6f65eebad3e89a36067cdd6045de4d2d82f2b9a33",
    anchors: [
      "ReferencePrompt.referenceTextPart",
      "synthetic text part with reference metadata",
    ],
  },
  {
    path: "packages/opencode/src/session/instruction.ts",
    sha256: "c5be1ea21f91665d8defc9c1f9071438d224fc1f9c41d96a117bec3e1a986a04",
    anchors: [
      "Instruction.systemPaths() first global/project match plus config.instructions",
      "Instruction.system() renders Instructions from: <path>",
    ],
  },
  {
    path: "packages/opencode/src/skill/index.ts",
    sha256: "db01aa0d7649946a74f44c2c8ea3f3c38164bb2014b365f562d9cef0834be55c",
    anchors: [
      "Skill.available(agent) filters Permission.evaluate('skill', skill.name, agent.permission)",
      "Skill.fmt(list, { verbose: true }) renders <available_skills>",
    ],
  },
]

const OPENCODE_LLM_REQUEST_SYSTEM_EXACT_SOURCES: OpenCodeLLMRequestSystemExactSourceRef[] = [
  {
    path: "packages/opencode/src/session/system.ts",
    sha256: "ffd848b0be54d2bb43626a4df6b5d5c76c3d94558dfce971c6102060d3119f17",
    anchors: [
      "SystemPrompt.provider(model)",
      "provider prompt asset selection falls back to default when no model branch matches",
    ],
  },
  {
    path: "packages/opencode/src/session/llm/request.ts",
    sha256: "03fb806ef79cb216b3cba5b57d5dd1323a190ce67b2092b10dad571c09b4d150",
    anchors: [
      "const system = [[...(agent.prompt ? [agent.prompt] : SystemPrompt.provider(input.model)), ...input.system, ...(input.user.system ? [input.user.system] : [])].filter((x) => x).join('\\n')]",
      "experimental.chat.system.transform mutates the system array before provider messages are prepared",
      "if (system.length > 2 && system[0] === header) collapse extra system chunks after plugin transform",
      "non-oauth/non-workflow requests prepend system.map(({ role: 'system', content })) before input.messages",
    ],
  },
]

const OPENCODE_SYSTEM_PROMPT_CORE_EXACT_SOURCES: OpenCodeSystemPromptCoreExactSourceRef[] = [
  {
    path: "packages/opencode/src/session/system.ts",
    sha256: "ffd848b0be54d2bb43626a4df6b5d5c76c3d94558dfce971c6102060d3119f17",
    anchors: [
      "SystemPrompt.provider(model) model.api.id prompt asset branch table",
      "SystemPrompt.environment(model) InstanceState context environment block",
      "SystemPrompt.skills(agent) permission gate plus Skill.fmt(list, { verbose: true })",
    ],
  },
  {
    path: "packages/opencode/src/skill/index.ts",
    sha256: "db01aa0d7649946a74f44c2c8ea3f3c38164bb2014b365f562d9cef0834be55c",
    anchors: [
      "Skill.available(agent) sorts skills and filters Permission.evaluate(...).action !== 'deny'",
      "Skill.fmt(list, { verbose: true }) emits <available_skills> XML",
      "Skill.fmt empty described list returns No skills are currently available.",
    ],
  },
]

const OPENCODE_SYSTEM_PROMPT_CORE_EXACT_PROVIDER_MODEL_API_IDS = [
  "gpt-4.1",
  "o1-preview",
  "o3-mini",
  "gpt-5-codex",
  "gpt-5",
  "gemini-2.5-pro",
  "claude-sonnet-4-5",
  "trinity-mini",
  "moonshotai/kimi-k2",
  "llama-3.1",
] as const

const OPENCODE_PROMPT_ASSETS = {
  default: loadOpenCodePromptAsset("default.txt"),
  anthropic: loadOpenCodePromptAsset("anthropic.txt"),
  beast: loadOpenCodePromptAsset("beast.txt"),
  codex: loadOpenCodePromptAsset("codex.txt"),
  "copilot-gpt-5": loadOpenCodePromptAsset("copilot-gpt-5.txt"),
  gemini: loadOpenCodePromptAsset("gemini.txt"),
  gpt: loadOpenCodePromptAsset("gpt.txt"),
  kimi: loadOpenCodePromptAsset("kimi.txt"),
  plan: loadOpenCodePromptAsset("plan.txt"),
  "plan-mode": loadOpenCodePromptAsset("plan-mode.txt"),
  "plan-reminder-anthropic": loadOpenCodePromptAsset("plan-reminder-anthropic.txt"),
  trinity: loadOpenCodePromptAsset("trinity.txt"),
} as const

export type OpenCodePromptAssetName = keyof typeof OPENCODE_PROMPT_ASSETS

const OPENCODE_CUSTOMIZE_SKILL_NAME = "customize-opencode"
const OPENCODE_CUSTOMIZE_SKILL_DESCRIPTION = "Use ONLY when the user is editing or creating opencode's own configuration: opencode.json, opencode.jsonc, files under .opencode/, or files under ~/.config/opencode/. Also use when creating or fixing opencode agents, subagents, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring opencode itself."
const OPENCODE_CUSTOMIZE_SKILL_BODY = loadOpenCodePromptAsset("skills/customize-opencode.md")

export function openCodePromptAsset(name: OpenCodePromptAssetName): string {
  return OPENCODE_PROMPT_ASSETS[name]
}

export function openCodePromptAssetNames(): OpenCodePromptAssetName[] {
  return Object.keys(OPENCODE_PROMPT_ASSETS).sort() as OpenCodePromptAssetName[]
}

export function openCodePromptAssetForModel(model?: LegoModel): OpenCodePromptAssetName {
  const id = [model?.providerID, model?.modelID, model?.name].filter(Boolean).join("/").toLowerCase()
  if (id.includes("copilot") && id.includes("gpt-5")) return "copilot-gpt-5"
  if (id.includes("gpt-4") || id.includes("o1") || id.includes("o3")) return "beast"
  if (id.includes("gpt")) return id.includes("codex") ? "codex" : "gpt"
  if (id.includes("gemini-") || id.includes("google/gemini")) return "gemini"
  if (id.includes("anthropic") || id.includes("claude")) return "anthropic"
  if (id.includes("trinity")) return "trinity"
  if (id.includes("kimi")) return "kimi"
  return "default"
}

export function openCodeSystemPromptProviderAssetForUpstreamModelID(modelAPIID: string): OpenCodePromptAssetName {
  if (modelAPIID.includes("gpt-4") || modelAPIID.includes("o1") || modelAPIID.includes("o3")) return "beast"
  if (modelAPIID.includes("gpt")) return modelAPIID.includes("codex") ? "codex" : "gpt"
  if (modelAPIID.includes("gemini-")) return "gemini"
  if (modelAPIID.includes("claude")) return "anthropic"
  if (modelAPIID.toLowerCase().includes("trinity")) return "trinity"
  if (modelAPIID.toLowerCase().includes("kimi")) return "kimi"
  return "default"
}

export function openCodeAgentPrompt(mode: string = "build", model?: LegoModel): string {
  const normalized = normalizeOpenCodeAgentMode(mode)
  if (normalized === "plan") return OPENCODE_PLAN_PROMPT
  if (normalized === "compaction") return OPENCODE_COMPACTION_PROMPT
  return openCodePromptAsset(openCodePromptAssetForModel(model))
}

export function openCodeStructuredOutputSystemPrompt(): string {
  return OPENCODE_STRUCTURED_OUTPUT_SYSTEM_PROMPT
}

export function openCodeInstructionResourcePrompt(resource: OpenCodePromptResource): string {
  return `Instructions from: ${resource.path ?? resource.name}\n${resource.content.trim()}`
}

export function openCodeReferencePromptText(reference: OpenCodePromptReferenceAttachment): string {
  const lines = [
    `Referenced configured reference @${reference.name}.`,
    ...(reference.path ? ["Kind: local directory", `Reference root: ${reference.path}`] : []),
    "For targeted context, inspect the reference path directly with Read, Glob, and Grep. For broader research, call the task tool with subagent scout and include this reference path.",
  ]
  return lines.join("\n")
}

export function openCodeSystemPromptBaseID(mode: OpenCodeAgentPromptMode, model?: LegoModel): OpenCodeSystemPromptBaseID {
  if (mode === "plan") return "plan-composite"
  if (mode === "compaction") return "compaction-summary"
  return openCodePromptAssetForModel(model)
}

export function normalizeOpenCodeAgentMode(mode: string): OpenCodeAgentPromptMode {
  if (mode === "plan" || mode === "general" || mode === "subagent" || mode === "compaction") return mode
  return "build"
}

export function openCodeEnvironmentPrompt(cwd = process.cwd(), model?: LegoModel, now = new Date()): string {
  const modelID = String(model?.modelID ?? "unknown")
  const providerID = String(model?.providerID ?? "unknown")
  const workingDirectory = resolve(cwd)
  const gitWorkspaceRoot = findGitWorkspaceRoot(workingDirectory)
  const workspaceRoot = gitWorkspaceRoot ?? workingDirectory
  return [
    `You are powered by the model named ${modelID}.\nThe exact model ID is ${providerID}/${modelID}`,
    "Here is some useful information about the environment you are running in:",
    "",
    ` Working directory: ${workingDirectory}`,
    ` Workspace root folder: ${workspaceRoot}`,
    ` Is directory a git repo: ${gitWorkspaceRoot ? "yes" : "no"}`,
    ` Platform: ${process.platform}`,
    ` Today's date: ${now.toDateString()}`,
    "",
  ].join("\n")
}

export function openCodeSkillsPrompt(resources: OpenCodePromptResource[]): string {
  const skills = resources
    .filter((resource) => resource.kind === "skill")
    .map((resource) => ({
      name: resource.name,
      description: typeof resource.metadata?.["description"] === "string" ? resource.metadata["description"] : undefined,
      location: typeof resource.metadata?.["location"] === "string" ? resource.metadata["location"] : resource.path ?? resource.name,
    }))
    .filter((skill): skill is { name: string; description: string; location: string } => typeof skill.description === "string" && skill.description.trim().length > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
  if (skills.length === 0) return ""
  return [
    "Skills provide specialized instructions and workflows for specific tasks.",
    "Use the skill tool to load a skill when a task matches its description.",
    "<available_skills>",
    ...skills.flatMap((skill) => [
      "  <skill>",
      `    <name>${escapeOpenCodeSkillXML(skill.name)}</name>`,
      `    <description>${escapeOpenCodeSkillXML(skill.description)}</description>`,
      `    <location>${formatOpenCodeSkillLocation(skill.location)}</location>`,
      "  </skill>",
    ]),
    "</available_skills>",
  ].join("\n")
}

export function captureOpenCodeSystemPromptCoreExactFixture(input: OpenCodeSystemPromptCoreExactFixtureInput = {}): OpenCodeSystemPromptCoreExactFixture {
  const model = input.model ?? { providerID: "openai-compatible", modelID: "gpt-5" }
  const directory = resolve(input.directory ?? "/repo")
  const worktree = resolve(input.worktree ?? directory)
  const vcs = input.vcs ?? "git"
  const now = input.now ?? new Date("2026-06-10T00:00:00.000Z")
  const providerModelAPIIDs = uniqueStrings([
    ...OPENCODE_SYSTEM_PROMPT_CORE_EXACT_PROVIDER_MODEL_API_IDS,
    ...(input.providerModelAPIIDs ?? []),
  ])
  const providerBranchCases = providerModelAPIIDs.map((modelAPIID): OpenCodeSystemPromptCoreExactProviderCase => {
    const expectedPromptAsset = openCodeSystemPromptProviderAssetForUpstreamModelID(modelAPIID)
    return {
      modelAPIID,
      expectedPromptAsset,
      promptSha256: sha256Hex(openCodePromptAsset(expectedPromptAsset)),
      sourceBranch: openCodeSystemPromptProviderSourceBranch(modelAPIID, expectedPromptAsset),
    }
  })
  const environmentOutput = openCodeSystemPromptCoreExactEnvironmentOutput({
    modelID: String(model.modelID ?? "unknown"),
    providerID: String(model.providerID ?? "unknown"),
    directory,
    worktree,
    vcs,
    now,
  })
  const skills = (input.skills ?? [
    {
      name: "exact-request",
      description: "Use when validating the exact upstream SystemPrompt.skills core path.",
      location: ".opencode/skills/exact-request/SKILL.md",
    },
    {
      name: "z-output-check",
      description: "Use when checking stable verbose skill sorting.",
      location: ".opencode/skills/z-output-check/SKILL.md",
    },
  ]).map((skill) => ({
    name: skill.name,
    ...(skill.description !== undefined ? { description: skill.description } : {}),
    location: skill.location,
  }))
  const allowedOutput = openCodeSystemPromptCoreExactSkillsOutput(skills)
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: OPENCODE_UPSTREAM_REF,
    evidenceRef: "conformance:opencode-system-prompt-core-exact-fixture" as const,
    fixtureID: "opencode-prompt:system-prompt-core-exact-fixture" as const,
    exactDiffStatus: "pinned-upstream-source-exact" as const,
    coverageStatus: "native-exact-subpath" as const,
    nativeParityClaim: true as const,
    sourceRefs: OPENCODE_SYSTEM_PROMPT_CORE_EXACT_SOURCES,
    providerID: String(model.providerID ?? "unknown"),
    modelID: String(model.modelID ?? "unknown"),
    providerBranchCases,
    environmentReadback: {
      directory,
      worktree,
      vcs,
      platform: process.platform,
      dateString: now.toDateString(),
      output: environmentOutput,
      outputSha256: sha256Hex(environmentOutput.join("\n\n")),
    },
    skillsReadback: {
      permissionDisabledOutput: null,
      allowedOutput,
      allowedOutputSha256: sha256Hex(allowedOutput),
      sortedSkillNames: skills.filter((skill) => skill.description !== undefined).map((skill) => skill.name).sort(),
    },
    retainedFields: [
      "SystemPrompt.provider(model)",
      "model.api.id",
      "prompt asset sha256",
      "SystemPrompt.environment(model)",
      "InstanceState.context.directory",
      "InstanceState.context.worktree",
      "InstanceState.context.project.vcs",
      "process.platform",
      "new Date().toDateString()",
      "SystemPrompt.skills(agent)",
      "Permission.disabled(['skill'], agent.permission)",
      "Skill.available(agent)",
      "Skill.fmt(list, { verbose: true })",
    ],
    knownLocalDivergences: [
      {
        id: "copilot-gpt-5-local-extension" as const,
        upstreamModelAPIID: "gpt-5" as const,
        upstreamPromptAsset: "gpt" as const,
        localProviderID: "github-copilot" as const,
        localModelID: "gpt-5" as const,
        localPromptAsset: openCodePromptAssetForModel({ providerID: "github-copilot", modelID: "gpt-5" }),
      },
    ],
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: sha256Hex(stableStringify(fixtureWithoutFingerprint)).slice(0, 16),
  }
}

export function verifyOpenCodeSystemPromptCoreExactFixture(
  fixture: OpenCodeSystemPromptCoreExactFixture,
): OpenCodeSystemPromptCoreExactFixtureVerification {
  const issues: OpenCodeSystemPromptCoreExactFixtureIssue[] = []
  const addIssue = (id: string, message: string) => issues.push({ id, message })
  if (fixture.fixtureID !== "opencode-prompt:system-prompt-core-exact-fixture" || fixture.evidenceRef !== "conformance:opencode-system-prompt-core-exact-fixture") {
    addIssue("opencode-system-prompt-core-exact.identity", "OpenCode SystemPrompt core exact fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== true || fixture.exactDiffStatus !== "pinned-upstream-source-exact" || fixture.coverageStatus !== "native-exact-subpath") {
    addIssue("opencode-system-prompt-core-exact.native-claim", "OpenCode SystemPrompt core exact fixture must claim only the native-exact SystemPrompt core subpath.")
  }
  if (fixture.knownLossiness.length !== 0) {
    addIssue("opencode-system-prompt-core-exact.lossiness", "OpenCode SystemPrompt core exact fixture cannot carry known lossiness.")
  }
  for (const source of OPENCODE_SYSTEM_PROMPT_CORE_EXACT_SOURCES) {
    const match = fixture.sourceRefs.find((candidate) => candidate.path === source.path)
    if (!match || match.sha256 !== source.sha256) {
      addIssue("opencode-system-prompt-core-exact.source-ref", `OpenCode SystemPrompt core exact fixture lost pinned source ${source.path}.`)
    }
  }
  const providerCases = new Map(fixture.providerBranchCases.map((item) => [item.modelAPIID, item]))
  for (const modelAPIID of OPENCODE_SYSTEM_PROMPT_CORE_EXACT_PROVIDER_MODEL_API_IDS) {
    const expectedPromptAsset = openCodeSystemPromptProviderAssetForUpstreamModelID(modelAPIID)
    const match = providerCases.get(modelAPIID)
    if (!match || match.expectedPromptAsset !== expectedPromptAsset || match.promptSha256 !== sha256Hex(openCodePromptAsset(expectedPromptAsset))) {
      addIssue("opencode-system-prompt-core-exact.provider-branch", `OpenCode SystemPrompt.provider exact fixture lost branch ${modelAPIID} -> ${expectedPromptAsset}.`)
    }
  }
  if (!fixture.providerBranchCases.some((item) => item.modelAPIID === "gpt-5" && item.expectedPromptAsset === "gpt")) {
    addIssue("opencode-system-prompt-core-exact.provider-gpt5", "OpenCode SystemPrompt.provider exact fixture must retain pinned upstream gpt-5 -> gpt behavior.")
  }
  const expectedEnvironment = openCodeSystemPromptCoreExactEnvironmentOutput({
    modelID: fixture.modelID,
    providerID: fixture.providerID,
    directory: fixture.environmentReadback.directory,
    worktree: fixture.environmentReadback.worktree,
    vcs: fixture.environmentReadback.vcs,
    now: new Date(`${fixture.environmentReadback.dateString} 00:00:00`),
  })
  if (fixture.environmentReadback.output.join("\n") !== expectedEnvironment.join("\n")) {
    addIssue("opencode-system-prompt-core-exact.environment", "OpenCode SystemPrompt.environment exact fixture no longer matches pinned upstream environment output.")
  }
  const expectedEnvironmentSha = sha256Hex(fixture.environmentReadback.output.join("\n\n"))
  if (fixture.environmentReadback.outputSha256 !== expectedEnvironmentSha) {
    addIssue("opencode-system-prompt-core-exact.environment-sha", "OpenCode SystemPrompt.environment exact fixture output hash changed.")
  }
  if (fixture.skillsReadback.permissionDisabledOutput !== null || !fixture.skillsReadback.allowedOutput.includes("<available_skills>")) {
    addIssue("opencode-system-prompt-core-exact.skills", "OpenCode SystemPrompt.skills exact fixture must retain disabled undefined branch and verbose skill output.")
  }
  if (fixture.skillsReadback.allowedOutputSha256 !== sha256Hex(fixture.skillsReadback.allowedOutput)) {
    addIssue("opencode-system-prompt-core-exact.skills-sha", "OpenCode SystemPrompt.skills exact fixture output hash changed.")
  }
  const divergence = fixture.knownLocalDivergences.find((item) => item.id === "copilot-gpt-5-local-extension")
  if (!divergence || divergence.upstreamPromptAsset !== "gpt" || divergence.localPromptAsset !== "copilot-gpt-5") {
    addIssue("opencode-system-prompt-core-exact.local-divergence", "OpenCode SystemPrompt core exact fixture must keep the local copilot-gpt-5 non-upstream branch visible.")
  }
  if (!fixture.retainedFields.includes("SystemPrompt.provider(model)") || !fixture.retainedFields.includes("SystemPrompt.environment(model)") || !fixture.retainedFields.includes("SystemPrompt.skills(agent)")) {
    addIssue("opencode-system-prompt-core-exact.retained-fields", "OpenCode SystemPrompt core exact fixture must retain provider, environment, and skills source symbols.")
  }
  const { fingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = sha256Hex(stableStringify(withoutFingerprint)).slice(0, 16)
  if (fingerprint !== expectedFingerprint) {
    addIssue("opencode-system-prompt-core-exact.fingerprint", "OpenCode SystemPrompt core exact fixture fingerprint no longer matches its exact output.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function openCodeSystemPromptCoreExactEnvironmentOutput(input: {
  modelID: string
  providerID: string
  directory: string
  worktree: string
  vcs: "git" | "none"
  now: Date
}): string[] {
  return [
    [
      `You are powered by the model named ${input.modelID}.\nThe exact model ID is ${input.providerID}/${input.modelID}`,
      "Here is some useful information about the environment you are running in:",
      "",
      ` Working directory: ${input.directory}`,
      ` Workspace root folder: ${input.worktree}`,
      ` Is directory a git repo: ${input.vcs === "git" ? "yes" : "no"}`,
      ` Platform: ${process.platform}`,
      ` Today's date: ${input.now.toDateString()}`,
      "",
    ].join("\n"),
  ]
}

function openCodeSystemPromptCoreExactSkillsOutput(skills: OpenCodeSystemPromptCoreExactSkill[]): string {
  return [
    "Skills provide specialized instructions and workflows for specific tasks.",
    "Use the skill tool to load a skill when a task matches its description.",
    openCodeSystemPromptCoreExactSkillFmt(skills, { verbose: true }),
  ].join("\n")
}

function openCodeSystemPromptCoreExactSkillFmt(skills: OpenCodeSystemPromptCoreExactSkill[], opts: { verbose: boolean }): string {
  const described = skills.filter((skill) => skill.description !== undefined)
  if (described.length === 0) return "No skills are currently available."
  if (opts.verbose) {
    return [
      "<available_skills>",
      ...[...described]
        .sort((left, right) => left.name.localeCompare(right.name))
        .flatMap((skill) => [
          "  <skill>",
          `    <name>${skill.name}</name>`,
          `    <description>${skill.description}</description>`,
          `    <location>${pathToFileURL(skill.location).href}</location>`,
          "  </skill>",
        ]),
      "</available_skills>",
    ].join("\n")
  }
  return [
    "## Available Skills",
    ...[...described]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((skill) => `- **${skill.name}**: ${skill.description}`),
  ].join("\n")
}

function openCodeSystemPromptProviderSourceBranch(modelAPIID: string, expectedPromptAsset: OpenCodePromptAssetName): string {
  if (modelAPIID.includes("gpt-4") || modelAPIID.includes("o1") || modelAPIID.includes("o3")) return "if model.api.id includes gpt-4/o1/o3 -> PROMPT_BEAST"
  if (modelAPIID.includes("gpt") && expectedPromptAsset === "codex") return "if model.api.id includes gpt and codex -> PROMPT_CODEX"
  if (modelAPIID.includes("gpt")) return "if model.api.id includes gpt -> PROMPT_GPT"
  if (modelAPIID.includes("gemini-")) return "if model.api.id includes gemini- -> PROMPT_GEMINI"
  if (modelAPIID.includes("claude")) return "if model.api.id includes claude -> PROMPT_ANTHROPIC"
  if (modelAPIID.toLowerCase().includes("trinity")) return "if lower(model.api.id) includes trinity -> PROMPT_TRINITY"
  if (modelAPIID.toLowerCase().includes("kimi")) return "if lower(model.api.id) includes kimi -> PROMPT_KIMI"
  return "fallback -> PROMPT_DEFAULT"
}

export function buildOpenCodeSystemPromptOrderingSnapshotFromPolicy(input: OpenCodeSystemPromptOrderingSnapshotInput): OpenCodeSystemPromptOrderingSnapshot {
  const rendered = buildOpenCodeRenderedSystemPromptSnapshotFromPolicy(input)
  return {
    ...rendered,
    segments: rendered.segments.map(({ content, ...segment }) => segment),
  }
}

export function buildOpenCodeRenderedSystemPromptSnapshotFromPolicy(input: OpenCodeSystemPromptOrderingSnapshotInput): OpenCodeRenderedSystemPromptSnapshot {
  const references = input.references ?? []
  const basePrompt = openCodeAgentPrompt(input.mode, input.model)
  const basePromptID = openCodeSystemPromptBaseID(input.mode, input.model)
  const environmentPrompt = openCodeEnvironmentPrompt(input.cwd, input.model, input.now ?? new Date())
  const includedSkillNames = new Set(input.policy.includedSkillNames)
  const skillResources = input.resources.filter((resource) => isOpenCodeSkillResource(resource) && includedSkillNames.has(resource.name))
  const skillPrompt = openCodeSkillsPrompt(skillResources)
  const resourceSegments = input.resources
    .filter((resource) => !isOpenCodeSkillResource(resource))
    .map((resource) => ({
      kind: "resource" as const,
      name: resource.name,
      content: renderOpenCodeResource(resource),
      source: resource.source,
      resourceKind: resource.kind,
    }))
  const rawSegments = [
    {
      kind: "base-prompt" as const,
      name: `opencode-prompt:${basePromptID}`,
      content: basePrompt,
      source: "model-runtime" as const,
    },
    {
      kind: "environment" as const,
      name: "opencode-environment",
      content: environmentPrompt,
      source: "model-runtime" as const,
    },
    ...resourceSegments,
    ...(skillPrompt
      ? [{
        kind: "skills" as const,
        name: "available_skills",
        content: skillPrompt,
        source: "model-runtime" as const,
        includedSkillNames: input.policy.includedSkillNames,
      }]
      : []),
    ...references.map((reference) => ({
      kind: "reference" as const,
      name: reference.name,
      content: renderOpenCodeReferenceAttachment(reference),
      source: "attachment" as const,
    })),
  ].filter((segment) => segment.content.trim().length > 0)
  const segments = rawSegments.map((segment, order): OpenCodeRenderedSystemPromptSegment => ({
    order,
    kind: segment.kind,
    name: segment.name,
    content: segment.content,
    sha256: sha256Hex(segment.content),
    lineCount: lineCount(segment.content),
    charCount: segment.content.length,
    ...(segment.source ? { source: segment.source } : {}),
    ...("resourceKind" in segment && segment.resourceKind ? { resourceKind: segment.resourceKind } : {}),
    ...("includedSkillNames" in segment && segment.includedSkillNames ? { includedSkillNames: segment.includedSkillNames } : {}),
  }))
  const assembledPrompt = rawSegments.map((segment) => segment.content).join("\n\n")
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: OPENCODE_UPSTREAM_REF,
    cwd: input.cwd,
    mode: input.mode,
    promptAsset: basePromptID,
    separator: "\n\n" as const,
    segments,
    segmentOrder: segments.map((segment) => `${segment.order}:${segment.kind}:${segment.name}`),
    renderedResourceNames: resourceSegments.map((segment) => segment.name),
    includedSkillNames: input.policy.includedSkillNames,
    deniedSkillNames: input.policy.deniedSkillNames,
    referenceNames: references.map((reference) => reference.name),
    assembledPrompt,
    assembledSha256: sha256Hex(assembledPrompt),
    knownGaps: [
      "upstream-live-system-prompt-invocation-not-fully-replayed",
      "dynamic-tool-and-permission-side-effects-partial",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: sha256Hex(stableStringify(snapshotWithoutFingerprint)).slice(0, 16),
  }
}

export function buildOpenCodeUpstreamSystemPromptMatrixSnapshotFromPolicy(input: OpenCodeSystemPromptOrderingSnapshotInput): OpenCodeUpstreamSystemPromptMatrixSnapshot {
  const rendered = buildOpenCodeRenderedSystemPromptSnapshotFromPolicy(input)
  const modelID = String(input.model?.modelID ?? "unknown")
  const providerID = String(input.model?.providerID ?? "unknown")
  const caseSnapshot = buildOpenCodeUpstreamSystemPromptMatrixCase(rendered, providerID, modelID)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: OPENCODE_UPSTREAM_REF,
    cwd: input.cwd,
    sourceRefs: OPENCODE_UPSTREAM_SYSTEM_PROMPT_SOURCES,
    cases: [caseSnapshot],
    provenAnchors: uniqueStrings(caseSnapshot.matchedAnchorIDs),
    partialAnchors: uniqueStrings(caseSnapshot.partialAnchorIDs),
    missingAnchors: uniqueStrings(caseSnapshot.missingAnchorIDs),
    knownGaps: uniqueStrings([
      ...rendered.knownGaps,
      ...caseSnapshot.anchors.flatMap((anchor) => anchor.gap ? [anchor.gap] : []),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: sha256Hex(stableStringify(snapshotWithoutFingerprint)).slice(0, 16),
  }
}

export function buildOpenCodeUpstreamSystemPromptOutputMatrixSnapshotFromPolicy(input: OpenCodeSystemPromptOrderingSnapshotInput): OpenCodeUpstreamSystemPromptOutputMatrixSnapshot {
  const rendered = buildOpenCodeRenderedSystemPromptSnapshotFromPolicy(input)
  const sourceMatrix = buildOpenCodeUpstreamSystemPromptMatrixSnapshotFromPolicy(input)
  const modelID = String(input.model?.modelID ?? "unknown")
  const providerID = String(input.model?.providerID ?? "unknown")
  const caseSnapshot = buildOpenCodeUpstreamSystemPromptOutputMatrixCase(rendered, sourceMatrix, providerID, modelID, input.runtimeOutputProjection)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: OPENCODE_UPSTREAM_REF,
    cwd: input.cwd,
    evidenceRef: "conformance:opencode-upstream-system-prompt-output-matrix" as const,
    fixtureID: "opencode-prompt:upstream-system-output-matrix" as const,
    sourceMatrixFingerprint: sourceMatrix.fingerprint,
    sourceRefs: sourceMatrix.sourceRefs,
    cases: [caseSnapshot],
    matchedOutputStepIDs: uniqueStrings(caseSnapshot.matchedOutputStepIDs),
    partialOutputStepIDs: uniqueStrings(caseSnapshot.partialOutputStepIDs),
    missingOutputStepIDs: uniqueStrings(caseSnapshot.missingOutputStepIDs),
    knownGaps: uniqueStrings([
      ...rendered.knownGaps,
      ...sourceMatrix.knownGaps,
      ...caseSnapshot.outputSteps.flatMap((step) => step.gap ? [step.gap] : []),
      ...(input.runtimeOutputProjection?.knownGaps ?? []),
      "upstream-output-matrix-covered-by-partial-fixture",
      "live-opencode-runtime-not-spawned",
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: sha256Hex(stableStringify(snapshotWithoutFingerprint)).slice(0, 16),
  }
}

export function projectOpenCodeSystemPromptRuntimeOutputProjection(events: OpenCodeSystemPromptRuntimeOutputEvent[]): OpenCodeSystemPromptRuntimeOutputProjection {
  const systemChunks = events
    .filter((event): event is Extract<OpenCodeSystemPromptRuntimeOutputEvent, { type: "system.chunk" }> => event.type === "system.chunk")
    .map((event) => ({
      source: event.source,
      upstreamRequestSlot: event.upstreamRequestSlot,
      segmentName: typeof event.segmentName === "string" && event.segmentName.length > 0 ? event.segmentName : null,
      contentSha256: typeof event.contentSha256 === "string" && event.contentSha256.length > 0 ? event.contentSha256 : null,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.upstreamRequestSlot.localeCompare(right.upstreamRequestSlot) || left.source.localeCompare(right.source))

  const pluginTransforms = events
    .filter((event): event is Extract<OpenCodeSystemPromptRuntimeOutputEvent, { type: "plugin.transform" }> => event.type === "plugin.transform")
    .map((event) => ({
      pluginID: typeof event.pluginID === "string" && event.pluginID.length > 0 ? event.pluginID : null,
      beforeCount: event.beforeCount,
      afterCount: event.afterCount,
      mutatedSlots: uniqueStrings(event.mutatedSlots),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || (left.pluginID ?? "").localeCompare(right.pluginID ?? ""))

  const referenceAttachments = events
    .filter((event): event is Extract<OpenCodeSystemPromptRuntimeOutputEvent, { type: "reference.attachment" }> => event.type === "reference.attachment")
    .map((event) => ({
      name: event.name,
      path: typeof event.path === "string" && event.path.length > 0 ? event.path : null,
      mime: typeof event.mime === "string" && event.mime.length > 0 ? event.mime : null,
      syntheticMessagePartObserved: event.syntheticMessagePartObserved === true,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.name.localeCompare(right.name))

  const covered = new Set<OpenCodeSystemPromptRuntimeProjectedOutputStepID>()
  if (systemChunks.some((chunk) => chunk.source === "STRUCTURED_OUTPUT_SYSTEM_PROMPT")) covered.add("prompt-input:structured-output-system")
  if (systemChunks.some((chunk) => chunk.source === "input.user.system")) covered.add("prompt-input:user-system")
  if (pluginTransforms.length > 0) covered.add("plugin:experimental-chat-system-transform")
  if (referenceAttachments.length > 0) covered.add("session-prompt:reference-attachment")

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-prompt:runtime-system-output-projection" as const,
    evidenceRef: "conformance:opencode-system-prompt-runtime-output-projection" as const,
    coveredOutputStepIDs: OPENCODE_PROMPT_RUNTIME_PROJECTED_OUTPUT_STEP_ORDER.filter((stepID) => covered.has(stepID)),
    retainedFields: [
      "source",
      "upstreamRequestSlot",
      "segmentName",
      "contentSha256",
      "pluginID",
      "beforeCount",
      "afterCount",
      "mutatedSlots",
      "name",
      "path",
      "mime",
      "syntheticMessagePartObserved",
      "sequence",
    ],
    lossyFields: [
      "live SystemPrompt invocation side effects",
      "raw provider request message object identity",
      "plugin transform function execution side effects",
      "plugin transform collapse/mutation object identity",
      "structured output schema prompt exact text",
      "input.user.system original message identity",
      "synthetic reference message part object identity",
      "runtime tokenization and provider serialization effects",
    ],
    systemChunks,
    pluginTransforms,
    referenceAttachments,
    knownGaps: [
      "opencode-system-prompt-runtime-output-projection-partial-fixture",
      "opencode-system-prompt-live-runtime-not-spawned",
      "opencode-system-prompt-plugin-transform-side-effects-not-exact",
      "opencode-system-prompt-structured-output-system-not-exact",
      "opencode-system-prompt-user-system-output-not-exact",
      "opencode-system-prompt-reference-attachment-message-part-not-exact",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: sha256Hex(stableStringify(snapshotWithoutFingerprint)).slice(0, 16),
  }
}

export function projectOpenCodeSystemPromptInvocationBoundaryProjection(
  records: OpenCodeSystemPromptInvocationBoundaryRecord[],
): OpenCodeSystemPromptInvocationBoundaryProjection {
  const normalizedRecords = [...records]
    .map(({ harnessSegment, ...record }) => ({
      ...record,
      ...(typeof harnessSegment === "string" && harnessSegment.length > 0 ? { harnessSegment } : {}),
      retainedFields: uniqueStrings(record.retainedFields ?? []),
      sideEffectMarkers: uniqueStrings(record.sideEffectMarkers ?? []),
      lossyFields: uniqueStrings(record.lossyFields ?? []),
    }))
    .sort((left, right) => {
      const boundaryDelta = OPENCODE_SYSTEM_PROMPT_INVOCATION_BOUNDARY_ORDER.indexOf(left.boundaryID) - OPENCODE_SYSTEM_PROMPT_INVOCATION_BOUNDARY_ORDER.indexOf(right.boundaryID)
      return boundaryDelta === 0 ? left.sourceOrder - right.sourceOrder : boundaryDelta
    })
  const projectionWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: OPENCODE_UPSTREAM_REF,
    evidenceRef: "conformance:opencode-system-prompt-invocation-boundary-projection" as const,
    fixtureID: "opencode-prompt:system-invocation-boundary-projection" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    boundaryOrder: OPENCODE_SYSTEM_PROMPT_INVOCATION_BOUNDARY_ORDER,
    records: normalizedRecords,
    coveredBoundaries: uniqueOpenCodeSystemPromptInvocationBoundaries(normalizedRecords.map((record) => record.boundaryID)),
    retainedFields: uniqueStrings([
      "boundaryID",
      "sourceOrder",
      "upstreamPath",
      "upstreamSymbol",
      "upstreamRequestSlot",
      "harnessSegment",
      ...normalizedRecords.flatMap((record) => record.retainedFields ?? []),
    ]),
    sideEffectMarkers: uniqueStrings(normalizedRecords.flatMap((record) => record.sideEffectMarkers ?? [])),
    lossyFields: uniqueStrings([
      ...normalizedRecords.flatMap((record) => record.lossyFields ?? []),
      "live SystemPrompt invocation side effects",
      "raw provider request message object identity",
      "Instruction.system resource object identity",
      "plugin transform function execution side effects",
      "plugin transform collapse/mutation object identity",
      "structured output schema prompt exact text",
      "input.user.system original message identity",
      "synthetic reference message part object identity",
      "runtime tokenization and provider serialization effects",
    ]),
    knownGaps: [
      "opencode-system-prompt-invocation-boundary-projection-partial-fixture",
      "opencode-system-prompt-live-runtime-not-spawned",
      "opencode-system-prompt-provider-or-agent-prompt-object-not-exact",
      "opencode-system-prompt-instruction-resource-object-not-exact",
      "opencode-system-prompt-plugin-transform-side-effects-not-exact",
      "opencode-system-prompt-structured-output-system-not-exact",
      "opencode-system-prompt-user-system-output-not-exact",
      "opencode-system-prompt-reference-attachment-message-part-not-exact",
    ],
  }
  return {
    ...projectionWithoutFingerprint,
    fingerprint: sha256Hex(stableStringify(projectionWithoutFingerprint)).slice(0, 16),
  }
}

export function verifyOpenCodeSystemPromptInvocationBoundaryProjection(
  projection: OpenCodeSystemPromptInvocationBoundaryProjection,
): OpenCodeSystemPromptInvocationBoundaryVerification {
  const issues: OpenCodeSystemPromptInvocationBoundaryIssue[] = []
  if (projection.fixtureID !== "opencode-prompt:system-invocation-boundary-projection" || projection.evidenceRef !== "conformance:opencode-system-prompt-invocation-boundary-projection") {
    issues.push({
      id: "opencode-system-prompt-invocation-boundary.identity",
      message: "OpenCode SystemPrompt invocation boundary projection lost its fixture or evidence identity.",
    })
  }
  if (projection.nativeParityClaim !== false || projection.exactDiffStatus !== "exact-diff-partial" || projection.coverageStatus !== "partial") {
    issues.push({
      id: "opencode-system-prompt-invocation-boundary.native-claim",
      message: "OpenCode SystemPrompt invocation boundary projection must stay partial and cannot claim native parity.",
    })
  }
  for (const boundaryID of OPENCODE_SYSTEM_PROMPT_INVOCATION_BOUNDARY_ORDER) {
    if (!projection.coveredBoundaries.includes(boundaryID)) {
      issues.push({
        id: "opencode-system-prompt-invocation-boundary.missing-boundary",
        boundaryID,
        message: `OpenCode SystemPrompt invocation boundary projection is missing ${boundaryID}.`,
      })
    }
  }
  if (!projection.knownGaps.includes("opencode-system-prompt-invocation-boundary-projection-partial-fixture")) {
    issues.push({
      id: "opencode-system-prompt-invocation-boundary.lossiness",
      message: "OpenCode SystemPrompt invocation boundary projection no longer records partial fixture lossiness.",
    })
  }
  if (!["boundaryID", "sourceOrder", "upstreamPath", "upstreamSymbol", "upstreamRequestSlot"].every((field) => projection.retainedFields.includes(field))) {
    issues.push({
      id: "opencode-system-prompt-invocation-boundary.retained-fields",
      message: "OpenCode SystemPrompt invocation boundary projection must retain upstream path, symbol, request slot, and source order keys.",
    })
  }
  if (!projection.sideEffectMarkers.some((marker) => /SystemPrompt|Instruction|plugin|reference|structured|user\.system|provider/i.test(marker))) {
    issues.push({
      id: "opencode-system-prompt-invocation-boundary.side-effect-markers",
      message: "OpenCode SystemPrompt invocation boundary projection must keep prompt/runtime side-effect markers visible.",
    })
  }
  if (!projection.lossyFields.some((field) => /object identity|side effects|serialization|tokenization|exact text|synthetic/i.test(field))) {
    issues.push({
      id: "opencode-system-prompt-invocation-boundary.lossy-fields",
      message: "OpenCode SystemPrompt invocation boundary projection must name native object identity, side-effect, exact text, and serialization lossiness.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function projectOpenCodeSystemPromptProviderMessageProjection(
  records: OpenCodeSystemPromptProviderMessageRecord[],
): OpenCodeSystemPromptProviderMessageProjection {
  const normalizedRecords = [...records]
    .map(({ harnessSegment, ...record }) => ({
      ...record,
      ...(typeof harnessSegment === "string" && harnessSegment.length > 0 ? { harnessSegment } : {}),
      retainedFields: uniqueStrings(record.retainedFields ?? []),
      serializationMarkers: uniqueStrings(record.serializationMarkers ?? []),
      lossyFields: uniqueStrings(record.lossyFields ?? []),
    }))
    .sort((left, right) => {
      const slotDelta = OPENCODE_SYSTEM_PROMPT_PROVIDER_MESSAGE_SLOT_ORDER.indexOf(left.slotID) - OPENCODE_SYSTEM_PROMPT_PROVIDER_MESSAGE_SLOT_ORDER.indexOf(right.slotID)
      return slotDelta === 0 ? left.sourceOrder - right.sourceOrder : slotDelta
    })
  const projectionWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: OPENCODE_UPSTREAM_REF,
    evidenceRef: "conformance:opencode-system-prompt-provider-message-projection" as const,
    fixtureID: "opencode-prompt:provider-message-projection" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    slotOrder: OPENCODE_SYSTEM_PROMPT_PROVIDER_MESSAGE_SLOT_ORDER,
    records: normalizedRecords,
    coveredSlots: uniqueOpenCodeSystemPromptProviderMessageSlots(normalizedRecords.map((record) => record.slotID)),
    retainedFields: uniqueStrings([
      "slotID",
      "sourceOrder",
      "upstreamPath",
      "upstreamSymbol",
      "providerMessageRole",
      "providerRequestSlot",
      "source",
      "harnessSegment",
      ...normalizedRecords.flatMap((record) => record.retainedFields ?? []),
    ]),
    serializationMarkers: uniqueStrings(normalizedRecords.flatMap((record) => record.serializationMarkers ?? [])),
    lossyFields: uniqueStrings([
      ...normalizedRecords.flatMap((record) => record.lossyFields ?? []),
      "provider request message array object identity",
      "provider message role/content serialization exactness",
      "runtime tokenization and provider serialization effects",
      "plugin transform post-serialization mutation identity",
      "structured output schema prompt exact text",
      "input.user.system original message identity",
      "synthetic reference message part object identity",
    ]),
    knownGaps: [
      "opencode-system-prompt-provider-message-projection-partial-fixture",
      "opencode-system-prompt-live-runtime-not-spawned",
      "opencode-system-prompt-provider-message-serialization-not-exact",
      "opencode-system-prompt-provider-message-object-identity-not-exact",
      "opencode-system-prompt-plugin-transform-post-serialization-not-exact",
      "opencode-system-prompt-structured-output-system-not-exact",
      "opencode-system-prompt-user-system-output-not-exact",
      "opencode-system-prompt-reference-attachment-message-part-not-exact",
    ],
  }
  return {
    ...projectionWithoutFingerprint,
    fingerprint: sha256Hex(stableStringify(projectionWithoutFingerprint)).slice(0, 16),
  }
}

export function verifyOpenCodeSystemPromptProviderMessageProjection(
  projection: OpenCodeSystemPromptProviderMessageProjection,
): OpenCodeSystemPromptProviderMessageVerification {
  const issues: OpenCodeSystemPromptProviderMessageIssue[] = []
  if (projection.fixtureID !== "opencode-prompt:provider-message-projection" || projection.evidenceRef !== "conformance:opencode-system-prompt-provider-message-projection") {
    issues.push({
      id: "opencode-system-prompt-provider-message.identity",
      message: "OpenCode SystemPrompt provider message projection lost its fixture or evidence identity.",
    })
  }
  if (projection.nativeParityClaim !== false || projection.exactDiffStatus !== "exact-diff-partial" || projection.coverageStatus !== "partial") {
    issues.push({
      id: "opencode-system-prompt-provider-message.native-claim",
      message: "OpenCode SystemPrompt provider message projection must stay partial and cannot claim native parity.",
    })
  }
  for (const slotID of OPENCODE_SYSTEM_PROMPT_PROVIDER_MESSAGE_SLOT_ORDER) {
    if (!projection.coveredSlots.includes(slotID)) {
      issues.push({
        id: "opencode-system-prompt-provider-message.missing-slot",
        slotID,
        message: `OpenCode SystemPrompt provider message projection is missing ${slotID}.`,
      })
    }
  }
  if (!projection.knownGaps.includes("opencode-system-prompt-provider-message-projection-partial-fixture")) {
    issues.push({
      id: "opencode-system-prompt-provider-message.lossiness",
      message: "OpenCode SystemPrompt provider message projection no longer records partial fixture lossiness.",
    })
  }
  if (!["slotID", "sourceOrder", "upstreamPath", "upstreamSymbol", "providerMessageRole", "providerRequestSlot", "source"].every((field) => projection.retainedFields.includes(field))) {
    issues.push({
      id: "opencode-system-prompt-provider-message.retained-fields",
      message: "OpenCode SystemPrompt provider message projection must retain upstream path, symbol, provider role, request slot, source, and order keys.",
    })
  }
  if (!projection.serializationMarkers.some((marker) => /provider|message|serialization|token|plugin|reference|structured|user\.system/i.test(marker))) {
    issues.push({
      id: "opencode-system-prompt-provider-message.serialization-markers",
      message: "OpenCode SystemPrompt provider message projection must keep provider/message serialization markers visible.",
    })
  }
  if (!projection.lossyFields.some((field) => /object identity|serialization|tokenization|exact text|synthetic|plugin/i.test(field))) {
    issues.push({
      id: "opencode-system-prompt-provider-message.lossy-fields",
      message: "OpenCode SystemPrompt provider message projection must name native object identity, exact text, plugin, and serialization lossiness.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function verifyOpenCodeSystemPromptRuntimeOutputCoverage(
  projection: OpenCodeSystemPromptRuntimeOutputProjection,
): OpenCodeSystemPromptLiveRuntimeFixtureIssue[] {
  const issues: OpenCodeSystemPromptLiveRuntimeFixtureIssue[] = []
  if (projection.fixtureID !== "opencode-prompt:runtime-system-output-projection" || projection.evidenceRef !== "conformance:opencode-system-prompt-runtime-output-projection") {
    issues.push({
      id: "opencode-system-prompt-runtime-output.identity",
      message: "OpenCode SystemPrompt runtime output projection lost its fixture or evidence identity.",
    })
  }
  for (const stepID of OPENCODE_PROMPT_RUNTIME_PROJECTED_OUTPUT_STEP_ORDER) {
    if (!projection.coveredOutputStepIDs.includes(stepID)) {
      issues.push({
        id: "opencode-system-prompt-runtime-output.missing-output-step",
        message: `OpenCode SystemPrompt runtime output projection is missing ${stepID}.`,
      })
    }
  }
  if (!projection.knownGaps.includes("opencode-system-prompt-runtime-output-projection-partial-fixture")) {
    issues.push({
      id: "opencode-system-prompt-runtime-output.lossiness",
      message: "OpenCode SystemPrompt runtime output projection no longer records partial fixture lossiness.",
    })
  }
  return issues
}

export function captureOpenCodeSystemPromptLiveRuntimeFixture(input: OpenCodeSystemPromptLiveRuntimeFixtureInput): OpenCodeSystemPromptLiveRuntimeFixture {
  const cwd = resolve(input.cwd)
  const mode = normalizeOpenCodeAgentMode(input.mode ?? "build")
  const model = input.model ?? { providerID: "openai-compatible", modelID: "gpt-5" }
  const now = input.now ?? new Date()
  const resources = input.resources && input.resources.length > 0
    ? input.resources
    : [
      {
        kind: "rule" as const,
        name: "AGENTS.md",
        path: "AGENTS.md",
        content: "Default OpenCode live fixture project guidance.",
        source: "project" as const,
      },
      {
        kind: "skill" as const,
        name: "live-runtime-helper",
        path: ".opencode/skills/live-runtime-helper/SKILL.md",
        content: "---\nname: live-runtime-helper\ndescription: Use when capturing OpenCode prompt runtime fixture readback.\n---\nSkill body is loaded on demand.",
        source: "project" as const,
        metadata: {
          opencodeSkill: true,
          description: "Use when capturing OpenCode prompt runtime fixture readback.",
          location: ".opencode/skills/live-runtime-helper/SKILL.md",
        },
      },
    ]
  const references = input.references && input.references.length > 0
    ? input.references
    : [
      {
        name: "design.md",
        path: "docs/design.md",
        content: "Reference attachment readback for OpenCode prompt live runtime fixture.",
        mime: "text/markdown",
      },
  ]
  const skillResources = resources.filter(isOpenCodeSkillResource)
  const includedSkillNames = openCodeAgentSkillResources(cwd, mode, resources).filter(isOpenCodeSkillResource).map((resource) => resource.name).sort()
  const includedSkillNameSet = new Set(includedSkillNames)
  const deniedSkillNames = skillResources.map((resource) => resource.name).filter((name) => !includedSkillNameSet.has(name)).sort()
  const rendered = buildOpenCodeRenderedSystemPromptSnapshotFromPolicy({
    cwd,
    mode,
    model,
    resources,
    references,
    now,
    policy: {
      includedSkillNames,
      deniedSkillNames,
    },
  })
  const structuredOutputSchema = input.structuredOutputSchema ?? JSON.stringify({ type: "object", properties: { answer: { type: "string" } }, required: ["answer"] })
  const userSystem = input.userSystem ?? "User supplied system prompt for OpenCode live runtime fixture."
  const pluginID = input.pluginID ?? "prompt-mutator"
  const reference = references[0] ?? {
    name: "design.md",
    path: "docs/design.md",
    content: "Reference attachment readback for OpenCode prompt live runtime fixture.",
    mime: "text/markdown",
  }
  const systemChunkBeforePluginCount = rendered.segments.filter((segment) => segment.kind !== "reference").length + 2
  const runtimeOutputProjection = projectOpenCodeSystemPromptRuntimeOutputProjection([
    {
      type: "system.chunk",
      source: "STRUCTURED_OUTPUT_SYSTEM_PROMPT",
      upstreamRequestSlot: "input.system[structured-output-optional]",
      segmentName: "structured-output-system",
      contentSha256: sha256Hex(structuredOutputSchema),
      sequence: 2,
    },
    {
      type: "system.chunk",
      source: "input.user.system",
      upstreamRequestSlot: "system[user-system-optional]",
      segmentName: "user.system",
      contentSha256: sha256Hex(userSystem),
      sequence: 3,
    },
    {
      type: "plugin.transform",
      pluginID,
      beforeCount: systemChunkBeforePluginCount,
      afterCount: systemChunkBeforePluginCount,
      mutatedSlots: ["system[plugin-transform]", "system[user-system-optional]", "system[plugin-transform]"],
      sequence: 4,
    },
    {
      type: "reference.attachment",
      name: reference.name,
      mime: reference.mime ?? "text/markdown",
      syntheticMessagePartObserved: true,
      sequence: 1,
      ...(reference.path ? { path: reference.path } : {}),
    },
  ])
  const segmentSha256 = (kind: OpenCodeSystemPromptSegmentKind, name?: string): string | null => {
    const segment = rendered.segments.find((candidate) => candidate.kind === kind && (name === undefined || candidate.name === name))
    return segment?.sha256 ?? null
  }
  const firstResourceSegment = rendered.segments.find((segment) => segment.kind === "resource")
  const skillsSegment = rendered.segments.find((segment) => segment.kind === "skills")
  const referenceSegment = rendered.segments.find((segment) => segment.kind === "reference")
  const resourceHarnessSegment = firstResourceSegment ? `resource:${firstResourceSegment.name}` : "resource:missing"
  const skillsHarnessSegment = skillsSegment ? `skills:${skillsSegment.name}` : "skills:available_skills"
  const referenceHarnessSegment = referenceSegment ? `reference:${referenceSegment.name}` : `reference:${reference.name}`
  const invocationBoundaryProjection = projectOpenCodeSystemPromptInvocationBoundaryProjection([
    {
      boundaryID: "llm-request:provider-or-agent-prompt",
      sourceOrder: 0,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamSymbol: "agent.prompt ? [agent.prompt] : SystemPrompt.provider(input.model)",
      upstreamRequestSlot: "system[0]",
      harnessSegment: `base-prompt:opencode-prompt:${rendered.promptAsset}`,
      retainedFields: ["providerID", "modelID", "promptAsset", "contentSha256"],
      sideEffectMarkers: ["SystemPrompt.provider(model) live fixture readback inserted into llm request system[0]"],
      lossyFields: ["raw provider request message object identity"],
    },
    {
      boundaryID: "session-system:environment",
      sourceOrder: 1,
      upstreamPath: "packages/opencode/src/session/system.ts",
      upstreamSymbol: "SystemPrompt.environment(model)",
      upstreamRequestSlot: "input.system[0]",
      harnessSegment: "environment:opencode-environment",
      retainedFields: ["providerID", "modelID", "contentSha256"],
      sideEffectMarkers: ["SystemPrompt.environment(model) live fixture branch readback captured"],
      lossyFields: ["live SystemPrompt invocation side effects"],
    },
    {
      boundaryID: "session-instruction:system",
      sourceOrder: 2,
      upstreamPath: "packages/opencode/src/session/prompt.ts",
      upstreamSymbol: "Instruction.system",
      upstreamRequestSlot: "input.system[1]",
      harnessSegment: resourceHarnessSegment,
      retainedFields: ["resourceName", "resourceKind", "contentSha256"],
      sideEffectMarkers: ["Instruction.system resource expansion readback captured"],
      lossyFields: ["Instruction.system resource object identity"],
    },
    {
      boundaryID: "session-system:skills",
      sourceOrder: 3,
      upstreamPath: "packages/opencode/src/session/system.ts",
      upstreamSymbol: "SystemPrompt.skills(agent)",
      upstreamRequestSlot: "input.system[2]",
      harnessSegment: skillsHarnessSegment,
      retainedFields: ["includedSkillNames", "deniedSkillNames", "permissionRules"],
      sideEffectMarkers: ["SystemPrompt.skills(agent) permission-filtered readback captured"],
      lossyFields: ["dynamic tool and permission side effects"],
    },
    {
      boundaryID: "prompt-input:structured-output-system",
      sourceOrder: 4,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamSymbol: "STRUCTURED_OUTPUT_SYSTEM_PROMPT",
      upstreamRequestSlot: "input.system[structured-output-optional]",
      harnessSegment: "runtime-output:structured-output-system",
      retainedFields: ["segmentName", "contentSha256", "sequence"],
      sideEffectMarkers: ["structured output system prompt branch readback captured"],
      lossyFields: ["structured output schema prompt exact text"],
    },
    {
      boundaryID: "prompt-input:user-system",
      sourceOrder: 5,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamSymbol: "input.user.system",
      upstreamRequestSlot: "system[user-system-optional]",
      harnessSegment: "runtime-output:user.system",
      retainedFields: ["segmentName", "contentSha256", "sequence"],
      sideEffectMarkers: ["user.system optional llm request branch readback captured"],
      lossyFields: ["input.user.system original message identity"],
    },
    {
      boundaryID: "plugin:experimental-chat-system-transform",
      sourceOrder: 6,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamSymbol: "experimental.chat.system.transform",
      upstreamRequestSlot: "system[plugin-transform]",
      harnessSegment: "runtime-output:plugin-transform",
      retainedFields: ["pluginID", "beforeCount", "afterCount", "mutatedSlots", "sequence"],
      sideEffectMarkers: ["plugin transform function execution and collapse readback captured"],
      lossyFields: ["plugin transform function execution side effects", "plugin transform collapse/mutation object identity"],
    },
    {
      boundaryID: "session-prompt:reference-attachment",
      sourceOrder: 7,
      upstreamPath: "packages/opencode/src/session/prompt/reference.ts",
      upstreamSymbol: "ReferencePrompt",
      upstreamRequestSlot: "message[reference-text-part]",
      harnessSegment: referenceHarnessSegment,
      retainedFields: ["name", "path", "mime", "syntheticMessagePartObserved", "sequence"],
      sideEffectMarkers: ["reference synthetic message part readback captured"],
      lossyFields: ["synthetic reference message part object identity"],
    },
  ])
  const providerMessageProjection = projectOpenCodeSystemPromptProviderMessageProjection([
    {
      slotID: "llm-request:provider-or-agent-prompt",
      sourceOrder: 0,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamSymbol: "agent.prompt ? [agent.prompt] : SystemPrompt.provider(input.model)",
      providerMessageRole: "system",
      providerRequestSlot: "system[0]",
      source: "agent.prompt-or-SystemPrompt.provider",
      harnessSegment: `base-prompt:opencode-prompt:${rendered.promptAsset}`,
      retainedFields: ["providerID", "modelID", "promptAsset", "contentSha256"],
      serializationMarkers: ["provider system message[0] serialized before input.system spread"],
      lossyFields: ["provider request message array object identity"],
    },
    {
      slotID: "session-system:environment",
      sourceOrder: 1,
      upstreamPath: "packages/opencode/src/session/system.ts",
      upstreamSymbol: "SystemPrompt.environment(model)",
      providerMessageRole: "system",
      providerRequestSlot: "input.system[0]",
      source: "SystemPrompt.environment",
      harnessSegment: "environment:opencode-environment",
      retainedFields: ["providerID", "modelID", "contentSha256"],
      serializationMarkers: ["input.system environment chunk serialized into provider system message"],
      lossyFields: ["live SystemPrompt invocation side effects"],
    },
    {
      slotID: "session-instruction:system",
      sourceOrder: 2,
      upstreamPath: "packages/opencode/src/session/prompt.ts",
      upstreamSymbol: "Instruction.system",
      providerMessageRole: "system",
      providerRequestSlot: "input.system[1]",
      source: "Instruction.system",
      harnessSegment: resourceHarnessSegment,
      retainedFields: ["resourceName", "resourceKind", "contentSha256"],
      serializationMarkers: ["Instruction.system resource chunk serialized into provider system message"],
      lossyFields: ["Instruction.system resource object identity"],
    },
    {
      slotID: "session-system:skills",
      sourceOrder: 3,
      upstreamPath: "packages/opencode/src/session/system.ts",
      upstreamSymbol: "SystemPrompt.skills(agent)",
      providerMessageRole: "system",
      providerRequestSlot: "input.system[2]",
      source: "SystemPrompt.skills",
      harnessSegment: skillsHarnessSegment,
      retainedFields: ["includedSkillNames", "deniedSkillNames", "permissionRules"],
      serializationMarkers: ["skills message serialization follows permission-filtered SystemPrompt.skills output"],
      lossyFields: ["dynamic tool and permission side effects"],
    },
    {
      slotID: "prompt-input:structured-output-system",
      sourceOrder: 4,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamSymbol: "STRUCTURED_OUTPUT_SYSTEM_PROMPT",
      providerMessageRole: "system",
      providerRequestSlot: "input.system[structured-output-optional]",
      source: "STRUCTURED_OUTPUT_SYSTEM_PROMPT",
      harnessSegment: "runtime-output:structured-output-system",
      retainedFields: ["segmentName", "contentSha256", "sequence"],
      serializationMarkers: ["structured output system prompt serialized as optional provider system chunk"],
      lossyFields: ["structured output schema prompt exact text"],
    },
    {
      slotID: "prompt-input:user-system",
      sourceOrder: 5,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamSymbol: "input.user.system",
      providerMessageRole: "system",
      providerRequestSlot: "system[user-system-optional]",
      source: "input.user.system",
      harnessSegment: "runtime-output:user.system",
      retainedFields: ["segmentName", "contentSha256", "sequence"],
      serializationMarkers: ["user.system optional provider system chunk serialized after input.system"],
      lossyFields: ["input.user.system original message identity"],
    },
    {
      slotID: "plugin:experimental-chat-system-transform",
      sourceOrder: 6,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamSymbol: "experimental.chat.system.transform",
      providerMessageRole: "system",
      providerRequestSlot: "system[plugin-transform]",
      source: "experimental.chat.system.transform",
      harnessSegment: "runtime-output:plugin-transform",
      retainedFields: ["pluginID", "beforeCount", "afterCount", "mutatedSlots", "sequence"],
      serializationMarkers: ["plugin transform may mutate provider system message chunks before final serialization"],
      lossyFields: ["plugin transform post-serialization mutation identity"],
    },
    {
      slotID: "session-prompt:reference-attachment",
      sourceOrder: 7,
      upstreamPath: "packages/opencode/src/session/prompt/reference.ts",
      upstreamSymbol: "ReferencePrompt",
      providerMessageRole: "user",
      providerRequestSlot: "message[reference-text-part]",
      source: "ReferencePrompt",
      harnessSegment: referenceHarnessSegment,
      retainedFields: ["name", "path", "mime", "syntheticMessagePartObserved", "sequence"],
      serializationMarkers: ["reference synthetic message part serialized outside provider system list"],
      lossyFields: ["synthetic reference message part object identity"],
    },
  ])
  const slotContentSha256 = new Map<OpenCodeSystemPromptProviderMessageSlotID, string | null>([
    ["llm-request:provider-or-agent-prompt", segmentSha256("base-prompt")],
    ["session-system:environment", segmentSha256("environment", "opencode-environment")],
    ["session-instruction:system", firstResourceSegment?.sha256 ?? null],
    ["session-system:skills", skillsSegment?.sha256 ?? null],
    ["prompt-input:structured-output-system", sha256Hex(structuredOutputSchema)],
    ["prompt-input:user-system", sha256Hex(userSystem)],
    ["plugin:experimental-chat-system-transform", null],
    ["session-prompt:reference-attachment", referenceSegment?.sha256 ?? null],
  ])
  const providerMessageReadback = providerMessageProjection.records.map((record) => ({
    slotID: record.slotID,
    providerMessageRole: record.providerMessageRole,
    providerRequestSlot: record.providerRequestSlot,
    source: record.source,
    harnessSegment: record.harnessSegment ?? null,
    contentSha256: slotContentSha256.get(record.slotID) ?? null,
    sequence: record.sourceOrder,
  }))
  const pluginTransformReadback = runtimeOutputProjection.pluginTransforms[0] ?? {
    pluginID: null,
    beforeCount: 0,
    afterCount: 0,
    mutatedSlots: [],
    sequence: -1,
  }
  const referenceReadback = runtimeOutputProjection.referenceAttachments[0] ?? {
    name: reference.name,
    path: reference.path ?? null,
    mime: reference.mime ?? null,
    syntheticMessagePartObserved: false,
    sequence: -1,
  }
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: OPENCODE_UPSTREAM_REF,
    evidenceRef: "conformance:opencode-system-prompt-live-runtime-fixture" as const,
    fixtureID: "opencode-prompt:live-runtime-fixture" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    cwd,
    mode,
    providerID: String(model.providerID ?? "unknown"),
    modelID: String(model.modelID ?? "unknown"),
    capturedAt: now.toISOString(),
    orderingReadback: {
      promptAsset: rendered.promptAsset,
      segmentOrder: rendered.segmentOrder,
      renderedResourceNames: rendered.renderedResourceNames,
      includedSkillNames: rendered.includedSkillNames,
      deniedSkillNames: rendered.deniedSkillNames,
      referenceNames: rendered.referenceNames,
      assembledSha256: rendered.assembledSha256,
    },
    capturedOutputStepIDs: runtimeOutputProjection.coveredOutputStepIDs,
    capturedBoundaryIDs: invocationBoundaryProjection.coveredBoundaries,
    capturedProviderSlotIDs: providerMessageProjection.coveredSlots,
    runtimeOutputProjection,
    invocationBoundaryProjection,
    providerMessageProjection,
    providerMessageReadback,
    structuredOutputReadback: {
      schemaSha256: sha256Hex(structuredOutputSchema),
      providerRequestSlot: "input.system[structured-output-optional]",
      sequence: 2,
    },
    userSystemReadback: {
      contentSha256: sha256Hex(userSystem),
      providerRequestSlot: "system[user-system-optional]",
      sequence: 3,
    },
    pluginTransformReadback,
    referenceReadback,
    retainedFields: uniqueStrings([
      "cwd",
      "mode",
      "providerID",
      "modelID",
      "promptAsset",
      "segmentOrder",
      "renderedResourceNames",
      "includedSkillNames",
      "deniedSkillNames",
      "referenceNames",
      "assembledSha256",
      "capturedOutputStepIDs",
      "capturedBoundaryIDs",
      "capturedProviderSlotIDs",
      "providerMessageRole",
      "providerRequestSlot",
      "contentSha256",
      "schemaSha256",
      "pluginTransformReadback",
      "referenceReadback",
      ...runtimeOutputProjection.retainedFields,
      ...invocationBoundaryProjection.retainedFields,
      ...providerMessageProjection.retainedFields,
    ]),
    lossyFields: uniqueStrings([
      ...runtimeOutputProjection.lossyFields,
      ...invocationBoundaryProjection.lossyFields,
      ...providerMessageProjection.lossyFields,
      "upstream OpenCode process not spawned in fixture",
      "provider serialization/tokenization exact byte stream",
      "plugin transform closure/object identity",
      "reference synthetic message part object identity",
    ]),
    knownGaps: uniqueStrings([
      ...runtimeOutputProjection.knownGaps,
      ...invocationBoundaryProjection.knownGaps,
      ...providerMessageProjection.knownGaps,
      ...OPENCODE_SYSTEM_PROMPT_LIVE_RUNTIME_FIXTURE_GAPS,
    ]),
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: sha256Hex(stableStringify(fixtureWithoutFingerprint)).slice(0, 16),
  }
}

export function captureOpenCodeLLMRequestSystemExactFixture(input: OpenCodeLLMRequestSystemExactFixtureInput): OpenCodeLLMRequestSystemExactFixture {
  const model = input.model ?? { providerID: "openai-compatible", modelID: "gpt-5" }
  const providerPrompt = input.agentPrompt ?? openCodeAgentPrompt("build", model)
  const systemBeforePlugin = [[
    providerPrompt,
    ...input.system,
    ...(input.userSystem ? [input.userSystem] : []),
  ].filter((chunk) => chunk.length > 0).join("\n")]
  const systemAfterPlugin = [...systemBeforePlugin]
  const header = systemAfterPlugin[0] ?? ""
  for (const operation of input.pluginOperations ?? []) {
    if (operation.type === "append-system") systemAfterPlugin.push(operation.content)
    else if (operation.index >= 0 && operation.index < systemAfterPlugin.length) systemAfterPlugin[operation.index] = operation.content
  }
  const collapseApplied = systemAfterPlugin.length > 2 && systemAfterPlugin[0] === header
  const preparedSystem = collapseApplied
    ? [header, systemAfterPlugin.slice(1).join("\n")]
    : systemAfterPlugin
  const inputMessages = input.messages ?? [{ role: "user" as const, content: "Explain the pinned OpenCode prompt request." }]
  const preparedMessages = (input.isOpenaiOauth || input.isWorkflow
    ? inputMessages.map((message, index) => ({ ...message, source: "input-message" as const, index }))
    : [
      ...preparedSystem.map((content, index) => ({ role: "system" as const, content, source: "prepared-system" as const, index })),
      ...inputMessages.map((message, messageIndex) => ({
        ...message,
        source: "input-message" as const,
        index: preparedSystem.length + messageIndex,
      })),
    ]).map((message): OpenCodeLLMRequestSystemExactMessage => ({
      role: message.role,
      contentSha256: sha256Hex(message.content),
      content: message.content,
      source: message.source,
      index: message.index,
    }))
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: OPENCODE_UPSTREAM_REF,
    evidenceRef: "conformance:opencode-llm-request-system-exact-fixture" as const,
    fixtureID: "opencode-prompt:llm-request-system-exact-fixture" as const,
    exactDiffStatus: "pinned-upstream-source-exact" as const,
    coverageStatus: "native-exact-subpath" as const,
    nativeParityClaim: true as const,
    sourceRefs: OPENCODE_LLM_REQUEST_SYSTEM_EXACT_SOURCES,
    providerID: String(model.providerID ?? "unknown"),
    modelID: String(model.modelID ?? "unknown"),
    systemBeforePlugin,
    systemAfterPlugin: preparedSystem,
    collapseApplied,
    preparedMessages,
    retainedFields: [
      "SystemPrompt.provider(model)",
      "input.system",
      "input.user.system",
      "experimental.chat.system.transform",
      "plugin-collapse-policy",
      "prepared.messages",
      "prepared.system",
    ],
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: sha256Hex(stableStringify(fixtureWithoutFingerprint)).slice(0, 16),
  }
}

export function verifyOpenCodeLLMRequestSystemExactFixture(
  fixture: OpenCodeLLMRequestSystemExactFixture,
): OpenCodeLLMRequestSystemExactFixtureVerification {
  const issues: OpenCodeLLMRequestSystemExactFixtureIssue[] = []
  const addIssue = (id: string, message: string) => issues.push({ id, message })
  if (fixture.fixtureID !== "opencode-prompt:llm-request-system-exact-fixture" || fixture.evidenceRef !== "conformance:opencode-llm-request-system-exact-fixture") {
    addIssue("opencode-llm-request-system-exact.identity", "OpenCode LLM request system exact fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== true || fixture.exactDiffStatus !== "pinned-upstream-source-exact" || fixture.coverageStatus !== "native-exact-subpath") {
    addIssue("opencode-llm-request-system-exact.native-claim", "OpenCode LLM request system exact fixture must claim only the native-exact prompt request subpath.")
  }
  if (fixture.knownLossiness.length !== 0) {
    addIssue("opencode-llm-request-system-exact.lossiness", "OpenCode LLM request system exact fixture cannot carry known lossiness.")
  }
  for (const source of OPENCODE_LLM_REQUEST_SYSTEM_EXACT_SOURCES) {
    const match = fixture.sourceRefs.find((candidate) => candidate.path === source.path)
    if (!match || match.sha256 !== source.sha256) {
      addIssue("opencode-llm-request-system-exact.source-ref", `OpenCode LLM request system exact fixture lost pinned source ${source.path}.`)
    }
  }
  if (!fixture.systemBeforePlugin.length || !/You are OpenCode|You are opencode/.test(fixture.systemBeforePlugin[0] ?? "")) {
    addIssue("opencode-llm-request-system-exact.provider-prompt", "OpenCode LLM request system exact fixture must retain the provider prompt chunk from SystemPrompt.provider.")
  }
  if (!fixture.preparedMessages.some((message) => message.source === "prepared-system" && message.role === "system")) {
    addIssue("opencode-llm-request-system-exact.prepared-system", "OpenCode LLM request system exact fixture must retain prepared provider system messages.")
  }
  if (fixture.collapseApplied && fixture.systemAfterPlugin.length !== 2) {
    addIssue("opencode-llm-request-system-exact.plugin-collapse", "OpenCode LLM request system exact fixture must collapse extra plugin system chunks into the second prepared system chunk.")
  }
  if (!fixture.retainedFields.includes("experimental.chat.system.transform") || !fixture.retainedFields.includes("prepared.messages")) {
    addIssue("opencode-llm-request-system-exact.retained-fields", "OpenCode LLM request system exact fixture must retain plugin transform and prepared message fields.")
  }
  const { fingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = sha256Hex(stableStringify(withoutFingerprint)).slice(0, 16)
  if (fingerprint !== expectedFingerprint) {
    addIssue("opencode-llm-request-system-exact.fingerprint", "OpenCode LLM request system exact fixture fingerprint no longer matches its exact output.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function captureOpenCodeSystemPromptLiveUpstreamExactDiffFixture(
  input: OpenCodeSystemPromptLiveUpstreamExactDiffFixtureInput,
): OpenCodeSystemPromptLiveUpstreamExactDiffFixture {
  const cwd = resolve(input.cwd)
  const mode = normalizeOpenCodeAgentMode(input.mode ?? "build")
  const model = input.model ?? { providerID: "openai-compatible", modelID: "gpt-5" }
  const modelID = String(model.modelID ?? "unknown")
  const promptAsset = openCodeSystemPromptProviderAssetForUpstreamModelID(modelID)
  const resources = input.resources ?? []
  const references = input.references ?? []
  const now = input.now ?? new Date("2026-06-10T00:00:00.000Z")
  const skillResources = openCodeAgentSkillResources(cwd, mode, resources.filter(isOpenCodeSkillResource))
  const skillPrompt = skillResources.length > 0 ? openCodeSkillsPrompt(skillResources) : ""
  const system = [
    openCodeEnvironmentPrompt(cwd, model, now),
    ...resources.filter((resource) => !isOpenCodeSkillResource(resource)).map(openCodeInstructionResourcePrompt),
    skillPrompt,
    input.structuredOutputSystem,
  ].filter(isNonEmptyString)
  const messages = [
    ...(input.messages ?? []),
    ...references.map((reference) => ({ role: "user" as const, content: openCodeReferencePromptText(reference) })),
  ]
  const upstreamFixture = captureOpenCodeLLMRequestSystemExactFixture({
    model,
    agentPrompt: openCodePromptAsset(promptAsset),
    system,
    ...(input.userSystem ? { userSystem: input.userSystem } : {}),
    messages,
    ...(input.pluginOperations ? { pluginOperations: input.pluginOperations } : {}),
  })
  const harnessFixture = input.harnessFixture ?? captureOpenCodeLLMRequestSystemExactFixture({
    model,
    agentPrompt: openCodePromptAsset(promptAsset),
    system,
    ...(input.userSystem ? { userSystem: input.userSystem } : {}),
    messages,
    ...(input.pluginOperations ? { pluginOperations: input.pluginOperations } : {}),
  })
  const diffRecords = diffOpenCodePreparedMessages(upstreamFixture.preparedMessages, harnessFixture.preparedMessages)
  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: OPENCODE_UPSTREAM_REF,
    evidenceRef: "conformance:opencode-system-prompt-live-upstream-exact-diff-fixture" as const,
    fixtureID: "opencode-prompt:live-upstream-exact-diff-fixture" as const,
    exactDiffStatus: "live-upstream-exact-diff" as const,
    coverageStatus: "native" as const,
    nativeParityClaim: true as const,
    sourceRefs: OPENCODE_UPSTREAM_SYSTEM_PROMPT_SOURCES,
    cwd,
    mode,
    providerID: String(model.providerID ?? "unknown"),
    modelID,
    promptAsset,
    upstreamFixture,
    harnessFixture,
    diffRecords,
    mismatchCount: diffRecords.filter((record) => !record.roleMatches || !record.contentMatches).length,
    retainedFields: [
      "SystemPrompt.provider(model)",
      "SystemPrompt.environment(model)",
      "Instruction.system()",
      "SystemPrompt.skills(agent)",
      "STRUCTURED_OUTPUT_SYSTEM_PROMPT",
      "input.user.system",
      "experimental.chat.system.transform",
      "ReferencePrompt.referenceTextPart",
      "prepared.messages",
      "prepared.system",
    ],
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: sha256Hex(stableStringify(fixtureWithoutFingerprint)).slice(0, 16),
  }
}

export function verifyOpenCodeSystemPromptLiveUpstreamExactDiffFixture(
  fixture: OpenCodeSystemPromptLiveUpstreamExactDiffFixture,
): OpenCodeSystemPromptLiveUpstreamExactDiffFixtureVerification {
  const issues: OpenCodeSystemPromptLiveUpstreamExactDiffFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== "opencode-prompt:live-upstream-exact-diff-fixture" || fixture.evidenceRef !== "conformance:opencode-system-prompt-live-upstream-exact-diff-fixture") {
    addIssue("opencode-system-prompt-live-upstream-exact-diff.identity", "OpenCode SystemPrompt upstream exact-diff fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== true || fixture.exactDiffStatus !== "live-upstream-exact-diff" || fixture.coverageStatus !== "native") {
    addIssue("opencode-system-prompt-live-upstream-exact-diff.native-claim", "OpenCode SystemPrompt upstream exact-diff fixture must claim native coverage only when prepared messages match exactly.")
  }
  if (fixture.knownLossiness.length !== 0) {
    addIssue("opencode-system-prompt-live-upstream-exact-diff.lossiness", "OpenCode SystemPrompt upstream exact-diff fixture cannot carry known lossiness.")
  }
  for (const source of OPENCODE_UPSTREAM_SYSTEM_PROMPT_SOURCES) {
    const match = fixture.sourceRefs.find((candidate) => candidate.path === source.path)
    if (!match || match.sha256 !== source.sha256) {
      addIssue("opencode-system-prompt-live-upstream-exact-diff.source-ref", `OpenCode SystemPrompt upstream exact-diff fixture lost pinned source ${source.path}.`)
    }
  }
  for (const [label, requestFixture] of [["upstream", fixture.upstreamFixture], ["harness", fixture.harnessFixture]] as const) {
    const verification = verifyOpenCodeLLMRequestSystemExactFixture(requestFixture)
    if (!verification.ok) addIssue(`opencode-system-prompt-live-upstream-exact-diff.${label}-request`, `OpenCode ${label} request fixture is not internally exact: ${verification.issues.map((issue) => issue.id).join(", ")}`)
  }
  const recomputedDiff = diffOpenCodePreparedMessages(fixture.upstreamFixture.preparedMessages, fixture.harnessFixture.preparedMessages)
  const recomputedMismatchCount = recomputedDiff.filter((record) => !record.roleMatches || !record.contentMatches).length
  if (recomputedMismatchCount !== 0 || fixture.mismatchCount !== 0) {
    addIssue("opencode-system-prompt-live-upstream-exact-diff.mismatch", "OpenCode SystemPrompt upstream and harness prepared messages no longer match exactly.")
  }
  if (stableStringify(recomputedDiff) !== stableStringify(fixture.diffRecords)) {
    addIssue("opencode-system-prompt-live-upstream-exact-diff.diff-records", "OpenCode SystemPrompt upstream exact-diff records no longer match the prepared message diff.")
  }
  const upstreamSystem = fixture.upstreamFixture.systemBeforePlugin[0] ?? ""
  if (upstreamSystem.includes("<env>") || !upstreamSystem.includes("\nThe exact model ID is")) {
    addIssue("opencode-system-prompt-live-upstream-exact-diff.environment", "OpenCode upstream exact-diff fixture must retain pinned SystemPrompt.environment formatting.")
  }
  if (!fixture.harnessFixture.preparedMessages.some((message) => message.role === "user" && message.content.includes("Referenced configured reference @"))) {
    addIssue("opencode-system-prompt-live-upstream-exact-diff.reference", "OpenCode harness prepared messages must retain upstream ReferencePrompt synthetic text.")
  }
  if (!fixture.retainedFields.includes("ReferencePrompt.referenceTextPart") || !fixture.retainedFields.includes("STRUCTURED_OUTPUT_SYSTEM_PROMPT")) {
    addIssue("opencode-system-prompt-live-upstream-exact-diff.retained-fields", "OpenCode upstream exact-diff fixture must retain structured output and reference prompt fields.")
  }
  const { fingerprint, ...withoutFingerprint } = fixture
  const expectedFingerprint = sha256Hex(stableStringify(withoutFingerprint)).slice(0, 16)
  if (fingerprint !== expectedFingerprint) {
    addIssue("opencode-system-prompt-live-upstream-exact-diff.fingerprint", "OpenCode SystemPrompt upstream exact-diff fixture fingerprint no longer matches its exact output.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyOpenCodeSystemPromptLiveRuntimeFixture(
  fixture: OpenCodeSystemPromptLiveRuntimeFixture,
): OpenCodeSystemPromptLiveRuntimeFixtureVerification {
  const issues: OpenCodeSystemPromptLiveRuntimeFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== "opencode-prompt:live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-system-prompt-live-runtime-fixture") {
    addIssue("opencode-system-prompt-live-runtime.identity", "OpenCode SystemPrompt live runtime fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== false || fixture.exactDiffStatus !== "live-runtime-partial" || fixture.coverageStatus !== "partial") {
    addIssue("opencode-system-prompt-live-runtime.native-claim", "OpenCode SystemPrompt live runtime fixture must stay partial and cannot claim native parity.")
  }
  const runtimeVerification = verifyOpenCodeSystemPromptRuntimeOutputCoverage(fixture.runtimeOutputProjection)
  for (const issue of runtimeVerification) addIssue(issue.id, issue.message)
  const invocationVerification = verifyOpenCodeSystemPromptInvocationBoundaryProjection(fixture.invocationBoundaryProjection)
  for (const issue of invocationVerification.issues) addIssue(issue.id, issue.message)
  const providerVerification = verifyOpenCodeSystemPromptProviderMessageProjection(fixture.providerMessageProjection)
  for (const issue of providerVerification.issues) addIssue(issue.id, issue.message)
  for (const stepID of OPENCODE_PROMPT_RUNTIME_PROJECTED_OUTPUT_STEP_ORDER) {
    if (!fixture.capturedOutputStepIDs.includes(stepID)) addIssue("opencode-system-prompt-live-runtime.missing-output-step", `OpenCode SystemPrompt live runtime fixture is missing output step ${stepID}.`)
  }
  for (const boundaryID of OPENCODE_SYSTEM_PROMPT_INVOCATION_BOUNDARY_ORDER) {
    if (!fixture.capturedBoundaryIDs.includes(boundaryID)) addIssue("opencode-system-prompt-live-runtime.missing-boundary", `OpenCode SystemPrompt live runtime fixture is missing boundary ${boundaryID}.`)
  }
  for (const slotID of OPENCODE_SYSTEM_PROMPT_PROVIDER_MESSAGE_SLOT_ORDER) {
    if (!fixture.capturedProviderSlotIDs.includes(slotID)) addIssue("opencode-system-prompt-live-runtime.missing-provider-slot", `OpenCode SystemPrompt live runtime fixture is missing provider slot ${slotID}.`)
  }
  if (fixture.providerMessageReadback.length !== OPENCODE_SYSTEM_PROMPT_PROVIDER_MESSAGE_SLOT_ORDER.length) {
    addIssue("opencode-system-prompt-live-runtime.provider-message-readback", "OpenCode SystemPrompt live runtime fixture must retain every provider message slot readback.")
  }
  if (!fixture.providerMessageReadback.some((record) => record.slotID === "session-prompt:reference-attachment" && record.providerMessageRole === "user" && record.providerRequestSlot === "message[reference-text-part]")) {
    addIssue("opencode-system-prompt-live-runtime.reference-provider-message", "OpenCode SystemPrompt live runtime fixture must retain the synthetic reference provider message readback.")
  }
  if (!fixture.orderingReadback.segmentOrder.some((segment) => segment.includes(":base-prompt:")) || !fixture.orderingReadback.segmentOrder.some((segment) => segment.includes(":environment:"))) {
    addIssue("opencode-system-prompt-live-runtime.ordering-readback", "OpenCode SystemPrompt live runtime fixture must retain base prompt and environment ordering readback.")
  }
  if (!fixture.structuredOutputReadback.schemaSha256 || fixture.structuredOutputReadback.providerRequestSlot !== "input.system[structured-output-optional]") {
    addIssue("opencode-system-prompt-live-runtime.structured-output-readback", "OpenCode SystemPrompt live runtime fixture must retain structured-output system readback.")
  }
  if (!fixture.userSystemReadback.contentSha256 || fixture.userSystemReadback.providerRequestSlot !== "system[user-system-optional]") {
    addIssue("opencode-system-prompt-live-runtime.user-system-readback", "OpenCode SystemPrompt live runtime fixture must retain input.user.system readback.")
  }
  if ((fixture.pluginTransformReadback.pluginID ?? "").length === 0 || fixture.pluginTransformReadback.mutatedSlots.length === 0) {
    addIssue("opencode-system-prompt-live-runtime.plugin-transform-readback", "OpenCode SystemPrompt live runtime fixture must retain plugin transform readback.")
  }
  if (fixture.referenceReadback.syntheticMessagePartObserved !== true) {
    addIssue("opencode-system-prompt-live-runtime.reference-readback", "OpenCode SystemPrompt live runtime fixture must retain synthetic reference message part readback.")
  }
  for (const requiredGap of [
    "opencode-system-prompt-live-runtime-fixture-partial-native-gap",
    "opencode-system-prompt-live-runtime-not-spawned",
    "opencode-system-prompt-provider-message-object-identity-not-exact",
    "opencode-system-prompt-provider-serialization-tokenization-not-exact",
  ]) {
    if (!fixture.knownGaps.includes(requiredGap)) addIssue("opencode-system-prompt-live-runtime.native-gaps", `OpenCode SystemPrompt live runtime fixture no longer records ${requiredGap}.`)
  }
  if (!fixture.retainedFields.includes("assembledSha256") || !fixture.retainedFields.includes("providerRequestSlot") || !fixture.lossyFields.some((field) => /object identity|serialization|tokenization|side effects/i.test(field))) {
    addIssue("opencode-system-prompt-live-runtime.retained-lossy-fields", "OpenCode SystemPrompt live runtime fixture must retain prompt/provider keys and name native lossiness.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function openCodeAgentSkillResources(root: string, mode: string | undefined, resources: OpenCodePromptResource[]): OpenCodePromptResource[] {
  const policy = openCodeSkillPermissionPolicy(root, normalizeOpenCodeAgentMode(mode ?? "build"))
  return resources.filter((resource) => openCodeSkillPermissionDecision(resource.name, policy.rules).included)
}

export function openCodeSkillPermissionPolicy(root: string, agentName: OpenCodeAgentPromptMode): { rules: OpenCodeSkillPermissionRule[] } {
  const rules: OpenCodeSkillPermissionRule[] = []
  for (const config of openCodeConfigRecords(root)) {
    appendOpenCodeToolSkillRules(rules, config.values["tools"])
    appendOpenCodePermissionSkillRules(rules, config.values["permission"])
    const agentConfig = openCodeAgentConfig(config.values, agentName)
    if (!agentConfig) continue
    appendOpenCodeToolSkillRules(rules, agentConfig["tools"])
    appendOpenCodePermissionSkillRules(rules, agentConfig["permission"])
  }
  return { rules }
}

export function openCodeSkillPermissionDecision(name: string, rules: OpenCodeSkillPermissionRule[]): { included: boolean; matchedRule?: OpenCodeSkillPermissionRule } {
  let matchedRule: OpenCodeSkillPermissionRule | undefined
  for (const rule of rules) {
    if (openCodePermissionPatternMatches(rule.pattern, name)) matchedRule = rule
  }
  return {
    included: matchedRule?.action !== "deny",
    ...(matchedRule ? { matchedRule } : {}),
  }
}

export function discoverOpenCodeSkillResources(cwd: string): OpenCodePromptResource[] {
  const root = resolve(cwd)
  const resources = new Map<string, OpenCodePromptResource>()
  resources.set(OPENCODE_CUSTOMIZE_SKILL_NAME, openCodeBuiltinSkillResource())
  addOpenCodeSkillFileResources(resources, openCodeGlobalExternalSkillFiles(), root, "global")
  addOpenCodeSkillFileResources(resources, openCodeProjectExternalSkillFiles(root), root)
  addOpenCodeSkillFileResources(resources, [
    ...listOpenCodeSkillFiles(join(openCodeHomeDir(), ".config", "opencode", "skill")),
    ...listOpenCodeSkillFiles(join(openCodeHomeDir(), ".config", "opencode", "skills")),
  ], root, "global")
  addOpenCodeSkillFileResources(resources, [
    ...listOpenCodeSkillFiles(join(root, ".opencode", "skill")),
    ...listOpenCodeSkillFiles(join(root, ".opencode", "skills")),
  ], root)
  for (const dir of openCodeConfiguredSkillDirs(root)) addOpenCodeSkillFileResources(resources, listOpenCodeSkillFiles(dir.path), root, dir.source)
  for (const resource of openCodeConfiguredSkillURLResources(root)) resources.set(resource.name, resource)
  return Array.from(resources.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function openCodeConfigRecords(root: string): OpenCodeConfigRecord[] {
  const configPaths = [
    { path: join(openCodeHomeDir(), ".config", "opencode", "opencode.json"), source: "global" as const },
    { path: join(root, "opencode.json"), source: "project" as const },
    { path: join(root, ".opencode", "opencode.json"), source: "project" as const },
  ]
  return configPaths.flatMap((configPath) => {
    const values = readJSONRecord(configPath.path)
    return values ? [{ path: configPath.path, source: configPath.source, values }] : []
  })
}

export function isOpenCodeSkillResource(resource: OpenCodePromptResource): boolean {
  return resource.kind === "skill" && resource.metadata?.["opencodeSkill"] === true
}

export function listOpenCodeSkillFiles(root: string): string[] {
  let stat
  try {
    stat = statSync(root)
  } catch {
    return []
  }
  if (stat.isFile()) return basename(root) === "SKILL.md" ? [root] : []
  if (!stat.isDirectory()) return []
  const files: string[] = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) files.push(...listOpenCodeSkillFiles(fullPath))
    else if (entry.isFile() && entry.name === "SKILL.md") files.push(fullPath)
  }
  return files
}

export function parseOpenCodeSkillText(text: string, fallbackName: string): { name: string; description?: string; content: string } {
  const parsed = parseFrontmatter(text)
  return {
    name: parsed.fields["name"] ?? fallbackName,
    ...(parsed.fields["description"] ? { description: parsed.fields["description"] } : {}),
    content: parsed.content.trim(),
  }
}

export function parseFrontmatter(text: string): { fields: Record<string, string>; content: string } {
  if (!text.startsWith("---\n")) return { fields: {}, content: text }
  const end = text.indexOf("\n---", 4)
  if (end === -1) return { fields: {}, content: text }
  const fields: Record<string, string> = {}
  for (const line of text.slice(4, end).split("\n")) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line.trim())
    if (!match) continue
    const [, key, rawValue] = match
    if (!key || rawValue === undefined) continue
    fields[key] = rawValue.replace(/^["']|["']$/g, "").trim()
  }
  return { fields, content: text.slice(end + "\n---".length).replace(/^\n/, "") }
}

function loadOpenCodePromptAsset(name: string): string {
  return readFileSync(new URL(`./opencode-prompts/${name}`, import.meta.url), "utf8").trimEnd()
}

const OPENCODE_PLAN_PROMPT = [
  openCodePromptAsset("plan"),
  openCodePromptAsset("plan-mode"),
].join("\n\n")

const OPENCODE_COMPACTION_PROMPT = `You are an anchored context summarization assistant for coding sessions.

Summarize only the conversation history you are given. The newest turns may be kept verbatim outside your summary, so focus on the older context that still matters for continuing the work.

If the prompt includes a <previous-summary> block, treat it as the current anchored summary. Update it with the new history by preserving still-true details, removing stale details, and merging in new facts.

Always follow the exact output structure requested by the user prompt. Keep every section, preserve exact file paths and identifiers when known, and prefer terse bullets over paragraphs.

Do not answer the conversation itself. Do not mention that you are summarizing, compacting, or merging context. Respond in the same language as the conversation.`

function renderOpenCodeResource(resource: OpenCodePromptResource): string {
  return openCodeInstructionResourcePrompt(resource)
}

function renderOpenCodeReferenceAttachment(reference: OpenCodePromptReferenceAttachment): string {
  const location = reference.path ? ` (${reference.path})` : ""
  return `# reference: ${reference.name}${location}\n${reference.content.trim()}`
}

function findGitWorkspaceRoot(cwd: string): string | undefined {
  let current = resolve(cwd)
  while (true) {
    if (pathExists(join(current, ".git"))) return current
    const parent = dirname(current)
    if (parent === current) return undefined
    current = parent
  }
}

function pathExists(path: string): boolean {
  try {
    statSync(path)
    return true
  } catch {
    return false
  }
}

function appendOpenCodePermissionSkillRules(rules: OpenCodeSkillPermissionRule[], permission: unknown): void {
  if (typeof permission === "string") {
    const action = openCodePermissionAction(permission)
    if (action) rules.push({ pattern: "*", action })
    return
  }
  if (!isRecord(permission)) return
  const all = openCodePermissionAction(permission["*"])
  if (all) rules.push({ pattern: "*", action: all })
  const skill = permission["skill"]
  if (typeof skill === "string") {
    const action = openCodePermissionAction(skill)
    if (action) rules.push({ pattern: "*", action })
    return
  }
  if (!isRecord(skill)) return
  for (const [pattern, value] of Object.entries(skill)) {
    const action = openCodePermissionAction(value)
    if (action) rules.push({ pattern, action })
  }
}

function appendOpenCodeToolSkillRules(rules: OpenCodeSkillPermissionRule[], tools: unknown): void {
  if (!isRecord(tools)) return
  for (const [pattern, value] of Object.entries(tools)) {
    if (typeof value !== "boolean" || !openCodePermissionPatternMatches(pattern, "skill")) continue
    rules.push({ pattern: "*", action: value ? "allow" : "deny" })
  }
}

export function openCodeAgentConfig(config: Record<string, unknown>, agentName: OpenCodeAgentPromptMode): Record<string, unknown> | undefined {
  const agents = isRecord(config["agent"]) ? config["agent"] : isRecord(config["agents"]) ? config["agents"] : undefined
  const agent = agents?.[agentName]
  return isRecord(agent) ? agent : undefined
}

function openCodePermissionAction(value: unknown): OpenCodePermissionAction | undefined {
  return value === "allow" || value === "ask" || value === "deny" ? value : undefined
}

function openCodePermissionPatternMatches(pattern: string, value: string): boolean {
  if (pattern === value) return true
  const source = pattern.split("").map((char) => {
    if (char === "*") return ".*"
    if (char === "?") return "."
    return escapeRegExp(char)
  }).join("")
  return new RegExp(`^${source}$`).test(value)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function addOpenCodeSkillFileResources(resources: Map<string, OpenCodePromptResource>, paths: string[], root: string, source: OpenCodePromptResourceSource = "project"): void {
  for (const path of paths.sort()) {
    const parsed = parseOpenCodeSkillFile(path)
    resources.set(parsed.name, {
      kind: "skill",
      name: parsed.name,
      path,
      content: parsed.content,
      source,
      metadata: {
        description: parsed.description,
        ...(source === "global" ? { globalSkill: true } : {}),
        opencodeSkill: true,
        relativePath: relative(root, path),
      },
    })
  }
}

function openCodeBuiltinSkillResource(): OpenCodePromptResource {
  return {
    kind: "skill",
    name: OPENCODE_CUSTOMIZE_SKILL_NAME,
    content: OPENCODE_CUSTOMIZE_SKILL_BODY,
    source: "builtin",
    metadata: {
      builtIn: true,
      description: OPENCODE_CUSTOMIZE_SKILL_DESCRIPTION,
      location: "<built-in>",
      opencodeSkill: true,
    },
  }
}

function openCodeConfiguredSkillDirs(root: string): OpenCodeSkillDir[] {
  return openCodeConfigRecords(root).flatMap((config) => {
    const skills = isRecord(config.values["skills"]) ? config.values["skills"] : undefined
    const paths = Array.isArray(skills?.["paths"]) ? skills["paths"] : []
    return paths.flatMap((item) => typeof item === "string" ? [{ path: resolveOpenCodeConfiguredSkillDir(root, item), source: config.source }] : [])
  })
}

function openCodeConfiguredSkillURLResources(root: string): OpenCodePromptResource[] {
  return openCodeConfigRecords(root).flatMap((config) => {
    const skills = isRecord(config.values["skills"]) ? config.values["skills"] : undefined
    const urls = Array.isArray(skills?.["urls"]) ? skills["urls"] : []
    return urls.flatMap((item) => typeof item === "string" ? openCodeSkillURLResources(root, item, config.source) : [])
  })
}

function resolveOpenCodeConfiguredSkillDir(root: string, path: string): string {
  if (path.startsWith("~/")) return join(openCodeHomeDir(), path.slice(2))
  return resolve(root, path)
}

function openCodeHomeDir(): string {
  return process.env["HOME"] || homedir()
}

function openCodeGlobalExternalSkillFiles(): string[] {
  const home = openCodeHomeDir()
  return [
    ...listOpenCodeSkillFiles(join(home, ".claude", "skills")),
    ...listOpenCodeSkillFiles(join(home, ".agents", "skills")),
  ]
}

function openCodeProjectExternalSkillFiles(root: string): string[] {
  const stop = findGitWorkspaceRoot(root) ?? root
  const files: string[] = []
  let current = root
  while (true) {
    files.push(...listOpenCodeSkillFiles(join(current, ".claude", "skills")))
    files.push(...listOpenCodeSkillFiles(join(current, ".agents", "skills")))
    if (current === stop) break
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return files
}

function openCodeSkillURLResources(root: string, url: string, source: OpenCodePromptResourceSource): OpenCodePromptResource[] {
  if (/^https?:\/\//i.test(url)) return openCodeHTTPSkillURLResources(url, source)
  return openCodeFileBackedSkillURLResources(root, url, source)
}

function openCodeFileBackedSkillURLResources(root: string, url: string, source: OpenCodePromptResourceSource): OpenCodePromptResource[] {
  const baseDir = resolveOpenCodeFileBackedSkillURL(root, url)
  if (!baseDir) return []
  const index = readJSONRecord(join(baseDir, "index.json"))
  const skills = Array.isArray(index?.["skills"]) ? index["skills"] : []
  return skills.flatMap((item) => {
    if (!isRecord(item) || typeof item["name"] !== "string" || !Array.isArray(item["files"]) || !item["files"].includes("SKILL.md")) return []
    const skillDir = join(baseDir, item["name"])
    const skillPath = join(skillDir, "SKILL.md")
    if (!pathExists(skillPath)) return []
    const parsed = parseOpenCodeSkillFile(skillPath)
    return [{
      kind: "skill",
      name: parsed.name,
      path: skillPath,
      content: parsed.content,
      source,
      metadata: {
        description: parsed.description,
        files: item["files"].filter((file): file is string => typeof file === "string"),
        ...(source === "global" ? { globalSkill: true } : {}),
        opencodeSkill: true,
        relativePath: relative(root, skillPath),
        sourceURL: url,
        urlSkill: true,
      },
    }]
  })
}

function openCodeHTTPSkillURLResources(url: string, source: OpenCodePromptResourceSource): OpenCodePromptResource[] {
  const indexURL = normalizeOpenCodeHTTPIndexURL(url)
  const index = readHTTPJSONRecord(indexURL.href)
  const skills = Array.isArray(index?.["skills"]) ? index["skills"] : []
  return skills.flatMap((item) => {
    if (!isRecord(item) || typeof item["name"] !== "string" || !Array.isArray(item["files"]) || !item["files"].includes("SKILL.md")) return []
    const skillURL = new URL(`${encodeURIComponent(item["name"])}/SKILL.md`, indexURL)
    const text = readHTTPText(skillURL.href)
    if (text === undefined) return []
    const parsed = parseOpenCodeSkillText(text, item["name"])
    return [{
      kind: "skill",
      name: parsed.name,
      content: parsed.content,
      source,
      metadata: {
        description: parsed.description,
        files: item["files"].filter((file): file is string => typeof file === "string"),
        ...(source === "global" ? { globalSkill: true } : {}),
        location: skillURL.href,
        opencodeSkill: true,
        remoteSkill: true,
        sourceURL: url,
        urlSkill: true,
      },
    }]
  })
}

function normalizeOpenCodeHTTPIndexURL(url: string): URL {
  const indexURL = new URL(url)
  if (indexURL.pathname.endsWith("/index.json")) return indexURL
  if (!indexURL.pathname.endsWith("/")) indexURL.pathname += "/"
  return new URL("index.json", indexURL)
}

function resolveOpenCodeFileBackedSkillURL(root: string, url: string): string | undefined {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "file:") return undefined
    return fileURLToPath(parsed)
  } catch {
    if (/^https?:\/\//i.test(url)) return undefined
    return resolve(root, url)
  }
}

function readJSONRecord(path: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown
    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function readHTTPJSONRecord(url: string): Record<string, unknown> | undefined {
  const text = readHTTPText(url)
  if (text === undefined) return undefined
  try {
    const parsed = JSON.parse(text) as unknown
    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function readHTTPText(url: string): string | undefined {
  const script = `
    const url = process.argv[1];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        clearTimeout(timeout);
        if (!response.ok) process.exit(2);
        process.stdout.write(await response.text());
      })
      .catch(() => process.exit(1));
  `
  const result = spawnSync(process.execPath, ["-e", script, url], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    timeout: 6000,
  })
  if (result.status !== 0 || result.error) return undefined
  return result.stdout
}

function parseOpenCodeSkillFile(path: string): { name: string; description?: string; content: string } {
  const text = readFileSync(path, "utf8")
  const fallbackName = basename(dirname(path))
  return parseOpenCodeSkillText(text, fallbackName)
}

function escapeOpenCodeSkillXML(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function formatOpenCodeSkillLocation(location: string): string {
  const formatted = location.startsWith("<") || /^https?:\/\//i.test(location) ? location : pathToFileURL(location).href
  return escapeOpenCodeSkillXML(formatted)
}

function buildOpenCodeUpstreamSystemPromptMatrixCase(
  rendered: OpenCodeRenderedSystemPromptSnapshot,
  providerID: string,
  modelID: string,
): OpenCodeUpstreamSystemPromptMatrixCase {
  const hasInstructions = rendered.segments.some((segment) => segment.kind === "resource")
  const hasSkills = rendered.segments.some((segment) => segment.kind === "skills")
  const hasReferences = rendered.segments.some((segment) => segment.kind === "reference")
  const promptAssetIsProviderAsset = isOpenCodeProviderPromptAsset(rendered.promptAsset)
  const anchors: OpenCodeUpstreamSystemPromptAnchor[] = [
    {
      id: "llm-request:provider-or-agent-prompt",
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamExpectation: "Final provider request prep starts with agent.prompt or SystemPrompt.provider(input.model).",
      renderedSegmentKind: "base-prompt",
      renderedSegmentName: `opencode-prompt:${rendered.promptAsset}`,
      status: promptAssetIsProviderAsset ? "matched" : "partial",
      evidence: promptAssetIsProviderAsset
        ? `rendered base prompt uses pinned opencode prompt asset ${rendered.promptAsset}`
        : `rendered base prompt uses mode-specific ${rendered.promptAsset}`,
      ...(promptAssetIsProviderAsset ? {} : { gap: "plan-compaction-agent-prompt-branch-source-anchored-only" }),
    },
    {
      id: "session-system:environment",
      upstreamPath: "packages/opencode/src/session/system.ts",
      upstreamExpectation: "SystemPrompt.environment(model) returns the environment block before instruction and skills blocks.",
      renderedSegmentKind: "environment",
      renderedSegmentName: "opencode-environment",
      status: "matched",
      evidence: "rendered environment block includes model identity, cwd, workspace root, git state, platform, and date",
    },
    {
      id: "session-instruction:system",
      upstreamPath: "packages/opencode/src/session/instruction.ts",
      upstreamExpectation: "Instruction.system() renders discovered instruction files as system blocks between environment and skills.",
      renderedSegmentKind: "resource",
      status: hasInstructions ? "partial" : "missing",
      ...(hasInstructions ? { evidence: "rendered prompt has project resource segments in the upstream instruction position" } : {}),
      gap: hasInstructions ? "instruction-file-render-format-differs-from-upstream" : "instruction-system-empty-path-not-replayed",
    },
    {
      id: "session-system:skills",
      upstreamPath: "packages/opencode/src/session/system.ts",
      upstreamExpectation: "SystemPrompt.skills(agent) appends Skill.fmt(list, { verbose: true }) after instructions when skill permission allows it.",
      renderedSegmentKind: "skills",
      renderedSegmentName: "available_skills",
      status: hasSkills ? "matched" : "missing",
      ...(hasSkills ? { evidence: "rendered skills block uses the upstream verbose <available_skills> XML shape and permission-filtered names" } : {}),
      ...(hasSkills ? {} : { gap: "skills-block-empty-path-not-replayed" }),
    },
    {
      id: "prompt-input:user-system",
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamExpectation: "LLMRequestPrep.prepare appends input.user.system after input.system when present.",
      status: "missing",
      gap: "prompt-input-user-system-branch-not-replayed",
    },
    {
      id: "prompt-input:structured-output-system",
      upstreamPath: "packages/opencode/src/session/prompt.ts",
      upstreamExpectation: "json_schema format appends STRUCTURED_OUTPUT_SYSTEM_PROMPT after skills.",
      status: "missing",
      gap: "structured-output-system-prompt-branch-not-replayed",
    },
    {
      id: "plugin:experimental-chat-system-transform",
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamExpectation: "experimental.chat.system.transform may mutate system chunks before request messages are created.",
      status: "missing",
      gap: "plugin-system-transform-side-effects-not-replayed",
    },
    {
      id: "session-prompt:reference-attachment",
      upstreamPath: "packages/opencode/src/session/prompt/reference.ts",
      upstreamExpectation: "Reference attachments are represented as synthetic message text parts, not ordinary system resource blocks.",
      renderedSegmentKind: "reference",
      status: hasReferences ? "partial" : "missing",
      ...(hasReferences ? { evidence: "rendered prompt includes reference content after system skills for local prompt-builder visibility" } : {}),
      gap: hasReferences ? "reference-attachment-synthetic-message-path-not-replayed" : "reference-attachment-empty-path-not-replayed",
    },
  ]
  return {
    name: `${rendered.mode}:${providerID}/${modelID}`,
    mode: rendered.mode,
    providerID,
    modelID,
    promptAsset: rendered.promptAsset,
    upstreamRequestOrder: openCodeUpstreamRequestOrder(rendered),
    renderedSegmentOrder: rendered.segmentOrder,
    anchors,
    matchedAnchorIDs: anchors.filter((anchor) => anchor.status === "matched").map((anchor) => anchor.id),
    partialAnchorIDs: anchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.id),
    missingAnchorIDs: anchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.id),
    assembledSha256: rendered.assembledSha256,
    status: "source-anchored-partial",
  }
}

function openCodeUpstreamRequestOrder(rendered: OpenCodeRenderedSystemPromptSnapshot): string[] {
  const order = ["0:llm-request:agent.prompt-or-SystemPrompt.provider"]
  const inputSystemSegments = rendered.segments.filter((segment) => segment.kind !== "base-prompt" && segment.kind !== "reference")
  inputSystemSegments.forEach((segment, index) => {
    const source = segment.kind === "resource" ? "Instruction.system" : segment.kind === "skills" ? "SystemPrompt.skills" : "SystemPrompt.environment"
    order.push(`${index + 1}:input.system:${source}:${segment.name}`)
  })
  order.push(`${inputSystemSegments.length + 1}:llm-request:user.system-optional`)
  order.push(`${inputSystemSegments.length + 2}:llm-request:experimental.chat.system.transform`)
  return order
}

function buildOpenCodeUpstreamSystemPromptOutputMatrixCase(
  rendered: OpenCodeRenderedSystemPromptSnapshot,
  sourceMatrix: OpenCodeUpstreamSystemPromptMatrixSnapshot,
  providerID: string,
  modelID: string,
  runtimeOutputProjection?: OpenCodeSystemPromptRuntimeOutputProjection | undefined,
): OpenCodeUpstreamSystemPromptOutputMatrixCase {
  const sourceCase = sourceMatrix.cases[0]
  const sourceAnchorsByID = new Map((sourceCase?.anchors ?? []).map((anchor) => [anchor.id, anchor]))
  const baseSegment = rendered.segments.find((segment) => segment.kind === "base-prompt")
  const environmentSegment = rendered.segments.find((segment) => segment.kind === "environment")
  const instructionSegment = rendered.segments.find((segment) => segment.kind === "resource")
  const skillsSegment = rendered.segments.find((segment) => segment.kind === "skills")
  const referenceSegment = rendered.segments.find((segment) => segment.kind === "reference")
  const promptAssetIsProviderAsset = isOpenCodeProviderPromptAsset(rendered.promptAsset)
  const runtimeProjectedStepIDs = new Set(runtimeOutputProjection?.coveredOutputStepIDs ?? [])
  const runtimeProjectedStatus = (stepID: OpenCodeSystemPromptRuntimeProjectedOutputStepID, fallback: OpenCodeUpstreamSystemPromptAnchorStatus) =>
    runtimeProjectedStepIDs.has(stepID) ? "partial" : fallback
  const runtimeProjectedEvidence = (stepID: OpenCodeSystemPromptRuntimeProjectedOutputStepID, fallback?: string) =>
    runtimeProjectedStepIDs.has(stepID) ? `runtime output projection fixture ${runtimeOutputProjection?.fixtureID} retains ${stepID}` : fallback
  const runtimeProjectedGap = (stepID: OpenCodeSystemPromptRuntimeProjectedOutputStepID, fallback: string) =>
    runtimeProjectedStepIDs.has(stepID) ? OPENCODE_PROMPT_RUNTIME_PROJECTED_OUTPUT_STEP_GAPS[stepID] : fallback
  const outputSteps: OpenCodeUpstreamSystemPromptOutputStep[] = [
    openCodeUpstreamOutputStep({
      id: "llm-request:provider-or-agent-prompt",
      outputIndex: 0,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamExpectation: "LLMRequestPrep.prepare emits agent.prompt or SystemPrompt.provider(input.model) as the first final system chunk.",
      upstreamOutputSource: "agent.prompt-or-SystemPrompt.provider",
      upstreamRequestSlot: "system[0]",
      sourceAnchorsByID,
      segment: baseSegment,
      status: promptAssetIsProviderAsset ? "matched" : "partial",
      evidence: promptAssetIsProviderAsset ? `rendered output starts with pinned provider prompt asset ${rendered.promptAsset}` : `rendered output starts with mode-specific prompt asset ${rendered.promptAsset}`,
      gap: promptAssetIsProviderAsset ? undefined : "plan-compaction-agent-prompt-output-branch-source-anchored-only",
    }),
    openCodeUpstreamOutputStep({
      id: "session-system:environment",
      outputIndex: 1,
      upstreamPath: "packages/opencode/src/session/system.ts",
      upstreamExpectation: "SystemPrompt.environment(model) is emitted after the provider prompt and before instructions/skills.",
      upstreamOutputSource: "SystemPrompt.environment",
      upstreamRequestSlot: "input.system[0]",
      sourceAnchorsByID,
      segment: environmentSegment,
      status: environmentSegment ? "matched" : "missing",
      evidence: environmentSegment ? "rendered output includes environment text in the upstream input.system slot" : undefined,
      gap: environmentSegment ? undefined : "environment-output-step-not-rendered",
    }),
    openCodeUpstreamOutputStep({
      id: "session-instruction:system",
      outputIndex: 2,
      upstreamPath: "packages/opencode/src/session/instruction.ts",
      upstreamExpectation: "Instruction.system() emits discovered instruction files between environment and skills.",
      upstreamOutputSource: "Instruction.system",
      upstreamRequestSlot: "input.system[1]",
      sourceAnchorsByID,
      segment: instructionSegment,
      status: instructionSegment ? "partial" : "missing",
      evidence: instructionSegment ? "rendered output places project resource text in the upstream instruction slot" : undefined,
      gap: instructionSegment ? "instruction-file-render-format-differs-from-upstream" : "instruction-system-empty-output-path-not-replayed",
    }),
    openCodeUpstreamOutputStep({
      id: "session-system:skills",
      outputIndex: 3,
      upstreamPath: "packages/opencode/src/session/system.ts",
      upstreamExpectation: "SystemPrompt.skills(agent) emits verbose available-skills XML after instruction output.",
      upstreamOutputSource: "SystemPrompt.skills",
      upstreamRequestSlot: "input.system[2]",
      sourceAnchorsByID,
      segment: skillsSegment,
      status: skillsSegment ? "matched" : "missing",
      evidence: skillsSegment ? "rendered output includes permission-filtered verbose <available_skills> XML" : undefined,
      gap: skillsSegment ? undefined : "skills-output-empty-path-not-replayed",
    }),
    openCodeUpstreamOutputStep({
      id: "prompt-input:structured-output-system",
      outputIndex: 4,
      upstreamPath: "packages/opencode/src/session/prompt.ts",
      upstreamExpectation: "json_schema output mode appends STRUCTURED_OUTPUT_SYSTEM_PROMPT after regular input.system chunks.",
      upstreamOutputSource: "STRUCTURED_OUTPUT_SYSTEM_PROMPT",
      upstreamRequestSlot: "input.system[structured-output-optional]",
      sourceAnchorsByID,
      status: runtimeProjectedStatus("prompt-input:structured-output-system", "missing"),
      evidence: runtimeProjectedEvidence("prompt-input:structured-output-system"),
      gap: runtimeProjectedGap("prompt-input:structured-output-system", "structured-output-system-prompt-output-not-replayed"),
    }),
    openCodeUpstreamOutputStep({
      id: "prompt-input:user-system",
      outputIndex: 5,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamExpectation: "LLMRequestPrep.prepare appends input.user.system after input.system chunks when present.",
      upstreamOutputSource: "input.user.system",
      upstreamRequestSlot: "system[user-system-optional]",
      sourceAnchorsByID,
      status: runtimeProjectedStatus("prompt-input:user-system", "missing"),
      evidence: runtimeProjectedEvidence("prompt-input:user-system"),
      gap: runtimeProjectedGap("prompt-input:user-system", "prompt-input-user-system-output-not-replayed"),
    }),
    openCodeUpstreamOutputStep({
      id: "plugin:experimental-chat-system-transform",
      outputIndex: 6,
      upstreamPath: "packages/opencode/src/session/llm/request.ts",
      upstreamExpectation: "experimental.chat.system.transform may mutate final system chunks before provider request creation.",
      upstreamOutputSource: "experimental.chat.system.transform",
      upstreamRequestSlot: "system[plugin-transform]",
      sourceAnchorsByID,
      status: runtimeProjectedStatus("plugin:experimental-chat-system-transform", "missing"),
      evidence: runtimeProjectedEvidence("plugin:experimental-chat-system-transform"),
      gap: runtimeProjectedGap("plugin:experimental-chat-system-transform", "plugin-system-transform-side-effects-not-replayed"),
    }),
    openCodeUpstreamOutputStep({
      id: "session-prompt:reference-attachment",
      outputIndex: 7,
      upstreamPath: "packages/opencode/src/session/prompt/reference.ts",
      upstreamExpectation: "Reference attachments are emitted through synthetic message text parts outside the final system chunk list.",
      upstreamOutputSource: "ReferencePrompt",
      upstreamRequestSlot: "message[reference-text-part]",
      sourceAnchorsByID,
      segment: referenceSegment,
      status: runtimeProjectedStatus("session-prompt:reference-attachment", referenceSegment ? "partial" : "missing"),
      evidence: runtimeProjectedEvidence(
        "session-prompt:reference-attachment",
        referenceSegment ? "rendered output keeps reference text visible while marking the upstream synthetic-message path partial" : undefined,
      ),
      gap: runtimeProjectedGap("session-prompt:reference-attachment", referenceSegment ? "reference-attachment-synthetic-message-output-path-not-replayed" : "reference-attachment-empty-output-path-not-replayed"),
    }),
  ]
  return {
    name: `${rendered.mode}:${providerID}/${modelID}`,
    mode: rendered.mode,
    providerID,
    modelID,
    promptAsset: rendered.promptAsset,
    sourceMatrixFingerprint: sourceMatrix.fingerprint,
    renderedFingerprint: rendered.fingerprint,
    upstreamRequestOrder: openCodeUpstreamRequestOrder(rendered),
    upstreamOutputOrder: outputSteps.map((step) => `${step.outputIndex}:${step.upstreamRequestSlot}:${step.upstreamOutputSource}`),
    renderedSegmentOrder: rendered.segmentOrder,
    outputSteps,
    matchedOutputStepIDs: outputSteps.filter((step) => step.status === "matched").map((step) => step.id),
    partialOutputStepIDs: outputSteps.filter((step) => step.status === "partial").map((step) => step.id),
    missingOutputStepIDs: outputSteps.filter((step) => step.status === "missing").map((step) => step.id),
    assembledSha256: rendered.assembledSha256,
    status: "pinned-output-partial",
  }
}

function openCodeUpstreamOutputStep(input: {
  id: string
  outputIndex: number
  upstreamPath: string
  upstreamExpectation: string
  upstreamOutputSource: string
  upstreamRequestSlot: string
  sourceAnchorsByID: Map<string, OpenCodeUpstreamSystemPromptAnchor>
  segment?: OpenCodeRenderedSystemPromptSegment | undefined
  status: OpenCodeUpstreamSystemPromptAnchorStatus
  evidence?: string | undefined
  gap?: string | undefined
}): OpenCodeUpstreamSystemPromptOutputStep {
  const sourceAnchorStatus = input.sourceAnchorsByID.get(input.id)?.status ?? input.status
  return {
    id: input.id,
    outputIndex: input.outputIndex,
    upstreamPath: input.upstreamPath,
    upstreamExpectation: input.upstreamExpectation,
    upstreamOutputSource: input.upstreamOutputSource,
    upstreamRequestSlot: input.upstreamRequestSlot,
    sourceAnchorStatus,
    ...(input.segment ? {
      renderedSegmentKind: input.segment.kind,
      renderedSegmentName: input.segment.name,
      renderedSha256: input.segment.sha256,
    } : {}),
    status: input.status,
    ...(input.evidence ? { evidence: input.evidence } : {}),
    ...(input.gap ? { gap: input.gap } : {}),
  }
}

function isOpenCodeProviderPromptAsset(asset: OpenCodeSystemPromptBaseID): asset is OpenCodePromptAssetName {
  return Object.prototype.hasOwnProperty.call(OPENCODE_PROMPT_ASSETS, asset)
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0
}

function diffOpenCodePreparedMessages(
  upstream: OpenCodeLLMRequestSystemExactMessage[],
  harness: OpenCodeLLMRequestSystemExactMessage[],
): OpenCodeSystemPromptLiveUpstreamExactDiffRecord[] {
  const length = Math.max(upstream.length, harness.length)
  return Array.from({ length }, (_, index) => {
    const upstreamMessage = upstream[index]
    const harnessMessage = harness[index]
    return {
      index,
      roleMatches: (upstreamMessage?.role ?? null) === (harnessMessage?.role ?? null),
      contentMatches: (upstreamMessage?.content ?? null) === (harnessMessage?.content ?? null),
      upstreamRole: upstreamMessage?.role ?? null,
      harnessRole: harnessMessage?.role ?? null,
      upstreamSha256: upstreamMessage?.contentSha256 ?? null,
      harnessSha256: harnessMessage?.contentSha256 ?? null,
    }
  })
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values)).sort()
}

function uniqueOpenCodeSystemPromptInvocationBoundaries(values: OpenCodeSystemPromptInvocationBoundaryID[]): OpenCodeSystemPromptInvocationBoundaryID[] {
  return OPENCODE_SYSTEM_PROMPT_INVOCATION_BOUNDARY_ORDER.filter((boundaryID) => values.includes(boundaryID))
}

function uniqueOpenCodeSystemPromptProviderMessageSlots(values: OpenCodeSystemPromptProviderMessageSlotID[]): OpenCodeSystemPromptProviderMessageSlotID[] {
  return OPENCODE_SYSTEM_PROMPT_PROVIDER_MESSAGE_SLOT_ORDER.filter((slotID) => values.includes(slotID))
}

function sha256Hex(content: string): string {
  return createHash("sha256").update(content).digest("hex")
}

function lineCount(content: string): number {
  return content.length === 0 ? 0 : content.split("\n").length
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
