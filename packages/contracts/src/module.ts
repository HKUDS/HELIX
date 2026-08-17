import type { LegoModuleID } from "./ids"

export type LegoModuleKind =
  | "core"
  | "storage"
  | "hook"
  | "provider"
  | "tool"
  | "prompt"
  | "ui"
  | "adapter"
  | "product"
  | "port"
  | "atom"
  | "strategy"
  | "pack"
  | "product-shell"

export type LegoBlockType = "port" | "atom" | "strategy" | "pack" | "product-shell"

export type LegoBlockImplementationKind = "factory" | "bridge" | "metadata-only" | "preview"

export type LegoBlockLayer =
  | "foundation"
  | "identity"
  | "event"
  | "session"
  | "hook"
  | "turn"
  | "tool"
  | "provider"
  | "prompt"
  | "config"
  | "ui"
  | "product"
  | "runtime"
  | "conformance"

export type LegoCapabilityKind = "port" | "implementation" | "strategy" | "registry" | "surface"

export type LegoCapabilityMultiplicity = "single" | "multi"

export type LegoCapabilityStability = "experimental" | "stable"

export interface LegoCapabilityRef {
  id: string
  version?: string
  kind?: LegoCapabilityKind
  variant?: string
  multiplicity?: LegoCapabilityMultiplicity
  stability?: LegoCapabilityStability
  personality?: "common" | "opencode" | "pi-mono" | string
}

export type LegoCapabilityInput = string | LegoCapabilityRef

export type LegoPersonality = "common" | "opencode" | "pi-mono" | string

export type LegoResourceScope = "workspace" | "user" | "process" | "external" | "session" | "turn" | "tool-call"

export interface LegoResourceRef {
  id: "filesystem" | "network" | "shell" | "env" | "sqlite" | "extension-runtime" | string
  mode?: "read" | "write" | "execute"
  scope?: LegoResourceScope
}

export interface ResourceGrant extends LegoResourceRef {
  optional?: boolean
  reason?: string
}

export type ResourceGrantInput = string | ResourceGrant

export interface ConformanceRef {
  id: string
  suite?: string
  fixture?: string
  command?: string
  required?: boolean
}

export type ConformanceRefInput = string | ConformanceRef

export type LegoLifecycleScope = "process" | "workspace" | "session" | "turn" | "tool-call"

export interface LegoPortContractFixture {
  id: string
  input: string
  output: string
  lifecycle: LegoLifecycleScope[]
  resources: LegoResourceRef[]
  conformance: string
  implementations: string[]
  personalityAtoms: string[]
  errors?: string[]
  traces?: string[]
  testAtoms?: string[]
  implementationTypes?: Record<string, LegoBlockType>
  personalityAtomTypes?: Record<string, LegoBlockType>
  implementationKinds?: Record<string, LegoBlockImplementationKind>
  personalityAtomImplementationKinds?: Record<string, LegoBlockImplementationKind>
}

export type LegoInventoryBlockSource = "common" | "test" | "personality"

export interface LegoBlockInventoryEntry {
  id: string
  type: LegoBlockType
  personality: LegoPersonality
  source: LegoInventoryBlockSource
  port: string
  implementationKind: LegoBlockImplementationKind
}

export interface NormalizedLegoPortContractFixture extends LegoPortContractFixture {
  errors: string[]
  traces: string[]
  testAtoms: string[]
  portContract: PortContract<string, string>
  commonBlocks: LegoBlockInventoryEntry[]
  testBlocks: LegoBlockInventoryEntry[]
  personalityBlocks: LegoBlockInventoryEntry[]
  blocks: LegoBlockInventoryEntry[]
}

export interface LegoBlockManifest {
  id: string
  version: string
  type: LegoBlockType
  implementationKind: LegoBlockImplementationKind
  layer: LegoBlockLayer
  personality: LegoPersonality
  provides: LegoCapabilityRef[]
  requires: LegoCapabilityRef[]
  optional?: LegoCapabilityRef[]
  resources?: ResourceGrant[]
  lifecycleScopes?: LegoLifecycleScope[]
  configSchema?: unknown
  conformance?: ConformanceRef[]
}

export type LegoBlockManifestInput = Omit<LegoBlockManifest, "provides" | "requires" | "optional" | "resources" | "conformance" | "implementationKind"> & {
  implementationKind?: LegoBlockImplementationKind
  provides: LegoCapabilityInput[]
  requires: LegoCapabilityInput[]
  optional?: LegoCapabilityInput[]
  resources?: ResourceGrantInput[]
  conformance?: ConformanceRefInput[]
}

export interface PortContract<Input = unknown, Output = unknown> {
  id: string
  input: Input
  output: Output
  cardinality: LegoCapabilityMultiplicity
  lifecycle: LegoLifecycleScope[]
  resources: ResourceGrant[]
  errors: string[]
  traces: string[]
  conformance: ConformanceRef[]
}

export type PortContractInput<Input = unknown, Output = unknown> = Omit<PortContract<Input, Output>, "resources" | "conformance"> & {
  resources: ResourceGrantInput[]
  conformance: ConformanceRefInput[]
}

export interface AtomFactory<Config = unknown, Ports = Record<string, unknown>, Implementation = unknown> {
  manifest: LegoBlockManifest
  create(config: Config, ports: Ports): Implementation | Promise<Implementation>
}

export type AtomFactoryInput<Config = unknown, Ports = Record<string, unknown>, Implementation = unknown> = Omit<
  AtomFactory<Config, Ports, Implementation>,
  "manifest"
> & {
  manifest: LegoBlockManifestInput
}

export interface BindingSpec {
  port: string
  atom: string
  personality?: LegoPersonality
  scope?: LegoLifecycleScope
  resources?: ResourceGrant[]
  capability?: LegoCapabilityRef
  multiplicity?: LegoCapabilityMultiplicity
}

export type BindingSpecInput = Omit<BindingSpec, "resources" | "capability"> & {
  resources?: ResourceGrantInput[]
  capability?: LegoCapabilityInput
}

export interface LegoModuleManifest {
  id: LegoModuleID | string
  version: string
  kind: LegoModuleKind
  blockType?: LegoBlockType
  layer?: LegoBlockLayer
  provides: LegoCapabilityInput[]
  requires?: LegoCapabilityInput[]
  optional?: LegoCapabilityInput[]
  lifecycle?: Array<"init" | "start" | "stop" | "dispose">
  lifecycleScopes?: LegoLifecycleScope[]
  resources?: LegoResourceRef[]
  configSchema?: unknown
  capabilities?: Record<string, unknown>
  personality?: "common" | "opencode" | "pi-mono" | string
  conformance?: string[]
}

export interface LegoServiceToken<T = unknown> {
  id: string
  capability?: LegoCapabilityRef
  optional?: boolean
}

export interface LegoModuleContext {
  services: Map<string, unknown>
  config: Record<string, unknown>
  getService?<T>(token: LegoServiceToken<T> | string): T | undefined
  requireService?<T>(token: LegoServiceToken<T> | string): T
  setService?<T>(token: LegoServiceToken<T> | string, value: T): void
}

export interface LegoModuleInstance {
  manifest: LegoModuleManifest
  init?(ctx: LegoModuleContext): void | Promise<void>
  start?(ctx: LegoModuleContext): void | Promise<void>
  stop?(reason?: string): void | Promise<void>
  dispose?(): void | Promise<void>
}

export type LegoModuleFactory = (ctx: LegoModuleContext) => LegoModuleInstance | Promise<LegoModuleInstance>

export interface LegoAssemblyBinding {
  capability: LegoCapabilityRef
  consumer: string
  provider: string
  explicit: boolean
  candidates: string[]
}

export interface LegoAssemblyLockfile {
  schemaVersion: 1
  recipeID: string
  recipeVersion: string
  packs?: Array<{
    id: string
    version?: string
    atoms: string[]
  }>
  modules: Array<{
    id: string
    version: string
    kind: LegoModuleKind
    personality: string
    provides: LegoCapabilityRef[]
    requires: LegoCapabilityRef[]
    resources?: LegoResourceRef[]
  }>
  bindings: LegoAssemblyBinding[]
}

export function createServiceToken<T = unknown>(id: string, options: { capability?: LegoCapabilityInput; optional?: boolean } = {}): LegoServiceToken<T> {
  return {
    id,
    ...(options.capability ? { capability: normalizeCapabilityRef(options.capability) } : {}),
    ...(options.optional !== undefined ? { optional: options.optional } : {}),
  }
}

export function serviceTokenID(token: LegoServiceToken<unknown> | string): string {
  return typeof token === "string" ? token : token.id
}

export function normalizeCapabilityRef(input: LegoCapabilityInput): LegoCapabilityRef {
  if (typeof input === "string") {
    return {
      id: input,
      kind: "port",
      multiplicity: "single",
      stability: "stable",
    }
  }
  return {
    id: input.id,
    ...(input.version ? { version: input.version } : {}),
    ...(input.kind ? { kind: input.kind } : { kind: "port" }),
    ...(input.variant ? { variant: input.variant } : {}),
    ...(input.multiplicity ? { multiplicity: input.multiplicity } : { multiplicity: "single" }),
    ...(input.stability ? { stability: input.stability } : { stability: "stable" }),
    ...(input.personality ? { personality: input.personality } : {}),
  }
}

export function capabilityID(input: LegoCapabilityInput): string {
  return normalizeCapabilityRef(input).id
}

export function normalizeCapabilityRefs(inputs: readonly LegoCapabilityInput[] | undefined): LegoCapabilityRef[] {
  return (inputs ?? []).map((input) => normalizeCapabilityRef(input))
}

export function normalizeResourceGrant(input: ResourceGrantInput): ResourceGrant {
  if (typeof input === "string") return { id: input }
  return {
    id: input.id,
    ...(input.mode ? { mode: input.mode } : {}),
    ...(input.scope ? { scope: input.scope } : {}),
    ...(input.optional !== undefined ? { optional: input.optional } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
  }
}

export function normalizeResourceGrants(inputs: readonly ResourceGrantInput[] | undefined): ResourceGrant[] {
  return (inputs ?? []).map((input) => normalizeResourceGrant(input))
}

export function normalizeConformanceRef(input: ConformanceRefInput): ConformanceRef {
  if (typeof input === "string") return { id: input, required: true }
  return {
    id: input.id,
    ...(input.suite ? { suite: input.suite } : {}),
    ...(input.fixture ? { fixture: input.fixture } : {}),
    ...(input.command ? { command: input.command } : {}),
    ...(input.required !== undefined ? { required: input.required } : { required: true }),
  }
}

export function normalizeConformanceRefs(inputs: readonly ConformanceRefInput[] | undefined): ConformanceRef[] {
  return (inputs ?? []).map((input) => normalizeConformanceRef(input))
}

export function normalizeLegoBlockManifest(input: LegoBlockManifestInput): LegoBlockManifest {
  return {
    id: input.id,
    version: input.version,
    type: input.type,
    implementationKind: input.implementationKind ?? inferLegoBlockImplementationKind(input.id, { type: input.type, personality: input.personality }),
    layer: input.layer,
    personality: input.personality,
    provides: normalizeCapabilityRefs(input.provides),
    requires: normalizeCapabilityRefs(input.requires),
    ...(input.optional ? { optional: normalizeCapabilityRefs(input.optional) } : {}),
    ...(input.resources ? { resources: normalizeResourceGrants(input.resources) } : {}),
    ...(input.lifecycleScopes ? { lifecycleScopes: [...input.lifecycleScopes] } : {}),
    ...(input.configSchema !== undefined ? { configSchema: input.configSchema } : {}),
    ...(input.conformance ? { conformance: normalizeConformanceRefs(input.conformance) } : {}),
  }
}

export function createLegoBlockManifest(input: LegoBlockManifestInput): LegoBlockManifest {
  return normalizeLegoBlockManifest(input)
}

export function createPortContract<Input, Output>(input: PortContractInput<Input, Output>): PortContract<Input, Output> {
  return {
    id: input.id,
    input: input.input,
    output: input.output,
    cardinality: input.cardinality,
    lifecycle: [...input.lifecycle],
    resources: normalizeResourceGrants(input.resources),
    errors: [...input.errors],
    traces: [...input.traces],
    conformance: normalizeConformanceRefs(input.conformance),
  }
}

export function createBindingSpec(input: BindingSpecInput): BindingSpec {
  return {
    port: input.port,
    atom: input.atom,
    ...(input.personality ? { personality: input.personality } : {}),
    ...(input.scope ? { scope: input.scope } : {}),
    ...(input.resources ? { resources: normalizeResourceGrants(input.resources) } : {}),
    ...(input.capability ? { capability: normalizeCapabilityRef(input.capability) } : {}),
    ...(input.multiplicity ? { multiplicity: input.multiplicity } : {}),
  }
}

export function createAtomFactory<Config, Ports, Implementation>(
  factory: AtomFactoryInput<Config, Ports, Implementation>,
): AtomFactory<Config, Ports, Implementation> {
  return {
    manifest: normalizeLegoBlockManifest(factory.manifest),
    create: factory.create,
  }
}

export function portContractFromFixture(
  fixture: LegoPortContractFixture,
  options: { cardinality?: LegoCapabilityMultiplicity; errors?: string[]; traces?: string[] } = {},
): PortContract<string, string> {
  return createPortContract({
    id: fixture.id,
    input: fixture.input,
    output: fixture.output,
    cardinality: options.cardinality ?? "single",
    lifecycle: fixture.lifecycle,
    resources: fixture.resources,
    errors: options.errors ?? fixture.errors ?? defaultPortContractErrors(fixture.id),
    traces: options.traces ?? fixture.traces ?? defaultPortContractTraces(fixture.id),
    conformance: [fixture.conformance],
  })
}

export function normalizePortContractFixture(fixture: LegoPortContractFixture): NormalizedLegoPortContractFixture {
  const errors = fixture.errors ?? defaultPortContractErrors(fixture.id)
  const traces = fixture.traces ?? defaultPortContractTraces(fixture.id)
  const testAtoms = fixture.testAtoms ?? defaultPortContractTestAtoms(fixture.id)
  const commonBlocks = fixture.implementations.map((id) =>
    createInventoryBlockEntry(
      inventoryBlockEntryInput({
        id,
        port: fixture.id,
        source: "common",
        personality: "common",
        type: fixture.implementationTypes?.[id],
        ...(fixture.implementationKinds?.[id] ? { implementationKind: fixture.implementationKinds[id] } : {}),
      }),
    ),
  )
  const testBlocks = testAtoms.map((id) =>
    createInventoryBlockEntry({
      id,
      port: fixture.id,
      source: "test",
      personality: "common",
      type: "atom",
      implementationKind: "metadata-only",
    }),
  )
  const personalityBlocks = fixture.personalityAtoms.map((id) =>
    createInventoryBlockEntry(
      inventoryBlockEntryInput({
        id,
        port: fixture.id,
        source: "personality",
        personality: inferLegoBlockPersonality(id),
        type: fixture.personalityAtomTypes?.[id],
        ...(fixture.personalityAtomImplementationKinds?.[id] ? { implementationKind: fixture.personalityAtomImplementationKinds[id] } : {}),
      }),
    ),
  )

  return {
    ...fixture,
    errors,
    traces,
    testAtoms,
    portContract: portContractFromFixture(fixture),
    commonBlocks,
    testBlocks,
    personalityBlocks,
    blocks: [...commonBlocks, ...testBlocks, ...personalityBlocks],
  }
}

export function defaultPortContractErrors(portID: string): string[] {
  return [`${portID}.contract-error`]
}

export function defaultPortContractTraces(portID: string): string[] {
  return [`${portID}.trace`]
}

export function defaultPortContractTestAtoms(portID: string): string[] {
  return [`test.${portID}.mock`]
}

export function inferLegoInventoryBlockType(id: string): LegoBlockType {
  if (id.includes("product-shell") || id.startsWith("product.shell.")) return "product-shell"
  if (id.startsWith("pack.") || id.startsWith("tool-pack.") || id.startsWith("provider-pack.") || id.includes(".pack.")) return "pack"
  return "atom"
}

export function inferLegoBlockPersonality(id: string): LegoPersonality {
  if (id.startsWith("opencode.")) return "opencode"
  if (id.startsWith("pi.")) return "pi-mono"
  if (id.startsWith("nanobot.")) return "nanobot"
  if (id.startsWith("hermes.")) return "hermes-agent"
  return "common"
}

function createInventoryBlockEntry(input: {
  id: string
  port: string
  source: LegoInventoryBlockSource
  personality: LegoPersonality
  type?: LegoBlockType
  implementationKind?: LegoBlockImplementationKind
}): LegoBlockInventoryEntry {
  const type = input.type ?? inferLegoInventoryBlockType(input.id)
  return {
    id: input.id,
    type,
    personality: input.personality,
    source: input.source,
    port: input.port,
    implementationKind: input.implementationKind ?? inferLegoBlockImplementationKind(input.id, input),
  }
}

function inventoryBlockEntryInput(input: {
  id: string
  port: string
  source: LegoInventoryBlockSource
  personality: LegoPersonality
  type: LegoBlockType | undefined
  implementationKind?: LegoBlockImplementationKind
}): {
  id: string
  port: string
  source: LegoInventoryBlockSource
  personality: LegoPersonality
  type?: LegoBlockType
  implementationKind?: LegoBlockImplementationKind
} {
  return {
    id: input.id,
    port: input.port,
    source: input.source,
    personality: input.personality,
    ...(input.type ? { type: input.type } : {}),
    ...(input.implementationKind ? { implementationKind: input.implementationKind } : {}),
  }
}

export function inferLegoBlockImplementationKind(
  id: string,
  input: { source?: LegoInventoryBlockSource; type?: LegoBlockType; personality?: LegoPersonality } = {},
): LegoBlockImplementationKind {
  const normalized = id.toLowerCase()
  const type = input.type ?? inferLegoInventoryBlockType(id)
  const personality = input.personality ?? inferLegoBlockPersonality(id)
  if (input.source === "test" || normalized.startsWith("test.") || normalized.includes(".mock")) return "metadata-only"
  if (isMetadataOnlyBlockID(normalized)) return "metadata-only"
  if (type === "product-shell" || normalized.includes(".product-shell.") || normalized.startsWith("product.shell.")) {
    return isPreviewProductShellID(normalized) ? "preview" : "bridge"
  }
  if (personality !== "common" || normalized.startsWith("opencode.") || normalized.startsWith("pi.") || normalized.startsWith("nanobot.") || normalized.startsWith("hermes.")) {
    return "bridge"
  }
  return "factory"
}

function isPreviewProductShellID(id: string): boolean {
  return [
    ".product-shell.tui",
    ".product-shell.web",
    ".product-shell.web-ui",
    ".product-shell.web-dashboard",
    ".product-shell.desktop",
    ".product-shell.browser-smoke",
    ".product-shell.control-plane",
    ".product-shell.workspace",
    ".product-shell.package-manager",
    ".product-shell.extension-examples",
    ".product-shell.release-hardening",
  ].some((part) => id.includes(part))
}

function isMetadataOnlyBlockID(id: string): boolean {
  return [
    ".runtime.module-aliases",
    ".runtime.capability-aliases",
    ".runtime.binding-defaults",
    ".runtime.lifecycle-defaults",
    ".runtime.graph-labels",
    ".block.compatibility-metadata",
    ".capability.aliases",
    ".resource.grant-defaults",
    ".recipe.binding-aliases",
    ".conformance.product-gate",
    ".provider.cassette-artifact",
    "provider.cassette",
    "provider.transport.mock-sse",
    "process-runner.disabled",
    "ui.renderer.noop",
  ].some((part) => id.includes(part))
}

export function capabilityMatches(provided: LegoCapabilityInput, required: LegoCapabilityInput): boolean {
  const left = normalizeCapabilityRef(provided)
  const right = normalizeCapabilityRef(required)
  if (left.id !== right.id) return false
  if (right.version && left.version && right.version !== left.version) return false
  if (right.personality && left.personality && right.personality !== left.personality) return false
  return true
}
