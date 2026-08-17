import { createHash } from "node:crypto"

export interface OpenCodeSyncEventDefinition {
  type: string
  version: number
  aggregate: string
  schema: unknown
  properties: unknown
}

export interface OpenCodeSyncEventRecord {
  id: string
  seq: number
  aggregateID: string
  data: Record<string, unknown>
}

export interface OpenCodeSyncEventSerializedEvent extends OpenCodeSyncEventRecord {
  type: string
}

export interface OpenCodeSyncEventSequenceRow {
  seq: number
  ownerID?: string
}

export interface OpenCodeSyncEventPersistedRow {
  id: string
  seq: number
  aggregateID: string
  type: string
  data: Record<string, unknown>
}

export interface OpenCodeSyncEventBusPublish {
  id: string
  type: string
  properties: unknown
}

export interface OpenCodeSyncEventGlobalEvent {
  directory: string
  project: string
  workspace?: string
  payload: {
    id: string
    type: "sync"
    syncEvent: OpenCodeSyncEventSerializedEvent
  }
}

export interface OpenCodeSyncEventState {
  registry: Map<string, OpenCodeSyncEventDefinition>
  versions: Map<string, number>
  projectors?: Map<string, string>
  frozen: boolean
  convertEvent?: (type: string, data: Record<string, unknown>) => unknown
  sequences: Map<string, OpenCodeSyncEventSequenceRow>
  eventRows: OpenCodeSyncEventPersistedRow[]
  projectorCalls: Array<{ projectorID: string; type: string; event: OpenCodeSyncEventRecord }>
  busPublishes: OpenCodeSyncEventBusPublish[]
  globalEvents: OpenCodeSyncEventGlobalEvent[]
}

export interface OpenCodeSyncEventContext {
  directory: string
  project: string
  workspace?: string
}

export interface OpenCodeSyncEventBridgeOptions {
  createID?: () => string
  experimentalWorkspaces?: boolean
  context?: OpenCodeSyncEventContext
}

export interface OpenCodeSyncEventRunResult {
  status: "processed"
  event: OpenCodeSyncEventRecord
}

export interface OpenCodeSyncEventReplayResult {
  status: "processed" | "skipped-old-sequence" | "skipped-owner"
  event: OpenCodeSyncEventSerializedEvent
}

export interface OpenCodeSyncEventBridge {
  createState(): OpenCodeSyncEventState
  define(input: {
    state: OpenCodeSyncEventState
    type: string
    version: number
    aggregate: string
    schema: unknown
    busSchema?: unknown
  }): OpenCodeSyncEventDefinition
  init(input: {
    state: OpenCodeSyncEventState
    projectors: Array<[OpenCodeSyncEventDefinition, string]>
    convertEvent?: (type: string, data: Record<string, unknown>) => unknown
  }): void
  versionedType(type: string, version?: number): string
  run(input: {
    state: OpenCodeSyncEventState
    def: OpenCodeSyncEventDefinition
    data: Record<string, unknown>
    publish?: boolean
  }): OpenCodeSyncEventRunResult
  replay(input: {
    state: OpenCodeSyncEventState
    event: OpenCodeSyncEventSerializedEvent
    publish?: boolean
    ownerID?: string
  }): OpenCodeSyncEventReplayResult
  replayAll(input: {
    state: OpenCodeSyncEventState
    events: OpenCodeSyncEventSerializedEvent[]
    publish?: boolean
    ownerID?: string
  }): string | undefined
  remove(state: OpenCodeSyncEventState, aggregateID: string): void
  claim(state: OpenCodeSyncEventState, aggregateID: string, ownerID: string): void
}

export interface OpenCodeSyncEventLogNativeExactFixtureCase {
  id:
    | "define-bus-schema-versioned-type-and-freeze"
    | "run-projects-persists-and-publishes"
    | "run-errors-for-missing-aggregate-and-old-version"
    | "replay-sequence-owner-and-replay-all-rules"
    | "remove-and-claim-update-sequence-state"
  actual: unknown
  expected: unknown
}

export interface OpenCodeSyncEventLogNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.event.syncevent-bridge"
  portID: "event.log"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-sync-event-log-native-exact-fixture"
  replayRef: "sync-event-log-native-exact:opencode"
  fixtureID: "opencode-sync-event-log:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeSyncEventLogNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeSyncEventLogNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeSyncEventLogNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeSyncEventLogNativeExactFixtureIssue[]
}

export function createOpenCodeSyncEventLogBridge(options: OpenCodeSyncEventBridgeOptions = {}): OpenCodeSyncEventBridge {
  const createID = options.createID ?? (() => "evt_generated")
  const experimentalWorkspaces = options.experimentalWorkspaces ?? true
  const context = options.context ?? { directory: "/repo", project: "project_123", workspace: "workspace_123" }

  const versionedType = (type: string, version?: number) => version ? `${type}.${version}` : type

  function register(state: OpenCodeSyncEventState, def: OpenCodeSyncEventDefinition) {
    state.versions.set(def.type, Math.max(def.version, state.versions.get(def.type) ?? 0))
    state.registry.set(versionedType(def.type, def.version), def)
  }

  function process(
    state: OpenCodeSyncEventState,
    def: OpenCodeSyncEventDefinition,
    event: OpenCodeSyncEventRecord,
    publish: boolean,
    ownerID?: string,
  ) {
    if (!state.projectors) throw new Error("No projectors available. Call `SyncEvent.init` to install projectors")
    const key = versionedType(def.type, def.version)
    const projectorID = state.projectors.get(key)
    if (!projectorID) {
      if (!def.type.includes("next")) throw new Error(`Projector not found for event: ${def.type}`)
      return
    }

    state.projectorCalls.push({ projectorID, type: key, event: cloneForFixture(event) })

    if (experimentalWorkspaces) {
      state.sequences.set(event.aggregateID, {
        seq: event.seq,
        ...(ownerID !== undefined ? { ownerID } : {}),
      })
      state.eventRows.push({
        id: event.id,
        seq: event.seq,
        aggregateID: event.aggregateID,
        type: key,
        data: cloneForFixture(event.data),
      })
    }

    if (!publish) return
    const converted = state.convertEvent ? state.convertEvent(def.type, event.data) : event.data
    state.busPublishes.push({
      id: event.id,
      type: def.type,
      properties: cloneForFixture(converted),
    })
    const syncEvent: OpenCodeSyncEventSerializedEvent = {
      type: key,
      ...cloneForFixture(event),
    }
    state.globalEvents.push({
      directory: context.directory,
      project: context.project,
      ...(context.workspace !== undefined ? { workspace: context.workspace } : {}),
      payload: {
        id: event.id,
        type: "sync",
        syncEvent,
      },
    })
  }

  const replayEvent: OpenCodeSyncEventBridge["replay"] = (input) => {
    const def = input.state.registry.get(input.event.type)
    if (!def) throw new Error(`Unknown event type: ${input.event.type}`)

    const row = input.state.sequences.get(input.event.aggregateID)
    const latest = row?.seq ?? -1
    if (input.event.seq <= latest) return { status: "skipped-old-sequence", event: cloneForFixture(input.event) }
    if (row?.ownerID && row.ownerID !== input.ownerID) return { status: "skipped-owner", event: cloneForFixture(input.event) }

    const expected = latest + 1
    if (input.event.seq !== expected) {
      throw new Error(`Sequence mismatch for aggregate "${input.event.aggregateID}": expected ${expected}, got ${input.event.seq}`)
    }

    const { type: _type, ...event } = input.event
    process(input.state, def, event, !!input.publish, input.ownerID)
    return { status: "processed", event: cloneForFixture(input.event) }
  }

  return {
    createState() {
      return {
        registry: new Map<string, OpenCodeSyncEventDefinition>(),
        versions: new Map<string, number>(),
        frozen: false,
        sequences: new Map<string, OpenCodeSyncEventSequenceRow>(),
        eventRows: [],
        projectorCalls: [],
        busPublishes: [],
        globalEvents: [],
      }
    },
    define(input) {
      if (input.state.frozen) throw new Error("Error defining sync event: sync system has been frozen")
      const def = {
        type: input.type,
        version: input.version,
        aggregate: input.aggregate,
        schema: input.schema,
        properties: input.busSchema ?? input.schema,
      }
      register(input.state, def)
      return def
    },
    init(input) {
      input.state.projectors = new Map(input.projectors.map(([def, projectorID]) => [versionedType(def.type, def.version), projectorID]))
      input.state.frozen = true
      input.state.convertEvent = input.convertEvent ?? ((_type, data) => data)
    },
    versionedType,
    run(input) {
      const aggregate = input.data[input.def.aggregate]
      if (aggregate == null) {
        throw new Error(`SyncEvent.run: "${input.def.aggregate}" required but not found: ${JSON.stringify(input.data)}`)
      }
      if (input.def.version !== input.state.versions.get(input.def.type)) {
        throw new Error(`SyncEvent.run: running old versions of events is not allowed: ${input.def.type}`)
      }
      const row = input.state.sequences.get(String(aggregate))
      const event = {
        id: createID(),
        seq: row?.seq != null ? row.seq + 1 : 0,
        aggregateID: String(aggregate),
        data: cloneForFixture(input.data),
      }
      process(input.state, input.def, event, input.publish ?? true)
      return { status: "processed", event: cloneForFixture(event) }
    },
    replay: replayEvent,
    replayAll(input) {
      const first = input.events[0]
      if (!first) return undefined
      const source = first.aggregateID
      if (input.events.some((item) => item.aggregateID !== source)) throw new Error("Replay events must belong to the same session")
      const start = first.seq
      for (const [index, item] of input.events.entries()) {
        const seq = start + index
        if (item.seq !== seq) throw new Error(`Replay sequence mismatch at index ${index}: expected ${seq}, got ${item.seq}`)
      }
      for (const event of input.events) {
        replayEvent({
          state: input.state,
          event,
          ...(input.publish !== undefined ? { publish: input.publish } : {}),
          ...(input.ownerID !== undefined ? { ownerID: input.ownerID } : {}),
        })
      }
      return source
    },
    remove(state, aggregateID) {
      state.sequences.delete(aggregateID)
      state.eventRows = state.eventRows.filter((row) => row.aggregateID !== aggregateID)
    },
    claim(state, aggregateID, ownerID) {
      const current = state.sequences.get(aggregateID) ?? { seq: -1 }
      state.sequences.set(aggregateID, { ...current, ownerID })
    },
  }
}

export function captureOpenCodeSyncEventLogNativeExactFixture(): OpenCodeSyncEventLogNativeExactFixture {
  const ids = ["evt_run_001", "evt_replay_ignored"]
  const bridge = createOpenCodeSyncEventLogBridge({ createID: () => ids.shift() ?? "evt_extra" })
  const cases: OpenCodeSyncEventLogNativeExactFixtureCase[] = []

  const defineState = bridge.createState()
  const sessionUpdated = bridge.define({
    state: defineState,
    type: "session.updated",
    version: 1,
    aggregate: "sessionID",
    schema: { fields: ["sessionID", "info"] },
    busSchema: { fields: ["id", "version", "time"] },
  })
  bridge.init({ state: defineState, projectors: [[sessionUpdated, "project-session-updated"]] })
  let frozenError: string | undefined
  try {
    bridge.define({ state: defineState, type: "late.event", version: 1, aggregate: "sessionID", schema: {} })
  } catch (error) {
    frozenError = error instanceof Error ? error.message : String(error)
  }
  cases.push({
    id: "define-bus-schema-versioned-type-and-freeze",
    actual: {
      definition: sessionUpdated,
      versionedType: bridge.versionedType("session.updated", 1),
      registryKeys: [...defineState.registry.keys()],
      versions: Object.fromEntries(defineState.versions),
      frozenError,
    },
    expected: {
      definition: {
        type: "session.updated",
        version: 1,
        aggregate: "sessionID",
        schema: { fields: ["sessionID", "info"] },
        properties: { fields: ["id", "version", "time"] },
      },
      versionedType: "session.updated.1",
      registryKeys: ["session.updated.1"],
      versions: { "session.updated": 1 },
      frozenError: "Error defining sync event: sync system has been frozen",
    },
  })

  const runState = bridge.createState()
  const messageUpdated = bridge.define({
    state: runState,
    type: "message.updated",
    version: 1,
    aggregate: "sessionID",
    schema: { fields: ["sessionID", "info"] },
  })
  bridge.init({
    state: runState,
    projectors: [[messageUpdated, "project-message-updated"]],
    convertEvent: (_type, data) => ({ sessionID: data.sessionID, projected: true }),
  })
  const runActual = bridge.run({
    state: runState,
    def: messageUpdated,
    data: { sessionID: "ses_1", info: { id: "msg_1", role: "assistant" } },
  })
  cases.push({
    id: "run-projects-persists-and-publishes",
    actual: {
      result: runActual,
      sequences: mapToRecord(runState.sequences),
      eventRows: runState.eventRows,
      projectorCalls: runState.projectorCalls,
      busPublishes: runState.busPublishes,
      globalEvents: runState.globalEvents,
    },
    expected: {
      result: {
        status: "processed",
        event: {
          id: "evt_run_001",
          seq: 0,
          aggregateID: "ses_1",
          data: { sessionID: "ses_1", info: { id: "msg_1", role: "assistant" } },
        },
      },
      sequences: { ses_1: { seq: 0 } },
      eventRows: [
        {
          id: "evt_run_001",
          seq: 0,
          aggregateID: "ses_1",
          type: "message.updated.1",
          data: { sessionID: "ses_1", info: { id: "msg_1", role: "assistant" } },
        },
      ],
      projectorCalls: [
        {
          projectorID: "project-message-updated",
          type: "message.updated.1",
          event: {
            id: "evt_run_001",
            seq: 0,
            aggregateID: "ses_1",
            data: { sessionID: "ses_1", info: { id: "msg_1", role: "assistant" } },
          },
        },
      ],
      busPublishes: [
        {
          id: "evt_run_001",
          type: "message.updated",
          properties: { sessionID: "ses_1", projected: true },
        },
      ],
      globalEvents: [
        {
          directory: "/repo",
          project: "project_123",
          workspace: "workspace_123",
          payload: {
            id: "evt_run_001",
            type: "sync",
            syncEvent: {
              type: "message.updated.1",
              id: "evt_run_001",
              seq: 0,
              aggregateID: "ses_1",
              data: { sessionID: "ses_1", info: { id: "msg_1", role: "assistant" } },
            },
          },
        },
      ],
    },
  })

  const errorState = bridge.createState()
  const oldVersion = bridge.define({ state: errorState, type: "session.created", version: 1, aggregate: "sessionID", schema: {} })
  const newVersion = bridge.define({ state: errorState, type: "session.created", version: 2, aggregate: "sessionID", schema: {} })
  bridge.init({ state: errorState, projectors: [[oldVersion, "v1"], [newVersion, "v2"]] })
  cases.push({
    id: "run-errors-for-missing-aggregate-and-old-version",
    actual: {
      missingAggregate: captureError(() => bridge.run({ state: errorState, def: newVersion, data: { info: {} } })),
      oldVersion: captureError(() => bridge.run({ state: errorState, def: oldVersion, data: { sessionID: "ses_2" } })),
    },
    expected: {
      missingAggregate: 'SyncEvent.run: "sessionID" required but not found: {"info":{}}',
      oldVersion: "SyncEvent.run: running old versions of events is not allowed: session.created",
    },
  })

  const replayState = bridge.createState()
  const replayDef = bridge.define({ state: replayState, type: "message.removed", version: 1, aggregate: "sessionID", schema: {} })
  bridge.init({ state: replayState, projectors: [[replayDef, "project-message-removed"]] })
  const sequenceMismatch = captureError(() =>
    bridge.replay({
      state: replayState,
      event: { type: "message.removed.1", id: "evt_bad", seq: 2, aggregateID: "ses_replay", data: { sessionID: "ses_replay" } },
      publish: true,
    }),
  )
  bridge.claim(replayState, "ses_claimed", "owner_a")
  const ownerSkip = bridge.replay({
    state: replayState,
    event: { type: "message.removed.1", id: "evt_owner", seq: 0, aggregateID: "ses_claimed", data: { sessionID: "ses_claimed" } },
    ownerID: "owner_b",
    publish: true,
  })
  const replayAllMixed = captureError(() =>
    bridge.replayAll({
      state: replayState,
      events: [
        { type: "message.removed.1", id: "evt_a", seq: 0, aggregateID: "ses_a", data: { sessionID: "ses_a" } },
        { type: "message.removed.1", id: "evt_b", seq: 1, aggregateID: "ses_b", data: { sessionID: "ses_b" } },
      ],
    }),
  )
  const replayAllGap = captureError(() =>
    bridge.replayAll({
      state: replayState,
      events: [
        { type: "message.removed.1", id: "evt_a", seq: 0, aggregateID: "ses_a", data: { sessionID: "ses_a" } },
        { type: "message.removed.1", id: "evt_c", seq: 2, aggregateID: "ses_a", data: { sessionID: "ses_a" } },
      ],
    }),
  )
  const replayAllEmpty = bridge.replayAll({ state: replayState, events: [] })
  cases.push({
    id: "replay-sequence-owner-and-replay-all-rules",
    actual: {
      sequenceMismatch,
      ownerSkip,
      replayAllMixed,
      replayAllGap,
      replayAllEmpty,
    },
    expected: {
      sequenceMismatch: 'Sequence mismatch for aggregate "ses_replay": expected 0, got 2',
      ownerSkip: {
        status: "skipped-owner",
        event: { type: "message.removed.1", id: "evt_owner", seq: 0, aggregateID: "ses_claimed", data: { sessionID: "ses_claimed" } },
      },
      replayAllMixed: "Replay events must belong to the same session",
      replayAllGap: "Replay sequence mismatch at index 1: expected 1, got 2",
      replayAllEmpty: undefined,
    },
  })

  const removeState = bridge.createState()
  removeState.sequences.set("ses_remove", { seq: 3 })
  removeState.eventRows.push(
    { id: "evt_keep", seq: 0, aggregateID: "ses_keep", type: "message.updated.1", data: {} },
    { id: "evt_remove", seq: 3, aggregateID: "ses_remove", type: "message.updated.1", data: {} },
  )
  bridge.claim(removeState, "ses_keep", "owner_keep")
  bridge.remove(removeState, "ses_remove")
  cases.push({
    id: "remove-and-claim-update-sequence-state",
    actual: {
      sequences: mapToRecord(removeState.sequences),
      eventRows: removeState.eventRows,
    },
    expected: {
      sequences: { ses_keep: { seq: -1, ownerID: "owner_keep" } },
      eventRows: [
        { id: "evt_keep", seq: 0, aggregateID: "ses_keep", type: "message.updated.1", data: {} },
      ],
    },
  })

  const fixtureWithoutFingerprint: Omit<OpenCodeSyncEventLogNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.event.syncevent-bridge",
    portID: "event.log",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-sync-event-log-native-exact-fixture",
    replayRef: "sync-event-log-native-exact:opencode",
    fixtureID: "opencode-sync-event-log:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/sync/index.ts#define,init,run,replay,replayAll,remove,claim,process",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/sync/event.sql.ts#EventSequenceTable,EventTable",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/session.ts#Session.Event",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/session/message-v2.ts#MessageV2.Event",
    ],
    cases,
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeSyncEventLogNativeExactFixture(
  fixture: OpenCodeSyncEventLogNativeExactFixture,
): OpenCodeSyncEventLogNativeExactFixtureVerification {
  const issues: OpenCodeSyncEventLogNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeSyncEventLogNativeExactFixtureCase["id"][] = [
    "define-bus-schema-versioned-type-and-freeze",
    "run-projects-persists-and-publishes",
    "run-errors-for-missing-aggregate-and-old-version",
    "replay-sequence-owner-and-replay-all-rules",
    "remove-and-claim-update-sequence-state",
  ]
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })

  if (fixture.schemaVersion !== 1) add("opencode-sync-event-log.schema", "Fixture must use schema version 1.")
  if (fixture.product !== "opencode" || fixture.atomID !== "opencode.event.syncevent-bridge" || fixture.portID !== "event.log") {
    add("opencode-sync-event-log.target", "Fixture must target opencode.event.syncevent-bridge and event.log.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-sync-event-log.native-claim", "SyncEvent fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-sync-event-log.lossiness", "Native SyncEvent fixture cannot retain known lossiness.")
  for (const source of ["packages/opencode/src/sync/index.ts", "packages/opencode/src/sync/event.sql.ts", "packages/opencode/src/session/session.ts", "packages/opencode/src/session/message-v2.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-sync-event-log.source-ref", `Missing source ref ${source}.`)
  }
  for (const expectedID of expectedCaseIDs) {
    const item = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!item) {
      add("opencode-sync-event-log.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (!sameJSON(item.actual, item.expected)) add("opencode-sync-event-log.case", "Case actual output must match expected OpenCode SyncEvent behavior.", item.id)
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) add("opencode-sync-event-log.fingerprint", "Fixture fingerprint must match canonical content.")
  return { ok: issues.length === 0, issues }
}

function captureError(fn: () => unknown): string | undefined {
  try {
    fn()
    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

function mapToRecord<T>(map: Map<string, T>): Record<string, T> {
  return Object.fromEntries([...map.entries()].sort(([left], [right]) => left.localeCompare(right)))
}

function cloneForFixture<T>(input: T): T {
  return JSON.parse(JSON.stringify(input)) as T
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
}

function fingerprintObject(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === undefined) return "undefined"
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
