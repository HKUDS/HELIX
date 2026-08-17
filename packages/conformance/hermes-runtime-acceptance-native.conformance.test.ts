import { describe, expect, it } from "vitest"
import {
  buildHermesRuntimeAcceptanceNativeExactFixture,
  buildHermesRuntimeFooterLine,
  hermesRuntimeAcceptanceControllerNativeExactAtomID,
  hermesRuntimeAcceptanceEvidenceNativeExactAtomID,
  hermesRuntimeAcceptanceNativeDescriptors,
  hermesRuntimeAcceptanceNativeExactAtomIDs,
  hermesRuntimeAcceptanceNativeExactEvidenceRef,
  hermesRuntimeAcceptanceNativeExactFixtureID,
  hermesRuntimeAcceptanceNativeExactReplayRef,
  projectHermesCodexEventStream,
  projectHermesCodexStreamCreateAttempts,
  verifyHermesRuntimeAcceptanceNativeExactFixture,
} from "@helix/lego-runtime/product-schema/hermes"
import { buildAssemblyContract } from "@helix/recipes"

describe("Hermes runtime acceptance native exact conformance", () => {
  it("pins Codex runtime streaming, app-server turn, retry, and footer behavior to native exact fixtures", () => {
    const fixture = buildHermesRuntimeAcceptanceNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "hermes-agent",
      atomIDs: [
        hermesRuntimeAcceptanceControllerNativeExactAtomID,
        hermesRuntimeAcceptanceEvidenceNativeExactAtomID,
      ],
      portIDs: ["runtime.acceptance-controller", "runtime.acceptance-evidence"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        hermesRuntimeAcceptanceNativeExactEvidenceRef,
        hermesRuntimeAcceptanceNativeExactReplayRef,
      ]),
      fixtureIDs: [hermesRuntimeAcceptanceNativeExactFixtureID],
      knownLossiness: [],
      intentionallyBridgeAtoms: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "app-server-session-lifecycle",
      "app-server-review-and-memory-sync-gates",
      "raw-responses-stream-reconstruction",
      "stream-callbacks-interrupt-and-retry",
      "runtime-footer-resolution",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "agent/codex_runtime.py#run_codex_app_server_turn,_event_field,_raise_stream_error,_consume_codex_event_stream,run_codex_stream,run_codex_create_stream_fallback",
      "agent/agent_runtime_helpers.py#repair_message_sequence,sanitize_tool_call_arguments,recover_with_credential_pool,try_recover_primary_transport,cleanup_dead_connections,force_close_tcp_sockets",
      "gateway/runtime_footer.py#_home_relative_cwd,_model_short,resolve_footer_config,format_runtime_footer,build_footer_line",
    ]))

    expect(projectHermesCodexEventStream([
      { type: "response.output_text.delta", text: "Hel" },
      { type: "response.output_text.delta", text: "lo" },
      { type: "response.completed", response: { id: "resp_1", status: "completed", usage: { output_tokens: 1 }, output: [{ type: "terminal" }] } },
    ])).toMatchObject({
      responseID: "resp_1",
      status: "completed",
      output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: "Hello" }] }],
      synthesizedMessageFromTextDeltas: true,
      terminalOutputIgnored: true,
    })
    expect(() => projectHermesCodexEventStream([{ type: "error", error: { message: "boom" } }])).toThrow("boom")
    expect(projectHermesCodexStreamCreateAttempts({ connectionFailuresBeforeSuccess: 1 })).toMatchObject({
      createAttempts: 2,
      retriedAfterConnectionFailure: true,
      finalOutcome: "completed",
    })
    expect(buildHermesRuntimeFooterLine({
      enabled: true,
      model: "openai/gpt-5.1",
      cwd: "/home/user/project",
      home: "/home/user",
      contextPercent: 148,
    })).toBe("[runtime model=gpt-5.1 cwd=~/project context=100%]")

    expect(verifyHermesRuntimeAcceptanceNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(hermesRuntimeAcceptanceNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      ...hermesRuntimeAcceptanceNativeExactAtomIDs,
    ])
    for (const descriptor of hermesRuntimeAcceptanceNativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "hermes-agent",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          hermesRuntimeAcceptanceNativeExactEvidenceRef,
          hermesRuntimeAcceptanceNativeExactReplayRef,
        ]),
        fixtureIDs: [hermesRuntimeAcceptanceNativeExactFixtureID],
        knownLossiness: [],
      })
    }

    const contract = buildAssemblyContract({ product: "hermes-agent" })
    for (const atomID of hermesRuntimeAcceptanceNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        sourcePackage: "@helix/lego-runtime",
        publicExport: "./product-schema/hermes",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          hermesRuntimeAcceptanceNativeExactEvidenceRef,
          hermesRuntimeAcceptanceNativeExactReplayRef,
        ]),
        fixtureIDs: [hermesRuntimeAcceptanceNativeExactFixtureID],
      })
    }

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "runtime-footer-resolution"
          ? { ...item, output: { ...item.output, enabledFooter: "[runtime model=gpt-5.1 cwd=/home/user/project context=148%]" } }
          : item,
      ),
    }
    expect(verifyHermesRuntimeAcceptanceNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "hermes-runtime-acceptance-native-exact.fingerprint" }),
      expect.objectContaining({ id: "hermes-runtime-acceptance-native-exact.cases" }),
    ]))
  })
})
