import { createHash } from "node:crypto"

export const openCodeRuntimeAcceptanceUpstreamRef = "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const
export const openCodeRuntimeAcceptanceControllerNativeExactAtomID = "opencode.runtime.acceptance-controller.native-like"
export const openCodeRuntimeAcceptanceEvidenceNativeExactAtomID = "opencode.runtime.acceptance-evidence.native-like"
export const openCodeRuntimeAcceptanceNativeExactAtomIDs = [
  openCodeRuntimeAcceptanceControllerNativeExactAtomID,
  openCodeRuntimeAcceptanceEvidenceNativeExactAtomID,
] as const
export const openCodeRuntimeAcceptanceNativeExactFixtureID = "opencode-runtime-acceptance:native-exact-fixture"
export const openCodeRuntimeAcceptanceNativeExactEvidenceRef = "conformance:opencode-runtime-acceptance-native-exact-fixture"
export const openCodeRuntimeAcceptanceNativeExactReplayRef = "runtime-acceptance-native-exact:opencode"
export const openCodeRuntimeAssemblyUpstreamRef = openCodeRuntimeAcceptanceUpstreamRef
export const openCodeRuntimeModuleCatalogNativeExactAtomID = "opencode.runtime.module-catalog"
export const openCodeRuntimeCapabilityResolverNativeExactAtomID = "opencode.runtime.capability-resolver"
export const openCodeRuntimeBindingPlannerNativeExactAtomID = "opencode.runtime.binding-planner"
export const openCodeRuntimeLifecycleRunnerNativeExactAtomID = "opencode.runtime.lifecycle-runner"
export const openCodeRuntimeAssemblyGraphNativeExactAtomID = "opencode.runtime.assembly-graph"
export const openCodeRuntimeAssemblyNativeExactAtomIDs = [
  openCodeRuntimeModuleCatalogNativeExactAtomID,
  openCodeRuntimeCapabilityResolverNativeExactAtomID,
  openCodeRuntimeBindingPlannerNativeExactAtomID,
  openCodeRuntimeLifecycleRunnerNativeExactAtomID,
  openCodeRuntimeAssemblyGraphNativeExactAtomID,
] as const
export const openCodeRuntimeAssemblyNativeExactFixtureID = "opencode-runtime-assembly:native-exact-fixture"
export const openCodeRuntimeAssemblyNativeExactEvidenceRef = "conformance:opencode-runtime-assembly-native-exact-fixture"
export const openCodeRuntimeAssemblyNativeExactReplayRef = "runtime-assembly-native-exact:opencode"

export type OpenCodeRuntimeAcceptanceNativeExactAtomID = (typeof openCodeRuntimeAcceptanceNativeExactAtomIDs)[number]
export type OpenCodeRuntimeAssemblyNativeExactAtomID = (typeof openCodeRuntimeAssemblyNativeExactAtomIDs)[number]
export type OpenCodeRuntimeAcceptancePortID = "runtime.acceptance-controller" | "runtime.acceptance-evidence"
export type OpenCodeRuntimeAssemblyPortID =
  | "runtime.module-catalog"
  | "runtime.capability-resolver"
  | "runtime.binding-planner"
  | "runtime.lifecycle-runner"
  | "runtime.assembly-graph"
export type OpenCodeRuntimeAcceptanceNativeScenarioID =
  | "run-state-busy-idle-shell-and-cancel"
  | "status-events-and-idle-removal"
  | "processor-tool-result-error-and-cleanup"
  | "retry-policy-status-boundary"
  | "processor-and-compaction-result-boundary"
export type OpenCodeRuntimeAssemblyNativeScenarioID =
  | "module-catalog-interactive-runtime-services"
  | "capability-resolution-runtime-order"
  | "binding-plan-runtime-ports"
  | "lifecycle-runner-split-footer-and-transport"
  | "assembly-graph-runtime-lockfile"

export interface OpenCodeRuntimeAcceptanceNativeDescriptor {
  id: OpenCodeRuntimeAcceptanceNativeExactAtomID
  port: OpenCodeRuntimeAcceptancePortID
  product: "opencode"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof openCodeRuntimeAcceptanceNativeExactEvidenceRef, typeof openCodeRuntimeAcceptanceNativeExactReplayRef]
  fixtureIDs: [typeof openCodeRuntimeAcceptanceNativeExactFixtureID]
  knownLossiness: []
}

export interface OpenCodeRuntimeAssemblyNativeDescriptor {
  id: OpenCodeRuntimeAssemblyNativeExactAtomID
  port: OpenCodeRuntimeAssemblyPortID
  product: "opencode"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof openCodeRuntimeAssemblyNativeExactEvidenceRef, typeof openCodeRuntimeAssemblyNativeExactReplayRef]
  fixtureIDs: [typeof openCodeRuntimeAssemblyNativeExactFixtureID]
  knownLossiness: []
}

export interface OpenCodeRuntimeAcceptanceNativeExactCase {
  scenarioID: OpenCodeRuntimeAcceptanceNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface OpenCodeRuntimeAssemblyNativeExactCase {
  scenarioID: OpenCodeRuntimeAssemblyNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface OpenCodeRuntimeAcceptanceNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: typeof openCodeRuntimeAcceptanceNativeExactAtomIDs
  portIDs: readonly ["runtime.acceptance-controller", "runtime.acceptance-evidence"]
  upstreamRef: typeof openCodeRuntimeAcceptanceUpstreamRef
  evidenceRef: typeof openCodeRuntimeAcceptanceNativeExactEvidenceRef
  fixtureID: typeof openCodeRuntimeAcceptanceNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    runStateStoresOneRunnerPerSessionAndSetsBusyIdleStatus: true
    cancelCascadesThroughBackgroundJobsThenCancelsBusyRunnerOrSetsIdle: true
    statusSetPublishesStatusEventsAndDeletesIdleEntries: true
    processorCompletesToolResultsBlocksOnRejectedPermissionsAndCleansPendingParts: true
    retryPolicyHonorsRetryHeadersBackoffCapsAndRetryStatusEvents: true
    processorReturnsCompactStopOrContinueFromNativeFlags: true
    compactionStopsOnNestedContextOverflowAndAutoContinuesAfterSuccessfulCompaction: true
  }
  cases: OpenCodeRuntimeAcceptanceNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly OpenCodeRuntimeAcceptanceNativeDescriptor[]
  intentionallyBridgeAtoms: readonly []
  fingerprint: string
}

export interface OpenCodeRuntimeAssemblyNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: typeof openCodeRuntimeAssemblyNativeExactAtomIDs
  portIDs: readonly [
    "runtime.module-catalog",
    "runtime.capability-resolver",
    "runtime.binding-planner",
    "runtime.lifecycle-runner",
    "runtime.assembly-graph",
  ]
  upstreamRef: typeof openCodeRuntimeAssemblyUpstreamRef
  evidenceRef: typeof openCodeRuntimeAssemblyNativeExactEvidenceRef
  fixtureID: typeof openCodeRuntimeAssemblyNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    bootResolvesKeybindsDiffModelSessionAndSavedVariantBeforeLifecycle: true
    lifecycleCreatesSplitFooterRendererAndClosesFooterBeforeRendererShutdown: true
    streamTransportSubscribesGlobalEventsBootstrapsSessionAndCompletesOnIdle: true
    promptQueueSerializesTurnsAndClearsFilesAfterFirstPrompt: true
    graphKeepsLazyLocalSessionAndEagerAttachStreamModes: true
  }
  cases: OpenCodeRuntimeAssemblyNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly OpenCodeRuntimeAssemblyNativeDescriptor[]
  intentionallyBridgeAtoms: readonly []
  fingerprint: string
}

export interface OpenCodeRuntimeAcceptanceNativeExactIssue {
  id: string
  message: string
}

export interface OpenCodeRuntimeAssemblyNativeExactIssue {
  id: string
  message: string
}

export interface OpenCodeRuntimeAcceptanceNativeExactVerification {
  ok: boolean
  issues: OpenCodeRuntimeAcceptanceNativeExactIssue[]
}

export interface OpenCodeRuntimeAssemblyNativeExactVerification {
  ok: boolean
  issues: OpenCodeRuntimeAssemblyNativeExactIssue[]
}

export interface OpenCodeBackgroundJobProjection {
  id: string
  status: "pending" | "running" | "done" | "failed"
  metadata?: {
    sessionId?: string
    parentSessionId?: string
  }
}

export interface OpenCodeRunStateCancelProjection {
  cancelledIDs: string[]
  cancellationRounds: string[][]
  pendingAfterCancel: string[]
  statusSetWhenRunnerMissingOrIdle: "idle"
  busyRunnerCancelCalled: boolean
}

export interface OpenCodeStatusInfoProjection {
  type: "idle" | "busy" | "retry"
  attempt?: number
  message?: string
  action?: Record<string, unknown>
  next?: number
}

export interface OpenCodeRuntimeAssemblyModule {
  id: string
  sourceRef: string
  provides: string[]
  requires: string[]
  lifecycle: string[]
}

export interface OpenCodeRuntimeAssemblyBinding {
  portID: OpenCodeRuntimeAssemblyPortID
  atomID: OpenCodeRuntimeAssemblyNativeExactAtomID
  upstreamModuleID: string
  reason: string
}

export interface OpenCodeRuntimeAssemblyGraph {
  nodes: Array<{ id: string; sourceRef: string; provides: string[] }>
  edges: Array<{ from: string; to: string; reason: string }>
  lockfile: {
    upstreamRef: typeof openCodeRuntimeAssemblyUpstreamRef
    root: "run.interactive-runtime"
    order: string[]
    bindings: OpenCodeRuntimeAssemblyBinding[]
    fingerprint: string
  }
}

export const openCodeRuntimeAcceptanceNativeDescriptors = openCodeRuntimeAcceptanceNativeExactAtomIDs.map((id): OpenCodeRuntimeAcceptanceNativeDescriptor => ({
  id,
  port: id === openCodeRuntimeAcceptanceControllerNativeExactAtomID ? "runtime.acceptance-controller" : "runtime.acceptance-evidence",
  product: "opencode",
  implementationKind: "factory",
  selectionReason: "OpenCode upstream native implementation with native parity complete SessionRunState, SessionStatus, SessionProcessor, SessionRetry, and SessionCompaction runtime acceptance fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [openCodeRuntimeAcceptanceNativeExactEvidenceRef, openCodeRuntimeAcceptanceNativeExactReplayRef],
  fixtureIDs: [openCodeRuntimeAcceptanceNativeExactFixtureID],
  knownLossiness: [],
}))

export const openCodeRuntimeAcceptanceNativeDescriptorByAtomID = Object.fromEntries(
  openCodeRuntimeAcceptanceNativeDescriptors.map((descriptor) => [descriptor.id, descriptor]),
) as Record<OpenCodeRuntimeAcceptanceNativeExactAtomID, OpenCodeRuntimeAcceptanceNativeDescriptor>

const openCodeRuntimeAssemblyPortsByAtomID = {
  [openCodeRuntimeModuleCatalogNativeExactAtomID]: "runtime.module-catalog",
  [openCodeRuntimeCapabilityResolverNativeExactAtomID]: "runtime.capability-resolver",
  [openCodeRuntimeBindingPlannerNativeExactAtomID]: "runtime.binding-planner",
  [openCodeRuntimeLifecycleRunnerNativeExactAtomID]: "runtime.lifecycle-runner",
  [openCodeRuntimeAssemblyGraphNativeExactAtomID]: "runtime.assembly-graph",
} satisfies Record<OpenCodeRuntimeAssemblyNativeExactAtomID, OpenCodeRuntimeAssemblyPortID>

function openCodeRuntimeAssemblyPortIDs(): OpenCodeRuntimeAssemblyNativeExactFixture["portIDs"] {
  return [
    "runtime.module-catalog",
    "runtime.capability-resolver",
    "runtime.binding-planner",
    "runtime.lifecycle-runner",
    "runtime.assembly-graph",
  ] as const
}

function openCodeRuntimeAssemblyPortsByAtomIDValues(): OpenCodeRuntimeAssemblyPortID[] {
  return [...openCodeRuntimeAssemblyPortIDs()]
}

export const openCodeRuntimeAssemblyNativeDescriptors = openCodeRuntimeAssemblyNativeExactAtomIDs.map((id): OpenCodeRuntimeAssemblyNativeDescriptor => ({
  id,
  port: openCodeRuntimeAssemblyPortsByAtomID[id],
  product: "opencode",
  implementationKind: "factory",
  selectionReason: "OpenCode upstream run interactive runtime native implementation with native parity complete boot, split-footer lifecycle, stream transport, prompt queue, and runtime graph fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [openCodeRuntimeAssemblyNativeExactEvidenceRef, openCodeRuntimeAssemblyNativeExactReplayRef],
  fixtureIDs: [openCodeRuntimeAssemblyNativeExactFixtureID],
  knownLossiness: [],
}))

export const openCodeRuntimeAssemblyNativeDescriptorByAtomID = Object.fromEntries(
  openCodeRuntimeAssemblyNativeDescriptors.map((descriptor) => [descriptor.id, descriptor]),
) as Record<OpenCodeRuntimeAssemblyNativeExactAtomID, OpenCodeRuntimeAssemblyNativeDescriptor>

export function buildOpenCodeRuntimeModuleCatalog(): OpenCodeRuntimeAssemblyModule[] {
  return [
    {
      id: "run.boot",
      sourceRef: "packages/opencode/src/cli/cmd/run/runtime.boot.ts#resolveFooterKeybinds,resolveDiffStyle,resolveModelInfo,resolveSessionInfo",
      provides: ["boot.keybinds", "boot.diff-style", "boot.model-info", "boot.session-info"],
      requires: ["tui.config", "sdk.config.providers", "sdk.provider.list", "session.shared.resolve"],
      lifecycle: ["process:load-config", "process:resolve-boot-data"],
    },
    {
      id: "run.lifecycle",
      sourceRef: "packages/opencode/src/cli/cmd/run/runtime.lifecycle.ts#createRuntimeLifecycle,shutdown,queueSplash",
      provides: ["renderer.split-footer", "footer.runtime", "sigint.exit-request", "splash.entry-exit"],
      requires: ["stdin.interactive", "opentui.renderer", "theme.resolve", "footer.dynamic-import"],
      lifecycle: ["process:create-renderer", "process:create-footer", "process:close-footer", "process:destroy-renderer"],
    },
    {
      id: "run.stream-transport",
      sourceRef: "packages/opencode/src/cli/cmd/run/stream.transport.ts#createSessionTransport,bootstrap,watch,runPromptTurn",
      provides: ["stream.global-events", "stream.session-bootstrap", "stream.turn-runner", "stream.idle-completion"],
      requires: ["sdk.global.event", "sdk.session.messages", "sdk.session.promptAsync", "sdk.session.status", "footer.output"],
      lifecycle: ["session:subscribe-events", "session:bootstrap-history", "turn:send-prompt", "session:close-scope"],
    },
    {
      id: "run.prompt-queue",
      sourceRef: "packages/opencode/src/cli/cmd/run/runtime.queue.ts#runPromptQueue,submit,drain,close",
      provides: ["prompt.serial-queue", "prompt.new-session-command", "prompt.exit-command", "turn.duration"],
      requires: ["footer.prompt-events", "footer.close-event", "stream.turn-runner"],
      lifecycle: ["session:listen-prompts", "turn:drain-one-at-a-time", "session:abort-on-close"],
    },
    {
      id: "run.interactive-runtime",
      sourceRef: "packages/opencode/src/cli/cmd/run/runtime.ts#runInteractiveRuntime,runInteractiveLocalMode,runInteractiveMode,ensureStream,runQueue",
      provides: ["runtime.orchestrator", "runtime.local-mode", "runtime.attach-mode", "runtime.catalog-loader", "runtime.variant-state"],
      requires: ["run.boot", "run.lifecycle", "run.stream-transport", "run.prompt-queue", "sdk.client"],
      lifecycle: ["process:boot", "session:ensure-session", "session:ensure-stream", "session:run-queue", "session:close-stream-and-shell"],
    },
  ]
}

export function resolveOpenCodeRuntimeCapabilities(input: {
  mode: "local" | "attach"
  resume?: boolean
  hasInitialSession?: boolean
}): {
  order: string[]
  eagerStream: boolean
  lazySession: boolean
  capabilities: Record<string, string[]>
} {
  const catalog = buildOpenCodeRuntimeModuleCatalog()
  const capabilities = Object.fromEntries(catalog.map((item) => [item.id, item.provides]))
  const lazySession = input.mode === "local" && input.hasInitialSession !== true
  return {
    order: ["run.boot", "run.lifecycle", "run.stream-transport", "run.prompt-queue", "run.interactive-runtime"],
    eagerStream: input.mode === "attach" || input.resume === true,
    lazySession,
    capabilities,
  }
}

export function planOpenCodeRuntimeBindings(): OpenCodeRuntimeAssemblyBinding[] {
  return [
    {
      portID: "runtime.module-catalog",
      atomID: openCodeRuntimeModuleCatalogNativeExactAtomID,
      upstreamModuleID: "run.boot",
      reason: "Catalog is the pinned upstream interactive runtime service inventory from runtime.boot, runtime.lifecycle, stream.transport, runtime.queue, and runtime orchestrator sources.",
    },
    {
      portID: "runtime.capability-resolver",
      atomID: openCodeRuntimeCapabilityResolverNativeExactAtomID,
      upstreamModuleID: "run.interactive-runtime",
      reason: "Resolver follows runInteractiveRuntime dependency order and eager/lazy stream selection for local and attach modes.",
    },
    {
      portID: "runtime.binding-planner",
      atomID: openCodeRuntimeBindingPlannerNativeExactAtomID,
      upstreamModuleID: "run.interactive-runtime",
      reason: "Planner maps runtime ports to upstream boot, lifecycle, transport, queue, and graph responsibilities instead of common lockfile stand-ins.",
    },
    {
      portID: "runtime.lifecycle-runner",
      atomID: openCodeRuntimeLifecycleRunnerNativeExactAtomID,
      upstreamModuleID: "run.lifecycle",
      reason: "Lifecycle runner replays createRuntimeLifecycle boot and close ordering, including footer close/destroy before renderer shutdown.",
    },
    {
      portID: "runtime.assembly-graph",
      atomID: openCodeRuntimeAssemblyGraphNativeExactAtomID,
      upstreamModuleID: "run.interactive-runtime",
      reason: "Assembly graph records the pinned upstream runtime DAG and lockfile fingerprint for the OpenCode interactive runtime.",
    },
  ]
}

export function runOpenCodeRuntimeLifecycle(input: {
  mode: "local" | "attach"
  resume?: boolean
  firstPromptIncludesFiles?: boolean
}): {
  boot: string[]
  session: string[]
  turn: string[]
  close: string[]
} {
  const resolved = resolveOpenCodeRuntimeCapabilities({
    mode: input.mode,
    ...(input.resume === undefined ? {} : { resume: input.resume }),
    hasInitialSession: input.mode === "attach",
  })
  const boot = [
    "resolveFooterKeybinds:start",
    "resolveDiffStyle:start",
    "bootContext:resolved",
    "resolveModelInfo:start",
    input.resume ? "resolveSessionInfo:start" : "sessionInfo:fresh-empty",
    "resolveSavedVariant:start",
    "bootTasks:await-all",
    "createRuntimeLifecycle:split-footer",
    "footer.idle:load-catalog",
    "modelTask:emit-models-and-variants",
  ]
  const session = [
    resolved.lazySession ? "ensureSession:deferred-until-stream" : "ensureSession:ready",
    resolved.eagerStream ? "ensureStream:eager" : "ensureStream:microtask-prewarm",
    "streamTransport:subscribe-global-events",
    "streamTransport:bootstrap-session-data",
    "runPromptQueue:start",
  ]
  const turn = [
    "queue:append-prompt",
    "queue:drain-one-at-a-time",
    input.firstPromptIncludesFiles === false ? "turn:omit-files" : "turn:include-files",
    "stream:send-prompt",
    "stream:wait-session-idle-or-poll",
    "turn:duration",
    "turn:clear-files-after-first-send",
  ]
  const close = [
    "streamTransport:close-scope",
    "shell.close:resolve-exit-title",
    "lifecycle.close:remove-sigint",
    "lifecycle.close:optional-exit-splash",
    "footer.close",
    "footer.idle",
    "footer.destroy",
    "renderer.shutdown",
    "stdin.cleanup",
  ]
  return { boot, session, turn, close }
}

export function buildOpenCodeRuntimeAssemblyGraph(): OpenCodeRuntimeAssemblyGraph {
  const catalog = buildOpenCodeRuntimeModuleCatalog()
  const bindings = planOpenCodeRuntimeBindings()
  const order = resolveOpenCodeRuntimeCapabilities({ mode: "local" }).order
  const nodes = catalog.map((item) => ({ id: item.id, sourceRef: item.sourceRef, provides: item.provides }))
  const edges = [
    { from: "run.boot", to: "run.interactive-runtime", reason: "runInteractiveRuntime awaits boot data before creating lifecycle and state." },
    { from: "run.lifecycle", to: "run.interactive-runtime", reason: "runInteractiveRuntime creates the split-footer shell before stream and prompt queue work." },
    { from: "run.stream-transport", to: "run.prompt-queue", reason: "runPromptQueue delegates each prompt to createSessionTransport.runPromptTurn." },
    { from: "run.prompt-queue", to: "run.interactive-runtime", reason: "runInteractiveRuntime owns runQueue and closes stream/shell after it resolves." },
    { from: "run.lifecycle", to: "run.stream-transport", reason: "stream transport writes reduced output to the lifecycle footer." },
  ]
  const lockfileWithoutFingerprint = {
    upstreamRef: openCodeRuntimeAssemblyUpstreamRef,
    root: "run.interactive-runtime" as const,
    order,
    bindings,
  }
  return {
    nodes,
    edges,
    lockfile: {
      ...lockfileWithoutFingerprint,
      fingerprint: fingerprintObject(lockfileWithoutFingerprint),
    },
  }
}

export function buildOpenCodeRuntimeAssemblyNativeExactFixture(): OpenCodeRuntimeAssemblyNativeExactFixture {
  const catalog = buildOpenCodeRuntimeModuleCatalog()
  const localResolution = resolveOpenCodeRuntimeCapabilities({ mode: "local" })
  const attachResolution = resolveOpenCodeRuntimeCapabilities({ mode: "attach", resume: true, hasInitialSession: true })
  const bindings = planOpenCodeRuntimeBindings()
  const localLifecycle = runOpenCodeRuntimeLifecycle({ mode: "local", firstPromptIncludesFiles: true })
  const attachLifecycle = runOpenCodeRuntimeLifecycle({ mode: "attach", resume: true, firstPromptIncludesFiles: false })
  const graph = buildOpenCodeRuntimeAssemblyGraph()
  const cases: OpenCodeRuntimeAssemblyNativeExactCase[] = [
    {
      scenarioID: "module-catalog-interactive-runtime-services",
      input: { sourceFiles: ["runtime.boot.ts", "runtime.lifecycle.ts", "runtime.ts", "runtime.queue.ts", "stream.transport.ts"] },
      output: { modules: catalog },
      upstreamBehavior: "OpenCode's interactive runtime is split into boot-time config/model/session resolvers, split-footer lifecycle, stream transport, serial prompt queue, and top-level runInteractiveRuntime orchestration.",
    },
    {
      scenarioID: "capability-resolution-runtime-order",
      input: { local: { mode: "local" }, attach: { mode: "attach", resume: true } },
      output: { localResolution, attachResolution },
      upstreamBehavior: "runInteractiveRuntime resolves boot data before lifecycle, creates stream transport before prompt turns, queues prompts serially, and chooses eager stream for attach/resume while local mode can defer session creation.",
    },
    {
      scenarioID: "binding-plan-runtime-ports",
      input: { ports: [...openCodeRuntimeAssemblyPortsByAtomIDValues()] },
      output: { bindings },
      upstreamBehavior: "The five runtime ports bind directly to OpenCode interactive runtime modules instead of the common memory/default/lockfile/scoped runtime implementations.",
    },
    {
      scenarioID: "lifecycle-runner-split-footer-and-transport",
      input: { local: { mode: "local" }, attach: { mode: "attach", resume: true } },
      output: { localLifecycle, attachLifecycle },
      upstreamBehavior: "createRuntimeLifecycle creates the split-footer renderer, writes entry/exit splash output, wires SIGINT, and closes by footer.close, footer.idle, footer.destroy, renderer shutdown, then stdin cleanup; runInteractiveRuntime closes stream before shell close.",
    },
    {
      scenarioID: "assembly-graph-runtime-lockfile",
      input: { root: "run.interactive-runtime", upstreamRef: openCodeRuntimeAssemblyUpstreamRef },
      output: { graph },
      upstreamBehavior: "The runtime lockfile records OpenCode's native runtime DAG with boot/lifecycle/transport/queue/orchestrator nodes and a stable fingerprint over the pinned upstream binding graph.",
    },
  ]
  const snapshotWithoutFingerprint: Omit<OpenCodeRuntimeAssemblyNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomIDs: [...openCodeRuntimeAssemblyNativeExactAtomIDs] as typeof openCodeRuntimeAssemblyNativeExactAtomIDs,
    portIDs: [
      "runtime.module-catalog",
      "runtime.capability-resolver",
      "runtime.binding-planner",
      "runtime.lifecycle-runner",
      "runtime.assembly-graph",
    ] as const,
    upstreamRef: openCodeRuntimeAssemblyUpstreamRef,
    evidenceRef: openCodeRuntimeAssemblyNativeExactEvidenceRef,
    fixtureID: openCodeRuntimeAssemblyNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      bootResolvesKeybindsDiffModelSessionAndSavedVariantBeforeLifecycle: true as const,
      lifecycleCreatesSplitFooterRendererAndClosesFooterBeforeRendererShutdown: true as const,
      streamTransportSubscribesGlobalEventsBootstrapsSessionAndCompletesOnIdle: true as const,
      promptQueueSerializesTurnsAndClearsFilesAfterFirstPrompt: true as const,
      graphKeepsLazyLocalSessionAndEagerAttachStreamModes: true as const,
    },
    cases,
    sourceRefs: [
      "packages/opencode/src/cli/cmd/run/runtime.boot.ts#resolveFooterKeybinds,resolveDiffStyle,resolveModelInfo,resolveSessionInfo",
      "packages/opencode/src/cli/cmd/run/runtime.lifecycle.ts#createRuntimeLifecycle,shutdown,queueSplash",
      "packages/opencode/src/cli/cmd/run/runtime.ts#runInteractiveRuntime,runInteractiveLocalMode,runInteractiveMode,ensureStream,runQueue",
      "packages/opencode/src/cli/cmd/run/runtime.queue.ts#runPromptQueue,submit,drain,close",
      "packages/opencode/src/cli/cmd/run/stream.transport.ts#createSessionTransport,bootstrap,watch,runPromptTurn",
    ],
    nativeEvidenceRefs: [openCodeRuntimeAssemblyNativeExactEvidenceRef, openCodeRuntimeAssemblyNativeExactReplayRef],
    fixtureIDs: [openCodeRuntimeAssemblyNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptors: openCodeRuntimeAssemblyNativeDescriptors,
    intentionallyBridgeAtoms: [] as const,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeRuntimeAssemblyNativeExactFixture(
  fixture: OpenCodeRuntimeAssemblyNativeExactFixture,
): OpenCodeRuntimeAssemblyNativeExactVerification {
  const canonical = buildOpenCodeRuntimeAssemblyNativeExactFixture()
  const issues: OpenCodeRuntimeAssemblyNativeExactIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (
    fixture.product !== "opencode" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(openCodeRuntimeAssemblyNativeExactAtomIDs) ||
    JSON.stringify(fixture.portIDs) !== JSON.stringify(openCodeRuntimeAssemblyPortIDs())
  ) {
    addIssue("opencode-runtime-assembly-native-exact.identity", "OpenCode runtime assembly fixture lost product, atom, or port identity.")
  }
  if (
    fixture.upstreamRef !== openCodeRuntimeAssemblyUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("runtime.boot.ts#resolveFooterKeybinds")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("runtime.lifecycle.ts#createRuntimeLifecycle")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("runtime.ts#runInteractiveRuntime")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("runtime.queue.ts#runPromptQueue")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("stream.transport.ts#createSessionTransport"))
  ) {
    addIssue("opencode-runtime-assembly-native-exact.upstream", "Fixture must stay pinned to OpenCode upstream interactive runtime sources.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    addIssue("opencode-runtime-assembly-native-exact.native-claim", "OpenCode runtime assembly fixture must explicitly claim native-exact parity.")
  }
  if (fixture.knownLossiness.length !== 0 || fixture.intentionallyBridgeAtoms.length !== 0 || openCodeRuntimeAssemblyNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length !== 0)) {
    addIssue("opencode-runtime-assembly-native-exact.lossiness", "Native exact OpenCode runtime assembly fixture must not carry compatible bridge lossiness.")
  }
  if (!fixture.nativeEvidenceRefs.includes(openCodeRuntimeAssemblyNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(openCodeRuntimeAssemblyNativeExactReplayRef)) {
    addIssue("opencode-runtime-assembly-native-exact.evidence", "OpenCode runtime assembly native exact evidence refs are missing.")
  }
  if (!fixture.fixtureIDs.includes(openCodeRuntimeAssemblyNativeExactFixtureID)) {
    addIssue("opencode-runtime-assembly-native-exact.fixture", "OpenCode runtime assembly native exact fixture ID is missing.")
  }
  for (const atomID of openCodeRuntimeAssemblyNativeExactAtomIDs) {
    const descriptor = fixture.descriptors.find((item) => item.id === atomID)
    if (!descriptor || descriptor.parityCoverage !== "native" || descriptor.implementationKind !== "factory" || descriptor.knownLossiness.length !== 0) {
      addIssue("opencode-runtime-assembly-native-exact.descriptor", `Descriptor for ${atomID} is not native exact.`)
    }
  }
  const catalog = fixture.cases.find((item) => item.scenarioID === "module-catalog-interactive-runtime-services")
  if (stableStringify(catalog?.output["modules"]) !== stableStringify(canonical.cases[0]?.output["modules"])) {
    addIssue("opencode-runtime-assembly-native-exact.catalog", "Interactive runtime module catalog drifted from upstream native fixture.")
  }
  const resolver = fixture.cases.find((item) => item.scenarioID === "capability-resolution-runtime-order")
  if (stableStringify(resolver?.output["localResolution"]) !== stableStringify(canonical.cases[1]?.output["localResolution"])) {
    addIssue("opencode-runtime-assembly-native-exact.resolver", "Runtime capability resolution order drifted from upstream native fixture.")
  }
  const planner = fixture.cases.find((item) => item.scenarioID === "binding-plan-runtime-ports")
  if (stableStringify(planner?.output["bindings"]) !== stableStringify(canonical.cases[2]?.output["bindings"])) {
    addIssue("opencode-runtime-assembly-native-exact.planner", "Runtime binding plan drifted from upstream native fixture.")
  }
  const lifecycle = fixture.cases.find((item) => item.scenarioID === "lifecycle-runner-split-footer-and-transport")
  if (stableStringify(lifecycle?.output["localLifecycle"]) !== stableStringify(canonical.cases[3]?.output["localLifecycle"])) {
    addIssue("opencode-runtime-assembly-native-exact.lifecycle", "Runtime lifecycle runner trace drifted from upstream native fixture.")
  }
  const graph = fixture.cases.find((item) => item.scenarioID === "assembly-graph-runtime-lockfile")
  if (stableStringify(graph?.output["graph"]) !== stableStringify(canonical.cases[4]?.output["graph"])) {
    addIssue("opencode-runtime-assembly-native-exact.graph", "Runtime assembly graph drifted from upstream native fixture.")
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    addIssue("opencode-runtime-assembly-native-exact.policy", "OpenCode runtime assembly policy drifted from upstream behavior.")
  }
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    addIssue("opencode-runtime-assembly-native-exact.fingerprint", "Fixture fingerprint no longer matches canonical OpenCode runtime assembly behavior.")
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    addIssue("opencode-runtime-assembly-native-exact.cases", "OpenCode runtime assembly cases drifted from the native exact fixture.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function projectOpenCodeCancelBackgroundJobs(input: {
  sessionID: string
  jobs: OpenCodeBackgroundJobProjection[]
}): Pick<OpenCodeRunStateCancelProjection, "cancelledIDs" | "cancellationRounds" | "pendingAfterCancel"> {
  const pending = new Set<string>([input.sessionID])
  const cancelled = new Set<string>()
  const cancelledIDs: string[] = []
  const cancellationRounds: string[][] = []
  const matches = (job: OpenCodeBackgroundJobProjection): boolean => {
    if (job.status !== "running") return false
    if (cancelled.has(job.id)) return false
    if (pending.has(job.id)) return true
    if (typeof job.metadata?.sessionId === "string" && pending.has(job.metadata.sessionId)) return true
    return typeof job.metadata?.parentSessionId === "string" && pending.has(job.metadata.parentSessionId)
  }
  let batch = input.jobs.filter(matches)
  while (batch.length > 0) {
    const round: string[] = []
    for (const job of batch) {
      cancelled.add(job.id)
      cancelledIDs.push(job.id)
      round.push(job.id)
      pending.add(job.id)
      if (typeof job.metadata?.sessionId === "string") pending.add(job.metadata.sessionId)
    }
    cancellationRounds.push(round)
    batch = input.jobs.filter(matches)
  }
  return {
    cancelledIDs,
    cancellationRounds,
    pendingAfterCancel: [...pending].sort(),
  }
}

export function projectOpenCodeRunStateCancel(input: {
  sessionID: string
  jobs: OpenCodeBackgroundJobProjection[]
  existingRunnerBusy: boolean
}): OpenCodeRunStateCancelProjection {
  return {
    ...projectOpenCodeCancelBackgroundJobs({ sessionID: input.sessionID, jobs: input.jobs }),
    statusSetWhenRunnerMissingOrIdle: "idle",
    busyRunnerCancelCalled: input.existingRunnerBusy,
  }
}

export function projectOpenCodeStatusSetSequence(input: {
  sessionID: string
  statuses: OpenCodeStatusInfoProjection[]
}): {
  events: Array<{ type: "session.status" | "session.idle"; sessionID: string; status?: OpenCodeStatusInfoProjection }>
  storedAfterEach: OpenCodeStatusInfoProjection[]
  finalGet: OpenCodeStatusInfoProjection
} {
  const data = new Map<string, OpenCodeStatusInfoProjection>()
  const events: Array<{ type: "session.status" | "session.idle"; sessionID: string; status?: OpenCodeStatusInfoProjection }> = []
  const storedAfterEach: OpenCodeStatusInfoProjection[] = []
  for (const status of input.statuses) {
    events.push({ type: "session.status", sessionID: input.sessionID, status })
    if (status.type === "idle") {
      events.push({ type: "session.idle", sessionID: input.sessionID })
      data.delete(input.sessionID)
    } else {
      data.set(input.sessionID, status)
    }
    storedAfterEach.push(data.get(input.sessionID) ?? { type: "idle" })
  }
  return {
    events,
    storedAfterEach,
    finalGet: data.get(input.sessionID) ?? { type: "idle" },
  }
}

export function projectOpenCodeProcessorToolResult(input: {
  callID: string
  tool: string
  providerExecuted?: boolean
  result: {
    type: "json" | "text"
    value: string | { output?: string; title?: string; metadata?: Record<string, unknown>; attachments?: Array<{ url: string; mime: string; filename?: string }> } | Record<string, unknown>
  }
}): {
  completedPart: Record<string, unknown>
  successEvent: Record<string, unknown>
} {
  const resultValue = input.result.value
  const structuredOutput = isRecord(resultValue) && typeof resultValue["output"] === "string"
  const title = structuredOutput && typeof resultValue["title"] === "string" ? resultValue["title"] : input.tool
  const metadata = structuredOutput && isRecord(resultValue["metadata"])
    ? resultValue["metadata"]
    : input.result.type === "json" && isRecord(resultValue)
      ? resultValue
      : {}
  const output = structuredOutput
    ? String(resultValue["output"])
    : typeof resultValue === "string"
      ? resultValue
      : JSON.stringify(resultValue) ?? ""
  const attachments = structuredOutput && Array.isArray(resultValue["attachments"])
    ? resultValue["attachments"].filter(isFileAttachment)
    : undefined
  return {
    completedPart: {
      callID: input.callID,
      tool: input.tool,
      state: {
        status: "completed",
        input: {},
        output,
        title,
        metadata,
        ...(attachments?.length ? { attachments } : {}),
      },
      metadata: input.providerExecuted ? { providerExecuted: true } : undefined,
    },
    successEvent: {
      type: "tool.success",
      callID: input.callID,
      structured: metadata,
      content: [
        { type: "text", text: output },
        ...(attachments?.map((item) => ({
          type: "file",
          uri: item.url,
          mime: item.mime,
          name: item.filename,
        })) ?? []),
      ],
      provider: { executed: input.providerExecuted === true },
    },
  }
}

export function projectOpenCodeProcessorToolError(input: {
  callID: string
  tool: string
  message: string
  rejectedByPermissionOrQuestion: boolean
  shouldBreak: boolean
}): {
  erroredPart: Record<string, unknown>
  blocked: boolean
  failedEvent: Record<string, unknown>
} {
  return {
    erroredPart: {
      callID: input.callID,
      tool: input.tool,
      state: {
        status: "error",
        error: input.message,
      },
    },
    blocked: input.rejectedByPermissionOrQuestion && input.shouldBreak,
    failedEvent: {
      type: "tool.failed",
      callID: input.callID,
      error: { type: "unknown", message: input.message },
    },
  }
}

export function projectOpenCodeProcessorCleanup(input: {
  pendingToolCallIDs: string[]
  hasOpenText: boolean
  hasSnapshotPatch: boolean
}): {
  pendingToolStates: Record<string, unknown>[]
  closesCurrentText: boolean
  writesPatchBeforeCompletion: boolean
  assistantCompleted: true
} {
  return {
    pendingToolStates: input.pendingToolCallIDs.map((callID) => ({
      callID,
      state: {
        status: "error",
        error: "Tool execution aborted",
        metadata: { interrupted: true },
      },
    })),
    closesCurrentText: input.hasOpenText,
    writesPatchBeforeCompletion: input.hasSnapshotPatch,
    assistantCompleted: true,
  }
}

export function projectOpenCodeRetryDelay(input: {
  attempt: number
  retryAfterMs?: string
  retryAfter?: string
  now?: number
}): number {
  if (input.retryAfterMs) {
    const parsedMs = Number.parseFloat(input.retryAfterMs)
    if (!Number.isNaN(parsedMs)) return capRetryDelay(parsedMs)
  }
  if (input.retryAfter) {
    const parsedSeconds = Number.parseFloat(input.retryAfter)
    if (!Number.isNaN(parsedSeconds)) return capRetryDelay(Math.ceil(parsedSeconds * 1000))
    const parsed = Date.parse(input.retryAfter) - (input.now ?? Date.now())
    if (!Number.isNaN(parsed) && parsed > 0) return capRetryDelay(Math.ceil(parsed))
  }
  return capRetryDelay(Math.min(2_000 * Math.pow(2, input.attempt - 1), 30_000))
}

export function projectOpenCodeRetryStatus(input: {
  provider: string
  attempt: number
  message: string
  wait: number
  now: number
  action?: Record<string, unknown>
}): {
  status: OpenCodeStatusInfoProjection
  event: Record<string, unknown>
} {
  return {
    status: {
      type: "retry",
      attempt: input.attempt,
      message: input.message,
      ...(input.action ? { action: input.action } : {}),
      next: input.now + input.wait,
    },
    event: {
      type: "session.retried",
      provider: input.provider,
      attempt: input.attempt,
      error: {
        message: input.message,
        isRetryable: true,
      },
    },
  }
}

export function projectOpenCodeProcessorResult(input: {
  needsCompaction?: boolean
  blocked?: boolean
  assistantError?: boolean
}): "compact" | "stop" | "continue" {
  if (input.needsCompaction) return "compact"
  if (input.blocked || input.assistantError) return "stop"
  return "continue"
}

export function projectOpenCodeCompactionProcessResult(input: {
  processorResult: "compact" | "stop" | "continue"
  auto: boolean
  replayAvailable: boolean
  overflow?: boolean
}): Record<string, unknown> {
  if (input.processorResult === "compact") {
    return {
      finalResult: "stop",
      assistantFinish: "error",
      assistantError: input.replayAvailable
        ? "Conversation history too large to compact - exceeds model context limit"
        : "Session too large to compact - context exceeds model limit even after stripping media",
    }
  }
  if (input.processorResult === "continue" && input.auto && input.replayAvailable) {
    return {
      finalResult: "continue",
      replaysOriginalUserMessage: true,
      skipsCompactionParts: true,
      emitsCompactionEnded: true,
      publishesSessionCompacted: true,
    }
  }
  if (input.processorResult === "continue" && input.auto) {
    return {
      finalResult: "continue",
      createsSyntheticContinueMessage: true,
      continueTextPrefix: input.overflow ? "The previous request exceeded the provider's size limit" : "Continue if you have next steps",
      continuePartMetadata: { compaction_continue: true },
      emitsCompactionEnded: true,
      publishesSessionCompacted: true,
    }
  }
  return {
    finalResult: input.processorResult,
    emitsCompactionEnded: input.processorResult === "continue",
    publishesSessionCompacted: input.processorResult === "continue",
  }
}

export function buildOpenCodeRuntimeAcceptanceNativeExactFixture(): OpenCodeRuntimeAcceptanceNativeExactFixture {
  const sessionID = "ses_7fffffffffffRuntime"
  const jobs: OpenCodeBackgroundJobProjection[] = [
    { id: "job-root", status: "running", metadata: { sessionId: sessionID } },
    { id: "job-child", status: "running", metadata: { parentSessionId: "job-root", sessionId: "ses_child" } },
    { id: "job-grandchild", status: "running", metadata: { parentSessionId: "ses_child" } },
    { id: "job-done", status: "done", metadata: { sessionId: sessionID } },
    { id: "job-foreign", status: "running", metadata: { sessionId: "ses_foreign" } },
  ]
  const idleCancel = projectOpenCodeRunStateCancel({ sessionID, jobs, existingRunnerBusy: false })
  const busyCancel = projectOpenCodeRunStateCancel({ sessionID, jobs, existingRunnerBusy: true })
  const statusSequence = projectOpenCodeStatusSetSequence({
    sessionID,
    statuses: [
      { type: "busy" },
      {
        type: "retry",
        attempt: 2,
        message: "Provider is overloaded",
        next: 1_780_000_002_000,
      },
      { type: "idle" },
    ],
  })
  const toolResult = projectOpenCodeProcessorToolResult({
    callID: "call_read",
    tool: "read",
    providerExecuted: true,
    result: {
      type: "json",
      value: {
        title: "Read file",
        metadata: { bytes: 42 },
        output: "file contents",
        attachments: [{ url: "file:///tmp/screen.png", mime: "image/png", filename: "screen.png" }],
      },
    },
  })
  const toolError = projectOpenCodeProcessorToolError({
    callID: "call_write",
    tool: "write",
    message: "Permission rejected",
    rejectedByPermissionOrQuestion: true,
    shouldBreak: true,
  })
  const cleanup = projectOpenCodeProcessorCleanup({
    pendingToolCallIDs: ["call_write", "call_shell"],
    hasOpenText: true,
    hasSnapshotPatch: true,
  })
  const retryAfterMs = projectOpenCodeRetryDelay({ attempt: 4, retryAfterMs: "1250" })
  const retryAfterSeconds = projectOpenCodeRetryDelay({ attempt: 4, retryAfter: "1.5" })
  const cappedBackoff = projectOpenCodeRetryDelay({ attempt: 5 })
  const retryStatus = projectOpenCodeRetryStatus({
    provider: "anthropic",
    attempt: 4,
    message: "Provider is overloaded",
    wait: retryAfterMs,
    now: 1_780_000_000_000,
  })
  const cases: OpenCodeRuntimeAcceptanceNativeExactCase[] = [
    {
      scenarioID: "run-state-busy-idle-shell-and-cancel",
      input: { sessionID, jobs, runnerStates: ["missing", "busy"], shellBusyError: "RunnerBusy" },
      output: {
        runnerLifecycle: {
          oneRunnerPerSession: true,
          onBusyStatus: { type: "busy" },
          onIdleDeletesRunner: true,
          onIdleStatus: { type: "idle" },
          startShellMapsRunnerBusyTo: "Session.BusyError",
          assertNotBusyThrowsWhenExistingBusy: true,
        },
        idleCancel,
        busyCancel,
      },
      upstreamBehavior: "SessionRunState stores a Runner per session, Runner.onBusy sets SessionStatus busy, Runner.onIdle deletes the runner and sets idle, startShell maps RunnerBusy to Session.BusyError, and cancel first cancels background jobs before either setting idle for no/idle runner or calling existing.cancel for a busy runner.",
    },
    {
      scenarioID: "status-events-and-idle-removal",
      input: { sessionID, statuses: ["busy", "retry", "idle"] },
      output: statusSequence,
      upstreamBehavior: "SessionStatus.set publishes session.status for every status, publishes deprecated session.idle and deletes the status map entry on idle, stores retry/busy statuses otherwise, and get defaults to idle.",
    },
    {
      scenarioID: "processor-tool-result-error-and-cleanup",
      input: { providerExecutedTool: "call_read", rejectedTool: "call_write", pendingToolCallIDs: ["call_write", "call_shell"] },
      output: {
        toolResult,
        toolError,
        cleanup,
        processorResultWhenBlocked: projectOpenCodeProcessorResult({ blocked: toolError.blocked }),
      },
      upstreamBehavior: "SessionProcessor converts tool-result payloads into completed tool parts and Tool.Success events, marks Permission/Question rejected tool errors as blocked when shouldBreak is true, waits briefly for pending tool calls during cleanup, marks leftovers as interrupted errors, closes text/reasoning/patch state, and returns stop when blocked.",
    },
    {
      scenarioID: "retry-policy-status-boundary",
      input: { attempts: [4, 5], headers: ["retry-after-ms", "retry-after", "none"], now: 1_780_000_000_000 },
      output: {
        retryAfterMs,
        retryAfterSeconds,
        cappedBackoff,
        retryStatus,
      },
      upstreamBehavior: "SessionRetry.delay prefers retry-after-ms, then retry-after seconds or dates, otherwise exponential backoff capped at 30s without headers; SessionProcessor.retry publishes Retried events and sets SessionStatus retry with attempt/message/action/next before retrying.",
    },
    {
      scenarioID: "processor-and-compaction-result-boundary",
      input: { processorFlags: ["needsCompaction", "blocked", "assistantError"], compactionModes: ["nested-compact", "auto-replay", "auto-continue"] },
      output: {
        processorResults: {
          compact: projectOpenCodeProcessorResult({ needsCompaction: true }),
          blockedStop: projectOpenCodeProcessorResult({ blocked: true }),
          errorStop: projectOpenCodeProcessorResult({ assistantError: true }),
          continue: projectOpenCodeProcessorResult({}),
        },
        compactionResults: {
          nestedCompact: projectOpenCodeCompactionProcessResult({ processorResult: "compact", auto: true, replayAvailable: false }),
          autoReplay: projectOpenCodeCompactionProcessResult({ processorResult: "continue", auto: true, replayAvailable: true }),
          autoContinue: projectOpenCodeCompactionProcessResult({ processorResult: "continue", auto: true, replayAvailable: false, overflow: true }),
        },
      },
      upstreamBehavior: "SessionProcessor.process returns compact when needsCompaction is set, stop when blocked or assistantMessage.error is set, and continue otherwise; SessionCompaction.process converts nested compact to a context-overflow assistant error and stop, replays a retained user message when auto compaction has replay input, or creates a synthetic compaction_continue user message before publishing compaction-ended events.",
    },
  ]
  const snapshotWithoutFingerprint: Omit<OpenCodeRuntimeAcceptanceNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomIDs: [...openCodeRuntimeAcceptanceNativeExactAtomIDs] as typeof openCodeRuntimeAcceptanceNativeExactAtomIDs,
    portIDs: ["runtime.acceptance-controller", "runtime.acceptance-evidence"] as const,
    upstreamRef: openCodeRuntimeAcceptanceUpstreamRef,
    evidenceRef: openCodeRuntimeAcceptanceNativeExactEvidenceRef,
    fixtureID: openCodeRuntimeAcceptanceNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      runStateStoresOneRunnerPerSessionAndSetsBusyIdleStatus: true as const,
      cancelCascadesThroughBackgroundJobsThenCancelsBusyRunnerOrSetsIdle: true as const,
      statusSetPublishesStatusEventsAndDeletesIdleEntries: true as const,
      processorCompletesToolResultsBlocksOnRejectedPermissionsAndCleansPendingParts: true as const,
      retryPolicyHonorsRetryHeadersBackoffCapsAndRetryStatusEvents: true as const,
      processorReturnsCompactStopOrContinueFromNativeFlags: true as const,
      compactionStopsOnNestedContextOverflowAndAutoContinuesAfterSuccessfulCompaction: true as const,
    },
    cases,
    sourceRefs: [
      "packages/opencode/src/session/run-state.ts#SessionRunState.runner,assertNotBusy,cancel,startShell,cancelBackgroundJobs",
      "packages/opencode/src/session/status.ts#SessionStatus.Info,Event,get,list,set",
      "packages/opencode/src/session/processor.ts#handleEvent,toolResultOutput,failToolCall,cleanup,halt,process",
      "packages/opencode/src/session/retry.ts#delay,retryable,policy",
      "packages/opencode/src/session/compaction.ts#processCompaction,create,prune,select",
    ],
    nativeEvidenceRefs: [openCodeRuntimeAcceptanceNativeExactEvidenceRef, openCodeRuntimeAcceptanceNativeExactReplayRef],
    fixtureIDs: [openCodeRuntimeAcceptanceNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptors: openCodeRuntimeAcceptanceNativeDescriptors,
    intentionallyBridgeAtoms: [] as const,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeRuntimeAcceptanceNativeExactFixture(
  fixture: OpenCodeRuntimeAcceptanceNativeExactFixture,
): OpenCodeRuntimeAcceptanceNativeExactVerification {
  const canonical = buildOpenCodeRuntimeAcceptanceNativeExactFixture()
  const issues: OpenCodeRuntimeAcceptanceNativeExactIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (
    fixture.product !== "opencode" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(openCodeRuntimeAcceptanceNativeExactAtomIDs) ||
    JSON.stringify(fixture.portIDs) !== JSON.stringify(["runtime.acceptance-controller", "runtime.acceptance-evidence"])
  ) {
    addIssue("opencode-runtime-acceptance-native-exact.identity", "OpenCode runtime acceptance fixture lost product, atom, or port identity.")
  }
  if (
    fixture.upstreamRef !== openCodeRuntimeAcceptanceUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("run-state.ts#SessionRunState")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("status.ts#SessionStatus")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("processor.ts#handleEvent")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("retry.ts#delay")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("compaction.ts#processCompaction"))
  ) {
    addIssue("opencode-runtime-acceptance-native-exact.upstream", "Fixture must stay pinned to OpenCode upstream runtime session sources.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    addIssue("opencode-runtime-acceptance-native-exact.native-claim", "OpenCode runtime acceptance fixture must explicitly claim native-exact parity.")
  }
  if (fixture.knownLossiness.length !== 0 || fixture.intentionallyBridgeAtoms.length !== 0 || openCodeRuntimeAcceptanceNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length !== 0)) {
    addIssue("opencode-runtime-acceptance-native-exact.lossiness", "Native exact OpenCode runtime acceptance fixture must not carry compatible bridge lossiness.")
  }
  if (!fixture.nativeEvidenceRefs.includes(openCodeRuntimeAcceptanceNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(openCodeRuntimeAcceptanceNativeExactReplayRef)) {
    addIssue("opencode-runtime-acceptance-native-exact.evidence", "OpenCode runtime acceptance native exact evidence refs are missing.")
  }
  if (!fixture.fixtureIDs.includes(openCodeRuntimeAcceptanceNativeExactFixtureID)) {
    addIssue("opencode-runtime-acceptance-native-exact.fixture", "OpenCode runtime acceptance native exact fixture ID is missing.")
  }
  for (const atomID of openCodeRuntimeAcceptanceNativeExactAtomIDs) {
    const descriptor = fixture.descriptors.find((item) => item.id === atomID)
    if (!descriptor || descriptor.parityCoverage !== "native" || descriptor.implementationKind !== "factory" || descriptor.knownLossiness.length !== 0) {
      addIssue("opencode-runtime-acceptance-native-exact.descriptor", `Descriptor for ${atomID} is not native exact.`)
    }
  }
  const runState = fixture.cases.find((item) => item.scenarioID === "run-state-busy-idle-shell-and-cancel")
  if (stableStringify(runState?.output["idleCancel"]) !== stableStringify(canonical.cases[0]?.output["idleCancel"])) {
    addIssue("opencode-runtime-acceptance-native-exact.cancel", "SessionRunState cancel/background-job cascade drifted from upstream behavior.")
  }
  const status = fixture.cases.find((item) => item.scenarioID === "status-events-and-idle-removal")
  if (stableStringify(status?.output["finalGet"]) !== stableStringify({ type: "idle" })) {
    addIssue("opencode-runtime-acceptance-native-exact.status", "SessionStatus idle removal/default-get behavior drifted.")
  }
  const retry = fixture.cases.find((item) => item.scenarioID === "retry-policy-status-boundary")
  if (
    stableStringify(retry?.output["retryAfterMs"]) !== stableStringify(1250) ||
    stableStringify(retry?.output["retryAfterSeconds"]) !== stableStringify(1500) ||
    stableStringify(retry?.output["cappedBackoff"]) !== stableStringify(30000)
  ) {
    addIssue("opencode-runtime-acceptance-native-exact.retry", "SessionRetry delay precedence or cap drifted.")
  }
  const result = fixture.cases.find((item) => item.scenarioID === "processor-and-compaction-result-boundary")
  if (stableStringify(result?.output["processorResults"]) !== stableStringify(canonical.cases[4]?.output["processorResults"])) {
    addIssue("opencode-runtime-acceptance-native-exact.result", "SessionProcessor result boundary drifted.")
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    addIssue("opencode-runtime-acceptance-native-exact.policy", "OpenCode runtime acceptance policy drifted from upstream behavior.")
  }
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    addIssue("opencode-runtime-acceptance-native-exact.fingerprint", "Fixture fingerprint no longer matches canonical OpenCode runtime acceptance behavior.")
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    addIssue("opencode-runtime-acceptance-native-exact.cases", "OpenCode runtime acceptance cases drifted from the native exact fixture.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function capRetryDelay(ms: number): number {
  return Math.min(ms, 2_147_483_647)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isFileAttachment(value: unknown): value is { url: string; mime: string; filename?: string } {
  return (
    isRecord(value) &&
    typeof value["url"] === "string" &&
    typeof value["mime"] === "string" &&
    (value["filename"] === undefined || typeof value["filename"] === "string")
  )
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
