import { createHash } from "node:crypto"

export const hermesTraceUpstreamRef = "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
export const hermesTraceDebugSurfaceNativeExactAtomID = "hermes.trace.debug-surface"
export const hermesTraceDebugSurfaceNativeExactFixtureID = "hermes-trace-debug-surface:native-exact-fixture"
export const hermesTraceDebugSurfaceNativeExactEvidenceRef = "conformance:hermes-trace-debug-surface-native-exact-fixture"
export const hermesTraceDebugSurfaceNativeExactReplayRef = "trace-debug-surface-native-exact:hermes-agent"

export const hermesFileMutatingToolNames = ["write_file", "patch"] as const

export type HermesTraceDebugSurfaceNativeExactAtomID = typeof hermesTraceDebugSurfaceNativeExactAtomID
export type HermesFileMutatingToolName = (typeof hermesFileMutatingToolNames)[number]
export type HermesTraceDebugRecordSource = "agent.trajectory" | "agent.tool_result_classification"
export type HermesTraceDebugRecordEvent =
  | "scratchpad_to_think"
  | "scratchpad_incomplete_check"
  | "trajectory_jsonl_append"
  | "file_mutation_result_landed"

export interface HermesTraceDebugRecord {
  sequence: number
  event: HermesTraceDebugRecordEvent
  source: HermesTraceDebugRecordSource
  inputText?: string | undefined
  outputText?: string | undefined
  incomplete?: boolean | undefined
  toolName?: string | undefined
  resultText?: string | undefined
  landed?: boolean | undefined
  filename?: string | undefined
  jsonlLine?: string | undefined
  completed?: boolean | undefined
  model?: string | undefined
  redaction: "none-upstream-debug-surface"
  flowProjection: "trajectory-jsonl" | "scratchpad-surface" | "tool-result-classification"
}

export interface HermesTrajectoryJSONLAppendResult {
  filename: string
  line: string
  entry: {
    conversations: Array<Record<string, unknown>>
    timestamp: string
    model: string
    completed: boolean
  }
}

export interface HermesTraceReplayInput {
  scratchpads: string[]
  trajectories: Array<{
    trajectory: Array<Record<string, unknown>>
    model: string
    completed: boolean
    timestamp: string
    filename?: string | null | undefined
  }>
  toolResults: Array<{
    toolName: string
    result: unknown
  }>
}

export interface HermesTraceReplayResult {
  records: HermesTraceDebugRecord[]
  completedTrajectoryLines: string[]
  failedTrajectoryLines: string[]
  landedToolNames: string[]
  nonLandedToolNames: string[]
}

export interface HermesTraceNativeDescriptor {
  id: typeof hermesTraceDebugSurfaceNativeExactAtomID
  port: "trace.recorder"
  product: "hermes-agent"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof hermesTraceDebugSurfaceNativeExactEvidenceRef, typeof hermesTraceDebugSurfaceNativeExactReplayRef]
  fixtureIDs: [typeof hermesTraceDebugSurfaceNativeExactFixtureID]
  knownLossiness: []
}

export type HermesTraceNativeScenarioID =
  | "scratchpad-tags-convert-to-think"
  | "incomplete-scratchpad-detection"
  | "trajectory-jsonl-default-files"
  | "file-mutation-result-classification"

export interface HermesTraceNativeExactCase {
  scenarioID: HermesTraceNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface HermesTraceNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  atomID: typeof hermesTraceDebugSurfaceNativeExactAtomID
  portID: "trace.recorder"
  upstreamRef: typeof hermesTraceUpstreamRef
  evidenceRef: typeof hermesTraceDebugSurfaceNativeExactEvidenceRef
  fixtureID: typeof hermesTraceDebugSurfaceNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    scratchpadTagsConvertToThinkTagsByStringReplacement: true
    incompleteScratchpadRequiresOpeningTagWithoutClosingTag: true
    trajectoryJSONLUsesCompletedOrFailedDefaultFilename: true
    trajectoryJSONLPreservesNonASCIIAndPythonDefaultSeparators: true
    fileMutationLandingRequiresMutatingToolStringJSONDictWithoutTruthyError: true
    writeFileLandsWhenBytesWrittenKeyExists: true
    patchLandsOnlyWhenSuccessIsTrue: true
  }
  cases: HermesTraceNativeExactCase[]
  replay: HermesTraceReplayResult
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptor: HermesTraceNativeDescriptor
  fingerprint: string
}

export interface HermesTraceNativeExactIssue {
  id: string
  message: string
}

export interface HermesTraceNativeExactVerification {
  ok: boolean
  issues: HermesTraceNativeExactIssue[]
}

export const hermesTraceDebugSurfaceNativeDescriptor: HermesTraceNativeDescriptor = {
  id: hermesTraceDebugSurfaceNativeExactAtomID,
  port: "trace.recorder",
  product: "hermes-agent",
  implementationKind: "factory",
  selectionReason: "Hermes upstream native implementation of trajectory scratchpad conversion, trajectory JSONL append, and file mutation tool-result classification with native parity complete trace replay coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [hermesTraceDebugSurfaceNativeExactEvidenceRef, hermesTraceDebugSurfaceNativeExactReplayRef],
  fixtureIDs: [hermesTraceDebugSurfaceNativeExactFixtureID],
  knownLossiness: [],
}

export const hermesTraceNativeDescriptors = [hermesTraceDebugSurfaceNativeDescriptor] as const

export function convertHermesTraceScratchpadToThink(content: string): string {
  if (!content || !content.includes("<REASONING_SCRATCHPAD>")) return content
  return content.replaceAll("<REASONING_SCRATCHPAD>", "<think>").replaceAll("</REASONING_SCRATCHPAD>", "</think>")
}

export function hasHermesTraceIncompleteScratchpad(content: string): boolean {
  if (!content) return false
  return content.includes("<REASONING_SCRATCHPAD>") && !content.includes("</REASONING_SCRATCHPAD>")
}

export function appendHermesTrajectoryJSONL(input: {
  trajectory: Array<Record<string, unknown>>
  model: string
  completed: boolean
  timestamp?: string | undefined
  filename?: string | null | undefined
}): HermesTrajectoryJSONLAppendResult {
  const entry = {
    conversations: input.trajectory,
    timestamp: input.timestamp ?? new Date().toISOString(),
    model: input.model,
    completed: input.completed,
  }
  return {
    filename: input.filename ?? (input.completed ? "trajectory_samples.jsonl" : "failed_trajectories.jsonl"),
    line: `${pythonJSONDumps(entry)}\n`,
    entry,
  }
}

export function classifyHermesFileMutationTrace(toolName: string, result: unknown): boolean {
  if (!hermesFileMutatingToolNames.includes(toolName as HermesFileMutatingToolName) || typeof result !== "string") return false
  let data: unknown
  try {
    data = JSON.parse(result.trim()) as unknown
  } catch {
    return false
  }
  if (!isRecord(data) || isPythonTruthy(data.error)) return false
  if (toolName === "write_file") return Object.prototype.hasOwnProperty.call(data, "bytes_written")
  if (toolName === "patch") return data.success === true
  return false
}

export function replayHermesTraceDebugSurface(input: HermesTraceReplayInput): HermesTraceReplayResult {
  const records: HermesTraceDebugRecord[] = []
  const completedTrajectoryLines: string[] = []
  const failedTrajectoryLines: string[] = []
  const landedToolNames: string[] = []
  const nonLandedToolNames: string[] = []
  let sequence = 0
  const push = (record: Omit<HermesTraceDebugRecord, "sequence">) => {
    records.push({ sequence: sequence++, ...record })
  }

  for (const sample of input.scratchpads) {
    push({
      event: "scratchpad_to_think",
      source: "agent.trajectory",
      inputText: sample,
      outputText: convertHermesTraceScratchpadToThink(sample),
      redaction: "none-upstream-debug-surface",
      flowProjection: "scratchpad-surface",
    })
    push({
      event: "scratchpad_incomplete_check",
      source: "agent.trajectory",
      inputText: sample,
      incomplete: hasHermesTraceIncompleteScratchpad(sample),
      redaction: "none-upstream-debug-surface",
      flowProjection: "scratchpad-surface",
    })
  }

  for (const trajectory of input.trajectories) {
    const appended = appendHermesTrajectoryJSONL(trajectory)
    if (trajectory.completed) completedTrajectoryLines.push(appended.line)
    else failedTrajectoryLines.push(appended.line)
    push({
      event: "trajectory_jsonl_append",
      source: "agent.trajectory",
      filename: appended.filename,
      jsonlLine: appended.line,
      completed: appended.entry.completed,
      model: appended.entry.model,
      redaction: "none-upstream-debug-surface",
      flowProjection: "trajectory-jsonl",
    })
  }

  for (const result of input.toolResults) {
    const landed = classifyHermesFileMutationTrace(result.toolName, result.result)
    if (landed) landedToolNames.push(result.toolName)
    else nonLandedToolNames.push(result.toolName)
    push({
      event: "file_mutation_result_landed",
      source: "agent.tool_result_classification",
      toolName: result.toolName,
      resultText: typeof result.result === "string" ? result.result : undefined,
      landed,
      redaction: "none-upstream-debug-surface",
      flowProjection: "tool-result-classification",
    })
  }

  return {
    records,
    completedTrajectoryLines,
    failedTrajectoryLines,
    landedToolNames,
    nonLandedToolNames,
  }
}

export function buildHermesTraceNativeExactFixture(): HermesTraceNativeExactFixture {
  const completedTrajectory = [
    { from: "human", value: "Inspect Hermes trace" },
    { from: "gpt", value: convertHermesTraceScratchpadToThink("<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>答案") },
  ]
  const failedTrajectory = [
    { from: "human", value: "Patch this file" },
    { from: "gpt", value: "<REASONING_SCRATCHPAD>partial" },
  ]
  const replay = replayHermesTraceDebugSurface({
    scratchpads: [
      "<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>done",
      "<REASONING_SCRATCHPAD>partial",
      "no scratchpad here",
    ],
    trajectories: [
      {
        trajectory: completedTrajectory,
        model: "nous/hermes-4",
        completed: true,
        timestamp: "2026-06-13T12:10:42.949000",
      },
      {
        trajectory: failedTrajectory,
        model: "nous/hermes-4",
        completed: false,
        timestamp: "2026-06-13T12:11:00.000000",
      },
    ],
    toolResults: [
      { toolName: "write_file", result: '{"bytes_written": 24}' },
      { toolName: "patch", result: '{"success": true}' },
      { toolName: "patch", result: '{"success": false}' },
      { toolName: "write_file", result: '{"error": "permission denied", "bytes_written": 24}' },
      { toolName: "read_file", result: '{"bytes_written": 24}' },
      { toolName: "write_file", result: "not-json" },
      { toolName: "write_file", result: 24 },
      { toolName: "patch", result: '{"error": {}, "success": true}' },
    ],
  })
  const fixtureWithoutFingerprint: Omit<HermesTraceNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "hermes-agent" as const,
    atomID: hermesTraceDebugSurfaceNativeExactAtomID,
    portID: "trace.recorder" as const,
    upstreamRef: hermesTraceUpstreamRef,
    evidenceRef: hermesTraceDebugSurfaceNativeExactEvidenceRef,
    fixtureID: hermesTraceDebugSurfaceNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      scratchpadTagsConvertToThinkTagsByStringReplacement: true as const,
      incompleteScratchpadRequiresOpeningTagWithoutClosingTag: true as const,
      trajectoryJSONLUsesCompletedOrFailedDefaultFilename: true as const,
      trajectoryJSONLPreservesNonASCIIAndPythonDefaultSeparators: true as const,
      fileMutationLandingRequiresMutatingToolStringJSONDictWithoutTruthyError: true as const,
      writeFileLandsWhenBytesWrittenKeyExists: true as const,
      patchLandsOnlyWhenSuccessIsTrue: true as const,
    },
    cases: [
      traceCase(
        "scratchpad-tags-convert-to-think",
        { content: "<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>done" },
        { content: "<think>plan</think>done" },
        "agent.trajectory.convert_scratchpad_to_think returns content unchanged when the opening tag is absent; otherwise it replaces REASONING_SCRATCHPAD open/close tags with think open/close tags.",
      ),
      traceCase(
        "incomplete-scratchpad-detection",
        { openingOnly: "<REASONING_SCRATCHPAD>partial", closed: "<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>" },
        { openingOnly: true, closed: false, empty: false },
        "agent.trajectory.has_incomplete_scratchpad returns true only when content has the opening REASONING_SCRATCHPAD tag and lacks the closing tag.",
      ),
      traceCase(
        "trajectory-jsonl-default-files",
        { completed: true, failed: false },
        {
          completedFilename: "trajectory_samples.jsonl",
          failedFilename: "failed_trajectories.jsonl",
          completedLine: replay.completedTrajectoryLines[0],
          failedLine: replay.failedTrajectoryLines[0],
        },
        "agent.trajectory.save_trajectory defaults completed trajectories to trajectory_samples.jsonl, failed trajectories to failed_trajectories.jsonl, and appends json.dumps(entry, ensure_ascii=False) plus a newline.",
      ),
      traceCase(
        "file-mutation-result-classification",
        { mutatingTools: [...hermesFileMutatingToolNames] },
        {
          landedToolNames: replay.landedToolNames,
          nonLandedToolNames: replay.nonLandedToolNames,
          writeFileBytesWritten: true,
          patchSuccessTrue: true,
          patchSuccessFalse: false,
          invalidJson: false,
          nonMutatingTool: false,
          emptyErrorDictMatchesPythonFalsy: true,
        },
        "agent.tool_result_classification.file_mutation_result_landed only accepts write_file and patch string JSON dict payloads without a truthy error; write_file requires a bytes_written key while patch requires success is True.",
      ),
    ],
    replay,
    sourceRefs: [
      `${hermesTraceUpstreamRef}:agent/trajectory.py#convert_scratchpad_to_think,has_incomplete_scratchpad,save_trajectory`,
      `${hermesTraceUpstreamRef}:agent/tool_result_classification.py#FILE_MUTATING_TOOL_NAMES,file_mutation_result_landed`,
    ],
    nativeEvidenceRefs: [hermesTraceDebugSurfaceNativeExactEvidenceRef, hermesTraceDebugSurfaceNativeExactReplayRef],
    fixtureIDs: [hermesTraceDebugSurfaceNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptor: { ...hermesTraceDebugSurfaceNativeDescriptor },
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyHermesTraceNativeExactFixture(
  fixture: HermesTraceNativeExactFixture,
): HermesTraceNativeExactVerification {
  const canonical = buildHermesTraceNativeExactFixture()
  const issues: HermesTraceNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push(issue("fingerprint", "Fixture fingerprint no longer matches canonical Hermes trace debug-surface behavior."))
  }
  if (fixture.product !== "hermes-agent" || fixture.atomID !== hermesTraceDebugSurfaceNativeExactAtomID || fixture.portID !== "trace.recorder") {
    issues.push(issue("identity", "Fixture must remain scoped to hermes.trace.debug-surface on trace.recorder."))
  }
  if (
    fixture.upstreamRef !== hermesTraceUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent/trajectory.py#convert_scratchpad_to_think")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent/tool_result_classification.py#FILE_MUTATING_TOOL_NAMES"))
  ) {
    issues.push(issue("upstream", "Fixture must stay pinned to Hermes upstream trajectory and tool result classification source anchors."))
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push(issue("native-claim", "Hermes trace fixture must explicitly claim native-exact parity."))
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptor.knownLossiness.length > 0) {
    issues.push(issue("lossiness", "Native exact Hermes trace fixture must not carry known lossiness markers."))
  }
  if (!fixture.nativeEvidenceRefs.includes(hermesTraceDebugSurfaceNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(hermesTraceDebugSurfaceNativeExactReplayRef)) {
    issues.push(issue("evidence", "Hermes trace native exact evidence refs are missing."))
  }
  if (!fixture.fixtureIDs.includes(hermesTraceDebugSurfaceNativeExactFixtureID)) {
    issues.push(issue("fixture", "Hermes trace native exact fixture ID is missing."))
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push(issue("policy", "Hermes trace policy drifted from upstream trajectory/tool-result behavior."))
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push(issue("cases", "Hermes trace cases drifted from the native exact fixture."))
  }
  const events = fixture.replay.records.map((record) => record.event)
  for (const expected of ["scratchpad_to_think", "scratchpad_incomplete_check", "trajectory_jsonl_append", "file_mutation_result_landed"] as const) {
    if (!events.includes(expected)) issues.push(issue(`event-${expected}`, `Replay is missing ${expected}.`))
  }
  if (!fixture.replay.completedTrajectoryLines[0]?.includes('"value": "<think>plan</think>答案"')) {
    issues.push(issue("ensure-ascii-false", "Completed trajectory JSONL must preserve non-ASCII content like Python ensure_ascii=False."))
  }
  if (!fixture.replay.completedTrajectoryLines[0]?.includes('], "timestamp": "')) {
    issues.push(issue("python-json-separators", "Trajectory JSONL must use Python json.dumps default separators."))
  }
  if (!fixture.replay.records.some((record) => record.event === "trajectory_jsonl_append" && record.filename === "failed_trajectories.jsonl" && record.completed === false)) {
    issues.push(issue("failed-trajectory-file", "Failed trajectories must default to failed_trajectories.jsonl."))
  }
  const toolOutcomes = fixture.replay.records.filter((record) => record.event === "file_mutation_result_landed")
  if (toolOutcomes.filter((record) => record.landed).length !== 3) {
    issues.push(issue("tool-result-count", "write_file bytes_written, patch success True, and patch success True with Python-falsy empty error should land in the fixture replay."))
  }
  if (!classifyHermesFileMutationTrace("patch", "{\"error\": {}, \"success\": true}")) {
    issues.push(issue("python-empty-error-truthiness", "Empty JSON error dict should match Python falsy behavior and not block patch success."))
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function traceCase(
  scenarioID: HermesTraceNativeScenarioID,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  upstreamBehavior: string,
): HermesTraceNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
}

function pythonJSONDumps(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : String(value)
  if (typeof value === "boolean") return value ? "true" : "false"
  if (Array.isArray(value)) return `[${value.map(pythonJSONDumps).join(", ")}]`
  if (isRecord(value)) {
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => `${JSON.stringify(key)}: ${pythonJSONDumps(entry)}`)
      .join(", ")}}`
  }
  return "null"
}

function isPythonTruthy(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return false
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value)
  if (typeof value === "string") return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function issue(id: string, message: string): HermesTraceNativeExactIssue {
  return { id: `hermes-trace-native-exact.${id}`, message }
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
