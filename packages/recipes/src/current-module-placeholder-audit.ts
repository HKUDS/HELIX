import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import {
  buildAssemblyContract,
  type AssemblyContract,
  type AssemblyContractAtom,
  type AssemblyContractPlane,
  type AssemblyContractProduct,
} from "./assembly-contract"
import { buildExecutablePlaceholderAudit, type ExecutablePlaceholderAuditItem } from "./executable-placeholder-audit"
import {
  buildTodo27NativeRewriteInventory,
  type Todo27NativeRewriteInventory,
  type Todo27NativeRewriteInventoryItem,
  type Todo27NativeRewriteInventoryProduct,
} from "./todo27-native-rewrite-inventory"

export type CurrentModulePlaceholderAuditProduct = Extract<AssemblyContractProduct, "opencode" | "pi-mono" | "nanobot" | "hermes-agent">
export type CurrentModulePlaceholderAuditItemKind = "package" | "plane" | "product-atom" | "required-binding"
export type CurrentModulePlaceholderAuditOwnerTODO = "TODO-024" | "TODO-025" | "TODO-027" | "TODO-028" | "TODO-029"
export type CurrentModuleSourceOwnerPackageCatalogStatus = "catalog-package" | "virtual-package" | "unknown-source"
export type CurrentModuleSourceFileLineLevelDiffStatus =
  | "line-level-diff-missing"
  | "semantic-fixture-needs-exact-diff"
  | "demotion-guard-only"
  | "manual-anchor-needed"
export type CurrentModuleSourceModuleConfirmationStatus =
  | "manual-anchor-needed"
  | "upstream-divergent-exact-diff-missing"
  | "semantic-fixture-needs-exact-diff"
  | "demotion-guard-confirmed"
  | "no-open-divergence"
export type CurrentModuleUpstreamDriftStatus = "pinned-matches-latest-head" | "pinned-behind-latest-head" | "not-product-scoped"
export type CurrentModuleUpstreamSourceStatus = "pinned-source-symbol-mapped" | "pinned-source-path-mapped" | "upstream-baseline-only" | "not-product-scoped"
export type CurrentModulePinnedUpstreamBehaviorStatus =
  | "pinned-native-exact"
  | "pinned-partial-or-lossy"
  | "pinned-common-not-product-native"
  | "pinned-metadata-only"
  | "pinned-preview-only"
  | "local-evidence-tool-only"
  | "compatibility-export-only"
  | "manual-behavior-check-pending"
  | "not-product-scoped"
export type CurrentModulePinnedUpstreamDivergenceKind =
  | "prompt-family-partial"
  | "product-turn-common-runner"
  | "cadence-timing-partial"
  | "provider-stream-projection"
  | "tool-contract-projection"
  | "session-storage-projection"
  | "hook-plugin-bridge"
  | "config-precedence-bridge"
  | "runtime-acceptance-policy"
  | "ui-surface-bridge"
  | "product-shell-bridge"
  | "event-envelope-bridge"
  | "identity-format-bridge"
  | "trace-projection"
  | "foundation-compatibility-overlay"
  | "common-provider-not-product-native"
  | "metadata-overlay-only"
  | "preview-surface-only"
  | "local-evidence-tool-only"
  | "compatibility-export-only"
  | "manual-behavior-check-required"
  | "generic-compatible-bridge"
export type CurrentModuleSourceVerificationStatus =
  | "product-native-exact-fixture"
  | "semantic-fixture-with-lossiness"
  | "source-mapped-no-exact-fixture"
  | "preview-only-source"
  | "metadata-overlay-source"
  | "manual-source-check-pending"
export type CurrentModuleBehaviorExactDiffStatus = "exact-diff-missing" | "exact-diff-partial" | "demotion-guard-only" | "manual-check-pending"
export type CurrentModuleMismatchKind =
  | "common-shared-not-product-native"
  | "compatible-bridge"
  | "profile-compatible-common-runner"
  | "native-like-projection"
  | "preview-only"
  | "metadata-only"
  | "lossy-compatible-binding"
  | "manual-source-check-required"
  | "upstream-head-drift-unchecked"

export interface CurrentModuleUpstreamSourceLocation {
  product: CurrentModulePlaceholderAuditProduct
  repo: string
  ref: string
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-10"
}

export interface CurrentModulePinnedUpstreamDivergence {
  kind: CurrentModulePinnedUpstreamDivergenceKind
  field: string
  upstreamExpectation: string
  currentEvidence: string
  status: "known-divergence" | "partial-evidence" | "manual-detail-pending"
  evidenceRefs: string[]
  upstreamAnchorRefs: string[]
  currentAnchorRefs: string[]
  requiredEvidence: string
  nextVerification: string
  exactDiffStatus: CurrentModuleBehaviorExactDiffStatus
  fixtureDiffTarget: string
  comparisonDimensions: string[]
  currentCoverage: string
}

function sourceLocation(
  path: string,
  symbols: string[] = [],
): Omit<CurrentModuleUpstreamSourceLocation, "product" | "repo" | "ref"> {
  return {
    path,
    symbols,
    evidence: "github-tree:2026-06-10",
  }
}

export interface CurrentModulePlaceholderAuditItem {
  kind: CurrentModulePlaceholderAuditItemKind
  id: string
  product?: AssemblyContractProduct
  packagePath?: string
  plane?: AssemblyContractPlane
  atomID?: string
  portID?: string
  selected?: boolean
  implementationKind?: string
  implementationLevel?: string
  parityCoverage?: string
  mismatchKind: CurrentModuleMismatchKind
  evidenceStrength: "assembly-contract" | "todo27-inventory" | "executable-audit" | "manual-pending"
  upstreamDriftStatus: CurrentModuleUpstreamDriftStatus
  upstreamSourceStatus: CurrentModuleUpstreamSourceStatus
  pinnedUpstreamBehaviorStatus: CurrentModulePinnedUpstreamBehaviorStatus
  pinnedUpstreamDivergences: CurrentModulePinnedUpstreamDivergence[]
  upstreamSourceLocations: CurrentModuleUpstreamSourceLocation[]
  upstreamBaselineRefs: string[]
  upstreamRefs: string[]
  currentSourceRefs: string[]
  currentSourcePaths: string[]
  currentSourceFiles: string[]
  sourceVerificationStatus: CurrentModuleSourceVerificationStatus
  evidenceRefs: string[]
  knownLossiness: string[]
  executableRequired?: boolean
  bindingRisk?: string
  compileStatus?: string
  ownerTODO: CurrentModulePlaceholderAuditOwnerTODO
  nextAction: string
  summary: string
}

export type CurrentModulePlaceholderAuditWorkItemPriority = "P0-source-audit" | "P1-native-parity" | "P2-demotion-guard"

export interface CurrentModulePlaceholderAuditWorkItem {
  id: string
  ownerTODO: CurrentModulePlaceholderAuditOwnerTODO
  priority: CurrentModulePlaceholderAuditWorkItemPriority
  status: "open"
  divergenceKind: CurrentModulePinnedUpstreamDivergenceKind
  products: string[]
  planes: string[]
  packages: string[]
  itemKinds: CurrentModulePlaceholderAuditItemKind[]
  itemIDs: string[]
  itemCount: number
  mismatchKinds: CurrentModuleMismatchKind[]
  behaviorStatuses: CurrentModulePinnedUpstreamBehaviorStatus[]
  requiredEvidence: string
  nextVerification: string
  upstreamAnchorRefs: string[]
  currentAnchorRefs: string[]
  sampleEvidenceRefs: string[]
  exactDiffStatuses: CurrentModuleBehaviorExactDiffStatus[]
  fixtureDiffTargets: string[]
  comparisonDimensions: string[]
  action: string
}

export interface CurrentModulePlaceholderAuditFixtureDiffWorkItem {
  id: string
  fixtureDiffTarget: string
  exactDiffStatus: CurrentModuleBehaviorExactDiffStatus
  priority: CurrentModulePlaceholderAuditWorkItemPriority
  status: "open"
  itemCount: number
  itemIDs: string[]
  products: string[]
  planes: string[]
  packages: string[]
  ownerTODOs: CurrentModulePlaceholderAuditOwnerTODO[]
  divergenceKinds: CurrentModulePinnedUpstreamDivergenceKind[]
  itemKinds: CurrentModulePlaceholderAuditItemKind[]
  mismatchKinds: CurrentModuleMismatchKind[]
  behaviorStatuses: CurrentModulePinnedUpstreamBehaviorStatus[]
  requiredEvidence: string
  nextVerification: string
  upstreamAnchorRefs: string[]
  currentAnchorRefs: string[]
  sampleEvidenceRefs: string[]
  comparisonDimensions: string[]
  action: string
}

export interface CurrentModulePlaceholderAuditSourceFileFixtureWorkItem {
  id: string
  currentSourceFile: string
  sourceOwnerPackagePath: string
  sourceOwnerPackageCatalogStatus: CurrentModuleSourceOwnerPackageCatalogStatus
  fixtureDiffTarget: string
  exactDiffStatus: CurrentModuleBehaviorExactDiffStatus
  lineLevelDiffStatus: CurrentModuleSourceFileLineLevelDiffStatus
  priority: CurrentModulePlaceholderAuditWorkItemPriority
  status: "open"
  itemCount: number
  itemIDs: string[]
  sampleItemIDs: string[]
  products: string[]
  planes: string[]
  packages: string[]
  ownerTODOs: CurrentModulePlaceholderAuditOwnerTODO[]
  divergenceKinds: CurrentModulePinnedUpstreamDivergenceKind[]
  itemKinds: CurrentModulePlaceholderAuditItemKind[]
  mismatchKinds: CurrentModuleMismatchKind[]
  behaviorStatuses: CurrentModulePinnedUpstreamBehaviorStatus[]
  requiredEvidence: string
  nextVerification: string
  fixtureImplementationTarget: string
  negativeVerificationTarget: string
  upstreamAnchorRefs: string[]
  currentAnchorRefs: string[]
  sampleUpstreamAnchorRefs: string[]
  sampleCurrentAnchorRefs: string[]
  sampleEvidenceRefs: string[]
  comparisonDimensions: string[]
  action: string
}

export interface CurrentModulePlaceholderAuditSourceOwnerLineLevelSummary {
  sourceOwnerPackagePath: string
  sourceOwnerPackageCatalogStatus: CurrentModuleSourceOwnerPackageCatalogStatus
  moduleConfirmationStatus: CurrentModuleSourceModuleConfirmationStatus
  moduleConfirmationSummary: string
  queueItems: number
  itemCount: number
  currentSourceFileCount: number
  sampleCurrentSourceFiles: string[]
  products: string[]
  planes: string[]
  packages: string[]
  ownerTODOs: CurrentModulePlaceholderAuditOwnerTODO[]
  lineLevelDiffMissing: number
  semanticFixtureNeedsExactDiff: number
  demotionGuardOnly: number
  manualAnchorNeeded: number
  byLineLevelDiffStatus: Record<CurrentModuleSourceFileLineLevelDiffStatus, number>
  byExactDiffStatus: Record<CurrentModuleBehaviorExactDiffStatus, number>
  byFixtureDiffTarget: Record<string, number>
  byFixtureImplementationTarget: Record<string, number>
  byNegativeVerificationTarget: Record<string, number>
  sampleItemIDs: string[]
  sampleFixtureImplementationTargets: string[]
  sampleNegativeVerificationTargets: string[]
}

export interface CurrentModuleAlternateUpstreamHead {
  repo: string
  head: string
  relation: "official-successor-candidate" | "package-release"
}

export interface CurrentModuleUpstreamBaseline {
  product: CurrentModulePlaceholderAuditProduct
  pinnedRepo: string
  pinnedRef: string
  latestRepo: string
  latestHead: string
  checkedAt: string
  driftStatus: Extract<CurrentModuleUpstreamDriftStatus, "pinned-matches-latest-head" | "pinned-behind-latest-head">
  alternateLatestHeads: CurrentModuleAlternateUpstreamHead[]
}

export interface CurrentModulePlaceholderAuditProductSummary {
  product: CurrentModulePlaceholderAuditProduct
  totalItems: number
  productAtomItems: number
  requiredBindingItems: number
  transitionAtoms: number
  selectedTransitionAtoms: number
  productNativeComplete: number
  pinnedBehindLatestHead: number
  upstreamSourceSymbolMapped: number
  upstreamSourcePathMapped: number
  exactDiffMissing: number
  exactDiffPartial: number
  demotionGuardOnly: number
  manualCheckPending: number
  byMismatchKind: Record<CurrentModuleMismatchKind, number>
  byPinnedUpstreamBehaviorStatus: Record<CurrentModulePinnedUpstreamBehaviorStatus, number>
  byPinnedUpstreamDivergenceKind: Record<CurrentModulePinnedUpstreamDivergenceKind, number>
  byFixtureDiffTarget: Record<string, number>
  byComparisonDimension: Record<string, number>
}

export interface CurrentModulePlaceholderAuditPackageSummary {
  packagePath: string
  finding: string
  packageMismatchKind: CurrentModuleMismatchKind
  packagePinnedUpstreamBehaviorStatus: CurrentModulePinnedUpstreamBehaviorStatus
  packageSourceVerificationStatus: CurrentModuleSourceVerificationStatus
  totalItems: number
  packageItems: number
  productAtomItems: number
  requiredBindingItems: number
  products: string[]
  planes: string[]
  selectedTransitionAtoms: number
  productNativeComplete: number
  pinnedBehindLatestHead: number
  upstreamSourceSymbolMapped: number
  upstreamSourcePathMapped: number
  exactDiffMissing: number
  exactDiffPartial: number
  demotionGuardOnly: number
  manualCheckPending: number
  currentSourceFileCount: number
  sampleCurrentSourceFiles: string[]
  sourceOwnedItems: number
  sourceOwnedProductAtomItems: number
  sourceOwnedRequiredBindingItems: number
  sourceOwnedProducts: string[]
  sourceOwnedPlanes: string[]
  sourceOwnedExactDiffMissing: number
  sourceOwnedExactDiffPartial: number
  sourceOwnedDemotionGuardOnly: number
  sourceOwnedManualCheckPending: number
  sourceOwnedCurrentSourceFileCount: number
  sampleSourceOwnedCurrentSourceFiles: string[]
  byMismatchKind: Record<CurrentModuleMismatchKind, number>
  byImplementationLevel: Record<string, number>
  byPinnedUpstreamBehaviorStatus: Record<CurrentModulePinnedUpstreamBehaviorStatus, number>
  byPinnedUpstreamDivergenceKind: Record<CurrentModulePinnedUpstreamDivergenceKind, number>
  bySourceVerificationStatus: Record<CurrentModuleSourceVerificationStatus, number>
  byFixtureDiffTarget: Record<string, number>
  bySourceOwnedFixtureDiffTarget: Record<string, number>
  byComparisonDimension: Record<string, number>
}

export interface CurrentModulePlaceholderAuditPlaneSummary {
  plane: AssemblyContractPlane
  finding: string
  planeMismatchKind: CurrentModuleMismatchKind
  planePinnedUpstreamBehaviorStatus: CurrentModulePinnedUpstreamBehaviorStatus
  planeSourceVerificationStatus: CurrentModuleSourceVerificationStatus
  totalItems: number
  planeItems: number
  productAtomItems: number
  requiredBindingItems: number
  products: string[]
  packages: string[]
  selectedTransitionAtoms: number
  productNativeComplete: number
  pinnedBehindLatestHead: number
  upstreamSourceSymbolMapped: number
  upstreamSourcePathMapped: number
  exactDiffMissing: number
  exactDiffPartial: number
  demotionGuardOnly: number
  manualCheckPending: number
  currentSourceFileCount: number
  sampleCurrentSourceFiles: string[]
  byMismatchKind: Record<CurrentModuleMismatchKind, number>
  byImplementationLevel: Record<string, number>
  byPinnedUpstreamBehaviorStatus: Record<CurrentModulePinnedUpstreamBehaviorStatus, number>
  byPinnedUpstreamDivergenceKind: Record<CurrentModulePinnedUpstreamDivergenceKind, number>
  bySourceVerificationStatus: Record<CurrentModuleSourceVerificationStatus, number>
  byFixtureDiffTarget: Record<string, number>
  byComparisonDimension: Record<string, number>
}

export interface CurrentModulePlaceholderAuditCurrentSourceFileSummary {
  currentSourceFile: string
  sourceOwnerPackagePath: string
  sourceOwnerPackageCatalogStatus: CurrentModuleSourceOwnerPackageCatalogStatus
  moduleConfirmationStatus: CurrentModuleSourceModuleConfirmationStatus
  moduleConfirmationSummary: string
  finding: string
  sourceVerificationStatus: CurrentModuleSourceVerificationStatus
  totalItems: number
  itemCount: number
  productAtomItems: number
  requiredBindingItems: number
  products: string[]
  planes: string[]
  packages: string[]
  ownerTODOs: CurrentModulePlaceholderAuditOwnerTODO[]
  itemKinds: CurrentModulePlaceholderAuditItemKind[]
  itemIDs: string[]
  selectedTransitionAtoms: number
  productNativeComplete: number
  exactDiffMissing: number
  exactDiffPartial: number
  demotionGuardOnly: number
  manualCheckPending: number
  byMismatchKind: Record<CurrentModuleMismatchKind, number>
  byImplementationLevel: Record<string, number>
  byPinnedUpstreamBehaviorStatus: Record<CurrentModulePinnedUpstreamBehaviorStatus, number>
  byPinnedUpstreamDivergenceKind: Record<CurrentModulePinnedUpstreamDivergenceKind, number>
  bySourceVerificationStatus: Record<CurrentModuleSourceVerificationStatus, number>
  byFixtureDiffTarget: Record<string, number>
  byComparisonDimension: Record<string, number>
}

export interface CurrentModulePlaceholderAudit {
  schemaVersion: 1
  artifactKind: "current-module-placeholder-audit"
  generatedAt: string
  products: CurrentModulePlaceholderAuditProduct[]
  upstreamBaselines: CurrentModuleUpstreamBaseline[]
  packageCatalog: string[]
  items: CurrentModulePlaceholderAuditItem[]
  workQueue: CurrentModulePlaceholderAuditWorkItem[]
  fixtureDiffQueue: CurrentModulePlaceholderAuditFixtureDiffWorkItem[]
  sourceFileFixtureQueue: CurrentModulePlaceholderAuditSourceFileFixtureWorkItem[]
  sourceOwnerLineLevelSummaries: CurrentModulePlaceholderAuditSourceOwnerLineLevelSummary[]
  productSummaries: CurrentModulePlaceholderAuditProductSummary[]
  packageSummaries: CurrentModulePlaceholderAuditPackageSummary[]
  planeSummaries: CurrentModulePlaceholderAuditPlaneSummary[]
  currentSourceFileSummaries: CurrentModulePlaceholderAuditCurrentSourceFileSummary[]
  summary: {
    totalItems: number
    packageItems: number
    planeItems: number
    productAtomItems: number
    requiredBindingItems: number
    productNativeComplete: number
    transitionAtoms: number
    selectedTransitionAtoms: number
    requiredBindings: number
    compileBlockers: number
    previewOnlyBindings: number
    lossyCompatibleBindings: number
    previewOrMetadataExecutableBindings: number
    manualSourceCheckRequired: number
    workQueueItems: number
    workQueueCoveredItems: number
    sourceFileFixtureQueueItems: number
    sourceOwnerLineLevelSummaryItems: number
    currentSourceFileSummaryItems: number
    upstreamHeadDriftProducts: number
    upstreamHeadDriftItems: number
    productNativeExactFixtureItems: number
    semanticFixtureItems: number
    byMismatchKind: Record<CurrentModuleMismatchKind, number>
    byImplementationLevel: Record<string, number>
    byUpstreamDriftStatus: Record<CurrentModuleUpstreamDriftStatus, number>
    byUpstreamSourceStatus: Record<CurrentModuleUpstreamSourceStatus, number>
    byPinnedUpstreamBehaviorStatus: Record<CurrentModulePinnedUpstreamBehaviorStatus, number>
    byPinnedUpstreamDivergenceKind: Record<CurrentModulePinnedUpstreamDivergenceKind, number>
    byBehaviorExactDiffStatus: Record<CurrentModuleBehaviorExactDiffStatus, number>
    byFixtureDiffTarget: Record<string, number>
    byComparisonDimension: Record<string, number>
    byWorkQueueOwnerTODO: Record<CurrentModulePlaceholderAuditOwnerTODO, number>
    bySourceVerificationStatus: Record<CurrentModuleSourceVerificationStatus, number>
    byPackage: Record<string, number>
    byPlane: Record<string, number>
    byProduct: Record<string, number>
    fingerprint: string
  }
}

export interface CurrentModulePlaceholderAuditVerificationCheck {
  id: string
  ok: boolean
  severity: "error" | "warning"
  message: string
  refs: string[]
}

export interface CurrentModulePlaceholderAuditVerification {
  ok: boolean
  fingerprint: string
  checks: CurrentModulePlaceholderAuditVerificationCheck[]
  issues: CurrentModulePlaceholderAuditVerificationCheck[]
  warnings: CurrentModulePlaceholderAuditVerificationCheck[]
}

export interface BuildCurrentModulePlaceholderAuditInput {
  products?: CurrentModulePlaceholderAuditProduct[]
  contracts?: AssemblyContract[]
  generatedAt?: string
}

const defaultProducts: CurrentModulePlaceholderAuditProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
const packageCatalog = [
  "packages/contracts",
  "packages/lego-runtime",
  "packages/lego-session",
  "packages/lego-hooks",
  "packages/lego-agent-loop",
  "packages/lego-tools",
  "packages/lego-provider",
  "packages/lego-prompt",
  "packages/lego-config",
  "packages/lego-ui",
  "packages/adapters-opencode",
  "packages/adapters-pi",
  "packages/adapters-nanobot",
  "packages/adapters-hermes",
  "packages/opencode-plugin",
  "packages/pi-coding-agent",
  "packages/recipes",
  "packages/cli",
  "packages/docs-site",
  "packages/conformance",
] as const

interface CurrentModuleManualPackageSourceEntry {
  currentSourceRefs: string[]
  currentSourcePaths: string[]
  currentSourceFiles: string[]
  evidenceRefs: string[]
  upstreamAnchorRefs: string[]
  pinnedUpstreamBehaviorStatus: CurrentModulePinnedUpstreamBehaviorStatus
  divergenceKind: CurrentModulePinnedUpstreamDivergenceKind
  sourceVerificationStatus?: CurrentModuleSourceVerificationStatus
  summary: string
  nextAction: string
}

const pinnedBehaviorStatusKeys: CurrentModulePinnedUpstreamBehaviorStatus[] = [
  "compatibility-export-only",
  "local-evidence-tool-only",
  "manual-behavior-check-pending",
  "not-product-scoped",
  "pinned-common-not-product-native",
  "pinned-metadata-only",
  "pinned-native-exact",
  "pinned-partial-or-lossy",
  "pinned-preview-only",
]

const pinnedDivergenceKindKeys: CurrentModulePinnedUpstreamDivergenceKind[] = [
  "cadence-timing-partial",
  "common-provider-not-product-native",
  "compatibility-export-only",
  "config-precedence-bridge",
  "event-envelope-bridge",
  "foundation-compatibility-overlay",
  "generic-compatible-bridge",
  "hook-plugin-bridge",
  "identity-format-bridge",
  "local-evidence-tool-only",
  "manual-behavior-check-required",
  "metadata-overlay-only",
  "preview-surface-only",
  "product-shell-bridge",
  "product-turn-common-runner",
  "prompt-family-partial",
  "provider-stream-projection",
  "runtime-acceptance-policy",
  "session-storage-projection",
  "tool-contract-projection",
  "trace-projection",
  "ui-surface-bridge",
]

const manualPackageSourceCatalog: Partial<Record<(typeof packageCatalog)[number], CurrentModuleManualPackageSourceEntry>> = {
  "packages/cli": {
    currentSourceRefs: ["@helix/cli:command-router"],
    currentSourcePaths: ["cli:src/index.ts:command-router"],
    currentSourceFiles: ["packages/cli/src/index.ts"],
    evidenceRefs: ["package-entrypoint:packages/cli/src/index.ts"],
    upstreamAnchorRefs: ["not-upstream:local-evidence-tool:packages/cli"],
    pinnedUpstreamBehaviorStatus: "local-evidence-tool-only",
    divergenceKind: "local-evidence-tool-only",
    sourceVerificationStatus: "metadata-overlay-source",
    summary: "No selected atom appears in current product assembly contracts; the CLI module is scoped to packages/cli/src/index.ts for source/API inspection.",
    nextAction: "Inspect packages/cli/src/index.ts command routing, report generation, and product shell command behavior before treating CLI smoke as upstream parity evidence.",
  },
  "packages/docs-site": {
    currentSourceRefs: ["@helix/docs-site:builder-and-preview-surfaces"],
    currentSourcePaths: [
      "docs-site:src/index.ts:static-builder-renderer",
      "docs-site:src/server.ts:preview-server",
      "docs-site:src/builder-slots.ts:slot-model",
      "docs-site:src/builder-impact.ts:impact-model",
      "docs-site:src/tui-session.ts:tui-session-bridge",
    ],
    currentSourceFiles: [
      "packages/docs-site/src/index.ts",
      "packages/docs-site/src/server.ts",
      "packages/docs-site/src/builder-slots.ts",
      "packages/docs-site/src/builder-impact.ts",
      "packages/docs-site/src/tui-session.ts",
    ],
    evidenceRefs: [
      "package-entrypoint:packages/docs-site/src/index.ts",
      "package-entrypoint:packages/docs-site/src/server.ts",
      "package-entrypoint:packages/docs-site/src/builder-slots.ts",
      "package-entrypoint:packages/docs-site/src/builder-impact.ts",
      "package-entrypoint:packages/docs-site/src/tui-session.ts",
    ],
    upstreamAnchorRefs: ["not-upstream:local-evidence-tool:packages/docs-site"],
    pinnedUpstreamBehaviorStatus: "local-evidence-tool-only",
    divergenceKind: "local-evidence-tool-only",
    sourceVerificationStatus: "metadata-overlay-source",
    summary:
      "No selected atom appears in current product assembly contracts; docs-site is evidence/UI only and must be inspected through builder, preview server, slot, impact, and TUI-session entrypoints.",
    nextAction: "Inspect docs-site entrypoints as evidence presentation code only; do not count Builder or preview rendering as product-native harness parity.",
  },
  "packages/conformance": {
    currentSourceRefs: ["@helix/conformance:audit-and-native-claim-gates"],
    currentSourcePaths: [
      "conformance:current-module-placeholder-audit.conformance.test.ts:current-module-audit",
      "conformance:executable-placeholder-audit.conformance.test.ts:executable-placeholder-audit",
      "conformance:todo27-native-rewrite-inventory.conformance.test.ts:todo27-inventory",
      "conformance:product-turn-profile-visibility.conformance.test.ts:turn-profile-demotion",
      "conformance:p1-native-like-visibility.conformance.test.ts:native-like-demotion",
      "conformance:fake-public-path.conformance.test.ts:fake-path-blocker",
    ],
    currentSourceFiles: [
      "packages/conformance/current-module-placeholder-audit.conformance.test.ts",
      "packages/conformance/executable-placeholder-audit.conformance.test.ts",
      "packages/conformance/todo27-native-rewrite-inventory.conformance.test.ts",
      "packages/conformance/product-turn-profile-visibility.conformance.test.ts",
      "packages/conformance/p1-native-like-visibility.conformance.test.ts",
      "packages/conformance/fake-public-path.conformance.test.ts",
    ],
    evidenceRefs: [
      "package-entrypoint:packages/conformance/current-module-placeholder-audit.conformance.test.ts",
      "package-entrypoint:packages/conformance/executable-placeholder-audit.conformance.test.ts",
      "package-entrypoint:packages/conformance/todo27-native-rewrite-inventory.conformance.test.ts",
      "package-entrypoint:packages/conformance/product-turn-profile-visibility.conformance.test.ts",
      "package-entrypoint:packages/conformance/p1-native-like-visibility.conformance.test.ts",
      "package-entrypoint:packages/conformance/fake-public-path.conformance.test.ts",
    ],
    upstreamAnchorRefs: ["not-upstream:local-evidence-tool:packages/conformance"],
    pinnedUpstreamBehaviorStatus: "local-evidence-tool-only",
    divergenceKind: "local-evidence-tool-only",
    sourceVerificationStatus: "metadata-overlay-source",
    summary:
      "No selected atom appears in current product assembly contracts; conformance is verification evidence only, with current audit and demotion gates scoped to representative test entrypoints.",
    nextAction: "Inspect conformance entrypoints for coverage scope and negative native-claim gates; never treat a green test alone as source-level upstream parity.",
  },
  "packages/opencode-plugin": {
    currentSourceRefs: ["@helix/opencode-plugin:compatibility-export"],
    currentSourcePaths: ["opencode-plugin:src/index.ts:defineOpenCodePlugin-reexport"],
    currentSourceFiles: ["packages/opencode-plugin/src/index.ts"],
    evidenceRefs: ["package-entrypoint:packages/opencode-plugin/src/index.ts"],
    upstreamAnchorRefs: [
      "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin.ts#PluginV2,HookFunctions,define",
      "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/boot.ts#PluginBoot,Service,layer",
    ],
    pinnedUpstreamBehaviorStatus: "compatibility-export-only",
    divergenceKind: "compatibility-export-only",
    summary:
      "No selected atom appears in current product assembly contracts; opencode-plugin is a compatibility export that must be inspected against the OpenCode plugin API before any native claim.",
    nextAction: "Inspect packages/opencode-plugin/src/index.ts against the pinned OpenCode PluginV2/HookFunctions API and keep it classified as compatibility export until lifecycle parity is proven.",
  },
  "packages/pi-coding-agent": {
    currentSourceRefs: ["@helix/pi-coding-agent:compatibility-export"],
    currentSourcePaths: ["pi-coding-agent:src/index.ts:definePiExtension-reexport"],
    currentSourceFiles: ["packages/pi-coding-agent/src/index.ts"],
    evidenceRefs: ["package-entrypoint:packages/pi-coding-agent/src/index.ts"],
    upstreamAnchorRefs: [
      "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da:packages/coding-agent/src/core/extensions/types.ts#Extension,ExtensionAPI,ExtensionFactory",
      "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da:packages/coding-agent/src/core/extensions/loader.ts#createExtensionRuntime,loadExtensionFromFactory",
    ],
    pinnedUpstreamBehaviorStatus: "compatibility-export-only",
    divergenceKind: "compatibility-export-only",
    summary:
      "No selected atom appears in current product assembly contracts; pi-coding-agent is a compatibility export that must be inspected against the Pi extension API before any native claim.",
    nextAction: "Inspect packages/pi-coding-agent/src/index.ts against the pinned Pi ExtensionAPI/ExtensionFactory API and keep it classified as compatibility export until lifecycle parity is proven.",
  },
}

const upstreamBaselineCatalog: Record<CurrentModulePlaceholderAuditProduct, CurrentModuleUpstreamBaseline> = {
  opencode: {
    product: "opencode",
    pinnedRepo: "anomalyco/opencode",
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    latestRepo: "anomalyco/opencode",
    latestHead: "bf05e8a1224d6560f7a441f70d09e0c77e50e931",
    checkedAt: "2026-06-11",
    driftStatus: "pinned-behind-latest-head",
    alternateLatestHeads: [
      {
        repo: "opencode-ai/opencode",
        head: "73ee493265acf15fcd8caab2bc8cd3bd375b63cb",
        relation: "official-successor-candidate",
      },
    ],
  },
  "pi-mono": {
    product: "pi-mono",
    pinnedRepo: "earendil-works/pi",
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    latestRepo: "earendil-works/pi",
    latestHead: "406a2214aa1dce746a1902605daf04e6727349dc",
    checkedAt: "2026-06-11",
    driftStatus: "pinned-behind-latest-head",
    alternateLatestHeads: [],
  },
  nanobot: {
    product: "nanobot",
    pinnedRepo: "HKUDS/nanobot",
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    latestRepo: "HKUDS/nanobot",
    latestHead: "ffae1dca6d132020514f14ddb34e61705b5c54a1",
    checkedAt: "2026-06-11",
    driftStatus: "pinned-behind-latest-head",
    alternateLatestHeads: [
      {
        repo: "nanobot-ai",
        head: "0.2.0",
        relation: "package-release",
      },
    ],
  },
  "hermes-agent": {
    product: "hermes-agent",
    pinnedRepo: "NousResearch/hermes-agent",
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    latestRepo: "NousResearch/hermes-agent",
    latestHead: "fa7f24e8980367c2ca849eb99e1eb2331c7d3699",
    checkedAt: "2026-06-11",
    driftStatus: "pinned-behind-latest-head",
    alternateLatestHeads: [
      {
        repo: "hermes-agent",
        head: "0.15.1",
        relation: "package-release",
      },
    ],
  },
}

const upstreamSourceCatalog: Record<
  CurrentModulePlaceholderAuditProduct,
  {
    byPlane: Partial<Record<AssemblyContractPlane, Array<Omit<CurrentModuleUpstreamSourceLocation, "product" | "repo" | "ref">>>>
  }
> = {
  opencode: {
    byPlane: {
      foundation: [
        sourceLocation("packages/opencode/src/session/session.ts", ["Info", "ProjectInfo", "GlobalInfo", "CreateInput", "Event", "fromRow", "toRow", "plan", "getUsage"]),
        sourceLocation("packages/opencode/src/config/skills.ts", ["Info", "ConfigSkills"]),
      ],
      identity: [sourceLocation("packages/opencode/src/session/session.ts", ["createDefaultTitle", "isDefaultTitle", "sessionPath"])],
      event: [
        sourceLocation("packages/opencode/src/session/message-v2.ts", [
          "SYNTHETIC_ATTACHMENT_PROMPT",
          "AbortedError",
          "StructuredOutputError",
          "APIError",
          "ContextOverflowError",
          "OutputFormatText",
          "OutputFormatJsonSchema",
          "Format",
          "SnapshotPart",
          "PatchPart",
          "TextPart",
          "ReasoningPart",
          "FilePart",
          "AgentPart",
          "CompactionPart",
          "SubtaskPart",
          "RetryPart",
          "StepStartPart",
          "StepFinishPart",
          "ToolState",
          "ToolPart",
          "User",
          "Part",
          "Assistant",
          "Info",
          "Event",
          "WithParts",
          "cursor",
          "toModelMessagesEffect",
          "toModelMessages",
          "page",
          "stream",
          "parts",
          "get",
          "filterCompacted",
          "filterCompactedEffect",
          "latest",
          "fromError",
        ]),
        sourceLocation("packages/opencode/src/session/projectors.ts", ["DeepPartial", "foreign", "usage", "applyUsage", "grab", "toPartialRow"]),
        sourceLocation("packages/opencode/src/session/projectors-next.ts", ["encodeDateTimes", "encodeMessageData", "sqlite", "update"]),
      ],
      trace: [
        sourceLocation("packages/opencode/src/session/message.ts", [
          "ToolCall",
          "ToolPartialCall",
          "ToolResult",
          "ToolInvocation",
          "TextPart",
          "ReasoningPart",
          "ToolInvocationPart",
          "SourceUrlPart",
          "FilePart",
          "StepStartPart",
          "MessagePart",
          "Info",
        ]),
        sourceLocation("packages/opencode/src/session/status.ts", ["Info", "Event", "Interface", "Service", "layer", "defaultLayer"]),
      ],
      runtime: [
        sourceLocation("packages/opencode/src/cli/cmd/run/runtime.ts", [
          "BootContext",
          "CreateSessionInput",
          "CreateSession",
          "RunRuntimeInput",
          "RunLocalInput",
          "StreamState",
          "ResolvedSession",
          "createSessionResolver",
          "RuntimeState",
          "hasSession",
          "eagerStream",
          "variantsFor",
          "resolveExitTitle",
          "runInteractiveRuntime",
          "runInteractiveLocalMode",
          "runInteractiveMode",
        ]),
        sourceLocation("packages/opencode/src/cli/cmd/run/runtime.lifecycle.ts", [
          "FOOTER_HEIGHT",
          "SplashState",
          "CycleResult",
          "FooterLabels",
          "LifecycleInput",
          "Lifecycle",
          "shutdown",
          "splashInfo",
          "footerLabels",
          "queueSplash",
          "createRuntimeLifecycle",
        ]),
        sourceLocation("packages/opencode/src/cli/cmd/run/runtime.shared.ts", ["PendingTask", "reusePendingTask"]),
      ],
      session: [
        sourceLocation("packages/opencode/src/session/session.ts", [
          "Summary",
          "Tokens",
          "Share",
          "Revert",
          "Info",
          "ProjectInfo",
          "GlobalInfo",
          "CreateInput",
          "ForkInput",
          "Event",
          "fromRow",
          "toRow",
          "plan",
          "getUsage",
          "BusyError",
          "Interface",
          "Service",
          "use",
          "layer",
          "defaultLayer",
          "listGlobal",
          "Session",
        ]),
        sourceLocation("packages/opencode/src/session/message-v2.ts", [
          "Info",
          "Part",
          "WithParts",
          "ToolPart",
          "TextPart",
          "FilePart",
          "Assistant",
          "Event",
          "cursor",
          "toModelMessagesEffect",
          "toModelMessages",
          "page",
          "stream",
          "parts",
          "get",
          "filterCompacted",
          "filterCompactedEffect",
          "latest",
          "fromError",
          "MessageV2",
        ]),
        sourceLocation("packages/opencode/src/session/session.sql.ts", ["SessionTable", "MessageTable", "PartTable", "TodoTable", "SessionMessageTable", "PermissionTable"]),
      ],
      hook: [
        sourceLocation("packages/core/src/plugin.ts", ["PluginV2", "ID", "Hooks", "HookFunctions", "define", "Interface", "Service", "layer", "defaultLayer"]),
        sourceLocation("packages/core/src/plugin/boot.ts", ["PluginBoot", "Interface", "Service", "layer", "defaultLayer"]),
        sourceLocation("packages/core/src/plugin/provider.ts", ["ProviderPlugins"]),
        sourceLocation("packages/opencode/src/plugin/index.ts", ["Plugin.trigger", "Plugin.list", "bus.subscribeAll", "hook.event", "TriggerName"]),
        sourceLocation("packages/opencode/src/provider/auth.ts", ["ProviderAuth.state", "Plugin.list", "auth.provider"]),
        sourceLocation("packages/opencode/src/provider/provider.ts", ["Plugin.list", "provider.models", "plugin.auth.loader", "ProviderID"]),
        sourceLocation("packages/plugin/src/index.ts", ["Hooks", "auth", "provider", "event", "chat.message", "chat.headers", "tool.execute.before"]),
      ],
      turn: [sourceLocation("packages/opencode/src/session/processor.ts", ["Service", "layer", "defaultLayer"])],
      "agent-loop": [
        sourceLocation("packages/opencode/src/session/processor.ts", ["Service", "layer", "defaultLayer"]),
        sourceLocation("packages/opencode/src/session/prompt.ts", ["Service", "PromptInput", "LoopInput"]),
        sourceLocation("packages/opencode/src/session/compaction.ts", ["Service", "use", "layer", "defaultLayer", "Event", "buildPrompt", "preserveRecentBudget"]),
        sourceLocation("packages/opencode/src/session/retry.ts", ["delay", "retryable", "policy", "RetryReason", "Retryable"]),
      ],
      tool: [
        sourceLocation("packages/opencode/src/tool/registry.ts", ["ToolRegistry.tools", "plugin.trigger", "tool.definition", "jsonSchema"]),
        sourceLocation("packages/opencode/src/plugin/index.ts", ["Plugin.trigger", "Plugin.list", "TriggerName"]),
        sourceLocation("packages/plugin/src/index.ts", ["Hooks", "tool.definition"]),
        sourceLocation("packages/opencode/src/session/tools.ts", ["resolve", "SessionTools"]),
        sourceLocation("packages/opencode/src/cli/cmd/run/tool.ts", [
          "ToolView",
          "ToolFrame",
          "ToolPermissionInfo",
          "toolPath",
          "toolFrame",
          "toolView",
          "toolStructuredFinal",
          "toolInlineInfo",
          "toolScroll",
          "toolPermissionInfo",
          "toolSnapshot",
          "toolEntryBody",
          "toolFiletype",
        ]),
        sourceLocation("packages/opencode/src/tool/skill.ts", ["Parameters", "SkillTool"]),
      ],
      provider: [
        sourceLocation("packages/opencode/src/auth/index.ts", ["Oauth", "Api", "WellKnown", "Info", "all", "get", "set", "remove"]),
        sourceLocation("packages/plugin/src/index.ts", ["ProviderHook", "Hooks", "provider"]),
        sourceLocation("packages/opencode/src/plugin/index.ts", ["applyPlugin", "trigger", "list"]),
        sourceLocation("packages/opencode/src/provider/provider.ts", ["toPublicInfo", "Plugin.list", "provider.models", "ModelID", "ProviderID"]),
        sourceLocation("packages/opencode/src/session/llm/request.ts", ["Prepared", "prepare", "hasToolCalls", "LLMRequestPrep"]),
        sourceLocation("packages/opencode/src/session/llm/native-request.ts", ["RequestInput", "model", "request", "LLMNative"]),
        sourceLocation("packages/opencode/src/session/session.ts", ["getUsage"]),
        sourceLocation("packages/core/src/plugin/provider.ts", ["ProviderPlugins"]),
        sourceLocation("packages/core/src/plugin/provider/index.ts", ["ProviderPlugins"]),
      ],
      prompt: [
        sourceLocation("packages/opencode/src/session/system.ts", ["provider", "Interface", "Service", "layer", "defaultLayer", "SystemPrompt"]),
        sourceLocation("packages/opencode/src/session/prompt.ts", ["PromptInput", "LoopInput", "createStructuredOutputTool"]),
        sourceLocation("packages/opencode/src/session/prompt/reference.ts", ["ReferencePromptMetadata", "referencePromptMetadata", "referenceTextPart", "ReferencePrompt"]),
      ],
      config: [sourceLocation("packages/opencode/src/config/skills.ts", ["Info", "ConfigSkills"]), sourceLocation("packages/core/src/plugin/env.ts", ["EnvPlugin"])],
      ui: [
        sourceLocation("packages/opencode/src/cli/cmd/tui/app.tsx", ["appBindingCommands", "rendererConfig", "errorMessage", "tui", "App"]),
        sourceLocation("packages/opencode/src/cli/cmd/tui/plugin/api.tsx", [
          "RouteEntry",
          "RouteMap",
          "Input",
          "routeRegister",
          "routeNavigate",
          "routeCurrent",
          "mapOption",
          "pickOption",
          "mapOptionCb",
          "stateApi",
          "appApi",
          "createTuiApi",
        ]),
      ],
      product: [
        sourceLocation("packages/opencode/src/cli/bootstrap.ts", ["bootstrap"]),
        sourceLocation("packages/opencode/src/cli/cmd/tui/app.tsx", ["rendererConfig", "errorMessage", "tui", "App"]),
        sourceLocation("packages/app/src/app.tsx", [
          "UiI18nBridge",
          "QueryProvider",
          "AppShellProviders",
          "SessionProviders",
          "RouterRoot",
          "AppBaseProviders",
          "ConnectionGate",
          "ConnectionError",
          "ServerKey",
          "AppInterface",
        ]),
        sourceLocation("packages/opencode/src/server/server.ts", ["Listener", "Default", "openapi", "listen"]),
        sourceLocation("packages/opencode/specs/v2/api.ts", ["opencode", "sessionID"]),
      ],
      task: [sourceLocation("packages/opencode/src/session/todo.ts", ["Info", "Event", "Interface", "Service", "layer", "defaultLayer"])],
    },
  },
  "pi-mono": {
    byPlane: {
      foundation: [
        sourceLocation("packages/coding-agent/src/config.ts", [
          "InstallMethod",
          "SelfUpdateCommand",
          "detectInstallMethod",
          "getSelfUpdateCommand",
          "getSelfUpdateUnavailableInstruction",
          "getUpdateInstruction",
          "getPackageDir",
          "getReadmePath",
          "getDocsPath",
          "APP_NAME",
          "CONFIG_DIR_NAME",
          "VERSION",
          "getAgentDir",
          "getSessionsDir",
        ]),
        sourceLocation("packages/coding-agent/docs/session-format.md", [
          "SessionFileFormat",
          "FileLocation",
          "SessionVersion",
          "SourceFiles",
          "MessageTypes",
          "SessionHeader",
          "SessionMessageEntry",
          "SessionManagerAPI",
        ]),
      ],
      identity: [
        sourceLocation("packages/agent/src/harness/session/uuid.ts", ["fillRandomBytes", "uuidv7", "formatUuid"]),
        sourceLocation("packages/coding-agent/src/cli/initial-message.ts", ["InitialMessageInput", "InitialMessageResult", "buildInitialMessage"]),
      ],
      event: [
        sourceLocation("packages/coding-agent/src/core/agent-session-runtime.ts", [
          "CreateAgentSessionRuntimeResult",
          "CreateAgentSessionRuntimeFactory",
          "SessionImportFileNotFoundError",
          "extractUserMessageText",
          "AgentSessionRuntime",
          "setRebindSession",
          "setBeforeSessionInvalidate",
          "emitBeforeSwitch",
          "emitBeforeFork",
          "teardownCurrent",
          "apply",
          "finishSessionReplacement",
          "switchSession",
          "newSession",
          "fork",
          "importFromJsonl",
          "dispose",
          "createAgentSessionRuntime",
        ]),
        sourceLocation("packages/agent/src/harness/messages.ts", [
          "COMPACTION_SUMMARY_PREFIX",
          "COMPACTION_SUMMARY_SUFFIX",
          "BRANCH_SUMMARY_PREFIX",
          "BRANCH_SUMMARY_SUFFIX",
          "BashExecutionMessage",
          "CustomMessage",
          "BranchSummaryMessage",
          "CompactionSummaryMessage",
          "bashExecutionToText",
          "createBranchSummaryMessage",
          "createCompactionSummaryMessage",
          "createCustomMessage",
          "convertToLlm",
        ]),
      ],
      trace: [
        sourceLocation("packages/coding-agent/src/core/agent-session-runtime.ts", [
          "CreateAgentSessionRuntimeResult",
          "CreateAgentSessionRuntimeFactory",
          "SessionImportFileNotFoundError",
          "AgentSessionRuntime",
          "setRebindSession",
          "setBeforeSessionInvalidate",
          "setBeforeSwitch",
          "setBeforeFork",
          "teardownCurrent",
          "apply",
          "finishSessionReplacement",
          "switchSession",
          "newSession",
          "fork",
          "importFromJsonl",
          "dispose",
          "createAgentSessionRuntime",
        ]),
        sourceLocation("packages/coding-agent/docs/session-format.md", [
          "SessionFileFormat",
          "FileLocation",
          "DeletingSessions",
          "SessionVersion",
          "SourceFiles",
          "MessageTypes",
          "ContentBlocks",
          "BaseMessageTypes",
          "ExtendedMessageTypes",
          "AgentMessageUnion",
          "EntryBase",
          "EntryTypes",
          "SessionHeader",
          "SessionMessageEntry",
          "ModelChangeEntry",
          "ThinkingLevelChangeEntry",
          "CompactionEntry",
          "BranchSummaryEntry",
          "CustomEntry",
          "CustomMessageEntry",
          "LabelEntry",
          "SessionInfoEntry",
          "TreeStructure",
          "ContextBuilding",
          "ParsingExample",
          "SessionManagerAPI",
          "StaticCreationMethods",
          "StaticListingMethods",
          "InstanceMethodsSessionManagement",
          "InstanceMethodsAppending",
          "InstanceMethodsTreeNavigation",
          "InstanceMethodsContextAndInfo",
        ]),
      ],
      runtime: [
        sourceLocation("packages/coding-agent/src/core/agent-session-runtime.ts", [
          "CreateAgentSessionRuntimeResult",
          "CreateAgentSessionRuntimeFactory",
          "SessionImportFileNotFoundError",
          "extractUserMessageText",
          "AgentSessionRuntime",
          "setRebindSession",
          "setBeforeSessionInvalidate",
          "switchSession",
          "newSession",
          "forkFromEntry",
          "importSession",
          "shutdown",
          "createAgentSessionRuntime",
        ]),
        sourceLocation("packages/coding-agent/examples/extensions/reload-runtime.ts", ["default", "reload-runtime", "reload_runtime"]),
      ],
      session: [
        sourceLocation("packages/agent/src/harness/session/session.ts", ["buildSessionContext", "Session"]),
        sourceLocation("packages/agent/src/harness/session/jsonl-repo.ts", ["encodeCwd", "JsonlSessionRepo"]),
        sourceLocation("packages/agent/src/harness/session/jsonl-storage.ts", [
          "updateLabelCache",
          "buildLabelsById",
          "generateEntryId",
          "parseHeaderLine",
          "parseEntryLine",
          "leafIdAfterEntry",
          "headerToSessionMetadata",
          "loadJsonlSessionMetadata",
          "JsonlSessionStorage",
        ]),
      ],
      hook: [
        sourceLocation("packages/coding-agent/src/core/extensions/loader.ts", ["createExtensionRuntime", "loadExtensionFromFactory", "loadExtensions", "discoverAndLoadExtensions"]),
        sourceLocation("packages/coding-agent/src/core/extensions/runner.ts", [
          "ExtensionErrorListener",
          "NewSessionHandler",
          "ForkHandler",
          "NavigateTreeHandler",
          "SwitchSessionHandler",
          "ReloadHandler",
          "ShutdownHandler",
          "emitSessionShutdownEvent",
          "ExtensionRunner",
        ]),
        sourceLocation("packages/coding-agent/src/core/extensions/types.ts", [
          "ExtensionAPI",
          "ExtensionContext",
          "ExtensionCommandContext",
          "ExtensionEvent",
          "ExtensionFactory",
          "Extension",
          "ExtensionRuntime",
          "defineTool",
          "isToolCallEventType",
        ]),
        sourceLocation("packages/coding-agent/src/core/extensions/wrapper.ts", ["wrapRegisteredTool", "wrapRegisteredTools"]),
        sourceLocation("packages/coding-agent/examples/extensions/dynamic-tools.ts", ["normalizeToolName", "dynamicToolsExtension"]),
      ],
      "agent-loop": [
        sourceLocation("packages/agent/src/agent-loop.ts", ["agentLoop", "agentLoopContinue", "runAgentLoop", "runAgentLoopContinue", "streamAssistantResponse", "executeToolCalls"]),
        sourceLocation("packages/agent/src/agent.ts", ["Agent", "AgentOptions", "PendingMessageQueue", "createMutableAgentState"]),
        sourceLocation("packages/agent/src/harness/agent-harness.ts", ["AgentHarness", "createUserMessage", "createFailureMessage", "applyStreamOptionsPatch"]),
      ],
      tool: [
        sourceLocation("packages/coding-agent/src/core/tools/index.ts", [
          "Tool",
          "ToolDef",
          "ToolName",
          "allToolNames",
          "ToolsOptions",
          "createToolDefinition",
          "createTool",
          "createCodingToolDefinitions",
          "createReadOnlyToolDefinitions",
          "createAllToolDefinitions",
          "createCodingTools",
          "createReadOnlyTools",
          "createAllTools",
        ]),
        sourceLocation("packages/coding-agent/src/core/tools/tool-definition-wrapper.ts", ["wrapToolDefinition", "wrapToolDefinitions", "createToolDefinitionFromAgentTool"]),
        sourceLocation("packages/coding-agent/examples/extensions/dynamic-tools.ts", ["normalizeToolName", "dynamicToolsExtension"]),
      ],
      provider: [
        sourceLocation("packages/ai/src/providers/anthropic.ts", ["AnthropicOptions", "streamAnthropic", "streamSimpleAnthropic", "buildParams", "convertMessages", "convertTools"]),
        sourceLocation("packages/ai/src/providers/openai-responses.ts", ["OpenAIResponsesOptions", "streamOpenAIResponses", "streamSimpleOpenAIResponses", "buildParams"]),
        sourceLocation("packages/ai/src/providers/register-builtins.ts", ["registerBuiltInApiProviders", "resetApiProviders", "streamAnthropic", "streamOpenAIResponses"]),
      ],
      prompt: [
        sourceLocation("packages/agent/src/harness/system-prompt.ts", ["formatSkillsForSystemPrompt", "escapeXml"]),
        sourceLocation("packages/agent/src/harness/prompt-templates.ts", [
          "PromptTemplateDiagnosticCode",
          "PromptTemplateDiagnostic",
          "loadPromptTemplates",
          "loadSourcedPromptTemplates",
          "loadTemplatesFromDir",
          "loadTemplateFromFile",
          "parseFrontmatter",
          "parseCommandArgs",
          "substituteArgs",
          "formatPromptTemplateInvocation",
        ]),
        sourceLocation(".pi/prompts/cl.md", ["CL_PROMPT_TEMPLATE", "Process", "ChangelogFormatReference"]),
        sourceLocation(".pi/extensions/prompt-url-widget.ts", [
          "PR_PROMPT_PATTERN",
          "ISSUE_PROMPT_PATTERN",
          "PromptMatch",
          "GhMetadata",
          "extractPromptMatch",
          "fetchGhMetadata",
          "formatAuthor",
          "promptUrlWidgetExtension",
        ]),
      ],
      config: [
        sourceLocation("packages/coding-agent/src/config.ts", [
          "isBunBinary",
          "isBunRuntime",
          "InstallMethod",
          "detectInstallMethod",
          "getSelfUpdateCommand",
          "getSelfUpdateUnavailableInstruction",
          "getUpdateInstruction",
          "getPackageDir",
          "getThemesDir",
          "getExportTemplateDir",
          "getPackageJsonPath",
          "getReadmePath",
          "getDocsPath",
          "getExamplesPath",
          "getChangelogPath",
          "getInteractiveAssetsDir",
          "getBundledInteractiveAssetPath",
          "PACKAGE_NAME",
          "APP_NAME",
          "APP_TITLE",
          "CONFIG_DIR_NAME",
          "VERSION",
          "ENV_AGENT_DIR",
          "ENV_SESSION_DIR",
          "expandTildePath",
          "getShareViewerUrl",
          "getAgentDir",
          "getCustomThemesDir",
          "getModelsPath",
          "getAuthPath",
          "getSettingsPath",
          "getToolsDir",
          "getBinDir",
          "getPromptsDir",
          "getSessionsDir",
          "getDebugLogPath",
        ]),
        sourceLocation("packages/coding-agent/src/cli/config-selector.ts", ["ConfigSelectorOptions", "selectConfig"]),
        sourceLocation("packages/coding-agent/src/core/resolve-config-value.ts", [
          "resolveConfigValue",
          "executeWithConfiguredShell",
          "executeWithDefaultShell",
          "executeCommandUncached",
          "executeCommand",
          "resolveConfigValueUncached",
          "resolveConfigValueOrThrow",
          "resolveHeaders",
          "resolveHeadersOrThrow",
          "clearConfigValueCache",
        ]),
      ],
      ui: [
        sourceLocation("packages/tui/src/autocomplete.ts", [
          "AutocompleteItem",
          "SlashCommand",
          "AutocompleteSuggestions",
          "AutocompleteProvider",
          "CombinedAutocompleteProvider",
          "applyCompletion",
          "extractAtPrefix",
          "extractPathPrefix",
          "resolveScopedFuzzyQuery",
          "getFileSuggestions",
        ]),
        sourceLocation("packages/tui/src/components/box.ts", ["RenderCache", "Box", "addChild", "removeChild"]),
        sourceLocation("packages/tui/src/tui.ts", ["Component", "Focusable", "isFocusable", "CURSOR_MARKER", "OverlayOptions", "OverlayHandle", "Container", "TUI"]),
      ],
      product: [
        sourceLocation("packages/coding-agent/src/cli.ts", ["APP_NAME", "configureHttpDispatcher", "main"]),
        sourceLocation("packages/coding-agent/src/main.ts", [
          "readPipedStdin",
          "collectSettingsDiagnostics",
          "reportDiagnostics",
          "resolveAppMode",
          "prepareInitialMessage",
          "resolveSessionPath",
          "createSessionManager",
          "buildSessionOptions",
          "resolveCliPaths",
          "MainOptions",
          "main",
        ]),
        sourceLocation("packages/coding-agent/src/modes/rpc/rpc-client.ts", ["RpcClientOptions", "ModelInfo", "RpcEventListener", "RpcClient"]),
        sourceLocation("packages/coding-agent/src/package-manager-cli.ts", [
          "PackageCommand",
          "handleConfigCommand",
          "handlePackageCommand",
          "parsePackageCommand",
          "printPackageCommandHelp",
        ]),
        sourceLocation("packages/tui/src/tui.ts", ["Component", "Focusable", "isFocusable", "CURSOR_MARKER", "OverlayOptions", "OverlayHandle", "Container", "TUI"]),
      ],
    },
  },
  nanobot: {
    byPlane: {
      foundation: [
        sourceLocation("nanobot/config/schema.py", [
          "Base",
          "ChannelsConfig",
          "DreamConfig",
          "ModelPresetConfig",
          "AgentDefaults",
          "AgentsConfig",
          "ProviderConfig",
          "ProvidersConfig",
          "ToolsConfig",
          "Config",
          "resolve_default_preset",
          "resolve_preset",
          "get_provider",
          "get_provider_name",
          "get_api_key",
          "get_api_base",
        ]),
        sourceLocation("docs/configuration.md", [
          "Configuration",
          "EnvironmentVariablesForSecrets",
          "Providers",
          "ModelPresets",
          "ChannelSettings",
          "WebTools",
          "MCP",
          "Security",
          "Pairing",
          "SubagentConcurrency",
          "AutoCompact",
          "Timezone",
          "UnifiedSession",
          "DisabledSkills",
        ]),
      ],
      identity: [
        sourceLocation("nanobot/config/paths.py", [
          "get_config_path",
          "get_data_dir",
          "get_runtime_subdir",
          "get_media_dir",
          "get_cron_dir",
          "get_logs_dir",
          "get_webui_dir",
          "get_workspace_path",
          "is_default_workspace",
          "get_cli_history_path",
          "get_bridge_install_dir",
          "get_legacy_sessions_dir",
        ]),
        sourceLocation("nanobot/session/goal_state.py", [
          "GOAL_STATE_KEY",
          "_LEGACY_GOAL_STATE_SESSION_KEY",
          "_MAX_OBJECTIVE_IN_RUNTIME",
          "_MAX_OBJECTIVE_WS",
          "_session_goal_raw",
          "discard_legacy_goal_state_key",
          "goal_state_raw",
          "sustained_goal_active",
          "parse_goal_state",
          "goal_state_runtime_lines",
          "goal_state_ws_blob",
          "runner_wall_llm_timeout_s",
        ]),
      ],
      event: [
        sourceLocation("nanobot/agent/progress_hook.py", [
          "AgentProgressHook",
          "wants_streaming",
          "_strip_think",
          "_tool_hint",
          "_on_progress_accepts",
          "on_stream",
          "on_stream_end",
          "before_iteration",
          "before_execute_tools",
          "emit_reasoning",
          "emit_reasoning_end",
          "after_iteration",
          "finalize_content",
        ]),
        sourceLocation("nanobot/channels/websocket.py", [
          "WebSocketConfig",
          "publish_runtime_model_update",
          "_is_valid_chat_id",
          "_parse_envelope",
          "WebSocketChannel",
          "_send_event",
          "_dispatch_http",
          "_handle_bootstrap",
          "_handle_sessions_list",
          "_handle_session_messages",
          "_handle_webui_thread_get",
          "_try_append_webui_transcript",
          "_handle_message",
          "_serve_static",
          "_authorize_websocket_handshake",
          "_dispatch_envelope",
          "send",
          "send_reasoning_delta",
          "send_reasoning_end",
          "send_delta",
          "send_turn_end",
          "send_goal_state",
          "send_goal_status",
          "send_session_updated",
          "send_runtime_model_updated",
        ]),
      ],
      trace: [
        sourceLocation("nanobot/agent/runner.py", [
          "_DEFAULT_ERROR_MESSAGE",
          "_PERSISTED_MODEL_ERROR_PLACEHOLDER",
          "_MAX_EMPTY_RETRIES",
          "_MAX_LENGTH_RECOVERIES",
          "_MAX_INJECTIONS_PER_TURN",
          "_MAX_INJECTION_CYCLES",
          "_SNIP_SAFETY_BUFFER",
          "_MICROCOMPACT_KEEP_RECENT",
          "_MICROCOMPACT_MIN_CHARS",
          "_COMPACTABLE_TOOLS",
          "_BACKFILL_CONTENT",
          "AgentRunSpec",
          "AgentRunResult",
          "AgentRunner",
          "_append_injected_messages",
          "_build_request_kwargs",
          "_normalize_tool_result",
        ]),
        sourceLocation("nanobot/utils/webui_transcript.py", [
          "WEBUI_TRANSCRIPT_SCHEMA_VERSION",
          "_MAX_TRANSCRIPT_FILE_BYTES",
          "webui_transcript_path",
          "read_transcript_lines",
          "append_transcript_object",
          "delete_webui_transcript",
          "_format_tool_call_trace",
          "tool_trace_lines_from_events",
          "replay_transcript_to_ui_messages",
          "build_webui_thread_response",
        ]),
      ],
      runtime: [
        sourceLocation("nanobot/utils/runtime.py", [
          "empty_tool_result_message",
          "ensure_nonempty_tool_result",
          "is_blank_text",
          "build_finalization_retry_message",
          "build_length_recovery_message",
          "external_lookup_signature",
          "repeated_external_lookup_error",
          "workspace_violation_signature",
          "_normalize_violation_target",
          "repeated_workspace_violation_error",
        ]),
        sourceLocation("nanobot/agent/tools/runtime_state.py", [
          "RuntimeState",
          "model",
          "max_iterations",
          "current_iteration",
          "tool_names",
          "workspace",
          "provider_retry_mode",
          "max_tool_result_chars",
          "context_window_tokens",
          "web_config",
          "exec_config",
          "subagents",
          "_runtime_vars",
          "_last_usage",
          "_sync_subagent_runtime_limits",
          "model_preset",
        ]),
      ],
      session: [
        sourceLocation("nanobot/session/manager.py", [
          "Session",
          "SessionManager",
          "_sanitize_assistant_replay_text",
          "_message_preview_text",
          "add_message",
          "get_history",
          "retain_recent_legal_suffix",
          "enforce_file_cap",
          "save",
          "flush_all",
          "list_sessions",
        ]),
        sourceLocation("nanobot/session/goal_state.py", [
          "discard_legacy_goal_state_key",
          "goal_state_raw",
          "sustained_goal_active",
          "parse_goal_state",
          "goal_state_runtime_lines",
          "goal_state_ws_blob",
          "runner_wall_llm_timeout_s",
        ]),
        sourceLocation("nanobot/utils/session_attachments.py", ["stage_media_paths_for_session_replay", "merge_turn_media_into_last_assistant"]),
      ],
      hook: [
        sourceLocation("nanobot/agent/hook.py", ["AgentHookContext", "AgentHook", "CompositeHook", "SDKCaptureHook", "wants_streaming", "finalize_content"]),
        sourceLocation("nanobot/agent/progress_hook.py", ["AgentProgressHook", "wants_streaming", "_strip_think", "_tool_hint", "_on_progress_accepts", "finalize_content"]),
        sourceLocation("nanobot/agent/runner.py", ["AgentRunSpec", "AgentRunResult", "AgentRunner", "_append_injected_messages", "_build_request_kwargs", "_normalize_tool_result"]),
      ],
      turn: [sourceLocation("nanobot/agent/loop.py", ["AgentLoop", "TurnContext", "TurnState"])],
      "agent-loop": [
        sourceLocation("nanobot/agent/loop.py", ["AgentLoop", "TurnContext", "TurnState"]),
        sourceLocation("nanobot/agent/runner.py", ["AgentRunSpec", "AgentRunResult", "AgentRunner", "run", "_execute_tools", "_microcompact"]),
        sourceLocation("nanobot/agent/context.py", ["ContextBuilder", "build_system_prompt", "build_messages", "_build_runtime_context"]),
        sourceLocation("nanobot/agent/memory.py", ["MemoryStore", "Consolidator", "Dream", "build_memory_context_block"]),
      ],
      tool: [
        sourceLocation("nanobot/agent/tools/registry.py", ["ToolRegistry", "register", "unregister", "get", "get_definitions", "prepare_call", "tool_names"]),
        sourceLocation("nanobot/agent/tools/filesystem.py", [
          "_FsTool",
          "ReadFileTool",
          "WriteFileTool",
          "EditFileTool",
          "ListDirTool",
          "_is_blocked_device",
          "_find_matches",
          "_find_match",
          "_diagnose_near_match",
        ]),
        sourceLocation("nanobot/agent/tools/shell.py", ["ExecToolConfig", "ExecTool", "config_cls", "enabled", "create", "_build_env", "_guard_command", "_extract_absolute_paths"]),
        sourceLocation("nanobot/agent/tools/schema.py", [
          "StringSchema",
          "IntegerSchema",
          "NumberSchema",
          "BooleanSchema",
          "ArraySchema",
          "ObjectSchema",
          "tool_parameters_schema",
        ]),
      ],
      provider: [
        sourceLocation("nanobot/providers/registry.py", ["ProviderSpec", "find_by_name"]),
        sourceLocation("nanobot/providers/openai_compat_provider.py", ["OpenAICompatProvider", "chat", "chat_stream", "_build_kwargs", "_parse_chunks"]),
        sourceLocation("nanobot/providers/anthropic_provider.py", ["AnthropicProvider", "chat", "chat_stream", "_convert_messages", "_convert_tools"]),
        sourceLocation("nanobot/providers/factory.py", ["ProviderSnapshot", "make_provider", "build_provider_snapshot", "load_provider_snapshot", "provider_signature"]),
      ],
      prompt: [
        sourceLocation("nanobot/utils/prompt_templates.py", ["_TEMPLATES_ROOT", "_environment", "render_template"]),
        sourceLocation("nanobot/templates/AGENTS.md", ["AGENTS_TEMPLATE", "AgentInstructions", "ScheduledReminders", "HeartbeatTasks"]),
        sourceLocation("nanobot/templates/TOOLS.md", ["TOOLS_TEMPLATE", "ToolUsageNotes", "ExecSafetyLimits", "GrepContentSearch", "CronScheduledReminders"]),
        sourceLocation("nanobot/templates/memory/MEMORY.md", ["MEMORY_TEMPLATE", "LongTermMemory", "UserInformation", "Preferences", "ProjectContext", "ImportantNotes"]),
      ],
      config: [
        sourceLocation("nanobot/config/loader.py", [
          "set_config_path",
          "get_config_path",
          "load_config",
          "_apply_ssrf_whitelist",
          "save_config",
          "_ENV_REF_PATTERN",
          "resolve_config_env_vars",
          "_resolve_in_place",
          "_resolve_env_vars",
          "_env_replace",
          "_migrate_config",
        ]),
        sourceLocation("nanobot/config/paths.py", [
          "get_config_path",
          "get_data_dir",
          "get_runtime_subdir",
          "get_media_dir",
          "get_cron_dir",
          "get_logs_dir",
          "get_webui_dir",
          "get_workspace_path",
          "is_default_workspace",
          "get_cli_history_path",
          "get_bridge_install_dir",
          "get_legacy_sessions_dir",
        ]),
        sourceLocation("nanobot/config/schema.py", [
          "Base",
          "ChannelsConfig",
          "DreamConfig",
          "ModelPresetConfig",
          "AgentDefaults",
          "AgentsConfig",
          "ProviderConfig",
          "ProvidersConfig",
          "ToolsConfig",
          "Config",
          "_validate_model_preset",
          "resolve_default_preset",
          "resolve_preset",
          "workspace_path",
          "_match_provider",
          "get_provider",
          "get_provider_name",
          "get_api_key",
          "get_api_base",
          "_resolve_tool_config_refs",
        ]),
      ],
      ui: [
        sourceLocation("nanobot/cli/stream.py", [
          "_clear_current_line",
          "_make_console",
          "ThinkingSpinner",
          "StreamRenderer",
          "_renderable",
          "_render_str",
          "_start_spinner",
          "_stop_spinner",
          "console",
          "header_printed",
          "ensure_header",
          "pause_spinner",
          "on_delta",
          "on_end",
          "stop_for_input",
          "pause",
          "close",
        ]),
        sourceLocation("nanobot/channels/websocket.py", [
          "WebSocketConfig",
          "WebSocketChannel",
          "publish_runtime_model_update",
          "_dispatch_http",
          "_handle_bootstrap",
          "_handle_sessions_list",
          "_handle_settings",
          "_handle_commands",
          "_handle_session_messages",
          "_handle_webui_thread_get",
          "_try_append_webui_transcript",
          "_serve_static",
          "_authorize_websocket_handshake",
          "send_delta",
          "send_turn_end",
          "send_runtime_model_updated",
        ]),
        sourceLocation("webui/src/App.tsx", ["BootState", "SIDEBAR_STORAGE_KEY", "RESTART_STARTED_KEY", "SIDEBAR_WIDTH", "ShellView", "AuthForm", "readSidebarOpen", "App", "Shell"]),
        sourceLocation("webui/src/components/thread/ThreadShell.tsx", [
          "projectWebuiThreadMessages",
          "ThreadShellProps",
          "toModelBadgeLabel",
          "QUICK_ACTION_KEYS",
          "IMAGE_QUICK_ACTION_KEYS",
          "PendingFirstMessage",
          "ThreadShell",
        ]),
      ],
      product: [
        sourceLocation("nanobot/cli/commands.py", [
          "main",
          "onboard",
          "serve",
          "gateway",
          "_run_gateway",
          "agent",
          "channels_status",
          "channels_login",
          "plugins_list",
          "status",
          "provider_login",
          "provider_logout",
        ]),
        sourceLocation("nanobot/api/server.py", ["_error_json", "_chat_completion_response", "_sse_chunk", "_parse_json_content", "create_app"]),
        sourceLocation("nanobot/channels/websocket.py", [
          "WebSocketConfig",
          "WebSocketChannel",
          "publish_runtime_model_update",
          "_handle_bootstrap",
          "_handle_sessions_list",
          "_handle_settings",
          "_handle_commands",
          "_handle_session_messages",
          "_serve_static",
          "_authorize_websocket_handshake",
        ]),
      ],
      task: [
        sourceLocation("nanobot/agent/tools/long_task.py", ["_iso_now", "_GoalToolsMixin", "LongTaskTool", "CompleteGoalTool"]),
        sourceLocation("nanobot/skills/long-goal/SKILL.md", [
          "Long-running objectives",
          "Start fast",
          "Tools",
          "Where the goal appears",
          "Execution guide after long_task is set",
          "Idempotent goals",
          "Project-shaped work",
          "Look things up instead of guessing",
        ]),
      ],
    },
  },
  "hermes-agent": {
    byPlane: {
      foundation: [
        sourceLocation("cli.py", [
          "load_cli_config",
          "CLI_CONFIG",
          "_parse_reasoning_config",
          "_parse_service_tier_config",
          "_prepare_deferred_agent_startup",
          "_run_state_db_auto_maintenance",
          "_run_checkpoint_auto_maintenance",
          "ChatConsole",
          "HermesCLI",
          "main",
        ]),
        sourceLocation("hermes_cli/_parser.py", ["PRE_ARGPARSE_INHERITED_FLAGS", "_inherited_flag", "_EPILOGUE", "build_top_level_parser"]),
      ],
      identity: [
        sourceLocation("agent/agent_runtime_helpers.py", ["_ra", "convert_to_trajectory_format", "sanitize_tool_call_arguments"]),
        sourceLocation("acp_adapter/session.py", [
          "_win_path_to_wsl",
          "_translate_acp_cwd",
          "_normalize_cwd_for_compare",
          "_build_session_title",
          "_format_updated_at",
          "_updated_at_sort_key",
          "_register_task_cwd",
          "_clear_task_cwd",
          "SessionState",
          "SessionManager",
          "create_session",
          "get_session",
          "remove_session",
          "fork_session",
          "list_sessions",
          "update_cwd",
          "cleanup",
          "save_session",
          "_persist",
          "_restore",
        ]),
      ],
      event: [
        sourceLocation("agent/transports/types.py", ["ToolCall", "type", "function", "call_id", "response_item_id", "extra_content", "Usage", "NormalizedResponse", "reasoning_content", "reasoning_details", "codex_reasoning_items", "codex_message_items", "build_tool_call", "map_finish_reason"]),
        sourceLocation("agent/transports/codex_event_projector.py", [
          "_deterministic_call_id",
          "_format_tool_args",
          "ProjectionResult",
          "CodexEventProjector",
          "project",
          "_project_agent_message",
          "_project_user_message",
          "_project_command",
          "_project_file_change",
          "_project_mcp_tool_call",
          "_project_dynamic_tool_call",
          "_project_opaque",
        ]),
      ],
      trace: [
        sourceLocation("agent/trajectory.py", ["convert_scratchpad_to_think", "has_incomplete_scratchpad", "save_trajectory"]),
        sourceLocation("agent/tool_result_classification.py", ["FILE_MUTATING_TOOL_NAMES", "file_mutation_result_landed"]),
      ],
      runtime: [
        sourceLocation("agent/codex_runtime.py", [
          "run_codex_app_server_turn",
          "_event_field",
          "_raise_stream_error",
          "_consume_codex_event_stream",
          "run_codex_stream",
          "run_codex_create_stream_fallback",
        ]),
        sourceLocation("agent/agent_runtime_helpers.py", [
          "convert_to_trajectory_format",
          "sanitize_tool_call_arguments",
          "repair_message_sequence",
          "strip_think_blocks",
          "recover_with_credential_pool",
          "try_recover_primary_transport",
          "drop_thinking_only_and_merge_users",
          "restore_primary_runtime",
          "extract_reasoning",
          "dump_api_request_debug",
          "anthropic_prompt_cache_policy",
          "create_openai_client",
          "switch_model",
          "invoke_tool",
          "repair_tool_call",
          "sanitize_api_messages",
          "looks_like_codex_intermediate_ack",
          "copy_reasoning_content_for_api",
          "reapply_reasoning_echo_for_provider",
          "cleanup_dead_connections",
          "extract_api_error_context",
          "apply_pending_steer_to_tool_results",
          "force_close_tcp_sockets",
        ]),
        sourceLocation("gateway/runtime_footer.py", ["_home_relative_cwd", "_model_short", "resolve_footer_config", "format_runtime_footer", "build_footer_line"]),
      ],
      session: [
        sourceLocation("acp_adapter/session.py", ["SessionState", "SessionManager", "create_session", "get_session", "fork_session", "list_sessions", "save_session", "_persist", "_restore"]),
        sourceLocation("agent/transports/codex_app_server_session.py", [
          "TurnResult",
          "CodexAppServerSession",
          "ensure_started",
          "run_turn",
          "request_interrupt",
          "_handle_server_request",
          "_approval_choice_to_codex_decision",
          "_has_turn_aborted_marker",
        ]),
        sourceLocation("agent/trajectory.py", ["convert_scratchpad_to_think", "has_incomplete_scratchpad", "save_trajectory"]),
      ],
      hook: [
        sourceLocation("agent/shell_hooks.py", ["ShellHookSpec", "register_from_config", "iter_configured_hooks", "reset_for_tests", "_parse_hooks_block", "_make_callback", "_parse_response", "run_once"]),
        sourceLocation("hermes_cli/plugins.py", [
          "PluginManifest",
          "LoadedPlugin",
          "PluginContext",
          "PluginManager",
          "register_hook",
          "invoke_hook",
          "discover_plugins",
          "get_plugin_manager",
          "set_thread_tool_whitelist",
          "get_pre_tool_call_block_message",
        ]),
        sourceLocation("hermes_cli/plugins_cmd.py", [
          "PluginOperationError",
          "cmd_install",
          "cmd_update",
          "cmd_remove",
          "cmd_enable",
          "cmd_disable",
          "cmd_list",
          "cmd_toggle",
          "dashboard_install_plugin",
          "dashboard_set_agent_plugin_enabled",
        ]),
      ],
      "agent-loop": [
        sourceLocation("agent/conversation_loop.py", ["run_conversation"]),
        sourceLocation("agent/context_engine.py", ["ContextEngine", "should_compress", "compress", "handle_tool_call"]),
        sourceLocation("agent/context_compressor.py", ["ContextCompressor", "compress", "_generate_summary", "_sanitize_tool_pairs"]),
        sourceLocation("agent/memory_manager.py", ["MemoryManager", "StreamingContextScrubber", "sanitize_context", "build_memory_context_block"]),
      ],
      tool: [
        sourceLocation("agent/tool_executor.py", ["execute_tool_calls_concurrent", "_run_tool", "execute_tool_calls_sequential"]),
        sourceLocation("agent/tool_dispatch_helpers.py", [
          "_should_parallelize_tool_batch",
          "_extract_parallel_scope_path",
          "_paths_overlap",
          "_extract_file_mutation_targets",
          "make_tool_result_message",
          "_maybe_wrap_untrusted",
        ]),
        sourceLocation("agent/tool_guardrails.py", [
          "ToolCallGuardrailConfig",
          "ToolCallSignature",
          "ToolGuardrailDecision",
          "ToolCallGuardrailController",
          "canonical_tool_args",
          "classify_tool_failure",
          "toolguard_synthetic_result",
          "append_toolguard_guidance",
        ]),
        sourceLocation("agent/tool_result_classification.py", ["file_mutation_result_landed"]),
        sourceLocation("acp_adapter/tools.py", ["get_tool_kind", "make_tool_call_id", "build_tool_title", "build_tool_start", "build_tool_complete", "extract_locations"]),
      ],
      provider: [
        sourceLocation("agent/transports/codex.py", ["ResponsesApiTransport", "convert_messages", "build_kwargs", "normalize_response", "validate_response"]),
        sourceLocation("agent/transports/anthropic.py", ["AnthropicTransport", "convert_messages", "build_kwargs", "normalize_response", "validate_response"]),
        sourceLocation("agent/transports/chat_completions.py", ["ChatCompletionsTransport", "convert_messages", "build_kwargs", "normalize_response", "validate_response"]),
        sourceLocation("agent/transports/types.py", ["ToolCall", "Usage", "NormalizedResponse", "build_tool_call", "map_finish_reason"]),
      ],
      prompt: [
        sourceLocation("agent/system_prompt.py", ["build_system_prompt_parts", "build_system_prompt", "invalidate_system_prompt", "format_tools_for_system_message"]),
        sourceLocation("agent/prompt_builder.py", [
          "DEFAULT_AGENT_IDENTITY",
          "HERMES_AGENT_HELP_GUIDANCE",
          "MEMORY_GUIDANCE",
          "SKILLS_GUIDANCE",
          "TOOL_USE_ENFORCEMENT_GUIDANCE",
          "PLATFORM_HINTS",
          "build_environment_hints",
          "build_skills_system_prompt",
          "build_context_files_prompt",
        ]),
        sourceLocation("agent/skill_bundles.py", [
          "scan_bundles",
          "get_skill_bundles",
          "resolve_bundle_command_key",
          "reload_bundles",
          "list_bundles",
          "build_bundle_invocation_message",
          "save_bundle",
          "delete_bundle",
          "get_bundle",
        ]),
      ],
      config: [
        sourceLocation("apps/desktop/src/app/settings/config-settings.tsx", ["ConfigField", "ConfigSettings"]),
        sourceLocation("apps/desktop/src/app/session/hooks/use-hermes-config.ts", ["DEFAULT_VOICE_SECONDS", "FAST_TIERS", "recordingLimit", "HermesConfigOptions", "useHermesConfig", "refreshHermesConfig"]),
        sourceLocation("hermes_cli/skills_config.py", ["PLATFORMS", "get_disabled_skills", "save_disabled_skills", "_list_all_skills", "_get_categories", "_select_platform", "_toggle_by_category", "skills_command"]),
      ],
      ui: [
        sourceLocation("agent/display.py", [
          "_diff_ansi",
          "LocalEditSnapshot",
          "set_tool_preview_max_len",
          "get_tool_preview_max_len",
          "_get_skin",
          "get_skin_tool_prefix",
          "get_tool_emoji",
          "build_tool_preview",
          "capture_local_edit_snapshot",
          "extract_edit_diff",
          "render_edit_diff_with_delta",
          "KawaiiSpinner",
          "_detect_tool_failure",
          "get_cute_tool_message",
        ]),
        sourceLocation("apps/desktop/src/app/chat/index.tsx", ["ChatViewProps", "ChatHeaderProps", "ChatHeader", "ChatView"]),
        sourceLocation("apps/desktop/src/app/chat/composer/index.tsx", [
          "COMPOSER_STACK_BREAKPOINT_PX",
          "COMPOSER_FADE_BACKGROUND",
          "QueueEditState",
          "cloneAttachments",
          "ChatBar",
          "ChatBarFallback",
        ]),
      ],
      product: [
        sourceLocation("cli.py", [
          "HermesCLI",
          "ChatConsole",
          "load_cli_config",
          "main",
          "run",
          "chat",
          "new_session",
          "process_command",
          "_handle_resume_command",
          "_handle_sessions_command",
          "_handle_model_switch",
          "_handle_tools_command",
        ]),
        sourceLocation("acp_adapter/server.py", [
          "HermesACPAgent",
          "_resource_display_name",
          "_content_blocks_to_openai_user_content",
          "_extract_text",
          "_available_commands",
          "_handle_slash_command",
          "_cmd_help",
          "_cmd_model",
          "_cmd_tools",
          "_cmd_context",
          "_cmd_reset",
          "_cmd_compact",
          "_cmd_steer",
          "_cmd_queue",
          "_cmd_version",
        ]),
        sourceLocation("gateway/platforms/api_server.py", [
          "check_api_server_requirements",
          "ResponseStore",
          "APIServerAdapter",
          "_openai_error",
          "_derive_chat_session_id",
          "_create_agent",
          "_session_response",
          "_message_response",
          "_conversation_history_for_session",
          "_turn_transcript_messages",
        ]),
        sourceLocation("apps/desktop/src/app/index.tsx", ["DesktopController"]),
        sourceLocation("apps/desktop/src/app/chat/index.tsx", ["ChatHeader", "ChatView"]),
      ],
    },
  },
}

export function buildCurrentModulePlaceholderAudit(input: BuildCurrentModulePlaceholderAuditInput = {}): CurrentModulePlaceholderAudit {
  const products = input.products ?? defaultProducts
  const upstreamBaselines = products.map((product) => upstreamBaselineCatalog[product])
  const contracts = input.contracts ?? products.map((product) => buildAssemblyContract({ product, ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}) }))
  const minimalContract = buildAssemblyContract({ product: "minimal", ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}) })
  const contractsWithMinimal = [...contracts, minimalContract]
  const inventory = buildTodo27NativeRewriteInventory({ products, contracts, ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}) })
  const executableAudit = buildExecutablePlaceholderAudit({ products: [...products, "minimal"], contracts: contractsWithMinimal, ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}) })
  const atomByProductAndID = atomLookup(contractsWithMinimal)
  const packageItems = packageSummaryItems(contracts, inventory, atomByProductAndID)
  const planeItems = planeSummaryItems(contracts, inventory, atomByProductAndID)
  const atomItems = inventory.items.map((item) => productAtomItem(item, atomByProductAndID))
  const bindingItems = executableAudit.items.map((item) => requiredBindingItem(item, atomByProductAndID))
  const items = [...packageItems, ...planeItems, ...atomItems, ...bindingItems].sort((left, right) => `${left.kind}:${left.id}`.localeCompare(`${right.kind}:${right.id}`))
  const workQueue = buildWorkQueueItems(items)
  const fixtureDiffQueue = buildFixtureDiffQueueItems(items)
  const sourceFileFixtureQueue = buildSourceFileFixtureQueueItems(items)
  const sourceOwnerLineLevelSummaries = buildSourceOwnerLineLevelSummaries(sourceFileFixtureQueue)
  const productSummaries = buildProductSummaries(products, items)
  const packageSummaries = buildPackageSummaries(packageCatalog, items)
  const planeSummaries = buildPlaneSummaries(items)
  const currentSourceFileSummaries = buildCurrentSourceFileSummaries(items)
  const summaryWithoutFingerprint = auditSummaryFromItems(items, workQueue)
  const fingerprint = fingerprintObject({
    products,
    upstreamBaselines,
    packageCatalog,
    items: items.map(fingerprintItem),
    workQueue,
    fixtureDiffQueue,
    sourceFileFixtureQueue,
    sourceOwnerLineLevelSummaries,
    productSummaries,
    packageSummaries,
    planeSummaries,
    currentSourceFileSummaries,
    summary: summaryWithoutFingerprint,
  })
  return {
    schemaVersion: 1,
    artifactKind: "current-module-placeholder-audit",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    products,
    upstreamBaselines,
    packageCatalog: [...packageCatalog],
    items,
    workQueue,
    fixtureDiffQueue,
    sourceFileFixtureQueue,
    sourceOwnerLineLevelSummaries,
    productSummaries,
    packageSummaries,
    planeSummaries,
    currentSourceFileSummaries,
    summary: {
      ...summaryWithoutFingerprint,
      fingerprint,
    },
  }
}

export function verifyCurrentModulePlaceholderAudit(audit: CurrentModulePlaceholderAudit): CurrentModulePlaceholderAuditVerification {
  const checks: CurrentModulePlaceholderAuditVerificationCheck[] = []
  const expectedAudit = buildCurrentModulePlaceholderAudit({ products: audit.products, generatedAt: audit.generatedAt })
  const actualItemIDs = new Set(audit.items.map((item) => item.id))
  const expectedProductAtomIDs = expectedAudit.items.filter((item) => item.kind === "product-atom").map((item) => item.id)
  const expectedSelectedProductAtomIDs = expectedAudit.items.filter((item) => item.kind === "product-atom" && item.selected).map((item) => item.id)
  const expectedRequiredBindingIDs = expectedAudit.items.filter((item) => item.kind === "required-binding").map((item) => item.id)
  const missingProductAtomIDs = expectedProductAtomIDs.filter((id) => !actualItemIDs.has(id))
  const missingSelectedProductAtomIDs = expectedSelectedProductAtomIDs.filter((id) => !actualItemIDs.has(id))
  const missingRequiredBindingIDs = expectedRequiredBindingIDs.filter((id) => !actualItemIDs.has(id))
  const expectedWorkQueue = buildWorkQueueItems(audit.items)
  const expectedFixtureDiffQueue = buildFixtureDiffQueueItems(audit.items)
  const expectedSourceFileFixtureQueue = buildSourceFileFixtureQueueItems(audit.items)
  const expectedSourceOwnerLineLevelSummaries = buildSourceOwnerLineLevelSummaries(expectedSourceFileFixtureQueue)
  const actualWorkQueue = audit.workQueue ?? []
  const actualFixtureDiffQueue = audit.fixtureDiffQueue ?? []
  const actualSourceFileFixtureQueue = audit.sourceFileFixtureQueue ?? []
  const actualSourceOwnerLineLevelSummaries = audit.sourceOwnerLineLevelSummaries ?? []
  const actualProductSummaries = audit.productSummaries ?? []
  const actualPackageSummaries = audit.packageSummaries ?? []
  const actualPlaneSummaries = audit.planeSummaries ?? []
  const actualCurrentSourceFileSummaries = audit.currentSourceFileSummaries ?? []
  const expectedProductSummaries = buildProductSummaries(audit.products, audit.items)
  const expectedPackageSummaries = buildPackageSummaries(audit.packageCatalog, audit.items)
  const expectedPlaneSummaries = buildPlaneSummaries(audit.items)
  const expectedCurrentSourceFileSummaries = buildCurrentSourceFileSummaries(audit.items)
  const expectedFingerprint = fingerprintObject({
    products: audit.products,
    upstreamBaselines: audit.upstreamBaselines,
    packageCatalog: audit.packageCatalog,
    items: audit.items.map(fingerprintItem),
    workQueue: actualWorkQueue,
    fixtureDiffQueue: actualFixtureDiffQueue,
    sourceFileFixtureQueue: actualSourceFileFixtureQueue,
    sourceOwnerLineLevelSummaries: actualSourceOwnerLineLevelSummaries,
    productSummaries: actualProductSummaries,
    packageSummaries: actualPackageSummaries,
    planeSummaries: actualPlaneSummaries,
    currentSourceFileSummaries: actualCurrentSourceFileSummaries,
    summary: auditSummaryFromItems(audit.items, actualWorkQueue),
  })
  checks.push(check("current-module-audit.schema", audit.schemaVersion === 1 && audit.artifactKind === "current-module-placeholder-audit", "Artifact uses current module placeholder audit schema v1."))
  checks.push(check("current-module-audit.fingerprint", audit.summary.fingerprint === expectedFingerprint, "Fingerprint matches package, plane, atom, and binding audit content.", "error", [audit.summary.fingerprint, expectedFingerprint]))
  checks.push(
    check(
      "current-module-audit.package-catalog.complete",
      packageCatalog.every((pkg) => audit.packageCatalog.includes(pkg)) && audit.summary.packageItems >= packageCatalog.length,
      "Audit must include every current package in the package catalog.",
      "error",
      packageCatalog.filter((pkg) => !audit.packageCatalog.includes(pkg)),
    ),
  )
  const missingUpstreamBaselines = audit.products.filter((product) => !audit.upstreamBaselines.some((baseline) => baseline.product === product && baseline.pinnedRef && baseline.latestHead && baseline.checkedAt))
  checks.push(
    check(
      "current-module-audit.upstream-baseline.complete",
      missingUpstreamBaselines.length === 0,
      "Every audited product must carry pinned and latest upstream baseline metadata.",
      "error",
      missingUpstreamBaselines,
    ),
  )
  checks.push(
    check(
      "current-module-audit.transition-atoms.covered",
      audit.summary.productAtomItems === audit.summary.transitionAtoms && audit.summary.transitionAtoms === expectedProductAtomIDs.length && missingProductAtomIDs.length === 0,
      "Every product-scoped transition atom must have an audit item.",
      "error",
      missingProductAtomIDs.length > 0 ? missingProductAtomIDs.slice(0, 20) : [String(audit.summary.productAtomItems), String(audit.summary.transitionAtoms)],
    ),
  )
  checks.push(
    check(
      "current-module-audit.selected-transition-atoms.covered",
      audit.summary.selectedTransitionAtoms === expectedSelectedProductAtomIDs.length && missingSelectedProductAtomIDs.length === 0,
      "Every selected product-scoped transition atom must have an audit item.",
      "error",
      missingSelectedProductAtomIDs.length > 0 ? missingSelectedProductAtomIDs.slice(0, 20) : [String(audit.summary.selectedTransitionAtoms), String(expectedSelectedProductAtomIDs.length)],
    ),
  )
  checks.push(
    check(
      "current-module-audit.required-bindings.covered",
      audit.summary.requiredBindingItems === audit.summary.requiredBindings && audit.summary.requiredBindings === expectedRequiredBindingIDs.length && missingRequiredBindingIDs.length === 0,
      "Every required binding must have an audit item.",
      "error",
      missingRequiredBindingIDs.length > 0 ? missingRequiredBindingIDs.slice(0, 20) : [String(audit.summary.requiredBindingItems), String(audit.summary.requiredBindings)],
    ),
  )
  const unmarkedUpstreamDrift = audit.items.filter((item) => isCurrentModuleAuditProduct(item.product) && (item.upstreamDriftStatus === "not-product-scoped" || item.upstreamBaselineRefs.length === 0))
  checks.push(
    check(
      "current-module-audit.upstream-head-drift.marked",
      unmarkedUpstreamDrift.length === 0,
      "Product-scoped items must explicitly mark pinned-vs-latest upstream HEAD drift.",
      "error",
      unmarkedUpstreamDrift.slice(0, 20).map((item) => item.id),
    ),
  )
  const missingUpstreamSourceLocations = audit.items.filter(
    (item) =>
      isCurrentModuleAuditProduct(item.product) &&
      (item.upstreamSourceStatus === "not-product-scoped" ||
        item.upstreamSourceStatus === "upstream-baseline-only" ||
        item.upstreamSourceLocations.length === 0 ||
        item.upstreamSourceLocations.some((location) => !location.repo || !location.ref || !location.path || !location.evidence)),
  )
  checks.push(
    check(
      "current-module-audit.upstream-source.product-scoped-mapped",
      missingUpstreamSourceLocations.length === 0,
      "Every product-scoped atom and binding must map to pinned upstream repo/ref/source path evidence.",
      "error",
      missingUpstreamSourceLocations.slice(0, 20).map((item) => item.id),
    ),
  )
  const missingPinnedBehaviorStatus = audit.items.filter((item) => !item.pinnedUpstreamBehaviorStatus || (isCurrentModuleAuditProduct(item.product) && item.pinnedUpstreamBehaviorStatus === "not-product-scoped"))
  checks.push(
    check(
      "current-module-audit.pinned-upstream-behavior.classified",
      missingPinnedBehaviorStatus.length === 0,
      "Every item must classify pinned upstream behavior alignment; product-scoped items cannot be marked not-product-scoped.",
      "error",
      missingPinnedBehaviorStatus.slice(0, 20).map((item) => item.id),
    ),
  )
  const missingPinnedDivergenceDetails = audit.items.filter(
    (item) =>
      isCurrentModuleAuditProduct(item.product) &&
      item.pinnedUpstreamBehaviorStatus !== "pinned-native-exact" &&
      item.pinnedUpstreamBehaviorStatus !== "not-product-scoped" &&
      item.pinnedUpstreamDivergences.length === 0,
  )
  checks.push(
    check(
      "current-module-audit.pinned-upstream-divergence.details",
      missingPinnedDivergenceDetails.length === 0,
      "Product-scoped non-native items must include field-level pinned upstream divergence details.",
      "error",
      missingPinnedDivergenceDetails.slice(0, 20).map((item) => item.id),
    ),
  )
  const missingPinnedDivergenceVerificationTargets = audit.items.filter((item) =>
    item.pinnedUpstreamDivergences.some(
      (divergence) =>
        divergence.upstreamAnchorRefs.length === 0 ||
        divergence.currentAnchorRefs.length === 0 ||
        !divergence.requiredEvidence ||
        !divergence.nextVerification ||
        !divergence.exactDiffStatus ||
        !divergence.fixtureDiffTarget ||
        divergence.comparisonDimensions.length === 0 ||
        !divergence.currentCoverage,
    ),
  )
  checks.push(
    check(
      "current-module-audit.pinned-upstream-divergence.verification-targets",
      missingPinnedDivergenceVerificationTargets.length === 0,
      "Pinned upstream divergence details must name upstream/current anchors, required evidence, and the next verification gate.",
      "error",
      missingPinnedDivergenceVerificationTargets.slice(0, 20).map((item) => item.id),
    ),
  )
  const missingBehaviorExactDiffTargets = audit.items.filter((item) =>
    item.pinnedUpstreamDivergences.some((divergence) => !divergence.exactDiffStatus || !divergence.fixtureDiffTarget || divergence.comparisonDimensions.length === 0 || !divergence.currentCoverage),
  )
  checks.push(
    check(
      "current-module-audit.behavior-exact-diff.targets",
      missingBehaviorExactDiffTargets.length === 0,
      "Pinned upstream divergences must include an exact-diff status, fixture target, comparison dimensions, and current coverage statement.",
      "error",
      missingBehaviorExactDiffTargets.slice(0, 20).map((item) => item.id),
    ),
  )
  const divergenceItemIDs = audit.items.filter((item) => item.pinnedUpstreamDivergences.length > 0).map((item) => item.id)
  const workQueueCoveredItemIDs = new Set(actualWorkQueue.flatMap((item) => item.itemIDs))
  const fixtureDiffQueueCoveredItemIDs = new Set(actualFixtureDiffQueue.flatMap((item) => item.itemIDs))
  const missingWorkQueueItems = divergenceItemIDs.filter((id) => !workQueueCoveredItemIDs.has(id))
  const missingFixtureDiffQueueItems = divergenceItemIDs.filter((id) => !fixtureDiffQueueCoveredItemIDs.has(id))
  const malformedWorkQueueItems = actualWorkQueue.filter(
    (item) =>
      !item.id ||
      !item.ownerTODO ||
      !item.priority ||
      item.status !== "open" ||
      item.itemIDs.length === 0 ||
      item.itemCount !== item.itemIDs.length ||
      !item.requiredEvidence ||
      !item.nextVerification ||
      item.upstreamAnchorRefs.length === 0 ||
      item.currentAnchorRefs.length === 0 ||
      item.exactDiffStatuses.length === 0 ||
      item.fixtureDiffTargets.length === 0 ||
      item.comparisonDimensions.length === 0 ||
      !item.action,
  )
	  const malformedFixtureDiffQueueItems = actualFixtureDiffQueue.filter(
	    (item) =>
	      !item.id ||
	      !item.fixtureDiffTarget ||
	      !item.exactDiffStatus ||
	      !item.priority ||
	      item.status !== "open" ||
	      item.itemIDs.length === 0 ||
	      item.itemCount !== item.itemIDs.length ||
	      !item.requiredEvidence ||
	      !item.nextVerification ||
	      item.upstreamAnchorRefs.length === 0 ||
	      item.currentAnchorRefs.length === 0 ||
	      item.comparisonDimensions.length === 0 ||
	      !item.action,
	  )
  const malformedSourceFileFixtureQueueItems = actualSourceFileFixtureQueue.filter(
    (item) =>
      !item.id ||
      !item.currentSourceFile ||
      !item.sourceOwnerPackagePath ||
      !item.sourceOwnerPackageCatalogStatus ||
      !sourceOwnerPackageStatusMatchesCatalog(item.sourceOwnerPackagePath, item.sourceOwnerPackageCatalogStatus, audit.packageCatalog) ||
	      !item.fixtureDiffTarget ||
	      !item.exactDiffStatus ||
	      !item.lineLevelDiffStatus ||
	      !item.priority ||
	      item.status !== "open" ||
	      item.itemIDs.length === 0 ||
	      item.itemCount !== item.itemIDs.length ||
	      item.sampleItemIDs.length === 0 ||
	      !item.sampleItemIDs.every((id) => item.itemIDs.includes(id)) ||
	      !item.requiredEvidence ||
	      !item.nextVerification ||
	      !item.fixtureImplementationTarget ||
	      !item.negativeVerificationTarget ||
	      item.upstreamAnchorRefs.length === 0 ||
	      item.currentAnchorRefs.length === 0 ||
	      item.sampleUpstreamAnchorRefs.length === 0 ||
	      item.sampleCurrentAnchorRefs.length === 0 ||
	      !item.sampleUpstreamAnchorRefs.every((ref) => item.upstreamAnchorRefs.includes(ref)) ||
	      !item.sampleCurrentAnchorRefs.every((ref) => item.currentAnchorRefs.includes(ref)) ||
	      item.comparisonDimensions.length === 0 ||
	      !item.action,
	  )
  checks.push(
    check(
      "current-module-audit.work-queue.covered",
      missingWorkQueueItems.length === 0 && malformedWorkQueueItems.length === 0 && stableStringify(actualWorkQueue) === stableStringify(expectedWorkQueue),
      "Every pinned divergence item must appear in a stable owner/product/plane work queue with evidence targets and action text.",
      "error",
      missingWorkQueueItems.length > 0 ? missingWorkQueueItems.slice(0, 20) : malformedWorkQueueItems.slice(0, 20).map((item) => item.id),
    ),
  )
  checks.push(
    check(
      "current-module-audit.fixture-diff-queue.covered",
      missingFixtureDiffQueueItems.length === 0 && malformedFixtureDiffQueueItems.length === 0 && stableStringify(actualFixtureDiffQueue) === stableStringify(expectedFixtureDiffQueue),
      "Every pinned divergence item must appear in a stable fixture-diff queue grouped by fixture target and exact-diff status.",
      "error",
      missingFixtureDiffQueueItems.length > 0 ? missingFixtureDiffQueueItems.slice(0, 20) : malformedFixtureDiffQueueItems.slice(0, 20).map((item) => item.id),
    ),
  )
  checks.push(
	    check(
	      "current-module-audit.source-file-fixture-queue.covered",
	      malformedSourceFileFixtureQueueItems.length === 0 && stableStringify(actualSourceFileFixtureQueue) === stableStringify(expectedSourceFileFixtureQueue),
	      "Every current source file divergence must appear in a stable source-file fixture queue with source owner, fixture implementation target, negative verification target, and sample anchors.",
	      "error",
	      malformedSourceFileFixtureQueueItems.length > 0 ? malformedSourceFileFixtureQueueItems.slice(0, 20).map((item) => item.id) : actualSourceFileFixtureQueue.length === 0 ? ["sourceFileFixtureQueue"] : [],
	    ),
  )
  const malformedSourceOwnerLineLevelSummaries = actualSourceOwnerLineLevelSummaries.filter((summary) => {
    const byLineLevelDiffStatus = summary.byLineLevelDiffStatus ?? {}
    const byExactDiffStatus = summary.byExactDiffStatus ?? {}
    const normalizedLineLevelDiffStatusCounts: Record<CurrentModuleSourceFileLineLevelDiffStatus, number> = {
      "demotion-guard-only": byLineLevelDiffStatus["demotion-guard-only"] ?? 0,
      "line-level-diff-missing": byLineLevelDiffStatus["line-level-diff-missing"] ?? 0,
      "manual-anchor-needed": byLineLevelDiffStatus["manual-anchor-needed"] ?? 0,
      "semantic-fixture-needs-exact-diff": byLineLevelDiffStatus["semantic-fixture-needs-exact-diff"] ?? 0,
    }
    const lineLevelStatusTotal = Object.values(byLineLevelDiffStatus).reduce((total, count) => total + count, 0)
    const exactDiffStatusTotal = Object.values(byExactDiffStatus).reduce((total, count) => total + count, 0)
    return (
      !summary.sourceOwnerPackagePath ||
      !summary.sourceOwnerPackageCatalogStatus ||
      !sourceOwnerPackageStatusMatchesCatalog(summary.sourceOwnerPackagePath, summary.sourceOwnerPackageCatalogStatus, audit.packageCatalog) ||
      !summary.moduleConfirmationStatus ||
      !summary.moduleConfirmationSummary ||
      summary.moduleConfirmationStatus !== moduleConfirmationStatusFromLineLevelCounts(normalizedLineLevelDiffStatusCounts) ||
      summary.queueItems <= 0 ||
      summary.itemCount < summary.queueItems ||
      summary.currentSourceFileCount <= 0 ||
      (summary.sampleCurrentSourceFiles ?? []).length === 0 ||
      (summary.ownerTODOs ?? []).length === 0 ||
      lineLevelStatusTotal !== summary.queueItems ||
      exactDiffStatusTotal !== summary.queueItems ||
      summary.lineLevelDiffMissing !== (byLineLevelDiffStatus["line-level-diff-missing"] ?? 0) ||
      summary.semanticFixtureNeedsExactDiff !== (byLineLevelDiffStatus["semantic-fixture-needs-exact-diff"] ?? 0) ||
      summary.demotionGuardOnly !== (byLineLevelDiffStatus["demotion-guard-only"] ?? 0) ||
      summary.manualAnchorNeeded !== (byLineLevelDiffStatus["manual-anchor-needed"] ?? 0) ||
      (summary.sampleItemIDs ?? []).length === 0 ||
      (summary.sampleFixtureImplementationTargets ?? []).length === 0 ||
      (summary.sampleNegativeVerificationTargets ?? []).length === 0
    )
  })
  checks.push(
    check(
      "current-module-audit.source-owner-line-level-summaries.complete",
      malformedSourceOwnerLineLevelSummaries.length === 0 && stableStringify(actualSourceOwnerLineLevelSummaries) === stableStringify(expectedSourceOwnerLineLevelSummaries),
      "Each source owner package must expose a stable line-level exact-diff summary across source-file fixture queue items.",
      "error",
      malformedSourceOwnerLineLevelSummaries.length > 0
        ? malformedSourceOwnerLineLevelSummaries.slice(0, 20).map((summary) => summary.sourceOwnerPackagePath)
        : expectedSourceOwnerLineLevelSummaries
            .filter((summary) => !actualSourceOwnerLineLevelSummaries.some((actual) => actual.sourceOwnerPackagePath === summary.sourceOwnerPackagePath))
            .slice(0, 20)
            .map((summary) => summary.sourceOwnerPackagePath),
    ),
  )
  checks.push(
    check(
      "current-module-audit.product-summaries.complete",
      stableStringify(actualProductSummaries) === stableStringify(expectedProductSummaries),
      "Each audited product must expose a stable summary of mismatch, behavior, exact-diff, fixture target, and dimension counts.",
      "error",
      audit.products.filter((product) => !actualProductSummaries.some((summary) => summary.product === product)),
    ),
  )
  checks.push(
    check(
      "current-module-audit.package-summaries.complete",
      stableStringify(actualPackageSummaries) === stableStringify(expectedPackageSummaries),
      "Each current package must expose a stable summary of source status, mismatch, exact-diff, fixture target, and dimension counts.",
      "error",
      audit.packageCatalog.filter((packagePath) => !actualPackageSummaries.some((summary) => summary.packagePath === packagePath)),
    ),
  )
  const missingSourceOwnedPackageSummaries = expectedPackageSummaries.filter((expected) => {
    if (expected.sourceOwnedItems === 0) return false
    const actual = actualPackageSummaries.find((summary) => summary.packagePath === expected.packagePath)
    return !actual || actual.sourceOwnedCurrentSourceFileCount === 0 || actual.sampleSourceOwnedCurrentSourceFiles.length === 0
  })
  checks.push(
    check(
      "current-module-audit.package-source-ownership.visible",
      missingSourceOwnedPackageSummaries.length === 0,
      "Packages that own current source files must expose source-owned item, source-file, exact-diff, and fixture-target summaries.",
      "error",
      missingSourceOwnedPackageSummaries.slice(0, 20).map((summary) => summary.packagePath),
    ),
  )
  checks.push(
    check(
      "current-module-audit.plane-summaries.complete",
      stableStringify(actualPlaneSummaries) === stableStringify(expectedPlaneSummaries),
      "Each current plane must expose a stable summary of source status, mismatch, exact-diff, fixture target, and dimension counts.",
      "error",
      uniqueStrings(audit.items.flatMap((item) => (item.plane ? [item.plane] : []))).filter((plane) => !actualPlaneSummaries.some((summary) => summary.plane === plane)),
    ),
  )
  const currentSourceFilesFromItems = uniqueStrings(audit.items.flatMap((item) => item.currentSourceFiles))
  const malformedCurrentSourceFileSummaries = actualCurrentSourceFileSummaries.filter((summary) => {
    const exactDiffCounts: Record<CurrentModuleBehaviorExactDiffStatus, number> = {
      "demotion-guard-only": summary.demotionGuardOnly ?? 0,
      "exact-diff-missing": summary.exactDiffMissing ?? 0,
      "exact-diff-partial": summary.exactDiffPartial ?? 0,
      "manual-check-pending": summary.manualCheckPending ?? 0,
    }
    return (
      !summary.currentSourceFile ||
      !summary.sourceOwnerPackagePath ||
      !summary.sourceOwnerPackageCatalogStatus ||
      !sourceOwnerPackageStatusMatchesCatalog(summary.sourceOwnerPackagePath, summary.sourceOwnerPackageCatalogStatus, audit.packageCatalog) ||
      !summary.moduleConfirmationStatus ||
      !summary.moduleConfirmationSummary ||
      summary.moduleConfirmationStatus !== moduleConfirmationStatusFromExactDiffCounts(exactDiffCounts) ||
      !summary.sourceVerificationStatus ||
      summary.itemIDs.length === 0 ||
      summary.itemCount !== summary.itemIDs.length ||
      summary.totalItems !== summary.itemIDs.length ||
      !summary.finding
    )
  })
  checks.push(
    check(
      "current-module-audit.current-source-file-summaries.complete",
      stableStringify(actualCurrentSourceFileSummaries) === stableStringify(expectedCurrentSourceFileSummaries) && malformedCurrentSourceFileSummaries.length === 0,
      "Each current source file referenced by audit items must expose a stable module summary with item IDs, source status, exact-diff, fixture target, and owner counts.",
      "error",
      currentSourceFilesFromItems.filter((sourceFile) => !actualCurrentSourceFileSummaries.some((summary) => summary.currentSourceFile === sourceFile)).slice(0, 20),
    ),
  )
  const unclassified = audit.items.filter((item) => !item.mismatchKind || !item.ownerTODO || !item.nextAction || !item.summary)
  checks.push(
    check(
      "current-module-audit.classification-complete",
      unclassified.length === 0,
      "Every audit item must have mismatch kind, owner TODO, next action, and summary.",
      "error",
      unclassified.slice(0, 12).map((item) => item.id),
    ),
  )
  const missingSourceVerification = audit.items.filter((item) => !item.sourceVerificationStatus)
  checks.push(
    check(
      "current-module-audit.source-verification-classified",
      missingSourceVerification.length === 0,
      "Every audit item must classify source verification status.",
      "error",
      missingSourceVerification.slice(0, 20).map((item) => item.id),
    ),
  )
  const missingCurrentSourceFiles = audit.items.filter((item) => item.currentSourceRefs.length > 0 && item.sourceVerificationStatus !== "manual-source-check-pending" && item.currentSourceFiles.length === 0)
  checks.push(
    check(
      "current-module-audit.current-source-files.mapped",
      missingCurrentSourceFiles.length === 0,
      "Items with current source refs must expose concrete current source files.",
      "error",
      missingCurrentSourceFiles.slice(0, 20).map((item) => item.id),
    ),
  )
  const manualPackageItemsWithoutEntrypoints = audit.items.filter(
    (item) =>
      item.kind === "package" &&
      item.packagePath !== undefined &&
      item.mismatchKind === "manual-source-check-required" &&
      manualPackageSourceForPackage(item.packagePath) !== undefined &&
      item.currentSourceFiles.length === 0,
  )
  checks.push(
    check(
      "current-module-audit.manual-package-entrypoints.mapped",
      manualPackageItemsWithoutEntrypoints.length === 0,
      "Package-level manual source checks must name concrete current source/API entrypoints.",
      "error",
      manualPackageItemsWithoutEntrypoints.slice(0, 20).map((item) => item.id),
    ),
  )
  const nativeComplete = audit.items.filter((item) => item.implementationLevel === "native")
  checks.push(
    check(
      "current-module-audit.native-requires-source-evidence",
      nativeComplete.every((item) => item.upstreamRefs.length > 0 && item.evidenceRefs.length > 0 && item.knownLossiness.length === 0),
      "Native items must carry upstream refs and evidence, and must not retain known lossiness.",
      "error",
      nativeComplete.filter((item) => item.upstreamRefs.length === 0 || item.evidenceRefs.length === 0 || item.knownLossiness.length > 0).map((item) => item.id),
    ),
  )
  const previewOrMetadataExecutableBindings = audit.items.filter(
    (item) => item.kind === "required-binding" && item.executableRequired && (item.implementationLevel === "preview-shell" || item.implementationLevel === "metadata-only"),
  )
  checks.push(
    check(
      "current-module-audit.preview-metadata-executable-bindings.none",
      previewOrMetadataExecutableBindings.length === 0,
      "Preview or metadata-only providers must not satisfy executable-required ports.",
      "warning",
      previewOrMetadataExecutableBindings.map((item) => item.id),
    ),
  )
  checks.push(
    check(
      "current-module-audit.open-work-visible",
      audit.summary.productNativeComplete < audit.summary.productAtomItems &&
        audit.summary.byMismatchKind["manual-source-check-required"] > 0 &&
        audit.summary.workQueueItems > 0,
      "Current audit must not overstate native completion; package-only source checks and demotion gates remain visible.",
    ),
  )
  const issues = checks.filter((item) => !item.ok && item.severity === "error")
  const warnings = checks.filter((item) => !item.ok && item.severity === "warning")
  return {
    ok: issues.length === 0,
    fingerprint: expectedFingerprint,
    checks,
    issues,
    warnings,
  }
}

export function writeCurrentModulePlaceholderAuditReports(input: {
  audit: CurrentModulePlaceholderAudit
  jsonPath?: string
  markdownPath?: string
}): void {
  if (input.jsonPath) {
    mkdirSync(dirname(input.jsonPath), { recursive: true })
    writeFileSync(input.jsonPath, `${JSON.stringify(input.audit, null, 2)}\n`, "utf8")
  }
  if (input.markdownPath) {
    mkdirSync(dirname(input.markdownPath), { recursive: true })
    writeFileSync(input.markdownPath, formatCurrentModulePlaceholderAuditMarkdown(input.audit), "utf8")
  }
}

export function formatCurrentModulePlaceholderAuditMarkdown(audit: CurrentModulePlaceholderAudit): string {
  const lines = [
    "# Current Module Placeholder Audit",
    "",
    `Generated: ${audit.generatedAt}`,
    `Fingerprint: ${audit.summary.fingerprint}`,
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Total items | ${audit.summary.totalItems} |`,
    `| Package items | ${audit.summary.packageItems} |`,
    `| Plane items | ${audit.summary.planeItems} |`,
    `| Product transition atoms | ${audit.summary.productAtomItems} |`,
    `| Required bindings | ${audit.summary.requiredBindingItems} |`,
    `| Product native complete | ${audit.summary.productNativeComplete} |`,
    `| Compile blockers | ${audit.summary.compileBlockers} |`,
    `| Preview-only bindings | ${audit.summary.previewOnlyBindings} |`,
    `| Lossy compatible bindings | ${audit.summary.lossyCompatibleBindings} |`,
    `| Preview/metadata executable bindings | ${audit.summary.previewOrMetadataExecutableBindings} |`,
    `| Manual source checks required | ${audit.summary.manualSourceCheckRequired} |`,
    `| Owner work queue items | ${audit.summary.workQueueItems} |`,
    `| Work queue covered divergence items | ${audit.summary.workQueueCoveredItems} |`,
    `| Source-file fixture queue items | ${audit.summary.sourceFileFixtureQueueItems} |`,
    `| Source-owner line-level summaries | ${audit.summary.sourceOwnerLineLevelSummaryItems} |`,
    `| Current source file summaries | ${audit.summary.currentSourceFileSummaryItems} |`,
    `| Upstream drift products | ${audit.summary.upstreamHeadDriftProducts} |`,
    `| Upstream drift items | ${audit.summary.upstreamHeadDriftItems} |`,
    `| Product-native exact fixture items | ${audit.summary.productNativeExactFixtureItems} |`,
    `| Semantic fixture items with lossiness | ${audit.summary.semanticFixtureItems} |`,
    "",
    "## Upstream Baselines",
    "",
    "| Product | Pinned | Latest checked HEAD | Drift | Alternate heads |",
    "| --- | --- | --- | --- | --- |",
  ]
  for (const baseline of audit.upstreamBaselines) {
    lines.push(
      `| ${baseline.product} | \`${baseline.pinnedRepo}@${baseline.pinnedRef}\` | \`${baseline.latestRepo}@${baseline.latestHead}\` (${baseline.checkedAt}) | ${baseline.driftStatus} | ${baseline.alternateLatestHeads.map((head) => `\`${head.relation}:${head.repo}@${head.head}\``).join("<br>") || "none"} |`,
    )
  }
  lines.push(
    "",
    "## Product Summaries",
    "",
    "| Product | Items | Atoms | Bindings | Native complete | Symbol anchors | Exact missing | Exact partial | Demotion guard | Manual | Top fixture targets |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  )
  for (const summary of audit.productSummaries) {
    lines.push(
      `| ${summary.product} | ${summary.totalItems} | ${summary.productAtomItems} | ${summary.requiredBindingItems} | ${summary.productNativeComplete} | ${summary.upstreamSourceSymbolMapped} | ${summary.exactDiffMissing} | ${summary.exactDiffPartial} | ${summary.demotionGuardOnly} | ${summary.manualCheckPending} | ${Object.entries(summary.byFixtureDiffTarget)
        .slice(0, 5)
        .map(([target, count]) => `\`${target}\` ${count}`)
        .join("<br>")} |`,
    )
  }
  lines.push(
    "",
    "## Package Summaries",
    "",
    "| Package | Items | Atoms | Bindings | Products | Planes | Source status | Exact missing | Exact partial | Demotion guard | Manual | Top fixture targets |",
    "| --- | ---: | ---: | ---: | --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
  )
  for (const summary of audit.packageSummaries) {
    lines.push(
      `| \`${summary.packagePath}\` | ${summary.totalItems} | ${summary.productAtomItems} | ${summary.requiredBindingItems} | ${summary.products.join("<br>") || "none"} | ${summary.planes.join("<br>") || "none"} | ${summary.packageSourceVerificationStatus} | ${summary.exactDiffMissing} | ${summary.exactDiffPartial} | ${summary.demotionGuardOnly} | ${summary.manualCheckPending} | ${Object.entries(summary.byFixtureDiffTarget)
        .slice(0, 5)
        .map(([target, count]) => `\`${target}\` ${count}`)
        .join("<br>") || "none"} |`,
    )
  }
  lines.push(
    "",
    "## Source-Owned Package Summaries",
    "",
    "| Package | Source-owned items | Source files | Products | Planes | Exact missing | Exact partial | Demotion guard | Manual | Top fixture targets | Sample source files |",
    "| --- | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |",
  )
  for (const summary of audit.packageSummaries.filter((entry) => entry.sourceOwnedItems > 0)) {
    lines.push(
      `| \`${summary.packagePath}\` | ${summary.sourceOwnedItems} | ${summary.sourceOwnedCurrentSourceFileCount} | ${summary.sourceOwnedProducts.join("<br>") || "none"} | ${summary.sourceOwnedPlanes.join("<br>") || "none"} | ${summary.sourceOwnedExactDiffMissing} | ${summary.sourceOwnedExactDiffPartial} | ${summary.sourceOwnedDemotionGuardOnly} | ${summary.sourceOwnedManualCheckPending} | ${Object.entries(summary.bySourceOwnedFixtureDiffTarget)
        .slice(0, 5)
        .map(([target, count]) => `\`${target}\` ${count}`)
        .join("<br>") || "none"} | ${summary.sampleSourceOwnedCurrentSourceFiles.map((sourceFile) => `\`${sourceFile}\``).join("<br>") || "none"} |`,
    )
  }
  lines.push(
    "",
    "## Source Owner Line-Level Summaries",
    "",
    "| Source owner | Owner status | Module status | Queue items | Divergence items | Source files | Line missing | Semantic partial | Demotion guard | Manual | Top fixture targets | Sample fixture targets | Sample negative gates |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |",
  )
  for (const summary of audit.sourceOwnerLineLevelSummaries) {
    lines.push(
      `| \`${summary.sourceOwnerPackagePath}\` | ${summary.sourceOwnerPackageCatalogStatus} | ${summary.moduleConfirmationStatus}<br>${summary.moduleConfirmationSummary} | ${summary.queueItems} | ${summary.itemCount} | ${summary.currentSourceFileCount} | ${summary.lineLevelDiffMissing} | ${summary.semanticFixtureNeedsExactDiff} | ${summary.demotionGuardOnly} | ${summary.manualAnchorNeeded} | ${Object.entries(summary.byFixtureDiffTarget)
        .slice(0, 5)
        .map(([target, count]) => `\`${target}\` ${count}`)
        .join("<br>") || "none"} | ${summary.sampleFixtureImplementationTargets.map((target) => `\`${target}\``).join("<br>") || "none"} | ${summary.sampleNegativeVerificationTargets.map((target) => `\`${target}\``).join("<br>") || "none"} |`,
    )
  }
  lines.push(
    "",
    "## Plane Summaries",
    "",
    "| Plane | Items | Atoms | Bindings | Packages | Source status | Exact missing | Exact partial | Demotion guard | Manual | Top fixture targets |",
    "| --- | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- |",
  )
  for (const summary of audit.planeSummaries) {
    lines.push(
      `| ${summary.plane} | ${summary.totalItems} | ${summary.productAtomItems} | ${summary.requiredBindingItems} | ${summary.packages.slice(0, 6).map((packagePath) => `\`${packagePath}\``).join("<br>") || "none"} | ${summary.planeSourceVerificationStatus} | ${summary.exactDiffMissing} | ${summary.exactDiffPartial} | ${summary.demotionGuardOnly} | ${summary.manualCheckPending} | ${Object.entries(summary.byFixtureDiffTarget)
        .slice(0, 5)
        .map(([target, count]) => `\`${target}\` ${count}`)
        .join("<br>") || "none"} |`,
    )
  }
  lines.push(
    "",
    "## Current Source File Summaries",
    "",
    "| Current source file | Source owner | Owner status | Module status | Items | Products | Planes | Source status | Exact missing | Exact partial | Demotion guard | Manual | Top fixture targets |",
    "| --- | --- | --- | --- | ---: | --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
  )
  for (const summary of audit.currentSourceFileSummaries) {
    lines.push(
      `| \`${summary.currentSourceFile}\` | \`${summary.sourceOwnerPackagePath}\` | ${summary.sourceOwnerPackageCatalogStatus} | ${summary.moduleConfirmationStatus}<br>${summary.moduleConfirmationSummary} | ${summary.totalItems} | ${summary.products.join("<br>") || "none"} | ${summary.planes.join("<br>") || "none"} | ${summary.sourceVerificationStatus} | ${summary.exactDiffMissing} | ${summary.exactDiffPartial} | ${summary.demotionGuardOnly} | ${summary.manualCheckPending} | ${Object.entries(summary.byFixtureDiffTarget)
        .slice(0, 5)
        .map(([target, count]) => `\`${target}\` ${count}`)
        .join("<br>") || "none"} |`,
    )
  }
  lines.push(
    "",
    "## Source File Fixture Queue",
    "",
	    "| Current source file | Source owner | Owner status | Fixture target | Status | Items | Products | Planes | Packages | Action |",
	    "| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |",
	  )
	  for (const item of audit.sourceFileFixtureQueue) {
	    lines.push(
	      `| \`${item.currentSourceFile}\` | \`${item.sourceOwnerPackagePath}\` | ${item.sourceOwnerPackageCatalogStatus} | \`${item.fixtureDiffTarget}\` | ${item.exactDiffStatus} / ${item.lineLevelDiffStatus} | ${item.itemCount} | ${item.products.join("<br>") || "shared"} | ${item.planes.join("<br>") || "no-plane"} | ${item.packages.slice(0, 6).map((packagePath) => `\`${packagePath}\``).join("<br>") || "none"} | ${item.action}<br>Fixture: \`${item.fixtureImplementationTarget}\`<br>Negative: \`${item.negativeVerificationTarget}\` |`,
	    )
	  }
  lines.push(
    "",
    "## Mismatch Kinds",
    "",
    "| Mismatch | Count |",
    "| --- | ---: |",
  )
  for (const [kind, count] of Object.entries(audit.summary.byMismatchKind).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(`| ${kind} | ${count} |`)
  }
  lines.push("", "## Implementation Levels", "", "| Level | Count |", "| --- | ---: |")
  for (const [level, count] of Object.entries(audit.summary.byImplementationLevel).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(`| ${level} | ${count} |`)
  }
  lines.push("", "## Package Findings", "", "| Package | Items | Finding |", "| --- | ---: | --- |")
  for (const item of audit.items.filter((candidate) => candidate.kind === "package")) {
    lines.push(`| \`${item.packagePath}\` | ${audit.summary.byPackage[item.packagePath ?? ""] ?? 0} | ${item.summary} |`)
  }
  lines.push("", "## Plane Findings", "", "| Plane | Items | Finding |", "| --- | ---: | --- |")
  for (const item of audit.items.filter((candidate) => candidate.kind === "plane")) {
    lines.push(`| ${item.plane} | ${audit.summary.byPlane[item.plane ?? ""] ?? 0} | ${item.summary} |`)
  }
  lines.push("", "## Upstream Drift Status", "", "| Status | Count |", "| --- | ---: |")
  for (const [status, count] of Object.entries(audit.summary.byUpstreamDriftStatus).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(`| ${status} | ${count} |`)
  }
  lines.push("", "## Upstream Source Status", "", "| Status | Count |", "| --- | ---: |")
  for (const [status, count] of Object.entries(audit.summary.byUpstreamSourceStatus).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(`| ${status} | ${count} |`)
  }
  lines.push("", "## Pinned Upstream Behavior Status", "", "| Status | Count |", "| --- | ---: |")
  for (const [status, count] of Object.entries(audit.summary.byPinnedUpstreamBehaviorStatus).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(`| ${status} | ${count} |`)
  }
  lines.push("", "## Pinned Upstream Divergence Kinds", "", "| Divergence | Count |", "| --- | ---: |")
  for (const [kind, count] of Object.entries(audit.summary.byPinnedUpstreamDivergenceKind).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(`| ${kind} | ${count} |`)
  }
  lines.push("", "## Behavior Exact Diff Status", "", "| Status | Divergences |", "| --- | ---: |")
  for (const [status, count] of Object.entries(audit.summary.byBehaviorExactDiffStatus).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(`| ${status} | ${count} |`)
  }
  lines.push("", "## Fixture Diff Targets", "", "| Fixture target | Divergences |", "| --- | ---: |")
  for (const [target, count] of Object.entries(audit.summary.byFixtureDiffTarget)) {
    lines.push(`| ${target} | ${count} |`)
  }
  lines.push("", "## Comparison Dimensions", "", "| Dimension | Divergences |", "| --- | ---: |")
  for (const [dimension, count] of Object.entries(audit.summary.byComparisonDimension).slice(0, 40)) {
    lines.push(`| ${dimension} | ${count} |`)
  }
  lines.push(
    "",
    "## Fixture Diff Queue",
    "",
    "| Fixture target | Status | Items | Products | Planes | Packages | Action |",
    "| --- | --- | ---: | --- | --- | --- | --- |",
  )
  for (const item of audit.fixtureDiffQueue) {
    lines.push(
      `| \`${item.fixtureDiffTarget}\` | ${item.exactDiffStatus} | ${item.itemCount} | ${item.products.join("<br>") || "shared"} | ${item.planes.join("<br>") || "no-plane"} | ${item.packages.slice(0, 6).map((packagePath) => `\`${packagePath}\``).join("<br>") || "none"} | ${item.action} |`,
    )
  }
  lines.push("", "## Work Queue Owners", "", "| Owner | Queue items |", "| --- | ---: |")
  for (const [owner, count] of Object.entries(audit.summary.byWorkQueueOwnerTODO).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(`| ${owner} | ${count} |`)
  }
  const divergenceTargetSummaries = new Map<
    string,
    {
      count: number
      requiredEvidence: string
      nextVerification: string
      exactDiffStatuses: string[]
      fixtureDiffTarget: string
      comparisonDimensions: string[]
      currentCoverage: string
      upstreamAnchor: string
      currentAnchor: string
    }
  >()
  for (const item of audit.items) {
    for (const divergence of item.pinnedUpstreamDivergences) {
      const existing = divergenceTargetSummaries.get(divergence.kind)
      if (existing) {
        existing.count += 1
        const upstreamAnchor = preferredAnchorRef(divergence.upstreamAnchorRefs, "upstream:")
        const currentAnchor = preferredAnchorRef(divergence.currentAnchorRefs, "current:")
        if ((existing.upstreamAnchor === "-" || !existing.upstreamAnchor.startsWith("upstream:")) && upstreamAnchor) existing.upstreamAnchor = upstreamAnchor
        if ((existing.currentAnchor === "-" || !existing.currentAnchor.startsWith("current:")) && currentAnchor) existing.currentAnchor = currentAnchor
        existing.exactDiffStatuses.push(divergence.exactDiffStatus)
        existing.comparisonDimensions.push(...divergence.comparisonDimensions)
        continue
      }
      divergenceTargetSummaries.set(divergence.kind, {
        count: 1,
        requiredEvidence: divergence.requiredEvidence,
        nextVerification: divergence.nextVerification,
        exactDiffStatuses: [divergence.exactDiffStatus],
        fixtureDiffTarget: divergence.fixtureDiffTarget,
        comparisonDimensions: [...divergence.comparisonDimensions],
        currentCoverage: divergence.currentCoverage,
        upstreamAnchor: preferredAnchorRef(divergence.upstreamAnchorRefs, "upstream:") ?? "-",
        currentAnchor: preferredAnchorRef(divergence.currentAnchorRefs, "current:") ?? "-",
      })
    }
  }
  lines.push(
    "",
    "## Pinned Divergence Verification Targets",
    "",
    "| Divergence | Count | Exact Diff | Fixture Target | Dimensions | Required Evidence | Next Verification | Upstream Anchor Sample | Current Anchor Sample |",
    "| --- | ---: | --- | --- | --- | --- | --- | --- | --- |",
  )
  for (const [kind, target] of Array.from(divergenceTargetSummaries.entries()).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(
      `| ${kind} | ${target.count} | ${uniqueStrings(target.exactDiffStatuses).join("<br>")} | ${target.fixtureDiffTarget} | ${uniqueStrings(target.comparisonDimensions).slice(0, 6).join("<br>")} | ${target.requiredEvidence} | ${target.nextVerification} | \`${target.upstreamAnchor}\` | \`${target.currentAnchor}\` |`,
    )
  }
  lines.push(
    "",
    "## Owner Work Queue",
    "",
    "| Owner | Priority | Product | Plane | Divergence | Items | Exact Diff | Fixture Targets | Dimensions | Required Evidence | Next Verification | Sample Items |",
    "| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |",
  )
  for (const item of audit.workQueue.slice(0, 120)) {
    lines.push(
      `| ${item.ownerTODO} | ${item.priority} | ${item.products.join(", ") || "-"} | ${item.planes.join(", ") || "-"} | ${item.divergenceKind} | ${item.itemCount} | ${item.exactDiffStatuses.join("<br>")} | ${item.fixtureDiffTargets.slice(0, 3).join("<br>")} | ${item.comparisonDimensions.slice(0, 6).join("<br>")} | ${item.requiredEvidence} | ${item.nextVerification} | ${item.itemIDs.slice(0, 3).map((id) => `\`${id}\``).join("<br>")} |`,
    )
  }
  lines.push("", "## Source Verification Status", "", "| Status | Count |", "| --- | ---: |")
  for (const [status, count] of Object.entries(audit.summary.bySourceVerificationStatus).sort((left, right) => left[0].localeCompare(right[0]))) {
    lines.push(`| ${status} | ${count} |`)
  }
  lines.push("", "## Upstream Source Samples", "", "| Product | Plane | Repo/ref | Paths | Symbols |", "| --- | --- | --- | --- | --- |")
  for (const item of audit.items.filter((candidate) => candidate.kind === "plane" && candidate.upstreamSourceLocations.length > 0).slice(0, 80)) {
    const grouped = item.upstreamSourceLocations.slice(0, 8)
    lines.push(
      `| ${item.upstreamSourceLocations.map((location) => location.product).filter((product, index, products) => products.indexOf(product) === index).join(", ")} | ${item.plane} | ${grouped.map((location) => `\`${location.repo}@${location.ref.slice(0, 12)}\``).join("<br>")} | ${grouped.map((location) => `\`${location.path}\``).join("<br>")} | ${grouped.map((location) => location.symbols.join(", ") || "-").join("<br>")} |`,
    )
  }
  lines.push("", "## Product Transition Atoms", "", "| Product | Atom | Plane | Level | Drift | Upstream Source | Pinned Behavior | Divergence | Source Status | Mismatch | Owner | Next Action |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
  for (const item of audit.items.filter((candidate) => candidate.kind === "product-atom").slice(0, 160)) {
    lines.push(`| ${item.product} | \`${item.atomID}\` | ${item.plane} | ${item.implementationLevel} | ${item.upstreamDriftStatus} | ${item.upstreamSourceStatus} | ${item.pinnedUpstreamBehaviorStatus} | ${divergenceKindsForMarkdown(item)} | ${item.sourceVerificationStatus} | ${item.mismatchKind} | ${item.ownerTODO} | ${item.nextAction} |`)
  }
  lines.push("", "## Required Binding Risks", "", "| Product | Port | Provider | Level | Executable | Risk | Compile | Upstream Source | Pinned Behavior | Divergence | Source Status | Mismatch | Owner |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
  for (const item of audit.items.filter((candidate) => candidate.kind === "required-binding" && candidate.mismatchKind !== "common-shared-not-product-native").slice(0, 160)) {
    lines.push(`| ${item.product} | \`${item.portID}\` | \`${item.atomID}\` | ${item.implementationLevel} | ${item.executableRequired ? "yes" : "no"} | ${item.bindingRisk ?? ""} | ${item.compileStatus ?? ""} | ${item.upstreamSourceStatus} | ${item.pinnedUpstreamBehaviorStatus} | ${divergenceKindsForMarkdown(item)} | ${item.sourceVerificationStatus} | ${item.mismatchKind} | ${item.ownerTODO} |`)
  }
  lines.push("")
  return `${lines.join("\n")}\n`
}

function packageSummaryItems(contracts: AssemblyContract[], inventory: Todo27NativeRewriteInventory, atomByProductAndID: Map<string, AssemblyContractAtom>): CurrentModulePlaceholderAuditItem[] {
  return packageCatalog.map((packagePath) => {
    const atoms = contracts.flatMap((contract) => contract.atoms.filter((atom) => packagePathForAtom(atom) === packagePath))
    const transitions = inventory.items.filter((item) => packagePathForInventoryItem(item, contracts) === packagePath)
    const manualPackageSource = manualPackageSourceForPackage(packagePath)
    const transitionProducts = uniqueProducts(transitions.map((item) => item.product))
    const transitionPlanes = uniquePlanes(transitions.map((item) => item.plane))
    const allUpstreamSourceLocations = upstreamSourceLocationsForProductsAndPlanes(transitionProducts, transitionPlanes)
    const bridge = atoms.filter((atom) => atom.implementationKind === "bridge").length
    const preview = atoms.filter((atom) => atom.implementationKind === "preview").length
    const metadata = atoms.filter((atom) => atom.implementationKind === "metadata-only").length
    const transitionImplementationLevel = executableLevelForTransitionItems(transitions)
    const mismatchKind: CurrentModuleMismatchKind =
      transitions.length > 0
        ? mismatchForTransitionItems(transitions)
        : atoms.length === 0
          ? "manual-source-check-required"
          : bridge > 0
            ? "compatible-bridge"
            : preview > 0
              ? "preview-only"
              : metadata > 0
                ? "metadata-only"
                : "common-shared-not-product-native"
    const sourceVerificationStatus =
      transitions.length > 0
        ? sourceVerificationStatusForTransitions(transitions, atomByProductAndID)
        : (manualPackageSource?.sourceVerificationStatus ?? sourceVerificationStatusForPackage(atoms, transitions.length, manualPackageSource))
    const knownLossiness = transitions.length > 0 ? uniqueStrings(transitions.flatMap((item) => item.knownLossiness)) : uniqueStrings(atoms.flatMap((atom) => atom.knownLossiness))
    const evidenceRefs = uniqueStrings([...atoms.map((atom) => `assembly-atom:${atom.id}`), ...(manualPackageSource?.evidenceRefs ?? [])])
    const currentSourceRefs = uniqueStrings([...atoms.map((atom) => sourceRefForAtom(atom)), ...(manualPackageSource?.currentSourceRefs ?? [])])
    const currentSourcePaths = uniqueStrings([...atoms.map((atom) => currentSourcePathForAtom(atom)), ...(manualPackageSource?.currentSourcePaths ?? [])])
    const currentSourceFiles = uniqueStrings([...atoms.flatMap((atom) => currentSourceFilesForAtom(atom)), ...(manualPackageSource?.currentSourceFiles ?? [])])
    const pinnedUpstreamBehaviorStatus =
      manualPackageSource?.pinnedUpstreamBehaviorStatus ??
      pinnedBehaviorStatusForFacts({
        productScoped: transitionProducts.length > 0,
        mismatchKind,
        sourceVerificationStatus,
        ...(transitionImplementationLevel ? { implementationLevel: transitionImplementationLevel } : {}),
        knownLossiness,
      })
    const divergenceTransitions = transitionItemsForSummaryDivergence(transitions, pinnedUpstreamBehaviorStatus, atomByProductAndID)
    const upstreamSourceLocations =
      divergenceTransitions.length > 0 ? upstreamSourceLocationsForProductsAndPlanes(uniqueProducts(divergenceTransitions.map((item) => item.product)), transitionPlanes) : allUpstreamSourceLocations
    const divergenceEvidenceRefs =
      divergenceTransitions.length > 0 ? uniqueStrings(divergenceTransitions.map((item) => `todo27:${item.product}:${item.atomID}`)) : evidenceRefs
    return {
      kind: "package",
      id: `package:${packagePath}`,
      packagePath,
      mismatchKind,
      evidenceStrength: atoms.length > 0 ? "assembly-contract" : "manual-pending",
      upstreamDriftStatus: aggregateUpstreamDriftStatus(transitions.map((item) => item.product)),
      upstreamSourceStatus: upstreamSourceStatusForLocations(transitionProducts, upstreamSourceLocations),
      pinnedUpstreamBehaviorStatus,
      pinnedUpstreamDivergences: pinnedDivergencesForFacts({
        behaviorStatus: pinnedUpstreamBehaviorStatus,
        kind: "package",
        plane: transitionPlanes[0],
        mismatchKind,
        implementationLevel: transitionImplementationLevel ?? executableLevelForMixedAtoms(atoms),
        sourceVerificationStatus,
        knownLossiness,
        evidenceRefs: divergenceEvidenceRefs,
        upstreamSourceLocations,
        currentSourceRefs,
        currentSourcePaths,
        currentSourceFiles,
        overrideDivergenceKind: manualPackageSource?.divergenceKind,
        overrideUpstreamAnchorRefs: manualPackageSource?.upstreamAnchorRefs,
        packagePath,
        itemID: `package:${packagePath}`,
      }),
      upstreamSourceLocations,
      upstreamBaselineRefs: upstreamBaselineRefsForProducts(transitions.map((item) => item.product)),
      upstreamRefs: [],
      currentSourceRefs,
      currentSourcePaths,
      currentSourceFiles,
      sourceVerificationStatus,
      evidenceRefs,
      knownLossiness,
      ownerTODO: "TODO-029",
      nextAction:
        atoms.length > 0
          ? "Confirm package atoms against upstream source paths and preserve current bridge/metadata labels."
          : (manualPackageSource?.nextAction ?? "Inspect package API directly; assembly contracts do not select atoms from this package."),
      summary:
        atoms.length === 0
          ? (manualPackageSource?.summary ?? "No selected atom appears in current product assembly contracts; manual source/API check is still required.")
          : `Assembly contributes ${atoms.length} atom occurrences (${bridge} bridge, ${preview} preview, ${metadata} metadata); ${transitions.length} product transition atoms need source-level confirmation.`,
    }
  })
}

function planeSummaryItems(contracts: AssemblyContract[], inventory: Todo27NativeRewriteInventory, atomByProductAndID: Map<string, AssemblyContractAtom>): CurrentModulePlaceholderAuditItem[] {
  const planes = uniqueStrings(contracts.flatMap((contract) => contract.atoms.map((atom) => atom.plane))) as AssemblyContractPlane[]
  return planes.map((plane) => {
    const atoms = contracts.flatMap((contract) => contract.atoms.filter((atom) => atom.plane === plane))
    const transitions = inventory.items.filter((item) => item.plane === plane)
    const transitionProducts = uniqueProducts(transitions.map((item) => item.product))
    const allUpstreamSourceLocations = upstreamSourceLocationsForProductsAndPlanes(transitionProducts, [plane])
    const transitionImplementationLevel = executableLevelForTransitionItems(transitions)
    const mismatchKind: CurrentModuleMismatchKind = transitions.length > 0 ? mismatchForTransitionItems(transitions) : "common-shared-not-product-native"
    const sourceVerificationStatus = transitions.length > 0 ? sourceVerificationStatusForTransitions(transitions, atomByProductAndID) : sourceVerificationStatusForPackage(atoms, transitions.length)
    const knownLossiness = uniqueStrings(transitions.flatMap((item) => item.knownLossiness))
    const evidenceRefs = uniqueStrings(transitions.map((item) => `todo27:${item.product}:${item.atomID}`))
    const currentSourceRefs = uniqueStrings(atoms.map((atom) => sourceRefForAtom(atom)))
    const currentSourcePaths = uniqueStrings(atoms.map((atom) => currentSourcePathForAtom(atom)))
    const currentSourceFiles = uniqueStrings(atoms.flatMap((atom) => currentSourceFilesForAtom(atom)))
    const pinnedUpstreamBehaviorStatus = pinnedBehaviorStatusForFacts({
      productScoped: transitionProducts.length > 0,
      mismatchKind,
      sourceVerificationStatus,
      ...(transitionImplementationLevel ? { implementationLevel: transitionImplementationLevel } : {}),
      knownLossiness,
    })
    const divergenceTransitions = transitionItemsForSummaryDivergence(transitions, pinnedUpstreamBehaviorStatus, atomByProductAndID)
    const upstreamSourceLocations =
      divergenceTransitions.length > 0 ? upstreamSourceLocationsForProductsAndPlanes(uniqueProducts(divergenceTransitions.map((item) => item.product)), [plane]) : allUpstreamSourceLocations
    const divergenceEvidenceRefs =
      divergenceTransitions.length > 0 ? uniqueStrings(divergenceTransitions.map((item) => `todo27:${item.product}:${item.atomID}`)) : evidenceRefs
    return {
      kind: "plane",
      id: `plane:${plane}`,
      plane,
      mismatchKind,
      evidenceStrength: "assembly-contract",
      upstreamDriftStatus: aggregateUpstreamDriftStatus(transitions.map((item) => item.product)),
      upstreamSourceStatus: upstreamSourceStatusForLocations(transitionProducts, upstreamSourceLocations),
      pinnedUpstreamBehaviorStatus,
      pinnedUpstreamDivergences: pinnedDivergencesForFacts({
        behaviorStatus: pinnedUpstreamBehaviorStatus,
        kind: "plane",
        plane,
        mismatchKind,
        implementationLevel: transitionImplementationLevel ?? executableLevelForMixedAtoms(atoms),
        sourceVerificationStatus,
        knownLossiness,
        evidenceRefs: divergenceEvidenceRefs,
        upstreamSourceLocations,
        currentSourceRefs,
        currentSourcePaths,
        currentSourceFiles,
        itemID: `plane:${plane}`,
      }),
      upstreamSourceLocations,
      upstreamBaselineRefs: upstreamBaselineRefsForProducts(transitions.map((item) => item.product)),
      upstreamRefs: uniqueStrings(transitions.flatMap((item) => item.upstreamRefs)),
      currentSourceRefs,
      currentSourcePaths,
      currentSourceFiles,
      sourceVerificationStatus,
      evidenceRefs,
      knownLossiness,
      ownerTODO: transitions.length > 0 ? "TODO-027" : "TODO-029",
      nextAction: transitions.length > 0 ? "Compare every product-scoped atom in this plane against upstream source and fixture behavior." : "Confirm common plane contract remains product-neutral and does not overclaim upstream parity.",
      summary:
        transitions.length > 0
          ? `${plane} has ${transitions.length} product transition atoms requiring source-level confirmation.`
          : `${plane} currently has no product transition atom in TODO-027 inventory, but common contract coverage still needs neutrality review.`,
    }
  })
}

function productAtomItem(item: Todo27NativeRewriteInventoryItem, atomByProductAndID: Map<string, AssemblyContractAtom>): CurrentModulePlaceholderAuditItem {
  const atom = atomByProductAndID.get(`${item.product}:${item.atomID}`)
  const packagePath = atom ? packagePathForAtom(atom) : packagePathForInventoryItem(item)
  const upstreamSourceLocations = upstreamSourceLocationsForProductAtom(item.product, item.plane, item.atomID)
  const mismatchKind = mismatchForImplementationLevel(item.implementationLevel)
  const sourceVerificationStatus = sourceVerificationStatusForAtom(item.implementationLevel, item.knownLossiness, item.nativeEvidenceRefs, item.fixtureIDs, atom)
  const evidenceRefs = uniqueStrings(item.nativeEvidenceRefs.map((ref) => `native-evidence:${ref}`).concat(item.fixtureIDs.map((id) => `fixture:${id}`)))
  const knownLossiness = uniqueStrings(item.knownLossiness)
  const currentSourceRefs = atom ? [sourceRefForAtom(atom)] : []
  const currentSourcePaths = atom ? [currentSourcePathForAtom(atom)] : []
  const currentSourceFiles = atom ? currentSourceFilesForAtom(atom) : []
  const pinnedUpstreamBehaviorStatus = pinnedBehaviorStatusForFacts({
    productScoped: true,
    mismatchKind,
    sourceVerificationStatus,
    implementationLevel: item.implementationLevel,
    knownLossiness,
  })
  return {
    kind: "product-atom",
    id: `atom:${item.product}:${item.atomID}`,
    product: item.product,
    ...(packagePath ? { packagePath } : {}),
    plane: item.plane,
    atomID: item.atomID,
    selected: item.selected,
    ...(atom?.implementationKind ? { implementationKind: atom.implementationKind } : {}),
    implementationLevel: item.implementationLevel,
    parityCoverage: item.parityCoverage,
    mismatchKind,
    evidenceStrength: "todo27-inventory",
    upstreamDriftStatus: upstreamDriftStatusForProduct(item.product),
    upstreamSourceStatus: upstreamSourceStatusForLocations([item.product], upstreamSourceLocations),
    pinnedUpstreamBehaviorStatus,
    pinnedUpstreamDivergences: pinnedDivergencesForFacts({
      behaviorStatus: pinnedUpstreamBehaviorStatus,
      kind: "product-atom",
      plane: item.plane,
      atomID: item.atomID,
      mismatchKind,
      implementationLevel: item.implementationLevel,
      sourceVerificationStatus,
      knownLossiness,
      evidenceRefs,
      upstreamSourceLocations,
      currentSourceRefs,
      currentSourcePaths,
      currentSourceFiles,
      packagePath,
      itemID: `atom:${item.product}:${item.atomID}`,
    }),
    upstreamSourceLocations,
    upstreamBaselineRefs: upstreamBaselineRefsForProduct(item.product),
    upstreamRefs: uniqueStrings(item.upstreamRefs),
    currentSourceRefs,
    currentSourcePaths,
    currentSourceFiles,
    sourceVerificationStatus,
    evidenceRefs,
    knownLossiness,
    ownerTODO: item.disposition === "metadata-retained" ? "TODO-028" : "TODO-027",
    nextAction: nextActionForMismatch(mismatchKind),
    summary: item.blocker,
  }
}

function requiredBindingItem(item: ExecutablePlaceholderAuditItem, atomByProductAndID: Map<string, AssemblyContractAtom>): CurrentModulePlaceholderAuditItem {
  const atom = atomByProductAndID.get(`${item.product}:${item.selectedAtomID}`)
  const upstreamSourceLocations =
    isCurrentModuleAuditProduct(item.product) && atom ? upstreamSourceLocationsForProductAtom(item.product, atom.plane, item.selectedAtomID) : []
  const mismatchKind = mismatchForBinding(item)
  const sourceVerificationStatus = sourceVerificationStatusForAtom(item.implementationLevel, item.knownLossiness, item.nativeEvidenceRefs, item.fixtureIDs, atom)
  const evidenceRefs = uniqueStrings(item.evidenceRefs)
  const knownLossiness = uniqueStrings(item.knownLossiness)
  const currentSourceRefs = atom ? [sourceRefForAtom(atom)] : []
  const currentSourcePaths = atom ? [currentSourcePathForAtom(atom), `binding:${item.portID}->${item.selectedAtomID}`] : [`binding:${item.portID}->${item.selectedAtomID}`]
  const currentSourceFiles = atom ? currentSourceFilesForAtom(atom) : []
  const pinnedUpstreamBehaviorStatus = pinnedBehaviorStatusForFacts({
    productScoped: isCurrentModuleAuditProduct(item.product),
    mismatchKind,
    sourceVerificationStatus,
    implementationLevel: item.implementationLevel,
    knownLossiness,
  })
  return {
    kind: "required-binding",
    id: `binding:${item.product}:${item.portID}:${item.selectedAtomID}`,
    product: item.product,
    ...(atom ? { packagePath: packagePathForAtom(atom), plane: atom.plane } : {}),
    atomID: item.selectedAtomID,
    portID: item.portID,
    implementationKind: item.implementationKind,
    implementationLevel: item.implementationLevel,
    parityCoverage: item.parityCoverage,
    mismatchKind,
    evidenceStrength: "executable-audit",
    upstreamDriftStatus: upstreamDriftStatusForProduct(item.product),
    upstreamSourceStatus: upstreamSourceStatusForLocations(isCurrentModuleAuditProduct(item.product) ? [item.product] : [], upstreamSourceLocations),
    pinnedUpstreamBehaviorStatus,
    pinnedUpstreamDivergences: pinnedDivergencesForFacts({
      behaviorStatus: pinnedUpstreamBehaviorStatus,
      kind: "required-binding",
      plane: atom?.plane,
      atomID: item.selectedAtomID,
      portID: item.portID,
      mismatchKind,
      implementationLevel: item.implementationLevel,
      sourceVerificationStatus,
      knownLossiness,
      evidenceRefs,
      upstreamSourceLocations,
      currentSourceRefs,
      currentSourcePaths,
      currentSourceFiles,
      packagePath: atom ? packagePathForAtom(atom) : undefined,
      itemID: `binding:${item.product}:${item.portID}:${item.selectedAtomID}`,
    }),
    upstreamSourceLocations,
    upstreamBaselineRefs: upstreamBaselineRefsForProduct(item.product),
    upstreamRefs: uniqueStrings(item.nativeSourceRefs),
    currentSourceRefs,
    currentSourcePaths,
    currentSourceFiles,
    sourceVerificationStatus,
    evidenceRefs,
    knownLossiness,
    executableRequired: item.executableRequired,
    bindingRisk: item.risk,
    compileStatus: item.compileStatus,
    ownerTODO: item.ownerTODO,
    nextAction: item.expectedResolution,
    summary: item.gapSummary,
  }
}

function buildProductSummaries(
  products: CurrentModulePlaceholderAuditProduct[],
  items: CurrentModulePlaceholderAuditItem[],
): CurrentModulePlaceholderAuditProductSummary[] {
  return products.map((product) => {
    const productItems = items.filter((item) => item.product === product)
    const exactDiffStatusCounts = countDivergenceExactDiffStatuses(productItems)
    const sourceStatusCounts = countByKnown(productItems, (item) => item.upstreamSourceStatus, [
      "not-product-scoped",
      "pinned-source-path-mapped",
      "pinned-source-symbol-mapped",
      "upstream-baseline-only",
    ])
    return {
      product,
      totalItems: productItems.length,
      productAtomItems: productItems.filter((item) => item.kind === "product-atom").length,
      requiredBindingItems: productItems.filter((item) => item.kind === "required-binding").length,
      transitionAtoms: productItems.filter((item) => item.kind === "product-atom").length,
      selectedTransitionAtoms: productItems.filter((item) => item.kind === "product-atom" && item.selected).length,
      productNativeComplete: productItems.filter((item) => item.kind === "product-atom" && item.implementationLevel === "native").length,
      pinnedBehindLatestHead: productItems.filter((item) => item.upstreamDriftStatus === "pinned-behind-latest-head").length,
      upstreamSourceSymbolMapped: sourceStatusCounts["pinned-source-symbol-mapped"],
      upstreamSourcePathMapped: sourceStatusCounts["pinned-source-path-mapped"],
      exactDiffMissing: exactDiffStatusCounts["exact-diff-missing"],
      exactDiffPartial: exactDiffStatusCounts["exact-diff-partial"],
      demotionGuardOnly: exactDiffStatusCounts["demotion-guard-only"],
      manualCheckPending: exactDiffStatusCounts["manual-check-pending"],
      byMismatchKind: countByKnown(productItems, (item) => item.mismatchKind, [
        "common-shared-not-product-native",
        "compatible-bridge",
        "profile-compatible-common-runner",
        "native-like-projection",
        "preview-only",
        "metadata-only",
        "lossy-compatible-binding",
        "manual-source-check-required",
        "upstream-head-drift-unchecked",
      ]),
    byPinnedUpstreamBehaviorStatus: countByKnown(productItems, (item) => item.pinnedUpstreamBehaviorStatus, [
        ...pinnedBehaviorStatusKeys,
      ]),
      byPinnedUpstreamDivergenceKind: countDivergencesByKnown(productItems, pinnedDivergenceKindKeys),
      byFixtureDiffTarget: countDivergenceFixtureTargets(productItems),
      byComparisonDimension: countDivergenceComparisonDimensions(productItems),
    }
  })
}

function buildPackageSummaries(
  packages: readonly string[],
  items: CurrentModulePlaceholderAuditItem[],
): CurrentModulePlaceholderAuditPackageSummary[] {
  return packages.map((packagePath) => {
    const packageItems = items.filter((item) => item.packagePath === packagePath)
    const sourceOwnedItems = items.filter((item) => item.currentSourceFiles.some((sourceFile) => currentSourceFileBelongsToPackage(sourceFile, packagePath)))
    const packageItem = packageItems.find((item) => item.kind === "package")
    const exactDiffStatusCounts = countDivergenceExactDiffStatuses(packageItems)
    const sourceOwnedExactDiffStatusCounts = countDivergenceExactDiffStatuses(sourceOwnedItems)
    const sourceStatusCounts = countByKnown(packageItems, (item) => item.upstreamSourceStatus, [
      "not-product-scoped",
      "pinned-source-path-mapped",
      "pinned-source-symbol-mapped",
      "upstream-baseline-only",
    ])
    const sourceVerificationCounts = countByKnown(packageItems, (item) => item.sourceVerificationStatus, [
      "manual-source-check-pending",
      "metadata-overlay-source",
      "preview-only-source",
      "product-native-exact-fixture",
      "semantic-fixture-with-lossiness",
      "source-mapped-no-exact-fixture",
    ])
    const currentSourceFiles = uniqueStrings(packageItems.flatMap((item) => item.currentSourceFiles))
    const sourceOwnedCurrentSourceFiles = uniqueStrings(
      sourceOwnedItems.flatMap((item) => item.currentSourceFiles.filter((sourceFile) => currentSourceFileBelongsToPackage(sourceFile, packagePath))),
    )
    return {
      packagePath,
      finding: packageItem?.summary ?? "Package is present in the catalog but has no direct audit item.",
      packageMismatchKind: packageItem?.mismatchKind ?? "manual-source-check-required",
      packagePinnedUpstreamBehaviorStatus: packageItem?.pinnedUpstreamBehaviorStatus ?? "manual-behavior-check-pending",
      packageSourceVerificationStatus: packageItem?.sourceVerificationStatus ?? "manual-source-check-pending",
      totalItems: packageItems.length,
      packageItems: packageItems.filter((item) => item.kind === "package").length,
      productAtomItems: packageItems.filter((item) => item.kind === "product-atom").length,
      requiredBindingItems: packageItems.filter((item) => item.kind === "required-binding").length,
      products: uniqueStrings(packageItems.flatMap((item) => (item.product ? [item.product] : []))).sort(),
      planes: uniqueStrings(packageItems.flatMap((item) => (item.plane ? [item.plane] : []))).sort(),
      selectedTransitionAtoms: packageItems.filter((item) => item.kind === "product-atom" && item.selected).length,
      productNativeComplete: packageItems.filter((item) => item.kind === "product-atom" && item.implementationLevel === "native").length,
      pinnedBehindLatestHead: packageItems.filter((item) => item.upstreamDriftStatus === "pinned-behind-latest-head").length,
      upstreamSourceSymbolMapped: sourceStatusCounts["pinned-source-symbol-mapped"],
      upstreamSourcePathMapped: sourceStatusCounts["pinned-source-path-mapped"],
      exactDiffMissing: exactDiffStatusCounts["exact-diff-missing"],
      exactDiffPartial: exactDiffStatusCounts["exact-diff-partial"],
      demotionGuardOnly: exactDiffStatusCounts["demotion-guard-only"],
      manualCheckPending: exactDiffStatusCounts["manual-check-pending"],
      currentSourceFileCount: currentSourceFiles.length,
      sampleCurrentSourceFiles: currentSourceFiles.slice(0, 8),
      sourceOwnedItems: sourceOwnedItems.length,
      sourceOwnedProductAtomItems: sourceOwnedItems.filter((item) => item.kind === "product-atom").length,
      sourceOwnedRequiredBindingItems: sourceOwnedItems.filter((item) => item.kind === "required-binding").length,
      sourceOwnedProducts: uniqueStrings(sourceOwnedItems.flatMap((item) => (item.product ? [item.product] : []))).sort(),
      sourceOwnedPlanes: uniqueStrings(sourceOwnedItems.flatMap((item) => (item.plane ? [item.plane] : []))).sort(),
      sourceOwnedExactDiffMissing: sourceOwnedExactDiffStatusCounts["exact-diff-missing"],
      sourceOwnedExactDiffPartial: sourceOwnedExactDiffStatusCounts["exact-diff-partial"],
      sourceOwnedDemotionGuardOnly: sourceOwnedExactDiffStatusCounts["demotion-guard-only"],
      sourceOwnedManualCheckPending: sourceOwnedExactDiffStatusCounts["manual-check-pending"],
      sourceOwnedCurrentSourceFileCount: sourceOwnedCurrentSourceFiles.length,
      sampleSourceOwnedCurrentSourceFiles: sourceOwnedCurrentSourceFiles.slice(0, 8),
      byMismatchKind: countByKnown(packageItems, (item) => item.mismatchKind, [
        "common-shared-not-product-native",
        "compatible-bridge",
        "profile-compatible-common-runner",
        "native-like-projection",
        "preview-only",
        "metadata-only",
        "lossy-compatible-binding",
        "manual-source-check-required",
        "upstream-head-drift-unchecked",
      ]),
      byImplementationLevel: countBy(packageItems.filter((item) => item.implementationLevel), (item) => item.implementationLevel ?? ""),
      byPinnedUpstreamBehaviorStatus: countByKnown(packageItems, (item) => item.pinnedUpstreamBehaviorStatus, pinnedBehaviorStatusKeys),
      byPinnedUpstreamDivergenceKind: countDivergencesByKnown(packageItems, pinnedDivergenceKindKeys),
      bySourceVerificationStatus: sourceVerificationCounts,
      byFixtureDiffTarget: countDivergenceFixtureTargets(packageItems),
      bySourceOwnedFixtureDiffTarget: countDivergenceFixtureTargets(sourceOwnedItems),
      byComparisonDimension: countDivergenceComparisonDimensions(packageItems),
    }
  })
}

function buildPlaneSummaries(items: CurrentModulePlaceholderAuditItem[]): CurrentModulePlaceholderAuditPlaneSummary[] {
  const planes = uniqueStrings(items.flatMap((item) => (item.plane ? [item.plane] : []))).sort() as AssemblyContractPlane[]
  return planes.map((plane) => {
    const planeItems = items.filter((item) => item.plane === plane)
    const planeItem = planeItems.find((item) => item.kind === "plane")
    const exactDiffStatusCounts = countDivergenceExactDiffStatuses(planeItems)
    const sourceStatusCounts = countByKnown(planeItems, (item) => item.upstreamSourceStatus, [
      "not-product-scoped",
      "pinned-source-path-mapped",
      "pinned-source-symbol-mapped",
      "upstream-baseline-only",
    ])
    const sourceVerificationCounts = countByKnown(planeItems, (item) => item.sourceVerificationStatus, [
      "manual-source-check-pending",
      "metadata-overlay-source",
      "preview-only-source",
      "product-native-exact-fixture",
      "semantic-fixture-with-lossiness",
      "source-mapped-no-exact-fixture",
    ])
    const currentSourceFiles = uniqueStrings(planeItems.flatMap((item) => item.currentSourceFiles))
    return {
      plane,
      finding: planeItem?.summary ?? "Plane is present in item-level audit records but has no direct plane audit item.",
      planeMismatchKind: planeItem?.mismatchKind ?? "manual-source-check-required",
      planePinnedUpstreamBehaviorStatus: planeItem?.pinnedUpstreamBehaviorStatus ?? "manual-behavior-check-pending",
      planeSourceVerificationStatus: planeItem?.sourceVerificationStatus ?? "manual-source-check-pending",
      totalItems: planeItems.length,
      planeItems: planeItems.filter((item) => item.kind === "plane").length,
      productAtomItems: planeItems.filter((item) => item.kind === "product-atom").length,
      requiredBindingItems: planeItems.filter((item) => item.kind === "required-binding").length,
      products: uniqueStrings(planeItems.flatMap((item) => (item.product ? [item.product] : []))).sort(),
      packages: uniqueStrings(planeItems.flatMap((item) => (item.packagePath ? [item.packagePath] : []))).sort(),
      selectedTransitionAtoms: planeItems.filter((item) => item.kind === "product-atom" && item.selected).length,
      productNativeComplete: planeItems.filter((item) => item.kind === "product-atom" && item.implementationLevel === "native").length,
      pinnedBehindLatestHead: planeItems.filter((item) => item.upstreamDriftStatus === "pinned-behind-latest-head").length,
      upstreamSourceSymbolMapped: sourceStatusCounts["pinned-source-symbol-mapped"],
      upstreamSourcePathMapped: sourceStatusCounts["pinned-source-path-mapped"],
      exactDiffMissing: exactDiffStatusCounts["exact-diff-missing"],
      exactDiffPartial: exactDiffStatusCounts["exact-diff-partial"],
      demotionGuardOnly: exactDiffStatusCounts["demotion-guard-only"],
      manualCheckPending: exactDiffStatusCounts["manual-check-pending"],
      currentSourceFileCount: currentSourceFiles.length,
      sampleCurrentSourceFiles: currentSourceFiles.slice(0, 8),
      byMismatchKind: countByKnown(planeItems, (item) => item.mismatchKind, [
        "common-shared-not-product-native",
        "compatible-bridge",
        "profile-compatible-common-runner",
        "native-like-projection",
        "preview-only",
        "metadata-only",
        "lossy-compatible-binding",
        "manual-source-check-required",
        "upstream-head-drift-unchecked",
      ]),
      byImplementationLevel: countBy(planeItems.filter((item) => item.implementationLevel), (item) => item.implementationLevel ?? ""),
      byPinnedUpstreamBehaviorStatus: countByKnown(planeItems, (item) => item.pinnedUpstreamBehaviorStatus, pinnedBehaviorStatusKeys),
      byPinnedUpstreamDivergenceKind: countDivergencesByKnown(planeItems, pinnedDivergenceKindKeys),
      bySourceVerificationStatus: sourceVerificationCounts,
      byFixtureDiffTarget: countDivergenceFixtureTargets(planeItems),
      byComparisonDimension: countDivergenceComparisonDimensions(planeItems),
    }
  })
}

function buildCurrentSourceFileSummaries(items: CurrentModulePlaceholderAuditItem[]): CurrentModulePlaceholderAuditCurrentSourceFileSummary[] {
  const sourceFiles = uniqueStrings(items.flatMap((item) => item.currentSourceFiles)).sort()
  return sourceFiles
    .map((currentSourceFile) => {
      const sourceItems = items.filter((item) => item.currentSourceFiles.includes(currentSourceFile))
      const exactDiffStatusCounts = countDivergenceExactDiffStatuses(sourceItems)
      const sourceVerificationCounts = countByKnown(sourceItems, (item) => item.sourceVerificationStatus, [
        "manual-source-check-pending",
        "metadata-overlay-source",
        "preview-only-source",
        "product-native-exact-fixture",
        "semantic-fixture-with-lossiness",
        "source-mapped-no-exact-fixture",
      ])
      const itemIDs = uniqueStrings(sourceItems.map((item) => item.id))
      const byFixtureDiffTarget = countDivergenceFixtureTargets(sourceItems)
      const sourceOwnerPackagePath = sourceOwnerPackagePathForCurrentSourceFile(currentSourceFile)
      const sourceOwnerPackageCatalogStatus = sourceOwnerPackageCatalogStatusForCurrentSourceFile(currentSourceFile)
      const moduleConfirmationStatus = moduleConfirmationStatusFromExactDiffCounts(exactDiffStatusCounts)
      return {
        currentSourceFile,
        sourceOwnerPackagePath,
        sourceOwnerPackageCatalogStatus,
        moduleConfirmationStatus,
        moduleConfirmationSummary: moduleConfirmationSummary(
          currentSourceFile,
          moduleConfirmationStatus,
          exactDiffStatusCounts["exact-diff-missing"],
          exactDiffStatusCounts["exact-diff-partial"],
          exactDiffStatusCounts["demotion-guard-only"],
          exactDiffStatusCounts["manual-check-pending"],
        ),
        finding: currentSourceFileFinding(currentSourceFile, exactDiffStatusCounts, byFixtureDiffTarget),
        sourceVerificationStatus: sourceVerificationStatusForSourceFile(sourceVerificationCounts),
        totalItems: itemIDs.length,
        itemCount: itemIDs.length,
        productAtomItems: sourceItems.filter((item) => item.kind === "product-atom").length,
        requiredBindingItems: sourceItems.filter((item) => item.kind === "required-binding").length,
        products: uniqueStrings(sourceItems.flatMap((item) => (item.product ? [item.product] : []))).sort(),
        planes: uniqueStrings(sourceItems.flatMap((item) => (item.plane ? [item.plane] : []))).sort(),
        packages: uniqueStrings(sourceItems.flatMap((item) => (item.packagePath ? [item.packagePath] : []))).sort(),
        ownerTODOs: uniqueStrings(sourceItems.map((item) => item.ownerTODO)) as CurrentModulePlaceholderAuditOwnerTODO[],
        itemKinds: uniqueStrings(sourceItems.map((item) => item.kind)) as CurrentModulePlaceholderAuditItemKind[],
        itemIDs,
        selectedTransitionAtoms: sourceItems.filter((item) => item.kind === "product-atom" && item.selected).length,
        productNativeComplete: sourceItems.filter((item) => item.kind === "product-atom" && item.implementationLevel === "native").length,
        exactDiffMissing: exactDiffStatusCounts["exact-diff-missing"],
        exactDiffPartial: exactDiffStatusCounts["exact-diff-partial"],
        demotionGuardOnly: exactDiffStatusCounts["demotion-guard-only"],
        manualCheckPending: exactDiffStatusCounts["manual-check-pending"],
        byMismatchKind: countByKnown(sourceItems, (item) => item.mismatchKind, [
          "common-shared-not-product-native",
          "compatible-bridge",
          "profile-compatible-common-runner",
          "native-like-projection",
          "preview-only",
          "metadata-only",
          "lossy-compatible-binding",
          "manual-source-check-required",
          "upstream-head-drift-unchecked",
        ]),
        byImplementationLevel: countBy(sourceItems.filter((item) => item.implementationLevel), (item) => item.implementationLevel ?? ""),
        byPinnedUpstreamBehaviorStatus: countByKnown(sourceItems, (item) => item.pinnedUpstreamBehaviorStatus, pinnedBehaviorStatusKeys),
        byPinnedUpstreamDivergenceKind: countDivergencesByKnown(sourceItems, pinnedDivergenceKindKeys),
        bySourceVerificationStatus: sourceVerificationCounts,
        byFixtureDiffTarget,
        byComparisonDimension: countDivergenceComparisonDimensions(sourceItems),
      }
    })
    .sort((left, right) => {
      const missing = right.exactDiffMissing - left.exactDiffMissing
      if (missing !== 0) return missing
      const partial = right.exactDiffPartial - left.exactDiffPartial
      if (partial !== 0) return partial
      const total = right.totalItems - left.totalItems
      if (total !== 0) return total
      return left.currentSourceFile.localeCompare(right.currentSourceFile)
    })
}

function sourceVerificationStatusForSourceFile(counts: Record<CurrentModuleSourceVerificationStatus, number>): CurrentModuleSourceVerificationStatus {
  if (counts["manual-source-check-pending"] > 0) return "manual-source-check-pending"
  if (counts["source-mapped-no-exact-fixture"] > 0) return "source-mapped-no-exact-fixture"
  if (counts["semantic-fixture-with-lossiness"] > 0) return "semantic-fixture-with-lossiness"
  if (counts["preview-only-source"] > 0) return "preview-only-source"
  if (counts["metadata-overlay-source"] > 0) return "metadata-overlay-source"
  return "product-native-exact-fixture"
}

function currentSourceFileFinding(
  currentSourceFile: string,
  exactDiffStatusCounts: Record<CurrentModuleBehaviorExactDiffStatus, number>,
  byFixtureDiffTarget: Record<string, number>,
): string {
  const topFixtureTarget = Object.entries(byFixtureDiffTarget)[0]?.[0] ?? "no-fixture-target"
  if (exactDiffStatusCounts["exact-diff-missing"] > 0) return `${currentSourceFile} still has exact-diff-missing module work; start with ${topFixtureTarget}.`
  if (exactDiffStatusCounts["exact-diff-partial"] > 0) return `${currentSourceFile} has partial fixture evidence; extend ${topFixtureTarget} to exact pinned-upstream comparison.`
  if (exactDiffStatusCounts["manual-check-pending"] > 0) return `${currentSourceFile} still needs manual source/API inspection before fixture work can be assigned.`
  if (exactDiffStatusCounts["demotion-guard-only"] > 0) return `${currentSourceFile} is currently guarded as common/metadata/preview demotion, not native parity.`
  return `${currentSourceFile} has no open pinned-upstream divergence in the current audit.`
}

function buildWorkQueueItems(items: CurrentModulePlaceholderAuditItem[]): CurrentModulePlaceholderAuditWorkItem[] {
  const byKey = new Map<
    string,
    {
      ownerTODO: CurrentModulePlaceholderAuditOwnerTODO
      priority: CurrentModulePlaceholderAuditWorkItemPriority
      divergenceKind: CurrentModulePinnedUpstreamDivergenceKind
      products: string[]
      planes: string[]
      packages: string[]
      itemKinds: CurrentModulePlaceholderAuditItemKind[]
      itemIDs: string[]
      mismatchKinds: CurrentModuleMismatchKind[]
      behaviorStatuses: CurrentModulePinnedUpstreamBehaviorStatus[]
      requiredEvidence: string
      nextVerification: string
      upstreamAnchorRefs: string[]
      currentAnchorRefs: string[]
      sampleEvidenceRefs: string[]
      exactDiffStatuses: CurrentModuleBehaviorExactDiffStatus[]
      fixtureDiffTargets: string[]
      comparisonDimensions: string[]
      action: string
    }
  >()
  for (const item of items) {
    for (const divergence of item.pinnedUpstreamDivergences) {
      const priority = workQueuePriorityForDivergence(divergence.kind)
      const products = uniqueStrings([item.product, ...item.upstreamSourceLocations.map((location) => location.product)])
      const planes = uniqueStrings([item.plane])
      const key = [item.ownerTODO, priority, divergence.kind, products.join("+") || "shared", planes.join("+") || "no-plane"].join("|")
      const existing = byKey.get(key)
      if (existing) {
        existing.products.push(...products)
        existing.planes.push(...planes)
        if (item.packagePath) existing.packages.push(item.packagePath)
        existing.itemKinds.push(item.kind)
        existing.itemIDs.push(item.id)
        existing.mismatchKinds.push(item.mismatchKind)
        existing.behaviorStatuses.push(item.pinnedUpstreamBehaviorStatus)
        existing.upstreamAnchorRefs.push(...divergence.upstreamAnchorRefs)
        existing.currentAnchorRefs.push(...divergence.currentAnchorRefs)
        existing.sampleEvidenceRefs.push(...divergence.evidenceRefs)
        existing.exactDiffStatuses.push(divergence.exactDiffStatus)
        existing.fixtureDiffTargets.push(divergence.fixtureDiffTarget)
        existing.comparisonDimensions.push(...divergence.comparisonDimensions)
        continue
      }
      byKey.set(key, {
        ownerTODO: item.ownerTODO,
        priority,
        divergenceKind: divergence.kind,
        products,
        planes,
        packages: item.packagePath ? [item.packagePath] : [],
        itemKinds: [item.kind],
        itemIDs: [item.id],
        mismatchKinds: [item.mismatchKind],
        behaviorStatuses: [item.pinnedUpstreamBehaviorStatus],
        requiredEvidence: divergence.requiredEvidence,
        nextVerification: divergence.nextVerification,
        upstreamAnchorRefs: [...divergence.upstreamAnchorRefs],
        currentAnchorRefs: [...divergence.currentAnchorRefs],
        sampleEvidenceRefs: [...divergence.evidenceRefs],
        exactDiffStatuses: [divergence.exactDiffStatus],
        fixtureDiffTargets: [divergence.fixtureDiffTarget],
        comparisonDimensions: [...divergence.comparisonDimensions],
        action: workQueueActionForDivergence(divergence.kind),
      })
    }
  }
  return Array.from(byKey.values())
    .map((item) => {
      const itemIDs = uniqueStrings(item.itemIDs)
      const products = uniqueStrings(item.products)
      const planes = uniqueStrings(item.planes)
      const stableIDParts = [item.ownerTODO, item.priority, item.divergenceKind, products.join("+") || "shared", planes.join("+") || "no-plane"]
      return {
        id: `work:${stableIDParts.map(slugForWorkQueueID).join(":")}:${fingerprintObject(itemIDs).slice(0, 8)}`,
        ownerTODO: item.ownerTODO,
        priority: item.priority,
        status: "open" as const,
        divergenceKind: item.divergenceKind,
        products,
        planes,
        packages: uniqueStrings(item.packages),
        itemKinds: uniqueStrings(item.itemKinds) as CurrentModulePlaceholderAuditItemKind[],
        itemIDs,
        itemCount: itemIDs.length,
        mismatchKinds: uniqueStrings(item.mismatchKinds) as CurrentModuleMismatchKind[],
        behaviorStatuses: uniqueStrings(item.behaviorStatuses) as CurrentModulePinnedUpstreamBehaviorStatus[],
        requiredEvidence: item.requiredEvidence,
        nextVerification: item.nextVerification,
        upstreamAnchorRefs: uniqueStrings(item.upstreamAnchorRefs).slice(0, 24),
        currentAnchorRefs: uniqueStrings(item.currentAnchorRefs).slice(0, 24),
        sampleEvidenceRefs: uniqueStrings(item.sampleEvidenceRefs).slice(0, 24),
        exactDiffStatuses: uniqueStrings(item.exactDiffStatuses) as CurrentModuleBehaviorExactDiffStatus[],
        fixtureDiffTargets: uniqueStrings(item.fixtureDiffTargets),
        comparisonDimensions: uniqueStrings(item.comparisonDimensions),
        action: item.action,
      }
    })
    .sort((left, right) => {
      const priority = left.priority.localeCompare(right.priority)
      if (priority !== 0) return priority
      return `${left.ownerTODO}:${left.products.join(",")}:${left.planes.join(",")}:${left.divergenceKind}`.localeCompare(`${right.ownerTODO}:${right.products.join(",")}:${right.planes.join(",")}:${right.divergenceKind}`)
    })
}

function buildFixtureDiffQueueItems(items: CurrentModulePlaceholderAuditItem[]): CurrentModulePlaceholderAuditFixtureDiffWorkItem[] {
  const byKey = new Map<
    string,
    {
      fixtureDiffTarget: string
      exactDiffStatus: CurrentModuleBehaviorExactDiffStatus
      priority: CurrentModulePlaceholderAuditWorkItemPriority
      products: string[]
      planes: string[]
      packages: string[]
      ownerTODOs: CurrentModulePlaceholderAuditOwnerTODO[]
      divergenceKinds: CurrentModulePinnedUpstreamDivergenceKind[]
      itemKinds: CurrentModulePlaceholderAuditItemKind[]
      itemIDs: string[]
      mismatchKinds: CurrentModuleMismatchKind[]
      behaviorStatuses: CurrentModulePinnedUpstreamBehaviorStatus[]
      requiredEvidence: string
      nextVerification: string
      upstreamAnchorRefs: string[]
      currentAnchorRefs: string[]
      sampleEvidenceRefs: string[]
      comparisonDimensions: string[]
    }
  >()
  for (const item of items) {
    for (const divergence of item.pinnedUpstreamDivergences) {
      const priority = fixtureDiffQueuePriority(divergence.exactDiffStatus, divergence.kind)
      const products = uniqueStrings([item.product, ...item.upstreamSourceLocations.map((location) => location.product)])
      const planes = uniqueStrings([item.plane])
      const key = [divergence.fixtureDiffTarget, divergence.exactDiffStatus].join("|")
      const existing = byKey.get(key)
      if (existing) {
        existing.products.push(...products)
        existing.planes.push(...planes)
        if (item.packagePath) existing.packages.push(item.packagePath)
        existing.ownerTODOs.push(item.ownerTODO)
        existing.divergenceKinds.push(divergence.kind)
        existing.itemKinds.push(item.kind)
        existing.itemIDs.push(item.id)
        existing.mismatchKinds.push(item.mismatchKind)
        existing.behaviorStatuses.push(item.pinnedUpstreamBehaviorStatus)
        existing.upstreamAnchorRefs.push(...divergence.upstreamAnchorRefs)
        existing.currentAnchorRefs.push(...divergence.currentAnchorRefs)
        existing.sampleEvidenceRefs.push(...divergence.evidenceRefs)
        existing.comparisonDimensions.push(...divergence.comparisonDimensions)
        continue
      }
      byKey.set(key, {
        fixtureDiffTarget: divergence.fixtureDiffTarget,
        exactDiffStatus: divergence.exactDiffStatus,
        priority,
        products,
        planes,
        packages: item.packagePath ? [item.packagePath] : [],
        ownerTODOs: [item.ownerTODO],
        divergenceKinds: [divergence.kind],
        itemKinds: [item.kind],
        itemIDs: [item.id],
        mismatchKinds: [item.mismatchKind],
        behaviorStatuses: [item.pinnedUpstreamBehaviorStatus],
        requiredEvidence: divergence.requiredEvidence,
        nextVerification: divergence.nextVerification,
        upstreamAnchorRefs: [...divergence.upstreamAnchorRefs],
        currentAnchorRefs: [...divergence.currentAnchorRefs],
        sampleEvidenceRefs: [...divergence.evidenceRefs],
        comparisonDimensions: [...divergence.comparisonDimensions],
      })
    }
  }
  return Array.from(byKey.values())
    .map((item) => {
      const itemIDs = uniqueStrings(item.itemIDs)
      const products = uniqueStrings(item.products)
      const planes = uniqueStrings(item.planes)
      const stableIDParts = [item.fixtureDiffTarget, item.exactDiffStatus]
      return {
        id: `fixture:${stableIDParts.map(slugForWorkQueueID).join(":")}:${fingerprintObject(itemIDs).slice(0, 8)}`,
        fixtureDiffTarget: item.fixtureDiffTarget,
        exactDiffStatus: item.exactDiffStatus,
        lineLevelDiffStatus: sourceFileLineLevelDiffStatus(item.exactDiffStatus),
        priority: item.priority,
        status: "open" as const,
        itemCount: itemIDs.length,
        itemIDs,
        sampleItemIDs: itemIDs.slice(0, 12),
        products,
        planes,
        packages: uniqueStrings(item.packages),
        ownerTODOs: uniqueStrings(item.ownerTODOs) as CurrentModulePlaceholderAuditOwnerTODO[],
        divergenceKinds: uniqueStrings(item.divergenceKinds) as CurrentModulePinnedUpstreamDivergenceKind[],
        itemKinds: uniqueStrings(item.itemKinds) as CurrentModulePlaceholderAuditItemKind[],
        mismatchKinds: uniqueStrings(item.mismatchKinds) as CurrentModuleMismatchKind[],
        behaviorStatuses: uniqueStrings(item.behaviorStatuses) as CurrentModulePinnedUpstreamBehaviorStatus[],
        requiredEvidence: item.requiredEvidence,
        nextVerification: item.nextVerification,
        fixtureImplementationTarget: fixtureDiffImplementationTarget(item.fixtureDiffTarget, item.exactDiffStatus),
        negativeVerificationTarget: fixtureDiffNegativeVerificationTarget(item.fixtureDiffTarget, item.exactDiffStatus),
        upstreamAnchorRefs: uniqueStrings(item.upstreamAnchorRefs).slice(0, 24),
        currentAnchorRefs: uniqueStrings(item.currentAnchorRefs).slice(0, 24),
        sampleUpstreamAnchorRefs: uniqueStrings(item.upstreamAnchorRefs).slice(0, 6),
        sampleCurrentAnchorRefs: uniqueStrings(item.currentAnchorRefs).slice(0, 6),
        sampleEvidenceRefs: uniqueStrings(item.sampleEvidenceRefs).slice(0, 24),
        comparisonDimensions: uniqueStrings(item.comparisonDimensions),
        action: fixtureDiffQueueAction(item.exactDiffStatus),
      }
    })
    .sort((left, right) => {
      const priority = left.priority.localeCompare(right.priority)
      if (priority !== 0) return priority
      const count = right.itemCount - left.itemCount
      if (count !== 0) return count
      return `${left.fixtureDiffTarget}:${left.exactDiffStatus}`.localeCompare(`${right.fixtureDiffTarget}:${right.exactDiffStatus}`)
    })
}

function buildSourceFileFixtureQueueItems(items: CurrentModulePlaceholderAuditItem[]): CurrentModulePlaceholderAuditSourceFileFixtureWorkItem[] {
  const byKey = new Map<
    string,
    {
      currentSourceFile: string
      sourceOwnerPackagePath: string
      sourceOwnerPackageCatalogStatus: CurrentModuleSourceOwnerPackageCatalogStatus
      fixtureDiffTarget: string
      exactDiffStatus: CurrentModuleBehaviorExactDiffStatus
      priority: CurrentModulePlaceholderAuditWorkItemPriority
      products: string[]
      planes: string[]
      packages: string[]
      ownerTODOs: CurrentModulePlaceholderAuditOwnerTODO[]
      divergenceKinds: CurrentModulePinnedUpstreamDivergenceKind[]
      itemKinds: CurrentModulePlaceholderAuditItemKind[]
      itemIDs: string[]
      mismatchKinds: CurrentModuleMismatchKind[]
      behaviorStatuses: CurrentModulePinnedUpstreamBehaviorStatus[]
      requiredEvidence: string
      nextVerification: string
      upstreamAnchorRefs: string[]
      currentAnchorRefs: string[]
      sampleEvidenceRefs: string[]
      comparisonDimensions: string[]
    }
  >()
  for (const item of items) {
    for (const currentSourceFile of item.currentSourceFiles) {
      for (const divergence of item.pinnedUpstreamDivergences) {
        const priority = fixtureDiffQueuePriority(divergence.exactDiffStatus, divergence.kind)
        const products = productsForSourceFileFixtureQueue(item)
        const planes = uniqueStrings([item.plane])
        const key = [currentSourceFile, divergence.fixtureDiffTarget, divergence.exactDiffStatus].join("|")
        const existing = byKey.get(key)
        if (existing) {
          existing.products.push(...products)
          existing.planes.push(...planes)
          if (item.packagePath) existing.packages.push(item.packagePath)
          existing.ownerTODOs.push(item.ownerTODO)
          existing.divergenceKinds.push(divergence.kind)
          existing.itemKinds.push(item.kind)
          existing.itemIDs.push(item.id)
          existing.mismatchKinds.push(item.mismatchKind)
          existing.behaviorStatuses.push(item.pinnedUpstreamBehaviorStatus)
          existing.upstreamAnchorRefs.push(...divergence.upstreamAnchorRefs)
          existing.currentAnchorRefs.push(...divergence.currentAnchorRefs)
          existing.sampleEvidenceRefs.push(...divergence.evidenceRefs)
          existing.comparisonDimensions.push(...divergence.comparisonDimensions)
          continue
        }
        byKey.set(key, {
          currentSourceFile,
          sourceOwnerPackagePath: sourceOwnerPackagePathForCurrentSourceFile(currentSourceFile),
          sourceOwnerPackageCatalogStatus: sourceOwnerPackageCatalogStatusForCurrentSourceFile(currentSourceFile),
          fixtureDiffTarget: divergence.fixtureDiffTarget,
          exactDiffStatus: divergence.exactDiffStatus,
          priority,
          products,
          planes,
          packages: item.packagePath ? [item.packagePath] : [],
          ownerTODOs: [item.ownerTODO],
          divergenceKinds: [divergence.kind],
          itemKinds: [item.kind],
          itemIDs: [item.id],
          mismatchKinds: [item.mismatchKind],
          behaviorStatuses: [item.pinnedUpstreamBehaviorStatus],
          requiredEvidence: divergence.requiredEvidence,
          nextVerification: divergence.nextVerification,
          upstreamAnchorRefs: [...divergence.upstreamAnchorRefs],
          currentAnchorRefs: [...divergence.currentAnchorRefs],
          sampleEvidenceRefs: [...divergence.evidenceRefs],
          comparisonDimensions: [...divergence.comparisonDimensions],
        })
      }
    }
  }
  return Array.from(byKey.values())
    .map((item) => {
      const itemIDs = uniqueStrings(item.itemIDs)
      const stableIDParts = [item.currentSourceFile, item.fixtureDiffTarget, item.exactDiffStatus]
      return {
        id: `source-file:${stableIDParts.map(slugForWorkQueueID).join(":")}:${fingerprintObject(itemIDs).slice(0, 8)}`,
	        currentSourceFile: item.currentSourceFile,
	        sourceOwnerPackagePath: item.sourceOwnerPackagePath,
	        sourceOwnerPackageCatalogStatus: item.sourceOwnerPackageCatalogStatus,
	        fixtureDiffTarget: item.fixtureDiffTarget,
	        exactDiffStatus: item.exactDiffStatus,
	        lineLevelDiffStatus: sourceFileLineLevelDiffStatus(item.exactDiffStatus),
	        priority: item.priority,
	        status: "open" as const,
	        itemCount: itemIDs.length,
	        itemIDs,
	        sampleItemIDs: itemIDs.slice(0, 12),
	        products: uniqueStrings(item.products),
	        planes: uniqueStrings(item.planes),
	        packages: uniqueStrings(item.packages),
	        ownerTODOs: uniqueStrings(item.ownerTODOs) as CurrentModulePlaceholderAuditOwnerTODO[],
        divergenceKinds: uniqueStrings(item.divergenceKinds) as CurrentModulePinnedUpstreamDivergenceKind[],
        itemKinds: uniqueStrings(item.itemKinds) as CurrentModulePlaceholderAuditItemKind[],
        mismatchKinds: uniqueStrings(item.mismatchKinds) as CurrentModuleMismatchKind[],
	        behaviorStatuses: uniqueStrings(item.behaviorStatuses) as CurrentModulePinnedUpstreamBehaviorStatus[],
	        requiredEvidence: item.requiredEvidence,
	        nextVerification: item.nextVerification,
	        fixtureImplementationTarget: sourceFileFixtureImplementationTarget(item.currentSourceFile, item.fixtureDiffTarget, item.exactDiffStatus),
	        negativeVerificationTarget: sourceFileNegativeVerificationTarget(item.currentSourceFile, item.fixtureDiffTarget, item.exactDiffStatus),
	        upstreamAnchorRefs: uniqueStrings(item.upstreamAnchorRefs).slice(0, 24),
	        currentAnchorRefs: uniqueStrings(item.currentAnchorRefs).slice(0, 24),
	        sampleUpstreamAnchorRefs: uniqueStrings(item.upstreamAnchorRefs).slice(0, 6),
	        sampleCurrentAnchorRefs: uniqueStrings(item.currentAnchorRefs).slice(0, 6),
	        sampleEvidenceRefs: uniqueStrings(item.sampleEvidenceRefs).slice(0, 24),
	        comparisonDimensions: uniqueStrings(item.comparisonDimensions),
	        action: sourceFileFixtureQueueAction(item.exactDiffStatus, item.currentSourceFile),
	      }
    })
    .sort((left, right) => {
      const priority = left.priority.localeCompare(right.priority)
      if (priority !== 0) return priority
      const status = left.exactDiffStatus.localeCompare(right.exactDiffStatus)
      if (status !== 0) return status
      const count = right.itemCount - left.itemCount
      if (count !== 0) return count
      return `${left.currentSourceFile}:${left.fixtureDiffTarget}`.localeCompare(`${right.currentSourceFile}:${right.fixtureDiffTarget}`)
    })
	}
	
function buildSourceOwnerLineLevelSummaries(
  sourceFileFixtureQueue: CurrentModulePlaceholderAuditSourceFileFixtureWorkItem[],
): CurrentModulePlaceholderAuditSourceOwnerLineLevelSummary[] {
  const byOwner = new Map<string, CurrentModulePlaceholderAuditSourceFileFixtureWorkItem[]>()
  for (const item of sourceFileFixtureQueue) {
    const existing = byOwner.get(item.sourceOwnerPackagePath)
    if (existing) existing.push(item)
    else byOwner.set(item.sourceOwnerPackagePath, [item])
  }
  return Array.from(byOwner.entries())
    .map(([sourceOwnerPackagePath, ownerItems]) => {
      const byLineLevelDiffStatus = countByKnown(ownerItems, (item) => item.lineLevelDiffStatus, [
        "demotion-guard-only",
        "line-level-diff-missing",
        "manual-anchor-needed",
        "semantic-fixture-needs-exact-diff",
      ])
      const byExactDiffStatus = countByKnown(ownerItems, (item) => item.exactDiffStatus, [
        "demotion-guard-only",
        "exact-diff-missing",
        "exact-diff-partial",
        "manual-check-pending",
      ])
      const moduleConfirmationStatus = moduleConfirmationStatusFromLineLevelCounts(byLineLevelDiffStatus)
      return {
        sourceOwnerPackagePath,
        sourceOwnerPackageCatalogStatus: ownerItems[0]?.sourceOwnerPackageCatalogStatus ?? sourceOwnerPackageCatalogStatusForCurrentSourceFile(sourceOwnerPackagePath),
        moduleConfirmationStatus,
        moduleConfirmationSummary: moduleConfirmationSummary(
          sourceOwnerPackagePath,
          moduleConfirmationStatus,
          byLineLevelDiffStatus["line-level-diff-missing"],
          byLineLevelDiffStatus["semantic-fixture-needs-exact-diff"],
          byLineLevelDiffStatus["demotion-guard-only"],
          byLineLevelDiffStatus["manual-anchor-needed"],
        ),
        queueItems: ownerItems.length,
        itemCount: ownerItems.reduce((total, item) => total + item.itemCount, 0),
        currentSourceFileCount: uniqueStrings(ownerItems.map((item) => item.currentSourceFile)).length,
        sampleCurrentSourceFiles: uniqueStrings(ownerItems.map((item) => item.currentSourceFile)).slice(0, 10),
        products: uniqueStrings(ownerItems.flatMap((item) => item.products)),
        planes: uniqueStrings(ownerItems.flatMap((item) => item.planes)),
        packages: uniqueStrings(ownerItems.flatMap((item) => item.packages)),
        ownerTODOs: uniqueStrings(ownerItems.flatMap((item) => item.ownerTODOs)) as CurrentModulePlaceholderAuditOwnerTODO[],
        lineLevelDiffMissing: byLineLevelDiffStatus["line-level-diff-missing"],
        semanticFixtureNeedsExactDiff: byLineLevelDiffStatus["semantic-fixture-needs-exact-diff"],
        demotionGuardOnly: byLineLevelDiffStatus["demotion-guard-only"],
        manualAnchorNeeded: byLineLevelDiffStatus["manual-anchor-needed"],
        byLineLevelDiffStatus,
        byExactDiffStatus,
        byFixtureDiffTarget: countSourceFileFixtureQueueBy(ownerItems, (item) => item.fixtureDiffTarget),
        byFixtureImplementationTarget: countSourceFileFixtureQueueBy(ownerItems, (item) => item.fixtureImplementationTarget),
        byNegativeVerificationTarget: countSourceFileFixtureQueueBy(ownerItems, (item) => item.negativeVerificationTarget),
        sampleItemIDs: uniqueStrings(ownerItems.flatMap((item) => item.sampleItemIDs)).slice(0, 12),
        sampleFixtureImplementationTargets: uniqueStrings(ownerItems.map((item) => item.fixtureImplementationTarget)).slice(0, 16),
        sampleNegativeVerificationTargets: uniqueStrings(ownerItems.map((item) => item.negativeVerificationTarget)).slice(0, 16),
      }
    })
    .sort((left, right) => {
      const missing = right.lineLevelDiffMissing - left.lineLevelDiffMissing
      if (missing !== 0) return missing
      const partial = right.semanticFixtureNeedsExactDiff - left.semanticFixtureNeedsExactDiff
      if (partial !== 0) return partial
      const guard = right.demotionGuardOnly - left.demotionGuardOnly
      if (guard !== 0) return guard
      const queueItems = right.queueItems - left.queueItems
      if (queueItems !== 0) return queueItems
      return left.sourceOwnerPackagePath.localeCompare(right.sourceOwnerPackagePath)
    })
}

function countSourceFileFixtureQueueBy(
  items: CurrentModulePlaceholderAuditSourceFileFixtureWorkItem[],
  keyFor: (item: CurrentModulePlaceholderAuditSourceFileFixtureWorkItem) => string,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const key = keyFor(item)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])))
}

function moduleConfirmationStatusFromExactDiffCounts(counts: Record<CurrentModuleBehaviorExactDiffStatus, number>): CurrentModuleSourceModuleConfirmationStatus {
  if (counts["manual-check-pending"] > 0) return "manual-anchor-needed"
  if (counts["exact-diff-missing"] > 0) return "upstream-divergent-exact-diff-missing"
  if (counts["exact-diff-partial"] > 0) return "semantic-fixture-needs-exact-diff"
  if (counts["demotion-guard-only"] > 0) return "demotion-guard-confirmed"
  return "no-open-divergence"
}

function moduleConfirmationStatusFromLineLevelCounts(counts: Record<CurrentModuleSourceFileLineLevelDiffStatus, number>): CurrentModuleSourceModuleConfirmationStatus {
  if (counts["manual-anchor-needed"] > 0) return "manual-anchor-needed"
  if (counts["line-level-diff-missing"] > 0) return "upstream-divergent-exact-diff-missing"
  if (counts["semantic-fixture-needs-exact-diff"] > 0) return "semantic-fixture-needs-exact-diff"
  if (counts["demotion-guard-only"] > 0) return "demotion-guard-confirmed"
  return "no-open-divergence"
}

function moduleConfirmationSummary(
  label: string,
  status: CurrentModuleSourceModuleConfirmationStatus,
  missing: number,
  partial: number,
  guard: number,
  manual: number,
): string {
  const counts = `${missing} missing / ${partial} partial / ${guard} demotion guard / ${manual} manual`
  if (status === "manual-anchor-needed") return `${label} still needs a source anchor before fixture work can be confirmed (${counts}).`
  if (status === "upstream-divergent-exact-diff-missing") return `${label} is upstream-divergent until exact source/fixture diff is implemented (${counts}).`
  if (status === "semantic-fixture-needs-exact-diff") return `${label} has semantic fixture coverage but still needs exact pinned-upstream comparison (${counts}).`
  if (status === "demotion-guard-confirmed") return `${label} is confirmed only as demotion/native-claim guard, not native parity (${counts}).`
  return `${label} has no open source-file fixture divergence in the current audit (${counts}).`
}

function sourceFileLineLevelDiffStatus(status: CurrentModuleBehaviorExactDiffStatus): CurrentModuleSourceFileLineLevelDiffStatus {
  if (status === "manual-check-pending") return "manual-anchor-needed"
  if (status === "exact-diff-missing") return "line-level-diff-missing"
  if (status === "exact-diff-partial") return "semantic-fixture-needs-exact-diff"
  return "demotion-guard-only"
}

function sourceFileFixtureImplementationTarget(currentSourceFile: string, fixtureDiffTarget: string, status: CurrentModuleBehaviorExactDiffStatus): string {
  const mode = status === "exact-diff-partial" ? "extend" : status === "demotion-guard-only" ? "preserve-guard" : status === "manual-check-pending" ? "pin-anchor" : "implement"
  return `${mode}:${fixtureDiffTarget}:${currentSourceFile}`
}

function sourceFileNegativeVerificationTarget(currentSourceFile: string, fixtureDiffTarget: string, status: CurrentModuleBehaviorExactDiffStatus): string {
  const mode = status === "demotion-guard-only" ? "native-claim-guard" : status === "manual-check-pending" ? "manual-anchor-guard" : "exact-diff-regression"
  return `${mode}:${fixtureDiffTarget}:${currentSourceFile}`
}

function sourceFileFixtureQueueAction(status: CurrentModuleBehaviorExactDiffStatus, currentSourceFile: string): string {
  if (status === "manual-check-pending") return `Inspect ${currentSourceFile}, pin the upstream source/API anchor, then replace the manual marker with a concrete fixture target.`
  if (status === "exact-diff-missing") return `Implement the named fixture diff for ${currentSourceFile} against pinned upstream source before any native promotion.`
  if (status === "exact-diff-partial") return `Extend ${currentSourceFile}'s semantic fixture into a full pinned-upstream exact diff and keep lossiness visible until complete.`
  return `Preserve demotion guards in ${currentSourceFile}; only replace them with executable fixture proof if product behavior is identified.`
}

function fixtureDiffImplementationTarget(fixtureDiffTarget: string, status: CurrentModuleBehaviorExactDiffStatus): string {
  const mode = status === "exact-diff-partial" ? "extend" : status === "demotion-guard-only" ? "preserve-guard" : status === "manual-check-pending" ? "pin-anchor" : "implement"
  return `${mode}:${fixtureDiffTarget}`
}

function fixtureDiffNegativeVerificationTarget(fixtureDiffTarget: string, status: CurrentModuleBehaviorExactDiffStatus): string {
  const mode = status === "demotion-guard-only" ? "native-claim-guard" : status === "manual-check-pending" ? "manual-anchor-guard" : "exact-diff-regression"
  return `${mode}:${fixtureDiffTarget}`
}

function productsForSourceFileFixtureQueue(item: CurrentModulePlaceholderAuditItem): string[] {
  if (item.product) return [item.product]
  const upstreamProducts = uniqueStrings(item.upstreamSourceLocations.map((location) => location.product))
  return upstreamProducts.length === 1 ? upstreamProducts : []
}

function fixtureDiffQueuePriority(status: CurrentModuleBehaviorExactDiffStatus, kind: CurrentModulePinnedUpstreamDivergenceKind): CurrentModulePlaceholderAuditWorkItemPriority {
  if (status === "manual-check-pending") return "P0-source-audit"
  if (status === "exact-diff-missing" || status === "exact-diff-partial") return "P1-native-parity"
  return workQueuePriorityForDivergence(kind)
}

function fixtureDiffQueueAction(status: CurrentModuleBehaviorExactDiffStatus): string {
  if (status === "manual-check-pending") return "Open a source/API inspection task, identify the concrete fixture target, then replace the manual marker."
  if (status === "exact-diff-missing") return "Implement the named fixture diff against pinned upstream source before any native promotion."
  if (status === "exact-diff-partial") return "Extend the existing semantic fixture into a full pinned-upstream exact diff and keep lossiness visible until complete."
  return "Preserve demotion and native-claim guards; only replace with executable fixture proof if product behavior is identified."
}

function workQueuePriorityForDivergence(kind: CurrentModulePinnedUpstreamDivergenceKind): CurrentModulePlaceholderAuditWorkItemPriority {
  if (kind === "manual-behavior-check-required") return "P0-source-audit"
  if (kind === "metadata-overlay-only" || kind === "preview-surface-only" || kind === "common-provider-not-product-native" || kind === "foundation-compatibility-overlay") return "P2-demotion-guard"
  return "P1-native-parity"
}

function workQueueActionForDivergence(kind: CurrentModulePinnedUpstreamDivergenceKind): string {
  if (kind === "manual-behavior-check-required") return "Open a source/API inspection task, pin the upstream function or fixture target, then replace the manual marker."
  if (kind === "metadata-overlay-only") return "Keep as metadata overlay, preserve executable blockers, and only move if a real executable upstream behavior is identified."
  if (kind === "preview-surface-only") return "Keep preview demotion visible until a native UI/PTY/API replay fixture proves primary surface parity."
  if (kind === "common-provider-not-product-native") return "Keep common provider visibility, and require product-specific fixture proof before any native promotion."
  if (kind === "foundation-compatibility-overlay") return "Keep compatibility aliases as metadata and guard against native parity claims."
  return "Add the named upstream fixture/gate, compare current anchors against pinned source behavior, and keep the item downgraded until it passes."
}

function slugForWorkQueueID(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "none"
}

function auditSummaryFromItems(
  items: CurrentModulePlaceholderAuditItem[],
  workQueue: CurrentModulePlaceholderAuditWorkItem[] = buildWorkQueueItems(items),
): Omit<CurrentModulePlaceholderAudit["summary"], "fingerprint"> {
  return {
    totalItems: items.length,
    packageItems: items.filter((item) => item.kind === "package").length,
    planeItems: items.filter((item) => item.kind === "plane").length,
    productAtomItems: items.filter((item) => item.kind === "product-atom").length,
    requiredBindingItems: items.filter((item) => item.kind === "required-binding").length,
    productNativeComplete: items.filter((item) => item.kind === "product-atom" && item.implementationLevel === "native").length,
    transitionAtoms: items.filter((item) => item.kind === "product-atom").length,
    selectedTransitionAtoms: items.filter((item) => item.kind === "product-atom" && item.selected).length,
    requiredBindings: items.filter((item) => item.kind === "required-binding").length,
    compileBlockers: items.filter((item) => item.kind === "required-binding" && item.nextAction === "rebind-existing-executable").length,
    previewOnlyBindings: items.filter((item) => item.kind === "required-binding" && item.mismatchKind === "preview-only").length,
    lossyCompatibleBindings: items.filter((item) => item.kind === "required-binding" && item.mismatchKind === "lossy-compatible-binding").length,
    previewOrMetadataExecutableBindings: items.filter(
      (item) => item.kind === "required-binding" && item.executableRequired && (item.implementationLevel === "preview-shell" || item.implementationLevel === "metadata-only"),
    ).length,
    manualSourceCheckRequired: items.filter((item) => item.mismatchKind === "manual-source-check-required").length,
    workQueueItems: workQueue.length,
    workQueueCoveredItems: uniqueStrings(workQueue.flatMap((item) => item.itemIDs)).length,
    sourceFileFixtureQueueItems: buildSourceFileFixtureQueueItems(items).length,
    sourceOwnerLineLevelSummaryItems: buildSourceOwnerLineLevelSummaries(buildSourceFileFixtureQueueItems(items)).length,
    currentSourceFileSummaryItems: uniqueStrings(items.flatMap((item) => item.currentSourceFiles)).length,
    upstreamHeadDriftProducts: uniqueStrings(
      items.filter((item) => isCurrentModuleAuditProduct(item.product) && item.upstreamDriftStatus === "pinned-behind-latest-head").map((item) => item.product),
    ).length,
    upstreamHeadDriftItems: items.filter((item) => item.upstreamDriftStatus === "pinned-behind-latest-head").length,
    productNativeExactFixtureItems: items.filter((item) => item.sourceVerificationStatus === "product-native-exact-fixture").length,
    semanticFixtureItems: items.filter((item) => item.sourceVerificationStatus === "semantic-fixture-with-lossiness").length,
    byMismatchKind: countByKnown(items, (item) => item.mismatchKind, [
      "common-shared-not-product-native",
      "compatible-bridge",
      "profile-compatible-common-runner",
      "native-like-projection",
      "preview-only",
      "metadata-only",
      "lossy-compatible-binding",
      "manual-source-check-required",
      "upstream-head-drift-unchecked",
    ]),
    byImplementationLevel: countBy(items.filter((item) => item.implementationLevel), (item) => item.implementationLevel ?? ""),
    byUpstreamDriftStatus: countByKnown(items, (item) => item.upstreamDriftStatus, ["not-product-scoped", "pinned-behind-latest-head", "pinned-matches-latest-head"]),
    byUpstreamSourceStatus: countByKnown(items, (item) => item.upstreamSourceStatus, [
      "not-product-scoped",
      "pinned-source-path-mapped",
      "pinned-source-symbol-mapped",
      "upstream-baseline-only",
    ]),
    byPinnedUpstreamBehaviorStatus: countByKnown(items, (item) => item.pinnedUpstreamBehaviorStatus, pinnedBehaviorStatusKeys),
    byPinnedUpstreamDivergenceKind: countDivergencesByKnown(items, pinnedDivergenceKindKeys),
    byBehaviorExactDiffStatus: countDivergenceExactDiffStatuses(items),
    byFixtureDiffTarget: countDivergenceFixtureTargets(items),
    byComparisonDimension: countDivergenceComparisonDimensions(items),
    byWorkQueueOwnerTODO: countByKnown(workQueue, (item) => item.ownerTODO, ["TODO-024", "TODO-025", "TODO-027", "TODO-028", "TODO-029"]),
    bySourceVerificationStatus: countByKnown(items, (item) => item.sourceVerificationStatus, [
      "manual-source-check-pending",
      "metadata-overlay-source",
      "preview-only-source",
      "product-native-exact-fixture",
      "semantic-fixture-with-lossiness",
      "source-mapped-no-exact-fixture",
    ]),
    byPackage: countBy(items.filter((item) => item.packagePath), (item) => item.packagePath ?? ""),
    byPlane: countBy(items.filter((item) => item.plane), (item) => item.plane ?? ""),
    byProduct: countBy(items.filter((item) => item.product), (item) => item.product ?? ""),
  }
}

function atomLookup(contracts: AssemblyContract[]): Map<string, AssemblyContractAtom> {
  const lookup = new Map<string, AssemblyContractAtom>()
  for (const contract of contracts) {
    for (const atom of contract.atoms) {
      lookup.set(`${contract.product}:${atom.id}`, atom)
    }
  }
  return lookup
}

function mismatchForImplementationLevel(level: string): CurrentModuleMismatchKind {
  if (level === "compatible-bridge") return "compatible-bridge"
  if (level === "profile-compatible") return "profile-compatible-common-runner"
  if (level === "native-like") return "native-like-projection"
  if (level === "preview-shell") return "preview-only"
  if (level === "metadata-only") return "metadata-only"
  return "upstream-head-drift-unchecked"
}

function mismatchForTransitionItems(transitions: Todo27NativeRewriteInventoryItem[]): CurrentModuleMismatchKind {
  const implementationLevel = executableLevelForTransitionItems(transitions)
  return implementationLevel ? mismatchForImplementationLevel(implementationLevel) : "manual-source-check-required"
}

function mismatchForBinding(item: ExecutablePlaceholderAuditItem): CurrentModuleMismatchKind {
  if (item.implementationLevel === "native" && item.knownLossiness.length === 0) return "upstream-head-drift-unchecked"
  if (item.risk === "lossy-compatible") return "lossy-compatible-binding"
  if (item.risk === "preview-only") return "preview-only"
  if (item.risk === "metadata-ok") return "metadata-only"
  if (item.risk === "compile-blocker" || item.risk === "misleading-coverage") return "manual-source-check-required"
  return "common-shared-not-product-native"
}

function nextActionForMismatch(kind: CurrentModuleMismatchKind): string {
  if (kind === "metadata-only") return "Keep as metadata overlay and prevent executable binding."
  if (kind === "preview-only") return "Keep preview demotion visible or replace with native surface backed by upstream UI evidence."
  if (kind === "profile-compatible-common-runner") return "Replace common product profile with product-native turn factory and fixture replay."
  if (kind === "native-like-projection") return "Replace semantic projection with upstream replay / native round-trip evidence."
  if (kind === "compatible-bridge") return "Compare bridge adapter against upstream source and either rewrite or keep explicitly downgraded."
  if (kind === "lossy-compatible-binding") return "Keep lossiness visible and add product-native evidence before upgrading."
  return "Run source-level check against pinned upstream and latest HEAD."
}

function packagePathForInventoryItem(item: Todo27NativeRewriteInventoryItem, contracts: AssemblyContract[] = []): string | undefined {
  for (const contract of contracts) {
    if (contract.product !== item.product) continue
    const atom = contract.atoms.find((candidate) => candidate.id === item.atomID)
    if (atom) return packagePathForAtom(atom)
  }
  if (item.product === "opencode") return "packages/adapters-opencode"
  if (item.product === "pi-mono") return "packages/adapters-pi"
  if (item.product === "nanobot") return "packages/adapters-nanobot"
  if (item.product === "hermes-agent") return "packages/adapters-hermes"
  return undefined
}

function packagePathForAtom(atom: AssemblyContractAtom): string {
  const packageName = atom.source?.packageName || atom.sourcePackage
  if (!packageName) return "(unknown)"
  if (packageName.startsWith("@helix/")) return `packages/${packageName.slice("@helix/".length)}`
  return packageName
}

function sourceRefForAtom(atom: AssemblyContractAtom): string {
  const specifier = atom.source?.specifier ?? atom.sourcePackage ?? packagePathForAtom(atom)
  return `${specifier}:${atom.id}`
}

function currentSourcePathForAtom(atom: AssemblyContractAtom): string {
  if (!atom.source) return sourceRefForAtom(atom)
  return `${atom.source.packageDir}:${atom.source.exportPath}:${atom.id}`
}

function currentSourceFileForAtom(atom: AssemblyContractAtom): string {
  if (!atom.source) return sourceRefForAtom(atom)
  const exportPath = atom.source.exportPath === "." ? "index" : atom.source.exportPath.replace(/^\.\//, "")
  return `packages/${atom.source.packageDir}/src/${exportPath}.ts`
}

function currentSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  if (!atom.source) return [sourceRefForAtom(atom)]
  const expanded = expandedCurrentSourceFilesForAtom(atom)
  return expanded.length > 0 ? expanded : [currentSourceFileForAtom(atom)]
}

function expandedCurrentSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  if (atom.source?.packageDir === "lego-agent-loop" && atom.source.exportPath === ".") return currentAgentLoopSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-config" && atom.source.exportPath === "./config-atoms") return currentLegoConfigSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-runtime" && atom.source.exportPath === ".") return currentLegoRuntimeCoreSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-runtime" && atom.source.exportPath === "./runtime-atoms") return currentLegoRuntimeAtomSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-runtime" && atom.source.exportPath === "./acceptance-controller") return currentLegoRuntimeAcceptanceSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-provider" && atom.source.exportPath === "./ports") return currentLegoProviderPortSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-hooks" && atom.source.exportPath === "./hook-atoms") return currentLegoHookSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-tools" && atom.source.exportPath === "./tool-atoms") return currentLegoToolAtomSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-tools" && atom.source.exportPath === "./cadence-atoms") return currentLegoToolCadenceSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-ui" && atom.source.exportPath === "./ui-atoms") return currentLegoUISourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-session" && atom.source.exportPath === "./atoms") return currentLegoSessionAtomSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "lego-session" && atom.source.exportPath === "./message-part-projector") return currentLegoSessionMessagePartSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./plugin-atoms") return currentOpenCodePluginAtomSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./session-personality") return currentProductSessionPersonalitySourceFilesForAtom(atom, "opencode")
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-hook-error-defaults") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-hook-error-defaults.ts", "packages/lego-hooks/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-hook-handler") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-hook-handler.ts", "packages/lego-hooks/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-hook-observer") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-hook-observer.ts", "packages/lego-hooks/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-hook-scheduler") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-hook-scheduler.ts", "packages/lego-hooks/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-command-registry") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-command-registry.ts", "packages/lego-hooks/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-shell-env") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-shell-env.ts", "packages/lego-tools/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-tool-result-render") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-tool-result-render.ts", "packages/lego-tools/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-plugin-provider-registry") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-plugin-provider-registry.ts", "packages/lego-provider/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-plugin-ui-registry") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-plugin-ui-registry.ts", "packages/lego-hooks/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-plugin-permission-bridge") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-plugin-permission-bridge.ts", "packages/lego-tools/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-provider-auth-descriptor") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-provider-auth-descriptor.ts", "packages/lego-provider/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-provider-plugin-descriptor") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-provider-plugin-descriptor.ts", "packages/lego-provider/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-provider-model-plugin") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-provider-model-plugin.ts", "packages/lego-provider/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-provider-usage") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-provider-usage.ts", "packages/lego-provider/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-provider-request-options") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-provider-request-options.ts", "packages/lego-provider/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-input-normalizer") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-input-normalizer.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-context-builder") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-context-builder.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-prompt-assembler") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-prompt-assembler.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-provider-request-builder") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-provider-request-builder.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-retry-policy") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-retry-policy.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-stream-reducer") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-stream-reducer.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-loop-control") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-loop-control.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-tool-loop") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-tool-loop.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-provider-stream-runner") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-provider-stream-runner.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-compaction-policy") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-compaction-policy.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-turn-result-recorder") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-turn-result-recorder.ts", "packages/lego-agent-loop/src/ports/turn-port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-trace-debug-surface") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-trace-debug-surface.ts", "packages/contracts/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-tool-definition-plugin") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-tool-definition-plugin.ts", "packages/lego-tools/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-opencode" && atom.source.exportPath === "./opencode-tool-status") {
    return uniqueStrings(["packages/adapters-opencode/src/opencode-tool-status.ts", "packages/lego-tools/src/port-fixtures.ts"])
  }
  if (atom.source?.packageDir === "adapters-pi" && atom.source.exportPath === "./extension-atoms") return currentPiExtensionAtomSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "adapters-pi" && atom.source.exportPath === "./session-personality") return currentProductSessionPersonalitySourceFilesForAtom(atom, "pi-mono")
  if (atom.source?.packageDir === "adapters-nanobot" && atom.source.exportPath === "./nanobot-atoms") return currentNanobotAtomSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "adapters-nanobot" && atom.source.exportPath === "./session-personality") return currentProductSessionPersonalitySourceFilesForAtom(atom, "nanobot")
  if (atom.source?.packageDir === "adapters-hermes" && atom.source.exportPath === "./hermes-atoms") return currentHermesAtomSourceFilesForAtom(atom)
  if (atom.source?.packageDir === "adapters-hermes" && atom.source.exportPath === "./session-personality") return currentProductSessionPersonalitySourceFilesForAtom(atom, "hermes-agent")
  return []
}

function currentLegoRuntimeCoreSourceFilesForAtom(_atom: AssemblyContractAtom): string[] {
  return uniqueStrings(["packages/lego-runtime/src/registry.ts", "packages/lego-runtime/src/port-fixtures.ts"])
}

function currentLegoRuntimeAtomSourceFilesForAtom(_atom: AssemblyContractAtom): string[] {
  return uniqueStrings(["packages/lego-runtime/src/runtime-atoms.ts", "packages/lego-runtime/src/port-fixtures.ts"])
}

function currentLegoRuntimeAcceptanceSourceFilesForAtom(_atom: AssemblyContractAtom): string[] {
  return uniqueStrings(["packages/lego-runtime/src/acceptance-controller.ts", "packages/lego-runtime/src/port-fixtures.ts"])
}

function currentLegoProviderPortSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const ports = "packages/lego-provider/src/ports.ts"
  const fixtures = "packages/lego-provider/src/port-fixtures.ts"
  const normalizer = "packages/lego-provider/src/normalizer.ts"
  const streaming = "packages/lego-provider/src/streaming-delta-recorder.ts"
  const files = [ports, fixtures]

  if (id.includes("openai-compatible")) files.push("packages/lego-provider/src/openai-compatible.ts", normalizer)
  if (id.includes("anthropic")) files.push("packages/lego-provider/src/anthropic.ts", normalizer)
  if (id.includes("google")) files.push("packages/lego-provider/src/google.ts", normalizer)
  if (id.includes("openrouter")) files.push("packages/lego-provider/src/openrouter.ts", "packages/lego-provider/src/openai-compatible.ts", normalizer)
  if (id.includes("event-normalizer") || id.includes("usage-normalizer")) files.push(normalizer)
  if (id.includes("streaming-delta") || id.includes("stream-projector")) files.push(streaming, normalizer)
  if (id.includes("stream.") && !id.includes("streaming-delta")) files.push(normalizer)

  return uniqueStrings(files)
}

function currentLegoHookSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const atoms = "packages/lego-hooks/src/hook-atoms.ts"
  const host = "packages/lego-hooks/src/host.ts"
  const aliases = "packages/lego-hooks/src/aliases.ts"
  const types = "packages/lego-hooks/src/types.ts"
  const fixtures = "packages/lego-hooks/src/port-fixtures.ts"
  const files = [atoms, host, types, fixtures]

  if (id.includes("bus") || id.includes("chain") || id.includes("scheduler") || id.includes("cleanup") || id.includes("error-policy")) files.push(aliases)
  if (id.startsWith("registry.")) files.push(aliases)

  return uniqueStrings(files)
}

function currentLegoToolAtomSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const atoms = "packages/lego-tools/src/tool-atoms.ts"
  const defaults = "packages/lego-tools/src/default-tools.ts"
  const ports = "packages/lego-tools/src/ports.ts"
  const fixtures = "packages/lego-tools/src/port-fixtures.ts"
  const files = [atoms, fixtures]

  if (id.includes("tool-pack") || id.includes("tool.executor") || id.includes("tool.definition")) files.push(defaults, ports)
  if (id.includes("filesystem") || id.includes("process-runner")) files.push(ports, defaults)
  if (id.includes("permission") || id.includes("schema")) files.push(ports, defaults)

  return uniqueStrings(files)
}

function currentLegoToolCadenceSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const cadence = "packages/lego-tools/src/cadence-atoms.ts"
  const fixtures = "packages/lego-tools/src/port-fixtures.ts"
  const defaults = "packages/lego-tools/src/default-tools.ts"
  const batchScheduler = "packages/lego-agent-loop/src/cadence/tool-batch-scheduler.ts"
  const toolStep = "packages/lego-agent-loop/src/loop/tool-step.ts"
  const files = [cadence, fixtures]

  if (id.includes("batch-scheduler")) files.push(batchScheduler, toolStep)
  if (id.includes("schema")) files.push(defaults)
  if (id.includes("result-projector")) files.push(defaults, toolStep)

  return uniqueStrings(files)
}

function currentLegoConfigSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const atoms = "packages/lego-config/src/config-atoms.ts"
  const runtime = "packages/lego-config/src/config.ts"
  const fixtures = "packages/lego-config/src/port-fixtures.ts"

  if (id.includes(".config.source") || id.startsWith("config.source.")) return uniqueStrings([atoms, runtime, fixtures])
  if (id.includes(".config.precedence") || id.startsWith("config.merge.")) return uniqueStrings([atoms, runtime, fixtures])
  if (id.includes(".config.validator") || id.startsWith("config.validator.")) return uniqueStrings([atoms, fixtures])
  return uniqueStrings([atoms, fixtures])
}

function currentLegoSessionAtomSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const shared = currentLegoSessionSharedSourceFiles()
  if (id.includes("message-part-projector")) return currentLegoSessionMessagePartSourceFilesForAtom(atom)

  if (id.includes("jsonl")) return uniqueStrings([shared.atoms, shared.jsonlTree, shared.types, shared.utils])
  if (id.includes("sqlite") || id.includes("projection")) return uniqueStrings([shared.atoms, shared.projection, shared.types, shared.utils])
  if (id.includes("id-generator")) return uniqueStrings([shared.atoms, shared.types, shared.utils])
  if (id.includes("event-log")) return uniqueStrings([shared.atoms, shared.types, shared.utils])
  if (id.includes("reader") || id.includes("writer") || id.includes("message-store")) return uniqueStrings([shared.atoms, shared.types, shared.utils])
  if (id.includes("branch") || id.includes("fork") || id.includes("diff")) return uniqueStrings([shared.atoms, shared.types, shared.utils])
  if (id.includes("context") || id.includes("compaction") || id.includes("pagination")) return uniqueStrings([shared.atoms, shared.types, shared.utils])
  if (id.includes("store")) return uniqueStrings([shared.atoms, shared.types, shared.utils])
  return uniqueStrings([shared.atoms, shared.types, shared.utils])
}

function currentLegoSessionMessagePartSourceFilesForAtom(_atom: AssemblyContractAtom): string[] {
  const shared = currentLegoSessionSharedSourceFiles()
  return uniqueStrings([shared.messagePartProjector, shared.atoms, shared.types])
}

function currentProductSessionPersonalitySourceFilesForAtom(atom: AssemblyContractAtom, product: CurrentModulePlaceholderAuditProduct): string[] {
  const id = atom.id
  const shared = currentLegoSessionSharedSourceFiles()
  const productSource = productSessionPersonalitySourceFile(product)
  const files = [productSource, shared.atoms, shared.types, shared.utils]
  if (product === "pi-mono" || product === "nanobot") files.push(shared.jsonlTree)
  else files.push(shared.projection)
  if (id.includes("message-part") || id.includes("projector")) files.push(shared.messagePartProjector)
  if (id.includes("branch") || id.includes("fork") || id.includes("context") || id.includes("compaction") || id.includes("pagination")) {
    files.push(shared.jsonlTree, shared.projection)
  }
  if (id.includes("store") || id.includes("message") || id.includes("event")) files.push(shared.jsonlTree, shared.projection)
  return uniqueStrings(files)
}

function productSessionPersonalitySourceFile(product: CurrentModulePlaceholderAuditProduct): string {
  if (product === "opencode") return "packages/adapters-opencode/src/session-personality.ts"
  if (product === "pi-mono") return "packages/adapters-pi/src/session-personality.ts"
  if (product === "nanobot") return "packages/adapters-nanobot/src/session-personality.ts"
  return "packages/adapters-hermes/src/session-personality.ts"
}

function currentLegoSessionSharedSourceFiles(): {
  atoms: string
  jsonlTree: string
  messagePartProjector: string
  projection: string
  types: string
  utils: string
} {
  return {
    atoms: "packages/lego-session/src/atoms.ts",
    jsonlTree: "packages/lego-session/src/jsonl-tree.ts",
    messagePartProjector: "packages/lego-session/src/message-part-projector.ts",
    projection: "packages/lego-session/src/projection.ts",
    types: "packages/lego-session/src/types.ts",
    utils: "packages/lego-session/src/utils.ts",
  }
}

function currentLegoUISourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const atoms = "packages/lego-ui/src/ui-atoms.ts"
  const eventLoop = "packages/lego-ui/src/tui-event-loop.ts"
  const transportUI = "packages/lego-ui/src/ui.ts"
  const fixtures = "packages/lego-ui/src/port-fixtures.ts"

  if (id === "ui.event-loop.shared-tui" || id.endsWith(".tui.shell")) return uniqueStrings([atoms, eventLoop, fixtures])
  if (id.endsWith(".ui.renderer") || id.startsWith("ui.renderer.")) return uniqueStrings([atoms, transportUI, fixtures])
  if (id.endsWith(".ui.command-router") || id === "ui.command-router.common") return uniqueStrings([atoms, eventLoop, fixtures])
  if (id.endsWith(".ui.input-normalizer") || id === "ui.input-normalizer.common") return uniqueStrings([atoms, eventLoop, fixtures])
  if (id.endsWith(".ui.theme-registry") || id === "ui.theme-registry.common") return uniqueStrings([atoms, eventLoop, fixtures])
  if (id.endsWith(".ui.snapshot") || id === "ui.snapshot.common") return uniqueStrings([atoms, eventLoop, transportUI, fixtures])
  return uniqueStrings([atoms, fixtures])
}

function currentOpenCodePluginAtomSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const shared = currentProductAdapterSharedSourceFiles()
  const hookFiles = [shared.hookFixtures, ...shared.hookImplementationFiles]
  const core = "packages/adapters-opencode/src/plugin-atoms.ts"
  const api = "packages/adapters-opencode/src/plugin-adapter.ts"
  const loader = "packages/adapters-opencode/src/plugin-loader.ts"
  const builtinProviders = "packages/adapters-opencode/src/builtin-providers.ts"
  const workspace = "packages/adapters-opencode/src/opencode-workspace.ts"
  const commandRegistry = "packages/adapters-opencode/src/opencode-command-registry.ts"
  const toolRegistry = "packages/adapters-opencode/src/opencode-plugin-tool-registry.ts"

  if (id === "opencode.plugin.loader") return uniqueStrings([core, api, loader, ...hookFiles])
  if (id === "opencode.registry.command") return uniqueStrings([commandRegistry, core, api, ...hookFiles])
  if (id === "opencode.plugin.registry-bridge") return uniqueStrings([toolRegistry, core, api, shared.toolFixtures, ...hookFiles])
  if (id.startsWith("opencode.plugin.") || id.startsWith("opencode.hook.") || id.startsWith("opencode.registry.")) {
    const files = [core, api, ...hookFiles]
    if (id.includes("tool") || id.includes("registry-bridge")) files.push(shared.toolFixtures)
    if (id.includes("provider")) files.push(shared.providerFixtures, builtinProviders)
    if (id.includes("ui")) files.push(shared.uiFixtures)
    return uniqueStrings(files)
  }
  if (id.startsWith("opencode.tool.") || id === "opencode.permission.ask-bridge" || id === "opencode.plugin.permission-bridge" || id === "opencode.workspace-filesystem-bridge") {
    return uniqueStrings([core, api, shared.toolFixtures, ...hookFiles])
  }
  if (id === "opencode.shell.env-bridge") return uniqueStrings([core, api, workspace, shared.toolFixtures])
  if (id.startsWith("opencode.provider.")) return uniqueStrings([core, api, builtinProviders, shared.providerFixtures])
  if (id === "opencode.tui.shell") return uniqueStrings([core, shared.uiFixtures, shared.atomCatalog])
  if (isProductAdapterCatalogDescriptor(id, "opencode") || id.startsWith("opencode.task.")) return uniqueStrings([core, shared.contractsFixtures, shared.atomCatalog, shared.bundleCatalog])
  if (isProductAdapterBehaviorContractDescriptor(id, "opencode")) return uniqueStrings([core, shared.contractsFixtures])
  return uniqueStrings([core])
}

function currentPiExtensionAtomSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const shared = currentProductAdapterSharedSourceFiles()
  const hookFiles = [shared.hookFixtures, ...shared.hookImplementationFiles]
  const core = "packages/adapters-pi/src/extension-atoms.ts"
  const api = "packages/adapters-pi/src/extension-adapter.ts"
  const loader = "packages/adapters-pi/src/extension-loader.ts"

  if (id === "pi.extension.loader") return uniqueStrings([core, api, loader, ...hookFiles])
  if (id.startsWith("pi.extension.") || id.startsWith("pi.hook.") || id.startsWith("pi.registry.")) {
    const files = [core, api, ...hookFiles]
    if (id.includes("tool") || id.includes("typebox") || id.includes("register-tool")) files.push(shared.toolFixtures)
    if (id.includes("provider")) files.push(shared.providerFixtures)
    if (id.includes("ui") || id.includes("message-renderer")) files.push(shared.uiFixtures)
    if (id.includes("runtime-event")) files.push(shared.contractsFixtures)
    return uniqueStrings(files)
  }
  if (id.startsWith("pi.tool.") || id === "pi.permission.event-bridge" || id === "pi.process-runner-bridge" || id === "pi.workspace-filesystem-bridge") {
    return uniqueStrings([core, api, shared.toolFixtures, ...hookFiles])
  }
  if (id.startsWith("pi.provider.")) return uniqueStrings([core, api, shared.providerFixtures])
  if (id === "pi.event.runtime-bridge") return uniqueStrings([core, api, shared.contractsFixtures])
  if (id === "pi.tui.shell") return uniqueStrings([core, shared.uiFixtures, shared.atomCatalog])
  if (isProductAdapterCatalogDescriptor(id, "pi")) return uniqueStrings([core, shared.contractsFixtures, shared.atomCatalog, shared.bundleCatalog])
  if (isProductAdapterBehaviorContractDescriptor(id, "pi")) return uniqueStrings([core, shared.contractsFixtures])
  return uniqueStrings([core])
}

function currentNanobotAtomSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const shared = currentProductAdapterSharedSourceFiles()
  const hookFiles = [shared.hookFixtures, ...shared.hookImplementationFiles]
  const core = "packages/adapters-nanobot/src/nanobot-atoms.ts"

  if (id === "nanobot.plugin.loader") return uniqueStrings([core, ...hookFiles])
  if (id.startsWith("nanobot.plugin.") || id.startsWith("nanobot.hook.") || id.startsWith("nanobot.registry.")) {
    const files = [core, ...hookFiles]
    if (id.includes("tool") || id === "nanobot.tool.registry-bridge") files.push(shared.toolFixtures)
    if (id.includes("provider")) files.push(shared.providerFixtures)
    if (id.includes("ui")) files.push(shared.uiFixtures)
    return uniqueStrings(files)
  }
  if (id.startsWith("nanobot.tool.") || id === "nanobot.permission.policy-bridge" || id === "nanobot.process-runner-bridge" || id === "nanobot.workspace-filesystem-bridge") {
    return uniqueStrings([core, shared.toolFixtures, ...hookFiles])
  }
  if (id.startsWith("nanobot.provider.")) return uniqueStrings([core, shared.providerFixtures])
  if (id === "nanobot.event.bus-bridge") return uniqueStrings([core, shared.contractsFixtures])
  if (id === "nanobot.tui.shell") return uniqueStrings([core, shared.uiFixtures, shared.atomCatalog])
  if (isProductAdapterCatalogDescriptor(id, "nanobot") || id.startsWith("nanobot.task.")) return uniqueStrings([core, shared.contractsFixtures, shared.atomCatalog, shared.bundleCatalog])
  if (isProductAdapterBehaviorContractDescriptor(id, "nanobot")) return uniqueStrings([core, shared.contractsFixtures])
  return uniqueStrings([core])
}

function currentHermesAtomSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const id = atom.id
  const {
    atomCatalog,
    bundleCatalog,
    contractsFixtures,
    hookFixtures,
    hookImplementationFiles,
    providerFixtures,
    toolFixtures,
    uiFixtures,
  } = currentProductAdapterSharedSourceFiles()
  const hookFiles = [hookFixtures, ...hookImplementationFiles]
  const hermesTypes = "packages/adapters-hermes/src/atoms/types.ts"
  const hermesProfile = "packages/adapters-hermes/src/atoms/profile.ts"
  const hermesPlugin = "packages/adapters-hermes/src/atoms/plugin.ts"
  const hermesTool = "packages/adapters-hermes/src/atoms/tool.ts"
  const hermesProvider = "packages/adapters-hermes/src/atoms/provider.ts"
  const hermesUI = "packages/adapters-hermes/src/atoms/ui.ts"

  if (id === "hermes.plugin.loader") return uniqueStrings([hermesPlugin, hermesTypes, hermesProfile, ...hookFiles])
  if (id === "hermes.tool.registry-bridge") return uniqueStrings([hermesTool, hermesTypes, hermesProfile, ...hookFiles, toolFixtures])
  if (id === "hermes.provider.model-registry") return uniqueStrings([hermesProvider, hermesTypes, hermesProfile, providerFixtures])
  if (id === "hermes.tui.shell") return uniqueStrings([hermesUI, hermesTypes, hermesProfile, uiFixtures, atomCatalog])

  if (id.startsWith("hermes.plugin.") || id.startsWith("hermes.hook.") || id.startsWith("hermes.registry.")) {
    const files = [hermesPlugin, hermesTypes, ...hookFiles]
    if (id === "hermes.registry.tool-definition") files.push(hermesTool, toolFixtures)
    return uniqueStrings(files)
  }
  if (id.startsWith("hermes.provider.")) return uniqueStrings([hermesProvider, hermesTypes, hermesProfile, providerFixtures])
  if (id.startsWith("hermes.tool.") || id === "hermes.permission.hook-bridge" || id === "hermes.process-runner-bridge" || id === "hermes.workspace-filesystem-bridge") {
    return uniqueStrings([hermesTool, hermesTypes, hermesProfile, toolFixtures])
  }
  if (isProductAdapterCatalogDescriptor(id, "hermes")) {
    return uniqueStrings([hermesTypes, hermesProfile, contractsFixtures, atomCatalog, bundleCatalog])
  }
  if (isProductAdapterBehaviorContractDescriptor(id, "hermes")) return uniqueStrings([hermesTypes, hermesProfile, contractsFixtures])
  return uniqueStrings([hermesTypes, hermesProfile])
}

function currentProductAdapterSharedSourceFiles(): {
  atomCatalog: string
  bundleCatalog: string
  contractsFixtures: string
  hookFixtures: string
  hookImplementationFiles: string[]
  providerFixtures: string
  toolFixtures: string
  uiFixtures: string
} {
  return {
    atomCatalog: "packages/recipes/src/atom-catalog.ts",
    bundleCatalog: "packages/recipes/src/bundle-catalog.ts",
    contractsFixtures: "packages/contracts/src/port-fixtures.ts",
    hookFixtures: "packages/lego-hooks/src/port-fixtures.ts",
    hookImplementationFiles: [
      "packages/lego-hooks/src/host.ts",
      "packages/lego-hooks/src/hook-atoms.ts",
      "packages/lego-hooks/src/types.ts",
      "packages/lego-hooks/src/aliases.ts",
    ],
    providerFixtures: "packages/lego-provider/src/port-fixtures.ts",
    toolFixtures: "packages/lego-tools/src/port-fixtures.ts",
    uiFixtures: "packages/lego-ui/src/port-fixtures.ts",
  }
}

function isProductAdapterCatalogDescriptor(id: string, prefix: string): boolean {
  return (
    id.startsWith(`${prefix}.block.`) ||
    id.startsWith(`${prefix}.capability.`) ||
    id.startsWith(`${prefix}.recipe.`) ||
    id.startsWith(`${prefix}.conformance.`)
  )
}

function isProductAdapterBehaviorContractDescriptor(id: string, prefix: string): boolean {
  return (
    id.startsWith(`${prefix}.identity.`) ||
    id.startsWith(`${prefix}.event.`) ||
    id.startsWith(`${prefix}.trace.`)
  )
}

function currentAgentLoopSourceFilesForAtom(atom: AssemblyContractAtom): string[] {
  const productTurnFiles = [
    "packages/lego-agent-loop/src/product-turn/atoms.ts",
    "packages/lego-agent-loop/src/product-turn/profiles.ts",
    "packages/lego-agent-loop/src/product-turn/runtime-context.ts",
  ]
  const loopDriver = "packages/lego-agent-loop/src/loop/run-turn.ts"
  const id = atom.id
  if (id.includes("cadence") || id.includes("request-boundary") || id.includes("final-summary")) {
    return uniqueStrings([
      "packages/lego-agent-loop/src/cadence/replay.ts",
      "packages/lego-agent-loop/src/cadence/projectors.ts",
      "packages/lego-agent-loop/src/cadence/request-boundary.ts",
      "packages/lego-agent-loop/src/cadence/final-summary.ts",
      "packages/lego-agent-loop/src/cadence/tool-batch-scheduler.ts",
      "packages/lego-agent-loop/src/cadence/types.ts",
    ])
  }
  if (id.includes("context-builder")) return uniqueStrings([...productTurnFiles, "packages/lego-agent-loop/src/context-builder.ts", loopDriver])
  if (id.includes("provider-request-builder") || id.includes("provider-stream-runner") || id.includes("stream-reducer")) return uniqueStrings([...productTurnFiles, "packages/lego-agent-loop/src/loop/provider-step.ts", loopDriver])
  if (id.includes("tool-call-planner") || id.includes("tool-executor")) return uniqueStrings([...productTurnFiles, "packages/lego-agent-loop/src/loop/tool-step.ts", loopDriver])
  if (id.includes("result-recorder")) return uniqueStrings([...productTurnFiles, "packages/lego-agent-loop/src/loop/summary-step.ts", loopDriver])
  if (id.includes("retry-policy") || id.includes("continuation-policy") || id.includes("stop-condition")) return uniqueStrings([...productTurnFiles, "packages/lego-agent-loop/src/loop/summary-step.ts", loopDriver])
  if (id.includes("compaction-policy")) return uniqueStrings([...productTurnFiles, "packages/lego-agent-loop/src/context-builder.ts", "packages/lego-agent-loop/src/loop/summary-step.ts", loopDriver])
  if (id.includes("input-normalizer") || id.includes("prompt-assembler")) return uniqueStrings([...productTurnFiles, loopDriver])
  return uniqueStrings([...productTurnFiles, loopDriver])
}

function manualPackageSourceForPackage(packagePath: string): CurrentModuleManualPackageSourceEntry | undefined {
  return manualPackageSourceCatalog[packagePath as (typeof packageCatalog)[number]]
}

function sourceVerificationStatusForPackage(
  atoms: AssemblyContractAtom[],
  transitionCount: number,
  manualPackageSource?: CurrentModuleManualPackageSourceEntry | undefined,
): CurrentModuleSourceVerificationStatus {
  if (atoms.length === 0) return manualPackageSource && manualPackageSource.currentSourceFiles.length > 0 ? "source-mapped-no-exact-fixture" : "manual-source-check-pending"
  const statuses = atoms.map((atom) => sourceVerificationStatusForAtom(executableLevelForKnownAtom(atom), atom.knownLossiness, atom.nativeEvidenceRefs, atom.fixtureIDs, atom))
  if (statuses.includes("preview-only-source")) return "preview-only-source"
  if (statuses.includes("semantic-fixture-with-lossiness")) return "semantic-fixture-with-lossiness"
  if (statuses.includes("metadata-overlay-source")) return "metadata-overlay-source"
  if (statuses.includes("source-mapped-no-exact-fixture")) return "source-mapped-no-exact-fixture"
  if (statuses.includes("product-native-exact-fixture")) return "product-native-exact-fixture"
  return transitionCount > 0 ? "source-mapped-no-exact-fixture" : "manual-source-check-pending"
}

function sourceVerificationStatusForTransitions(transitions: Todo27NativeRewriteInventoryItem[], atomByProductAndID: Map<string, AssemblyContractAtom>): CurrentModuleSourceVerificationStatus {
  if (transitions.length === 0) return "manual-source-check-pending"
  const statuses = transitions.map((item) =>
    sourceVerificationStatusForAtom(item.implementationLevel, item.knownLossiness, item.nativeEvidenceRefs, item.fixtureIDs, atomByProductAndID.get(`${item.product}:${item.atomID}`)),
  )
  if (statuses.includes("preview-only-source")) return "preview-only-source"
  if (statuses.includes("semantic-fixture-with-lossiness")) return "semantic-fixture-with-lossiness"
  if (statuses.includes("metadata-overlay-source")) return "metadata-overlay-source"
  if (statuses.includes("source-mapped-no-exact-fixture")) return "source-mapped-no-exact-fixture"
  if (statuses.includes("product-native-exact-fixture")) return "product-native-exact-fixture"
  return "source-mapped-no-exact-fixture"
}

function transitionItemsForSummaryDivergence(
  transitions: Todo27NativeRewriteInventoryItem[],
  behaviorStatus: CurrentModulePinnedUpstreamBehaviorStatus,
  atomByProductAndID: Map<string, AssemblyContractAtom>,
): Todo27NativeRewriteInventoryItem[] {
  if (transitions.length === 0) return []
  if (behaviorStatus === "pinned-native-exact" || behaviorStatus === "not-product-scoped") return []

  const matchingTransitions = transitions.filter((item) => {
    const itemBehaviorStatus = pinnedBehaviorStatusForTransitionItem(item, atomByProductAndID)
    if (behaviorStatus === "pinned-partial-or-lossy") {
      return itemBehaviorStatus === "pinned-partial-or-lossy" || itemBehaviorStatus === "manual-behavior-check-pending"
    }
    if (behaviorStatus === "pinned-metadata-only") return itemBehaviorStatus === "pinned-metadata-only"
    if (behaviorStatus === "pinned-preview-only") return itemBehaviorStatus === "pinned-preview-only"
    if (behaviorStatus === "pinned-common-not-product-native") return itemBehaviorStatus === "pinned-common-not-product-native"
    if (behaviorStatus === "manual-behavior-check-pending") return itemBehaviorStatus === "manual-behavior-check-pending"
    return itemBehaviorStatus === behaviorStatus
  })

  return matchingTransitions.length > 0 ? matchingTransitions : transitions
}

function pinnedBehaviorStatusForTransitionItem(
  item: Todo27NativeRewriteInventoryItem,
  atomByProductAndID: Map<string, AssemblyContractAtom>,
): CurrentModulePinnedUpstreamBehaviorStatus {
  const sourceVerificationStatus = sourceVerificationStatusForAtom(
    item.implementationLevel,
    item.knownLossiness,
    item.nativeEvidenceRefs,
    item.fixtureIDs,
    atomByProductAndID.get(`${item.product}:${item.atomID}`),
  )
  return pinnedBehaviorStatusForFacts({
    productScoped: true,
    mismatchKind: mismatchForImplementationLevel(item.implementationLevel),
    sourceVerificationStatus,
    implementationLevel: item.implementationLevel,
    knownLossiness: uniqueStrings(item.knownLossiness),
  })
}

function sourceVerificationStatusForAtom(
  implementationLevel: string,
  knownLossiness: string[],
  nativeEvidenceRefs: string[],
  fixtureIDs: string[],
  atom: AssemblyContractAtom | undefined,
): CurrentModuleSourceVerificationStatus {
  if (implementationLevel === "metadata-only") return "metadata-overlay-source"
  if (implementationLevel === "preview-shell") return "preview-only-source"
  const hasFixture = fixtureIDs.length > 0 || nativeEvidenceRefs.some((ref) => ref.includes("fixture") || ref.includes("replay") || ref.includes("pinned-asset"))
  if (implementationLevel === "native" && hasFixture && knownLossiness.length === 0) return "product-native-exact-fixture"
  if (hasFixture) return "semantic-fixture-with-lossiness"
  if (atom?.source) return "source-mapped-no-exact-fixture"
  return "manual-source-check-pending"
}

function pinnedBehaviorStatusForFacts(input: {
  productScoped: boolean
  mismatchKind: CurrentModuleMismatchKind
  sourceVerificationStatus: CurrentModuleSourceVerificationStatus
  implementationLevel?: string
  knownLossiness: string[]
}): CurrentModulePinnedUpstreamBehaviorStatus {
  if (!input.productScoped && input.mismatchKind !== "manual-source-check-required") return "not-product-scoped"
  if (input.mismatchKind === "manual-source-check-required" || input.sourceVerificationStatus === "manual-source-check-pending") return "manual-behavior-check-pending"
  if (input.mismatchKind === "metadata-only" || input.sourceVerificationStatus === "metadata-overlay-source" || input.implementationLevel === "metadata-only") return "pinned-metadata-only"
  if (input.mismatchKind === "preview-only" || input.sourceVerificationStatus === "preview-only-source" || input.implementationLevel === "preview-shell") return "pinned-preview-only"
  if (input.implementationLevel === "native" && input.sourceVerificationStatus === "product-native-exact-fixture" && input.knownLossiness.length === 0) return "pinned-native-exact"
  if (input.mismatchKind === "common-shared-not-product-native") return "pinned-common-not-product-native"
  if (input.knownLossiness.length > 0) return "pinned-partial-or-lossy"
  if (input.mismatchKind === "compatible-bridge" || input.mismatchKind === "profile-compatible-common-runner" || input.mismatchKind === "native-like-projection" || input.mismatchKind === "lossy-compatible-binding") {
    return "pinned-partial-or-lossy"
  }
  return "manual-behavior-check-pending"
}

function pinnedDivergencesForFacts(input: {
  behaviorStatus: CurrentModulePinnedUpstreamBehaviorStatus
  kind: CurrentModulePlaceholderAuditItemKind
  plane?: AssemblyContractPlane | undefined
  atomID?: string | undefined
  portID?: string | undefined
  mismatchKind: CurrentModuleMismatchKind
  implementationLevel?: string | undefined
  sourceVerificationStatus: CurrentModuleSourceVerificationStatus
  knownLossiness: string[]
  evidenceRefs: string[]
  upstreamSourceLocations?: CurrentModuleUpstreamSourceLocation[] | undefined
  currentSourceRefs?: string[] | undefined
  currentSourcePaths?: string[] | undefined
  currentSourceFiles?: string[] | undefined
  overrideDivergenceKind?: CurrentModulePinnedUpstreamDivergenceKind | undefined
  overrideUpstreamAnchorRefs?: string[] | undefined
  packagePath?: string | undefined
  itemID?: string | undefined
}): CurrentModulePinnedUpstreamDivergence[] {
  if (input.behaviorStatus === "not-product-scoped" || input.behaviorStatus === "pinned-native-exact") return []
  const primaryKind = input.overrideDivergenceKind ?? primaryDivergenceKind(input)
  const detail = divergenceDetailForKind(primaryKind)
  const evidenceRefs = uniqueStrings(input.evidenceRefs.length > 0 ? input.evidenceRefs : [`audit:${input.kind}:${input.plane ?? "no-plane"}`])
  return [
    {
      kind: primaryKind,
      field: detail.field,
      upstreamExpectation: detail.upstreamExpectation,
      currentEvidence: currentEvidenceForDivergence(input),
      status: input.behaviorStatus === "manual-behavior-check-pending" ? "manual-detail-pending" : input.behaviorStatus === "pinned-partial-or-lossy" ? "partial-evidence" : "known-divergence",
      evidenceRefs,
      upstreamAnchorRefs: upstreamAnchorRefsForDivergence({
        upstreamSourceLocations: input.upstreamSourceLocations ?? [],
        evidenceRefs,
        overrideUpstreamAnchorRefs: input.overrideUpstreamAnchorRefs,
        kind: input.kind,
        plane: input.plane,
        itemID: input.itemID,
      }),
      currentAnchorRefs: currentAnchorRefsForDivergence({
        currentSourceRefs: input.currentSourceRefs ?? [],
        currentSourcePaths: input.currentSourcePaths ?? [],
        currentSourceFiles: input.currentSourceFiles ?? [],
        packagePath: input.packagePath,
        atomID: input.atomID,
        portID: input.portID,
        itemID: input.itemID,
      }),
      requiredEvidence: requiredEvidenceForDivergence(primaryKind),
      nextVerification: nextVerificationForDivergence(primaryKind),
      exactDiffStatus: exactDiffStatusForDivergence(primaryKind, input.sourceVerificationStatus, input.behaviorStatus),
      fixtureDiffTarget: fixtureDiffTargetForDivergence(primaryKind),
      comparisonDimensions: comparisonDimensionsForDivergence(primaryKind),
      currentCoverage: currentCoverageForExactDiff(input.sourceVerificationStatus, input.behaviorStatus, evidenceRefs),
    },
  ]
}

function primaryDivergenceKind(input: {
  behaviorStatus: CurrentModulePinnedUpstreamBehaviorStatus
  plane?: AssemblyContractPlane | undefined
  atomID?: string | undefined
  portID?: string | undefined
  mismatchKind: CurrentModuleMismatchKind
  implementationLevel?: string | undefined
  knownLossiness: string[]
}): CurrentModulePinnedUpstreamDivergenceKind {
  if (input.behaviorStatus === "pinned-metadata-only") return "metadata-overlay-only"
  if (input.behaviorStatus === "pinned-preview-only") return "preview-surface-only"
  if (input.behaviorStatus === "local-evidence-tool-only") return "local-evidence-tool-only"
  if (input.behaviorStatus === "compatibility-export-only") return "compatibility-export-only"
  if (input.behaviorStatus === "pinned-common-not-product-native") return "common-provider-not-product-native"
  if (input.behaviorStatus === "manual-behavior-check-pending") return "manual-behavior-check-required"
  if (input.implementationLevel === "profile-compatible" || input.mismatchKind === "profile-compatible-common-runner" || input.knownLossiness.some((loss) => loss.includes("common-runner") || loss.includes("shared-turn-profile"))) return "product-turn-common-runner"
  if (input.atomID?.includes("request-boundary") || input.atomID?.includes("final-summary") || input.atomID?.includes("batch-scheduler") || input.knownLossiness.some((loss) => loss.includes("cadence") || loss.includes("native-event-timing-not-replayed"))) return "cadence-timing-partial"
  if (input.plane === "prompt") return "prompt-family-partial"
  if (input.plane === "provider") return "provider-stream-projection"
  if (input.plane === "tool") return "tool-contract-projection"
  if (input.plane === "session") return "session-storage-projection"
  if (input.plane === "hook") return "hook-plugin-bridge"
  if (input.plane === "config") return "config-precedence-bridge"
  if (input.plane === "runtime") return "runtime-acceptance-policy"
  if (input.plane === "ui") return "ui-surface-bridge"
  if (input.plane === "product") return "product-shell-bridge"
  if (input.plane === "event") return "event-envelope-bridge"
  if (input.plane === "identity") return "identity-format-bridge"
  if (input.plane === "trace") return "trace-projection"
  if (input.plane === "foundation") return "foundation-compatibility-overlay"
  if (input.knownLossiness.some((loss) => loss.includes("prompt"))) return "prompt-family-partial"
  if (input.knownLossiness.some((loss) => loss.includes("provider"))) return "provider-stream-projection"
  if (input.knownLossiness.some((loss) => loss.includes("tool"))) return "tool-contract-projection"
  if (input.knownLossiness.some((loss) => loss.includes("session"))) return "session-storage-projection"
  if (input.knownLossiness.some((loss) => loss.includes("runtime"))) return "runtime-acceptance-policy"
  return "generic-compatible-bridge"
}

function divergenceDetailForKind(kind: CurrentModulePinnedUpstreamDivergenceKind): {
  field: string
  upstreamExpectation: string
} {
  if (kind === "prompt-family-partial") return { field: "prompt family / ordering / branch matrix", upstreamExpectation: "Match pinned upstream system/platform/mode/skill/resource prompt output and ordering." }
  if (kind === "product-turn-common-runner") return { field: "turn loop factory and cadence", upstreamExpectation: "Use product-native turn loop semantics instead of common runner plus product profile." }
  if (kind === "cadence-timing-partial") return { field: "request boundary / tool batch / final summary timing", upstreamExpectation: "Replay pinned upstream event timing, batching, continuation, and summary side effects." }
  if (kind === "provider-stream-projection") return { field: "provider request, stream frame, retry/error/cancel, usage accounting", upstreamExpectation: "Preserve pinned upstream provider registry and raw streaming semantics." }
  if (kind === "tool-contract-projection") return { field: "tool schema, permission, progress, result envelope", upstreamExpectation: "Preserve pinned upstream tool definitions and result/progress envelopes." }
  if (kind === "session-storage-projection") return { field: "session store, message parts, branching, compaction records", upstreamExpectation: "Round-trip pinned upstream session storage and projection schema without lossy fields." }
  if (kind === "hook-plugin-bridge") return { field: "plugin/extension loader, event mapper, registries", upstreamExpectation: "Match pinned upstream plugin/extension lifecycle, event mapping, and registry behavior." }
  if (kind === "config-precedence-bridge") return { field: "config discovery, precedence, validation", upstreamExpectation: "Match pinned upstream config source order, merge strategy, and validation behavior." }
  if (kind === "runtime-acceptance-policy") return { field: "runtime lifecycle, acceptance, stop/continue side effects", upstreamExpectation: "Match pinned upstream runtime lifecycle and acceptance timing." }
  if (kind === "ui-surface-bridge") return { field: "UI/TUI event protocol, renderer, snapshot", upstreamExpectation: "Match pinned upstream interactive UI/TUI protocol and rendering behavior." }
  if (kind === "product-shell-bridge") return { field: "CLI/API/server/TUI/Web/product shell transcript", upstreamExpectation: "Match pinned upstream product shell routes, commands, PTY/API transcript, and session readback." }
  if (kind === "event-envelope-bridge") return { field: "event envelope fields, order, persistence", upstreamExpectation: "Preserve pinned upstream event field shape, ordering, and persistence semantics." }
  if (kind === "identity-format-bridge") return { field: "ID, clock, workspace, title format", upstreamExpectation: "Match pinned upstream identifier, timestamp, workspace, and title formatting semantics." }
  if (kind === "trace-projection") return { field: "trace/debug/flow projection", upstreamExpectation: "Use pinned upstream trace capture semantics instead of assembled Helix-only debug projection." }
  if (kind === "foundation-compatibility-overlay") return { field: "compatibility metadata and aliases", upstreamExpectation: "Keep compatibility aliases as metadata and do not treat them as native behavior." }
  if (kind === "common-provider-not-product-native") return { field: "common executable provider", upstreamExpectation: "Common provider may satisfy executable contract but must not be displayed as product-native parity." }
  if (kind === "metadata-overlay-only") return { field: "metadata overlay", upstreamExpectation: "Metadata may annotate BOM/graph but must not satisfy executable behavior." }
  if (kind === "preview-surface-only") return { field: "preview / inspection surface", upstreamExpectation: "Preview surface must remain demoted until backed by native UI/PTY/API evidence." }
  if (kind === "local-evidence-tool-only") return { field: "local evidence, report, or conformance tooling", upstreamExpectation: "Local audit/preview/test tooling has no pinned upstream harness implementation and must stay out of product-native parity counts." }
  if (kind === "compatibility-export-only") return { field: "compatibility package export", upstreamExpectation: "Package exports may mirror a plugin/extension API name but do not implement the pinned upstream plugin or extension lifecycle." }
  if (kind === "manual-behavior-check-required") return { field: "manual source/API behavior check", upstreamExpectation: "Inspect package API and pinned upstream behavior directly; assembly evidence is insufficient." }
  return { field: "compatible bridge behavior", upstreamExpectation: "Compare current bridge against pinned upstream source and either rewrite or keep explicitly downgraded." }
}

function currentEvidenceForDivergence(input: {
  behaviorStatus: CurrentModulePinnedUpstreamBehaviorStatus
  kind: CurrentModulePlaceholderAuditItemKind
  plane?: AssemblyContractPlane | undefined
  atomID?: string | undefined
  portID?: string | undefined
  mismatchKind: CurrentModuleMismatchKind
  implementationLevel?: string | undefined
  knownLossiness: string[]
}): string {
  const parts = [
    input.kind,
    input.plane ? `plane:${input.plane}` : undefined,
    input.atomID ? `atom:${input.atomID}` : undefined,
    input.portID ? `port:${input.portID}` : undefined,
    input.implementationLevel ? `level:${input.implementationLevel}` : undefined,
    `mismatch:${input.mismatchKind}`,
    `behavior:${input.behaviorStatus}`,
    input.knownLossiness.length > 0 ? `lossiness:${input.knownLossiness.slice(0, 4).join(",")}` : undefined,
  ]
  return uniqueStrings(parts).join(" | ")
}

function upstreamAnchorRefsForDivergence(input: {
  upstreamSourceLocations: CurrentModuleUpstreamSourceLocation[]
  evidenceRefs: string[]
  overrideUpstreamAnchorRefs?: string[] | undefined
  kind: CurrentModulePlaceholderAuditItemKind
  plane?: AssemblyContractPlane | undefined
  itemID?: string | undefined
}): string[] {
  if (input.overrideUpstreamAnchorRefs && input.overrideUpstreamAnchorRefs.length > 0) return uniqueStrings(input.overrideUpstreamAnchorRefs)
  const anchors = input.upstreamSourceLocations.map(
    (location) => `upstream:${location.repo}@${location.ref}:${location.path}${location.symbols.length > 0 ? `#${location.symbols.join(",")}` : ""}`,
  )
  if (anchors.length > 0) return uniqueStrings(anchors)
  const upstreamEvidenceRefs = input.evidenceRefs.filter((ref) => ref.includes("upstream") || ref.includes("native-source"))
  if (upstreamEvidenceRefs.length > 0) return uniqueStrings(upstreamEvidenceRefs.map((ref) => `upstream-evidence:${ref}`))
  return [`upstream-anchor:manual-pending:${input.itemID ?? `${input.kind}:${input.plane ?? "no-plane"}`}`]
}

function currentAnchorRefsForDivergence(input: {
  currentSourceRefs: string[]
  currentSourcePaths: string[]
  currentSourceFiles: string[]
  packagePath?: string | undefined
  atomID?: string | undefined
  portID?: string | undefined
  itemID?: string | undefined
}): string[] {
  const anchors = [
    ...input.currentSourceFiles.map((file) => `current:${file}`),
    ...input.currentSourcePaths.map((path) => `current-path:${path}`),
    ...input.currentSourceRefs.map((ref) => `current-ref:${ref}`),
    input.packagePath ? `current-package:${input.packagePath}` : undefined,
    input.atomID ? `current-atom:${input.atomID}` : undefined,
    input.portID && input.atomID ? `current-binding:${input.portID}->${input.atomID}` : undefined,
    input.portID && !input.atomID ? `current-port:${input.portID}` : undefined,
  ]
  const compacted = uniqueStrings(anchors)
  return compacted.length > 0 ? compacted : [`current-anchor:manual-pending:${input.itemID ?? "unknown-item"}`]
}

function requiredEvidenceForDivergence(kind: CurrentModulePinnedUpstreamDivergenceKind): string {
  if (kind === "prompt-family-partial") return "native prompt fixture matrix covering upstream output, branch selection, ordering, and negative identity gates"
  if (kind === "product-turn-common-runner") return "native turn replay covering request construction, tool loop, session writeback, cadence, retry, continuation, and stop behavior"
  if (kind === "cadence-timing-partial") return "event-timing replay fixture covering request boundary, tool batch order, final summary, continuation, and side effects"
  if (kind === "provider-stream-projection") return "raw provider frame replay covering request shape, stream parser, retry, error, cancel, and usage accounting"
  if (kind === "tool-contract-projection") return "tool schema/result/progress/permission fixture covering upstream envelope fields and denial behavior"
  if (kind === "session-storage-projection") return "native session storage round-trip fixture covering message parts, branches, compaction records, and lossy field negatives"
  if (kind === "hook-plugin-bridge") return "plugin or extension lifecycle fixture covering load order, hook timing, event mapping, registry state, and failure paths"
  if (kind === "config-precedence-bridge") return "config precedence fixture covering discovery paths, merge order, defaults, validation, and product-specific overrides"
  if (kind === "runtime-acceptance-policy") return "runtime acceptance replay covering lifecycle start/stop, accept/continue timing, process cleanup, and evidence persistence"
  if (kind === "ui-surface-bridge") return "UI/TUI protocol fixture covering input events, rendering snapshots, state transitions, focus, and resize behavior"
  if (kind === "product-shell-bridge") return "CLI/API/PTY transcript fixture plus session readback proving upstream command, route, and surface behavior"
  if (kind === "event-envelope-bridge") return "event envelope fixture covering field shape, order, persistence, and replay of upstream event streams"
  if (kind === "identity-format-bridge") return "identifier and formatting fixture covering IDs, timestamps, workspace paths, titles, and serialization"
  if (kind === "trace-projection") return "trace capture fixture covering upstream debug events, spans, redaction, ordering, and flow projection"
  if (kind === "foundation-compatibility-overlay") return "metadata-only proof showing aliases remain non-executable and cannot be counted as product-native behavior"
  if (kind === "common-provider-not-product-native") return "common-provider demotion proof plus product-specific fixture before any native parity upgrade"
  if (kind === "metadata-overlay-only") return "metadata overlay proof showing BOM/graph annotation without executable provider semantics"
  if (kind === "preview-surface-only") return "preview demotion proof plus native UI/PTY/API fixture before primary surface upgrade"
  if (kind === "local-evidence-tool-only") return "local-tool demotion proof showing CLI/docs/conformance code is evidence infrastructure, not an upstream harness module"
  if (kind === "compatibility-export-only") return "compatibility export guard comparing exported API surface names against pinned upstream plugin/extension APIs and blocking native lifecycle claims"
  if (kind === "manual-behavior-check-required") return "manual source/API inspection note with current package entrypoint, pinned upstream anchor, and follow-up fixture target"
  return "bridge comparison fixture covering current adapter output against pinned upstream behavior and explicit negative fallback gate"
}

function nextVerificationForDivergence(kind: CurrentModulePinnedUpstreamDivergenceKind): string {
  if (kind === "prompt-family-partial") return "Add or extend prompt-family conformance so upstream fixture ordering/branch drift fails verification."
  if (kind === "product-turn-common-runner") return "Add product-native turn replay conformance and fail if the common product profile is the only implementation."
  if (kind === "cadence-timing-partial") return "Add cadence replay snapshots and fail when timing, batching, continuation, or summary side effects are inferred."
  if (kind === "provider-stream-projection") return "Add raw provider stream replay and fail when frames are normalized without preserved upstream semantics."
  if (kind === "tool-contract-projection") return "Add tool contract envelope fixtures and fail when schema, permission, progress, or result fields are projected away."
  if (kind === "session-storage-projection") return "Add session storage round-trip fixtures and fail when message-part or branch fields are lossy."
  if (kind === "hook-plugin-bridge") return "Add plugin/extension lifecycle fixture and fail when hook order or registry effects are common-only."
  if (kind === "config-precedence-bridge") return "Add config precedence fixture and fail when source order, merge, or validation differs from pinned upstream."
  if (kind === "runtime-acceptance-policy") return "Add runtime acceptance replay and fail when stop/continue/process side effects are inferred."
  if (kind === "ui-surface-bridge") return "Add UI/TUI interaction replay and fail when preview/inspection protocol is treated as native surface."
  if (kind === "product-shell-bridge") return "Add shell transcript replay and fail when CLI/API/PTY behavior is common shell only."
  if (kind === "event-envelope-bridge") return "Add event envelope replay and fail when required upstream fields or ordering are dropped."
  if (kind === "identity-format-bridge") return "Add identity formatting fixture and fail when IDs, clocks, workspace, or titles use Helix-only format."
  if (kind === "trace-projection") return "Add trace projection fixture and fail when assembled debug events are presented as upstream trace parity."
  if (kind === "foundation-compatibility-overlay") return "Keep compatibility overlay verifier active and fail if metadata aliases become executable native claims."
  if (kind === "common-provider-not-product-native") return "Keep common-provider visibility gates active and require product fixture before native promotion."
  if (kind === "metadata-overlay-only") return "Keep metadata executable-blocker active and fail if metadata overlay satisfies an executable port."
  if (kind === "preview-surface-only") return "Keep primary-surface preview blocker active and require native UI/PTY/API fixture before upgrade."
  if (kind === "local-evidence-tool-only") return "Keep local-tool native-claim guard active and fail if evidence tooling is counted as product-native upstream behavior."
  if (kind === "compatibility-export-only") return "Keep compatibility-export guard active and require lifecycle fixture evidence before promoting the export package to native plugin/extension parity."
  if (kind === "manual-behavior-check-required") return "Add a source-inspection checklist entry, then replace the manual marker with a concrete fixture or demotion gate."
  return "Add bridge-vs-upstream comparison fixture and fail if the adapter is relabeled native without parity proof."
}

function exactDiffStatusForDivergence(
  kind: CurrentModulePinnedUpstreamDivergenceKind,
  sourceVerificationStatus: CurrentModuleSourceVerificationStatus,
  behaviorStatus: CurrentModulePinnedUpstreamBehaviorStatus,
): CurrentModuleBehaviorExactDiffStatus {
  if (behaviorStatus === "manual-behavior-check-pending" || sourceVerificationStatus === "manual-source-check-pending" || kind === "manual-behavior-check-required") return "manual-check-pending"
  if (
    kind === "metadata-overlay-only" ||
    kind === "preview-surface-only" ||
    kind === "common-provider-not-product-native" ||
    kind === "foundation-compatibility-overlay" ||
    kind === "local-evidence-tool-only" ||
    kind === "compatibility-export-only"
  ) return "demotion-guard-only"
  if (sourceVerificationStatus === "semantic-fixture-with-lossiness") return "exact-diff-partial"
  return "exact-diff-missing"
}

function fixtureDiffTargetForDivergence(kind: CurrentModulePinnedUpstreamDivergenceKind): string {
  if (kind === "prompt-family-partial") return "prompt-family.rendered-output-matrix"
  if (kind === "product-turn-common-runner") return "turn.native-loop-replay"
  if (kind === "cadence-timing-partial") return "cadence.event-timing-replay"
  if (kind === "provider-stream-projection") return "provider.raw-frame-replay"
  if (kind === "tool-contract-projection") return "tool.contract-envelope-replay"
  if (kind === "session-storage-projection") return "session.storage-round-trip"
  if (kind === "hook-plugin-bridge") return "hook.plugin-lifecycle-replay"
  if (kind === "config-precedence-bridge") return "config.discovery-precedence-matrix"
  if (kind === "runtime-acceptance-policy") return "runtime.acceptance-lifecycle-replay"
  if (kind === "ui-surface-bridge") return "ui.tui-interaction-replay"
  if (kind === "product-shell-bridge") return "product-shell.cli-api-pty-transcript"
  if (kind === "event-envelope-bridge") return "event.envelope-replay"
  if (kind === "identity-format-bridge") return "identity.formatting-round-trip"
  if (kind === "trace-projection") return "trace.debug-capture-replay"
  if (kind === "foundation-compatibility-overlay") return "foundation.metadata-demotion-guard"
  if (kind === "common-provider-not-product-native") return "common-provider.native-claim-guard"
  if (kind === "metadata-overlay-only") return "metadata.executable-blocker"
  if (kind === "preview-surface-only") return "preview.primary-surface-blocker"
  if (kind === "local-evidence-tool-only") return "local-evidence.native-claim-guard"
  if (kind === "compatibility-export-only") return "compat-export.api-surface-guard"
  if (kind === "manual-behavior-check-required") return "manual.source-api-inspection"
  return "bridge.upstream-behavior-comparison"
}

function comparisonDimensionsForDivergence(kind: CurrentModulePinnedUpstreamDivergenceKind): string[] {
  if (kind === "prompt-family-partial") return ["rendered-output", "branch-selection", "ordering", "resource-scope", "identity-negative-gate"]
  if (kind === "product-turn-common-runner") return ["request-construction", "tool-loop", "session-writeback", "retry-continuation", "stop-condition"]
  if (kind === "cadence-timing-partial") return ["request-boundary", "tool-batch-order", "final-summary", "continuation", "side-effects"]
  if (kind === "provider-stream-projection") return ["request-shape", "raw-stream-frame", "retry-error-cancel", "usage-accounting", "registry-selection"]
  if (kind === "tool-contract-projection") return ["schema", "permission-decision", "progress-event", "result-envelope", "denial-behavior"]
  if (kind === "session-storage-projection") return ["message-part-schema", "branch-graph", "compaction-record", "storage-round-trip", "lossy-field-negative"]
  if (kind === "hook-plugin-bridge") return ["load-order", "hook-timing", "event-mapping", "registry-state", "failure-path"]
  if (kind === "config-precedence-bridge") return ["discovery-path", "merge-order", "default-value", "validation", "product-override"]
  if (kind === "runtime-acceptance-policy") return ["lifecycle-start-stop", "accept-continue-timing", "process-cleanup", "evidence-persistence", "interrupt-path"]
  if (kind === "ui-surface-bridge") return ["input-event", "render-snapshot", "state-transition", "focus", "resize"]
  if (kind === "product-shell-bridge") return ["command-route", "pty-api-transcript", "session-readback", "surface-state", "error-path"]
  if (kind === "event-envelope-bridge") return ["field-shape", "event-order", "persistence", "replay", "dropped-field-negative"]
  if (kind === "identity-format-bridge") return ["id-format", "timestamp-format", "workspace-path", "title-format", "serialization"]
  if (kind === "trace-projection") return ["debug-event", "span-order", "redaction", "flow-projection", "trace-readback"]
  if (kind === "foundation-compatibility-overlay") return ["alias-metadata", "non-executable-guard", "native-claim-negative"]
  if (kind === "common-provider-not-product-native") return ["common-provider-visibility", "product-native-claim-negative", "adapter-upgrade-fixture"]
  if (kind === "metadata-overlay-only") return ["bom-annotation", "graph-annotation", "executable-blocker", "native-claim-negative"]
  if (kind === "preview-surface-only") return ["preview-demotion", "primary-surface-blocker", "native-surface-fixture-target"]
  if (kind === "local-evidence-tool-only") return ["local-tooling", "evidence-only", "native-claim-negative", "upstream-nonapplicability"]
  if (kind === "compatibility-export-only") return ["exported-api-name", "type-surface", "lifecycle-not-implemented", "native-claim-negative"]
  if (kind === "manual-behavior-check-required") return ["current-entrypoint", "pinned-upstream-anchor", "inspection-note", "fixture-target"]
  return ["adapter-output", "upstream-output", "negative-native-claim"]
}

function currentCoverageForExactDiff(
  sourceVerificationStatus: CurrentModuleSourceVerificationStatus,
  behaviorStatus: CurrentModulePinnedUpstreamBehaviorStatus,
  evidenceRefs: string[],
): string {
  const evidenceSummary = evidenceRefs.length > 0 ? `evidence:${evidenceRefs.slice(0, 3).join(",")}` : "evidence:manual-pending"
  if (sourceVerificationStatus === "product-native-exact-fixture") return `exact native fixture present; ${evidenceSummary}`
  if (sourceVerificationStatus === "semantic-fixture-with-lossiness") return `semantic fixture exists but exact upstream diff is still partial; ${evidenceSummary}`
  if (sourceVerificationStatus === "metadata-overlay-source") return `metadata/demotion guard only; ${evidenceSummary}`
  if (sourceVerificationStatus === "preview-only-source") return `preview demotion guard only; ${evidenceSummary}`
  if (behaviorStatus === "local-evidence-tool-only") return `local evidence tooling only; ${evidenceSummary}`
  if (behaviorStatus === "compatibility-export-only") return `compatibility export only; ${evidenceSummary}`
  if (sourceVerificationStatus === "manual-source-check-pending" || behaviorStatus === "manual-behavior-check-pending") return `manual source behavior check pending; ${evidenceSummary}`
  return `source anchors mapped but fixture-level exact diff is missing; ${evidenceSummary}`
}

function executableLevelForMixedAtoms(atoms: AssemblyContractAtom[]): string | undefined {
  if (atoms.some((atom) => executableLevelForKnownAtom(atom) === "native-like")) return "native-like"
  if (atoms.some((atom) => executableLevelForKnownAtom(atom) === "profile-compatible")) return "profile-compatible"
  if (atoms.some((atom) => executableLevelForKnownAtom(atom) === "compatible-bridge")) return "compatible-bridge"
  if (atoms.some((atom) => executableLevelForKnownAtom(atom) === "preview-shell")) return "preview-shell"
  if (atoms.some((atom) => executableLevelForKnownAtom(atom) === "metadata-only")) return "metadata-only"
  if (atoms.some((atom) => executableLevelForKnownAtom(atom) === "native")) return "native"
  if (atoms.length > 0) return "common-shared"
  return undefined
}

function executableLevelForTransitionItems(transitions: Todo27NativeRewriteInventoryItem[]): string | undefined {
  if (transitions.some((item) => item.implementationLevel === "profile-compatible")) return "profile-compatible"
  if (transitions.some((item) => item.implementationLevel === "native-like")) return "native-like"
  if (transitions.some((item) => item.implementationLevel === "compatible-bridge")) return "compatible-bridge"
  if (transitions.some((item) => item.implementationLevel === "preview-shell")) return "preview-shell"
  if (transitions.some((item) => item.implementationLevel === "metadata-only")) return "metadata-only"
  if (transitions.some((item) => item.implementationLevel === "native")) return "native"
  return undefined
}

function executableLevelForKnownAtom(atom: AssemblyContractAtom): string {
  if (atom.parityCoverage === "native") return "native"
  if (atom.parityCoverage === "native-like") return "native-like"
  if (atom.parityCoverage === "profile-compatible") return "profile-compatible"
  if (atom.parityCoverage === "compatible-bridge") return "compatible-bridge"
  if (atom.parityCoverage === "preview") return "preview-shell"
  if (atom.parityCoverage === "metadata") return "metadata-only"
  return atom.implementationKind === "preview" ? "preview-shell" : atom.implementationKind === "metadata-only" ? "metadata-only" : "common-shared"
}

function isCurrentModuleAuditProduct(product: string | undefined): product is CurrentModulePlaceholderAuditProduct {
  return product === "opencode" || product === "pi-mono" || product === "nanobot" || product === "hermes-agent"
}

function upstreamDriftStatusForProduct(product: string | undefined): CurrentModuleUpstreamDriftStatus {
  if (!isCurrentModuleAuditProduct(product)) return "not-product-scoped"
  return upstreamBaselineCatalog[product].driftStatus
}

function upstreamBaselineRefsForProduct(product: string | undefined): string[] {
  if (!isCurrentModuleAuditProduct(product)) return []
  const baseline = upstreamBaselineCatalog[product]
  return [
    `pinned:${baseline.pinnedRepo}@${baseline.pinnedRef}`,
    `latest:${baseline.latestRepo}@${baseline.latestHead}`,
    ...baseline.alternateLatestHeads.map((head) => `${head.relation}:${head.repo}@${head.head}`),
  ].sort()
}

function upstreamBaselineRefsForProducts(products: string[]): string[] {
  return uniqueStrings(products.flatMap((product) => upstreamBaselineRefsForProduct(product)))
}

function aggregateUpstreamDriftStatus(products: string[]): CurrentModuleUpstreamDriftStatus {
  const statuses = new Set(products.map((product) => upstreamDriftStatusForProduct(product)))
  if (statuses.has("pinned-behind-latest-head")) return "pinned-behind-latest-head"
  if (statuses.has("pinned-matches-latest-head")) return "pinned-matches-latest-head"
  return "not-product-scoped"
}

function fingerprintItem(item: CurrentModulePlaceholderAuditItem): unknown {
  return {
    kind: item.kind,
    id: item.id,
    product: item.product,
    packagePath: item.packagePath,
    plane: item.plane,
    atomID: item.atomID,
    portID: item.portID,
    selected: item.selected,
    implementationKind: item.implementationKind,
    implementationLevel: item.implementationLevel,
    parityCoverage: item.parityCoverage,
    mismatchKind: item.mismatchKind,
    evidenceStrength: item.evidenceStrength,
    upstreamDriftStatus: item.upstreamDriftStatus,
    upstreamSourceStatus: item.upstreamSourceStatus,
    pinnedUpstreamBehaviorStatus: item.pinnedUpstreamBehaviorStatus,
    pinnedUpstreamDivergences: item.pinnedUpstreamDivergences,
    upstreamSourceLocations: item.upstreamSourceLocations,
    upstreamBaselineRefs: item.upstreamBaselineRefs,
    upstreamRefs: item.upstreamRefs,
    currentSourceRefs: item.currentSourceRefs,
    currentSourcePaths: item.currentSourcePaths,
    currentSourceFiles: item.currentSourceFiles,
    sourceVerificationStatus: item.sourceVerificationStatus,
    evidenceRefs: item.evidenceRefs,
    knownLossiness: item.knownLossiness,
    executableRequired: item.executableRequired,
    bindingRisk: item.bindingRisk,
    compileStatus: item.compileStatus,
    ownerTODO: item.ownerTODO,
    nextAction: item.nextAction,
  }
}

function check(
  id: string,
  ok: boolean,
  message: string,
  severity: "error" | "warning" = "error",
  refs: string[] = [],
): CurrentModulePlaceholderAuditVerificationCheck {
  return { id, ok, severity, message, refs }
}

function countBy<T>(items: T[], keyFor: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const key = keyFor(item)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => left[0].localeCompare(right[0])))
}

function countByKnown<T, K extends string>(items: T[], keyFor: (item: T) => K, keys: K[]): Record<K, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>
  for (const item of items) counts[keyFor(item)] += 1
  return Object.fromEntries(Object.entries(counts).sort((left, right) => left[0].localeCompare(right[0]))) as Record<K, number>
}

function countDivergencesByKnown(items: CurrentModulePlaceholderAuditItem[], keys: CurrentModulePinnedUpstreamDivergenceKind[]): Record<CurrentModulePinnedUpstreamDivergenceKind, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<CurrentModulePinnedUpstreamDivergenceKind, number>
  for (const item of items) {
    for (const divergence of item.pinnedUpstreamDivergences) counts[divergence.kind] += 1
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => left[0].localeCompare(right[0]))) as Record<CurrentModulePinnedUpstreamDivergenceKind, number>
}

function countDivergenceExactDiffStatuses(items: CurrentModulePlaceholderAuditItem[]): Record<CurrentModuleBehaviorExactDiffStatus, number> {
  const counts: Record<CurrentModuleBehaviorExactDiffStatus, number> = {
    "demotion-guard-only": 0,
    "exact-diff-missing": 0,
    "exact-diff-partial": 0,
    "manual-check-pending": 0,
  }
  for (const item of items) {
    for (const divergence of item.pinnedUpstreamDivergences) counts[divergence.exactDiffStatus] += 1
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => left[0].localeCompare(right[0]))) as Record<CurrentModuleBehaviorExactDiffStatus, number>
}

function countDivergenceFixtureTargets(items: CurrentModulePlaceholderAuditItem[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    for (const divergence of item.pinnedUpstreamDivergences) counts[divergence.fixtureDiffTarget] = (counts[divergence.fixtureDiffTarget] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])))
}

function countDivergenceComparisonDimensions(items: CurrentModulePlaceholderAuditItem[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    for (const divergence of item.pinnedUpstreamDivergences) {
      for (const dimension of divergence.comparisonDimensions) counts[dimension] = (counts[dimension] ?? 0) + 1
    }
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])))
}

function divergenceKindsForMarkdown(item: CurrentModulePlaceholderAuditItem): string {
  return item.pinnedUpstreamDivergences.map((divergence) => divergence.kind).join("<br>") || "-"
}

function preferredAnchorRef(refs: string[], preferredPrefix: string): string | undefined {
  return refs.find((ref) => ref.startsWith(preferredPrefix)) ?? refs[0]
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort()
}

function currentSourceFileBelongsToPackage(currentSourceFile: string, packagePath: string): boolean {
  const normalizedPackagePath = packagePath.replace(/\/+$/, "")
  return currentSourceFile === normalizedPackagePath || currentSourceFile.startsWith(`${normalizedPackagePath}/`)
}

function sourceOwnerPackagePathForCurrentSourceFile(currentSourceFile: string): string {
  const catalogPackage = packageCatalog.find((packagePath) => currentSourceFileBelongsToPackage(currentSourceFile, packagePath))
  if (catalogPackage) return catalogPackage
  return currentSourceFile.match(/^(packages\/[^/]+)/)?.[1] ?? "(unknown)"
}

function sourceOwnerPackageCatalogStatusForCurrentSourceFile(currentSourceFile: string): CurrentModuleSourceOwnerPackageCatalogStatus {
  const ownerPackagePath = sourceOwnerPackagePathForCurrentSourceFile(currentSourceFile)
  if (packageCatalog.includes(ownerPackagePath as (typeof packageCatalog)[number])) return "catalog-package"
  if (ownerPackagePath !== "(unknown)" && ownerPackagePath.startsWith("packages/")) return "virtual-package"
  return "unknown-source"
}

function sourceOwnerPackageStatusMatchesCatalog(
  sourceOwnerPackagePath: string,
  status: CurrentModuleSourceOwnerPackageCatalogStatus,
  catalog: readonly string[],
): boolean {
  const inCatalog = catalog.includes(sourceOwnerPackagePath)
  if (status === "catalog-package") return inCatalog
  if (status === "virtual-package") return !inCatalog && sourceOwnerPackagePath.startsWith("packages/")
  return false
}

function upstreamSourceLocationsForProductAtom(
  product: CurrentModulePlaceholderAuditProduct,
  plane: AssemblyContractPlane,
  atomID: string,
): CurrentModuleUpstreamSourceLocation[] {
  if (product === "opencode" && atomID === "opencode.identity.clock-format") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/opencode/src/session/session.ts", ["createDefaultTitle", "isDefaultTitle", "parentTitlePrefix", "childTitlePrefix"]),
    ])
  }
  if (product === "opencode" && atomID === "opencode.identity.id-generator") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/opencode/src/id/id.ts", ["Identifier", "ascending", "descending", "create", "timestamp"]),
      sourceLocation("packages/opencode/src/session/schema.ts", ["MessageID", "PartID"]),
      sourceLocation("packages/core/src/util/identifier.ts", ["Identifier", "ascending", "descending", "create"]),
      sourceLocation("packages/core/src/session.ts", ["Session", "ID"]),
    ])
  }
  if (product === "opencode" && atomID === "opencode.identity.workspace-resolver") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/opencode/src/session/session.ts", ["sessionPath"]),
    ])
  }
  if (product === "opencode" && atomID === "opencode.session.id-generator") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/core/src/session.ts", ["Session", "ID", "descending"]),
      sourceLocation("packages/core/src/util/identifier.ts", ["Identifier", "descending", "create"]),
      sourceLocation("packages/opencode/src/session/session.ts", ["createNext", "SessionID.descending"]),
    ])
  }
  if (product === "opencode" && atomID === "opencode.hook.error-defaults") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/opencode/src/plugin/index.ts", ["Plugin", "trigger"]),
      sourceLocation("packages/plugin/src/index.ts", ["Hooks", "HookFunctions"]),
    ])
  }
  if (product === "opencode" && atomID === "opencode.plugin.permission-bridge") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/opencode/src/plugin/index.ts", ["Plugin", "trigger"]),
      sourceLocation("packages/plugin/src/index.ts", ["Hooks", "permission.ask"]),
      sourceLocation("packages/opencode/src/permission/index.ts", ["Permission", "Event", "Asked", "ask"]),
    ])
  }
  if (product === "opencode" && atomID === "opencode.registry.command") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/plugin/src/index.ts", ["Hooks", "command.execute.before"]),
      sourceLocation("packages/opencode/src/session/prompt.ts", ["SessionPrompt", "command", "Plugin.trigger", "command.execute.before"]),
      sourceLocation("packages/opencode/src/plugin/index.ts", ["Plugin", "trigger"]),
    ])
  }
  if (product === "opencode" && atomID === "opencode.shell.env-bridge") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/plugin/src/index.ts", ["Hooks", "shell.env"]),
      sourceLocation("packages/opencode/src/session/prompt.ts", ["SessionPrompt", "shell.env", "Plugin.trigger", "ChildProcess.make"]),
      sourceLocation("packages/opencode/src/plugin/index.ts", ["Plugin", "trigger"]),
    ])
  }
  if (product === "opencode" && atomID === "opencode.tool.result-render-bridge") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/plugin/src/index.ts", ["Hooks", "tool.execute.after"]),
      sourceLocation("packages/opencode/src/session/prompt.ts", ["SessionPrompt", "tool.execute.after", "Plugin.trigger"]),
      sourceLocation("packages/opencode/src/plugin/index.ts", ["Plugin", "trigger"]),
    ])
  }
  if (product === "opencode" && atomID === "opencode.tool-pack.compatibility") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/opencode/src/tool/registry.ts", ["ToolRegistry", "state", "tools", "fromPlugin"]),
      sourceLocation("packages/opencode/src/session/tools.ts", ["SessionTools", "resolve"]),
      sourceLocation("packages/opencode/src/session/processor.ts", ["SessionProcessor", "process", "tool", "part"]),
      sourceLocation("packages/opencode/src/tool/tool.ts", ["Tool", "define", "execute", "InvalidArgumentsError"]),
    ])
  }
  if (product === "opencode" && atomID === "opencode.plugin.registry-bridge") {
    return upstreamSourceLocationsForProductAndSourceLocations(product, [
      sourceLocation("packages/plugin/src/index.ts", ["Hooks", "tool"]),
      sourceLocation("packages/plugin/src/tool.ts", ["tool", "ToolDefinition"]),
      sourceLocation("packages/opencode/src/plugin/index.ts", ["Plugin", "list"]),
      sourceLocation("packages/opencode/src/tool/registry.ts", ["ToolRegistry", "state", "fromPlugin"]),
    ])
  }
  return upstreamSourceLocationsForProductAndPlane(product, plane)
}

function upstreamSourceLocationsForProductAndPlane(
  product: CurrentModulePlaceholderAuditProduct,
  plane: AssemblyContractPlane,
): CurrentModuleUpstreamSourceLocation[] {
  return upstreamSourceLocationsForProductAndSourceLocations(product, upstreamSourceCatalog[product].byPlane[plane] ?? [])
}

function upstreamSourceLocationsForProductAndSourceLocations(
  product: CurrentModulePlaceholderAuditProduct,
  locations: Array<Omit<CurrentModuleUpstreamSourceLocation, "product" | "repo" | "ref">>,
): CurrentModuleUpstreamSourceLocation[] {
  const baseline = upstreamBaselineCatalog[product]
  return locations.map((location) => ({
    product,
    repo: baseline.pinnedRepo,
    ref: baseline.pinnedRef,
    path: location.path,
    symbols: [...location.symbols],
    evidence: location.evidence,
  }))
}

function upstreamSourceLocationsForProductsAndPlanes(
  products: CurrentModulePlaceholderAuditProduct[],
  planes: AssemblyContractPlane[],
): CurrentModuleUpstreamSourceLocation[] {
  return uniqueSourceLocations(products.flatMap((product) => planes.flatMap((plane) => upstreamSourceLocationsForProductAndPlane(product, plane))))
}

function upstreamSourceStatusForLocations(
  products: CurrentModulePlaceholderAuditProduct[],
  locations: CurrentModuleUpstreamSourceLocation[],
): CurrentModuleUpstreamSourceStatus {
  if (products.length === 0) return "not-product-scoped"
  if (locations.length === 0) return "upstream-baseline-only"
  if (locations.every((location) => location.symbols.length > 0)) return "pinned-source-symbol-mapped"
  return "pinned-source-path-mapped"
}

function uniqueProducts(values: Array<AssemblyContractProduct | undefined>): CurrentModulePlaceholderAuditProduct[] {
  return uniqueStrings(values.filter(isCurrentModuleAuditProduct)) as CurrentModulePlaceholderAuditProduct[]
}

function uniquePlanes(values: Array<AssemblyContractPlane | undefined>): AssemblyContractPlane[] {
  return uniqueStrings(values) as AssemblyContractPlane[]
}

function uniqueSourceLocations(locations: CurrentModuleUpstreamSourceLocation[]): CurrentModuleUpstreamSourceLocation[] {
  const byKey = new Map<string, CurrentModuleUpstreamSourceLocation>()
  for (const location of locations) {
    const key = `${location.product}:${location.repo}:${location.ref}:${location.path}`
    const existing = byKey.get(key)
    if (existing) {
      existing.symbols = uniqueStrings([...existing.symbols, ...location.symbols])
      continue
    }
    byKey.set(key, {
      ...location,
      symbols: uniqueStrings(location.symbols),
    })
  }
  return Array.from(byKey.values()).sort((left, right) => `${left.product}:${left.path}`.localeCompare(`${right.product}:${right.path}`))
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
