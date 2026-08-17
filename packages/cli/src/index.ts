import { createHash } from "node:crypto"
import { pathToFileURL } from "node:url"
import { dirname, isAbsolute, relative, resolve, basename } from "node:path"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import process from "node:process"
import type { LegoMessage, LegoMessagePart, LegoProviderAdapter, LegoRecipe, LegoRecipeBinding } from "@helix/contracts"
import {
  createAnthropicProvider,
  createGoogleProvider,
  createOpenAICompatibleProvider,
  createOpenRouterProvider,
} from "@helix/lego-provider"
import {
  doctorExternalTool,
  createExternalToolCaptureDryRun,
  defaultExternalToolRunID,
  externalToolProductSupport,
  runExternalToolCapture,
  externalToolProfileSummary,
  importExternalToolArtifact,
  isExternalToolID,
  isExternalToolProduct,
  listExternalToolProfiles,
  nativeCadenceFixtureSetFromExternalCapture as projectExternalCaptureToNativeCadenceFixtureSet,
  verifyExternalToolRunManifest,
  verifyNativeCaptureArtifact,
  verifyNativeCaptureArtifactWithRunManifest,
  writeNativeCaptureArtifact,
  type ExternalToolArtifactManifest,
  type ExternalToolCaptureMode,
  type ExternalToolID,
  type ExternalToolProduct,
  type ExternalToolInvocationStrategy,
  type NativeCaptureArtifact,
  type ExternalToolRunManifest,
  type ExternalToolDoctorResult,
  type ExternalToolCaptureDryRunResult,
  type ExternalToolCaptureRunResult,
  type ExternalToolVerificationReport,
  type ExternalToolProfile,
} from "@helix/external-tools"
import {
  assembleOpenCodeHarness,
  assembleHermesAgentHarness,
  assembleNanobotHarness,
  assembleOpenCodePiHybridHarness,
  assemblePiMonoHarness,
  applyRecipeOverrides,
  compileRecipe,
  createLiveProviderArtifactWriter,
  createLiveProviderParityArtifact,
  createLiveProviderParitySplitArtifactSet,
  defaultHarnessProfileRoot,
  readLiveProviderParitySplitArtifactSet,
  HarnessGatewayController,
  HarnessProfileStore,
  runHarnessTui,
  codingAgentMinimalRecipe,
  diffRecipes,
  opencodeRecipe,
  opencodePiHybridRecipe,
  hermesAgentRecipe,
  nanobotRecipe,
  piMonoRecipe,
  parseRecipe,
  productCLIEventJSONLines,
  runHarnessDifferential,
  runLiveProviderParity,
  runProductTaskParitySuite,
  swapRecipes,
  verifyProductTaskParityArtifact,
  createProductTaskParitySplitArtifactSet,
  migrateProductTaskParityArtifact,
  readProductTaskParitySplitArtifactSet,
  writeProductTaskParitySplitArtifactSet,
  writeProductTaskParityArtifact,
  createProductTaskNativeCadenceFixtureSet,
  createProductTaskNativeCadenceFixtureSplitSet,
  diagnoseProductTaskCadenceArtifact,
  diffProductTaskParityArtifacts,
  verifyProductTaskNativeCadenceFixtureSet,
  replayProductTaskNativeCadenceFixture,
  writeProductTaskNativeCadenceFixtureSet,
  writeProductTaskNativeCadenceFixtureSplitSet,
  readProductTaskNativeCadenceFixtureSplitSet,
  writeProductTaskCadenceDiagnosisMarkdown,
  verifyLiveProviderParityArtifact,
  writeLiveProviderParitySplitArtifactSet,
  redactProfileSecrets,
  buildAssemblyContract,
  buildExecutablePlaceholderAudit,
  buildTodo27NativeRewriteInventory,
  buildTodo27OpenCodeSplitAcceptance,
  buildCurrentModulePlaceholderAudit,
  buildAssembledFlowBlueprint,
  buildAssembledFlowRun,
  buildHarnessFlowComparison,
  buildOriginalFlowFromNativeCadenceFixture,
  buildOriginalFlowFromTaskParityReport,
  buildOriginalFlowForProduct,
  compareHarnessFlows,
  auditNanobotLegoDepth,
  verifyHarnessFlowArtifact,
  verifyNanobotLegoDepthReport,
  writeNanobotLegoDepthReport,
  formatAssemblyContract,
  readAssemblyContract,
  verifyAssemblyContract,
  writeAssemblyContract,
  writeExecutablePlaceholderAuditReports,
  writeTodo27NativeRewriteInventoryReports,
  writeTodo27OpenCodeSplitAcceptanceReport,
  writeCurrentModulePlaceholderAuditReports,
  verifyExecutablePlaceholderAudit,
  verifyTodo27NativeRewriteInventory,
  verifyTodo27OpenCodeSplitAcceptance,
  verifyCurrentModulePlaceholderAudit,
  type AssembledHarness,
  type AssembleHarnessOptions,
  type AssemblyContract,
  type AssemblyContractExternalToolEvidenceRef,
  type AssemblyContractProduct,
  type AssemblyContractVerificationReport,
  type CompiledRecipe,
  type ExecutablePlaceholderAudit,
  type ExecutablePlaceholderAuditVerification,
  type Todo27NativeRewriteInventory,
  type Todo27NativeRewriteInventoryVerification,
  type Todo27OpenCodeSplitAcceptance,
  type Todo27OpenCodeSplitAcceptanceVerification,
  type CurrentModulePlaceholderAudit,
  type CurrentModulePlaceholderAuditVerification,
  type FixtureToolCall,
  type HarnessFlowComparison,
  type HarnessFlowGraph,
  type HarnessFlowRun,
  type LiveProviderKind,
  type OpenCodeDifferentialReport,
  type LiveProviderParityArtifactVerificationReport,
  type LiveProviderParityReport,
  type RecipeDiff,
  type ProductTaskParityArtifact,
  type ProductTaskParityMode,
  type ProductTaskParityProvider,
  type ProductTaskParityReport,
  type ProductTaskParityExternalCaptureInput,
  type ProductTaskParityArtifactVerificationReport,
  type ProductTaskCadenceDiagnosisArtifact,
  type ProductTaskNativeCadenceFixtureSet,
  type ProductTaskNativeCadenceFixtureSplitSet,
  type ProductTaskNativeCadenceFixture,
  type HarnessProduct as RecipesHarnessProduct,
  type InstalledProviderKind,
  type HarnessTuiProviderMode,
  type TelegramGatewayMode,
} from "@helix/recipes"

export type HarnessProduct = RecipesHarnessProduct
export type CliAssemblyProduct = HarnessProduct | "minimal"
type NativeHarnessProduct = Exclude<HarnessProduct, "opencode-pi-hybrid">
export type CliProviderKind = "openai-compatible" | "openrouter" | "anthropic" | "google"
export type CliFlowGraphMode = "blueprint" | "trace" | "native" | "compare"
export type CliFlowGraphReportKind = "blueprint" | "compare"

const externalCaptureConsentEnv = "HELIX_EXTERNAL_CAPTURE"
const externalCaptureAllowNoCredentialsEnv = "HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS"
const externalCaptureCredentialEnvNames = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "OPENROUTER_API_KEY",
  "AWS_ACCESS_KEY_ID",
  "AWS_PROFILE",
  "BEDROCK_API_KEY",
]
const defaultDotEnvDenyKeys = [externalCaptureConsentEnv, externalCaptureAllowNoCredentialsEnv]

export interface DotEnvLoadResult {
  path: string
  loaded: string[]
  skipped: string[]
}

export type CliProviderConfig = {
  kind: CliProviderKind
  modelID?: string
  apiKey?: string
  baseURL?: string
  appURL?: string
  appName?: string
}

export function loadDotEnv(input: { cwd?: string; env?: NodeJS.ProcessEnv; path?: string; denyKeys?: readonly string[] } = {}): DotEnvLoadResult | undefined {
  const env = input.env ?? process.env
  const path = input.path ?? resolve(input.cwd ?? process.cwd(), ".env")
  const denyKeys = new Set(input.denyKeys ?? defaultDotEnvDenyKeys)
  let text: string
  try {
    text = readFileSync(path, "utf8")
  } catch {
    return undefined
  }
  const loaded: string[] = []
  const skipped: string[] = []
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseDotEnvLine(line)
    if (!parsed) continue
    if (denyKeys.has(parsed.key)) {
      skipped.push(parsed.key)
      continue
    }
    if (env[parsed.key] !== undefined) {
      skipped.push(parsed.key)
      continue
    }
    env[parsed.key] = parsed.value
    loaded.push(parsed.key)
  }
  return { path, loaded, skipped }
}

export type ParsedCliArgs =
  | { command: "help" }
  | {
      command: "external-tools-list"
      json: boolean
    }
  | {
      command: "external-tools-doctor"
      toolID?: ExternalToolID
      toolPath?: string
      strategy?: ExternalToolInvocationStrategy
      requireTool: boolean
      json: boolean
    }
  | {
      command: "external-tools-capture"
      toolID: ExternalToolID
      product?: ExternalToolProduct
      taskID?: string
      outDir?: string
      toolPath?: string
      strategy?: ExternalToolInvocationStrategy
      dryRun: boolean
      captureMode: "real-capture" | "capture-only"
      requireTool: boolean
      toolArgs: string[]
      json: boolean
    }
  | {
      command: "external-tools-import"
      toolID: ExternalToolID
      artifactPath: string
      product: ExternalToolProduct
      taskID?: string
      out?: string
      outDir?: string
      publishReport: boolean
      json: boolean
    }
  | {
      command: "external-tools-verify"
      artifactPath: string
      runManifestPath?: string
      json: boolean
    }
  | {
      command: "external-tools-verify-run-manifest"
      manifestPath: string
      product?: ExternalToolProduct
      taskID?: string
      captureMode?: ExternalToolCaptureMode
      expectedInvocationStrategy?: ExternalToolInvocationStrategy
      expectedInvocationCommand?: string
      expectedInvocationArgs?: string[]
      allowUnknownToolVersion: boolean
      allowEmptyArtifacts: boolean
      requiredArtifactRoles: Array<{ path: string; role: ExternalToolArtifactManifest["role"] }>
      json: boolean
    }
  | {
      command: "external-tools-to-native-cadence"
      artifactPath: string
      out?: string
      json: boolean
    }
  | {
      command: "recipe-inspect" | "recipe-graph" | "recipe-validate"
      recipeID: string
      json: boolean
    }
  | {
      command: "recipe-validate-file" | "recipe-graph-file"
      recipeFilePath: string
      json: boolean
    }
  | {
      command: "recipe-diff"
      leftRecipeID: string
      rightRecipeID: string
      json: boolean
    }
  | {
      command: "recipe-compose"
      recipeID: string
      overrides: LegoRecipeBinding[]
      json: boolean
    }
  | {
      command: "assemble"
      products?: CliAssemblyProduct[]
      recipeID?: string
      recipeFilePath?: string
      explain: boolean
      json: boolean
      out?: string
      outDir?: string
      taskParityArtifactPath?: string
      nativeFixturePath?: string
      externalCapturePaths: string[]
      externalRunManifestPath?: string
      requireTaskParity: boolean
      requireNativeFixtures: boolean
      requireExternalToolEvidence: boolean
      strict: boolean
    }
  | {
      command: "verify-assembly-contract"
      artifactPath: string
      json: boolean
      requireTaskParity: boolean
      requireNativeFixtures: boolean
      requireExternalToolEvidence: boolean
    }
  | {
      command: "flow-graph"
      product?: CliAssemblyProduct
      recipeFilePath?: string
      mode: CliFlowGraphMode
      taskID?: string
      artifactPath?: string
      out?: string
      json: boolean
    }
  | {
      command: "flow-graph-reports"
      products: CliAssemblyProduct[]
      taskID: string
      outDir: string
      json: boolean
    }
  | {
      command: "verify-flow-graph"
      artifactPath: string
      json: boolean
    }
  | {
      command: "executable-placeholder-audit"
      products?: CliAssemblyProduct[]
      out?: string
      markdown?: string
      json: boolean
    }
  | {
      command: "verify-executable-placeholder-audit"
      artifactPath: string
      json: boolean
    }
  | {
      command: "todo27-native-rewrite-inventory"
      products?: CliAssemblyProduct[]
      out?: string
      markdown?: string
      json: boolean
    }
  | {
      command: "verify-todo27-native-rewrite-inventory"
      artifactPath: string
      json: boolean
    }
  | {
      command: "todo27-opencode-split-acceptance"
      out?: string
      markdown?: string
      json: boolean
    }
  | {
      command: "verify-todo27-opencode-split-acceptance"
      artifactPath: string
      json: boolean
    }
  | {
      command: "current-module-placeholder-audit"
      products?: CliAssemblyProduct[]
      out?: string
      markdown?: string
      json: boolean
    }
  | {
      command: "verify-current-module-placeholder-audit"
      artifactPath: string
      json: boolean
    }
  | {
      command: "verify-live-provider-parity"
      artifactPath: string
      provider?: LiveProviderKind
      modelID?: string
      products?: HarnessProduct[]
      maxAgeMs?: number
      json: boolean
    }
  | {
      command: "live-provider-migrate-artifact"
      artifactPath: string
      outDir: string
      summaryOut?: string
      json: boolean
    }
  | {
      command: "task-parity"
      suite?: string
      taskIDs?: string[]
      products?: HarnessProduct[]
      modes?: ProductTaskParityMode[]
      recipeFilePath?: string
      provider?: ProductTaskParityProvider
      out?: string
      nativeOriginal?: boolean
      requireCredentials?: boolean
      modelID?: string
      apiKey?: string
      baseURL?: string
      packageSpec?: string
      timeoutMs?: number
      externalCapturePath?: string
      artifactFormat?: "legacy" | "split"
      json: boolean
      outDir?: string
      summaryOut?: string
    }
  | {
      command: "task-parity-migrate-artifact"
      artifactPath: string
      outDir: string
      summaryOut?: string
      json: boolean
    }
  | {
      command: "verify-task-parity"
      artifactPath: string
      products?: HarnessProduct[]
      modes?: ProductTaskParityMode[]
      taskIDs?: string[]
      json: boolean
    }
  | {
      command: "task-parity-diff"
      artifactA: string
      artifactB: string
      json: boolean
    }
  | {
      command: "task-parity-cadence-diagnose"
      artifactPath: string
      out?: string
      json: boolean
    }
  | {
      command: "task-parity-native-cadence-fixtures"
      artifactPath: string
      out?: string
      artifactFormat?: "legacy" | "split"
      outDir?: string
      summaryOut?: string
      json: boolean
    }
  | {
      command: "task-parity-replay-native-cadence"
      fixturePath: string
      out?: string
      json: boolean
    }
  | {
      command: "harness-differential"
      product: HarnessProduct
      prompt?: string
      assistantText?: string
      nativeOriginal?: boolean
      modelID?: string
      apiKey?: string
      baseURL?: string
      packageSpec?: string
      timeoutMs?: number
      json: boolean
    }
  | {
      command: "nanobot-lego-depth"
      out?: string
      markdown?: string
      json: boolean
    }
  | {
      command: "live-provider-parity"
      provider?: LiveProviderKind
      modelID?: string
      apiKey?: string
      baseURL?: string
      appURL?: string
      appName?: string
      prompt?: string
      products?: HarnessProduct[]
      json: boolean
      out?: string
      artifactFormat?: "legacy" | "split"
      outDir?: string
      summaryOut?: string
      cwd?: string
      maxSteps?: number
      maxRetries?: number
      maxOutputTokens?: number
      requireCredentials?: boolean
    }
  | {
      command: "tui"
      recipeFilePath?: string
      profileName?: string
      rootDir?: string
      providerMode: HarnessTuiProviderMode
      text?: string
      cwd?: string
      storageDir?: string
      json: boolean
    }
  | {
      command: "profile-install"
      name: string
      recipeFilePath: string
      rootDir?: string
      workspaceDir?: string
      storageDir?: string
      json: boolean
    }
  | {
      command: "profile-list"
      rootDir?: string
      json: boolean
    }
  | {
      command: "profile-status"
      name: string
      rootDir?: string
      json: boolean
    }
  | {
      command: "profile-remove"
      name: string
      rootDir?: string
      purge: boolean
      json: boolean
    }
  | {
      command: "profile-configure-provider"
      name: string
      rootDir?: string
      provider: InstalledProviderKind
      modelID?: string
      baseURL?: string
      appURL?: string
      appName?: string
      apiKeyEnv?: string
      json: boolean
    }
  | {
      command: "channel-add-telegram"
      name: string
      rootDir?: string
      mode?: TelegramGatewayMode
      botTokenEnv?: string
      allowedChatIDs?: string[]
      allowedUserIDs?: string[]
      webhookURL?: string
      webhookSecretEnv?: string
      json: boolean
    }
  | {
      command: "channel-status-telegram" | "channel-remove-telegram"
      name: string
      rootDir?: string
      json: boolean
    }
  | {
      command: "gateway-start" | "gateway-stop" | "gateway-restart" | "gateway-status" | "gateway-logs" | "gateway-manifests"
      name: string
      rootDir?: string
      channel: "telegram"
      lines?: number
      json: boolean
    }
  | {
      command: "gateway-smoke" | "gateway-smoke-local"
      name: string
      rootDir?: string
      channel: "telegram"
      text: string
      chatID?: string
      senderID?: string
      live: boolean
      json: boolean
    }
  | {
      command: "gateway-worker"
      name: string
      rootDir?: string
      channel: "telegram"
      once: boolean
      json: boolean
    }
  | {
      command: "run"
      product: HarnessProduct
      provider: CliProviderConfig
      prompt: string
      json: boolean
      nativeJsonEvents?: boolean
      maxSteps?: number
      maxRetries?: number
      syntheticContinue?: boolean
      maxSyntheticContinues?: number
      cwd?: string
      storageDir?: string
    }

export interface CliIO {
  stdout: Pick<NodeJS.WriteStream, "write">
  stderr: Pick<NodeJS.WriteStream, "write">
}

class CliUsageError extends Error {
  readonly exitCode = 2
}

export function parseArgs(argv: string[]): ParsedCliArgs {
  if (argv.length === 0 || argv[0] === "help" || argv[0] === "--help" || argv[0] === "-h") {
    return { command: "help" }
  }
  if (argv[0] === "external-tools" || argv[0] === "external-tool") return parseExternalToolsArgs(argv, 1)
  if (argv[0] === "live-provider-parity" || (argv[0] === "parity" && argv[1] === "live-provider")) {
    if (argv[0] === "live-provider-parity" && argv[1] === "migrate-artifact") return parseLiveProviderMigrateArtifactArgs(argv, 2)
    if (argv[0] === "parity" && argv[2] === "migrate-artifact") return parseLiveProviderMigrateArtifactArgs(argv, 3)
    return parseLiveProviderParityArgs(argv, argv[0] === "parity" ? 2 : 1)
  }
  if (argv[0] === "verify-live-provider-parity" || (argv[0] === "parity" && argv[1] === "verify-live-provider")) {
    return parseVerifyLiveProviderParityArgs(argv, argv[0] === "parity" ? 2 : 1)
  }
  if (argv[0] === "profile") return parseProfileArgs(argv, 1)
  if (argv[0] === "channel") return parseChannelArgs(argv, 1)
  if (argv[0] === "gateway") return parseGatewayArgs(argv, 1)
  if (argv[0] === "tui") return parseTuiArgs(argv, 1)
  if (argv[0] === "task-parity") {
    if (argv[1] === "diff") return parseTaskParityDiffArgs(argv, 2)
    if (argv[1] === "migrate-artifact") return parseTaskParityMigrateArtifactArgs(argv, 2)
    if (argv[1] === "cadence-diagnose" || argv[1] === "diagnose-cadence") return parseTaskParityCadenceDiagnoseArgs(argv, 2)
    if (argv[1] === "native-cadence-fixtures") return parseTaskParityNativeCadenceFixtureArgs(argv, 2)
    if (argv[1] === "replay-native-cadence") return parseTaskParityReplayNativeCadenceArgs(argv, 2)
    return parseTaskParityArgs(argv, 1)
  }
  if (argv[0] === "task-parity-cadence-diagnose") return parseTaskParityCadenceDiagnoseArgs(argv, 1)
  if (argv[0] === "task-parity-native-cadence-fixtures") return parseTaskParityNativeCadenceFixtureArgs(argv, 1)
  if (argv[0] === "task-parity-replay-native-cadence") return parseTaskParityReplayNativeCadenceArgs(argv, 1)
  if (argv[0] === "verify-task-parity") return parseVerifyTaskParityArgs(argv, 1)
  if (argv[0] === "assemble") return parseAssemblyArgs(argv, 1)
  if (argv[0] === "verify-assembly-contract") return parseVerifyAssemblyContractArgs(argv, 1)
  if (argv[0] === "flow-graph" && argv[1] === "reports") return parseFlowGraphReportsArgs(argv, 2)
  if (argv[0] === "flow-graph") return parseFlowGraphArgs(argv, 1)
  if (argv[0] === "verify-flow-graph") return parseVerifyFlowGraphArgs(argv, 1)
  if (argv[0] === "executable-placeholder-audit" || (argv[0] === "audit" && argv[1] === "executable-placeholders")) {
    return parseExecutablePlaceholderAuditArgs(argv, argv[0] === "audit" ? 2 : 1)
  }
  if (argv[0] === "verify-executable-placeholder-audit" || (argv[0] === "verify" && argv[1] === "executable-placeholder-audit")) {
    return parseVerifyExecutablePlaceholderAuditArgs(argv, argv[0] === "verify" ? 2 : 1)
  }
  if (argv[0] === "todo27-native-rewrite-inventory" || (argv[0] === "audit" && argv[1] === "todo27-native-rewrite")) {
    return parseTodo27NativeRewriteInventoryArgs(argv, argv[0] === "audit" ? 2 : 1)
  }
  if (argv[0] === "verify-todo27-native-rewrite-inventory" || (argv[0] === "verify" && argv[1] === "todo27-native-rewrite-inventory")) {
    return parseVerifyTodo27NativeRewriteInventoryArgs(argv, argv[0] === "verify" ? 2 : 1)
  }
  if (argv[0] === "todo27-opencode-split-acceptance" || (argv[0] === "todo27" && argv[1] === "opencode-split-acceptance")) {
    return parseTodo27OpenCodeSplitAcceptanceArgs(argv, argv[0] === "todo27" ? 2 : 1)
  }
  if (argv[0] === "verify-todo27-opencode-split-acceptance" || (argv[0] === "verify" && argv[1] === "todo27-opencode-split-acceptance")) {
    return parseVerifyTodo27OpenCodeSplitAcceptanceArgs(argv, argv[0] === "verify" ? 2 : 1)
  }
  if (argv[0] === "current-module-placeholder-audit" || (argv[0] === "audit" && argv[1] === "current-modules")) {
    return parseCurrentModulePlaceholderAuditArgs(argv, argv[0] === "audit" ? 2 : 1)
  }
  if (argv[0] === "verify-current-module-placeholder-audit" || (argv[0] === "verify" && argv[1] === "current-module-placeholder-audit")) {
    return parseVerifyCurrentModulePlaceholderAuditArgs(argv, argv[0] === "verify" ? 2 : 1)
  }
  if (argv[0] === "opencode-differential" || (argv[0] === "differential" && argv[1] === "opencode")) {
    return parseHarnessDifferentialArgs("opencode", argv, argv[0] === "differential" ? 2 : 1)
  }
  if (argv[0] === "differential" && (argv[1] === "pi-mono" || argv[1] === "pi" || argv[1] === "nanobot" || argv[1] === "hermes-agent" || argv[1] === "hermes")) {
    return parseHarnessDifferentialArgs(parseProduct(argv[1]), argv, 2)
  }
  if (argv[0] === "nanobot" && (argv[1] === "lego-depth" || argv[1] === "depth")) return parseNanobotLegoDepthArgs(argv, 2)
  if (argv[0] === "inspect" && argv[1] === "recipe") return parseRecipeSingleArgs("recipe-inspect", argv, 2)
  if (argv[0] === "graph" && argv[1] === "recipe-file") return parseRecipeFileArgs("recipe-graph-file", argv, 2)
  if (argv[0] === "graph" && argv[1] === "recipe") return parseRecipeSingleArgs("recipe-graph", argv, 2)
  if (argv[0] === "validate" && argv[1] === "recipe") return parseRecipeSingleArgs("recipe-validate", argv, 2)
  if (argv[0] === "validate" && (argv[1] === "recipe-file" || argv[1] === "builder-recipe")) return parseRecipeFileArgs("recipe-validate-file", argv, 2)
  if (argv[0] === "diff" && argv[1] === "recipe") return parseRecipeDiffArgs(argv, 2)
  if (argv[0] === "compose") return parseRecipeComposeArgs(argv, 1)
  if (argv[0] === "recipe") {
    const action = argv[1]
    if (action === "inspect") return parseRecipeSingleArgs("recipe-inspect", argv, 2)
    if (action === "graph") return parseRecipeSingleArgs("recipe-graph", argv, 2)
    if (action === "graph-file") return parseRecipeFileArgs("recipe-graph-file", argv, 2)
    if (action === "validate") return parseRecipeSingleArgs("recipe-validate", argv, 2)
    if (action === "validate-file") return parseRecipeFileArgs("recipe-validate-file", argv, 2)
    if (action === "diff") return parseRecipeDiffArgs(argv, 2)
    if (action === "compose") return parseRecipeComposeArgs(argv, 2)
    throw new CliUsageError(`Unknown recipe command: ${action ?? "<missing>"}`)
  }
  if (argv[0] !== "run") throw new CliUsageError(`Unknown command: ${argv[0]}`)

  const product = parseProduct(argv[1])
  let prompt = "hello from helix"
  let json = false
  let nativeJsonEvents: boolean | undefined
  let providerKind: CliProviderKind | undefined
  let modelID: string | undefined
  let apiKey: string | undefined
  let baseURL: string | undefined
  let appURL: string | undefined
  let appName: string | undefined
  let maxSteps: number | undefined
  let maxRetries: number | undefined
  let syntheticContinue: boolean | undefined
  let maxSyntheticContinues: number | undefined
  let cwd: string | undefined
  let storageDir: string | undefined

  for (let index = 2; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--native-json-events") {
      nativeJsonEvents = true
      continue
    }
    if (arg === "--fake-provider") {
      throw new CliUsageError("--fake-provider is no longer supported; configure a real provider/model/API key.")
    }
    if (arg === "--provider") {
      providerKind = parseProviderKind(readValue(argv, ++index, "--provider"))
      continue
    }
    if (arg === "--model") {
      modelID = readValue(argv, ++index, "--model")
      continue
    }
    if (arg === "--api-key") {
      apiKey = readValue(argv, ++index, "--api-key")
      continue
    }
    if (arg === "--base-url") {
      baseURL = readValue(argv, ++index, "--base-url")
      continue
    }
    if (arg === "--app-url") {
      appURL = readValue(argv, ++index, "--app-url")
      continue
    }
    if (arg === "--app-name") {
      appName = readValue(argv, ++index, "--app-name")
      continue
    }
    if (arg === "--prompt") {
      prompt = readValue(argv, ++index, "--prompt")
      continue
    }
    if (arg === "--assistant") {
      throw new CliUsageError("--assistant is only available in internal fixture turns; top-level run requires a real provider.")
    }
    if (arg === "--max-steps") {
      maxSteps = parsePositiveInt(readValue(argv, ++index, "--max-steps"), "--max-steps")
      continue
    }
    if (arg === "--max-retries") {
      maxRetries = parseNonNegativeInt(readValue(argv, ++index, "--max-retries"), "--max-retries")
      continue
    }
    if (arg === "--synthetic-continue") {
      syntheticContinue = true
      continue
    }
    if (arg === "--max-synthetic-continues") {
      maxSyntheticContinues = parseNonNegativeInt(readValue(argv, ++index, "--max-synthetic-continues"), "--max-synthetic-continues")
      continue
    }
    if (arg === "--tool") {
      throw new CliUsageError("--tool is only available in internal fixture turns; top-level run requires a real provider.")
    }
    if (arg === "--cwd") {
      cwd = resolve(readValue(argv, ++index, "--cwd"))
      continue
    }
    if (arg === "--storage-dir") {
      storageDir = resolve(readValue(argv, ++index, "--storage-dir"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!providerKind) throw new CliUsageError("run requires --provider <openai-compatible|openrouter|anthropic|google>; fake provider is no longer supported.")

  return {
    command: "run",
    product,
    provider: providerConfig({
      kind: providerKind,
      ...(modelID ? { modelID } : {}),
      ...(apiKey ? { apiKey } : {}),
      ...(baseURL ? { baseURL } : {}),
      ...(appURL ? { appURL } : {}),
      ...(appName ? { appName } : {}),
    }),
    prompt,
    json,
    ...(nativeJsonEvents === undefined ? {} : { nativeJsonEvents }),
    ...(maxSteps ? { maxSteps } : {}),
    ...(maxRetries === undefined ? {} : { maxRetries }),
    ...(syntheticContinue === undefined ? {} : { syntheticContinue }),
    ...(maxSyntheticContinues === undefined ? {} : { maxSyntheticContinues }),
    ...(cwd ? { cwd } : {}),
    ...(storageDir ? { storageDir } : {}),
  }
}

function parseDotEnvLine(line: string): { key: string; value: string } | undefined {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) return undefined
  const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed)
  if (!match) return undefined
  const key = match[1] ?? ""
  let value = match[2] ?? ""
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1)
  } else {
    const commentIndex = value.search(/\s+#/)
    if (commentIndex >= 0) value = value.slice(0, commentIndex)
    value = value.trim()
  }
  return { key, value: value.replace(/\\n/g, "\n") }
}

function todoHasUncheckedItems(path: string): boolean {
  if (!existsSync(path)) return false
  return /^- \[ \]/m.test(readFileSync(path, "utf8"))
}

function assemblyContractTargets(parsed: Extract<ParsedCliArgs, { command: "assemble" }>): Array<{ product?: CliAssemblyProduct; recipeID?: string; recipeFilePath?: string }> {
  if (parsed.recipeFilePath) return [{ recipeFilePath: parsed.recipeFilePath }]
  if (parsed.products && parsed.products.length > 0) return parsed.products.map((product) => ({ product }))
  if (parsed.recipeID) return [{ recipeID: parsed.recipeID }]
  throw new CliUsageError("assemble requires --product <product>, --recipe <id>, or --recipe-file <path>")
}

function readOptionalTaskParityArtifact(path?: string): ProductTaskParityArtifact | undefined {
  const resolved = path ?? defaultExistingArtifact(["docs/reports/task-parity-cadence.json", "docs/reports/task-parity.json"])
  if (!resolved || !existsSync(resolved)) return undefined
  return JSON.parse(readFileSync(resolved, "utf8")) as ProductTaskParityArtifact
}

function readOptionalNativeFixtureSet(path?: string): ProductTaskNativeCadenceFixtureSet | undefined {
  const resolved = path ?? defaultExistingArtifact(["docs/reports/task-parity-native-cadence-fixtures/summary.json", "docs/reports/task-parity-native-cadence-fixtures-summary.json"])
  if (!resolved || !existsSync(resolved)) return undefined
  return JSON.parse(readFileSync(resolved, "utf8")) as ProductTaskNativeCadenceFixtureSet
}

function readExternalToolEvidenceRefs(paths: string[], manifestPath?: string): AssemblyContractExternalToolEvidenceRef[] {
  if (paths.length === 0) return []
  const manifest = manifestPath && existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) as ExternalToolRunManifest : undefined
  const manifestHash = manifestPath && existsSync(manifestPath) ? sha256File(manifestPath) : undefined
  return paths.map((path) => {
    const capture = JSON.parse(readFileSync(path, "utf8")) as NativeCaptureArtifact
    const verification = verifyNativeCaptureArtifact(capture)
    const sourceArtifactHashMatched = manifest ? manifest.artifacts.some((artifact) => artifact.hash === capture.sourceArtifact.hash) : undefined
    const refWithoutFingerprint = {
      kind: "externalTool" as const,
      toolID: capture.sourceTool,
      toolVersion: capture.sourceToolVersion,
      product: capture.product,
      taskID: capture.taskID,
      captureMode: capture.captureMode,
      artifactPath: path,
      generatedAt: capture.generatedAt,
      sourceArtifact: capture.sourceArtifact,
      lossiness: capture.lossiness,
      redactionPolicy: {
        version: capture.redactionPolicy.version,
        containsRawPrompt: capture.redactionPolicy.containsRawPrompt,
      },
      verification: {
        ok: verification.ok,
        issueIDs: verification.issues.map((issue) => issue.id).sort(),
      },
      ...(manifestHash ? { manifest: { hash: manifestHash, sourceArtifactHashMatched: Boolean(sourceArtifactHashMatched) } } : {}),
    }
    return {
      ...refWithoutFingerprint,
      fingerprint: sha256Text(stableJSONStringify(refWithoutFingerprint)),
    }
  })
}

function readExternalCaptureForTaskParity(
  path: string,
  products: HarnessProduct[] | undefined,
  taskIDs: string[] | undefined,
  modes: ProductTaskParityMode[] | undefined,
): ProductTaskParityExternalCaptureInput {
  const capture = JSON.parse(readFileSync(path, "utf8")) as NativeCaptureArtifact
  const verification = verifyNativeCaptureArtifact(capture)
  if (!verification.ok) {
    throw new CliUsageError(`External capture artifact failed verification: ${verification.issues.map((issue) => `${issue.id} ${issue.message}`).join("; ")}`)
  }
  if (capture.captureMode === "capture-only" || capture.captureMode === "dry-run") {
    throw new CliUsageError("task-parity --external-capture refuses capture-only or dry-run artifacts because they cannot serve as original task reference evidence.")
  }
  if (modes && modes.length > 0 && !modes.includes("original")) {
    throw new CliUsageError("task-parity --external-capture requires --mode original or assembled,original.")
  }
  const product = externalCaptureHarnessProduct(capture.product)
  if (products && (products.length !== 1 || products[0] !== product)) {
    throw new CliUsageError(`External capture artifact ${path} is for product ${product}; task-parity --external-capture supports one matching product.`)
  }
  if (taskIDs && (taskIDs.length !== 1 || taskIDs[0] !== capture.taskID)) {
    throw new CliUsageError(`External capture artifact ${path} is for task ${capture.taskID}; task-parity --external-capture supports one matching task.`)
  }
  return {
    artifactPath: path,
    generatedAt: capture.generatedAt,
    sourceTool: capture.sourceTool,
    sourceToolVersion: capture.sourceToolVersion,
    sourceArtifact: capture.sourceArtifact,
    product,
    taskID: capture.taskID,
    captureMode: capture.captureMode,
    lossiness: capture.lossiness,
    providerRequests: capture.providerRequests.map((request) => ({
      requestID: request.requestID,
      modelID: request.modelID,
      status: request.status,
      durationMs: request.durationMs,
    })),
    promptEvidence: capture.promptEvidence.map((prompt) => ({
      requestID: prompt.requestID,
      messageCount: prompt.messageCount,
      toolNames: prompt.toolNames,
    })),
    toolEvidence: capture.toolEvidence.map((tool) => ({
      requestID: tool.requestID,
      source: tool.source,
      toolName: tool.toolName,
      ...(tool.argumentFingerprint ? { argumentFingerprint: tool.argumentFingerprint } : {}),
      order: tool.order,
    })),
    streamEvidence: capture.streamEvidence.map((stream) => ({
      requestID: stream.requestID,
      eventCount: stream.eventCount,
      ...(stream.finishReason ? { finishReason: stream.finishReason } : {}),
    })),
    stageEvidence: capture.stageEvidence.map((stage) => ({
      stage: stage.stage,
      observability: stage.observability,
      evidenceCount: stage.evidenceCount,
    })),
    summary: capture.summary,
  }
}

function verifyExternalToolArtifactWithOptionalRunManifest(value: unknown, artifactPath: string, runManifestPath?: string): ExternalToolVerificationReport {
  if (!runManifestPath) return verifyNativeCaptureArtifact(value)
  let manifest: unknown
  try {
    manifest = JSON.parse(readFileSync(runManifestPath, "utf8")) as unknown
  } catch (error) {
    const artifactVerification = verifyNativeCaptureArtifact(value)
    return {
      ok: false,
      checks: [
        ...artifactVerification.checks,
        { id: "run-manifest.parse", ok: false, message: `run manifest parses as JSON: ${error instanceof Error ? error.message : String(error)}` },
      ],
      issues: [
        ...artifactVerification.issues,
        { id: "run-manifest.parse", ok: false, message: `run manifest parses as JSON: ${error instanceof Error ? error.message : String(error)}` },
      ],
    }
  }
  return verifyNativeCaptureArtifactWithRunManifest(value, manifest, {
    artifactPath,
    runManifestPath,
  })
}

function defaultExistingArtifact(paths: string[]): string | undefined {
  return paths.map((path) => resolve(path)).find((path) => existsSync(path))
}

function sha256File(path: string): string {
  return sha256Text(readFileSync(path))
}

function sha256Text(text: string | Buffer): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`
}

function stableJSONStringify(value: unknown): string {
  return JSON.stringify(sortJSON(value))
}

function sortJSON(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJSON)
  if (!value || typeof value !== "object") return value
  const record = value as Record<string, unknown>
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, sortJSON(record[key])]))
}

function basenameWithoutJSON(path: string): string {
  const name = basename(path)
  return name.endsWith(".json") ? name.slice(0, -5) : name
}

function filenameSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "default"
}

function isTaskParitySummaryArtifactFile(value: unknown, path: string): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { schemaVersion?: unknown; artifactKind?: unknown }).schemaVersion === 2 &&
      (value as { artifactKind?: unknown }).artifactKind === "task-parity-summary" &&
      existsSync(resolve(dirname(path), String((value as { manifestPath?: unknown }).manifestPath ?? "manifest.json"))),
  )
}

function isNativeCadenceFixtureSummaryFile(value: unknown, path: string): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { schemaVersion?: unknown; artifactKind?: unknown }).schemaVersion === 2 &&
      (value as { artifactKind?: unknown }).artifactKind === "native-cadence-fixture-summary" &&
      existsSync(resolve(dirname(path), String((value as { manifestPath?: unknown }).manifestPath ?? "manifest.json"))),
  )
}

function isLiveProviderSummaryArtifactFile(value: unknown, path: string): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { schemaVersion?: unknown; artifactKind?: unknown }).schemaVersion === 2 &&
      (value as { artifactKind?: unknown }).artifactKind === "live-provider-parity-summary" &&
      existsSync(resolve(dirname(path), String((value as { manifestPath?: unknown }).manifestPath ?? "manifest.json"))),
  )
}

function artifactProductID(product: AssemblyContractProduct): string {
  return product === "pi-mono" ? "pi-mono" : product
}

interface FlowGraphReportArtifactSummary {
  kind: CliFlowGraphReportKind
  product: CliAssemblyProduct
  taskID?: string
  path: string
  fingerprint: string
  verification: ReturnType<typeof verifyHarnessFlowArtifact>
}

interface FlowGraphReportsOutput {
  schemaVersion: 1
  generatedAt: string
  outDir: string
  taskID: string
  products: CliAssemblyProduct[]
  artifacts: FlowGraphReportArtifactSummary[]
  summary: {
    ok: boolean
    artifacts: number
    graphs: number
    comparisons: number
    stages: number
  }
}

function createFlowGraphArtifact(parsed: Extract<ParsedCliArgs, { command: "flow-graph" }>): HarnessFlowGraph | HarnessFlowRun | HarnessFlowComparison {
  const generatedAt = new Date().toISOString()
  const recipe = parsed.recipeFilePath ? parseRecipe(JSON.parse(readFileSync(parsed.recipeFilePath, "utf8"))) : undefined
  const contract = buildAssemblyContract({
    ...(parsed.product ? { product: parsed.product } : {}),
    ...(recipe ? { recipe } : {}),
  })
  if (parsed.mode === "blueprint") {
    return buildAssembledFlowBlueprint(contract, generatedAt, recipe ? { compositionClaim: "custom-composition" } : undefined)
  }
  if (!parsed.product) throw new CliUsageError("flow-graph --recipe-file currently supports --mode blueprint.")
  if (parsed.mode === "trace") {
    return buildAssembledFlowRun({
      product: parsed.product,
      contract,
      generatedAt,
      ...(parsed.taskID ? { taskID: parsed.taskID } : {}),
    })
  }
  if (parsed.product === "minimal") throw new CliUsageError("flow-graph --mode native|compare requires a native product; minimal only supports --mode blueprint.")
  const nativeFromArtifact = parsed.artifactPath ? originalFlowFromEvidenceArtifact(parsed.artifactPath, parsed.product, parsed.taskID, generatedAt) : undefined
  if (parsed.mode === "native") {
    return nativeFromArtifact ?? buildOriginalFlowForProduct(parsed.product, {
      generatedAt,
      ...(parsed.taskID ? { taskID: parsed.taskID } : {}),
    })
  }
  if (nativeFromArtifact) {
    const contract = buildAssemblyContract({ product: parsed.product })
    return compareHarnessFlows({
      assembled: buildAssembledFlowBlueprint(contract, generatedAt),
      original: nativeFromArtifact,
      generatedAt,
    })
  }
  return buildHarnessFlowComparison({
    product: parsed.product,
    generatedAt,
    ...(parsed.taskID ? { taskID: parsed.taskID } : {}),
  })
}

function originalFlowFromEvidenceArtifact(
  artifactPath: string,
  product: HarnessProduct,
  taskID: string | undefined,
  generatedAt: string,
): HarnessFlowGraph | undefined {
  const taskParityReports = taskParityReportsFromArtifact(artifactPath)
  if (taskParityReports) {
    const report = taskParityReports.find((item) => item.product === product && item.mode === "original" && (!taskID || item.taskID === taskID)) ??
      taskParityReports.find((item) => item.product === product && (!taskID || item.taskID === taskID))
    if (!report) {
      throw new CliUsageError(
        `Task parity artifact ${artifactPath} does not contain a report for product ${product}${taskID ? ` and task ${taskID}` : ""}.`,
      )
    }
    return buildOriginalFlowFromTaskParityReport(report, generatedAt)
  }
  const externalCapture = externalCaptureFromArtifact(artifactPath)
  if (externalCapture) {
    return originalFlowFromExternalCaptureArtifact(externalCapture, artifactPath, product, taskID, generatedAt)
  }
  return originalFlowFromNativeCadenceArtifact(artifactPath, product, taskID, generatedAt)
}

function externalCaptureFromArtifact(artifactPath: string): NativeCaptureArtifact | undefined {
  if (!existsSync(artifactPath)) throw new CliUsageError(`Flow evidence artifact does not exist: ${artifactPath}`)
  const raw = JSON.parse(readFileSync(artifactPath, "utf8")) as unknown
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  if (record.schemaVersion !== 1 || record.artifactKind !== "external-tool-native-capture") return undefined
  const verification = verifyNativeCaptureArtifact(raw)
  if (!verification.ok) {
    throw new CliUsageError(`External capture artifact failed verification: ${verification.issues.map((issue) => `${issue.id} ${issue.message}`).join("; ")}`)
  }
  const capture = raw as NativeCaptureArtifact
  if (capture.captureMode === "capture-only") {
    throw new CliUsageError("flow-graph refuses capture-only external artifacts because they cannot prove task success.")
  }
  return capture
}

function originalFlowFromExternalCaptureArtifact(
  capture: NativeCaptureArtifact,
  artifactPath: string,
  product: HarnessProduct,
  taskID: string | undefined,
  generatedAt: string,
): HarnessFlowGraph {
  const captureProduct = externalCaptureHarnessProduct(capture.product)
  if (captureProduct !== product) {
    throw new CliUsageError(`External capture artifact ${artifactPath} is for product ${captureProduct}, not ${product}.`)
  }
  if (taskID && capture.taskID !== taskID) {
    throw new CliUsageError(`External capture artifact ${artifactPath} is for task ${capture.taskID}, not ${taskID}.`)
  }
  const fixtureSet = projectExternalCaptureToNativeCadenceFixtureSet(capture)
  const fixture = fixtureSet.fixtures.find((item) => item.product === product && item.taskID === capture.taskID)
  if (!fixture) {
    throw new CliUsageError(`External capture artifact ${artifactPath} could not be projected to a native cadence fixture for ${product}/${capture.taskID}.`)
  }
  return buildOriginalFlowFromNativeCadenceFixture(fixture, generatedAt)
}

function taskParityReportsFromArtifact(artifactPath: string): ProductTaskParityReport[] | undefined {
  if (!existsSync(artifactPath)) throw new CliUsageError(`Flow evidence artifact does not exist: ${artifactPath}`)
  const raw = JSON.parse(readFileSync(artifactPath, "utf8")) as unknown
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  if (record.schemaVersion === 1 && Array.isArray(record.reports) && Array.isArray(record.pairs)) {
    const artifact = raw as ProductTaskParityArtifact
    const verification = verifyProductTaskParityArtifact({ artifact })
    if (!verification.ok) throw new CliUsageError(taskParityVerificationError(verification, artifactPath))
    return artifact.reports
  }
  return undefined
}

function taskParityVerificationError(verification: ProductTaskParityArtifactVerificationReport, artifactPath: string): string {
  return `Task parity artifact failed verification: ${artifactPath}: ${verification.checks
    .filter((check) => !check.ok)
    .map((check) => `${check.id} ${check.message}`)
    .join("; ")}`
}

function originalFlowFromNativeCadenceArtifact(
  artifactPath: string,
  product: HarnessProduct,
  taskID: string | undefined,
  generatedAt: string,
): HarnessFlowGraph | undefined {
  const fixtures = nativeCadenceFixturesFromArtifact(artifactPath)
  const fixture = fixtures.find((item) => item.product === product && (!taskID || item.taskID === taskID)) ??
    (!taskID ? fixtures.find((item) => item.product === product) : undefined)
  return fixture ? buildOriginalFlowFromNativeCadenceFixture(fixture, generatedAt) : undefined
}

function nativeCadenceFixturesFromArtifact(artifactPath: string): ProductTaskNativeCadenceFixture[] {
  if (!existsSync(artifactPath)) throw new CliUsageError(`Native cadence fixture artifact does not exist: ${artifactPath}`)
  const raw = JSON.parse(readFileSync(artifactPath, "utf8")) as unknown
  const artifact = readNativeCadenceFixtureArtifact(raw, artifactPath)
  const verification = verifyProductTaskNativeCadenceFixtureSet(artifact)
  if (!verification.ok) {
    throw new CliUsageError(
      `Native cadence fixture artifact failed verification: ${verification.issues.map((issue) => `${issue.id} ${issue.message}`).join("; ")}`,
    )
  }
  return "attachments" in artifact ? artifact.attachments.map((attachment) => attachment.content) : artifact.fixtures
}

function readNativeCadenceFixtureArtifact(raw: unknown, artifactPath: string): ProductTaskNativeCadenceFixtureSet | ProductTaskNativeCadenceFixtureSplitSet {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  if (record.schemaVersion === 1 && Array.isArray(record.fixtures)) return raw as ProductTaskNativeCadenceFixtureSet
  if ("summary" in record && "manifest" in record && "attachments" in record) return raw as ProductTaskNativeCadenceFixtureSplitSet
  if (record.schemaVersion === 2 && record.artifactKind === "native-cadence-fixture-summary") {
    return readProductTaskNativeCadenceFixtureSplitSet(artifactPath)
  }
  if (record.schemaVersion === 2 && record.artifactKind === "task-parity-manifest") {
    const summaryPath = resolve(dirname(artifactPath), String(record.summaryPath ?? "summary.json"))
    return readProductTaskNativeCadenceFixtureSplitSet(summaryPath)
  }
  throw new CliUsageError(`Expected native cadence fixture artifact at ${artifactPath}`)
}

function writeFlowGraphReports(parsed: Extract<ParsedCliArgs, { command: "flow-graph-reports" }>): FlowGraphReportsOutput {
  const generatedAt = new Date().toISOString()
  mkdirSync(parsed.outDir, { recursive: true })
  const artifacts: FlowGraphReportArtifactSummary[] = []
  const nativeFixtureArtifactPath = flowGraphReportNativeFixtureArtifactPath(parsed.outDir)
  const writeArtifact = (
    kind: CliFlowGraphReportKind,
    product: CliAssemblyProduct,
    artifact: HarnessFlowGraph | HarnessFlowComparison,
    path: string,
    taskID?: string,
  ): void => {
    writeFileSync(path, `${JSON.stringify(artifact, null, 2)}\n`, "utf8")
    const verification = verifyHarnessFlowArtifact(artifact)
    artifacts.push({
      kind,
      product,
      ...(taskID ? { taskID } : {}),
      path,
      fingerprint: artifact.summary.fingerprint,
      verification,
    })
  }
  for (const product of parsed.products) {
    const contract = buildAssemblyContract({ product })
    const blueprint = buildAssembledFlowBlueprint(contract, generatedAt)
    writeArtifact("blueprint", product, blueprint, resolve(parsed.outDir, `flow-graph-${artifactProductID(product)}.json`))
    if (product === "minimal") continue
    const original = nativeFixtureArtifactPath ? originalFlowFromEvidenceArtifact(nativeFixtureArtifactPath, product, parsed.taskID, generatedAt) : undefined
    const comparison = original
      ? compareHarnessFlows({ assembled: blueprint, original, generatedAt })
      : buildHarnessFlowComparison({
          product,
          contract,
          generatedAt,
          taskID: parsed.taskID,
        })
    writeArtifact(
      "compare",
      product,
      comparison,
      resolve(parsed.outDir, `flow-graph-compare-${artifactProductID(product)}-${filenameSlug(parsed.taskID)}.json`),
      parsed.taskID,
    )
  }
  const summary = artifacts.reduce(
    (current, artifact) => ({
      ok: current.ok && artifact.verification.ok,
      artifacts: current.artifacts + 1,
      graphs: current.graphs + artifact.verification.summary.graphs,
      comparisons: current.comparisons + artifact.verification.summary.comparisons,
      stages: current.stages + artifact.verification.summary.stages,
    }),
    { ok: true, artifacts: 0, graphs: 0, comparisons: 0, stages: 0 },
  )
  return {
    schemaVersion: 1,
    generatedAt,
    outDir: parsed.outDir,
    taskID: parsed.taskID,
    products: parsed.products,
    artifacts,
    summary,
  }
}

function flowGraphReportNativeFixtureArtifactPath(outDir: string): string | undefined {
  const candidates = [
    resolve(outDir, "task-parity-native-cadence-fixtures/manifest.json"),
    resolve(outDir, "task-parity-native-cadence-fixtures/summary.json"),
    resolve(outDir, "task-parity-native-cadence-fixtures.json"),
  ]
  return candidates.find((candidate) => existsSync(candidate))
}

function formatFlowGraphReportsOutput(output: FlowGraphReportsOutput): string {
  const lines = [
    `Flow graph reports: ${output.summary.ok ? "ok" : "issues-found"}`,
    `Output: ${output.outDir}`,
    `Task: ${output.taskID}`,
    `Artifacts: ${output.summary.artifacts}`,
    `Graphs: ${output.summary.graphs}`,
    `Comparisons: ${output.summary.comparisons}`,
  ]
  for (const artifact of output.artifacts) {
    lines.push(`${artifact.kind}: ${artifact.product}${artifact.taskID ? ` task=${artifact.taskID}` : ""} ${artifact.verification.ok ? "ok" : "issues"} ${artifact.path}`)
  }
  const issues = output.artifacts.flatMap((artifact) => artifact.verification.issues.map((issue) => `${artifact.path}: ${issue.id} - ${issue.message}`))
  if (issues.length > 0) {
    lines.push("Findings:")
    lines.push(...issues.map((issue) => `  ${issue}`))
  }
  lines.push("")
  return lines.join("\n")
}

export async function runCli(argv: string[], io: CliIO = { stdout: process.stdout, stderr: process.stderr }): Promise<number> {
  try {
    const parsed = parseArgs(argv)
    if (parsed.command === "help") {
      io.stdout.write(`${usage()}\n`)
      return 0
    }
    if (parsed.command === "external-tools-list") {
      const output = externalToolProfileSummary()
      if (parsed.json) writeJSONOutput(io, output)
      else io.stdout.write(formatExternalToolList(listExternalToolProfiles()))
      return 0
    }
    if (parsed.command === "external-tools-doctor") {
      const toolIDs = parsed.toolID ? [parsed.toolID] : listExternalToolProfiles().map((profile) => profile.id)
      const results = await Promise.all(toolIDs.map((toolID) => doctorExternalTool(toolID, {
        ...(parsed.toolPath ? { toolPath: parsed.toolPath } : {}),
        ...(parsed.strategy ? { strategy: parsed.strategy } : {}),
      })))
      if (parsed.json) writeJSONOutput(io, { ok: results.every((result) => result.ok), tools: results })
      else io.stdout.write(formatExternalToolDoctor(results))
      return parsed.requireTool && results.some((result) => !result.ok) ? 1 : 0
    }
    if (parsed.command === "external-tools-capture") {
      assertExternalToolProductSupportedForCli(parsed.toolID, parsed.product, "capture")
      const captureStartedAt = new Date()
      const runID = defaultExternalToolRunID(parsed.toolID, parsed.product, parsed.taskID, captureStartedAt)
      const outDir = parsed.outDir ?? resolve(".helix/external-tools/runs", runID)
      assertExternalToolCapturePathsLocalOnly({ toolID: parsed.toolID, outDir, toolArgs: parsed.toolArgs })
      if (!parsed.dryRun) assertExternalToolCaptureGate(parsed.captureMode)
      let requiredToolVersion: string | undefined
      if (parsed.dryRun && parsed.requireTool) {
        const doctor = await doctorExternalTool(parsed.toolID, {
          ...(parsed.toolPath ? { toolPath: parsed.toolPath } : {}),
          ...(parsed.strategy ? { strategy: parsed.strategy } : {}),
        })
        if (!doctor.ok) throw new CliUsageError(`external-tools capture --require-tool failed: ${doctor.error ?? "tool is not installed"}`)
        requiredToolVersion = doctor.version
      }
      const result = parsed.dryRun
        ? createExternalToolCaptureDryRun({
            toolID: parsed.toolID,
            ...(parsed.product ? { product: parsed.product } : {}),
            ...(parsed.taskID ? { taskID: parsed.taskID } : {}),
            outDir,
            runID,
            now: captureStartedAt,
            ...(parsed.toolPath ? { toolPath: parsed.toolPath } : {}),
            ...(parsed.strategy ? { strategy: parsed.strategy } : {}),
            toolArgs: parsed.toolArgs,
            cwd: process.cwd(),
            ...(requiredToolVersion ? { toolVersion: requiredToolVersion } : {}),
          })
        : await runExternalToolCapture({
            toolID: parsed.toolID,
            ...(parsed.product ? { product: parsed.product } : {}),
            ...(parsed.taskID ? { taskID: parsed.taskID } : {}),
            outDir,
            runID,
            now: captureStartedAt,
            ...(parsed.toolPath ? { toolPath: parsed.toolPath } : {}),
            ...(parsed.strategy ? { strategy: parsed.strategy } : {}),
            toolArgs: parsed.toolArgs,
            cwd: process.cwd(),
            captureMode: parsed.captureMode,
          })
      if (parsed.json) writeJSONOutput(io, result)
      else io.stdout.write(formatExternalToolCapture(result))
      return result.ok ? 0 : result.manifest.exitCode ?? 1
    }
    if (parsed.command === "external-tools-import") {
      assertExternalToolProductSupportedForCli(parsed.toolID, parsed.product, "import")
      assertExternalToolImportArtifactLocalOnly(parsed.artifactPath)
      const artifact = importExternalToolArtifact({
        toolID: parsed.toolID,
        artifactPath: parsed.artifactPath,
        product: parsed.product,
        ...(parsed.taskID ? { taskID: parsed.taskID } : {}),
      })
      const verification = verifyNativeCaptureArtifact(artifact)
      const outputPaths: string[] = []
      if (verification.ok) {
        if (parsed.out) {
          writeNativeCaptureArtifact(parsed.out, artifact)
          outputPaths.push(parsed.out)
        }
        if (parsed.publishReport || parsed.outDir) {
          const outDir = parsed.outDir ?? resolve("docs/reports/external-tools", parsed.toolID, parsed.product, artifact.taskID)
          const outPath = resolve(outDir, "native-capture.json")
          writeNativeCaptureArtifact(outPath, artifact)
          outputPaths.push(outPath)
        }
      }
      if (parsed.json) writeJSONOutput(io, { ...(verification.ok ? { artifact } : {}), verification, outputPaths })
      else io.stdout.write(formatExternalToolImport(artifact, verification, outputPaths))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "external-tools-verify") {
      const artifact = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as unknown
      const verification = verifyExternalToolArtifactWithOptionalRunManifest(artifact, parsed.artifactPath, parsed.runManifestPath)
      const output = parsed.runManifestPath
        ? { ...verification, manifest: { path: parsed.runManifestPath, ...(existsSync(parsed.runManifestPath) ? { hash: sha256File(parsed.runManifestPath) } : {}) } }
        : verification
      if (parsed.json) writeJSONOutput(io, output)
      else io.stdout.write(formatExternalToolVerification(verification, parsed.artifactPath, parsed.runManifestPath))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "external-tools-verify-run-manifest") {
      let manifest: unknown
      try {
        manifest = JSON.parse(readFileSync(parsed.manifestPath, "utf8")) as unknown
      } catch (error) {
        const issue = { id: "run-manifest.parse", ok: false, message: `run manifest parses as JSON: ${error instanceof Error ? error.message : String(error)}` }
        const verification: ExternalToolVerificationReport = { ok: false, checks: [issue], issues: [issue] }
        const output = { ...verification, manifest: { path: parsed.manifestPath } }
        if (parsed.json) writeJSONOutput(io, output)
        else io.stdout.write(formatExternalToolRunManifestVerification(verification, parsed.manifestPath))
        return 1
      }
      const verification = verifyExternalToolRunManifest(manifest, {
        runManifestPath: parsed.manifestPath,
        ...(parsed.product ? { requiredProduct: parsed.product } : {}),
        ...(parsed.taskID ? { requiredTaskID: parsed.taskID } : {}),
        ...(parsed.captureMode ? { requiredCaptureMode: parsed.captureMode } : {}),
        ...(parsed.expectedInvocationStrategy ? { requiredInvocationStrategy: parsed.expectedInvocationStrategy } : {}),
        ...(parsed.expectedInvocationCommand ? { requiredInvocationCommand: parsed.expectedInvocationCommand } : {}),
        ...(parsed.expectedInvocationArgs ? { requiredInvocationArgs: parsed.expectedInvocationArgs } : {}),
        allowUnknownToolVersion: parsed.allowUnknownToolVersion,
        allowEmptyArtifacts: parsed.allowEmptyArtifacts,
        requiredArtifactRoles: parsed.requiredArtifactRoles,
      })
      const output = { ...verification, manifest: { path: parsed.manifestPath, ...(existsSync(parsed.manifestPath) ? { hash: sha256File(parsed.manifestPath) } : {}) } }
      if (parsed.json) writeJSONOutput(io, output)
      else io.stdout.write(formatExternalToolRunManifestVerification(verification, parsed.manifestPath))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "external-tools-to-native-cadence") {
      const capture = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as NativeCaptureArtifact
      const captureVerification = verifyNativeCaptureArtifact(capture)
      if (!captureVerification.ok) {
        throw new CliUsageError(`External capture artifact failed verification: ${captureVerification.issues.map((issue) => issue.id).join(", ")}`)
      }
      if (capture.captureMode === "capture-only") {
        throw new CliUsageError("external-tools to-native-cadence refuses capture-only artifacts because they cannot prove task success.")
      }
      const fixtureSet = projectExternalCaptureToNativeCadenceFixtureSet(capture)
      const verification = verifyProductTaskNativeCadenceFixtureSet(fixtureSet)
      if (parsed.out) writeProductTaskNativeCadenceFixtureSet(parsed.out, fixtureSet)
      if (parsed.json) writeJSONOutput(io, { fixtureSet, verification })
      else io.stdout.write(formatExternalToolNativeCadence(fixtureSet, verification, parsed.out))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "tui") {
      const summary = await runHarnessTui({
        ...(parsed.recipeFilePath ? { recipeFilePath: parsed.recipeFilePath } : {}),
        ...(parsed.profileName ? { profileName: parsed.profileName } : {}),
        ...(parsed.rootDir ? { rootDir: parsed.rootDir } : {}),
        providerMode: parsed.providerMode,
        ...(parsed.text !== undefined ? { text: parsed.text } : {}),
        ...(parsed.cwd ? { cwd: parsed.cwd } : {}),
        ...(parsed.storageDir ? { storageDir: parsed.storageDir } : {}),
        json: parsed.json,
        env: process.env,
        stdout: io.stdout as NodeJS.WriteStream,
        stderr: io.stderr as NodeJS.WriteStream,
      })
      return summary.ok ? 0 : 1
    }
    if (parsed.command === "profile-install") {
      const store = createProfileStore(parsed.rootDir)
      const recipe = parseRecipe(JSON.parse(readFileSync(parsed.recipeFilePath, "utf8")))
      const record = store.install({
        name: parsed.name,
        recipe,
        ...(parsed.workspaceDir ? { workspaceDir: parsed.workspaceDir } : {}),
        ...(parsed.storageDir ? { storageDir: parsed.storageDir } : {}),
      })
      const status = store.status(record.profile.name)
      if (parsed.json) writeJSONOutput(io, status)
      else io.stdout.write(`Installed harness profile ${status.profile.name}\nRoot: ${store.rootDir}\nStatus: ${status.validation.ok ? "ready" : "needs-configuration"}\n`)
      return 0
    }
    if (parsed.command === "profile-list") {
      const store = createProfileStore(parsed.rootDir)
      const profiles = store.list()
      if (parsed.json) writeJSONOutput(io, { rootDir: store.rootDir, profiles })
      else io.stdout.write(`${profiles.map((item) => `${item.profile.name}\t${item.profile.product}\t${item.profile.status}`).join("\n") || "No installed harness profiles."}\n`)
      return 0
    }
    if (parsed.command === "profile-status") {
      const store = createProfileStore(parsed.rootDir)
      const status = store.status(parsed.name)
      if (parsed.json) writeJSONOutput(io, status)
      else io.stdout.write(formatProfileStatus(status.profile.name, status.validation.ok, status.validation.missing, status.validation.issues))
      return status.validation.ok ? 0 : 1
    }
    if (parsed.command === "profile-remove") {
      const store = createProfileStore(parsed.rootDir)
      store.remove(parsed.name, { purge: parsed.purge })
      const output = { ok: true, name: parsed.name, purge: parsed.purge }
      if (parsed.json) writeJSONOutput(io, output)
      else io.stdout.write(`Removed harness profile ${parsed.name}${parsed.purge ? " and purged data" : " (profile data moved aside)"}.\n`)
      return 0
    }
    if (parsed.command === "profile-configure-provider") {
      const store = createProfileStore(parsed.rootDir)
      const status = store.configureProvider({
        name: parsed.name,
        kind: parsed.provider,
        ...(parsed.modelID ? { modelID: parsed.modelID } : {}),
        ...(parsed.baseURL ? { baseURL: parsed.baseURL } : {}),
        ...(parsed.appURL ? { appURL: parsed.appURL } : {}),
        ...(parsed.appName ? { appName: parsed.appName } : {}),
        ...(parsed.apiKeyEnv ? { apiKeyEnv: parsed.apiKeyEnv } : {}),
      })
      if (parsed.json) writeJSONOutput(io, status)
      else io.stdout.write(formatProfileStatus(status.profile.name, status.validation.ok, status.validation.missing, status.validation.issues))
      return 0
    }
    if (parsed.command === "channel-add-telegram") {
      const store = createProfileStore(parsed.rootDir)
      const status = store.addTelegramChannel({
        name: parsed.name,
        ...(parsed.mode ? { mode: parsed.mode } : {}),
        ...(parsed.botTokenEnv ? { botTokenEnv: parsed.botTokenEnv } : {}),
        ...(parsed.allowedChatIDs ? { allowedChatIDs: parsed.allowedChatIDs } : {}),
        ...(parsed.allowedUserIDs ? { allowedUserIDs: parsed.allowedUserIDs } : {}),
        ...(parsed.webhookURL ? { webhookURL: parsed.webhookURL } : {}),
        ...(parsed.webhookSecretEnv ? { webhookSecretEnv: parsed.webhookSecretEnv } : {}),
      })
      if (parsed.json) writeJSONOutput(io, status)
      else io.stdout.write(formatProfileStatus(status.profile.name, status.validation.ok, status.validation.missing, status.validation.issues))
      return 0
    }
    if (parsed.command === "channel-status-telegram") {
      const store = createProfileStore(parsed.rootDir)
      const status = store.status(parsed.name)
      if (parsed.json) writeJSONOutput(io, { profile: status.profile.name, telegram: status.telegram, validation: status.validation })
      else io.stdout.write(`Telegram: ${status.telegram ? status.telegram.mode : "not configured"}\n`)
      return status.telegram ? 0 : 1
    }
    if (parsed.command === "channel-remove-telegram") {
      const store = createProfileStore(parsed.rootDir)
      const status = store.removeTelegramChannel(parsed.name)
      if (parsed.json) writeJSONOutput(io, status)
      else io.stdout.write(`Removed Telegram channel from ${status.profile.name}.\n`)
      return 0
    }
    if (parsed.command === "gateway-smoke" || parsed.command === "gateway-smoke-local") {
      const store = createProfileStore(parsed.rootDir)
      const controller = new HarnessGatewayController({ store, cwd: process.cwd(), env: process.env })
      const result = parsed.command === "gateway-smoke"
        ? await controller.liveTelegramSmoke({
            name: parsed.name,
            text: parsed.text,
            ...(parsed.chatID ? { chatID: parsed.chatID } : {}),
            ...(parsed.senderID ? { senderID: parsed.senderID } : {}),
          })
        : await controller.localFixtureSmoke({
            name: parsed.name,
            text: parsed.text,
            ...(parsed.chatID ? { chatID: parsed.chatID } : {}),
            ...(parsed.senderID ? { senderID: parsed.senderID } : {}),
          })
      if (parsed.json) writeJSONOutput(io, result)
      else {
        const label = parsed.command === "gateway-smoke-local" ? "Gateway local fixture smoke" : "Gateway live smoke"
        io.stdout.write(`${label} ${result.ok ? "passed" : "failed"} for ${result.profile}${"skipped" in result && result.skipped ? ` (skipped: ${result.reason})` : ""}: ${result.dispatch?.text ?? ""}\n`)
      }
      return result.ok ? 0 : 1
    }
    if (parsed.command === "gateway-start") {
      const store = createProfileStore(parsed.rootDir)
      const result = new HarnessGatewayController({ store, cwd: process.cwd(), env: process.env }).start({ name: parsed.name, channel: parsed.channel })
      if (parsed.json) writeJSONOutput(io, result)
      else io.stdout.write(`Gateway ${result.state} for ${result.profile}${result.pid ? ` pid=${result.pid}` : ""}\nLogs: ${result.logPath}\n`)
      return result.ok ? 0 : 1
    }
    if (parsed.command === "gateway-stop") {
      const store = createProfileStore(parsed.rootDir)
      const result = new HarnessGatewayController({ store, cwd: process.cwd(), env: process.env }).stop({ name: parsed.name, channel: parsed.channel })
      if (parsed.json) writeJSONOutput(io, result)
      else io.stdout.write(`Gateway ${result.state} for ${result.profile}${result.pid ? ` pid=${result.pid}` : ""}\n`)
      return result.ok ? 0 : 1
    }
    if (parsed.command === "gateway-restart") {
      const store = createProfileStore(parsed.rootDir)
      const result = new HarnessGatewayController({ store, cwd: process.cwd(), env: process.env }).restart({ name: parsed.name, channel: parsed.channel })
      if (parsed.json) writeJSONOutput(io, result)
      else io.stdout.write(`Gateway ${result.state} for ${result.profile}${result.pid ? ` pid=${result.pid}` : ""}\nLogs: ${result.logPath}\n`)
      return result.ok ? 0 : 1
    }
    if (parsed.command === "gateway-status") {
      const store = createProfileStore(parsed.rootDir)
      const status = store.status(parsed.name)
      if (parsed.json) writeJSONOutput(io, { profile: status.profile.name, gateway: status.gateway, validation: status.validation })
      else io.stdout.write(`Gateway: ${status.gateway.state}\nProfile: ${status.profile.name}\nLogs: ${status.gateway.logPath}\n`)
      return status.gateway.state === "failed" ? 1 : 0
    }
    if (parsed.command === "gateway-logs") {
      const store = createProfileStore(parsed.rootDir)
      const logs = store.gatewayLogs(parsed.name, { ...(parsed.lines ? { maxLines: parsed.lines } : {}) })
      if (parsed.json) writeJSONOutput(io, logs)
      else io.stdout.write(`${logs.text}\n`)
      return 0
    }
    if (parsed.command === "gateway-manifests") {
      const store = createProfileStore(parsed.rootDir)
      const manifests = new HarnessGatewayController({ store, cwd: process.cwd(), env: process.env }).serviceManifests({ name: parsed.name, channel: parsed.channel })
      if (parsed.json) writeJSONOutput(io, manifests)
      else io.stdout.write(`${manifests.systemdUserService}\n\n${manifests.launchdPlist}\n\n${manifests.pm2EcosystemConfig}\n\n${manifests.dockerCompose}\n`)
      return 0
    }
    if (parsed.command === "gateway-worker") {
      const store = createProfileStore(parsed.rootDir)
      await new HarnessGatewayController({ store, cwd: process.cwd(), env: process.env }).worker({ name: parsed.name, channel: parsed.channel, once: parsed.once })
      if (parsed.json) writeJSONOutput(io, { ok: true, name: parsed.name, once: parsed.once })
      return 0
    }
    if (parsed.command === "assemble") {
      const taskParityArtifact = parsed.requireTaskParity ? readOptionalTaskParityArtifact(parsed.taskParityArtifactPath) : undefined
      const nativeCadenceFixtures = parsed.requireNativeFixtures ? readOptionalNativeFixtureSet(parsed.nativeFixturePath) : undefined
      const externalToolEvidence = parsed.requireExternalToolEvidence ? readExternalToolEvidenceRefs(parsed.externalCapturePaths, parsed.externalRunManifestPath) : undefined
      const contracts = assemblyContractTargets(parsed).map((target) => {
        const recipe = target.recipeFilePath ? parseRecipe(JSON.parse(readFileSync(target.recipeFilePath, "utf8"))) : undefined
        return buildAssemblyContract({
          ...(target.product ? { product: target.product } : {}),
          ...(target.recipeID ? { recipeID: target.recipeID } : {}),
          ...(recipe ? { recipe } : {}),
          ...(taskParityArtifact ? { taskParityArtifact } : {}),
          ...(nativeCadenceFixtures ? { nativeCadenceFixtures } : {}),
          ...(externalToolEvidence ? { externalToolEvidence } : {}),
          includeTaskParity: parsed.requireTaskParity,
          includeNativeFixtures: parsed.requireNativeFixtures,
          includeExternalToolEvidence: parsed.requireExternalToolEvidence,
        })
      })
      const verifications = contracts.map((contract) =>
        verifyAssemblyContract({
          contract,
          requireTaskParity: parsed.requireTaskParity,
          requireNativeFixtures: parsed.requireNativeFixtures,
          requireExternalToolEvidence: parsed.requireExternalToolEvidence,
        }),
      )
      if (parsed.out) writeAssemblyContract(parsed.out, contracts[0]!)
      if (parsed.outDir) {
        for (const contract of contracts) {
          writeAssemblyContract(resolve(parsed.outDir, `assembly-contract-${artifactProductID(contract.product)}.json`), contract)
        }
      }
      if (parsed.json) {
        io.stdout.write(
          `${JSON.stringify(
            contracts.length === 1
              ? { contract: contracts[0], verification: verifications[0], summary: assemblyContractSummary(contracts[0]!, verifications[0]) }
              : { contracts, verifications, summary: contracts.map((contract, index) => assemblyContractSummary(contract, verifications[index])) },
            null,
            2,
          )}\n`,
        )
      } else {
        io.stdout.write(
          contracts
            .map((contract, index) => formatAssemblyContract(contract, verifications[index]))
            .join("\n"),
        )
      }
      return parsed.strict && verifications.some((verification) => !verification.ok) ? 1 : 0
    }
    if (parsed.command === "verify-assembly-contract") {
      const contract = readAssemblyContract(parsed.artifactPath)
      const verification = verifyAssemblyContract({
        contract,
        requireTaskParity: parsed.requireTaskParity,
        requireNativeFixtures: parsed.requireNativeFixtures,
        requireExternalToolEvidence: parsed.requireExternalToolEvidence,
      })
      if (parsed.json) io.stdout.write(`${JSON.stringify(verification, null, 2)}\n`)
      else io.stdout.write(formatAssemblyContractVerification(verification, parsed.artifactPath))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "flow-graph") {
      const artifact = createFlowGraphArtifact(parsed)
      if (parsed.out) {
        mkdirSync(dirname(parsed.out), { recursive: true })
        writeFileSync(parsed.out, `${JSON.stringify(artifact, null, 2)}\n`, "utf8")
      }
      if (parsed.json) writeJSONOutput(io, artifact)
      else io.stdout.write(formatFlowGraphArtifact(artifact, parsed.out))
      return 0
    }
    if (parsed.command === "flow-graph-reports") {
      const output = writeFlowGraphReports(parsed)
      if (parsed.json) writeJSONOutput(io, output)
      else io.stdout.write(formatFlowGraphReportsOutput(output))
      return output.summary.ok ? 0 : 1
    }
    if (parsed.command === "verify-flow-graph") {
      const artifact = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as unknown
      const verification = verifyHarnessFlowArtifact(artifact)
      if (parsed.json) writeJSONOutput(io, verification)
      else io.stdout.write(formatFlowGraphVerification(verification, parsed.artifactPath))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "executable-placeholder-audit") {
      const audit = buildExecutablePlaceholderAudit({
        ...(parsed.products ? { products: parsed.products } : {}),
      })
      const verification = verifyExecutablePlaceholderAudit(audit)
      if (parsed.out || parsed.markdown) {
        writeExecutablePlaceholderAuditReports({
          audit,
          ...(parsed.out ? { jsonPath: parsed.out } : {}),
          ...(parsed.markdown ? { markdownPath: parsed.markdown } : {}),
        })
      }
      if (parsed.json) writeJSONOutput(io, { audit, verification })
      else io.stdout.write(formatExecutablePlaceholderAuditOutput(audit, verification, parsed.out, parsed.markdown))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "verify-executable-placeholder-audit") {
      const audit = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as ExecutablePlaceholderAudit
      const verification = verifyExecutablePlaceholderAudit(audit)
      if (parsed.json) writeJSONOutput(io, verification)
      else io.stdout.write(formatExecutablePlaceholderAuditVerification(verification, parsed.artifactPath))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "todo27-native-rewrite-inventory") {
      const inventory = buildTodo27NativeRewriteInventory({
        ...(parsed.products ? { products: parsed.products.filter(isTodo27NativeRewriteInventoryProduct) } : {}),
      })
      const verification = verifyTodo27NativeRewriteInventory(inventory)
      if (parsed.out || parsed.markdown) {
        writeTodo27NativeRewriteInventoryReports({
          inventory,
          ...(parsed.out ? { jsonPath: parsed.out } : {}),
          ...(parsed.markdown ? { markdownPath: parsed.markdown } : {}),
        })
      }
      if (parsed.json) writeJSONOutput(io, { inventory, verification })
      else io.stdout.write(formatTodo27NativeRewriteInventoryOutput(inventory, verification, parsed.out, parsed.markdown))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "verify-todo27-native-rewrite-inventory") {
      const inventory = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as Todo27NativeRewriteInventory
      const verification = verifyTodo27NativeRewriteInventory(inventory)
      if (parsed.json) writeJSONOutput(io, verification)
      else io.stdout.write(formatTodo27NativeRewriteInventoryVerification(verification, parsed.artifactPath))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "todo27-opencode-split-acceptance") {
      const report = buildTodo27OpenCodeSplitAcceptance()
      const verification = verifyTodo27OpenCodeSplitAcceptance(report)
      if (parsed.out || parsed.markdown) {
        writeTodo27OpenCodeSplitAcceptanceReport({
          report,
          ...(parsed.out ? { jsonPath: parsed.out } : {}),
          ...(parsed.markdown ? { markdownPath: parsed.markdown } : {}),
        })
      }
      if (parsed.json) writeJSONOutput(io, { report, verification })
      else io.stdout.write(formatTodo27OpenCodeSplitAcceptanceOutput(report, verification, parsed.out, parsed.markdown))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "verify-todo27-opencode-split-acceptance") {
      const report = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as Todo27OpenCodeSplitAcceptance
      const verification = verifyTodo27OpenCodeSplitAcceptance(report)
      if (parsed.json) writeJSONOutput(io, verification)
      else io.stdout.write(formatTodo27OpenCodeSplitAcceptanceVerification(verification, parsed.artifactPath))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "current-module-placeholder-audit") {
      const audit = buildCurrentModulePlaceholderAudit({
        ...(parsed.products ? { products: parsed.products.filter(isTodo27NativeRewriteInventoryProduct) } : {}),
      })
      const verification = verifyCurrentModulePlaceholderAudit(audit)
      if (parsed.out || parsed.markdown) {
        writeCurrentModulePlaceholderAuditReports({
          audit,
          ...(parsed.out ? { jsonPath: parsed.out } : {}),
          ...(parsed.markdown ? { markdownPath: parsed.markdown } : {}),
        })
      }
      if (parsed.json) writeJSONOutput(io, { audit, verification })
      else io.stdout.write(formatCurrentModulePlaceholderAuditOutput(audit, verification, parsed.out, parsed.markdown))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "verify-current-module-placeholder-audit") {
      const audit = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as CurrentModulePlaceholderAudit
      const verification = verifyCurrentModulePlaceholderAudit(audit)
      if (parsed.json) writeJSONOutput(io, verification)
      else io.stdout.write(formatCurrentModulePlaceholderAuditVerification(verification, parsed.artifactPath))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "live-provider-parity") {
      const report = await runLiveProviderParity({
        ...(parsed.cwd ? { cwd: parsed.cwd } : {}),
        ...(parsed.provider ? { provider: parsed.provider } : {}),
        ...(parsed.modelID ? { modelID: parsed.modelID } : {}),
        ...(parsed.apiKey ? { apiKey: parsed.apiKey } : {}),
        ...(parsed.baseURL ? { baseURL: parsed.baseURL } : {}),
        ...(parsed.appURL ? { appURL: parsed.appURL } : {}),
        ...(parsed.appName ? { appName: parsed.appName } : {}),
        ...(parsed.prompt ? { prompt: parsed.prompt } : {}),
        ...(parsed.products ? { products: parsed.products } : {}),
        ...(parsed.maxSteps ? { maxSteps: parsed.maxSteps } : {}),
        ...(parsed.maxRetries === undefined ? {} : { maxRetries: parsed.maxRetries }),
        ...(parsed.maxOutputTokens === undefined ? {} : { maxOutputTokens: parsed.maxOutputTokens }),
        ...(parsed.requireCredentials === undefined ? {} : { requireCredentials: parsed.requireCredentials }),
      })
      if (parsed.artifactFormat === "split" || parsed.outDir || parsed.summaryOut) {
        const outDir = parsed.outDir ?? (parsed.out ? resolve(dirname(parsed.out), basenameWithoutJSON(parsed.out)) : resolve("docs/reports/live-provider-parity"))
        const artifactSet = createLiveProviderParitySplitArtifactSet(report)
        if (report.ok || !parsed.requireCredentials) {
          writeLiveProviderParitySplitArtifactSet({
            outDir,
            artifactSet,
            ...(parsed.summaryOut || parsed.out ? { summaryOut: parsed.summaryOut ?? parsed.out } : {}),
          })
        }
      } else if (parsed.out && (report.ok || !parsed.requireCredentials)) writeLiveProviderReport(parsed.out, report)
      if (parsed.json) {
        if (parsed.artifactFormat === "split" || parsed.outDir || parsed.summaryOut) io.stdout.write(`${JSON.stringify(createLiveProviderParitySplitArtifactSet(report).summary, null, 2)}\n`)
        else io.stdout.write(`${JSON.stringify(liveProviderArtifact(report), null, 2)}\n`)
      }
      else io.stdout.write(formatLiveProviderReport(report, parsed.out))
      return report.ok ? 0 : 1
    }
    if (parsed.command === "verify-live-provider-parity") {
      const rawArtifact = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as unknown
      const artifact = isLiveProviderSummaryArtifactFile(rawArtifact, parsed.artifactPath) ? readLiveProviderParitySplitArtifactSet(parsed.artifactPath) : rawArtifact
      const verification = verifyLiveProviderParityArtifact({
        artifact,
        ...(parsed.provider ? { expectedProvider: parsed.provider } : {}),
        ...(parsed.modelID ? { expectedModelID: parsed.modelID } : {}),
        ...(parsed.products ? { expectedProducts: parsed.products } : {}),
        ...(parsed.maxAgeMs === undefined ? {} : { maxAgeMs: parsed.maxAgeMs }),
      })
      if (parsed.json) io.stdout.write(`${JSON.stringify(verification, null, 2)}\n`)
      else io.stdout.write(formatLiveProviderArtifactVerification(verification, parsed.artifactPath))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "live-provider-migrate-artifact") {
      const artifact = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as { report?: LiveProviderParityReport }
      if (!artifact.report) throw new CliUsageError("live-provider-parity migrate-artifact requires a legacy schemaVersion 1 artifact with report.")
      const artifactSet = createLiveProviderParitySplitArtifactSet(artifact.report)
      writeLiveProviderParitySplitArtifactSet({
        outDir: parsed.outDir,
        artifactSet,
        ...(parsed.summaryOut ? { summaryOut: parsed.summaryOut } : {}),
      })
      const verification = verifyLiveProviderParityArtifact({ artifact: artifactSet })
      if (parsed.json) io.stdout.write(`${JSON.stringify({ summary: artifactSet.summary, verification, outDir: parsed.outDir }, null, 2)}\n`)
      else io.stdout.write(`Live provider parity artifact migrated to ${parsed.outDir}\nStatus: ${verification.ok ? "ok" : "issues-found"}\n`)
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "task-parity") {
      const builderRecipe = parsed.recipeFilePath ? parseRecipe(JSON.parse(readFileSync(parsed.recipeFilePath, "utf8"))) : undefined
      const builderRecipeProduct = builderRecipe ? runtimeProductForRecipe(builderRecipe) : undefined
      const externalCapture = parsed.externalCapturePath ? readExternalCaptureForTaskParity(parsed.externalCapturePath, parsed.products, parsed.taskIDs, parsed.modes) : undefined
      const taskParityNativeConfig =
        parsed.nativeOriginal || externalCapture || parsed.provider === "live" || parsed.requireCredentials !== undefined || parsed.modelID || parsed.apiKey || parsed.baseURL || parsed.packageSpec || parsed.timeoutMs
          ? {
              native: {
                enabled: parsed.nativeOriginal === true && !externalCapture,
                ...(externalCapture ? { externalCapture } : {}),
                ...(parsed.requireCredentials === undefined ? {} : { requireCredentials: parsed.requireCredentials }),
                ...(parsed.modelID ? { modelID: parsed.modelID } : {}),
                ...(parsed.apiKey ? { apiKey: parsed.apiKey } : {}),
                ...(parsed.baseURL ? { baseURL: parsed.baseURL } : {}),
                ...(parsed.packageSpec ? { packageSpec: parsed.packageSpec } : {}),
                ...(parsed.timeoutMs ? { timeoutMs: parsed.timeoutMs } : {}),
              },
            }
          : {}
      const artifact = await runProductTaskParitySuite({
        ...(parsed.suite ? { suite: parsed.suite } : {}),
        ...(parsed.taskIDs ? { taskIDs: parsed.taskIDs } : externalCapture ? { taskIDs: [externalCapture.taskID] } : {}),
        ...(parsed.products ? { products: parsed.products } : externalCapture ? { products: [externalCapture.product] } : builderRecipeProduct ? { products: [builderRecipeProduct] } : {}),
        ...(parsed.modes ? { modes: parsed.modes } : {}),
        ...(builderRecipe ? { recipe: builderRecipe, recipeLabel: parsed.recipeFilePath } : {}),
        ...(parsed.provider ? { provider: parsed.provider } : {}),
        ...taskParityNativeConfig,
      })
      if (parsed.artifactFormat === "split" || parsed.outDir || parsed.summaryOut) {
        const outDir = parsed.outDir ?? (parsed.out ? resolve(dirname(parsed.out), basenameWithoutJSON(parsed.out)) : resolve("docs/reports/task-parity"))
        const artifactSet = createProductTaskParitySplitArtifactSet({
          artifact,
          command: `helix task-parity --artifact-format split`,
        })
        writeProductTaskParitySplitArtifactSet({
          outDir,
          artifactSet,
          ...(parsed.summaryOut || parsed.out ? { summaryOut: parsed.summaryOut ?? parsed.out } : {}),
        })
      } else if (parsed.out) writeProductTaskParityArtifact(parsed.out, artifact)
      if (parsed.json) {
        if (parsed.artifactFormat === "split" || parsed.outDir || parsed.summaryOut) {
          io.stdout.write(`${JSON.stringify(createProductTaskParitySplitArtifactSet({ artifact }).summary, null, 2)}\n`)
        } else io.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`)
      }
      else io.stdout.write(formatTaskParityArtifact(artifact, parsed.out))
      return artifact.reports.every((report) => report.status === "matched" || report.status === "acceptable-drift") ? 0 : 1
    }
    if (parsed.command === "verify-task-parity") {
      const rawArtifact = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as unknown
      const artifact = isTaskParitySummaryArtifactFile(rawArtifact, parsed.artifactPath) ? readProductTaskParitySplitArtifactSet(parsed.artifactPath) : rawArtifact
      const verification = verifyProductTaskParityArtifact({
        artifact,
        ...(parsed.products ? { expectedProducts: parsed.products } : {}),
        ...(parsed.modes ? { expectedModes: parsed.modes } : {}),
        ...(parsed.taskIDs ? { expectedTaskIDs: parsed.taskIDs } : {}),
      })
      if (parsed.json) io.stdout.write(`${JSON.stringify(verification, null, 2)}\n`)
      else io.stdout.write(formatTaskParityVerification(verification, parsed.artifactPath))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "task-parity-diff") {
      const left = JSON.parse(readFileSync(parsed.artifactA, "utf8")) as ProductTaskParityArtifact
      const right = JSON.parse(readFileSync(parsed.artifactB, "utf8")) as ProductTaskParityArtifact
      const diff = diffProductTaskParityArtifacts(left, right)
      if (parsed.json) io.stdout.write(`${JSON.stringify(diff, null, 2)}\n`)
      else io.stdout.write(formatTaskParityDiff(diff, parsed.artifactA, parsed.artifactB))
      return diff.ok ? 0 : 1
    }
    if (parsed.command === "task-parity-migrate-artifact") {
      const artifact = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as ProductTaskParityArtifact
      const artifactSet = migrateProductTaskParityArtifact({
        artifact,
        command: `helix task-parity migrate-artifact --artifact ${parsed.artifactPath}`,
      })
      writeProductTaskParitySplitArtifactSet({
        outDir: parsed.outDir,
        artifactSet,
        ...(parsed.summaryOut ? { summaryOut: parsed.summaryOut } : {}),
      })
      const verification = verifyProductTaskParityArtifact({ artifact: artifactSet })
      const output = { summary: artifactSet.summary, verification, outDir: parsed.outDir }
      if (parsed.json) io.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
      else io.stdout.write(`Task parity artifact migrated to ${parsed.outDir}\nStatus: ${verification.ok ? "ok" : "issues-found"}\n`)
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "task-parity-cadence-diagnose") {
      const artifact = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as ProductTaskParityArtifact
      const diagnosis = diagnoseProductTaskCadenceArtifact(
        artifact,
        todoHasUncheckedItems(resolve("TODO", "TODO-005.md")) ? { followUpTODO: "TODO/TODO-005.md" } : {},
      )
      if (parsed.out) writeProductTaskCadenceDiagnosisMarkdown(parsed.out, diagnosis)
      if (parsed.json) io.stdout.write(`${JSON.stringify(diagnosis, null, 2)}\n`)
      else io.stdout.write(formatTaskParityCadenceDiagnosis(diagnosis, parsed.artifactPath, parsed.out))
      return diagnosis.products.every((product) => product.cadenceScore >= product.targetScore || product.estimatedScoreAfterPlannedFixes >= product.targetScore)
        ? 0
        : 1
    }
    if (parsed.command === "task-parity-native-cadence-fixtures") {
      const artifact = JSON.parse(readFileSync(parsed.artifactPath, "utf8")) as ProductTaskParityArtifact
      const fixtureSet = createProductTaskNativeCadenceFixtureSet({ artifact })
      const verification = verifyProductTaskNativeCadenceFixtureSet(fixtureSet)
      if (parsed.artifactFormat === "split" || parsed.outDir || parsed.summaryOut) {
        const outDir = parsed.outDir ?? (parsed.out ? resolve(dirname(parsed.out), basenameWithoutJSON(parsed.out)) : resolve("docs/reports/task-parity-native-cadence-fixtures"))
        const splitSet = createProductTaskNativeCadenceFixtureSplitSet({ fixtureSet })
        writeProductTaskNativeCadenceFixtureSplitSet({
          outDir,
          fixtureSet: splitSet,
          ...(parsed.summaryOut || parsed.out ? { summaryOut: parsed.summaryOut ?? parsed.out } : {}),
        })
        if (parsed.json) io.stdout.write(`${JSON.stringify({ fixtureSet: splitSet.summary, verification: verifyProductTaskNativeCadenceFixtureSet(splitSet), outDir }, null, 2)}\n`)
      } else {
        if (parsed.out) writeProductTaskNativeCadenceFixtureSet(parsed.out, fixtureSet)
        if (parsed.json) io.stdout.write(`${JSON.stringify({ fixtureSet, verification }, null, 2)}\n`)
      }
      if (!parsed.json) io.stdout.write(formatTaskParityNativeCadenceFixtures(fixtureSet, verification, parsed.artifactPath, parsed.out))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "task-parity-replay-native-cadence") {
      const rawFixtureSet = JSON.parse(readFileSync(parsed.fixturePath, "utf8")) as unknown
      const splitFixtureSet = isNativeCadenceFixtureSummaryFile(rawFixtureSet, parsed.fixturePath) ? readProductTaskNativeCadenceFixtureSplitSet(parsed.fixturePath) : undefined
      const fixtureSet = splitFixtureSet
        ? {
            schemaVersion: 1 as const,
            generatedAt: splitFixtureSet.summary.generatedAt,
            sourceArtifact: splitFixtureSet.summary.sourceArtifact,
            fixtures: splitFixtureSet.attachments.map((attachment) => attachment.content),
          }
        : (rawFixtureSet as ProductTaskNativeCadenceFixtureSet)
      const verification = verifyProductTaskNativeCadenceFixtureSet(fixtureSet)
      const replays = fixtureSet.fixtures.map((fixture) => ({
        product: fixture.product,
        taskID: fixture.taskID,
        nativeVersion: fixture.nativeVersion,
        cadenceSignature: replayProductTaskNativeCadenceFixture(fixture),
        observationShape: fixture.observationShape,
        projectionLosses: fixture.projectionLosses,
      }))
      const output = buildTaskParityNativeCadenceReplayArtifact({
        fixturePath: parsed.fixturePath,
        fixtureSet,
        verification,
        replays,
      })
      if (parsed.out) {
        mkdirSync(dirname(parsed.out), { recursive: true })
        writeFileSync(parsed.out, `${JSON.stringify(output, null, 2)}\n`, "utf8")
      }
      if (parsed.json) io.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
      else io.stdout.write(formatTaskParityReplayNativeCadence(output, parsed.fixturePath, parsed.out))
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "harness-differential") {
      if (!isHarnessDifferentialProduct(parsed.product)) {
        throw new CliUsageError("harness-differential does not support opencode-pi-hybrid because it has no single native original baseline; use task-parity --mode assembled for the hybrid harness.")
      }
      const report = await runHarnessDifferential(parsed.product, {
        ...(parsed.prompt ? { prompt: parsed.prompt } : {}),
        ...(parsed.assistantText ? { assistantText: parsed.assistantText } : {}),
        ...(parsed.nativeOriginal ? { originalSource: "native" } : {}),
        ...(parsed.nativeOriginal
          ? {
              native: {
                ...(parsed.modelID ? { modelID: parsed.modelID } : {}),
                ...(parsed.apiKey ? { apiKey: parsed.apiKey } : {}),
                ...(parsed.baseURL ? { baseURL: parsed.baseURL } : {}),
                ...(parsed.packageSpec ? { packageSpec: parsed.packageSpec } : {}),
                ...(parsed.timeoutMs ? { timeoutMs: parsed.timeoutMs } : {}),
              },
            }
          : {}),
      })
      if (parsed.json) io.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
      else io.stdout.write(formatOpenCodeDifferentialReport(report))
      return report.ok ? 0 : 1
    }
    if (parsed.command === "nanobot-lego-depth") {
      const report = auditNanobotLegoDepth({ cwd: process.cwd() })
      const verification = verifyNanobotLegoDepthReport(report)
      if (parsed.out || parsed.markdown) {
        writeNanobotLegoDepthReport({
          report,
          jsonPath: parsed.out ?? resolve("docs/reports/nanobot-lego-depth.json"),
          markdownPath: parsed.markdown ?? resolve("docs/reports/nanobot-lego-depth.md"),
        })
      }
      if (parsed.json) io.stdout.write(`${JSON.stringify({ report, verification }, null, 2)}\n`)
      else io.stdout.write(`Nanobot lego depth: ${verification.ok ? "ok" : "issues-found"}\nMechanisms: ${report.mechanisms.length}\nGaps: ${report.gaps.join(", ") || "none"}\n`)
      return verification.ok ? 0 : 1
    }
    if (parsed.command === "recipe-inspect" || parsed.command === "recipe-graph" || parsed.command === "recipe-validate") {
      const recipe = recipeByID(parsed.recipeID)
      const compiled = compileRecipe(recipe)
      if (parsed.json) {
        io.stdout.write(`${JSON.stringify(recipeCommandJSON(parsed.command, compiled), null, 2)}\n`)
      } else {
        io.stdout.write(formatRecipeCommand(parsed.command, compiled))
      }
      return 0
    }
    if (parsed.command === "recipe-validate-file" || parsed.command === "recipe-graph-file") {
      const recipe = parseRecipe(JSON.parse(readFileSync(parsed.recipeFilePath, "utf8")))
      const compiled = compileRecipe(recipe)
      const output = {
        ...(recipeCommandJSON(parsed.command === "recipe-graph-file" ? "recipe-graph" : "recipe-validate", compiled) as Record<string, unknown>),
        source: parsed.recipeFilePath,
      }
      if (parsed.json) io.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
      else {
        if (parsed.command === "recipe-graph-file") io.stdout.write(formatRecipeCommand("recipe-graph", compiled))
        else io.stdout.write(`Recipe ${compiled.id}: valid\nSource: ${parsed.recipeFilePath}\nModules: ${compiled.modules.length}\nBindings: ${compiled.bindings.length}\n`)
      }
      return 0
    }
    if (parsed.command === "recipe-diff") {
      const left = recipeByID(parsed.leftRecipeID)
      const right = recipeByID(parsed.rightRecipeID)
      const diff = diffRecipes(left, right)
      if (parsed.json) io.stdout.write(`${JSON.stringify(diff, null, 2)}\n`)
      else io.stdout.write(formatRecipeDiff(diff))
      return 0
    }
    if (parsed.command === "recipe-compose") {
      const recipe = applyRecipeOverrides(recipeByID(parsed.recipeID), parsed.overrides)
      const compiled = compileRecipe(recipe)
      const output = {
        id: compiled.id,
        version: compiled.version,
        overrides: parsed.overrides,
        graph: compiled.graph,
        bindings: compiled.bindings,
        lockfile: compiled.lockfile,
      }
      if (parsed.json) io.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
      else io.stdout.write(formatRecipeCompose(compiled, parsed.overrides))
      return 0
    }
    if (parsed.command !== "run") throw new CliUsageError(`Unhandled command: ${parsed.command}`)

    const harness = assembleHarness(parsed.product, {
      ...(parsed.cwd ? { cwd: parsed.cwd } : {}),
      ...(parsed.storageDir ? { storageDir: parsed.storageDir } : {}),
    })
    const result = await harness.runTurn({
      text: parsed.prompt,
      provider: createCliProvider(parsed.provider),
      ...(parsed.maxSteps ? { maxSteps: parsed.maxSteps } : {}),
      ...(parsed.maxRetries === undefined ? {} : { maxRetries: parsed.maxRetries }),
      ...(parsed.syntheticContinue === undefined ? {} : { syntheticContinue: parsed.syntheticContinue }),
      ...(parsed.maxSyntheticContinues === undefined ? {} : { maxSyntheticContinues: parsed.maxSyntheticContinues }),
    })

    const output = {
      product: harness.product,
      graph: harness.graph,
      session: result.session,
      blockedTools: result.blockedTools,
      steps: result.steps,
      retries: result.retries,
      syntheticContinues: result.syntheticContinues,
      ...(result.finish ? { finish: result.finish } : {}),
      ...(result.error ? { error: result.error } : {}),
      transcript: result.transcript.map(summarizeMessage),
      assistantParts: result.assistantMessage.parts,
    }
    if (parsed.nativeJsonEvents) {
      io.stdout.write(productCLIEventJSONLines(productCLIProtocolProduct(harness.product), result))
    } else if (parsed.json) {
      io.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
    } else {
      io.stdout.write(formatHumanOutput(output))
    }
    return 0
  } catch (error) {
    const exitCode = error instanceof CliUsageError ? error.exitCode : 1
    io.stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n${usage()}\n`)
    return exitCode
  }
}

function parseRecipeSingleArgs(
  command: Extract<ParsedCliArgs, { command: "recipe-inspect" | "recipe-graph" | "recipe-validate" }>["command"],
  argv: string[],
  startIndex: number,
): Extract<ParsedCliArgs, { command: "recipe-inspect" | "recipe-graph" | "recipe-validate" }> {
  const recipeID = argv[startIndex]
  if (!recipeID || recipeID.startsWith("--")) throw new CliUsageError(`${command.replace("recipe-", "")} recipe requires a recipe id`)
  let json = false
  for (let index = startIndex + 1; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return { command, recipeID, json }
}

function parseRecipeFileArgs(
  command: Extract<ParsedCliArgs, { command: "recipe-validate-file" | "recipe-graph-file" }>["command"],
  argv: string[],
  startIndex: number,
): Extract<ParsedCliArgs, { command: "recipe-validate-file" | "recipe-graph-file" }> {
  const recipeFilePath = argv[startIndex]
  if (!recipeFilePath || recipeFilePath.startsWith("--")) throw new CliUsageError(`${command === "recipe-graph-file" ? "graph" : "validate"} recipe-file requires a JSON file path`)
  let json = false
  for (let index = startIndex + 1; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return { command, recipeFilePath: resolve(recipeFilePath), json }
}

function parseRecipeDiffArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "recipe-diff" }> {
  const leftRecipeID = argv[startIndex]
  const rightRecipeID = argv[startIndex + 1]
  if (!leftRecipeID || leftRecipeID.startsWith("--") || !rightRecipeID || rightRecipeID.startsWith("--")) {
    throw new CliUsageError("diff recipe requires two recipe ids")
  }
  let json = false
  for (let index = startIndex + 2; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return { command: "recipe-diff", leftRecipeID, rightRecipeID, json }
}

function parseRecipeComposeArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "recipe-compose" }> {
  let recipeID: string | undefined
  let json = false
  const overrides: LegoRecipeBinding[] = []
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--recipe") {
      recipeID = readValue(argv, ++index, "--recipe")
      continue
    }
    if (arg === "--override") {
      overrides.push(parseRecipeOverride(readValue(argv, ++index, "--override")))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!recipeID) throw new CliUsageError("compose requires --recipe <id>")
  if (overrides.length === 0) throw new CliUsageError("compose requires at least one --override <port=module>")
  return { command: "recipe-compose", recipeID, overrides, json }
}

function parseExternalToolsArgs(argv: string[], startIndex: number): Extract<
  ParsedCliArgs,
  { command: "external-tools-list" | "external-tools-doctor" | "external-tools-capture" | "external-tools-import" | "external-tools-verify" | "external-tools-verify-run-manifest" | "external-tools-to-native-cadence" }
> {
  const action = argv[startIndex]
  if (!action || action === "list") {
    let json = false
    for (let index = startIndex + (action ? 1 : 0); index < argv.length; index++) {
      const arg = argv[index]
      if (arg === "--json") {
        json = true
        continue
      }
      throw new CliUsageError(`Unknown external-tools list option: ${arg}`)
    }
    return { command: "external-tools-list", json }
  }
  if (action === "doctor") {
    let toolID: ExternalToolID | undefined
    let toolPath: string | undefined
    let strategy: ExternalToolInvocationStrategy | undefined
    let requireTool = false
    let json = false
    for (let index = startIndex + 1; index < argv.length; index++) {
      const arg = argv[index] ?? ""
      if (arg === "--json") {
        json = true
        continue
      }
      if (arg === "--require-tool") {
        requireTool = true
        continue
      }
      if (arg === "--tool-path") {
        toolPath = resolve(readValue(argv, ++index, "--tool-path"))
        continue
      }
      if (arg === "--strategy" || arg === "--tool-strategy") {
        strategy = parseExternalToolInvocationStrategy(readValue(argv, ++index, arg))
        continue
      }
      if (!arg.startsWith("--") && !toolID) {
        toolID = parseExternalToolID(arg)
        continue
      }
      throw new CliUsageError(`Unknown external-tools doctor option: ${arg}`)
    }
    validateExternalToolInvocationOptions(toolPath, strategy)
    return {
      command: "external-tools-doctor",
      ...(toolID ? { toolID } : {}),
      ...(toolPath ? { toolPath } : {}),
      ...(strategy ? { strategy } : {}),
      requireTool,
      json,
    }
  }
  if (action === "import") {
    const toolID = parseExternalToolID(readValue(argv, startIndex + 1, "external-tools import <tool>"))
    let artifactPath: string | undefined
    let product: ExternalToolProduct | undefined
    let taskID: string | undefined
    let out: string | undefined
    let outDir: string | undefined
    let publishReport = false
    let json = false
    for (let index = startIndex + 2; index < argv.length; index++) {
      const arg = argv[index]
      if (arg === "--json") {
        json = true
        continue
      }
      if (arg === "--publish-report") {
        publishReport = true
        continue
      }
      if (arg === "--artifact") {
        artifactPath = resolve(readValue(argv, ++index, "--artifact"))
        continue
      }
      if (arg === "--product") {
        product = parseExternalToolProduct(readValue(argv, ++index, "--product"))
        continue
      }
      if (arg === "--task" || arg === "--task-id") {
        taskID = readValue(argv, ++index, arg)
        continue
      }
      if (arg === "--out") {
        out = resolve(readValue(argv, ++index, "--out"))
        continue
      }
      if (arg === "--out-dir") {
        outDir = resolve(readValue(argv, ++index, "--out-dir"))
        continue
      }
      throw new CliUsageError(`Unknown external-tools import option: ${arg}`)
    }
    if (!artifactPath) throw new CliUsageError("external-tools import requires --artifact <path>")
    if (!product) throw new CliUsageError("external-tools import requires --product <product>")
    return {
      command: "external-tools-import",
      toolID,
      artifactPath,
      product,
      ...(taskID ? { taskID } : {}),
      ...(out ? { out } : {}),
      ...(outDir ? { outDir } : {}),
      publishReport,
      json,
    }
  }
  if (action === "capture") {
    const toolID = parseExternalToolID(readValue(argv, startIndex + 1, "external-tools capture <tool>"))
    let product: ExternalToolProduct | undefined
    let taskID: string | undefined
    let outDir: string | undefined
    let toolPath: string | undefined
    let strategy: ExternalToolInvocationStrategy | undefined
    let dryRun = false
    let captureMode: "real-capture" | "capture-only" = "real-capture"
    let requireTool = false
    let json = false
    const delimiter = argv.indexOf("--", startIndex + 2)
    const optionEnd = delimiter >= 0 ? delimiter : argv.length
    for (let index = startIndex + 2; index < optionEnd; index++) {
      const arg = argv[index]
      if (arg === "--json") {
        json = true
        continue
      }
      if (arg === "--dry-run") {
        dryRun = true
        continue
      }
      if (arg === "--capture-only") {
        captureMode = "capture-only"
        continue
      }
      if (arg === "--require-tool") {
        requireTool = true
        continue
      }
      if (arg === "--product") {
        product = parseExternalToolProduct(readValue(argv, ++index, "--product"))
        continue
      }
      if (arg === "--task" || arg === "--task-id") {
        taskID = readValue(argv, ++index, arg)
        continue
      }
      if (arg === "--out-dir") {
        outDir = resolve(readValue(argv, ++index, "--out-dir"))
        continue
      }
      if (arg === "--tool-path") {
        toolPath = resolve(readValue(argv, ++index, "--tool-path"))
        continue
      }
      if (arg === "--strategy" || arg === "--tool-strategy") {
        strategy = parseExternalToolInvocationStrategy(readValue(argv, ++index, arg))
        continue
      }
      throw new CliUsageError(`Unknown external-tools capture option: ${arg}`)
    }
    validateExternalToolInvocationOptions(toolPath, strategy)
    const toolArgs = delimiter >= 0 ? argv.slice(delimiter + 1) : []
    return {
      command: "external-tools-capture",
      toolID,
      ...(product ? { product } : {}),
      ...(taskID ? { taskID } : {}),
      ...(outDir ? { outDir } : {}),
      ...(toolPath ? { toolPath } : {}),
      ...(strategy ? { strategy } : {}),
      dryRun,
      captureMode,
      requireTool,
      toolArgs,
      json,
    }
  }
  if (action === "verify") {
    let artifactPath: string | undefined
    let runManifestPath: string | undefined
    let json = false
    for (let index = startIndex + 1; index < argv.length; index++) {
      const arg = argv[index]
      if (arg === "--json") {
        json = true
        continue
      }
      if (arg === "--artifact") {
        artifactPath = resolve(readValue(argv, ++index, "--artifact"))
        continue
      }
      if (arg === "--run-manifest" || arg === "--manifest") {
        runManifestPath = resolve(readValue(argv, ++index, arg))
        continue
      }
      throw new CliUsageError(`Unknown external-tools verify option: ${arg}`)
    }
    if (!artifactPath) throw new CliUsageError("external-tools verify requires --artifact <path>")
    return { command: "external-tools-verify", artifactPath, ...(runManifestPath ? { runManifestPath } : {}), json }
  }
  if (action === "verify-run-manifest" || action === "verify-manifest") {
    let manifestPath: string | undefined
    let product: ExternalToolProduct | undefined
    let taskID: string | undefined
    let captureMode: ExternalToolCaptureMode | undefined
    let expectedInvocationStrategy: ExternalToolInvocationStrategy | undefined
    let expectedInvocationCommand: string | undefined
    let expectedInvocationArgs: string[] | undefined
    const requiredArtifactRoles: Array<{ path: string; role: ExternalToolArtifactManifest["role"] }> = []
    let allowUnknownToolVersion = false
    let allowEmptyArtifacts = false
    let json = false
    for (let index = startIndex + 1; index < argv.length; index++) {
      const arg = argv[index]
      if (arg === "--json") {
        json = true
        continue
      }
      if (arg === "--manifest" || arg === "--run-manifest") {
        manifestPath = resolve(readValue(argv, ++index, arg))
        continue
      }
      if (arg === "--product") {
        product = parseExternalToolProduct(readValue(argv, ++index, "--product"))
        continue
      }
      if (arg === "--task" || arg === "--task-id") {
        taskID = readValue(argv, ++index, arg)
        continue
      }
      if (arg === "--capture-mode") {
        captureMode = parseExternalToolCaptureMode(readValue(argv, ++index, "--capture-mode"))
        continue
      }
      if (arg === "--strategy" || arg === "--expect-strategy") {
        expectedInvocationStrategy = parseExternalToolInvocationStrategy(readValue(argv, ++index, arg))
        continue
      }
      if (arg === "--expect-command") {
        expectedInvocationCommand = readValue(argv, ++index, "--expect-command")
        continue
      }
      if (arg === "--expect-args-json") {
        expectedInvocationArgs = parseExternalToolExpectedInvocationArgs(readValue(argv, ++index, "--expect-args-json"))
        continue
      }
      if (arg === "--require-artifact") {
        requiredArtifactRoles.push(parseExternalToolRequiredArtifactRole(readValue(argv, ++index, "--require-artifact")))
        continue
      }
      if (arg === "--allow-unknown-tool-version") {
        allowUnknownToolVersion = true
        continue
      }
      if (arg === "--allow-empty-artifacts") {
        allowEmptyArtifacts = true
        continue
      }
      throw new CliUsageError(`Unknown external-tools verify-run-manifest option: ${arg}`)
    }
    if (!manifestPath) throw new CliUsageError("external-tools verify-run-manifest requires --manifest <path>")
    return {
      command: "external-tools-verify-run-manifest",
      manifestPath,
      ...(product ? { product } : {}),
      ...(taskID ? { taskID } : {}),
      ...(captureMode ? { captureMode } : {}),
      ...(expectedInvocationStrategy ? { expectedInvocationStrategy } : {}),
      ...(expectedInvocationCommand ? { expectedInvocationCommand } : {}),
      ...(expectedInvocationArgs ? { expectedInvocationArgs } : {}),
      allowUnknownToolVersion,
      allowEmptyArtifacts,
      requiredArtifactRoles,
      json,
    }
  }
  if (action === "to-native-cadence") {
    let artifactPath: string | undefined
    let out: string | undefined
    let json = false
    for (let index = startIndex + 1; index < argv.length; index++) {
      const arg = argv[index]
      if (arg === "--json") {
        json = true
        continue
      }
      if (arg === "--artifact") {
        artifactPath = resolve(readValue(argv, ++index, "--artifact"))
        continue
      }
      if (arg === "--out") {
        out = resolve(readValue(argv, ++index, "--out"))
        continue
      }
      throw new CliUsageError(`Unknown external-tools to-native-cadence option: ${arg}`)
    }
    if (!artifactPath) throw new CliUsageError("external-tools to-native-cadence requires --artifact <path>")
    return {
      command: "external-tools-to-native-cadence",
      artifactPath,
      ...(out ? { out } : {}),
      json,
    }
  }
  throw new CliUsageError(`Unknown external-tools command: ${action}`)
}

function parseTuiArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "tui" }> {
  let recipeFilePath: string | undefined
  let profileName: string | undefined
  let rootDir: string | undefined
  let providerMode: HarnessTuiProviderMode = "profile-live"
  let text: string | undefined
  let cwd: string | undefined
  let storageDir: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--json") { json = true; continue }
    if (arg === "--recipe-file" || arg === "--builder-recipe") { recipeFilePath = resolve(readValue(argv, ++index, arg)); continue }
    if (arg === "--profile") { profileName = readValue(argv, ++index, "--profile"); continue }
    if (arg === "--provider") { providerMode = parseTuiProviderMode(readValue(argv, ++index, "--provider")); continue }
    if (arg === "--text") { text = readValue(argv, ++index, "--text"); continue }
    if (arg === "--root-dir" || arg === "--profile-root") { rootDir = resolve(readValue(argv, ++index, arg)); continue }
    if (arg === "--cwd") { cwd = resolve(readValue(argv, ++index, "--cwd")); continue }
    if (arg === "--storage-dir") { storageDir = resolve(readValue(argv, ++index, "--storage-dir")); continue }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (recipeFilePath && profileName) throw new CliUsageError("tui requires either --recipe-file <path> or --profile <name>, not both")
  if (!recipeFilePath && !profileName) throw new CliUsageError("tui requires --recipe-file <path> or --profile <name>")
  return {
    command: "tui",
    ...(recipeFilePath ? { recipeFilePath } : {}),
    ...(profileName ? { profileName } : {}),
    ...(rootDir ? { rootDir } : {}),
    providerMode,
    ...(text !== undefined ? { text } : {}),
    ...(cwd ? { cwd } : {}),
    ...(storageDir ? { storageDir } : {}),
    json,
  }
}

function parseProfileArgs(argv: string[], startIndex: number): Extract<
  ParsedCliArgs,
  { command: "profile-install" | "profile-list" | "profile-status" | "profile-remove" | "profile-configure-provider" }
> {
  const action = argv[startIndex]
  if (action === "install") {
    let name: string | undefined
    let recipeFilePath: string | undefined
    let rootDir: string | undefined
    let workspaceDir: string | undefined
    let storageDir: string | undefined
    let json = false
    for (let index = startIndex + 1; index < argv.length; index++) {
      const arg = argv[index]
      if (arg === "--json") { json = true; continue }
      if (arg === "--name") { name = readValue(argv, ++index, "--name"); continue }
      if (arg === "--recipe-file" || arg === "--builder-recipe") { recipeFilePath = resolve(readValue(argv, ++index, arg)); continue }
      if (arg === "--root-dir" || arg === "--profile-root") { rootDir = resolve(readValue(argv, ++index, arg)); continue }
      if (arg === "--workspace-dir") { workspaceDir = resolve(readValue(argv, ++index, "--workspace-dir")); continue }
      if (arg === "--storage-dir") { storageDir = resolve(readValue(argv, ++index, "--storage-dir")); continue }
      throw new CliUsageError(`Unknown option: ${arg}`)
    }
    if (!name) throw new CliUsageError("profile install requires --name <name>")
    if (!recipeFilePath) throw new CliUsageError("profile install requires --recipe-file <path>")
    return {
      command: "profile-install",
      name,
      recipeFilePath,
      ...(rootDir ? { rootDir } : {}),
      ...(workspaceDir ? { workspaceDir } : {}),
      ...(storageDir ? { storageDir } : {}),
      json,
    }
  }
  if (action === "list") {
    const options = parseProfileCommonOptions(argv, startIndex + 1)
    return { command: "profile-list", ...(options.rootDir ? { rootDir: options.rootDir } : {}), json: options.json }
  }
  if (action === "status") {
    const name = argv[startIndex + 1]
    if (!name || name.startsWith("--")) throw new CliUsageError("profile status requires <name>")
    const options = parseProfileCommonOptions(argv, startIndex + 2)
    return { command: "profile-status", name, ...(options.rootDir ? { rootDir: options.rootDir } : {}), json: options.json }
  }
  if (action === "remove") {
    const name = argv[startIndex + 1]
    if (!name || name.startsWith("--")) throw new CliUsageError("profile remove requires <name>")
    let purge = false
    let rootDir: string | undefined
    let json = false
    for (let index = startIndex + 2; index < argv.length; index++) {
      const arg = argv[index]
      if (arg === "--json") { json = true; continue }
      if (arg === "--purge") { purge = true; continue }
      if (arg === "--root-dir" || arg === "--profile-root") { rootDir = resolve(readValue(argv, ++index, arg)); continue }
      throw new CliUsageError(`Unknown option: ${arg}`)
    }
    return { command: "profile-remove", name, ...(rootDir ? { rootDir } : {}), purge, json }
  }
  if (action === "configure-provider") {
    const name = argv[startIndex + 1]
    if (!name || name.startsWith("--")) throw new CliUsageError("profile configure-provider requires <name>")
    let provider: InstalledProviderKind | undefined
    let modelID: string | undefined
    let baseURL: string | undefined
    let appURL: string | undefined
    let appName: string | undefined
    let apiKeyEnv: string | undefined
    let rootDir: string | undefined
    let json = false
    for (let index = startIndex + 2; index < argv.length; index++) {
      const arg = argv[index]
      if (arg === "--json") { json = true; continue }
      if (arg === "--provider") { provider = parseInstalledProviderKind(readValue(argv, ++index, "--provider")); continue }
      if (arg === "--model") { modelID = readValue(argv, ++index, "--model"); continue }
      if (arg === "--base-url") { baseURL = readValue(argv, ++index, "--base-url"); continue }
      if (arg === "--app-url") { appURL = readValue(argv, ++index, "--app-url"); continue }
      if (arg === "--app-name") { appName = readValue(argv, ++index, "--app-name"); continue }
      if (arg === "--api-key-env") { apiKeyEnv = readValue(argv, ++index, "--api-key-env"); continue }
      if (arg === "--root-dir" || arg === "--profile-root") { rootDir = resolve(readValue(argv, ++index, arg)); continue }
      throw new CliUsageError(`Unknown option: ${arg}`)
    }
    if (!provider) throw new CliUsageError("profile configure-provider requires --provider <kind>")
    return {
      command: "profile-configure-provider",
      name,
      provider,
      ...(rootDir ? { rootDir } : {}),
      ...(modelID ? { modelID } : {}),
      ...(baseURL ? { baseURL } : {}),
      ...(appURL ? { appURL } : {}),
      ...(appName ? { appName } : {}),
      ...(apiKeyEnv ? { apiKeyEnv } : {}),
      json,
    }
  }
  throw new CliUsageError(`Unknown profile command: ${action ?? "<missing>"}`)
}

function parseChannelArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "channel-add-telegram" | "channel-status-telegram" | "channel-remove-telegram" }> {
  const action = argv[startIndex]
  if (action === "add") {
    const name = argv[startIndex + 1]
    const channel = argv[startIndex + 2]
    if (!name || name.startsWith("--") || channel !== "telegram") throw new CliUsageError("channel add requires <name> telegram")
    let mode: TelegramGatewayMode | undefined
    let botTokenEnv: string | undefined
    let rootDir: string | undefined
    let webhookURL: string | undefined
    let webhookSecretEnv: string | undefined
    let json = false
    const allowedChatIDs: string[] = []
    const allowedUserIDs: string[] = []
    for (let index = startIndex + 3; index < argv.length; index++) {
      const arg = argv[index]
      if (arg === "--json") { json = true; continue }
      if (arg === "--mode") { mode = parseTelegramGatewayMode(readValue(argv, ++index, "--mode")); continue }
      if (arg === "--bot-token-env") { botTokenEnv = readValue(argv, ++index, "--bot-token-env"); continue }
      if (arg === "--allowed-chat" || arg === "--allowed-chat-id") { allowedChatIDs.push(...csv(readValue(argv, ++index, arg))); continue }
      if (arg === "--allowed-user" || arg === "--allowed-user-id") { allowedUserIDs.push(...csv(readValue(argv, ++index, arg))); continue }
      if (arg === "--webhook-url") { webhookURL = readValue(argv, ++index, "--webhook-url"); continue }
      if (arg === "--webhook-secret-env") { webhookSecretEnv = readValue(argv, ++index, "--webhook-secret-env"); continue }
      if (arg === "--root-dir" || arg === "--profile-root") { rootDir = resolve(readValue(argv, ++index, arg)); continue }
      throw new CliUsageError(`Unknown option: ${arg}`)
    }
    return {
      command: "channel-add-telegram",
      name,
      ...(rootDir ? { rootDir } : {}),
      ...(mode ? { mode } : {}),
      ...(botTokenEnv ? { botTokenEnv } : {}),
      ...(allowedChatIDs.length ? { allowedChatIDs: [...new Set(allowedChatIDs)] } : {}),
      ...(allowedUserIDs.length ? { allowedUserIDs: [...new Set(allowedUserIDs)] } : {}),
      ...(webhookURL ? { webhookURL } : {}),
      ...(webhookSecretEnv ? { webhookSecretEnv } : {}),
      json,
    }
  }
  if (action === "status" || action === "remove") {
    const name = argv[startIndex + 1]
    const channel = argv[startIndex + 2]
    if (!name || name.startsWith("--") || channel !== "telegram") throw new CliUsageError(`channel ${action} requires <name> telegram`)
    const options = parseProfileCommonOptions(argv, startIndex + 3)
    return {
      command: action === "status" ? "channel-status-telegram" : "channel-remove-telegram",
      name,
      ...(options.rootDir ? { rootDir: options.rootDir } : {}),
      json: options.json,
    }
  }
  throw new CliUsageError(`Unknown channel command: ${action ?? "<missing>"}`)
}

function parseGatewayArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "gateway-start" | "gateway-stop" | "gateway-restart" | "gateway-status" | "gateway-logs" | "gateway-manifests" | "gateway-smoke" | "gateway-smoke-local" | "gateway-worker" }> {
  const action = argv[startIndex]
  const name = argv[startIndex + 1]
  if (!name || name.startsWith("--")) throw new CliUsageError(`gateway ${action ?? "<missing>"} requires <name>`)
  let rootDir: string | undefined
  let channel: "telegram" = "telegram"
  let json = false
  let text = "hello"
  let chatID: string | undefined
  let senderID: string | undefined
  let lines: number | undefined
  let once = false
  let live = false
  for (let index = startIndex + 2; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") { json = true; continue }
    if (arg === "--channel") {
      const value = readValue(argv, ++index, "--channel")
      if (value !== "telegram") throw new CliUsageError("gateway only supports --channel telegram")
      channel = "telegram"
      continue
    }
    if (arg === "--text") { text = readValue(argv, ++index, "--text"); continue }
    if (arg === "--live") { live = true; continue }
    if (arg === "--chat-id") { chatID = readValue(argv, ++index, "--chat-id"); continue }
    if (arg === "--sender-id") { senderID = readValue(argv, ++index, "--sender-id"); continue }
    if (arg === "--lines") { lines = parsePositiveInt(readValue(argv, ++index, "--lines"), "--lines"); continue }
    if (arg === "--once") { once = true; continue }
    if (arg === "--root-dir" || arg === "--profile-root") { rootDir = resolve(readValue(argv, ++index, arg)); continue }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (action === "smoke") return { command: "gateway-smoke", name, channel, text, ...(rootDir ? { rootDir } : {}), ...(chatID ? { chatID } : {}), ...(senderID ? { senderID } : {}), live: true, json }
  if (action === "smoke-local") {
    if (live) throw new CliUsageError("gateway smoke-local uses a local fixture transport; remove --live or run gateway smoke for a real Telegram smoke.")
    return { command: "gateway-smoke-local", name, channel, text, ...(rootDir ? { rootDir } : {}), ...(chatID ? { chatID } : {}), ...(senderID ? { senderID } : {}), live: false, json }
  }
  if (action === "worker") return { command: "gateway-worker", name, channel, once, ...(rootDir ? { rootDir } : {}), json }
  if (action === "start" || action === "stop" || action === "restart" || action === "status" || action === "logs" || action === "manifests") {
    return {
      command: `gateway-${action}` as "gateway-start" | "gateway-stop" | "gateway-restart" | "gateway-status" | "gateway-logs" | "gateway-manifests",
      name,
      channel,
      ...(rootDir ? { rootDir } : {}),
      ...(lines ? { lines } : {}),
      json,
    }
  }
  throw new CliUsageError(`Unknown gateway command: ${action ?? "<missing>"}`)
}

function parseLiveProviderParityArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "live-provider-parity" }> {
  let provider: LiveProviderKind | undefined
  let modelID: string | undefined
  let apiKey: string | undefined
  let baseURL: string | undefined
  let appURL: string | undefined
  let appName: string | undefined
  let prompt: string | undefined
  let json = false
  let out: string | undefined
  let artifactFormat: "legacy" | "split" | undefined
  let outDir: string | undefined
  let summaryOut: string | undefined
  let cwd: string | undefined
  let maxSteps: number | undefined
  let maxRetries: number | undefined
  let maxOutputTokens: number | undefined
  let requireCredentials: boolean | undefined
  const products: HarnessProduct[] = []

  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--require-credentials") {
      requireCredentials = true
      continue
    }
    if (arg === "--provider") {
      provider = parseLiveProviderKind(readValue(argv, ++index, "--provider"))
      continue
    }
    if (arg === "--model") {
      modelID = readValue(argv, ++index, "--model")
      continue
    }
    if (arg === "--api-key") {
      apiKey = readValue(argv, ++index, "--api-key")
      continue
    }
    if (arg === "--base-url") {
      baseURL = readValue(argv, ++index, "--base-url")
      continue
    }
    if (arg === "--app-url") {
      appURL = readValue(argv, ++index, "--app-url")
      continue
    }
    if (arg === "--app-name") {
      appName = readValue(argv, ++index, "--app-name")
      continue
    }
    if (arg === "--prompt") {
      prompt = readValue(argv, ++index, "--prompt")
      continue
    }
    if (arg === "--product") {
      products.push(...readValue(argv, ++index, "--product").split(",").map(parseProduct))
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    if (arg === "--artifact-format") {
      artifactFormat = parseArtifactFormat(readValue(argv, ++index, "--artifact-format"))
      continue
    }
    if (arg === "--out-dir") {
      outDir = resolve(readValue(argv, ++index, "--out-dir"))
      continue
    }
    if (arg === "--summary-out") {
      summaryOut = resolve(readValue(argv, ++index, "--summary-out"))
      continue
    }
    if (arg === "--cwd") {
      cwd = resolve(readValue(argv, ++index, "--cwd"))
      continue
    }
    if (arg === "--max-steps") {
      maxSteps = parsePositiveInt(readValue(argv, ++index, "--max-steps"), "--max-steps")
      continue
    }
    if (arg === "--max-retries") {
      maxRetries = parseNonNegativeInt(readValue(argv, ++index, "--max-retries"), "--max-retries")
      continue
    }
    if (arg === "--max-output-tokens") {
      maxOutputTokens = parsePositiveInt(readValue(argv, ++index, "--max-output-tokens"), "--max-output-tokens")
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }

  return {
    command: "live-provider-parity",
    ...(provider ? { provider } : {}),
    ...(modelID ? { modelID } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(baseURL ? { baseURL } : {}),
    ...(appURL ? { appURL } : {}),
    ...(appName ? { appName } : {}),
    ...(prompt ? { prompt } : {}),
    ...(products.length > 0 ? { products: [...new Set(products)] } : {}),
    json,
    ...(out ? { out } : {}),
    ...(artifactFormat ? { artifactFormat } : {}),
    ...(outDir ? { outDir } : {}),
    ...(summaryOut ? { summaryOut } : {}),
    ...(cwd ? { cwd } : {}),
    ...(maxSteps ? { maxSteps } : {}),
    ...(maxRetries === undefined ? {} : { maxRetries }),
    ...(maxOutputTokens === undefined ? {} : { maxOutputTokens }),
    ...(requireCredentials === undefined ? {} : { requireCredentials }),
  }
}

function parseVerifyLiveProviderParityArgs(
  argv: string[],
  startIndex: number,
): Extract<ParsedCliArgs, { command: "verify-live-provider-parity" }> {
  let artifactPath: string | undefined
  let provider: LiveProviderKind | undefined
  let modelID: string | undefined
  let maxAgeMs: number | undefined
  let json = false
  const products: HarnessProduct[] = []

  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--provider") {
      provider = parseLiveProviderKind(readValue(argv, ++index, "--provider"))
      continue
    }
    if (arg === "--model") {
      modelID = readValue(argv, ++index, "--model")
      continue
    }
    if (arg === "--product") {
      products.push(...readValue(argv, ++index, "--product").split(",").map(parseProduct))
      continue
    }
    if (arg === "--max-age-ms") {
      maxAgeMs = parsePositiveInt(readValue(argv, ++index, "--max-age-ms"), "--max-age-ms")
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("verify-live-provider-parity requires --artifact <path>")
  return {
    command: "verify-live-provider-parity",
    artifactPath,
    ...(provider ? { provider } : {}),
    ...(modelID ? { modelID } : {}),
    ...(products.length > 0 ? { products: [...new Set(products)] } : {}),
    ...(maxAgeMs === undefined ? {} : { maxAgeMs }),
    json,
  }
}

function parseLiveProviderMigrateArtifactArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "live-provider-migrate-artifact" }> {
  let artifactPath: string | undefined
  let outDir: string | undefined
  let summaryOut: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--out-dir") {
      outDir = resolve(readValue(argv, ++index, "--out-dir"))
      continue
    }
    if (arg === "--summary-out") {
      summaryOut = resolve(readValue(argv, ++index, "--summary-out"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("live-provider-parity migrate-artifact requires --artifact <path>")
  if (!outDir) throw new CliUsageError("live-provider-parity migrate-artifact requires --out-dir <dir>")
  return {
    command: "live-provider-migrate-artifact",
    artifactPath,
    outDir,
    ...(summaryOut ? { summaryOut } : {}),
    json,
  }
}

function parseHarnessDifferentialArgs(
  product: HarnessProduct,
  argv: string[],
  startIndex: number,
): Extract<ParsedCliArgs, { command: "harness-differential" }> {
  let prompt: string | undefined
  let assistantText: string | undefined
  let nativeOriginal: boolean | undefined
  let modelID: string | undefined
  let apiKey: string | undefined
  let baseURL: string | undefined
  let packageSpec: string | undefined
  let timeoutMs: number | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--prompt") {
      prompt = readValue(argv, ++index, "--prompt")
      continue
    }
    if (arg === "--assistant") {
      assistantText = readValue(argv, ++index, "--assistant")
      continue
    }
    if (arg === "--native-original") {
      nativeOriginal = true
      continue
    }
    if (arg === "--model") {
      modelID = readValue(argv, ++index, "--model")
      continue
    }
    if (arg === "--api-key") {
      apiKey = readValue(argv, ++index, "--api-key")
      continue
    }
    if (arg === "--base-url") {
      baseURL = readValue(argv, ++index, "--base-url")
      continue
    }
    if (arg === "--package") {
      packageSpec = readValue(argv, ++index, "--package")
      continue
    }
    if (arg === "--timeout-ms") {
      timeoutMs = parsePositiveInt(readValue(argv, ++index, "--timeout-ms"), "--timeout-ms")
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return {
    command: "harness-differential",
    product,
    ...(prompt ? { prompt } : {}),
    ...(assistantText ? { assistantText } : {}),
    ...(nativeOriginal ? { nativeOriginal } : {}),
    ...(modelID ? { modelID } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(baseURL ? { baseURL } : {}),
    ...(packageSpec ? { packageSpec } : {}),
    ...(timeoutMs ? { timeoutMs } : {}),
    json,
  }
}

function parseNanobotLegoDepthArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "nanobot-lego-depth" }> {
  let out: string | undefined
  let markdown: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    if (arg === "--markdown") {
      markdown = resolve(readValue(argv, ++index, "--markdown"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return { command: "nanobot-lego-depth", ...(out ? { out } : {}), ...(markdown ? { markdown } : {}), json }
}

function parseTaskParityArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "task-parity" }> {
  let suite: string | undefined
  let provider: ProductTaskParityProvider | undefined
  let out: string | undefined
  let nativeOriginal: boolean | undefined
  let requireCredentials: boolean | undefined
  let modelID: string | undefined
  let apiKey: string | undefined
  let baseURL: string | undefined
  let packageSpec: string | undefined
  let timeoutMs: number | undefined
  let externalCapturePath: string | undefined
  let artifactFormat: "legacy" | "split" | undefined
  let outDir: string | undefined
  let summaryOut: string | undefined
  let recipeFilePath: string | undefined
  let json = false
  const taskIDs: string[] = []
  const products: HarnessProduct[] = []
  const modes: ProductTaskParityMode[] = []
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--native-original") {
      nativeOriginal = true
      continue
    }
    if (arg === "--require-credentials") {
      requireCredentials = true
      continue
    }
    if (arg === "--suite") {
      suite = readValue(argv, ++index, "--suite")
      continue
    }
    if (arg === "--model") {
      modelID = readValue(argv, ++index, "--model")
      continue
    }
    if (arg === "--api-key") {
      apiKey = readValue(argv, ++index, "--api-key")
      continue
    }
    if (arg === "--base-url") {
      baseURL = readValue(argv, ++index, "--base-url")
      continue
    }
    if (arg === "--package") {
      packageSpec = readValue(argv, ++index, "--package")
      continue
    }
    if (arg === "--timeout-ms") {
      timeoutMs = parsePositiveInt(readValue(argv, ++index, "--timeout-ms"), "--timeout-ms")
      continue
    }
    if (arg === "--external-capture" || arg === "--with-external-capture") {
      externalCapturePath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--task") {
      taskIDs.push(...readValue(argv, ++index, "--task").split(",").filter(Boolean))
      continue
    }
    if (arg === "--product") {
      products.push(...readValue(argv, ++index, "--product").split(",").map(parseProduct))
      continue
    }
    if (arg === "--recipe-file" || arg === "--builder-recipe") {
      recipeFilePath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--mode") {
      modes.push(...readValue(argv, ++index, "--mode").split(",").map(parseTaskParityMode))
      continue
    }
    if (arg === "--provider") {
      provider = parseTaskParityProvider(readValue(argv, ++index, "--provider"))
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    if (arg === "--out-dir") {
      outDir = resolve(readValue(argv, ++index, "--out-dir"))
      continue
    }
    if (arg === "--summary-out") {
      summaryOut = resolve(readValue(argv, ++index, "--summary-out"))
      continue
    }
    if (arg === "--artifact-format") {
      artifactFormat = parseArtifactFormat(readValue(argv, ++index, "--artifact-format"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (recipeFilePath && products.length > 1) throw new CliUsageError("task-parity --recipe-file can be combined with at most one --product")
  if (recipeFilePath && nativeOriginal) throw new CliUsageError("task-parity --recipe-file only supports assembled mode; omit --native-original")
  if (recipeFilePath && modes.includes("original")) throw new CliUsageError("task-parity --recipe-file only supports --mode assembled")
  if (externalCapturePath && modes.length > 0 && !modes.includes("original")) throw new CliUsageError("task-parity --external-capture requires --mode original or assembled,original.")
  return {
    command: "task-parity",
    ...(suite ? { suite } : {}),
    ...(taskIDs.length > 0 ? { taskIDs: [...new Set(taskIDs)] } : {}),
    ...(products.length > 0 ? { products: [...new Set(products)] } : {}),
    ...(modes.length > 0 ? { modes: [...new Set(modes)] } : recipeFilePath ? { modes: ["assembled"] } : {}),
    ...(recipeFilePath ? { recipeFilePath } : {}),
    ...(provider ? { provider } : {}),
    ...(out ? { out } : {}),
    ...(outDir ? { outDir } : {}),
    ...(summaryOut ? { summaryOut } : {}),
    ...(artifactFormat ? { artifactFormat } : {}),
    ...(nativeOriginal ? { nativeOriginal } : {}),
    ...(requireCredentials === undefined ? {} : { requireCredentials }),
    ...(modelID ? { modelID } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(baseURL ? { baseURL } : {}),
    ...(packageSpec ? { packageSpec } : {}),
    ...(timeoutMs ? { timeoutMs } : {}),
    ...(externalCapturePath ? { externalCapturePath } : {}),
    json,
  }
}

function parseVerifyTaskParityArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "verify-task-parity" }> {
  let artifactPath: string | undefined
  let json = false
  const taskIDs: string[] = []
  const products: HarnessProduct[] = []
  const modes: ProductTaskParityMode[] = []
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--task") {
      taskIDs.push(...readValue(argv, ++index, "--task").split(",").filter(Boolean))
      continue
    }
    if (arg === "--product") {
      products.push(...readValue(argv, ++index, "--product").split(",").map(parseProduct))
      continue
    }
    if (arg === "--mode") {
      modes.push(...readValue(argv, ++index, "--mode").split(",").map(parseTaskParityMode))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("verify-task-parity requires --artifact <path>")
  return {
    command: "verify-task-parity",
    artifactPath,
    ...(products.length > 0 ? { products: [...new Set(products)] } : {}),
    ...(modes.length > 0 ? { modes: [...new Set(modes)] } : {}),
    ...(taskIDs.length > 0 ? { taskIDs: [...new Set(taskIDs)] } : {}),
    json,
  }
}

function parseAssemblyArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "assemble" }> {
  const products: CliAssemblyProduct[] = []
  let recipeID: string | undefined
  let recipeFilePath: string | undefined
  let explain = false
  let json = false
  let out: string | undefined
  let outDir: string | undefined
  let taskParityArtifactPath: string | undefined
  let nativeFixturePath: string | undefined
  const externalCapturePaths: string[] = []
  let externalRunManifestPath: string | undefined
  let requireTaskParity = false
  let requireNativeFixtures = false
  let requireExternalToolEvidence = false
  let strict = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--explain") {
      explain = true
      continue
    }
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--strict") {
      strict = true
      continue
    }
    if (arg === "--recipe") {
      recipeID = readValue(argv, ++index, "--recipe")
      continue
    }
    if (arg === "--recipe-file" || arg === "--builder-recipe") {
      recipeFilePath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--product") {
      products.push(...readValue(argv, ++index, "--product").split(",").filter(Boolean).map(parseAssemblyProduct))
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    if (arg === "--out-dir") {
      outDir = resolve(readValue(argv, ++index, "--out-dir"))
      continue
    }
    if (arg === "--with-task-parity") {
      requireTaskParity = true
      const next = argv[index + 1]
      if (next && !next.startsWith("-")) taskParityArtifactPath = resolve(readValue(argv, ++index, "--with-task-parity"))
      continue
    }
    if (arg === "--task-parity-artifact") {
      requireTaskParity = true
      taskParityArtifactPath = resolve(readValue(argv, ++index, "--task-parity-artifact"))
      continue
    }
    if (arg === "--with-native-fixtures") {
      requireNativeFixtures = true
      const next = argv[index + 1]
      if (next && !next.startsWith("-")) nativeFixturePath = resolve(readValue(argv, ++index, "--with-native-fixtures"))
      continue
    }
    if (arg === "--native-fixture") {
      requireNativeFixtures = true
      nativeFixturePath = resolve(readValue(argv, ++index, "--native-fixture"))
      continue
    }
    if (arg === "--with-external-capture") {
      requireExternalToolEvidence = true
      const next = argv[index + 1]
      if (next && !next.startsWith("-")) externalCapturePaths.push(resolve(readValue(argv, ++index, "--with-external-capture")))
      continue
    }
    if (arg === "--external-capture") {
      requireExternalToolEvidence = true
      externalCapturePaths.push(resolve(readValue(argv, ++index, "--external-capture")))
      continue
    }
    if (arg === "--external-run-manifest") {
      externalRunManifestPath = resolve(readValue(argv, ++index, "--external-run-manifest"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (products.length === 0 && !recipeID && !recipeFilePath) throw new CliUsageError("assemble requires --product <product>, --recipe <id>, or --recipe-file <path>")
  if (recipeFilePath && (products.length > 0 || recipeID)) throw new CliUsageError("assemble --recipe-file cannot be combined with --product or --recipe")
  if (out && (outDir || products.length > 1)) throw new CliUsageError("assemble --out can only be used for a single contract; use --out-dir for multiple products")
  return {
    command: "assemble",
    ...(products.length > 0 ? { products: [...new Set(products)] } : {}),
    ...(recipeID ? { recipeID } : {}),
    ...(recipeFilePath ? { recipeFilePath } : {}),
    explain,
    json,
    ...(out ? { out } : {}),
    ...(outDir ? { outDir } : {}),
    ...(taskParityArtifactPath ? { taskParityArtifactPath } : {}),
    ...(nativeFixturePath ? { nativeFixturePath } : {}),
    externalCapturePaths,
    ...(externalRunManifestPath ? { externalRunManifestPath } : {}),
    requireTaskParity,
    requireNativeFixtures,
    requireExternalToolEvidence,
    strict,
  }
}

function parseVerifyAssemblyContractArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "verify-assembly-contract" }> {
  let artifactPath: string | undefined
  let json = false
  let requireTaskParity = false
  let requireNativeFixtures = false
  let requireExternalToolEvidence = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--with-task-parity" || arg === "--require-task-parity") {
      requireTaskParity = true
      continue
    }
    if (arg === "--with-native-fixtures" || arg === "--require-native-fixtures") {
      requireNativeFixtures = true
      continue
    }
    if (arg === "--with-external-capture" || arg === "--require-external-tool-evidence") {
      requireExternalToolEvidence = true
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("verify-assembly-contract requires --artifact <path>")
  return {
    command: "verify-assembly-contract",
    artifactPath,
    json,
    requireTaskParity,
    requireNativeFixtures,
    requireExternalToolEvidence,
  }
}

function parseFlowGraphArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "flow-graph" }> {
  let product: CliAssemblyProduct | undefined
  let recipeFilePath: string | undefined
  let mode: CliFlowGraphMode = "blueprint"
  let taskID: string | undefined
  let artifactPath: string | undefined
  let out: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--product") {
      product = parseAssemblyProduct(readValue(argv, ++index, "--product"))
      continue
    }
    if (arg === "--recipe-file") {
      recipeFilePath = resolve(readValue(argv, ++index, "--recipe-file"))
      continue
    }
    if (arg === "--mode") {
      mode = parseFlowGraphMode(readValue(argv, ++index, "--mode"))
      continue
    }
    if (arg === "--task" || arg === "--task-id") {
      taskID = readValue(argv, ++index, arg)
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    if (!arg.startsWith("-") && !product) {
      product = parseAssemblyProduct(arg)
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!product && !recipeFilePath) throw new CliUsageError("flow-graph requires --product <opencode|pi-mono|nanobot|hermes-agent|minimal> or --recipe-file <path>")
  if (recipeFilePath && mode !== "blueprint") throw new CliUsageError("flow-graph --recipe-file currently supports --mode blueprint.")
  return {
    command: "flow-graph",
    ...(product ? { product } : {}),
    ...(recipeFilePath ? { recipeFilePath } : {}),
    mode,
    ...(taskID ? { taskID } : {}),
    ...(artifactPath ? { artifactPath } : {}),
    ...(out ? { out } : {}),
    json,
  }
}

function parseFlowGraphReportsArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "flow-graph-reports" }> {
  let products: CliAssemblyProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal"]
  let taskID = "read-only-answer"
  let outDir = resolve("docs/reports")
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--product") {
      products = parseAssemblyProducts(readValue(argv, ++index, "--product"))
      continue
    }
    if (arg === "--task" || arg === "--task-id") {
      taskID = readValue(argv, ++index, arg)
      continue
    }
    if (arg === "--out-dir") {
      outDir = resolve(readValue(argv, ++index, "--out-dir"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return { command: "flow-graph-reports", products, taskID, outDir, json }
}

function parseVerifyFlowGraphArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "verify-flow-graph" }> {
  let artifactPath: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (!arg.startsWith("-") && !artifactPath) {
      artifactPath = resolve(arg)
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("verify-flow-graph requires --artifact <path>")
  return { command: "verify-flow-graph", artifactPath, json }
}

function parseExecutablePlaceholderAuditArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "executable-placeholder-audit" }> {
  let products: CliAssemblyProduct[] | undefined
  let out: string | undefined
  let markdown: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--product") {
      products = parseAssemblyProducts(readValue(argv, ++index, "--product"))
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    if (arg === "--markdown" || arg === "--md") {
      markdown = resolve(readValue(argv, ++index, arg))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return {
    command: "executable-placeholder-audit",
    ...(products ? { products } : {}),
    ...(out ? { out } : {}),
    ...(markdown ? { markdown } : {}),
    json,
  }
}

function parseVerifyExecutablePlaceholderAuditArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "verify-executable-placeholder-audit" }> {
  let artifactPath: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (!arg.startsWith("-") && !artifactPath) {
      artifactPath = resolve(arg)
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("verify-executable-placeholder-audit requires --artifact <path>")
  return { command: "verify-executable-placeholder-audit", artifactPath, json }
}

function parseTodo27NativeRewriteInventoryArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "todo27-native-rewrite-inventory" }> {
  let products: CliAssemblyProduct[] | undefined
  let out: string | undefined
  let markdown: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--product") {
      products = parseAssemblyProducts(readValue(argv, ++index, "--product"))
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    if (arg === "--markdown" || arg === "--md") {
      markdown = resolve(readValue(argv, ++index, arg))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return {
    command: "todo27-native-rewrite-inventory",
    ...(products ? { products } : {}),
    ...(out ? { out } : {}),
    ...(markdown ? { markdown } : {}),
    json,
  }
}

function parseVerifyTodo27NativeRewriteInventoryArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "verify-todo27-native-rewrite-inventory" }> {
  let artifactPath: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (!arg.startsWith("-") && !artifactPath) {
      artifactPath = resolve(arg)
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("verify-todo27-native-rewrite-inventory requires --artifact <path>")
  return { command: "verify-todo27-native-rewrite-inventory", artifactPath, json }
}

function parseTodo27OpenCodeSplitAcceptanceArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "todo27-opencode-split-acceptance" }> {
  let out: string | undefined
  let markdown: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    if (arg === "--markdown") {
      markdown = resolve(readValue(argv, ++index, "--markdown"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return {
    command: "todo27-opencode-split-acceptance",
    ...(out ? { out } : {}),
    ...(markdown ? { markdown } : {}),
    json,
  }
}

function parseVerifyTodo27OpenCodeSplitAcceptanceArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "verify-todo27-opencode-split-acceptance" }> {
  let artifactPath: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("verify-todo27-opencode-split-acceptance requires --artifact <path>")
  return { command: "verify-todo27-opencode-split-acceptance", artifactPath, json }
}

function parseCurrentModulePlaceholderAuditArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "current-module-placeholder-audit" }> {
  let products: CliAssemblyProduct[] | undefined
  let out: string | undefined
  let markdown: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--product") {
      products = parseAssemblyProducts(readValue(argv, ++index, "--product"))
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    if (arg === "--markdown" || arg === "--md") {
      markdown = resolve(readValue(argv, ++index, arg))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return {
    command: "current-module-placeholder-audit",
    ...(products ? { products } : {}),
    ...(out ? { out } : {}),
    ...(markdown ? { markdown } : {}),
    json,
  }
}

function parseVerifyCurrentModulePlaceholderAuditArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "verify-current-module-placeholder-audit" }> {
  let artifactPath: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (!arg.startsWith("-") && !artifactPath) {
      artifactPath = resolve(arg)
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("verify-current-module-placeholder-audit requires --artifact <path>")
  return { command: "verify-current-module-placeholder-audit", artifactPath, json }
}

function parseTaskParityDiffArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "task-parity-diff" }> {
  let artifactA: string | undefined
  let artifactB: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact-a") {
      artifactA = resolve(readValue(argv, ++index, "--artifact-a"))
      continue
    }
    if (arg === "--artifact-b") {
      artifactB = resolve(readValue(argv, ++index, "--artifact-b"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactA || !artifactB) throw new CliUsageError("task-parity diff requires --artifact-a and --artifact-b")
  return { command: "task-parity-diff", artifactA, artifactB, json }
}

function parseTaskParityMigrateArtifactArgs(argv: string[], startIndex: number): Extract<ParsedCliArgs, { command: "task-parity-migrate-artifact" }> {
  let artifactPath: string | undefined
  let outDir: string | undefined
  let summaryOut: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--out-dir") {
      outDir = resolve(readValue(argv, ++index, "--out-dir"))
      continue
    }
    if (arg === "--summary-out") {
      summaryOut = resolve(readValue(argv, ++index, "--summary-out"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("task-parity migrate-artifact requires --artifact <path>")
  if (!outDir) throw new CliUsageError("task-parity migrate-artifact requires --out-dir <dir>")
  return {
    command: "task-parity-migrate-artifact",
    artifactPath,
    outDir,
    ...(summaryOut ? { summaryOut } : {}),
    json,
  }
}

function parseTaskParityCadenceDiagnoseArgs(
  argv: string[],
  startIndex: number,
): Extract<ParsedCliArgs, { command: "task-parity-cadence-diagnose" }> {
  let artifactPath: string | undefined
  let out: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("task-parity cadence-diagnose requires --artifact <path>")
  return {
    command: "task-parity-cadence-diagnose",
    artifactPath,
    ...(out ? { out } : {}),
    json,
  }
}

function parseTaskParityNativeCadenceFixtureArgs(
  argv: string[],
  startIndex: number,
): Extract<ParsedCliArgs, { command: "task-parity-native-cadence-fixtures" }> {
  let artifactPath: string | undefined
  let out: string | undefined
  let outDir: string | undefined
  let summaryOut: string | undefined
  let artifactFormat: "legacy" | "split" | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--artifact" || arg === "--in") {
      artifactPath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    if (arg === "--out-dir") {
      outDir = resolve(readValue(argv, ++index, "--out-dir"))
      continue
    }
    if (arg === "--summary-out") {
      summaryOut = resolve(readValue(argv, ++index, "--summary-out"))
      continue
    }
    if (arg === "--artifact-format") {
      artifactFormat = parseArtifactFormat(readValue(argv, ++index, "--artifact-format"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!artifactPath) throw new CliUsageError("task-parity native-cadence-fixtures requires --artifact <path>")
  return {
    command: "task-parity-native-cadence-fixtures",
    artifactPath,
    ...(out ? { out } : {}),
    ...(outDir ? { outDir } : {}),
    ...(summaryOut ? { summaryOut } : {}),
    ...(artifactFormat ? { artifactFormat } : {}),
    json,
  }
}

function parseTaskParityReplayNativeCadenceArgs(
  argv: string[],
  startIndex: number,
): Extract<ParsedCliArgs, { command: "task-parity-replay-native-cadence" }> {
  let fixturePath: string | undefined
  let out: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--fixture" || arg === "--in") {
      fixturePath = resolve(readValue(argv, ++index, arg))
      continue
    }
    if (arg === "--out") {
      out = resolve(readValue(argv, ++index, "--out"))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  if (!fixturePath) throw new CliUsageError("task-parity replay-native-cadence requires --fixture <path>")
  return {
    command: "task-parity-replay-native-cadence",
    fixturePath,
    ...(out ? { out } : {}),
    json,
  }
}

function assembleHarness(product: HarnessProduct, options: AssembleHarnessOptions): AssembledHarness {
  if (product === "opencode") return assembleOpenCodeHarness(options)
  if (product === "pi-mono") return assemblePiMonoHarness(options)
  if (product === "opencode-pi-hybrid") return assembleOpenCodePiHybridHarness(options)
  if (product === "hermes-agent") return assembleHermesAgentHarness(options)
  return assembleNanobotHarness(options)
}

function recipeByID(id: string): LegoRecipe {
  if (id === "coding-agent.minimal" || id === "minimal") return codingAgentMinimalRecipe
  if (id === "opencode" || id === "opencode.full") return opencodeRecipe
  if (id === "pi-mono" || id === "pi-mono.full" || id === "pi") return piMonoRecipe
  if (id === "opencode-pi-hybrid" || id === "opencode-pi.hybrid" || id === "opencode-pi" || id === "hybrid") return opencodePiHybridRecipe
  if (id === "nanobot" || id === "nanobot.full") return nanobotRecipe
  if (id === "hermes-agent" || id === "hermes-agent.full" || id === "hermes") return hermesAgentRecipe
  const swapRecipe = (swapRecipes as Record<string, LegoRecipe>)[id]
  if (swapRecipe) return swapRecipe
  throw new CliUsageError(`Unknown recipe: ${id}`)
}

function parseRecipeOverride(raw: string): LegoRecipeBinding {
  const arrow = raw.indexOf("->")
  const equals = raw.indexOf("=")
  const colon = raw.indexOf(":")
  const separator = arrow >= 0 ? arrow : equals >= 0 ? equals : colon
  const separatorWidth = arrow >= 0 ? 2 : 1
  if (separator <= 0) throw new CliUsageError(`Invalid override ${raw}; expected <port>=<module>`)
  const port = raw.slice(0, separator).trim()
  const module = raw.slice(separator + separatorWidth).trim()
  if (!port || !module) throw new CliUsageError(`Invalid override ${raw}; expected <port>=<module>`)
  return { port, module }
}

function parseProduct(value: string | undefined): HarnessProduct {
  if (value === "opencode" || value === "pi-mono" || value === "nanobot" || value === "hermes-agent") return value
  if (value === "opencode-pi-hybrid" || value === "opencode-pi" || value === "opencode-pi.hybrid" || value === "hybrid") return "opencode-pi-hybrid"
  if (value === "pi") return "pi-mono"
  if (value === "hermes") return "hermes-agent"
  throw new CliUsageError(`Expected product to be "opencode", "pi-mono", "opencode-pi-hybrid", "nanobot", or "hermes-agent", received: ${value ?? "<missing>"}`)
}

function runtimeProductForRecipe(recipe: LegoRecipe): HarnessProduct {
  const harnessCombo = recipe.metadata?.["harnessCombo"]
  if (harnessCombo && typeof harnessCombo === "object" && !Array.isArray(harnessCombo)) return "opencode-pi-hybrid"
  const metadataProduct = typeof recipe.metadata?.["product"] === "string" ? recipe.metadata["product"] : undefined
  if (
    metadataProduct === "opencode" ||
    metadataProduct === "pi-mono" ||
    metadataProduct === "opencode-pi-hybrid" ||
    metadataProduct === "nanobot" ||
    metadataProduct === "hermes-agent"
  ) return metadataProduct
  const productShellBinding = recipe.bindings?.find((binding) => binding.port === "product.shell" || binding.capability === "product.shell")?.module
  const shellIDs = [productShellBinding, ...(recipe.productShells ?? []).map((shell) => shell.id)].filter((id): id is string => Boolean(id))
  if (shellIDs.some((id) => id.startsWith("pi."))) return "pi-mono"
  if (shellIDs.some((id) => id.startsWith("nanobot."))) return "nanobot"
  if (shellIDs.some((id) => id.startsWith("hermes."))) return "hermes-agent"
  return "opencode"
}

function parseExternalToolID(value: string): ExternalToolID {
  if (isExternalToolID(value)) return value
  throw new CliUsageError(`Unknown external tool: ${value}`)
}

function parseExternalToolProduct(value: string): ExternalToolProduct {
  if (isExternalToolProduct(value)) return value
  throw new CliUsageError(`Unknown external tool product: ${value}`)
}

function assertExternalToolProductSupportedForCli(toolID: ExternalToolID, product: ExternalToolProduct | undefined, action: string): void {
  if (!product) return
  const support = externalToolProductSupport(toolID, product)
  if (support.supported) return
  const nextAction = support.gap?.nextAction ? ` ${support.gap.nextAction}` : ""
  throw new CliUsageError(`${toolID} does not support product ${product} for ${action}. ${support.reason}${nextAction}`)
}

function parseExternalToolInvocationStrategy(value: string): ExternalToolInvocationStrategy {
  if (value === "binary" || value === "uvx" || value === "explicitPath") return value
  throw new CliUsageError(`Expected external tool strategy to be "binary", "uvx", or "explicitPath", received: ${value}`)
}

function parseExternalToolCaptureMode(value: string): ExternalToolCaptureMode {
  if (value === "real-capture" || value === "capture-only" || value === "import-only" || value === "dry-run") return value
  throw new CliUsageError(`Expected external tool capture mode to be "real-capture", "capture-only", "import-only", or "dry-run", received: ${value}`)
}

function parseExternalToolRequiredArtifactRole(value: string): { path: string; role: ExternalToolArtifactManifest["role"] } {
  const index = value.lastIndexOf(":")
  if (index <= 0 || index === value.length - 1) throw new CliUsageError(`Expected --require-artifact <path>:<role>, received: ${value}`)
  const path = value.slice(0, index)
  const role = value.slice(index + 1)
  if (role === "raw-trace" || role === "viewer" || role === "log" || role === "other") return { path, role }
  throw new CliUsageError(`Expected artifact role to be "raw-trace", "viewer", "log", or "other", received: ${role}`)
}

function parseExternalToolExpectedInvocationArgs(value: string): string[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(value) as unknown
  } catch (error) {
    throw new CliUsageError(`Expected --expect-args-json to be a JSON string array: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) return parsed
  throw new CliUsageError("Expected --expect-args-json to be a JSON string array")
}

function validateExternalToolInvocationOptions(toolPath: string | undefined, strategy: ExternalToolInvocationStrategy | undefined): void {
  if (toolPath && strategy && strategy !== "explicitPath") {
    throw new CliUsageError("--tool-path can only be combined with --strategy explicitPath.")
  }
  if (!toolPath && strategy === "explicitPath") {
    throw new CliUsageError("--strategy explicitPath requires --tool-path.")
  }
}

function parseAssemblyProduct(value: string | undefined): CliAssemblyProduct {
  if (value === "minimal" || value === "coding-agent.minimal") return "minimal"
  return parseProduct(value)
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function parseAssemblyProducts(value: string | undefined): CliAssemblyProduct[] {
  const products = uniqueStrings((value ?? "").split(",").map((item) => item.trim()).filter(Boolean)).map(parseAssemblyProduct)
  if (products.length === 0) throw new CliUsageError("Expected at least one product.")
  return products
}

function isTodo27NativeRewriteInventoryProduct(product: CliAssemblyProduct): product is NativeHarnessProduct {
  return product === "opencode" || product === "pi-mono" || product === "nanobot" || product === "hermes-agent"
}

function isHarnessDifferentialProduct(product: HarnessProduct): product is NativeHarnessProduct {
  return isTodo27NativeRewriteInventoryProduct(product)
}

function productCLIProtocolProduct(product: HarnessProduct): NativeHarnessProduct {
  return product === "opencode-pi-hybrid" ? "pi-mono" : product
}

function parseFlowGraphMode(value: string | undefined): CliFlowGraphMode {
  if (value === "blueprint" || value === "trace" || value === "native" || value === "compare") return value
  throw new CliUsageError(`Expected flow graph mode to be "blueprint", "trace", "native", or "compare", received: ${value ?? "<missing>"}`)
}

function parseProviderKind(value: string): CliProviderKind {
  if (value === "fake") throw new CliUsageError("--provider fake is no longer supported; configure a real provider/model/API key.")
  if (value === "openai" || value === "openai-compatible") return "openai-compatible"
  if (value === "openrouter") return "openrouter"
  if (value === "anthropic") return "anthropic"
  if (value === "google" || value === "gemini") return "google"
  throw new CliUsageError(
    `Expected provider to be "openai-compatible", "openrouter", "anthropic", or "google", received: ${value}`,
  )
}

function parseInstalledProviderKind(value: string): InstalledProviderKind {
  if (value === "fake") throw new CliUsageError("profile configure-provider no longer supports --provider fake; configure a real provider/model/API key.")
  return parseProviderKind(value)
}

function parseTuiProviderMode(value: string): HarnessTuiProviderMode {
  if (value === "profile-live") return value
  throw new CliUsageError(`Expected TUI provider to be "profile-live", received: ${value}`)
}

function parseLiveProviderKind(value: string): LiveProviderKind {
  if (value === "fake") throw new CliUsageError("live-provider-parity does not support --provider fake")
  return parseProviderKind(value)
}

function parseTelegramGatewayMode(value: string): TelegramGatewayMode {
  if (value === "fake") throw new CliUsageError("Telegram gateway mode fake is no longer supported; configure polling or webhook with a real bot token.")
  if (value === "polling" || value === "webhook") return value
  throw new CliUsageError(`Expected Telegram gateway mode to be "polling" or "webhook", received: ${value}`)
}

function parseTaskParityMode(value: string): ProductTaskParityMode {
  if (value === "assembled" || value === "original") return value
  throw new CliUsageError(`Expected task parity mode to be "assembled" or "original", received: ${value}`)
}

function parseTaskParityProvider(value: string): ProductTaskParityProvider {
  if (value === "fake") throw new CliUsageError("task-parity --provider fake is no longer supported; use --provider fixture for internal deterministic fixtures or --provider live.")
  if (value === "cassette" || value === "fixture" || value === "live") return value
  throw new CliUsageError(`Expected task parity provider to be "cassette", "fixture", or "live", received: ${value}`)
}

function parseArtifactFormat(value: string): "legacy" | "split" {
  if (value === "legacy" || value === "split") return value
  throw new CliUsageError(`Expected artifact format to be "legacy" or "split", received: ${value}`)
}

function providerConfig(input: { kind: CliProviderKind; modelID?: string; apiKey?: string; baseURL?: string; appURL?: string; appName?: string }): CliProviderConfig {
  return {
    kind: input.kind,
    ...(input.modelID ? { modelID: input.modelID } : {}),
    ...(input.apiKey ? { apiKey: input.apiKey } : {}),
    ...(input.baseURL ? { baseURL: input.baseURL } : {}),
    ...(input.appURL ? { appURL: input.appURL } : {}),
    ...(input.appName ? { appName: input.appName } : {}),
  }
}

function createCliProvider(config: CliProviderConfig): LegoProviderAdapter {
  if (!config.modelID) throw new CliUsageError(`--model is required when --provider ${config.kind} is used`)
  const apiKey = config.apiKey ?? providerEnvApiKey(config.kind)
  if (!apiKey && config.kind !== "openai-compatible") {
    throw new CliUsageError(`Missing API key for ${config.kind}; pass --api-key or set ${providerEnvName(config.kind)}`)
  }
  const models = [config.modelID]
  if (config.kind === "openai-compatible") {
    return createOpenAICompatibleProvider({
      models,
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
      ...(apiKey ? { apiKey } : {}),
    })
  }
  if (config.kind === "openrouter") {
    return createOpenRouterProvider({
      models,
      apiKey: apiKey ?? "",
      ...(config.appURL ? { siteURL: config.appURL } : {}),
      ...(config.appName ? { appName: config.appName } : {}),
    })
  }
  if (config.kind === "anthropic") {
    return createAnthropicProvider({
      models,
      apiKey: apiKey ?? "",
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    })
  }
  return createGoogleProvider({
    models,
    apiKey: apiKey ?? "",
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  })
}

function providerEnvApiKey(kind: CliProviderKind): string | undefined {
  if (kind === "openrouter") return process.env["OPENROUTER_API_KEY"]
  if (kind === "anthropic") return process.env["ANTHROPIC_API_KEY"]
  if (kind === "google") return process.env["GOOGLE_API_KEY"] ?? process.env["GEMINI_API_KEY"]
  return process.env["OPENAI_API_KEY"]
}

function providerEnvName(kind: CliProviderKind): string {
  if (kind === "openrouter") return "OPENROUTER_API_KEY"
  if (kind === "anthropic") return "ANTHROPIC_API_KEY"
  if (kind === "google") return "GOOGLE_API_KEY or GEMINI_API_KEY"
  return "OPENAI_API_KEY"
}

function readValue(argv: string[], index: number, option: string): string {
  const value = argv[index]
  if (!value || value.startsWith("--")) throw new CliUsageError(`Missing value for ${option}`)
  return value
}

function csv(raw: string): string[] {
  return raw.split(",").map((item) => item.trim()).filter(Boolean)
}

function parseProfileCommonOptions(argv: string[], startIndex: number): { rootDir?: string; json: boolean } {
  let rootDir: string | undefined
  let json = false
  for (let index = startIndex; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === "--json") {
      json = true
      continue
    }
    if (arg === "--root-dir" || arg === "--profile-root") {
      rootDir = resolve(readValue(argv, ++index, arg))
      continue
    }
    throw new CliUsageError(`Unknown option: ${arg}`)
  }
  return { ...(rootDir ? { rootDir } : {}), json }
}

function createProfileStore(rootDir?: string): HarnessProfileStore {
  return new HarnessProfileStore({ rootDir: rootDir ?? defaultHarnessProfileRoot(), cwd: process.cwd(), env: process.env })
}

function writeJSONOutput(io: CliIO, value: unknown): void {
  io.stdout.write(`${JSON.stringify(redactProfileSecrets(value, process.env), null, 2)}\n`)
}

function parseToolCall(spec: string): FixtureToolCall {
  const separator = spec.indexOf(":")
  const toolName = separator >= 0 ? spec.slice(0, separator) : spec
  const rawInput = separator >= 0 ? spec.slice(separator + 1) : ""
  if (!toolName) throw new CliUsageError(`Invalid tool spec: ${spec}`)
  return {
    toolName,
    input: rawInput.trim().startsWith("{") ? parseJsonObject(rawInput) : parseKeyValues(rawInput),
  }
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const parsed = JSON.parse(raw) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new CliUsageError("Tool JSON input must be an object")
  }
  return parsed as Record<string, unknown>
}

function parseKeyValues(raw: string): Record<string, unknown> {
  if (!raw) return {}
  const input: Record<string, unknown> = {}
  for (const pair of raw.split(",")) {
    const separator = pair.indexOf("=")
    if (separator <= 0) throw new CliUsageError(`Invalid key=value pair: ${pair}`)
    input[pair.slice(0, separator)] = parseScalar(pair.slice(separator + 1))
  }
  return input
}

function parsePositiveInt(raw: string, option: string): number {
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1) throw new CliUsageError(`${option} must be a positive integer`)
  return value
}

function parseNonNegativeInt(raw: string, option: string): number {
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0) throw new CliUsageError(`${option} must be a non-negative integer`)
  return value
}

function parseScalar(raw: string): unknown {
  if (raw === "true") return true
  if (raw === "false") return false
  if (raw === "null") return null
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  return raw
}

function summarizeMessage(message: LegoMessage): { role: LegoMessage["role"]; text: string; parts: LegoMessagePart[] } {
  return {
    role: message.role,
    text: message.parts.map(partToText).filter(Boolean).join("\n"),
    parts: message.parts,
  }
}

function partToText(part: LegoMessagePart): string {
  if (part.type === "text" || part.type === "reasoning") return part.text
  if (part.type === "tool_call") return `[tool:${part.toolName}] ${JSON.stringify(part.input)}`
  if (part.type === "tool_result") return part.content.map(partToText).filter(Boolean).join("\n")
  if (part.type === "compaction") return part.summary
  if (part.type === "custom") return part.display ?? ""
  return ""
}

function formatHumanOutput(output: {
  product: HarnessProduct
  graph: AssembledHarness["graph"]
  session: { id: string }
  blockedTools: Array<{ toolName: string; reason?: string }>
  transcript: Array<{ role: LegoMessage["role"]; text: string }>
}): string {
  const lines = [
    `Helix ${output.product}`,
    `Session: ${output.session.id}`,
    `Modules: ${output.graph.map((node) => (node.variant ? `${node.id}:${node.variant}` : node.id)).join(", ")}`,
    "",
    "Transcript:",
    ...output.transcript.map((message) => `[${message.role}] ${message.text}`),
  ]
  if (output.blockedTools.length > 0) {
    lines.push("", "Blocked tools:", ...output.blockedTools.map((tool) => `- ${tool.toolName}${tool.reason ? `: ${tool.reason}` : ""}`))
  }
  return `${lines.join("\n")}\n`
}

function formatProfileStatus(name: string, ok: boolean, missing: string[], issues: string[]): string {
  const lines = [
    `Harness profile: ${name}`,
    `Status: ${ok ? "ready" : "needs-configuration"}`,
    ...(missing.length > 0 ? [`Missing: ${missing.join(", ")}`] : []),
    ...(issues.length > 0 ? [`Issues: ${issues.join(", ")}`] : []),
  ]
  return `${lines.join("\n")}\n`
}

function formatExternalToolList(profiles: ExternalToolProfile[]): string {
  const lines = [
    "Helix external tools",
    ...profiles.map(
      (profile) =>
        `${profile.id}: ${profile.label} products=${profile.supportedProducts.join(",")} formats=${profile.supportedArtifactFormats.join(",")} modes=${profile.supportedCaptureModes.join(",")}`,
    ),
  ]
  return `${lines.join("\n")}\n`
}

function formatExternalToolDoctor(results: ExternalToolDoctorResult[]): string {
  const lines = [
    "Helix external tools doctor",
    ...results.map((result) => `${result.toolID}: ${result.ok ? "installed" : "missing"} command=${[result.command, ...result.args].join(" ")}${result.version ? ` version=${result.version}` : ""}${result.error ? ` error=${result.error}` : ""}`),
  ]
  return `${lines.join("\n")}\n`
}

function formatExternalToolCapture(result: ExternalToolCaptureDryRunResult | ExternalToolCaptureRunResult): string {
  const lines = [
    `Helix external tool capture ${result.ok ? "passed" : "failed"}`,
    `Tool: ${result.manifest.toolID}`,
    `Mode: ${result.manifest.captureMode}`,
    ...(result.manifest.product ? [`Product: ${result.manifest.product}`] : []),
    ...(result.manifest.taskID ? [`Task: ${result.manifest.taskID}`] : []),
    `Command: ${[result.manifest.invocation.command, ...result.manifest.invocation.args].join(" ")}`,
    `Manifest: ${result.manifestPath}`,
    ...(!result.dryRun ? [`Logs: ${result.stdoutPath}, ${result.stderrPath}`, `Artifacts: ${result.manifest.artifacts.length}`, `Exit code: ${result.manifest.exitCode ?? "unknown"}`] : []),
    ...(!result.dryRun && result.error ? [`Error: ${result.error}`] : []),
  ]
  return `${lines.join("\n")}\n`
}

function formatExternalToolImport(artifact: NativeCaptureArtifact, verification: ExternalToolVerificationReport, outputPaths: string[]): string {
  const lines = [
    `Helix external tool import: ${verification.ok ? "passed" : "failed"}`,
    `Tool: ${artifact.sourceTool} ${artifact.sourceToolVersion}`,
    `Product: ${artifact.product}`,
    `Task: ${artifact.taskID}`,
    `Records: ${artifact.summary.records}`,
    `Provider requests: ${artifact.summary.providerRequests}`,
    `Prompt evidence: ${artifact.summary.promptEvidence}`,
    `Tool evidence: ${artifact.summary.toolEvidence}`,
    `Models: ${artifact.summary.models.join(", ") || "unknown"}`,
    ...outputPaths.map((path) => `Output: ${path}`),
    ...verification.issues.map((issue) => `Issue: ${issue.id} - ${issue.message}`),
  ]
  return `${lines.join("\n")}\n`
}

function formatExternalToolVerification(verification: ExternalToolVerificationReport, artifactPath: string, runManifestPath?: string): string {
  const lines = [
    `Helix external tool artifact: ${verification.ok ? "passed" : "failed"}`,
    `Artifact: ${artifactPath}`,
    ...(runManifestPath ? [`Run manifest: ${runManifestPath}`] : []),
    ...verification.issues.map((issue) => `Issue: ${issue.id} - ${issue.message}`),
  ]
  return `${lines.join("\n")}\n`
}

function formatExternalToolRunManifestVerification(verification: ExternalToolVerificationReport, manifestPath: string): string {
  const lines = [
    `Helix external tool run manifest: ${verification.ok ? "passed" : "failed"}`,
    `Run manifest: ${manifestPath}`,
    ...verification.issues.map((issue) => `Issue: ${issue.id} - ${issue.message}`),
  ]
  return `${lines.join("\n")}\n`
}

function formatExternalToolNativeCadence(
  fixtureSet: ProductTaskNativeCadenceFixtureSet,
  verification: ReturnType<typeof verifyProductTaskNativeCadenceFixtureSet>,
  out?: string,
): string {
  const lines = [
    `Helix external native cadence fixture: ${verification.ok ? "passed" : "failed"}`,
    `Fixtures: ${fixtureSet.fixtures.length}`,
    `Products: ${[...new Set(fixtureSet.fixtures.map((fixture) => fixture.product))].join(", ") || "<none>"}`,
    ...(out ? [`Output: ${out}`] : []),
    ...verification.issues.map((issue) => `Issue: ${issue.id} - ${issue.message}`),
  ]
  return `${lines.join("\n")}\n`
}

function externalCaptureHarnessProduct(product: ExternalToolProduct): HarnessProduct {
  if (product === "codex") throw new CliUsageError("External capture native-cadence projection only supports Helix products; codex is a protocol reference, not a Helix product.")
  if (product === "opencode" || product === "pi-mono" || product === "nanobot" || product === "hermes-agent") return product
  throw new CliUsageError(`External capture product is not supported by Helix native-cadence projection: ${String(product)}`)
}

function liveProviderArtifact(report: LiveProviderParityReport): unknown {
  return createLiveProviderParityArtifact(report)
}

function writeLiveProviderReport(path: string, report: LiveProviderParityReport): void {
  createLiveProviderArtifactWriter().write({ path, report })
}

function formatLiveProviderReport(report: LiveProviderParityReport, out?: string): string {
  const lines = [
    `Helix live provider parity: ${report.status}`,
    `OK: ${String(report.ok)}`,
    ...(report.provider ? [`Provider: ${report.provider}`] : []),
    ...(report.modelID ? [`Model: ${report.modelID}`] : []),
    ...(report.missing.length > 0 ? [`Missing: ${report.missing.join(", ")}`] : []),
    ...report.products.map((product) => `${product.product}: ${product.status} (${product.checks.filter((check) => check.ok).length}/${product.checks.length})`),
    ...(out ? [`Report: ${out}`] : []),
  ]
  return `${lines.join("\n")}\n`
}

function formatLiveProviderArtifactVerification(report: LiveProviderParityArtifactVerificationReport, artifactPath: string): string {
  const lines = [
    `Helix live provider artifact: ${report.ok ? "passed" : "failed"}`,
    `Artifact: ${artifactPath}`,
    ...(report.provider ? [`Provider: ${report.provider}`] : []),
    ...(report.modelID ? [`Model: ${report.modelID}`] : []),
    ...(report.generatedAt ? [`Generated: ${report.generatedAt}`] : []),
    ...report.issues.map((issue) => `Issue: ${issue.id} - ${issue.message}`),
  ]
  return `${lines.join("\n")}\n`
}

function formatOpenCodeDifferentialReport(report: OpenCodeDifferentialReport): string {
  const matches = report.checks.filter((check) => check.ok).length
  const lines = [
    `Helix ${report.product} differential: ${report.status}`,
    `Scenario: ${report.scenario.id}`,
    `Checks: ${matches}/${report.checks.length}`,
    `Assembled: ${report.assembled.sourceLabel}`,
    `Original: ${report.original.sourceLabel}`,
    ...report.gaps.map((gap) => `Gap: ${gap.id} - ${gap.next ?? gap.message}`),
  ]
  return `${lines.join("\n")}\n`
}

function formatTaskParityArtifact(artifact: ProductTaskParityArtifact, out?: string): string {
  const lines = [
    `Helix task parity: ${artifact.summary.gapsFound === 0 && artifact.summary.failed === 0 ? "passed" : "failed"}`,
    `Suite: ${artifact.suite}`,
    `Provider: ${artifact.provider}`,
    `Reports: ${artifact.summary.reports}`,
    `Matched: ${artifact.summary.matched}`,
    `Acceptable drift: ${artifact.summary.acceptableDrift}`,
    `Gaps: ${artifact.summary.gapsFound}`,
    `Failed: ${artifact.summary.failed}`,
    ...artifact.pairs.map((pair) => `${pair.taskID}:${pair.product}: ${pair.status}`),
    ...(out ? [`Report: ${out}`] : []),
  ]
  return `${lines.join("\n")}\n`
}

function formatTaskParityVerification(report: ProductTaskParityArtifactVerificationReport, artifactPath: string): string {
  const lines = [
    `Helix task parity artifact: ${report.ok ? "passed" : "failed"}`,
    `Artifact: ${artifactPath}`,
    ...report.issues.map((issue) => `Issue: ${issue.id} - ${issue.message}`),
  ]
  return `${lines.join("\n")}\n`
}

function formatTaskParityDiff(
  diff: ReturnType<typeof diffProductTaskParityArtifacts>,
  artifactA: string,
  artifactB: string,
): string {
  const lines = [
    `Helix task parity diff: ${diff.ok ? "matched" : "changed"}`,
    `A: ${artifactA}`,
    `B: ${artifactB}`,
    ...diff.changed.map((change) => `${change.key}: ${change.left} -> ${change.right}`),
  ]
  return `${lines.join("\n")}\n`
}

function formatTaskParityCadenceDiagnosis(diagnosis: ProductTaskCadenceDiagnosisArtifact, artifactPath: string, out?: string): string {
  const lines = [
    "Helix task parity cadence diagnosis",
    `Artifact: ${artifactPath}`,
    ...diagnosis.products.map(
      (product) =>
        `${product.taskID}:${product.product}: score ${product.cadenceScore}/${product.targetScore}, raw drifts ${product.rawDriftCount}, estimated after planned fixes ${product.estimatedScoreAfterPlannedFixes}`,
    ),
    `Structural follow-up required: ${diagnosis.structuralAudit.requiresFollowUpTODO ? "yes" : "no"}`,
    ...(out ? [`Report: ${out}`] : []),
  ]
  return `${lines.join("\n")}\n`
}

function formatTaskParityNativeCadenceFixtures(
  fixtureSet: ProductTaskNativeCadenceFixtureSet,
  verification: ReturnType<typeof verifyProductTaskNativeCadenceFixtureSet>,
  artifactPath: string,
  out?: string,
): string {
  const products = [...new Set(fixtureSet.fixtures.map((fixture) => fixture.product))].sort()
  const lines = [
    `Helix native cadence fixtures: ${verification.ok ? "passed" : "failed"}`,
    `Artifact: ${artifactPath}`,
    `Fixtures: ${fixtureSet.fixtures.length}`,
    `Products: ${products.join(", ") || "<none>"}`,
    ...verification.issues.map((issue) => `Issue: ${issue.id} - ${issue.message}`),
    ...(out ? [`Report: ${out}`] : []),
  ]
  return `${lines.join("\n")}\n`
}

function formatTaskParityReplayNativeCadence(
  output: {
    summary?: { fingerprint?: string }
    verification: ReturnType<typeof verifyProductTaskNativeCadenceFixtureSet>
    replays: Array<{ product: HarnessProduct; taskID: string; projectionLosses?: unknown[] }>
  },
  fixturePath: string,
  out?: string,
): string {
  const lines = [
    `Helix native cadence fixture replay: ${output.verification.ok ? "passed" : "failed"}`,
    `Fixture: ${fixturePath}`,
    `Replays: ${output.replays.length}`,
    ...(output.summary?.fingerprint ? [`Fingerprint: ${output.summary.fingerprint}`] : []),
    ...output.replays.map((item) => `${item.taskID}:${item.product}: projectionLosses=${item.projectionLosses?.length ?? 0}`),
    ...output.verification.issues.map((issue) => `Issue: ${issue.id} - ${issue.message}`),
    ...(out ? [`Report: ${out}`] : []),
  ]
  return `${lines.join("\n")}\n`
}

function buildTaskParityNativeCadenceReplayArtifact(input: {
  fixturePath: string
  fixtureSet: ProductTaskNativeCadenceFixtureSet
  verification: ReturnType<typeof verifyProductTaskNativeCadenceFixtureSet>
  replays: Array<{
    product: HarnessProduct
    taskID: string
    nativeVersion: string
    cadenceSignature: ReturnType<typeof replayProductTaskNativeCadenceFixture>
    observationShape: ProductTaskNativeCadenceFixture["observationShape"]
    projectionLosses: ProductTaskNativeCadenceFixture["projectionLosses"]
  }>
}): {
  schemaVersion: 1
  artifactKind: "native-cadence-fixture-replay"
  generatedAt: string
  sourceFixturePath: string
  sourceGeneratedAt: string
  verification: ReturnType<typeof verifyProductTaskNativeCadenceFixtureSet>
  replays: typeof input.replays
  summary: {
    fixtures: number
    products: HarnessProduct[]
    tasks: string[]
    providerRequests: number
    projectionLosses: number
    fingerprint: string
  }
} {
  const summaryWithoutFingerprint = {
    fixtures: input.replays.length,
    products: uniqueStrings(input.replays.map((replay) => replay.product)) as HarnessProduct[],
    tasks: uniqueStrings(input.replays.map((replay) => replay.taskID)),
    providerRequests: input.replays.reduce((total, replay) => total + replay.cadenceSignature.costShape.providerRequests, 0),
    projectionLosses: input.replays.reduce((total, replay) => total + replay.projectionLosses.length, 0),
  }
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        sourceGeneratedAt: input.fixtureSet.generatedAt,
        summary: summaryWithoutFingerprint,
        replays: input.replays.map((replay) => ({
          product: replay.product,
          taskID: replay.taskID,
          nativeVersion: replay.nativeVersion,
          cadenceSignature: replay.cadenceSignature,
          projectionLosses: replay.projectionLosses,
        })),
      }),
    )
    .digest("hex")
    .slice(0, 16)
  return {
    schemaVersion: 1,
    artifactKind: "native-cadence-fixture-replay",
    generatedAt: new Date().toISOString(),
    sourceFixturePath: displayPath(process.cwd(), input.fixturePath),
    sourceGeneratedAt: input.fixtureSet.generatedAt,
    verification: input.verification,
    replays: input.replays,
    summary: {
      ...summaryWithoutFingerprint,
      fingerprint,
    },
  }
}

function displayPath(cwd: string, path: string): string {
  const relativePath = relative(cwd, path)
  return relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath) ? relativePath : path
}

function assertExternalToolImportArtifactLocalOnly(path: string): void {
  if (!isDocsReportsPath(path)) return
  throw new CliUsageError("external-tools import refuses raw external tool artifacts from docs/reports; keep raw traces local and publish normalized native-capture.json.")
}

function assertExternalToolCaptureGate(captureMode: ExternalToolCaptureRunResult["manifest"]["captureMode"]): void {
  if (process.env[externalCaptureConsentEnv] !== "1") {
    throw new CliUsageError(
      `external-tools capture ${captureMode} requires ${externalCaptureConsentEnv}=1 in the current shell. This consent flag is intentionally ignored when loaded from .env.`,
    )
  }
  const hasKnownCredential = externalCaptureCredentialEnvNames.some((name) => {
    const value = process.env[name]
    return typeof value === "string" && value.trim().length > 0
  })
  if (!hasKnownCredential && process.env[externalCaptureAllowNoCredentialsEnv] !== "1") {
    throw new CliUsageError(
      `external-tools capture ${captureMode} requires one provider credential environment variable (${externalCaptureCredentialEnvNames.join(", ")}) or ${externalCaptureAllowNoCredentialsEnv}=1 for a local/custom provider.`,
    )
  }
}

function assertExternalToolCapturePathsLocalOnly(input: { toolID: ExternalToolID; outDir: string; toolArgs: string[] }): void {
  assertNotDocsReportsPath(input.outDir, "external tool capture output directory")
  if (input.toolID !== "claude-tap") return
  const outputDirOverride = claudeTapOutputDirOverride(input.toolArgs)
  if (outputDirOverride !== undefined) assertNotDocsReportsPath(resolve(outputDirOverride), "claude-tap --tap-output-dir")
}

function claudeTapOutputDirOverride(args: string[]): string | undefined {
  const toolOptionArgs = args.slice(0, clientArgDelimiterIndex(args))
  for (let index = 0; index < toolOptionArgs.length; index += 1) {
    const arg = toolOptionArgs[index] ?? ""
    if (arg === "--tap-output-dir") return toolOptionArgs[index + 1] ?? ""
    if (arg.startsWith("--tap-output-dir=")) return arg.slice("--tap-output-dir=".length)
  }
  return undefined
}

function clientArgDelimiterIndex(args: string[]): number {
  const delimiterIndex = args.indexOf("--")
  return delimiterIndex >= 0 ? delimiterIndex : args.length
}

function assertNotDocsReportsPath(path: string, label: string): void {
  if (!isDocsReportsPath(path)) return
  throw new CliUsageError(`${label} must stay local-only; refusing docs/reports path ${path}`)
}

function isDocsReportsPath(path: string): boolean {
  const docsReports = resolve("docs/reports")
  const candidate = resolve(path)
  const relativePath = relative(docsReports, candidate)
  return relativePath === "" || (relativePath.length > 0 && !relativePath.startsWith("..") && !isAbsolute(relativePath))
}

function recipeCommandJSON(command: "recipe-inspect" | "recipe-graph" | "recipe-validate", recipe: CompiledRecipe): unknown {
  if (command === "recipe-graph") {
    return {
      id: recipe.id,
      version: recipe.version,
      graph: recipe.graph,
      bindings: recipe.bindings,
      lockfile: recipe.lockfile,
    }
  }
  if (command === "recipe-validate") {
    return {
      ok: true,
      id: recipe.id,
      version: recipe.version,
      modules: recipe.modules.length,
      bindings: recipe.bindings.length,
      lockfile: recipe.lockfile,
    }
  }
  return recipe
}

function formatRecipeCommand(command: "recipe-inspect" | "recipe-graph" | "recipe-validate", recipe: CompiledRecipe): string {
  if (command === "recipe-validate") {
    return `Recipe ${recipe.id}: valid\nModules: ${recipe.modules.length}\nBindings: ${recipe.bindings.length}\n`
  }
  if (command === "recipe-graph") {
    return [
      `Recipe ${recipe.id} graph`,
      ...recipe.graph.map((module) => `${module.id}: provides ${module.provides.join(", ")}; requires ${module.requires.join(", ") || "<none>"}`),
      "",
      "Bindings:",
      ...recipe.bindings.map((binding) => `${binding.consumer} -> ${binding.capability.id} -> ${binding.provider}${binding.explicit ? " (explicit)" : ""}`),
      "",
    ].join("\n")
  }
  return [
    `Recipe ${recipe.id}@${recipe.version}`,
    `Modules: ${recipe.modules.length}`,
    `Common: ${recipe.commonModules.map((module) => module.id).join(", ")}`,
    `Personality: ${recipe.personalityModules.map((module) => module.id).join(", ")}`,
    `Entrypoints: ${Object.keys(recipe.entrypoints).join(", ") || "<none>"}`,
    `Conformance: ${recipe.conformanceSuite.join(", ") || "<none>"}`,
    `Bindings: ${recipe.bindings.length}`,
    "",
  ].join("\n")
}

function formatRecipeDiff(diff: RecipeDiff): string {
  return [
    `Recipe diff: ${diff.left} -> ${diff.right}`,
    `Common: ${diff.commonModules.map((module) => module.id).join(", ") || "<none>"}`,
    `Left only: ${diff.leftOnlyModules.map((module) => module.id).join(", ") || "<none>"}`,
    `Right only: ${diff.rightOnlyModules.map((module) => module.id).join(", ") || "<none>"}`,
    `Variant changes: ${diff.variantChanges.map((module) => `${module.id}:${module.leftVariant ?? "<none>"}->${module.rightVariant ?? "<none>"}`).join(", ") || "<none>"}`,
    `Binding changes: ${diff.changedBindings.map((binding) => `${binding.port}:${binding.leftProviders.join("+") || "<none>"}->${binding.rightProviders.join("+") || "<none>"}`).join(", ") || "<none>"}`,
    `Strategy changes: ${diff.changedStrategies.map((strategy) => strategy.id).join(", ") || "<none>"}`,
    `Policy changes: ${diff.changedPolicies.map((policy) => policy.id).join(", ") || "<none>"}`,
    "",
  ].join("\n")
}

function formatRecipeCompose(recipe: CompiledRecipe, overrides: LegoRecipeBinding[]): string {
  return [
    `Recipe ${recipe.id}: composed`,
    `Overrides: ${overrides.map((override) => `${override.port}=${override.module}`).join(", ")}`,
    `Modules: ${recipe.modules.length}`,
    `Bindings: ${recipe.bindings.length}`,
    "",
  ].join("\n")
}

function formatAssemblyContractVerification(report: AssemblyContractVerificationReport, artifactPath: string): string {
  const lines = [
    `Assembly contract verification: ${artifactPath}`,
    `Status: ${report.ok ? "ok" : "issues-found"}`,
    `Contract: ${report.contractID}`,
    `Fingerprint: ${report.fingerprints.contract}`,
    `Checks: ${report.checks.filter((check) => check.ok).length}/${report.checks.length}`,
  ]
  if (report.issues.length > 0 || report.warnings.length > 0) {
    lines.push("Findings:")
    for (const finding of [...report.issues, ...report.warnings]) {
      lines.push(`  ${finding.severity}: ${finding.id} - ${finding.message}`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

function formatFlowGraphArtifact(artifact: HarnessFlowGraph | HarnessFlowRun | HarnessFlowComparison, out?: string): string {
  if (isFlowGraphComparisonArtifact(artifact)) {
    const lines = [
      `Flow graph comparison: ${artifact.product}${artifact.taskID ? ` task=${artifact.taskID}` : ""}`,
      `Status: ${artifact.summary.status}`,
      `Stages: ${artifact.summary.matchedStages}/${artifact.summary.stages} matched`,
      `Diffs: ${artifact.diffs.length}`,
      `Assembled: ${artifact.assembled.summary.fingerprint}`,
      `Original: ${artifact.original.summary.fingerprint}`,
      `Fingerprint: ${artifact.summary.fingerprint}`,
    ]
    for (const diff of artifact.diffs.slice(0, 8)) {
      lines.push(`  ${diff.stageID}: ${diff.status} - ${diff.message}`)
    }
    if (artifact.diffs.length > 8) lines.push(`  ... ${artifact.diffs.length - 8} more`)
    if (out) lines.push(`Wrote: ${out}`)
    lines.push("")
    return lines.join("\n")
  }
  if (isFlowRunArtifact(artifact)) {
    const lines = [
      `Flow run: ${artifact.product} ${artifact.captureMode}${artifact.taskID ? ` task=${artifact.taskID}` : ""}`,
      `Run: ${artifact.runID}`,
      `Events: ${artifact.summary.events}`,
      `Stages: ${artifact.summary.observedStages}/${artifact.graph.summary.stages} observed`,
      `Finish: ${artifact.summary.finish}`,
      `Fingerprint: ${artifact.summary.fingerprint}`,
    ]
    if (out) lines.push(`Wrote: ${out}`)
    lines.push("")
    return lines.join("\n")
  }
  const observed = artifact.summary.observedStages
  const lines = [
    `Flow graph: ${artifact.product} ${artifact.source}/${artifact.mode}`,
    `Stages: ${observed}/${artifact.summary.stages} observed, ${artifact.summary.inferredStages} inferred, ${artifact.summary.unobservableStages} unobservable`,
    `Edges: ${artifact.summary.edges}`,
    `Evidence: ${artifact.evidence.length}`,
    `Fingerprint: ${artifact.summary.fingerprint}`,
  ]
  if (out) lines.push(`Wrote: ${out}`)
  lines.push("")
  return lines.join("\n")
}

function formatFlowGraphReports(output: FlowGraphReportsOutput): string {
  const lines = [
    `Flow graph reports: ${output.summary.ok ? "ok" : "issues-found"}`,
    `Output: ${output.outDir}`,
    `Task: ${output.taskID}`,
    `Artifacts: ${output.summary.artifacts}`,
    `Graphs: ${output.summary.graphs}`,
    `Comparisons: ${output.summary.comparisons}`,
  ]
  for (const artifact of output.artifacts) {
    lines.push(`${artifact.kind}: ${artifact.product}${artifact.taskID ? ` task=${artifact.taskID}` : ""} ${artifact.verification.ok ? "ok" : "issues"} ${artifact.path}`)
  }
  const issues = output.artifacts.flatMap((artifact) => artifact.verification.issues.map((issue) => `${artifact.path}: ${issue.id} - ${issue.message}`))
  if (issues.length > 0) {
    lines.push("Findings:")
    lines.push(...issues.map((issue) => `  ${issue}`))
  }
  lines.push("")
  return lines.join("\n")
}

function formatFlowGraphVerification(report: ReturnType<typeof verifyHarnessFlowArtifact>, artifactPath: string): string {
  const lines = [
    `Flow graph verification: ${artifactPath}`,
    `Status: ${report.ok ? "ok" : "issues-found"}`,
    `Graphs: ${report.summary.graphs}`,
    `Comparisons: ${report.summary.comparisons}`,
    `Stages: ${report.summary.stages}`,
  ]
  if (report.issues.length > 0) {
    lines.push("Findings:")
    for (const issue of report.issues) lines.push(`  ${issue.id} - ${issue.message}`)
  }
  lines.push("")
  return lines.join("\n")
}

function formatExecutablePlaceholderAuditOutput(
  audit: ExecutablePlaceholderAudit,
  verification: ExecutablePlaceholderAuditVerification,
  out?: string,
  markdown?: string,
): string {
  const lines = [
    `Executable placeholder audit: ${verification.ok ? "ok" : "issues-found"}`,
    `Products: ${audit.products.join(", ")}`,
    `Required bindings: ${audit.summary.total}`,
    `Executable-required: ${audit.summary.executableRequired}`,
    `Compile blockers: ${audit.summary.compileBlockers}`,
    `Metadata overlays: ${audit.summary.metadataOverlays}`,
    `Lossy compatible: ${audit.summary.lossyCompatible}`,
    `Fingerprint: ${audit.summary.fingerprint}`,
  ]
  if (out) lines.push(`Wrote JSON: ${out}`)
  if (markdown) lines.push(`Wrote Markdown: ${markdown}`)
  if (verification.issues.length > 0 || verification.warnings.length > 0) {
    lines.push("Findings:")
    for (const finding of [...verification.issues, ...verification.warnings].slice(0, 12)) {
      lines.push(`  ${finding.severity}: ${finding.id} - ${finding.message}`)
    }
    if (verification.issues.length + verification.warnings.length > 12) {
      lines.push(`  ... ${verification.issues.length + verification.warnings.length - 12} more`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

function formatExecutablePlaceholderAuditVerification(report: ExecutablePlaceholderAuditVerification, artifactPath: string): string {
  const lines = [
    `Executable placeholder audit verification: ${artifactPath}`,
    `Status: ${report.ok ? "ok" : "issues-found"}`,
    `Fingerprint: ${report.fingerprint}`,
    `Checks: ${report.checks.filter((check) => check.ok).length}/${report.checks.length}`,
  ]
  if (report.issues.length > 0 || report.warnings.length > 0) {
    lines.push("Findings:")
    for (const finding of [...report.issues, ...report.warnings]) {
      lines.push(`  ${finding.severity}: ${finding.id} - ${finding.message}`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

function formatTodo27NativeRewriteInventoryOutput(
  inventory: Todo27NativeRewriteInventory,
  verification: Todo27NativeRewriteInventoryVerification,
  out?: string,
  markdown?: string,
): string {
  const lines = [
    `TODO-027 native rewrite inventory: ${verification.ok ? "ok" : "issues-found"}`,
    `Products: ${inventory.products.join(", ")}`,
    `Transition atoms: ${inventory.summary.total}`,
    `Selected: ${inventory.summary.selected}`,
    `Partial evidence: ${inventory.summary.rewriteOpenWithPartialEvidence}`,
    `Preview retained: ${inventory.summary.previewRetained}`,
    `Metadata retained: ${inventory.summary.metadataRetained}`,
    `Uncategorized: ${inventory.summary.uncategorized}`,
    `Fingerprint: ${inventory.summary.fingerprint}`,
  ]
  if (out) lines.push(`Wrote JSON: ${out}`)
  if (markdown) lines.push(`Wrote Markdown: ${markdown}`)
  if (verification.issues.length > 0 || verification.warnings.length > 0) {
    lines.push("Findings:")
    for (const finding of [...verification.issues, ...verification.warnings].slice(0, 12)) {
      lines.push(`  ${finding.severity}: ${finding.id} - ${finding.message}`)
    }
    if (verification.issues.length + verification.warnings.length > 12) {
      lines.push(`  ... ${verification.issues.length + verification.warnings.length - 12} more`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

function formatTodo27NativeRewriteInventoryVerification(report: Todo27NativeRewriteInventoryVerification, artifactPath: string): string {
  const lines = [
    `TODO-027 native rewrite inventory verification: ${artifactPath}`,
    `Status: ${report.ok ? "ok" : "issues-found"}`,
    `Fingerprint: ${report.fingerprint}`,
    `Checks: ${report.checks.filter((check) => check.ok).length}/${report.checks.length}`,
  ]
  if (report.issues.length > 0 || report.warnings.length > 0) {
    lines.push("Findings:")
    for (const finding of [...report.issues, ...report.warnings]) {
      lines.push(`  ${finding.severity}: ${finding.id} - ${finding.message}`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

function formatTodo27OpenCodeSplitAcceptanceOutput(
  report: Todo27OpenCodeSplitAcceptance,
  verification: Todo27OpenCodeSplitAcceptanceVerification,
  out?: string,
  markdown?: string,
): string {
  const lines = [
    `TODO-027 OpenCode split acceptance: ${verification.ok ? report.summary.status : "issues-found"}`,
    `Upstream target: ${report.upstreamTarget.ref}`,
    `Transition atoms: ${report.summary.transitionAtoms}`,
    `Fixtures linked: ${report.summary.fixtureLinked}/${report.summary.transitionAtoms}`,
    `Lossiness linked: ${report.summary.lossinessLinked}/${report.summary.transitionAtoms}`,
    `Parity target blocked stages: ${report.summary.parityTargetBlockedStages}`,
    `Parity target satisfied stages: ${report.summary.parityTargetSatisfiedStages}`,
    `Source verifiers: ${report.summary.verifierSourcesOK}/5`,
    `Fingerprint: ${report.summary.fingerprint}`,
  ]
  if (out) lines.push(`Wrote JSON: ${out}`)
  if (markdown) lines.push(`Wrote Markdown: ${markdown}`)
  if (verification.issues.length > 0 || verification.warnings.length > 0) {
    lines.push("Findings:")
    for (const finding of [...verification.issues, ...verification.warnings].slice(0, 12)) {
      lines.push(`  ${finding.severity}: ${finding.id} - ${finding.message}`)
    }
    if (verification.issues.length + verification.warnings.length > 12) {
      lines.push(`  ... ${verification.issues.length + verification.warnings.length - 12} more`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

function formatTodo27OpenCodeSplitAcceptanceVerification(report: Todo27OpenCodeSplitAcceptanceVerification, artifactPath: string): string {
  const lines = [
    `TODO-027 OpenCode split acceptance verification: ${artifactPath}`,
    `Status: ${report.ok ? "ok" : "issues-found"}`,
    `Fingerprint: ${report.fingerprint}`,
    `Checks: ${report.checks.filter((check) => check.ok).length}/${report.checks.length}`,
  ]
  if (report.issues.length > 0 || report.warnings.length > 0) {
    lines.push("Findings:")
    for (const finding of [...report.issues, ...report.warnings]) {
      lines.push(`  ${finding.severity}: ${finding.id} - ${finding.message}`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

function formatCurrentModulePlaceholderAuditOutput(
  audit: CurrentModulePlaceholderAudit,
  verification: CurrentModulePlaceholderAuditVerification,
  out?: string,
  markdown?: string,
): string {
  const lines = [
    `Current module placeholder audit: ${verification.ok ? "ok" : "issues-found"}`,
    `Products: ${audit.products.join(", ")}`,
    `Packages: ${audit.summary.packageItems}`,
    `Planes: ${audit.summary.planeItems}`,
    `Product transition atoms: ${audit.summary.productAtomItems}`,
    `Required bindings: ${audit.summary.requiredBindingItems}`,
    `Native complete: ${audit.summary.productNativeComplete}`,
    `Manual source checks: ${audit.summary.manualSourceCheckRequired}`,
    `Fingerprint: ${audit.summary.fingerprint}`,
  ]
  if (out) lines.push(`Wrote JSON: ${out}`)
  if (markdown) lines.push(`Wrote Markdown: ${markdown}`)
  if (verification.issues.length > 0 || verification.warnings.length > 0) {
    lines.push("Findings:")
    for (const finding of [...verification.issues, ...verification.warnings].slice(0, 12)) {
      lines.push(`  ${finding.severity}: ${finding.id} - ${finding.message}`)
    }
    if (verification.issues.length + verification.warnings.length > 12) {
      lines.push(`  ... ${verification.issues.length + verification.warnings.length - 12} more`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

function formatCurrentModulePlaceholderAuditVerification(report: CurrentModulePlaceholderAuditVerification, artifactPath: string): string {
  const lines = [
    `Current module placeholder audit verification: ${artifactPath}`,
    `Status: ${report.ok ? "ok" : "issues-found"}`,
    `Fingerprint: ${report.fingerprint}`,
    `Checks: ${report.checks.filter((check) => check.ok).length}/${report.checks.length}`,
  ]
  if (report.issues.length > 0 || report.warnings.length > 0) {
    lines.push("Findings:")
    for (const finding of [...report.issues, ...report.warnings]) {
      lines.push(`  ${finding.severity}: ${finding.id} - ${finding.message}`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

function isFlowGraphComparisonArtifact(artifact: HarnessFlowGraph | HarnessFlowRun | HarnessFlowComparison): artifact is HarnessFlowComparison {
  return "diffs" in artifact
}

function isFlowRunArtifact(artifact: HarnessFlowGraph | HarnessFlowRun | HarnessFlowComparison): artifact is HarnessFlowRun {
  return "runID" in artifact && "graph" in artifact
}

function assemblyContractSummary(contract: AssemblyContract, verification: AssemblyContractVerificationReport | undefined): Record<string, unknown> {
  return {
    product: contract.product,
    recipeID: contract.recipeID,
    ok: verification?.ok ?? false,
    atoms: contract.atoms.length,
    commonAtoms: contract.commonAtoms.length,
    productSpecificAtoms: contract.productSpecificAtoms.length,
    reservedAtoms: contract.reservedAtoms.length,
    fixtureOnlyAtoms: contract.fixtureOnlyAtoms.length,
    ports: contract.ports.length,
    boundRequiredPorts: contract.ports.filter((port) => port.required && (port.providerAtoms.length > 0 || port.candidateAtoms.length > 0)).length,
    swapPoints: contract.swapPoints.length,
    taskParity: contract.taskParity.status,
    nativeFixtures: contract.nativeFixtures.status,
    externalEvidence: contract.externalToolEvidence.status,
    fingerprint: contract.fingerprints.contract,
  }
}

function usage(): string {
  return [
    "Usage:",
    "  npm run helix -- run <opencode|pi-mono|nanobot|hermes-agent> --provider <openai-compatible|openrouter|anthropic|google> --model id [--api-key key] [--base-url url] [--max-steps n] [--max-retries n] [--synthetic-continue] [--prompt text] [--json|--native-json-events]",
    "  npm run helix -- inspect recipe <coding-agent.minimal|opencode|pi-mono|nanobot|hermes-agent|swap-id> [--json]",
    "  npm run helix -- graph recipe <coding-agent.minimal|opencode|pi-mono|nanobot|hermes-agent|swap-id> [--json]",
    "  npm run helix -- graph recipe-file <path> [--json]",
    "  npm run helix -- diff recipe <left> <right> [--json]",
    "  npm run helix -- validate recipe <coding-agent.minimal|opencode|pi-mono|nanobot|hermes-agent|swap-id> [--json]",
    "  npm run helix -- validate recipe-file <path> [--json]",
    "  npm run helix -- compose --recipe <id> --override <port=module> [--json]",
    "  npm run helix -- assemble --product opencode,pi-mono,opencode-pi-hybrid,nanobot,hermes-agent,minimal|--recipe-file path [--explain] [--with-task-parity [path]] [--with-native-fixtures [path]] [--with-external-capture path] [--external-run-manifest path] [--strict] [--out path|--out-dir dir] [--json]",
    "  npm run helix -- verify-assembly-contract --artifact path [--require-task-parity] [--require-native-fixtures] [--require-external-tool-evidence] [--json]",
    "  npm run helix -- flow-graph (--product opencode|pi-mono|opencode-pi-hybrid|nanobot|hermes-agent|minimal|--recipe-file path) [--mode blueprint|trace|native|compare] [--task id] [--artifact external-native-capture.json|native-cadence.json|legacy-task-parity.json|native-cadence-summary.json|native-cadence-manifest.json] [--out path] [--json]",
    "  npm run helix -- flow-graph reports [--product opencode,pi-mono,nanobot,hermes-agent,minimal] [--task id] [--out-dir dir] [--json]",
    "  npm run helix -- verify-flow-graph --artifact path [--json]",
    "  npm run helix -- external-tools <list|doctor|capture|import|verify|verify-run-manifest|to-native-cadence> [claude-tap] [--strategy binary|uvx|explicitPath] [--tool-path path] [--dry-run|--capture-only] [--require-tool] [--artifact path] [--run-manifest path] [--manifest path] [--require-artifact path:role] [--expect-command command] [--expect-args-json json] [--allow-unknown-tool-version] [--allow-empty-artifacts] [--product opencode|pi-mono|hermes-agent|codex] [--task id] [--capture-mode mode] [--out path|--out-dir dir] [--json] [-- <tool args>]",
    "  npm run helix -- executable-placeholder-audit [--product opencode,pi-mono,nanobot,hermes-agent,minimal] [--out path] [--markdown path] [--json]",
    "  npm run helix -- verify-executable-placeholder-audit --artifact path [--json]",
    "  npm run helix -- todo27-native-rewrite-inventory [--product opencode,pi-mono,nanobot,hermes-agent] [--out path] [--markdown path] [--json]",
    "  npm run helix -- verify-todo27-native-rewrite-inventory --artifact path [--json]",
    "  npm run helix -- todo27-opencode-split-acceptance [--out path] [--markdown path] [--json]",
    "  npm run helix -- verify-todo27-opencode-split-acceptance --artifact path [--json]",
    "  npm run helix -- current-module-placeholder-audit [--product opencode,pi-mono,nanobot,hermes-agent] [--out path] [--markdown path] [--json]",
    "  npm run helix -- verify-current-module-placeholder-audit --artifact path [--json]",
    "  npm run helix -- tui (--recipe-file path|--profile name) [--provider profile-live] [--text prompt] [--profile-root path] [--cwd path] [--storage-dir path] [--json]",
    "  npm run helix -- gateway <start|stop|restart|status|logs|manifests|worker|smoke|smoke-local> <profile> [--channel telegram] [--profile-root path] [--json]",
    "  npm run helix -- live-provider-parity [--provider openai-compatible|openrouter|anthropic|google] [--model id] [--api-key key] [--base-url url] [--product opencode|pi-mono|nanobot|hermes-agent] [--require-credentials] [--artifact-format legacy|split] [--out path] [--out-dir dir] [--summary-out path] [--json]",
    "  npm run helix -- verify-live-provider-parity --artifact path [--provider openai-compatible|openrouter|anthropic|google] [--model id] [--product opencode|pi-mono|nanobot|hermes-agent] [--max-age-ms n] [--json]",
    "  npm run helix -- live-provider-parity migrate-artifact --artifact path --out-dir dir [--summary-out path] [--json]",
    "  npm run helix -- task-parity [--suite smoke] [--task id] [--product opencode,pi-mono,opencode-pi-hybrid,nanobot,hermes-agent] [--recipe-file path] [--mode assembled,original] [--provider cassette|live] [--native-original] [--external-capture native-capture.json] [--model id] [--api-key key] [--base-url url] [--package spec] [--timeout-ms n] [--artifact-format legacy|split] [--out path] [--out-dir dir] [--summary-out path] [--json]",
    "  npm run helix -- verify-task-parity --artifact path [--product opencode,pi-mono,opencode-pi-hybrid,nanobot,hermes-agent] [--mode assembled,original] [--task id] [--json]",
    "  npm run helix -- task-parity diff --artifact-a path --artifact-b path [--json]",
    "  npm run helix -- task-parity migrate-artifact --artifact path --out-dir dir [--summary-out path] [--json]",
    "  npm run helix -- task-parity cadence-diagnose --artifact path [--out path] [--json]",
    "  npm run helix -- task-parity native-cadence-fixtures --artifact path [--artifact-format legacy|split] [--out path] [--out-dir dir] [--summary-out path] [--json]",
    "  npm run helix -- task-parity replay-native-cadence --fixture path [--out path] [--json]",
    "  npm run helix -- differential <opencode|pi-mono|nanobot|hermes-agent> [--native-original] [--model id] [--api-key key] [--base-url url] [--prompt text] [--assistant text] [--json]",
    "  npm run helix -- nanobot lego-depth [--out path] [--markdown path] [--json]",
    "",
    "Examples:",
    "  npm run helix -- run opencode --provider openai-compatible --model \"$HELIX_LIVE_MODEL\" --api-key \"$HELIX_LIVE_API_KEY\" --prompt hello --json",
    "  npm run helix -- run opencode --provider openrouter --model openai/gpt-4.1 --prompt hello --native-json-events",
    "  npm run helix -- run opencode --provider openrouter --model openai/gpt-4.1 --prompt hello --json",
    "  npm run helix -- run pi-mono --provider anthropic --model \"$HELIX_LIVE_MODEL\" --api-key \"$HELIX_LIVE_API_KEY\" --prompt hello --json",
    "  npm run helix -- graph recipe coding-agent.minimal --json",
    "  npm run helix -- graph recipe-file docs/site/harness-builder-export.json --json",
    "  npm run helix -- validate recipe minimal.no-shell --json",
    "  npm run helix -- validate recipe-file docs/site/harness-builder-export.json --json",
    "  npm run helix -- assemble --recipe-file docs/site/harness-builder-export.json --explain --json",
    "  npm run helix -- graph recipe opencode.full --json",
    "  npm run helix -- diff recipe opencode.full pi-mono.full",
    "  npm run helix -- compose --recipe opencode.full --override session=lego-session --json",
    "  npm run helix -- assemble --product opencode --explain --json",
    "  npm run helix -- assemble --product pi-mono --with-external-capture docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json --json",
    "  npm run helix -- assemble --product opencode,pi-mono,opencode-pi-hybrid,nanobot,hermes-agent,minimal --with-task-parity --with-native-fixtures --out-dir docs/reports --strict --json",
    "  npm run helix -- verify-assembly-contract --artifact docs/reports/assembly-contract-opencode.json --require-task-parity --require-native-fixtures --json",
    "  npm run helix -- flow-graph --product opencode --mode blueprint --json",
    "  npm run helix -- flow-graph --recipe-file docs/site/harness-builder-export.json --mode blueprint --out docs/reports/flow-graph-custom.json --json",
    "  npm run helix -- flow-graph --product opencode --mode trace --task read-only-answer --json",
    "  npm run helix -- flow-graph --product hermes-agent --mode native --artifact docs/reports/task-parity-native-cadence-fixtures/manifest.json --json",
    "  npm run helix -- flow-graph --product pi-mono --mode compare --artifact .helix/external-tools/runs/pi-read-only/normalized/native-capture.json --json",
    "  npm run helix -- flow-graph --product opencode --mode native --artifact docs/reports/task-parity-native-cadence-fixtures/manifest.json --json",
    "  npm run helix -- flow-graph --product opencode --mode compare --task read-only-answer --out docs/reports/flow-graph-compare-opencode-read-only-answer.json --json",
    "  npm run helix -- flow-graph reports --out-dir docs/reports --json",
    "  npm run helix -- verify-flow-graph --artifact docs/reports/flow-graph-compare-opencode-read-only-answer.json --json",
    "  HELIX_EXTERNAL_CAPTURE=1 npm run helix -- external-tools capture claude-tap --product pi-mono --task read-only-answer --out-dir .helix/external-tools/runs/pi-read-only --json -- --tap-client pi -- -p \"Reply OK\"",
    "  npm run helix -- external-tools capture claude-tap --strategy uvx --dry-run --product pi-mono --task read-only-answer --json -- --tap-client pi -- -p \"Reply OK\"",
    "  npm run helix -- external-tools capture claude-tap --dry-run --product pi-mono --task read-only-answer --out-dir .helix/external-tools/runs/pi-read-only --json -- --tap-client pi -- -p \"Reply OK\"",
    "  npm run helix -- external-tools import claude-tap --artifact external-tools/claude-tap/fixtures/minimal-jsonl.trace.jsonl --product pi-mono --task read-only-answer --json",
    "  npm run helix -- external-tools verify --artifact .helix/external-tools/runs/pi-read-only/normalized/native-capture.json --run-manifest .helix/external-tools/runs/pi-read-only/run-manifest.json --json",
    "  npm run helix -- external-tools to-native-cadence --artifact .helix/external-tools/runs/pi-read-only/normalized/native-capture.json --out docs/reports/external-tools/claude-tap/pi-read-only/native-cadence-fixture.json --json",
    "  npm run helix -- executable-placeholder-audit --out docs/reports/executable-placeholder-audit.json --markdown docs/reports/executable-placeholder-audit.md --json",
    "  npm run helix -- verify-executable-placeholder-audit --artifact docs/reports/executable-placeholder-audit.json --json",
    "  npm run helix -- todo27-native-rewrite-inventory --out docs/reports/todo27-native-rewrite-inventory.json --markdown docs/reports/todo27-native-rewrite-inventory.md --json",
    "  npm run helix -- verify-todo27-native-rewrite-inventory --artifact docs/reports/todo27-native-rewrite-inventory.json --json",
    "  npm run helix -- todo27-opencode-split-acceptance --out docs/reports/todo27-opencode-split-acceptance.json --markdown docs/reports/todo27-opencode-split-acceptance.md --json",
    "  npm run helix -- verify-todo27-opencode-split-acceptance --artifact docs/reports/todo27-opencode-split-acceptance.json --json",
    "  npm run helix -- current-module-placeholder-audit --out docs/reports/current-module-placeholder-audit.json --markdown docs/reports/current-module-placeholder-audit.md --json",
    "  npm run helix -- verify-current-module-placeholder-audit --artifact docs/reports/current-module-placeholder-audit.json --json",
    "  npm run helix -- tui --recipe-file docs/site/harness-builder-export.json --text hello --json",
    "  npm run helix -- tui --profile my-harness --provider profile-live",
    "  npm run helix -- live-provider-parity --provider openrouter --model openai/gpt-4.1 --require-credentials --out docs/reports/live-provider-parity.json --json",
    "  npm run helix -- verify-live-provider-parity --artifact docs/reports/live-provider-parity.json --provider openrouter --json",
    "  npm run helix -- task-parity --suite smoke --provider cassette --out docs/reports/task-parity.json --json",
    "  npm run helix -- task-parity --product pi-mono --task read-only-answer --mode original --external-capture docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json --json",
    "  npm run helix -- task-parity cadence-diagnose --artifact docs/reports/task-parity-cadence.json --out docs/reports/task-parity-cadence-diagnosis.md --json",
    "  npm run helix -- task-parity native-cadence-fixtures --artifact docs/reports/task-parity.json --artifact-format split --out-dir docs/reports/task-parity-native-cadence-fixtures --json",
    "  npm run helix -- task-parity replay-native-cadence --fixture docs/reports/task-parity-native-cadence-fixtures/summary.json --json",
    "  npm run helix -- task-parity --task read-only-answer --product opencode --mode original --provider live --native-original --model claude-sonnet-4-5 --json",
    "  npm run helix -- verify-task-parity --artifact docs/reports/task-parity.json --json",
    "  npm run helix -- differential opencode --json",
    "  npm run helix -- differential opencode --native-original --model claude-sonnet-4-5 --json",
    "  npm run helix -- differential pi-mono --json",
    "  npm run helix -- nanobot lego-depth --out docs/reports/nanobot-lego-depth.json --markdown docs/reports/nanobot-lego-depth.md --json",
  ].join("\n")
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadDotEnv()
  void runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code
  })
}
