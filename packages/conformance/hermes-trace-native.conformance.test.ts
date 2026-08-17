import { describe, expect, it } from "vitest"
import {
  appendHermesTrajectoryJSONL,
  buildHermesTraceNativeExactFixture,
  classifyHermesFileMutationTrace,
  convertHermesTraceScratchpadToThink,
  hasHermesTraceIncompleteScratchpad,
  hermesTraceDebugSurfaceNativeDescriptor,
  hermesTraceDebugSurfaceNativeExactAtomID,
  hermesTraceDebugSurfaceNativeExactEvidenceRef,
  hermesTraceDebugSurfaceNativeExactFixtureID,
  hermesTraceDebugSurfaceNativeExactReplayRef,
  replayHermesTraceDebugSurface,
  verifyHermesTraceNativeExactFixture,
} from "@helix/adapters-hermes/product-schema/trace"
import { buildAssemblyContract } from "@helix/recipes"

describe("Hermes trace debug-surface native exact conformance", () => {
  it("matches upstream scratchpad conversion and incomplete detection", () => {
    expect(convertHermesTraceScratchpadToThink("<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>done")).toBe("<think>plan</think>done")
    expect(convertHermesTraceScratchpadToThink("plain answer")).toBe("plain answer")
    expect(hasHermesTraceIncompleteScratchpad("<REASONING_SCRATCHPAD>plan")).toBe(true)
    expect(hasHermesTraceIncompleteScratchpad("<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>")).toBe(false)
    expect(hasHermesTraceIncompleteScratchpad("")).toBe(false)
  })

  it("serializes trajectory JSONL like Python json.dumps ensure_ascii false", () => {
    const completed = appendHermesTrajectoryJSONL({
      trajectory: [
        { from: "human", value: "你好" },
        { from: "gpt", value: "<think>plan</think>done" },
      ],
      model: "nous/hermes-4",
      completed: true,
      timestamp: "2026-06-13T12:10:42.949000",
    })
    const failed = appendHermesTrajectoryJSONL({
      trajectory: [{ from: "gpt", value: "partial" }],
      model: "nous/hermes-4",
      completed: false,
      timestamp: "2026-06-13T12:11:00.000000",
    })

    expect(completed.filename).toBe("trajectory_samples.jsonl")
    expect(failed.filename).toBe("failed_trajectories.jsonl")
    expect(completed.line).toBe('{"conversations": [{"from": "human", "value": "你好"}, {"from": "gpt", "value": "<think>plan</think>done"}], "timestamp": "2026-06-13T12:10:42.949000", "model": "nous/hermes-4", "completed": true}\n')
    expect(completed.line).toContain("你好")
    expect(completed.line).not.toContain("\\u4f60")
  })

  it("matches upstream file mutation result classification", () => {
    expect(classifyHermesFileMutationTrace("write_file", '{"bytes_written": 0}')).toBe(true)
    expect(classifyHermesFileMutationTrace("write_file", '{"error": {}, "bytes_written": 12}')).toBe(true)
    expect(classifyHermesFileMutationTrace("patch", '{"success": true}')).toBe(true)
    expect(classifyHermesFileMutationTrace("patch", '{"error": [], "success": true}')).toBe(true)
    expect(classifyHermesFileMutationTrace("patch", '{"success": false}')).toBe(false)
    expect(classifyHermesFileMutationTrace("write_file", '{"error": "permission denied", "bytes_written": 12}')).toBe(false)
    expect(classifyHermesFileMutationTrace("read_file", '{"bytes_written": 12}')).toBe(false)
    expect(classifyHermesFileMutationTrace("write_file", "not-json")).toBe(false)
    expect(classifyHermesFileMutationTrace("write_file", 12)).toBe(false)
  })

  it("replays the Hermes trace debug surface across trajectory and tool outcomes", () => {
    const replay = replayHermesTraceDebugSurface({
      scratchpads: ["<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>done"],
      trajectories: [
        {
          trajectory: [{ from: "human", value: "trace" }],
          model: "nous/hermes-4",
          completed: true,
          timestamp: "2026-06-13T12:10:42.949000",
        },
      ],
      toolResults: [
        { toolName: "write_file", result: '{"bytes_written": 1}' },
        { toolName: "patch", result: '{"success": false}' },
      ],
    })

    expect(replay.records.map((record) => record.event)).toEqual([
      "scratchpad_to_think",
      "scratchpad_incomplete_check",
      "trajectory_jsonl_append",
      "file_mutation_result_landed",
      "file_mutation_result_landed",
    ])
    expect(replay.landedToolNames).toEqual(["write_file"])
    expect(replay.nonLandedToolNames).toEqual(["patch"])
    expect(replay.records[0]).toMatchObject({
      source: "agent.trajectory",
      outputText: "<think>plan</think>done",
      flowProjection: "scratchpad-surface",
    })
    expect(replay.records[2]).toMatchObject({
      filename: "trajectory_samples.jsonl",
      flowProjection: "trajectory-jsonl",
    })
  })

  it("builds a native exact fixture with no bridge lossiness", () => {
    const fixture = buildHermesTraceNativeExactFixture()
    const verification = verifyHermesTraceNativeExactFixture(fixture)

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      product: "hermes-agent",
      atomID: hermesTraceDebugSurfaceNativeExactAtomID,
      evidenceRef: hermesTraceDebugSurfaceNativeExactEvidenceRef,
      fixtureID: hermesTraceDebugSurfaceNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(fixture.nativeEvidenceRefs).toEqual(expect.arrayContaining([
      hermesTraceDebugSurfaceNativeExactEvidenceRef,
      hermesTraceDebugSurfaceNativeExactReplayRef,
    ]))
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("agent/trajectory.py#convert_scratchpad_to_think"),
      expect.stringContaining("agent/tool_result_classification.py#FILE_MUTATING_TOOL_NAMES"),
    ]))
    expect(fixture.replay.records.filter((record) => record.event === "file_mutation_result_landed" && record.landed)).toHaveLength(3)
  })

  it("selects Hermes trace as native in assembly without source-matrix bridge lossiness", () => {
    const contract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-06-13T00:00:00.000Z",
    })
    const atom = contract.atoms.find((candidate) => candidate.id === hermesTraceDebugSurfaceNativeExactAtomID)

    expect(atom).toMatchObject({
      implementationKind: hermesTraceDebugSurfaceNativeDescriptor.implementationKind,
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        hermesTraceDebugSurfaceNativeExactEvidenceRef,
        hermesTraceDebugSurfaceNativeExactReplayRef,
      ]),
      fixtureIDs: expect.arrayContaining([hermesTraceDebugSurfaceNativeExactFixtureID]),
      knownLossiness: [],
      source: {
        packageName: "@helix/adapters-hermes",
        exportPath: "./product-schema/trace",
      },
    })
    expect(atom?.nativeEvidenceRefs).not.toContain("conformance:hermes-trace-source-matrix")
    expect(atom?.fixtureIDs).not.toContain("hermes-trace:source-matrix")
  })
})
