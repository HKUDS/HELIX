import { createHash } from "node:crypto"
import {
  encodeOpenCodeDateTimesProjection,
  openCodeSessionSyncEventDefinitionsProjection,
  openCodeSessionUpstreamRef,
  projectOpenCodeSessionMessageRowProjection,
  type OpenCodeSessionMessageRowProjection,
} from "./session.ts"

export const openCodeEventUpstreamRef = openCodeSessionUpstreamRef
export const openCodeEventNativeExactFixtureID = "opencode-event:native-exact-fixture" as const
export const openCodeEventNativeExactEvidenceRef = "conformance:opencode-event-native-exact-fixture" as const
export const openCodeEventNativeExactReplayRef = "event-native-exact:opencode" as const
export const openCodeEventEnvelopeNativeExactAtomID = "opencode.event.envelope-bridge" as const
export const openCodeEventSyncEventBridgeNativeExactAtomID = "opencode.event.syncevent-bridge" as const

export const openCodeEventNativeExactAtomIDs = [
  openCodeEventEnvelopeNativeExactAtomID,
  openCodeEventSyncEventBridgeNativeExactAtomID,
] as const

export type OpenCodeEventNativeExactAtomID = (typeof openCodeEventNativeExactAtomIDs)[number]
export type OpenCodeEventPortID = "event.envelope" | "event.log"
export type OpenCodeEventDefinitionKind = "sync" | "bus" | "session-next-sync"
export type OpenCodeSessionNextProjectorAction =
  | "append-session-message"
  | "ignore-delta"
  | "update-session-agent-and-append-message"
  | "update-session-model-and-append-message"

export interface OpenCodeEventNativeDescriptor {
  id: OpenCodeEventNativeExactAtomID
  port: OpenCodeEventPortID
  product: "opencode"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof openCodeEventNativeExactEvidenceRef, typeof openCodeEventNativeExactReplayRef]
  fixtureIDs: [typeof openCodeEventNativeExactFixtureID]
  knownLossiness: []
}

export interface OpenCodeEventDefinitionProjection {
  eventType: string
  kind: OpenCodeEventDefinitionKind
  version?: 1
  aggregate?: "sessionID"
  payloadKeys: string[]
  busPayloadKeys?: string[]
  sqliteTables: string[]
  projectorAction: string
  persistsEventRow: boolean
}

export interface OpenCodeSyncEventEnvelopeProjection {
  event: {
    id: string
    seq: number
    aggregateID: string
    data: Record<string, unknown>
  }
  eventTableRow: {
    id: string
    seq: number
    aggregate_id: string
    type: string
    data: Record<string, unknown>
  }
  sequenceRow: {
    aggregate_id: string
    seq: number
    owner_id?: string
  }
  projectBusPublish: {
    definitionType: string
    properties: Record<string, unknown>
    options: { id: string }
  }
  globalBusEnvelope: {
    directory?: string
    project?: string
    workspace?: string
    payload: {
      type: "sync"
      syncEvent: {
        type: string
        id: string
        seq: number
        aggregateID: string
        data: Record<string, unknown>
      }
    }
  }
}

export type OpenCodeEventV2BridgeRoute = {
  route: "sync"
  syncDefinition: {
    type: string
    version: 1
    aggregate: "sessionID"
    schema: "data"
    properties: "data"
  }
  aggregateID: string
  data: Record<string, unknown>
} | {
  route: "bus"
  busDefinition: {
    type: string
    properties: "data"
  }
  globalEnvelope: {
    workspace?: string
    payload: {
      id: string
      type: string
      properties: Record<string, unknown>
    }
  }
}

export interface OpenCodeSessionNextProjectorProjection {
  action: OpenCodeSessionNextProjectorAction
  row?: OpenCodeSessionMessageRowProjection
}

export type OpenCodeEventNativeExactScenarioID =
  | "sync-event-envelope-and-global-payload"
  | "event-v2-bridge-routes-versioned-session-events"
  | "bus-only-part-delta-stays-unpersisted"
  | "projectors-next-session-message-row"
  | "syncevent-definition-registry"

export interface OpenCodeEventNativeExactCase {
  scenarioID: OpenCodeEventNativeExactScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface OpenCodeEventNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomIDs: readonly [
    typeof openCodeEventEnvelopeNativeExactAtomID,
    typeof openCodeEventSyncEventBridgeNativeExactAtomID,
  ]
  portIDs: readonly ["event.envelope", "event.log"]
  upstreamRef: typeof openCodeEventUpstreamRef
  evidenceRef: typeof openCodeEventNativeExactEvidenceRef
  fixtureID: typeof openCodeEventNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    syncEventDefineUsesVersionAggregateSchemaAndBusProperties: true
    syncEventRunRequiresAggregateAndVersionedType: true
    syncEventProcessWritesEventSequenceAndEventRowsWhenWorkspacesEnabled: true
    syncEventProcessPublishesProjectBusAndGlobalSyncEnvelope: true
    eventV2BridgeConvertsVersionedAggregateEventsToSyncDefinitions: true
    eventV2BridgePublishesUnversionedEventsAsBusPayloadProperties: true
    messagePartDeltaIsBusOnlyAndNotSyncPersisted: true
    projectorsNextStripsMessageIdentityAndEncodesDateTimes: true
    projectorsNextIgnoresStreamingDeltaRows: true
  }
  cases: OpenCodeEventNativeExactCase[]
  definitions: OpenCodeEventDefinitionProjection[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly OpenCodeEventNativeDescriptor[]
  intentionallyBridgeAtoms: readonly []
  fingerprint: string
}

export interface OpenCodeEventNativeExactIssue {
  id: string
  message: string
}

export interface OpenCodeEventNativeExactVerification {
  ok: boolean
  issues: OpenCodeEventNativeExactIssue[]
}

export const openCodeEventNativeDescriptors = openCodeEventNativeExactAtomIDs.map((id): OpenCodeEventNativeDescriptor => ({
  id,
  port: id === openCodeEventEnvelopeNativeExactAtomID ? "event.envelope" : "event.log",
  product: "opencode",
  implementationKind: "factory",
  selectionReason: "OpenCode upstream native SyncEvent/EventV2 bridge implementation with native parity complete event envelope, versioned aggregate event log, and projectors-next fixture coverage.",
  parityCoverage: "native",
  nativeEvidenceRefs: [openCodeEventNativeExactEvidenceRef, openCodeEventNativeExactReplayRef],
  fixtureIDs: [openCodeEventNativeExactFixtureID],
  knownLossiness: [],
}))

export const openCodeEventNativeDescriptorByAtomID = Object.fromEntries(
  openCodeEventNativeDescriptors.map((descriptor) => [descriptor.id, descriptor]),
) as Record<OpenCodeEventNativeExactAtomID, OpenCodeEventNativeDescriptor>

const sessionNextProjectorActions = new Map<string, OpenCodeSessionNextProjectorAction>([
  ["session.next.agent.switched", "update-session-agent-and-append-message"],
  ["session.next.model.switched", "update-session-model-and-append-message"],
  ["session.next.text.delta", "ignore-delta"],
  ["session.next.tool.input.delta", "ignore-delta"],
  ["session.next.reasoning.delta", "ignore-delta"],
  ["session.next.compaction.delta", "ignore-delta"],
])

const sessionNextEventTypes = [
  "session.next.agent.switched",
  "session.next.model.switched",
  "session.next.prompted",
  "session.next.synthetic",
  "session.next.shell.started",
  "session.next.shell.ended",
  "session.next.step.started",
  "session.next.step.ended",
  "session.next.step.failed",
  "session.next.text.started",
  "session.next.text.delta",
  "session.next.text.ended",
  "session.next.tool.input.started",
  "session.next.tool.input.delta",
  "session.next.tool.input.ended",
  "session.next.tool.called",
  "session.next.tool.success",
  "session.next.tool.failed",
  "session.next.reasoning.started",
  "session.next.reasoning.delta",
  "session.next.reasoning.ended",
  "session.next.retried",
  "session.next.compaction.started",
  "session.next.compaction.delta",
  "session.next.compaction.ended",
] as const

export function openCodeEventDefinitionRegistryProjection(): OpenCodeEventDefinitionProjection[] {
  const legacySync = openCodeSessionSyncEventDefinitionsProjection().map((event): OpenCodeEventDefinitionProjection => ({
    eventType: event.eventType,
    kind: "sync",
    version: 1,
    aggregate: "sessionID",
    payloadKeys: event.payloadKeys,
    busPayloadKeys: event.eventType === "session.updated" ? ["info", "sessionID"] : event.payloadKeys,
    sqliteTables: event.sqliteTables,
    projectorAction: legacyProjectorAction(event.eventType),
    persistsEventRow: true,
  }))
  return [
    ...legacySync,
    {
      eventType: "session.diff",
      kind: "bus",
      payloadKeys: ["diff", "sessionID"],
      sqliteTables: [],
      projectorAction: "publish-bus-only",
      persistsEventRow: false,
    },
    {
      eventType: "session.error",
      kind: "bus",
      payloadKeys: ["error", "sessionID"],
      sqliteTables: [],
      projectorAction: "publish-bus-only",
      persistsEventRow: false,
    },
    {
      eventType: "message.part.delta",
      kind: "bus",
      payloadKeys: ["delta", "field", "messageID", "partID", "sessionID"],
      sqliteTables: [],
      projectorAction: "publish-bus-only",
      persistsEventRow: false,
    },
    ...sessionNextEventTypes.map((eventType): OpenCodeEventDefinitionProjection => {
      const action = sessionNextProjectorActions.get(eventType) ?? "append-session-message"
      return {
        eventType,
        kind: "session-next-sync",
        version: 1,
        aggregate: "sessionID",
        payloadKeys: ["sessionID"],
        sqliteTables: action === "ignore-delta" ? [] : eventType === "session.next.agent.switched" || eventType === "session.next.model.switched" ? ["session", "session_message"] : ["session_message"],
        projectorAction: action,
        persistsEventRow: true,
      }
    }),
  ]
}

export function openCodeSyncVersionedTypeProjection(type: string, version?: number): string {
  return version ? `${type}.${version}` : type
}

export function openCodeSyncEventEnvelopeProjection(input: {
  id: string
  seq: number
  type: string
  version: 1
  aggregate: "sessionID"
  data: Record<string, unknown>
  ownerID?: string
  directory?: string
  project?: string
  workspace?: string
}): OpenCodeSyncEventEnvelopeProjection {
  const aggregateID = input.data[input.aggregate]
  if (typeof aggregateID !== "string" || aggregateID.length === 0) {
    throw new Error(`SyncEvent.run: "${input.aggregate}" required but not found: ${JSON.stringify(input.data)}`)
  }
  const data = cloneRecord(input.data)
  const versionedType = openCodeSyncVersionedTypeProjection(input.type, input.version)
  const event = {
    id: input.id,
    seq: input.seq,
    aggregateID,
    data,
  }
  return {
    event,
    eventTableRow: {
      id: input.id,
      seq: input.seq,
      aggregate_id: aggregateID,
      type: versionedType,
      data: cloneRecord(input.data),
    },
    sequenceRow: {
      aggregate_id: aggregateID,
      seq: input.seq,
      ...(input.ownerID ? { owner_id: input.ownerID } : {}),
    },
    projectBusPublish: {
      definitionType: input.type,
      properties: cloneRecord(input.data),
      options: { id: input.id },
    },
    globalBusEnvelope: {
      ...(input.directory ? { directory: input.directory } : {}),
      ...(input.project ? { project: input.project } : {}),
      ...(input.workspace ? { workspace: input.workspace } : {}),
      payload: {
        type: "sync",
        syncEvent: {
          type: versionedType,
          ...event,
          data: cloneRecord(input.data),
        },
      },
    },
  }
}

export function openCodeEventV2BridgeProjection(input: {
  id: string
  type: string
  data: Record<string, unknown>
  version?: 1
  aggregate?: "sessionID"
  location?: {
    workspaceID?: string
    directory?: string
  }
}): OpenCodeEventV2BridgeRoute {
  const aggregateID = input.aggregate ? input.data[input.aggregate] : undefined
  if (input.version !== undefined && input.aggregate && typeof aggregateID === "string") {
    return {
      route: "sync",
      syncDefinition: {
        type: input.type,
        version: input.version,
        aggregate: input.aggregate,
        schema: "data",
        properties: "data",
      },
      aggregateID,
      data: cloneRecord(input.data),
    }
  }
  return {
    route: "bus",
    busDefinition: {
      type: input.type,
      properties: "data",
    },
    globalEnvelope: {
      ...(input.location?.workspaceID ? { workspace: input.location.workspaceID } : {}),
      payload: {
        id: input.id,
        type: input.type,
        properties: cloneRecord(input.data),
      },
    },
  }
}

export function openCodeSessionNextProjectorProjection(input: {
  eventID: string
  eventType: string
  sessionID: string
  timeCreated: number
  data: Record<string, unknown>
}): OpenCodeSessionNextProjectorProjection {
  const action = sessionNextProjectorActions.get(input.eventType) ?? "append-session-message"
  if (action === "ignore-delta") return { action }
  return {
    action,
    row: projectOpenCodeSessionMessageRowProjection({
      eventID: input.eventID,
      sessionID: input.sessionID,
      type: input.eventType,
      timeCreated: input.timeCreated,
      data: input.data,
    }),
  }
}

export function buildOpenCodeEventNativeExactFixture(): OpenCodeEventNativeExactFixture {
  const syncEnvelope = openCodeSyncEventEnvelopeProjection({
    id: "evt_001",
    seq: 3,
    type: "message.part.updated",
    version: 1,
    aggregate: "sessionID",
    data: {
      sessionID: "ses_native",
      part: { id: "prt_001", messageID: "msg_001", sessionID: "ses_native", type: "text", text: "hello" },
      time: 1_780_000_000_000,
    },
    ownerID: "owner_1",
    directory: "/repo",
    project: "project_1",
    workspace: "wrk_1",
  })
  const bridgeSync = openCodeEventV2BridgeProjection({
    id: "evt_002",
    type: "session.next.text.ended",
    version: 1,
    aggregate: "sessionID",
    data: { sessionID: "ses_native", messageID: "msg_001", text: "done" },
    location: { workspaceID: "wrk_1", directory: "/repo" },
  })
  const bridgeBus = openCodeEventV2BridgeProjection({
    id: "evt_003",
    type: "message.part.delta",
    data: { sessionID: "ses_native", messageID: "msg_001", partID: "prt_001", field: "text", delta: "hi" },
    location: { workspaceID: "wrk_1", directory: "/repo" },
  })
  const sessionNext = openCodeSessionNextProjectorProjection({
    eventID: "evt_004",
    eventType: "session.next.compaction.ended",
    sessionID: "ses_native",
    timeCreated: 1_780_000_000_100,
    data: {
      id: "drop-id",
      type: "drop-type",
      sessionID: "ses_native",
      text: "summary",
      time: { created: { _tag: "DateTime", epochMillis: 1_780_000_000_100 } },
    },
  })
  const definitions = openCodeEventDefinitionRegistryProjection()
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomIDs: openCodeEventNativeExactAtomIDs,
    portIDs: ["event.envelope", "event.log"] as const,
    upstreamRef: openCodeEventUpstreamRef,
    evidenceRef: openCodeEventNativeExactEvidenceRef,
    fixtureID: openCodeEventNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      syncEventDefineUsesVersionAggregateSchemaAndBusProperties: true as const,
      syncEventRunRequiresAggregateAndVersionedType: true as const,
      syncEventProcessWritesEventSequenceAndEventRowsWhenWorkspacesEnabled: true as const,
      syncEventProcessPublishesProjectBusAndGlobalSyncEnvelope: true as const,
      eventV2BridgeConvertsVersionedAggregateEventsToSyncDefinitions: true as const,
      eventV2BridgePublishesUnversionedEventsAsBusPayloadProperties: true as const,
      messagePartDeltaIsBusOnlyAndNotSyncPersisted: true as const,
      projectorsNextStripsMessageIdentityAndEncodesDateTimes: true as const,
      projectorsNextIgnoresStreamingDeltaRows: true as const,
    },
    cases: [
      eventCase(
        "sync-event-envelope-and-global-payload",
        { type: "message.part.updated", version: 1, aggregate: "sessionID", seq: 3 },
        {
          versionedType: syncEnvelope.eventTableRow.type,
          aggregateID: syncEnvelope.event.aggregateID,
          sequenceRow: syncEnvelope.sequenceRow,
          projectBusType: syncEnvelope.projectBusPublish.definitionType,
          globalPayloadType: syncEnvelope.globalBusEnvelope.payload.type,
          globalSyncEventType: syncEnvelope.globalBusEnvelope.payload.syncEvent.type,
        },
        "SyncEvent.run derives aggregateID from data[aggregate], uses dot-versioned event types, writes EventSequence/Event rows when workspaces are enabled, publishes the unversioned project bus definition, and emits a GlobalBus sync envelope.",
      ),
      eventCase(
        "event-v2-bridge-routes-versioned-session-events",
        { type: "session.next.text.ended", version: 1, aggregate: "sessionID" },
        bridgeSync,
        "EventV2Bridge.toSyncDefinition mirrors type/version/aggregate/data properties for versioned aggregate EventV2 payloads before calling SyncEvent.run.",
      ),
      eventCase(
        "bus-only-part-delta-stays-unpersisted",
        { type: "message.part.delta", version: undefined },
        bridgeBus,
        "MessageV2.Event.PartDelta is a BusEvent, so unversioned payloads publish as { id, type, properties } instead of entering the SyncEvent persisted log.",
      ),
      eventCase(
        "projectors-next-session-message-row",
        { type: "session.next.compaction.ended", eventID: "evt_004" },
        { action: sessionNext.action, row: sessionNext.row },
        "projectors-next stores session.next.* messages in SessionMessageTable, strips id/type from message data, and recursively encodes DateTime values to epoch milliseconds.",
      ),
      eventCase(
        "syncevent-definition-registry",
        { nativeDefinitionCount: definitions.length },
        {
          syncTypes: definitions.filter((definition) => definition.kind === "sync").map((definition) => definition.eventType),
          busTypes: definitions.filter((definition) => definition.kind === "bus").map((definition) => definition.eventType),
          ignoredSessionNextTypes: definitions.filter((definition) => definition.projectorAction === "ignore-delta").map((definition) => definition.eventType),
        },
        "SyncEvent.init registers versioned sync definitions for latest bus schemas, MessageV2 keeps part delta bus-only, and projectors-next installs no-op projectors for streaming delta session.next events.",
      ),
    ],
    definitions,
    sourceRefs: [
      `${openCodeEventUpstreamRef}:packages/opencode/src/sync/index.ts#SyncEvent.define,run,process,versionedType,effectPayloads`,
      `${openCodeEventUpstreamRef}:packages/opencode/src/event-v2-bridge.ts#toSyncDefinition,EventV2Bridge.layer`,
      `${openCodeEventUpstreamRef}:packages/opencode/src/session/session.ts#Session.Event.Created,Updated,Deleted,Diff,Error`,
      `${openCodeEventUpstreamRef}:packages/opencode/src/session/message-v2.ts#MessageV2.Event.Updated,Removed,PartUpdated,PartDelta,PartRemoved`,
      `${openCodeEventUpstreamRef}:packages/opencode/src/session/projectors.ts#SessionTable,MessageTable,PartTable SyncEvent projectors`,
      `${openCodeEventUpstreamRef}:packages/opencode/src/session/projectors-next.ts#encodeDateTimes,sqlite,update,session.next projectors`,
    ],
    nativeEvidenceRefs: [openCodeEventNativeExactEvidenceRef, openCodeEventNativeExactReplayRef],
    fixtureIDs: [openCodeEventNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptors: openCodeEventNativeDescriptors,
    intentionallyBridgeAtoms: [] as const,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeEventNativeExactFixture(fixture: OpenCodeEventNativeExactFixture): OpenCodeEventNativeExactVerification {
  const issues: OpenCodeEventNativeExactIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== openCodeEventNativeExactFixtureID || fixture.evidenceRef !== openCodeEventNativeExactEvidenceRef) {
    addIssue("opencode-event-native-exact.identity", "OpenCode event native fixture lost fixture or evidence identity.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    addIssue("opencode-event-native-exact.native-claim", "OpenCode event native fixture must claim native-exact parity.")
  }
  if (fixture.knownLossiness.length !== 0 || fixture.intentionallyBridgeAtoms.length !== 0) {
    addIssue("opencode-event-native-exact.lossiness", "OpenCode event fixture must not carry compatible bridge lossiness.")
  }
  for (const atomID of openCodeEventNativeExactAtomIDs) {
    if (!fixture.atomIDs.includes(atomID)) addIssue("opencode-event-native-exact.atom", `Missing atom ${atomID}.`)
    const descriptor = fixture.descriptors.find((item) => item.id === atomID)
    if (!descriptor || descriptor.parityCoverage !== "native" || descriptor.knownLossiness.length !== 0) {
      addIssue("opencode-event-native-exact.descriptor", `Descriptor for ${atomID} is not native exact.`)
    }
  }
  const busOnly = fixture.definitions.find((definition) => definition.eventType === "message.part.delta")
  if (!busOnly || busOnly.kind !== "bus" || busOnly.persistsEventRow !== false) {
    addIssue("opencode-event-native-exact.part-delta", "MessageV2 part delta must remain a bus-only event.")
  }
  const sessionNext = fixture.definitions.find((definition) => definition.eventType === "session.next.compaction.ended")
  if (!sessionNext || sessionNext.kind !== "session-next-sync" || !sessionNext.sqliteTables.includes("session_message")) {
    addIssue("opencode-event-native-exact.session-next", "Session.next compaction ended must project to SessionMessageTable.")
  }
  const row = fixture.cases.find((item) => item.scenarioID === "projectors-next-session-message-row")?.output["row"] as OpenCodeSessionMessageRowProjection | undefined
  const rowTime = row?.data["time"] as { created?: unknown } | undefined
  if (row?.data["id"] !== undefined || row?.data["type"] !== undefined || rowTime?.created !== 1_780_000_000_100) {
    addIssue("opencode-event-native-exact.projectors-next", "projectors-next row projection must strip id/type and encode DateTime values.")
  }
  const expected = buildOpenCodeEventNativeExactFixture()
  if (fixture.fingerprint !== expected.fingerprint) {
    addIssue("opencode-event-native-exact.fingerprint", "OpenCode event native fixture fingerprint changed from the pinned native projection.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function legacyProjectorAction(eventType: string): string {
  if (eventType === "session.created") return "insert-session-row"
  if (eventType === "session.updated") return "patch-session-row"
  if (eventType === "session.deleted") return "delete-session-row"
  if (eventType === "message.updated") return "upsert-message-row"
  if (eventType === "message.removed") return "delete-message-and-parts-with-usage-adjustment"
  if (eventType === "message.part.updated") return "upsert-part-row-with-usage-adjustment"
  if (eventType === "message.part.removed") return "delete-part-row-with-usage-adjustment"
  return "project-sync-event"
}

function eventCase(
  scenarioID: OpenCodeEventNativeExactScenarioID,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  upstreamBehavior: string,
): OpenCodeEventNativeExactCase {
  return { scenarioID, input, output: encodeOpenCodeDateTimesProjection(output) as Record<string, unknown>, upstreamBehavior }
}

function cloneRecord<T extends Record<string, unknown>>(record: T): T {
  return JSON.parse(JSON.stringify(record)) as T
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
