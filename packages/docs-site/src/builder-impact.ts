import type { HarnessBuilderAtom, HarnessBuilderBundle, HarnessBuilderData } from "./index.ts"

export interface HarnessRemovalImpactRequest {
  atomID: string
  recipe: unknown
}

export interface HarnessRemovalBindingImpact {
  portID: string
  providerAtomID: string
}

export interface HarnessRemovalPortImpact {
  portID: string
  candidates: string[]
}

export interface HarnessRemovalConsumerImpact {
  atomID: string
  consumedPorts: string[]
}

export interface HarnessRemovalAtomSummary {
  id: string
  plane: string
  kind: string
  scope: string
  sharedByBundles?: string[]
}

export interface HarnessRemovalImpactResult {
  ok: true
  atomID: string
  atom: HarnessRemovalAtomSummary
  severity: "ok" | "warning" | "blocked"
  couplingGroup: string
  bundleID?: string
  bundleLabel?: string
  lostProvides: string[]
  removedBindings: HarnessRemovalBindingImpact[]
  requiredBreaks: HarnessRemovalPortImpact[]
  ambiguityAfter: HarnessRemovalPortImpact[]
  consumers: HarnessRemovalConsumerImpact[]
  bundleAtoms: HarnessRemovalAtomSummary[]
  sharedAtoms: HarnessRemovalAtomSummary[]
  bundleRemovalAtomIDs: string[]
  selectedCounts: {
    before: number
    after: number
  }
}

interface RecipeBinding {
  portID: string
  providerAtomID: string
}

interface ProviderCoverage {
  candidates: Map<string, string[]>
  providers: Map<string, string[]>
}

export function analyzeHarnessRemovalImpact(data: HarnessBuilderData, request: HarnessRemovalImpactRequest): HarnessRemovalImpactResult {
  const atomID = request.atomID.trim()
  if (!atomID) throw new Error("Removal impact request must include atomID.")

  const atomByID = new Map(data.atoms.map((atom) => [atom.id, atom]))
  const portByID = new Map(data.ports.map((port) => [port.id, port]))
  const atom = atomByID.get(atomID)
  if (!atom) throw new Error(`Unknown atom: ${atomID}.`)

  const selected = new Set(recipeAtomIDs(request.recipe))
  if (!selected.has(atomID)) throw new Error(`Atom ${atomID} is not selected in the submitted recipe.`)

  const bindings = recipeBindings(request.recipe)
  const bindingMap = new Map(bindings.map((binding) => [binding.portID, binding.providerAtomID]))
  const requiredPorts = recipeRequiredPorts(request.recipe)
  const before = providerCoverage(data, atomByID, selected, bindingMap)
  const selectedBundleIDs = selectedBundleIDsForRecipe(data, selected, request.recipe)
  const selectedBundles = selectedBundleIDs.map((id) => data.bundles.find((bundle) => bundle.id === id)).filter((bundle): bundle is HarnessBuilderBundle => Boolean(bundle))

  const nextSelected = new Set(selected)
  nextSelected.delete(atomID)
  const nextBindingMap = new Map(bindingMap)
  const removedBindings = bindings
    .filter((binding) => binding.providerAtomID === atomID)
    .map((binding) => {
      nextBindingMap.delete(binding.portID)
      return { portID: binding.portID, providerAtomID: binding.providerAtomID }
    })
  const after = providerCoverage(data, atomByID, nextSelected, nextBindingMap)

  const requiredBreaks = requiredPorts
    .filter((portID) => (before.providers.get(portID) ?? []).includes(atomID) && (after.providers.get(portID) ?? []).length === 0)
    .map((portID) => ({ portID, candidates: after.candidates.get(portID) ?? [] }))

  const ambiguityAfter = requiredPorts
    .filter((portID) => {
      const port = portByID.get(portID)
      const providers = after.providers.get(portID) ?? []
      return Boolean(port && port.multiplicity === "single" && providers.length > 1 && !nextBindingMap.has(portID))
    })
    .map((portID) => ({ portID, candidates: after.providers.get(portID) ?? [] }))

  const lostProvides = atom.provides
  const consumers = [...selected]
    .filter((id) => id !== atomID)
    .map((id) => atomByID.get(id))
    .filter((candidate): candidate is HarnessBuilderAtom => Boolean(candidate))
    .map((candidate) => ({
      atomID: candidate.id,
      consumedPorts: candidate.consumes.filter((portID) => lostProvides.includes(portID)),
    }))
    .filter((consumer) => consumer.consumedPorts.length > 0)
    .slice(0, 24)

  const bundle = selectedBundles.find((candidate) => candidate.atoms.includes(atomID)) ?? data.bundles.find((candidate) => candidate.atoms.includes(atomID))
  const couplingGroup = bundle?.id ?? atomCouplingGroup(atom)
  const bundleAtoms = bundle
    ? bundle.atoms
        .filter((id) => selected.has(id))
        .map((id) => atomByID.get(id))
        .filter((candidate): candidate is HarnessBuilderAtom => Boolean(candidate))
        .map((candidate) => atomSummary(candidate, sharedBundleIDs(candidate.id, selectedBundles, bundle.id)))
    : [...selected]
        .map((id) => atomByID.get(id))
        .filter((candidate): candidate is HarnessBuilderAtom => Boolean(candidate && sameCouplingBundle(atom, candidate, couplingGroup)))
        .map((candidate) => atomSummary(candidate))
  const sharedAtoms = bundleAtoms.filter((candidate) => (candidate.sharedByBundles ?? []).length > 0)
  const bundleRemovalAtomIDs = bundleAtoms.filter((candidate) => (candidate.sharedByBundles ?? []).length === 0).map((candidate) => candidate.id)

  const severity = requiredBreaks.length > 0 || ambiguityAfter.length > 0 ? "blocked" : removedBindings.length > 0 || consumers.length > 0 ? "warning" : "ok"

  return {
    ok: true,
    atomID,
    atom: atomSummary(atom),
    severity,
    couplingGroup,
    ...(bundle ? { bundleID: bundle.id, bundleLabel: bundle.label } : {}),
    lostProvides,
    removedBindings,
    requiredBreaks,
    ambiguityAfter,
    consumers,
    bundleAtoms,
    sharedAtoms,
    bundleRemovalAtomIDs,
    selectedCounts: {
      before: selected.size,
      after: nextSelected.size,
    },
  }
}

function providerCoverage(data: HarnessBuilderData, atomByID: Map<string, HarnessBuilderAtom>, selected: Set<string>, bindings: Map<string, string>): ProviderCoverage {
  const candidates = new Map<string, string[]>()
  for (const atomID of selected) {
    const atom = atomByID.get(atomID)
    if (!atom) continue
    for (const portID of atom.provides) {
      const list = candidates.get(portID) ?? []
      list.push(atomID)
      candidates.set(portID, uniqueStrings(list))
    }
  }

  const providers = new Map<string, string[]>()
  for (const port of data.ports) {
    const portCandidates = candidates.get(port.id) ?? []
    const bound = bindings.get(port.id)
    providers.set(port.id, bound && portCandidates.includes(bound) ? [bound] : portCandidates)
  }
  return { candidates, providers }
}

function atomSummary(atom: HarnessBuilderAtom, sharedByBundles: string[] = []): HarnessRemovalAtomSummary {
  return {
    id: atom.id,
    plane: atom.plane,
    kind: atom.kind,
    scope: atom.scope,
    ...(sharedByBundles.length > 0 ? { sharedByBundles } : {}),
  }
}

function selectedBundleIDsForRecipe(data: HarnessBuilderData, selected: Set<string>, recipe: unknown): string[] {
  return uniqueStrings([
    ...recipeBundleIDs(recipe),
    ...data.bundles
      .filter((bundle) => bundle.atoms.length > 0 && bundle.atoms.every((atomID) => selected.has(atomID)))
      .map((bundle) => bundle.id),
  ])
}

function sharedBundleIDs(atomID: string, selectedBundles: HarnessBuilderBundle[], currentBundleID: string): string[] {
  return selectedBundles.filter((bundle) => bundle.id !== currentBundleID && bundle.atoms.includes(atomID)).map((bundle) => bundle.id).sort()
}

function atomCouplingGroup(atom: HarnessBuilderAtom): string {
  const text = [atom.id, atom.plane, atom.kind, ...atom.provides, ...atom.consumes].join(" ").toLowerCase()
  if (atom.kind === "product-shell" || atom.id.startsWith("product.shell.") || atom.id.includes(".product-shell.")) return "interface"
  if (text.includes("hook")) return "hook"
  if (text.includes("agent-loop") || text.includes("turn.")) return "agent-loop"
  if (text.includes("prompt.") || text.includes("resource.") || text.includes("capability.")) return "prompt"
  if (text.includes("provider.") || atom.plane === "provider") return "provider"
  if (text.includes("session.") || text.includes("identity.") || text.includes("event.") || atom.plane === "session") return "session"
  if (text.includes("tool.") || text.includes("tools.") || text.includes("extension.") || text.includes("filesystem.") || text.includes("process-runner.")) return "tool"
  if (text.includes("ui.") || text.includes(".tui.") || text.includes(".web-ui.") || atom.plane === "ui") return "ui"
  if (text.includes("runtime.") || atom.plane === "runtime") return "runtime"
  return atom.plane || "module"
}

function sameCouplingBundle(atom: HarnessBuilderAtom, candidate: HarnessBuilderAtom, couplingGroup: string): boolean {
  if (candidate.id === atom.id) return true
  if (atomCouplingGroup(candidate) !== couplingGroup) return false
  const atomPorts = [...atom.provides, ...atom.consumes]
  const candidatePorts = [...candidate.provides, ...candidate.consumes]
  if (atomPorts.some((portID) => candidatePorts.includes(portID))) return true
  if (atom.sourcePackage && candidate.sourcePackage && atom.sourcePackage === candidate.sourcePackage) return true
  const atomFamily = productFamilyForAtom(atom.id)
  return atomFamily !== "common" && atomFamily === productFamilyForAtom(candidate.id)
}

function productFamilyForAtom(id: string): string {
  if (id.startsWith("opencode.")) return "opencode"
  if (id.startsWith("pi.")) return "pi-mono"
  if (id.startsWith("nanobot.")) return "nanobot"
  if (id.startsWith("hermes.")) return "hermes-agent"
  return "common"
}

function recipeAtomIDs(recipe: unknown): string[] {
  const record = recipeRecord(recipe)
  return uniqueStrings([...recipeRefIDs(record.modules), ...recipeRefIDs(record.atoms), ...recipeRefIDs(record.productShells)])
}

function recipeBundleIDs(recipe: unknown): string[] {
  const record = recipeRecord(recipe)
  if (!Array.isArray(record.bundles)) return []
  return uniqueStrings(
    record.bundles
      .map((item) => {
        if (typeof item === "string") return item
        if (item && typeof item === "object" && typeof (item as Record<string, unknown>).id === "string") return (item as Record<string, string>).id
        return ""
      })
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  )
}

function recipeRefIDs(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object" && typeof (item as Record<string, unknown>).id === "string") return (item as Record<string, string>).id
      return ""
    })
    .filter((id): id is string => typeof id === "string" && id.length > 0)
}

function recipeBindings(recipe: unknown): RecipeBinding[] {
  const record = recipeRecord(recipe)
  if (!Array.isArray(record.bindings)) return []
  return record.bindings
    .map((item) => {
      if (!item || typeof item !== "object") return undefined
      const binding = item as Record<string, unknown>
      const portID = typeof binding.port === "string" ? binding.port : typeof binding.portID === "string" ? binding.portID : ""
      const providerAtomID = typeof binding.module === "string" ? binding.module : typeof binding.providerAtomID === "string" ? binding.providerAtomID : ""
      return portID && providerAtomID ? { portID, providerAtomID } : undefined
    })
    .filter((binding): binding is RecipeBinding => Boolean(binding))
}

function recipeRequiredPorts(recipe: unknown): string[] {
  const record = recipeRecord(recipe)
  if (!Array.isArray(record.requiredCapabilities)) return []
  return uniqueStrings(
    record.requiredCapabilities
      .map((item) => {
        if (typeof item === "string") return item
        if (item && typeof item === "object" && typeof (item as Record<string, unknown>).id === "string") return (item as Record<string, string>).id
        return ""
      })
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  )
}

function recipeRecord(recipe: unknown): Record<string, unknown> {
  if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) throw new Error("Removal impact request must include a recipe JSON object.")
  return recipe as Record<string, unknown>
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort()
}
