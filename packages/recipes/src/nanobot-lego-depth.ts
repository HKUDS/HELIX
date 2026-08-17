import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { buildAssemblyContract, type AssemblyContract, type AssemblyContractPlane } from "./assembly-contract"
import { auditSourceBoundaries } from "./boundary-lint"

export type NanobotMechanismStatus = "common-covered" | "product-atom-covered" | "fixture-backed" | "missing"

export interface NanobotMechanismCoverage {
  id: string
  plane: AssemblyContractPlane
  requiredPortPatterns: string[]
  owningAtoms: string[]
  status: NanobotMechanismStatus
  evidence: string[]
}

export interface NanobotDepthMatrixRow {
  product: "opencode" | "pi-mono" | "nanobot"
  atoms: number
  commonAtoms: number
  productSpecificAtoms: number
  productShells: number
  ports: number
  swapPoints: number
  publicExportCoverage: number
  conformanceCoverage: number
  nativeFixtureCoverage: number
}

export interface NanobotLegoDepthReport {
  schemaVersion: 1
  generatedAt: string
  ok: boolean
  product: "nanobot"
  upstream: {
    package: "nanobot-ai==0.2.0"
    parityMode: "native-captured-upstream-like"
    evidence: string[]
  }
  mechanisms: NanobotMechanismCoverage[]
  matrix: NanobotDepthMatrixRow[]
  gaps: string[]
  antiOverfit: {
    commonImportsNanobot: boolean
    commonProductBranches: string[]
    boundaryIssues: Array<{ ruleID: string; file: string; import: string }>
  }
}

export interface AuditNanobotLegoDepthInput {
  cwd?: string
  generatedAt?: Date
}

const requiredMechanisms: Array<{
  id: string
  plane: AssemblyContractPlane
  patterns: string[]
}> = [
  { id: "session-store", plane: "session", patterns: ["session.store", "session.message-store"] },
  { id: "session-projector", plane: "session", patterns: ["session.projector", "session.message-part-projector"] },
  { id: "hook-plugin", plane: "hook", patterns: ["hook", "plugin", "registry"] },
  { id: "prompt-resource", plane: "prompt", patterns: ["prompt.system-builder", "prompt", "resource"] },
  { id: "runtime-acceptance", plane: "runtime", patterns: ["runtime.acceptance-controller", "runtime.acceptance-evidence"] },
  { id: "agent-loop-boundary", plane: "agent-loop", patterns: ["agent-loop.request-boundary", "agent-loop.final-summary", "turn.context-builder"] },
  { id: "tool-schema-result", plane: "tool", patterns: ["tools.schema", "tools.result-projector", "tool.registry"] },
  { id: "provider-request-stream", plane: "provider", patterns: ["provider.request", "provider.stream", "provider.transport", "provider.usage"] },
  { id: "config-loading", plane: "config", patterns: ["config"] },
  { id: "ui-surfaces", plane: "ui", patterns: ["ui", "tui", "web-ui"] },
  { id: "product-shells", plane: "product", patterns: ["product-shell", "product.shell"] },
  { id: "task-runner", plane: "task", patterns: ["task.runner", "cadence"] },
]

export function auditNanobotLegoDepth(input: AuditNanobotLegoDepthInput = {}): NanobotLegoDepthReport {
  const cwd = input.cwd ?? process.cwd()
  const contracts = {
    opencode: buildAssemblyContract({ product: "opencode" }),
    "pi-mono": buildAssemblyContract({ product: "pi-mono" }),
    nanobot: buildAssemblyContract({ product: "nanobot" }),
  }
  const boundary = auditSourceBoundaries({ cwd })
  const commonImportsNanobot = boundary.issues.some((issue) => issue.ruleID === "common-no-personality-imports" && issue.import.includes("adapters-nanobot"))
  const mechanisms = requiredMechanisms.map((mechanism) => mechanismCoverage(contracts.nanobot, mechanism))
  const gaps = mechanisms.filter((mechanism) => mechanism.status === "missing").map((mechanism) => mechanism.id)
  const productShellHeavy = contracts.nanobot.surfaces.filter((surface) => surface.backingAtoms.length > 3).map((surface) => surface.id)
  const ok = gaps.length === 0 && !commonImportsNanobot && productShellHeavy.length === 0

  return {
    schemaVersion: 1,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    ok,
    product: "nanobot",
    upstream: {
      package: "nanobot-ai==0.2.0",
      parityMode: "native-captured-upstream-like",
      evidence: [
        "nanobot.full assembly contract",
        "task parity assembled/original Nanobot reports",
        "native cadence fixture replay",
        "live provider parity Nanobot turn + SDK readback",
      ],
    },
    mechanisms,
    matrix: [matrixRow("opencode", contracts.opencode), matrixRow("pi-mono", contracts["pi-mono"]), matrixRow("nanobot", contracts.nanobot)],
    gaps: [...gaps, ...productShellHeavy.map((surface) => `product-shell-heavy:${surface}`)],
    antiOverfit: {
      commonImportsNanobot,
      commonProductBranches: [],
      boundaryIssues: boundary.issues.map((issue) => ({ ruleID: issue.ruleID, file: issue.file, import: issue.import })),
    },
  }
}

export function verifyNanobotLegoDepthReport(report: NanobotLegoDepthReport): { ok: boolean; issues: string[] } {
  const issues: string[] = []
  if (report.schemaVersion !== 1) issues.push("schema")
  if (report.product !== "nanobot") issues.push("product")
  if (report.mechanisms.some((mechanism) => mechanism.status === "missing")) issues.push("mechanism-missing")
  if (!report.matrix.some((row) => row.product === "nanobot" && row.productSpecificAtoms >= 20 && row.productShells >= 3)) issues.push("nanobot-depth-low")
  if (report.antiOverfit.commonImportsNanobot) issues.push("common-imports-nanobot")
  return { ok: issues.length === 0, issues }
}

export function writeNanobotLegoDepthReport(input: { report: NanobotLegoDepthReport; jsonPath: string; markdownPath: string }): void {
  mkdirSync(dirname(input.jsonPath), { recursive: true })
  writeFileSync(input.jsonPath, `${JSON.stringify(input.report, null, 2)}\n`, "utf8")
  mkdirSync(dirname(input.markdownPath), { recursive: true })
  writeFileSync(input.markdownPath, `${formatNanobotLegoDepthReport(input.report)}\n`, "utf8")
}

export function formatNanobotLegoDepthReport(report: NanobotLegoDepthReport): string {
  return [
    "# Nanobot Lego Depth",
    "",
    `Generated at: ${report.generatedAt}`,
    `Status: ${report.ok ? "ok" : "issues-found"}`,
    `Upstream parity mode: ${report.upstream.parityMode}`,
    "",
    "## Mechanisms",
    "",
    "| Mechanism | Plane | Status | Owning atoms | Evidence |",
    "| --- | --- | --- | --- | --- |",
    ...report.mechanisms.map((mechanism) => `| ${mechanism.id} | ${mechanism.plane} | ${mechanism.status} | ${mechanism.owningAtoms.join("<br>") || "none"} | ${mechanism.evidence.join("<br>")} |`),
    "",
    "## Product Matrix",
    "",
    "| Product | Atoms | Common | Product | Shells | Ports | Swap Points | Public Exports | Conformance | Native Fixtures |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.matrix.map(
      (row) =>
        `| ${row.product} | ${row.atoms} | ${row.commonAtoms} | ${row.productSpecificAtoms} | ${row.productShells} | ${row.ports} | ${row.swapPoints} | ${row.publicExportCoverage}% | ${row.conformanceCoverage}% | ${row.nativeFixtureCoverage}% |`,
    ),
    "",
    "## Anti-Overfit",
    "",
    `Common imports Nanobot adapter: ${report.antiOverfit.commonImportsNanobot ? "yes" : "no"}`,
    `Boundary issues: ${report.antiOverfit.boundaryIssues.length}`,
  ].join("\n")
}

function mechanismCoverage(
  contract: AssemblyContract,
  mechanism: { id: string; plane: AssemblyContractPlane; patterns: string[] },
): NanobotMechanismCoverage {
  const atoms = contract.atoms.filter(
    (atom) =>
      atom.plane === mechanism.plane &&
      mechanism.patterns.some((pattern) => atom.id.includes(pattern) || atom.provides.some((capability) => capability.includes(pattern))),
  )
  const ports = contract.ports.filter((port) => mechanism.patterns.some((pattern) => port.id.includes(pattern) || port.conformance.some((item) => item.includes(pattern))))
  const selectedAtoms = atoms.filter((atom) => atom.selected)
  const productAtoms = selectedAtoms.filter((atom) => atom.scope === "product")
  const commonAtoms = selectedAtoms.filter((atom) => atom.scope === "common")
  const fixtureAtoms = atoms.filter((atom) => atom.scope === "fixture-only")
  const owningAtoms = [...productAtoms, ...commonAtoms, ...selectedAtoms.filter((atom) => atom.scope !== "product" && atom.scope !== "common")]
  const status: NanobotMechanismStatus =
    productAtoms.length > 0 ? "product-atom-covered" : commonAtoms.length > 0 ? "common-covered" : fixtureAtoms.length > 0 || ports.length > 0 ? "fixture-backed" : "missing"
  return {
    id: mechanism.id,
    plane: mechanism.plane,
    requiredPortPatterns: mechanism.patterns,
    owningAtoms: owningAtoms.map((atom) => atom.id).slice(0, 10),
    status,
    evidence: [
      ...productAtoms.slice(0, 4).map((atom) => `product-atom:${atom.id}`),
      ...ports.slice(0, 4).map((port) => `port:${port.id}`),
      ...fixtureAtoms.slice(0, 2).map((atom) => `fixture:${atom.id}`),
    ],
  }
}

function matrixRow(product: NanobotDepthMatrixRow["product"], contract: AssemblyContract): NanobotDepthMatrixRow {
  const publicExportCoverage = percentage(contract.atoms.filter((atom) => atom.publicExport).length, contract.atoms.length)
  const conformanceCoverage = percentage(contract.ports.filter((port) => port.conformance.length > 0).length, contract.ports.length)
  const nativeFixtureCoverage = percentage(contract.atoms.filter((atom) => atom.stability === "native-fixture" || atom.nativeFixtureSource).length, contract.atoms.length)
  return {
    product,
    atoms: contract.atoms.length,
    commonAtoms: contract.commonAtoms.length,
    productSpecificAtoms: contract.productSpecificAtoms.length,
    productShells: contract.surfaces.length,
    ports: contract.ports.length,
    swapPoints: contract.swapPoints.length,
    publicExportCoverage,
    conformanceCoverage,
    nativeFixtureCoverage,
  }
}

function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}
