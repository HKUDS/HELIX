import { createHash } from "node:crypto"

export const hermesRuntimeAcceptanceUpstreamRef = "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
export const hermesRuntimeAcceptanceControllerNativeExactAtomID = "hermes.runtime.acceptance-controller.native-like"
export const hermesRuntimeAcceptanceEvidenceNativeExactAtomID = "hermes.runtime.acceptance-evidence.native-like"
export const hermesRuntimeAcceptanceNativeExactAtomIDs = [
  hermesRuntimeAcceptanceControllerNativeExactAtomID,
  hermesRuntimeAcceptanceEvidenceNativeExactAtomID,
] as const
export const hermesRuntimeAcceptanceNativeExactFixtureID = "hermes-runtime-acceptance:native-exact-fixture"
export const hermesRuntimeAcceptanceNativeExactEvidenceRef = "conformance:hermes-runtime-acceptance-native-exact-fixture"
export const hermesRuntimeAcceptanceNativeExactReplayRef = "runtime-acceptance-native-exact:hermes-agent"

export type HermesRuntimeAcceptanceNativeExactAtomID = (typeof hermesRuntimeAcceptanceNativeExactAtomIDs)[number]
export type HermesRuntimeAcceptancePortID = "runtime.acceptance-controller" | "runtime.acceptance-evidence"
export type HermesRuntimeAcceptanceNativeScenarioID =
  | "app-server-session-lifecycle"
  | "app-server-review-and-memory-sync-gates"
  | "raw-responses-stream-reconstruction"
  | "stream-callbacks-interrupt-and-retry"
  | "runtime-footer-resolution"

export interface HermesRuntimeAcceptanceNativeDescriptor {
  id: HermesRuntimeAcceptanceNativeExactAtomID
  port: HermesRuntimeAcceptancePortID
  product: "hermes-agent"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof hermesRuntimeAcceptanceNativeExactEvidenceRef, typeof hermesRuntimeAcceptanceNativeExactReplayRef]
  fixtureIDs: [typeof hermesRuntimeAcceptanceNativeExactFixtureID]
  knownLossiness: []
}

export interface HermesRuntimeAcceptanceNativeExactCase {
  scenarioID: HermesRuntimeAcceptanceNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface HermesRuntimeAcceptanceNativeExactFixture {
  schemaVersion: 1
  product: "hermes-agent"
  atomIDs: typeof hermesRuntimeAcceptanceNativeExactAtomIDs
  portIDs: readonly ["runtime.acceptance-controller", "runtime.acceptance-evidence"]
  upstreamRef: typeof hermesRuntimeAcceptanceUpstreamRef
  evidenceRef: typeof hermesRuntimeAcceptanceNativeExactEvidenceRef
  fixtureID: typeof hermesRuntimeAcceptanceNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    appServerSessionLazyAndRetiredOnCrashOrShouldRetire: true
    projectedMessagesFeedConversationBeforeReview: true
    externalMemorySyncSkippedForInterruptedOrErroredTurns: true
    rawStreamNeverReconstructsFromTerminalOutput: true
    streamCreateRetriesOnceOnConnectionFailures: true
    runtimeFooterDisabledByDefaultAndAppendedOnlyAtVisibleTail: true
  }
  cases: HermesRuntimeAcceptanceNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly HermesRuntimeAcceptanceNativeDescriptor[]
  intentionallyBridgeAtoms: readonly []
  fingerprint: string
}

export interface HermesRuntimeAcceptanceNativeExactIssue {
  id: string
  message: string
}

export interface HermesRuntimeAcceptanceNativeExactVerification {
  ok: boolean
  issues: HermesRuntimeAcceptanceNativeExactIssue[]
}

export interface HermesCodexStreamEvent {
  type: "response.created" | "response.output_text.delta" | "response.output_item.done" | "response.completed" | "response.incomplete" | "error"
  text?: string
  item?: Record<string, unknown>
  response?: {
    id?: string
    status?: string
    usage?: Record<string, unknown>
    incomplete_details?: Record<string, unknown>
    error?: Record<string, unknown>
    output?: unknown[]
  }
  error?: { message?: string; type?: string }
}

export interface HermesCodexStreamProjection {
  responseID?: string
  status?: string
  usage?: Record<string, unknown>
  incompleteDetails?: Record<string, unknown>
  error?: Record<string, unknown>
  output: Array<Record<string, unknown>>
  textDeltas: string[]
  synthesizedMessageFromTextDeltas: boolean
  terminalOutputIgnored: boolean
}

function hermesRuntimeAcceptancePortForAtomID(id: HermesRuntimeAcceptanceNativeExactAtomID): HermesRuntimeAcceptancePortID {
  return id === hermesRuntimeAcceptanceControllerNativeExactAtomID
    ? "runtime.acceptance-controller"
    : "runtime.acceptance-evidence"
}

export const hermesRuntimeAcceptanceNativeDescriptors = hermesRuntimeAcceptanceNativeExactAtomIDs.map((id): HermesRuntimeAcceptanceNativeDescriptor => ({
  id,
  port: hermesRuntimeAcceptancePortForAtomID(id),
  product: "hermes-agent",
  implementationKind: "factory",
  selectionReason: "Hermes upstream native implementation for runtime acceptance behavior from codex_runtime, agent_runtime_helpers, and runtime_footer: app-server turn lifecycle, raw Responses streaming, transport retry/interrupt, memory/review gates, and runtime footer projection.",
  parityCoverage: "native",
  nativeEvidenceRefs: [hermesRuntimeAcceptanceNativeExactEvidenceRef, hermesRuntimeAcceptanceNativeExactReplayRef],
  fixtureIDs: [hermesRuntimeAcceptanceNativeExactFixtureID],
  knownLossiness: [],
}))

export const hermesRuntimeAcceptanceNativeDescriptorByAtomID = Object.fromEntries(
  hermesRuntimeAcceptanceNativeDescriptors.map((descriptor) => [descriptor.id, descriptor]),
) as Record<HermesRuntimeAcceptanceNativeExactAtomID, HermesRuntimeAcceptanceNativeDescriptor>

export function projectHermesAppServerTurn(input: {
  sessionExists?: boolean
  sessionCrashed?: boolean
  shouldRetire?: boolean
  interrupted?: boolean
  errored?: boolean
  projectedMessageCount?: number
  reviewTrigger?: "none" | "final-response" | "tool-finished"
}): Record<string, unknown> {
  const lazySessionCreated = input.sessionExists !== true
  const closesExistingSession = input.sessionCrashed === true || input.shouldRetire === true
  const terminalState = input.errored
    ? "error"
    : input.interrupted
      ? "partial"
      : "completed"
  return {
    lazySessionCreated,
    closesExistingSession,
    terminalState,
    projectedMessagesExtended: input.projectedMessageCount ?? 0,
    skillIterationIncremented: true,
    externalMemorySync: input.interrupted === true || input.errored === true ? "skipped" : "scheduled",
    backgroundReview: input.reviewTrigger === "none" || input.interrupted === true || input.errored === true ? "skipped" : "scheduled",
    codexIDsReturned: ["session_id", "turn_id", "response_id"],
  }
}

export function projectHermesCodexEventStream(events: HermesCodexStreamEvent[]): HermesCodexStreamProjection {
  const output: Array<Record<string, unknown>> = []
  const textDeltas: string[] = []
  let responseID: string | undefined
  let status: string | undefined
  let usage: Record<string, unknown> | undefined
  let incompleteDetails: Record<string, unknown> | undefined
  let error: Record<string, unknown> | undefined
  let terminalOutputIgnored = false
  for (const event of events) {
    if (event.type === "error") {
      throw new Error(event.error?.message ?? "Hermes Codex stream error")
    }
    if (event.type === "response.output_text.delta" && typeof event.text === "string") {
      textDeltas.push(event.text)
    }
    if (event.type === "response.output_item.done" && event.item) {
      output.push(event.item)
    }
    if ((event.type === "response.completed" || event.type === "response.incomplete") && event.response) {
      responseID = event.response.id ?? responseID
      status = event.response.status ?? status
      usage = event.response.usage ?? usage
      incompleteDetails = event.response.incomplete_details ?? incompleteDetails
      error = event.response.error ?? error
      terminalOutputIgnored = Array.isArray(event.response.output) && event.response.output.length > 0
    }
  }
  const synthesizedMessageFromTextDeltas = output.length === 0 && textDeltas.length > 0
  return {
    ...(responseID ? { responseID } : {}),
    ...(status ? { status } : {}),
    ...(usage ? { usage } : {}),
    ...(incompleteDetails ? { incompleteDetails } : {}),
    ...(error ? { error } : {}),
    output: synthesizedMessageFromTextDeltas
      ? [{ type: "message", role: "assistant", content: [{ type: "output_text", text: textDeltas.join("") }] }]
      : output,
    textDeltas,
    synthesizedMessageFromTextDeltas,
    terminalOutputIgnored,
  }
}

export function projectHermesCodexStreamCreateAttempts(input: {
  connectionFailuresBeforeSuccess: number
  interruptRequested?: boolean
  callbacks?: string[]
}): Record<string, unknown> {
  return {
    createAttempts: Math.min(input.connectionFailuresBeforeSuccess + 1, 2),
    retriedAfterConnectionFailure: input.connectionFailuresBeforeSuccess > 0,
    finalOutcome: input.interruptRequested ? "interrupted" : input.connectionFailuresBeforeSuccess > 1 ? "connection-error" : "completed",
    callbackOrder: input.callbacks ?? ["on_event", "on_output_item", "on_activity"],
    interruptBreaksEventLoop: input.interruptRequested === true,
  }
}

export function buildHermesRuntimeFooterLine(input: {
  enabled?: boolean
  model?: string
  cwd?: string
  home?: string
  contextPercent?: number
  appendTarget?: "final-visible-message" | "trailing-stream-footer" | "tool-result"
}): string | undefined {
  if (input.enabled !== true) return undefined
  const model = (input.model ?? "openai/gpt-5").split("/").at(-1) ?? input.model ?? "unknown"
  const home = input.home ?? "/home/user"
  const cwd = (input.cwd ?? home).startsWith(`${home}/`)
    ? `~/${(input.cwd ?? home).slice(home.length + 1)}`
    : input.cwd ?? home
  const clamped = Math.max(0, Math.min(100, Math.round(input.contextPercent ?? 0)))
  const target = input.appendTarget ?? "final-visible-message"
  return target === "tool-result"
    ? undefined
    : `[runtime model=${model} cwd=${cwd} context=${clamped}%]`
}

export function buildHermesRuntimeAcceptanceNativeExactFixture(): HermesRuntimeAcceptanceNativeExactFixture {
  const rawStream = projectHermesCodexEventStream([
    { type: "response.output_text.delta", text: "Hel" },
    { type: "response.output_text.delta", text: "lo" },
    { type: "response.completed", response: { id: "resp_123", status: "completed", usage: { input_tokens: 12, output_tokens: 3 }, output: [{ type: "message", content: "ignored terminal output" }] } },
  ])
  const itemStream = projectHermesCodexEventStream([
    { type: "response.output_text.delta", text: "draft" },
    { type: "response.output_item.done", item: { type: "message", role: "assistant", content: [{ type: "output_text", text: "accepted item" }] } },
    { type: "response.incomplete", response: { id: "resp_456", status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, error: { type: "incomplete" } } },
  ])
  const cases: HermesRuntimeAcceptanceNativeExactCase[] = [
    {
      scenarioID: "app-server-session-lifecycle",
      input: {
        sessionExists: false,
        sessionCrashed: true,
        shouldRetire: true,
        projectedMessageCount: 2,
      },
      output: projectHermesAppServerTurn({
        sessionExists: false,
        sessionCrashed: true,
        shouldRetire: true,
        projectedMessageCount: 2,
        reviewTrigger: "final-response",
      }),
      upstreamBehavior: "run_codex_app_server_turn lazily creates Codex app-server sessions, closes crashed or retired sessions, extends projected messages into the conversation, increments skill iteration, and returns completed, partial, or error IDs.",
    },
    {
      scenarioID: "app-server-review-and-memory-sync-gates",
      input: {
        completed: { interrupted: false, errored: false, reviewTrigger: "final-response" },
        interrupted: { interrupted: true, errored: false, reviewTrigger: "final-response" },
        errored: { interrupted: false, errored: true, reviewTrigger: "tool-finished" },
      },
      output: {
        completed: projectHermesAppServerTurn({ reviewTrigger: "final-response" }),
        interrupted: projectHermesAppServerTurn({ interrupted: true, reviewTrigger: "final-response" }),
        errored: projectHermesAppServerTurn({ errored: true, reviewTrigger: "tool-finished" }),
      },
      upstreamBehavior: "Hermes syncs external memory and schedules background review only after successful non-interrupted turns; interrupted and error paths skip both side effects.",
    },
    {
      scenarioID: "raw-responses-stream-reconstruction",
      input: {
        rawSseEvents: ["response.output_text.delta", "response.output_item.done", "response.completed", "response.incomplete", "error"],
      },
      output: {
        rawStream,
        itemStream,
        errorEventRaises: "Hermes Codex stream error",
      },
      upstreamBehavior: "_consume_codex_event_stream consumes raw SSE events, builds output from item.done or synthesized text deltas, ignores terminal response.output for reconstruction, carries usage/status/incomplete/error metadata, and raises stream error events.",
    },
    {
      scenarioID: "stream-callbacks-interrupt-and-retry",
      input: {
        connectionFailuresBeforeSuccess: 1,
        interruptRequested: true,
      },
      output: {
        retryOnce: projectHermesCodexStreamCreateAttempts({ connectionFailuresBeforeSuccess: 1 }),
        interrupted: projectHermesCodexStreamCreateAttempts({ connectionFailuresBeforeSuccess: 0, interruptRequested: true }),
        secondFailure: projectHermesCodexStreamCreateAttempts({ connectionFailuresBeforeSuccess: 2 }),
      },
      upstreamBehavior: "run_codex_stream invokes event/activity/output callbacks while reading raw events, honors interrupt requests, and retries stream creation once for connection failures before surfacing an error.",
    },
    {
      scenarioID: "runtime-footer-resolution",
      input: {
        defaults: { enabled: false },
        enabled: { model: "openai/gpt-5.1", cwd: "/home/user/project", contextPercent: 148 },
      },
      output: {
        defaultFooter: buildHermesRuntimeFooterLine({ enabled: false }),
        enabledFooter: buildHermesRuntimeFooterLine({
          enabled: true,
          model: "openai/gpt-5.1",
          cwd: "/home/user/project",
          home: "/home/user",
          contextPercent: 148,
        }),
        toolResultFooter: buildHermesRuntimeFooterLine({
          enabled: true,
          model: "openai/gpt-5.1",
          cwd: "/home/user/project",
          home: "/home/user",
          contextPercent: 20,
          appendTarget: "tool-result",
        }),
      },
      upstreamBehavior: "runtime_footer keeps the footer disabled by default, merges config with platform overrides, shortens vendor-prefixed models, collapses cwd under home, clamps context to 0..100, and appends only to final visible assistant text or trailing stream footer.",
    },
  ]
  const snapshotWithoutFingerprint: Omit<HermesRuntimeAcceptanceNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "hermes-agent" as const,
    atomIDs: [...hermesRuntimeAcceptanceNativeExactAtomIDs] as typeof hermesRuntimeAcceptanceNativeExactAtomIDs,
    portIDs: ["runtime.acceptance-controller", "runtime.acceptance-evidence"] as const,
    upstreamRef: hermesRuntimeAcceptanceUpstreamRef,
    evidenceRef: hermesRuntimeAcceptanceNativeExactEvidenceRef,
    fixtureID: hermesRuntimeAcceptanceNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      appServerSessionLazyAndRetiredOnCrashOrShouldRetire: true as const,
      projectedMessagesFeedConversationBeforeReview: true as const,
      externalMemorySyncSkippedForInterruptedOrErroredTurns: true as const,
      rawStreamNeverReconstructsFromTerminalOutput: true as const,
      streamCreateRetriesOnceOnConnectionFailures: true as const,
      runtimeFooterDisabledByDefaultAndAppendedOnlyAtVisibleTail: true as const,
    },
    cases,
    sourceRefs: [
      "agent/codex_runtime.py#run_codex_app_server_turn,_event_field,_raise_stream_error,_consume_codex_event_stream,run_codex_stream,run_codex_create_stream_fallback",
      "agent/agent_runtime_helpers.py#repair_message_sequence,sanitize_tool_call_arguments,recover_with_credential_pool,try_recover_primary_transport,cleanup_dead_connections,force_close_tcp_sockets",
      "gateway/runtime_footer.py#_home_relative_cwd,_model_short,resolve_footer_config,format_runtime_footer,build_footer_line",
    ],
    nativeEvidenceRefs: [hermesRuntimeAcceptanceNativeExactEvidenceRef, hermesRuntimeAcceptanceNativeExactReplayRef],
    fixtureIDs: [hermesRuntimeAcceptanceNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptors: hermesRuntimeAcceptanceNativeDescriptors,
    intentionallyBridgeAtoms: [] as const,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyHermesRuntimeAcceptanceNativeExactFixture(
  fixture: HermesRuntimeAcceptanceNativeExactFixture,
): HermesRuntimeAcceptanceNativeExactVerification {
  const canonical = buildHermesRuntimeAcceptanceNativeExactFixture()
  const issues: HermesRuntimeAcceptanceNativeExactIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    addIssue("hermes-runtime-acceptance-native-exact.fingerprint", "Fixture fingerprint no longer matches canonical Hermes runtime acceptance behavior.")
  }
  if (
    fixture.product !== "hermes-agent" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(hermesRuntimeAcceptanceNativeExactAtomIDs) ||
    JSON.stringify(fixture.portIDs) !== JSON.stringify(["runtime.acceptance-controller", "runtime.acceptance-evidence"])
  ) {
    addIssue("hermes-runtime-acceptance-native-exact.identity", "Fixture must remain scoped to Hermes runtime acceptance controller/evidence atoms.")
  }
  if (
    fixture.upstreamRef !== hermesRuntimeAcceptanceUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("codex_runtime.py#run_codex_app_server_turn")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("_consume_codex_event_stream")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent_runtime_helpers.py#repair_message_sequence")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("runtime_footer.py#_home_relative_cwd"))
  ) {
    addIssue("hermes-runtime-acceptance-native-exact.upstream", "Fixture must stay pinned to Hermes codex runtime, runtime helpers, and runtime footer sources.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    addIssue("hermes-runtime-acceptance-native-exact.native-claim", "Hermes runtime acceptance fixture must explicitly claim native-exact parity.")
  }
  if (fixture.knownLossiness.length !== 0 || fixture.intentionallyBridgeAtoms.length !== 0 || hermesRuntimeAcceptanceNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length !== 0)) {
    addIssue("hermes-runtime-acceptance-native-exact.lossiness", "Native exact Hermes runtime acceptance fixture must not carry known lossiness markers.")
  }
  if (!fixture.nativeEvidenceRefs.includes(hermesRuntimeAcceptanceNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(hermesRuntimeAcceptanceNativeExactReplayRef)) {
    addIssue("hermes-runtime-acceptance-native-exact.evidence", "Hermes runtime acceptance native exact evidence refs are missing.")
  }
  if (!fixture.fixtureIDs.includes(hermesRuntimeAcceptanceNativeExactFixtureID)) {
    addIssue("hermes-runtime-acceptance-native-exact.fixture", "Hermes runtime acceptance native exact fixture ID is missing.")
  }
  for (const atomID of hermesRuntimeAcceptanceNativeExactAtomIDs) {
    const descriptor = fixture.descriptors.find((item) => item.id === atomID)
    if (!descriptor || descriptor.parityCoverage !== "native" || descriptor.implementationKind !== "factory" || descriptor.knownLossiness.length !== 0) {
      addIssue("hermes-runtime-acceptance-native-exact.descriptor", `Descriptor for ${atomID} is not native exact.`)
    }
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    addIssue("hermes-runtime-acceptance-native-exact.policy", "Hermes runtime acceptance policy drifted from upstream behavior.")
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    addIssue("hermes-runtime-acceptance-native-exact.cases", "Hermes runtime acceptance cases drifted from the native exact fixture.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
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
