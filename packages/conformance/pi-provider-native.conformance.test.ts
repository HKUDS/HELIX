import { describe, expect, it } from "vitest"
import {
  buildPiMonoProviderBaseOptions,
  buildPiMonoProviderDescriptorNativeExactFixture,
  createPiMonoProviderModelExtensions,
  createPiMonoProviderRequestConfig,
  createPiMonoProviderRuntimeState,
  flushPiMonoPendingProviderRegistrations,
  piMonoProviderAuthDescriptorNativeExactAtomID,
  piMonoProviderDescriptorNativeExactEvidenceRef,
  piMonoProviderDescriptorNativeExactFixtureID,
  piMonoProviderDescriptorNativeExactReplayRef,
  piMonoProviderEventObserverNativeExactAtomID,
  piMonoProviderExtensionDescriptorNativeExactAtomID,
  piMonoProviderModelExtensionNativeExactAtomID,
  piMonoProviderNativeDescriptors,
  piMonoProviderParserObserverNativeExactAtomID,
  piMonoProviderRequestOptionsNativeExactAtomID,
  piMonoProviderStreamingDeltaRecorderNativeExactAtomID,
  piMonoProviderStreamProjectorNativeExactAtomID,
  piMonoProviderTransportInstrumentationNativeExactAtomID,
  piMonoProviderUsageRendererNativeExactAtomID,
  piMonoProviderUpstreamRef,
  resolvePiMonoProviderAuth,
  upsertPiMonoProviderConfig,
  validatePiMonoProviderConfig,
  verifyPiMonoProviderDescriptorNativeExactFixture,
  type PiMonoProviderConfig,
} from "@helix/adapters-pi/product-schema/provider"

describe("Pi provider native exact conformance", () => {
  const providerConfig: PiMonoProviderConfig = {
    baseUrl: "https://ai.corp.example/v1",
    apiKey: "CORPORATE_AI_KEY",
    api: "anthropic-messages",
    headers: { "x-provider": "corp" },
    authHeader: true,
    models: [
      {
        id: "claude-proxy",
        name: "Claude Proxy",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 200000,
        maxTokens: 16384,
        headers: { "x-model": "claude-proxy" },
      },
      {
        id: "responses-proxy",
        name: "Responses Proxy",
        api: "openai-responses",
        baseUrl: "https://responses.corp.example/v1",
        reasoning: true,
        input: ["text"],
        cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 0.2 },
        contextWindow: 128000,
        maxTokens: 8192,
      },
    ],
  }

  it("matches upstream base request options, provider model projection, and auth merge semantics", () => {
    expect(buildPiMonoProviderBaseOptions(
      { id: "claude-proxy", provider: "corporate-ai", api: "anthropic-messages" },
      {
        temperature: 0.3,
        maxTokens: 4096,
        apiKey: "option-key",
        transport: "sse",
        cacheRetention: "long",
        sessionId: "session-1",
        headers: { "x-option": "1" },
        timeoutMs: 1000,
        maxRetries: 2,
        maxRetryDelayMs: 5000,
        metadata: { trace: "abc" },
      },
      "explicit-key",
    )).toMatchObject({
      temperature: 0.3,
      maxTokens: 4096,
      apiKey: "explicit-key",
      transport: "sse",
      cacheRetention: "long",
      sessionId: "session-1",
      headers: { "x-option": "1" },
      timeoutMs: 1000,
      maxRetries: 2,
      maxRetryDelayMs: 5000,
      metadata: { trace: "abc" },
    })
    expect(buildPiMonoProviderBaseOptions(
      { id: "claude-proxy", provider: "corporate-ai", api: "anthropic-messages" },
      { apiKey: "option-key" },
      "",
    ).apiKey).toBe("option-key")

    expect(() => validatePiMonoProviderConfig("corporate-ai", providerConfig)).not.toThrow()
    expect(() => validatePiMonoProviderConfig("bad-ai", { streamSimple: () => undefined })).toThrow(/"api" is required/)
    expect(() => validatePiMonoProviderConfig("bad-ai", { api: "anthropic-messages", models: providerConfig.models })).toThrow(/"baseUrl" is required/)
    expect(() => validatePiMonoProviderConfig("bad-ai", { api: "anthropic-messages", baseUrl: "https://ai.example", models: providerConfig.models })).toThrow(/"apiKey" or "oauth" is required/)

    const models = createPiMonoProviderModelExtensions("corporate-ai", providerConfig)
    expect(models).toEqual([
      expect.objectContaining({
        id: "claude-proxy",
        name: "Claude Proxy",
        api: "anthropic-messages",
        provider: "corporate-ai",
        baseUrl: "https://ai.corp.example/v1",
        headers: undefined,
      }),
      expect.objectContaining({
        id: "responses-proxy",
        api: "openai-responses",
        baseUrl: "https://responses.corp.example/v1",
        headers: undefined,
      }),
    ])

    const requestConfig = createPiMonoProviderRequestConfig(providerConfig)
    expect(requestConfig).toEqual({ apiKey: "CORPORATE_AI_KEY", headers: { "x-provider": "corp" }, authHeader: true })
    expect(createPiMonoProviderRequestConfig({})).toBeUndefined()

    expect(resolvePiMonoProviderAuth({
      model: { id: "claude-proxy", provider: "corporate-ai", headers: { "x-shared": "model", "x-model": "1" } },
      providerConfig: requestConfig,
      modelHeaders: { "x-shared": "stored", "x-stored": "1" },
      authStorageApiKey: "auth-storage-key",
    })).toEqual({
      ok: true,
      apiKey: "auth-storage-key",
      headers: {
        "x-shared": "stored",
        "x-model": "1",
        "x-provider": "corp",
        "x-stored": "1",
        Authorization: "Bearer auth-storage-key",
      },
    })
    expect(resolvePiMonoProviderAuth({
      model: { id: "claude-proxy", provider: "corporate-ai" },
      providerConfig: { authHeader: true },
    })).toEqual({ ok: false, error: "No API key found for \"corporate-ai\"" })

    expect(upsertPiMonoProviderConfig({ baseUrl: "https://old.example", apiKey: "OLD_KEY", api: "anthropic-messages" }, { baseUrl: "https://new.example", apiKey: undefined })).toEqual({
      baseUrl: "https://new.example",
      apiKey: "OLD_KEY",
      api: "anthropic-messages",
    })
  })

  it("matches upstream extension provider registration queue and session-service flush semantics", () => {
    const runtime = createPiMonoProviderRuntimeState()
    runtime.registerProvider("corporate-ai", providerConfig, "/extensions/provider.ts")
    runtime.registerProvider("temporary-ai", { baseUrl: "https://tmp.example" }, "/extensions/provider.ts")
    runtime.unregisterProvider("temporary-ai")

    expect(runtime.pendingProviderRegistrations).toEqual([
      expect.objectContaining({
        name: "corporate-ai",
        extensionPath: "/extensions/provider.ts",
      }),
    ])

    const registered: string[] = []
    runtime.registerProvider("bad-ai", providerConfig, "/extensions/provider.ts")
    const diagnostics = flushPiMonoPendingProviderRegistrations({
      runtime,
      modelRegistry: {
        registerProvider(name) {
          if (name === "bad-ai") throw new Error("registry rejected provider")
          registered.push(name)
        },
      },
    })

    expect(registered).toEqual(["corporate-ai"])
    expect(diagnostics).toEqual([
      { type: "error", message: "Extension \"/extensions/provider.ts\" error: registry rejected provider" },
    ])
    expect(runtime.pendingProviderRegistrations).toEqual([])

    const stale = createPiMonoProviderRuntimeState()
    stale.invalidate("stale extension")
    expect(() => stale.registerProvider("late-ai", providerConfig)).toThrow("stale extension")
  })

  it("publishes native descriptors and verifies the provider descriptor fixture", () => {
    const fixture = buildPiMonoProviderDescriptorNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
        piMonoProviderAuthDescriptorNativeExactAtomID,
        piMonoProviderEventObserverNativeExactAtomID,
        piMonoProviderExtensionDescriptorNativeExactAtomID,
        piMonoProviderModelExtensionNativeExactAtomID,
        piMonoProviderParserObserverNativeExactAtomID,
        piMonoProviderRequestOptionsNativeExactAtomID,
        piMonoProviderStreamingDeltaRecorderNativeExactAtomID,
        piMonoProviderStreamProjectorNativeExactAtomID,
        piMonoProviderTransportInstrumentationNativeExactAtomID,
        piMonoProviderUsageRendererNativeExactAtomID,
      ],
      portIDs: [
        "provider.auth",
        "provider.event-normalizer",
        "provider.stream",
        "provider.model-registry",
        "provider.stream-parser",
        "provider.request-shape",
        "provider.streaming-delta-recorder",
        "provider.stream-projector",
        "provider.transport",
        "provider.usage-normalizer",
      ],
      upstreamRef: piMonoProviderUpstreamRef,
      evidenceRef: piMonoProviderDescriptorNativeExactEvidenceRef,
      fixtureID: piMonoProviderDescriptorNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [piMonoProviderDescriptorNativeExactEvidenceRef, piMonoProviderDescriptorNativeExactReplayRef],
      fixtureIDs: [piMonoProviderDescriptorNativeExactFixtureID],
      knownLossiness: [],
      descriptors: piMonoProviderNativeDescriptors.map((descriptor) => ({ ...descriptor })),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("extensions/types.ts#ProviderConfig,ProviderModelConfig,ExtensionRuntimeState"),
      expect.stringContaining("extensions/loader.ts#createExtensionRuntime,createExtensionAPI,loadExtensionFromFactory"),
      expect.stringContaining("model-registry.ts#ModelRegistry.registerProvider,ModelRegistry.validateProviderConfig,ModelRegistry.applyProviderConfig,ModelRegistry.getApiKeyAndHeaders"),
      expect.stringContaining("providers/simple-options.ts#buildBaseOptions"),
      expect.stringContaining("providers/anthropic.ts#streamAnthropic,iterateAnthropicEvents,mapStopReason"),
      expect.stringContaining("providers/openai-responses-shared.ts#processResponsesStream"),
      expect.stringContaining("models.ts#calculateCost"),
    ]))
    expect(fixture.cases.map((testCase) => testCase.scenarioID)).toEqual([
      "base-options-api-key-and-retry-fields",
      "base-options-empty-explicit-api-key-falls-back",
      "observer-callback-replaces-payload-and-captures-response",
      "provider-config-validates-model-auth-and-api",
      "model-extension-replaces-provider-models",
      "request-auth-merges-headers-and-bearer",
      "anthropic-stream-projects-text-stop-usage-cost",
      "openai-responses-stream-projects-text-cache-usage-cost",
      "transport-options-pass-timeout-retry-signal",
      "extension-runtime-queues-and-unregisters-by-name",
      "session-services-flushes-pending-registrations-and-diagnostics",
    ])
    expect(fixture.cases.find((testCase) => testCase.scenarioID === "observer-callback-replaces-payload-and-captures-response")?.output).toMatchObject({
      payloadWasReplaced: true,
      observerOrder: ["onPayload:before-request", "onResponse:before-stream-start"],
      responseHeaderKeys: ["content-type", "x-request-id"],
    })
    expect(fixture.cases.find((testCase) => testCase.scenarioID === "anthropic-stream-projects-text-stop-usage-cost")?.output).toMatchObject({
      eventTypes: ["start", "text_start", "text_delta", "text_delta", "text_end", "done"],
      contentKinds: ["text"],
      text: "hello pi",
      stopReason: "stop",
      input: 11,
      output: 5,
      cacheRead: 3,
      cacheWrite: 2,
      totalTokens: 21,
      costTotal: expect.closeTo(0.0000455, 12),
    })
    expect(fixture.cases.find((testCase) => testCase.scenarioID === "openai-responses-stream-projects-text-cache-usage-cost")?.output).toMatchObject({
      eventTypes: ["start", "text_start", "text_delta", "text_delta", "text_end", "done"],
      contentKinds: ["text"],
      text: "cached answer",
      stopReason: "stop",
      input: 12,
      output: 7,
      cacheRead: 5,
      totalTokens: 24,
      costTotal: expect.closeTo(0.000068125, 12),
    })
    expect(fixture.cases.find((testCase) => testCase.scenarioID === "transport-options-pass-timeout-retry-signal")?.output).toMatchObject({
      requestOptionKeys: ["signal", "timeout", "maxRetries"],
      baseOptionKeys: ["transport", "cacheRetention", "sessionId", "headers", "maxRetryDelayMs"],
      timeout: 1500,
      maxRetries: 3,
      maxRetryDelayMs: 60000,
      hasSignal: true,
    })
    expect(verifyPiMonoProviderDescriptorNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    expect(verifyPiMonoProviderDescriptorNativeExactFixture({ ...fixture, fingerprint: "0000000000000000" }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-provider-descriptor-native-exact.fingerprint" }),
    ]))
    expect(verifyPiMonoProviderDescriptorNativeExactFixture({ ...fixture, knownLossiness: ["native-parity-not-proven"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-provider-descriptor-native-exact.lossiness" }),
    ]))
    expect(verifyPiMonoProviderDescriptorNativeExactFixture({ ...fixture, sourceRefs: [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-provider-descriptor-native-exact.upstream" }),
    ]))
    expect(verifyPiMonoProviderDescriptorNativeExactFixture({
      ...fixture,
      cases: fixture.cases.map((testCase) => testCase.scenarioID === "anthropic-stream-projects-text-stop-usage-cost"
        ? { ...testCase, output: { ...testCase.output, stopReason: "length" } }
        : testCase),
    }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-provider-descriptor-native-exact.cases" }),
    ]))
  })
})
