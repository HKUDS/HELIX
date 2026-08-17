import { describe, expect, it } from "vitest"
import { createID, type ProviderRequest, type ProviderStreamEvent } from "@helix/contracts"
import { createUserMessage } from "@helix/lego-session"
import {
  createAnthropicProvider,
  createAnthropicRequestShape,
  createGoogleProvider,
  createGoogleRequestShape,
  buildHermesProviderSourceMatrixSnapshot,
  createMemoryProviderCassette,
  createMockSSEProviderTransport,
  buildNanobotProviderSourceMatrixSnapshot,
  buildOpenCodeProviderPluginRuntimeMatrixSnapshot,
  buildOpenCodeProviderRawFrameBoundaryMatrixSnapshot,
  buildOpenCodeProviderSourceMatrixSnapshot,
  buildProviderCommonPublicSurfaceGuardSnapshot,
  buildProviderRawFrameExactDiffBlockerSnapshot,
  buildProviderRawFramePinnedReplaySnapshot,
  buildProviderRawFrameReplayGateSnapshot,
  captureOpenCodeProviderPackageRuntimeLiveRuntimeFixture,
  captureOpenCodeProviderPackageRuntimeNativeExactDiffFixture,
  captureOpenCodeProviderRetryCancelNativeExactDiffFixture,
  captureOpenCodeProviderRetryCancelLiveRuntimeFixture,
  createOpenAICompatibleProvider,
  createOpenAICompatibleRequestShape,
  createOpenRouterProvider,
  buildPiProviderSourceMatrixSnapshot,
  createProviderUsageNormalizer,
  createRecordedCassetteProviderTransport,
  createRecordingProviderTransport,
  createStaticProviderModelRegistry,
  normalizeProviderStream,
  parseAnthropicStream,
  parseGoogleStream,
  parseOpenCodeCustomProviderFrames,
  parseOpenAICompatibleStream,
  projectOpenCodeProviderPackageRuntimeProjection,
  projectOpenCodeProviderRetryCancelRace,
  projectOpenCodeProviderRetryCancelTiming,
  verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture,
  verifyOpenCodeProviderPackageRuntimeNativeExactDiffFixture,
  verifyOpenCodeProviderRetryCancelNativeExactDiffFixture,
  verifyOpenCodeProviderRetryCancelLiveRuntimeFixture,
  verifyProviderCommonPublicSurfaceGuardSnapshot,
  verifyProviderRawFrameExactDiffBlockerSnapshot,
  verifyProviderRawFramePinnedReplaySnapshot,
  verifyProviderRawFrameReplayGateSnapshot,
  type OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback,
} from "@helix/lego-provider"
import {
  captureOpenCodeProviderRequestOptionsNativeExactFixture,
  createOpenCodeProviderRequestOptionsBridge,
  verifyOpenCodeProviderRequestOptionsNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-request-options"
import {
  captureOpenCodeProviderParserObserverNativeExactFixture,
  createOpenCodeProviderParserObserverBridge,
  verifyOpenCodeProviderParserObserverNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-parser-observer"
import {
  captureOpenCodeProviderEventObserverNativeExactFixture,
  createOpenCodeProviderEventObserverBridge,
  verifyOpenCodeProviderEventObserverNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-event-observer"
import {
  captureOpenCodeProviderStreamProjectorNativeExactFixture,
  projectOpenCodeProviderStreamEvents,
  verifyOpenCodeProviderStreamProjectorNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-stream-projector"
import {
  captureOpenCodeProviderUsageNativeExactFixture,
  createOpenCodeProviderUsageNormalizer as createOpenCodeNativeProviderUsageNormalizer,
  verifyOpenCodeProviderUsageNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-usage"
import {
  captureOpenCodeProviderTransportInstrumentationNativeExactFixture,
  createOpenCodeProviderTransportInstrumentationBridge,
  verifyOpenCodeProviderTransportInstrumentationNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-transport-instrumentation"
import {
  captureOpenCodeProviderBuiltinPluginsNativeExactFixture,
  createOpenCodeProviderBuiltinPluginsBridge,
  verifyOpenCodeProviderBuiltinPluginsNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-builtin-plugins"
import {
  captureOpenCodeDynamicProviderPackageNativeExactFixture,
  createOpenCodeDynamicProviderPackageBridge,
  verifyOpenCodeDynamicProviderPackageNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-dynamic-package"
import {
  captureOpenCodeOpenAIProviderPluginNativeExactFixture,
  createOpenCodeOpenAIProviderPluginBridge,
  verifyOpenCodeOpenAIProviderPluginNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-openai-plugin"
import {
  captureOpenCodeAISDKProviderPluginsNativeExactFixture,
  createOpenCodeAISDKProviderPluginsBridge,
  verifyOpenCodeAISDKProviderPluginsNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-aisdk-plugins"
import {
  captureOpenCodeProviderSDKResolverNativeExactFixture,
  createOpenCodeProviderSDKResolverBridge,
  createOpenCodeProviderSDKResolverState,
  verifyOpenCodeProviderSDKResolverNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-sdk-resolver"
import {
  captureOpenCodeProviderCustomLoadersNativeExactFixture,
  createOpenCodeProviderCustomLoadersBridge,
  verifyOpenCodeProviderCustomLoadersNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-custom-loaders"
import {
  captureOpenCodePluginProviderRegistryNativeExactFixture,
  verifyOpenCodePluginProviderRegistryNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-provider-registry"
import {
  captureOpenCodePluginHotReloadCleanupNativeExactFixture,
  verifyOpenCodePluginHotReloadCleanupNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-hot-reload-cleanup"
import {
  captureOpenCodeTurnRetryPolicyNativeExactFixture,
  createOpenCodeTurnRetryPolicyBridge,
  openCodeTurnRetryAPIError,
  verifyOpenCodeTurnRetryPolicyNativeExactFixture,
} from "@helix/adapters-opencode/opencode-turn-retry-policy"

describe("provider stream conformance", () => {
  it("anchors OpenCode provider bridge ports to pinned upstream LLM sources", () => {
    const snapshot = buildOpenCodeProviderSourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-source-matrix",
      fixtureID: "opencode-provider:source-matrix",
      partialBranchIDs: [],
      missingBranchIDs: [],
      coveredProviderAtomIDs: expect.arrayContaining([
        "opencode.provider.auth-descriptor",
        "opencode.provider.event-observer",
        "opencode.provider.model-plugin",
        "opencode.provider.parser-observer",
        "opencode.provider.plugin-descriptor",
        "opencode.provider.request-options",
        "opencode.provider.transport-instrumentation",
      ]),
      coveredProviderPortIDs: expect.arrayContaining([
        "provider.auth",
        "provider.model-registry",
        "provider.request-shape",
        "provider.stream-parser",
        "provider.event-normalizer",
        "provider.usage-normalizer",
        "provider.transport",
        "provider.stream",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-provider-source-matrix",
        "opencode-provider-request-options:native-exact-fixture",
        "provider-request-options-native-exact:opencode",
        "opencode-provider-parser-observer:native-exact-fixture",
        "provider-parser-observer-native-exact:opencode",
        "opencode-provider-usage:native-exact-fixture",
        "provider-usage-native-exact:opencode",
        "opencode-turn-retry-policy:native-exact-fixture",
        "turn-retry-policy-native-exact:opencode",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-provider:source-matrix",
        "opencode-provider-request-options:native-exact-fixture",
        "opencode-provider-parser-observer:native-exact-fixture",
        "opencode-provider-usage:native-exact-fixture",
        "opencode-turn-retry-policy:native-exact-fixture",
        "opencode-provider:package-runtime-native-exact-diff-fixture",
      ]),
      knownGaps: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "llm-request-prep",
        path: "packages/opencode/src/session/llm/request.ts",
        symbols: expect.arrayContaining(["Prepared", "prepare", "hasToolCalls", "LLMRequestPrep"]),
      }),
      expect.objectContaining({
        id: "llm-native-request",
        path: "packages/opencode/src/session/llm/native-request.ts",
        symbols: expect.arrayContaining(["RequestInput", "model", "request", "LLMNative"]),
      }),
      expect.objectContaining({
        id: "session-retry",
        path: "packages/opencode/src/session/retry.ts",
        symbols: expect.arrayContaining(["RetryReason", "Retryable", "delay", "policy", "retryable"]),
      }),
      expect.objectContaining({
        id: "session-usage",
        path: "packages/opencode/src/session/session.ts",
        symbols: ["getUsage"],
      }),
      expect.objectContaining({
        id: "plugin-hooks",
        path: "packages/plugin/src/index.ts",
        symbols: expect.arrayContaining(["Hooks", "chat.params", "chat.headers"]),
      }),
      expect.objectContaining({
        id: "provider-plugins",
        path: "packages/core/src/plugin/provider.ts",
        symbols: expect.arrayContaining(["ProviderPlugins"]),
      }),
      expect.objectContaining({
        id: "openai-provider-plugin",
        path: "packages/core/src/plugin/provider/openai.ts",
        symbols: expect.arrayContaining(["OpenAIPlugin", "aisdk.sdk", "aisdk.language", "catalog.transform"]),
      }),
      expect.objectContaining({
        id: "aisdk-provider-plugins",
        path: "packages/core/src/plugin/provider",
        symbols: expect.arrayContaining([
          "AnthropicPlugin",
          "OpenAICompatiblePlugin",
          "GatewayPlugin",
          "PerplexityPlugin",
          "GooglePlugin",
          "XAIPlugin",
          "OpenRouterPlugin",
          "aisdk.sdk",
          "aisdk.language",
          "catalog.transform",
        ]),
      }),
    ]))
    expect(snapshot.branchAnchors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        branchID: "provider-plugin-registry",
        status: "native-exact",
        localEvidenceRefs: expect.arrayContaining(["opencode-plugin-provider-registry:native-exact-fixture", "plugin-provider-registry-native-exact:opencode"]),
        localMarkers: expect.arrayContaining(["collectAuthHooks", "collectProviderModelHooks", "opencode.provider:sample-plugin"]),
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "model-plugin",
        status: "native-exact",
        providerAtomIDs: ["opencode.provider.model-plugin"],
        localEvidenceRefs: expect.arrayContaining(["opencode-provider-model-plugin:native-exact-fixture", "provider-model-plugin-native-exact:opencode"]),
        localMarkers: expect.arrayContaining(["toPublicInfo", "loadModels", "disabled-provider-filter"]),
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "request-options",
        status: "native-exact",
        providerAtomIDs: ["opencode.provider.request-options"],
        providerPortIDs: ["provider.request-shape"],
        sourceRefIDs: ["llm-request-prep", "plugin-hooks"],
        localEvidenceRefs: expect.arrayContaining(["opencode-provider-request-options:native-exact-fixture", "provider-request-options-native-exact:opencode"]),
        localMarkers: expect.arrayContaining(["chat.params", "chat.headers", "messageTransformOptions", "x-opencode-session", "x-session-affinity"]),
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "auth-descriptor",
        status: "native-exact",
        providerAtomIDs: ["opencode.provider.auth-descriptor"],
        localEvidenceRefs: expect.arrayContaining(["opencode-provider-auth-descriptor:native-exact-fixture", "provider-auth-descriptor-native-exact:opencode"]),
        localMarkers: expect.arrayContaining(["auth-info-schema", "store-key-normalization", "opencode.auth:sample-plugin"]),
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "stream-parser",
        status: "native-exact",
        providerAtomIDs: ["opencode.provider.parser-observer"],
        localEvidenceRefs: expect.arrayContaining(["opencode-provider-parser-observer:native-exact-fixture", "provider-parser-observer-native-exact:opencode"]),
        localMarkers: expect.arrayContaining(["context_overflow", "api_error", "retryable"]),
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "event-normalizer",
        status: "native-exact",
        providerAtomIDs: ["opencode.provider.event-observer"],
        localEvidenceRefs: expect.arrayContaining(["opencode-provider-event-observer:native-exact-fixture", "provider-event-observer-native-exact:opencode"]),
        localMarkers: expect.arrayContaining(["session-visible-stream-chunks", "implicit-block-ids", "finish-resets-reused-state"]),
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "transport-instrumentation",
        status: "native-exact",
        providerAtomIDs: ["opencode.provider.transport-instrumentation"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-transport-instrumentation:native-exact-fixture",
          "provider-transport-instrumentation-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining(["wrapSSE", "timeout:false", "AbortSignal.any", "openai-azure-item-id-scrub"]),
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "usage-renderer",
        status: "native-exact",
        providerAtomIDs: ["opencode.provider.usage-renderer"],
        providerPortIDs: ["provider.usage-normalizer"],
        sourceRefIDs: ["llm-native-request", "session-usage"],
        localEvidenceRefs: expect.arrayContaining(["opencode-provider-usage:native-exact-fixture", "provider-usage-native-exact:opencode"]),
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "provider-plugin-descriptor",
        status: "native-exact",
        providerAtomIDs: ["opencode.provider.plugin-descriptor"],
        localEvidenceRefs: expect.arrayContaining(["opencode-provider-plugin-descriptor:native-exact-fixture", "provider-plugin-descriptor-native-exact:opencode"]),
        localMarkers: expect.arrayContaining(["provider-hook-schema", "provider-scope-identity", "opencode.provider:sample-plugin"]),
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "live-provider-plugin-runtime",
        status: "native-exact",
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider:plugin-runtime-matrix",
          "opencode-provider:package-runtime-native-exact-diff-fixture",
          "conformance:opencode-provider-package-runtime-native-exact-diff-fixture",
          "provider-package-runtime-native-exact-diff:opencode",
          "opencode-provider-dynamic-package:native-exact-fixture",
          "opencode-provider-openai-plugin:native-exact-fixture",
          "provider-openai-plugin-native-exact:opencode",
          "opencode-provider-aisdk-plugins:native-exact-fixture",
          "provider-aisdk-plugins-native-exact:opencode",
          "opencode-provider:package-runtime-live-runtime-fixture",
        ]),
        localMarkers: expect.arrayContaining([
          "DynamicProviderPlugin",
          "OpenAIPlugin",
          "AnthropicPlugin",
          "OpenAICompatiblePlugin",
          "GatewayPlugin",
          "PerplexityPlugin",
          "GooglePlugin",
          "XAIPlugin",
          "OpenRouterPlugin",
          "createAnthropic",
          "createOpenAICompatible",
          "createGateway",
          "createPerplexity",
          "createGoogleGenerativeAI",
          "createXai",
          "createOpenRouter",
          "includeUsage",
          "anthropic-beta",
          "openrouter-chat-alias-disabled",
          "package-runtime-native-exact-diff",
          "non-function-create-export TypeError native",
        ]),
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "exact-provider-retry-cancel",
        status: "native-exact",
        sourceRefIDs: ["llm-native-request", "session-retry"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-turn-retry-policy:native-exact-fixture",
          "turn-retry-policy-native-exact:opencode",
          "opencode-provider-transport-instrumentation:native-exact-fixture",
          "provider-transport-instrumentation-native-exact:opencode",
          "opencode-provider-parser-observer:native-exact-fixture",
          "provider-parser-observer-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining([
          "policy",
          "retry-after-ms-header",
          "server-error-retryable-even-with-sdk-flag-false",
          "context-overflow-not-retryable",
          "AbortSignal.any",
          "sse-read-timeout-aborts-and-cancels",
          "stream-overloaded-retryable",
          "api-openai-404-retryable",
        ]),
        knownGaps: [],
      }),
    ]))
    expect(snapshot.nativeEvidenceRefs).toEqual(expect.arrayContaining([
      "opencode-provider-dynamic-package:native-exact-fixture",
      "opencode-provider-openai-plugin:native-exact-fixture",
      "opencode-provider-aisdk-plugins:native-exact-fixture",
      "conformance:opencode-provider-package-runtime-native-exact-diff-fixture",
      "provider-package-runtime-native-exact-diff:opencode",
    ]))
    expect(snapshot.fixtureIDs).toEqual(expect.arrayContaining([
      "opencode-provider-dynamic-package:native-exact-fixture",
      "opencode-provider-openai-plugin:native-exact-fixture",
      "opencode-provider-aisdk-plugins:native-exact-fixture",
      "opencode-provider:package-runtime-native-exact-diff-fixture",
    ]))
  })

  it("guards common provider public surfaces as demotion-only evidence", () => {
    const snapshot = buildProviderCommonPublicSurfaceGuardSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:provider-common-public-surface-guard",
      fixtureID: "provider:common-public-surface-guard",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      nativeParityClaim: false,
      surfaceRefs: expect.arrayContaining([
        expect.objectContaining({
          surfaceID: "provider.transport",
          exportedSymbols: expect.arrayContaining(["createFetchProviderTransport", "ProviderTransportPort"]),
          exposure: "common-provider-demotion-guard",
          productUpgradeRequirements: expect.arrayContaining(["product-specific transport factory"]),
          nativeBlockers: expect.arrayContaining(["product-native-transport-factory:not-proven"]),
          knownLossiness: expect.arrayContaining(["common-provider-transport-utility-not-product-native"]),
        }),
        expect.objectContaining({
          surfaceID: "provider.request-shape",
          exportedSymbols: expect.arrayContaining(["ProviderRequestShapePort", "ProviderRequest"]),
          productUpgradeRequirements: expect.arrayContaining(["product-specific request object fixture"]),
          nativeBlockers: expect.arrayContaining(["product-native-request-object-identity:not-proven"]),
        }),
        expect.objectContaining({
          surfaceID: "provider.stream-parser",
          knownLossiness: expect.arrayContaining(["provider-private-frame-fields-not-replayed"]),
        }),
        expect.objectContaining({
          surfaceID: "provider.cassette",
          nativeBlockers: expect.arrayContaining(["cassette-only-provider-path:not-native"]),
          knownLossiness: expect.arrayContaining(["provider-cassette-replay-not-live-provider"]),
        }),
      ]),
      nativeBlockers: expect.arrayContaining([
        "product-specific-provider-factory:not-proven",
        "live-provider-transport-side-effects:not-proven",
        "raw-provider-frame-exact-diff:not-proven",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verifyProviderCommonPublicSurfaceGuardSnapshot(snapshot)).toEqual({ ok: true, issues: [] })

    const nativeClaim = {
      ...snapshot,
      nativeParityClaim: true as false,
    }
    expect(verifyProviderCommonPublicSurfaceGuardSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "provider-common-public-surface.native-claim" }),
    ]))

    const missingParser = {
      ...snapshot,
      surfaceRefs: snapshot.surfaceRefs.filter((ref) => ref.surfaceID !== "provider.stream-parser"),
    }
    expect(verifyProviderCommonPublicSurfaceGuardSnapshot(missingParser).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-common-public-surface.missing-surface",
        surfaceID: "provider.stream-parser",
      }),
    ]))

    const transportLossinessDrop = {
      ...snapshot,
      surfaceRefs: snapshot.surfaceRefs.map((ref) =>
        ref.surfaceID === "provider.transport"
          ? { ...ref, knownLossiness: [] }
          : ref,
      ),
    }
    expect(verifyProviderCommonPublicSurfaceGuardSnapshot(transportLossinessDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-common-public-surface.lossiness",
        surfaceID: "provider.transport",
      }),
    ]))

    const requestFixtureDrop = {
      ...snapshot,
      surfaceRefs: snapshot.surfaceRefs.map((ref) =>
        ref.surfaceID === "provider.request-shape"
          ? { ...ref, productUpgradeRequirements: ["raw request payload negative regression"] }
          : ref,
      ),
    }
    expect(verifyProviderCommonPublicSurfaceGuardSnapshot(requestFixtureDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-common-public-surface.product-fixture",
        surfaceID: "provider.request-shape",
      }),
    ]))

    const misleadingSummary = {
      ...snapshot,
      summary: "lego-provider common ports are native provider parity complete",
    }
    expect(verifyProviderCommonPublicSurfaceGuardSnapshot(misleadingSummary).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "provider-common-public-surface.summary" }),
    ]))
  })

  it("proves OpenCode provider request options as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeProviderRequestOptionsNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.request-options",
      portID: "provider.request-shape",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-request-options-native-exact-fixture",
      replayRef: "provider-request-options-native-exact:opencode",
      fixtureID: "opencode-provider-request-options:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/llm/request.ts"),
      expect.stringContaining("packages/plugin/src/index.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "non-opencode-hooked-request",
      "opencode-default-headers",
      "missing-hooks-preserve-defaults",
    ])
    expect(verifyOpenCodeProviderRequestOptionsNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeProviderRequestOptionsBridge({ userAgent: "opencode/test" })
    const prepared = await bridge.prepare({
      context: {
        sessionID: "ses_inline",
        agent: "build",
        model: { providerID: "opencode/custom", headers: { "x-model": "1" } },
        provider: { id: "opencode", options: {} },
        message: { id: "msg_inline" },
        client: "cli",
      },
      params: { topP: 1, options: { base: true } },
      hooks: {
        "chat.headers": (_input, output) => {
          output.headers["x-hook"] = "1"
        },
      },
    })
    expect(prepared.headers).toMatchObject({
      "x-opencode-session": "ses_inline",
      "x-opencode-request": "msg_inline",
      "x-opencode-client": "cli",
      "x-model": "1",
      "x-hook": "1",
    })

    expect(verifyOpenCodeProviderRequestOptionsNativeExactFixture({ ...fixture, knownLossiness: ["partial-request-options"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-request-options-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode provider parser observer as a native exact module fixture", () => {
    const fixture = captureOpenCodeProviderParserObserverNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.parser-observer",
      portID: "provider.stream-parser",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-parser-observer-native-exact-fixture",
      replayRef: "provider-parser-observer-native-exact:opencode",
      fixtureID: "opencode-provider-parser-observer:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/provider/error.ts"),
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "stream-context-overflow",
      "stream-quota-nested-message",
      "stream-overloaded-retryable",
      "api-openai-404-retryable",
      "api-html-401-gateway-message",
      "api-empty-message-status-fallback",
      "api-regex-context-overflow",
    ])
    expect(verifyOpenCodeProviderParserObserverNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeProviderParserObserverBridge()
    expect(bridge.parseStreamError({ type: "error", error: { code: "invalid_prompt", message: "bad prompt" } })).toMatchObject({
      type: "api_error",
      message: "bad prompt",
      isRetryable: false,
    })
    expect(bridge.parseAPICallError({
      providerID: "openai-compatible",
      error: {
        message: "Request Entity Too Large",
        statusCode: 413,
        isRetryable: false,
        responseBody: JSON.stringify({ error: { code: "context_length_exceeded" } }),
      },
    })).toMatchObject({
      type: "context_overflow",
      message: "Request Entity Too Large",
    })

    expect(verifyOpenCodeProviderParserObserverNativeExactFixture({ ...fixture, knownLossiness: ["partial-parser"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-parser-observer-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode provider event observer as a native exact module fixture", () => {
    const fixture = captureOpenCodeProviderEventObserverNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.event-observer",
      portID: "provider.event-normalizer",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-event-observer-native-exact-fixture",
      replayRef: "provider-event-observer-native-exact:opencode",
      fixtureID: "opencode-provider-event-observer:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/llm/ai-sdk.ts"),
      expect.stringContaining("packages/opencode/test/session/llm.test.ts"),
      expect.stringContaining("packages/opencode/src/session/llm.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "session-visible-stream-chunks",
      "implicit-block-ids",
      "ignored-non-session-visible-chunks",
      "tool-error-preserves-cause",
      "empty-usage-stays-undefined",
      "finish-resets-reused-state",
    ])
    expect(verifyOpenCodeProviderEventObserverNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeProviderEventObserverBridge()
    const state = bridge.createState()
    expect(bridge.observeEvent(state, { type: "tool-input-delta", id: "missing-name", delta: "x" })).toEqual([
      { type: "tool-input-delta", id: "missing-name", name: "unknown", text: "x" },
    ])
    expect(() => bridge.observeEvent(state, { type: "error", error: new Error("stream failed") })).toThrow("stream failed")

    expect(verifyOpenCodeProviderEventObserverNativeExactFixture({ ...fixture, knownLossiness: ["partial-event"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-event-observer-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode provider stream projector and delta recorder as native exact module fixtures", () => {
    const fixture = captureOpenCodeProviderStreamProjectorNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomIDs: [
        "opencode.provider.streaming-delta-recorder.native-like",
        "opencode.provider.stream-projector.native-like",
      ],
      portIDs: ["provider.streaming-delta-recorder", "provider.stream-projector"],
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-stream-projector-native-exact-fixture",
      replayRef: "provider-stream-projector-native-exact:opencode",
      fixtureID: "opencode-provider-stream-projector:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [
        "conformance:opencode-provider-stream-projector-native-exact-fixture",
        "provider-stream-projector-native-exact:opencode",
      ],
      fixtureIDs: ["opencode-provider-stream-projector:native-exact-fixture"],
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/llm/ai-sdk.ts"),
      expect.stringContaining("packages/opencode/src/session/llm.ts"),
      expect.stringContaining("packages/opencode/test/session/llm.test.ts"),
      expect.stringContaining("opencode.provider.event-observer"),
    ]))
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "session-visible-stream-deltas",
      "ignored-non-session-visible-chunks",
      "tool-error-preserves-cause",
      "finish-resets-stream-state",
    ])
    expect(verifyOpenCodeProviderStreamProjectorNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    expect(projectOpenCodeProviderStreamEvents([
      { type: "text-delta", text: "hi" },
      { type: "finish", finishReason: "stop", totalUsage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
    ])).toEqual([
      { type: "text-delta", id: "text-0", text: "hi" },
      { type: "finish", reason: "stop", usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } },
    ])

    expect(verifyOpenCodeProviderStreamProjectorNativeExactFixture({ ...fixture, knownLossiness: ["partial-provider-stream-replay"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-stream-projector-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode provider usage accounting as a native exact module fixture", () => {
    const fixture = captureOpenCodeProviderUsageNativeExactFixture()

    expect(verifyOpenCodeProviderUsageNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      fixtureID: "opencode-provider-usage:native-exact-fixture",
      evidenceRef: "conformance:opencode-provider-usage-native-exact-fixture",
      replayRef: "provider-usage-native-exact:opencode",
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      exactDiffStatus: "pinned-upstream-source-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual([
      expect.objectContaining({
        path: "packages/opencode/src/session/session.ts",
        symbols: ["getUsage"],
        upstreamBehavior: expect.arrayContaining([
          "cache read/write subtraction from input tokens",
          "metadata fallback for provider cache creation tokens",
          "context tier and experimentalOver200K cost selection",
        ]),
      }),
    ])
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "cache-adjustment",
      "metadata-cache-write-fallback",
      "over-200k-cost-tier",
      "negative-token-safety",
    ])

    const normalizer = createOpenCodeNativeProviderUsageNormalizer()
    expect(normalizer.normalize({
      finish: "stop",
      usage: { input: 40, output: 10, reasoning: 2, cacheRead: 5 },
      metadata: { anthropic: { cacheCreationInputTokens: 7 } },
      model: { providerID: "opencode", modelID: "priced", cost: { input: 1, output: 2, cacheRead: 0.5, cacheWrite: 0.25 } },
    })).toEqual({
      finish: "stop",
      usage: { input: 28, output: 8, reasoning: 2, cacheRead: 5, cacheWrite: 7 },
      cost: 0.00005225,
    })
  })

  it("proves OpenCode provider transport instrumentation as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeProviderTransportInstrumentationNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.transport-instrumentation",
      portID: "provider.transport",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-transport-instrumentation-native-exact-fixture",
      replayRef: "provider-transport-instrumentation-native-exact:opencode",
      fixtureID: "opencode-provider-transport-instrumentation:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/provider/provider.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "openai-post-scrubs-item-ids",
      "openai-store-true-preserves-item-ids",
      "non-openai-body-preserved",
      "fallback-fetch-and-timeout-false",
      "existing-signal-preserved-and-timeout-disabled",
      "combined-timeout-signal-and-chunk-timeout-option-removal",
      "sse-response-is-wrapped-and-readable",
      "sse-read-timeout-aborts-and-cancels",
    ])
    expect(verifyOpenCodeProviderTransportInstrumentationNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeProviderTransportInstrumentationBridge()
    const passthrough = new Response("plain", { headers: { "content-type": "application/json" } })
    expect(bridge.wrapSSE(passthrough, 10, new AbortController())).toBe(passthrough)

    expect(verifyOpenCodeProviderTransportInstrumentationNativeExactFixture({ ...fixture, knownLossiness: ["partial-transport"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-transport-instrumentation-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode provider retry/cancel policy, transport aborts, and retryable parser errors as native exact evidence", async () => {
    const retry = await captureOpenCodeTurnRetryPolicyNativeExactFixture()
    const transport = await captureOpenCodeProviderTransportInstrumentationNativeExactFixture()
    const parser = captureOpenCodeProviderParserObserverNativeExactFixture()

    expect(verifyOpenCodeTurnRetryPolicyNativeExactFixture(retry)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeProviderTransportInstrumentationNativeExactFixture(transport)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeProviderParserObserverNativeExactFixture(parser)).toEqual({ ok: true, issues: [] })
    expect(retry.cases.map((item) => item.id)).toEqual(expect.arrayContaining([
      "retry-after-ms-header",
      "retry-after-seconds-header",
      "no-header-backoff-cap",
      "context-overflow-not-retryable",
      "server-error-retryable-even-with-sdk-flag-false",
    ]))
    expect(transport.cases.map((item) => item.id)).toEqual(expect.arrayContaining([
      "fallback-fetch-and-timeout-false",
      "combined-timeout-signal-and-chunk-timeout-option-removal",
      "sse-read-timeout-aborts-and-cancels",
    ]))
    expect(parser.cases.map((item) => item.id)).toEqual(expect.arrayContaining([
      "stream-overloaded-retryable",
      "api-openai-404-retryable",
      "stream-context-overflow",
    ]))

    const bridge = createOpenCodeTurnRetryPolicyBridge()
    expect(bridge.decision({
      attempt: 3,
      error: openCodeTurnRetryAPIError({
        message: "temporarily unavailable",
        statusCode: 503,
        isRetryable: false,
        responseHeaders: { "retry-after": "1.5" },
      }),
      provider: "opencode",
      now: 1_000,
    })).toMatchObject({
      retryable: { message: "temporarily unavailable" },
      delayMs: 1500,
      nextAttemptAt: 2500,
    })
  })

  it("proves OpenCode provider retry/cancel native exact-diff for retry delay and abort cleanup", () => {
    const fixture = captureOpenCodeProviderRetryCancelNativeExactDiffFixture({
      scheduledDelayMs: 250,
      monotonicStartedAtMs: 1_000,
    })

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      fixtureID: "opencode-provider:retry-cancel-native-exact-diff-fixture",
      evidenceRef: "conformance:opencode-provider-retry-cancel-native-exact-diff-fixture",
      replayRef: "provider-retry-cancel-native-exact-diff:opencode",
      exactDiffStatus: "native-exact-diff",
      coverageStatus: "native",
      nativeParityClaim: true,
      fixtureDiffTarget: "provider.raw-frame-replay",
      coveredBoundaryIDs: ["transport-retry-cancel-boundary", "exact-retry-cancel-timing"],
      knownLossiness: [],
      traceDiff: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/retry.ts#delay,policy"),
      expect.stringContaining("packages/opencode/src/provider/provider.ts#wrapSSE"),
      expect.stringContaining("packages/opencode/src/session/llm.ts#StreamRequest.abort"),
    ]))
    expect(verifyOpenCodeProviderRetryCancelNativeExactDiffFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture.actualTrace.map((event) => event.type)).toEqual([
      "retry-delay-selected",
      "retry-scheduled",
      "retry-fired",
      "abort-signal",
      "network-error",
      "reader-cancel",
      "parser-cleanup",
      "request-settled",
    ])
    expect(fixture.retryDelayReadback).toEqual([
      expect.objectContaining({
        attempt: 0,
        selectedDelayMs: 250,
        scheduledAtMs: 1_010,
        nextAttemptAtMs: 1_260,
        firedAtMs: 1_260,
        observedDelayMs: 250,
        exactDelayMatched: true,
        retryHeader: "retry-after-ms",
        backoffFormula: "retry-header",
        jitterApplied: false,
        capApplied: false,
        source: "session-retry-policy",
      }),
    ])
    expect(fixture.cancelAbortRaceReadback).toEqual([
      expect.objectContaining({
        attempt: 1,
        eventOrder: ["abort-signal", "network-error", "reader-cancel", "parser-cleanup", "request-settled"],
        abortSignalSource: "llm-stream-input",
        networkErrorClass: "AbortError",
        readerCancelAwaited: true,
        parserCleanupBeforeSettled: true,
        finalState: "cancelled",
        cleanupScope: "stream-reader",
      }),
    ])

    const driftedDelay = {
      ...fixture,
      actualTrace: fixture.actualTrace.map((event) => event.type === "retry-fired" ? { ...event, observedDelayMs: 251 } : event),
    }
    expect(verifyOpenCodeProviderRetryCancelNativeExactDiffFixture(driftedDelay).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-retry-cancel-native-exact-diff.trace" }),
    ]))

    const missingCleanupReadback = {
      ...fixture,
      cancelAbortRaceReadback: [],
    }
    expect(verifyOpenCodeProviderRetryCancelNativeExactDiffFixture(missingCleanupReadback).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-retry-cancel-native-exact-diff.cancel-race" }),
    ]))

    const lossyFixture = {
      ...fixture,
      knownLossiness: ["partial-retry-cancel"] as unknown as [],
    }
    expect(verifyOpenCodeProviderRetryCancelNativeExactDiffFixture(lossyFixture).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-retry-cancel-native-exact-diff.lossiness" }),
    ]))
  })

  it("splits OpenCode provider raw-frame replay into source boundary anchors with native retry/cancel evidence", () => {
    const snapshot = buildOpenCodeProviderRawFrameBoundaryMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-raw-frame-boundary-matrix",
      fixtureID: "opencode-provider:raw-frame-boundary-matrix",
      fixtureDiffTarget: "provider.raw-frame-replay",
      partialBoundaryIDs: ["custom-provider-protocol-runtime"],
      missingBoundaryIDs: [],
      coveredProviderAtomIDs: expect.arrayContaining([
        "opencode.provider.auth-descriptor",
        "opencode.provider.event-observer",
        "opencode.provider.model-plugin",
        "opencode.provider.parser-observer",
        "opencode.provider.plugin-descriptor",
        "opencode.provider.request-options",
        "opencode.provider.transport-instrumentation",
      ]),
      coveredProviderPortIDs: expect.arrayContaining([
        "provider.auth",
        "provider.model-registry",
        "provider.request-shape",
        "provider.stream-parser",
        "provider.event-normalizer",
        "provider.usage-normalizer",
        "provider.transport",
        "provider.stream",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-provider-raw-frame-boundary-matrix",
        "opencode-provider-builtin-plugins:native-exact-fixture",
        "provider-builtin-plugins-native-exact:opencode",
        "opencode-provider-request-options:native-exact-fixture",
        "provider-request-options-native-exact:opencode",
        "opencode-provider-event-observer:native-exact-fixture",
        "provider-event-observer-native-exact:opencode",
        "opencode-provider-stream-projector:native-exact-fixture",
        "provider-stream-projector-native-exact:opencode",
        "opencode-provider-transport-instrumentation:native-exact-fixture",
        "provider-transport-instrumentation-native-exact:opencode",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-provider:raw-frame-boundary-matrix",
        "opencode-provider-builtin-plugins:native-exact-fixture",
        "opencode-provider-request-options:native-exact-fixture",
        "opencode-provider-event-observer:native-exact-fixture",
        "opencode-provider-stream-projector:native-exact-fixture",
        "opencode-provider-transport-instrumentation:native-exact-fixture",
        "opencode-provider:package-runtime-native-exact-diff-fixture",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-provider-raw-frame-boundary-matrix-partial-fixture",
        "opencode-real-provider-package-parser-not-spawned",
        "opencode-custom-provider-native-protocol-private-fields-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "local-builtin-providers",
        path: "packages/adapters-opencode/src/builtin-providers.ts",
        symbols: expect.arrayContaining(["openCodeBuiltinProviderDefinitions", "registerOpenCodeBuiltinProviderPlugins"]),
      }),
      expect.objectContaining({
        id: "upstream-plugin-boot",
        path: "packages/core/src/plugin/boot.ts",
        symbols: expect.arrayContaining(["PluginBoot", "ProviderPlugins", "ModelsDevPlugin"]),
      }),
      expect.objectContaining({
        id: "upstream-provider-plugin-index",
        path: "packages/core/src/plugin/provider/index.ts",
        symbols: expect.arrayContaining(["ProviderPlugins", "DynamicProviderPlugin"]),
      }),
      expect.objectContaining({
        id: "local-builtin-provider-plugins",
        path: "packages/adapters-opencode/src/opencode-provider-builtin-plugins.ts",
        symbols: expect.arrayContaining(["captureOpenCodeProviderBuiltinPluginsNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-plugin-atoms",
        path: "packages/adapters-opencode/src/plugin-atoms.ts",
        symbols: expect.arrayContaining(["createOpenCodePluginRegistryBridge", "createOpenCodePluginEventMapper"]),
      }),
      expect.objectContaining({
        id: "local-openai-compatible-provider",
        path: "packages/lego-provider/src/openai-compatible.ts",
        symbols: expect.arrayContaining(["parseOpenAICompatibleStream"]),
      }),
      expect.objectContaining({
        id: "upstream-session-retry",
        path: "packages/opencode/src/session/retry.ts",
        symbols: expect.arrayContaining(["RetryReason", "Retryable", "delay", "policy", "retryable"]),
      }),
      expect.objectContaining({
        id: "local-opencode-custom-provider",
        path: "packages/lego-provider/src/opencode-custom.ts",
        symbols: expect.arrayContaining(["parseOpenCodeCustomProviderFrames"]),
      }),
      expect.objectContaining({
        id: "local-opencode-retry-cancel",
        path: "packages/lego-provider/src/opencode-retry-cancel.ts",
        symbols: expect.arrayContaining([
          "projectOpenCodeProviderRetryCancelTiming",
          "projectOpenCodeProviderRetryCancelRace",
          "captureOpenCodeProviderRetryCancelLiveRuntimeFixture",
          "verifyOpenCodeProviderRetryCancelLiveRuntimeFixture",
        ]),
      }),
      expect.objectContaining({
        id: "local-package-runtime-projection",
        path: "packages/lego-provider/src/port-fixtures.ts",
        symbols: expect.arrayContaining([
          "projectOpenCodeProviderPackageRuntimeProjection",
          "captureOpenCodeProviderPackageRuntimeLiveRuntimeFixture",
          "verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture",
        ]),
      }),
    ]))
    expect(snapshot.boundaryAnchors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        boundaryID: "builtin-provider-descriptor-registration",
        status: "native-exact",
        sourceRefIDs: ["upstream-plugin-boot", "upstream-provider-plugin-index", "upstream-dynamic-provider-plugin", "local-builtin-provider-plugins"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-builtin-plugins:native-exact-fixture",
          "provider-builtin-plugins-native-exact:opencode",
          "opencode-provider:plugin-runtime-matrix",
        ]),
        localMarkers: expect.arrayContaining(["ProviderPlugins", "PluginBoot.boot", "DynamicProviderPlugin", "models-dev-after-providers"]),
        boundary: expect.objectContaining({
          retainedFields: expect.arrayContaining(["ProviderPlugins order", "plugin id", "source file", "boot add order"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        boundaryID: "plugin-provider-descriptor-registration",
        status: "native-exact",
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-plugin-descriptor:native-exact-fixture",
          "provider-plugin-descriptor-native-exact:opencode",
          "opencode-plugin-provider-registry:native-exact-fixture",
          "plugin-provider-registry-native-exact:opencode",
          "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
          "plugin-hot-reload-cleanup-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining(["OpenCodeHooks.provider", "createOpenCodePluginRegistryBridge", "host.registerProvider", "scope.addCleanup"]),
        boundary: expect.objectContaining({
          retainedFields: expect.arrayContaining(["hooks.provider", "registry.config", "scope cleanup callback"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        boundaryID: "request-hook-to-provider-options",
        status: "native-exact",
        sourceRefIDs: ["local-plugin-event-mapper", "local-provider-request-options", "upstream-llm-request-prep", "upstream-llm-native-request"],
        providerAtomIDs: ["opencode.provider.request-options"],
        providerPortIDs: ["provider.request-shape"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-request-options:native-exact-fixture",
          "provider-request-options-native-exact:opencode",
          "opencode-plugin-event-mapper:native-exact-fixture",
          "plugin-event-mapper-native-exact:opencode",
          "opencode-hook-lifecycle:native-exact-fixture",
          "recipes.conformance:orders-opencode-provider-request-hooks-by-plugin-load-source",
        ]),
        localMarkers: expect.arrayContaining(["provider.request.before", "chat.params", "chat.headers", "messageTransformOptions", "source-ordered-hook-scheduler"]),
        boundary: expect.objectContaining({
          retainedFields: expect.arrayContaining(["temperature", "headers", "messageTransformOptions", "source-ordered hook merge"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        boundaryID: "raw-sse-frame-parser-boundary",
        status: "native-exact",
        sourceRefIDs: ["local-openai-compatible-provider", "local-provider-normalizer", "local-provider-parser-observer", "upstream-provider-error", "upstream-session-message-from-error", "upstream-llm-native-request"],
        providerAtomIDs: ["opencode.provider.parser-observer", "opencode.provider.event-observer"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-stream:raw-frame-timeline",
          "opencode-provider-stream:raw-payload-roundtrip",
          "opencode-provider-parser-observer:native-exact-fixture",
          "provider-parser-observer-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining(["parseOpenAICompatibleStream", "normalizeProviderStream", "parseStreamError", "parseAPICallError", "context_overflow", "api_error", "retryable"]),
        boundary: expect.objectContaining({
          retainedFields: expect.arrayContaining(["raw frame order", "tool call id/name/arguments", "parser error type/message/retryability/responseBody"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        boundaryID: "normalized-event-projection-boundary",
        status: "native-exact",
        sourceRefIDs: ["local-provider-event-observer", "local-provider-stream-projector", "upstream-llm-request-prep", "upstream-llm-native-request"],
        providerAtomIDs: ["opencode.provider.event-observer", "opencode.provider.parser-observer"],
        providerPortIDs: ["provider.event-normalizer", "provider.stream-parser"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-event-observer:native-exact-fixture",
          "provider-event-observer-native-exact:opencode",
          "opencode-provider-stream-projector:native-exact-fixture",
          "provider-stream-projector-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining(["LLMAISDK.toLLMEvents", "projectOpenCodeProviderStreamEvents", "finish-resets-stream-state"]),
        boundary: expect.objectContaining({
          retainedFields: expect.arrayContaining(["event sequence", "provider metadata", "usage", "finish reset"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        boundaryID: "usage-finish-cost-boundary",
        status: "native-exact",
        sourceRefIDs: ["local-provider-event-observer", "local-provider-stream-projector", "local-provider-usage", "upstream-session-usage"],
        providerAtomIDs: ["opencode.provider.usage-renderer", "opencode.provider.event-observer"],
        providerPortIDs: ["provider.usage-normalizer", "provider.event-normalizer"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-usage:native-exact-fixture",
          "provider-usage-native-exact:opencode",
          "opencode-provider-event-observer:native-exact-fixture",
          "provider-event-observer-native-exact:opencode",
          "opencode-provider-stream-projector:native-exact-fixture",
          "provider-stream-projector-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining(["usage", "finishReason", "getUsage", "cacheCreationInputTokens", "experimentalOver200K"]),
        boundary: expect.objectContaining({
          retainedFields: expect.arrayContaining(["finish reason", "cache read/write tokens", "metadata cache write fallback", "cost tier selection"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        boundaryID: "live-provider-plugin-runtime",
        status: "native-exact",
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider:plugin-runtime-matrix",
          "opencode-provider:package-runtime-native-exact-diff-fixture",
          "conformance:opencode-provider-package-runtime-native-exact-diff-fixture",
          "provider-package-runtime-native-exact-diff:opencode",
          "opencode-provider:package-runtime-projection",
          "opencode-provider:package-runtime-live-runtime-fixture",
          "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
          "plugin-hot-reload-cleanup-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining(["provider-package-runtime:projected", "package-runtime-native-exact-diff", "replacement-disposes-existing-before-track", "package-runtime-live-readback"]),
        boundary: expect.objectContaining({
          retainedFields: expect.arrayContaining(["hooks.provider", "scope cleanup callback"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        boundaryID: "custom-provider-protocol-runtime",
        status: "partial",
        localEvidenceRefs: expect.arrayContaining([
          "provider.conformance:replays-opencode-custom-provider-protocol-frames-through-partial-boundary-parser",
          "opencode-provider:package-runtime-native-exact-diff-fixture",
          "conformance:opencode-provider-package-runtime-native-exact-diff-fixture",
          "provider-package-runtime-native-exact-diff:opencode",
          "opencode-provider-custom-loaders:native-exact-fixture",
          "provider-custom-loaders-native-exact:opencode",
          "opencode-provider-sdk-resolver:native-exact-fixture",
          "provider-sdk-resolver-native-exact:opencode",
          "opencode-provider:package-runtime-projection",
          "opencode-provider:package-runtime-live-runtime-fixture",
        ]),
        localMarkers: expect.arrayContaining(["protocol:custom", "parseOpenCodeCustomProviderFrames", "custom-error-frame", "package-runtime-native-exact-diff", "Provider.custom(dep)", "Provider.resolveSDK", "Provider.getLanguage", "Hash.fast", "language cache", "custom-parser:projected", "custom-parser-live-readback"]),
        boundary: expect.objectContaining({
          retainedFields: expect.arrayContaining(["protocol=custom", "SDK cache key", "language cache key", "frame kind", "tool call id/name/input", "custom error frame"]),
          lossyFields: expect.arrayContaining(["real provider package parser behavior", "protocol-private metadata"]),
        }),
        knownGaps: expect.arrayContaining([
          "opencode-real-provider-package-parser-not-spawned",
          "opencode-custom-provider-native-protocol-private-fields-not-replayed",
        ]),
      }),
      expect.objectContaining({
        boundaryID: "transport-retry-cancel-boundary",
        status: "native-exact",
        sourceRefIDs: ["local-provider-ports", "local-openai-compatible-provider", "local-opencode-retry-cancel", "upstream-llm-native-request"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-transport-instrumentation:native-exact-fixture",
          "provider-transport-instrumentation-native-exact:opencode",
          "opencode-provider-parser-observer:native-exact-fixture",
          "provider-parser-observer-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining([
          "AbortSignal.any",
          "AbortSignal.timeout",
          "wrapSSE",
          "fallback-fetch-and-timeout-false",
          "sse-read-timeout-aborts-and-cancels",
          "stream-overloaded-retryable",
          "api-openai-404-retryable",
        ]),
        boundary: expect.objectContaining({
          retainedFields: expect.arrayContaining(["abort signal presence", "timeout signal composition", "SSE reader cancellation", "retry error frame class"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        boundaryID: "exact-retry-cancel-timing",
        status: "native-exact",
        sourceRefIDs: ["local-provider-ports", "local-opencode-retry-cancel", "upstream-llm-native-request", "upstream-session-retry"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-turn-retry-policy:native-exact-fixture",
          "turn-retry-policy-native-exact:opencode",
          "opencode-provider-transport-instrumentation:native-exact-fixture",
          "provider-transport-instrumentation-native-exact:opencode",
          "opencode-provider-parser-observer:native-exact-fixture",
          "provider-parser-observer-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining([
          "policy",
          "retry-after-ms-header",
          "retry-after-seconds-header",
          "no-header-backoff-cap",
          "server-error-retryable-even-with-sdk-flag-false",
          "context-overflow-not-retryable",
          "abort-signal-observed",
          "sse-read-timeout-aborts-and-cancels",
          "stream-overloaded-retryable",
          "api-openai-404-retryable",
        ]),
        boundary: expect.objectContaining({
          retainedFields: expect.arrayContaining(["attempt order", "scheduled retry delay", "retry-after headers", "nextAttemptAt", "parser retryability"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
    ]))
    expect(snapshot.boundaryAnchors.filter((anchor) => anchor.status === "missing")).toEqual([])
    expect(snapshot.nativeEvidenceRefs).not.toContain("opencode-provider-custom-loaders:native-exact-fixture")
    expect(snapshot.fixtureIDs).not.toContain("opencode-provider-custom-loaders:native-exact-fixture")
  })

  it("replays OpenCode custom provider protocol frames through a partial boundary parser", async () => {
    const events = await collect(normalizeProviderStream(parseOpenCodeCustomProviderFrames(streamText([
      `data: ${JSON.stringify({ protocol: "custom", providerID: "poe", type: "text", text: "Hel" })}\n\n`,
      `${JSON.stringify({ protocol: "custom", providerID: "poe", type: "text", text: "lo " })}\n`,
      `${JSON.stringify({ protocol: "custom", providerID: "poe", kind: "reasoning", delta: "thinking" })}\n`,
      `${JSON.stringify({ protocol: "custom", providerID: "poe", event: "tool_call", id: "call_custom_1", name: "search", arguments: "{\"query\":\"sage\"}" })}\n`,
      `${JSON.stringify({ protocol: "custom", providerID: "poe", type: "error", code: "rate_limit", message: "rate limited" })}\n`,
      `${JSON.stringify({ protocol: "custom", providerID: "poe", type: "finish", finishReason: "stop", usage: { input: 3, output: 5, cacheRead: 1 } })}\n`,
    ]))))

    expect(events).toMatchObject([
      { type: "text", text: "Hello " },
      { type: "reasoning", text: "thinking" },
      { type: "tool_call", id: "call_custom_1", toolName: "search", input: { query: "sage" } },
      {
        type: "part",
        part: {
          type: "custom",
          customType: "opencode.custom-provider.error-frame",
          display: "rate limited",
          data: {
            providerID: "poe",
            protocol: "custom",
            frame: expect.objectContaining({ code: "rate_limit", message: "rate limited" }),
          },
        },
      },
      { type: "finish", finish: "stop", usage: { input: 3, output: 5, cacheRead: 1 } },
    ])
  })

  it("projects OpenCode retry/cancel timing into a partial boundary fixture", () => {
    const projection = projectOpenCodeProviderRetryCancelTiming([
      { type: "attempt", attempt: 0 },
      { type: "retryable-error", attempt: 0, retryable: true, errorClass: "rate-limit", reason: "429" },
      { type: "retry-delay", attempt: 0, delayMs: 250, reason: "rate-limit" },
      { type: "attempt", attempt: 1 },
      { type: "abort", attempt: 1, signalAborted: true, reason: "user-cancel" },
      { type: "parser-cleanup", attempt: 1, cleanupScope: "stream-reader" },
      { type: "stream-end", attempt: 1, finishReason: "cancelled" },
    ])

    expect(projection).toMatchObject({
      finalState: "cancelled",
      attemptCount: 2,
      retainedFields: expect.arrayContaining([
        "attempt order",
        "retryable error class",
        "scheduled retry delay",
        "retry delay bucket",
        "abort signal observed",
        "parser cleanup observed",
        "final stream state",
      ]),
      lossyFields: expect.arrayContaining(["wall-clock retry delay", "abort/network race ordering", "native cleanup scheduling"]),
      knownGaps: expect.arrayContaining([
        "opencode-provider-retry-wall-clock-not-exact",
        "opencode-provider-cancel-abort-race-not-exact",
        "opencode-provider-native-cleanup-scheduling-not-replayed",
      ]),
    })
    expect(projection.timeline.map((step) => step.type)).toEqual([
      "attempt",
      "retryable-error",
      "retry-delay",
      "attempt",
      "abort",
      "parser-cleanup",
      "stream-end",
    ])
    expect(projection.timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({ order: 2, type: "retry-delay", attempt: 0, delayBucket: "subsecond", logicalClock: "source-order" }),
      expect.objectContaining({ order: 4, type: "abort", attempt: 1, signalAborted: true, reason: "user-cancel" }),
      expect.objectContaining({ order: 5, type: "parser-cleanup", attempt: 1, cleanupScope: "stream-reader" }),
    ]))
    expect(projection.attempts).toEqual([
      expect.objectContaining({
        attempt: 0,
        started: true,
        outcome: "retrying",
        retryable: true,
        errorClass: "rate-limit",
        scheduledDelayMs: 250,
        delayBucket: "subsecond",
      }),
      expect.objectContaining({
        attempt: 1,
        started: true,
        outcome: "cancelled",
        abortObserved: true,
        cleanupObserved: true,
      }),
    ])
  })

  it("projects OpenCode retry/cancel race windows into a partial boundary fixture", () => {
    const projection = projectOpenCodeProviderRetryCancelRace([
      { type: "retry-scheduled", attempt: 0, delayMs: 250, reason: "rate-limit", order: 1 },
      { type: "retry-fired", attempt: 0, observedDelayMs: 275, order: 2 },
      { type: "network-error", attempt: 1, errorClass: "ECONNRESET", reason: "socket-reset", order: 3 },
      { type: "abort-signal", attempt: 1, signalAborted: true, reason: "user-cancel", order: 4 },
      { type: "reader-cancel", attempt: 1, reason: "abort-reader", order: 5 },
      { type: "parser-cleanup", attempt: 1, cleanupScope: "stream-reader", order: 6 },
      { type: "request-settled", attempt: 1, finalState: "cancelled", order: 7 },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-provider:retry-cancel-race-projection",
      evidenceRef: "conformance:opencode-provider-retry-cancel-race-projection",
      fixtureDiffTarget: "provider.raw-frame-replay",
      coveredBoundaryIDs: ["transport-retry-cancel-boundary", "exact-retry-cancel-timing"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      retainedFields: expect.arrayContaining([
        "scheduled retry delay",
        "observed retry delay bucket",
        "retry delay delta",
        "abort signal source order",
        "network error source order",
        "reader cancel source order",
        "parser cleanup source order",
      ]),
      lossyFields: expect.arrayContaining([
        "monotonic wall-clock retry delay",
        "native backoff jitter",
        "abort/network race interleaving",
        "reader cancellation microtask order",
        "native cleanup scheduler timing",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-provider-retry-cancel-race-projection-partial-fixture",
        "opencode-provider-retry-wall-clock-not-exact",
        "opencode-provider-cancel-abort-race-not-exact",
        "opencode-provider-native-cleanup-scheduling-not-replayed",
        "opencode-provider-native-backoff-jitter-not-replayed",
      ]),
    })
    expect(projection.retryDelays).toEqual([
      expect.objectContaining({
        attempt: 0,
        scheduledDelayMs: 250,
        observedDelayMs: 275,
        scheduledDelayBucket: "subsecond",
        observedDelayBucket: "subsecond",
        delayDeltaMs: 25,
        exactDelayMatched: false,
      }),
    ])
    expect(projection.cancelRaceWindows).toEqual([
      expect.objectContaining({
        attempt: 1,
        winner: "network-error",
        networkErrorOrder: 3,
        abortOrder: 4,
        readerCancelOrder: 5,
        parserCleanupOrder: 6,
        requestSettledOrder: 7,
        signalAborted: true,
        finalState: "cancelled",
        errorClasses: ["ECONNRESET"],
        cleanupScopes: ["stream-reader"],
        reasons: ["abort-reader", "socket-reset", "user-cancel"],
        retainedOrderKeys: ["abortOrder", "networkErrorOrder", "readerCancelOrder", "parserCleanupOrder", "requestSettledOrder"],
      }),
    ])
  })

  it("captures OpenCode provider retry/cancel live runtime readback without claiming native parity", () => {
    const fixture = captureOpenCodeProviderRetryCancelLiveRuntimeFixture({
      scheduledDelayMs: 250,
      observedDelayMs: 250,
      monotonicStartedAtMs: 1_000,
    })

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      fixtureID: "opencode-provider:retry-cancel-live-runtime-fixture",
      evidenceRef: "conformance:opencode-provider-retry-cancel-live-runtime-fixture",
      exactDiffStatus: "live-runtime-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      fixtureDiffTarget: "provider.raw-frame-replay",
      coveredBoundaryIDs: ["transport-retry-cancel-boundary", "exact-retry-cancel-timing"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      retainedFields: expect.arrayContaining([
        "monotonic retry delay readback",
        "abort signal monotonic order",
        "parser cleanup readback",
      ]),
      lossyFields: expect.arrayContaining([
        "upstream native wall-clock timer implementation",
        "native abort/network microtask interleaving",
        "native cleanup scheduler timing",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-provider-retry-cancel-live-runtime-fixture-partial-native-gap",
        "opencode-provider-native-transport-runtime-not-spawned",
        "opencode-provider-retry-wall-clock-not-exact",
        "opencode-provider-cancel-abort-race-not-exact",
      ]),
    })
    expect(verifyOpenCodeProviderRetryCancelLiveRuntimeFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture.retryScheduleReadback).toEqual([
      expect.objectContaining({
        attempt: 0,
        scheduledDelayMs: 250,
        observedDelayMs: 250,
        delayDeltaMs: 0,
        exactDelayMatched: true,
        monotonicClockReadback: true,
        source: "session-retry-policy",
      }),
    ])
    expect(fixture.cancelAbortRaceReadback.map((event) => event.type)).toEqual([
      "abort-signal",
      "network-error",
      "reader-cancel",
      "parser-cleanup",
      "request-settled",
    ])
    expect(fixture.retryCancelRaceProjection.cancelRaceWindows).toEqual([
      expect.objectContaining({
        attempt: 1,
        winner: "abort",
        signalAborted: true,
        finalState: "cancelled",
        cleanupScopes: ["stream-reader"],
      }),
    ])

    const nativeClaim = {
      ...fixture,
      nativeParityClaim: true as unknown as false,
    }
    expect(verifyOpenCodeProviderRetryCancelLiveRuntimeFixture(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-retry-cancel-live-runtime.native-claim" }),
    ]))

    const missingRetryReadback = {
      ...fixture,
      retryScheduleReadback: [],
    }
    expect(verifyOpenCodeProviderRetryCancelLiveRuntimeFixture(missingRetryReadback).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-retry-cancel-live-runtime.retry-delay-readback" }),
    ]))

    const missingAbortReadback = {
      ...fixture,
      cancelAbortRaceReadback: fixture.cancelAbortRaceReadback.filter((event) => event.type !== "abort-signal"),
    }
    expect(verifyOpenCodeProviderRetryCancelLiveRuntimeFixture(missingAbortReadback).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-retry-cancel-live-runtime.cancel-race-readback" }),
      expect.objectContaining({ id: "opencode-provider-retry-cancel-live-runtime.abort-signal" }),
    ]))

    const missingNativeGap = {
      ...fixture,
      knownGaps: fixture.knownGaps.filter((gap) => gap !== "opencode-provider-retry-cancel-live-runtime-fixture-partial-native-gap"),
    }
    expect(verifyOpenCodeProviderRetryCancelLiveRuntimeFixture(missingNativeGap).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-retry-cancel-live-runtime.native-gaps" }),
    ]))
  })

  it("captures OpenCode provider plugin runtime as native exact where deterministic and partial where side effects remain", () => {
    const snapshot = buildOpenCodeProviderPluginRuntimeMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-plugin-runtime-matrix",
      fixtureID: "opencode-provider:plugin-runtime-matrix",
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      partialRuntimeIDs: [],
      missingRuntimeIDs: [],
      coveredProviderAtomIDs: expect.arrayContaining([
        "opencode.provider.auth-descriptor",
        "opencode.provider.model-plugin",
        "opencode.provider.plugin-descriptor",
        "opencode.provider.request-options",
      ]),
      coveredProviderPortIDs: expect.arrayContaining([
        "provider.auth",
        "provider.model-registry",
        "provider.request-shape",
        "provider.stream",
      ]),
      knownGaps: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "local-plugin-atoms",
        path: "packages/adapters-opencode/src/plugin-atoms.ts",
        symbols: expect.arrayContaining(["createOpenCodePluginLoaderAtom", "createOpenCodePluginRegistryBridge"]),
      }),
      expect.objectContaining({
        id: "local-plugin-loader",
        path: "packages/adapters-opencode/src/plugin-loader.ts",
        symbols: expect.arrayContaining(["loadOpenCodePlugins", "resolvePluginSpecifier", "pluginFromModule"]),
      }),
      expect.objectContaining({
        id: "local-recipes-conformance",
        path: "packages/conformance/recipes.conformance.test.ts",
        symbols: expect.arrayContaining([
          "registers OpenCode builtin auth/provider plugins",
          "loads an OpenCode npm provider package plugin into the provider registry",
          "orders OpenCode provider request hooks by plugin load source",
          "replays OpenCode provider plugin reload cleanup before replacement registration",
          "maps OpenCode and Pi provider extensions into common registries",
        ]),
      }),
      expect.objectContaining({
        id: "local-package-runtime-projection",
        path: "packages/lego-provider/src/port-fixtures.ts",
        symbols: expect.arrayContaining([
          "projectOpenCodeProviderPackageRuntimeProjection",
          "captureOpenCodeProviderPackageRuntimeLiveRuntimeFixture",
          "verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture",
        ]),
      }),
      expect.objectContaining({
        id: "upstream-provider-service",
        path: "packages/opencode/src/provider/provider.ts",
        symbols: expect.arrayContaining([
          "custom",
          "shouldUseCopilotResponsesApi",
          "selectAzureLanguageModel",
          "googleVertexAnthropicBaseURL",
          "resolveSDK",
          "getLanguage",
          "BUNDLED_PROVIDERS",
          "modelLoaders",
          "varsLoaders",
          "pathToFileURL",
        ]),
      }),
      expect.objectContaining({
        id: "upstream-core-hash",
        path: "packages/core/src/util/hash.ts",
        symbols: expect.arrayContaining(["Hash.fast", "sha1"]),
      }),
      expect.objectContaining({
        id: "upstream-provider-schema",
        path: "packages/opencode/src/provider/schema.ts",
        symbols: expect.arrayContaining(["ProviderID", "ModelID"]),
      }),
      expect.objectContaining({
        id: "local-provider-sdk-resolver",
        path: "packages/adapters-opencode/src/opencode-provider-sdk-resolver.ts",
        symbols: expect.arrayContaining(["captureOpenCodeProviderSDKResolverNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-provider-custom-loaders",
        path: "packages/adapters-opencode/src/opencode-provider-custom-loaders.ts",
        symbols: expect.arrayContaining(["captureOpenCodeProviderCustomLoadersNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "upstream-openai-provider-plugin",
        path: "packages/core/src/plugin/provider/openai.ts",
        symbols: expect.arrayContaining(["OpenAIPlugin", "aisdk.sdk", "aisdk.language", "catalog.transform"]),
      }),
      expect.objectContaining({
        id: "local-openai-provider-plugin-runtime",
        path: "packages/adapters-opencode/src/opencode-provider-openai-plugin.ts",
        symbols: expect.arrayContaining(["captureOpenCodeOpenAIProviderPluginNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "upstream-aisdk-provider-plugins",
        path: "packages/core/src/plugin/provider",
        symbols: expect.arrayContaining([
          "AnthropicPlugin",
          "OpenAICompatiblePlugin",
          "GatewayPlugin",
          "PerplexityPlugin",
          "GooglePlugin",
          "XAIPlugin",
          "OpenRouterPlugin",
          "aisdk.sdk",
          "aisdk.language",
          "catalog.transform",
        ]),
      }),
      expect.objectContaining({
        id: "local-aisdk-provider-plugin-runtime",
        path: "packages/adapters-opencode/src/opencode-provider-aisdk-plugins.ts",
        symbols: expect.arrayContaining(["captureOpenCodeAISDKProviderPluginsNativeExactFixture"]),
      }),
    ]))
    expect(snapshot.runtimeAnchors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        runtimeID: "builtin-provider-runtime-registration",
        status: "native-exact",
        sourceRefIDs: expect.arrayContaining(["upstream-plugin-boot", "upstream-provider-plugin-index", "local-builtin-provider-plugins"]),
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-builtin-plugins:native-exact-fixture",
          "provider-builtin-plugins-native-exact:opencode",
          "recipes.conformance:registers-opencode-builtin-auth-provider-plugins",
        ]),
        localMarkers: expect.arrayContaining(["ProviderPlugins", "PluginBoot.boot", "DynamicProviderPlugin", "models-dev-after-providers"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining(["ProviderPlugins order", "plugin id", "source file", "boot add order"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "plugin-manifest-scope-normalization",
        status: "native-exact",
        localEvidenceRefs: expect.arrayContaining([
          "opencode-plugin-loader:native-exact-fixture",
          "plugin-loader-native-exact:opencode",
          "opencode-hook-lifecycle:native-exact-fixture",
        ]),
        localMarkers: expect.arrayContaining(["normalizeOpenCodeNativePluginManifest", "openCodeNativePluginLoaderLoad", "host.createScope"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining(["source.id", "source.path", "source.scope", "plugin options"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "plugin-config-hook-runtime",
        status: "native-exact",
        localEvidenceRefs: expect.arrayContaining([
          "opencode-plugin-loader:native-exact-fixture",
          "plugin-loader-native-exact:opencode",
          "opencode-hook-lifecycle:native-exact-fixture",
        ]),
        localMarkers: expect.arrayContaining(["hooks.config", "config-before-registration", "registryBridge.register", "permissionBridge.register", "eventMapper.register"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining(["config hook call", "plugin options", "post-config registration order"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "provider-auth-ui-registry-runtime",
        status: "native-exact",
        providerAtomIDs: ["opencode.provider.auth-descriptor", "opencode.provider.plugin-descriptor", "opencode.provider.model-plugin"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-hook-lifecycle:native-exact-fixture",
          "opencode-provider-auth-descriptor:native-exact-fixture",
          "opencode-provider-plugin-descriptor:native-exact-fixture",
          "plugin-event-mapper-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining(["host.registerAuth", "host.registerProvider", "host.registerUIProvider", "opencode.provider:sample-plugin"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining(["hooks.auth", "hooks.provider", "registry.config"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "scope-dispose-registry-cleanup",
        status: "native-exact",
        localEvidenceRefs: expect.arrayContaining([
          "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
          "plugin-hot-reload-cleanup-native-exact:opencode",
          "opencode-hook-lifecycle:native-exact-fixture",
        ]),
        localMarkers: expect.arrayContaining(["scope.dispose", "services.delete", "scope-dispose-removes-tracked-source"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining(["scope.dispose", "service cleanup", "provider registry cleanup"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "provider-request-hook-runtime",
        status: "native-exact",
        localEvidenceRefs: expect.arrayContaining([
          "opencode-plugin-event-mapper:native-exact-fixture",
          "plugin-event-mapper-native-exact:opencode",
          "opencode-provider-request-options:native-exact-fixture",
          "opencode-hook-lifecycle:native-exact-fixture",
        ]),
        localMarkers: expect.arrayContaining(["provider.request.before", "chat.params", "chat.headers", "providerOptions", "source-ordered-hook-scheduler"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining(["temperature", "topP", "topK", "headers"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "exact-concurrent-provider-hook-order",
        status: "native-exact",
        localEvidenceRefs: expect.arrayContaining([
          "opencode-hook-lifecycle:native-exact-fixture",
          "opencode-plugin-event-mapper:native-exact-fixture",
          "plugin-event-mapper-native-exact:opencode",
          "opencode-provider-request-options:native-exact-fixture",
          "recipes.conformance:orders-opencode-provider-request-hooks-by-plugin-load-source",
        ]),
        localMarkers: expect.arrayContaining(["source-ordered-hook-scheduler", "shallow-merge", "pluginTriggerAwaitsHooksSequentiallyAndMutatesSharedOutput", "provider-request-params-and-headers"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining(["source order", "providerOptions merge winner"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "hot-reload-cycle-side-effects",
        status: "native-exact",
        localEvidenceRefs: expect.arrayContaining([
          "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
          "plugin-hot-reload-cleanup-native-exact:opencode",
          "opencode-plugin-loader:native-exact-fixture",
          "plugin-loader-native-exact:opencode",
          "opencode-hook-lifecycle:native-exact-fixture",
          "recipes.conformance:replays-opencode-provider-plugin-reload-cleanup-before-replacement-registration",
        ]),
        localMarkers: expect.arrayContaining(["scope.dispose", "services.delete", "replacement-disposes-existing-before-track", "scope-dispose-removes-tracked-source"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining(["replacement provider registration", "request hook unregister"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "provider-package-module-spawn",
        status: "native-exact",
        sourceRefIDs: expect.arrayContaining(["upstream-dynamic-provider-plugin", "local-dynamic-provider-package", "local-recipes-conformance"]),
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-dynamic-package:native-exact-fixture",
          "provider-dynamic-package-native-exact:opencode",
          "recipes.conformance:loads-opencode-npm-provider-package-plugin-into-provider-registry",
        ]),
        localMarkers: expect.arrayContaining(["DynamicProviderPlugin", "Npm.add", "pathToFileURL", "create* factory", "evt.sdk", "non-function-create-export TypeError native"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining(["npm package specifier", "installed entrypoint", "first create* factory export", "event.sdk assignment", "non-function create export TypeError"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "provider-custom-loader-runtime",
        status: "native-exact",
        sourceRefIDs: expect.arrayContaining(["upstream-provider-service", "upstream-provider-schema", "local-provider-custom-loaders", "local-provider-sdk-resolver"]),
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-custom-loaders:native-exact-fixture",
          "provider-custom-loaders-native-exact:opencode",
          "opencode-provider-sdk-resolver:native-exact-fixture",
        ]),
        localMarkers: expect.arrayContaining(["Provider.custom(dep)", "shouldUseCopilotResponsesApi", "selectAzureLanguageModel", "googleVertexAnthropicBaseURL", "modelLoaders", "varsLoaders"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining([
            "opencode public apiKey fallback",
            "paid model filtering",
            "openai responses apiID",
            "xai responses apiID",
            "github-copilot gpt-5 responses gate",
            "github-copilot gpt-5-mini chat gate",
            "azure resource precedence",
            "azure vars loader",
            "azure missing resource error",
            "provider header options",
            "google-vertex vars endpoint",
            "google-vertex auth fetch",
            "google-vertex-anthropic regional baseURL",
          ]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "provider-sdk-resolver-runtime",
        status: "native-exact",
        sourceRefIDs: expect.arrayContaining(["upstream-provider-service", "upstream-provider-schema", "upstream-core-hash", "local-provider-sdk-resolver", "local-provider-custom-loaders"]),
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-sdk-resolver:native-exact-fixture",
          "provider-sdk-resolver-native-exact:opencode",
          "opencode-provider-custom-loaders:native-exact-fixture",
          "provider-custom-loaders-native-exact:opencode",
          "opencode-provider-dynamic-package:native-exact-fixture",
        ]),
        localMarkers: expect.arrayContaining(["Provider.resolveSDK", "Provider.getLanguage", "BUNDLED_PROVIDERS", "Hash.fast", "varsLoaders", "modelLoaders", "language cache"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining([
            "BUNDLED_PROVIDERS package match",
            "pathToFileURL import specifier",
            "Hash.fast sdk cache key",
            "baseURL vars/env interpolation",
            "apiKey fallback",
            "model headers merge",
            "includeUsage default",
            "includeUsage=false preservation",
            "google-vertex fetch deletion",
            "modelLoaders getModel",
            "sdk.languageModel api id",
            "language cache key",
          ]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "openai-provider-plugin-runtime",
        status: "native-exact",
        sourceRefIDs: ["upstream-openai-provider-plugin", "upstream-provider-plugin-index", "local-openai-provider-plugin-runtime"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-openai-plugin:native-exact-fixture",
          "provider-openai-plugin-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining(["OpenAIPlugin", "createOpenAI", "responses", "catalog.transform", "gpt-5-chat-latest-disabled"]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining(["@ai-sdk/openai package gate", "createOpenAI options", "responses apiID", "gpt-5-chat-latest disabled"]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
      expect.objectContaining({
        runtimeID: "aisdk-provider-plugin-runtime",
        status: "native-exact",
        sourceRefIDs: ["upstream-aisdk-provider-plugins", "upstream-provider-plugin-index", "local-aisdk-provider-plugin-runtime"],
        localEvidenceRefs: expect.arrayContaining([
          "opencode-provider-aisdk-plugins:native-exact-fixture",
          "provider-aisdk-plugins-native-exact:opencode",
        ]),
        localMarkers: expect.arrayContaining([
          "AnthropicPlugin",
          "OpenAICompatiblePlugin",
          "GatewayPlugin",
          "PerplexityPlugin",
          "GooglePlugin",
          "XAIPlugin",
          "OpenRouterPlugin",
          "createAnthropic",
          "createOpenAICompatible",
          "createGateway",
          "createPerplexity",
          "createGoogleGenerativeAI",
          "createXai",
          "createOpenRouter",
          "anthropic-beta",
          "includeUsage",
          "openrouter-chat-alias-disabled",
        ]),
        runtime: expect.objectContaining({
          retainedFields: expect.arrayContaining([
            "createAnthropic options",
            "anthropic-beta header",
            "existing sdk short circuit",
            "includeUsage default",
            "includeUsage=false preservation",
            "createOpenAICompatible options",
            "createGateway options",
            "createPerplexity options",
            "createGoogleGenerativeAI options",
            "createXai options",
            "xai responses apiID",
            "createOpenRouter options",
            "openrouter headers",
            "openrouter chat alias disabled",
          ]),
          lossyFields: [],
        }),
        knownGaps: [],
      }),
    ]))
  })

  it("proves OpenCode builtin provider plugin boot order as a native exact fixture", () => {
    const fixture = captureOpenCodeProviderBuiltinPluginsNativeExactFixture()

    expect(verifyOpenCodeProviderBuiltinPluginsNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.builtin-plugins",
      portID: "provider.model-registry",
      evidenceRef: "conformance:opencode-provider-builtin-plugins-native-exact-fixture",
      replayRef: "provider-builtin-plugins-native-exact:opencode",
      fixtureID: "opencode-provider-builtin-plugins:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/core/src/plugin/provider/index.ts"),
        expect.stringContaining("packages/core/src/plugin/boot.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/dynamic.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "provider-plugin-order" }),
        expect.objectContaining({ id: "boot-add-order" }),
        expect.objectContaining({ id: "split-file-plugin-ids" }),
        expect.objectContaining({ id: "dynamic-provider-last" }),
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    for (const item of fixture.cases) {
      expect(item.actual).toEqual(item.expected)
    }

    const bridge = createOpenCodeProviderBuiltinPluginsBridge()
    expect(bridge.providerPlugins()).toHaveLength(33)
    expect(bridge.providerPlugins().at(0)).toMatchObject({ index: 0, exportName: "AlibabaPlugin", pluginID: "alibaba" })
    expect(bridge.providerPlugins().at(-1)).toMatchObject({ index: 32, exportName: "DynamicProviderPlugin", pluginID: "dynamic-provider" })
    expect(bridge.bootPluginIDs().slice(0, 4)).toEqual(["env", "account", "alibaba", "amazon-bedrock"])
    expect(bridge.bootPluginIDs().slice(-3)).toEqual(["zenmux", "dynamic-provider", "models-dev"])
  })

  it("proves OpenCode dynamic provider package spawn as a native exact fixture", async () => {
    const fixture = await captureOpenCodeDynamicProviderPackageNativeExactFixture()

    expect(verifyOpenCodeDynamicProviderPackageNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.dynamic-package",
      portID: "provider.model-registry",
      evidenceRef: "conformance:opencode-provider-dynamic-package-native-exact-fixture",
      replayRef: "provider-dynamic-package-native-exact:opencode",
      fixtureID: "opencode-provider-dynamic-package:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/core/src/plugin/provider/dynamic.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "existing-sdk-short-circuits" }),
        expect.objectContaining({ id: "file-url-factory-export" }),
        expect.objectContaining({ id: "npm-entrypoint-path-to-file-url" }),
        expect.objectContaining({ id: "first-create-export-wins" }),
        expect.objectContaining({ id: "missing-entrypoint-error" }),
        expect.objectContaining({ id: "missing-create-export-error" }),
        expect.objectContaining({ id: "truthy-non-function-create-export-error" }),
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    for (const item of fixture.cases) {
      expect(item.actual).toEqual(item.expected)
    }

    const bridge = createOpenCodeDynamicProviderPackageBridge()
    const event = { package: "file:///repo/provider-extra.mjs", options: { token: "redacted" } }
    await expect(bridge.apply({
      event,
      importer: () => ({
        createExtraProvider(options: Record<string, unknown>) {
          return { id: "extra", options }
        },
      }),
    })).resolves.toMatchObject({
      skippedExistingSDK: false,
      packageName: "file:///repo/provider-extra.mjs",
      installedPath: "file:///repo/provider-extra.mjs",
      importSpecifier: "file:///repo/provider-extra.mjs",
      factoryExport: "createExtraProvider",
      event: {
        sdk: { id: "extra", options: { token: "redacted" } },
      },
    })
  })

  it("proves OpenCode provider custom loaders as native exact fixtures", async () => {
    const fixture = await captureOpenCodeProviderCustomLoadersNativeExactFixture()

    expect(verifyOpenCodeProviderCustomLoadersNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.custom-loaders",
      portID: "provider.model-registry",
      evidenceRef: "conformance:opencode-provider-custom-loaders-native-exact-fixture",
      replayRef: "provider-custom-loaders-native-exact:opencode",
      fixtureID: "opencode-provider-custom-loaders:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/opencode/src/provider/provider.ts"),
        expect.stringContaining("packages/opencode/src/provider/schema.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "opencode-public-key-filters-paid-models" }),
        expect.objectContaining({ id: "opencode-auth-keeps-paid-models" }),
        expect.objectContaining({ id: "openai-and-xai-use-responses" }),
        expect.objectContaining({ id: "github-copilot-language-selection" }),
        expect.objectContaining({ id: "azure-resource-precedence-vars-and-selection" }),
        expect.objectContaining({ id: "azure-missing-resource-getmodel-error" }),
        expect.objectContaining({ id: "azure-cognitive-services-base-url" }),
        expect.objectContaining({ id: "provider-header-options" }),
        expect.objectContaining({ id: "google-vertex-project-vars-fetch-and-trim" }),
        expect.objectContaining({ id: "google-vertex-anthropic-base-url-and-trim" }),
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    for (const item of fixture.cases) {
      expect(item.actual).toEqual(item.expected)
    }

    const bridge = createOpenCodeProviderCustomLoadersBridge()
    const copilot = await bridge.load({
      providerID: "github-copilot",
      provider: { id: "github-copilot", options: {}, env: [] },
    })
    await expect(copilot?.getModel?.({
      responses: (modelID: string) => ({ selected: "responses", modelID }),
      chat: (modelID: string) => ({ selected: "chat", modelID }),
    }, "gpt-5.1")).resolves.toEqual({ selected: "responses", modelID: "gpt-5.1" })
  })

  it("proves OpenCode provider SDK resolver and language cache as a native exact fixture", async () => {
    const fixture = await captureOpenCodeProviderSDKResolverNativeExactFixture()

    expect(verifyOpenCodeProviderSDKResolverNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.sdk-resolver",
      portID: "provider.model-registry",
      evidenceRef: "conformance:opencode-provider-sdk-resolver-native-exact-fixture",
      replayRef: "provider-sdk-resolver-native-exact:opencode",
      fixtureID: "opencode-provider-sdk-resolver:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/opencode/src/provider/provider.ts"),
        expect.stringContaining("packages/core/src/util/hash.ts"),
        expect.stringContaining("packages/opencode/src/provider/schema.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "bundled-provider-options-cache-and-vars" }),
        expect.objectContaining({ id: "openai-compatible-include-usage-default" }),
        expect.objectContaining({ id: "openai-compatible-include-usage-false-preserved" }),
        expect.objectContaining({ id: "non-bundled-npm-import-create-factory" }),
        expect.objectContaining({ id: "file-url-import-create-factory" }),
        expect.objectContaining({ id: "google-vertex-fetch-deleted-for-non-compatible" }),
        expect.objectContaining({ id: "custom-model-loader-and-language-cache" }),
        expect.objectContaining({ id: "default-language-model-and-language-cache" }),
        expect.objectContaining({ id: "missing-entrypoint-init-error" }),
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    for (const item of fixture.cases) {
      expect(item.actual).toEqual(item.expected)
    }

    const bridge = createOpenCodeProviderSDKResolverBridge()
    const state = createOpenCodeProviderSDKResolverState({
      providers: {
        local: {
          id: "local",
          key: "sk-local",
          options: {},
        },
      },
    })
    const model = {
      id: "local-model",
      providerID: "local",
      api: {
        id: "local-model",
        npm: "file:///repo/provider-local.mjs",
      },
    }
    await expect(bridge.resolveSDK({
      state,
      model,
      deps: {
        importer: () => ({
          createLocalProvider(options: Record<string, unknown>) {
            return { provider: "local", options: { ...options, fetch: "<function>" } }
          },
        }),
      },
    })).resolves.toMatchObject({
      cacheHit: false,
      bundled: false,
      installedPath: "file:///repo/provider-local.mjs",
      importSpecifier: "file:///repo/provider-local.mjs",
      factoryExport: "createLocalProvider",
      factoryOptions: {
        name: "local",
        apiKey: "sk-local",
        fetch: "<function>",
      },
    })
  })

  it("proves OpenCode OpenAI provider plugin runtime as a native exact fixture", async () => {
    const fixture = await captureOpenCodeOpenAIProviderPluginNativeExactFixture()

    expect(verifyOpenCodeOpenAIProviderPluginNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.openai-plugin",
      portID: "provider.model-registry",
      evidenceRef: "conformance:opencode-provider-openai-plugin-native-exact-fixture",
      replayRef: "provider-openai-plugin-native-exact:opencode",
      fixtureID: "opencode-provider-openai-plugin:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/core/src/plugin/provider/openai.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "sdk-package-gate" }),
        expect.objectContaining({ id: "sdk-create-openai-options" }),
        expect.objectContaining({ id: "language-provider-gate" }),
        expect.objectContaining({ id: "language-responses-api-id" }),
        expect.objectContaining({ id: "catalog-transform-disables-chat-only-alias" }),
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    for (const item of fixture.cases) {
      expect(item.actual).toEqual(item.expected)
    }

    const bridge = createOpenCodeOpenAIProviderPluginBridge()
    const event = { package: "@ai-sdk/openai", options: { baseURL: "https://api.openai.com/v1" } }
    await expect(bridge.applySDK({
      event,
      importer: () => ({
        createOpenAI(options: Record<string, unknown>) {
          return { provider: "openai", options }
        },
      }),
    })).resolves.toMatchObject({
      skippedPackage: false,
      event: {
        sdk: { provider: "openai", options: { baseURL: "https://api.openai.com/v1" } },
      },
    })
    const language = bridge.applyLanguage({
      event: {
        model: { providerID: "openai", apiID: "gpt-4.1" },
        sdk: { responses: (apiID) => ({ selected: "responses", apiID }) },
      },
    })
    expect(language).toMatchObject({
      skippedProvider: false,
      event: { language: { selected: "responses", apiID: "gpt-4.1" } },
    })
  })

  it("proves OpenCode deterministic AI SDK provider plugins as native exact fixtures", async () => {
    const fixture = await captureOpenCodeAISDKProviderPluginsNativeExactFixture()

    expect(verifyOpenCodeAISDKProviderPluginsNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.aisdk-plugins",
      portID: "provider.model-registry",
      evidenceRef: "conformance:opencode-provider-aisdk-plugins-native-exact-fixture",
      replayRef: "provider-aisdk-plugins-native-exact:opencode",
      fixtureID: "opencode-provider-aisdk-plugins:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/core/src/plugin/provider/anthropic.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/openai-compatible.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/gateway.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/perplexity.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/google.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/xai.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/openrouter.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "anthropic-sdk-package-gate" }),
        expect.objectContaining({ id: "anthropic-sdk-create-options" }),
        expect.objectContaining({ id: "anthropic-catalog-beta-header" }),
        expect.objectContaining({ id: "openai-compatible-existing-sdk-short-circuits" }),
        expect.objectContaining({ id: "openai-compatible-package-includes-and-usage-default" }),
        expect.objectContaining({ id: "openai-compatible-include-usage-false-preserved" }),
        expect.objectContaining({ id: "openai-compatible-package-gate" }),
        expect.objectContaining({ id: "simple-sdk-package-gates" }),
        expect.objectContaining({ id: "gateway-sdk-create-options" }),
        expect.objectContaining({ id: "perplexity-sdk-create-options" }),
        expect.objectContaining({ id: "google-sdk-create-options" }),
        expect.objectContaining({ id: "xai-sdk-create-options" }),
        expect.objectContaining({ id: "xai-language-provider-gate" }),
        expect.objectContaining({ id: "xai-language-responses-api-id" }),
        expect.objectContaining({ id: "openrouter-sdk-create-options" }),
        expect.objectContaining({ id: "openrouter-catalog-header-and-alias-disable" }),
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    for (const item of fixture.cases) {
      expect(item.actual).toEqual(item.expected)
    }

    const bridge = createOpenCodeAISDKProviderPluginsBridge()
    const anthropicEvent = { package: "@ai-sdk/anthropic", options: { apiKey: "redacted" } }
    await expect(bridge.applyAnthropicSDK({
      event: anthropicEvent,
      importer: () => ({
        createAnthropic(options: Record<string, unknown>) {
          return { provider: "anthropic", options }
        },
      }),
    })).resolves.toMatchObject({
      skippedPackage: false,
      event: { sdk: { provider: "anthropic", options: { apiKey: "redacted" } } },
    })
    const compatibleEvent = { package: "@ai-sdk/openai-compatible", options: { name: "local" } }
    await expect(bridge.applyOpenAICompatibleSDK({
      event: compatibleEvent,
      importer: () => ({
        createOpenAICompatible(options: Record<string, unknown>) {
          return { provider: "openai-compatible", options }
        },
      }),
    })).resolves.toMatchObject({
      skippedExistingSDK: false,
      skippedPackage: false,
      event: { options: { name: "local", includeUsage: true }, sdk: { provider: "openai-compatible", options: { name: "local", includeUsage: true } } },
    })
    await expect(bridge.applyOpenRouterSDK({
      event: { package: "@openrouter/ai-sdk-provider", options: { apiKey: "redacted" } },
      importer: () => ({
        createOpenRouter(options: Record<string, unknown>) {
          return { provider: "openrouter", options }
        },
      }),
    })).resolves.toMatchObject({
      skippedPackage: false,
      event: { sdk: { provider: "openrouter", options: { apiKey: "redacted" } } },
    })
    const xaiLanguage = bridge.applyXAILanguage({
      event: {
        model: { providerID: "xai", apiID: "grok-4" },
        sdk: { responses: (apiID) => ({ selected: "responses", apiID }) },
      },
    })
    expect(xaiLanguage).toMatchObject({
      skippedProvider: false,
      event: { language: { selected: "responses", apiID: "grok-4" } },
    })
  })

  it("proves OpenCode provider package runtime native exact-diff from source fixtures", async () => {
    const providerRegistry = captureOpenCodePluginProviderRegistryNativeExactFixture()
    const builtinPlugins = captureOpenCodeProviderBuiltinPluginsNativeExactFixture()
    const dynamicPackage = await captureOpenCodeDynamicProviderPackageNativeExactFixture()
    const customLoaders = await captureOpenCodeProviderCustomLoadersNativeExactFixture()
    const sdkResolver = await captureOpenCodeProviderSDKResolverNativeExactFixture()
    const openAIPlugin = await captureOpenCodeOpenAIProviderPluginNativeExactFixture()
    const aiSDKPlugins = await captureOpenCodeAISDKProviderPluginsNativeExactFixture()
    const hotReloadCleanup = await captureOpenCodePluginHotReloadCleanupNativeExactFixture()

    expect(verifyOpenCodePluginProviderRegistryNativeExactFixture(providerRegistry)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeProviderBuiltinPluginsNativeExactFixture(builtinPlugins)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeDynamicProviderPackageNativeExactFixture(dynamicPackage)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeProviderCustomLoadersNativeExactFixture(customLoaders)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeProviderSDKResolverNativeExactFixture(sdkResolver)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeOpenAIProviderPluginNativeExactFixture(openAIPlugin)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeAISDKProviderPluginsNativeExactFixture(aiSDKPlugins)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodePluginHotReloadCleanupNativeExactFixture(hotReloadCleanup)).toEqual({ ok: true, issues: [] })

    const fixture = captureOpenCodeProviderPackageRuntimeNativeExactDiffFixture({
      sourceFixtures: [
        openCodeProviderPackageRuntimeSourceFixture("opencode-plugin-provider-registry", providerRegistry),
        openCodeProviderPackageRuntimeSourceFixture("opencode-provider-builtin-plugins", builtinPlugins),
        openCodeProviderPackageRuntimeSourceFixture("opencode-provider-dynamic-package", dynamicPackage),
        openCodeProviderPackageRuntimeSourceFixture("opencode-provider-custom-loaders", customLoaders),
        openCodeProviderPackageRuntimeSourceFixture("opencode-provider-sdk-resolver", sdkResolver),
        openCodeProviderPackageRuntimeSourceFixture("opencode-provider-openai-plugin", openAIPlugin),
        openCodeProviderPackageRuntimeSourceFixture("opencode-provider-aisdk-plugins", aiSDKPlugins),
        openCodeProviderPackageRuntimeSourceFixture("opencode-plugin-hot-reload-cleanup", hotReloadCleanup),
      ],
    })

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      fixtureID: "opencode-provider:package-runtime-native-exact-diff-fixture",
      evidenceRef: "conformance:opencode-provider-package-runtime-native-exact-diff-fixture",
      replayRef: "provider-package-runtime-native-exact-diff:opencode",
      exactDiffStatus: "native-exact-diff",
      coverageStatus: "native",
      nativeParityClaim: true,
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      fixtureDiff: [],
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verifyOpenCodeProviderPackageRuntimeNativeExactDiffFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture.actualSourceFixtures.map((source) => source.sourceID)).toEqual([
      "opencode-plugin-provider-registry",
      "opencode-provider-builtin-plugins",
      "opencode-provider-dynamic-package",
      "opencode-provider-custom-loaders",
      "opencode-provider-sdk-resolver",
      "opencode-provider-openai-plugin",
      "opencode-provider-aisdk-plugins",
      "opencode-plugin-hot-reload-cleanup",
    ])
    expect(fixture.actualRuntimeCoverage).toEqual(expect.arrayContaining([
      expect.objectContaining({
        runtimeID: "provider-package-module-spawn",
        fixtureIDs: ["opencode-provider-dynamic-package:native-exact-fixture"],
      }),
      expect.objectContaining({
        runtimeID: "provider-sdk-resolver-runtime",
        fixtureIDs: [
          "opencode-provider-custom-loaders:native-exact-fixture",
          "opencode-provider-dynamic-package:native-exact-fixture",
          "opencode-provider-sdk-resolver:native-exact-fixture",
        ],
      }),
      expect.objectContaining({
        runtimeID: "openai-provider-plugin-runtime",
        fixtureIDs: ["opencode-provider-openai-plugin:native-exact-fixture"],
      }),
      expect.objectContaining({
        runtimeID: "aisdk-provider-plugin-runtime",
        fixtureIDs: ["opencode-provider-aisdk-plugins:native-exact-fixture"],
      }),
      expect.objectContaining({
        runtimeID: "hot-reload-cycle-side-effects",
        fixtureIDs: ["opencode-plugin-hot-reload-cleanup:native-exact-fixture"],
      }),
    ]))

    const missingDynamicPackage = captureOpenCodeProviderPackageRuntimeNativeExactDiffFixture({
      sourceFixtures: fixture.actualSourceFixtures.filter((source) => source.sourceID !== "opencode-provider-dynamic-package"),
    })
    expect(verifyOpenCodeProviderPackageRuntimeNativeExactDiffFixture(missingDynamicPackage).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-package-runtime-native-exact-diff.source-fixtures" }),
      expect.objectContaining({ id: "opencode-provider-package-runtime-native-exact-diff.runtime-coverage" }),
      expect.objectContaining({ id: "opencode-provider-package-runtime-native-exact-diff.missing-source-fixture" }),
    ]))

    const lossySource = {
      ...fixture,
      actualSourceFixtures: fixture.actualSourceFixtures.map((source) =>
        source.sourceID === "opencode-provider-openai-plugin"
          ? { ...source, knownLossiness: ["partial-openai-plugin"] as unknown as [] }
          : source
      ),
    }
    expect(verifyOpenCodeProviderPackageRuntimeNativeExactDiffFixture(lossySource).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-package-runtime-native-exact-diff.source-fixtures" }),
      expect.objectContaining({ id: "opencode-provider-package-runtime-native-exact-diff.source-native-claim" }),
    ]))
  })

  it("projects OpenCode provider package/runtime signals into a targeted partial fixture", () => {
    const projection = projectOpenCodeProviderPackageRuntimeProjection([
      {
        type: "provider.hook",
        sourceID: "npm:@opencode/provider-anthropic",
        hookName: "chat.params",
        order: 2,
        payloadKeys: ["headers", "providerOptions"],
        concurrentBoundaryObserved: true,
        sequence: 5,
      },
      {
        type: "package.import",
        providerID: "anthropic",
        packageName: "@opencode/provider-anthropic",
        exportKeys: ["provider", "default", "provider"],
        protocol: "custom",
        moduleSideEffectKeys: ["models-cache", "env-read"],
        sequence: 1,
      },
      {
        type: "package.import",
        providerID: "anthropic",
        packageName: "@opencode/provider-anthropic",
        exportKeys: ["default", "provider"],
        protocol: "custom",
        moduleSideEffectKeys: ["env-read", "models-cache"],
        sequence: 1,
      },
      {
        type: "model.metadata",
        providerID: "anthropic",
        modelID: "claude-opus-4",
        metadataKeys: ["price", "contextWindow", "price"],
        remoteFetchObserved: true,
        sequence: 2,
      },
      {
        type: "custom.parser",
        providerID: "anthropic",
        frameKind: "tool_call",
        retainedKeys: ["text", "finishReason"],
        privateFieldKeys: ["nativeIndex", "rawVendorPart"],
        sequence: 3,
      },
      {
        type: "hot.reload",
        providerID: "anthropic",
        operation: "replace",
        cleanupKeys: ["provider.registry", "request.hook"],
        watcherObserved: true,
        sequence: 4,
      },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-provider:package-runtime-projection",
      evidenceRef: "conformance:opencode-provider-package-runtime-projection",
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      coveredRuntimeIDs: expect.arrayContaining([
        "builtin-provider-runtime-registration",
        "provider-package-module-spawn",
        "hot-reload-cycle-side-effects",
        "exact-concurrent-provider-hook-order",
      ]),
      coveredBoundaryIDs: expect.arrayContaining(["custom-provider-protocol-runtime", "live-provider-plugin-runtime"]),
      retainedFields: expect.arrayContaining([
        "npm package specifier",
        "remote model metadata keys",
        "custom frame retained keys",
        "scope cleanup operation",
        "source-ordered provider hook payload keys",
      ]),
      lossyFields: expect.arrayContaining([
        "custom provider private protocol fields",
        "native hot reload watcher debounce",
      ]),
      eventTypes: expect.arrayContaining(["package.import", "model.metadata", "custom.parser", "hot.reload", "provider.hook"]),
      knownGaps: expect.arrayContaining([
        "opencode-provider-package-runtime-projection-partial-fixture",
        "opencode-provider-model-metadata-fetch-not-replayed",
        "opencode-plugin-native-file-watcher-hot-reload-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(projection.packageImports).toEqual([
      {
        providerID: "anthropic",
        packageName: "@opencode/provider-anthropic",
        protocol: "custom",
        exportKeys: ["default", "provider"],
        moduleSideEffectKeys: ["env-read", "models-cache"],
        sequence: 1,
      },
    ])
    expect(projection.modelMetadata).toEqual([
      {
        providerID: "anthropic",
        modelID: "claude-opus-4",
        metadataKeys: ["contextWindow", "price"],
        remoteFetchObserved: true,
        sequence: 2,
      },
    ])
    expect(projection.customParserFrames).toEqual([
      {
        providerID: "anthropic",
        frameKind: "tool_call",
        retainedKeys: ["finishReason", "text"],
        privateFieldKeys: ["nativeIndex", "rawVendorPart"],
        sequence: 3,
      },
    ])
    expect(projection.hotReloads).toEqual([
      {
        providerID: "anthropic",
        operation: "replace",
        cleanupKeys: ["provider.registry", "request.hook"],
        watcherObserved: true,
        sequence: 4,
      },
    ])
    expect(projection.providerHooks).toEqual([
      {
        sourceID: "npm:@opencode/provider-anthropic",
        hookName: "chat.params",
        order: 2,
        payloadKeys: ["headers", "providerOptions"],
        concurrentBoundaryObserved: true,
        sequence: 5,
      },
    ])
  })

  it("captures OpenCode provider package/runtime live readback without claiming native parity", () => {
    const fixture = captureOpenCodeProviderPackageRuntimeLiveRuntimeFixture()

    expect(verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      evidenceRef: "conformance:opencode-provider-package-runtime-live-runtime-fixture",
      fixtureID: "opencode-provider:package-runtime-live-runtime-fixture",
      exactDiffStatus: "live-runtime-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      coveredRuntimeIDs: expect.arrayContaining([
        "builtin-provider-runtime-registration",
        "provider-package-module-spawn",
        "hot-reload-cycle-side-effects",
        "exact-concurrent-provider-hook-order",
      ]),
      coveredBoundaryIDs: expect.arrayContaining(["custom-provider-protocol-runtime", "live-provider-plugin-runtime"]),
      retainedFields: expect.arrayContaining([
        "npm package specifier readback",
        "custom protocol raw frame hash",
        "module cache invalidation key readback",
        "source ordered provider hook timing readback",
      ]),
      lossyFields: expect.arrayContaining([
        "real @opencode/provider-* parser side effects",
        "remote model metadata fetch timing",
        "native hot reload watcher debounce",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-provider-package-runtime-live-runtime-fixture-partial-native-gap",
        "opencode-real-provider-package-parser-not-spawned",
        "opencode-provider-native-hot-reload-order-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.packageImportReadback).toEqual([
      expect.objectContaining({
        providerID: "anthropic",
        packageName: "@opencode/provider-anthropic",
        npmSpecifier: "npm:@opencode/provider-anthropic",
        importer: "plugin-loader",
        moduleExportKeys: ["default", "provider"],
        exactSpecifierReadback: true,
      }),
    ])
    expect(fixture.modelMetadataReadback).toEqual([
      expect.objectContaining({
        providerID: "anthropic",
        modelID: "claude-opus-4",
        metadataKeys: ["contextWindow", "displayName", "price", "supportsTools"],
        remoteFetchObserved: true,
      }),
    ])
    expect(fixture.customParserReadback).toEqual([
      expect.objectContaining({
        protocol: "custom",
        frameKind: "tool_call",
        privateFieldKeys: ["nativeIndex", "rawVendorPart"],
        parsedEventKinds: ["tool_call"],
        exactRawFrameReadback: true,
      }),
    ])
    expect(fixture.hotReloadReadback).toEqual([
      expect.objectContaining({
        operation: "replace",
        cleanupOperations: ["provider.registry", "request.hook", "scope.cleanup"],
        invalidatedCacheKeys: ["@opencode/provider-anthropic", "npm:@opencode/provider-anthropic"],
        replacementRegistryKeys: ["anthropic", "anthropic:replacement"],
      }),
    ])
    expect(fixture.providerHookTimingReadback).toEqual([
      expect.objectContaining({
        hookName: "chat.params",
        asyncBoundaryMarker: "source-order-await",
        payloadKeys: ["headers", "providerOptions"],
        mergeWinnerKeys: ["providerOptions"],
        concurrentBoundaryObserved: true,
      }),
    ])
    expect(fixture.packageRuntimeProjection).toMatchObject({
      fixtureID: "opencode-provider:package-runtime-projection",
      evidenceRef: "conformance:opencode-provider-package-runtime-projection",
      eventTypes: expect.arrayContaining(["package.import", "model.metadata", "custom.parser", "hot.reload", "provider.hook"]),
    })

    const nativeClaim = {
      ...fixture,
      nativeParityClaim: true as unknown as false,
    }
    expect(verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-package-runtime-live-runtime.native-claim" }),
    ]))

    const missingPackageImport = {
      ...fixture,
      packageImportReadback: [],
    }
    expect(verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture(missingPackageImport).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-package-runtime-live-runtime.package-import-readback" }),
    ]))

    const missingCustomParserPrivateFields = {
      ...fixture,
      customParserReadback: fixture.customParserReadback.map((record) => ({ ...record, privateFieldKeys: [] })),
    }
    expect(verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture(missingCustomParserPrivateFields).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-package-runtime-live-runtime.custom-parser-readback" }),
    ]))

    const missingHotReload = {
      ...fixture,
      hotReloadReadback: [],
    }
    expect(verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture(missingHotReload).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-package-runtime-live-runtime.hot-reload-readback" }),
    ]))

    const missingNativeGap = {
      ...fixture,
      knownGaps: fixture.knownGaps.filter((gap) => gap !== "opencode-provider-package-runtime-live-runtime-fixture-partial-native-gap"),
    }
    expect(verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture(missingNativeGap).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-package-runtime-live-runtime.native-gaps" }),
    ]))
  })

  it("anchors Pi provider bridge ports to pinned upstream AI provider sources", () => {
    const snapshot = buildPiProviderSourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      pinnedRepo: "earendil-works/pi",
      pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      evidenceRef: "conformance:pi-provider-source-matrix",
      fixtureID: "pi-provider:source-matrix",
      partialBranchIDs: expect.arrayContaining([
        "builtin-provider-registration",
        "anthropic-request",
        "openai-responses-request",
        "model-extension",
        "request-options",
        "auth-descriptor",
        "stream-parser",
        "event-normalizer",
        "usage-renderer",
        "transport-instrumentation",
        "extension-descriptor",
      ]),
      missingBranchIDs: expect.arrayContaining(["live-api-provider-runtime", "exact-provider-retry-cancel"]),
      coveredProviderAtomIDs: expect.arrayContaining([
        "pi.provider.auth-descriptor",
        "pi.provider.event-observer",
        "pi.provider.extension-descriptor",
        "pi.provider.model-extension",
        "pi.provider.parser-observer",
        "pi.provider.request-options",
        "pi.provider.transport-instrumentation",
        "pi.provider.usage-renderer",
      ]),
      coveredProviderPortIDs: expect.arrayContaining([
        "provider.auth",
        "provider.model-registry",
        "provider.request-shape",
        "provider.stream-parser",
        "provider.event-normalizer",
        "provider.usage-normalizer",
        "provider.transport",
        "provider.stream",
      ]),
      knownGaps: expect.arrayContaining([
        "pi-provider-source-matrix-covered-by-partial-fixture",
        "pi-live-api-provider-runtime-not-spawned",
        "pi-provider-retry-delay-and-cancel-abort-race-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "anthropic-provider",
        path: "packages/ai/src/providers/anthropic.ts",
        symbols: expect.arrayContaining(["AnthropicOptions", "streamAnthropic", "buildParams", "convertMessages", "convertTools"]),
      }),
      expect.objectContaining({
        id: "openai-responses-provider",
        path: "packages/ai/src/providers/openai-responses.ts",
        symbols: expect.arrayContaining(["OpenAIResponsesOptions", "streamOpenAIResponses", "buildParams"]),
      }),
      expect.objectContaining({
        id: "builtin-provider-registry",
        path: "packages/ai/src/providers/register-builtins.ts",
        symbols: expect.arrayContaining(["registerBuiltInApiProviders", "resetApiProviders"]),
      }),
    ]))
    expect(snapshot.branchAnchors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        branchID: "request-options",
        status: "partial",
        providerAtomIDs: ["pi.provider.request-options"],
        providerPortIDs: ["provider.request-shape"],
        sourceRefIDs: ["anthropic-provider", "openai-responses-provider"],
      }),
      expect.objectContaining({
        branchID: "transport-instrumentation",
        status: "partial",
        providerAtomIDs: ["pi.provider.transport-instrumentation"],
        localMarkers: expect.arrayContaining(["retry-error-boundary", "cancel-boundary"]),
      }),
      expect.objectContaining({
        branchID: "exact-provider-retry-cancel",
        status: "missing",
        knownGaps: expect.arrayContaining(["pi-provider-retry-delay-and-cancel-abort-race-not-exact"]),
      }),
    ]))
  })

  it("anchors Hermes provider bridge ports to pinned upstream transport sources", () => {
    const snapshot = buildHermesProviderSourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "package:hermes-agent==0.15.1",
      pinnedRepo: "NousResearch/hermes-agent",
      pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
      evidenceRef: "conformance:hermes-provider-source-matrix",
      fixtureID: "hermes-provider:source-matrix",
      partialBranchIDs: expect.arrayContaining([
        "codex-responses-request",
        "anthropic-request",
        "chat-completions-request",
        "model-registry",
        "request-options",
        "auth-descriptor",
        "stream-parser",
        "event-normalizer",
        "usage-renderer",
        "transport-instrumentation",
        "provider-plugin-descriptor",
      ]),
      missingBranchIDs: expect.arrayContaining(["live-transport-factory", "exact-provider-retry-cancel"]),
      coveredProviderAtomIDs: expect.arrayContaining([
        "hermes.provider.auth-descriptor",
        "hermes.provider.event-observer",
        "hermes.provider.model-registry",
        "hermes.provider.parser-observer",
        "hermes.provider.plugin-descriptor",
        "hermes.provider.request-options",
        "hermes.provider.transport-instrumentation",
        "hermes.provider.usage-renderer",
      ]),
      coveredProviderPortIDs: expect.arrayContaining([
        "provider.auth",
        "provider.model-registry",
        "provider.request-shape",
        "provider.stream-parser",
        "provider.event-normalizer",
        "provider.usage-normalizer",
        "provider.transport",
        "provider.stream",
      ]),
      knownGaps: expect.arrayContaining([
        "hermes-provider-source-matrix-covered-by-partial-fixture",
        "hermes-live-transport-factory-not-spawned",
        "hermes-provider-retry-delay-and-cancel-abort-race-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "codex-responses-transport",
        path: "agent/transports/codex.py",
        symbols: expect.arrayContaining(["ResponsesApiTransport", "convert_messages", "build_kwargs", "normalize_response"]),
      }),
      expect.objectContaining({
        id: "anthropic-transport",
        path: "agent/transports/anthropic.py",
        symbols: expect.arrayContaining(["AnthropicTransport", "convert_messages", "build_kwargs", "normalize_response"]),
      }),
      expect.objectContaining({
        id: "chat-completions-transport",
        path: "agent/transports/chat_completions.py",
        symbols: expect.arrayContaining(["ChatCompletionsTransport", "convert_messages", "build_kwargs", "normalize_response"]),
      }),
      expect.objectContaining({
        id: "transport-types",
        path: "agent/transports/types.py",
        symbols: expect.arrayContaining(["ToolCall", "Usage", "NormalizedResponse", "map_finish_reason"]),
      }),
    ]))
    expect(snapshot.branchAnchors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        branchID: "request-options",
        status: "partial",
        providerAtomIDs: ["hermes.provider.request-options"],
        providerPortIDs: ["provider.request-shape"],
        sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport"],
      }),
      expect.objectContaining({
        branchID: "transport-instrumentation",
        status: "partial",
        providerAtomIDs: ["hermes.provider.transport-instrumentation"],
        localMarkers: expect.arrayContaining(["streaming-http", "retry-error-boundary", "cancel-boundary"]),
      }),
      expect.objectContaining({
        branchID: "exact-provider-retry-cancel",
        status: "missing",
        knownGaps: expect.arrayContaining(["hermes-provider-retry-delay-and-cancel-abort-race-not-exact"]),
      }),
    ]))
  })

  it("anchors Nanobot provider bridge ports to pinned upstream provider sources", () => {
    const snapshot = buildNanobotProviderSourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "package:nanobot-ai@0.2.0",
      pinnedRepo: "HKUDS/nanobot",
      pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
      evidenceRef: "conformance:nanobot-provider-source-matrix",
      fixtureID: "nanobot-provider:source-matrix",
      partialBranchIDs: expect.arrayContaining([
        "registry-selection",
        "model-registry",
        "request-options",
        "auth-descriptor",
        "stream-parser",
        "event-normalizer",
        "usage-renderer",
        "transport-instrumentation",
        "provider-plugin-descriptor",
      ]),
      missingBranchIDs: expect.arrayContaining(["live-provider-factory", "exact-provider-retry-cancel"]),
      coveredProviderAtomIDs: expect.arrayContaining([
        "nanobot.provider.auth-descriptor",
        "nanobot.provider.event-observer",
        "nanobot.provider.model-registry",
        "nanobot.provider.parser-observer",
        "nanobot.provider.plugin-descriptor",
        "nanobot.provider.request-options",
        "nanobot.provider.transport-instrumentation",
        "nanobot.provider.usage-renderer",
      ]),
      coveredProviderPortIDs: expect.arrayContaining([
        "provider.auth",
        "provider.model-registry",
        "provider.request-shape",
        "provider.stream-parser",
        "provider.event-normalizer",
        "provider.usage-normalizer",
        "provider.transport",
        "provider.stream",
      ]),
      knownGaps: expect.arrayContaining([
        "nanobot-provider-source-matrix-covered-by-partial-fixture",
        "nanobot-live-provider-factory-not-spawned",
        "nanobot-provider-retry-delay-and-cancel-abort-race-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-registry",
        path: "nanobot/providers/registry.py",
        symbols: expect.arrayContaining(["ProviderSpec", "find_by_name"]),
      }),
      expect.objectContaining({
        id: "openai-compatible-provider",
        path: "nanobot/providers/openai_compat_provider.py",
        symbols: expect.arrayContaining(["OpenAICompatProvider", "_build_kwargs", "_parse_chunks"]),
      }),
      expect.objectContaining({
        id: "anthropic-provider",
        path: "nanobot/providers/anthropic_provider.py",
        symbols: expect.arrayContaining(["AnthropicProvider", "_convert_messages", "_convert_tools"]),
      }),
      expect.objectContaining({
        id: "provider-factory",
        path: "nanobot/providers/factory.py",
        symbols: expect.arrayContaining(["ProviderSnapshot", "make_provider", "provider_signature"]),
      }),
    ]))
    expect(snapshot.branchAnchors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        branchID: "request-options",
        status: "partial",
        providerAtomIDs: ["nanobot.provider.request-options"],
        providerPortIDs: ["provider.request-shape"],
        sourceRefIDs: ["openai-compatible-provider", "anthropic-provider"],
      }),
      expect.objectContaining({
        branchID: "transport-instrumentation",
        status: "partial",
        providerAtomIDs: ["nanobot.provider.transport-instrumentation"],
        localMarkers: expect.arrayContaining(["streaming-http", "retry-error-boundary", "cancel-boundary"]),
      }),
      expect.objectContaining({
        branchID: "exact-provider-retry-cancel",
        status: "missing",
        knownGaps: expect.arrayContaining(["nanobot-provider-retry-delay-and-cancel-abort-race-not-exact"]),
      }),
    ]))
  })

  it("records provider raw-frame replay positive and negative gates", () => {
    const snapshot = buildProviderRawFrameReplayGateSnapshot()
    const verification = verifyProviderRawFrameReplayGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:provider-raw-frame-replay-gate",
      fixtureID: "provider:raw-frame-replay-gate",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "request-shape",
        "registry-selection",
        "raw-frame-order",
        "usage-accounting",
        "retry-error-cancel",
        "raw-payload-roundtrip",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-provider:source-matrix",
      replayRisk: "source-anchored-partial",
      sourceAnchors: expect.arrayContaining([
        "llm-native-request:packages/opencode/src/session/llm/native-request.ts",
        "local-opencode-retry-cancel:packages/lego-provider/src/opencode-retry-cancel.ts",
      ]),
      rawFrameOrder: expect.arrayContaining(["raw-sse-frame-parser-boundary", "raw frame order", "tool-call-delta"]),
      retryErrorCancel: expect.arrayContaining([
        "exact-retry-cancel-timing",
        "opencode-turn-retry-policy:native-exact-fixture",
        "sse-read-timeout-aborts-and-cancels",
        "parser retryability",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-provider-source-matrix",
        "conformance:opencode-provider-raw-frame-boundary-matrix",
        "opencode-provider-request-options:native-exact-fixture",
        "provider-request-options-native-exact:opencode",
        "opencode-provider-parser-observer:native-exact-fixture",
        "provider-parser-observer-native-exact:opencode",
        "opencode-provider-stream-projector:native-exact-fixture",
        "provider-stream-projector-native-exact:opencode",
        "opencode-provider:package-runtime-native-exact-diff-fixture",
        "conformance:opencode-provider-package-runtime-native-exact-diff-fixture",
        "provider-package-runtime-native-exact-diff:opencode",
        "opencode-turn-retry-policy:native-exact-fixture",
        "turn-retry-policy-native-exact:opencode",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-provider:source-matrix",
        "opencode-provider:raw-frame-boundary-matrix",
        "opencode-provider-request-options:native-exact-fixture",
        "opencode-provider-parser-observer:native-exact-fixture",
        "opencode-provider-stream-projector:native-exact-fixture",
        "opencode-provider:package-runtime-native-exact-diff-fixture",
        "opencode-turn-retry-policy:native-exact-fixture",
      ]),
      knownLossiness: expect.arrayContaining([
        "opencode-provider-raw-frame-boundary-matrix-partial-fixture",
        "opencode-real-provider-package-parser-not-spawned",
        "opencode-custom-provider-native-protocol-private-fields-not-replayed",
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-provider:source-matrix",
      requestShape: expect.arrayContaining(["streamAnthropic", "streamOpenAIResponses", "buildParams"]),
      retryErrorCancel: expect.arrayContaining(["retry:partial", "cancel:partial", "wall-clock:not-replayed"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.rawPayloadRoundTrip).toEqual(expect.arrayContaining([
      "OpenAICompatProvider._parse_chunks",
      "AnthropicProvider.chat_stream",
      "finish-usage",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.usageAccounting).toEqual(expect.arrayContaining([
      "Usage",
      "map_finish_reason",
      "finish_reason",
    ]))

    const payloadDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, rawPayloadRoundTrip: [] }
          : item,
      ),
    }
    expect(verifyProviderRawFrameReplayGateSnapshot(payloadDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame.raw-payload-roundtrip",
        product: "opencode",
        dimension: "raw-payload-roundtrip",
      }),
    ]))

    const usageDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, usageAccounting: [] }
          : item,
      ),
    }
    expect(verifyProviderRawFrameReplayGateSnapshot(usageDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame.usage-accounting",
        product: "pi-mono",
        dimension: "usage-accounting",
      }),
    ]))

    const retryDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, retryErrorCancel: [] }
          : item,
      ),
    }
    expect(verifyProviderRawFrameReplayGateSnapshot(retryDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame.retry-error-cancel",
        product: "nanobot",
        dimension: "retry-error-cancel",
      }),
    ]))

    const cassetteOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, replayRisk: "cassette-only" as const }
          : item,
      ),
    }
    expect(verifyProviderRawFrameReplayGateSnapshot(cassetteOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame.cassette-or-helix-only",
        product: "hermes-agent",
        dimension: "raw-frame-order",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              nativeEvidenceRefs: item.nativeEvidenceRefs.filter((ref) => ref !== "provider-request-options-native-exact:opencode"),
              fixtureIDs: item.fixtureIDs.filter((fixtureID) => fixtureID !== "opencode-provider-request-options:native-exact-fixture"),
            }
          : item,
      ),
    }
    expect(verifyProviderRawFrameReplayGateSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame.native-exact-evidence",
        product: "opencode",
        dimension: "raw-frame-order",
      }),
    ]))

    const borrowedOpenCode = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, fixtureID: "opencode-provider:source-matrix", replayRisk: "borrowed-opencode" as const }
          : item,
      ),
    }
    expect(verifyProviderRawFrameReplayGateSnapshot(borrowedOpenCode).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame.borrowed-source-matrix",
        product: "pi-mono",
        dimension: "registry-selection",
      }),
    ]))
  })

  it("records provider raw-frame exact-diff blockers without claiming native parity", () => {
    const snapshot = buildProviderRawFrameExactDiffBlockerSnapshot()
    const verification = verifyProviderRawFrameExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:provider-raw-frame-exact-diff-blocker-gate",
      fixtureID: "provider:raw-frame-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "request-shape",
        "registry-selection",
        "raw-frame-order",
        "usage-accounting",
        "retry-error-cancel",
        "raw-payload-roundtrip",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-provider:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "semantic-fixture-needs-exact-diff",
      requestShape: expect.arrayContaining(["provider-request-shape-native-body:exact-diff-not-proven"]),
      registrySelection: expect.arrayContaining(["provider-registry-selection-native-runtime:exact-diff-not-proven"]),
      rawFrameOrder: expect.arrayContaining(["provider-raw-frame-order-native-timing:exact-diff-not-proven"]),
      usageAccounting: expect.arrayContaining(["provider-usage-accounting-native-detail:exact-diff-not-proven"]),
      retryErrorCancel: expect.arrayContaining(["provider-retry-error-cancel-native-race:exact-diff-not-proven"]),
      rawPayloadRoundTrip: expect.arrayContaining(["provider-raw-payload-roundtrip-native-fields:exact-diff-not-proven"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "opencode-provider:source-matrix",
        "opencode-provider:raw-frame-boundary-matrix",
        "llm-native-request:packages/opencode/src/session/llm/native-request.ts",
        "opencode-provider-request-options:native-exact-fixture",
        "provider-request-options-native-exact:opencode",
        "opencode-provider-event-observer:native-exact-fixture",
        "provider-event-observer-native-exact:opencode",
        "opencode-provider-stream-projector:native-exact-fixture",
        "provider-stream-projector-native-exact:opencode",
        "opencode-provider-transport-instrumentation:native-exact-fixture",
        "provider-transport-instrumentation-native-exact:opencode",
      ]),
      knownLossiness: expect.arrayContaining([
        "provider-raw-frame-order-native-timing-not-proven",
        "provider-retry-error-cancel-native-race-not-proven",
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-provider:source-matrix",
      requestShape: expect.arrayContaining(["streamAnthropic", "provider-request-shape-native-body:exact-diff-not-proven"]),
      rawPayloadRoundTrip: expect.arrayContaining(["provider-raw-payload-roundtrip-native-fields:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.retryErrorCancel).toEqual(expect.arrayContaining([
      "provider-retry-error-cancel-native-race:exact-diff-not-proven",
      "cancel:partial",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.usageAccounting).toEqual(expect.arrayContaining([
      "provider-usage-accounting-native-detail:exact-diff-not-proven",
      "map_finish_reason",
    ]))

    const requestDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, requestShape: [] }
          : item,
      ),
    }
    expect(verifyProviderRawFrameExactDiffBlockerSnapshot(requestDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-exact-diff.request-shape",
        product: "opencode",
        dimension: "request-shape",
      }),
    ]))

    const registryDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, registrySelection: [] }
          : item,
      ),
    }
    expect(verifyProviderRawFrameExactDiffBlockerSnapshot(registryDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-exact-diff.registry-selection",
        product: "pi-mono",
        dimension: "registry-selection",
      }),
    ]))

    const frameDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, rawFrameOrder: [] }
          : item,
      ),
    }
    expect(verifyProviderRawFrameExactDiffBlockerSnapshot(frameDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-exact-diff.raw-frame-order",
        product: "nanobot",
        dimension: "raw-frame-order",
      }),
    ]))

    const usageDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, usageAccounting: [] }
          : item,
      ),
    }
    expect(verifyProviderRawFrameExactDiffBlockerSnapshot(usageDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-exact-diff.usage-accounting",
        product: "hermes-agent",
        dimension: "usage-accounting",
      }),
    ]))

    const retryDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, retryErrorCancel: [] }
          : item,
      ),
    }
    expect(verifyProviderRawFrameExactDiffBlockerSnapshot(retryDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-exact-diff.retry-error-cancel",
        product: "opencode",
        dimension: "retry-error-cancel",
      }),
    ]))

    const payloadDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, rawPayloadRoundTrip: [] }
          : item,
      ),
    }
    expect(verifyProviderRawFrameExactDiffBlockerSnapshot(payloadDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-exact-diff.raw-payload-roundtrip",
        product: "pi-mono",
        dimension: "raw-payload-roundtrip",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyProviderRawFrameExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-exact-diff.native-claim",
        product: "opencode",
        dimension: "request-shape",
      }),
    ]))

    const cassetteOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, exactDiffRisk: "cassette-only" as const }
          : item,
      ),
    }
    expect(verifyProviderRawFrameExactDiffBlockerSnapshot(cassetteOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-exact-diff.cassette-or-helix-only",
        product: "hermes-agent",
        dimension: "raw-frame-order",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              nativeEvidenceRefs: item.nativeEvidenceRefs.filter((ref) =>
                ref !== "provider-stream-projector-native-exact:opencode" &&
                ref !== "opencode-provider-stream-projector:native-exact-fixture"
              ),
            }
          : item,
      ),
    }
    expect(verifyProviderRawFrameExactDiffBlockerSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-exact-diff.native-exact-evidence",
        product: "opencode",
        dimension: "raw-frame-order",
      }),
    ]))

    const borrowedOpenCode = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, fixtureID: "opencode-provider:source-matrix", exactDiffRisk: "borrowed-opencode" as const }
          : item,
      ),
    }
    expect(verifyProviderRawFrameExactDiffBlockerSnapshot(borrowedOpenCode).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-exact-diff.borrowed-source-matrix",
        product: "nanobot",
        dimension: "registry-selection",
      }),
    ]))
  })

  it("records provider raw-frame pinned replay fixtures without upgrading native parity", () => {
    const snapshot = buildProviderRawFramePinnedReplaySnapshot()
    const verification = verifyProviderRawFramePinnedReplaySnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:provider-raw-frame-pinned-replay-gate",
      fixtureID: "provider:raw-frame-pinned-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "request-shape",
        "registry-selection",
        "raw-frame-order",
        "usage-accounting",
        "retry-error-cancel",
        "raw-payload-roundtrip",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-provider:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "pinned-replay-needs-live-provider",
      upstreamFrames: expect.arrayContaining([
        expect.objectContaining({ frameType: "request", registryProviderID: "opencode:builtin:openai", modelID: "openai/gpt-4.1" }),
        expect.objectContaining({ frameType: "tool-call-delta", toolCallID: "call_oc_1", toolName: "bash" }),
        expect.objectContaining({ frameType: "retry", retryAttempt: 1, retryDelayMs: 1000 }),
      ]),
      productParsedFrames: expect.arrayContaining([
        expect.objectContaining({ frameID: "opencode-provider-frame-2", textDelta: "hello" }),
      ]),
      assembledEvents: expect.arrayContaining([
        expect.objectContaining({ frameID: "opencode-provider-frame-4", usage: { inputTokens: 12, outputTokens: 7, cacheReadTokens: null } }),
      ]),
      fixtureIDs: expect.arrayContaining([
        "provider:raw-frame-replay-gate",
        "opencode-provider:source-matrix",
        "opencode-provider:raw-frame-boundary-matrix",
        "opencode-provider-request-options:native-exact-fixture",
        "opencode-provider-parser-observer:native-exact-fixture",
        "opencode-provider-stream-projector:native-exact-fixture",
        "opencode-turn-retry-policy:native-exact-fixture",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "opencode-provider:source-matrix",
        "opencode-provider:raw-frame-boundary-matrix",
        "opencode-provider-request-options:native-exact-fixture",
        "provider-request-options-native-exact:opencode",
        "opencode-provider-parser-observer:native-exact-fixture",
        "provider-parser-observer-native-exact:opencode",
        "opencode-provider-stream-projector:native-exact-fixture",
        "provider-stream-projector-native-exact:opencode",
        "opencode-turn-retry-policy:native-exact-fixture",
        "turn-retry-policy-native-exact:opencode",
      ]),
      sourceAnchors: expect.arrayContaining(["llm-native-request:packages/opencode/src/session/llm/native-request.ts"]),
      knownLossiness: expect.arrayContaining(["provider-raw-frame-pinned-replay-live-runtime-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      upstreamFrames: expect.arrayContaining([
        expect.objectContaining({ frameType: "request", registryProviderID: "pi:extension:anthropic" }),
        expect.objectContaining({ frameType: "cancel", cancelObserved: true }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      upstreamFrames: expect.arrayContaining([
        expect.objectContaining({ frameType: "error", retryAttempt: 1, retryDelayMs: 750 }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")).toMatchObject({
      upstreamFrames: expect.arrayContaining([
        expect.objectContaining({ frameType: "reasoning-delta", textDelta: "think" }),
        expect.objectContaining({ frameType: "usage", finishReason: "stop" }),
      ]),
    })

    const payloadDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              productParsedFrames: item.productParsedFrames.map((frame, index) =>
                index === 2
                  ? { ...frame, toolArguments: "{\"cmd\":\"ls\"}" }
                  : frame,
              ),
            }
          : item,
      ),
    }
    expect(verifyProviderRawFramePinnedReplaySnapshot(payloadDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-pinned-replay.raw-payload-roundtrip",
        product: "opencode",
        dimension: "raw-payload-roundtrip",
      }),
    ]))

    const usageDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? {
              ...item,
              assembledEvents: item.assembledEvents.map((frame, index) =>
                index === 3
                  ? { ...frame, usage: { inputTokens: 19, outputTokens: 10, cacheReadTokens: 3 } }
                  : frame,
              ),
            }
          : item,
      ),
    }
    expect(verifyProviderRawFramePinnedReplaySnapshot(usageDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-pinned-replay.usage-accounting",
        product: "pi-mono",
        dimension: "usage-accounting",
      }),
    ]))

    const retryDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? {
              ...item,
              productParsedFrames: item.productParsedFrames.map((frame, index) =>
                index === 3
                  ? { ...frame, retryDelayMs: 1000 }
                  : frame,
              ),
            }
          : item,
      ),
    }
    expect(verifyProviderRawFramePinnedReplaySnapshot(retryDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-pinned-replay.retry-error-cancel",
        product: "nanobot",
        dimension: "retry-error-cancel",
      }),
    ]))

    const registryDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              assembledEvents: item.assembledEvents.map((frame, index) =>
                index === 0
                  ? { ...frame, registryProviderID: "hermes:transport:wrong" }
                  : frame,
              ),
            }
          : item,
      ),
    }
    expect(verifyProviderRawFramePinnedReplaySnapshot(registryDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-pinned-replay.registry-selection",
        product: "hermes-agent",
        dimension: "registry-selection",
      }),
    ]))

    const frameOrderDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledEvents: item.assembledEvents.map((frame, index) =>
                index === 1
                  ? { ...frame, sequence: 99 }
                  : frame,
              ),
            }
          : item,
      ),
    }
    expect(verifyProviderRawFramePinnedReplaySnapshot(frameOrderDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-pinned-replay.raw-frame-order",
        product: "opencode",
        dimension: "raw-frame-order",
      }),
    ]))

    const requestDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? {
              ...item,
              upstreamFrames: item.upstreamFrames.map((frame, index) =>
                index === 0
                  ? { ...frame, modelID: "" }
                  : frame,
              ),
            }
          : item,
      ),
    }
    expect(verifyProviderRawFramePinnedReplaySnapshot(requestDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-pinned-replay.request-shape",
        product: "pi-mono",
        dimension: "request-shape",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyProviderRawFramePinnedReplaySnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-pinned-replay.native-claim",
        product: "opencode",
        dimension: "request-shape",
      }),
    ]))

    const harnessOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, exactDiffRisk: "helix-only" as const }
          : item,
      ),
    }
    expect(verifyProviderRawFramePinnedReplaySnapshot(harnessOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-pinned-replay.cassette-or-helix-only",
        product: "nanobot",
        dimension: "raw-frame-order",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              nativeEvidenceRefs: item.nativeEvidenceRefs.filter((ref) => ref !== "provider-event-observer-native-exact:opencode"),
              fixtureIDs: item.fixtureIDs.filter((fixtureID) => fixtureID !== "opencode-provider-event-observer:native-exact-fixture"),
            }
          : item,
      ),
    }
    expect(verifyProviderRawFramePinnedReplaySnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "provider-raw-frame-pinned-replay.native-exact-evidence",
        product: "opencode",
        dimension: "raw-frame-order",
      }),
    ]))
  })

  it("coalesces adjacent text and reasoning chunks", async () => {
    const events = await collect(
      normalizeProviderStream(
        stream([
          { type: "text", text: "hello " },
          { type: "text", text: "world" },
          { type: "reasoning", text: "think" },
          { type: "reasoning", text: "ing" },
          { type: "finish", finish: "stop" },
        ]),
      ),
    )

    expect(events).toEqual([
      { type: "text", text: "hello world" },
      { type: "reasoning", text: "thinking" },
      { type: "finish", finish: "stop" },
    ])
  })

  it("assigns missing tool call ids while preserving provider order", async () => {
    const events = await collect(
      normalizeProviderStream(
        stream([
          { type: "text", text: "before" },
          { type: "tool_call", toolName: "echo", input: { text: "hi" } },
          { type: "text", text: "after" },
          { type: "finish", finish: "tool_calls" },
        ]),
      ),
    )

    expect(events.map((event) => event.type)).toEqual(["text", "tool_call", "text", "finish"])
    expect(events[1]).toMatchObject({ type: "tool_call", toolName: "echo", input: { text: "hi" } })
    expect((events[1] as Extract<ProviderStreamEvent, { type: "tool_call" }>).id).toMatch(/^tc_/)
  })

  it("parses OpenAI-compatible SSE chunks into provider stream events", async () => {
    const events = await collect(
      parseOpenAICompatibleStream(
        streamText([
          sse({ choices: [{ delta: { content: "hel" } }] }),
          sse({ choices: [{ delta: { content: "lo" } }] }),
          sse({ choices: [{ delta: { reasoning_content: "think" } }] }),
          sse({ choices: [{ delta: { tool_calls: [{ index: 0, id: "call_1", function: { name: "echo", arguments: "{\"text\"" } }] } }] }),
          sse({
            choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: ":\"hi\"}" } }] }, finish_reason: "tool_calls" }],
            usage: { prompt_tokens: 7, completion_tokens: 3 },
          }),
          "data: [DONE]\n\n",
        ]),
      ),
    )

    expect(events).toEqual([
      { type: "text", text: "hel" },
      { type: "text", text: "lo" },
      { type: "reasoning", text: "think" },
      { type: "tool_call", id: "call_1", toolName: "echo", input: { text: "hi" } },
      { type: "finish", finish: "tool_calls", usage: { input: 7, output: 3 } },
    ])
  })

  it("sends OpenAI-compatible chat completion requests with auth, tools, and options", async () => {
    let captured: { url: string; init: { headers: Record<string, string>; body: string } } | undefined
    const provider = createOpenAICompatibleProvider({
      id: "test-openai",
      baseURL: "https://provider.example/v1",
      apiKey: "secret",
      models: [{ modelID: "gpt-test", contextWindow: 128 }],
      async fetch(url, init) {
        captured = { url, init }
        return {
          ok: true,
          status: 200,
          body: byteStream([sse({ choices: [{ delta: { content: "ok" }, finish_reason: "stop" }], usage: { prompt_tokens: 2, completion_tokens: 1 } })]),
          async text() {
            return ""
          },
        }
      },
    })
    const [model] = provider.models()
    if (!model) throw new Error("expected model")

    const events = await collect(
      provider.stream({
        model,
        system: ["system prompt"],
        messages: [createUserMessage({ sessionID: "ses_provider" as never, text: "hello" })],
        tools: [
          {
            name: "echo",
            description: "Echo text.",
            parameters: { type: "object", properties: { text: { type: "string" } } },
            execute() {
              return { content: [{ id: createID("part"), type: "text", text: "" }] }
            },
          },
        ],
        options: { temperature: 0 },
      } satisfies ProviderRequest),
    )

    const body = JSON.parse(captured?.init.body ?? "{}") as Record<string, unknown>
    expect(captured?.url).toBe("https://provider.example/v1/chat/completions")
    expect(captured?.init.headers.authorization).toBe("Bearer secret")
    expect(body).toMatchObject({
      model: "gpt-test",
      stream: true,
      temperature: 0,
      messages: [
        { role: "system", content: "system prompt" },
        { role: "user", content: "hello" },
      ],
      tools: [{ type: "function", function: { name: "echo", description: "Echo text." } }],
    })
    expect(events).toEqual([{ type: "text", text: "ok" }, { type: "finish", finish: "stop", usage: { input: 2, output: 1 } }])
  })

  it("runs OpenAI-compatible providers through swappable transport, request-shape, model-registry, and cassette ports", async () => {
    const cassette = createMemoryProviderCassette()
    const transport = createRecordingProviderTransport(
      createMockSSEProviderTransport([
        sse({
          choices: [
            { delta: { content: "ok" } },
            { delta: { reasoning_content: "think" } },
            { delta: { tool_calls: [{ index: 0, id: "call_1", function: { name: "echo", arguments: "{\"text\":\"hi\"}" } }] }, finish_reason: "tool_calls" },
          ],
          usage: { prompt_tokens: 5, completion_tokens: 2 },
        }),
      ]),
      cassette,
    )
    const requestShape = createOpenAICompatibleRequestShape()
    const provider = createOpenAICompatibleProvider({
      id: "port-openai",
      baseURL: "https://provider.example/v1",
      auth: { type: "api-key", apiKey: "secret" },
      models: [],
      modelRegistry: createStaticProviderModelRegistry("port-openai", [{ modelID: "gpt-port", contextWindow: 64 }]),
      transport,
      requestShape: {
        shape(request) {
          const shaped = requestShape.shape(request)
          return { ...shaped, headers: { "x-request-shape": "openai-compatible" } }
        },
      },
    })
    const [model] = provider.models()
    if (!model) throw new Error("expected model")

    const events = await collect(provider.stream({ model, system: [], messages: [], tools: [] }))
    const [record] = cassette.records()
    if (!record) throw new Error("expected cassette record")

    expect(model).toMatchObject({ providerID: "port-openai", modelID: "gpt-port", contextWindow: 64 })
    expect(events).toEqual([
      { type: "text", text: "ok" },
      { type: "reasoning", text: "think" },
      { type: "tool_call", id: "call_1", toolName: "echo", input: { text: "hi" } },
      { type: "finish", finish: "tool_calls", usage: { input: 5, output: 2 } },
    ])
    expect(record.url).toBe("https://provider.example/v1/chat/completions")
    expect(record.requestHeaders.authorization).toBe("Bearer secret")
    expect(record.requestHeaders["x-request-shape"]).toBe("openai-compatible")

    const replayProvider = createOpenAICompatibleProvider({
      id: "port-openai",
      baseURL: "https://provider.example/v1",
      models: ["gpt-port"],
      transport: createRecordedCassetteProviderTransport(cassette),
    })
    const [replayModel] = replayProvider.models()
    if (!replayModel) throw new Error("expected replay model")
    await expect(collect(replayProvider.stream({ model: replayModel, system: [], messages: [], tools: [] }))).resolves.toEqual(events)
  })

  it("runs Anthropic and Google providers through the shared transport, auth, model, request, parser, normalizer, and cassette ports", async () => {
    const anthropicCassette = createMemoryProviderCassette()
    const anthropicSeen: string[] = []
    const anthropicShape = createAnthropicRequestShape()
    const anthropicProvider = createAnthropicProvider({
      id: "port-anthropic",
      baseURL: "https://anthropic.example",
      auth: { type: "api-key", apiKey: "anthropic-secret" },
      models: [],
      modelRegistry: createStaticProviderModelRegistry("port-anthropic", [{ modelID: "claude-port", cost: { input: 2, output: 4 } }]),
      transport: createRecordingProviderTransport(
        createMockSSEProviderTransport([
          anthropicSse("message_start", { message: { usage: { input_tokens: 10 } } }),
          anthropicSse("content_block_start", { index: 0, content_block: { type: "text", text: "" } }),
          anthropicSse("content_block_delta", { index: 0, delta: { type: "text_delta", text: "anthropic-ok" } }),
          anthropicSse("message_delta", { delta: { stop_reason: "stop" }, usage: { output_tokens: 5 } }),
          anthropicSse("message_stop", {}),
        ]),
        anthropicCassette,
      ),
      requestShape: {
        shape(request) {
          const shaped = anthropicShape.shape(request)
          return { ...shaped, headers: { "x-request-shape": "anthropic-port" } }
        },
      },
      eventNormalizer: {
        async *normalize(events, context) {
          if (context?.model) anthropicSeen.push(`model:${context.model.modelID}`)
          for await (const event of events) {
            anthropicSeen.push(event.type)
            yield event.type === "text" ? { ...event, text: `normalized:${event.text}` } : event
          }
        },
      },
    })
    const [anthropicModel] = anthropicProvider.models()
    if (!anthropicModel) throw new Error("expected anthropic model")

    const anthropicEvents = await collect(anthropicProvider.stream({ model: anthropicModel, system: [], messages: [], tools: [] }))
    const [anthropicRecord] = anthropicCassette.records()
    if (!anthropicRecord) throw new Error("expected anthropic cassette record")

    expect(anthropicEvents).toEqual([
      { type: "text", text: "normalized:anthropic-ok" },
      { type: "finish", finish: "stop", usage: { input: 10, output: 5 } },
    ])
    expect(anthropicSeen).toEqual(["model:claude-port", "text", "finish"])
    expect(anthropicRecord.url).toBe("https://anthropic.example/v1/messages")
    expect(anthropicRecord.requestHeaders["x-api-key"]).toBe("anthropic-secret")
    expect(anthropicRecord.requestHeaders["x-request-shape"]).toBe("anthropic-port")

    const googleCassette = createMemoryProviderCassette()
    const googleSeen: string[] = []
    const googleShape = createGoogleRequestShape()
    const googleProvider = createGoogleProvider({
      id: "port-google",
      baseURL: "https://google.example/v1beta",
      auth: { type: "api-key", apiKey: "google-secret" },
      models: [],
      modelRegistry: createStaticProviderModelRegistry("port-google", [{ modelID: "gemini-port", cost: { input: 1, output: 3 } }]),
      transport: createRecordingProviderTransport(
        createMockSSEProviderTransport([
          sse({
            candidates: [{ content: { role: "model", parts: [{ text: "google-ok" }] }, finishReason: "STOP" }],
            usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 4 },
          }),
        ]),
        googleCassette,
      ),
      requestShape: {
        shape(request) {
          const shaped = googleShape.shape(request)
          return { ...shaped, headers: { "x-request-shape": "google-port" } }
        },
      },
      eventNormalizer: {
        async *normalize(events, context) {
          if (context?.model) googleSeen.push(`model:${context.model.modelID}`)
          for await (const event of events) {
            googleSeen.push(event.type)
            yield event.type === "text" ? { ...event, text: `normalized:${event.text}` } : event
          }
        },
      },
    })
    const [googleModel] = googleProvider.models()
    if (!googleModel) throw new Error("expected google model")

    const googleEvents = await collect(googleProvider.stream({ model: googleModel, system: [], messages: [], tools: [] }))
    const [googleRecord] = googleCassette.records()
    if (!googleRecord) throw new Error("expected google cassette record")

    expect(googleEvents).toEqual([
      { type: "text", text: "normalized:google-ok" },
      { type: "finish", finish: "stop", usage: { input: 7, output: 4 } },
    ])
    expect(googleSeen).toEqual(["model:gemini-port", "text", "finish"])
    expect(googleRecord.url).toBe("https://google.example/v1beta/models/gemini-port:streamGenerateContent?alt=sse")
    expect(googleRecord.requestHeaders["x-goog-api-key"]).toBe("google-secret")
    expect(googleRecord.requestHeaders["x-request-shape"]).toBe("google-port")
  })

  it("supports OAuth bearer tokens and provider-specific headers", async () => {
    let headers: Record<string, string> | undefined
    const provider = createOpenAICompatibleProvider({
      id: "oauth-provider",
      baseURL: "https://provider.example/v1",
      auth: { type: "oauth", token: "oauth-token" },
      headers: { "x-provider-metadata": "enabled" },
      models: ["oauth-model"],
      async fetch(_url, init) {
        headers = init.headers
        return {
          ok: true,
          status: 200,
          body: byteStream([sse({ choices: [{ delta: {}, finish_reason: "stop" }] })]),
          async text() {
            return ""
          },
        }
      },
    })
    const [model] = provider.models()
    if (!model) throw new Error("expected model")

    await collect(provider.stream({ model, system: [], messages: [], tools: [] }))

    expect(headers).toMatchObject({
      authorization: "Bearer oauth-token",
      "x-provider-metadata": "enabled",
    })
  })

  it("parses Anthropic SSE chunks into provider stream events", async () => {
    const events = await collect(
      parseAnthropicStream(
        streamText([
          anthropicSse("message_start", { message: { usage: { input_tokens: 11 } } }),
          anthropicSse("content_block_start", { index: 0, content_block: { type: "text", text: "" } }),
          anthropicSse("content_block_delta", { index: 0, delta: { type: "text_delta", text: "hello" } }),
          anthropicSse("content_block_start", { index: 1, content_block: { type: "thinking", thinking: "" } }),
          anthropicSse("content_block_delta", { index: 1, delta: { type: "thinking_delta", thinking: "think" } }),
          anthropicSse("content_block_start", { index: 2, content_block: { type: "tool_use", id: "toolu_1", name: "echo", input: {} } }),
          anthropicSse("content_block_delta", { index: 2, delta: { type: "input_json_delta", partial_json: "{\"text\"" } }),
          anthropicSse("content_block_delta", { index: 2, delta: { type: "input_json_delta", partial_json: ":\"hi\"}" } }),
          anthropicSse("content_block_stop", { index: 2 }),
          anthropicSse("message_delta", { delta: { stop_reason: "tool_use" }, usage: { output_tokens: 4 } }),
          anthropicSse("message_stop", {}),
        ]),
      ),
    )

    expect(events).toEqual([
      { type: "text", text: "hello" },
      { type: "reasoning", text: "think" },
      { type: "tool_call", id: "toolu_1", toolName: "echo", input: { text: "hi" } },
      { type: "finish", finish: "tool_use", usage: { input: 11, output: 4 } },
    ])
  })

  it("sends Anthropic messages requests with api key auth, tools, and options", async () => {
    let captured: { url: string; init: { headers: Record<string, string>; body: string } } | undefined
    const provider = createAnthropicProvider({
      id: "test-anthropic",
      baseURL: "https://anthropic.example",
      apiKey: "anthropic-secret",
      models: [{ modelID: "claude-test", maxOutputTokens: 1024 }],
      async fetch(url, init) {
        captured = { url, init }
        return {
          ok: true,
          status: 200,
          body: byteStream([anthropicSse("message_delta", { delta: { stop_reason: "stop" }, usage: { output_tokens: 1 } }), anthropicSse("message_stop", {})]),
          async text() {
            return ""
          },
        }
      },
    })
    const [model] = provider.models()
    if (!model) throw new Error("expected model")

    await collect(
      provider.stream({
        model,
        system: ["system prompt"],
        messages: [createUserMessage({ sessionID: "ses_provider" as never, text: "hello" })],
        tools: [
          {
            name: "echo",
            description: "Echo text.",
            parameters: { type: "object", properties: { text: { type: "string" } } },
            execute() {
              return { content: [{ id: createID("part"), type: "text", text: "" }] }
            },
          },
        ],
        options: { temperature: 0 },
      } satisfies ProviderRequest),
    )

    const body = JSON.parse(captured?.init.body ?? "{}") as Record<string, unknown>
    expect(captured?.url).toBe("https://anthropic.example/v1/messages")
    expect(captured?.init.headers["x-api-key"]).toBe("anthropic-secret")
    expect(captured?.init.headers["anthropic-version"]).toBe("2023-06-01")
    expect(body).toMatchObject({
      model: "claude-test",
      stream: true,
      system: "system prompt",
      max_tokens: 1024,
      temperature: 0,
      messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
      tools: [{ name: "echo", description: "Echo text.", input_schema: { type: "object" } }],
    })
  })

  it("parses Google Gemini SSE chunks into provider stream events", async () => {
    const events = await collect(
      parseGoogleStream(
        streamText([
          sse({ candidates: [{ content: { role: "model", parts: [{ text: "hel" }] } }] }),
          sse({
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [{ text: "lo" }, { functionCall: { id: "fn_1", name: "echo", args: { text: "hi" } } }],
                },
                finishReason: "STOP",
              },
            ],
            usageMetadata: { promptTokenCount: 9, candidatesTokenCount: 4, thoughtsTokenCount: 2, cachedContentTokenCount: 3 },
          }),
        ]),
      ),
    )

    expect(events).toEqual([
      { type: "text", text: "hel" },
      { type: "text", text: "lo" },
      { type: "tool_call", id: "fn_1", toolName: "echo", input: { text: "hi" } },
      { type: "finish", finish: "stop", usage: { input: 9, output: 4, reasoning: 2, cacheRead: 3 } },
    ])
  })

  it("standardizes reasoning, tool-use, finish reason, and usage metadata across provider parsers", async () => {
    const matrix = [
      {
        provider: "openai-compatible",
        events: parseOpenAICompatibleStream(
          streamText([
            sse({ choices: [{ delta: { reasoning: "think" } }] }),
            sse({
              choices: [{ delta: { tool_calls: [{ index: 0, id: "call_o", function: { name: "echo", arguments: "{\"text\":\"hi\"}" } }] }, finish_reason: "tool_calls" }],
              usage: { prompt_tokens: 3, completion_tokens: 2, reasoning_tokens: 1 },
            }),
          ]),
        ),
        expectedFinish: "tool_calls",
        expectedUsage: { input: 3, output: 2, reasoning: 1 },
      },
      {
        provider: "anthropic",
        events: parseAnthropicStream(
          streamText([
            anthropicSse("message_start", { message: { usage: { input_tokens: 4 } } }),
            anthropicSse("content_block_start", { index: 0, content_block: { type: "thinking", thinking: "" } }),
            anthropicSse("content_block_delta", { index: 0, delta: { type: "thinking_delta", thinking: "think" } }),
            anthropicSse("content_block_start", { index: 1, content_block: { type: "tool_use", id: "call_a", name: "echo", input: {} } }),
            anthropicSse("content_block_delta", { index: 1, delta: { type: "input_json_delta", partial_json: "{\"text\":\"hi\"}" } }),
            anthropicSse("content_block_stop", { index: 1 }),
            anthropicSse("message_delta", { delta: { stop_reason: "tool_use" }, usage: { output_tokens: 2 } }),
            anthropicSse("message_stop", {}),
          ]),
        ),
        expectedFinish: "tool_use",
        expectedUsage: { input: 4, output: 2 },
      },
      {
        provider: "google",
        events: parseGoogleStream(
          streamText([
            sse({
              candidates: [
                {
                  content: { role: "model", parts: [{ thought: true, text: "think" }, { functionCall: { id: "call_g", name: "echo", args: { text: "hi" } } }] },
                  finishReason: "STOP",
                },
              ],
              usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 2, thoughtsTokenCount: 1 },
            }),
          ]),
        ),
        expectedFinish: "stop",
        expectedUsage: { input: 5, output: 2, reasoning: 1 },
      },
    ] as const

    for (const row of matrix) {
      const events = await collect(row.events)
      expect(events, row.provider).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "reasoning", text: "think" }),
          expect.objectContaining({ type: "tool_call", toolName: "echo", input: { text: "hi" } }),
          expect.objectContaining({ type: "finish", finish: row.expectedFinish, usage: row.expectedUsage }),
        ]),
      )
    }

    const normalized = createProviderUsageNormalizer().normalize({
      finish: "stop",
      usage: { input: 1000, output: 500, cacheRead: 250 },
      model: { providerID: "priced", modelID: "priced-model", cost: { input: 2, output: 4, cacheRead: 0.5 } },
    })
    expect(normalized).toEqual({ finish: "stop", usage: { input: 1000, output: 500, cacheRead: 250 }, cost: 0.004125 })
  })

  it("sends Google Gemini streamGenerateContent requests with api key auth, tools, and generation config", async () => {
    let captured: { url: string; init: { headers: Record<string, string>; body: string } } | undefined
    const provider = createGoogleProvider({
      apiKey: "google-secret",
      models: [{ modelID: "gemini-test", maxOutputTokens: 256 }],
      async fetch(url, init) {
        captured = { url, init }
        return {
          ok: true,
          status: 200,
          body: byteStream([
            sse({
              candidates: [{ content: { role: "model", parts: [{ text: "ok" }] }, finishReason: "STOP" }],
              usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 1 },
            }),
          ]),
          async text() {
            return ""
          },
        }
      },
    })
    const [model] = provider.models()
    if (!model) throw new Error("expected model")

    const events = await collect(
      provider.stream({
        model,
        system: ["system prompt"],
        messages: [createUserMessage({ sessionID: "ses_provider" as never, text: "hello" })],
        tools: [
          {
            name: "echo",
            description: "Echo text.",
            parameters: { type: "object", properties: { text: { type: "string" } } },
            execute() {
              return { content: [{ id: createID("part"), type: "text", text: "" }] }
            },
          },
        ],
        options: { temperature: 0 },
      } satisfies ProviderRequest),
    )

    const body = JSON.parse(captured?.init.body ?? "{}") as Record<string, unknown>
    expect(captured?.url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-test:streamGenerateContent?alt=sse")
    expect(captured?.init.headers["x-goog-api-key"]).toBe("google-secret")
    expect(body).toMatchObject({
      contents: [{ role: "user", parts: [{ text: "hello" }] }],
      systemInstruction: { parts: [{ text: "system prompt" }] },
      tools: [{ functionDeclarations: [{ name: "echo", description: "Echo text." }] }],
      generationConfig: { maxOutputTokens: 256, temperature: 0 },
    })
    expect(events).toEqual([{ type: "text", text: "ok" }, { type: "finish", finish: "stop", usage: { input: 2, output: 1 } }])
  })

  it("creates an OpenRouter preset on top of the OpenAI-compatible adapter", async () => {
    let captured: { url: string; headers: Record<string, string>; body: string } | undefined
    const provider = createOpenRouterProvider({
      apiKey: "openrouter-secret",
      siteURL: "https://helix.test",
      appName: "Helix",
      models: ["openrouter/test-model"],
      transport: {
        async fetch(url, init) {
          captured = { url, headers: init.headers, body: init.body }
          return {
            ok: true,
            status: 200,
            body: byteStream([sse({ choices: [{ delta: { content: "ok" }, finish_reason: "stop" }] })]),
            async text() {
              return ""
            },
          }
        },
      },
    })
    const [model] = provider.models()
    if (!model) throw new Error("expected model")

    const events = await collect(provider.stream({ model, system: [], messages: [], tools: [] }))
    const body = JSON.parse(captured?.body ?? "{}") as Record<string, unknown>

    expect(captured).toMatchObject({
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: {
        authorization: "Bearer openrouter-secret",
        "http-referer": "https://helix.test",
        "x-title": "Helix",
      },
    })
    expect(body).toMatchObject({ model: "openrouter/test-model", stream: true })
    expect(events).toEqual([{ type: "text", text: "ok" }, { type: "finish", finish: "stop" }])
  })
})

function openCodeProviderPackageRuntimeSourceFixture(
  sourceID: OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback["sourceID"],
  fixture: {
    evidenceRef: string
    replayRef: string
    fixtureID: string
    exactDiffStatus: "native-exact"
    nativeParityClaim: true
    knownLossiness: []
    cases: Array<{ id: string }>
    sourceRefs: string[]
  },
): OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback {
  return {
    sourceID,
    evidenceRef: fixture.evidenceRef,
    replayRef: fixture.replayRef,
    fixtureID: fixture.fixtureID,
    exactDiffStatus: fixture.exactDiffStatus,
    nativeParityClaim: fixture.nativeParityClaim,
    knownLossiness: [] as [],
    caseIDs: fixture.cases.map((item) => item.id).sort(),
    sourceRefCount: fixture.sourceRefs.length,
  }
}

async function* stream(events: ProviderStreamEvent[]): AsyncIterable<ProviderStreamEvent> {
  for (const event of events) yield event
}

async function collect(events: AsyncIterable<ProviderStreamEvent>): Promise<ProviderStreamEvent[]> {
  const output: ProviderStreamEvent[] = []
  for await (const event of events) output.push(event)
  return output
}

async function* streamText(chunks: string[]): AsyncIterable<string> {
  for (const chunk of chunks) yield chunk
}

async function* byteStream(chunks: string[]): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder()
  for (const chunk of chunks) yield encoder.encode(chunk)
}

function sse(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`
}

function anthropicSse(event: string, payload: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`
}
