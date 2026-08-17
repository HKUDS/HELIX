import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

type SourceFileQueueItem = {
  currentSourceFile: string
  sourceOwnerPackagePath: string
  sourceOwnerPackageCatalogStatus: string
  fixtureDiffTarget: string
  exactDiffStatus: string
  lineLevelDiffStatus: string
  itemCount: number
  itemIDs: string[]
  sampleItemIDs: string[]
  requiredEvidence: string
  nextVerification: string
  fixtureImplementationTarget: string
  negativeVerificationTarget: string
  sampleUpstreamAnchorRefs: string[]
  sampleCurrentAnchorRefs: string[]
  comparisonDimensions: string[]
  action: string
}

type SourceOwnerLineLevelSummary = {
  sourceOwnerPackagePath: string
  sourceOwnerPackageCatalogStatus: string
  moduleConfirmationStatus: string
  queueItems: number
  itemCount: number
  currentSourceFileCount: number
  lineLevelDiffMissing: number
  semanticFixtureNeedsExactDiff: number
  demotionGuardOnly: number
  manualAnchorNeeded: number
  byFixtureDiffTarget: Record<string, number | undefined>
  sampleFixtureImplementationTargets: string[]
  sampleNegativeVerificationTargets: string[]
}

type CurrentModuleAuditArtifact = {
  sourceFileFixtureQueue: SourceFileQueueItem[]
  sourceOwnerLineLevelSummaries: SourceOwnerLineLevelSummary[]
  summary: {
    sourceFileFixtureQueueItems: number
    sourceOwnerLineLevelSummaryItems: number
    byBehaviorExactDiffStatus: Record<string, number | undefined>
    bySourceVerificationStatus: Record<string, number | undefined>
    productNativeComplete: number
  }
}

type SourceOwnerSpec = {
  queueItems: number
  itemCount: number
  currentSourceFileCount: number
  lineLevelDiffMissing: number
  semanticFixtureNeedsExactDiff: number
  demotionGuardOnly: number
  fixtureTargets: readonly string[]
}

const HIGH_RISK_SOURCE_OWNERS: Record<string, SourceOwnerSpec> = {
  "packages/lego-agent-loop": {
    queueItems: 23,
    itemCount: 44,
    currentSourceFileCount: 20,
    lineLevelDiffMissing: 0,
    semanticFixtureNeedsExactDiff: 0,
    demotionGuardOnly: 23,
    fixtureTargets: ["metadata.executable-blocker", "common-provider.native-claim-guard"],
  },
  "packages/lego-provider": {
    queueItems: 13,
    itemCount: 56,
    currentSourceFileCount: 8,
    lineLevelDiffMissing: 0,
    semanticFixtureNeedsExactDiff: 0,
    demotionGuardOnly: 13,
    fixtureTargets: ["metadata.executable-blocker", "common-provider.native-claim-guard"],
  },
  "packages/lego-tools": {
    queueItems: 12,
    itemCount: 60,
    currentSourceFileCount: 8,
    lineLevelDiffMissing: 0,
    semanticFixtureNeedsExactDiff: 0,
    demotionGuardOnly: 12,
    fixtureTargets: ["metadata.executable-blocker", "common-provider.native-claim-guard"],
  },
  "packages/contracts": {
    queueItems: 2,
    itemCount: 52,
    currentSourceFileCount: 2,
    lineLevelDiffMissing: 0,
    semanticFixtureNeedsExactDiff: 0,
    demotionGuardOnly: 2,
    fixtureTargets: ["metadata.executable-blocker"],
  },
  "packages/lego-ui": {
    queueItems: 8,
    itemCount: 11,
    currentSourceFileCount: 5,
    lineLevelDiffMissing: 0,
    semanticFixtureNeedsExactDiff: 0,
    demotionGuardOnly: 8,
    fixtureTargets: ["metadata.executable-blocker", "common-provider.native-claim-guard"],
  },
  "packages/cli": {
    queueItems: 1,
    itemCount: 1,
    currentSourceFileCount: 1,
    lineLevelDiffMissing: 0,
    semanticFixtureNeedsExactDiff: 0,
    demotionGuardOnly: 1,
    fixtureTargets: ["local-evidence.native-claim-guard"],
  },
  "packages/pi-mono.task.runner.native-cli": {
    queueItems: 1,
    itemCount: 1,
    currentSourceFileCount: 1,
    lineLevelDiffMissing: 0,
    semanticFixtureNeedsExactDiff: 0,
    demotionGuardOnly: 1,
    fixtureTargets: ["metadata.executable-blocker"],
  },
}

describe("TODO29 source-file fixture dispatch", () => {
  it("keeps every source-file queue item actionable without promoting partial evidence to native", () => {
    const audit = loadCurrentModuleAuditArtifact()

    expect(collectSourceFileDispatchIssues(audit)).toEqual([])
  })

  it("flags source-file dispatch entries that lose source-specific actions, anchors, or owner visibility", () => {
    const audit = cloneAudit(loadCurrentModuleAuditArtifact())
    const demotionItem = audit.sourceFileFixtureQueue.find((item) => item.exactDiffStatus === "demotion-guard-only")
    expect(demotionItem).toBeDefined()
    if (demotionItem === undefined) throw new Error("missing demotion source-file queue item")

    demotionItem.lineLevelDiffStatus = "semantic-fixture-needs-exact-diff"
    demotionItem.fixtureImplementationTarget = `extend:${demotionItem.fixtureDiffTarget}`
    demotionItem.negativeVerificationTarget = `exact-diff-regression:${demotionItem.fixtureDiffTarget}:${demotionItem.currentSourceFile}`
    demotionItem.sampleUpstreamAnchorRefs = []
    demotionItem.comparisonDimensions = []

    const ownerSummary = audit.sourceOwnerLineLevelSummaries.find((summary) => summary.sourceOwnerPackagePath === "packages/cli")
    expect(ownerSummary).toBeDefined()
    if (ownerSummary === undefined) throw new Error("missing cli source owner summary")
    ownerSummary.queueItems = 0
    ownerSummary.moduleConfirmationStatus = "no-open-divergence"
    ownerSummary.sampleFixtureImplementationTargets = []

    expect(collectSourceFileDispatchIssues(audit)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("lineLevelDiffStatus semantic-fixture-needs-exact-diff is not demotion-guard-only"),
        expect.stringContaining("fixtureImplementationTarget"),
        expect.stringContaining("negativeVerificationTarget"),
        expect.stringContaining("missing sampleUpstreamAnchorRefs"),
        expect.stringContaining("missing comparison dimensions"),
        expect.stringContaining("packages/cli queueItems expected 1, found 0"),
        expect.stringContaining("packages/cli moduleConfirmationStatus no-open-divergence is not demotion-guard-confirmed"),
        expect.stringContaining("packages/cli missing sample fixture implementation targets"),
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

function collectSourceFileDispatchIssues(audit: CurrentModuleAuditArtifact): string[] {
  const issues: string[] = []
  const queue = audit.sourceFileFixtureQueue
  const partialItems = queue.filter((item) => item.exactDiffStatus === "exact-diff-partial")
  const demotionItems = queue.filter((item) => item.exactDiffStatus === "demotion-guard-only")
  const missingItems = queue.filter((item) => item.exactDiffStatus === "exact-diff-missing")

  expectCount("summary.productNativeComplete", audit.summary.productNativeComplete, 389, issues)
  expectCount("summary.sourceFileFixtureQueueItems", audit.summary.sourceFileFixtureQueueItems, 175, issues)
  expectCount("sourceFileFixtureQueue.length", queue.length, audit.summary.sourceFileFixtureQueueItems, issues)
  expectCount("summary.sourceOwnerLineLevelSummaryItems", audit.summary.sourceOwnerLineLevelSummaryItems, 30, issues)
  expectCount("sourceOwnerLineLevelSummaries.length", audit.sourceOwnerLineLevelSummaries.length, audit.summary.sourceOwnerLineLevelSummaryItems, issues)
  expectCount("semantic source-file dispatch count", partialItems.length, 0, issues)
  expectCount("demotion source-file dispatch count", demotionItems.length, 175, issues)
  expectCount("missing source-file dispatch count", missingItems.length, 0, issues)
  expectCount("summary.byBehaviorExactDiffStatus.exact-diff-missing", audit.summary.byBehaviorExactDiffStatus["exact-diff-missing"], 0, issues)
  expectCount("summary.byBehaviorExactDiffStatus.manual-check-pending", audit.summary.byBehaviorExactDiffStatus["manual-check-pending"], 1, issues)
  expectCount("summary.bySourceVerificationStatus.product-native-exact-fixture", audit.summary.bySourceVerificationStatus["product-native-exact-fixture"], 691, issues)

  for (const item of queue) {
    validateSourceFileQueueItem(item, issues)
  }

  const queueItemsByOwner = countBy(queue, (item) => item.sourceOwnerPackagePath)
  const semanticItemsByOwner = countBy(partialItems, (item) => item.sourceOwnerPackagePath)
  const demotionItemsByOwner = countBy(demotionItems, (item) => item.sourceOwnerPackagePath)
  const missingItemsByOwner = countBy(missingItems, (item) => item.sourceOwnerPackagePath)
  const currentSourceFilesByOwner = groupUnique(queue, (item) => item.sourceOwnerPackagePath, (item) => item.currentSourceFile)

  for (const summary of audit.sourceOwnerLineLevelSummaries) {
    const owner = summary.sourceOwnerPackagePath
    expectCount(`${owner} queueItems`, summary.queueItems, queueItemsByOwner[owner] ?? 0, issues)
    expectCount(`${owner} semanticFixtureNeedsExactDiff`, summary.semanticFixtureNeedsExactDiff, semanticItemsByOwner[owner] ?? 0, issues)
    expectCount(`${owner} demotionGuardOnly`, summary.demotionGuardOnly, demotionItemsByOwner[owner] ?? 0, issues)
    expectCount(`${owner} currentSourceFileCount`, summary.currentSourceFileCount, currentSourceFilesByOwner[owner]?.size ?? 0, issues)
    expectCount(`${owner} lineLevelDiffMissing`, summary.lineLevelDiffMissing, missingItemsByOwner[owner] ?? 0, issues)
    expectCount(`${owner} manualAnchorNeeded`, summary.manualAnchorNeeded, 0, issues)

    const expectedModuleStatus =
      summary.lineLevelDiffMissing > 0
        ? "upstream-divergent-exact-diff-missing"
        : summary.semanticFixtureNeedsExactDiff > 0
          ? "semantic-fixture-needs-exact-diff"
          : "demotion-guard-confirmed"
    if (summary.moduleConfirmationStatus !== expectedModuleStatus) {
      issues.push(`${owner} moduleConfirmationStatus ${summary.moduleConfirmationStatus} is not ${expectedModuleStatus}`)
    }
    if (summary.sampleFixtureImplementationTargets.length === 0) {
      issues.push(`${owner} missing sample fixture implementation targets`)
    }
    if (summary.sampleNegativeVerificationTargets.length === 0) {
      issues.push(`${owner} missing sample negative verification targets`)
    }
  }

  for (const [owner, spec] of Object.entries(HIGH_RISK_SOURCE_OWNERS)) {
    const summary = audit.sourceOwnerLineLevelSummaries.find((candidate) => candidate.sourceOwnerPackagePath === owner)
    if (summary === undefined) {
      issues.push(`${owner} source owner summary is missing`)
      continue
    }
    expectCount(`${owner} queueItems`, summary.queueItems, spec.queueItems, issues)
    expectCount(`${owner} itemCount`, summary.itemCount, spec.itemCount, issues)
    expectCount(`${owner} currentSourceFileCount`, summary.currentSourceFileCount, spec.currentSourceFileCount, issues)
    expectCount(`${owner} lineLevelDiffMissing`, summary.lineLevelDiffMissing, spec.lineLevelDiffMissing, issues)
    expectCount(`${owner} semanticFixtureNeedsExactDiff`, summary.semanticFixtureNeedsExactDiff, spec.semanticFixtureNeedsExactDiff, issues)
    expectCount(`${owner} demotionGuardOnly`, summary.demotionGuardOnly, spec.demotionGuardOnly, issues)
    for (const target of spec.fixtureTargets) {
      if ((summary.byFixtureDiffTarget[target] ?? 0) === 0) {
        issues.push(`${owner} missing fixture target ${target}`)
      }
    }
  }

  return issues
}

function validateSourceFileQueueItem(item: SourceFileQueueItem, issues: string[]): void {
  const label = `${item.currentSourceFile}:${item.fixtureDiffTarget}`
  if (!item.currentSourceFile) issues.push(`${label} missing currentSourceFile`)
  if (!item.sourceOwnerPackagePath) issues.push(`${label} missing sourceOwnerPackagePath`)
  if (!["catalog-package", "virtual-package"].includes(item.sourceOwnerPackageCatalogStatus)) {
    issues.push(`${label} has invalid sourceOwnerPackageCatalogStatus ${item.sourceOwnerPackageCatalogStatus}`)
  }
  if (item.itemCount <= 0) issues.push(`${label} itemCount must be positive`)
  if (item.itemIDs.length === 0) issues.push(`${label} missing itemIDs`)
  if (item.sampleItemIDs.length === 0) issues.push(`${label} missing sampleItemIDs`)
  if (item.requiredEvidence.length === 0) issues.push(`${label} missing requiredEvidence`)
  if (item.nextVerification.length === 0) issues.push(`${label} missing nextVerification`)
  if (item.action.length === 0) issues.push(`${label} missing action`)
  if (item.sampleUpstreamAnchorRefs.length === 0) issues.push(`${label} missing sampleUpstreamAnchorRefs`)
  if (item.sampleCurrentAnchorRefs.length === 0) issues.push(`${label} missing sampleCurrentAnchorRefs`)
  if (item.comparisonDimensions.length === 0) issues.push(`${label} missing comparison dimensions`)

  if (item.exactDiffStatus === "exact-diff-partial") {
    expectField(label, "lineLevelDiffStatus", item.lineLevelDiffStatus, "semantic-fixture-needs-exact-diff", issues)
    expectField(label, "fixtureImplementationTarget", item.fixtureImplementationTarget, `extend:${item.fixtureDiffTarget}:${item.currentSourceFile}`, issues)
    expectField(label, "negativeVerificationTarget", item.negativeVerificationTarget, `exact-diff-regression:${item.fixtureDiffTarget}:${item.currentSourceFile}`, issues)
    if (!item.sampleUpstreamAnchorRefs.some((anchor) => anchor.startsWith("upstream:"))) {
      issues.push(`${label} semantic partial is missing upstream source anchor`)
    }
    if (!item.sampleCurrentAnchorRefs.some((anchor) => anchor.startsWith("current:") || anchor.startsWith("current-"))) {
      issues.push(`${label} semantic partial is missing current source anchor`)
    }
    return
  }

  if (item.exactDiffStatus === "demotion-guard-only") {
    expectField(label, "lineLevelDiffStatus", item.lineLevelDiffStatus, "demotion-guard-only", issues)
    expectField(label, "fixtureImplementationTarget", item.fixtureImplementationTarget, `preserve-guard:${item.fixtureDiffTarget}:${item.currentSourceFile}`, issues)
    expectField(label, "negativeVerificationTarget", item.negativeVerificationTarget, `native-claim-guard:${item.fixtureDiffTarget}:${item.currentSourceFile}`, issues)
    return
  }

  if (item.exactDiffStatus === "exact-diff-missing") {
    expectField(label, "lineLevelDiffStatus", item.lineLevelDiffStatus, "line-level-diff-missing", issues)
    expectField(label, "fixtureImplementationTarget", item.fixtureImplementationTarget, `implement:${item.fixtureDiffTarget}:${item.currentSourceFile}`, issues)
    expectField(label, "negativeVerificationTarget", item.negativeVerificationTarget, `exact-diff-regression:${item.fixtureDiffTarget}:${item.currentSourceFile}`, issues)
    return
  }

  issues.push(`${label} exactDiffStatus ${item.exactDiffStatus} is not source-file dispatchable`)
}

function expectCount(label: string, actual: number | undefined, expected: number, issues: string[]): void {
  if (actual !== expected) issues.push(`${label} expected ${expected}, found ${actual ?? "<missing>"}`)
}

function expectField(label: string, field: string, actual: string, expected: string, issues: string[]): void {
  if (actual !== expected) issues.push(`${label} ${field} ${actual} is not ${expected}`)
}

function countBy<T>(items: readonly T[], keyOf: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const key = keyOf(item)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function groupUnique<T>(items: readonly T[], keyOf: (item: T) => string, valueOf: (item: T) => string): Record<string, Set<string>> {
  const groups: Record<string, Set<string>> = {}
  for (const item of items) {
    const key = keyOf(item)
    groups[key] ??= new Set<string>()
    groups[key].add(valueOf(item))
  }
  return groups
}
