import { describe, expect, it } from "vitest"
import {
  buildNanobotRuntimeAcceptanceNativeExactFixture,
  nanobotRuntimeAcceptanceControllerNativeExactAtomID,
  nanobotRuntimeAcceptanceEvidenceNativeExactAtomID,
  nanobotRuntimeAcceptanceNativeDescriptors,
  nanobotRuntimeAcceptanceNativeExactAtomIDs,
  nanobotRuntimeAcceptanceNativeExactEvidenceRef,
  nanobotRuntimeAcceptanceNativeExactFixtureID,
  nanobotRuntimeAcceptanceNativeExactReplayRef,
  projectNanobotExternalLookupAttempts,
  projectNanobotRuntimeToolResult,
  projectNanobotWorkspaceViolationAttempts,
  verifyNanobotRuntimeAcceptanceNativeExactFixture,
} from "@helix/lego-runtime/product-schema/nanobot"
import { buildAssemblyContract } from "@helix/recipes"

describe("Nanobot runtime acceptance native exact conformance", () => {
  it("pins runtime.py and RuntimeState acceptance behavior to native exact fixtures", () => {
    const fixture = buildNanobotRuntimeAcceptanceNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "nanobot",
      atomIDs: [
        nanobotRuntimeAcceptanceControllerNativeExactAtomID,
        nanobotRuntimeAcceptanceEvidenceNativeExactAtomID,
      ],
      portIDs: ["runtime.acceptance-controller", "runtime.acceptance-evidence"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        nanobotRuntimeAcceptanceNativeExactEvidenceRef,
        nanobotRuntimeAcceptanceNativeExactReplayRef,
      ]),
      fixtureIDs: [nanobotRuntimeAcceptanceNativeExactFixtureID],
      knownLossiness: [],
      intentionallyBridgeAtoms: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "empty-tool-result-normalization",
      "finalization-and-length-recovery-prompts",
      "external-lookup-repeat-budget",
      "workspace-violation-hard-boundary",
      "runtime-state-protocol-surface",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "nanobot/utils/runtime.py#empty_tool_result_message,ensure_nonempty_tool_result,is_blank_text,build_finalization_retry_message,build_length_recovery_message,external_lookup_signature,repeated_external_lookup_error,workspace_violation_signature,_normalize_violation_target,repeated_workspace_violation_error",
      "nanobot/agent/tools/runtime_state.py#RuntimeState,model,max_iterations,current_iteration,tool_names,workspace,provider_retry_mode,max_tool_result_chars,context_window_tokens,web_config,exec_config,subagents,_runtime_vars,_last_usage,_sync_subagent_runtime_limits,model_preset",
    ]))

    expect(projectNanobotRuntimeToolResult("shell", "   ")).toBe("Tool shell returned no visible content.")
    expect(projectNanobotExternalLookupAttempts([
      { toolName: "web_search", args: { query: "runtime acceptance" } },
      { toolName: "web_search", args: { query: "runtime acceptance" } },
      { toolName: "web_search", args: { query: "runtime acceptance" } },
    ])).toEqual([
      expect.objectContaining({ count: 1, decision: "allow" }),
      expect.objectContaining({ count: 2, decision: "allow" }),
      expect.objectContaining({ count: 3, decision: "block" }),
    ])
    expect(projectNanobotWorkspaceViolationAttempts([
      { toolName: "read_file", args: { path: "/etc/passwd" } },
      { toolName: "read_file", args: { path: "/etc/passwd/" } },
      { toolName: "shell", args: { command: "cat /etc/passwd" } },
    ])).toEqual([
      expect.objectContaining({ signature: "target:/etc/passwd", count: 1, decision: "allow" }),
      expect.objectContaining({ signature: "target:/etc/passwd", count: 2, decision: "allow" }),
      expect.objectContaining({ signature: "target:/etc/passwd", count: 3, decision: "block" }),
    ])

    expect(verifyNanobotRuntimeAcceptanceNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(nanobotRuntimeAcceptanceNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      ...nanobotRuntimeAcceptanceNativeExactAtomIDs,
    ])
    for (const descriptor of nanobotRuntimeAcceptanceNativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "nanobot",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotRuntimeAcceptanceNativeExactEvidenceRef,
          nanobotRuntimeAcceptanceNativeExactReplayRef,
        ]),
        fixtureIDs: [nanobotRuntimeAcceptanceNativeExactFixtureID],
        knownLossiness: [],
      })
    }

    const contract = buildAssemblyContract({ product: "nanobot" })
    for (const atomID of nanobotRuntimeAcceptanceNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        sourcePackage: "@helix/lego-runtime",
        publicExport: "./product-schema/nanobot",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotRuntimeAcceptanceNativeExactEvidenceRef,
          nanobotRuntimeAcceptanceNativeExactReplayRef,
        ]),
        fixtureIDs: [nanobotRuntimeAcceptanceNativeExactFixtureID],
      })
    }

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "external-lookup-repeat-budget"
          ? { ...item, output: { ...item.output, blockedAttempt: undefined } }
          : item,
      ),
    }
    expect(verifyNanobotRuntimeAcceptanceNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "nanobot-runtime-acceptance-native-exact.fingerprint" }),
      expect.objectContaining({ id: "nanobot-runtime-acceptance-native-exact.cases" }),
    ]))
  })
})
