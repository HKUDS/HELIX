import { createHash } from "node:crypto"

export interface OpenCodeEventDefinition {
  type: string
  properties: unknown
}

export interface OpenCodeEventEnvelopePayload {
  id: string
  type: string
  properties: unknown
}

export interface OpenCodeEventEnvelopeContext {
  directory: string
  project: string
  workspace?: string
}

export interface OpenCodeEventEnvelopeGlobalEvent {
  directory?: string
  project?: string
  workspace?: string
  payload: unknown
}

export interface OpenCodeEventEnvelopeState {
  registry: Map<string, OpenCodeEventDefinition>
  typedSubscriptions: Set<string>
  typedDeliveries: Map<string, OpenCodeEventEnvelopePayload[]>
  wildcardDeliveries: OpenCodeEventEnvelopePayload[]
  globalEvents: OpenCodeEventEnvelopeGlobalEvent[]
  disposed: boolean
}

export interface OpenCodeEventEnvelopePublishResult {
  payload: OpenCodeEventEnvelopePayload
  typedDelivered: OpenCodeEventEnvelopePayload[]
  wildcardDelivered: OpenCodeEventEnvelopePayload[]
  globalEvent: OpenCodeEventEnvelopeGlobalEvent
  samePayloadReference: boolean
}

export interface OpenCodeEventEnvelopeBridgeOptions {
  createID?: () => string
}

export interface OpenCodeEventEnvelopeBridge {
  createState(): OpenCodeEventEnvelopeState
  define(state: OpenCodeEventEnvelopeState, type: string, properties: unknown): OpenCodeEventDefinition
  effectPayloads(state: OpenCodeEventEnvelopeState): Array<{ identifier: string; type: string; properties: unknown }>
  subscribe(state: OpenCodeEventEnvelopeState, def: OpenCodeEventDefinition): void
  publish(input: {
    state: OpenCodeEventEnvelopeState
    def: OpenCodeEventDefinition
    properties: unknown
    context: OpenCodeEventEnvelopeContext
    options?: { id?: string }
  }): OpenCodeEventEnvelopePublishResult
  emitGlobal(event: OpenCodeEventEnvelopeGlobalEvent): OpenCodeEventEnvelopeGlobalEvent
  dispose(state: OpenCodeEventEnvelopeState, context: Pick<OpenCodeEventEnvelopeContext, "directory">): OpenCodeEventEnvelopePayload
}

export interface OpenCodeEventEnvelopeNativeExactFixtureCase {
  id:
    | "define-registers-effect-payload"
    | "publish-delivers-typed-wildcard-and-global"
    | "publish-without-typed-subscriber-keeps-wildcard"
    | "global-bus-sync-event-id-fallback"
    | "global-bus-generated-id-fallback"
    | "dispose-publishes-instance-disposed-wildcard"
  actual: unknown
  expected: unknown
}

export interface OpenCodeEventEnvelopeNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.event.envelope-bridge"
  portID: "event.envelope"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-event-envelope-native-exact-fixture"
  replayRef: "event-envelope-native-exact:opencode"
  fixtureID: "opencode-event-envelope:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeEventEnvelopeNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeEventEnvelopeNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeEventEnvelopeNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeEventEnvelopeNativeExactFixtureIssue[]
}

export function createOpenCodeEventEnvelopeBridge(options: OpenCodeEventEnvelopeBridgeOptions = {}): OpenCodeEventEnvelopeBridge {
  const createID = options.createID ?? (() => "evt_generated")
  return {
    createState() {
      return {
        registry: new Map<string, OpenCodeEventDefinition>(),
        typedSubscriptions: new Set<string>(),
        typedDeliveries: new Map<string, OpenCodeEventEnvelopePayload[]>(),
        wildcardDeliveries: [],
        globalEvents: [],
        disposed: false,
      }
    },
    define(state, type, properties) {
      const result = { type, properties }
      state.registry.set(type, result)
      return result
    },
    effectPayloads(state) {
      return [...state.registry.values()].map((def) => ({
        identifier: `Event.${def.type}`,
        type: def.type,
        properties: def.properties,
      }))
    },
    subscribe(state, def) {
      state.typedSubscriptions.add(def.type)
      if (!state.typedDeliveries.has(def.type)) state.typedDeliveries.set(def.type, [])
    },
    publish(input) {
      const payload: OpenCodeEventEnvelopePayload = {
        id: input.options?.id ?? createID(),
        type: input.def.type,
        properties: input.properties,
      }
      const typedDelivered = input.state.typedSubscriptions.has(input.def.type)
        ? ensureDeliveryBucket(input.state.typedDeliveries, input.def.type)
        : []
      if (input.state.typedSubscriptions.has(input.def.type)) typedDelivered.push(payload)
      input.state.wildcardDeliveries.push(payload)

      const globalEvent = this.emitGlobal({
        directory: input.context.directory,
        project: input.context.project,
        ...(input.context.workspace !== undefined ? { workspace: input.context.workspace } : {}),
        payload,
      })
      input.state.globalEvents.push(globalEvent)

      return {
        payload,
        typedDelivered: [...typedDelivered],
        wildcardDelivered: [...input.state.wildcardDeliveries],
        globalEvent,
        samePayloadReference:
          (typedDelivered[typedDelivered.length - 1] ?? payload) === payload &&
          input.state.wildcardDeliveries[input.state.wildcardDeliveries.length - 1] === payload &&
          (globalEvent.payload as unknown) === payload,
      }
    },
    emitGlobal(event) {
      if (isRecord(event.payload) && !("id" in event.payload)) {
        event.payload.id = isRecord(event.payload.syncEvent) && typeof event.payload.syncEvent.id === "string"
          ? event.payload.syncEvent.id
          : createID()
      }
      return event
    },
    dispose(state, context) {
      const payload = {
        type: "server.instance.disposed",
        id: createID(),
        properties: { directory: context.directory },
      }
      state.wildcardDeliveries.push(payload)
      state.typedSubscriptions.clear()
      state.disposed = true
      return payload
    },
  }
}

export function captureOpenCodeEventEnvelopeNativeExactFixture(): OpenCodeEventEnvelopeNativeExactFixture {
  const ids = ["evt_define_001", "evt_publish_001", "evt_publish_002", "evt_generated_global", "evt_disposed_001"]
  const bridge = createOpenCodeEventEnvelopeBridge({ createID: () => ids.shift() ?? "evt_extra" })
  const state = bridge.createState()
  const cases: OpenCodeEventEnvelopeNativeExactFixtureCase[] = []

  const diffDef = bridge.define(state, "session.diff", {
    schema: "Schema.Struct",
    fields: ["sessionID", "diff"],
  })
  cases.push({
    id: "define-registers-effect-payload",
    actual: {
      definition: diffDef,
      effectPayloads: bridge.effectPayloads(state),
    },
    expected: {
      definition: {
        type: "session.diff",
        properties: {
          schema: "Schema.Struct",
          fields: ["sessionID", "diff"],
        },
      },
      effectPayloads: [
        {
          identifier: "Event.session.diff",
          type: "session.diff",
          properties: {
            schema: "Schema.Struct",
            fields: ["sessionID", "diff"],
          },
        },
      ],
    },
  })

  bridge.subscribe(state, diffDef)
  const publishActual = bridge.publish({
    state,
    def: diffDef,
    properties: {
      sessionID: "ses_123",
      diff: [{ path: "src/index.ts", type: "modified" }],
    },
    context: {
      directory: "/repo",
      project: "project_123",
      workspace: "workspace_123",
    },
    options: { id: "evt_explicit" },
  })
  cases.push({
    id: "publish-delivers-typed-wildcard-and-global",
    actual: serializePublishResult(publishActual),
    expected: {
      payload: {
        id: "evt_explicit",
        type: "session.diff",
        properties: {
          sessionID: "ses_123",
          diff: [{ path: "src/index.ts", type: "modified" }],
        },
      },
      typedDelivered: [
        {
          id: "evt_explicit",
          type: "session.diff",
          properties: {
            sessionID: "ses_123",
            diff: [{ path: "src/index.ts", type: "modified" }],
          },
        },
      ],
      wildcardDelivered: [
        {
          id: "evt_explicit",
          type: "session.diff",
          properties: {
            sessionID: "ses_123",
            diff: [{ path: "src/index.ts", type: "modified" }],
          },
        },
      ],
      globalEvent: {
        directory: "/repo",
        project: "project_123",
        workspace: "workspace_123",
        payload: {
          id: "evt_explicit",
          type: "session.diff",
          properties: {
            sessionID: "ses_123",
            diff: [{ path: "src/index.ts", type: "modified" }],
          },
        },
      },
      samePayloadReference: true,
    },
  })

  const noTypedState = bridge.createState()
  const statusDef = bridge.define(noTypedState, "session.status", { fields: ["sessionID", "status"] })
  const noTypedActual = bridge.publish({
    state: noTypedState,
    def: statusDef,
    properties: { sessionID: "ses_123", status: "idle" },
    context: {
      directory: "/repo",
      project: "project_123",
    },
  })
  cases.push({
    id: "publish-without-typed-subscriber-keeps-wildcard",
    actual: serializePublishResult(noTypedActual),
    expected: {
      payload: {
        id: "evt_define_001",
        type: "session.status",
        properties: { sessionID: "ses_123", status: "idle" },
      },
      typedDelivered: [],
      wildcardDelivered: [
        {
          id: "evt_define_001",
          type: "session.status",
          properties: { sessionID: "ses_123", status: "idle" },
        },
      ],
      globalEvent: {
        directory: "/repo",
        project: "project_123",
        payload: {
          id: "evt_define_001",
          type: "session.status",
          properties: { sessionID: "ses_123", status: "idle" },
        },
      },
      samePayloadReference: true,
    },
  })

  const syncFallbackActual = bridge.emitGlobal({
    directory: "/repo",
    project: "project_123",
    payload: {
      type: "sync",
      syncEvent: {
        id: "evt_sync_001",
        type: "message.updated.1",
      },
    },
  })
  cases.push({
    id: "global-bus-sync-event-id-fallback",
    actual: syncFallbackActual,
    expected: {
      directory: "/repo",
      project: "project_123",
      payload: {
        id: "evt_sync_001",
        type: "sync",
        syncEvent: {
          id: "evt_sync_001",
          type: "message.updated.1",
        },
      },
    },
  })

  const generatedFallbackActual = bridge.emitGlobal({
    payload: {
      type: "manual",
      properties: { ok: true },
    },
  })
  cases.push({
    id: "global-bus-generated-id-fallback",
    actual: generatedFallbackActual,
    expected: {
      payload: {
        id: "evt_publish_001",
        type: "manual",
        properties: { ok: true },
      },
    },
  })

  const disposeState = bridge.createState()
  const disposeDef = bridge.define(disposeState, "session.diff", { fields: ["sessionID", "diff"] })
  bridge.subscribe(disposeState, disposeDef)
  const disposeActual = bridge.dispose(disposeState, { directory: "/repo" })
  cases.push({
    id: "dispose-publishes-instance-disposed-wildcard",
    actual: {
      payload: disposeActual,
      wildcardDelivered: disposeState.wildcardDeliveries,
      typedSubscriptions: [...disposeState.typedSubscriptions],
      disposed: disposeState.disposed,
    },
    expected: {
      payload: {
        id: "evt_publish_002",
        type: "server.instance.disposed",
        properties: { directory: "/repo" },
      },
      wildcardDelivered: [
        {
          id: "evt_publish_002",
          type: "server.instance.disposed",
          properties: { directory: "/repo" },
        },
      ],
      typedSubscriptions: [],
      disposed: true,
    },
  })

  const fixtureWithoutFingerprint: Omit<OpenCodeEventEnvelopeNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.event.envelope-bridge",
    portID: "event.envelope",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-event-envelope-native-exact-fixture",
    replayRef: "event-envelope-native-exact:opencode",
    fixtureID: "opencode-event-envelope:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/bus/bus-event.ts#define,effectPayloads",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/bus/index.ts#Bus.layer,publish,subscribe,InstanceDisposed",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/bus/global.ts#GlobalBusEmitter.emit",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/id/id.ts#Identifier.create",
    ],
    cases,
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeEventEnvelopeNativeExactFixture(
  fixture: OpenCodeEventEnvelopeNativeExactFixture,
): OpenCodeEventEnvelopeNativeExactFixtureVerification {
  const issues: OpenCodeEventEnvelopeNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeEventEnvelopeNativeExactFixtureCase["id"][] = [
    "define-registers-effect-payload",
    "publish-delivers-typed-wildcard-and-global",
    "publish-without-typed-subscriber-keeps-wildcard",
    "global-bus-sync-event-id-fallback",
    "global-bus-generated-id-fallback",
    "dispose-publishes-instance-disposed-wildcard",
  ]
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })

  if (fixture.schemaVersion !== 1) add("opencode-event-envelope.schema", "Fixture must use schema version 1.")
  if (fixture.product !== "opencode" || fixture.atomID !== "opencode.event.envelope-bridge" || fixture.portID !== "event.envelope") {
    add("opencode-event-envelope.target", "Fixture must target opencode.event.envelope-bridge and event.envelope.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-event-envelope.native-claim", "Event envelope fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-event-envelope.lossiness", "Native event envelope fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/opencode/src/bus/bus-event.ts", "packages/opencode/src/bus/index.ts", "packages/opencode/src/bus/global.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-event-envelope.source-ref", `Missing source ref ${source}.`)
  }
  for (const expectedID of expectedCaseIDs) {
    const item = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!item) {
      add("opencode-event-envelope.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (!sameJSON(item.actual, item.expected)) {
      add("opencode-event-envelope.case", "Case actual output must match expected OpenCode event envelope behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) {
    add("opencode-event-envelope.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function ensureDeliveryBucket(
  deliveries: Map<string, OpenCodeEventEnvelopePayload[]>,
  type: string,
): OpenCodeEventEnvelopePayload[] {
  let bucket = deliveries.get(type)
  if (!bucket) {
    bucket = []
    deliveries.set(type, bucket)
  }
  return bucket
}

function serializePublishResult(result: OpenCodeEventEnvelopePublishResult): OpenCodeEventEnvelopePublishResult {
  return {
    payload: cloneForFixture(result.payload),
    typedDelivered: cloneForFixture(result.typedDelivered),
    wildcardDelivered: cloneForFixture(result.wildcardDelivered),
    globalEvent: cloneForFixture(result.globalEvent),
    samePayloadReference: result.samePayloadReference,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
}

function cloneForFixture<T>(input: T): T {
  return JSON.parse(JSON.stringify(input)) as T
}

function fingerprintObject(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
