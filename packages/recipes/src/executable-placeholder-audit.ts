import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import type { LegoBlockImplementationKind } from "@helix/contracts"
import {
  buildAssemblyContract,
  type AssemblyContract,
  type AssemblyAtomParityCoverage,
  type AssemblyContractAtom,
  type AssemblyContractBinding,
  type AssemblyContractPort,
  type AssemblyContractProduct,
} from "./assembly-contract"
import {
  executableImplementationLevelForAtom,
  executablePortRuleCatalog,
  executablePortRuleFor,
  isExecutableImplementationLevel,
  isMockFixtureOrCassetteAtomID,
  type ExecutableAuditProduct,
  type ExecutableBindingResolution,
  type ExecutableBindingRisk,
  type ExecutableImplementationLevel,
  type ExecutablePortRule,
} from "./executable-port-rules"

export type ExecutablePlaceholderAuditOwnerTODO = "TODO-024" | "TODO-025" | "TODO-027" | "TODO-028"
export type ExecutablePlaceholderBindingSource = "explicit-recipe" | "bundle-default" | "fallback" | "manual-builder"

export interface ExecutablePlaceholderAuditItem {
  product: ExecutableAuditProduct
  presetID: string
  portID: string
  selectedAtomID: string
  required: boolean
  executableRequired: boolean
  implementationKind: LegoBlockImplementationKind
  implementationLevel: ExecutableImplementationLevel
  bindingSource: ExecutablePlaceholderBindingSource
  risk: ExecutableBindingRisk
  expectedResolution: ExecutableBindingResolution
  nativeSourceRefs: string[]
  evidenceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  parityCoverage: AssemblyAtomParityCoverage
  knownLossiness: string[]
  ownerTODO: ExecutablePlaceholderAuditOwnerTODO
  candidateExecutableProviders: string[]
  metadataOverlayAtoms: string[]
  compileStatus: "passed" | "blocked" | "preview-only" | "not-required"
  gapSummary: string
}

export interface ExecutablePlaceholderAudit {
  schemaVersion: 1
  artifactKind: "executable-placeholder-audit"
  generatedAt: string
  products: ExecutableAuditProduct[]
  rules: ExecutablePortRule[]
  items: ExecutablePlaceholderAuditItem[]
  summary: {
    total: number
    executableRequired: number
    compileBlockers: number
    metadataOnlyExecutableBindings: number
    previewOnlyExecutableBindings: number
    mockOrFixtureExecutableBindings: number
    lossyCompatible: number
    todo027EvidenceConsumers: number
    nativeEvidenceLinked: number
    nativeFixtureLinked: number
    knownLossinessLinked: number
    metadataOverlays: number
    commonOK: number
    byRisk: Record<ExecutableBindingRisk, number>
    fingerprint: string
  }
}

export interface BuildExecutablePlaceholderAuditInput {
  products?: AssemblyContractProduct[]
  contracts?: AssemblyContract[]
  generatedAt?: string
}

export interface ExecutablePlaceholderAuditVerificationCheck {
  id: string
  ok: boolean
  severity: "error" | "warning"
  message: string
  refs: string[]
}

export interface ExecutablePlaceholderAuditVerification {
  ok: boolean
  fingerprint: string
  checks: ExecutablePlaceholderAuditVerificationCheck[]
  issues: ExecutablePlaceholderAuditVerificationCheck[]
  warnings: ExecutablePlaceholderAuditVerificationCheck[]
}

const defaultAuditProducts: AssemblyContractProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal"]

const upstreamRefs: Record<ExecutableAuditProduct, string[]> = {
  opencode: ["upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"],
  "pi-mono": ["upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"],
  nanobot: ["upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7", "package:nanobot-ai@0.2.0"],
  "hermes-agent": ["upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf", "package:hermes-agent==0.15.1"],
  minimal: ["baseline:common-runtime"],
  custom: ["baseline:manual-builder"],
}

export function buildExecutablePlaceholderAudit(input: BuildExecutablePlaceholderAuditInput = {}): ExecutablePlaceholderAudit {
  const contracts = input.contracts ?? (input.products ?? defaultAuditProducts).map((product) => buildAssemblyContract({ product, ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}) }))
  const products = uniqueStrings(contracts.map((contract) => normalizeAuditProduct(contract.product))) as ExecutableAuditProduct[]
  const items = contracts.flatMap(auditItemsForContract).sort((left, right) =>
    `${left.product}:${left.portID}:${left.selectedAtomID}`.localeCompare(`${right.product}:${right.portID}:${right.selectedAtomID}`),
  )
  const rules = executablePortRuleCatalog(uniqueStrings(contracts.flatMap((contract) => contract.ports.map((port) => port.id))))
  const summaryWithoutFingerprint = auditSummary(items)
  const fingerprint = fingerprintObject({
    products,
    rules: rules.map((rule) => ({ portID: rule.portID, executableRequired: rule.executableRequired, ruleID: rule.ruleID })),
    items: items.map(fingerprintAuditItem),
    summary: summaryWithoutFingerprint,
  })
  return {
    schemaVersion: 1,
    artifactKind: "executable-placeholder-audit",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    products,
    rules,
    items,
    summary: {
      ...summaryWithoutFingerprint,
      fingerprint,
    },
  }
}

export function writeExecutablePlaceholderAuditReports(input: {
  audit: ExecutablePlaceholderAudit
  jsonPath?: string
  markdownPath?: string
}): void {
  if (input.jsonPath) {
    mkdirSync(dirname(input.jsonPath), { recursive: true })
    writeFileSync(input.jsonPath, `${JSON.stringify(input.audit, null, 2)}\n`, "utf8")
  }
  if (input.markdownPath) {
    mkdirSync(dirname(input.markdownPath), { recursive: true })
    writeFileSync(input.markdownPath, formatExecutablePlaceholderAuditMarkdown(input.audit), "utf8")
  }
}

export function formatExecutablePlaceholderAuditMarkdown(audit: ExecutablePlaceholderAudit): string {
  const lines = [
    "# Executable Placeholder Audit",
    "",
    `Generated: ${audit.generatedAt}`,
    `Fingerprint: ${audit.summary.fingerprint}`,
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Total required bindings | ${audit.summary.total} |`,
    `| Executable-required bindings | ${audit.summary.executableRequired} |`,
    `| Compile blockers | ${audit.summary.compileBlockers} |`,
    `| Metadata-only executable bindings | ${audit.summary.metadataOnlyExecutableBindings} |`,
    `| Preview-only executable bindings | ${audit.summary.previewOnlyExecutableBindings} |`,
    `| Mock/fixture executable bindings | ${audit.summary.mockOrFixtureExecutableBindings} |`,
    `| Lossy compatible bindings | ${audit.summary.lossyCompatible} |`,
    `| TODO-027 evidence consumers | ${audit.summary.todo027EvidenceConsumers} |`,
    `| Native evidence linked | ${audit.summary.nativeEvidenceLinked} |`,
    `| Native fixtures linked | ${audit.summary.nativeFixtureLinked} |`,
    `| Known lossiness linked | ${audit.summary.knownLossinessLinked} |`,
    `| Metadata overlays | ${audit.summary.metadataOverlays} |`,
    `| Common/shared OK | ${audit.summary.commonOK} |`,
    "",
    "## Risk Groups",
    "",
  ]
  for (const risk of Object.keys(audit.summary.byRisk).sort() as ExecutableBindingRisk[]) {
    lines.push(`### ${risk}`)
    const group = audit.items.filter((item) => item.risk === risk)
    if (group.length === 0) {
      lines.push("")
      lines.push("_None._")
      lines.push("")
      continue
    }
    lines.push("")
    lines.push("| Product | Port | Provider | Level | Resolution | Owner | Native Evidence | Fixtures | Lossiness |")
    lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    for (const item of group) {
      lines.push(
        `| ${item.product} | \`${item.portID}\` | \`${item.selectedAtomID}\` | ${item.implementationLevel} | ${item.expectedResolution} | ${item.ownerTODO} | ${item.nativeEvidenceRefs.length} | ${item.fixtureIDs.length} | ${item.knownLossiness.join("<br>") || "none"} |`,
      )
    }
    lines.push("")
  }
  lines.push("## Metadata Overlays")
  lines.push("")
  const overlayItems = audit.items.filter((item) => item.metadataOverlayAtoms.length > 0)
  if (overlayItems.length === 0) {
    lines.push("_None._")
  } else {
    lines.push("| Product | Port | Executable Provider | Metadata Overlay Atoms |")
    lines.push("| --- | --- | --- | --- |")
    for (const item of overlayItems) {
      lines.push(`| ${item.product} | \`${item.portID}\` | \`${item.selectedAtomID}\` | ${item.metadataOverlayAtoms.map((atom) => `\`${atom}\``).join(", ")} |`)
    }
  }
  lines.push("")
  return `${lines.join("\n")}\n`
}

export function verifyExecutablePlaceholderAudit(audit: ExecutablePlaceholderAudit): ExecutablePlaceholderAuditVerification {
  const checks: ExecutablePlaceholderAuditVerificationCheck[] = []
  checks.push(check("executable-audit.schema", audit.schemaVersion === 1 && audit.artifactKind === "executable-placeholder-audit", "Audit artifact uses schema version 1."))
  checks.push(check("executable-audit.items.present", Array.isArray(audit.items) && audit.items.length > 0, "Audit artifact lists binding items."))
  checks.push(check("executable-audit.rules.present", Array.isArray(audit.rules) && audit.rules.length > 0, "Audit artifact lists executable port rules."))
  checks.push(
    check(
      "executable-audit.required-fields",
      audit.items.every((item) =>
        Boolean(item.product && item.presetID && item.portID && item.selectedAtomID && item.implementationKind && item.implementationLevel && item.risk && item.expectedResolution && item.ownerTODO),
      ),
      "Every audit item has required fields.",
    ),
  )
  checks.push(
    check(
      "executable-audit.compile-blockers.none",
      audit.summary.compileBlockers === 0,
      "Required executable ports must not bind metadata-only, mock, fixture, cassette, or invalid placeholder providers.",
      "error",
      audit.items.filter((item) => item.risk === "compile-blocker").map((item) => `${item.product}:${item.portID}:${item.selectedAtomID}`),
    ),
  )
  checks.push(
    check(
      "executable-audit.compile-blockers.resolved",
      audit.items.filter((item) => item.risk === "compile-blocker").every((item) => item.expectedResolution === "rebind-existing-executable" || item.expectedResolution === "add-product-adapter"),
      "Compile blocker items must include a concrete resolution.",
    ),
  )
  checks.push(
    check(
      "executable-audit.metadata-overlays.not-providers",
      audit.items.every((item) => !item.metadataOverlayAtoms.includes(item.selectedAtomID)),
      "Metadata overlay atoms must be distinct from the executable provider.",
    ),
  )
  checks.push(
    check(
      "executable-audit.native-upgrade.evidence",
      audit.items.filter((item) => item.expectedResolution === "native-rewrite").every((item) => item.nativeSourceRefs.length > 0 && item.evidenceRefs.length > 0),
      "Native rewrite items must carry upstream source refs and evidence refs.",
    ),
  )
  checks.push(
    check(
      "executable-audit.todo027-native-evidence-consumed",
      audit.items
        .filter((item) => item.ownerTODO === "TODO-027" && item.expectedResolution === "keep-with-evidence")
        .every((item) => item.nativeEvidenceRefs.length > 0 || item.fixtureIDs.length > 0 || item.knownLossiness.length > 0),
      "TODO-027 keep-with-evidence items must expose native evidence refs, fixture IDs, or known lossiness for TODO-028 audit consumption.",
      "error",
      audit.items
        .filter((item) => item.ownerTODO === "TODO-027" && item.expectedResolution === "keep-with-evidence")
        .filter((item) => item.nativeEvidenceRefs.length === 0 && item.fixtureIDs.length === 0 && item.knownLossiness.length === 0)
        .map((item) => `${item.product}:${item.portID}:${item.selectedAtomID}`),
    ),
  )
  checks.push(
    check(
      "executable-audit.fingerprint",
      audit.summary.fingerprint === expectedAuditFingerprint(audit),
      "Audit fingerprint matches canonical content.",
    ),
  )
  const issues = checks.filter((item) => !item.ok && item.severity === "error")
  const warnings = checks.filter((item) => !item.ok && item.severity === "warning")
  return {
    ok: issues.length === 0,
    fingerprint: audit.summary.fingerprint,
    checks,
    issues,
    warnings,
  }
}

function auditItemsForContract(contract: AssemblyContract): ExecutablePlaceholderAuditItem[] {
  const product = normalizeAuditProduct(contract.product)
  const atomByID = new Map(contract.atoms.map((atom) => [atom.id, atom]))
  const bindingByPort = new Map(contract.bindings.map((binding) => [binding.portID, binding]))
  return contract.ports
    .filter((port) => port.required)
    .map((port) => {
      const binding = bindingByPort.get(port.id)
      return auditItemForPort({ contract, product, port, atomByID, ...(binding ? { binding } : {}) })
    })
}

function auditItemForPort(input: {
  contract: AssemblyContract
  product: ExecutableAuditProduct
  port: AssemblyContractPort
  atomByID: Map<string, AssemblyContractAtom>
  binding?: AssemblyContractBinding
}): ExecutablePlaceholderAuditItem {
  const selectedAtomID = input.port.selectedProviderAtom ?? input.binding?.providerAtomID ?? "<unbound>"
  const selectedAtom = input.atomByID.get(selectedAtomID)
  const rule = executablePortRuleFor(input.port.id)
  const implementationKind = selectedAtom?.implementationKind ?? "metadata-only"
  const implementationLevel = executableImplementationLevelForAtom(selectedAtom)
  const candidateExecutableProviders = input.port.candidateAtoms
    .filter((atomID) => {
      const atom = input.atomByID.get(atomID)
      const level = executableImplementationLevelForAtom(atom)
      return isExecutableImplementationLevel(level) && !isMockFixtureOrCassetteAtomID(atomID)
    })
    .sort()
  const metadataOverlayAtoms = [...input.atomByID.values()]
    .filter((atom) => atom.selected && atom.id !== selectedAtomID && atom.provides.includes(input.port.id))
    .filter((atom) => executableImplementationLevelForAtom(atom) === "metadata-only")
    .map((atom) => atom.id)
    .sort()
  const risk = bindingRisk({
    product: input.product,
    portID: input.port.id,
    executableRequired: rule.executableRequired,
    selectedAtomID,
    implementationLevel,
  })
  const expectedResolution = expectedResolutionFor(risk, candidateExecutableProviders)
  return {
    product: input.product,
    presetID: input.contract.recipeID,
    portID: input.port.id,
    selectedAtomID,
    required: input.port.required,
    executableRequired: rule.executableRequired,
    implementationKind,
    implementationLevel,
    bindingSource: bindingSourceFor(input.binding),
    risk,
    expectedResolution,
    nativeSourceRefs: nativeSourceRefsFor(input.product, selectedAtom),
    evidenceRefs: evidenceRefsFor(input.contract, input.port, selectedAtom, input.binding),
    nativeEvidenceRefs: uniqueStrings(selectedAtom?.nativeEvidenceRefs ?? []),
    fixtureIDs: uniqueStrings(selectedAtom?.fixtureIDs ?? []),
    parityCoverage: selectedAtom?.parityCoverage ?? "none",
    knownLossiness: uniqueStrings(selectedAtom?.knownLossiness ?? []),
    ownerTODO: ownerTODOFor(risk, implementationLevel),
    candidateExecutableProviders,
    metadataOverlayAtoms,
    compileStatus: compileStatusFor(rule.executableRequired, risk),
    gapSummary: gapSummaryFor(risk, implementationLevel, selectedAtomID, metadataOverlayAtoms),
  }
}

function bindingRisk(input: {
  product: ExecutableAuditProduct
  portID: string
  executableRequired: boolean
  selectedAtomID: string
  implementationLevel: ExecutableImplementationLevel
}): ExecutableBindingRisk {
  if (allowedMinimalPlaceholder(input.product, input.portID, input.selectedAtomID)) return "metadata-ok"
  if (!input.executableRequired) return input.implementationLevel === "metadata-only" ? "metadata-ok" : "common-ok"
  if (input.selectedAtomID === "<unbound>") return "compile-blocker"
  if (input.implementationLevel === "metadata-only") return "compile-blocker"
  if (isMockFixtureOrCassetteAtomID(input.selectedAtomID) && input.product !== "minimal" && input.product !== "custom") return "compile-blocker"
  if (input.implementationLevel === "preview-shell") return "preview-only"
  if (input.implementationLevel === "common-shared" || input.implementationLevel === "native") return "common-ok"
  if (input.implementationLevel === "profile-compatible" || input.implementationLevel === "native-like" || input.implementationLevel === "compatible-bridge") {
    return "lossy-compatible"
  }
  return "misleading-coverage"
}

function expectedResolutionFor(risk: ExecutableBindingRisk, candidateExecutableProviders: string[]): ExecutableBindingResolution {
  if (risk === "compile-blocker") return candidateExecutableProviders.length > 0 ? "rebind-existing-executable" : "add-product-adapter"
  if (risk === "metadata-ok") return "metadata-overlay-only"
  if (risk === "preview-only") return "rename-or-demote"
  if (risk === "misleading-coverage") return "native-rewrite"
  return "keep-with-evidence"
}

function ownerTODOFor(risk: ExecutableBindingRisk, level: ExecutableImplementationLevel): ExecutablePlaceholderAuditOwnerTODO {
  if (risk === "compile-blocker" || risk === "metadata-ok") return "TODO-028"
  if (risk === "preview-only" || level === "native-like" || level === "profile-compatible") return "TODO-027"
  if (risk === "lossy-compatible") return "TODO-024"
  return "TODO-025"
}

function compileStatusFor(executableRequired: boolean, risk: ExecutableBindingRisk): ExecutablePlaceholderAuditItem["compileStatus"] {
  if (!executableRequired) return "not-required"
  if (risk === "compile-blocker") return "blocked"
  if (risk === "preview-only") return "preview-only"
  return "passed"
}

function allowedMinimalPlaceholder(product: ExecutableAuditProduct, portID: string, selectedAtomID: string): boolean {
  if (product !== "minimal" && product !== "custom") return false
  return (
    (portID === "process-runner.port" && selectedAtomID === "process-runner.disabled") ||
    (portID === "provider.transport" && selectedAtomID === "provider.transport.mock-sse") ||
    (portID === "ui.renderer" && selectedAtomID === "ui.renderer.noop")
  )
}

function bindingSourceFor(binding: AssemblyContractBinding | undefined): ExecutablePlaceholderBindingSource {
  if (!binding) return "fallback"
  if (binding.bindingSource === "recipe-explicit") return "explicit-recipe"
  if (binding.bindingSource === "compiler-inferred") return "bundle-default"
  return "fallback"
}

function nativeSourceRefsFor(product: ExecutableAuditProduct, atom: AssemblyContractAtom | undefined): string[] {
  return uniqueStrings([
    ...(atom?.nativeFixtureSource ? [atom.nativeFixtureSource] : []),
    ...(product === "minimal" || product === "custom" ? [] : upstreamRefs[product]),
  ])
}

function evidenceRefsFor(
  contract: AssemblyContract,
  port: AssemblyContractPort,
  atom: AssemblyContractAtom | undefined,
  binding: AssemblyContractBinding | undefined,
): string[] {
  return uniqueStrings([
    `assembly-contract:${contract.fingerprints.contract}`,
    `recipe:${contract.recipeID}`,
    ...port.conformance.map((item) => `conformance:${item}`),
    ...(binding ? [`binding:${binding.portID}->${binding.providerAtomID}`, `binding-source:${binding.bindingSource}`] : []),
    ...(atom?.source?.specifier ? [`source:${atom.source.specifier}`] : []),
    ...(atom?.nativeFixtureSource ? [`native-fixture:${atom.nativeFixtureSource}`] : []),
  ])
}

function gapSummaryFor(
  risk: ExecutableBindingRisk,
  level: ExecutableImplementationLevel,
  selectedAtomID: string,
  overlays: string[],
): string {
  if (risk === "compile-blocker") return `${selectedAtomID} cannot satisfy a required executable port.`
  if (risk === "preview-only") return `${selectedAtomID} is inspection or preview-only and must not be presented as native runtime parity.`
  if (risk === "metadata-ok") return overlays.length > 0 ? "Metadata-only atom is retained as an overlay, not the executable provider." : "Metadata-only atom is allowed for catalog/BOM/evidence use."
  if (risk === "lossy-compatible") return `${selectedAtomID} is ${level}; keep the bridge/lossiness summary visible until upstream parity evidence is added.`
  if (risk === "common-ok") return `${selectedAtomID} is an executable provider; product-specific labels/defaults remain separate metadata overlays.`
  return `${selectedAtomID} may overstate product-specific coverage and needs evidence review.`
}

function auditSummary(items: ExecutablePlaceholderAuditItem[]): Omit<ExecutablePlaceholderAudit["summary"], "fingerprint"> {
  const byRisk = {
    "compile-blocker": 0,
    "misleading-coverage": 0,
    "lossy-compatible": 0,
    "preview-only": 0,
    "metadata-ok": 0,
    "common-ok": 0,
  } satisfies Record<ExecutableBindingRisk, number>
  for (const item of items) byRisk[item.risk] += 1
  return {
    total: items.length,
    executableRequired: items.filter((item) => item.executableRequired).length,
    compileBlockers: byRisk["compile-blocker"],
    metadataOnlyExecutableBindings: items.filter((item) => item.executableRequired && item.implementationLevel === "metadata-only" && item.risk === "compile-blocker").length,
    previewOnlyExecutableBindings: byRisk["preview-only"],
    mockOrFixtureExecutableBindings: items.filter((item) => item.executableRequired && isMockFixtureOrCassetteAtomID(item.selectedAtomID)).length,
    lossyCompatible: byRisk["lossy-compatible"],
    todo027EvidenceConsumers: items.filter((item) => item.ownerTODO === "TODO-027" && (item.nativeEvidenceRefs.length > 0 || item.fixtureIDs.length > 0 || item.knownLossiness.length > 0)).length,
    nativeEvidenceLinked: items.filter((item) => item.nativeEvidenceRefs.length > 0).length,
    nativeFixtureLinked: items.filter((item) => item.fixtureIDs.length > 0).length,
    knownLossinessLinked: items.filter((item) => item.knownLossiness.length > 0).length,
    metadataOverlays: items.reduce((total, item) => total + item.metadataOverlayAtoms.length, 0),
    commonOK: byRisk["common-ok"],
    byRisk,
  }
}

function expectedAuditFingerprint(audit: ExecutablePlaceholderAudit): string {
  const summary = { ...audit.summary }
  delete (summary as Partial<typeof summary>).fingerprint
  return fingerprintObject({
    products: audit.products,
    rules: audit.rules.map((rule) => ({ portID: rule.portID, executableRequired: rule.executableRequired, ruleID: rule.ruleID })),
    items: audit.items.map(fingerprintAuditItem),
    summary,
  })
}

function fingerprintAuditItem(item: ExecutablePlaceholderAuditItem): unknown {
  return {
    product: item.product,
    presetID: item.presetID,
    portID: item.portID,
    selectedAtomID: item.selectedAtomID,
    required: item.required,
    executableRequired: item.executableRequired,
    implementationKind: item.implementationKind,
    implementationLevel: item.implementationLevel,
    bindingSource: item.bindingSource,
    risk: item.risk,
    expectedResolution: item.expectedResolution,
    nativeEvidenceRefs: item.nativeEvidenceRefs,
    fixtureIDs: item.fixtureIDs,
    parityCoverage: item.parityCoverage,
    knownLossiness: item.knownLossiness,
    ownerTODO: item.ownerTODO,
    candidateExecutableProviders: item.candidateExecutableProviders,
    metadataOverlayAtoms: item.metadataOverlayAtoms,
    compileStatus: item.compileStatus,
  }
}

function check(
  id: string,
  ok: boolean,
  message: string,
  severity: "error" | "warning" = "error",
  refs: string[] = [],
): ExecutablePlaceholderAuditVerificationCheck {
  return { id, ok, severity, message, refs }
}

function normalizeAuditProduct(product: AssemblyContractProduct): ExecutableAuditProduct {
  if (product === "opencode" || product === "pi-mono" || product === "nanobot" || product === "hermes-agent" || product === "minimal") return product
  return "custom"
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableJSON(value)).digest("hex").slice(0, 16)
}

function stableJSON(value: unknown): string {
  return JSON.stringify(sortStable(value))
}

function sortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, sortStable(entry)]))
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort()
}
