import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import type { LegoMessage, LegoMessagePart, LegoModel, LegoProviderAdapter } from "@helix/contracts"
import {
  createAnthropicProvider,
  createFetchProviderTransport,
  createGoogleProvider,
  createMemoryProviderCassette,
  createOpenAICompatibleProvider,
  createOpenRouterProvider,
  createRecordingProviderTransport,
  defaultProviderFetch,
  type ProviderCassettePort,
  type ProviderCassetteRecord,
  type ProviderTransportPort,
} from "@helix/lego-provider"
import {
  assembleHermesAgentHarness,
  assembleNanobotHarness,
  assembleOpenCodeHarness,
  assembleOpenCodePiHybridHarness,
  assemblePiMonoHarness,
  type AssembledHarness,
  type HarnessProduct,
  type HarnessTurnResult,
} from "./harness"

export type LiveProviderKind = "openai-compatible" | "openrouter" | "anthropic" | "google"
export type LiveProviderParityStatus = "passed" | "skipped" | "failed"
const liveProviderParityProducts = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const satisfies readonly HarnessProduct[]

export interface LiveProviderParityInput {
  cwd?: string
  env?: Record<string, string | undefined>
  provider?: LiveProviderKind
  modelID?: string
  apiKey?: string
  baseURL?: string
  appURL?: string
  appName?: string
  prompt?: string
  products?: HarnessProduct[]
  maxSteps?: number
  maxRetries?: number
  maxOutputTokens?: number
  requireCredentials?: boolean
  cassette?: ProviderCassettePort
}

export interface LiveProviderParityCheck {
  id: string
  ok: boolean
  message: string
  details?: unknown
}

export interface LiveProviderParityProductReport {
  product: HarnessProduct
  status: LiveProviderParityStatus
  ok: boolean
  checks: LiveProviderParityCheck[]
  sessionID?: string
  steps?: number
  finish?: string
}

export interface LiveProviderParityReport {
  status: LiveProviderParityStatus
  ok: boolean
  provider?: LiveProviderKind
  modelID?: string
  products: LiveProviderParityProductReport[]
  checks: LiveProviderParityCheck[]
  issues: LiveProviderParityCheck[]
  missing: string[]
}

export interface LiveProviderParityArtifact {
  schemaVersion: 1
  generatedAt: string
  report: LiveProviderParityReport
}

export interface LiveProviderAttachmentRef {
  path: string
  sha256: string
  byteSize: number
  redactionStatus: "redacted" | "summary-only" | "raw-sanitized"
  required: boolean
  verifierCoverage: string[]
}

export interface LiveProviderParitySummaryArtifactV2 {
  schemaVersion: 2
  artifactKind: "live-provider-parity-summary"
  generatedAt: string
  provider?: LiveProviderKind
  modelID?: string
  status: LiveProviderParityStatus
  ok: boolean
  products: Array<{
    product: HarnessProduct
    status: LiveProviderParityStatus
    ok: boolean
    sessionID?: string
    steps?: number
    readbackChecks: number
  }>
  checks: Array<{ id: string; ok: boolean }>
  manifestPath: string
  evidencePath: string
  attachments: LiveProviderAttachmentRef[]
}

export interface LiveProviderParityEvidenceBundleV2 {
  schemaVersion: 2
  artifactKind: "live-provider-parity-evidence"
  generatedAt: string
  products: LiveProviderParityProductReport[]
  checks: LiveProviderParityCheck[]
}

export interface LiveProviderParityManifestV2 {
  schemaVersion: 2
  artifactKind: "live-provider-parity-manifest"
  generatedAt: string
  summaryPath: string
  evidencePath: string
  attachments: LiveProviderAttachmentRef[]
}

export interface LiveProviderParitySplitArtifactSet {
  summary: LiveProviderParitySummaryArtifactV2
  evidence: LiveProviderParityEvidenceBundleV2
  manifest: LiveProviderParityManifestV2
  attachments: Array<{ ref: LiveProviderAttachmentRef; content: unknown }>
}

export interface LiveProviderParityArtifactVerificationInput {
  artifact: unknown
  expectedProvider?: LiveProviderKind
  expectedModelID?: string
  expectedProducts?: HarnessProduct[]
  now?: Date
  maxAgeMs?: number
}

export interface LiveProviderParityArtifactVerificationReport {
  ok: boolean
  checks: LiveProviderParityCheck[]
  issues: LiveProviderParityCheck[]
  provider?: LiveProviderKind
  modelID?: string
  generatedAt?: string
}

export interface ResolvedLiveProviderConfig {
  provider?: LiveProviderKind
  modelID?: string
  apiKey?: string
  baseURL?: string
  appURL?: string
  appName?: string
  missing: string[]
}

export type ConfiguredLiveProviderConfig = ResolvedLiveProviderConfig & {
  provider: LiveProviderKind
  modelID: string
  apiKey: string
}

export interface LiveProviderCredentialGateResult {
  config: ResolvedLiveProviderConfig
  report?: LiveProviderParityReport
}

export interface LiveProviderCredentialGatePort {
  check(input: LiveProviderParityInput): LiveProviderCredentialGateResult
}

export interface LiveProviderRunnerInput {
  config: ResolvedLiveProviderConfig
  input?: LiveProviderParityInput
  cassette?: ProviderCassettePort
}

export interface LiveProviderRunnerPort {
  run(input: LiveProviderRunnerInput): Promise<LiveProviderParityReport>
}

export interface LiveProviderParityArtifactWriteInput {
  path: string
  report: LiveProviderParityReport
  generatedAt?: Date
}

export interface LiveProviderArtifactWriterPort {
  create(report: LiveProviderParityReport, generatedAt?: Date): LiveProviderParityArtifact
  write(input: LiveProviderParityArtifactWriteInput): LiveProviderParityArtifact
}

export interface LiveProviderArtifactVerifierPort {
  verify(input: LiveProviderParityArtifactVerificationInput): LiveProviderParityArtifactVerificationReport
}

export interface LiveProviderCassetteArtifact {
  schemaVersion: 1
  generatedAt: string
  records: ProviderCassetteRecord[]
}

export interface LiveProviderCassetteGeneratorPort {
  create(initialRecords?: ProviderCassetteRecord[]): ProviderCassettePort
  artifact(cassette: ProviderCassettePort, generatedAt?: Date): LiveProviderCassetteArtifact
}

export async function runLiveProviderParity(input: LiveProviderParityInput = {}): Promise<LiveProviderParityReport> {
  const gate = createLiveProviderCredentialGate()
  const gated = gate.check(input)
  if (gated.report) return gated.report
  return createLiveProviderRunner().run({ config: gated.config, input })
}

export function createLiveProviderCredentialGate(): LiveProviderCredentialGatePort {
  return {
    check(input) {
      const config = resolveLiveProviderConfig(input)
      const report = missingLiveProviderConfigReport(input, config)
      return report ? { config, report } : { config }
    },
  }
}

export function createLiveProviderRunner(): LiveProviderRunnerPort {
  return {
    async run({ config, input = {}, cassette }) {
      const configured = requireLiveProviderConfig(config)
      const providerKind = configured.provider
      const provider = createLiveProvider(providerKind, configured, cassette ?? input.cassette)
      const model = await firstModel(provider)
      const root = mkdtempSync(join(tmpdir(), "helix-live-provider-parity-"))
      try {
        const products: LiveProviderParityProductReport[] = []
        for (const product of input.products ?? liveProviderParityProducts) {
          products.push(
            await runProductLiveProviderParity(product, root, provider, withOutputLimit(model, input.maxOutputTokens), {
              prompt: input.prompt ?? "Reply with a short sentence containing helix-live-ok. Do not call tools.",
              maxSteps: input.maxSteps ?? 2,
              maxRetries: input.maxRetries ?? 0,
            }),
          )
        }
        const checks = [
          check(
            "live-provider:configured",
            true,
            "Live external provider parity has provider, model, and credential inputs.",
            { provider: providerKind, modelID: model.modelID },
          ),
          ...products.flatMap((product) => product.checks),
        ]
        const issues = checks.filter((item) => !item.ok)
        return {
          status: issues.length === 0 ? "passed" : "failed",
          ok: issues.length === 0,
          provider: providerKind,
          modelID: String(model.modelID),
          products,
          checks,
          issues,
          missing: [],
        }
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    },
  }
}

export function createLiveProviderArtifactWriter(): LiveProviderArtifactWriterPort {
  return {
    create(report, generatedAt) {
      return createLiveProviderParityArtifact(report, generatedAt)
    },
    write(input) {
      const artifact = createLiveProviderParityArtifact(input.report, input.generatedAt)
      mkdirSync(dirname(input.path), { recursive: true })
      writeFileSync(input.path, `${JSON.stringify(artifact, null, 2)}\n`, "utf8")
      return artifact
    },
  }
}

export function createLiveProviderArtifactVerifier(): LiveProviderArtifactVerifierPort {
  return {
    verify(input) {
      return verifyLiveProviderParityArtifact(input)
    },
  }
}

export function createLiveProviderCassetteGenerator(): LiveProviderCassetteGeneratorPort {
  return {
    create(initialRecords = []) {
      return createMemoryProviderCassette(initialRecords)
    },
    artifact(cassette, generatedAt = new Date()) {
      return {
        schemaVersion: 1,
        generatedAt: generatedAt.toISOString(),
        records: cassette.records(),
      }
    },
  }
}

export function resolveLiveProviderConfig(input: LiveProviderParityInput): ResolvedLiveProviderConfig {
  const env = input.env ?? process.env
  const provider = input.provider ?? providerFromEnv(env)
  const modelID = input.modelID ?? modelFromEnv(provider, env)
  const apiKey = input.apiKey ?? apiKeyFromEnv(provider, env)
  const baseURL = input.baseURL ?? env["HELIX_LIVE_BASE_URL"]
  const appURL = input.appURL ?? env["HELIX_LIVE_APP_URL"]
  const appName = input.appName ?? env["HELIX_LIVE_APP_NAME"]
  const missing: string[] = []
  if (!provider) missing.push("HELIX_LIVE_PROVIDER")
  if (!modelID) missing.push(provider ? modelEnvName(provider) : "HELIX_LIVE_MODEL")
  if (!apiKey) missing.push(provider ? apiKeyEnvName(provider) : "provider API key")
  return {
    ...(provider ? { provider } : {}),
    ...(modelID ? { modelID } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(baseURL ? { baseURL } : {}),
    ...(appURL ? { appURL } : {}),
    ...(appName ? { appName } : {}),
    missing,
  }
}

function missingLiveProviderConfigReport(
  input: LiveProviderParityInput,
  config: ResolvedLiveProviderConfig,
): LiveProviderParityReport | undefined {
  if (config.missing.length === 0) return undefined
  const configured = check(
    "live-provider:configured",
    false,
    "Live external provider parity is not configured; set provider, model, and credential inputs or environment variables.",
    { missing: config.missing },
  )
  const status: LiveProviderParityStatus = input.requireCredentials ? "failed" : "skipped"
  return {
    status,
    ok: !input.requireCredentials,
    ...(config.provider ? { provider: config.provider } : {}),
    ...(config.modelID ? { modelID: config.modelID } : {}),
    products: [],
    checks: [configured],
    issues: input.requireCredentials ? [configured] : [],
    missing: config.missing,
  }
}

function requireLiveProviderConfig(config: ResolvedLiveProviderConfig): ConfiguredLiveProviderConfig {
  if (!config.provider || !config.modelID || !config.apiKey || config.missing.length > 0) {
    throw new Error(`Live provider runner requires resolved provider, modelID, and apiKey; missing: ${config.missing.join(", ") || "unknown"}.`)
  }
  return {
    ...config,
    provider: config.provider,
    modelID: config.modelID,
    apiKey: config.apiKey,
  }
}

export function createLiveProvider(provider: LiveProviderKind, config: ConfiguredLiveProviderConfig, cassette?: ProviderCassettePort): LegoProviderAdapter {
  const models = [config.modelID]
  const transport = liveProviderTransport(cassette)
  if (provider === "openrouter") {
    return createOpenRouterProvider({
      models,
      apiKey: config.apiKey,
      ...(transport ? { transport } : {}),
      ...(config.appURL ? { siteURL: config.appURL } : {}),
      ...(config.appName ? { appName: config.appName } : {}),
    })
  }
  if (provider === "anthropic") {
    return createAnthropicProvider({
      models,
      apiKey: config.apiKey,
      ...(transport ? { transport } : {}),
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    })
  }
  if (provider === "google") {
    return createGoogleProvider({
      models,
      apiKey: config.apiKey,
      ...(transport ? { transport } : {}),
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    })
  }
  return createOpenAICompatibleProvider({
    models,
    apiKey: config.apiKey,
    ...(transport ? { transport } : {}),
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  })
}

function liveProviderTransport(cassette: ProviderCassettePort | undefined): ProviderTransportPort | undefined {
  if (!cassette) return undefined
  return createRecordingProviderTransport(createFetchProviderTransport(defaultProviderFetch), cassette)
}

export function createLiveProviderParityArtifact(report: LiveProviderParityReport, generatedAt = new Date()): LiveProviderParityArtifact {
  return {
    schemaVersion: 1,
    generatedAt: generatedAt.toISOString(),
    report: structuredClone(report),
  }
}

export function createLiveProviderParitySplitArtifactSet(report: LiveProviderParityReport, generatedAt = new Date()): LiveProviderParitySplitArtifactSet {
  const timestamp = generatedAt.toISOString()
  const attachments = report.products.map((product) => {
    const content = {
      product: product.product,
      status: product.status,
      ok: product.ok,
      checks: product.checks,
      sessionID: product.sessionID,
      steps: product.steps,
      finish: product.finish,
    }
    const path = `attachments/${product.product}.json`
    return {
      ref: liveAttachmentRef(path, content, ["live-provider-artifact:products", "live-provider-artifact:checks"]),
      content,
    }
  })
  const evidence: LiveProviderParityEvidenceBundleV2 = {
    schemaVersion: 2,
    artifactKind: "live-provider-parity-evidence",
    generatedAt: timestamp,
    products: structuredClone(report.products),
    checks: structuredClone(report.checks),
  }
  const summary: LiveProviderParitySummaryArtifactV2 = {
    schemaVersion: 2,
    artifactKind: "live-provider-parity-summary",
    generatedAt: timestamp,
    ...(report.provider ? { provider: report.provider } : {}),
    ...(report.modelID ? { modelID: report.modelID } : {}),
    status: report.status,
    ok: report.ok,
    products: report.products.map((product) => ({
      product: product.product,
      status: product.status,
      ok: product.ok,
      ...(product.sessionID ? { sessionID: product.sessionID } : {}),
      ...(product.steps === undefined ? {} : { steps: product.steps }),
      readbackChecks: product.checks.filter((check) => check.id.endsWith("sdk-readback") && check.ok).length,
    })),
    checks: report.checks.map((check) => ({ id: check.id, ok: check.ok })),
    manifestPath: "manifest.json",
    evidencePath: "evidence.json",
    attachments: attachments.map((attachment) => attachment.ref),
  }
  const manifest: LiveProviderParityManifestV2 = {
    schemaVersion: 2,
    artifactKind: "live-provider-parity-manifest",
    generatedAt: timestamp,
    summaryPath: "summary.json",
    evidencePath: "evidence.json",
    attachments: summary.attachments,
  }
  return { summary, evidence, manifest, attachments }
}

export function writeLiveProviderParitySplitArtifactSet(input: {
  outDir: string
  artifactSet: LiveProviderParitySplitArtifactSet
  summaryOut?: string
}): void {
  mkdirSync(join(input.outDir, "attachments"), { recursive: true })
  writeJSONFile(join(input.outDir, "summary.json"), input.artifactSet.summary)
  writeJSONFile(join(input.outDir, "evidence.json"), input.artifactSet.evidence)
  writeJSONFile(join(input.outDir, "manifest.json"), input.artifactSet.manifest)
  for (const attachment of input.artifactSet.attachments) writeJSONFile(join(input.outDir, attachment.ref.path), attachment.content)
  if (input.summaryOut) writeJSONFile(input.summaryOut, input.artifactSet.summary)
}

export function readLiveProviderParitySplitArtifactSet(summaryPath: string): LiveProviderParitySplitArtifactSet {
  const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as LiveProviderParitySummaryArtifactV2
  const baseDir = dirname(summaryPath)
  const evidence = JSON.parse(readFileSync(resolve(baseDir, summary.evidencePath), "utf8")) as LiveProviderParityEvidenceBundleV2
  const manifest = JSON.parse(readFileSync(resolve(baseDir, summary.manifestPath), "utf8")) as LiveProviderParityManifestV2
  return {
    summary,
    evidence,
    manifest,
    attachments: manifest.attachments.map((ref) => ({ ref, content: JSON.parse(readFileSync(resolve(baseDir, ref.path), "utf8")) as unknown })),
  }
}

export function verifyLiveProviderParityArtifact(
  input: LiveProviderParityArtifactVerificationInput,
): LiveProviderParityArtifactVerificationReport {
  if (isLiveProviderParitySplitArtifactSet(input.artifact)) return verifyLiveProviderParitySplitArtifactSet(input.artifact, input)
  if (isLiveProviderParitySummaryArtifactV2(input.artifact)) return verifyLiveProviderParitySummaryArtifactV2(input.artifact, input)
  const artifact = record(input.artifact)
  const report = record(artifact?.["report"])
  const generatedAt = typeof artifact?.["generatedAt"] === "string" ? artifact["generatedAt"] : undefined
  const parsedGeneratedAt = generatedAt ? new Date(generatedAt) : undefined
  const provider = liveProviderKind(report?.["provider"])
  const modelID = typeof report?.["modelID"] === "string" ? report["modelID"] : undefined
  const products = Array.isArray(report?.["products"]) ? report["products"].map(record).filter(Boolean) : []
  const productNames = products
    .map((product) => product?.["product"])
    .filter((product): product is HarnessProduct => isHarnessProduct(product))
  const requiredProducts = input.expectedProducts ?? [...liveProviderParityProducts]
  const checks: LiveProviderParityCheck[] = [
    check(
      "live-provider-artifact:schema",
      artifact?.["schemaVersion"] === 1 && Boolean(report),
      "Live provider parity artifact uses schemaVersion 1 and contains a report.",
      { schemaVersion: artifact?.["schemaVersion"] },
    ),
    check(
      "live-provider-artifact:generated-at",
      Boolean(parsedGeneratedAt && Number.isFinite(parsedGeneratedAt.getTime())),
      "Live provider parity artifact has a valid generatedAt timestamp.",
      { generatedAt },
    ),
    check(
      "live-provider-artifact:no-secret-fields",
      !containsSecretField(input.artifact),
      "Live provider parity artifact does not contain credential-shaped fields.",
    ),
    check(
      "live-provider-artifact:passed",
      report?.["status"] === "passed" &&
        report?.["ok"] === true &&
        Array.isArray(report?.["issues"]) &&
        report["issues"].length === 0 &&
        Array.isArray(report?.["missing"]) &&
        report["missing"].length === 0,
      "Live provider parity report is passed, ok, has no issues, and has no missing credential inputs.",
      {
        status: report?.["status"],
        ok: report?.["ok"],
        issues: Array.isArray(report?.["issues"]) ? report["issues"].length : undefined,
        missing: Array.isArray(report?.["missing"]) ? report["missing"] : undefined,
      },
    ),
    check(
      "live-provider-artifact:provider-model",
      Boolean(provider) &&
        Boolean(modelID) &&
        (input.expectedProvider === undefined || provider === input.expectedProvider) &&
        (input.expectedModelID === undefined || modelID === input.expectedModelID),
      "Live provider parity artifact records the expected provider and model.",
      { provider, modelID, expectedProvider: input.expectedProvider, expectedModelID: input.expectedModelID },
    ),
    check(
      "live-provider-artifact:products",
      requiredProducts.every((product) => productNames.includes(product)) &&
        products
          .filter((product) => requiredProducts.includes(product?.["product"] as HarnessProduct))
          .every((product) => product?.["status"] === "passed" && product?.["ok"] === true && typeof product?.["sessionID"] === "string" && Number(product?.["steps"]) >= 1),
      "Live provider parity artifact records passed product reports with session IDs and executed steps.",
      {
        requiredProducts,
        products: products.map((product) => ({
          product: product?.["product"],
          status: product?.["status"],
          ok: product?.["ok"],
          sessionID: product?.["sessionID"],
          steps: product?.["steps"],
        })),
      },
    ),
    check(
      "live-provider-artifact:checks",
      hasOkCheck(report, "live-provider:configured") &&
        requiredProducts.every(
          (product) => hasOkCheck(report, `${product}:live-provider-turn`) && hasOkCheck(report, `${product}:live-provider-sdk-readback`),
        ),
      "Live provider parity artifact includes the configured, turn, and SDK readback checks for required products.",
      { requiredProducts },
    ),
  ]
  if (input.maxAgeMs !== undefined) {
    const now = input.now ?? new Date()
    checks.push(
      check(
        "live-provider-artifact:freshness",
        Boolean(parsedGeneratedAt && now.getTime() - parsedGeneratedAt.getTime() <= input.maxAgeMs),
        "Live provider parity artifact is within the configured freshness window.",
        { generatedAt, now: now.toISOString(), maxAgeMs: input.maxAgeMs },
      ),
    )
  }
  const issues = checks.filter((item) => !item.ok)
  return {
    ok: issues.length === 0,
    checks,
    issues,
    ...(provider ? { provider } : {}),
    ...(modelID ? { modelID } : {}),
    ...(generatedAt ? { generatedAt } : {}),
  }
}

function verifyLiveProviderParitySplitArtifactSet(
  artifactSet: LiveProviderParitySplitArtifactSet,
  input: Omit<LiveProviderParityArtifactVerificationInput, "artifact">,
): LiveProviderParityArtifactVerificationReport {
  const summaryVerification = verifyLiveProviderParitySummaryArtifactV2(artifactSet.summary, input)
  const checks = [...summaryVerification.checks]
  checks.push(check("live-provider-artifact:evidence", artifactSet.evidence.artifactKind === "live-provider-parity-evidence", "Live provider split evidence is present."))
  checks.push(check("live-provider-artifact:manifest", artifactSet.manifest.artifactKind === "live-provider-parity-manifest", "Live provider split manifest is present."))
  const attachments = new Map(artifactSet.attachments.map((attachment) => [attachment.ref.path, attachment]))
  for (const ref of artifactSet.manifest.attachments) {
    const attachment = attachments.get(ref.path)
    const text = attachment ? `${JSON.stringify(attachment.content, null, 2)}\n` : ""
    checks.push(check(`live-provider-artifact:attachment-present:${ref.path}`, Boolean(attachment) || !ref.required, `Attachment ${ref.path} is present.`))
    if (attachment) {
      checks.push(check(`live-provider-artifact:attachment-hash:${ref.path}`, createHash("sha256").update(text).digest("hex") === ref.sha256, `Attachment ${ref.path} hash matches.`))
      checks.push(check(`live-provider-artifact:attachment-no-secrets:${ref.path}`, !containsSecretField(attachment.content), `Attachment ${ref.path} does not contain credential-shaped fields.`))
    }
  }
  const issues = checks.filter((item) => !item.ok)
  return {
    ok: issues.length === 0,
    checks,
    issues,
    ...(artifactSet.summary.provider ? { provider: artifactSet.summary.provider } : {}),
    ...(artifactSet.summary.modelID ? { modelID: artifactSet.summary.modelID } : {}),
    generatedAt: artifactSet.summary.generatedAt,
  }
}

function verifyLiveProviderParitySummaryArtifactV2(
  summary: LiveProviderParitySummaryArtifactV2,
  input: Omit<LiveProviderParityArtifactVerificationInput, "artifact">,
): LiveProviderParityArtifactVerificationReport {
  const parsedGeneratedAt = new Date(summary.generatedAt)
  const requiredProducts = input.expectedProducts ?? [...liveProviderParityProducts]
  const checks: LiveProviderParityCheck[] = [
    check("live-provider-artifact:schema", summary.schemaVersion === 2, "Live provider parity artifact uses schemaVersion 2."),
    check("live-provider-artifact:generated-at", Number.isFinite(parsedGeneratedAt.getTime()), "Live provider parity artifact has a valid generatedAt timestamp."),
    check("live-provider-artifact:no-secret-fields", !containsSecretField(summary), "Live provider parity artifact does not contain credential-shaped fields."),
    check("live-provider-artifact:passed", summary.status === "passed" && summary.ok === true, "Live provider parity report is passed."),
    check(
      "live-provider-artifact:provider-model",
      Boolean(summary.provider) &&
        Boolean(summary.modelID) &&
        (input.expectedProvider === undefined || summary.provider === input.expectedProvider) &&
        (input.expectedModelID === undefined || summary.modelID === input.expectedModelID),
      "Live provider parity artifact records the expected provider and model.",
      { provider: summary.provider, modelID: summary.modelID },
    ),
    check(
      "live-provider-artifact:products",
      requiredProducts.every((product) => summary.products.some((item) => item.product === product && item.status === "passed" && item.ok && item.sessionID && Number(item.steps) >= 1)),
      "Live provider parity artifact records passed product reports with session IDs and executed steps.",
      { requiredProducts },
    ),
    check(
      "live-provider-artifact:checks",
      requiredProducts.every(
        (product) =>
          summary.checks.some((item) => item.id === `${product}:live-provider-turn` && item.ok) &&
          summary.checks.some((item) => item.id === `${product}:live-provider-sdk-readback` && item.ok),
      ),
      "Live provider parity artifact includes turn and readback checks for required products.",
      { requiredProducts },
    ),
    check("live-provider-artifact:attachment-hashes", summary.attachments.every((ref) => ref.sha256.length === 64), "Summary includes attachment hashes."),
  ]
  if (input.maxAgeMs !== undefined) {
    const now = input.now ?? new Date()
    checks.push(check("live-provider-artifact:freshness", now.getTime() - parsedGeneratedAt.getTime() <= input.maxAgeMs, "Live provider parity artifact is fresh."))
  }
  const issues = checks.filter((item) => !item.ok)
  return {
    ok: issues.length === 0,
    checks,
    issues,
    ...(summary.provider ? { provider: summary.provider } : {}),
    ...(summary.modelID ? { modelID: summary.modelID } : {}),
    generatedAt: summary.generatedAt,
  }
}

function providerFromEnv(env: Record<string, string | undefined>): LiveProviderKind | undefined {
  const configured = env["HELIX_LIVE_PROVIDER"]
  if (configured) return parseLiveProviderKind(configured)
  if (env["OPENROUTER_API_KEY"]) return "openrouter"
  if (env["ANTHROPIC_API_KEY"]) return "anthropic"
  if (env["GOOGLE_API_KEY"] || env["GEMINI_API_KEY"]) return "google"
  if (env["OPENAI_API_KEY"]) return "openai-compatible"
  return undefined
}

function parseLiveProviderKind(value: string): LiveProviderKind {
  if (value === "openai" || value === "openai-compatible") return "openai-compatible"
  if (value === "openrouter") return "openrouter"
  if (value === "anthropic") return "anthropic"
  if (value === "google" || value === "gemini") return "google"
  throw new Error(`Unknown live provider kind: ${value}`)
}

function modelFromEnv(provider: LiveProviderKind | undefined, env: Record<string, string | undefined>): string | undefined {
  if (env["HELIX_LIVE_MODEL"]) return env["HELIX_LIVE_MODEL"]
  if (provider === "openrouter") return env["OPENROUTER_MODEL"]
  if (provider === "anthropic") return env["ANTHROPIC_MODEL"]
  if (provider === "google") return env["GOOGLE_MODEL"] ?? env["GEMINI_MODEL"]
  if (provider === "openai-compatible") return env["OPENAI_MODEL"]
  return undefined
}

function apiKeyFromEnv(provider: LiveProviderKind | undefined, env: Record<string, string | undefined>): string | undefined {
  if (provider === "openrouter") return env["OPENROUTER_API_KEY"]
  if (provider === "anthropic") return env["ANTHROPIC_API_KEY"]
  if (provider === "google") return env["GOOGLE_API_KEY"] ?? env["GEMINI_API_KEY"]
  if (provider === "openai-compatible") return env["OPENAI_API_KEY"]
  return undefined
}

function modelEnvName(provider: LiveProviderKind): string {
  if (provider === "openrouter") return "HELIX_LIVE_MODEL or OPENROUTER_MODEL"
  if (provider === "anthropic") return "HELIX_LIVE_MODEL or ANTHROPIC_MODEL"
  if (provider === "google") return "HELIX_LIVE_MODEL, GOOGLE_MODEL, or GEMINI_MODEL"
  return "HELIX_LIVE_MODEL or OPENAI_MODEL"
}

function apiKeyEnvName(provider: LiveProviderKind): string {
  if (provider === "openrouter") return "OPENROUTER_API_KEY"
  if (provider === "anthropic") return "ANTHROPIC_API_KEY"
  if (provider === "google") return "GOOGLE_API_KEY or GEMINI_API_KEY"
  return "OPENAI_API_KEY"
}

function liveProviderKind(value: unknown): LiveProviderKind | undefined {
  return value === "openai-compatible" || value === "openrouter" || value === "anthropic" || value === "google" ? value : undefined
}

function hasOkCheck(report: Record<string, unknown> | undefined, id: string): boolean {
  return Array.isArray(report?.["checks"]) && report["checks"].some((item) => record(item)?.["id"] === id && record(item)?.["ok"] === true)
}

function containsSecretField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSecretField)
  const item = record(value)
  if (!item) return false
  for (const [key, nested] of Object.entries(item)) {
    const normalized = key.toLowerCase().replace(/[-_]/g, "")
    if (normalized === "apikey" || normalized === "authorization" || normalized === "accesstoken" || normalized === "secret") return true
    if (containsSecretField(nested)) return true
  }
  return false
}

function liveAttachmentRef(path: string, content: unknown, verifierCoverage: string[]): LiveProviderAttachmentRef {
  const text = `${JSON.stringify(content, null, 2)}\n`
  return {
    path,
    sha256: createHash("sha256").update(text).digest("hex"),
    byteSize: Buffer.byteLength(text),
    redactionStatus: "raw-sanitized",
    required: true,
    verifierCoverage,
  }
}

function writeJSONFile(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function isLiveProviderParitySummaryArtifactV2(value: unknown): value is LiveProviderParitySummaryArtifactV2 {
  const candidate = record(value) as LiveProviderParitySummaryArtifactV2 | undefined
  return Boolean(candidate?.schemaVersion === 2 && candidate.artifactKind === "live-provider-parity-summary" && Array.isArray(candidate.products))
}

function isLiveProviderParitySplitArtifactSet(value: unknown): value is LiveProviderParitySplitArtifactSet {
  const candidate = record(value) as LiveProviderParitySplitArtifactSet | undefined
  return Boolean(
    candidate &&
      isLiveProviderParitySummaryArtifactV2(candidate.summary) &&
      record(candidate.evidence)?.["artifactKind"] === "live-provider-parity-evidence" &&
      record(candidate.manifest)?.["artifactKind"] === "live-provider-parity-manifest" &&
      Array.isArray(candidate.attachments),
  )
}

async function runProductLiveProviderParity(
  product: HarnessProduct,
  root: string,
  provider: LegoProviderAdapter,
  model: LegoModel,
  options: { prompt: string; maxSteps: number; maxRetries: number },
): Promise<LiveProviderParityProductReport> {
  const harness = assembleProduct(product, join(root, product))
  const checks: LiveProviderParityCheck[] = []
  let result: HarnessTurnResult | undefined
  try {
    result = await harness.runTurn({
      text: options.prompt,
      provider,
      model,
      maxSteps: options.maxSteps,
      maxRetries: options.maxRetries,
    })
    const assistantText = messageText(result.assistantMessage)
    const sdk = harness.hooks.services.get(productSDKServiceID(product)) as
      | { getSession(sessionID: string): Promise<{ transcript: LegoMessage[] }> }
      | undefined
    const readback = sdk ? await sdk.getSession(result.session.id) : undefined
    checks.push(
      check(
        `${product}:live-provider-turn`,
        result.steps >= 1 &&
          result.finish !== "provider_error" &&
          result.transcript.map((message) => message.role).includes("assistant") &&
          assistantText.length > 0,
        `${product} runs a live external provider turn through the assembled harness.`,
        {
          sessionID: result.session.id,
          steps: result.steps,
          finish: result.finish,
          assistantText: assistantText.slice(0, 200),
          blockedTools: result.blockedTools,
        },
      ),
      check(
        `${product}:live-provider-sdk-readback`,
        Array.isArray(readback?.transcript) &&
          readback.transcript.length >= 2 &&
          readback.transcript.some((message) => message.role === "assistant"),
        `${product} product SDK can read back the live provider session transcript.`,
        { transcript: readback?.transcript.length },
      ),
    )
  } catch (error) {
    checks.push(
      check(`${product}:live-provider-error`, false, `${product} live provider turn threw.`, {
        message: error instanceof Error ? error.message : String(error),
      }),
    )
  }
  const issues = checks.filter((item) => !item.ok)
  return {
    product,
    status: issues.length === 0 ? "passed" : "failed",
    ok: issues.length === 0,
    checks,
    ...(result ? { sessionID: result.session.id, steps: result.steps } : {}),
    ...(result?.finish ? { finish: result.finish } : {}),
  }
}

function assembleProduct(product: HarnessProduct, cwd: string): AssembledHarness {
  if (product === "opencode") return assembleOpenCodeHarness({ cwd })
  if (product === "pi-mono") return assemblePiMonoHarness({ cwd })
  if (product === "opencode-pi-hybrid") return assembleOpenCodePiHybridHarness({ cwd })
  if (product === "hermes-agent") return assembleHermesAgentHarness({ cwd })
  return assembleNanobotHarness({ cwd })
}

function productSDKServiceID(product: HarnessProduct): string {
  if (product === "opencode") return "opencode.sdk"
  if (product === "pi-mono") return "pi.sdk"
  if (product === "opencode-pi-hybrid") return "opencode.sdk"
  if (product === "hermes-agent") return "hermes.sdk"
  return "nanobot.sdk"
}

function isHarnessProduct(value: unknown): value is HarnessProduct {
  return value === "opencode" || value === "pi-mono" || value === "opencode-pi-hybrid" || value === "nanobot" || value === "hermes-agent"
}

async function firstModel(provider: LegoProviderAdapter): Promise<LegoModel> {
  const models = await provider.models()
  const model = models[0]
  if (!model) throw new Error(`Live provider ${provider.id} exposed no models.`)
  return model
}

function withOutputLimit(model: LegoModel, maxOutputTokens = 64): LegoModel {
  return {
    ...model,
    maxOutputTokens: model.maxOutputTokens ?? maxOutputTokens,
  }
}

function messageText(message: LegoMessage): string {
  return message.parts.map(partText).filter(Boolean).join("\n")
}

function partText(part: LegoMessagePart): string {
  if (part.type === "text" || part.type === "reasoning") return part.text
  if (part.type === "tool_call") return `[tool:${part.toolName}] ${JSON.stringify(part.input)}`
  if (part.type === "tool_result") return part.content.map(partText).filter(Boolean).join("\n")
  if (part.type === "compaction") return part.summary
  if (part.type === "custom") return part.display ?? JSON.stringify(part.data)
  return ""
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function check(id: string, ok: boolean, message: string, details?: unknown): LiveProviderParityCheck {
  return {
    id,
    ok,
    message,
    ...(details === undefined ? {} : { details }),
  }
}
