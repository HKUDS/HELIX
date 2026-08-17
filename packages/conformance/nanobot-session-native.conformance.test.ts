import { describe, expect, it } from "vitest"
import {
  buildNanobotSessionNativeExactFixture,
  createNanobotSessionProjection,
  enforceNanobotSessionFileCapProjection,
  findNanobotLegalMessageStartProjection,
  listNanobotSessionFilesProjection,
  nanobotDiscardLegacyGoalStateKeyProjection,
  nanobotGoalStateRuntimeLinesProjection,
  nanobotGoalStateWSBlobProjection,
  nanobotRunnerWallLLMTimeoutProjection,
  nanobotSessionMessagePartProjectorNativeExactAtomID,
  nanobotSessionNativeDescriptors,
  nanobotSessionNativeExactAtomIDs,
  nanobotSessionNativeExactEvidenceRef,
  nanobotSessionNativeExactFixtureID,
  nanobotSessionNativeExactReplayRef,
  nanobotSessionPathProjection,
  nanobotSessionTextPreview,
  parseNanobotGoalStateProjection,
  parseNanobotSessionJSONLProjection,
  projectNanobotSessionHistory,
  readNanobotSessionFileProjection,
  retainNanobotRecentLegalSuffixProjection,
  sanitizeNanobotAssistantReplayText,
  serializeNanobotSessionJSONLProjection,
  verifyNanobotSessionNativeExactFixture,
} from "@helix/adapters-nanobot/product-schema/session"
import { nanobotSessionSafeKey } from "@helix/adapters-nanobot/product-schema/identity"
import { buildAssemblyContract, verifyAssemblyContract } from "@helix/recipes"

describe("Nanobot session native exact conformance", () => {
  it("matches upstream safe keys, JSONL metadata-first save, read, load repair, and list previews", () => {
    const session = createNanobotSessionProjection({
      key: "websocket:room/unsafe",
      createdAt: "2026-06-13T10:00:00",
      updatedAt: "2026-06-13T10:05:00",
      metadata: { title: "Native Session" },
      lastConsolidated: 1,
      messages: [
        { role: "assistant", content: "consolidated" },
        { role: "user", content: "Need a preview" },
      ],
    })
    const jsonl = serializeNanobotSessionJSONLProjection(session)

    expect(nanobotSessionSafeKey(session.key)).toBe("websocket_room_unsafe")
    expect(nanobotSessionPathProjection({ workspace: "/home/nano/.nanobot/workspace", key: session.key })).toBe(
      "/home/nano/.nanobot/workspace/sessions/websocket_room_unsafe.jsonl",
    )
    expect(JSON.parse(jsonl.split("\n")[0] ?? "{}")).toMatchObject({
      _type: "metadata",
      key: "websocket:room/unsafe",
      last_consolidated: 1,
    })

    const parsed = parseNanobotSessionJSONLProjection({ key: session.key, text: jsonl })
    expect(parsed).toMatchObject({ repaired: false, skippedCorruptLines: 0 })
    expect(parsed.session?.metadata).toEqual({ title: "Native Session" })
    expect(parsed.session?.messages.map((message) => message.content)).toEqual(["consolidated", "Need a preview"])
    expect(readNanobotSessionFileProjection({ key: session.key, text: jsonl })).toMatchObject({
      key: "websocket:room/unsafe",
      metadata: { title: "Native Session" },
    })

    const corrupt = [
      "BROKEN",
      JSON.stringify({ _type: "metadata", key: "websocket:repair", created_at: "not-a-date", updated_at: "also-bad", metadata: { title: "Recovered" }, last_consolidated: 5 }),
      JSON.stringify({ role: "user", content: "survived" }),
      "{\"role\":\"assistant\",\"content\":\"partial",
    ].join("\n")
    const repaired = parseNanobotSessionJSONLProjection({ key: "websocket:repair", text: corrupt, now: "2026-06-13T11:00:00" })
    expect(repaired).toMatchObject({ repaired: true, skippedCorruptLines: 2 })
    expect(repaired.session).toMatchObject({
      createdAt: "2026-06-13T11:00:00",
      updatedAt: "2026-06-13T11:00:00",
      lastConsolidated: 5,
      metadata: { title: "Recovered" },
    })
    expect(repaired.session?.messages).toEqual([{ role: "user", content: "survived" }])
    expect(parseNanobotSessionJSONLProjection({ key: "bad", text: "garbage\n{{", now: "2026-06-13T11:00:00" }).session).toBeNull()

    const listed = listNanobotSessionFilesProjection([
      {
        path: "/tmp/sessions/websocket_newer.jsonl",
        text: serializeNanobotSessionJSONLProjection(createNanobotSessionProjection({
          key: "websocket:newer",
          createdAt: "2026-06-13T12:00:00",
          updatedAt: "2026-06-13T12:01:00",
          metadata: { title: "Newer" },
          messages: [
            { role: "assistant", content: "assistant fallback" },
            { role: "user", content: [{ type: "text", text: "user preview wins" }] },
          ],
        })),
      },
      {
        path: "/tmp/sessions/websocket_older.jsonl",
        text: serializeNanobotSessionJSONLProjection(createNanobotSessionProjection({
          key: "websocket:older",
          createdAt: "2026-06-12T12:00:00",
          updatedAt: "2026-06-12T12:01:00",
          messages: [{ role: "assistant", content: "[Message Time: 2026-06-12]\nassistant preview\n[image: /tmp/a.png]" }],
        })),
      },
      { path: "/tmp/sessions/websocket_repair.jsonl", text: corrupt },
    ])
    expect(listed.map((item) => item.key)).toEqual(["websocket:newer", "websocket:repair", "websocket:older"])
    expect(listed.map((item) => item.preview)).toEqual(["user preview wins", "survived", "assistant preview"])
  })

  it("matches upstream history replay, context selector, token cap, and retention/file-cap behavior", () => {
    expect(sanitizeNanobotAssistantReplayText("[Message Time: 2026-05-09]\nVisible\n[image: /tmp/old.png]\ngenerate_image(\"16:9\")\nmessage(\"Visible\")")).toBe("Visible")
    expect(nanobotSessionTextPreview([{ type: "text", text: "hello" }, { type: "image_url", image_url: { url: "x" } }, { type: "text", text: "world" }])).toBe("hello world")

    const session = createNanobotSessionProjection({
      key: "websocket:history",
      messages: [
        { role: "assistant", content: "drink water", timestamp: "2026-04-26T15:00:00", _channel_delivery: true },
        { role: "user", content: "", timestamp: "2026-04-26T18:00:00", media: ["/m/pic.png"] },
        {
          role: "assistant",
          content: "[Message Time: 2026-05-09]\nVisible\n[image: /tmp/old.png]\ngenerate_image(\"16:9\")",
        },
        {
          role: "assistant",
          content: "",
          reasoning_content: "kept reasoning",
          thinking_blocks: [{ type: "thinking", thinking: "kept thought" }],
        },
        { role: "assistant", content: "   " },
        { role: "assistant", content: "", tool_calls: [{ id: "tc", type: "function", function: { name: "lookup", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "tc", name: "lookup", content: "ok" },
        { role: "user", content: "hidden command", _command: true },
      ],
    })
    expect(projectNanobotSessionHistory(session, { includeTimestamps: true })).toEqual([
      { role: "assistant", content: "drink water" },
      { role: "user", content: "[Message Time: 2026-04-26T18:00:00]\n[image: /m/pic.png]" },
      { role: "assistant", content: "Visible" },
      { role: "assistant", content: "", reasoning_content: "kept reasoning", thinking_blocks: [{ type: "thinking", thinking: "kept thought" }] },
      { role: "assistant", content: "", tool_calls: [{ id: "tc", type: "function", function: { name: "lookup", arguments: "{}" } }] },
      { role: "tool", content: "ok", tool_call_id: "tc", name: "lookup" },
    ])

    const boundary = createNanobotSessionProjection({
      key: "websocket:boundary",
      messages: [
        { role: "assistant", content: null, tool_calls: [{ id: "gone", type: "function", function: { name: "old", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "gone", name: "old", content: "old result" },
        { role: "tool", tool_call_id: "orphan", name: "old", content: "orphan" },
        { role: "assistant", content: null, tool_calls: [{ id: "keep", type: "function", function: { name: "lookup", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "keep", name: "lookup", content: "kept" },
      ],
    })
    expect(findNanobotLegalMessageStartProjection(boundary.messages.slice(-3))).toBe(1)
    expect(projectNanobotSessionHistory(boundary, { maxMessages: 3 })).toEqual([
      { role: "assistant", content: null, tool_calls: [{ id: "keep", type: "function", function: { name: "lookup", arguments: "{}" } }] },
      { role: "tool", content: "kept", tool_call_id: "keep", name: "lookup" },
    ])

    const tokenTail = createNanobotSessionProjection({
      key: "websocket:tokens",
      messages: [
        { role: "user", content: "u1" },
        { role: "assistant", content: "a1" },
        { role: "user", content: "u2" },
        { role: "assistant", content: "a2" },
      ],
    })
    expect(projectNanobotSessionHistory(tokenTail, { maxTokens: 100, tokenEstimateByContent: { u1: 100, a1: 100, u2: 100, a2: 100 } }).map((message) => message.content)).toEqual(["u2", "a2"])

    const retained = retainNanobotRecentLegalSuffixProjection(
      createNanobotSessionProjection({
        key: "websocket:retain",
        lastConsolidated: 7,
        messages: Array.from({ length: 10 }, (_, index) => ({ role: "user", content: `msg${index}` })),
      }),
      4,
      "2026-06-13T13:00:00",
    )
    expect(retained.messages.map((message) => message.content)).toEqual(["msg6", "msg7", "msg8", "msg9"])
    expect(retained.lastConsolidated).toBe(1)
    expect(retainNanobotRecentLegalSuffixProjection(retained, 0).messages).toEqual([])

    const capped = enforceNanobotSessionFileCapProjection(
      createNanobotSessionProjection({
        key: "websocket:filecap",
        lastConsolidated: 2,
        messages: Array.from({ length: 6 }, (_, index) => ({ role: "user", content: `m${index}` })),
      }),
      { limit: 3 },
    )
    expect(capped.session.messages.map((message) => message.content)).toEqual(["m3", "m4", "m5"])
    expect(capped.archived.map((message) => message.content)).toEqual(["m2"])
    expect(capped.session.lastConsolidated).toBe(0)
  })

  it("matches upstream goal_state runtime lines, WebSocket blobs, legacy key, and timeout behavior", () => {
    expect(parseNanobotGoalStateProjection("{\"status\":\"active\",\"objective\":\"x\"}")).toEqual({ status: "active", objective: "x" })
    expect(nanobotGoalStateRuntimeLinesProjection(null)).toEqual([])
    expect(nanobotGoalStateRuntimeLinesProjection({ goal_state: { status: "completed", objective: "x" } })).toEqual([])
    expect(nanobotGoalStateRuntimeLinesProjection({ thread_goal: { status: "active", objective: "Legacy.", ui_summary: "L" } })).toEqual([
      "Goal (active):",
      "Legacy.",
      "Summary: L",
    ])
    expect(nanobotGoalStateRuntimeLinesProjection({ goal_state: { status: "active", objective: "", ui_summary: "" } })).toEqual([
      "Goal: active (no objective text stored).",
    ])

    const metadata = {
      goal_state: { status: "active", objective: "x".repeat(605), ui_summary: "s".repeat(130) },
      thread_goal: { status: "active", objective: "ignored" },
    }
    const wsBlob = nanobotGoalStateWSBlobProjection(metadata)
    expect(wsBlob.active).toBe(true)
    expect(String(wsBlob.objective).length).toBe(601)
    expect(String(wsBlob.objective).endsWith("\u2026")).toBe(true)
    expect(String(wsBlob.ui_summary).length).toBe(120)
    expect(nanobotRunnerWallLLMTimeoutProjection({ metadata })).toBe(0)
    expect(nanobotRunnerWallLLMTimeoutProjection({ metadata: {} })).toBeNull()
    expect(nanobotDiscardLegacyGoalStateKeyProjection(metadata)).not.toHaveProperty("thread_goal")
  })

  it("publishes native exact descriptors and verifies the fixture without bridge lossiness", () => {
    const fixture = buildNanobotSessionNativeExactFixture()
    expect(verifyNanobotSessionNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture.atomIDs).toEqual(nanobotSessionNativeExactAtomIDs)
    expect(fixture.atomIDs).toContain(nanobotSessionMessagePartProjectorNativeExactAtomID)
    expect(fixture.portIDs).toContain("session.message-part-projector")
    expect(fixture.fixtureIDs).toEqual([nanobotSessionNativeExactFixtureID])
    expect(fixture.nativeEvidenceRefs).toEqual([nanobotSessionNativeExactEvidenceRef, nanobotSessionNativeExactReplayRef])
    expect(fixture.knownLossiness).toEqual([])
    expect(fixture.intentionallyBridgeAtoms).toEqual([])
    expect(fixture.policy.messagePartProjectorReplaysToolCallsReasoningThinkingMediaAndTimestamps).toBe(true)
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "session-key-safe-path-and-jsonl-store",
      "history-projector-timestamp-media-and-sanitize",
      "context-selector-token-and-tool-boundary",
      "retention-file-cap-and-last-consolidated",
      "list-sessions-preview-repair-and-updated-at",
      "goal-state-runtime-websocket-and-timeout",
    ])
    expect(nanobotSessionNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([...nanobotSessionNativeExactAtomIDs])
    for (const descriptor of nanobotSessionNativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "nanobot",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: [nanobotSessionNativeExactEvidenceRef, nanobotSessionNativeExactReplayRef],
        fixtureIDs: [nanobotSessionNativeExactFixtureID],
        knownLossiness: [],
      })
    }
  })

  it("binds the Nanobot session message-part port to the native projector", () => {
    const contract = buildAssemblyContract({
      product: "nanobot",
      generatedAt: "2026-06-13T00:00:00.000Z",
    })
    expect(verifyAssemblyContract(contract).ok).toBe(true)
    expect(contract.bindings.find((binding) => binding.portID === "session.message-part-projector")).toMatchObject({
      providerAtomID: nanobotSessionMessagePartProjectorNativeExactAtomID,
      bindingSource: "recipe-explicit",
    })
  })
})
