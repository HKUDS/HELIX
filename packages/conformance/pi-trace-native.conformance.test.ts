import { describe, expect, it } from "vitest"
import {
  buildPiMonoTraceNativeExactFixture,
  piMonoTraceDebugSurfaceNativeDescriptor,
  piMonoTraceDebugSurfaceNativeExactAtomID,
  piMonoTraceDebugSurfaceNativeExactEvidenceRef,
  piMonoTraceDebugSurfaceNativeExactFixtureID,
  piMonoTraceDebugSurfaceNativeExactReplayRef,
  readPiMonoSessionJsonlTrace,
  replayPiMonoSessionRuntimeTrace,
  verifyPiMonoTraceNativeExactFixture,
} from "@helix/adapters-pi/product-schema/trace"
import { buildAssemblyContract } from "@helix/recipes"

describe("Pi trace debug-surface native exact conformance", () => {
  it("replays upstream AgentSessionRuntime lifecycle order and JSONL readback", () => {
    const jsonl = [
      JSON.stringify({ type: "session", version: 3, id: "s1", timestamp: "2026-06-01T00:00:00.000Z", cwd: "/repo" }),
      JSON.stringify({ type: "message", id: "u1", parentId: null, timestamp: "2026-06-01T00:00:01.000Z", message: { role: "user", content: [{ type: "text", text: "hello" }] } }),
    ].join("\n")
    const trace = replayPiMonoSessionRuntimeTrace({
      currentSessionFile: "/repo/.pi/current.jsonl",
      actions: [
        { type: "switch", targetSessionFile: "/repo/.pi/resume.jsonl" },
        {
          type: "fork",
          entry: { type: "message", id: "u1", parentId: null, timestamp: "2026-06-01T00:00:01.000Z", message: { role: "user", content: [{ type: "text", text: "hello" }] } },
          position: "before",
          nextSessionFile: "/repo/.pi/fork.jsonl",
        },
        { type: "import", inputPath: "/tmp/import.jsonl", destinationPath: "/repo/.pi/import.jsonl", jsonl },
        { type: "switch", targetSessionFile: "/repo/.pi/cancelled.jsonl", cancelled: true },
      ],
    })

    expect(trace.records.map((record) => record.event)).toEqual(expect.arrayContaining([
      "session_before_switch",
      "session_shutdown",
      "session_start",
      "session_rebind",
      "session_before_fork",
      "import_copy",
      "jsonl_readback",
    ]))
    expect(trace.records.find((record) => record.event === "session_before_fork")).toMatchObject({
      selectedText: "hello",
      source: "agent-session-runtime",
      flowProjection: "runtime-lifecycle",
    })
    expect(trace.jsonlReadbackRecords.map((record) => record.entryType)).toEqual(["session", "message"])
    expect(trace.jsonlReadbackRecords[1]).toMatchObject({
      role: "user",
      contentText: "hello",
      redaction: "none-upstream-jsonl-storage",
      flowProjection: "session-jsonl-readback",
    })
    const cancelledIndex = trace.records.findIndex((record) => record.targetSessionFile === "/repo/.pi/cancelled.jsonl")
    expect(trace.records.slice(cancelledIndex + 1).some((record) => record.targetSessionFile === "/repo/.pi/cancelled.jsonl" && record.event === "session_start")).toBe(false)
  })

  it("projects Pi session-format JSONL lines as ordered trace readback records", () => {
    const readback = readPiMonoSessionJsonlTrace([
      JSON.stringify({ type: "session", version: 3, id: "s1", timestamp: "2026-06-01T00:00:00.000Z", cwd: "/repo" }),
      JSON.stringify({ type: "message", id: "u1", parentId: null, timestamp: "2026-06-01T00:00:01.000Z", message: { role: "user", content: "plain text" } }),
      JSON.stringify({ type: "compaction", id: "c1", parentId: "u1", timestamp: "2026-06-01T00:00:02.000Z", summary: "summary", firstKeptEntryId: "u1" }),
    ].join("\n"))

    expect(readback.map((record) => record.entryType)).toEqual(["session", "message", "compaction"])
    expect(readback[1]).toMatchObject({
      entryID: "u1",
      parentID: null,
      role: "user",
      contentText: "plain text",
      redaction: "none-upstream-jsonl-storage",
    })
  })

  it("builds a native exact fixture with no bridge lossiness", () => {
    const fixture = buildPiMonoTraceNativeExactFixture()
    const verification = verifyPiMonoTraceNativeExactFixture(fixture)

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      product: "pi-mono",
      atomID: piMonoTraceDebugSurfaceNativeExactAtomID,
      evidenceRef: piMonoTraceDebugSurfaceNativeExactEvidenceRef,
      fixtureID: piMonoTraceDebugSurfaceNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(fixture.nativeEvidenceRefs).toEqual(expect.arrayContaining([
      piMonoTraceDebugSurfaceNativeExactEvidenceRef,
      piMonoTraceDebugSurfaceNativeExactReplayRef,
    ]))
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("agent-session-runtime.ts#AgentSessionRuntime.switchSession"),
      expect.stringContaining("session-format.md#SessionFileFormat"),
    ]))
    expect(fixture.replay.records.some((record) => record.event === "jsonl_readback")).toBe(true)
  })

  it("selects Pi trace as native in assembly without source-matrix bridge lossiness", () => {
    const contract = buildAssemblyContract({
      product: "pi-mono",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-06-13T00:00:00.000Z",
    })
    const atom = contract.atoms.find((candidate) => candidate.id === piMonoTraceDebugSurfaceNativeExactAtomID)

    expect(atom).toMatchObject({
      implementationKind: piMonoTraceDebugSurfaceNativeDescriptor.implementationKind,
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoTraceDebugSurfaceNativeExactEvidenceRef,
        piMonoTraceDebugSurfaceNativeExactReplayRef,
      ]),
      fixtureIDs: expect.arrayContaining([piMonoTraceDebugSurfaceNativeExactFixtureID]),
      knownLossiness: [],
      source: {
        packageName: "@helix/adapters-pi",
        exportPath: "./product-schema/trace",
      },
    })
    expect(atom?.nativeEvidenceRefs).not.toContain("conformance:pi-trace-source-matrix")
    expect(atom?.fixtureIDs).not.toContain("pi-trace:source-matrix")
  })
})
