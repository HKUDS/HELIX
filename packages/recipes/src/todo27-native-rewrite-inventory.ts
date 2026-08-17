import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import {
  buildAssemblyContract,
  type AssemblyAtomParityCoverage,
  type AssemblyContract,
  type AssemblyContractAtom,
  type AssemblyContractPlane,
  type AssemblyContractProduct,
} from "./assembly-contract"
import { executableImplementationLevelForAtom, type ExecutableImplementationLevel } from "./executable-port-rules"

export type Todo27NativeRewriteInventoryProduct = Extract<AssemblyContractProduct, "opencode" | "pi-mono" | "nanobot" | "hermes-agent">
export type Todo27NativeRewriteDisposition =
  | "product-native-complete"
  | "rewrite-open-with-partial-evidence"
  | "bridge-retained-pending-native-fixture"
  | "preview-retained"
  | "metadata-retained"

export interface Todo27NativeRewriteInventoryItem {
  product: Todo27NativeRewriteInventoryProduct
  atomID: string
  plane: AssemblyContractPlane
  implementationLevel: ExecutableImplementationLevel
  parityCoverage: AssemblyAtomParityCoverage
  selected: boolean
  ownerSection: string
  disposition: Todo27NativeRewriteDisposition
  fixtureTarget: string
  blocker: string
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  upstreamRefs: string[]
}

export interface Todo27NativeRewriteInventory {
  schemaVersion: 1
  artifactKind: "todo27-native-rewrite-inventory"
  generatedAt: string
  products: Todo27NativeRewriteInventoryProduct[]
  items: Todo27NativeRewriteInventoryItem[]
  summary: {
    total: number
    selected: number
    productNativeComplete: number
    rewriteOpenWithPartialEvidence: number
    bridgeRetainedPendingNativeFixture: number
    previewRetained: number
    metadataRetained: number
    evidenceLinked: number
    fixtureLinked: number
    lossinessLinked: number
    uncategorized: number
    byImplementationLevel: Record<ExecutableImplementationLevel, number>
    byOwnerSection: Record<string, number>
    fingerprint: string
  }
}

export interface Todo27NativeRewriteInventoryVerificationCheck {
  id: string
  ok: boolean
  severity: "error" | "warning"
  message: string
  refs: string[]
}

export interface Todo27NativeRewriteInventoryVerification {
  ok: boolean
  fingerprint: string
  checks: Todo27NativeRewriteInventoryVerificationCheck[]
  issues: Todo27NativeRewriteInventoryVerificationCheck[]
  warnings: Todo27NativeRewriteInventoryVerificationCheck[]
}

export interface BuildTodo27NativeRewriteInventoryInput {
  products?: Todo27NativeRewriteInventoryProduct[]
  contracts?: AssemblyContract[]
  generatedAt?: string
}

const defaultTodo27Products: Todo27NativeRewriteInventoryProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
const transitionLevels: ExecutableImplementationLevel[] = ["native", "native-like", "profile-compatible", "compatible-bridge", "preview-shell", "metadata-only"]

const productUpstreamRefs: Record<Todo27NativeRewriteInventoryProduct, string[]> = {
  opencode: ["upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"],
  "pi-mono": ["upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"],
  nanobot: ["upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7", "package:nanobot-ai@0.2.0"],
  "hermes-agent": ["upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf", "package:hermes-agent==0.15.1"],
}

export function buildTodo27NativeRewriteInventory(input: BuildTodo27NativeRewriteInventoryInput = {}): Todo27NativeRewriteInventory {
  const contracts = input.contracts ?? (input.products ?? defaultTodo27Products).map((product) => buildAssemblyContract({ product, ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}) }))
  const products = uniqueStrings(contracts.map((contract) => normalizeTodo27Product(contract.product)).filter((product): product is Todo27NativeRewriteInventoryProduct => Boolean(product))) as Todo27NativeRewriteInventoryProduct[]
  const items = contracts.flatMap(itemsForContract).sort((left, right) => `${left.product}:${left.atomID}`.localeCompare(`${right.product}:${right.atomID}`))
  const summaryWithoutFingerprint = inventorySummary(items)
  const fingerprint = fingerprintObject({
    products,
    items: items.map(fingerprintInventoryItem),
    summary: summaryWithoutFingerprint,
  })
  return {
    schemaVersion: 1,
    artifactKind: "todo27-native-rewrite-inventory",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    products,
    items,
    summary: {
      ...summaryWithoutFingerprint,
      fingerprint,
    },
  }
}

export function verifyTodo27NativeRewriteInventory(inventory: Todo27NativeRewriteInventory): Todo27NativeRewriteInventoryVerification {
  const checks: Todo27NativeRewriteInventoryVerificationCheck[] = []
  const add = (check: Todo27NativeRewriteInventoryVerificationCheck): void => {
    checks.push(check)
  }
  const expectedFingerprint = fingerprintObject({
    products: inventory.products,
    items: inventory.items.map(fingerprintInventoryItem),
    summary: inventorySummary(inventory.items),
  })

  add({
    id: "todo27-inventory.fingerprint",
    ok: inventory.summary.fingerprint === expectedFingerprint,
    severity: "error",
    message: "Inventory fingerprint must match products, transition items, and summary.",
    refs: inventory.summary.fingerprint === expectedFingerprint ? [inventory.summary.fingerprint] : [inventory.summary.fingerprint, expectedFingerprint],
  })
  add({
    id: "todo27-inventory.transition-items.present",
    ok: inventory.items.length > 0 && inventory.summary.total === inventory.items.length,
    severity: "error",
    message: "Inventory must contain every product-scoped transition atom and keep summary.total in sync.",
    refs: [String(inventory.items.length), String(inventory.summary.total)],
  })
  const nonTransition = inventory.items.filter((item) => !transitionLevels.includes(item.implementationLevel))
  add({
    id: "todo27-inventory.transition-level-only",
    ok: nonTransition.length === 0,
    severity: "error",
    message: "Inventory items must only cover TODO-027 product transition levels, never common-shared atoms.",
    refs: nonTransition.slice(0, 8).map((item) => item.atomID),
  })
  const missingClassification = inventory.items.filter((item) => !item.ownerSection || !item.disposition || !item.fixtureTarget || !item.blocker)
  add({
    id: "todo27-inventory.classification-complete",
    ok: missingClassification.length === 0 && inventory.summary.uncategorized === 0,
    severity: "error",
    message: "Every transition atom must have an owner section, disposition, fixture target, and blocker.",
    refs: missingClassification.slice(0, 12).map((item) => item.atomID),
  })
  const weakEvidence = inventory.items.filter(
    (item) =>
      item.implementationLevel !== "metadata-only" &&
      item.nativeEvidenceRefs.length === 0 &&
      item.fixtureIDs.length === 0 &&
      item.knownLossiness.length === 0,
  )
  add({
    id: "todo27-inventory.transition-evidence-or-lossiness",
    ok: weakEvidence.length === 0,
    severity: "error",
    message: "Non-metadata transition atoms must expose native evidence, fixture refs, or explicit lossiness.",
    refs: weakEvidence.slice(0, 12).map((item) => item.atomID),
  })
  const misleadingNative = inventory.items.filter(
    (item) =>
      item.disposition === "product-native-complete" &&
      (
        item.implementationLevel !== "native" ||
        item.parityCoverage !== "native" ||
        item.nativeEvidenceRefs.length === 0 ||
        item.fixtureIDs.length === 0 ||
        item.knownLossiness.length > 0
      ),
  )
  add({
    id: "todo27-inventory.no-unproven-native-complete",
    ok: misleadingNative.length === 0,
    severity: "error",
    message: "TODO-027 transition inventory must only mark fully proven native atoms as product-native complete.",
    refs: misleadingNative.slice(0, 12).map((item) => item.atomID),
  })
  const previewWithoutPreviewDisposition = inventory.items.filter((item) => item.implementationLevel === "preview-shell" && item.disposition !== "preview-retained")
  add({
    id: "todo27-inventory.preview-retained",
    ok: previewWithoutPreviewDisposition.length === 0,
    severity: "error",
    message: "Preview shells must stay explicitly preview-retained until native TUI/Web parity exists.",
    refs: previewWithoutPreviewDisposition.slice(0, 12).map((item) => item.atomID),
  })

  const issues = checks.filter((check) => !check.ok && check.severity === "error")
  const warnings = checks.filter((check) => !check.ok && check.severity === "warning")
  return {
    ok: issues.length === 0,
    fingerprint: expectedFingerprint,
    checks,
    issues,
    warnings,
  }
}

export function writeTodo27NativeRewriteInventoryReports(input: {
  inventory: Todo27NativeRewriteInventory
  jsonPath?: string
  markdownPath?: string
}): void {
  if (input.jsonPath) {
    mkdirSync(dirname(input.jsonPath), { recursive: true })
    writeFileSync(input.jsonPath, `${JSON.stringify(input.inventory, null, 2)}\n`, "utf8")
  }
  if (input.markdownPath) {
    mkdirSync(dirname(input.markdownPath), { recursive: true })
    writeFileSync(input.markdownPath, formatTodo27NativeRewriteInventoryMarkdown(input.inventory), "utf8")
  }
}

export function formatTodo27NativeRewriteInventoryMarkdown(inventory: Todo27NativeRewriteInventory): string {
  const lines = [
    "# TODO-027 Native Rewrite Inventory",
    "",
    `Generated: ${inventory.generatedAt}`,
    `Fingerprint: ${inventory.summary.fingerprint}`,
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Total transition atoms | ${inventory.summary.total} |`,
    `| Selected in product assemblies | ${inventory.summary.selected} |`,
    `| Rewrite open with partial evidence | ${inventory.summary.rewriteOpenWithPartialEvidence} |`,
    `| Bridge retained pending native fixture | ${inventory.summary.bridgeRetainedPendingNativeFixture} |`,
    `| Preview retained | ${inventory.summary.previewRetained} |`,
    `| Metadata retained | ${inventory.summary.metadataRetained} |`,
    `| Evidence linked | ${inventory.summary.evidenceLinked} |`,
    `| Fixtures linked | ${inventory.summary.fixtureLinked} |`,
    `| Lossiness linked | ${inventory.summary.lossinessLinked} |`,
    "",
    "## Owner Sections",
    "",
    "| Section | Count |",
    "| --- | ---: |",
  ]
  for (const [section, count] of Object.entries(inventory.summary.byOwnerSection).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(`| ${section} | ${count} |`)
  }
  lines.push("")
  for (const section of Object.keys(inventory.summary.byOwnerSection).sort()) {
    lines.push(`## ${section}`)
    lines.push("")
    lines.push("| Product | Atom | Level | Disposition | Fixtures | Lossiness | Blocker |")
    lines.push("| --- | --- | --- | --- | --- | --- | --- |")
    for (const item of inventory.items.filter((candidate) => candidate.ownerSection === section).slice(0, 80)) {
      lines.push(
        `| ${item.product} | \`${item.atomID}\` | ${item.implementationLevel} | ${item.disposition} | ${item.fixtureIDs.length} | ${item.knownLossiness.join("<br>") || "none"} | ${item.blocker} |`,
      )
    }
    lines.push("")
  }
  return `${lines.join("\n")}\n`
}

function itemsForContract(contract: AssemblyContract): Todo27NativeRewriteInventoryItem[] {
  const product = normalizeTodo27Product(contract.product)
  if (!product) return []
  return contract.atoms
    .filter((atom) => isProductTransitionAtom(product, atom))
    .map((atom) => inventoryItemForAtom(product, atom))
}

function inventoryItemForAtom(product: Todo27NativeRewriteInventoryProduct, atom: AssemblyContractAtom): Todo27NativeRewriteInventoryItem {
  const implementationLevel = executableImplementationLevelForAtom(atom)
  const ownerSection = ownerSectionForAtom(atom, implementationLevel)
  const disposition = dispositionForAtom(atom, implementationLevel)
  return {
    product,
    atomID: atom.id,
    plane: atom.plane,
    implementationLevel,
    parityCoverage: atom.parityCoverage,
    selected: atom.selected,
    ownerSection,
    disposition,
    fixtureTarget: fixtureTargetForAtom(product, atom, ownerSection),
    blocker: blockerForAtom(atom, implementationLevel, ownerSection),
    nativeEvidenceRefs: uniqueStrings(atom.nativeEvidenceRefs),
    fixtureIDs: uniqueStrings(atom.fixtureIDs),
    knownLossiness: uniqueStrings(atom.knownLossiness),
    upstreamRefs: uniqueStrings([...(atom.upstreamVersion ? [`version:${atom.upstreamVersion}`] : []), ...(atom.upstreamCommit ? [`commit:${atom.upstreamCommit}`] : []), ...productUpstreamRefs[product]]),
  }
}

function isProductTransitionAtom(product: Todo27NativeRewriteInventoryProduct, atom: AssemblyContractAtom): boolean {
  if (!isProductPrefixedAtom(product, atom.id)) return false
  return transitionLevels.includes(executableImplementationLevelForAtom(atom))
}

function isProductPrefixedAtom(product: Todo27NativeRewriteInventoryProduct, atomID: string): boolean {
  if (product === "opencode") return atomID.startsWith("opencode.")
  if (product === "pi-mono") return atomID.startsWith("pi.")
  if (product === "nanobot") return atomID.startsWith("nanobot.")
  return atomID.startsWith("hermes.")
}

function ownerSectionForAtom(atom: AssemblyContractAtom, implementationLevel: ExecutableImplementationLevel): string {
  const id = atom.id
  if (implementationLevel === "metadata-only" && !isPromptSupportAlias(id)) return "TODO-028 Metadata Overlay Boundary"
  if (id.includes(".prompt.") && !isPromptSupportAlias(id)) return "P0-01 Prompt Family Native Rewrite"
  if (id.includes(".turn.")) return "P0-02 Product Turn Atoms Native Rewrite"
  if (id.includes(".agent-loop.") || id.includes(".tools.batch-scheduler.")) return "P1-04 Native-like Cadence Rewrite"
  if (id.includes(".tools.schema.") || id.includes(".tools.result-projector.") || id.includes(".tool.")) return "P1-05 Tool Schema / Result Projector Rewrite"
  if (id.includes(".provider.streaming-delta-recorder.") || id.includes(".provider.stream-projector.") || id.includes(".provider.")) return "P1-06 Provider Stream Projector Rewrite"
  if (id.includes(".session.message-part-projector.") || id.includes(".session.")) return "P1-07 Session Message-part Projector Rewrite"
  if (id.includes(".runtime.acceptance-") || id.includes(".runtime.")) return "P1-08 Runtime Acceptance Rewrite"
  if (id.includes(".tui.") || id.includes(".product-shell.tui")) return "P2-09 Product TUI Shell Rewrite"
  if (id.includes(".product-shell.web") || id.includes(".web-ui") || id.includes(".web-dashboard")) return "P2-10 Product Web / Dashboard Rewrite"
  if (isPromptSupportAlias(id)) return "P2-11 Product Prompt Support Alias Rewrite"
  if (id.includes(".product-shell.") || atom.plane === "product") return "P2 Product Shell Surface Bridge"
  return "TODO-027 Product Bridge Inventory"
}

function isPromptSupportAlias(id: string): boolean {
  return (
    id.endsWith(".resource.discovery") ||
    id.includes(".prompt.resource-loader") ||
    id.includes(".prompt.tool-renderer") ||
    id.includes(".prompt.model-adapter") ||
    id.includes(".prompt.compaction-adapter")
  )
}

function dispositionForAtom(atom: AssemblyContractAtom, implementationLevel: ExecutableImplementationLevel): Todo27NativeRewriteDisposition {
  if (
    implementationLevel === "native" &&
    atom.parityCoverage === "native" &&
    atom.nativeEvidenceRefs.length > 0 &&
    atom.fixtureIDs.length > 0 &&
    atom.knownLossiness.length === 0
  ) {
    return "product-native-complete"
  }
  if (implementationLevel === "preview-shell") return "preview-retained"
  if (implementationLevel === "metadata-only") return "metadata-retained"
  if (atom.nativeEvidenceRefs.length > 0 || atom.fixtureIDs.length > 0) return "rewrite-open-with-partial-evidence"
  return "bridge-retained-pending-native-fixture"
}

function fixtureTargetForAtom(product: Todo27NativeRewriteInventoryProduct, atom: AssemblyContractAtom, ownerSection: string): string {
  const exactFixture = atom.fixtureIDs.find((fixtureID) => fixtureID.includes("native-exact") || fixtureID.includes("exact-fixture"))
  if (exactFixture) return exactFixture
  if (atom.fixtureIDs.length > 0) return atom.fixtureIDs[0] ?? `${product}:${atom.id}`
  if (ownerSection.startsWith("P0-01")) return `${product}:full-prompt-family`
  if (ownerSection.startsWith("P0-02")) return `${product}:native-turn-loop`
  if (ownerSection.startsWith("P1-04")) return `${product}:native-cadence-loop`
  if (ownerSection.startsWith("P1-05")) return `${product}:native-tool-schema-result-envelope`
  if (ownerSection.startsWith("P1-06")) return `${product}:native-provider-stream-frames`
  if (ownerSection.startsWith("P1-07")) return `${product}:native-session-storage-round-trip`
  if (ownerSection.startsWith("P1-08")) return `${product}:native-acceptance-timing`
  if (ownerSection.startsWith("P2-09")) return `${product}:native-tui-pty-transcript`
  if (ownerSection.startsWith("P2-10")) return `${product}:native-web-api-view-e2e`
  if (ownerSection.startsWith("P2-11")) return `${product}:product-prompt-support-fixture`
  return `${product}:${atom.plane}:native-fixture`
}

function blockerForAtom(atom: AssemblyContractAtom, implementationLevel: ExecutableImplementationLevel, ownerSection: string): string {
  if (implementationLevel === "native" && atom.knownLossiness.length === 0) return "Native proof complete for this atom; no open module blocker remains."
  if (implementationLevel === "preview-shell") return "Preview shell is intentionally demoted until native product UI/TUI parity evidence exists."
  if (implementationLevel === "metadata-only") return "Metadata-only atom is retained for catalog/BOM/overlay data and must not bind executable ports."
  if (atom.knownLossiness.length > 0) return `Open lossiness: ${prioritizedBlockerLossiness(atom.knownLossiness).slice(0, 3).join(", ")}.`
  if (ownerSection.startsWith("P0-01")) return "Full upstream prompt family ordering matrix is not yet proven."
  if (ownerSection.startsWith("P0-02")) return "Full product turn loop implementation and native event replay are not yet proven."
  return "Product-native fixture or parity proof is still missing."
}

function prioritizedBlockerLossiness(lossiness: string[]): string[] {
  const priority = [
    "partial-product-turn-replay",
    "common-runner-not-full-native-loop",
    "shared-turn-profile",
    "partial-prompt-family",
    "partial-runtime-acceptance-replay",
  ]
  return uniqueStrings(lossiness).sort((left, right) => {
    const leftPriority = priority.indexOf(left)
    const rightPriority = priority.indexOf(right)
    const normalizedLeft = leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority
    const normalizedRight = rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority
    return normalizedLeft === normalizedRight ? left.localeCompare(right) : normalizedLeft - normalizedRight
  })
}

function inventorySummary(items: Todo27NativeRewriteInventoryItem[]): Omit<Todo27NativeRewriteInventory["summary"], "fingerprint"> {
  const byImplementationLevel = countBy(items, (item) => item.implementationLevel) as Record<ExecutableImplementationLevel, number>
  for (const level of ["native", "native-like", "profile-compatible", "compatible-bridge", "common-shared", "preview-shell", "metadata-only"] as ExecutableImplementationLevel[]) {
    byImplementationLevel[level] ??= 0
  }
  const byOwnerSection = countBy(items, (item) => item.ownerSection)
  return {
    total: items.length,
    selected: items.filter((item) => item.selected).length,
    productNativeComplete: items.filter((item) => item.disposition === "product-native-complete").length,
    rewriteOpenWithPartialEvidence: items.filter((item) => item.disposition === "rewrite-open-with-partial-evidence").length,
    bridgeRetainedPendingNativeFixture: items.filter((item) => item.disposition === "bridge-retained-pending-native-fixture").length,
    previewRetained: items.filter((item) => item.disposition === "preview-retained").length,
    metadataRetained: items.filter((item) => item.disposition === "metadata-retained").length,
    evidenceLinked: items.filter((item) => item.nativeEvidenceRefs.length > 0).length,
    fixtureLinked: items.filter((item) => item.fixtureIDs.length > 0).length,
    lossinessLinked: items.filter((item) => item.knownLossiness.length > 0).length,
    uncategorized: items.filter((item) => !item.ownerSection || !item.fixtureTarget || !item.blocker).length,
    byImplementationLevel,
    byOwnerSection,
  }
}

function fingerprintInventoryItem(item: Todo27NativeRewriteInventoryItem): Record<string, unknown> {
  return {
    product: item.product,
    atomID: item.atomID,
    plane: item.plane,
    implementationLevel: item.implementationLevel,
    parityCoverage: item.parityCoverage,
    selected: item.selected,
    ownerSection: item.ownerSection,
    disposition: item.disposition,
    fixtureTarget: item.fixtureTarget,
    blocker: item.blocker,
    nativeEvidenceRefs: item.nativeEvidenceRefs,
    fixtureIDs: item.fixtureIDs,
    knownLossiness: item.knownLossiness,
  }
}

function normalizeTodo27Product(product: AssemblyContractProduct): Todo27NativeRewriteInventoryProduct | undefined {
  if (product === "opencode" || product === "pi-mono" || product === "nanobot" || product === "hermes-agent") return product
  return undefined
}

function countBy<T>(items: T[], keyFor: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const key = keyFor(item)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => left[0].localeCompare(right[0])))
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort()
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
