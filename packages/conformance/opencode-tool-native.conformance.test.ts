import { describe, expect, it } from "vitest"
import {
  OpenCodePermissionNativeController,
  buildOpenCodeToolNativeExactFixture,
  openCodeApplyToolDefinitionHook,
  openCodeApplyToolCleanup,
  openCodeBuiltinToolIDs,
  openCodeDisabledTools,
  openCodeFilterToolIDsForModel,
  openCodeLegacyJsonSchema,
  openCodeListDirectoryNodes,
  openCodeNormalizePluginTool,
  openCodePermissionFromConfig,
  openCodePluginToolID,
  openCodeProjectToolFailedEvent,
  openCodeProjectToolSuccessEvent,
  openCodeReadFileContent,
  openCodeReadToolTextOutput,
  openCodeShellOutputResult,
  openCodeShouldAskDoomLoop,
  openCodeToolNativeDescriptors,
  openCodeToolNativeExactAtomIDs,
  openCodeToolBatchSchedulerNativeExactAtomID,
  openCodeToolNativeExactEvidenceRef,
  openCodeToolNativeExactFixtureID,
  openCodeToolNativeExactReplayRef,
  openCodeToolPackCompatibilityNativeExactAtomID,
  openCodeToolPackNativeExactAtomID,
  openCodeToolResultProjectorNativeExactAtomID,
  openCodeToolResultOutput,
  openCodeWebSearchEnabled,
  openCodeInitialToolProcessorState,
  openCodeApplyToolStreamEvent,
  verifyOpenCodeToolNativeExactFixture,
} from "@helix/lego-tools/product-schema/opencode"

describe("OpenCode tool native exact fixture", () => {
  it("anchors the selected OpenCode tool atoms to native upstream behavior", () => {
    const fixture = buildOpenCodeToolNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomIDs: openCodeToolNativeExactAtomIDs,
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: openCodeToolNativeExactEvidenceRef,
      fixtureID: openCodeToolNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [openCodeToolNativeExactEvidenceRef, openCodeToolNativeExactReplayRef],
      fixtureIDs: [openCodeToolNativeExactFixtureID],
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/tool/tool.ts#Tool.define"),
      expect.stringContaining("packages/opencode/src/tool/registry.ts#ToolRegistry"),
      expect.stringContaining("packages/opencode/src/permission/index.ts#Permission.ask"),
      expect.stringContaining("packages/opencode/src/file/index.ts#File.read"),
      expect.stringContaining("packages/opencode/src/session/processor.ts#ensureToolCall"),
    ]))
    expect(fixture.portIDs).toMatchObject({
      [openCodeToolPackNativeExactAtomID]: "tools",
      [openCodeToolPackCompatibilityNativeExactAtomID]: "tools",
      "opencode.permission.ask-bridge": "tool.permission-policy",
      "opencode.plugin.permission-bridge": "tool.permission-policy",
      "opencode.plugin.registry-bridge": "tool.registry",
      "opencode.tool.definition-plugin-bridge": "tool.definition",
      "opencode.tool.permission-render-bridge": "tool.permission-policy",
      "opencode.tool.result-render-bridge": "tool.result-normalizer",
      "opencode.tool.schema-bridge": "tool.schema-adapter",
      "opencode.tool.status-bridge": "tool.audit-log",
      [openCodeToolBatchSchedulerNativeExactAtomID]: "tools.batch-scheduler",
      [openCodeToolResultProjectorNativeExactAtomID]: "tools.result-projector",
      "opencode.workspace-filesystem-bridge": "filesystem.port",
    })
    expect(fixture.toolPackBehavior).toMatchObject({
      portID: "tools",
      aggregateAtomIDs: [openCodeToolPackNativeExactAtomID, openCodeToolPackCompatibilityNativeExactAtomID],
      upstreamRegistry: "ToolRegistry.tools",
      upstreamExecution: "SessionTools.resolve+SessionProcessor.process",
      preservesModelProviderGates: true,
      preservesPermissionPipeline: true,
      preservesResultProjection: true,
      hiddenEditWriteWhenApplyPatchEnabled: true,
    })
    expect(fixture.toolPackBehavior.builtinOrder).toEqual(openCodeBuiltinToolIDs({ question: true, scout: true, lsp: true, plan: true }))
    expect(fixture.schedulerBehavior).toMatchObject({
      upstreamCoordinator: "SessionTools.resolve+SessionProcessor.process",
      streamOrderSource: "provider-tool-stream",
      missingToolInputEndIsPublishedBeforeToolCalled: true,
      pendingToolCallDrainTimeoutMs: 250,
      cleanupMarksUnresolvedToolCallsInterrupted: true,
      doomLoopThreshold: 3,
      doomLoopPermission: "doom_loop",
      toolExecutionHooks: ["tool.execute.before", "tool.execute.after"],
      mcpExecutionPermissionPattern: "*",
    })
    expect(fixture.resultProjectorBehavior).toMatchObject({
      outputObjectKeys: ["title", "metadata", "output", "attachments"],
      successEventContentTypes: ["text", "file"],
      failedEventErrorType: "unknown",
      providerExecutedSuccessFromEventOrPartMetadata: true,
      completedWritebackRemovesPendingToolCall: true,
    })
    expect(openCodeToolNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([...openCodeToolNativeExactAtomIDs])
    expect(verifyOpenCodeToolNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    expect(verifyOpenCodeToolNativeExactFixture({
      ...fixture,
      knownLossiness: ["opencode-tool-live-runtime-fixture-partial-native-gap"],
    }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-native-exact.lossiness" }),
    ]))
  })

  it("replays ToolRegistry plugin tool normalization and model gates", async () => {
    expect(openCodeBuiltinToolIDs({ question: true, scout: true, lsp: true, plan: true })).toEqual([
      "invalid",
      "question",
      "shell",
      "read",
      "glob",
      "grep",
      "edit",
      "write",
      "task",
      "fetch",
      "todo",
      "search",
      "repo_clone",
      "repo_overview",
      "skill",
      "apply_patch",
      "lsp",
      "plan",
    ])
    expect(openCodePluginToolID("review", "default")).toBe("review")
    expect(openCodePluginToolID("review", "fix")).toBe("review_fix")
    expect(openCodeWebSearchEnabled("anthropic", { exa: false, parallel: false })).toBe(false)
    expect(openCodeWebSearchEnabled("opencode", { exa: false, parallel: false })).toBe(true)
    expect(openCodeFilterToolIDsForModel(["edit", "write", "apply_patch", "search"], {
      modelID: "gpt-5",
      providerID: "opencode",
    })).toEqual(["apply_patch", "search"])
    expect(openCodeFilterToolIDsForModel(["edit", "write", "apply_patch", "search"], {
      modelID: "gpt-4.1",
      providerID: "anthropic",
    })).toEqual(["edit", "write"])

    expect(openCodeLegacyJsonSchema([
      ["filePath", { type: "string" }],
      ["count", { type: "number" }],
      ["ignored", "not-json-schema"],
    ])).toEqual({
      type: "object",
      properties: {
        filePath: { type: "string" },
        count: { type: "number" },
      },
      required: ["filePath", "count"],
    })

    const normalized = openCodeNormalizePluginTool("demo", {
      description: "Demo plugin tool",
      args: {
        filePath: { type: "string" },
      },
      execute: () => "done",
    })
    await expect(normalized.execute({ filePath: "a.ts" }, {
      sessionID: "ses",
      messageID: "msg",
      agent: "build",
      directory: "/repo",
      worktree: "/repo",
      abort: new AbortController().signal,
      metadata: () => undefined,
      ask: async () => undefined,
    })).resolves.toEqual({
      title: "",
      output: "done",
      metadata: {},
    })

    expect(openCodeApplyToolDefinitionHook(
      { description: "old", parameters: "schema", jsonSchema: { type: "object", properties: {}, required: [] } },
      { description: "new", parameters: "schema", jsonSchema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] } },
    )).toEqual({
      description: "new",
      parameters: "schema",
      jsonSchema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
    })
  })

  it("replays Permission.ask, reply, config expansion, and disabled tool semantics", () => {
    const ruleset = [
      { permission: "edit", pattern: "src/*.ts", action: "deny" as const },
      { permission: "edit", pattern: "src/*.ts", action: "ask" as const },
    ]
    const controller = new OpenCodePermissionNativeController()
    const first = controller.ask({
      id: "perm-1",
      sessionID: "ses-1",
      permission: "edit",
      patterns: ["src/a.ts"],
      metadata: { filepath: "/repo/src/a.ts" },
      always: ["src/*"],
      ruleset,
      tool: { messageID: "msg-1", callID: "call-1" },
    })
    expect(first).toMatchObject({
      action: "ask",
      request: {
        id: "perm-1",
        tool: { messageID: "msg-1", callID: "call-1" },
      },
    })
    expect(controller.ask({
      id: "perm-2",
      sessionID: "ses-1",
      permission: "edit",
      patterns: ["src/b.ts"],
      metadata: {},
      always: ["src/*"],
      ruleset,
    })).toMatchObject({ action: "ask" })
    expect(controller.reply({ requestID: "perm-1", reply: "always" })).toMatchObject({
      status: "accepted",
      autoResolved: [expect.objectContaining({ id: "perm-2" })],
      approved: [expect.objectContaining({ permission: "edit", pattern: "src/*", action: "allow" })],
    })
    expect(controller.list()).toEqual([])

    controller.ask({ id: "perm-3", sessionID: "ses-2", permission: "bash", patterns: ["rm *"], metadata: {}, always: ["rm *"], ruleset: [] })
    controller.ask({ id: "perm-4", sessionID: "ses-2", permission: "bash", patterns: ["cp *"], metadata: {}, always: ["cp *"], ruleset: [] })
    expect(controller.reply({ requestID: "perm-3", reply: "reject" })).toMatchObject({
      status: "rejected",
      rejected: [expect.objectContaining({ id: "perm-4" })],
    })

    expect(new OpenCodePermissionNativeController().ask({
      sessionID: "ses-3",
      permission: "read",
      patterns: ["secret.txt"],
      metadata: {},
      always: ["*"],
      ruleset: [{ permission: "read", pattern: "secret.txt", action: "deny" }],
    })).toMatchObject({
      action: "deny",
      deniedRules: [{ permission: "read", pattern: "secret.txt", action: "deny" }],
    })
    expect(openCodePermissionFromConfig({ edit: { "~/src/*": "allow", "$HOME/tmp/*": "deny" }, bash: "ask" }, "/home/alice")).toEqual([
      { permission: "edit", pattern: "/home/alice/src/*", action: "allow" },
      { permission: "edit", pattern: "/home/alice/tmp/*", action: "deny" },
      { permission: "bash", pattern: "*", action: "ask" },
    ])
    expect([...openCodeDisabledTools(["read", "edit", "write", "apply_patch"], [{ permission: "edit", pattern: "*", action: "deny" }])]).toEqual(["edit", "write", "apply_patch"])
  })

  it("replays File.read/list and ReadTool/ShellTool output shaping", () => {
    expect(openCodeReadFileContent({
      file: "src/main.ts",
      exists: true,
      content: "  export const answer = 42\n",
    })).toEqual({ type: "text", content: "export const answer = 42" })
    expect(openCodeReadFileContent({
      file: "image.png",
      exists: true,
      bytes: Buffer.from("png-bytes"),
    })).toEqual({
      type: "text",
      content: Buffer.from("png-bytes").toString("base64"),
      mimeType: "image/png",
      encoding: "base64",
    })
    expect(openCodeReadFileContent({ file: "data.sqlite", exists: true, content: "binary" })).toEqual({ type: "binary", content: "" })

    expect(openCodeListDirectoryNodes([
      { name: "z.txt", type: "file" },
      { name: ".git", type: "directory" },
      { name: "src", type: "directory" },
      { name: "a.txt", type: "file" },
    ], {
      directory: "/repo",
      worktree: "/repo",
      vcs: "git",
    }, "", (file) => file === "src/")).toEqual([
      { name: "src", path: "src", absolute: "/repo/src", type: "directory", ignored: true },
      { name: "a.txt", path: "a.txt", absolute: "/repo/a.txt", type: "file", ignored: false },
      { name: "z.txt", path: "z.txt", absolute: "/repo/z.txt", type: "file", ignored: false },
    ])
    expect(() => openCodeListDirectoryNodes([], { directory: "/repo", worktree: "/repo", vcs: "git" }, "../etc")).toThrow("Access denied: path escapes project directory")

    expect(openCodeReadToolTextOutput({
      filePath: "/repo/src/main.ts",
      worktree: "/repo",
      content: "alpha\nbeta\ngamma",
      offset: 2,
      limit: 1,
    })).toMatchObject({
      title: "src/main.ts",
      output: "<path>/repo/src/main.ts</path>\n<type>file</type>\n<content>\n2: beta\n\n(Showing lines 2-2 of 3. Use offset=3 to continue.)\n</content>",
      metadata: {
        preview: "beta",
        truncated: true,
        loaded: [],
      },
    })

    expect(openCodeShellOutputResult({
      chunks: [],
      exit: 0,
      description: "no-op",
      timeout: 1000,
    })).toMatchObject({
      title: "no-op",
      output: "(no output)",
      metadata: { exit: 0, description: "no-op", truncated: false },
    })
    expect(openCodeShellOutputResult({
      chunks: ["one\n", "two\n", "three\n"],
      exit: null,
      description: "long",
      timeout: 10,
      expired: true,
      outputPath: "/tmp/opencode-output.txt",
      maxLines: 1,
      maxBytes: 10,
    }).output).toContain("...output truncated...\n\nFull output saved to: /tmp/opencode-output.txt")
  })

  it("replays SessionTools and SessionProcessor tool part state transitions", () => {
    let state = openCodeInitialToolProcessorState()
    state = openCodeApplyToolStreamEvent(state, {
      type: "tool-input-start",
      id: "call-1",
      name: "read",
      providerExecuted: true,
      now: 10,
    }, { partID: () => "part-1", messageID: "msg-1", sessionID: "ses-1" })
    state = openCodeApplyToolStreamEvent(state, {
      type: "tool-call",
      id: "call-1",
      name: "read",
      input: { filePath: "/repo/a.ts" },
      providerMetadata: { provider: "ai-sdk" },
      now: 11,
    })
    expect(state.parts[0]).toMatchObject({
      type: "tool",
      tool: "read",
      callID: "call-1",
      metadata: { provider: "ai-sdk", providerExecuted: true },
      state: { status: "running", input: { filePath: "/repo/a.ts" }, time: { start: 11 } },
    })

    const output = openCodeToolResultOutput({
      type: "tool-result",
      id: "call-1",
      name: "read",
      result: {
        type: "json",
        value: {
          title: "a.ts",
          output: "contents",
          metadata: { preview: "contents" },
          attachments: [{ type: "file", mime: "text/plain", url: "file:///repo/a.ts" }],
        },
      },
    })
    expect(output).toEqual({
      title: "a.ts",
      output: "contents",
      metadata: { preview: "contents" },
      attachments: [{ type: "file", mime: "text/plain", url: "file:///repo/a.ts" }],
    })
    expect(openCodeProjectToolSuccessEvent({
      sessionID: "ses-1",
      callID: "call-1",
      output,
      partProviderExecuted: true,
      timestamp: 12,
    })).toEqual({
      sessionID: "ses-1",
      callID: "call-1",
      structured: { preview: "contents" },
      content: [
        { type: "text", text: "contents" },
        { type: "file", uri: "file:///repo/a.ts", mime: "text/plain" },
      ],
      provider: { executed: true },
      timestamp: 12,
    })

    state = openCodeApplyToolStreamEvent(state, {
      type: "tool-result",
      id: "call-1",
      name: "read",
      result: { type: "json", value: output },
      now: 12,
    })
    expect(state.parts[0]?.state).toMatchObject({
      status: "completed",
      title: "a.ts",
      output: "contents",
      metadata: { preview: "contents" },
      time: { start: 11, end: 12 },
    })
    expect(state.pendingToolCallIDs).toEqual([])
    const repeatedReadPart = {
      ...state.parts[0]!,
      state: {
        status: "completed" as const,
        input: { filePath: "/repo/a.ts" },
        output: "contents",
        metadata: {},
        title: "a.ts",
        time: { start: 1, end: 2 },
      },
    }
    expect(openCodeShouldAskDoomLoop([
      { ...repeatedReadPart, id: "part-a" },
      { ...repeatedReadPart, id: "part-b" },
      { ...repeatedReadPart, id: "part-c" },
    ], { tool: "read", args: { filePath: "/repo/a.ts" } })).toBe(true)

    let failed = openCodeInitialToolProcessorState()
    failed = openCodeApplyToolStreamEvent(failed, { type: "tool-call", id: "call-2", name: "shell", input: "ls", now: 20 }, { partID: () => "part-2" })
    expect(openCodeProjectToolFailedEvent({
      sessionID: "ses-1",
      callID: "call-2",
      message: "boom",
      partProviderExecuted: false,
      timestamp: 21,
    })).toEqual({
      sessionID: "ses-1",
      callID: "call-2",
      error: { type: "unknown", message: "boom" },
      provider: { executed: false },
      timestamp: 21,
    })
    failed = openCodeApplyToolStreamEvent(failed, { type: "tool-error", id: "call-2", name: "shell", message: "boom", now: 21 })
    expect(failed.parts[0]?.state).toMatchObject({
      status: "error",
      input: { value: "ls" },
      error: "boom",
      time: { start: 20, end: 21 },
    })

    let aborted = openCodeInitialToolProcessorState()
    aborted = openCodeApplyToolStreamEvent(aborted, {
      type: "tool-call",
      id: "call-3",
      name: "grep",
      input: { pattern: "needle" },
      now: 30,
    }, { partID: () => "part-3" })
    aborted = openCodeApplyToolCleanup(aborted, 31)
    expect(aborted.parts[0]?.state).toMatchObject({
      status: "error",
      input: { pattern: "needle" },
      error: "Tool execution aborted",
      metadata: { interrupted: true },
      time: { start: 30, end: 31 },
    })
    expect(aborted.pendingToolCallIDs).toEqual([])
  })
})
