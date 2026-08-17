import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

type GuardTarget =
  | "common-provider.native-claim-guard"
  | "metadata.executable-blocker"
  | "local-evidence.native-claim-guard"
  | "compat-export.api-surface-guard"

type AuditSummary = {
  productNativeComplete: number
  byBehaviorExactDiffStatus: Record<string, number | undefined>
  byFixtureDiffTarget: Record<string, number | undefined>
  byPinnedUpstreamBehaviorStatus: Record<string, number | undefined>
  bySourceVerificationStatus: Record<string, number | undefined>
}

type AuditDivergence = {
  exactDiffStatus?: string
  fixtureDiffTarget?: string
  comparisonDimensions?: string[]
}

type AuditItem = {
  id: string
  pinnedUpstreamBehaviorStatus?: string
  sourceVerificationStatus?: string
  pinnedUpstreamDivergences?: AuditDivergence[]
}

type FixtureDiffQueueItem = {
  fixtureDiffTarget: string
  exactDiffStatus: string
  lineLevelDiffStatus: string
  itemCount: number
  itemIDs: string[]
  packages: string[]
  comparisonDimensions: string[]
  requiredEvidence: string
  nextVerification: string
  fixtureImplementationTarget: string
  negativeVerificationTarget: string
  divergenceKinds: string[]
  behaviorStatuses: string[]
}

type CurrentModuleAuditArtifact = {
  items: AuditItem[]
  fixtureDiffQueue: FixtureDiffQueueItem[]
  summary: AuditSummary
}

type GuardSpec = {
  itemCount: number
  dimensions: readonly string[]
  packages: readonly string[]
  requiredEvidence: readonly string[]
  nextVerification: readonly string[]
  divergenceKinds: readonly string[]
  behaviorStatuses: readonly string[]
}

const GUARD_SPECS: Record<GuardTarget, GuardSpec> = {
  "common-provider.native-claim-guard": {
    itemCount: 70,
    dimensions: ["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"],
    packages: [
      "packages/lego-agent-loop",
      "packages/lego-prompt",
      "packages/lego-provider",
      "packages/lego-runtime",
      "packages/lego-session",
      "packages/lego-tools",
      "packages/lego-ui",
    ],
    requiredEvidence: ["common-provider demotion proof", "product-specific fixture", "native parity upgrade"],
    nextVerification: ["common-provider visibility gates", "product fixture", "native promotion"],
    divergenceKinds: ["common-provider-not-product-native"],
    behaviorStatuses: ["pinned-common-not-product-native"],
  },
  "metadata.executable-blocker": {
    itemCount: 95,
    dimensions: ["bom-annotation", "executable-blocker", "graph-annotation", "native-claim-negative"],
    packages: [
      "packages/adapters-hermes",
      "packages/adapters-nanobot",
      "packages/adapters-opencode",
      "packages/adapters-pi",
      "packages/lego-agent-loop",
      "packages/lego-prompt",
      "packages/lego-runtime",
    ],
    requiredEvidence: ["metadata overlay proof", "BOM/graph annotation", "executable provider semantics"],
    nextVerification: ["metadata executable-blocker", "metadata overlay", "executable port"],
    divergenceKinds: ["metadata-overlay-only"],
    behaviorStatuses: ["pinned-metadata-only"],
  },
  "local-evidence.native-claim-guard": {
    itemCount: 3,
    dimensions: ["evidence-only", "local-tooling", "native-claim-negative", "upstream-nonapplicability"],
    packages: ["packages/cli", "packages/conformance", "packages/docs-site"],
    requiredEvidence: ["local-tool demotion proof", "evidence infrastructure", "upstream harness module"],
    nextVerification: ["local-tool native-claim guard", "evidence tooling", "product-native upstream behavior"],
    divergenceKinds: ["local-evidence-tool-only"],
    behaviorStatuses: ["local-evidence-tool-only"],
  },
  "compat-export.api-surface-guard": {
    itemCount: 2,
    dimensions: ["exported-api-name", "lifecycle-not-implemented", "native-claim-negative", "type-surface"],
    packages: ["packages/opencode-plugin", "packages/pi-coding-agent"],
    requiredEvidence: ["compatibility export guard", "exported API surface names", "native lifecycle claims"],
    nextVerification: ["compatibility-export guard", "lifecycle fixture evidence", "native plugin/extension parity"],
    divergenceKinds: ["compatibility-export-only"],
    behaviorStatuses: ["compatibility-export-only"],
  },
}

const GUARD_TARGETS = Object.keys(GUARD_SPECS) as GuardTarget[]

describe("TODO29 demotion guard queues", () => {
  it("keeps native-claim blockers explicit instead of treating guard-only evidence as exact parity", () => {
    const audit = loadCurrentModuleAuditArtifact()

    expect(collectGuardQueueIssues(audit)).toEqual([])
  })

  it("flags guard queues that lose demotion status, dimensions, or negative native-claim checks", () => {
    const audit = cloneAudit(loadCurrentModuleAuditArtifact())
    const commonProviderQueue = findGuardQueue(audit, "common-provider.native-claim-guard")
    expect(commonProviderQueue).toBeDefined()
    if (commonProviderQueue === undefined) throw new Error("missing common-provider guard queue")

    commonProviderQueue.exactDiffStatus = "exact-diff-partial"
    commonProviderQueue.comparisonDimensions = commonProviderQueue.comparisonDimensions.filter((dimension) => dimension !== "product-native-claim-negative")
    commonProviderQueue.requiredEvidence = "common provider proof"
    commonProviderQueue.nextVerification = "native promotion is allowed"

    const commonProviderItem = audit.items.find((item) =>
      (item.pinnedUpstreamDivergences ?? []).some((divergence) => divergence.fixtureDiffTarget === "common-provider.native-claim-guard"),
    )
    expect(commonProviderItem).toBeDefined()
    if (commonProviderItem === undefined) throw new Error("missing common-provider guard item")
    commonProviderItem.pinnedUpstreamBehaviorStatus = "pinned-native-exact"
    commonProviderItem.sourceVerificationStatus = "product-native-exact-fixture"
    const commonProviderDivergence = commonProviderItem.pinnedUpstreamDivergences?.find(
      (divergence) => divergence.fixtureDiffTarget === "common-provider.native-claim-guard",
    )
    expect(commonProviderDivergence).toBeDefined()
    if (commonProviderDivergence === undefined) throw new Error("missing common-provider guard divergence")
    commonProviderDivergence.exactDiffStatus = "exact-diff-partial"

    expect(collectGuardQueueIssues(audit)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("common-provider.native-claim-guard status exact-diff-partial is not demotion-guard-only"),
        expect.stringContaining("common-provider.native-claim-guard missing dimension product-native-claim-negative"),
        expect.stringContaining("common-provider.native-claim-guard requiredEvidence missing product-specific fixture"),
        expect.stringContaining("common-provider.native-claim-guard nextVerification missing product fixture"),
        expect.stringContaining("was promoted to pinned-native-exact"),
        expect.stringContaining("uses product-native-exact-fixture"),
        expect.stringContaining("common-provider.native-claim-guard moved to exact-diff-partial"),
      ]),
    )
  })
})

function loadCurrentModuleAuditArtifact(): CurrentModuleAuditArtifact {
  return JSON.parse(readFileSync("docs/reports/current-module-placeholder-audit.json", "utf8")) as CurrentModuleAuditArtifact
}

function cloneAudit(audit: CurrentModuleAuditArtifact): CurrentModuleAuditArtifact {
  return JSON.parse(JSON.stringify(audit)) as CurrentModuleAuditArtifact
}

function collectGuardQueueIssues(audit: CurrentModuleAuditArtifact): string[] {
  const issues: string[] = []
  const guardQueues = audit.fixtureDiffQueue.filter((queue) => isGuardTarget(queue.fixtureDiffTarget))
  const guardTargetItems = audit.items.filter((item) => hasGuardTargetDivergence(item))
  const guardOnlyItems = audit.items.filter((item) => hasGuardOnlyDivergence(item))

  expectSummaryCount(audit.summary, "productNativeComplete", audit.summary.productNativeComplete, 389, issues)
  expectSummaryCount(audit.summary, "byBehaviorExactDiffStatus.demotion-guard-only", audit.summary.byBehaviorExactDiffStatus["demotion-guard-only"], 170, issues)
  expectSummaryCount(audit.summary, "byBehaviorExactDiffStatus.exact-diff-missing", audit.summary.byBehaviorExactDiffStatus["exact-diff-missing"], 0, issues)
  expectSummaryCount(audit.summary, "byBehaviorExactDiffStatus.manual-check-pending", audit.summary.byBehaviorExactDiffStatus["manual-check-pending"], 1, issues)
  expectSummaryCount(
    audit.summary,
    "byPinnedUpstreamBehaviorStatus.pinned-native-exact",
    audit.summary.byPinnedUpstreamBehaviorStatus["pinned-native-exact"],
    691,
    issues,
  )
  expectSummaryCount(
    audit.summary,
    "bySourceVerificationStatus.product-native-exact-fixture",
    audit.summary.bySourceVerificationStatus["product-native-exact-fixture"],
    691,
    issues,
  )

  if (guardQueues.length !== GUARD_TARGETS.length) {
    issues.push(`expected ${GUARD_TARGETS.length} guard queues, found ${guardQueues.length}`)
  }
  if (sum(guardQueues.map((queue) => queue.itemCount)) !== 170) {
    issues.push(`guard queue itemCount sum ${sum(guardQueues.map((queue) => queue.itemCount))} does not equal 170`)
  }
  if (guardOnlyItems.length !== 170) {
    issues.push(`expected 170 guard-only items, found ${guardOnlyItems.length}`)
  }

  for (const target of GUARD_TARGETS) {
    const spec = GUARD_SPECS[target]
    const queue = findGuardQueue(audit, target)
    if (queue === undefined) {
      issues.push(`${target} queue is missing`)
      continue
    }

    expectSummaryCount(audit.summary, `byFixtureDiffTarget.${target}`, audit.summary.byFixtureDiffTarget[target], spec.itemCount, issues)
    expectQueueField(queue, "exactDiffStatus", queue.exactDiffStatus, "demotion-guard-only", issues)
    expectQueueField(queue, "lineLevelDiffStatus", queue.lineLevelDiffStatus, "demotion-guard-only", issues)
    expectQueueField(queue, "itemCount", queue.itemCount, spec.itemCount, issues)
    expectQueueField(queue, "fixtureImplementationTarget", queue.fixtureImplementationTarget, `preserve-guard:${target}`, issues)
    expectQueueField(queue, "negativeVerificationTarget", queue.negativeVerificationTarget, `native-claim-guard:${target}`, issues)
    expectArrayIncludes(target, "dimension", queue.comparisonDimensions, spec.dimensions, issues)
    expectArrayIncludes(target, "package", queue.packages, spec.packages, issues)
    expectArrayIncludes(target, "divergenceKind", queue.divergenceKinds, spec.divergenceKinds, issues)
    expectArrayIncludes(target, "behaviorStatus", queue.behaviorStatuses, spec.behaviorStatuses, issues)
    expectStringIncludes(target, "requiredEvidence", queue.requiredEvidence, spec.requiredEvidence, issues)
    expectStringIncludes(target, "nextVerification", queue.nextVerification, spec.nextVerification, issues)
  }

  for (const item of guardTargetItems) {
    if (item.pinnedUpstreamBehaviorStatus === "pinned-native-exact") {
      issues.push(`${item.id} was promoted to pinned-native-exact`)
    }
    if (item.sourceVerificationStatus === "product-native-exact-fixture") {
      issues.push(`${item.id} uses product-native-exact-fixture`)
    }

    for (const divergence of item.pinnedUpstreamDivergences ?? []) {
      if (divergence.exactDiffStatus !== "demotion-guard-only") continue
      if (!isGuardTarget(divergence.fixtureDiffTarget)) {
        issues.push(`${item.id} has demotion guard without known target ${divergence.fixtureDiffTarget ?? "<missing>"}`)
        continue
      }
      const spec = GUARD_SPECS[divergence.fixtureDiffTarget]
      expectArrayIncludes(`${item.id}:${divergence.fixtureDiffTarget}`, "dimension", divergence.comparisonDimensions ?? [], spec.dimensions, issues)
    }

    for (const divergence of item.pinnedUpstreamDivergences ?? []) {
      if (!isGuardTarget(divergence.fixtureDiffTarget)) continue
      if (divergence.exactDiffStatus !== "demotion-guard-only") {
        issues.push(`${item.id}:${divergence.fixtureDiffTarget} moved to ${divergence.exactDiffStatus ?? "<missing>"}`)
      }
    }
  }

  return issues
}

function findGuardQueue(audit: CurrentModuleAuditArtifact, target: GuardTarget): FixtureDiffQueueItem | undefined {
  return audit.fixtureDiffQueue.find((queue) => queue.fixtureDiffTarget === target)
}

function hasGuardOnlyDivergence(item: AuditItem): boolean {
  return (item.pinnedUpstreamDivergences ?? []).some((divergence) => divergence.exactDiffStatus === "demotion-guard-only")
}

function hasGuardTargetDivergence(item: AuditItem): boolean {
  return (item.pinnedUpstreamDivergences ?? []).some((divergence) => isGuardTarget(divergence.fixtureDiffTarget))
}

function isGuardTarget(target: string | undefined): target is GuardTarget {
  return target !== undefined && GUARD_TARGETS.includes(target as GuardTarget)
}

function expectSummaryCount(
  _summary: AuditSummary,
  label: string,
  actual: number | undefined,
  expected: number,
  issues: string[],
): void {
  if (actual !== expected) issues.push(`${label} expected ${expected}, found ${actual ?? "<missing>"}`)
}

function expectQueueField(
  queue: FixtureDiffQueueItem,
  field: "exactDiffStatus" | "fixtureImplementationTarget" | "itemCount" | "lineLevelDiffStatus" | "negativeVerificationTarget",
  actual: number | string,
  expected: number | string,
  issues: string[],
): void {
  if (actual !== expected) issues.push(`${queue.fixtureDiffTarget} ${field.replace("exactDiffStatus", "status")} ${actual} is not ${expected}`)
}

function expectArrayIncludes(target: string, label: string, actual: readonly string[], expected: readonly string[], issues: string[]): void {
  for (const value of expected) {
    if (!actual.includes(value)) issues.push(`${target} missing ${label} ${value}`)
  }
}

function expectStringIncludes(target: string, label: string, actual: string, expectedFragments: readonly string[], issues: string[]): void {
  for (const fragment of expectedFragments) {
    if (!actual.includes(fragment)) issues.push(`${target} ${label} missing ${fragment}`)
  }
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
