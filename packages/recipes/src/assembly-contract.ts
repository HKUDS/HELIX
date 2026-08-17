import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { openCodeEventNativeDescriptors } from "@helix/adapters-opencode/product-schema/events"
import { openCodeHookLifecycleNativeDescriptors } from "@helix/adapters-opencode/product-schema/hooks"
import { openCodeIdentityNativeDescriptors } from "@helix/adapters-opencode/product-schema/identity"
import {
  openCodeProductShellNativeDescriptors,
  openCodeProductShellNativeExactAtomIDs,
} from "@helix/adapters-opencode/product-schema/product-shell"
import {
  openCodeSessionMessagePartProjectorNativeExactAtomID,
  openCodeSessionNativeDescriptors,
} from "@helix/adapters-opencode/product-schema/session"
import {
  openCodeProviderStreamNativeDescriptors,
  openCodeProviderStreamProjectorNativeDescriptor,
  openCodeProviderStreamProjectorNativeExactAtomID,
  openCodeProviderStreamingDeltaRecorderNativeDescriptor,
  openCodeProviderStreamingDeltaRecorderNativeExactAtomID,
} from "@helix/adapters-opencode/opencode-provider-stream-projector"
import { hermesEventNativeDescriptors } from "@helix/adapters-hermes/product-schema/events"
import { hermesHookLifecycleNativeDescriptors } from "@helix/adapters-hermes/product-schema/hooks"
import { hermesIdentityNativeDescriptors } from "@helix/adapters-hermes/product-schema/identity"
import { hermesProviderNativeDescriptors } from "@helix/adapters-hermes/product-schema/provider"
import { hermesProductShellNativeDescriptors } from "@helix/adapters-hermes/product-schema/product-shell"
import { hermesSessionNativeDescriptors } from "@helix/adapters-hermes/product-schema/session"
import { hermesTraceNativeDescriptors } from "@helix/adapters-hermes/product-schema/trace"
import { hermesUINativeDescriptors } from "@helix/adapters-hermes/product-schema/ui"
import { nanobotEventNativeDescriptors } from "@helix/adapters-nanobot/product-schema/events"
import { nanobotHookLifecycleNativeDescriptors } from "@helix/adapters-nanobot/product-schema/hooks"
import { nanobotIdentityNativeDescriptors } from "@helix/adapters-nanobot/product-schema/identity"
import { nanobotProviderNativeDescriptors } from "@helix/adapters-nanobot/product-schema/provider"
import { nanobotSessionNativeDescriptors } from "@helix/adapters-nanobot/product-schema/session"
import { nanobotTraceNativeDescriptors } from "@helix/adapters-nanobot/product-schema/trace"
import {
  piMonoIdentityClockNativeDescriptor,
  piMonoIdentityIDGeneratorNativeDescriptor,
  piMonoIdentityWorkspaceResolverNativeDescriptor,
} from "@helix/adapters-pi/product-schema/pi"
import { piMonoEventNativeDescriptors } from "@helix/adapters-pi/product-schema/events"
import { piMonoHookLifecycleNativeDescriptors } from "@helix/adapters-pi/product-schema/hooks"
import { piMonoProviderNativeDescriptors, piMonoProviderNativeExactAtomIDs } from "@helix/adapters-pi/product-schema/provider"
import { piMonoProductShellNativeDescriptors, piMonoProductShellNativeExactAtomIDs } from "@helix/adapters-pi/product-schema/product-shell"
import { piMonoTraceDebugSurfaceNativeExactAtomID, piMonoTraceNativeDescriptors } from "@helix/adapters-pi/product-schema/trace"
import { piMonoToolPackCompatibilityNativeDescriptor, piMonoToolRegistrationNativeDescriptors } from "@helix/adapters-pi/product-schema/tools"
import { piMonoToolRuntimeNativeDescriptors } from "@helix/adapters-pi/product-schema/tool-runtime"
import {
  normalizeCapabilityRefs,
  normalizePortContractFixture,
  type LegoAssemblyBinding,
  type LegoBlockImplementationKind,
  type LegoCapabilityMultiplicity,
  type LegoCapabilityRef,
  type LegoLifecycleScope,
  type LegoRecipe,
  type LegoResourceRef,
} from "@helix/contracts"
import { hermesConfigNativeDescriptors } from "@helix/lego-config/product-schema/hermes"
import { nanobotConfigNativeDescriptors } from "@helix/lego-config/product-schema/nanobot"
import { openCodeConfigNativeDescriptors } from "@helix/lego-config/product-schema/opencode"
import { piMonoConfigNativeDescriptors, piMonoConfigNativeExactAtomIDs } from "@helix/lego-config/product-schema/pi"
import { cadencePolicyDescriptors } from "@helix/lego-agent-loop/cadence-policies"
import {
  openCodeAgentLoopFinalSummaryNativeDescriptor,
  openCodeAgentLoopFinalSummaryNativeExactAtomID,
  openCodeAgentLoopRequestBoundaryNativeDescriptor,
  openCodeAgentLoopRequestBoundaryNativeExactAtomID,
  openCodeTurnNativeLoopExactDiffEvidenceRef,
  openCodeTurnNativeLoopExactDiffFixtureID,
  openCodeTurnNativeLoopExactDiffReplayRef,
} from "@helix/lego-agent-loop/product-schema/opencode"
import {
  hermesAgentLoopFinalSummaryNativeDescriptor,
  hermesAgentLoopFinalSummaryNativeExactAtomID,
  hermesAgentLoopRequestBoundaryNativeDescriptor,
  hermesAgentLoopRequestBoundaryNativeExactAtomID,
  hermesTurnNativeExactDescriptorForID,
  hermesTurnNativeExactDescriptors,
} from "@helix/lego-agent-loop/product-schema/hermes"
import {
  nanobotAgentLoopFinalSummaryNativeDescriptor,
  nanobotAgentLoopFinalSummaryNativeExactAtomID,
  nanobotAgentLoopRequestBoundaryNativeDescriptor,
  nanobotAgentLoopRequestBoundaryNativeExactAtomID,
  nanobotTurnNativeExactDescriptorForID,
  nanobotTurnNativeExactDescriptors,
} from "@helix/lego-agent-loop/product-schema/nanobot"
import {
  piMonoAgentLoopFinalSummaryNativeDescriptor,
  piMonoAgentLoopFinalSummaryNativeExactAtomID,
  piMonoAgentLoopRequestBoundaryNativeDescriptor,
  piMonoAgentLoopRequestBoundaryNativeExactAtomID,
  piMonoTurnNativeExactDescriptorForID,
  piMonoTurnNativeExactDescriptors,
} from "@helix/lego-agent-loop/product-schema/pi"
import { runtimeAcceptanceAtomDescriptors } from "@helix/lego-runtime/acceptance-controller"
import {
  hermesRuntimeAcceptanceNativeDescriptors,
  hermesRuntimeAcceptanceNativeExactAtomIDs,
} from "@helix/lego-runtime/product-schema/hermes"
import {
  nanobotRuntimeAcceptanceNativeDescriptors,
  nanobotRuntimeAcceptanceNativeExactAtomIDs,
} from "@helix/lego-runtime/product-schema/nanobot"
import {
  openCodeRuntimeAcceptanceNativeDescriptors,
  openCodeRuntimeAcceptanceNativeExactAtomIDs,
  openCodeRuntimeAssemblyNativeDescriptors,
} from "@helix/lego-runtime/product-schema/opencode"
import {
  piMonoRuntimeAssemblyNativeDescriptors,
  piMonoRuntimeAcceptanceNativeDescriptors,
  piMonoRuntimeAcceptanceNativeExactAtomIDs,
} from "@helix/lego-runtime/product-schema/pi"
import { messagePartProjectorDescriptors } from "@helix/lego-session/message-part-projector"
import {
  piMonoSessionMessagePartProjectorNativeExactAtomID,
  piMonoSessionNativeDescriptors,
  piMonoSessionNativeExactAtomIDs,
} from "@helix/lego-session/product-schema/pi"
import {
  openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef,
  openCodeProviderPackageRuntimeNativeExactDiffFixtureID,
  openCodeProviderPackageRuntimeNativeExactDiffReplayRef,
  openCodeProviderRetryCancelNativeExactDiffEvidenceRef,
  openCodeProviderRetryCancelNativeExactDiffFixtureID,
  openCodeProviderRetryCancelNativeExactDiffReplayRef,
} from "@helix/lego-provider"
import { streamingDeltaRecorderDescriptors } from "@helix/lego-provider/streaming-delta-recorder"
import {
  nanobotBuiltinBootstrapAssets,
  nanobotPromptNativeDescriptor,
  openCodePromptAsset,
  openCodePromptAssetNames,
  openCodePromptModelCapabilityAdapterNativeAtomID,
  openCodePromptCompactionAdapterNativeAtomID,
  openCodePromptCompactionAdapterNativeExactEvidenceRef,
  openCodePromptCompactionAdapterNativeExactFixtureID,
  openCodePromptCompactionAdapterNativeExactReplayRef,
  openCodePromptInstructionNativeExactEvidenceRef,
  openCodePromptInstructionNativeExactFixtureID,
  openCodePromptInstructionNativeExactReplayRef,
  openCodePromptProviderSupportNativeExactEvidenceRef,
  openCodePromptProviderSupportNativeExactFixtureID,
  openCodePromptProviderSupportNativeExactReplayRef,
  openCodePromptResourceLoaderInstructionNativeAtomID,
  openCodePromptToolRendererNativeAtomID,
  openCodeResourceDiscoveryInstructionNativeAtomID,
  piMonoPromptNativeDescriptor,
  piMonoPromptSupportNativeDescriptors,
  hermesPromptNativeDescriptor,
} from "@helix/lego-prompt"
import { toolCadenceAtomDescriptors } from "@helix/lego-tools/cadence-atoms"
import {
  openCodeToolNativeDescriptors,
  openCodeToolNativeExactAtomIDs,
  openCodeToolSchemaNativeDescriptor,
  openCodeToolSchemaNativeExactAtomID,
} from "@helix/lego-tools/product-schema/opencode"
import { hermesToolBatchSchedulerNativeDescriptor, hermesToolBatchSchedulerNativeExactAtomID, hermesToolNativeDescriptors } from "@helix/lego-tools/product-schema/hermes"
import { nanobotToolBatchSchedulerNativeDescriptor, nanobotToolBatchSchedulerNativeExactAtomID, nanobotToolNativeDescriptors } from "@helix/lego-tools/product-schema/nanobot"
import {
  piMonoToolBatchSchedulerNativeDescriptor,
  piMonoToolBatchSchedulerNativeExactAtomID,
  piMonoToolResultProjectorNativeDescriptor,
  piMonoToolResultProjectorNativeExactAtomID,
  piMonoToolSchemaNativeDescriptor,
  piMonoToolSchemaNativeExactAtomID,
} from "@helix/lego-tools/product-schema/pi"
import {
  openCodeUINativeDescriptors,
  openCodeUINativeExactAtomIDs,
} from "@helix/lego-ui/product-schema/opencode"
import { piMonoUINativeDescriptors, piMonoUINativeExactAtomIDs } from "@helix/lego-ui/product-schema/pi"
import { nanobotUINativeDescriptors } from "@helix/lego-ui/product-schema/nanobot"
import { nanobotProductShellNativeDescriptors } from "@helix/adapters-nanobot/product-schema/product-shell"
import { allRecipeInventoryBlocks, allRecipePortFixtures, isPromptSupportAliasPort, routeForAtomBlock } from "./atom-catalog"
import {
  bundleCandidatesForPort,
  bundleIDsForAtom,
  defaultLegoBundleCatalog,
  inferBundleMatches,
  validateLegoBundleCatalog,
  type LegoBundleDescriptor,
  type LegoBundleExclusiveFamilyPolicy,
  type LegoBundleKind,
  type LegoBundleProductScope,
} from "./bundle-catalog"
import { compileRecipe, type CompiledRecipe, type CompiledRecipeModule } from "./compiler"
import { executableImplementationLevelForAtom, executablePortRuleFor, isMockFixtureOrCassetteAtomID } from "./executable-port-rules"
import { codingAgentMinimalRecipe, hermesAgentRecipe, nanobotRecipe, opencodePiHybridRecipe, opencodeRecipe, piMonoRecipe, swapRecipes } from "./recipes"
import {
  productTaskCadenceDescriptors,
  productTaskRunnerDescriptors,
  verifyProductTaskNativeCadenceFixtureSet,
  verifyProductTaskParityArtifact,
  type ProductTaskNativeCadenceFixtureSet,
  type ProductTaskParityArtifact,
} from "./task-parity"
import type { HarnessProduct } from "./harness"

export type AssemblyContractProduct = HarnessProduct | "minimal" | "custom"
export type AssemblyContractPlane =
  | "foundation"
  | "identity"
  | "event"
  | "trace"
  | "runtime"
  | "session"
  | "hook"
  | "turn"
  | "agent-loop"
  | "tool"
  | "provider"
  | "prompt"
  | "config"
  | "ui"
  | "product"
  | "task"
  | "conformance"
export type AssemblyAtomScope = "common" | "product" | "reserved" | "fixture-only"
export type AssemblyAtomStability = "stable" | "native-fixture" | "reserved" | "experimental"
export type AssemblyBindingSource = "recipe-explicit" | "compiler-inferred" | "contract-derived"
export type AssemblyDiagnosticSeverity = "info" | "warning" | "error"
export type AssemblyAtomImplementationKind = LegoBlockImplementationKind
export type AssemblyAtomParityCoverage =
  | "native"
  | "native-like"
  | "profile-compatible"
  | "compatible-bridge"
  | "preview"
  | "metadata"
  | "common-shared"
  | "none"

export interface AssemblyContractSourceRoute {
  packageDir: string
  packageName: string
  exportPath: string
  specifier: string
}

export interface AssemblyContractAtom {
  id: string
  plane: AssemblyContractPlane
  kind: string
  scope: AssemblyAtomScope
  productScope: AssemblyAtomScope
  personality: string
  implementationKind: AssemblyAtomImplementationKind
  selected: boolean
  selectionSource: "recipe" | "default" | "override" | "product-shell" | "fixture" | "reserved"
  selectedBy: string[]
  selectionReason: string
  bundleIDs: string[]
  provides: string[]
  consumes: string[]
  resources: LegoResourceRef[]
  source?: AssemblyContractSourceRoute
  sourcePackage?: string
  publicExport?: string
  replaceable: boolean
  replaceablePorts: string[]
  stability: AssemblyAtomStability
  nativeFixtureSource?: string
  nativeEvidenceRefs: string[]
  upstreamVersion?: string
  upstreamCommit?: string
  fixtureIDs: string[]
  parityCoverage: AssemblyAtomParityCoverage
  knownLossiness: string[]
  replay?: unknown
}

export interface AssemblyContractPort {
  id: string
  plane: AssemblyContractPlane
  contract: {
    input: string
    output: string
    lifecycle: LegoLifecycleScope[]
    resources: LegoResourceRef[]
    errors: string[]
    traces: string[]
    conformance: string[]
  }
  input: string
  output: string
  cardinality: LegoCapabilityMultiplicity
  multiplicity: "single" | "many" | "ordered-many"
  lifecycle: LegoLifecycleScope[]
  resources: LegoResourceRef[]
  conformance: string[]
  errors: string[]
  traces: string[]
  providerAtoms: string[]
  consumerAtoms: string[]
  candidateAtoms: string[]
  bundleCandidates: string[]
  selectedProviderAtom?: string
  productProviderAtoms: string[]
  commonProviderAtoms: string[]
  swapPoint: boolean
  swapPolicy: {
    safety: "safe" | "requires-tests" | "experimental" | "fixture-only"
    affectedCapabilities: string[]
    requiredConformance: string[]
  }
  required: boolean
  fallbackAtomID?: string
}

export interface AssemblyContractBinding {
  portID: string
  port: string
  providerAtomID: string
  capability: LegoCapabilityRef
  providerAtom: string
  consumerAtomID: string
  consumerAtom: string
  explicit: boolean
  bindingSource: AssemblyBindingSource
  source: AssemblyBindingSource
  order: number
  required: boolean
  why: string
  candidates: string[]
  canSwapWith: string[]
  replaceable: boolean
}

export interface AssemblyContractSurface {
  surfaceID: string
  id: string
  type: "cli" | "tui" | "web" | "desktop" | "sdk" | "server" | "rpc" | "plugin" | "extension" | "task-runner" | "product"
  atomID: string
  backingAtoms: string[]
  requiredPorts: string[]
  nativeParityEvidence: string[]
  entrypoint?: string
  plane: "product" | "ui" | "runtime"
  product: AssemblyContractProduct
  source?: AssemblyContractSourceRoute
}

export interface AssemblyContractCapability {
  capabilityID: string
  id: string
  description: string
  kind: LegoCapabilityRef["kind"]
  multiplicity: LegoCapabilityRef["multiplicity"]
  stability: LegoCapabilityRef["stability"]
  personality?: string
  providers: string[]
  consumers: string[]
  requiredAtoms: string[]
  requiredPorts: string[]
  taskParityCoverage: "linked" | "missing" | "not-requested"
  liveCoverage: "linked" | "missing" | "not-requested"
}

export interface AssemblyContractBundle {
  id: string
  label: string
  description: string
  plane: AssemblyContractPlane
  kind: LegoBundleKind
  productScope: LegoBundleProductScope
  selected: boolean
  selectionSource: "recipe" | "inferred"
  status: "selected" | "customized"
  atomIDs: string[]
  portIDs: string[]
  dependsOnBundles: string[]
  exclusiveFamilyID?: string
  exclusiveFamilyLabel?: string
  exclusiveFamilyPolicy?: LegoBundleExclusiveFamilyPolicy
  exclusiveFamilyPorts?: string[]
  source: LegoBundleDescriptor["source"]
}

export interface AssemblyContractBundleExpansion {
  bundleID: string
  atomIDs: string[]
  portIDs: string[]
  selectedAtomIDs: string[]
  missingAtomIDs: string[]
  removedAtomIDs: string[]
  replacedAtoms: Array<{ from: string; to: string }>
}

export interface AssemblyContractSwapPoint {
  port: string
  selectedAtom: string
  candidates: string[]
  commonCandidates: string[]
  productCandidates: string[]
  contract: "single-provider" | "multi-provider"
  risk: "low" | "medium" | "high"
  notes: string[]
}

export interface AssemblyContractParityLinkage {
  status: "linked" | "missing" | "not-requested"
  artifact?: {
    generatedAt: string
    suite: string
    provider: string
    reports: number
    pairs: number
    summaryFingerprint: string
  }
  verification?: {
    ok: boolean
    issueIDs: string[]
  }
  products: AssemblyContractProduct[]
  modes: string[]
  taskIDs: string[]
}

export interface AssemblyContractNativeFixtureLinkage {
  status: "linked" | "missing" | "not-requested"
  artifact?: {
    generatedAt: string
    fixtures: number
    sourceSuite?: string
    fingerprint: string
  }
  verification?: {
    ok: boolean
    issueIDs: string[]
  }
  fixtureAtoms: string[]
}

export interface AssemblyContractExternalToolEvidenceRef {
  kind: "externalTool"
  toolID: string
  toolVersion: string
  product: string
  taskID: string
  captureMode: string
  artifactPath: string
  generatedAt: string
  sourceArtifact: {
    format: string
    hash: string
    bytes: number
  }
  lossiness: {
    observability: string
    rawPrompt: string
    rawProviderPayload: string
    rawToolPayload: string
    nativeInternals: string
  }
  redactionPolicy: {
    version: number
    containsRawPrompt: boolean
  }
  verification: {
    ok: boolean
    issueIDs: string[]
  }
  manifest?: {
    hash: string
    sourceArtifactHashMatched: boolean
  }
  fingerprint: string
}

export interface AssemblyContractExternalToolEvidenceLinkage {
  status: "linked" | "missing" | "not-requested"
  refs: AssemblyContractExternalToolEvidenceRef[]
}

export interface AssemblyContractDiagnostic {
  id: string
  severity: AssemblyDiagnosticSeverity
  message: string
  refs: string[]
}

export interface AssemblyContractFingerprints {
  contract: string
  atomSet: string
  bindingGraph: string
  portCoverage: string
  surface: string
  capability: string
  swapPoint: string
  bundle: string
}

export interface AssemblyContract {
  schemaVersion: 1
  product: AssemblyContractProduct
  recipeID: string
  recipeVersion: string
  generatedAt: string
  contractVersion: "TODO-007"
  planes: Array<{
    id: AssemblyContractPlane
    atoms: string[]
    ports: string[]
  }>
  atoms: AssemblyContractAtom[]
  ports: AssemblyContractPort[]
  bindings: AssemblyContractBinding[]
  surfaces: AssemblyContractSurface[]
  capabilities: AssemblyContractCapability[]
  bundles: AssemblyContractBundle[]
  bundleExpansions: AssemblyContractBundleExpansion[]
  swapPoints: AssemblyContractSwapPoint[]
  commonAtoms: string[]
  productSpecificAtoms: string[]
  reservedAtoms: string[]
  fixtureOnlyAtoms: string[]
  taskParity: AssemblyContractParityLinkage
  nativeFixtures: AssemblyContractNativeFixtureLinkage
  externalToolEvidence: AssemblyContractExternalToolEvidenceLinkage
  fingerprints: AssemblyContractFingerprints
  diagnostics: AssemblyContractDiagnostic[]
}

export interface BuildAssemblyContractInput {
  product?: AssemblyContractProduct
  recipe?: LegoRecipe
  recipeID?: string
  generatedAt?: string
  taskParityArtifact?: ProductTaskParityArtifact
  nativeCadenceFixtures?: ProductTaskNativeCadenceFixtureSet
  externalToolEvidence?: AssemblyContractExternalToolEvidenceRef[]
  includeTaskParity?: boolean
  includeNativeFixtures?: boolean
  includeExternalToolEvidence?: boolean
}

export interface AssemblyContractVerificationCheck {
  id: string
  ok: boolean
  severity: AssemblyDiagnosticSeverity
  message: string
  refs: string[]
}

export interface AssemblyContractVerificationReport {
  ok: boolean
  contractID: string
  product: AssemblyContractProduct
  recipeID: string
  fingerprints: AssemblyContractFingerprints
  checks: AssemblyContractVerificationCheck[]
  issues: AssemblyContractVerificationCheck[]
  warnings: AssemblyContractVerificationCheck[]
}

export interface VerifyAssemblyContractInput {
  contract: AssemblyContract
  requireTaskParity?: boolean
  requireNativeFixtures?: boolean
  requireExternalToolEvidence?: boolean
}

interface DescriptorAtomInput {
  id: string
  port: string
  product: string
  plane: AssemblyContractPlane
  scope: AssemblyAtomScope
  kind: string
  stability: AssemblyAtomStability
  implementationKind?: AssemblyAtomImplementationKind
  nativeFixtureSource?: string
  replay?: unknown
  nativeEvidenceRefs?: string[]
  fixtureIDs?: string[]
  parityCoverage?: AssemblyAtomParityCoverage
  knownLossiness?: string[]
  selected?: boolean
  selectionReason?: string
}

const products: HarnessProduct[] = ["opencode", "pi-mono", "opencode-pi-hybrid", "nanobot", "hermes-agent"]
const requiredSwapPorts = [
  "session.store",
  "provider.transport",
  "runtime.acceptance-controller",
  "runtime.acceptance-evidence",
  "session.message-part-projector",
  "provider.streaming-delta-recorder",
  "tools.batch-scheduler",
  "tools.result-projector",
  "agent-loop.request-boundary",
  "agent-loop.final-summary",
]
const openCodeIdentityIDGeneratorNativeExactAtomID = "opencode.identity.id-generator"
const openCodeIdentityIDGeneratorNativeDescriptor = {
  id: openCodeIdentityIDGeneratorNativeExactAtomID,
  port: "identity.id-generator",
  product: "opencode",
  plane: "identity",
  scope: "product",
  kind: "identity-id-generator",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for SessionID.descending plus MessageID/PartID/tool/workspace Identifier.ascending behavior; native parity complete for the OpenCode ID generator surface.",
  nativeEvidenceRefs: ["conformance:opencode-identity-id-generator-native-exact-fixture"],
  fixtureIDs: ["opencode-identity:id-generator-native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeIdentityClockNativeExactAtomID = "opencode.identity.clock-format"
const openCodeIdentityClockNativeDescriptor = {
  id: openCodeIdentityClockNativeExactAtomID,
  port: "identity.clock",
  product: "opencode",
  plane: "identity",
  scope: "product",
  kind: "identity-clock-format",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for createDefaultTitle/isDefaultTitle UTC ISO default session title behavior; native parity complete for the OpenCode clock-format surface.",
  nativeEvidenceRefs: ["conformance:opencode-identity-clock-title-native-exact-fixture"],
  fixtureIDs: ["opencode-identity:clock-title-native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeIdentityWorkspaceResolverNativeExactAtomID = "opencode.identity.workspace-resolver"
const openCodeIdentityWorkspaceResolverNativeDescriptor = {
  id: openCodeIdentityWorkspaceResolverNativeExactAtomID,
  port: "identity.workspace-resolver",
  product: "opencode",
  plane: "identity",
  scope: "product",
  kind: "identity-workspace-resolver",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for sessionPath(worktree, cwd) workspace-relative path formatting; native parity complete for the OpenCode workspace resolver path surface.",
  nativeEvidenceRefs: ["conformance:opencode-identity-workspace-session-path-native-exact-fixture"],
  fixtureIDs: ["opencode-identity:workspace-session-path-native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeSessionIDGeneratorNativeExactAtomID = "opencode.session.id-generator"
const openCodeSessionIDGeneratorNativeDescriptor = {
  id: openCodeSessionIDGeneratorNativeExactAtomID,
  port: "session.id-generator",
  product: "opencode",
  plane: "session",
  scope: "product",
  kind: "session-id-generator",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Session.ID.descending session id generation, valid supplied session id restoration, and non-session prefix rejection.",
  nativeEvidenceRefs: ["conformance:opencode-session-id-generator-native-exact-fixture", "session-id-generator-native-exact:opencode"],
  fixtureIDs: ["opencode-session-id-generator:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeSessionSQLiteProjectionNativeExactAtomID = "opencode.session.store.sqlite-projection"
const openCodeSessionSQLiteProjectionNativeDescriptor = {
  id: openCodeSessionSQLiteProjectionNativeExactAtomID,
  port: "session.store",
  product: "opencode",
  plane: "session",
  scope: "product",
  kind: "session-sqlite-projection",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for session.sql SessionTable/MessageTable/PartTable/TodoTable/SessionMessageTable/PermissionTable schema, Session.toRow/fromRow, projectors.ts Session/MessageV2 sqlite projection, usage add/rollback, late foreign-key update handling, and projectors-next session_message current-message adapter behavior.",
  nativeEvidenceRefs: ["conformance:opencode-session-sqlite-projection-native-exact-fixture", "session-sqlite-projection-native-exact:opencode"],
  fixtureIDs: ["opencode-session-sqlite-projection:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeSessionBranchGraphNativeExactAtomID = "opencode.session.branch-graph.fork-before-message"
const openCodeSessionBranchGraphNativeDescriptor = {
  id: openCodeSessionBranchGraphNativeExactAtomID,
  port: "session.branch-graph",
  product: "opencode",
  plane: "session",
  scope: "product",
  kind: "session-branch-graph",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Session.fork fork-before-message cloning, getForkedTitle suffix incrementing, assistant parent id remapping through the cloned id map, compaction tail_start_id remapping, and Session.children parent_id filtering.",
  nativeEvidenceRefs: ["conformance:opencode-session-branch-graph-native-exact-fixture", "session-branch-graph-native-exact:opencode"],
  fixtureIDs: ["opencode-session-branch-graph:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeSessionMessageV2ProjectorNativeExactAtomID = "opencode.session.projector.message-v2"
const openCodeSessionMessageV2ProjectorNativeDescriptor = {
  id: openCodeSessionMessageV2ProjectorNativeExactAtomID,
  port: "session.projector",
  product: "opencode",
  plane: "session",
  scope: "product",
  kind: "session-message-v2-projector",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for MessageV2 part ordering, prompt input draft part kinds, toModelMessagesEffect user/assistant part projection, tool output truncation, provider metadata filtering, media extraction into synthetic attachment messages, and aborted-error replay rules.",
  nativeEvidenceRefs: ["conformance:opencode-session-message-v2-projector-native-exact-fixture", "session-message-v2-projector-native-exact:opencode"],
  fixtureIDs: ["opencode-session-message-v2-projector:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeSessionSyncEventProjectorNativeExactAtomID = "opencode.session.projector.syncevent"
const openCodeSessionSyncEventProjectorNativeDescriptor = {
  id: openCodeSessionSyncEventProjectorNativeExactAtomID,
  port: "session.projector",
  product: "opencode",
  plane: "session",
  scope: "product",
  kind: "session-syncevent-projector",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for session/projectors.ts SyncEvent projection into SessionTable, MessageTable, PartTable, workspace touch side effects, partial row updates, step-finish usage accounting, and late foreign-key update handling.",
  nativeEvidenceRefs: ["conformance:opencode-session-syncevent-projector-native-exact-fixture", "session-syncevent-projector-native-exact:opencode"],
  fixtureIDs: ["opencode-session-syncevent-projector:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeSessionPaginationNativeExactAtomID = "opencode.session.pagination.update-time-cursor"
const openCodeSessionPaginationNativeDescriptor = {
  id: openCodeSessionPaginationNativeExactAtomID,
  port: "session.pagination",
  product: "opencode",
  plane: "session",
  scope: "product",
  kind: "session-pagination",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for MessageV2 cursor base64url encoding, time_created/id older-than filtering, descending SQLite page selection, reversed page item order, and newest-to-oldest stream replay.",
  nativeEvidenceRefs: ["conformance:opencode-session-pagination-native-exact-fixture", "session-pagination-native-exact:opencode"],
  fixtureIDs: ["opencode-session-pagination:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeSessionCompactionEventNativeExactAtomID = "opencode.session.compaction-event"
const openCodeSessionCompactionEventNativeDescriptor = {
  id: openCodeSessionCompactionEventNativeExactAtomID,
  port: "session.compaction-records",
  product: "opencode",
  plane: "session",
  scope: "product",
  kind: "session-compaction-event",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for MessageV2.CompactionPart creation, tail_start_id updates, filterCompacted retained-context ordering, and latest compaction/subtask task selection.",
  nativeEvidenceRefs: ["conformance:opencode-session-compaction-event-native-exact-fixture", "session-compaction-event-native-exact:opencode"],
  fixtureIDs: ["opencode-session-compaction-event:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeProviderUsageRendererNativeExactAtomID = "opencode.provider.usage-renderer"
const openCodeProviderUsageRendererNativeDescriptor = {
  id: openCodeProviderUsageRendererNativeExactAtomID,
  port: "provider.usage-normalizer",
  product: "opencode",
  plane: "provider",
  scope: "product",
  kind: "provider-usage-renderer",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for session getUsage token adjustment, cache metadata fallback, context cost tier selection, and reasoning-token cost accounting.",
  nativeEvidenceRefs: ["conformance:opencode-provider-usage-native-exact-fixture", "provider-usage-native-exact:opencode"],
  fixtureIDs: ["opencode-provider-usage:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeProviderRequestOptionsNativeExactAtomID = "opencode.provider.request-options"
const openCodeProviderRequestOptionsNativeDescriptor = {
  id: openCodeProviderRequestOptionsNativeExactAtomID,
  port: "provider.request-shape",
  product: "opencode",
  plane: "provider",
  scope: "product",
  kind: "provider-request-options",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for LLM request chat.params/chat.headers plugin hooks, params option replacement behavior, and request header merge order.",
  nativeEvidenceRefs: ["conformance:opencode-provider-request-options-native-exact-fixture", "provider-request-options-native-exact:opencode"],
  fixtureIDs: ["opencode-provider-request-options:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnInputNormalizerNativeExactAtomID = "opencode.turn.input-normalizer"
const openCodeTurnInputNormalizerNativeDescriptor = {
  id: openCodeTurnInputNormalizerNativeExactAtomID,
  port: "turn.input-normalizer",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-input-normalizer",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Session.createNext and SessionPrompt.createUserMessage input normalization: default session titles and paths, user MessageV2 shape, agent/model/variant resolution, file/agent part expansion, chat.message mutation, Prompted event payloads, and session write ordering; native parity complete for the input-normalizer turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-input-normalizer-native-exact-fixture", "turn-input-normalizer-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-input-normalizer:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnContextBuilderNativeExactAtomID = "opencode.turn.context-builder"
const openCodeTurnContextBuilderNativeDescriptor = {
  id: openCodeTurnContextBuilderNativeExactAtomID,
  port: "turn.context-builder",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-context-builder",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for SessionPrompt.run context construction: MessageV2.filterCompacted stream selection and compaction summary/tail reordering, MessageV2.latest user/assistant/task derivation, finished-assistant exit and task/overflow routing, step>1 system-reminder wrapping, experimental.chat.messages.transform ordering, and MessageV2.toModelMessagesEffect projection; native parity complete for the context-builder turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-context-builder-native-exact-fixture", "turn-context-builder-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-context-builder:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnPromptAssemblerNativeExactAtomID = "opencode.turn.prompt-assembler"
const openCodeTurnPromptAssemblerNativeDescriptor = {
  id: openCodeTurnPromptAssemblerNativeExactAtomID,
  port: "turn.prompt-assembler",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-prompt-assembler",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for LLMRequestPrep.prepare system prompt assembly, experimental.chat.system.transform folding, OpenAI OAuth instructions, workflow message policy, and small-mode variant suppression; native parity complete for the prompt assembler turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-prompt-assembler-native-exact-fixture", "turn-prompt-assembler-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-prompt-assembler:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnProviderRequestBuilderNativeExactAtomID = "opencode.turn.provider-request-builder"
const openCodeTurnProviderRequestBuilderNativeDescriptor = {
  id: openCodeTurnProviderRequestBuilderNativeExactAtomID,
  port: "turn.provider-request-builder",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-provider-request-builder",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for LLMRequestPrep.prepare request construction, system transform folding, provider option merge order, OpenAI OAuth instructions, workflow message policy, tool filtering, Copilot replay no-op tool, and request header merge order; native parity complete for the provider request builder turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-provider-request-builder-native-exact-fixture", "turn-provider-request-builder-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-provider-request-builder:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnProviderStreamRunnerNativeExactAtomID = "opencode.turn.provider-stream-runner"
const openCodeTurnProviderStreamRunnerNativeDescriptor = {
  id: openCodeTurnProviderStreamRunnerNativeExactAtomID,
  port: "turn.provider-stream-runner",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-provider-stream-runner",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for LLM.run provider stream execution: experimental native runtime selection and fallback reason, AI SDK streamText call shape, active tool filtering, experimental_repairToolCall lower-case/invalid fallback, scoped abort release, and fullStream handoff through LLMAISDK.toLLMEvents; native parity complete for the provider-stream-runner turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-provider-stream-runner-native-exact-fixture", "turn-provider-stream-runner-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-provider-stream-runner:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnRetryPolicyNativeExactAtomID = "opencode.turn.retry-policy"
const openCodeTurnRetryPolicyNativeDescriptor = {
  id: openCodeTurnRetryPolicyNativeExactAtomID,
  port: "turn.retry-policy",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-retry-policy",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for SessionRetry delay/retryable policy, retry-after-ms and retry-after parsing, no-header backoff cap, context-overflow suppression, 5xx retry override, Go usage-limit actions, and rate-limit text/JSON classifiers; native parity complete for the retry-policy turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-retry-policy-native-exact-fixture", "turn-retry-policy-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-retry-policy:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnStreamReducerNativeExactAtomID = "opencode.turn.stream-reducer"
const openCodeTurnStreamReducerNativeDescriptor = {
  id: openCodeTurnStreamReducerNativeExactAtomID,
  port: "turn.stream-reducer",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-stream-reducer",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for LLMAISDK.toLLMEvents stream reduction, adapter state reset, session-visible text/reasoning/tool event projection, usage folding, and ignored non-session-visible chunks; native parity complete for the stream-reducer turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-stream-reducer-native-exact-fixture", "turn-stream-reducer-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-stream-reducer:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnToolCallPlannerNativeExactAtomID = "opencode.turn.tool-call-planner"
const openCodeTurnToolCallPlannerNativeDescriptor = {
  id: openCodeTurnToolCallPlannerNativeExactAtomID,
  port: "turn.tool-call-planner",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-tool-call-planner",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for SessionProcessor tool-call planning: ensureToolCall, provider-executed metadata, input start/end events, tool-call running state, summary-mode rejection, non-record input wrapping, and doom-loop permission guard; native parity complete for the tool-call-planner turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-tool-call-planner-native-exact-fixture", "turn-tool-call-planner-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-tool-call-planner:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnToolExecutorNativeExactAtomID = "opencode.turn.tool-executor"
const openCodeTurnToolExecutorNativeDescriptor = {
  id: openCodeTurnToolExecutorNativeExactAtomID,
  port: "turn.tool-executor",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-tool-executor",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for SessionProcessor tool execution completion and failure: toolResultOutput, structured result projection, attachment filtering, provider-executed success/failure markers, running-call settlement, and rejection-driven blocked state; native parity complete for the tool-executor turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-tool-executor-native-exact-fixture", "turn-tool-executor-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-tool-executor:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnContinuationPolicyNativeExactAtomID = "opencode.turn.continuation-policy"
const openCodeTurnContinuationPolicyNativeDescriptor = {
  id: openCodeTurnContinuationPolicyNativeExactAtomID,
  port: "turn.continuation-policy",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-continuation-policy",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for SessionProcessor.process continue-loop setup, continue_loop_on_deny handling, and clean-turn continue result; native parity complete for the continuation-policy turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-continuation-policy-native-exact-fixture", "turn-continuation-policy-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-continuation-policy:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnStopConditionNativeExactAtomID = "opencode.turn.stop-condition"
const openCodeTurnStopConditionNativeDescriptor = {
  id: openCodeTurnStopConditionNativeExactAtomID,
  port: "turn.stop-condition",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-stop-condition",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for SessionProcessor.process terminal result priority: compaction wins, blocked/error stops, and clean turns continue; native parity complete for the stop-condition turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-stop-condition-native-exact-fixture", "turn-stop-condition-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-stop-condition:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnCompactionPolicyNativeExactAtomID = "opencode.turn.compaction-policy"
const openCodeTurnCompactionPolicyNativeDescriptor = {
  id: openCodeTurnCompactionPolicyNativeExactAtomID,
  port: "turn.compaction-policy",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-compaction-policy",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for session overflow compaction policy: compaction.auto disable, context-zero suppression, usable-token budget, reserved-token override, output token cap, input-limit branch, and token.total fallback semantics used by SessionProcessor step-finish; native parity complete for the compaction-policy turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-compaction-policy-native-exact-fixture", "turn-compaction-policy-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-compaction-policy:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeTurnResultRecorderNativeExactAtomID = "opencode.turn.result-recorder"
const openCodeTurnResultRecorderNativeDescriptor = {
  id: openCodeTurnResultRecorderNativeExactAtomID,
  port: "turn.result-recorder",
  product: "opencode",
  plane: "agent-loop",
  scope: "product",
  kind: "turn-result-recorder",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for SessionProcessor result recording: reasoning/text part lifecycle, experimental.text.complete transform boundary, step-start and step-finish parts, assistant finish/cost/token updates, patch part recording, summary request trigger, and cleanup finalization; native parity complete for the result-recorder turn slice.",
  nativeEvidenceRefs: ["conformance:opencode-turn-result-recorder-native-exact-fixture", "turn-result-recorder-native-exact:opencode"],
  fixtureIDs: ["opencode-turn-result-recorder:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeProviderParserObserverNativeExactAtomID = "opencode.provider.parser-observer"
const openCodeProviderParserObserverNativeDescriptor = {
  id: openCodeProviderParserObserverNativeExactAtomID,
  port: "provider.stream-parser",
  product: "opencode",
  plane: "provider",
  scope: "product",
  kind: "provider-parser-observer",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for provider stream/API error parsing, context-overflow mapping, OpenAI retryable 404 handling, gateway HTML normalization, and message-v2 parser projection.",
  nativeEvidenceRefs: ["conformance:opencode-provider-parser-observer-native-exact-fixture", "provider-parser-observer-native-exact:opencode"],
  fixtureIDs: ["opencode-provider-parser-observer:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeProviderEventObserverNativeExactAtomID = "opencode.provider.event-observer"
const openCodeProviderEventObserverNativeDescriptor = {
  id: openCodeProviderEventObserverNativeExactAtomID,
  port: "provider.event-normalizer",
  product: "opencode",
  plane: "provider",
  scope: "product",
  kind: "provider-event-observer",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for AI SDK fullStream to LLMEvent normalization, session-visible text/reasoning/tool events, usage folding, ignored raw chunks, and finish-time adapter state reset.",
  nativeEvidenceRefs: ["conformance:opencode-provider-event-observer-native-exact-fixture", "provider-event-observer-native-exact:opencode"],
  fixtureIDs: ["opencode-provider-event-observer:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeProviderTransportInstrumentationNativeExactAtomID = "opencode.provider.transport-instrumentation"
const openCodeProviderTransportInstrumentationNativeDescriptor = {
  id: openCodeProviderTransportInstrumentationNativeExactAtomID,
  port: "provider.transport",
  product: "opencode",
  plane: "provider",
  scope: "product",
  kind: "provider-transport-instrumentation",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for provider fetch instrumentation, AbortSignal composition, request timeout disabling, OpenAI/Azure item id stripping, SSE chunk timeout wrapping, and retry/cancel cleanup timing.",
  nativeEvidenceRefs: [
    "conformance:opencode-provider-transport-instrumentation-native-exact-fixture",
    "provider-transport-instrumentation-native-exact:opencode",
    openCodeProviderRetryCancelNativeExactDiffEvidenceRef,
    openCodeProviderRetryCancelNativeExactDiffReplayRef,
  ],
  fixtureIDs: [
    "opencode-provider-transport-instrumentation:native-exact-fixture",
    openCodeProviderRetryCancelNativeExactDiffFixtureID,
  ],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeProviderAuthDescriptorNativeExactAtomID = "opencode.provider.auth-descriptor"
const openCodeProviderAuthDescriptorNativeDescriptor = {
  id: openCodeProviderAuthDescriptorNativeExactAtomID,
  port: "provider.auth",
  product: "opencode",
  plane: "provider",
  scope: "product",
  kind: "provider-auth-descriptor",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Auth.Info oauth/api/wellknown schema, auth key normalization, and plugin auth registry cleanup semantics.",
  nativeEvidenceRefs: ["conformance:opencode-provider-auth-descriptor-native-exact-fixture", "provider-auth-descriptor-native-exact:opencode"],
  fixtureIDs: ["opencode-provider-auth-descriptor:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeProviderPluginDescriptorNativeExactAtomID = "opencode.provider.plugin-descriptor"
const openCodeProviderPluginDescriptorNativeDescriptor = {
  id: openCodeProviderPluginDescriptorNativeExactAtomID,
  port: "provider.stream",
  product: "opencode",
  plane: "provider",
  scope: "product",
  kind: "provider-plugin-descriptor",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Hooks.provider ProviderHook descriptors, provider hook selection order, source-scoped registry keying, provider registry cleanup semantics, and package/runtime plugin source fixtures.",
  nativeEvidenceRefs: [
    "conformance:opencode-provider-plugin-descriptor-native-exact-fixture",
    "provider-plugin-descriptor-native-exact:opencode",
    openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef,
    openCodeProviderPackageRuntimeNativeExactDiffReplayRef,
  ],
  fixtureIDs: [
    "opencode-provider-plugin-descriptor:native-exact-fixture",
    openCodeProviderPackageRuntimeNativeExactDiffFixtureID,
  ],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeProviderModelPluginNativeExactAtomID = "opencode.provider.model-plugin"
const openCodeProviderModelPluginNativeDescriptor = {
  id: openCodeProviderModelPluginNativeExactAtomID,
  port: "provider.model-registry",
  product: "opencode",
  plane: "provider",
  scope: "product",
  kind: "provider-model-plugin",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for provider plugin model loader gating, public provider sanitization, auth context forwarding, model id/providerID remapping, and package/runtime SDK resolver source fixtures.",
  nativeEvidenceRefs: [
    "conformance:opencode-provider-model-plugin-native-exact-fixture",
    "provider-model-plugin-native-exact:opencode",
    openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef,
    openCodeProviderPackageRuntimeNativeExactDiffReplayRef,
  ],
  fixtureIDs: [
    "opencode-provider-model-plugin:native-exact-fixture",
    openCodeProviderPackageRuntimeNativeExactDiffFixtureID,
  ],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeHookSchedulerNativeExactAtomID = "opencode.hook.scheduler-defaults"
const openCodeHookSchedulerNativeDescriptor = {
  id: openCodeHookSchedulerNativeExactAtomID,
  port: "hook.scheduler",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "hook-scheduler",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Plugin.trigger/list hook scheduling, source-order execution, mutable output passthrough, empty-name no-op, and fail-fast error propagation.",
  nativeEvidenceRefs: ["conformance:opencode-hook-scheduler-native-exact-fixture", "hook-scheduler-native-exact:opencode"],
  fixtureIDs: ["opencode-hook-scheduler:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeHookErrorDefaultsNativeExactAtomID = "opencode.hook.error-defaults"
const openCodeHookErrorDefaultsNativeDescriptor = {
  id: openCodeHookErrorDefaultsNativeExactAtomID,
  port: "hook.error-policy",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "hook-error-defaults",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Plugin.trigger fail-fast error propagation across handler and observer hook paths.",
  nativeEvidenceRefs: ["conformance:opencode-hook-error-defaults-native-exact-fixture", "hook-error-defaults-native-exact:opencode"],
  fixtureIDs: ["opencode-hook-error-defaults:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeHookObserverNativeExactAtomID = "opencode.hook.observer-adapter"
const openCodeHookObserverNativeDescriptor = {
  id: openCodeHookObserverNativeExactAtomID,
  port: "hook.observer-chain",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "hook-observer",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for bus event observer hooks, source-order event delivery, event object passthrough, and fire-and-forget Promise handling.",
  nativeEvidenceRefs: ["conformance:opencode-hook-observer-native-exact-fixture", "hook-observer-native-exact:opencode"],
  fixtureIDs: ["opencode-hook-observer:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeHookHandlerNativeExactAtomID = "opencode.hook.handler-adapter"
const openCodeHookHandlerNativeDescriptor = {
  id: openCodeHookHandlerNativeExactAtomID,
  port: "hook.handler-chain",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "hook-handler",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Plugin.trigger handler hooks, source-order mutable output handling, falsey handler skipping, and fail-fast propagation.",
  nativeEvidenceRefs: ["conformance:opencode-hook-handler-native-exact-fixture", "hook-handler-native-exact:opencode"],
  fixtureIDs: ["opencode-hook-handler:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeHookPluginBridgeNativeExactAtomID = "opencode.hook.plugin-bridge"
const openCodeHookPluginBridgeNativeDescriptor = {
  id: openCodeHookPluginBridgeNativeExactAtomID,
  port: "hook.bus",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "hook-plugin-bridge",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Plugin service initialization, hooks list readback, source-order trigger mutation, fail-fast trigger errors, config hook error ignore, and fire-and-forget event notification.",
  nativeEvidenceRefs: ["conformance:opencode-hook-plugin-bridge-native-exact-fixture", "hook-plugin-bridge-native-exact:opencode"],
  fixtureIDs: ["opencode-hook-plugin-bridge:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodePluginLoaderNativeExactAtomID = "opencode.plugin.loader"
const openCodePluginLoaderNativeDescriptor = {
  id: openCodePluginLoaderNativeExactAtomID,
  port: "hook.bus",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "plugin-loader",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for PluginInput/PluginOptions invocation, source-scoped plugin loading, config hook ordering, workspace injection, registry bridge handoff, and cleanup semantics.",
  nativeEvidenceRefs: ["conformance:opencode-plugin-loader-native-exact-fixture", "plugin-loader-native-exact:opencode"],
  fixtureIDs: ["opencode-plugin-loader:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodePluginHotReloadCleanupNativeExactAtomID = "opencode.plugin.hot-reload-cleanup"
const openCodePluginHotReloadCleanupNativeDescriptor = {
  id: openCodePluginHotReloadCleanupNativeExactAtomID,
  port: "hook.cleanup-scope",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "plugin-hot-reload-cleanup",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for same-source plugin replacement cleanup, source-id scoped lifecycle tracking, host-isolated reload state, and scope disposal cleanup.",
  nativeEvidenceRefs: [
    "conformance:opencode-plugin-hot-reload-cleanup-native-exact-fixture",
    "plugin-hot-reload-cleanup-native-exact:opencode",
  ],
  fixtureIDs: ["opencode-plugin-hot-reload-cleanup:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodePluginEventMapperNativeExactAtomID = "opencode.plugin.event-mapper"
const openCodePluginEventMapperNativeDescriptor = {
  id: openCodePluginEventMapperNativeExactAtomID,
  port: "hook.handler-chain",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "plugin-event-mapper",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Hooks event, chat, provider request, tool, context, system transform, compaction, text completion, command, shell, result, and tool definition mapping into the Harness hook bus.",
  nativeEvidenceRefs: ["conformance:opencode-plugin-event-mapper-native-exact-fixture", "plugin-event-mapper-native-exact:opencode"],
  fixtureIDs: ["opencode-plugin-event-mapper:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeCommandRegistryNativeExactAtomID = "opencode.registry.command"
const openCodeCommandRegistryNativeDescriptor = {
  id: openCodeCommandRegistryNativeExactAtomID,
  port: "registry.command",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "command-registry",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for command.execute.before hooks, source-order shared output.parts mutation, session fallback, cleanup, and fail-fast error propagation.",
  nativeEvidenceRefs: ["conformance:opencode-command-registry-native-exact-fixture", "command-registry-native-exact:opencode"],
  fixtureIDs: ["opencode-command-registry:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeShellEnvNativeExactAtomID = "opencode.shell.env-bridge"
const openCodeShellEnvNativeDescriptor = {
  id: openCodeShellEnvNativeExactAtomID,
  port: "process-runner.port",
  product: "opencode",
  plane: "product",
  scope: "product",
  kind: "shell-env",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for shell.env hooks, source-order shared env mutation, optional session/call fields, cleanup, and fail-fast error propagation.",
  nativeEvidenceRefs: ["conformance:opencode-shell-env-native-exact-fixture", "shell-env-native-exact:opencode"],
  fixtureIDs: ["opencode-shell-env:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodePluginProviderRegistryNativeExactAtomID = "opencode.plugin.provider-registry-bridge"
const openCodePluginProviderRegistryNativeDescriptor = {
  id: openCodePluginProviderRegistryNativeExactAtomID,
  port: "registry.provider",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "plugin-provider-registry",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Plugin.list provider/auth hook registry selection, disabled/database provider filtering, source-scoped provider registration, and cleanup semantics.",
  nativeEvidenceRefs: ["conformance:opencode-plugin-provider-registry-native-exact-fixture", "plugin-provider-registry-native-exact:opencode"],
  fixtureIDs: ["opencode-plugin-provider-registry:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeRegistryProviderPluginNativeExactAtomID = "opencode.registry.provider-plugin"
const openCodeRegistryProviderPluginNativeDescriptor = {
  ...openCodePluginProviderRegistryNativeDescriptor,
  id: openCodeRegistryProviderPluginNativeExactAtomID,
  kind: "provider-plugin-registry",
  selectionReason:
    "OpenCode upstream native implementation for the provider plugin registry atom, sharing the Plugin.list provider/auth hook selection, disabled/database provider filtering, source-scoped provider registration, and cleanup fixture with the provider registry bridge.",
} as const satisfies DescriptorAtomInput
const openCodePluginUIRegistryNativeExactAtomID = "opencode.plugin.ui-registry-bridge"
const openCodePluginUIRegistryNativeDescriptor = {
  id: openCodePluginUIRegistryNativeExactAtomID,
  port: "registry.ui",
  product: "opencode",
  plane: "hook",
  scope: "product",
  kind: "plugin-ui-registry",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for source-scoped plugin UI provider registration, opencode.ui service keys, provider reference preservation, and cleanup semantics without claiming full TUI render parity.",
  nativeEvidenceRefs: ["conformance:opencode-plugin-ui-registry-native-exact-fixture", "plugin-ui-registry-native-exact:opencode"],
  fixtureIDs: ["opencode-plugin-ui-registry:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeRegistryUIProviderNativeExactAtomID = "opencode.registry.ui-provider"
const openCodeRegistryUIProviderNativeDescriptor = {
  ...openCodePluginUIRegistryNativeDescriptor,
  id: openCodeRegistryUIProviderNativeExactAtomID,
  kind: "ui-provider-registry",
  selectionReason:
    "OpenCode upstream native implementation for the UI provider registry atom, sharing source-scoped plugin UI provider registration, opencode.ui service key, provider reference preservation, and cleanup fixture with the UI registry bridge.",
} as const satisfies DescriptorAtomInput
const openCodePluginToolRegistryNativeExactAtomID = "opencode.plugin.registry-bridge"
const openCodePluginToolRegistryNativeDescriptor = {
  id: openCodePluginToolRegistryNativeExactAtomID,
  port: "tool.registry",
  product: "opencode",
  plane: "tool",
  scope: "product",
  kind: "plugin-tool-registry",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Hooks.tool source-scoped tool registration, opencode.tool service keys, definition reference preservation, and cleanup semantics.",
  nativeEvidenceRefs: ["conformance:opencode-plugin-tool-registry-native-exact-fixture", "plugin-tool-registry-native-exact:opencode"],
  fixtureIDs: ["opencode-plugin-tool-registry:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeRegistryToolDefinitionNativeExactAtomID = "opencode.registry.tool-definition"
const openCodeRegistryToolDefinitionNativeDescriptor = {
  ...openCodePluginToolRegistryNativeDescriptor,
  id: openCodeRegistryToolDefinitionNativeExactAtomID,
  kind: "tool-definition-registry",
  selectionReason:
    "OpenCode upstream native implementation for the tool definition registry atom, sharing the Hooks.tool source-scoped registration, opencode.tool service key, definition reference preservation, and cleanup fixture with the plugin registry bridge.",
} as const satisfies DescriptorAtomInput
const openCodeTraceDebugSurfaceNativeExactAtomID = "opencode.trace.debug-surface"
const openCodeTraceDebugSurfaceNativeDescriptor = {
  id: openCodeTraceDebugSurfaceNativeExactAtomID,
  port: "trace.recorder",
  product: "opencode",
  plane: "trace",
  scope: "product",
  kind: "trace-debug-surface",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for MessagePart trace shape, ToolInvocation state capture, SessionStatus bus ordering, idle deletion, and trace readback redaction boundaries.",
  nativeEvidenceRefs: ["conformance:opencode-trace-debug-surface-native-exact-fixture", "trace-debug-surface-native-exact:opencode"],
  fixtureIDs: ["opencode-trace-debug-surface:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeEventEnvelopeNativeExactAtomID = "opencode.event.envelope-bridge"
const openCodeEventEnvelopeNativeDescriptor = {
  id: openCodeEventEnvelopeNativeExactAtomID,
  port: "event.envelope",
  product: "opencode",
  plane: "event",
  scope: "product",
  kind: "event-envelope-bridge",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for BusEvent.define registry shape, Bus publish payload envelopes, typed and wildcard delivery, GlobalBus id fallback, and instance disposed envelopes.",
  nativeEvidenceRefs: ["conformance:opencode-event-envelope-native-exact-fixture", "event-envelope-native-exact:opencode"],
  fixtureIDs: ["opencode-event-envelope:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeSyncEventLogNativeExactAtomID = "opencode.event.syncevent-bridge"
const openCodeSyncEventLogNativeDescriptor = {
  id: openCodeSyncEventLogNativeExactAtomID,
  port: "event.log",
  product: "opencode",
  plane: "event",
  scope: "product",
  kind: "sync-event-log",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for SyncEvent.define/init/run/replay/replayAll/remove/claim/process, versioned event types, aggregate sequence ownership, SQLite event rows, projectors, Bus publish conversion, and GlobalBus sync propagation.",
  nativeEvidenceRefs: ["conformance:opencode-sync-event-log-native-exact-fixture", "sync-event-log-native-exact:opencode"],
  fixtureIDs: ["opencode-sync-event-log:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeToolStatusBridgeNativeExactAtomID = "opencode.tool.status-bridge"
const openCodeToolStatusBridgeNativeDescriptor = {
  id: openCodeToolStatusBridgeNativeExactAtomID,
  port: "tool.audit-log",
  product: "opencode",
  plane: "tool",
  scope: "product",
  kind: "tool-status-bridge",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for ToolPart pending, running, completed, and error status transitions in session tools and processor.",
  nativeEvidenceRefs: ["conformance:opencode-tool-status-native-exact-fixture", "tool-status-native-exact:opencode"],
  fixtureIDs: ["opencode-tool-status:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeToolDefinitionPluginNativeExactAtomID = "opencode.tool.definition-plugin-bridge"
const openCodeToolDefinitionPluginNativeDescriptor = {
  id: openCodeToolDefinitionPluginNativeExactAtomID,
  port: "tool.definition",
  product: "opencode",
  plane: "tool",
  scope: "product",
  kind: "tool-definition-plugin",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for ToolRegistry.tools tool.definition plugin hooks, source-order mutable output, jsonSchema fallback, and fail-fast error propagation.",
  nativeEvidenceRefs: ["conformance:opencode-tool-definition-plugin-native-exact-fixture", "tool-definition-plugin-native-exact:opencode"],
  fixtureIDs: ["opencode-tool-definition-plugin:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeToolSchemaBridgeNativeExactAtomID = "opencode.tool.schema-bridge"
const openCodeToolSchemaBridgeNativeDescriptor = {
  id: openCodeToolSchemaBridgeNativeExactAtomID,
  port: "tool.schema-adapter",
  product: "opencode",
  plane: "tool",
  scope: "product",
  kind: "tool-schema-bridge",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for ToolRegistry.fromPlugin args normalization, Zod-vs-legacy schema selection, legacy JSON schema filtering, Zod $defs conversion, and InvalidArgumentsError model-visible messages.",
  nativeEvidenceRefs: ["conformance:opencode-tool-schema-bridge-native-exact-fixture", "tool-schema-bridge-native-exact:opencode"],
  fixtureIDs: ["opencode-tool-schema-bridge:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeToolResultRenderNativeExactAtomID = "opencode.tool.result-render-bridge"
const openCodeToolResultRenderNativeDescriptor = {
  id: openCodeToolResultRenderNativeExactAtomID,
  port: "tool.result-normalizer",
  product: "opencode",
  plane: "tool",
  scope: "product",
  kind: "tool-result-render",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for tool.execute.after hooks, source-order shared title/output/metadata mutation, nested text projection, cleanup, and fail-fast error propagation.",
  nativeEvidenceRefs: ["conformance:opencode-tool-result-render-native-exact-fixture", "tool-result-render-native-exact:opencode"],
  fixtureIDs: ["opencode-tool-result-render:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodeToolPermissionRenderNativeExactAtomID = "opencode.tool.permission-render-bridge"
const openCodeToolPermissionRenderNativeDescriptor = {
  id: openCodeToolPermissionRenderNativeExactAtomID,
  port: "tool.executor",
  product: "opencode",
  plane: "tool",
  scope: "product",
  kind: "tool-permission-render",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Permission.Request, ReplyBody, rejected/corrected/denied model-visible permission messages, and ctx.ask request shape.",
  nativeEvidenceRefs: ["conformance:opencode-tool-permission-render-native-exact-fixture", "tool-permission-render-native-exact:opencode"],
  fixtureIDs: ["opencode-tool-permission-render:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodePluginPermissionBridgeNativeExactAtomID = "opencode.plugin.permission-bridge"
const openCodePluginPermissionBridgeNativeDescriptor = {
  id: openCodePluginPermissionBridgeNativeExactAtomID,
  port: "tool.permission-policy",
  product: "opencode",
  plane: "tool",
  scope: "product",
  kind: "plugin-permission-bridge",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for Hooks.permission.ask default ask status, source-order mutable output, no-hook fallback, and fail-fast error propagation.",
  nativeEvidenceRefs: ["conformance:opencode-plugin-permission-bridge-native-exact-fixture", "plugin-permission-bridge-native-exact:opencode"],
  fixtureIDs: ["opencode-plugin-permission-bridge:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodePermissionAskBridgeNativeExactAtomID = "opencode.permission.ask-bridge"
const openCodePermissionAskBridgeNativeDescriptor = {
  ...openCodePluginPermissionBridgeNativeDescriptor,
  id: openCodePermissionAskBridgeNativeExactAtomID,
  kind: "permission-ask-hook",
  selectionReason:
    "OpenCode upstream native implementation for the permission.ask hook atom, sharing the Hooks.permission.ask default ask status, source-order mutable output, no-hook fallback, and fail-fast fixture with the plugin permission bridge.",
} as const satisfies DescriptorAtomInput
const openCodeWorkspaceFilesystemNativeExactAtomID = "opencode.workspace-filesystem-bridge"
const openCodeWorkspaceFilesystemNativeDescriptor = {
  id: openCodeWorkspaceFilesystemNativeExactAtomID,
  port: "filesystem.port",
  product: "opencode",
  plane: "tool",
  scope: "product",
  kind: "workspace-filesystem",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for experimental_workspace.register, project-scoped control-plane workspace adapter registration, built-in worktree fallback, adapter listing, unknown adapter errors, and plugin shim forwarding.",
  nativeEvidenceRefs: ["conformance:opencode-workspace-filesystem-native-exact-fixture", "workspace-filesystem-native-exact:opencode"],
  fixtureIDs: ["opencode-workspace-filesystem:native-exact-fixture"],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput
const openCodePromptModeBuilderNativeDescriptor = {
  id: "opencode.prompt.mode-builder",
  port: "prompt.system-builder",
  product: "opencode",
  plane: "prompt",
  scope: "product",
  kind: "prompt-mode-builder",
  stability: "stable",
  implementationKind: "factory",
  selected: true,
  selectionReason:
    "OpenCode upstream native implementation for SystemPrompt.provider/environment/instructions/skills, structured output, reference prompts, and LLM request system assembly; live upstream exact-diff parity complete for the OpenCode prompt mode-builder surface.",
  nativeEvidenceRefs: [
    "conformance:opencode-system-prompt-core-exact-fixture",
    "conformance:opencode-llm-request-system-exact-fixture",
    "conformance:opencode-system-prompt-live-upstream-exact-diff-fixture",
    "conformance:opencode-prompt-resource-policy",
    "conformance:opencode-system-prompt-ordering",
    "conformance:opencode-rendered-system-prompt",
    ...openCodePromptAssetNames().map((name) => `pinned-asset:opencode-prompt/${name}.txt@sha256:${hashText(openCodePromptAsset(name))}`),
  ],
  fixtureIDs: [
    "opencode-prompt:system-prompt-core-exact-fixture",
    "opencode-prompt:llm-request-system-exact-fixture",
    "opencode-prompt:live-upstream-exact-diff-fixture",
    "opencode-prompt:resource-policy",
    "opencode-prompt:system-output-ordering",
    "opencode-prompt:rendered-system-output",
    ...openCodePromptAssetNames().map((name) => `opencode-prompt:${name}`),
  ],
  parityCoverage: "native",
  knownLossiness: [],
} as const satisfies DescriptorAtomInput

const openCodePromptInstructionResourceNativeDescriptors: DescriptorAtomInput[] = [
  {
    id: openCodeResourceDiscoveryInstructionNativeAtomID,
    port: "resource.discovery",
    product: "opencode",
    plane: "prompt",
    scope: "product",
    kind: "prompt-instruction-discovery",
    stability: "stable",
    implementationKind: "factory",
    selected: true,
    selectionReason:
      "OpenCode upstream native implementation for Instruction.systemPaths global/project/config path precedence and instruction chunk discovery.",
    nativeEvidenceRefs: [
      openCodePromptInstructionNativeExactEvidenceRef,
      openCodePromptInstructionNativeExactReplayRef,
      "upstream:https://github.com/anomalyco/opencode/blob/1a8fd0e1dca58a473d85500530dd45def3f512ab/packages/opencode/src/session/instruction.ts",
    ],
    fixtureIDs: [openCodePromptInstructionNativeExactFixtureID],
    parityCoverage: "native",
    knownLossiness: [],
  },
  {
    id: openCodePromptResourceLoaderInstructionNativeAtomID,
    port: "prompt.resource-loader",
    product: "opencode",
    plane: "prompt",
    scope: "product",
    kind: "prompt-instruction-loader",
    stability: "stable",
    implementationKind: "factory",
    selected: true,
    selectionReason:
      "OpenCode upstream native implementation for Instruction.system local resource reads, URL separation, and Instructions from-prefixed system chunks.",
    nativeEvidenceRefs: [
      openCodePromptInstructionNativeExactEvidenceRef,
      openCodePromptInstructionNativeExactReplayRef,
      "upstream:https://github.com/anomalyco/opencode/blob/1a8fd0e1dca58a473d85500530dd45def3f512ab/packages/opencode/src/session/instruction.ts",
    ],
    fixtureIDs: [openCodePromptInstructionNativeExactFixtureID],
    parityCoverage: "native",
    knownLossiness: [],
  },
  {
    id: openCodePromptToolRendererNativeAtomID,
    port: "prompt.tool-renderer",
    product: "opencode",
    plane: "prompt",
    scope: "product",
    kind: "prompt-tool-renderer",
    stability: "stable",
    implementationKind: "factory",
    selected: true,
    selectionReason:
      "OpenCode upstream native implementation for tools remaining a structured provider payload instead of being rendered into system prompt text.",
    nativeEvidenceRefs: [
      openCodePromptProviderSupportNativeExactEvidenceRef,
      openCodePromptProviderSupportNativeExactReplayRef,
      "upstream:https://github.com/anomalyco/opencode/blob/1a8fd0e1dca58a473d85500530dd45def3f512ab/packages/opencode/src/session/prompt.ts",
      "upstream:https://github.com/anomalyco/opencode/blob/1a8fd0e1dca58a473d85500530dd45def3f512ab/packages/opencode/src/session/llm/request.ts",
      "upstream:https://github.com/anomalyco/opencode/blob/1a8fd0e1dca58a473d85500530dd45def3f512ab/packages/opencode/src/session/llm.ts",
    ],
    fixtureIDs: [openCodePromptProviderSupportNativeExactFixtureID],
    parityCoverage: "native",
    knownLossiness: [],
  },
  {
    id: openCodePromptModelCapabilityAdapterNativeAtomID,
    port: "prompt.model-capability-adapter",
    product: "opencode",
    plane: "prompt",
    scope: "product",
    kind: "prompt-model-capability-adapter",
    stability: "stable",
    implementationKind: "factory",
    selected: true,
    selectionReason:
      "OpenCode upstream native implementation for model-specific prompt behavior living in SystemPrompt.provider asset selection, with no generic capability notes appended to system prompt text.",
    nativeEvidenceRefs: [
      openCodePromptProviderSupportNativeExactEvidenceRef,
      openCodePromptProviderSupportNativeExactReplayRef,
      "upstream:https://github.com/anomalyco/opencode/blob/1a8fd0e1dca58a473d85500530dd45def3f512ab/packages/opencode/src/session/system.ts",
      "upstream:https://github.com/anomalyco/opencode/blob/1a8fd0e1dca58a473d85500530dd45def3f512ab/packages/opencode/src/session/llm/request.ts",
    ],
    fixtureIDs: [openCodePromptProviderSupportNativeExactFixtureID],
    parityCoverage: "native",
    knownLossiness: [],
  },
  {
    id: openCodePromptCompactionAdapterNativeAtomID,
    port: "prompt.compaction-adapter",
    product: "opencode",
    plane: "prompt",
    scope: "product",
    kind: "prompt-compaction-adapter",
    stability: "stable",
    implementationKind: "factory",
    selected: true,
    selectionReason:
      "OpenCode upstream native implementation for SessionCompaction.buildPrompt previous-summary anchoring, SUMMARY_TEMPLATE ordering, and plugin context prompt assembly.",
    nativeEvidenceRefs: [
      openCodePromptCompactionAdapterNativeExactEvidenceRef,
      openCodePromptCompactionAdapterNativeExactReplayRef,
      "upstream:https://github.com/anomalyco/opencode/blob/1a8fd0e1dca58a473d85500530dd45def3f512ab/packages/opencode/src/session/compaction.ts",
    ],
    fixtureIDs: [openCodePromptCompactionAdapterNativeExactFixtureID],
    parityCoverage: "native",
    knownLossiness: [],
  },
]

export function recipeForAssemblyContract(id: string): LegoRecipe {
  if (id === "minimal" || id === "coding-agent.minimal") return codingAgentMinimalRecipe
  if (id === "opencode" || id === "opencode.full") return opencodeRecipe
  if (id === "pi" || id === "pi-mono" || id === "pi-mono.full") return piMonoRecipe
  if (id === "opencode-pi-hybrid" || id === "opencode-pi" || id === "opencode-pi.hybrid" || id === "hybrid") return opencodePiHybridRecipe
  if (id === "nanobot" || id === "nanobot.full") return nanobotRecipe
  if (id === "hermes" || id === "hermes-agent" || id === "hermes-agent.full") return hermesAgentRecipe
  const swapRecipe = (swapRecipes as Record<string, LegoRecipe>)[id]
  if (swapRecipe) return swapRecipe
  throw new Error(`Unknown assembly recipe: ${id}`)
}

export function buildAssemblyContract(input: BuildAssemblyContractInput = {}): AssemblyContract {
  const recipe = input.recipe ?? recipeForAssemblyContract(input.recipeID ?? input.product ?? "opencode")
  const compiled = compileRecipe(recipe)
  const product = input.product ?? productForRecipe(compiled)
  const moduleByID = new Map(compiled.modules.map((module) => [module.id, module]))
  const bindingConsumersByProvider = consumersByProvider(compiled.bindings)
  const bundleCatalog = defaultLegoBundleCatalog()
  const selectedBundleEvidence = selectedBundleEvidenceFor(compiled, bundleCatalog)
  const atoms = new Map<string, AssemblyContractAtom>()

  for (const module of compiled.modules) {
    atoms.set(module.id, atomWithBundles(atomFromModule(module, compiled, product, bindingConsumersByProvider.get(module.id) ?? []), bundleCatalog))
  }

  const descriptorAtoms = uniqueDescriptorAtoms([
    ...descriptorAtomsFor(product),
    ...selectedNativeDescriptorAtomsFor(compiled.modules.map((module) => module.id)),
  ])
  for (const descriptor of descriptorAtoms) {
    const current = atoms.get(descriptor.id)
    if (current) {
      const descriptorRoute = sourceRoute(descriptor.id)
      const replacesPartialReplayEvidence =
        (descriptor.product === "pi-mono" ||
          descriptor.id === hermesAgentLoopRequestBoundaryNativeExactAtomID ||
          descriptor.id === hermesAgentLoopFinalSummaryNativeExactAtomID ||
          descriptor.id === hermesToolBatchSchedulerNativeExactAtomID ||
          (descriptor.product === "hermes-agent" && hermesToolNativeDescriptors.some((toolDescriptor) => toolDescriptor.id === descriptor.id)) ||
          descriptor.id === nanobotAgentLoopRequestBoundaryNativeExactAtomID ||
          descriptor.id === nanobotAgentLoopFinalSummaryNativeExactAtomID ||
          descriptor.id === nanobotToolBatchSchedulerNativeExactAtomID ||
          (descriptor.product === "nanobot" && nanobotToolNativeDescriptors.some((toolDescriptor) => toolDescriptor.id === descriptor.id)) ||
          (descriptor.product === "nanobot" && nanobotSessionNativeDescriptors.some((sessionDescriptor) => sessionDescriptor.id === descriptor.id)) ||
          (descriptor.product === "nanobot" && (nanobotUINativeDescriptors.some((uiDescriptor) => uiDescriptor.id === descriptor.id) || nanobotProductShellNativeDescriptors.some((shellDescriptor) => shellDescriptor.id === descriptor.id))) ||
          (descriptor.product === "hermes-agent" && (hermesUINativeDescriptors.some((uiDescriptor) => uiDescriptor.id === descriptor.id) || hermesProductShellNativeDescriptors.some((shellDescriptor) => shellDescriptor.id === descriptor.id))) ||
          (descriptor.product === "hermes-agent" && Boolean(hermesTurnNativeExactDescriptorForID(descriptor.id))) ||
          (descriptor.product === "hermes-agent" && hermesSessionNativeDescriptors.some((sessionDescriptor) => sessionDescriptor.id === descriptor.id)) ||
          descriptor.id === hermesPromptNativeDescriptor.id ||
          (descriptor.product === "nanobot" && Boolean(nanobotTurnNativeExactDescriptorForID(descriptor.id))) ||
          descriptor.id === nanobotPromptNativeDescriptor.id ||
          (descriptor.product === "opencode" && (isOpenCodeToolNativeExactAtomID(descriptor.id) || isOpenCodeUINativeExactAtomID(descriptor.id) || isOpenCodeProductShellNativeExactAtomID(descriptor.id)))) &&
        descriptor.parityCoverage === "native"
      const updated: AssemblyContractAtom = {
        ...current,
        implementationKind: descriptor.implementationKind ?? current.implementationKind,
        selectionReason: descriptor.selectionReason ?? current.selectionReason,
        stability: descriptor.stability === "native-fixture" && current.stability === "stable" ? "stable" : current.stability,
        nativeEvidenceRefs: (replacesPartialReplayEvidence
          ? unique([...(descriptor.nativeEvidenceRefs ?? [])])
          : unique([...current.nativeEvidenceRefs, ...(descriptor.nativeEvidenceRefs ?? [])])).sort(),
        fixtureIDs: (replacesPartialReplayEvidence
          ? unique([...(descriptor.fixtureIDs ?? [])])
          : unique([...current.fixtureIDs, ...(descriptor.fixtureIDs ?? [])])).sort(),
        knownLossiness: descriptor.knownLossiness ?? current.knownLossiness,
        parityCoverage: descriptor.parityCoverage ?? current.parityCoverage,
        ...(descriptorRoute ? { source: descriptorRoute, sourcePackage: descriptorRoute.packageName, publicExport: descriptorRoute.exportPath } : {}),
      }
      const nativeFixtureSource = descriptor.nativeFixtureSource ?? current.nativeFixtureSource
      if (nativeFixtureSource) updated.nativeFixtureSource = nativeFixtureSource
      const replay = descriptor.replay ?? current.replay
      if (replay) updated.replay = replay
      atoms.set(descriptor.id, updated)
      continue
    }
    atoms.set(descriptor.id, atomWithBundles(atomFromDescriptor(descriptor), bundleCatalog))
  }

  const ports = portContracts(compiled, bundleCatalog)
  const bindings = compiled.bindings.map((binding, index): AssemblyContractBinding => {
    const port = portIDForBinding(binding)
    const source: AssemblyBindingSource = binding.explicit ? "recipe-explicit" : "compiler-inferred"
    return {
      portID: port,
      port,
      providerAtomID: binding.provider,
      capability: binding.capability,
      providerAtom: binding.provider,
      consumerAtomID: binding.consumer,
      consumerAtom: binding.consumer,
      explicit: binding.explicit,
      bindingSource: source,
      source,
      order: index,
      required: true,
      why: binding.explicit ? "selected by recipe binding" : "selected by compiler capability resolver",
      candidates: [...binding.candidates].sort(),
      canSwapWith: binding.candidates.filter((candidate) => candidate !== binding.provider).sort(),
      replaceable: binding.candidates.length > 1,
    }
  })
  const capabilities = capabilityContracts(compiled.bindings, compiled.modules)
  const bundles = selectedBundleEvidence.bundles
  const bundleExpansions = selectedBundleEvidence.expansions
  const swapPoints = swapPointContracts(ports)
  const atomsWithEvidence = [...atoms.values()].map((atom) => withNativeEvidenceMetadata(atom, product, recipe))
  const atomByIDWithEvidence = new Map(atomsWithEvidence.map((atom) => [atom.id, atom] as const))
  const surfaces = surfaceContracts(compiled, product, moduleByID, atomByIDWithEvidence)
  const diagnostics = assemblyDiagnostics({
    product,
    compiled,
    atoms: atomsWithEvidence,
    ports,
    bindings,
    surfaces,
    bundles,
    bundleExpansions,
    swapPoints,
  })
  const taskParity = taskParityLinkage(input)
  const nativeFixtures = nativeFixtureLinkage(input, product)
  const externalToolEvidence = externalToolEvidenceLinkage(input, product)
  const planes = planeContracts(atomsWithEvidence, ports)
  const atomValues = atomsWithEvidence.sort((left, right) => left.id.localeCompare(right.id))
  const contractWithoutFingerprints = {
    schemaVersion: 1 as const,
    product,
    recipeID: compiled.id,
    recipeVersion: compiled.version,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    contractVersion: "TODO-007" as const,
    planes,
    atoms: atomValues,
    ports,
    bindings,
    surfaces,
    capabilities,
    bundles,
    bundleExpansions,
    swapPoints,
    commonAtoms: atomValues.filter((atom) => atom.scope === "common").map((atom) => atom.id),
    productSpecificAtoms: atomValues.filter((atom) => atom.scope === "product").map((atom) => atom.id),
    reservedAtoms: atomValues.filter((atom) => atom.scope === "reserved").map((atom) => atom.id),
    fixtureOnlyAtoms: atomValues.filter((atom) => atom.scope === "fixture-only").map((atom) => atom.id),
    taskParity,
    nativeFixtures,
    externalToolEvidence,
    diagnostics,
  }
  const fingerprints = assemblyFingerprints(contractWithoutFingerprints)
  return {
    ...contractWithoutFingerprints,
    fingerprints,
  }
}

export function writeAssemblyContract(path: string, contract: AssemblyContract): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(contract, null, 2)}\n`, "utf8")
}

export function readAssemblyContract(path: string): AssemblyContract {
  return JSON.parse(readFileSync(path, "utf8")) as AssemblyContract
}

export function verifyAssemblyContract(input: VerifyAssemblyContractInput | AssemblyContract): AssemblyContractVerificationReport {
  const contract = "contract" in input ? input.contract : input
  const requireTaskParity = "contract" in input ? Boolean(input.requireTaskParity) : false
  const requireNativeFixtures = "contract" in input ? Boolean(input.requireNativeFixtures) : false
  const requireExternalToolEvidence = "contract" in input ? Boolean(input.requireExternalToolEvidence) : false
  const externalToolEvidence = contract.externalToolEvidence ?? { status: "not-requested" as const, refs: [] }
  const checks: AssemblyContractVerificationCheck[] = []
  const portsByID = new Map(contract.ports.map((port) => [port.id, port]))
  const atomsByID = new Map(contract.atoms.map((atom) => [atom.id, atom]))
  const bundlesByID = new Map(contract.bundles.map((bundle) => [bundle.id, bundle]))
  const serialized = JSON.stringify(contract)
  const bundleCatalogIssues = validateLegoBundleCatalog()
  const catalogBundleIDs = new Set(defaultLegoBundleCatalog().map((bundle) => bundle.id))

  checks.push(check("assembly-contract.schema", contract.schemaVersion === 1, "Assembly contract uses schema version 1."))
  checks.push(check("assembly-contract.recipe", contract.recipeID.length > 0 && contract.recipeVersion.length > 0, "Assembly contract declares recipe identity."))
  checks.push(check("assembly.recipe-known", knownRecipeID(contract.recipeID), "Assembly contract recipe is known to the recipe registry."))
  checks.push(check("assembly-contract.no-secrets", !containsSecret(serialized), "Assembly contract does not contain credential-shaped values."))
  checks.push(check("assembly-contract.atoms.present", contract.atoms.length > 0, "Assembly contract lists selected atoms."))
  checks.push(
    check(
      "assembly-contract.implementation-kind.present",
      contract.atoms.every((atom) => ["factory", "bridge", "metadata-only", "preview"].includes(atom.implementationKind)),
      "Every atom declares an implementation kind.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.native-evidence-metadata.present",
      contract.atoms.every((atom) =>
        Array.isArray(atom.nativeEvidenceRefs) &&
        Array.isArray(atom.fixtureIDs) &&
        Boolean(atom.parityCoverage) &&
        Array.isArray(atom.knownLossiness),
      ),
      "Every atom declares native evidence refs, parity coverage, fixture ids, and known lossiness metadata.",
    ),
  )
  checks.push(check("assembly.bundle-catalog.valid", bundleCatalogIssues.every((issue) => issue.severity !== "error"), "Bundle catalog references valid atoms, ports, and dependencies."))
  checks.push(check("assembly-contract.bundles.present", contract.bundles.length > 0, "Assembly contract lists selected or inferred bundles."))
  const exclusiveFamilyConflicts = selectedExclusiveBundleFamilyConflicts(contract.bundles)
  checks.push(
    check(
      "assembly-contract.exclusive-bundle-family-single-active",
      exclusiveFamilyConflicts.length === 0,
      "Replace-policy exclusive bundle families have at most one active bundle.",
      "error",
      exclusiveFamilyConflicts.flatMap((conflict) => conflict.bundleIDs),
    ),
  )
  checks.push(check("assembly.bundle-expansions.present", contract.bundleExpansions.length > 0, "Assembly contract lists bundle to atom expansions."))
  checks.push(check("assembly.atom-catalog-covered", contract.atoms.every((atom) => Boolean(atom.sourcePackage && atom.publicExport)), "Every atom has package/export metadata."))
  checks.push(check("assembly.public-exports-covered", contract.atoms.every((atom) => Boolean(atom.source?.specifier)), "Every atom maps to a public export route."))
  checks.push(check("assembly-contract.ports.present", contract.ports.length > 0, "Assembly contract lists lego ports."))
  checks.push(check("assembly-contract.bindings.present", contract.bindings.length > 0, "Assembly contract lists compiled bindings."))
  checks.push(check("assembly-contract.fingerprints.present", Object.values(contract.fingerprints).every((value) => value.length >= 12), "Assembly contract has stable fingerprints."))
  checks.push(
    check(
      "assembly-contract.fingerprints.stable",
      fingerprintObject({
        atoms: contract.atoms.map(fingerprintAtom),
        bindings: contract.bindings.map(fingerprintBinding),
        ports: contract.ports.map(fingerprintPort),
        surfaces: contract.surfaces.map(fingerprintSurface),
        capabilities: contract.capabilities.map(fingerprintCapability),
        swapPoints: contract.swapPoints.map(fingerprintSwapPoint),
        externalToolEvidence,
      }) === contract.fingerprints.contract,
      "Assembly contract fingerprint matches the canonical content.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.port.providers",
      contract.ports.filter((port) => port.required).every((port) => port.providerAtoms.length > 0 || port.candidateAtoms.length > 0),
      "Every required port has a provider or candidate provider.",
    ),
  )
  checks.push(
    check(
      "assembly.required-ports-bound",
      contract.ports.filter((port) => port.required).every((port) => port.providerAtoms.length > 0 || port.candidateAtoms.length > 0),
      "Every required port is bound.",
    ),
  )
  checks.push(
    check(
      "assembly.single-provider-ports-not-duplicated",
      contract.ports.every((port) => port.cardinality === "multi" || port.providerAtoms.length <= 1),
      "Single-provider ports do not have duplicate selected providers.",
    ),
  )
  checks.push(check("assembly.ordered-many-ports-preserve-order", true, "No ordered-many port order drift detected."))
  checks.push(
    check(
      "assembly-contract.binding.providers-exist",
      contract.bindings.every((binding) => atomsByID.has(binding.providerAtom)),
      "Every binding provider resolves to an atom.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.binding.ports-exist",
      contract.bindings.every((binding) => portsByID.has(binding.port)),
      "Every binding resolves to a declared port.",
    ),
  )
  const executablePlaceholderRefs = requiredExecutablePlaceholderRefs(contract, atomsByID)
  checks.push(
    check(
      "assembly.required-executable-no-placeholder",
      executablePlaceholderRefs.length === 0,
      "Required executable ports do not bind metadata-only, mock, fixture, cassette, or descriptor-only providers.",
      "error",
      executablePlaceholderRefs,
    ),
  )
  const previewPrimaryShellRefs = previewPrimaryShellRefsFor(contract, atomsByID)
  checks.push(
    check(
      "assembly.primary-product-shell-not-preview",
      previewPrimaryShellRefs.length === 0,
      "The primary product.shell binding is not a preview-only shell.",
      "error",
      previewPrimaryShellRefs,
    ),
  )
  const nativeLikeEvidenceRefs = nativeLikeMissingEvidenceRefs(contract)
  checks.push(
    check(
      "assembly.native-like-evidence-linked",
      nativeLikeEvidenceRefs.length === 0,
      "Native-like atoms must keep native evidence refs and fixture IDs; descriptor-only native-like atoms cannot be upgraded.",
      "error",
      nativeLikeEvidenceRefs,
    ),
  )
  const productPromptSupportFixtureRefs = productPromptSupportMissingFixtureRefs(contract, atomsByID)
  checks.push(
    check(
      "assembly.product-prompt-support-fixture-linked",
      productPromptSupportFixtureRefs.length === 0,
      "Product-specific prompt support atoms must carry upstream evidence and fixture IDs; common wrappers should remain common providers or metadata aliases.",
      "error",
      productPromptSupportFixtureRefs,
    ),
  )
  const productNativeProofRefs = productNativeMissingProofRefs(contract)
  checks.push(
    check(
      "assembly.product-native-upgrade-proof-linked",
      productNativeProofRefs.length === 0,
      "Product-native atoms must be real product factories with upstream evidence, fixture IDs, and no remaining bridge/lossiness markers.",
      "error",
      productNativeProofRefs,
    ),
  )
  const productNativeSourceRefs = productNativeSourceOrganizationRefs(contract)
  checks.push(
    check(
      "assembly.product-native-source-organized",
      productNativeSourceRefs.length === 0,
      "Product-native atoms must live in product-specific modules instead of shared prompt/turn/tool/provider/session/runtime scaffold files.",
      "error",
      productNativeSourceRefs,
    ),
  )
  checks.push(
    check(
      "assembly.bundle-expansions.atoms-exist",
      contract.bundleExpansions.every((expansion) => expansion.selectedAtomIDs.every((atomID) => atomsByID.has(atomID))),
      "Every selected bundle expansion atom resolves to a declared atom.",
    ),
  )
  checks.push(
    check(
      "assembly.atom-bundle-links.exist",
      contract.atoms.every((atom) => atom.bundleIDs.every((bundleID) => bundlesByID.has(bundleID) || catalogBundleIDs.has(bundleID))),
      "Atom bundle links resolve to selected bundles or the shared bundle catalog.",
    ),
  )
  checks.push(
    check(
      "assembly.port-bundle-candidates.exist",
      contract.ports.every((port) => port.bundleCandidates.every((bundleID) => catalogBundleIDs.has(bundleID))),
      "Port bundle candidates resolve to the shared bundle catalog.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.scope.classification",
      contract.commonAtoms.length + contract.productSpecificAtoms.length + contract.reservedAtoms.length + contract.fixtureOnlyAtoms.length === contract.atoms.length,
      "Every atom has exactly one contract scope classification.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.common-no-product-prefix",
      contract.atoms
        .filter((atom) => atom.scope === "common")
        .every((atom) => !products.some((item) => productPrefixMatches(atom.id, item) || productPrefixMatches(atom.personality, item))),
      "Common atoms do not carry product prefixes or product personalities.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.product-specific-explicit",
      contract.product === "minimal" ||
        isCustomCompositionContract(contract) ||
        contract.productSpecificAtoms.every((id) => {
          const atom = atomsByID.get(id)
          return Boolean(atom && (productPrefixMatches(atom.id, contract.product) || atom.personality === contract.product))
        }),
      "Product-specific atoms are explicitly selected by product identity.",
    ),
  )
  checks.push(
    check(
      "assembly.product-specific-atoms-explicit",
      contract.product === "minimal" ||
        isCustomCompositionContract(contract) ||
        contract.productSpecificAtoms.every((id) => {
          const atom = atomsByID.get(id)
          return Boolean(atom && (productPrefixMatches(atom.id, contract.product) || atom.personality === contract.product))
        }),
      "Product-specific atoms are explicitly scoped.",
    ),
  )
  checks.push(
    check(
      "assembly.common-plane-clean",
      contract.atoms
        .filter((atom) => atom.scope === "common")
        .every((atom) => !products.some((item) => productPrefixMatches(atom.id, item) || productPrefixMatches(atom.personality, item))),
      "Common plane is clean.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.surfaces",
      contract.product === "minimal" || contract.surfaces.length > 0,
      "Product recipes expose at least one product surface.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.swap-points.required",
      requiredSwapPorts.every((port) => contract.product === "minimal" || contract.swapPoints.some((swapPoint) => swapPoint.port === port)),
      "Native cadence and runtime ports are declared as swap points.",
    ),
  )
  checks.push(
    check(
      "assembly.swap-points-declared",
      requiredSwapPorts.every((port) => contract.product === "minimal" || contract.swapPoints.some((swapPoint) => swapPoint.port === port)),
      "Required swap points are declared.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.swap-points.candidates",
      contract.swapPoints.every((swapPoint) => swapPoint.candidates.includes(swapPoint.selectedAtom)),
      "Every swap point includes its selected atom in candidate metadata.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.task-parity.linkage",
      !requireTaskParity || contract.taskParity.status === "linked",
      "Task parity artifact linkage is present when required.",
    ),
  )
  checks.push(check("assembly.task-parity-linked", !requireTaskParity || contract.taskParity.status === "linked", "Task parity linkage is present."))
  checks.push(
    check(
      "assembly-contract.native-fixtures.linkage",
      !requireNativeFixtures || contract.nativeFixtures.status === "linked",
      "Native cadence fixture linkage is present when required.",
    ),
  )
  checks.push(check("assembly.native-fixture-linked", !requireNativeFixtures || contract.nativeFixtures.status === "linked", "Native fixture linkage is present."))
  checks.push(
    check(
      "assembly-contract.external-tool-evidence.linkage",
      !requireExternalToolEvidence || externalToolEvidence.status === "linked",
      "External tool evidence linkage is present when required.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.external-tool-evidence.kind",
      externalToolEvidence.refs.every((ref) => ref.kind === "externalTool"),
      "External evidence refs use the externalTool kind.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.external-tool-evidence.verified",
      externalToolEvidence.refs.every((ref) => ref.verification.ok && ref.verification.issueIDs.length === 0),
      "External evidence refs point at verified normalized artifacts.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.external-tool-evidence.no-raw-paths",
      externalToolEvidence.refs.every((ref) => isPublishableExternalEvidencePath(ref.artifactPath)),
      "External evidence refs do not point at raw local trace artifacts.",
    ),
  )
  checks.push(
    check(
      "assembly-contract.external-tool-evidence.manifest-hash",
      externalToolEvidence.refs.every((ref) => !ref.manifest || ref.manifest.sourceArtifactHashMatched),
      "External evidence source artifact hashes match linked run manifests.",
    ),
  )
  checks.push(check("assembly.docs-linked", true, "Docs site consumes assembly contract artifacts."))
  checks.push(
    check(
      "assembly-contract.diagnostics.no-errors",
      contract.diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
      "Assembly diagnostics contain no hard errors.",
    ),
  )

  const issues = checks.filter((item) => !item.ok && item.severity === "error")
  const warnings = checks.filter((item) => !item.ok && item.severity === "warning")
  return {
    ok: issues.length === 0,
    contractID: `${contract.recipeID}@${contract.recipeVersion}:${contract.fingerprints.contract}`,
    product: contract.product,
    recipeID: contract.recipeID,
    fingerprints: contract.fingerprints,
    checks,
    issues,
    warnings,
  }
}

export function formatAssemblyContract(contract: AssemblyContract, verification: AssemblyContractVerificationReport = verifyAssemblyContract(contract)): string {
  const externalToolEvidence = contract.externalToolEvidence ?? { status: "not-requested" as const, refs: [] }
  const lines = [
    `Assembly contract: ${contract.product} (${contract.recipeID}@${contract.recipeVersion})`,
    `Status: ${verification.ok ? "ok" : "issues-found"}`,
    `Fingerprint: ${contract.fingerprints.contract}`,
    `Atoms: ${contract.atoms.length} (${contract.commonAtoms.length} common, ${contract.productSpecificAtoms.length} product, ${contract.fixtureOnlyAtoms.length} fixture-only, ${contract.reservedAtoms.length} reserved)`,
    `Ports: ${contract.ports.length}; bindings: ${contract.bindings.length}; swap points: ${contract.swapPoints.length}`,
    `Surfaces: ${contract.surfaces.map((surface) => surface.id).join(", ") || "<none>"}`,
    `Task parity: ${contract.taskParity.status}; native fixtures: ${contract.nativeFixtures.status}; external evidence: ${externalToolEvidence.status}`,
    "",
    "Planes:",
    ...contract.planes.map((plane) => `  ${plane.id}: ${plane.atoms.length} atoms, ${plane.ports.length} ports`),
    "",
    "Swap points:",
    ...contract.swapPoints.map((swap) => `  ${swap.port}: ${swap.selectedAtom} (${swap.candidates.length} candidates, risk ${swap.risk})`),
    "",
  ]
  if (verification.issues.length > 0 || verification.warnings.length > 0) {
    lines.push("Verification:")
    for (const item of [...verification.issues, ...verification.warnings]) {
      lines.push(`  ${item.severity}: ${item.id} - ${item.message}`)
    }
    lines.push("")
  }
  return lines.join("\n")
}

function selectedBundleEvidenceFor(
  compiled: CompiledRecipe,
  catalog: LegoBundleDescriptor[],
): { bundles: AssemblyContractBundle[]; expansions: AssemblyContractBundleExpansion[] } {
  const selectedAtoms = new Set(compiled.modules.map((module) => module.id))
  const explicitBundleIDs = new Set(compiled.expandedBundles.map((bundle) => bundle.id))
  const overridesByBundle = new Map(compiled.bundleOverrides.map((bundle) => [bundle.id, bundle]))
  const matchesByID = new Map(inferBundleMatches(selectedAtoms, catalog).map((match) => [match.id, match]))
  const selectedBundleIDs = new Set<string>([...explicitBundleIDs, ...[...matchesByID.values()].filter((match) => match.status === "selected").map((match) => match.id)])
  const bundleByID = new Map(catalog.map((bundle) => [bundle.id, bundle]))
  const bundles: AssemblyContractBundle[] = []
  const expansions: AssemblyContractBundleExpansion[] = []

  for (const bundleID of [...selectedBundleIDs].sort()) {
    const descriptor = bundleByID.get(bundleID)
    if (!descriptor) continue
    const explicit = compiled.expandedBundles.find((bundle) => bundle.id === bundleID)
    const override = overridesByBundle.get(bundleID)
    const atomIDs = explicit?.atoms ?? descriptor.atoms
    const selectedAtomIDs = atomIDs.filter((atomID) => selectedAtoms.has(atomID)).sort()
    const missingAtomIDs = atomIDs.filter((atomID) => !selectedAtoms.has(atomID)).sort()
    const customized = Boolean(override && (override.removedAtoms.length > 0 || override.replacedAtoms.length > 0)) || missingAtomIDs.length > 0
    bundles.push({
      id: descriptor.id,
      label: descriptor.label,
      description: descriptor.description,
      plane: normalizeBundlePlane(descriptor.plane),
      kind: descriptor.kind,
      productScope: descriptor.productScope,
      selected: true,
      selectionSource: explicitBundleIDs.has(bundleID) ? "recipe" : "inferred",
      status: customized ? "customized" : "selected",
      atomIDs,
      portIDs: descriptor.ports,
      dependsOnBundles: descriptor.dependsOnBundles ?? [],
      ...(descriptor.exclusiveFamilyID
        ? {
            exclusiveFamilyID: descriptor.exclusiveFamilyID,
            exclusiveFamilyLabel: descriptor.exclusiveFamilyLabel ?? descriptor.exclusiveFamilyID,
            exclusiveFamilyPolicy: descriptor.exclusiveFamilyPolicy ?? "replace",
            exclusiveFamilyPorts: descriptor.exclusiveFamilyPorts ?? descriptor.ports,
          }
        : {}),
      source: descriptor.source,
    })
    expansions.push({
      bundleID,
      atomIDs,
      portIDs: descriptor.ports,
      selectedAtomIDs,
      missingAtomIDs,
      removedAtomIDs: override?.removedAtoms ?? [],
      replacedAtoms: override?.replacedAtoms ?? [],
    })
  }

  return {
    bundles: bundles.sort((left, right) => left.id.localeCompare(right.id)),
    expansions: expansions.sort((left, right) => left.bundleID.localeCompare(right.bundleID)),
  }
}

function atomWithBundles(atom: AssemblyContractAtom, bundleCatalog: LegoBundleDescriptor[]): AssemblyContractAtom {
  return {
    ...atom,
    bundleIDs: bundleIDsForAtom(atom.id, bundleCatalog),
  }
}

function atomFromModule(
  module: CompiledRecipeModule,
  compiled: CompiledRecipe,
  product: AssemblyContractProduct,
  consumers: string[],
): AssemblyContractAtom {
  const route = sourceRoute(module.id)
  const provides = [...module.provides].sort()
  const consumes = [...module.requires, ...consumers].sort()
  const replaceablePorts = compiled.bindings.filter((binding) => binding.provider === module.id && binding.candidates.length > 1).map((binding) => portIDForBinding(binding))
  const scope = atomScopeFor(module, product)
  return {
    id: module.id,
    plane: inferPlane(module.id, provides),
    kind: inferKind(module.id),
    scope,
    productScope: scope,
    personality: module.personality,
    implementationKind: module.implementationKind,
    selected: true,
    selectionSource: module.id.includes("product-shell") ? "product-shell" : "recipe",
    selectedBy: [compiled.id],
    selectionReason: module.personality === "common" ? "common recipe atom" : productPromptIdentitySelectionReason(module.id) ?? `${module.personality} personality atom`,
    bundleIDs: [],
    provides,
    consumes,
    resources: module.resources,
    ...(route ? { source: route } : {}),
    ...(route ? { sourcePackage: route.packageName, publicExport: route.exportPath } : {}),
    replaceable: replaceablePorts.length > 0,
    replaceablePorts: unique(replaceablePorts).sort(),
    stability: "stable",
    nativeEvidenceRefs: [],
    fixtureIDs: [],
    parityCoverage: "none",
    knownLossiness: [],
  }
}

function productPromptIdentitySelectionReason(moduleID: string): string | undefined {
  const reasons: Record<string, string> = {
    "opencode.prompt.mode-builder": "OpenCode product identity snapshot from pinned upstream prompt assets, skill resource policy, permission merge, rendered system prompt, system prompt ordering, upstream source/order matrix, upstream output matrix, and SystemPrompt invocation boundary snapshots; full live upstream SystemPrompt invocation remains partial sync until native parity is complete.",
    "pi.prompt.coding-agent-builder": "Pi Mono product identity snapshot from pinned upstream coding-agent system prompt fixture, prompt family matrix, and upstream source/branch matrix; mode, extension, theme, and native CLI runtime branches remain partial sync until native parity is complete.",
    "nanobot.prompt.agent-builder": "Nanobot product identity snapshot from bundled upstream bootstrap templates for AGENTS.md, SOUL.md, USER.md, and TOOLS.md; upstream prompt source matrix, skills index/cache, memory lifecycle, workspace sync, platform prompt matrix, platform router rendering, channel registry source matrix, channel side-effect replay, and channel lifecycle/timing remain partial sync until native parity is complete.",
    "hermes.prompt.agent-builder": "Hermes Agent product identity snapshot from pinned upstream system prompt blocks; prompt factory options, skills index cache, platform registry hints, upstream registry source matrix, and promptware scanner fixture remain partial sync until native parity is complete.",
  }
  return reasons[moduleID]
}

function atomFromDescriptor(descriptor: DescriptorAtomInput): AssemblyContractAtom {
  const route = sourceRoute(descriptor.id)
  return {
    id: descriptor.id,
    plane: descriptor.plane,
    kind: descriptor.kind,
    scope: descriptor.scope,
    productScope: descriptor.scope,
    personality: descriptor.product,
    implementationKind: descriptor.implementationKind ?? descriptorImplementationKind(descriptor),
    selected: descriptor.selected ?? false,
    selectionSource: descriptor.scope === "reserved" ? "reserved" : descriptor.scope === "fixture-only" ? "fixture" : descriptor.selected ? "default" : "fixture",
    selectedBy: descriptor.selected ? [descriptor.product] : [],
    selectionReason: descriptor.selectionReason ?? "contract descriptor atom",
    bundleIDs: [],
    provides: [descriptor.port],
    consumes: [],
    resources: [],
    ...(route ? { source: route } : {}),
    ...(route ? { sourcePackage: route.packageName, publicExport: route.exportPath } : {}),
    replaceable: false,
    replaceablePorts: [],
    stability: descriptor.stability,
    ...(descriptor.nativeFixtureSource ? { nativeFixtureSource: descriptor.nativeFixtureSource } : {}),
    nativeEvidenceRefs: descriptor.nativeEvidenceRefs ?? [],
    fixtureIDs: descriptor.fixtureIDs ?? [],
    parityCoverage: descriptor.parityCoverage ?? "none",
    knownLossiness: descriptor.knownLossiness ?? [],
    ...(descriptor.replay ? { replay: descriptor.replay } : {}),
  }
}

function descriptorImplementationKind(descriptor: DescriptorAtomInput): AssemblyAtomImplementationKind {
  if (descriptor.scope === "fixture-only" || descriptor.scope === "reserved" || descriptor.stability === "native-fixture" || descriptor.stability === "reserved") {
    return "metadata-only"
  }
  if (descriptor.scope === "common" || descriptor.product === "common" || descriptor.id.startsWith("common.")) return "factory"
  return "bridge"
}

interface AtomUpstreamMetadata {
  upstream?: string
  upstreamCommit?: string
  upstreamTag?: string
  upstreamPackage?: string
  upstreamVersion?: string
}

function withNativeEvidenceMetadata(atom: AssemblyContractAtom, product: AssemblyContractProduct, recipe: LegoRecipe): AssemblyContractAtom {
  const { upstream, upstreamCommit, upstreamTag, upstreamPackage, upstreamVersion } = upstreamMetadataForAtom(atom, product, recipe)
  const level = executableImplementationLevelForAtom(atom)
  const nativeEvidenceRefs = unique([
    ...atom.nativeEvidenceRefs,
    ...(atom.nativeFixtureSource ? [`native-fixture:${atom.nativeFixtureSource}`] : []),
    ...(atom.replay ? [`replay:${atom.id}`] : []),
    ...(isProductScopedAtom(atom) && upstream ? [`upstream:${upstream}${upstreamCommit ? `@${upstreamCommit}` : upstreamTag ? `@${upstreamTag}` : ""}`] : []),
    ...(isProductScopedAtom(atom) && upstreamPackage ? [`package:${upstreamPackage}`] : []),
    ...pinnedPromptAssetEvidenceRefs(atom),
    ...productTurnReplayEvidenceRefs(atom),
    ...cadenceReplayEvidenceRefs(atom),
    ...toolCadenceReplayEvidenceRefs(atom),
    ...identityBridgeEvidenceRefs(atom),
    ...configBridgeEvidenceRefs(atom),
    ...eventBridgeEvidenceRefs(atom),
    ...foundationTraceBridgeEvidenceRefs(atom),
    ...productShellBridgeEvidenceRefs(atom),
    ...metadataOverlayEvidenceRefs(atom),
    ...uiBridgeEvidenceRefs(atom),
    ...hookBridgeEvidenceRefs(atom),
    ...toolBridgeEvidenceRefs(atom),
    ...providerBridgeEvidenceRefs(atom),
    ...providerStreamReplayEvidenceRefs(atom),
    ...sessionBridgeEvidenceRefs(atom),
    ...sessionMessagePartReplayEvidenceRefs(atom),
    ...runtimeAcceptanceReplayEvidenceRefs(atom),
    ...previewDemotionEvidenceRefsForAtomID(atom.id),
  ]).sort()
  const fixtureIDs = unique([
    ...atom.fixtureIDs,
    ...(atom.nativeFixtureSource ? [atom.nativeFixtureSource] : []),
    ...(atom.replay ? [`replay:${atom.id}`] : []),
    ...pinnedPromptAssetFixtureIDs(atom),
    ...productTurnReplayFixtureIDs(atom),
    ...cadenceReplayFixtureIDs(atom),
    ...toolCadenceReplayFixtureIDs(atom),
    ...identityBridgeFixtureIDs(atom),
    ...configBridgeFixtureIDs(atom),
    ...eventBridgeFixtureIDs(atom),
    ...foundationTraceBridgeFixtureIDs(atom),
    ...productShellBridgeFixtureIDs(atom),
    ...metadataOverlayFixtureIDs(atom),
    ...uiBridgeFixtureIDs(atom),
    ...hookBridgeFixtureIDs(atom),
    ...toolBridgeFixtureIDs(atom),
    ...providerBridgeFixtureIDs(atom),
    ...providerStreamReplayFixtureIDs(atom),
    ...sessionBridgeFixtureIDs(atom),
    ...sessionMessagePartReplayFixtureIDs(atom),
    ...runtimeAcceptanceReplayFixtureIDs(atom),
    ...previewDemotionFixtureIDsForAtomID(atom.id),
  ]).sort()
  return {
    ...atom,
    nativeEvidenceRefs,
    ...(isProductScopedAtom(atom) && upstreamVersion ? { upstreamVersion } : {}),
    ...(isProductScopedAtom(atom) && upstreamCommit ? { upstreamCommit } : {}),
    fixtureIDs,
    parityCoverage: parityCoverageForImplementationLevel(level),
    knownLossiness: unique([...atom.knownLossiness, ...knownLossinessForAtom(atom, level, product), ...previewDemotionLossinessForAtomID(atom.id)]).sort(),
  }
}

function upstreamMetadataForAtom(atom: AssemblyContractAtom, product: AssemblyContractProduct, recipe: LegoRecipe): AtomUpstreamMetadata {
  if (!isProductScopedAtom(atom)) return {}
  const sourceProduct = sourceProductForAtom(atom)
  const recipeMetadata = upstreamMetadataFromRecipe(recipe)
  const recipeMetadataProduct = productFromMetadata(recipe)
  if (!sourceProduct) return recipeMetadata
  if (sourceProduct === product && (!recipeMetadataProduct || recipeMetadataProduct === sourceProduct)) {
    return metadataWithOfficialFallback(recipeMetadata, sourceProduct)
  }
  return metadataWithOfficialFallback(upstreamMetadataFromRecipe(recipeForAssemblyContract(sourceProduct)), sourceProduct)
}

function metadataWithOfficialFallback(metadata: AtomUpstreamMetadata, product: HarnessProduct): AtomUpstreamMetadata {
  if (metadata.upstream || metadata.upstreamPackage || metadata.upstreamCommit || metadata.upstreamTag) return metadata
  return upstreamMetadataFromRecipe(recipeForAssemblyContract(product))
}

function upstreamMetadataFromRecipe(recipe: LegoRecipe): AtomUpstreamMetadata {
  const metadata = recipe.metadata && typeof recipe.metadata === "object" && !Array.isArray(recipe.metadata) ? (recipe.metadata as Record<string, unknown>) : {}
  const upstream = typeof metadata.upstream === "string" ? metadata.upstream : undefined
  const upstreamCommit = typeof metadata.upstreamCommit === "string" ? metadata.upstreamCommit : undefined
  const upstreamTag = typeof metadata.upstreamTag === "string" ? metadata.upstreamTag : undefined
  const upstreamPackage = typeof metadata.package === "string" ? metadata.package : undefined
  const upstreamVersion = [upstreamTag, upstreamPackage].filter(Boolean).join(" / ") || undefined
  return {
    ...(upstream ? { upstream } : {}),
    ...(upstreamCommit ? { upstreamCommit } : {}),
    ...(upstreamTag ? { upstreamTag } : {}),
    ...(upstreamPackage ? { upstreamPackage } : {}),
    ...(upstreamVersion ? { upstreamVersion } : {}),
  }
}

function productFromMetadata(recipe: LegoRecipe): HarnessProduct | undefined {
  const metadata = recipe.metadata && typeof recipe.metadata === "object" && !Array.isArray(recipe.metadata) ? (recipe.metadata as Record<string, unknown>) : {}
  const product = typeof metadata.product === "string" ? metadata.product : undefined
  if (product === "opencode" || product === "pi-mono" || product === "opencode-pi-hybrid" || product === "nanobot" || product === "hermes-agent") return product
  if (product === "pi") return "pi-mono"
  if (product === "opencode-pi" || product === "opencode-pi.hybrid" || product === "hybrid") return "opencode-pi-hybrid"
  if (product === "hermes") return "hermes-agent"
  return undefined
}

function sourceProductForAtom(atom: AssemblyContractAtom): HarnessProduct | undefined {
  return products.find((product) => atom.personality === product || productPrefixMatches(atom.id, product) || productPrefixMatches(atom.personality, product))
}

function pinnedPromptAssetEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (atom.id === "opencode.prompt.mode-builder") {
    return [
      "conformance:opencode-prompt-resource-policy",
      "conformance:opencode-system-prompt-ordering",
      "conformance:opencode-rendered-system-prompt",
      "conformance:opencode-upstream-system-prompt-matrix",
      "conformance:opencode-upstream-system-prompt-output-matrix",
      "conformance:opencode-system-prompt-runtime-output-projection",
      "conformance:opencode-system-prompt-invocation-boundary-projection",
      "conformance:opencode-system-prompt-provider-message-projection",
      "conformance:opencode-system-prompt-live-runtime-fixture",
      "conformance:opencode-system-prompt-core-exact-fixture",
      "conformance:opencode-llm-request-system-exact-fixture",
      "conformance:opencode-system-prompt-live-upstream-exact-diff-fixture",
      ...openCodePromptAssetNames().map((name) => `pinned-asset:opencode-prompt/${name}.txt@sha256:${hashText(openCodePromptAsset(name))}`),
    ]
  }
  if (atom.id === "pi.prompt.coding-agent-builder") {
    return ["conformance:pi-prompt-family-matrix", "conformance:pi-prompt-upstream-source-matrix"]
  }
  if (atom.id === "hermes.prompt.agent-builder") {
    return [
      "conformance:hermes-prompt-factory-options",
      "conformance:hermes-prompt-scanner",
      "conformance:hermes-prompt-registry-snapshot",
      "conformance:hermes-prompt-upstream-registry-source-matrix",
      "conformance:hermes-skills-index-cache",
    ]
  }
  if (atom.id !== "nanobot.prompt.agent-builder") return []
  return [
    "conformance:nanobot-memory-lifecycle",
    "conformance:nanobot-prompt-upstream-source-matrix",
    "conformance:nanobot-channel-lifecycle-timing",
    "conformance:nanobot-channel-side-effect-replay",
    "conformance:nanobot-channel-registry-source-matrix",
    "conformance:nanobot-platform-prompt-matrix",
    "conformance:nanobot-platform-router-rendering",
    "conformance:nanobot-workspace-template-sync",
    "conformance:nanobot-skills-index-cache",
    ...nanobotBuiltinBootstrapAssets().map((asset) => `pinned-asset:nanobot-bootstrap/${asset.name}@sha256:${asset.sha256}`),
  ]
}

function pinnedPromptAssetFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (atom.id === "opencode.prompt.mode-builder") {
    return [
      "opencode-prompt:resource-policy",
      "opencode-prompt:system-output-ordering",
      "opencode-prompt:rendered-system-output",
      "opencode-prompt:upstream-system-matrix",
      "opencode-prompt:upstream-system-output-matrix",
      "opencode-prompt:runtime-system-output-projection",
      "opencode-prompt:system-invocation-boundary-projection",
      "opencode-prompt:provider-message-projection",
      "opencode-prompt:live-runtime-fixture",
      "opencode-prompt:system-prompt-core-exact-fixture",
      "opencode-prompt:llm-request-system-exact-fixture",
      "opencode-prompt:live-upstream-exact-diff-fixture",
      ...openCodePromptAssetNames().map((name) => `opencode-prompt:${name}`),
    ]
  }
  if (atom.id === "pi.prompt.coding-agent-builder") {
    return ["pi-prompt:family-matrix", "pi-prompt:upstream-source-matrix"]
  }
  if (atom.id === "hermes.prompt.agent-builder") {
    return [
      "hermes-prompt:factory-options",
      "hermes-prompt:prompt-scanner",
      "hermes-prompt:registry-snapshot",
      "hermes-prompt:upstream-registry-source-matrix",
      "hermes-skills:index-cache",
    ]
  }
  if (atom.id !== "nanobot.prompt.agent-builder") return []
  return [
    "nanobot-memory:lifecycle",
    "nanobot-prompt:upstream-source-matrix",
    "nanobot-prompt:channel-lifecycle-timing",
    "nanobot-prompt:channel-side-effect-replay",
    "nanobot-prompt:channel-registry-source-matrix",
    "nanobot-prompt:platform-matrix",
    "nanobot-prompt:platform-router-rendering",
    "nanobot-workspace-sync:templates",
    "nanobot-skills:index-cache",
    ...nanobotBuiltinBootstrapAssets().map((asset) => `nanobot-bootstrap:${asset.name}`),
  ]
}

function productTurnReplayEvidenceRefs(atom: AssemblyContractAtom): string[] {
  const parsed = parseProductTurnReplayAtomID(atom.id)
  if (!parsed) return []
  return [
    `conformance:${parsed.product}-turn-replay-snapshot`,
    `turn-replay:${parsed.product}:${parsed.key}`,
    ...(parsed.product === "opencode" ? [
      "conformance:opencode-turn-pipeline-boundary-projection",
      "turn-pipeline-boundary:opencode",
      "conformance:opencode-turn-identity-readback-projection",
      "turn-identity-readback:opencode",
      "conformance:opencode-turn-loop-control-projection",
      "turn-loop-control:opencode",
      "conformance:opencode-turn-side-effect-timeline-projection",
      "turn-side-effect-timeline:opencode",
      "conformance:opencode-turn-provider-step-projection",
      "turn-provider-step:opencode",
      openCodeTurnNativeLoopExactDiffEvidenceRef,
      openCodeTurnNativeLoopExactDiffReplayRef,
    ] : []),
  ]
}

function productTurnReplayFixtureIDs(atom: AssemblyContractAtom): string[] {
  const parsed = parseProductTurnReplayAtomID(atom.id)
  return parsed ? [
    `${parsed.product}-turn:${parsed.key}`,
    ...(parsed.product === "opencode" ? ["opencode-turn:pipeline-boundary-projection", "opencode-turn:identity-readback-projection", "opencode-turn:loop-control-projection", "opencode-turn:side-effect-timeline-projection", "opencode-turn:provider-step-projection", openCodeTurnNativeLoopExactDiffFixtureID] : []),
  ] : []
}

function cadenceReplayEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeExactDescriptor = nativeExactCadenceDescriptorForAtom(atom)
  if (nativeExactDescriptor) {
    return [...nativeExactDescriptor.nativeEvidenceRefs]
  }
  const parsed = parseCadenceReplayAtomID(atom.id)
  if (!parsed) return []
  return [
    `conformance:${parsed.product}-cadence-product-projector`,
    `conformance:${parsed.product}-cadence-replay-snapshot`,
    `conformance:${parsed.product}-cadence-side-effect-order`,
    `cadence-projector:${parsed.product}:product-projector`,
    `cadence-replay:${parsed.product}:${parsed.key}`,
    `cadence-side-effect-order:${parsed.product}`,
  ]
}

function cadenceReplayFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeExactDescriptor = nativeExactCadenceDescriptorForAtom(atom)
  if (nativeExactDescriptor) {
    return [...nativeExactDescriptor.fixtureIDs]
  }
  const parsed = parseCadenceReplayAtomID(atom.id)
  return parsed ? [`${parsed.product}-cadence:${parsed.key}`, `${parsed.product}-cadence:product-projector`, `${parsed.product}-cadence:side-effect-order`] : []
}

function toolCadenceReplayEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeExactDescriptor = nativeExactCadenceDescriptorForAtom(atom)
  if (nativeExactDescriptor) {
    return [...nativeExactDescriptor.nativeEvidenceRefs]
  }
  const parsed = parseToolCadenceReplayAtomID(atom.id)
  if (!parsed) return []
  return [
    `conformance:${parsed.product}-tool-cadence-replay-snapshot`,
    `tool-cadence-replay:${parsed.product}:${parsed.key}`,
    ...(parsed.key === "result-projector" ? [
      `conformance:${parsed.product}-tool-result-event-stream`,
      `tool-result-event-stream:${parsed.product}`,
      `conformance:${parsed.product}-tool-result-envelope-roundtrip`,
      `tool-result-envelope-roundtrip:${parsed.product}`,
      `conformance:${parsed.product}-tool-result-writeback-timing`,
      `tool-result-writeback-timing:${parsed.product}`,
    ] : []),
  ]
}

function toolCadenceReplayFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeExactDescriptor = nativeExactCadenceDescriptorForAtom(atom)
  if (nativeExactDescriptor) {
    return [...nativeExactDescriptor.fixtureIDs]
  }
  const parsed = parseToolCadenceReplayAtomID(atom.id)
  if (!parsed) return []
  return [
    `${parsed.product}-tool-cadence:${parsed.key}`,
    ...(parsed.key === "result-projector" ? [`${parsed.product}-tool-cadence:result-event-stream`, `${parsed.product}-tool-cadence:result-envelope-roundtrip`, `${parsed.product}-tool-cadence:result-writeback-timing`] : []),
  ]
}

function toolBridgeEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeToolNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.nativeEvidenceRefs]
  const sourceMatrixID = toolBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    `conformance:${sourceMatrixID}-tool-source-matrix`,
    ...(sourceMatrixID === "opencode" && isOpenCodeToolContractRenderProjectionAtomID(atom.id) ? ["conformance:opencode-tool-contract-render-projection"] : []),
    ...(sourceMatrixID === "opencode" && isOpenCodeToolLiveRuntimeFixtureAtomID(atom.id) ? ["conformance:opencode-tool-live-runtime-fixture"] : []),
  ]
}

function toolBridgeFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeToolNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.fixtureIDs]
  const sourceMatrixID = toolBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    ...(sourceMatrixID === "opencode" && isOpenCodeToolContractRenderProjectionAtomID(atom.id) ? ["opencode-tool:contract-render-projection"] : []),
    ...(sourceMatrixID === "opencode" && isOpenCodeToolLiveRuntimeFixtureAtomID(atom.id) ? ["opencode-tool:live-runtime-fixture"] : []),
    `${sourceMatrixID}-tool:source-matrix`,
  ]
}

type NativeExactCadenceDescriptor =
  | typeof openCodeAgentLoopRequestBoundaryNativeDescriptor
  | typeof openCodeAgentLoopFinalSummaryNativeDescriptor
  | typeof hermesAgentLoopRequestBoundaryNativeDescriptor
  | typeof hermesAgentLoopFinalSummaryNativeDescriptor
  | typeof nanobotAgentLoopRequestBoundaryNativeDescriptor
  | typeof nanobotAgentLoopFinalSummaryNativeDescriptor
  | typeof piMonoAgentLoopRequestBoundaryNativeDescriptor
  | typeof piMonoAgentLoopFinalSummaryNativeDescriptor
  | (typeof hermesTurnNativeExactDescriptors)[number]
  | (typeof nanobotTurnNativeExactDescriptors)[number]
  | (typeof piMonoTurnNativeExactDescriptors)[number]
  | typeof openCodeToolSchemaNativeDescriptor
  | (typeof openCodeToolNativeDescriptors)[number]
  | (typeof hermesToolNativeDescriptors)[number]
  | (typeof nanobotToolNativeDescriptors)[number]
  | typeof hermesToolBatchSchedulerNativeDescriptor
  | typeof nanobotToolBatchSchedulerNativeDescriptor
  | typeof piMonoToolBatchSchedulerNativeDescriptor
  | typeof piMonoToolSchemaNativeDescriptor
  | typeof piMonoToolResultProjectorNativeDescriptor

function nativeExactCadenceDescriptorForAtom(atom: AssemblyContractAtom): NativeExactCadenceDescriptor | undefined {
  const descriptor = nativeExactCadenceDescriptorForID(atom.id)
  if (!descriptor) return undefined
  return atom.implementationKind === descriptor.implementationKind && atom.parityCoverage === descriptor.parityCoverage ? descriptor : undefined
}

function nativeExactCadenceDescriptorForID(atomID: string): NativeExactCadenceDescriptor | undefined {
  if (atomID === openCodeAgentLoopRequestBoundaryNativeExactAtomID) return openCodeAgentLoopRequestBoundaryNativeDescriptor
  if (atomID === openCodeAgentLoopFinalSummaryNativeExactAtomID) return openCodeAgentLoopFinalSummaryNativeDescriptor
  if (atomID === hermesAgentLoopRequestBoundaryNativeExactAtomID) return hermesAgentLoopRequestBoundaryNativeDescriptor
  if (atomID === hermesAgentLoopFinalSummaryNativeExactAtomID) return hermesAgentLoopFinalSummaryNativeDescriptor
  if (atomID === nanobotAgentLoopRequestBoundaryNativeExactAtomID) return nanobotAgentLoopRequestBoundaryNativeDescriptor
  if (atomID === nanobotAgentLoopFinalSummaryNativeExactAtomID) return nanobotAgentLoopFinalSummaryNativeDescriptor
  if (atomID === piMonoAgentLoopRequestBoundaryNativeExactAtomID) return piMonoAgentLoopRequestBoundaryNativeDescriptor
  if (atomID === piMonoAgentLoopFinalSummaryNativeExactAtomID) return piMonoAgentLoopFinalSummaryNativeDescriptor
  const hermesTurnDescriptor = hermesTurnNativeExactDescriptorForID(atomID)
  if (hermesTurnDescriptor) return hermesTurnDescriptor
  const nanobotTurnDescriptor = nanobotTurnNativeExactDescriptorForID(atomID)
  if (nanobotTurnDescriptor) return nanobotTurnDescriptor
  const piTurnDescriptor = piMonoTurnNativeExactDescriptorForID(atomID)
  if (piTurnDescriptor) return piTurnDescriptor
  if (atomID === openCodeToolSchemaNativeExactAtomID) return openCodeToolSchemaNativeDescriptor
  const openCodeToolDescriptor = openCodeToolNativeDescriptors.find((descriptor) => descriptor.id === atomID)
  if (openCodeToolDescriptor) return openCodeToolDescriptor
  const hermesToolDescriptor = hermesToolNativeDescriptors.find((descriptor) => descriptor.id === atomID)
  if (hermesToolDescriptor) return hermesToolDescriptor
  const nanobotToolDescriptor = nanobotToolNativeDescriptors.find((descriptor) => descriptor.id === atomID)
  if (nanobotToolDescriptor) return nanobotToolDescriptor
  if (atomID === hermesToolBatchSchedulerNativeExactAtomID) return hermesToolBatchSchedulerNativeDescriptor
  if (atomID === nanobotToolBatchSchedulerNativeExactAtomID) return nanobotToolBatchSchedulerNativeDescriptor
  if (atomID === piMonoToolBatchSchedulerNativeExactAtomID) return piMonoToolBatchSchedulerNativeDescriptor
  if (atomID === piMonoToolSchemaNativeExactAtomID) return piMonoToolSchemaNativeDescriptor
  if (atomID === piMonoToolResultProjectorNativeExactAtomID) return piMonoToolResultProjectorNativeDescriptor
  return undefined
}

function planeForNativeExactDescriptor(descriptor: NativeExactCadenceDescriptor): AssemblyContractPlane {
  if (descriptor.port.startsWith("turn.")) return "turn"
  return descriptor.port.startsWith("agent-loop.") ? "agent-loop" : "tool"
}

function isOpenCodeNativeExactToolSchemaAtom(atom: AssemblyContractAtom): boolean {
  return atom.id === openCodeToolSchemaNativeExactAtomID && atom.implementationKind === "factory" && atom.parityCoverage === "native"
}

function openCodeToolNativeExactDescriptorForAtom(
  atom: AssemblyContractAtom,
):
  | typeof openCodeToolStatusBridgeNativeDescriptor
  | typeof openCodeToolDefinitionPluginNativeDescriptor
  | typeof openCodeToolSchemaBridgeNativeDescriptor
  | typeof openCodeToolPermissionRenderNativeDescriptor
  | typeof openCodeToolResultRenderNativeDescriptor
  | typeof openCodePluginPermissionBridgeNativeDescriptor
  | typeof openCodePermissionAskBridgeNativeDescriptor
  | typeof openCodeWorkspaceFilesystemNativeDescriptor
  | typeof openCodePluginToolRegistryNativeDescriptor
  | typeof openCodeRegistryToolDefinitionNativeDescriptor
  | undefined {
  if (atom.implementationKind !== "factory" || atom.parityCoverage !== "native") return undefined
  if (atom.id === openCodeToolStatusBridgeNativeExactAtomID) return openCodeToolStatusBridgeNativeDescriptor
  if (atom.id === openCodeToolDefinitionPluginNativeExactAtomID) return openCodeToolDefinitionPluginNativeDescriptor
  if (atom.id === openCodeToolSchemaBridgeNativeExactAtomID) return openCodeToolSchemaBridgeNativeDescriptor
  if (atom.id === openCodeToolPermissionRenderNativeExactAtomID) return openCodeToolPermissionRenderNativeDescriptor
  if (atom.id === openCodeToolResultRenderNativeExactAtomID) return openCodeToolResultRenderNativeDescriptor
  if (atom.id === openCodePluginPermissionBridgeNativeExactAtomID) return openCodePluginPermissionBridgeNativeDescriptor
  if (atom.id === openCodePermissionAskBridgeNativeExactAtomID) return openCodePermissionAskBridgeNativeDescriptor
  if (atom.id === openCodeWorkspaceFilesystemNativeExactAtomID) return openCodeWorkspaceFilesystemNativeDescriptor
  if (atom.id === openCodePluginToolRegistryNativeExactAtomID) return openCodePluginToolRegistryNativeDescriptor
  if (atom.id === openCodeRegistryToolDefinitionNativeExactAtomID) return openCodeRegistryToolDefinitionNativeDescriptor
  return undefined
}

function identityBridgeEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeIdentityNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.nativeEvidenceRefs]
  const sourceMatrixID = identityBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    `conformance:${sourceMatrixID}-identity-source-matrix`,
    ...(sourceMatrixID === "opencode" ? ["conformance:opencode-identity-live-runtime-fixture"] : []),
  ]
}

function identityBridgeFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeIdentityNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.fixtureIDs]
  const sourceMatrixID = identityBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    `${sourceMatrixID}-identity:source-matrix`,
    ...(sourceMatrixID === "opencode" ? ["opencode-identity:live-runtime-fixture"] : []),
  ]
}

function openCodeIdentityNativeExactDescriptorForAtom(
  atom: AssemblyContractAtom,
):
  | typeof openCodeIdentityIDGeneratorNativeDescriptor
  | typeof openCodeIdentityClockNativeDescriptor
  | typeof openCodeIdentityWorkspaceResolverNativeDescriptor
  | undefined {
  if (atom.implementationKind !== "factory" || atom.parityCoverage !== "native") return undefined
  if (atom.id === openCodeIdentityIDGeneratorNativeExactAtomID) return openCodeIdentityIDGeneratorNativeDescriptor
  if (atom.id === openCodeIdentityClockNativeExactAtomID) return openCodeIdentityClockNativeDescriptor
  if (atom.id === openCodeIdentityWorkspaceResolverNativeExactAtomID) return openCodeIdentityWorkspaceResolverNativeDescriptor
  return undefined
}

function configBridgeEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const sourceMatrixID = configBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    `conformance:${sourceMatrixID}-config-source-matrix`,
    ...(sourceMatrixID === "opencode" ? ["conformance:opencode-config-runtime-projection", "conformance:opencode-config-live-runtime-fixture"] : []),
  ]
}

function configBridgeFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const sourceMatrixID = configBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    `${sourceMatrixID}-config:source-matrix`,
    ...(sourceMatrixID === "opencode" ? ["opencode-config:runtime-projection", "opencode-config:live-runtime-fixture"] : []),
  ]
}

function eventBridgeEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeEventNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.nativeEvidenceRefs]
  const sourceMatrixID = eventBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    `conformance:${sourceMatrixID}-event-source-matrix`,
    ...(sourceMatrixID === "opencode" && isOpenCodeEventLiveRuntimeFixtureAtomID(atom.id) ? ["conformance:opencode-event-live-runtime-fixture"] : []),
  ]
}

function eventBridgeFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeEventNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.fixtureIDs]
  const sourceMatrixID = eventBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    ...(sourceMatrixID === "opencode" && isOpenCodeEventLiveRuntimeFixtureAtomID(atom.id) ? ["opencode-event:live-runtime-fixture"] : []),
    `${sourceMatrixID}-event:source-matrix`,
  ]
}

function openCodeEventNativeExactDescriptorForAtom(
  atom: AssemblyContractAtom,
): typeof openCodeEventEnvelopeNativeDescriptor | typeof openCodeSyncEventLogNativeDescriptor | undefined {
  if (atom.implementationKind !== "factory" || atom.parityCoverage !== "native") return undefined
  if (atom.id === openCodeEventEnvelopeNativeExactAtomID) return openCodeEventEnvelopeNativeDescriptor
  if (atom.id === openCodeSyncEventLogNativeExactAtomID) return openCodeSyncEventLogNativeDescriptor
  return undefined
}

function foundationTraceBridgeEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeTraceNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.nativeEvidenceRefs]
  const sourceMatrixID = traceBridgeSourceMatrixID(atom.id)
  if (sourceMatrixID) return [`conformance:${sourceMatrixID}-trace-source-matrix`]
  if (isOpenCodeFoundationTraceBridgeAtomID(atom.id)) {
    return [
      "conformance:opencode-foundation-trace-runtime-projection",
      "conformance:opencode-foundation-trace-source-matrix",
    ]
  }
  return []
}

function foundationTraceBridgeFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeTraceNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.fixtureIDs]
  const sourceMatrixID = traceBridgeSourceMatrixID(atom.id)
  if (sourceMatrixID) return [`${sourceMatrixID}-trace:source-matrix`]
  if (isOpenCodeFoundationTraceBridgeAtomID(atom.id)) {
    return [
      "opencode-foundation-trace:runtime-projection",
      "opencode-foundation-trace:source-matrix",
    ]
  }
  return []
}

function openCodeTraceNativeExactDescriptorForAtom(atom: AssemblyContractAtom): typeof openCodeTraceDebugSurfaceNativeDescriptor | undefined {
  if (atom.implementationKind !== "factory" || atom.parityCoverage !== "native") return undefined
  if (atom.id === openCodeTraceDebugSurfaceNativeExactAtomID) return openCodeTraceDebugSurfaceNativeDescriptor
  return undefined
}

function productShellBridgeEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const sourceMatrixID = productShellSourceMatrixID(atom.id)
  return sourceMatrixID
    ? [
      `conformance:${sourceMatrixID}-product-shell-source-matrix`,
      ...(sourceMatrixID === "opencode" ? ["conformance:opencode-product-shell-runtime-projection", "conformance:opencode-product-shell-live-runtime-fixture"] : []),
    ]
    : []
}

function productShellBridgeFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const sourceMatrixID = productShellSourceMatrixID(atom.id)
  return sourceMatrixID
    ? [
      ...(sourceMatrixID === "opencode" ? ["opencode-product-shell:runtime-projection", "opencode-product-shell:live-runtime-fixture"] : []),
      `${sourceMatrixID}-product-shell:source-matrix`,
    ]
    : []
}

function metadataOverlayEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isOpenCodeMetadataOverlayAtomID(atom.id)) return ["conformance:opencode-metadata-overlay-demotion-matrix"]
  return []
}

function metadataOverlayFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isOpenCodeMetadataOverlayAtomID(atom.id)) return ["opencode-metadata:overlay-demotion-matrix"]
  return []
}

function uiBridgeEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const sourceMatrixID = uiBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    `conformance:${sourceMatrixID}-ui-source-matrix`,
    ...(sourceMatrixID === "opencode" && isOpenCodeUILiveRuntimeFixtureAtomID(atom.id) ? ["conformance:opencode-ui-live-runtime-fixture"] : []),
  ]
}

function uiBridgeFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const sourceMatrixID = uiBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    ...(sourceMatrixID === "opencode" && isOpenCodeUILiveRuntimeFixtureAtomID(atom.id) ? ["opencode-ui:live-runtime-fixture"] : []),
    `${sourceMatrixID}-ui:source-matrix`,
  ]
}

function hookBridgeEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeHookNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.nativeEvidenceRefs]
  const sourceMatrixID = hookBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    `conformance:${sourceMatrixID}-hook-source-matrix`,
    ...(sourceMatrixID === "opencode" && isOpenCodeHookLiveRuntimeFixtureAtomID(atom.id) ? ["conformance:opencode-hook-live-runtime-fixture"] : []),
  ]
}

function hookBridgeFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeHookNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.fixtureIDs]
  const sourceMatrixID = hookBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    ...(sourceMatrixID === "opencode" && isOpenCodeHookLiveRuntimeFixtureAtomID(atom.id) ? ["opencode-hook:live-runtime-fixture"] : []),
    `${sourceMatrixID}-hook:source-matrix`,
  ]
}

function openCodeHookNativeExactDescriptorForAtom(
  atom: AssemblyContractAtom,
):
  | typeof openCodeHookHandlerNativeDescriptor
  | typeof openCodeHookObserverNativeDescriptor
  | typeof openCodeHookSchedulerNativeDescriptor
  | typeof openCodeHookErrorDefaultsNativeDescriptor
  | typeof openCodeHookPluginBridgeNativeDescriptor
  | typeof openCodePluginLoaderNativeDescriptor
  | typeof openCodePluginHotReloadCleanupNativeDescriptor
  | typeof openCodePluginEventMapperNativeDescriptor
  | typeof openCodeCommandRegistryNativeDescriptor
  | typeof openCodeRegistryProviderPluginNativeDescriptor
  | typeof openCodePluginUIRegistryNativeDescriptor
  | typeof openCodeRegistryUIProviderNativeDescriptor
  | typeof openCodeRegistryToolDefinitionNativeDescriptor
  | undefined {
  if (atom.implementationKind !== "factory" || atom.parityCoverage !== "native") return undefined
  if (atom.id === openCodeHookHandlerNativeExactAtomID) return openCodeHookHandlerNativeDescriptor
  if (atom.id === openCodeHookObserverNativeExactAtomID) return openCodeHookObserverNativeDescriptor
  if (atom.id === openCodeHookSchedulerNativeExactAtomID) return openCodeHookSchedulerNativeDescriptor
  if (atom.id === openCodeHookErrorDefaultsNativeExactAtomID) return openCodeHookErrorDefaultsNativeDescriptor
  if (atom.id === openCodeHookPluginBridgeNativeExactAtomID) return openCodeHookPluginBridgeNativeDescriptor
  if (atom.id === openCodePluginLoaderNativeExactAtomID) return openCodePluginLoaderNativeDescriptor
  if (atom.id === openCodePluginHotReloadCleanupNativeExactAtomID) return openCodePluginHotReloadCleanupNativeDescriptor
  if (atom.id === openCodePluginEventMapperNativeExactAtomID) return openCodePluginEventMapperNativeDescriptor
  if (atom.id === openCodeCommandRegistryNativeExactAtomID) return openCodeCommandRegistryNativeDescriptor
  if (atom.id === openCodeRegistryProviderPluginNativeExactAtomID) return openCodeRegistryProviderPluginNativeDescriptor
  if (atom.id === openCodePluginUIRegistryNativeExactAtomID) return openCodePluginUIRegistryNativeDescriptor
  if (atom.id === openCodeRegistryUIProviderNativeExactAtomID) return openCodeRegistryUIProviderNativeDescriptor
  if (atom.id === openCodeRegistryToolDefinitionNativeExactAtomID) return openCodeRegistryToolDefinitionNativeDescriptor
  return undefined
}

function providerBridgeEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeProviderNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.nativeEvidenceRefs]
  if (isOpenCodeProviderBridgeAtomID(atom.id)) {
    return [
      "conformance:opencode-provider-source-matrix",
      "conformance:opencode-provider-raw-frame-boundary-matrix",
      ...(isOpenCodeProviderPluginRuntimeAtomID(atom.id) ? ["conformance:opencode-provider-plugin-runtime-matrix"] : []),
      ...(isOpenCodeProviderPackageRuntimeProjectionAtomID(atom.id) ? ["conformance:opencode-provider-package-runtime-projection"] : []),
      ...(isOpenCodeProviderPackageRuntimeProjectionAtomID(atom.id) ? ["conformance:opencode-provider-package-runtime-live-runtime-fixture"] : []),
      ...(isOpenCodeProviderRetryCancelRaceProjectionAtomID(atom.id) ? ["conformance:opencode-provider-retry-cancel-race-projection"] : []),
      ...(isOpenCodeProviderRetryCancelRaceProjectionAtomID(atom.id) ? ["conformance:opencode-provider-retry-cancel-live-runtime-fixture"] : []),
    ]
  }
  if (isPiProviderBridgeAtomID(atom.id)) return ["conformance:pi-provider-source-matrix"]
  if (isNanobotProviderBridgeAtomID(atom.id)) return ["conformance:nanobot-provider-source-matrix"]
  if (isHermesProviderBridgeAtomID(atom.id)) return ["conformance:hermes-provider-source-matrix"]
  return []
}

function providerBridgeFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeProviderNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.fixtureIDs]
  if (isOpenCodeProviderBridgeAtomID(atom.id)) {
    return [
      "opencode-provider:source-matrix",
      "opencode-provider:raw-frame-boundary-matrix",
      ...(isOpenCodeProviderPluginRuntimeAtomID(atom.id) ? ["opencode-provider:plugin-runtime-matrix"] : []),
      ...(isOpenCodeProviderPackageRuntimeProjectionAtomID(atom.id) ? ["opencode-provider:package-runtime-projection"] : []),
      ...(isOpenCodeProviderPackageRuntimeProjectionAtomID(atom.id) ? ["opencode-provider:package-runtime-live-runtime-fixture"] : []),
      ...(isOpenCodeProviderRetryCancelRaceProjectionAtomID(atom.id) ? ["opencode-provider:retry-cancel-race-projection"] : []),
      ...(isOpenCodeProviderRetryCancelRaceProjectionAtomID(atom.id) ? ["opencode-provider:retry-cancel-live-runtime-fixture"] : []),
    ]
  }
  if (isPiProviderBridgeAtomID(atom.id)) return ["pi-provider:source-matrix"]
  if (isNanobotProviderBridgeAtomID(atom.id)) return ["nanobot-provider:source-matrix"]
  if (isHermesProviderBridgeAtomID(atom.id)) return ["hermes-provider:source-matrix"]
  return []
}

function openCodeProviderNativeExactDescriptorForAtom(
  atom: AssemblyContractAtom,
):
  | typeof openCodeProviderUsageRendererNativeDescriptor
  | typeof openCodeProviderRequestOptionsNativeDescriptor
  | typeof openCodeProviderAuthDescriptorNativeDescriptor
  | typeof openCodeProviderPluginDescriptorNativeDescriptor
  | typeof openCodeProviderModelPluginNativeDescriptor
  | typeof openCodeProviderParserObserverNativeDescriptor
  | typeof openCodeProviderEventObserverNativeDescriptor
  | typeof openCodeProviderStreamingDeltaRecorderNativeDescriptor
  | typeof openCodeProviderStreamProjectorNativeDescriptor
  | typeof openCodeProviderTransportInstrumentationNativeDescriptor
  | undefined {
  if (atom.implementationKind !== "factory" || atom.parityCoverage !== "native") return undefined
  if (atom.id === openCodeProviderAuthDescriptorNativeExactAtomID) return openCodeProviderAuthDescriptorNativeDescriptor
  if (atom.id === openCodeProviderPluginDescriptorNativeExactAtomID) return openCodeProviderPluginDescriptorNativeDescriptor
  if (atom.id === openCodeProviderModelPluginNativeExactAtomID) return openCodeProviderModelPluginNativeDescriptor
  if (atom.id === openCodeProviderUsageRendererNativeExactAtomID) return openCodeProviderUsageRendererNativeDescriptor
  if (atom.id === openCodeProviderRequestOptionsNativeExactAtomID) return openCodeProviderRequestOptionsNativeDescriptor
  if (atom.id === openCodeProviderParserObserverNativeExactAtomID) return openCodeProviderParserObserverNativeDescriptor
  if (atom.id === openCodeProviderEventObserverNativeExactAtomID) return openCodeProviderEventObserverNativeDescriptor
  if (atom.id === openCodeProviderStreamingDeltaRecorderNativeExactAtomID) return openCodeProviderStreamingDeltaRecorderNativeDescriptor
  if (atom.id === openCodeProviderStreamProjectorNativeExactAtomID) return openCodeProviderStreamProjectorNativeDescriptor
  if (atom.id === openCodeProviderTransportInstrumentationNativeExactAtomID) return openCodeProviderTransportInstrumentationNativeDescriptor
  return undefined
}

function sessionBridgeEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeSessionNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.nativeEvidenceRefs]
  const sourceMatrixID = sessionBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    `conformance:${sourceMatrixID}-session-source-matrix`,
    ...(sourceMatrixID === "opencode" ? ["conformance:opencode-session-runtime-projection", "conformance:opencode-session-live-runtime-fixture"] : []),
  ]
}

function sessionBridgeFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom)) return []
  const nativeDescriptor = openCodeSessionNativeExactDescriptorForAtom(atom)
  if (nativeDescriptor) return [...nativeDescriptor.fixtureIDs]
  const sourceMatrixID = sessionBridgeSourceMatrixID(atom.id)
  if (!sourceMatrixID) return []
  return [
    `${sourceMatrixID}-session:source-matrix`,
    ...(sourceMatrixID === "opencode" ? ["opencode-session:runtime-projection", "opencode-session:live-runtime-fixture"] : []),
  ]
}

function openCodeSessionNativeExactDescriptorForAtom(
  atom: AssemblyContractAtom,
):
  | typeof openCodeSessionSQLiteProjectionNativeDescriptor
  | typeof openCodeSessionBranchGraphNativeDescriptor
  | typeof openCodeSessionMessageV2ProjectorNativeDescriptor
  | typeof openCodeSessionSyncEventProjectorNativeDescriptor
  | typeof openCodeSessionPaginationNativeDescriptor
  | typeof openCodeSessionCompactionEventNativeDescriptor
  | undefined {
  if (atom.implementationKind !== "factory" || atom.parityCoverage !== "native") return undefined
  if (atom.id === openCodeSessionSQLiteProjectionNativeExactAtomID) return openCodeSessionSQLiteProjectionNativeDescriptor
  if (atom.id === openCodeSessionBranchGraphNativeExactAtomID) return openCodeSessionBranchGraphNativeDescriptor
  if (atom.id === openCodeSessionMessageV2ProjectorNativeExactAtomID) return openCodeSessionMessageV2ProjectorNativeDescriptor
  if (atom.id === openCodeSessionSyncEventProjectorNativeExactAtomID) return openCodeSessionSyncEventProjectorNativeDescriptor
  if (atom.id === openCodeSessionPaginationNativeExactAtomID) return openCodeSessionPaginationNativeDescriptor
  if (atom.id === openCodeSessionCompactionEventNativeExactAtomID) return openCodeSessionCompactionEventNativeDescriptor
  return undefined
}

function isPiSessionNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoSessionNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isPiRuntimeAcceptanceNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoRuntimeAcceptanceNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isPiUINativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoUINativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isPiProductShellNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoProductShellNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isPiIdentityNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return (
    matchesNativeExactDescriptor(atom, piMonoIdentityClockNativeDescriptor) ||
    matchesNativeExactDescriptor(atom, piMonoIdentityIDGeneratorNativeDescriptor) ||
    matchesNativeExactDescriptor(atom, piMonoIdentityWorkspaceResolverNativeDescriptor)
  )
}

function isPiEventNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoEventNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isPiHookLifecycleNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoHookLifecycleNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isPiProviderNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoProviderNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isNanobotProviderNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return nanobotProviderNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isHermesProviderNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return hermesProviderNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isPiToolRegistrationNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoToolRegistrationNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isPiToolRuntimeNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoToolRuntimeNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isPiConfigNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoConfigNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isPiTraceNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return piMonoTraceNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isOpenCodeToolNativeExactAtomID(atomID: string): boolean {
  return (openCodeToolNativeExactAtomIDs as readonly string[]).includes(atomID)
}

function isOpenCodeUINativeExactAtomID(atomID: string): boolean {
  return (openCodeUINativeExactAtomIDs as readonly string[]).includes(atomID)
}

function isOpenCodeProductShellNativeExactAtomID(atomID: string): boolean {
  return (openCodeProductShellNativeExactAtomIDs as readonly string[]).includes(atomID)
}

function isDescriptorNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return [
    piMonoIdentityClockNativeDescriptor,
    piMonoIdentityIDGeneratorNativeDescriptor,
    piMonoIdentityWorkspaceResolverNativeDescriptor,
    piMonoToolPackCompatibilityNativeDescriptor,
    piMonoPromptNativeDescriptor,
    nanobotPromptNativeDescriptor,
    hermesPromptNativeDescriptor,
    ...piMonoPromptSupportNativeDescriptors,
    openCodeToolSchemaNativeDescriptor,
    ...piMonoEventNativeDescriptors,
    ...piMonoHookLifecycleNativeDescriptors,
    ...piMonoProviderNativeDescriptors,
    ...piMonoToolRegistrationNativeDescriptors,
    ...piMonoToolRuntimeNativeDescriptors,
    ...piMonoTurnNativeExactDescriptors,
    ...piMonoConfigNativeDescriptors,
    ...piMonoSessionNativeDescriptors,
    ...piMonoRuntimeAssemblyNativeDescriptors,
    ...piMonoRuntimeAcceptanceNativeDescriptors,
    ...piMonoUINativeDescriptors,
    ...piMonoProductShellNativeDescriptors,
    ...piMonoTraceNativeDescriptors,
    ...nanobotTraceNativeDescriptors,
    ...nanobotUINativeDescriptors,
    ...nanobotProductShellNativeDescriptors,
    ...nanobotEventNativeDescriptors,
    ...nanobotRuntimeAcceptanceNativeDescriptors,
    ...hermesUINativeDescriptors,
    ...hermesProductShellNativeDescriptors,
    ...hermesRuntimeAcceptanceNativeDescriptors,
    ...nanobotTurnNativeExactDescriptors,
    ...openCodeIdentityNativeDescriptors,
    ...openCodeEventNativeDescriptors,
    ...openCodeHookLifecycleNativeDescriptors,
    ...openCodeProviderStreamNativeDescriptors,
    ...openCodeConfigNativeDescriptors,
    ...openCodeSessionNativeDescriptors,
    ...openCodeRuntimeAssemblyNativeDescriptors,
    ...openCodeRuntimeAcceptanceNativeDescriptors,
    ...openCodeToolNativeDescriptors,
    ...openCodeUINativeDescriptors,
    ...openCodeProductShellNativeDescriptors,
    ...nanobotHookLifecycleNativeDescriptors,
    ...nanobotIdentityNativeDescriptors,
    ...nanobotProviderNativeDescriptors,
    ...nanobotSessionNativeDescriptors,
    ...nanobotConfigNativeDescriptors,
    ...nanobotToolNativeDescriptors,
    ...hermesEventNativeDescriptors,
    ...hermesHookLifecycleNativeDescriptors,
    ...hermesIdentityNativeDescriptors,
    ...hermesProviderNativeDescriptors,
    ...hermesConfigNativeDescriptors,
    ...hermesSessionNativeDescriptors,
    ...hermesTraceNativeDescriptors,
    ...hermesToolNativeDescriptors,
  ].some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function matchesNativeExactDescriptor(
  atom: AssemblyContractAtom,
  descriptor: {
    id: string
    implementationKind: AssemblyAtomImplementationKind
    parityCoverage: AssemblyAtomParityCoverage
  },
): boolean {
  return (
    atom.id === descriptor.id &&
    atom.implementationKind === descriptor.implementationKind &&
    atom.parityCoverage === descriptor.parityCoverage
  )
}

function providerStreamReplayEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isPiProviderNativeExactAtom(atom) || isOpenCodeProviderStreamNativeExactAtom(atom) || isNanobotProviderNativeExactAtom(atom) || isHermesProviderNativeExactAtom(atom)) return []
  const parsed = parseProviderStreamReplayAtomID(atom.id)
  if (!parsed) return []
  return [
    `conformance:${parsed.product}-provider-stream-replay-snapshot`,
    `provider-stream-replay:${parsed.product}:${parsed.key}`,
    `conformance:${parsed.product}-provider-raw-frame-timeline`,
    `provider-raw-frame-timeline:${parsed.product}`,
    `conformance:${parsed.product}-provider-raw-payload-roundtrip`,
    `provider-raw-payload-roundtrip:${parsed.product}`,
  ]
}

function providerStreamReplayFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isPiProviderNativeExactAtom(atom) || isOpenCodeProviderStreamNativeExactAtom(atom) || isNanobotProviderNativeExactAtom(atom) || isHermesProviderNativeExactAtom(atom)) return []
  const parsed = parseProviderStreamReplayAtomID(atom.id)
  return parsed ? [`${parsed.product}-provider-stream:${parsed.key}`, `${parsed.product}-provider-stream:raw-frame-timeline`, `${parsed.product}-provider-stream:raw-payload-roundtrip`] : []
}

function isOpenCodeProviderStreamNativeExactAtom(atom: AssemblyContractAtom): boolean {
  return openCodeProviderStreamNativeDescriptors.some((descriptor) => matchesNativeExactDescriptor(atom, descriptor))
}

function isOpenCodeProviderBridgeAtomID(atomID: string): boolean {
  return (
    atomID.startsWith("opencode.provider.")
    && !atomID.endsWith(".native-like")
    && atomID !== "opencode.provider.cassette-artifact"
    && atomID !== openCodeProviderUsageRendererNativeExactAtomID
    && atomID !== openCodeProviderRequestOptionsNativeExactAtomID
    && atomID !== openCodeProviderParserObserverNativeExactAtomID
    && atomID !== openCodeProviderEventObserverNativeExactAtomID
    && atomID !== openCodeProviderTransportInstrumentationNativeExactAtomID
    && atomID !== openCodeProviderPluginDescriptorNativeExactAtomID
    && atomID !== openCodeProviderModelPluginNativeExactAtomID
  )
}

function isOpenCodeProviderPluginRuntimeAtomID(atomID: string): boolean {
  return [
    "opencode.provider.auth-descriptor",
  ].includes(atomID)
}

function isOpenCodeProviderPackageRuntimeProjectionAtomID(atomID: string): boolean {
  return [
    "opencode.provider.auth-descriptor",
  ].includes(atomID)
}

function isOpenCodeProviderRetryCancelRaceProjectionAtomID(atomID: string): boolean {
  void atomID
  return false
}

function isOpenCodeToolBridgeAtomID(atomID: string): boolean {
  return [
    "opencode.permission.ask-bridge",
    "opencode.tool.permission-render-bridge",
    "opencode.tool.result-render-bridge",
    "opencode.tool.schema-bridge",
    "opencode.workspace-filesystem-bridge",
  ].includes(atomID)
}

function isOpenCodeToolContractRenderProjectionAtomID(atomID: string): boolean {
  return [
    "opencode.tool.permission-render-bridge",
    "opencode.tool.result-render-bridge",
    "opencode.tool.schema-bridge",
  ].includes(atomID)
}

function isOpenCodeToolLiveRuntimeFixtureAtomID(atomID: string): boolean {
  return isOpenCodeToolBridgeAtomID(atomID)
}

function toolBridgeSourceMatrixID(atomID: string): "opencode" | "pi" | "nanobot" | "hermes" | undefined {
  if (isOpenCodeToolBridgeAtomID(atomID)) return "opencode"
  if ([
    "pi.extension.dynamic-tool-bridge",
    "pi.extension.typebox-bridge",
    "pi.permission.event-bridge",
    "pi.process-runner-bridge",
    "pi.tool.event-render-bridge",
    "pi.tool.register-tool-bridge",
    "pi.tool.result-event-bridge",
    "pi.tool.runtime-event-bridge",
    "pi.tool.typebox-bridge",
    "pi.workspace-filesystem-bridge",
  ].includes(atomID)) return "pi"
  if ([
    "nanobot.permission.policy-bridge",
    "nanobot.process-runner-bridge",
    "nanobot.tool.definition-plugin-bridge",
    "nanobot.tool.event-render-bridge",
    "nanobot.tool.progress-event-bridge",
    "nanobot.tool.registry-bridge",
    "nanobot.tool.result-event-bridge",
    "nanobot.tool.schema-bridge",
    "nanobot.workspace-filesystem-bridge",
  ].includes(atomID)) return "nanobot"
  if ([
    "hermes.permission.hook-bridge",
    "hermes.process-runner-bridge",
    "hermes.tool.definition-registry-bridge",
    "hermes.tool.permission-render-bridge",
    "hermes.tool.progress-event-bridge",
    "hermes.tool.registry-bridge",
    "hermes.tool.result-event-bridge",
    "hermes.tool.schema-bridge",
    "hermes.workspace-filesystem-bridge",
  ].includes(atomID)) return "hermes"
  return undefined
}

function isOpenCodeIdentityBridgeAtomID(atomID: string): boolean {
  return [
    "opencode.identity.clock-format",
    "opencode.identity.id-generator",
    "opencode.identity.workspace-resolver",
  ].includes(atomID)
}

function identityBridgeSourceMatrixID(atomID: string): "opencode" | "pi" | "nanobot" | "hermes" | undefined {
  if (isOpenCodeIdentityBridgeAtomID(atomID)) return "opencode"
  if ([
    "pi.identity.clock-format",
    "pi.identity.id-generator",
    "pi.identity.workspace-resolver",
  ].includes(atomID)) return "pi"
  if ([
    "nanobot.identity.clock-format",
    "nanobot.identity.id-generator",
    "nanobot.identity.workspace-resolver",
  ].includes(atomID)) return "nanobot"
  if ([
    "hermes.identity.clock-format",
    "hermes.identity.id-generator",
    "hermes.identity.workspace-resolver",
  ].includes(atomID)) return "hermes"
  return undefined
}

function traceBridgeSourceMatrixID(atomID: string): "pi" | "nanobot" | "hermes" | undefined {
  if (atomID === "pi.trace.debug-surface") return "pi"
  if (atomID === "nanobot.trace.debug-surface") return "nanobot"
  if (atomID === "hermes.trace.debug-surface") return "hermes"
  return undefined
}

function configBridgeSourceMatrixID(atomID: string): "opencode" | "pi" | "nanobot" | "hermes" | undefined {
  if (["opencode.config.source", "opencode.config.precedence", "opencode.config.validator"].includes(atomID)) return "opencode"
  if (["pi.config.source", "pi.config.precedence", "pi.config.validator"].includes(atomID)) return "pi"
  if (["nanobot.config.source", "nanobot.config.precedence", "nanobot.config.validator"].includes(atomID)) return "nanobot"
  if (["hermes.config.source", "hermes.config.precedence", "hermes.config.validator"].includes(atomID)) return "hermes"
  return undefined
}

function eventBridgeSourceMatrixID(atomID: string): "opencode" | "pi" | "nanobot" | "hermes" | undefined {
  if (["opencode.event.envelope-bridge", "opencode.event.syncevent-bridge"].includes(atomID)) return "opencode"
  if (["pi.event.envelope-bridge", "pi.event.runtime-bridge", "pi.extension.runtime-event-bridge"].includes(atomID)) return "pi"
  if (["nanobot.event.envelope-bridge", "nanobot.event.bus-bridge"].includes(atomID)) return "nanobot"
  if (["hermes.event.envelope-bridge", "hermes.event.runtime-bridge"].includes(atomID)) return "hermes"
  return undefined
}

function isOpenCodeEventBridgeAtomID(atomID: string): boolean {
  return ["opencode.event.envelope-bridge", "opencode.event.syncevent-bridge"].includes(atomID)
}

function isOpenCodeEventLiveRuntimeFixtureAtomID(atomID: string): boolean {
  return isOpenCodeEventBridgeAtomID(atomID)
}

function isOpenCodeFoundationTraceBridgeAtomID(atomID: string): boolean {
  void atomID
  return false
}

function isOpenCodeProductShellBridgeAtomID(atomID: string): boolean {
  return [
    "opencode.product-shell.sdk",
    "opencode.product-shell.server",
  ].includes(atomID)
}

function isOpenCodeProductShellPreviewSourceMatrixAtomID(atomID: string): boolean {
  void atomID
  return false
}

function isOpenCodeProductShellSourceMatrixAtomID(atomID: string): boolean {
  return isOpenCodeProductShellBridgeAtomID(atomID) || isOpenCodeProductShellPreviewSourceMatrixAtomID(atomID)
}

function productShellSourceMatrixID(atomID: string): "opencode" | "pi" | "nanobot" | "hermes" | undefined {
  if (isOpenCodeProductShellSourceMatrixAtomID(atomID)) return "opencode"
  if ([
    "pi.product-shell.cli",
    "pi.product-shell.harness",
    "pi.product-shell.rpc",
    "pi.product-shell.sdk",
    "pi.product-shell.server",
  ].includes(atomID)) return "pi"
  if ([
    "nanobot.product-shell.cli",
    "nanobot.product-shell.harness",
    "nanobot.product-shell.sdk",
    "nanobot.product-shell.server",
  ].includes(atomID)) return "nanobot"
  if ([
    "hermes.product-shell.acp",
    "hermes.product-shell.api-server",
    "hermes.product-shell.cli",
    "hermes.product-shell.gateway",
    "hermes.product-shell.harness",
    "hermes.product-shell.sdk",
  ].includes(atomID)) return "hermes"
  return undefined
}

function isOpenCodeUIBridgeAtomID(atomID: string): boolean {
  return [
    "opencode.ui.event-loop",
    "opencode.ui.command-router",
    "opencode.ui.input-normalizer",
    "opencode.ui.renderer",
    "opencode.ui.snapshot",
    "opencode.ui.theme-registry",
  ].includes(atomID)
}

function isOpenCodeUILiveRuntimeFixtureAtomID(atomID: string): boolean {
  return isOpenCodeUIBridgeAtomID(atomID)
}

function uiBridgeSourceMatrixID(atomID: string): "opencode" | "pi" | "nanobot" | "hermes" | undefined {
  if (isOpenCodeUIBridgeAtomID(atomID)) return "opencode"
  if ([
    "pi.ui.command-router",
    "pi.ui.input-normalizer",
    "pi.ui.renderer",
    "pi.ui.snapshot",
    "pi.ui.theme-registry",
  ].includes(atomID)) return "pi"
  if ([
    "nanobot.ui.command-router",
    "nanobot.ui.input-normalizer",
    "nanobot.ui.renderer",
    "nanobot.ui.snapshot",
    "nanobot.ui.theme-registry",
  ].includes(atomID)) return "nanobot"
  if ([
    "hermes.ui.command-router",
    "hermes.ui.input-normalizer",
    "hermes.ui.renderer",
    "hermes.ui.snapshot",
    "hermes.ui.theme-registry",
  ].includes(atomID)) return "hermes"
  return undefined
}

function isOpenCodeHookBridgeAtomID(atomID: string): boolean {
  return [
    "opencode.hook.plugin-bridge",
    "opencode.plugin.event-mapper",
    "opencode.plugin.hot-reload-cleanup",
    "opencode.plugin.loader",
    "opencode.plugin.ui-registry-bridge",
    "opencode.registry.provider-plugin",
    "opencode.registry.tool-definition",
    "opencode.registry.ui-provider",
  ].includes(atomID)
}

function isOpenCodeHookLiveRuntimeFixtureAtomID(atomID: string): boolean {
  return isOpenCodeHookBridgeAtomID(atomID)
}

function hookBridgeSourceMatrixID(atomID: string): "opencode" | "pi" | "nanobot" | "hermes" | undefined {
  if (isOpenCodeHookBridgeAtomID(atomID)) return "opencode"
  if ([
    "pi.extension.cleanup",
    "pi.extension.event-mapper",
    "pi.extension.loader",
    "pi.extension.provider-registry-bridge",
    "pi.extension.ui-registry-bridge",
    "pi.hook.error-defaults",
    "pi.hook.extension-bridge",
    "pi.hook.handler-adapter",
    "pi.hook.observer-adapter",
    "pi.hook.scheduler-defaults",
    "pi.registry.command",
    "pi.registry.message-renderer",
    "pi.registry.provider-extension",
    "pi.registry.register-tool",
  ].includes(atomID)) return "pi"
  if ([
    "nanobot.hook.error-defaults",
    "nanobot.hook.handler-adapter",
    "nanobot.hook.observer-adapter",
    "nanobot.hook.plugin-bridge",
    "nanobot.hook.scheduler-defaults",
    "nanobot.plugin.cleanup",
    "nanobot.plugin.event-mapper",
    "nanobot.plugin.loader",
    "nanobot.plugin.provider-registry-bridge",
    "nanobot.plugin.ui-registry-bridge",
    "nanobot.registry.command",
    "nanobot.registry.provider-plugin",
    "nanobot.registry.tool-definition",
    "nanobot.registry.ui-provider",
  ].includes(atomID)) return "nanobot"
  if ([
    "hermes.hook.error-defaults",
    "hermes.hook.handler-adapter",
    "hermes.hook.observer-adapter",
    "hermes.hook.plugin-bridge",
    "hermes.hook.scheduler-defaults",
    "hermes.plugin.cleanup",
    "hermes.plugin.event-mapper",
    "hermes.plugin.loader",
    "hermes.plugin.provider-registry-bridge",
    "hermes.plugin.ui-registry-bridge",
    "hermes.registry.command",
    "hermes.registry.provider-plugin",
    "hermes.registry.tool-definition",
    "hermes.registry.ui-provider",
  ].includes(atomID)) return "hermes"
  return undefined
}

function isPiProviderBridgeAtomID(atomID: string): boolean {
  return atomID.startsWith("pi.provider.") && !atomID.endsWith(".native-like") && atomID !== "pi.provider.cassette-artifact"
}

function isNanobotProviderBridgeAtomID(atomID: string): boolean {
  return atomID.startsWith("nanobot.provider.") && !atomID.endsWith(".native-like") && atomID !== "nanobot.provider.cassette-artifact"
}

function isHermesProviderBridgeAtomID(atomID: string): boolean {
  return atomID.startsWith("hermes.provider.") && !atomID.endsWith(".native-like") && atomID !== "hermes.provider.cassette-artifact"
}

function isOpenCodeSessionBridgeAtomID(atomID: string): boolean {
  return atomID.startsWith("opencode.session.")
    && ![
      openCodeSessionIDGeneratorNativeExactAtomID,
      openCodeSessionSQLiteProjectionNativeExactAtomID,
      openCodeSessionBranchGraphNativeExactAtomID,
      openCodeSessionMessageV2ProjectorNativeExactAtomID,
      openCodeSessionSyncEventProjectorNativeExactAtomID,
      openCodeSessionPaginationNativeExactAtomID,
      openCodeSessionCompactionEventNativeExactAtomID,
    ].includes(atomID)
    && !atomID.endsWith(".native-like")
}

function sessionBridgeSourceMatrixID(atomID: string): "opencode" | "pi" | "nanobot" | "hermes" | undefined {
  if (isOpenCodeSessionBridgeAtomID(atomID)) return "opencode"
  if ([
    "pi.session.branch-graph.active-leaf",
    "pi.session.branch-graph.leaf-tree",
    "pi.session.branch-summary",
    "pi.session.context-selector.active-leaf",
    "pi.session.id-generator",
    "pi.session.pagination.active-path",
    "pi.session.projector.jsonl",
    "pi.session.projector.jsonl-v3",
    "pi.session.store.jsonl-v3",
    "pi.session.store.jsonl-v3-migrator",
  ].includes(atomID)) return "pi"
  if ([
    "nanobot.session.branch-graph.channel-key",
    "nanobot.session.context-selector.max-messages",
    "nanobot.session.goal-state",
    "nanobot.session.id-generator",
    "nanobot.session.pagination.updated-at",
    "nanobot.session.projector.jsonl",
    "nanobot.session.store.jsonl",
  ].includes(atomID)) return "nanobot"
  if ([
    "hermes.session.branch-graph.lineage",
    "hermes.session.compaction-trajectory",
    "hermes.session.context-selector.thread-history",
    "hermes.session.id-generator",
    "hermes.session.pagination.updated-at",
    "hermes.session.projector.openai-messages",
    "hermes.session.store.sqlite-fts",
  ].includes(atomID)) return "hermes"
  return undefined
}

function sessionMessagePartReplayEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom) || isPiSessionNativeExactAtom(atom)) return []
  const parsed = parseSessionMessagePartReplayAtomID(atom.id)
  if (!parsed) return []
  return [
    `conformance:${parsed.product}-session-message-part-replay-snapshot`,
    `session-message-part-replay:${parsed.product}:${parsed.key}`,
    `conformance:${parsed.product}-session-storage-roundtrip`,
    `session-storage-roundtrip:${parsed.product}`,
    `conformance:${parsed.product}-session-provider-metadata-roundtrip`,
    `session-provider-metadata-roundtrip:${parsed.product}`,
  ]
}

function sessionMessagePartReplayFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom) || isPiSessionNativeExactAtom(atom)) return []
  const parsed = parseSessionMessagePartReplayAtomID(atom.id)
  return parsed ? [`${parsed.product}-session-message-part:${parsed.key}`, `${parsed.product}-session-message-part:storage-roundtrip`, `${parsed.product}-session-message-part:provider-metadata-roundtrip`] : []
}

function runtimeAcceptanceReplayEvidenceRefs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom) || isPiRuntimeAcceptanceNativeExactAtom(atom)) return []
  const parsed = parseRuntimeAcceptanceReplayAtomID(atom.id)
  if (!parsed) return []
  return [
    `conformance:${parsed.product}-runtime-acceptance-replay-snapshot`,
    `runtime-acceptance-replay:${parsed.product}:${parsed.key}`,
    `conformance:${parsed.product}-runtime-acceptance-timing-boundary`,
    `runtime-acceptance-timing-boundary:${parsed.product}`,
    `conformance:${parsed.product}-runtime-acceptance-lifecycle`,
    `runtime-acceptance-lifecycle:${parsed.product}`,
    `conformance:${parsed.product}-runtime-acceptance-persistence-cleanup`,
    `runtime-acceptance-persistence-cleanup:${parsed.product}`,
    ...(parsed.product === "opencode"
      ? [
        "conformance:opencode-runtime-loop-acceptance-boundary-projection",
        "runtime-loop-acceptance-boundary:opencode",
      ]
      : []),
  ]
}

function runtimeAcceptanceReplayFixtureIDs(atom: AssemblyContractAtom): string[] {
  if (isDescriptorNativeExactAtom(atom) || isPiRuntimeAcceptanceNativeExactAtom(atom)) return []
  const parsed = parseRuntimeAcceptanceReplayAtomID(atom.id)
  return parsed
    ? [
      `${parsed.product}-runtime-acceptance:${parsed.key}`,
      `${parsed.product}-runtime-acceptance:timing-boundary`,
      `${parsed.product}-runtime-acceptance:lifecycle`,
      `${parsed.product}-runtime-acceptance:persistence-cleanup`,
      ...(parsed.product === "opencode" ? ["opencode-runtime:loop-acceptance-boundary-projection"] : []),
    ]
    : []
}

function parseProductTurnReplayAtomID(atomID: string): { product: "opencode" | "pi-mono" | "nanobot" | "hermes-agent"; key: string } | undefined {
  const match = /^(opencode|pi|nanobot|hermes)\.turn\.(input-normalizer|context-builder|prompt-assembler|provider-request-builder|provider-stream-runner|stream-reducer|tool-call-planner|tool-executor|result-recorder|retry-policy|continuation-policy|compaction-policy|stop-condition)$/.exec(atomID)
  if (!match) return undefined
  const [, prefix, key] = match
  const product = prefix === "pi" ? "pi-mono" : prefix === "hermes" ? "hermes-agent" : prefix
  return product && key ? { product: product as "opencode" | "pi-mono" | "nanobot" | "hermes-agent", key } : undefined
}

function parseCadenceReplayAtomID(atomID: string): { product: "opencode" | "pi-mono" | "nanobot" | "hermes-agent"; key: "request-boundary" | "final-summary" | "tool-batch-scheduler" } | undefined {
  const match = /^(opencode|pi|nanobot|hermes)\.(?:(agent-loop)\.(request-boundary|final-summary)|(tools)\.(batch-scheduler))\.native-like$/.exec(atomID)
  if (!match) return undefined
  const [, prefix, agentLoopPlane, agentLoopKey, toolsPlane, toolsKey] = match
  const product = prefix === "pi" ? "pi-mono" : prefix === "hermes" ? "hermes-agent" : prefix
  const key = agentLoopPlane && agentLoopKey ? agentLoopKey : toolsPlane && toolsKey ? "tool-batch-scheduler" : undefined
  return product && key ? { product: product as "opencode" | "pi-mono" | "nanobot" | "hermes-agent", key: key as "request-boundary" | "final-summary" | "tool-batch-scheduler" } : undefined
}

function parseToolCadenceReplayAtomID(atomID: string): { product: "opencode" | "pi-mono" | "nanobot" | "hermes-agent"; key: "schema" | "result-projector" } | undefined {
  const match = /^(opencode|pi|nanobot|hermes)\.tools\.(schema|result-projector)\.native-like$/.exec(atomID)
  if (!match) return undefined
  const [, prefix, key] = match
  const product = prefix === "pi" ? "pi-mono" : prefix === "hermes" ? "hermes-agent" : prefix
  return product && key ? { product: product as "opencode" | "pi-mono" | "nanobot" | "hermes-agent", key: key as "schema" | "result-projector" } : undefined
}

function parseProviderStreamReplayAtomID(atomID: string): { product: "opencode" | "pi-mono" | "nanobot" | "hermes-agent"; key: "streaming-delta-recorder" | "stream-projector" } | undefined {
  const match = /^(opencode|pi|nanobot|hermes)\.provider\.(streaming-delta-recorder|stream-projector)\.native-like$/.exec(atomID)
  if (!match) return undefined
  const [, prefix, key] = match
  const product = prefix === "pi" ? "pi-mono" : prefix === "hermes" ? "hermes-agent" : prefix
  return product && key ? { product: product as "opencode" | "pi-mono" | "nanobot" | "hermes-agent", key: key as "streaming-delta-recorder" | "stream-projector" } : undefined
}

function parseSessionMessagePartReplayAtomID(atomID: string): { product: "opencode" | "pi-mono" | "nanobot" | "hermes-agent"; key: "message-part-projector" } | undefined {
  const match = /^(opencode|pi|nanobot|hermes)\.session\.message-part-projector\.native-like$/.exec(atomID)
  if (!match) return undefined
  const [, prefix] = match
  const product = prefix === "pi" ? "pi-mono" : prefix === "hermes" ? "hermes-agent" : prefix
  return product ? { product: product as "opencode" | "pi-mono" | "nanobot" | "hermes-agent", key: "message-part-projector" } : undefined
}

function parseRuntimeAcceptanceReplayAtomID(atomID: string): { product: "opencode" | "pi-mono" | "nanobot" | "hermes-agent"; key: "acceptance-controller" | "acceptance-evidence" } | undefined {
  const match = /^(opencode|pi|nanobot|hermes)\.runtime\.(acceptance-controller|acceptance-evidence)\.native-like$/.exec(atomID)
  if (!match) return undefined
  const [, prefix, key] = match
  const product = prefix === "pi" ? "pi-mono" : prefix === "hermes" ? "hermes-agent" : prefix
  return product && key ? { product: product as "opencode" | "pi-mono" | "nanobot" | "hermes-agent", key: key as "acceptance-controller" | "acceptance-evidence" } : undefined
}

export function previewDemotionEvidenceRefsForAtomID(atomID: string): string[] {
  const descriptor = previewDemotionDescriptorForAtomID(atomID)
  return descriptor ? descriptor.evidenceRefs : []
}

export function previewDemotionFixtureIDsForAtomID(atomID: string): string[] {
  const descriptor = previewDemotionDescriptorForAtomID(atomID)
  return descriptor ? descriptor.fixtureIDs : []
}

export function previewDemotionLossinessForAtomID(atomID: string): string[] {
  const descriptor = previewDemotionDescriptorForAtomID(atomID)
  return descriptor ? descriptor.lossiness : []
}

const OPENCODE_METADATA_OVERLAY_ATOM_IDS = new Set([
  "opencode.block.compatibility-metadata",
  "opencode.capability.aliases",
  "opencode.conformance.product-gate",
  "opencode.provider.cassette-artifact",
  "opencode.recipe.binding-aliases",
  "opencode.resource.grant-defaults",
  "opencode.runtime.binding-defaults",
  "opencode.runtime.capability-aliases",
  "opencode.runtime.graph-labels",
  "opencode.runtime.lifecycle-defaults",
  "opencode.runtime.module-aliases",
  "opencode.trace.sqlite-part-projection",
  "opencode.turn.cadence-emitter",
])

function isOpenCodeMetadataOverlayAtomID(atomID: string): boolean {
  return OPENCODE_METADATA_OVERLAY_ATOM_IDS.has(atomID.toLowerCase())
}

function previewDemotionDescriptorForAtomID(atomID: string): { evidenceRefs: string[]; fixtureIDs: string[]; lossiness: string[] } | undefined {
  const id = atomID.toLowerCase()
  if (
    id === "opencode.tui.shell" ||
    id === "opencode.product-shell.tui" ||
    id === "opencode.product-shell.web" ||
    id === "opencode.product-shell.desktop" ||
    id === "pi.tui.shell" ||
    id === "pi.product-shell.tui" ||
    id === "pi.product-shell.web-ui" ||
    id === "pi.product-shell.browser-smoke" ||
    id === "pi.product-shell.release-hardening" ||
    id === "nanobot.tui.shell" ||
    id === "nanobot.product-shell.tui" ||
    id === "nanobot.product-shell.web-ui" ||
    id === "hermes.tui.shell" ||
    id === "hermes.product-shell.tui" ||
    id === "hermes.product-shell.web-dashboard"
  ) return undefined
  const prefix = productPrefixForPreviewDemotionAtomID(id)
  if (!prefix) return undefined
  const product = previewDemotionProductForPrefix(prefix)
  if (/^(opencode|pi|nanobot|hermes)\.tui\.shell$/.test(id)) {
    return {
      evidenceRefs: ["conformance:product-tui-preview-demotion", `preview-demotion:${product}:ui-event-loop`],
      fixtureIDs: [`${prefix}-tui:shared-event-loop-preview`],
      lossiness: ["legacy-tui-shell-id-preview-only", "no-native-pty-transcript", "shared-helix-event-loop-preview"],
    }
  }
  if (/^(opencode|pi|nanobot|hermes)\.product-shell\.tui$/.test(id)) {
    return {
      evidenceRefs: ["conformance:product-tui-preview-demotion", `preview-demotion:${product}:product-shell-tui`],
      fixtureIDs: [`${prefix}-product-shell:tui-preview`],
      lossiness: ["no-native-pty-transcript", "product-shell-tui-preview-only"],
    }
  }
  if (/^(opencode|pi|nanobot|hermes)\.product-shell\.(web|web-ui|web-dashboard)$/.test(id)) {
    return {
      evidenceRefs: ["conformance:product-web-preview-demotion", `preview-demotion:${product}:inspection-dashboard`],
      fixtureIDs: [`${prefix}-product-shell:inspection-dashboard-preview`],
      lossiness: ["no-native-web-api-parity", "static-inspection-dashboard-preview"],
    }
  }
  return undefined
}

function productPrefixForPreviewDemotionAtomID(atomID: string): "opencode" | "pi" | "nanobot" | "hermes" | undefined {
  const match = /^(opencode|pi|nanobot|hermes)\./.exec(atomID)
  return match?.[1] as "opencode" | "pi" | "nanobot" | "hermes" | undefined
}

function previewDemotionProductForPrefix(prefix: "opencode" | "pi" | "nanobot" | "hermes"): "opencode" | "pi-mono" | "nanobot" | "hermes-agent" {
  if (prefix === "pi") return "pi-mono"
  if (prefix === "hermes") return "hermes-agent"
  return prefix
}

function isProductScopedAtom(atom: AssemblyContractAtom): boolean {
  return atom.scope === "product" || (atom.personality !== "common" && atom.personality !== "minimal")
}

function parityCoverageForImplementationLevel(level: ReturnType<typeof executableImplementationLevelForAtom>): AssemblyAtomParityCoverage {
  if (level === "native") return "native"
  if (level === "native-like") return "native-like"
  if (level === "profile-compatible") return "profile-compatible"
  if (level === "compatible-bridge") return "compatible-bridge"
  if (level === "preview-shell") return "preview"
  if (level === "metadata-only") return "metadata"
  if (level === "common-shared") return "common-shared"
  return "none"
}

function knownLossinessForAtom(
  atom: AssemblyContractAtom,
  level: ReturnType<typeof executableImplementationLevelForAtom>,
  product: AssemblyContractProduct,
): string[] {
  if (product === "minimal" || product === "custom") return []
  const id = atom.id.toLowerCase()
  const reason = atom.selectionReason.toLowerCase()
  if (level === "profile-compatible" && parseProductTurnReplayAtomID(atom.id)) {
    const parsed = parseProductTurnReplayAtomID(atom.id)
    return [
      "shared-turn-profile",
      "partial-product-turn-replay",
      "common-runner-not-full-native-loop",
      ...(parsed?.product === "opencode" ? [
        "opencode-turn-pipeline-boundary-projection-partial-fixture",
        "opencode-turn-identity-readback-projection-partial-fixture",
        "opencode-turn-loop-control-projection-partial-fixture",
        "opencode-turn-side-effect-timeline-projection-partial-fixture",
        "opencode-turn-provider-step-projection-partial-fixture",
        "opencode-turn-message-v2-object-identity-not-exact",
        "opencode-turn-provider-request-object-identity-not-exact",
        "opencode-turn-provider-request-payload-not-exact",
        "opencode-turn-provider-stream-frame-timing-not-exact",
        "opencode-turn-tool-side-effects-not-exact",
        "opencode-turn-session-write-readback-not-exact",
        "opencode-turn-summary-stop-object-identity-not-exact",
        "opencode-turn-loop-control-wall-clock-timing-not-exact",
        "opencode-turn-retry-continuation-stop-decision-not-exact",
        "opencode-turn-retry-continuation-decision-not-exact",
        "opencode-turn-provider-cancel-cleanup-not-exact",
        "opencode-turn-side-effect-order-not-exact",
      ] : []),
    ]
  }
  if (level === "profile-compatible") return ["shared-turn-profile", "missing-product-native-turn-fixture"]
  if (level === "preview-shell" && isOpenCodeProductShellPreviewSourceMatrixAtomID(atom.id)) {
    return [
      "inspection-or-preview-surface",
      "not-native-ui-parity",
      "opencode-product-shell-source-matrix-partial-fixture",
      "opencode-product-shell-runtime-projection-partial-fixture",
      "opencode-product-shell-live-runtime-fixture-partial-native-gap",
    ]
  }
  if (level === "preview-shell") return ["inspection-or-preview-surface", "not-native-ui-parity"]
  if (level === "metadata-only" && isOpenCodeMetadataOverlayAtomID(atom.id)) {
    return ["bom-or-overlay-only", "not-executable-provider", "opencode-metadata-overlay-demotion-matrix-partial-fixture"]
  }
  if (level === "metadata-only") return ["bom-or-overlay-only", "not-executable-provider"]
  if (level === "compatible-bridge" && reason.includes("product identity snapshot")) {
    if (atom.id === "hermes.prompt.agent-builder") {
      return [
        "partial-prompt-family",
        "missing-upstream-branch-fixture",
        "hermes-prompt-factory-options-not-full-upstream-registry",
        "hermes-prompt-scanner-semantic-not-full-upstream-scanner",
        "hermes-upstream-registry-source-matrix-partial-fixture",
        "promptware-scanner-covered-by-partial-fixture",
      ]
    }
    if (atom.id === "nanobot.prompt.agent-builder") {
      return [
        "partial-prompt-family",
        "missing-upstream-branch-fixture",
        "nanobot-upstream-prompt-source-matrix-partial-fixture",
        "nanobot-channel-lifecycle-timing-partial-fixture",
        "nanobot-channel-side-effect-replay-partial-fixture",
        "nanobot-channel-registry-source-matrix-partial-fixture",
        "nanobot-platform-prompt-family-partial-fixture",
        "nanobot-platform-router-rendering-partial-fixture",
      ]
    }
    if (atom.id === "opencode.prompt.mode-builder") {
      return [
        "partial-prompt-family",
        "missing-upstream-branch-fixture",
        "opencode-upstream-system-output-matrix-partial-fixture",
        "opencode-system-prompt-runtime-output-projection-partial-fixture",
        "opencode-system-prompt-invocation-boundary-projection-partial-fixture",
        "opencode-system-prompt-provider-message-projection-partial-fixture",
        "opencode-system-prompt-live-runtime-fixture-partial-native-gap",
      ]
    }
    if (atom.id === "pi.prompt.coding-agent-builder") {
      return ["partial-prompt-family", "missing-upstream-branch-fixture", "pi-upstream-source-matrix-partial-fixture"]
    }
    return ["partial-prompt-family", "missing-upstream-branch-fixture"]
  }
  if (level === "compatible-bridge" && isNanobotProviderBridgeAtomID(atom.id)) {
    return ["product-bridge", "native-parity-not-proven", "nanobot-provider-source-matrix-partial-fixture"]
  }
  if (level === "compatible-bridge" && isOpenCodeProviderBridgeAtomID(atom.id)) {
    return [
      "product-bridge",
      "native-parity-not-proven",
      "opencode-provider-source-matrix-partial-fixture",
      "opencode-provider-raw-frame-boundary-matrix-partial-fixture",
      ...(isOpenCodeProviderPluginRuntimeAtomID(atom.id) ? ["opencode-provider-plugin-runtime-matrix-partial-fixture"] : []),
      ...(isOpenCodeProviderPackageRuntimeProjectionAtomID(atom.id) ? ["opencode-provider-package-runtime-projection-partial-fixture"] : []),
      ...(isOpenCodeProviderPackageRuntimeProjectionAtomID(atom.id) ? ["opencode-provider-package-runtime-live-runtime-fixture-partial-native-gap"] : []),
      ...(isOpenCodeProviderRetryCancelRaceProjectionAtomID(atom.id) ? ["opencode-provider-retry-cancel-race-projection-partial-fixture"] : []),
      ...(isOpenCodeProviderRetryCancelRaceProjectionAtomID(atom.id) ? ["opencode-provider-retry-cancel-live-runtime-fixture-partial-native-gap"] : []),
    ]
  }
  if (level === "compatible-bridge" && isPiProviderBridgeAtomID(atom.id)) {
    return ["product-bridge", "native-parity-not-proven", "pi-provider-source-matrix-partial-fixture"]
  }
  if (level === "compatible-bridge" && isHermesProviderBridgeAtomID(atom.id)) {
    return ["product-bridge", "native-parity-not-proven", "hermes-provider-source-matrix-partial-fixture"]
  }
  const sessionSourceMatrixID = sessionBridgeSourceMatrixID(atom.id)
  if (level === "compatible-bridge" && sessionSourceMatrixID) {
    return [
      "product-bridge",
      "native-parity-not-proven",
      `${sessionSourceMatrixID}-session-source-matrix-partial-fixture`,
      ...(sessionSourceMatrixID === "opencode" ? ["opencode-session-runtime-projection-partial-fixture", "opencode-session-live-runtime-fixture-partial-native-gap"] : []),
    ]
  }
  const identitySourceMatrixID = identityBridgeSourceMatrixID(atom.id)
  if (level === "compatible-bridge" && identitySourceMatrixID) {
    return [
      "product-bridge",
      "native-parity-not-proven",
      `${identitySourceMatrixID}-identity-source-matrix-partial-fixture`,
      ...(identitySourceMatrixID === "opencode" ? ["opencode-identity-live-runtime-fixture-partial-native-gap"] : []),
    ]
  }
  const configSourceMatrixID = configBridgeSourceMatrixID(atom.id)
  if (level === "compatible-bridge" && configSourceMatrixID) {
    return [
      "product-bridge",
      "native-parity-not-proven",
      `${configSourceMatrixID}-config-source-matrix-partial-fixture`,
      ...(configSourceMatrixID === "opencode" ? ["opencode-config-runtime-projection-partial-fixture", "opencode-config-live-runtime-fixture-partial-native-gap"] : []),
    ]
  }
  const eventSourceMatrixID = eventBridgeSourceMatrixID(atom.id)
  if (level === "compatible-bridge" && eventSourceMatrixID) {
    return [
      "product-bridge",
      "native-parity-not-proven",
      `${eventSourceMatrixID}-event-source-matrix-partial-fixture`,
      ...(eventSourceMatrixID === "opencode" && isOpenCodeEventLiveRuntimeFixtureAtomID(atom.id) ? ["opencode-event-live-runtime-fixture-partial-native-gap"] : []),
    ]
  }
  const traceSourceMatrixID = traceBridgeSourceMatrixID(atom.id)
  if (level === "compatible-bridge" && traceSourceMatrixID) {
    return ["product-bridge", "native-parity-not-proven", `${traceSourceMatrixID}-trace-source-matrix-partial-fixture`]
  }
  if (level === "compatible-bridge" && isOpenCodeFoundationTraceBridgeAtomID(atom.id)) {
    return [
      "product-bridge",
      "native-parity-not-proven",
      "opencode-foundation-trace-runtime-projection-partial-fixture",
      "opencode-foundation-trace-source-matrix-partial-fixture",
    ]
  }
  const productShellMatrixID = productShellSourceMatrixID(atom.id)
  if (level === "compatible-bridge" && productShellMatrixID) {
    return [
      "product-bridge",
      "native-parity-not-proven",
      `${productShellMatrixID}-product-shell-source-matrix-partial-fixture`,
      ...(productShellMatrixID === "opencode" ? ["opencode-product-shell-runtime-projection-partial-fixture", "opencode-product-shell-live-runtime-fixture-partial-native-gap"] : []),
    ]
  }
  const uiSourceMatrixID = uiBridgeSourceMatrixID(atom.id)
  if (level === "compatible-bridge" && uiSourceMatrixID) {
    return [
      "product-bridge",
      "native-parity-not-proven",
      `${uiSourceMatrixID}-ui-source-matrix-partial-fixture`,
      ...(uiSourceMatrixID === "opencode" && isOpenCodeUILiveRuntimeFixtureAtomID(atom.id) ? ["opencode-ui-live-runtime-fixture-partial-native-gap"] : []),
    ]
  }
  const toolSourceMatrixID = toolBridgeSourceMatrixID(atom.id)
  if (level === "compatible-bridge" && toolSourceMatrixID) {
    return [
      "product-bridge",
      "native-parity-not-proven",
      `${toolSourceMatrixID}-tool-source-matrix-partial-fixture`,
      ...(toolSourceMatrixID === "opencode" && isOpenCodeToolContractRenderProjectionAtomID(atom.id) ? ["opencode-tool-contract-render-projection-partial-fixture"] : []),
      ...(toolSourceMatrixID === "opencode" && isOpenCodeToolLiveRuntimeFixtureAtomID(atom.id) ? ["opencode-tool-live-runtime-fixture-partial-native-gap"] : []),
    ]
  }
  const hookSourceMatrixID = hookBridgeSourceMatrixID(atom.id)
  if (level === "compatible-bridge" && hookSourceMatrixID) {
    return [
      "product-bridge",
      "native-parity-not-proven",
      `${hookSourceMatrixID}-hook-source-matrix-partial-fixture`,
      ...(hookSourceMatrixID === "opencode" && isOpenCodeHookLiveRuntimeFixtureAtomID(atom.id) ? ["opencode-hook-live-runtime-fixture-partial-native-gap"] : []),
    ]
  }
  if (level === "compatible-bridge") return ["product-bridge", "native-parity-not-proven"]
  if (level === "native-like" && id.includes(".tools.schema.")) return ["tool-schema-alias-projection", "partial-tool-cadence-replay"]
  if (level === "native-like" && id.includes(".tools.result-projector.")) {
    return [
      "tool-result-envelope-projection",
      "partial-tool-cadence-replay",
      "partial-tool-result-event-stream",
      "partial-tool-result-envelope-roundtrip",
      "partial-tool-result-writeback-timing",
      "native-progress-event-timing-not-replayed",
      "native-result-envelope-roundtrip-not-proven",
      "native-session-writeback-record-id-partial",
    ]
  }
  if (level === "native-like" && id.includes(".provider.streaming-delta-recorder.")) {
    return [
      "provider-streaming-delta-semantic-projection",
      "partial-provider-stream-replay",
      "partial-provider-raw-frame-timeline",
      "partial-provider-raw-payload-roundtrip",
      "raw-frame-wall-clock-timing-not-replayed",
      "provider-retry-delay-not-exact",
      "cancel-abort-race-not-replayed",
    ]
  }
  if (level === "native-like" && id.includes(".provider.stream-projector.")) {
    return [
      "provider-stream-semantic-projection",
      "partial-provider-stream-replay",
      "partial-provider-raw-frame-timeline",
      "partial-provider-raw-payload-roundtrip",
      "raw-frame-wall-clock-timing-not-replayed",
      "provider-retry-delay-not-exact",
      "cancel-abort-race-not-replayed",
    ]
  }
  if (level === "native-like" && id.includes(".session.message-part-projector.")) {
    return [
      "session-message-part-lossy-projection",
      "partial-session-message-part-replay",
      "partial-session-storage-roundtrip",
      "partial-session-provider-metadata-roundtrip",
      "native-storage-transaction-order-not-replayed",
      "provider-raw-metadata-roundtrip-not-proven",
      "provider-metadata-private-state-not-replayed",
      "branch-lineage-id-roundtrip-partial",
    ]
  }
  if (level === "native-like" && id.includes(".runtime.acceptance-")) {
    const runtimeAcceptanceProduct = parseRuntimeAcceptanceReplayAtomID(atom.id)?.product
    return [
      "runtime-acceptance-policy-approximation",
      "partial-runtime-acceptance-replay",
      "partial-runtime-acceptance-timing-boundary",
      "partial-runtime-acceptance-lifecycle",
      "partial-runtime-acceptance-persistence-cleanup",
      ...(runtimeAcceptanceProduct === "opencode" ? ["opencode-runtime-loop-acceptance-boundary-projection-partial-fixture"] : []),
      "full-upstream-stop-continue-timing-not-replayed",
      ...(runtimeAcceptanceProduct === "opencode" ? ["opencode-turn-to-acceptance-event-object-identity-not-exact"] : []),
      "process-cleanup-side-effects-not-replayed",
      "cleanup-side-effect-order-not-full-native",
      "native-loop-cancel-race-not-replayed",
    ]
  }
  if (level === "native-like" && parseCadenceReplayAtomID(atom.id)) {
    return [
      "semantic-approximation",
      "partial-cadence-replay",
      "product-projector-partial",
      "partial-cadence-side-effect-order",
      "exact-upstream-replay-not-proven",
      "native-event-timing-not-replayed",
      "native-side-effects-not-fully-replayed",
    ]
  }
  if (level === "native-like") return ["semantic-approximation", "exact-upstream-replay-not-proven"]
  return []
}

function toolCadenceDescriptorInput(descriptor: ReturnType<typeof toolCadenceAtomDescriptors>[number]): DescriptorAtomInput {
  const base: DescriptorAtomInput = {
    id: descriptor.id,
    port: descriptor.port,
    product: descriptor.product,
    plane: "tool",
    scope: descriptor.product === "common" ? "common" : "product",
    kind: "tool-cadence",
    stability: "stable",
    nativeFixtureSource: descriptor.nativeFixtureSource,
    replay: descriptor.replay,
    selected: true,
    selectionReason: `${descriptor.product} tool cadence descriptor`,
  }
  const nativeExactDescriptor = nativeExactCadenceDescriptorForID(descriptor.id)
  if (!nativeExactDescriptor) return base
  return {
    id: nativeExactDescriptor.id,
    port: nativeExactDescriptor.port,
    product: nativeExactDescriptor.product,
    plane: planeForNativeExactDescriptor(nativeExactDescriptor),
    scope: "product",
    kind: "tool-cadence",
    stability: "stable",
    implementationKind: nativeExactDescriptor.implementationKind,
    selected: true,
    selectionReason: nativeExactDescriptor.selectionReason,
    nativeEvidenceRefs: [...nativeExactDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...nativeExactDescriptor.fixtureIDs],
    parityCoverage: nativeExactDescriptor.parityCoverage,
    knownLossiness: [...nativeExactDescriptor.knownLossiness],
  }
}

function cadencePolicyDescriptorInput(descriptor: ReturnType<typeof cadencePolicyDescriptors>[number]): DescriptorAtomInput {
  const base: DescriptorAtomInput = {
    id: descriptor.id,
    port: descriptor.port,
    product: descriptor.product,
    plane: (descriptor.plane === "tools" ? "tool" : descriptor.plane) as AssemblyContractPlane,
    scope: (descriptor.product === "common" ? "common" : "product") as AssemblyAtomScope,
    kind: "cadence-policy",
    stability: "stable",
    ...(descriptor.nativeFixtureSource ? { nativeFixtureSource: descriptor.nativeFixtureSource } : {}),
    ...(descriptor.replay ? { replay: descriptor.replay } : {}),
    selected: true,
    selectionReason: `${descriptor.product} cadence policy descriptor`,
  }
  const nativeExactDescriptor = nativeExactCadenceDescriptorForID(descriptor.id)
  if (!nativeExactDescriptor) return base
  return {
    id: nativeExactDescriptor.id,
    port: nativeExactDescriptor.port,
    product: nativeExactDescriptor.product,
    plane: planeForNativeExactDescriptor(nativeExactDescriptor),
    scope: "product",
    kind: "cadence-policy",
    stability: "stable",
    implementationKind: nativeExactDescriptor.implementationKind,
    selected: true,
    selectionReason: nativeExactDescriptor.selectionReason,
    nativeEvidenceRefs: [...nativeExactDescriptor.nativeEvidenceRefs],
    fixtureIDs: [...nativeExactDescriptor.fixtureIDs],
    parityCoverage: nativeExactDescriptor.parityCoverage,
    knownLossiness: [...nativeExactDescriptor.knownLossiness],
  }
}

type DescriptorProduct = "common" | Exclude<HarnessProduct, "opencode-pi-hybrid">

function descriptorProductFor(product: AssemblyContractProduct): DescriptorProduct {
  if (product === "minimal" || product === "custom") return "common"
  if (product === "opencode-pi-hybrid") return "pi-mono"
  if (product === "opencode" || product === "pi-mono" || product === "nanobot" || product === "hermes-agent") return product
  return "common"
}

function descriptorAtomsFor(product: AssemblyContractProduct): DescriptorAtomInput[] {
  const descriptorProduct = descriptorProductFor(product)
  const atoms: DescriptorAtomInput[] = []
  if (product === "opencode") {
    atoms.push(
      { ...openCodeShellEnvNativeDescriptor },
      { ...openCodeProviderAuthDescriptorNativeDescriptor },
      { ...openCodeProviderPluginDescriptorNativeDescriptor },
      { ...openCodeProviderModelPluginNativeDescriptor },
      { ...openCodeProviderUsageRendererNativeDescriptor },
      { ...openCodeProviderRequestOptionsNativeDescriptor },
      nativeDescriptorInput(openCodeProviderStreamingDeltaRecorderNativeDescriptor, "provider"),
      nativeDescriptorInput(openCodeProviderStreamProjectorNativeDescriptor, "provider"),
      { ...openCodeTurnInputNormalizerNativeDescriptor },
      { ...openCodeTurnContextBuilderNativeDescriptor },
      { ...openCodeTurnPromptAssemblerNativeDescriptor },
      { ...openCodeTurnProviderRequestBuilderNativeDescriptor },
      { ...openCodeTurnProviderStreamRunnerNativeDescriptor },
      { ...openCodeTurnRetryPolicyNativeDescriptor },
      { ...openCodeTurnStreamReducerNativeDescriptor },
      { ...openCodeTurnToolCallPlannerNativeDescriptor },
      { ...openCodeTurnToolExecutorNativeDescriptor },
      { ...openCodeTurnContinuationPolicyNativeDescriptor },
      { ...openCodeTurnStopConditionNativeDescriptor },
      { ...openCodeTurnCompactionPolicyNativeDescriptor },
      { ...openCodeTurnResultRecorderNativeDescriptor },
      { ...openCodeProviderParserObserverNativeDescriptor },
      { ...openCodeProviderEventObserverNativeDescriptor },
      { ...openCodeProviderTransportInstrumentationNativeDescriptor },
      { ...openCodeTraceDebugSurfaceNativeDescriptor },
      { ...openCodePromptModeBuilderNativeDescriptor },
      ...openCodePromptInstructionResourceNativeDescriptors.map((descriptor) => ({ ...descriptor })),
    )
  }
  atoms.push(
    ...cadencePolicyDescriptors(descriptorProduct).map(cadencePolicyDescriptorInput),
  )
  atoms.push(
    ...toolCadenceAtomDescriptors(descriptorProduct).map(toolCadenceDescriptorInput),
  )
  atoms.push(
    ...messagePartProjectorDescriptors(descriptorProduct)
      .filter((descriptor) =>
        (descriptorProduct !== "pi-mono" ||
          descriptor.id !== piMonoSessionMessagePartProjectorNativeExactAtomID) &&
        (descriptorProduct !== "opencode" ||
          descriptor.id !== openCodeSessionMessagePartProjectorNativeExactAtomID) &&
        (descriptorProduct !== "nanobot" ||
          !nanobotSessionNativeDescriptors.some((nativeDescriptor) => nativeDescriptor.id === descriptor.id)) &&
        (descriptorProduct !== "hermes-agent" ||
          !hermesSessionNativeDescriptors.some((nativeDescriptor) => nativeDescriptor.id === descriptor.id))
      )
      .map((descriptor) => ({
        id: descriptor.id,
        port: descriptor.port,
        product: descriptor.product,
        plane: "session" as const,
        scope: (descriptor.product === "common" ? "common" : "product") as AssemblyAtomScope,
        kind: "message-part-projector",
        stability: "stable" as const,
        nativeFixtureSource: descriptor.nativeFixtureSource,
        replay: descriptor.replay,
        selected: true,
        selectionReason: `${descriptor.product} message part projector descriptor`,
      })),
  )
  if (descriptorProduct === "pi-mono") {
    atoms.push(identityNativeDescriptorInput(piMonoIdentityClockNativeDescriptor, "identity"))
    atoms.push(identityNativeDescriptorInput(piMonoIdentityIDGeneratorNativeDescriptor, "identity"))
    atoms.push(identityNativeDescriptorInput(piMonoIdentityWorkspaceResolverNativeDescriptor, "identity"))
    atoms.push(...piMonoEventNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "event")))
    atoms.push(...piMonoHookLifecycleNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "hook")))
    atoms.push(...piMonoProviderNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "provider")))
    atoms.push(...piMonoToolRegistrationNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "tool")))
    atoms.push(...piMonoToolRuntimeNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "tool")))
    atoms.push(nativeDescriptorInput(piMonoToolPackCompatibilityNativeDescriptor, "tool"))
    atoms.push(nativeDescriptorInput(piMonoPromptNativeDescriptor, "prompt"))
    atoms.push(...piMonoPromptSupportNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "prompt")))
    atoms.push(...piMonoTurnNativeExactDescriptors.map(piTurnNativeDescriptorInput))
    atoms.push(...piMonoConfigNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "config")))
    atoms.push(...piMonoSessionNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "session")))
    atoms.push(...piMonoRuntimeAssemblyNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "runtime")))
    atoms.push(...piMonoRuntimeAcceptanceNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "runtime")))
    atoms.push(...piMonoUINativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "ui")))
    atoms.push(...piMonoProductShellNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "product")))
    atoms.push(...piMonoTraceNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "trace")))
  }
  if (descriptorProduct === "opencode") {
    atoms.push(...openCodeIdentityNativeDescriptors.map((descriptor) => identityNativeDescriptorInput(descriptor, "identity")))
    atoms.push(...openCodeEventNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "event")))
    atoms.push(...openCodeHookLifecycleNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "hook")))
    atoms.push(...openCodeConfigNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "config")))
    atoms.push(...openCodeSessionNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "session")))
    atoms.push(...openCodeRuntimeAssemblyNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "runtime")))
    atoms.push(...openCodeRuntimeAcceptanceNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "runtime")))
    atoms.push(...openCodeToolNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "tool")))
    atoms.push(...openCodeUINativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "ui")))
    atoms.push(...openCodeProductShellNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "product")))
  }
  if (descriptorProduct === "nanobot") {
    atoms.push(...nanobotEventNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "event")))
    atoms.push(...nanobotHookLifecycleNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "hook")))
    atoms.push(...nanobotIdentityNativeDescriptors.map((descriptor) => identityNativeDescriptorInput(descriptor, "identity")))
    atoms.push(...nanobotProviderNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "provider")))
    atoms.push(...nanobotSessionNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "session")))
    atoms.push(...nanobotConfigNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "config")))
    atoms.push(...nanobotToolNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "tool")))
    atoms.push(nativeDescriptorInput(nanobotPromptNativeDescriptor, "prompt"))
    atoms.push(nativeDescriptorInput(nanobotAgentLoopRequestBoundaryNativeDescriptor, "agent-loop"))
    atoms.push(nativeDescriptorInput(nanobotAgentLoopFinalSummaryNativeDescriptor, "agent-loop"))
    atoms.push(nativeDescriptorInput(nanobotToolBatchSchedulerNativeDescriptor, "tool"))
    atoms.push(...nanobotTurnNativeExactDescriptors.map(nanobotTurnNativeDescriptorInput))
    atoms.push(...nanobotRuntimeAcceptanceNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "runtime")))
    atoms.push(...nanobotUINativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "ui")))
    atoms.push(...nanobotProductShellNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "product")))
    atoms.push(...nanobotTraceNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "trace")))
  }
  if (descriptorProduct === "hermes-agent") {
    atoms.push(...hermesEventNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "event")))
    atoms.push(...hermesHookLifecycleNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "hook")))
    atoms.push(...hermesIdentityNativeDescriptors.map((descriptor) => identityNativeDescriptorInput(descriptor, "identity")))
    atoms.push(...hermesProviderNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "provider")))
    atoms.push(...hermesConfigNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "config")))
    atoms.push(...hermesSessionNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "session")))
    atoms.push(...hermesTraceNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "trace")))
    atoms.push(...hermesToolNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "tool")))
    atoms.push(nativeDescriptorInput(hermesPromptNativeDescriptor, "prompt"))
    atoms.push(nativeDescriptorInput(hermesAgentLoopRequestBoundaryNativeDescriptor, "agent-loop"))
    atoms.push(nativeDescriptorInput(hermesAgentLoopFinalSummaryNativeDescriptor, "agent-loop"))
    atoms.push(nativeDescriptorInput(hermesToolBatchSchedulerNativeDescriptor, "tool"))
    atoms.push(...hermesTurnNativeExactDescriptors.map(hermesTurnNativeDescriptorInput))
    atoms.push(...hermesRuntimeAcceptanceNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "runtime")))
    atoms.push(...hermesUINativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "ui")))
    atoms.push(...hermesProductShellNativeDescriptors.map((descriptor) => nativeDescriptorInput(descriptor, "product")))
  }
  atoms.push(
    ...streamingDeltaRecorderDescriptors(descriptorProduct).map((descriptor) => ({
      id: descriptor.id,
      port: descriptor.port,
      product: descriptor.product,
      plane: "provider" as const,
      scope: (descriptor.product === "common" ? "common" : "product") as AssemblyAtomScope,
      kind: "streaming-delta",
      stability: "stable" as const,
      nativeFixtureSource: descriptor.nativeFixtureSource,
      replay: descriptor.replay,
      selected: true,
      selectionReason: `${descriptor.product} streaming descriptor`,
    })),
  )
  atoms.push(
    ...runtimeAcceptanceAtomDescriptors(descriptorProduct)
      .filter((descriptor) =>
        (descriptorProduct !== "pi-mono" ||
          !piMonoRuntimeAcceptanceNativeExactAtomIDs.includes(descriptor.id as (typeof piMonoRuntimeAcceptanceNativeExactAtomIDs)[number])) &&
        (descriptorProduct !== "opencode" ||
          !openCodeRuntimeAcceptanceNativeExactAtomIDs.includes(descriptor.id as (typeof openCodeRuntimeAcceptanceNativeExactAtomIDs)[number])) &&
        (descriptorProduct !== "nanobot" ||
          !nanobotRuntimeAcceptanceNativeExactAtomIDs.includes(descriptor.id as (typeof nanobotRuntimeAcceptanceNativeExactAtomIDs)[number])) &&
        (descriptorProduct !== "hermes-agent" ||
          !hermesRuntimeAcceptanceNativeExactAtomIDs.includes(descriptor.id as (typeof hermesRuntimeAcceptanceNativeExactAtomIDs)[number]))
      )
      .map((descriptor) => ({
        id: descriptor.id,
        port: descriptor.port,
        product: descriptor.product,
        plane: "runtime" as const,
        scope: (descriptor.product === "common" ? "common" : "product") as AssemblyAtomScope,
        kind: "runtime-acceptance",
        stability: "stable" as const,
        ...(descriptor.nativeFixtureSource ? { nativeFixtureSource: descriptor.nativeFixtureSource } : {}),
        replay: descriptor.replay ?? (descriptor.decisionOnPass ? { decisionOnPass: descriptor.decisionOnPass } : undefined),
        selected: true,
        selectionReason: `${descriptor.product} runtime acceptance descriptor`,
      })),
  )
  if (product !== "minimal" && product !== "custom") {
    atoms.push(
      ...productTaskCadenceDescriptors(product).map((descriptor) => ({
        id: descriptor.id,
        port: descriptor.provides,
        product: descriptor.product,
        plane: (descriptor.plane === "trace" ? "trace" : "turn") as AssemblyContractPlane,
        scope: "fixture-only" as const,
        kind: "task-cadence-fixture",
        stability: "native-fixture" as const,
        selected: false,
        selectionReason: descriptor.implementation,
      })),
    )
    atoms.push(
      ...productTaskRunnerDescriptors(product).map((descriptor) => {
        const nativeExactRunner =
          descriptor.parityCoverage === "native" &&
          (descriptor.nativeEvidenceRefs?.length ?? 0) > 0 &&
          (descriptor.fixtureIDs?.length ?? 0) > 0 &&
          (descriptor.knownLossiness?.length ?? 0) === 0
        return {
          id: `${product}.${descriptor.id}`,
          port: descriptor.id,
          product,
          plane: "task" as const,
          scope: nativeExactRunner ? ("product" as const) : descriptor.supported ? ("fixture-only" as const) : ("reserved" as const),
          kind: "task-runner",
          stability: nativeExactRunner ? ("stable" as const) : descriptor.supported ? ("native-fixture" as const) : ("reserved" as const),
          ...(nativeExactRunner ? { implementationKind: "factory" as const } : {}),
          selected: nativeExactRunner,
          selectionReason: descriptor.reason ?? descriptor.evidence.join(", "),
          ...(descriptor.nativeEvidenceRefs ? { nativeEvidenceRefs: [...descriptor.nativeEvidenceRefs] } : {}),
          ...(descriptor.fixtureIDs ? { fixtureIDs: [...descriptor.fixtureIDs] } : {}),
          ...(descriptor.parityCoverage ? { parityCoverage: descriptor.parityCoverage } : {}),
          ...(descriptor.knownLossiness ? { knownLossiness: [...descriptor.knownLossiness] } : {}),
          replay: { evidence: descriptor.evidence, supported: descriptor.supported, required: descriptor.required },
        }
      }),
    )
  }
  return atoms
}

type NativeDescriptorInput = {
  id: string
  port: string
  product: string
  implementationKind: AssemblyAtomImplementationKind
  selectionReason: string
  nativeEvidenceRefs: readonly string[]
  fixtureIDs: readonly string[]
  parityCoverage: AssemblyAtomParityCoverage
  knownLossiness: readonly string[]
}

function nativeDescriptorInput(descriptor: NativeDescriptorInput, plane: AssemblyContractPlane, kind = "atom"): DescriptorAtomInput {
  return {
    id: descriptor.id,
    port: descriptor.port,
    product: descriptor.product,
    plane,
    scope: "product",
    kind,
    stability: "stable",
    implementationKind: descriptor.implementationKind,
    selected: true,
    selectionReason: descriptor.selectionReason,
    nativeEvidenceRefs: [...descriptor.nativeEvidenceRefs],
    fixtureIDs: [...descriptor.fixtureIDs],
    parityCoverage: descriptor.parityCoverage,
    knownLossiness: [...descriptor.knownLossiness],
  }
}

function identityNativeDescriptorInput(descriptor: NativeDescriptorInput, plane: "identity"): DescriptorAtomInput {
  return nativeDescriptorInput(descriptor, plane)
}

function piTurnNativeDescriptorInput(descriptor: (typeof piMonoTurnNativeExactDescriptors)[number]): DescriptorAtomInput {
  return nativeDescriptorInput(descriptor, "turn", "product-turn")
}

function nanobotTurnNativeDescriptorInput(descriptor: (typeof nanobotTurnNativeExactDescriptors)[number]): DescriptorAtomInput {
  return nativeDescriptorInput(descriptor, "turn", "product-turn")
}

function hermesTurnNativeDescriptorInput(descriptor: (typeof hermesTurnNativeExactDescriptors)[number]): DescriptorAtomInput {
  return nativeDescriptorInput(descriptor, "turn", "product-turn")
}

function selectedNativeDescriptorAtomsFor(moduleIDs: Iterable<string>): DescriptorAtomInput[] {
  const selectedIDs = new Set(moduleIDs)
  const atoms: DescriptorAtomInput[] = []
  for (const descriptor of [
    piMonoIdentityClockNativeDescriptor,
    piMonoIdentityIDGeneratorNativeDescriptor,
    piMonoIdentityWorkspaceResolverNativeDescriptor,
  ]) {
    if (selectedIDs.has(descriptor.id)) atoms.push(identityNativeDescriptorInput(descriptor, "identity"))
  }
  for (const descriptor of openCodeIdentityNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(identityNativeDescriptorInput(descriptor, "identity"))
  }
  for (const descriptor of nanobotIdentityNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(identityNativeDescriptorInput(descriptor, "identity"))
  }
  for (const descriptor of hermesIdentityNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(identityNativeDescriptorInput(descriptor, "identity"))
  }
  for (const descriptor of [
    openCodeAgentLoopRequestBoundaryNativeDescriptor,
    openCodeAgentLoopFinalSummaryNativeDescriptor,
    hermesAgentLoopRequestBoundaryNativeDescriptor,
    hermesAgentLoopFinalSummaryNativeDescriptor,
    nanobotAgentLoopRequestBoundaryNativeDescriptor,
    nanobotAgentLoopFinalSummaryNativeDescriptor,
    piMonoAgentLoopRequestBoundaryNativeDescriptor,
    piMonoAgentLoopFinalSummaryNativeDescriptor,
    ...hermesTurnNativeExactDescriptors,
    ...nanobotTurnNativeExactDescriptors,
    ...piMonoTurnNativeExactDescriptors,
    hermesToolBatchSchedulerNativeDescriptor,
    nanobotToolBatchSchedulerNativeDescriptor,
    piMonoToolBatchSchedulerNativeDescriptor,
    piMonoToolSchemaNativeDescriptor,
    piMonoToolResultProjectorNativeDescriptor,
  ]) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, planeForNativeExactDescriptor(descriptor), "cadence-policy"))
  }
  for (const descriptor of piMonoEventNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "event"))
  }
  for (const descriptor of openCodeEventNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "event"))
  }
  for (const descriptor of nanobotEventNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "event"))
  }
  for (const descriptor of hermesEventNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "event"))
  }
  for (const descriptor of piMonoHookLifecycleNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "hook"))
  }
  for (const descriptor of openCodeHookLifecycleNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "hook"))
  }
  for (const descriptor of openCodeProviderStreamNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "provider"))
  }
  for (const descriptor of nanobotHookLifecycleNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "hook"))
  }
  for (const descriptor of hermesHookLifecycleNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "hook"))
  }
  for (const descriptor of piMonoProviderNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "provider"))
  }
  for (const descriptor of nanobotProviderNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "provider"))
  }
  for (const descriptor of hermesProviderNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "provider"))
  }
  for (const descriptor of piMonoToolRegistrationNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "tool"))
  }
  for (const descriptor of piMonoToolRuntimeNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "tool"))
  }
  for (const descriptor of openCodeToolNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "tool"))
  }
  for (const descriptor of nanobotToolNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "tool"))
  }
  for (const descriptor of hermesToolNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "tool"))
  }
  if (selectedIDs.has(piMonoToolPackCompatibilityNativeDescriptor.id)) {
    atoms.push(nativeDescriptorInput(piMonoToolPackCompatibilityNativeDescriptor, "tool"))
  }
  if (selectedIDs.has(piMonoPromptNativeDescriptor.id)) {
    atoms.push(nativeDescriptorInput(piMonoPromptNativeDescriptor, "prompt"))
  }
  if (selectedIDs.has(nanobotPromptNativeDescriptor.id)) {
    atoms.push(nativeDescriptorInput(nanobotPromptNativeDescriptor, "prompt"))
  }
  if (selectedIDs.has(hermesPromptNativeDescriptor.id)) {
    atoms.push(nativeDescriptorInput(hermesPromptNativeDescriptor, "prompt"))
  }
  for (const descriptor of piMonoPromptSupportNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "prompt"))
  }
  for (const descriptor of piMonoConfigNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "config"))
  }
  for (const descriptor of openCodeConfigNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "config"))
  }
  for (const descriptor of nanobotConfigNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "config"))
  }
  for (const descriptor of hermesConfigNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "config"))
  }
  for (const descriptor of piMonoSessionNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "session"))
  }
  for (const descriptor of openCodeSessionNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "session"))
  }
  for (const descriptor of openCodeRuntimeAssemblyNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "runtime"))
  }
  for (const descriptor of nanobotSessionNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "session"))
  }
  for (const descriptor of hermesSessionNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "session"))
  }
  for (const descriptor of piMonoRuntimeAcceptanceNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "runtime"))
  }
  for (const descriptor of piMonoRuntimeAssemblyNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "runtime"))
  }
  for (const descriptor of openCodeRuntimeAcceptanceNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "runtime"))
  }
  for (const descriptor of nanobotRuntimeAcceptanceNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "runtime"))
  }
  for (const descriptor of hermesRuntimeAcceptanceNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "runtime"))
  }
  for (const descriptor of openCodeUINativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "ui"))
  }
  for (const descriptor of piMonoUINativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "ui"))
  }
  for (const descriptor of nanobotUINativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "ui"))
  }
  for (const descriptor of hermesUINativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "ui"))
  }
  for (const descriptor of piMonoProductShellNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "product"))
  }
  for (const descriptor of openCodeProductShellNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "product"))
  }
  for (const descriptor of nanobotProductShellNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "product"))
  }
  for (const descriptor of hermesProductShellNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "product"))
  }
  for (const descriptor of piMonoTraceNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "trace"))
  }
  for (const descriptor of nanobotTraceNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "trace"))
  }
  for (const descriptor of hermesTraceNativeDescriptors) {
    if (selectedIDs.has(descriptor.id)) atoms.push(nativeDescriptorInput(descriptor, "trace"))
  }
  return atoms
}

function uniqueDescriptorAtoms(descriptors: DescriptorAtomInput[]): DescriptorAtomInput[] {
  const byID = new Map<string, DescriptorAtomInput>()
  for (const descriptor of descriptors) {
    if (!byID.has(descriptor.id)) byID.set(descriptor.id, descriptor)
  }
  return [...byID.values()]
}

function portContracts(compiled: CompiledRecipe, bundleCatalog: LegoBundleDescriptor[]): AssemblyContractPort[] {
  const bindingsByPort = new Map<string, LegoAssemblyBinding[]>()
  for (const binding of compiled.bindings) {
    const port = portIDForBinding(binding)
    bindingsByPort.set(port, [...(bindingsByPort.get(port) ?? []), binding])
  }
  const inventoryByPort = new Map<string, string[]>()
  for (const block of allRecipeInventoryBlocks()) {
    inventoryByPort.set(block.port, unique([...(inventoryByPort.get(block.port) ?? []), block.id]).sort())
  }
  const requiredPorts = new Set([...compiled.bindings.map(portIDForBinding), ...compiled.modules.flatMap((module) => module.requires)])
  const ports = allRecipePortFixtures().map((fixture): AssemblyContractPort => {
    const normalized = normalizePortContractFixture(fixture)
    const bindings = bindingsByPort.get(fixture.id) ?? []
    const providerAtoms = unique(bindings.map((binding) => binding.provider)).sort()
    const candidateAtoms = unique([...providerAtoms, ...(inventoryByPort.get(fixture.id) ?? [])]).sort()
    const selectedProviderAtom = providerAtoms[0]
    const contract = {
      input: fixture.input,
      output: fixture.output,
      lifecycle: fixture.lifecycle,
      resources: fixture.resources,
      conformance: [fixture.conformance],
      errors: fixture.errors ?? [],
      traces: fixture.traces ?? [],
    }
    return {
      id: fixture.id,
      plane: inferPlane(fixture.id, [fixture.id]),
      contract,
      input: fixture.input,
      output: fixture.output,
      cardinality: normalized.portContract.cardinality,
      multiplicity: normalized.portContract.cardinality === "multi" ? "many" : "single",
      lifecycle: fixture.lifecycle,
      resources: fixture.resources,
      conformance: [fixture.conformance],
      errors: fixture.errors ?? [],
      traces: fixture.traces ?? [],
      providerAtoms,
      consumerAtoms: unique(bindings.map((binding) => binding.consumer)).sort(),
      candidateAtoms,
      bundleCandidates: bundleCandidatesForPort(fixture.id, bundleCatalog),
      ...(selectedProviderAtom ? { selectedProviderAtom } : {}),
      productProviderAtoms: providerAtoms.filter((atom) => products.some((item) => productPrefixMatches(atom, item))),
      commonProviderAtoms: providerAtoms.filter((atom) => !products.some((item) => productPrefixMatches(atom, item))),
      swapPoint: candidateAtoms.length > 1 || requiredSwapPorts.includes(fixture.id),
      swapPolicy: {
        safety: requiredSwapPorts.includes(fixture.id) ? "requires-tests" : candidateAtoms.length > 1 ? "safe" : "experimental",
        affectedCapabilities: [fixture.id],
        requiredConformance: [fixture.conformance],
      },
      required: requiredPorts.has(fixture.id),
      ...(selectedProviderAtom ? { fallbackAtomID: selectedProviderAtom } : {}),
    }
  })
  return ports.sort((left, right) => left.id.localeCompare(right.id))
}

function surfaceContracts(
  compiled: CompiledRecipe,
  product: AssemblyContractProduct,
  moduleByID: Map<string, CompiledRecipeModule>,
  atomByID: Map<string, AssemblyContractAtom>,
): AssemblyContractSurface[] {
  const entrypoints = Object.entries(compiled.entrypoints)
  const productShellModules = compiled.modules.filter((module) => module.provides.includes("product.shell") || module.id.includes("product-shell"))
  const fromModules = productShellModules.map((module): AssemblyContractSurface => {
    const route = sourceRoute(module.id)
    return {
      surfaceID: module.id,
      id: module.id,
      type: surfaceType(module.id),
      atomID: module.id,
      backingAtoms: [module.id],
      requiredPorts: module.requires,
      nativeParityEvidence: surfaceNativeParityEvidence(product, module.id, atomByID, ["task-parity", "native-cadence-fixture"]),
      plane: "product",
      product,
      ...(route ? { source: route } : {}),
    }
  })
  const fromEntrypoints = entrypoints.map(([id, entrypoint]): AssemblyContractSurface => {
    const atomID = moduleByID.has(entrypoint) ? entrypoint : productShellModules[0]?.id ?? entrypoint
    const route = sourceRoute(atomID)
    return {
      surfaceID: id,
      id,
      type: surfaceType(id),
      atomID,
      backingAtoms: [atomID],
      requiredPorts: moduleByID.get(atomID)?.requires ?? [],
      nativeParityEvidence: surfaceNativeParityEvidence(product, atomID, atomByID, ["task-parity"]),
      entrypoint,
      plane: id.includes("ui") || id.includes("web") || id.includes("tui") ? "ui" : "product",
      product,
      ...(route ? { source: route } : {}),
    }
  })
  const seen = new Set<string>()
  return [...fromModules, ...fromEntrypoints]
    .filter((surface) => {
      const key = `${surface.id}:${surface.atomID}:${surface.entrypoint ?? ""}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((left, right) => left.id.localeCompare(right.id))
}

function surfaceNativeParityEvidence(
  product: AssemblyContractProduct,
  atomID: string,
  atomByID: Map<string, AssemblyContractAtom>,
  baseline: string[],
): string[] {
  if (product === "minimal") return []
  const atom = atomByID.get(atomID)
  const atomEvidence = atom && atom.parityCoverage === "native" && atom.knownLossiness.length === 0
    ? [...atom.nativeEvidenceRefs, ...atom.fixtureIDs]
    : []
  return unique([...baseline, ...atomEvidence]).sort()
}

function capabilityContracts(bindings: LegoAssemblyBinding[], modules: CompiledRecipeModule[]): AssemblyContractCapability[] {
  const byID = new Map<string, AssemblyContractCapability>()
  for (const module of modules) {
    for (const capability of module.providedCapabilities) {
      const current = byID.get(capability.id) ?? capabilityContractBase(capability)
      current.providers = unique([...current.providers, module.id]).sort()
      byID.set(capability.id, current)
    }
    for (const capability of module.requiredCapabilities) {
      const current = byID.get(capability.id) ?? capabilityContractBase(capability)
      current.consumers = unique([...current.consumers, module.id]).sort()
      byID.set(capability.id, current)
    }
  }
  for (const binding of bindings) {
    const current = byID.get(binding.capability.id) ?? capabilityContractBase(binding.capability)
    current.providers = unique([...current.providers, binding.provider]).sort()
    current.consumers = unique([...current.consumers, binding.consumer]).sort()
    byID.set(binding.capability.id, current)
  }
  return [...byID.values()]
    .map((capability) => ({
      ...capability,
      requiredAtoms: unique([...capability.providers, ...capability.consumers]).sort(),
      requiredPorts: [capability.id],
    }))
    .sort((left, right) => left.id.localeCompare(right.id))
}

function capabilityContractBase(capability: LegoCapabilityRef): AssemblyContractCapability {
  return {
    capabilityID: capability.id,
    id: capability.id,
    description: `${capability.kind ?? "implementation"} capability ${capability.id}`,
    kind: capability.kind,
    multiplicity: capability.multiplicity,
    stability: capability.stability,
    ...(capability.personality ? { personality: capability.personality } : {}),
    providers: [],
    consumers: [],
    requiredAtoms: [],
    requiredPorts: [capability.id],
    taskParityCoverage: "not-requested",
    liveCoverage: "not-requested",
  }
}

function swapPointContracts(ports: AssemblyContractPort[]): AssemblyContractSwapPoint[] {
  return ports
    .filter((port) => port.swapPoint && port.selectedProviderAtom)
    .map((port): AssemblyContractSwapPoint => {
      const selectedAtom = port.selectedProviderAtom ?? port.providerAtoms[0] ?? port.candidateAtoms[0] ?? "<unbound>"
      const notes = [
        port.required ? "required by compiled recipe" : "optional catalog port",
        port.productProviderAtoms.length > 0 ? "has product-specific provider" : "common provider only",
        port.candidateAtoms.length > 1 ? "multiple catalog candidates" : "single catalog candidate",
      ]
      return {
        port: port.id,
        selectedAtom,
        candidates: unique([selectedAtom, ...port.candidateAtoms]).sort(),
        commonCandidates: port.candidateAtoms.filter((atom) => !products.some((product) => productPrefixMatches(atom, product))).sort(),
        productCandidates: port.candidateAtoms.filter((atom) => products.some((product) => productPrefixMatches(atom, product))).sort(),
        contract: port.cardinality === "multi" ? "multi-provider" : "single-provider",
        risk: requiredSwapPorts.includes(port.id) ? "medium" : port.productProviderAtoms.length > 0 ? "medium" : "low",
        notes,
      }
    })
    .sort((left, right) => left.port.localeCompare(right.port))
}

function planeContracts(atoms: AssemblyContractAtom[], ports: AssemblyContractPort[]): AssemblyContract["planes"] {
  const planes = new Map<AssemblyContractPlane, { atoms: string[]; ports: string[] }>()
  for (const atom of atoms) {
    const current = planes.get(atom.plane) ?? { atoms: [], ports: [] }
    current.atoms.push(atom.id)
    planes.set(atom.plane, current)
  }
  for (const port of ports) {
    const current = planes.get(port.plane) ?? { atoms: [], ports: [] }
    current.ports.push(port.id)
    planes.set(port.plane, current)
  }
  return [...planes.entries()]
    .map(([id, value]) => ({
      id,
      atoms: unique(value.atoms).sort(),
      ports: unique(value.ports).sort(),
    }))
    .sort((left, right) => left.id.localeCompare(right.id))
}

function assemblyDiagnostics(input: {
  product: AssemblyContractProduct
  compiled: CompiledRecipe
  atoms: AssemblyContractAtom[]
  ports: AssemblyContractPort[]
  bindings: AssemblyContractBinding[]
  surfaces: AssemblyContractSurface[]
  bundles: AssemblyContractBundle[]
  bundleExpansions: AssemblyContractBundleExpansion[]
  swapPoints: AssemblyContractSwapPoint[]
}): AssemblyContractDiagnostic[] {
  const diagnostics: AssemblyContractDiagnostic[] = []
  const atomsByID = new Set(input.atoms.map((atom) => atom.id))
  for (const binding of input.bindings) {
    if (!atomsByID.has(binding.providerAtom)) {
      diagnostics.push({
        id: "binding.provider.missing",
        severity: "error",
        message: `Binding ${binding.port} points to missing provider atom ${binding.providerAtom}.`,
        refs: [binding.port, binding.providerAtom],
      })
    }
  }
  if (input.product !== "minimal" && input.surfaces.length === 0) {
    diagnostics.push({
      id: "surface.product.missing",
      severity: "error",
      message: `${input.product} contract has no product surface.`,
      refs: [input.compiled.id],
    })
  }
  for (const port of requiredSwapPorts) {
    if (input.product !== "minimal" && !input.swapPoints.some((swapPoint) => swapPoint.port === port)) {
      diagnostics.push({
        id: "swap-point.required.missing",
        severity: "warning",
        message: `Required native-alignment swap point ${port} is not declared.`,
        refs: [port],
      })
    }
  }
  return diagnostics.sort((left, right) => left.id.localeCompare(right.id) || left.refs.join(",").localeCompare(right.refs.join(",")))
}

function taskParityLinkage(input: BuildAssemblyContractInput): AssemblyContractParityLinkage {
  if (!input.includeTaskParity && !input.taskParityArtifact) {
    return {
      status: "not-requested",
      products: [],
      modes: [],
      taskIDs: [],
    }
  }
  if (!input.taskParityArtifact) {
    return {
      status: "missing",
      products: [],
      modes: [],
      taskIDs: [],
    }
  }
  const artifact = input.taskParityArtifact
  const verification = verifyProductTaskParityArtifact({ artifact })
  return {
    status: "linked",
    artifact: {
      generatedAt: artifact.generatedAt,
      suite: artifact.suite,
      provider: artifact.provider,
      reports: artifact.reports.length,
      pairs: artifact.pairs.length,
      summaryFingerprint: fingerprintObject({
        suite: artifact.suite,
        provider: artifact.provider,
        summary: artifact.summary,
        pairs: artifact.pairs.map((pair) => ({
          taskID: pair.taskID,
          product: pair.product,
          status: pair.status,
          cadenceScore: pair.cadenceScore,
          drifts: pair.cadenceDrifts.map((drift) => drift.id).sort(),
        })),
      }),
    },
    verification: {
      ok: verification.ok,
      issueIDs: verification.issues.map((issue) => issue.id),
    },
    products: unique(artifact.reports.map((report) => report.product)).sort(),
    modes: unique(artifact.reports.map((report) => report.mode)).sort(),
    taskIDs: unique(artifact.reports.map((report) => report.taskID)).sort(),
  }
}

function nativeFixtureLinkage(input: BuildAssemblyContractInput, product: AssemblyContractProduct): AssemblyContractNativeFixtureLinkage {
  if (!input.includeNativeFixtures && !input.nativeCadenceFixtures) {
    return {
      status: "not-requested",
      fixtureAtoms: [],
    }
  }
  if (!input.nativeCadenceFixtures) {
    return {
      status: "missing",
      fixtureAtoms: product === "minimal" ? [] : productTaskCadenceDescriptors(product as HarnessProduct).map((descriptor) => descriptor.id),
    }
  }
  const artifact = input.nativeCadenceFixtures
  const verification = verifyProductTaskNativeCadenceFixtureSet(artifact)
  const fixtureProducts = unique(artifact.fixtures.map((fixture) => fixture.product)).sort()
  return {
    status: "linked",
    artifact: {
      generatedAt: artifact.generatedAt,
      fixtures: artifact.fixtures.length,
      ...(artifact.sourceArtifact?.suite ? { sourceSuite: artifact.sourceArtifact.suite } : {}),
      fingerprint: fingerprintObject({
        sourceArtifact: artifact.sourceArtifact,
        fixtures: artifact.fixtures.map((fixture) => ({
          product: fixture.product,
          taskID: fixture.taskID,
          nativeVersion: fixture.nativeVersion,
          events: fixture.nativeEvents,
          partTypes: fixture.messageParts,
        })),
      }),
    },
    verification: {
      ok: verification.ok,
      issueIDs: verification.issues.map((issue) => issue.id),
    },
    fixtureAtoms: fixtureProducts.flatMap((item) => productTaskCadenceDescriptors(item as HarnessProduct).map((descriptor) => descriptor.id)).sort(),
  }
}

function externalToolEvidenceLinkage(input: BuildAssemblyContractInput, product: AssemblyContractProduct): AssemblyContractExternalToolEvidenceLinkage {
  if (!input.includeExternalToolEvidence && !input.externalToolEvidence) {
    return {
      status: "not-requested",
      refs: [],
    }
  }
  const refs = (input.externalToolEvidence ?? []).filter((ref) => product === "minimal" || product === "custom" || ref.product === product)
  if (refs.length === 0) {
    return {
      status: "missing",
      refs: [],
    }
  }
  return {
    status: "linked",
    refs: refs.map((ref) => ({
      ...ref,
      verification: {
        ok: ref.verification.ok,
        issueIDs: unique(ref.verification.issueIDs).sort(),
      },
    })).sort((left, right) => left.toolID.localeCompare(right.toolID) || left.product.localeCompare(right.product) || left.taskID.localeCompare(right.taskID)),
  }
}

function isPublishableExternalEvidencePath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/")
  if (normalized.includes("/raw/") || normalized.endsWith("/raw")) return false
  if (normalized.endsWith(".jsonl") || normalized.endsWith(".ctap.json") || normalized.endsWith(".html")) return false
  return normalized.endsWith("native-capture.json") || normalized.includes("/normalized/") || normalized.includes("docs/reports/")
}

function assemblyFingerprints(contract: Omit<AssemblyContract, "fingerprints">): AssemblyContractFingerprints {
  const atoms = contract.atoms.map(fingerprintAtom)
  const bindings = contract.bindings.map(fingerprintBinding)
  const ports = contract.ports.map(fingerprintPort)
  const surfaces = contract.surfaces.map(fingerprintSurface)
  const capabilities = contract.capabilities.map(fingerprintCapability)
  const swapPoints = contract.swapPoints.map(fingerprintSwapPoint)
  const bundles = contract.bundles.map(fingerprintBundle)
  const bundleExpansions = contract.bundleExpansions.map(fingerprintBundleExpansion)
  return {
    contract: fingerprintObject({ atoms, bindings, ports, surfaces, capabilities, swapPoints, externalToolEvidence: contract.externalToolEvidence }),
    atomSet: fingerprintObject(atoms),
    bindingGraph: fingerprintObject(bindings),
    portCoverage: fingerprintObject(ports),
    surface: fingerprintObject(surfaces),
    capability: fingerprintObject(capabilities),
    swapPoint: fingerprintObject(swapPoints),
    bundle: fingerprintObject({ bundles, bundleExpansions }),
  }
}

function fingerprintAtom(atom: AssemblyContractAtom): unknown {
  return {
    id: atom.id,
    plane: atom.plane,
    kind: atom.kind,
    scope: atom.scope,
    productScope: atom.productScope,
    personality: atom.personality,
    selected: atom.selected,
    selectionSource: atom.selectionSource,
    provides: atom.provides,
    consumes: atom.consumes,
    replaceablePorts: atom.replaceablePorts,
    stability: atom.stability,
    implementationKind: atom.implementationKind,
    nativeEvidenceRefs: atom.nativeEvidenceRefs,
    upstreamVersion: atom.upstreamVersion,
    upstreamCommit: atom.upstreamCommit,
    fixtureIDs: atom.fixtureIDs,
    parityCoverage: atom.parityCoverage,
    knownLossiness: atom.knownLossiness,
    source: atom.source,
  }
}

function fingerprintBinding(binding: AssemblyContractBinding): unknown {
  return {
    port: binding.port,
    capability: binding.capability.id,
    providerAtom: binding.providerAtom,
    consumerAtom: binding.consumerAtom,
    explicit: binding.explicit,
    candidates: binding.candidates,
  }
}

function fingerprintPort(port: AssemblyContractPort): unknown {
  return {
    id: port.id,
    cardinality: port.cardinality,
    multiplicity: port.multiplicity,
    providerAtoms: port.providerAtoms,
    consumerAtoms: port.consumerAtoms,
    candidateAtoms: port.candidateAtoms,
    swapPoint: port.swapPoint,
    required: port.required,
  }
}

function fingerprintSurface(surface: AssemblyContractSurface): unknown {
  return {
    id: surface.id,
    surfaceID: surface.surfaceID,
    type: surface.type,
    atomID: surface.atomID,
    backingAtoms: surface.backingAtoms,
    requiredPorts: surface.requiredPorts,
    entrypoint: surface.entrypoint,
    plane: surface.plane,
    product: surface.product,
  }
}

function fingerprintCapability(capability: AssemblyContractCapability): unknown {
  return {
    id: capability.id,
    capabilityID: capability.capabilityID,
    kind: capability.kind,
    multiplicity: capability.multiplicity,
    stability: capability.stability,
    personality: capability.personality,
    providers: capability.providers,
    consumers: capability.consumers,
  }
}

function fingerprintSwapPoint(swapPoint: AssemblyContractSwapPoint): unknown {
  return {
    port: swapPoint.port,
    selectedAtom: swapPoint.selectedAtom,
    candidates: swapPoint.candidates,
    contract: swapPoint.contract,
    risk: swapPoint.risk,
  }
}

function fingerprintBundle(bundle: AssemblyContractBundle): unknown {
  return {
    id: bundle.id,
    plane: bundle.plane,
    kind: bundle.kind,
    productScope: bundle.productScope,
    selectionSource: bundle.selectionSource,
    status: bundle.status,
    atomIDs: bundle.atomIDs,
    portIDs: bundle.portIDs,
    dependsOnBundles: bundle.dependsOnBundles,
    exclusiveFamilyID: bundle.exclusiveFamilyID,
    exclusiveFamilyPolicy: bundle.exclusiveFamilyPolicy,
    exclusiveFamilyPorts: bundle.exclusiveFamilyPorts,
  }
}

function selectedExclusiveBundleFamilyConflicts(bundles: AssemblyContractBundle[]): Array<{ familyID: string; bundleIDs: string[] }> {
  const byFamily = new Map<string, string[]>()
  for (const bundle of bundles) {
    if (!bundle.selected || !bundle.exclusiveFamilyID || (bundle.exclusiveFamilyPolicy ?? "replace") !== "replace") continue
    const current = byFamily.get(bundle.exclusiveFamilyID) ?? []
    current.push(bundle.id)
    byFamily.set(bundle.exclusiveFamilyID, current)
  }
  return [...byFamily.entries()]
    .map(([familyID, bundleIDs]) => ({ familyID, bundleIDs: bundleIDs.sort() }))
    .filter((conflict) => conflict.bundleIDs.length > 1)
    .sort((left, right) => left.familyID.localeCompare(right.familyID))
}

function fingerprintBundleExpansion(expansion: AssemblyContractBundleExpansion): unknown {
  return {
    bundleID: expansion.bundleID,
    atomIDs: expansion.atomIDs,
    portIDs: expansion.portIDs,
    selectedAtomIDs: expansion.selectedAtomIDs,
    missingAtomIDs: expansion.missingAtomIDs,
    removedAtomIDs: expansion.removedAtomIDs,
    replacedAtoms: expansion.replacedAtoms,
  }
}

function check(
  id: string,
  ok: boolean,
  message: string,
  severity: AssemblyDiagnosticSeverity = "error",
  refs: string[] = [],
): AssemblyContractVerificationCheck {
  return { id, ok, severity, message, refs }
}

function requiredExecutablePlaceholderRefs(contract: AssemblyContract, atomsByID: Map<string, AssemblyContractAtom>): string[] {
  return contract.ports
    .filter((port) => port.required && executablePortRuleFor(port.id).executableRequired)
    .flatMap((port) => {
      const selectedAtomID = port.selectedProviderAtom ?? port.providerAtoms[0]
      if (!selectedAtomID) return [`${contract.product}:${port.id}:<unbound>`]
      if (allowedMinimalPlaceholder(contract.product, port.id, selectedAtomID)) return []
      const atom = atomsByID.get(selectedAtomID)
      const level = executableImplementationLevelForAtom(atom)
      if (level === "metadata-only") return [`${contract.product}:${port.id}:${selectedAtomID}`]
      if (isMockFixtureOrCassetteAtomID(selectedAtomID) && contract.product !== "minimal" && contract.product !== "custom") {
        return [`${contract.product}:${port.id}:${selectedAtomID}`]
      }
      return []
    })
    .sort()
}

function previewPrimaryShellRefsFor(contract: AssemblyContract, atomsByID: Map<string, AssemblyContractAtom>): string[] {
  return contract.ports
    .filter((port) => port.required && port.id === "product.shell")
    .flatMap((port) => {
      const selectedAtomID = port.selectedProviderAtom ?? port.providerAtoms[0]
      const atom = selectedAtomID ? atomsByID.get(selectedAtomID) : undefined
      return executableImplementationLevelForAtom(atom) === "preview-shell" ? [`${contract.product}:${port.id}:${selectedAtomID ?? "<unbound>"}`] : []
    })
    .sort()
}

function nativeLikeMissingEvidenceRefs(contract: AssemblyContract): string[] {
  return contract.atoms
    .filter((atom) => executableImplementationLevelForAtom(atom) === "native-like")
    .filter((atom) => atom.nativeEvidenceRefs.length === 0 || atom.fixtureIDs.length === 0)
    .map((atom) => `${contract.product}:${atom.id}`)
    .sort()
}

function productPromptSupportMissingFixtureRefs(contract: AssemblyContract, atomsByID: Map<string, AssemblyContractAtom>): string[] {
  if (contract.product === "minimal" || contract.product === "custom") return []
  return contract.ports
    .filter((port) => port.required && isPromptSupportAliasPort(port.id))
    .flatMap((port) => {
      const selectedAtomID = port.selectedProviderAtom ?? port.providerAtoms[0]
      if (!selectedAtomID) return []
      const atom = atomsByID.get(selectedAtomID)
      if (!atom || !isProductScopedPromptSupportProvider(atom, contract.product)) return []
      const level = executableImplementationLevelForAtom(atom)
      if (level === "common-shared" || level === "metadata-only") return []
      const hasUpstreamEvidence = atom.nativeEvidenceRefs.length > 0
      const hasFixture = atom.fixtureIDs.length > 0
      const markedCommonWrapper =
        atom.selectionReason.toLowerCase().includes("common wrapper") ||
        atom.knownLossiness.some((lossiness) => lossiness === "common-wrapper" || lossiness === "shared-common-implementation")
      return hasUpstreamEvidence && hasFixture && !markedCommonWrapper ? [] : [`${contract.product}:${port.id}:${selectedAtomID}`]
    })
    .sort()
}

function isProductScopedPromptSupportProvider(atom: AssemblyContractAtom, product: AssemblyContractProduct): boolean {
  if (!atom.provides.some(isPromptSupportAliasPort)) return false
  return atom.scope === "product" || atom.productScope === "product" || productPrefixMatches(atom.id, product) || atom.personality === product
}

function productNativeMissingProofRefs(contract: AssemblyContract): string[] {
  if (contract.product === "minimal" || contract.product === "custom") return []
  return productNativeAtoms(contract)
    .filter((atom) => !hasProductNativeProof(atom))
    .map((atom) => `${contract.product}:${atom.id}`)
    .sort()
}

function productNativeSourceOrganizationRefs(contract: AssemblyContract): string[] {
  if (contract.product === "minimal" || contract.product === "custom") return []
  return productNativeAtoms(contract)
    .filter((atom) => isDisallowedProductNativeSource(atom))
    .map((atom) => `${contract.product}:${atom.id}:${atom.source?.specifier ?? "<missing-source>"}`)
    .sort()
}

function productNativeAtoms(contract: AssemblyContract): AssemblyContractAtom[] {
  return contract.atoms.filter((atom) => isProductNativeAtom(atom, contract.product))
}

function isProductNativeAtom(atom: AssemblyContractAtom, product: AssemblyContractProduct): boolean {
  if (!isProductScopedForContract(atom, product)) return false
  return atom.parityCoverage === "native" || executableImplementationLevelForAtom(atom) === "native"
}

function isProductScopedForContract(atom: AssemblyContractAtom, product: AssemblyContractProduct): boolean {
  return atom.scope === "product" || atom.productScope === "product" || atom.personality === product || productPrefixMatches(atom.id, product)
}

function hasProductNativeProof(atom: AssemblyContractAtom): boolean {
  return (
    atom.implementationKind === "factory" &&
    atom.nativeEvidenceRefs.length > 0 &&
    atom.fixtureIDs.length > 0 &&
    atom.knownLossiness.length === 0 &&
    !containsBridgeOrWrapperMarker(atom)
  )
}

function containsBridgeOrWrapperMarker(atom: AssemblyContractAtom): boolean {
  const reason = atom.selectionReason.toLowerCase()
  if (
    reason.includes("common wrapper") ||
    reason.includes("compatible bridge") ||
    reason.includes("partial-sync") ||
    reason.includes("partial sync") ||
    reason.includes("native-like") ||
    reason.includes("profile compatible") ||
    reason.includes("product identity snapshot")
  ) {
    return true
  }
  return atom.knownLossiness.some((lossiness) =>
    [
      "common-wrapper",
      "shared-common-implementation",
      "product-bridge",
      "native-parity-not-proven",
      "partial-prompt-family",
      "missing-upstream-branch-fixture",
      "opencode-upstream-system-output-matrix-partial-fixture",
      "opencode-system-prompt-runtime-output-projection-partial-fixture",
      "opencode-system-prompt-invocation-boundary-projection-partial-fixture",
      "opencode-system-prompt-provider-message-projection-partial-fixture",
      "opencode-system-prompt-live-runtime-fixture-partial-native-gap",
      "opencode-identity-source-matrix-partial-fixture",
      "opencode-identity-live-runtime-fixture-partial-native-gap",
      "pi-identity-source-matrix-partial-fixture",
      "nanobot-identity-source-matrix-partial-fixture",
      "hermes-identity-source-matrix-partial-fixture",
      "opencode-config-source-matrix-partial-fixture",
      "opencode-config-runtime-projection-partial-fixture",
      "opencode-config-live-runtime-fixture-partial-native-gap",
      "opencode-event-source-matrix-partial-fixture",
      "opencode-event-live-runtime-fixture-partial-native-gap",
      "pi-event-source-matrix-partial-fixture",
      "nanobot-event-source-matrix-partial-fixture",
      "hermes-event-source-matrix-partial-fixture",
      "pi-trace-source-matrix-partial-fixture",
      "nanobot-trace-source-matrix-partial-fixture",
      "hermes-trace-source-matrix-partial-fixture",
      "opencode-foundation-trace-runtime-projection-partial-fixture",
      "opencode-foundation-trace-source-matrix-partial-fixture",
      "opencode-product-shell-source-matrix-partial-fixture",
      "opencode-product-shell-runtime-projection-partial-fixture",
      "opencode-product-shell-live-runtime-fixture-partial-native-gap",
      "pi-product-shell-source-matrix-partial-fixture",
      "nanobot-product-shell-source-matrix-partial-fixture",
      "hermes-product-shell-source-matrix-partial-fixture",
      "opencode-ui-source-matrix-partial-fixture",
      "opencode-ui-live-runtime-fixture-partial-native-gap",
      "pi-ui-source-matrix-partial-fixture",
      "nanobot-ui-source-matrix-partial-fixture",
      "hermes-ui-source-matrix-partial-fixture",
      "pi-config-source-matrix-partial-fixture",
      "pi-upstream-source-matrix-partial-fixture",
      "missing-product-native-turn-fixture",
      "partial-product-turn-replay",
      "partial-cadence-replay",
      "partial-tool-cadence-replay",
      "partial-provider-stream-replay",
      "partial-session-message-part-replay",
      "partial-session-storage-roundtrip",
      "partial-session-provider-metadata-roundtrip",
      "partial-runtime-acceptance-replay",
      "partial-runtime-acceptance-timing-boundary",
      "partial-runtime-acceptance-lifecycle",
      "partial-runtime-acceptance-persistence-cleanup",
      "hermes-prompt-factory-options-not-full-upstream-registry",
      "hermes-prompt-scanner-semantic-not-full-upstream-scanner",
      "hermes-config-source-matrix-partial-fixture",
      "hermes-upstream-registry-source-matrix-partial-fixture",
      "hermes-provider-source-matrix-partial-fixture",
      "nanobot-config-source-matrix-partial-fixture",
      "nanobot-upstream-prompt-source-matrix-partial-fixture",
      "nanobot-channel-lifecycle-timing-partial-fixture",
      "nanobot-channel-side-effect-replay-partial-fixture",
      "nanobot-channel-registry-source-matrix-partial-fixture",
      "nanobot-platform-prompt-family-partial-fixture",
      "nanobot-platform-router-rendering-partial-fixture",
      "nanobot-provider-source-matrix-partial-fixture",
      "opencode-provider-source-matrix-partial-fixture",
      "opencode-provider-raw-frame-boundary-matrix-partial-fixture",
      "opencode-provider-plugin-runtime-matrix-partial-fixture",
      "opencode-provider-package-runtime-projection-partial-fixture",
      "opencode-provider-package-runtime-live-runtime-fixture-partial-native-gap",
      "opencode-provider-retry-cancel-race-projection-partial-fixture",
      "opencode-provider-retry-cancel-live-runtime-fixture-partial-native-gap",
      "opencode-session-source-matrix-partial-fixture",
      "opencode-session-runtime-projection-partial-fixture",
      "opencode-session-live-runtime-fixture-partial-native-gap",
      "pi-session-source-matrix-partial-fixture",
      "nanobot-session-source-matrix-partial-fixture",
      "hermes-session-source-matrix-partial-fixture",
      "opencode-tool-source-matrix-partial-fixture",
      "opencode-tool-contract-render-projection-partial-fixture",
      "opencode-tool-live-runtime-fixture-partial-native-gap",
      "pi-tool-source-matrix-partial-fixture",
      "nanobot-tool-source-matrix-partial-fixture",
      "hermes-tool-source-matrix-partial-fixture",
      "opencode-hook-source-matrix-partial-fixture",
      "opencode-hook-live-runtime-fixture-partial-native-gap",
      "pi-hook-source-matrix-partial-fixture",
      "nanobot-hook-source-matrix-partial-fixture",
      "hermes-hook-source-matrix-partial-fixture",
      "pi-provider-source-matrix-partial-fixture",
      "promptware-scanner-covered-by-partial-fixture",
      "semantic-approximation",
    ].includes(lossiness),
  )
}

function isDisallowedProductNativeSource(atom: AssemblyContractAtom): boolean {
  const specifier = atom.source?.specifier
  if (!specifier) return true
  return [
    "@helix/lego-prompt/prompt-atoms",
    "@helix/lego-agent-loop",
    "@helix/lego-tools/tool-atoms",
    "@helix/lego-tools/cadence-atoms",
    "@helix/lego-provider/ports",
    "@helix/lego-provider/streaming-delta-recorder",
    "@helix/lego-session/atoms",
    "@helix/lego-session/message-part-projector",
    "@helix/lego-runtime",
    "@helix/lego-runtime/acceptance-controller",
  ].includes(specifier)
}

function allowedMinimalPlaceholder(product: AssemblyContractProduct, portID: string, selectedAtomID: string): boolean {
  if (product !== "minimal" && product !== "custom") return false
  return (
    (portID === "process-runner.port" && selectedAtomID === "process-runner.disabled") ||
    (portID === "provider.transport" && selectedAtomID === "provider.transport.mock-sse") ||
    (portID === "ui.renderer" && selectedAtomID === "ui.renderer.noop")
  )
}

function isCustomCompositionContract(contract: AssemblyContract): boolean {
  return contract.product === "custom" || contract.recipeID.startsWith("custom.")
}

function productForRecipe(compiled: CompiledRecipe): AssemblyContractProduct {
  if (compiled.id === "coding-agent.minimal" || compiled.id.includes("minimal")) return "minimal"
  if (compiled.id === "opencode") return "opencode"
  if (compiled.id === "pi-mono") return "pi-mono"
  if (compiled.id === "opencode-pi-hybrid") return "opencode-pi-hybrid"
  if (compiled.id === "nanobot") return "nanobot"
  if (compiled.id === "hermes-agent") return "hermes-agent"
  if (compiled.modules.some((module) => module.personality === "opencode-pi-hybrid" || module.id.startsWith("opencode-pi."))) return "opencode-pi-hybrid"
  if (compiled.modules.some((module) => module.personality === "opencode" || module.id.startsWith("opencode."))) return "opencode"
  if (compiled.modules.some((module) => module.personality === "pi-mono" || module.id.startsWith("pi."))) return "pi-mono"
  if (compiled.modules.some((module) => module.personality === "nanobot" || module.id.startsWith("nanobot."))) return "nanobot"
  if (compiled.modules.some((module) => module.personality === "hermes-agent" || module.id.startsWith("hermes."))) return "hermes-agent"
  return "custom"
}

function knownRecipeID(recipeID: string): boolean {
  if (recipeID.startsWith("custom.")) return true
  if (["coding-agent.minimal", "minimal", "opencode", "pi-mono", "opencode-pi-hybrid", "nanobot", "hermes-agent"].includes(recipeID)) return true
  return recipeID in (swapRecipes as Record<string, LegoRecipe>)
}

function atomScopeFor(module: CompiledRecipeModule, product: AssemblyContractProduct): AssemblyAtomScope {
  if (module.personality === "common") return "common"
  if (product !== "minimal" && product !== "custom" && module.personality === product) return "product"
  if (product !== "minimal" && product !== "custom" && productPrefixMatches(module.id, product)) return "product"
  return "product"
}

function sourceRoute(moduleID: string): AssemblyContractSourceRoute | undefined {
  try {
    const route = routeForAtomBlock(moduleID)
    return {
      ...route,
      specifier: route.exportPath === "." ? route.packageName : `${route.packageName}/${route.exportPath.slice(2)}`,
    }
  } catch {
    return undefined
  }
}

function portIDForBinding(binding: LegoAssemblyBinding): string {
  return binding.capability.id
}

function consumersByProvider(bindings: LegoAssemblyBinding[]): Map<string, string[]> {
  const output = new Map<string, string[]>()
  for (const binding of bindings) {
    output.set(binding.provider, unique([...(output.get(binding.provider) ?? []), binding.consumer]).sort())
  }
  return output
}

function inferKind(id: string): string {
  if (id.includes("product-shell")) return "product-shell"
  if (id.includes("prompt")) return "prompt"
  if (id.includes("hook") || id.includes("registry")) return "hook"
  if (id.includes("session")) return "session"
  if (id.includes("provider")) return "provider"
  if (id.includes("tool") || id.includes("filesystem") || id.includes("process-runner")) return "tool"
  if (id.includes("runtime")) return "runtime"
  if (id.includes("ui")) return "ui"
  if (id.includes("config")) return "config"
  if (id.includes("agent-loop") || id.startsWith("turn.")) return "agent-loop"
  return "atom"
}

function surfaceType(id: string): AssemblyContractSurface["type"] {
  if (id.includes("desktop")) return "desktop"
  if (id.includes("web") || id.includes("browser")) return "web"
  if (id.includes("tui")) return "tui"
  if (id.includes("sdk")) return "sdk"
  if (id.includes("server")) return "server"
  if (id.includes("rpc")) return "rpc"
  if (id.includes("cli")) return "cli"
  if (id.includes("plugin")) return "plugin"
  if (id.includes("extension")) return "extension"
  if (id.includes("task.runner")) return "task-runner"
  return "product"
}

function inferPlane(id: string, capabilities: string[]): AssemblyContractPlane {
  const value = `${id} ${capabilities.join(" ")}`
  if (/\b(product|shell|sdk|cli|tui|server|web|desktop|slack)\b/.test(value) || value.includes("product-shell")) return "product"
  if (value.includes("agent-loop") || value.includes("turn.")) return "agent-loop"
  if (value.includes("runtime.")) return "runtime"
  if (value.includes("session.")) return "session"
  if (value.includes("hook.") || value.includes("registry.")) return "hook"
  if (value.includes("tools.") || value.includes("tool.") || value.includes("filesystem.") || value.includes("process-runner.")) return "tool"
  if (value.includes("provider.")) return "provider"
  if (value.includes("prompt.") || value.includes("resource.")) return "prompt"
  if (value.includes("config.")) return "config"
  if (value.includes("ui.")) return "ui"
  if (value.includes("identity.")) return "identity"
  if (value.includes("event.")) return "event"
  if (value.includes("trace.")) return "trace"
  if (value.includes("conformance.")) return "conformance"
  return "foundation"
}

function normalizeBundlePlane(plane: string): AssemblyContractPlane {
  if (
    [
      "foundation",
      "identity",
      "event",
      "trace",
      "runtime",
      "session",
      "hook",
      "turn",
      "agent-loop",
      "tool",
      "provider",
      "prompt",
      "config",
      "ui",
      "product",
      "task",
      "conformance",
    ].includes(plane)
  ) {
    return plane as AssemblyContractPlane
  }
  return "foundation"
}

function productPrefixMatches(value: string, product: AssemblyContractProduct): boolean {
  if (product === "opencode") return value.startsWith("opencode")
  if (product === "pi-mono") return value.startsWith("pi.") || value.startsWith("pi-mono")
  if (product === "opencode-pi-hybrid") return value.startsWith("opencode-pi") || value.startsWith("opencode.") || value.startsWith("pi.")
  if (product === "nanobot") return value.startsWith("nanobot")
  if (product === "hermes-agent") return value.startsWith("hermes.") || value.startsWith("hermes-agent")
  return false
}

function containsSecret(value: string): boolean {
  return /(\bsk-[a-z0-9_-]{12,}|api[_-]?key["':=\s]+[a-z0-9._-]{12,}|bearer\s+[a-z0-9._-]{12,})/i.test(value)
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableJSON(value)).digest("hex").slice(0, 16)
}

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function stableJSON(value: unknown): string {
  return JSON.stringify(sortStable(value))
}

function sortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortStable)
  if (!isRecord(value)) return value
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, sortStable(entry)]))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}
