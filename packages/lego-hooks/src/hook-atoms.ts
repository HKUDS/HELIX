import { createHash } from "node:crypto"
import type { EventEnvelope, HookResult, LegoToolDefinition } from "@helix/contracts"
import { normalizeEventName } from "./aliases.ts"
import type {
  AuthRegistration,
  CommandRegistration,
  EventNameAlias,
  FlagRegistration,
  HookContext,
  HookError,
  HookErrorMode,
  HookHandler,
  HookObserver,
  HookRegistries,
  HookSourceInfo,
  MessageRendererRegistration,
  ProviderRegistration,
  ShortcutRegistration,
  UIProviderRegistration,
} from "./types.ts"

export interface HookAtomRecord {
  source: HookSourceInfo
}

export interface HookObserverRecord extends HookAtomRecord {
  observer: HookObserver
}

export interface HookHandlerRecord extends HookAtomRecord {
  type: string
  handler: HookHandler
}

export interface HookCleanupRecord extends HookAtomRecord {
  cleanup: () => void | Promise<void>
}

export interface HookCleanupResult {
  source: HookSourceInfo
  ok: boolean
  error?: unknown
}

export type HookSourceRegistryRecordKind = "observer" | "handler"

export interface HookSourceRegistryRecord {
  kind: HookSourceRegistryRecordKind
  event?: string
  source: HookSourceInfo
}

export interface HookSourceRegistryEventSnapshot {
  event: string
  observerCount: number
  handlerCount: number
  sourceOrder: HookSourceRegistryRecord[]
}

export interface HookSourceRegistrySnapshot {
  observers: HookSourceRegistryRecord[]
  handlers: HookSourceRegistryRecord[]
  events: HookSourceRegistryEventSnapshot[]
}

export interface HookSchedulerPort {
  order<TRecord extends HookAtomRecord>(records: readonly TRecord[]): TRecord[]
  run<TRecord extends HookAtomRecord, TResult>(
    records: readonly TRecord[],
    invoke: (record: TRecord) => TResult | Promise<TResult>,
  ): Promise<TResult[]>
}

export interface HookErrorPolicyPort {
  readonly mode: HookErrorMode
  handle(error: HookError): "continue" | "throw"
}

export interface HookChainRunInput {
  signal?: AbortSignal
}

export interface HookObserverChainPort {
  register(observer: HookObserver, source: HookSourceInfo): () => void
  run(event: EventEnvelope, input?: HookChainRunInput): Promise<void>
  records(): HookObserverRecord[]
  clear(): void
}

export interface HookHandlerChainPort {
  register(type: EventNameAlias, handler: HookHandler, source: HookSourceInfo): () => void
  run(event: EventEnvelope, input?: HookChainRunInput): Promise<HookResult | undefined>
  records(type?: EventNameAlias): HookHandlerRecord[]
  clear(): void
}

export interface HookCleanupScopePort {
  add(cleanup: () => void | Promise<void>, source: HookSourceInfo): () => void
  dispose(input?: HookChainRunInput): Promise<HookCleanupResult[]>
  records(): HookCleanupRecord[]
  clear(): void
}

export interface HookBusPort {
  observe(observer: HookObserver, source: HookSourceInfo): () => void
  on(type: EventNameAlias, handler: HookHandler, source: HookSourceInfo): () => void
  emit(event: EventEnvelope, signal?: AbortSignal): Promise<HookResult | undefined>
  observerRecords(): HookObserverRecord[]
  handlerRecords(type?: EventNameAlias): HookHandlerRecord[]
  clear(): void
}

export interface ToolRegistryPort {
  register(tool: LegoToolDefinition, source: HookSourceInfo): () => void
}

export interface CommandRegistryPort {
  registerCommand(command: CommandRegistration, source: HookSourceInfo): () => void
  registerShortcut(shortcut: ShortcutRegistration, source: HookSourceInfo): () => void
  registerFlag(flag: FlagRegistration, source: HookSourceInfo): () => void
}

export interface ProviderRegistryPort {
  registerProvider(provider: ProviderRegistration, source: HookSourceInfo): () => void
  registerAuth(auth: AuthRegistration, source: HookSourceInfo): () => void
}

export interface UIRegistryPort {
  registerUIProvider(provider: UIProviderRegistration, source: HookSourceInfo): () => void
  registerMessageRenderer(renderer: MessageRendererRegistration, source: HookSourceInfo): () => void
}

export interface HookRegistryAtoms {
  registries: HookRegistries
  services: Map<string, unknown>
  tool: ToolRegistryPort
  command: CommandRegistryPort
  provider: ProviderRegistryPort
  ui: UIRegistryPort
}

export interface HookAtomOptions {
  scheduler?: HookSchedulerPort
  errorPolicy?: HookErrorPolicyPort
  services?: Map<string, unknown>
}

export function createSourceOrderedHookScheduler(): HookSchedulerPort {
  return {
    order(records) {
      return [...records].sort((left, right) => left.source.order - right.source.order)
    },
    async run(records, invoke) {
      const results = []
      for (const record of this.order(records)) results.push(await invoke(record))
      return results
    },
  }
}

export function createSerialHookScheduler(): HookSchedulerPort {
  return {
    order(records) {
      return [...records]
    },
    async run(records, invoke) {
      const results = []
      for (const record of records) results.push(await invoke(record))
      return results
    },
  }
}

export function createParallelHookScheduler(): HookSchedulerPort {
  return {
    order(records) {
      return [...records]
    },
    async run(records, invoke) {
      return Promise.all(records.map((record) => invoke(record)))
    },
  }
}

export function createHookErrorPolicy(options: { mode?: HookErrorMode; onError?: (error: HookError) => void } = {}): HookErrorPolicyPort {
  const mode = options.mode ?? "continue"
  return {
    mode,
    handle(error) {
      options.onError?.(error)
      return mode === "throw" ? "throw" : "continue"
    },
  }
}

export function createCollectAndContinueHookErrorPolicy(onError?: (error: HookError) => void): HookErrorPolicyPort {
  return createHookErrorPolicy({ mode: "continue", ...(onError ? { onError } : {}) })
}

export function createFailFastHookErrorPolicy(onError?: (error: HookError) => void): HookErrorPolicyPort {
  return createHookErrorPolicy({ mode: "throw", ...(onError ? { onError } : {}) })
}

export function createHookObserverChain(options: HookAtomOptions = {}): HookObserverChainPort {
  const records: HookObserverRecord[] = []
  const scheduler = options.scheduler ?? createSourceOrderedHookScheduler()
  const errorPolicy = options.errorPolicy ?? createCollectAndContinueHookErrorPolicy()
  const services = options.services ?? new Map<string, unknown>()
  return {
    register(observer, source) {
      const record = { observer, source }
      records.push(record)
      return () => removeFromArray(records, record)
    },
    async run(event, input = {}) {
      await scheduler.run(records, (record) =>
        invokeHookAtom(errorPolicy, record.source, event, input.signal, services, (ctx) => record.observer(event, ctx)),
      )
    },
    records() {
      return records.map((record) => ({ ...record }))
    },
    clear() {
      records.length = 0
    },
  }
}

export function createHookHandlerChain(options: HookAtomOptions = {}): HookHandlerChainPort {
  const recordsByType = new Map<string, HookHandlerRecord[]>()
  const scheduler = options.scheduler ?? createSourceOrderedHookScheduler()
  const errorPolicy = options.errorPolicy ?? createCollectAndContinueHookErrorPolicy()
  const services = options.services ?? new Map<string, unknown>()
  return {
    register(type, handler, source) {
      const normalized = normalizeEventName(type)
      const records = recordsByType.get(normalized) ?? []
      const record = { type: normalized, handler, source }
      records.push(record)
      recordsByType.set(normalized, records)
      return () => removeFromArray(records, record)
    },
    async run(event, input = {}) {
      let aggregate: HookResult | undefined
      for (const record of scheduler.order(recordsByType.get(event.type) ?? [])) {
        const result = await invokeHookAtom(errorPolicy, record.source, event, input.signal, services, (ctx) => record.handler(event, ctx))
        aggregate = mergeHookResult(aggregate, result)
        if (hookResultShouldStop(result)) return aggregate
      }
      return aggregate
    },
    records(type) {
      if (!type) return [...recordsByType.values()].flat().map((record) => ({ ...record }))
      return (recordsByType.get(normalizeEventName(type)) ?? []).map((record) => ({ ...record }))
    },
    clear() {
      recordsByType.clear()
    },
  }
}

export function createHookCleanupScope(options: HookAtomOptions = {}): HookCleanupScopePort {
  const records: HookCleanupRecord[] = []
  const scheduler = options.scheduler ?? createSourceOrderedHookScheduler()
  const errorPolicy = options.errorPolicy ?? createCollectAndContinueHookErrorPolicy()
  const services = options.services ?? new Map<string, unknown>()
  return {
    add(cleanup, source) {
      const record = { cleanup, source }
      records.push(record)
      return () => removeFromArray(records, record)
    },
    async dispose(input = {}) {
      const pending = scheduler.order(records).reverse()
      records.length = 0
      const event = eventForCleanup()
      const results: HookCleanupResult[] = []
      for (const record of pending) {
        try {
          await invokeHookAtom(errorPolicy, record.source, event, input.signal, services, () => record.cleanup())
          results.push({ source: record.source, ok: true })
        } catch (error) {
          results.push({ source: record.source, ok: false, error })
          throw error
        }
      }
      return results
    },
    records() {
      return records.map((record) => ({ ...record }))
    },
    clear() {
      records.length = 0
    },
  }
}

export function createHookEventBus(input: { observerChain: HookObserverChainPort; handlerChain: HookHandlerChainPort }): HookBusPort {
  return {
    observe(observer, source) {
      return input.observerChain.register(observer, source)
    },
    on(type, handler, source) {
      return input.handlerChain.register(type, handler, source)
    },
    async emit(event, signal) {
      const normalized: EventEnvelope = { ...event, type: normalizeEventName(event.type as EventNameAlias) }
      await input.observerChain.run(normalized, signal ? { signal } : {})
      return input.handlerChain.run(normalized, signal ? { signal } : {})
    },
    observerRecords() {
      return input.observerChain.records()
    },
    handlerRecords(type) {
      return input.handlerChain.records(type)
    },
    clear() {
      input.observerChain.clear()
      input.handlerChain.clear()
    },
  }
}

export function createHookRegistryAtoms(input: { services?: Map<string, unknown>; registries?: HookRegistries } = {}): HookRegistryAtoms {
  const services = input.services ?? new Map<string, unknown>()
  const registries = input.registries ?? createHookRegistries()
  return {
    registries,
    services,
    tool: {
      register(tool, source) {
        registries.tools.set(tool.name, { ...tool })
        services.set(`tool:${tool.name}`, { tool, source })
        return () => {
          if (registries.tools.get(tool.name)?.name === tool.name) registries.tools.delete(tool.name)
          services.delete(`tool:${tool.name}`)
        }
      },
    },
    command: {
      registerCommand(command, source) {
        const resolvedSource = command.source ?? source
        registries.commands.set(command.name, { ...command, source: resolvedSource })
        return () => {
          if (registries.commands.get(command.name)?.source?.id === resolvedSource.id) registries.commands.delete(command.name)
        }
      },
      registerShortcut(shortcut, source) {
        const resolvedSource = shortcut.source ?? source
        registries.shortcuts.set(shortcut.key, { ...shortcut, source: resolvedSource })
        return () => {
          if (registries.shortcuts.get(shortcut.key)?.source?.id === resolvedSource.id) registries.shortcuts.delete(shortcut.key)
        }
      },
      registerFlag(flag, source) {
        const resolvedSource = flag.source ?? source
        registries.flags.set(flag.name, { ...flag, source: resolvedSource })
        return () => {
          if (registries.flags.get(flag.name)?.source?.id === resolvedSource.id) registries.flags.delete(flag.name)
        }
      },
    },
    provider: {
      registerProvider(provider, source) {
        const resolvedSource = provider.source ?? source
        registries.providers.set(provider.name, { ...provider, source: resolvedSource })
        services.set(`provider:${provider.name}`, { provider, source: resolvedSource })
        return () => {
          if (registries.providers.get(provider.name)?.source?.id === resolvedSource.id) registries.providers.delete(provider.name)
          services.delete(`provider:${provider.name}`)
        }
      },
      registerAuth(auth, source) {
        const resolvedSource = auth.source ?? source
        registries.auth.set(auth.name, { ...auth, source: resolvedSource })
        services.set(`auth:${auth.name}`, { auth, source: resolvedSource })
        return () => {
          if (registries.auth.get(auth.name)?.source?.id === resolvedSource.id) registries.auth.delete(auth.name)
          services.delete(`auth:${auth.name}`)
        }
      },
    },
    ui: {
      registerUIProvider(provider, source) {
        const resolvedSource = provider.source ?? source
        registries.uiProviders.set(provider.name, { ...provider, source: resolvedSource })
        services.set(`uiProvider:${provider.name}`, { provider, source: resolvedSource })
        return () => {
          if (registries.uiProviders.get(provider.name)?.source?.id === resolvedSource.id) registries.uiProviders.delete(provider.name)
          services.delete(`uiProvider:${provider.name}`)
        }
      },
      registerMessageRenderer(renderer, source) {
        const resolvedSource = renderer.source ?? source
        registries.messageRenderers.set(renderer.customType, { ...renderer, source: resolvedSource })
        return () => {
          if (registries.messageRenderers.get(renderer.customType)?.source?.id === resolvedSource.id) {
            registries.messageRenderers.delete(renderer.customType)
          }
        }
      },
    },
  }
}

export function createHookRegistries(): HookRegistries {
  return {
    tools: new Map(),
    commands: new Map(),
    shortcuts: new Map(),
    flags: new Map(),
    providers: new Map(),
    auth: new Map(),
    uiProviders: new Map(),
    messageRenderers: new Map(),
  }
}

export function mergeHookResult(current: HookResult | undefined, next: HookResult | undefined): HookResult | undefined {
  if (!next) return current
  if (!current) return cloneResult(next)

  if (isObject(current) && isObject(next)) {
    if ("action" in next) return cloneResult(next)
    return { ...current, ...next }
  }
  return cloneResult(next)
}

export function hookResultShouldStop(result: HookResult | undefined): boolean {
  if (!isObject(result)) return false
  const record = result as Record<string, unknown>
  if (record["cancel"] === true) return true
  if (record["block"] === true) return true
  return result.action === "handled"
}

export type HookHostPublicSurfaceID =
  | "hook.bus"
  | "hook.observer-chain"
  | "hook.handler-chain"
  | "hook.scheduler"
  | "hook.error-policy"
  | "hook.cleanup-scope"
  | "hook.registry-atoms"
  | "registry.command"
  | "registry.provider"
  | "registry.ui"
  | "tool.registry"

export interface HookHostPublicSurfaceRef {
  surfaceID: HookHostPublicSurfaceID
  exportedSymbols: string[]
  exposure: "common-host-partial-surface"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  lifecycleDimensions: Array<"loader-runtime" | "hook-order" | "failure-path" | "registry-state" | "cleanup-side-effects">
  productRuntimeBlockers: string[]
  knownLossiness: string[]
}

export interface HookHostPublicSurfaceGuardSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:hook-host-public-surface-guard"
  fixtureID: "hook:host-public-surface-guard"
  fixtureDiffTarget: "hook.plugin-lifecycle-replay"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  surfaceRefs: HookHostPublicSurfaceRef[]
  nativeBlockers: string[]
  summary: string
  fingerprint: string
}

export interface HookHostPublicSurfaceGuardIssue {
  id: string
  surfaceID?: HookHostPublicSurfaceID
  message: string
}

export interface HookHostPublicSurfaceGuardVerification {
  ok: boolean
  issues: HookHostPublicSurfaceGuardIssue[]
}

export function buildHookHostPublicSurfaceGuardSnapshot(): HookHostPublicSurfaceGuardSnapshot {
  const surfaceRefs: HookHostPublicSurfaceRef[] = [
    {
      surfaceID: "hook.bus",
      exportedSymbols: ["createHookEventBus", "HookBusPort"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["hook-order", "failure-path"],
      productRuntimeBlockers: ["product-native-hook-event-timing:not-proven", "product-native-plugin-dispatch:not-proven"],
      knownLossiness: ["hook-host-bus-product-runtime-not-spawned", "hook-host-wall-clock-order-not-proven"],
    },
    {
      surfaceID: "hook.observer-chain",
      exportedSymbols: ["createHookObserverChain", "HookObserverChainPort"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["hook-order", "failure-path"],
      productRuntimeBlockers: ["product-native-observer-side-effects:not-proven", "product-native-observer-async-interleaving:not-proven"],
      knownLossiness: ["hook-host-observer-chain-common-only", "hook-host-observer-async-interleaving-not-proven"],
    },
    {
      surfaceID: "hook.handler-chain",
      exportedSymbols: ["createHookHandlerChain", "HookHandlerChainPort", "mergeHookResult", "hookResultShouldStop"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["hook-order", "failure-path"],
      productRuntimeBlockers: ["product-native-handler-stop-policy:not-proven", "product-native-handler-result-identity:not-proven"],
      knownLossiness: ["hook-host-handler-chain-common-only", "hook-host-handler-result-object-identity-not-proven"],
    },
    {
      surfaceID: "hook.scheduler",
      exportedSymbols: ["createSourceOrderedHookScheduler", "createSerialHookScheduler", "createParallelHookScheduler", "HookSchedulerPort"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["hook-order"],
      productRuntimeBlockers: ["product-native-hook-scheduler-timing:not-proven", "product-native-parallel-interleaving:not-proven"],
      knownLossiness: ["hook-host-scheduler-wall-clock-not-proven", "hook-host-parallel-interleaving-not-native"],
    },
    {
      surfaceID: "hook.error-policy",
      exportedSymbols: ["createHookErrorPolicy", "createCollectAndContinueHookErrorPolicy", "createFailFastHookErrorPolicy", "HookErrorPolicyPort"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["failure-path"],
      productRuntimeBlockers: ["product-native-hook-error-policy:not-proven", "product-native-error-render-side-effects:not-proven"],
      knownLossiness: ["hook-host-error-policy-common-only", "hook-host-error-render-side-effects-not-proven"],
    },
    {
      surfaceID: "hook.cleanup-scope",
      exportedSymbols: ["createHookCleanupScope", "HookCleanupScopePort"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["cleanup-side-effects", "failure-path"],
      productRuntimeBlockers: ["product-native-plugin-cleanup-order:not-proven", "product-native-hot-reload-cleanup:not-proven"],
      knownLossiness: ["hook-host-cleanup-side-effects-not-replayed", "hook-host-hot-reload-cleanup-not-native"],
    },
    {
      surfaceID: "hook.registry-atoms",
      exportedSymbols: ["createHookRegistryAtoms", "createHookRegistries", "HookRegistryAtoms"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["registry-state"],
      productRuntimeBlockers: ["product-native-plugin-registry-mutation:not-proven", "product-native-registry-object-identity:not-proven"],
      knownLossiness: ["hook-host-registry-state-common-only", "hook-host-registry-object-identity-not-proven"],
    },
    {
      surfaceID: "registry.command",
      exportedSymbols: ["CommandRegistryPort", "createHookRegistryAtoms"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["registry-state"],
      productRuntimeBlockers: ["product-native-command-registration-side-effects:not-proven"],
      knownLossiness: ["hook-host-command-registry-common-only"],
    },
    {
      surfaceID: "registry.provider",
      exportedSymbols: ["ProviderRegistryPort", "createHookRegistryAtoms"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["registry-state", "loader-runtime"],
      productRuntimeBlockers: ["product-native-provider-plugin-loader:not-proven", "product-native-auth-registration-side-effects:not-proven"],
      knownLossiness: ["hook-host-provider-registry-common-only", "hook-host-provider-plugin-runtime-not-spawned"],
    },
    {
      surfaceID: "registry.ui",
      exportedSymbols: ["UIRegistryPort", "createHookRegistryAtoms"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["registry-state"],
      productRuntimeBlockers: ["product-native-ui-registry-render-side-effects:not-proven"],
      knownLossiness: ["hook-host-ui-registry-common-only", "hook-host-ui-render-side-effects-not-proven"],
    },
    {
      surfaceID: "tool.registry",
      exportedSymbols: ["ToolRegistryPort", "createHookRegistryAtoms"],
      exposure: "common-host-partial-surface",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleDimensions: ["registry-state", "loader-runtime"],
      productRuntimeBlockers: ["product-native-tool-registry-loader:not-proven", "product-native-tool-definition-side-effects:not-proven"],
      knownLossiness: ["hook-host-tool-registry-common-only", "hook-host-tool-definition-side-effects-not-proven"],
    },
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:hook-host-public-surface-guard" as const,
    fixtureID: "hook:host-public-surface-guard" as const,
    fixtureDiffTarget: "hook.plugin-lifecycle-replay" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    nativeParityClaim: false as const,
    surfaceRefs,
    nativeBlockers: [
      "product-native-plugin-loader-runtime:not-proven",
      "product-native-hook-wall-clock-timing:not-proven",
      "product-native-registry-side-effects:not-proven",
      "product-native-cleanup-side-effects:not-proven",
    ],
    summary: "lego-hooks public host atoms are shared partial lifecycle evidence and require product-specific exact replay before any native parity claim.",
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: hookHostPublicSurfaceFingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyHookHostPublicSurfaceGuardSnapshot(
  snapshot: HookHostPublicSurfaceGuardSnapshot,
): HookHostPublicSurfaceGuardVerification {
  const issues: HookHostPublicSurfaceGuardIssue[] = []
  if (snapshot.nativeParityClaim) {
    issues.push({
      id: "hook-host-public-surface.native-claim",
      message: "Hook host public surface guard cannot claim native parity.",
    })
  }
  for (const surfaceID of hookHostPublicSurfaceIDs()) {
    const ref = snapshot.surfaceRefs.find((item) => item.surfaceID === surfaceID)
    if (!ref) {
      issues.push({
        id: "hook-host-public-surface.missing-surface",
        surfaceID,
        message: `${surfaceID} is no longer represented in the hook host public surface guard.`,
      })
      continue
    }
    if (ref.nativeParityClaim) {
      issues.push({
        id: "hook-host-public-surface.surface-native-claim",
        surfaceID,
        message: `${surfaceID} claims native parity without product-specific lifecycle replay.`,
      })
    }
    if (ref.exposure !== "common-host-partial-surface" || ref.exactDiffStatus !== "exact-diff-partial") {
      issues.push({
        id: "hook-host-public-surface.partial-status",
        surfaceID,
        message: `${surfaceID} no longer records a partial common host surface status.`,
      })
    }
    if (ref.exportedSymbols.length === 0) {
      issues.push({
        id: "hook-host-public-surface.exported-symbols",
        surfaceID,
        message: `${surfaceID} no longer records exported hook host symbols.`,
      })
    }
    if (ref.lifecycleDimensions.length === 0) {
      issues.push({
        id: "hook-host-public-surface.lifecycle-dimensions",
        surfaceID,
        message: `${surfaceID} no longer records lifecycle dimensions.`,
      })
    }
    if (!hookHostPublicSurfaceHasLossiness(ref.knownLossiness)) {
      issues.push({
        id: "hook-host-public-surface.lossiness",
        surfaceID,
        message: `${surfaceID} no longer records partial/lossy lifecycle evidence.`,
      })
    }
    if (!hookHostPublicSurfaceHasNativeBlocker(ref.productRuntimeBlockers)) {
      issues.push({
        id: "hook-host-public-surface.product-runtime-blockers",
        surfaceID,
        message: `${surfaceID} no longer records product runtime blockers.`,
      })
    }
  }
  if (!hookHostPublicSurfaceHasNativeBlocker(snapshot.nativeBlockers)) {
    issues.push({
      id: "hook-host-public-surface.native-blockers",
      message: "Hook host public surface guard no longer records native blockers.",
    })
  }
  if (/native parity complete/i.test(snapshot.summary) || !/product-specific exact replay/i.test(snapshot.summary)) {
    issues.push({
      id: "hook-host-public-surface.summary",
      message: "Hook host public surface guard summary no longer states the product-specific exact replay requirement.",
    })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = snapshot
  if (snapshot.fingerprint !== hookHostPublicSurfaceFingerprintObject(withoutFingerprint)) {
    issues.push({
      id: "hook-host-public-surface.fingerprint",
      message: "Hook host public surface guard fingerprint is not stable.",
    })
  }
  return { ok: issues.length === 0, issues }
}

async function invokeHookAtom<T>(
  errorPolicy: HookErrorPolicyPort,
  source: HookSourceInfo,
  event: EventEnvelope,
  signal: AbortSignal | undefined,
  services: Map<string, unknown>,
  fn: (ctx: HookContext) => T | Promise<T>,
): Promise<T | undefined> {
  try {
    return await fn({ source, signal, services })
  } catch (error) {
    const decision = errorPolicy.handle({ source, event, error })
    if (decision === "throw") throw error
    return undefined
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function cloneResult<T extends HookResult>(result: T): T {
  if (!isObject(result)) return result
  return structuredClone(result) as T
}

function removeFromArray<T>(array: T[], item: T): void {
  const index = array.indexOf(item)
  if (index >= 0) array.splice(index, 1)
}

function eventForCleanup(): EventEnvelope {
  return {
    type: "session.shutdown",
    timestamp: Date.now(),
    payload: { reason: "cleanup" },
  }
}

function hookHostPublicSurfaceIDs(): HookHostPublicSurfaceID[] {
  return [
    "hook.bus",
    "hook.observer-chain",
    "hook.handler-chain",
    "hook.scheduler",
    "hook.error-policy",
    "hook.cleanup-scope",
    "hook.registry-atoms",
    "registry.command",
    "registry.provider",
    "registry.ui",
    "tool.registry",
  ]
}

function hookHostPublicSurfaceHasLossiness(values: string[]): boolean {
  return values.some((value) => /loss|lossy|not-proven|not-native|common-only|not-spawned|not-replayed/i.test(value))
}

function hookHostPublicSurfaceHasNativeBlocker(values: string[]): boolean {
  return values.some((value) => /not-proven|not-replayed|not-spawned|not-native/i.test(value))
}

function hookHostPublicSurfaceFingerprintObject(value: unknown): string {
  return createHash("sha256").update(hookHostPublicSurfaceStableStringify(value)).digest("hex").slice(0, 16)
}

function hookHostPublicSurfaceStableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(hookHostPublicSurfaceStableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${hookHostPublicSurfaceStableStringify(record[key])}`).join(",")}}`
}
