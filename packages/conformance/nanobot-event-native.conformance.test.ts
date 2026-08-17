import { describe, expect, it } from "vitest"
import {
  buildNanobotEventNativeExactFixture,
  buildNanobotWebSocketMessagePayload,
  createNanobotMessageBusProjection,
  nanobotDeltaPayload,
  nanobotEventBusNativeDescriptor,
  nanobotEventEnvelopeNativeDescriptor,
  nanobotEventNativeExactAtomIDs,
  nanobotEventNativeExactEvidenceRef,
  nanobotEventNativeExactFixtureID,
  nanobotEventNativeExactReplayRef,
  nanobotEventNativeDescriptors,
  nanobotFinalizeContent,
  nanobotInboundSessionKey,
  nanobotReasoningDeltaPayload,
  nanobotReasoningEndPayload,
  nanobotRuntimeModelUpdatedPayload,
  nanobotToolEventStartPayload,
  nanobotTurnEndPayload,
  parseNanobotInboundPayload,
  parseNanobotWebSocketEnvelope,
  projectNanobotProgressStream,
  projectNanobotToolProgress,
  projectNanobotWebSocketEnvelope,
  projectNanobotWebSocketOutbound,
  verifyNanobotEventNativeExactFixture,
} from "@helix/adapters-nanobot/product-schema/events"
import { buildAssemblyContract } from "@helix/recipes"

describe("Nanobot event native exact conformance", () => {
  it("matches upstream MessageBus FIFO queues and InboundMessage session keys", async () => {
    const bus = createNanobotMessageBusProjection()
    const pendingInbound = bus.consumeInbound()
    let resolved = false
    pendingInbound.then(() => {
      resolved = true
    })
    await Promise.resolve()
    expect(resolved).toBe(false)

    const inbound = {
      channel: "websocket",
      sender_id: "browser",
      chat_id: "chat-1",
      content: "hello",
      session_key_override: "websocket:override",
    }
    const outbound = {
      channel: "websocket",
      chat_id: "chat-1",
      content: "answer",
      metadata: {},
    }
    await bus.publishInbound(inbound)
    await bus.publishOutbound(outbound)

    expect(await pendingInbound).toEqual(inbound)
    expect(await bus.consumeOutbound()).toEqual(outbound)
    expect(bus.inboundSize()).toBe(0)
    expect(bus.outboundSize()).toBe(0)
    expect(nanobotInboundSessionKey(inbound)).toBe("websocket:override")
    expect(nanobotInboundSessionKey({ ...inbound, session_key_override: null })).toBe("websocket:chat-1")
  })

  it("projects websocket outbound messages and control events with native fields", () => {
    const message = {
      channel: "websocket",
      chat_id: "chat-1",
      content: "tool hint",
      reply_to: "user-1",
      media: ["/tmp/plot.png"],
      metadata: {
        latency_ms: 42.9,
        _tool_hint: true,
        _tool_events: [nanobotToolEventStartPayload({ id: "call-1", name: "read_file", arguments: { path: "/repo/a.ts" } })],
        _agent_ui: { kind: "tool-card" },
      },
    }

    expect(buildNanobotWebSocketMessagePayload(message, [{ url: "/api/media/sig/payload", name: "plot.png" }])).toEqual({
      event: "message",
      chat_id: "chat-1",
      text: "tool hint",
      media: ["/tmp/plot.png"],
      media_urls: [{ url: "/api/media/sig/payload", name: "plot.png" }],
      reply_to: "user-1",
      latency_ms: 42,
      tool_events: [nanobotToolEventStartPayload({ id: "call-1", name: "read_file", arguments: { path: "/repo/a.ts" } })],
      agent_ui: { kind: "tool-card" },
      kind: "tool_hint",
    })
    expect(projectNanobotWebSocketOutbound(message)).toMatchObject({ event: "message", kind: "tool_hint" })
    expect(projectNanobotWebSocketOutbound({ ...message, metadata: { _turn_end: true, latency_ms: 17.2, goal_state: { active: false } } })).toEqual(
      nanobotTurnEndPayload("chat-1", 17.2, { active: false }),
    )
    expect(projectNanobotWebSocketOutbound({ ...message, metadata: { _goal_status: true, goal_status: "running", started_at: 10 } })).toEqual({
      event: "goal_status",
      chat_id: "chat-1",
      status: "running",
      started_at: 10,
    })
    expect(projectNanobotWebSocketOutbound({ ...message, metadata: { _session_updated: true } })).toEqual({ event: "session_updated", chat_id: "chat-1" })
    expect(projectNanobotWebSocketOutbound({ ...message, metadata: { _runtime_model_updated: true, model: " gpt-4.1 ", model_preset: " fast " } })).toEqual(
      nanobotRuntimeModelUpdatedPayload("gpt-4.1", "fast"),
    )
  })

  it("matches progress hook reasoning, stream-end, tool event, and final-content behavior", () => {
    expect(projectNanobotProgressStream({ chatID: "chat-1", chunks: ["<think>plan</think>", "Answer"], streamID: "s1" })).toEqual([
      nanobotReasoningDeltaPayload("chat-1", "plan", { _stream_id: "s1" }),
      nanobotReasoningEndPayload("chat-1", { _stream_id: "s1" }),
      nanobotDeltaPayload("chat-1", "Answer", { _stream_id: "s1" }),
      nanobotDeltaPayload("chat-1", "", { _stream_id: "s1", _stream_end: true }),
    ])
    expect(nanobotFinalizeContent("<think>plan</think>Answer")).toBe("Answer")
    expect(projectNanobotToolProgress({
      channel: "websocket",
      chatID: "chat-1",
      messageID: "msg-1",
      metadata: { webui: true },
      sessionKey: "websocket:chat-1",
      toolCalls: [{ id: "call-1", name: "read_file", arguments: { path: "/repo/src/index.ts" } }],
      toolResults: [{ files: ["/repo/src/index.ts"], embeds: [{ kind: "image" }], value: "ok" }],
      toolEvents: [{ status: "ok" }],
    })).toMatchObject({
      progressEvents: [
        {
          content: "read /repo/src/index.ts",
          tool_hint: true,
          tool_events: [
            {
              version: 1,
              phase: "start",
              call_id: "call-1",
              name: "read_file",
              arguments: { path: "/repo/src/index.ts" },
            },
          ],
        },
        {
          content: "",
          tool_hint: false,
          tool_events: [
            {
              version: 1,
              phase: "end",
              call_id: "call-1",
              result: { files: ["/repo/src/index.ts"], embeds: [{ kind: "image" }], value: "ok" },
              files: ["/repo/src/index.ts"],
              embeds: [{ kind: "image" }],
            },
          ],
        },
      ],
      toolContext: {
        channel: "websocket",
        chat_id: "chat-1",
        message_id: "msg-1",
        metadata: { webui: true },
        session_key: "websocket:chat-1",
      },
    })
  })

  it("routes websocket inbound envelopes and legacy payloads like upstream", () => {
    expect(parseNanobotWebSocketEnvelope("{\"type\":\"message\",\"content\":\"hello\"}")).toEqual({ type: "message", content: "hello" })
    expect(parseNanobotWebSocketEnvelope("{\"content\":\"legacy\"}")).toBeNull()
    expect(parseNanobotInboundPayload("  hello  ")).toBe("hello")
    expect(parseNanobotInboundPayload("{\"content\":\"hello\"}")).toBe("hello")
    expect(parseNanobotInboundPayload("{\"type\":\"message\"}")).toBeNull()

    expect(projectNanobotWebSocketEnvelope({ clientID: "client-1", envelope: { type: "new_chat" }, generatedChatID: "uuid-1" })).toEqual({
      attach: "uuid-1",
      hydrate: ["uuid-1"],
      sends: [{ event: "attached", chat_id: "uuid-1" }],
      handledMessage: null,
    })
    expect(projectNanobotWebSocketEnvelope({
      clientID: "client-1",
      envelope: { type: "message", chat_id: "websocket:chat-1", content: "", media: [{ kind: "image" }], webui: true },
      savedMediaPaths: ["/tmp/image.png"],
      remoteAddress: ["127.0.0.1", 5000],
    })).toMatchObject({
      attach: "websocket:chat-1",
      hydrate: ["websocket:chat-1"],
      handledMessage: {
        sender_id: "client-1",
        chat_id: "websocket:chat-1",
        content: "",
        media: ["/tmp/image.png"],
        metadata: { remote: ["127.0.0.1", 5000], webui: true },
        is_dm: false,
      },
    })
    expect(projectNanobotWebSocketEnvelope({ clientID: "client-1", envelope: { type: "attach", chat_id: "../bad" } })).toMatchObject({
      sends: [{ event: "error", detail: "invalid chat_id" }],
    })
    expect(projectNanobotWebSocketEnvelope({ clientID: "client-1", envelope: { type: "message", chat_id: "chat-1", content: 42 } })).toMatchObject({
      sends: [{ event: "error", detail: "missing content" }],
    })
    expect(projectNanobotWebSocketEnvelope({ clientID: "client-1", envelope: { type: "unknown" } })).toMatchObject({
      sends: [{ event: "error", detail: "unknown type: \"unknown\"" }],
    })
  })

  it("proves native descriptors, assembly wiring, and fixture drift guards", () => {
    const fixture = buildNanobotEventNativeExactFixture()
    const contract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })

    expect(fixture).toMatchObject({
      product: "nanobot",
      atomIDs: ["nanobot.event.envelope-bridge", "nanobot.event.bus-bridge"],
      portIDs: ["event.envelope", "event.log"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      evidenceRef: nanobotEventNativeExactEvidenceRef,
      fixtureID: nanobotEventNativeExactFixtureID,
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "message-bus-fifo-and-envelope-session-key",
      "websocket-outbound-message-and-control-events",
      "progress-hook-stream-reasoning-end-before-answer",
      "progress-hook-tool-events-and-final-content",
      "websocket-inbound-envelope-routing-and-errors",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("bus/events.py#InboundMessage"),
      expect.stringContaining("bus/queue.py#MessageBus"),
      expect.stringContaining("agent/progress_hook.py#AgentProgressHook"),
      expect.stringContaining("channels/websocket.py#_parse_envelope"),
    ]))
    expect(verifyNanobotEventNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(nanobotEventNativeDescriptors).toEqual([nanobotEventEnvelopeNativeDescriptor, nanobotEventBusNativeDescriptor])
    for (const descriptor of nanobotEventNativeDescriptors) {
      expect(descriptor).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([nanobotEventNativeExactEvidenceRef, nanobotEventNativeExactReplayRef]),
        fixtureIDs: [nanobotEventNativeExactFixtureID],
        knownLossiness: [],
      })
    }
    for (const atomID of nanobotEventNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([nanobotEventNativeExactEvidenceRef, nanobotEventNativeExactReplayRef]),
        fixtureIDs: [nanobotEventNativeExactFixtureID],
        knownLossiness: [],
      })
      expect(atom?.nativeEvidenceRefs).not.toContain("conformance:nanobot-event-source-matrix")
      expect(atom?.fixtureIDs).not.toContain("nanobot-event:source-matrix")
    }

    expect(verifyNanobotEventNativeExactFixture({ ...fixture, fingerprint: "bad" }).ok).toBe(false)
    expect(verifyNanobotEventNativeExactFixture({ ...fixture, knownLossiness: ["native-parity-not-proven"] as unknown as [] }).issues.map((item) => item.id)).toContain(
      "nanobot-event-native-exact.lossiness",
    )
    expect(verifyNanobotEventNativeExactFixture({ ...fixture, cases: [{ ...fixture.cases[0]!, output: { queueOrder: [] } }, ...fixture.cases.slice(1)] }).issues.map((item) => item.id)).toContain(
      "nanobot-event-native-exact.cases",
    )
  })
})
