import { createHash } from "node:crypto"
import type { LegoPortContractFixture } from "@helix/contracts"

export type OpenCodeHookSourceRefID =
  | "plugin-core"
  | "plugin-boot"
  | "plugin-provider"
  | "local-command-registry"
  | "local-hook-handler"
  | "local-hook-observer"
  | "local-hook-scheduler"
  | "local-hook-error-defaults"
  | "local-file-watcher"
  | "local-plugin-hot-reload-cleanup"
  | "local-plugin-event-mapper"
  | "local-plugin-loader"
  | "local-plugin-provider-registry"
  | "local-plugin-tool-registry"
  | "local-plugin-ui-registry"
  | "local-plugin-v2-definition"
  | "local-plugin-spec-loader"
  | "local-hook-runtime-projection"
  | "local-hook-live-runtime-fixture"

export interface OpenCodeHookSourceRef {
  id: OpenCodeHookSourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-12" | "local-source:2026-06-15"
}

export type OpenCodeHookSourceMatrixBranchID =
  | "plugin-v2-definition"
  | "plugin-boot-loader"
  | "hook-handler-chain"
  | "hook-observer-chain"
  | "hook-scheduler-error-policy"
  | "plugin-event-mapper"
  | "plugin-hot-reload-cleanup"
  | "command-registry"
  | "provider-registry"
  | "tool-registry"
  | "ui-registry"
  | "live-plugin-runtime"
  | "hot-reload-side-effects"
  | "exact-hook-event-timing"

export type OpenCodeHookSourceMatrixBranchStatus = "native-exact" | "partial" | "missing"
export type OpenCodeHookSourceMatrixExactDiffStatus = "native-exact" | "exact-diff-partial"

export interface OpenCodeHookSourceMatrixBranchAnchor {
  branchID: OpenCodeHookSourceMatrixBranchID
  status: OpenCodeHookSourceMatrixBranchStatus
  exactDiffStatus: OpenCodeHookSourceMatrixExactDiffStatus
  nativeParityClaim: boolean
  sourceRefIDs: OpenCodeHookSourceRefID[]
  hookAtomIDs: string[]
  hookPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
}

export interface OpenCodeHookSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-hook-source-matrix"
  fixtureID: "opencode-hook:source-matrix"
  sourceRefs: OpenCodeHookSourceRef[]
  branchAnchors: OpenCodeHookSourceMatrixBranchAnchor[]
  nativeExactBranchIDs: OpenCodeHookSourceMatrixBranchID[]
  partialBranchIDs: OpenCodeHookSourceMatrixBranchID[]
  missingBranchIDs: OpenCodeHookSourceMatrixBranchID[]
  coveredHookAtomIDs: string[]
  coveredHookPortIDs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeHookRuntimeProjectionEvent =
  | {
    type: "plugin.runtime"
    pluginID: string
    sourceKind: "project" | "global" | "builtin" | "unknown"
    hookNames: string[]
    registryKeys: string[]
    sequence: number
  }
  | {
    type: "hot.reload"
    pluginID: string
    operation: "watch" | "dispose" | "replace" | "reload"
    cleanupKeys: string[]
    registryKeys: string[]
    sequence: number
  }
  | {
    type: "hook.timing"
    eventName: string
    phase: "handler" | "observer" | "scheduler" | "error-policy"
    sourceID?: string
    order: number
    asyncBoundaryObserved?: boolean
    sequence: number
  }

export interface OpenCodeHookRuntimeProjection {
  schemaVersion: 1
  fixtureID: "opencode-hook:runtime-projection"
  evidenceRef: "conformance:opencode-hook-runtime-projection"
  coveredBranchIDs: Array<Extract<OpenCodeHookSourceMatrixBranchID, "live-plugin-runtime" | "hot-reload-side-effects" | "exact-hook-event-timing">>
  retainedFields: string[]
  lossyFields: string[]
  pluginRuntime: Array<{ pluginID: string; sourceKind: "project" | "global" | "builtin" | "unknown"; hookNames: string[]; registryKeys: string[]; sequence: number }>
  hotReloadSideEffects: Array<{ pluginID: string; operation: "watch" | "dispose" | "replace" | "reload"; cleanupKeys: string[]; registryKeys: string[]; sequence: number }>
  hookEventTiming: Array<{ eventName: string; phase: "handler" | "observer" | "scheduler" | "error-policy"; sourceID: string | null; order: number; asyncBoundaryObserved: boolean; sequence: number }>
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeHookLiveRuntimeFixtureInput {
  pluginID?: string
  sourceID?: string
  hookEventName?: string
  commandName?: string
  providerID?: string
  toolName?: string
  uiProviderID?: string
}

export interface OpenCodeHookPluginRuntimeLiveReadback {
  pluginID: string
  sourceID: string
  sourceKind: "project" | "global" | "builtin" | "unknown"
  moduleExportKeys: string[]
  hookNames: string[]
  registryKeys: string[]
  moduleEvaluationHash: string
  sequence: number
}

export interface OpenCodeHookTimingLiveReadback {
  eventName: string
  phase: "handler" | "observer" | "scheduler" | "error-policy"
  sourceID: string
  order: number
  asyncBoundaryMarker: string
  payloadKeys: string[]
  beforePayloadHash: string
  afterPayloadHash: string
  sequence: number
}

export interface OpenCodeHookHotReloadLiveReadback {
  pluginID: string
  operation: "watch" | "dispose" | "replace" | "reload"
  generationBefore: number
  generationAfter: number
  cleanupKeys: string[]
  invalidatedCacheKeys: string[]
  registryKeys: string[]
  watcherEventID: string
  debounceBucket: string
  sequence: number
}

export interface OpenCodeHookRegistryLiveReadback {
  registryKind: "command" | "provider" | "tool" | "ui"
  registryKey: string
  sourceID: string
  entryKeys: string[]
  previousEntryObserved: boolean
  sequence: number
}

export interface OpenCodeHookCleanupLiveReadback {
  scopeID: string
  pluginID: string
  cleanupKeys: string[]
  disposeOrder: number
  reloadGeneration: number
  sequence: number
}

export interface OpenCodeHookLiveRuntimeFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-hook-live-runtime-fixture"
  fixtureID: "opencode-hook:live-runtime-fixture"
  exactDiffStatus: "live-runtime-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  fixtureDiffTarget: "hook.plugin-lifecycle-replay"
  relatedFixtureDiffTargets: Array<"tool.contract-envelope-replay" | "provider.raw-frame-replay">
  coveredBranchIDs: Array<Extract<
    OpenCodeHookSourceMatrixBranchID,
    | "hook-handler-chain"
    | "hook-observer-chain"
    | "hook-scheduler-error-policy"
    | "plugin-event-mapper"
    | "plugin-hot-reload-cleanup"
    | "command-registry"
    | "provider-registry"
    | "tool-registry"
    | "ui-registry"
    | "live-plugin-runtime"
    | "hot-reload-side-effects"
    | "exact-hook-event-timing"
  >>
  pluginRuntimeReadback: OpenCodeHookPluginRuntimeLiveReadback[]
  hookTimingReadback: OpenCodeHookTimingLiveReadback[]
  hotReloadReadback: OpenCodeHookHotReloadLiveReadback[]
  registryReadback: OpenCodeHookRegistryLiveReadback[]
  cleanupReadback: OpenCodeHookCleanupLiveReadback[]
  hookRuntimeProjection: OpenCodeHookRuntimeProjection
  retainedFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeHookLiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeHookLiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeHookLiveRuntimeFixtureIssue[]
}

const OPENCODE_HOOK_LIFECYCLE_NATIVE_EXACT_EVIDENCE_REFS = [
  "conformance:opencode-hook-lifecycle-native-exact-fixture",
  "hook-lifecycle-native-exact:opencode",
]

const OPENCODE_HOOK_LIFECYCLE_NATIVE_EXACT_FIXTURE_IDS = [
  "opencode-hook-lifecycle:native-exact-fixture",
]

export type ProductHookSourceMatrixProduct = "pi-mono" | "nanobot" | "hermes-agent"
export type ProductHookSourceMatrixBranchStatus = "partial" | "missing"

export interface ProductHookSourceRef {
  id: string
  product: ProductHookSourceMatrixProduct
  repo: "earendil-works/pi" | "HKUDS/nanobot" | "NousResearch/hermes-agent"
  ref: string
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-10"
}

export type ProductHookSourceMatrixBranchID =
  | "plugin-or-extension-definition"
  | "plugin-or-extension-loader"
  | "hook-handler-chain"
  | "hook-observer-chain"
  | "hook-scheduler-error-policy"
  | "plugin-event-mapper"
  | "plugin-cleanup"
  | "command-registry"
  | "provider-registry"
  | "tool-registry"
  | "ui-registry"
  | "live-plugin-runtime"
  | "lifecycle-side-effects"
  | "exact-hook-event-timing"

export interface ProductHookSourceMatrixBranchAnchor {
  product: ProductHookSourceMatrixProduct
  branchID: ProductHookSourceMatrixBranchID
  status: ProductHookSourceMatrixBranchStatus
  sourceRefIDs: string[]
  hookAtomIDs: string[]
  hookPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface ProductHookSourceMatrixSnapshot {
  schemaVersion: 1
  product: ProductHookSourceMatrixProduct
  upstreamRef: string
  pinnedRepo: ProductHookSourceRef["repo"]
  pinnedRef: string
  evidenceRef: string
  fixtureID: string
  sourceRefs: ProductHookSourceRef[]
  branchAnchors: ProductHookSourceMatrixBranchAnchor[]
  partialBranchIDs: ProductHookSourceMatrixBranchID[]
  missingBranchIDs: ProductHookSourceMatrixBranchID[]
  coveredHookAtomIDs: string[]
  coveredHookPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

const OPENCODE_HOOK_SOURCE_REFS: OpenCodeHookSourceRef[] = [
  {
    id: "plugin-core",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin.ts",
    symbols: ["PluginV2", "ID", "Hooks", "HookFunctions", "define", "Interface", "Service", "layer", "defaultLayer"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "plugin-boot",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/boot.ts",
    symbols: ["PluginBoot", "Interface", "Service", "layer", "defaultLayer"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "plugin-provider",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider.ts",
    symbols: ["ProviderPlugins"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "local-command-registry",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-command-registry.ts",
    symbols: ["createOpenCodeCommandRegistryBridge", "openCodeCommandRegistryRun", "captureOpenCodeCommandRegistryNativeExactFixture", "verifyOpenCodeCommandRegistryNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-hook-handler",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-hook-handler.ts",
    symbols: ["createOpenCodeHookHandler", "openCodeHookHandlerRun", "captureOpenCodeHookHandlerNativeExactFixture", "verifyOpenCodeHookHandlerNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-hook-observer",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-hook-observer.ts",
    symbols: ["createOpenCodeHookObserver", "openCodeHookObserverNotify", "captureOpenCodeHookObserverNativeExactFixture", "verifyOpenCodeHookObserverNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-hook-scheduler",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-hook-scheduler.ts",
    symbols: ["createOpenCodeHookScheduler", "openCodeHookSchedulerTrigger", "openCodeHookSchedulerList", "captureOpenCodeHookSchedulerNativeExactFixture", "verifyOpenCodeHookSchedulerNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-hook-error-defaults",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-hook-error-defaults.ts",
    symbols: ["createOpenCodeHookErrorDefaults", "createOpenCodeHookHost", "captureOpenCodeHookErrorDefaultsNativeExactFixture", "verifyOpenCodeHookErrorDefaultsNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-file-watcher",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-file-watcher.ts",
    symbols: ["createOpenCodeFileWatcherPlan", "createOpenCodeFileWatcherRuntime", "createOpenCodeFileWatcherNativeSubscribeRuntime", "captureOpenCodeFileWatcherNativeExactFixture", "verifyOpenCodeFileWatcherNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-plugin-hot-reload-cleanup",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-plugin-hot-reload-cleanup.ts",
    symbols: ["createOpenCodePluginHotReloadCleanup", "createOpenCodePluginHotReloadMetadata", "captureOpenCodePluginHotReloadCleanupNativeExactFixture", "captureOpenCodePluginHotReloadMetaNativeExactFixture", "verifyOpenCodePluginHotReloadCleanupNativeExactFixture", "verifyOpenCodePluginHotReloadMetaNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-plugin-event-mapper",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-plugin-event-mapper.ts",
    symbols: ["createOpenCodeNativePluginEventMapper", "captureOpenCodePluginEventMapperNativeExactFixture", "verifyOpenCodePluginEventMapperNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-plugin-loader",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-plugin-loader.ts",
    symbols: ["createOpenCodeNativePluginLoaderAtom", "openCodeNativePluginLoaderLoad", "captureOpenCodePluginLoaderNativeExactFixture", "verifyOpenCodePluginLoaderNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-plugin-provider-registry",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-plugin-provider-registry.ts",
    symbols: ["createOpenCodePluginProviderRegistryBridge", "captureOpenCodePluginProviderRegistryNativeExactFixture", "verifyOpenCodePluginProviderRegistryNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-plugin-tool-registry",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-plugin-tool-registry.ts",
    symbols: ["createOpenCodePluginToolRegistryBridge", "captureOpenCodePluginToolRegistryNativeExactFixture", "verifyOpenCodePluginToolRegistryNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-plugin-ui-registry",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-plugin-ui-registry.ts",
    symbols: ["createOpenCodePluginUIRegistryBridge", "captureOpenCodePluginUIRegistryNativeExactFixture", "verifyOpenCodePluginUIRegistryNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-plugin-v2-definition",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-plugin-v2-definition.ts",
    symbols: ["defineOpenCodePluginV2", "createOpenCodePluginV2Service", "captureOpenCodePluginV2DefinitionNativeExactFixture", "verifyOpenCodePluginV2DefinitionNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-plugin-spec-loader",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/plugin-loader.ts",
    symbols: ["loadOpenCodePlugins", "captureOpenCodePluginRuntimeImportNativeExactFixture", "verifyOpenCodePluginRuntimeImportNativeExactFixture", "openCodeNpmAdd", "captureOpenCodePluginNpmInstallNativeExactFixture", "verifyOpenCodePluginNpmInstallNativeExactFixture"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-hook-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-hooks/src/port-fixtures.ts",
    symbols: ["projectOpenCodeHookRuntimeProjection", "OpenCodeHookRuntimeProjection"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-hook-live-runtime-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-hooks/src/port-fixtures.ts",
    symbols: ["captureOpenCodeHookLiveRuntimeFixture", "verifyOpenCodeHookLiveRuntimeFixture", "OpenCodeHookLiveRuntimeFixture"],
    evidence: "local-source:2026-06-12",
  },
]

export function projectOpenCodeHookRuntimeProjection(events: OpenCodeHookRuntimeProjectionEvent[]): OpenCodeHookRuntimeProjection {
  const pluginRuntime = events
    .filter((event): event is Extract<OpenCodeHookRuntimeProjectionEvent, { type: "plugin.runtime" }> => event.type === "plugin.runtime")
    .map((event) => ({
      pluginID: event.pluginID,
      sourceKind: event.sourceKind,
      hookNames: uniqueStrings(event.hookNames),
      registryKeys: uniqueStrings(event.registryKeys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.pluginID.localeCompare(right.pluginID))

  const hotReloadSideEffects = events
    .filter((event): event is Extract<OpenCodeHookRuntimeProjectionEvent, { type: "hot.reload" }> => event.type === "hot.reload")
    .map((event) => ({
      pluginID: event.pluginID,
      operation: event.operation,
      cleanupKeys: uniqueStrings(event.cleanupKeys),
      registryKeys: uniqueStrings(event.registryKeys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.pluginID.localeCompare(right.pluginID))

  const hookEventTiming = events
    .filter((event): event is Extract<OpenCodeHookRuntimeProjectionEvent, { type: "hook.timing" }> => event.type === "hook.timing")
    .map((event) => ({
      eventName: event.eventName,
      phase: event.phase,
      sourceID: typeof event.sourceID === "string" && event.sourceID.length > 0 ? event.sourceID : null,
      order: event.order,
      asyncBoundaryObserved: event.asyncBoundaryObserved === true,
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.order - right.order || left.eventName.localeCompare(right.eventName))

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-hook:runtime-projection" as const,
    evidenceRef: "conformance:opencode-hook-runtime-projection" as const,
    coveredBranchIDs: [
      "live-plugin-runtime",
      "hot-reload-side-effects",
      "exact-hook-event-timing",
    ] as OpenCodeHookRuntimeProjection["coveredBranchIDs"],
    retainedFields: [
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
    ],
	    lossyFields: [
	      "real @npmcli/arborist reify execution",
	      "real @parcel/watcher native binding execution",
	      "module cache invalidation ordering",
	      "registry mutation object identity",
	      "plugin dispose/reload race ordering",
	    ],
    pluginRuntime,
    hotReloadSideEffects,
    hookEventTiming,
	    knownGaps: [
	      "opencode-real-npm-arborist-reify-not-replayed",
	      "opencode-file-watcher-native-binding-not-replayed",
	    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeHookLiveRuntimeFixture(
  input: OpenCodeHookLiveRuntimeFixtureInput = {},
): OpenCodeHookLiveRuntimeFixture {
  const pluginID = input.pluginID ?? "project-plugin.fixture"
  const sourceID = input.sourceID ?? "project-plugin.ts"
  const hookEventName = input.hookEventName ?? "tool.execute.before"
  const commandName = input.commandName ?? "fixture.command"
  const providerID = input.providerID ?? "fixture-provider"
  const toolName = input.toolName ?? "fixture.tool"
  const uiProviderID = input.uiProviderID ?? "fixture.ui"
  const sourceKind = "project" as const
  const moduleExportKeys = uniqueStrings(["default", "plugin"])
  const hookNames = uniqueStrings(["chat.params", "tool.execute.after", hookEventName])
  const registryKeys = uniqueStrings([
    `command:${commandName}`,
    `provider:${providerID}`,
    `tool:${toolName}`,
    `ui:${uiProviderID}`,
  ])
  const payloadKeys = uniqueStrings(["args", "context", "metadata", "tool"])
  const cleanupKeys = uniqueStrings(["command.registry", "hook.bus", "provider.registry", "tool.registry", "ui.registry", "watcher"])
  const invalidatedCacheKeys = uniqueStrings([sourceID, pluginID])
  const pluginRuntimeReadback: OpenCodeHookPluginRuntimeLiveReadback[] = [
    {
      pluginID,
      sourceID,
      sourceKind,
      moduleExportKeys,
      hookNames,
      registryKeys,
      moduleEvaluationHash: fingerprintObject({ pluginID, sourceID, moduleExportKeys, hookNames, registryKeys }),
      sequence: 1,
    },
  ]
  const hookTimingReadback: OpenCodeHookTimingLiveReadback[] = [
    {
      eventName: hookEventName,
      phase: "handler",
      sourceID: pluginID,
      order: 2,
      asyncBoundaryMarker: "source-order-await",
      payloadKeys,
      beforePayloadHash: fingerprintObject({ hookEventName, payloadKeys, phase: "before" }),
      afterPayloadHash: fingerprintObject({ hookEventName, payloadKeys, phase: "after" }),
      sequence: 2,
    },
  ]
  const hotReloadReadback: OpenCodeHookHotReloadLiveReadback[] = [
    {
      pluginID,
      operation: "replace",
      generationBefore: 4,
      generationAfter: 5,
      cleanupKeys,
      invalidatedCacheKeys,
      registryKeys,
      watcherEventID: "watch_evt_hook_001",
      debounceBucket: "deterministic-local",
      sequence: 3,
    },
  ]
  const registryReadback: OpenCodeHookRegistryLiveReadback[] = [
    {
      registryKind: "command",
      registryKey: `command:${commandName}`,
      sourceID: pluginID,
      entryKeys: uniqueStrings(["args", "description", "handler", "name", "source"]),
      previousEntryObserved: false,
      sequence: 4,
    },
    {
      registryKind: "provider",
      registryKey: `provider:${providerID}`,
      sourceID: pluginID,
      entryKeys: uniqueStrings(["auth", "id", "models", "source"]),
      previousEntryObserved: false,
      sequence: 5,
    },
    {
      registryKind: "tool",
      registryKey: `tool:${toolName}`,
      sourceID: pluginID,
      entryKeys: uniqueStrings(["execute", "name", "schema", "source"]),
      previousEntryObserved: false,
      sequence: 6,
    },
    {
      registryKind: "ui",
      registryKey: `ui:${uiProviderID}`,
      sourceID: pluginID,
      entryKeys: uniqueStrings(["id", "render", "source", "theme"]),
      previousEntryObserved: false,
      sequence: 7,
    },
  ]
  const cleanupReadback: OpenCodeHookCleanupLiveReadback[] = [
    {
      scopeID: "scope_project_plugin_fixture",
      pluginID,
      cleanupKeys,
      disposeOrder: 8,
      reloadGeneration: 5,
      sequence: 8,
    },
  ]
  const hookRuntimeProjection = projectOpenCodeHookRuntimeProjection([
    {
      type: "plugin.runtime",
      pluginID,
      sourceKind,
      hookNames,
      registryKeys,
      sequence: 1,
    },
    {
      type: "hook.timing",
      eventName: hookEventName,
      phase: "handler",
      sourceID: pluginID,
      order: 2,
      asyncBoundaryObserved: true,
      sequence: 2,
    },
    {
      type: "hot.reload",
      pluginID,
      operation: "replace",
      cleanupKeys,
      registryKeys,
      sequence: 3,
    },
  ])
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-hook-live-runtime-fixture" as const,
    fixtureID: "opencode-hook:live-runtime-fixture" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    fixtureDiffTarget: "hook.plugin-lifecycle-replay" as const,
    relatedFixtureDiffTargets: ["tool.contract-envelope-replay" as const, "provider.raw-frame-replay" as const],
    coveredBranchIDs: [
      "hook-handler-chain",
      "hook-observer-chain",
      "hook-scheduler-error-policy",
      "plugin-event-mapper",
      "plugin-hot-reload-cleanup",
      "command-registry",
      "provider-registry",
      "tool-registry",
      "ui-registry",
      ...hookRuntimeProjection.coveredBranchIDs,
    ] as OpenCodeHookLiveRuntimeFixture["coveredBranchIDs"],
    pluginRuntimeReadback,
    hookTimingReadback,
    hotReloadReadback,
    registryReadback,
    cleanupReadback,
    hookRuntimeProjection,
    retainedFields: [
      "plugin source and module export readback",
      "hook name and registry key readback",
      "source ordered hook timing readback",
      "hook payload before/after hash readback",
      "hot reload generation and watcher readback",
      "module cache invalidation key readback",
      "command/provider/tool/ui registry entry key readback",
      "cleanup scope and dispose order marker",
    ],
	    lossyFields: [
	      "real @npmcli/arborist reify execution",
	      "real @parcel/watcher native binding execution",
	      "native module cache invalidation ordering",
	      "native registry mutation object identity",
	      "native plugin dispose/reload race ordering",
	      "native command/provider/tool/ui registry side effects",
	    ],
    knownGaps: [
	      "opencode-hook-live-runtime-fixture-partial-native-gap",
	      "opencode-real-npm-arborist-reify-not-replayed",
	      "opencode-file-watcher-native-binding-not-replayed",
	      "opencode-plugin-registry-object-identity-not-exact",
      "opencode-plugin-dispose-reload-race-not-exact",
      "opencode-hook-registry-side-effects-not-exact",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeHookLiveRuntimeFixture(
  fixture: OpenCodeHookLiveRuntimeFixture,
): OpenCodeHookLiveRuntimeFixtureVerification {
  const issues: OpenCodeHookLiveRuntimeFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== "opencode-hook:live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-hook-live-runtime-fixture") {
    addIssue("opencode-hook-live-runtime.identity", "OpenCode hook live runtime fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== false || fixture.exactDiffStatus !== "live-runtime-partial" || fixture.coverageStatus !== "partial") {
    addIssue("opencode-hook-live-runtime.native-claim", "OpenCode hook live runtime fixture must stay partial and cannot claim native parity.")
  }
  for (const branchID of ["hook-handler-chain", "hook-observer-chain", "hook-scheduler-error-policy", "plugin-event-mapper", "plugin-hot-reload-cleanup", "command-registry", "provider-registry", "tool-registry", "ui-registry", "live-plugin-runtime", "hot-reload-side-effects", "exact-hook-event-timing"] as const) {
    if (!fixture.coveredBranchIDs.includes(branchID)) {
      addIssue("opencode-hook-live-runtime.missing-branch", `OpenCode hook live runtime fixture no longer covers ${branchID}.`)
    }
  }
  if (fixture.hookRuntimeProjection.fixtureID !== "opencode-hook:runtime-projection" || fixture.hookRuntimeProjection.evidenceRef !== "conformance:opencode-hook-runtime-projection") {
    addIssue("opencode-hook-live-runtime.runtime-projection", "OpenCode hook live runtime fixture lost the nested runtime projection identity.")
  }
  const pluginRuntime = fixture.pluginRuntimeReadback.some((record) =>
    record.moduleEvaluationHash.length === 16 &&
    record.moduleExportKeys.includes("default") &&
    record.moduleExportKeys.includes("plugin") &&
    record.hookNames.includes("tool.execute.before") &&
    record.registryKeys.some((key) => key.startsWith("tool:")) &&
    record.sourceID.length > 0,
  )
  if (!pluginRuntime) {
    addIssue("opencode-hook-live-runtime.plugin-runtime-readback", "OpenCode hook live runtime fixture must retain plugin source, export, hook, registry, and module evaluation readback.")
  }
  const hookTiming = fixture.hookTimingReadback.some((record) =>
    record.eventName === "tool.execute.before" &&
    record.phase === "handler" &&
    record.asyncBoundaryMarker === "source-order-await" &&
    record.payloadKeys.includes("args") &&
    record.beforePayloadHash.length === 16 &&
    record.afterPayloadHash.length === 16 &&
    record.order > 0,
  )
  if (!hookTiming) {
    addIssue("opencode-hook-live-runtime.hook-timing-readback", "OpenCode hook live runtime fixture must retain source-ordered hook timing and payload hash readback.")
  }
  const hotReload = fixture.hotReloadReadback.some((record) =>
    record.operation === "replace" &&
    record.generationAfter > record.generationBefore &&
    record.cleanupKeys.includes("hook.bus") &&
    record.invalidatedCacheKeys.length > 0 &&
    record.watcherEventID.length > 0 &&
    record.debounceBucket === "deterministic-local",
  )
  if (!hotReload) {
    addIssue("opencode-hook-live-runtime.hot-reload-readback", "OpenCode hook live runtime fixture must retain hot reload cleanup, watcher, generation, and cache invalidation readback.")
  }
  const registryKinds = new Set(fixture.registryReadback.map((record) => record.registryKind))
  for (const registryKind of ["command", "provider", "tool", "ui"] as const) {
    if (!registryKinds.has(registryKind)) {
      addIssue("opencode-hook-live-runtime.registry-readback", `OpenCode hook live runtime fixture no longer retains ${registryKind} registry readback.`)
    }
  }
  if (!fixture.registryReadback.every((record) => record.registryKey.length > 0 && record.sourceID.length > 0 && record.entryKeys.length > 0)) {
    addIssue("opencode-hook-live-runtime.registry-entry-readback", "OpenCode hook live runtime fixture must retain registry key/source/entry key readback.")
  }
  const cleanup = fixture.cleanupReadback.some((record) =>
    record.scopeID.length > 0 &&
    record.disposeOrder > 0 &&
    record.reloadGeneration > 0 &&
    record.cleanupKeys.includes("hook.bus") &&
    record.cleanupKeys.includes("watcher"),
  )
  if (!cleanup) {
    addIssue("opencode-hook-live-runtime.cleanup-readback", "OpenCode hook live runtime fixture must retain cleanup scope, dispose order, and reload generation readback.")
  }
  for (const requiredGap of [
	    "opencode-hook-live-runtime-fixture-partial-native-gap",
	    "opencode-real-npm-arborist-reify-not-replayed",
	    "opencode-file-watcher-native-binding-not-replayed",
	    "opencode-plugin-registry-object-identity-not-exact",
    "opencode-plugin-dispose-reload-race-not-exact",
    "opencode-hook-registry-side-effects-not-exact",
  ]) {
    if (!fixture.knownGaps.includes(requiredGap)) {
      addIssue("opencode-hook-live-runtime.native-gaps", `OpenCode hook live runtime fixture no longer records ${requiredGap}.`)
    }
  }
  if (!fixture.retainedFields.includes("source ordered hook timing readback") || !fixture.retainedFields.includes("cleanup scope and dispose order marker") || !fixture.lossyFields.some((field) => /native|identity|side effects/i.test(field))) {
    addIssue("opencode-hook-live-runtime.retained-lossy-fields", "OpenCode hook live runtime fixture must retain local readback keys and name native lossiness.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

const PI_HOOK_SOURCE_REFS: ProductHookSourceRef[] = [
  {
    id: "pi-extension-loader",
    product: "pi-mono",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/core/extensions/loader.ts",
    symbols: ["createExtensionRuntime", "loadExtensionFromFactory", "loadExtensions", "discoverAndLoadExtensions"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "pi-extension-runner",
    product: "pi-mono",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/core/extensions/runner.ts",
    symbols: ["ExtensionRunner", "ExtensionErrorListener", "NewSessionHandler", "ReloadHandler", "ShutdownHandler"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "pi-extension-types",
    product: "pi-mono",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/core/extensions/types.ts",
    symbols: ["ExtensionAPI", "ExtensionContext", "ExtensionEvent", "ExtensionFactory", "ExtensionRuntime", "defineTool"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "pi-extension-wrapper",
    product: "pi-mono",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/core/extensions/wrapper.ts",
    symbols: ["wrapRegisteredTool", "wrapRegisteredTools"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "pi-dynamic-tools-example",
    product: "pi-mono",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/examples/extensions/dynamic-tools.ts",
    symbols: ["normalizeToolName", "dynamicToolsExtension"],
    evidence: "github-tree:2026-06-10",
  },
]

const NANOBOT_HOOK_SOURCE_REFS: ProductHookSourceRef[] = [
  {
    id: "nanobot-agent-hook",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/agent/hook.py",
    symbols: ["AgentHookContext", "AgentHook", "CompositeHook", "SDKCaptureHook", "wants_streaming", "finalize_content"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "nanobot-progress-hook",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/agent/progress_hook.py",
    symbols: ["AgentProgressHook", "wants_streaming", "_strip_think", "_tool_hint", "_on_progress_accepts", "finalize_content"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "nanobot-agent-runner",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/agent/runner.py",
    symbols: ["AgentRunSpec", "AgentRunResult", "AgentRunner", "_append_injected_messages", "_build_request_kwargs", "_normalize_tool_result"],
    evidence: "github-tree:2026-06-10",
  },
]

const HERMES_HOOK_SOURCE_REFS: ProductHookSourceRef[] = [
  {
    id: "hermes-shell-hooks",
    product: "hermes-agent",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/shell_hooks.py",
    symbols: ["ShellHookSpec", "register_from_config", "iter_configured_hooks", "_parse_hooks_block", "_make_callback", "_parse_response", "run_once"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "hermes-cli-plugins",
    product: "hermes-agent",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "hermes_cli/plugins.py",
    symbols: ["PluginManifest", "LoadedPlugin", "PluginContext", "PluginManager", "register_hook", "invoke_hook", "discover_plugins"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "hermes-cli-plugins-cmd",
    product: "hermes-agent",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "hermes_cli/plugins_cmd.py",
    symbols: ["cmd_install", "cmd_update", "cmd_remove", "cmd_enable", "cmd_disable", "cmd_list", "dashboard_install_plugin"],
    evidence: "github-tree:2026-06-10",
  },
]

function openCodeHookSourceBranchAnchor(
  input: Omit<OpenCodeHookSourceMatrixBranchAnchor, "exactDiffStatus" | "nativeParityClaim" | "nativeEvidenceRefs" | "fixtureIDs"> &
    Partial<Pick<OpenCodeHookSourceMatrixBranchAnchor, "exactDiffStatus" | "nativeParityClaim" | "nativeEvidenceRefs" | "fixtureIDs">>,
): OpenCodeHookSourceMatrixBranchAnchor {
  const nativeEvidenceRefs = input.status === "native-exact"
    ? uniqueStrings(input.localEvidenceRefs.filter((ref) => ref.includes("native-exact")))
    : []
  const fixtureIDs = input.status === "native-exact"
    ? nativeEvidenceRefs.filter((ref) => ref.endsWith(":native-exact-fixture"))
    : []
  return {
    ...input,
    exactDiffStatus: input.exactDiffStatus ?? (input.status === "native-exact" ? "native-exact" : "exact-diff-partial"),
    nativeParityClaim: input.nativeParityClaim ?? (input.status === "native-exact"),
    nativeEvidenceRefs: input.nativeEvidenceRefs ?? nativeEvidenceRefs,
    fixtureIDs: input.fixtureIDs ?? fixtureIDs,
  }
}

function productHookSourceBranchAnchor(input: ProductHookSourceMatrixBranchAnchor): ProductHookSourceMatrixBranchAnchor {
  return input
}

export function buildOpenCodeHookSourceMatrixSnapshot(): OpenCodeHookSourceMatrixSnapshot {
  const branchAnchors: OpenCodeHookSourceMatrixBranchAnchor[] = [
    openCodeHookSourceBranchAnchor({
      branchID: "plugin-v2-definition",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "local-plugin-v2-definition"],
      hookAtomIDs: ["opencode.hook.plugin-bridge"],
      hookPortIDs: ["hook.bus"],
      localEvidenceRefs: [
        "opencode-plugin-v2-definition:native-exact-fixture",
        "plugin-v2-definition-native-exact:opencode",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["PluginV2", "HookFunctions", "define", "Service.add", "Service.triggerFor", "replace closes scope", "draft output finish"],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "plugin-boot-loader",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "plugin-boot", "local-plugin-loader", "local-plugin-hot-reload-cleanup"],
      hookAtomIDs: ["opencode.plugin.loader", "opencode.hook.plugin-bridge"],
      hookPortIDs: ["hook.bus", "hook.cleanup-scope"],
      localEvidenceRefs: [
        "opencode-plugin-loader:native-exact-fixture",
        "plugin-loader-native-exact:opencode",
        "opencode-hook-plugin-bridge:native-exact-fixture",
        "hook-plugin-bridge-native-exact:opencode",
        "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
        "plugin-hot-reload-cleanup-native-exact:opencode",
      ],
      localMarkers: ["PluginBoot", "createOpenCodePluginLoaderAtom", "manifest normalizer", "config hook registration order", "plugin bridge source order"],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "hook-handler-chain",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "local-hook-handler", "local-plugin-event-mapper"],
      hookAtomIDs: ["opencode.hook.handler-adapter", "opencode.plugin.event-mapper"],
      hookPortIDs: ["hook.handler-chain"],
      localEvidenceRefs: [
        "opencode-hook-handler:native-exact-fixture",
        "hook-handler-native-exact:opencode",
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["Plugin.trigger", "tool.execute.before", "tool.execute.after", "chat hooks", "mutable output reference", "source-order output mutation"],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "hook-observer-chain",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "local-hook-observer", "local-plugin-event-mapper"],
      hookAtomIDs: ["opencode.hook.observer-adapter", "opencode.plugin.event-mapper"],
      hookPortIDs: ["hook.observer-chain"],
      localEvidenceRefs: [
        "opencode-hook-observer:native-exact-fixture",
        "hook-observer-native-exact:opencode",
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["bus.subscribeAll", "hook.event", "event observer", "source order", "fire-and-forget observer"],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "hook-scheduler-error-policy",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "plugin-boot", "local-hook-scheduler", "local-hook-error-defaults"],
      hookAtomIDs: ["opencode.hook.scheduler-defaults", "opencode.hook.error-defaults"],
      hookPortIDs: ["hook.scheduler", "hook.error-policy"],
      localEvidenceRefs: [
        "opencode-hook-scheduler:native-exact-fixture",
        "hook-scheduler-native-exact:opencode",
        "opencode-hook-error-defaults:native-exact-fixture",
        "hook-error-defaults-native-exact:opencode",
      ],
      localMarkers: ["Plugin.trigger", "Plugin.list", "source-ordered scheduler", "empty-name noop", "fail-fast handler error", "fail-fast observer error"],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "plugin-event-mapper",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "local-plugin-event-mapper"],
      hookAtomIDs: ["opencode.plugin.event-mapper"],
      hookPortIDs: ["hook.handler-chain", "hook.observer-chain"],
      localEvidenceRefs: [
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
        "opencode-hook:source-matrix",
      ],
      localMarkers: [
        "event-observer-and-tool-before",
        "provider-request-params-and-headers",
        "input-context-system-session-and-text-hooks",
        "delegated-hook-bridges",
      ],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "plugin-hot-reload-cleanup",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "plugin-boot", "local-plugin-hot-reload-cleanup"],
      hookAtomIDs: ["opencode.plugin.hot-reload-cleanup"],
      hookPortIDs: ["hook.cleanup-scope"],
      localEvidenceRefs: [
        "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
        "plugin-hot-reload-cleanup-native-exact:opencode",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["scope.addCleanup", "replacement-disposes-existing-before-track", "scope-dispose-removes-tracked-source", "host-state-isolated"],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "command-registry",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "plugin-boot", "local-command-registry"],
      hookAtomIDs: ["opencode.registry.command"],
      hookPortIDs: ["registry.command"],
      localEvidenceRefs: [
        "opencode-command-registry:native-exact-fixture",
        "command-registry-native-exact:opencode",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["command.execute.before", "source-order-shared-output", "event-session-fallback", "cleanup-removes-hook", "fail-fast-hook-error"],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "provider-registry",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "plugin-boot", "plugin-provider", "local-plugin-provider-registry"],
      hookAtomIDs: ["opencode.registry.provider-plugin", "opencode.plugin.provider-registry-bridge"],
      hookPortIDs: ["registry.provider"],
      localEvidenceRefs: [
        "opencode-plugin-provider-registry:native-exact-fixture",
        "plugin-provider-registry-native-exact:opencode",
        "opencode-provider:source-matrix",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["ProviderPlugins", "registerProvider", "auth-record-from-plugin-list", "provider-model-hook-filter", "source-scoped-provider-registration"],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "tool-registry",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "plugin-boot", "local-plugin-tool-registry"],
      hookAtomIDs: ["opencode.registry.tool-definition"],
      hookPortIDs: ["tool.registry"],
      localEvidenceRefs: [
        "opencode-plugin-tool-registry:native-exact-fixture",
        "plugin-tool-registry-native-exact:opencode",
        "opencode-tool:source-matrix",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["hooks.tool", "opencode.tool", "source-scoped-tool-registration", "definition-reference-retained"],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "ui-registry",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "plugin-boot", "local-plugin-ui-registry"],
      hookAtomIDs: ["opencode.registry.ui-provider", "opencode.plugin.ui-registry-bridge"],
      hookPortIDs: ["registry.ui"],
      localEvidenceRefs: [
        "opencode-plugin-ui-registry:native-exact-fixture",
        "plugin-ui-registry-native-exact:opencode",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["hooks.ui", "registerUIProvider", "source-scoped-ui-registration", "provider-reference-retained"],
      knownGaps: [],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "live-plugin-runtime",
      status: "partial",
      sourceRefIDs: ["plugin-core", "plugin-boot", "local-plugin-spec-loader", "local-hook-runtime-projection", "local-hook-live-runtime-fixture"],
      hookAtomIDs: ["opencode.plugin.loader", "opencode.hook.plugin-bridge"],
      hookPortIDs: ["hook.bus"],
      localEvidenceRefs: [
        "opencode-hook:source-matrix",
        "opencode-hook:runtime-projection",
        "opencode-hook:live-runtime-fixture",
        "opencode-plugin-runtime-import:native-exact-fixture",
        "plugin-runtime-import-native-exact:opencode",
        "opencode-plugin-package-compatibility:native-exact-fixture",
        "plugin-package-compatibility-native-exact:opencode",
        "opencode-plugin-npm-install:native-exact-fixture",
        "plugin-npm-install-native-exact:opencode",
      ],
      localMarkers: [
        "plugin-runtime:projected",
        "hook-names:retained",
        "module import side effects native",
        "default/plugin/opencode export priority",
        "scope cleanup removes live hook",
        "loadExternal parallel retry native",
        "package target and compatibility native",
        "npm add cache/reify plan native",
        "real arborist reify:not-replayed",
      ],
      knownGaps: ["opencode-hook-live-runtime-fixture-partial-native-gap", "opencode-real-npm-arborist-reify-not-replayed"],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "hot-reload-side-effects",
      status: "partial",
      sourceRefIDs: ["plugin-core", "plugin-boot", "local-file-watcher", "local-hook-runtime-projection", "local-hook-live-runtime-fixture"],
      hookAtomIDs: ["opencode.plugin.hot-reload-cleanup", "opencode.file.watcher"],
      hookPortIDs: ["hook.cleanup-scope"],
      localEvidenceRefs: [
        "opencode-hook:source-matrix",
        "opencode-hook:runtime-projection",
        "opencode-hook:live-runtime-fixture",
        "opencode-plugin-hot-reload-meta:native-exact-fixture",
        "plugin-hot-reload-meta-native-exact:opencode",
        "opencode-file-watcher:native-exact-fixture",
        "file-watcher-native-exact:opencode",
      ],
      localMarkers: ["hot-reload:projected", "cleanup-keys:retained", "plugin-meta file/npm fingerprint native", "plugin-meta load-count/theme native", "file-watcher event mapping native", "git HEAD watch native", "watcher subscribe callback native", "watcher subscribe timeout cleanup native", "parcel-native-binding:not-replayed"],
      knownGaps: ["opencode-hook-live-runtime-fixture-partial-native-gap", "opencode-file-watcher-native-binding-not-replayed"],
    }),
    openCodeHookSourceBranchAnchor({
      branchID: "exact-hook-event-timing",
      status: "native-exact",
      sourceRefIDs: ["plugin-core", "local-hook-handler", "local-hook-observer", "local-hook-scheduler", "local-plugin-event-mapper"],
      hookAtomIDs: ["opencode.hook.handler-adapter", "opencode.hook.observer-adapter", "opencode.hook.scheduler-defaults", "opencode.plugin.event-mapper"],
      hookPortIDs: ["hook.handler-chain", "hook.observer-chain", "hook.scheduler"],
      localEvidenceRefs: [
        "opencode-hook:source-matrix",
        "opencode-hook-handler:native-exact-fixture",
        "hook-handler-native-exact:opencode",
        "opencode-hook-observer:native-exact-fixture",
        "hook-observer-native-exact:opencode",
        "opencode-hook-scheduler:native-exact-fixture",
        "hook-scheduler-native-exact:opencode",
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
      ],
      localMarkers: ["Plugin.trigger", "hook-timing native", "async-boundary:observed", "source-order-await native", "event fire-and-forget native", "async-interleaving native", "timer await wall-clock native"],
      knownGaps: [],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-hook-source-matrix" as const,
    fixtureID: "opencode-hook:source-matrix" as const,
    sourceRefs: OPENCODE_HOOK_SOURCE_REFS,
    branchAnchors,
    nativeExactBranchIDs: branchAnchors.filter((anchor) => anchor.status === "native-exact").map((anchor) => anchor.branchID),
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredHookAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.hookAtomIDs)),
    coveredHookPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.hookPortIDs)),
    nativeEvidenceRefs: uniqueStrings([
      ...OPENCODE_HOOK_LIFECYCLE_NATIVE_EXACT_EVIDENCE_REFS,
      ...branchAnchors.flatMap((anchor) => anchor.nativeEvidenceRefs),
    ]),
    fixtureIDs: uniqueStrings([
      "opencode-hook:source-matrix",
      ...OPENCODE_HOOK_LIFECYCLE_NATIVE_EXACT_FIXTURE_IDS,
      ...branchAnchors.flatMap((anchor) => anchor.fixtureIDs),
    ]),
    knownGaps: uniqueStrings([
      "opencode-hook-source-matrix-covered-by-partial-fixture",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildPiMonoHookSourceMatrixSnapshot(): ProductHookSourceMatrixSnapshot {
  const product = "pi-mono" as const
  const branchAnchors: ProductHookSourceMatrixBranchAnchor[] = [
    productHookSourceBranchAnchor({
      product,
      branchID: "plugin-or-extension-definition",
      status: "partial",
      sourceRefIDs: ["pi-extension-types"],
      hookAtomIDs: ["pi.hook.extension-bridge", "pi.extension.loader"],
      hookPortIDs: ["hook.bus"],
      localEvidenceRefs: ["hook-port:hook.bus", "pi-hook:source-matrix"],
      localMarkers: ["ExtensionAPI", "ExtensionFactory", "ExtensionRuntime"],
      knownGaps: ["pi-extension-runtime-evaluation-not-replayed"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "plugin-or-extension-loader",
      status: "partial",
      sourceRefIDs: ["pi-extension-loader", "pi-extension-runner", "pi-extension-types"],
      hookAtomIDs: ["pi.extension.loader", "pi.hook.extension-bridge"],
      hookPortIDs: ["hook.bus", "hook.cleanup-scope"],
      localEvidenceRefs: ["hook-port:hook.bus", "current-module:pi-hook-source-locations"],
      localMarkers: ["discoverAndLoadExtensions", "createExtensionRuntime", "ExtensionRunner"],
      knownGaps: ["pi-live-extension-runtime-not-spawned"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "hook-handler-chain",
      status: "partial",
      sourceRefIDs: ["pi-extension-runner", "pi-extension-types"],
      hookAtomIDs: ["pi.hook.handler-adapter", "pi.extension.event-mapper"],
      hookPortIDs: ["hook.handler-chain"],
      localEvidenceRefs: ["hooks:handler-chain", "pi-hook:source-matrix"],
      localMarkers: ["ExtensionEvent", "ExtensionCommandContext", "mutable extension payload"],
      knownGaps: ["pi-extension-handler-output-merge-exactness-not-proven"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "hook-observer-chain",
      status: "partial",
      sourceRefIDs: ["pi-extension-runner", "pi-extension-types"],
      hookAtomIDs: ["pi.hook.observer-adapter"],
      hookPortIDs: ["hook.observer-chain"],
      localEvidenceRefs: ["hooks:observer-chain", "pi-hook:source-matrix"],
      localMarkers: ["extension event listener", "source order", "non-fatal observer errors"],
      knownGaps: ["pi-observer-side-effect-order-not-replayed"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "hook-scheduler-error-policy",
      status: "partial",
      sourceRefIDs: ["pi-extension-runner", "pi-extension-types"],
      hookAtomIDs: ["pi.hook.scheduler-defaults", "pi.hook.error-defaults"],
      hookPortIDs: ["hook.scheduler", "hook.error-policy"],
      localEvidenceRefs: ["hooks:scheduler", "hooks:error-policy"],
      localMarkers: ["extension event order", "ExtensionErrorListener", "collect-and-continue"],
      knownGaps: ["pi-extension-async-scheduler-timing-not-exact"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "plugin-event-mapper",
      status: "partial",
      sourceRefIDs: ["pi-extension-runner", "pi-extension-types"],
      hookAtomIDs: ["pi.extension.event-mapper"],
      hookPortIDs: ["hook.handler-chain", "hook.observer-chain"],
      localEvidenceRefs: ["hooks:bus", "pi-hook:source-matrix"],
      localMarkers: ["ExtensionEvent", "session events", "tool events", "permission events"],
      knownGaps: ["pi-extension-event-names-not-exhaustively-replayed"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "plugin-cleanup",
      status: "partial",
      sourceRefIDs: ["pi-extension-loader", "pi-extension-runner"],
      hookAtomIDs: ["pi.extension.cleanup"],
      hookPortIDs: ["hook.cleanup-scope"],
      localEvidenceRefs: ["hooks:cleanup-scope", "pi-hook:source-matrix"],
      localMarkers: ["ShutdownHandler", "ReloadHandler", "scope cleanup"],
      knownGaps: ["pi-extension-shutdown-side-effects-not-replayed"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "command-registry",
      status: "partial",
      sourceRefIDs: ["pi-extension-types"],
      hookAtomIDs: ["pi.registry.command"],
      hookPortIDs: ["registry.command"],
      localEvidenceRefs: ["hooks:command-registry", "pi-hook:source-matrix"],
      localMarkers: ["ExtensionCommandContext", "command registration", "source metadata"],
      knownGaps: ["pi-command-runtime-dispatch-not-replayed"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "provider-registry",
      status: "partial",
      sourceRefIDs: ["pi-extension-types"],
      hookAtomIDs: ["pi.registry.provider-extension", "pi.extension.provider-registry-bridge"],
      hookPortIDs: ["registry.provider"],
      localEvidenceRefs: ["hooks:provider-registry", "pi-provider:source-matrix"],
      localMarkers: ["registerProvider", "extension provider API"],
      knownGaps: ["pi-provider-extension-live-registry-not-replayed"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "tool-registry",
      status: "partial",
      sourceRefIDs: ["pi-extension-types", "pi-extension-wrapper", "pi-dynamic-tools-example"],
      hookAtomIDs: ["pi.registry.register-tool"],
      hookPortIDs: ["tool.registry"],
      localEvidenceRefs: ["hooks:tool-registry", "pi-hook:source-matrix"],
      localMarkers: ["defineTool", "wrapRegisteredTool", "dynamicToolsExtension"],
      knownGaps: ["pi-dynamic-tool-live-side-effects-not-replayed"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "ui-registry",
      status: "partial",
      sourceRefIDs: ["pi-extension-types"],
      hookAtomIDs: ["pi.registry.message-renderer", "pi.extension.ui-registry-bridge"],
      hookPortIDs: ["registry.ui"],
      localEvidenceRefs: ["hooks:ui-registry", "pi-hook:source-matrix"],
      localMarkers: ["registerUIProvider", "registerMessageRenderer", "extension UI API"],
      knownGaps: ["pi-ui-extension-render-side-effects-not-replayed"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "live-plugin-runtime",
      status: "missing",
      sourceRefIDs: ["pi-extension-loader", "pi-extension-runner"],
      hookAtomIDs: ["pi.extension.loader", "pi.hook.extension-bridge"],
      hookPortIDs: ["hook.bus"],
      localEvidenceRefs: ["pi-hook:source-matrix"],
      localMarkers: ["source-anchored-only", "live extension runtime:not-spawned"],
      knownGaps: ["pi-live-extension-runtime-not-spawned"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "lifecycle-side-effects",
      status: "missing",
      sourceRefIDs: ["pi-extension-loader", "pi-extension-runner"],
      hookAtomIDs: ["pi.extension.cleanup", "pi.extension.provider-registry-bridge", "pi.extension.ui-registry-bridge"],
      hookPortIDs: ["hook.cleanup-scope", "registry.provider", "registry.ui"],
      localEvidenceRefs: ["pi-hook:source-matrix"],
      localMarkers: ["reload/shutdown:not-replayed", "registry side effects:not-replayed"],
      knownGaps: ["pi-extension-lifecycle-side-effects-not-replayed"],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "exact-hook-event-timing",
      status: "missing",
      sourceRefIDs: ["pi-extension-runner", "pi-extension-types"],
      hookAtomIDs: ["pi.extension.event-mapper", "pi.hook.handler-adapter", "pi.hook.observer-adapter"],
      hookPortIDs: ["hook.handler-chain", "hook.observer-chain"],
      localEvidenceRefs: ["pi-hook:source-matrix"],
      localMarkers: ["wall-clock:not-replayed", "async extension timing:partial"],
      knownGaps: ["pi-hook-event-timing-not-exact"],
    }),
  ]
  return buildProductHookSourceMatrixSnapshot({
    product,
    upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    pinnedRepo: "earendil-works/pi",
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    evidenceRef: "conformance:pi-hook-source-matrix",
    fixtureID: "pi-hook:source-matrix",
    sourceRefs: PI_HOOK_SOURCE_REFS,
    branchAnchors,
    knownGapPrefix: "pi-hook-source-matrix-covered-by-partial-fixture",
  })
}

export function buildNanobotHookSourceMatrixSnapshot(): ProductHookSourceMatrixSnapshot {
  const product = "nanobot" as const
  const branchAnchors = buildPythonHookBranchAnchors({
    product,
    prefix: "nanobot",
    sourceRefIDs: {
      hook: "nanobot-agent-hook",
      progress: "nanobot-progress-hook",
      runner: "nanobot-agent-runner",
    },
    atoms: {
      pluginBridge: "nanobot.hook.plugin-bridge",
      loader: "nanobot.plugin.loader",
      handler: "nanobot.hook.handler-adapter",
      observer: "nanobot.hook.observer-adapter",
      scheduler: "nanobot.hook.scheduler-defaults",
      error: "nanobot.hook.error-defaults",
      mapper: "nanobot.plugin.event-mapper",
      cleanup: "nanobot.plugin.cleanup",
      command: "nanobot.registry.command",
      provider: "nanobot.registry.provider-plugin",
      providerBridge: "nanobot.plugin.provider-registry-bridge",
      tool: "nanobot.registry.tool-definition",
      ui: "nanobot.registry.ui-provider",
      uiBridge: "nanobot.plugin.ui-registry-bridge",
    },
    markers: {
      runtime: "nanobot agent hook runtime",
      lifecycle: "channel/tool registry side effects",
    },
  })
  return buildProductHookSourceMatrixSnapshot({
    product,
    upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    pinnedRepo: "HKUDS/nanobot",
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    evidenceRef: "conformance:nanobot-hook-source-matrix",
    fixtureID: "nanobot-hook:source-matrix",
    sourceRefs: NANOBOT_HOOK_SOURCE_REFS,
    branchAnchors,
    knownGapPrefix: "nanobot-hook-source-matrix-covered-by-partial-fixture",
  })
}

export function buildHermesAgentHookSourceMatrixSnapshot(): ProductHookSourceMatrixSnapshot {
  const product = "hermes-agent" as const
  const branchAnchors = buildPythonHookBranchAnchors({
    product,
    prefix: "hermes",
    sourceRefIDs: {
      hook: "hermes-cli-plugins",
      progress: "hermes-shell-hooks",
      runner: "hermes-cli-plugins-cmd",
    },
    atoms: {
      pluginBridge: "hermes.hook.plugin-bridge",
      loader: "hermes.plugin.loader",
      handler: "hermes.hook.handler-adapter",
      observer: "hermes.hook.observer-adapter",
      scheduler: "hermes.hook.scheduler-defaults",
      error: "hermes.hook.error-defaults",
      mapper: "hermes.plugin.event-mapper",
      cleanup: "hermes.plugin.cleanup",
      command: "hermes.registry.command",
      provider: "hermes.registry.provider-plugin",
      providerBridge: "hermes.plugin.provider-registry-bridge",
      tool: "hermes.registry.tool-definition",
      ui: "hermes.registry.ui-provider",
      uiBridge: "hermes.plugin.ui-registry-bridge",
    },
    markers: {
      runtime: "hermes plugin manager runtime",
      lifecycle: "ACP/session/plugin registry side effects",
    },
  })
  return buildProductHookSourceMatrixSnapshot({
    product,
    upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
    pinnedRepo: "NousResearch/hermes-agent",
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    evidenceRef: "conformance:hermes-hook-source-matrix",
    fixtureID: "hermes-hook:source-matrix",
    sourceRefs: HERMES_HOOK_SOURCE_REFS,
    branchAnchors,
    knownGapPrefix: "hermes-hook-source-matrix-covered-by-partial-fixture",
  })
}

function buildPythonHookBranchAnchors(input: {
  product: ProductHookSourceMatrixProduct
  prefix: "nanobot" | "hermes"
  sourceRefIDs: { hook: string; progress: string; runner: string }
  atoms: {
    pluginBridge: string
    loader: string
    handler: string
    observer: string
    scheduler: string
    error: string
    mapper: string
    cleanup: string
    command: string
    provider: string
    providerBridge: string
    tool: string
    ui: string
    uiBridge: string
  }
  markers: { runtime: string; lifecycle: string }
}): ProductHookSourceMatrixBranchAnchor[] {
  const { product, prefix, sourceRefIDs, atoms, markers } = input
  return [
    productHookSourceBranchAnchor({
      product,
      branchID: "plugin-or-extension-definition",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook],
      hookAtomIDs: [atoms.pluginBridge, atoms.loader],
      hookPortIDs: ["hook.bus"],
      localEvidenceRefs: ["hook-port:hook.bus", `${prefix}-hook:source-matrix`],
      localMarkers: ["hook context", "plugin bridge", markers.runtime],
      knownGaps: [`${prefix}-plugin-runtime-evaluation-not-replayed`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "plugin-or-extension-loader",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.runner],
      hookAtomIDs: [atoms.loader, atoms.pluginBridge],
      hookPortIDs: ["hook.bus", "hook.cleanup-scope"],
      localEvidenceRefs: ["hook-port:hook.bus", `current-module:${prefix}-hook-source-locations`],
      localMarkers: ["plugin discovery", "hook registration", "source metadata"],
      knownGaps: [`${prefix}-live-plugin-runtime-not-spawned`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "hook-handler-chain",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.progress],
      hookAtomIDs: [atoms.handler, atoms.mapper],
      hookPortIDs: ["hook.handler-chain"],
      localEvidenceRefs: ["hooks:handler-chain", `${prefix}-hook:source-matrix`],
      localMarkers: ["handler chain", "mutable payload", "tool/progress events"],
      knownGaps: [`${prefix}-hook-handler-output-merge-exactness-not-proven`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "hook-observer-chain",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.progress],
      hookAtomIDs: [atoms.observer],
      hookPortIDs: ["hook.observer-chain"],
      localEvidenceRefs: ["hooks:observer-chain", `${prefix}-hook:source-matrix`],
      localMarkers: ["observer chain", "source order", "non-fatal observer errors"],
      knownGaps: [`${prefix}-observer-side-effect-order-not-replayed`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "hook-scheduler-error-policy",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.runner],
      hookAtomIDs: [atoms.scheduler, atoms.error],
      hookPortIDs: ["hook.scheduler", "hook.error-policy"],
      localEvidenceRefs: ["hooks:scheduler", "hooks:error-policy"],
      localMarkers: ["scheduler defaults", "error policy", "failure path"],
      knownGaps: [`${prefix}-hook-async-scheduler-timing-not-exact`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "plugin-event-mapper",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.progress],
      hookAtomIDs: [atoms.mapper],
      hookPortIDs: ["hook.handler-chain", "hook.observer-chain"],
      localEvidenceRefs: ["hooks:bus", `${prefix}-hook:source-matrix`],
      localMarkers: ["event mapper", "progress hook", "agent runner events"],
      knownGaps: [`${prefix}-plugin-event-names-not-exhaustively-replayed`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "plugin-cleanup",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.runner],
      hookAtomIDs: [atoms.cleanup],
      hookPortIDs: ["hook.cleanup-scope"],
      localEvidenceRefs: ["hooks:cleanup-scope", `${prefix}-hook:source-matrix`],
      localMarkers: ["cleanup", "dispose", "registry unregister"],
      knownGaps: [`${prefix}-plugin-cleanup-side-effects-not-replayed`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "command-registry",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook],
      hookAtomIDs: [atoms.command],
      hookPortIDs: ["registry.command"],
      localEvidenceRefs: ["hooks:command-registry", `${prefix}-hook:source-matrix`],
      localMarkers: ["command registration", "source metadata", "control surface"],
      knownGaps: [`${prefix}-command-runtime-dispatch-not-replayed`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "provider-registry",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.runner],
      hookAtomIDs: [atoms.provider, atoms.providerBridge],
      hookPortIDs: ["registry.provider"],
      localEvidenceRefs: ["hooks:provider-registry", `${prefix}-provider:source-matrix`],
      localMarkers: ["provider registry", "plugin provider bridge", "source metadata"],
      knownGaps: [`${prefix}-provider-plugin-live-registry-not-replayed`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "tool-registry",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.runner],
      hookAtomIDs: [atoms.tool],
      hookPortIDs: ["tool.registry"],
      localEvidenceRefs: ["hooks:tool-registry", `${prefix}-hook:source-matrix`],
      localMarkers: ["tool registry", "tool definition", "source-aware registry"],
      knownGaps: [`${prefix}-tool-registry-live-side-effects-not-replayed`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "ui-registry",
      status: "partial",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.runner],
      hookAtomIDs: [atoms.ui, atoms.uiBridge],
      hookPortIDs: ["registry.ui"],
      localEvidenceRefs: ["hooks:ui-registry", `${prefix}-hook:source-matrix`],
      localMarkers: ["UI registry", "renderer/provider bridge", "source metadata"],
      knownGaps: [`${prefix}-ui-provider-render-side-effects-not-replayed`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "live-plugin-runtime",
      status: "missing",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.runner],
      hookAtomIDs: [atoms.loader, atoms.pluginBridge],
      hookPortIDs: ["hook.bus"],
      localEvidenceRefs: [`${prefix}-hook:source-matrix`],
      localMarkers: ["source-anchored-only", "live runtime:not-spawned"],
      knownGaps: [`${prefix}-live-plugin-runtime-not-spawned`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "lifecycle-side-effects",
      status: "missing",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.runner],
      hookAtomIDs: [atoms.cleanup, atoms.providerBridge, atoms.uiBridge],
      hookPortIDs: ["hook.cleanup-scope", "registry.provider", "registry.ui"],
      localEvidenceRefs: [`${prefix}-hook:source-matrix`],
      localMarkers: [`${markers.lifecycle}:not-replayed`, "registry side effects:not-replayed"],
      knownGaps: [`${prefix}-plugin-lifecycle-side-effects-not-replayed`],
    }),
    productHookSourceBranchAnchor({
      product,
      branchID: "exact-hook-event-timing",
      status: "missing",
      sourceRefIDs: [sourceRefIDs.hook, sourceRefIDs.progress],
      hookAtomIDs: [atoms.mapper, atoms.handler, atoms.observer],
      hookPortIDs: ["hook.handler-chain", "hook.observer-chain"],
      localEvidenceRefs: [`${prefix}-hook:source-matrix`],
      localMarkers: ["wall-clock:not-replayed", "async hook timing:partial"],
      knownGaps: [`${prefix}-hook-event-timing-not-exact`],
    }),
  ]
}

function buildProductHookSourceMatrixSnapshot(input: {
  product: ProductHookSourceMatrixProduct
  upstreamRef: string
  pinnedRepo: ProductHookSourceRef["repo"]
  pinnedRef: string
  evidenceRef: string
  fixtureID: string
  sourceRefs: ProductHookSourceRef[]
  branchAnchors: ProductHookSourceMatrixBranchAnchor[]
  knownGapPrefix: string
}): ProductHookSourceMatrixSnapshot {
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: input.product,
    upstreamRef: input.upstreamRef,
    pinnedRepo: input.pinnedRepo,
    pinnedRef: input.pinnedRef,
    evidenceRef: input.evidenceRef,
    fixtureID: input.fixtureID,
    sourceRefs: input.sourceRefs,
    branchAnchors: input.branchAnchors,
    partialBranchIDs: input.branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: input.branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredHookAtomIDs: uniqueStrings(input.branchAnchors.flatMap((anchor) => anchor.hookAtomIDs)),
    coveredHookPortIDs: uniqueStrings(input.branchAnchors.flatMap((anchor) => anchor.hookPortIDs)),
    knownGaps: uniqueStrings([
      input.knownGapPrefix,
      ...input.branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type HookPluginLifecycleReplayGateProduct = "opencode" | ProductHookSourceMatrixProduct
export type HookPluginLifecycleReplayGateDimension = "loader-runtime" | "hook-order" | "failure-path" | "registry-state" | "cleanup-side-effects"

export interface HookPluginLifecycleReplayGateCase {
  product: HookPluginLifecycleReplayGateProduct
  upstreamRef: OpenCodeHookSourceMatrixSnapshot["upstreamRef"] | string
  evidenceRef: OpenCodeHookSourceMatrixSnapshot["evidenceRef"] | string
  fixtureID: OpenCodeHookSourceMatrixSnapshot["fixtureID"] | string
  loaderRuntime: string[]
  hookOrder: string[]
  failurePath: string[]
  registryState: string[]
  cleanupSideEffects: string[]
  sourceAnchors: string[]
  hookAtomIDs: string[]
  hookPortIDs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  lifecycleRisk: "source-anchored-partial" | "common-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface HookPluginLifecycleReplayGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:hook-plugin-lifecycle-replay-gate"
  fixtureID: "hook:plugin-lifecycle-replay-gate"
  products: HookPluginLifecycleReplayGateProduct[]
  comparisonDimensions: HookPluginLifecycleReplayGateDimension[]
  cases: HookPluginLifecycleReplayGateCase[]
  fingerprint: string
}

export interface HookPluginLifecycleReplayGateIssue {
  id: string
  product: HookPluginLifecycleReplayGateProduct
  dimension: HookPluginLifecycleReplayGateDimension
  message: string
}

export interface HookPluginLifecycleReplayGateVerification {
  ok: boolean
  issues: HookPluginLifecycleReplayGateIssue[]
}

export type HookPluginLifecycleExactDiffBlockerProduct = HookPluginLifecycleReplayGateProduct
export type HookPluginLifecycleExactDiffBlockerDimension = HookPluginLifecycleReplayGateDimension

export interface HookPluginLifecycleExactDiffBlockerCase {
  product: HookPluginLifecycleExactDiffBlockerProduct
  upstreamRef: string
  evidenceRef: "conformance:hook-plugin-lifecycle-exact-diff-blocker-gate"
  fixtureID: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  loaderRuntime: string[]
  hookOrder: string[]
  failurePath: string[]
  registryState: string[]
  cleanupSideEffects: string[]
  sourceAnchors: string[]
  hookAtomIDs: string[]
  hookPortIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "common-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface HookPluginLifecycleExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:hook-plugin-lifecycle-exact-diff-blocker-gate"
  fixtureID: "hook:plugin-lifecycle-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: HookPluginLifecycleExactDiffBlockerProduct[]
  comparisonDimensions: HookPluginLifecycleExactDiffBlockerDimension[]
  cases: HookPluginLifecycleExactDiffBlockerCase[]
  fingerprint: string
}

export interface HookPluginLifecycleExactDiffBlockerIssue {
  id: string
  product: HookPluginLifecycleExactDiffBlockerProduct
  dimension: HookPluginLifecycleExactDiffBlockerDimension
  message: string
}

export interface HookPluginLifecycleExactDiffBlockerVerification {
  ok: boolean
  issues: HookPluginLifecycleExactDiffBlockerIssue[]
}

export type HookPluginLifecyclePinnedReplayProduct = HookPluginLifecycleReplayGateProduct
export type HookPluginLifecyclePinnedReplayDimension = HookPluginLifecycleReplayGateDimension

export interface HookPluginLifecyclePinnedReplayRecord {
  dimension: HookPluginLifecyclePinnedReplayDimension
  sequence: number
  lifecycleID: string
  loaderID: string
  hookEventID: string
  handlerOrder: string[]
  observerOrder: string[]
  failurePolicy: string
  registrySnapshotID: string
  cleanupID: string
  sourceAnchor: string
  sideEffectID: string
}

export interface HookPluginLifecyclePinnedReplayCase {
  product: HookPluginLifecyclePinnedReplayProduct
  upstreamRef: string
  evidenceRef: "conformance:hook-plugin-lifecycle-pinned-replay-gate"
  fixtureID: "hook:plugin-lifecycle-pinned-replay-gate"
  sourceFixtureID: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  upstreamEvents: HookPluginLifecyclePinnedReplayRecord[]
  productReplayEvents: HookPluginLifecyclePinnedReplayRecord[]
  assembledEvents: HookPluginLifecyclePinnedReplayRecord[]
  sourceAnchors: string[]
  hookAtomIDs: string[]
  hookPortIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "pinned-lifecycle-replay-needs-live-runtime" | "common-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface HookPluginLifecyclePinnedReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:hook-plugin-lifecycle-pinned-replay-gate"
  fixtureID: "hook:plugin-lifecycle-pinned-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: HookPluginLifecyclePinnedReplayProduct[]
  comparisonDimensions: HookPluginLifecyclePinnedReplayDimension[]
  cases: HookPluginLifecyclePinnedReplayCase[]
  fingerprint: string
}

export interface HookPluginLifecyclePinnedReplayIssue {
  id: string
  product: HookPluginLifecyclePinnedReplayProduct
  dimension: HookPluginLifecyclePinnedReplayDimension
  message: string
}

export interface HookPluginLifecyclePinnedReplayVerification {
  ok: boolean
  issues: HookPluginLifecyclePinnedReplayIssue[]
}

export function buildHookPluginLifecycleReplayGateSnapshot(): HookPluginLifecycleReplayGateSnapshot {
  const cases = [
    buildOpenCodeHookPluginLifecycleReplayGateCase(buildOpenCodeHookSourceMatrixSnapshot()),
    buildProductHookPluginLifecycleReplayGateCase(buildPiMonoHookSourceMatrixSnapshot()),
    buildProductHookPluginLifecycleReplayGateCase(buildNanobotHookSourceMatrixSnapshot()),
    buildProductHookPluginLifecycleReplayGateCase(buildHermesAgentHookSourceMatrixSnapshot()),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:hook-plugin-lifecycle-replay-gate" as const,
    fixtureID: "hook:plugin-lifecycle-replay-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["loader-runtime", "hook-order", "failure-path", "registry-state", "cleanup-side-effects"] as HookPluginLifecycleReplayGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyHookPluginLifecycleReplayGateSnapshot(
  snapshot: HookPluginLifecycleReplayGateSnapshot,
): HookPluginLifecycleReplayGateVerification {
  const issues: HookPluginLifecycleReplayGateIssue[] = []
  const products: HookPluginLifecycleReplayGateProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "hook-plugin-lifecycle.missing-product",
        product,
        dimension: "loader-runtime",
        message: `Missing hook/plugin lifecycle gate case for ${product}.`,
      })
      continue
    }
    if (!hookGateContains(item.loaderRuntime, /plugin|extension|loader|runtime|definition|source-anchored/i)) {
      issues.push({
        id: "hook-plugin-lifecycle.loader-runtime",
        product,
        dimension: "loader-runtime",
        message: `${product} hook/plugin gate no longer records loader/runtime anchors.`,
      })
    }
    if (!hookGateContains(item.hookOrder, /handler|observer|scheduler|source order|event mapper|timing|wall-clock|async/i)) {
      issues.push({
        id: "hook-plugin-lifecycle.hook-order",
        product,
        dimension: "hook-order",
        message: `${product} hook/plugin gate no longer records handler or observer order anchors.`,
      })
    }
    if (!hookGateContains(item.failurePath, /error|failure|fail-fast|continue|scheduler|timing/i)) {
      issues.push({
        id: "hook-plugin-lifecycle.failure-path",
        product,
        dimension: "failure-path",
        message: `${product} hook/plugin gate no longer records failure path anchors.`,
      })
    }
    if (!hookGateContains(item.registryState, /registry|provider|tool|command|ui|source-aware|side effects/i)) {
      issues.push({
        id: "hook-plugin-lifecycle.registry-state",
        product,
        dimension: "registry-state",
        message: `${product} hook/plugin gate no longer records registry state anchors.`,
      })
    }
    if (!hookGateContains(item.cleanupSideEffects, /cleanup|dispose|reload|shutdown|side effects|unregister|hot-reload/i)) {
      issues.push({
        id: "hook-plugin-lifecycle.cleanup-side-effects",
        product,
        dimension: "cleanup-side-effects",
        message: `${product} hook/plugin gate no longer records cleanup or lifecycle side-effect anchors.`,
      })
    }
    if (!hookGateContains(item.knownLossiness, /not-spawned|not-replayed|not-exact|source-matrix-covered-by-partial-fixture/i)) {
      issues.push({
        id: "hook-plugin-lifecycle.runtime-lossiness",
        product,
        dimension: "loader-runtime",
        message: `${product} hook/plugin gate no longer records live runtime lossiness.`,
      })
    }
    if (item.lifecycleRisk !== "source-anchored-partial") {
      issues.push({
        id: "hook-plugin-lifecycle.common-only-lifecycle",
        product,
        dimension: "registry-state",
        message: `${product} hook/plugin lifecycle gate is not product source anchored and cannot be promoted toward native parity.`,
      })
    }
    if (
      product === "opencode" &&
      (!hookIncludesAll(item.nativeEvidenceRefs, OPENCODE_HOOK_LIFECYCLE_NATIVE_EXACT_EVIDENCE_REFS) ||
        !hookIncludesAll(item.fixtureIDs, OPENCODE_HOOK_LIFECYCLE_NATIVE_EXACT_FIXTURE_IDS))
    ) {
      issues.push({
        id: "hook-plugin-lifecycle.native-exact-evidence",
        product,
        dimension: "loader-runtime",
        message: "OpenCode hook/plugin lifecycle gate lost the consolidated native exact evidence refs or fixture ID.",
      })
    }
    if (product !== "opencode" && item.fixtureID === "opencode-hook:source-matrix") {
      issues.push({
        id: "hook-plugin-lifecycle.borrowed-source-matrix",
        product,
        dimension: "loader-runtime",
        message: `${product} hook/plugin lifecycle gate is borrowing the OpenCode source matrix.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildHookPluginLifecycleExactDiffBlockerSnapshot(): HookPluginLifecycleExactDiffBlockerSnapshot {
  const replayGate = buildHookPluginLifecycleReplayGateSnapshot()
  const cases = replayGate.cases.map(buildHookPluginLifecycleExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:hook-plugin-lifecycle-exact-diff-blocker-gate" as const,
    fixtureID: "hook:plugin-lifecycle-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: replayGate.comparisonDimensions as HookPluginLifecycleExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildHookPluginLifecyclePinnedReplaySnapshot(): HookPluginLifecyclePinnedReplaySnapshot {
  const replayGate = buildHookPluginLifecycleReplayGateSnapshot()
  const cases = replayGate.cases.map(buildHookPluginLifecyclePinnedReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:hook-plugin-lifecycle-pinned-replay-gate" as const,
    fixtureID: "hook:plugin-lifecycle-pinned-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: replayGate.comparisonDimensions as HookPluginLifecyclePinnedReplayDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyHookPluginLifecycleExactDiffBlockerSnapshot(
  snapshot: HookPluginLifecycleExactDiffBlockerSnapshot,
): HookPluginLifecycleExactDiffBlockerVerification {
  const issues: HookPluginLifecycleExactDiffBlockerIssue[] = []
  const products: HookPluginLifecycleExactDiffBlockerProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "hook-plugin-lifecycle-exact-diff.missing-product",
        product,
        dimension: "loader-runtime",
        message: `Missing hook/plugin lifecycle exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "hook-plugin-lifecycle-exact-diff.native-claim",
        product,
        dimension: "loader-runtime",
        message: `${product} hook/plugin lifecycle blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!hookGateContains(item.loaderRuntime, /plugin|extension|loader|runtime|definition|source-anchored|evaluation|exact-diff-not-proven/i)) {
      issues.push({
        id: "hook-plugin-lifecycle-exact-diff.loader-runtime",
        product,
        dimension: "loader-runtime",
        message: `${product} hook/plugin lifecycle blocker no longer records loader/runtime exact-diff anchors.`,
      })
    }
    if (!hookGateContains(item.hookOrder, /handler|observer|scheduler|source order|event mapper|timing|wall-clock|async|exact-diff-not-proven/i)) {
      issues.push({
        id: "hook-plugin-lifecycle-exact-diff.hook-order",
        product,
        dimension: "hook-order",
        message: `${product} hook/plugin lifecycle blocker no longer records hook order exact-diff anchors.`,
      })
    }
    if (!hookGateContains(item.failurePath, /error|failure|fail-fast|continue|scheduler|timing|policy|exact-diff-not-proven/i)) {
      issues.push({
        id: "hook-plugin-lifecycle-exact-diff.failure-path",
        product,
        dimension: "failure-path",
        message: `${product} hook/plugin lifecycle blocker no longer records failure path exact-diff anchors.`,
      })
    }
    if (!hookGateContains(item.registryState, /registry|provider|tool|command|ui|source-aware|side effects|state|exact-diff-not-proven/i)) {
      issues.push({
        id: "hook-plugin-lifecycle-exact-diff.registry-state",
        product,
        dimension: "registry-state",
        message: `${product} hook/plugin lifecycle blocker no longer records registry state exact-diff anchors.`,
      })
    }
    if (!hookGateContains(item.cleanupSideEffects, /cleanup|dispose|reload|shutdown|side effects|unregister|hot-reload|order|exact-diff-not-proven/i)) {
      issues.push({
        id: "hook-plugin-lifecycle-exact-diff.cleanup-side-effects",
        product,
        dimension: "cleanup-side-effects",
        message: `${product} hook/plugin lifecycle blocker no longer records cleanup side-effect exact-diff anchors.`,
      })
    }
    if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.sourceAnchors.length === 0 || !hookGateContains(item.knownLossiness, /not-proven|not-spawned|not-replayed|not-exact|partial/i)) {
      issues.push({
        id: "hook-plugin-lifecycle-exact-diff.common-only-lifecycle",
        product,
        dimension: "registry-state",
        message: `${product} hook/plugin lifecycle blocker is not anchored to product-specific partial replay evidence.`,
      })
    }
    if (
      product === "opencode" &&
      (!hookIncludesAll(item.nativeEvidenceRefs, OPENCODE_HOOK_LIFECYCLE_NATIVE_EXACT_EVIDENCE_REFS) ||
        !hookIncludesAll(item.nativeEvidenceRefs, OPENCODE_HOOK_LIFECYCLE_NATIVE_EXACT_FIXTURE_IDS))
    ) {
      issues.push({
        id: "hook-plugin-lifecycle-exact-diff.native-exact-evidence",
        product,
        dimension: "loader-runtime",
        message: "OpenCode hook/plugin lifecycle exact-diff blocker lost the consolidated native exact evidence refs or fixture ID.",
      })
    }
    if (product !== "opencode" && (item.fixtureID === "opencode-hook:source-matrix" || item.exactDiffRisk === "borrowed-opencode" || hookGateContains(item.nativeEvidenceRefs, /^opencode-hook:source-matrix$/))) {
      issues.push({
        id: "hook-plugin-lifecycle-exact-diff.borrowed-source-matrix",
        product,
        dimension: "loader-runtime",
        message: `${product} hook/plugin lifecycle blocker is borrowing the OpenCode source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

export function verifyHookPluginLifecyclePinnedReplaySnapshot(
  snapshot: HookPluginLifecyclePinnedReplaySnapshot,
): HookPluginLifecyclePinnedReplayVerification {
  const issues: HookPluginLifecyclePinnedReplayIssue[] = []
  const products: HookPluginLifecyclePinnedReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  const dimensions: HookPluginLifecyclePinnedReplayDimension[] = ["loader-runtime", "hook-order", "failure-path", "registry-state", "cleanup-side-effects"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "hook-plugin-lifecycle-pinned-replay.missing-product",
        product,
        dimension: "loader-runtime",
        message: `Missing hook/plugin lifecycle pinned replay case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "hook-plugin-lifecycle-pinned-replay.native-claim",
        product,
        dimension: "loader-runtime",
        message: `${product} hook/plugin pinned replay must remain partial and cannot claim native parity.`,
      })
    }
    if (!hookPinnedReplayOrderMatches(item.upstreamEvents) || !hookPinnedReplayOrderMatches(item.productReplayEvents) || !hookPinnedReplayOrderMatches(item.assembledEvents)) {
      issues.push({
        id: "hook-plugin-lifecycle-pinned-replay.hook-order",
        product,
        dimension: "hook-order",
        message: `${product} hook/plugin pinned replay no longer preserves lifecycle event order.`,
      })
    }
    for (const dimension of dimensions) {
      const upstream = hookPinnedReplayEvent(item.upstreamEvents, dimension)
      const productReplay = hookPinnedReplayEvent(item.productReplayEvents, dimension)
      const assembled = hookPinnedReplayEvent(item.assembledEvents, dimension)
      if (!upstream || !productReplay || !assembled || !hookPinnedReplayRecordMatches(upstream, productReplay) || !hookPinnedReplayRecordMatches(upstream, assembled)) {
        issues.push({
          id: `hook-plugin-lifecycle-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} hook/plugin pinned replay ${dimension} fixture drifted from the upstream lifecycle sample.`,
        })
      }
    }
    if (item.exactDiffRisk !== "pinned-lifecycle-replay-needs-live-runtime" || !hookGateContains(item.knownLossiness, /pinned-lifecycle-replay|live-runtime-not-proven|not-spawned|not-replayed|not-exact|partial/i)) {
      issues.push({
        id: "hook-plugin-lifecycle-pinned-replay.common-only-lifecycle",
        product,
        dimension: "registry-state",
        message: `${product} hook/plugin pinned replay is no longer anchored as partial replay that still needs live runtime proof.`,
      })
    }
    if (product !== "opencode" && (item.sourceFixtureID === "opencode-hook:source-matrix" || item.exactDiffRisk === "borrowed-opencode" || hookGateContains(item.nativeEvidenceRefs, /^opencode-hook:source-matrix$/))) {
      issues.push({
        id: "hook-plugin-lifecycle-pinned-replay.borrowed-source-matrix",
        product,
        dimension: "loader-runtime",
        message: `${product} hook/plugin pinned replay is borrowing the OpenCode source matrix.`,
      })
    }
    if (
      product === "opencode" &&
      (!hookIncludesAll(item.nativeEvidenceRefs, OPENCODE_HOOK_LIFECYCLE_NATIVE_EXACT_EVIDENCE_REFS) ||
        !hookIncludesAll(item.nativeEvidenceRefs, OPENCODE_HOOK_LIFECYCLE_NATIVE_EXACT_FIXTURE_IDS))
    ) {
      issues.push({
        id: "hook-plugin-lifecycle-pinned-replay.native-exact-evidence",
        product,
        dimension: "loader-runtime",
        message: "OpenCode hook/plugin lifecycle pinned replay lost the consolidated native exact evidence refs or fixture ID.",
      })
    }
    if (item.sourceAnchors.length === 0 || item.hookAtomIDs.length === 0 || item.hookPortIDs.length === 0 || item.nativeEvidenceRefs.length === 0) {
      issues.push({
        id: "hook-plugin-lifecycle-pinned-replay.missing-evidence",
        product,
        dimension: "loader-runtime",
        message: `${product} hook/plugin pinned replay lost product source anchors or native evidence refs.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildHookPluginLifecycleExactDiffBlockerCase(
  gateCase: HookPluginLifecycleReplayGateCase,
): HookPluginLifecycleExactDiffBlockerCase {
  return {
    product: gateCase.product,
    upstreamRef: gateCase.upstreamRef,
    evidenceRef: "conformance:hook-plugin-lifecycle-exact-diff-blocker-gate",
    fixtureID: gateCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    loaderRuntime: uniqueStrings([
      ...gateCase.loaderRuntime,
      "hook-loader-runtime-native-evaluation:exact-diff-not-proven",
    ]),
    hookOrder: uniqueStrings([
      ...gateCase.hookOrder,
      "hook-order-native-timing:exact-diff-not-proven",
    ]),
    failurePath: uniqueStrings([
      ...gateCase.failurePath,
      "hook-failure-path-native-policy:exact-diff-not-proven",
    ]),
    registryState: uniqueStrings([
      ...gateCase.registryState,
      "hook-registry-state-native-side-effects:exact-diff-not-proven",
    ]),
    cleanupSideEffects: uniqueStrings([
      ...gateCase.cleanupSideEffects,
      "hook-cleanup-side-effects-native-order:exact-diff-not-proven",
    ]),
    sourceAnchors: gateCase.sourceAnchors,
    hookAtomIDs: gateCase.hookAtomIDs,
    hookPortIDs: gateCase.hookPortIDs,
    nativeEvidenceRefs: uniqueStrings([
      gateCase.fixtureID,
      ...gateCase.nativeEvidenceRefs,
      ...gateCase.sourceAnchors,
      ...gateCase.fixtureIDs,
    ]),
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...gateCase.knownLossiness,
      "hook-loader-runtime-native-evaluation-not-proven",
      "hook-order-native-timing-not-proven",
      "hook-failure-path-native-policy-not-proven",
      "hook-registry-state-native-side-effects-not-proven",
      "hook-cleanup-side-effects-native-order-not-proven",
    ]),
  }
}

function buildHookPluginLifecyclePinnedReplayCase(
  gateCase: HookPluginLifecycleReplayGateCase,
): HookPluginLifecyclePinnedReplayCase {
  const records = hookPluginLifecyclePinnedReplayRecords(gateCase.product)
  return {
    product: gateCase.product,
    upstreamRef: gateCase.upstreamRef,
    evidenceRef: "conformance:hook-plugin-lifecycle-pinned-replay-gate",
    fixtureID: "hook:plugin-lifecycle-pinned-replay-gate",
    sourceFixtureID: gateCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    upstreamEvents: records.map(hookPinnedReplayRecordClone),
    productReplayEvents: records.map(hookPinnedReplayRecordClone),
    assembledEvents: records.map(hookPinnedReplayRecordClone),
    sourceAnchors: gateCase.sourceAnchors,
    hookAtomIDs: gateCase.hookAtomIDs,
    hookPortIDs: gateCase.hookPortIDs,
    nativeEvidenceRefs: uniqueStrings([
      gateCase.fixtureID,
      ...gateCase.nativeEvidenceRefs,
      ...gateCase.sourceAnchors,
      ...gateCase.fixtureIDs,
      ...records.map((record) => record.sourceAnchor),
      ...records.map((record) => record.sideEffectID),
    ]),
    exactDiffRisk: "pinned-lifecycle-replay-needs-live-runtime",
    knownLossiness: uniqueStrings([
      ...gateCase.knownLossiness,
      "hook-plugin-pinned-lifecycle-replay-live-runtime-not-proven",
      "hook-plugin-pinned-loader-module-evaluation-not-proven",
      "hook-plugin-pinned-hook-order-wall-clock-not-proven",
      "hook-plugin-pinned-registry-mutation-identity-not-proven",
      "hook-plugin-pinned-cleanup-side-effect-order-not-proven",
    ]),
  }
}

function buildOpenCodeHookPluginLifecycleReplayGateCase(snapshot: OpenCodeHookSourceMatrixSnapshot): HookPluginLifecycleReplayGateCase {
  return {
    product: "opencode",
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    loaderRuntime: hookBranchMarkers(snapshot.branchAnchors, ["plugin-v2-definition", "plugin-boot-loader", "live-plugin-runtime"]),
    hookOrder: hookBranchMarkers(snapshot.branchAnchors, ["hook-handler-chain", "hook-observer-chain", "hook-scheduler-error-policy", "plugin-event-mapper", "exact-hook-event-timing"]),
    failurePath: hookBranchMarkers(snapshot.branchAnchors, ["hook-scheduler-error-policy", "plugin-event-mapper", "exact-hook-event-timing"]),
    registryState: hookBranchMarkers(snapshot.branchAnchors, ["command-registry", "provider-registry", "tool-registry", "ui-registry", "live-plugin-runtime"]),
    cleanupSideEffects: hookBranchMarkers(snapshot.branchAnchors, ["plugin-hot-reload-cleanup", "hot-reload-side-effects", "exact-hook-event-timing"]),
    sourceAnchors: uniqueStrings([
      ...snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
      ...snapshot.branchAnchors.flatMap((anchor) => anchor.nativeEvidenceRefs),
      ...snapshot.branchAnchors.flatMap((anchor) => anchor.fixtureIDs),
    ]),
    hookAtomIDs: snapshot.coveredHookAtomIDs,
    hookPortIDs: snapshot.coveredHookPortIDs,
    nativeEvidenceRefs: snapshot.nativeEvidenceRefs,
    fixtureIDs: snapshot.fixtureIDs,
    lifecycleRisk: "source-anchored-partial",
    knownLossiness: snapshot.knownGaps,
  }
}

function buildProductHookPluginLifecycleReplayGateCase(snapshot: ProductHookSourceMatrixSnapshot): HookPluginLifecycleReplayGateCase {
  return {
    product: snapshot.product,
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    loaderRuntime: hookBranchMarkers(snapshot.branchAnchors, ["plugin-or-extension-definition", "plugin-or-extension-loader", "live-plugin-runtime"]),
    hookOrder: hookBranchMarkers(snapshot.branchAnchors, ["hook-handler-chain", "hook-observer-chain", "hook-scheduler-error-policy", "plugin-event-mapper", "exact-hook-event-timing"]),
    failurePath: hookBranchMarkers(snapshot.branchAnchors, ["hook-scheduler-error-policy", "plugin-event-mapper", "exact-hook-event-timing"]),
    registryState: hookBranchMarkers(snapshot.branchAnchors, ["command-registry", "provider-registry", "tool-registry", "ui-registry", "live-plugin-runtime", "lifecycle-side-effects"]),
    cleanupSideEffects: hookBranchMarkers(snapshot.branchAnchors, ["plugin-cleanup", "lifecycle-side-effects", "exact-hook-event-timing"]),
    sourceAnchors: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    hookAtomIDs: snapshot.coveredHookAtomIDs,
    hookPortIDs: snapshot.coveredHookPortIDs,
    nativeEvidenceRefs: [],
    fixtureIDs: [snapshot.fixtureID],
    lifecycleRisk: "source-anchored-partial",
    knownLossiness: snapshot.knownGaps,
  }
}

function hookBranchMarkers<TAnchor extends {
  branchID: string
  status?: string
  exactDiffStatus?: string
  nativeParityClaim?: boolean
  localEvidenceRefs?: string[]
  localMarkers: string[]
  nativeEvidenceRefs?: string[]
  fixtureIDs?: string[]
  knownGaps: string[]
}>(anchors: TAnchor[], branchIDs: string[]): string[] {
  const selected = anchors.filter((anchor) => branchIDs.includes(anchor.branchID))
  return uniqueStrings(selected.flatMap((anchor) => [
    anchor.branchID,
    ...(anchor.status ? [anchor.status] : []),
    ...(anchor.exactDiffStatus ? [anchor.exactDiffStatus] : []),
    anchor.nativeParityClaim ? "native-parity-claimed" : "native-parity-not-claimed",
    ...(anchor.localEvidenceRefs ?? []),
    ...anchor.localMarkers,
    ...(anchor.nativeEvidenceRefs ?? []),
    ...(anchor.fixtureIDs ?? []),
    ...anchor.knownGaps,
  ]))
}

function hookPluginLifecyclePinnedReplayRecords(
  product: HookPluginLifecyclePinnedReplayProduct,
): HookPluginLifecyclePinnedReplayRecord[] {
  if (product === "opencode") {
    return [
      hookPinnedReplayRecord(product, "loader-runtime", 1, "opencode.lifecycle.project-plugin", "PluginBoot.defaultLayer", "session.prompt.before", ["project-plugin:handler:10"], ["provider-plugin:observer:20"], "collect-and-continue", "opencode.registry.provider+tool", "hot-reload.cleanup.project-plugin", "plugin-boot:packages/core/src/plugin/boot.ts", "plugin-module-evaluation:project"),
      hookPinnedReplayRecord(product, "hook-order", 2, "opencode.lifecycle.prompt-hook", "PluginV2.define", "session.prompt.before", ["project-plugin:handler:10", "global-plugin:handler:20"], ["observer.telemetry:30"], "collect-and-continue", "opencode.registry.command", "hook-scope.cleanup.prompt", "plugin-core:packages/core/src/plugin.ts", "hook-event-order:source"),
      hookPinnedReplayRecord(product, "failure-path", 3, "opencode.lifecycle.error-policy", "PluginBoot.Service", "provider.request.before", ["provider-plugin:handler:10"], ["observer.audit:20"], "scheduler-error-policy:continue", "opencode.registry.provider", "error-cleanup.provider", "plugin-provider:packages/core/src/plugin/provider.ts", "hook-error-policy:collect"),
      hookPinnedReplayRecord(product, "registry-state", 4, "opencode.lifecycle.registry", "ProviderPlugins", "registry.provider.loaded", ["provider-registry:handler:10"], ["registry-observer:20"], "collect-and-continue", "opencode.registry.provider-plugin+tool-definition", "registry-unregister.provider", "plugin-provider:packages/core/src/plugin/provider.ts", "provider-registry-state:source-aware"),
      hookPinnedReplayRecord(product, "cleanup-side-effects", 5, "opencode.lifecycle.hot-reload", "PluginBoot.watch", "plugin.hot-reload.dispose", ["cleanup:handler:10"], ["watcher:observer:20"], "dispose-before-reload", "opencode.registry.provider-after-dispose", "hot-reload.cleanup.project-plugin", "plugin-boot:packages/core/src/plugin/boot.ts", "hot-reload-cleanup:dispose-order"),
    ]
  }
  if (product === "pi-mono") {
    return [
      hookPinnedReplayRecord(product, "loader-runtime", 1, "pi.lifecycle.extension-loader", "discoverAndLoadExtensions", "extension.loaded", ["extension-loader:handler:10"], ["extension-observer:20"], "collect-and-continue", "pi.registry.dynamic-tool", "extension.cleanup.scope", "pi-extension-loader:packages/coding-agent/src/core/extensions/loader.ts", "pi-extension-runtime:create"),
      hookPinnedReplayRecord(product, "hook-order", 2, "pi.lifecycle.event-mapper", "createExtensionRuntime", "agent.event.before", ["extension-event-mapper:handler:10", "dynamic-tool:handler:20"], ["jsonl-observer:30"], "collect-and-continue", "pi.registry.command", "extension-event.cleanup", "pi-extension-runner:packages/coding-agent/src/core/extensions/runner.ts", "pi-hook-order:runtime-event"),
      hookPinnedReplayRecord(product, "failure-path", 3, "pi.lifecycle.extension-error", "ExtensionRunner", "tool.execute.error", ["extension-error:handler:10"], ["jsonl-error-observer:20"], "extension-error-policy:continue", "pi.registry.dynamic-tool", "extension-error.cleanup", "pi-extension-types:packages/coding-agent/src/core/extensions/types.ts", "pi-failure-path:jsonl-event"),
      hookPinnedReplayRecord(product, "registry-state", 4, "pi.lifecycle.dynamic-tools", "defineTool", "extension.tools.register", ["dynamic-tool-registry:handler:10"], ["tool-registry-observer:20"], "collect-and-continue", "pi.registry.dynamicToolsExtension+defineTool", "dynamic-tool.unregister", "pi-extension-wrapper:packages/coding-agent/src/core/extensions/wrapper.ts", "pi-registry-state:dynamic-tools"),
      hookPinnedReplayRecord(product, "cleanup-side-effects", 5, "pi.lifecycle.cleanup", "ExtensionCleanupScope", "extension.unload", ["extension-cleanup:handler:10"], ["cleanup-observer:20"], "cleanup-after-run", "pi.registry.dynamic-tool-after-cleanup", "extension.cleanup.scope", "pi-extension-runner:packages/coding-agent/src/core/extensions/runner.ts", "pi-cleanup-side-effects:unregister"),
    ]
  }
  if (product === "nanobot") {
    return [
      hookPinnedReplayRecord(product, "loader-runtime", 1, "nanobot.lifecycle.plugin-loader", "nanobot.agent.hook.load", "channel.command.before", ["plugin-loader:handler:10"], ["progress-hook:observer:20"], "collect-and-continue", "nanobot.registry.channel-command", "plugin.cleanup.scope", "nanobot-agent-hook:nanobot/agent/hook.py", "nanobot-plugin-runtime:load"),
      hookPinnedReplayRecord(product, "hook-order", 2, "nanobot.lifecycle.progress-hook", "progress_hook.register", "agent.progress", ["progress-hook:handler:10", "channel-hook:handler:20"], ["websocket-observer:30"], "collect-and-continue", "nanobot.registry.channel", "progress-hook.cleanup", "nanobot-progress-hook:nanobot/agent/progress_hook.py", "nanobot-hook-order:progress"),
      hookPinnedReplayRecord(product, "failure-path", 3, "nanobot.lifecycle.channel-error", "agent.runner", "channel.delivery.error", ["channel-error:handler:10"], ["progress-error-observer:20"], "channel-error-policy:continue", "nanobot.registry.channel-command", "channel-error.cleanup", "nanobot-agent-runner:nanobot/agent/runner.py", "nanobot-failure-path:delivery"),
      hookPinnedReplayRecord(product, "registry-state", 4, "nanobot.lifecycle.tool-channel-registry", "channel.registry", "workspace.tools.register", ["tool-registry:handler:10"], ["channel-registry-observer:20"], "collect-and-continue", "nanobot.registry.workspace-tool+channel-command", "tool-channel.unregister", "nanobot-agent-hook:nanobot/agent/hook.py", "nanobot-registry-state:channel-tool"),
      hookPinnedReplayRecord(product, "cleanup-side-effects", 5, "nanobot.lifecycle.channel-cleanup", "channel.cleanup", "agent.finalize", ["channel-cleanup:handler:10"], ["memory-observer:20"], "cleanup-after-finalize", "nanobot.registry.channel-after-cleanup", "channel.cleanup.scope", "nanobot-agent-runner:nanobot/agent/runner.py", "nanobot-cleanup-side-effects:channel"),
    ]
  }
  return [
    hookPinnedReplayRecord(product, "loader-runtime", 1, "hermes.lifecycle.plugin-manager", "hermes_cli.plugins.load", "transport.session.before", ["plugin-loader:handler:10"], ["transport-observer:20"], "collect-and-continue", "hermes.registry.transport+tool", "plugin.cleanup.scope", "hermes-cli-plugins:hermes_cli/plugins.py", "hermes-plugin-runtime:manager"),
    hookPinnedReplayRecord(product, "hook-order", 2, "hermes.lifecycle.transport-hook", "agent.shell_hooks", "transport.message.before", ["shell-hook:handler:10", "transport-hook:handler:20"], ["gateway-observer:30"], "collect-and-continue", "hermes.registry.transport", "transport-hook.cleanup", "hermes-shell-hooks:agent/shell_hooks.py", "hermes-hook-order:transport"),
    hookPinnedReplayRecord(product, "failure-path", 3, "hermes.lifecycle.guardrail-error", "tool_guardrails", "tool.dispatch.error", ["guardrail:handler:10"], ["agent-runner-observer:20"], "guardrail-error-policy:continue", "hermes.registry.tool-guardrail", "guardrail-error.cleanup", "hermes-agent-runner:agent/agent_runtime_helpers.py", "hermes-failure-path:guardrail"),
    hookPinnedReplayRecord(product, "registry-state", 4, "hermes.lifecycle.transport-registry", "transport.plugin.registry", "acp.session.open", ["transport-registry:handler:10"], ["acp-observer:20"], "collect-and-continue", "hermes.registry.transport+platform-tool", "transport.unregister", "hermes-cli-plugins-cmd:hermes_cli/plugins_cmd.py", "hermes-registry-state:transport"),
    hookPinnedReplayRecord(product, "cleanup-side-effects", 5, "hermes.lifecycle.force-close-cleanup", "runtime.force_close", "session.force_close", ["cleanup:handler:10"], ["runtime-observer:20"], "cleanup-before-force-close", "hermes.registry.transport-after-cleanup", "force-close.cleanup.scope", "hermes-shell-hooks:agent/shell_hooks.py", "hermes-cleanup-side-effects:force-close"),
  ]
}

function hookPinnedReplayRecord(
  product: HookPluginLifecyclePinnedReplayProduct,
  dimension: HookPluginLifecyclePinnedReplayDimension,
  sequence: number,
  lifecycleID: string,
  loaderID: string,
  hookEventID: string,
  handlerOrder: string[],
  observerOrder: string[],
  failurePolicy: string,
  registrySnapshotID: string,
  cleanupID: string,
  sourceAnchor: string,
  sideEffectID: string,
): HookPluginLifecyclePinnedReplayRecord {
  return {
    dimension,
    sequence,
    lifecycleID: `${product}:${lifecycleID}`,
    loaderID,
    hookEventID,
    handlerOrder,
    observerOrder,
    failurePolicy,
    registrySnapshotID,
    cleanupID,
    sourceAnchor,
    sideEffectID,
  }
}

function hookPinnedReplayRecordClone(record: HookPluginLifecyclePinnedReplayRecord): HookPluginLifecyclePinnedReplayRecord {
  return {
    ...record,
    handlerOrder: [...record.handlerOrder],
    observerOrder: [...record.observerOrder],
  }
}

function hookPinnedReplayEvent(
  records: HookPluginLifecyclePinnedReplayRecord[],
  dimension: HookPluginLifecyclePinnedReplayDimension,
): HookPluginLifecyclePinnedReplayRecord | undefined {
  return records.find((record) => record.dimension === dimension)
}

function hookPinnedReplayRecordMatches(
  upstream: HookPluginLifecyclePinnedReplayRecord,
  candidate: HookPluginLifecyclePinnedReplayRecord,
): boolean {
  return JSON.stringify(upstream) === JSON.stringify(candidate)
}

function hookPinnedReplayOrderMatches(records: HookPluginLifecyclePinnedReplayRecord[]): boolean {
  const dimensions: HookPluginLifecyclePinnedReplayDimension[] = ["loader-runtime", "hook-order", "failure-path", "registry-state", "cleanup-side-effects"]
  return records.map((record) => record.dimension).join("|") === dimensions.join("|") &&
    records.every((record, index) => record.sequence === index + 1)
}

function hookGateContains(values: string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

function hookIncludesAll(values: string[], requiredValues: string[]): boolean {
  return requiredValues.every((requiredValue) => values.includes(requiredValue))
}

export const hookPortContractFixtures: LegoPortContractFixture[] = [
  {
    id: "hook.bus",
    input: "EventEnvelope plus source-ordered observer/handler registrations",
    output: "merged HookResult, early-stop signal, cleanup records, and serialized hook errors",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "hooks:bus",
    implementations: ["hook.bus.source-ordered"],
    personalityAtoms: [
      "opencode.hook.plugin-bridge",
      "opencode.plugin.loader",
      "pi.hook.extension-bridge",
      "pi.extension.loader",
      "nanobot.hook.plugin-bridge",
      "nanobot.plugin.loader",
      "hermes.hook.plugin-bridge",
      "hermes.plugin.loader",
    ],
  },
  {
    id: "hook.observer-chain",
    input: "observe-only hook registrations with source, priority, event filter, and scoped cleanup handle",
    output: "ordered observer execution trace and collected non-fatal observer errors",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "hooks:observer-chain",
    implementations: ["hook.observer-chain.source-ordered"],
    personalityAtoms: ["opencode.hook.observer-adapter", "pi.hook.observer-adapter", "nanobot.hook.observer-adapter", "hermes.hook.observer-adapter"],
  },
  {
    id: "hook.handler-chain",
    input: "handle hook registrations with source, priority, mutable payload, and early-stop policy",
    output: "merged handler result, mutation patch, handled/cancelled signal, and execution trace",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "hooks:handler-chain",
    implementations: ["hook.handler-chain.source-ordered"],
    personalityAtoms: [
      "opencode.hook.handler-adapter",
      "opencode.plugin.event-mapper",
      "pi.hook.handler-adapter",
      "pi.extension.event-mapper",
      "nanobot.hook.handler-adapter",
      "nanobot.plugin.event-mapper",
      "hermes.hook.handler-adapter",
      "hermes.plugin.event-mapper",
    ],
  },
  {
    id: "hook.scheduler",
    input: "hook execution plan, ordering requirements, async cleanup tasks, and abort signal",
    output: "scheduled hook execution result with deterministic ordering evidence",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "hooks:scheduler",
    implementations: ["hook.scheduler.serial", "hook.scheduler.parallel", "hook.scheduler.source-ordered"],
    personalityAtoms: ["opencode.hook.scheduler-defaults", "pi.hook.scheduler-defaults", "nanobot.hook.scheduler-defaults", "hermes.hook.scheduler-defaults"],
  },
  {
    id: "hook.cleanup-scope",
    input: "disposable hook registrations and lifecycle scope disposal request",
    output: "cleanup completion records and remaining live registrations",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "hooks:cleanup-scope",
    implementations: ["hook.cleanup-scope.registry"],
    personalityAtoms: ["opencode.plugin.hot-reload-cleanup", "pi.extension.cleanup", "nanobot.plugin.cleanup", "hermes.plugin.cleanup"],
  },
  {
    id: "hook.error-policy",
    input: "hook error, event context, source metadata, and configured policy",
    output: "fail-fast, collect-and-continue, handled, or cancelled error decision",
    lifecycle: ["process", "workspace", "session", "turn", "tool-call"],
    resources: [],
    conformance: "hooks:error-policy",
    implementations: ["hook.error-policy.fail-fast", "hook.error-policy.collect-and-continue"],
    personalityAtoms: ["opencode.hook.error-defaults", "pi.hook.error-defaults", "nanobot.hook.error-defaults", "hermes.hook.error-defaults"],
  },
  {
    id: "tool.registry",
    input: "LegoToolDefinition registrations from common modules or personality plugins/extensions",
    output: "source-aware tool registry entries available to the agent loop",
    lifecycle: ["process", "workspace", "session"],
    resources: [],
    conformance: "hooks:tool-registry",
    implementations: ["registry.tool.common"],
    personalityAtoms: [
      "opencode.registry.tool-definition",
      "opencode.plugin.registry-bridge",
      "pi.registry.register-tool",
      "pi.extension.dynamic-tool-bridge",
      "nanobot.registry.tool-definition",
      "nanobot.tool.registry-bridge",
      "hermes.registry.tool-definition",
      "hermes.tool.registry-bridge",
    ],
  },
  {
    id: "registry.command",
    input: "command registration with name, description, arguments, source, and handler metadata",
    output: "source-aware command registry entries for UI/control surfaces",
    lifecycle: ["process", "workspace", "session"],
    resources: [],
    conformance: "hooks:command-registry",
    implementations: ["registry.command.common"],
    personalityAtoms: ["opencode.registry.command", "pi.registry.command", "nanobot.registry.command", "hermes.registry.command"],
  },
  {
    id: "registry.provider",
    input: "provider descriptor registration with id, models, auth hints, source, and lifecycle metadata",
    output: "source-aware provider registry entries for recipe/provider selection",
    lifecycle: ["process", "workspace"],
    resources: [],
    conformance: "hooks:provider-registry",
    implementations: ["registry.provider.common"],
    personalityAtoms: [
      "opencode.registry.provider-plugin",
      "opencode.plugin.provider-registry-bridge",
      "pi.registry.provider-extension",
      "pi.extension.provider-registry-bridge",
      "nanobot.registry.provider-plugin",
      "nanobot.plugin.provider-registry-bridge",
      "hermes.registry.provider-plugin",
      "hermes.plugin.provider-registry-bridge",
    ],
  },
  {
    id: "registry.ui",
    input: "renderer, theme, UI provider, or message renderer registration with source metadata",
    output: "source-aware UI registry entries for shell renderers and product surfaces",
    lifecycle: ["process", "workspace", "session"],
    resources: [],
    conformance: "hooks:ui-registry",
    implementations: ["registry.ui.common"],
    personalityAtoms: [
      "opencode.registry.ui-provider",
      "opencode.plugin.ui-registry-bridge",
      "pi.registry.message-renderer",
      "pi.extension.ui-registry-bridge",
      "nanobot.registry.ui-provider",
      "nanobot.plugin.ui-registry-bridge",
      "hermes.registry.ui-provider",
      "hermes.plugin.ui-registry-bridge",
    ],
  },
]

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort()
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}
