import { describe, expect, it } from "vitest"
import {
  buildPiMonoToolRuntimeNativeExactFixture,
  piMonoToolRuntimeNativeDescriptors,
  piMonoToolRuntimeNativeExactAtomIDs,
  projectPiMonoBashProcessRunner,
  projectPiMonoToolCallHook,
  projectPiMonoToolExecutionEvents,
  projectPiMonoToolResultPatch,
  projectPiMonoWorkspaceFilesystem,
  verifyPiMonoToolRuntimeNativeExactFixture,
} from "@helix/adapters-pi/product-schema/tool-runtime"
import { buildAssemblyContract } from "@helix/recipes"

describe("Pi tool runtime native exact fixture", () => {
  it("captures upstream tool permission, runtime event, result, process, filesystem, and render behavior", () => {
    const fixture = buildPiMonoToolRuntimeNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
        "pi.permission.event-bridge",
        "pi.process-runner-bridge",
        "pi.tool.event-render-bridge",
        "pi.tool.result-event-bridge",
        "pi.tool.runtime-event-bridge",
        "pi.workspace-filesystem-bridge",
      ],
      upstreamRef: "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      evidenceRef: "conformance:pi-tool-runtime-native-exact-fixture",
      fixtureID: "pi-tool-runtime:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: ["conformance:pi-tool-runtime-native-exact-fixture", "tool-runtime-native-exact:pi-mono"],
      fixtureIDs: ["pi-tool-runtime:native-exact-fixture"],
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.portIDs).toEqual([
      "filesystem.port",
      "process-runner.port",
      "tool.audit-log",
      "tool.executor",
      "tool.permission-policy",
      "tool.result-normalizer",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/agent/src/agent-loop.ts#executeToolCalls,prepareToolCall,executePreparedToolCall,finalizeExecutedToolCall,createToolResultMessage"),
      expect.stringContaining("packages/coding-agent/src/core/tools/bash.ts#createLocalBashOperations,createBashToolDefinition,resolveSpawnContext"),
      expect.stringContaining("packages/coding-agent/src/core/tools/path-utils.ts#resolveToCwd,resolveReadPath,resolveReadPathAsync"),
      expect.stringContaining("packages/coding-agent/src/core/tools/file-mutation-queue.ts#withFileMutationQueue"),
      expect.stringContaining("packages/coding-agent/src/modes/interactive/components/tool-execution.ts#ToolExecutionComponent.getCallRenderer,getResultRenderer,getRenderShell"),
    ]))
    expect(fixture.policy).toMatchObject({
      toolCallHookRunsAfterPrepareAndValidation: true,
      toolCallInputMutationsAreInPlaceAndNotRevalidated: true,
      toolCallBlockCreatesImmediateErrorResult: true,
      toolExecutionStartEmitsBeforePreparation: true,
      toolExecutionUpdatesUseToolOnUpdatePartialResult: true,
      toolExecutionEndPrecedesToolResultMessage: true,
      parallelResultMessagesRetainSourceToolCallOrder: true,
      afterToolCallCanPatchContentDetailsTerminateAndIsError: true,
      localBashRunnerUsesShellConfigAndProcessTreeKill: true,
      workspaceReadUsesPiPathVariantResolution: true,
      workspaceMutationsSerializePerResolvedFile: true,
      tuiAndHtmlRenderersInvokeToolDefinitionRenderers: true,
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "tool-call-hook-permission-block-and-mutable-input",
      "tool-result-patch-and-message-projection",
      "runtime-tool-events-sequential-and-parallel",
      "bash-process-runner-output-and-error-policy",
      "workspace-filesystem-read-write-edit-and-queue",
      "tool-renderer-resolution-and-html-export",
    ])
    expect(verifyPiMonoToolRuntimeNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
  })

  it("projects the native tool hook, result, runtime event, bash, and filesystem semantics", () => {
    expect(projectPiMonoToolCallHook({
      toolCallId: "toolu_1",
      toolName: "bash",
      args: { command: "npm test" },
      handlers: [
        { extensionPath: "/extensions/a.ts", mutateInput: { timeout: 10 } },
        { extensionPath: "/extensions/b.ts", result: { block: true, reason: "blocked" } },
      ],
    })).toMatchObject({
      emitted: true,
      visited: ["/extensions/a.ts:tool_call:1", "/extensions/b.ts:tool_call:2"],
      finalInput: { command: "npm test", timeout: 10 },
      block: true,
      immediateResult: { content: [{ type: "text", text: "blocked" }], details: {} },
      executionSkipped: true,
    })

    expect(projectPiMonoToolResultPatch({
      toolCallId: "toolu_2",
      toolName: "read",
      result: { content: [{ type: "text", text: "original" }], details: { original: true } },
      isError: false,
      handlers: [{ extensionPath: "/extensions/result.ts", patch: { details: { patched: true }, isError: true, terminate: true } }],
    })).toMatchObject({
      modified: true,
      result: { content: [{ type: "text", text: "original" }], details: { patched: true }, terminate: true },
      isError: true,
      message: {
        role: "toolResult",
        toolCallId: "toolu_2",
        toolName: "read",
        timestampSource: "Date.now",
      },
    })

    const events = projectPiMonoToolExecutionEvents("parallel", [
      { id: "toolu_a", name: "read", args: { path: "a.ts" }, result: { content: [{ type: "text", text: "A" }] }, completionRank: 2 },
      { id: "toolu_b", name: "bash", args: { command: "echo B" }, updates: [{ content: [{ type: "text", text: "B" }] }], result: { content: [{ type: "text", text: "B" }] }, completionRank: 1 },
    ])
    expect(events.executionEndOrder).toEqual(["toolu_b", "toolu_a"])
    expect(events.resultMessageOrder).toEqual(["toolu_a", "toolu_b"])
    expect(events.events.map((event) => event.type)).toEqual([
      "tool_execution_start",
      "tool_execution_start",
      "tool_execution_update",
      "tool_execution_end",
      "tool_execution_end",
      "message_start",
      "message_end",
      "message_start",
      "message_end",
    ])

    expect(projectPiMonoBashProcessRunner({
      command: "npm test",
      cwd: "/missing",
      cwdExists: false,
    })).toMatchObject({
      outcome: "cwd-missing",
      errorText: "Working directory does not exist: /missing\nCannot execute bash commands.",
      localExecution: {
        validatesCwdBeforeSpawn: true,
        timeoutKillsProcessTree: true,
        abortKillsProcessTree: true,
      },
    })

    const workspace = projectPiMonoWorkspaceFilesystem()
    expect(workspace.readPathCandidates).toEqual(expect.arrayContaining([
      "/workspace/pi/Capture d'ecran 10.11.12 AM.png",
      "/workspace/pi/Capture d'ecran 10.11.12\u202FAM.png",
      "/workspace/pi/Capture d\u2019ecran 10.11.12 AM.png",
    ]))
    expect(workspace.readLimitResult.content[0]).toMatchObject({
      type: "text",
      text: "one\ntwo\n\n[1 more lines in file. Use offset=3 to continue.]",
    })
    expect(workspace.writeResult.operations).toEqual(["abort-check", "mkdir-recursive", "abort-check", "write-file-utf8", "abort-check"])
    expect(workspace.editResult.result).toMatchObject({
      content: [{ type: "text", text: "Successfully replaced 1 block(s) in src/existing.ts." }],
    })
  })

  it("exposes native descriptors for the Pi tool runtime atom group", () => {
    expect(piMonoToolRuntimeNativeDescriptors.map((descriptor) => [descriptor.id, descriptor.port])).toEqual([
      ["pi.permission.event-bridge", "tool.permission-policy"],
      ["pi.process-runner-bridge", "process-runner.port"],
      ["pi.tool.event-render-bridge", "tool.executor"],
      ["pi.tool.result-event-bridge", "tool.result-normalizer"],
      ["pi.tool.runtime-event-bridge", "tool.audit-log"],
      ["pi.workspace-filesystem-bridge", "filesystem.port"],
    ])
    expect(piMonoToolRuntimeNativeDescriptors.every((descriptor) => descriptor.implementationKind === "factory")).toBe(true)
    expect(piMonoToolRuntimeNativeDescriptors.every((descriptor) => descriptor.parityCoverage === "native")).toBe(true)
    expect(piMonoToolRuntimeNativeDescriptors.every((descriptor) => descriptor.knownLossiness.length === 0)).toBe(true)
  })

  it("marks the selected assembly atoms product-native exact", () => {
    const contract = buildAssemblyContract({ product: "pi-mono", generatedAt: "2026-06-10T00:00:00.000Z" })
    for (const atomID of piMonoToolRuntimeNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-tool-runtime-native-exact-fixture", "tool-runtime-native-exact:pi-mono"]),
        fixtureIDs: ["pi-tool-runtime:native-exact-fixture"],
        knownLossiness: [],
        source: {
          packageName: "@helix/adapters-pi",
          exportPath: "./product-schema/tool-runtime",
          specifier: "@helix/adapters-pi/product-schema/tool-runtime",
        },
      })
      expect(atom?.nativeEvidenceRefs).not.toContain("conformance:pi-tool-source-matrix")
      expect(atom?.fixtureIDs).not.toContain("pi-tool:source-matrix")
    }
  })

  it("rejects native claims when exact cases or lossiness drift", () => {
    const fixture = buildPiMonoToolRuntimeNativeExactFixture()
    expect(verifyPiMonoToolRuntimeNativeExactFixture({ ...fixture, knownLossiness: ["product-bridge"] })).toMatchObject({
      issues: expect.arrayContaining([expect.objectContaining({ id: "pi-tool-runtime-native-exact.lossiness" })]),
    })
    expect(verifyPiMonoToolRuntimeNativeExactFixture({
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "runtime-tool-events-sequential-and-parallel"
          ? { ...item, output: { ...item.output, parallelMessageOrder: ["toolu_b", "toolu_a"] } }
          : item,
      ),
    })).toMatchObject({
      issues: expect.arrayContaining([expect.objectContaining({ id: "pi-tool-runtime-native-exact.cases" })]),
    })
  })
})
