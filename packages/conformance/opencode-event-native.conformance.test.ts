import { describe, expect, it } from "vitest"
import {
  buildOpenCodeEventNativeExactFixture,
  openCodeEventDefinitionRegistryProjection,
  openCodeEventNativeDescriptors,
  openCodeEventNativeExactAtomIDs,
  openCodeEventNativeExactEvidenceRef,
  openCodeEventNativeExactFixtureID,
  openCodeEventNativeExactReplayRef,
  openCodeEventV2BridgeProjection,
  openCodeSessionNextProjectorProjection,
  openCodeSyncEventEnvelopeProjection,
  openCodeSyncVersionedTypeProjection,
  verifyOpenCodeEventNativeExactFixture,
} from "@helix/adapters-opencode/product-schema/events"

describe("OpenCode event native exact schema", () => {
  it("projects SyncEvent envelopes with versioned event rows and GlobalBus sync payloads", () => {
    const envelope = openCodeSyncEventEnvelopeProjection({
      id: "evt_101",
      seq: 4,
      type: "message.part.updated",
      version: 1,
      aggregate: "sessionID",
      data: {
        sessionID: "ses_1",
        part: { id: "prt_1", messageID: "msg_1", sessionID: "ses_1", type: "text", text: "hello" },
        time: 1_780_000_000_000,
      },
      ownerID: "owner_1",
      directory: "/repo",
      project: "project_1",
      workspace: "wrk_1",
    })

    expect(openCodeSyncVersionedTypeProjection("message.part.updated", 1)).toBe("message.part.updated.1")
    expect(envelope).toMatchObject({
      event: { id: "evt_101", seq: 4, aggregateID: "ses_1" },
      eventTableRow: {
        id: "evt_101",
        seq: 4,
        aggregate_id: "ses_1",
        type: "message.part.updated.1",
      },
      sequenceRow: { aggregate_id: "ses_1", seq: 4, owner_id: "owner_1" },
      projectBusPublish: {
        definitionType: "message.part.updated",
        options: { id: "evt_101" },
      },
      globalBusEnvelope: {
        directory: "/repo",
        project: "project_1",
        workspace: "wrk_1",
        payload: {
          type: "sync",
          syncEvent: {
            type: "message.part.updated.1",
            id: "evt_101",
            seq: 4,
            aggregateID: "ses_1",
          },
        },
      },
    })
  })

  it("routes EventV2 aggregate events to SyncEvent and bus-only deltas to property payloads", () => {
    const syncRoute = openCodeEventV2BridgeProjection({
      id: "evt_201",
      type: "session.next.text.ended",
      version: 1,
      aggregate: "sessionID",
      data: { sessionID: "ses_2", messageID: "msg_2", text: "done" },
      location: { workspaceID: "wrk_2", directory: "/repo" },
    })
    const busRoute = openCodeEventV2BridgeProjection({
      id: "evt_202",
      type: "message.part.delta",
      data: { sessionID: "ses_2", messageID: "msg_2", partID: "prt_2", field: "text", delta: "hi" },
      location: { workspaceID: "wrk_2", directory: "/repo" },
    })

    expect(syncRoute).toEqual({
      route: "sync",
      syncDefinition: {
        type: "session.next.text.ended",
        version: 1,
        aggregate: "sessionID",
        schema: "data",
        properties: "data",
      },
      aggregateID: "ses_2",
      data: { sessionID: "ses_2", messageID: "msg_2", text: "done" },
    })
    expect(busRoute).toEqual({
      route: "bus",
      busDefinition: { type: "message.part.delta", properties: "data" },
      globalEnvelope: {
        workspace: "wrk_2",
        payload: {
          id: "evt_202",
          type: "message.part.delta",
          properties: { sessionID: "ses_2", messageID: "msg_2", partID: "prt_2", field: "text", delta: "hi" },
        },
      },
    })
  })

  it("projects session.next rows by stripping identity fields and encoding DateTime values", () => {
    const projected = openCodeSessionNextProjectorProjection({
      eventID: "evt_301",
      eventType: "session.next.compaction.ended",
      sessionID: "ses_3",
      timeCreated: 1_780_000_000_300,
      data: {
        id: "drop",
        type: "drop",
        sessionID: "ses_3",
        text: "summary",
        nested: { time: { _tag: "DateTime", epochMillis: 1_780_000_000_300 } },
      },
    })
    const ignored = openCodeSessionNextProjectorProjection({
      eventID: "evt_302",
      eventType: "session.next.text.delta",
      sessionID: "ses_3",
      timeCreated: 1_780_000_000_301,
      data: { sessionID: "ses_3", text: "delta" },
    })

    expect(projected).toEqual({
      action: "append-session-message",
      row: {
        id: "evt_301",
        session_id: "ses_3",
        type: "session.next.compaction.ended",
        time_created: 1_780_000_000_300,
        data: {
          sessionID: "ses_3",
          text: "summary",
          nested: { time: 1_780_000_000_300 },
        },
      },
    })
    expect(ignored).toEqual({ action: "ignore-delta" })
  })

  it("publishes native descriptors and verifies the exact event fixture", () => {
    const definitions = openCodeEventDefinitionRegistryProjection()
    const fixture = buildOpenCodeEventNativeExactFixture()

    expect(verifyOpenCodeEventNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      product: "opencode",
      atomIDs: openCodeEventNativeExactAtomIDs,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [openCodeEventNativeExactEvidenceRef, openCodeEventNativeExactReplayRef],
      fixtureIDs: [openCodeEventNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(openCodeEventNativeDescriptors).toHaveLength(openCodeEventNativeExactAtomIDs.length)
    expect(openCodeEventNativeDescriptors.every((descriptor) => descriptor.parityCoverage === "native" && descriptor.knownLossiness.length === 0)).toBe(true)
    expect(definitions.find((definition) => definition.eventType === "message.part.delta")).toMatchObject({
      kind: "bus",
      persistsEventRow: false,
      payloadKeys: ["delta", "field", "messageID", "partID", "sessionID"],
    })
    expect(definitions.find((definition) => definition.eventType === "session.next.compaction.ended")).toMatchObject({
      kind: "session-next-sync",
      projectorAction: "append-session-message",
      sqliteTables: ["session_message"],
    })
    expect(definitions.filter((definition) => definition.projectorAction === "ignore-delta").map((definition) => definition.eventType)).toEqual([
      "session.next.text.delta",
      "session.next.tool.input.delta",
      "session.next.reasoning.delta",
      "session.next.compaction.delta",
    ])
  })
})
