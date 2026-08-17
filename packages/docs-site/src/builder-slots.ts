export type HarnessBuilderSlotStage = "interface" | "session" | "provider" | "tools" | "prompt" | "ui" | "runtime"

export type HarnessBuilderSlotStatus = "empty" | "installed" | "partial" | "conflict" | "customized"

export interface HarnessBuilderSlot {
  id: string
  stage: HarnessBuilderSlotStage
  label: string
  portIDs: string[]
  primaryPortID: string
  candidateBundleIDs: string[]
  candidateAtomIDs: string[]
  required: boolean
  requiredIn: string[]
  productScope: string
}

export interface HarnessBuilderSlotPortInput {
  id: string
  candidates: string[]
  bundleCandidates: string[]
  requiredIn: string[]
}

export interface HarnessBuilderSlotAtomInput {
  id: string
  provides: string[]
  productScope: string
}

export interface HarnessBuilderSlotBundleInput {
  id: string
  label: string
  productScope: string
  atoms: string[]
  ports: string[]
}

export interface BuildHarnessBuilderSlotsInput {
  atoms: HarnessBuilderSlotAtomInput[]
  ports: HarnessBuilderSlotPortInput[]
  bundles: HarnessBuilderSlotBundleInput[]
}

const slotStageOrder: HarnessBuilderSlotStage[] = ["interface", "session", "provider", "prompt", "tools", "ui", "runtime"]

export function buildHarnessBuilderSlots(input: BuildHarnessBuilderSlotsInput): HarnessBuilderSlot[] {
  const atomByID = new Map(input.atoms.map((atom) => [atom.id, atom]))
  const bundleByID = new Map(input.bundles.map((bundle) => [bundle.id, bundle]))

  return input.ports
    .map((port): HarnessBuilderSlot => {
      const candidateAtomIDs = uniqueStrings([
        ...port.candidates,
        ...input.atoms.filter((atom) => atom.provides.includes(port.id)).map((atom) => atom.id),
      ])
      const candidateBundleIDs = uniqueStrings([
        ...port.bundleCandidates,
        ...input.bundles
          .filter((bundle) => bundle.ports.includes(port.id) || bundle.atoms.some((atomID) => atomByID.get(atomID)?.provides.includes(port.id)))
          .map((bundle) => bundle.id),
      ])
      const productScope = productScopeForCandidates(candidateAtomIDs, candidateBundleIDs, atomByID, bundleByID)
      return {
        id: slotIDForPort(port.id),
        stage: slotStageForPort(port.id),
        label: slotLabelForPort(port.id),
        portIDs: [port.id],
        primaryPortID: port.id,
        candidateBundleIDs,
        candidateAtomIDs,
        required: port.requiredIn.length > 0,
        requiredIn: uniqueStrings(port.requiredIn),
        productScope,
      }
    })
    .sort((left, right) => {
      const stageDelta = slotStageOrder.indexOf(left.stage) - slotStageOrder.indexOf(right.stage)
      return stageDelta === 0 ? left.id.localeCompare(right.id) : stageDelta
    })
}

export function slotIDForPort(portID: string): string {
  return `slot.${portID.toLowerCase().replace(/[^a-z0-9_.-]+/g, "-")}`
}

export function slotStageForPort(portID: string): HarnessBuilderSlotStage {
  if (portID === "product.shell") return "interface"
  if (portID.startsWith("session.") || portID.startsWith("identity.") || portID.startsWith("event.")) return "session"
  if (portID.startsWith("provider.")) return "provider"
  if (portID.startsWith("tool.") || portID.startsWith("tools.") || portID === "filesystem.port" || portID === "process-runner.port") return "tools"
  if (portID.startsWith("prompt.") || portID.startsWith("resource.") || portID.startsWith("capability.")) return "prompt"
  if (portID.startsWith("ui.") || portID === "registry.ui") return "ui"
  return "runtime"
}

function slotLabelForPort(portID: string): string {
  const labels: Record<string, string> = {
    "product.shell": "Product Interface",
    "session.store": "Session Store",
    "session.branch": "Session Branch",
    "session.compaction": "Session Compaction",
    "provider.model": "Model Provider",
    "provider.transport": "Provider Transport",
    "tool.registry": "Tool Registry",
    "prompt.system": "System Prompt",
    "runtime.lifecycle": "Runtime Lifecycle",
  }
  if (labels[portID]) return labels[portID]
  return portID
    .split(".")
    .map((part) => part.replace(/-/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function productScopeForCandidates(
  atomIDs: string[],
  bundleIDs: string[],
  atomByID: Map<string, HarnessBuilderSlotAtomInput>,
  bundleByID: Map<string, HarnessBuilderSlotBundleInput>,
): string {
  const scopes = uniqueStrings([
    ...atomIDs.map((id) => atomByID.get(id)?.productScope ?? "").filter(Boolean),
    ...bundleIDs.map((id) => bundleByID.get(id)?.productScope ?? "").filter(Boolean),
  ])
  if (scopes.length === 0) return "common"
  if (scopes.length === 1) return scopes[0] ?? "common"
  if (scopes.every((scope) => scope === "common")) return "common"
  return scopes.includes("common") ? "mixed" : "product"
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort()
}
