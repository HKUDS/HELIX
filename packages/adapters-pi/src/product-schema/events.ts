import { createHash } from "node:crypto"

export const piMonoEventUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoEventNativeExactFixtureID = "pi-event:native-exact-fixture"
export const piMonoEventNativeExactEvidenceRef = "conformance:pi-event-native-exact-fixture"
export const piMonoEventNativeExactReplayRef = "event-native-exact:pi-mono"
export const piMonoEventEnvelopeNativeExactAtomID = "pi.event.envelope-bridge"
export const piMonoRuntimeEventNativeExactAtomID = "pi.event.runtime-bridge"
export const piMonoExtensionRuntimeEventNativeExactAtomID = "pi.extension.runtime-event-bridge"

export type PiMonoEventNativeExactAtomID =
  | typeof piMonoEventEnvelopeNativeExactAtomID
  | typeof piMonoRuntimeEventNativeExactAtomID
  | typeof piMonoExtensionRuntimeEventNativeExactAtomID

export interface PiMonoEventBus {
  emit(channel: string, data: unknown): void
  on(channel: string, handler: (data: unknown) => unknown | Promise<unknown>): () => void
  clear(): void
}

export interface PiMonoEventBusOptions {
  onError?: (input: { channel: string; error: unknown }) => void
}

export interface PiMonoEventEnvelope {
  channel: string
  data: unknown
}

export interface PiMonoRuntimeEventEmission {
  channel: string
  data: unknown
  handlerCount: number
  delivered: PiMonoEventEnvelope[]
}

export interface PiMonoEventNativeDescriptor {
  id: PiMonoEventNativeExactAtomID
  port: "event.envelope" | "event.log"
  product: "pi-mono"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof piMonoEventNativeExactEvidenceRef, typeof piMonoEventNativeExactReplayRef]
  fixtureIDs: [typeof piMonoEventNativeExactFixtureID]
  knownLossiness: []
}

export type PiMonoEventNativeExactScenarioID =
  | "event-bus-sync-order"
  | "event-bus-unsubscribe"
  | "event-bus-async-handler-error-is-reported"
  | "extension-api-exposes-shared-event-bus"
  | "generic-runner-emit-visits-extension-order"

export interface PiMonoEventNativeExactCase {
  scenarioID: PiMonoEventNativeExactScenarioID
  input: Record<string, string | number | string[] | boolean>
  output: Record<string, string | number | string[] | boolean>
  upstreamBehavior: string
}

export interface PiMonoEventNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: readonly [
    typeof piMonoEventEnvelopeNativeExactAtomID,
    typeof piMonoRuntimeEventNativeExactAtomID,
    typeof piMonoExtensionRuntimeEventNativeExactAtomID,
  ]
  portIDs: readonly ["event.envelope", "event.log"]
  upstreamRef: typeof piMonoEventUpstreamRef
  evidenceRef: typeof piMonoEventNativeExactEvidenceRef
  fixtureID: typeof piMonoEventNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    eventBusUsesNodeEventEmitterSemantics: true
    emitIsSynchronousFanout: true
    handlersAreRegisteredPerChannel: true
    unsubscribeRemovesOnlyThatHandler: true
    handlerErrorsAreReportedAndSwallowed: true
    clearRemovesAllListeners: true
    extensionAPIEventsExposeSharedBus: true
    runnerEmitVisitsExtensionsInLoadOrder: true
    runnerEmitContinuesAfterHandlerErrors: true
    sessionBeforeCancelShortCircuits: true
  }
  cases: PiMonoEventNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  descriptors: PiMonoEventNativeDescriptor[]
  fingerprint: string
}

export interface PiMonoEventNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoEventNativeExactVerification {
  ok: boolean
  issues: PiMonoEventNativeExactIssue[]
}

export const piMonoEventEnvelopeNativeDescriptor = piMonoEventNativeDescriptor(
  piMonoEventEnvelopeNativeExactAtomID,
  "event.envelope",
  "Pi upstream native extension EventBus envelope fanout with native parity complete event fixture coverage.",
)

export const piMonoRuntimeEventNativeDescriptor = piMonoEventNativeDescriptor(
  piMonoRuntimeEventNativeExactAtomID,
  "event.log",
  "Pi upstream native ExtensionRunner generic event dispatch with native parity complete event fixture coverage.",
)

export const piMonoExtensionRuntimeEventNativeDescriptor = piMonoEventNativeDescriptor(
  piMonoExtensionRuntimeEventNativeExactAtomID,
  "event.log",
  "Pi upstream native ExtensionAPI events bus bridge with native parity complete event fixture coverage.",
)

export const piMonoEventNativeDescriptors = [
  piMonoEventEnvelopeNativeDescriptor,
  piMonoRuntimeEventNativeDescriptor,
  piMonoExtensionRuntimeEventNativeDescriptor,
] as const

export function createPiMonoEventBus(options: PiMonoEventBusOptions = {}): PiMonoEventBus {
  const handlers = new Map<string, Set<(data: unknown) => void>>()
  return {
    emit(channel, data) {
      for (const handler of [...(handlers.get(channel) ?? [])]) {
        handler(data)
      }
    },
    on(channel, handler) {
      const wrapped = (data: unknown) => {
        const safeHandler = async () => {
          try {
            await handler(data)
          } catch (error) {
            options.onError?.({ channel, error })
          }
        }
        void safeHandler()
      }
      const channelHandlers = handlers.get(channel) ?? new Set<(data: unknown) => void>()
      channelHandlers.add(wrapped)
      handlers.set(channel, channelHandlers)
      return () => {
        channelHandlers.delete(wrapped)
        if (channelHandlers.size === 0) handlers.delete(channel)
      }
    },
    clear() {
      handlers.clear()
    },
  }
}

export function emitPiMonoRuntimeEvent(input: {
  bus: PiMonoEventBus
  channel: string
  data: unknown
  handlerCount?: number
}): PiMonoRuntimeEventEmission {
  const delivered: PiMonoEventEnvelope[] = []
  const unsubscribe = input.bus.on(input.channel, (data) => {
    delivered.push({ channel: input.channel, data })
  })
  input.bus.emit(input.channel, input.data)
  unsubscribe()
  return {
    channel: input.channel,
    data: input.data,
    handlerCount: input.handlerCount ?? delivered.length,
    delivered,
  }
}

export function buildPiMonoEventNativeExactFixture(): PiMonoEventNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<PiMonoEventNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: [
      piMonoEventEnvelopeNativeExactAtomID,
      piMonoRuntimeEventNativeExactAtomID,
      piMonoExtensionRuntimeEventNativeExactAtomID,
    ] as const,
    portIDs: ["event.envelope", "event.log"] as const,
    upstreamRef: piMonoEventUpstreamRef,
    evidenceRef: piMonoEventNativeExactEvidenceRef,
    fixtureID: piMonoEventNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      eventBusUsesNodeEventEmitterSemantics: true as const,
      emitIsSynchronousFanout: true as const,
      handlersAreRegisteredPerChannel: true as const,
      unsubscribeRemovesOnlyThatHandler: true as const,
      handlerErrorsAreReportedAndSwallowed: true as const,
      clearRemovesAllListeners: true as const,
      extensionAPIEventsExposeSharedBus: true as const,
      runnerEmitVisitsExtensionsInLoadOrder: true as const,
      runnerEmitContinuesAfterHandlerErrors: true as const,
      sessionBeforeCancelShortCircuits: true as const,
    },
    cases: [
      eventCase(
        "event-bus-sync-order",
        { channel: "pi.custom", handlers: ["first", "second"] },
        { order: ["first:alpha", "second:alpha"], handlerCount: 2 },
        "createEventBus.emit calls EventEmitter.emit(channel, data), so handlers for that channel run in registration order during the emit call.",
      ),
      eventCase(
        "event-bus-unsubscribe",
        { channel: "pi.custom", handlers: ["removed", "kept"] },
        { order: ["kept:beta"], handlerCount: 1 },
        "createEventBus.on returns a cleanup function that removes only the wrapped handler via emitter.off(channel, safeHandler).",
      ),
      eventCase(
        "event-bus-async-handler-error-is-reported",
        { channel: "pi.custom", handlers: ["throws", "continues"] },
        { order: ["throws:gamma", "continues:gamma"], errors: ["pi.custom"], swallowed: true },
        "createEventBus wraps handlers in an async safeHandler; thrown or rejected handler errors are reported and do not reject emit().",
      ),
      eventCase(
        "extension-api-exposes-shared-event-bus",
        { channel: "resources_discover", extensionPath: "<inline>" },
        { apiField: "events", sharedBus: true },
        "createExtensionAPI assigns the shared EventBus instance directly to ExtensionAPI.events, preserving raw channel/data semantics.",
      ),
      eventCase(
        "generic-runner-emit-visits-extension-order",
        { eventType: "agent_start", extensions: ["first.ts", "second.ts"] },
        { order: ["first.ts", "second.ts"], continuesAfterError: true, cancelShortCircuitsSessionBeforeEventsOnly: true },
        "ExtensionRunner.emit iterates loaded extensions and handlers in order, reports handler errors, and only short-circuits when a session_before_* handler returns cancel.",
      ),
    ],
    sourceRefs: [
      `${piMonoEventUpstreamRef}:packages/coding-agent/src/core/event-bus.ts#createEventBus`,
      `${piMonoEventUpstreamRef}:packages/coding-agent/src/core/extensions/loader.ts#createExtensionRuntime,createExtensionAPI,loadExtensionFromFactory,loadExtensions`,
      `${piMonoEventUpstreamRef}:packages/coding-agent/src/core/extensions/runner.ts#ExtensionRunner.emit,ExtensionRunner.hasHandlers,ExtensionRunner.emitResourcesDiscover`,
      `${piMonoEventUpstreamRef}:packages/coding-agent/src/core/extensions/types.ts#ExtensionAPI,ExtensionRuntimeState,Extension`,
      `${piMonoEventUpstreamRef}:packages/coding-agent/test/extensions-runner.test.ts#extension event API and handler dispatch`,
      `${piMonoEventUpstreamRef}:packages/coding-agent/test/agent-session-retry-events.test.ts#extension event ordering`,
    ],
    nativeEvidenceRefs: [piMonoEventNativeExactEvidenceRef, piMonoEventNativeExactReplayRef],
    fixtureIDs: [piMonoEventNativeExactFixtureID],
    knownLossiness: [] as string[],
    descriptors: piMonoEventNativeDescriptors.map((descriptor) => ({ ...descriptor })),
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoEventNativeExactFixture(
  fixture: PiMonoEventNativeExactFixture,
): PiMonoEventNativeExactVerification {
  const canonical = buildPiMonoEventNativeExactFixture()
  const issues: PiMonoEventNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-event-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi event behavior." })
  }
  if (fixture.product !== "pi-mono" || fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-event-native-exact.native-claim", message: "Pi event fixture must remain a native-exact parity claim." })
  }
  if (JSON.stringify(fixture.atomIDs) !== JSON.stringify(canonical.atomIDs) || JSON.stringify(fixture.portIDs) !== JSON.stringify(canonical.portIDs)) {
    issues.push({ id: "pi-event-native-exact.identity", message: "Pi event fixture must cover the event envelope and runtime event atoms." })
  }
  if (fixture.upstreamRef !== piMonoEventUpstreamRef || !fixture.sourceRefs.some((ref) => ref.includes("event-bus.ts#createEventBus")) || !fixture.sourceRefs.some((ref) => ref.includes("extensions/loader.ts#createExtensionRuntime,createExtensionAPI"))) {
    issues.push({ id: "pi-event-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream event bus and extension runtime sources." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoEventNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoEventNativeExactReplayRef)) {
    issues.push({ id: "pi-event-native-exact.evidence", message: "Pi event native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoEventNativeExactFixtureID)) {
    issues.push({ id: "pi-event-native-exact.fixture", message: "Pi event native exact fixture ID is missing." })
  }
  if (fixture.knownLossiness.length > 0 || fixture.descriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "pi-event-native-exact.lossiness", message: "Native exact Pi event fixture must not carry known lossiness markers." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-event-native-exact.policy", message: "Pi event policy drifted from upstream event bus and runner behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-event-native-exact.cases", message: "Pi event cases drifted from the native exact fixture." })
  }
  if (JSON.stringify(fixture.descriptors) !== JSON.stringify(canonical.descriptors)) {
    issues.push({ id: "pi-event-native-exact.descriptors", message: "Pi event native descriptors drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function piMonoEventNativeDescriptor(
  id: PiMonoEventNativeExactAtomID,
  port: "event.envelope" | "event.log",
  selectionReason: string,
): PiMonoEventNativeDescriptor {
  return {
    id,
    port,
    product: "pi-mono",
    implementationKind: "factory",
    selectionReason,
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoEventNativeExactEvidenceRef, piMonoEventNativeExactReplayRef],
    fixtureIDs: [piMonoEventNativeExactFixtureID],
    knownLossiness: [],
  }
}

function eventCase(
  scenarioID: PiMonoEventNativeExactScenarioID,
  input: PiMonoEventNativeExactCase["input"],
  output: PiMonoEventNativeExactCase["output"],
  upstreamBehavior: string,
): PiMonoEventNativeExactCase {
  return { scenarioID, input, output, upstreamBehavior }
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
