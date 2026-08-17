import type { EventEnvelope, HookResult, LegoToolDefinition } from "@helix/contracts"
import { normalizeEventName } from "./aliases.ts"
import type {
  AuthRegistration,
  CommandRegistration,
  EventNameAlias,
  FlagRegistration,
  HookHandler,
  HookHostOptions,
  HookObserver,
  HookRegistries,
  HookScope,
  HookSourceInfo,
  MessageRendererRegistration,
  ProviderRegistration,
  ShortcutRegistration,
  UIProviderRegistration,
} from "./types.ts"
import {
  createCollectAndContinueHookErrorPolicy,
  createFailFastHookErrorPolicy,
  createHookCleanupScope,
  createHookEventBus,
  createHookHandlerChain,
  createHookObserverChain,
  createHookRegistryAtoms,
  createSourceOrderedHookScheduler,
  mergeHookResult,
  type HookBusPort,
  type HookCleanupScopePort,
  type HookRegistryAtoms,
  type HookSourceRegistryRecord,
  type HookSourceRegistrySnapshot,
} from "./hook-atoms.ts"

export class LegoHookHost {
  readonly registries: HookRegistries
  readonly services = new Map<string, unknown>()
  private readonly bus: HookBusPort
  private readonly cleanupScope: HookCleanupScopePort
  private readonly registryAtoms: HookRegistryAtoms
  private sourceCounter = 0

  constructor(options: HookHostOptions = {}) {
    const scheduler = createSourceOrderedHookScheduler()
    const errorPolicy =
      options.errorMode === "throw" ? createFailFastHookErrorPolicy(options.onError) : createCollectAndContinueHookErrorPolicy(options.onError)
    const observerChain = createHookObserverChain({ scheduler, errorPolicy, services: this.services })
    const handlerChain = createHookHandlerChain({ scheduler, errorPolicy, services: this.services })
    this.bus = createHookEventBus({ observerChain, handlerChain })
    this.cleanupScope = createHookCleanupScope({ scheduler, errorPolicy, services: this.services })
    this.registryAtoms = createHookRegistryAtoms({ services: this.services })
    this.registries = this.registryAtoms.registries
  }

  createScope(source: Omit<HookSourceInfo, "order"> & { order?: number }): HookScope {
    const sourceInfo: HookSourceInfo = {
      ...source,
      order: source.order ?? this.sourceCounter++,
    }
    const disposers: Array<() => void | Promise<void>> = []
    return {
      source: sourceInfo,
      observe: (observer) => {
        const unregister = this.observe(observer, sourceInfo)
        disposers.push(unregister)
        return unregister
      },
      on: (type, handler) => {
        const unregister = this.on(type, handler, sourceInfo)
        disposers.push(unregister)
        return unregister
      },
      addCleanup: (cleanup) => {
        const unregister = this.addCleanup(cleanup, sourceInfo)
        disposers.push(async () => {
          await cleanup()
          unregister()
        })
        return unregister
      },
      async dispose() {
        const pending = disposers.splice(0).reverse()
        for (const dispose of pending) await dispose()
      },
    }
  }

  observe(observer: HookObserver, source: HookSourceInfo = this.internalSource()): () => void {
    return this.bus.observe(observer, source)
  }

  on<TEvent extends EventEnvelope>(
    type: EventNameAlias,
    handler: HookHandler<TEvent>,
    source: HookSourceInfo = this.internalSource(),
  ): () => void {
    return this.bus.on(type, handler as HookHandler, source)
  }

  addCleanup(cleanup: () => void | Promise<void>, source: HookSourceInfo = this.internalSource()): () => void {
    return this.cleanupScope.add(cleanup, source)
  }

  async emit<TEvent extends EventEnvelope>(event: TEvent, signal?: AbortSignal): Promise<HookResult | undefined> {
    return this.bus.emit(event, signal)
  }

  snapshotHookSources(eventTypes: readonly string[] = []): HookSourceRegistrySnapshot {
    const observers = this.bus.observerRecords().map((record): HookSourceRegistryRecord => ({
      kind: "observer",
      source: cloneSourceInfo(record.source),
    }))
    const handlerRecords = this.bus.handlerRecords()
    const handlers = handlerRecords.map((record): HookSourceRegistryRecord => ({
      kind: "handler",
      event: record.type,
      source: cloneSourceInfo(record.source),
    }))
    const events = uniqueSorted([
      ...eventTypes.map((type) => normalizeEventName(type as EventNameAlias)),
      ...handlerRecords.map((record) => record.type),
    ])

    return {
      observers: sortHookSourceRecords(observers),
      handlers: sortHookSourceRecords(handlers),
      events: events.map((event) => {
        const eventHandlers = this.bus.handlerRecords(event as EventNameAlias).map((record): HookSourceRegistryRecord => ({
          kind: "handler",
          event: record.type,
          source: cloneSourceInfo(record.source),
        }))
        return {
          event,
          observerCount: observers.length,
          handlerCount: eventHandlers.length,
          sourceOrder: sortHookSourceRecords([...observers, ...eventHandlers]),
        }
      }),
    }
  }

  registerTool(tool: LegoToolDefinition, source: HookSourceInfo = this.internalSource()): () => void {
    return this.registryAtoms.tool.register(tool, source)
  }

  registerCommand(command: CommandRegistration, source: HookSourceInfo = this.internalSource()): () => void {
    return this.registryAtoms.command.registerCommand(command, source)
  }

  registerShortcut(shortcut: ShortcutRegistration, source: HookSourceInfo = this.internalSource()): () => void {
    return this.registryAtoms.command.registerShortcut(shortcut, source)
  }

  registerFlag(flag: FlagRegistration, source: HookSourceInfo = this.internalSource()): () => void {
    return this.registryAtoms.command.registerFlag(flag, source)
  }

  registerProvider(provider: ProviderRegistration, source: HookSourceInfo = this.internalSource()): () => void {
    return this.registryAtoms.provider.registerProvider(provider, source)
  }

  registerAuth(auth: AuthRegistration, source: HookSourceInfo = this.internalSource()): () => void {
    return this.registryAtoms.provider.registerAuth(auth, source)
  }

  registerUIProvider(provider: UIProviderRegistration, source: HookSourceInfo = this.internalSource()): () => void {
    return this.registryAtoms.ui.registerUIProvider(provider, source)
  }

  registerMessageRenderer(renderer: MessageRendererRegistration, source: HookSourceInfo = this.internalSource()): () => void {
    return this.registryAtoms.ui.registerMessageRenderer(renderer, source)
  }

  async clear(): Promise<void> {
    this.bus.clear()
    await this.cleanupScope.dispose()
  }

  private internalSource(): HookSourceInfo {
    return { id: "internal", scope: "internal", order: -1 }
  }
}

export { mergeHookResult }

function cloneSourceInfo(source: HookSourceInfo): HookSourceInfo {
  return {
    id: source.id,
    ...(source.name ? { name: source.name } : {}),
    ...(source.path ? { path: source.path } : {}),
    ...(source.scope ? { scope: source.scope } : {}),
    order: source.order,
    ...(source.metadata ? { metadata: { ...source.metadata } } : {}),
  }
}

function sortHookSourceRecords<TRecord extends HookSourceRegistryRecord>(records: readonly TRecord[]): TRecord[] {
  return [...records].sort((left, right) => {
    const order = left.source.order - right.source.order
    if (order !== 0) return order
    const kind = left.kind.localeCompare(right.kind)
    if (kind !== 0) return kind
    const event = (left.event ?? "").localeCompare(right.event ?? "")
    if (event !== 0) return event
    return left.source.id.localeCompare(right.source.id)
  })
}

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right))
}
