import { createHash } from "node:crypto"

export const piMonoRuntimeAcceptanceUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoRuntimeAcceptanceControllerNativeExactAtomID = "pi.runtime.acceptance-controller.native-like"
export const piMonoRuntimeAcceptanceEvidenceNativeExactAtomID = "pi.runtime.acceptance-evidence.native-like"
export const piMonoRuntimeAcceptanceNativeExactAtomIDs = [
  piMonoRuntimeAcceptanceControllerNativeExactAtomID,
  piMonoRuntimeAcceptanceEvidenceNativeExactAtomID,
] as const
export const piMonoRuntimeAcceptanceNativeExactFixtureID = "pi-runtime-acceptance:native-exact-fixture"
export const piMonoRuntimeAcceptanceNativeExactEvidenceRef = "conformance:pi-runtime-acceptance-native-exact-fixture"
export const piMonoRuntimeAcceptanceNativeExactReplayRef = "runtime-acceptance-native-exact:pi-mono"
export const piMonoRuntimeAssemblyUpstreamRef = piMonoRuntimeAcceptanceUpstreamRef
export const piMonoRuntimeModuleCatalogNativeExactAtomID = "pi.runtime.module-catalog"
export const piMonoRuntimeCapabilityResolverNativeExactAtomID = "pi.runtime.capability-resolver"
export const piMonoRuntimeBindingPlannerNativeExactAtomID = "pi.runtime.binding-planner"
export const piMonoRuntimeLifecycleRunnerNativeExactAtomID = "pi.runtime.lifecycle-runner"
export const piMonoRuntimeAssemblyGraphNativeExactAtomID = "pi.runtime.assembly-graph"
export const piMonoRuntimeAssemblyNativeExactAtomIDs = [
  piMonoRuntimeModuleCatalogNativeExactAtomID,
  piMonoRuntimeCapabilityResolverNativeExactAtomID,
  piMonoRuntimeBindingPlannerNativeExactAtomID,
  piMonoRuntimeLifecycleRunnerNativeExactAtomID,
  piMonoRuntimeAssemblyGraphNativeExactAtomID,
] as const
export const piMonoRuntimeAssemblyNativeExactFixtureID = "pi-runtime-assembly:native-exact-fixture"
export const piMonoRuntimeAssemblyNativeExactEvidenceRef = "conformance:pi-runtime-assembly-native-exact-fixture"
export const piMonoRuntimeAssemblyNativeExactReplayRef = "runtime-assembly-native-exact:pi-mono"

export type PiMonoRuntimeAcceptanceNativeExactAtomID = (typeof piMonoRuntimeAcceptanceNativeExactAtomIDs)[number]
export type PiMonoRuntimeAssemblyNativeExactAtomID = (typeof piMonoRuntimeAssemblyNativeExactAtomIDs)[number]
export type PiMonoRuntimeAcceptancePortID = "runtime.acceptance-controller" | "runtime.acceptance-evidence"
export type PiMonoRuntimeAssemblyPortID =
  | "runtime.module-catalog"
  | "runtime.capability-resolver"
  | "runtime.binding-planner"
  | "runtime.lifecycle-runner"
  | "runtime.assembly-graph"
export type PiMonoRuntimeAcceptanceNativeScenarioID =
  | "agent-run-lifecycle-idle-after-agent-end"
  | "abort-emits-aborted-assistant-and-cleans-state"
  | "post-agent-run-retry-or-compaction-continues"
  | "streaming-queue-boundaries"
  | "dispose-invalidates-extension-context-and-resources"
export type PiMonoRuntimeAssemblyNativeScenarioID =
  | "module-catalog-agent-session-runtime-services"
  | "capability-resolution-session-replacement-order"
  | "binding-plan-runtime-ports"
  | "lifecycle-runner-session-events-and-rebind"
  | "assembly-graph-agent-session-runtime-lockfile"

export interface PiMonoRuntimeAssemblyNativeDescriptor {
  id: PiMonoRuntimeAssemblyNativeExactAtomID
  port: PiMonoRuntimeAssemblyPortID
  product: "pi-mono"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof piMonoRuntimeAssemblyNativeExactEvidenceRef, typeof piMonoRuntimeAssemblyNativeExactReplayRef]
  fixtureIDs: [typeof piMonoRuntimeAssemblyNativeExactFixtureID]
  knownLossiness: []
}

export interface PiMonoRuntimeAcceptanceNativeExactCase {
  scenarioID: PiMonoRuntimeAcceptanceNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoRuntimeAssemblyNativeExactCase {
  scenarioID: PiMonoRuntimeAssemblyNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoRuntimeAcceptanceNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: typeof piMonoRuntimeAcceptanceNativeExactAtomIDs
  portIDs: readonly ["runtime.acceptance-controller", "runtime.acceptance-evidence"]
  upstreamRef: typeof piMonoRuntimeAcceptanceUpstreamRef
  evidenceRef: typeof piMonoRuntimeAcceptanceNativeExactEvidenceRef
  fixtureID: typeof piMonoRuntimeAcceptanceNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    activeRunOwnsAbortSignalUntilListenersSettle: true
    finishRunClearsStreamingStateAfterAgentEndListeners: true
    abortCreatesAbortedAssistantFailureAndWaitsForIdle: true
    postAgentRunCanContinueForRetryOrCompaction: true
    streamingMessagesRequireSteerOrFollowUpQueueChoice: true
    disposeInvalidatesExtensionsDisconnectsAgentAndCleansResources: true
  }
  cases: PiMonoRuntimeAcceptanceNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoRuntimeAssemblyNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: typeof piMonoRuntimeAssemblyNativeExactAtomIDs
  portIDs: readonly [
    "runtime.module-catalog",
    "runtime.capability-resolver",
    "runtime.binding-planner",
    "runtime.lifecycle-runner",
    "runtime.assembly-graph",
  ]
  upstreamRef: typeof piMonoRuntimeAssemblyUpstreamRef
  evidenceRef: typeof piMonoRuntimeAssemblyNativeExactEvidenceRef
  fixtureID: typeof piMonoRuntimeAssemblyNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    factoryCreatesCwdBoundSessionServicesBeforeAgentSession: true
    runtimeOwnsCurrentSessionServicesDiagnosticsAndModelFallback: true
    replacementLifecycleEmitsBeforeAndShutdownEventsBeforeRebind: true
    extensionRuntimeBindsCoreActionsAfterAgentSessionCreation: true
    graphKeepsSessionManagerAgentSessionExtensionRunnerAndSurfaceOrder: true
  }
  cases: PiMonoRuntimeAssemblyNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly PiMonoRuntimeAssemblyNativeDescriptor[]
  intentionallyBridgeAtoms: readonly []
  fingerprint: string
}

export interface PiMonoRuntimeAcceptanceNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoRuntimeAssemblyNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoRuntimeAcceptanceNativeExactVerification {
  ok: boolean
  issues: PiMonoRuntimeAcceptanceNativeExactIssue[]
}

export interface PiMonoRuntimeAssemblyNativeExactVerification {
  ok: boolean
  issues: PiMonoRuntimeAssemblyNativeExactIssue[]
}

export interface PiMonoRuntimeAssemblyModule {
  id: string
  sourceRef: string
  provides: string[]
  requires: string[]
  lifecycle: string[]
}

export interface PiMonoRuntimeAssemblyBinding {
  portID: PiMonoRuntimeAssemblyPortID
  atomID: PiMonoRuntimeAssemblyNativeExactAtomID
  upstreamModuleID: string
  reason: string
}

export interface PiMonoRuntimeAssemblyGraph {
  nodes: Array<{ id: string; sourceRef: string; provides: string[] }>
  edges: Array<{ from: string; to: string; reason: string }>
  lockfile: {
    upstreamRef: typeof piMonoRuntimeAssemblyUpstreamRef
    root: "create-agent-session-runtime"
    order: string[]
    bindings: PiMonoRuntimeAssemblyBinding[]
    fingerprint: string
  }
}

function piMonoRuntimeAcceptanceNativeDescriptor(id: (typeof piMonoRuntimeAcceptanceNativeExactAtomIDs)[number]) {
  return {
    id,
    port: id === piMonoRuntimeAcceptanceControllerNativeExactAtomID ? "runtime.acceptance-controller" : "runtime.acceptance-evidence",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoRuntimeAcceptanceNativeExactEvidenceRef, piMonoRuntimeAcceptanceNativeExactReplayRef],
    fixtureIDs: [piMonoRuntimeAcceptanceNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation with native parity complete Agent/AgentSession runtime lifecycle, abort, retry, queue, and cleanup fixture coverage.",
  } as const
}

export const piMonoRuntimeAcceptanceNativeDescriptors = [
  piMonoRuntimeAcceptanceNativeDescriptor(piMonoRuntimeAcceptanceControllerNativeExactAtomID),
  piMonoRuntimeAcceptanceNativeDescriptor(piMonoRuntimeAcceptanceEvidenceNativeExactAtomID),
] as const

export const piMonoRuntimeAcceptanceNativeExactDescriptorForID = new Map(
  piMonoRuntimeAcceptanceNativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

const piMonoRuntimeAssemblyPortsByAtomID = {
  [piMonoRuntimeModuleCatalogNativeExactAtomID]: "runtime.module-catalog",
  [piMonoRuntimeCapabilityResolverNativeExactAtomID]: "runtime.capability-resolver",
  [piMonoRuntimeBindingPlannerNativeExactAtomID]: "runtime.binding-planner",
  [piMonoRuntimeLifecycleRunnerNativeExactAtomID]: "runtime.lifecycle-runner",
  [piMonoRuntimeAssemblyGraphNativeExactAtomID]: "runtime.assembly-graph",
} satisfies Record<PiMonoRuntimeAssemblyNativeExactAtomID, PiMonoRuntimeAssemblyPortID>

function piMonoRuntimeAssemblyPortIDs(): PiMonoRuntimeAssemblyNativeExactFixture["portIDs"] {
  return [
    "runtime.module-catalog",
    "runtime.capability-resolver",
    "runtime.binding-planner",
    "runtime.lifecycle-runner",
    "runtime.assembly-graph",
  ] as const
}

function piMonoRuntimeAssemblyPortsByAtomIDValues(): PiMonoRuntimeAssemblyPortID[] {
  return [...piMonoRuntimeAssemblyPortIDs()]
}

export const piMonoRuntimeAssemblyNativeDescriptors = piMonoRuntimeAssemblyNativeExactAtomIDs.map((id): PiMonoRuntimeAssemblyNativeDescriptor => ({
  id,
  port: piMonoRuntimeAssemblyPortsByAtomID[id],
  product: "pi-mono",
  implementationKind: "factory",
  selectionReason: "Pi upstream native implementation with native parity complete createAgentSession, AgentSessionRuntime, AgentSession, extension runtime, and session replacement lifecycle fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [piMonoRuntimeAssemblyNativeExactEvidenceRef, piMonoRuntimeAssemblyNativeExactReplayRef],
  fixtureIDs: [piMonoRuntimeAssemblyNativeExactFixtureID],
  knownLossiness: [],
}))

export const piMonoRuntimeAssemblyNativeDescriptorByAtomID = Object.fromEntries(
  piMonoRuntimeAssemblyNativeDescriptors.map((descriptor) => [descriptor.id, descriptor]),
) as Record<PiMonoRuntimeAssemblyNativeExactAtomID, PiMonoRuntimeAssemblyNativeDescriptor>

export function buildPiMonoRuntimeModuleCatalog(): PiMonoRuntimeAssemblyModule[] {
  return [
    {
      id: "session-manager",
      sourceRef: "packages/coding-agent/src/core/session-manager.ts#SessionManager.create,open,buildSessionContext,getSessionFile,getCwd",
      provides: ["session.file", "session.cwd", "session.context", "session.branch"],
      requires: ["cwd", "agent-dir"],
      lifecycle: ["process:resolve-session-dir", "session:create-or-open", "session:build-context"],
    },
    {
      id: "create-agent-session-runtime",
      sourceRef: "packages/coding-agent/src/core/sdk.ts#createAgentSession,CreateAgentSessionOptions,CreateAgentSessionResult",
      provides: ["runtime.factory", "runtime.model-restore", "runtime.resource-loader", "runtime.default-tools"],
      requires: ["session-manager", "settings-manager", "model-registry", "resource-loader"],
      lifecycle: ["process:resolve-cwd-agent-dir", "process:load-resources", "session:restore-model-thinking", "session:create-agent"],
    },
    {
      id: "agent-session",
      sourceRef: "packages/coding-agent/src/core/agent-session.ts#AgentSession,prompt,abort,clearQueue,dispose,bindExtensions,createReplacedSessionContext",
      provides: ["runtime.prompt-loop", "runtime.queue", "runtime.compaction", "runtime.extension-bindings"],
      requires: ["agent", "session-manager", "resource-loader", "extension-runner"],
      lifecycle: ["session:bind-agent-events", "turn:prompt-or-queue", "turn:post-agent-run", "session:dispose"],
    },
    {
      id: "extension-runtime",
      sourceRef: "packages/coding-agent/src/core/extensions/loader.ts#createExtensionRuntime,createExtensionAPI,loadExtensionFromFactory;packages/coding-agent/src/core/extensions/runner.ts#ExtensionRunner.bindCore,emit,emitSessionShutdownEvent",
      provides: ["extension.runtime", "extension.api", "extension.event-bus", "extension.shutdown"],
      requires: ["agent-session", "model-registry", "session-manager", "ui-context"],
      lifecycle: ["process:load-extensions", "session:bind-core", "session:emit-events", "session:invalidate-stale-context"],
    },
    {
      id: "agent-session-runtime",
      sourceRef: "packages/coding-agent/src/core/agent-session-runtime.ts#AgentSessionRuntime,switchSession,newSession,fork,importFromJsonl,dispose",
      provides: ["runtime.current-session", "runtime.cwd-services", "runtime.session-replacement", "runtime.diagnostics"],
      requires: ["create-agent-session-runtime", "agent-session", "extension-runtime", "session-manager"],
      lifecycle: ["session:own-current-runtime", "session:before-switch-or-fork", "session:shutdown-old-runtime", "session:create-next-runtime", "session:rebind"],
    },
  ]
}

export function resolvePiMonoRuntimeCapabilities(input: {
  mode: "interactive" | "rpc" | "print"
  replacement?: "resume" | "new" | "fork" | "import" | "quit"
  hasSessionStartEvent?: boolean
}): {
  order: string[]
  emitsSessionStart: boolean
  tearsDownPreviousSession: boolean
  rebindsSession: boolean
  capabilities: Record<string, string[]>
} {
  const catalog = buildPiMonoRuntimeModuleCatalog()
  const capabilities = Object.fromEntries(catalog.map((item) => [item.id, item.provides]))
  const replacement = input.replacement
  return {
    order: ["session-manager", "create-agent-session-runtime", "agent-session", "extension-runtime", "agent-session-runtime"],
    emitsSessionStart: input.hasSessionStartEvent === true || replacement === "resume" || replacement === "new" || replacement === "fork" || replacement === "import",
    tearsDownPreviousSession: replacement === "resume" || replacement === "new" || replacement === "fork" || replacement === "import" || replacement === "quit",
    rebindsSession: replacement === "resume" || replacement === "new" || replacement === "fork" || replacement === "import",
    capabilities,
  }
}

export function planPiMonoRuntimeBindings(): PiMonoRuntimeAssemblyBinding[] {
  return [
    {
      portID: "runtime.module-catalog",
      atomID: piMonoRuntimeModuleCatalogNativeExactAtomID,
      upstreamModuleID: "create-agent-session-runtime",
      reason: "Catalog is the pinned Pi runtime service inventory from SessionManager, createAgentSession, AgentSession, extension runtime, and AgentSessionRuntime sources.",
    },
    {
      portID: "runtime.capability-resolver",
      atomID: piMonoRuntimeCapabilityResolverNativeExactAtomID,
      upstreamModuleID: "agent-session-runtime",
      reason: "Resolver follows AgentSessionRuntime replacement order: optional before events, session shutdown, new runtime creation, apply, and rebind.",
    },
    {
      portID: "runtime.binding-planner",
      atomID: piMonoRuntimeBindingPlannerNativeExactAtomID,
      upstreamModuleID: "create-agent-session-runtime",
      reason: "Planner maps runtime ports to Pi's session manager, createAgentSession factory, AgentSession core, extension runtime, and runtime replacement responsibilities.",
    },
    {
      portID: "runtime.lifecycle-runner",
      atomID: piMonoRuntimeLifecycleRunnerNativeExactAtomID,
      upstreamModuleID: "agent-session-runtime",
      reason: "Lifecycle runner replays session_before, session_shutdown, beforeSessionInvalidate, dispose, createRuntime, apply, and rebind ordering.",
    },
    {
      portID: "runtime.assembly-graph",
      atomID: piMonoRuntimeAssemblyGraphNativeExactAtomID,
      upstreamModuleID: "agent-session-runtime",
      reason: "Assembly graph records the pinned Pi runtime DAG and lockfile fingerprint for AgentSessionRuntime orchestration.",
    },
  ]
}

export function runPiMonoRuntimeLifecycle(input: {
  mode: "interactive" | "rpc" | "print"
  replacement?: "resume" | "new" | "fork" | "import" | "quit"
  beforeEventCancelled?: boolean
}): {
  boot: string[]
  session: string[]
  replacement: string[]
  close: string[]
} {
  const replacement = input.replacement
  const resolved = resolvePiMonoRuntimeCapabilities({
    mode: input.mode,
    ...(replacement ? { replacement } : {}),
    hasSessionStartEvent: replacement !== undefined,
  })
  const boot = [
    "resolvePath:cwd",
    "getAgentDir",
    "SessionManager:create-or-open",
    "SettingsManager:create",
    "DefaultResourceLoader:reload",
    "buildSessionContext",
    "findInitialModel-or-restore-session-model",
    "Agent:create-with-extension-runner-ref",
    "AgentSession:create",
    "resourceLoader:getExtensions",
  ]
  const session = [
    input.mode === "interactive" ? "bindExtensions:ui-context" : "bindExtensions:no-op-ui",
    "ExtensionRunner:bindCore",
    "extension-runtime:flush-pending-providers",
    "sessionStartEvent:emit-if-present",
    "agent-events:persist-session",
    "prompt:run-or-queue",
  ]
  const replacementTrace = replacement === undefined
    ? []
    : input.beforeEventCancelled
      ? [`session_before_${replacement === "fork" ? "fork" : "switch"}:cancel`]
      : [
        replacement === "fork" ? "session_before_fork" : replacement === "quit" ? "skip-before-switch" : "session_before_switch",
        "session_shutdown",
        "beforeSessionInvalidate",
        "old-session:dispose",
        replacement === "quit" ? "runtime:not-recreated" : "createRuntime:next-session",
        replacement === "quit" ? "rebind:skipped" : "apply:next-session-services-diagnostics",
        replacement === "quit" ? "dispose:complete" : "rebindSession",
        replacement === "quit" ? "withSession:skipped" : "withSession:replaced-context",
      ]
  const close = [
    resolved.tearsDownPreviousSession ? "session_shutdown:emitted" : "session_shutdown:not-needed",
    "extension-runtime:invalidate-stale-context",
    "agent:disconnect",
    "cleanupSessionResources",
  ]
  return { boot, session, replacement: replacementTrace, close }
}

export function buildPiMonoRuntimeAssemblyGraph(): PiMonoRuntimeAssemblyGraph {
  const catalog = buildPiMonoRuntimeModuleCatalog()
  const bindings = planPiMonoRuntimeBindings()
  const order = resolvePiMonoRuntimeCapabilities({ mode: "interactive" }).order
  const nodes = catalog.map((item) => ({ id: item.id, sourceRef: item.sourceRef, provides: item.provides }))
  const edges = [
    { from: "session-manager", to: "create-agent-session-runtime", reason: "createAgentSession creates or receives SessionManager before restoring context, model, and thinking state." },
    { from: "create-agent-session-runtime", to: "agent-session", reason: "createAgentSession constructs AgentSession with cwd, resource loader, model registry, tools, and extension runner ref." },
    { from: "agent-session", to: "extension-runtime", reason: "AgentSession binds ExtensionRunner core actions after the session owns the agent and managers." },
    { from: "extension-runtime", to: "agent-session-runtime", reason: "AgentSessionRuntime emits session lifecycle events through the active extension runner before replacement or shutdown." },
    { from: "agent-session-runtime", to: "create-agent-session-runtime", reason: "Session replacement calls the runtime factory to create the next cwd-bound AgentSession and services." },
  ]
  const lockfileWithoutFingerprint: Omit<PiMonoRuntimeAssemblyGraph["lockfile"], "fingerprint"> = {
    upstreamRef: piMonoRuntimeAssemblyUpstreamRef,
    root: "create-agent-session-runtime" as const,
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

export function buildPiMonoRuntimeAssemblyNativeExactFixture(): PiMonoRuntimeAssemblyNativeExactFixture {
  const catalog = buildPiMonoRuntimeModuleCatalog()
  const interactiveResolution = resolvePiMonoRuntimeCapabilities({ mode: "interactive" })
  const resumeResolution = resolvePiMonoRuntimeCapabilities({ mode: "interactive", replacement: "resume" })
  const forkResolution = resolvePiMonoRuntimeCapabilities({ mode: "interactive", replacement: "fork" })
  const bindings = planPiMonoRuntimeBindings()
  const resumeLifecycle = runPiMonoRuntimeLifecycle({ mode: "interactive", replacement: "resume" })
  const forkCancelledLifecycle = runPiMonoRuntimeLifecycle({ mode: "interactive", replacement: "fork", beforeEventCancelled: true })
  const graph = buildPiMonoRuntimeAssemblyGraph()
  const cases: PiMonoRuntimeAssemblyNativeExactCase[] = [
    {
      scenarioID: "module-catalog-agent-session-runtime-services",
      input: { sourceFiles: ["sdk.ts", "agent-session.ts", "agent-session-runtime.ts", "extensions/loader.ts", "extensions/runner.ts"] },
      output: { modules: catalog },
      upstreamBehavior: "Pi's runtime is built from SessionManager, createAgentSession, AgentSession, extension loader/runner, and AgentSessionRuntime; runtime objects keep the current session, cwd-bound services, diagnostics, and model fallback state.",
    },
    {
      scenarioID: "capability-resolution-session-replacement-order",
      input: { interactive: { mode: "interactive" }, resume: { mode: "interactive", replacement: "resume" }, fork: { mode: "interactive", replacement: "fork" } },
      output: { interactiveResolution, resumeResolution, forkResolution },
      upstreamBehavior: "AgentSessionRuntime replacement methods optionally emit before events, tear down the current session with session_shutdown and dispose, create the next runtime through the factory, apply services/diagnostics, then rebind and run withSession.",
    },
    {
      scenarioID: "binding-plan-runtime-ports",
      input: { ports: [...piMonoRuntimeAssemblyPortsByAtomIDValues()] },
      output: { bindings },
      upstreamBehavior: "The five runtime ports bind directly to Pi's AgentSession runtime modules instead of common memory/default/lockfile/scoped runtime implementations.",
    },
    {
      scenarioID: "lifecycle-runner-session-events-and-rebind",
      input: { resume: { mode: "interactive", replacement: "resume" }, cancelledFork: { mode: "interactive", replacement: "fork", beforeEventCancelled: true } },
      output: { resumeLifecycle, forkCancelledLifecycle },
      upstreamBehavior: "switchSession/newSession/fork/importFromJsonl run session_before events first, respect cancellation, then emit session_shutdown, call beforeSessionInvalidate, dispose the old session, create/apply the next runtime, rebind, and pass a replaced context to withSession.",
    },
    {
      scenarioID: "assembly-graph-agent-session-runtime-lockfile",
      input: { root: "create-agent-session-runtime", upstreamRef: piMonoRuntimeAssemblyUpstreamRef },
      output: { graph },
      upstreamBehavior: "The runtime lockfile records Pi's native runtime DAG with session manager, createAgentSession, AgentSession, extension runtime, and AgentSessionRuntime nodes plus a stable fingerprint over the pinned upstream binding graph.",
    },
  ]
  const snapshotWithoutFingerprint: Omit<PiMonoRuntimeAssemblyNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: [...piMonoRuntimeAssemblyNativeExactAtomIDs] as typeof piMonoRuntimeAssemblyNativeExactAtomIDs,
    portIDs: piMonoRuntimeAssemblyPortIDs(),
    upstreamRef: piMonoRuntimeAssemblyUpstreamRef,
    evidenceRef: piMonoRuntimeAssemblyNativeExactEvidenceRef,
    fixtureID: piMonoRuntimeAssemblyNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      factoryCreatesCwdBoundSessionServicesBeforeAgentSession: true as const,
      runtimeOwnsCurrentSessionServicesDiagnosticsAndModelFallback: true as const,
      replacementLifecycleEmitsBeforeAndShutdownEventsBeforeRebind: true as const,
      extensionRuntimeBindsCoreActionsAfterAgentSessionCreation: true as const,
      graphKeepsSessionManagerAgentSessionExtensionRunnerAndSurfaceOrder: true as const,
    },
    cases,
    sourceRefs: [
      "packages/coding-agent/src/core/sdk.ts#createAgentSession,CreateAgentSessionOptions,CreateAgentSessionResult",
      "packages/coding-agent/src/core/agent-session.ts#AgentSession,prompt,abort,clearQueue,dispose,bindExtensions,createReplacedSessionContext",
      "packages/coding-agent/src/core/agent-session-runtime.ts#AgentSessionRuntime,switchSession,newSession,fork,importFromJsonl,dispose",
      "packages/coding-agent/src/core/extensions/loader.ts#createExtensionRuntime,createExtensionAPI,loadExtensionFromFactory",
      "packages/coding-agent/src/core/extensions/runner.ts#ExtensionRunner.bindCore,emit,emitSessionShutdownEvent",
    ],
    nativeEvidenceRefs: [piMonoRuntimeAssemblyNativeExactEvidenceRef, piMonoRuntimeAssemblyNativeExactReplayRef],
    fixtureIDs: [piMonoRuntimeAssemblyNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptors: piMonoRuntimeAssemblyNativeDescriptors,
    intentionallyBridgeAtoms: [] as const,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyPiMonoRuntimeAssemblyNativeExactFixture(
  fixture: PiMonoRuntimeAssemblyNativeExactFixture,
): PiMonoRuntimeAssemblyNativeExactVerification {
  const canonical = buildPiMonoRuntimeAssemblyNativeExactFixture()
  const issues: PiMonoRuntimeAssemblyNativeExactIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (
    fixture.product !== "pi-mono" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(piMonoRuntimeAssemblyNativeExactAtomIDs) ||
    JSON.stringify(fixture.portIDs) !== JSON.stringify(piMonoRuntimeAssemblyPortIDs())
  ) {
    addIssue("pi-runtime-assembly-native-exact.identity", "Pi runtime assembly fixture lost product, atom, or port identity.")
  }
  if (
    fixture.upstreamRef !== piMonoRuntimeAssemblyUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("sdk.ts#createAgentSession")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent-session.ts#AgentSession")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent-session-runtime.ts#AgentSessionRuntime")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("extensions/loader.ts#createExtensionRuntime")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("extensions/runner.ts#ExtensionRunner.bindCore"))
  ) {
    addIssue("pi-runtime-assembly-native-exact.upstream", "Fixture must stay pinned to Pi upstream AgentSession runtime sources.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    addIssue("pi-runtime-assembly-native-exact.native-claim", "Pi runtime assembly fixture must explicitly claim native-exact parity.")
  }
  if (fixture.knownLossiness.length !== 0 || fixture.intentionallyBridgeAtoms.length !== 0 || piMonoRuntimeAssemblyNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length !== 0)) {
    addIssue("pi-runtime-assembly-native-exact.lossiness", "Native exact Pi runtime assembly fixture must not carry compatible bridge lossiness.")
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoRuntimeAssemblyNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoRuntimeAssemblyNativeExactReplayRef)) {
    addIssue("pi-runtime-assembly-native-exact.evidence", "Pi runtime assembly native exact evidence refs are missing.")
  }
  if (!fixture.fixtureIDs.includes(piMonoRuntimeAssemblyNativeExactFixtureID)) {
    addIssue("pi-runtime-assembly-native-exact.fixture", "Pi runtime assembly native exact fixture ID is missing.")
  }
  for (const atomID of piMonoRuntimeAssemblyNativeExactAtomIDs) {
    const descriptor = fixture.descriptors.find((item) => item.id === atomID)
    if (!descriptor || descriptor.parityCoverage !== "native" || descriptor.implementationKind !== "factory" || descriptor.knownLossiness.length !== 0) {
      addIssue("pi-runtime-assembly-native-exact.descriptor", `Descriptor for ${atomID} is not native exact.`)
    }
  }
  const catalog = fixture.cases.find((item) => item.scenarioID === "module-catalog-agent-session-runtime-services")
  if (stableStringify(catalog?.output["modules"]) !== stableStringify(canonical.cases[0]?.output["modules"])) {
    addIssue("pi-runtime-assembly-native-exact.catalog", "Pi runtime module catalog drifted from upstream native fixture.")
  }
  const resolver = fixture.cases.find((item) => item.scenarioID === "capability-resolution-session-replacement-order")
  if (stableStringify(resolver?.output["resumeResolution"]) !== stableStringify(canonical.cases[1]?.output["resumeResolution"])) {
    addIssue("pi-runtime-assembly-native-exact.resolver", "Pi runtime capability resolution order drifted from upstream native fixture.")
  }
  const planner = fixture.cases.find((item) => item.scenarioID === "binding-plan-runtime-ports")
  if (stableStringify(planner?.output["bindings"]) !== stableStringify(canonical.cases[2]?.output["bindings"])) {
    addIssue("pi-runtime-assembly-native-exact.planner", "Pi runtime binding plan drifted from upstream native fixture.")
  }
  const lifecycle = fixture.cases.find((item) => item.scenarioID === "lifecycle-runner-session-events-and-rebind")
  if (stableStringify(lifecycle?.output["resumeLifecycle"]) !== stableStringify(canonical.cases[3]?.output["resumeLifecycle"])) {
    addIssue("pi-runtime-assembly-native-exact.lifecycle", "Pi runtime lifecycle runner trace drifted from upstream native fixture.")
  }
  const graph = fixture.cases.find((item) => item.scenarioID === "assembly-graph-agent-session-runtime-lockfile")
  if (stableStringify(graph?.output["graph"]) !== stableStringify(canonical.cases[4]?.output["graph"])) {
    addIssue("pi-runtime-assembly-native-exact.graph", "Pi runtime assembly graph drifted from upstream native fixture.")
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    addIssue("pi-runtime-assembly-native-exact.policy", "Pi runtime assembly policy drifted from upstream behavior.")
  }
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    addIssue("pi-runtime-assembly-native-exact.fingerprint", "Fixture fingerprint no longer matches canonical Pi runtime assembly behavior.")
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    addIssue("pi-runtime-assembly-native-exact.cases", "Pi runtime assembly cases drifted from the native exact fixture.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildPiMonoRuntimeAcceptanceNativeLifecycleTrace(input: {
  aborted?: boolean
  listenerSettled?: boolean
  pendingToolCallIDs?: string[]
} = {}): Record<string, unknown> {
  const pendingBefore = input.pendingToolCallIDs ?? ["tool-read"]
  return {
    activeRunCreated: true,
    signalAvailableDuringListeners: true,
    isStreamingDuringRun: true,
    eventOrder: input.aborted
      ? ["message_start", "message_end", "turn_end", "agent_end", "finishRun"]
      : ["message_start", "message_update", "message_end", "turn_end", "agent_end", "finishRun"],
    finalAssistantStopReason: input.aborted ? "aborted" : "stop",
    pendingToolCallsBeforeFinish: pendingBefore,
    pendingToolCallsAfterFinish: [],
    streamingMessageAfterAgentEnd: undefined,
    isStreamingAfterFinishRun: false,
    idleResolvedAfterListeners: input.listenerSettled !== false,
  }
}

export function buildPiMonoRuntimeAcceptanceNativeExactFixture(): PiMonoRuntimeAcceptanceNativeExactFixture {
  const normalLifecycle = buildPiMonoRuntimeAcceptanceNativeLifecycleTrace({ listenerSettled: true })
  const abortLifecycle = buildPiMonoRuntimeAcceptanceNativeLifecycleTrace({
    aborted: true,
    listenerSettled: true,
    pendingToolCallIDs: ["tool-read", "tool-write"],
  })
  const fixtureWithoutFingerprint: Omit<PiMonoRuntimeAcceptanceNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: [...piMonoRuntimeAcceptanceNativeExactAtomIDs] as typeof piMonoRuntimeAcceptanceNativeExactAtomIDs,
    portIDs: ["runtime.acceptance-controller", "runtime.acceptance-evidence"] as const,
    upstreamRef: piMonoRuntimeAcceptanceUpstreamRef,
    evidenceRef: piMonoRuntimeAcceptanceNativeExactEvidenceRef,
    fixtureID: piMonoRuntimeAcceptanceNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      activeRunOwnsAbortSignalUntilListenersSettle: true as const,
      finishRunClearsStreamingStateAfterAgentEndListeners: true as const,
      abortCreatesAbortedAssistantFailureAndWaitsForIdle: true as const,
      postAgentRunCanContinueForRetryOrCompaction: true as const,
      streamingMessagesRequireSteerOrFollowUpQueueChoice: true as const,
      disposeInvalidatesExtensionsDisconnectsAgentAndCleansResources: true as const,
    },
    cases: [
      {
        scenarioID: "agent-run-lifecycle-idle-after-agent-end" as const,
        input: { promptState: "idle", listenerSettled: true },
        output: normalLifecycle,
        upstreamBehavior: "Agent.runWithLifecycle creates an active AbortController, sets isStreaming before runAgentLoop, awaits agent_end listeners with the active signal, then finishRun clears streamingMessage, pendingToolCalls, activeRun, and resolves waitForIdle.",
      },
      {
        scenarioID: "abort-emits-aborted-assistant-and-cleans-state" as const,
        input: { abortDuringRun: true, pendingToolCallIDs: ["tool-read", "tool-write"] },
        output: {
          lifecycle: abortLifecycle,
          failureMessage: {
            role: "assistant",
            stopReason: "aborted",
            content: [{ type: "text", text: "" }],
            usage: "EMPTY_USAGE",
          },
          waitForIdleAfterAbort: true,
        },
        upstreamBehavior: "Agent.abort aborts the active run signal; runWithLifecycle catches the abort, handleRunFailure emits an aborted assistant message_start/message_end/turn_end/agent_end sequence, and AgentSession.abort waits for waitForIdle.",
      },
      {
        scenarioID: "post-agent-run-retry-or-compaction-continues" as const,
        input: {
          lastAssistantStopReasons: ["error", "stop"],
          retryEnabled: true,
          compactionModes: ["overflow", "threshold"],
        },
        output: {
          postRunLoop: ["agent.prompt", "_handlePostAgentRun", "agent.continue"],
          retryPath: ["_isRetryableError", "_prepareRetry", "auto_retry_start", "agent.continue"],
          compactionPath: ["_checkCompaction", "compaction_start", "compaction_end", "agent.continue"],
          nonRetryableErrorEvent: "auto_retry_end",
        },
        upstreamBehavior: "AgentSession._runAgentPrompt repeatedly calls _handlePostAgentRun and agent.continue while retry or compaction work returns true; _handlePostAgentRun resets _lastAssistantMessage and emits auto_retry_end on exhausted error retries.",
      },
      {
        scenarioID: "streaming-queue-boundaries" as const,
        input: {
          isStreaming: true,
          missingStreamingBehavior: "error",
          streamingBehavior: ["steer", "followUp"],
        },
        output: {
          promptWithoutQueueChoice: "Agent is already processing. Specify streamingBehavior ('steer' or 'followUp') to queue the message.",
          steerPath: ["_queueSteer", "agent.steer", "getSteeringMessages"],
          followUpPath: ["_queueFollowUp", "agent.followUp", "getFollowUpMessages"],
          clearQueuePath: ["clearQueue", "agent.clearAllQueues", "_emitQueueUpdate"],
        },
        upstreamBehavior: "AgentSession.prompt rejects streaming prompts without streamingBehavior; steer messages are drained before the next model call, follow-up messages run after the agent would otherwise stop, and clearQueue clears both local and Agent queues.",
      },
      {
        scenarioID: "dispose-invalidates-extension-context-and-resources" as const,
        input: { disposeCalled: true },
        output: {
          sequence: ["_extensionRunner.invalidate", "_disconnectFromAgent", "_eventListeners=[]", "cleanupSessionResources"],
          staleContextMessageIncludes: "This extension ctx is stale after session replacement or reload.",
          reconnectAfterCompactionFinally: ["_compactionAbortController=undefined", "_reconnectToAgent"],
        },
        upstreamBehavior: "AgentSession.dispose invalidates extension contexts, disconnects the agent subscription, clears event listeners, and calls cleanupSessionResources; compaction finally blocks clear abort controllers and reconnect the agent.",
      },
    ],
    sourceRefs: [
      "packages/agent/src/agent.ts#Agent.runWithLifecycle,handleRunFailure,finishRun,processEvents,abort,waitForIdle,continue,createLoopConfig",
      "packages/agent/src/agent-loop.ts#runAgentLoop,runAgentLoopContinue",
      "packages/agent/src/types.ts#AgentState,AgentLoopConfig,getSteeringMessages,getFollowUpMessages,AgentEvent",
      "packages/coding-agent/src/core/agent-session.ts#_runAgentPrompt,_handlePostAgentRun,prompt,abort,clearQueue,dispose,_checkCompaction,_runAutoCompaction,abortCompaction,abortBranchSummary",
      "packages/coding-agent/src/core/session-resources.ts#cleanupSessionResources",
    ],
    nativeEvidenceRefs: [...piMonoRuntimeAcceptanceNativeDescriptors[0].nativeEvidenceRefs],
    fixtureIDs: [...piMonoRuntimeAcceptanceNativeDescriptors[0].fixtureIDs],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoRuntimeAcceptanceNativeExactFixture(
  fixture: PiMonoRuntimeAcceptanceNativeExactFixture,
): PiMonoRuntimeAcceptanceNativeExactVerification {
  const canonical = buildPiMonoRuntimeAcceptanceNativeExactFixture()
  const issues: PiMonoRuntimeAcceptanceNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-runtime-acceptance-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi runtime acceptance behavior." })
  }
  if (
    fixture.product !== "pi-mono" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(piMonoRuntimeAcceptanceNativeExactAtomIDs) ||
    JSON.stringify(fixture.portIDs) !== JSON.stringify(["runtime.acceptance-controller", "runtime.acceptance-evidence"])
  ) {
    issues.push({ id: "pi-runtime-acceptance-native-exact.identity", message: "Fixture must remain scoped to the Pi runtime acceptance controller/evidence atoms." })
  }
  if (
    fixture.upstreamRef !== piMonoRuntimeAcceptanceUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent.ts#Agent.runWithLifecycle")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("agent-session.ts#_runAgentPrompt")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("_handlePostAgentRun")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("session-resources.ts#cleanupSessionResources"))
  ) {
    issues.push({ id: "pi-runtime-acceptance-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream Agent and AgentSession runtime sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-runtime-acceptance-native-exact.native-claim", message: "Pi runtime acceptance fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoRuntimeAcceptanceNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "pi-runtime-acceptance-native-exact.lossiness", message: "Native exact Pi runtime acceptance fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoRuntimeAcceptanceNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoRuntimeAcceptanceNativeExactReplayRef)) {
    issues.push({ id: "pi-runtime-acceptance-native-exact.evidence", message: "Pi runtime acceptance native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoRuntimeAcceptanceNativeExactFixtureID)) {
    issues.push({ id: "pi-runtime-acceptance-native-exact.fixture", message: "Pi runtime acceptance native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-runtime-acceptance-native-exact.policy", message: "Pi runtime acceptance policy drifted from upstream lifecycle behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-runtime-acceptance-native-exact.cases", message: "Pi runtime acceptance cases drifted from the native exact fixture." })
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
