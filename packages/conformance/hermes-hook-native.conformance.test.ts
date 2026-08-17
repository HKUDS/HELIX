import { describe, expect, it } from "vitest"
import {
  buildHermesHookLifecycleNativeExactFixture,
  buildHermesShellHookPayload,
  commandScriptPath,
  createHermesPluginContextProjection,
  createHermesPluginManagerProjection,
  dashboardInstallHermesPluginProjection,
  discoverHermesPluginManifestsProjection,
  getHermesPreToolCallBlockMessage,
  hermesHookLifecycleNativeDescriptors,
  hermesHookLifecycleNativeExactAtomIDs,
  hermesShellHookMatchesTool,
  invokeHermesPluginHook,
  normalizeHermesPluginCommandName,
  parseHermesShellHookResponse,
  parseHermesShellHookSpecs,
  resolveHermesPluginGitURL,
  sanitizeHermesPluginName,
  setHermesPluginEnabledState,
  verifyHermesHookLifecycleNativeExactFixture,
} from "@helix/adapters-hermes/product-schema/hooks"
import { buildAssemblyContract } from "@helix/recipes"

describe("Hermes hook lifecycle native exact fixture", () => {
  it("captures upstream shell hook and plugin lifecycle behavior as native exact", () => {
    const fixture = buildHermesHookLifecycleNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "hermes-agent",
      atomIDs: [
        "hermes.hook.error-defaults",
        "hermes.hook.handler-adapter",
        "hermes.hook.observer-adapter",
        "hermes.hook.plugin-bridge",
        "hermes.hook.scheduler-defaults",
        "hermes.plugin.cleanup",
        "hermes.plugin.event-mapper",
        "hermes.plugin.loader",
        "hermes.plugin.provider-registry-bridge",
        "hermes.plugin.ui-registry-bridge",
        "hermes.registry.command",
        "hermes.registry.provider-plugin",
        "hermes.registry.tool-definition",
        "hermes.registry.ui-provider",
      ],
      upstreamRef: "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
      evidenceRef: "conformance:hermes-hook-lifecycle-native-exact-fixture",
      fixtureID: "hermes-hook-lifecycle:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: ["conformance:hermes-hook-lifecycle-native-exact-fixture", "hook-lifecycle-native-exact:hermes-agent"],
      fixtureIDs: ["hermes-hook-lifecycle:native-exact-fixture"],
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.portIDs).toEqual([
      "hook.bus",
      "hook.cleanup-scope",
      "hook.error-policy",
      "hook.handler-chain",
      "hook.observer-chain",
      "hook.scheduler",
      "registry.command",
      "registry.provider",
      "registry.ui",
      "tool.registry",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("agent/shell_hooks.py#ShellHookSpec,register_from_config"),
      expect.stringContaining("hermes_cli/plugins.py#PluginManifest,LoadedPlugin,PluginContext,PluginManager"),
      expect.stringContaining("hermes_cli/plugins_cmd.py#PluginOperationError,cmd_install"),
    ]))
    expect(fixture.policy).toMatchObject({
      shellHookMatcherUsesRegexFullmatchWithLiteralFallback: true,
      pluginManagerInvokesHooksInRegistrationOrderAndCatchesErrors: true,
      pluginDiscoveryLaterSourcesOverrideEarlierKeys: true,
      preToolCallWhitelistDeniesBeforePluginHooks: true,
      pluginInstallerSanitizesNamesAndResolvesGithubShorthand: true,
      allHookAtomsShareNativeLifecycleFixture: true,
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "shell-hooks-parse-match-payload-response",
      "shell-hooks-accept-and-script-path",
      "plugin-context-registries-and-hook-invoke",
      "plugin-discovery-enable-disable-and-winners",
      "pre-tool-call-block-and-thread-whitelist",
      "plugin-command-install-url-name-and-dashboard",
    ])
    expect(fixture.cases.find((item) => item.scenarioID === "shell-hooks-parse-match-payload-response")?.output).toMatchObject({
      parsedCommands: [
        "pre_tool_call:~/.hermes/hooks/block.py:300:regex-fullmatch",
        "pre_tool_call:node ./literal.js:60:literal-fallback",
        "pre_tool_call:python ./minimum.py:60:all-tools",
        "post_tool_call:echo post:5:regex-fullmatch",
        "pre_llm_call:echo ctx:12:all-tools",
      ],
      validRegexMatchesTerminal: true,
      validRegexRejectsShell: true,
      invalidRegexFallsBackLiteral: true,
      defaultBlock: { action: "block", message: "Blocked by shell hook." },
      context: { context: "remember this" },
    })
    expect(fixture.cases.find((item) => item.scenarioID === "plugin-context-registries-and-hook-invoke")?.output).toMatchObject({
      toolNames: ["trace_dump"],
      commandRegistered: true,
      builtinSkipped: false,
      commands: ["daily-report"],
      cliCommands: ["honcho"],
      providers: ["local-model"],
      uiProviders: ["dashboard"],
      skills: ["observer:audit"],
      hookWarnings: ["Plugin 'observer' registered unknown hook 'future_hook'"],
      invokeResults: [{ action: "allow" }],
      invokeErrors: ["observer boom"],
    })
    expect(verifyHermesHookLifecycleNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
  })

  it("exposes native descriptors for the Hermes hook lifecycle atom group", () => {
    expect(hermesHookLifecycleNativeDescriptors.map((descriptor) => [descriptor.id, descriptor.port])).toEqual([
      ["hermes.hook.error-defaults", "hook.error-policy"],
      ["hermes.hook.handler-adapter", "hook.handler-chain"],
      ["hermes.hook.observer-adapter", "hook.observer-chain"],
      ["hermes.hook.plugin-bridge", "hook.bus"],
      ["hermes.hook.scheduler-defaults", "hook.scheduler"],
      ["hermes.plugin.cleanup", "hook.cleanup-scope"],
      ["hermes.plugin.event-mapper", "hook.handler-chain"],
      ["hermes.plugin.loader", "hook.bus"],
      ["hermes.plugin.provider-registry-bridge", "registry.provider"],
      ["hermes.plugin.ui-registry-bridge", "registry.ui"],
      ["hermes.registry.command", "registry.command"],
      ["hermes.registry.provider-plugin", "registry.provider"],
      ["hermes.registry.tool-definition", "tool.registry"],
      ["hermes.registry.ui-provider", "registry.ui"],
    ])
    expect(hermesHookLifecycleNativeDescriptors.every((descriptor) => descriptor.implementationKind === "factory")).toBe(true)
    expect(hermesHookLifecycleNativeDescriptors.every((descriptor) => descriptor.parityCoverage === "native")).toBe(true)
    expect(hermesHookLifecycleNativeDescriptors.every((descriptor) => descriptor.knownLossiness.length === 0)).toBe(true)
    expect(hermesHookLifecycleNativeDescriptors.flatMap((descriptor) => descriptor.fixtureIDs)).toEqual(
      expect.arrayContaining(["hermes-hook-lifecycle:native-exact-fixture"]),
    )
  })

  it("projects shell hook parsing, payloads, responses, and plugin registries", () => {
    const specs = parseHermesShellHookSpecs({
      pre_tool_call: [
        { command: "python ./guard.py", matcher: "terminal|read_file", timeout: 999 },
        { command: "node ./literal.js", matcher: "[", timeout: "bad" },
      ],
      pre_llm_call: [{ command: "echo ctx", matcher: "ignored" }],
      missing_event: [{ command: "bad" }],
    })
    expect(specs.length).toBe(3)
    const regexSpec = specs[0]!
    const literalSpec = specs[1]!
    expect(specs.map((spec) => [spec.event, spec.command, spec.timeout, spec.matchMode])).toEqual([
      ["pre_tool_call", "python ./guard.py", 300, "regex-fullmatch"],
      ["pre_tool_call", "node ./literal.js", 60, "literal-fallback"],
      ["pre_llm_call", "echo ctx", 60, "all-tools"],
    ])
    expect(hermesShellHookMatchesTool(regexSpec, "terminal")).toBe(true)
    expect(hermesShellHookMatchesTool(regexSpec, "terminal_extra")).toBe(false)
    expect(hermesShellHookMatchesTool(literalSpec, "[")).toBe(true)
    expect(buildHermesShellHookPayload("pre_tool_call", { tool_name: "terminal", args: { command: "pwd" }, parent_session_id: "parent", trace_id: "t1" })).toMatchObject({
      hook_event_name: "pre_tool_call",
      tool_name: "terminal",
      tool_input: { command: "pwd" },
      session_id: "parent",
      extra: { trace_id: "t1" },
    })
    expect(parseHermesShellHookResponse("pre_tool_call", JSON.stringify({ decision: "block", reason: "stop" }))).toEqual({ action: "block", message: "stop" })
    expect(parseHermesShellHookResponse("pre_llm_call", JSON.stringify({ context: "ctx" }))).toEqual({ context: "ctx" })
    expect(commandScriptPath("node -e \"console.log(1)\"")).toBe("node")

    const manager = createHermesPluginManagerProjection()
    const ctx = createHermesPluginContextProjection({ name: "policy" }, manager)
    ctx.register_hook("pre_tool_call", () => ({ action: "block", message: "blocked" }))
    ctx.register_hook("pre_tool_call", () => {
      throw new Error("late")
    })
    expect(invokeHermesPluginHook(manager, "pre_tool_call")).toEqual({ results: [{ action: "block", message: "blocked" }], errors: ["late"] })
    expect(getHermesPreToolCallBlockMessage(manager, { toolName: "terminal", allowedTools: ["read_file"] })).toBe("Tool 'terminal' denied: not in this thread's tool whitelist")
    expect(getHermesPreToolCallBlockMessage(manager, { toolName: "terminal", allowedTools: ["terminal"] })).toBe("blocked")
  })

  it("projects plugin discovery, command install helpers, and dashboard enablement", () => {
    const discovery = discoverHermesPluginManifestsProjection({
      manifests: [
        { name: "same", key: "same", source: "bundled", kind: "standalone" },
        { name: "same", key: "same", source: "user", kind: "standalone" },
        { name: "openai", key: "image_gen/openai", source: "bundled", kind: "backend" },
        { name: "irc", key: "platforms/irc", source: "bundled", kind: "platform" },
        { name: "memory", key: "memory/vector", source: "user", kind: "exclusive" },
        { name: "provider", key: "providers/local", source: "user", kind: "model-provider" },
      ],
      enabled: ["same"],
      disabled: ["memory/vector"],
    })
    expect(discovery.entries.map((entry) => [entry.manifest.key, entry.manifest.source, entry.enabled, entry.loadAction])).toEqual([
      ["same", "user", true, "loaded"],
      ["image_gen/openai", "bundled", true, "loaded"],
      ["platforms/irc", "bundled", true, "loaded"],
      ["memory/vector", "user", false, "recorded-disabled"],
      ["providers/local", "user", true, "recorded-model-provider"],
    ])
    expect(resolveHermesPluginGitURL("NousResearch/hermes-agent")).toBe("https://github.com/NousResearch/hermes-agent.git")
    expect(() => sanitizeHermesPluginName("../escape", "/home/user/.hermes/plugins")).toThrow("must not contain '/'")
    expect(sanitizeHermesPluginName("observability/langfuse", "/home/user/.hermes/plugins", { allowSubdir: true })).toBe("/home/user/.hermes/plugins/observability/langfuse")
    expect(normalizeHermesPluginCommandName("/Daily Report")).toBe("daily-report")
    expect(setHermesPluginEnabledState({ name: "alpha", enabled: true, enabledSet: ["old"], disabledSet: ["alpha"] })).toMatchObject({
      ok: true,
      enabled: ["alpha", "old"],
      disabled: [],
      unchanged: false,
    })
    expect(dashboardInstallHermesPluginProjection({
      identifier: "file:///tmp/repo.git",
      enable: true,
      manifest: { name: "repo", requires_env: ["API_KEY", { name: "TOKEN" }] },
      env: { API_KEY: "set" },
      hasAfterInstall: true,
    })).toMatchObject({
      ok: true,
      plugin_name: "repo",
      warnings: ["Insecure URL scheme; prefer https:// or git@ for production installs."],
      missing_env: ["TOKEN"],
      after_install_path: "/home/user/.hermes/plugins/repo/after-install.md",
      enabled: true,
    })
  })

  it("marks the selected assembly atoms product-native exact", () => {
    const contract = buildAssemblyContract({ product: "hermes-agent", generatedAt: "2026-06-13T00:00:00.000Z" })
    for (const atomID of hermesHookLifecycleNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:hermes-hook-lifecycle-native-exact-fixture", "hook-lifecycle-native-exact:hermes-agent"]),
        fixtureIDs: ["hermes-hook-lifecycle:native-exact-fixture"],
        knownLossiness: [],
        source: {
          packageName: "@helix/adapters-hermes",
          exportPath: "./product-schema/hooks",
          specifier: "@helix/adapters-hermes/product-schema/hooks",
        },
      })
      expect(atom?.nativeEvidenceRefs).not.toContain("conformance:hermes-hook-source-matrix")
      expect(atom?.fixtureIDs).not.toContain("hermes-hook:source-matrix")
    }
  })

  it("rejects native claims when exact cases or lossiness drift", () => {
    const fixture = buildHermesHookLifecycleNativeExactFixture()
    expect(verifyHermesHookLifecycleNativeExactFixture({ ...fixture, knownLossiness: ["product-bridge"] })).toMatchObject({
      issues: expect.arrayContaining([expect.objectContaining({ id: "hermes-hook-lifecycle-native-exact.lossiness" })]),
    })
    expect(verifyHermesHookLifecycleNativeExactFixture({
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "plugin-context-registries-and-hook-invoke"
          ? { ...item, output: { ...item.output, commandRegistered: false } }
          : item,
      ),
    })).toMatchObject({
      issues: expect.arrayContaining([expect.objectContaining({ id: "hermes-hook-lifecycle-native-exact.cases" })]),
    })
  })
})
