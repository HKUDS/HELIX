import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { buildHarnessBuilderSlots, type HarnessBuilderSlot } from "./builder-slots.ts"
import {
  assembleHermesAgentHarness,
  assembleOpenCodeHarness,
  assembleNanobotHarness,
  assemblePiMonoHarness,
  allRecipeInventoryBlocks,
  auditSourceBoundaries,
  auditNanobotLegoDepth,
  auditLegoBlockLedger,
  auditPersonalityInventory,
  auditRecipeLevelPipelineSwaps,
  buildAssemblyContract,
  buildAssembledFlowBlueprint,
  buildCanonicalFlowCatalog,
  executablePortRuleCatalog,
  buildRecipeTargetShapeReport,
  codingAgentMinimalRecipe,
  compileRecipe,
  defaultLegoBundleCatalog,
  diffRecipes,
  hermesAgentRecipe,
  inferBundleMatches,
  nanobotRecipe,
  opencodeRecipe,
  piMonoRecipe,
  readAssemblyContract,
  routeForAtomBlock,
  swapRecipes,
  verifyAssemblyContract,
  type AssemblyAtomImplementationKind,
  type AssemblyContract,
  type AssemblyContractPlane,
  type AssemblyContractProduct,
  type CompiledRecipe,
  type CompiledRecipeModule,
  type BoundaryLintReport,
  type ExecutableImplementationLevel,
  type HarnessFlowBridgeLayerSummary,
  type HarnessFlowStageCatalog,
  type HarnessFlowGraph,
  type HarnessFlowLiveProviderSummary,
  type HarnessFlowModuleClaim,
  type LegoBlockLedgerReport,
  type PersonalityInventoryReport,
  type ProductTaskParityArtifact,
  type ProductTaskNativeCadenceFixtureSummaryV2,
  type TaskParityAttachmentManifestV2,
  type NanobotLegoDepthReport,
  type RecipeLevelPipelineSwapReport,
  type RecipeTargetShapeReport,
  type RecipeDiff,
  type CurrentModulePlaceholderAudit,
  type CurrentModuleSourceModuleConfirmationStatus,
} from "@helix/recipes"
import { listExternalToolProfiles, verifyNativeCaptureArtifact, type NativeCaptureArtifact } from "@helix/external-tools"

export interface TodoSectionStats {
  title: string
  total: number
  complete: number
  open: number
}

export interface TodoStats {
  total: number
  complete: number
  open: number
  completionPercent: number
  openItems: string[]
  sections: TodoSectionStats[]
}

export interface DocsSiteData {
  generatedAt: string
  todo: TodoStats
  recipes: {
    opencode: CompiledRecipe
    piMono: CompiledRecipe
    nanobot: CompiledRecipe
    hermesAgent: CompiledRecipe
    minimal: CompiledRecipe
    swaps: CompiledRecipe[]
  }
  diff: RecipeDiff
  boundaries: BoundaryLintReport
  ledger: LegoBlockLedgerReport
  personalities: PersonalityInventoryReport
  targetShapes: RecipeTargetShapeReport
  pipelineSwaps: RecipeLevelPipelineSwapReport
  taskParity: ProductTaskParityArtifact | null
  nativeFixtureSummary: HarnessNativeFixtureSummaryIndex | null
  liveProviderSummary: HarnessFlowLiveProviderSummary | null
  currentModuleAudit: CurrentModulePlaceholderAudit | null
  nanobotDepth: NanobotLegoDepthReport
  assemblyContracts: AssemblyContract[]
  externalTools: HarnessExternalToolSummary
}

interface PackageAtomRow {
  id: string
  provides: Set<string>
  variants: Set<string>
  personalities: Set<string>
  recipes: Set<string>
}

interface PackageAtomGroup {
  packageName: string
  atoms: PackageAtomRow[]
}

export interface HarnessBuilderAtom {
  id: string
  plane: string
  kind: string
  scope: string
  productScope: string
  stability: string
  implementationKind: HarnessBuilderImplementationKind
  provides: string[]
  consumes: string[]
  replaceablePorts: string[]
  sourcePackage?: string
  publicExport?: string
  selectionReason: string
  implementationLevel: HarnessBuilderImplementationLevel
  implementationLabel: string
  implementationSummary: string
  nativeEvidenceRefs: string[]
  upstreamVersion?: string
  upstreamCommit?: string
  fixtureIDs: string[]
  parityCoverage: string
  knownLossiness: string[]
  moduleConfirmationStatus?: CurrentModuleSourceModuleConfirmationStatus
  moduleConfirmationSummary?: string
  moduleConfirmationSourceFiles: string[]
  moduleConfirmationSourceOwners: string[]
  moduleConfirmationFixtureTargets: string[]
  moduleConfirmationItemIDs: string[]
  selectedIn: string[]
  bundleIDs: string[]
}

export type HarnessBuilderImplementationLevel =
  | "native"
  | "native-like"
  | "profile-compatible"
  | "compatible-bridge"
  | "preview-shell"
  | "metadata-only"
  | "common-shared"
export type HarnessBuilderImplementationKind = AssemblyAtomImplementationKind
export type HarnessBuilderPresetAssemblyClaim =
  | "upstream-parity-target"
  | "product-profile-runnable"
  | "native-parity-verified"
  | "helix-minimal"
  | "mixed-compatible-runnable"
export type HarnessBuilderCompositionClaim = "upstream-parity-target" | "custom-composition" | "experimental-hybrid" | "helix-minimal"
export type HarnessBuilderEvidencePolicy = "native-proof-required" | "compatibility-bridge-visible" | "no-native-claim"

export interface HarnessBuilderParityTarget {
  id: string
  product: string
  repo: string
  ref: string
  packageVersion?: string
  requiredPlanes: string[]
  fixtureMatrix: string[]
}

export type HarnessBuilderParityCompatibility = "satisfied" | "partial" | "blocked" | "not-targeted"

export interface HarnessBuilderModuleClaim {
  level: HarnessBuilderImplementationLevel
  label: string
  sourceProduct: string
  sourceScope: string
  parityTargetProduct?: string
  parityTargetRef?: string
  portCompatible: boolean
  behaviorCompatible: boolean
  parityCompatible: HarnessBuilderParityCompatibility
  parityTargetSatisfied: boolean
  evidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  blockers: string[]
  summary: string
}

interface HarnessBuilderImplementationProfile {
  level: HarnessBuilderImplementationLevel
  label: string
  summary: string
}

export interface HarnessBuilderImplementationStateSummary {
  level: HarnessBuilderImplementationLevel
  label: string
  count: number
  selectedCount: number
  evidenceCount: number
  lossinessCount: number
  exampleAtomIDs: string[]
}

export interface HarnessBuilderModuleConfirmationAtom {
  atomID: string
  moduleConfirmationStatus: CurrentModuleSourceModuleConfirmationStatus
  moduleConfirmationSummary: string
  currentSourceFiles: string[]
  sourceOwners: string[]
  fixtureDiffTargets: string[]
  itemIDs: string[]
  products: string[]
  ownerTODOs: string[]
  exactDiffMissing: number
  exactDiffPartial: number
  demotionGuardOnly: number
  manualCheckPending: number
}

export interface HarnessBuilderModuleConfirmationSourceFile {
  currentSourceFile: string
  sourceOwnerPackagePath: string
  sourceOwnerPackageCatalogStatus: string
  moduleConfirmationStatus: CurrentModuleSourceModuleConfirmationStatus
  moduleConfirmationSummary: string
  exactDiffMissing: number
  exactDiffPartial: number
  demotionGuardOnly: number
  manualCheckPending: number
  fixtureDiffTargets: string[]
  itemIDs: string[]
}

export interface HarnessBuilderModuleConfirmationSourceOwner {
  sourceOwnerPackagePath: string
  sourceOwnerPackageCatalogStatus: string
  moduleConfirmationStatus: CurrentModuleSourceModuleConfirmationStatus
  moduleConfirmationSummary: string
  queueItems: number
  itemCount: number
  currentSourceFileCount: number
  fixtureDiffTargets: string[]
  sampleCurrentSourceFiles: string[]
}

export interface HarnessBuilderModuleConfirmationIndex {
  artifactKind: "current-module-confirmation-index"
  artifactPath: string
  generatedAt: string
  fingerprint: string
  totalItems: number
  currentSourceFileSummaryItems: number
  sourceOwnerLineLevelSummaryItems: number
  byModuleConfirmationStatus: Record<CurrentModuleSourceModuleConfirmationStatus, number>
  atomConfirmations: HarnessBuilderModuleConfirmationAtom[]
  currentSourceFiles: HarnessBuilderModuleConfirmationSourceFile[]
  sourceOwners: HarnessBuilderModuleConfirmationSourceOwner[]
}

export interface HarnessBuilderExecutablePortRule {
  portID: string
  executableRequired: boolean
  ruleID: string
  plane: string
  reason: string
}

export interface HarnessBuilderPort {
  id: string
  plane: string
  multiplicity: string
  requiredIn: string[]
  selectedByProduct: Record<string, string>
  candidates: string[]
  bundleCandidates: string[]
  conformance: string[]
  safety: string
}

export interface HarnessBuilderBundle {
  id: string
  label: string
  description: string
  plane: string
  kind: string
  productScope: string
  atoms: string[]
  ports: string[]
  optionalAtomIDs: string[]
  dependsOnBundles: string[]
  exclusiveFamilyID?: string
  exclusiveFamilyLabel?: string
  exclusiveFamilyPolicy?: "replace" | "warn" | "allow-many"
  exclusiveFamilyPorts?: string[]
  selectedIn: string[]
  sourcePackage: string
  sourceEvidence: string
}

export interface HarnessBuilderBundleState {
  id: string
  status: "selected" | "customized" | "partial"
  selectionSource: "recipe" | "inferred"
  atoms: string[]
  selectedAtoms: string[]
  missingAtoms: string[]
  removedAtoms: string[]
  replacedAtoms: Array<{ from: string; to: string }>
}

export interface HarnessBuilderRecipe {
  id: string
  version: string
  modules: Array<{ id: string }>
  atoms: Array<{ id: string }>
  productShells: Array<{ id: string }>
  bundles?: Array<{ id: string; removedAtoms?: string[]; replacedAtoms?: Record<string, string> }>
  bindings: Array<{ port: string; module: string }>
  requiredCapabilities: string[]
  personalities: string[]
  entrypoints: Record<string, string>
  metadata: Record<string, unknown>
}

export interface HarnessBuilderPreset {
  id: string
  label: string
  product: string
  recipeID: string
  fingerprint: string
  compileStatus: "passed" | "failed"
  compileDiagnostics: string[]
  assemblyClaim: HarnessBuilderPresetAssemblyClaim
  assemblyClaimLabel: string
  compositionClaim: HarnessBuilderCompositionClaim
  parityTargets: HarnessBuilderParityTarget[]
  parityTargetSatisfied: boolean
  parityTargetSummary: string
  evidencePolicy: HarnessBuilderEvidencePolicy
  nativeParityVerified: boolean
  nativeParitySummary: string
  atoms: string[]
  requiredPorts: string[]
  surfaces: Array<{ id: string; type: string; atomID: string }>
  bundles: string[]
  bundleStates: HarnessBuilderBundleState[]
  bindings: Array<{ portID: string; providerAtomID: string; consumerAtomID: string; why: string; canSwapWith: string[]; moduleClaim: HarnessBuilderModuleClaim }>
  recipe: HarnessBuilderRecipe
}

export interface HarnessNativeFixtureSummaryIndex {
  artifactKind: "native-cadence-fixture-summary"
  summaryPath: string
  manifestPath: string
  generatedAt: string
  sourceArtifact: ProductTaskNativeCadenceFixtureSummaryV2["sourceArtifact"]
  fixtureCount: number
  manifestAttachmentCount: number
  attachmentPolicy: "lazy-fetch-by-attachment-path"
  fixtures: Array<{
    product: string
    taskID: string
    nativeVersion: string
    cadenceLevel: string
    providerRequests: number
    messagePartTypes: string[]
    projectionLosses: number
    attachmentPath: string
    sha256: string
    byteSize: number
    redactionStatus: string
    required: boolean
    verifierCoverage: string[]
  }>
}

export interface HarnessExternalToolSummary {
  tools: Array<{
    id: string
    label: string
    repository: string
    installHints: string[]
    installStatus: "not-checked" | "installed" | "missing"
    detectedVersion?: string
    doctorMessage?: string
    defaultStrategy: string
    command: string
    supportedProducts: string[]
    unsupportedProducts: string[]
    unsupportedGaps: Array<{
      product: string
      status: string
      reason: string
      nextAction: string
    }>
    supportedArtifactFormats: string[]
    supportedCaptureModes: string[]
    lossinessNotes: string[]
    lastImportedArtifact?: HarnessExternalToolArtifactSummary
    lastVerifierResult?: HarnessExternalToolVerifierSummary
  }>
}

export interface HarnessExternalToolArtifactSummary {
  artifactPath: string
  generatedAt: string
  product: string
  taskID: string
  captureMode: string
  sourceToolVersion: string
  sourceArtifactHash: string
  sourceArtifactBytes: number
  providerRequests: number
  storage: "published" | "local-only"
  containsRawPrompt: boolean
  localOnly: boolean
}

export interface HarnessExternalToolVerifierSummary {
  ok: boolean
  checks: number
  issues: string[]
  localOnly: boolean
  status: "publishable" | "local-only" | "missing"
}

export interface HarnessBuilderData {
  generatedAt: string
  presets: HarnessBuilderPreset[]
  atoms: HarnessBuilderAtom[]
  ports: HarnessBuilderPort[]
  bundles: HarnessBuilderBundle[]
  implementationStates: HarnessBuilderImplementationStateSummary[]
  moduleConfirmation: HarnessBuilderModuleConfirmationIndex | null
  flowBlueprints: HarnessFlowGraph[]
  flowCatalogs: HarnessFlowStageCatalog[]
  flowTasks: Array<{ id: string; products: string[] }>
  executablePortRules: HarnessBuilderExecutablePortRule[]
  nativeFixtureSummary: HarnessNativeFixtureSummaryIndex | null
  liveProviderSummary: HarnessFlowLiveProviderSummary | null
  slots: HarnessBuilderSlot[]
  planes: string[]
  scopes: string[]
  commandTemplates: string[]
}

export interface HarnessBuilderRenderOptions {
  dataSource?: "inline" | "api"
  builderData?: HarnessBuilderData
  builderDataUrl?: string
  recipeDraftsUrl?: string
  harnessRunsUrl?: string
  harnessRunDefaultsUrl?: string
  harnessImpactUrl?: string
  harnessProfilesUrl?: string
  harnessTuiSessionsUrl?: string
  harnessFlowUrl?: string
}

export interface BuildDocsSiteInput {
  cwd?: string
  generatedAt?: string
}

export interface WriteDocsSiteInput extends BuildDocsSiteInput {
  outDir?: string
}

export function buildDocsSite(input: BuildDocsSiteInput = {}): DocsSiteData {
  const cwd = input.cwd ?? process.cwd()
  const taskParity = readTaskParityArtifact(cwd)
  const nativeFixtureSummary = readNativeFixtureSummaryIndex(cwd)
  const liveProviderSummary = readLiveProviderSummaryIndex(cwd)
  const currentModuleAudit = readCurrentModulePlaceholderAudit(cwd)
  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    todo: readTodoStats(cwd),
    recipes: {
      opencode: compileRecipe(opencodeRecipe),
      piMono: compileRecipe(piMonoRecipe),
      nanobot: compileRecipe(nanobotRecipe),
      hermesAgent: compileRecipe(hermesAgentRecipe),
      minimal: compileRecipe(codingAgentMinimalRecipe),
      swaps: Object.values(swapRecipes).map((recipe) => compileRecipe(recipe)),
    },
    diff: diffRecipes(opencodeRecipe, piMonoRecipe),
    boundaries: auditSourceBoundaries({ cwd }),
    ledger: auditLegoBlockLedger({ cwd }),
    personalities: auditPersonalityInventory(),
    targetShapes: buildRecipeTargetShapeReport(),
    pipelineSwaps: auditRecipeLevelPipelineSwaps(),
    taskParity,
    nativeFixtureSummary,
    liveProviderSummary,
    currentModuleAudit,
    nanobotDepth: auditNanobotLegoDepth({
      cwd,
      ...(input.generatedAt ? { generatedAt: new Date(input.generatedAt) } : {}),
    }),
    assemblyContracts: readAssemblyContracts(cwd, taskParity),
    externalTools: buildExternalToolSummary(cwd),
  }
}

export function writeDocsSite(input: WriteDocsSiteInput = {}): string {
  const cwd = input.cwd ?? process.cwd()
  const outputDir = resolve(cwd, input.outDir ?? "docs/site")
  mkdirSync(outputDir, { recursive: true })

  const data = buildDocsSite(input)
  const outputPath = join(outputDir, "index.html")
  writeFileSync(outputPath, renderDocsSite(data), "utf8")
  writeHarnessBuilder(outputDir, data)
  writeOpenCodeSurfaces(outputDir, cwd)
  writePiSurfaces(outputDir, cwd)
  writeNanobotSurfaces(outputDir, cwd)
  writeHermesSurfaces(outputDir, cwd)
  return outputPath
}

export function renderDocsSite(data: DocsSiteData): string {
  const allRecipes = [data.recipes.opencode, data.recipes.piMono, data.recipes.nanobot, data.recipes.hermesAgent, data.recipes.minimal, ...data.recipes.swaps]
  const packageAtomGroups = packageAtomGroupsFor(allRecipes)
  const totalModules = new Set(allRecipes.flatMap((recipe) => recipe.modules.map((module) => module.id))).size
  const todoPercent = `${data.todo.completionPercent}%`
  const generated = new Date(data.generatedAt).toISOString()

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Helix Assembly Console</title>
  <style>
    :root {
      color-scheme: light;
      --paper: #f5f6f4;
      --surface: #ffffff;
      --ink: #161616;
      --muted: #60645f;
      --line: #d7dbd4;
      --line-strong: #1f241f;
      --teal: #006b5f;
      --teal-soft: #d8eee8;
      --rust: #a9431e;
      --rust-soft: #f0ded6;
      --blue: #315f9f;
      --blue-soft: #dce7f6;
      --yellow: #d8a400;
      --yellow-soft: #fbf0bc;
      --red: #b3261e;
      --red-soft: #f6d7d4;
      --shadow: 0 16px 34px rgb(20 24 20 / 0.08);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background:
        linear-gradient(90deg, rgb(22 22 22 / 0.035) 1px, transparent 1px),
        linear-gradient(0deg, rgb(22 22 22 / 0.035) 1px, transparent 1px),
        var(--paper);
      background-size: 28px 28px;
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }

    .shell {
      min-height: 100vh;
    }

    .bar {
      border-bottom: 2px solid var(--line-strong);
      background: var(--surface);
    }

    .bar-inner,
    .band-inner {
      width: min(1180px, calc(100vw - 32px));
      margin: 0 auto;
    }

    .bar-inner {
      min-height: 72px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      align-items: center;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      font-size: clamp(1.55rem, 3vw, 2.65rem);
      line-height: 1.05;
      letter-spacing: 0;
    }

    h2 {
      font-size: 1rem;
      line-height: 1.2;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    h3 {
      font-size: 0.95rem;
      letter-spacing: 0;
    }

    .stamp {
      display: inline-flex;
      min-height: 34px;
      align-items: center;
      border: 2px solid var(--line-strong);
      padding: 4px 10px;
      background: var(--yellow-soft);
      font: 700 0.78rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      white-space: nowrap;
    }

    .bar-actions {
      display: flex;
      align-items: center;
      justify-content: end;
      gap: 10px;
      flex-wrap: wrap;
    }

    .builder-link {
      display: inline-flex;
      min-height: 38px;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 2px solid var(--line-strong);
      padding: 6px 12px;
      background: var(--teal);
      color: #fff;
      box-shadow: 4px 4px 0 var(--line-strong);
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0;
      text-decoration: none;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .builder-link::after {
      content: "->";
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-weight: 900;
    }

    .builder-link:hover {
      background: var(--blue);
      transform: translate(-1px, -1px);
      box-shadow: 5px 5px 0 var(--line-strong);
    }

    .band {
      border-bottom: 1px solid var(--line);
      background: rgb(255 255 255 / 0.72);
    }

    .band-inner {
      padding: 26px 0;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .metric {
      min-height: 104px;
      border: 2px solid var(--line-strong);
      background: var(--surface);
      padding: 14px;
      box-shadow: var(--shadow);
    }

    .metric strong {
      display: block;
      font-size: 2rem;
      line-height: 1;
      letter-spacing: 0;
    }

    .metric span {
      display: block;
      margin-top: 9px;
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
      gap: 18px;
      align-items: start;
    }

    .panel {
      border-top: 2px solid var(--line-strong);
      background: rgb(255 255 255 / 0.82);
      padding-top: 14px;
    }

    .panel + .panel {
      margin-top: 22px;
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: baseline;
      margin-bottom: 14px;
    }

    .panel-head p {
      color: var(--muted);
      font-size: 0.9rem;
    }

    .recipe-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .recipe {
      border: 2px solid var(--line-strong);
      background: var(--surface);
      min-width: 0;
    }

    .recipe-title {
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 2px solid var(--line-strong);
      padding: 10px 12px;
    }

    .recipe-title[data-kind="opencode"] {
      background: var(--teal-soft);
    }

    .recipe-title[data-kind="pi-mono"] {
      background: var(--rust-soft);
    }

    .recipe-title[data-kind="nanobot"] {
      background: var(--blue-soft);
    }

    .recipe-title[data-kind="hermes-agent"] {
      background: var(--yellow-soft);
    }

    .recipe-title code,
    .chip,
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .module-list {
      display: grid;
      gap: 8px;
      padding: 12px;
    }

    .module {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      min-height: 48px;
      border: 1px solid var(--line);
      border-left: 8px solid var(--teal);
      padding: 8px 10px;
      background: #fbfbfa;
    }

    .module[data-personality="opencode"] {
      border-left-color: var(--teal);
    }

    .module[data-personality="pi-mono"] {
      border-left-color: var(--rust);
    }

    .module[data-personality="nanobot"] {
      border-left-color: var(--blue);
    }

    .module[data-personality="hermes-agent"] {
      border-left-color: var(--yellow);
    }

    .module[data-personality="common"] {
      border-left-color: var(--yellow);
    }

    .module-name {
      min-width: 0;
      overflow-wrap: anywhere;
      font-weight: 800;
    }

	    .module-meta {
	      color: var(--muted);
	      font-size: 0.78rem;
	      overflow-wrap: anywhere;
	    }

	    .package-grid {
	      display: grid;
	      grid-template-columns: repeat(2, minmax(0, 1fr));
	      gap: 14px;
	    }

	    .package-card {
	      border: 2px solid var(--line-strong);
	      background: var(--surface);
	      min-width: 0;
	    }

	    .package-head {
	      min-height: 46px;
	      display: grid;
	      grid-template-columns: minmax(0, 1fr) auto;
	      align-items: center;
	      gap: 10px;
	      border-bottom: 2px solid var(--line-strong);
	      padding: 10px 12px;
	      background: #e9ece7;
	    }

	    .package-head h3 {
	      min-width: 0;
	      overflow-wrap: anywhere;
	    }

	    .package-atoms {
	      display: grid;
	      gap: 8px;
	      padding: 12px;
	    }

	    .package-atom {
	      min-height: 54px;
	      display: grid;
	      grid-template-columns: minmax(0, 1fr) auto;
	      gap: 10px;
	      align-items: center;
	      border: 1px solid var(--line);
	      border-left: 8px solid var(--yellow);
	      padding: 8px 10px;
	      background: #fbfbfa;
	    }

	    .package-atom[data-personality="opencode"] {
	      border-left-color: var(--teal);
	    }

	    .package-atom[data-personality="pi-mono"] {
	      border-left-color: var(--rust);
	    }

	    .package-atom[data-personality="nanobot"] {
	      border-left-color: var(--blue);
	    }

	    .package-atom[data-personality="hermes-agent"] {
	      border-left-color: var(--yellow);
	    }

	    .package-atom-name {
	      min-width: 0;
	      overflow-wrap: anywhere;
	      font-weight: 800;
	    }

    .chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      border: 1px solid var(--line-strong);
      padding: 2px 7px;
      background: var(--surface);
      color: var(--ink);
      font-size: 0.72rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .graph {
      display: grid;
      gap: 10px;
    }

    .graph-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 42px minmax(0, 1fr);
      min-height: 48px;
      align-items: center;
      gap: 8px;
    }

    .graph-cell {
      border: 1px solid var(--line);
      background: var(--surface);
      padding: 9px 10px;
      min-width: 0;
      overflow-wrap: anywhere;
      font-size: 0.84rem;
      font-weight: 750;
    }

    .graph-cell.left {
      border-left: 8px solid var(--teal);
    }

    .graph-cell.right {
      border-left: 8px solid var(--rust);
    }

    .connector {
      height: 2px;
      background: var(--line-strong);
      position: relative;
    }

    .connector::before,
    .connector::after {
      content: "";
      position: absolute;
      top: -4px;
      width: 10px;
      height: 10px;
      border: 2px solid var(--line-strong);
      background: var(--yellow-soft);
    }

    .connector::before {
      left: -3px;
    }

    .connector::after {
      right: -3px;
    }

    .todo-progress {
      display: grid;
      gap: 10px;
    }

    .progress-track {
      height: 18px;
      border: 2px solid var(--line-strong);
      background: var(--surface);
    }

    .progress-fill {
      width: ${todoPercent};
      height: 100%;
      background: linear-gradient(90deg, var(--teal), var(--yellow));
    }

    .todo-list {
      display: grid;
      gap: 8px;
      margin-top: 14px;
    }

    .todo-item {
      border-left: 6px solid var(--red);
      background: var(--red-soft);
      padding: 8px 10px;
      font-size: 0.86rem;
      overflow-wrap: anywhere;
    }

    .section-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--surface);
      border: 2px solid var(--line-strong);
    }

    .section-table th,
    .section-table td {
      border-bottom: 1px solid var(--line);
      padding: 8px 10px;
      text-align: left;
      font-size: 0.82rem;
      vertical-align: top;
    }

    .section-table th {
      background: #e9ece7;
      text-transform: uppercase;
      font-size: 0.72rem;
    }

    .section-table td:last-child,
    .section-table th:last-child {
      text-align: right;
      white-space: nowrap;
    }

    .footer {
      color: var(--muted);
      font-size: 0.78rem;
      padding: 18px 0 30px;
    }

    @media (max-width: 900px) {
	      .bar-inner,
	      .layout,
	      .recipe-grid,
	      .package-grid,
	      .metrics {
	        grid-template-columns: 1fr;
	      }

      .bar-inner {
        align-items: start;
        padding: 16px 0;
      }

      .bar-actions {
        justify-content: start;
      }
    }
  </style>
</head>
<body>
  <main class="shell" data-docs-site-version="1">
    <header class="bar">
      <div class="bar-inner">
        <div>
          <h1>Helix Assembly Console</h1>
          <p class="mono">OpenCode + Pi Mono + Nanobot + Hermes Agent lego decomposition</p>
        </div>
        <div class="bar-actions">
          <a class="builder-link" href="./harness-builder.html" aria-label="Open Harness Builder">Open Harness Builder</a>
          <div class="stamp" title="Generated timestamp">${escapeHTML(generated)}</div>
        </div>
      </div>
    </header>

    <section class="band" aria-label="Assembly metrics">
      <div class="band-inner metrics">
        <div class="metric"><strong>${data.recipes.opencode.modules.length}</strong><span>OpenCode modules</span></div>
        <div class="metric"><strong>${data.recipes.piMono.modules.length}</strong><span>Pi Mono modules</span></div>
        <div class="metric"><strong>${data.recipes.nanobot.modules.length}</strong><span>Nanobot modules</span></div>
        <div class="metric"><strong>${data.recipes.hermesAgent.modules.length}</strong><span>Hermes Agent modules</span></div>
        <div class="metric"><strong>${data.recipes.minimal.modules.length}</strong><span>Neutral atoms</span></div>
        <div class="metric"><strong>${totalModules}</strong><span>Unique lego blocks</span></div>
        <div class="metric"><strong>${data.diff.changedBindings.length}</strong><span>Port binding swaps</span></div>
        <div class="metric"><strong>${data.ledger.coverage.catalogedPorts}</strong><span>Cataloged ports</span></div>
        <div class="metric"><strong>${data.ledger.coverage.publicModulesWithRoute}/${data.ledger.coverage.publicModules}</strong><span>Exported blocks</span></div>
        <div class="metric"><strong>${data.personalities.coverage.present}/${data.personalities.coverage.expected}</strong><span>Personality classifications</span></div>
        <div class="metric"><strong>${data.targetShapes.targets.length}/${data.targetShapes.swaps.length}</strong><span>Target recipes / swaps</span></div>
        <div class="metric"><strong>${data.pipelineSwaps.swaps.length}</strong><span>Pipeline strategy swaps</span></div>
        <div class="metric"><strong>${data.boundaries.issues.length}</strong><span>Boundary leaks</span></div>
        <div class="metric"><strong>${data.assemblyContracts.length}</strong><span>Assembly contracts</span></div>
      </div>
    </section>

    <section class="band">
      <div class="band-inner layout">
        <div>
          <section class="panel" aria-labelledby="recipes-title">
            <div class="panel-head">
              <h2 id="recipes-title">Recipes</h2>
              <p>Compiled dependency graphs from <span class="mono">@helix/recipes</span>.</p>
            </div>
            <div class="recipe-grid">
              ${renderRecipe(data.recipes.opencode, "opencode", data.diff)}
              ${renderRecipe(data.recipes.piMono, "pi-mono", data.diff)}
              ${renderRecipe(data.recipes.nanobot, "nanobot", data.diff)}
              ${renderRecipe(data.recipes.hermesAgent, "hermes-agent", data.diff)}
              ${renderRecipe(data.recipes.minimal, "neutral", data.diff)}
            </div>
          </section>

          <section class="panel" aria-labelledby="package-atoms-title">
            <div class="panel-head">
              <h2 id="package-atoms-title">Package Atoms</h2>
              <p>All compiled lego blocks grouped by publishable package lane.</p>
            </div>
            <div class="package-grid">
              ${renderPackageAtomGroups(packageAtomGroups)}
            </div>
          </section>

          <section class="panel" aria-labelledby="ledger-title">
            <div class="panel-head">
              <h2 id="ledger-title">Block Ledger</h2>
              <p>Catalog, fixtures, recipe bindings, package exports, and leakage checks.</p>
            </div>
            ${renderLedgerSummary(data.ledger)}
          </section>

          <section class="panel" aria-labelledby="assembly-contract-title">
            <div class="panel-head">
              <h2 id="assembly-contract-title">Assembly Contracts</h2>
              <p>Machine-readable lego contract, fingerprints, scope classification, and swap points.</p>
            </div>
            ${renderAssemblyContracts(data.assemblyContracts)}
          </section>

          <section class="panel" aria-labelledby="task-parity-title">
            <div class="panel-head">
              <h2 id="task-parity-title">Task Parity</h2>
              <p>Deterministic real-task matrix for assembled and original-contract product paths.</p>
            </div>
            ${renderTaskParity(data.taskParity)}
          </section>

          <section class="panel" aria-labelledby="external-tools-title">
            <div class="panel-head">
              <h2 id="external-tools-title">External Tools</h2>
              <p>Local evidence capture tools stay outside the lego atom catalog and publish normalized artifacts only.</p>
            </div>
            ${renderExternalTools(data.externalTools)}
          </section>

          <section class="panel" aria-labelledby="nanobot-depth-title">
            <div class="panel-head">
              <h2 id="nanobot-depth-title">Nanobot Depth</h2>
              <p>Mechanism-level lego decomposition and upstream-like fixture coverage.</p>
            </div>
            ${renderNanobotDepth(data.nanobotDepth)}
          </section>

          <section class="panel" aria-labelledby="graph-title">
            <div class="panel-head">
              <h2 id="graph-title">Swap Map</h2>
              <p>Common blocks stay locked; personality blocks swap variant pins.</p>
            </div>
            <div class="graph">
              ${renderDiffRows(data.diff)}
            </div>
          </section>

          <section class="panel" aria-labelledby="binding-title">
            <div class="panel-head">
              <h2 id="binding-title">Port Bindings</h2>
              <p>Binding-level diff from compiled recipe lockfiles.</p>
            </div>
            <div class="graph">
              ${renderBindingDiffRows(data.diff)}
            </div>
          </section>

          <section class="panel" aria-labelledby="strategy-title">
            <div class="panel-head">
              <h2 id="strategy-title">Strategies & Policies</h2>
              <p>Recipe-level behavior choices that are not package identities.</p>
            </div>
            <div class="graph">
              ${renderSettingDiffRows("strategy", data.diff.strategyDiffs)}
              ${renderSettingDiffRows("policy", data.diff.policyDiffs)}
            </div>
          </section>
        </div>

        <aside>
          <section class="panel" aria-labelledby="todo-title">
            <div class="panel-head">
              <h2 id="todo-title">TODO Gate</h2>
              <p>${data.todo.complete}/${data.todo.total} checked</p>
            </div>
            <div class="todo-progress">
              <div class="progress-track" aria-label="TODO completion"><div class="progress-fill"></div></div>
              <p><strong>${data.todo.open}</strong> open checklist items remain.</p>
            </div>
            <div class="todo-list">
              ${renderOpenTodoItems(data.todo.openItems)}
            </div>
          </section>

          <section class="panel" aria-labelledby="sections-title">
            <div class="panel-head">
              <h2 id="sections-title">Section Progress</h2>
              <p>Checklist density by TODO section.</p>
            </div>
            ${renderSectionTable(data.todo.sections)}
          </section>

          <section class="panel" aria-labelledby="boundary-title">
            <div class="panel-head">
              <h2 id="boundary-title">Boundary Lint</h2>
              <p>${data.boundaries.issues.length} product-specific leaks</p>
            </div>
            <div class="todo-list">
              ${renderBoundaryRules(data.boundaries)}
            </div>
          </section>
        </aside>
      </div>
    </section>

    <footer class="band-inner footer">
      Online builder served by <span class="mono">npm run docs:dev</span>. Static artifact generated by <span class="mono">npm run docs:site</span> for offline conformance.
      OpenCode Web: <a href="./opencode-web.html">opencode-web.html</a>.
      Harness Builder: <a href="./harness-builder.html">harness-builder.html</a>.
      Pi Web UI: <a href="./pi-web-ui.html">pi-web-ui.html</a>.
      Pi browser smoke: <a href="./pi-browser-smoke.html">pi-browser-smoke.html</a>.
      Nanobot Web UI: <a href="./nanobot-web-ui.html">nanobot-web-ui.html</a>.
      Hermes Dashboard: <a href="./hermes-web-dashboard.html">hermes-web-dashboard.html</a>.
  </footer>
  </main>
  <script>
    (function () {
      if (typeof fetch !== "function") return;
      var root = document.querySelector("[data-external-tools='ready']");
      if (!root) return;
      fetch("/api/external-tools/status", { headers: { "accept": "application/json" } })
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (status) {
          if (!status || !Array.isArray(status.tools)) return;
          status.tools.forEach(function (tool) {
            var row = Array.prototype.slice.call(document.querySelectorAll("[data-external-tool]")).find(function (item) {
              return item.getAttribute("data-external-tool") === tool.id;
            });
            if (!row) return;
            var installStatus = tool.installStatus || (tool.installed ? "installed" : "missing");
            row.setAttribute("data-external-tool-install-status", installStatus);
            row.setAttribute("data-external-tool-detected-version", tool.detectedVersion || "");
            setExternalToolText(tool.id, "install-chip", installStatus);
            setExternalToolText(tool.id, "version-chip", tool.detectedVersion || "version unknown");
            if (tool.doctorMessage) row.setAttribute("data-external-tool-doctor-message", tool.doctorMessage);
          });
        })
        .catch(function () {});

      function setExternalToolText(toolID, suffix, text) {
        var node = document.querySelector("[data-external-tool-" + suffix + "='" + String(toolID).replace(/'/g, "\\\\'") + "']");
        if (node) node.textContent = text;
      }
    })();
  </script>
</body>
</html>`
}

function writeHarnessBuilder(outputDir: string, data: DocsSiteData): string {
  const outputPath = join(outputDir, "harness-builder.html")
  writeFileSync(outputPath, renderHarnessBuilder(data), "utf8")
  return outputPath
}

export function renderHarnessBuilder(data: DocsSiteData, options: HarnessBuilderRenderOptions = {}): string {
  const builderData = options.builderData ?? buildHarnessBuilderData(data)
  const payload =
    options.dataSource === "api"
      ? JSON.stringify({
          __harnessBuilderServer: {
            builderDataUrl: options.builderDataUrl ?? "/api/builder-data",
            recipeDraftsUrl: options.recipeDraftsUrl ?? "/api/recipes/drafts",
            harnessRunsUrl: options.harnessRunsUrl ?? "/api/harness-runs",
            harnessRunDefaultsUrl: options.harnessRunDefaultsUrl ?? "/api/harness-run-defaults",
            harnessImpactUrl: options.harnessImpactUrl ?? "/api/harness-impact/remove",
            harnessProfilesUrl: options.harnessProfilesUrl ?? "/api/harnesses",
            harnessTuiSessionsUrl: options.harnessTuiSessionsUrl ?? "/api/harness-tui-sessions",
            harnessFlowUrl: options.harnessFlowUrl ?? "/api/harness-flow",
          },
        }).replace(/</g, "\\u003c")
      : JSON.stringify(builderData).replace(/</g, "\\u003c")
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Helix Builder</title>
  <script>
    (function () {
      try {
        if (new URLSearchParams(window.location.search || "").get("flowObserver") === "1") {
          document.documentElement.dataset.flowObserverWindow = "true";
        }
      } catch (error) {}
    })();
  </script>
  <style>
    :root {
      color-scheme: light;
      --bench: #e7ecf0;
      --paper: #ffffff;
      --ink: #17191d;
      --muted: #58616a;
      --line: #17191d;
      --soft-line: #bcc5ce;
      --green: #0c695c;
      --green-soft: #cfe7dd;
      --red: #a6422b;
      --red-soft: #edd3c9;
      --blue: #265f9d;
      --blue-soft: #d5e1ef;
      --yellow: #c79716;
      --yellow-soft: #f2e2aa;
      --purple: #69518c;
      --purple-soft: #ded4ec;
      --shadow: 10px 10px 0 rgb(21 17 11 / 0.14);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(90deg, rgb(21 17 11 / 0.045) 1px, transparent 1px),
        linear-gradient(0deg, rgb(21 17 11 / 0.045) 1px, transparent 1px),
        var(--bench);
      background-size: 32px 32px;
      color: var(--ink);
      font-family: "Avenir Next Condensed", "DIN Condensed", "Arial Narrow", ui-sans-serif, sans-serif;
      line-height: 1.35;
    }

    button,
    input,
    select,
    textarea {
      font: inherit;
    }

    button {
      min-height: 34px;
      min-width: 0;
      max-width: 100%;
      border: 2px solid var(--line);
      background: var(--paper);
      color: var(--ink);
      cursor: pointer;
      box-shadow: 3px 3px 0 rgb(21 17 11 / 0.18);
      overflow-wrap: anywhere;
    }

    button:hover,
    button[aria-pressed="true"] {
      transform: translate(-1px, -1px);
      box-shadow: 5px 5px 0 rgb(21 17 11 / 0.2);
    }

    .app {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto 1fr;
    }

    .top {
      border-bottom: 2px solid var(--line);
      background: #f6f8f9;
    }

    .top-inner {
      width: 100%;
      min-height: 72px;
      padding: 8px 10px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 16px;
      align-items: center;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      font-size: clamp(1.6rem, 3.1vw, 3rem);
      letter-spacing: 0;
      line-height: 0.95;
      text-transform: uppercase;
    }

    .sub {
      margin-top: 4px;
      color: var(--muted);
      font: 700 0.78rem/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .top-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }

    .top-actions > *,
    .top-actions button {
      min-width: 0;
    }

    #topCompileButton {
      background: var(--green-soft);
      border-color: var(--green);
      font-weight: 900;
    }

    #topCompileButton[data-builder-compile-status="passed"] {
      background: #101418;
      color: #d8f3e4;
      border-color: #101418;
    }

    #topCompileButton[data-builder-compile-status="failed"] {
      background: var(--red-soft);
      border-color: var(--red);
    }

    #topCompileButton[data-builder-compile-status="stale"] {
      background: var(--yellow-soft);
      border-color: var(--yellow);
    }

    .wizard[hidden] {
      display: none;
    }

    .builder-notice {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 40;
      width: min(420px, calc(100vw - 36px));
      padding: 12px 14px;
      border: 1px solid #101418;
      border-radius: 6px;
      background: #101418;
      color: #fff;
      box-shadow: 5px 5px 0 rgb(21 17 11 / 0.18);
      font: 700 0.8rem/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .builder-notice[data-builder-notice-status="error"] {
      border-color: var(--red);
      background: #6f291d;
    }

    .builder-notice[hidden],
    html[data-flow-observer-window="true"] .builder-notice {
      display: none;
    }

    .wizard {
      position: fixed;
      inset: 0;
      z-index: 30;
      display: grid;
      place-items: center;
      padding: 22px;
      background: rgb(23 25 29 / 0.38);
    }

    .wizard-panel {
      width: min(940px, calc(100vw - 28px));
      max-height: calc(100vh - 44px);
      overflow: auto;
      border: 3px solid var(--line);
      background: rgb(255 253 246 / 0.98);
      box-shadow: var(--shadow);
    }

    .wizard-body {
      display: grid;
      gap: 12px;
      padding: 12px;
    }

    .wizard-steps {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .wizard-step {
      border: 2px solid var(--line);
      background: #fff;
      padding: 8px;
      min-height: 64px;
      box-shadow: 3px 3px 0 var(--line-soft);
    }

    .wizard-step[data-active="true"] {
      background: var(--yellow-soft);
      box-shadow: 3px 3px 0 var(--yellow);
    }

    .wizard-step strong {
      display: block;
      text-transform: uppercase;
      font-size: 0.82rem;
      line-height: 1.15;
    }

    .wizard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
    }

    .wizard-choice {
      min-height: 82px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
      padding: 10px;
      text-align: left;
    }

    .wizard-choice[aria-pressed="true"] {
      background: var(--green-soft);
    }

    .wizard-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px;
      border-top: 3px solid var(--line);
      background: #eef3f6;
    }

    .run-form label {
      display: grid;
      gap: 5px;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 0.78rem;
    }

    .run-form input,
    .run-form select,
    .run-form textarea {
      width: 100%;
      min-height: 38px;
      border: 2px solid var(--line);
      background: var(--paper);
      color: var(--ink);
      padding: 7px 9px;
      border-radius: 0;
      font: 700 0.82rem/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .run-form textarea {
      min-height: 96px;
      resize: vertical;
    }

    .run-result {
      min-height: 92px;
      border: 2px solid var(--soft-line);
      background: var(--paper);
      padding: 10px;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      font: 700 0.78rem/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .run-result[data-builder-live-run-result="ok"] {
      border-color: var(--green);
      background: var(--green-soft);
    }

    .run-result[data-builder-live-run-result="error"] {
      border-color: var(--red);
      background: var(--red-soft);
    }

    .impact-panel {
      width: min(980px, calc(100vw - 28px));
    }

    .impact-preview {
      display: grid;
      gap: 10px;
    }

    .impact-summary {
      border: 3px solid var(--line);
      background: var(--paper);
      padding: 10px;
      overflow-wrap: anywhere;
    }

    .impact-summary[data-severity="ok"] {
      border-color: var(--green);
      background: var(--green-soft);
    }

    .impact-summary[data-severity="warning"] {
      border-color: var(--yellow);
      background: var(--yellow-soft);
    }

    .impact-summary[data-severity="blocked"] {
      border-color: var(--red);
      background: var(--red-soft);
    }

    .impact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 8px;
    }

    .impact-section {
      min-height: 92px;
      border: 2px solid var(--soft-line);
      background: var(--paper);
      padding: 8px;
      overflow-wrap: anywhere;
    }

    .impact-section strong {
      display: block;
      margin-bottom: 4px;
      text-transform: uppercase;
      font-size: 0.78rem;
    }

    .impact-list-mini {
      display: grid;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
      font: 700 0.72rem/1.28 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .layout {
      --right-panel-width: 390px;
      width: calc(100vw - 18px);
      height: calc(100vh - 90px);
      margin: 0 auto;
      padding: 9px 0;
      display: grid;
      grid-template-columns: minmax(280px, 320px) minmax(420px, 1fr) 12px minmax(330px, var(--right-panel-width));
      grid-template-areas: "materials assembly right-resizer audit";
      gap: 9px;
      align-items: stretch;
      min-height: 0;
    }

    .layout[data-builder-phase="start"],
    .layout[data-builder-phase="build"] {
      grid-template-columns: minmax(300px, 340px) minmax(420px, 1fr) 12px minmax(330px, var(--right-panel-width));
    }

    .side-panel {
      grid-area: materials;
    }

    .board-panel {
      grid-area: assembly;
    }

    .right-stack {
      grid-area: audit;
      position: relative;
    }

    .layout-column-resizer {
      grid-area: right-resizer;
      min-width: 12px;
      cursor: col-resize;
      border: 2px solid var(--line);
      background:
        repeating-linear-gradient(
          to bottom,
          rgb(21 17 11 / 0.48) 0 10px,
          transparent 10px 18px
        ),
        var(--yellow-soft);
      box-shadow: inset 2px 0 0 rgb(255 255 255 / 0.55);
      touch-action: none;
    }

    .layout-column-resizer:focus-visible,
    body[data-builder-right-panel-resizing="true"] .layout-column-resizer {
      outline: 3px solid var(--blue);
      outline-offset: -3px;
    }

    .layout[data-builder-phase="start"] .filters,
    .layout[data-builder-phase="start"] .palette,
    .layout[data-builder-phase="start"] .assembly-mode-toggle,
    .layout[data-builder-phase="start"] .board-guide-panel,
    .layout[data-builder-phase="build"] .preset-grid,
    .layout[data-builder-phase="build"] .start-actions {
      display: none;
    }

    .panel {
      border: 2px solid var(--line);
      background: rgb(255 253 246 / 0.94);
      box-shadow: 4px 4px 0 rgb(21 17 11 / 0.10);
      min-width: 0;
    }

    .side-panel,
    .board-panel,
    .assembly-status-panel,
    .audit-panel {
      min-height: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      overflow: hidden;
    }

    .side-panel {
      grid-template-rows: auto auto minmax(0, 1fr);
    }

    .board-panel {
      grid-template-rows: auto auto auto minmax(0, 1fr);
    }

    .assembly-status-panel,
    .audit-panel {
      grid-template-rows: auto auto minmax(0, 1fr);
    }

    .right-stack {
      grid-template-rows: auto minmax(0, 1fr);
    }

    .layout[data-builder-phase="build"] .side-panel {
      grid-template-rows: auto auto minmax(0, 1fr);
    }

    .start-empty-board,
    .start-empty-blueprint {
      min-height: 100%;
      display: grid;
      align-content: center;
      gap: 12px;
      padding: 24px;
      border: 2px dashed var(--line);
      background: #eef4f4;
    }

    .start-empty-board strong,
    .start-empty-blueprint strong {
      font-family: var(--display-font);
      text-transform: uppercase;
      font-size: 1.1rem;
    }

    .panel-head {
      min-height: 42px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-bottom: 2px solid var(--line);
      background: #dce3e8;
    }

    .panel-head h2 {
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .chip {
      min-width: 0;
      max-width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 24px;
      padding: 2px 7px;
      border: 1px solid var(--line);
      background: var(--paper);
      font: 800 0.72rem/1.15 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
      text-align: center;
      white-space: normal;
    }

    .chip[data-builder-server="online"] {
      background: var(--green-soft);
    }

    .chip[data-builder-server="static"] {
      background: var(--yellow-soft);
    }

    .chip[data-builder-implementation-level] {
      border-width: 2px;
      justify-content: flex-start;
      text-align: left;
    }

    .chip[data-builder-implementation-level="native"] {
      background: var(--green-soft);
    }

    .chip[data-builder-implementation-level="native-like"] {
      background: var(--yellow-soft);
    }

    .chip[data-builder-implementation-level="profile-compatible"] {
      background: #e9f3e1;
    }

    .chip[data-builder-implementation-level="compatible-bridge"] {
      background: #fff0e5;
    }

    .chip[data-builder-implementation-level="preview-shell"] {
      background: var(--blue-soft);
    }

    .chip[data-builder-implementation-level="metadata-only"] {
      background: #ededed;
    }

    .chip[data-builder-implementation-level="common-shared"] {
      background: #f7f4dc;
    }

    .preset-grid,
    .start-actions,
    .filters,
    .metrics,
    .port-list,
    .surface-list,
    .detail-body {
      display: grid;
      gap: 8px;
      padding: 12px;
    }

    .preset-grid,
    .palette,
    .board,
    .audit-scroll,
    .port-list,
    .detail-body,
    .command-list {
      min-height: 0;
      overflow: auto;
    }

    .preset-button {
      min-height: 52px;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 8px;
      align-items: center;
      padding: 8px 10px;
      text-align: left;
      border-radius: 0;
    }

    .preset-button > span:first-child,
    .wizard-choice > span:first-child {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .start-actions {
      grid-template-columns: 1fr 1fr;
      border-bottom: 2px solid var(--line);
      background: #eef3f6;
    }

    .start-actions button {
      min-height: 54px;
      font-weight: 900;
    }

    .preset-button[data-product="opencode"] { background: var(--green-soft); }
    .preset-button[data-product="pi-mono"] { background: var(--red-soft); }
    .preset-button[data-product="nanobot"] { background: var(--blue-soft); }
    .preset-button[data-product="hermes-agent"] { background: var(--purple-soft); }
    .preset-button[data-product="minimal"] { background: var(--yellow-soft); }

    .filters {
      border-top: 2px solid var(--line);
      background: #eef3f6;
      align-content: start;
    }

    .assembly-mode-toggle {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      padding: 8px 10px;
      border-bottom: 2px solid var(--line);
      background: #f6f8f0;
    }

    .assembly-mode-toggle button {
      min-height: 32px;
      padding: 6px 8px;
      border-radius: 0;
      box-shadow: none;
      font-size: 0.78rem;
      text-transform: uppercase;
    }

    .assembly-mode-toggle button[aria-pressed="true"] {
      border-color: var(--green);
      background: var(--green-soft);
    }

    .filters input,
    .filters select,
    textarea {
      width: 100%;
      min-height: 36px;
      border: 2px solid var(--line);
      background: var(--paper);
      color: var(--ink);
      padding: 7px 9px;
      border-radius: 0;
    }

    .palette {
      min-height: 0;
      overflow: auto;
      padding: 12px;
      display: grid;
      gap: 8px;
      align-content: start;
    }

    .palette-empty {
      border: 2px dashed var(--line);
      background: rgb(255 255 255 / 0.64);
      padding: 12px;
      color: var(--muted);
      font-size: 0.82rem;
      line-height: 1.35;
    }

    .layout[data-builder-phase="build"] .palette {
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    }

    .atom-tile {
      position: relative;
      min-height: 82px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 34px;
      gap: 10px;
      align-items: center;
      border: 2px solid var(--line);
      border-left-width: 10px;
      background:
        radial-gradient(circle at 18px 12px, rgb(255 255 255 / 0.55) 0 4px, transparent 5px),
        radial-gradient(circle at 42px 12px, rgb(255 255 255 / 0.55) 0 4px, transparent 5px),
        var(--paper);
      padding: 18px 8px 8px 10px;
      cursor: grab;
    }

    .bundle-tile {
      position: relative;
      min-height: 138px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(104px, auto);
      grid-template-rows: minmax(0, 1fr) auto;
      gap: 8px 10px;
      border: 2px solid var(--line);
      border-left: 10px solid var(--green);
      background: var(--paper);
      padding: 10px;
      overflow: hidden;
    }

    .bundle-tile::before {
      content: "";
      position: absolute;
      inset: 7px auto 7px 7px;
      width: 5px;
      background: repeating-linear-gradient(
        to bottom,
        rgb(21 17 11 / 0.72) 0 5px,
        transparent 5px 10px
      );
      opacity: 0.58;
      pointer-events: none;
    }

    .bundle-tile::after {
      content: "";
      position: absolute;
      top: 8px;
      right: 8px;
      width: 42px;
      height: 8px;
      border: 1px solid var(--line);
      background: repeating-linear-gradient(
        to right,
        var(--line) 0 2px,
        transparent 2px 7px
      );
      opacity: 0.42;
      pointer-events: none;
    }

    .bundle-tile[data-scope="common"] {
      border-left-color: var(--yellow);
    }

    .bundle-tile[data-builder-bundle-state="selected"] {
      background: var(--green-soft);
    }

    .bundle-tile[data-builder-bundle-state="partial"],
    .bundle-tile[data-builder-bundle-state="customized"] {
      background: var(--yellow-soft);
    }

    .bundle-tile[data-builder-preview-active="true"] {
      outline: 4px solid rgb(36 109 212 / 0.24);
      background: var(--blue-soft);
    }

    .bundle-main {
      min-width: 0;
      display: grid;
      gap: 4px;
      align-content: start;
    }

    .bundle-name-row,
    .atom-name-row,
    .explainable-title {
      min-width: 0;
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }

    .bundle-name {
      min-width: 0;
      overflow-wrap: anywhere;
      font-weight: 900;
      font-size: 0.95rem;
      line-height: 1.1;
    }

    .bundle-id,
    .bundle-description {
      min-width: 0;
      color: var(--muted);
      font: 700 0.7rem/1.28 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
    }

    .bundle-description {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .bundle-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      min-width: 0;
    }

    .bundle-actions {
      display: grid;
      gap: 8px;
      align-content: start;
      justify-items: stretch;
    }

    .bundle-action-hint {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      min-height: 22px;
    }

    .bundle-action-main {
      min-height: 38px;
      min-width: 104px;
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      align-items: center;
      gap: 6px;
      padding: 4px 8px 4px 4px;
      font-size: 0.68rem;
      line-height: 1.1;
      white-space: normal;
      text-align: left;
    }

    .action-icon {
      width: 28px;
      height: 28px;
      display: inline-grid;
      place-items: center;
      border: 2px solid var(--line);
      background: #fff;
      font: 900 0.9rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      box-shadow: inset 0 -3px 0 rgb(21 17 11 / 0.1);
    }

    .bundle-action-main[data-builder-bundle-action-button="remove"] .action-icon {
      background: var(--yellow-soft);
    }

    .bundle-action-main[data-builder-bundle-action-button="replace"] .action-icon,
    .bundle-action-main[data-builder-bundle-action-button="complete"] .action-icon {
      background: var(--blue-soft);
    }

    .bundle-foot {
      grid-column: 1 / -1;
      min-width: 0;
      border-top: 1px solid var(--soft-line);
      padding-top: 6px;
      overflow-wrap: anywhere;
    }

    .side-panel .bundle-tile {
      min-height: auto;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto auto auto;
      overflow: visible;
    }

    .side-panel .bundle-actions {
      grid-template-columns: minmax(0, 1fr) 34px 24px;
      align-items: center;
      gap: 6px;
    }

    .side-panel .bundle-action-main {
      min-width: 0;
      width: 100%;
    }

    .side-panel .bundle-action-hint {
      justify-content: center;
    }

    .atom-tile > div {
      min-width: 0;
      overflow: hidden;
    }

    .atom-tile[data-scope="common"] { border-left-color: var(--yellow); }
    .atom-tile[data-scope="product"] { border-left-color: var(--green); }
    .atom-tile[data-scope="fixture-only"] { border-left-color: var(--blue); }
    .atom-tile[data-scope="reserved"] { border-left-color: var(--purple); }
    .atom-tile[data-scope="external"] { border-left-color: var(--red); }

    .atom-name {
      min-width: 0;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      overflow-wrap: anywhere;
      font-weight: 900;
      font-size: 0.88rem;
      line-height: 1.15;
      letter-spacing: 0;
    }

    .atom-name-row .atom-name {
      flex: 1 1 auto;
    }

    .atom-meta {
      min-width: 0;
      margin-top: 4px;
      color: var(--muted);
      font: 700 0.68rem/1.25 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .atom-chip-row {
      min-width: 0;
      margin-top: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .atom-chip-row .chip {
      min-height: 21px;
      padding: 2px 6px;
      font-size: 0.62rem;
    }

    .icon-button {
      width: 34px;
      height: 34px;
      min-width: 34px;
      padding: 0;
      align-self: center;
      font-weight: 900;
      font-size: 1rem;
      line-height: 1;
    }

    .icon-button:hover,
    .icon-button[aria-pressed="true"] {
      transform: none;
      box-shadow: 3px 3px 0 rgb(21 17 11 / 0.18);
    }

    .board {
      min-height: 0;
      display: grid;
      grid-auto-rows: max-content;
      gap: 12px;
      padding: 12px;
      align-content: start;
      overflow: auto;
      background:
        linear-gradient(90deg, rgb(21 17 11 / 0.035) 1px, transparent 1px),
        linear-gradient(0deg, rgb(21 17 11 / 0.035) 1px, transparent 1px),
        rgb(246 248 249 / 0.82);
      background-size: 22px 22px;
    }

    .right-card-tabs {
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      padding: 8px;
      border-bottom: 2px solid var(--line);
      background: #eef3f6;
    }

    .right-card-tab {
      min-width: 0;
      min-height: 38px;
      padding: 7px 8px;
      box-shadow: none;
      text-transform: uppercase;
      font-size: 0.74rem;
      line-height: 1.1;
      white-space: normal;
    }

    .right-card-tab[aria-pressed="true"] {
      border-color: var(--green);
      background: var(--green-soft);
      box-shadow: inset 0 -4px 0 var(--green), 2px 2px 0 rgb(21 17 11 / 0.12);
    }

    .right-card {
      min-height: 0;
      display: grid;
      overflow: hidden;
    }

    .right-card[hidden] {
      display: none;
    }

    .right-audit-card {
      grid-template-rows: auto auto minmax(0, 1fr);
    }

    .right-tui-card {
      grid-template-rows: auto minmax(0, 1fr);
      background: rgb(255 253 246 / 0.98);
    }

    .right-tui-card[hidden] {
      display: none;
    }

    .right-flow-card {
      grid-template-rows: auto minmax(0, 1fr);
      background: #f7f8f4;
    }

    .right-flow-card[hidden] {
      display: none;
    }

    .right-flow-panel {
      display: grid;
      align-content: start;
      gap: 10px;
      padding: 10px;
      overflow: auto;
      min-height: 0;
    }

    .right-flow-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
    }

    .right-flow-actions button {
      min-height: 38px;
      padding: 7px 8px;
      box-shadow: none;
      font-size: 0.72rem;
      line-height: 1.1;
    }

    .right-flow-hint {
      display: grid;
      gap: 5px;
      border-left: 7px solid var(--yellow);
      background: var(--yellow-soft);
      padding: 8px;
      overflow-wrap: anywhere;
    }

    .right-tui-head {
      border-bottom: 2px solid var(--line);
    }

    .right-tui-card .tui-panel {
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 10px;
      overflow: auto;
      gap: 10px;
    }

    .right-tui-card .tui-terminal {
      flex: 0 0 clamp(240px, 34vh, 430px);
      height: clamp(240px, 34vh, 430px);
      min-height: 220px;
      max-height: 430px;
      position: relative;
      z-index: 1;
      box-sizing: border-box;
    }

    .right-tui-card .tui-controls {
      flex: 0 0 auto;
      max-height: 118px;
      overflow: auto;
    }

    .right-tui-card .tui-bar {
      flex: 0 0 auto;
      max-height: 210px;
      overflow: auto;
      grid-template-columns: 1fr;
      position: relative;
      z-index: 0;
    }

    .right-tui-card .tui-stat {
      min-height: 52px;
      padding: 6px 8px;
    }

    .right-tui-card .tui-log {
      flex: 0 0 auto;
      max-height: 96px;
    }

    .lane {
      border: 2px dashed var(--line);
      min-height: 110px;
      background: rgb(255 253 246 / 0.68);
    }

    .lane[data-builder-lane-collapsed="true"] {
      min-height: 0;
    }

    .lane-head {
      min-height: 34px;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid var(--line);
      background: #e8eef2;
      padding: 6px 8px;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 0.78rem;
    }

    .lane-title {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-wrap: anywhere;
    }

    .lane-toggle {
      width: 24px;
      height: 24px;
      min-width: 24px;
      display: inline-grid;
      place-items: center;
      padding: 0;
      border: 1px solid var(--line);
      background: rgb(255 255 255 / 0.72);
      box-shadow: none;
      line-height: 1;
    }

    .lane-toggle::before {
      content: "";
      width: 0;
      height: 0;
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 7px solid var(--ink);
      transform: rotate(90deg);
      transform-origin: 45% 50%;
    }

    .lane-toggle[aria-expanded="false"]::before {
      transform: none;
    }

    .lane-toggle:hover {
      transform: none;
      box-shadow: 2px 2px 0 rgb(21 17 11 / 0.14);
    }

    .info-help-wrap {
      position: relative;
      z-index: 8;
      display: inline-flex;
      align-items: center;
      flex: 0 0 auto;
      text-transform: none;
      vertical-align: middle;
    }

    .info-help-button {
      width: 22px;
      min-width: 22px;
      height: 22px;
      min-height: 22px;
      padding: 0;
      display: inline-grid;
      place-items: center;
      border-radius: 999px;
      border: 2px solid var(--line);
      background: var(--paper);
      box-shadow: 1px 1px 0 rgb(21 17 11 / 0.18);
      font: 900 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      cursor: help;
    }

    .floating-help {
      position: fixed;
      z-index: 10000;
      width: min(360px, calc(100vw - 24px));
      border: 2px solid var(--line);
      background: rgb(255 253 246 / 0.98);
      box-shadow: 8px 8px 0 rgb(21 17 11 / 0.24);
      padding: 10px 12px;
      color: var(--ink);
      font: 750 0.78rem/1.42 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
      pointer-events: none;
    }

    .floating-help[hidden] {
      display: none;
    }

    .floating-help strong {
      display: block;
      margin-bottom: 4px;
      font: 900 0.82rem/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      text-transform: uppercase;
    }

    .info-help-wrap:hover .info-help-button {
      background: var(--blue-soft);
      transform: none;
      box-shadow: 1px 1px 0 rgb(21 17 11 / 0.18);
    }

    .lane-atoms {
      min-height: 68px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 8px;
      padding: 8px;
    }

    .assembly-slots {
      min-height: 74px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(238px, 1fr));
      gap: 8px;
      padding: 8px;
    }

    .assembly-slots[hidden],
    .loose-grid[hidden] {
      display: none;
    }

    .assembly-loose-area {
      border-color: var(--yellow);
      background: rgb(255 247 208 / 0.56);
    }

    .loose-grid {
      min-height: 74px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(238px, 1fr));
      gap: 8px;
      padding: 8px;
    }

    .loose-atom-tile {
      cursor: default;
    }

    .assembly-slot {
      position: relative;
      isolation: isolate;
      min-width: 0;
      display: grid;
      grid-template-rows: auto auto minmax(0, auto);
      gap: 8px;
      border: 2px dashed var(--line);
      background: rgb(255 253 246 / 0.76);
      padding: 9px 8px 8px 18px;
      overflow: hidden;
    }

    .assembly-slot::before {
      content: "";
      position: absolute;
      inset: 8px auto 8px 6px;
      width: 7px;
      border: 2px solid var(--line);
      background:
        linear-gradient(var(--paper), var(--paper)) padding-box,
        repeating-linear-gradient(
          to bottom,
          var(--line) 0 2px,
          transparent 2px 8px
        );
      opacity: 0.64;
      z-index: 0;
      pointer-events: none;
    }

    .assembly-slot::after {
      content: "";
      position: absolute;
      right: 7px;
      bottom: 7px;
      width: 40px;
      height: 6px;
      border-top: 2px solid rgb(21 17 11 / 0.42);
      border-bottom: 2px solid rgb(21 17 11 / 0.16);
      background: repeating-linear-gradient(
        to right,
        rgb(21 17 11 / 0.5) 0 2px,
        transparent 2px 7px
      );
      opacity: 0.5;
      z-index: 0;
      pointer-events: none;
    }

    .slot-ghost-fit,
    .slot-interface-meter {
      position: absolute;
      pointer-events: none;
      z-index: 0;
    }

    .slot-ghost-fit {
      left: 24px;
      right: 54px;
      bottom: 8px;
      height: 34px;
      border: 2px dashed rgb(36 109 212 / 0.62);
      background:
        repeating-linear-gradient(
          to right,
          rgb(36 109 212 / 0.12) 0 8px,
          transparent 8px 15px
        ),
        rgb(36 109 212 / 0.08);
      opacity: 0;
      transform: translateY(8px);
    }

    .assembly-slot[data-builder-slot-ghost-fit="target"] .slot-ghost-fit,
    .assembly-slot[data-builder-slot-ghost-fit="covered"] .slot-ghost-fit {
      opacity: 0.92;
      transform: translateY(0);
    }

    .assembly-slot[data-builder-slot-ghost-fit="covered"] .slot-ghost-fit {
      border-color: rgb(12 105 92 / 0.68);
      background:
        repeating-linear-gradient(
          to right,
          rgb(12 105 92 / 0.13) 0 8px,
          transparent 8px 15px
        ),
        rgb(12 105 92 / 0.08);
    }

    .assembly-slot[data-builder-slot-ghost-fit="replace"] .slot-ghost-fit,
    .assembly-slot[data-builder-slot-ghost-fit="remove"] .slot-ghost-fit {
      opacity: 0.88;
      border-color: rgb(196 142 7 / 0.72);
      background:
        repeating-linear-gradient(
          to right,
          rgb(196 142 7 / 0.14) 0 8px,
          transparent 8px 15px
        ),
        rgb(196 142 7 / 0.08);
      transform: translateY(2px);
    }

    .assembly-slot[data-builder-slot-ghost-fit="conflict"] .slot-ghost-fit {
      opacity: 0.92;
      border-color: rgb(179 54 47 / 0.78);
      background:
        repeating-linear-gradient(
          to right,
          rgb(179 54 47 / 0.16) 0 8px,
          transparent 8px 15px
        ),
        rgb(179 54 47 / 0.08);
      transform: translate(8px, 3px) skewX(-10deg);
    }

    .slot-interface-meter {
      right: 9px;
      bottom: 16px;
      width: 44px;
      height: 22px;
      opacity: 0.64;
    }

    .slot-interface-meter::before,
    .slot-interface-meter::after {
      content: "";
      position: absolute;
      top: 6px;
      height: 10px;
      border: 2px solid rgb(21 17 11 / 0.56);
      background: rgb(255 255 255 / 0.54);
    }

    .slot-interface-meter::before {
      left: 0;
      width: 17px;
    }

    .slot-interface-meter::after {
      right: 0;
      width: 17px;
      background:
        repeating-linear-gradient(
          to right,
          rgb(21 17 11 / 0.46) 0 2px,
          transparent 2px 6px
        ),
        rgb(255 255 255 / 0.54);
    }

    .assembly-slot[data-builder-slot-interface-state="try-fit"] .slot-interface-meter::before,
    .assembly-slot[data-builder-slot-interface-state="try-fit"] .slot-interface-meter::after {
      border-color: rgb(36 109 212 / 0.64);
    }

    .assembly-slot[data-builder-slot-interface-state="misaligned"] .slot-interface-meter {
      opacity: 0.92;
    }

    .assembly-slot[data-builder-slot-interface-state="misaligned"] .slot-interface-meter::before,
    .assembly-slot[data-builder-slot-interface-state="misaligned"] .slot-interface-meter::after {
      border-color: rgb(179 54 47 / 0.78);
      background-color: rgb(255 236 232 / 0.86);
    }

    .assembly-slot[data-builder-slot-interface-state="misaligned"] .slot-interface-meter::before {
      transform: translate(-3px, 2px) rotate(-6deg);
    }

    .assembly-slot[data-builder-slot-interface-state="misaligned"] .slot-interface-meter::after {
      transform: translate(5px, -3px) rotate(8deg);
    }

    .assembly-slot[aria-current="true"] {
      outline: 4px solid rgb(36 109 212 / 0.24);
      background: var(--blue-soft);
    }

    .assembly-slot[data-builder-slot-status="installed"] {
      border-style: solid;
      border-left: 10px solid var(--green);
      background: var(--green-soft);
    }

    .assembly-slot[data-builder-slot-status="partial"],
    .assembly-slot[data-builder-slot-status="customized"] {
      border-style: solid;
      border-left: 10px solid var(--yellow);
      background: var(--yellow-soft);
    }

    .assembly-slot[data-builder-slot-status="conflict"] {
      border-style: solid;
      border-left: 10px solid var(--red);
      background: var(--red-soft);
    }

    .assembly-slot[data-builder-slot-preview="target"],
    .assembly-slot[data-builder-slot-preview="covered"] {
      outline: 4px solid rgb(36 109 212 / 0.26);
      box-shadow: inset 0 0 0 3px rgb(36 109 212 / 0.18);
      background: var(--blue-soft);
    }

    .assembly-slot[data-builder-slot-preview="covered"] {
      border-color: var(--green);
      box-shadow: inset 0 0 0 3px rgb(12 105 92 / 0.18);
    }

    .assembly-slot[data-builder-slot-preview="replace"],
    .assembly-slot[data-builder-slot-preview="remove"] {
      outline: 4px solid rgb(196 142 7 / 0.26);
      border-color: var(--yellow);
      background: var(--yellow-soft);
    }

    .assembly-slot[data-builder-slot-preview="conflict"] {
      outline: 4px solid rgb(179 54 47 / 0.26);
      border-color: var(--red);
      background: var(--red-soft);
    }

    .slot-select {
      width: 100%;
      min-width: 0;
      position: relative;
      z-index: 1;
      min-height: 48px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      border: 0;
      background: transparent;
      box-shadow: none;
      padding: 0;
      text-align: left;
    }

    .slot-select:hover {
      transform: none;
      box-shadow: none;
    }

    .slot-label {
      display: block;
      min-width: 0;
      overflow-wrap: anywhere;
      font-weight: 900;
      font-size: 0.86rem;
      line-height: 1.15;
      text-transform: uppercase;
    }

    .slot-module-list {
      min-width: 0;
      position: relative;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      align-items: center;
    }

    .slot-warning-list {
      min-width: 0;
      position: relative;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      align-items: center;
    }

    .slot-warning {
      min-height: 24px;
      border: 1px solid var(--yellow);
      background: rgb(255 247 208 / 0.84);
      padding: 4px 7px;
      font: 800 0.66rem/1.1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
    }

    .slot-warning[data-severity="error"] {
      border-color: var(--red);
      background: var(--red-soft);
    }

    .module-chip {
      position: relative;
      max-width: 100%;
      min-height: 26px;
      border: 1px solid var(--line);
      background: var(--paper);
      box-shadow: none;
      padding: 4px 7px 4px 16px;
      font: 800 0.68rem/1.1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .module-chip-wrap {
      max-width: 100%;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .module-chip-wrap .module-chip {
      min-width: 0;
    }

    .module-chip::before {
      content: "";
      position: absolute;
      left: 5px;
      top: 5px;
      bottom: 5px;
      width: 5px;
      border-left: 2px solid var(--line);
      border-right: 1px solid rgb(21 17 11 / 0.22);
      background: var(--green);
      opacity: 0.72;
    }

    .module-chip:hover {
      transform: none;
      box-shadow: 2px 2px 0 rgb(21 17 11 / 0.14);
    }

    .module-chip[data-builder-slot-preview-module] {
      border-style: dashed;
      background: var(--blue-soft);
    }

    .slot-atom-toggle {
      width: 24px;
      height: 24px;
      min-width: 24px;
      display: inline-grid;
      place-items: center;
      padding: 0;
      border: 1px solid var(--line);
      background: rgb(255 255 255 / 0.72);
      box-shadow: none;
      line-height: 1;
    }

    .slot-atom-toggle::before {
      content: "";
      width: 0;
      height: 0;
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 7px solid var(--ink);
      transform-origin: 45% 50%;
    }

    .slot-atom-toggle[aria-expanded="true"] {
      background: var(--blue-soft);
    }

    .slot-atom-toggle[aria-expanded="true"]::before {
      transform: rotate(90deg);
    }

    .slot-atom-toggle:hover {
      transform: none;
      box-shadow: 2px 2px 0 rgb(21 17 11 / 0.14);
    }

    .preview-panel {
      display: grid;
      gap: 8px;
      margin-bottom: 8px;
    }

    .preview-actions {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
    }

    .preview-dock {
      position: fixed;
      left: 50%;
      bottom: 14px;
      transform: translateX(-50%);
      z-index: 80;
      width: min(960px, calc(100vw - 28px));
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      border: 3px solid var(--line);
      background: var(--paper);
      box-shadow: 8px 8px 0 rgba(16, 24, 40, 0.18);
      padding: 10px;
    }

    .preview-dock[hidden] {
      display: none;
    }

    .preview-dock[data-severity="blocked"] {
      background: var(--red-soft);
      border-color: var(--red);
    }

    .preview-dock[data-severity="warning"] {
      background: var(--yellow-soft);
      border-color: var(--yellow);
    }

    .preview-dock[data-severity="ok"] {
      background: var(--green-soft);
      border-color: var(--green);
    }

    .preview-dock-main {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .preview-dock-title {
      display: block;
      font-weight: 900;
      line-height: 1.1;
      text-transform: uppercase;
    }

    .preview-dock-actions {
      display: grid;
      grid-template-columns: minmax(96px, auto) minmax(80px, auto);
      gap: 8px;
      align-items: center;
    }

    .preview-dock-actions button {
      min-width: 0;
      line-height: 1.1;
      white-space: normal;
    }

    body[data-builder-preview-dock="active"] .layout {
      padding-bottom: 96px;
    }

    .flow-observer {
      width: min(1440px, calc(100vw - 28px));
      margin: 10px auto 18px;
      border: 3px solid var(--line);
      background: var(--paper);
      box-shadow: var(--shadow);
      display: grid;
      min-height: 40px;
      overflow: hidden;
    }

    .flow-observer[data-flow-state="collapsed"] {
      box-shadow: 5px 5px 0 rgb(21 17 11 / 0.12);
    }

    .flow-observer[data-flow-state="fullscreen"] {
      position: fixed;
      inset: 12px;
      z-index: 95;
      width: auto;
      margin: 0;
      min-height: 0;
      box-shadow: 14px 14px 0 rgb(21 17 11 / 0.2);
    }

    html[data-flow-observer-window="true"],
    html[data-flow-observer-window="true"] body {
      overflow: hidden;
    }

    html[data-flow-observer-window="true"] .app {
      min-height: 100vh;
      display: block;
    }

    html[data-flow-observer-window="true"] .top,
    html[data-flow-observer-window="true"] #builderLayout,
    html[data-flow-observer-window="true"] .preview-dock,
    html[data-flow-observer-window="true"] .wizard {
      display: none !important;
    }

    html[data-flow-observer-window="true"] .flow-observer {
      position: fixed;
      inset: 8px;
      z-index: 100;
      width: auto;
      margin: 0;
      min-height: 0;
      grid-template-rows: auto minmax(0, 1fr);
      box-shadow: 14px 14px 0 rgb(21 17 11 / 0.18);
    }

    html[data-flow-observer-window="true"] .flow-observer-bar {
      grid-template-columns: minmax(0, 1fr);
      align-items: start;
      gap: 8px;
      padding: 10px 12px;
    }

    html[data-flow-observer-window="true"] .flow-observer-title {
      align-items: center;
      flex-wrap: wrap;
      gap: 6px 10px;
      line-height: 1.05;
    }

    html[data-flow-observer-window="true"] #flowObserverTitle {
      flex: 0 0 auto;
      white-space: nowrap;
    }

    html[data-flow-observer-window="true"] #flowObserverSummary {
      min-width: min(520px, 100%);
    }

    html[data-flow-observer-window="true"] .flow-observer-status {
      flex: 1 1 320px;
    }

    html[data-flow-observer-window="true"] .flow-observer-actions {
      justify-content: start;
      align-items: end;
      width: 100%;
    }

    html[data-flow-observer-window="true"] .flow-observer-actions button,
    html[data-flow-observer-window="true"] .flow-observer-actions select {
      white-space: nowrap;
    }

    html[data-flow-observer-window="true"] #flowObserverToggleButton,
    html[data-flow-observer-window="true"] #flowObserverPinButton,
    html[data-flow-observer-window="true"] #flowObserverFullscreenButton {
      display: none;
    }

    html[data-flow-observer-window="true"] .flow-observer-body {
      min-height: 0;
      height: 100%;
      max-height: none;
    }

    .flow-observer [hidden] {
      display: none !important;
    }

    .flow-observer-bar {
      min-height: 40px;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 6px 8px;
      border-bottom: 2px solid var(--line);
      background: #e9ece7;
    }

    .flow-observer[data-flow-state="collapsed"] .flow-observer-bar {
      border-bottom: 0;
      grid-template-columns: auto minmax(0, 1fr);
      overflow: hidden;
      padding-block: 4px;
    }

    .flow-observer[data-flow-state="collapsed"] .flow-observer-actions {
      display: none;
    }

    .flow-observer[data-flow-state="collapsed"] .flow-observer-title,
    .flow-observer[data-flow-state="collapsed"] .flow-observer-status {
      flex-wrap: nowrap;
      overflow: hidden;
      white-space: nowrap;
    }

    .flow-observer[data-flow-state="collapsed"] .flow-observer-status .chip {
      flex: 0 0 auto;
      max-width: none;
      overflow-wrap: normal;
      white-space: nowrap;
    }

    .flow-observer-title {
      min-width: 0;
      display: flex;
      gap: 8px;
      align-items: baseline;
      overflow-wrap: anywhere;
      font-weight: 900;
      text-transform: uppercase;
    }

    .flow-observer-status {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      min-width: 0;
      align-items: center;
    }

    .flow-observer-status .chip {
      min-height: 22px;
      padding: 2px 6px;
      font-size: 0.66rem;
      background: var(--paper);
      max-width: none;
      overflow-wrap: normal;
      white-space: nowrap;
    }

    .flow-observer-status .chip[data-flow-health="drift"],
    .flow-observer-status .chip[data-flow-health="error"] {
      background: var(--red-soft);
      border-color: var(--red);
    }

    .flow-observer-status .chip[data-flow-health="loading"],
    .flow-observer-status .chip[data-flow-health="pending"] {
      background: var(--yellow-soft);
      border-color: var(--yellow);
    }

    .flow-observer-status .chip[data-flow-health="ok"] {
      background: var(--green-soft);
      border-color: var(--green);
    }

    .flow-observer-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: end;
      min-width: 0;
    }

    .flow-observer-actions button,
    .flow-observer-actions select {
      min-height: 28px;
      padding: 4px 8px;
      line-height: 1.1;
      white-space: normal;
    }

    .flow-observer-actions button:disabled,
    .flow-observer-actions select:disabled {
      cursor: not-allowed;
      opacity: 0.48;
      transform: none;
      box-shadow: 2px 2px 0 rgb(21 17 11 / 0.1);
    }

    .flow-observer-control {
      min-width: 142px;
      display: grid;
      gap: 2px;
      align-content: start;
      font-size: 0.66rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    .flow-observer-control select,
    .flow-observer-control input {
      width: 100%;
      min-width: 0;
      max-width: 180px;
      border: 2px solid var(--line);
      background: var(--paper);
      color: var(--ink);
      box-shadow: 3px 3px 0 rgb(21 17 11 / 0.12);
      font-size: 0.72rem;
      text-transform: none;
    }

    .flow-observer-control input:disabled {
      background: var(--paper-soft);
      color: var(--muted);
      box-shadow: none;
    }

    .flow-observer-control-wide {
      min-width: 168px;
    }

    .flow-observer-actions button[data-flow-compare-layout] {
      font-size: 0.72rem;
      background: #f8f3df;
    }

    .flow-observer-actions button[data-flow-compare-layout][aria-pressed="true"] {
      background: var(--yellow-soft);
      border-color: var(--yellow);
      box-shadow: 3px 3px 0 rgb(21 17 11 / 0.16);
    }

    .flow-observer-actions button[data-flow-lane-filter] {
      font-size: 0.68rem;
      background: var(--paper);
      border-top-width: 5px;
    }

    .flow-observer-actions button[data-flow-lane-filter="surface"] { border-top-color: var(--green); }
    .flow-observer-actions button[data-flow-lane-filter="session"] { border-top-color: var(--blue); }
    .flow-observer-actions button[data-flow-lane-filter="prompt"] { border-top-color: var(--yellow); }
    .flow-observer-actions button[data-flow-lane-filter="provider"] { border-top-color: var(--rust); }
    .flow-observer-actions button[data-flow-lane-filter="tool"] { border-top-color: var(--purple); }
    .flow-observer-actions button[data-flow-lane-filter="runtime"] { border-top-color: var(--line); }

    .flow-observer-actions button[data-flow-lane-filter][aria-pressed="false"] {
      background: #d9ded6;
      color: rgb(21 17 11 / 0.58);
      border-style: dashed;
    }

    .flow-observer-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(260px, 0.28fr);
      gap: 0;
      min-height: 32vh;
      max-height: 40vh;
    }

    .flow-observer[data-flow-state="collapsed"] .flow-observer-body {
      display: none;
    }

    .flow-observer[data-flow-state="fullscreen"] .flow-observer-body {
      min-height: calc(100vh - 74px);
      max-height: none;
    }

    .flow-observer[data-flow-depth="flat"] .flow-viewport {
      perspective: none;
    }

    .flow-observer[data-flow-depth="flat"] .flow-rail,
    .flow-observer[data-flow-depth="flat"] .flow-compare-side,
    .flow-observer[data-flow-depth="flat"] .flow-overlay {
      transform: none;
    }

    .flow-observer[data-flow-depth="flat"] .flow-lane-track {
      transform: none;
      filter: none;
    }

    .flow-viewport {
      min-width: 0;
      overflow: auto;
      padding: 18px;
      background:
        linear-gradient(90deg, rgb(21 17 11 / 0.055) 1px, transparent 1px),
        linear-gradient(0deg, rgb(21 17 11 / 0.055) 1px, transparent 1px),
        #f7f8f4;
      background-size: 34px 34px;
      perspective: 960px;
    }

    .flow-rail {
      min-width: 1120px;
      display: grid;
      gap: 12px;
      transform: skewX(-1deg);
      transform-origin: 50% 0;
      padding: 10px 8px 28px;
    }

    .flow-stage-list {
      display: none;
      gap: 8px;
      min-width: 0;
    }

    .flow-stage-list-row {
      width: 100%;
      min-width: 0;
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr);
      gap: 8px;
      align-items: stretch;
      border: 2px solid var(--line);
      background: var(--surface);
      box-shadow: 5px 6px 0 rgb(21 17 11 / 0.13);
      padding: 8px;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }

    .flow-stage-list-row[data-active="true"],
    .flow-stage-list-row:hover,
    .flow-stage-list-row:focus-visible {
      outline: 3px solid var(--yellow);
      outline-offset: 2px;
    }

    .flow-stage-list-row[data-status="changed"],
    .flow-stage-list-row[data-status="assembled-only"],
    .flow-stage-list-row[data-status="original-only"] {
      background: var(--red-soft);
    }

    .flow-stage-list-row[data-flow-drift-node="true"] {
      box-shadow: 7px 8px 0 rgb(21 17 11 / 0.18);
    }

    .flow-stage-list-row[data-flow-draft-change="true"] {
      outline: 3px dotted var(--rust);
      outline-offset: 2px;
    }

    .flow-stage-list-order {
      display: grid;
      align-content: center;
      justify-items: center;
      border: 2px solid var(--line);
      background: var(--paper);
      font-weight: 900;
      min-height: 44px;
    }

    .flow-stage-list-main {
      min-width: 0;
      display: grid;
      gap: 5px;
    }

    .flow-stage-list-main strong {
      overflow-wrap: anywhere;
      text-transform: uppercase;
      line-height: 1.05;
    }

    .flow-stage-list-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      min-width: 0;
    }

    .flow-lane-track {
      display: grid;
      grid-template-columns: 112px minmax(0, 1fr);
      gap: 8px;
      align-items: stretch;
      transform: translateX(calc(var(--lane-depth, 0) * 5px));
      filter: drop-shadow(calc(var(--lane-depth, 0) * 1px) 4px 0 rgb(21 17 11 / 0.08));
    }

    .flow-lane-track[data-collapsed="true"] {
      opacity: 0.68;
    }

    .flow-lane-label {
      border: 2px solid var(--line);
      background: #f7f8f4;
      box-shadow: 4px 5px 0 rgb(21 17 11 / 0.12);
      padding: 8px;
      display: grid;
      align-content: start;
      gap: 6px;
      min-height: 72px;
      text-transform: uppercase;
      font-weight: 900;
    }

    .flow-lane-track[data-flow-lane-track="surface"] .flow-lane-label { border-left: 8px solid var(--green); }
    .flow-lane-track[data-flow-lane-track="session"] .flow-lane-label { border-left: 8px solid var(--blue); }
    .flow-lane-track[data-flow-lane-track="prompt"] .flow-lane-label { border-left: 8px solid var(--yellow); }
    .flow-lane-track[data-flow-lane-track="provider"] .flow-lane-label { border-left: 8px solid var(--rust); }
    .flow-lane-track[data-flow-lane-track="tool"] .flow-lane-label { border-left: 8px solid var(--purple); }
    .flow-lane-track[data-flow-lane-track="runtime"] .flow-lane-label { border-left: 8px solid var(--line); }

    .flow-lane-stage-grid {
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(19, minmax(72px, 1fr));
      gap: 14px;
      align-items: stretch;
      padding: 0 0 2px;
      border-bottom: 1px solid rgb(21 17 11 / 0.16);
    }

    .flow-lane-track[data-collapsed="true"] .flow-lane-stage-grid {
      min-height: 72px;
      border: 2px dashed rgb(21 17 11 / 0.28);
      background: linear-gradient(90deg, rgb(21 17 11 / 0.05), transparent);
    }

    .flow-node {
      min-height: 132px;
      display: grid;
      grid-template-rows: auto auto auto 1fr auto;
      gap: 6px;
      border: 2px solid var(--line);
      background: var(--surface);
      box-shadow: 7px 8px 0 rgb(21 17 11 / 0.16);
      padding: 8px;
      position: relative;
      overflow: hidden;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }

    button.flow-node:hover,
    button.flow-node:focus-visible,
    .flow-node[data-active="true"] {
      outline: 3px solid var(--yellow);
      outline-offset: 2px;
      transform: translateY(-3px);
      box-shadow: 9px 11px 0 rgb(21 17 11 / 0.18);
    }

    .flow-node[data-status="changed"],
    .flow-node[data-status="assembled-only"],
    .flow-node[data-status="original-only"] {
      background: var(--red-soft);
    }

    .flow-node[data-flow-draft-change="true"] {
      outline: 3px dotted var(--rust);
      outline-offset: 2px;
    }

    .flow-node[data-flow-drift-node="true"] {
      transform: translateY(-5px);
      box-shadow: 10px 13px 0 rgb(21 17 11 / 0.2);
      z-index: 2;
    }

    button.flow-node[data-flow-drift-node="true"]:hover,
    button.flow-node[data-flow-drift-node="true"]:focus-visible,
    .flow-node[data-flow-drift-node="true"][data-active="true"] {
      transform: translateY(-7px);
      box-shadow: 11px 14px 0 rgb(21 17 11 / 0.22);
    }

    .flow-node[data-status="inferred"],
    .flow-node[data-status="unobservable"],
    .flow-node[data-status="missing"] {
      background: var(--yellow-soft);
    }

    .flow-node::after {
      content: "";
      position: absolute;
      right: -2px;
      top: 18px;
      width: 9px;
      height: 9px;
      border-top: 2px solid var(--line);
      border-right: 2px solid var(--line);
      transform: rotate(45deg);
      background: var(--surface);
    }

    .flow-node[data-lane="surface"] { border-top: 8px solid var(--green); }
    .flow-node[data-lane="session"] { border-top: 8px solid var(--blue); }
    .flow-node[data-lane="prompt"] { border-top: 8px solid var(--yellow); }
    .flow-node[data-lane="provider"] { border-top: 8px solid var(--rust); }
    .flow-node[data-lane="tool"] { border-top: 8px solid var(--purple); }
    .flow-node[data-lane="runtime"] { border-top: 8px solid var(--line); }

    .flow-node-top {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 6px;
      min-width: 0;
    }

    .flow-edge-badge {
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 3px;
      max-width: 100%;
      font-size: 0.58rem;
      line-height: 1.05;
      text-align: right;
    }

    .flow-edge-badge .chip {
      min-height: 18px;
      padding: 1px 4px;
      background: #eef4f8;
      border-color: var(--blue);
      box-shadow: none;
    }

    .flow-compare-side {
      min-width: 1040px;
      display: grid;
      gap: 8px;
      padding: 10px 8px 28px;
      transform: skewX(-0.75deg);
      transform-origin: 50% 0;
    }

    .flow-compare-row {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) 140px minmax(180px, 1fr);
      gap: 10px;
      align-items: stretch;
    }

    .flow-compare-stage {
      display: grid;
      align-content: center;
      gap: 5px;
      border: 2px solid var(--line);
      background: #e9ece7;
      box-shadow: 5px 5px 0 rgb(21 17 11 / 0.12);
      padding: 8px;
      text-align: center;
      font-weight: 900;
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }

    .flow-compare-column-title {
      min-height: 32px;
      border: 2px solid var(--line);
      background: var(--paper);
      padding: 6px 8px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .flow-compare-row .flow-node {
      min-height: 112px;
      box-shadow: 5px 6px 0 rgb(21 17 11 / 0.14);
    }

    .flow-overlay {
      min-width: 980px;
      display: grid;
      grid-template-columns: repeat(19, minmax(94px, 1fr));
      gap: 10px;
      align-items: stretch;
      padding: 10px 8px 28px;
      transform: skewX(-1deg);
      transform-origin: 50% 0;
    }

    .flow-overlay-stage {
      min-height: 142px;
      display: grid;
      gap: 6px;
      align-content: start;
      border: 2px solid var(--line);
      background: var(--surface);
      box-shadow: 7px 8px 0 rgb(21 17 11 / 0.16);
      padding: 8px;
      color: inherit;
      text-align: left;
      cursor: pointer;
      overflow: hidden;
    }

    .flow-overlay-stage:hover,
    .flow-overlay-stage:focus-visible,
    .flow-overlay-stage[data-active="true"] {
      outline: 3px solid var(--yellow);
      outline-offset: 2px;
    }

    .flow-overlay-stage[data-status="changed"],
    .flow-overlay-stage[data-status="assembled-only"],
    .flow-overlay-stage[data-status="original-only"] {
      background: var(--red-soft);
    }

    .flow-overlay-stage[data-lane="surface"] { border-top: 8px solid var(--green); }
    .flow-overlay-stage[data-lane="session"] { border-top: 8px solid var(--blue); }
    .flow-overlay-stage[data-lane="prompt"] { border-top: 8px solid var(--yellow); }
    .flow-overlay-stage[data-lane="provider"] { border-top: 8px solid var(--rust); }
    .flow-overlay-stage[data-lane="tool"] { border-top: 8px solid var(--purple); }
    .flow-overlay-stage[data-lane="runtime"] { border-top: 8px solid var(--line); }

    .flow-overlay-track {
      display: grid;
      gap: 3px;
      border-left: 6px solid var(--blue);
      background: #eef4f8;
      padding: 5px;
      font-size: 0.68rem;
      overflow-wrap: anywhere;
    }

    .flow-overlay-track[data-source="original"] {
      border-left-color: var(--rust);
      background: #f8eee7;
      border-style: dashed;
    }

    .flow-diff-table {
      min-width: 920px;
      display: grid;
      gap: 0;
      border: 2px solid var(--line);
      background: var(--paper);
      box-shadow: 8px 9px 0 rgb(21 17 11 / 0.14);
    }

    .flow-diff-table-row {
      display: grid;
      grid-template-columns: minmax(140px, 0.9fr) minmax(120px, 0.8fr) minmax(160px, 1fr) minmax(160px, 1fr) minmax(180px, 1.2fr);
      min-height: 42px;
      border-top: 1px solid var(--line);
      background: var(--surface);
    }

    .flow-diff-table-row:first-child {
      border-top: 0;
      background: #e9ece7;
      font-weight: 900;
      text-transform: uppercase;
    }

    .flow-diff-table-row[data-status="changed"],
    .flow-diff-table-row[data-status="assembled-only"],
    .flow-diff-table-row[data-status="original-only"] {
      background: var(--red-soft);
    }

    .flow-diff-table-row[data-flow-drift-projection-row] {
      box-shadow: inset 6px 0 0 var(--rust);
    }

    .flow-diff-table-cell [data-flow-drift-projection] {
      display: inline-flex;
      margin-top: 5px;
      border-color: var(--rust);
      background: #f8eee7;
    }

    .flow-diff-table-cell {
      min-width: 0;
      border-left: 1px solid var(--line);
      padding: 7px 8px;
      overflow-wrap: anywhere;
      font-size: 0.76rem;
      font-weight: 800;
    }

    .flow-diff-table-cell:first-child {
      border-left: 0;
    }

    .flow-diff-category-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 5px;
    }

    .flow-diff-category-list .chip {
      border-color: var(--rust);
      background: #f8eee7;
    }

    .flow-node strong {
      display: block;
      overflow-wrap: anywhere;
      line-height: 1.05;
      font-size: 0.88rem;
      text-transform: uppercase;
    }

    .flow-node .fine {
      font-size: 0.66rem;
      line-height: 1.2;
    }

    .flow-node-assembly {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-content: start;
      min-width: 0;
    }

    .flow-node-metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-content: end;
    }

    .flow-node-metrics .chip {
      min-height: 20px;
      padding: 1px 5px;
      font-size: 0.62rem;
      max-width: 100%;
      line-height: 1.12;
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .flow-side {
      min-width: 0;
      overflow: auto;
      border-left: 2px solid var(--line);
      padding: 12px;
      background: #eef1ec;
      display: grid;
      gap: 10px;
      align-content: start;
    }

    .flow-side-section {
      border: 2px solid var(--line);
      background: var(--paper);
      padding: 10px;
      display: grid;
      gap: 6px;
    }

    .flow-side-section h3 {
      margin: 0;
      font-size: 0.86rem;
      text-transform: uppercase;
    }

    .flow-diff-row {
      border-left: 7px solid var(--yellow);
      background: var(--yellow-soft);
      padding: 6px 7px;
      overflow-wrap: anywhere;
      font-size: 0.78rem;
      font-weight: 800;
      display: grid;
      gap: 4px;
    }

    .flow-diff-row[data-status="changed"],
    .flow-diff-row[data-status="original-only"],
    .flow-diff-row[data-status="assembled-only"] {
      border-left-color: var(--red);
      background: var(--red-soft);
    }

    .flow-diff-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .flow-diff-meta .chip {
      min-height: 18px;
      padding: 1px 5px;
      font-size: 0.62rem;
      max-width: 100%;
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .flow-lossiness-legend {
      display: grid;
      gap: 5px;
    }

    .flow-lossiness-item {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr) auto;
      gap: 6px;
      align-items: start;
      border-left: 7px solid var(--line);
      background: #eef1ec;
      padding: 6px 7px;
      font-size: 0.74rem;
      overflow-wrap: anywhere;
    }

    .flow-lossiness-item[data-lossiness="lossless"] {
      border-left-color: var(--green);
      background: var(--green-soft);
    }

    .flow-lossiness-item[data-lossiness="semantic"] {
      border-left-color: var(--blue);
      background: #eef4f8;
    }

    .flow-lossiness-item[data-lossiness="aggregated"] {
      border-left-color: var(--yellow);
      background: var(--yellow-soft);
    }

    .flow-lossiness-item[data-lossiness="inferred"] {
      border-left-color: var(--rust);
      background: #f8eee7;
    }

    .flow-lossiness-item[data-lossiness="unobservable"] {
      border-left-color: var(--red);
      background: var(--red-soft);
    }

    .flow-timeline-row {
      display: grid;
      grid-template-columns: minmax(72px, auto) minmax(0, 1fr);
      gap: 8px;
      align-items: start;
      border-left: 7px solid var(--green);
      background: var(--green-soft);
      padding: 6px 7px;
      overflow-wrap: anywhere;
      font-size: 0.78rem;
      font-weight: 800;
    }

    button.flow-timeline-row {
      width: 100%;
      appearance: none;
      border: 0;
      border-left: 7px solid var(--blue);
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }

    button.flow-timeline-row:hover,
    button.flow-timeline-row:focus-visible {
      background: #eef4f8;
      outline: 2px solid var(--ink);
      outline-offset: 2px;
    }

    button.flow-timeline-row[data-active="true"] {
      border-left-color: var(--rust);
      box-shadow: 4px 4px 0 var(--line);
    }

    .flow-trace-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
      gap: 6px;
    }

    .flow-trace-metric {
      min-width: 0;
      border-left: 7px solid var(--blue);
      background: #eef4f8;
      padding: 6px 7px;
      display: grid;
      gap: 3px;
      font-size: 0.74rem;
      overflow-wrap: anywhere;
    }

    .flow-trace-metric strong {
      text-transform: uppercase;
      font-size: 0.66rem;
      line-height: 1.1;
    }

    .flow-trace-metric span {
      font-weight: 900;
      line-height: 1.15;
    }

    .flow-inspector-grid {
      display: grid;
      gap: 6px;
    }

    .flow-inspector-row,
    .flow-hook-row,
    .flow-evidence-row,
    .flow-fix-hint-row,
    .flow-prompt-diff-row {
      display: grid;
      gap: 4px;
      border-left: 7px solid var(--blue);
      background: #eef4f8;
      padding: 6px 7px;
      overflow-wrap: anywhere;
      font-size: 0.76rem;
    }

    .flow-hook-row {
      border-left-color: var(--yellow);
      background: var(--yellow-soft);
    }

    .flow-fix-hint-row {
      border-left-color: var(--rust);
      background: #f8eee7;
    }

    .flow-fix-hint-row[data-status="changed"],
    .flow-fix-hint-row[data-status="assembled-only"],
    .flow-fix-hint-row[data-status="original-only"] {
      border-left-color: var(--red);
      background: var(--red-soft);
    }

    .flow-fix-hint-row a.chip {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .flow-hook-row[data-flow-edge-detail="ready"] {
      border-left-color: var(--rust);
      background: #f8eee7;
    }

    .flow-hook-chain {
      display: grid;
      gap: 5px;
    }

    .flow-hook-point {
      display: grid;
      gap: 4px;
      border: 1px solid var(--line);
      border-left: 6px solid var(--yellow);
      background: var(--paper);
      padding: 6px;
    }

    .flow-hook-point[data-can-block="true"],
    .flow-hook-point[data-result-type*="block"],
    .flow-hook-point[data-result-type*="deny"] {
      border-left-color: var(--red);
      background: var(--red-soft);
    }

    .flow-hook-point[data-can-transform="true"] {
      border-left-color: var(--blue);
      background: #eef4f8;
    }

    .flow-hook-source {
      display: grid;
      gap: 3px;
      border-left: 5px solid var(--green);
      background: var(--green-soft);
      padding: 5px 6px;
      font-size: 0.72rem;
    }

    .flow-evidence-row {
      border-left-color: var(--green);
      background: var(--green-soft);
    }

    .flow-evidence-row[data-status="missing"] {
      border-left-color: var(--yellow);
      background: var(--yellow-soft);
    }

    .flow-evidence-row[data-status="unverified"] {
      border-left-color: var(--red);
      background: var(--red-soft);
    }

    .flow-evidence-row[data-flow-native-projection-lossiness="semantic"],
    .flow-evidence-row[data-flow-native-stage-lossiness="semantic"] {
      border-left-color: var(--blue);
      background: #eef4f8;
    }

    .flow-evidence-row[data-flow-native-projection-lossiness="aggregated"],
    .flow-evidence-row[data-flow-native-stage-lossiness="aggregated"] {
      border-left-color: var(--yellow);
      background: var(--yellow-soft);
    }

    .flow-evidence-row[data-flow-native-projection-lossiness="inferred"],
    .flow-evidence-row[data-flow-native-stage-lossiness="inferred"] {
      border-left-color: var(--rust);
      background: #f8eee7;
    }

    .flow-evidence-row[data-flow-native-projection-lossiness="unobservable"],
    .flow-evidence-row[data-flow-native-stage-lossiness="unobservable"] {
      border-left-color: var(--red);
      background: var(--red-soft);
    }

    .flow-prompt-diff-row {
      border-left-color: var(--yellow);
      background: var(--yellow-soft);
    }

    .flow-prompt-diff-row[data-flow-prompt-diff="fingerprint-match"] {
      border-left-color: var(--green);
      background: var(--green-soft);
    }

    .flow-prompt-diff-row[data-flow-prompt-diff="fingerprint-mismatch"],
    .flow-prompt-diff-row[data-flow-prompt-diff="missing"] {
      border-left-color: var(--red);
      background: var(--red-soft);
    }

    .flow-inspector-row .flow-diff-meta,
    .flow-hook-row .flow-diff-meta,
    .flow-evidence-row .flow-diff-meta,
    .flow-fix-hint-row .flow-diff-meta,
    .flow-prompt-diff-row .flow-diff-meta {
      margin-top: 2px;
    }

	    .slot-atoms {
	      min-width: 0;
	      position: relative;
	      z-index: 1;
	      display: grid;
	      gap: 8px;
	    }

    .slot-atoms[hidden] {
      display: none;
    }

	    .slot-atoms .atom-tile {
	      min-height: 68px;
	      padding-top: 10px;
	      cursor: default;
	    }

	    .slot-atom-role-group {
	      min-width: 0;
	      display: grid;
	      gap: 6px;
	    }

	    .slot-atom-role-label {
	      min-width: 0;
	      display: flex;
	      align-items: center;
	      justify-content: space-between;
	      gap: 8px;
	      color: var(--muted);
	      font: 850 0.68rem/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	      text-transform: uppercase;
	    }

	    .slot-atom-role-grid {
	      min-width: 0;
	      display: grid;
	      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
	      gap: 6px;
	    }

	    .slot-atoms [data-builder-slot-atom-role="optional"],
	    .slot-atoms [data-builder-slot-atom-role="variant"] {
	      border-style: dashed;
	      background: rgb(255 253 246 / 0.58);
	    }

    .assembly-slot > .fine {
      position: relative;
      z-index: 1;
    }

    .slot-empty {
      min-height: 36px;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 6px;
      align-items: center;
      border: 1px dashed var(--soft-line);
      background: rgb(255 255 255 / 0.52);
      padding: 7px 8px;
    }

    .bundle-slot-targets {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      min-width: 0;
    }

    .bundle-group {
      min-width: 0;
      display: grid;
      gap: 8px;
      border: 2px solid var(--line);
      background: rgb(255 255 255 / 0.58);
      padding: 8px;
      overflow: hidden;
    }

    .bundle-group[data-builder-bundle-state="customized"],
    .bundle-group[data-builder-bundle-state="partial"] {
      background: var(--yellow-soft);
    }

    .bundle-group-head {
      min-width: 0;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 8px;
      align-items: center;
    }

    .bundle-heading-button {
      min-width: 0;
      min-height: 38px;
      border: 0;
      box-shadow: none;
      background: transparent;
      padding: 0;
      text-align: left;
      overflow-wrap: anywhere;
    }

    .bundle-heading-button:hover {
      transform: none;
      box-shadow: none;
    }

    .bundle-atoms {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 8px;
      min-width: 0;
    }

    .lane[data-drop-active="true"] {
      background: var(--green-soft);
      outline: 4px solid rgb(12 105 92 / 0.22);
    }

    .metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .validation-panel {
      padding: 12px;
      border-bottom: 2px solid var(--line);
      background: #eef3f6;
    }

    .panel-head-actions {
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .panel-head-status[hidden] {
      display: none;
    }

    .details-link-button {
      width: 100%;
      min-height: 30px;
      padding: 5px 8px;
      border-style: dashed;
      box-shadow: none;
      background: rgb(255 255 255 / 0.62);
      text-transform: uppercase;
      font-size: 0.74rem;
      font-weight: 900;
    }

    .details-link-button:hover {
      transform: none;
      box-shadow: 2px 2px 0 rgb(21 17 11 / 0.14);
    }

    .details-section[data-builder-details-section-active="true"] {
      outline: 3px solid rgb(38 95 157 / 0.22);
      outline-offset: -3px;
    }

    .inspector-tabs {
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      padding: 8px;
      border-bottom: 2px solid var(--line);
      background: #eef3f6;
    }

    .inspector-tab {
      min-width: 0;
      min-height: 44px;
      border: 2px solid var(--line);
      background: rgb(255 255 255 / 0.72);
      box-shadow: 2px 2px 0 rgb(21 17 11 / 0.10);
      padding: 7px 6px;
      font-size: 0.72rem;
      text-transform: uppercase;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      line-height: 1.1;
    }

    .inspector-tab[aria-pressed="true"] {
      background: var(--green-soft);
      border-color: var(--green);
      box-shadow: inset 0 -4px 0 var(--green), 2px 2px 0 rgb(21 17 11 / 0.16);
    }

    .inspector-tab:hover {
      transform: none;
      box-shadow: inset 0 -4px 0 var(--blue), 2px 2px 0 rgb(21 17 11 / 0.16);
    }

    .audit-scroll {
      min-height: 0;
      display: grid;
      align-content: start;
      background: rgb(250 252 253 / 0.72);
      overflow: auto;
    }

    .audit-scroll[hidden] {
      display: none;
    }

    .audit-section {
      min-width: 0;
      border-bottom: 2px solid var(--line);
      background: rgb(255 253 246 / 0.62);
    }

    .audit-section:last-child {
      border-bottom: 0;
    }

    .audit-section[data-builder-inspector-active="false"] {
      display: none;
    }

    .pending-change-section[hidden] {
      display: none;
    }

    .audit-section-head {
      min-height: 34px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-bottom: 1px solid var(--soft-line);
      background: #eef3f6;
    }

    .audit-section-head h2 {
      font-size: 0.78rem;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .collapsible-section {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .collapsible-section > summary {
      min-height: 34px;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-bottom: 1px solid var(--soft-line);
      background: #eef3f6;
      cursor: pointer;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 0.78rem;
      line-height: 1.15;
    }

    .collapsible-section > summary::marker {
      content: "";
    }

    .collapsible-section > summary::before {
      content: "▾";
      width: 18px;
      height: 18px;
      display: inline-grid;
      place-items: center;
      border: 1px solid var(--line);
      background: var(--paper);
      font: 900 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .collapsible-section:not([open]) > summary::before {
      content: "▸";
    }

    .collapsible-section-body {
      min-width: 0;
      display: grid;
      gap: 8px;
      padding: 10px;
    }

    .current-assembly-section .collapsible-section {
      border-bottom: 2px solid var(--soft-line);
    }

    .current-assembly-section .collapsible-section:last-child {
      border-bottom: 0;
    }

    .details-drawer {
      min-height: 0;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      background: rgb(255 253 246 / 0.98);
      overflow: hidden;
    }

    .details-drawer[hidden] {
      display: none;
    }

    .details-tab-head {
      min-width: 0;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-bottom: 2px solid var(--line);
      background: #dce3e8;
    }

    .details-tab-head h2 {
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .details-tab-head [data-builder-details-close] {
      display: none;
    }

    .details-nav {
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 2px solid var(--line);
      background: #eef3f6;
    }

    .details-nav button {
      min-width: 0;
      min-height: 30px;
      padding: 5px 8px;
      box-shadow: none;
      overflow-wrap: anywhere;
      line-height: 1.1;
      white-space: normal;
      text-transform: uppercase;
      font-size: 0.72rem;
    }

    .details-nav button[aria-pressed="true"] {
      border-color: var(--blue);
      background: var(--blue-soft);
    }

    .details-body {
      min-height: 0;
      overflow: auto;
      display: grid;
      align-content: start;
      gap: 12px;
      padding: 12px;
      background: rgb(250 252 253 / 0.72);
    }

    .details-section {
      min-width: 0;
      border: 2px solid var(--line);
      background: rgb(255 255 255 / 0.72);
      overflow-wrap: anywhere;
    }

    .details-section > summary {
      border-bottom: 2px solid var(--line);
    }

    .details-section-body {
      min-width: 0;
      display: grid;
      gap: 8px;
      padding: 12px;
    }

    .details-section .surface-list,
    .details-section .port-list,
    .details-section .impact-list,
    .details-section .diagnostic-list,
    .details-section .command-list,
    .details-section .detail-body {
      padding: 0;
    }

    .activation-panel {
      display: grid;
      gap: 10px;
    }

    .activation-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .activation-field {
      display: grid;
      gap: 5px;
      min-width: 0;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 0.74rem;
    }

    .activation-field input,
    .activation-field select,
    .activation-field textarea {
      width: 100%;
      min-height: 36px;
      border: 2px solid var(--line);
      background: var(--paper);
      color: var(--ink);
      padding: 7px 8px;
      border-radius: 0;
      font: 700 0.78rem/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .activation-field textarea {
      min-height: 72px;
      resize: vertical;
    }

    .activation-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .activation-log {
      min-height: 86px;
      max-height: 210px;
      overflow: auto;
      border: 2px solid var(--soft-line);
      background: var(--paper);
      padding: 8px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font: 700 0.75rem/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .tui-panel {
      display: grid;
      gap: 10px;
    }

    .tui-bar {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .tui-stat {
      min-width: 0;
      border: 2px solid var(--soft-line);
      background: var(--paper);
      padding: 8px;
      overflow-wrap: anywhere;
    }

    .tui-stat strong {
      display: block;
      font-size: 0.72rem;
      text-transform: uppercase;
    }

    .tui-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .tui-controls select {
      min-height: 34px;
      border: 2px solid var(--line);
      background: var(--paper);
      padding: 6px 8px;
      font: 800 0.75rem/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .tui-terminal {
      min-height: 320px;
      height: min(46vh, 520px);
      border: 3px solid var(--line);
      background: #101418;
      color: #d8f3e4;
      padding: 8px;
      overflow: hidden;
      font: 700 0.78rem/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      box-sizing: border-box;
    }

    .tui-terminal .xterm {
      display: block;
      height: 100%;
      max-width: 100%;
    }

    .tui-terminal .xterm-viewport,
    .tui-terminal .xterm-screen {
      max-width: 100%;
    }

    .tui-fallback-output,
    .tui-log {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font: 700 0.74rem/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .tui-fallback-output {
      color: #d8f3e4;
    }

    .tui-log {
      max-height: 160px;
      overflow: auto;
      border: 2px solid var(--soft-line);
      background: var(--paper);
      padding: 8px;
    }

    @media (max-width: 980px) {
      .activation-grid {
        grid-template-columns: 1fr;
      }
      .tui-bar {
        grid-template-columns: 1fr;
      }
    }

    .validation-card {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) auto;
      gap: 10px;
      align-items: start;
      min-height: 76px;
      border: 3px solid var(--line);
      background: var(--paper);
      padding: 10px;
      overflow-wrap: normal;
      word-break: normal;
    }

    .validation-card[data-builder-validation-status="ready"] {
      background: var(--green-soft);
      border-color: var(--green);
    }

    .validation-card[data-builder-validation-status="blocked"] {
      background: var(--red-soft);
      border-color: var(--red);
    }

    .validation-card[data-builder-validation-status="review"] {
      background: var(--yellow-soft);
      border-color: var(--yellow);
    }

    .validation-title {
      display: block;
      font-size: 1.1rem;
      font-weight: 900;
      text-transform: uppercase;
      overflow-wrap: normal;
      word-break: keep-all;
    }

    .validation-copy {
      min-width: 0;
      max-width: 100%;
      display: block;
      overflow-wrap: normal;
      word-break: normal;
      white-space: normal;
    }

    .validation-copy .fine {
      display: block;
      margin-top: 6px;
      overflow-wrap: break-word;
      word-break: normal;
      white-space: normal;
    }

    .validation-action {
      min-width: 92px;
      text-align: center;
    }

    .metric {
      min-height: 76px;
      border: 2px solid var(--line);
      background: var(--paper);
      padding: 10px;
    }

    .metric strong {
      display: block;
      font-size: 1.8rem;
      line-height: 1;
    }

    .metric span {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font: 800 0.7rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      text-transform: uppercase;
    }

    .port-row,
    .provider-choice,
    .surface-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      border: 2px solid var(--soft-line);
      background: var(--paper);
      padding: 8px;
      min-height: 52px;
    }

    .port-row > span:first-child,
    .provider-choice > span:first-child,
    .surface-row > span:first-child {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .port-stage {
      display: grid;
      gap: 8px;
      border: 2px solid var(--line);
      background: rgb(255 255 255 / 0.45);
      padding: 8px;
    }

    .port-stage-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      min-height: 34px;
      border-bottom: 2px solid var(--line);
      padding-bottom: 8px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .stage-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 8px;
    }

    .stage-chip {
      border: 2px solid var(--soft-line);
      background: var(--paper);
      padding: 8px;
      min-height: 54px;
    }

    .stage-chip[data-missing="true"] {
      background: var(--red-soft);
      border-color: var(--red);
    }

    .guide-panel {
      display: grid;
      gap: 8px;
      padding: 12px;
      border-bottom: 2px solid var(--line);
      background: #eef3f6;
    }

    .board-guide-panel {
      padding: 0;
      border-bottom: 2px solid var(--line);
      background: #eef3f6;
    }

    .guide-shell {
      display: grid;
      gap: 8px;
      padding: 10px;
      background: #eef3f6;
    }

    .guide-shell-head {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      min-height: 36px;
    }

    .guide-shell-title {
      font-family: var(--display-font);
      text-transform: uppercase;
      font-size: 1rem;
    }

    .guide-shell-body {
      display: grid;
      gap: 8px;
    }

    .guide-shell-body[hidden] {
      display: none;
    }

    .board-guide-panel .guide-actions {
      grid-template-columns: auto minmax(0, 1fr) auto auto;
    }

    .guide-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(86px, 1fr));
      gap: 6px;
    }

    .guide-step {
      min-height: 44px;
      padding: 6px;
      border: 2px solid var(--soft-line);
      background: var(--paper);
      box-shadow: none;
      text-align: left;
    }

    .guide-step[aria-pressed="true"] {
      background: var(--green-soft);
      border-color: var(--green);
    }

    .guide-step[data-missing="true"] {
      background: var(--red-soft);
      border-color: var(--red);
    }

    .guide-step[data-builder-guide-step-status="ready"] {
      background: var(--green-soft);
      border-color: var(--green);
    }

    .guide-step[data-builder-guide-step-status="conflict"] {
      background: var(--red-soft);
      border-color: var(--red);
    }

    .guide-step-next {
      display: block;
      margin-top: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .guide-actions {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      gap: 8px;
      align-items: center;
    }

    .guide-acceptance {
      display: grid;
      gap: 6px;
      border: 2px solid var(--soft-line);
      background: var(--paper);
      padding: 8px;
    }

    .guide-acceptance[data-builder-guide-acceptance="ready"] {
      border-color: var(--green);
      background: var(--green-soft);
    }

    .guide-acceptance[data-builder-guide-acceptance="blocked"] {
      border-color: var(--red);
      background: var(--red-soft);
    }

    .guide-acceptance-checks {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
      gap: 6px;
    }

    .guide-acceptance-check {
      border: 2px solid var(--soft-line);
      background: rgba(255, 255, 255, 0.7);
      padding: 6px;
      min-height: 42px;
    }

    .guide-acceptance-check[data-ready="true"] {
      border-color: var(--green);
    }

    .guide-acceptance-check[data-ready="false"] {
      border-color: var(--red);
    }

    .port-row[data-covered="false"] {
      background: var(--red-soft);
      border-color: var(--red);
    }

    .port-row[data-covered="true"] {
      background: var(--green-soft);
      border-color: var(--green);
    }

    .port-row[data-ambiguous="true"] {
      background: var(--yellow-soft);
      border-color: var(--yellow);
    }

    .provider-choice {
      width: 100%;
      margin-top: 8px;
      text-align: left;
      border-color: var(--line);
    }

    .provider-choice[aria-pressed="true"] {
      background: var(--green-soft);
    }

    .provider-choice[data-builder-binding="candidate"] {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .command-list,
    .impact-list,
    .diagnostic-list {
      display: grid;
      gap: 8px;
      padding: 12px;
    }

    .command-row,
    .impact-row,
    .diagnostic {
      border: 2px solid var(--soft-line);
      background: var(--paper);
      padding: 8px;
      overflow-wrap: anywhere;
    }

    .command-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
    }

    .command-row button {
      min-width: 0;
      line-height: 1.1;
      white-space: normal;
    }

    .command-row code {
      font: 800 0.7rem/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      word-break: break-word;
    }

    .diagnostic[data-severity="error"] {
      border-left: 8px solid var(--red);
      background: var(--red-soft);
    }

    .diagnostic[data-severity="warning"] {
      border-left: 8px solid var(--yellow);
      background: var(--yellow-soft);
    }

    .diagnostic[data-severity="info"] {
      border-left: 8px solid var(--blue);
      background: var(--blue-soft);
    }

    .diagnostic-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .detail-body textarea,
    .details-section textarea {
      min-height: 220px;
      resize: vertical;
      font: 700 0.76rem/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .warning {
      border-left: 8px solid var(--red);
      background: var(--red-soft);
      padding: 8px 10px;
      font-weight: 800;
      overflow-wrap: anywhere;
    }

    .fine {
      color: var(--muted);
      font: 700 0.72rem/1.25 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    @media (max-width: 1180px) {
      .layout,
      .layout[data-builder-phase="start"],
      .layout[data-builder-phase="build"] {
        height: auto;
        min-height: calc(100vh - 90px);
        grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
        grid-template-areas:
          "materials assembly"
          "audit audit";
      }

      .layout-column-resizer {
        display: none;
      }

      .side-panel,
      .board-panel,
      .assembly-status-panel,
      .audit-panel {
        min-height: 420px;
      }

      .preview-dock {
        align-items: stretch;
        grid-template-columns: 1fr;
      }

      .preview-dock-actions {
        grid-template-columns: 1fr 1fr;
      }

      .flow-observer-body {
        grid-template-columns: 1fr;
      }

      .flow-side {
        border-left: 0;
        border-top: 2px solid var(--line);
      }
    }

    @media (max-width: 820px) {
      .top-inner,
      .layout,
      .layout[data-builder-phase="start"],
      .layout[data-builder-phase="build"],
      .metrics {
        grid-template-columns: 1fr;
      }

      .layout,
      .layout[data-builder-phase="start"],
      .layout[data-builder-phase="build"] {
        width: calc(100vw - 14px);
        height: auto;
        grid-template-areas:
          "materials"
          "assembly"
          "audit";
      }

      .details-drawer {
        min-height: 420px;
      }

      .details-nav {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .top-inner {
        padding: 14px 0;
      }

      .flow-observer {
        width: calc(100vw - 14px);
      }

      .flow-observer-bar {
        grid-template-columns: 1fr;
      }

      .flow-observer-actions {
        justify-content: stretch;
      }

      .flow-observer-actions button,
      #flowObserverToggleButton {
        width: 100%;
      }

      .flow-observer[data-flow-state="collapsed"] .flow-observer-bar {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .flow-observer[data-flow-state="collapsed"] #flowObserverToggleButton {
        width: auto;
      }

      .flow-observer[data-flow-state="collapsed"] #flowObserverTitle,
      .flow-observer[data-flow-state="collapsed"] #flowObserverPinState {
        display: none;
      }

      .flow-viewport {
        padding: 10px;
        perspective: none;
      }

      .flow-stage-list {
        display: grid;
      }

      .flow-rail,
      .flow-compare-side,
      .flow-overlay,
      .flow-diff-table {
        display: none;
      }
    }

    /* The builder defaults to one obvious path. Dense diagnostics stay available
       after a base harness is selected, but do not compete with the first action. */
    html:not([data-flow-observer-window="true"]) body {
      background: #f2f4f3;
      color: #202421;
      font-family: Bahnschrift, "Avenir Next", "DIN Alternate", sans-serif;
    }

    html:not([data-flow-observer-window="true"]) .app[data-harness-builder="loading"] {
      display: block;
    }

    html:not([data-flow-observer-window="true"]) .app[data-harness-builder="loading"] > :not(.builder-loading) {
      display: none !important;
    }

    .builder-loading {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #f2f4f3;
    }

    .builder-loading[hidden] {
      display: none;
    }

    .builder-loading-panel {
      width: min(420px, 100%);
      padding: 24px;
      border: 1px solid #aeb8b2;
      border-left: 5px solid var(--green);
      border-radius: 6px;
      background: #fff;
    }

    .builder-loading-panel strong {
      display: block;
      margin-bottom: 8px;
      font-size: 1.05rem;
    }

    .builder-loading-panel p {
      color: var(--muted);
      font: 600 0.8rem/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .builder-loading-track {
      height: 4px;
      margin-top: 18px;
      overflow: hidden;
      background: #d8dedb;
    }

    .builder-loading-track::after {
      content: "";
      display: block;
      width: 38%;
      height: 100%;
      background: var(--green);
      animation: builder-loading-slide 1.1s ease-in-out infinite alternate;
    }

    @keyframes builder-loading-slide {
      from { transform: translateX(0); }
      to { transform: translateX(165%); }
    }

    html:not([data-flow-observer-window="true"]) button {
      min-height: 38px;
      border-width: 1px;
      border-radius: 6px;
      box-shadow: none;
      font-weight: 700;
      transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease;
    }

    html:not([data-flow-observer-window="true"]) button:hover,
    html:not([data-flow-observer-window="true"]) button[aria-pressed="true"] {
      transform: none;
      box-shadow: none;
      border-color: var(--green);
      background: #edf6f2;
    }

    html:not([data-flow-observer-window="true"]) .top {
      position: relative;
      z-index: 20;
      border-bottom: 1px solid #cbd2ce;
      background: rgb(250 251 250 / 0.98);
    }

    html:not([data-flow-observer-window="true"]) .top-inner {
      width: min(1600px, calc(100vw - 32px));
      min-height: 66px;
      margin: 0 auto;
      padding: 10px 0;
      gap: 24px;
    }

    html:not([data-flow-observer-window="true"]) .brand {
      min-width: 0;
    }

    html:not([data-flow-observer-window="true"]) h1 {
      font-size: 1.35rem;
      line-height: 1.1;
      text-transform: none;
    }

    html:not([data-flow-observer-window="true"]) .sub {
      margin-top: 3px;
      font-size: 0.72rem;
      font-weight: 600;
    }

    html:not([data-flow-observer-window="true"]) .top-actions {
      align-items: center;
      flex-wrap: nowrap;
      gap: 7px;
    }

    html:not([data-flow-observer-window="true"]) #topCompileButton {
      min-width: 96px;
      background: #173f35;
      border-color: #173f35;
      color: #fff;
    }

    html:not([data-flow-observer-window="true"]) #topCompileButton:hover {
      background: #0c695c;
      border-color: #0c695c;
    }

    html:not([data-flow-observer-window="true"]) #runOpenButton,
    html:not([data-flow-observer-window="true"]) #exportButton,
    html:not([data-flow-observer-window="true"]) #localeToggle {
      padding-inline: 13px;
      background: #fff;
    }

    html:not([data-flow-observer-window="true"]) .more-menu {
      position: relative;
    }

    html:not([data-flow-observer-window="true"]) .more-menu summary {
      min-height: 38px;
      display: inline-flex;
      align-items: center;
      padding: 0 13px;
      border: 1px solid #aeb8b2;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
      font-weight: 700;
      list-style: none;
    }

    html:not([data-flow-observer-window="true"]) .more-menu summary::-webkit-details-marker {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .more-menu summary::after {
      content: "···";
      margin-left: 8px;
      color: var(--muted);
      letter-spacing: 2px;
    }

    html:not([data-flow-observer-window="true"]) .more-menu-popover {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      z-index: 40;
      width: 220px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      padding: 10px;
      border: 1px solid #aeb8b2;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 18px 48px rgb(26 40 34 / 0.18);
    }

    html:not([data-flow-observer-window="true"]) .more-menu-popover button,
    html:not([data-flow-observer-window="true"]) .menu-link {
      min-width: 0;
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 7px;
      border: 1px solid #d2d8d4;
      border-radius: 5px;
      background: #f8f9f8;
      color: var(--ink);
      text-align: center;
      text-decoration: none;
      font-weight: 700;
    }

    html:not([data-flow-observer-window="true"]) .more-menu-popover .chip {
      grid-column: 1 / -1;
      border: 0;
      background: #eef2ef;
    }

    html:not([data-flow-observer-window="true"]) .workflow {
      border-top: 1px solid #e1e5e2;
      background: #fff;
    }

    html:not([data-flow-observer-window="true"]) .workflow ol {
      width: min(760px, calc(100vw - 32px));
      min-height: 42px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: center;
      gap: 24px;
      margin: 0 auto;
      padding: 6px 0;
      list-style: none;
    }

    html:not([data-flow-observer-window="true"]) .workflow li {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #758078;
      font-size: 0.8rem;
    }

    html:not([data-flow-observer-window="true"]) .workflow li span {
      width: 24px;
      height: 24px;
      flex: 0 0 24px;
      display: grid;
      place-items: center;
      border: 1px solid #c7cfca;
      border-radius: 50%;
      background: #fff;
      font: 700 0.72rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-progress="choose"] [data-builder-workflow-step="choose"],
    html:not([data-flow-observer-window="true"]) .app[data-builder-progress="customize"] [data-builder-workflow-step="customize"],
    html:not([data-flow-observer-window="true"]) .app[data-builder-progress="validate"] [data-builder-workflow-step="validate"] {
      color: #173f35;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-progress="choose"] [data-builder-workflow-step="choose"] span,
    html:not([data-flow-observer-window="true"]) .app[data-builder-progress="customize"] [data-builder-workflow-step="customize"] span,
    html:not([data-flow-observer-window="true"]) .app[data-builder-progress="validate"] [data-builder-workflow-step="validate"] span {
      border-color: #173f35;
      background: #173f35;
      color: #fff;
    }

    html:not([data-flow-observer-window="true"]) .panel {
      border: 1px solid #c5cec8;
      border-radius: 8px;
      background: #fff;
      box-shadow: none;
    }

    html:not([data-flow-observer-window="true"]) .panel-head {
      min-height: 46px;
      padding: 9px 12px;
      border-bottom: 1px solid #d6dcd8;
      background: #f7f9f8;
    }

    html:not([data-flow-observer-window="true"]) .panel-head h2 {
      font-size: 0.84rem;
      text-transform: none;
    }

    html:not([data-flow-observer-window="true"]) .chip {
      min-height: 22px;
      border-color: #c5cec8;
      border-radius: 4px;
      font-size: 0.66rem;
    }

    html:not([data-flow-observer-window="true"]) .start-intro {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .top-actions > :not(#localeToggle) {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .layout {
      width: min(1040px, calc(100vw - 32px));
      height: auto;
      min-height: 0;
      display: block;
      margin: 40px auto 64px;
      padding: 0;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .board-panel,
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .right-stack,
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .layout-column-resizer {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .side-panel {
      min-height: 0;
      display: grid;
      grid-template-rows: auto auto auto;
      overflow: visible;
      border: 0;
      background: transparent;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .side-panel > .panel-head {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .start-intro {
      display: block;
      max-width: 680px;
      margin-bottom: 22px;
    }

    html:not([data-flow-observer-window="true"]) .start-intro .eyebrow {
      display: block;
      margin-bottom: 7px;
      color: var(--green);
      font: 800 0.72rem/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      text-transform: uppercase;
    }

    html:not([data-flow-observer-window="true"]) .start-intro h2 {
      font-size: 2rem;
      line-height: 1.08;
    }

    html:not([data-flow-observer-window="true"]) .start-intro p {
      max-width: 600px;
      margin-top: 8px;
      color: var(--muted);
      font-size: 0.96rem;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .preset-grid {
      order: 2;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      padding: 0;
      overflow: visible;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .preset-button {
      position: relative;
      min-height: 134px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      gap: 12px;
      padding: 18px;
      border: 1px solid #c5cec8;
      border-left-width: 5px;
      border-radius: 8px;
      background: #fff;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .preset-button:hover {
      background: #f9fbfa;
      border-color: var(--green);
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .preset-button[data-product="opencode"] { border-left-color: var(--green); }
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .preset-button[data-product="pi-mono"] { border-left-color: var(--red); }
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .preset-button[data-product="nanobot"] { border-left-color: var(--blue); }
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .preset-button[data-product="hermes-agent"] { border-left-color: var(--purple); }
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .preset-button[data-product="minimal"] { border-left-color: var(--yellow); }

    html:not([data-flow-observer-window="true"]) .preset-copy {
      min-width: 0;
      display: grid;
      gap: 9px;
      text-align: left;
    }

    html:not([data-flow-observer-window="true"]) .preset-copy strong {
      font-size: 1rem;
    }

    html:not([data-flow-observer-window="true"]) .preset-description {
      color: var(--muted);
      font-size: 0.8rem;
      font-weight: 500;
      line-height: 1.35;
    }

    html:not([data-flow-observer-window="true"]) .preset-arrow {
      color: var(--green);
      font-size: 1.2rem;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .start-actions {
      order: 3;
      width: fit-content;
      display: flex;
      gap: 9px;
      margin-top: 18px;
      padding: 0;
      border: 0;
      background: transparent;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .start-actions button {
      min-height: 40px;
      padding: 8px 14px;
      background: transparent;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .layout {
      width: min(1600px, calc(100vw - 28px));
      height: calc(100vh - 130px);
      min-height: 640px;
      grid-template-columns: minmax(250px, 280px) minmax(470px, 1fr) minmax(300px, 330px);
      grid-template-areas: "materials assembly audit";
      gap: 10px;
      padding: 12px 0;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .layout-column-resizer,
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .right-card-tabs {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .right-stack {
      grid-template-rows: minmax(0, 1fr);
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .right-card {
      min-height: 0;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .inspector-tabs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: 8px;
      border-bottom: 1px solid #d6dcd8;
      background: #fff;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] #pendingChangeTabButton[hidden] {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .inspector-tabs:has(#pendingChangeTabButton:not([hidden])) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .current-assembly-section > .audit-section-head {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .collapsible-section {
      border-width: 0 0 1px;
      border-color: #e0e5e2;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .collapsible-section summary {
      min-height: 42px;
      background: #fff;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .validation-card {
      min-height: 0;
      margin: 0;
      border-width: 1px;
      border-radius: 6px;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .filters {
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 9px;
      border-top-width: 1px;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] #atomSearch {
      grid-column: 1 / -1;
    }

    html:not([data-flow-observer-window="true"]) .filter-more {
      grid-column: 1 / -1;
    }

    html:not([data-flow-observer-window="true"]) .filter-more summary {
      width: fit-content;
      min-height: 30px;
      display: flex;
      align-items: center;
      padding: 4px 1px;
      color: var(--muted);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 700;
      list-style: none;
    }

    html:not([data-flow-observer-window="true"]) .filter-more summary::before {
      content: "+";
      margin-right: 6px;
      color: var(--green);
      font-size: 1rem;
    }

    html:not([data-flow-observer-window="true"]) .filter-more[open] summary::before {
      content: "−";
    }

    html:not([data-flow-observer-window="true"]) .filter-more summary::-webkit-details-marker {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .filter-more-fields {
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      padding-top: 4px;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .palette {
      padding: 9px;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .bundle-tile,
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .atom-tile {
      border-width: 1px;
      border-radius: 6px;
      box-shadow: none;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-tile {
      grid-template-rows: auto auto;
      gap: 10px;
      padding: 13px;
      border-left-width: 4px;
      background: #fff;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-tile::before,
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-tile::after {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-tile[data-builder-bundle-state="selected"] {
      background: #edf6f2;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-id,
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-meta,
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-slot-targets,
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-foot,
    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-action-hint {
      display: none;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-description {
      color: #59635d;
      font: 500 0.76rem/1.35 Bahnschrift, "Avenir Next", "DIN Alternate", sans-serif;
      -webkit-line-clamp: 3;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-actions {
      grid-template-columns: minmax(0, 1fr) 36px;
      gap: 7px;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .bundle-action-main {
      min-height: 34px;
      grid-template-columns: 22px minmax(0, 1fr);
      padding: 4px 8px 4px 5px;
      font-size: 0.74rem;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel .action-icon {
      width: 22px;
      height: 22px;
      border-width: 1px;
      box-shadow: none;
      font-size: 0.78rem;
    }

    html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] #activeFingerprint {
      max-width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    html:not([data-flow-observer-window="true"]) .flow-observer {
      display: none;
    }

    html[data-flow-observer-window="true"] .flow-observer {
      display: grid;
    }

    @media (max-width: 1180px) {
      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .layout {
        height: auto;
        grid-template-columns: minmax(250px, 290px) minmax(0, 1fr);
        grid-template-areas:
          "materials assembly"
          "audit audit";
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .right-stack {
        min-height: 360px;
      }
    }

    @media (max-width: 820px) {
      html:not([data-flow-observer-window="true"]) .top-inner {
        width: calc(100vw - 24px);
        grid-template-columns: minmax(0, 1fr) auto;
        padding: 10px 0;
      }

      html:not([data-flow-observer-window="true"]) .sub {
        display: none;
      }

      html:not([data-flow-observer-window="true"]) .top-actions {
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .brand {
        grid-column: 1 / -1;
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .top-inner {
        grid-template-columns: 1fr;
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .top-actions {
        justify-content: flex-start;
      }

      html:not([data-flow-observer-window="true"]) .workflow ol {
        width: calc(100vw - 24px);
        gap: 7px;
      }

      html:not([data-flow-observer-window="true"]) .workflow li {
        gap: 5px;
        font-size: 0.7rem;
      }

      html:not([data-flow-observer-window="true"]) .workflow li span {
        width: 20px;
        height: 20px;
        flex-basis: 20px;
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .layout {
        width: calc(100vw - 24px);
        margin: 28px auto 44px;
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .preset-grid {
        grid-template-columns: 1fr;
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .preset-button {
        min-height: 104px;
      }

      html:not([data-flow-observer-window="true"]) .start-intro h2 {
        font-size: 1.55rem;
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .start-actions {
        width: 100%;
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="start"] .start-actions button {
        flex: 1 1 0;
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .layout {
        width: calc(100vw - 16px);
        min-height: 0;
        grid-template-columns: 1fr;
        grid-template-areas:
          "materials"
          "assembly"
          "audit";
      }

      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .side-panel,
      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .board-panel,
      html:not([data-flow-observer-window="true"]) .app[data-builder-phase="build"] .right-stack {
        height: calc(100vh - 230px);
        min-height: 520px;
        max-height: 680px;
      }

      html:not([data-flow-observer-window="true"]) .more-menu-popover {
        position: fixed;
        top: 118px;
        right: 12px;
      }
    }
  </style>
</head>
<body>
  <main class="app" data-harness-builder="${options.dataSource === "api" ? "loading" : "ready"}" data-builder-locale="en" data-builder-phase="start" data-builder-progress="choose">
    <section class="builder-loading" id="builderLoading" role="status" aria-live="polite"${options.dataSource === "api" ? "" : " hidden"}>
      <div class="builder-loading-panel">
        <strong>Helix Builder</strong>
        <p id="builderLoadingMessage">Preparing builder data...</p>
        <div class="builder-loading-track" aria-hidden="true"></div>
      </div>
    </section>
    <header class="top">
      <div class="top-inner">
        <div class="brand">
          <h1>Helix Builder</h1>
          <p class="sub" id="appSubtitle">Assembly contracts · component library · port coverage · recipe export</p>
        </div>
        <div class="top-actions">
          <button type="button" id="localeToggle" data-action="toggle-locale" data-builder-locale="en" aria-label="Switch language">中文</button>
          <button type="button" id="runOpenButton" data-action="run-open">Run</button>
          <button type="button" id="topCompileButton" data-action="compile-harness" data-builder-compile="ready" data-builder-compile-status="idle">Compile</button>
          <button type="button" id="exportButton" data-action="download">Export</button>
          <details class="more-menu" id="moreMenu">
            <summary id="moreMenuButton">More</summary>
            <div class="more-menu-popover">
              <button type="button" id="topNewButton" data-action="new">New</button>
              <button type="button" id="presetButton" data-action="show-start">Presets</button>
              <button type="button" id="topImportButton" data-action="import">Import</button>
              <button type="button" id="saveButton" data-action="save">Save</button>
              <button type="button" id="clearButton" data-action="clear">Clear</button>
              <button type="button" data-action="right-card-status" id="moreStatusButton">Review</button>
              <button type="button" data-action="right-card-flow" id="moreFlowButton">Flow Observer</button>
              <button type="button" data-action="right-card-tui" id="moreTuiButton">TUI</button>
              <a class="menu-link" href="./index.html" id="indexButton">Index</a>
              <span class="chip" id="serverBadge" data-builder-server="static">STATIC</span>
            </div>
          </details>
          <input id="recipeImport" type="file" accept="application/json,.json" hidden>
        </div>
      </div>
      <nav class="workflow" id="builderWorkflow" aria-label="Harness building progress">
        <ol>
          <li data-builder-workflow-step="choose"><span>1</span><strong id="workflowChoose">Choose a base</strong></li>
          <li data-builder-workflow-step="customize"><span>2</span><strong id="workflowCustomize">Customize</strong></li>
          <li data-builder-workflow-step="validate"><span>3</span><strong id="workflowValidate">Validate &amp; export</strong></li>
        </ol>
      </nav>
    </header>
    <div class="builder-notice" id="builderNotice" data-builder-notice-status="info" role="status" aria-live="polite" hidden></div>

    <section class="wizard" id="newWizard" data-builder-wizard="ready" hidden>
      <div class="wizard-panel">
        <div class="panel-head">
          <h2 id="wizardTitle">新建 Harness</h2>
          <button type="button" id="wizardCloseButton" class="icon-button" title="关闭" data-action="wizard-cancel">×</button>
        </div>
        <div class="wizard-body">
          <div class="wizard-steps" id="wizardSteps"></div>
          <div class="wizard-grid" id="wizardTargets"></div>
          <div class="wizard-grid" id="wizardProfiles"></div>
          <div class="surface-list" id="wizardPreview"></div>
        </div>
        <div class="wizard-actions">
          <button type="button" id="wizardCancelButton" data-action="wizard-cancel">取消</button>
          <button type="button" id="wizardCreateButton" data-action="wizard-create">创建</button>
        </div>
      </div>
    </section>

    <section class="wizard" id="runModal" data-builder-live-run="ready" hidden>
      <div class="wizard-panel run-panel">
        <div class="panel-head">
          <h2 id="runTitle">立即体验</h2>
          <button type="button" id="runCloseButton" class="icon-button" title="关闭" data-action="run-cancel">×</button>
        </div>
        <div class="wizard-body run-form">
          <label><span id="runProviderLabel">Provider</span><select id="runProvider"><option value="openai-compatible">OpenAI-compatible</option><option value="openrouter">OpenRouter</option><option value="anthropic">Anthropic</option><option value="google">Google Gemini</option></select></label>
          <label><span id="runBaseURLLabel">Base URL</span><input id="runBaseURL" type="url" autocomplete="off"></label>
          <label><span id="runModelLabel">Model</span><input id="runModel" type="text" autocomplete="off"></label>
          <label><span id="runAPIKeyLabel">API Key</span><input id="runAPIKey" type="password" autocomplete="off"></label>
          <label><span id="runPromptLabel">Prompt</span><textarea id="runPrompt"></textarea></label>
          <label><span id="runMaxStepsLabel">Max steps</span><input id="runMaxSteps" type="number" min="1" max="5" value="2"></label>
          <div class="run-result" id="runResult" data-builder-live-run-result="idle"></div>
        </div>
        <div class="wizard-actions">
          <button type="button" id="runCancelButton" data-action="run-cancel">取消</button>
          <button type="button" id="runStartButton" data-action="run-start">运行</button>
        </div>
      </div>
    </section>

    <section class="wizard" id="removeImpactModal" data-builder-remove-impact="ready" hidden>
      <div class="wizard-panel impact-panel">
        <div class="panel-head">
          <h2 id="removeImpactTitle">删除影响分析</h2>
          <button type="button" id="removeImpactCloseButton" class="icon-button" title="关闭" data-action="remove-impact-cancel">×</button>
        </div>
        <div class="wizard-body">
          <div class="impact-preview" id="removeImpactBody"></div>
        </div>
        <div class="wizard-actions">
          <button type="button" id="removeImpactCancelButton" data-action="remove-impact-cancel">取消</button>
          <button type="button" id="removeImpactFocusButton" data-action="remove-impact-focus">查看候选</button>
          <button type="button" id="removeImpactBundleButton" data-action="remove-impact-bundle">删除同组</button>
          <button type="button" id="removeImpactConfirmButton" data-action="remove-impact-confirm">只删除这个</button>
        </div>
      </div>
    </section>

    <div class="floating-help" id="floatingHelp" data-builder-floating-help="ready" hidden></div>
    <section class="preview-dock" id="previewDock" data-builder-preview-dock="ready" aria-live="polite" hidden></section>

    <div class="layout" id="builderLayout" data-builder-layout="ready" data-builder-phase="start">
      <aside class="panel side-panel" data-builder-zone="materials">
        <div class="panel-head">
          <h2 id="sideTitle">开始构建</h2>
          <span class="chip" id="presetCount">0</span>
        </div>
        <div class="start-intro" id="startIntro">
          <span class="eyebrow" id="startEyebrow">Step 1</span>
          <h2 id="startTitle">Choose a base harness</h2>
          <p id="startDescription">Start with a proven agent harness. Every module can be replaced later.</p>
        </div>
        <div class="start-actions" id="startActions" data-builder-start="ready">
          <button type="button" id="startNewButton" data-action="new">从零新建</button>
          <button type="button" id="startImportButton" data-action="import">导入</button>
        </div>
        <div class="preset-grid" id="presetGrid">${renderBuilderPresetButtons(builderData)}</div>
        <div class="filters">
          <select id="libraryModeFilter" aria-label="Library view"></select>
          <input id="atomSearch" type="search" placeholder="filter bundle / atom id / port / package" aria-label="Filter materials">
          <details class="filter-more">
            <summary id="filterMoreLabel">More filters</summary>
            <div class="filter-more-fields">
              <select id="planeFilter" aria-label="Filter plane"></select>
              <select id="scopeFilter" aria-label="Filter scope"></select>
              <select id="viewFilter" aria-label="Filter atom state"></select>
            </div>
          </details>
        </div>
        <div class="palette" id="palette" data-builder-palette="ready"></div>
      </aside>

      <section class="panel board-panel" data-builder-zone="assembly">
        <div class="panel-head">
          <h2 id="boardTitle">装配板</h2>
          <span class="chip" id="activeFingerprint">fingerprint</span>
        </div>
        <div class="guide-panel board-guide-panel" id="boardGuidePanel" data-builder-guide="ready"></div>
        <div class="assembly-mode-toggle" id="assemblyModeToggle" data-builder-assembly-view-toggle="ready"></div>
        <div class="board" id="board" data-builder-board="ready"></div>
      </section>

      <div class="layout-column-resizer" id="layoutColumnResizer" data-builder-layout-resizer="ready" role="separator" aria-orientation="vertical" aria-label="调整中栏和右栏宽度" aria-controls="board rightStack" tabindex="0"></div>

      <aside class="panel right-stack assembly-status-panel audit-panel" id="rightStack" data-builder-zone="audit" data-builder-assembly-status="ready" data-builder-right-card-active="status">
        <div class="right-card-tabs" id="rightCardTabs" data-builder-right-card-tabs="ready" role="tablist" aria-label="右栏卡片">
          <button type="button" class="right-card-tab" id="rightStatusCardButton" data-action="right-card-status" data-builder-right-card-tab="status" aria-pressed="true" aria-controls="rightStatusCard">装配状态</button>
          <button type="button" class="right-card-tab" id="rightFlowCardButton" data-action="right-card-flow" data-builder-right-card-tab="flow" data-builder-assembly-flow-tab="ready" aria-pressed="false" aria-controls="rightFlowCard">Assembly Flow</button>
          <button type="button" class="right-card-tab" id="rightTuiCardButton" data-action="right-card-tui" data-builder-right-card-tab="tui" aria-pressed="false" aria-controls="rightTuiCard">TUI 测试</button>
        </div>

        <section class="right-card right-audit-card" id="rightStatusCard" data-builder-right-card="status" data-builder-right-card-visible="true">
          <div class="panel-head">
            <h2 id="auditTitle" data-builder-assembly-status-title="ready">装配状态</h2>
            <div class="panel-head-actions">
              <span class="chip panel-head-status" id="auditBadge" data-builder-status-badge="compat" hidden aria-hidden="true">status</span>
            </div>
          </div>
          <div class="inspector-tabs" id="inspectorTabs" data-builder-inspector-tabs="three-card-tabs" role="tablist" aria-label="右栏分类">
            <button type="button" class="inspector-tab" id="currentAssemblyTabButton" data-inspector-tab="blueprint" data-builder-inspector-tab="blueprint" data-builder-inspector-category="current" aria-pressed="true" aria-controls="currentAssemblySection">当前装配</button>
            <button type="button" class="inspector-tab" id="pendingChangeTabButton" data-inspector-tab="preview" data-builder-inspector-tab="preview" data-builder-inspector-category="pending" aria-pressed="false" aria-controls="pendingChangeSection" hidden>待确认更改</button>
            <button type="button" class="inspector-tab" id="detailsOpenButton" data-inspector-tab="details" data-builder-inspector-tab="details" data-builder-details-open="true" data-builder-inspector-category="details" aria-pressed="false" aria-expanded="false" aria-controls="detailsDrawer">详情与导出</button>
          </div>
          <div class="audit-scroll" data-builder-current-assembly="ready">
          <section class="audit-section current-assembly-section" id="currentAssemblySection" data-builder-current-assembly-section="ready" data-builder-inspector-panel="blueprint" data-builder-inspector-active="true">
            <div class="audit-section-head">
              <h2 id="blueprintTitle">当前装配</h2>
              <span class="chip" id="selectionBadge">none</span>
            </div>
            <details class="collapsible-section" data-builder-current-assembly-subsection="metrics">
              <summary><span id="metricsTitle">关键指标</span><span class="chip" id="metricsBadge">0</span></summary>
              <div class="collapsible-section-body"><div class="metrics" id="metrics"></div></div>
            </details>
            <details class="collapsible-section" data-builder-current-assembly-subsection="readiness" open>
              <summary><span id="readinessTitle">验收状态</span><span class="chip" id="readinessBadge">start</span></summary>
              <div class="validation-panel" id="validationPanel" data-builder-validation="ready"></div>
            </details>
            <details class="collapsible-section" data-builder-current-assembly-subsection="summary">
              <summary><span id="assemblySummaryTitle">装配摘要</span><span class="chip" id="summaryBadge">ready</span></summary>
              <div class="detail-body">
                <div id="detailPanel" data-builder-current-assembly-detail="ready"></div>
              </div>
            </details>
            <details class="collapsible-section" data-builder-current-assembly-subsection="diagnostics">
              <summary><span id="diagnosticsTitle">阻塞原因</span><span class="chip" id="diagnosticsBadge">0</span></summary>
              <div class="collapsible-section-body"><div id="warningList" data-builder-current-assembly-action="blocking-reason" data-builder-current-assembly-blocking-status="start" data-builder-current-assembly-diagnostic-count="0"></div></div>
            </details>
          </section>

          <section class="audit-section pending-change-section" id="pendingChangeSection" data-builder-pending-change="empty" data-builder-inspector-panel="preview" data-builder-inspector-active="false" hidden>
            <div class="audit-section-head">
              <h2 id="previewTitle">待确认更改</h2>
              <span class="chip" id="previewBadge">empty</span>
            </div>
            <details class="collapsible-section" data-builder-pending-change-subsection="impact" open>
              <summary><span id="pendingImpactTitle">影响确认</span><span class="chip" id="pendingImpactBadge">empty</span></summary>
              <div class="detail-body">
                <div id="previewPanel" data-builder-pending-change-panel="ready" data-builder-preview-tab="ready"></div>
              </div>
            </details>
          </section>
          </div>

          <section class="details-drawer" id="detailsDrawer" data-builder-details-drawer="closed" data-builder-details-model="single-panel" data-builder-details-layout="collapsible-sections" data-builder-details-state-source="current-render-pass" data-builder-details-sections-visible="all" data-builder-details-section-count="5" role="tabpanel" aria-labelledby="detailsOpenButton" hidden>
          <div class="details-tab-head">
            <h2 id="detailsTitle">详情与导出</h2>
            <button type="button" id="detailsCloseButton" class="icon-button" title="关闭" data-builder-details-close="true">×</button>
          </div>
          <div class="details-nav" data-builder-details-nav="ready" aria-label="详情分区">
            <button type="button" id="detailsNavMaterialsButton" data-builder-details-nav-target="materials" data-builder-details-section-target="materials" aria-pressed="true">物料清单</button>
            <button type="button" id="detailsNavAuditButton" data-builder-details-nav-target="audit" data-builder-details-section-target="audit" aria-pressed="false">审计证据</button>
            <button type="button" id="detailsNavRawButton" data-builder-details-nav-target="raw" data-builder-details-section-target="raw" aria-pressed="false">Raw Recipe</button>
            <button type="button" id="detailsNavCommandsButton" data-builder-details-nav-target="commands" data-builder-details-section-target="commands" aria-pressed="false">命令</button>
          </div>
          <div class="details-body">
            <details class="details-section collapsible-section" data-builder-details-section="materials" data-builder-details-materials="ready" data-builder-inspector-panel="bom" data-builder-inspector-active="true" open>
              <summary>
                <h2 id="bomTitle">物料清单</h2>
                <span class="chip" id="bomBadge">0</span>
              </summary>
              <div class="details-section-body">
                <div class="surface-list" id="bomList" data-builder-details-materials-list="ready" data-builder-bom="ready"></div>
              </div>
            </details>

            <details class="details-section collapsible-section" data-builder-details-section="audit" data-builder-details-audit="ready" data-builder-inspector-panel="audit" data-builder-inspector-active="true">
              <summary>
                <h2 id="coverageTitle">审计证据</h2>
                <span class="chip" id="coverageBadge">0/0</span>
              </summary>
              <div class="details-section-body">
                <div class="port-list" id="portList"></div>
                <div class="impact-list" id="impactPanel"></div>
                <div class="diagnostic-list" id="diagnosticList" data-builder-diagnostics="ready"></div>
              </div>
            </details>

            <details class="details-section collapsible-section" data-builder-details-section="raw" data-builder-details-raw="ready" data-builder-inspector-panel="raw" data-builder-inspector-active="true">
              <summary>
                <h2 id="detailTitle">Raw Recipe</h2>
                <span class="chip" id="rawRecipeBadge">JSON</span>
              </summary>
              <div class="details-section-body">
                <div class="preview-actions">
                  <button type="button" data-copy-raw-recipe="true">复制 JSON</button>
                  <button type="button" data-action="download">下载 JSON</button>
                </div>
                <textarea id="exportText" data-builder-export="ready" readonly></textarea>
              </div>
            </details>

            <details class="details-section collapsible-section" data-builder-details-section="commands" data-builder-details-commands="ready">
              <summary>
                <h2 id="commandTitle">命令</h2>
                <span class="chip" id="commandBadge">ready</span>
              </summary>
              <div class="details-section-body">
                <div class="command-list" id="commandList"></div>
              </div>
            </details>

            <details class="details-section collapsible-section" data-builder-details-section="activation" data-builder-details-activation="ready" data-builder-inspector-panel="activation" data-builder-inspector-active="true">
              <summary>
                <h2 id="activationTitle">激活</h2>
                <span class="chip" id="activationBadge">idle</span>
              </summary>
              <div class="details-section-body">
                <div id="activationPanel" class="activation-panel" data-builder-activation="ready" data-activation-panel="ready"></div>
              </div>
            </details>

          </div>
          </section>
        </section>

        <section class="right-card right-tui-card" id="rightTuiCard" data-builder-right-card="tui" data-builder-right-card-visible="false" data-builder-tui-dock="closed" hidden>
          <div class="audit-section-head right-tui-head">
            <h2 id="tuiTitle">TUI 测试</h2>
            <span class="chip" id="tuiBadge" data-builder-tui-status="idle">idle</span>
          </div>
          <div id="tuiPanel" class="tui-panel" data-builder-tui-panel="ready"></div>
        </section>

        <section class="right-card right-flow-card" id="rightFlowCard" data-builder-right-card="flow" data-builder-right-card-visible="false" data-builder-assembly-flow-card="ready" hidden>
          <div class="audit-section-head right-tui-head">
            <h2 id="flowCardTitle">Assembly Flow</h2>
            <span class="chip" id="flowCardBadge" data-builder-assembly-flow-mode="blueprint">Blueprint</span>
          </div>
          <div class="right-flow-panel" data-builder-assembly-flow-panel="ready">
            <div class="right-flow-hint">
              <strong id="flowCardHintTitle">Flow Observer</strong>
              <span class="fine" id="flowCardHintText">Open the collapsible observer below the assembly board.</span>
            </div>
            <div class="right-flow-actions" data-builder-assembly-flow-actions="ready">
              <button type="button" data-action="flow-observer-blueprint" data-builder-assembly-flow-mode-button="blueprint">Blueprint</button>
              <button type="button" data-action="flow-observer-trace" data-builder-assembly-flow-mode-button="trace">Trace</button>
              <button type="button" data-action="flow-observer-compare" data-builder-assembly-flow-mode-button="compare">Compare</button>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <section class="flow-observer" id="flowObserverDock" data-flow-state="collapsed" data-flow-depth="depth" data-flow-observer="ready" data-flow-draft-blueprint="false" data-flow-composition-claim="" aria-live="polite">
      <div class="flow-observer-bar">
        <button type="button" id="flowObserverToggleButton" data-action="flow-observer-toggle" aria-expanded="false" aria-controls="flowObserverBody">展开</button>
        <div class="flow-observer-title">
          <span id="flowObserverTitle">Flow Observer</span>
          <span class="fine" id="flowObserverSummary">collapsed</span>
          <span class="flow-observer-status" id="flowObserverStatus" data-flow-observer-status="ready">
            <span class="chip" id="flowObserverHealth" data-flow-health="pending">pending</span>
            <span class="chip" id="flowObserverDrift">0 drift</span>
            <span class="chip" id="flowObserverFinish">finish n/a</span>
            <span class="chip" id="flowObserverPinState">unpinned</span>
          </span>
        </div>
        <div class="flow-observer-actions">
          <label class="flow-observer-control flow-observer-control-wide" for="flowProductSelect" data-flow-product-selector="ready"><span id="flowProductSelectLabel">Product</span><select id="flowProductSelect" data-flow-product-select="ready" aria-labelledby="flowProductSelectLabel"></select></label>
          <button type="button" id="flowObserverBlueprintButton" data-action="flow-observer-blueprint">蓝图</button>
          <button type="button" id="flowObserverTraceButton" data-action="flow-observer-trace">Trace</button>
          <button type="button" id="flowObserverCompareButton" data-action="flow-observer-compare">对比</button>
          <button type="button" id="flowObserverNativeButton" data-action="flow-observer-native">原生</button>
          <label class="flow-observer-control flow-observer-control-wide" for="flowNativeArtifactPathInput" id="flowNativeArtifactPathField" data-flow-native-artifact-field="ready" hidden><span id="flowNativeArtifactPathLabel">Artifact</span><input id="flowNativeArtifactPathInput" data-flow-native-artifact-input="ready" aria-labelledby="flowNativeArtifactPathLabel" placeholder="docs/reports/task-parity-native-cadence-fixtures/manifest.json" /></label>
          <button type="button" id="flowCompareSideButton" data-action="flow-compare-layout" data-flow-compare-layout="side-by-side">Side</button>
          <button type="button" id="flowCompareOverlayButton" data-action="flow-compare-layout" data-flow-compare-layout="overlay">Overlay</button>
          <button type="button" id="flowCompareTableButton" data-action="flow-compare-layout" data-flow-compare-layout="diff-table">Table</button>
          <button type="button" data-action="flow-lane-filter" data-flow-lane-filter="surface">surface</button>
          <button type="button" data-action="flow-lane-filter" data-flow-lane-filter="session">session</button>
          <button type="button" data-action="flow-lane-filter" data-flow-lane-filter="prompt">prompt</button>
          <button type="button" data-action="flow-lane-filter" data-flow-lane-filter="provider">provider</button>
          <button type="button" data-action="flow-lane-filter" data-flow-lane-filter="tool">tool</button>
          <button type="button" data-action="flow-lane-filter" data-flow-lane-filter="runtime">runtime</button>
          <button type="button" id="flowObserverPinButton" data-action="flow-observer-pin" aria-pressed="false">Pin</button>
          <button type="button" id="flowObserverFullscreenButton" data-action="flow-observer-fullscreen">全屏</button>
          <button type="button" id="flowPromptDebugButton" data-action="flow-prompt-debug" data-flow-prompt-debug="ready" aria-pressed="false">Prompt debug</button>
        </div>
      </div>
      <div class="flow-observer-body" id="flowObserverBody">
        <div class="flow-viewport" id="flowObserverViewport"></div>
        <aside class="flow-side" id="flowObserverSide"></aside>
      </div>
    </section>
  </main>
  <script id="builder-data" type="application/json">${payload}</script>
  <script>
    (function () {
      var BOOTSTRAP = JSON.parse(document.getElementById("builder-data").textContent || "{}");

      function bootError(error) {
        var message = error && error.message ? error.message : String(error);
        document.body.innerHTML = '<main class="app" data-harness-builder="error"><section class="panel" style="margin:24px;"><div class="panel-head"><h2>Builder failed</h2><span class="chip">server</span></div><div class="detail-body"><div class="warning">' + message.replace(/&/g, "&amp;").replace(/</g, "&lt;") + '</div><button type="button" onclick="window.location.reload()">Retry</button></div></section></main>';
      }

      function setBootMessage(message) {
        var element = document.getElementById("builderLoadingMessage");
        if (element) element.textContent = message;
      }

      function startBuilder(DATA, SERVER) {
      var server = SERVER || { online: false, recipeDraftsUrl: "", harnessRunsUrl: "", harnessRunDefaultsUrl: "", harnessImpactUrl: "", harnessProfilesUrl: "", harnessTuiSessionsUrl: "", harnessFlowUrl: "" };
      function readInitialSearchParams() {
        try {
          return typeof URLSearchParams === "function" ? new URLSearchParams(window.location.search || "") : null;
        } catch (error) {
          return null;
        }
      }
      var initialSearchParams = readInitialSearchParams();
      function initialParam(name) {
        return initialSearchParams && initialSearchParams.get ? initialSearchParams.get(name) || "" : "";
      }
      function normalizedFlowMode(mode) {
        return mode === "blueprint" || mode === "trace" || mode === "native" || mode === "compare" ? mode : "";
      }
      function normalizedFlowCompareLayout(layout) {
        return layout === "side-by-side" || layout === "overlay" || layout === "diff-table" ? layout : "";
      }
      var flowStandaloneInitial = initialParam("flowObserver") === "1";
      var atomByID = new Map(DATA.atoms.map(function (atom) { return [atom.id, atom]; }));
      var portByID = new Map(DATA.ports.map(function (port) { return [port.id, port]; }));
      var bundleByID = new Map((DATA.bundles || []).map(function (bundle) { return [bundle.id, bundle]; }));
      var slotByID = new Map((DATA.slots || []).map(function (slot) { return [slot.id, slot]; }));
      var WIZARD_PRODUCTS = [
        { id: "minimal", labelKey: "product.minimal", product: "minimal", primarySurface: "cli", surfaces: { cli: "product.shell.minimal-cli" } },
        { id: "opencode", labelKey: "product.opencode", product: "opencode", primarySurface: "sdk", surfaces: { cli: "opencode.product-shell.sdk", sdk: "opencode.product-shell.sdk", tui: "opencode.product-shell.tui", web: "opencode.product-shell.web", server: "opencode.product-shell.server", desktop: "opencode.product-shell.desktop" } },
        { id: "pi-mono", labelKey: "product.pi", product: "pi-mono", primarySurface: "sdk", surfaces: { cli: "pi.product-shell.cli", sdk: "pi.product-shell.sdk", tui: "pi.product-shell.tui", webUI: "pi.product-shell.web-ui", server: "pi.product-shell.server", rpc: "pi.product-shell.rpc" } },
        { id: "nanobot", labelKey: "product.nanobot", product: "nanobot", primarySurface: "cli", surfaces: { cli: "nanobot.product-shell.cli", sdk: "nanobot.product-shell.sdk", tui: "nanobot.product-shell.tui", webUI: "nanobot.product-shell.web-ui", server: "nanobot.product-shell.server" } },
        { id: "hermes-agent", labelKey: "product.hermes", product: "hermes-agent", primarySurface: "sdk", surfaces: { cli: "hermes.product-shell.cli", sdk: "hermes.product-shell.sdk", tui: "hermes.product-shell.tui", apiServer: "hermes.product-shell.api-server", acp: "hermes.product-shell.acp", gateway: "hermes.product-shell.gateway", dashboard: "hermes.product-shell.web-dashboard" } }
      ].map(function (product) {
        var surfaces = {};
        Object.keys(product.surfaces).forEach(function (surface) {
          var shell = product.surfaces[surface];
          if (atomByID.has(shell)) surfaces[surface] = shell;
        });
        return Object.assign({}, product, { surfaces: surfaces });
      }).filter(function (product) { return Object.keys(product.surfaces).length > 0; });
      var WIZARD_PROFILES = [
        { id: "starter", kitID: "kit.starter", labelKey: "profile.starter", badgeKey: "profile.auto", fineKey: "profile.starter.fine" },
        { id: "bare", kitID: "kit.bare-chassis", labelKey: "profile.bare", badgeKey: "profile.manual", fineKey: "profile.bare.fine" },
        { id: "livecodebench", kitID: "kit.livecodebench", labelKey: "profile.livecodebench", badgeKey: "profile.test", fineKey: "profile.livecodebench.fine" },
        { id: "product", kitID: "kit.product", labelKey: "profile.product", badgeKey: "profile.product.badge", fineKey: "profile.product.fine" }
      ];
      var I18N = {
        zh: {
          "app.subtitle": "为模型组合、验证并导出 Harness",
          "action.new": "新建",
          "action.presets": "预设",
          "action.index": "文档",
          "action.import": "导入",
          "action.save": "保存",
          "action.run": "立即体验",
          "action.compile": "验证",
          "action.clear": "清空",
          "action.export": "导出",
          "action.more": "更多",
          "action.cancel": "取消",
          "action.create": "创建",
          "action.close": "关闭",
          "action.add": "添加",
          "action.remove": "移除",
          "action.copy": "复制",
          "action.back": "上一步",
          "action.all": "全部",
          "action.next": "下一步",
          "action.finish": "完成",
          "locale.aria": "切换到英文界面",
          "server.online": "在线",
          "server.static": "静态",
          "wizard.title": "新建 Harness",
          "side.start": "选择起点",
          "side.library": "模块库",
          "start.new": "从零构建",
          "start.eyebrow": "第 1 步",
          "start.title": "选择一个基础 Harness",
          "start.description": "从经过验证的真实 Agent Harness 开始，进入后可以替换任意模块。",
          "workflow.aria": "Harness 构建进度",
          "workflow.choose": "选择基础",
          "workflow.customize": "调整模块",
          "workflow.validate": "验证并导出",
          "preset.description.opencode": "完整的 Agent Harness，包含丰富的工具、会话和运行时编排。",
          "preset.description.pi-mono": "紧凑的 Agent Harness，拥有清晰、克制的 turn loop。",
          "preset.description.nanobot": "轻量 Python Agent，覆盖 CLI、TUI、Web 与服务端入口。",
          "preset.description.hermes-agent": "工具能力丰富的自主 Agent，覆盖 gateway 与 dashboard。",
          "preset.description.minimal": "最小中立底盘，适合从干净的结构开始组合。",
          "preset.description.hybrid": "OpenCode 与 Pi 的实验性组合，用于探索跨 Harness 配方。",
          "start.boardTitle": "选择一个起点",
          "start.boardBody": "先在左侧选择预设、从零新建或导入 recipe，随后再进入 Harness 底盘装配。",
          "start.blueprintTitle": "等待选择",
          "start.blueprintBody": "选择起点后，这里只显示当前装配状态和下一步建议；底层清单、审计和导出在详情里。",
          "board.title": "当前 Harness",
          "assemblyView.aria": "装配分类",
          "assemblyView.flow": "流程",
          "assemblyView.technical": "技术",
          "audit.title": "检查结果",
          "audit.badge": "状态",
          "details.button": "详情与导出",
          "details.title": "详情与导出",
          "details.materials": "物料清单",
          "details.audit": "审计证据",
          "details.raw": "Raw Recipe",
          "details.commands": "命令",
          "details.copyJSON": "复制 JSON",
          "details.downloadJSON": "下载 JSON",
          "details.viewAll": "查看全部",
          "details.navAria": "详情分区",
          "inspector.tabsAria": "右栏分类",
          "inspector.blueprint": "当前装配",
          "inspector.preview": "待确认更改",
          "inspector.activation": "激活",
          "inspector.tui": "TUI",
          "inspector.bom": "物料清单",
          "inspector.audit": "审计证据",
          "inspector.raw": "Raw Recipe",
          "blueprint.title": "当前装配",
          "blueprint.product": "当前 Harness",
          "blueprint.stageSummary": "工序状态",
          "blueprint.nextSlot": "下一缺口",
          "blueprint.emptySlots": "空槽 / 缺口",
          "blueprint.installedBundles": "已装组合块",
          "blueprint.latestImpact": "最近影响",
          "flow.title": "Flow Observer",
          "flow.tab": "Assembly Flow",
          "flow.cardHintTitle": "装配图入口",
          "flow.cardHintText": "在独立窗口打开 Flow Observer，查看 Blueprint、Trace 与原生对比。",
          "flow.openWindow": "新窗口",
          "flow.expand": "展开",
          "flow.collapse": "收起",
          "flow.fullscreen": "全屏",
          "flow.restore": "还原",
          "flow.blueprint": "蓝图",
          "flow.trace": "Trace",
          "flow.compare": "对比",
          "flow.native": "原生",
          "flow.pin": "Pin",
          "flow.unpin": "Unpin",
          "flow.pinned": "pinned",
          "flow.unpinned": "unpinned",
          "flow.health.ok": "ok",
          "flow.health.drift": "drift",
          "flow.health.loading": "loading",
          "flow.health.pending": "pending",
          "flow.health.error": "error",
          "flow.driftCount": "{count} drift",
          "flow.finish": "finish {finish}",
          "flow.mode.blueprint": "assembled blueprint",
          "flow.mode.trace": "assembled trace",
          "flow.mode.native": "native flow",
          "flow.mode.compare": "assembled / native compare",
          "flow.compareLayout.side-by-side": "并排",
          "flow.compareLayout.overlay": "叠加",
          "flow.compareLayout.diff-table": "表格",
          "flow.compare.source.original": "original",
          "flow.compare.source.assembled": "assembled",
          "flow.product.label": "产品",
          "flow.product.current": "当前装配",
          "flow.evidence.artifact": "证据路径",
          "flow.evidence.externalArtifact": "External capture 路径",
          "flow.tooltip.product": "切换要观察的 harness 产品。",
          "flow.tooltip.blueprint": "查看当前产品的静态 assembled blueprint。",
          "flow.tooltip.trace": "查看最近一次 assembled run 产生的 trace。",
          "flow.tooltip.compare": "对比 assembled flow 与 native flow。",
          "flow.tooltip.native": "查看 native harness / capture 的 flow。",
          "flow.tooltip.evidence": "选择 native / compare 使用的证据来源。",
          "flow.tooltip.promptDebug": "显示或隐藏 prompt 证据里的完整 prompt 片段。",
          "flow.promptDebug.on": "Prompt debug 开",
          "flow.promptDebug.off": "Prompt debug 关",
          "flow.lane.surface": "surface",
          "flow.lane.session": "session",
          "flow.lane.prompt": "prompt",
          "flow.lane.provider": "provider",
          "flow.lane.tool": "tool",
          "flow.lane.runtime": "runtime",
          "flow.lane.stageCount": "{count} stages",
          "flow.lane.driftCount": "{count} drift",
          "flow.lane.collapsed": "已收起",
          "flow.summary.collapsed": "{product} · {stages} stages · {mode}",
          "flow.side.title": "观察摘要",
          "flow.side.lossiness": "可观测性",
          "flow.side.evidence": "证据",
          "flow.side.nativeEvidence": "原生证据",
          "flow.side.diffs": "差异",
          "flow.side.selected": "当前选择",
          "flow.side.timeline": "最近 trace",
          "flow.side.traceMetrics": "Trace 指标",
          "flow.side.emptyDiffs": "暂无差异或尚未加载对比。",
          "flow.side.noSelection": "还没有选中 atom / slot。",
          "flow.traceMetric.stepAttempt": "step / attempt",
          "flow.traceMetric.providerRequests": "provider requests",
          "flow.traceMetric.toolBatch": "tool batch",
          "flow.traceMetric.finish": "finish reason",
          "flow.traceMetric.tokenEstimate": "token estimate",
          "flow.traceMetric.compaction": "compaction",
          "flow.nativeEvidence.linked": "已链接",
          "flow.nativeEvidence.missing": "no native evidence linked",
          "flow.nativeEvidence.unverified": "校验失败",
          "flow.lossiness.lossless": "精确事件或存储证据。",
          "flow.lossiness.semantic": "语义级等价，内部细节未完全暴露。",
          "flow.lossiness.aggregated": "聚合证据，只能看到边界或摘要。",
          "flow.lossiness.inferred": "从外部可见结果保守推断。",
          "flow.lossiness.unobservable": "当前没有可靠原生证据。",
          "flow.noTrace": "尚未捕获 assembled trace；运行期 trace collector 接入后会在这里显示 event timeline。",
          "flow.traceRun": "最近运行：{finish} · {steps} steps",
          "flow.traceCaptured": "{events} events · {observed} observed stages",
          "flow.loading": "正在加载 flow graph...",
          "flow.error": "Flow graph 加载失败：{message}",
          "current.metrics": "关键指标",
          "current.readiness": "验收状态",
          "current.summary": "装配摘要",
          "current.diagnostics": "阻塞原因",
          "pending.impact": "影响确认",
          "bom.title": "物料清单",
          "bom.bundles": "组合块",
          "bom.atoms": "原子块",
          "bom.implementationStates": "实现状态",
          "bom.productShells": "产品外壳",
          "bom.bindings": "绑定",
          "raw.title": "Raw Recipe",
          "coverage.title": "审计证据",
          "detail.title": "细节 / 导出",
          "command.title": "命令 / 影响",
          "filter.search": "筛选 bundle / atom id / 端口 / package",
          "filter.more": "更多筛选",
          "filter.searchAria": "筛选原料",
          "library.bundle": "组合块",
          "library.atom": "原子块",
          "library.port": "端口",
          "filter.allPlanes": "全部层",
          "filter.allScopes": "全部作用域",
          "filter.allAtoms": "全部组件",
          "filter.selected": "已选",
          "filter.replaceable": "可替换",
          "filter.missingProvider": "缺 provider",
          "filter.empty": "没有符合当前筛选的候选方块。可以切回全部层，或切换原子块/端口视图继续检查底层候选。",
          "bundle.atoms": "{count} atoms",
          "bundle.ports": "{count} ports",
          "bundle.expand": "展开 atoms",
          "bundle.selected": "已选组合块",
          "bundle.partial": "部分选择",
          "bundle.customized": "已自定义",
          "bundle.source.explicit": "显式",
          "bundle.source.inferred": "推断",
          "bundle.source.untracked": "未跟踪",
          "bundle.loose": "Loose atoms",
          "loose.title": "Loose / 未分配到槽位",
          "loose.known": "未分配到槽位",
          "loose.unknown": "导入未知",
          "loose.reason.unmatched": "无法匹配任何槽位",
          "loose.reason.imported": "catalog 外部 atom",
          "bundle.add": "添加",
          "bundle.remove": "移除",
          "bundle.complete": "补齐",
          "bundle.replaceFamily": "替换",
          "bundle.keepAtoms": "保留底层 atoms",
          "bundle.promote": "提升为组合块",
          "bundle.promote.title": "可提升为组合块",
          "bundle.promote.fine": "{bundle} 的 atoms 已完整选中，可作为一个装配部件跟踪。",
          "slot.empty": "空槽",
          "slot.installed": "已装",
          "slot.partial": "部分",
          "slot.conflict": "冲突",
          "slot.customized": "自定义",
          "slot.noBundle": "未装组合块",
          "slot.candidates": "{count} 候选",
          "slot.ports": "{count} ports",
          "slot.installTarget": "装入 {slot}",
          "slot.replaceTarget": "替换 {slot}",
          "slot.select": "选择槽位",
          "slot.replacement": "替换候选",
          "slot.boundProvider": "绑定 provider",
          "slot.warnings": "{count} 风险",
          "slot.warning.missing": "缺失 {ports}",
          "slot.warning.conflict": "冲突 {ports}",
          "slot.warning.binding": "绑定缺失 {ports}",
          "slot.warning.customized": "已自定义组合块",
          "slot.warning.removal": "卸下会缺失 {ports}",
          "slot.expandAtoms": "展开 {count} atoms",
          "slot.collapseAtoms": "收起 atoms",
          "slot.atomRole.installed": "当前实现",
          "slot.atomRole.optional": "可选变体",
          "slot.atomRole.variant": "备选实现",
          "audit.activeAtom": "活动原子块",
          "audit.activeAtomEmpty": "从已装槽位展开并选择一个 atom，可查看底层零件审计。",
          "audit.provides": "提供",
          "audit.consumes": "依赖",
          "preview.title": "待确认更改",
          "preview.emptyTitle": "没有待确认更改",
          "preview.emptyBody": "点击装入、卸下或替换 provider 后，确认前的影响会显示在这里。",
          "preview.badgeEmpty": "空",
          "preview.badgeActive": "待确认",
          "preview.install": "将装入",
          "preview.remove": "将卸下",
          "preview.replaceFamily": "将替换同组",
          "preview.family": "互斥组",
          "preview.oldBundles": "将卸下旧组合块",
          "preview.newBundle": "新组合块",
          "preview.targetSlots": "目标槽位",
          "preview.newAtoms": "新增 atoms",
          "preview.removedAtoms": "移除 atoms",
          "preview.sharedAtoms": "共享 atoms",
          "preview.binds": "会绑定 ports",
          "preview.bindingChanges": "绑定变更",
          "preview.conflicts": "需确认",
          "preview.breaks": "会缺失",
          "preview.requiredRemoveWarning": "此组合块提供必需端口，确认卸下会让 harness 缺失：{ports}",
          "preview.bindingTitle": "待确认绑定更改",
          "preview.bindingCandidate": "候选 provider",
          "preview.confirmBinding": "确认替换",
          "preview.confirmInstall": "确认装入",
          "preview.confirmRemove": "确认卸下",
          "preview.confirmReplaceFamily": "确认替换同组",
          "preview.cancel": "取消",
          "activation.title": "激活",
          "activation.profile": "Profile",
          "activation.workspaceDir": "Workspace path",
          "activation.storageDir": "Storage path",
          "activation.permissionSummary": "权限摘要",
          "activation.provider": "Provider",
          "activation.model": "Model",
          "activation.baseURL": "Base URL",
          "activation.apiKeyEnv": "API key env",
          "activation.telegramMode": "Telegram mode",
          "activation.botTokenEnv": "Bot token env",
          "activation.allowedChat": "Allowed chat",
          "activation.webhookURL": "Webhook URL",
          "activation.webhookSecretEnv": "Webhook secret env",
          "activation.smokeText": "Smoke text",
          "activation.install": "安装 Profile",
          "activation.configureProvider": "配置 Provider",
          "activation.configureTelegram": "配置 Telegram",
          "activation.status": "刷新状态",
          "activation.logs": "查看日志",
          "activation.smoke": "本地 Smoke",
          "activation.start": "启动 Gateway",
          "activation.stop": "停止 Gateway",
          "activation.restart": "重启 Gateway",
          "activation.static": "需要在线 Builder",
          "activation.idle": "等待激活",
          "activation.busy": "执行中",
          "activation.installed": "Profile 已安装",
          "activation.providerSaved": "Provider 已保存",
          "activation.telegramSaved": "Telegram 已保存",
          "activation.statusLoaded": "状态已刷新",
          "activation.logsLoaded": "日志已刷新",
          "activation.smokeOK": "本地 Smoke 通过",
          "activation.smokeFailed": "本地 Smoke 失败",
          "activation.gatewayStarted": "Gateway 已启动",
          "activation.gatewayStopped": "Gateway 已停止",
          "activation.gatewayRestarted": "Gateway 已重启",
          "activation.error": "激活失败",
          "activation.none": "未配置",
          "metric.atoms": "组件",
          "metric.coveredPorts": "已覆盖端口",
          "metric.missingPorts": "缺失端口",
          "metric.interfaces": "界面",
          "selection.atoms": "{count} 个组件",
          "state.missing": "缺失",
          "state.bound": "已绑定",
          "state.swap": "替换",
          "state.add": "添加",
          "state.selectedAtom": "已选组件",
          "state.addAtomAndBind": "添加组件并绑定",
          "state.noSelectedProvider": "没有已选 provider",
          "state.preset": "预设",
          "stage.interface": "界面",
          "stage.session": "会话",
          "stage.provider": "Provider",
          "stage.prompt": "Prompt",
          "stage.tools": "工具",
          "stage.ui": "UI",
          "stage.runtime": "运行时",
          "stage.acceptance": "验收",
          "stage.expand": "展开 {stage}",
          "stage.collapse": "收起 {stage}",
          "guide.stageReady": "已装 {ready}/{total}",
          "guide.title": "装配引导",
          "guide.overview": "工序总览",
          "guide.expand": "展开装配引导",
          "guide.collapse": "收起装配引导",
          "guide.openStage": "选择一个工序开始引导",
          "guide.gap": "缺口 {count}",
          "guide.conflict": "冲突 {count}",
          "guide.next": "下一步：{slot}",
          "guide.ready": "就绪",
          "guide.acceptance": "装配验收",
          "guide.acceptanceReady": "可验收",
          "guide.acceptanceBlocked": "待处理",
          "guide.acceptanceSummary": "{ready}/{total} 检查",
          "guide.acceptance.validate": "Validate ready",
          "guide.acceptance.ports": "必需端口已覆盖",
          "guide.acceptance.recipe": "Recipe export ready",
          "guide.acceptance.commands": "Run/test command ready",
          "lane.interface": "界面",
          "lane.agent-loop": "Agent Loop",
          "lane.config": "配置",
          "lane.conformance": "一致性",
          "lane.event": "事件",
          "lane.foundation": "基础",
          "lane.hook": "Hook",
          "lane.identity": "身份",
          "lane.prompt": "Prompt",
          "lane.task": "任务",
          "lane.trace": "Trace",
          "lane.turn": "Turn",
          "lane.ui": "UI",
          "lane.loose": "散装",
          "lane.runtime": "运行时",
          "lane.session": "会话",
          "lane.provider": "Provider",
          "lane.tool": "工具",
          "lane.tools": "工具",
          "lane.product": "产品",
          "lane.help.title": "查看板块说明",
          "help.title": "查看说明",
          "help.bundle.generic": "{label}：{description}",
          "help.bundle.sessionMemory": "内存会话底座：把 session 暂存在内存里，包含消息存储、读写、分支、上下文选择和 transcript 投影。适合开发、测试和轻量 harness。",
          "help.bundle.productSession": "{product} 会话适配层：把该产品自己的 session 语义接到通用 harness，包括 ID、存储、分支、分页、上下文和消息片段格式。",
          "help.bundle.productProvider": "{product} Provider 适配层：把该产品自己的模型、鉴权、请求格式、流式解析、usage 和事件投影接到通用 provider 槽位。",
          "help.bundle.productShells": "{product} 入口外壳：CLI、SDK、TUI、Web、Server 等用户入口。选择它决定这个 harness 从哪里被使用。",
          "help.bundle.providerCommon": "通用 Provider 组合块：负责模型调用需要的传输、鉴权、模型注册、请求格式、流式解析和 usage 统计。",
          "help.bundle.toolCommon": "工具组合块：负责文件系统、shell、权限、schema、执行器和结果格式，决定 agent 能调用哪些外部动作。",
          "help.bundle.promptCommon": "Prompt 组合块：负责 system prompt、资源加载、上下文和工具说明，决定模型每轮看到什么。",
          "help.slot.generic": "{slot} 槽位需要一个能提供 {port} 的块。装配时必须覆盖这个端口，recipe 才能通过验证。",
          "help.slot.productShell": "产品入口槽位：决定 harness 暴露为 CLI、SDK、TUI、Web、Server 还是其他入口。",
          "help.slot.sessionID": "Session ID Generator：负责生成或恢复每个会话的稳定 ID，后续读写、事件和日志都会用它追踪同一段对话。",
          "help.slot.sessionStore": "Session Store：保存会话的消息、事件和分支状态，可以是内存、JSONL、SQLite 或产品原生存储。",
          "help.slot.sessionReader": "Session Reader：负责按会话 ID 读取历史消息和状态，让下一轮模型能拿到上下文。",
          "help.slot.sessionWriter": "Session Writer：负责把用户消息、assistant 输出、工具结果和事件写回 session。",
          "help.slot.sessionBranch": "Session Branch：负责会话分支、切换和回溯，适合多轮编辑、fork 或恢复上下文。",
          "help.slot.sessionCompaction": "Session Compaction：负责压缩长上下文，避免历史太长时超出模型窗口。",
          "help.slot.providerAuth": "Provider Auth：决定 API key、Bearer token 或 query key 怎样附加到模型请求。替换它会改变凭据进入 provider 的方式。",
          "help.slot.providerModel": "Model Provider / Registry：负责选择模型 ID、能力表和供应商元信息。",
          "help.slot.providerTransport": "Provider Transport：负责把请求发到模型供应商，例如 fetch、cassette 回放或产品原生 transport。",
          "help.slot.providerRequest": "Provider Request Shape：负责把内部消息转换成供应商接受的请求 JSON。",
          "help.slot.providerStream": "Provider Stream：负责执行模型请求并返回流式事件或最终响应。",
          "help.slot.providerParser": "Provider Stream Parser：负责把 SSE、JSONL 或 cassette 输出解析成统一事件。",
          "help.slot.toolRegistry": "Tool Registry：负责注册工具定义和权限，让 agent 知道可以调用哪些工具。",
          "help.slot.filesystem": "Filesystem：负责限定工作区内的文件读写边界。",
          "help.slot.processRunner": "Process Runner：负责运行 shell/进程，并把 stdout、stderr 和退出码转换成工具结果。",
          "help.slot.prompt": "Prompt 槽位：负责组装 system/developer/tool instructions 和资源上下文。",
          "help.slot.ui": "UI 槽位：负责把运行状态映射成 TUI、Web、HTML 或其他界面输出。",
          "help.slot.runtime": "Runtime 槽位：负责生命周期、注册表、装配图和运行底盘。",
          "help.atom.generic": "原子块：提供 {provides}，依赖 {consumes}。它是组合块内部的底层零件，可单独替换但需要重新检查端口覆盖。",
          "help.atom.noConsumes": "无额外依赖",
          "help.action.install": "装入会添加这个组合块包含的 atoms，并把它能提供的端口接到当前 harness。",
          "help.action.remove": "卸下会移除这个组合块独占的 atoms；如果这些 atoms 还被其他组合块共享，会保留共享部分。",
          "help.action.complete": "补齐会把这个组合块缺失的 atoms 加回来，使它重新成为完整组合块。",
          "help.action.replace": "替换会把当前槽位换成这个候选组合块；替换后要检查 provider 绑定和必需端口是否仍然通过。",
          "help.action.add": "添加会把这个组合块作为一个新的装配部件放进 harness。",
          "help.status.customized": "自定义表示这个组合块不是完整原样：有些 atom 被删掉、替换，或通过底层 atom 手动拼出来。",
          "help.status.partial": "部分选择表示只选中了这个组合块的一部分 atom，还不是完整装配件。",
          "help.status.selected": "已选表示这个组合块完整装入，并会作为 bundle ref 出现在导出的 recipe 里。",
          "help.source.explicit": "显式表示用户直接装入了这个组合块，导出 recipe 时会保留 bundle ref。",
          "help.source.inferred": "推断表示系统发现当前 atoms 可以组合成该 bundle；可以提升为组合块以便后续整体管理。",
          "help.source.untracked": "未跟踪表示这些 atoms 当前没有作为组合块管理，删除或替换时要按底层 atom 检查影响。",
          "help.candidateBundle": "候选组合块：点击后会把这一整组相关 atoms 装进当前槽位，而不是一个一个手动添加。",
          "help.providerChoice": "候选 provider atom：点击后会把它绑定到当前端口。单 provider 槽位只应保留一个有效候选。",
          "lane.description.default": "{lane} 板块承载同一类 lego 块，用来帮助你按职责检查装配是否完整。",
          "lane.description.interface": "界面板块放 CLI、TUI、GUI、SDK、Server 等入口外壳；它们是同一个 harness 的不同使用界面。",
          "lane.description.agent-loop": "Agent Loop 管理一轮任务里的模型调用、工具执行、重试、继续生成和停止条件，是 harness 的调度中枢。",
          "lane.description.config": "配置板块承载环境变量、策略开关、路径和运行参数，让同一套装配能在不同部署里调整行为。",
          "lane.description.conformance": "一致性板块放验证 fixture 和 parity 检查，用来确认拼出的 harness 没有偏离原产品契约。",
          "lane.description.event": "事件板块负责事件封装、日志投递和状态变化记录，是回放、审计和 UI 同步的基础。",
          "lane.description.foundation": "基础板块提供通用类型、错误模型、序列化和跨模块约定，其他积木会依赖这些底座。",
          "lane.description.hook": "Hook 板块提供扩展点和生命周期插槽，可把 prompt、工具、上下文或产品特定行为接入主流程。",
          "lane.description.identity": "身份板块处理 workspace、clock、id generator 等身份与时间来源，保证 session 和事件能被稳定追踪。",
          "lane.description.product": "产品板块放产品专属适配块；它们不是单独 harness，而是给同一 harness 增加产品语义。",
          "lane.description.prompt": "Prompt 板块组合 system prompt、资源注入、上下文选择和提示策略，影响模型看到什么。",
          "lane.description.provider": "Provider 板块负责模型供应商、请求传输、流式输出和凭据边界。",
          "lane.description.runtime": "运行时板块提供执行环境、生命周期服务和跨组件注册，是装配后的运行底盘。",
          "lane.description.session": "会话板块管理消息、分支、压缩、存储和读取，是用户交互历史的状态层。",
          "lane.description.task": "任务板块描述可运行的工作负载、评测任务和 parity 场景。",
          "lane.description.tool": "工具板块注册 shell、文件系统、动态工具桥等能力，决定 agent 可以调用什么外部动作。",
          "lane.description.tools": "工具板块注册 shell、文件系统、动态工具桥等能力，决定 agent 可以调用什么外部动作。",
          "lane.description.trace": "Trace 板块记录调用链、诊断事件和可观测性数据，用于调试拼装后的行为。",
          "lane.description.turn": "Turn 板块处理单轮对话的输入、输出、消息格式和步骤结果，是 agent-loop 内部的数据流。",
          "lane.description.ui": "UI 板块承载界面渲染、状态映射和交互适配，可服务 TUI、GUI 或 Web 入口。",
          "product.minimal": "最小 Harness",
          "product.opencode": "OpenCode Harness",
          "product.pi": "Pi Harness",
          "product.nanobot": "Nanobot Harness",
          "product.hermes": "Hermes Agent Harness",
          "profile.starter": "推荐起步",
          "profile.bare": "空白骨架",
          "profile.livecodebench": "LiveCodeBench Kit",
          "profile.product": "Product Kit",
          "profile.auto": "自动",
          "profile.manual": "手动",
          "profile.test": "测试",
          "profile.product.badge": "产品",
          "profile.starter.fine": "harness + 主界面块 + 推荐 lego 块",
          "profile.bare.fine": "只放主界面块",
          "profile.livecodebench.fine": "代码任务验收套件：界面 + provider + 工具 + runtime",
          "profile.product.fine": "按当前产品人格填充推荐 bundles",
          "wizard.chassis": "Chassis",
          "wizard.kit": "装配包",
          "wizard.kitSlots": "套件槽位",
          "wizard.bundles": "组合块 refs",
          "wizard.primaryInterface": "主界面：{surface}",
          "wizard.primaryInterfaceBlock": "主界面块",
          "wizard.requiredPorts": "必需端口",
          "wizard.selectedAtoms": "已选组件",
          "wizard.explicitBindings": "显式绑定",
          "wizard.step.entry": "入口",
          "wizard.step.entry.fine": "选择产品入口和主界面槽位",
          "wizard.step.kit": "套件",
          "wizard.step.kit.fine": "选择装配包和候选槽位",
          "wizard.step.blueprint": "装配",
          "wizard.step.blueprint.fine": "创建 chassis 后进入装配指引",
          "wizard.ready": "就绪",
          "wizard.missing": "缺失：{ports}",
          "wizard.stageReady": "{ready}/{total} 就绪",
          "wizard.harness": "harness",
          "blueprint.kit": "装配包",
          "validation.needsProvider": "需要 provider",
          "validation.needsProvider.summary": "{count} 个必需端口还缺 provider。",
          "validation.fixPort": "补齐 {port}",
          "validation.chooseProvider": "选择 provider",
          "validation.chooseProvider.summary": "{count} 个单 provider 端口存在多个候选。",
          "validation.chooseOne": "选择一个",
          "validation.needsReview": "需要检查",
          "validation.reviewWarning": "检查告警",
          "validation.importedExtras": "导入了额外内容",
          "validation.reviewImport": "检查导入",
          "validation.ready": "正常",
          "validation.ready.summary": "所有必需端口已覆盖，当前没有阻塞诊断。",
          "validation.saveOrExport": "保存或导出",
          "diagnostic.fix": "修复",
          "diagnostic.required.warning": "{count} 个必需端口缺少 provider。",
          "diagnostic.required.message": "必需端口需要 provider 组件，验证才会通过。",
          "diagnostic.required.fix": "切到缺 provider 视图并添加一个候选组件。",
          "diagnostic.duplicate.warning": "{count} 个单 provider 端口需要显式绑定。",
          "diagnostic.duplicate.message": "单 provider 端口有多个已选候选。",
          "diagnostic.duplicate.fix": "打开端口行并选择一个 provider。",
          "diagnostic.bindingMissing": "{port} 绑定指向已移除的 provider {provider}。",
          "diagnostic.bindingMissing.message": "某个显式绑定引用了未选中的组件。",
          "diagnostic.bindingMissing.fix": "重新添加该 provider，或选择另一个候选。",
          "diagnostic.mixedProduct.warning": "混用了产品组件：{products}。",
          "diagnostic.mixedProduct.message": "当前选择包含多个 harness 的产品专属组件。",
          "diagnostic.mixedProduct.fix": "除非在构建混合 harness，否则保持同一个产品家族。",
          "diagnostic.familyConflict.warning": "{family} 同组组合块同时存在：{bundles}。",
          "diagnostic.familyConflict.message": "{family} 同组组合块通常只能保留一个。",
          "diagnostic.familyConflict.fix": "选择一个同组候选走替换同组预览，或导入 hybrid-mix 表示这是有意混合。",
          "diagnostic.familyCustomized.message": "{family} 中的 {bundle} 只保留了部分 atoms，属于自定义同组成员。",
          "diagnostic.familyCustomized.fix": "补齐组合块，或选择一个同组 winner 清理旧 atoms。",
          "diagnostic.familyStaleAtoms.message": "{family} 仍有 {count} 个旧同组 atoms 留在 selection 中。",
          "diagnostic.familyStaleAtoms.fix": "选择一个同组 winner，保留共享 atoms 并移除旧独占 atoms。",
          "diagnostic.familyDanglingBinding.message": "{family} 绑定 {port} 指向未选中的 {provider}。",
          "diagnostic.familyDanglingBinding.fix": "选择同组 winner 或重新绑定该 port。",
          "diagnostic.unknownAtom.message": "导入的 recipe 包含当前 catalog 外的组件。",
          "diagnostic.unknownAtom.fix": "它们会保留在 metadata 中，直到被加入 catalog 前不会作为已编译组件。",
          "diagnostic.unknownBinding.message": "导入的绑定指向未知 provider 组件。",
          "diagnostic.unknownBinding.fix": "把 provider 加入 catalog，或替换成已知候选。",
          "diagnostic.schema.fix": "使用包含 id、version、modules、atoms、bindings、requiredCapabilities 和 personalities 的 LegoRecipe JSON 对象。",
          "diagnostic.metadataOnly.message": "{port} 当前绑定 {atom}，但该 atom 是 Metadata only，不能作为可执行实现通过编译。",
          "diagnostic.metadataOnly.fix": "替换为 Native、Native-like、Compatible bridge 或 Common shared 的可执行候选，或把该 atom 保留为 BOM metadata。",
          "diagnostic.previewShell.message": "{port} 当前绑定 {atom}，但它只是 Preview shell，不能作为可运行 TUI 的主 product shell。",
          "diagnostic.previewShell.fix": "选择 SDK、CLI、server 或 gateway 等可运行 product shell；preview shell 只用于检查界面。",
          "diagnostic.promptPlaceholder.message": "Prompt 入口 {atom} 仍含 Helix 兼容占位身份。",
          "diagnostic.promptPlaceholder.fix": "删除兼容占位 prompt，改用目标产品的原始身份 prompt。",
          "diagnostic.promptUnverified.message": "Prompt 入口 {atom} 还没有证明来自目标产品原始 prompt。",
          "diagnostic.promptUnverified.fix": "同步目标产品 upstream prompt snapshot，或把该 prompt atom 降级为非产品主身份。",
          "diagnostic.promptPartial.message": "Prompt 入口 {atom} 已去掉 Helix 身份，但仍是部分同步的产品 prompt。",
          "diagnostic.promptPartial.fix": "继续同步完整 upstream prompt map；未完成前不要声称 native parity complete。",
          "diagnostic.ready.message": "当前装配没有阻塞级 builder 诊断。",
          "diagnostic.ready.fix": "导出后运行 validate 命令。",
          "impact.none.title": "没有活动替换",
          "impact.none.body": "选择一个端口来查看可替换 provider。",
          "impact.capabilities": "能力",
          "impact.validation": "验证命令",
          "audit.contractFingerprint": "契约指纹",
          "audit.removeImpact": "卸下影响",
          "audit.removeImpactEmpty": "选择一个已装原子块并查看删除影响，或先试装/卸下组合块查看影响。",
          "audit.removeImpactBusy": "正在分析卸下影响",
          "audit.removeImpactUnavailable": "卸下影响不可用",
          "remove.title": "删除影响分析",
          "remove.confirm": "只删除原子块",
          "remove.bundle": "删除组合块",
          "remove.focus": "查看候选",
          "remove.target": "目标块",
          "remove.group": "组合块",
          "remove.lostProvides": "会失去的能力",
          "remove.requiredBreaks": "会缺失的必需端口",
          "remove.bindingBreaks": "会移除的绑定",
          "remove.consumerImpact": "受影响消费者",
          "remove.bundleAtoms": "组合块内已选原子",
          "remove.sharedAtoms": "共享原子",
          "remove.ambiguityAfter": "需要重新选择",
          "remove.none": "无",
          "remove.loading": "正在请求后端分析...",
          "remove.serverRequired": "影响分析暂不可用。请确认在线 builder 正在运行后重试。",
          "remove.safe": "后端分析：删除后暂无阻塞影响。",
          "remove.warning": "后端分析：删除后需要检查绑定或消费者。",
          "remove.blocked": "后端分析：删除后 harness 会缺必需端口或出现单 provider 歧义。",
          "remove.preview": "删除影响",
          "coupling.interface": "界面",
          "coupling.session": "会话",
          "coupling.provider": "Provider",
          "coupling.tool": "工具",
          "coupling.prompt": "Prompt",
          "coupling.hook": "Hook",
          "coupling.agent-loop": "Agent loop",
          "coupling.ui": "UI",
          "coupling.runtime": "运行时",
          "coupling.module": "模块",
          "classification.fixRequired": "补齐必需端口",
          "classification.nativeParity": "改变原生一致性证据",
          "classification.needsValidation": "需要验证",
          "import.recipeObject": "Recipe 必须是一个对象。",
          "import.missingString": "缺少字符串字段：{field}。",
          "import.missingArray": "缺少数组字段：{field}。",
          "server.saveUnavailable": "启动 npm run docs:dev 后才能通过服务端保存草稿。",
          "server.saveFailed": "草稿保存失败，HTTP {status}",
          "server.saved": "已保存草稿 {id}：{url}。",
          "compile.idle": "需要编译",
          "compile.stale": "需要重新编译",
          "compile.running": "编译中",
          "compile.passed": "编译通过",
          "compile.failed": "编译未通过",
          "compile.ready": "当前 harness 已通过编译，可以运行 TUI。",
          "compile.need": "先点击顶部“编译”，通过后才能运行 TUI。",
          "compile.staleMessage": "装配已经变化，请重新编译当前 harness。",
          "compile.startRequired": "请先选择预设、从零新建或导入 recipe，再编译 harness。",
          "compile.failedSummary": "{count} 个问题阻止 TUI 运行。",
          "tui.title": "TUI 测试",
          "tui.start": "打开 TUI",
          "tui.hide": "隐藏 TUI",
          "tui.stop": "停止",
          "tui.restart": "重启",
          "tui.interrupt": "Ctrl-C",
          "tui.clear": "清屏",
          "tui.copy": "复制",
          "tui.save": "保存记录",
          "tui.logs": "日志",
          "tui.static": "需要在线 Builder",
          "tui.idle": "等待 TUI",
          "tui.starting": "启动中",
          "tui.running": "运行中",
          "tui.stopped": "已停止",
          "tui.failed": "失败",
          "tui.error": "TUI 失败",
          "tui.mode": "模式",
          "tui.provider": "Provider",
          "tui.draft": "当前草稿",
          "tui.profile": "已安装 Profile",
          "tui.profileStatus": "Profile 状态",
          "tui.session": "Session",
          "tui.source": "Source",
          "tui.storage": "Storage",
          "tui.recipeFingerprint": "Recipe 指纹",
          "tui.bindingFingerprint": "Binding 指纹",
          "tui.runtimeTrace": "Runtime Trace",
          "tui.bundles": "Bundles",
          "tui.logEmpty": "暂无日志",
          "run.title": "立即体验",
          "run.provider": "Provider",
          "run.baseURL": "Base URL",
          "run.model": "Model",
          "run.apiKey": "API Key",
          "run.prompt": "Prompt",
          "run.maxSteps": "Max steps",
          "run.start": "运行",
          "run.idle": "确认 base_url 和 model 后运行；API key 可留空使用服务端 .env。密钥不会写入 recipe 或 draft。",
          "run.serverKey": "留空使用服务端 .env",
          "run.static": "当前是静态页面，请通过 npm run docs:dev 打开在线 builder 后再体验。",
          "run.running": "正在运行真实 provider...",
          "run.ok": "运行完成",
          "run.failed": "运行失败",
          "run.response": "响应",
          "run.session": "Session",
          "run.steps": "Steps"
        },
        en: {
          "app.subtitle": "Compose, validate, and export a harness for your model",
          "action.new": "New",
          "action.presets": "Bases",
          "action.index": "Docs",
          "action.import": "Import",
          "action.save": "Save",
          "action.run": "Try it",
          "action.compile": "Validate",
          "action.clear": "Clear",
          "action.export": "Export",
          "action.more": "More",
          "action.cancel": "CANCEL",
          "action.create": "CREATE",
          "action.close": "close",
          "action.add": "add",
          "action.remove": "remove",
          "action.copy": "COPY",
          "action.back": "BACK",
          "action.all": "ALL",
          "action.next": "NEXT",
          "action.finish": "FINISH",
          "locale.aria": "Switch to Chinese interface",
          "server.online": "ONLINE",
          "server.static": "STATIC",
          "wizard.title": "New Harness",
          "side.start": "Choose a base",
          "side.library": "Module library",
          "start.new": "Build from scratch",
          "start.eyebrow": "Step 1",
          "start.title": "Choose a base harness",
          "start.description": "Start with a proven agent harness. You can replace any module after opening it.",
          "workflow.aria": "Harness building progress",
          "workflow.choose": "Choose a base",
          "workflow.customize": "Customize",
          "workflow.validate": "Validate & export",
          "preset.description.opencode": "A full agent harness with rich tool, session, and runtime orchestration.",
          "preset.description.pi-mono": "A compact agent harness with a focused, disciplined turn loop.",
          "preset.description.nanobot": "A lightweight Python agent with CLI, TUI, web, and server surfaces.",
          "preset.description.hermes-agent": "A tool-rich autonomous agent with gateway and dashboard surfaces.",
          "preset.description.minimal": "A small neutral chassis for composing a harness from a clean base.",
          "preset.description.hybrid": "An experimental OpenCode and Pi composition for cross-harness exploration.",
          "start.boardTitle": "Choose a starting point",
          "start.boardBody": "Pick a preset, start from scratch, or import a recipe on the left before assembling the harness chassis.",
          "start.blueprintTitle": "Waiting for a start",
          "start.blueprintBody": "After you choose a starting point, this panel shows the current assembly status and next step. Low-level lists, audit, and export live in Details.",
          "board.title": "Current harness",
          "assemblyView.aria": "Assembly grouping",
          "assemblyView.flow": "Flow",
          "assemblyView.technical": "Technical",
          "audit.title": "Review",
          "audit.badge": "Status",
          "details.button": "Details & Export",
          "details.title": "Details & Export",
          "details.materials": "Bill of Materials",
          "details.audit": "Audit Evidence",
          "details.raw": "Raw Recipe",
          "details.commands": "Commands",
          "details.copyJSON": "Copy JSON",
          "details.downloadJSON": "Download JSON",
          "details.viewAll": "View All",
          "details.navAria": "Details sections",
          "inspector.tabsAria": "Right panel categories",
          "inspector.blueprint": "Current Assembly",
          "inspector.preview": "Pending Change",
          "inspector.activation": "Activate",
          "inspector.tui": "TUI",
          "inspector.bom": "Bill of Materials",
          "inspector.audit": "Audit Evidence",
          "inspector.raw": "Raw Recipe",
          "blueprint.title": "Current Assembly",
          "blueprint.product": "Current Harness",
          "blueprint.stageSummary": "Stage status",
          "blueprint.nextSlot": "Next gap",
          "blueprint.emptySlots": "Empty / gaps",
          "blueprint.installedBundles": "Installed bundles",
          "blueprint.latestImpact": "Latest impact",
          "flow.title": "Flow Observer",
          "flow.tab": "Assembly Flow",
          "flow.cardHintTitle": "Assembly map entry",
          "flow.cardHintText": "Open Flow Observer in a separate window for Blueprint, Trace, and native comparison views.",
          "flow.openWindow": "New window",
          "flow.expand": "Expand",
          "flow.collapse": "Collapse",
          "flow.fullscreen": "Focus",
          "flow.restore": "Restore",
          "flow.blueprint": "Blueprint",
          "flow.trace": "Trace",
          "flow.compare": "Compare",
          "flow.native": "Native",
          "flow.pin": "Pin",
          "flow.unpin": "Unpin",
          "flow.pinned": "pinned",
          "flow.unpinned": "unpinned",
          "flow.health.ok": "ok",
          "flow.health.drift": "drift",
          "flow.health.loading": "loading",
          "flow.health.pending": "pending",
          "flow.health.error": "error",
          "flow.driftCount": "{count} drift",
          "flow.finish": "finish {finish}",
          "flow.mode.blueprint": "assembled blueprint",
          "flow.mode.trace": "assembled trace",
          "flow.mode.native": "native flow",
          "flow.mode.compare": "assembled / native compare",
          "flow.compareLayout.side-by-side": "Side",
          "flow.compareLayout.overlay": "Overlay",
          "flow.compareLayout.diff-table": "Table",
          "flow.compare.source.original": "original",
          "flow.compare.source.assembled": "assembled",
          "flow.product.label": "Product",
          "flow.product.current": "Current assembly",
          "flow.evidence.artifact": "Artifact path",
          "flow.evidence.externalArtifact": "External capture path",
          "flow.tooltip.product": "Switch the harness product being observed.",
          "flow.tooltip.blueprint": "Show the static assembled blueprint for the current product.",
          "flow.tooltip.trace": "Show the trace produced by the latest assembled run.",
          "flow.tooltip.compare": "Compare the assembled flow against the native flow.",
          "flow.tooltip.native": "Show the native harness / capture flow.",
          "flow.tooltip.evidence": "Choose the evidence source for native or compare mode.",
          "flow.tooltip.promptDebug": "Show or hide full prompt snippets in prompt evidence.",
          "flow.promptDebug.on": "Prompt debug on",
          "flow.promptDebug.off": "Prompt debug off",
          "flow.lane.surface": "surface",
          "flow.lane.session": "session",
          "flow.lane.prompt": "prompt",
          "flow.lane.provider": "provider",
          "flow.lane.tool": "tool",
          "flow.lane.runtime": "runtime",
          "flow.lane.stageCount": "{count} stages",
          "flow.lane.driftCount": "{count} drift",
          "flow.lane.collapsed": "collapsed",
          "flow.summary.collapsed": "{product} · {stages} stages · {mode}",
          "flow.side.title": "Observer Summary",
          "flow.side.lossiness": "Lossiness",
          "flow.side.evidence": "Evidence",
          "flow.side.nativeEvidence": "Native Evidence",
          "flow.side.diffs": "Diffs",
          "flow.side.selected": "Current Selection",
          "flow.side.timeline": "Latest Trace",
          "flow.side.traceMetrics": "Trace Metrics",
          "flow.side.emptyDiffs": "No diffs yet, or compare has not been loaded.",
          "flow.side.noSelection": "No atom or slot is selected yet.",
          "flow.traceMetric.stepAttempt": "step / attempt",
          "flow.traceMetric.providerRequests": "provider requests",
          "flow.traceMetric.toolBatch": "tool batch",
          "flow.traceMetric.finish": "finish reason",
          "flow.traceMetric.tokenEstimate": "token estimate",
          "flow.traceMetric.compaction": "compaction",
          "flow.nativeEvidence.linked": "linked",
          "flow.nativeEvidence.missing": "no native evidence linked",
          "flow.nativeEvidence.unverified": "verification failed",
          "flow.lossiness.lossless": "Exact event or storage evidence.",
          "flow.lossiness.semantic": "Semantically equivalent; internals are not fully exposed.",
          "flow.lossiness.aggregated": "Aggregated evidence with only boundary or summary visibility.",
          "flow.lossiness.inferred": "Conservatively inferred from externally visible behavior.",
          "flow.lossiness.unobservable": "No reliable native evidence is currently available.",
          "flow.noTrace": "No assembled trace has been captured yet; the event timeline will appear here after the trace collector is connected.",
          "flow.traceRun": "Latest run: {finish} · {steps} steps",
          "flow.traceCaptured": "{events} events · {observed} observed stages",
          "flow.loading": "Loading flow graph...",
          "flow.error": "Flow graph failed: {message}",
          "current.metrics": "Key Metrics",
          "current.readiness": "Acceptance Status",
          "current.summary": "Assembly Summary",
          "current.diagnostics": "Blocking Reasons",
          "pending.impact": "Impact Review",
          "bom.title": "Bill of Materials",
          "bom.bundles": "Bundles",
          "bom.atoms": "Atoms",
          "bom.implementationStates": "Implementation states",
          "bom.productShells": "Product shells",
          "bom.bindings": "Bindings",
          "raw.title": "Raw Recipe",
          "coverage.title": "Audit Evidence",
          "detail.title": "Details / Export",
          "command.title": "Commands / Impact",
          "filter.search": "filter bundle / atom id / port / package",
          "filter.more": "More filters",
          "filter.searchAria": "Filter materials",
          "library.bundle": "Bundles",
          "library.atom": "Atoms",
          "library.port": "Ports",
          "filter.allPlanes": "all planes",
          "filter.allScopes": "all scopes",
          "filter.allAtoms": "all atoms",
          "filter.selected": "selected",
          "filter.replaceable": "replaceable",
          "filter.missingProvider": "missing provider",
          "filter.empty": "No candidate blocks match the current filters. Switch back to all planes, or switch to atoms/ports to inspect lower-level candidates.",
          "bundle.atoms": "{count} atoms",
          "bundle.ports": "{count} ports",
          "bundle.expand": "Expand atoms",
          "bundle.selected": "selected bundle",
          "bundle.partial": "partially selected",
          "bundle.customized": "customized",
          "bundle.source.explicit": "explicit",
          "bundle.source.inferred": "inferred",
          "bundle.source.untracked": "untracked",
          "bundle.loose": "Loose atoms",
          "loose.title": "Loose / unassigned",
          "loose.known": "unassigned slot",
          "loose.unknown": "unknown import",
          "loose.reason.unmatched": "no slot can claim this atom",
          "loose.reason.imported": "outside catalog",
          "bundle.add": "Add",
          "bundle.remove": "Remove",
          "bundle.complete": "Complete",
          "bundle.replaceFamily": "Replace",
          "bundle.keepAtoms": "keep atoms",
          "bundle.promote": "promote to bundle",
          "bundle.promote.title": "Ready to promote",
          "bundle.promote.fine": "{bundle} is fully selected and can be tracked as one assembly module.",
          "slot.empty": "empty",
          "slot.installed": "installed",
          "slot.partial": "partial",
          "slot.conflict": "conflict",
          "slot.customized": "customized",
          "slot.noBundle": "no module installed",
          "slot.candidates": "{count} candidates",
          "slot.ports": "{count} ports",
          "slot.installTarget": "install into {slot}",
          "slot.replaceTarget": "replace {slot}",
          "slot.select": "select slot",
          "slot.replacement": "replacement candidates",
          "slot.boundProvider": "bound provider",
          "slot.warnings": "{count} risks",
          "slot.warning.missing": "missing {ports}",
          "slot.warning.conflict": "conflict {ports}",
          "slot.warning.binding": "missing binding {ports}",
          "slot.warning.customized": "customized bundle",
          "slot.warning.removal": "removal breaks {ports}",
          "slot.expandAtoms": "expand {count} atoms",
          "slot.collapseAtoms": "collapse atoms",
          "slot.atomRole.installed": "active implementation",
          "slot.atomRole.optional": "optional variant",
          "slot.atomRole.variant": "alternative implementation",
          "audit.activeAtom": "Active atom",
          "audit.activeAtomEmpty": "Expand an installed slot and select an atom to inspect its internal part audit.",
          "audit.provides": "provides",
          "audit.consumes": "consumes",
          "preview.title": "Pending Change",
          "preview.emptyTitle": "No Pending Change",
          "preview.emptyBody": "Click install, uninstall, or replace provider to review the impact here before confirming.",
          "preview.badgeEmpty": "empty",
          "preview.badgeActive": "pending",
          "preview.install": "will install",
          "preview.remove": "will uninstall",
          "preview.replaceFamily": "will replace family",
          "preview.family": "exclusive family",
          "preview.oldBundles": "old bundles to remove",
          "preview.newBundle": "new bundle",
          "preview.targetSlots": "target slots",
          "preview.newAtoms": "new atoms",
          "preview.removedAtoms": "removed atoms",
          "preview.sharedAtoms": "shared atoms",
          "preview.binds": "ports to bind",
          "preview.bindingChanges": "binding changes",
          "preview.conflicts": "needs confirmation",
          "preview.breaks": "would break",
          "preview.requiredRemoveWarning": "This bundle provides required ports. Confirming uninstall would leave the harness missing: {ports}",
          "preview.bindingTitle": "Pending Binding Change",
          "preview.bindingCandidate": "candidate provider",
          "preview.confirmBinding": "Confirm Swap",
          "preview.confirmInstall": "Confirm Install",
          "preview.confirmRemove": "Confirm Uninstall",
          "preview.confirmReplaceFamily": "Confirm Family Replace",
          "preview.cancel": "Cancel",
          "activation.title": "Activate",
          "activation.profile": "Profile",
          "activation.workspaceDir": "Workspace path",
          "activation.storageDir": "Storage path",
          "activation.permissionSummary": "Permission policy",
          "activation.provider": "Provider",
          "activation.model": "Model",
          "activation.baseURL": "Base URL",
          "activation.apiKeyEnv": "API key env",
          "activation.telegramMode": "Telegram mode",
          "activation.botTokenEnv": "Bot token env",
          "activation.allowedChat": "Allowed chat",
          "activation.webhookURL": "Webhook URL",
          "activation.webhookSecretEnv": "Webhook secret env",
          "activation.smokeText": "Smoke text",
          "activation.install": "Install Profile",
          "activation.configureProvider": "Save Provider",
          "activation.configureTelegram": "Save Telegram",
          "activation.status": "Refresh Status",
          "activation.logs": "Logs",
          "activation.smoke": "Local smoke",
          "activation.start": "Start Gateway",
          "activation.stop": "Stop Gateway",
          "activation.restart": "Restart Gateway",
          "activation.static": "Online Builder Required",
          "activation.idle": "Waiting",
          "activation.busy": "Working",
          "activation.installed": "Profile installed",
          "activation.providerSaved": "Provider saved",
          "activation.telegramSaved": "Telegram saved",
          "activation.statusLoaded": "Status refreshed",
          "activation.logsLoaded": "Logs refreshed",
          "activation.smokeOK": "Local smoke passed",
          "activation.smokeFailed": "Local smoke failed",
          "activation.gatewayStarted": "Gateway started",
          "activation.gatewayStopped": "Gateway stopped",
          "activation.gatewayRestarted": "Gateway restarted",
          "activation.error": "Activation failed",
          "activation.none": "not configured",
          "metric.atoms": "atoms",
          "metric.coveredPorts": "covered ports",
          "metric.missingPorts": "missing ports",
          "metric.interfaces": "interfaces",
          "selection.atoms": "{count} atoms",
          "state.missing": "missing",
          "state.bound": "bound",
          "state.swap": "swap",
          "state.add": "add",
          "state.selectedAtom": "selected atom",
          "state.addAtomAndBind": "add atom and bind",
          "state.noSelectedProvider": "no selected provider",
          "state.preset": "preset",
          "stage.interface": "Interface",
          "stage.session": "Session",
          "stage.provider": "Provider",
          "stage.prompt": "Prompt",
          "stage.tools": "Tools",
          "stage.ui": "UI",
          "stage.runtime": "Runtime",
          "stage.acceptance": "Acceptance",
          "stage.expand": "Expand {stage}",
          "stage.collapse": "Collapse {stage}",
          "guide.stageReady": "{ready}/{total} installed",
          "guide.title": "Assembly Guide",
          "guide.overview": "stage overview",
          "guide.expand": "Expand assembly guide",
          "guide.collapse": "Collapse assembly guide",
          "guide.openStage": "Choose a stage to start guidance",
          "guide.gap": "{count} gaps",
          "guide.conflict": "{count} conflicts",
          "guide.next": "next: {slot}",
          "guide.ready": "ready",
          "guide.acceptance": "Assembly acceptance",
          "guide.acceptanceReady": "ready",
          "guide.acceptanceBlocked": "blocked",
          "guide.acceptanceSummary": "{ready}/{total} checks",
          "guide.acceptance.validate": "validate ready",
          "guide.acceptance.ports": "required ports covered",
          "guide.acceptance.recipe": "recipe export ready",
          "guide.acceptance.commands": "run/test command ready",
          "lane.interface": "interface",
          "lane.agent-loop": "agent loop",
          "lane.config": "config",
          "lane.conformance": "conformance",
          "lane.event": "event",
          "lane.foundation": "foundation",
          "lane.hook": "hook",
          "lane.identity": "identity",
          "lane.prompt": "prompt",
          "lane.task": "task",
          "lane.trace": "trace",
          "lane.turn": "turn",
          "lane.ui": "UI",
          "lane.loose": "loose",
          "lane.runtime": "runtime",
          "lane.session": "session",
          "lane.provider": "provider",
          "lane.tool": "tool",
          "lane.tools": "tools",
          "lane.product": "product",
          "lane.help.title": "Show lane description",
          "help.title": "Show explanation",
          "help.bundle.generic": "{label}: {description}",
          "help.bundle.sessionMemory": "Memory session base: keeps sessions in memory, including message storage, read/write, branches, context selection, and transcript projection. Good for development, tests, and lightweight harnesses.",
          "help.bundle.productSession": "{product} session adapter: connects that product's session semantics to the common harness, including IDs, storage, branches, pagination, context, and message-part shape.",
          "help.bundle.productProvider": "{product} provider adapter: connects that product's model registry, auth, request shape, stream parsing, usage, and event projection to the common provider slots.",
          "help.bundle.productShells": "{product} entry shells: CLI, SDK, TUI, web, server, or other user-facing entry surfaces. This choice decides where the harness is used from.",
          "help.bundle.providerCommon": "Common provider bundle: owns transport, auth, model registry, request shape, stream parsing, and usage accounting for model calls.",
          "help.bundle.toolCommon": "Tool bundle: owns filesystem, shell, permissions, schemas, executors, and result formats, deciding which external actions an agent may call.",
          "help.bundle.promptCommon": "Prompt bundle: assembles system prompt, resource loading, context, and tool descriptions, shaping what the model sees each turn.",
          "help.slot.generic": "{slot} needs a block that provides {port}. Assembly must cover this port before the recipe can validate.",
          "help.slot.productShell": "Product interface slot: decides whether the harness exposes a CLI, SDK, TUI, web, server, or another entry surface.",
          "help.slot.sessionID": "Session ID Generator: creates or restores a stable ID for each conversation so reads, writes, events, and logs track the same session.",
          "help.slot.sessionStore": "Session Store: persists messages, events, and branch state in memory, JSONL, SQLite, or a product-native store.",
          "help.slot.sessionReader": "Session Reader: reads prior messages and state by session ID so the next model turn receives context.",
          "help.slot.sessionWriter": "Session Writer: writes user messages, assistant output, tool results, and events back into the session.",
          "help.slot.sessionBranch": "Session Branch: handles forks, switching, and history recovery for multi-turn editing or resumed context.",
          "help.slot.sessionCompaction": "Session Compaction: compresses long history so it does not exceed the model context window.",
          "help.slot.providerAuth": "Provider Auth: decides how API keys, bearer tokens, or query keys attach to model requests. Replacing it changes how credentials enter the provider.",
          "help.slot.providerModel": "Model Provider / Registry: selects model IDs, capability metadata, and vendor information.",
          "help.slot.providerTransport": "Provider Transport: sends requests to the model vendor, cassette replay, or product-native transport.",
          "help.slot.providerRequest": "Provider Request Shape: converts internal messages into the provider's request JSON.",
          "help.slot.providerStream": "Provider Stream: runs the model request and returns streaming events or the final response.",
          "help.slot.providerParser": "Provider Stream Parser: parses SSE, JSONL, or cassette output into normalized events.",
          "help.slot.toolRegistry": "Tool Registry: registers tool definitions and permissions so the agent knows which tools it may call.",
          "help.slot.filesystem": "Filesystem: bounds file reads and writes to the workspace.",
          "help.slot.processRunner": "Process Runner: runs shell/process commands and converts stdout, stderr, and exit code into tool results.",
          "help.slot.prompt": "Prompt slot: assembles system/developer/tool instructions and resource context.",
          "help.slot.ui": "UI slot: maps runtime state into TUI, web, HTML, or other user interfaces.",
          "help.slot.runtime": "Runtime slot: owns lifecycle, registries, assembly graph, and execution substrate.",
          "help.atom.generic": "Atom: provides {provides} and depends on {consumes}. It is a low-level part inside a bundle; it can be replaced individually but port coverage must be checked again.",
          "help.atom.noConsumes": "no extra dependencies",
          "help.action.install": "Install adds this bundle's atoms and connects the ports it provides to the current harness.",
          "help.action.remove": "Uninstall removes atoms owned only by this bundle; shared atoms stay if another installed bundle still needs them.",
          "help.action.complete": "Complete adds the missing atoms back so this bundle becomes a complete assembly module again.",
          "help.action.replace": "Replace swaps the current slot to this candidate bundle; provider bindings and required ports should be checked afterward.",
          "help.action.add": "Add installs this bundle as a new assembly module in the harness.",
          "help.status.customized": "Customized means the bundle is not installed exactly as cataloged: atoms were removed, replaced, or manually selected underneath it.",
          "help.status.partial": "Partial means only some atoms from this bundle are selected, so it is not yet a complete assembly module.",
          "help.status.selected": "Selected means the whole bundle is installed and will export as a bundle ref in the recipe.",
          "help.source.explicit": "Explicit means the user directly installed this bundle, so export preserves its bundle ref.",
          "help.source.inferred": "Inferred means the selected atoms match this bundle; promote it if you want to manage them as one module.",
          "help.source.untracked": "Untracked means these atoms are not managed as a bundle yet; removal and replacement must inspect lower-level atom impact.",
          "help.candidateBundle": "Candidate bundle: clicking installs this related group of atoms into the current slot instead of adding atoms one by one.",
          "help.providerChoice": "Candidate provider atom: clicking binds it to the current port. A single-provider slot should keep only one effective candidate.",
          "lane.description.default": "The {lane} lane groups lego blocks with the same responsibility so you can inspect assembly completeness by role.",
          "lane.description.interface": "The interface lane holds CLI, TUI, GUI, SDK, server, and similar entry shells; they are surfaces of one harness, not separate harnesses.",
          "lane.description.agent-loop": "The agent loop lane controls model calls, tool execution, retries, continuation, and stop conditions across a task turn.",
          "lane.description.config": "The config lane carries environment, policy switches, paths, and runtime parameters for deployment-specific behavior.",
          "lane.description.conformance": "The conformance lane contains fixtures and parity checks that prove the assembled harness still matches product contracts.",
          "lane.description.event": "The event lane wraps, logs, and projects state changes for replay, audit, and UI synchronization.",
          "lane.description.foundation": "The foundation lane provides shared types, error models, serialization, and cross-module contracts used by other blocks.",
          "lane.description.hook": "The hook lane exposes lifecycle and extension points where prompts, tools, context, or product behavior can plug into the main flow.",
          "lane.description.identity": "The identity lane resolves workspace identity, clocks, and ID generation so sessions and events remain traceable.",
          "lane.description.product": "The product lane holds product-specific adapters; these blocks add product semantics inside one harness.",
          "lane.description.prompt": "The prompt lane assembles system prompts, resources, context selection, and prompt policy that shape model input.",
          "lane.description.provider": "The provider lane owns model vendors, request transport, streaming output, and credential boundaries.",
          "lane.description.runtime": "The runtime lane supplies lifecycle services, registries, and execution substrate for the assembled harness.",
          "lane.description.session": "The session lane manages messages, branches, compaction, storage, and reads for user interaction history.",
          "lane.description.task": "The task lane describes runnable workloads, evaluation tasks, and parity scenarios.",
          "lane.description.tool": "The tool lane registers shell, filesystem, dynamic bridge, and other external actions an agent may call.",
          "lane.description.tools": "The tools lane registers shell, filesystem, dynamic bridge, and other external actions an agent may call.",
          "lane.description.trace": "The trace lane records call chains, diagnostics, and observability data for debugging assembled behavior.",
          "lane.description.turn": "The turn lane handles per-turn input, output, message shape, and step results inside the agent loop.",
          "lane.description.ui": "The UI lane maps state and rendering behavior for TUI, GUI, or web surfaces.",
          "product.minimal": "Minimal Harness",
          "product.opencode": "OpenCode Harness",
          "product.pi": "Pi Harness",
          "product.nanobot": "Nanobot Harness",
          "product.hermes": "Hermes Agent Harness",
          "profile.starter": "Starter",
          "profile.bare": "Bare",
          "profile.livecodebench": "LiveCodeBench Kit",
          "profile.product": "Product Kit",
          "profile.auto": "auto",
          "profile.manual": "manual",
          "profile.test": "test",
          "profile.product.badge": "product",
          "profile.starter.fine": "harness + primary interface block + recommended lego blocks",
          "profile.bare.fine": "primary interface block only",
          "profile.livecodebench.fine": "code-task acceptance kit: interface + provider + tools + runtime",
          "profile.product.fine": "recommended bundles for the current product personality",
          "wizard.chassis": "Chassis",
          "wizard.kit": "Kit",
          "wizard.kitSlots": "Kit slots",
          "wizard.bundles": "Bundle refs",
          "wizard.primaryInterface": "primary interface: {surface}",
          "wizard.primaryInterfaceBlock": "Primary interface block",
          "wizard.requiredPorts": "Required ports",
          "wizard.selectedAtoms": "Selected atoms",
          "wizard.explicitBindings": "Explicit bindings",
          "wizard.step.entry": "Entry",
          "wizard.step.entry.fine": "Choose the product entry and primary interface slot",
          "wizard.step.kit": "Kit",
          "wizard.step.kit.fine": "Choose the assembly package and candidate slots",
          "wizard.step.blueprint": "Assembly",
          "wizard.step.blueprint.fine": "Create the chassis and enter the assembly guide",
          "wizard.ready": "ready",
          "wizard.missing": "missing: {ports}",
          "wizard.stageReady": "{ready}/{total} ready",
          "wizard.harness": "harness",
          "blueprint.kit": "Kit",
          "validation.needsProvider": "Needs provider",
          "validation.needsProvider.summary": "{count} required ports still need providers.",
          "validation.fixPort": "Fix {port}",
          "validation.chooseProvider": "Choose provider",
          "validation.chooseProvider.summary": "{count} single-provider ports have multiple selected providers.",
          "validation.chooseOne": "Choose one",
          "validation.needsReview": "Needs review",
          "validation.reviewWarning": "Review warning",
          "validation.importedExtras": "Imported extras",
          "validation.reviewImport": "Review import",
          "validation.ready": "Ready",
          "validation.ready.summary": "All required ports are covered and no blocking diagnostics are active.",
          "validation.saveOrExport": "Save or export",
          "diagnostic.fix": "Fix",
          "diagnostic.required.warning": "{count} required ports missing providers.",
          "diagnostic.required.message": "Required ports need a provider atom before validation can pass.",
          "diagnostic.required.fix": "Search by missing-provider and add one candidate.",
          "diagnostic.duplicate.warning": "{count} single-provider ports need an explicit binding.",
          "diagnostic.duplicate.message": "Single-provider ports have more than one selected candidate.",
          "diagnostic.duplicate.fix": "Open the port row and choose one provider.",
          "diagnostic.bindingMissing": "{port} binding points to removed provider {provider}.",
          "diagnostic.bindingMissing.message": "An explicit binding refers to an atom that is no longer selected.",
          "diagnostic.bindingMissing.fix": "Re-add the provider atom or choose another candidate.",
          "diagnostic.mixedProduct.warning": "Mixed product atoms: {products}.",
          "diagnostic.mixedProduct.message": "Selected product-specific atoms come from more than one harness.",
          "diagnostic.mixedProduct.fix": "Keep one product family unless you are deliberately building a hybrid.",
          "diagnostic.familyConflict.warning": "{family} family bundles are both active: {bundles}.",
          "diagnostic.familyConflict.message": "{family} family bundles should usually keep one active bundle.",
          "diagnostic.familyConflict.fix": "Choose one same-family candidate through the family replace preview, or import hybrid-mix if this is intentional.",
          "diagnostic.familyCustomized.message": "{bundle} is a customized member of {family}; only part of its atoms are selected.",
          "diagnostic.familyCustomized.fix": "Complete the bundle, or choose a same-family winner to clean old atoms.",
          "diagnostic.familyStaleAtoms.message": "{family} still has {count} stale same-family atoms selected.",
          "diagnostic.familyStaleAtoms.fix": "Choose one same-family winner, keep shared atoms, and remove old exclusive atoms.",
          "diagnostic.familyDanglingBinding.message": "{family} binding {port} points to unselected provider {provider}.",
          "diagnostic.familyDanglingBinding.fix": "Choose a same-family winner or re-bind the port.",
          "diagnostic.unknownAtom.message": "Imported recipe contains atoms outside the current catalog.",
          "diagnostic.unknownAtom.fix": "They are preserved in metadata and omitted from compiled atoms until cataloged.",
          "diagnostic.unknownBinding.message": "Imported bindings point at unknown provider atoms.",
          "diagnostic.unknownBinding.fix": "Catalog the provider or replace it with a known candidate.",
          "diagnostic.schema.fix": "Use a LegoRecipe JSON object with id, version, modules, atoms, bindings, requiredCapabilities, and personalities.",
          "diagnostic.metadataOnly.message": "{port} is bound to {atom}, but that atom is Metadata only and cannot compile as an executable implementation.",
          "diagnostic.metadataOnly.fix": "Replace it with a Native, Native-like, Compatible bridge, or Common shared executable candidate, or keep the atom as BOM metadata.",
          "diagnostic.previewShell.message": "{port} is bound to {atom}, but it is only a Preview shell and cannot be the runnable TUI product shell.",
          "diagnostic.previewShell.fix": "Choose a runnable SDK, CLI, server, or gateway product shell; preview shells are inspection surfaces.",
          "diagnostic.promptPlaceholder.message": "Prompt entry {atom} still contains a Helix-compatible placeholder identity.",
          "diagnostic.promptPlaceholder.fix": "Remove the compatible placeholder prompt and use the target product's original identity prompt.",
          "diagnostic.promptUnverified.message": "Prompt entry {atom} has not been proven to come from the target product's original prompt.",
          "diagnostic.promptUnverified.fix": "Sync the target product upstream prompt snapshot, or downgrade this prompt atom out of the product identity path.",
          "diagnostic.promptPartial.message": "Prompt entry {atom} no longer leaks Helix identity, but it is still a partially synced product prompt.",
          "diagnostic.promptPartial.fix": "Keep syncing the full upstream prompt map; do not claim native parity complete yet.",
          "diagnostic.ready.message": "Current assembly has no blocking builder diagnostics.",
          "diagnostic.ready.fix": "Export and run the validate command.",
          "impact.none.title": "No active swap",
          "impact.none.body": "Select a port to inspect replaceable providers.",
          "impact.capabilities": "capabilities",
          "impact.validation": "validation command",
          "audit.contractFingerprint": "Contract fingerprint",
          "audit.removeImpact": "Removal impact",
          "audit.removeImpactEmpty": "Select an installed atom and inspect removal impact, or stage/uninstall a bundle to inspect impact.",
          "audit.removeImpactBusy": "Analyzing removal impact",
          "audit.removeImpactUnavailable": "Removal impact unavailable",
          "remove.title": "Removal Impact",
          "remove.confirm": "Remove atom",
          "remove.bundle": "Remove bundle",
          "remove.focus": "Show candidates",
          "remove.target": "Target atom",
          "remove.group": "Bundle",
          "remove.lostProvides": "Lost capabilities",
          "remove.requiredBreaks": "Required ports that break",
          "remove.bindingBreaks": "Bindings removed",
          "remove.consumerImpact": "Affected consumers",
          "remove.bundleAtoms": "Selected atoms in bundle",
          "remove.sharedAtoms": "Shared atoms",
          "remove.ambiguityAfter": "Needs provider choice",
          "remove.none": "none",
          "remove.loading": "Requesting backend analysis...",
          "remove.serverRequired": "Impact analysis is temporarily unavailable. Confirm the online builder is running and retry.",
          "remove.safe": "Backend analysis: no blocking impact after removal.",
          "remove.warning": "Backend analysis: bindings or consumers need review after removal.",
          "remove.blocked": "Backend analysis: removal would leave required ports missing or ambiguous.",
          "remove.preview": "Removal impact",
          "coupling.interface": "interface",
          "coupling.session": "session",
          "coupling.provider": "provider",
          "coupling.tool": "tool",
          "coupling.prompt": "prompt",
          "coupling.hook": "hook",
          "coupling.agent-loop": "agent loop",
          "coupling.ui": "UI",
          "coupling.runtime": "runtime",
          "coupling.module": "module",
          "classification.fixRequired": "fixes required port",
          "classification.nativeParity": "changes native parity evidence",
          "classification.needsValidation": "needs validation",
          "import.recipeObject": "Recipe must be an object.",
          "import.missingString": "Missing string field: {field}.",
          "import.missingArray": "Missing {field} array.",
          "server.saveUnavailable": "Start npm run docs:dev to save drafts through the server.",
          "server.saveFailed": "Draft save failed with HTTP {status}",
          "server.saved": "Saved draft {id} at {url}.",
          "compile.idle": "Compile required",
          "compile.stale": "Recompile required",
          "compile.running": "Compiling",
          "compile.passed": "Compile passed",
          "compile.failed": "Compile failed",
          "compile.ready": "The current harness passed compile and can run TUI.",
          "compile.need": "Click the top Compile button before running TUI.",
          "compile.staleMessage": "The assembly changed. Recompile the current harness.",
          "compile.startRequired": "Choose a preset, start from scratch, or import a recipe before compiling.",
          "compile.failedSummary": "{count} issues block TUI execution.",
          "tui.title": "TUI Test",
          "tui.start": "Open TUI",
          "tui.hide": "Hide TUI",
          "tui.stop": "Stop",
          "tui.restart": "Restart",
          "tui.interrupt": "Ctrl-C",
          "tui.clear": "Clear",
          "tui.copy": "Copy",
          "tui.save": "Save Record",
          "tui.logs": "Logs",
          "tui.static": "Online Builder Required",
          "tui.idle": "Waiting",
          "tui.starting": "Starting",
          "tui.running": "Running",
          "tui.stopped": "Stopped",
          "tui.failed": "Failed",
          "tui.error": "TUI failed",
          "tui.mode": "Mode",
          "tui.provider": "Provider",
          "tui.draft": "Current Draft",
          "tui.profile": "Installed Profile",
          "tui.profileStatus": "Profile Status",
          "tui.session": "Session",
          "tui.source": "Source",
          "tui.storage": "Storage",
          "tui.recipeFingerprint": "Recipe Fingerprint",
          "tui.bindingFingerprint": "Binding Fingerprint",
          "tui.runtimeTrace": "Runtime Trace",
          "tui.bundles": "Bundles",
          "tui.logEmpty": "No logs yet",
          "run.title": "Run Harness",
          "run.provider": "Provider",
          "run.baseURL": "Base URL",
          "run.model": "Model",
          "run.apiKey": "API Key",
          "run.prompt": "Prompt",
          "run.maxSteps": "Max steps",
          "run.start": "Run",
          "run.idle": "Confirm base_url and model, then run; API key can stay blank to use server .env. Keys are not written to the recipe or draft.",
          "run.serverKey": "Leave blank to use server .env",
          "run.static": "This is the static page. Open the online builder with npm run docs:dev before running a harness.",
          "run.running": "Running live provider...",
          "run.ok": "Run complete",
          "run.failed": "Run failed",
          "run.response": "Response",
          "run.session": "Session",
          "run.steps": "Steps"
        }
      };
      function initialLocale() {
        try {
          return window.localStorage && window.localStorage.getItem("helix.builder.locale") === "zh" ? "zh" : "en";
        } catch (error) {
          return "en";
        }
      }
      function initialRightPanelWidth() {
        try {
          var stored = window.localStorage && Number(window.localStorage.getItem("helix.builder.rightPanelWidth"));
          return Number.isFinite(stored) && stored > 0 ? stored : 390;
        } catch (error) {
          return 390;
        }
      }
      function presetBindings(item) {
        return new Map(((item && item.bindings) || []).map(function (binding) { return [binding.portID, binding.providerAtomID]; }));
      }
      var state = {
        locale: initialLocale(),
        preset: "custom",
        selected: new Set(),
        bindings: new Map(),
        customRecipeID: "",
        customPresetID: "",
	        customProduct: "custom",
	        customSourceFingerprint: "custom",
	        customRequiredPorts: [],
	        customBundleStates: [],
	        customEntrypoints: {},
        customPersonalities: ["common"],
        customAssemblyMode: "",
        customKitID: "",
        customChassisID: "",
        activeAtom: "",
        activePort: "",
        activeBundle: "",
        activeSlot: "",
        activeDetailKind: "",
        previewBundle: "",
        previewAction: "",
        previewPinned: false,
        pendingBinding: null,
        query: "",
        libraryMode: "bundle",
        plane: "all",
        scope: "all",
        view: "all",
        selectedBundles: new Set(),
        inferredBundles: new Set(),
        customUnknownAtoms: [],
        customUnknownBindings: [],
        customSchemaWarnings: [],
        familyReplacements: [],
        lastSwap: null,
        draggedAtom: "",
        wizardOpen: false,
        workspaceStarted: false,
        wizardProduct: WIZARD_PRODUCTS[0] ? WIZARD_PRODUCTS[0].id : "",
        wizardProfile: "bare",
        assemblyView: "flow",
        guideActive: false,
        guideStage: "",
        guideCollapsed: true,
        guideToggleClickSuppressed: false,
        collapsedStages: new Set(),
        inspectorTab: "blueprint",
        detailsOpen: false,
        detailsSection: "materials",
        pendingScrollSlot: "",
        runOpen: false,
        runBusy: false,
        runStatus: "idle",
        runMessage: "",
        runDefaults: null,
        removeImpactOpen: false,
        removeImpactBusy: false,
        removeImpactAtom: "",
        removeImpact: null,
        removeImpactError: "",
        activationName: "",
        activationWorkspaceDir: "",
        activationStorageDir: "",
        activationPermissionSummary: "workspace-scoped filesystem; env-ref secrets; managed gateway worker",
        activationProvider: "openai-compatible",
        activationModel: "",
        activationBaseURL: "",
        activationAPIKeyEnv: "",
        activationTelegramMode: "polling",
        activationBotTokenEnv: "TELEGRAM_BOT_TOKEN",
        activationAllowedChat: "",
        activationWebhookURL: "",
        activationWebhookSecretEnv: "TELEGRAM_WEBHOOK_SECRET",
        activationSmokeText: "hello",
        activationBusy: false,
        activationStatus: null,
        activationLogs: "",
        activationMessage: "",
        activationError: "",
        compileStatus: "idle",
        compileFingerprint: "",
        compileMessage: "",
        compileDiagnostics: [],
        tuiOpen: false,
        rightPanelCard: "status",
        rightPanelWidth: initialRightPanelWidth(),
        rightPanelResizing: false,
        tuiMode: "draft-recipe",
        tuiProviderMode: "profile-live",
        tuiBusy: false,
        tuiSession: null,
        tuiStatus: "idle",
        tuiMessage: "",
        tuiError: "",
        tuiTranscript: "",
        tuiLogs: "",
        tuiSocketState: "closed",
        flowStandalone: flowStandaloneInitial,
        flowDockState: flowStandaloneInitial ? "fullscreen" : "collapsed",
        flowMode: normalizedFlowMode(initialParam("flowMode")) || "blueprint",
        flowCompareLayout: normalizedFlowCompareLayout(initialParam("flowCompareLayout")) || "side-by-side",
        flowProductID: initialParam("flowProduct"),
        flowTaskID: initialParam("flowTask") || "read-only-answer",
        flowEvidenceSource: initialParam("flowEvidenceSource") || "native-cadence-fixture",
        flowNativeArtifactPath: initialParam("flowArtifact") || "docs/reports/task-parity-native-cadence-fixtures/manifest.json",
        flowDepthEnabled: initialParam("flowDepth") ? initialParam("flowDepth") !== "flat" : true,
        flowPromptDebug: initialParam("flowPromptDebug") === "1",
        flowHiddenLanes: {},
        flowArtifact: null,
        flowLoading: false,
        flowError: "",
        flowPinned: false,
        flowActiveNode: "",
        flowLatestRun: null,
        flowCache: {},
        expandedSlots: new Set()
      };
      if (state.flowStandalone) {
        document.documentElement.dataset.flowObserverWindow = "true";
        document.body.dataset.flowObserverWindow = "true";
      }
      var tuiSocket = null;
      var tuiTerminal = null;
      var tuiTerminalMount = null;
      var tuiXtermPromise = null;
      var tuiPanelKey = "";
      var rightPanelDrag = null;

      function resetToStart() {
        state.preset = "custom";
        state.workspaceStarted = false;
        state.selected = new Set();
        state.selectedBundles = new Set();
        state.inferredBundles = new Set();
        state.bindings = new Map();
        state.customRecipeID = "";
        state.customPresetID = "";
	        state.customProduct = "custom";
	        state.customSourceFingerprint = "custom";
	        state.customRequiredPorts = [];
	        state.customBundleStates = [];
	        state.customEntrypoints = {};
        state.customPersonalities = ["common"];
        state.customAssemblyMode = "";
        state.customKitID = "";
        state.customChassisID = "";
        state.customUnknownAtoms = [];
        state.customUnknownBindings = [];
        state.customSchemaWarnings = [];
        state.familyReplacements = [];
        state.lastSwap = null;
        state.pendingBinding = null;
        state.activeAtom = "";
        state.activeBundle = "";
        state.activePort = "";
        state.activeSlot = "";
        state.activeDetailKind = "";
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.guideActive = false;
        state.guideStage = "";
        state.guideCollapsed = true;
        state.guideToggleClickSuppressed = false;
        state.inspectorTab = "blueprint";
        state.detailsOpen = false;
        state.expandedSlots = new Set();
        state.collapsedStages = new Set();
        state.pendingScrollSlot = "";
        state.query = "";
        state.libraryMode = "bundle";
        state.plane = "all";
        state.scope = "all";
        state.view = "all";
        state.activationName = "";
        state.activationBusy = false;
        state.activationStatus = null;
        state.activationLogs = "";
        state.activationMessage = "";
        state.activationError = "";
        state.compileStatus = "idle";
        state.compileFingerprint = "";
        state.compileMessage = "";
        state.compileDiagnostics = [];
        state.tuiOpen = false;
        state.rightPanelCard = "status";
        state.tuiBusy = false;
        state.tuiSession = null;
        state.tuiStatus = "idle";
        state.tuiMessage = "";
        state.tuiError = "";
        state.tuiTranscript = "";
        state.tuiLogs = "";
        state.tuiSocketState = "closed";
        if (tuiSocket) {
          try { tuiSocket.close(); } catch (error) {}
          tuiSocket = null;
        }
        tuiPanelKey = "";
      }

      window.__harnessBuilderToggleGuide = function () {
        var shell = document.querySelector("[data-builder-guide-shell]");
        var nextCollapsed = shell ? shell.dataset.builderGuideCollapsed !== "true" : !state.guideCollapsed;
        var label = nextCollapsed ? t("guide.expand") : t("guide.collapse");
        state.guideCollapsed = nextCollapsed;
        state.guideToggleClickSuppressed = true;
        if (!shell) {
          renderBoard();
          return;
        }
        shell.dataset.builderGuideCollapsed = String(nextCollapsed);
        var body = shell.querySelector("[data-builder-guide-body]");
        if (body) body.hidden = nextCollapsed;
        var toggle = shell.querySelector("[data-guide-toggle]");
        if (toggle) {
          toggle.setAttribute("aria-expanded", String(!nextCollapsed));
          toggle.setAttribute("aria-label", label);
          toggle.setAttribute("title", label);
        }
        var chip = shell.querySelector("[data-builder-guide-toggle-label]");
        if (chip) chip.textContent = label;
      };

      function h(value) {
        return String(value == null ? "" : value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function t(key) {
        var table = I18N[state.locale] || I18N.zh;
        return table[key] || I18N.en[key] || key;
      }

      function tx(key, values) {
        var text = t(key);
        Object.keys(values || {}).forEach(function (name) {
          text = text.split("{" + name + "}").join(String(values[name]));
        });
        return text;
      }

      function setText(id, text) {
        var element = document.getElementById(id);
        if (element) element.textContent = text;
      }

      function showFloatingHelp(trigger) {
        var tooltip = document.getElementById("floatingHelp");
        if (!tooltip || !trigger) return;
        var title = trigger.dataset.helpTitle || t("help.title");
        var body = trigger.dataset.helpBody || "";
        if (!body) return;
        tooltip.innerHTML = '<strong>' + h(title) + '</strong><span>' + h(body) + '</span>';
        tooltip.hidden = false;
        tooltip.style.left = "0px";
        tooltip.style.top = "0px";
        var rect = trigger.getBoundingClientRect();
        var tooltipRect = tooltip.getBoundingClientRect();
        var margin = 12;
        var left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));
        var top = rect.bottom + 8;
        if (top + tooltipRect.height + margin > window.innerHeight) top = rect.top - tooltipRect.height - 8;
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
        tooltip.style.left = Math.round(left) + "px";
        tooltip.style.top = Math.round(top) + "px";
      }

      function hideFloatingHelp() {
        var tooltip = document.getElementById("floatingHelp");
        if (tooltip) tooltip.hidden = true;
      }

      function productLabel(product) {
        return product && product.labelKey ? t(product.labelKey) : product && product.label ? product.label : "Harness";
      }

      function profileLabel(profile) {
        return profile && profile.labelKey ? t(profile.labelKey) : profile && profile.label ? profile.label : "";
      }

      function profileBadge(profile) {
        return profile && profile.badgeKey ? t(profile.badgeKey) : profile && profile.badge ? profile.badge : "";
      }

      function profileFine(profile) {
        return profile && profile.fineKey ? t(profile.fineKey) : profile && profile.fine ? profile.fine : "";
      }

      function laneLabel(lane) {
        return t("lane." + lane);
      }

      function laneDescription(lane) {
        var key = "lane.description." + lane;
        var text = t(key);
        return text === key ? tx("lane.description.default", { lane: laneLabel(lane) }) : text;
      }

      function renderLaneHelp(lane) {
        var title = laneLabel(lane);
        var body = laneDescription(lane);
        return '<span class="info-help-wrap" data-info-help="lane-' + h(lane) + '" data-builder-lane-help="' + h(lane) + '" data-help-title="' + h(title) + '" data-help-body="' + h(body) + '" tabindex="0" role="button" aria-label="' + h(title + ": " + body) + '">' +
          '<span class="info-help-button" aria-hidden="true">?</span>' +
        '</span>';
      }

      function renderInfoHelp(topic, title, body) {
        if (!body) return "";
        var safeTopic = String(topic || title || "help").replace(/[^a-z0-9_.-]+/gi, "-");
        return '<span class="info-help-wrap" data-info-help="' + h(safeTopic) + '" data-help-title="' + h(title || t("help.title")) + '" data-help-body="' + h(body) + '" tabindex="0" role="button" aria-label="' + h((title || t("help.title")) + ": " + body) + '">' +
          '<span class="info-help-button" aria-hidden="true">?</span>' +
        '</span>';
      }

      var HELP_COPY = {
        zh: {
          fallback: "这是一个可装配部件。点击前先看它要覆盖的槽位和端口，装入后再检查右侧当前装配和验收状态。",
          atomFallback: "这是一个底层原子块。它通常属于某个组合块；单独增删时要检查是否会影响端口覆盖。",
          bundles: {
            "bundle.agent-loop.turn-runner": "Turn Runner 是通用单轮执行器：负责接收输入、组装 prompt、调用 provider、执行工具、处理重试/停止条件，并记录最终结果。",
            "bundle.config.sources": "Config Sources 管理配置来源：环境变量、配置文件、CLI 覆盖、合并策略和配置校验都在这里。",
            "bundle.foundation.contract-ledger": "Contract Ledger 是装配底账：记录 block manifest、capability ref、资源授权、recipe binding 和一致性引用。",
            "bundle.hermes-agent.product-shells": "Hermes Agent Product Shells 是 Hermes 的入口集合：CLI、SDK、TUI、API server、ACP、gateway 和 dashboard 都从这里接入。",
            "bundle.hermes-agent.prompt-config-ui": "Hermes Prompt / Config / UI 负责 Hermes 的 prompt 资源、配置优先级、命令/UI registry、渲染器和界面壳。",
            "bundle.hermes-agent.provider": "Hermes Agent Provider 是 Hermes 的模型供应商适配组：包含 provider registry、鉴权、请求参数、流式事件和 usage 展示。",
            "bundle.hermes-agent.runtime-contract": "Hermes Runtime Contract 负责 Hermes 运行时兼容层：别名、事件桥、trace、默认能力和产品约束。",
            "bundle.hermes-agent.session": "Hermes Agent Session 是 Hermes 会话适配层：负责 Hermes 的 session ID、存储、历史投影、上下文选择和消息片段格式。",
            "bundle.hermes-agent.tools-extensions": "Hermes Tools / Extensions 负责 Hermes 插件、工具 registry、权限、schema、进程执行和文件系统桥接。",
            "bundle.hermes-agent.turn-loop": "Hermes Turn Loop 复刻 Hermes 的单轮执行节奏：请求边界、provider runner、工具计划、重试、停止和压缩策略。",
            "bundle.hermes.plugin-bridge": "Hermes Plugin Bridge 把 Hermes 插件系统接入 harness：插件加载、事件映射、生命周期清理、hook 和 registry bridge 都在这里。",
            "bundle.hermes.prompt-builder": "Hermes Prompt Builder 负责 Hermes agent prompt：模型/压缩适配、资源加载、工具渲染和资源授权默认值。",
            "bundle.hermes.provider-registry": "Hermes Provider Registry 负责 Hermes provider registry：模型列表、鉴权描述、请求选项、插件描述、stream observer 和 usage renderer。",
            "bundle.hermes.session-sqlite-fts": "Hermes SQLite / FTS Session 是 Hermes 的持久会话组：SQLite FTS 存储、OpenAI 消息投影、线程历史上下文和 lineage 分支图。",
            "bundle.identity-event-trace.core": "Identity / Event / Trace 提供稳定 ID、时钟、工作区解析、事件封装/日志/投影和 trace 记录，是审计和回放底座。",
            "bundle.nanobot.product-shells": "Nanobot Product Shells 是 Nanobot 的入口集合：CLI、SDK、TUI、Web UI 和 server 入口。",
            "bundle.nanobot.prompt-config-ui": "Nanobot Prompt / Config / UI 负责 Nanobot 的 prompt、配置、资源、命令 registry、UI registry 和渲染适配。",
            "bundle.nanobot.provider": "Nanobot Provider 是 Nanobot 的模型供应商适配组：provider 描述、鉴权、请求、stream、usage 和 provider registry。",
            "bundle.nanobot.runtime-contract": "Nanobot Runtime Contract 负责 Nanobot 运行时兼容层：默认能力、事件桥、trace、recipe alias 和产品 gate。",
            "bundle.nanobot.session": "Nanobot Session 是 Nanobot 会话适配层：会话 ID、存储、上下文、分支、分页和消息格式都在这里。",
            "bundle.nanobot.tools-extensions": "Nanobot Tools / Extensions 负责 Nanobot 的工具、扩展、权限、schema、执行器、文件系统和进程桥接。",
            "bundle.nanobot.turn-loop": "Nanobot Turn Loop 复刻 Nanobot 的单轮 agent 流程：请求边界、工具计划、provider runner、重试和最终摘要。",
            "bundle.opencode.product-shells": "OpenCode Product Shells 是 OpenCode 的入口集合：SDK、TUI、Web、server、desktop 等界面入口。",
            "bundle.opencode.prompt-config-ui": "OpenCode Prompt / Config / UI 负责 OpenCode 的 prompt、配置、命令 registry、UI registry、主题和渲染。",
            "bundle.opencode.provider": "OpenCode Provider 是 OpenCode 的模型供应商适配组：provider registry、鉴权描述、请求格式、stream 和 usage。",
            "bundle.opencode.runtime-contract": "OpenCode Runtime Contract 负责 OpenCode 运行时兼容层：默认能力、事件桥、trace、recipe alias 和产品 gate。",
            "bundle.opencode.session": "OpenCode Session 是 OpenCode 会话适配层：会话 ID、存储、JSONL/SQLite 投影、分支和上下文读取。",
            "bundle.opencode.tools-extensions": "OpenCode Tools / Extensions 负责 OpenCode 的插件、工具、权限、schema、进程 runner 和文件系统桥接。",
            "bundle.opencode.turn-loop": "OpenCode Turn Loop 复刻 OpenCode 的单轮执行节奏：请求边界、provider runner、工具计划、重试、停止和摘要。",
            "bundle.pi-mono.product-shells": "Pi Product Shells 是 Pi 的入口集合：CLI、SDK、TUI、Web UI、server 和 RPC 入口。",
            "bundle.pi-mono.prompt-config-ui": "Pi Prompt / Config / UI 负责 Pi 的 prompt、资源、配置、UI registry、命令 registry 和渲染。",
            "bundle.pi-mono.provider": "Pi Provider 是 Pi 的模型供应商适配组：模型 registry、鉴权、请求格式、stream、usage 和 provider 事件。",
            "bundle.pi-mono.runtime-contract": "Pi Runtime Contract 负责 Pi 运行时兼容层：默认能力、事件桥、trace、recipe alias 和产品 gate。",
            "bundle.pi-mono.session": "Pi Session 是 Pi 会话适配层：把 Pi 的 session ID、存储、投影、分支、分页和上下文选择接入 harness。",
            "bundle.pi-mono.tools-extensions": "Pi Tools / Extensions 负责 Pi 的工具扩展、权限、schema、文件系统、进程 runner 和结果投影。",
            "bundle.pi-mono.turn-loop": "Pi Turn Loop 复刻 Pi 的单轮 agent 流程：请求边界、工具计划、provider runner、重试、停止和最终摘要。",
            "bundle.product.minimal-cli": "Minimal CLI Shell 是最小入口壳：只提供一个中性 CLI，用来验证通用 lego 块能独立组装运行。",
            "bundle.prompt.resources": "Prompt / Resources 负责提示词和资源：system prompt、模型能力适配、压缩适配、资源发现/加载、授权和工具说明。",
            "bundle.provider.cassette": "Cassette Provider 是离线回放 provider：用内存或 JSONL cassette 做测试、conformance 和 task parity，不需要真实模型 key。",
            "bundle.provider.openai-compatible": "OpenAI-compatible Provider 是通用真实模型 provider：fetch 传输、API key 鉴权、模型 registry、请求格式、SSE/JSON stream 解析和 usage。",
            "bundle.runtime.assembly-core": "Runtime Assembly Core 是装配运行底盘：模块目录、能力解析、binding planner、生命周期 runner、装配图和验收证据。",
            "bundle.session.memory": "Memory Session 是内存会话底座：消息存储、事件日志、reader/writer、分支、上下文选择和 transcript 投影都在内存里完成。",
            "bundle.session.service-contracts": "Session Service Contracts 是面向服务的会话契约：reader/writer/store/branch/context/pagination 等接口用于产品适配。",
            "bundle.tool.filesystem-shell": "Filesystem / Shell Tools 提供文件系统和 shell 工具包：工作区限制、进程 runner、执行器、权限和工具结果格式。",
            "bundle.tool.schema-permission": "Tool Schema / Permission 负责工具 schema 和权限：echo/meta 工具、权限策略、schema 转换和结果截断。",
            "bundle.ui.basic": "Basic UI 是通用 UI 底座：命令路由、输入规范化、文本/HTML 渲染、快照、主题和 TUI event loop。"
          },
          slots: {
            "product.shell": "Product Interface 决定用户从哪里进入 harness，比如 CLI、SDK、TUI、Web、Server 或 Gateway。",
            "event.envelope": "Event Envelope 负责把运行事件包装成统一结构，方便日志、回放、审计和 UI 同步。",
            "event.log": "Event Log 负责保存事件流，后续调试、回放和状态投影都依赖它。",
            "identity.clock": "Identity Clock 提供时间来源，让 session、事件和 trace 能用一致时间戳排序。",
            "identity.id-generator": "Identity ID Generator 提供通用 ID 生成器，用于事件、资源、运行记录等对象的稳定标识。",
            "identity.workspace-resolver": "Workspace Resolver 负责确定当前 harness 的工作目录和可访问范围。",
            "session.branch-graph": "Session Branch Graph 保存会话分支关系，让 fork、回退和多分支历史可追踪。",
            "session.branching": "Session Branching 负责创建、切换和合并会话分支。",
            "session.compaction-records": "Session Compaction Records 保存压缩记录，说明哪些历史被摘要、何时被摘要。",
            "session.context-selector": "Session Context Selector 决定下一轮模型应该读取哪些历史消息和上下文。",
            "session.diff": "Session Diff 负责比较会话分支或消息变化，用于审计和恢复。",
            "session.event-log": "Session Event Log 记录会话相关事件，比如消息写入、工具结果和分支变化。",
            "session.id-generator": "Session ID Generator 生成或恢复会话 ID，所有消息、工具结果和历史读取都靠它关联到同一段对话。",
            "session.message-part-projector": "Session Message Part Projector 把内部消息片段转换成产品或 provider 需要的消息格式。",
            "session.message-store": "Session Message Store 保存会话消息本体，是 reader/writer 读写的核心存储。",
            "session.pagination": "Session Pagination 负责分页读取历史，避免一次加载过多消息。",
            "session.projector": "Session Projector 把会话数据投影成 transcript、OpenAI messages 或产品原生历史。",
            "session.reader": "Session Reader 按 session ID 读取历史消息和状态，让下一轮运行能带上上下文。",
            "session.store": "Session Store 是会话存储总槽位，可以接内存、JSONL、SQLite 或产品原生存储。",
            "session.writer": "Session Writer 把用户输入、assistant 输出、工具调用、工具结果和事件写回 session。",
            "provider.auth": "Provider Auth 决定 API key、Bearer token 或 query key 如何附加到模型请求。替换它会改变凭据进入 provider 的方式。",
            "provider.cassette": "Provider Cassette 管理离线回放数据，用于没有真实模型调用的测试和 parity。",
            "provider.event-normalizer": "Provider Event Normalizer 把不同供应商的流式事件转换成统一事件格式。",
            "provider.model-registry": "Provider Model Registry 管理模型 ID、模型能力和供应商元信息。",
            "provider.request-shape": "Provider Request Shape 把内部消息和工具定义转换成供应商接受的请求 JSON。",
            "provider.stream": "Provider Stream 执行模型请求，并返回流式事件或最终响应。",
            "provider.stream-parser": "Provider Stream Parser 解析 SSE、JSON 或 cassette 输出，产出统一 provider 事件。",
            "provider.stream-projector": "Provider Stream Projector 把 provider 事件投影成 UI、transcript 或记录需要的输出。",
            "provider.streaming-delta-recorder": "Provider Streaming Delta Recorder 记录流式增量，方便审计、回放和调试。",
            "provider.transport": "Provider Transport 负责真正发请求，比如 fetch、mock SSE 或 cassette transport。",
            "provider.usage-normalizer": "Provider Usage Normalizer 统一 token、价格和 usage 统计格式。",
            "capability.ref": "Capability Ref 负责能力引用规范化，让 recipe、bundle 和 atom 能指向同一种能力名称。",
            "prompt.compaction-adapter": "Prompt Compaction Adapter 把压缩后的历史接回 prompt，避免长上下文丢失关键信息。",
            "prompt.model-capability-adapter": "Prompt Model Capability Adapter 根据模型能力调整 prompt 和工具说明。",
            "prompt.resource-loader": "Prompt Resource Loader 读取 prompt 需要的 markdown、文本或内存资源。",
            "prompt.system-builder": "Prompt System Builder 组装 system/developer 指令，是模型行为边界的核心。",
            "prompt.tool-renderer": "Prompt Tool Renderer 把工具定义渲染成 provider 或 prompt 能理解的说明。",
            "resource.discovery": "Resource Discovery 负责发现可注入 prompt 的文件、说明或上下文资源。",
            "resource.grant": "Resource Grant 校验资源是否允许注入，避免越权读取。",
            "filesystem.port": "Filesystem Port 提供文件读写能力，并限制在允许的 workspace 边界内。",
            "process-runner.port": "Process Runner Port 负责运行 shell 或进程，并收集 stdout、stderr 和退出码。",
            "tool.audit-log": "Tool Audit Log 记录工具调用、参数、结果和权限判断。",
            "tool.definition": "Tool Definition 描述工具名称、输入 schema 和输出形态。",
            "tool.executor": "Tool Executor 真正执行工具调用，并把结果交回 agent loop。",
            "tool.permission-policy": "Tool Permission Policy 决定工具是允许、拒绝、询问还是按产品策略处理。",
            "tool.registry": "Tool Registry 注册所有可用工具，让 agent loop 能找到并调用它们。",
            "tool.result-normalizer": "Tool Result Normalizer 把不同工具结果统一成可记录、可展示、可喂给模型的格式。",
            "tool.schema-adapter": "Tool Schema Adapter 把 TypeScript、JSON Schema、Zod、TypeBox 等 schema 转成统一工具 schema。",
            "tools.batch-scheduler": "Tools Batch Scheduler 负责并行或批量调度多个工具调用。",
            "tools.result-projector": "Tools Result Projector 把工具结果投影到 transcript、UI 或事件流。",
            "tools.schema": "Tools Schema 提供工具 schema 的默认规范和校验。",
            "registry.ui": "Registry UI 注册 UI provider 或渲染器，让产品界面能发现可用 UI 能力。",
            "ui.command-router": "UI Command Router 把界面命令路由到对应 action 或工具。",
            "ui.event-loop": "UI Event Loop 处理 TUI/Web 等界面的输入输出循环。",
            "ui.input-normalizer": "UI Input Normalizer 把不同界面输入转换成统一用户消息。",
            "ui.renderer": "UI Renderer 把运行状态渲染成文本、HTML、TUI 或空输出。",
            "ui.snapshot": "UI Snapshot 记录界面状态快照，用于测试和审计。",
            "ui.theme-registry": "UI Theme Registry 管理主题和样式 token。",
            "agent-loop.final-summary": "Final Summary 负责一轮运行结束后的摘要和最终输出。",
            "agent-loop.request-boundary": "Request Boundary 负责进入 agent loop 前的输入校验、边界整理和运行上下文创建。",
            "block.manifest": "Block Manifest 描述 lego 块的元数据、能力和装配信息。",
            "config.merge-strategy": "Config Merge Strategy 决定多个配置来源如何合并和覆盖。",
            "config.source": "Config Source 提供配置来源，比如 env、文件或 CLI 参数。",
            "config.validator": "Config Validator 校验配置结构和取值。",
            "conformance.ref": "Conformance Ref 指向测试 fixture、parity 证据和验收入口。",
            "hook.bus": "Hook Bus 管理生命周期 hook 的发布和订阅。",
            "hook.cleanup-scope": "Hook Cleanup Scope 负责运行结束后的资源清理边界。",
            "hook.error-policy": "Hook Error Policy 决定 hook 失败时是继续、警告还是阻塞。",
            "hook.handler-chain": "Hook Handler Chain 按顺序执行会改变行为的 hook。",
            "hook.observer-chain": "Hook Observer Chain 执行只观察、不改写主流程的 hook。",
            "hook.scheduler": "Hook Scheduler 调度 hook 的执行顺序和并发策略。",
            "recipe.binding": "Recipe Binding 记录端口到 atom/module 的绑定关系。",
            "registry.command": "Registry Command 注册产品命令和命令处理器。",
            "registry.provider": "Registry Provider 注册 provider 插件或 provider 描述。",
            "runtime.acceptance-controller": "Acceptance Controller 负责组织装配验收检查。",
            "runtime.acceptance-evidence": "Acceptance Evidence 保存验收证据和检查结果。",
            "runtime.assembly-graph": "Assembly Graph 保存装配后的依赖图和端口连接图。",
            "runtime.binding-planner": "Binding Planner 根据端口和候选块生成绑定计划。",
            "runtime.capability-resolver": "Capability Resolver 根据能力名找到可用 atom 或 bundle。",
            "runtime.lifecycle-runner": "Lifecycle Runner 管理启动、运行、停止和清理流程。",
            "runtime.module-catalog": "Module Catalog 保存可装配模块目录，是装配查找的基础。",
            "tools": "Tools 是产品暴露给 agent 的工具集合入口。",
            "trace.recorder": "Trace Recorder 记录调用链和诊断轨迹，便于调试。",
            "turn.compaction-policy": "Turn Compaction Policy 决定一轮运行前是否压缩历史。",
            "turn.context-builder": "Turn Context Builder 组装本轮模型需要的上下文。",
            "turn.continuation-policy": "Turn Continuation Policy 决定模型未完成时是否自动继续生成。",
            "turn.input-normalizer": "Turn Input Normalizer 把用户输入转换成统一 turn input。",
            "turn.prompt-assembler": "Turn Prompt Assembler 把上下文、system prompt 和工具说明拼成 provider 请求前的 prompt。",
            "turn.provider-request-builder": "Turn Provider Request Builder 生成本轮 provider 请求。",
            "turn.provider-stream-runner": "Turn Provider Stream Runner 执行 provider stream 并把事件交给 reducer。",
            "turn.result-recorder": "Turn Result Recorder 记录本轮步骤、输出和错误。",
            "turn.retry-policy": "Turn Retry Policy 决定模型或工具失败后的重试策略。",
            "turn.stop-condition": "Turn Stop Condition 决定一轮任务什么时候结束。",
            "turn.stream-reducer": "Turn Stream Reducer 把流式事件合并成 assistant 消息和步骤结果。",
            "turn.tool-call-planner": "Turn Tool Call Planner 决定工具调用顺序、并行方式和批次。",
            "turn.tool-executor": "Turn Tool Executor 在 agent loop 内执行工具调用。"
          },
          actions: {
            add: "添加会把这个部件放入 harness，但不会自动替换当前槽位。",
            install: "装入会把组合块放进当前槽位，并添加它包含的底层 atoms。",
            remove: "卸下会移除这个组合块独占的 atoms；共享 atoms 会保留。",
            complete: "补齐会把缺失 atoms 加回来，让这个组合块恢复完整。",
            replace: "替换会用这个候选组合块换掉当前槽位的有效提供者，之后需要检查绑定和验收。",
            "replace-family": "替换同组会先预览将卸下的同族组合块、保留共享 atoms，并迁移可确定的绑定。",
            candidateBundle: "这是候选组合块：点击会整体装入一组相关 atoms。",
            providerChoice: "这是候选 provider atom：点击会把它绑定到当前端口。"
          },
          statuses: {
            selected: "已选表示组合块完整装入，并会作为 bundle ref 导出。",
            partial: "部分选择表示只装了组合块的一部分 atoms，需要补齐或确认这是有意拆开。",
            customized: "自定义表示组合块已被手动改动，可能删除、替换或单独添加了底层 atoms。"
          },
          sources: {
            explicit: "显式表示用户直接装入了这个组合块。",
            inferred: "推断表示系统根据已选 atoms 识别出这个组合块，但还没有被用户明确管理。",
            untracked: "未跟踪表示当前只是底层 atoms，没有作为组合块整体管理。"
          }
        }
      };

      function helpCopy() {
        return HELP_COPY.zh;
      }

      function bundleExplanation(bundle) {
        return bundle && helpCopy().bundles[bundle.id] ? helpCopy().bundles[bundle.id] : helpCopy().fallback;
      }

      function slotExplanation(slot) {
        var portID = slot && slot.primaryPortID ? slot.primaryPortID : "";
        return helpCopy().slots[portID] || helpCopy().fallback;
      }

      function atomExplanation(atom) {
        var portID = atom && atom.provides && atom.provides[0] ? atom.provides[0] : "";
        return helpCopy().slots[portID] || helpCopy().atomFallback;
      }

      function bundleActionHelp(bundle, actionKind) {
        return helpCopy().actions[actionKind] || helpCopy().actions.add;
      }

      function bundleStatusHelp(info) {
        return info ? helpCopy().statuses[info.status] || "" : "";
      }

      function bundleSourceHelp(source) {
        return helpCopy().sources[source || "untracked"] || "";
      }

      function candidateBundleHelp(bundle) {
        return helpCopy().actions.candidateBundle + " " + bundleExplanation(bundle);
      }

      function providerChoiceHelp(candidate, port) {
        var atom = atomByID.get(candidate);
        return helpCopy().actions.providerChoice + " " + (atom ? atomExplanation(atom) : slotExplanation({ primaryPortID: port ? port.id : "" }));
      }

      function classificationLabel(value) {
        if (value === "fixes required port") return t("classification.fixRequired");
        if (value === "changes native parity evidence") return t("classification.nativeParity");
        if (value === "needs validation") return t("classification.needsValidation");
        return value;
      }

      function renderChrome() {
        document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
        var app = document.querySelector("[data-harness-builder]");
        if (app) app.dataset.builderLocale = state.locale;
        setText("appSubtitle", t("app.subtitle"));
        setText("topNewButton", t("action.new"));
        setText("presetButton", t("action.presets"));
        setText("indexButton", t("action.index"));
        setText("topImportButton", t("action.import"));
        setText("saveButton", t("action.save"));
        setText("runOpenButton", t("action.run"));
        setText("topCompileButton", t("action.compile"));
        setText("clearButton", t("action.clear"));
        setText("exportButton", t("action.export"));
        setText("moreMenuButton", t("action.more"));
        setText("moreStatusButton", t("audit.title"));
        setText("moreFlowButton", t("flow.title"));
        setText("moreTuiButton", t("tui.title"));
        setText("workflowChoose", t("workflow.choose"));
        setText("workflowCustomize", t("workflow.customize"));
        setText("workflowValidate", t("workflow.validate"));
        setText("startEyebrow", t("start.eyebrow"));
        setText("startTitle", t("start.title"));
        setText("startDescription", t("start.description"));
        setText("filterMoreLabel", t("filter.more"));
        setText("wizardTitle", t("wizard.title"));
        setText("wizardCancelButton", t("action.cancel"));
        setText("wizardCreateButton", t("action.create"));
        setText("runTitle", t("run.title"));
        setText("runProviderLabel", t("run.provider"));
        setText("runBaseURLLabel", t("run.baseURL"));
        setText("runModelLabel", t("run.model"));
        setText("runAPIKeyLabel", t("run.apiKey"));
        setText("runPromptLabel", t("run.prompt"));
        setText("runMaxStepsLabel", t("run.maxSteps"));
        setText("runCancelButton", t("action.cancel"));
        setText("runStartButton", t("run.start"));
        setText("removeImpactTitle", t("remove.title"));
        setText("removeImpactCancelButton", t("action.cancel"));
        setText("removeImpactFocusButton", t("remove.focus"));
        setText("removeImpactBundleButton", t("remove.bundle"));
        setText("removeImpactConfirmButton", t("remove.confirm"));
        setText("startNewButton", t("start.new"));
        setText("startImportButton", t("action.import"));
        setText("boardTitle", t("board.title"));
        setText("auditTitle", t("audit.title"));
        setText("auditBadge", t("audit.badge"));
        setText("currentAssemblyTabButton", t("inspector.blueprint"));
        setText("pendingChangeTabButton", t("inspector.preview"));
        setText("detailsOpenButton", t("details.button"));
        setText("detailsTitle", t("details.title"));
        setText("detailsNavMaterialsButton", t("details.materials"));
        setText("detailsNavAuditButton", t("details.audit"));
        setText("detailsNavRawButton", t("details.raw"));
        setText("detailsNavCommandsButton", t("details.commands"));
        setText("blueprintTitle", t("blueprint.title"));
        setText("previewTitle", t("inspector.preview"));
        setText("metricsTitle", t("current.metrics"));
        setText("readinessTitle", t("current.readiness"));
        setText("assemblySummaryTitle", t("current.summary"));
        setText("diagnosticsTitle", t("current.diagnostics"));
        setText("pendingImpactTitle", t("pending.impact"));
        setText("activationTitle", t("activation.title"));
        setText("tuiTitle", t("tui.title"));
        setText("rightStatusCardButton", t("audit.title"));
        setText("rightFlowCardButton", t("flow.tab"));
        setText("rightTuiCardButton", t("tui.title"));
        setText("flowCardTitle", t("flow.tab"));
        setText("flowCardHintTitle", t("flow.cardHintTitle"));
        setText("flowCardHintText", t("flow.cardHintText"));
        document.querySelectorAll("[data-builder-assembly-flow-mode-button]").forEach(function (button) {
          var mode = button.dataset.builderAssemblyFlowModeButton;
          if (mode === "blueprint" || mode === "trace" || mode === "compare") button.textContent = t("flow." + mode);
        });
        setText("bomTitle", t("bom.title"));
        setText("coverageTitle", t("coverage.title"));
        setText("detailTitle", t("raw.title"));
        setText("commandTitle", t("details.commands"));
        var copyRawButton = document.querySelector("[data-copy-raw-recipe]");
        if (copyRawButton) copyRawButton.textContent = t("details.copyJSON");
        var downloadRawButton = document.querySelector('[data-builder-details-raw] [data-action="download"]');
        if (downloadRawButton) downloadRawButton.textContent = t("details.downloadJSON");
        var detailsNav = document.querySelector("[data-builder-details-nav]");
        if (detailsNav) detailsNav.setAttribute("aria-label", t("details.navAria"));
        var inspectorTabs = document.getElementById("inspectorTabs");
        if (inspectorTabs) inspectorTabs.setAttribute("aria-label", t("inspector.tabsAria"));
        var workflow = document.getElementById("builderWorkflow");
        if (workflow) workflow.setAttribute("aria-label", t("workflow.aria"));
        var wizardClose = document.getElementById("wizardCloseButton");
        if (wizardClose) wizardClose.title = t("action.close");
        var runClose = document.getElementById("runCloseButton");
        if (runClose) runClose.title = t("action.close");
        var removeImpactClose = document.getElementById("removeImpactCloseButton");
        if (removeImpactClose) removeImpactClose.title = t("action.close");
        var detailsClose = document.getElementById("detailsCloseButton");
        if (detailsClose) detailsClose.title = t("action.close");
        var search = document.getElementById("atomSearch");
        if (search) {
          search.setAttribute("placeholder", t("filter.search"));
          search.setAttribute("aria-label", t("filter.searchAria"));
        }
        var localeToggle = document.getElementById("localeToggle");
        if (localeToggle) {
          localeToggle.textContent = state.locale === "zh" ? "EN" : "中文";
          localeToggle.dataset.builderLocale = state.locale;
          localeToggle.setAttribute("aria-label", t("locale.aria"));
          localeToggle.setAttribute("title", t("locale.aria"));
        }
      }

      function unique(values) {
        return Array.from(new Set(values.filter(Boolean))).sort();
      }

      function orderedUnique(values) {
        var seen = new Set();
        return (values || []).filter(function (value) {
          if (!value || seen.has(value)) return false;
          seen.add(value);
          return true;
        });
      }

      function shellQuote(value) {
        return "'" + String(value).replace(/'/g, "'\\''") + "'";
      }

      function presetForProduct(product) {
        return DATA.presets.find(function (item) { return item.product === product || item.id === product; }) || DATA.presets[0];
      }

      function currentWizardProduct() {
        return WIZARD_PRODUCTS.find(function (product) { return product.id === state.wizardProduct; }) || WIZARD_PRODUCTS[0];
      }

      function wizardSurfaceList(product) {
        return Object.keys((product && product.surfaces) || {}).sort();
      }

      function selectedWizardSurfaces(product) {
        if (!product) return [];
        if (product.primarySurface && product.surfaces[product.primarySurface]) return [product.primarySurface];
        return wizardSurfaceList(product).slice(0, 1);
      }

      function primaryWizardShell(product) {
        if (!product) return "";
        var surfaces = selectedWizardSurfaces(product);
        var primary = surfaces.includes(product.primarySurface) ? product.primarySurface : surfaces[0];
        return primary ? product.surfaces[primary] : "";
      }

      function currentWizardProfile() {
        return WIZARD_PROFILES.find(function (profile) { return profile.id === state.wizardProfile; }) || WIZARD_PROFILES[0];
      }

      function wizardProfileAutofills(profile) {
        return Boolean(profile && (profile.id === "starter" || profile.id === "livecodebench" || profile.id === "product"));
      }

      function productPrefix(product) {
        if (product === "opencode") return "opencode.";
        if (product === "pi-mono") return "pi.";
        if (product === "nanobot") return "nanobot.";
        if (product === "hermes-agent") return "hermes.";
        return "";
      }

      function commonCandidate(atomID) {
        return !atomID.startsWith("opencode.") && !atomID.startsWith("pi.") && !atomID.startsWith("nanobot.") && !atomID.startsWith("hermes.") && !atomID.startsWith("test.");
      }

      function atomSourceProduct(atomID) {
        if (atomID && atomID.startsWith("opencode.")) return "opencode";
        if (atomID && atomID.startsWith("pi.")) return "pi-mono";
        if (atomID && atomID.startsWith("nanobot.")) return "nanobot";
        if (atomID && atomID.startsWith("hermes.")) return "hermes-agent";
        return "common";
      }

      function parityTargetRef(target) {
        return target ? String(target.repo || target.product || "target") + "@" + String(target.ref || "") : "";
      }

      function customParityTargets() {
        var product = state.customProduct || "";
        var sourcePreset = DATA.presets.find(function (item) { return item.product === product || item.id === state.customPresetID || item.id === product; });
        return sourcePreset && Array.isArray(sourcePreset.parityTargets) ? sourcePreset.parityTargets.slice() : [];
      }

      function parityTargetForSource(sourceProduct, targets) {
        var list = Array.isArray(targets) ? targets : [];
        if (list.length === 1) return list[0];
        return list.find(function (target) { return target.product === sourceProduct; }) || null;
      }

      function atomHasNativeProof(atom) {
        var evidenceRefs = Array.isArray(atom && atom.nativeEvidenceRefs) ? atom.nativeEvidenceRefs : [];
        var fixtureIDs = Array.isArray(atom && atom.fixtureIDs) ? atom.fixtureIDs : [];
        var lossiness = Array.isArray(atom && atom.knownLossiness) ? atom.knownLossiness : [];
        return Boolean(atom && atom.parityCoverage === "native" && evidenceRefs.length > 0 && fixtureIDs.length > 0 && lossiness.length === 0 && implementationLevel(atom) === "native");
      }

      function moduleClaimForBinding(portID, providerAtomID, presetProduct, targets) {
        var atom = atomByID.get(providerAtomID);
        var sourceProduct = atom ? atomSourceProduct(atom.id) : "unknown";
        var target = parityTargetForSource(sourceProduct, targets);
        var level = atom ? implementationLevel(atom) : "metadata-only";
        var evidenceRefs = Array.isArray(atom && atom.nativeEvidenceRefs) ? atom.nativeEvidenceRefs : [];
        var fixtureIDs = Array.isArray(atom && atom.fixtureIDs) ? atom.fixtureIDs : [];
        var lossiness = Array.isArray(atom && atom.knownLossiness) ? atom.knownLossiness : [];
        var portCompatible = Boolean(atom && Array.isArray(atom.provides) && atom.provides.includes(portID));
        var executableRequired = compileRequiresExecutableProvider(portID);
        var behaviorCompatible = Boolean(atom) && portCompatible && !(executableRequired && (level === "metadata-only" || level === "preview-shell"));
        var productMatchesTarget = Boolean(target && sourceProduct === target.product);
        var nativeProof = atomHasNativeProof(atom);
        var parityTargetSatisfied = Boolean(target && productMatchesTarget && nativeProof);
        var blockers = unique([]
          .concat(atom ? [] : ["provider-atom-missing"])
          .concat(portCompatible ? [] : ["port-not-provided-by-atom"])
          .concat(executableRequired && level === "metadata-only" ? ["metadata-only-provider-for-executable-port"] : [])
          .concat(executableRequired && level === "preview-shell" ? ["preview-shell-provider-for-executable-port"] : [])
          .concat(target ? [] : ["no-parity-target"])
          .concat(target && !productMatchesTarget ? ["source-product-mismatch"] : [])
          .concat(target && !nativeProof ? ["module-claim-" + level] : [])
          .concat(lossiness));
        var parityCompatible = !target ? "not-targeted" : parityTargetSatisfied ? "satisfied" : behaviorCompatible ? "partial" : "blocked";
        var targetText = target ? parityTargetRef(target) : "no upstream parity target";
        var summary = parityTargetSatisfied
          ? providerAtomID + " satisfies " + targetText + " for " + portID + "."
          : !target
            ? providerAtomID + " is " + level + " for " + portID + "; it is port/behavior compatible in " + (presetProduct || "custom") + ", but no upstream parity target is attached."
            : providerAtomID + " is " + level + " from " + sourceProduct + " for " + portID + "; it does not satisfy " + targetText + " yet (" + (blockers.slice(0, 4).join(", ") || parityCompatible) + ").";
        return {
          level: level,
          label: atom ? implementationLabel(atom) : "Metadata only",
          sourceProduct: sourceProduct,
          sourceScope: atom && atom.scope ? atom.scope : "unknown",
          parityTargetProduct: target ? target.product : undefined,
          parityTargetRef: target ? parityTargetRef(target) : undefined,
          portCompatible: portCompatible,
          behaviorCompatible: behaviorCompatible,
          parityCompatible: parityCompatible,
          parityTargetSatisfied: parityTargetSatisfied,
          evidenceRefs: evidenceRefs,
          fixtureIDs: fixtureIDs,
          knownLossiness: lossiness,
          blockers: blockers,
          summary: summary
        };
      }

      var PORT_STAGES = [
        { id: "interface", labelKey: "stage.interface" },
        { id: "session", labelKey: "stage.session" },
        { id: "provider", labelKey: "stage.provider" },
        { id: "prompt", labelKey: "stage.prompt" },
        { id: "tools", labelKey: "stage.tools" },
        { id: "ui", labelKey: "stage.ui" },
        { id: "runtime", labelKey: "stage.runtime" }
      ];

      var ASSEMBLY_VIEWS = [
        { id: "flow", labelKey: "assemblyView.flow" },
        { id: "technical", labelKey: "assemblyView.technical" }
      ];

      function portStage(portID) {
        if (portID === "product.shell") return "interface";
        if (portID.startsWith("session.") || portID.startsWith("identity.") || portID.startsWith("event.")) return "session";
        if (portID.startsWith("provider.")) return "provider";
        if (portID.startsWith("tool.") || portID.startsWith("tools.") || portID === "filesystem.port" || portID === "process-runner.port") return "tools";
        if (portID.startsWith("prompt.") || portID.startsWith("resource.") || portID.startsWith("capability.")) return "prompt";
        if (portID.startsWith("ui.") || portID === "registry.ui") return "ui";
        return "runtime";
      }

      function currentAssemblyView() {
        return state.assemblyView === "technical" ? "technical" : "flow";
      }

      function renderAssemblyViewToggle() {
        var current = currentAssemblyView();
        return ASSEMBLY_VIEWS.map(function (view) {
          return '<button type="button" data-assembly-view="' + h(view.id) + '" data-builder-assembly-view-option="' + h(view.id) + '" aria-pressed="' + String(current === view.id) + '">' + h(t(view.labelKey)) + '</button>';
        }).join("");
      }

      function setAssemblyView(view) {
        if (!ASSEMBLY_VIEWS.some(function (item) { return item.id === view; })) return;
        if (currentAssemblyView() === view) return;
        var selectedSlot = activeSlot();
        state.assemblyView = view;
        state.collapsedStages = new Set();
        if (state.guideActive) {
          state.guideStage = selectedSlot ? slotAssemblyStage(selectedSlot) : state.activePort ? portAssemblyStage(state.activePort) : "";
        }
        render();
      }

      function portTechnicalStage(portID) {
        if (portID === "product.shell") return "interface";
        var port = portByID.get(portID);
        if (port && port.plane) return port.plane === "product" ? "interface" : port.plane;
        return portStage(portID);
      }

      function portAssemblyStage(portID, view) {
        return (view || currentAssemblyView()) === "technical" ? portTechnicalStage(portID) : portStage(portID);
      }

      function slotAssemblyStage(slot, view) {
        if (!slot) return "";
        if ((view || currentAssemblyView()) !== "technical") return slot.stage;
        var primary = slot.primaryPortID ? portTechnicalStage(slot.primaryPortID) : "";
        if (primary) return primary;
        return ((slot.portIDs || []).map(portTechnicalStage).find(Boolean)) || slot.stage || "runtime";
      }

      function assemblyStageOrder(view) {
        if ((view || currentAssemblyView()) === "technical") {
          return orderedUnique(["interface"].concat((DATA.planes || []).filter(function (plane) { return plane !== "product"; })));
        }
        return PORT_STAGES.map(function (stage) { return stage.id; });
      }

      function assemblyStageDescriptor(stageID, view) {
        var flowStage = PORT_STAGES.find(function (stage) { return stage.id === stageID; });
        return {
          id: stageID,
          label: (view || currentAssemblyView()) === "flow" && flowStage ? t(flowStage.labelKey) : slotStageLabel(stageID)
        };
      }

      function groupPortsByStage(portIDs, view) {
        var assemblyView = view || currentAssemblyView();
        var uniquePorts = unique(portIDs);
        var stageIDs = orderedUnique(assemblyStageOrder(assemblyView).concat(uniquePorts.map(function (portID) { return portAssemblyStage(portID, assemblyView); })));
        return stageIDs.map(function (stageID) {
          var descriptor = assemblyStageDescriptor(stageID, assemblyView);
          return Object.assign({}, descriptor, {
            ports: uniquePorts.filter(function (portID) { return portAssemblyStage(portID, assemblyView) === stageID; })
          });
        }).filter(function (stage) { return stage.ports.length > 0; });
      }

      function assemblyStagesForSlots(slots, view) {
        var assemblyView = view || currentAssemblyView();
        var slotStageIDs = (slots || []).map(function (slot) { return slotAssemblyStage(slot, assemblyView); });
        return orderedUnique(assemblyStageOrder(assemblyView).concat(slotStageIDs)).filter(function (stageID) {
          return slotStageIDs.includes(stageID);
        }).map(function (stageID) {
          return assemblyStageDescriptor(stageID, assemblyView);
        });
      }

      function guideStages() {
        var current = preset();
        return groupPortsByStage(current ? current.requiredPorts : []);
      }

      function activeGuideStage() {
        var stages = guideStages();
        if (!state.guideActive || stages.length === 0) return null;
        return stages.find(function (stage) { return stage.id === state.guideStage; }) || stages[0];
      }

      function guideStagePorts() {
        var stage = activeGuideStage();
        return stage ? stage.ports : [];
      }

      function slotForPort(portID) {
        return (DATA.slots || []).find(function (slot) { return slot.primaryPortID === portID || slot.portIDs.includes(portID); }) || null;
      }

      function activeSlot() {
        return slotByID.get(state.activeSlot) || (state.activePort ? slotForPort(state.activePort) : null);
      }

      function stageIndex(stageID, view) {
        var order = assemblyStageOrder(view || currentAssemblyView());
        var index = order.indexOf(stageID);
        return index < 0 ? order.length : index;
      }

      function slotStageLabel(stageID) {
        var stage = PORT_STAGES.find(function (item) { return item.id === stageID; });
        return stage ? t(stage.labelKey) : laneLabel(stageID);
      }

      function slotStatusLabel(status) {
        return t("slot." + status);
      }

      function slotNeedsAssembly(slot, cov) {
        var status = slotState(slot, cov).status;
        return status === "empty" || status === "partial" || status === "conflict";
      }

      function requiredSlots() {
        var current = preset();
        var requiredPorts = current ? current.requiredPorts : [];
        var seen = new Set();
        var slots = [];
        function addSlot(slot) {
          if (!slot || seen.has(slot.id)) return;
          seen.add(slot.id);
          slots.push(slot);
        }
        requiredPorts.forEach(function (portID) {
          var slot = slotForPort(portID);
          addSlot(slot);
        });
        Array.from(state.selectedBundles).forEach(function (bundleID) {
          var bundle = bundleByID.get(bundleID);
          slotsForBundle(bundle).forEach(addSlot);
        });
        if (state.previewBundle) slotsForBundle(bundleByID.get(state.previewBundle)).forEach(addSlot);
        selectedAtoms().forEach(function (atom) {
          atom.provides.forEach(function (portID) { addSlot(slotForPort(portID)); });
        });
        return slots.sort(function (left, right) {
          var assemblyView = currentAssemblyView();
          var stageDelta = stageIndex(slotAssemblyStage(left, assemblyView), assemblyView) - stageIndex(slotAssemblyStage(right, assemblyView), assemblyView);
          return stageDelta === 0 ? left.id.localeCompare(right.id) : stageDelta;
        });
      }

      function slotState(slot, cov) {
        var requiredPorts = slot.portIDs.filter(function (portID) { return cov.required.includes(portID); });
        var installedBundleIDs = unique(bundlesForSlot(slot, cov).filter(function (bundle) {
          var info = bundleState(bundle);
          return info.selectedAtoms.length > 0 || (info.tracked && info.status === "customized");
        }).map(function (bundle) { return bundle.id; }));
        var providerAtomIDs = unique(slot.portIDs.flatMap(function (portID) { return cov.providers.get(portID) || []; }));
        var primaryBundleAtomIDs = unique(installedBundleIDs.flatMap(function (bundleID) {
          var bundle = bundleByID.get(bundleID);
          if (!bundle) return [];
          return atomIDsForSlot(selectedPrimaryAtomIDsForBundle(bundle), slot);
        }));
        var installedAtomIDs = unique(providerAtomIDs.concat(primaryBundleAtomIDs));
        var optionalAtomIDs = unique(installedBundleIDs.flatMap(function (bundleID) {
          var bundle = bundleByID.get(bundleID);
          if (!bundle) return [];
          return atomIDsForSlot(selectedOptionalAtomIDsForBundle(bundle), slot);
        }).filter(function (atomID) { return !installedAtomIDs.includes(atomID); }));
        var variantAtomIDs = unique(selectedAtoms().filter(function (atom) {
          return atom.provides.some(function (portID) { return slot.portIDs.includes(portID); });
        }).map(function (atom) { return atom.id; }).filter(function (atomID) {
          return !installedAtomIDs.includes(atomID) && !optionalAtomIDs.includes(atomID);
        }));
        var missingPorts = requiredPorts.filter(function (portID) { return (cov.providers.get(portID) || []).length === 0; });
        var conflictPorts = requiredPorts.filter(function (portID) {
          var port = portByID.get(portID);
          return Boolean(port && port.multiplicity === "single" && (cov.providers.get(portID) || []).length > 1 && !state.bindings.has(portID));
        });
        var customized = installedBundleIDs.some(function (bundleID) {
          var bundle = bundleByID.get(bundleID);
          var info = bundle ? bundleState(bundle) : null;
          return info && (info.status === "customized" || info.status === "partial");
        });
        var bindingMissingPorts = slot.portIDs.filter(function (portID) {
          var providerID = state.bindings.get(portID);
          return Boolean(providerID && !state.selected.has(providerID));
        });
        var removalPreview = state.previewAction === "remove" && state.previewBundle ? previewBundleRemoval(state.previewBundle) : null;
        var removalBreakPorts = removalPreview && removalPreview.targetSlotIDs.includes(slot.id)
          ? removalPreview.breakPortIDs.filter(function (portID) { return slot.portIDs.includes(portID); })
          : [];
        function warningPorts(ports) {
          return ports.slice(0, 3).join(", ") + (ports.length > 3 ? "..." : "");
        }
        var warnings = [];
        if (missingPorts.length > 0) warnings.push({ id: "slot.required-port.missing", severity: "error", refs: missingPorts, message: tx("slot.warning.missing", { ports: warningPorts(missingPorts) }) });
        if (conflictPorts.length > 0) warnings.push({ id: "slot.single-provider.conflict", severity: "warning", refs: conflictPorts, message: tx("slot.warning.conflict", { ports: warningPorts(conflictPorts) }) });
        if (bindingMissingPorts.length > 0) warnings.push({ id: "slot.binding.provider-missing", severity: "warning", refs: bindingMissingPorts, message: tx("slot.warning.binding", { ports: warningPorts(bindingMissingPorts) }) });
        if (customized) warnings.push({ id: "slot.bundle.customized", severity: "warning", refs: installedBundleIDs, message: t("slot.warning.customized") });
        if (removalBreakPorts.length > 0) warnings.push({ id: "slot.remove.required-break", severity: "error", refs: removalBreakPorts, message: tx("slot.warning.removal", { ports: warningPorts(removalBreakPorts) }) });
        var status = conflictPorts.length > 0
          ? "conflict"
          : installedAtomIDs.length === 0 && installedBundleIDs.length === 0
            ? "empty"
            : customized
                ? "customized"
                : missingPorts.length > 0
                  ? "partial"
                  : "installed";
        return {
          status: status,
          installedAtomIDs: installedAtomIDs,
          optionalAtomIDs: optionalAtomIDs,
          variantAtomIDs: variantAtomIDs,
          installedBundleIDs: installedBundleIDs,
          boundProviderAtomID: state.bindings.get(slot.primaryPortID) || installedAtomIDs[0] || "",
          candidateCount: unique(bundlesForSlot(slot, cov).map(function (bundle) { return bundle.id; }).concat(slot.candidateAtomIDs || [])).length,
          required: requiredPorts.length > 0,
          missingPorts: missingPorts,
          conflictPorts: conflictPorts,
          warnings: warnings
        };
      }

      function bundlesForSlot(slot, cov) {
        if (!slot) return [];
        var currentCoverage = cov || coverage();
        var current = preset();
        var product = current ? current.product : state.customProduct || "custom";
        var requiredPorts = slot.portIDs.filter(function (portID) { return currentCoverage.required.includes(portID); });
        var candidateIDs = unique((slot.candidateBundleIDs || []).concat((DATA.bundles || []).filter(function (bundle) {
          return (bundle.ports || []).some(function (portID) { return slot.portIDs.includes(portID); }) ||
            (bundle.atoms || []).some(function (atomID) {
              var atom = atomByID.get(atomID);
              return Boolean(atom && atom.provides.some(function (portID) { return slot.portIDs.includes(portID); }));
            });
        }).map(function (bundle) { return bundle.id; })));
        function scopeScore(bundle) {
          if (bundle.productScope === product) return 60;
          if (bundle.productScope === "common") return 40;
          if (slot.productScope === bundle.productScope) return 20;
          return 0;
        }
        function score(bundle) {
          var primary = (bundle.ports || []).includes(slot.primaryPortID) ? 1000 : 0;
          var required = requiredPorts.filter(function (portID) { return (bundle.ports || []).includes(portID); }).length * 160;
          var covered = slot.portIDs.filter(function (portID) { return (bundle.ports || []).includes(portID); }).length * 40;
          var stable = bundle.stability === "stable" ? 10 : 0;
          return primary + required + covered + scopeScore(bundle) + stable;
        }
        return candidateIDs.map(function (bundleID) { return bundleByID.get(bundleID); }).filter(Boolean).sort(function (left, right) {
          var scoreDelta = score(right) - score(left);
          return scoreDelta === 0 ? left.id.localeCompare(right.id) : scoreDelta;
        });
      }

      function slotsForBundle(bundle) {
        if (!bundle) return [];
        return (DATA.slots || []).filter(function (slot) {
          return (slot.candidateBundleIDs || []).includes(bundle.id) || (bundle.ports || []).some(function (portID) { return slot.portIDs.includes(portID); });
        }).sort(function (left, right) {
          var active = activeSlot();
          if (active && left.id === active.id) return -1;
          if (active && right.id === active.id) return 1;
          var stageDelta = stageIndex(left.stage, "flow") - stageIndex(right.stage, "flow");
          return stageDelta === 0 ? left.id.localeCompare(right.id) : stageDelta;
        });
      }

      function bundleMatchesSlot(bundle, slot) {
        if (!slot) return true;
        return slotsForBundle(bundle).some(function (candidate) { return candidate.id === slot.id; });
      }

      function hasManualLibraryFilter() {
        return Boolean(state.query.trim() || state.plane !== "all" || state.scope !== "all" || state.view !== "all");
      }

      function providersForSelectedPort(portID, selected, bindings) {
        var candidates = Array.from(selected).filter(function (atomID) {
          var atom = atomByID.get(atomID);
          return atom && atom.provides.includes(portID);
        }).sort();
        var bound = bindings.get(portID);
        return bound && candidates.includes(bound) ? [bound] : candidates;
      }

      function bundleFamily(bundle) {
        if (!bundle || !bundle.exclusiveFamilyID || bundle.exclusiveFamilyPolicy === "allow-many") return null;
        return {
          id: bundle.exclusiveFamilyID,
          label: bundle.exclusiveFamilyLabel || bundle.exclusiveFamilyID,
          policy: bundle.exclusiveFamilyPolicy || "replace",
          ports: bundle.exclusiveFamilyPorts || bundle.ports || []
        };
      }

      function bundleHasSelectedAtoms(bundle, selected) {
        var currentSelected = selected || state.selected;
        return Boolean(bundle && selectedAtomIDsForBundle(bundle, currentSelected).length > 0);
      }

      function activeFamilyBundleIDs(familyID, selected, options) {
        var currentSelected = selected || state.selected;
        var policy = options && options.policy ? options.policy : "";
        return (DATA.bundles || []).filter(function (bundle) {
          if (bundle.exclusiveFamilyID !== familyID) return false;
          if (policy && (bundle.exclusiveFamilyPolicy || "replace") !== policy) return false;
          return state.selectedBundles.has(bundle.id) || state.inferredBundles.has(bundle.id) || bundleHasSelectedAtoms(bundle, currentSelected);
        }).map(function (bundle) { return bundle.id; }).sort();
      }

      function familyConflicts(selected) {
        var current = preset();
        if (current && current.product === "hybrid-mix") return [];
        var byFamily = new Map();
        (DATA.bundles || []).forEach(function (bundle) {
          var family = bundleFamily(bundle);
          if (!family || !bundleHasSelectedAtoms(bundle, selected || state.selected)) return;
          var list = byFamily.get(family.id) || [];
          list.push({ bundle: bundle, family: family });
          byFamily.set(family.id, list);
        });
        return Array.from(byFamily.entries()).flatMap(function (entry) {
          var active = entry[1].filter(function (item) {
            return item.family.policy === "replace" || item.family.policy === "warn";
          });
          if (active.length <= 1) return [];
          return [{
            familyID: entry[0],
            familyLabel: active[0].family.label,
            policy: active.some(function (item) { return item.family.policy === "replace"; }) ? "replace" : "warn",
            bundleIDs: active.map(function (item) { return item.bundle.id; }).sort()
          }];
        });
      }

      function familyBundlesForAtom(atomID) {
        return (DATA.bundles || []).filter(function (bundle) {
          return (bundle.atoms || []).includes(atomID) && bundleFamily(bundle);
        });
      }

      function customizedFamilyMembers() {
        var current = preset();
        if (current && current.product === "hybrid-mix") return [];
        return (DATA.bundles || []).flatMap(function (bundle) {
          var family = bundleFamily(bundle);
          if (!family) return [];
          var info = bundleState(bundle);
          if (info.status !== "customized" && info.status !== "partial") return [];
          return [{
            familyID: family.id,
            familyLabel: family.label,
            bundleID: bundle.id,
            selectedAtomIDs: info.selectedAtoms,
            missingAtomIDs: info.missingAtoms
          }];
        });
      }

      function staleFamilyAtomDiagnostics() {
        return familyConflicts().flatMap(function (conflict) {
          var staleAtomIDs = unique(conflict.bundleIDs.flatMap(function (bundleID) {
            var bundle = bundleByID.get(bundleID);
            return bundle ? (bundle.atoms || []).filter(function (atomID) { return state.selected.has(atomID); }) : [];
          })).sort();
          return staleAtomIDs.length > 0 ? [{
            familyID: conflict.familyID,
            familyLabel: conflict.familyLabel,
            bundleIDs: conflict.bundleIDs,
            atomIDs: staleAtomIDs
          }] : [];
        });
      }

      function danglingFamilyBindings() {
        return Array.from(state.bindings.entries()).flatMap(function (entry) {
          var portID = entry[0];
          var providerID = entry[1];
          if (state.selected.has(providerID)) return [];
          var families = familyBundlesForAtom(providerID);
          if (families.length === 0) return [];
          var family = bundleFamily(families[0]);
          return family ? [{
            portID: portID,
            providerID: providerID,
            familyID: family.id,
            familyLabel: family.label,
            bundleIDs: families.map(function (bundle) { return bundle.id; }).sort()
          }] : [];
        });
      }

      function otherBundleAtomsExcluding(bundleIDs) {
        var excluded = new Set(bundleIDs || []);
        var atoms = new Set();
        Array.from(state.selectedBundles).concat(Array.from(state.inferredBundles)).forEach(function (selectedBundleID) {
          if (excluded.has(selectedBundleID)) return;
          var other = bundleByID.get(selectedBundleID);
          if (other) selectedAtomIDsForBundle(other).forEach(function (atomID) { atoms.add(atomID); });
        });
        return atoms;
      }

      function bindingChangesForFamilyReplacement(bundle, oldBundles, afterSelected) {
        var familyPorts = unique((bundle.exclusiveFamilyPorts || bundle.ports || []).concat(oldBundles.flatMap(function (oldBundle) {
          return oldBundle.exclusiveFamilyPorts || oldBundle.ports || [];
        })));
        var bindingChanges = [];
        var unresolvedPortIDs = [];
        familyPorts.forEach(function (portID) {
          var providers = (bundle.atoms || []).filter(function (atomID) {
            var atom = atomByID.get(atomID);
            return atom && atom.provides.includes(portID) && afterSelected.has(atomID);
          }).sort();
          var before = state.bindings.get(portID) || "";
          if (before && !afterSelected.has(before)) {
            if (providers.length === 1) bindingChanges.push({ portID: portID, before: before, after: providers[0], kind: providers[0] === before ? "keep" : "update" });
            else if (providers.length === 0) bindingChanges.push({ portID: portID, before: before, after: "", kind: "remove" });
            else unresolvedPortIDs.push(portID);
          } else if (!before && providers.length === 1) {
            bindingChanges.push({ portID: portID, before: "", after: providers[0], kind: "set" });
          } else if (before && providers.length === 1 && providers[0] !== before && bundle.ports.includes(portID)) {
            bindingChanges.push({ portID: portID, before: before, after: providers[0], kind: "update" });
          }
        });
        return { bindingChanges: bindingChanges.filter(function (change) { return change.kind !== "keep"; }), unresolvedPortIDs: unresolvedPortIDs };
      }

      function applyBindingChanges(bindings, changes) {
        var next = new Map(bindings);
        (changes || []).forEach(function (change) {
          if (!change.after) next.delete(change.portID);
          else next.set(change.portID, change.after);
        });
        return next;
      }

      function previewBundleFamilyReplacement(bundleID) {
        var bundle = bundleByID.get(bundleID);
        var family = bundleFamily(bundle);
        if (!bundle || !family || family.policy !== "replace") return null;
        var oldBundleIDs = activeFamilyBundleIDs(family.id, state.selected, { policy: "replace" }).filter(function (id) { return id !== bundleID; });
        if (oldBundleIDs.length === 0) return null;
        var oldBundles = oldBundleIDs.map(function (id) { return bundleByID.get(id); }).filter(Boolean);
        var oldBundleAtomIDs = new Set(oldBundles.flatMap(function (oldBundle) { return selectedAtomIDsForBundle(oldBundle); }));
        var newBundleAtomIDs = new Set((bundle.atoms || []).filter(function (atomID) { return atomByID.has(atomID); }));
        var otherBundleAtoms = otherBundleAtomsExcluding(oldBundleIDs.concat([bundleID]));
        var afterSelected = new Set(state.selected);
        var removedAtomIDs = Array.from(oldBundleAtomIDs).filter(function (atomID) {
          return state.selected.has(atomID) && !newBundleAtomIDs.has(atomID) && !otherBundleAtoms.has(atomID);
        }).sort();
        removedAtomIDs.forEach(function (atomID) { afterSelected.delete(atomID); });
        newBundleAtomIDs.forEach(function (atomID) { afterSelected.add(atomID); });
        var newAtomIDs = Array.from(newBundleAtomIDs).filter(function (atomID) { return !state.selected.has(atomID); }).sort();
        var sharedAtomIDs = Array.from(newBundleAtomIDs).filter(function (atomID) { return state.selected.has(atomID) || oldBundleAtomIDs.has(atomID) || otherBundleAtoms.has(atomID); }).sort();
        var bindingPlan = bindingChangesForFamilyReplacement(bundle, oldBundles, afterSelected);
        var afterBindings = applyBindingChanges(state.bindings, bindingPlan.bindingChanges);
        var cov = coverage();
        var affectedPorts = unique(family.ports.concat(oldBundles.flatMap(function (oldBundle) { return oldBundle.ports || []; })).concat(bundle.ports || []));
        var breakPortIDs = affectedPorts.filter(function (portID) {
          return cov.required.includes(portID) && providersForSelectedPort(portID, afterSelected, afterBindings).length === 0;
        }).sort();
        var conflictPortIDs = affectedPorts.filter(function (portID) {
          var port = portByID.get(portID);
          var providers = providersForSelectedPort(portID, afterSelected, afterBindings);
          return Boolean(port && port.multiplicity === "single" && providers.length > 1 && !afterBindings.has(portID));
        }).sort();
        var danglingBindingPortIDs = Array.from(afterBindings.entries()).filter(function (entry) {
          return !afterSelected.has(entry[1]);
        }).map(function (entry) { return entry[0]; }).sort();
        var targetSlots = unique(slotsForBundle(bundle).concat(oldBundles.flatMap(slotsForBundle)).map(function (slot) { return slot.id; }))
          .map(function (slotID) { return slotByID.get(slotID); })
          .filter(Boolean);
        var blockingPortIDs = unique(breakPortIDs.concat(conflictPortIDs).concat(bindingPlan.unresolvedPortIDs).concat(danglingBindingPortIDs));
        return {
          action: "replace-family",
          bundle: bundle,
          familyID: family.id,
          familyLabel: family.label,
          oldBundles: oldBundles,
          oldBundleIDs: oldBundleIDs,
          targetSlots: targetSlots,
          targetSlotIDs: targetSlots.map(function (slot) { return slot.id; }),
          newAtomIDs: unique(newAtomIDs),
          removedAtomIDs: unique(removedAtomIDs),
          removableAtomIDs: unique(removedAtomIDs),
          sharedAtomIDs: unique(sharedAtomIDs),
          bindingChanges: bindingPlan.bindingChanges,
          bindingPortIDs: unique(bindingPlan.bindingChanges.map(function (change) { return change.portID; })),
          conflictPortIDs: unique(conflictPortIDs),
          replacementPortIDs: unique(bindingPlan.bindingChanges.filter(function (change) { return change.kind === "update"; }).map(function (change) { return change.portID; })),
          unresolvedPortIDs: unique(bindingPlan.unresolvedPortIDs),
          danglingBindingPortIDs: unique(danglingBindingPortIDs),
          breakPortIDs: unique(breakPortIDs),
          severity: blockingPortIDs.length > 0 ? "blocked" : "warning"
        };
      }

      function bundlePreview() {
        if (!state.previewBundle) return null;
        return state.previewAction === "remove" ? previewBundleRemoval(state.previewBundle) : previewBundleInstall(state.previewBundle);
      }

      function bindingPreview() {
        var pending = state.pendingBinding;
        if (!pending || !pending.portID || !pending.providerID) return null;
        var port = portByID.get(pending.portID);
        var provider = atomByID.get(pending.providerID);
        if (!port || !provider) return null;
        var slot = slotByID.get(pending.slotID) || slotForPort(pending.portID);
        return Object.assign({}, swapImpact(pending.portID, pending.providerID), {
          slotID: slot ? slot.id : "",
          slotLabel: slot ? slot.label : "",
          providerID: pending.providerID
        });
      }

      function previewBundleInstall(bundleID) {
        var bundle = bundleByID.get(bundleID);
        if (!bundle) return null;
        var replacementPreview = previewBundleFamilyReplacement(bundleID);
        if (replacementPreview) return replacementPreview;
        var afterSelected = new Set(state.selected);
        bundle.atoms.forEach(function (atomID) {
          if (atomByID.has(atomID)) afterSelected.add(atomID);
        });
        var targetSlots = slotsForBundle(bundle);
        var newAtomIDs = bundle.atoms.filter(function (atomID) { return atomByID.has(atomID) && !state.selected.has(atomID); }).sort();
        var sharedAtomIDs = bundle.atoms.filter(function (atomID) { return atomByID.has(atomID) && state.selected.has(atomID); }).sort();
        var bindingPortIDs = [];
        var conflictPortIDs = [];
        var replacementPortIDs = [];
        (bundle.ports || []).forEach(function (portID) {
          var port = portByID.get(portID);
          var bundleProviders = bundle.atoms.filter(function (atomID) {
            var atom = atomByID.get(atomID);
            return atom && atom.provides.includes(portID);
          });
          var providers = providersForSelectedPort(portID, afterSelected, state.bindings);
          if (bundleProviders.length === 1 && !state.bindings.has(portID)) bindingPortIDs.push(portID);
          if (port && port.multiplicity === "single" && providers.length > 1 && !state.bindings.has(portID)) conflictPortIDs.push(portID);
          if (state.bindings.has(portID) && bundleProviders.some(function (providerID) { return providerID !== state.bindings.get(portID); })) replacementPortIDs.push(portID);
        });
        var severity = conflictPortIDs.length > 0 ? "blocked" : replacementPortIDs.length > 0 ? "warning" : "ok";
        return {
          action: "install",
          bundle: bundle,
          targetSlots: targetSlots,
          targetSlotIDs: targetSlots.map(function (slot) { return slot.id; }),
          newAtomIDs: unique(newAtomIDs),
          sharedAtomIDs: unique(sharedAtomIDs),
          bindingPortIDs: unique(bindingPortIDs),
          conflictPortIDs: unique(conflictPortIDs),
          replacementPortIDs: unique(replacementPortIDs),
          breakPortIDs: [],
          severity: severity
        };
      }

      function previewBundleRemoval(bundleID) {
        var bundle = bundleByID.get(bundleID);
        if (!bundle) return null;
        var otherBundleAtoms = new Set();
        Array.from(state.selectedBundles).forEach(function (selectedBundleID) {
          if (selectedBundleID === bundleID) return;
          var other = bundleByID.get(selectedBundleID);
          if (other) selectedAtomIDsForBundle(other).forEach(function (atomID) { otherBundleAtoms.add(atomID); });
        });
        var selectedBundleAtomIDs = selectedAtomIDsForBundle(bundle);
        var removableAtomIDs = selectedBundleAtomIDs.filter(function (atomID) { return state.selected.has(atomID) && !otherBundleAtoms.has(atomID); }).sort();
        var sharedAtomIDs = selectedBundleAtomIDs.filter(function (atomID) { return state.selected.has(atomID) && otherBundleAtoms.has(atomID); }).sort();
        var afterSelected = new Set(state.selected);
        removableAtomIDs.forEach(function (atomID) { afterSelected.delete(atomID); });
        var cov = coverage();
        var breakPortIDs = unique((bundle.ports || []).filter(function (portID) {
          return cov.required.includes(portID) && (cov.providers.get(portID) || []).length > 0 && providersForSelectedPort(portID, afterSelected, state.bindings).length === 0;
        }));
        var targetSlots = slotsForBundle(bundle);
        return {
          action: "remove",
          bundle: bundle,
          targetSlots: targetSlots,
          targetSlotIDs: targetSlots.map(function (slot) { return slot.id; }),
          newAtomIDs: [],
          sharedAtomIDs: unique(sharedAtomIDs),
          removableAtomIDs: unique(removableAtomIDs),
          bindingPortIDs: [],
          conflictPortIDs: [],
          replacementPortIDs: [],
          breakPortIDs: breakPortIDs,
          severity: breakPortIDs.length > 0 ? "blocked" : "warning"
        };
      }

      function previewStateForSlot(slot, preview) {
        if (!preview || !preview.targetSlotIDs.includes(slot.id)) return "";
        if (preview.breakPortIDs.some(function (portID) { return slot.portIDs.includes(portID); })) return "conflict";
        if (preview.conflictPortIDs.some(function (portID) { return slot.portIDs.includes(portID); })) return "conflict";
        if (preview.action === "replace-family") return "replace";
        if (preview.replacementPortIDs.some(function (portID) { return slot.portIDs.includes(portID); })) return "replace";
        if (preview.action === "remove") return "remove";
        if (preview.bindingPortIDs.some(function (portID) { return slot.portIDs.includes(portID); })) return "covered";
        return "target";
      }

      function setBundlePreview(bundleID, action, pinned) {
        var bundle = bundleByID.get(bundleID);
        if (!bundle) return;
        var nextAction = action || bundlePreviewAction(bundle);
        state.pendingBinding = null;
        state.previewBundle = bundleID;
        state.previewAction = nextAction;
        state.previewPinned = Boolean(pinned);
        state.activeBundle = bundleID;
        state.activeAtom = "";
        state.activeDetailKind = "bundle";
        if (pinned) state.inspectorTab = "preview";
        if (pinned) {
          var pinnedPreview = bundlePreview();
          if (pinnedPreview) pinnedPreview.targetSlots.forEach(function (slot) { state.collapsedStages.delete(slotAssemblyStage(slot)); });
        }
        renderBoard();
        renderRight();
      }

      function clearBundlePreview(renderAll) {
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.pendingBinding = null;
        if (state.inspectorTab === "preview") state.inspectorTab = "blueprint";
        if (renderAll) render();
        else {
          renderBoard();
          renderRight();
        }
      }

      function selectSlot(slotID) {
        var slot = slotByID.get(slotID);
        if (!slot) return;
        focusSlot(slot, coverage());
        render();
      }

      function selectPort(portID) {
        if (!portByID.has(portID)) return;
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.pendingBinding = null;
        state.inspectorTab = "blueprint";
        state.activePort = portID;
        var selectedPortSlot = slotForPort(portID);
        state.activeSlot = selectedPortSlot ? selectedPortSlot.id : "";
        state.activeAtom = "";
        state.activeBundle = "";
        state.activeDetailKind = "port";
        render();
      }

      function focusSlot(slot, cov) {
        if (!slot) return;
        var info = slotState(slot, cov || coverage());
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.pendingBinding = null;
        state.activeSlot = slot.id;
        state.activePort = slot.primaryPortID;
        state.activeAtom = "";
        state.activeBundle = info.installedBundleIDs[0] || "";
        state.activeDetailKind = "slot";
        var assemblyStage = slotAssemblyStage(slot);
        state.collapsedStages.delete(assemblyStage);
        state.libraryMode = "bundle";
        state.query = "";
        state.plane = "all";
        state.scope = "all";
        state.view = "all";
        state.guideActive = true;
        state.guideStage = assemblyStage;
        state.inspectorTab = "blueprint";
        state.pendingScrollSlot = slot.id;
      }

      function focusStage(stageID) {
        var stage = guideStages().find(function (item) { return item.id === stageID; }) || guideStages()[0];
        if (!stage) return;
        var cov = coverage();
        var stageSlots = requiredSlots().filter(function (slot) { return slotAssemblyStage(slot) === stage.id; });
        var targetSlot = stageSlots.find(function (slot) { return slotNeedsAssembly(slot, cov); }) || stageSlots[0] || slotForPort(stage.ports[0] || "");
        if (targetSlot) {
          focusSlot(targetSlot, cov);
          return;
        }
        state.guideActive = true;
        state.guideStage = stage.id;
        state.collapsedStages.delete(stage.id);
        state.activePort = stage.ports[0] || "";
        var slot = state.activePort ? slotForPort(state.activePort) : null;
        state.activeSlot = slot ? slot.id : "";
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.activeAtom = "";
        state.query = "";
        state.view = "all";
        state.inspectorTab = "blueprint";
      }

      function nextAssemblySlot(fromSlotID, direction, cov) {
        var currentCoverage = cov || coverage();
        var slots = requiredSlots();
        var gapSlots = slots.filter(function (slot) { return slotNeedsAssembly(slot, currentCoverage); });
        if (gapSlots.length === 0) return null;
        var activeIndex = slots.findIndex(function (slot) { return slot.id === fromSlotID; });
        if (activeIndex < 0) return direction < 0 ? gapSlots[gapSlots.length - 1] : gapSlots[0];
        var indexedGaps = gapSlots.map(function (slot) {
          return { slot: slot, index: slots.findIndex(function (item) { return item.id === slot.id; }) };
        });
        var next = direction < 0
          ? indexedGaps.filter(function (item) { return item.index < activeIndex; }).pop()
          : indexedGaps.find(function (item) { return item.index > activeIndex; });
        if (next) return next.slot;
        return direction < 0 ? gapSlots[gapSlots.length - 1] : gapSlots[0];
      }

      function moveGuide(delta) {
        var cov = coverage();
        var nextSlot = nextAssemblySlot(state.activeSlot, delta, cov);
        if (!nextSlot) {
          state.guideActive = false;
          state.guideStage = "";
          state.activePort = "";
          state.activeSlot = "";
          state.pendingScrollSlot = "";
          render();
          return;
        }
        focusSlot(nextSlot, cov);
        render();
      }

      function scrollFocusedSlotIntoView() {
        var slotID = state.pendingScrollSlot;
        if (!slotID || !window.requestAnimationFrame) return;
        state.pendingScrollSlot = "";
        window.requestAnimationFrame(function () {
          var element = document.querySelector('[data-builder-slot="' + slotID.replace(/"/g, '\\"') + '"]');
          if (element && element.scrollIntoView) element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        });
      }

      function recommendedProviderFor(portID, target) {
        if (portID === "product.shell") return primaryWizardShell(target);
        var port = portByID.get(portID);
        if (!port) return "";
        var preferred = port.selectedByProduct[target.product];
        if (preferred && atomByID.has(preferred)) return preferred;
        var prefix = productPrefix(target.product);
        return port.candidates
          .map(function (candidate, index) {
            var atom = atomByID.get(candidate);
            var score = 100 - index;
            if (!atom) score -= 500;
            if (candidate.startsWith("test.") || candidate.includes(".mock")) score -= 220;
            if (atom && atom.scope === "fixture-only") score -= 180;
            if (target.product !== "minimal" && prefix && candidate.startsWith(prefix)) score += 90;
            if (commonCandidate(candidate)) score += target.product === "minimal" ? 100 : 36;
            if (candidate.includes("disabled")) score -= 20;
            return { candidate: candidate, score: score };
          })
          .sort(function (left, right) { return right.score - left.score; })
          .map(function (item) { return item.candidate; })[0] || "";
      }

      function buildWizardPlan() {
        var product = currentWizardProduct();
        var profile = currentWizardProfile();
        var base = product ? presetForProduct(product.product) : DATA.presets[0];
        var required = base ? base.requiredPorts.slice() : [];
        var surfaces = selectedWizardSurfaces(product);
        var surfaceShells = surfaces.map(function (surface) { return product.surfaces[surface]; }).filter(Boolean);
        var primaryShell = product ? primaryWizardShell(product) : "";
        var selected = new Set(surfaceShells);
        var bindings = new Map();
        var missing = [];
        if (primaryShell) bindings.set("product.shell", primaryShell);
        if (wizardProfileAutofills(profile) && product) {
          required.forEach(function (portID) {
            var provider = portID === "product.shell" ? primaryShell : recommendedProviderFor(portID, product);
            if (provider && atomByID.has(provider)) {
              selected.add(provider);
              bindings.set(portID, provider);
            } else {
              missing.push(portID);
            }
          });
        }
        var kitSlotIDs = unique(required.map(function (portID) {
          var slot = slotForPort(portID);
          return slot ? slot.id : "";
        }).filter(Boolean));
        return {
          product: product,
          profile: profile,
          base: base,
          required: required,
          selected: selected,
          selectedBundleIDs: bundleIDsForSelectedAtoms(selected),
          bindings: bindings,
          missing: missing,
          surfaces: surfaces,
          surfaceShells: surfaceShells,
          primaryShell: primaryShell,
          chassisID: "chassis." + (product ? product.id : "custom"),
          kitID: profile && profile.kitID ? profile.kitID : "kit.custom",
          assemblyMode: profile ? profile.id : "custom",
          kitSlotIDs: kitSlotIDs
        };
      }

      function preset() {
        if (state.preset === "custom") {
          var customTargets = customParityTargets();
          var customBindings = Array.from(state.bindings.entries()).map(function (entry) {
            return {
              portID: entry[0],
              providerAtomID: entry[1],
              consumerAtomID: "recipe",
              why: "imported builder binding",
              canSwapWith: [],
              moduleClaim: moduleClaimForBinding(entry[0], entry[1], state.customProduct || "custom", customTargets)
            };
          });
          return {
            id: "custom",
            label: state.customRecipeID || "Custom",
            product: state.customProduct || "custom",
            recipeID: state.customRecipeID || "custom.harness",
	            fingerprint: state.customSourceFingerprint || "custom",
            assemblyClaim: "product-profile-runnable",
            assemblyClaimLabel: "自定义组合 / Custom composition",
            compositionClaim: "custom-composition",
            parityTargets: customTargets,
            parityTargetSatisfied: false,
            parityTargetSummary: customTargets.length > 0 ? "Custom draft keeps upstream targets for inspection, but replacements must re-prove per-port parity." : "Custom draft has no upstream parity target.",
            evidencePolicy: "compatibility-bridge-visible",
            nativeParityVerified: false,
            nativeParitySummary: "Custom draft is port/behavior compatible only; it does not inherit native parity from the source preset.",
	            atoms: Array.from(state.selected).sort(),
	            requiredPorts: state.customRequiredPorts,
	            bundleStates: state.customBundleStates,
	            surfaces: state.customUnknownAtoms.map(function (id) { return { id: id, type: "external", atomID: id }; }),
            bindings: customBindings,
            recipe: null
          };
        }
        return DATA.presets.find(function (item) { return item.id === state.preset; }) || DATA.presets[0];
      }

      function selectedAtoms() {
        return Array.from(state.selected).map(function (id) { return atomByID.get(id); }).filter(Boolean).sort(function (a, b) { return a.id.localeCompare(b.id); });
      }

      function selectedAtomIDs() {
        return Array.from(state.selected).sort();
      }

      function promotePresetToCustomDraft() {
        if (state.preset === "custom") return;
        var current = preset();
        state.preset = "custom";
        state.customRecipeID = current && current.recipeID ? current.recipeID : "custom.harness";
        state.customPresetID = current && current.id ? current.id : "custom";
        state.customProduct = current && current.product ? current.product : "custom";
        state.customSourceFingerprint = current && current.fingerprint ? current.fingerprint : "custom";
        state.customRequiredPorts = current && Array.isArray(current.requiredPorts) ? current.requiredPorts.slice() : [];
        state.customBundleStates = current && Array.isArray(current.bundleStates) ? current.bundleStates.map(function (item) { return Object.assign({}, item); }) : [];
        state.customEntrypoints = current && current.recipe && current.recipe.entrypoints && typeof current.recipe.entrypoints === "object" && !Array.isArray(current.recipe.entrypoints) ? Object.assign({}, current.recipe.entrypoints) : {};
        state.customPersonalities = current && current.recipe && Array.isArray(current.recipe.personalities) && current.recipe.personalities.length > 0 ? current.recipe.personalities.slice() : ["common"];
        state.customAssemblyMode = "";
        state.customKitID = "";
        state.customChassisID = "";
        state.customUnknownAtoms = [];
        state.customUnknownBindings = [];
        state.customSchemaWarnings = [];
        state.familyReplacements = [];
        state.inferredBundles = new Set();
      }

      function bundleExpansionState(bundleID) {
        var current = preset();
        var states = current && Array.isArray(current.bundleStates) ? current.bundleStates : [];
        return states.find(function (item) { return item && item.id === bundleID; }) || null;
      }

      function selectedAtomIDsForBundle(bundle, selected) {
        if (!bundle) return [];
        var currentSelected = selected || state.selected;
        var expansion = bundleExpansionState(bundle.id);
        var expansionSelected = expansion && Array.isArray(expansion.selectedAtoms) ? expansion.selectedAtoms.filter(function (atomID) { return currentSelected.has(atomID); }) : [];
        var expansionAtoms = expansionSelected.length > 0
          ? expansionSelected
          : expansion && Array.isArray(expansion.atoms)
            ? expansion.atoms.filter(function (atomID) { return currentSelected.has(atomID); })
            : [];
        var baseAtoms = expansionAtoms.length > 0 ? expansionAtoms : (bundle.atoms || []).filter(function (atomID) { return currentSelected.has(atomID); });
        var selectedOptional = (bundle.optionalAtomIDs || []).filter(function (atomID) { return currentSelected.has(atomID); });
        return unique(baseAtoms.concat(selectedOptional));
      }

      function selectedPrimaryAtomIDsForBundle(bundle) {
        if (!bundle) return [];
        return unique((bundle.atoms || []).filter(function (atomID) { return state.selected.has(atomID); }));
      }

      function selectedOptionalAtomIDsForBundle(bundle) {
        if (!bundle) return [];
        var primary = new Set(selectedPrimaryAtomIDsForBundle(bundle));
        var explicitOptional = new Set((bundle.optionalAtomIDs || []).filter(function (atomID) { return state.selected.has(atomID); }));
        return selectedAtomIDsForBundle(bundle).filter(function (atomID) {
          return explicitOptional.has(atomID) || !primary.has(atomID);
        });
      }

      function atomProvidesSlot(atomID, slot) {
        var atom = atomByID.get(atomID);
        return Boolean(atom && slot && atom.provides.some(function (portID) { return slot.portIDs.includes(portID); }));
      }

      function atomIDsForSlot(atomIDs, slot) {
        return unique((atomIDs || []).filter(function (atomID) { return atomProvidesSlot(atomID, slot); }));
      }

      function bundleState(bundle) {
        var atoms = (bundle && bundle.atoms) || [];
        var expansion = bundle ? bundleExpansionState(bundle.id) : null;
        var selectedAtoms = selectedAtomIDsForBundle(bundle);
        var selectedPrimary = selectedPrimaryAtomIDsForBundle(bundle);
        var expansionMissingAtoms = expansion && Array.isArray(expansion.missingAtoms) ? expansion.missingAtoms : [];
        var missingAtoms = unique(atoms.filter(function (id) { return !state.selected.has(id); }).concat(expansionMissingAtoms));
        var hasExpansionCustomization = Boolean(expansion && (
          (Array.isArray(expansion.removedAtoms) && expansion.removedAtoms.length > 0) ||
          (Array.isArray(expansion.replacedAtoms) && expansion.replacedAtoms.length > 0) ||
          expansionMissingAtoms.length > 0
        ));
        var tracked = bundle && state.selectedBundles.has(bundle.id);
        var source = bundle && state.inferredBundles.has(bundle.id) ? "inferred" : tracked ? "explicit" : "untracked";
        var status = selectedAtoms.length === 0
          ? tracked && hasExpansionCustomization ? "customized" : "available"
          : missingAtoms.length === 0 && !hasExpansionCustomization ? "selected" : tracked || selectedPrimary.length > 0 || hasExpansionCustomization ? "customized" : "partial";
        return { status: status, selectedAtoms: selectedAtoms, missingAtoms: missingAtoms, tracked: tracked, source: source };
      }

      function bundleActionKind(bundle, info) {
        var stateInfo = info || bundleState(bundle);
        if (stateInfo.status === "partial" || stateInfo.status === "customized") return "complete";
        if (stateInfo.status === "selected" && stateInfo.tracked) return "remove";
        if (previewBundleFamilyReplacement(bundle.id)) return "replace-family";
        var slot = activeSlot();
        if (slot && bundleMatchesSlot(bundle, slot)) {
          var slotInfo = slotState(slot, coverage());
          if (slotInfo.installedBundleIDs.length > 0 || slotInfo.installedAtomIDs.length > 0) return "replace";
        }
        return "install";
      }

      function bundlePreviewAction(bundle, info) {
        return bundleActionKind(bundle, info) === "remove" ? "remove" : "install";
      }

      function bundleActionLabel(bundle, actionKind) {
        if (actionKind === "remove") return t("bundle.remove");
        if (actionKind === "complete") return t("bundle.complete");
        if (actionKind === "replace-family") return t("bundle.replaceFamily");
        if (actionKind === "replace") return t("bundle.replaceFamily");
        return t("bundle.add");
      }

      function bundleActionIcon(actionKind) {
        if (actionKind === "remove") return "−";
        if (actionKind === "complete") return "✓";
        if (actionKind === "replace") return "⇄";
        if (actionKind === "replace-family") return "⇄";
        return "+";
      }

      function bundleSourceLabel(source) {
        return t("bundle.source." + (source || "untracked"));
      }

      function bundlePromotionCandidates(atomID) {
        if (!atomID || !state.selected.has(atomID)) return [];
        var slot = activeSlot();
        return (DATA.bundles || []).filter(function (bundle) {
          return bundle.atoms.length > 0 &&
            bundle.atoms.includes(atomID) &&
            !state.selectedBundles.has(bundle.id) &&
            bundle.atoms.every(function (candidateAtomID) { return state.selected.has(candidateAtomID); });
        }).sort(function (left, right) {
          var leftSlot = slot && bundleMatchesSlot(left, slot) ? 1 : 0;
          var rightSlot = slot && bundleMatchesSlot(right, slot) ? 1 : 0;
          if (rightSlot !== leftSlot) return rightSlot - leftSlot;
          if (right.atoms.length !== left.atoms.length) return right.atoms.length - left.atoms.length;
          return left.id.localeCompare(right.id);
        }).slice(0, 4);
      }

      function bundleMatches(bundle) {
        var query = state.query.trim().toLowerCase();
        var info = bundleState(bundle);
        var slot = activeSlot();
        var guidedPorts = guideStagePorts();
        var manualFilter = hasManualLibraryFilter();
        if (!manualFilter && slot && !bundleMatchesSlot(bundle, slot)) return false;
        if (!manualFilter && !slot && guidedPorts.length > 0 && !bundle.ports.some(function (portID) { return guidedPorts.includes(portID); })) return false;
        if (state.plane !== "all" && bundle.plane !== state.plane) return false;
        if (state.scope === "common" && bundle.productScope !== "common") return false;
        if (state.scope === "product" && bundle.productScope === "common") return false;
        if (state.scope !== "all" && state.scope !== "common" && state.scope !== "product" && bundle.productScope !== state.scope) return false;
        if (state.view === "selected" && info.selectedAtoms.length === 0) return false;
        if (state.view === "replaceable" && !bundle.ports.some(function (portID) { return (portByID.get(portID) || {}).candidates && (portByID.get(portID) || {}).candidates.length > 1; })) return false;
        if (state.view === "missing-provider") {
          var missingPorts = coverage().missing;
          if (!bundle.ports.some(function (portID) { return missingPorts.includes(portID); })) return false;
        }
        if (!query) return true;
        return [bundle.id, bundle.label, bundle.description, bundle.plane, bundle.kind, bundle.productScope, bundle.sourcePackage, bundle.sourceEvidence]
          .concat(bundle.ports, bundle.atoms, bundle.optionalAtomIDs || [])
          .join(" ")
          .toLowerCase()
          .includes(query);
      }

      function portMatches(port) {
        var query = state.query.trim().toLowerCase();
        var slot = activeSlot();
        if (!hasManualLibraryFilter() && slot && !slot.portIDs.includes(port.id)) return false;
        if (state.plane !== "all" && port.plane !== state.plane) return false;
        if (state.view === "selected" && !(coverage().providers.get(port.id) || []).length) return false;
        if (state.view === "replaceable" && port.candidates.length <= 1) return false;
        if (state.view === "missing-provider" && !coverage().missing.includes(port.id)) return false;
        if (!query) return true;
        return [port.id, port.plane, port.multiplicity, port.safety].concat(port.candidates, port.bundleCandidates || []).join(" ").toLowerCase().includes(query);
      }

      function atomMatches(atom) {
        var query = state.query.trim().toLowerCase();
        var guidedPorts = guideStagePorts();
        var slot = activeSlot();
        var hasManualFilter = query || state.plane !== "all" || state.scope !== "all" || state.view !== "all";
        if (!hasManualFilter && slot && !atom.provides.some(function (port) { return slot.portIDs.includes(port); })) return false;
        if (!hasManualFilter && guidedPorts.length > 0 && !atom.provides.some(function (port) { return guidedPorts.includes(port); })) return false;
        if (state.plane !== "all" && atom.plane !== state.plane) return false;
        if (state.scope !== "all" && atom.scope !== state.scope) return false;
        if (state.view === "selected" && !state.selected.has(atom.id)) return false;
        if (state.view === "replaceable" && atom.replaceablePorts.length === 0) return false;
        if (state.view === "missing-provider") {
          var missingPorts = coverage().missing;
          if (!atom.provides.some(function (port) { return missingPorts.includes(port); })) return false;
        }
        if (!query) return true;
        return [atom.id, atom.plane, atom.kind, atom.scope, atom.sourcePackage, atom.implementationKind, atom.implementationLevel, atom.implementationLabel, atom.implementationSummary, atom.upstreamVersion, atom.upstreamCommit, atom.parityCoverage, atom.moduleConfirmationStatus, atom.moduleConfirmationSummary].concat(atom.provides, atom.consumes, atom.nativeEvidenceRefs || [], atom.fixtureIDs || [], atom.knownLossiness || [], atom.moduleConfirmationSourceFiles || [], atom.moduleConfirmationSourceOwners || [], atom.moduleConfirmationFixtureTargets || []).join(" ").toLowerCase().includes(query);
      }

      function compileRequiresExecutableProvider(portID) {
        var rule = (DATA.executablePortRules || []).find(function (item) { return item.portID === portID; });
        if (rule) return Boolean(rule.executableRequired);
        if (portID === "product.shell" || portID === "provider.stream") return true;
        if (portID === "resource.discovery" || portID.indexOf("prompt.") === 0) return true;
        if (portID.indexOf("turn.") === 0 || portID.indexOf("agent-loop.") === 0) return true;
        if (portID === "runtime.capability-resolver" || portID === "runtime.binding-planner" || portID === "runtime.lifecycle-runner" || portID === "runtime.assembly-graph" || portID === "runtime.acceptance-controller" || portID === "runtime.acceptance-evidence") return true;
        if (portID === "tool.executor" || portID.indexOf("tools.") === 0 || portID.indexOf("tool.") === 0) return true;
        if (portID === "session.message-store" || portID === "session.event-log" || portID === "session.id-generator" || portID === "session.projector" || portID === "session.context-selector") return true;
        if (portID === "hook.bus" || portID === "hook.registry" || portID === "ui.event-loop" || portID === "ui.command-router") return true;
        return false;
      }

      function compileProviderAtom(providers, portID) {
        var providerIDs = providers.get(portID) || [];
        if (providerIDs.length !== 1) return null;
        return atomByID.get(providerIDs[0]) || null;
      }

      function promptIdentitySourceText(atom) {
        if (!atom) return "";
        return [atom.id, atom.kind, atom.scope, atom.productScope, atom.sourcePackage, atom.selectionReason].join(" ");
      }

      function promptIdentityHasPlaceholder(atom) {
        return /(?:compatible Helix|Helix-compatible|You are .*Helix|Helix runtime)/i.test(promptIdentitySourceText(atom));
      }

      function promptIdentityNeedsOriginalSnapshot(atom) {
        if (!atom) return false;
        if (atom.scope !== "product" && atom.productScope === "common") return false;
        if (implementationLevel(atom) === "native" || implementationLevel(atom) === "native-like") return false;
        if (promptIdentityIsPartiallySynced(atom)) return false;
        return implementationLevel(atom) === "compatible-bridge" || implementationLevel(atom) === "preview-shell" || implementationLevel(atom) === "metadata-only";
      }

      function promptIdentityIsPartiallySynced(atom) {
        if (!atom || implementationLevel(atom) !== "compatible-bridge") return false;
        if (atom.id.indexOf("opencode.prompt.") === 0) return true;
        return String(atom.selectionReason || "").toLowerCase().indexOf("product identity snapshot") >= 0 &&
          String(atom.selectionReason || "").toLowerCase().indexOf("partial sync") >= 0;
      }

      function compileContractDiagnostics(providers, required) {
        var diagnostics = [];
        required.forEach(function (portID) {
          var atom = compileProviderAtom(providers, portID);
          if (!atom) return;
          var level = implementationLevel(atom);
          if (compileRequiresExecutableProvider(portID) && level === "metadata-only") {
            diagnostics.push({
              id: "builder.compile.metadata-only-provider",
              severity: "error",
              refs: [portID, atom.id],
              message: tx("diagnostic.metadataOnly.message", { port: portID, atom: atom.id }),
              fix: t("diagnostic.metadataOnly.fix")
            });
          }
          if (portID === "product.shell" && level === "preview-shell") {
            diagnostics.push({
              id: "builder.compile.primary-preview-shell",
              severity: "error",
              refs: [portID, atom.id],
              message: tx("diagnostic.previewShell.message", { port: portID, atom: atom.id }),
              fix: t("diagnostic.previewShell.fix")
            });
          }
          if (portID === "prompt.system-builder") {
            if (promptIdentityHasPlaceholder(atom)) {
              diagnostics.push({
                id: "builder.compile.prompt-identity-placeholder",
                severity: "error",
                refs: [portID, atom.id],
                message: tx("diagnostic.promptPlaceholder.message", { atom: atom.id }),
                fix: t("diagnostic.promptPlaceholder.fix")
              });
            } else if (promptIdentityNeedsOriginalSnapshot(atom)) {
              diagnostics.push({
                id: "builder.compile.prompt-identity-unverified",
                severity: "error",
                refs: [portID, atom.id],
                message: tx("diagnostic.promptUnverified.message", { atom: atom.id }),
                fix: t("diagnostic.promptUnverified.fix")
              });
            } else if (promptIdentityIsPartiallySynced(atom)) {
              diagnostics.push({
                id: "builder.compile.prompt-identity-partial",
                severity: "warning",
                refs: [portID, atom.id],
                message: tx("diagnostic.promptPartial.message", { atom: atom.id }),
                fix: t("diagnostic.promptPartial.fix")
              });
            }
          }
        });
        return diagnostics;
      }

      function coverage() {
        var current = preset();
        var atoms = selectedAtoms();
        var candidateProviders = new Map();
        atoms.forEach(function (atom) {
          atom.provides.forEach(function (port) {
            var list = candidateProviders.get(port) || [];
            list.push(atom.id);
            candidateProviders.set(port, list);
          });
        });
        var providers = new Map();
        var bindingWarnings = [];
        DATA.ports.forEach(function (port) {
          var candidates = candidateProviders.get(port.id) || [];
          var bound = state.bindings.get(port.id);
          if (bound && candidates.includes(bound)) providers.set(port.id, [bound]);
          else if (bound && candidates.length > 0) {
            providers.set(port.id, candidates);
            bindingWarnings.push(tx("diagnostic.bindingMissing", { port: port.id, provider: bound }));
          } else providers.set(port.id, candidates);
        });
        var required = current ? current.requiredPorts : [];
        var covered = required.filter(function (port) { return (providers.get(port) || []).length > 0; });
        var missing = required.filter(function (port) { return (providers.get(port) || []).length === 0; });
        var duplicate = DATA.ports.filter(function (port) { return required.includes(port.id) && port.multiplicity === "single" && (providers.get(port.id) || []).length > 1 && !state.bindings.has(port.id); });
        var productScopes = Array.from(new Set(atoms.filter(function (atom) { return atom.scope === "product"; }).flatMap(function (atom) { return atom.selectedIn; }))).sort();
        var warnings = [];
        var diagnostics = [];
        if (missing.length > 0) {
          warnings.push(tx("diagnostic.required.warning", { count: missing.length }));
          diagnostics.push({ id: "builder.required-port.missing", severity: "error", refs: missing, message: t("diagnostic.required.message"), fix: t("diagnostic.required.fix") });
        }
        bindingWarnings.forEach(function (warning) { warnings.push(warning); });
        if (bindingWarnings.length > 0) diagnostics.push({ id: "builder.binding.provider-not-selected", severity: "warning", refs: bindingWarnings, message: t("diagnostic.bindingMissing.message"), fix: t("diagnostic.bindingMissing.fix") });
        danglingFamilyBindings().forEach(function (binding) {
          diagnostics.push({
            id: "builder.exclusive-family.dangling-binding",
            severity: "error",
            refs: [binding.portID, binding.providerID].concat(binding.bundleIDs || []),
            familyID: binding.familyID,
            message: tx("diagnostic.familyDanglingBinding.message", { port: binding.portID, provider: binding.providerID, family: binding.familyLabel }),
            fix: t("diagnostic.familyDanglingBinding.fix")
          });
        });
        if (duplicate.length > 0) {
          var duplicateIDs = duplicate.map(function (port) { return port.id; });
          warnings.push(tx("diagnostic.duplicate.warning", { count: duplicate.length }));
          diagnostics.push({ id: "builder.single-provider.duplicate", severity: "warning", refs: duplicateIDs, message: t("diagnostic.duplicate.message"), fix: t("diagnostic.duplicate.fix") });
        }
        if (productScopes.length > 1 && (!current || current.product !== "hybrid-mix")) {
          warnings.push(tx("diagnostic.mixedProduct.warning", { products: productScopes.join(", ") }));
          diagnostics.push({ id: "builder.product-scope.mixed", severity: "warning", refs: productScopes, message: t("diagnostic.mixedProduct.message"), fix: t("diagnostic.mixedProduct.fix") });
        }
        customizedFamilyMembers().forEach(function (member) {
          diagnostics.push({
            id: "builder.exclusive-family.customized-member",
            severity: "warning",
            refs: [member.bundleID].concat(member.selectedAtomIDs || []),
            familyID: member.familyID,
            message: tx("diagnostic.familyCustomized.message", { family: member.familyLabel, bundle: member.bundleID }),
            fix: t("diagnostic.familyCustomized.fix")
          });
        });
        familyConflicts().forEach(function (conflict) {
          warnings.push(tx("diagnostic.familyConflict.warning", { family: conflict.familyLabel, bundles: conflict.bundleIDs.join(", ") }));
          diagnostics.push({
            id: "builder.exclusive-family.multiple-active",
            severity: "warning",
            refs: conflict.bundleIDs,
            familyID: conflict.familyID,
            message: tx("diagnostic.familyConflict.message", { family: conflict.familyLabel }),
            fix: t("diagnostic.familyConflict.fix")
          });
        });
        staleFamilyAtomDiagnostics().forEach(function (stale) {
          diagnostics.push({
            id: "builder.exclusive-family.stale-atoms",
            severity: "warning",
            refs: stale.atomIDs,
            familyID: stale.familyID,
            message: tx("diagnostic.familyStaleAtoms.message", { family: stale.familyLabel, count: stale.atomIDs.length }),
            fix: t("diagnostic.familyStaleAtoms.fix")
          });
        });
        if (state.customUnknownAtoms.length > 0) diagnostics.push({ id: "builder.import.unknown-atom", severity: "info", refs: state.customUnknownAtoms, message: t("diagnostic.unknownAtom.message"), fix: t("diagnostic.unknownAtom.fix") });
        if (state.customUnknownBindings.length > 0) diagnostics.push({ id: "builder.import.unknown-binding", severity: "warning", refs: state.customUnknownBindings, message: t("diagnostic.unknownBinding.message"), fix: t("diagnostic.unknownBinding.fix") });
        state.customSchemaWarnings.forEach(function (warning) {
          diagnostics.push({ id: "builder.import.schema-warning", severity: "warning", refs: [], message: warning, fix: t("diagnostic.schema.fix") });
        });
        compileContractDiagnostics(providers, required).forEach(function (diagnostic) {
          diagnostics.push(diagnostic);
        });
        if (diagnostics.length === 0) diagnostics.push({ id: "builder.recipe.ready", severity: "info", refs: [], message: t("diagnostic.ready.message"), fix: t("diagnostic.ready.fix") });
        return { providers: providers, candidates: candidateProviders, required: required, covered: covered, missing: missing, duplicate: duplicate, warnings: warnings, diagnostics: diagnostics };
      }

      function validationStatus(cov) {
        var duplicateIDs = cov.duplicate.map(function (port) { return port.id; });
        var errors = cov.diagnostics.filter(function (diagnostic) { return diagnostic.severity === "error"; });
        var warnings = cov.diagnostics.filter(function (diagnostic) { return diagnostic.severity === "warning"; });
        var unknownInfos = cov.diagnostics.filter(function (diagnostic) { return diagnostic.severity === "info" && diagnostic.id !== "builder.recipe.ready"; });
        var firstMissing = cov.missing[0] || "";
        var firstDanglingFamilyBinding = cov.diagnostics.find(function (diagnostic) { return diagnostic.id === "builder.exclusive-family.dangling-binding"; });
        var firstDuplicate = duplicateIDs[0] || "";
        if (firstMissing) {
          return {
            status: "blocked",
            label: t("validation.needsProvider"),
            summary: tx("validation.needsProvider.summary", { count: cov.missing.length }),
            nextPort: firstMissing,
            nextStage: portAssemblyStage(firstMissing),
            action: tx("validation.fixPort", { port: firstMissing })
          };
        }
        if (firstDanglingFamilyBinding) {
          var danglingRefs = firstDanglingFamilyBinding.refs || [];
          var danglingPort = danglingRefs.find(function (ref) { return typeof ref === "string" && portByID.has(ref); }) || "";
          return {
            status: "blocked",
            label: t("validation.needsReview"),
            summary: firstDanglingFamilyBinding.message,
            nextPort: danglingPort,
            nextStage: danglingPort ? portAssemblyStage(danglingPort) : "",
            action: firstDanglingFamilyBinding.fix
          };
        }
        if (firstDuplicate) {
          return {
            status: "blocked",
            label: t("validation.chooseProvider"),
            summary: tx("validation.chooseProvider.summary", { count: duplicateIDs.length }),
            nextPort: firstDuplicate,
            nextStage: portAssemblyStage(firstDuplicate),
            action: t("validation.chooseOne")
          };
        }
        if (errors.length > 0) {
          var errorRefs = errors[0].refs || [];
          var errorPort = errorRefs.find(function (ref) { return typeof ref === "string" && portByID.has(ref); }) || "";
          return {
            status: "blocked",
            label: t("validation.needsReview"),
            summary: errors[0].message,
            nextPort: errorPort,
            nextStage: errorPort ? portAssemblyStage(errorPort) : "",
            action: errors[0].fix || t("validation.reviewWarning")
          };
        }
        if (warnings.length > 0) {
          var refs = warnings[0].refs || [];
          var nextPort = refs.find(function (ref) { return typeof ref === "string" && portByID.has(ref); }) || "";
          return {
            status: "review",
            label: t("validation.needsReview"),
            summary: warnings[0].message,
            nextPort: nextPort,
            nextStage: nextPort ? portAssemblyStage(nextPort) : "",
            action: t("validation.reviewWarning")
          };
        }
        if (unknownInfos.length > 0) {
          return {
            status: "review",
            label: t("validation.importedExtras"),
            summary: unknownInfos[0].message,
            nextPort: "",
            nextStage: "",
            action: t("validation.reviewImport")
          };
        }
        return {
          status: "ready",
          label: t("validation.ready"),
          summary: t("validation.ready.summary"),
          nextPort: "",
          nextStage: "",
          action: t("validation.saveOrExport")
        };
      }

      function currentAssemblySignature() {
        var current = preset();
        return JSON.stringify({
          preset: state.preset,
          recipeID: state.customRecipeID || (current ? current.recipeID : "custom"),
          selected: selectedAtomIDs(),
          bundles: Array.from(state.selectedBundles).sort(),
          inferredBundles: Array.from(state.inferredBundles).sort(),
          bindings: Array.from(state.bindings.entries()).sort(function (left, right) { return left[0].localeCompare(right[0]); }),
          requiredPorts: state.preset === "custom" ? state.customRequiredPorts.slice().sort() : (current ? current.requiredPorts.slice().sort() : []),
          familyReplacements: (state.familyReplacements || []).slice(-20),
          unknownAtoms: state.customUnknownAtoms.slice().sort(),
          unknownBindings: state.customUnknownBindings.slice().sort(),
          schemaWarnings: state.customSchemaWarnings.slice().sort()
        });
      }

      function compileBlockingDiagnostics(cov) {
        var blockingIDs = new Set([
          "builder.binding.provider-not-selected",
          "builder.exclusive-family.multiple-active",
          "builder.exclusive-family.customized-member",
          "builder.exclusive-family.stale-atoms",
          "builder.import.unknown-binding",
          "builder.import.schema-warning",
          "builder.product-scope.mixed",
          "builder.single-provider.duplicate"
        ]);
        return cov.diagnostics.filter(function (diagnostic) {
          if (diagnostic.id === "builder.recipe.ready") return false;
          return diagnostic.severity === "error" || blockingIDs.has(diagnostic.id);
        });
      }

      function compileState() {
        var currentFingerprint = currentAssemblySignature();
        if (state.compileStatus === "passed" && state.compileFingerprint === currentFingerprint) {
          return { status: "passed", message: state.compileMessage || t("compile.ready"), diagnostics: state.compileDiagnostics || [], fingerprint: currentFingerprint };
        }
        if (state.compileStatus === "failed" && state.compileFingerprint === currentFingerprint) {
          return { status: "failed", message: state.compileMessage || t("compile.failed"), diagnostics: state.compileDiagnostics || [], fingerprint: currentFingerprint };
        }
        if (state.compileStatus === "running") {
          return { status: "running", message: state.compileMessage || t("compile.running"), diagnostics: state.compileDiagnostics || [], fingerprint: currentFingerprint };
        }
        if (state.compileStatus === "idle") {
          return { status: "idle", message: t("compile.need"), diagnostics: [], fingerprint: currentFingerprint };
        }
        return { status: "stale", message: t("compile.staleMessage"), diagnostics: [], fingerprint: currentFingerprint };
      }

      function compileStatusLabel(status) {
        if (status === "passed") return t("compile.passed");
        if (status === "failed") return t("compile.failed");
        if (status === "stale") return t("compile.stale");
        if (status === "running") return t("compile.running");
        return t("compile.idle");
      }

      function compileLogText(info) {
        var diagnostics = (info && info.diagnostics) || [];
        if (!diagnostics.length) return info && info.message ? info.message : t("compile.need");
        return [info.message].concat(diagnostics.slice(0, 8).map(function (diagnostic) {
          return diagnostic.id + ": " + diagnostic.message + (diagnostic.fix ? " " + t("diagnostic.fix") + ": " + diagnostic.fix : "");
        })).join("\\n");
      }

      function syncCompileButton() {
        var button = document.getElementById("topCompileButton");
        var info = compileState();
        var app = document.querySelector("[data-harness-builder]");
        if (app) app.dataset.builderProgress = !state.workspaceStarted ? "choose" : info.status === "passed" ? "validate" : "customize";
        if (button) {
          button.textContent = info.status === "passed" ? t("compile.passed") : info.status === "failed" ? t("compile.failed") : t("action.compile");
          button.dataset.builderCompileStatus = info.status;
          button.title = info.message || "";
          button.disabled = state.compileStatus === "running";
        }
      }

      function compileCurrentHarness() {
        syncTuiFields();
        syncActivationFields();
        state.compileStatus = "running";
        state.compileMessage = t("compile.running");
        state.compileDiagnostics = [];
        state.tuiOpen = true;
        state.rightPanelCard = "tui";
        renderRight();
        var fingerprint = currentAssemblySignature();
        var blockers = [];
        if (!state.workspaceStarted) {
          blockers.push({ id: "builder.compile.start-required", severity: "error", refs: [], message: t("compile.startRequired"), fix: t("start.boardBody") });
        } else {
          var cov = coverage();
          blockers = compileBlockingDiagnostics(cov);
          try {
            var recipe = exportRecipe();
            if (!recipe || !recipe.id || !recipe.version || !Array.isArray(recipe.requiredCapabilities) || !Array.isArray(recipe.bindings)) {
              blockers.push({ id: "builder.compile.recipe-shape", severity: "error", refs: [], message: t("diagnostic.schema.fix"), fix: t("diagnostic.schema.fix") });
            }
          } catch (error) {
            blockers.push({ id: "builder.compile.export-error", severity: "error", refs: [], message: error && error.message ? error.message : String(error), fix: t("diagnostic.schema.fix") });
          }
        }
        if (blockers.length) {
          state.compileStatus = "failed";
          state.compileFingerprint = fingerprint;
          state.compileDiagnostics = blockers;
          state.compileMessage = tx("compile.failedSummary", { count: blockers.length });
          state.tuiStatus = "idle";
          state.tuiError = state.compileMessage;
          state.tuiLogs = compileLogText({ message: state.compileMessage, diagnostics: blockers });
          renderRight();
          return;
        }
        state.compileStatus = "passed";
        state.compileFingerprint = fingerprint;
        state.compileDiagnostics = [];
        state.compileMessage = t("compile.ready");
        state.tuiError = "";
        state.tuiMessage = t("compile.ready");
        state.tuiLogs = "";
        runTuiAction("start");
      }

      function recipeFileName() {
        var current = preset();
        var id = state.preset === "custom" && state.customPresetID ? state.customPresetID : current && current.id ? current.id : "custom";
        return "helix-" + id.replace(/[^a-z0-9_.-]+/gi, "-") + "-recipe.json";
      }

      function builderCommands() {
        var file = "./" + recipeFileName();
        var product = (preset() && preset().product) || "custom";
        var taskProducts = product === "custom" || product === "minimal" || product === "hybrid-mix" ? "opencode,pi-mono,nanobot,hermes-agent" : product;
        var runProduct = product === "pi-mono" || product === "nanobot" || product === "hermes-agent" ? product : "opencode";
        return [
          { id: "validate", label: "validate", command: "npm run helix -- validate recipe-file " + shellQuote(file) + " --json" },
          { id: "assemble", label: "assemble", command: "npm run helix -- assemble --recipe-file " + shellQuote(file) + " --explain --json" },
          { id: "graph", label: "graph", command: "npm run helix -- graph recipe-file " + shellQuote(file) + " --json" },
          { id: "run-live", label: "run live", command: "npm run helix -- run " + shellQuote(runProduct) + " --provider openai-compatible --model \\\"$HELIX_LIVE_MODEL\\\" --api-key \\\"$HELIX_LIVE_API_KEY\\\" --prompt 'hello from builder' --json" },
          { id: "task-parity", label: "task parity", command: "npm run helix -- task-parity --suite smoke --provider cassette --product " + shellQuote(taskProducts) + " --json" }
        ];
      }

      function swapImpact(portID, nextProvider) {
        var port = portByID.get(portID);
        var currentProviders = coverage().providers.get(portID) || [];
        var previous = currentProviders[0] || "<missing>";
        var nextAtom = atomByID.get(nextProvider);
        var selectedProduct = (preset() && preset().product) || "custom";
        return {
          portID: portID,
          before: previous,
          after: nextProvider,
          safety: port ? port.safety : "unknown",
          affectedCapabilities: [portID].concat(nextAtom ? nextAtom.consumes : []),
          affectedSurfaces: selectedProduct === "minimal" ? [] : [selectedProduct],
          classification: previous === "<missing>" ? "fixes required port" : nextAtom && nextAtom.scope === "product" ? "changes native parity evidence" : "needs validation",
          validationCommand: "npm run helix -- validate recipe-file " + shellQuote("./" + recipeFileName()) + " --json"
        };
      }

      function surfaceKeyForShell(shellID) {
        if (shellID === "product.shell.minimal-cli") return "cli";
        var suffix = String(shellID).split(".product-shell.")[1] || shellID;
        return suffix.replace(/-([a-z])/g, function (_, letter) { return letter.toUpperCase(); });
      }

      function exportRecipe() {
        var current = preset();
        var cov = coverage();
        var atoms = selectedAtoms();
        var bundleRefs = exportBundleRefs();
        var assemblySlotIDs = requiredSlots().map(function (slot) { return slot.id; });
        var shellAtoms = atoms.filter(isProductShellAtom).map(function (atom) { return { id: atom.id }; });
        var regularAtoms = atoms.filter(function (atom) { return !isProductShellAtom(atom) && atom.scope !== "fixture-only" && atom.scope !== "reserved"; }).map(function (atom) { return { id: atom.id }; });
        var entrypoints = Object.assign({}, state.preset === "custom" ? state.customEntrypoints : (current && current.recipe ? current.recipe.entrypoints : {}));
        shellAtoms.forEach(function (shell) {
          var key = surfaceKeyForShell(shell.id);
          entrypoints[key] = shell.id;
          entrypoints[shell.id] = shell.id;
        });
        var bindings = Array.from(cov.providers.entries()).flatMap(function (entry) {
          var providers = entry[1];
          if (!providers.length) return [];
          return [{
            port: entry[0],
            module: providers[0],
            candidates: providers,
            bindingSource: state.bindings.has(entry[0]) ? "explicit" : "inferred"
          }];
        }).sort(function (a, b) { return a.port.localeCompare(b.port); });
        var assemblyMode = state.customAssemblyMode || (state.preset !== "custom" ? "preset" : "custom");
        var assemblyKitID = state.customKitID || (state.preset !== "custom" && current ? "preset." + current.id : "kit.custom");
        var assemblySource = assemblyMode === "import" || assemblyMode === "import-inferred" ? "import" : state.customKitID ? "wizard" : state.preset !== "custom" ? "preset" : "custom";
        return {
          id: state.customRecipeID || "custom." + (current ? current.id : "harness"),
          version: "0.1.0",
          modules: [],
          atoms: regularAtoms,
          productShells: shellAtoms,
          bundles: bundleRefs,
          bindings: bindings.map(function (binding) { return { port: binding.port, module: binding.module }; }),
          requiredCapabilities: cov.required,
          personalities: state.preset === "custom" ? state.customPersonalities : (current && current.recipe ? current.recipe.personalities : ["common"]),
          entrypoints: entrypoints,
          metadata: {
            generatedBy: "helix-builder",
            basedOn: current ? current.recipeID : "custom",
            product: current ? current.product : "custom",
            sourceFingerprint: current ? current.fingerprint : "custom",
            diagnostics: {
              missingRequiredPorts: cov.missing,
              duplicateProviderPorts: cov.duplicate.map(function (port) { return port.id; }),
              explicitBindings: Array.from(state.bindings.entries()).length,
              selectedAtoms: atoms.length,
              selectedBundles: bundleRefs.length,
              exclusiveFamilyConflicts: familyConflicts().map(function (conflict) { return { familyID: conflict.familyID, bundleIDs: conflict.bundleIDs }; }),
              unknownAtoms: state.customUnknownAtoms,
              unknownBindings: state.customUnknownBindings,
              diagnosticIDs: cov.diagnostics.map(function (diagnostic) { return diagnostic.id; })
            },
            unknownAtoms: state.customUnknownAtoms.map(function (id) { return { id: id, preservation: "metadata-only" }; }),
            unknownBindings: state.customUnknownBindings,
            builderAssembly: {
              chassisID: state.customChassisID || "chassis." + (current ? current.id : "custom"),
              kitID: assemblyKitID,
              mode: assemblyMode,
              source: assemblySource,
              product: current ? current.product : "custom",
              runtimeAbstraction: false,
              exportShape: "bundles-atoms-bindings",
              slotIDs: assemblySlotIDs,
              installedBundleIDs: bundleRefs.map(function (ref) { return ref.id; }),
              inferredBundleIDs: bundleRefs.map(function (ref) { return ref.id; }).filter(function (id) { return state.inferredBundles.has(id); }),
              familyReplacements: (state.familyReplacements || []).slice(-20)
            },
            bundleExpansion: bundleRefs.map(function (ref) {
              var bundle = bundleByID.get(ref.id);
              var atomIDs = bundle ? selectedAtomIDsForBundle(bundle) : [];
              return {
                bundleID: ref.id,
                atomIDs: atomIDs,
                selectedAtomIDs: atomIDs,
                portIDs: bundle ? bundle.ports : [],
                removedAtoms: ref.removedAtoms || [],
                replacedAtoms: ref.replacedAtoms || {}
              };
            }),
            commands: builderCommands().map(function (command) { return command.command; }),
            swapImpact: state.lastSwap
          }
        };
      }

      function exportBundleRefs() {
        var ids = new Set(state.selectedBundles);
        if (ids.size === 0) bundleIDsForSelectedAtomCoverage(state.selected).forEach(function (id) { ids.add(id); });
        return Array.from(ids).sort().map(function (id) {
          var bundle = bundleByID.get(id);
          if (!bundle) return { id: id };
          var removedAtoms = bundle.atoms.filter(function (atomID) { return !state.selected.has(atomID); });
          return Object.assign({ id: id }, removedAtoms.length > 0 ? { removedAtoms: removedAtoms } : {});
        }).filter(function (ref) {
          var bundle = bundleByID.get(ref.id);
          return !bundle || selectedAtomIDsForBundle(bundle).length > 0;
        });
      }

      function bundleIDsForSelectedAtoms(selected) {
        return (DATA.bundles || [])
          .filter(function (bundle) {
            return bundle.atoms.length > 0 && bundle.atoms.every(function (atomID) { return selected.has(atomID); });
          })
          .map(function (bundle) { return bundle.id; })
          .sort();
      }

      function bundleIDsForSelectedAtomCoverage(selected) {
        var uncovered = new Set(Array.from(selected).filter(function (atomID) { return atomByID.has(atomID); }));
        var candidates = (DATA.bundles || []).map(function (bundle) {
          var selectedAtoms = bundle.atoms.filter(function (atomID) { return uncovered.has(atomID); });
          var missingCount = bundle.atoms.length - selectedAtoms.length;
          var scopeBonus = bundle.productScope === state.customProduct ? 80 : bundle.productScope === "common" ? 40 : 0;
          return { bundle: bundle, selectedAtoms: selectedAtoms, score: selectedAtoms.length * 1000 - missingCount * 8 + scopeBonus };
        }).filter(function (item) { return item.selectedAtoms.length > 0; }).sort(function (left, right) {
          if (right.score !== left.score) return right.score - left.score;
          return left.bundle.id.localeCompare(right.bundle.id);
        });
        var ids = [];
        while (uncovered.size > 0) {
          var best = null;
          candidates.forEach(function (candidate) {
            var gain = candidate.bundle.atoms.filter(function (atomID) { return uncovered.has(atomID); }).length;
            if (gain === 0) return;
            var score = gain * 1000 - (candidate.bundle.atoms.length - gain) * 8 + (candidate.bundle.productScope === state.customProduct ? 80 : candidate.bundle.productScope === "common" ? 40 : 0);
            if (!best || score > best.score || (score === best.score && candidate.bundle.id < best.bundle.id)) best = { bundle: candidate.bundle, score: score };
          });
          if (!best) break;
          ids.push(best.bundle.id);
          best.bundle.atoms.forEach(function (atomID) { uncovered.delete(atomID); });
        }
        return ids.sort();
      }

      function renderPresets() {
        var layout = document.getElementById("builderLayout");
        var app = document.querySelector("[data-harness-builder]");
        var sideTitle = document.getElementById("sideTitle");
        var sideBadge = document.getElementById("presetCount");
        var phase = state.workspaceStarted ? "build" : "start";
        var progress = !state.workspaceStarted ? "choose" : compileState().status === "passed" ? "validate" : "customize";
        if (layout) layout.dataset.builderPhase = phase;
        if (app) {
          app.dataset.builderPhase = phase;
          app.dataset.builderProgress = progress;
        }
        if (sideTitle) sideTitle.textContent = state.workspaceStarted ? t("side.library") : t("side.start");
        if (sideBadge) {
          sideBadge.textContent = state.workspaceStarted ? String(DATA.atoms.length) : String(DATA.presets.length);
          sideBadge.dataset.builderSideBadge = state.workspaceStarted ? "atoms" : "presets";
        }
        document.getElementById("presetGrid").innerHTML = DATA.presets.map(function (item) {
          var targetRefs = (item.parityTargets || []).map(function (target) { return target.product + "@" + target.ref; }).join(",");
          var descriptionKey = item.product === "hybrid-mix" || item.id.indexOf("hybrid") >= 0
            ? "preset.description.hybrid"
            : "preset.description." + item.product;
          return '<button type="button" class="preset-button" data-preset="' + h(item.id) + '" data-builder-preset-button="' + h(item.id) + '" data-product="' + h(item.product) + '" data-builder-predefined="' + h(item.product) + '" data-builder-preset-claim="' + h(item.assemblyClaim || "") + '" data-builder-preset-composition-claim="' + h(item.compositionClaim || "") + '" data-builder-preset-parity-target-satisfied="' + String(Boolean(item.parityTargetSatisfied)) + '" data-builder-preset-parity-targets="' + h(targetRefs) + '" data-builder-preset-evidence-policy="' + h(item.evidencePolicy || "") + '" data-builder-preset-native-parity="' + String(Boolean(item.nativeParityVerified)) + '" data-builder-preset-compile-status="' + h(item.compileStatus || "unknown") + '" aria-pressed="' + String(state.workspaceStarted && item.id === state.preset) + '">' +
            '<span class="preset-copy"><strong>' + h(item.label) + '</strong><span class="preset-description">' + h(t(descriptionKey)) + '</span></span>' +
            '<span class="preset-arrow" aria-hidden="true">→</span>' +
          '</button>';
        }).join("");
      }

      function renderFilters() {
        var libraryMode = document.getElementById("libraryModeFilter");
        var plane = document.getElementById("planeFilter");
        var scope = document.getElementById("scopeFilter");
        var view = document.getElementById("viewFilter");
        libraryMode.innerHTML = [
          '<option value="bundle">' + h(t("library.bundle")) + '</option>',
          '<option value="atom">' + h(t("library.atom")) + '</option>',
          '<option value="port">' + h(t("library.port")) + '</option>'
        ].join("");
        plane.innerHTML = ['<option value="all">' + h(t("filter.allPlanes")) + '</option>'].concat(DATA.planes.map(function (item) { return '<option value="' + h(item) + '">' + h(item) + '</option>'; })).join("");
        scope.innerHTML = ['<option value="all">' + h(t("filter.allScopes")) + '</option>'].concat(DATA.scopes.map(function (item) { return '<option value="' + h(item) + '">' + h(item) + '</option>'; })).join("");
        view.innerHTML = [
          '<option value="all">' + h(t("filter.allAtoms")) + '</option>',
          '<option value="selected">' + h(t("filter.selected")) + '</option>',
          '<option value="replaceable">' + h(t("filter.replaceable")) + '</option>',
          '<option value="missing-provider">' + h(t("filter.missingProvider")) + '</option>'
        ].join("");
        libraryMode.value = state.libraryMode;
        plane.value = state.plane;
        scope.value = state.scope;
        view.value = state.view;
      }

      function renderPalette() {
        if (state.libraryMode === "bundle") {
          var bundles = (DATA.bundles || []).filter(bundleMatches).slice(0, 120);
          document.getElementById("palette").innerHTML = bundles.length === 0
            ? '<div class="palette-empty" data-builder-palette-empty="true">' + h(t("filter.empty")) + '</div>'
            : bundles.map(renderBundleCard).join("");
          return;
        }
        if (state.libraryMode === "port") {
          var ports = DATA.ports.filter(portMatches).slice(0, 140);
          document.getElementById("palette").innerHTML = ports.length === 0
            ? '<div class="palette-empty" data-builder-palette-empty="true">' + h(t("filter.empty")) + '</div>'
            : ports.map(renderPortCard).join("");
          return;
        }
        var atoms = DATA.atoms.filter(atomMatches).slice(0, 180);
        document.getElementById("palette").innerHTML = atoms.length === 0
          ? '<div class="palette-empty" data-builder-palette-empty="true">' + h(t("filter.empty")) + '</div>'
          : atoms.map(function (atom) {
          var selected = state.selected.has(atom.id);
          return '<div class="atom-tile" draggable="true" data-drag-atom="' + h(atom.id) + '" data-scope="' + h(atom.scope) + '" data-state-selected="' + String(selected) + '" data-builder-plane="' + h(atom.plane) + '" data-builder-lane="' + h(atomLane(atom)) + '" data-builder-atom="' + h(atom.id) + '" data-atom-id="' + h(atom.id) + '" data-builder-implementation-level="' + h(implementationLevel(atom)) + '" data-builder-module-confirmation="' + h(moduleConfirmationStatus(atom) || "untracked") + '">' +
            '<div><div class="atom-name-row"><div class="atom-name">' + h(atom.id) + '</div>' + renderInfoHelp("atom-" + atom.id, atom.id, atomExplanation(atom)) + '</div><div class="atom-meta">' + h(laneLabel(atomLane(atom)) + " · " + atom.scope + " · " + atom.provides.slice(0, 3).join(", ")) + '</div><div class="atom-chip-row">' + renderImplementationChip(atom) + renderModuleConfirmationChip(atom) + '</div>' + renderNativeEvidenceLine(atom, true) + '</div>' +
            '<button type="button" class="icon-button" draggable="false" title="' + h(selected ? t("action.remove") : t("action.add")) + '" data-' + (selected ? 'remove' : 'add') + '="' + h(atom.id) + '">' + (selected ? '−' : '+') + '</button>' +
          '</div>';
        }).join("");
      }

      function renderBundleCard(bundle) {
        var info = bundleState(bundle);
        var selected = info.status === "selected";
        var partial = info.status === "partial" || info.status === "customized";
        var tracked = info.tracked;
        var statusLabel = info.status === "customized" ? t("bundle.customized") : selected ? t("bundle.selected") : partial ? t("bundle.partial") : t("state.add");
        var targetSlots = slotsForBundle(bundle).slice(0, 3);
        var targetText = targetSlots.length ? targetSlots.map(function (slot) { return slot.label; }).join(", ") : laneLabel(bundleLane(bundle));
        var actionKind = bundleActionKind(bundle, info);
        var actionText = bundleActionLabel(bundle, actionKind);
        var actionAttr = actionKind === "remove"
          ? 'data-remove-bundle="' + h(bundle.id) + '"'
          : actionKind === "complete"
            ? 'data-complete-bundle="' + h(bundle.id) + '"'
            : actionKind === "replace-family"
              ? 'data-replace-family-bundle="' + h(bundle.id) + '"'
              : actionKind === "replace"
              ? 'data-replace-bundle="' + h(bundle.id) + '"'
              : 'data-add-bundle="' + h(bundle.id) + '"';
        var previewActive = state.previewBundle === bundle.id;
        var sourceHelp = bundleSourceHelp(info.source);
        var statusHelp = bundleStatusHelp(info);
        var actionHelp = bundleActionHelp(bundle, actionKind);
        var displayAtomTotal = unique((bundle.atoms || []).concat(bundle.optionalAtomIDs || [])).length || bundle.atoms.length;
        return '<div class="bundle-tile" data-preview-bundle="' + h(bundle.id) + '" data-builder-preview-active="' + String(previewActive) + '" data-builder-bundle="' + h(bundle.id) + '" data-builder-plane="' + h(bundle.plane) + '" data-builder-bundle-state="' + h(info.status) + '" data-builder-bundle-source="' + h(info.source) + '" data-builder-bundle-action="' + h(actionKind) + '" data-builder-bundle-family="' + h(bundle.exclusiveFamilyID || "") + '" data-builder-bundle-family-policy="' + h(bundle.exclusiveFamilyPolicy || "allow-many") + '" data-scope="' + h(bundle.productScope === "common" ? "common" : "product") + '">' +
          '<div class="bundle-main">' +
            '<div class="bundle-name-row"><div class="bundle-name">' + h(bundle.label) + '</div>' + renderInfoHelp("bundle-" + bundle.id, bundle.label, bundleExplanation(bundle)) + '</div>' +
            '<div class="bundle-id">' + h(bundle.id) + '</div>' +
            '<div class="bundle-description">' + h(bundle.description) + '</div>' +
            '<div class="bundle-meta"><span class="chip">' + h(bundle.plane) + '</span><span class="chip">' + h(bundle.productScope) + '</span><span class="chip" data-builder-bundle-source-chip="' + h(info.source) + '" title="' + h(sourceHelp) + '">' + h(bundleSourceLabel(info.source)) + '</span>' + renderInfoHelp("source-" + bundle.id, bundleSourceLabel(info.source), sourceHelp) + '<span class="chip">' + h(tx("bundle.atoms", { count: bundle.atoms.length })) + '</span><span class="chip">' + h(tx("bundle.ports", { count: bundle.ports.length })) + '</span></div>' +
            '<div class="bundle-slot-targets" data-builder-bundle-target-slots="' + h(bundle.id) + '"><span class="chip">' + h(targetText) + '</span></div>' +
          '</div>' +
          '<div class="bundle-actions">' +
            '<button type="button" class="bundle-action-main" title="' + h(actionHelp) + '" aria-label="' + h(actionText + ": " + actionHelp) + '" data-builder-bundle-action-button="' + h(actionKind) + '" data-builder-bundle-action-icon="' + h(actionKind) + '" ' + actionAttr + '><span class="action-icon" aria-hidden="true">' + h(bundleActionIcon(actionKind)) + '</span><span>' + h(actionText) + '</span></button>' +
            '<button type="button" class="icon-button" title="' + h(t("bundle.expand")) + '" data-show-bundle="' + h(bundle.id) + '">…</button>' +
            '<span class="bundle-action-hint">' + renderInfoHelp("action-" + bundle.id, actionText, actionHelp) + '</span>' +
          '</div>' +
          '<div class="bundle-foot"><span class="fine">' + h(statusLabel + " · " + info.selectedAtoms.length + "/" + displayAtomTotal) + '</span>' + (statusHelp ? renderInfoHelp("status-" + bundle.id, statusLabel, statusHelp) : "") + '</div>' +
        '</div>';
      }

      function renderPortCard(port) {
        var providers = coverage().providers.get(port.id) || [];
        return '<button type="button" class="port-row" data-builder-port-candidate="' + h(port.id) + '" data-port-select="' + h(port.id) + '" data-builder-plane="' + h(port.plane) + '">' +
          '<span><strong>' + h(port.id) + '</strong><br><span class="fine">' + h((port.bundleCandidates || []).slice(0, 4).join(", ") || port.candidates.slice(0, 4).join(", ") || t("state.noSelectedProvider")) + '</span></span>' +
          '<span class="chip">' + h(providers.length + "/" + port.candidates.length) + '</span>' +
        '</button>';
      }

      function atomLane(atom) {
        return isProductShellAtom(atom) ? "interface" : atom.plane;
      }

      function isProductShellAtom(atom) {
        return Boolean(atom && (atom.kind === "product-shell" || atom.id.indexOf(".product-shell.") >= 0 || atom.id.indexOf("product.shell.") === 0));
      }

      function implementationLevel(atom) {
        return atom && atom.implementationLevel ? atom.implementationLevel : "common-shared";
      }

      var implementationStateLevels = ["native", "native-like", "profile-compatible", "compatible-bridge", "preview-shell", "metadata-only", "common-shared"];

      function implementationLabel(atom) {
        return atom && atom.implementationLabel ? atom.implementationLabel : implementationLevel(atom);
      }

      function implementationStateLabel(level) {
        var found = (DATA.atoms || []).find(function (atom) { return implementationLevel(atom) === level && atom.implementationLabel; });
        return found ? found.implementationLabel : level;
      }

      function implementationSummary(atom) {
        return atom && atom.implementationSummary ? atom.implementationSummary : "";
      }

      function moduleConfirmationStatus(atom) {
        return atom && atom.moduleConfirmationStatus ? String(atom.moduleConfirmationStatus) : "";
      }

      function moduleConfirmationLabel(status) {
        if (status === "upstream-divergent-exact-diff-missing") return "Upstream divergent";
        if (status === "semantic-fixture-needs-exact-diff") return "Needs exact diff";
        if (status === "demotion-guard-confirmed") return "Demotion guard";
        if (status === "manual-anchor-needed") return "Manual anchor";
        if (status === "no-open-divergence") return "No open divergence";
        return status || "";
      }

      function renderImplementationChip(atom) {
        var level = implementationLevel(atom);
        return '<span class="chip" data-builder-implementation-level="' + h(level) + '" title="' + h(implementationSummary(atom)) + '">' + h(implementationLabel(atom)) + '</span>';
      }

      function renderModuleConfirmationChip(atom) {
        var status = moduleConfirmationStatus(atom);
        if (!status) return "";
        return '<span class="chip" data-builder-module-confirmation="' + h(status) + '" title="' + h(atom.moduleConfirmationSummary || status) + '">' + h(moduleConfirmationLabel(status)) + '</span>';
      }

      function atomNativeEvidenceLabels(atom) {
        if (!atom) return [];
        var evidenceRefs = Array.isArray(atom.nativeEvidenceRefs) ? atom.nativeEvidenceRefs : [];
        var fixtureIDs = Array.isArray(atom.fixtureIDs) ? atom.fixtureIDs : [];
        var lossiness = Array.isArray(atom.knownLossiness) ? atom.knownLossiness : [];
        var labels = ["coverage=" + String(atom.parityCoverage || implementationLevel(atom))];
        if (atom.upstreamCommit) labels.push("upstream=" + String(atom.upstreamCommit).slice(0, 12));
        else if (atom.upstreamVersion) labels.push("upstream=" + String(atom.upstreamVersion));
        if (fixtureIDs.length) labels.push("fixtures=" + String(fixtureIDs.length));
        if (evidenceRefs.length) labels.push("evidence=" + String(evidenceRefs.length));
        if (lossiness.length) labels.push("lossiness=" + lossiness.slice(0, 2).join(","));
        if (moduleConfirmationStatus(atom)) labels.push("module=" + moduleConfirmationStatus(atom));
        return labels;
      }

      function renderNativeEvidenceLine(atom, compact) {
        var labels = atomNativeEvidenceLabels(atom);
        if (!labels.length) return "";
        var lossiness = Array.isArray(atom.knownLossiness) ? atom.knownLossiness.join(",") : "";
        var attrs = ' data-builder-native-evidence="' + h(atom.id) + '"' +
          ' data-builder-parity-coverage="' + h(atom.parityCoverage || implementationLevel(atom)) + '"' +
          ' data-builder-known-lossiness="' + h(lossiness) + '"' +
          ' data-builder-module-confirmation="' + h(moduleConfirmationStatus(atom) || "untracked") + '"' +
          ' data-builder-module-source-files="' + h((atom.moduleConfirmationSourceFiles || []).join(",")) + '"';
        if (compact) return '<div class="atom-meta"' + attrs + '>' + h(labels.join(" · ")) + '</div>';
        return '<div class="flow-diff-meta"' + attrs + '>' + labels.map(function (label) { return '<span class="chip">' + h(label) + '</span>'; }).join("") + '</div>';
      }

      function implementationStateSummary(atoms) {
        return implementationStateLevels.map(function (level) {
          var matching = atoms.filter(function (atom) { return implementationLevel(atom) === level; });
          return {
            level: level,
            label: implementationStateLabel(level),
            count: matching.length,
            evidenceCount: matching.filter(function (atom) {
              return (Array.isArray(atom.nativeEvidenceRefs) && atom.nativeEvidenceRefs.length > 0) || (Array.isArray(atom.fixtureIDs) && atom.fixtureIDs.length > 0);
            }).length,
            lossinessCount: matching.filter(function (atom) {
              return Array.isArray(atom.knownLossiness) && atom.knownLossiness.length > 0;
            }).length,
            examples: matching.slice(0, 3).map(function (atom) { return atom.id; })
          };
        });
      }

      function renderImplementationStateSummary(atoms) {
        return miniList(implementationStateSummary(atoms).map(function (item) {
          return '<li data-builder-bom-implementation-state="' + h(item.level) + '"' +
            ' data-builder-bom-state-count="' + h(String(item.count)) + '"' +
            ' data-builder-bom-state-evidence="' + h(String(item.evidenceCount)) + '"' +
            ' data-builder-bom-state-lossiness="' + h(String(item.lossinessCount)) + '">' +
              '<span>' + h(item.label) + '</span> ' +
              '<span class="chip" data-builder-implementation-level="' + h(item.level) + '">' + h(String(item.count)) + '</span>' +
              '<br><span class="fine">' + h("evidence " + item.evidenceCount + " · lossiness " + item.lossinessCount + (item.examples.length ? " · " + item.examples.join(", ") : "")) + '</span>' +
            '</li>';
        }), t("remove.none"));
      }

      function renderBoard() {
        if (!state.workspaceStarted) {
          var startModeToggle = document.getElementById("assemblyModeToggle");
          var startGuide = document.getElementById("boardGuidePanel");
          var startBoard = document.getElementById("board");
          if (startModeToggle) startModeToggle.innerHTML = "";
          if (startGuide) startGuide.innerHTML = "";
          if (startBoard) {
            startBoard.dataset.builderAssemblyView = "start";
            startBoard.innerHTML = '<section class="start-empty-board" data-builder-start-board="empty">' +
              '<strong>' + h(t("start.boardTitle")) + '</strong>' +
              '<span class="fine">' + h(t("start.boardBody")) + '</span>' +
            '</section>';
          }
          return;
        }
        var cov = coverage();
        var slots = requiredSlots();
        var active = activeSlot();
        var preview = bundlePreview();
        var assemblyView = currentAssemblyView();
        var modeToggle = document.getElementById("assemblyModeToggle");
        if (modeToggle) {
          modeToggle.innerHTML = renderAssemblyViewToggle();
          modeToggle.dataset.builderAssemblyView = assemblyView;
          modeToggle.setAttribute("role", "group");
          modeToggle.setAttribute("aria-label", t("assemblyView.aria"));
        }
        function renderLaneToggle(stageID, label) {
          var collapsed = state.collapsedStages.has(stageID);
          var toggleLabel = collapsed ? tx("stage.expand", { stage: label }) : tx("stage.collapse", { stage: label });
          return '<button type="button" class="lane-toggle" data-lane-toggle-stage="' + h(stageID) + '" data-builder-lane-toggle="' + h(stageID) + '" aria-expanded="' + String(!collapsed) + '" aria-label="' + h(toggleLabel) + '" title="' + h(toggleLabel) + '"></button>';
        }
        var stageMarkup = assemblyStagesForSlots(slots, assemblyView).map(function (stage) {
          var stageSlots = slots.filter(function (slot) { return slotAssemblyStage(slot, assemblyView) === stage.id; });
          if (stageSlots.length === 0) return "";
          var label = stage.label;
          var collapsed = state.collapsedStages.has(stage.id);
          var readyCount = stageSlots.filter(function (slot) {
            var status = slotState(slot, cov).status;
            return status === "installed" || status === "customized";
          }).length;
          return '<section class="lane" data-builder-lane="' + h(stage.id) + '" data-builder-lane-collapsed="' + String(collapsed) + '" data-builder-plane="' + h(stage.id === "interface" ? "product" : stage.id) + '" data-drop-plane="' + h(stage.id) + '" data-builder-assembly-view="' + h(assemblyView) + '" data-builder-assembly-stage="' + h(stage.id) + '">' +
            '<div class="lane-head">' + renderLaneToggle(stage.id, label) + '<span class="lane-title">' + h(label) + renderLaneHelp(stage.id) + '</span><span class="chip">' + h(readyCount + "/" + stageSlots.length) + '</span></div>' +
            '<div class="assembly-slots" data-builder-lane-body="' + h(stage.id) + '"' + (collapsed ? " hidden" : "") + '>' + stageSlots.map(function (slot) { return renderAssemblySlot(slot, cov, active, preview); }).join("") + '</div>' +
          '</section>';
        }).filter(Boolean).join("");
        var board = document.getElementById("board");
        board.dataset.builderAssemblyView = assemblyView;
        board.innerHTML = stageMarkup + renderLooseAssemblyArea(slots, cov);
      }

      function renderAssemblySlot(slot, cov, active, preview) {
        var info = slotState(slot, cov);
        var previewState = previewStateForSlot(slot, preview);
        var interfaceState = info.status === "conflict" || previewState === "conflict" ? "misaligned" : previewState ? "try-fit" : "aligned";
        var installedBundles = info.installedBundleIDs.map(function (bundleID) { return bundleByID.get(bundleID); }).filter(Boolean).slice(0, 4);
        var slotAtomEntries = slotAtomRoleEntries(info);
        var atomsExpanded = state.expandedSlots.has(slot.id);
        var atomToggleLabel = atomsExpanded ? t("slot.collapseAtoms") : tx("slot.expandAtoms", { count: slotAtomEntries.length });
        var atomToggle = slotAtomEntries.length
          ? '<button type="button" class="slot-atom-toggle" data-slot-toggle-atoms="' + h(slot.id) + '" data-builder-slot-atoms-toggle="' + h(slot.id) + '" aria-expanded="' + String(atomsExpanded) + '" aria-label="' + h(atomToggleLabel) + '" title="' + h(atomToggleLabel) + '"></button>'
          : "";
        var previewActionLabel = preview && preview.action === "remove" ? t("preview.remove") : preview && preview.action === "replace-family" ? t("preview.replaceFamily") : t("preview.install");
        var familyPreviewAttrs = preview && preview.action === "replace-family" ? ' data-builder-slot-family-preview="' + h(preview.familyID) + '" data-builder-slot-family-replacement="' + h(preview.bundle.id) + '"' : "";
        var familyConflict = familyConflicts().find(function (conflict) {
          return info.installedBundleIDs.some(function (bundleID) { return conflict.bundleIDs.includes(bundleID); });
        });
        var familyConflictAttrs = familyConflict ? ' data-builder-slot-family-conflict="' + h(familyConflict.familyID) + '"' : "";
        var previewModule = previewState && preview
          ? '<span class="module-chip" data-builder-slot-preview-module="' + h(preview.bundle.id) + '" data-builder-slot-ghost-fit-module="' + h(preview.bundle.id) + '" data-builder-slot-preview-action="' + h(preview.action) + '">' + h(previewActionLabel + ": " + preview.bundle.label) + '</span>'
          : "";
        var moduleList = installedBundles.length
          ? installedBundles.map(function (bundle, index) {
              var source = bundleState(bundle).source;
              return '<span class="module-chip-wrap">' +
                (index === 0 ? atomToggle : "") +
                '<button type="button" class="module-chip" data-show-bundle="' + h(bundle.id) + '" data-builder-slot-bundle-source="' + h(source) + '" title="' + h(bundleExplanation(bundle)) + '">' + h(bundle.label) + '</button>' +
                renderInfoHelp("slot-bundle-" + bundle.id, bundle.label, bundleExplanation(bundle)) +
              '</span>';
            }).join("")
          : '<div class="slot-empty">' + atomToggle + '<span class="fine">' + h(t("slot.noBundle") + " · " + tx("slot.candidates", { count: info.candidateCount })) + '</span></div>';
        var atomList = slotAtomEntries.length
          ? '<div class="slot-atoms" data-builder-slot-atoms="' + h(slot.id) + '" data-builder-slot-atoms-expanded="' + String(atomsExpanded) + '"' + (atomsExpanded ? "" : " hidden") + '>' +
            renderSlotAtomRoleGroup(slot.id, "installed", slotAtomEntries) +
            renderSlotAtomRoleGroup(slot.id, "optional", slotAtomEntries) +
            renderSlotAtomRoleGroup(slot.id, "variant", slotAtomEntries) +
          '</div>'
          : "";
        var warningList = info.warnings.length
          ? '<div class="slot-warning-list" data-builder-slot-warnings="' + h(slot.id) + '">' + info.warnings.slice(0, 3).map(function (warning) {
              return '<span class="slot-warning" data-builder-slot-warning="' + h(warning.id) + '" data-severity="' + h(warning.severity) + '" title="' + h((warning.refs || []).join(", ")) + '">' + h(warning.message) + '</span>';
            }).join("") + '</div>'
          : "";
        return '<section class="assembly-slot" data-builder-slot="' + h(slot.id) + '" data-builder-slot-socket="true" data-builder-slot-ghost-fit="' + h(previewState || "none") + '" data-builder-slot-interface-state="' + h(interfaceState) + '" data-builder-slot-stage="' + h(slot.stage) + '" data-builder-slot-assembly-lane="' + h(slotAssemblyStage(slot)) + '" data-builder-slot-status="' + h(info.status) + '" data-builder-slot-preview="' + h(previewState || "none") + '" data-builder-slot-preview-bundle="' + h(previewState && preview ? preview.bundle.id : "") + '"' + familyPreviewAttrs + familyConflictAttrs + ' data-builder-slot-primary-port="' + h(slot.primaryPortID) + '" data-builder-slot-candidate-count="' + h(info.candidateCount) + '" data-builder-slot-required="' + String(info.required) + '" data-builder-slot-warning-count="' + h(info.warnings.length) + '" aria-current="' + String(Boolean(active && active.id === slot.id)) + '">' +
          '<span class="slot-ghost-fit" data-builder-slot-ghost-fit-rail="' + h(previewState || "none") + '" aria-hidden="true"></span>' +
          '<span class="slot-interface-meter" data-builder-slot-interface-meter="' + h(interfaceState) + '" aria-hidden="true"></span>' +
          '<button type="button" class="slot-select" data-slot-select="' + h(slot.id) + '" aria-pressed="' + String(Boolean(active && active.id === slot.id)) + '" title="' + h(t("slot.select")) + '">' +
            '<span><span class="explainable-title"><span class="slot-label">' + h(slot.label) + '</span>' + renderInfoHelp("slot-" + slot.id, slot.label, slotExplanation(slot)) + '</span><span class="fine">' + h(slot.primaryPortID + " · " + tx("slot.ports", { count: slot.portIDs.length })) + '</span></span>' +
            '<span class="chip" data-builder-slot-status-chip="' + h(info.status) + '">' + h(slotStatusLabel(info.status)) + '</span>' +
          '</button>' +
          '<div class="slot-module-list" data-builder-slot-modules="' + h(slot.id) + '">' + previewModule + moduleList + '</div>' +
          warningList +
          atomList +
        '</section>';
      }

      function slotAtomRoleEntries(info) {
        var entries = [];
        var seen = new Set();
        function add(role, atomIDs) {
          (atomIDs || []).forEach(function (atomID) {
            if (seen.has(atomID)) return;
            var atom = atomByID.get(atomID);
            if (!atom) return;
            seen.add(atomID);
            entries.push({ role: role, atom: atom });
          });
        }
        add("installed", info.installedAtomIDs);
        add("optional", info.optionalAtomIDs);
        add("variant", info.variantAtomIDs);
        return entries;
      }

      function renderSlotAtomRoleGroup(slotID, role, entries) {
        var roleEntries = entries.filter(function (entry) { return entry.role === role; });
        if (roleEntries.length === 0) return "";
        return '<section class="slot-atom-role-group" data-builder-slot-atom-role-group="' + h(role) + '" data-builder-slot-atom-role-count="' + h(roleEntries.length) + '">' +
          '<div class="slot-atom-role-label"><span>' + h(t("slot.atomRole." + role)) + '</span><span class="chip">' + h(roleEntries.length) + '</span></div>' +
          '<div class="slot-atom-role-grid">' + roleEntries.map(function (entry) { return renderBoardAtomTile(entry.atom, slotID, role); }).join("") + '</div>' +
        '</section>';
      }

      function looseAssemblyItems(slots, cov) {
        var currentSlots = slots || requiredSlots();
        var currentCoverage = cov || coverage();
        var assigned = new Set();
        currentSlots.forEach(function (slot) {
          var info = slotState(slot, currentCoverage);
          info.installedAtomIDs.forEach(function (atomID) { assigned.add(atomID); });
          info.optionalAtomIDs.forEach(function (atomID) { assigned.add(atomID); });
          info.variantAtomIDs.forEach(function (atomID) { assigned.add(atomID); });
          info.installedBundleIDs.forEach(function (bundleID) {
            var bundle = bundleByID.get(bundleID);
            if (!bundle) return;
            selectedAtomIDsForBundle(bundle).forEach(function (atomID) {
              if (state.selected.has(atomID)) assigned.add(atomID);
            });
          });
        });
        var known = selectedAtoms().filter(function (atom) { return !assigned.has(atom.id); });
        var unknown = (state.customUnknownAtoms || []).map(function (id) { return { id: id }; });
        return { known: known, unknown: unknown, total: known.length + unknown.length };
      }

      function renderLooseAssemblyArea(slots, cov) {
        var loose = looseAssemblyItems(slots, cov);
        if (loose.total === 0) return "";
        var items = loose.known.map(renderLooseKnownAtom).concat(loose.unknown.map(renderLooseUnknownAtom));
        var collapsed = state.collapsedStages.has("loose");
        var label = t("loose.title");
        var toggleLabel = collapsed ? tx("stage.expand", { stage: label }) : tx("stage.collapse", { stage: label });
        return '<section class="lane assembly-loose-area" data-builder-lane="loose" data-builder-lane-collapsed="' + String(collapsed) + '" data-builder-plane="loose" data-builder-loose-area="ready" data-builder-loose-count="' + h(loose.total) + '">' +
          '<div class="lane-head"><button type="button" class="lane-toggle" data-lane-toggle-stage="loose" data-builder-lane-toggle="loose" aria-expanded="' + String(!collapsed) + '" aria-label="' + h(toggleLabel) + '" title="' + h(toggleLabel) + '"></button><span class="lane-title">' + h(label) + renderLaneHelp("loose") + '</span><span class="chip">' + h(loose.total) + '</span></div>' +
          '<div class="loose-grid" data-builder-lane-body="loose"' + (collapsed ? " hidden" : "") + '>' + items.join("") + '</div>' +
        '</section>';
      }

      function renderLooseKnownAtom(atom) {
        return '<div class="atom-tile loose-atom-tile" data-scope="' + h(atom.scope) + '" data-state-selected="true" data-builder-plane="' + h(atom.plane) + '" data-builder-lane="loose" data-builder-atom="' + h(atom.id) + '" data-atom-id="' + h(atom.id) + '" data-builder-loose-atom="' + h(atom.id) + '" data-builder-loose-kind="known" data-builder-implementation-level="' + h(implementationLevel(atom)) + '">' +
          '<div><div class="atom-name-row"><div class="atom-name">' + h(atom.id) + '</div>' + renderInfoHelp("loose-atom-" + atom.id, atom.id, atomExplanation(atom)) + '</div><div class="atom-meta">' + h(t("loose.known") + " · " + t("loose.reason.unmatched")) + '</div><div class="atom-chip-row">' + renderImplementationChip(atom) + renderModuleConfirmationChip(atom) + '</div></div>' +
          '<button type="button" class="icon-button" draggable="false" title="' + h(t("action.remove")) + '" data-remove="' + h(atom.id) + '">−</button>' +
        '</div>';
      }

      function renderLooseUnknownAtom(item) {
        return '<div class="atom-tile loose-atom-tile" data-scope="external" data-state-selected="external" data-builder-plane="loose" data-builder-lane="loose" data-builder-loose-atom="' + h(item.id) + '" data-builder-loose-unknown="' + h(item.id) + '" data-builder-loose-kind="unknown">' +
          '<div><div class="atom-name-row"><div class="atom-name">' + h(item.id) + '</div>' + renderInfoHelp("loose-unknown-" + item.id, item.id, helpCopy().atomFallback) + '</div><div class="atom-meta">' + h(t("loose.unknown") + " · " + t("loose.reason.imported")) + '</div></div>' +
          '<span class="chip">' + h(t("loose.unknown")) + '</span>' +
        '</div>';
      }

      function selectedBundleGroups() {
        var assigned = new Set();
        var ids = [];
        Array.from(state.selectedBundles).forEach(function (id) { if (!ids.includes(id)) ids.push(id); });
        bundleIDsForSelectedAtoms(state.selected).forEach(function (id) { if (!ids.includes(id)) ids.push(id); });
        var groups = [];
        ids.forEach(function (id) {
          var bundle = bundleByID.get(id);
          if (!bundle) return;
	          var atoms = selectedAtomIDsForBundle(bundle)
	            .filter(function (atomID) { return state.selected.has(atomID) && !assigned.has(atomID); })
            .map(function (atomID) { return atomByID.get(atomID); })
            .filter(Boolean);
          if (atoms.length === 0) return;
          atoms.forEach(function (atom) { assigned.add(atom.id); });
          groups.push({ bundle: bundle, atoms: atoms });
        });
        var looseAtoms = atomsInSelectionNotAssigned(assigned);
        var looseByLane = new Map();
        looseAtoms.forEach(function (atom) {
          var lane = atomLane(atom);
          var list = looseByLane.get(lane) || [];
          list.push(atom);
          looseByLane.set(lane, list);
        });
        Array.from(looseByLane.entries()).forEach(function (entry) {
          groups.push({ bundle: null, lane: entry[0], atoms: entry[1] });
        });
        return groups;
      }

      function atomsInSelectionNotAssigned(assigned) {
        return selectedAtoms().filter(function (atom) { return !assigned.has(atom.id); });
      }

      function atomsInGroups(groups) {
        return groups.flatMap(function (group) { return group.atoms; });
      }

      function bundleLane(bundle) {
        return !bundle ? "loose" : bundle.plane === "product" ? "interface" : bundle.plane;
      }

      function renderBoardBundleGroup(group) {
        if (!group.bundle) {
          return '<section class="bundle-group" data-builder-bundle="loose-atoms" data-builder-bundle-state="loose">' +
            '<div class="bundle-group-head"><span><strong>' + h(t("bundle.loose")) + '</strong><br><span class="fine">' + h(tx("bundle.atoms", { count: group.atoms.length })) + '</span></span><span class="chip">loose</span></div>' +
            '<div class="bundle-atoms">' + group.atoms.map(renderBoardAtomTile).join("") + '</div>' +
          '</section>';
        }
        var info = bundleState(group.bundle);
        var status = info.status === "customized" ? t("bundle.customized") : info.status === "partial" ? t("bundle.partial") : t("bundle.selected");
        return '<section class="bundle-group" data-builder-bundle="' + h(group.bundle.id) + '" data-builder-bundle-state="' + h(info.status) + '">' +
          '<div class="bundle-group-head">' +
            '<button type="button" class="bundle-heading-button" data-show-bundle="' + h(group.bundle.id) + '"><span><span class="explainable-title"><strong>' + h(group.bundle.label) + '</strong>' + renderInfoHelp("group-bundle-" + group.bundle.id, group.bundle.label, bundleExplanation(group.bundle)) + '</span><br><span class="fine">' + h(group.bundle.id) + '</span></span></button>' +
            '<span class="chip" title="' + h(bundleStatusHelp(info)) + '">' + h(status) + '</span>' +
            '<button type="button" class="icon-button" title="' + h(t("bundle.remove")) + '" data-remove-bundle="' + h(group.bundle.id) + '">−</button>' +
          '</div>' +
          '<div class="bundle-atoms">' + group.atoms.map(renderBoardAtomTile).join("") + '</div>' +
        '</section>';
      }

	      function renderBoardAtomTile(atom, slotID, role) {
	        var roleAttrs = role ? ' data-builder-slot-atom-role="' + h(role) + '"' : "";
	        var slotAttrs = slotID ? ' data-builder-slot-atom="' + h(atom.id) + '" data-slot-atom-id="' + h(atom.id) + '" data-builder-slot-atom-slot="' + h(slotID) + '"' + roleAttrs : "";
	        var meta = (role ? t("slot.atomRole." + role) + " · " : "") + atom.kind + " · " + atom.stability;
	        return '<div class="atom-tile" data-scope="' + h(atom.scope) + '" data-state-selected="true" data-builder-plane="' + h(atom.plane) + '" data-builder-lane="' + h(atomLane(atom)) + '" data-builder-atom="' + h(atom.id) + '" data-atom-id="' + h(atom.id) + '" data-builder-implementation-level="' + h(implementationLevel(atom)) + '"' + slotAttrs + '>' +
	          '<div><div class="atom-name-row"><div class="atom-name">' + h(atom.id) + '</div>' + renderInfoHelp("board-atom-" + atom.id, atom.id, atomExplanation(atom)) + '</div><div class="atom-meta">' + h(meta) + '</div><div class="atom-chip-row">' + renderImplementationChip(atom) + renderModuleConfirmationChip(atom) + '</div></div>' +
	          '<button type="button" class="icon-button" draggable="false" title="' + h(t("action.remove")) + '" data-remove="' + h(atom.id) + '">−</button>' +
	        '</div>';
	      }

      function renderCollapsibleSection(options) {
        var attrs = options.attrs || "";
        var className = options.className || "impact-section";
        var open = options.open === false ? "" : " open";
        var badge = options.badge == null ? "" : '<span class="chip">' + h(options.badge) + '</span>';
        return '<details class="' + h(className) + ' collapsible-section"' + (attrs ? " " + attrs : "") + open + '>' +
          '<summary><span>' + h(options.title) + '</span>' + badge + '</summary>' +
          '<div class="collapsible-section-body">' + (options.body || "") + '</div>' +
        '</details>';
      }

      function renderPreviewImpactSection(kind, title, body, count) {
        return renderCollapsibleSection({
          title: title,
          body: body,
          badge: count || 0,
          attrs: 'data-builder-preview-impact="' + h(kind) + '" data-builder-preview-impact-count="' + h(count || 0) + '"'
        });
      }

      function renderPreviewPanel(preview) {
        if (!preview) return "";
        if (preview.action === "replace-family") {
          var replaceSlots = miniList(preview.targetSlots.slice(0, 8).map(function (slot) {
            return '<li data-builder-preview-slot="' + h(slot.id) + '">' + h(slot.label + " · " + slot.primaryPortID) + '</li>';
          }), t("remove.none"));
          var oldBundles = miniList((preview.oldBundles || []).map(function (bundle) {
            return '<li data-builder-preview-old-bundle="' + h(bundle.id) + '">' + h(bundle.label + " · " + bundle.id) + '</li>';
          }), t("remove.none"));
          var newBundle = '<ul class="impact-list-mini"><li data-builder-preview-new-bundle="' + h(preview.bundle.id) + '">' + h(preview.bundle.label + " · " + preview.bundle.id) + '</li></ul>';
          var addedAtoms = miniList((preview.newAtomIDs || []).slice(0, 14).map(function (atomID) {
            return '<li data-builder-preview-atom="' + h(atomID) + '">' + h(atomID) + '</li>';
          }), t("remove.none"));
          var removedAtoms = miniList((preview.removedAtomIDs || []).slice(0, 14).map(function (atomID) {
            return '<li data-builder-preview-removed-atom="' + h(atomID) + '">' + h(atomID) + '</li>';
          }), t("remove.none"));
          var keptAtoms = miniList((preview.sharedAtomIDs || []).slice(0, 14).map(function (atomID) {
            return '<li data-builder-preview-kept-shared-atom="' + h(atomID) + '" data-builder-preview-shared-atom="' + h(atomID) + '">' + h(atomID) + '</li>';
          }), t("remove.none"));
          var bindingChanges = miniList((preview.bindingChanges || []).slice(0, 14).map(function (change) {
            var before = change.before || "<unset>";
            var after = change.after || "<removed>";
            return '<li data-builder-preview-binding-change="' + h(change.portID) + '" data-builder-preview-binding-before="' + h(before) + '" data-builder-preview-binding-after="' + h(after) + '">' + h(change.portID + ": " + before + " -> " + after) + '</li>';
          }), t("remove.none"));
          var conflicts = miniList(unique((preview.conflictPortIDs || []).concat(preview.replacementPortIDs || []).concat(preview.unresolvedPortIDs || []).concat(preview.danglingBindingPortIDs || [])).slice(0, 14).map(function (portID) {
            return '<li data-builder-preview-conflict-port="' + h(portID) + '">' + h(portID) + '</li>';
          }), t("remove.none"));
          var breaks = miniList((preview.breakPortIDs || []).slice(0, 14).map(function (portID) {
            return '<li data-builder-preview-break-port="' + h(portID) + '">' + h(portID) + '</li>';
          }), t("remove.none"));
          var conflictCount = unique((preview.conflictPortIDs || []).concat(preview.replacementPortIDs || []).concat(preview.unresolvedPortIDs || []).concat(preview.danglingBindingPortIDs || [])).length;
          var replaceConfirmAttr = 'data-preview-replace-family="' + h(preview.bundle.id) + '"' + (preview.severity === "blocked" ? " disabled" : "");
          return '<section class="preview-panel" data-builder-preview-panel="' + h(preview.bundle.id) + '" data-builder-preview-action="replace-family" data-builder-preview-severity="' + h(preview.severity) + '" data-builder-preview-family="' + h(preview.familyID) + '">' +
            '<div class="impact-summary" data-severity="' + h(preview.severity) + '">' +
              '<strong>' + h(t("preview.title") + " · " + t("preview.replaceFamily")) + '</strong><br>' +
              '<span class="fine">' + h(preview.familyLabel + " · " + preview.bundle.label) + '</span>' +
            '</div>' +
            '<div class="impact-grid">' +
              renderPreviewImpactSection("family", t("preview.family"), '<span class="fine">' + h(preview.familyID) + '</span>', preview.familyID ? 1 : 0) +
              renderPreviewImpactSection("old-bundles", t("preview.oldBundles"), oldBundles, (preview.oldBundles || []).length) +
              renderPreviewImpactSection("new-bundle", t("preview.newBundle"), newBundle, 1) +
              renderPreviewImpactSection("target-slots", t("preview.targetSlots"), replaceSlots, preview.targetSlots.length) +
              renderPreviewImpactSection("new-atoms", t("preview.newAtoms"), addedAtoms, (preview.newAtomIDs || []).length) +
              renderPreviewImpactSection("removed-atoms", t("preview.removedAtoms"), removedAtoms, (preview.removedAtomIDs || []).length) +
              renderPreviewImpactSection("shared-atoms", t("preview.sharedAtoms"), keptAtoms, (preview.sharedAtomIDs || []).length) +
              renderPreviewImpactSection("binding-changes", t("preview.bindingChanges"), bindingChanges, (preview.bindingChanges || []).length) +
              renderPreviewImpactSection("conflicts", t("preview.conflicts"), conflicts, conflictCount) +
              renderPreviewImpactSection("breaks", t("preview.breaks"), breaks, (preview.breakPortIDs || []).length) +
            '</div>' +
            '<div class="preview-actions">' +
              '<button type="button" ' + replaceConfirmAttr + '>' + h(t("preview.confirmReplaceFamily")) + '</button>' +
              '<button type="button" data-preview-cancel="true">' + h(t("preview.cancel")) + '</button>' +
            '</div>' +
          '</section>';
        }
        var targetSlots = miniList(preview.targetSlots.slice(0, 8).map(function (slot) {
          return '<li data-builder-preview-slot="' + h(slot.id) + '">' + h(slot.label + " · " + slot.primaryPortID) + '</li>';
        }), t("remove.none"));
        var newAtoms = miniList((preview.action === "remove" ? preview.removableAtomIDs || [] : preview.newAtomIDs).slice(0, 14).map(function (atomID) {
          return '<li data-builder-preview-atom="' + h(atomID) + '">' + h(atomID) + '</li>';
        }), t("remove.none"));
        var sharedAtoms = miniList((preview.sharedAtomIDs || []).slice(0, 14).map(function (atomID) {
          return '<li data-builder-preview-shared-atom="' + h(atomID) + '">' + h(atomID) + '</li>';
        }), t("remove.none"));
        var binds = miniList((preview.bindingPortIDs || []).slice(0, 14).map(function (portID) {
          return '<li data-builder-preview-binding-port="' + h(portID) + '">' + h(portID) + '</li>';
        }), t("remove.none"));
        var conflicts = miniList(unique((preview.conflictPortIDs || []).concat(preview.replacementPortIDs || [])).slice(0, 14).map(function (portID) {
          return '<li data-builder-preview-conflict-port="' + h(portID) + '">' + h(portID) + '</li>';
        }), t("remove.none"));
        var breaks = miniList((preview.breakPortIDs || []).slice(0, 14).map(function (portID) {
          return '<li data-builder-preview-break-port="' + h(portID) + '">' + h(portID) + '</li>';
        }), t("remove.none"));
        var previewAtomIDs = (preview.action === "remove" ? preview.removableAtomIDs : preview.newAtomIDs) || [];
        var previewConflictCount = unique((preview.conflictPortIDs || []).concat(preview.replacementPortIDs || [])).length;
        var actionLabel = preview.action === "remove" ? t("preview.remove") : t("preview.install");
        var confirmLabel = preview.action === "remove" ? t("preview.confirmRemove") : t("preview.confirmInstall");
        var confirmAttr = preview.action === "remove" ? 'data-preview-remove="' + h(preview.bundle.id) + '"' : 'data-preview-install="' + h(preview.bundle.id) + '"';
        var requiredRemoveWarning = preview.action === "remove" && preview.breakPortIDs && preview.breakPortIDs.length > 0
          ? '<span class="fine" data-builder-preview-required-warning="' + h(preview.bundle.id) + '">' + h(tx("preview.requiredRemoveWarning", { ports: preview.breakPortIDs.slice(0, 5).join(", ") + (preview.breakPortIDs.length > 5 ? "..." : "") })) + '</span>'
          : "";
        return '<section class="preview-panel" data-builder-preview-panel="' + h(preview.bundle.id) + '" data-builder-preview-action="' + h(preview.action) + '" data-builder-preview-severity="' + h(preview.severity) + '">' +
          '<div class="impact-summary" data-severity="' + h(preview.severity) + '">' +
            '<strong>' + h(t("preview.title") + " · " + actionLabel) + '</strong><br>' +
            '<span class="fine">' + h(preview.bundle.label + " · " + preview.bundle.id) + '</span>' +
            (requiredRemoveWarning ? '<br>' + requiredRemoveWarning : "") +
          '</div>' +
          '<div class="impact-grid">' +
            renderPreviewImpactSection("target-slots", t("preview.targetSlots"), targetSlots, preview.targetSlots.length) +
            renderPreviewImpactSection(preview.action === "remove" ? "removed-atoms" : "new-atoms", preview.action === "remove" ? t("remove.bundleAtoms") : t("preview.newAtoms"), newAtoms, previewAtomIDs.length) +
            renderPreviewImpactSection("shared-atoms", t("preview.sharedAtoms"), sharedAtoms, (preview.sharedAtomIDs || []).length) +
            renderPreviewImpactSection("bindings", t("preview.binds"), binds, (preview.bindingPortIDs || []).length) +
            renderPreviewImpactSection("conflicts", t("preview.conflicts"), conflicts, previewConflictCount) +
            renderPreviewImpactSection("breaks", t("preview.breaks"), breaks, (preview.breakPortIDs || []).length) +
          '</div>' +
          '<div class="preview-actions">' +
            '<button type="button" ' + confirmAttr + '>' + h(confirmLabel) + '</button>' +
            '<button type="button" data-preview-cancel="true">' + h(t("preview.cancel")) + '</button>' +
          '</div>' +
        '</section>';
      }

      function renderBindingPreviewPanel(preview) {
        if (!preview) return "";
        var affected = miniList(unique(preview.affectedCapabilities || []).slice(0, 14).map(function (portID) {
          return '<li data-builder-binding-preview-capability="' + h(portID) + '">' + h(portID) + '</li>';
        }), t("remove.none"));
        return '<section class="preview-panel" data-builder-binding-preview="' + h(preview.portID) + '" data-builder-binding-preview-provider="' + h(preview.providerID) + '" data-builder-preview-action="bind" data-builder-preview-severity="warning">' +
          '<div class="impact-summary" data-severity="warning">' +
            '<strong>' + h(t("preview.bindingTitle")) + '</strong><br>' +
            '<span class="fine">' + h(preview.portID + " · " + preview.before + " -> " + preview.after) + '</span>' +
          '</div>' +
          '<div class="impact-grid">' +
            '<section class="impact-section"><strong>' + h(t("slot.replacement")) + '</strong><ul class="impact-list-mini"><li data-builder-binding-preview-slot="' + h(preview.slotID) + '">' + h((preview.slotLabel || preview.slotID || preview.portID) + " · " + preview.portID) + '</li></ul></section>' +
            '<section class="impact-section"><strong>' + h(t("preview.bindingCandidate")) + '</strong><ul class="impact-list-mini"><li data-builder-binding-preview-atom="' + h(preview.providerID) + '">' + h(preview.providerID) + '</li></ul></section>' +
            '<section class="impact-section"><strong>' + h(t("impact.capabilities")) + '</strong>' + affected + '</section>' +
            '<section class="impact-section"><strong>' + h(t("impact.validation")) + '</strong><span class="fine">' + h(preview.validationCommand) + '</span></section>' +
          '</div>' +
          '<div class="preview-actions">' +
            '<button type="button" data-binding-preview-confirm="true">' + h(t("preview.confirmBinding")) + '</button>' +
            '<button type="button" data-binding-preview-cancel="true">' + h(t("preview.cancel")) + '</button>' +
          '</div>' +
        '</section>';
      }

      function renderPendingChange(bundlePreviewData, bindingPreviewData) {
        var markup = renderPreviewPanel(bundlePreviewData) + renderBindingPreviewPanel(bindingPreviewData);
        if (markup) return markup;
        return '<section class="preview-panel" data-builder-pending-change-empty="true" data-builder-preview-severity="info">' +
          '<div class="impact-summary" data-severity="info">' +
            '<strong>' + h(t("preview.emptyTitle")) + '</strong><br>' +
            '<span class="fine">' + h(t("preview.emptyBody")) + '</span>' +
          '</div>' +
        '</section>';
      }

      function renderDetailsLink(section) {
        return '<button type="button" class="details-link-button" data-builder-details-open="true" data-builder-details-section-target="' + h(section || "materials") + '">' + h(t("details.viewAll")) + '</button>';
      }

      function syncPendingChange(bundlePreviewData, bindingPreviewData) {
        var section = document.getElementById("pendingChangeSection");
        var panel = document.getElementById("previewPanel");
        var tab = document.getElementById("pendingChangeTabButton");
        var active = Boolean(bundlePreviewData || bindingPreviewData);
        var visible = active || state.inspectorTab === "preview";
        if (tab) tab.hidden = !active;
        if (section) {
          section.hidden = !visible;
          section.dataset.builderPendingChange = active ? "active" : "empty";
          section.dataset.builderInspectorActive = String(state.inspectorTab === "preview");
        }
        var pendingImpactBadge = document.getElementById("pendingImpactBadge");
        if (pendingImpactBadge) pendingImpactBadge.textContent = active ? t("preview.badgeActive") : t("preview.badgeEmpty");
        if (panel) panel.innerHTML = visible ? renderPendingChange(bundlePreviewData, bindingPreviewData) : "";
      }

      function normalizeInspectorTab() {
        var legacyDetailsSections = {
          bom: "materials",
          audit: "audit",
          raw: "raw",
          commands: "commands",
          activation: "activation"
        };
        if (legacyDetailsSections[state.inspectorTab]) {
          state.detailsSection = legacyDetailsSections[state.inspectorTab];
          state.inspectorTab = "details";
        }
        if (!["blueprint", "preview", "details"].includes(state.inspectorTab)) state.inspectorTab = "blueprint";
        state.detailsOpen = state.inspectorTab === "details";
      }

      function syncInspectorTabs() {
        normalizeInspectorTab();
        var activeTab = state.inspectorTab || "blueprint";
        document.querySelectorAll("[data-builder-inspector-tab]").forEach(function (tab) {
          var active = tab.dataset.builderInspectorTab === activeTab;
          tab.setAttribute("aria-pressed", String(active));
          tab.dataset.builderInspectorActive = String(active);
        });
        var currentSection = document.getElementById("currentAssemblySection");
        if (currentSection) {
          currentSection.hidden = activeTab !== "blueprint";
          currentSection.dataset.builderInspectorActive = String(activeTab === "blueprint");
        }
        var auditScroll = document.querySelector("[data-builder-current-assembly]");
        if (auditScroll) auditScroll.hidden = activeTab === "details";
      }

      function syncDetailsDrawer() {
        normalizeInspectorTab();
        var drawer = document.getElementById("detailsDrawer");
        var button = document.getElementById("detailsOpenButton");
        var open = state.inspectorTab === "details";
        if (drawer) {
          drawer.hidden = !open;
          drawer.dataset.builderDetailsDrawer = open ? "open" : "closed";
          drawer.dataset.builderDetailsActiveSection = state.detailsSection || "materials";
          drawer.dataset.builderDetailsModel = "single-panel";
          drawer.dataset.builderDetailsLayout = "collapsible-sections";
          drawer.dataset.builderDetailsStateSource = "current-render-pass";
          drawer.dataset.builderDetailsSectionsVisible = "all";
          drawer.dataset.builderDetailsSectionCount = String(drawer.querySelectorAll("[data-builder-details-section]").length);
          drawer.querySelectorAll("[data-builder-details-section]").forEach(function (section) {
            var active = section.dataset.builderDetailsSection === (state.detailsSection || "materials");
            section.dataset.builderDetailsSectionActive = String(active);
            if (active && "open" in section) section.open = true;
          });
          drawer.querySelectorAll("[data-builder-details-nav-target]").forEach(function (navButton) {
            var active = navButton.dataset.builderDetailsNavTarget === (state.detailsSection || "materials");
            navButton.dataset.builderDetailsNavActive = String(active);
            navButton.setAttribute("aria-pressed", String(active));
          });
        }
        if (button) {
          button.setAttribute("aria-expanded", String(open));
        }
      }

      function revealDetailsSection(sectionID, focusCloseButton) {
        var section = document.querySelector('[data-builder-details-section="' + (sectionID || "materials") + '"]');
        if (section && state.inspectorTab === "details") {
          if ("open" in section) section.open = true;
        }
        if (section && state.inspectorTab === "details" && section.scrollIntoView) {
          section.scrollIntoView({ block: "start", inline: "nearest" });
        }
        if (focusCloseButton) {
          var detailsTab = document.getElementById("detailsOpenButton");
          if (detailsTab && detailsTab.focus) detailsTab.focus();
        }
      }

      function renderPreviewDock(bundlePreviewData, bindingPreviewData) {
        var dock = document.getElementById("previewDock");
        if (!dock) return;
        var activeBundlePreview = bundlePreviewData && state.previewPinned ? bundlePreviewData : null;
        var activeBindingPreview = bindingPreviewData || null;
        if (!activeBundlePreview && !activeBindingPreview) {
          dock.hidden = true;
          dock.innerHTML = "";
          dock.removeAttribute("data-severity");
          dock.removeAttribute("data-builder-preview-dock-action");
          dock.removeAttribute("data-builder-preview-dock-density");
          dock.removeAttribute("data-builder-preview-dock-role");
          document.body.dataset.builderPreviewDock = "none";
          return;
        }
        var severity = activeBindingPreview ? "warning" : activeBundlePreview.severity;
        var title = "";
        var fine = "";
        var confirmLabel = "";
        var confirmAttr = "";
        var action = "";
        if (activeBindingPreview) {
          title = t("preview.bindingTitle");
          fine = activeBindingPreview.portID + " · " + activeBindingPreview.before + " -> " + activeBindingPreview.after;
          confirmLabel = t("preview.confirmBinding");
          confirmAttr = 'data-binding-preview-confirm="true"';
          action = "bind";
        } else {
          action = activeBundlePreview.action;
          title = t("preview.title") + " · " + (activeBundlePreview.action === "remove" ? t("preview.remove") : activeBundlePreview.action === "replace-family" ? t("preview.replaceFamily") : t("preview.install"));
          fine = activeBundlePreview.bundle.label + " · " + activeBundlePreview.targetSlots.slice(0, 3).map(function (slot) { return slot.label; }).join(", ");
          if (activeBundlePreview.action === "replace-family") {
            fine = activeBundlePreview.familyLabel + " · " + (activeBundlePreview.oldBundleIDs || []).slice(0, 2).join(", ") + " -> " + activeBundlePreview.bundle.id;
          }
          if (activeBundlePreview.action === "remove" && activeBundlePreview.breakPortIDs && activeBundlePreview.breakPortIDs.length > 0) {
            fine += " · " + tx("preview.requiredRemoveWarning", { ports: activeBundlePreview.breakPortIDs.slice(0, 3).join(", ") + (activeBundlePreview.breakPortIDs.length > 3 ? "..." : "") });
          }
          confirmLabel = activeBundlePreview.action === "remove" ? t("preview.confirmRemove") : activeBundlePreview.action === "replace-family" ? t("preview.confirmReplaceFamily") : t("preview.confirmInstall");
          confirmAttr = activeBundlePreview.action === "remove"
            ? 'data-preview-remove="' + h(activeBundlePreview.bundle.id) + '"'
            : activeBundlePreview.action === "replace-family"
              ? 'data-preview-replace-family="' + h(activeBundlePreview.bundle.id) + '"' + (activeBundlePreview.severity === "blocked" ? " disabled" : "")
              : 'data-preview-install="' + h(activeBundlePreview.bundle.id) + '"';
        }
        dock.hidden = false;
        dock.dataset.severity = severity;
        dock.dataset.builderPreviewDockAction = action;
        dock.dataset.builderPreviewDockDensity = "compact";
        dock.dataset.builderPreviewDockRole = "confirmation";
        document.body.dataset.builderPreviewDock = "active";
        dock.innerHTML =
          '<div class="preview-dock-main" data-builder-preview-dock-summary="compact">' +
            '<span class="preview-dock-title" data-builder-preview-dock-title="ready">' + h(title) + '</span>' +
            '<span class="fine" data-builder-preview-dock-fine="ready">' + h(fine) + '</span>' +
          '</div>' +
          '<div class="preview-dock-actions" data-builder-preview-dock-actions="ready">' +
            '<button type="button" ' + confirmAttr + '>' + h(confirmLabel) + '</button>' +
            '<button type="button" ' + (activeBindingPreview ? 'data-binding-preview-cancel="true"' : 'data-preview-cancel="true"') + '>' + h(t("preview.cancel")) + '</button>' +
          '</div>';
      }

      function renderAtomPromotionPanel() {
        var candidates = bundlePromotionCandidates(state.activeAtom);
        if (!candidates.length) return "";
        return '<section class="impact-section" data-builder-atom-promotion="ready" data-builder-atom-promotion-atom="' + h(state.activeAtom) + '">' +
          '<strong>' + h(t("bundle.promote.title")) + '</strong>' +
          candidates.map(function (bundle) {
            var targetSlots = slotsForBundle(bundle).slice(0, 3).map(function (slot) { return slot.label; }).join(", ");
            return '<button type="button" class="provider-choice" data-promote-bundle="' + h(bundle.id) + '" data-builder-atom-promote-bundle="' + h(bundle.id) + '" data-builder-bundle-promotion-source-atom="' + h(state.activeAtom) + '">' +
              '<span><span class="explainable-title"><strong>' + h(bundle.label) + '</strong>' + renderInfoHelp("promote-bundle-" + bundle.id, bundle.label, candidateBundleHelp(bundle)) + '</span><br><span class="fine">' + h(tx("bundle.promote.fine", { bundle: bundle.id }) + (targetSlots ? " · " + targetSlots : "")) + '</span></span>' +
              '<span class="chip">' + h(t("bundle.promote")) + '</span>' +
            '</button>';
          }).join("") +
        '</section>';
      }

      function guideStageState(stage, slots, cov) {
        var stageSlots = slots.filter(function (slot) { return slotAssemblyStage(slot) === stage.id; });
        var states = stageSlots.map(function (slot) { return { slot: slot, info: slotState(slot, cov) }; });
        var readyCount = states.filter(function (item) { return item.info.status === "installed" || item.info.status === "customized"; }).length;
        var missingCount = states.filter(function (item) { return item.info.status === "empty" || item.info.status === "partial" || item.info.status === "conflict"; }).length;
        var conflictCount = states.filter(function (item) { return item.info.status === "conflict" || item.info.conflictPorts.length > 0; }).length;
        var nextSlot = states.find(function (item) { return item.info.status === "conflict"; }) ||
          states.find(function (item) { return item.info.status === "partial"; }) ||
          states.find(function (item) { return item.info.status === "empty"; }) ||
          null;
        return {
          stageSlots: stageSlots,
          readyCount: readyCount,
          missingCount: missingCount,
          conflictCount: conflictCount,
          nextSlot: nextSlot ? nextSlot.slot : null,
          status: conflictCount > 0 ? "conflict" : missingCount > 0 ? "missing" : "ready"
        };
      }

      function guideAcceptanceState(cov, slots, validation) {
        var recipe = exportRecipe();
        var commands = builderCommands();
        var hasGap = slots.some(function (slot) { return slotNeedsAssembly(slot, cov); });
        var coveredRequired = cov.required.every(function (portID) { return (cov.providers.get(portID) || []).length > 0; });
        var recipeReady = Boolean(recipe && recipe.id && recipe.version && Array.isArray(recipe.requiredCapabilities) && Array.isArray(recipe.bindings) && recipe.metadata && recipe.metadata.generatedBy === "helix-builder");
        var commandIDs = commands.map(function (command) { return command.id; });
        var commandsReady = ["validate", "assemble", "run-live", "task-parity"].every(function (id) { return commandIDs.includes(id); });
        var checks = [
          { id: "validate", label: t("guide.acceptance.validate"), ready: validation.status === "ready" },
          { id: "ports", label: t("guide.acceptance.ports"), ready: coveredRequired && cov.missing.length === 0 },
          { id: "recipe", label: t("guide.acceptance.recipe"), ready: recipeReady },
          { id: "commands", label: t("guide.acceptance.commands"), ready: commandsReady }
        ];
        var readyCount = checks.filter(function (check) { return check.ready; }).length;
        return {
          checks: checks,
          readyCount: readyCount,
          total: checks.length,
          ready: !hasGap && checks.every(function (check) { return check.ready; }),
          hasGap: hasGap
        };
      }

      function renderGuideAcceptanceStep(acceptance) {
        return '<div class="guide-step guide-step-acceptance" data-builder-guide-acceptance-step="' + h(acceptance.ready ? "ready" : "blocked") + '" data-builder-guide-step-status="' + h(acceptance.ready ? "ready" : "missing") + '" data-missing="' + String(!acceptance.ready) + '" aria-pressed="false">' +
          '<strong>' + h(t("stage.acceptance")) + '</strong><br>' +
          '<span class="fine" data-builder-guide-step-count="acceptance">' + h(tx("guide.acceptanceSummary", { ready: acceptance.readyCount, total: acceptance.total })) + '</span>' +
          '<span class="fine" data-builder-guide-step-conflicts="acceptance" data-builder-guide-step-conflict-count="' + h(acceptance.ready ? 0 : acceptance.total - acceptance.readyCount) + '">' + h(tx("guide.conflict", { count: acceptance.ready ? 0 : acceptance.total - acceptance.readyCount })) + '</span>' +
          '<span class="fine guide-step-next" data-builder-guide-step-next="acceptance">' + h(acceptance.ready ? t("guide.acceptanceReady") : t("guide.acceptanceBlocked")) + '</span>' +
        '</div>';
      }

      function renderGuideAcceptancePanel(acceptance) {
        if (acceptance.hasGap) return "";
        return '<div class="guide-acceptance" data-builder-guide-acceptance="' + h(acceptance.ready ? "ready" : "blocked") + '">' +
          '<div class="port-stage-head"><span><strong>' + h(t("guide.acceptance")) + '</strong><br><span class="fine">' + h(tx("guide.acceptanceSummary", { ready: acceptance.readyCount, total: acceptance.total })) + '</span></span><span class="chip">' + h(acceptance.ready ? t("guide.acceptanceReady") : t("guide.acceptanceBlocked")) + '</span></div>' +
          '<div class="guide-acceptance-checks">' + acceptance.checks.map(function (check) {
            return '<div class="guide-acceptance-check" data-builder-guide-acceptance-check="' + h(check.id) + '" data-builder-acceptance-check="' + h(check.id) + '" data-ready="' + String(check.ready) + '"><strong>' + h(check.label) + '</strong><br><span class="fine">' + h(check.ready ? t("guide.ready") : t("guide.acceptanceBlocked")) + '</span></div>';
          }).join("") + '</div>' +
        '</div>';
      }

      function renderGuideMarkup(stages, cov, activeStage, slots) {
        if (!stages.length) return "";
        var validation = validationStatus(cov);
        var acceptance = guideAcceptanceState(cov, slots, validation);
        var hasGap = acceptance.hasGap;
        var collapsed = Boolean(state.guideCollapsed);
        var mode = state.guideActive ? "active" : "overview";
        var activeLabel = state.guideActive && activeStage ? activeStage.label : t("guide.overview");
        var guideSteps = '<div class="guide-steps">' + stages.map(function (stage) {
            var stageState = guideStageState(stage, slots, cov);
            var active = activeStage && activeStage.id === stage.id;
            var nextLabel = stageState.nextSlot ? stageState.nextSlot.label : t("guide.ready");
            return '<button type="button" class="guide-step" data-guide-stage="' + h(stage.id) + '" data-builder-guide-step-status="' + h(stageState.status) + '" data-missing="' + String(stageState.missingCount > 0) + '" aria-pressed="' + String(Boolean(active)) + '">' +
              '<strong>' + h(stage.label) + '</strong><br>' +
              '<span class="fine" data-builder-guide-step-count="' + h(stage.id) + '">' + h(tx("guide.stageReady", { ready: stageState.readyCount, total: stageState.stageSlots.length }) + " · " + tx("guide.gap", { count: stageState.missingCount })) + '</span>' +
              '<span class="fine" data-builder-guide-step-conflicts="' + h(stage.id) + '" data-builder-guide-step-conflict-count="' + h(stageState.conflictCount) + '">' + h(tx("guide.conflict", { count: stageState.conflictCount })) + '</span>' +
              '<span class="fine guide-step-next" data-builder-guide-step-next="' + h(stage.id) + '" data-builder-guide-step-next-slot="' + h(stageState.nextSlot ? stageState.nextSlot.id : "") + '">' + h(tx("guide.next", { slot: nextLabel })) + '</span>' +
            '</button>';
          }).join("") + renderGuideAcceptanceStep(acceptance) + '</div>';
        var guideActions = state.guideActive
          ? '<div class="guide-actions">' +
            '<button type="button" data-action="guide-back">' + h(t("action.back")) + '</button>' +
            '<span class="fine" data-builder-guide-active="' + h(activeStage ? activeStage.id : "") + '">' + h(activeStage ? activeStage.label : "") + '</span>' +
            '<button type="button" data-action="guide-exit">' + h(t("action.all")) + '</button>' +
            '<button type="button" data-action="guide-next">' + h(hasGap ? t("action.next") : t("action.finish")) + '</button>' +
          '</div>'
          : '<div class="guide-actions" data-builder-guide-overview="ready"><span class="fine">' + h(t("guide.openStage")) + '</span></div>';
        return '<section class="guide-shell" data-builder-guide-shell="ready" data-builder-guide-collapsed="' + String(collapsed) + '" data-builder-guide-mode="' + h(mode) + '">' +
          '<div class="guide-shell-head">' +
            '<button type="button" class="lane-toggle" data-guide-toggle="true" data-builder-guide-toggle="true" onclick="window.__harnessBuilderToggleGuide && window.__harnessBuilderToggleGuide()" aria-expanded="' + String(!collapsed) + '" aria-label="' + h(collapsed ? t("guide.expand") : t("guide.collapse")) + '" title="' + h(collapsed ? t("guide.expand") : t("guide.collapse")) + '"></button>' +
            '<span><span class="guide-shell-title">' + h(t("guide.title")) + '</span><br><span class="fine">' + h(activeLabel) + '</span></span>' +
            '<span class="chip" data-builder-guide-toggle-label="true">' + h(collapsed ? t("guide.expand") : t("guide.collapse")) + '</span>' +
          '</div>' +
          '<div class="guide-shell-body" data-builder-guide-body="ready"' + (collapsed ? " hidden" : "") + '>' +
            guideSteps +
            renderGuideAcceptancePanel(acceptance) +
            guideActions +
          '</div>' +
        '</section>';
      }

      function renderStageSummary(slots, cov) {
        var stages = assemblyStagesForSlots(slots);
        return renderCollapsibleSection({
          title: t("blueprint.stageSummary"),
          badge: stages.length,
          attrs: 'data-builder-current-assembly-action="stage-summary" data-builder-current-assembly-stage-count="' + h(stages.length) + '"',
          body: miniList(stages.map(function (stage) {
            var stageSlots = slots.filter(function (slot) { return slotAssemblyStage(slot) === stage.id; });
            if (stageSlots.length === 0) return "";
            var installed = stageSlots.filter(function (slot) {
              var status = slotState(slot, cov).status;
              return status === "installed" || status === "customized";
            }).length;
            return '<li data-builder-blueprint-stage="' + h(stage.id) + '">' + h(stage.label + " · " + installed + "/" + stageSlots.length) + '</li>';
          }).filter(Boolean), t("remove.none"))
        });
      }

      function renderCurrentAssemblySummary(current, slots, cov) {
        var activeBundlePreview = state.previewPinned ? bundlePreview() : null;
        var activeBindingPreview = bindingPreview();
        var latestImpact = activeBindingPreview
          ? {
              id: activeBindingPreview.portID,
              label: activeBindingPreview.portID,
              fine: activeBindingPreview.before + " -> " + activeBindingPreview.after,
              kind: "binding-preview"
            }
          : activeBundlePreview
            ? {
                id: activeBundlePreview.bundle.id,
                label: activeBundlePreview.bundle.label,
                fine: activeBundlePreview.action === "replace-family"
                  ? (activeBundlePreview.oldBundleIDs || []).join(", ") + " -> " + activeBundlePreview.bundle.id + " · bindings " + ((activeBundlePreview.bindingChanges || []).length)
                  : activeBundlePreview.action + " · " + activeBundlePreview.targetSlotIDs.join(", "),
                kind: activeBundlePreview.action === "replace-family" ? "family-replacement" : "bundle-preview"
              }
            : state.lastSwap
              ? {
                  id: state.lastSwap.portID,
                  label: state.lastSwap.portID,
                  fine: state.lastSwap.before + " -> " + state.lastSwap.after,
                  kind: "binding"
                }
              : null;
        var gapSlots = slots.filter(function (slot) {
          var status = slotState(slot, cov).status;
          return status === "empty" || status === "partial" || status === "conflict";
        });
        var seenBundles = new Set();
        var installedBundleItems = slots.flatMap(function (slot) {
          return slotState(slot, cov).installedBundleIDs.map(function (bundleID) {
            var bundle = bundleByID.get(bundleID);
            return bundle ? { slot: slot, bundle: bundle } : null;
          }).filter(Boolean);
        }).filter(function (item) {
          if (seenBundles.has(item.bundle.id)) return false;
          seenBundles.add(item.bundle.id);
          return true;
        });
        var visibleGapSlots = gapSlots.slice(0, 5);
        var gapOverflow = gapSlots.length > visibleGapSlots.length ? renderDetailsLink("audit") : "";
        var visibleInstalledBundleItems = installedBundleItems.slice(0, 5);
        var installedBundleOverflow = installedBundleItems.length > visibleInstalledBundleItems.length ? renderDetailsLink("materials") : "";
        var nextSlot = gapSlots[0] || slots[0] || null;
        var assemblyKitID = state.customKitID || (state.preset !== "custom" && current ? "preset." + current.id : "kit.custom");
        var assemblyMode = state.customAssemblyMode || (state.preset !== "custom" ? "preset" : "custom");
        var assemblyChassisID = state.customChassisID || "chassis." + (current ? current.id : "custom");
        return '<div class="impact-grid" data-builder-current-assembly-summary="ready" data-builder-current-assembly-model="actionable" data-builder-blueprint="summary">' +
          renderCollapsibleSection({
            title: t("blueprint.product"),
            badge: current ? current.product : "custom",
            attrs: 'data-builder-current-assembly-action="harness"',
            body: '<div class="surface-row" data-builder-blueprint-product="' + h(current ? current.product : "custom") + '" data-builder-blueprint-preset-claim="' + h(current ? current.assemblyClaim : "custom") + '" data-builder-blueprint-composition-claim="' + h(current ? current.compositionClaim : "custom-composition") + '" data-builder-blueprint-parity-target-satisfied="' + String(Boolean(current && current.parityTargetSatisfied)) + '" data-builder-blueprint-native-parity="' + String(Boolean(current && current.nativeParityVerified)) + '" data-builder-blueprint-compile-status="' + h(current ? current.compileStatus : "unknown") + '"><span><strong>' + h(current ? current.label : "custom") + '</strong><br><span class="fine">' + h(current ? current.recipeID : "custom") + '</span><br><span class="fine">' + h(current ? current.assemblyClaimLabel : "") + '</span></span><span class="chip">' + h(current && current.nativeParityVerified ? "native parity" : current ? "compatible" : "custom") + '</span><span class="chip" data-builder-blueprint-compile-chip="' + h(current ? current.compileStatus : "unknown") + '">' + h(current ? current.compileStatus : "unknown") + '</span></div>' +
              (current ? '<div class="surface-row" data-builder-blueprint-native-parity-summary="' + h(current.id) + '"><span><strong>' + h(current.nativeParityVerified ? "Native parity verified" : "Native parity not verified") + '</strong><br><span class="fine">' + h(current.nativeParitySummary) + '</span></span><span class="chip">' + h(current.nativeParityVerified ? "verified" : "not verified") + '</span></div>' : "")
          }) +
          renderCollapsibleSection({
            title: t("blueprint.kit"),
            badge: assemblyMode,
            attrs: 'data-builder-current-assembly-action="kit"',
            body: '<div class="surface-row" data-builder-blueprint-kit="' + h(assemblyKitID) + '" data-builder-blueprint-chassis="' + h(assemblyChassisID) + '" data-builder-blueprint-assembly-mode="' + h(assemblyMode) + '"><span><strong>' + h(assemblyKitID) + '</strong><br><span class="fine">' + h(assemblyChassisID) + '</span></span><span class="chip">' + h(assemblyMode) + '</span></div>'
          }) +
          renderStageSummary(slots, cov) +
          renderCollapsibleSection({
            title: t("blueprint.nextSlot"),
            badge: nextSlot ? slotStatusLabel(slotState(nextSlot, cov).status) : t("validation.ready"),
            attrs: 'data-builder-current-assembly-action="next-gap"',
            body: nextSlot ? '<div class="surface-row" data-builder-blueprint-next-slot="' + h(nextSlot.id) + '"><span><strong>' + h(nextSlot.label) + '</strong><br><span class="fine">' + h(nextSlot.primaryPortID) + '</span></span><span class="chip">' + h(slotStatusLabel(slotState(nextSlot, cov).status)) + '</span></div>' : '<span class="fine">' + h(t("validation.ready")) + '</span>'
          }) +
          renderCollapsibleSection({
            title: t("blueprint.emptySlots"),
            badge: gapSlots.length,
            attrs: 'data-builder-current-assembly-action="gaps" data-builder-current-assembly-gap-count="' + h(gapSlots.length) + '"',
            body: miniList(visibleGapSlots.map(function (slot) { return '<li data-builder-blueprint-gap-slot="' + h(slot.id) + '">' + h(slot.label + " · " + slotStatusLabel(slotState(slot, cov).status)) + '</li>'; }), t("remove.none")) + gapOverflow
          }) +
          renderCollapsibleSection({
            title: t("blueprint.installedBundles"),
            badge: installedBundleItems.length,
            attrs: 'data-builder-current-assembly-action="installed-bundles" data-builder-current-assembly-bundle-count="' + h(installedBundleItems.length) + '"',
            body: miniList(visibleInstalledBundleItems.map(function (item) {
              var source = bundleState(item.bundle).source;
              return '<li data-builder-blueprint-bundle="' + h(item.bundle.id) + '" data-builder-blueprint-bundle-source="' + h(source) + '">' + h(slotStageLabel(slotAssemblyStage(item.slot)) + " · " + bundleSourceLabel(source) + " · " + item.bundle.label) + '</li>';
            }), t("remove.none")) + installedBundleOverflow
          }) +
          renderCollapsibleSection({
            title: t("blueprint.latestImpact"),
            badge: latestImpact ? latestImpact.kind : 0,
            attrs: 'data-builder-current-assembly-action="latest-impact" data-builder-current-assembly-has-latest-impact="' + String(Boolean(latestImpact)) + '"',
            body: latestImpact ? '<div class="surface-row" data-builder-blueprint-latest-impact="' + h(latestImpact.id) + '" data-builder-blueprint-latest-impact-kind="' + h(latestImpact.kind) + '"><span><strong>' + h(latestImpact.label) + '</strong><br><span class="fine">' + h(latestImpact.fine) + '</span></span><span class="chip">' + h(latestImpact.kind) + '</span></div>' : '<span class="fine">' + h(t("impact.none.body")) + '</span>'
          }) +
        '</div>';
      }

      function renderDetailsMaterials(current, atoms) {
        var bundles = exportBundleRefs().map(function (ref) { return bundleByID.get(ref.id); }).filter(Boolean);
        var loose = looseAssemblyItems(requiredSlots(), coverage());
        var productShells = atoms.filter(isProductShellAtom);
        var bindings = Array.from(state.bindings.entries()).sort(function (left, right) { return left[0].localeCompare(right[0]); });
        var presetBindings = current && Array.isArray(current.bindings) ? current.bindings : [];
        function claimForBindingEntry(entry) {
          var found = presetBindings.find(function (binding) { return binding.portID === entry[0] && binding.providerAtomID === entry[1]; });
          return found && found.moduleClaim ? found.moduleClaim : moduleClaimForBinding(entry[0], entry[1], current ? current.product : "custom", current && Array.isArray(current.parityTargets) ? current.parityTargets : []);
        }
        return renderCollapsibleSection({
          title: t("bom.bundles"),
          badge: bundles.length,
          body: miniList(bundles.map(function (bundle) {
              var info = bundleState(bundle);
              return '<li data-builder-bom-bundle="' + h(bundle.id) + '" data-builder-bom-bundle-state="' + h(info.status) + '" data-builder-bom-bundle-source="' + h(info.source) + '">' + h(bundle.label + " · " + info.status + " · " + bundleSourceLabel(info.source) + " · " + bundle.id) + '</li>';
            }), t("remove.none"))
        }) +
          renderCollapsibleSection({
            title: t("bom.implementationStates"),
            badge: implementationStateSummary(atoms).filter(function (item) { return item.count > 0; }).length,
            attrs: 'data-builder-bom-implementation-summary="ready"',
            body: renderImplementationStateSummary(atoms)
        }) +
	          renderCollapsibleSection({
	            title: t("bom.atoms"),
	            badge: atoms.length,
	            body: miniList(atoms.slice(0, 80).map(function (atom) { return '<li data-builder-bom-atom="' + h(atom.id) + '" data-builder-bom-implementation-level="' + h(implementationLevel(atom)) + '" data-builder-module-confirmation="' + h(moduleConfirmationStatus(atom) || "untracked") + '"><span>' + h(atom.id) + '</span> ' + renderImplementationChip(atom) + renderModuleConfirmationChip(atom) + '</li>'; }), t("remove.none"))
	          }) +
	          renderCollapsibleSection({
	            title: t("bom.productShells"),
	            badge: productShells.length,
	            body: miniList(productShells.map(function (atom) { return '<li data-builder-bom-shell="' + h(atom.id) + '" data-builder-bom-implementation-level="' + h(implementationLevel(atom)) + '" data-builder-module-confirmation="' + h(moduleConfirmationStatus(atom) || "untracked") + '"><span>' + h(atom.id) + '</span> ' + renderImplementationChip(atom) + renderModuleConfirmationChip(atom) + '</li>'; }), t("remove.none"))
	          }) +
          renderCollapsibleSection({
            title: t("bom.bindings"),
            badge: bindings.length,
            body: miniList(bindings.map(function (entry) {
              var claim = claimForBindingEntry(entry);
              return '<li data-builder-bom-binding="' + h(entry[0]) + '" data-builder-bom-binding-provider="' + h(entry[1]) + '" data-builder-bom-binding-module-claim="' + h(claim.level) + '" data-builder-bom-binding-source-product="' + h(claim.sourceProduct) + '" data-builder-bom-binding-parity-compatible="' + h(claim.parityCompatible) + '" data-builder-bom-binding-parity-target-satisfied="' + String(Boolean(claim.parityTargetSatisfied)) + '"><span>' + h(entry[0] + " -> " + entry[1]) + '</span> <span class="chip" title="' + h(claim.summary) + '">' + h(claim.label) + '</span></li>';
            }), t("remove.none"))
          }) +
	          renderCollapsibleSection({
	            title: t("bundle.loose"),
	            badge: loose.total,
	            body: miniList(loose.known.map(function (atom) { return '<li data-builder-bom-loose-atom="' + h(atom.id) + '" data-builder-bom-loose-kind="known" data-builder-bom-implementation-level="' + h(implementationLevel(atom)) + '" data-builder-module-confirmation="' + h(moduleConfirmationStatus(atom) || "untracked") + '"><span>' + h(atom.id) + '</span> ' + renderImplementationChip(atom) + renderModuleConfirmationChip(atom) + '</li>'; }).concat(loose.unknown.map(function (item) { return '<li data-builder-bom-loose-atom="' + h(item.id) + '" data-builder-bom-loose-unknown="' + h(item.id) + '" data-builder-bom-loose-kind="unknown">' + h(item.id) + '</li>'; })), t("remove.none"))
	          }) +
          (current ? renderCollapsibleSection({
            title: t("state.preset"),
            badge: current.product,
            body: '<div class="surface-row" data-builder-bom-preset-claim="' + h(current.assemblyClaim) + '" data-builder-bom-composition-claim="' + h(current.compositionClaim) + '" data-builder-bom-parity-target-satisfied="' + String(Boolean(current.parityTargetSatisfied)) + '" data-builder-bom-native-parity="' + String(Boolean(current.nativeParityVerified)) + '" data-builder-bom-compile-status="' + h(current.compileStatus) + '"><span><strong>' + h(current.label) + '</strong><br><span class="fine">' + h(current.fingerprint) + '</span><br><span class="fine">' + h(current.assemblyClaimLabel) + '</span></span><span class="chip">' + h(current.nativeParityVerified ? "native parity" : "compatible") + '</span><span class="chip" data-builder-bom-compile-chip="' + h(current.compileStatus) + '">' + h(current.compileStatus) + '</span></div>' +
              '<div class="surface-row" data-builder-bom-native-parity-summary="' + h(current.id) + '"><span><strong>' + h(current.nativeParityVerified ? "Native parity verified" : "Native parity not verified") + '</strong><br><span class="fine">' + h(current.nativeParitySummary) + '</span></span><span class="chip">' + h(current.nativeParityVerified ? "verified" : "not verified") + '</span></div>'
          }) : "");
      }

      function activationDefaultName() {
        var current = preset();
        var base = state.customRecipeID || (current ? current.id : "") || "custom-harness";
        var name = String(base).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
        return name || "custom-harness";
      }

      function activationProfileName() {
        return (state.activationName || activationDefaultName()).trim();
      }

      function resetActivationRuntime() {
        state.activationName = "";
        state.activationWorkspaceDir = "";
        state.activationStorageDir = "";
        state.activationBusy = false;
        state.activationStatus = null;
        state.activationLogs = "";
        state.activationMessage = "";
        state.activationError = "";
      }

      function selectedOption(value, current) {
        return value === current ? " selected" : "";
      }

      function csvValues(value) {
        return String(value || "").split(",").map(function (item) { return item.trim(); }).filter(Boolean);
      }

      function activationStatusKind() {
        if (!server.online) return "static";
        if (state.activationError) return "error";
        if (state.activationBusy) return "busy";
        if (state.activationStatus && state.activationStatus.validation && state.activationStatus.validation.ok) return "configured";
        if (state.activationStatus && state.activationStatus.profile) return "installed";
        return "idle";
      }

      function activationSeverity(kind) {
        if (kind === "configured" || kind === "installed") return "ok";
        if (kind === "error" || kind === "static") return "blocked";
        return "warning";
      }

      function activationStatusLabel(kind) {
        if (kind === "static") return t("activation.static");
        if (kind === "busy") return t("activation.busy");
        if (kind === "installed") return t("activation.installed");
        if (kind === "configured") return t("activation.statusLoaded");
        if (kind === "error") return t("activation.error");
        return t("activation.idle");
      }

      function renderActivationPanel() {
        var name = activationProfileName();
        var status = state.activationStatus || {};
        var profile = status.profile || {};
        var provider = status.provider || null;
        var telegram = status.telegram || null;
        var gateway = status.gateway || {};
        var validation = status.validation || {};
        var kind = activationStatusKind();
        var disabled = (!server.online || state.activationBusy || !state.workspaceStarted) ? " disabled" : "";
        var statusDisabled = (!server.online || state.activationBusy || !name) ? " disabled" : "";
        var profileStatus = profile.status || kind;
        var providerStatus = provider ? provider.kind : t("activation.none");
        var telegramStatus = telegram ? telegram.mode : t("activation.none");
        var gatewayStatus = gateway.state || "stopped";
        var missing = Array.isArray(validation.missing) && validation.missing.length ? validation.missing.join(", ") : t("validation.ready");
        var message = state.activationError || state.activationMessage || missing;
        var logs = state.activationLogs || "";
        return '<div class="activation-panel" data-activation-ready="' + String(Boolean(server.online && state.workspaceStarted)) + '">' +
          '<section class="impact-summary" data-profile-status="' + h(profileStatus) + '" data-builder-profile-status="' + h(profileStatus) + '" data-severity="' + h(activationSeverity(kind)) + '">' +
            '<strong>' + h(activationStatusLabel(kind)) + '</strong><br>' +
            '<span class="fine">' + h(name + " · " + message) + '</span>' +
          '</section>' +
          '<div class="activation-grid">' +
            '<label class="activation-field"><span>' + h(t("activation.profile")) + '</span><input id="activationName" data-activation-field="activationName" value="' + h(name) + '" autocomplete="off"></label>' +
            '<label class="activation-field"><span>' + h(t("activation.workspaceDir")) + '</span><input id="activationWorkspaceDir" data-activation-field="activationWorkspaceDir" value="' + h(state.activationWorkspaceDir) + '" autocomplete="off"></label>' +
            '<label class="activation-field"><span>' + h(t("activation.storageDir")) + '</span><input id="activationStorageDir" data-activation-field="activationStorageDir" value="' + h(state.activationStorageDir) + '" autocomplete="off"></label>' +
            '<label class="activation-field"><span>' + h(t("activation.permissionSummary")) + '</span><input id="activationPermissionSummary" data-activation-permissions="summary" value="' + h(state.activationPermissionSummary) + '" readonly></label>' +
            '<label class="activation-field"><span>' + h(t("activation.provider")) + '</span><select id="activationProvider" data-activation-field="activationProvider">' +
              '<option value="openai-compatible"' + selectedOption("openai-compatible", state.activationProvider) + '>openai-compatible</option>' +
              '<option value="openrouter"' + selectedOption("openrouter", state.activationProvider) + '>openrouter</option>' +
              '<option value="anthropic"' + selectedOption("anthropic", state.activationProvider) + '>anthropic</option>' +
              '<option value="google"' + selectedOption("google", state.activationProvider) + '>google</option>' +
            '</select></label>' +
            '<label class="activation-field"><span>' + h(t("activation.model")) + '</span><input id="activationModel" data-activation-field="activationModel" value="' + h(state.activationModel) + '" autocomplete="off"></label>' +
            '<label class="activation-field"><span>' + h(t("activation.baseURL")) + '</span><input id="activationBaseURL" data-activation-field="activationBaseURL" value="' + h(state.activationBaseURL) + '" autocomplete="off"></label>' +
            '<label class="activation-field"><span>' + h(t("activation.apiKeyEnv")) + '</span><input id="activationAPIKeyEnv" data-activation-field="activationAPIKeyEnv" value="' + h(state.activationAPIKeyEnv) + '" autocomplete="off"></label>' +
            '<label class="activation-field"><span>' + h(t("activation.telegramMode")) + '</span><select id="activationTelegramMode" data-activation-field="activationTelegramMode">' +
              '<option value="polling"' + selectedOption("polling", state.activationTelegramMode) + '>polling</option>' +
              '<option value="webhook"' + selectedOption("webhook", state.activationTelegramMode) + '>webhook</option>' +
            '</select></label>' +
            '<label class="activation-field"><span>' + h(t("activation.botTokenEnv")) + '</span><input id="activationBotTokenEnv" data-activation-field="activationBotTokenEnv" value="' + h(state.activationBotTokenEnv) + '" autocomplete="off"></label>' +
            '<label class="activation-field"><span>' + h(t("activation.allowedChat")) + '</span><input id="activationAllowedChat" data-activation-field="activationAllowedChat" value="' + h(state.activationAllowedChat) + '" autocomplete="off"></label>' +
            '<label class="activation-field"><span>' + h(t("activation.webhookURL")) + '</span><input id="activationWebhookURL" data-activation-field="activationWebhookURL" value="' + h(state.activationWebhookURL) + '" autocomplete="off"></label>' +
            '<label class="activation-field"><span>' + h(t("activation.webhookSecretEnv")) + '</span><input id="activationWebhookSecretEnv" data-activation-field="activationWebhookSecretEnv" value="' + h(state.activationWebhookSecretEnv) + '" autocomplete="off"></label>' +
            '<label class="activation-field"><span>' + h(t("activation.smokeText")) + '</span><textarea id="activationSmokeText" data-activation-field="activationSmokeText">' + h(state.activationSmokeText) + '</textarea></label>' +
          '</div>' +
          '<div class="activation-actions">' +
            '<button type="button" data-action="activation-install"' + disabled + '>' + h(t("activation.install")) + '</button>' +
            '<button type="button" data-action="activation-provider"' + disabled + '>' + h(t("activation.configureProvider")) + '</button>' +
            '<button type="button" data-action="activation-telegram"' + disabled + '>' + h(t("activation.configureTelegram")) + '</button>' +
            '<button type="button" data-action="activation-status"' + statusDisabled + '>' + h(t("activation.status")) + '</button>' +
            '<button type="button" data-action="activation-smoke"' + disabled + '>' + h(t("activation.smoke")) + '</button>' +
            '<button type="button" data-action="activation-logs"' + statusDisabled + '>' + h(t("activation.logs")) + '</button>' +
            '<button type="button" data-action="activation-start"' + disabled + '>' + h(t("activation.start")) + '</button>' +
            '<button type="button" data-action="activation-restart"' + statusDisabled + '>' + h(t("activation.restart")) + '</button>' +
            '<button type="button" data-action="activation-stop"' + statusDisabled + '>' + h(t("activation.stop")) + '</button>' +
          '</div>' +
          '<div class="impact-grid">' +
            '<section class="impact-section" data-provider-status="' + h(providerStatus) + '"><strong>' + h(t("activation.provider")) + '</strong><br><span class="fine">' + h(providerStatus + (provider && provider.modelID ? " · " + provider.modelID : "")) + '</span></section>' +
            '<section class="impact-section" data-telegram-status="' + h(telegramStatus) + '"><strong>Telegram</strong><br><span class="fine">' + h(telegramStatus + (telegram && telegram.botTokenEnv ? " · " + telegram.botTokenEnv : "")) + '</span></section>' +
            '<section class="impact-section" data-gateway-status="' + h(gatewayStatus) + '"><strong>Gateway</strong><br><span class="fine">' + h(gatewayStatus + (gateway.pid ? " · pid=" + gateway.pid : "")) + '</span></section>' +
            '<section class="impact-section"><strong>' + h(t("guide.acceptance")) + '</strong><br><span class="fine">' + h(missing) + '</span></section>' +
          '</div>' +
          '<pre class="activation-log" data-gateway-logs="' + h(logs ? "ready" : "empty") + '">' + h(logs || state.activationMessage || state.activationError || t("activation.idle")) + '</pre>' +
        '</div>';
      }

      function tuiStatusLabel() {
        var compile = compileState();
        if (compile.status === "failed") return t("compile.failed");
        if (compile.status === "stale") return t("compile.stale");
        if (compile.status === "idle") return t("compile.idle");
        if (compile.status === "running") return t("compile.running");
        if (!server.online || !server.harnessTuiSessionsUrl) return t("tui.static");
        if (state.tuiBusy) return t("tui.starting");
        if (state.tuiError) return t("tui.error");
        if (state.tuiStatus === "running") return t("tui.running");
        if (state.tuiStatus === "stopped") return t("tui.stopped");
        if (state.tuiStatus === "failed") return t("tui.failed");
        return t("tui.idle");
      }

      function renderTuiPanel() {
        var session = state.tuiSession || {};
        var ready = Boolean(server.online && server.harnessTuiSessionsUrl && state.workspaceStarted);
        var hasSession = Boolean(session.sessionID);
        var busy = Boolean(state.tuiBusy);
        var compile = compileState();
        var compileReady = compile.status === "passed";
        var startDisabled = (!ready || busy || !compileReady || state.tuiStatus === "running") ? " disabled" : "";
        var sessionDisabled = (!ready || busy || !hasSession) ? " disabled" : "";
        var restartDisabled = (!ready || busy || !hasSession || !compileReady) ? " disabled" : "";
        var compileBlocked = compile.status !== "passed";
        var panelMessage = compileBlocked ? compile.message : (state.tuiError || state.tuiMessage || (hasSession ? session.sessionID : t("tui.idle")));
        var logText = state.tuiLogs || (compileBlocked ? compileLogText(compile) : "") || state.tuiError || state.tuiMessage || t("tui.logEmpty");
        var runtimeTrace = session.runtimeTraceSummary || null;
        var runtimeTraceText = runtimeTrace
          ? String(runtimeTrace.turns || 0) + " turns · " + String(runtimeTrace.events || 0) + " events" + (runtimeTrace.latestFingerprint ? " · " + runtimeTrace.latestFingerprint : "")
          : "pending";
        return '<div class="tui-panel" data-builder-tui-panel="ready" data-builder-tui-state="' + h(state.tuiStatus || "idle") + '">' +
          '<section class="impact-summary" data-builder-tui-status="' + h(state.tuiStatus || "idle") + '" data-builder-compile-status="' + h(compile.status) + '" data-severity="' + h(compile.status === "failed" || state.tuiStatus === "failed" || state.tuiError ? "error" : compile.status === "passed" && state.tuiStatus === "running" ? "ok" : "info") + '">' +
            '<strong>' + h(tuiStatusLabel()) + '</strong><br>' +
            '<span class="fine">' + h(panelMessage) + '</span>' +
          '</section>' +
          '<div class="tui-controls">' +
            '<select data-tui-field="tuiMode" data-builder-tui-session="mode">' +
              '<option value="draft-recipe"' + selectedOption("draft-recipe", state.tuiMode) + '>' + h(t("tui.draft")) + '</option>' +
              '<option value="installed-profile"' + selectedOption("installed-profile", state.tuiMode) + '>' + h(t("tui.profile")) + '</option>' +
            '</select>' +
            '<select data-tui-field="tuiProviderMode" data-builder-tui-provider="mode">' +
              '<option value="profile-live"' + selectedOption("profile-live", state.tuiProviderMode) + '>profile-live</option>' +
            '</select>' +
            '<button type="button" data-action="tui-start" data-builder-tui-start="ready"' + startDisabled + '>' + h(t("tui.start")) + '</button>' +
            '<button type="button" data-action="tui-interrupt"' + sessionDisabled + '>' + h(t("tui.interrupt")) + '</button>' +
            '<button type="button" data-action="tui-restart" data-builder-tui-restart="ready"' + restartDisabled + '>' + h(t("tui.restart")) + '</button>' +
            '<button type="button" data-action="tui-stop" data-builder-tui-stop="ready"' + sessionDisabled + '>' + h(t("tui.stop")) + '</button>' +
            '<button type="button" data-action="tui-clear">' + h(t("tui.clear")) + '</button>' +
            '<button type="button" data-action="tui-copy"' + (state.tuiTranscript ? "" : " disabled") + '>' + h(t("tui.copy")) + '</button>' +
            '<button type="button" data-action="tui-save"' + (hasSession || state.tuiTranscript ? "" : " disabled") + '>' + h(t("tui.save")) + '</button>' +
            '<button type="button" data-action="tui-logs"' + sessionDisabled + '>' + h(t("tui.logs")) + '</button>' +
            ((session.profileName || state.tuiMode === "installed-profile") ? '<button type="button" data-action="tui-profile-status">' + h(t("tui.profileStatus")) + '</button>' : '') +
          '</div>' +
          '<div id="tuiTerminalMount" class="tui-terminal" data-builder-tui-output="ready" data-builder-tui-input="ready" tabindex="0">' +
            '<pre id="tuiFallbackOutput" class="tui-fallback-output">' + h(state.tuiTranscript || "") + '</pre>' +
          '</div>' +
          '<div class="tui-bar">' +
            '<div class="tui-stat" data-builder-tui-session="' + h(session.sessionID || "none") + '"><strong>' + h(t("tui.session")) + '</strong><span class="fine">' + h(session.sessionID || "none") + '</span></div>' +
            '<div class="tui-stat"><strong>' + h(t("tui.source")) + '</strong><span class="fine">' + h(session.source || state.tuiMode) + '</span></div>' +
            '<div class="tui-stat" data-builder-tui-provider="' + h(state.tuiProviderMode) + '"><strong>' + h(t("tui.provider")) + '</strong><span class="fine">' + h(state.tuiProviderMode + (session.providerSummary && session.providerSummary.modelID ? " · " + session.providerSummary.modelID : "")) + '</span></div>' +
            '<div class="tui-stat"><strong>' + h(t("tui.storage")) + '</strong><span class="fine">' + h(session.storageDir || state.activationStorageDir || "temp") + '</span></div>' +
            '<div class="tui-stat"><strong>' + h(t("tui.recipeFingerprint")) + '</strong><span class="fine">' + h(session.recipeFingerprint || "pending") + '</span></div>' +
            '<div class="tui-stat"><strong>' + h(t("tui.bindingFingerprint")) + '</strong><span class="fine">' + h(session.bindingFingerprint || "pending") + '</span></div>' +
            '<div class="tui-stat" data-builder-tui-runtime-trace="' + h(runtimeTrace ? "ready" : "pending") + '"><strong>' + h(t("tui.runtimeTrace")) + '</strong><span class="fine">' + h(runtimeTraceText) + '</span></div>' +
            '<div class="tui-stat"><strong>' + h(t("tui.bundles")) + '</strong><span class="fine">' + h(Array.isArray(session.selectedBundles) ? session.selectedBundles.slice(0, 6).join(", ") : "pending") + '</span></div>' +
          '</div>' +
          '<pre class="tui-log" data-builder-tui-log="' + h(state.tuiLogs ? "ready" : "empty") + '">' + h(logText) + '</pre>' +
        '</div>';
      }

      function clampRightPanelWidth(value) {
        var minWidth = 330;
        var maxWidth = 640;
        var width = Number(value) || 390;
        var layout = document.getElementById("builderLayout");
        if (layout && window.innerWidth > 1180) {
          var sidePanel = document.querySelector(".side-panel");
          var sideWidth = sidePanel ? sidePanel.getBoundingClientRect().width : 320;
          var gridGaps = 27;
          var resizerWidth = 12;
          var minAssemblyWidth = 420;
          var layoutMax = layout.clientWidth - sideWidth - minAssemblyWidth - resizerWidth - gridGaps;
          maxWidth = Math.max(minWidth, Math.min(maxWidth, layoutMax));
        }
        return Math.round(Math.max(minWidth, Math.min(maxWidth, width)));
      }

      function applyRightPanelWidth() {
        state.rightPanelWidth = clampRightPanelWidth(state.rightPanelWidth);
        var layout = document.getElementById("builderLayout");
        if (layout) layout.style.setProperty("--right-panel-width", state.rightPanelWidth + "px");
        var resizer = document.getElementById("layoutColumnResizer");
        if (resizer) {
          resizer.setAttribute("aria-valuemin", "330");
          resizer.setAttribute("aria-valuenow", String(state.rightPanelWidth));
          resizer.setAttribute("aria-valuemax", String(clampRightPanelWidth(100000)));
        }
      }

      function tuiPanelRenderKey() {
        var session = state.tuiSession || {};
        var compile = compileState();
        return [
          state.tuiOpen ? "open" : "closed",
          state.rightPanelCard || "status",
          state.tuiBusy ? "busy" : "idle",
          state.tuiStatus || "idle",
          state.tuiSocketState || "closed",
          state.tuiMode || "draft-recipe",
          state.tuiProviderMode || "profile-live",
          session.sessionID || "",
          session.source || "",
          session.providerMode || "",
          session.recipeFingerprint || "",
          session.bindingFingerprint || "",
          session.runtimeTraceSummary && session.runtimeTraceSummary.latestFingerprint ? session.runtimeTraceSummary.latestFingerprint : "",
          session.runtimeTraceSummary && session.runtimeTraceSummary.events ? String(session.runtimeTraceSummary.events) : "",
          Array.isArray(session.selectedBundles) ? session.selectedBundles.join(",") : "",
          session.storageDir || "",
          state.tuiMessage || "",
          state.tuiError || "",
          state.tuiLogs ? String(state.tuiLogs.length) : "0",
          compile.status || "idle",
          compile.fingerprint || "",
          compile.message || ""
        ].join("\u001f");
      }

      function syncRightTuiCard() {
        syncCompileButton();
        applyRightPanelWidth();
        var rightStack = document.getElementById("rightStack");
        var statusCard = document.getElementById("rightStatusCard");
        var tuiCard = document.getElementById("rightTuiCard");
        var flowCard = document.getElementById("rightFlowCard");
        var panel = document.getElementById("tuiPanel");
        var badge = document.getElementById("tuiBadge");
        var flowBadge = document.getElementById("flowCardBadge");
        var activeCard = state.rightPanelCard === "tui" || state.rightPanelCard === "flow" ? state.rightPanelCard : "status";
        var shouldOpen = activeCard === "tui";
        state.tuiOpen = shouldOpen;
        state.rightPanelCard = activeCard;
        if (rightStack) rightStack.dataset.builderRightCardActive = activeCard;
        if (statusCard) {
          statusCard.hidden = activeCard !== "status";
          statusCard.dataset.builderRightCardVisible = activeCard === "status" ? "true" : "false";
        }
        if (tuiCard) {
          tuiCard.hidden = activeCard !== "tui";
          tuiCard.dataset.builderRightCardVisible = activeCard === "tui" ? "true" : "false";
          tuiCard.dataset.builderTuiDock = shouldOpen ? "open" : "closed";
        }
        if (flowCard) {
          flowCard.hidden = activeCard !== "flow";
          flowCard.dataset.builderRightCardVisible = activeCard === "flow" ? "true" : "false";
        }
        document.querySelectorAll("[data-builder-right-card-tab]").forEach(function (tab) {
          var active = tab.dataset.builderRightCardTab === activeCard;
          tab.setAttribute("aria-pressed", String(active));
        });
        if (badge) {
          badge.textContent = state.tuiStatus || "idle";
          badge.dataset.builderTuiStatus = state.tuiStatus || "idle";
        }
        if (flowBadge) {
          flowBadge.textContent = t("flow.mode." + state.flowMode);
          flowBadge.dataset.builderAssemblyFlowMode = state.flowMode;
        }
        var nextPanelKey = tuiPanelRenderKey();
        if (panel && (tuiPanelKey !== nextPanelKey || !panel.innerHTML.trim())) {
          panel.innerHTML = renderTuiPanel();
          tuiPanelKey = nextPanelKey;
        }
        if (shouldOpen) syncTuiTerminal();
        else if (tuiTerminal && tuiTerminal.dispose) {
          try { tuiTerminal.dispose(); } catch (error) {}
          tuiTerminal = null;
          tuiTerminalMount = null;
        }
      }

      function contractFingerprint(current) {
        return current && current.fingerprint ? current.fingerprint : (state.customSourceFingerprint || "custom");
      }

      function renderContractFingerprintAudit(current) {
        var fingerprint = contractFingerprint(current);
        var product = current ? current.product : state.customProduct || "custom";
        var recipeID = current ? current.recipeID : state.customRecipeID || "custom";
        return '<div class="impact-row" data-builder-contract-fingerprint="' + h(fingerprint) + '" data-builder-contract-product="' + h(product) + '">' +
          '<strong>' + h(t("audit.contractFingerprint")) + '</strong><br>' +
          '<span class="fine">' + h(fingerprint + " · " + recipeID) + '</span>' +
        '</div>';
      }

      function renderSwapImpactAudit(impact) {
        if (!impact) {
          return '<div class="impact-row" data-builder-impact="none"><strong>' + h(t("impact.none.title")) + '</strong><br><span class="fine">' + h(t("impact.none.body")) + '</span></div>';
        }
        return '<div class="impact-row" data-builder-impact="' + h(impact.portID) + '"><strong>' + h(impact.portID) + '</strong><br><span class="fine">' +
          h(impact.before + " -> " + impact.after + " · " + classificationLabel(impact.classification) + " · " + impact.safety) +
          '</span><br><span class="fine">' + h(t("impact.capabilities") + ": " + unique(impact.affectedCapabilities).join(", ")) + '</span></div>';
      }

      function renderRemoveImpactAudit() {
        if (state.removeImpactBusy) {
          return '<div class="impact-row" data-builder-remove-impact-audit="busy" data-builder-remove-impact-atom="' + h(state.removeImpactAtom) + '">' +
            '<strong>' + h(t("audit.removeImpactBusy")) + '</strong><br><span class="fine">' + h(state.removeImpactAtom) + '</span>' +
          '</div>';
        }
        if (state.removeImpactError) {
          return '<div class="impact-row" data-builder-remove-impact-audit="unavailable" data-builder-remove-impact-atom="' + h(state.removeImpactAtom) + '">' +
            '<strong>' + h(t("audit.removeImpactUnavailable")) + '</strong><br><span class="fine">' + h(state.removeImpactError) + '</span>' +
          '</div>';
        }
        var impact = state.removeImpact;
        if (!impact) {
          return '<div class="impact-row" data-builder-remove-impact-audit="empty"><strong>' + h(t("audit.removeImpact")) + '</strong><br><span class="fine">' + h(t("audit.removeImpactEmpty")) + '</span></div>';
        }
        var severityText = impact.severity === "blocked" ? t("remove.blocked") : impact.severity === "warning" ? t("remove.warning") : t("remove.safe");
        var groupLabel = impact.bundleLabel || impact.bundleID || (impact.couplingGroup ? couplingLabel(impact.couplingGroup) : t("remove.none"));
        var lostProvides = miniList((impact.lostProvides || []).slice(0, 8).map(function (portID) {
          return '<li data-builder-remove-impact-port="' + h(portID) + '">' + h(portID) + '</li>';
        }), t("remove.none"));
        var requiredBreaks = miniList((impact.requiredBreaks || []).slice(0, 8).map(function (item) {
          return '<li data-builder-remove-impact-required-port="' + h(item.portID) + '">' + h(item.portID) + '<br><span class="fine">' + h((item.candidates || []).join(", ") || t("remove.none")) + '</span></li>';
        }), t("remove.none"));
        var removedBindings = miniList((impact.removedBindings || []).slice(0, 8).map(function (binding) {
          return '<li data-builder-remove-impact-binding="' + h(binding.portID) + '">' + h(binding.portID + " -> " + binding.providerAtomID) + '</li>';
        }), t("remove.none"));
        var sharedAtoms = miniList((impact.sharedAtoms || []).slice(0, 8).map(function (atom) {
          return '<li data-builder-remove-impact-shared-atom="' + h(atom.id) + '">' + h(atom.id) + '<br><span class="fine">' + h((atom.sharedByBundles || []).join(", ") || t("remove.none")) + '</span></li>';
        }), t("remove.none"));
        return '<div class="impact-summary" data-builder-remove-impact-audit="' + h(impact.severity) + '" data-builder-remove-impact-atom="' + h(impact.atomID || state.removeImpactAtom) + '" data-severity="' + h(impact.severity) + '">' +
            '<strong>' + h(t("audit.removeImpact")) + '</strong><br>' +
            '<span class="fine">' + h((impact.atomID || state.removeImpactAtom) + " · " + groupLabel + " · " + severityText) + '</span>' +
          '</div>' +
          '<div class="impact-grid" data-builder-remove-impact-audit-detail="ready">' +
            '<section class="impact-section"><strong>' + h(t("remove.lostProvides")) + '</strong>' + lostProvides + '</section>' +
            '<section class="impact-section"><strong>' + h(t("remove.requiredBreaks")) + '</strong>' + requiredBreaks + '</section>' +
            '<section class="impact-section"><strong>' + h(t("remove.bindingBreaks")) + '</strong>' + removedBindings + '</section>' +
            '<section class="impact-section"><strong>' + h(t("remove.sharedAtoms")) + '</strong>' + sharedAtoms + '</section>' +
          '</div>';
      }

      function renderActiveAtomAudit(atom) {
        if (!atom) {
          return '<div class="impact-row" data-builder-active-atom-audit="empty"><strong>' + h(t("audit.activeAtom")) + '</strong><br><span class="fine">' + h(t("audit.activeAtomEmpty")) + '</span></div>';
        }
        var provides = (atom.provides || []).join(", ") || t("remove.none");
        var consumes = (atom.consumes || []).join(", ") || t("remove.none");
        var bundles = (atom.bundleIDs || []).join(", ") || t("remove.none");
        return '<div class="impact-row" data-builder-active-atom-audit="' + h(atom.id) + '" data-builder-implementation-level="' + h(implementationLevel(atom)) + '">' +
          '<strong>' + h(t("audit.activeAtom")) + '</strong><br>' +
          '<span class="fine">' + h(atom.id + " · " + atom.kind + " · " + atom.scope + " · " + (atom.sourcePackage || "source")) + '</span><br>' +
          '<span class="fine">' + h(implementationLabel(atom) + ": " + implementationSummary(atom)) + '</span><br>' +
          renderNativeEvidenceLine(atom, false) +
          '<span class="fine">' + h(t("audit.provides") + ": " + provides) + '</span><br>' +
          '<span class="fine">' + h(t("audit.consumes") + ": " + consumes) + '</span><br>' +
          '<span class="fine">' + h(t("bom.bundles") + ": " + bundles) + '</span>' +
        '</div>';
      }

      function renderDiagnostics(diagnostics, limit) {
        var items = typeof limit === "number" ? diagnostics.slice(0, limit) : diagnostics;
        return items.map(function (diagnostic) {
          var familyAttrs = diagnostic.id && diagnostic.id.indexOf("builder.exclusive-family.") === 0
            ? ' data-builder-family-diagnostic="' + h(diagnostic.id) + '" data-builder-family-conflict="' + h(diagnostic.familyID || (diagnostic.refs || []).join(",")) + '" data-builder-family-fix="' + h(diagnostic.fix || "") + '"'
            : "";
          var familyWinnerActions = diagnostic.familyID && diagnostic.refs && diagnostic.refs.some(function (ref) { return bundleByID.has(ref); })
            ? '<div class="diagnostic-actions">' + diagnostic.refs.filter(function (ref) { return bundleByID.has(ref); }).map(function (bundleID) {
                return '<button type="button" data-builder-family-winner="' + h(diagnostic.familyID) + '" data-builder-family-winner-bundle="' + h(bundleID) + '">' + h(bundleID) + '</button>';
              }).join("") + '</div>'
            : "";
          return '<div class="diagnostic" data-builder-diagnostic="' + h(diagnostic.id) + '"' + familyAttrs + ' data-severity="' + h(diagnostic.severity) + '">' +
            '<strong>' + h(diagnostic.id) + '</strong><br><span class="fine">' + h(diagnostic.message) + ' ' + h(t("diagnostic.fix")) + ': ' + h(diagnostic.fix) + '</span>' +
            familyWinnerActions +
          '</div>';
        }).join("");
      }

      function renderRight() {
        if (!state.workspaceStarted) {
          renderPreviewDock(null, null);
          var startServerBadge = document.getElementById("serverBadge");
          if (startServerBadge) {
            startServerBadge.textContent = server.online ? t("server.online") : t("server.static");
            startServerBadge.dataset.builderServer = server.online ? "online" : "static";
          }
          syncInspectorTabs();
          syncDetailsDrawer();
          document.getElementById("auditBadge").textContent = t("audit.badge");
          document.getElementById("previewBadge").textContent = t("preview.badgeEmpty");
          document.getElementById("activationBadge").textContent = activationStatusKind();
          syncRightTuiCard();
          document.getElementById("activeFingerprint").textContent = "start";
          document.getElementById("coverageBadge").textContent = "0/0";
          document.getElementById("selectionBadge").textContent = tx("selection.atoms", { count: 0 });
          document.getElementById("metricsBadge").textContent = "0";
          document.getElementById("readinessBadge").textContent = "start";
          document.getElementById("summaryBadge").textContent = "start";
          document.getElementById("diagnosticsBadge").textContent = "0";
          document.getElementById("metrics").innerHTML =
            '<div class="metric"><strong>0</strong><span>' + h(t("metric.atoms")) + '</span></div>' +
            '<div class="metric"><strong>0</strong><span>' + h(t("metric.coveredPorts")) + '</span></div>' +
            '<div class="metric"><strong>0</strong><span>' + h(t("metric.missingPorts")) + '</span></div>' +
            '<div class="metric"><strong>0</strong><span>' + h(t("metric.interfaces")) + '</span></div>';
          document.getElementById("validationPanel").innerHTML =
            '<div class="validation-card" data-builder-validation-status="start" data-builder-validation-next-port="" data-builder-validation-next-stage="">' +
              '<span class="validation-copy"><span class="validation-title">' + h(t("start.blueprintTitle")) + '</span><span class="fine">' + h(t("start.blueprintBody")) + '</span></span>' +
              '<span class="chip validation-action">' + h(t("start.new")) + '</span>' +
            '</div>';
          document.getElementById("detailPanel").innerHTML =
            '<section class="start-empty-blueprint" data-builder-start-blueprint="empty">' +
              '<strong>' + h(t("start.blueprintTitle")) + '</strong>' +
              '<span class="fine">' + h(t("start.blueprintBody")) + '</span>' +
            '</section>';
          var startWarningList = document.getElementById("warningList");
          startWarningList.dataset.builderCurrentAssemblyAction = "blocking-reason";
          startWarningList.dataset.builderCurrentAssemblyBlockingStatus = "start";
          startWarningList.dataset.builderCurrentAssemblyDiagnosticCount = "0";
          startWarningList.innerHTML = "";
          syncPendingChange(null, null);
          document.getElementById("activationPanel").innerHTML = renderActivationPanel();
          document.getElementById("bomBadge").textContent = "0";
          document.getElementById("bomList").innerHTML = "";
          document.getElementById("portList").innerHTML = "";
          document.getElementById("impactPanel").innerHTML = "";
          document.getElementById("diagnosticList").innerHTML = '<div class="diagnostic" data-builder-diagnostic="builder.start" data-severity="info"><strong>' + h(t("start.blueprintTitle")) + '</strong><br><span class="fine">' + h(t("start.blueprintBody")) + '</span></div>';
          document.getElementById("commandBadge").textContent = "0";
          document.getElementById("commandList").innerHTML = "";
          document.getElementById("exportText").value = JSON.stringify(exportRecipe(), null, 2);
          return;
        }
        var current = preset();
        var cov = coverage();
        var preview = bundlePreview();
        var pendingBundlePreview = state.previewPinned ? preview : null;
        var pendingBindingPreview = bindingPreview();
        renderPreviewDock(preview, pendingBindingPreview);
        var atoms = selectedAtoms();
        var validation = validationStatus(cov);
        var stages = groupPortsByStage(cov.required);
        var activeStage = activeGuideStage();
        var visibleStages = activeStage ? stages.filter(function (stage) { return stage.id === activeStage.id; }) : stages;
        var slots = requiredSlots();
        var serverBadge = document.getElementById("serverBadge");
        if (serverBadge) {
          serverBadge.textContent = server.online ? t("server.online") : t("server.static");
          serverBadge.dataset.builderServer = server.online ? "online" : "static";
        }
        syncInspectorTabs();
        syncDetailsDrawer();
        document.getElementById("auditBadge").textContent = validation.label;
        document.getElementById("previewBadge").textContent = pendingBundlePreview || pendingBindingPreview ? t("preview.badgeActive") : t("preview.badgeEmpty");
        document.getElementById("activationBadge").textContent = activationStatusKind();
        syncRightTuiCard();
        document.getElementById("activeFingerprint").textContent = current ? current.fingerprint : "custom";
        document.getElementById("coverageBadge").textContent = cov.covered.length + "/" + cov.required.length;
        document.getElementById("selectionBadge").textContent = tx("selection.atoms", { count: atoms.length });
        document.getElementById("metricsBadge").textContent = String(atoms.length);
        document.getElementById("readinessBadge").textContent = validation.status;
        document.getElementById("summaryBadge").textContent = cov.missing.length ? String(cov.missing.length) : t("validation.ready");
        document.getElementById("metrics").innerHTML =
          '<div class="metric" data-builder-current-assembly-action="metric-atoms"><strong>' + atoms.length + '</strong><span>' + h(t("metric.atoms")) + '</span></div>' +
          '<div class="metric" data-builder-current-assembly-action="metric-covered-ports"><strong>' + cov.covered.length + '</strong><span>' + h(t("metric.coveredPorts")) + '</span></div>' +
          '<div class="metric" data-builder-current-assembly-action="metric-missing-ports"><strong>' + cov.missing.length + '</strong><span>' + h(t("metric.missingPorts")) + '</span></div>' +
          '<div class="metric" data-builder-current-assembly-action="metric-interfaces"><strong>' + atoms.filter(isProductShellAtom).length + '</strong><span>' + h(t("metric.interfaces")) + '</span></div>';
        document.getElementById("validationPanel").innerHTML =
          '<div class="validation-card" data-builder-current-assembly-action="readiness" data-builder-validation-status="' + h(validation.status) + '" data-builder-validation-next-port="' + h(validation.nextPort) + '" data-builder-validation-next-stage="' + h(validation.nextStage) + '">' +
            '<span class="validation-copy"><span class="validation-title">' + h(validation.label) + '</span><span class="fine">' + h(validation.summary) + '</span></span>' +
            '<span class="chip validation-action">' + h(validation.action) + '</span>' +
          '</div>';
        document.getElementById("boardGuidePanel").innerHTML = renderGuideMarkup(stages, cov, activeStage, slots);
        function renderPortButton(portID) {
          var providers = cov.providers.get(portID) || [];
          var candidates = cov.candidates.get(portID) || [];
          var port = portByID.get(portID);
          var ambiguous = port && port.multiplicity === "single" && providers.length > 1 && !state.bindings.has(portID);
          return '<button type="button" class="port-row" data-builder-port="' + h(portID) + '" data-port-select="' + h(portID) + '" data-covered="' + String(providers.length > 0) + '" data-ambiguous="' + String(Boolean(ambiguous)) + '">' +
            '<span><strong>' + h(portID) + '</strong><br><span class="fine">' + h(providers.join(", ") || t("state.missing")) + '</span></span>' +
            '<span class="chip">' + h(candidates.length) + '</span>' +
          '</button>';
        }
        document.getElementById("portList").innerHTML = visibleStages.map(function (stage) {
          var coveredCount = stage.ports.filter(function (portID) { return (cov.providers.get(portID) || []).length > 0; }).length;
          var missingCount = stage.ports.length - coveredCount;
          return '<section class="port-stage" data-builder-port-stage="' + h(stage.id) + '" data-missing="' + String(missingCount > 0) + '">' +
            '<div class="port-stage-head"><span>' + h(stage.label) + '</span><span class="chip">' + h(coveredCount + "/" + stage.ports.length) + '</span></div>' +
            stage.ports.map(renderPortButton).join("") +
          '</section>';
        }).join("");
        var activeAtom = atomByID.get(state.activeAtom);
        var activeBundle = bundleByID.get(state.activeBundle);
        var selectedSlot = activeSlot();
        var activePort = portByID.get(state.activePort) || (selectedSlot ? portByID.get(selectedSlot.primaryPortID) : null);
        var selectedSlotInfo = selectedSlot ? slotState(selectedSlot, cov) : null;
        var activeProviders = activePort ? (cov.providers.get(activePort.id) || []) : [];
        var activeCandidateProviders = activePort ? (cov.candidates.get(activePort.id) || []) : [];
        var selectedSlotBundles = selectedSlot ? bundlesForSlot(selectedSlot, cov) : [];
        var activeDetailKind = state.activeDetailKind || (selectedSlot ? "slot" : activeBundle ? "bundle" : activeAtom ? "atom" : activePort ? "port" : "");
        var providerChoices = activePort
          ? activePort.candidates.slice(0, 12).map(function (candidate) {
              var selected = state.selected.has(candidate);
              var active = activeProviders.includes(candidate);
              var choiceHelp = providerChoiceHelp(candidate, activePort);
              return '<button type="button" class="provider-choice" data-builder-binding="candidate" data-builder-port="' + h(activePort.id) + '" data-replace-slot="' + h(selectedSlot ? selectedSlot.id : "") + '" data-bind-port="' + h(activePort.id) + '" data-bind-provider="' + h(candidate) + '" aria-pressed="' + String(active) + '">' +
                '<span><span class="explainable-title"><strong>' + h(candidate) + '</strong>' + renderInfoHelp("provider-choice-" + candidate, candidate, choiceHelp) + '</span><br><span class="fine">' + h(selected ? t("state.selectedAtom") : t("state.addAtomAndBind")) + '</span></span>' +
                '<span class="chip">' + h(active ? t("state.bound") : selected ? t("state.swap") : t("state.add")) + '</span>' +
              '</button>';
            }).join("")
          : "";
        var slotCandidates = selectedSlot
          ? selectedSlotBundles.slice(0, 8).map(function (bundle) {
              var info = bundleState(bundle);
              var tracked = info.tracked;
              var candidateHelp = candidateBundleHelp(bundle);
              return '<button type="button" class="provider-choice" data-builder-slot-candidate-bundle="' + h(selectedSlot.id) + '" data-' + (tracked ? 'remove-bundle' : 'add-bundle') + '="' + h(bundle.id) + '">' +
                '<span><span class="explainable-title"><strong>' + h(bundle.label) + '</strong>' + renderInfoHelp("slot-candidate-" + bundle.id, bundle.label, candidateHelp) + '</span><br><span class="fine">' + h(bundle.id) + '</span></span>' +
                '<span class="chip">' + h(tracked ? t("bundle.remove") : t("bundle.add")) + '</span>' +
              '</button>';
            }).join("")
          : "";
        var slotWarningDetail = selectedSlotInfo && selectedSlotInfo.warnings.length
          ? '<div class="impact-section" data-builder-slot-detail-warnings="' + h(selectedSlot.id) + '"><strong>' + h(tx("slot.warnings", { count: selectedSlotInfo.warnings.length })) + '</strong>' +
              miniList(selectedSlotInfo.warnings.map(function (warning) {
                return '<li data-builder-slot-detail-warning="' + h(warning.id) + '" data-severity="' + h(warning.severity) + '">' + h(warning.message) + '<br><span class="fine">' + h((warning.refs || []).join(", ") || t("remove.none")) + '</span></li>';
              }), t("remove.none")) +
            '</div>'
          : "";
        var detail = activeDetailKind === "slot" && selectedSlot && selectedSlotInfo
          ? '<div class="surface-row" data-builder-slot-detail="' + h(selectedSlot.id) + '"><span><span class="explainable-title"><strong>' + h(selectedSlot.label) + '</strong>' + renderInfoHelp("detail-slot-" + selectedSlot.id, selectedSlot.label, slotExplanation(selectedSlot)) + '</span><br><span class="fine">' + h(selectedSlot.primaryPortID + " · " + selectedSlot.portIDs.join(", ")) + '</span></span><span class="chip">' + h(slotStatusLabel(selectedSlotInfo.status)) + '</span></div>' +
            '<div class="surface-row"><span><strong>' + h(t("slot.boundProvider")) + '</strong><br><span class="fine">' + h(selectedSlotInfo.boundProviderAtomID || t("state.noSelectedProvider")) + '</span></span><span class="chip">' + h(tx("slot.candidates", { count: selectedSlotInfo.candidateCount })) + '</span></div>' +
            '<div class="surface-row"><span><span class="explainable-title"><strong>' + h(t("slot.replacement")) + '</strong>' + renderInfoHelp("detail-replacement-" + selectedSlot.id, t("slot.replacement"), helpCopy().actions.replace) + '</span><br><span class="fine">' + h(selectedSlotBundles.slice(0, 6).map(function (bundle) { return bundle.id; }).join(", ")) + '</span></span><span class="chip">' + h(tx("slot.candidates", { count: selectedSlotInfo.candidateCount })) + '</span></div>' +
            slotWarningDetail +
            slotCandidates +
            providerChoices
          : activeDetailKind === "bundle" && activeBundle
          ? '<div class="surface-row" data-builder-bundle-detail="' + h(activeBundle.id) + '"><span><span class="explainable-title"><strong>' + h(activeBundle.label) + '</strong>' + renderInfoHelp("detail-bundle-" + activeBundle.id, activeBundle.label, bundleExplanation(activeBundle)) + '</span><br><span class="fine">' + h(activeBundle.description) + '</span></span><span class="chip">' + h(activeBundle.productScope) + '</span></div>' +
            '<div class="surface-row"><span><strong>' + h(t("bundle.expand")) + '</strong><br><span class="fine">' + h(activeBundle.atoms.slice(0, 10).join(", ") + (activeBundle.atoms.length > 10 ? "..." : "")) + '</span></span><span class="chip">' + h(tx("bundle.atoms", { count: activeBundle.atoms.length })) + '</span></div>' +
            '<div class="surface-row"><span><strong>ports</strong><br><span class="fine">' + h(activeBundle.ports.slice(0, 10).join(", ") + (activeBundle.ports.length > 10 ? "..." : "")) + '</span></span><span class="chip">' + h(activeBundle.sourcePackage) + '</span></div>'
          : activeDetailKind === "atom" && activeAtom
            ? '<div class="surface-row" data-builder-atom="' + h(activeAtom.id) + '" data-builder-implementation-level="' + h(implementationLevel(activeAtom)) + '" data-builder-module-confirmation="' + h(moduleConfirmationStatus(activeAtom) || "untracked") + '"><span><span class="explainable-title"><strong>' + h(activeAtom.id) + '</strong>' + renderInfoHelp("detail-atom-" + activeAtom.id, activeAtom.id, atomExplanation(activeAtom)) + '</span><br><span class="fine">' + h(activeAtom.selectionReason) + '</span></span>' + renderImplementationChip(activeAtom) + renderModuleConfirmationChip(activeAtom) + '</div>' +
            '<div class="surface-row" data-builder-atom-implementation="' + h(activeAtom.id) + '" data-builder-implementation-level="' + h(implementationLevel(activeAtom)) + '"><span><strong>' + h(implementationLabel(activeAtom)) + '</strong><br><span class="fine">' + h(implementationSummary(activeAtom)) + '</span></span><span class="chip">' + h(activeAtom.scope) + '</span></div>' +
            '<div class="surface-row" data-builder-atom-evidence-detail="' + h(activeAtom.id) + '"><span><strong>Native evidence</strong>' + renderNativeEvidenceLine(activeAtom, false) + '</span><span class="chip">' + h(activeAtom.parityCoverage || implementationLevel(activeAtom)) + '</span></div>' +
            '<button type="button" class="provider-choice" data-remove-preview="' + h(activeAtom.id) + '"><span><strong>' + h(t("remove.preview")) + '</strong><br><span class="fine">' + h(activeAtom.id) + '</span></span><span class="chip">' + h(t("remove.group")) + '</span></button>'
            : activeDetailKind === "port" && activePort
              ? '<div class="surface-row" data-builder-port="' + h(activePort.id) + '"><span><span class="explainable-title"><strong>' + h(activePort.id) + '</strong>' + renderInfoHelp("detail-port-" + activePort.id, activePort.id, slotExplanation({ primaryPortID: activePort.id })) + '</span><br><span class="fine">' + h(activeCandidateProviders.join(", ") || t("state.noSelectedProvider")) + '</span></span><span class="chip">' + h(activePort.safety) + '</span></div>' + providerChoices
              : '<div class="surface-row"><span><strong>' + h(current ? current.label : "custom") + '</strong><br><span class="fine">' + h(current ? current.recipeID : "custom") + '</span></span><span class="chip">' + h(t("state.preset")) + '</span></div>';
        document.getElementById("detailPanel").innerHTML = renderCurrentAssemblySummary(current, slots, cov) + renderAtomPromotionPanel() + detail;
        syncPendingChange(pendingBundlePreview, pendingBindingPreview);
        document.getElementById("activationPanel").innerHTML = renderActivationPanel();
        document.getElementById("bomBadge").textContent = String(atoms.length);
        document.getElementById("bomList").innerHTML = renderDetailsMaterials(current, atoms);
        var diagnosticMarkup = renderDiagnostics(cov.diagnostics);
        var diagnosticSummaryMarkup = renderDiagnostics(cov.diagnostics, 3);
        var warningList = document.getElementById("warningList");
        warningList.dataset.builderCurrentAssemblyAction = "blocking-reason";
        warningList.dataset.builderCurrentAssemblyBlockingStatus = validation.status;
        warningList.dataset.builderCurrentAssemblyDiagnosticCount = String(cov.diagnostics.length);
        warningList.innerHTML = diagnosticSummaryMarkup + (cov.diagnostics.length > 3 ? renderDetailsLink("audit") : "");
        document.getElementById("diagnosticsBadge").textContent = String(cov.diagnostics.length);
        document.getElementById("diagnosticList").innerHTML = diagnosticMarkup || '<div class="diagnostic" data-builder-diagnostic="builder.ready" data-severity="info"><strong>' + h(t("validation.ready")) + '</strong><br><span class="fine">' + h(t("diagnostic.ready.message")) + '</span></div>';
        var impact = pendingBindingPreview || state.lastSwap || (activePort && activeCandidateProviders[0] ? swapImpact(activePort.id, activeCandidateProviders[0]) : null);
        document.getElementById("impactPanel").innerHTML =
          renderContractFingerprintAudit(current) +
          renderSwapImpactAudit(impact) +
          renderRemoveImpactAudit() +
          renderActiveAtomAudit(activeAtom);
        document.getElementById("commandBadge").textContent = String(builderCommands().length);
        document.getElementById("commandList").innerHTML = builderCommands().map(function (command) {
          var copyLabel = t("action.copy") + " " + command.label;
          return '<div class="command-row" data-builder-command="' + h(command.id) + '"><code>' + h(command.command) + '</code><button type="button" data-copy-command="' + h(command.id) + '" aria-label="' + h(copyLabel) + '">' + h(copyLabel) + '</button></div>';
        }).join("");
        document.getElementById("exportText").value = JSON.stringify(exportRecipe(), null, 2);
      }

      function flowProduct() {
        var current = preset();
        var selected = flowProductOptions().find(function (item) { return item.product === state.flowProductID; });
        if (selected) return selected.product;
        var product = current && current.product ? current.product : "opencode";
        if (product === "opencode" || product === "pi-mono" || product === "nanobot" || product === "hermes-agent" || product === "minimal") return product;
        return state.preset === "custom" ? "minimal" : "opencode";
      }

      function flowNativeProduct() {
        var product = flowProduct();
        return product === "minimal" ? "opencode" : product;
      }

      function flowProductLabel(product) {
        var wizard = WIZARD_PRODUCTS.find(function (item) { return item.product === product || item.id === product; });
        if (wizard) return productLabel(wizard);
        var presetItem = DATA.presets.find(function (item) { return item.product === product || item.id === product; });
        return presetItem && presetItem.label ? presetItem.label : String(product || "Harness");
      }

      function flowProductOptions() {
        var valid = new Set(["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal"]);
        var byProduct = new Map();
        (DATA.presets || []).forEach(function (item) {
          if (!item || !valid.has(item.product) || byProduct.has(item.product)) return;
          byProduct.set(item.product, {
            product: item.product,
            id: item.id,
            label: item.label || item.product
          });
        });
        return Array.from(byProduct.values());
      }

      function flowProductSelectValue() {
        return flowProductOptions().some(function (item) { return item.product === state.flowProductID; }) ? state.flowProductID : "__current";
      }

      function syncFlowProductSelect() {
        var label = document.getElementById("flowProductSelectLabel");
        if (label) label.textContent = t("flow.product.label");
        var select = document.getElementById("flowProductSelect");
        if (!select) return;
        select.title = t("flow.tooltip.product");
        var currentProduct = flowProduct();
        var currentLabel = t("flow.product.current") + " · " + flowProductLabel(currentProduct);
        var options = [{ product: "__current", label: currentLabel }].concat(flowProductOptions());
        select.innerHTML = options.map(function (item) {
          return '<option value="' + h(item.product) + '">' + h(item.label) + '</option>';
        }).join("");
        select.value = flowProductSelectValue();
        select.dataset.flowProduct = currentProduct;
        select.dataset.flowProductMode = state.flowProductID ? "override" : "current";
      }

      function setFlowProduct(product) {
        var nextProduct = product === "__current" ? "" : product;
        if (nextProduct && !flowProductOptions().some(function (item) { return item.product === nextProduct; })) return;
        if (nextProduct === state.flowProductID) return;
        state.flowProductID = nextProduct;
        state.flowArtifact = null;
        state.flowLatestRun = null;
        state.flowActiveNode = "";
        if ((state.flowMode === "native" || state.flowMode === "compare") && flowProduct() === "minimal") state.flowMode = "blueprint";
        if (state.flowMode === "blueprint") {
          renderFlowObserver();
          return;
        }
        setFlowMode(state.flowMode);
      }

      function flowBlueprint(product) {
        var base = baseFlowBlueprint(product);
        if (!state.flowProductID) {
          var draft = buildFlowDraftBlueprint(base, preset());
          if (draft) return draft;
        }
        return base;
      }

      function baseFlowBlueprint(product) {
        return (DATA.flowBlueprints || []).find(function (graph) { return graph.product === product; }) ||
          (DATA.flowBlueprints || []).find(function (graph) { return graph.product === "opencode"; }) ||
          null;
      }

      function buildFlowDraftBlueprint(base, current) {
        if (!base || !current || !state.workspaceStarted) return null;
        var draftComposition = current.id === "hybrid-mix" || current.compositionClaim === "experimental-hybrid" || state.preset === "custom" || current.compositionClaim === "custom-composition";
        if (!draftComposition) return null;
        var graph = JSON.parse(JSON.stringify(base));
        graph.product = current.product === "opencode" || current.product === "pi-mono" || current.product === "nanobot" || current.product === "hermes-agent" || current.product === "minimal" ? current.product : "custom";
        graph.recipeID = current.recipeID || state.customRecipeID || "custom.harness";
        graph.contractFingerprint = current.fingerprint || state.customSourceFingerprint || "custom";
        graph.draftBlueprint = true;
        graph.compositionClaim = current.compositionClaim || "custom-composition";
        graph.evidence = (graph.evidence || []).concat([{
          id: "builder-draft-flow:" + (current.id || "custom"),
          source: "assembled",
          kind: "contract",
          label: (current.id || "custom") + " Builder current-selection flow blueprint",
          refs: ["preset:" + (current.id || "custom"), "composition:" + graph.compositionClaim].concat((current.parityTargets || []).map(function (target) { return "parity-target:" + parityTargetRef(target); })),
          lossiness: "semantic",
          metadata: {
            presetID: current.id || "custom",
            product: current.product || "custom",
            recipeID: graph.recipeID,
            compositionClaim: graph.compositionClaim,
            parityTargetSatisfied: false
          }
        }]);
        graph.nodes = (graph.nodes || []).map(function (node) { return flowDraftNode(node, current); });
        var driftCount = graph.nodes.filter(function (node) {
          var metrics = node.metrics || {};
          return metrics.parityTargetSatisfied === false && Array.isArray(metrics.parityTargetRefs) && metrics.parityTargetRefs.length > 0;
        }).length;
        graph.summary = Object.assign({}, graph.summary || {}, {
          stages: graph.nodes.length,
          edges: Array.isArray(graph.edges) ? graph.edges.length : 0,
          observedStages: graph.nodes.filter(function (node) { return node.status === "matched" || node.status === "semantic-match"; }).length,
          inferredStages: graph.nodes.filter(function (node) { return node.status === "inferred"; }).length,
          unobservableStages: graph.nodes.filter(function (node) { return node.status === "unobservable"; }).length,
          driftCount: driftCount,
          fingerprint: flowDraftFingerprint(graph, current)
        });
        return graph;
      }

      function flowDraftNode(node, current) {
        var portIDs = Array.isArray(node.assembledPortIDs) ? node.assembledPortIDs : [];
        var bindingByPort = new Map(((current && current.bindings) || []).map(function (binding) { return [binding.portID, binding]; }));
        var bindings = portIDs.map(function (portID) { return bindingByPort.get(portID); }).filter(Boolean);
        if (!bindings.length) return node;
        var moduleClaims = bindings.map(function (binding) { return flowModuleClaimForDraftBinding(current, binding); });
        var parityTargetRefs = unique(moduleClaims.map(function (claim) { return claim.parityTargetRef || ""; }));
        var blockers = unique(moduleClaims.reduce(function (items, claim) { return items.concat(claim.blockers || []); }, []));
        var implementationLevels = unique(moduleClaims.map(function (claim) { return claim.implementationLevel; }));
        var metrics = Object.assign({}, node.metrics || {}, {
          implementationLevels: implementationLevels,
          bridgeLayers: flowBridgeLayersForDraftClaims(moduleClaims),
          moduleClaims: moduleClaims,
          parityTargetSatisfied: parityTargetRefs.length > 0 && moduleClaims.every(function (claim) { return claim.parityTargetSatisfied; }),
          parityTargetBlockers: blockers
        });
        if (parityTargetRefs.length) metrics.parityTargetRefs = parityTargetRefs;
        if (node.id === "prompt.assemble") {
          var promptClaim = moduleClaims.find(function (claim) { return (claim.portIDs || []).some(function (portID) { return portID.indexOf("prompt.") === 0; }); }) || moduleClaims[0];
          metrics.promptAtomID = promptClaim ? promptClaim.atomID : metrics.promptAtomID;
        }
        return Object.assign({}, node, {
          status: moduleClaims.some(function (claim) { return claim.parityCompatible === "blocked"; }) ? "drift" : "semantic-match",
          assembledAtomIDs: unique(bindings.map(function (binding) { return binding.providerAtomID; })),
          assembledBindingIDs: bindings.map(function (binding) { return binding.portID + "->" + binding.providerAtomID; }).sort(),
          metrics: metrics
        });
      }

      function flowModuleClaimForDraftBinding(current, binding) {
        var claim = binding.moduleClaim || moduleClaimForBinding(binding.portID, binding.providerAtomID, current.product || "custom", current.parityTargets || []);
        var compositionClaim = current.compositionClaim || "custom-composition";
        var compositionBlocker = compositionClaim === "experimental-hybrid" ? "experimental-hybrid-composition" : compositionClaim === "custom-composition" ? "custom-draft-composition" : "";
        var blockers = unique((compositionBlocker ? [compositionBlocker] : []).concat(claim.blockers || []));
        var parityCompatible = compositionBlocker && claim.parityCompatible === "satisfied" ? "partial" : claim.parityCompatible;
        return {
          atomID: binding.providerAtomID,
          portIDs: [binding.portID],
          sourceProduct: claim.sourceProduct || atomSourceProduct(binding.providerAtomID),
          sourceScope: claim.sourceScope || "unknown",
          implementationLevel: claim.level || "metadata-only",
          parityTargetProduct: claim.parityTargetProduct,
          parityTargetRef: claim.parityTargetRef,
          parityCompatible: parityCompatible,
          parityTargetSatisfied: false,
          evidenceRefs: claim.evidenceRefs || [],
          fixtureIDs: claim.fixtureIDs || [],
          knownLossiness: claim.knownLossiness || [],
          blockers: blockers,
          summary: compositionBlocker
            ? (current.id || "custom") + " " + compositionClaim + " selects " + binding.providerAtomID + " for " + binding.portID + "; " + claim.summary
            : claim.summary
        };
      }

      function flowBridgeLayersForDraftClaims(moduleClaims) {
        var buckets = new Map();
        (moduleClaims || []).forEach(function (claim) {
          var key = String(claim.sourceProduct || "unknown") + ":" + String(claim.implementationLevel || "unknown");
          var current = buckets.get(key) || { layer: claim.sourceProduct || "unknown", implementationLevel: claim.implementationLevel || "unknown", atomIDs: [] };
          current.atomIDs = unique(current.atomIDs.concat([claim.atomID]));
          buckets.set(key, current);
        });
        return Array.from(buckets.values()).sort(function (left, right) {
          return String(left.layer + ":" + left.implementationLevel).localeCompare(String(right.layer + ":" + right.implementationLevel));
        });
      }

      function flowDraftFingerprint(graph, current) {
        var text = JSON.stringify({
          product: graph.product,
          recipeID: graph.recipeID,
          presetID: current && current.id,
          compositionClaim: graph.compositionClaim,
          nodes: (graph.nodes || []).map(function (node) {
            return {
              id: node.id,
              atoms: node.assembledAtomIDs || [],
              ports: node.assembledPortIDs || [],
              claims: node.metrics && node.metrics.moduleClaims ? node.metrics.moduleClaims.map(function (claim) {
                return {
                  atomID: claim.atomID,
                  portIDs: claim.portIDs,
                  sourceProduct: claim.sourceProduct,
                  implementationLevel: claim.implementationLevel,
                  parityTargetRef: claim.parityTargetRef,
                  parityTargetSatisfied: claim.parityTargetSatisfied,
                  blockers: claim.blockers
                };
              }) : []
            };
          })
        });
        var h1 = 2166136261;
        var h2 = 16777619;
        for (var index = 0; index < text.length; index += 1) {
          var code = text.charCodeAt(index);
          h1 ^= code;
          h1 = Math.imul(h1, 16777619);
          h2 ^= code + index;
          h2 = Math.imul(h2, 2166136261);
        }
        return ("00000000" + (h1 >>> 0).toString(16)).slice(-8) + ("00000000" + (h2 >>> 0).toString(16)).slice(-8);
      }

      function flowTaskOptions() {
        var defaults = ["read-only-answer", "single-file-edit", "tool-error-retry", "context-compaction"].map(function (id) { return { id: id, products: [] }; });
        var configured = Array.isArray(DATA.flowTasks) ? DATA.flowTasks : [];
        var byID = new Map();
        defaults.concat(configured).forEach(function (task) {
          if (!task || !task.id) return;
          var existing = byID.get(task.id) || { id: String(task.id), products: [] };
          var products = Array.isArray(task.products) ? task.products.map(String) : [];
          existing.products = unique((existing.products || []).concat(products)).sort();
          byID.set(existing.id, existing);
        });
        return Array.from(byID.values());
      }

      function flowTaskID() {
        var options = flowTaskOptions();
        if (options.some(function (task) { return task.id === state.flowTaskID; })) return state.flowTaskID;
        return options[0] ? options[0].id : "read-only-answer";
      }

      function flowEvidenceSourceOptions() {
        var traceMode = state.flowMode === "trace";
        return [
          { id: "native-cadence-fixture", label: "native fixture", enabled: !traceMode },
          { id: "task-parity-report", label: "task parity", enabled: !traceMode },
          { id: "latest-assembled-run", label: "latest assembled run", enabled: traceMode },
          { id: "native-capture-artifact", label: "native artifact", enabled: !traceMode && Boolean(server.online && server.harnessFlowUrl) },
          { id: "external-capture", label: "external capture", enabled: !traceMode && Boolean(server.online && server.harnessFlowUrl) }
        ];
      }

      function flowEvidenceSourceUsesArtifact(source) {
        return source === "native-capture-artifact" || source === "external-capture";
      }

      function flowEvidenceSource() {
        var options = flowEvidenceSourceOptions();
        var current = options.find(function (item) { return item.id === state.flowEvidenceSource && item.enabled; });
        var fallback = options.find(function (item) { return item.enabled; });
        return current ? current.id : (fallback ? fallback.id : "native-cadence-fixture");
      }

      function flowEvidenceSourceLabel(source) {
        var options = flowEvidenceSourceOptions();
        var current = options.find(function (item) { return item.id === source; });
        return current ? current.label : source;
      }

      function flowNativeArtifactPath() {
        return String(state.flowNativeArtifactPath || "").trim();
      }

      function syncFlowNativeArtifactPathInput() {
        var field = document.getElementById("flowNativeArtifactPathField");
        var label = document.getElementById("flowNativeArtifactPathLabel");
        var input = document.getElementById("flowNativeArtifactPathInput");
        var source = flowEvidenceSource();
        var active = flowEvidenceSourceUsesArtifact(source) && (state.flowMode === "native" || state.flowMode === "compare");
        if (label) label.textContent = source === "external-capture" ? t("flow.evidence.externalArtifact") : t("flow.evidence.artifact");
        if (field) field.hidden = !active;
        if (!input) return;
        input.title = t("flow.tooltip.evidence");
        input.value = flowNativeArtifactPath();
        input.placeholder = source === "external-capture" ? "docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json" : "docs/reports/task-parity-native-cadence-fixtures/manifest.json";
        input.disabled = !active;
        input.dataset.flowNativeArtifactSource = active ? source : "disabled";
      }

      function setFlowNativeArtifactPath(path) {
        var next = String(path || "").trim();
        if (next === flowNativeArtifactPath()) return;
        state.flowNativeArtifactPath = next;
        state.flowArtifact = null;
        state.flowActiveNode = "";
        state.flowCache = {};
        if (flowEvidenceSourceUsesArtifact(flowEvidenceSource()) && (state.flowMode === "native" || state.flowMode === "compare")) {
          setFlowMode(state.flowMode);
          return;
        }
        renderFlowObserver();
      }

      function flowCacheKey(mode, product) {
        var source = flowEvidenceSource();
        return mode + ":" + product + ":" + flowTaskID() + ":" + source + ":" + (flowEvidenceSourceUsesArtifact(source) ? flowNativeArtifactPath() : "");
      }

      function flowRequestURL(mode, product) {
        var query = new URLSearchParams();
        var source = flowEvidenceSource();
        query.set("product", product);
        query.set("task", flowTaskID());
        query.set("source", source);
        if (flowEvidenceSourceUsesArtifact(source) && flowNativeArtifactPath()) query.set("artifact", flowNativeArtifactPath());
        return server.harnessFlowUrl + "/" + mode + "?" + query.toString();
      }

      function flowObserverWindowURL(mode) {
        var targetMode = normalizedFlowMode(mode) || state.flowMode || "blueprint";
        var product = flowProduct();
        if ((targetMode === "native" || targetMode === "compare") && product === "minimal") targetMode = "blueprint";
        var url = new URL(window.location.href);
        url.search = "";
        url.searchParams.set("flowObserver", "1");
        url.searchParams.set("flowMode", targetMode);
        url.searchParams.set("flowProduct", product);
        url.searchParams.set("flowTask", flowTaskID());
        url.searchParams.set("flowEvidenceSource", flowEvidenceSource());
        url.searchParams.set("flowCompareLayout", state.flowCompareLayout || "side-by-side");
        url.searchParams.set("flowDepth", state.flowDepthEnabled ? "depth" : "flat");
        url.searchParams.set("flowPromptDebug", state.flowPromptDebug ? "1" : "0");
        if (flowNativeArtifactPath()) url.searchParams.set("flowArtifact", flowNativeArtifactPath());
        url.hash = "";
        return url.toString();
      }

      function openFlowObserverWindow(mode) {
        var opened = window.open(
          flowObserverWindowURL(mode),
          "helix-flow-observer",
          "popup=yes,width=1480,height=960,resizable=yes,scrollbars=yes"
        );
        if (opened && opened.focus) opened.focus();
      }

      function flowArtifact() {
        if (state.flowMode === "blueprint") return flowBlueprint(flowProduct());
        if (state.flowMode === "trace") return flowGraphFromArtifact(state.flowArtifact) ? state.flowArtifact : flowBlueprint(flowProduct());
        var graph = flowGraphFromArtifact(state.flowArtifact);
        if (graph && graph.product === flowNativeProduct()) return state.flowArtifact;
        return flowBlueprint(flowProduct());
      }

      function flowGraphFromArtifact(artifact) {
        if (!artifact) return null;
        if (Array.isArray(artifact.nodes)) return artifact;
        if (artifact.graph && Array.isArray(artifact.graph.nodes)) return artifact.graph;
        if (artifact.assembled && Array.isArray(artifact.assembled.nodes)) return artifact.assembled;
        if (artifact.original && Array.isArray(artifact.original.nodes)) return artifact.original;
        return null;
      }

      function flowDiffsFromArtifact(artifact) {
        return artifact && Array.isArray(artifact.diffs) ? artifact.diffs : [];
      }

      function flowBaselineBindings() {
        var product = flowProduct();
        var base = DATA.presets.find(function (item) { return item.product === product || item.id === product; });
        return presetBindings(base || preset());
      }

      function flowDraftDiffForNode(node) {
        if (!state.workspaceStarted || !node || state.flowMode === "native" || state.flowMode === "compare") return null;
        var atomIDs = Array.isArray(node.assembledAtomIDs) ? node.assembledAtomIDs : [];
        var portIDs = Array.isArray(node.assembledPortIDs) ? node.assembledPortIDs : [];
        var baselineBindings = flowBaselineBindings();
        var missingAtoms = atomIDs.filter(function (atomID) { return !state.selected.has(atomID); });
        var changedBindings = portIDs.filter(function (portID) {
          return (state.bindings.get(portID) || "") !== (baselineBindings.get(portID) || "");
        });
        var customDraft = state.preset === "custom" && (atomIDs.some(function (atomID) { return state.selected.has(atomID); }) || portIDs.some(function (portID) { return state.bindings.has(portID); }));
        if (!missingAtoms.length && !changedBindings.length && !customDraft) return null;
        var reason = changedBindings.length
          ? "Draft binding changed: " + changedBindings.slice(0, 3).join(", ")
          : missingAtoms.length
            ? "Draft atom selection changed: " + missingAtoms.slice(0, 3).join(", ")
            : "Custom draft assembled against minimal flow baseline.";
        return {
          id: "draft.binding-preview." + node.id,
          stageID: node.id,
          status: "changed",
          category: "draft.binding-preview",
          message: reason,
          assembled: node.status,
          original: "preset-baseline",
          owningPlane: node.plane,
          candidateAtomIDs: atomIDs,
          confidence: "semantic"
        };
      }

      function flowDraftDiffs(graph) {
        if (!graph || state.flowMode === "native" || state.flowMode === "compare") return [];
        return (graph.nodes || []).map(flowDraftDiffForNode).filter(Boolean);
      }

      function flowComparisonFromArtifact(artifact) {
        if (artifact && artifact.assembled && Array.isArray(artifact.assembled.nodes) && artifact.original && Array.isArray(artifact.original.nodes)) return artifact;
        return null;
      }

      var FLOW_LANES = ["surface", "session", "prompt", "provider", "tool", "runtime"];

      function flowLaneVisible(lane) {
        return !state.flowHiddenLanes || state.flowHiddenLanes[lane] !== true;
      }

      function visibleFlowNodes(nodes) {
        return (nodes || []).filter(function (node) { return flowLaneVisible(node.lane); });
      }

      function visibleFlowDiffs(diffs, graph) {
        if (!graph || !Array.isArray(graph.nodes)) return diffs || [];
        var visibleStages = new Set(visibleFlowNodes(graph.nodes).map(function (node) { return node.id; }));
        return (diffs || []).filter(function (diff) { return visibleStages.has(diff.stageID); });
      }

      function visibleFlowLaneCount() {
        return FLOW_LANES.filter(flowLaneVisible).length;
      }

      function flowNativeEvidenceFromArtifact(artifact) {
        if (artifact && artifact.nativeEvidence && typeof artifact.nativeEvidence === "object") return artifact.nativeEvidence;
        if (artifact && artifact.graph && artifact.graph.nativeEvidence && typeof artifact.graph.nativeEvidence === "object") return artifact.graph.nativeEvidence;
        if (artifact && artifact.original && artifact.original.nativeEvidence && typeof artifact.original.nativeEvidence === "object") return artifact.original.nativeEvidence;
        return null;
      }

      function activeFlowNodeID(graph) {
        if (!graph || !Array.isArray(graph.nodes)) return "";
        if (state.flowActiveNode && graph.nodes.some(function (node) { return node.id === state.flowActiveNode && flowLaneVisible(node.lane); })) return state.flowActiveNode;
        var selectedSlot = activeSlot();
        var activePortID = state.activePort || (selectedSlot ? selectedSlot.primaryPortID : "");
        var activeAtomID = state.activeAtom || "";
        var match = visibleFlowNodes(graph.nodes).find(function (node) {
          return (activeAtomID && node.assembledAtomIDs && node.assembledAtomIDs.includes(activeAtomID)) ||
            (activePortID && node.assembledPortIDs && node.assembledPortIDs.includes(activePortID)) ||
            (selectedSlot && selectedSlot.portIDs && selectedSlot.portIDs.some(function (portID) { return node.assembledPortIDs && node.assembledPortIDs.includes(portID); }));
        });
        return match ? match.id : "";
      }

      function flowHealth(graph, diffs) {
        if (state.flowError) return "error";
        if (state.flowLoading) return "loading";
        if (state.flowMode === "trace" && !state.flowLatestRun) return "pending";
        if (flowDriftCount(diffs) > 0) return "drift";
        if (!graph) return "pending";
        return "ok";
      }

      function flowDiffIsDriftStatus(status) {
        return status === "changed" || status === "assembled-only" || status === "original-only";
      }

      function flowDriftCount(diffs) {
        return (diffs || []).filter(function (diff) {
          return flowDiffIsDriftStatus(diff.status);
        }).length;
      }

      function flowLatestFinish() {
        if (state.flowLatestRun && state.flowLatestRun.finish) return state.flowLatestRun.finish;
        if (state.runStatus === "ok") return "ok";
        if (state.runStatus === "error") return "failed";
        return "n/a";
      }

      function syncFlowStatusBar(graph, diffs) {
        var health = flowHealth(graph, diffs);
        var healthChip = document.getElementById("flowObserverHealth");
        if (healthChip) {
          healthChip.dataset.flowHealth = health;
          healthChip.textContent = t("flow.health." + health);
        }
        setText("flowObserverDrift", tx("flow.driftCount", { count: flowDriftCount(diffs) }));
        setText("flowObserverFinish", tx("flow.finish", { finish: flowLatestFinish() }));
        var pinState = document.getElementById("flowObserverPinState");
        if (pinState) {
          pinState.hidden = state.flowStandalone;
          pinState.textContent = state.flowPinned ? t("flow.pinned") : t("flow.unpinned");
        }
      }

      function renderFlowObserver() {
        var dock = document.getElementById("flowObserverDock");
        if (!dock) return;
        if (state.flowStandalone) state.flowDockState = "fullscreen";
        var product = flowProduct();
        if ((state.flowMode === "native" || state.flowMode === "compare") && product === "minimal") {
          state.flowMode = "blueprint";
          state.flowArtifact = null;
        }
        var nativeProduct = flowNativeProduct();
        var artifact = flowArtifact();
        var graph = flowGraphFromArtifact(artifact);
        var diffs = visibleFlowDiffs(flowDiffsFromArtifact(artifact).concat(flowDraftDiffs(graph)), graph);
        var isCollapsed = state.flowDockState === "collapsed";
        var canUseNativeModes = product !== "minimal";
        var showCompareLayoutControls = state.flowMode === "compare" && canUseNativeModes;
        var activeNodeID = activeFlowNodeID(graph);
        dock.dataset.flowState = state.flowDockState;
        dock.dataset.flowPinned = String(Boolean(state.flowPinned));
        dock.dataset.flowMode = state.flowMode;
        dock.dataset.flowCompareLayout = state.flowCompareLayout;
        dock.dataset.flowProduct = product;
        dock.dataset.flowProductMode = state.flowProductID ? "override" : "current";
        dock.dataset.flowDraftBlueprint = String(Boolean(graph && graph.draftBlueprint));
        dock.dataset.flowCompositionClaim = graph && graph.compositionClaim ? String(graph.compositionClaim) : "";
        dock.dataset.flowDepth = state.flowDepthEnabled ? "depth" : "flat";
        setText("flowObserverTitle", t("flow.title"));
        setText("flowObserverSummary", tx("flow.summary.collapsed", {
          product: flowProductLabel(product),
          stages: graph && graph.summary ? graph.summary.stages : 0,
          mode: state.flowMode === "compare" ? t("flow.mode." + state.flowMode) + " · " + t("flow.compareLayout." + state.flowCompareLayout) : t("flow.mode." + state.flowMode)
        }));
        syncFlowStatusBar(graph, diffs);
        var toggle = document.getElementById("flowObserverToggleButton");
        if (toggle) {
          toggle.textContent = state.flowStandalone ? t("flow.title") : (isCollapsed ? t("flow.openWindow") : t("flow.collapse"));
          toggle.setAttribute("aria-expanded", String(!isCollapsed));
        }
        var full = document.getElementById("flowObserverFullscreenButton");
        if (full) full.textContent = state.flowDockState === "fullscreen" ? t("flow.restore") : t("flow.fullscreen");
        var promptDebugButton = document.getElementById("flowPromptDebugButton");
        if (promptDebugButton) {
          promptDebugButton.textContent = state.flowPromptDebug ? t("flow.promptDebug.on") : t("flow.promptDebug.off");
          promptDebugButton.title = t("flow.tooltip.promptDebug");
          promptDebugButton.setAttribute("aria-pressed", String(Boolean(state.flowPromptDebug)));
        }
        var blueprintButton = document.getElementById("flowObserverBlueprintButton");
        if (blueprintButton) {
          blueprintButton.textContent = t("flow.blueprint");
          blueprintButton.title = t("flow.tooltip.blueprint");
          blueprintButton.setAttribute("aria-pressed", String(state.flowMode === "blueprint"));
        }
        var traceButton = document.getElementById("flowObserverTraceButton");
        if (traceButton) {
          traceButton.textContent = t("flow.trace");
          traceButton.title = t("flow.tooltip.trace");
          traceButton.setAttribute("aria-pressed", String(state.flowMode === "trace"));
        }
        var compareButton = document.getElementById("flowObserverCompareButton");
        if (compareButton) {
          compareButton.textContent = t("flow.compare");
          compareButton.hidden = !canUseNativeModes;
          compareButton.disabled = !canUseNativeModes;
          compareButton.title = t("flow.tooltip.compare");
          compareButton.setAttribute("aria-pressed", String(state.flowMode === "compare"));
        }
        var nativeButton = document.getElementById("flowObserverNativeButton");
        if (nativeButton) {
          nativeButton.textContent = t("flow.native");
          nativeButton.hidden = !canUseNativeModes;
          nativeButton.disabled = !canUseNativeModes;
          nativeButton.title = t("flow.tooltip.native");
          nativeButton.setAttribute("aria-pressed", String(state.flowMode === "native"));
        }
        syncFlowProductSelect();
        syncFlowNativeArtifactPathInput();
        var flowCardBadge = document.getElementById("flowCardBadge");
        if (flowCardBadge) {
          flowCardBadge.textContent = t("flow.mode." + state.flowMode);
          flowCardBadge.dataset.builderAssemblyFlowMode = state.flowMode;
        }
        document.querySelectorAll("[data-builder-assembly-flow-mode-button]").forEach(function (button) {
          var mode = button.dataset.builderAssemblyFlowModeButton;
          var active = mode === state.flowMode || (mode === "compare" && state.flowMode === "native");
          button.setAttribute("aria-pressed", String(active));
        });
        ["side-by-side", "overlay", "diff-table"].forEach(function (layout) {
          var button = document.querySelector('[data-action="flow-compare-layout"][data-flow-compare-layout="' + layout + '"]');
          if (!button) return;
          button.textContent = t("flow.compareLayout." + layout);
          button.hidden = !showCompareLayoutControls;
          button.disabled = !showCompareLayoutControls;
          button.title = t("flow.tooltip.compare");
          button.setAttribute("aria-pressed", String(state.flowMode === "compare" && state.flowCompareLayout === layout));
        });
        FLOW_LANES.forEach(function (lane) {
          var button = document.querySelector('[data-action="flow-lane-filter"][data-flow-lane-filter="' + lane + '"]');
          if (!button) return;
          button.textContent = t("flow.lane." + lane);
          button.setAttribute("aria-pressed", String(flowLaneVisible(lane)));
        });
        var pinButton = document.getElementById("flowObserverPinButton");
        if (pinButton) {
          pinButton.textContent = state.flowPinned ? t("flow.unpin") : t("flow.pin");
          pinButton.setAttribute("aria-pressed", String(Boolean(state.flowPinned)));
        }
        var viewport = document.getElementById("flowObserverViewport");
        var side = document.getElementById("flowObserverSide");
        if (!viewport || !side) return;
        if (isCollapsed) {
          viewport.innerHTML = "";
          side.innerHTML = "";
          return;
        }
        if (state.flowLoading) {
          viewport.innerHTML = '<div class="warning">' + h(t("flow.loading")) + '</div>';
          side.innerHTML = renderFlowSide(graph, diffs, state.flowMode === "blueprint" || state.flowMode === "trace" ? product : nativeProduct, activeNodeID);
          return;
        }
        if (state.flowError) {
          viewport.innerHTML = '<div class="warning">' + h(tx("flow.error", { message: state.flowError })) + '</div>';
          side.innerHTML = renderFlowSide(null, [], state.flowMode === "blueprint" || state.flowMode === "trace" ? product : nativeProduct, activeNodeID);
          return;
        }
        viewport.innerHTML = graph ? renderFlowViewport(artifact, graph, diffs, activeNodeID) : '<div class="warning">' + h(t("flow.side.emptyDiffs")) + '</div>';
        side.innerHTML = renderFlowSide(graph, diffs, state.flowMode === "blueprint" || state.flowMode === "trace" ? product : nativeProduct, activeNodeID);
      }

      function renderFlowViewport(artifact, graph, diffs, activeNodeID) {
        var comparison = state.flowMode === "compare" ? flowComparisonFromArtifact(artifact) : null;
        var listGraph = comparison ? comparison.assembled : graph;
        var mobileList = renderFlowMobileStageList(listGraph, diffs, activeNodeID);
        if (!comparison) return renderFlowRail(graph, diffs, activeNodeID) + mobileList;
        if (state.flowCompareLayout === "overlay") return renderFlowOverlay(comparison, diffs, activeNodeID) + mobileList;
        if (state.flowCompareLayout === "diff-table") return renderFlowDiffTable(comparison, diffs) + mobileList;
        return renderFlowSideBySide(comparison, diffs, activeNodeID) + mobileList;
      }

      function renderFlowRail(graph, diffs, activeNodeID) {
        var diffByStage = new Map((diffs || []).map(function (diff) { return [diff.stageID, diff]; }));
        var edgeByFrom = new Map((graph.edges || []).map(function (edge) { return [edge.from, edge]; }));
        var nodesByLane = new Map();
        (graph.nodes || []).forEach(function (node) {
          var laneNodes = nodesByLane.get(node.lane) || [];
          laneNodes.push(node);
          nodesByLane.set(node.lane, laneNodes);
        });
        return '<div class="flow-rail" data-flow-rail="' + h(graph.product) + '" data-flow-layout="horizontal-stage-rail" data-flow-lane-tracks="ready">' +
          FLOW_LANES.map(function (lane, index) {
            return renderFlowLaneTrack(lane, nodesByLane.get(lane) || [], diffByStage, edgeByFrom, activeNodeID, index);
          }).join("") +
        '</div>';
      }

      function renderFlowLaneTrack(lane, nodes, diffByStage, edgeByFrom, activeNodeID, index) {
        var visible = flowLaneVisible(lane);
        var laneNodes = nodes.slice().sort(function (left, right) { return left.order - right.order; });
        var driftCount = laneNodes.filter(function (node) {
          var diff = diffByStage.get(node.id);
          return diff && diff.status && diff.status !== "same";
        }).length;
        return '<section class="flow-lane-track" data-flow-lane-track="' + h(lane) + '" data-flow-lane-layout="unframed-stage-row" data-collapsed="' + String(!visible) + '" style="--lane-depth:' + String(index) + '">' +
          '<div class="flow-lane-label"><strong>' + h(t("flow.lane." + lane)) + '</strong><span class="fine">' + h(tx("flow.lane.stageCount", { count: laneNodes.length })) + '</span><span class="chip">' + h(visible ? tx("flow.lane.driftCount", { count: driftCount }) : t("flow.lane.collapsed")) + '</span></div>' +
          '<div class="flow-lane-stage-grid">' +
            (visible ? laneNodes.map(function (node) { return renderFlowNode(node, diffByStage.get(node.id), activeNodeID === node.id, true, edgeByFrom.get(node.id)); }).join("") : "") +
          '</div>' +
        '</section>';
      }

      function renderFlowMobileStageList(graph, diffs, activeNodeID) {
        if (!graph || !Array.isArray(graph.nodes)) return "";
        var diffByStage = new Map((diffs || []).map(function (diff) { return [diff.stageID, diff]; }));
        return '<div class="flow-stage-list" data-flow-mobile-stage-list="ready" data-flow-stage-list-product="' + h(graph.product || flowProduct()) + '">' +
          visibleFlowNodes(graph.nodes).slice().sort(function (left, right) { return left.order - right.order; }).map(function (node) {
            var diff = diffByStage.get(node.id);
            var status = diff ? diff.status : node.status;
            var driftNode = flowDiffIsDriftStatus(status);
            var draftChange = diff && diff.category === "draft.binding-preview";
            var assembly = flowNodeAssemblySummary(node);
            var meta = [
              t("flow.lane." + node.lane),
              status,
              draftChange ? "draft-change" : "",
              assembly.primaryAtomID ? "atom=" + assembly.primaryAtomID : "",
              assembly.primaryPortID ? "port=" + assembly.primaryPortID : "",
              node.observability && node.observability.lossiness ? node.observability.lossiness : ""
            ].filter(Boolean);
            return '<button type="button" class="flow-stage-list-row" data-flow-stage-list-row="' + h(node.id) + '" data-flow-stage-list-node="' + h(node.id) + '" data-lane="' + h(node.lane) + '" data-status="' + h(status) + '" data-active="' + String(activeNodeID === node.id) + '" data-flow-drift-node="' + String(driftNode) + '" data-flow-draft-change="' + String(Boolean(draftChange)) + '">' +
              '<span class="flow-stage-list-order">' + h(node.order) + '</span>' +
              '<span class="flow-stage-list-main"><strong>' + h(node.label) + '</strong><span class="fine">' + h(node.id) + '</span><span class="flow-stage-list-meta">' + meta.map(function (item) { return '<span class="chip">' + h(item) + '</span>'; }).join("") + '</span></span>' +
            '</button>';
          }).join("") +
        '</div>';
      }

      function renderFlowSideBySide(comparison, diffs, activeNodeID) {
        var diffByStage = new Map((diffs || []).map(function (diff) { return [diff.stageID, diff]; }));
        var originalByStage = new Map(comparison.original.nodes.map(function (node) { return [node.id, node]; }));
        return '<div class="flow-compare-side" data-flow-compare-layout="side-by-side">' +
          '<div class="flow-compare-row">' +
            '<div class="flow-compare-column-title">' + h(t("flow.compare.source.original")) + '</div>' +
            '<div class="flow-compare-column-title">stage</div>' +
            '<div class="flow-compare-column-title">' + h(t("flow.compare.source.assembled")) + '</div>' +
          '</div>' +
          visibleFlowNodes(comparison.assembled.nodes).map(function (assembledNode) {
            var originalNode = originalByStage.get(assembledNode.id) || assembledNode;
            var diff = diffByStage.get(assembledNode.id);
            return '<div class="flow-compare-row" data-flow-compare-stage="' + h(assembledNode.id) + '">' +
              renderFlowNode(originalNode, diff, activeNodeID === assembledNode.id) +
              '<div class="flow-compare-stage"><strong>' + h(assembledNode.label) + '</strong><span class="fine">' + h(assembledNode.id) + '</span><span class="chip">' + h(diff ? diff.status : "same") + '</span></div>' +
              renderFlowNode(assembledNode, diff, activeNodeID === assembledNode.id) +
            '</div>';
          }).join("") +
        '</div>';
      }

      function renderFlowOverlay(comparison, diffs, activeNodeID) {
        var diffByStage = new Map((diffs || []).map(function (diff) { return [diff.stageID, diff]; }));
        var originalByStage = new Map(comparison.original.nodes.map(function (node) { return [node.id, node]; }));
        return '<div class="flow-overlay" data-flow-compare-layout="overlay">' +
          visibleFlowNodes(comparison.assembled.nodes).map(function (assembledNode) {
            var originalNode = originalByStage.get(assembledNode.id);
            var diff = diffByStage.get(assembledNode.id);
            var status = diff ? diff.status : assembledNode.status;
            return '<button type="button" class="flow-overlay-stage" data-flow-node="' + h(assembledNode.id) + '" data-lane="' + h(assembledNode.lane) + '" data-status="' + h(status) + '" data-active="' + String(activeNodeID === assembledNode.id) + '">' +
              '<span class="chip">' + h(assembledNode.order) + '</span>' +
              '<strong>' + h(assembledNode.label) + '</strong>' +
              '<span class="fine">' + h(diff ? diff.category : assembledNode.plane) + '</span>' +
              renderFlowOverlayTrack("original", originalNode, diff) +
              renderFlowOverlayTrack("assembled", assembledNode, diff) +
            '</button>';
          }).join("") +
        '</div>';
      }

      function renderFlowOverlayTrack(source, node, diff) {
        if (!node) return '<div class="flow-overlay-track" data-source="' + h(source) + '"><strong>' + h(source) + '</strong><span class="fine">missing</span></div>';
        return '<div class="flow-overlay-track" data-source="' + h(source) + '"><strong>' + h(source) + '</strong>' +
          '<span class="fine">' + h(node.observability.visibility + " · " + node.observability.lossiness) + '</span>' +
          '<div class="flow-diff-meta">' + flowCompareNodeLabels(node, diff).slice(0, 4).map(function (item) { return '<span class="chip">' + h(item) + '</span>'; }).join("") + '</div>' +
        '</div>';
      }

      function renderFlowDiffTable(comparison, diffs) {
        var diffsByStage = new Map();
        (diffs || []).forEach(function (diff) {
          var existing = diffsByStage.get(diff.stageID) || [];
          existing.push(diff);
          diffsByStage.set(diff.stageID, existing);
        });
        var originalByStage = new Map(comparison.original.nodes.map(function (node) { return [node.id, node]; }));
        return '<div class="flow-diff-table" data-flow-compare-layout="diff-table">' +
          '<div class="flow-diff-table-row"><div class="flow-diff-table-cell">stage</div><div class="flow-diff-table-cell">status</div><div class="flow-diff-table-cell">original</div><div class="flow-diff-table-cell">assembled</div><div class="flow-diff-table-cell">diff / fix hint</div></div>' +
          visibleFlowNodes(comparison.assembled.nodes).map(function (assembledNode) {
            var originalNode = originalByStage.get(assembledNode.id);
            var stageDiffs = diffsByStage.get(assembledNode.id) || [];
            var diff = stageDiffs.find(function (item) { return flowDiffIsDriftStatus(item.status); }) || stageDiffs[0];
            var status = diff ? diff.status : "same";
            var categoryChips = stageDiffs.map(function (item) {
              return '<span class="chip" data-flow-diff-category="' + h(item.category || "stage.observability") + '">' + h(item.category || "stage.observability") + '</span>';
            }).join("");
            var hint = stageDiffs.length
              ? stageDiffs.map(function (item) { return [item.owningPlane, (item.candidateAtomIDs || [])[0], item.message].filter(Boolean).join(" · "); }).filter(Boolean).slice(0, 3).join(" / ")
              : "aligned";
            var driftProjection = flowDiffIsDriftStatus(status);
            var projection = driftProjection ? '<span class="chip" data-flow-drift-projection="' + h(assembledNode.id) + '">projected drift</span>' : "";
            return '<div class="flow-diff-table-row" data-status="' + h(status) + '" data-flow-compare-stage="' + h(assembledNode.id) + '"' + (driftProjection ? ' data-flow-drift-projection-row="' + h(assembledNode.id) + '"' : "") + '>' +
              '<div class="flow-diff-table-cell"><button type="button" data-flow-node="' + h(assembledNode.id) + '">' + h(assembledNode.id) + '</button></div>' +
              '<div class="flow-diff-table-cell"><span class="chip">' + h(status) + '</span></div>' +
              '<div class="flow-diff-table-cell">' + h(flowCompareNodeLabels(originalNode, diff).join(" · ") || "none") + '</div>' +
              '<div class="flow-diff-table-cell">' + h(flowCompareNodeLabels(assembledNode, diff).join(" · ") || "none") + '</div>' +
              '<div class="flow-diff-table-cell">' + (categoryChips ? '<div class="flow-diff-category-list">' + categoryChips + '</div>' : "") + h(hint) + (projection ? '<br>' + projection : "") + '</div>' +
            '</div>';
          }).join("") +
        '</div>';
      }

      function flowCompareNodeLabels(node, diff) {
        if (!node) return [];
        var metrics = node.metrics || {};
        var labels = [node.status, node.observability.lossiness];
        if (metrics.requestCount != null) labels.push("requests=" + metrics.requestCount);
        if (metrics.toolCount != null) labels.push("tools=" + metrics.toolCount);
        if (Array.isArray(metrics.toolSequence) && metrics.toolSequence.length) labels.push("tools=" + metrics.toolSequence.slice(0, 3).join(">"));
        if (Array.isArray(metrics.batchSignature) && metrics.batchSignature.length) labels.push("batch=" + metrics.batchSignature.slice(0, 2).join(">"));
        if (Array.isArray(metrics.partTypes) && metrics.partTypes.length) labels.push("parts=" + metrics.partTypes.slice(0, 4).join(">"));
        if (Array.isArray(metrics.traceEventSequence) && metrics.traceEventSequence.length) labels.push("events=" + metrics.traceEventSequence.slice(0, 3).join(">"));
        if (metrics.finish) labels.push("finish=" + metrics.finish);
        if (metrics.acceptedEarly != null) labels.push("early=" + String(metrics.acceptedEarly));
        if (metrics.tokenEstimate != null) labels.push("tokens=" + metrics.tokenEstimate);
        if (metrics.promptFingerprint) labels.push("fp=" + String(metrics.promptFingerprint).slice(0, 8));
        if (diff && diff.stageID === node.id && diff.category) labels.push(diff.category);
        return labels.filter(Boolean);
      }

      function flowShortID(id) {
        var value = String(id || "");
        var parts = value.split(".").filter(Boolean);
        if (parts.length <= 2) return value;
        return parts.slice(-2).join(".");
      }

      function flowNodeAssemblySummary(node) {
        var atomIDs = Array.isArray(node.assembledAtomIDs) ? node.assembledAtomIDs : [];
        var portIDs = Array.isArray(node.assembledPortIDs) ? node.assembledPortIDs : [];
        var atoms = atomIDs.map(function (atomID) { return atomByID.get(atomID); }).filter(Boolean);
        var ports = portIDs.map(function (portID) { return portByID.get(portID); }).filter(Boolean);
        var scopes = orderedUnique(atoms.map(function (atom) { return atom.scope; }));
        var replaceable = flowNodeReplaceable(node, atoms, ports);
        var labels = [];
        if (atomIDs[0]) labels.push({ kind: "atom", label: "atom=" + flowShortID(atomIDs[0]) });
        if (portIDs[0]) labels.push({ kind: "port", label: "port=" + flowShortID(portIDs[0]) });
        if (scopes[0]) labels.push({ kind: "scope", label: "scope=" + scopes.slice(0, 2).join("+") });
        if (replaceable) labels.push({ kind: "replaceable", label: "replaceable" });
        return {
          labels: labels,
          primaryAtomID: atomIDs[0] || "",
          primaryPortID: portIDs[0] || "",
          scope: scopes[0] || "",
          replaceable: replaceable,
        };
      }

      function flowNodeReplaceable(node, atoms, ports) {
        if ((atoms || []).some(function (atom) { return Array.isArray(atom.replaceablePorts) && atom.replaceablePorts.length > 0; })) return true;
        if ((ports || []).some(function (port) {
          return (Array.isArray(port.candidates) && port.candidates.length > 1) ||
            (Array.isArray(port.bundleCandidates) && port.bundleCandidates.length > 1);
        })) return true;
        return (Array.isArray(node.assembledPortIDs) ? node.assembledPortIDs : []).some(function (portID) {
          var slot = slotForPort(portID);
          if (!slot) return false;
          return unique((slot.candidateBundleIDs || []).concat(slot.candidateAtomIDs || [])).length > 1;
        });
      }

      function renderFlowNode(node, diff, active, alignToStageColumn, outboundEdge) {
        var metrics = [];
        var assembly = flowNodeAssemblySummary(node);
        if (node.id === "prompt.assemble") {
          metrics = metrics.concat(flowPromptNodeLabels(node));
        }
        if (node.assembledAtomIDs && node.assembledAtomIDs.length) metrics.push(node.assembledAtomIDs.length + " atoms");
        if (node.assembledPortIDs && node.assembledPortIDs.length) metrics.push(node.assembledPortIDs.length + " ports");
        if (node.originalEventTypes && node.originalEventTypes.length) metrics.push(node.originalEventTypes.length + " events");
        if (node.metrics && node.metrics.requestCount) metrics.push(node.metrics.requestCount + " req");
        if (node.metrics && node.metrics.toolCount) metrics.push(node.metrics.toolCount + " tools");
        if (!metrics.length && node.observability) metrics.push(node.observability.lossiness);
        var diffStatus = diff ? diff.status : node.status;
        var draftChange = diff && diff.category === "draft.binding-preview";
        if (draftChange) metrics.push("draft-change");
        var driftNode = flowDiffIsDriftStatus(diffStatus);
        var stageColumn = Math.max(1, Math.min(19, Number(node.order) || 1));
        var columnAttributes = alignToStageColumn ? ' style="grid-column:' + String(stageColumn) + '" data-flow-stage-column="' + String(stageColumn) + '"' : "";
        return '<button type="button" class="flow-node" data-flow-node="' + h(node.id) + '" data-flow-node-label-mode="summary" data-lane="' + h(node.lane) + '" data-status="' + h(diffStatus) + '" data-active="' + String(Boolean(active)) + '" data-flow-drift-node="' + String(driftNode) + '" data-flow-draft-change="' + String(Boolean(draftChange)) + '" data-flow-node-primary-atom="' + h(assembly.primaryAtomID) + '" data-flow-node-primary-port="' + h(assembly.primaryPortID) + '" data-flow-node-scope="' + h(assembly.scope) + '" data-flow-node-replaceable="' + String(assembly.replaceable) + '"' + columnAttributes + '>' +
          '<div class="flow-node-top"><span class="chip">' + h(node.order) + '</span>' + renderFlowEdgeBadge(outboundEdge) + '</div>' +
          '<strong>' + h(node.label) + '</strong>' +
          '<span class="fine">' + h(node.plane + " · " + node.observability.visibility + " · " + node.observability.lossiness) + '</span>' +
          '<div class="flow-node-assembly">' + assembly.labels.map(function (item) { return '<span class="chip" data-flow-node-assembly="' + h(item.kind) + '">' + h(item.label) + '</span>'; }).join("") + '</div>' +
          '<div class="flow-node-metrics">' + metrics.map(function (item) { return '<span class="chip">' + h(item) + '</span>'; }).join("") + '</div>' +
        '</button>';
      }

      function renderFlowEdgeBadge(edge) {
        if (!edge) return "";
        var hooks = Array.isArray(edge.hookPoints) ? edge.hookPoints : [];
        var dataKind = String(edge.dataKind || "control");
        var hookEvents = hooks.map(function (hook) { return hook.event; }).filter(Boolean).slice(0, 2).join(">");
        var title = [edge.from + " -> " + edge.to, "data=" + dataKind, "hooks=" + hooks.length, hookEvents ? "events=" + hookEvents : ""].filter(Boolean).join(" · ");
        return '<span class="flow-edge-badge" data-flow-edge-badge="ready" data-flow-edge="' + h(edge.id || "") + '" data-flow-edge-data-kind="' + h(dataKind) + '" data-flow-edge-hook-count="' + String(hooks.length) + '" title="' + h(title) + '">' +
          '<span class="chip">' + h("-> " + dataKind) + '</span>' +
          '<span class="chip">' + h("hooks=" + hooks.length) + '</span>' +
        '</span>';
      }

      function flowPromptNodeLabels(node) {
        var metrics = node.metrics || {};
        var labels = [];
        if (metrics.promptAtomID) labels.push(String(metrics.promptAtomID));
        if (metrics.sectionCount || metrics.count) labels.push(String(metrics.sectionCount || metrics.count) + " sections");
        if (metrics.resourceCount != null) labels.push(String(metrics.resourceCount) + " resources");
        if (metrics.tokenEstimate) labels.push(String(metrics.tokenEstimate) + " tokens");
        if (metrics.promptFingerprint) labels.push("fp " + String(metrics.promptFingerprint).slice(0, 8));
        if (metrics.identityStatus) labels.push(String(metrics.identityStatus));
        return labels;
      }

      function flowNodeByID(graph, id) {
        if (!graph || !Array.isArray(graph.nodes)) return null;
        return graph.nodes.find(function (node) { return node.id === id; }) || null;
      }

      function flowNodeMetrics(graph, id) {
        var node = flowNodeByID(graph, id);
        return node && node.metrics ? node.metrics : {};
      }

      function flowFirstTraceMetric(values) {
        for (var index = 0; index < values.length; index += 1) {
          var value = values[index];
          if (Array.isArray(value) && value.length) return value;
          if (value !== undefined && value !== null && value !== "") return value;
        }
        return null;
      }

      function flowFormatTraceMetric(value, fallback) {
        if (Array.isArray(value)) return value.length ? value.slice(0, 4).join(" > ") : fallback;
        if (value === undefined || value === null || value === "") return fallback;
        if (typeof value === "boolean") return value ? "yes" : "no";
        return String(value);
      }

      function flowTraceCompactionStatus(graph, latest) {
        var events = latest && Array.isArray(latest.events) ? latest.events : [];
        var compactionEvents = events.filter(function (eventName) { return String(eventName).indexOf("compact") >= 0; });
        if (compactionEvents.length) return String(compactionEvents.length) + " events";
        var promptNode = flowNodeByID(graph, "prompt.assemble");
        var evidence = promptNode ? flowPromptEvidence(graph, promptNode) : null;
        var metadata = evidence && evidence.metadata ? evidence.metadata : {};
        var sectionSources = metadata.sectionSources && typeof metadata.sectionSources === "object" ? metadata.sectionSources : null;
        if (sectionSources && Object.prototype.hasOwnProperty.call(sectionSources, "compaction")) {
          return "policy=" + String(sectionSources.compaction || "present");
        }
        var contextMetrics = flowNodeMetrics(graph, "context.build");
        if (contextMetrics.eventCount) return "context event";
        return "not triggered";
      }

      function flowTraceMetricItems(graph) {
        var latest = state.flowLatestRun || {};
        var promptMetrics = flowNodeMetrics(graph, "prompt.assemble");
        var providerMetrics = flowNodeMetrics(graph, "provider.request");
        var toolPlanMetrics = flowNodeMetrics(graph, "tool.plan");
        var toolBatchMetrics = flowNodeMetrics(graph, "tool.batch");
        var surfaceMetrics = flowNodeMetrics(graph, "surface.output");
        var promptNode = flowNodeByID(graph, "prompt.assemble");
        var promptEvidence = promptNode ? flowPromptEvidence(graph, promptNode) : null;
        var promptMetadata = promptEvidence && promptEvidence.metadata ? promptEvidence.metadata : {};
        var steps = latest.steps == null ? "?" : latest.steps;
        var attempt = latest.attempt == null ? 1 : latest.attempt;
        var providerRequests = flowFirstTraceMetric([latest.providerRequestCount, providerMetrics.requestCount]);
        var toolBatch = flowFirstTraceMetric([toolBatchMetrics.batchSignature, toolPlanMetrics.toolSequence]);
        var finish = flowFirstTraceMetric([latest.finish, surfaceMetrics.finish]);
        var tokenEstimate = flowFirstTraceMetric([promptMetrics.tokenEstimate, promptMetadata.tokenEstimate]);
        return [
          { key: "step-attempt", label: t("flow.traceMetric.stepAttempt"), value: String(steps) + " / " + String(attempt) },
          { key: "provider-requests", label: t("flow.traceMetric.providerRequests"), value: flowFormatTraceMetric(providerRequests, "n/a") },
          { key: "tool-batch", label: t("flow.traceMetric.toolBatch"), value: flowFormatTraceMetric(toolBatch, "none") },
          { key: "finish", label: t("flow.traceMetric.finish"), value: flowFormatTraceMetric(finish, "unknown") },
          { key: "token-estimate", label: t("flow.traceMetric.tokenEstimate"), value: flowFormatTraceMetric(tokenEstimate, "n/a") },
          { key: "compaction", label: t("flow.traceMetric.compaction"), value: flowTraceCompactionStatus(graph, latest) }
        ];
      }

      function renderFlowTraceMetrics(graph) {
        if (state.flowMode !== "trace" || !state.flowLatestRun || !graph) return "";
        return '<section class="flow-side-section" data-flow-trace-metrics="ready"><h3>' + h(t("flow.side.traceMetrics")) + '</h3>' +
          '<div class="flow-trace-metrics">' +
            flowTraceMetricItems(graph).map(function (item) {
              return '<div class="flow-trace-metric" data-flow-trace-metric="' + h(item.key) + '" aria-label="' + h(item.label + "=" + item.value) + '">' +
                '<strong>' + h(item.label) + '</strong><span>' + h(item.value) + '</span>' +
              '</div>';
            }).join("") +
          '</div>' +
        '</section>';
      }

      function flowStageForEvent(eventName) {
        var event = String(eventName || "");
        if (!event) return "";
        if (event === "session.created") return "session.open";
        if (event === "input") return "surface.input";
        if (event === "turn.start" || event === "turn_start") return "input.normalize";
        if (event === "message.start" || event === "message_start") return "session.user-write";
        if (event === "context" || event.indexOf("compact") >= 0) return "context.build";
        if (event === "before_agent_start" || event === "resources.discover" || event === "pre_llm_call") return "prompt.assemble";
        if (event === "provider.request.before" || event.indexOf("request") >= 0) return "provider.request";
        if (event === "message.update" || event === "message_update" || event.indexOf("delta") >= 0 || event.indexOf("chunk") >= 0) return "provider.stream";
        if (event === "tool.call" || event === "tool_call") return "tool.plan";
        if (event === "permission.ask" || event.indexOf("permission") >= 0) return "tool.permission";
        if (event.indexOf("tool.execution") === 0 || event.indexOf("tool_execution") >= 0) return "tool.execute";
        if (event === "tool.result" || event === "tool_result") return "tool.result";
        if (event.indexOf("accept") >= 0) return "acceptance.check";
        if (event === "provider.response.after" || event === "turn.end" || event === "turn_end" || event === "post_llm_call") return "loop.boundary";
        if (event === "agent.end" || event === "agent_end") return "final.summary";
        if (event === "message.end" || event === "message_end" || event === "session.updated") return "session.assistant-write";
        if (event === "session.idle" || event === "text") return "surface.output";
        return "";
      }

      function renderFlowTimelineEvent(eventName, index, activeNodeID) {
        var stageID = flowStageForEvent(eventName);
        if (!stageID) {
          return '<div class="flow-timeline-row" data-flow-timeline-event="' + h(eventName) + '"><span>' + h(String(index + 1)) + '</span><span>' + h(eventName) + '</span></div>';
        }
        return '<button type="button" class="flow-timeline-row" data-flow-timeline-event="' + h(eventName) + '" data-flow-node="' + h(stageID) + '" data-active="' + String(activeNodeID === stageID) + '">' +
          '<span>' + h(String(index + 1)) + '</span><span>' + h(eventName) + '<span class="fine">' + h(stageID) + '</span></span>' +
        '</button>';
      }

      function renderFlowSide(graph, diffs, product, activeNodeID) {
        var summary = graph && graph.summary ? graph.summary : null;
        var nativeEvidence = flowNativeEvidenceFromArtifact(state.flowArtifact);
        var evidence = graph && Array.isArray(graph.evidence) ? graph.evidence.slice(0, 6) : [];
        var activeNode = graph && activeNodeID ? graph.nodes.find(function (node) { return node.id === activeNodeID; }) : null;
        var diffRows = (diffs || []).slice(0, 8).map(function (diff) {
          var candidate = diff.candidateAtomIDs && diff.candidateAtomIDs.length ? diff.candidateAtomIDs[0] : "";
          return '<div class="flow-diff-row" data-status="' + h(diff.status) + '">' +
            '<strong>' + h(diff.stageID) + '</strong>' +
            '<div class="flow-diff-meta"><span class="chip">' + h(diff.category || "stage") + '</span><span class="chip">' + h(diff.status || "diff") + '</span>' + (candidate ? '<span class="chip">' + h(candidate) + '</span>' : '') + '</div>' +
            '<span>' + h(diff.message) + '</span>' +
          '</div>';
        }).join("");
        var traceRows = "";
        if (state.flowMode === "trace" && state.flowLatestRun) {
          traceRows = '<div class="flow-timeline-row"><span>' + h(state.flowLatestRun.runID || "run") + '</span><span>' + h(tx("flow.traceRun", { finish: state.flowLatestRun.finish || "unknown", steps: state.flowLatestRun.steps == null ? "?" : state.flowLatestRun.steps })) + '</span></div>' +
            '<span class="fine">' + h(tx("flow.traceCaptured", { events: state.flowLatestRun.eventCount || 0, observed: state.flowLatestRun.observedStages || 0 })) + '</span>' +
            '<span class="fine" data-flow-trace-source="ready">source=' + h(flowEvidenceSourceLabel(state.flowLatestRun.evidenceSource || flowEvidenceSource())) + '</span>' +
            (state.flowLatestRun.events && state.flowLatestRun.events.length
              ? state.flowLatestRun.events.slice(0, 8).map(function (eventName, index) {
                  return renderFlowTimelineEvent(eventName, index, activeNodeID);
                }).join("")
              : "");
        }
        return '<section class="flow-side-section">' +
            '<h3>' + h(t("flow.side.title")) + '</h3>' +
            '<span class="fine">' + h(flowProductLabel(product) + " · " + t("flow.mode." + state.flowMode)) + '</span>' +
            '<div class="metrics">' +
              '<div class="metric"><strong>' + h(summary ? summary.stages : 0) + '</strong><span>stages</span></div>' +
              '<div class="metric"><strong>' + h(summary ? summary.observedStages : 0) + '</strong><span>observed</span></div>' +
              '<div class="metric"><strong>' + h(summary ? summary.inferredStages : 0) + '</strong><span>inferred</span></div>' +
            '</div>' +
          '</section>' +
          '<section class="flow-side-section"><h3>' + h(t("flow.side.selected")) + '</h3>' +
            (activeNode
              ? renderFlowNodeInspector(graph, diffs, activeNode)
              : '<span class="fine">' + h(t("flow.side.noSelection")) + '</span>') +
          '</section>' +
          renderFlowTraceMetrics(graph) +
          '<section class="flow-side-section"><h3>' + h(t("flow.side.timeline")) + '</h3>' +
            (traceRows || '<span class="fine">' + h(t("flow.noTrace")) + '</span>') +
          '</section>' +
          renderFlowNativeEvidence(nativeEvidence) +
          renderFlowLossinessLegend(state.flowArtifact, graph) +
          '<section class="flow-side-section"><h3>' + h(t("flow.side.evidence")) + '</h3>' +
            (evidence.length ? evidence.map(function (item) { return '<span class="fine">' + h(item.kind + ": " + item.label) + '</span>'; }).join("") : '<span class="fine">none</span>') +
          '</section>' +
          '<section class="flow-side-section"><h3>' + h(t("flow.side.diffs")) + '</h3>' +
            (diffRows || '<span class="fine">' + h(t("flow.side.emptyDiffs")) + '</span>') +
          '</section>';
      }

      function renderFlowLossinessLegend(artifact, graph) {
        if (state.flowMode !== "native" && state.flowMode !== "compare") return "";
        var counts = flowLossinessCounts(artifact, graph);
        var items = ["lossless", "semantic", "aggregated", "inferred", "unobservable"];
        return '<section class="flow-side-section"><h3>' + h(t("flow.side.lossiness")) + '</h3>' +
          '<div class="flow-lossiness-legend">' +
            items.map(function (lossiness) {
              var count = counts[lossiness] || 0;
              return '<div class="flow-lossiness-item" data-lossiness="' + h(lossiness) + '" data-flow-lossiness-count="' + h(String(count)) + '">' +
                '<strong>' + h(lossiness) + '</strong>' +
                '<span>' + h(t("flow.lossiness." + lossiness)) + '</span>' +
                '<span class="chip">' + h(String(count)) + '</span>' +
              '</div>';
            }).join("") +
          '</div>' +
        '</section>';
      }

      function flowLossinessCounts(artifact, graph) {
        var counts = { lossless: 0, semantic: 0, aggregated: 0, inferred: 0, unobservable: 0 };
        var comparison = flowComparisonFromArtifact(artifact);
        var graphs = comparison ? [comparison.original, comparison.assembled] : graph ? [graph] : [];
        graphs.forEach(function (item) {
          visibleFlowNodes(item.nodes || []).forEach(function (node) {
            var lossiness = node && node.observability ? node.observability.lossiness : "";
            if (counts[lossiness] != null) counts[lossiness] += 1;
          });
        });
        return counts;
      }

      function renderFlowNativeEvidence(evidence) {
        if (!evidence || (state.flowMode !== "native" && state.flowMode !== "compare")) return "";
        var status = String(evidence.status || "missing");
        var projectionLossDetails = Array.isArray(evidence.projectionLossDetails) ? evidence.projectionLossDetails : [];
        var labels = [
          t("flow.nativeEvidence." + status),
          evidence.product,
          evidence.taskID,
          evidence.source
        ];
        if (evidence.artifactPath) labels.push("artifact=" + evidence.artifactPath);
        if (evidence.attachmentPath) labels.push("attachment=" + evidence.attachmentPath);
        if (evidence.sha256) labels.push("sha256=" + String(evidence.sha256).slice(0, 16));
        if (evidence.generatedAt) labels.push("generatedAt=" + evidence.generatedAt);
        if (evidence.nativeVersion) labels.push("native=" + evidence.nativeVersion);
        if (evidence.cadenceLevel) labels.push("cadence=" + evidence.cadenceLevel);
        if (evidence.providerRequests != null) labels.push("requests=" + evidence.providerRequests);
        if (Array.isArray(evidence.messagePartTypes) && evidence.messagePartTypes.length) labels.push("parts=" + evidence.messagePartTypes.slice(0, 4).join(">"));
        if (evidence.projectionLosses != null) labels.push("projectionLosses=" + evidence.projectionLosses);
        if (evidence.reportMode) labels.push("mode=" + evidence.reportMode);
        if (evidence.reportStatus) labels.push("status=" + evidence.reportStatus);
        if (evidence.runnerID) labels.push("runner=" + evidence.runnerID);
        if (evidence.sourceTool) labels.push("tool=" + evidence.sourceTool);
        if (evidence.sourceToolVersion) labels.push("toolVersion=" + evidence.sourceToolVersion);
        if (evidence.captureMode) labels.push("captureMode=" + evidence.captureMode);
        if (evidence.sourceArtifact && evidence.sourceArtifact.format) labels.push("format=" + evidence.sourceArtifact.format);
        if (evidence.lossiness && evidence.lossiness.rawProviderPayload) labels.push("providerPayload=" + evidence.lossiness.rawProviderPayload);
        if (evidence.lossiness && evidence.lossiness.nativeInternals) labels.push("nativeInternals=" + evidence.lossiness.nativeInternals);
        if (Array.isArray(evidence.verifierIssues) && evidence.verifierIssues.length) labels = labels.concat(evidence.verifierIssues.slice(0, 3));
        var projectionLossRows = projectionLossDetails.map(function (loss) {
          var field = String(loss && loss.field ? loss.field : "unknown");
          var lossiness = String(loss && loss.lossiness ? loss.lossiness : "semantic");
          var reason = String(loss && loss.reason ? loss.reason : "");
          return '<div class="flow-evidence-row" data-flow-native-projection-loss="' + h(field) + '" data-flow-native-projection-lossiness="' + h(lossiness) + '">' +
            '<strong>' + h(field + " · " + lossiness) + '</strong>' +
            '<div class="flow-diff-meta">' +
              (reason ? '<span class="chip">' + h(reason) + '</span>' : '') +
            '</div>' +
          '</div>';
        }).join("");
        var externalCaptureAttrs = evidence.source === "external-capture"
          ? ' data-flow-external-capture="' + h(evidence.sourceTool || "external") + '" data-flow-external-capture-mode="' + h(evidence.captureMode || "") + '"'
          : "";
        return '<section class="flow-side-section"><h3>' + h(t("flow.side.nativeEvidence")) + '</h3>' +
          '<div class="flow-evidence-row" data-status="' + h(status) + '" data-flow-native-evidence="' + h(status) + '" data-flow-evidence-source="' + h(evidence.source || "") + '"' + externalCaptureAttrs + '>' +
            '<strong>' + h(evidence.message || t("flow.nativeEvidence." + status)) + '</strong>' +
            '<div class="flow-diff-meta">' + labels.filter(Boolean).map(function (item) { return '<span class="chip">' + h(String(item)) + '</span>'; }).join("") + '</div>' +
          '</div>' +
          projectionLossRows +
        '</section>';
      }

      function renderFlowNodeInspector(graph, diffs, node) {
        var nodeDiffs = (diffs || []).filter(function (diff) { return diff.stageID === node.id; });
        return '<div class="flow-inspector-grid" data-flow-inspector-node="' + h(node.id) + '">' +
          renderFlowInspectorRow("stage", [node.id, node.plane, node.lane, node.status]) +
          renderFlowInspectorRow("observability", flowObservabilityLabels(node)) +
          renderFlowInspectorRow("metrics", flowMetricLabels(node.metrics)) +
          renderFlowBridgeLayerInspector(node) +
          renderFlowModuleClaimInspector(node) +
          renderFlowNativeStageInspector(node) +
          renderFlowPromptInspector(graph, node) +
          renderFlowInspectorRow("atoms", (node.assembledAtomIDs || []).slice(0, 6)) +
          renderFlowInspectorRow("ports", (node.assembledPortIDs || []).slice(0, 6)) +
          (nodeDiffs.length ? renderFlowInspectorRow("diff", nodeDiffs.slice(0, 3).map(function (diff) { return (diff.category || "diff") + " · " + (diff.candidateAtomIDs && diff.candidateAtomIDs[0] ? diff.candidateAtomIDs[0] : diff.status); })) : "") +
          renderFlowFixHintInspector(nodeDiffs, node) +
          renderFlowHookInspector(graph, node) +
          renderFlowEvidenceInspector(graph, node) +
        '</div>';
      }

      function flowObservabilityLabels(node) {
        if (!node || !node.observability) return [];
        return [
          "visibility=" + String(node.observability.visibility || "unknown"),
          "lossiness=" + String(node.observability.lossiness || "unknown"),
          "confidence=" + String(node.observability.confidence || "unknown"),
          "evidence=" + String(node.observability.evidence || "unknown")
        ];
      }

      function renderFlowBridgeLayerInspector(node) {
        var metrics = node && node.metrics ? node.metrics : {};
        var bridgeLayers = Array.isArray(metrics.bridgeLayers) ? metrics.bridgeLayers : [];
        if (!bridgeLayers.length) return "";
        return bridgeLayers.slice(0, 8).map(function (item) {
          var layer = String(item && item.layer ? item.layer : "unknown");
          var implementationLevel = String(item && item.implementationLevel ? item.implementationLevel : "unknown");
          var atomIDs = item && Array.isArray(item.atomIDs) ? item.atomIDs : [];
          var labels = [
            "stage=" + node.id,
            "layer=" + layer,
            "implementation=" + implementationLevel
          ].concat(atomIDs.slice(0, 4).map(function (atomID) { return "atom=" + atomID; }));
          return '<div class="flow-evidence-row" data-flow-bridge-layer="' + h(layer) + '" data-flow-bridge-implementation="' + h(implementationLevel) + '">' +
            '<strong>' + h("bridge layer · " + layer) + '</strong>' +
            '<div class="flow-diff-meta">' + labels.map(function (label) { return '<span class="chip">' + h(label) + '</span>'; }).join("") + '</div>' +
          '</div>';
        }).join("");
      }

      function renderFlowModuleClaimInspector(node) {
        var metrics = node && node.metrics ? node.metrics : {};
        var claims = Array.isArray(metrics.moduleClaims) ? metrics.moduleClaims : [];
        if (!claims.length) return "";
        var stageSatisfied = Boolean(metrics.parityTargetSatisfied);
        var rows = claims.slice(0, 8).map(function (claim) {
          var atomID = String(claim && claim.atomID ? claim.atomID : "unknown");
          var level = String(claim && claim.implementationLevel ? claim.implementationLevel : "unknown");
          var sourceProduct = String(claim && claim.sourceProduct ? claim.sourceProduct : "unknown");
          var parityCompatible = String(claim && claim.parityCompatible ? claim.parityCompatible : "unknown");
          var targetRef = String(claim && claim.parityTargetRef ? claim.parityTargetRef : "none");
          var satisfied = Boolean(claim && claim.parityTargetSatisfied);
          var blockers = claim && Array.isArray(claim.blockers) ? claim.blockers : [];
          var labels = [
            "stage=" + node.id,
            "atom=" + atomID,
            "source=" + sourceProduct,
            "level=" + level,
            "parity=" + parityCompatible,
            "target=" + targetRef,
            "satisfied=" + String(satisfied)
          ].concat(blockers.slice(0, 3).map(function (blocker) { return "blocker=" + blocker; }));
          return '<div class="flow-evidence-row" data-flow-module-claim="' + h(atomID) + '" data-flow-module-claim-level="' + h(level) + '" data-flow-module-claim-source-product="' + h(sourceProduct) + '" data-flow-module-claim-parity-compatible="' + h(parityCompatible) + '" data-flow-module-claim-parity-target-satisfied="' + String(satisfied) + '">' +
            '<strong>' + h("module claim · " + atomID) + '</strong>' +
            '<div class="flow-diff-meta">' + labels.map(function (label) { return '<span class="chip">' + h(label) + '</span>'; }).join("") + '</div>' +
          '</div>';
        }).join("");
        return '<section class="flow-side-section" data-flow-module-claims="' + String(claims.length) + '" data-flow-parity-target-satisfied="' + String(stageSatisfied) + '">' +
          '<h3>Module Claims</h3>' +
          rows +
        '</section>';
      }

      function renderFlowNativeStageInspector(node) {
        var comparison = flowComparisonFromArtifact(state.flowArtifact);
        if (!comparison || state.flowMode !== "compare" || !node) return "";
        var originalNode = flowNodeByID(comparison.original, node.id);
        var evidence = flowNativeEvidenceForStage(comparison.original, originalNode);
        var losses = flowNativeProjectionLossesForStage(node.id, evidence);
        var primaryLoss = losses[0] || null;
        var labels = [
          "assembled stage=" + node.id,
          originalNode ? "native stage=" + originalNode.id : "native stage=missing",
          originalNode && originalNode.observability ? "native visibility=" + originalNode.observability.visibility : "",
          originalNode && originalNode.observability ? "native lossiness=" + originalNode.observability.lossiness : "",
          evidence ? "fixture evidence=" + evidence.id : "",
          evidence && evidence.metadata && evidence.metadata.adapterID ? "adapter=" + evidence.metadata.adapterID : "",
          evidence && evidence.metadata && evidence.metadata.packageSpec ? "package=" + evidence.metadata.packageSpec : "",
          evidence && evidence.metadata && evidence.metadata.artifactPath ? "artifact=" + evidence.metadata.artifactPath : "",
          originalNode && Array.isArray(originalNode.originalEventTypes) && originalNode.originalEventTypes.length ? "events=" + originalNode.originalEventTypes.slice(0, 4).join(">") : "",
          originalNode && Array.isArray(originalNode.originalStorageRefs) && originalNode.originalStorageRefs.length ? "storage=" + originalNode.originalStorageRefs.slice(0, 4).join(">") : "",
        ].filter(Boolean);
        var lossChips = losses.map(function (loss) {
          var field = String(loss && loss.field ? loss.field : "unknown");
          var lossiness = String(loss && loss.lossiness ? loss.lossiness : "semantic");
          var reason = String(loss && loss.reason ? loss.reason : "");
          return '<span class="chip" data-flow-native-stage-loss="' + h(field) + '" data-flow-native-stage-lossiness="' + h(lossiness) + '" title="' + h(reason) + '">' +
            h(field + "=" + lossiness) +
          '</span>';
        }).join("");
        return '<div class="flow-evidence-row" data-flow-native-stage="' + h(node.id) + '"' +
            (evidence ? ' data-flow-native-stage-evidence="' + h(evidence.id) + '"' : "") +
            (primaryLoss ? ' data-flow-native-stage-lossiness="' + h(String(primaryLoss.lossiness || "semantic")) + '"' : "") +
          '>' +
          '<strong>' + h("native stage evidence") + '</strong>' +
          '<div class="flow-diff-meta">' +
            labels.map(function (label) { return '<span class="chip">' + h(label) + '</span>'; }).join("") +
            lossChips +
          '</div>' +
        '</div>';
      }

      function flowNativeEvidenceForStage(originalGraph, originalNode) {
        if (!originalGraph || !Array.isArray(originalGraph.evidence)) return null;
        var refs = originalNode && Array.isArray(originalNode.originalEvidenceRefs) ? originalNode.originalEvidenceRefs : [];
        return originalGraph.evidence.find(function (item) {
          return item && item.kind === "native-cadence" && refs.includes(item.id);
        }) || originalGraph.evidence.find(function (item) {
          return item && item.kind === "native-cadence";
        }) || null;
      }

      function flowNativeProjectionLossesForStage(stageID, evidence) {
        if (!evidence || !evidence.metadata || !Array.isArray(evidence.metadata.projectionLossDetails)) return [];
        var fields = flowNativeProjectionFieldsForStage(stageID);
        if (!fields.length) return [];
        return evidence.metadata.projectionLossDetails.filter(function (loss) {
          return loss && fields.includes(String(loss.field || ""));
        });
      }

      function flowNativeProjectionFieldsForStage(stageID) {
        if (stageID === "provider.request" || stageID === "loop.boundary") return ["providerBoundary"];
        if (stageID === "provider.stream" || stageID === "stream.project") return ["streamDelta"];
        if (stageID === "tool.plan" || stageID === "tool.batch" || stageID === "tool.execute" || stageID === "tool.result") return ["toolLifecycle"];
        if (stageID === "session.user-write" || stageID === "session.assistant-write" || stageID === "surface.output") return ["messageWrite"];
        if (stageID === "acceptance.check") return ["acceptance"];
        if (stageID === "surface.input" || stageID === "session.open" || stageID === "context.build") return ["workspace"];
        return [];
      }

      function renderFlowFixHintInspector(nodeDiffs, node) {
        var diffs = (nodeDiffs || []).filter(function (diff) { return diff && diff.status && diff.status !== "same"; });
        if (!diffs.length) return "";
        return diffs.slice(0, 3).map(function (diff) {
          var candidate = flowFixCandidateAtom(diff, node);
          var labels = [
            "stage=" + (diff.stageID || node.id),
            "status=" + (diff.status || "diff"),
            "category=" + (diff.category || "stage.observability"),
            "owning plane=" + (diff.owningPlane || node.plane || "unknown"),
            "candidate atom=" + (candidate || "none"),
            "confidence=" + (diff.confidence || "inferred")
          ];
          return '<div class="flow-fix-hint-row" data-flow-fix-hint="ready" data-status="' + h(diff.status || "diff") + '">' +
            '<strong>fix hint</strong>' +
            '<span>' + h(flowFixHintMessage(diff, candidate)) + '</span>' +
            '<div class="flow-diff-meta">' +
              labels.map(function (label) { return '<span class="chip">' + h(label) + '</span>'; }).join("") +
              '<a class="chip" href="../../TODO/TODO-025.md" target="_blank" rel="noreferrer" data-flow-fix-todo="TODO-025">TODO-025</a>' +
            '</div>' +
          '</div>';
        }).join("");
      }

      function flowFixCandidateAtom(diff, node) {
        if (diff && Array.isArray(diff.candidateAtomIDs) && diff.candidateAtomIDs.length) return diff.candidateAtomIDs[0];
        if (node && Array.isArray(node.assembledAtomIDs) && node.assembledAtomIDs.length) return node.assembledAtomIDs[0];
        return "";
      }

      function flowFixHintMessage(diff, candidate) {
        var target = diff && diff.owningPlane ? String(diff.owningPlane) : "native evidence";
        var atom = candidate ? " via " + candidate : "";
        var message = diff && diff.message ? String(diff.message) : "Review this stage difference.";
        return target + atom + ": " + message;
      }

      function renderFlowInspectorRow(label, values) {
        var list = (values || []).filter(Boolean);
        return '<div class="flow-inspector-row"><strong>' + h(label) + '</strong>' +
          (list.length
            ? '<div class="flow-diff-meta">' + list.map(function (item) { return '<span class="chip">' + h(String(item)) + '</span>'; }).join("") + '</div>'
            : '<span class="fine">none</span>') +
        '</div>';
      }

      function flowMetricLabels(metrics) {
        if (!metrics) return [];
        return Object.keys(metrics).slice(0, 10).map(function (key) {
          var value = metrics[key];
          if (key === "bridgeLayers" && Array.isArray(value)) return key + "=" + String(value.length);
          if (Array.isArray(value)) {
            if (value.some(function (item) { return item && typeof item === "object"; })) return key + "=" + String(value.length);
            return key + "=" + value.slice(0, 4).join(">");
          }
          return key + "=" + String(value);
        });
      }

      function renderFlowPromptInspector(graph, node) {
        if (!node || node.id !== "prompt.assemble") return "";
        var metrics = node.metrics || {};
        var promptAtom = flowPromptAtom(node);
        var evidence = flowPromptEvidence(graph, node);
        var metadata = evidence && evidence.metadata ? evidence.metadata : {};
        var identity = flowPromptIdentityLabels(promptAtom, metrics);
        var artifact = [];
        var sections = Array.isArray(metadata.sections) ? metadata.sections : [];
        if (metrics.promptFingerprint || metadata.promptFingerprint) artifact.push("fingerprint=" + String(metrics.promptFingerprint || metadata.promptFingerprint));
        if (sections.length) artifact.push("sections=" + sections.length);
        if (metrics.resourceCount != null || metadata.resourceCount != null) artifact.push("resources=" + String(metrics.resourceCount != null ? metrics.resourceCount : metadata.resourceCount));
        if (metrics.tokenEstimate || metadata.tokenEstimate) artifact.push("tokens=" + String(metrics.tokenEstimate || metadata.tokenEstimate));
        if (metadata.artifactHash) artifact.push("hash=" + String(metadata.artifactHash));
        if (metadata.captureMode) artifact.push("capture=" + String(metadata.captureMode));
        return renderFlowInspectorRow("prompt atom", [promptAtom ? promptAtom.id : metrics.promptAtomID, promptAtom ? implementationLevel(promptAtom) : metrics.identityStatus]) +
          renderFlowInspectorRow("prompt identity", identity) +
          renderFlowInspectorRow("prompt artifact", artifact) +
          renderFlowPromptComparison(graph, node, metadata, metrics);
      }

      function renderFlowPromptComparison(graph, node, metadata, metrics) {
        if (!node || node.id !== "prompt.assemble") return "";
        var comparison = flowComparisonFromArtifact(state.flowArtifact);
        if (!comparison && state.flowMode !== "native") return "";
        var assembledGraph = comparison ? comparison.assembled : (graph && graph.source === "assembled" ? graph : null);
        var originalGraph = comparison ? comparison.original : (graph && graph.source === "original" ? graph : null);
        var assembledNode = assembledGraph ? flowNodeByID(assembledGraph, "prompt.assemble") : (graph && graph.source === "assembled" ? node : null);
        var originalNode = originalGraph ? flowNodeByID(originalGraph, "prompt.assemble") : (graph && graph.source === "original" ? node : null);
        var assembledEvidence = assembledGraph && assembledNode ? flowPromptEvidence(assembledGraph, assembledNode) : null;
        var originalEvidence = originalGraph && originalNode ? flowPromptEvidence(originalGraph, originalNode) : null;
        var assembledMetadata = assembledEvidence && assembledEvidence.metadata ? assembledEvidence.metadata : (metadata || {});
        var originalMetadata = originalEvidence && originalEvidence.metadata ? originalEvidence.metadata : {};
        var assembledMetrics = assembledNode && assembledNode.metrics ? assembledNode.metrics : (metrics || {});
        var originalMetrics = originalNode && originalNode.metrics ? originalNode.metrics : {};
        var assembledFingerprint = String(assembledMetadata.promptFingerprint || assembledMetrics.promptFingerprint || "");
        var originalFingerprint = String(originalMetadata.promptFingerprint || originalMetrics.promptFingerprint || "");
        var originalEvents = originalNode && Array.isArray(originalNode.originalEventTypes) ? originalNode.originalEventTypes : [];
        var originalObserved = Boolean(originalFingerprint || originalEvents.length || (originalNode && originalNode.observability && originalNode.observability.visibility && originalNode.observability.visibility !== "none"));
        var status = "missing";
        if (assembledFingerprint && originalFingerprint) status = assembledFingerprint === originalFingerprint ? "fingerprint-match" : "fingerprint-mismatch";
        else if (originalObserved) status = "native-event-only";
        var labels = [];
        if (assembledFingerprint) labels.push("assembled fingerprint=" + assembledFingerprint);
        if (assembledMetadata.sections && Array.isArray(assembledMetadata.sections)) labels.push("assembled sections=" + assembledMetadata.sections.length);
        if (assembledMetadata.identityStatus || assembledMetrics.identityStatus) labels.push("assembled identity=" + String(assembledMetadata.identityStatus || assembledMetrics.identityStatus));
        if (originalFingerprint) labels.push("original fingerprint=" + originalFingerprint);
        if (originalEvents.length) labels.push("original events=" + originalEvents.slice(0, 4).join(">"));
        if (originalNode && originalNode.observability) labels.push("original lossiness=" + String(originalNode.observability.lossiness || "unknown"));
        if (originalNode && originalNode.observability) labels.push("original evidence=" + String(originalNode.observability.evidence || "unknown"));
        if (!originalFingerprint) labels.push("original prompt artifact=missing");
        labels.push("not parity gate");
        var message = "Original prompt fixture is missing; compare uses the assembled sanitized artifact plus native observability only.";
        if (status === "fingerprint-match") message = "Original and assembled prompt artifacts expose the same sanitized fingerprint.";
        if (status === "fingerprint-mismatch") message = "Original and assembled prompt artifact fingerprints differ; inspect section/source summaries.";
        if (status === "native-event-only") message = "Original native flow exposes prompt-stage events but no prompt artifact, so text-level diff is unavailable.";
        return '<div class="flow-prompt-diff-row" data-flow-prompt-diff="' + h(status) + '">' +
          '<strong>prompt comparison</strong>' +
          '<span>' + h(message) + '</span>' +
          '<div class="flow-diff-meta">' + labels.map(function (label) { return '<span class="chip">' + h(label) + '</span>'; }).join("") + '</div>' +
        '</div>';
      }

      function flowNodeByID(graph, nodeID) {
        if (!graph || !Array.isArray(graph.nodes)) return null;
        return graph.nodes.find(function (item) { return item.id === nodeID; }) || null;
      }

      function flowPromptAtom(node) {
        var atomIDs = node && Array.isArray(node.assembledAtomIDs) ? node.assembledAtomIDs : [];
        var atoms = atomIDs.map(function (atomID) { return atomByID.get(atomID); }).filter(Boolean);
        return atoms.find(function (atom) { return atom.provides && atom.provides.includes("prompt.system-builder"); }) ||
          atoms.find(function (atom) { return atom.id && atom.id.indexOf(".prompt.") >= 0 && atom.kind && atom.kind.indexOf("builder") >= 0; }) ||
          atoms.find(function (atom) { return atom.id && atom.id.indexOf("prompt") >= 0; }) ||
          null;
      }

      function flowPromptEvidence(graph, node) {
        if (!graph || !Array.isArray(graph.evidence)) return null;
        return graph.evidence.find(function (item) {
          var metadata = item && item.metadata ? item.metadata : {};
          return metadata.stageID === node.id && metadata.promptFingerprint;
        }) || null;
      }

      function flowPromptIdentityLabels(atom, metrics) {
        var labels = [];
        if (metrics && metrics.identityStatus) labels.push("identity=" + String(metrics.identityStatus));
        if (!atom) {
          labels.push("missing-evidence");
          labels.push("TODO-024");
          return labels;
        }
        if (promptIdentityHasPlaceholder(atom)) {
          labels.push("placeholder-risk");
          labels.push("TODO-024");
          return labels;
        }
        if (promptIdentityNeedsOriginalSnapshot(atom)) {
          labels.push("needs-original-snapshot");
          labels.push("TODO-024");
          return labels;
        }
        if (promptIdentityIsPartiallySynced(atom)) {
          labels.push("partial-sync");
          labels.push("TODO-024");
          return labels;
        }
        if (!labels.length) labels.push("native-like");
        return labels;
      }

      function renderFlowHookInspector(graph, node) {
        if (!graph || !Array.isArray(graph.edges)) return "";
        var edges = graph.edges.filter(function (edge) { return edge.from === node.id || edge.to === node.id; }).slice(0, 4);
        if (!edges.length) return "";
        return edges.map(function (edge) {
          return renderFlowEdgeDetail(graph, edge);
        }).join("");
      }

      function renderFlowEdgeDetail(graph, edge) {
        var hooks = Array.isArray(edge.hookPoints) ? edge.hookPoints : [];
        var chain = flowHookChainSummary(hooks);
        var edgeLabels = [
          "data=" + String(edge.dataKind || "control"),
          "payload fingerprint=" + String(edge.payloadFingerprint || "no-fingerprint"),
          "diff=" + String(edge.diffStatus || "same"),
          "hook chain=" + String(hooks.length),
          "canTransform=" + String(chain.canTransform),
          "permission=" + String(chain.hasPermission),
          "earlyStop=" + chain.earlyStop,
        ];
        return '<div class="flow-hook-row" data-flow-edge-detail="ready" data-flow-edge="' + h(edge.id) + '"><strong>' + h("edge detail · " + edge.from + " -> " + edge.to) + '</strong>' +
          '<div class="flow-diff-meta">' + edgeLabels.map(function (label) { return '<span class="chip">' + h(label) + '</span>'; }).join("") + '</div>' +
          (hooks.length ? '<div class="flow-hook-chain">' + hooks.map(function (hook, index) { return renderFlowHookPoint(graph, hook, index); }).join("") + '</div>' : '<span class="fine">no hook boundary</span>') +
        '</div>';
      }

      function flowHookChainSummary(hooks) {
        var capabilities = hooks.flatMap(function (hook) { return Array.isArray(hook.capabilities) ? hook.capabilities : []; });
        var canTransform = capabilities.includes("transform");
        var hasPermission = capabilities.includes("permission");
        var earlyStop = capabilities.includes("block") ? "block/deny" : capabilities.includes("handle") ? "handled/cancel" : "none";
        return { canTransform: canTransform, hasPermission: hasPermission, earlyStop: earlyStop };
      }

      function renderFlowHookPoint(graph, hook, index) {
        var sources = Array.isArray(hook.sources) ? hook.sources : [];
        var capabilities = Array.isArray(hook.capabilities) ? hook.capabilities : [];
        var resultType = flowHookResultType(capabilities);
        var labels = [
          "event=" + String(hook.event || "hook"),
          "observer count=" + String(hook.observerCount || 0),
          "handler count=" + String(hook.handlerCount || 0),
          "source count=" + String(hook.sourceCount || sources.length || 0),
          "result=" + resultType,
          "payload changed=" + String(capabilities.includes("transform")),
          "early stop=" + String(capabilities.includes("block") || capabilities.includes("handle") || capabilities.includes("permission")),
          hook.observability ? "lossiness=" + hook.observability.lossiness : "",
        ].filter(Boolean);
        return '<div class="flow-hook-point" data-flow-hook="' + h(hook.event || "hook") + '" data-can-transform="' + String(capabilities.includes("transform")) + '" data-can-block="' + String(capabilities.includes("block") || capabilities.includes("permission")) + '" data-result-type="' + h(resultType) + '">' +
          '<strong>' + h(String(index + 1) + ". " + String(hook.event || "hook")) + '</strong>' +
          '<div class="flow-diff-meta">' + labels.map(function (label) { return '<span class="chip">' + h(label) + '</span>'; }).join("") + capabilities.map(function (capability) { return '<span class="chip">' + h("can " + capability) + '</span>'; }).join("") + '</div>' +
          (sources.length
            ? sources.slice(0, 4).map(function (source) { return renderFlowHookSource(graph, source); }).join("")
            : hook.observability && hook.observability.lossiness === "unobservable"
              ? '<span class="fine" data-flow-hook-boundary="unobservable">hook boundary unobservable · no native event tap</span>'
              : '<span class="fine" data-flow-hook-boundary="event-tap">event tap only · handler chain not observable</span>') +
        '</div>';
      }

      function flowHookResultType(capabilities) {
        if (capabilities.includes("permission")) return "allow/deny/ask";
        if (capabilities.includes("block")) return "continue/block";
        if (capabilities.includes("handle")) return "continue/handled/cancel";
        if (capabilities.includes("transform")) return "continue/transform";
        if (capabilities.includes("cleanup")) return "cleanup";
        return "observe";
      }

      function renderFlowHookSource(graph, source) {
        var adapter = flowHookSourceAdapter(graph, source);
        var adapterKind = String(source.adapterKind || "hook-source");
        var fields = [
          "source order=" + String(source.order || "?"),
          "source id=" + String(source.id || "source"),
          "name=" + String(source.name || source.id || "source"),
          "path=" + String(source.source || "unknown"),
          "scope=" + String(source.scope || "scope"),
          "adapter kind=" + adapterKind,
          "adapter=" + adapter,
        ];
        return '<div class="flow-hook-source" data-flow-hook-source="' + h(String(source.id || "source")) + '" data-flow-hook-adapter-kind="' + h(adapterKind) + '" data-flow-hook-adapter-source="' + h(adapter) + '">' +
          fields.map(function (field) { return '<span>' + h(field) + '</span>'; }).join("") +
        '</div>';
      }

      function flowHookSourceAdapter(graph, source) {
        if (source && source.adapterSource) return String(source.adapterSource);
        var scope = String(source && source.scope ? source.scope : "");
        if (scope.indexOf("native") >= 0) return String(graph && graph.product ? graph.product : "native") + " native event tap";
        if (scope.indexOf("assembled") >= 0) return String(graph && graph.product ? graph.product : "assembled") + " assembled hook host";
        return String(graph && graph.product ? graph.product : "product") + " hook source";
      }

      function renderFlowEvidenceInspector(graph, node) {
        if (!graph || !Array.isArray(graph.evidence)) return "";
        var evidence = graph.evidence.filter(function (item) {
          var metadata = item && item.metadata ? item.metadata : {};
          return metadata.stageID === node.id ||
            (node.originalEvidenceRefs || []).includes(item.id) ||
            (node.bindingIDs || []).some(function (bindingID) { return item.id === "binding." + bindingID; });
        }).sort(function (left, right) {
          var leftStage = left.metadata && left.metadata.stageID === node.id ? 0 : 1;
          var rightStage = right.metadata && right.metadata.stageID === node.id ? 0 : 1;
          if (leftStage !== rightStage) return leftStage - rightStage;
          if (left.kind !== right.kind) return left.kind === "event" ? -1 : right.kind === "event" ? 1 : left.kind.localeCompare(right.kind);
          return left.id.localeCompare(right.id);
        }).slice(0, 4);
        if (!evidence.length) return "";
        return evidence.map(function (item) {
          var metadata = item.metadata || {};
          var fields = [item.kind, item.lossiness];
          if (metadata.artifactKind) fields.push(String(metadata.artifactKind));
          if (metadata.promptAtomID) fields.push("atom=" + metadata.promptAtomID);
          if (metadata.identityStatus) fields.push("identity=" + metadata.identityStatus);
          if (metadata.promptFingerprint) fields.push("fingerprint=" + metadata.promptFingerprint);
          if (metadata.tokenEstimate) fields.push("tokens=" + metadata.tokenEstimate);
          if (metadata.resourceCount != null) fields.push("resources=" + metadata.resourceCount);
          if (Array.isArray(metadata.sections)) fields.push("sections=" + metadata.sections.join(">"));
          if (metadata.sectionSources && typeof metadata.sectionSources === "object" && !Array.isArray(metadata.sectionSources)) {
            fields.push("sources=" + Object.keys(metadata.sectionSources).slice(0, 4).map(function (key) { return key + ":" + metadata.sectionSources[key]; }).join("|"));
          }
          if (metadata.artifactPath) fields.push("path=" + metadata.artifactPath);
          if (metadata.artifactHash) fields.push("hash=" + metadata.artifactHash);
          if (metadata.generatedAt) fields.push("generatedAt=" + metadata.generatedAt);
          if (metadata.adapterID) fields.push("adapter=" + metadata.adapterID);
          if (metadata.fixtureGlob) fields.push("fixture=" + metadata.fixtureGlob);
          if (Array.isArray(metadata.evidenceSources)) fields.push("sources=" + metadata.evidenceSources.slice(0, 3).join(">"));
          if (metadata.captureMode) fields.push("capture=" + metadata.captureMode);
          if (metadata.packageSpec) fields.push("package=" + metadata.packageSpec);
          if (metadata.sanitizedPreview) fields.push(metadata.sanitizedPreview);
          if (metadata.fullPrompt) fields.push(state.flowPromptDebug ? "fullPrompt=" + String(metadata.fullPrompt).slice(0, 240) : "full prompt hidden; enable Prompt debug");
          return '<div class="flow-evidence-row" data-flow-evidence="' + h(item.id) + '"><strong>' + h(item.label || item.id) + '</strong><div class="flow-diff-meta">' +
            fields.filter(Boolean).map(function (field) { return '<span class="chip">' + h(String(field)) + '</span>'; }).join("") +
          '</div></div>';
        }).join("");
      }

      function setFlowMode(mode) {
        if (mode !== "blueprint" && mode !== "trace" && mode !== "native" && mode !== "compare") return;
        if ((mode === "native" || mode === "compare") && flowProduct() === "minimal") return;
        state.flowMode = mode;
        state.flowError = "";
        if (mode === "blueprint") {
          state.flowArtifact = null;
          state.flowLoading = false;
          renderFlowObserver();
          return;
        }
        if (mode === "trace") {
          requestFlowTrace();
          return;
        }
        if (!server.online || !server.harnessFlowUrl || typeof fetch !== "function") {
          state.flowArtifact = null;
          state.flowError = "online builder required";
          renderFlowObserver();
          return;
        }
        var product = flowNativeProduct();
        var key = flowCacheKey(mode, product);
        if (state.flowCache[key]) {
          state.flowArtifact = state.flowCache[key];
          renderFlowObserver();
          return;
        }
        state.flowLoading = true;
        renderFlowObserver();
        fetch(flowRequestURL(mode, product), { headers: { "accept": "application/json" } })
          .then(function (response) {
            if (!response.ok) throw new Error("HTTP " + response.status);
            return response.json();
          })
          .then(function (artifact) {
            state.flowCache[key] = artifact;
            state.flowArtifact = artifact;
            state.flowLoading = false;
            state.flowError = "";
            renderFlowObserver();
          })
          .catch(function (error) {
            state.flowLoading = false;
            state.flowArtifact = null;
            state.flowError = error && error.message ? error.message : String(error);
            renderFlowObserver();
          });
      }

      function requestFlowTrace() {
        if (!server.online || !server.harnessFlowUrl || typeof fetch !== "function") {
          state.flowArtifact = null;
          state.flowLoading = false;
          renderFlowObserver();
          return;
        }
        var traceSource = flowEvidenceSource();
        state.flowLoading = true;
        state.flowError = "";
        renderFlowObserver();
        fetch(server.harnessFlowUrl + "/run", {
          method: "POST",
          headers: { "accept": "application/json", "content-type": "application/json" },
          body: JSON.stringify({
            product: flowProduct(),
            taskID: flowTaskID(),
            recipe: exportRecipe(),
            prompt: "Flow Observer assembled trace probe",
            maxSteps: 1,
            source: traceSource
          })
        }).then(function (response) {
          return response.json().then(function (payload) {
            if (!response.ok || payload.ok === false) throw new Error(payload.error || "HTTP " + response.status);
            return payload;
          });
        }).then(function (run) {
          var events = Array.isArray(run.events) ? run.events.map(function (event) { return event && event.type ? String(event.type) : ""; }).filter(Boolean) : [];
          state.flowArtifact = run;
          state.flowLatestRun = {
            runID: run.runID || "",
            finish: run.summary && run.summary.finish ? run.summary.finish : "ok",
            steps: run.summary && run.summary.steps != null ? run.summary.steps : undefined,
            eventCount: run.summary && run.summary.events != null ? run.summary.events : events.length,
            observedStages: run.summary && run.summary.observedStages != null ? run.summary.observedStages : 0,
            fingerprint: run.summary && run.summary.fingerprint ? run.summary.fingerprint : "",
            captureMode: run.captureMode || "fixture",
            evidenceSource: traceSource,
            events: events,
            generatedAt: run.generatedAt || new Date().toISOString()
          };
          state.flowLoading = false;
          renderFlowObserver();
        }).catch(function (error) {
          state.flowLoading = false;
          state.flowArtifact = null;
          state.flowError = error && error.message ? error.message : String(error);
          renderFlowObserver();
        });
      }

      function render() {
        hideFloatingHelp();
        if (state.flowStandalone) {
          document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
          document.title = "Flow Observer - Helix";
          var standaloneApp = document.querySelector("[data-harness-builder]");
          if (standaloneApp) {
            standaloneApp.dataset.builderLocale = state.locale;
            standaloneApp.dataset.builderSurface = "flow-observer";
          }
          renderFlowObserver();
          return;
        }
        renderChrome();
        renderPresets();
        renderFilters();
        renderPalette();
        renderBoard();
        renderRight();
        renderFlowObserver();
        renderWizard();
        renderRunModal();
        renderRemoveImpactModal();
        scrollFocusedSlotIntoView();
      }

      function renderWizard() {
        var wizard = document.getElementById("newWizard");
        if (!wizard) return;
        wizard.hidden = !state.wizardOpen;
        if (!state.wizardOpen) return;
        var plan = buildWizardPlan();
        document.getElementById("wizardSteps").innerHTML = [
          { id: "entry", label: t("wizard.step.entry"), fine: t("wizard.step.entry.fine"), active: true },
          { id: "kit", label: t("wizard.step.kit"), fine: t("wizard.step.kit.fine"), active: Boolean(plan.profile) },
          { id: "blueprint", label: t("wizard.step.blueprint"), fine: t("wizard.step.blueprint.fine"), active: Boolean(plan.product && plan.profile) }
        ].map(function (step, index) {
          return '<div class="wizard-step" data-builder-wizard-step="' + h(step.id) + '" data-active="' + String(Boolean(step.active)) + '">' +
            '<strong>' + h(String(index + 1) + ". " + step.label) + '</strong>' +
            '<span class="fine">' + h(step.fine) + '</span>' +
          '</div>';
        }).join("");
        document.getElementById("wizardTargets").innerHTML = WIZARD_PRODUCTS.map(function (product) {
          var active = plan.product && product.id === plan.product.id;
          var base = presetForProduct(product.product);
          return '<button type="button" class="wizard-choice" data-wizard-product="' + h(product.id) + '" data-builder-wizard-product="' + h(product.id) + '" data-builder-wizard-entry-product="' + h(product.id) + '" data-wizard-target="' + h(product.id) + '" aria-pressed="' + String(Boolean(active)) + '">' +
            '<span><strong>' + h(productLabel(product)) + '</strong><br><span class="fine">' + h(tx("wizard.primaryInterface", { surface: product.primarySurface || "none" })) + '</span></span>' +
            '<span class="chip">' + h(base ? base.requiredPorts.length : 0) + '</span>' +
          '</button>';
        }).join("");
        document.getElementById("wizardProfiles").innerHTML = WIZARD_PROFILES.map(function (profile) {
          var active = plan.profile && profile.id === plan.profile.id;
          return '<button type="button" class="wizard-choice" data-wizard-profile="' + h(profile.id) + '" data-builder-wizard-profile="' + h(profile.id) + '" data-builder-wizard-kit="' + h(profile.kitID || profile.id) + '" aria-pressed="' + String(Boolean(active)) + '">' +
            '<span><strong>' + h(profileLabel(profile)) + '</strong><br><span class="fine">' + h(profileFine(profile)) + '</span></span>' +
            '<span class="chip">' + h(profileBadge(profile)) + '</span>' +
          '</button>';
        }).join("");
        var wizardStages = groupPortsByStage(plan.required, "flow");
        var wizardStageStrip = '<div class="stage-strip" data-builder-wizard-preview="stages">' + wizardStages.map(function (stage) {
          var boundCount = stage.ports.filter(function (portID) { return plan.bindings.has(portID); }).length;
          var missingCount = stage.ports.length - boundCount;
          return '<div class="stage-chip" data-builder-wizard-stage="' + h(stage.id) + '" data-missing="' + String(missingCount > 0) + '">' +
            '<strong>' + h(stage.label) + '</strong><br><span class="fine">' + h(tx("wizard.stageReady", { ready: boundCount, total: stage.ports.length })) + '</span>' +
          '</div>';
        }).join("") + '</div>';
        document.getElementById("wizardPreview").innerHTML =
          '<div class="surface-row" data-builder-wizard-preview="target"><span><strong>' + h(plan.product ? productLabel(plan.product) : "harness") + '</strong><br><span class="fine">' + h(plan.product ? plan.product.product : "custom") + '</span></span><span class="chip">' + h(t("wizard.harness")) + '</span></div>' +
          '<div class="surface-row" data-builder-wizard-preview="chassis" data-builder-wizard-chassis="' + h(plan.chassisID) + '"><span><strong>' + h(t("wizard.chassis")) + '</strong><br><span class="fine">' + h(plan.chassisID) + '</span></span><span class="chip">' + h(plan.required.length) + '</span></div>' +
          '<div class="surface-row" data-builder-wizard-preview="kit" data-builder-wizard-kit="' + h(plan.kitID) + '" data-builder-wizard-mode="' + h(plan.assemblyMode) + '"><span><strong>' + h(t("wizard.kit")) + '</strong><br><span class="fine">' + h(profileFine(plan.profile)) + '</span></span><span class="chip">' + h(plan.kitID) + '</span></div>' +
          '<div class="surface-row" data-builder-wizard-preview="interface"><span><strong>' + h(t("wizard.primaryInterfaceBlock")) + '</strong><br><span class="fine">' + h(plan.primaryShell || "none") + '</span></span><span class="chip">' + h(plan.surfaces[0] || "none") + '</span></div>' +
          '<div class="surface-row" data-builder-wizard-preview="ports"><span><strong>' + h(t("wizard.requiredPorts")) + '</strong><br><span class="fine">' + h(plan.required.slice(0, 6).join(", ") + (plan.required.length > 6 ? "..." : "")) + '</span></span><span class="chip">' + h(plan.required.length) + '</span></div>' +
          wizardStageStrip +
          '<div class="surface-row" data-builder-wizard-preview="kit-slots" data-builder-wizard-kit-slot-count="' + h(plan.kitSlotIDs.length) + '"><span><strong>' + h(t("wizard.kitSlots")) + '</strong><br><span class="fine">' + h(plan.kitSlotIDs.slice(0, 6).join(", ") + (plan.kitSlotIDs.length > 6 ? "..." : "")) + '</span></span><span class="chip">' + h(plan.kitSlotIDs.length) + '</span></div>' +
          '<div class="surface-row" data-builder-wizard-preview="bundles" data-builder-wizard-bundle-count="' + h(plan.selectedBundleIDs.length) + '"><span><strong>' + h(t("wizard.bundles")) + '</strong><br><span class="fine">' + h(plan.selectedBundleIDs.slice(0, 6).join(", ") + (plan.selectedBundleIDs.length > 6 ? "..." : "")) + '</span></span><span class="chip">' + h(plan.selectedBundleIDs.length) + '</span></div>' +
          '<div class="surface-row" data-builder-wizard-preview="bindings"><span><strong>' + h(t("wizard.explicitBindings")) + '</strong><br><span class="fine">' + h(plan.missing.length ? tx("wizard.missing", { ports: plan.missing.slice(0, 4).join(", ") }) : t("wizard.ready")) + '</span></span><span class="chip">' + h(plan.bindings.size) + '</span></div>';
      }

      function renderRunModal() {
        var modal = document.getElementById("runModal");
        if (!modal) return;
        modal.hidden = !state.runOpen;
        var provider = document.getElementById("runProvider");
        var baseURL = document.getElementById("runBaseURL");
        var model = document.getElementById("runModel");
        var apiKey = document.getElementById("runAPIKey");
        var prompt = document.getElementById("runPrompt");
        if (provider && state.runDefaults && state.runDefaults.provider && !provider.dataset.defaultApplied) {
          provider.value = state.runDefaults.provider;
          provider.dataset.defaultApplied = "true";
        }
        if (baseURL && !baseURL.value) baseURL.value = state.runDefaults && state.runDefaults.baseURL ? state.runDefaults.baseURL : "https://api.openai.com/v1";
        if (model && !model.value) model.value = state.runDefaults && state.runDefaults.modelID ? state.runDefaults.modelID : "gpt-4o-mini";
        if (apiKey) apiKey.placeholder = state.runDefaults && state.runDefaults.hasServerAPIKey ? t("run.serverKey") : "";
        if (prompt && !prompt.value) prompt.value = "Say hello from this Helix harness. Do not call tools.";
        var startButton = document.getElementById("runStartButton");
        if (startButton) startButton.disabled = Boolean(state.runBusy);
        var result = document.getElementById("runResult");
        if (result) {
          result.dataset.builderLiveRunResult = state.runStatus || "idle";
          result.textContent = state.runMessage || t("run.idle");
        }
      }

      function couplingLabel(group) {
        return t("coupling." + group);
      }

      function impactFocusPort() {
        var impact = state.removeImpact;
        if (!impact) return "";
        if (impact.requiredBreaks && impact.requiredBreaks[0]) return impact.requiredBreaks[0].portID;
        if (impact.ambiguityAfter && impact.ambiguityAfter[0]) return impact.ambiguityAfter[0].portID;
        if (impact.lostProvides && impact.lostProvides[0]) return impact.lostProvides[0];
        return "";
      }

      function miniList(items, emptyText) {
        return items.length ? '<ul class="impact-list-mini">' + items.join("") + '</ul>' : '<span class="fine">' + h(emptyText) + '</span>';
      }

      function renderRemoveImpactModal() {
        var modal = document.getElementById("removeImpactModal");
        if (!modal) return;
        modal.hidden = !state.removeImpactOpen;
        var body = document.getElementById("removeImpactBody");
        if (!body) return;
        var confirmButton = document.getElementById("removeImpactConfirmButton");
        var bundleButton = document.getElementById("removeImpactBundleButton");
        var focusButton = document.getElementById("removeImpactFocusButton");
        var impact = state.removeImpact;
        if (confirmButton) confirmButton.disabled = Boolean(state.removeImpactBusy || !state.removeImpactAtom || !impact);
        if (bundleButton) bundleButton.disabled = Boolean(state.removeImpactBusy || !impact || !impact.bundleRemovalAtomIDs || impact.bundleRemovalAtomIDs.length === 0);
        if (focusButton) focusButton.disabled = Boolean(state.removeImpactBusy || !impactFocusPort());
        if (!state.removeImpactOpen) return;
        if (state.removeImpactBusy) {
          body.innerHTML = '<div class="impact-summary" data-severity="warning"><strong>' + h(t("remove.loading")) + '</strong><br><span class="fine">' + h(state.removeImpactAtom) + '</span></div>';
          return;
        }
        if (state.removeImpactError) {
          body.innerHTML = '<div class="impact-summary" data-severity="warning"><strong>' + h(t("remove.serverRequired")) + '</strong><br><span class="fine">' + h(state.removeImpactError) + '</span></div>';
          return;
        }
        if (!impact) {
          body.innerHTML = '<div class="impact-summary" data-severity="warning"><strong>' + h(t("remove.title")) + '</strong><br><span class="fine">' + h(t("remove.none")) + '</span></div>';
          return;
        }
        var severityText = impact.severity === "blocked" ? t("remove.blocked") : impact.severity === "warning" ? t("remove.warning") : t("remove.safe");
        var lostProvides = miniList((impact.lostProvides || []).map(function (portID) {
          return '<li data-builder-remove-impact-port="' + h(portID) + '">' + h(portID) + '</li>';
        }), t("remove.none"));
        var requiredBreaks = miniList((impact.requiredBreaks || []).map(function (item) {
          return '<li data-builder-remove-impact-port="' + h(item.portID) + '">' + h(item.portID) + '<br><span class="fine">' + h((item.candidates || []).join(", ") || t("remove.none")) + '</span></li>';
        }), t("remove.none"));
        var ambiguityAfter = miniList((impact.ambiguityAfter || []).map(function (item) {
          return '<li data-builder-remove-impact-port="' + h(item.portID) + '">' + h(item.portID) + '<br><span class="fine">' + h((item.candidates || []).join(", ") || t("remove.none")) + '</span></li>';
        }), t("remove.none"));
        var removedBindings = miniList((impact.removedBindings || []).map(function (binding) {
          return '<li data-builder-remove-impact-binding="' + h(binding.portID) + '">' + h(binding.portID + " -> " + binding.providerAtomID) + '</li>';
        }), t("remove.none"));
        var consumers = miniList((impact.consumers || []).map(function (consumer) {
          return '<li data-builder-remove-impact-consumer="' + h(consumer.atomID) + '">' + h(consumer.atomID) + '<br><span class="fine">' + h((consumer.consumedPorts || []).join(", ")) + '</span></li>';
        }), t("remove.none"));
        var bundleAtoms = miniList((impact.bundleAtoms || []).map(function (atom) {
          return '<li data-builder-remove-impact-bundle-atom="' + h(atom.id) + '">' + h(atom.id) + '<br><span class="fine">' + h(atom.kind + " · " + atom.scope + ((atom.sharedByBundles || []).length ? " · shared: " + atom.sharedByBundles.join(", ") : "")) + '</span></li>';
        }), t("remove.none"));
        var sharedAtoms = miniList((impact.sharedAtoms || []).map(function (atom) {
          return '<li data-builder-remove-impact-shared-atom="' + h(atom.id) + '">' + h(atom.id) + '<br><span class="fine">' + h((atom.sharedByBundles || []).join(", ") || t("remove.none")) + '</span></li>';
        }), t("remove.none"));
        body.innerHTML =
          '<div class="impact-summary" data-builder-remove-impact-status="' + h(impact.severity) + '" data-severity="' + h(impact.severity) + '">' +
            '<strong>' + h(severityText) + '</strong><br>' +
            '<span class="fine">' + h(t("remove.target") + ": " + impact.atomID + " · " + t("remove.group") + ": " + (impact.bundleLabel || impact.bundleID || couplingLabel(impact.couplingGroup))) + '</span>' +
          '</div>' +
          '<div class="impact-grid">' +
            '<section class="impact-section"><strong>' + h(t("remove.lostProvides")) + '</strong>' + lostProvides + '</section>' +
            '<section class="impact-section"><strong>' + h(t("remove.requiredBreaks")) + '</strong>' + requiredBreaks + '</section>' +
            '<section class="impact-section"><strong>' + h(t("remove.ambiguityAfter")) + '</strong>' + ambiguityAfter + '</section>' +
            '<section class="impact-section"><strong>' + h(t("remove.bindingBreaks")) + '</strong>' + removedBindings + '</section>' +
            '<section class="impact-section"><strong>' + h(t("remove.consumerImpact")) + '</strong>' + consumers + '</section>' +
            '<section class="impact-section" data-builder-coupling-group="' + h(impact.couplingGroup) + '"><strong>' + h(t("remove.bundleAtoms")) + '</strong>' + bundleAtoms + '</section>' +
            '<section class="impact-section"><strong>' + h(t("remove.sharedAtoms")) + '</strong>' + sharedAtoms + '</section>' +
          '</div>';
      }

      function loadPreset(id) {
        var next = DATA.presets.find(function (item) { return item.id === id; });
        if (!next) return;
        state.preset = id;
        state.workspaceStarted = true;
        state.selected = new Set(next.atoms);
        state.selectedBundles = new Set(next.bundles || []);
        state.inferredBundles = new Set();
        state.bindings = presetBindings(next);
        state.customRecipeID = "";
        state.customPresetID = "";
	        state.customProduct = "custom";
	        state.customSourceFingerprint = "custom";
	        state.customRequiredPorts = [];
	        state.customBundleStates = [];
	        state.customEntrypoints = {};
        state.customPersonalities = ["common"];
        state.customAssemblyMode = "";
        state.customKitID = "";
        state.customChassisID = "";
        state.customUnknownAtoms = [];
        state.customUnknownBindings = [];
        state.customSchemaWarnings = [];
        state.familyReplacements = [];
        state.lastSwap = null;
        state.pendingBinding = null;
        var firstSlot = slotForPort(next.requiredPorts[0] || "");
        state.activeSlot = firstSlot ? firstSlot.id : "";
        state.activePort = firstSlot ? firstSlot.primaryPortID : "";
        state.activeAtom = "";
        state.activeBundle = next.bundles && next.bundles[0] ? next.bundles[0] : "";
        state.activeDetailKind = state.activeSlot ? "slot" : state.activeBundle ? "bundle" : "";
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.guideActive = false;
        state.guideStage = "";
        state.guideCollapsed = true;
        state.inspectorTab = "blueprint";
        state.detailsOpen = false;
        state.expandedSlots = new Set();
        state.collapsedStages = new Set();
        resetActivationRuntime();
        render();
      }

      function normalizeRequiredCapabilities(recipe) {
        return (Array.isArray(recipe.requiredCapabilities) ? recipe.requiredCapabilities : [])
          .map(function (capability) {
            if (typeof capability === "string") return capability;
            if (capability && typeof capability.id === "string") return capability.id;
            return "";
          })
          .filter(Boolean)
          .sort();
      }

      function importRecipe(recipe) {
        if (!recipe || typeof recipe !== "object") throw new Error(t("import.recipeObject"));
        var schemaWarnings = [];
        var recipeMetadata = recipe.metadata && typeof recipe.metadata === "object" && !Array.isArray(recipe.metadata) ? recipe.metadata : {};
        var builderAssembly = recipeMetadata.builderAssembly && typeof recipeMetadata.builderAssembly === "object" && !Array.isArray(recipeMetadata.builderAssembly) ? recipeMetadata.builderAssembly : {};
        ["id", "version"].forEach(function (field) {
          if (typeof recipe[field] !== "string" || recipe[field].length === 0) schemaWarnings.push(tx("import.missingString", { field: field }));
        });
        if (!Array.isArray(recipe.modules)) schemaWarnings.push(tx("import.missingArray", { field: "modules" }));
        if (!Array.isArray(recipe.personalities)) schemaWarnings.push(tx("import.missingArray", { field: "personalities" }));
        var refs = []
          .concat(Array.isArray(recipe.modules) ? recipe.modules : [])
          .concat(Array.isArray(recipe.atoms) ? recipe.atoms : [])
          .concat(Array.isArray(recipe.productShells) ? recipe.productShells : []);
        var refIDs = refs.map(function (ref) { return ref && typeof ref.id === "string" ? ref.id : ""; }).filter(Boolean);
        var atomIDs = refIDs.filter(function (id) { return atomByID.has(id); });
        var unknownAtoms = refIDs.filter(function (id) { return !atomByID.has(id); });
        var metadataRemovedAtomsByBundle = new Map();
        var metadataBundleStatesByID = new Map();
        var bundleRefRemovedAtomsByID = new Map();
        var hasBundleRefs = Array.isArray(recipe.bundles);
        var bundleRefIDs = new Set();
        (Array.isArray(recipe.bundles) ? recipe.bundles : []).forEach(function (bundle) {
          var id = typeof bundle === "string" ? bundle : bundle && typeof bundle.id === "string" ? bundle.id : "";
          var removedAtoms = bundle && typeof bundle === "object" && Array.isArray(bundle.removedAtoms) ? bundle.removedAtoms.filter(function (atomID) { return typeof atomID === "string"; }) : [];
          if (id) bundleRefIDs.add(id);
          if (id && removedAtoms.length > 0) bundleRefRemovedAtomsByID.set(id, removedAtoms);
        });
        (Array.isArray(recipeMetadata.bundleExpansion) ? recipeMetadata.bundleExpansion : []).forEach(function (expansion) {
          var bundleID = expansion && typeof expansion.bundleID === "string" ? expansion.bundleID : "";
          if (hasBundleRefs && bundleID && !bundleRefIDs.has(bundleID)) return;
          var expansionAtomIDs = expansion && Array.isArray(expansion.atomIDs) ? unique(expansion.atomIDs.filter(function (atomID) { return typeof atomID === "string" && atomByID.has(atomID); })) : [];
          var expansionSelectedAtomIDs = expansion && Array.isArray(expansion.selectedAtomIDs) ? unique(expansion.selectedAtomIDs.filter(function (atomID) { return typeof atomID === "string" && atomByID.has(atomID); })) : expansionAtomIDs;
          var removedAtoms = unique((expansion && Array.isArray(expansion.removedAtoms) ? expansion.removedAtoms.filter(function (atomID) { return typeof atomID === "string"; }) : []).concat(bundleRefRemovedAtomsByID.get(bundleID) || []));
          var replacedAtoms = [];
          if (expansion && Array.isArray(expansion.replacedAtoms)) {
            replacedAtoms = expansion.replacedAtoms
              .map(function (replacement) {
                return replacement && typeof replacement.from === "string" && typeof replacement.to === "string" ? { from: replacement.from, to: replacement.to } : null;
              })
              .filter(Boolean);
          } else if (expansion && expansion.replacedAtoms && typeof expansion.replacedAtoms === "object") {
            replacedAtoms = Object.keys(expansion.replacedAtoms)
              .map(function (from) {
                var to = expansion.replacedAtoms[from];
                return typeof to === "string" ? { from: from, to: to } : null;
              })
              .filter(Boolean);
          }
          if (bundleID && removedAtoms.length > 0) metadataRemovedAtomsByBundle.set(bundleID, removedAtoms);
          if (bundleID && bundleByID.has(bundleID)) {
            var bundle = bundleByID.get(bundleID);
            var atomSet = unique((expansionAtomIDs.length > 0 ? expansionAtomIDs : bundle ? bundle.atoms : []).concat(expansionSelectedAtomIDs));
            var selectedSet = unique(expansionSelectedAtomIDs.length > 0 ? expansionSelectedAtomIDs : atomSet).filter(function (atomID) { return !removedAtoms.includes(atomID); });
            selectedSet.forEach(function (atomID) {
              if (!atomIDs.includes(atomID)) atomIDs.push(atomID);
            });
            metadataBundleStatesByID.set(bundleID, {
              id: bundleID,
              status: removedAtoms.length > 0 || replacedAtoms.length > 0 || selectedSet.length < atomSet.length ? "customized" : "selected",
              selectionSource: "recipe",
              atoms: atomSet,
              selectedAtoms: selectedSet,
              missingAtoms: atomSet.filter(function (atomID) { return !selectedSet.includes(atomID); }),
              removedAtoms: removedAtoms,
              replacedAtoms: replacedAtoms
            });
          }
        });
        var importedBundleRefs = (Array.isArray(recipe.bundles) ? recipe.bundles : [])
          .map(function (bundle) {
            var id = typeof bundle === "string" ? bundle : bundle && typeof bundle.id === "string" ? bundle.id : "";
            var removedAtoms = bundle && typeof bundle === "object" && Array.isArray(bundle.removedAtoms) ? bundle.removedAtoms.filter(function (atomID) { return typeof atomID === "string"; }) : [];
            return { id: id, removedAtoms: unique(removedAtoms.concat(metadataRemovedAtomsByBundle.get(id) || [])) };
          })
          .filter(function (ref) { return ref.id && bundleByID.has(ref.id); });
        var importedBundles = importedBundleRefs.map(function (ref) { return ref.id; });
        importedBundleRefs.forEach(function (bundleRef) {
          var bundle = bundleByID.get(bundleRef.id);
          var removedAtoms = new Set(bundleRef.removedAtoms);
          if (bundle) bundle.atoms.forEach(function (atomID) {
            if (removedAtoms.has(atomID)) return;
            if (atomByID.has(atomID) && !atomIDs.includes(atomID)) atomIDs.push(atomID);
          });
        });
        var inferredBundles = (DATA.bundles || [])
          .filter(function (bundle) {
            return bundle.atoms.length > 0 && bundle.atoms.every(function (atomID) { return atomIDs.includes(atomID); });
          })
          .map(function (bundle) { return bundle.id; });
        var importedBundleSet = new Set(importedBundles);
        var inferredOnlyBundles = inferredBundles.filter(function (bundleID) { return !importedBundleSet.has(bundleID); });
        var selectedBundleIDs = unique(importedBundles.concat(inferredBundles));
        var customBundleStates = selectedBundleIDs.map(function (bundleID) {
          var metadataState = metadataBundleStatesByID.get(bundleID);
          if (metadataState) return metadataState;
          var bundle = bundleByID.get(bundleID);
          var atoms = bundle ? bundle.atoms : [];
          var selectedBundleAtoms = atoms.filter(function (atomID) { return atomIDs.includes(atomID); });
          return {
            id: bundleID,
            status: selectedBundleAtoms.length === atoms.length ? "selected" : "partial",
            selectionSource: importedBundleSet.has(bundleID) ? "recipe" : "inferred",
            atoms: atoms,
            selectedAtoms: selectedBundleAtoms,
            missingAtoms: atoms.filter(function (atomID) { return !selectedBundleAtoms.includes(atomID); }),
            removedAtoms: [],
            replacedAtoms: []
          };
        });
        var bindings = new Map();
        var unknownBindings = [];
        (Array.isArray(recipe.bindings) ? recipe.bindings : []).forEach(function (binding) {
          if (binding && typeof binding.port === "string" && typeof binding.module === "string") {
            bindings.set(binding.port, binding.module);
            if (!atomByID.has(binding.module)) unknownBindings.push(binding.port + "=" + binding.module);
          }
        });
        var required = normalizeRequiredCapabilities(recipe);
        if (required.length === 0) required = Array.from(bindings.keys()).sort();
        state.preset = "custom";
        state.workspaceStarted = true;
        state.selected = new Set(atomIDs);
        state.selectedBundles = new Set(selectedBundleIDs);
        state.inferredBundles = new Set(inferredOnlyBundles);
        state.bindings = bindings;
        state.customRecipeID = typeof recipe.id === "string" ? recipe.id : "custom.harness";
        state.customPresetID = "custom";
        state.customProduct = typeof recipeMetadata.product === "string" && recipeMetadata.product ? recipeMetadata.product : "custom";
        state.customSourceFingerprint = typeof recipeMetadata.sourceFingerprint === "string" && recipeMetadata.sourceFingerprint ? recipeMetadata.sourceFingerprint : "custom";
        state.customRequiredPorts = required;
        state.customBundleStates = customBundleStates;
        state.customEntrypoints = recipe.entrypoints && typeof recipe.entrypoints === "object" && !Array.isArray(recipe.entrypoints) ? recipe.entrypoints : {};
        state.customPersonalities = Array.isArray(recipe.personalities) && recipe.personalities.length > 0 ? recipe.personalities.filter(function (item) { return typeof item === "string"; }) : ["common"];
        state.customAssemblyMode = typeof builderAssembly.mode === "string" && builderAssembly.mode ? builderAssembly.mode : inferredOnlyBundles.length > 0 ? "import-inferred" : "import";
        state.customKitID = typeof builderAssembly.kitID === "string" && builderAssembly.kitID ? builderAssembly.kitID : inferredOnlyBundles.length > 0 ? "kit.inferred-import" : "";
        state.customChassisID = typeof builderAssembly.chassisID === "string" && builderAssembly.chassisID ? builderAssembly.chassisID : inferredOnlyBundles.length > 0 ? "chassis.imported" : "";
        state.customUnknownAtoms = unique(unknownAtoms);
        state.customUnknownBindings = unique(unknownBindings);
        state.customSchemaWarnings = schemaWarnings;
        state.familyReplacements = Array.isArray(builderAssembly.familyReplacements)
          ? builderAssembly.familyReplacements.filter(function (item) { return item && typeof item === "object" && typeof item.newBundleID === "string"; }).slice(-20)
          : [];
        state.lastSwap = null;
        state.pendingBinding = null;
        var importedSlot = slotForPort(required[0] || "");
        state.activeSlot = importedSlot ? importedSlot.id : "";
        state.activePort = importedSlot ? importedSlot.primaryPortID : "";
        state.activeAtom = "";
        state.activeBundle = Array.from(state.selectedBundles)[0] || "";
        state.activeDetailKind = state.activeSlot ? "slot" : state.activeBundle ? "bundle" : "";
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.guideActive = false;
        state.guideStage = "";
        state.guideCollapsed = true;
        state.inspectorTab = "blueprint";
        state.detailsOpen = false;
        state.expandedSlots = new Set();
        state.collapsedStages = new Set();
        resetActivationRuntime();
        render();
      }

      function removeAtom(id) {
        state.selected.delete(id);
        Array.from(state.bindings.entries()).forEach(function (entry) {
          if (entry[1] === id) state.bindings.delete(entry[0]);
        });
      }

      function removeAtoms(ids) {
        ids.forEach(removeAtom);
      }

      function bestSlotForBundle(id) {
        var bundle = bundleByID.get(id);
        if (!bundle) return null;
        var slot = activeSlot();
        if (slot && bundleMatchesSlot(bundle, slot)) return slot;
        var candidates = slotsForBundle(bundle);
        var currentSlots = requiredSlots();
        return candidates.find(function (candidate) { return currentSlots.some(function (currentSlot) { return currentSlot.id === candidate.id; }); }) || candidates[0] || null;
      }

      function replaceBundleFamily(id, slotID) {
        var plan = previewBundleFamilyReplacement(id);
        if (!plan || plan.severity === "blocked") return;
        var bundle = bundleByID.get(id);
        if (!bundle) return;
        var requestedSlot = slotByID.get(slotID);
        var slot = requestedSlot && bundleMatchesSlot(bundle, requestedSlot) ? requestedSlot : bestSlotForBundle(id);
        promotePresetToCustomDraft();
        state.workspaceStarted = true;
        (plan.oldBundleIDs || []).forEach(function (oldBundleID) {
          state.selectedBundles.delete(oldBundleID);
          state.inferredBundles.delete(oldBundleID);
        });
        removeAtoms(plan.removedAtomIDs || []);
        state.selectedBundles.add(id);
        state.inferredBundles.delete(id);
        bundle.atoms.forEach(function (atomID) {
          if (atomByID.has(atomID)) state.selected.add(atomID);
        });
        state.bindings = applyBindingChanges(state.bindings, plan.bindingChanges || []);
        bindSingleProvidersForBundle(bundle);
        state.familyReplacements = (state.familyReplacements || []).concat([{
          familyID: plan.familyID,
          familyLabel: plan.familyLabel,
          oldBundleIDs: plan.oldBundleIDs || [],
          newBundleID: id,
          ports: unique((plan.replacementPortIDs || []).concat(plan.bindingPortIDs || []).concat(plan.conflictPortIDs || []).concat(plan.breakPortIDs || [])),
          bindingChangeCount: (plan.bindingChanges || []).length,
          source: state.customAssemblyMode === "import" || state.customAssemblyMode === "import-inferred" ? "import-fix" : "builder-preview",
          timestamp: new Date().toISOString()
        }]).slice(-20);
        state.activeBundle = id;
        if ((plan.removedAtomIDs || []).includes(state.activeAtom)) state.activeAtom = "";
        state.activeSlot = slot ? slot.id : "";
        state.activePort = slot ? slot.primaryPortID : "";
        state.activeDetailKind = "bundle";
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.pendingBinding = null;
        state.inspectorTab = "blueprint";
        var afterReplaceCoverage = coverage();
        if (slot && !slotNeedsAssembly(slot, afterReplaceCoverage)) {
          var nextSlot = nextAssemblySlot(slot.id, 1, afterReplaceCoverage);
          if (nextSlot) {
            focusSlot(nextSlot, afterReplaceCoverage);
          } else {
            state.pendingScrollSlot = slot.id;
          }
        } else if (slot) {
          state.pendingScrollSlot = slot.id;
        }
        render();
      }

      function chooseFamilyWinner(familyID, winnerID) {
        var winner = bundleByID.get(winnerID);
        if (!winner || winner.exclusiveFamilyID !== familyID) return;
        var plan = previewBundleFamilyReplacement(winnerID);
        if (plan && plan.severity !== "blocked") {
          replaceBundleFamily(winnerID, state.activeSlot);
          return;
        }
        var oldBundleIDs = activeFamilyBundleIDs(familyID).filter(function (id) { return id !== winnerID; });
        if (oldBundleIDs.length === 0) return;
        promotePresetToCustomDraft();
        state.workspaceStarted = true;
        var winnerAtoms = new Set(winner.atoms || []);
        var otherBundleAtoms = otherBundleAtomsExcluding(oldBundleIDs.concat([winnerID]));
        var removedAtomIDs = [];
        oldBundleIDs.forEach(function (oldBundleID) {
          state.selectedBundles.delete(oldBundleID);
          state.inferredBundles.delete(oldBundleID);
          var oldBundle = bundleByID.get(oldBundleID);
          if (!oldBundle) return;
          (oldBundle.atoms || []).forEach(function (atomID) {
            if (!state.selected.has(atomID) || winnerAtoms.has(atomID) || otherBundleAtoms.has(atomID)) return;
            removedAtomIDs.push(atomID);
          });
        });
        removeAtoms(unique(removedAtomIDs));
        state.selectedBundles.add(winnerID);
        state.inferredBundles.delete(winnerID);
        (winner.atoms || []).forEach(function (atomID) {
          if (atomByID.has(atomID)) state.selected.add(atomID);
        });
        bindSingleProvidersForBundle(winner);
        state.familyReplacements = (state.familyReplacements || []).concat([{
          familyID: familyID,
          familyLabel: winner.exclusiveFamilyLabel || familyID,
          oldBundleIDs: oldBundleIDs,
          newBundleID: winnerID,
          ports: winner.exclusiveFamilyPorts || winner.ports || [],
          bindingChangeCount: 0,
          source: "diagnostic-winner",
          timestamp: new Date().toISOString()
        }]).slice(-20);
        state.activeBundle = winnerID;
        state.activeAtom = "";
        var slot = bestSlotForBundle(winnerID);
        state.activeSlot = slot ? slot.id : "";
        state.activePort = slot ? slot.primaryPortID : "";
        state.activeDetailKind = "bundle";
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.pendingBinding = null;
        state.inspectorTab = "blueprint";
        render();
      }

      function installBundleIntoSlot(id, slotID) {
        var bundle = bundleByID.get(id);
        if (!bundle) return;
        if (previewBundleFamilyReplacement(id)) {
          replaceBundleFamily(id, slotID);
          return;
        }
        var requestedSlot = slotByID.get(slotID);
        var slot = requestedSlot && bundleMatchesSlot(bundle, requestedSlot) ? requestedSlot : bestSlotForBundle(id);
        promotePresetToCustomDraft();
        state.workspaceStarted = true;
        state.selectedBundles.add(id);
        state.inferredBundles.delete(id);
        bundle.atoms.forEach(function (atomID) {
          if (atomByID.has(atomID)) state.selected.add(atomID);
        });
        bindSingleProvidersForBundle(bundle);
        state.activeBundle = id;
        state.activeAtom = "";
        state.activeSlot = slot ? slot.id : "";
        state.activePort = slot ? slot.primaryPortID : "";
        state.activeDetailKind = "bundle";
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.pendingBinding = null;
        state.inspectorTab = "blueprint";
        var afterInstallCoverage = coverage();
        if (slot && !slotNeedsAssembly(slot, afterInstallCoverage)) {
          var nextSlot = nextAssemblySlot(slot.id, 1, afterInstallCoverage);
          if (nextSlot) {
            focusSlot(nextSlot, afterInstallCoverage);
          } else {
            state.pendingScrollSlot = slot.id;
          }
        } else if (slot) {
          state.pendingScrollSlot = slot.id;
        }
        render();
      }

      function requestBundleInstall(id, slotID) {
        var bundle = bundleByID.get(id);
        if (!bundle) return;
        var requestedSlot = slotByID.get(slotID);
        var slot = requestedSlot && bundleMatchesSlot(bundle, requestedSlot) ? requestedSlot : bestSlotForBundle(id);
        state.pendingBinding = null;
        state.previewBundle = id;
        state.previewAction = "install";
        state.previewPinned = true;
        state.activeBundle = id;
        state.activeAtom = "";
        state.activeSlot = slot ? slot.id : "";
        state.activePort = slot ? slot.primaryPortID : "";
        state.activeDetailKind = "bundle";
        state.inspectorTab = "preview";
        if (slot) state.collapsedStages.delete(slotAssemblyStage(slot));
        render();
      }

      function addBundleToSelection(id) {
        requestBundleInstall(id, state.activeSlot);
      }

      function promoteSelectedAtomsToBundle(id) {
        var bundle = bundleByID.get(id);
        if (!bundle || !bundle.atoms.every(function (atomID) { return state.selected.has(atomID); })) return;
        promotePresetToCustomDraft();
        state.workspaceStarted = true;
        state.selectedBundles.add(id);
        state.inferredBundles.delete(id);
        bindSingleProvidersForBundle(bundle);
        var slot = bestSlotForBundle(id);
        state.activeBundle = id;
        state.activeAtom = "";
        state.activeSlot = slot ? slot.id : state.activeSlot;
        state.activePort = slot ? slot.primaryPortID : state.activePort;
        state.activeDetailKind = "bundle";
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.pendingBinding = null;
        state.inspectorTab = "blueprint";
        render();
      }

      function bindSingleProvidersForBundle(bundle) {
        (bundle.ports || []).forEach(function (portID) {
          if (state.bindings.has(portID)) return;
          var providers = (bundle.atoms || []).filter(function (atomID) {
            var atom = atomByID.get(atomID);
            return atom && atom.provides.includes(portID) && state.selected.has(atomID);
          });
          if (providers.length === 1) state.bindings.set(portID, providers[0]);
        });
      }

      function uninstallBundleFromSlot(id, slotID) {
        var bundle = bundleByID.get(id);
        if (!bundle) return;
        var requestedSlot = slotByID.get(slotID);
        var slot = requestedSlot && bundleMatchesSlot(bundle, requestedSlot) ? requestedSlot : bestSlotForBundle(id);
        promotePresetToCustomDraft();
        var otherBundleAtoms = new Set();
        Array.from(state.selectedBundles).forEach(function (bundleID) {
          if (bundleID === id) return;
          var other = bundleByID.get(bundleID);
          if (other) selectedAtomIDsForBundle(other).forEach(function (atomID) { otherBundleAtoms.add(atomID); });
        });
        var removable = selectedAtomIDsForBundle(bundle).filter(function (atomID) { return !otherBundleAtoms.has(atomID); });
        state.selectedBundles.delete(id);
        state.inferredBundles.delete(id);
        removeAtoms(removable);
        if (state.activeBundle === id) state.activeBundle = "";
        if (removable.includes(state.activeAtom)) state.activeAtom = "";
        state.activeSlot = slot ? slot.id : state.activeSlot;
        state.activePort = slot ? slot.primaryPortID : state.activePort;
        state.activeDetailKind = state.activeBundle ? "bundle" : state.activeSlot ? "slot" : "";
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.inspectorTab = "blueprint";
        var afterReplaceCoverage = coverage();
        if (slot && !slotNeedsAssembly(slot, afterReplaceCoverage)) {
          var nextSlot = nextAssemblySlot(slot.id, 1, afterReplaceCoverage);
          if (nextSlot) {
            focusSlot(nextSlot, afterReplaceCoverage);
          } else {
            state.pendingScrollSlot = slot.id;
          }
        } else if (slot) {
          state.pendingScrollSlot = slot.id;
        }
        render();
      }

      function requestBundleRemoval(id, slotID) {
        var preview = previewBundleRemoval(id);
        if (!preview) return;
        var requestedSlot = slotByID.get(slotID);
        var breakSlot = preview.breakPortIDs.map(function (portID) { return slotForPort(portID); }).find(Boolean);
        var fallbackSlot = requestedSlot && bundleMatchesSlot(preview.bundle, requestedSlot)
          ? requestedSlot
          : breakSlot || preview.targetSlots[0] || bestSlotForBundle(id);
        state.pendingBinding = null;
        state.previewBundle = id;
        state.previewAction = "remove";
        state.previewPinned = true;
        state.activeBundle = id;
        state.activeAtom = "";
        state.activeSlot = fallbackSlot ? fallbackSlot.id : "";
        state.activePort = fallbackSlot ? fallbackSlot.primaryPortID : "";
        state.activeDetailKind = "bundle";
        state.inspectorTab = "preview";
        if (fallbackSlot) state.collapsedStages.delete(slotAssemblyStage(fallbackSlot));
        render();
      }

      function removeBundleFromSelection(id) {
        requestBundleRemoval(id, state.activeSlot);
      }

      function replaceSlotProvider(slotID, portID, providerID) {
        var slot = slotByID.get(slotID) || slotForPort(portID);
        promotePresetToCustomDraft();
        state.workspaceStarted = true;
        state.selected.add(providerID);
        state.lastSwap = swapImpact(portID, providerID);
        state.bindings.set(portID, providerID);
        state.pendingBinding = null;
        state.activePort = portID;
        state.activeSlot = slot ? slot.id : "";
        state.activeAtom = "";
        state.activeBundle = "";
        state.activeDetailKind = "port";
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.inspectorTab = "blueprint";
        render();
      }

      function requestSlotProviderReplacement(slotID, portID, providerID) {
        if (!portByID.has(portID) || !atomByID.has(providerID)) return;
        var slot = slotByID.get(slotID) || slotForPort(portID);
        state.pendingBinding = {
          slotID: slot ? slot.id : "",
          portID: portID,
          providerID: providerID
        };
        state.previewBundle = "";
        state.previewAction = "";
        state.previewPinned = false;
        state.activePort = portID;
        state.activeSlot = slot ? slot.id : "";
        state.activeAtom = "";
        state.activeBundle = "";
        state.activeDetailKind = "port";
        state.inspectorTab = "preview";
        if (slot) state.collapsedStages.delete(slotAssemblyStage(slot));
        render();
      }

      function confirmSlotProviderReplacement() {
        var pending = state.pendingBinding;
        if (!pending) return;
        replaceSlotProvider(pending.slotID || "", pending.portID, pending.providerID);
      }

      function addAtomToSelection(id) {
        promotePresetToCustomDraft();
        state.workspaceStarted = true;
        state.selected.add(id);
        state.activeAtom = id;
        state.activeBundle = "";
        state.activeDetailKind = "atom";
        var atom = atomByID.get(id);
        var slot = atom && atom.provides.length ? slotForPort(atom.provides[0]) : null;
        if (!state.activeSlot && slot) state.activeSlot = slot.id;
        if (!state.activePort && slot) state.activePort = slot.primaryPortID;
        state.inspectorTab = "blueprint";
        render();
      }

      function addAtomFromTarget(target) {
        return target.dataset.add || (target.dataset.dragAtom && target.dataset.stateSelected === "false" ? target.dataset.dragAtom : "");
      }

      function removeAtomFromSelection(id) {
        promotePresetToCustomDraft();
        removeAtom(id);
        state.activeAtom = "";
        state.removeImpactOpen = false;
        state.removeImpactBusy = false;
        state.removeImpactAtom = "";
        state.removeImpact = null;
        state.removeImpactError = "";
        render();
      }

      function removeAtomsFromSelection(ids) {
        promotePresetToCustomDraft();
        removeAtoms(ids);
        if (ids.includes(state.activeAtom)) state.activeAtom = "";
        state.removeImpactOpen = false;
        state.removeImpactBusy = false;
        state.removeImpactAtom = "";
        state.removeImpact = null;
        state.removeImpactError = "";
        render();
      }

      function previewRemoveAtom(id) {
        if (state.removeImpactOpen && state.removeImpactAtom === id && state.removeImpactBusy) return;
        state.removeImpactOpen = true;
        state.removeImpactBusy = true;
        state.removeImpactAtom = id;
        state.removeImpact = null;
        state.removeImpactError = "";
        renderRemoveImpactModal();
        renderRight();
        if (!server.online || !server.harnessImpactUrl || !window.fetch) {
          state.removeImpactBusy = false;
          state.removeImpactError = "backend endpoint unavailable";
          renderRemoveImpactModal();
          renderRight();
          return;
        }
        fetch(server.harnessImpactUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ atomID: id, recipe: exportRecipe() })
        }).then(function (response) {
          return response.text().then(function (text) {
            var trimmed = text.trim();
            var payload = {};
            if (!trimmed) {
              throw new Error("Removal impact returned an empty response (HTTP " + response.status + "). Refresh the online builder and retry.");
            }
            try {
              payload = JSON.parse(trimmed);
            } catch (parseError) {
              throw new Error("Removal impact returned a non-JSON response (HTTP " + response.status + "): " + trimmed.slice(0, 180));
            }
            if (!response.ok || payload.ok === false) throw new Error(payload.error || "Removal impact failed with HTTP " + response.status);
            return payload;
          });
        }).then(function (payload) {
          if (state.removeImpactAtom !== id) return;
          state.removeImpact = payload;
          state.removeImpactError = "";
          state.removeImpactBusy = false;
          renderRemoveImpactModal();
          renderRight();
        }).catch(function (error) {
          if (state.removeImpactAtom !== id) return;
          state.removeImpact = null;
          state.removeImpactError = error && error.message ? error.message : String(error);
          state.removeImpactBusy = false;
          renderRemoveImpactModal();
          renderRight();
        });
      }

      function confirmRemoveImpact() {
        if (!state.removeImpact || !state.removeImpactAtom) return;
        removeAtomFromSelection(state.removeImpactAtom);
      }

      function removeImpactBundle() {
        if (!state.removeImpact || !state.removeImpactAtom) return;
        promotePresetToCustomDraft();
        var ids = (state.removeImpact.bundleRemovalAtomIDs || (state.removeImpact.bundleAtoms || []).map(function (atom) { return atom.id; })).filter(Boolean);
        if (!ids.includes(state.removeImpactAtom)) ids.push(state.removeImpactAtom);
        if (state.removeImpact.bundleID) {
          state.selectedBundles.delete(state.removeImpact.bundleID);
          state.inferredBundles.delete(state.removeImpact.bundleID);
        }
        removeAtomsFromSelection(ids);
      }

      function focusRemoveImpactPort() {
        var portID = impactFocusPort();
        if (!portID) return;
        state.removeImpactOpen = false;
        state.removeImpactBusy = false;
        state.activePort = portID;
        var slot = slotForPort(portID);
        state.activeSlot = slot ? slot.id : "";
        state.activeAtom = "";
        state.query = "";
        state.view = "all";
        render();
      }

      function createWizardRecipe() {
        var plan = buildWizardPlan();
        if (!plan.product || !plan.base) return;
        var entrypoints = {};
        plan.surfaces.forEach(function (surface) {
          var shell = plan.product.surfaces[surface];
          if (shell) {
            entrypoints[surface] = shell;
            entrypoints[shell] = shell;
          }
        });
        state.preset = "custom";
        state.workspaceStarted = true;
        state.selected = plan.selected;
        state.customProduct = plan.product.product;
        var wizardBundles = bundleIDsForSelectedAtoms(plan.selected);
        state.selectedBundles = new Set(wizardBundles.length > 0 ? wizardBundles : bundleIDsForSelectedAtomCoverage(plan.selected));
        state.inferredBundles = new Set();
        state.bindings = plan.bindings;
        state.customRecipeID = "custom." + plan.product.id;
        state.customPresetID = plan.product.id;
	        state.customSourceFingerprint = "custom";
	        state.customRequiredPorts = plan.required;
	        state.customBundleStates = [];
	        state.customEntrypoints = entrypoints;
        state.customPersonalities = plan.base.recipe && Array.isArray(plan.base.recipe.personalities) ? plan.base.recipe.personalities.slice() : ["common"];
        state.customAssemblyMode = plan.assemblyMode;
        state.customKitID = plan.kitID;
        state.customChassisID = plan.chassisID;
        state.customUnknownAtoms = [];
        state.customUnknownBindings = [];
        state.customSchemaWarnings = [];
        state.familyReplacements = [];
        state.lastSwap = null;
        var firstStage = groupPortsByStage(plan.required)[0];
        var createCoverage = coverage();
        var firstGapSlot = plan.profile && plan.profile.id === "bare"
          ? requiredSlots().find(function (slot) { return slotNeedsAssembly(slot, createCoverage); })
          : null;
        if (firstGapSlot) {
          focusSlot(firstGapSlot, createCoverage);
        } else if (firstStage) {
          state.guideActive = true;
          state.guideStage = firstStage.id;
          state.activePort = firstStage.ports[0] || "";
          var wizardSlot = state.activePort ? slotForPort(state.activePort) : null;
          state.activeSlot = wizardSlot ? wizardSlot.id : "";
          state.activeAtom = "";
          state.activeBundle = Array.from(state.selectedBundles)[0] || "";
        } else {
          state.guideActive = false;
          state.guideStage = "";
          state.guideCollapsed = true;
          state.activeAtom = plan.primaryShell;
          state.activeBundle = Array.from(state.selectedBundles)[0] || "";
          state.activePort = "";
          state.activeSlot = "";
        }
        state.previewBundle = "";
        state.previewAction = "";
        state.wizardOpen = false;
        state.previewPinned = false;
        state.pendingBinding = null;
        state.inspectorTab = "blueprint";
        state.detailsOpen = false;
        state.expandedSlots = new Set();
        state.collapsedStages = new Set();
        resetActivationRuntime();
        render();
      }

      var builderNoticeTimer = null;

      function showBuilderNotice(message, status) {
        var notice = document.getElementById("builderNotice");
        if (!notice) return;
        notice.textContent = message;
        notice.dataset.builderNoticeStatus = status || "info";
        notice.hidden = false;
        if (builderNoticeTimer) window.clearTimeout(builderNoticeTimer);
        builderNoticeTimer = window.setTimeout(function () {
          notice.hidden = true;
        }, 4000);
      }

      function saveRecipeDraft() {
        if (!server.online || !server.recipeDraftsUrl || !window.fetch) {
          var unavailableMessage = t("server.saveUnavailable");
          document.getElementById("warningList").innerHTML = '<div class="diagnostic" data-builder-diagnostic="builder.server.unavailable" data-severity="warning"><strong>builder.server.unavailable</strong><br><span class="fine">' + h(unavailableMessage) + '</span></div>';
          showBuilderNotice(unavailableMessage, "error");
          return;
        }
        fetch(server.recipeDraftsUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ recipe: exportRecipe() })
        }).then(function (response) {
          if (!response.ok) throw new Error(tx("server.saveFailed", { status: response.status }));
          return response.json();
        }).then(function (payload) {
          var savedMessage = tx("server.saved", { id: payload.id || "unknown", url: payload.url || server.recipeDraftsUrl });
          document.getElementById("warningList").innerHTML = '<div class="diagnostic" data-builder-diagnostic="builder.server.saved" data-severity="info"><strong>builder.server.saved</strong><br><span class="fine">' + h(savedMessage) + '</span></div>';
          showBuilderNotice(savedMessage, "success");
        }).catch(function (error) {
          var errorMessage = error && error.message ? error.message : String(error);
          document.getElementById("warningList").innerHTML = '<div class="warning">' + h(errorMessage) + '</div>';
          showBuilderNotice(errorMessage, "error");
        });
      }

      function fieldValue(id) {
        var element = document.getElementById(id);
        return element && typeof element.value === "string" ? element.value.trim() : "";
      }

      function setRunResult(status, message) {
        state.runStatus = status;
        state.runMessage = message;
        renderRunModal();
      }

      function runHarnessLive() {
        if (!server.online || !server.harnessRunsUrl || !window.fetch) {
          setRunResult("error", t("run.static"));
          return;
        }
        state.runBusy = true;
        setRunResult("idle", t("run.running"));
        fetch(server.harnessRunsUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            recipe: exportRecipe(),
            provider: fieldValue("runProvider") || "openai-compatible",
            baseURL: fieldValue("runBaseURL"),
            model: fieldValue("runModel"),
            apiKey: fieldValue("runAPIKey"),
            prompt: fieldValue("runPrompt"),
            maxSteps: fieldValue("runMaxSteps")
          })
        }).then(function (response) {
          return response.json().then(function (payload) {
            if (!response.ok || payload.ok === false) throw new Error(payload.error || "Run failed with HTTP " + response.status);
            return payload;
          });
        }).then(function (payload) {
          state.flowLatestRun = {
            runID: payload.runID || "",
            finish: payload.finish || (payload.ok === false ? "failed" : "ok"),
            steps: payload.steps == null ? undefined : payload.steps,
            generatedAt: new Date().toISOString()
          };
          var text = [
            t("run.ok"),
            t("run.response") + ": " + (payload.assistantText || ""),
            t("run.session") + ": " + (payload.session && payload.session.id ? payload.session.id : "unknown"),
            t("run.steps") + ": " + String(payload.steps == null ? "?" : payload.steps)
          ].join("\\n\\n");
          state.runBusy = false;
          setRunResult("ok", text);
        }).catch(function (error) {
          state.runBusy = false;
          setRunResult("error", t("run.failed") + ": " + (error && error.message ? error.message : String(error)));
        });
      }

      function loadRunDefaults() {
        if (!server.online || !server.harnessRunDefaultsUrl || !window.fetch) return;
        fetch(server.harnessRunDefaultsUrl, { headers: { "accept": "application/json" } })
          .then(function (response) {
            if (!response.ok) throw new Error("Defaults failed with HTTP " + response.status);
            return response.json();
          })
          .then(function (payload) {
            state.runDefaults = payload;
            renderRunModal();
          })
          .catch(function () {
              state.runDefaults = null;
            });
      }

      function syncActivationFields() {
        [
          "activationName",
          "activationWorkspaceDir",
          "activationStorageDir",
          "activationProvider",
          "activationModel",
          "activationBaseURL",
          "activationAPIKeyEnv",
          "activationTelegramMode",
          "activationBotTokenEnv",
          "activationAllowedChat",
          "activationWebhookURL",
          "activationWebhookSecretEnv",
          "activationSmokeText"
        ].forEach(function (id) {
          var element = document.getElementById(id);
          if (element && typeof element.value === "string") state[id] = element.value.trim();
        });
        if (!state.activationName) state.activationName = activationDefaultName();
      }

      function activationEndpoint(name, suffix) {
        return server.harnessProfilesUrl.replace(/\\/$/, "") + "/" + encodeURIComponent(name) + suffix;
      }

      function activationFetch(method, url, body) {
        return fetch(url, {
          method: method,
          headers: { "content-type": "application/json", "accept": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body)
        }).then(function (response) {
          return response.text().then(function (text) {
            var payload = {};
            if (text.trim()) {
              try {
                payload = JSON.parse(text);
              } catch (parseError) {
                throw new Error("Activation endpoint returned non-JSON HTTP " + response.status + ": " + text.slice(0, 160));
              }
            }
            if (!response.ok || payload.ok === false) throw new Error(payload.error || "Activation failed with HTTP " + response.status);
            return payload;
          });
        });
      }

      function applyActivationStatus(payload, message) {
        if (payload && payload.profile && payload.validation) state.activationStatus = payload;
        state.activationMessage = message || state.activationMessage;
        state.activationError = "";
      }

      function refreshActivationStatus(message) {
        var name = activationProfileName();
        if (!server.online || !server.harnessProfilesUrl || !window.fetch) {
          state.activationError = t("activation.static");
          renderRight();
          return Promise.resolve(null);
        }
        return activationFetch("GET", activationEndpoint(name, "/status")).then(function (payload) {
          applyActivationStatus(payload, message || t("activation.statusLoaded"));
          renderRight();
          return payload;
        });
      }

      function runActivationAction(action) {
        syncActivationFields();
        var name = activationProfileName();
        if (!server.online || !server.harnessProfilesUrl || !window.fetch) {
          state.activationError = t("activation.static");
          renderRight();
          return;
        }
        state.activationBusy = true;
        state.activationError = "";
        state.activationMessage = t("activation.busy");
        renderRight();
        var request;
        if (action === "install") {
          request = activationFetch("POST", server.harnessProfilesUrl, {
            name: name,
            recipe: exportRecipe(),
            workspaceDir: state.activationWorkspaceDir,
            storageDir: state.activationStorageDir
          }).then(function (payload) {
            applyActivationStatus(payload, t("activation.installed"));
            return payload;
          });
        } else if (action === "provider") {
          request = activationFetch("PUT", activationEndpoint(name, "/provider"), {
            provider: state.activationProvider || "openai-compatible",
            modelID: state.activationModel,
            baseURL: state.activationBaseURL,
            apiKeyEnv: state.activationAPIKeyEnv
          }).then(function (payload) {
            applyActivationStatus(payload, t("activation.providerSaved"));
            return payload;
          });
        } else if (action === "telegram") {
          request = activationFetch("POST", activationEndpoint(name, "/channels/telegram"), {
            mode: state.activationTelegramMode || "polling",
            botTokenEnv: state.activationBotTokenEnv,
            allowedChatIDs: csvValues(state.activationAllowedChat),
            webhookURL: state.activationWebhookURL,
            webhookSecretEnv: state.activationWebhookSecretEnv
          }).then(function (payload) {
            applyActivationStatus(payload, t("activation.telegramSaved"));
            return payload;
          });
        } else if (action === "status") {
          request = activationFetch("GET", activationEndpoint(name, "/status")).then(function (payload) {
            applyActivationStatus(payload, t("activation.statusLoaded"));
            return payload;
          });
        } else if (action === "logs") {
          request = activationFetch("GET", activationEndpoint(name, "/gateway/logs")).then(function (payload) {
            state.activationLogs = payload && typeof payload.text === "string" ? payload.text : JSON.stringify(payload, null, 2);
            state.activationMessage = t("activation.logsLoaded");
            state.activationError = "";
            return refreshActivationStatus(t("activation.logsLoaded"));
          });
        } else if (action === "smoke") {
          request = activationFetch("POST", activationEndpoint(name, "/gateway/smoke-local"), {
            text: state.activationSmokeText || "hello",
            chatID: csvValues(state.activationAllowedChat)[0] || ""
          }).then(function (payload) {
            var ok = Boolean(payload && payload.ok !== false);
            state.activationLogs = JSON.stringify(payload, null, 2);
            state.activationMessage = ok ? t("activation.smokeOK") : t("activation.smokeFailed");
            state.activationError = ok ? "" : t("activation.smokeFailed");
            return refreshActivationStatus(state.activationMessage);
          });
        } else if (action === "start" || action === "stop" || action === "restart") {
          request = activationFetch("POST", activationEndpoint(name, action === "start" ? "/gateway/start" : action === "restart" ? "/gateway/restart" : "/gateway/stop"), {}).then(function (payload) {
            state.activationLogs = JSON.stringify(payload, null, 2);
            state.activationMessage = action === "start" ? t("activation.gatewayStarted") : action === "restart" ? t("activation.gatewayRestarted") : t("activation.gatewayStopped");
            return refreshActivationStatus(state.activationMessage);
          });
        } else {
          request = Promise.resolve(null);
        }
        request.catch(function (error) {
          state.activationError = error && error.message ? error.message : String(error);
          state.activationMessage = t("activation.error");
        }).finally(function () {
          state.activationBusy = false;
          renderRight();
        });
      }

      function tuiEndpoint(suffix) {
        return server.harnessTuiSessionsUrl.replace(/\\/$/, "") + suffix;
      }

      function tuiFetch(method, url, body) {
        return fetch(url, {
          method: method,
          headers: { "content-type": "application/json", "accept": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body)
        }).then(function (response) {
          return response.text().then(function (text) {
            var payload = {};
            if (text.trim()) {
              try {
                payload = JSON.parse(text);
              } catch (parseError) {
                throw new Error("TUI endpoint returned non-JSON HTTP " + response.status + ": " + text.slice(0, 160));
              }
            }
            if (!response.ok || payload.ok === false) throw new Error(payload.error || "TUI failed with HTTP " + response.status);
            return payload;
          });
        });
      }

      function syncTuiFields() {
        ["tuiMode", "tuiProviderMode"].forEach(function (field) {
          var element = document.querySelector('[data-tui-field="' + field + '"]');
          if (element && typeof element.value === "string") state[field] = element.value;
        });
      }

      function xtermAsset(path) {
        return new URL(path, window.location.href).toString();
      }

      function ensureXterm() {
        if (window.Terminal) return Promise.resolve(window.Terminal);
        if (tuiXtermPromise) return tuiXtermPromise;
        tuiXtermPromise = new Promise(function (resolve, reject) {
          var link = document.querySelector('link[data-xterm-css="ready"]');
          if (!link) {
            link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = xtermAsset("/vendor/xterm/xterm.css");
            link.dataset.xtermCss = "ready";
            document.head.appendChild(link);
          }
          var script = document.createElement("script");
          script.src = xtermAsset("/vendor/xterm/xterm.js");
          script.onload = function () {
            if (window.Terminal) resolve(window.Terminal);
            else reject(new Error("xterm did not expose window.Terminal."));
          };
          script.onerror = function () { reject(new Error("Failed to load xterm assets.")); };
          document.head.appendChild(script);
        });
        return tuiXtermPromise;
      }

      function syncTuiTerminal() {
        var mount = document.getElementById("tuiTerminalMount");
        if (!mount || (mount.closest && mount.closest("[hidden]"))) return;
        if (tuiTerminal && tuiTerminalMount === mount) return;
        if (tuiTerminal && tuiTerminal.dispose) {
          try { tuiTerminal.dispose(); } catch (error) {}
        }
        tuiTerminal = null;
        tuiTerminalMount = mount;
        ensureXterm().then(function (Terminal) {
          if (tuiTerminalMount !== mount) return;
          mount.innerHTML = "";
          tuiTerminal = new Terminal({
            cursorBlink: true,
            convertEol: false,
            cols: 100,
            rows: 28,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 12,
            theme: {
              background: "#101418",
              foreground: "#d8f3e4",
              cursor: "#f2e2aa",
              selectionBackground: "#265f9d"
            }
          });
          tuiTerminal.open(mount);
          if (state.tuiTranscript) tuiTerminal.write(state.tuiTranscript);
          tuiTerminal.onData(function (data) {
            if (tuiSocket && tuiSocket.readyState === WebSocket.OPEN) tuiSocket.send(JSON.stringify({ type: "input", data: data }));
          });
          sendTuiResize();
          tuiTerminal.focus();
        }).catch(function (error) {
          mount.innerHTML = '<pre id="tuiFallbackOutput" class="tui-fallback-output">' + h(state.tuiTranscript || (error && error.message ? error.message : String(error))) + '</pre>';
        });
      }

      function appendTuiOutput(data) {
        state.tuiTranscript = (state.tuiTranscript + data).slice(-120000);
        if (tuiTerminal && tuiTerminal.write) {
          tuiTerminal.write(data);
        } else {
          var output = document.getElementById("tuiFallbackOutput");
          if (output) output.textContent = state.tuiTranscript;
        }
      }

      function updateTuiStatusDOM() {
        syncCompileButton();
        var badge = document.getElementById("tuiBadge");
        if (badge) {
          badge.textContent = state.tuiStatus || "idle";
          badge.dataset.builderTuiStatus = state.tuiStatus || "idle";
        }
        var status = document.querySelector("[data-builder-tui-status]");
        if (status) status.dataset.builderTuiStatus = state.tuiStatus || "idle";
      }

      function sendTuiResize() {
        if (!tuiSocket || tuiSocket.readyState !== WebSocket.OPEN) return;
        var mount = document.getElementById("tuiTerminalMount");
        var cols = 100;
        var rows = 28;
        if (mount) {
          cols = Math.max(40, Math.min(160, Math.floor(mount.clientWidth / 8)));
          rows = Math.max(12, Math.min(60, Math.floor(mount.clientHeight / 17)));
        }
        tuiSocket.send(JSON.stringify({ type: "resize", cols: cols, rows: rows }));
      }

      function connectTuiSocket(sessionID) {
        if (tuiSocket) {
          try { tuiSocket.close(); } catch (error) {}
        }
        var endpoint = new URL(tuiEndpoint("/" + encodeURIComponent(sessionID) + "/socket"), window.location.href);
        endpoint.protocol = endpoint.protocol === "https:" ? "wss:" : "ws:";
        tuiSocket = new WebSocket(endpoint.toString());
        state.tuiSocketState = "connecting";
        tuiSocket.onopen = function () {
          state.tuiSocketState = "open";
          state.tuiMessage = "WebSocket open";
          renderRight();
          sendTuiResize();
        };
        tuiSocket.onmessage = function (message) {
          var event;
          try {
            event = JSON.parse(message.data);
          } catch (error) {
            state.tuiError = "Invalid TUI WebSocket message";
            renderRight();
            return;
          }
          if (event.type === "output" && typeof event.data === "string") {
            appendTuiOutput(event.data);
            return;
          }
          if (event.type === "status" && event.session) {
            state.tuiSession = event.session;
            state.tuiStatus = event.session.state || state.tuiStatus;
            state.tuiError = event.session.lastError || "";
            renderRight();
            return;
          }
          if (event.type === "error") {
            state.tuiError = event.error || t("tui.error");
            state.tuiStatus = "failed";
            renderRight();
            return;
          }
          if (event.type === "close") {
            state.tuiSocketState = "closed";
            if (state.tuiStatus === "running") state.tuiStatus = "stopped";
            renderRight();
          }
        };
        tuiSocket.onerror = function () {
          state.tuiError = t("tui.error");
          state.tuiStatus = "failed";
          renderRight();
        };
        tuiSocket.onclose = function () {
          state.tuiSocketState = "closed";
          renderRight();
        };
      }

      function runTuiAction(action) {
        syncTuiFields();
        syncActivationFields();
        if (action === "open") {
          if (state.tuiOpen) {
            state.tuiOpen = false;
            state.rightPanelCard = "status";
            renderRight();
            return;
          }
          state.tuiOpen = true;
          state.rightPanelCard = "tui";
          if (state.tuiSession && state.tuiSession.sessionID) {
            renderRight();
            var mount = document.getElementById("tuiTerminalMount");
            if (mount && mount.focus) mount.focus();
            return;
          }
          action = "start";
        }
        if (action === "profile-status") {
          if (state.tuiSession && state.tuiSession.profileName) state.activationName = state.tuiSession.profileName;
          state.tuiOpen = false;
          state.rightPanelCard = "status";
          state.inspectorTab = "activation";
          state.detailsOpen = true;
          renderRight();
          runActivationAction("status");
          return;
        }
        if (action === "clear") {
          state.tuiOpen = true;
          state.rightPanelCard = "tui";
          state.tuiTranscript = "";
          state.tuiLogs = "";
          if (tuiTerminal && tuiTerminal.clear) tuiTerminal.clear();
          renderRight();
          return;
        }
        if (action === "copy") {
          if (navigator.clipboard && state.tuiTranscript) navigator.clipboard.writeText(state.tuiTranscript);
          return;
        }
        if (action === "save") {
          var record = {
            savedAt: new Date().toISOString(),
            session: state.tuiSession,
            transcript: state.tuiTranscript,
            logs: state.tuiLogs
          };
          var blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
          var link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "helix-tui-session-" + (state.tuiSession && state.tuiSession.sessionID ? state.tuiSession.sessionID : "draft") + ".json";
          link.click();
          URL.revokeObjectURL(link.href);
          return;
        }
        if (!state.workspaceStarted) {
          state.tuiOpen = true;
          state.rightPanelCard = "tui";
          state.tuiError = t("start.blueprintTitle");
          state.tuiMessage = t("start.blueprintBody");
          renderRight();
          return;
        }
        if (!server.online || !server.harnessTuiSessionsUrl || !window.fetch) {
          state.tuiOpen = true;
          state.rightPanelCard = "tui";
          state.tuiError = t("tui.static");
          renderRight();
          return;
        }
        var compile = compileState();
        if ((action === "start" || action === "restart") && compile.status !== "passed") {
          state.tuiOpen = true;
          state.rightPanelCard = "tui";
          state.tuiStatus = "idle";
          state.tuiError = compile.message;
          state.tuiLogs = compileLogText(compile);
          renderRight();
          return;
        }
        var sessionID = state.tuiSession && state.tuiSession.sessionID;
        state.tuiOpen = true;
        state.rightPanelCard = "tui";
        state.tuiBusy = true;
        state.tuiError = "";
        state.tuiMessage = action === "start" ? t("tui.starting") : "";
        renderRight();
        var request;
        if (action === "start") {
          state.tuiTranscript = "";
          state.tuiLogs = "";
          var currentCoverage = coverage();
          var currentValidation = validationStatus(currentCoverage);
          if (currentValidation.status !== "ready") {
            state.tuiLogs = currentValidation.summary + "\\n" + currentValidation.action;
            state.tuiMessage = currentValidation.summary;
          }
          request = tuiFetch("POST", server.harnessTuiSessionsUrl, {
            source: state.tuiMode,
            providerMode: state.tuiProviderMode,
            recipe: state.tuiMode === "draft-recipe" ? exportRecipe() : undefined,
            profileName: state.tuiMode === "installed-profile" ? activationProfileName() : undefined,
            cwd: state.activationWorkspaceDir,
            storageDir: state.activationStorageDir
          }).then(function (payload) {
            state.tuiSession = payload;
            state.tuiStatus = payload.state || "starting";
            state.tuiMessage = payload.sessionID || "";
            renderRight();
            if (payload.sessionID) connectTuiSocket(payload.sessionID);
            return payload;
          });
        } else if (action === "stop" && sessionID) {
          request = tuiFetch("DELETE", tuiEndpoint("/" + encodeURIComponent(sessionID))).then(function (payload) {
            state.tuiSession = payload;
            state.tuiStatus = payload.state || "stopped";
            state.tuiMessage = t("tui.stopped");
            if (tuiSocket) tuiSocket.close();
            return payload;
          });
        } else if (action === "restart" && sessionID) {
          state.tuiTranscript = "";
          request = tuiFetch("POST", tuiEndpoint("/" + encodeURIComponent(sessionID) + "/restart"), {}).then(function (payload) {
            state.tuiSession = payload;
            state.tuiStatus = payload.state || "starting";
            connectTuiSocket(payload.sessionID || sessionID);
            return payload;
          });
        } else if (action === "interrupt" && sessionID) {
          if (tuiSocket && tuiSocket.readyState === WebSocket.OPEN) {
            tuiSocket.send(JSON.stringify({ type: "interrupt" }));
            request = Promise.resolve(state.tuiSession);
          } else {
            request = tuiFetch("POST", tuiEndpoint("/" + encodeURIComponent(sessionID) + "/interrupt"), {});
          }
        } else if (action === "logs" && sessionID) {
          request = tuiFetch("GET", tuiEndpoint("/" + encodeURIComponent(sessionID) + "/logs")).then(function (payload) {
            state.tuiLogs = payload && typeof payload.text === "string" ? payload.text : JSON.stringify(payload, null, 2);
            return payload;
          });
        } else {
          request = Promise.resolve(null);
        }
        request.catch(function (error) {
          state.tuiError = error && error.message ? error.message : String(error);
          state.tuiStatus = "failed";
        }).finally(function () {
          state.tuiBusy = false;
          renderRight();
        });
      }

      function loadTuiSessions() {
        if (!server.online || !server.harnessTuiSessionsUrl || !window.fetch) return;
        tuiFetch("GET", server.harnessTuiSessionsUrl).then(function (payload) {
          var sessions = payload && Array.isArray(payload.sessions) ? payload.sessions : [];
          var session = sessions.find(function (item) { return item.state === "running"; }) || sessions[0];
          if (!session) return;
          state.tuiSession = session;
          state.tuiStatus = session.state || "idle";
          state.tuiTranscript = session.outputTail || state.tuiTranscript;
          if (session.state === "running" && session.sessionID) connectTuiSocket(session.sessionID);
          renderRight();
        }).catch(function () {
          state.tuiMessage = "";
        });
      }

      function saveRightPanelWidth() {
        try {
          if (window.localStorage) window.localStorage.setItem("helix.builder.rightPanelWidth", String(state.rightPanelWidth));
        } catch (error) {
          // Local storage can be unavailable in strict browser contexts.
        }
      }

      function setRightPanelWidth(nextWidth, persist) {
        state.rightPanelWidth = clampRightPanelWidth(nextWidth);
        applyRightPanelWidth();
        sendTuiResize();
        if (persist) saveRightPanelWidth();
      }

      function startRightPanelResize(event, handle) {
        if (!handle) return;
        event.preventDefault();
        rightPanelDrag = {
          startX: event.clientX,
          startWidth: state.rightPanelWidth
        };
        state.rightPanelResizing = true;
        document.body.dataset.builderRightPanelResizing = "true";
        if (handle.setPointerCapture && event.pointerId != null) {
          try { handle.setPointerCapture(event.pointerId); } catch (error) {}
        }
      }

      function moveRightPanelResize(event) {
        if (!rightPanelDrag) return;
        event.preventDefault();
        var delta = event.clientX - rightPanelDrag.startX;
        setRightPanelWidth(rightPanelDrag.startWidth - delta, false);
      }

      function stopRightPanelResize() {
        if (!rightPanelDrag) return;
        rightPanelDrag = null;
        state.rightPanelResizing = false;
        delete document.body.dataset.builderRightPanelResizing;
        setRightPanelWidth(state.rightPanelWidth, true);
      }

      document.addEventListener("input", function (event) {
        if (event.target && event.target.dataset && event.target.dataset.tuiField) {
          state[event.target.dataset.tuiField] = event.target.value;
          renderRight();
          return;
        }
        if (event.target && event.target.dataset && event.target.dataset.activationField) {
          state[event.target.dataset.activationField] = event.target.value;
          return;
        }
        if (event.target && event.target.id === "atomSearch") {
          state.query = event.target.value;
          state.previewBundle = "";
          state.previewAction = "";
          state.previewPinned = false;
        }
        renderPalette();
        renderBoard();
        renderRight();
      });
      document.addEventListener("change", function (event) {
        if (event.target && event.target.dataset && event.target.dataset.activationField) {
          state[event.target.dataset.activationField] = event.target.value;
          return;
        }
        if (event.target && event.target.id === "flowProductSelect") {
          setFlowProduct(event.target.value);
          return;
        }
        if (event.target && event.target.id === "flowNativeArtifactPathInput") {
          setFlowNativeArtifactPath(event.target.value);
          return;
        }
        if (event.target && event.target.id === "libraryModeFilter") state.libraryMode = event.target.value;
        if (event.target && event.target.id === "planeFilter") state.plane = event.target.value;
        if (event.target && event.target.id === "scopeFilter") state.scope = event.target.value;
        if (event.target && event.target.id === "viewFilter") state.view = event.target.value;
        if (event.target && ["libraryModeFilter", "planeFilter", "scopeFilter", "viewFilter"].includes(event.target.id)) {
          state.previewBundle = "";
          state.previewAction = "";
          state.previewPinned = false;
        }
        renderPalette();
        renderBoard();
        renderRight();
      });
      document.addEventListener("change", function (event) {
        if (!event.target || event.target.id !== "recipeImport") return;
        var file = event.target.files && event.target.files[0];
        if (!file) return;
        file.text().then(function (text) {
          importRecipe(JSON.parse(text));
        }).catch(function (error) {
          document.getElementById("warningList").innerHTML = '<div class="warning">' + h(error && error.message ? error.message : String(error)) + '</div>';
        });
      });
      document.addEventListener("pointerdown", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        var handle = source && source.closest ? source.closest("[data-builder-layout-resizer]") : null;
        if (handle) startRightPanelResize(event, handle);
      });
      document.addEventListener("pointermove", moveRightPanelResize);
      document.addEventListener("pointerup", stopRightPanelResize);
      document.addEventListener("pointercancel", stopRightPanelResize);
      document.addEventListener("pointerup", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        if (source && source.closest && source.closest("[data-info-help]")) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        var bundleAction = source && source.closest ? source.closest("[data-add-bundle], [data-remove-bundle], [data-complete-bundle], [data-replace-bundle], [data-replace-family-bundle], [data-show-bundle]") : null;
        if (bundleAction) {
          event.preventDefault();
          if (bundleAction.dataset.addBundle) { addBundleToSelection(bundleAction.dataset.addBundle); return; }
          if (bundleAction.dataset.removeBundle) { removeBundleFromSelection(bundleAction.dataset.removeBundle); return; }
          if (bundleAction.dataset.completeBundle) { addBundleToSelection(bundleAction.dataset.completeBundle); return; }
          if (bundleAction.dataset.replaceBundle) { addBundleToSelection(bundleAction.dataset.replaceBundle); return; }
          if (bundleAction.dataset.replaceFamilyBundle) { addBundleToSelection(bundleAction.dataset.replaceFamilyBundle); return; }
          if (bundleAction.dataset.showBundle) { state.previewBundle = ""; state.previewAction = ""; state.previewPinned = false; state.pendingBinding = null; state.inspectorTab = "blueprint"; state.activeBundle = bundleAction.dataset.showBundle; state.activeAtom = ""; state.activePort = ""; state.activeSlot = ""; state.activeDetailKind = "bundle"; renderRight(); return; }
        }
        var previewTile = source && source.closest ? source.closest("[data-preview-bundle]") : null;
        if (previewTile && previewTile.dataset.previewBundle) {
          event.preventDefault();
          var pointerPreviewBundle = bundleByID.get(previewTile.dataset.previewBundle);
          setBundlePreview(previewTile.dataset.previewBundle, pointerPreviewBundle ? bundlePreviewAction(pointerPreviewBundle) : "install", true);
          renderPalette();
          return;
        }
        var target = source && source.closest ? source.closest("button, .atom-tile") : null;
        if (!target) return;
        if (target.dataset.inspectorTab) {
          event.preventDefault();
          state.inspectorTab = target.dataset.inspectorTab;
          renderRight();
          return;
        }
        if (target.dataset.promoteBundle) {
          event.preventDefault();
          promoteSelectedAtomsToBundle(target.dataset.promoteBundle);
          return;
        }
        var addAtom = addAtomFromTarget(target);
        if (addAtom) {
          event.preventDefault();
          addAtomToSelection(addAtom);
          return;
        }
        if (target.dataset.remove) {
          event.preventDefault();
          previewRemoveAtom(target.dataset.remove);
          return;
        }
        if (target.dataset.portSelect) {
          event.preventDefault();
          selectPort(target.dataset.portSelect);
        }
      });
      document.addEventListener("pointerover", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        var help = source && source.closest ? source.closest("[data-info-help]") : null;
        if (help) {
          showFloatingHelp(help);
          return;
        }
        var tile = source && source.closest ? source.closest("[data-preview-bundle]") : null;
        if (!tile || !tile.dataset.previewBundle) return;
        if (state.previewPinned && state.previewBundle === tile.dataset.previewBundle) return;
        if (state.previewBundle === tile.dataset.previewBundle && !state.previewPinned) return;
        var bundle = bundleByID.get(tile.dataset.previewBundle);
        setBundlePreview(tile.dataset.previewBundle, bundle ? bundlePreviewAction(bundle) : "install", false);
      });
      document.addEventListener("pointerout", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        var help = source && source.closest ? source.closest("[data-info-help]") : null;
        if (!help) return;
        var related = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest("[data-info-help]") : null;
        if (related === help) return;
        hideFloatingHelp();
      });
      document.addEventListener("focusin", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        var help = source && source.closest ? source.closest("[data-info-help]") : null;
        if (help) {
          showFloatingHelp(help);
          return;
        }
        var tile = source && source.closest ? source.closest("[data-preview-bundle]") : null;
        if (!tile || !tile.dataset.previewBundle) return;
        if (state.previewPinned && state.previewBundle === tile.dataset.previewBundle) return;
        var bundle = bundleByID.get(tile.dataset.previewBundle);
        setBundlePreview(tile.dataset.previewBundle, bundle ? bundlePreviewAction(bundle) : "install", false);
      });
      document.addEventListener("focusout", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        if (source && source.closest && source.closest("[data-info-help]")) hideFloatingHelp();
      });
      window.addEventListener("scroll", hideFloatingHelp, true);
      window.addEventListener("resize", hideFloatingHelp);
      window.addEventListener("resize", applyRightPanelWidth);
      window.addEventListener("resize", sendTuiResize);
      document.addEventListener("keydown", function (event) {
        var keySource = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        var resizeHandle = keySource && keySource.closest ? keySource.closest("[data-builder-layout-resizer]") : null;
        if (resizeHandle && ["ArrowLeft", "ArrowRight", "PageUp", "PageDown"].includes(event.key)) {
          event.preventDefault();
          var step = event.key === "PageUp" || event.key === "PageDown" ? 72 : 24;
          setRightPanelWidth(state.rightPanelWidth + (event.key === "ArrowLeft" || event.key === "PageUp" ? step : -step), true);
          return;
        }
        if (event.key === "Escape" && state.detailsOpen) {
          state.inspectorTab = "blueprint";
          state.detailsOpen = false;
          renderRight();
          var detailsButton = document.getElementById("detailsOpenButton");
          if (detailsButton && detailsButton.focus) detailsButton.focus();
        }
      });
      document.addEventListener("click", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        if (source && source.closest && source.closest("[data-info-help]")) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (
          source &&
          source.closest &&
          state.flowDockState === "expanded" &&
          !state.flowPinned &&
          source.closest("#builderLayout") &&
          !source.closest("#flowObserverDock")
        ) {
          state.flowDockState = "collapsed";
          renderFlowObserver();
        }
        var bundleAction = source && source.closest ? source.closest("[data-add-bundle], [data-remove-bundle], [data-complete-bundle], [data-replace-bundle], [data-replace-family-bundle], [data-show-bundle]") : null;
        var previewTile = source && source.closest ? source.closest("[data-preview-bundle]") : null;
        var target = bundleAction || (source && source.closest ? source.closest("button, .atom-tile, [data-slot-select], [data-flow-node], [data-flow-stage-list-node]") : null) || previewTile;
        if (!target) return;
        if (target.closest && target.closest(".more-menu-popover")) {
          var moreMenu = document.getElementById("moreMenu");
          if (moreMenu) moreMenu.open = false;
        }
        if (target.dataset.flowStageListNode) {
          state.flowActiveNode = target.dataset.flowStageListNode;
          renderFlowObserver();
          return;
        }
        if (target.dataset.flowNode) {
          state.flowActiveNode = target.dataset.flowNode;
          renderFlowObserver();
          return;
        }
        if (target.dataset.builderDetailsOpen) {
          state.detailsSection = target.dataset.builderDetailsSectionTarget || state.detailsSection || "materials";
          state.inspectorTab = "details";
          state.detailsOpen = true;
          renderRight();
          revealDetailsSection(state.detailsSection, true);
          return;
        }
        if (target.dataset.builderDetailsClose) {
          state.inspectorTab = "blueprint";
          state.detailsOpen = false;
          renderRight();
          var openButton = document.getElementById("detailsOpenButton");
          if (openButton && openButton.focus) openButton.focus();
          return;
        }
        if (target.dataset.builderDetailsSectionTarget) {
          state.detailsSection = target.dataset.builderDetailsSectionTarget || "materials";
          state.inspectorTab = "details";
          state.detailsOpen = true;
          renderRight();
          revealDetailsSection(state.detailsSection, false);
          return;
        }
        if (target.dataset.action === "toggle-locale") {
          state.locale = state.locale === "zh" ? "en" : "zh";
          try {
            if (window.localStorage) window.localStorage.setItem("helix.builder.locale", state.locale);
          } catch (error) {
            // Local storage can be unavailable in strict browser contexts.
          }
          render();
          return;
        }
        if (target.dataset.inspectorTab) {
          state.inspectorTab = target.dataset.inspectorTab;
          renderRight();
          return;
        }
        if (target.dataset.builderFamilyWinner && target.dataset.builderFamilyWinnerBundle) {
          chooseFamilyWinner(target.dataset.builderFamilyWinner, target.dataset.builderFamilyWinnerBundle);
          return;
        }
        if (target.dataset.assemblyView) {
          setAssemblyView(target.dataset.assemblyView);
          return;
        }
        if (target.dataset.action === "run-open") { state.runOpen = true; renderRunModal(); return; }
        if (target.dataset.action === "run-cancel") { state.runOpen = false; renderRunModal(); return; }
        if (target.dataset.action === "run-start") { runHarnessLive(); return; }
        if (target.dataset.action === "compile-harness") { compileCurrentHarness(); return; }
        if (target.dataset.action === "flow-observer-blueprint") {
          if (!state.flowStandalone) { openFlowObserverWindow("blueprint"); return; }
          setFlowMode("blueprint");
          return;
        }
        if (target.dataset.action === "flow-observer-trace") {
          if (!state.flowStandalone) { openFlowObserverWindow("trace"); return; }
          setFlowMode("trace");
          return;
        }
        if (target.dataset.action === "flow-observer-toggle") {
          if (!state.flowStandalone) { openFlowObserverWindow(state.flowMode || "blueprint"); return; }
          state.flowDockState = state.flowDockState === "collapsed" ? "expanded" : "collapsed";
          renderFlowObserver();
          return;
        }
        if (target.dataset.action === "flow-observer-pin") {
          state.flowPinned = !state.flowPinned;
          renderFlowObserver();
          return;
        }
        if (target.dataset.action === "flow-observer-fullscreen") {
          if (state.flowStandalone) return;
          state.flowDockState = state.flowDockState === "fullscreen" ? "expanded" : "fullscreen";
          renderFlowObserver();
          return;
        }
        if (target.dataset.action === "flow-prompt-debug") {
          state.flowPromptDebug = !state.flowPromptDebug;
          renderFlowObserver();
          return;
        }
        if (target.dataset.action === "flow-observer-compare") {
          if (!state.flowStandalone) { openFlowObserverWindow("compare"); return; }
          setFlowMode(state.flowMode === "compare" ? "blueprint" : "compare");
          return;
        }
        if (target.dataset.action === "flow-compare-layout") {
          if (target.dataset.flowCompareLayout === "side-by-side" || target.dataset.flowCompareLayout === "overlay" || target.dataset.flowCompareLayout === "diff-table") {
            state.flowCompareLayout = target.dataset.flowCompareLayout;
            if (!state.flowStandalone) { openFlowObserverWindow("compare"); return; }
            if (state.flowDockState === "collapsed") state.flowDockState = "expanded";
            if (state.flowMode !== "compare") setFlowMode("compare");
            else renderFlowObserver();
          }
          return;
        }
        if (target.dataset.action === "flow-lane-filter") {
          var lane = target.dataset.flowLaneFilter;
          if (FLOW_LANES.includes(lane)) {
            var nextHidden = !state.flowHiddenLanes[lane];
            if (nextHidden && visibleFlowLaneCount() <= 1) return;
            state.flowHiddenLanes[lane] = nextHidden;
            if (state.flowActiveNode) {
              var currentGraph = flowGraphFromArtifact(flowArtifact());
              var activeNode = currentGraph && currentGraph.nodes ? currentGraph.nodes.find(function (node) { return node.id === state.flowActiveNode; }) : null;
              if (activeNode && !flowLaneVisible(activeNode.lane)) state.flowActiveNode = "";
            }
            renderFlowObserver();
          }
          return;
        }
        if (target.dataset.action === "flow-observer-native") {
          if (!state.flowStandalone) { openFlowObserverWindow("native"); return; }
          setFlowMode(state.flowMode === "native" ? "blueprint" : "native");
          return;
        }
        if (target.dataset.action === "right-card-status") { state.tuiOpen = false; state.rightPanelCard = "status"; renderRight(); return; }
        if (target.dataset.action === "right-card-flow") {
          openFlowObserverWindow(state.flowMode || "blueprint");
          return;
        }
        if (target.dataset.action === "right-card-tui") {
          state.tuiOpen = true;
          state.rightPanelCard = "tui";
          renderRight();
          return;
        }
        if (target.dataset.action === "activation-install") { runActivationAction("install"); return; }
        if (target.dataset.action === "activation-provider") { runActivationAction("provider"); return; }
        if (target.dataset.action === "activation-telegram") { runActivationAction("telegram"); return; }
        if (target.dataset.action === "activation-status") { runActivationAction("status"); return; }
        if (target.dataset.action === "activation-logs") { runActivationAction("logs"); return; }
        if (target.dataset.action === "activation-smoke") { runActivationAction("smoke"); return; }
        if (target.dataset.action === "activation-start") { runActivationAction("start"); return; }
        if (target.dataset.action === "activation-restart") { runActivationAction("restart"); return; }
        if (target.dataset.action === "activation-stop") { runActivationAction("stop"); return; }
        if (target.dataset.action === "tui-start") { runTuiAction("start"); return; }
        if (target.dataset.action === "tui-stop") { runTuiAction("stop"); return; }
        if (target.dataset.action === "tui-restart") { runTuiAction("restart"); return; }
        if (target.dataset.action === "tui-interrupt") { runTuiAction("interrupt"); return; }
        if (target.dataset.action === "tui-clear") { runTuiAction("clear"); return; }
        if (target.dataset.action === "tui-copy") { runTuiAction("copy"); return; }
        if (target.dataset.action === "tui-save") { runTuiAction("save"); return; }
        if (target.dataset.action === "tui-logs") { runTuiAction("logs"); return; }
        if (target.dataset.action === "tui-profile-status") { runTuiAction("profile-status"); return; }
        if (target.dataset.action === "remove-impact-cancel") { state.removeImpactOpen = false; state.removeImpactBusy = false; renderRemoveImpactModal(); renderRight(); return; }
        if (target.dataset.action === "remove-impact-confirm") { confirmRemoveImpact(); return; }
        if (target.dataset.action === "remove-impact-bundle") { removeImpactBundle(); return; }
        if (target.dataset.action === "remove-impact-focus") { focusRemoveImpactPort(); return; }
        if (target.dataset.removePreview) { previewRemoveAtom(target.dataset.removePreview); return; }
        if (target.dataset.previewCancel) { clearBundlePreview(true); return; }
        if (target.dataset.previewReplaceFamily) { replaceBundleFamily(target.dataset.previewReplaceFamily, state.activeSlot); return; }
        if (target.dataset.previewInstall) { installBundleIntoSlot(target.dataset.previewInstall, state.activeSlot); return; }
        if (target.dataset.previewRemove) { uninstallBundleFromSlot(target.dataset.previewRemove, state.activeSlot); return; }
        if (target.dataset.bindingPreviewCancel) { state.pendingBinding = null; if (state.inspectorTab === "preview") state.inspectorTab = "blueprint"; render(); return; }
        if (target.dataset.bindingPreviewConfirm) { confirmSlotProviderReplacement(); return; }
        if (target.dataset.promoteBundle) { promoteSelectedAtomsToBundle(target.dataset.promoteBundle); return; }
        if (target.dataset.addBundle) { addBundleToSelection(target.dataset.addBundle); return; }
        if (target.dataset.removeBundle) { removeBundleFromSelection(target.dataset.removeBundle); return; }
        if (target.dataset.completeBundle) { addBundleToSelection(target.dataset.completeBundle); return; }
        if (target.dataset.replaceBundle) { addBundleToSelection(target.dataset.replaceBundle); return; }
        if (target.dataset.replaceFamilyBundle) { addBundleToSelection(target.dataset.replaceFamilyBundle); return; }
        if (target.dataset.showBundle) { state.previewBundle = ""; state.previewAction = ""; state.previewPinned = false; state.pendingBinding = null; state.inspectorTab = "blueprint"; state.activeBundle = target.dataset.showBundle; state.activeAtom = ""; state.activePort = ""; state.activeSlot = ""; state.activeDetailKind = "bundle"; renderRight(); return; }
        if (target.dataset.laneToggleStage) {
          var toggleStageID = target.dataset.laneToggleStage;
          if (state.collapsedStages.has(toggleStageID)) state.collapsedStages.delete(toggleStageID);
          else state.collapsedStages.add(toggleStageID);
          renderBoard();
          return;
        }
        if (target.dataset.slotToggleAtoms) {
          var toggleSlotID = target.dataset.slotToggleAtoms;
          if (state.expandedSlots.has(toggleSlotID)) state.expandedSlots.delete(toggleSlotID);
          else state.expandedSlots.add(toggleSlotID);
          state.pendingScrollSlot = toggleSlotID;
          renderBoard();
          return;
        }
        if (target.dataset.slotSelect) { selectSlot(target.dataset.slotSelect); return; }
        if (target.dataset.previewBundle) {
          var previewBundle = bundleByID.get(target.dataset.previewBundle);
          setBundlePreview(target.dataset.previewBundle, previewBundle ? bundlePreviewAction(previewBundle) : "install", true);
          renderPalette();
          return;
        }
        if (target.dataset.action === "new") { state.wizardOpen = true; state.wizardProfile = "bare"; renderWizard(); }
        if (target.dataset.action === "show-start") { resetToStart(); render(); }
        if (target.dataset.action === "wizard-cancel") { state.wizardOpen = false; renderWizard(); }
        if (target.dataset.wizardProduct || target.dataset.wizardTarget) {
          var productID = target.dataset.wizardProduct || target.dataset.wizardTarget;
          var product = WIZARD_PRODUCTS.find(function (item) { return item.id === productID; });
          if (product) {
            state.wizardProduct = product.id;
            renderWizard();
          }
        }
        if (target.dataset.wizardProfile) { state.wizardProfile = target.dataset.wizardProfile; renderWizard(); }
        if (target.dataset.action === "wizard-create") createWizardRecipe();
        if (target.dataset.guideToggle) {
          if (state.guideToggleClickSuppressed) {
            state.guideToggleClickSuppressed = false;
            return;
          }
          state.guideCollapsed = !state.guideCollapsed;
          renderBoard();
          return;
        }
        if (target.dataset.guideStage) { focusStage(target.dataset.guideStage); render(); }
        if (target.dataset.action === "guide-back") moveGuide(-1);
        if (target.dataset.action === "guide-next") moveGuide(1);
        if (target.dataset.action === "guide-exit") { state.guideActive = false; state.guideStage = ""; render(); }
        if (target.dataset.preset) loadPreset(target.dataset.preset);
        var addAtom = addAtomFromTarget(target);
        if (addAtom) addAtomToSelection(addAtom);
        if (target.dataset.remove) { previewRemoveAtom(target.dataset.remove); return; }
        if (target.dataset.bindPort && target.dataset.bindProvider) {
          requestSlotProviderReplacement(target.dataset.replaceSlot || "", target.dataset.bindPort, target.dataset.bindProvider);
        }
        if (target.dataset.slotAtomId) {
          state.previewBundle = "";
          state.previewAction = "";
          state.previewPinned = false;
          state.pendingBinding = null;
          state.inspectorTab = "blueprint";
          state.activeAtom = target.dataset.slotAtomId;
          state.activeBundle = "";
          state.activeSlot = target.dataset.builderSlotAtomSlot || state.activeSlot;
          var atomSlot = state.activeSlot ? slotByID.get(state.activeSlot) : null;
          state.activePort = atomSlot ? atomSlot.primaryPortID : "";
          state.activeDetailKind = "atom";
          render();
          return;
        }
        if (target.dataset.atomId) { state.previewBundle = ""; state.previewAction = ""; state.previewPinned = false; state.pendingBinding = null; state.inspectorTab = "blueprint"; state.activeAtom = target.dataset.atomId; state.activePort = ""; state.activeBundle = ""; state.activeSlot = ""; state.activeDetailKind = "atom"; renderRight(); }
        if (target.dataset.portSelect) { selectPort(target.dataset.portSelect); }
        if (target.dataset.action === "clear") { resetToStart(); render(); }
        if (target.dataset.action === "import") document.getElementById("recipeImport").click();
        if (target.dataset.action === "save") saveRecipeDraft();
        if (target.dataset.copyCommand) {
          var command = builderCommands().find(function (item) { return item.id === target.dataset.copyCommand; });
          if (command && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(command.command);
        }
        if (target.dataset.copyRawRecipe) {
          var exportElement = document.getElementById("exportText");
          if (exportElement && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(exportElement.value);
          return;
        }
        if (target.dataset.action === "download") {
          var blob = new Blob([document.getElementById("exportText").value], { type: "application/json" });
          var link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = recipeFileName();
          link.click();
          URL.revokeObjectURL(link.href);
        }
      });
      document.addEventListener("dragstart", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        if (source && source.closest && source.closest("button")) return;
        var tile = source && source.closest ? source.closest("[data-drag-atom]") : null;
        if (!tile) return;
        state.draggedAtom = tile.dataset.dragAtom || "";
        event.dataTransfer.setData("text/plain", state.draggedAtom);
      });
      document.addEventListener("dragover", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        if (source && source.closest && source.closest("[data-drop-plane]")) event.preventDefault();
      });
      document.addEventListener("dragenter", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        var lane = source && source.closest ? source.closest("[data-drop-plane]") : null;
        if (lane) lane.dataset.dropActive = "true";
      });
      document.addEventListener("dragleave", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        var lane = source && source.closest ? source.closest("[data-drop-plane]") : null;
        if (lane) lane.dataset.dropActive = "false";
      });
      document.addEventListener("drop", function (event) {
        var source = event.target && event.target.closest ? event.target : event.target && event.target.parentElement;
        var lane = source && source.closest ? source.closest("[data-drop-plane]") : null;
        if (!lane) return;
        event.preventDefault();
        lane.dataset.dropActive = "false";
        var atomID = event.dataTransfer.getData("text/plain") || state.draggedAtom;
        if (atomID) {
          promotePresetToCustomDraft();
          state.workspaceStarted = true;
          state.selected.add(atomID);
          state.activeAtom = atomID;
          state.activeBundle = "";
          state.activeDetailKind = "atom";
          var atom = atomByID.get(atomID);
          var slot = atom && atom.provides.length ? slotForPort(atom.provides[0]) : null;
          if (slot) {
            state.activeSlot = slot.id;
            state.activePort = slot.primaryPortID;
          }
          render();
        }
      });

      if (typeof window !== "undefined" && window.location && window.location.search.indexOf("builderTestHooks=1") >= 0) {
        window.__HELIX_BUILDER_TEST_HOOKS__ = {
          DATA: DATA,
          state: state,
          atomByID: atomByID,
          bundleByID: bundleByID,
          previewBundleFamilyReplacement: previewBundleFamilyReplacement,
          familyConflicts: familyConflicts,
          activeFamilyBundleIDs: activeFamilyBundleIDs
        };
      }
      render();
      if (state.flowStandalone && state.flowMode !== "blueprint") setFlowMode(state.flowMode);
      if (!state.flowStandalone) {
        loadRunDefaults();
        loadTuiSessions();
      }
      var readyApp = document.querySelector("[data-harness-builder]");
      if (readyApp) readyApp.dataset.harnessBuilder = "ready";
      var loading = document.getElementById("builderLoading");
      if (loading) loading.hidden = true;
      }

      if (BOOTSTRAP && BOOTSTRAP.__harnessBuilderServer && BOOTSTRAP.__harnessBuilderServer.builderDataUrl) {
        (function loadBuilderData(attempt) {
          var controller = typeof AbortController === "function" ? new AbortController() : null;
          var timeout = window.setTimeout(function () {
            if (controller) controller.abort();
          }, 15000);
          fetch(BOOTSTRAP.__harnessBuilderServer.builderDataUrl, {
            headers: { "accept": "application/json" },
            signal: controller ? controller.signal : undefined
          }).then(function (response) {
            if (!response.ok) throw new Error("Builder data failed with HTTP " + response.status);
            return response.json();
          }).then(function (data) {
            window.clearTimeout(timeout);
            startBuilder(data, {
              online: true,
              recipeDraftsUrl: BOOTSTRAP.__harnessBuilderServer.recipeDraftsUrl || "",
              harnessRunsUrl: BOOTSTRAP.__harnessBuilderServer.harnessRunsUrl || "",
              harnessRunDefaultsUrl: BOOTSTRAP.__harnessBuilderServer.harnessRunDefaultsUrl || "",
              harnessImpactUrl: BOOTSTRAP.__harnessBuilderServer.harnessImpactUrl || "",
              harnessProfilesUrl: BOOTSTRAP.__harnessBuilderServer.harnessProfilesUrl || "",
              harnessTuiSessionsUrl: BOOTSTRAP.__harnessBuilderServer.harnessTuiSessionsUrl || "",
              harnessFlowUrl: BOOTSTRAP.__harnessBuilderServer.harnessFlowUrl || ""
            });
          }).catch(function (error) {
            window.clearTimeout(timeout);
            if (attempt < 3) {
              setBootMessage("Builder data was interrupted. Retrying...");
              window.setTimeout(function () { loadBuilderData(attempt + 1); }, attempt * 600);
              return;
            }
            bootError(error);
          });
        })(1);
      } else {
        startBuilder(BOOTSTRAP, { online: false, recipeDraftsUrl: "", harnessRunsUrl: "", harnessRunDefaultsUrl: "", harnessImpactUrl: "", harnessProfilesUrl: "", harnessTuiSessionsUrl: "", harnessFlowUrl: "" });
      }
    })();
  </script>
</body>
</html>`
}

function renderBuilderPresetButtons(data: HarnessBuilderData): string {
  return data.presets
    .map((preset) => {
      const targetRefs = preset.parityTargets.map((target) => `${target.product}@${target.ref}`).join(",")
      return `<button type="button" class="preset-button" data-preset="${escapeHTML(preset.id)}" data-builder-preset-button="${escapeHTML(preset.id)}" data-product="${escapeHTML(preset.product)}" data-builder-predefined="${escapeHTML(preset.product)}" data-builder-preset-claim="${escapeHTML(preset.assemblyClaim)}" data-builder-preset-composition-claim="${escapeHTML(preset.compositionClaim)}" data-builder-preset-parity-target-satisfied="${String(preset.parityTargetSatisfied)}" data-builder-preset-parity-targets="${escapeHTML(targetRefs)}" data-builder-preset-evidence-policy="${escapeHTML(preset.evidencePolicy)}" data-builder-preset-native-parity="${String(preset.nativeParityVerified)}" data-builder-preset-compile-status="${escapeHTML(preset.compileStatus)}" aria-pressed="false">
            <span><strong>${escapeHTML(preset.label)}</strong></span>
          </button>`
    })
    .join("")
}

const implementationLabels: Record<HarnessBuilderImplementationLevel, string> = {
  native: "Native",
  "native-like": "Native-like",
  "profile-compatible": "Profile compatible",
  "compatible-bridge": "Compatible bridge",
  "preview-shell": "Preview shell",
  "metadata-only": "Metadata only",
  "common-shared": "Common shared",
}

const implementationStateOrder: HarnessBuilderImplementationLevel[] = [
  "native",
  "native-like",
  "profile-compatible",
  "compatible-bridge",
  "preview-shell",
  "metadata-only",
  "common-shared",
]

function harnessBuilderImplementationProfile(
  atom: Pick<
    HarnessBuilderAtom,
    | "id"
    | "kind"
    | "scope"
    | "productScope"
    | "stability"
    | "implementationKind"
    | "selectionReason"
    | "provides"
    | "nativeEvidenceRefs"
    | "fixtureIDs"
    | "parityCoverage"
    | "knownLossiness"
  >,
): HarnessBuilderImplementationProfile {
  const level = harnessBuilderImplementationLevel(atom)
  return {
    level,
    label: implementationLabels[level],
    summary: harnessBuilderImplementationSummary(atom, level),
  }
}

function harnessBuilderImplementationLevel(
  atom: Pick<
    HarnessBuilderAtom,
    | "id"
    | "kind"
    | "scope"
    | "productScope"
    | "stability"
    | "implementationKind"
    | "selectionReason"
    | "provides"
    | "nativeEvidenceRefs"
    | "fixtureIDs"
    | "parityCoverage"
    | "knownLossiness"
  >,
): HarnessBuilderImplementationLevel {
  const id = atom.id.toLowerCase()
  if (atom.implementationKind === "metadata-only") return "metadata-only"
  if (atom.implementationKind === "preview") return "preview-shell"
  if (atom.implementationKind === "factory") {
    if (atom.scope === "common" || atom.productScope === "common" || id.startsWith("common.")) return "common-shared"
    if (hasHarnessBuilderNativeProof(atom)) return "native"
    if (isProductTurnProfileAtomID(id)) return "profile-compatible"
    if (isProductShellID(id, atom) && isPreviewShellID(id)) return "preview-shell"
    if (isProductShellID(id, atom)) return "compatible-bridge"
    return "compatible-bridge"
  }
  if (atom.scope === "fixture-only" || atom.scope === "reserved" || atom.stability === "native-fixture" || id.startsWith("test.") || id.includes(".mock")) return "metadata-only"
  if (id.includes(".native-like") || atom.kind === "cadence-policy" || atom.kind === "tool-cadence" || atom.kind === "message-part-projector" || atom.kind === "streaming-delta" || atom.kind === "runtime-acceptance") {
    return atom.productScope === "common" || id.startsWith("common.") ? "common-shared" : "native-like"
  }
  if (isMetadataOnlyAtomID(id)) return "metadata-only"
  if (atom.scope === "common" || atom.productScope === "common" || id.startsWith("common.")) return "common-shared"
  if (isProductTurnProfileAtomID(id)) return "profile-compatible"
  if (isProductShellID(id, atom) && isPreviewShellID(id)) return "preview-shell"
  if (isProductShellID(id, atom)) return "compatible-bridge"
  return "compatible-bridge"
}

function hasHarnessBuilderNativeProof(
  atom: Pick<HarnessBuilderAtom, "selectionReason" | "nativeEvidenceRefs" | "fixtureIDs" | "parityCoverage" | "knownLossiness">,
): boolean {
  if (atom.parityCoverage !== "native") return false
  if (atom.nativeEvidenceRefs.length === 0 || atom.fixtureIDs.length === 0 || atom.knownLossiness.length > 0) return false
  const reason = atom.selectionReason.toLowerCase()
  return reason.includes("native parity complete") || reason.includes("upstream native implementation")
}

function harnessBuilderImplementationSummary(
  atom: Pick<HarnessBuilderAtom, "id" | "kind" | "scope" | "productScope" | "stability" | "implementationKind" | "selectionReason" | "provides">,
  level: HarnessBuilderImplementationLevel,
): string {
  if (level === "native") return "Backed by a product-native implementation or pinned upstream parity evidence."
  if (level === "native-like" && isCadenceNativeLikeID(atom.id)) return "Product cadence projector is split from the common fallback and backed by partial replay plus side-effect order evidence; full native event timing and side effects are still unproven."
  if (level === "native-like" && isToolSchemaNativeLikeID(atom.id)) return "Product tool schema alias projection: canonical tool names, aliases, field names, and mutation class are approximated until native schema parity is proven."
  if (level === "native-like" && isToolResultProjectorNativeLikeID(atom.id)) return "Product tool result envelope projection: common LegoToolResult text is wrapped into a product-labeled envelope with partial result/progress event stream, envelope round-trip readback, and writeback timing evidence until native timing and full round-trip parity are proven."
  if (level === "native-like" && isProviderStreamingDeltaRecorderNativeLikeID(atom.id)) return "Provider streaming delta semantic projection: common provider stream events are bucketed into text/reasoning/tool-json/finish/part classes with partial raw-frame timeline and raw-payload round-trip evidence until native streaming timing parity is proven."
  if (level === "native-like" && isProviderStreamProjectorNativeLikeID(atom.id)) return "Provider stream projector semantic projection: normalized provider events are projected into product-labeled stream semantics with partial raw-frame retry/cancel timing and raw-payload round-trip evidence until native chunk protocol parity is proven."
  if (level === "native-like" && isSessionMessagePartProjectorNativeLikeID(atom.id)) return "Session message-part lossy projection: common transcript parts are mapped to product-labeled native/event part types with partial storage and provider metadata round-trip readback until native message-part parity is proven."
  if (level === "native-like" && isRuntimeAcceptanceNativeLikeID(atom.id)) return "Runtime native-like acceptance policy: product-labeled pass decisions and evidence timing share common tests, workspace-diff, tool-result checks, plus partial timing-boundary, lifecycle, and persistence/cleanup evidence until upstream accept/continue/fail timing parity is proven."
  if (level === "native-like") return "Product-labeled semantic approximation; keep lossiness visible until upstream parity is proven."
  if (level === "profile-compatible") return "Product-scoped turn atom backed by a shared Helix turn implementation plus product profile parameters; not native turn parity."
  if (
    level === "compatible-bridge" &&
    atom.selectionReason.toLowerCase().includes("product identity snapshot")
  ) {
    if (atom.id === "opencode.prompt.mode-builder") {
      return "OpenCode pinned prompt assets, skill resource policy, permission merge evidence, rendered system prompt fixture, upstream source/order matrix, upstream output matrix, SystemPrompt invocation boundary projection, and system prompt ordering snapshot are linked; full live upstream SystemPrompt invocation remains partial, so keep this as Compatible bridge rather than native prompt parity."
    }
    if (atom.id === "pi.prompt.coding-agent-builder") {
      return "Pi prompt family evidence covers custom prompts, extension context, mode prompts, theme workflow, cwd/date footer ordering, README path resolution, context file ordering, and upstream source/branch matrix anchors; full upstream native prompt family and CLI runtime remain partial, so keep this as Compatible bridge."
    }
    if (atom.id === "nanobot.prompt.agent-builder") {
      return "Nanobot bootstrap assets, upstream prompt source matrix, workspace template sync, skills index/cache, memory lifecycle evidence, platform prompt matrix, platform router rendering policy, channel registry source matrix, channel side-effect replay, and channel lifecycle/timing evidence are linked; live network/browser channel side effects remain partial, so keep this as Compatible bridge rather than native prompt parity."
    }
    if (atom.id === "hermes.prompt.agent-builder") {
      return "Hermes stable/context/volatile block order, prompt factory options, tool availability gating, platform registry hints, upstream registry source matrix, skills index/cache evidence, and promptware scanner evidence are linked; full live upstream prompt_builder registry and scanner source matrix remain partial, so keep this as Compatible bridge."
    }
    return "Product identity prompt snapshot is synced, but the full upstream prompt family is still partial; do not claim native prompt parity yet."
  }
  if (level === "compatible-bridge") return "Helix bridge or product-profile adapter; runnable, but not a native product implementation."
  if (level === "preview-shell" && isProductTuiPreviewID(atom.id)) return "Shared Helix TUI/event-loop preview; no native PTY transcript or product TUI parity is claimed."
  if (level === "preview-shell" && isProductWebPreviewID(atom.id)) return "Static Helix inspection dashboard / preview page; useful for inspection, not native Web UI parity."
  if (level === "preview-shell") return "Shared Helix product surface or static preview; useful for inspection, not native UI parity."
  if (level === "metadata-only") return "Catalog, fixture, descriptor, alias, default, or reserved metadata; do not count as an executable native implementation."
  return atom.scope === "common" ? "Common Helix atom shared across products." : "Shared atom used by multiple products."
}

function isProductTuiPreviewID(id: string): boolean {
  const normalized = id.toLowerCase()
  return normalized.endsWith(".tui.shell") || normalized.includes(".product-shell.tui")
}

function isProductWebPreviewID(id: string): boolean {
  const normalized = id.toLowerCase()
  return normalized.includes(".product-shell.web") || normalized.includes(".product-shell.web-ui") || normalized.includes(".product-shell.web-dashboard")
}

function isProductTurnProfileAtomID(id: string): boolean {
  const normalized = id.toLowerCase()
  return [
    "opencode.turn.",
    "pi.turn.",
    "nanobot.turn.",
    "hermes.turn.",
  ].some((prefix) => normalized.startsWith(prefix)) && [
    "input-normalizer",
    "context-builder",
    "prompt-assembler",
    "provider-request-builder",
    "provider-stream-runner",
    "stream-reducer",
    "tool-call-planner",
    "tool-executor",
    "result-recorder",
    "retry-policy",
    "continuation-policy",
    "compaction-policy",
    "stop-condition",
  ].some((suffix) => normalized.endsWith(`.turn.${suffix}`))
}

function isToolSchemaNativeLikeID(id: string): boolean {
  return /^(opencode|pi|nanobot|hermes)\.tools\.schema\.native-like$/.test(id.toLowerCase())
}

function isCadenceNativeLikeID(id: string): boolean {
  return /^(opencode|pi|nanobot|hermes)\.(agent-loop\.(request-boundary|final-summary)|tools\.batch-scheduler)\.native-like$/.test(id.toLowerCase())
}

function isToolResultProjectorNativeLikeID(id: string): boolean {
  return /^(opencode|pi|nanobot|hermes)\.tools\.result-projector\.native-like$/.test(id.toLowerCase())
}

function isProviderStreamingDeltaRecorderNativeLikeID(id: string): boolean {
  return /^(opencode|pi|nanobot|hermes)\.provider\.streaming-delta-recorder\.native-like$/.test(id.toLowerCase())
}

function isProviderStreamProjectorNativeLikeID(id: string): boolean {
  return /^(opencode|pi|nanobot|hermes)\.provider\.stream-projector\.native-like$/.test(id.toLowerCase())
}

function isSessionMessagePartProjectorNativeLikeID(id: string): boolean {
  return /^(opencode|pi|nanobot|hermes)\.session\.message-part-projector\.native-like$/.test(id.toLowerCase())
}

function isRuntimeAcceptanceNativeLikeID(id: string): boolean {
  return /^(opencode|pi|nanobot|hermes)\.runtime\.acceptance-(controller|evidence)\.native-like$/.test(id.toLowerCase())
}

function isProductShellID(id: string, atom?: Pick<HarnessBuilderAtom, "kind" | "provides">): boolean {
  return Boolean(atom && (atom.kind === "product-shell" || atom.provides.includes("product.shell"))) || id.includes(".product-shell.") || id.startsWith("product.shell.")
}

function isPreviewShellID(id: string): boolean {
  return [
    ".product-shell.tui",
    ".product-shell.web",
    ".product-shell.web-ui",
    ".product-shell.web-dashboard",
    ".product-shell.desktop",
    ".product-shell.browser-smoke",
    ".product-shell.control-plane",
    ".product-shell.workspace",
  ].some((part) => id.includes(part))
}

function isMetadataOnlyAtomID(id: string): boolean {
  return [
    ".runtime.module-aliases",
    ".runtime.capability-aliases",
    ".runtime.binding-defaults",
    ".runtime.lifecycle-defaults",
    ".runtime.graph-labels",
    ".block.compatibility-metadata",
    ".recipe.binding-aliases",
    ".resource.grant-defaults",
    ".conformance.product-gate",
    "provider.cassette",
    "provider.transport.mock-sse",
    "process-runner.disabled",
    "ui.renderer.noop",
  ].some((part) => id.includes(part))
}

function buildHarnessBuilderImplementationStates(atoms: HarnessBuilderAtom[]): HarnessBuilderImplementationStateSummary[] {
  return implementationStateOrder.map((level) => {
    const matching = atoms.filter((atom) => atom.implementationLevel === level)
    return {
      level,
      label: implementationLabels[level],
      count: matching.length,
      selectedCount: matching.filter((atom) => atom.selectedIn.length > 0).length,
      evidenceCount: matching.filter((atom) => atom.nativeEvidenceRefs.length > 0 || atom.fixtureIDs.length > 0).length,
      lossinessCount: matching.filter((atom) => atom.knownLossiness.length > 0).length,
      exampleAtomIDs: matching.slice(0, 8).map((atom) => atom.id),
    }
  })
}

export function buildHarnessBuilderData(data: DocsSiteData): HarnessBuilderData {
  const moduleConfirmation = buildHarnessBuilderModuleConfirmationIndex(data.currentModuleAudit)
  const moduleConfirmationByAtomID = new Map(moduleConfirmation?.atomConfirmations.map((confirmation) => [confirmation.atomID, confirmation]) ?? [])
  const atomMap = new Map<string, HarnessBuilderAtom>()
  const portMap = new Map<string, HarnessBuilderPort>()
  const bundleMap = new Map<string, HarnessBuilderBundle>()
  for (const bundle of defaultLegoBundleCatalog()) {
    bundleMap.set(bundle.id, {
      id: bundle.id,
      label: bundle.label,
      description: bundle.description,
      plane: bundle.plane,
      kind: bundle.kind,
      productScope: bundle.productScope,
      atoms: bundle.atoms,
      ports: bundle.ports,
      optionalAtomIDs: bundle.optionalAtomIDs ?? [],
      dependsOnBundles: bundle.dependsOnBundles ?? [],
      ...(bundle.exclusiveFamilyID
        ? {
            exclusiveFamilyID: bundle.exclusiveFamilyID,
            exclusiveFamilyLabel: bundle.exclusiveFamilyLabel,
            exclusiveFamilyPolicy: bundle.exclusiveFamilyPolicy,
            exclusiveFamilyPorts: bundle.exclusiveFamilyPorts ?? bundle.ports,
          }
        : {}),
      selectedIn: [],
      sourcePackage: bundle.source.packageName,
      sourceEvidence: bundle.source.evidence,
    })
  }
  const contractPresets = data.assemblyContracts.map((contract): HarnessBuilderPreset => {
    const recipe = harnessBuilderRecipeForContract(contract)
    const compileProfile = harnessBuilderCompileProfile(recipe)
    const presetClaim = presetAssemblyClaim(contract.product)
    const contractAtomByID = new Map(contract.atoms.map((atom) => [atom.id, atom]))
    return {
      id: contract.product,
      label: productLabel(contract.product),
      product: contract.product,
      recipeID: contract.recipeID,
      fingerprint: contract.fingerprints.contract,
      ...compileProfile,
      ...presetClaim,
      atoms: contract.atoms.filter((atom) => atom.selected && atom.scope !== "fixture-only" && atom.scope !== "reserved").map((atom) => atom.id).sort(),
      requiredPorts: contract.ports.filter((port) => port.required).map((port) => port.id).sort(),
      surfaces: contract.surfaces.map((surface) => ({ id: surface.id, type: surface.type, atomID: surface.atomID })).sort((left, right) => left.id.localeCompare(right.id)),
      bundles: contract.bundles.map((bundle) => bundle.id).sort(),
      bundleStates: bundleStatesForContract(contract),
      bindings: contract.bindings
        .map((binding) => ({
          portID: binding.portID,
          providerAtomID: binding.providerAtomID,
          consumerAtomID: binding.consumerAtomID,
          why: binding.why,
          canSwapWith: binding.canSwapWith,
          moduleClaim: buildHarnessBuilderModuleClaim({
            presetProduct: contract.product,
            portID: binding.portID,
            providerAtomID: binding.providerAtomID,
            atom: contractAtomByID.get(binding.providerAtomID),
            parityTargets: presetClaim.parityTargets,
          }),
        }))
        .sort((left, right) => left.portID.localeCompare(right.portID)),
      recipe,
    }
  })
  const presets = [...contractPresets, buildHybridMixPreset(contractPresets)]

  for (const contract of data.assemblyContracts) {
    for (const bundle of contract.bundles) {
      const current = bundleMap.get(bundle.id)
      if (current && !current.selectedIn.includes(contract.product)) current.selectedIn.push(contract.product)
    }
    for (const atom of contract.atoms) {
      const implementation = harnessBuilderImplementationProfile(atom)
      const atomModuleConfirmation = moduleConfirmationByAtomID.get(atom.id)
      const current =
        atomMap.get(atom.id) ??
        ({
          id: atom.id,
          plane: atom.plane,
          kind: atom.kind,
          scope: atom.scope,
          productScope: atom.productScope,
          stability: atom.stability,
          implementationKind: atom.implementationKind,
          provides: [],
          consumes: [],
          replaceablePorts: [],
          ...(atom.sourcePackage ? { sourcePackage: atom.sourcePackage } : {}),
          ...(atom.publicExport ? { publicExport: atom.publicExport } : {}),
          selectionReason: atom.selectionReason,
          implementationLevel: implementation.level,
          implementationLabel: implementation.label,
          implementationSummary: implementation.summary,
          nativeEvidenceRefs: atom.nativeEvidenceRefs,
          ...(atom.upstreamVersion ? { upstreamVersion: atom.upstreamVersion } : {}),
          ...(atom.upstreamCommit ? { upstreamCommit: atom.upstreamCommit } : {}),
          fixtureIDs: atom.fixtureIDs,
          parityCoverage: atom.parityCoverage,
          knownLossiness: atom.knownLossiness,
          ...(atomModuleConfirmation
            ? {
                moduleConfirmationStatus: atomModuleConfirmation.moduleConfirmationStatus,
                moduleConfirmationSummary: atomModuleConfirmation.moduleConfirmationSummary,
              }
            : {}),
          moduleConfirmationSourceFiles: atomModuleConfirmation?.currentSourceFiles ?? [],
          moduleConfirmationSourceOwners: atomModuleConfirmation?.sourceOwners ?? [],
          moduleConfirmationFixtureTargets: atomModuleConfirmation?.fixtureDiffTargets ?? [],
          moduleConfirmationItemIDs: atomModuleConfirmation?.itemIDs ?? [],
          selectedIn: [],
          bundleIDs: [],
        } satisfies HarnessBuilderAtom)
      current.provides = uniqueStrings([...current.provides, ...atom.provides])
      current.consumes = uniqueStrings([...current.consumes, ...atom.consumes])
      current.replaceablePorts = uniqueStrings([...current.replaceablePorts, ...atom.replaceablePorts])
      current.bundleIDs = uniqueStrings([...current.bundleIDs, ...atom.bundleIDs])
      current.nativeEvidenceRefs = uniqueStrings([...current.nativeEvidenceRefs, ...atom.nativeEvidenceRefs])
      current.fixtureIDs = uniqueStrings([...current.fixtureIDs, ...atom.fixtureIDs])
      current.knownLossiness = uniqueStrings([...current.knownLossiness, ...atom.knownLossiness])
      if (atomModuleConfirmation) {
        current.moduleConfirmationStatus = strongestModuleConfirmationStatus(
          [current.moduleConfirmationStatus, atomModuleConfirmation.moduleConfirmationStatus].filter((status): status is CurrentModuleSourceModuleConfirmationStatus => Boolean(status)),
        )
        current.moduleConfirmationSummary = atomModuleConfirmation.moduleConfirmationSummary
        current.moduleConfirmationSourceFiles = uniqueStrings([...current.moduleConfirmationSourceFiles, ...atomModuleConfirmation.currentSourceFiles])
        current.moduleConfirmationSourceOwners = uniqueStrings([...current.moduleConfirmationSourceOwners, ...atomModuleConfirmation.sourceOwners])
        current.moduleConfirmationFixtureTargets = uniqueStrings([...current.moduleConfirmationFixtureTargets, ...atomModuleConfirmation.fixtureDiffTargets])
        current.moduleConfirmationItemIDs = uniqueStrings([...current.moduleConfirmationItemIDs, ...atomModuleConfirmation.itemIDs])
      }
      if (!current.upstreamVersion && atom.upstreamVersion) current.upstreamVersion = atom.upstreamVersion
      if (!current.upstreamCommit && atom.upstreamCommit) current.upstreamCommit = atom.upstreamCommit
      if (atom.selected && !current.selectedIn.includes(contract.product)) current.selectedIn.push(contract.product)
      atomMap.set(atom.id, current)
    }
    for (const port of contract.ports) {
      const current =
        portMap.get(port.id) ??
        ({
          id: port.id,
          plane: port.plane,
          multiplicity: port.multiplicity,
          requiredIn: [],
          selectedByProduct: {},
          candidates: [],
          bundleCandidates: [],
          conformance: [],
          safety: port.swapPolicy.safety,
        } satisfies HarnessBuilderPort)
      if (port.required && !current.requiredIn.includes(contract.product)) current.requiredIn.push(contract.product)
      if (port.selectedProviderAtom) current.selectedByProduct[contract.product] = port.selectedProviderAtom
      current.candidates = uniqueStrings([...current.candidates, ...port.candidateAtoms])
      current.bundleCandidates = uniqueStrings([...current.bundleCandidates, ...port.bundleCandidates])
      current.conformance = uniqueStrings([...current.conformance, ...port.conformance])
      portMap.set(port.id, current)
    }
  }

  addPromptSupportAliasAtoms(atomMap)

  const atoms = [...atomMap.values()].sort((left, right) => left.id.localeCompare(right.id))
  const ports = [...portMap.values()].sort((left, right) => left.id.localeCompare(right.id))
  const bundles = [...bundleMap.values()].sort((left, right) => left.id.localeCompare(right.id))
  const executablePortRules = executablePortRuleCatalog(ports.map((port) => port.id))
  const implementationStates = buildHarnessBuilderImplementationStates(atoms)
  const officialFlowBlueprints = data.assemblyContracts.map((contract) => buildAssembledFlowBlueprint(contract, data.generatedAt, { currentModuleAudit: data.currentModuleAudit }))
  const hybridPreset = presets.find((preset) => preset.id === "hybrid-mix")
  const flowBlueprints = hybridPreset
    ? [...officialFlowBlueprints, buildHarnessBuilderPresetFlowBlueprint(officialFlowBlueprints, hybridPreset, data.generatedAt)]
    : officialFlowBlueprints
  return {
    generatedAt: data.generatedAt,
    presets,
    atoms,
    ports,
    bundles,
    implementationStates,
    moduleConfirmation,
    executablePortRules,
    flowBlueprints,
    flowCatalogs: buildHarnessBuilderFlowCatalogs(data.generatedAt, data.liveProviderSummary),
    flowTasks: buildHarnessBuilderFlowTasks(data.taskParity, data.nativeFixtureSummary),
    nativeFixtureSummary: data.nativeFixtureSummary,
    liveProviderSummary: data.liveProviderSummary,
    slots: buildHarnessBuilderSlots({ atoms, ports, bundles }),
    planes: uniqueStrings(atoms.map((atom) => atom.plane)).sort(),
    scopes: uniqueStrings(atoms.map((atom) => atom.scope)).sort(),
    commandTemplates: [
      "npm run helix -- validate recipe-file <file> --json",
      "npm run helix -- assemble --recipe-file <file> --explain --json",
      "npm run helix -- graph recipe-file <file> --json",
      "npm run helix -- task-parity --suite smoke --provider cassette --product <product> --json",
    ],
  }
}

export function buildHarnessBuilderRecipeFlowBlueprint(data: DocsSiteData, recipeInput: unknown, generatedAt = new Date().toISOString()): HarnessFlowGraph {
  const builderData = buildHarnessBuilderData(data)
  const recipe = normalizeHarnessBuilderRecipe(recipeInput)
  const preset = harnessBuilderPresetForRecipe(builderData, recipe)
  return buildHarnessBuilderPresetFlowBlueprint(builderData.flowBlueprints, preset, generatedAt)
}

function harnessBuilderPresetForRecipe(builderData: HarnessBuilderData, recipe: HarnessBuilderRecipe): HarnessBuilderPreset {
  const atomByID = new Map(builderData.atoms.map((atom) => [atom.id, atom]))
  const product = harnessBuilderRecipeProduct(recipe)
  const sourcePreset =
    builderData.presets.find((preset) => preset.id === product || preset.product === product || preset.recipeID === recipe.metadata.basedOn) ??
    builderData.presets.find((preset) => preset.id === "opencode")
  const parityTargets =
    product === "hybrid-mix"
      ? uniqueParityTargets(builderData.presets.flatMap((preset) => preset.parityTargets))
      : sourcePreset?.parityTargets ?? []
  const atomIDs = uniqueStrings([
    ...recipe.modules.map((item) => item.id),
    ...recipe.atoms.map((item) => item.id),
    ...recipe.productShells.map((item) => item.id),
    ...recipe.bindings.map((binding) => binding.module),
  ])
  const compositionClaim: HarnessBuilderCompositionClaim = product === "hybrid-mix" ? "experimental-hybrid" : product === "minimal" ? "helix-minimal" : "custom-composition"
  const claim =
    compositionClaim === "experimental-hybrid"
      ? presetAssemblyClaim("hybrid-mix")
      : compositionClaim === "helix-minimal"
        ? presetAssemblyClaim("minimal")
        : {
            assemblyClaim: "product-profile-runnable",
            assemblyClaimLabel: "自定义组合 / Custom composition",
            compositionClaim,
            parityTargets,
            parityTargetSatisfied: false,
            parityTargetSummary: parityTargets.length > 0
              ? "Persisted custom draft keeps upstream targets for inspection, but replacements must re-prove per-port parity."
              : "Persisted custom draft has no upstream parity target.",
            evidencePolicy: "compatibility-bridge-visible",
            nativeParityVerified: false,
            nativeParitySummary: "Persisted custom draft is port/behavior compatible only; it does not inherit native parity from the source preset.",
          } satisfies Pick<
            HarnessBuilderPreset,
            | "assemblyClaim"
            | "assemblyClaimLabel"
            | "compositionClaim"
            | "parityTargets"
            | "parityTargetSatisfied"
            | "parityTargetSummary"
            | "evidencePolicy"
            | "nativeParityVerified"
            | "nativeParitySummary"
          >
  const bindings = recipe.bindings
    .map((binding) => {
      const atom = atomByID.get(binding.module)
      return {
        portID: binding.port,
        providerAtomID: binding.module,
        consumerAtomID: "recipe",
        why: "persisted builder draft binding",
        canSwapWith: [],
        moduleClaim: buildHarnessBuilderModuleClaim({
          presetProduct: product,
          portID: binding.port,
          providerAtomID: binding.module,
          atom,
          parityTargets,
        }),
      }
    })
    .sort((left, right) => left.portID.localeCompare(right.portID))
  const bundleStates = bundleStatesForAtomIDs(atomIDs)
  return {
    id: recipe.id || "custom",
    label: recipe.id || "Custom",
    product,
    recipeID: recipe.id || "custom.harness",
    fingerprint: harnessBuilderRecipeFingerprint(recipe),
    ...harnessBuilderCompileProfile(recipe),
    ...claim,
    parityTargets,
    atoms: atomIDs,
    requiredPorts: recipe.requiredCapabilities.slice().sort(),
    surfaces: Object.entries(recipe.entrypoints).map(([id, atomID]) => ({ id, type: productFamilyForAtom(atomID), atomID })).sort((left, right) => left.id.localeCompare(right.id)),
    bundles: (recipe.bundles ?? []).map((bundle) => bundle.id).sort(),
    bundleStates,
    bindings,
    recipe,
  }
}

function normalizeHarnessBuilderRecipe(input: unknown): HarnessBuilderRecipe {
  if (!isRecord(input)) throw new Error("Custom flow blueprint recipe must be a JSON object.")
  const metadata = isRecord(input.metadata) ? input.metadata : {}
  return {
    id: stringField(input.id, "custom.harness"),
    version: stringField(input.version, "0.1.0"),
    modules: moduleRefs(input.modules),
    atoms: moduleRefs(input.atoms),
    productShells: moduleRefs(input.productShells),
    bundles: bundleRefs(input.bundles),
    bindings: bindingRefs(input.bindings),
    requiredCapabilities: stringList(input.requiredCapabilities),
    personalities: stringList(input.personalities).length > 0 ? stringList(input.personalities) : ["common"],
    entrypoints: stringRecord(input.entrypoints),
    metadata,
  }
}

function harnessBuilderRecipeProduct(recipe: HarnessBuilderRecipe): string {
  const metadataProduct = typeof recipe.metadata.product === "string" && recipe.metadata.product.trim() ? recipe.metadata.product.trim() : ""
  if (metadataProduct) return metadataProduct
  const firstPersonality = recipe.personalities.find((personality) => personality !== "common")
  return firstPersonality ?? "custom"
}

function harnessBuilderRecipeFingerprint(recipe: HarnessBuilderRecipe): string {
  return createHash("sha256").update(JSON.stringify(recipe)).digest("hex").slice(0, 16)
}

function stringField(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : []
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0))
}

function moduleRefs(value: unknown): Array<{ id: string }> {
  return Array.isArray(value)
    ? value
        .map((item) => (isRecord(item) ? stringField(item.id, "") : ""))
        .filter(Boolean)
        .map((id) => ({ id }))
    : []
}

function bundleRefs(value: unknown): NonNullable<HarnessBuilderRecipe["bundles"]> {
  return Array.isArray(value)
    ? value
        .map((item) => {
          if (!isRecord(item)) return undefined
          const id = stringField(item.id, "")
          if (!id) return undefined
          const replacedAtoms = isRecord(item.replacedAtoms)
            ? Object.fromEntries(Object.entries(item.replacedAtoms).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
            : undefined
          return {
            id,
            ...(stringList(item.removedAtoms).length > 0 ? { removedAtoms: stringList(item.removedAtoms) } : {}),
            ...(replacedAtoms && Object.keys(replacedAtoms).length > 0 ? { replacedAtoms } : {}),
          }
        })
        .filter((item): item is NonNullable<HarnessBuilderRecipe["bundles"]>[number] => Boolean(item))
    : []
}

function bindingRefs(value: unknown): HarnessBuilderRecipe["bindings"] {
  return Array.isArray(value)
    ? value
        .map((item) => {
          if (!isRecord(item)) return undefined
          const port = stringField(item.port, "")
          const module = stringField(item.module, "")
          return port && module ? { port, module } : undefined
        })
        .filter((item): item is HarnessBuilderRecipe["bindings"][number] => Boolean(item))
    : []
}

function buildHarnessBuilderPresetFlowBlueprint(baseBlueprints: HarnessFlowGraph[], preset: HarnessBuilderPreset, generatedAt: string): HarnessFlowGraph {
  const base = flowBlueprintBaseForBuilderPreset(baseBlueprints, preset)
  if (!base) {
    throw new Error(`Cannot build ${preset.id} flow blueprint without an official base flow graph.`)
  }
  const graph = JSON.parse(JSON.stringify(base)) as HarnessFlowGraph
  graph.generatedAt = generatedAt
  graph.product = flowGraphProductForBuilderPreset(preset.product)
  graph.recipeID = preset.recipeID
  graph.contractFingerprint = preset.fingerprint
  graph.evidence = [
    ...graph.evidence,
    {
      id: `builder-preset-flow:${preset.id}`,
      source: "assembled",
      kind: "contract",
      label: `${preset.id} Builder preset flow blueprint`,
      refs: [
        `preset:${preset.id}`,
        `composition:${preset.compositionClaim}`,
        ...preset.parityTargets.map((target) => `parity-target:${parityTargetRef(target)}`),
      ],
      lossiness: "semantic",
      metadata: {
        presetID: preset.id,
        product: preset.product,
        recipeID: preset.recipeID,
        compositionClaim: preset.compositionClaim,
        parityTargetSatisfied: preset.parityTargetSatisfied,
      },
    },
  ]
  graph.nodes = graph.nodes.map((node) => flowNodeForBuilderPreset(node, preset))
  const driftCount = graph.nodes.filter((node) => node.metrics.parityTargetSatisfied === false && (node.metrics.parityTargetRefs ?? []).length > 0).length
  graph.summary = {
    ...graph.summary,
    stages: graph.nodes.length,
    edges: graph.edges.length,
    observedStages: graph.nodes.filter((node) => node.status === "matched" || node.status === "semantic-match").length,
    inferredStages: graph.nodes.filter((node) => node.status === "inferred").length,
    unobservableStages: graph.nodes.filter((node) => node.status === "unobservable").length,
    driftCount,
    fingerprint: harnessBuilderPresetFlowFingerprint(graph, preset),
  }
  return graph
}

function flowBlueprintBaseForBuilderPreset(baseBlueprints: HarnessFlowGraph[], preset: HarnessBuilderPreset): HarnessFlowGraph | undefined {
  const preferredProduct =
    preset.product === "opencode" || preset.product === "pi-mono" || preset.product === "nanobot" || preset.product === "hermes-agent" || preset.product === "minimal"
      ? preset.product
      : "opencode"
  return (
    baseBlueprints.find((graph) => graph.product === preferredProduct) ??
    baseBlueprints.find((graph) => graph.product === "opencode") ??
    baseBlueprints[0]
  )
}

function flowGraphProductForBuilderPreset(product: string): AssemblyContractProduct {
  if (product === "opencode" || product === "pi-mono" || product === "nanobot" || product === "hermes-agent" || product === "minimal" || product === "custom") return product
  return "custom"
}

function flowNodeForBuilderPreset(node: HarnessFlowGraph["nodes"][number], preset: HarnessBuilderPreset): HarnessFlowGraph["nodes"][number] {
  const stagePortIDs = node.assembledPortIDs ?? []
  const stageBindings = preset.bindings.filter((binding) => stagePortIDs.includes(binding.portID))
  if (stageBindings.length === 0) return node
  const moduleClaims = flowModuleClaimsForBuilderPresetStage(preset, stageBindings)
  const parityTargetRefs = uniqueStrings(moduleClaims.flatMap((claim) => (claim.parityTargetRef ? [claim.parityTargetRef] : [])))
  const parityTargetBlockers = uniqueStrings(moduleClaims.flatMap((claim) => claim.blockers))
  const implementationLevels = uniqueStrings(moduleClaims.map((claim) => claim.implementationLevel)) as NonNullable<HarnessFlowGraph["nodes"][number]["metrics"]["implementationLevels"]>
  const nextMetrics: HarnessFlowGraph["nodes"][number]["metrics"] = {
    ...node.metrics,
    implementationLevels,
    bridgeLayers: flowBridgeLayersForModuleClaims(node.plane, moduleClaims),
    moduleClaims,
    parityTargetSatisfied: parityTargetRefs.length > 0 && moduleClaims.every((claim) => claim.parityTargetSatisfied),
    parityTargetBlockers,
  }
  if (parityTargetRefs.length > 0) nextMetrics.parityTargetRefs = parityTargetRefs
  if (node.id === "prompt.assemble") {
    const promptClaim = moduleClaims.find((claim) => claim.portIDs.some((portID) => portID.startsWith("prompt."))) ?? moduleClaims[0]
    if (promptClaim) nextMetrics.promptAtomID = promptClaim.atomID
  }
  const assembledAtomIDs = uniqueStrings(stageBindings.map((binding) => binding.providerAtomID))
  return {
    ...node,
    status: moduleClaims.some((claim) => claim.parityCompatible === "blocked") ? "drift" : "semantic-match",
    assembledAtomIDs,
    bindingIDs: stageBindings.map((binding) => `${binding.portID}->${binding.providerAtomID}`).sort(),
    metrics: nextMetrics,
  }
}

function flowModuleClaimsForBuilderPresetStage(
  preset: HarnessBuilderPreset,
  bindings: HarnessBuilderPreset["bindings"],
): HarnessFlowModuleClaim[] {
  const compositionBlocker =
    preset.compositionClaim === "experimental-hybrid"
      ? "experimental-hybrid-composition"
      : preset.compositionClaim === "custom-composition"
        ? "custom-draft-composition"
        : ""
  return bindings.map((binding) => {
    const claim = binding.moduleClaim
    const sourceProduct = flowModuleClaimSourceProduct(claim.sourceProduct)
    const parityTargetProduct = claim.parityTargetProduct ? flowGraphProductForBuilderPreset(claim.parityTargetProduct) : undefined
    const blockers = uniqueStrings([...(compositionBlocker ? [compositionBlocker] : []), ...claim.blockers])
    const parityCompatible: HarnessFlowModuleClaim["parityCompatible"] =
      compositionBlocker && claim.parityCompatible === "satisfied"
        ? "partial"
        : claim.parityCompatible
    return {
      atomID: binding.providerAtomID,
      portIDs: [binding.portID],
      sourceProduct,
      sourceScope: flowModuleClaimSourceScope(claim.sourceScope),
      implementationLevel: claim.level,
      ...(parityTargetProduct ? { parityTargetProduct } : {}),
      ...(claim.parityTargetRef ? { parityTargetRef: claim.parityTargetRef } : {}),
      parityCompatible,
      parityTargetSatisfied: false,
      evidenceRefs: claim.evidenceRefs,
      fixtureIDs: claim.fixtureIDs,
      knownLossiness: claim.knownLossiness,
      blockers,
      summary:
        compositionBlocker
          ? `${preset.id} ${preset.compositionClaim} selects ${binding.providerAtomID} for ${binding.portID}; ${claim.summary}`
          : claim.summary,
    }
  })
}

function flowModuleClaimSourceProduct(sourceProduct: string): HarnessFlowModuleClaim["sourceProduct"] {
  if (sourceProduct === "opencode" || sourceProduct === "pi-mono" || sourceProduct === "nanobot" || sourceProduct === "hermes-agent" || sourceProduct === "minimal" || sourceProduct === "custom" || sourceProduct === "common" || sourceProduct === "unknown") {
    return sourceProduct
  }
  return "unknown"
}

function flowModuleClaimSourceScope(sourceScope: string): HarnessFlowModuleClaim["sourceScope"] {
  if (sourceScope === "common" || sourceScope === "product" || sourceScope === "reserved" || sourceScope === "fixture-only") return sourceScope
  return "product"
}

function flowBridgeLayersForModuleClaims(
  layer: NonNullable<HarnessFlowGraph["nodes"][number]["plane"]>,
  moduleClaims: HarnessFlowModuleClaim[],
): NonNullable<HarnessFlowGraph["nodes"][number]["metrics"]["bridgeLayers"]> {
  const buckets = new Map<string, NonNullable<HarnessFlowGraph["nodes"][number]["metrics"]["bridgeLayers"]>[number]>()
  for (const claim of moduleClaims) {
    const key = `${layer}:${claim.implementationLevel}`
    const current =
      buckets.get(key) ??
      ({
        layer,
        implementationLevel: claim.implementationLevel,
        atomIDs: [],
      } satisfies NonNullable<HarnessFlowGraph["nodes"][number]["metrics"]["bridgeLayers"]>[number])
    current.atomIDs = uniqueStrings([...current.atomIDs, claim.atomID])
    buckets.set(key, current)
  }
  return [...buckets.values()].sort((left, right) => `${left.layer}:${left.implementationLevel}`.localeCompare(`${right.layer}:${right.implementationLevel}`))
}

function harnessBuilderPresetFlowFingerprint(graph: HarnessFlowGraph, preset: HarnessBuilderPreset): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        product: graph.product,
        recipeID: graph.recipeID,
        presetID: preset.id,
        compositionClaim: preset.compositionClaim,
        nodes: graph.nodes.map((node) => ({
          id: node.id,
          atoms: node.assembledAtomIDs,
          ports: node.assembledPortIDs,
          moduleClaims: node.metrics.moduleClaims?.map((claim) => ({
            atomID: claim.atomID,
            portIDs: claim.portIDs,
            sourceProduct: claim.sourceProduct,
            implementationLevel: claim.implementationLevel,
            parityTargetRef: claim.parityTargetRef,
            parityTargetSatisfied: claim.parityTargetSatisfied,
            blockers: claim.blockers,
          })),
        })),
      }),
    )
    .digest("hex")
    .slice(0, 16)
}

function buildHarnessBuilderFlowCatalogs(generatedAt: string, liveProviderSummary: HarnessFlowLiveProviderSummary | null): HarnessFlowStageCatalog[] {
  return (["opencode", "pi-mono", "nanobot", "hermes-agent"] as const).map((product) => buildCanonicalFlowCatalog({ product, generatedAt, liveProviderSummary }))
}

const promptSupportAliasBuilderPorts = new Set([
  "resource.discovery",
  "prompt.resource-loader",
  "prompt.tool-renderer",
  "prompt.model-capability-adapter",
  "prompt.compaction-adapter",
])

function addPromptSupportAliasAtoms(atomMap: Map<string, HarnessBuilderAtom>): void {
  for (const block of allRecipeInventoryBlocks()) {
    if (block.source !== "personality") continue
    if (block.personality === "common") continue
    if (block.implementationKind !== "metadata-only") continue
    if (!promptSupportAliasBuilderPorts.has(block.port)) continue
    if (atomMap.has(block.id)) continue

    const route = routeForAtomBlock(block.id)
    const atom = {
      id: block.id,
      plane: "prompt",
      kind: "prompt",
      scope: "product",
      productScope: block.personality,
      stability: "stable",
      implementationKind: block.implementationKind,
      provides: [block.port],
      consumes: [],
      replaceablePorts: [block.port],
      sourcePackage: route.packageName,
      publicExport: route.exportPath,
      selectionReason: "metadata-only product prompt support alias; executable binding uses the shared common prompt support atom",
      nativeEvidenceRefs: [],
      fixtureIDs: [],
      parityCoverage: "metadata",
      knownLossiness: ["bom-or-overlay-only", "not-executable-provider"],
      moduleConfirmationSourceFiles: [],
      moduleConfirmationSourceOwners: [],
      moduleConfirmationFixtureTargets: [],
      moduleConfirmationItemIDs: [],
      selectedIn: [],
      bundleIDs: [],
    } satisfies Omit<HarnessBuilderAtom, "implementationLevel" | "implementationLabel" | "implementationSummary">
    const implementation = harnessBuilderImplementationProfile(atom)
    atomMap.set(block.id, {
      ...atom,
      implementationLevel: implementation.level,
      implementationLabel: implementation.label,
      implementationSummary: implementation.summary,
    })
  }
}

function buildHarnessBuilderFlowTasks(taskParity: ProductTaskParityArtifact | null, nativeFixtureSummary: HarnessNativeFixtureSummaryIndex | null): Array<{ id: string; products: string[] }> {
  const defaultTasks = ["read-only-answer", "single-file-edit", "tool-error-retry", "context-compaction"]
  const productByTask = new Map<string, Set<string>>()
  for (const taskID of defaultTasks) productByTask.set(taskID, new Set())
  if (taskParity) {
    for (const report of taskParity.reports) {
      if (!report.taskID) continue
      const products = productByTask.get(report.taskID) ?? new Set<string>()
      if (report.product) products.add(report.product)
      productByTask.set(report.taskID, products)
    }
    for (const pair of taskParity.pairs) {
      if (!pair.taskID) continue
      const products = productByTask.get(pair.taskID) ?? new Set<string>()
      if (pair.product) products.add(pair.product)
      productByTask.set(pair.taskID, products)
    }
  }
  if (nativeFixtureSummary) {
    for (const fixture of nativeFixtureSummary.fixtures) {
      if (!fixture.taskID) continue
      const products = productByTask.get(fixture.taskID) ?? new Set<string>()
      if (fixture.product) products.add(fixture.product)
      productByTask.set(fixture.taskID, products)
    }
  }
  return [...productByTask.entries()]
    .map(([id, products]) => ({ id, products: [...products].sort() }))
    .sort((left, right) => {
      const leftDefault = defaultTasks.indexOf(left.id)
      const rightDefault = defaultTasks.indexOf(right.id)
      if (leftDefault >= 0 || rightDefault >= 0) return (leftDefault < 0 ? 999 : leftDefault) - (rightDefault < 0 ? 999 : rightDefault)
      return left.id.localeCompare(right.id)
    })
}

function buildExternalToolSummary(cwd: string): HarnessExternalToolSummary {
  const artifacts = readExternalToolArtifactSummaries(cwd)
  return {
    tools: listExternalToolProfiles().map((profile) => {
      const lastImportedArtifact = artifacts
        .filter((artifact) => artifact.sourceTool === profile.id)
        .sort((left, right) => right.sortKey.localeCompare(left.sortKey))[0]
      const lastVerifierResult = lastImportedArtifact?.verifier
      return {
        id: profile.id,
        label: profile.label,
        repository: profile.repository,
        installHints: [...(profile.installHints ?? [])],
        installStatus: "not-checked" as const,
        defaultStrategy: profile.defaultInvocation.strategy,
        command: [profile.defaultInvocation.command, ...profile.defaultInvocation.args].filter(Boolean).join(" "),
        supportedProducts: [...profile.supportedProducts],
        unsupportedProducts: [...profile.unsupportedProducts],
        unsupportedGaps: (profile.unsupportedGaps ?? []).map((gap) => ({
          product: gap.product,
          status: gap.status,
          reason: gap.reason,
          nextAction: gap.nextAction,
        })),
        supportedArtifactFormats: [...profile.supportedArtifactFormats],
        supportedCaptureModes: [...profile.supportedCaptureModes],
        lossinessNotes: [...(profile.lossinessNotes ?? [])],
        ...(lastImportedArtifact ? { lastImportedArtifact: lastImportedArtifact.artifact } : {}),
        ...(lastVerifierResult ? { lastVerifierResult } : {}),
      }
    }),
  }
}

function readExternalToolArtifactSummaries(cwd: string): Array<{ sourceTool: string; sortKey: string; artifact: HarnessExternalToolArtifactSummary; verifier: HarnessExternalToolVerifierSummary }> {
  return [
    ...findExternalToolNativeCaptureArtifacts(resolve(cwd, "docs/reports/external-tools")),
    ...findExternalToolNativeCaptureArtifacts(resolve(cwd, ".helix/external-tools/runs")),
  ].flatMap((artifactPath) => {
    try {
      const raw = JSON.parse(readFileSync(artifactPath, "utf8")) as NativeCaptureArtifact
      if (raw.schemaVersion !== 1 || raw.artifactKind !== "external-tool-native-capture") return []
      const verification = verifyNativeCaptureArtifact(raw)
      const relativePath = slashPath(relative(cwd, artifactPath))
      const storage = relativePath.startsWith("docs/reports/") ? "published" : "local-only"
      const containsRawPrompt = raw.redactionPolicy.containsRawPrompt !== false
      const localOnly = storage === "local-only" || containsRawPrompt || !verification.ok
      const verifier: HarnessExternalToolVerifierSummary = {
        ok: verification.ok,
        checks: verification.checks.length,
        issues: verification.issues.map((issue) => `${issue.id}: ${issue.message}`),
        localOnly,
        status: verification.ok && !localOnly ? "publishable" : "local-only",
      }
      const stat = statSync(artifactPath)
      const generatedAt = raw.generatedAt || stat.mtime.toISOString()
      return [{
        sourceTool: raw.sourceTool,
        sortKey: generatedAt || stat.mtime.toISOString(),
        artifact: {
          artifactPath: relativePath,
          generatedAt,
          product: raw.product,
          taskID: raw.taskID,
          captureMode: raw.captureMode,
          sourceToolVersion: raw.sourceToolVersion,
          sourceArtifactHash: raw.sourceArtifact.hash,
          sourceArtifactBytes: raw.sourceArtifact.bytes,
          providerRequests: raw.providerRequests.length,
          storage,
          containsRawPrompt,
          localOnly,
        },
        verifier,
      }]
    } catch {
      return []
    }
  })
}

function findExternalToolNativeCaptureArtifacts(root: string): string[] {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name)
    if (entry.isDirectory()) return findExternalToolNativeCaptureArtifacts(path)
    return entry.isFile() && entry.name === "native-capture.json" ? [path] : []
  })
}

const nativeFixtureSummaryRelativePath = "docs/reports/task-parity-native-cadence-fixtures/summary.json"
const nativeFixtureManifestRelativeDir = "docs/reports/task-parity-native-cadence-fixtures"
const liveProviderSummaryRelativePath = "docs/reports/live-provider-parity-split/summary.json"
const liveProviderSummaryFallbackRelativePath = "docs/reports/live-provider-parity-summary.json"
const currentModuleAuditRelativePath = "docs/reports/current-module-placeholder-audit.json"
const moduleConfirmationStatusOrder: CurrentModuleSourceModuleConfirmationStatus[] = [
  "manual-anchor-needed",
  "upstream-divergent-exact-diff-missing",
  "semantic-fixture-needs-exact-diff",
  "demotion-guard-confirmed",
  "no-open-divergence",
]

function readNativeFixtureSummaryIndex(cwd: string): HarnessNativeFixtureSummaryIndex | null {
  const summaryPath = join(cwd, nativeFixtureSummaryRelativePath)
  if (!existsSync(summaryPath)) return null
  try {
    const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as ProductTaskNativeCadenceFixtureSummaryV2
    if (summary.schemaVersion !== 2 || summary.artifactKind !== "native-cadence-fixture-summary" || !Array.isArray(summary.fixtures)) return null
    const manifestRelativePath = slashPath(nativeFixtureManifestRelativeDir, summary.manifestPath || "manifest.json")
    let manifestAttachmentCount = 0
    try {
      const manifest = JSON.parse(readFileSync(join(cwd, manifestRelativePath), "utf8")) as TaskParityAttachmentManifestV2
      manifestAttachmentCount = Array.isArray(manifest.attachments) ? manifest.attachments.length : 0
    } catch {
      manifestAttachmentCount = 0
    }
    return {
      artifactKind: "native-cadence-fixture-summary",
      summaryPath: nativeFixtureSummaryRelativePath,
      manifestPath: manifestRelativePath,
      generatedAt: summary.generatedAt,
      sourceArtifact: summary.sourceArtifact,
      fixtureCount: summary.fixtures.length,
      manifestAttachmentCount,
      attachmentPolicy: "lazy-fetch-by-attachment-path",
      fixtures: summary.fixtures.map((fixture) => ({
        product: fixture.product,
        taskID: fixture.taskID,
        nativeVersion: fixture.nativeVersion,
        cadenceLevel: fixture.cadenceLevel,
        providerRequests: fixture.providerRequests,
        messagePartTypes: fixture.messagePartTypes,
        projectionLosses: fixture.projectionLosses,
        attachmentPath: slashPath(nativeFixtureManifestRelativeDir, fixture.attachment.path),
        sha256: fixture.attachment.sha256,
        byteSize: fixture.attachment.byteSize,
        redactionStatus: fixture.attachment.redactionStatus,
        required: fixture.attachment.required,
        verifierCoverage: fixture.attachment.verifierCoverage,
      })),
    }
  } catch {
    return null
  }
}

function readLiveProviderSummaryIndex(cwd: string): HarnessFlowLiveProviderSummary | null {
  const relativePath = existsSync(join(cwd, liveProviderSummaryRelativePath)) ? liveProviderSummaryRelativePath : liveProviderSummaryFallbackRelativePath
  const summaryPath = join(cwd, relativePath)
  if (!existsSync(summaryPath)) return null
  try {
    const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as {
      schemaVersion?: unknown
      artifactKind?: unknown
      generatedAt?: unknown
      provider?: unknown
      modelID?: unknown
      status?: unknown
      ok?: unknown
      products?: unknown
      checks?: unknown
      attachments?: unknown
    }
    if (summary.schemaVersion !== 2 || summary.artifactKind !== "live-provider-parity-summary" || typeof summary.generatedAt !== "string") return null
    const products = Array.isArray(summary.products) ? summary.products : []
    const checks = Array.isArray(summary.checks) ? summary.checks : []
    const attachments = Array.isArray(summary.attachments) ? summary.attachments : []
    return {
      artifactKind: "live-provider-parity-summary",
      artifactPath: relativePath,
      generatedAt: summary.generatedAt,
      ...(typeof summary.provider === "string" ? { provider: summary.provider } : {}),
      ...(typeof summary.modelID === "string" ? { modelID: summary.modelID } : {}),
      status: liveProviderStatus(summary.status),
      ok: summary.ok === true,
      verifierChecks: checks
        .map((check) => (isRecord(check) && typeof check.id === "string" && check.ok === true ? check.id : undefined))
        .filter((id): id is string => Boolean(id)),
      products: products
        .map((product): HarnessFlowLiveProviderSummary["products"][number] | undefined => {
          if (!isRecord(product) || !isHarnessProductID(product.product)) return undefined
          const attachment = attachments
            .map((candidate) => (isRecord(candidate) ? candidate : undefined))
            .find((candidate) => typeof candidate?.path === "string" && candidate.path.endsWith(`/${product.product}.json`))
          return {
            product: product.product,
            status: liveProviderStatus(product.status),
            ok: product.ok === true,
            ...(typeof product.sessionID === "string" ? { sessionID: product.sessionID } : {}),
            ...(typeof product.steps === "number" ? { steps: product.steps } : {}),
            readbackChecks: typeof product.readbackChecks === "number" ? product.readbackChecks : 0,
            ...(typeof attachment?.path === "string" ? { attachmentPath: slashPath("docs/reports/live-provider-parity-split", attachment.path) } : {}),
            ...(typeof attachment?.sha256 === "string" ? { attachmentSha256: attachment.sha256 } : {}),
          }
        })
        .filter((product): product is HarnessFlowLiveProviderSummary["products"][number] => Boolean(product)),
    }
  } catch {
    return null
  }
}

function readCurrentModulePlaceholderAudit(cwd: string): CurrentModulePlaceholderAudit | null {
  const artifactPath = join(cwd, currentModuleAuditRelativePath)
  if (!existsSync(artifactPath)) return null
  try {
    const audit = JSON.parse(readFileSync(artifactPath, "utf8")) as CurrentModulePlaceholderAudit
    if (audit.schemaVersion !== 1 || audit.artifactKind !== "current-module-placeholder-audit") return null
    if (!Array.isArray(audit.items) || !Array.isArray(audit.currentSourceFileSummaries) || !Array.isArray(audit.sourceOwnerLineLevelSummaries)) return null
    return audit
  } catch {
    return null
  }
}

function buildHarnessBuilderModuleConfirmationIndex(audit: CurrentModulePlaceholderAudit | null): HarnessBuilderModuleConfirmationIndex | null {
  if (!audit) return null
  const sourceSummaryByFile = new Map(audit.currentSourceFileSummaries.map((summary) => [summary.currentSourceFile, summary]))
  const itemsByAtomID = new Map<string, CurrentModulePlaceholderAudit["items"]>()
  for (const item of audit.items) {
    if (!item.atomID) continue
    const items = itemsByAtomID.get(item.atomID) ?? []
    items.push(item)
    itemsByAtomID.set(item.atomID, items)
  }
  const currentSourceFiles: HarnessBuilderModuleConfirmationSourceFile[] = audit.currentSourceFileSummaries
    .map((summary) => ({
      currentSourceFile: summary.currentSourceFile,
      sourceOwnerPackagePath: summary.sourceOwnerPackagePath,
      sourceOwnerPackageCatalogStatus: summary.sourceOwnerPackageCatalogStatus,
      moduleConfirmationStatus: summary.moduleConfirmationStatus,
      moduleConfirmationSummary: summary.moduleConfirmationSummary,
      exactDiffMissing: summary.exactDiffMissing,
      exactDiffPartial: summary.exactDiffPartial,
      demotionGuardOnly: summary.demotionGuardOnly,
      manualCheckPending: summary.manualCheckPending,
      fixtureDiffTargets: Object.keys(summary.byFixtureDiffTarget).sort(),
      itemIDs: summary.itemIDs,
    }))
    .sort((left, right) => left.currentSourceFile.localeCompare(right.currentSourceFile))
  const sourceOwners: HarnessBuilderModuleConfirmationSourceOwner[] = audit.sourceOwnerLineLevelSummaries
    .map((summary) => ({
      sourceOwnerPackagePath: summary.sourceOwnerPackagePath,
      sourceOwnerPackageCatalogStatus: summary.sourceOwnerPackageCatalogStatus,
      moduleConfirmationStatus: summary.moduleConfirmationStatus,
      moduleConfirmationSummary: summary.moduleConfirmationSummary,
      queueItems: summary.queueItems,
      itemCount: summary.itemCount,
      currentSourceFileCount: summary.currentSourceFileCount,
      fixtureDiffTargets: Object.keys(summary.byFixtureDiffTarget).sort(),
      sampleCurrentSourceFiles: summary.sampleCurrentSourceFiles,
    }))
    .sort((left, right) => left.sourceOwnerPackagePath.localeCompare(right.sourceOwnerPackagePath))
  const atomConfirmations = [...itemsByAtomID.entries()]
    .map(([atomID, items]): HarnessBuilderModuleConfirmationAtom | undefined => {
      const sourceFiles = uniqueStrings(items.flatMap((item) => item.currentSourceFiles))
      const sourceSummaries = sourceFiles.map((file) => sourceSummaryByFile.get(file)).filter((summary): summary is NonNullable<typeof summary> => Boolean(summary))
      if (sourceSummaries.length === 0) return undefined
      const status = strongestModuleConfirmationStatus(sourceSummaries.map((summary) => summary.moduleConfirmationStatus))
      const exactDiffMissing = sumNumbers(sourceSummaries.map((summary) => summary.exactDiffMissing))
      const exactDiffPartial = sumNumbers(sourceSummaries.map((summary) => summary.exactDiffPartial))
      const demotionGuardOnly = sumNumbers(sourceSummaries.map((summary) => summary.demotionGuardOnly))
      const manualCheckPending = sumNumbers(sourceSummaries.map((summary) => summary.manualCheckPending))
      const sourceOwners = uniqueStrings(sourceSummaries.map((summary) => summary.sourceOwnerPackagePath))
      const fixtureDiffTargets = uniqueStrings([
        ...items.flatMap((item) => item.pinnedUpstreamDivergences.map((divergence) => divergence.fixtureDiffTarget)),
        ...sourceSummaries.flatMap((summary) => Object.keys(summary.byFixtureDiffTarget)),
      ])
      return {
        atomID,
        moduleConfirmationStatus: status,
        moduleConfirmationSummary: `${atomID} module confirmation is ${status} across ${sourceFiles.length} current source file(s) (${exactDiffMissing} missing / ${exactDiffPartial} partial / ${demotionGuardOnly} demotion guard / ${manualCheckPending} manual).`,
        currentSourceFiles: sourceFiles,
        sourceOwners,
        fixtureDiffTargets,
        itemIDs: uniqueStrings(items.map((item) => item.id)),
        products: uniqueStrings(items.map((item) => item.product).filter((product): product is AssemblyContractProduct => Boolean(product))),
        ownerTODOs: uniqueStrings(items.map((item) => item.ownerTODO)),
        exactDiffMissing,
        exactDiffPartial,
        demotionGuardOnly,
        manualCheckPending,
      }
    })
    .filter((confirmation): confirmation is HarnessBuilderModuleConfirmationAtom => Boolean(confirmation))
    .sort((left, right) => left.atomID.localeCompare(right.atomID))
  return {
    artifactKind: "current-module-confirmation-index",
    artifactPath: currentModuleAuditRelativePath,
    generatedAt: audit.generatedAt,
    fingerprint: audit.summary.fingerprint,
    totalItems: audit.summary.totalItems,
    currentSourceFileSummaryItems: audit.summary.currentSourceFileSummaryItems,
    sourceOwnerLineLevelSummaryItems: audit.summary.sourceOwnerLineLevelSummaryItems,
    byModuleConfirmationStatus: countModuleConfirmationStatuses(audit.currentSourceFileSummaries.map((summary) => summary.moduleConfirmationStatus)),
    atomConfirmations,
    currentSourceFiles,
    sourceOwners,
  }
}

function countModuleConfirmationStatuses(statuses: CurrentModuleSourceModuleConfirmationStatus[]): Record<CurrentModuleSourceModuleConfirmationStatus, number> {
  const counts = Object.fromEntries(moduleConfirmationStatusOrder.map((status) => [status, 0])) as Record<CurrentModuleSourceModuleConfirmationStatus, number>
  for (const status of statuses) counts[status] += 1
  return counts
}

function strongestModuleConfirmationStatus(statuses: CurrentModuleSourceModuleConfirmationStatus[]): CurrentModuleSourceModuleConfirmationStatus {
  return statuses
    .slice()
    .sort((left, right) => moduleConfirmationStatusOrder.indexOf(left) - moduleConfirmationStatusOrder.indexOf(right))[0] ?? "no-open-divergence"
}

function sumNumbers(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function isHarnessProductID(value: unknown): value is HarnessFlowLiveProviderSummary["products"][number]["product"] {
  return value === "opencode" || value === "pi-mono" || value === "nanobot" || value === "hermes-agent"
}

function liveProviderStatus(value: unknown): "passed" | "skipped" | "failed" {
  return value === "passed" || value === "skipped" || value === "failed" ? value : "failed"
}

function slashPath(...parts: string[]): string {
  return parts.join("/").replace(/\\/g, "/").replace(/\/+/g, "/")
}

function harnessBuilderRecipeForContract(contract: AssemblyContract): HarnessBuilderRecipe {
  const selectedAtoms = contract.atoms
    .filter((atom) => atom.selected && atom.scope !== "fixture-only" && atom.scope !== "reserved")
    .sort((left, right) => left.id.localeCompare(right.id))
  const atoms = selectedAtoms.filter((atom) => atom.kind !== "product-shell").map((atom) => ({ id: atom.id }))
  const productShells = selectedAtoms.filter((atom) => atom.kind === "product-shell").map((atom) => ({ id: atom.id }))
  const bundles = contract.bundleExpansions.map((expansion) => {
    const replacedAtoms = Object.fromEntries(expansion.replacedAtoms.map((replacement) => [replacement.from, replacement.to]))
    return {
      id: expansion.bundleID,
      ...(expansion.removedAtomIDs.length > 0 ? { removedAtoms: expansion.removedAtomIDs } : {}),
      ...(Object.keys(replacedAtoms).length > 0 ? { replacedAtoms } : {}),
    }
  })
  return {
    id: `custom.${contract.product}`,
    version: contract.recipeVersion,
    modules: [],
    atoms,
    productShells,
    bundles,
    bindings: contract.bindings.map((binding) => ({ port: binding.portID, module: binding.providerAtomID })).sort((left, right) => left.port.localeCompare(right.port)),
    requiredCapabilities: contract.ports.filter((port) => port.required).map((port) => port.id).sort(),
    personalities: contract.product === "minimal" ? ["common"] : ["common", contract.product],
    entrypoints: Object.fromEntries(
      contract.surfaces
        .map((surface): [string, string] => [surface.id, surface.atomID])
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
    metadata: {
      generatedBy: "helix-builder",
      basedOn: contract.recipeID,
      product: contract.product,
      sourceFingerprint: contract.fingerprints.contract,
      bundleExpansion: contract.bundleExpansions.map((expansion) => ({
        bundleID: expansion.bundleID,
        atomIDs: expansion.atomIDs,
        portIDs: expansion.portIDs,
      })),
    },
  }
}

function harnessBuilderCompileProfile(recipe: HarnessBuilderRecipe): Pick<HarnessBuilderPreset, "compileStatus" | "compileDiagnostics"> {
  try {
    compileRecipe(recipe)
    return { compileStatus: "passed", compileDiagnostics: [] }
  } catch (error) {
    return {
      compileStatus: "failed",
      compileDiagnostics: [error instanceof Error ? error.message : String(error)],
    }
  }
}

function bundleStatesForContract(contract: AssemblyContract): HarnessBuilderBundleState[] {
  return contract.bundleExpansions.map((expansion) => {
    const bundle = contract.bundles.find((candidate) => candidate.id === expansion.bundleID)
    return {
      id: expansion.bundleID,
      status: bundle?.status ?? (expansion.missingAtomIDs.length > 0 ? "partial" : "selected"),
      selectionSource: bundle?.selectionSource ?? "inferred",
      atoms: expansion.atomIDs,
      selectedAtoms: expansion.selectedAtomIDs,
      missingAtoms: expansion.missingAtomIDs,
      removedAtoms: expansion.removedAtomIDs,
      replacedAtoms: expansion.replacedAtoms,
    }
  })
}

function bundleStatesForAtomIDs(atomIDs: string[]): HarnessBuilderBundleState[] {
  return inferBundleMatches(atomIDs).map((match) => ({
    id: match.id,
    status: match.status,
    selectionSource: "inferred",
    atoms: match.atoms,
    selectedAtoms: match.selectedAtoms,
    missingAtoms: match.missingAtoms,
    removedAtoms: [],
    replacedAtoms: [],
  }))
}

function productLabel(product: string): string {
  if (product === "opencode") return "OpenCode"
  if (product === "pi-mono") return "Pi Mono"
  if (product === "nanobot") return "Nanobot"
  if (product === "hermes-agent") return "Hermes Agent"
  if (product === "minimal") return "Minimal"
  if (product === "hybrid-mix") return "混搭示例 / Hybrid Mix"
  return product
}

const officialBuilderParityRequiredPlanes = [
  "prompt",
  "config",
  "identity",
  "provider",
  "tool",
  "hook",
  "session",
  "event",
  "trace",
  "runtime",
  "agent-loop",
  "product",
  "ui",
]

const officialBuilderParityTargets: Record<string, HarnessBuilderParityTarget> = {
  opencode: {
    id: "opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    product: "opencode",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    requiredPlanes: officialBuilderParityRequiredPlanes,
    fixtureMatrix: [
      "opencode-prompt:upstream-system-output-matrix",
      "opencode-config:source-matrix",
      "opencode-identity:source-matrix",
      "opencode-provider:source-matrix",
      "opencode-provider:raw-frame-boundary-matrix",
      "opencode-provider:plugin-runtime-matrix",
      "opencode-provider:package-runtime-projection",
      "opencode-provider:package-runtime-live-runtime-fixture",
      "opencode-provider:retry-cancel-race-projection",
      "opencode-provider:retry-cancel-live-runtime-fixture",
      "opencode-tool:contract-render-projection",
      "opencode-tool:live-runtime-fixture",
      "opencode-tool:source-matrix",
      "opencode-hook:live-runtime-fixture",
      "opencode-hook:source-matrix",
      "opencode-session:source-matrix",
      "opencode-event:live-runtime-fixture",
      "opencode-event:source-matrix",
      "opencode-foundation-trace:runtime-projection",
      "opencode-foundation-trace:source-matrix",
      "opencode-product-shell:live-runtime-fixture",
      "opencode-product-shell:runtime-projection",
      "opencode-product-shell:source-matrix",
      "opencode-ui:live-runtime-fixture",
      "opencode-ui:source-matrix",
      "task-parity-native-cadence-fixtures:opencode",
      "flow-graph:opencode-runtime-projection",
    ],
  },
  "pi-mono": {
    id: "pi-mono@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    product: "pi-mono",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    requiredPlanes: officialBuilderParityRequiredPlanes,
    fixtureMatrix: ["pi-prompt:source-matrix", "pi-provider:source-matrix", "pi-session:source-matrix", "pi-product-shell:source-matrix", "task-parity-native-cadence-fixtures:pi-mono"],
  },
  nanobot: {
    id: "nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    packageVersion: "nanobot-ai@0.2.0",
    requiredPlanes: officialBuilderParityRequiredPlanes,
    fixtureMatrix: ["nanobot-prompt:source-matrix", "nanobot-provider:source-matrix", "nanobot-session:source-matrix", "nanobot-product-shell:source-matrix", "task-parity-native-cadence-fixtures:nanobot"],
  },
  "hermes-agent": {
    id: "hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
    product: "hermes-agent",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    packageVersion: "hermes-agent==0.15.1",
    requiredPlanes: officialBuilderParityRequiredPlanes,
    fixtureMatrix: ["hermes-prompt:source-matrix", "hermes-provider:source-matrix", "hermes-session:source-matrix", "hermes-product-shell:source-matrix", "task-parity-native-cadence-fixtures:hermes-agent"],
  },
}

function parityTargetRef(target: HarnessBuilderParityTarget): string {
  return `${target.repo}@${target.ref}`
}

function presetParityTargetSummary(target: HarnessBuilderParityTarget): string {
  return `Targets ${parityTargetRef(target)} across ${target.requiredPlanes.length} planes with fixture matrix entries, but current evidence still includes partial fixtures and bridge lossiness; native parity remains unverified.`
}

function uniqueParityTargets(targets: HarnessBuilderParityTarget[]): HarnessBuilderParityTarget[] {
  const seen = new Set<string>()
  return targets.filter((target) => {
    if (seen.has(target.id)) return false
    seen.add(target.id)
    return true
  })
}

function executableRequiredForPort(portID: string): boolean {
  return Boolean(executablePortRuleCatalog([portID])[0]?.executableRequired)
}

function parityTargetForModuleClaim(sourceProduct: string, parityTargets: HarnessBuilderParityTarget[]): HarnessBuilderParityTarget | undefined {
  if (parityTargets.length === 1) return parityTargets[0]
  return parityTargets.find((target) => target.product === sourceProduct)
}

type HarnessBuilderModuleClaimAtom = Pick<
  HarnessBuilderAtom,
  | "id"
  | "kind"
  | "scope"
  | "productScope"
  | "stability"
  | "implementationKind"
  | "selectionReason"
  | "provides"
  | "nativeEvidenceRefs"
  | "fixtureIDs"
  | "parityCoverage"
  | "knownLossiness"
>

function buildHarnessBuilderModuleClaim(input: {
  presetProduct: string
  portID: string
  providerAtomID: string
  atom: HarnessBuilderModuleClaimAtom | undefined
  parityTargets: HarnessBuilderParityTarget[]
}): HarnessBuilderModuleClaim {
  const sourceProduct = input.atom ? productFamilyForAtom(input.atom.id) : "unknown"
  const target = parityTargetForModuleClaim(sourceProduct, input.parityTargets)
  const implementation = input.atom
    ? harnessBuilderImplementationProfile(input.atom)
    : ({
        level: "metadata-only",
        label: implementationLabels["metadata-only"],
        summary: "Provider atom is missing from the assembly contract.",
      } satisfies HarnessBuilderImplementationProfile)
  const portCompatible = Boolean(input.atom && input.atom.provides.includes(input.portID))
  const executableRequired = executableRequiredForPort(input.portID)
  const behaviorCompatible = Boolean(input.atom) && portCompatible && !(executableRequired && (implementation.level === "metadata-only" || implementation.level === "preview-shell"))
  const productMatchesTarget = Boolean(target && sourceProduct === target.product)
  const nativeProof = Boolean(input.atom && hasHarnessBuilderNativeProof(input.atom))
  const parityTargetSatisfied = Boolean(target && productMatchesTarget && nativeProof)
  const blockers = uniqueStrings([
    ...(!input.atom ? ["provider-atom-missing"] : []),
    ...(!portCompatible ? ["port-not-provided-by-atom"] : []),
    ...(executableRequired && implementation.level === "metadata-only" ? ["metadata-only-provider-for-executable-port"] : []),
    ...(executableRequired && implementation.level === "preview-shell" ? ["preview-shell-provider-for-executable-port"] : []),
    ...(!target ? ["no-parity-target"] : []),
    ...(target && !productMatchesTarget ? ["source-product-mismatch"] : []),
    ...(target && !nativeProof ? [`module-claim-${implementation.level}`] : []),
    ...(input.atom?.knownLossiness ?? []),
  ])
  const parityCompatible: HarnessBuilderParityCompatibility = !target
    ? "not-targeted"
    : parityTargetSatisfied
      ? "satisfied"
      : behaviorCompatible
        ? "partial"
        : "blocked"
  return {
    level: implementation.level,
    label: implementation.label,
    sourceProduct,
    sourceScope: input.atom?.scope ?? "unknown",
    ...(target
      ? {
          parityTargetProduct: target.product,
          parityTargetRef: parityTargetRef(target),
        }
      : {}),
    portCompatible,
    behaviorCompatible,
    parityCompatible,
    parityTargetSatisfied,
    evidenceRefs: input.atom?.nativeEvidenceRefs ?? [],
    fixtureIDs: input.atom?.fixtureIDs ?? [],
    knownLossiness: input.atom?.knownLossiness ?? [],
    blockers,
    summary: moduleClaimSummary({
      presetProduct: input.presetProduct,
      portID: input.portID,
      providerAtomID: input.providerAtomID,
      level: implementation.level,
      sourceProduct,
      target,
      parityTargetSatisfied,
      parityCompatible,
      blockers,
    }),
  }
}

function moduleClaimSummary(input: {
  presetProduct: string
  portID: string
  providerAtomID: string
  level: HarnessBuilderImplementationLevel
  sourceProduct: string
  target: HarnessBuilderParityTarget | undefined
  parityTargetSatisfied: boolean
  parityCompatible: HarnessBuilderParityCompatibility
  blockers: string[]
}): string {
  const targetText = input.target ? parityTargetRef(input.target) : "no upstream parity target"
  if (input.parityTargetSatisfied) {
    return `${input.providerAtomID} satisfies ${targetText} for ${input.portID}.`
  }
  if (!input.target) {
    return `${input.providerAtomID} is ${input.level} for ${input.portID}; it is port/behavior compatible in ${input.presetProduct}, but no upstream parity target is attached.`
  }
  const blockerText = input.blockers.slice(0, 4).join(", ") || input.parityCompatible
  return `${input.providerAtomID} is ${input.level} from ${input.sourceProduct} for ${input.portID}; it does not satisfy ${targetText} yet (${blockerText}).`
}

function presetAssemblyClaim(product: string): Pick<
  HarnessBuilderPreset,
  | "assemblyClaim"
  | "assemblyClaimLabel"
  | "compositionClaim"
  | "parityTargets"
  | "parityTargetSatisfied"
  | "parityTargetSummary"
  | "evidencePolicy"
  | "nativeParityVerified"
  | "nativeParitySummary"
> {
  if (product === "minimal") {
    return {
      assemblyClaim: "helix-minimal",
      assemblyClaimLabel: "Helix 最小装配 / Helix minimal assembly",
      compositionClaim: "helix-minimal",
      parityTargets: [],
      parityTargetSatisfied: false,
      parityTargetSummary: "No product-native parity target is claimed for the neutral minimal harness.",
      evidencePolicy: "no-native-claim",
      nativeParityVerified: false,
      nativeParitySummary: "No product-native parity target is claimed for the neutral minimal harness.",
    }
  }
  if (product === "hybrid-mix") {
    return {
      assemblyClaim: "mixed-compatible-runnable",
      assemblyClaimLabel: "混搭兼容装配 / Mixed compatible assembly",
      compositionClaim: "experimental-hybrid",
      parityTargets: [],
      parityTargetSatisfied: false,
      parityTargetSummary: "Hybrid mixes compatible product-shaped bridges and must not inherit native parity from any single preset identity.",
      evidencePolicy: "compatibility-bridge-visible",
      nativeParityVerified: false,
      nativeParitySummary: "Combines multiple product-shaped bridges for inspection and experimentation; it is not native parity verified for any single product.",
    }
  }
  const target = officialBuilderParityTargets[product]
  if (target) {
    return {
      assemblyClaim: "upstream-parity-target",
      assemblyClaimLabel: "上游一致性目标 / Upstream parity target",
      compositionClaim: "upstream-parity-target",
      parityTargets: [target],
      parityTargetSatisfied: false,
      parityTargetSummary: presetParityTargetSummary(target),
      evidencePolicy: "native-proof-required",
      nativeParityVerified: false,
      nativeParitySummary: `${productLabel(product)} is pinned to ${parityTargetRef(target)}, but TODO-027 still has partial fixture, bridge, preview, and native surface gaps; do not treat it as native-equivalent.`,
    }
  }
  return {
    assemblyClaim: "product-profile-runnable",
    assemblyClaimLabel: "可运行产品画像装配 / Runnable product-profile assembly",
    compositionClaim: "custom-composition",
    parityTargets: [],
    parityTargetSatisfied: false,
    parityTargetSummary: "Custom product profile has no upstream parity target until one is declared.",
    evidencePolicy: "compatibility-bridge-visible",
    nativeParityVerified: false,
    nativeParitySummary: "Runs through Helix atoms and real provider paths, but TODO-024 still has upstream prompt, TUI, provider, and surface parity gaps; do not treat it as native-equivalent.",
  }
}

function buildHybridMixPreset(presets: HarnessBuilderPreset[]): HarnessBuilderPreset {
  const byID = new Map(presets.map((preset) => [preset.id, preset]))
  const minimal = byID.get("minimal")
  const requiredPorts = uniqueStrings(presets.flatMap((preset) => preset.requiredPorts))
  const bindings = requiredPorts
    .map((portID) => bindingForHybridPort(portID, byID))
    .filter((binding): binding is HarnessBuilderPreset["bindings"][number] => Boolean(binding))
    .sort((left, right) => left.portID.localeCompare(right.portID))
  const selected = uniqueStrings([
    ...(minimal?.atoms ?? []),
    ...bindings.map((binding) => binding.providerAtomID),
    "opencode.product-shell.sdk",
    "opencode.product-shell.web",
    "pi.product-shell.tui",
    "pi.product-shell.rpc",
    "nanobot.product-shell.cli",
    "nanobot.product-shell.web-ui",
    "hermes.product-shell.gateway",
    "hermes.product-shell.web-dashboard",
  ])
  const productShells = selected.filter((id) => isProductShellID(id)).map((id) => ({ id }))
  const atoms = selected.filter((id) => !isProductShellID(id)).map((id) => ({ id }))
  const surfaces = productShells.map((shell) => ({
    id: surfaceIDForHybridShell(shell.id),
    type: productFamilyForAtom(shell.id),
    atomID: shell.id,
  }))
  const bundleStates = bundleStatesForAtomIDs(selected)
  const bundles = bundleStates.filter((bundle) => bundle.status === "selected").map((bundle) => bundle.id).sort()
  const hybridParityTargets = uniqueParityTargets(presets.flatMap((preset) => preset.parityTargets))
  const recipe: HarnessBuilderRecipe = {
    id: "custom.hybrid-mix",
    version: "0.1.0",
    modules: [],
    atoms,
    productShells,
    bundles: bundles.map((id) => ({ id })),
    bindings: bindings.map((binding) => ({ port: binding.portID, module: binding.providerAtomID })),
    requiredCapabilities: requiredPorts,
    personalities: ["common", "opencode", "pi-mono", "nanobot", "hermes-agent"],
    entrypoints: Object.fromEntries(surfaces.map((surface) => [surface.id, surface.atomID])),
    metadata: {
      generatedBy: "helix-builder",
      basedOn: "minimal + opencode + pi-mono + nanobot + hermes-agent",
      product: "hybrid-mix",
      sourceFingerprint: "hybrid-mix",
      purpose: "Demonstrates composing a new harness from common lego blocks plus OpenCode, Pi, Nanobot, and Hermes Agent atoms.",
      bundleExpansion: bundleStates
        .filter((bundle) => bundle.status === "selected")
        .map((bundle) => ({ bundleID: bundle.id, atomIDs: bundle.atoms, portIDs: [] })),
    },
  }
  return {
    id: "hybrid-mix",
    label: productLabel("hybrid-mix"),
    product: "hybrid-mix",
    recipeID: "hybrid.mix.demo",
    fingerprint: "hybrid-mix",
    ...harnessBuilderCompileProfile(recipe),
    ...presetAssemblyClaim("hybrid-mix"),
    parityTargets: hybridParityTargets,
    parityTargetSummary:
      hybridParityTargets.length > 0
        ? `Hybrid demo carries ${hybridParityTargets.length} partial upstream parity targets for inspection, but its composition claim remains experimental-hybrid and native parity is not inherited.`
        : "Hybrid demo has no upstream parity targets attached.",
    atoms: selected,
    requiredPorts,
    surfaces,
    bundles,
    bundleStates,
    bindings,
    recipe,
  }
}

function bindingForHybridPort(portID: string, presets: Map<string, HarnessBuilderPreset>): HarnessBuilderPreset["bindings"][number] | undefined {
  const preferred = presets.get(hybridSourceForPort(portID))?.bindings.find((binding) => binding.portID === portID)
  const fallback = ["minimal", "opencode", "pi-mono", "nanobot", "hermes-agent"]
    .map((presetID) => presets.get(presetID)?.bindings.find((binding) => binding.portID === portID))
    .find(Boolean)
  const binding = preferred ?? fallback
  return binding
    ? {
        portID: binding.portID,
        providerAtomID: binding.providerAtomID,
        consumerAtomID: binding.consumerAtomID,
        why: `hybrid example uses ${hybridSourceForPort(portID)} block for ${portID}`,
        canSwapWith: binding.canSwapWith,
        moduleClaim: {
          ...binding.moduleClaim,
          parityTargetSatisfied: false,
          parityCompatible: binding.moduleClaim.parityCompatible === "satisfied" ? "partial" : binding.moduleClaim.parityCompatible,
          blockers: uniqueStrings(["experimental-hybrid-composition", ...binding.moduleClaim.blockers]),
          summary: `Hybrid example selects ${binding.providerAtomID} for ${portID}; ${binding.moduleClaim.summary}`,
        },
      }
    : undefined
}

function hybridSourceForPort(portID: string): string {
  if (portID === "product.shell") return "opencode"
  if (portID.startsWith("session.")) return "pi-mono"
  if (portID.startsWith("prompt.") || portID.startsWith("resource.")) return "nanobot"
  if (portID.startsWith("provider.")) return "nanobot"
  if (portID.startsWith("tool.") || portID === "tools") return "pi-mono"
  if (portID.startsWith("ui.")) return "nanobot"
  if (portID.startsWith("hook.") || portID.startsWith("registry.")) return "opencode"
  if (portID.startsWith("turn.")) return "opencode"
  if (portID.startsWith("config.")) return "hermes-agent"
  if (portID.startsWith("event.")) return "nanobot"
  if (portID.startsWith("runtime.")) return "opencode"
  return "minimal"
}

function productFamilyForAtom(id: string): string {
  if (id.startsWith("opencode.")) return "opencode"
  if (id.startsWith("pi.")) return "pi-mono"
  if (id.startsWith("nanobot.")) return "nanobot"
  if (id.startsWith("hermes.")) return "hermes-agent"
  return "common"
}

function surfaceIDForHybridShell(id: string): string {
  if (id === "product.shell.minimal-cli") return "common.cli"
  const family = productFamilyForAtom(id)
  const suffix = id.split(".product-shell.")[1] ?? id
  return `${family}.${suffix}`
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort()
}

function readTodoStats(cwd: string): TodoStats {
  let todos: string[] = []
  try {
    const todoDir = join(cwd, "TODO")
    todos = readdirSync(todoDir)
      .filter((file) => /^TODO(?:-\d+)?\.md$/.test(file))
      .sort()
      .map((file) => readFileSync(join(todoDir, file), "utf8"))
  } catch {
    return {
      total: 0,
      complete: 0,
      open: 0,
      completionPercent: 0,
      openItems: [],
      sections: [],
    }
  }
  if (todos.length === 0) {
    return {
      total: 0,
      complete: 0,
      open: 0,
      completionPercent: 0,
      openItems: [],
      sections: [],
    }
  }

  const sections = new Map<string, TodoSectionStats>()
  const openItems: string[] = []
  let currentSection = "Unsectioned"
  let total = 0
  let complete = 0

  for (const line of todos.join("\n").split(/\r?\n/)) {
    const section = /^##\s+(.+)$/.exec(line)
    if (section?.[1]) currentSection = section[1].trim()

    const checkbox = /^- \[(x| )\]\s+(.+)$/i.exec(line)
    if (!checkbox) continue

    total += 1
    const checked = (checkbox[1] ?? "").toLowerCase() === "x"
    if (checked) complete += 1
    const stats = sections.get(currentSection) ?? { title: currentSection, total: 0, complete: 0, open: 0 }
    stats.total += 1
    if (checked) stats.complete += 1
    else {
      stats.open += 1
      if (openItems.length < 8) openItems.push(stripMarkdown(checkbox[2] ?? ""))
    }
    sections.set(currentSection, stats)
  }

  const open = total - complete
  return {
    total,
    complete,
    open,
    completionPercent: total === 0 ? 0 : Math.round((complete / total) * 100),
    openItems,
    sections: Array.from(sections.values()).filter((section) => section.total > 0),
  }
}

function readTaskParityArtifact(cwd: string): ProductTaskParityArtifact | null {
  try {
    const artifactPath = join(cwd, "docs", "reports", "task-parity.json")
    const raw = JSON.parse(readFileSync(artifactPath, "utf8")) as ProductTaskParityArtifact | Record<string, unknown>
    if (raw && raw.schemaVersion === 1 && Array.isArray((raw as ProductTaskParityArtifact).reports) && Array.isArray((raw as ProductTaskParityArtifact).pairs)) {
      return raw as ProductTaskParityArtifact
    }
    const rawRecord = raw as Record<string, unknown>
    if (rawRecord && rawRecord.schemaVersion === 2 && rawRecord.artifactKind === "task-parity-summary" && Array.isArray(rawRecord.pairs)) {
      const evidencePath = join(cwd, "docs", "reports", typeof rawRecord.evidencePath === "string" ? rawRecord.evidencePath : "evidence.json")
      let reports: unknown[] = []
      try {
        const evidence = JSON.parse(readFileSync(evidencePath, "utf8")) as { reports?: unknown[] }
        reports = evidence.reports ?? []
      } catch {
        reports = []
      }
      const acceptanceTimingDriftsByPair = new Map<string, ProductTaskParityArtifact["pairs"][number]["acceptanceTimingDrifts"]>()
      for (const report of reports) {
        const record = report as { taskID?: unknown; product?: unknown; acceptanceTimingDrifts?: unknown }
        if (typeof record.taskID === "string" && typeof record.product === "string" && Array.isArray(record.acceptanceTimingDrifts)) {
          acceptanceTimingDriftsByPair.set(
            `${record.taskID}:${record.product}`,
            record.acceptanceTimingDrifts as ProductTaskParityArtifact["pairs"][number]["acceptanceTimingDrifts"],
          )
        }
      }
      const summary = rawRecord.summary && typeof rawRecord.summary === "object" ? (rawRecord.summary as ProductTaskParityArtifact["summary"]) : { reports: reports.length, matched: 0, acceptableDrift: 0, gapsFound: 0, failed: 0 }
      return {
        schemaVersion: 1,
        generatedAt: String(rawRecord.generatedAt ?? ""),
        suite: String(rawRecord.suite ?? "split-summary"),
        provider: normalizeTaskParityProvider(rawRecord.provider),
        reports: reports as ProductTaskParityArtifact["reports"],
        pairs: (rawRecord.pairs as ProductTaskParityArtifact["pairs"]).map((pair) => {
          const pairRecord = pair as { taskID?: unknown; product?: unknown; acceptanceTimingDrifts?: unknown }
          const pairKey = `${String(pairRecord.taskID ?? "")}:${String(pairRecord.product ?? "")}`
          const acceptanceTimingDrifts = Array.isArray(pairRecord.acceptanceTimingDrifts)
            ? (pairRecord.acceptanceTimingDrifts as ProductTaskParityArtifact["pairs"][number]["acceptanceTimingDrifts"])
            : (acceptanceTimingDriftsByPair.get(pairKey) ?? [])
          return {
            ...pair,
            outputParity: Boolean((pair as { strictOutputParity?: unknown }).strictOutputParity),
            traceParity: Boolean((pair as { strictTraceParity?: unknown }).strictTraceParity),
            cadenceParity: Boolean((pair as { strictCadenceParity?: unknown }).strictCadenceParity),
            costLatencyParity: true,
            cadenceScoreBreakdown: (pair as { cadenceScoreBreakdown?: unknown }).cadenceScoreBreakdown ?? { modelVersion: 2, rawDriftCount: 0, weightedPenalty: 0, targetScore: 100, items: [] },
            cadenceDrifts: (pair as { cadenceDrifts?: unknown[] }).cadenceDrifts ?? [],
            acceptanceTimingDrifts,
            gaps: (pair as { gaps?: unknown[] }).gaps ?? [],
          }
        }) as ProductTaskParityArtifact["pairs"],
        summary,
      }
    }
    return null
  } catch {
    return null
  }
}

function normalizeTaskParityProvider(value: unknown): ProductTaskParityArtifact["provider"] {
  if (value === "live") return "live"
  if (value === "fake" || value === "fixture") return "fixture"
  return "cassette"
}

function readAssemblyContracts(cwd: string, taskParity: ProductTaskParityArtifact | null): AssemblyContract[] {
  const products = ["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal"] as const
  return products.map((product) => {
    const path = join(cwd, "docs", "reports", `assembly-contract-${product}.json`)
    try {
      const artifact = readAssemblyContract(path)
      return artifact.schemaVersion === 1 && verifyAssemblyContract(artifact).ok ? artifact : buildAssemblyContract({ product })
    } catch {
      return buildAssemblyContract({
        product,
        ...(taskParity ? { taskParityArtifact: taskParity, includeTaskParity: true } : {}),
      })
    }
  })
}

function packageAtomGroupsFor(recipes: CompiledRecipe[]): PackageAtomGroup[] {
  const packages = new Map<string, Map<string, PackageAtomRow>>()
  for (const recipe of recipes) {
    for (const module of recipe.modules) {
      const packageName = packageForModule(module.id)
      const atoms = packages.get(packageName) ?? new Map<string, PackageAtomRow>()
      const row = atoms.get(module.id) ?? {
        id: module.id,
        provides: new Set<string>(),
        variants: new Set<string>(),
        personalities: new Set<string>(),
        recipes: new Set<string>(),
      }
      for (const capability of module.provides) row.provides.add(capability)
      row.variants.add(module.variant ?? "base")
      row.personalities.add(module.personality)
      row.recipes.add(recipe.id)
      atoms.set(module.id, row)
      packages.set(packageName, atoms)
    }
  }

  return Array.from(packages.entries())
    .map(([packageName, atoms]) => ({
      packageName,
      atoms: Array.from(atoms.values()).sort((left, right) => left.id.localeCompare(right.id)),
    }))
    .sort((left, right) => left.packageName.localeCompare(right.packageName))
}

function renderPackageAtomGroups(groups: PackageAtomGroup[]): string {
  return groups
    .map(
      (group) => `<article class="package-card" data-package-atoms="${escapeHTML(group.packageName)}">
        <div class="package-head">
          <h3>${escapeHTML(group.packageName)}</h3>
          <span class="chip">${group.atoms.length} atoms</span>
        </div>
        <div class="package-atoms">
          ${group.atoms.map(renderPackageAtom).join("")}
        </div>
      </article>`,
    )
    .join("")
}

function renderPackageAtom(atom: PackageAtomRow): string {
  const personalities = Array.from(atom.personalities).sort()
  const personality = personalities.length === 1 ? (personalities[0] ?? "common") : "mixed"
  const variants = Array.from(atom.variants).sort().join(", ")
  const provides = Array.from(atom.provides).sort().join(", ")
  const recipes = Array.from(atom.recipes).sort().join(", ")
  return `<div class="package-atom" data-package-atom="${escapeHTML(atom.id)}" data-personality="${escapeHTML(personality)}">
    <div>
      <div class="package-atom-name">${escapeHTML(atom.id)}</div>
      <div class="module-meta">provides ${escapeHTML(provides)} · recipes ${escapeHTML(recipes)}</div>
    </div>
    <span class="chip">${escapeHTML(variants)}</span>
  </div>`
}

function packageForModule(moduleID: string): string {
  return routeForAtomBlock(moduleID).packageName
}

function renderLedgerSummary(report: LegoBlockLedgerReport): string {
  const coverage = report.coverage
  const boundRows = report.rows.filter((row) => row.bound).sort((left, right) => left.id.localeCompare(right.id))
  const issueRows = report.issues.length
    ? report.issues.map((issue) => `<div class="todo-item" data-ledger-issue="${escapeHTML(issue.id)}">${escapeHTML(issue.message)}</div>`).join("")
    : `<div class="todo-item" data-ledger-ok="true">pass: ledger is synchronized.</div>`
  return `<div class="graph" data-ledger-ok="${String(report.ok)}">
    <div class="graph-row" data-ledger-metric="cataloged">
      <div class="graph-cell left">cataloged <span class="chip">${coverage.catalogedPorts}</span></div>
      <div class="connector" aria-hidden="true"></div>
      <div class="graph-cell right">fixtures <span class="chip">${coverage.fixturePorts}</span></div>
    </div>
    <div class="graph-row" data-ledger-metric="conformance">
      <div class="graph-cell left">conformance <span class="chip">${coverage.conformanceTestedPorts}</span></div>
      <div class="connector" aria-hidden="true"></div>
      <div class="graph-cell right">bound <span class="chip">${coverage.boundPorts}</span></div>
    </div>
    <div class="graph-row" data-ledger-metric="exports">
      <div class="graph-cell left">exports <span class="chip">${coverage.publicModulesWithRoute}/${coverage.publicModules}</span></div>
      <div class="connector" aria-hidden="true"></div>
      <div class="graph-cell right">leaks <span class="chip">${coverage.productSpecificLeaks}</span></div>
    </div>
    <div class="graph-row" data-ledger-metric="port-semantics">
      <div class="graph-cell left">errors/traces <span class="chip">${coverage.portsWithErrors}/${coverage.portsWithTraces}</span></div>
      <div class="connector" aria-hidden="true"></div>
      <div class="graph-cell right">test atoms <span class="chip">${coverage.portsWithTestAtoms}</span></div>
    </div>
    <div class="graph-row" data-ledger-metric="block-kinds">
      <div class="graph-cell left">atoms <span class="chip">${coverage.replaceableAtomBlocks}</span></div>
      <div class="connector" aria-hidden="true"></div>
      <div class="graph-cell right">packs/shells <span class="chip">${coverage.packBlocks}/${coverage.productShellBlocks}</span></div>
    </div>
    ${boundRows
      .map(
        (row) => `<div class="graph-row" data-ledger-port="${escapeHTML(row.id)}">
          <div class="graph-cell left">${escapeHTML(row.id)} <span class="chip">${row.cataloged ? "cataloged" : "missing"}</span></div>
          <div class="connector" aria-hidden="true"></div>
          <div class="graph-cell right">fixture <span class="chip">${row.fixture ? "yes" : "no"}</span> · test <span class="chip">${row.testAtoms.length}</span></div>
        </div>`,
      )
      .join("")}
    ${issueRows}
  </div>`
}

function renderAssemblyContracts(contracts: AssemblyContract[]): string {
  if (contracts.length === 0) return `<div class="todo-item" data-assembly-contract-missing="true">No assembly contracts available.</div>`
  return `<div class="graph" data-assembly-contracts="${contracts.length}">
    ${contracts
      .map((contract) => {
        const verification = verifyAssemblyContract(contract)
        return `<div class="graph-row" data-assembly-contract-product="${escapeHTML(contract.product)}" data-assembly-contract-ok="${String(verification.ok)}" data-assembly-contract-fingerprint="${escapeHTML(contract.fingerprints.contract)}">
          <div class="graph-cell left">${escapeHTML(contract.product)} <span class="chip">${contract.atoms.length} atoms</span> <span class="chip">${contract.ports.length} ports</span></div>
          <div class="connector" aria-hidden="true"></div>
          <div class="graph-cell right">swap <span class="chip">${contract.swapPoints.length}</span> · product <span class="chip">${contract.productSpecificAtoms.length}</span> · fixture <span class="chip">${contract.fixtureOnlyAtoms.length}</span></div>
        </div>`
      })
      .join("")}
    ${contracts
      .flatMap((contract) => contract.swapPoints.map((swap) => ({ contract, swap })))
      .map(
        ({ contract, swap }) => `<div class="graph-row" data-assembly-swap-point="${escapeHTML(`${contract.product}:${swap.port}`)}">
          <div class="graph-cell left">${escapeHTML(swap.port)} <span class="chip">${escapeHTML(contract.product)}</span></div>
          <div class="connector" aria-hidden="true"></div>
          <div class="graph-cell right">${escapeHTML(swap.selectedAtom)} <span class="chip">${swap.candidates.length} candidates</span></div>
        </div>`,
      )
      .join("")}
  </div>`
}

function renderTaskParity(artifact: ProductTaskParityArtifact | null): string {
  if (!artifact) return `<div class="todo-item" data-task-parity-missing="true">No task parity artifact found.</div>`
  const tasks = [...new Set(artifact.reports.map((report) => report.taskID))].sort()
  const products = [...new Set(artifact.reports.map((report) => report.product))].sort()
  const openGaps = artifact.reports.flatMap((report) =>
    report.gaps.map((gap) => ({
      taskID: report.taskID,
      product: report.product,
      mode: report.mode,
      id: gap.id,
      category: gap.category,
      nextAction: gap.nextAction,
    })),
  )
  const cadenceDrifts = artifact.pairs.flatMap((pair) =>
    (pair.cadenceDrifts ?? []).map((drift) => ({
      taskID: pair.taskID,
      product: pair.product,
      id: drift.id,
      category: drift.category,
      score: pair.cadenceScore ?? 0,
      target: pair.cadenceScoreBreakdown?.targetScore ?? 100,
      owningPlane: drift.metadata?.owningPlane ?? drift.owner,
      owningAtomID: drift.metadata?.owningAtomID ?? "unknown",
      confidence: drift.metadata?.observability?.comparisonConfidence ?? "unknown",
      scoringMode: drift.metadata?.observability?.scoringMode ?? "unknown",
      weight: pair.cadenceScoreBreakdown?.items.find((item) => item.id === drift.id)?.weight ?? 0,
    })),
  )
  const acceptanceTimingDrifts = artifact.pairs.flatMap((pair) =>
    (pair.acceptanceTimingDrifts ?? []).map((drift) => ({
      taskID: pair.taskID,
      product: pair.product,
      id: drift.id,
      category: drift.category,
      owningAtomID: drift.owningAtomID,
      satisfiedAt: `${drift.assembled.satisfiedAt}/${drift.original.satisfiedAt}`,
      lossiness: drift.lossinessRefs.join(","),
    })),
  )
  const averageCadenceScore =
    artifact.pairs.length === 0 ? 0 : Math.round(artifact.pairs.reduce((sum, pair) => sum + (pair.cadenceScore ?? 0), 0) / artifact.pairs.length)
  return `<div data-task-parity-summary="${artifact.summary.reports}:${artifact.pairs.length}:${artifact.summary.gapsFound}:${artifact.summary.failed}">
    <div class="metrics compact-metrics">
      <div class="metric"><strong>${artifact.summary.reports}</strong><span>Reports</span></div>
      <div class="metric"><strong>${artifact.pairs.length}</strong><span>Pairs</span></div>
      <div class="metric"><strong>${tasks.length}</strong><span>Tasks</span></div>
      <div class="metric"><strong>${products.length}</strong><span>Products</span></div>
      <div class="metric"><strong>${artifact.summary.gapsFound}</strong><span>Gaps</span></div>
      <div class="metric"><strong>${artifact.summary.failed}</strong><span>Failed</span></div>
      <div class="metric"><strong>${averageCadenceScore}</strong><span>Cadence</span></div>
    </div>
    <div class="graph">
      ${artifact.pairs
        .map(
          (pair) => `<div class="graph-row" data-task-parity-pair="${escapeHTML(`${pair.taskID}:${pair.product}`)}" data-task-parity-status="${escapeHTML(pair.status)}">
            <div class="graph-cell left">${escapeHTML(pair.taskID)} <span class="chip">${escapeHTML(pair.product)}</span></div>
            <div class="connector" aria-hidden="true"></div>
            <div class="graph-cell right">
              output <span class="chip">${pair.outputParity ? "ok" : "gap"}</span>
              artifact <span class="chip">${pair.artifactParity ? "ok" : "gap"}</span>
              trace <span class="chip">${pair.traceParity ? "ok" : "gap"}</span>
              policy <span class="chip">${pair.policyParity ? "ok" : "gap"}</span>
              cadence <span class="chip">${pair.cadenceParity ? "ok" : pair.cadenceLevel ?? "drift"}</span>
              acceptance timing <span class="chip">${pair.acceptanceTimingDrifts?.length ? "partial" : "ok"}</span>
              score <span class="chip">${pair.cadenceScore ?? 0}</span>
              target <span class="chip">${pair.cadenceScoreBreakdown?.targetScore ?? 100}</span>
              penalty <span class="chip">${pair.cadenceScoreBreakdown?.weightedPenalty ?? 0}</span>
            </div>
          </div>`,
        )
        .join("")}
      ${
        openGaps.length === 0
          ? `<div class="todo-item" data-task-parity-open-gaps="0">No open task parity gaps in deterministic smoke.</div>`
          : openGaps
              .slice(0, 12)
              .map(
                (gap) => `<div class="todo-item" data-task-parity-gap="${escapeHTML(`${gap.taskID}:${gap.product}:${gap.mode}:${gap.id}`)}">
                  ${escapeHTML(`${gap.category}: ${gap.nextAction}`)}
                </div>`,
              )
              .join("")
      }
      ${
        cadenceDrifts.length === 0
          ? `<div class="todo-item" data-task-parity-cadence-drifts="0">No open cadence drifts in deterministic smoke.</div>`
          : cadenceDrifts
              .slice(0, 12)
              .map(
                (drift) => `<div class="todo-item" data-task-parity-cadence-drift="${escapeHTML(`${drift.taskID}:${drift.product}:${drift.id}`)}">
                  cadence ${escapeHTML(`${drift.category}: score ${drift.score}/${drift.target}, weight ${drift.weight}, ${drift.confidence}/${drift.scoringMode}, ${drift.owningPlane}:${drift.owningAtomID}`)}
                </div>`,
              )
              .join("")
      }
      ${
        acceptanceTimingDrifts.length === 0
          ? `<div class="todo-item" data-task-parity-acceptance-timing-drifts="0">No acceptance timing drifts recorded.</div>`
          : acceptanceTimingDrifts
              .slice(0, 12)
              .map(
                (drift) => `<div class="todo-item" data-task-parity-acceptance-timing-drift="${escapeHTML(`${drift.taskID}:${drift.product}:${drift.id}`)}">
                  acceptance ${escapeHTML(`${drift.category}: ${drift.satisfiedAt}, ${drift.owningAtomID}, ${drift.lossiness}`)}
                </div>`,
              )
              .join("")
      }
    </div>
  </div>`
}

function renderExternalTools(summary: HarnessExternalToolSummary): string {
  if (summary.tools.length === 0) return `<p data-external-tools-empty="true">No external tool profiles are registered.</p>`
  return `<div class="graph" data-external-tools="ready" data-external-tool-count="${summary.tools.length}">
    ${summary.tools
      .map((tool) => {
        const products = tool.supportedProducts.join(", ") || "none"
        const unsupported = tool.unsupportedProducts.join(", ") || "none"
        const formats = tool.supportedArtifactFormats.join(", ") || "none"
        const captureModes = tool.supportedCaptureModes.join(", ") || "none"
        const lossiness = tool.lossinessNotes.slice(0, 2).join(" / ") || "normalized evidence only"
        const unsupportedGap = tool.unsupportedGaps[0]
        const artifact = tool.lastImportedArtifact
        const verifier = tool.lastVerifierResult
        const installHint = tool.installHints[0] ?? "see tool profile"
        const artifactLabel = artifact ? `${artifact.product}:${artifact.taskID}` : "no artifact"
        const verifierLabel = verifier ? (verifier.ok ? "verify ok" : `verify issues=${verifier.issues.length}`) : "verify missing"
        const localOnlyLabel = verifier ? (verifier.localOnly || artifact?.localOnly ? "local-only" : "publishable") : "verifier missing"
        return `<div class="surface-row"
          data-external-tool="${escapeHTML(tool.id)}"
          data-external-tool-install-status="${escapeHTML(tool.installStatus)}"
          data-external-tool-detected-version="${escapeHTML(tool.detectedVersion ?? "")}"
          data-external-tool-default-strategy="${escapeHTML(tool.defaultStrategy)}"
          data-external-tool-supported-products="${escapeHTML(products)}"
          data-external-tool-artifact-formats="${escapeHTML(formats)}"
          data-external-tool-capture-modes="${escapeHTML(captureModes)}"
          data-external-tool-unsupported-gap="${escapeHTML(unsupportedGap ? `${unsupportedGap.product}:${unsupportedGap.status}` : "")}"
          data-external-tool-last-artifact="${escapeHTML(artifact?.artifactPath ?? "")}"
          data-external-tool-last-verifier-ok="${verifier ? String(verifier.ok) : "missing"}"
          data-external-tool-local-only="${String(verifier?.localOnly || artifact?.localOnly || false)}"
          data-external-tool-not-atom="true">
          <span>
            <strong>${escapeHTML(tool.label)}</strong><br>
            <span class="fine">${escapeHTML(tool.repository)}</span><br>
            <span class="fine">${escapeHTML(lossiness)}</span><br>
            ${unsupportedGap ? `<span class="fine" data-external-tool-unsupported-gap-line="${escapeHTML(tool.id)}">gap ${escapeHTML(unsupportedGap.product)}: ${escapeHTML(unsupportedGap.nextAction)}</span><br>` : ""}
            <span class="fine" data-external-tool-artifact-line="${escapeHTML(tool.id)}">${escapeHTML(artifact ? `last artifact ${artifact.artifactPath}` : "last artifact missing")}</span><br>
            <span class="fine" data-external-tool-install-hint="${escapeHTML(tool.id)}">install: ${escapeHTML(installHint)}</span>
          </span>
          <span class="chip" data-external-tool-install-chip="${escapeHTML(tool.id)}">${escapeHTML(tool.installStatus)}</span>
          <span class="chip" data-external-tool-version-chip="${escapeHTML(tool.id)}">${escapeHTML(tool.detectedVersion ?? "version unknown")}</span>
          <span class="chip">${escapeHTML(tool.defaultStrategy)}</span>
          <span class="chip">${escapeHTML(tool.command)}</span>
          <span class="chip">products=${escapeHTML(products)}</span>
          <span class="chip">unsupported=${escapeHTML(unsupported)}</span>
          ${unsupportedGap ? `<span class="chip" data-external-tool-unsupported-gap-chip="${escapeHTML(tool.id)}">${escapeHTML(`${unsupportedGap.product}:${unsupportedGap.status}`)}</span>` : ""}
          <span class="chip">formats=${escapeHTML(formats)}</span>
          <span class="chip">modes=${escapeHTML(captureModes)}</span>
          <span class="chip" data-external-tool-artifact-chip="${escapeHTML(tool.id)}">${escapeHTML(artifactLabel)}</span>
          <span class="chip" data-external-tool-verifier-chip="${escapeHTML(tool.id)}">${escapeHTML(verifierLabel)}</span>
          <span class="chip" data-external-tool-local-only-chip="${escapeHTML(tool.id)}">${escapeHTML(localOnlyLabel)}</span>
        </div>`
      })
      .join("")}
  </div>`
}

function renderNanobotDepth(report: NanobotLegoDepthReport): string {
  const nanobotRow = report.matrix.find((row) => row.product === "nanobot")
  return `<div data-nanobot-lego-depth="${report.ok ? "ok" : "issues"}" data-nanobot-lego-depth-mode="${escapeHTML(report.upstream.parityMode)}">
    <div class="metrics compact-metrics">
      <div class="metric"><strong>${report.mechanisms.length}</strong><span>Mechanisms</span></div>
      <div class="metric"><strong>${report.gaps.length}</strong><span>Gaps</span></div>
      <div class="metric"><strong>${nanobotRow?.productSpecificAtoms ?? 0}</strong><span>Nanobot atoms</span></div>
      <div class="metric"><strong>${nanobotRow?.productShells ?? 0}</strong><span>Surfaces</span></div>
    </div>
    <div class="graph">
      ${report.mechanisms
        .map(
          (mechanism) => `<div class="graph-row" data-nanobot-mechanism="${escapeHTML(mechanism.id)}" data-nanobot-mechanism-status="${escapeHTML(mechanism.status)}">
            <div class="graph-cell left">${escapeHTML(mechanism.id)} <span class="chip">${escapeHTML(mechanism.plane)}</span></div>
            <div class="connector" aria-hidden="true"></div>
            <div class="graph-cell right">${escapeHTML(mechanism.owningAtoms.slice(0, 3).join(", ") || mechanism.evidence.slice(0, 3).join(", ") || "none")} <span class="chip">${escapeHTML(mechanism.status)}</span></div>
          </div>`,
        )
        .join("")}
    </div>
  </div>`
}

function renderRecipe(recipe: CompiledRecipe, kind: "opencode" | "pi-mono" | "nanobot" | "hermes-agent" | "neutral", diff: RecipeDiff): string {
  const swappedModules = new Set([
    ...diff.variantChanges.map((module) => module.id),
    ...diff.leftOnlyModules.map((module) => module.id),
    ...diff.rightOnlyModules.map((module) => module.id),
  ])
  return `<article class="recipe" data-recipe="${escapeHTML(recipe.id)}">
    <div class="recipe-title" data-kind="${kind}">
      <h3>${escapeHTML(recipe.id)}</h3>
      <code>v${escapeHTML(recipe.version)}</code>
    </div>
    <div class="module-list">
      ${recipe.graph.map((module) => renderModule(recipe.modules.find((candidate) => candidate.id === module.id), kind, swappedModules)).join("")}
    </div>
  </article>`
}

function renderModule(module: CompiledRecipeModule | undefined, recipeKind: "opencode" | "pi-mono" | "nanobot" | "hermes-agent" | "neutral", swappedModules: Set<string>): string {
  if (!module) return ""
  const variant = module.variant ?? "base"
  const personality = swappedModules.has(module.id) ? recipeKind : module.personality
  return `<div class="module" data-module="${escapeHTML(module.id)}" data-personality="${escapeHTML(personality)}">
    <div>
      <div class="module-name">${escapeHTML(module.id)}</div>
      <div class="module-meta">provides ${escapeHTML(module.provides.join(", "))}</div>
    </div>
    <span class="chip">${escapeHTML(variant)}</span>
  </div>`
}

function renderDiffRows(diff: RecipeDiff): string {
  const rows = [
    ...diff.commonModules.map((module) => ({
      id: module.id,
      left: module.leftVariant ?? "base",
      right: module.rightVariant ?? "base",
    })),
    ...diff.variantChanges.map((module) => ({
      id: module.id,
      left: module.leftVariant ?? "base",
      right: module.rightVariant ?? "base",
    })),
    ...diff.leftOnlyModules.map((module) => ({ id: module.id, left: module.leftVariant ?? "base", right: "missing" })),
    ...diff.rightOnlyModules.map((module) => ({ id: module.id, left: "missing", right: module.rightVariant ?? "base" })),
  ].sort((left, right) => left.id.localeCompare(right.id))

  return rows
    .map(
      (row) => `<div class="graph-row" data-diff-module="${escapeHTML(row.id)}">
        <div class="graph-cell left">${escapeHTML(row.id)} <span class="chip">${escapeHTML(row.left)}</span></div>
        <div class="connector" aria-hidden="true"></div>
        <div class="graph-cell right">${escapeHTML(row.id)} <span class="chip">${escapeHTML(row.right)}</span></div>
      </div>`,
    )
    .join("")
}

function renderBindingDiffRows(diff: RecipeDiff): string {
  const rows = diff.bindingDiffs.filter((binding) => binding.status !== "same")
  if (rows.length === 0) return `<div class="todo-item">No binding differences.</div>`
  return rows
    .map(
      (row) => `<div class="graph-row" data-binding-port="${escapeHTML(row.port)}" data-binding-status="${escapeHTML(row.status)}">
        <div class="graph-cell left">${escapeHTML(row.port)} <span class="chip">${escapeHTML(row.leftProviders.join(", ") || "missing")}</span></div>
        <div class="connector" aria-hidden="true"></div>
        <div class="graph-cell right">${escapeHTML(row.port)} <span class="chip">${escapeHTML(row.rightProviders.join(", ") || "missing")}</span></div>
      </div>`,
    )
    .join("")
}

function renderSettingDiffRows(kind: "strategy" | "policy", rows: RecipeDiff["strategyDiffs"]): string {
  const changed = rows.filter((row) => row.status !== "same")
  if (changed.length === 0) return `<div class="todo-item">No ${kind} differences.</div>`
  return changed
    .map(
      (row) => `<div class="graph-row" data-${kind}-id="${escapeHTML(row.id)}" data-${kind}-status="${escapeHTML(row.status)}">
        <div class="graph-cell left">${escapeHTML(`${kind}:${row.id}`)} <span class="chip">${escapeHTML(settingSummary(row.leftConfig))}</span></div>
        <div class="connector" aria-hidden="true"></div>
        <div class="graph-cell right">${escapeHTML(`${kind}:${row.id}`)} <span class="chip">${escapeHTML(settingSummary(row.rightConfig))}</span></div>
      </div>`,
    )
    .join("")
}

function renderBoundaryRules(report: BoundaryLintReport): string {
  return report.rules
    .map(
      (rule) => `<div class="todo-item" data-boundary-rule="${escapeHTML(rule.id)}" data-boundary-ok="${String(rule.ok)}">
        ${escapeHTML(rule.ok ? `pass: ${rule.message}` : `fail: ${rule.message}`)}
      </div>`,
    )
    .join("")
}

function settingSummary(config: Record<string, unknown> | undefined): string {
  if (!config) return "missing"
  return Object.entries(config)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(", ")
}

function renderOpenTodoItems(openItems: string[]): string {
  if (openItems.length === 0) return `<div class="todo-item">No open TODO checklist items.</div>`
  return openItems.map((item) => `<div class="todo-item">${escapeHTML(item)}</div>`).join("")
}

function renderSectionTable(sections: TodoSectionStats[]): string {
  const rows = sections
    .map((section) => {
      const pct = section.total === 0 ? 0 : Math.round((section.complete / section.total) * 100)
      return `<tr>
        <td>${escapeHTML(section.title)}</td>
        <td>${section.complete}/${section.total}</td>
        <td>${pct}%</td>
      </tr>`
    })
    .join("")
  return `<table class="section-table">
    <thead><tr><th>Section</th><th>Checked</th><th>Done</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

function stripMarkdown(value: string | undefined): string {
  return (value ?? "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim()
}

function escapeHTML(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function writeOpenCodeSurfaces(outputDir: string, cwd: string): void {
  const harness = assembleOpenCodeHarness({ cwd })
  const web = harness.hooks.services.get("opencode.web")
  const desktop = harness.hooks.services.get("opencode.desktop")
  if (hasOpenCodeWeb(web)) web.write({ outDir: outputDir })
  if (hasOpenCodeDesktop(desktop)) desktop.writeBundle({ outDir: outputDir })
}

function writePiSurfaces(outputDir: string, cwd: string): void {
  const harness = assemblePiMonoHarness({ cwd })
  const webUI = harness.hooks.services.get("pi.web-ui")
  const smoke = harness.hooks.services.get("pi.browser-smoke")
  if (hasWritableSurface(webUI)) webUI.write({ outDir: outputDir })
  if (hasPiBrowserSmoke(smoke)) smoke.write({ outDir: outputDir })
}

function writeNanobotSurfaces(outputDir: string, cwd: string): void {
  const harness = assembleNanobotHarness({ cwd })
  const webUI = harness.hooks.services.get("nanobot.web-ui")
  if (hasRenderableSurface(webUI)) {
    writeFileSync(join(outputDir, "nanobot-web-ui.html"), webUI.render({ title: "Nanobot Web UI" }), "utf8")
  }
}

function writeHermesSurfaces(outputDir: string, cwd: string): void {
  const harness = assembleHermesAgentHarness({ cwd })
  const dashboard = harness.hooks.services.get("hermes.web-dashboard")
  if (hasRenderableSurface(dashboard)) {
    writeFileSync(join(outputDir, "hermes-web-dashboard.html"), dashboard.render({ title: "Hermes Agent Dashboard" }), "utf8")
  }
}

function hasRenderableSurface(value: unknown): value is { render(input?: { title?: string }): string } {
  return Boolean(value) && typeof value === "object" && typeof (value as { render?: unknown }).render === "function"
}

function hasWritableSurface(value: unknown): value is { write(input: { outDir: string; fileName?: string }): string } {
  return Boolean(value) && typeof value === "object" && typeof (value as { write?: unknown }).write === "function"
}

function hasPiBrowserSmoke(value: unknown): value is { write(input: { outDir: string; fileName?: string }): string } {
  return Boolean(value) && typeof value === "object" && typeof (value as { write?: unknown }).write === "function"
}

function hasOpenCodeWeb(value: unknown): value is { write(input: { outDir: string; fileName?: string }): string } {
  return Boolean(value) && typeof value === "object" && typeof (value as { write?: unknown }).write === "function"
}

function hasOpenCodeDesktop(value: unknown): value is {
  writeBundle(input: { outDir: string; manifestFileName?: string; shellFileName?: string }): { manifestPath: string; shellPath: string }
} {
  return Boolean(value) && typeof value === "object" && typeof (value as { writeBundle?: unknown }).writeBundle === "function"
}

const scriptPath = process.argv[1]
if (scriptPath && import.meta.url === pathToFileURL(scriptPath).href) {
  const outputPath = writeDocsSite()
  process.stdout.write(`${outputPath}\n`)
}
