import { createHash } from "node:crypto"
import type {
  LegoAssemblyBinding,
  LegoAssemblyLockfile,
  LegoCapabilityRef,
  LegoLifecycleScope,
  LegoModuleContext,
  LegoModuleFactory,
  LegoModuleInstance,
  LegoModuleManifest,
  LegoRecipe,
} from "@helix/contracts"
import { capabilityMatches, normalizeCapabilityRef, normalizeCapabilityRefs, serviceTokenID } from "@helix/contracts"

export interface RegisteredModule {
  manifest: LegoModuleManifest
  factory: LegoModuleFactory
}

export interface AssemblyResult {
  recipe: LegoRecipe
  context: LegoModuleContext
  instances: LegoModuleInstance[]
  graph: Array<{ id: string; provides: string[]; requires: string[] }>
  bindings: LegoAssemblyBinding[]
  lockfile: LegoAssemblyLockfile
}

export class ModuleCatalog {
  private readonly modules = new Map<string, RegisteredModule>()

  register(manifest: LegoModuleManifest, factory: LegoModuleFactory): void {
    const id = String(manifest.id)
    if (this.modules.has(id)) throw new Error(`Module already registered: ${id}`)
    this.modules.set(id, { manifest, factory })
  }

  get(id: string): RegisteredModule | undefined {
    return this.modules.get(id)
  }

  list(): LegoModuleManifest[] {
    return Array.from(this.modules.values()).map((entry) => entry.manifest)
  }

  entriesFor(recipe: LegoRecipe): RegisteredModule[] {
    return recipe.modules.map((ref) => {
      const found = this.modules.get(ref.id)
      if (!found) throw new Error(`Recipe ${recipe.id} references unknown module ${ref.id}`)
      return found
    })
  }
}

export class CapabilityResolver {
  resolve(recipe: LegoRecipe, selected: RegisteredModule[]): RegisteredModule[] {
    const issues = validateCapabilityBindings(recipe, selected)
    if (issues.length > 0) throw new Error(`Recipe ${recipe.id} has invalid capability bindings:\n${issues.join("\n")}`)
    return topologicalSort(recipe, selected)
  }

  bindings(recipe: LegoRecipe, selected: RegisteredModule[]): LegoAssemblyBinding[] {
    return buildBindings(recipe, selected)
  }
}

export class BindingPlanner {
  plan(recipe: LegoRecipe, selected: RegisteredModule[]): LegoAssemblyBinding[] {
    return buildBindings(recipe, selected)
  }
}

export interface LifecycleRunResult {
  context: LegoModuleContext
  instances: LegoModuleInstance[]
  dispose(input?: { scope?: LegoLifecycleScope; reason?: string }): Promise<void>
}

export class LifecycleRunner {
  async run(resolved: RegisteredModule[], config: Record<string, unknown> = {}): Promise<LifecycleRunResult> {
    const context = createModuleContext(config)
    const instances: LegoModuleInstance[] = []
    const disposed = new Set<LegoModuleInstance>()

    for (const entry of resolved) {
      const instance = await entry.factory(context)
      instances.push(instance)
      context.setService(String(entry.manifest.id), instance)
      for (const capability of normalizeCapabilityRefs(entry.manifest.provides)) {
        registerCapabilityService(context, capability, instance)
      }
      await instance.init?.(context)
    }

    for (const instance of instances) await instance.start?.(context)
    return {
      context,
      instances,
      async dispose(input = {}) {
        const scope = input.scope ?? "process"
        for (const instance of [...instances].reverse()) {
          if (disposed.has(instance) || !instanceMatchesDisposeScope(instance, scope)) continue
          await instance.stop?.(input.reason)
          await instance.dispose?.()
          disposed.add(instance)
        }
      },
    }
  }
}

export class AssemblyGraph {
  graph(resolved: RegisteredModule[]): AssemblyResult["graph"] {
    return resolved.map((entry) => ({
      id: String(entry.manifest.id),
      provides: normalizeCapabilityRefs(entry.manifest.provides).map((capability) => capability.id),
      requires: normalizeCapabilityRefs(entry.manifest.requires).map((capability) => capability.id),
    }))
  }

  lockfile(recipe: LegoRecipe, resolved: RegisteredModule[], bindings: LegoAssemblyBinding[]): LegoAssemblyLockfile {
    return createAssemblyLockfile(recipe, resolved, bindings)
  }
}

export class ModuleRegistry {
  private readonly catalog = new ModuleCatalog()
  private readonly resolver = new CapabilityResolver()
  private readonly bindingPlanner = new BindingPlanner()
  private readonly lifecycleRunner = new LifecycleRunner()
  private readonly assemblyGraph = new AssemblyGraph()

  register(manifest: LegoModuleManifest, factory: LegoModuleFactory): void {
    this.catalog.register(manifest, factory)
  }

  get(id: string): RegisteredModule | undefined {
    return this.catalog.get(id)
  }

  list(): LegoModuleManifest[] {
    return this.catalog.list()
  }

  resolve(recipe: LegoRecipe): RegisteredModule[] {
    return this.resolver.resolve(recipe, this.catalog.entriesFor(recipe))
  }

  async assemble(recipe: LegoRecipe, config: Record<string, unknown> = {}): Promise<AssemblyResult> {
    const selected = this.catalog.entriesFor(recipe)
    const resolved = this.resolver.resolve(recipe, selected)
    const bindings = this.bindingPlanner.plan(recipe, selected)
    const { context, instances } = await this.lifecycleRunner.run(resolved, config)

    return {
      recipe,
      context,
      instances,
      graph: this.assemblyGraph.graph(resolved),
      bindings,
      lockfile: this.assemblyGraph.lockfile(recipe, resolved, bindings),
    }
  }
}

function createModuleContext(config: Record<string, unknown>): LegoModuleContext & Required<Pick<LegoModuleContext, "getService" | "requireService" | "setService">> {
  const services = new Map<string, unknown>()
  const context: LegoModuleContext & Required<Pick<LegoModuleContext, "getService" | "requireService" | "setService">> = {
    services,
    config,
    getService<T>(token: Parameters<NonNullable<LegoModuleContext["getService"]>>[0]): T | undefined {
      return services.get(serviceTokenID(token)) as T | undefined
    },
    requireService<T>(token: Parameters<NonNullable<LegoModuleContext["requireService"]>>[0]): T {
      const id = serviceTokenID(token)
      if (!services.has(id)) throw new Error(`Required service is not registered: ${id}`)
      return services.get(id) as T
    },
    setService<T>(token: Parameters<NonNullable<LegoModuleContext["setService"]>>[0], value: T): void {
      services.set(serviceTokenID(token), value)
    },
  }
  return context
}

function registerCapabilityService(context: Required<Pick<LegoModuleContext, "services" | "setService">>, capability: LegoCapabilityRef, instance: LegoModuleInstance): void {
  if (capability.multiplicity === "multi") {
    const listKey = `${capability.id}[]`
    const existingList = context.services.get(listKey)
    const list = Array.isArray(existingList) ? existingList : []
    list.push(instance)
    context.setService(listKey, list)
    return
  }
  if (!context.services.has(capability.id)) context.setService(capability.id, instance)
}

const lifecycleScopeOrder: LegoLifecycleScope[] = ["process", "workspace", "session", "turn", "tool-call"]

function instanceMatchesDisposeScope(instance: LegoModuleInstance, scope: LegoLifecycleScope): boolean {
  const requestedDepth = lifecycleScopeOrder.indexOf(scope)
  return lifecycleScopesForInstance(instance).some((candidate) => lifecycleScopeOrder.indexOf(candidate) >= requestedDepth)
}

function lifecycleScopesForInstance(instance: LegoModuleInstance): LegoLifecycleScope[] {
  return instance.manifest.lifecycleScopes?.length ? instance.manifest.lifecycleScopes : ["process"]
}

function topologicalSort(recipe: LegoRecipe, entries: RegisteredModule[]): RegisteredModule[] {
  const byID = new Map<string, RegisteredModule>()
  for (const entry of entries) {
    byID.set(String(entry.manifest.id), entry)
  }

  const temporary = new Set<string>()
  const permanent = new Set<string>()
  const output: RegisteredModule[] = []

  function visit(entry: RegisteredModule) {
    const id = String(entry.manifest.id)
    if (permanent.has(id)) return
    if (temporary.has(id)) throw new Error(`Cycle detected while resolving module ${id}`)
    temporary.add(id)

    for (const requirement of normalizeCapabilityRefs(entry.manifest.requires)) {
      for (const provider of providersForRequirement(recipe, entries, entry, requirement, false)) {
        visit(provider)
      }
    }

    temporary.delete(id)
    permanent.add(id)
    output.push(entry)
  }

  for (const entry of byID.values()) visit(entry)
  return output
}

function validateCapabilityBindings(recipe: LegoRecipe, selected: RegisteredModule[]): string[] {
  const issues: string[] = []
  const selectedIDs = new Set(selected.map((entry) => String(entry.manifest.id)))
  for (const binding of recipe.bindings ?? []) {
    if (!selectedIDs.has(binding.module)) issues.push(`Binding ${binding.port} points to unselected module ${binding.module}`)
  }
  for (const entry of selected) {
    for (const requirement of normalizeCapabilityRefs(entry.manifest.requires)) {
      const providers = providersForRequirement(recipe, selected, entry, requirement, false)
      if (providers.length === 0) {
        issues.push(`Module ${String(entry.manifest.id)} requires missing capability ${requirement.id}`)
      }
    }
    for (const optional of normalizeCapabilityRefs(entry.manifest.optional)) {
      providersForRequirement(recipe, selected, entry, optional, true)
    }
  }
  for (const required of normalizeCapabilityRefs(recipe.requiredCapabilities)) {
    if (providersForCapability(recipe, selected, required, undefined, false).length === 0) {
      issues.push(`Recipe requires missing capability ${required.id}`)
    }
  }
  return issues
}

function buildBindings(recipe: LegoRecipe, selected: RegisteredModule[]): LegoAssemblyBinding[] {
  const bindings: LegoAssemblyBinding[] = []
  for (const entry of selected) {
    const consumer = String(entry.manifest.id)
    for (const requirement of normalizeCapabilityRefs(entry.manifest.requires)) {
      for (const provider of providersForRequirement(recipe, selected, entry, requirement, false)) {
        bindings.push(bindingFor(recipe, selected, consumer, requirement, provider))
      }
    }
    for (const optional of normalizeCapabilityRefs(entry.manifest.optional)) {
      for (const provider of providersForRequirement(recipe, selected, entry, optional, true)) {
        bindings.push(bindingFor(recipe, selected, consumer, optional, provider))
      }
    }
  }
  for (const capability of normalizeCapabilityRefs(recipe.requiredCapabilities)) {
    for (const provider of providersForCapability(recipe, selected, capability, undefined, false)) {
      bindings.push(bindingFor(recipe, selected, "recipe", capability, provider))
    }
  }
  return bindings
}

function bindingFor(
  recipe: LegoRecipe,
  selected: RegisteredModule[],
  consumer: string,
  capability: LegoCapabilityRef,
  provider: RegisteredModule,
): LegoAssemblyBinding {
  return {
    capability,
    consumer,
    provider: String(provider.manifest.id),
    explicit: Boolean(explicitBinding(recipe, capability)),
    candidates: candidateProvidersForCapability(selected, capability).map((entry) => String(entry.manifest.id)),
  }
}

function providersForRequirement(
  recipe: LegoRecipe,
  selected: RegisteredModule[],
  consumer: RegisteredModule,
  requirement: LegoCapabilityRef,
  optional: boolean,
): RegisteredModule[] {
  return providersForCapability(recipe, selected.filter((entry) => entry !== consumer), requirement, consumer, optional)
}

function candidateProvidersForCapability(selected: RegisteredModule[], capability: LegoCapabilityRef): RegisteredModule[] {
  return selected.filter((entry) => normalizeCapabilityRefs(entry.manifest.provides).some((provided) => capabilityMatches(provided, capability)))
}

function providersForCapability(
  recipe: LegoRecipe,
  selected: RegisteredModule[],
  capability: LegoCapabilityRef,
  consumer: RegisteredModule | undefined,
  optional: boolean,
): RegisteredModule[] {
  const binding = explicitBinding(recipe, capability)
  const candidates = selected.filter((entry) =>
    normalizeCapabilityRefs(entry.manifest.provides).some((provided) => capabilityMatches(provided, binding?.capability ?? capability)),
  )

  if (binding) {
    const provider = candidates.find((entry) => String(entry.manifest.id) === binding.module)
    if (!provider && !optional) {
      const consumerID = consumer ? ` for ${String(consumer.manifest.id)}` : ""
      throw new Error(`Explicit binding ${capability.id}${consumerID} points to ${binding.module}, but that module does not provide the capability`)
    }
    return provider ? [provider] : []
  }

  if (candidates.length <= 1) return candidates
  if (capability.multiplicity === "multi") return candidates
  const multiCandidates = candidates.filter((entry) =>
    normalizeCapabilityRefs(entry.manifest.provides).some((provided) => provided.id === capability.id && provided.multiplicity === "multi"),
  )
  if (multiCandidates.length > 0) return candidates
  const consumerID = consumer ? ` for ${String(consumer.manifest.id)}` : ""
  throw new Error(
    `Ambiguous capability ${capability.id}${consumerID}: ${candidates.map((entry) => String(entry.manifest.id)).join(", ")}. Add an explicit recipe binding.`,
  )
}

function explicitBinding(recipe: LegoRecipe, capability: LegoCapabilityRef): { port: string; module: string; capability?: string; as?: string } | undefined {
  return (recipe.bindings ?? []).find((binding) => binding.port === capability.id || binding.capability === capability.id)
}

function createAssemblyLockfile(recipe: LegoRecipe, resolved: RegisteredModule[], bindings: LegoAssemblyBinding[]): LegoAssemblyLockfile {
  return {
    schemaVersion: 1,
    recipeID: recipe.id,
    recipeVersion: recipe.version,
    modules: resolved.map((entry) => ({
      id: String(entry.manifest.id),
      version: entry.manifest.version,
      kind: entry.manifest.kind,
      personality: entry.manifest.personality ?? "common",
      provides: normalizeCapabilityRefs(entry.manifest.provides),
      requires: normalizeCapabilityRefs(entry.manifest.requires),
      ...(entry.manifest.resources ? { resources: entry.manifest.resources } : {}),
    })),
    bindings,
  }
}

export function createManifest(input: LegoModuleManifest): LegoModuleManifest {
  return input
}

export type RuntimeRegistryLifecycleGuardEventKind = "factory" | "init" | "start" | "stop" | "dispose"

export interface RuntimeRegistryLifecycleGuardEvent {
  sequence: number
  moduleID: string
  kind: RuntimeRegistryLifecycleGuardEventKind
  reason?: string
}

export interface RuntimeRegistryLifecycleStartStopGuardSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:runtime-registry-lifecycle-start-stop-guard"
  fixtureID: "runtime:registry-lifecycle-start-stop-guard"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  lifecycleScope: LegoLifecycleScope
  expectedSequence: string[]
  events: RuntimeRegistryLifecycleGuardEvent[]
  nativeBlockers: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface RuntimeRegistryLifecycleStartStopGuardIssue {
  id: string
  event?: string
  message: string
}

export interface RuntimeRegistryLifecycleStartStopGuardVerification {
  ok: boolean
  issues: RuntimeRegistryLifecycleStartStopGuardIssue[]
}

export async function buildRuntimeRegistryLifecycleStartStopGuardSnapshot(): Promise<RuntimeRegistryLifecycleStartStopGuardSnapshot> {
  const events: RuntimeRegistryLifecycleGuardEvent[] = []
  const modules = ["runtime.acceptance.controller", "runtime.acceptance.evidence"] as const
  const runner = new LifecycleRunner()
  const run = await runner.run(
    modules.map((moduleID) => ({
      manifest: runtimeRegistryLifecycleGuardManifest(moduleID),
      factory: () => {
        runtimeRegistryLifecycleGuardRecord(events, moduleID, "factory")
        return {
          manifest: runtimeRegistryLifecycleGuardManifest(moduleID),
          init: () => runtimeRegistryLifecycleGuardRecord(events, moduleID, "init"),
          start: () => runtimeRegistryLifecycleGuardRecord(events, moduleID, "start"),
          stop: (reason?: string) => runtimeRegistryLifecycleGuardRecord(events, moduleID, "stop", reason),
          dispose: () => runtimeRegistryLifecycleGuardRecord(events, moduleID, "dispose"),
        }
      },
    })),
    { fixture: "runtime-registry-lifecycle-start-stop-guard" },
  )
  await run.dispose({ scope: "process", reason: "runtime-acceptance-registry-negative-gate" })

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:runtime-registry-lifecycle-start-stop-guard" as const,
    fixtureID: "runtime:registry-lifecycle-start-stop-guard" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    nativeParityClaim: false as const,
    lifecycleScope: "process" as const,
    expectedSequence: [
      "runtime.acceptance.controller:factory",
      "runtime.acceptance.controller:init",
      "runtime.acceptance.evidence:factory",
      "runtime.acceptance.evidence:init",
      "runtime.acceptance.controller:start",
      "runtime.acceptance.evidence:start",
      "runtime.acceptance.evidence:stop",
      "runtime.acceptance.evidence:dispose",
      "runtime.acceptance.controller:stop",
      "runtime.acceptance.controller:dispose",
    ],
    events,
    nativeBlockers: [
      "product-native-runtime-start-stop:not-proven",
      "acceptance-controller-stop-boundary:not-live-native",
      "acceptance-evidence-cleanup-order:not-live-native",
      "process-cleanup-side-effects:not-replayed",
    ],
    knownLossiness: [
      "runtime-registry-lifecycle-start-stop-partial-fixture",
      "runtime-registry-process-cleanup-side-effects-not-replayed",
      "runtime-registry-native-lifecycle-readback-not-proven",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: runtimeRegistryFingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyRuntimeRegistryLifecycleStartStopGuardSnapshot(
  snapshot: RuntimeRegistryLifecycleStartStopGuardSnapshot,
): RuntimeRegistryLifecycleStartStopGuardVerification {
  const issues: RuntimeRegistryLifecycleStartStopGuardIssue[] = []
  if (snapshot.exactDiffStatus !== "exact-diff-partial" || snapshot.nativeParityClaim !== false) {
    issues.push({
      id: "runtime-registry-lifecycle.native-claim",
      message: "Runtime registry lifecycle guard must remain exact-diff-partial and cannot claim native parity.",
    })
  }
  const actualSequence = snapshot.events.map((event) => `${event.moduleID}:${event.kind}`)
  if (actualSequence.join("|") !== snapshot.expectedSequence.join("|")) {
    issues.push({
      id: "runtime-registry-lifecycle.sequence",
      event: actualSequence.join("|"),
      message: "Runtime registry lifecycle start/stop sequence drifted from factory/init/start then reverse stop/dispose order.",
    })
  }
  for (const moduleID of ["runtime.acceptance.controller", "runtime.acceptance.evidence"]) {
    const stopEvent = snapshot.events.find((event) => event.moduleID === moduleID && event.kind === "stop")
    if (stopEvent?.reason !== "runtime-acceptance-registry-negative-gate") {
      issues.push({
        id: "runtime-registry-lifecycle.stop-reason",
        event: `${moduleID}:stop`,
        message: `${moduleID} stop event no longer preserves the runtime acceptance negative-gate reason.`,
      })
    }
  }
  if (!snapshot.nativeBlockers.some((blocker) => /start-stop|cleanup|side-effects|readback/.test(blocker))) {
    issues.push({
      id: "runtime-registry-lifecycle.native-blockers",
      message: "Runtime registry lifecycle guard no longer records lifecycle native blockers.",
    })
  }
  if (!snapshot.knownLossiness.some((lossiness) => /partial|not-replayed|not-proven/.test(lossiness))) {
    issues.push({
      id: "runtime-registry-lifecycle.lossiness",
      message: "Runtime registry lifecycle guard no longer carries partial/lossy evidence markers.",
    })
  }
  if (!/^[a-f0-9]{16}$/.test(snapshot.fingerprint)) {
    issues.push({
      id: "runtime-registry-lifecycle.fingerprint",
      message: "Runtime registry lifecycle guard fingerprint is not stable.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function runtimeRegistryLifecycleGuardManifest(moduleID: string): LegoModuleManifest {
  return {
    id: moduleID,
    version: "0.0.0-fixture",
    kind: "core",
    layer: "runtime",
    provides: [moduleID],
    requires: [],
    lifecycleScopes: ["process"],
    conformance: ["conformance:runtime-registry-lifecycle-start-stop-guard"],
  }
}

function runtimeRegistryLifecycleGuardRecord(
  events: RuntimeRegistryLifecycleGuardEvent[],
  moduleID: string,
  kind: RuntimeRegistryLifecycleGuardEventKind,
  reason?: string,
): void {
  const event: RuntimeRegistryLifecycleGuardEvent = {
    sequence: events.length + 1,
    moduleID,
    kind,
  }
  if (reason !== undefined) event.reason = reason
  events.push(event)
}

function runtimeRegistryFingerprintObject(value: unknown): string {
  return createHash("sha256").update(runtimeRegistryStableStringify(value)).digest("hex").slice(0, 16)
}

function runtimeRegistryStableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(runtimeRegistryStableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${runtimeRegistryStableStringify(record[key])}`).join(",")}}`
}
