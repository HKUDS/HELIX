import { describe, expect, it } from "vitest"
import {
  buildPiMonoHookLifecycleNativeExactFixture,
  createPiMonoExtensionAPIProjection,
  createPiMonoExtensionProjection,
  createPiMonoHookRuntimeProjection,
  getPiMonoMessageRenderer,
  piMonoHookLifecycleNativeDescriptors,
  piMonoHookLifecycleNativeExactAtomIDs,
  projectPiMonoBeforeProviderRequest,
  projectPiMonoRunnerEmit,
  projectPiMonoSessionShutdown,
  projectPiMonoToolResultHandlers,
  verifyPiMonoHookLifecycleNativeExactFixture,
} from "@helix/adapters-pi/product-schema/hooks"
import { buildAssemblyContract } from "@helix/recipes"

describe("Pi hook lifecycle native exact fixture", () => {
  it("captures upstream loader, runner, registry, and lifecycle behavior as native exact", async () => {
    const fixture = await buildPiMonoHookLifecycleNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
        "pi.extension.cleanup",
        "pi.extension.event-mapper",
        "pi.extension.loader",
        "pi.extension.provider-registry-bridge",
        "pi.extension.ui-registry-bridge",
        "pi.hook.error-defaults",
        "pi.hook.extension-bridge",
        "pi.hook.handler-adapter",
        "pi.hook.observer-adapter",
        "pi.hook.scheduler-defaults",
        "pi.registry.command",
        "pi.registry.message-renderer",
        "pi.registry.provider-extension",
        "pi.registry.register-tool",
      ],
      upstreamRef: "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      evidenceRef: "conformance:pi-hook-lifecycle-native-exact-fixture",
      fixtureID: "pi-hook-lifecycle:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: ["conformance:pi-hook-lifecycle-native-exact-fixture", "hook-lifecycle-native-exact:pi-mono"],
      fixtureIDs: ["pi-hook-lifecycle:native-exact-fixture"],
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
      expect.stringContaining("packages/coding-agent/src/core/extensions/loader.ts#createExtensionRuntime,createExtensionAPI,loadExtensionFromFactory"),
      expect.stringContaining("packages/coding-agent/src/core/extensions/runner.ts#ExtensionRunner.bindCore,createContext,emit,emitBeforeProviderRequest,emitToolResult,emitSessionShutdownEvent"),
      expect.stringContaining("packages/coding-agent/src/core/extensions/types.ts#ExtensionAPI,ExtensionRuntime,Extension,RegisteredTool,RegisteredCommand,ExtensionFlag,MessageRenderer"),
    ]))
    expect(fixture.policy).toMatchObject({
      loadExtensionFromFactoryCreatesExtensionRecord: true,
      providerRegistrationQueuesBeforeBindAndFlushesOnBindCore: true,
      runnerEmitVisitsExtensionsThenHandlersInLoadOrder: true,
      genericRunnerEmitCollectsHandlerErrorsAndContinues: true,
      beforeProviderRequestUsesMutablePayloadChain: true,
      toolResultHandlersPatchContentDetailsAndIsError: true,
      sessionShutdownOnlyEmitsWhenHandlersExist: true,
      staleRuntimeRejectsCapturedAPIsAfterInvalidate: true,
      uiRegistryMatchesUpstreamMessageRendererOnly: true,
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "load-extension-from-factory-registers-runtime-state",
      "runner-bind-core-flushes-provider-registrations",
      "generic-runner-emit-order-cancel-and-errors",
      "handler-adapters-mutate-provider-request-and-tool-result",
      "registries-command-flag-shortcut-message-renderer",
      "session-shutdown-and-stale-context-lifecycle",
    ])
    expect(fixture.cases.find((item) => item.scenarioID === "load-extension-from-factory-registers-runtime-state")?.output).toMatchObject({
      handlers: ["agent_start"],
      tools: ["echo_session"],
      commands: ["add-echo-tool"],
      shortcuts: ["ctrl+x"],
      flags: ["trace"],
      messageRenderers: ["echo.result"],
      pendingProviders: ["local-proxy"],
      refreshToolsCount: 1,
      flagTrace: true,
    })
    expect(fixture.cases.find((item) => item.scenarioID === "generic-runner-emit-order-cancel-and-errors")?.output).toMatchObject({
      errors: ["/extensions/first.ts:agent_start:first boom"],
      cancelVisited: ["/extensions/first.ts:session_before_switch:1"],
      cancelShortCircuited: true,
    })
    expect(fixture.cases.find((item) => item.scenarioID === "registries-command-flag-shortcut-message-renderer")?.output).toMatchObject({
      commandDescription: "last",
      flagDefaultFirstWins: true,
      getFlagRegistered: true,
      getFlagUnregistered: true,
      rendererHit: true,
      uiRegistrySurface: "message-renderer-only",
    })
    expect(await verifyPiMonoHookLifecycleNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
  })

  it("exposes native descriptors for the Pi hook lifecycle atom group", () => {
    expect(piMonoHookLifecycleNativeDescriptors.map((descriptor) => [descriptor.id, descriptor.port])).toEqual([
      ["pi.extension.cleanup", "hook.cleanup-scope"],
      ["pi.extension.event-mapper", "hook.handler-chain"],
      ["pi.extension.loader", "hook.bus"],
      ["pi.extension.provider-registry-bridge", "registry.provider"],
      ["pi.extension.ui-registry-bridge", "registry.ui"],
      ["pi.hook.error-defaults", "hook.error-policy"],
      ["pi.hook.extension-bridge", "hook.bus"],
      ["pi.hook.handler-adapter", "hook.handler-chain"],
      ["pi.hook.observer-adapter", "hook.observer-chain"],
      ["pi.hook.scheduler-defaults", "hook.scheduler"],
      ["pi.registry.command", "registry.command"],
      ["pi.registry.message-renderer", "registry.ui"],
      ["pi.registry.provider-extension", "registry.provider"],
      ["pi.registry.register-tool", "tool.registry"],
    ])
    expect(piMonoHookLifecycleNativeDescriptors.every((descriptor) => descriptor.implementationKind === "factory")).toBe(true)
    expect(piMonoHookLifecycleNativeDescriptors.every((descriptor) => descriptor.parityCoverage === "native")).toBe(true)
    expect(piMonoHookLifecycleNativeDescriptors.every((descriptor) => descriptor.knownLossiness.length === 0)).toBe(true)
    expect(piMonoHookLifecycleNativeDescriptors.flatMap((descriptor) => descriptor.fixtureIDs)).toEqual(
      expect.arrayContaining(["pi-hook-lifecycle:native-exact-fixture"]),
    )
  })

  it("projects runner and registry behavior without partial bridge lossiness", async () => {
    const first = createPiMonoExtensionProjection("/extensions/first.ts")
    const firstAPI = createPiMonoExtensionAPIProjection(first, createPiMonoHookRuntimeProjection())
    firstAPI.on("agent_start", () => undefined)
    firstAPI.on("agent_start", () => {
      throw new Error("boom")
    })
    const second = createPiMonoExtensionProjection("/extensions/second.ts")
    createPiMonoExtensionAPIProjection(second, createPiMonoHookRuntimeProjection()).on("agent_start", () => undefined)
    await expect(projectPiMonoRunnerEmit({ extensions: [first, second], event: { type: "agent_start" } })).resolves.toMatchObject({
      visited: ["/extensions/first.ts:agent_start:1", "/extensions/first.ts:agent_start:2", "/extensions/second.ts:agent_start:3"],
      errors: [expect.objectContaining({ extensionPath: "/extensions/first.ts", error: "boom" })],
      cancelled: false,
    })

    const handlers = createPiMonoExtensionProjection("/extensions/handlers.ts")
    const api = createPiMonoExtensionAPIProjection(handlers, createPiMonoHookRuntimeProjection())
    api.on("before_provider_request", (event) => ({ ...(event.payload as Record<string, unknown>), model: "patched" }))
    api.on("tool_result", () => ({ details: { patched: true }, isError: true }))
    api.registerMessageRenderer("trace", () => "rendered")

    await expect(projectPiMonoBeforeProviderRequest([handlers], { model: "original" })).resolves.toMatchObject({
      finalPayload: { model: "patched" },
      visited: ["/extensions/handlers.ts"],
      errors: [],
    })
    await expect(projectPiMonoToolResultHandlers([handlers], { details: { original: true }, isError: false })).resolves.toMatchObject({
      modified: true,
      output: { details: { patched: true }, isError: true },
      visited: ["/extensions/handlers.ts"],
      errors: [],
    })
    expect(getPiMonoMessageRenderer([handlers], "trace")?.()).toBe("rendered")
    expect(await projectPiMonoSessionShutdown([handlers])).toEqual({ emitted: false, visited: [], errors: [] })
  })

  it("marks the selected assembly atoms product-native exact", () => {
    const contract = buildAssemblyContract({ product: "pi-mono", generatedAt: "2026-06-10T00:00:00.000Z" })
    for (const atomID of piMonoHookLifecycleNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-hook-lifecycle-native-exact-fixture", "hook-lifecycle-native-exact:pi-mono"]),
        fixtureIDs: ["pi-hook-lifecycle:native-exact-fixture"],
        knownLossiness: [],
        source: {
          packageName: "@helix/adapters-pi",
          exportPath: "./product-schema/hooks",
          specifier: "@helix/adapters-pi/product-schema/hooks",
        },
      })
    }
  })

  it("rejects native claims when exact cases or lossiness drift", async () => {
    const fixture = await buildPiMonoHookLifecycleNativeExactFixture()
    await expect(verifyPiMonoHookLifecycleNativeExactFixture({ ...fixture, knownLossiness: ["product-bridge"] })).resolves.toMatchObject({
      issues: expect.arrayContaining([expect.objectContaining({ id: "pi-hook-lifecycle-native-exact.lossiness" })]),
    })
    await expect(verifyPiMonoHookLifecycleNativeExactFixture({
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "registries-command-flag-shortcut-message-renderer"
          ? { ...item, output: { ...item.output, rendererHit: false } }
          : item,
      ),
    })).resolves.toMatchObject({
      issues: expect.arrayContaining([expect.objectContaining({ id: "pi-hook-lifecycle-native-exact.cases" })]),
    })
  })
})
