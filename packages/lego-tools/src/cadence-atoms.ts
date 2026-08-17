import { createHash } from "node:crypto"
import type { LegoToolDefinition, LegoToolResult } from "@helix/contracts"

export type ToolCadenceProduct = "common" | "opencode" | "pi-mono" | "nanobot" | "hermes-agent"
export type ToolCadenceReplayProduct = Exclude<ToolCadenceProduct, "common">
export type ToolCadenceReplayAtomKey = "schema" | "result-projector"
export type ToolCadenceReplayStageID = "tool.plan" | "tool.result"
export type ToolCadenceReplayVisibility = "observed" | "inferred"
export type ToolResultEventStreamVisibility = "observed" | "inferred"
export type ToolResultEnvelopeRoundTripVisibility = "observed" | "inferred"
export type ToolResultWritebackTimingVisibility = "observed" | "inferred"

export interface ToolSchemaSnapshot {
  product: ToolCadenceProduct
  atomID: string
  tools: Array<{
    name: string
    aliases: string[]
    requiredFields: string[]
    pathField: string
    commandField?: string
    mutating: boolean
  }>
}

export interface ToolResultProjection {
  atomID: string
  toolName: string
  text: string
  envelope: "common" | "opencode" | "pi-mono" | "nanobot" | "hermes-agent"
}

export interface ToolCadenceReplayScenario {
  scenarioID: string
  toolName: string
  observedShape: Record<string, unknown>
  visibility: ToolCadenceReplayVisibility
}

export interface ToolCadenceReplayAtomSnapshot {
  key: ToolCadenceReplayAtomKey
  atomID: string
  portID: "tools.schema" | "tools.result-projector"
  flowStageID: ToolCadenceReplayStageID
  resultEventStreamFingerprint?: string
  resultEventStreamFixtureID?: string
  resultEnvelopeRoundTripFingerprint?: string
  resultEnvelopeRoundTripFixtureID?: string
  resultWritebackTimingFingerprint?: string
  resultWritebackTimingFixtureID?: string
  nativeFixtureSource: string
  upstreamEvidenceRefs: string[]
  fixtureID: string
  scenarios: ToolCadenceReplayScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
}

export interface ToolCadenceReplaySnapshot {
  schemaVersion: 1
  product: ToolCadenceReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureIDs: string[]
  profileFingerprint: string
  profile: ToolCadenceProfile
  resultEventStream: ToolResultEventStreamSnapshot
  resultEventStreamFingerprint: string
  resultEnvelopeRoundTrip: ToolResultEnvelopeRoundTripSnapshot
  resultEnvelopeRoundTripFingerprint: string
  resultWritebackTiming: ToolResultWritebackTimingSnapshot
  resultWritebackTimingFingerprint: string
  atoms: ToolCadenceReplayAtomSnapshot[]
  coveredKeys: ToolCadenceReplayAtomKey[]
  knownGaps: string[]
  fingerprint: string
}

export interface ToolResultEventStreamScenario {
  scenarioID: string
  toolName: string
  eventSequence: string[]
  resultEnvelope: ToolResultProjection["envelope"]
  progressSurface: string
  permissionSurface: string
  metadataSurface: string
  observedShape: Record<string, unknown>
  visibility: ToolResultEventStreamVisibility
}

export interface ToolResultEventStreamSnapshot {
  schemaVersion: 1
  product: ToolCadenceReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: ToolResultEventStreamScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface ToolResultEnvelopeRoundTripScenario {
  scenarioID: string
  toolName: string
  commonInputShape: Record<string, unknown>
  nativeEnvelopeShape: Record<string, unknown>
  commonReadbackShape: Record<string, unknown>
  lossiness: string[]
  visibility: ToolResultEnvelopeRoundTripVisibility
}

export interface ToolResultEnvelopeRoundTripSnapshot {
  schemaVersion: 1
  product: ToolCadenceReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: ToolResultEnvelopeRoundTripScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface ToolResultWritebackTimingScenario {
  scenarioID: string
  toolName: string
  eventSequence: string[]
  timingBuckets: string[]
  writebackSurface: string
  recordIDSurface: string
  observedShape: Record<string, unknown>
  visibility: ToolResultWritebackTimingVisibility
  lossiness: string[]
}

export interface ToolResultWritebackTimingSnapshot {
  schemaVersion: 1
  product: ToolCadenceReplayProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  scenarios: ToolResultWritebackTimingScenario[]
  observedFields: string[]
  inferredFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface ToolCadenceAtomDescriptor {
  id: string
  port: "tools.schema" | "tools.result-projector"
  product: ToolCadenceProduct
  lossiness: "none" | "schema-alias" | "result-envelope"
  nativeFixtureSource: "none" | "opencode-native" | "pi-native" | "nanobot-native" | "hermes-native"
  replay: ToolCadenceReplayAtomSnapshot & {
    resultEnvelope: ToolResultProjection["envelope"]
    supportsStdout: boolean
    supportsStderr: boolean
    supportsErrors: boolean
    supportsTruncation: boolean
    supportsPermissionDenied: boolean
    supportsProgress: boolean
    supportsNativeMetadata: boolean
  }
}

export interface ToolCadenceProfile {
  product: ToolCadenceProduct
  schemaID: string
  resultProjectorID: string
  envelope: ToolResultProjection["envelope"]
  nativeFixtureSource: ToolCadenceAtomDescriptor["nativeFixtureSource"]
  pathField: string
  commandField: string
  aliases: Partial<Record<string, string[]>>
}

export const toolCadenceAtomRegistry: Record<ToolCadenceProduct, ToolCadenceProfile> = {
  common: {
    product: "common",
    schemaID: "common.tools.schema.default",
    resultProjectorID: "common.tools.result-projector.default",
    envelope: "common",
    nativeFixtureSource: "none",
    pathField: "path",
    commandField: "command",
    aliases: {},
  },
  opencode: {
    product: "opencode",
    schemaID: "opencode.tools.schema.native-like",
    resultProjectorID: "opencode.tools.result-projector.native-like",
    envelope: "opencode",
    nativeFixtureSource: "opencode-native",
    pathField: "filePath",
    commandField: "cmd",
    aliases: {
      find: ["glob", "find"],
      read: ["read", "open"],
      bash: ["bash", "shell"],
    },
  },
  "pi-mono": {
    product: "pi-mono",
    schemaID: "pi.tools.schema.native-like",
    resultProjectorID: "pi.tools.result-projector.native-like",
    envelope: "pi-mono",
    nativeFixtureSource: "pi-native",
    pathField: "path",
    commandField: "command",
    aliases: {
      bash: ["bash", "run_command"],
    },
  },
  nanobot: {
    product: "nanobot",
    schemaID: "nanobot.tools.schema.native-like",
    resultProjectorID: "nanobot.tools.result-projector.native-like",
    envelope: "nanobot",
    nativeFixtureSource: "nanobot-native",
    pathField: "path",
    commandField: "command",
    aliases: {
      edit: ["edit", "replace"],
      bash: ["bash", "shell"],
    },
  },
  "hermes-agent": {
    product: "hermes-agent",
    schemaID: "hermes.tools.schema.native-like",
    resultProjectorID: "hermes.tools.result-projector.native-like",
    envelope: "hermes-agent",
    nativeFixtureSource: "hermes-native",
    pathField: "path",
    commandField: "command",
    aliases: {
      bash: ["terminal", "run_shell", "bash"],
      read: ["read_file", "read"],
      write: ["write_file", "write"],
      edit: ["patch", "edit"],
      find: ["search_files", "find"],
    },
  },
}

export const toolCadenceReplayProducts: ToolCadenceReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
export const toolCadenceReplayAtomKeys: ToolCadenceReplayAtomKey[] = ["schema", "result-projector"]

export function canonicalToolName(name: string): string {
  const normalized = name.replace(/[-\s]/g, "_").toLowerCase()
  if (["glob", "find_files", "file_search"].includes(normalized)) return "find"
  if (["ls", "list", "list_files"].includes(normalized)) return "ls"
  if (["read", "open", "view", "read_file", "file_read"].includes(normalized)) return "read"
  if (["edit", "replace", "replace_file", "file_edit"].includes(normalized)) return "edit"
  if (["bash", "shell", "exec", "run_command"].includes(normalized)) return "bash"
  if (["write", "create_file", "write_file", "file_write"].includes(normalized)) return "write"
  return normalized
}

export function createToolSchemaSnapshot(product: ToolCadenceProduct, tools: LegoToolDefinition[] = []): ToolSchemaSnapshot {
  const profile = toolCadenceAtomRegistry[product]
  const toolNames = tools.length > 0 ? tools.map((tool) => tool.name) : ["read", "edit", "write", "bash", "find", "grep", "ls"]
  return {
    product,
    atomID: profile.schemaID,
    tools: toolNames.map((name) => {
      const canonical = canonicalToolName(name)
      return {
        name: canonical,
        aliases: aliasesForTool(canonical, profile),
        requiredFields: requiredFieldsForTool(canonical),
        pathField: profile.pathField,
        ...(canonical === "bash" ? { commandField: profile.commandField } : {}),
        mutating: ["edit", "write", "bash"].includes(canonical),
      }
    }),
  }
}

export function projectToolResult(product: ToolCadenceProduct, toolName: string, result: LegoToolResult): ToolResultProjection {
  const profile = toolCadenceAtomRegistry[product]
  return {
    atomID: profile.resultProjectorID,
    toolName: canonicalToolName(toolName),
    text: result.content.map((part) => ("text" in part && typeof part.text === "string" ? part.text : "")).filter(Boolean).join("\n"),
    envelope: profile.envelope,
  }
}

export function toolCadenceAtomDescriptors(product?: ToolCadenceProduct): ToolCadenceAtomDescriptor[] {
  const products = product ? [product] : (Object.keys(toolCadenceAtomRegistry) as ToolCadenceProduct[])
  return products.flatMap((item) => {
    const profile = toolCadenceAtomRegistry[item]
    return [
      {
        id: profile.schemaID,
        port: "tools.schema",
        product: item,
        lossiness: item === "common" ? "none" : "schema-alias",
        nativeFixtureSource: profile.nativeFixtureSource,
        replay: toolReplayMetadata(profile, "schema"),
      },
      {
        id: profile.resultProjectorID,
        port: "tools.result-projector",
        product: item,
        lossiness: item === "common" ? "none" : "result-envelope",
        nativeFixtureSource: profile.nativeFixtureSource,
        replay: toolReplayMetadata(profile, "result-projector"),
      },
    ]
  })
}

export function buildToolCadenceReplaySnapshot(product: ToolCadenceReplayProduct): ToolCadenceReplaySnapshot {
  const profile = toolCadenceAtomRegistry[product]
  const resultEventStream = buildToolResultEventStreamSnapshot(product)
  const resultEnvelopeRoundTrip = buildToolResultEnvelopeRoundTripSnapshot(product)
  const resultWritebackTiming = buildToolResultWritebackTimingSnapshot(product)
  const atoms = toolCadenceReplayAtomKeys.map((key) => buildToolCadenceReplayAtomSnapshot(product, key, resultEventStream, resultEnvelopeRoundTrip, resultWritebackTiming))
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: toolCadenceUpstreamRef(product),
    evidenceRef: `conformance:${product}-tool-cadence-replay-snapshot`,
    fixtureIDs: [...atoms.map((atom) => atom.fixtureID), resultEventStream.fixtureID, resultEnvelopeRoundTrip.fixtureID, resultWritebackTiming.fixtureID],
    profileFingerprint: fingerprintObject(profile),
    profile,
    resultEventStream,
    resultEventStreamFingerprint: resultEventStream.fingerprint,
    resultEnvelopeRoundTrip,
    resultEnvelopeRoundTripFingerprint: resultEnvelopeRoundTrip.fingerprint,
    resultWritebackTiming,
    resultWritebackTimingFingerprint: resultWritebackTiming.fingerprint,
    atoms,
    coveredKeys: atoms.map((atom) => atom.key),
    knownGaps: [
      "schema-aliases-not-full-native-tool-registry",
      "result-envelope-replay-not-full-native-message-part-roundtrip",
      "permission-denied-and-progress-events-covered-by-partial-event-stream",
      "tool-result-envelope-roundtrip-covered-by-partial-fixture",
      "tool-result-writeback-timing-covered-by-partial-fixture",
      "full-native-progress-event-stream-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildToolCadenceReplayAtomSnapshot(
  product: ToolCadenceReplayProduct,
  key: ToolCadenceReplayAtomKey,
  resultEventStream = buildToolResultEventStreamSnapshot(product),
  resultEnvelopeRoundTrip = buildToolResultEnvelopeRoundTripSnapshot(product),
  resultWritebackTiming = buildToolResultWritebackTimingSnapshot(product),
): ToolCadenceReplayAtomSnapshot {
  const profile = toolCadenceAtomRegistry[product]
  return {
    key,
    atomID: key === "schema" ? profile.schemaID : profile.resultProjectorID,
    portID: key === "schema" ? "tools.schema" : "tools.result-projector",
    flowStageID: key === "schema" ? "tool.plan" : "tool.result",
    ...(key === "result-projector" ? {
      resultEventStreamFingerprint: resultEventStream.fingerprint,
      resultEventStreamFixtureID: resultEventStream.fixtureID,
      resultEnvelopeRoundTripFingerprint: resultEnvelopeRoundTrip.fingerprint,
      resultEnvelopeRoundTripFixtureID: resultEnvelopeRoundTrip.fixtureID,
      resultWritebackTimingFingerprint: resultWritebackTiming.fingerprint,
      resultWritebackTimingFixtureID: resultWritebackTiming.fixtureID,
    } : {}),
    nativeFixtureSource: profile.nativeFixtureSource,
    upstreamEvidenceRefs: toolCadenceUpstreamEvidenceRefs(product, key),
    fixtureID: toolCadenceReplayFixtureID(product, key),
    scenarios: key === "schema" ? toolSchemaReplayScenarios(profile) : toolResultReplayScenarios(profile),
    observedFields: toolCadenceObservedFields(profile, key),
    inferredFields: key === "result-projector" ? uniqueStrings([...toolCadenceInferredFields(product, key), ...resultWritebackTiming.inferredFields]) : toolCadenceInferredFields(product, key),
    lossyFields: key === "result-projector" ? uniqueStrings([...toolCadenceLossyFields(product, key), ...resultWritebackTiming.lossyFields]) : toolCadenceLossyFields(product, key),
  }
}

export function toolCadenceReplayFixtureID(product: ToolCadenceReplayProduct, key: ToolCadenceReplayAtomKey): string {
  return `${product}-tool-cadence:${key}`
}

export function toolResultEventStreamFixtureID(product: ToolCadenceReplayProduct): string {
  return `${product}-tool-cadence:result-event-stream`
}

export function toolResultEnvelopeRoundTripFixtureID(product: ToolCadenceReplayProduct): string {
  return `${product}-tool-cadence:result-envelope-roundtrip`
}

export function toolResultWritebackTimingFixtureID(product: ToolCadenceReplayProduct): string {
  return `${product}-tool-cadence:result-writeback-timing`
}

export function buildToolResultEventStreamSnapshot(product: ToolCadenceReplayProduct): ToolResultEventStreamSnapshot {
  const profile = toolCadenceAtomRegistry[product]
  const scenarios = toolResultEventStreamScenarios(profile)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: toolCadenceUpstreamRef(product),
    evidenceRef: `conformance:${product}-tool-result-event-stream`,
    fixtureID: toolResultEventStreamFixtureID(product),
    scenarios,
    observedFields: [
      "eventSequence",
      "resultEnvelope",
      "stdout",
      "stderr",
      "permissionDenied",
      "progress",
      "nativeMetadata",
      "progressSurface",
      "metadataSurface",
    ],
    inferredFields: toolResultEventStreamInferredFields(product),
    lossyFields: toolResultEventStreamLossyFields(product),
    knownGaps: [
      "native-progress-event-timing-not-replayed",
      "native-result-envelope-roundtrip-not-proven",
      "native-metadata-record-id-partial",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildToolResultEnvelopeRoundTripSnapshot(product: ToolCadenceReplayProduct): ToolResultEnvelopeRoundTripSnapshot {
  const profile = toolCadenceAtomRegistry[product]
  const scenarios = toolResultEnvelopeRoundTripScenarios(profile)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: toolCadenceUpstreamRef(product),
    evidenceRef: `conformance:${product}-tool-result-envelope-roundtrip`,
    fixtureID: toolResultEnvelopeRoundTripFixtureID(product),
    scenarios,
    observedFields: [
      "commonInputShape",
      "nativeEnvelopeShape",
      "commonReadbackShape",
      "text",
      "stdout",
      "stderr",
      "error",
      "permissionDenied",
      "progress",
      "nativeMetadata",
      "recordID",
    ],
    inferredFields: toolResultEnvelopeRoundTripInferredFields(product),
    lossyFields: toolResultEnvelopeRoundTripLossyFields(product),
    knownGaps: [
      "native-result-envelope-roundtrip-not-proven",
      "native-progress-event-timing-not-replayed",
      "native-record-id-readback-partial",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildToolResultWritebackTimingSnapshot(product: ToolCadenceReplayProduct): ToolResultWritebackTimingSnapshot {
  const profile = toolCadenceAtomRegistry[product]
  const scenarios = toolResultWritebackTimingScenarios(profile)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product,
    upstreamRef: toolCadenceUpstreamRef(product),
    evidenceRef: `conformance:${product}-tool-result-writeback-timing`,
    fixtureID: toolResultWritebackTimingFixtureID(product),
    scenarios,
    observedFields: [
      "eventSequence",
      "timingBuckets",
      "writebackSurface",
      "recordIDSurface",
      "progressBeforeFinalResult",
      "toolResultBeforeSessionWrite",
      "permissionDeniedBeforeErrorResult",
      "nativeMetadataWriteback",
    ],
    inferredFields: toolResultWritebackTimingInferredFields(product),
    lossyFields: toolResultWritebackTimingLossyFields(product),
    knownGaps: [
      "tool-result-writeback-timing-covered-by-partial-fixture",
      "native-progress-event-wall-clock-not-replayed",
      "native-session-writeback-record-id-partial",
      "native-tool-side-effects-not-fully-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

function toolReplayMetadata(profile: ToolCadenceProfile, key: ToolCadenceReplayAtomKey): ToolCadenceAtomDescriptor["replay"] {
  const replay = profile.product === "common" ?
    commonToolCadenceReplayAtomSnapshot(profile, key) :
    buildToolCadenceReplayAtomSnapshot(profile.product, key)
  return {
    ...replay,
    resultEnvelope: profile.envelope,
    supportsStdout: true,
    supportsStderr: true,
    supportsErrors: true,
    supportsTruncation: profile.product !== "common",
    supportsPermissionDenied: profile.product !== "common",
    supportsProgress: profile.product !== "common",
    supportsNativeMetadata: profile.product !== "common",
  }
}

function commonToolCadenceReplayAtomSnapshot(profile: ToolCadenceProfile, key: ToolCadenceReplayAtomKey): ToolCadenceReplayAtomSnapshot {
  return {
    key,
    atomID: key === "schema" ? profile.schemaID : profile.resultProjectorID,
    portID: key === "schema" ? "tools.schema" : "tools.result-projector",
    flowStageID: key === "schema" ? "tool.plan" : "tool.result",
    nativeFixtureSource: profile.nativeFixtureSource,
    upstreamEvidenceRefs: ["common-tool-contract"],
    fixtureID: `common-tool-cadence:${key}`,
    scenarios: key === "schema" ? toolSchemaReplayScenarios(profile) : toolResultReplayScenarios(profile),
    observedFields: toolCadenceObservedFields(profile, key),
    inferredFields: [],
    lossyFields: [],
  }
}

function toolSchemaReplayScenarios(profile: ToolCadenceProfile): ToolCadenceReplayScenario[] {
  const core: ToolCadenceReplayScenario[] = ["read", "write", "edit", "bash", "find"].map((toolName) => {
    const canonical = canonicalToolName(toolName)
    return {
      scenarioID: `${canonical}-schema`,
      toolName: canonical,
      observedShape: {
        aliases: aliasesForTool(canonical, profile),
        requiredFields: requiredFieldsForTool(canonical),
        pathField: profile.pathField,
        ...(canonical === "bash" ? { commandField: profile.commandField } : {}),
        mutating: ["edit", "write", "bash"].includes(canonical),
      },
      visibility: "observed",
    }
  })
  return [
    ...core,
    {
      scenarioID: "permission-policy-schema",
      toolName: "edit",
      observedShape: {
        aliases: aliasesForTool("edit", profile),
        permissionSubjectField: profile.pathField,
        deniedOutcome: "tool-result-error",
        approvalRequiredForMutation: profile.product !== "common",
        productPolicy: toolPermissionPolicyShape(profile.product),
      },
      visibility: profile.product === "common" ? "inferred" : "observed",
    },
  ]
}

function toolResultReplayScenarios(profile: ToolCadenceProfile): ToolCadenceReplayScenario[] {
  return [
    {
      scenarioID: "read-text-result",
      toolName: "read",
      observedShape: { envelope: profile.envelope, contentType: "text", textVisible: true },
      visibility: "observed",
    },
    {
      scenarioID: "bash-stdout-result",
      toolName: "bash",
      observedShape: { envelope: profile.envelope, stdout: true, stderr: false, error: false },
      visibility: "observed",
    },
    {
      scenarioID: "bash-stderr-result",
      toolName: "bash",
      observedShape: { envelope: profile.envelope, stdout: false, stderr: true, error: false },
      visibility: "observed",
    },
    {
      scenarioID: "tool-error-result",
      toolName: "edit",
      observedShape: { envelope: profile.envelope, error: true, contentType: "text" },
      visibility: "observed",
    },
    {
      scenarioID: "truncated-result",
      toolName: "read",
      observedShape: { envelope: profile.envelope, truncationSupported: profile.product !== "common" },
      visibility: profile.product === "common" ? "inferred" : "observed",
    },
    {
      scenarioID: "permission-denied-result",
      toolName: "edit",
      observedShape: {
        envelope: profile.envelope,
        permissionDenied: true,
        error: true,
        contentType: "text",
        policySurface: toolPermissionPolicyShape(profile.product),
      },
      visibility: profile.product === "common" ? "inferred" : "observed",
    },
    {
      scenarioID: "progress-update-result",
      toolName: "bash",
      observedShape: {
        envelope: profile.envelope,
        progress: true,
        status: "running",
        partialOutput: true,
        progressSurface: toolProgressSurface(profile.product),
      },
      visibility: profile.product === "common" ? "inferred" : "observed",
    },
    {
      scenarioID: "native-metadata-result",
      toolName: "bash",
      observedShape: {
        envelope: profile.envelope,
        nativeMetadata: true,
        recordID: "partial",
        eventOrder: "partial",
        metadataSurface: toolNativeMetadataSurface(profile.product),
      },
      visibility: "inferred",
    },
  ]
}

function toolResultEventStreamScenarios(profile: ToolCadenceProfile): ToolResultEventStreamScenario[] {
  const progressSurface = toolProgressSurface(profile.product)
  const permissionSurface = toolPermissionPolicyShape(profile.product)
  const metadataSurface = toolNativeMetadataSurface(profile.product)
  const resultEnvelope = profile.envelope
  return [
    {
      scenarioID: "stdout-stderr-result-stream",
      toolName: "bash",
      eventSequence: ["tool.start", "tool.stdout", "tool.stderr", "tool.result"],
      resultEnvelope,
      progressSurface,
      permissionSurface,
      metadataSurface,
      observedShape: {
        stdout: true,
        stderr: true,
        finalResult: true,
        envelope: resultEnvelope,
      },
      visibility: "observed",
    },
    {
      scenarioID: "permission-denied-event-stream",
      toolName: "edit",
      eventSequence: ["permission.ask", "permission.denied", "tool.result.error"],
      resultEnvelope,
      progressSurface,
      permissionSurface,
      metadataSurface,
      observedShape: {
        permissionDenied: true,
        permissionSurface,
        finalResult: "error",
        envelope: resultEnvelope,
      },
      visibility: profile.product === "common" ? "inferred" : "observed",
    },
    {
      scenarioID: "progress-update-event-stream",
      toolName: "bash",
      eventSequence: ["tool.start", "tool.progress", "tool.partial-output", "tool.result"],
      resultEnvelope,
      progressSurface,
      permissionSurface,
      metadataSurface,
      observedShape: {
        progress: true,
        progressSurface,
        partialOutput: true,
        envelope: resultEnvelope,
      },
      visibility: profile.product === "common" ? "inferred" : "observed",
    },
    {
      scenarioID: "native-metadata-event-stream",
      toolName: "bash",
      eventSequence: ["tool.start", "tool.result", "session.write"],
      resultEnvelope,
      progressSurface,
      permissionSurface,
      metadataSurface,
      observedShape: {
        nativeMetadata: true,
        metadataSurface,
        recordID: "partial",
        envelope: resultEnvelope,
      },
      visibility: "inferred",
    },
  ]
}

function toolResultEnvelopeRoundTripScenarios(profile: ToolCadenceProfile): ToolResultEnvelopeRoundTripScenario[] {
  const surfaces = toolResultEnvelopeRoundTripSurfaces(profile.product)
  const envelope = profile.envelope
  return [
    {
      scenarioID: "text-result-envelope-roundtrip",
      toolName: "read",
      commonInputShape: { contentType: "text", text: "observed", error: false },
      nativeEnvelopeShape: {
        envelope,
        partType: surfaces.textPart,
        resultRecord: surfaces.resultRecord,
        textField: surfaces.textField,
      },
      commonReadbackShape: { contentType: "text", textVisible: true, envelope },
      lossiness: [],
      visibility: "observed",
    },
    {
      scenarioID: "stdout-stderr-envelope-roundtrip",
      toolName: "bash",
      commonInputShape: { stdout: true, stderr: true, exitCode: 0 },
      nativeEnvelopeShape: {
        envelope,
        partType: surfaces.outputPart,
        resultRecord: surfaces.resultRecord,
        stdoutField: surfaces.stdoutField,
        stderrField: surfaces.stderrField,
      },
      commonReadbackShape: { stdout: true, stderr: true, error: false, envelope },
      lossiness: ["stream-chunk-timestamps", "raw-output-chunk-boundaries"],
      visibility: "observed",
    },
    {
      scenarioID: "permission-denied-envelope-roundtrip",
      toolName: "edit",
      commonInputShape: { permissionDenied: true, error: true, policySubject: profile.pathField },
      nativeEnvelopeShape: {
        envelope,
        partType: surfaces.errorPart,
        resultRecord: surfaces.resultRecord,
        permissionSurface: toolPermissionPolicyShape(profile.product),
      },
      commonReadbackShape: { permissionDenied: true, error: true, envelope },
      lossiness: ["approval-request-id", "native-policy-ui-event-order"],
      visibility: profile.product === "common" ? "inferred" : "observed",
    },
    {
      scenarioID: "progress-final-envelope-roundtrip",
      toolName: "bash",
      commonInputShape: { progress: true, partialOutput: true, finalResult: true },
      nativeEnvelopeShape: {
        envelope,
        partType: surfaces.progressPart,
        resultRecord: surfaces.resultRecord,
        progressSurface: toolProgressSurface(profile.product),
      },
      commonReadbackShape: { progress: "partial", finalResult: true, envelope },
      lossiness: ["progress-event-timestamps", "partial-output-interleave-order"],
      visibility: profile.product === "common" ? "inferred" : "observed",
    },
    {
      scenarioID: "native-metadata-envelope-roundtrip",
      toolName: "bash",
      commonInputShape: { nativeMetadata: true, recordID: "partial" },
      nativeEnvelopeShape: {
        envelope,
        partType: surfaces.metadataPart,
        resultRecord: surfaces.resultRecord,
        metadataSurface: toolNativeMetadataSurface(profile.product),
      },
      commonReadbackShape: { nativeMetadata: "semantic", recordID: "partial", envelope },
      lossiness: ["native-record-id", "native-side-effect-order"],
      visibility: "inferred",
    },
  ]
}

function toolResultWritebackTimingScenarios(profile: ToolCadenceProfile): ToolResultWritebackTimingScenario[] {
  const product = profile.product as ToolCadenceReplayProduct
  const writebackSurface = toolResultWritebackSurface(product)
  const recordIDSurface = toolResultWritebackRecordIDSurface(product)
  return [
    {
      scenarioID: "progress-before-final-result",
      toolName: "bash",
      eventSequence: ["tool.start", "tool.progress", "tool.partial-output", "tool.result", "session.write"],
      timingBuckets: ["tool-dispatch", "progress-update", "partial-output", "final-result", "session-write"],
      writebackSurface,
      recordIDSurface,
      observedShape: {
        progressBeforeFinalResult: true,
        finalResultAfterPartialOutput: true,
        envelope: profile.envelope,
      },
      visibility: "observed",
      lossiness: ["progress-event-wall-clock", "partial-output-interleave-order"],
    },
    {
      scenarioID: "tool-result-before-session-write",
      toolName: "bash",
      eventSequence: ["tool.start", "tool.stdout", "tool.stderr", "tool.result", "session.write"],
      timingBuckets: ["tool-dispatch", "stdout-stderr", "tool-result-record", "session-write"],
      writebackSurface,
      recordIDSurface,
      observedShape: {
        stdoutBeforeResult: true,
        stderrBeforeResult: true,
        sessionWriteAfterResult: true,
      },
      visibility: "observed",
      lossiness: ["native-session-write-clock", "stdout-stderr-chunk-boundary"],
    },
    {
      scenarioID: "permission-denied-error-writeback",
      toolName: "edit",
      eventSequence: ["permission.ask", "permission.denied", "tool.result.error", "session.write"],
      timingBuckets: ["permission-request", "denied-boundary", "error-result", "session-write"],
      writebackSurface,
      recordIDSurface,
      observedShape: {
        permissionDeniedBeforeErrorResult: true,
        errorResultWritten: true,
        policySurface: toolPermissionPolicyShape(profile.product),
      },
      visibility: profile.product === "common" ? "inferred" : "observed",
      lossiness: ["approval-request-id", "permission-ui-event-order"],
    },
    {
      scenarioID: "native-metadata-record-id-writeback",
      toolName: "bash",
      eventSequence: ["tool.start", "tool.result", "native.metadata", "session.write"],
      timingBuckets: ["tool-dispatch", "tool-result", "native-metadata", "session-write"],
      writebackSurface,
      recordIDSurface,
      observedShape: {
        nativeMetadata: true,
        metadataSurface: toolNativeMetadataSurface(profile.product),
        recordID: "partial",
        sessionWriteback: "semantic",
      },
      visibility: "inferred",
      lossiness: ["native-record-id", "metadata-private-state", "native-side-effect-order"],
    },
  ]
}

function toolCadenceObservedFields(profile: ToolCadenceProfile, key: ToolCadenceReplayAtomKey): string[] {
  if (key === "schema") return ["aliases", "requiredFields", "pathField", "commandField", "mutationClass", "permissionSubjectField", "approvalRequiredForMutation", profile.pathField, profile.commandField]
  return ["resultEnvelope", "textContent", "stdout", "stderr", "error", "truncation", "permissionDenied", "progress", "nativeMetadata", profile.envelope]
}

function toolCadenceInferredFields(product: ToolCadenceReplayProduct, key: ToolCadenceReplayAtomKey): string[] {
  if (key === "schema") {
    if (product === "opencode") return ["plugin-tool-registration-order", "permission-tool-hidden-fields"]
    if (product === "pi-mono") return ["typebox-default-values", "extension-tool-override-order"]
    if (product === "nanobot") return ["skill-loader-tool-priority", "required-bin-env-side-effects"]
    return ["acp-tool-registry-priority", "computer-use-tool-gating"]
  }
  if (product === "opencode") return ["plugin-rendered-tool-result-parts", "permission-denied-render-side-effects"]
  if (product === "pi-mono") return ["jsonl-v3-tool-result-record-id", "extension-result-event-order"]
  if (product === "nanobot") return ["workspace-session-tool-result-side-files", "skill-tool-result-metadata"]
  return ["acp-api-tool-result-metadata", "memory-tool-result-side-effects"]
}

function toolCadenceLossyFields(product: ToolCadenceReplayProduct, key: ToolCadenceReplayAtomKey): string[] {
  const common = ["semantic-tool-cadence-replay", "not-full-native-tool-registry-replay"]
  if (key === "schema") {
    if (product === "pi-mono") return [...common, "typebox-schema-default-detail"]
    if (product === "hermes-agent") return [...common, "acp-computer-use-tool-detail"]
    return [...common, "native-tool-registration-side-effects"]
  }
  const resultRoundTrip = ["partial-tool-result-envelope-roundtrip", "native-result-envelope-roundtrip-not-proven"]
  if (product === "opencode") return [...common, ...resultRoundTrip, "message-v2-tool-result-part-detail", "permission-denied-envelope-detail", "progress-event-envelope-detail"]
  if (product === "nanobot") return [...common, ...resultRoundTrip, "skill-tool-result-envelope-detail", "progress-event-envelope-detail"]
  return [...common, ...resultRoundTrip, "native-tool-result-metadata-detail", "progress-event-envelope-detail"]
}

function toolResultEventStreamInferredFields(product: ToolCadenceReplayProduct): string[] {
  if (product === "opencode") return ["message-v2-status-part-record-id", "permission-tool-render-side-effect-order"]
  if (product === "pi-mono") return ["jsonl-v3-progress-record-id", "extension-result-event-order"]
  if (product === "nanobot") return ["workspace-session-progress-record-id", "skill-tool-side-file-order"]
  return ["api-acp-progress-event-id", "memory-tool-result-side-effect-order"]
}

function toolResultEventStreamLossyFields(product: ToolCadenceReplayProduct): string[] {
  const common = ["partial-tool-result-event-stream", "native-progress-event-timing-not-replayed", "native-result-envelope-roundtrip-not-proven"]
  if (product === "opencode") return [...common, "message-v2-tool-result-part-detail"]
  if (product === "pi-mono") return [...common, "jsonl-v3-tool-record-order"]
  if (product === "nanobot") return [...common, "workspace-side-file-effect-order"]
  return [...common, "acp-api-tool-metadata-detail"]
}

function toolResultEnvelopeRoundTripInferredFields(product: ToolCadenceReplayProduct): string[] {
  if (product === "opencode") return ["message-v2-tool-result-part-id", "permission-tool-ui-event-order"]
  if (product === "pi-mono") return ["jsonl-v3-tool-result-record-id", "extension-progress-event-order"]
  if (product === "nanobot") return ["workspace-session-tool-result-record-id", "skill-side-file-effect-order"]
  return ["api-acp-tool-result-event-id", "memory-tool-side-effect-order"]
}

function toolResultEnvelopeRoundTripLossyFields(product: ToolCadenceReplayProduct): string[] {
  const common = [
    "partial-tool-result-envelope-roundtrip",
    "native-result-envelope-roundtrip-not-proven",
    "native-progress-event-timing-not-replayed",
    "native-record-id-readback-partial",
  ]
  if (product === "opencode") return [...common, "message-v2-tool-result-part-detail"]
  if (product === "pi-mono") return [...common, "jsonl-v3-tool-record-order"]
  if (product === "nanobot") return [...common, "workspace-side-file-effect-order"]
  return [...common, "acp-api-tool-metadata-detail"]
}

function toolResultWritebackTimingInferredFields(product: ToolCadenceReplayProduct): string[] {
  if (product === "opencode") return ["message-v2-tool-result-record-id", "sqlite-session-write-clock", "plugin-tool-side-effect-order"]
  if (product === "pi-mono") return ["jsonl-v3-tool-result-record-id", "extension-progress-clock", "terminal-output-flush-order"]
  if (product === "nanobot") return ["workspace-session-tool-record-id", "skills-side-file-write-order", "memory-sidecar-tool-metadata"]
  return ["api-acp-tool-result-event-id", "gateway-session-write-clock", "memory-tool-side-effect-order"]
}

function toolResultWritebackTimingLossyFields(product: ToolCadenceReplayProduct): string[] {
  const common = [
    "partial-tool-result-writeback-timing",
    "native-progress-event-timing-not-replayed",
    "native-session-writeback-record-id-partial",
    "native-tool-side-effects-not-fully-replayed",
  ]
  if (product === "opencode") return [...common, "message-v2-tool-result-writeback-partial"]
  if (product === "pi-mono") return [...common, "jsonl-v3-tool-record-writeback-partial"]
  if (product === "nanobot") return [...common, "workspace-side-file-effect-order"]
  return [...common, "acp-api-tool-writeback-partial"]
}

function toolCadenceUpstreamRef(product: ToolCadenceReplayProduct): string {
  if (product === "opencode") return "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  if (product === "pi-mono") return "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  if (product === "nanobot") return "package:nanobot-ai@0.2.0"
  return "package:hermes-agent==0.15.1"
}

function toolCadenceUpstreamEvidenceRefs(product: ToolCadenceReplayProduct, key: ToolCadenceReplayAtomKey): string[] {
  const base = toolCadenceUpstreamRef(product)
  const keyRefs = {
    schema: product === "opencode" ? ["plugin-tool-schema", "permission-tool-schema"] :
      product === "pi-mono" ? ["typebox-tool-schema", "extension-tool-schema"] :
      product === "nanobot" ? ["native-tool-registry", "skills-tool-loader"] :
      ["acp-api-tool-registry", "computer-use-tool-schema"],
    "result-projector": product === "opencode" ? ["message-v2-tool-result-parts", "permission-denied-result-render"] :
      product === "pi-mono" ? ["jsonl-v3-tool-result-record", "extension-tool-result-event"] :
      product === "nanobot" ? ["workspace-session-tool-result", "skills-tool-result"] :
      ["acp-api-tool-result", "memory-tool-result"],
  } satisfies Record<ToolCadenceReplayAtomKey, string[]>
  return [base, ...keyRefs[key]]
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values))
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

function aliasesForTool(toolName: string, profile: ToolCadenceProfile): string[] {
  const aliases = profile.aliases[toolName]
  if (aliases) return aliases
  if (toolName === "write") return ["write", "create_file"]
  return [toolName]
}

function requiredFieldsForTool(toolName: string): string[] {
  if (toolName === "bash") return ["command"]
  if (toolName === "edit") return ["path", "oldText", "newText"]
  if (toolName === "write") return ["path", "content"]
  if (toolName === "read") return ["path"]
  return []
}

function toolPermissionPolicyShape(product: ToolCadenceProduct): string {
  if (product === "opencode") return "permission-tool-result-part"
  if (product === "pi-mono") return "extension-tool-denied-event"
  if (product === "nanobot") return "skills-tool-denied-record"
  if (product === "hermes-agent") return "acp-api-tool-denied-record"
  return "common-tool-error"
}

function toolProgressSurface(product: ToolCadenceProduct): string {
  if (product === "opencode") return "message-v2-status-part"
  if (product === "pi-mono") return "jsonl-v3-tool-progress"
  if (product === "nanobot") return "workspace-session-progress"
  if (product === "hermes-agent") return "api-acp-progress-event"
  return "common-running-status"
}

function toolNativeMetadataSurface(product: ToolCadenceProduct): string {
  if (product === "opencode") return "message-v2-tool-result-metadata"
  if (product === "pi-mono") return "jsonl-v3-tool-record-metadata"
  if (product === "nanobot") return "workspace-session-tool-metadata"
  if (product === "hermes-agent") return "api-acp-tool-metadata"
  return "common-tool-metadata"
}

function toolResultWritebackSurface(product: ToolCadenceReplayProduct): string {
  if (product === "opencode") return "message-v2.tool-result-part->sqlite.session-write"
  if (product === "pi-mono") return "jsonl-v3.tool-result-record->terminal-output"
  if (product === "nanobot") return "workspace-session.tool-result->sidecar-write"
  return "api-acp.tool-result->session-event"
}

function toolResultWritebackRecordIDSurface(product: ToolCadenceReplayProduct): string {
  if (product === "opencode") return "message-v2.part_id/sqlite.rowid"
  if (product === "pi-mono") return "jsonl-v3.record_id"
  if (product === "nanobot") return "workspace-session.record_id"
  return "api-acp.event_id"
}

function toolResultEnvelopeRoundTripSurfaces(product: ToolCadenceProduct): {
  resultRecord: string
  textPart: string
  outputPart: string
  errorPart: string
  progressPart: string
  metadataPart: string
  textField: string
  stdoutField: string
  stderrField: string
} {
  if (product === "opencode") {
    return {
      resultRecord: "message-v2.tool-result-part",
      textPart: "message-v2.text-part",
      outputPart: "message-v2.tool-output-part",
      errorPart: "message-v2.tool-error-part",
      progressPart: "message-v2.step-finish-part",
      metadataPart: "message-v2.tool-metadata",
      textField: "text",
      stdoutField: "output.stdout",
      stderrField: "output.stderr",
    }
  }
  if (product === "pi-mono") {
    return {
      resultRecord: "jsonl-v3.tool_result",
      textPart: "jsonl-v3.text",
      outputPart: "jsonl-v3.command_output",
      errorPart: "jsonl-v3.tool_error",
      progressPart: "jsonl-v3.tool_progress",
      metadataPart: "jsonl-v3.provider_metadata",
      textField: "content",
      stdoutField: "stdout",
      stderrField: "stderr",
    }
  }
  if (product === "nanobot") {
    return {
      resultRecord: "workspace-session.tool_result",
      textPart: "workspace-session.text",
      outputPart: "workspace-session.shell_output",
      errorPart: "workspace-session.tool_error",
      progressPart: "workspace-session.progress",
      metadataPart: "workspace-session.skill_metadata",
      textField: "message",
      stdoutField: "stdout",
      stderrField: "stderr",
    }
  }
  if (product === "hermes-agent") {
    return {
      resultRecord: "api-acp.tool_result",
      textPart: "api-acp.content_block",
      outputPart: "api-acp.command_output",
      errorPart: "api-acp.tool_error",
      progressPart: "api-acp.progress",
      metadataPart: "api-acp.tool_metadata",
      textField: "text",
      stdoutField: "stdout",
      stderrField: "stderr",
    }
  }
  return {
    resultRecord: "common.tool_result",
    textPart: "common.text",
    outputPart: "common.output",
    errorPart: "common.error",
    progressPart: "common.progress",
    metadataPart: "common.metadata",
    textField: "text",
    stdoutField: "stdout",
    stderrField: "stderr",
  }
}
