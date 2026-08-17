import { describe, expect, it } from "vitest"
import {
  buildNanobotHookLifecycleNativeExactFixture,
  buildNanobotHookLifecycleNativeExactFixtureAsync,
  createNanobotAgentHookContextProjection,
  createNanobotAgentHookProjection,
  createNanobotCommandRouterProjection,
  createNanobotCompositeHookProjection,
  createNanobotToolRegistryProjection,
  nanobotHookLifecycleNativeDescriptors,
  nanobotHookLifecycleNativeExactAtomIDs,
  nanobotProviderBackendForName,
  nanobotProviderSpecLabel,
  nanobotToolSchemaName,
  verifyNanobotHookLifecycleNativeExactFixture,
} from "@helix/adapters-nanobot/product-schema/hooks"

describe("Nanobot hook lifecycle native exact fixture", () => {
  it("captures upstream AgentHook, ToolRegistry, command, provider, and channel behavior as native exact", async () => {
    const fixture = buildNanobotHookLifecycleNativeExactFixture()
    const replayed = await buildNanobotHookLifecycleNativeExactFixtureAsync()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "nanobot",
      atomIDs: [
        "nanobot.hook.error-defaults",
        "nanobot.hook.handler-adapter",
        "nanobot.hook.observer-adapter",
        "nanobot.hook.plugin-bridge",
        "nanobot.hook.scheduler-defaults",
        "nanobot.plugin.cleanup",
        "nanobot.plugin.event-mapper",
        "nanobot.plugin.loader",
        "nanobot.plugin.provider-registry-bridge",
        "nanobot.plugin.ui-registry-bridge",
        "nanobot.registry.command",
        "nanobot.registry.provider-plugin",
        "nanobot.registry.tool-definition",
        "nanobot.registry.ui-provider",
      ],
      upstreamRef: "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
      evidenceRef: "conformance:nanobot-hook-lifecycle-native-exact-fixture",
      fixtureID: "nanobot-hook-lifecycle:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: ["conformance:nanobot-hook-lifecycle-native-exact-fixture", "hook-lifecycle-native-exact:nanobot"],
      fixtureIDs: ["nanobot-hook-lifecycle:native-exact-fixture"],
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
      expect.stringContaining("nanobot/agent/hook.py#AgentHookContext,AgentHook,CompositeHook,SDKCaptureHook"),
      expect.stringContaining("nanobot/agent/tools/registry.py#ToolRegistry"),
      expect.stringContaining("nanobot/agent/tools/loader.py#ToolLoader.discover,_discover_plugins,load"),
      expect.stringContaining("nanobot/command/router.py#CommandRouter"),
      expect.stringContaining("nanobot/channels/registry.py#discover_plugins,discover_all"),
    ]))
    expect(fixture.policy).toMatchObject({
      compositeHookFansOutAsyncMethodsInOrder: true,
      compositeHookIsolatesNonReraiseErrorsAndContinues: true,
      toolRegistrySortsBuiltinsBeforeMCPAndCachesUntilMutation: true,
      toolLoaderPluginCannotShadowBuiltinToolName: true,
      commandRouterChecksPriorityExactThenLongestPrefix: true,
      allHookAtomsShareNativeLifecycleFixture: true,
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "agent-hook-composite-lifecycle",
      "composite-error-isolation-and-reraise",
      "runner-sdk-capture-and-extra-hook-order",
      "tool-registry-sort-cache-prepare-execute",
      "tool-loader-entrypoints-and-collisions",
      "command-provider-channel-registries",
    ])
    expect(fixture.cases.find((item) => item.scenarioID === "agent-hook-composite-lifecycle")?.output).toMatchObject({
      wantsStreaming: true,
      finalized: "DONE!",
      emptyCompositeStreaming: false,
      emptyCompositeFinalize: "unchanged",
    })
    expect(fixture.cases.find((item) => item.scenarioID === "composite-error-isolation-and-reraise")?.output).toMatchObject({
      isolatedErrors: [
        "AgentHook.before_iteration error in bad: bad:before_iteration:boom",
        "AgentHook.on_stream error in bad: bad:on_stream:boom",
      ],
      reraiseMessage: "fatal:before_iteration:boom",
    })
    expect(fixture.cases.find((item) => item.scenarioID === "tool-registry-sort-cache-prepare-execute")?.output).toMatchObject({
      definitionOrder: ["alpha", "boom", "zeta", "mcp_a", "mcp_z"],
      cacheStable: true,
      cacheInvalidated: true,
      validationError: "Error: Invalid parameters for tool 'alpha': required missing",
    })
    expect(fixture.cases.find((item) => item.scenarioID === "command-provider-channel-registries")?.output).toMatchObject({
      isPriorityWithWhitespace: true,
      priorityDispatch: "stopped",
      isDispatchableTeam: true,
      prefixOrder: ["/team admin ", "/team "],
      prefixResult: "alice",
      prefixHandledBy: "team-admin",
      providerLabels: ["Custom", "Azure OpenAI", "OpenRouter"],
      channels: { matrix: "MatrixPlugin", websocket: "BuiltinWebsocket", telegram: "TelegramChannel" },
      shadowedChannels: ["websocket"],
    })
    expect(verifyNanobotHookLifecycleNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(replayed.cases).toEqual(fixture.cases)
  })

  it("exposes descriptors for every Nanobot hook lifecycle atom without lossiness", () => {
    expect(nanobotHookLifecycleNativeExactAtomIDs).toHaveLength(14)
    expect(nanobotHookLifecycleNativeDescriptors).toHaveLength(14)
    for (const atomID of nanobotHookLifecycleNativeExactAtomIDs) {
      expect(nanobotHookLifecycleNativeDescriptors.find((descriptor) => descriptor.id === atomID)).toMatchObject({
        id: atomID,
        product: "nanobot",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: ["conformance:nanobot-hook-lifecycle-native-exact-fixture", "hook-lifecycle-native-exact:nanobot"],
        fixtureIDs: ["nanobot-hook-lifecycle:native-exact-fixture"],
        knownLossiness: [],
      })
    }
  })

  it("keeps projection helpers aligned with upstream edge cases", async () => {
    const ctx = createNanobotAgentHookContextProjection({ iteration: 3, messages: [] })
    const bad = createNanobotAgentHookProjection({ label: "bad", throwOn: ["before_iteration"] })
    const good = createNanobotAgentHookProjection({ label: "good" })
    const composite = createNanobotCompositeHookProjection([bad, good])
    await composite.before_iteration(ctx)
    expect(composite.isolatedErrors).toEqual(["AgentHook.before_iteration error in bad: bad:before_iteration:boom"])
    expect(good.events).toEqual(["before_iteration:3"])

    const registry = createNanobotToolRegistryProjection([
      { name: "mcp_z", schema: { name: "mcp_z" } },
      { name: "alpha", schema: { function: { name: "alpha" } } },
    ])
    expect(registry.get_definitions().map(nanobotToolSchemaName)).toEqual(["alpha", "mcp_z"])
    expect(await registry.execute("missing", {})).toContain("[Analyze the error above and try a different approach.]")

    const router = createNanobotCommandRouterProjection()
    router.prefix("/team ", (commandCtx) => commandCtx.args)
    router.prefix("/team admin ", (commandCtx) => commandCtx.args)
    const commandCtx = { raw: "/team admin bob", args: "" }
    expect(await router.dispatch(commandCtx)).toBe("bob")
    expect(commandCtx.args).toBe("bob")

    expect(nanobotProviderSpecLabel({ name: "openrouter", display_name: "OpenRouter" })).toBe("OpenRouter")
    expect(nanobotProviderBackendForName([{ name: "azure_openai", keywords: [], env_key: "", backend: "azure_openai" }], "missing")).toBe("openai_compat")
  })
})
