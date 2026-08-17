import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { buildDocsSite, buildHarnessBuilderData, writeDocsSite } from "@helix/docs-site"
import { describe, expect, it } from "vitest"

type BuilderPreset = {
  id: string
  nativeParityVerified: boolean
  nativeParitySummary: string
}

type BuilderAtom = {
  id: string
  implementationLevel?: string
  moduleConfirmationStatus?: string
  moduleConfirmationSummary?: string
  moduleConfirmationSourceFiles?: string[]
  moduleConfirmationFixtureTargets?: string[]
  fixtureIDs?: string[]
  nativeEvidenceRefs?: string[]
  knownLossiness?: string[]
}

type BuilderFlowNode = {
  id?: string
  metrics?: {
    implementationLevels?: string[]
    moduleConfirmationStatuses?: string[]
    moduleConfirmationSourceFiles?: string[]
    moduleConfirmationFixtureTargets?: string[]
  }
}

type BuilderFlowBlueprint = {
  product: string
  nodes: BuilderFlowNode[]
}

type BuilderData = {
  presets: BuilderPreset[]
  atoms: BuilderAtom[]
  flowBlueprints: BuilderFlowBlueprint[]
  moduleConfirmation: {
    fingerprint: string
    byModuleConfirmationStatus: Record<string, number | undefined>
  } | null
}

const PRODUCT_PRESETS = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const

describe("TODO29 Builder/BOM/Flow visibility", () => {
  it("keeps partial and guard module confirmation visible instead of presenting native parity", () => {
    const data = buildDocsSite({ cwd: process.cwd(), generatedAt: "2026-06-12T00:00:00.000Z" })
    const builderData = buildHarnessBuilderData(data) as BuilderData
    const html = writeAndReadBuilderHTML()

    expect(collectBuilderFlowVisibilityIssues(builderData, html)).toEqual([])
  }, 30000)

  it("flags Builder or Flow surfaces that hide partial or guard module confirmation", () => {
    const data = buildDocsSite({ cwd: process.cwd(), generatedAt: "2026-06-12T00:00:00.000Z" })
    const builderData = cloneBuilderData(buildHarnessBuilderData(data) as BuilderData)
    const opencodePreset = builderData.presets.find((preset) => preset.id === "opencode")
    const shellAtom = builderData.atoms.find((atom) => atom.id === "opencode.product-shell.web")
    const contextNode = builderData.flowBlueprints.find((blueprint) => blueprint.product === "opencode")?.nodes.find((node) => node.id === "context.build")
    expect(opencodePreset).toBeDefined()
    expect(shellAtom).toBeDefined()
    expect(contextNode).toBeDefined()
    if (opencodePreset === undefined || shellAtom === undefined || contextNode === undefined) throw new Error("missing representative Builder/Flow visibility target")

    opencodePreset.nativeParityVerified = true
    opencodePreset.nativeParitySummary = "native parity complete"
    shellAtom.implementationLevel = "native"
    shellAtom.moduleConfirmationStatus = "no-open-divergence"
    shellAtom.moduleConfirmationFixtureTargets = []
    contextNode.metrics = {
      ...contextNode.metrics,
      moduleConfirmationStatuses: ["no-open-divergence"],
      moduleConfirmationFixtureTargets: [],
    }

    expect(collectBuilderFlowVisibilityIssues(builderData, "<html></html>")).toEqual(
      expect.arrayContaining([
        expect.stringContaining("opencode preset is marked nativeParityVerified"),
        expect.stringContaining("opencode preset nativeParitySummary claims native parity"),
        expect.stringContaining("opencode.product-shell.web hides demotion guard status"),
        expect.stringContaining("opencode.product-shell.web missing metadata.executable-blocker fixture target"),
        expect.stringContaining("opencode context.build missing demotion-guard-confirmed module confirmation"),
        expect.stringContaining("opencode context.build missing metadata.executable-blocker fixture target"),
        expect.stringContaining("rendered Builder HTML missing module confirmation data attribute"),
      ]),
    )
  })
})

function cloneBuilderData(builderData: BuilderData): BuilderData {
  return JSON.parse(JSON.stringify(builderData)) as BuilderData
}

function writeAndReadBuilderHTML(): string {
  const outDir = mkdtempSync(join(tmpdir(), "todo29-builder-flow-"))
  try {
    const outputPath = join(outDir, "index.html")
    const builderPath = join(outDir, "harness-builder.html")
    writeDocsSite({ cwd: process.cwd(), outDir, generatedAt: "2026-06-12T00:00:00.000Z" })
    readFileSync(outputPath, "utf8")
    return readFileSync(builderPath, "utf8")
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
}

function collectBuilderFlowVisibilityIssues(builderData: BuilderData, html: string): string[] {
  const issues: string[] = []
  const confirmation = builderData.moduleConfirmation
  if (!confirmation) {
    issues.push("Builder module confirmation index is missing")
  } else {
    expectCount("moduleConfirmation semantic count", confirmation.byModuleConfirmationStatus["semantic-fixture-needs-exact-diff"], 0, issues)
    expectCount("moduleConfirmation demotion guard count", confirmation.byModuleConfirmationStatus["demotion-guard-confirmed"], 153, issues)
    expectCount("moduleConfirmation no-open-divergence count", confirmation.byModuleConfirmationStatus["no-open-divergence"], 15, issues)
    expectCount("moduleConfirmation exact-diff-missing count", confirmation.byModuleConfirmationStatus["upstream-divergent-exact-diff-missing"], 0, issues)
  }

  for (const product of PRODUCT_PRESETS) {
    const preset = builderData.presets.find((candidate) => candidate.id === product)
    if (!preset) {
      issues.push(`${product} preset is missing`)
      continue
    }
    if (preset.nativeParityVerified) issues.push(`${product} preset is marked nativeParityVerified`)
    if (claimsNativeParity(preset.nativeParitySummary)) issues.push(`${product} preset nativeParitySummary claims native parity`)
  }

  expectRepresentativeAtom(builderData, "opencode.turn.context-builder", "demotion-guard-confirmed", "metadata.executable-blocker", issues)
  expectRepresentativeAtom(builderData, "hermes.prompt.agent-builder", "demotion-guard-confirmed", "metadata.executable-blocker", issues)
  expectRepresentativeAtom(builderData, "opencode.runtime.acceptance-controller.native-like", "demotion-guard-confirmed", "metadata.executable-blocker", issues)
  expectRepresentativeAtom(builderData, "opencode.product-shell.web", "demotion-guard-confirmed", "metadata.executable-blocker", issues)

  for (const atom of builderData.atoms) {
    if (!atom.moduleConfirmationStatus) continue
    if (["semantic-fixture-needs-exact-diff", "demotion-guard-confirmed"].includes(atom.moduleConfirmationStatus)) {
      if (atom.implementationLevel === "native" && !hasNativeExactProof(atom)) issues.push(`${atom.id} is native while TODO29 has no native exact fixture`)
      if ((atom.moduleConfirmationFixtureTargets ?? []).length === 0) issues.push(`${atom.id} missing module confirmation fixture targets`)
      if (claimsNativeParity(atom.moduleConfirmationSummary ?? "")) issues.push(`${atom.id} moduleConfirmationSummary claims native parity`)
    }
  }

  expectFlowStage(builderData, "opencode", "context.build", "demotion-guard-confirmed", "metadata.executable-blocker", issues)
  expectFlowStage(builderData, "opencode", "prompt.assemble", "demotion-guard-confirmed", "metadata.executable-blocker", issues)
  expectFlowStage(builderData, "opencode", "acceptance.check", "demotion-guard-confirmed", "metadata.executable-blocker", issues)

  if (!html.includes("data-builder-module-confirmation")) issues.push("rendered Builder HTML missing module confirmation data attribute")
  if (!html.includes("Demotion guard")) issues.push("rendered Builder HTML missing demotion guard label")

  return issues
}

function expectRepresentativeAtom(builderData: BuilderData, atomID: string, expectedStatus: string, expectedFixtureTarget: string, issues: string[]): void {
  const atom = builderData.atoms.find((candidate) => candidate.id === atomID)
  if (!atom) {
    issues.push(`${atomID} atom is missing`)
    return
  }
  if (atom.moduleConfirmationStatus !== expectedStatus) {
    const hiddenStatus = expectedStatus === "demotion-guard-confirmed" ? "hides demotion guard status" : `missing ${expectedStatus}`
    issues.push(`${atomID} ${hiddenStatus}`)
  }
  if (!(atom.moduleConfirmationFixtureTargets ?? []).includes(expectedFixtureTarget)) {
    issues.push(`${atomID} missing ${expectedFixtureTarget} fixture target`)
  }
  if (atom.implementationLevel === "native" && !hasNativeExactProof(atom)) issues.push(`${atomID} is native while TODO29 has no native exact fixture`)
}

function expectFlowStage(builderData: BuilderData, product: string, stageID: string, expectedStatus: string, expectedFixtureTarget: string, issues: string[]): void {
  const stage = builderData.flowBlueprints.find((blueprint) => blueprint.product === product)?.nodes.find((node) => node.id === stageID)
  if (!stage) {
    issues.push(`${product} ${stageID} stage is missing`)
    return
  }
  if (!(stage.metrics?.moduleConfirmationStatuses ?? []).includes(expectedStatus)) {
    issues.push(`${product} ${stageID} missing ${expectedStatus} module confirmation`)
  }
  if (!(stage.metrics?.moduleConfirmationFixtureTargets ?? []).includes(expectedFixtureTarget)) {
    issues.push(`${product} ${stageID} missing ${expectedFixtureTarget} fixture target`)
  }
}

function expectCount(label: string, actual: number | undefined, expected: number, issues: string[]): void {
  if (actual !== expected) issues.push(`${label} expected ${expected}, found ${actual ?? "<missing>"}`)
}

function claimsNativeParity(value: string): boolean {
  return /native parity complete|native complete|product-native parity complete/i.test(value)
}

function hasNativeExactProof(atom: BuilderAtom): boolean {
  const refs = [...(atom.fixtureIDs ?? []), ...(atom.nativeEvidenceRefs ?? [])]
  if (refs.some((ref) => /(?:native-)?exact(?::|-fixture)/.test(ref))) return true
  return (
    atom.id === "opencode.task.runner.native-cli" &&
    (atom.knownLossiness ?? []).length === 0 &&
    refs.some((ref) => ref.includes("task-parity-live") && ref.includes(":native-cli")) &&
    refs.some((ref) => ref === "upstream:npm:opencode-ai@1.15.11:bin/opencode.exe")
  )
}
