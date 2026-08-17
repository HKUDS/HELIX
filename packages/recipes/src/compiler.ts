import type {
  LegoAssemblyBinding,
  LegoAssemblyLockfile,
  LegoBlockImplementationKind,
  LegoCapabilityInput,
  LegoCapabilityRef,
  LegoRecipe,
  LegoRecipePackRef,
  LegoRecipeModuleRef,
  LegoResourceRef,
} from "@helix/contracts"
import { capabilityMatches, inferLegoBlockImplementationKind, normalizeCapabilityRefs } from "@helix/contracts"
import { defaultAtomRecipeModuleCatalog } from "./atom-catalog"
import { expandRecipeBundles, type LegoBundleRecipeExpansion } from "./bundle-catalog"

export interface RecipeSchemaIssue {
  path: string
  message: string
}

export interface RecipeModuleCatalogEntry {
  id: string
  provides: LegoCapabilityInput[]
  requires?: LegoCapabilityInput[]
  resources?: LegoResourceRef[]
  personality?: "common" | "opencode" | "pi-mono" | string
  implementationKind?: LegoBlockImplementationKind
}

export interface RecipePackCatalogEntry {
  id: string
  atoms: LegoRecipeModuleRef[]
  requiredCapabilities?: LegoCapabilityInput[]
}

export interface CompiledRecipeModule {
  id: string
  version?: string
  variant?: string
  config?: Record<string, unknown>
  provides: string[]
  requires: string[]
  providedCapabilities: LegoCapabilityRef[]
  requiredCapabilities: LegoCapabilityRef[]
  resources: LegoResourceRef[]
  personality: string
  implementationKind: LegoBlockImplementationKind
}

export interface CompiledRecipe {
  id: string
  version: string
  expandedPacks: Array<{ id: string; version?: string; atoms: string[] }>
  expandedBundles: LegoBundleRecipeExpansion[]
  bundleOverrides: LegoBundleRecipeExpansion[]
  modules: CompiledRecipeModule[]
  graph: Array<{ id: string; provides: string[]; requires: string[] }>
  commonModules: CompiledRecipeModule[]
  personalityModules: CompiledRecipeModule[]
  entrypoints: Record<string, string>
  conformanceSuite: string[]
  bindings: LegoAssemblyBinding[]
  lockfile: LegoAssemblyLockfile
}

export interface RecipeModuleDiff {
  id: string
  leftVariant?: string
  rightVariant?: string
}

export interface RecipeDiff {
  left: string
  right: string
  commonModules: RecipeModuleDiff[]
  personalityModules: RecipeModuleDiff[]
  leftOnlyModules: RecipeModuleDiff[]
  rightOnlyModules: RecipeModuleDiff[]
  variantChanges: RecipeModuleDiff[]
  commonBindings: RecipeBindingDiff[]
  changedBindings: RecipeBindingDiff[]
  leftOnlyBindings: RecipeBindingDiff[]
  rightOnlyBindings: RecipeBindingDiff[]
  bindingDiffs: RecipeBindingDiff[]
  commonStrategies: RecipeSettingDiff[]
  changedStrategies: RecipeSettingDiff[]
  leftOnlyStrategies: RecipeSettingDiff[]
  rightOnlyStrategies: RecipeSettingDiff[]
  strategyDiffs: RecipeSettingDiff[]
  commonPolicies: RecipeSettingDiff[]
  changedPolicies: RecipeSettingDiff[]
  leftOnlyPolicies: RecipeSettingDiff[]
  rightOnlyPolicies: RecipeSettingDiff[]
  policyDiffs: RecipeSettingDiff[]
}

export type RecipeBindingDiffStatus = "same" | "changed" | "left-only" | "right-only"

export interface RecipeBindingDiff {
  port: string
  status: RecipeBindingDiffStatus
  leftProviders: string[]
  rightProviders: string[]
  leftConsumers: string[]
  rightConsumers: string[]
}

export interface RecipeSettingDiff {
  id: string
  status: RecipeBindingDiffStatus
  leftConfig?: Record<string, unknown>
  rightConfig?: Record<string, unknown>
}

export interface RecipeOverride {
  port: string
  module: string | LegoRecipeModuleRef
  capability?: string
  as?: string
  replace?: string[]
  keepExistingProviders?: boolean
}

export const recipeSchema = {
  $id: "https://helix.local/schema/recipe.json",
  type: "object",
  required: ["id", "version", "modules", "personalities"],
  properties: {
    id: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 },
    modules: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", minLength: 1 },
          version: { type: "string" },
          variant: { type: "string" },
          config: { type: "object" },
        },
      },
    },
    atoms: { type: "array" },
    packs: { type: "array" },
    bundles: { type: "array" },
    bindings: { type: "array" },
    requiredCapabilities: { type: "array" },
    scopes: { type: "array" },
    resources: { type: "array" },
    strategies: { type: "array" },
    policies: { type: "array" },
    productShells: { type: "array" },
    personalities: { type: "array", items: { type: "string" } },
    entrypoints: { type: "object" },
    conformance: { type: "object" },
    metadata: { type: "object" },
  },
} as const

export const defaultRecipePackCatalog: RecipePackCatalogEntry[] = [
  {
    id: "pack.session-memory",
    atoms: [
      { id: "session.id-generator.deterministic" },
      { id: "session.event-log.memory" },
      { id: "session.message-store.memory" },
      { id: "session.projector.common-transcript" },
      { id: "session.context-selector.memory" },
    ],
    requiredCapabilities: [
      "session.id-generator",
      "session.event-log",
      "session.message-store",
      "session.projector",
      "session.context-selector",
    ],
  },
]

export const legacyRecipeModuleCatalog: RecipeModuleCatalogEntry[] = [
  { id: "contracts", provides: ["contracts"] },
  { id: "lego-runtime", provides: ["runtime"], requires: ["contracts"] },
  { id: "lego-session", provides: ["session"], requires: ["contracts", "runtime"], resources: [{ id: "filesystem", mode: "write", scope: "workspace" }] },
  { id: "session-memory", provides: ["session"], requires: ["contracts", "runtime"] },
  { id: "session-id-generator-deterministic", provides: ["session.id-generator"], requires: ["contracts", "runtime"] },
  { id: "session-event-log-memory", provides: ["session.event-log"], requires: ["contracts", "runtime"] },
  {
    id: "session-message-store-memory",
    provides: ["session.message-store"],
    requires: ["session.id-generator", "session.event-log"],
  },
  { id: "session-projector-common", provides: ["session.projector"], requires: ["contracts"] },
  { id: "session-context-selector-memory", provides: ["session.context-selector"], requires: ["session.message-store"] },
  {
    id: "minimal-cli",
    provides: ["minimal-cli"],
    requires: ["session.message-store", "session.context-selector", "session.projector"],
  },
  { id: "lego-hooks", provides: ["hooks", "registries"], requires: ["contracts", "runtime"] },
  { id: "lego-config", provides: ["config"], requires: ["contracts"] },
  { id: "config-env-source", provides: ["config.source.env"], requires: ["contracts"], resources: [{ id: "env", mode: "read", scope: "process" }] },
  { id: "lego-prompt", provides: ["prompt"], requires: ["contracts"] },
  { id: "lego-provider", provides: ["provider"], requires: ["contracts"], resources: [{ id: "network", mode: "execute", scope: "external" }] },
  { id: "provider-fake", provides: ["provider"], requires: ["contracts"] },
  {
    id: "provider-recorded-cassette",
    provides: ["provider"],
    requires: ["contracts"],
    resources: [{ id: "filesystem", mode: "read", scope: "workspace" }],
  },
  {
    id: "lego-tools",
    provides: ["tools"],
    requires: ["contracts"],
    resources: [
      { id: "filesystem", mode: "write", scope: "workspace" },
      { id: "shell", mode: "execute", scope: "process" },
    ],
  },
  { id: "tool-pack-echo", provides: ["tools"], requires: ["contracts"] },
  { id: "tool-permission-always-allow", provides: ["tool.permission"], requires: ["contracts"] },
  { id: "tool-permission-always-deny", provides: ["tool.permission"], requires: ["contracts"] },
  { id: "lego-ui", provides: ["ui"], requires: ["contracts"] },
  { id: "ui-noop", provides: ["ui"], requires: ["contracts"] },
  {
    id: "session-store-sqlite",
    provides: ["session.store.sqlite"],
    requires: ["contracts", "runtime"],
    resources: [{ id: "sqlite", mode: "write", scope: "workspace" }],
  },
  {
    id: "extension-runtime-local",
    provides: ["extension.runtime"],
    requires: ["hooks"],
    resources: [{ id: "extension-runtime", mode: "execute", scope: "workspace" }],
  },
  {
    id: "lego-agent-loop",
    provides: ["agent-loop"],
    requires: ["contracts", "session", "hooks", "provider", "tools", "prompt", "ui"],
  },
  {
    id: "opencode-sdk",
    provides: ["opencode-sdk"],
    requires: ["agent-loop", "session", "hooks", "config", "prompt", "ui"],
    personality: "opencode",
  },
  {
    id: "opencode-workspace",
    provides: ["opencode-workspace"],
    requires: ["session", "hooks", "config"],
    personality: "opencode",
  },
  {
    id: "opencode-server",
    provides: ["opencode-server"],
    requires: ["opencode-sdk", "opencode-workspace", "opencode-tui", "opencode-web", "opencode-desktop", "opencode-slack"],
    personality: "opencode",
  },
  {
    id: "opencode-control-plane",
    provides: ["opencode-control-plane"],
    requires: ["opencode-sdk", "opencode-server", "opencode-workspace"],
    personality: "opencode",
  },
  {
    id: "opencode-tui",
    provides: ["opencode-tui"],
    requires: ["opencode-sdk"],
    personality: "opencode",
  },
  {
    id: "opencode-web",
    provides: ["opencode-web"],
    requires: ["opencode-sdk", "opencode-tui"],
    personality: "opencode",
  },
  {
    id: "opencode-desktop",
    provides: ["opencode-desktop"],
    requires: ["opencode-web"],
    personality: "opencode",
  },
  {
    id: "opencode-slack",
    provides: ["opencode-slack"],
    requires: ["opencode-sdk"],
    personality: "opencode",
  },
  {
    id: "pi-package-manager",
    provides: ["pi-package-manager"],
    requires: ["hooks", "config"],
    personality: "pi-mono",
  },
  {
    id: "pi-sdk",
    provides: ["pi-sdk"],
    requires: ["agent-loop", "session", "hooks", "config", "prompt", "ui", "pi-package-manager"],
    personality: "pi-mono",
  },
  {
    id: "pi-cli",
    provides: ["pi-cli"],
    requires: ["pi-sdk"],
    personality: "pi-mono",
  },
  {
    id: "pi-tui",
    provides: ["pi-tui"],
    requires: ["pi-sdk"],
    personality: "pi-mono",
  },
  {
    id: "pi-rpc",
    provides: ["pi-rpc"],
    requires: ["pi-sdk"],
    personality: "pi-mono",
  },
  {
    id: "pi-web-ui",
    provides: ["pi-web-ui"],
    requires: ["pi-sdk", "pi-tui", "pi-rpc"],
    personality: "pi-mono",
  },
  {
    id: "pi-server",
    provides: ["pi-server"],
    requires: ["pi-sdk", "pi-rpc", "pi-tui", "pi-web-ui"],
    personality: "pi-mono",
  },
  {
    id: "pi-extension-examples",
    provides: ["pi-extension-examples"],
    requires: ["pi-package-manager", "hooks"],
    personality: "pi-mono",
  },
  {
    id: "pi-browser-smoke",
    provides: ["pi-browser-smoke"],
    requires: ["session", "hooks", "ui", "pi-package-manager"],
    personality: "pi-mono",
  },
  {
    id: "pi-release-hardening",
    provides: ["pi-release-hardening"],
    requires: ["pi-package-manager", "pi-browser-smoke"],
    personality: "pi-mono",
  },
]

export const defaultRecipeModuleCatalog: RecipeModuleCatalogEntry[] = [...legacyRecipeModuleCatalog, ...defaultAtomRecipeModuleCatalog()]

export function validateRecipe(value: unknown): RecipeSchemaIssue[] {
  const issues: RecipeSchemaIssue[] = []
  if (!isRecord(value)) return [{ path: "$", message: "Recipe must be an object." }]

  if (!isNonEmptyString(value["id"])) issues.push({ path: "$.id", message: "Recipe id must be a non-empty string." })
  if (!isNonEmptyString(value["version"])) {
    issues.push({ path: "$.version", message: "Recipe version must be a non-empty string." })
  }
  const hasModules = Array.isArray(value["modules"]) && value["modules"].length > 0
  const hasAtoms = Array.isArray(value["atoms"]) && value["atoms"].length > 0
  const hasPacks = Array.isArray(value["packs"]) && value["packs"].length > 0
  const hasProductShells = Array.isArray(value["productShells"]) && value["productShells"].length > 0
  if (!hasModules && !hasAtoms && !hasPacks && !hasProductShells) {
    issues.push({ path: "$.modules", message: "Recipe must declare at least one module, atom, pack, or product shell." })
  }
  if ("modules" in value) validateRecipeModuleRefs(value["modules"], "$.modules", "module", issues)
  if ("atoms" in value) validateRecipeModuleRefs(value["atoms"], "$.atoms", "atom", issues)
  if ("productShells" in value) validateRecipeModuleRefs(value["productShells"], "$.productShells", "product shell", issues)
  if ("packs" in value) validateRecipePackRefs(value["packs"], "$.packs", issues)
  if ("bundles" in value) validateRecipeBundleRefs(value["bundles"], "$.bundles", issues)
  if (!Array.isArray(value["personalities"])) {
    issues.push({ path: "$.personalities", message: "Recipe personalities must be an array." })
  } else {
    value["personalities"].forEach((personality, index) => {
      if (!isNonEmptyString(personality)) {
        issues.push({ path: `$.personalities[${index}]`, message: "Recipe personality must be a non-empty string." })
      }
    })
  }
  if ("entrypoints" in value && !isRecord(value["entrypoints"])) {
    issues.push({ path: "$.entrypoints", message: "Recipe entrypoints must be an object." })
  }
  if ("bindings" in value && !Array.isArray(value["bindings"])) {
    issues.push({ path: "$.bindings", message: "Recipe bindings must be an array." })
  }
  if ("requiredCapabilities" in value && !Array.isArray(value["requiredCapabilities"])) {
    issues.push({ path: "$.requiredCapabilities", message: "Recipe requiredCapabilities must be an array." })
  }
  if ("scopes" in value && !Array.isArray(value["scopes"])) {
    issues.push({ path: "$.scopes", message: "Recipe scopes must be an array." })
  }
  if ("resources" in value && !Array.isArray(value["resources"])) {
    issues.push({ path: "$.resources", message: "Recipe resources must be an array." })
  }
  if ("strategies" in value && !Array.isArray(value["strategies"])) {
    issues.push({ path: "$.strategies", message: "Recipe strategies must be an array." })
  }
  if ("policies" in value && !Array.isArray(value["policies"])) {
    issues.push({ path: "$.policies", message: "Recipe policies must be an array." })
  }
  if ("conformance" in value && !isRecord(value["conformance"])) {
    issues.push({ path: "$.conformance", message: "Recipe conformance must be an object." })
  }
  if ("metadata" in value && !isRecord(value["metadata"])) {
    issues.push({ path: "$.metadata", message: "Recipe metadata must be an object." })
  }
  return issues
}

export function parseRecipe(value: unknown): LegoRecipe {
  const issues = validateRecipe(value)
  if (issues.length > 0) throw new Error(formatRecipeIssues(issues))
  return value as LegoRecipe
}

export function applyRecipeOverrides(
  recipe: LegoRecipe,
  overrides: RecipeOverride[],
  catalog: RecipeModuleCatalogEntry[] = defaultRecipeModuleCatalog,
): LegoRecipe {
  const catalogByID = new Map(catalog.map((entry) => [entry.id, entry]))
  let modules = [...(recipe.modules ?? [])]
  let atoms = recipe.atoms ? [...recipe.atoms] : undefined
  let productShells = recipe.productShells ? [...recipe.productShells] : undefined
  let bindings = [...(recipe.bindings ?? [])]
  let requiredCapabilities = [...normalizeCapabilityRefs(recipe.requiredCapabilities)]

  for (const override of overrides) {
    const moduleRef = typeof override.module === "string" ? { id: override.module } : override.module
    const capabilityID = override.capability ?? override.port
    const replaceIDs = new Set(override.replace ?? [])

    if (!override.keepExistingProviders) {
      for (const existing of [...modules, ...(atoms ?? []), ...(productShells ?? [])]) {
        if (existing.id !== moduleRef.id && moduleProvidesCapability(existing.id, capabilityID, catalogByID)) replaceIDs.add(existing.id)
      }
    }

    const targetIsAtom = atoms?.some((module) => module.id === moduleRef.id) ?? false
    const targetIsProductShell = productShells?.some((module) => module.id === moduleRef.id) ?? false
    modules = modules.filter((module) => !replaceIDs.has(module.id) && module.id !== moduleRef.id)
    atoms = atoms ? atoms.filter((module) => !replaceIDs.has(module.id) && (!targetIsAtom || module.id !== moduleRef.id)) : undefined
    productShells = productShells
      ? productShells.filter((module) => !replaceIDs.has(module.id) && (!targetIsProductShell || module.id !== moduleRef.id))
      : undefined
    if (targetIsAtom) atoms = upsertModuleRef(atoms ?? [], moduleRef)
    else if (targetIsProductShell) productShells = upsertModuleRef(productShells ?? [], moduleRef)
    else modules = upsertModuleRef(modules, moduleRef)
    bindings = [
      ...bindings.filter((binding) => binding.port !== override.port && binding.capability !== capabilityID),
      {
        port: override.port,
        module: moduleRef.id,
        ...(override.capability ? { capability: override.capability } : {}),
        ...(override.as ? { as: override.as } : {}),
      },
    ]
    if (!requiredCapabilities.some((capability) => capability.id === capabilityID)) {
      requiredCapabilities = [...requiredCapabilities, normalizeCapabilityRefs([capabilityID])[0]!]
    }
  }

  return {
    ...recipe,
    modules,
    ...(atoms ? { atoms } : {}),
    ...(productShells ? { productShells } : {}),
    bindings,
    requiredCapabilities,
  }
}

export function compileRecipe(
  recipe: LegoRecipe,
  catalog: RecipeModuleCatalogEntry[] = defaultRecipeModuleCatalog,
  packCatalog: RecipePackCatalogEntry[] = defaultRecipePackCatalog,
): CompiledRecipe {
  const issues = validateRecipe(recipe)
  if (issues.length > 0) throw new Error(formatRecipeIssues(issues))

  const catalogByID = new Map(catalog.map((entry) => [entry.id, entry]))
  const expansion = expandRecipeModules(recipe, packCatalog)
  const duplicateIDs = duplicateModuleIDs(expansion.modules)
  if (duplicateIDs.length > 0) throw new Error(`Recipe ${recipe.id} declares duplicate expanded modules:\n${duplicateIDs.join("\n")}`)
  const modules = expansion.modules.map((module) => compileModule(recipe, module, catalogByID))
  const validationIssues = validateCompiledModules(recipe, modules)
  if (validationIssues.length > 0) throw new Error(`Recipe ${recipe.id} has invalid module declarations:\n${validationIssues.join("\n")}`)
  const provided = new Set(modules.flatMap((module) => module.provides))
  const missing = modules.flatMap((module) =>
    module.requires
      .filter((requirement) => !provided.has(requirement))
      .map((requirement) => `${module.id} requires missing capability ${requirement}`),
  )
  const requiredCapabilities = uniqueCapabilityRefs([
    ...normalizeCapabilityRefs(recipe.requiredCapabilities),
    ...normalizeCapabilityRefs(expansion.requiredCapabilities),
  ])
  for (const required of requiredCapabilities) {
    if (!provided.has(required.id)) missing.push(`recipe requires missing capability ${required.id}`)
  }
  if (missing.length > 0) throw new Error(`Recipe ${recipe.id} has unresolved module requirements:\n${missing.join("\n")}`)

  const graph = sortModules(modules).map((module) => ({
    id: module.id,
    provides: module.provides,
    requires: module.requires,
  }))
  const bindings = compileBindings(recipe, modules, requiredCapabilities)
  return {
    id: recipe.id,
    version: recipe.version,
    expandedPacks: expansion.packs,
    expandedBundles: expansion.bundles,
    bundleOverrides: expansion.bundleOverrides,
    modules,
    graph,
    commonModules: modules.filter((module) => module.personality === "common"),
    personalityModules: modules.filter((module) => module.personality !== "common"),
    entrypoints: recipe.entrypoints ?? {},
    conformanceSuite: recipe.conformance?.suite ?? [],
    bindings,
    lockfile: {
      schemaVersion: 1,
      recipeID: recipe.id,
      recipeVersion: recipe.version,
      ...(expansion.packs.length > 0 ? { packs: expansion.packs } : {}),
      modules: graph.map((module) => {
        const compiled = modules.find((item) => item.id === module.id)
        if (!compiled) throw new Error(`Internal compiler error: missing module ${module.id}`)
        return {
          id: compiled.id,
          version: compiled.version ?? "*",
          kind: moduleKindFor(compiled),
          personality: compiled.personality,
          provides: compiled.providedCapabilities,
          requires: compiled.requiredCapabilities,
          ...(compiled.resources.length > 0 ? { resources: compiled.resources } : {}),
        }
      }),
      bindings,
    },
  }
}

export function diffRecipes(left: LegoRecipe, right: LegoRecipe): RecipeDiff {
  const leftModules = new Map(expandRecipeModules(left, defaultRecipePackCatalog).modules.map((module) => [module.id, module]))
  const rightModules = new Map(expandRecipeModules(right, defaultRecipePackCatalog).modules.map((module) => [module.id, module]))
  const commonModules: RecipeModuleDiff[] = []
  const personalityModules: RecipeModuleDiff[] = []
  const leftOnlyModules: RecipeModuleDiff[] = []
  const rightOnlyModules: RecipeModuleDiff[] = []
  const variantChanges: RecipeModuleDiff[] = []
  const bindingDiffs = diffRecipeBindings(compileRecipe(left), compileRecipe(right))
  const strategyDiffs = diffRecipeSettings(left.strategies, right.strategies)
  const policyDiffs = diffRecipeSettings(left.policies, right.policies)

  for (const module of leftModules.values()) {
    const other = rightModules.get(module.id)
    if (!other) {
      const diff = moduleDiff(module)
      leftOnlyModules.push(diff)
      personalityModules.push(diff)
      continue
    }
    const diff = moduleDiff(module, other)
    if (module.variant === other.variant) {
      commonModules.push(diff)
    } else {
      variantChanges.push(diff)
      personalityModules.push(diff)
    }
  }

  for (const module of rightModules.values()) {
    if (leftModules.has(module.id)) continue
    const diff = moduleDiff(undefined, module)
    rightOnlyModules.push(diff)
    personalityModules.push(diff)
  }

  return {
    left: left.id,
    right: right.id,
    commonModules,
    personalityModules,
    leftOnlyModules,
    rightOnlyModules,
    variantChanges,
    commonBindings: bindingDiffs.filter((binding) => binding.status === "same"),
    changedBindings: bindingDiffs.filter((binding) => binding.status === "changed"),
    leftOnlyBindings: bindingDiffs.filter((binding) => binding.status === "left-only"),
    rightOnlyBindings: bindingDiffs.filter((binding) => binding.status === "right-only"),
    bindingDiffs,
    commonStrategies: strategyDiffs.filter((strategy) => strategy.status === "same"),
    changedStrategies: strategyDiffs.filter((strategy) => strategy.status === "changed"),
    leftOnlyStrategies: strategyDiffs.filter((strategy) => strategy.status === "left-only"),
    rightOnlyStrategies: strategyDiffs.filter((strategy) => strategy.status === "right-only"),
    strategyDiffs,
    commonPolicies: policyDiffs.filter((policy) => policy.status === "same"),
    changedPolicies: policyDiffs.filter((policy) => policy.status === "changed"),
    leftOnlyPolicies: policyDiffs.filter((policy) => policy.status === "left-only"),
    rightOnlyPolicies: policyDiffs.filter((policy) => policy.status === "right-only"),
    policyDiffs,
  }
}

function expandRecipeModules(
  recipe: LegoRecipe,
  packCatalog: RecipePackCatalogEntry[],
): {
  modules: LegoRecipeModuleRef[]
  packs: Array<{ id: string; version?: string; atoms: string[] }>
  bundles: LegoBundleRecipeExpansion[]
  bundleOverrides: LegoBundleRecipeExpansion[]
  requiredCapabilities: LegoCapabilityInput[]
} {
  const packByID = new Map(packCatalog.map((entry) => [entry.id, entry]))
  const modules: LegoRecipeModuleRef[] = [...(recipe.modules ?? []), ...(recipe.atoms ?? []), ...(recipe.productShells ?? [])]
  const packs: Array<{ id: string; version?: string; atoms: string[] }> = []
  const requiredCapabilities: LegoCapabilityInput[] = []
  const bundleExpansion = expandRecipeBundles(recipe.bundles)

  for (const packRef of recipe.packs ?? []) {
    const catalogEntry = packByID.get(packRef.id)
    if (!catalogEntry && !packRef.atoms) throw new Error(`Recipe ${recipe.id} references unknown pack ${packRef.id}`)
    const atoms = packRef.atoms ? packRef.atoms.map((id) => ({ id })) : (catalogEntry?.atoms ?? [])
    modules.push(...atoms)
    requiredCapabilities.push(...(catalogEntry?.requiredCapabilities ?? []))
    packs.push({
      id: packRef.id,
      ...(packRef.version ? { version: packRef.version } : {}),
      atoms: atoms.map((atom) => atom.id),
    })
  }

  for (const moduleRef of bundleExpansion.moduleRefs) {
    if (!modules.some((module) => module.id === moduleRef.id)) modules.push(moduleRef)
  }
  return { modules, packs, bundles: bundleExpansion.expandedBundles, bundleOverrides: bundleExpansion.bundleOverrides, requiredCapabilities }
}

function duplicateModuleIDs(modules: LegoRecipeModuleRef[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const module of modules) {
    if (seen.has(module.id)) duplicates.add(module.id)
    seen.add(module.id)
  }
  return [...duplicates].sort()
}

function diffRecipeBindings(left: CompiledRecipe, right: CompiledRecipe): RecipeBindingDiff[] {
  const leftBindings = bindingIndex(left)
  const rightBindings = bindingIndex(right)
  const ports = [...new Set([...leftBindings.keys(), ...rightBindings.keys()])].sort()
  return ports.map((port) => {
    const leftBinding = leftBindings.get(port)
    const rightBinding = rightBindings.get(port)
    const leftProviders = [...(leftBinding?.providers ?? [])].sort()
    const rightProviders = [...(rightBinding?.providers ?? [])].sort()
    const status: RecipeBindingDiffStatus = !leftBinding
      ? "right-only"
      : !rightBinding
        ? "left-only"
        : stringArraysEqual(leftProviders, rightProviders)
          ? "same"
          : "changed"
    return {
      port,
      status,
      leftProviders,
      rightProviders,
      leftConsumers: [...(leftBinding?.consumers ?? [])].sort(),
      rightConsumers: [...(rightBinding?.consumers ?? [])].sort(),
    }
  })
}

function diffRecipeSettings(
  left: Array<{ id: string; config?: Record<string, unknown> }> | undefined,
  right: Array<{ id: string; config?: Record<string, unknown> }> | undefined,
): RecipeSettingDiff[] {
  const leftSettings = new Map((left ?? []).map((setting) => [setting.id, setting]))
  const rightSettings = new Map((right ?? []).map((setting) => [setting.id, setting]))
  const ids = [...new Set([...leftSettings.keys(), ...rightSettings.keys()])].sort()
  return ids.map((id) => {
    const leftSetting = leftSettings.get(id)
    const rightSetting = rightSettings.get(id)
    const status: RecipeBindingDiffStatus = !leftSetting
      ? "right-only"
      : !rightSetting
        ? "left-only"
        : stableConfig(leftSetting.config) === stableConfig(rightSetting.config)
          ? "same"
          : "changed"
    return {
      id,
      status,
      ...(leftSetting?.config ? { leftConfig: leftSetting.config } : {}),
      ...(rightSetting?.config ? { rightConfig: rightSetting.config } : {}),
    }
  })
}

function bindingIndex(recipe: CompiledRecipe): Map<string, { providers: Set<string>; consumers: Set<string> }> {
  const modulesByID = new Map(recipe.modules.map((module) => [module.id, module]))
  const bindings = new Map<string, { providers: Set<string>; consumers: Set<string> }>()
  for (const binding of recipe.bindings) {
    const current = bindings.get(binding.capability.id) ?? { providers: new Set<string>(), consumers: new Set<string>() }
    current.providers.add(providerSignature(binding.provider, modulesByID.get(binding.provider)))
    current.consumers.add(binding.consumer)
    bindings.set(binding.capability.id, current)
  }
  return bindings
}

function providerSignature(id: string, module?: CompiledRecipeModule): string {
  if (!module) return id
  return module.variant ? `${module.id}:${module.variant}` : module.id
}

function stringArraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function stableConfig(value: Record<string, unknown> | undefined): string {
  if (!value) return "{}"
  return JSON.stringify(sortRecord(value))
}

function sortRecord(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortRecord)
  if (!isRecord(value)) return value
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, sortRecord(entry)]))
}

function uniqueCapabilityRefs(capabilities: LegoCapabilityRef[]): LegoCapabilityRef[] {
  const seen = new Set<string>()
  const output: LegoCapabilityRef[] = []
  for (const capability of capabilities) {
    const key = `${capability.id}:${capability.version ?? ""}:${capability.personality ?? ""}:${capability.variant ?? ""}`
    if (seen.has(key)) continue
    seen.add(key)
    output.push(capability)
  }
  return output
}

function compileModule(
  recipe: LegoRecipe,
  module: LegoRecipeModuleRef,
  catalogByID: Map<string, RecipeModuleCatalogEntry>,
): CompiledRecipeModule {
  const catalogEntry = catalogByID.get(module.id)
  if (!catalogEntry) throw new Error(`Recipe ${recipe.id} references unknown module ${module.id}`)
  return {
    id: module.id,
    ...(module.version ? { version: module.version } : {}),
    ...(module.variant ? { variant: module.variant } : {}),
    ...(module.config ? { config: module.config } : {}),
    provides: normalizeCapabilityRefs(catalogEntry.provides).map((capability) => capability.id),
    requires: normalizeCapabilityRefs(catalogEntry.requires).map((capability) => capability.id),
    providedCapabilities: normalizeCapabilityRefs(catalogEntry.provides),
    requiredCapabilities: normalizeCapabilityRefs(catalogEntry.requires),
    resources: catalogEntry.resources ?? [],
    personality: catalogEntry.personality ?? inferModulePersonality(recipe, module),
    implementationKind: catalogEntry.implementationKind ?? inferLegoBlockImplementationKind(module.id, { personality: catalogEntry.personality ?? inferModulePersonality(recipe, module) }),
  }
}

function inferModulePersonality(recipe: LegoRecipe, module: LegoRecipeModuleRef): string {
  const variant = module.variant ?? ""
  if (variant.includes("opencode")) return "opencode"
  if (variant.includes("pi")) return "pi-mono"
  if (recipe.personalities.some((personality) => personality.startsWith(`${module.id}-`))) return recipe.id
  return "common"
}

function sortModules(modules: CompiledRecipeModule[]): CompiledRecipeModule[] {
  const byCapability = new Map<string, CompiledRecipeModule>()
  for (const module of modules) {
    for (const capability of module.provides) byCapability.set(capability, module)
  }

  const temporary = new Set<string>()
  const permanent = new Set<string>()
  const output: CompiledRecipeModule[] = []

  function visit(module: CompiledRecipeModule): void {
    if (permanent.has(module.id)) return
    if (temporary.has(module.id)) throw new Error(`Cycle detected while compiling recipe module ${module.id}`)
    temporary.add(module.id)
    for (const requirement of module.requires) {
      const provider = byCapability.get(requirement)
      if (provider) visit(provider)
    }
    temporary.delete(module.id)
    permanent.add(module.id)
    output.push(module)
  }

  for (const module of modules) visit(module)
  return output
}

function compileBindings(recipe: LegoRecipe, modules: CompiledRecipeModule[], requiredCapabilities: LegoCapabilityRef[]): LegoAssemblyBinding[] {
  const bindings: LegoAssemblyBinding[] = []
  for (const module of modules) {
    for (const requirement of module.requiredCapabilities) {
      const provider = providerForRequirement(recipe, modules, module, requirement)
      bindings.push({
        capability: requirement,
        consumer: module.id,
        provider: provider.id,
        explicit: Boolean(explicitBinding(recipe, requirement)),
        candidates: candidatesForRequirement(modules, module, requirement).map((candidate) => candidate.id),
      })
    }
  }
  for (const required of requiredCapabilities) {
    const provider = providerForRequirement(recipe, modules, undefined, required)
    bindings.push({
      capability: required,
      consumer: "recipe",
      provider: provider.id,
      explicit: Boolean(explicitBinding(recipe, required)),
      candidates: candidatesForRequirement(modules, undefined, required).map((candidate) => candidate.id),
    })
  }
  return bindings
}

function validateCompiledModules(recipe: LegoRecipe, modules: CompiledRecipeModule[]): string[] {
  const issues: string[] = []
  for (const module of modules) {
    if (module.personality === "common") {
      const personalityCapabilities = [...module.providedCapabilities, ...module.requiredCapabilities].filter(
        (capability) => capability.personality && capability.personality !== "common",
      )
      for (const capability of personalityCapabilities) {
        issues.push(`Common module ${module.id} leaks personality capability ${capability.id}:${capability.personality}`)
      }
    }
    if (recipe.id === "opencode" && module.personality !== "common" && module.personality !== "opencode") {
      issues.push(`OpenCode recipe cannot include ${personalityLabel(module.personality)} personality module ${module.id}`)
    }
    if (recipe.id === "pi-mono" && module.personality !== "common" && module.personality !== "pi-mono") {
      issues.push(`Pi recipe cannot include ${personalityLabel(module.personality)} personality module ${module.id}`)
    }
    if (recipe.id === "nanobot" && module.personality !== "common" && module.personality !== "nanobot") {
      issues.push(`Nanobot recipe cannot include ${personalityLabel(module.personality)} personality module ${module.id}`)
    }
    if (recipe.id === "hermes-agent" && module.personality !== "common" && module.personality !== "hermes-agent") {
      issues.push(`Hermes Agent recipe cannot include ${personalityLabel(module.personality)} personality module ${module.id}`)
    }

    for (const resource of requiredResourcesFor(module.providedCapabilities)) {
      if (!module.resources.some((declared) => declared.id === resource)) {
        issues.push(`Module ${module.id} provides a side-effect capability that requires undeclared resource ${resource}`)
      }
    }
  }
  return issues
}

function personalityLabel(personality: string): string {
  if (personality === "pi-mono") return "Pi"
  if (personality === "opencode") return "OpenCode"
  if (personality === "nanobot") return "Nanobot"
  if (personality === "hermes-agent") return "Hermes Agent"
  return personality
}

function requiredResourcesFor(capabilities: LegoCapabilityRef[]): string[] {
  const resources = new Set<string>()
  for (const capability of capabilities) {
    if (capability.id === "config.source.env" || capability.id.startsWith("env.")) resources.add("env")
    if (capability.id === "filesystem.port" || capability.id.startsWith("filesystem.")) resources.add("filesystem")
    if (capability.id === "process-runner.port" || capability.id.startsWith("process-runner.")) resources.add("shell")
    if (capability.id === "provider.transport" || capability.id.startsWith("provider.transport.")) resources.add("network")
    if (capability.id === "session.store.sqlite" || capability.id.startsWith("session.store.sqlite.")) resources.add("sqlite")
    if (capability.id === "extension.runtime" || capability.id.startsWith("extension.runtime.")) resources.add("extension-runtime")
  }
  return [...resources]
}

function moduleProvidesCapability(id: string, capabilityID: string, catalogByID: Map<string, RecipeModuleCatalogEntry>): boolean {
  const catalogEntry = catalogByID.get(id)
  return Boolean(catalogEntry?.provides.some((capability) => normalizeCapabilityRefs([capability])[0]?.id === capabilityID))
}

function upsertModuleRef(modules: LegoRecipeModuleRef[], moduleRef: LegoRecipeModuleRef): LegoRecipeModuleRef[] {
  const index = modules.findIndex((module) => module.id === moduleRef.id)
  if (index < 0) return [...modules, moduleRef]
  return modules.map((module, current) => (current === index ? { ...module, ...moduleRef } : module))
}

function providerForRequirement(
  recipe: LegoRecipe,
  modules: CompiledRecipeModule[],
  consumer: CompiledRecipeModule | undefined,
  requirement: LegoCapabilityRef,
): CompiledRecipeModule {
  const binding = explicitBinding(recipe, requirement)
  const candidates = candidatesForRequirement(modules, consumer, requirement)
  if (binding) {
    const provider = candidates.find((candidate) => candidate.id === binding.module)
    if (!provider) throw new Error(`Recipe ${recipe.id} binding ${binding.port} points to ${binding.module}, but that module does not provide ${requirement.id}`)
    return provider
  }
  if (candidates.length === 0) throw new Error(`Recipe ${recipe.id} requires missing capability ${requirement.id}`)
  if (candidates.length > 1 && requirement.multiplicity !== "multi") {
    throw new Error(`Recipe ${recipe.id} has ambiguous capability ${requirement.id}: ${candidates.map((candidate) => candidate.id).join(", ")}`)
  }
  const provider = candidates[0]
  if (!provider) throw new Error(`Recipe ${recipe.id} requires missing capability ${requirement.id}`)
  return provider
}

function candidatesForRequirement(
  modules: CompiledRecipeModule[],
  consumer: CompiledRecipeModule | undefined,
  requirement: LegoCapabilityRef,
): CompiledRecipeModule[] {
  return modules.filter(
    (module) => module !== consumer && module.providedCapabilities.some((provided) => capabilityMatches(provided, requirement)),
  )
}

function explicitBinding(recipe: LegoRecipe, requirement: LegoCapabilityRef): { port: string; module: string; capability?: string; as?: string } | undefined {
  return (recipe.bindings ?? []).find((binding) => binding.port === requirement.id || binding.capability === requirement.id)
}

function moduleKindFor(module: CompiledRecipeModule): LegoAssemblyLockfile["modules"][number]["kind"] {
  if (module.id.includes("product-shell")) return "product-shell"
  if (module.id.includes("provider")) return "provider"
  if (module.id.includes("tool")) return "tool"
  if (module.id.includes("session")) return "storage"
  if (module.id.includes("hook")) return "hook"
  if (module.id.includes("prompt")) return "prompt"
  if (module.id.includes("config")) return "core"
  if (module.id.includes("ui") || module.id.includes("tui") || module.id.includes("web") || module.id.includes("desktop")) return "ui"
  if (module.personality !== "common") return "product-shell"
  return "core"
}

function moduleDiff(left?: LegoRecipeModuleRef, right?: LegoRecipeModuleRef): RecipeModuleDiff {
  return {
    id: left?.id ?? right?.id ?? "",
    ...(left?.variant ? { leftVariant: left.variant } : {}),
    ...(right?.variant ? { rightVariant: right.variant } : {}),
  }
}

function formatRecipeIssues(issues: RecipeSchemaIssue[]): string {
  return issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")
}

function validateRecipeModuleRefs(value: unknown, path: string, label: string, issues: RecipeSchemaIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: `Recipe ${label}s must be an array.` })
    return
  }
  const seen = new Set<string>()
  value.forEach((module, index) => {
    const itemPath = `${path}[${index}]`
    if (!isRecord(module)) {
      issues.push({ path: itemPath, message: `Recipe ${label} must be an object.` })
      return
    }
    if (!isNonEmptyString(module["id"])) {
      issues.push({ path: `${itemPath}.id`, message: `Recipe ${label} id must be a non-empty string.` })
      return
    }
    if (seen.has(module["id"])) issues.push({ path: `${itemPath}.id`, message: `Duplicate recipe ${label} ${module["id"]}.` })
    seen.add(module["id"])
    if ("config" in module && !isRecord(module["config"])) {
      issues.push({ path: `${itemPath}.config`, message: `Recipe ${label} config must be an object.` })
    }
  })
}

function validateRecipePackRefs(value: unknown, path: string, issues: RecipeSchemaIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "Recipe packs must be an array." })
    return
  }
  const seen = new Set<string>()
  value.forEach((pack, index) => {
    const itemPath = `${path}[${index}]`
    if (!isRecord(pack)) {
      issues.push({ path: itemPath, message: "Recipe pack must be an object." })
      return
    }
    if (!isNonEmptyString(pack["id"])) {
      issues.push({ path: `${itemPath}.id`, message: "Recipe pack id must be a non-empty string." })
      return
    }
    if (seen.has(pack["id"])) issues.push({ path: `${itemPath}.id`, message: `Duplicate recipe pack ${pack["id"]}.` })
    seen.add(pack["id"])
    if ("atoms" in pack && (!Array.isArray(pack["atoms"]) || !pack["atoms"].every(isNonEmptyString))) {
      issues.push({ path: `${itemPath}.atoms`, message: "Recipe pack atoms must be an array of module ids." })
    }
  })
}

function validateRecipeBundleRefs(value: unknown, path: string, issues: RecipeSchemaIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "Recipe bundles must be an array." })
    return
  }
  const seen = new Set<string>()
  value.forEach((bundle: unknown, index: number) => {
    const itemPath = `${path}[${index}]`
    if (!isRecord(bundle)) {
      issues.push({ path: itemPath, message: "Recipe bundle must be an object." })
      return
    }
    if (!isNonEmptyString(bundle["id"])) {
      issues.push({ path: `${itemPath}.id`, message: "Recipe bundle id must be a non-empty string." })
      return
    }
    const bundleID = bundle["id"]
    if (seen.has(bundleID)) issues.push({ path: `${itemPath}.id`, message: `Duplicate recipe bundle ${bundleID}.` })
    seen.add(bundleID)
    if ("removedAtoms" in bundle && (!Array.isArray(bundle["removedAtoms"]) || !bundle["removedAtoms"].every(isNonEmptyString))) {
      issues.push({ path: `${itemPath}.removedAtoms`, message: "Recipe bundle removedAtoms must be an array of atom ids." })
    }
    if ("replacedAtoms" in bundle && !isRecord(bundle["replacedAtoms"])) {
      issues.push({ path: `${itemPath}.replacedAtoms`, message: "Recipe bundle replacedAtoms must be an object map of atom ids." })
    }
    if (isRecord(bundle["replacedAtoms"])) {
      for (const [from, to] of Object.entries(bundle["replacedAtoms"])) {
        if (!isNonEmptyString(from) || !isNonEmptyString(to)) {
          issues.push({ path: `${itemPath}.replacedAtoms`, message: "Recipe bundle replacedAtoms keys and values must be atom ids." })
        }
      }
    }
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}
