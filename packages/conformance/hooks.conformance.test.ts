import { describe, expect, it } from "vitest"
import { createID } from "@helix/contracts"
import {
  buildHermesAgentHookSourceMatrixSnapshot,
  buildHookPluginLifecycleExactDiffBlockerSnapshot,
  buildHookPluginLifecyclePinnedReplaySnapshot,
  buildHookPluginLifecycleReplayGateSnapshot,
  buildNanobotHookSourceMatrixSnapshot,
  buildOpenCodeHookSourceMatrixSnapshot,
  buildPiMonoHookSourceMatrixSnapshot,
  captureOpenCodeHookLiveRuntimeFixture,
  LegoHookHost,
  projectOpenCodeHookRuntimeProjection,
  verifyOpenCodeHookLiveRuntimeFixture,
  verifyHookPluginLifecycleExactDiffBlockerSnapshot,
  verifyHookPluginLifecyclePinnedReplaySnapshot,
  verifyHookPluginLifecycleReplayGateSnapshot,
} from "@helix/lego-hooks"
import {
  buildHookHostPublicSurfaceGuardSnapshot,
  createCollectAndContinueHookErrorPolicy,
  createHookCleanupScope,
  createHookEventBus,
  createHookHandlerChain,
  createHookObserverChain,
  createHookRegistryAtoms,
  createParallelHookScheduler,
  createSerialHookScheduler,
  createSourceOrderedHookScheduler,
  verifyHookHostPublicSurfaceGuardSnapshot,
} from "@helix/lego-hooks/hook-atoms"
import {
  captureOpenCodeFileWatcherNativeExactFixture,
  loadOpenCodePlugin,
  verifyOpenCodeFileWatcherNativeExactFixture,
} from "@helix/adapters-opencode"
import {
  captureOpenCodePluginNpmInstallNativeExactFixture,
  captureOpenCodePluginPackageCompatibilityNativeExactFixture,
  captureOpenCodePluginRuntimeImportNativeExactFixture,
  verifyOpenCodePluginNpmInstallNativeExactFixture,
  verifyOpenCodePluginPackageCompatibilityNativeExactFixture,
  verifyOpenCodePluginRuntimeImportNativeExactFixture,
} from "@helix/adapters-opencode/plugin-loader"
import {
  captureOpenCodeCommandRegistryNativeExactFixture,
  verifyOpenCodeCommandRegistryNativeExactFixture,
} from "@helix/adapters-opencode/opencode-command-registry"
import {
  captureOpenCodeHookErrorDefaultsNativeExactFixture,
  verifyOpenCodeHookErrorDefaultsNativeExactFixture,
} from "@helix/adapters-opencode/opencode-hook-error-defaults"
import {
  captureOpenCodeHookHandlerNativeExactFixture,
  verifyOpenCodeHookHandlerNativeExactFixture,
} from "@helix/adapters-opencode/opencode-hook-handler"
import {
  captureOpenCodeHookObserverNativeExactFixture,
  verifyOpenCodeHookObserverNativeExactFixture,
} from "@helix/adapters-opencode/opencode-hook-observer"
import {
  captureOpenCodeHookPluginBridgeNativeExactFixture,
  createOpenCodeHookPluginBridge,
  verifyOpenCodeHookPluginBridgeNativeExactFixture,
} from "@helix/adapters-opencode/opencode-hook-plugin-bridge"
import {
  captureOpenCodeHookSchedulerNativeExactFixture,
  verifyOpenCodeHookSchedulerNativeExactFixture,
} from "@helix/adapters-opencode/opencode-hook-scheduler"
import {
  captureOpenCodePluginLoaderNativeExactFixture,
  verifyOpenCodePluginLoaderNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-loader"
import {
  captureOpenCodePluginHotReloadCleanupNativeExactFixture,
  captureOpenCodePluginHotReloadMetaNativeExactFixture,
  verifyOpenCodePluginHotReloadCleanupNativeExactFixture,
  verifyOpenCodePluginHotReloadMetaNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-hot-reload-cleanup"
import {
  captureOpenCodePluginProviderRegistryNativeExactFixture,
  verifyOpenCodePluginProviderRegistryNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-provider-registry"
import {
  captureOpenCodePluginToolRegistryNativeExactFixture,
  verifyOpenCodePluginToolRegistryNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-tool-registry"
import {
  captureOpenCodePluginUIRegistryNativeExactFixture,
  createOpenCodePluginUIRegistryBridge,
  verifyOpenCodePluginUIRegistryNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-ui-registry"
import {
  captureOpenCodePluginV2DefinitionNativeExactFixture,
  verifyOpenCodePluginV2DefinitionNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-v2-definition"
import { loadPiExtension } from "@helix/adapters-pi"

describe("LegoHookHost conformance", () => {
  it("anchors OpenCode hook and plugin bridges to pinned upstream plugin sources", () => {
    const snapshot = buildOpenCodeHookSourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-hook-source-matrix",
      fixtureID: "opencode-hook:source-matrix",
      nativeExactBranchIDs: [
        "plugin-v2-definition",
        "plugin-boot-loader",
        "hook-handler-chain",
        "hook-observer-chain",
        "hook-scheduler-error-policy",
        "plugin-event-mapper",
        "plugin-hot-reload-cleanup",
        "command-registry",
        "provider-registry",
        "tool-registry",
        "ui-registry",
        "exact-hook-event-timing",
      ],
      partialBranchIDs: expect.arrayContaining([
        "live-plugin-runtime",
        "hot-reload-side-effects",
      ]),
      missingBranchIDs: [],
      coveredHookAtomIDs: expect.arrayContaining([
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
      ]),
      coveredHookPortIDs: expect.arrayContaining([
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
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-hook-lifecycle-native-exact-fixture",
        "hook-lifecycle-native-exact:opencode",
        "opencode-hook-handler:native-exact-fixture",
        "hook-handler-native-exact:opencode",
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-hook:source-matrix",
        "opencode-hook-lifecycle:native-exact-fixture",
        "opencode-hook-handler:native-exact-fixture",
        "opencode-plugin-event-mapper:native-exact-fixture",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-hook-source-matrix-covered-by-partial-fixture",
        "opencode-real-npm-arborist-reify-not-replayed",
        "opencode-file-watcher-native-binding-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.partialBranchIDs).toEqual([
      "live-plugin-runtime",
      "hot-reload-side-effects",
    ])
    expect(snapshot.partialBranchIDs).not.toEqual(expect.arrayContaining([
      "hook-handler-chain",
      "hook-observer-chain",
      "hook-scheduler-error-policy",
      "plugin-event-mapper",
      "plugin-boot-loader",
      "plugin-hot-reload-cleanup",
      "command-registry",
      "provider-registry",
      "tool-registry",
      "ui-registry",
      "plugin-v2-definition",
      "exact-hook-event-timing",
    ]))
    for (const branchID of snapshot.nativeExactBranchIDs) {
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === branchID)).toMatchObject({
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        knownGaps: [],
      })
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === branchID)?.fixtureIDs.length).toBeGreaterThan(0)
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === branchID)?.nativeEvidenceRefs).toEqual(
        expect.arrayContaining(snapshot.branchAnchors.find((anchor) => anchor.branchID === branchID)?.fixtureIDs ?? []),
      )
    }
    for (const branchID of snapshot.partialBranchIDs) {
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === branchID)).toMatchObject({
        status: "partial",
        exactDiffStatus: "exact-diff-partial",
        nativeParityClaim: false,
        nativeEvidenceRefs: [],
        fixtureIDs: [],
      })
    }
    expect(snapshot.nativeEvidenceRefs).not.toContain("opencode-plugin-runtime-import:native-exact-fixture")
    expect(snapshot.fixtureIDs).not.toContain("opencode-plugin-runtime-import:native-exact-fixture")
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "plugin-core",
        path: "packages/core/src/plugin.ts",
        symbols: expect.arrayContaining(["PluginV2", "Hooks", "HookFunctions", "define"]),
      }),
      expect.objectContaining({
        id: "plugin-boot",
        path: "packages/core/src/plugin/boot.ts",
        symbols: expect.arrayContaining(["PluginBoot", "Service", "Interface"]),
      }),
      expect.objectContaining({
        id: "plugin-provider",
        path: "packages/core/src/plugin/provider.ts",
        symbols: expect.arrayContaining(["ProviderPlugins"]),
      }),
      expect.objectContaining({
        id: "local-hook-runtime-projection",
        path: "packages/lego-hooks/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["projectOpenCodeHookRuntimeProjection", "OpenCodeHookRuntimeProjection"]),
      }),
      expect.objectContaining({
        id: "local-hook-live-runtime-fixture",
        path: "packages/lego-hooks/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["captureOpenCodeHookLiveRuntimeFixture", "verifyOpenCodeHookLiveRuntimeFixture", "OpenCodeHookLiveRuntimeFixture"]),
      }),
      expect.objectContaining({
        id: "local-hook-handler",
        path: "packages/adapters-opencode/src/opencode-hook-handler.ts",
        symbols: expect.arrayContaining(["createOpenCodeHookHandler", "captureOpenCodeHookHandlerNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-hook-observer",
        path: "packages/adapters-opencode/src/opencode-hook-observer.ts",
        symbols: expect.arrayContaining(["createOpenCodeHookObserver", "captureOpenCodeHookObserverNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-hook-scheduler",
        path: "packages/adapters-opencode/src/opencode-hook-scheduler.ts",
        symbols: expect.arrayContaining(["createOpenCodeHookScheduler", "captureOpenCodeHookSchedulerNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-hook-error-defaults",
        path: "packages/adapters-opencode/src/opencode-hook-error-defaults.ts",
        symbols: expect.arrayContaining(["createOpenCodeHookErrorDefaults", "captureOpenCodeHookErrorDefaultsNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-file-watcher",
        path: "packages/adapters-opencode/src/opencode-file-watcher.ts",
        symbols: expect.arrayContaining(["createOpenCodeFileWatcherPlan", "createOpenCodeFileWatcherNativeSubscribeRuntime", "captureOpenCodeFileWatcherNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-command-registry",
        path: "packages/adapters-opencode/src/opencode-command-registry.ts",
        symbols: expect.arrayContaining(["createOpenCodeCommandRegistryBridge", "captureOpenCodeCommandRegistryNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-plugin-event-mapper",
        path: "packages/adapters-opencode/src/opencode-plugin-event-mapper.ts",
        symbols: expect.arrayContaining(["createOpenCodeNativePluginEventMapper", "captureOpenCodePluginEventMapperNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-plugin-loader",
        path: "packages/adapters-opencode/src/opencode-plugin-loader.ts",
        symbols: expect.arrayContaining(["createOpenCodeNativePluginLoaderAtom", "captureOpenCodePluginLoaderNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-plugin-hot-reload-cleanup",
        path: "packages/adapters-opencode/src/opencode-plugin-hot-reload-cleanup.ts",
        symbols: expect.arrayContaining(["createOpenCodePluginHotReloadCleanup", "createOpenCodePluginHotReloadMetadata", "captureOpenCodePluginHotReloadCleanupNativeExactFixture", "captureOpenCodePluginHotReloadMetaNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-plugin-provider-registry",
        path: "packages/adapters-opencode/src/opencode-plugin-provider-registry.ts",
        symbols: expect.arrayContaining(["createOpenCodePluginProviderRegistryBridge", "captureOpenCodePluginProviderRegistryNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-plugin-tool-registry",
        path: "packages/adapters-opencode/src/opencode-plugin-tool-registry.ts",
        symbols: expect.arrayContaining(["createOpenCodePluginToolRegistryBridge", "captureOpenCodePluginToolRegistryNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-plugin-ui-registry",
        path: "packages/adapters-opencode/src/opencode-plugin-ui-registry.ts",
        symbols: expect.arrayContaining(["createOpenCodePluginUIRegistryBridge", "captureOpenCodePluginUIRegistryNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-plugin-v2-definition",
        path: "packages/adapters-opencode/src/opencode-plugin-v2-definition.ts",
        symbols: expect.arrayContaining(["defineOpenCodePluginV2", "captureOpenCodePluginV2DefinitionNativeExactFixture"]),
      }),
      expect.objectContaining({
        id: "local-plugin-spec-loader",
        path: "packages/adapters-opencode/src/plugin-loader.ts",
        symbols: expect.arrayContaining(["loadOpenCodePlugins", "captureOpenCodePluginRuntimeImportNativeExactFixture", "captureOpenCodePluginNpmInstallNativeExactFixture"]),
      }),
    ]))
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "plugin-v2-definition")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["plugin-core", "local-plugin-v2-definition"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-plugin-v2-definition:native-exact-fixture",
        "plugin-v2-definition-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["PluginV2", "define", "Service.add", "Service.triggerFor", "draft output finish"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "hook-handler-chain")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["local-hook-handler", "local-plugin-event-mapper"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-hook-handler:native-exact-fixture",
        "hook-handler-native-exact:opencode",
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["Plugin.trigger", "mutable output reference", "source-order output mutation"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "hook-observer-chain")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["local-hook-observer", "local-plugin-event-mapper"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-hook-observer:native-exact-fixture",
        "hook-observer-native-exact:opencode",
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["bus.subscribeAll", "hook.event", "source order", "fire-and-forget observer"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "hook-scheduler-error-policy")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["local-hook-scheduler", "local-hook-error-defaults"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-hook-scheduler:native-exact-fixture",
        "hook-scheduler-native-exact:opencode",
        "opencode-hook-error-defaults:native-exact-fixture",
        "hook-error-defaults-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["Plugin.trigger", "Plugin.list", "empty-name noop", "fail-fast observer error"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "plugin-event-mapper")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["local-plugin-event-mapper"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["event-observer-and-tool-before", "provider-request-params-and-headers", "delegated-hook-bridges"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "plugin-boot-loader")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["local-plugin-loader", "local-plugin-hot-reload-cleanup"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-plugin-loader:native-exact-fixture",
        "plugin-loader-native-exact:opencode",
        "opencode-hook-plugin-bridge:native-exact-fixture",
        "hook-plugin-bridge-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["PluginBoot", "createOpenCodePluginLoaderAtom", "config hook registration order"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "plugin-hot-reload-cleanup")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["local-plugin-hot-reload-cleanup"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
        "plugin-hot-reload-cleanup-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["replacement-disposes-existing-before-track", "scope-dispose-removes-tracked-source"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "command-registry")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["local-command-registry"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-command-registry:native-exact-fixture",
        "command-registry-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["command.execute.before", "source-order-shared-output", "cleanup-removes-hook"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "provider-registry")).toMatchObject({
      status: "native-exact",
      hookAtomIDs: ["opencode.registry.provider-plugin", "opencode.plugin.provider-registry-bridge"],
      hookPortIDs: ["registry.provider"],
      sourceRefIDs: expect.arrayContaining(["local-plugin-provider-registry"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-plugin-provider-registry:native-exact-fixture",
        "plugin-provider-registry-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["ProviderPlugins", "auth-record-from-plugin-list", "provider-model-hook-filter"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "tool-registry")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["local-plugin-tool-registry"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-plugin-tool-registry:native-exact-fixture",
        "plugin-tool-registry-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["hooks.tool", "source-scoped-tool-registration", "definition-reference-retained"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "ui-registry")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["local-plugin-ui-registry"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-plugin-ui-registry:native-exact-fixture",
        "plugin-ui-registry-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["hooks.ui", "source-scoped-ui-registration", "provider-reference-retained"]),
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "live-plugin-runtime")).toMatchObject({
      status: "partial",
      hookAtomIDs: ["opencode.plugin.loader", "opencode.hook.plugin-bridge"],
      sourceRefIDs: expect.arrayContaining(["local-plugin-spec-loader", "local-hook-runtime-projection", "local-hook-live-runtime-fixture"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-hook:runtime-projection",
        "opencode-hook:live-runtime-fixture",
        "opencode-plugin-runtime-import:native-exact-fixture",
        "plugin-runtime-import-native-exact:opencode",
        "opencode-plugin-npm-install:native-exact-fixture",
        "plugin-npm-install-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["plugin-runtime:projected", "module import side effects native", "default/plugin/opencode export priority", "loadExternal parallel retry native", "package target and compatibility native", "npm add cache/reify plan native", "real arborist reify:not-replayed"]),
      knownGaps: expect.arrayContaining(["opencode-hook-live-runtime-fixture-partial-native-gap", "opencode-real-npm-arborist-reify-not-replayed"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "hot-reload-side-effects")).toMatchObject({
      status: "partial",
      sourceRefIDs: expect.arrayContaining(["local-file-watcher", "local-hook-runtime-projection", "local-hook-live-runtime-fixture"]),
      localEvidenceRefs: expect.arrayContaining(["opencode-hook:runtime-projection", "opencode-hook:live-runtime-fixture", "opencode-plugin-hot-reload-meta:native-exact-fixture", "plugin-hot-reload-meta-native-exact:opencode", "opencode-file-watcher:native-exact-fixture", "file-watcher-native-exact:opencode"]),
      localMarkers: expect.arrayContaining(["hot-reload:projected", "plugin-meta file/npm fingerprint native", "plugin-meta load-count/theme native", "file-watcher event mapping native", "git HEAD watch native", "watcher subscribe callback native", "watcher subscribe timeout cleanup native", "parcel-native-binding:not-replayed"]),
      knownGaps: expect.arrayContaining(["opencode-hook-live-runtime-fixture-partial-native-gap", "opencode-file-watcher-native-binding-not-replayed"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "exact-hook-event-timing")).toMatchObject({
      status: "native-exact",
      sourceRefIDs: expect.arrayContaining(["local-hook-handler", "local-hook-scheduler", "local-hook-observer", "local-plugin-event-mapper"]),
      localEvidenceRefs: expect.arrayContaining(["opencode-hook-handler:native-exact-fixture", "hook-handler-native-exact:opencode", "opencode-hook-scheduler:native-exact-fixture", "hook-scheduler-native-exact:opencode", "opencode-hook-observer:native-exact-fixture", "hook-observer-native-exact:opencode", "opencode-plugin-event-mapper:native-exact-fixture", "plugin-event-mapper-native-exact:opencode"]),
      localMarkers: expect.arrayContaining(["hook-timing native", "source-order-await native", "event fire-and-forget native", "async-interleaving native", "timer await wall-clock native"]),
      knownGaps: [],
    })
  })

  it("projects OpenCode hook runtime signals into a lossy partial fixture", () => {
    const projection = projectOpenCodeHookRuntimeProjection([
      {
        type: "plugin.runtime",
        pluginID: "plugin-a",
        sourceKind: "project",
        hookNames: ["tool.execute.before", "tool.execute.after", "tool.execute.before"],
        registryKeys: ["tool:search", "provider:local", "tool:search"],
        sequence: 2,
      },
      {
        type: "hot.reload",
        pluginID: "plugin-a",
        operation: "replace",
        cleanupKeys: ["watcher", "registry", "watcher"],
        registryKeys: ["tool:search", "ui:panel"],
        sequence: 3,
      },
      {
        type: "hook.timing",
        eventName: "tool.execute.before",
        phase: "handler",
        sourceID: "plugin-a",
        order: 1,
        asyncBoundaryObserved: true,
        sequence: 1,
      },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-hook:runtime-projection",
      evidenceRef: "conformance:opencode-hook-runtime-projection",
      coveredBranchIDs: [
        "live-plugin-runtime",
        "hot-reload-side-effects",
        "exact-hook-event-timing",
      ],
      retainedFields: expect.arrayContaining([
        "pluginID",
        "sourceKind",
        "hookNames",
        "registryKeys",
        "operation",
        "cleanupKeys",
        "eventName",
        "phase",
        "sourceID",
        "order",
        "asyncBoundaryObserved",
        "sequence",
      ]),
      lossyFields: expect.arrayContaining([
        "real @npmcli/arborist reify execution",
        "real @parcel/watcher native binding execution",
        "module cache invalidation ordering",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-real-npm-arborist-reify-not-replayed",
        "opencode-file-watcher-native-binding-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(projection.hookEventTiming).toEqual([
      { eventName: "tool.execute.before", phase: "handler", sourceID: "plugin-a", order: 1, asyncBoundaryObserved: true, sequence: 1 },
    ])
    expect(projection.pluginRuntime).toEqual([
      {
        pluginID: "plugin-a",
        sourceKind: "project",
        hookNames: ["tool.execute.after", "tool.execute.before"],
        registryKeys: ["provider:local", "tool:search"],
        sequence: 2,
      },
    ])
    expect(projection.hotReloadSideEffects).toEqual([
      {
        pluginID: "plugin-a",
        operation: "replace",
        cleanupKeys: ["registry", "watcher"],
        registryKeys: ["tool:search", "ui:panel"],
        sequence: 3,
      },
    ])
  })

  it("captures OpenCode hook live runtime readback without claiming native parity", () => {
    const fixture = captureOpenCodeHookLiveRuntimeFixture({
      pluginID: "plugin-a",
      sourceID: "plugin-a.ts",
    })

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-hook-live-runtime-fixture",
      fixtureID: "opencode-hook:live-runtime-fixture",
      exactDiffStatus: "live-runtime-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      fixtureDiffTarget: "hook.plugin-lifecycle-replay",
      relatedFixtureDiffTargets: expect.arrayContaining(["tool.contract-envelope-replay", "provider.raw-frame-replay"]),
      coveredBranchIDs: expect.arrayContaining([
        "hook-handler-chain",
        "hook-observer-chain",
        "hook-scheduler-error-policy",
        "plugin-event-mapper",
        "plugin-hot-reload-cleanup",
        "command-registry",
        "provider-registry",
        "tool-registry",
        "ui-registry",
        "live-plugin-runtime",
        "hot-reload-side-effects",
        "exact-hook-event-timing",
      ]),
      retainedFields: expect.arrayContaining([
        "plugin source and module export readback",
        "source ordered hook timing readback",
        "hot reload generation and watcher readback",
        "command/provider/tool/ui registry entry key readback",
        "cleanup scope and dispose order marker",
      ]),
      lossyFields: expect.arrayContaining([
        "real @npmcli/arborist reify execution",
        "real @parcel/watcher native binding execution",
        "native registry mutation object identity",
        "native plugin dispose/reload race ordering",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-hook-live-runtime-fixture-partial-native-gap",
        "opencode-real-npm-arborist-reify-not-replayed",
        "opencode-file-watcher-native-binding-not-replayed",
        "opencode-plugin-registry-object-identity-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.pluginRuntimeReadback).toEqual([
      expect.objectContaining({
        pluginID: "plugin-a",
        sourceID: "plugin-a.ts",
        sourceKind: "project",
        moduleExportKeys: ["default", "plugin"],
        hookNames: expect.arrayContaining(["tool.execute.before"]),
        registryKeys: expect.arrayContaining(["provider:fixture-provider", "tool:fixture.tool"]),
        moduleEvaluationHash: expect.stringMatching(/^[a-f0-9]{16}$/),
      }),
    ])
    expect(fixture.hookTimingReadback).toEqual([
      expect.objectContaining({
        eventName: "tool.execute.before",
        phase: "handler",
        sourceID: "plugin-a",
        order: 2,
        asyncBoundaryMarker: "source-order-await",
        payloadKeys: expect.arrayContaining(["args"]),
        beforePayloadHash: expect.stringMatching(/^[a-f0-9]{16}$/),
        afterPayloadHash: expect.stringMatching(/^[a-f0-9]{16}$/),
      }),
    ])
    expect(fixture.hotReloadReadback).toEqual([
      expect.objectContaining({
        pluginID: "plugin-a",
        operation: "replace",
        generationBefore: 4,
        generationAfter: 5,
        cleanupKeys: expect.arrayContaining(["hook.bus", "watcher"]),
        invalidatedCacheKeys: expect.arrayContaining(["plugin-a", "plugin-a.ts"]),
        watcherEventID: "watch_evt_hook_001",
      }),
    ])
    expect(fixture.registryReadback.map((record) => record.registryKind).sort()).toEqual(["command", "provider", "tool", "ui"])
    expect(fixture.cleanupReadback).toEqual([
      expect.objectContaining({
        scopeID: "scope_project_plugin_fixture",
        pluginID: "plugin-a",
        cleanupKeys: expect.arrayContaining(["hook.bus", "watcher"]),
        disposeOrder: 8,
        reloadGeneration: 5,
      }),
    ])
    expect(fixture.hookRuntimeProjection.fixtureID).toBe("opencode-hook:runtime-projection")
    expect(verifyOpenCodeHookLiveRuntimeFixture(fixture)).toEqual({ ok: true, issues: [] })

    const nativeClaim = {
      ...fixture,
      nativeParityClaim: true as false,
    }
    expect(verifyOpenCodeHookLiveRuntimeFixture(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-hook-live-runtime.native-claim" }),
    ]))

    const missingPluginReadback = {
      ...fixture,
      pluginRuntimeReadback: [],
    }
    expect(verifyOpenCodeHookLiveRuntimeFixture(missingPluginReadback).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-hook-live-runtime.plugin-runtime-readback" }),
    ]))

    const missingRegistry = {
      ...fixture,
      registryReadback: fixture.registryReadback.filter((record) => record.registryKind !== "ui"),
    }
    expect(verifyOpenCodeHookLiveRuntimeFixture(missingRegistry).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-hook-live-runtime.registry-readback" }),
    ]))

    const missingNativeGap = {
      ...fixture,
      knownGaps: fixture.knownGaps.filter((gap) => gap !== "opencode-hook-live-runtime-fixture-partial-native-gap"),
    }
    expect(verifyOpenCodeHookLiveRuntimeFixture(missingNativeGap).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-hook-live-runtime.native-gaps" }),
    ]))
  })

  it("guards shared hook host public surfaces as partial lifecycle evidence", () => {
    const snapshot = buildHookHostPublicSurfaceGuardSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:hook-host-public-surface-guard",
      fixtureID: "hook:host-public-surface-guard",
      fixtureDiffTarget: "hook.plugin-lifecycle-replay",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      surfaceRefs: expect.arrayContaining([
        expect.objectContaining({
          surfaceID: "hook.bus",
          exportedSymbols: expect.arrayContaining(["createHookEventBus", "HookBusPort"]),
          exposure: "common-host-partial-surface",
          nativeParityClaim: false,
          lifecycleDimensions: expect.arrayContaining(["hook-order", "failure-path"]),
          productRuntimeBlockers: expect.arrayContaining(["product-native-hook-event-timing:not-proven"]),
          knownLossiness: expect.arrayContaining(["hook-host-bus-product-runtime-not-spawned"]),
        }),
        expect.objectContaining({
          surfaceID: "hook.scheduler",
          exportedSymbols: expect.arrayContaining(["createSourceOrderedHookScheduler", "createParallelHookScheduler"]),
          lifecycleDimensions: expect.arrayContaining(["hook-order"]),
          knownLossiness: expect.arrayContaining(["hook-host-scheduler-wall-clock-not-proven"]),
        }),
        expect.objectContaining({
          surfaceID: "hook.cleanup-scope",
          lifecycleDimensions: expect.arrayContaining(["cleanup-side-effects"]),
          productRuntimeBlockers: expect.arrayContaining(["product-native-hot-reload-cleanup:not-proven"]),
        }),
        expect.objectContaining({
          surfaceID: "hook.registry-atoms",
          lifecycleDimensions: expect.arrayContaining(["registry-state"]),
          knownLossiness: expect.arrayContaining(["hook-host-registry-state-common-only"]),
        }),
        expect.objectContaining({
          surfaceID: "tool.registry",
          productRuntimeBlockers: expect.arrayContaining(["product-native-tool-registry-loader:not-proven"]),
        }),
      ]),
      nativeBlockers: expect.arrayContaining([
        "product-native-plugin-loader-runtime:not-proven",
        "product-native-hook-wall-clock-timing:not-proven",
        "product-native-registry-side-effects:not-proven",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verifyHookHostPublicSurfaceGuardSnapshot(snapshot)).toEqual({ ok: true, issues: [] })

    const nativeClaim = {
      ...snapshot,
      nativeParityClaim: true as false,
    }
    expect(verifyHookHostPublicSurfaceGuardSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "hook-host-public-surface.native-claim" }),
    ]))

    const missingHandler = {
      ...snapshot,
      surfaceRefs: snapshot.surfaceRefs.filter((ref) => ref.surfaceID !== "hook.handler-chain"),
    }
    expect(verifyHookHostPublicSurfaceGuardSnapshot(missingHandler).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-host-public-surface.missing-surface",
        surfaceID: "hook.handler-chain",
      }),
    ]))

    const schedulerLossinessDrop = {
      ...snapshot,
      surfaceRefs: snapshot.surfaceRefs.map((ref) =>
        ref.surfaceID === "hook.scheduler"
          ? { ...ref, knownLossiness: [] }
          : ref,
      ),
    }
    expect(verifyHookHostPublicSurfaceGuardSnapshot(schedulerLossinessDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-host-public-surface.lossiness",
        surfaceID: "hook.scheduler",
      }),
    ]))

    const registryBlockerDrop = {
      ...snapshot,
      surfaceRefs: snapshot.surfaceRefs.map((ref) =>
        ref.surfaceID === "hook.registry-atoms"
          ? { ...ref, productRuntimeBlockers: [] }
          : ref,
      ),
    }
    expect(verifyHookHostPublicSurfaceGuardSnapshot(registryBlockerDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-host-public-surface.product-runtime-blockers",
        surfaceID: "hook.registry-atoms",
      }),
    ]))

    const misleadingSummary = {
      ...snapshot,
      summary: "lego-hooks public host atoms are native parity complete",
    }
    expect(verifyHookHostPublicSurfaceGuardSnapshot(misleadingSummary).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "hook-host-public-surface.summary" }),
    ]))
  })

  it("proves OpenCode hook plugin bridge as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeHookPluginBridgeNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.hook.plugin-bridge",
      portID: "hook.bus",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-hook-plugin-bridge-native-exact-fixture",
      replayRef: "hook-plugin-bridge-native-exact:opencode",
      fixtureID: "opencode-hook-plugin-bridge:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/plugin/index.ts"),
      expect.stringContaining("packages/plugin/src/index.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "init-load-config-list-order",
      "trigger-source-order-output-mutation",
      "trigger-error-fail-fast",
      "event-fire-and-forget",
    ])
    expect(verifyOpenCodeHookPluginBridgeNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeHookPluginBridge()
    const hooks = await bridge.init({
      pluginInput: { directory: "/probe" },
      plugins: [
        {
          plugin: () => ({
            "chat.message": (_input, output) => {
              output["seen"] = true
            },
          }),
        },
      ],
    })
    const output = { seen: false }
    await expect(bridge.trigger("chat.message", { sessionID: "ses_probe" }, output)).resolves.toBe(output)
    expect(output).toEqual({ seen: true })
    expect(bridge.list()).toBe(hooks)
    expect(verifyOpenCodeHookPluginBridgeNativeExactFixture({ ...fixture, knownLossiness: ["partial-plugin-service"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-hook-plugin-bridge.lossiness" }),
    ]))
  })

  it("proves OpenCode hook handler, observer, scheduler, and error defaults as native exact modules", async () => {
    const handler = await captureOpenCodeHookHandlerNativeExactFixture()
    const observer = await captureOpenCodeHookObserverNativeExactFixture()
    const scheduler = await captureOpenCodeHookSchedulerNativeExactFixture()
    const errorDefaults = await captureOpenCodeHookErrorDefaultsNativeExactFixture()

    expect(handler).toMatchObject({
      atomID: "opencode.hook.handler-adapter",
      portID: "hook.handler-chain",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(handler.cases.map((item) => item.id)).toEqual([
      "mutable-output-source-order",
      "falsey-handler-skip",
      "fail-fast-handler-error",
    ])
    expect(verifyOpenCodeHookHandlerNativeExactFixture(handler)).toEqual({ ok: true, issues: [] })

    expect(observer).toMatchObject({
      atomID: "opencode.hook.observer-adapter",
      portID: "hook.observer-chain",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(observer.cases.map((item) => item.id)).toEqual([
      "source-order-fire-and-forget",
      "nullish-observer-skip",
      "truthy-non-function-error",
    ])
    expect(verifyOpenCodeHookObserverNativeExactFixture(observer)).toEqual({ ok: true, issues: [] })

    expect(scheduler).toMatchObject({
      atomID: "opencode.hook.scheduler-defaults",
      portID: "hook.scheduler",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(scheduler.cases.map((item) => item.id)).toEqual([
      "source-order-output-mutation",
      "awaited-async-boundary-source-order",
      "timer-await-source-order",
      "empty-name-noop",
      "list-readback",
      "error-propagation",
      "truthy-non-function-error",
    ])
    expect(verifyOpenCodeHookSchedulerNativeExactFixture(scheduler)).toEqual({ ok: true, issues: [] })

    expect(errorDefaults).toMatchObject({
      atomID: "opencode.hook.error-defaults",
      portID: "hook.error-policy",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(errorDefaults.cases.map((item) => item.id)).toEqual([
      "handler-fail-fast",
      "observer-fail-fast",
    ])
    expect(verifyOpenCodeHookErrorDefaultsNativeExactFixture(errorDefaults)).toEqual({ ok: true, issues: [] })
  })

  it("proves OpenCode plugin V2 definition, loader, cleanup, and registry bridges as native exact modules", async () => {
    const pluginV2 = await captureOpenCodePluginV2DefinitionNativeExactFixture()
    const runtimeImport = await captureOpenCodePluginRuntimeImportNativeExactFixture()
    const packageCompatibility = await captureOpenCodePluginPackageCompatibilityNativeExactFixture()
    const npmInstall = await captureOpenCodePluginNpmInstallNativeExactFixture()
    const loader = await captureOpenCodePluginLoaderNativeExactFixture()
    const cleanup = await captureOpenCodePluginHotReloadCleanupNativeExactFixture()
    const hotReloadMeta = await captureOpenCodePluginHotReloadMetaNativeExactFixture()
    const fileWatcher = await captureOpenCodeFileWatcherNativeExactFixture()
    const command = await captureOpenCodeCommandRegistryNativeExactFixture()
    const provider = captureOpenCodePluginProviderRegistryNativeExactFixture()
    const tool = captureOpenCodePluginToolRegistryNativeExactFixture()

    expect(pluginV2).toMatchObject({
      atomID: "opencode.plugin.v2-definition",
      portID: "hook.bus",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(pluginV2.cases.map((item) => item.id)).toEqual([
      "define-identity",
      "replace-closes-existing-scope",
      "triggerfor-draft-output-and-filter",
      "remove-closes-scope",
    ])
    expect(verifyOpenCodePluginV2DefinitionNativeExactFixture(pluginV2)).toEqual({ ok: true, issues: [] })

    expect(runtimeImport).toMatchObject({
      atomID: "opencode.plugin.loader",
      portID: "hook.bus",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(runtimeImport.cases.map((item) => item.id)).toEqual([
      "file-module-default-export",
      "module-export-priority",
      "cleanup-removes-live-hook",
      "parallel-skip-failed-and-preserve-order",
      "file-retry-after-wait",
    ])
    expect(verifyOpenCodePluginRuntimeImportNativeExactFixture(runtimeImport)).toEqual({ ok: true, issues: [] })

    expect(packageCompatibility).toMatchObject({
      atomID: "opencode.plugin.loader",
      portID: "hook.bus",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      residualGaps: ["opencode-real-npm-arborist-reify-not-replayed"],
    })
    expect(packageCompatibility.cases.map((item) => item.id)).toEqual([
      "package-targets-export-config",
      "main-and-theme-target-fallback",
      "entry-resolution-and-compatibility-pass",
      "entry-outside-package-rejected",
      "npm-compatibility-gate",
    ])
    expect(verifyOpenCodePluginPackageCompatibilityNativeExactFixture(packageCompatibility)).toEqual({ ok: true, issues: [] })

    expect(npmInstall).toMatchObject({
      atomID: "opencode.plugin.loader",
      portID: "hook.bus",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      residualGaps: ["opencode-real-npm-arborist-reify-not-replayed"],
    })
    expect(npmInstall.cases.map((item) => item.id)).toEqual([
      "bare-plugin-spec-installs-latest",
      "existing-cache-skips-reify",
      "reify-tree-first-edge",
      "fallback-entrypoint-after-empty-tree",
      "empty-tree-without-entrypoint-fails",
    ])
    expect(verifyOpenCodePluginNpmInstallNativeExactFixture(npmInstall)).toEqual({ ok: true, issues: [] })

    expect(loader).toMatchObject({
      atomID: "opencode.plugin.loader",
      portID: "hook.bus",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(loader.cases.map((item) => item.id)).toEqual([
      "source-config-registration-order",
      "manifest-fallback-source",
      "no-config-hook-registration",
    ])
    expect(verifyOpenCodePluginLoaderNativeExactFixture(loader)).toEqual({ ok: true, issues: [] })

    expect(cleanup).toMatchObject({
      atomID: "opencode.plugin.hot-reload-cleanup",
      portID: "hook.cleanup-scope",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(cleanup.cases.map((item) => item.id)).toEqual([
      "replacement-disposes-existing-before-track",
      "scope-dispose-removes-tracked-source",
      "host-state-isolated",
    ])
    expect(verifyOpenCodePluginHotReloadCleanupNativeExactFixture(cleanup)).toEqual({ ok: true, issues: [] })

    expect(hotReloadMeta).toMatchObject({
      atomID: "opencode.plugin.hot-reload-cleanup",
      portID: "hook.cleanup-scope",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      residualGaps: ["opencode-file-watcher-native-binding-not-replayed"],
    })
    expect(hotReloadMeta.cases.map((item) => item.id)).toEqual([
      "file-plugin-load-change-and-theme",
      "npm-plugin-version-fingerprint",
      "locked-concurrent-touch-counts",
    ])
    expect(verifyOpenCodePluginHotReloadMetaNativeExactFixture(hotReloadMeta)).toEqual({ ok: true, issues: [] })

    expect(fileWatcher).toMatchObject({
      atomID: "opencode.file.watcher",
      portID: "hook.cleanup-scope",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      residualGaps: ["opencode-file-watcher-native-binding-not-replayed"],
    })
    expect(fileWatcher.cases.map((item) => item.id)).toEqual([
      "backend-event-mapping-and-root-ignore",
      "git-head-subscription-and-config-ignore",
      "runtime-publish-and-dispose",
      "native-subscribe-callback-timeout-and-dispose",
    ])
    expect(verifyOpenCodeFileWatcherNativeExactFixture(fileWatcher)).toEqual({ ok: true, issues: [] })

    expect(command).toMatchObject({
      atomID: "opencode.registry.command",
      portID: "registry.command",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(command.cases.map((item) => item.id)).toEqual([
      "no-command-hook-noop",
      "source-order-shared-output",
      "event-session-fallback",
      "cleanup-removes-hook",
      "fail-fast-hook-error",
    ])
    expect(verifyOpenCodeCommandRegistryNativeExactFixture(command)).toEqual({ ok: true, issues: [] })

    expect(provider).toMatchObject({
      atomID: "opencode.plugin.provider-registry-bridge",
      coveredAtomIDs: expect.arrayContaining(["opencode.plugin.provider-registry-bridge", "opencode.registry.provider-plugin"]),
      portID: "registry.provider",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(provider.cases.map((item) => item.id)).toEqual([
      "auth-record-from-plugin-list",
      "provider-model-hook-filter",
      "auth-loader-hook-filter",
      "source-scoped-provider-registration",
    ])
    expect(verifyOpenCodePluginProviderRegistryNativeExactFixture(provider)).toEqual({ ok: true, issues: [] })

    expect(tool).toMatchObject({
      atomID: "opencode.plugin.registry-bridge",
      coveredAtomIDs: expect.arrayContaining(["opencode.plugin.registry-bridge", "opencode.registry.tool-definition"]),
      portID: "tool.registry",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(tool.cases.map((item) => item.id)).toEqual([
      "no-tools-noop",
      "source-scoped-tool-registration",
      "definition-reference-retained",
    ])
    expect(verifyOpenCodePluginToolRegistryNativeExactFixture(tool)).toEqual({ ok: true, issues: [] })
  })

  it("proves OpenCode plugin UI registry as a native exact module fixture", () => {
    const fixture = captureOpenCodePluginUIRegistryNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.plugin.ui-registry-bridge",
      coveredAtomIDs: ["opencode.plugin.ui-registry-bridge", "opencode.registry.ui-provider"],
      portID: "registry.ui",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-plugin-ui-registry-native-exact-fixture",
      replayRef: "plugin-ui-registry-native-exact:opencode",
      fixtureID: "opencode-plugin-ui-registry:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/plugin/src/index.ts"),
      expect.stringContaining("packages/plugin/src/tui.ts"),
      expect.stringContaining("packages/opencode/src/plugin/index.ts"),
      expect.stringContaining("packages/opencode/src/cli/cmd/tui/plugin/api.tsx"),
      expect.stringContaining("packages/opencode/src/cli/cmd/tui/plugin/runtime.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "no-ui-noop",
      "source-scoped-ui-registration",
      "provider-reference-retained",
    ])
    expect(verifyOpenCodePluginUIRegistryNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodePluginUIRegistryBridge()
    const cleanup: Array<() => void> = []
    const registerCalls: unknown[] = []
    const host = {
      services: new Map<string, unknown>(),
      registerUIProvider(input: unknown) {
        registerCalls.push(input)
        return () => registerCalls.push("cleanup")
      },
    }
    const ui = { render: "panel" }
    bridge.register({
      host,
      scope: {
        source: { id: "panel-plugin" },
        addCleanup(item) {
          cleanup.push(item)
        },
      },
      hooks: { ui },
    })
    expect(host.services.get("opencode.ui:panel-plugin")).toBe(ui)
    expect(cleanup).toHaveLength(2)
    expect(registerCalls).toEqual([{ name: "panel-plugin", provider: ui }])
    for (const item of cleanup) item()
    expect(host.services.has("opencode.ui:panel-plugin")).toBe(false)
    expect(registerCalls).toEqual([{ name: "panel-plugin", provider: ui }, "cleanup"])

    expect(verifyOpenCodePluginUIRegistryNativeExactFixture({ ...fixture, knownLossiness: ["partial-ui-registry"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-plugin-ui-registry.lossiness" }),
    ]))
    expect(verifyOpenCodePluginUIRegistryNativeExactFixture({ ...fixture, coveredAtomIDs: ["opencode.plugin.ui-registry-bridge"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-plugin-ui-registry.covered-atom" }),
    ]))
  })

  it("anchors Pi, Nanobot, and Hermes hook bridges to pinned upstream plugin and extension sources", () => {
    const snapshots = [
      {
        snapshot: buildPiMonoHookSourceMatrixSnapshot(),
        product: "pi-mono",
        repo: "earendil-works/pi",
        evidenceRef: "conformance:pi-hook-source-matrix",
        fixtureID: "pi-hook:source-matrix",
        sourcePath: "packages/coding-agent/src/core/extensions/loader.ts",
        sourceSymbol: "createExtensionRuntime",
        liveGap: "pi-live-extension-runtime-not-spawned",
        coveredAtoms: ["pi.extension.loader", "pi.hook.extension-bridge", "pi.registry.register-tool"],
      },
      {
        snapshot: buildNanobotHookSourceMatrixSnapshot(),
        product: "nanobot",
        repo: "HKUDS/nanobot",
        evidenceRef: "conformance:nanobot-hook-source-matrix",
        fixtureID: "nanobot-hook:source-matrix",
        sourcePath: "nanobot/agent/hook.py",
        sourceSymbol: "AgentHook",
        liveGap: "nanobot-live-plugin-runtime-not-spawned",
        coveredAtoms: ["nanobot.plugin.loader", "nanobot.hook.plugin-bridge", "nanobot.registry.tool-definition"],
      },
      {
        snapshot: buildHermesAgentHookSourceMatrixSnapshot(),
        product: "hermes-agent",
        repo: "NousResearch/hermes-agent",
        evidenceRef: "conformance:hermes-hook-source-matrix",
        fixtureID: "hermes-hook:source-matrix",
        sourcePath: "hermes_cli/plugins.py",
        sourceSymbol: "PluginManager",
        liveGap: "hermes-live-plugin-runtime-not-spawned",
        coveredAtoms: ["hermes.plugin.loader", "hermes.hook.plugin-bridge", "hermes.registry.tool-definition"],
      },
    ]

    for (const item of snapshots) {
      expect(item.snapshot).toMatchObject({
        schemaVersion: 1,
        product: item.product,
        pinnedRepo: item.repo,
        evidenceRef: item.evidenceRef,
        fixtureID: item.fixtureID,
        partialBranchIDs: expect.arrayContaining([
          "plugin-or-extension-definition",
          "plugin-or-extension-loader",
          "hook-handler-chain",
          "hook-observer-chain",
          "hook-scheduler-error-policy",
          "plugin-event-mapper",
          "plugin-cleanup",
          "command-registry",
          "provider-registry",
          "tool-registry",
          "ui-registry",
        ]),
        missingBranchIDs: expect.arrayContaining([
          "live-plugin-runtime",
          "lifecycle-side-effects",
          "exact-hook-event-timing",
        ]),
        coveredHookAtomIDs: expect.arrayContaining(item.coveredAtoms),
        coveredHookPortIDs: expect.arrayContaining([
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
        ]),
        knownGaps: expect.arrayContaining([item.liveGap, `${item.fixtureID.replace(":source-matrix", "")}-source-matrix-covered-by-partial-fixture`]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      expect(item.snapshot.sourceRefs).toEqual(expect.arrayContaining([
        expect.objectContaining({
          path: item.sourcePath,
          symbols: expect.arrayContaining([item.sourceSymbol]),
        }),
      ]))
      expect(item.snapshot.branchAnchors.find((anchor) => anchor.branchID === "live-plugin-runtime")).toMatchObject({
        status: "missing",
      })
    }
  })

  it("records hook/plugin lifecycle positive and negative gates", () => {
    const snapshot = buildHookPluginLifecycleReplayGateSnapshot()
    const verification = verifyHookPluginLifecycleReplayGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:hook-plugin-lifecycle-replay-gate",
      fixtureID: "hook:plugin-lifecycle-replay-gate",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: ["loader-runtime", "hook-order", "failure-path", "registry-state", "cleanup-side-effects"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-hook:source-matrix",
      lifecycleRisk: "source-anchored-partial",
      sourceAnchors: expect.arrayContaining([
        "plugin-core:packages/core/src/plugin.ts",
        "plugin-boot:packages/core/src/plugin/boot.ts",
        "opencode-hook-handler:native-exact-fixture",
        "opencode-plugin-event-mapper:native-exact-fixture",
        "hook-scheduler-native-exact:opencode",
      ]),
      hookOrder: expect.arrayContaining(["hook-handler-chain", "native-parity-claimed", "opencode-hook-handler:native-exact-fixture", "source order", "timer await wall-clock native"]),
      cleanupSideEffects: expect.arrayContaining(["plugin-hot-reload-cleanup", "hot-reload:projected", "plugin-meta file/npm fingerprint native", "file-watcher event mapping native", "parcel-native-binding:not-replayed"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-hook-lifecycle-native-exact-fixture",
        "hook-lifecycle-native-exact:opencode",
        "opencode-hook-handler:native-exact-fixture",
        "hook-handler-native-exact:opencode",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-hook:source-matrix",
        "opencode-hook-lifecycle:native-exact-fixture",
        "opencode-plugin-v2-definition:native-exact-fixture",
        "opencode-plugin-loader:native-exact-fixture",
        "opencode-hook-handler:native-exact-fixture",
        "opencode-hook-observer:native-exact-fixture",
        "opencode-hook-scheduler:native-exact-fixture",
        "opencode-plugin-event-mapper:native-exact-fixture",
        "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
        "opencode-command-registry:native-exact-fixture",
        "opencode-plugin-provider-registry:native-exact-fixture",
        "opencode-plugin-tool-registry:native-exact-fixture",
        "opencode-plugin-ui-registry:native-exact-fixture",
      ]),
      knownLossiness: expect.arrayContaining(["opencode-hook-source-matrix-covered-by-partial-fixture", "opencode-real-npm-arborist-reify-not-replayed"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-hook:source-matrix",
      loaderRuntime: expect.arrayContaining(["discoverAndLoadExtensions", "createExtensionRuntime", "live extension runtime:not-spawned"]),
      registryState: expect.arrayContaining(["defineTool", "dynamicToolsExtension", "registry side effects:not-replayed"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.sourceAnchors).toEqual(expect.arrayContaining(["nanobot-agent-hook:nanobot/agent/hook.py"]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")).toMatchObject({
      sourceAnchors: expect.arrayContaining(["hermes-cli-plugins:hermes_cli/plugins.py"]),
      loaderRuntime: expect.arrayContaining(["hermes plugin manager runtime", "plugin discovery"]),
    })

    const orderDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, hookOrder: [] }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleReplayGateSnapshot(orderDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle.hook-order",
        product: "opencode",
        dimension: "hook-order",
      }),
    ]))

    const failurePathDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, failurePath: [] }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleReplayGateSnapshot(failurePathDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle.failure-path",
        product: "hermes-agent",
        dimension: "failure-path",
      }),
    ]))

    const commonOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, lifecycleRisk: "common-only" as const, registryState: [] }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleReplayGateSnapshot(commonOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle.registry-state",
        product: "nanobot",
        dimension: "registry-state",
      }),
      expect.objectContaining({
        id: "hook-plugin-lifecycle.common-only-lifecycle",
        product: "nanobot",
        dimension: "registry-state",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              nativeEvidenceRefs: item.nativeEvidenceRefs.filter((ref) => ref !== "hook-lifecycle-native-exact:opencode"),
              fixtureIDs: item.fixtureIDs.filter((fixtureID) => fixtureID !== "opencode-hook-lifecycle:native-exact-fixture"),
            }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleReplayGateSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle.native-exact-evidence",
        product: "opencode",
        dimension: "loader-runtime",
      }),
    ]))

    const borrowedOpenCode = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, fixtureID: "opencode-hook:source-matrix", lifecycleRisk: "borrowed-opencode" as const }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleReplayGateSnapshot(borrowedOpenCode).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle.borrowed-source-matrix",
        product: "pi-mono",
        dimension: "loader-runtime",
      }),
    ]))
  })

  it("records hook/plugin lifecycle exact-diff blockers without claiming native parity", () => {
    const snapshot = buildHookPluginLifecycleExactDiffBlockerSnapshot()
    const verification = verifyHookPluginLifecycleExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:hook-plugin-lifecycle-exact-diff-blocker-gate",
      fixtureID: "hook:plugin-lifecycle-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: ["loader-runtime", "hook-order", "failure-path", "registry-state", "cleanup-side-effects"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-hook:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "semantic-fixture-needs-exact-diff",
      loaderRuntime: expect.arrayContaining(["hook-loader-runtime-native-evaluation:exact-diff-not-proven"]),
      hookOrder: expect.arrayContaining(["hook-order-native-timing:exact-diff-not-proven"]),
      failurePath: expect.arrayContaining(["hook-failure-path-native-policy:exact-diff-not-proven"]),
      registryState: expect.arrayContaining(["hook-registry-state-native-side-effects:exact-diff-not-proven"]),
      cleanupSideEffects: expect.arrayContaining(["hook-cleanup-side-effects-native-order:exact-diff-not-proven"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "opencode-hook:source-matrix",
        "plugin-core:packages/core/src/plugin.ts",
        "conformance:opencode-hook-lifecycle-native-exact-fixture",
        "hook-lifecycle-native-exact:opencode",
        "opencode-hook-lifecycle:native-exact-fixture",
      ]),
      knownLossiness: expect.arrayContaining(["hook-loader-runtime-native-evaluation-not-proven", "hook-cleanup-side-effects-native-order-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-hook:source-matrix",
      loaderRuntime: expect.arrayContaining(["discoverAndLoadExtensions", "hook-loader-runtime-native-evaluation:exact-diff-not-proven"]),
      hookOrder: expect.arrayContaining(["hook-order-native-timing:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.cleanupSideEffects).toEqual(expect.arrayContaining([
      "channel/tool registry side effects:not-replayed",
      "hook-cleanup-side-effects-native-order:exact-diff-not-proven",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.failurePath).toEqual(expect.arrayContaining([
      "agent runner events",
      "hook-failure-path-native-policy:exact-diff-not-proven",
    ]))

    const loaderDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, loaderRuntime: [] }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleExactDiffBlockerSnapshot(loaderDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-exact-diff.loader-runtime",
        product: "opencode",
        dimension: "loader-runtime",
      }),
    ]))

    const orderDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, hookOrder: [] }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleExactDiffBlockerSnapshot(orderDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-exact-diff.hook-order",
        product: "pi-mono",
        dimension: "hook-order",
      }),
    ]))

    const failurePathDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, failurePath: [] }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleExactDiffBlockerSnapshot(failurePathDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-exact-diff.failure-path",
        product: "hermes-agent",
        dimension: "failure-path",
      }),
    ]))

    const registryDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, registryState: [] }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleExactDiffBlockerSnapshot(registryDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-exact-diff.registry-state",
        product: "nanobot",
        dimension: "registry-state",
      }),
    ]))

    const cleanupDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, cleanupSideEffects: [] }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleExactDiffBlockerSnapshot(cleanupDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-exact-diff.cleanup-side-effects",
        product: "opencode",
        dimension: "cleanup-side-effects",
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
    expect(verifyHookPluginLifecycleExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-exact-diff.native-claim",
        product: "opencode",
        dimension: "loader-runtime",
      }),
    ]))

    const commonOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "common-only" as const }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleExactDiffBlockerSnapshot(commonOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-exact-diff.common-only-lifecycle",
        product: "pi-mono",
        dimension: "registry-state",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              nativeEvidenceRefs: item.nativeEvidenceRefs.filter((ref) =>
                ref !== "conformance:opencode-hook-lifecycle-native-exact-fixture" &&
                ref !== "opencode-hook-lifecycle:native-exact-fixture"
              ),
            }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleExactDiffBlockerSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-exact-diff.native-exact-evidence",
        product: "opencode",
        dimension: "loader-runtime",
      }),
    ]))

    const borrowedOpenCode = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, fixtureID: "opencode-hook:source-matrix", exactDiffRisk: "borrowed-opencode" as const }
          : item,
      ),
    }
    expect(verifyHookPluginLifecycleExactDiffBlockerSnapshot(borrowedOpenCode).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-exact-diff.borrowed-source-matrix",
        product: "nanobot",
        dimension: "loader-runtime",
      }),
    ]))
  })

  it("records hook/plugin lifecycle pinned replay fixtures without claiming native parity", () => {
    const snapshot = buildHookPluginLifecyclePinnedReplaySnapshot()
    const verification = verifyHookPluginLifecyclePinnedReplaySnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:hook-plugin-lifecycle-pinned-replay-gate",
      fixtureID: "hook:plugin-lifecycle-pinned-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: ["loader-runtime", "hook-order", "failure-path", "registry-state", "cleanup-side-effects"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      sourceFixtureID: "opencode-hook:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "pinned-lifecycle-replay-needs-live-runtime",
      upstreamEvents: expect.arrayContaining([
        expect.objectContaining({
          dimension: "loader-runtime",
          lifecycleID: "opencode:opencode.lifecycle.project-plugin",
          loaderID: "PluginBoot.defaultLayer",
          sourceAnchor: "plugin-boot:packages/core/src/plugin/boot.ts",
        }),
        expect.objectContaining({
          dimension: "cleanup-side-effects",
          failurePolicy: "dispose-before-reload",
          sideEffectID: "hot-reload-cleanup:dispose-order",
        }),
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-hook-lifecycle-native-exact-fixture",
        "hook-lifecycle-native-exact:opencode",
        "opencode-hook-lifecycle:native-exact-fixture",
        "opencode-hook-handler:native-exact-fixture",
      ]),
      knownLossiness: expect.arrayContaining(["hook-plugin-pinned-lifecycle-replay-live-runtime-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")?.upstreamEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "registry-state",
        registrySnapshotID: "pi.registry.dynamicToolsExtension+defineTool",
        sourceAnchor: "pi-extension-wrapper:packages/coding-agent/src/core/extensions/wrapper.ts",
      }),
    ]))
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.upstreamEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "hook-order",
        handlerOrder: ["progress-hook:handler:10", "channel-hook:handler:20"],
        sideEffectID: "nanobot-hook-order:progress",
      }),
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.upstreamEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "failure-path",
        failurePolicy: "guardrail-error-policy:continue",
        sourceAnchor: "hermes-agent-runner:agent/agent_runtime_helpers.py",
      }),
    ]))

    const loaderDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledEvents: item.assembledEvents.map((event) =>
                event.dimension === "loader-runtime"
                  ? { ...event, loaderID: "common-hook-loader" }
                  : event,
              ),
            }
          : item,
      ),
    }
    expect(verifyHookPluginLifecyclePinnedReplaySnapshot(loaderDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-pinned-replay.loader-runtime",
        product: "opencode",
        dimension: "loader-runtime",
      }),
    ]))

    const orderDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? {
              ...item,
              productReplayEvents: item.productReplayEvents.map((event) =>
                event.dimension === "hook-order"
                  ? { ...event, handlerOrder: [...event.handlerOrder].reverse() }
                  : event,
              ),
            }
          : item,
      ),
    }
    expect(verifyHookPluginLifecyclePinnedReplaySnapshot(orderDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-pinned-replay.hook-order",
        product: "nanobot",
        dimension: "hook-order",
      }),
    ]))

    const failureDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              productReplayEvents: item.productReplayEvents.map((event) =>
                event.dimension === "failure-path"
                  ? { ...event, failurePolicy: "fail-fast" }
                  : event,
              ),
            }
          : item,
      ),
    }
    expect(verifyHookPluginLifecyclePinnedReplaySnapshot(failureDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-pinned-replay.failure-path",
        product: "hermes-agent",
        dimension: "failure-path",
      }),
    ]))

    const registryDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? {
              ...item,
              assembledEvents: item.assembledEvents.map((event) =>
                event.dimension === "registry-state"
                  ? { ...event, registrySnapshotID: "common.registry.tool" }
                  : event,
              ),
            }
          : item,
      ),
    }
    expect(verifyHookPluginLifecyclePinnedReplaySnapshot(registryDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-pinned-replay.registry-state",
        product: "pi-mono",
        dimension: "registry-state",
      }),
    ]))

    const cleanupDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              productReplayEvents: item.productReplayEvents.map((event) =>
                event.dimension === "cleanup-side-effects"
                  ? { ...event, cleanupID: "common.cleanup.scope" }
                  : event,
              ),
            }
          : item,
      ),
    }
    expect(verifyHookPluginLifecyclePinnedReplaySnapshot(cleanupDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-pinned-replay.cleanup-side-effects",
        product: "opencode",
        dimension: "cleanup-side-effects",
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
    expect(verifyHookPluginLifecyclePinnedReplaySnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-pinned-replay.native-claim",
        product: "opencode",
        dimension: "loader-runtime",
      }),
    ]))

    const commonOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "common-only" as const }
          : item,
      ),
    }
    expect(verifyHookPluginLifecyclePinnedReplaySnapshot(commonOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-pinned-replay.common-only-lifecycle",
        product: "pi-mono",
        dimension: "registry-state",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              nativeEvidenceRefs: item.nativeEvidenceRefs.filter((ref) =>
                ref !== "hook-lifecycle-native-exact:opencode" &&
                ref !== "opencode-hook-lifecycle:native-exact-fixture"
              ),
            }
          : item,
      ),
    }
    expect(verifyHookPluginLifecyclePinnedReplaySnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-pinned-replay.native-exact-evidence",
        product: "opencode",
        dimension: "loader-runtime",
      }),
    ]))

    const borrowedOpenCode = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, sourceFixtureID: "opencode-hook:source-matrix", exactDiffRisk: "borrowed-opencode" as const }
          : item,
      ),
    }
    expect(verifyHookPluginLifecyclePinnedReplaySnapshot(borrowedOpenCode).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "hook-plugin-lifecycle-pinned-replay.borrowed-source-matrix",
        product: "hermes-agent",
        dimension: "loader-runtime",
      }),
    ]))
  })

  it("exposes hook bus, scheduler, chain, cleanup, error-policy, and registry atoms as public lego blocks", async () => {
    const services = new Map<string, unknown>()
    const scheduler = createSourceOrderedHookScheduler()
    const errors: unknown[] = []
    const errorPolicy = createCollectAndContinueHookErrorPolicy((error) => errors.push(error.error))
    const observerChain = createHookObserverChain({ scheduler, errorPolicy, services })
    const handlerChain = createHookHandlerChain({ scheduler, errorPolicy, services })
    const bus = createHookEventBus({ observerChain, handlerChain })
    const seen: string[] = []
    const late = { id: "late", order: 2 }
    const early = { id: "early", order: 1 }

    bus.observe(() => {
      seen.push("observe:late")
    }, late)
    bus.observe(() => {
      seen.push("observe:early")
      throw new Error("observer-continues")
    }, early)
    bus.on(
      "input",
      (event) => {
        seen.push("handle:late")
        return { late: (event.payload as { text: string }).text }
      },
      late,
    )
    bus.on(
      "input",
      (event) => {
        seen.push("handle:early")
        ;(event.payload as { text: string }).text = "mutated"
        return { early: true }
      },
      early,
    )

    await expect(bus.emit({ type: "input", timestamp: Date.now(), payload: { text: "start" } })).resolves.toMatchObject({
      early: true,
      late: "mutated",
    })
    expect(seen).toEqual(["observe:early", "observe:late", "handle:early", "handle:late"])
    expect(errors).toHaveLength(1)
    expect(scheduler.order([{ source: late }, { source: early }]).map((record) => record.source.id)).toEqual(["early", "late"])

    const serialSeen: string[] = []
    await createSerialHookScheduler().run([{ source: late }, { source: early }], async (record) => {
      serialSeen.push(record.source.id)
    })
    expect(serialSeen).toEqual(["late", "early"])
    const parallelSeen = await createParallelHookScheduler().run([{ source: late }, { source: early }], async (record) => record.source.id)
    expect(parallelSeen.sort()).toEqual(["early", "late"])

    const cleanup = createHookCleanupScope({ scheduler, errorPolicy, services })
    const cleanupSeen: string[] = []
    cleanup.add(() => {
      cleanupSeen.push("cleanup:early")
    }, early)
    cleanup.add(() => {
      cleanupSeen.push("cleanup:late")
    }, late)
    await cleanup.dispose()
    expect(cleanupSeen).toEqual(["cleanup:late", "cleanup:early"])

    const registries = createHookRegistryAtoms({ services })
    const unregisterTool = registries.tool.register(
      { name: "echo", description: "Echo", parameters: { type: "object" }, execute: async () => ({ content: [] }) },
      early,
    )
    const unregisterCommand = registries.command.registerCommand({ name: "build", handler: async () => undefined }, early)
    const unregisterProvider = registries.provider.registerProvider({ name: "local", config: { model: "test" } }, early)
    const unregisterUI = registries.ui.registerUIProvider({ name: "panel", provider: { render: "panel" } }, early)
    expect(registries.registries.tools.has("echo")).toBe(true)
    expect(registries.registries.commands.get("build")?.source?.id).toBe("early")
    expect(registries.registries.providers.get("local")?.source?.id).toBe("early")
    expect(registries.registries.uiProviders.get("panel")?.source?.id).toBe("early")
    expect(services.has("tool:echo")).toBe(true)
    expect(services.has("provider:local")).toBe(true)
    expect(services.has("uiProvider:panel")).toBe(true)
    unregisterUI()
    unregisterProvider()
    unregisterCommand()
    unregisterTool()
    expect(registries.registries.tools.has("echo")).toBe(false)
    expect(registries.registries.commands.has("build")).toBe(false)
    expect(registries.registries.providers.has("local")).toBe(false)
    expect(registries.registries.uiProviders.has("panel")).toBe(false)
  })

  it("runs observers and handlers in source order", async () => {
    const host = new LegoHookHost()
    const seen: string[] = []
    const late = host.createScope({ id: "late", order: 2 })
    const early = host.createScope({ id: "early", order: 1 })
    late.observe(() => {
      seen.push("observe:late")
    })
    early.observe(() => {
      seen.push("observe:early")
    })
    late.on("turn_start", () => {
      seen.push("handle:late")
    })
    early.on("turn_start", () => {
      seen.push("handle:early")
    })

    await host.emit({ type: "turn.start", timestamp: Date.now(), payload: { turnIndex: 0 } })

    expect(seen).toEqual(["observe:early", "observe:late", "handle:early", "handle:late"])
  })

  it("exposes a function-free hook source registry snapshot", () => {
    const host = new LegoHookHost()
    const observer = host.createScope({ id: "observer-source", name: "Observer", path: "/tmp/project/observer.ts", scope: "project", order: 2 })
    const late = host.createScope({ id: "late-handler", name: "Late handler", scope: "project", order: 3 })
    const early = host.createScope({ id: "early-handler", name: "Early handler", scope: "project", order: 1 })

    observer.observe(() => undefined)
    late.on("input", () => undefined)
    early.on("input", () => undefined)

    const snapshot = host.snapshotHookSources(["input", "message_end"])

    expect(snapshot.observers).toMatchObject([
      { kind: "observer", source: { id: "observer-source", name: "Observer", path: "/tmp/project/observer.ts", order: 2 } },
    ])
    expect(snapshot.handlers.map((record) => record.source.id)).toEqual(["early-handler", "late-handler"])
    expect(snapshot.handlers[0]).not.toHaveProperty("handler")
    expect(snapshot.observers[0]).not.toHaveProperty("observer")

    const input = snapshot.events.find((event) => event.event === "input")
    expect(input).toMatchObject({
      event: "input",
      observerCount: 1,
      handlerCount: 2,
    })
    expect(input?.sourceOrder.map((record) => `${record.kind}:${record.source.id}`)).toEqual([
      "handler:early-handler",
      "observer:observer-source",
      "handler:late-handler",
    ])

    const messageEnd = snapshot.events.find((event) => event.event === "message.end")
    expect(messageEnd).toMatchObject({
      event: "message.end",
      observerCount: 1,
      handlerCount: 0,
    })
    expect(messageEnd?.sourceOrder.map((record) => `${record.kind}:${record.source.id}`)).toEqual(["observer:observer-source"])
  })

  it("preserves mutable tool payloads and stops after a block", async () => {
    const host = new LegoHookHost()
    const payload = {
      toolName: "bash",
      toolCallID: createID("toolcall"),
      sessionID: createID("session"),
      input: { command: "npm test" },
    }
    const calls: string[] = []
    host.on("tool_call", (event) => {
      calls.push("mutate")
      ;(event.payload as typeof payload).input.command = "npm run test"
    })
    host.on("tool_call", () => {
      calls.push("block")
      return { block: true, reason: "quality gate" }
    })
    host.on("tool_call", () => {
      calls.push("after-block")
    })

    const result = await host.emit({ type: "tool.call", timestamp: Date.now(), payload })

    expect(payload.input.command).toBe("npm run test")
    expect(result).toMatchObject({ block: true, reason: "quality gate" })
    expect(calls).toEqual(["mutate", "block"])
  })

  it("continues after handler errors by default and reports them", async () => {
    const errors: unknown[] = []
    const host = new LegoHookHost({ onError: (error) => errors.push(error.error) })
    let reached = false
    host.on("message_end", () => {
      throw new Error("boom")
    })
    host.on("message_end", () => {
      reached = true
    })

    await host.emit({ type: "message.end", timestamp: Date.now(), payload: {} })

    expect(errors).toHaveLength(1)
    expect(reached).toBe(true)
  })

  it("stops after cancel results and can throw handler errors", async () => {
    const cancelHost = new LegoHookHost()
    const calls: string[] = []
    cancelHost.on("message_update", () => {
      calls.push("cancel")
      return { cancel: true, reason: "session switch" }
    })
    cancelHost.on("message_update", () => {
      calls.push("after-cancel")
    })

    await expect(cancelHost.emit({ type: "message.update", timestamp: Date.now(), payload: {} })).resolves.toMatchObject({
      cancel: true,
      reason: "session switch",
    })
    expect(calls).toEqual(["cancel"])

    const throwHost = new LegoHookHost({ errorMode: "throw" })
    throwHost.on("message_end", () => {
      throw new Error("explode")
    })

    await expect(throwHost.emit({ type: "message.end", timestamp: Date.now(), payload: {} })).rejects.toThrow("explode")
  })

  it("runs cleanup and clears handlers", async () => {
    const host = new LegoHookHost()
    let cleaned = false
    let called = 0
    const scope = host.createScope({ id: "scope" })
    scope.on("turn_end", () => {
      called++
    })
    scope.addCleanup(() => {
      cleaned = true
    })

    await host.clear()
    await host.emit({ type: "turn.end", timestamp: Date.now(), payload: {} })

    expect(cleaned).toBe(true)
    expect(called).toBe(0)
  })

  it("registers auth and UI providers as scoped registries", async () => {
    const host = new LegoHookHost()
    const scope = host.createScope({ id: "registry-extension" })
    scope.addCleanup(host.registerAuth({ name: "oauth", config: { type: "oauth" } }, scope.source))
    scope.addCleanup(host.registerUIProvider({ name: "panel", provider: { render: "panel" } }, scope.source))

    expect(host.registries.auth.get("oauth")).toMatchObject({
      name: "oauth",
      config: { type: "oauth" },
      source: { id: "registry-extension" },
    })
    expect(host.registries.uiProviders.get("panel")).toMatchObject({
      name: "panel",
      provider: { render: "panel" },
      source: { id: "registry-extension" },
    })
    expect(host.services.get("auth:oauth")).toMatchObject({
      auth: expect.objectContaining({ name: "oauth" }),
    })
    expect(host.services.get("uiProvider:panel")).toMatchObject({
      provider: expect.objectContaining({ name: "panel" }),
    })

    await scope.dispose()

    expect(host.registries.auth.has("oauth")).toBe(false)
    expect(host.registries.uiProviders.has("panel")).toBe(false)
    expect(host.services.has("auth:oauth")).toBe(false)
    expect(host.services.has("uiProvider:panel")).toBe(false)
  })

  it("covers the hook strategy matrix for observation, mutation, stop, cleanup, and errors", async () => {
    const host = new LegoHookHost()
    const seen: string[] = []
    const payload = { value: "start" }
    host.observe((event) => {
      seen.push(`observe:${event.type}`)
    })
    host.on("input", (event) => {
      seen.push("mutate")
      ;(event.payload as typeof payload).value = "mutated"
    })
    await host.emit({ type: "input", timestamp: Date.now(), payload })
    expect(seen).toEqual(["observe:input", "mutate"])
    expect(payload.value).toBe("mutated")

    const cancelHost = new LegoHookHost()
    const cancelCalls: string[] = []
    cancelHost.on("turn_end", () => {
      cancelCalls.push("cancel")
      return { cancel: true, reason: "cancelled" }
    })
    cancelHost.on("turn_end", () => {
      cancelCalls.push("after-cancel")
    })
    await expect(cancelHost.emit({ type: "turn.end", timestamp: Date.now(), payload: {} })).resolves.toMatchObject({
      cancel: true,
      reason: "cancelled",
    })
    expect(cancelCalls).toEqual(["cancel"])

    const handledHost = new LegoHookHost()
    const handledCalls: string[] = []
    handledHost.on("message_end", () => {
      handledCalls.push("handled")
      return { action: "handled", value: "done" }
    })
    handledHost.on("message_end", () => {
      handledCalls.push("after-handled")
    })
    await expect(handledHost.emit({ type: "message.end", timestamp: Date.now(), payload: {} })).resolves.toMatchObject({
      action: "handled",
      value: "done",
    })
    expect(handledCalls).toEqual(["handled"])

    const cleanupHost = new LegoHookHost()
    const cleanupScope = cleanupHost.createScope({ id: "async-cleanup" })
    let cleaned = false
    cleanupScope.addCleanup(async () => {
      await Promise.resolve()
      cleaned = true
    })
    await cleanupScope.dispose()
    expect(cleaned).toBe(true)

    const errors: unknown[] = []
    const continueHost = new LegoHookHost({ onError: (error) => errors.push(error.error) })
    let reached = false
    continueHost.on("provider_response_after", () => {
      throw new Error("continue")
    })
    continueHost.on("provider_response_after", () => {
      reached = true
    })
    await continueHost.emit({ type: "provider.response.after", timestamp: Date.now(), payload: {} })
    expect(errors).toHaveLength(1)
    expect(reached).toBe(true)

    const failFastHost = new LegoHookHost({ errorMode: "throw" })
    failFastHost.on("provider_response_after", () => {
      throw new Error("fail-fast")
    })
    await expect(failFastHost.emit({ type: "provider.response.after", timestamp: Date.now(), payload: {} })).rejects.toThrow("fail-fast")
  })

  it("mounts the same common hook atom through OpenCode plugin and Pi extension surfaces", async () => {
    const host = new LegoHookHost()
    const audit: string[] = []
    const commonHookAtom = {
      handleInput(source: string, payload: Record<string, unknown>) {
        audit.push(`${source}:input:${String(payload["text"] ?? "")}`)
        return { [`${source}Input`]: true }
      },
      handlePermission(source: string, payload: Record<string, unknown>) {
        audit.push(`${source}:permission:${String(payload["toolName"] ?? "")}`)
        return { [`${source}Permission`]: true }
      },
      cleanup(source: string) {
        audit.push(`${source}:cleanup`)
      },
    }

    const openCodeScope = await loadOpenCodePlugin({
      host,
      plugin: () => ({
        "chat.message": (input, output) => {
          Object.assign(output, commonHookAtom.handleInput("opencode", input))
        },
        "permission.ask": (input, output) => {
          Object.assign(output, commonHookAtom.handlePermission("opencode", input))
          output.status = "allow"
        },
      }),
      pluginInput: { directory: process.cwd() },
      source: { id: "opencode-common-hook" },
    })
    openCodeScope.addCleanup(() => commonHookAtom.cleanup("opencode"))

    const piExtension = await loadPiExtension({
      host,
      extension: (pi) => {
        pi.on("input", (payload) => commonHookAtom.handleInput("pi", payload as Record<string, unknown>))
        pi.on("permission.ask", (payload) => commonHookAtom.handlePermission("pi", payload as Record<string, unknown>))
        pi.addCleanup(() => commonHookAtom.cleanup("pi"))
      },
      source: { id: "pi-common-hook" },
    })

    await expect(host.emit({ type: "input", timestamp: Date.now(), payload: { text: "hello" } })).resolves.toMatchObject({
      opencodeInput: true,
      piInput: true,
    })
    await expect(host.emit({ type: "permission.ask", timestamp: Date.now(), payload: { toolName: "bash" } })).resolves.toMatchObject({
      status: "allow",
      opencodePermission: true,
      piPermission: true,
    })

    await piExtension.dispose()
    await openCodeScope.dispose()

    expect(audit).toEqual([
      "opencode:input:hello",
      "pi:input:hello",
      "opencode:permission:bash",
      "pi:permission:bash",
      "pi:cleanup",
      "opencode:cleanup",
    ])
  })
})
