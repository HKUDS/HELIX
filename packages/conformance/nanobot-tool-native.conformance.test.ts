import { describe, expect, it } from "vitest"
import {
  buildNanobotExecEnv,
  buildNanobotToolEventFinishPayloads,
  buildNanobotToolEventStartPayload,
  buildNanobotToolNativeExactFixture,
  castNanobotToolParams,
  createNanobotNativeExactTools,
  createNanobotNativeToolRegistry,
  findNanobotEditMatches,
  formatNanobotListDirEntries,
  formatNanobotTextReadResult,
  formatNanobotToolHints,
  guardNanobotExecCommand,
  isNanobotBlockedDevicePath,
  nanobotToolNativeDescriptors,
  nanobotToolNativeExactAtomIDs,
  nanobotToolNativeExactEvidenceRef,
  nanobotToolNativeExactFixtureID,
  nanobotToolNativeExactReplayRef,
  nanobotToolPackCompatibilityNativeExactAtomID,
  normalizeNanobotToolResult,
  objectSchema,
  projectNanobotToolRunEvent,
  resolveNanobotWorkspacePath,
  stringSchema,
  validateNanobotJSONSchemaValue,
  verifyNanobotToolNativeExactFixture,
} from "@helix/lego-tools/product-schema/nanobot"
import { buildAssemblyContract } from "@helix/recipes"

describe("Nanobot tool native exact conformance", () => {
  it("captures the upstream Nanobot tool group as one native exact fixture", () => {
    const fixture = buildNanobotToolNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "nanobot",
      atomIDs: [...nanobotToolNativeExactAtomIDs],
      upstreamRef: "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
      evidenceRef: nanobotToolNativeExactEvidenceRef,
      fixtureID: nanobotToolNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [nanobotToolNativeExactEvidenceRef, nanobotToolNativeExactReplayRef],
      fixtureIDs: [nanobotToolNativeExactFixtureID],
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("nanobot/agent/tools/registry.py#ToolRegistry"),
      expect.stringContaining("nanobot/agent/tools/filesystem.py#_FsTool,ReadFileTool,WriteFileTool,EditFileTool,ListDirTool,_is_blocked_device"),
      expect.stringContaining("nanobot/agent/tools/shell.py#ExecToolConfig,ExecTool"),
      expect.stringContaining("nanobot/agent/runner.py#AgentRunner,_execute_tools,_run_tool,_normalize_tool_result,_classify_violation"),
      expect.stringContaining("nanobot/utils/progress_events.py#build_tool_event_start_payload,build_tool_event_finish_payloads,invoke_on_progress"),
    ]))
    expect(fixture.registryBehavior).toMatchObject({
      definitionOrder: ["edit_file", "exec", "list_dir", "read_file", "write_file", "mcp_memory__search"],
      mcpToolsSortAfterBuiltins: true,
      cachedDefinitionsReuseArrayUntilMutation: true,
      prepareCallCastsStringScalarsBeforeValidation: true,
    })
    expect(fixture.permissionProcessBehavior).toMatchObject({
      defaultExecTimeoutSeconds: 60,
      maxExecTimeoutSeconds: 600,
      maxOutputChars: 10000,
      denyPatternCount: 14,
      allowPatternsOverrideDenyPatterns: true,
      restrictToWorkspaceChecksWorkingDirAndAbsolutePaths: true,
    })
    expect(fixture.workspaceFilesystemBehavior).toMatchObject({
      readTextLineNumberFormat: "LINE_NUM| CONTENT",
      readDefaultLimit: 2000,
      readMaxChars: 128000,
      writeCreatesParentDirectories: true,
      listDirDefaultMaxEntries: 200,
    })
    expect(fixture.toolPackBehavior).toMatchObject({
      portID: "tools",
      aggregateAtomID: nanobotToolPackCompatibilityNativeExactAtomID,
      upstreamRegistry: "ToolRegistry.get_definitions/prepare_call/execute",
      upstreamExecution: "AgentRunner._execute_tools/_run_tool/_normalize_tool_result",
      builtinToolsSortBeforeMcpTools: true,
      cachedDefinitionsInvalidatedByRegisterUnregister: true,
      preservesPrepareValidateExecutePipeline: true,
      preservesWorkspacePermissionProcessAndResultProjection: true,
      noCompatibilityBridgeLossiness: true,
    })
    expect(verifyNanobotToolNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
  })

  it("matches upstream ToolRegistry ordering, cache, prepare_call, casting, and execute hint semantics", async () => {
    const tools = createNanobotNativeExactTools()
    const registry = createNanobotNativeToolRegistry([
      ...tools,
      {
        name: "mcp_memory__search",
        description: "MCP memory search",
        parameters: objectSchema({ query: stringSchema("query") }, { required: ["query"] }),
      },
    ])

    const firstDefinitions = registry.getDefinitions()
    expect(firstDefinitions.map((definition) => definition.function.name)).toEqual([
      "edit_file",
      "exec",
      "list_dir",
      "read_file",
      "write_file",
      "mcp_memory__search",
    ])
    expect(registry.getDefinitions()).toBe(firstDefinitions)
    registry.unregister("mcp_memory__search")
    expect(registry.getDefinitions()).not.toBe(firstDefinitions)

    const prepared = registry.prepareCall("exec", { command: "printf ok", timeout: "5" })
    expect(prepared).toMatchObject({
      tool: expect.objectContaining({ name: "exec" }),
      params: { command: "printf ok", timeout: 5 },
      error: null,
    })
    expect(registry.prepareCall("read_file", ["README.md"]).error).toBe(
      "Error: Tool 'read_file' parameters must be a JSON object, got list. Use named parameters: tool_name(param1=\"value1\", param2=\"value2\")",
    )
    expect(registry.prepareCall("missing", {}).error).toContain("Available: read_file, write_file, edit_file, list_dir, exec")

    const errorRegistry = createNanobotNativeToolRegistry([
      {
        name: "boom",
        description: "returns an upstream-style error",
        parameters: objectSchema(),
        execute: () => "Error: failed",
      },
    ])
    await expect(errorRegistry.execute("boom", {})).resolves.toBe("Error: failed\n\n[Analyze the error above and try a different approach.]")
  })

  it("matches upstream schema validation and parameter casting semantics", () => {
    const schema = objectSchema({
      count: { type: "integer", minimum: 2, maximum: 5 },
      enabled: { type: "boolean" },
      nested: objectSchema({
        path: stringSchema("path", { minLength: 3 }),
      }, { required: ["path"] }),
      tags: { type: "array", items: { type: "integer" }, minItems: 1 },
    }, { required: ["count", "nested"] })

    expect(castNanobotToolParams({ count: "3", enabled: "yes", nested: { path: 42 }, tags: ["1", "2"] }, schema)).toEqual({
      count: 3,
      enabled: true,
      nested: { path: "42" },
      tags: [1, 2],
    })
    expect(validateNanobotJSONSchemaValue({ enabled: false, nested: { path: "ok" }, tags: [] }, schema)).toEqual([
      "missing required count",
      "nested.path must be at least 3 chars",
      "tags must have at least 1 items",
    ])
    expect(validateNanobotJSONSchemaValue({ count: true, nested: { path: "okay" }, tags: [false] }, schema)).toEqual([
      "count should be integer",
      "tags[0] should be integer",
    ])
  })

  it("matches upstream exec guard, env, and workspace path behavior", () => {
    expect(guardNanobotExecCommand({ command: "rm -rf build", cwd: "/workspace" })).toBe("Error: Command blocked by deny pattern filter")
    expect(guardNanobotExecCommand({ command: "rm -rf build", cwd: "/workspace", allowPatterns: ["rm -rf build"] })).toBeUndefined()
    expect(guardNanobotExecCommand({ command: "cat ../secret", cwd: "/workspace", restrictToWorkspace: true })).toContain("path traversal detected")
    expect(guardNanobotExecCommand({ command: "cat /etc/passwd", cwd: "/workspace", workspace: "/workspace", restrictToWorkspace: true, mediaDir: "/workspace/.media" })).toContain("path outside working dir")
    expect(guardNanobotExecCommand({ command: "cat /dev/null", cwd: "/workspace", workspace: "/workspace", restrictToWorkspace: true })).toBeUndefined()
    expect(guardNanobotExecCommand({ command: "curl http://127.0.0.1:8000", cwd: "/workspace" })).toBe("Error: Command blocked by safety guard (internal/private URL detected)")

    expect(buildNanobotExecEnv({
      env: { HOME: "/home/nano", LANG: "en_US.UTF-8", TERM: "xterm", SECRET: "kept" },
      allowedEnvKeys: ["SECRET"],
    })).toEqual({
      HOME: "/home/nano",
      LANG: "en_US.UTF-8",
      TERM: "xterm",
      PYTHONUNBUFFERED: "1",
      SECRET: "kept",
    })

    expect(resolveNanobotWorkspacePath({ path: "src/app.py", workspace: "/workspace", allowedDir: "/workspace", mediaDir: "/workspace/.media" })).toBe("/workspace/src/app.py")
    expect(() => resolveNanobotWorkspacePath({ path: "/etc/passwd", workspace: "/workspace", allowedDir: "/workspace", mediaDir: "/workspace/.media" })).toThrow("outside allowed directory")
  })

  it("matches upstream filesystem, result, and progress projection semantics", () => {
    expect(isNanobotBlockedDevicePath("/dev/stdout")).toBe(true)
    expect(isNanobotBlockedDevicePath("/proc/self/fd/1")).toBe(true)
    expect(formatNanobotTextReadResult({ path: "note.txt", content: "a\r\nb\nc", offset: 2, limit: 1 })).toBe("2| b\n\n(Showing lines 2-2 of 3. Use offset=3 to continue.)")
    expect(formatNanobotListDirEntries({
      entries: [
        { name: "node_modules", directory: true },
        { name: "src", directory: true },
        { name: "README.md" },
      ],
    })).toBe("📄 README.md\n📁 src")
    expect(findNanobotEditMatches("const value = \"ok\"\n", "const value = “ok”\n")[0]).toMatchObject({ line: 1 })

    expect(normalizeNanobotToolResult("exec", "", 100)).toBe("(exec completed with no output)")
    expect(normalizeNanobotToolResult("exec", "abcdefghijklmnop", 5)).toBe("abcde\n... (truncated)")
    expect(projectNanobotToolRunEvent({ toolName: "exec", result: "line\nnext" }).event).toEqual({ name: "exec", status: "ok", detail: "line next" })
    expect(projectNanobotToolRunEvent({ toolName: "exec", result: "Error: failed" })).toMatchObject({
      payload: "Error: failed\n\n[Analyze the error above and try a different approach.]",
      event: { name: "exec", status: "error", detail: "Error: failed" },
    })

    expect(buildNanobotToolEventStartPayload({ id: "call_1", name: "exec", arguments: { command: "pwd" } })).toMatchObject({
      version: 1,
      phase: "start",
      call_id: "call_1",
      name: "exec",
      arguments: { command: "pwd" },
      result: null,
      error: null,
    })
    expect(buildNanobotToolEventFinishPayloads({
      toolCalls: [{ id: "call_1", name: "read_file", arguments: { path: "a.txt" } }],
      toolResults: [{ text: "ok", files: ["a.txt"] }],
      toolEvents: [{ name: "read_file", status: "ok", detail: "ok" }],
    })).toEqual([
      expect.objectContaining({
        phase: "end",
        result: { text: "ok", files: ["a.txt"] },
        error: null,
        files: ["a.txt"],
      }),
    ])
    expect(formatNanobotToolHints([
      { name: "read_file", arguments: { path: "/workspace/src/index.ts" } },
      { name: "read_file", arguments: { path: "/workspace/src/index.ts" } },
      { name: "exec", arguments: { command: "cat /workspace/src/index.ts" } },
    ])).toBe("read /workspace/src/index.ts x 2, $ cat /workspace/src/index.ts")
  })

  it("exposes native descriptors and selects them in the Nanobot assembly", () => {
    expect(nanobotToolNativeDescriptors.map((descriptor) => [descriptor.id, descriptor.port])).toEqual([
      ["nanobot.tool-pack.compatibility", "tools"],
      ["nanobot.permission.policy-bridge", "tool.permission-policy"],
      ["nanobot.process-runner-bridge", "process-runner.port"],
      ["nanobot.tool.definition-plugin-bridge", "tool.definition"],
      ["nanobot.tool.event-render-bridge", "tool.executor"],
      ["nanobot.tool.progress-event-bridge", "tool.audit-log"],
      ["nanobot.tool.registry-bridge", "tool.registry"],
      ["nanobot.tool.result-event-bridge", "tool.result-normalizer"],
      ["nanobot.tool.schema-bridge", "tool.schema-adapter"],
      ["nanobot.tools.result-projector.native-like", "tools.result-projector"],
      ["nanobot.tools.schema.native-like", "tools.schema"],
      ["nanobot.workspace-filesystem-bridge", "filesystem.port"],
    ])
    expect(nanobotToolNativeDescriptors.every((descriptor) => descriptor.implementationKind === "factory")).toBe(true)
    expect(nanobotToolNativeDescriptors.every((descriptor) => descriptor.parityCoverage === "native")).toBe(true)
    expect(nanobotToolNativeDescriptors.every((descriptor) => descriptor.knownLossiness.length === 0)).toBe(true)

    const contract = buildAssemblyContract({ product: "nanobot" })
    for (const atomID of nanobotToolNativeExactAtomIDs) {
      expect(contract.atoms.find((atom) => atom.id === atomID)).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        fixtureIDs: [nanobotToolNativeExactFixtureID],
        nativeEvidenceRefs: expect.arrayContaining([nanobotToolNativeExactEvidenceRef, nanobotToolNativeExactReplayRef]),
        knownLossiness: [],
        source: expect.objectContaining({
          packageDir: "lego-tools",
          exportPath: "./product-schema/nanobot",
        }),
      })
    }
  })
})
