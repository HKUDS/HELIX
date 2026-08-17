import { describe, expect, it } from "vitest"
import {
  buildOpenCodeHookLifecycleNativeExactFixture,
  buildOpenCodeHookLifecycleNativeExactFixtureAsync,
  createOpenCodeCommandRegistryProjection,
  createOpenCodeHookEventMapperProjection,
  createOpenCodePluginServiceProjection,
  createOpenCodeToolRegistryProjection,
  deduplicateOpenCodePluginOriginsProjection,
  loadOpenCodeExternalPluginsProjection,
  openCodeCollectPluginRegistriesProjection,
  openCodeHookLifecycleNativeDescriptors,
  openCodeHookLifecycleNativeExactAtomIDs,
  openCodeParsePluginSpecifier,
  openCodePluginManifestTargetsProjection,
  openCodePluginSpecifier,
  openCodeToolFromPluginProjection,
  readOpenCodeV1PluginProjection,
  resolveOpenCodePluginIDProjection,
  verifyOpenCodeHookLifecycleNativeExactFixture,
} from "@helix/adapters-opencode/product-schema/hooks"

describe("OpenCode hook lifecycle native exact fixture", () => {
  it("captures upstream plugin, loader, tool, command, and registry behavior as native exact", async () => {
    const fixture = buildOpenCodeHookLifecycleNativeExactFixture()
    const replayed = await buildOpenCodeHookLifecycleNativeExactFixtureAsync()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomIDs: [
        "opencode.hook.error-defaults",
        "opencode.hook.handler-adapter",
        "opencode.hook.observer-adapter",
        "opencode.hook.plugin-bridge",
        "opencode.hook.scheduler-defaults",
        "opencode.plugin.event-mapper",
        "opencode.plugin.hot-reload-cleanup",
        "opencode.plugin.loader",
        "opencode.plugin.provider-registry-bridge",
        "opencode.plugin.ui-registry-bridge",
        "opencode.registry.command",
        "opencode.registry.provider-plugin",
        "opencode.registry.tool-definition",
        "opencode.registry.ui-provider",
      ],
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-hook-lifecycle-native-exact-fixture",
      fixtureID: "opencode-hook-lifecycle:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: ["conformance:opencode-hook-lifecycle-native-exact-fixture", "hook-lifecycle-native-exact:opencode"],
      fixtureIDs: ["opencode-hook-lifecycle:native-exact-fixture"],
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.portIDs).toEqual([
      "hook.error-policy",
      "hook.handler-chain",
      "hook.observer-chain",
      "hook.bus",
      "hook.scheduler",
      "hook.cleanup-scope",
      "registry.provider",
      "registry.ui",
      "registry.command",
      "tool.registry",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/plugin/src/index.ts#Hooks,PluginInput,PluginModule"),
      expect.stringContaining("packages/opencode/src/plugin/index.ts#Plugin.layer,trigger,list,applyPlugin,getLegacyPlugins"),
      expect.stringContaining("packages/opencode/src/plugin/loader.ts#PluginLoader.plan,resolve,load,loadExternal"),
      expect.stringContaining("packages/opencode/src/tool/registry.ts#ToolRegistry.fromPlugin,tools,named,webSearchEnabled"),
      expect.stringContaining("packages/opencode/src/command/index.ts#Command.layer,hints"),
    ]))
    expect(fixture.policy).toMatchObject({
      pluginTriggerAwaitsHooksSequentiallyAndMutatesSharedOutput: true,
      loaderRetriesOnlyRetryableFilePluginInstallFailuresAfterDependencyWait: true,
      toolRegistryOrdersBuiltinThenCustomThenPluginTools: true,
      commandRegistryAppliesDefaultThenConfigThenMcpThenNonDuplicateSkills: true,
      allHookAtomsShareNativeLifecycleFixture: true,
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "plugin-service-trigger-and-event-order",
      "plugin-loader-config-dedupe-and-entrypoints",
      "tool-registry-plugin-tools-and-definition-hook",
      "command-registry-default-config-mcp-skill",
      "event-mapper-provider-workspace-registries",
      "shared-plugin-resolution-and-v1-legacy",
    ])
    expect(fixture.cases.find((item) => item.scenarioID === "plugin-service-trigger-and-event-order")?.output).toMatchObject({
      hookCount: 2,
      configErrors: ["config boom"],
      params: { temperature: 0.30000000000000004, topP: 0.42, options: { first: true, second: true } },
      definition: { description: "Shell|first", parameters: { changed: true } },
      eventCalls: ["session.updated"],
    })
    expect(fixture.cases.find((item) => item.scenarioID === "plugin-loader-config-dedupe-and-entrypoints")?.output).toMatchObject({
      deduped: [["opencode-a@2.0.0", "/repo/.opencode/opencode.json"], ["file:///repo/plugin.ts", "/repo/.opencode/tui.json"]],
      loaded: [
        { spec: "file:///repo/new-plugin", source: "file", retry: true },
        { spec: "ok", source: "npm", retry: false },
      ],
      report: { waitCount: 1 },
      packageTargets: [{ kind: "server" }, { kind: "tui", opts: { slot: "home" } }],
    })
    expect(fixture.cases.find((item) => item.scenarioID === "tool-registry-plugin-tools-and-definition-hook")?.output).toMatchObject({
      allOrder: expect.arrayContaining(["invalid", "shell", "read", "search", "patch", "plan", "oc_trace", "oc_schema"]),
      anthropicHasSearch: false,
      pluginSchema: { type: "object", required: ["name", "depth"] },
      traceResult: {
        title: "Trace",
        output: "abcd",
        metadata: {
          source: "plugin",
          truncated: true,
          outputPath: "/tmp/opencode-tool-output.txt",
        },
      },
    })
    expect(fixture.cases.find((item) => item.scenarioID === "event-mapper-provider-workspace-registries")?.output).toMatchObject({
      toolBefore: { input: { patched: true } },
      toolAfter: { content: [{ type: "text", text: "done!" }], details: { ok: true } },
      providerBefore: { headers: { "x-plugin": "yes" } },
      compactMissing: undefined,
      compactReady: { context: ["plugin context"], prompt: "plugin prompt" },
      autocontinue: { autocontinue: false },
      registries: {
        tools: ["ask_docs"],
        authProviders: ["github-copilot"],
        providerPlugins: ["custom-provider"],
        tuiTargets: ["slot-pack"],
      },
    })
    expect(verifyOpenCodeHookLifecycleNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(replayed.cases).toEqual(fixture.cases)
  })

  it("exposes descriptors for every OpenCode hook lifecycle atom without lossiness", () => {
    expect(openCodeHookLifecycleNativeExactAtomIDs).toHaveLength(14)
    expect(openCodeHookLifecycleNativeDescriptors.map((descriptor) => [descriptor.id, descriptor.port])).toEqual([
      ["opencode.hook.error-defaults", "hook.error-policy"],
      ["opencode.hook.handler-adapter", "hook.handler-chain"],
      ["opencode.hook.observer-adapter", "hook.observer-chain"],
      ["opencode.hook.plugin-bridge", "hook.bus"],
      ["opencode.hook.scheduler-defaults", "hook.scheduler"],
      ["opencode.plugin.event-mapper", "hook.handler-chain"],
      ["opencode.plugin.hot-reload-cleanup", "hook.cleanup-scope"],
      ["opencode.plugin.loader", "hook.bus"],
      ["opencode.plugin.provider-registry-bridge", "registry.provider"],
      ["opencode.plugin.ui-registry-bridge", "registry.ui"],
      ["opencode.registry.command", "registry.command"],
      ["opencode.registry.provider-plugin", "registry.provider"],
      ["opencode.registry.tool-definition", "tool.registry"],
      ["opencode.registry.ui-provider", "registry.ui"],
    ])
    for (const descriptor of openCodeHookLifecycleNativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "opencode",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: ["conformance:opencode-hook-lifecycle-native-exact-fixture", "hook-lifecycle-native-exact:opencode"],
        fixtureIDs: ["opencode-hook-lifecycle:native-exact-fixture"],
        knownLossiness: [],
      })
      expect(descriptor.selectionReason).toContain("Upstream native implementation")
    }
  })

  it("keeps projection helpers aligned with upstream edge cases", async () => {
    expect(openCodeParsePluginSpecifier("@scope/plugin@1.2.3")).toEqual({ pkg: "@scope/plugin", version: "1.2.3" })
    expect(openCodePluginSpecifier(["pkg@2", { enabled: true }])).toBe("pkg@2")
    expect(deduplicateOpenCodePluginOriginsProjection([
      { spec: "pkg-a@1", source: "global", scope: "global" },
      { spec: "pkg-a@2", source: "local", scope: "local" },
    ]).map((origin) => origin.source)).toEqual(["local"])

    const load = loadOpenCodeExternalPluginsProjection({
      kind: "server",
      wait: () => {},
      candidates: [
        { origin: { spec: "file:///tmp/plugin", source: "local", scope: "local" }, outcome: { type: "install-error", message: "Plugin directory /tmp/plugin is missing package.json or index file", retryOutcome: { type: "loaded", entry: "file:///tmp/plugin/index.ts" } } },
      ],
    })
    expect(load.loaded).toEqual([{ spec: "file:///tmp/plugin", source: "file", entry: "file:///tmp/plugin/index.ts", retry: true }])
    expect(load.report.waitCount).toBe(1)

    const service = createOpenCodePluginServiceProjection()
    await service.init({
      pluginInput: { directory: "/repo", worktree: "/repo" },
      internal: [async () => ({
        "chat.headers": (_input, output) => {
          output.headers = { ok: "1" }
        },
      })],
    })
    await expect(service.trigger("chat.headers", {}, { headers: {} })).resolves.toEqual({ headers: { ok: "1" } })

    const tool = openCodeToolFromPluginProjection("plugin_tool", {
      description: "Plugin tool",
      execute: () => "ok",
    }, { directory: "/repo", worktree: "/repo" })
    expect(tool.jsonSchema).toEqual({ type: "object", properties: {} })
    await expect(tool.execute({}, { sessionID: "ses", messageID: "msg", agent: "agent", ask: async () => {} })).resolves.toMatchObject({
      title: "",
      output: "ok",
      metadata: { truncated: false },
    })

    const registry = createOpenCodeToolRegistryProjection()
    const anthropicTools = await registry.tools({ providerID: "anthropic", modelID: "claude", agent: "agent" })
    expect(anthropicTools.map((item) => item.id)).not.toContain("search")

    const commands = createOpenCodeCommandRegistryProjection({
      worktree: "/repo",
      configCommands: { ship: { template: "ship $1 $ARGUMENTS" } },
    })
    expect(commands.get("ship")?.hints).toEqual(["$1", "$ARGUMENTS"])

    const mapper = createOpenCodeHookEventMapperProjection({
      "experimental.session.compacting": (_input, output) => {
        const context = output.context as string[]
        context.push("ctx")
      },
    })
    await expect(mapper.dispatch("session.before_compact", { payload: {} })).resolves.toBeUndefined()
    await expect(mapper.dispatch("session.before_compact", { sessionID: "ses", payload: {} })).resolves.toEqual({ context: ["ctx"], prompt: undefined })

    expect(openCodeCollectPluginRegistriesProjection({
      hooks: [{ auth: { provider: "github" }, provider: { id: "local" } }],
      packages: [{ dir: "/pkg", pkg: "/pkg/package.json", json: { name: "ui", exports: { "./tui": "./tui.js" } } }],
    })).toMatchObject({ authProviders: ["github"], providerPlugins: ["local"], tuiTargets: ["ui"] })
    expect(openCodePluginManifestTargetsProjection({ dir: "/pkg", pkg: "/pkg/package.json", json: { name: "theme", "oc-themes": ["theme.json"] } })).toEqual([{ kind: "tui" }])
    expect(() => readOpenCodeV1PluginProjection({ default: { tui: async () => undefined } }, "serverless", "server")).toThrow("server()")
    expect(resolveOpenCodePluginIDProjection("npm", "pkg", "/pkg", undefined, { dir: "/pkg", pkg: "/pkg/package.json", json: { name: "pkg" } })).toBe("pkg")
  })
})
