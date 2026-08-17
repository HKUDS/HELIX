import { describe, expect, it } from "vitest"
import {
  appendNanobotTranscriptObject,
  buildNanobotTraceNativeExactFixture,
  formatNanobotToolCallTrace,
  nanobotSafeTranscriptStem,
  nanobotToolTraceLinesFromEvents,
  nanobotTraceDebugSurfaceNativeDescriptor,
  nanobotTraceDebugSurfaceNativeExactAtomID,
  nanobotTraceDebugSurfaceNativeExactEvidenceRef,
  nanobotTraceDebugSurfaceNativeExactFixtureID,
  nanobotTraceDebugSurfaceNativeExactReplayRef,
  nanobotWebUITranscriptPath,
  nanobotWebUITranscriptSchemaVersion,
  readNanobotTranscriptLinesFromContent,
  replayNanobotTraceDebugSurface,
  replayNanobotTranscriptToUIMessages,
  verifyNanobotTraceNativeExactFixture,
} from "@helix/adapters-nanobot/product-schema/trace"
import { buildAssemblyContract } from "@helix/recipes"

describe("Nanobot trace debug-surface native exact conformance", () => {
  it("matches upstream WebUI transcript path, compact JSONL append, and forgiving readback", () => {
    expect(nanobotSafeTranscriptStem("websocket:chat/../1")).toBe("websocket_chat_.._1")
    expect(nanobotWebUITranscriptPath("/repo/.nanobot/webui/", "websocket:chat-1")).toBe("/repo/.nanobot/webui/websocket_chat-1.jsonl")
    expect(appendNanobotTranscriptObject({ event: "user", text: "你好" })).toBe('{"event":"user","text":"你好"}\n')
    expect(appendNanobotTranscriptObject({ event: "user", text: "你好" })).not.toContain("\\u4f60")
    expect(() => appendNanobotTranscriptObject({ event: "user", text: "too long" }, { maxBytes: 8 })).toThrow("webui transcript line too large")

    const readback = readNanobotTranscriptLinesFromContent('\n{"event":"user","text":"hi"}\nnot-json\n[]\n{"event":"turn_end"}\n')
    expect(readback).toMatchObject({
      skippedBecauseTooLarge: false,
      skippedBadJSONLines: 1,
      skippedNonObjectLines: 1,
    })
    expect(readback.lines.map((line) => line.event)).toEqual(["user", "turn_end"])
    expect(readNanobotTranscriptLinesFromContent("{}", { byteSize: 12, maxBytes: 8 }).lines).toEqual([])
  })

  it("formats tool trace lines from upstream start events only", () => {
    const events = [
      { phase: "start", function: { name: "read_file", arguments: "{\"path\":\"/repo/a.ts\"}" } },
      { phase: "finish", name: "read_file", status: "ok" },
      { phase: "start", name: "write_file", arguments: { path: "/repo/out.txt", content: "你好" } },
      { phase: "start", name: "empty_args", arguments: {} },
      { phase: "start", function: { name: "" }, name: "fallback" },
    ]

    expect(formatNanobotToolCallTrace(events[0])).toBe('read_file({"path":"\\/repo\\/a.ts"})'.replaceAll("\\/", "/"))
    expect(formatNanobotToolCallTrace(events[2])).toBe('write_file({"path": "/repo/out.txt", "content": "你好"})')
    expect(formatNanobotToolCallTrace(events[3])).toBe("empty_args()")
    expect(nanobotToolTraceLinesFromEvents(events)).toEqual([
      'read_file({"path":"\\/repo\\/a.ts"})'.replaceAll("\\/", "/"),
      'write_file({"path": "/repo/out.txt", "content": "你好"})',
      "empty_args()",
      "fallback()",
    ])
  })

  it("replays WebUI transcript records into ordered UI messages", () => {
    const messages = replayNanobotTranscriptToUIMessages(
      [
        { event: "user", text: "Inspect trace", media_paths: ["/tmp/plot.png"] },
        { event: "reasoning_delta", text: "plan " },
        {
          event: "message",
          kind: "progress",
          tool_events: [{ phase: "start", name: "read_file", arguments: { path: "/repo/a.ts" } }],
        },
        { event: "message", kind: "tool_hint", text: "legacy hint" },
        { event: "delta", text: "Answer" },
        { event: "stream_end" },
        { event: "message", text: "Final with image", media_urls: [{ url: "/api/media/image.png", name: "image.png" }], latency_ms: 14.8 },
        { event: "message", kind: "progress", text: "suppressed until turn end" },
        { event: "turn_end", latency_ms: 15.2 },
      ],
      {
        timestampBaseMS: 1000,
        idSuffix: "abcd1234",
        augmentUserMedia: (paths) => paths.map((path) => ({ kind: "image", url: `/api/media/local/${path.split("/").pop()}`, name: path.split("/").pop() })),
      },
    )

    expect(messages.map((message) => `${message.role}:${message.kind ?? "message"}`)).toEqual([
      "user:message",
      "assistant:message",
      "tool:trace",
      "assistant:message",
      "assistant:message",
    ])
    expect(messages[0]).toMatchObject({
      id: "u-0-abcd1234",
      role: "user",
      media: [{ kind: "image", url: "/api/media/local/plot.png", name: "plot.png" }],
      images: [{ url: "/api/media/local/plot.png", name: "plot.png" }],
    })
    expect(messages[1]).toMatchObject({ role: "assistant", content: "", reasoning: "plan " })
    expect(messages[2]).toMatchObject({
      role: "tool",
      kind: "trace",
      content: "legacy hint",
      traces: ['read_file({"path": "/repo/a.ts"})', "legacy hint"],
    })
    expect(messages[4]).toMatchObject({
      content: "Final with image",
      media: [{ kind: "image", url: "/api/media/image.png", name: "image.png" }],
      latencyMs: 15,
    })
    expect(messages.some((message) => message.content === "suppressed until turn end")).toBe(false)
    expect(messages.some((message) => "isStreaming" in message || "reasoningStreaming" in message)).toBe(false)
  })

  it("builds a native exact fixture with no bridge lossiness", () => {
    const fixture = buildNanobotTraceNativeExactFixture()
    const verification = verifyNanobotTraceNativeExactFixture(fixture)

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      product: "nanobot",
      atomID: nanobotTraceDebugSurfaceNativeExactAtomID,
      evidenceRef: nanobotTraceDebugSurfaceNativeExactEvidenceRef,
      fixtureID: nanobotTraceDebugSurfaceNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(fixture.replay.threadResponse).toMatchObject({
      schemaVersion: nanobotWebUITranscriptSchemaVersion,
      sessionKey: "websocket:chat-1",
    })
    expect(fixture.nativeEvidenceRefs).toEqual(expect.arrayContaining([
      nanobotTraceDebugSurfaceNativeExactEvidenceRef,
      nanobotTraceDebugSurfaceNativeExactReplayRef,
    ]))
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("nanobot/utils/webui_transcript.py#WEBUI_TRANSCRIPT_SCHEMA_VERSION"),
      expect.stringContaining("nanobot/agent/runner.py#AgentRunSpec"),
    ]))
    expect(fixture.replay.records.map((record) => record.event)).toEqual(expect.arrayContaining([
      "transcript_jsonl_append",
      "transcript_jsonl_readback",
      "tool_trace_line",
      "ui_message_fold",
      "runner_checkpoint",
    ]))
  })

  it("selects Nanobot trace as native in assembly without source-matrix bridge lossiness", () => {
    const replay = replayNanobotTraceDebugSurface({
      sessionKey: "websocket:chat-1",
      webuiDir: "/repo/.nanobot/webui",
      transcriptObjects: [{ event: "user", text: "hi" }, { event: "turn_end", latency_ms: 3 }],
      timestampBaseMS: 1000,
      idSuffix: "abcd1234",
    })
    expect(replay.threadResponse?.messages).toHaveLength(1)

    const contract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-06-17T00:00:00.000Z",
    })
    const atom = contract.atoms.find((candidate) => candidate.id === nanobotTraceDebugSurfaceNativeExactAtomID)

    expect(atom).toMatchObject({
      implementationKind: nanobotTraceDebugSurfaceNativeDescriptor.implementationKind,
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        nanobotTraceDebugSurfaceNativeExactEvidenceRef,
        nanobotTraceDebugSurfaceNativeExactReplayRef,
      ]),
      fixtureIDs: expect.arrayContaining([nanobotTraceDebugSurfaceNativeExactFixtureID]),
      knownLossiness: [],
      source: {
        packageName: "@helix/adapters-nanobot",
        exportPath: "./product-schema/trace",
      },
    })
    expect(atom?.nativeEvidenceRefs).not.toContain("conformance:nanobot-trace-source-matrix")
    expect(atom?.fixtureIDs).not.toContain("nanobot-trace:source-matrix")
  })
})
