import { describe, expect, it } from "vitest"
import {
  HermesCodexEventProjector,
  buildHermesEventNativeExactFixture,
  buildHermesToolCall,
  createHermesNormalizedResponse,
  formatHermesCodexToolArgs,
  hermesDeterministicCallID,
  hermesEventEnvelopeNativeExactAtomID,
  hermesEventNativeExactAtomIDs,
  hermesEventNativeExactEvidenceRef,
  hermesEventNativeExactFixtureID,
  hermesEventNativeExactReplayRef,
  hermesEventNativeDescriptors,
  hermesNormalizedResponseProviderField,
  hermesRuntimeEventNativeExactAtomID,
  hermesToolCallFunction,
  hermesToolCallProviderField,
  hermesToolCallType,
  mapHermesFinishReason,
  verifyHermesEventNativeExactFixture,
} from "@helix/adapters-hermes/product-schema/events"
import { buildAssemblyContract } from "@helix/recipes"

describe("Hermes event native exact conformance", () => {
  it("matches upstream ToolCall and NormalizedResponse compatibility properties", () => {
    const toolCall = buildHermesToolCall("tc-1", "write_file", { b: "β", a: 1 }, { call_id: "call-1", response_item_id: "fc-1" })
    const response = createHermesNormalizedResponse({
      content: "answer",
      tool_calls: [toolCall],
      finish_reason: mapHermesFinishReason("tool_use", { tool_use: "tool_calls" }),
      provider_data: {
        reasoning_content: "think",
        codex_message_items: [{ id: "msg_1" }],
      },
    })

    expect(toolCall.arguments).toBe('{"b": "\\u03b2", "a": 1}')
    expect(hermesToolCallType(toolCall)).toBe("function")
    expect(hermesToolCallFunction(toolCall)).toBe(toolCall)
    expect(hermesToolCallProviderField(toolCall, "call_id")).toBe("call-1")
    expect(hermesToolCallProviderField(toolCall, "response_item_id")).toBe("fc-1")
    expect(response.finish_reason).toBe("tool_calls")
    expect(mapHermesFinishReason(undefined, { tool_use: "tool_calls" })).toBe("stop")
    expect(hermesNormalizedResponseProviderField(response, "reasoning_content")).toBe("think")
    expect(hermesNormalizedResponseProviderField(response, "codex_message_items")).toEqual([{ id: "msg_1" }])
  })

  it("projects reasoning and commandExecution item/completed events like upstream", () => {
    const projector = new HermesCodexEventProjector()

    expect(projector.project({ method: "item/agentMessage/outputDelta", params: { item: { type: "agentMessage", text: "streaming" } } })).toEqual({
      messages: [],
      is_tool_iteration: false,
      final_text: null,
    })
    expect(projector.project({ method: "item/completed", params: { item: { type: "reasoning", summary: ["plan"], content: ["detail"] } } }).messages).toEqual([])
    const result = projector.project({
      method: "item/completed",
      params: {
        item: {
          id: "cmd-1",
          type: "commandExecution",
          command: "npm test",
          cwd: "/repo",
          aggregatedOutput: "boom",
          exitCode: 2,
        },
      },
    })

    expect(result.is_tool_iteration).toBe(true)
    expect(result.messages[0]).toMatchObject({
      role: "assistant",
      content: null,
      reasoning: "plan\ndetail",
      tool_calls: [
        {
          id: "codex_exec_cmd-1",
          type: "function",
          function: {
            name: "exec_command",
            arguments: '{"command": "npm test", "cwd": "/repo"}',
          },
        },
      ],
    })
    expect(result.messages[1]).toEqual({
      role: "tool",
      tool_call_id: "codex_exec_cmd-1",
      content: "[exit 2]\nboom",
    })
  })

  it("projects file, MCP, dynamic, user, agent, and opaque items", () => {
    const projector = new HermesCodexEventProjector()
    const file = projector.project({
      method: "item/completed",
      params: {
        item: {
          id: "file-1",
          type: "fileChange",
          status: "done",
          changes: [
            { kind: { type: "add" }, path: "src/new.ts" },
            { path: "src/existing.ts" },
          ],
        },
      },
    })
    const mcp = projector.project({
      method: "item/completed",
      params: {
        item: {
          id: "mcp-1",
          type: "mcpToolCall",
          server: "github",
          tool: "list",
          arguments: { z: 1, a: "你好" },
          result: { ok: true, value: "世界" },
        },
      },
    })
    const dynamic = projector.project({
      method: "item/completed",
      params: {
        item: {
          id: "dyn-1",
          type: "dynamicToolCall",
          tool: "inspect",
          arguments: ["raw"],
          success: false,
        },
      },
    })
    const user = projector.project({
      method: "item/completed",
      params: {
        item: {
          type: "userMessage",
          content: [{ type: "text", text: "hello" }, { type: "image", url: "file:///tmp/screen.png" }, { text: 42 }],
        },
      },
    })
    const opaque = projector.project({ method: "item/completed", params: { item: { type: "plan", steps: ["one"] } } })
    const agent = projector.project({ method: "item/completed", params: { item: { type: "agentMessage", text: "final" } } })

    expect(file.messages[0]).toMatchObject({
      tool_calls: [
        {
          id: "codex_apply_patch_file-1",
          function: {
            name: "apply_patch",
            arguments: '{"changes": [{"kind": "add", "path": "src/new.ts"}, {"kind": "update", "path": "src/existing.ts"}]}',
          },
        },
      ],
    })
    expect(file.messages[1]).toMatchObject({ content: "apply_patch status=done, 2 change(s)" })
    expect(mcp.messages[0]).toMatchObject({
      tool_calls: [
        {
          id: "codex_mcp_github_list_mcp-1",
          function: {
            name: "mcp.github.list",
            arguments: '{"a": "你好", "z": 1}',
          },
        },
      ],
    })
    expect(mcp.messages[1]).toMatchObject({ content: '{"ok": true, "value": "世界"}' })
    expect(dynamic.messages[0]).toMatchObject({
      tool_calls: [
        {
          id: "codex_dyn_inspect_dyn-1",
          function: {
            name: "inspect",
            arguments: '{"arguments": ["raw"]}',
          },
        },
      ],
    })
    expect(dynamic.messages[1]).toMatchObject({ content: "success=False" })
    expect(user.messages).toEqual([{ role: "user", content: "hello\n42" }])
    expect(opaque.messages[0]?.content).toContain("[codex plan]")
    expect(agent).toEqual({ messages: [{ role: "assistant", content: "final" }], is_tool_iteration: false, final_text: "final" })
  })

  it("builds a native exact fixture with no bridge lossiness", () => {
    const fixture = buildHermesEventNativeExactFixture()
    const verification = verifyHermesEventNativeExactFixture(fixture)

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      product: "hermes-agent",
      atomIDs: [...hermesEventNativeExactAtomIDs],
      evidenceRef: hermesEventNativeExactEvidenceRef,
      fixtureID: hermesEventNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(fixture.nativeEvidenceRefs).toEqual(expect.arrayContaining([
      hermesEventNativeExactEvidenceRef,
      hermesEventNativeExactReplayRef,
    ]))
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("agent/transports/types.py#ToolCall"),
      expect.stringContaining("agent/transports/codex_event_projector.py#_deterministic_call_id"),
    ]))
    expect(formatHermesCodexToolArgs({ z: 1, a: "你好" })).toBe('{"a": "你好", "z": 1}')
    expect(hermesDeterministicCallID("exec", "")).toBe("codex_exec_2706c619fe73f0cf")
  })

  it("selects Hermes event atoms as native in assembly without source-matrix bridge lossiness", () => {
    const contract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-06-13T00:00:00.000Z",
    })

    for (const descriptor of hermesEventNativeDescriptors) {
      const atom = contract.atoms.find((candidate) => candidate.id === descriptor.id)
      expect(atom).toMatchObject({
        implementationKind: descriptor.implementationKind,
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          hermesEventNativeExactEvidenceRef,
          hermesEventNativeExactReplayRef,
        ]),
        fixtureIDs: expect.arrayContaining([hermesEventNativeExactFixtureID]),
        knownLossiness: [],
        source: {
          packageName: "@helix/adapters-hermes",
          exportPath: "./product-schema/events",
        },
      })
      expect(atom?.nativeEvidenceRefs).not.toContain("conformance:hermes-event-source-matrix")
      expect(atom?.fixtureIDs).not.toContain("hermes-event:source-matrix")
    }
    expect(contract.atoms.find((candidate) => candidate.id === hermesEventEnvelopeNativeExactAtomID)?.provides).toContain("event.envelope")
    expect(contract.atoms.find((candidate) => candidate.id === hermesRuntimeEventNativeExactAtomID)?.provides).toContain("event.log")
  })
})
