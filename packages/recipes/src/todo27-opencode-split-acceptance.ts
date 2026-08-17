import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import {
  buildAssemblyContract,
  verifyAssemblyContract,
  type AssemblyContract,
} from "./assembly-contract"
import {
  buildCurrentModulePlaceholderAudit,
  verifyCurrentModulePlaceholderAudit,
  type CurrentModulePlaceholderAudit,
} from "./current-module-placeholder-audit"
import {
  buildExecutablePlaceholderAudit,
  verifyExecutablePlaceholderAudit,
  type ExecutablePlaceholderAudit,
} from "./executable-placeholder-audit"
import {
  buildAssembledFlowBlueprint,
  verifyHarnessFlowArtifact,
  type HarnessFlowGraph,
  type HarnessFlowModuleClaim,
} from "./flow-graph"
import {
  buildTodo27NativeRewriteInventory,
  verifyTodo27NativeRewriteInventory,
  type Todo27NativeRewriteInventory,
  type Todo27NativeRewriteInventoryItem,
} from "./todo27-native-rewrite-inventory"
import type {
  ProductTaskNativeCadenceFixtureSet,
  ProductTaskParityArtifact,
} from "./task-parity"

export type Todo27OpenCodeSplitAcceptanceStatus = "ready-for-review" | "issues-found"
export type Todo27OpenCodeSplitAcceptanceScope = "opencode-split-review-only"
export type Todo27OpenCodeTodoCompletionStatus = "executable-native-parity-verified-metadata-retained" | "not-complete-native-proof-required"

export interface Todo27OpenCodeSplitAcceptanceStage {
  stageID: string
  atomIDs: string[]
  parityTargetRefs: string[]
  parityTargetSatisfied: boolean
  blockers: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  moduleClaims: Array<Pick<
    HarnessFlowModuleClaim,
    | "atomID"
    | "portIDs"
    | "sourceProduct"
    | "implementationLevel"
    | "parityCompatible"
    | "parityTargetRef"
    | "parityTargetSatisfied"
    | "blockers"
  >>
}

export interface Todo27OpenCodeSplitAcceptanceAtom {
  atomID: string
  plane: Todo27NativeRewriteInventoryItem["plane"]
  implementationLevel: Todo27NativeRewriteInventoryItem["implementationLevel"]
  disposition: Todo27NativeRewriteInventoryItem["disposition"]
  fixtureIDs: string[]
  knownLossiness: string[]
  blocker: string
}

export interface Todo27OpenCodeSplitAcceptance {
  schemaVersion: 1
  artifactKind: "todo27-opencode-split-acceptance"
  generatedAt: string
  product: "opencode"
  acceptanceScope: Todo27OpenCodeSplitAcceptanceScope
  todoCompletion: {
    status: Todo27OpenCodeTodoCompletionStatus
    completionClaim: false
    nativeParityVerified: false
    executableNativeParityVerified: boolean
    productNativeComplete: number
  }
  upstreamTarget: {
    ref: string
    evidencePolicy: "native-proof-required"
    nativeParityVerified: false
    executableNativeParityVerified: boolean
  }
  sources: {
    assemblyContract: {
      product: string
      recipeID: string
      fingerprint: string
      verificationOK: boolean
      taskParity: string
      nativeFixtures: string
      atoms: number
      productSpecificAtoms: number
    }
    flowGraph: {
      product: string
      source: string
      mode: string
      fingerprint: string
      verificationOK: boolean
      stages: number
      parityTargetStages: number
      parityTargetSatisfiedStages: number
      parityTargetBlockedStages: number
    }
    executableAudit: {
      products: string[]
      fingerprint: string
      verificationOK: boolean
      requiredBindings: number
      compileBlockers: number
      metadataOnlyExecutableBindings: number
      previewOnlyExecutableBindings: number
    }
    currentModuleAudit: {
      products: string[]
      fingerprint: string
      verificationOK: boolean
      productNativeComplete: number
      productAtomItems: number
      requiredBindingItems: number
      workQueueItems: number
    }
    inventory: {
      products: string[]
      fingerprint: string
      verificationOK: boolean
      transitionAtoms: number
      selectedTransitionAtoms: number
      productNativeComplete: number
      fixtureLinked: number
      lossinessLinked: number
    }
  }
  trackedStages: Todo27OpenCodeSplitAcceptanceStage[]
  trackedAtoms: Todo27OpenCodeSplitAcceptanceAtom[]
  summary: {
    status: Todo27OpenCodeSplitAcceptanceStatus
    transitionAtoms: number
    selectedTransitionAtoms: number
    rewriteOpenWithPartialEvidence: number
    previewRetained: number
    metadataRetained: number
    fixtureLinked: number
    lossinessLinked: number
    parityTargetBlockedStages: number
    parityTargetSatisfiedStages: number
    executableNativeParityVerified: boolean
    trackedStages: number
    trackedAtoms: number
    verifierSourcesOK: number
    fingerprint: string
  }
}

export interface BuildTodo27OpenCodeSplitAcceptanceInput {
  generatedAt?: string
  contract?: AssemblyContract
  taskParityArtifact?: ProductTaskParityArtifact
  nativeFixtureSet?: ProductTaskNativeCadenceFixtureSet
  includeDefaultEvidenceArtifacts?: boolean
  flowGraph?: HarnessFlowGraph
  executableAudit?: ExecutablePlaceholderAudit
  currentModuleAudit?: CurrentModulePlaceholderAudit
  inventory?: Todo27NativeRewriteInventory
}

export interface Todo27OpenCodeSplitAcceptanceVerificationCheck {
  id: string
  ok: boolean
  severity: "error" | "warning"
  message: string
  refs: string[]
}

export interface Todo27OpenCodeSplitAcceptanceVerification {
  ok: boolean
  fingerprint: string
  checks: Todo27OpenCodeSplitAcceptanceVerificationCheck[]
  issues: Todo27OpenCodeSplitAcceptanceVerificationCheck[]
  warnings: Todo27OpenCodeSplitAcceptanceVerificationCheck[]
}

type Todo27OpenCodeSplitAcceptanceSummaryWithoutFingerprint = Omit<Todo27OpenCodeSplitAcceptance["summary"], "fingerprint">
type Todo27OpenCodeSplitAcceptanceFingerprintInput = Omit<Todo27OpenCodeSplitAcceptance, "summary"> & {
  summary: Todo27OpenCodeSplitAcceptanceSummaryWithoutFingerprint
}

const openCodeUpstreamTargetRef = "anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
const trackedStageIDs = ["prompt.assemble", "provider.request", "tool.execute", "session.assistant-write"] as const
const requiredTrackedAtomIDs = [
  "opencode.prompt.mode-builder",
  "opencode.turn.provider-request-builder",
  "opencode.provider.request-options",
  "opencode.tool.schema-bridge",
  "opencode.session.store.sqlite-projection",
  "opencode.runtime.acceptance-controller.native-like",
  "opencode.product-shell.sdk",
  "opencode.ui.event-loop",
  "opencode.ui.renderer",
  "opencode.tool-pack.compatibility",
  "opencode.trace.debug-surface",
] as const

export function buildTodo27OpenCodeSplitAcceptance(input: BuildTodo27OpenCodeSplitAcceptanceInput = {}): Todo27OpenCodeSplitAcceptance {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const taskParityArtifact = input.taskParityArtifact ?? (input.includeDefaultEvidenceArtifacts === false ? undefined : readDefaultTaskParityArtifact())
  const nativeFixtureSet = input.nativeFixtureSet ?? (input.includeDefaultEvidenceArtifacts === false ? undefined : readDefaultNativeFixtureSet())
  const contract = input.contract ?? buildAssemblyContract({
    product: "opencode",
    generatedAt,
    ...(taskParityArtifact ? { taskParityArtifact } : {}),
    ...(nativeFixtureSet ? { nativeCadenceFixtures: nativeFixtureSet } : {}),
  })
  const flowGraph = input.flowGraph ?? buildAssembledFlowBlueprint(contract, generatedAt)
  const executableAudit = input.executableAudit ?? buildExecutablePlaceholderAudit({ products: ["opencode"], contracts: [contract], generatedAt })
  const currentModuleAudit = input.currentModuleAudit ?? buildCurrentModulePlaceholderAudit({ products: ["opencode"], contracts: [contract], generatedAt })
  const inventory = input.inventory ?? buildTodo27NativeRewriteInventory({ products: ["opencode"], contracts: [contract], generatedAt })

  const assemblyVerification = verifyAssemblyContract(contract)
  const flowVerification = verifyHarnessFlowArtifact(flowGraph)
  const executableVerification = verifyExecutablePlaceholderAudit(executableAudit)
  const currentModuleVerification = verifyCurrentModulePlaceholderAudit(currentModuleAudit)
  const inventoryVerification = verifyTodo27NativeRewriteInventory(inventory)
  const trackedStages = trackedStagesFor(flowGraph)
  const trackedAtoms = trackedAtomsFor(inventory)
  const parityTargetStages = flowGraph.nodes.filter((node) => node.metrics.parityTargetRefs?.includes(openCodeUpstreamTargetRef))
  const verifierSourcesOK = [
    assemblyVerification.ok,
    flowVerification.ok,
    executableVerification.ok,
    currentModuleVerification.ok,
    inventoryVerification.ok,
  ].filter(Boolean).length
  const executableNativeParityVerified = executableNativeParityFactsOK({
    contract,
    flowGraph,
    executableAudit,
    inventory,
    trackedStages,
    trackedAtoms,
    sourceOK: verifierSourcesOK === 5,
  })
  const summaryWithoutFingerprint = {
    status: acceptanceFactsOK({
      contract,
      flowGraph,
      executableAudit,
      currentModuleAudit,
      inventory,
      trackedStages,
      trackedAtoms,
      sourceOK: verifierSourcesOK === 5,
    })
      ? "ready-for-review"
      : "issues-found",
    transitionAtoms: inventory.summary.total,
    selectedTransitionAtoms: inventory.summary.selected,
    rewriteOpenWithPartialEvidence: inventory.summary.rewriteOpenWithPartialEvidence,
    previewRetained: inventory.summary.previewRetained,
    metadataRetained: inventory.summary.metadataRetained,
    fixtureLinked: inventory.summary.fixtureLinked,
    lossinessLinked: inventory.summary.lossinessLinked,
    parityTargetBlockedStages: parityTargetStages.filter((node) => node.metrics.parityTargetSatisfied === false).length,
    parityTargetSatisfiedStages: parityTargetStages.filter((node) => node.metrics.parityTargetSatisfied === true).length,
    executableNativeParityVerified,
    trackedStages: trackedStages.length,
    trackedAtoms: trackedAtoms.length,
    verifierSourcesOK,
  } satisfies Todo27OpenCodeSplitAcceptanceSummaryWithoutFingerprint
  const reportWithoutSummaryFingerprint = {
    schemaVersion: 1 as const,
    artifactKind: "todo27-opencode-split-acceptance" as const,
    generatedAt,
    product: "opencode" as const,
    acceptanceScope: "opencode-split-review-only" as const,
    todoCompletion: {
      status: executableNativeParityVerified ? "executable-native-parity-verified-metadata-retained" as const : "not-complete-native-proof-required" as const,
      completionClaim: false as const,
      nativeParityVerified: false as const,
      executableNativeParityVerified,
      productNativeComplete: Math.max(currentModuleAudit.summary.productNativeComplete, inventory.summary.productNativeComplete),
    },
    upstreamTarget: {
      ref: openCodeUpstreamTargetRef,
      evidencePolicy: "native-proof-required" as const,
      nativeParityVerified: false as const,
      executableNativeParityVerified,
    },
    sources: {
      assemblyContract: {
        product: contract.product,
        recipeID: contract.recipeID,
        fingerprint: contract.fingerprints.contract,
        verificationOK: assemblyVerification.ok,
        taskParity: contract.taskParity.status,
        nativeFixtures: contract.nativeFixtures.status,
        atoms: contract.atoms.length,
        productSpecificAtoms: contract.productSpecificAtoms.length,
      },
      flowGraph: {
        product: flowGraph.product,
        source: flowGraph.source,
        mode: flowGraph.mode,
        fingerprint: flowGraph.summary.fingerprint,
        verificationOK: flowVerification.ok,
        stages: flowGraph.nodes.length,
        parityTargetStages: parityTargetStages.length,
        parityTargetSatisfiedStages: summaryWithoutFingerprint.parityTargetSatisfiedStages,
        parityTargetBlockedStages: summaryWithoutFingerprint.parityTargetBlockedStages,
      },
      executableAudit: {
        products: executableAudit.products,
        fingerprint: executableAudit.summary.fingerprint,
        verificationOK: executableVerification.ok,
        requiredBindings: executableAudit.summary.total,
        compileBlockers: executableAudit.summary.compileBlockers,
        metadataOnlyExecutableBindings: executableAudit.summary.metadataOnlyExecutableBindings,
        previewOnlyExecutableBindings: executableAudit.summary.previewOnlyExecutableBindings,
      },
      currentModuleAudit: {
        products: currentModuleAudit.products,
        fingerprint: currentModuleAudit.summary.fingerprint,
        verificationOK: currentModuleVerification.ok,
        productNativeComplete: currentModuleAudit.summary.productNativeComplete,
        productAtomItems: currentModuleAudit.summary.productAtomItems,
        requiredBindingItems: currentModuleAudit.summary.requiredBindingItems,
        workQueueItems: currentModuleAudit.workQueue.length,
      },
      inventory: {
        products: inventory.products,
        fingerprint: inventory.summary.fingerprint,
        verificationOK: inventoryVerification.ok,
        transitionAtoms: inventory.summary.total,
        selectedTransitionAtoms: inventory.summary.selected,
        productNativeComplete: inventory.summary.productNativeComplete,
        fixtureLinked: inventory.summary.fixtureLinked,
        lossinessLinked: inventory.summary.lossinessLinked,
      },
    },
    trackedStages,
    trackedAtoms,
    summary: summaryWithoutFingerprint,
  } satisfies Todo27OpenCodeSplitAcceptanceFingerprintInput
  const fingerprint = fingerprintReport(reportWithoutSummaryFingerprint)

  return {
    ...reportWithoutSummaryFingerprint,
    summary: {
      ...summaryWithoutFingerprint,
      fingerprint,
    },
  }
}

export function verifyTodo27OpenCodeSplitAcceptance(report: Todo27OpenCodeSplitAcceptance): Todo27OpenCodeSplitAcceptanceVerification {
  const checks: Todo27OpenCodeSplitAcceptanceVerificationCheck[] = []
  const add = (check: Todo27OpenCodeSplitAcceptanceVerificationCheck): void => {
    checks.push(check)
  }
  const { fingerprint: _fingerprint, ...summaryWithoutFingerprint } = report.summary
  const expectedFingerprint = fingerprintReport({ ...report, summary: summaryWithoutFingerprint })
  const trackedStageIDsInReport = new Set(report.trackedStages.map((stage) => stage.stageID))
  const trackedAtomIDsInReport = new Set(report.trackedAtoms.map((atom) => atom.atomID))
  const sourceVerifications = [
    report.sources.assemblyContract.verificationOK,
    report.sources.flowGraph.verificationOK,
    report.sources.executableAudit.verificationOK,
    report.sources.currentModuleAudit.verificationOK,
    report.sources.inventory.verificationOK,
  ]
  const readyFacts = acceptanceReportFactsOK(report)

  add({
    id: "todo27-opencode-acceptance.schema",
    ok: report.schemaVersion === 1 && report.artifactKind === "todo27-opencode-split-acceptance" && report.product === "opencode",
    severity: "error",
    message: "OpenCode split acceptance artifact must use schema v1 and product opencode.",
    refs: [String(report.schemaVersion), report.artifactKind, report.product],
  })
  add({
    id: "todo27-opencode-acceptance.fingerprint",
    ok: report.summary.fingerprint === expectedFingerprint,
    severity: "error",
    message: "OpenCode split acceptance fingerprint must match source fingerprints, tracked stages, tracked atoms, and summary.",
    refs: report.summary.fingerprint === expectedFingerprint ? [report.summary.fingerprint] : [report.summary.fingerprint, expectedFingerprint],
  })
  add({
    id: "todo27-opencode-acceptance.target",
    ok:
      report.upstreamTarget.ref === openCodeUpstreamTargetRef &&
      report.upstreamTarget.evidencePolicy === "native-proof-required" &&
      report.upstreamTarget.nativeParityVerified === false &&
      report.upstreamTarget.executableNativeParityVerified === true,
    severity: "error",
    message: "OpenCode acceptance must keep the pinned upstream parity target, native-proof-required policy, and executable native parity result.",
    refs: [report.upstreamTarget.ref, report.upstreamTarget.evidencePolicy, `nativeParityVerified=${report.upstreamTarget.nativeParityVerified}`, `executableNativeParityVerified=${report.upstreamTarget.executableNativeParityVerified}`],
  })
  add({
    id: "todo27-opencode-acceptance.scope-not-todo-complete",
    ok:
      report.acceptanceScope === "opencode-split-review-only" &&
      report.todoCompletion.status === "executable-native-parity-verified-metadata-retained" &&
      report.todoCompletion.completionClaim === false &&
      report.todoCompletion.nativeParityVerified === false &&
      report.todoCompletion.executableNativeParityVerified === true &&
      report.todoCompletion.productNativeComplete < report.sources.inventory.transitionAtoms &&
      report.summary.metadataRetained > 0,
    severity: "error",
    message: "OpenCode split acceptance verifies executable native parity but remains review scope and must not be represented as TODO27 completion while metadata overlays are retained.",
    refs: [
      report.acceptanceScope,
      report.todoCompletion.status,
      `completionClaim=${report.todoCompletion.completionClaim}`,
      `nativeParityVerified=${report.todoCompletion.nativeParityVerified}`,
      `executableNativeParityVerified=${report.todoCompletion.executableNativeParityVerified}`,
      `productNativeComplete=${report.todoCompletion.productNativeComplete}/${report.sources.inventory.transitionAtoms}`,
      `metadataRetained=${report.summary.metadataRetained}`,
    ],
  })
  add({
    id: "todo27-opencode-acceptance.source-verifiers",
    ok: sourceVerifications.every(Boolean) && report.summary.verifierSourcesOK === 5,
    severity: "error",
    message: "Assembly, Flow, executable audit, current-module audit, and TODO27 inventory verifiers must all pass.",
    refs: [
      `assembly=${report.sources.assemblyContract.verificationOK}`,
      `flow=${report.sources.flowGraph.verificationOK}`,
      `executable=${report.sources.executableAudit.verificationOK}`,
      `current=${report.sources.currentModuleAudit.verificationOK}`,
      `inventory=${report.sources.inventory.verificationOK}`,
    ],
  })
  add({
    id: "todo27-opencode-acceptance.assembly-evidence-linked",
    ok: report.sources.assemblyContract.taskParity === "linked" && report.sources.assemblyContract.nativeFixtures === "linked",
    severity: "error",
    message: "OpenCode acceptance assembly source must link the refreshed task parity and native fixture evidence artifacts.",
    refs: [`taskParity=${report.sources.assemblyContract.taskParity}`, `nativeFixtures=${report.sources.assemblyContract.nativeFixtures}`],
  })
  add({
    id: "todo27-opencode-acceptance.inventory-opencode-only",
    ok: report.sources.inventory.products.length === 1 && report.sources.inventory.products[0] === "opencode" && report.sources.inventory.transitionAtoms > 0,
    severity: "error",
    message: "Acceptance inventory must be scoped to OpenCode transition atoms.",
    refs: report.sources.inventory.products,
  })
  add({
    id: "todo27-opencode-acceptance.native-not-claimed",
    ok:
      report.sources.inventory.productNativeComplete < report.sources.inventory.transitionAtoms &&
      report.sources.currentModuleAudit.productNativeComplete < report.sources.currentModuleAudit.productAtomItems &&
      report.summary.metadataRetained > 0 &&
      report.todoCompletion.completionClaim === false &&
      report.todoCompletion.nativeParityVerified === false &&
      report.todoCompletion.executableNativeParityVerified === true,
    severity: "error",
    message: "OpenCode split acceptance must keep TODO completion separate from executable native parity while metadata-only overlays remain retained.",
    refs: [
      `inventoryNative=${report.sources.inventory.productNativeComplete}/${report.sources.inventory.transitionAtoms}`,
      `currentModuleNative=${report.sources.currentModuleAudit.productNativeComplete}/${report.sources.currentModuleAudit.productAtomItems}`,
      `metadataRetained=${report.summary.metadataRetained}`,
      `executableNativeParityVerified=${report.todoCompletion.executableNativeParityVerified}`,
      `flowSatisfiedStages=${report.summary.parityTargetSatisfiedStages}/${report.sources.flowGraph.parityTargetStages}`,
      `flowBlockedStages=${report.summary.parityTargetBlockedStages}`,
    ],
  })
  add({
    id: "todo27-opencode-acceptance.executable-native-parity-verified",
    ok:
      report.summary.executableNativeParityVerified === true &&
      report.todoCompletion.executableNativeParityVerified === true &&
      report.upstreamTarget.executableNativeParityVerified === true &&
      report.sources.flowGraph.parityTargetBlockedStages === 0 &&
      report.sources.flowGraph.parityTargetSatisfiedStages === report.sources.flowGraph.parityTargetStages &&
      report.summary.rewriteOpenWithPartialEvidence === 0 &&
      report.summary.previewRetained === 0,
    severity: "error",
    message: "OpenCode executable module parity must be verified independently from metadata-only retained overlays.",
    refs: [
      `summary=${report.summary.executableNativeParityVerified}`,
      `todo=${report.todoCompletion.executableNativeParityVerified}`,
      `target=${report.upstreamTarget.executableNativeParityVerified}`,
      `flowSatisfiedStages=${report.sources.flowGraph.parityTargetSatisfiedStages}/${report.sources.flowGraph.parityTargetStages}`,
      `rewriteOpen=${report.summary.rewriteOpenWithPartialEvidence}`,
      `previewRetained=${report.summary.previewRetained}`,
    ],
  })
  add({
    id: "todo27-opencode-acceptance.transition-evidence-complete",
    ok:
      report.sources.inventory.fixtureLinked === report.sources.inventory.transitionAtoms &&
      report.sources.inventory.lossinessLinked + report.sources.inventory.productNativeComplete === report.sources.inventory.transitionAtoms,
    severity: "error",
    message: "Every OpenCode transition atom must carry fixture and lossiness evidence for split review.",
    refs: [
      `fixtureLinked=${report.sources.inventory.fixtureLinked}/${report.sources.inventory.transitionAtoms}`,
      `lossinessOrNative=${report.sources.inventory.lossinessLinked}+${report.sources.inventory.productNativeComplete}/${report.sources.inventory.transitionAtoms}`,
      `partialEvidence=${report.summary.rewriteOpenWithPartialEvidence}`,
    ],
  })
  add({
    id: "todo27-opencode-acceptance.flow-claims-visible",
    ok:
      report.sources.flowGraph.product === "opencode" &&
      report.sources.flowGraph.mode === "blueprint" &&
      report.sources.flowGraph.parityTargetStages > 0 &&
      report.sources.flowGraph.parityTargetBlockedStages === 0 &&
      report.sources.flowGraph.parityTargetSatisfiedStages === report.sources.flowGraph.parityTargetStages,
    severity: "error",
    message: "OpenCode Flow blueprint must show executable parity target stages satisfied while metadata-only overlays remain visible as module claims.",
    refs: [
      report.sources.flowGraph.product,
      report.sources.flowGraph.mode,
      `blocked=${report.sources.flowGraph.parityTargetBlockedStages}/${report.sources.flowGraph.parityTargetStages}`,
      `satisfied=${report.sources.flowGraph.parityTargetSatisfiedStages}/${report.sources.flowGraph.parityTargetStages}`,
    ],
  })
  add({
    id: "todo27-opencode-acceptance.tracked-stages-present",
    ok: trackedStageIDs.every((stageID) => trackedStageIDsInReport.has(stageID)),
    severity: "error",
    message: "Acceptance report must track prompt, provider, tool, and session split stages.",
    refs: trackedStageIDs.filter((stageID) => !trackedStageIDsInReport.has(stageID)),
  })
  add({
    id: "todo27-opencode-acceptance.tracked-stages-blocked",
    ok: report.trackedStages.every(trackedStageEvidenceOK),
    severity: "error",
    message: "Tracked stages must show OpenCode target evidence plus either native satisfaction or explicit native-parity blockers.",
    refs: report.trackedStages.filter((stage) => !trackedStageEvidenceOK(stage)).map((stage) => stage.stageID),
  })
  add({
    id: "todo27-opencode-acceptance.tracked-atoms-present",
    ok: requiredTrackedAtomIDs.every((atomID) => trackedAtomIDsInReport.has(atomID)),
    severity: "error",
    message: "Acceptance report must track the key OpenCode split atoms needed for review.",
    refs: requiredTrackedAtomIDs.filter((atomID) => !trackedAtomIDsInReport.has(atomID)),
  })
  add({
    id: "todo27-opencode-acceptance.tracked-atoms-evidenced",
    ok: report.trackedAtoms.every(trackedAtomEvidenceOK),
    severity: "error",
    message: "Tracked OpenCode atoms must expose fixtures plus either native completion proof or remaining lossiness.",
    refs: report.trackedAtoms.filter((atom) => !trackedAtomEvidenceOK(atom)).map((atom) => atom.atomID),
  })
  add({
    id: "todo27-opencode-acceptance.executable-audit-clean",
    ok: report.sources.executableAudit.compileBlockers === 0 && report.sources.executableAudit.metadataOnlyExecutableBindings === 0 && report.sources.executableAudit.previewOnlyExecutableBindings === 0,
    severity: "error",
    message: "OpenCode acceptance requires no compile-blocking executable placeholders.",
    refs: [
      `compile=${report.sources.executableAudit.compileBlockers}`,
      `metadata=${report.sources.executableAudit.metadataOnlyExecutableBindings}`,
      `preview=${report.sources.executableAudit.previewOnlyExecutableBindings}`,
    ],
  })
  add({
    id: "todo27-opencode-acceptance.status",
    ok: report.summary.status === (readyFacts ? "ready-for-review" : "issues-found"),
    severity: "error",
    message: "Acceptance status must reflect the report facts.",
    refs: [report.summary.status, readyFacts ? "ready-for-review" : "issues-found"],
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

export function writeTodo27OpenCodeSplitAcceptanceReport(input: {
  report: Todo27OpenCodeSplitAcceptance
  jsonPath?: string
  markdownPath?: string
}): void {
  if (input.jsonPath) {
    mkdirSync(dirname(input.jsonPath), { recursive: true })
    writeFileSync(input.jsonPath, `${JSON.stringify(input.report, null, 2)}\n`, "utf8")
  }
  if (input.markdownPath) {
    mkdirSync(dirname(input.markdownPath), { recursive: true })
    writeFileSync(input.markdownPath, formatTodo27OpenCodeSplitAcceptanceMarkdown(input.report), "utf8")
  }
}

export function formatTodo27OpenCodeSplitAcceptanceMarkdown(report: Todo27OpenCodeSplitAcceptance): string {
  const lines = [
    "# TODO-027 OpenCode Split Acceptance",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.summary.status}`,
    `Acceptance scope: ${report.acceptanceScope}`,
    `TODO completion: ${report.todoCompletion.status} (completionClaim=${report.todoCompletion.completionClaim}, nativeParityVerified=${report.todoCompletion.nativeParityVerified}, executableNativeParityVerified=${report.todoCompletion.executableNativeParityVerified}, productNativeComplete=${report.todoCompletion.productNativeComplete})`,
    `Fingerprint: ${report.summary.fingerprint}`,
    `Upstream target: ${report.upstreamTarget.ref}`,
    "",
    "## Sources",
    "",
    "| Source | OK | Fingerprint | Key counts |",
    "| --- | --- | --- | --- |",
    `| Assembly contract | ${report.sources.assemblyContract.verificationOK ? "yes" : "no"} | ${report.sources.assemblyContract.fingerprint} | atoms ${report.sources.assemblyContract.atoms}, product atoms ${report.sources.assemblyContract.productSpecificAtoms} |`,
    `| Flow graph | ${report.sources.flowGraph.verificationOK ? "yes" : "no"} | ${report.sources.flowGraph.fingerprint} | blocked stages ${report.sources.flowGraph.parityTargetBlockedStages}/${report.sources.flowGraph.parityTargetStages} |`,
    `| Executable audit | ${report.sources.executableAudit.verificationOK ? "yes" : "no"} | ${report.sources.executableAudit.fingerprint} | compile blockers ${report.sources.executableAudit.compileBlockers} |`,
    `| Current-module audit | ${report.sources.currentModuleAudit.verificationOK ? "yes" : "no"} | ${report.sources.currentModuleAudit.fingerprint} | native complete ${report.sources.currentModuleAudit.productNativeComplete} |`,
    `| TODO27 inventory | ${report.sources.inventory.verificationOK ? "yes" : "no"} | ${report.sources.inventory.fingerprint} | fixtures ${report.sources.inventory.fixtureLinked}/${report.sources.inventory.transitionAtoms} |`,
    "",
    "## Tracked Stages",
    "",
    "| Stage | Atoms | Target satisfied | Blockers |",
    "| --- | ---: | --- | --- |",
  ]
  for (const stage of report.trackedStages) {
    lines.push(`| ${stage.stageID} | ${stage.atomIDs.length} | ${stage.parityTargetSatisfied ? "yes" : "no"} | ${stage.blockers.slice(0, 5).join("<br>") || "none"} |`)
  }
  lines.push("", "## Tracked Atoms", "", "| Atom | Level | Disposition | Fixtures | Lossiness |", "| --- | --- | --- | ---: | ---: |")
  for (const atom of report.trackedAtoms) {
    lines.push(`| \`${atom.atomID}\` | ${atom.implementationLevel} | ${atom.disposition} | ${atom.fixtureIDs.length} | ${atom.knownLossiness.length} |`)
  }
  return `${lines.join("\n")}\n`
}

function trackedStagesFor(flowGraph: HarnessFlowGraph): Todo27OpenCodeSplitAcceptanceStage[] {
  return trackedStageIDs.map((stageID) => {
    const node = flowGraph.nodes.find((candidate) => candidate.id === stageID)
    const metrics = node?.metrics
    const moduleClaims = metrics?.moduleClaims ?? []
    return {
      stageID,
      atomIDs: node?.assembledAtomIDs ?? [],
      parityTargetRefs: metrics?.parityTargetRefs ?? [],
      parityTargetSatisfied: metrics?.parityTargetSatisfied ?? false,
      blockers: metrics?.parityTargetBlockers ?? [],
      fixtureIDs: metrics?.fixtureIDs ?? [],
      knownLossiness: metrics?.knownLossiness ?? [],
      moduleClaims: moduleClaims.map((claim) => ({
        atomID: claim.atomID,
        portIDs: claim.portIDs,
        sourceProduct: claim.sourceProduct,
        implementationLevel: claim.implementationLevel,
        parityCompatible: claim.parityCompatible,
        ...(claim.parityTargetRef ? { parityTargetRef: claim.parityTargetRef } : {}),
        parityTargetSatisfied: claim.parityTargetSatisfied,
        blockers: claim.blockers,
      })),
    }
  })
}

function trackedAtomsFor(inventory: Todo27NativeRewriteInventory): Todo27OpenCodeSplitAcceptanceAtom[] {
  const itemsByAtomID = new Map(inventory.items.map((item) => [item.atomID, item]))
  return requiredTrackedAtomIDs.flatMap((atomID) => {
    const item = itemsByAtomID.get(atomID)
    if (!item) return []
    return [
      {
        atomID: item.atomID,
        plane: item.plane,
        implementationLevel: item.implementationLevel,
        disposition: item.disposition,
        fixtureIDs: item.fixtureIDs,
        knownLossiness: item.knownLossiness,
        blocker: item.blocker,
      },
    ]
  })
}

function acceptanceFactsOK(input: {
  contract: AssemblyContract
  flowGraph: HarnessFlowGraph
  executableAudit: ExecutablePlaceholderAudit
  currentModuleAudit: CurrentModulePlaceholderAudit
  inventory: Todo27NativeRewriteInventory
  trackedStages: Todo27OpenCodeSplitAcceptanceStage[]
  trackedAtoms: Todo27OpenCodeSplitAcceptanceAtom[]
  sourceOK: boolean
}): boolean {
  return (
    executableNativeParityFactsOK(input) &&
    input.currentModuleAudit.summary.productNativeComplete < input.currentModuleAudit.summary.productAtomItems &&
    input.inventory.summary.productNativeComplete < input.inventory.summary.total &&
    input.inventory.summary.metadataRetained > 0
  )
}

function executableNativeParityFactsOK(input: {
  contract: AssemblyContract
  flowGraph: HarnessFlowGraph
  executableAudit: ExecutablePlaceholderAudit
  inventory: Todo27NativeRewriteInventory
  trackedStages: Todo27OpenCodeSplitAcceptanceStage[]
  trackedAtoms: Todo27OpenCodeSplitAcceptanceAtom[]
  sourceOK: boolean
}): boolean {
  const parityTargetStages = input.flowGraph.nodes.filter((node) => node.metrics.parityTargetRefs?.includes(openCodeUpstreamTargetRef))
  const parityTargetBlockedStages = parityTargetStages.filter((node) => node.metrics.parityTargetSatisfied === false).length
  const parityTargetSatisfiedStages = parityTargetStages.filter((node) => node.metrics.parityTargetSatisfied === true).length
  const executableParityStagesSatisfied = parityTargetStages.length > 0 && parityTargetBlockedStages === 0 && parityTargetSatisfiedStages === parityTargetStages.length
  return (
    input.sourceOK &&
    input.contract.product === "opencode" &&
    input.contract.taskParity.status === "linked" &&
    input.contract.nativeFixtures.status === "linked" &&
    input.flowGraph.product === "opencode" &&
    input.flowGraph.mode === "blueprint" &&
    executableParityStagesSatisfied &&
    input.executableAudit.summary.compileBlockers === 0 &&
    input.executableAudit.summary.metadataOnlyExecutableBindings === 0 &&
    input.executableAudit.summary.previewOnlyExecutableBindings === 0 &&
    input.inventory.products.length === 1 &&
    input.inventory.products[0] === "opencode" &&
    input.inventory.summary.total > 0 &&
    input.inventory.summary.rewriteOpenWithPartialEvidence === 0 &&
    input.inventory.summary.previewRetained === 0 &&
    input.inventory.summary.productNativeComplete + input.inventory.summary.metadataRetained === input.inventory.summary.total &&
    input.inventory.summary.fixtureLinked === input.inventory.summary.total &&
    input.inventory.summary.lossinessLinked + input.inventory.summary.productNativeComplete === input.inventory.summary.total &&
    input.trackedStages.length === trackedStageIDs.length &&
    input.trackedStages.every(trackedStageEvidenceOK) &&
    input.trackedAtoms.length === requiredTrackedAtomIDs.length &&
    input.trackedAtoms.every(trackedAtomEvidenceOK)
  )
}

function acceptanceReportFactsOK(report: Todo27OpenCodeSplitAcceptance): boolean {
  return (
    report.acceptanceScope === "opencode-split-review-only" &&
    report.todoCompletion.status === "executable-native-parity-verified-metadata-retained" &&
    report.todoCompletion.completionClaim === false &&
    report.todoCompletion.nativeParityVerified === false &&
    report.todoCompletion.executableNativeParityVerified === true &&
    report.todoCompletion.productNativeComplete < report.sources.inventory.transitionAtoms &&
    report.sources.assemblyContract.product === "opencode" &&
    report.sources.assemblyContract.taskParity === "linked" &&
    report.sources.assemblyContract.nativeFixtures === "linked" &&
    report.sources.flowGraph.product === "opencode" &&
    report.sources.flowGraph.mode === "blueprint" &&
    report.sources.flowGraph.parityTargetStages > 0 &&
    report.sources.flowGraph.parityTargetBlockedStages === 0 &&
    report.sources.flowGraph.parityTargetSatisfiedStages === report.sources.flowGraph.parityTargetStages &&
    report.summary.executableNativeParityVerified === true &&
    report.summary.rewriteOpenWithPartialEvidence === 0 &&
    report.summary.previewRetained === 0 &&
    report.summary.metadataRetained > 0 &&
    report.sources.executableAudit.compileBlockers === 0 &&
    report.sources.executableAudit.metadataOnlyExecutableBindings === 0 &&
    report.sources.executableAudit.previewOnlyExecutableBindings === 0 &&
    report.sources.currentModuleAudit.productNativeComplete < report.sources.currentModuleAudit.productAtomItems &&
    report.sources.inventory.products.length === 1 &&
    report.sources.inventory.products[0] === "opencode" &&
    report.sources.inventory.productNativeComplete < report.sources.inventory.transitionAtoms &&
    report.sources.inventory.fixtureLinked === report.sources.inventory.transitionAtoms &&
    report.sources.inventory.lossinessLinked + report.sources.inventory.productNativeComplete === report.sources.inventory.transitionAtoms &&
    report.summary.verifierSourcesOK === 5 &&
    report.trackedStages.length === trackedStageIDs.length &&
    report.trackedStages.every(trackedStageEvidenceOK) &&
    report.trackedAtoms.length === requiredTrackedAtomIDs.length &&
    report.trackedAtoms.every(trackedAtomEvidenceOK)
  )
}

function trackedAtomEvidenceOK(atom: Todo27OpenCodeSplitAcceptanceAtom): boolean {
  if (atom.fixtureIDs.length === 0) return false
  if (atom.disposition === "product-native-complete") {
    return atom.implementationLevel === "native" && atom.knownLossiness.length === 0
  }
  return atom.knownLossiness.length > 0
}

function trackedStageEvidenceOK(stage: Todo27OpenCodeSplitAcceptanceStage): boolean {
  if (stage.moduleClaims.length === 0) return false
  if (!stage.parityTargetRefs.includes(openCodeUpstreamTargetRef)) return false
  const executableClaims = stage.moduleClaims.filter((claim) => claim.implementationLevel !== "metadata-only")
  if (stage.parityTargetSatisfied) {
    return stage.blockers.length === 0 && executableClaims.length > 0 && executableClaims.every((claim) => claim.parityTargetSatisfied && claim.blockers.length === 0)
  }
  return stage.blockers.includes("native-parity-not-proven")
}

function readDefaultTaskParityArtifact(): ProductTaskParityArtifact | undefined {
  const path = defaultExistingArtifact(["docs/reports/task-parity-livecodebench-cadence.json", "docs/reports/task-parity.json"])
  if (!path) return undefined
  return JSON.parse(readFileSync(path, "utf8")) as ProductTaskParityArtifact
}

function readDefaultNativeFixtureSet(): ProductTaskNativeCadenceFixtureSet | undefined {
  const path = defaultExistingArtifact(["docs/reports/task-parity-livecodebench-native-cadence-fixtures.json"])
  if (!path) return undefined
  return JSON.parse(readFileSync(path, "utf8")) as ProductTaskNativeCadenceFixtureSet
}

function defaultExistingArtifact(paths: string[]): string | undefined {
  return paths.map((path) => resolve(path)).find((path) => existsSync(path))
}

function fingerprintReport(report: Todo27OpenCodeSplitAcceptanceFingerprintInput): string {
  return fingerprintObject({
    product: report.product,
    acceptanceScope: report.acceptanceScope,
    todoCompletion: report.todoCompletion,
    upstreamTarget: report.upstreamTarget,
    sources: report.sources,
    trackedStages: report.trackedStages,
    trackedAtoms: report.trackedAtoms,
    summary: report.summary,
  })
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
      .filter((key) => record[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
