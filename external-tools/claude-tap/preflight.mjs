#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { credentialEnvNames, loadCredentialDotEnv } from "./credential-env.mjs"

const products = [
  { product: "opencode", slug: "opencode-read-only", scriptSlug: "opencode", aliases: [], captureArgs: '--tap-client opencode -- run "Reply OK"' },
  { product: "pi-mono", slug: "pi-read-only", scriptSlug: "pi", aliases: ["pi"], captureArgs: '--tap-client pi -- -p "Reply OK"' },
  { product: "hermes-agent", slug: "hermes-read-only", scriptSlug: "hermes", aliases: ["hermes"], captureArgs: '--tap-client hermes -- chat "Reply OK"' },
]

const argv = process.argv.slice(2)
const args = new Set(argv)
const json = args.has("--json")
const strict = args.has("--strict")
const skipToolCheck = args.has("--skip-tool-check")
const requireCaptures = args.has("--require-captures")
const requireCompare = args.has("--require-compare")
const requirementTarget = requireCompare ? "compare" : requireCaptures ? "captures" : "capture-ready"
const verifyPostRunCaptures = requirementTarget === "captures" || requirementTarget === "compare"
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const root = resolve(readOption("--root") ?? process.cwd())
const dotenv = args.has("--no-dotenv") ? undefined : loadCredentialDotEnv(resolve(root, ".env"), process.env)
const strategyInput = readOption("--strategy")
const toolPathInput = readOption("--tool-path")
if (args.has("--tool-path") && (toolPathInput === undefined || toolPathInput.startsWith("--"))) {
  console.error("Missing claude-tap preflight tool path after --tool-path.")
  process.exit(2)
}
const requiredStrategy = strategyInput ?? (toolPathInput ? "explicitPath" : undefined)
if (requiredStrategy !== undefined && requiredStrategy !== "binary" && requiredStrategy !== "uvx" && requiredStrategy !== "explicitPath") {
  console.error(`Unsupported claude-tap preflight strategy: ${requiredStrategy}. Expected binary, uvx, or explicitPath.`)
  process.exit(2)
}
if (toolPathInput && requiredStrategy !== "explicitPath") {
  console.error("--tool-path can only be combined with --strategy explicitPath.")
  process.exit(2)
}
if (requiredStrategy === "explicitPath" && !toolPathInput) {
  console.error("--strategy explicitPath requires --tool-path.")
  process.exit(2)
}
const toolPath = toolPathInput ? resolve(toolPathInput) : undefined
const productInput = readOption("--product")
if (args.has("--product") && (productInput === undefined || productInput.startsWith("--"))) {
  console.error("Missing claude-tap preflight product after --product.")
  process.exit(2)
}
const requiredProduct = productInput ? normalizeProduct(productInput) : undefined
if (productInput && !requiredProduct) {
  console.error(`Unsupported claude-tap preflight product: ${productInput}. Expected ${supportedProductText()}.`)
  process.exit(2)
}
const selectedProducts = requiredProduct ? products.filter((item) => item.product === requiredProduct) : products

const strategyChecks = [
  { strategy: "binary", command: "claude-tap", args: ["--version"] },
  { strategy: "uvx", command: "uvx", args: ["claude-tap", "--version"] },
  ...(toolPath ? [{ strategy: "explicitPath", command: toolPath, args: ["--version"], toolPath }] : []),
].filter((item) => requiredStrategy === undefined || item.strategy === requiredStrategy)
const toolStrategies = strategyChecks.map((item) => checkTool(item.strategy, item.command, item.args))
const credentialEnvPresent = credentialEnvNames.filter((name) => Boolean(process.env[name]?.trim()))
const allowNoCredentials = process.env.HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS === "1"
const gates = {
  consent: {
    env: "HELIX_EXTERNAL_CAPTURE",
    ok: process.env.HELIX_EXTERNAL_CAPTURE === "1",
  },
  credentials: {
    ok: credentialEnvPresent.length > 0 || allowNoCredentials,
    envNamesPresent: credentialEnvPresent,
    allowNoCredentials,
  },
}
const artifacts = selectedProducts.map((item) => {
  const runDir = `.helix/external-tools/runs/${item.slug}`
  const files = {
    manifest: `${runDir}/run-manifest.json`,
    rawTrace: `${runDir}/raw/trace.jsonl`,
    normalizedCapture: `${runDir}/normalized/native-capture.json`,
    flowCompare: `${runDir}/flow-compare.json`,
  }
  const inspectedFiles = {
    manifest: inspectRunManifest(files.manifest, item.product, { verify: verifyPostRunCaptures }),
    rawTrace: inspectArtifactFile("rawTrace", files.rawTrace, item.product),
    normalizedCapture: inspectNormalizedCapture(files.normalizedCapture, files.manifest, item.product, { verify: verifyPostRunCaptures }),
    flowCompare: inspectFlowCompare(files.flowCompare, item.product, { verify: requireCompare }),
  }
  const capturesReady = inspectedFiles.manifest.valid === true && inspectedFiles.rawTrace.exists && inspectedFiles.normalizedCapture.valid === true
  return {
    product: item.product,
    slug: item.slug,
    runDir,
    readiness: {
      capturesReady,
      compareReady: capturesReady && inspectedFiles.flowCompare.valid === true,
    },
    files: inspectedFiles,
  }
})
const toolReady = toolStrategies.some((strategy) => strategy.ok)
const readyToCapture = gates.consent.ok && gates.credentials.ok && toolReady
const manifestsReady = artifacts.every((item) => item.files.manifest.valid)
const rawTracesReady = artifacts.every((item) => item.files.rawTrace.exists)
const normalizedCapturesReady = artifacts.every((item) => item.files.normalizedCapture.valid)
const readyToVerify = manifestsReady && rawTracesReady && normalizedCapturesReady
const flowCompareComplete = artifacts.every((item) => item.files.flowCompare.valid)
const compareReady = readyToVerify && flowCompareComplete
const recommendedStrategy = requiredStrategy ?? (toolStrategies.find((strategy) => strategy.strategy === "uvx" && strategy.ok) ? "uvx" : toolStrategies.find((strategy) => strategy.ok)?.strategy)
const requirementOK = requirementTarget === "compare" ? compareReady : requirementTarget === "captures" ? readyToVerify : readyToCapture
const missing = missingRequirements(requirementTarget)

const report = {
  ok: requirementOK,
  readyToCapture,
  readyToVerify,
  manifestsReady,
  rawTracesReady,
  normalizedCapturesReady,
  flowCompareComplete,
  recommendedStrategy: recommendedStrategy ?? "none",
  products: selectedProducts.map((item) => item.product),
  requirements: {
    target: requirementTarget,
    strategy: requiredStrategy ?? "any",
    ...(toolPath ? { toolPath } : {}),
    product: requiredProduct ?? "all",
    productInput: productInput ?? "all",
    products: selectedProducts.map((item) => item.product),
    ok: requirementOK,
    captureReady: readyToCapture,
    capturesReady: readyToVerify,
    compareReady,
  },
  ...(dotenv ? { dotenv } : {}),
  gates,
  toolStrategies,
  artifacts,
  missing,
  nextCommands: nextCommands(recommendedStrategy, selectedProducts, toolPath),
}

if (json) {
  console.log(`${JSON.stringify(report, null, 2)}\n`)
} else {
  printHuman(report)
}

if (strict && !requirementOK) process.exit(2)

function checkTool(strategy, command, toolArgs) {
  if (skipToolCheck) return { strategy, command, args: toolArgs, ...(strategy === "explicitPath" ? { toolPath: command } : {}), ok: false, skipped: true }
  const result = spawnSync(command, toolArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 10000,
  })
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim()
  const version = /\b(\d+\.\d+\.\d+(?:[-+][A-Za-z0-9._-]+)?)\b/.exec(text)?.[1]
  return {
    strategy,
    command,
    args: toolArgs,
    ...(strategy === "explicitPath" ? { toolPath: command } : {}),
    ok: result.status === 0,
    ...(version ? { version } : {}),
    ...(result.error ? { error: result.error.message } : result.status === 0 ? {} : { error: firstLine(text) || `exit ${result.status ?? "unknown"}` }),
  }
}

function inspectArtifactFile(kind, path, product) {
  const resolvedPath = resolve(root, path)
  const base = { path, exists: existsSync(resolvedPath) }
  if (!base.exists) return base
  if (kind !== "normalizedCapture" && kind !== "flowCompare") return base
  try {
    const value = JSON.parse(readFileSync(resolvedPath, "utf8"))
    const issues = kind === "normalizedCapture" ? normalizedCaptureIssues(value, product) : flowCompareIssues(value, product)
    return {
      ...base,
      valid: issues.length === 0,
      issues,
      summary: artifactSummary(kind, value),
    }
  } catch (error) {
    return {
      ...base,
      valid: false,
      issues: [`parse: ${error instanceof Error ? error.message : String(error)}`],
    }
  }
}

function inspectRunManifest(path, product, options = {}) {
  const resolvedPath = resolve(root, path)
  const base = { path, exists: existsSync(resolvedPath) }
  if (!base.exists) return base
  if (!options.verify) {
    return {
      ...base,
      skipped: true,
      reason: "run manifest verification only runs with --require-captures or --require-compare",
    }
  }
  let summary
  try {
    summary = artifactSummary("manifest", JSON.parse(readFileSync(resolvedPath, "utf8")))
  } catch {
    summary = undefined
  }
  const verification = verifyRunManifest(resolvedPath, product)
  return {
    ...base,
    valid: verification.ok,
    issues: verification.issues,
    ...(summary ? { summary } : {}),
  }
}

function verifyRunManifest(manifestPath, product) {
  const args = [
    resolve(projectRoot, "packages/cli/src/index.ts"),
    "external-tools",
    "verify-run-manifest",
    "--manifest",
    manifestPath,
    "--product",
    product,
    "--task",
    "read-only-answer",
    "--capture-mode",
    "real-capture",
    "--require-artifact",
    "raw/trace.jsonl:raw-trace",
    "--require-artifact",
    "normalized/native-capture.json:other",
    "--require-artifact",
    "logs/stdout.log:log",
    "--require-artifact",
    "logs/stderr.log:log",
    "--json",
  ]
  if (requiredStrategy) args.push("--strategy", requiredStrategy)
  if (requiredStrategy === "explicitPath" && toolPath) args.push("--expect-command", toolPath)
  const result = spawnSync(tsxCommand(), args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30000,
  })
  return cliVerificationResult(result)
}

function inspectNormalizedCapture(path, manifestPath, product, options = {}) {
  const resolvedPath = resolve(root, path)
  const base = { path, exists: existsSync(resolvedPath) }
  if (!base.exists) return base
  if (!options.verify) {
    return {
      ...base,
      skipped: true,
      reason: "normalized capture verification only runs with --require-captures or --require-compare",
    }
  }
  const resolvedManifestPath = resolve(root, manifestPath)
  if (!existsSync(resolvedManifestPath)) {
    return {
      ...inspectArtifactFile("normalizedCapture", path, product),
      valid: false,
      issues: [`run manifest is missing: ${manifestPath}`],
    }
  }
  let summary
  try {
    summary = artifactSummary("normalizedCapture", JSON.parse(readFileSync(resolvedPath, "utf8")))
  } catch {
    summary = undefined
  }
  const verification = verifyNormalizedCaptureWithManifest(resolvedPath, resolvedManifestPath)
  return {
    ...base,
    valid: verification.ok,
    issues: verification.issues,
    ...(summary ? { summary } : {}),
  }
}

function verifyNormalizedCaptureWithManifest(artifactPath, manifestPath) {
  const result = spawnSync(tsxCommand(), [
    resolve(projectRoot, "packages/cli/src/index.ts"),
    "external-tools",
    "verify",
    "--artifact",
    artifactPath,
    "--run-manifest",
    manifestPath,
    "--json",
  ], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30000,
  })
  return cliVerificationResult(result)
}

function inspectFlowCompare(path, product, options = {}) {
  const resolvedPath = resolve(root, path)
  const base = { path, exists: existsSync(resolvedPath) }
  if (!base.exists) return base
  if (!options.verify) {
    return {
      ...base,
      skipped: true,
      reason: "flow compare verification only runs with --require-compare",
    }
  }
  let summary
  let localIssues = []
  try {
    const value = JSON.parse(readFileSync(resolvedPath, "utf8"))
    localIssues = flowCompareIssues(value, product)
    summary = artifactSummary("flowCompare", value)
  } catch (error) {
    return {
      ...base,
      valid: false,
      issues: [`parse: ${error instanceof Error ? error.message : String(error)}`],
    }
  }
  const verification = verifyFlowGraph(resolvedPath)
  const issues = [...localIssues, ...verification.issues]
  return {
    ...base,
    valid: issues.length === 0,
    issues,
    ...(summary ? { summary } : {}),
  }
}

function verifyFlowGraph(artifactPath) {
  const result = spawnSync(tsxCommand(), [
    resolve(projectRoot, "packages/cli/src/index.ts"),
    "verify-flow-graph",
    "--artifact",
    artifactPath,
    "--json",
  ], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30000,
  })
  return cliVerificationResult(result, "verify-flow-graph")
}

function cliVerificationResult(result, label = "external-tools verify") {
  const text = `${result.stdout ?? ""}`.trim()
  if (text) {
    try {
      const parsed = JSON.parse(text)
      return {
        ok: parsed.ok === true,
        issues: Array.isArray(parsed.issues) ? parsed.issues.map((issue) => `${issue.id ?? "issue"}: ${issue.message ?? JSON.stringify(issue)}`) : [],
      }
    } catch {
      // Fall through to process-level error reporting.
    }
  }
  return {
    ok: false,
    issues: [result.error?.message ?? firstLine(`${result.stderr ?? ""}\n${result.stdout ?? ""}`) ?? `${label} exited ${result.status ?? "unknown"}`],
  }
}

function tsxCommand() {
  const local = resolve(projectRoot, "node_modules/.bin/tsx")
  return existsSync(local) ? local : "tsx"
}

function normalizedCaptureIssues(value, product) {
  const record = objectRecord(value)
  const issues = []
  if (record.schemaVersion !== 1) issues.push("schemaVersion must be 1")
  if (record.artifactKind !== "external-tool-native-capture") issues.push("artifactKind must be external-tool-native-capture")
  if (record.sourceTool !== "claude-tap") issues.push("sourceTool must be claude-tap")
  if (record.product !== product) issues.push(`product must be ${product}`)
  if (record.taskID !== "read-only-answer") issues.push("taskID must be read-only-answer")
  if (record.captureMode !== "real-capture") issues.push("captureMode must be real-capture")
  const providerRequests = Array.isArray(record.providerRequests) ? record.providerRequests : []
  if (providerRequests.length === 0) issues.push("providerRequests must be non-empty")
  const redactionPolicy = objectRecord(record.redactionPolicy)
  if (redactionPolicy.version !== 1) issues.push("redactionPolicy.version must be 1")
  if (redactionPolicy.containsRawPrompt !== false) issues.push("redactionPolicy.containsRawPrompt must be false")
  if (redactionPolicy.credentials !== "redacted") issues.push("redactionPolicy.credentials must be redacted")
  if (redactionPolicy.hostPaths !== "normalized") issues.push("redactionPolicy.hostPaths must be normalized")
  return issues
}

function flowCompareIssues(value, product) {
  const record = objectRecord(value)
  const issues = []
  if (record.schemaVersion !== 1) issues.push("schemaVersion must be 1")
  if (record.product !== product) issues.push(`product must be ${product}`)
  if (record.taskID !== "read-only-answer") issues.push("taskID must be read-only-answer")
  const assembled = objectRecord(record.assembled)
  const original = objectRecord(record.original)
  if (assembled.source !== "assembled") issues.push("assembled.source must be assembled")
  if (assembled.product !== product) issues.push(`assembled.product must be ${product}`)
  if (original.source !== "original") issues.push("original.source must be original")
  if (original.product !== product) issues.push(`original.product must be ${product}`)
  const summary = objectRecord(record.summary)
  if (typeof summary.fingerprint !== "string" || summary.fingerprint.length === 0) issues.push("summary.fingerprint is required")
  if (!Array.isArray(record.diffs)) issues.push("diffs must be an array")
  return issues
}

function artifactSummary(kind, value) {
  const record = objectRecord(value)
  if (kind === "manifest") {
    return {
      product: record.product,
      taskID: record.taskID,
      captureMode: record.captureMode,
      toolVersion: record.toolVersion,
      artifacts: Array.isArray(record.artifacts) ? record.artifacts.length : 0,
    }
  }
  if (kind === "normalizedCapture") {
    return {
      product: record.product,
      taskID: record.taskID,
      captureMode: record.captureMode,
      sourceTool: record.sourceTool,
      providerRequests: Array.isArray(record.providerRequests) ? record.providerRequests.length : 0,
    }
  }
  return {
    product: record.product,
    taskID: record.taskID,
    status: objectRecord(record.summary).status,
    diffs: Array.isArray(record.diffs) ? record.diffs.length : 0,
  }
}

function objectRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function missingRequirements(target) {
  if (target === "capture-ready") return missingCaptureReadyRequirements()
  const captureArtifacts = missingCaptureArtifacts()
  if (target === "captures") return captureArtifacts
  return [...captureArtifacts, ...missingCompareArtifacts()]
}

function missingCaptureReadyRequirements() {
  const items = []
  if (!gates.consent.ok) {
    items.push({
      id: "capture-consent",
      message: "Set HELIX_EXTERNAL_CAPTURE=1 in the current shell.",
    })
  }
  if (!gates.credentials.ok) {
    items.push({
      id: "capture-credentials",
      message: `Set one provider credential env var (${credentialEnvNames.join(", ")}) or HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS=1 in the current shell.`,
    })
  }
  if (!toolReady) {
    items.push({
      id: "tool-strategy",
      message: requiredStrategy
        ? `Make the ${requiredStrategy} claude-tap invocation strategy pass its version check.`
        : "Make either the binary or uvx claude-tap invocation strategy pass its version check.",
    })
  }
  return items
}

function missingCaptureArtifacts() {
  return artifacts.flatMap((item) => {
    const items = []
    if (!item.files.manifest.exists) {
      items.push(missingArtifact(item, "manifest", item.files.manifest.path, "run manifest is missing"))
    } else if (item.files.manifest.valid !== true) {
      items.push(missingArtifact(item, "manifest", item.files.manifest.path, "run manifest is not verified"))
    }
    if (!item.files.rawTrace.exists) items.push(missingArtifact(item, "rawTrace", item.files.rawTrace.path, "raw trace is missing"))
    if (!item.files.normalizedCapture.exists) {
      items.push(missingArtifact(item, "normalizedCapture", item.files.normalizedCapture.path, "normalized capture is missing"))
    } else if (item.files.normalizedCapture.valid !== true) {
      items.push(missingArtifact(item, "normalizedCapture", item.files.normalizedCapture.path, "normalized capture is not verified"))
    }
    return items
  })
}

function missingCompareArtifacts() {
  return artifacts.flatMap((item) => {
    if (!item.files.flowCompare.exists) return [missingArtifact(item, "flowCompare", item.files.flowCompare.path, "flow compare is missing")]
    if (item.files.flowCompare.valid !== true) return [missingArtifact(item, "flowCompare", item.files.flowCompare.path, "flow compare is not verified")]
    return []
  })
}

function missingArtifact(item, kind, path, message) {
  return {
    id: `artifact-${kind}`,
    product: item.product,
    path,
    message,
  }
}

function nextCommands(strategy, selectedProducts = products, explicitToolPath) {
  if (strategy === "explicitPath" && explicitToolPath) return explicitPathNextCommands(selectedProducts, explicitToolPath)
  const useUvx = strategy === "uvx"
  const strategyName = useUvx ? "uvx" : "binary"
  if (selectedProducts.length === 1) {
    const [{ product, scriptSlug }] = selectedProducts
    return [
      "npm run external:claude-tap:dry-run:acceptance:read-only",
      useUvx ? "npm run external:claude-tap:doctor:uvx:required" : "npm run external:claude-tap:doctor:required",
      useUvx
        ? `HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:uvx:${scriptSlug}:read-only`
        : `HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:${scriptSlug}:read-only`,
      `npm run external:claude-tap:preflight:captures -- --strategy ${strategyName} --product ${product}`,
      `npm run external:claude-tap:verify:${scriptSlug}:read-only`,
      `npm run external:claude-tap:preflight:compare -- --strategy ${strategyName} --product ${product}`,
    ]
  }
  return [
    "npm run external:claude-tap:dry-run:acceptance:read-only",
    useUvx ? "npm run external:claude-tap:doctor:uvx:required" : "npm run external:claude-tap:doctor:required",
    useUvx
      ? "HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:uvx:read-only"
      : "HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:opencode:read-only && HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:pi:read-only && HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:hermes:read-only",
    useUvx ? "npm run external:claude-tap:preflight:captures:uvx" : "npm run external:claude-tap:preflight:captures:binary",
    "npm run external:claude-tap:verify:read-only",
    useUvx ? "npm run external:claude-tap:preflight:compare:uvx" : "npm run external:claude-tap:preflight:compare:binary",
  ]
}

function explicitPathNextCommands(selectedProducts, explicitToolPath) {
  const toolPathArg = shellQuote(explicitToolPath)
  const dryRunCommands = selectedProducts.map((item) => explicitPathDryRunCommand(item, toolPathArg)).join(" && ")
  const captureCommands = selectedProducts.map((item) => explicitPathCaptureCommand(item, toolPathArg)).join(" && ")
  const productArg = selectedProducts.length === 1 ? ` --product ${selectedProducts[0].product}` : ""
  const dryRunVerify = `node external-tools/claude-tap/verify-dry-run-rehearsal.mjs --json --strategy explicitPath --tool-path ${toolPathArg}${productArg}`
  if (selectedProducts.length === 1) {
    const [item] = selectedProducts
    return [
      `${dryRunCommands} && ${dryRunVerify}`,
      `npm run helix -- external-tools doctor claude-tap --strategy explicitPath --tool-path ${toolPathArg} --require-tool --json`,
      captureCommands,
      `npm run external:claude-tap:preflight:captures -- --strategy explicitPath --tool-path ${toolPathArg} --product ${item.product}`,
      `npm run external:claude-tap:verify:${item.scriptSlug}:read-only`,
      `npm run external:claude-tap:preflight:compare -- --strategy explicitPath --tool-path ${toolPathArg} --product ${item.product}`,
    ]
  }
  return [
    `${dryRunCommands} && ${dryRunVerify}`,
    `npm run helix -- external-tools doctor claude-tap --strategy explicitPath --tool-path ${toolPathArg} --require-tool --json`,
    captureCommands,
    `npm run external:claude-tap:preflight:captures -- --strategy explicitPath --tool-path ${toolPathArg}`,
    "npm run external:claude-tap:verify:read-only",
    `npm run external:claude-tap:preflight:compare -- --strategy explicitPath --tool-path ${toolPathArg}`,
  ]
}

function explicitPathDryRunCommand(item, toolPathArg) {
  return `npm run helix -- external-tools capture claude-tap --strategy explicitPath --tool-path ${toolPathArg} --dry-run --product ${item.product} --task read-only-answer --out-dir .helix/external-tools/dry-runs/explicitPath/${item.slug} --json -- ${item.captureArgs}`
}

function explicitPathCaptureCommand(item, toolPathArg) {
  return `HELIX_EXTERNAL_CAPTURE=1 npm run helix -- external-tools capture claude-tap --strategy explicitPath --tool-path ${toolPathArg} --require-tool --product ${item.product} --task read-only-answer --out-dir .helix/external-tools/runs/${item.slug} --json -- ${item.captureArgs}`
}

function shellQuote(value) {
  return /^[A-Za-z0-9_./:-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`
}

function printHuman(value) {
  console.log("claude-tap Phase 4 preflight")
  console.log(`readyToCapture: ${value.readyToCapture ? "yes" : "no"}`)
  console.log(`recommendedStrategy: ${value.recommendedStrategy}`)
  console.log("")
  console.log("Tool strategies:")
  for (const item of value.toolStrategies) {
    const label = item.toolPath ? `${item.strategy} (${item.toolPath})` : item.strategy
    const detail = item.skipped ? "skipped" : item.ok ? `ok${item.version ? ` ${item.version}` : ""}` : `missing (${item.error ?? "unknown"})`
    console.log(`  ${label}: ${detail}`)
  }
  console.log("")
  console.log("Gates:")
  console.log(`  HELIX_EXTERNAL_CAPTURE=1: ${value.gates.consent.ok ? "yes" : "no"}`)
  console.log(`  credential env present: ${value.gates.credentials.envNamesPresent.join(", ") || "none"}`)
  console.log(`  allow no credentials: ${value.gates.credentials.allowNoCredentials ? "yes" : "no"}`)
  console.log("")
  console.log("Artifacts:")
  for (const item of value.artifacts) {
    console.log(
      `  ${item.product}: manifest=${artifactStatus(item.files.manifest)} raw=${artifactStatus(item.files.rawTrace)} native=${artifactStatus(item.files.normalizedCapture)} compare=${artifactStatus(item.files.flowCompare)} capturesReady=${item.readiness.capturesReady ? "yes" : "no"} compareReady=${item.readiness.compareReady ? "yes" : "no"}`,
    )
  }
  console.log("")
  console.log("Missing:")
  if (value.missing.length === 0) {
    console.log("  none")
  } else {
    for (const item of value.missing) {
      const product = item.product ? `${item.product} ` : ""
      const path = item.path ? ` (${item.path})` : ""
      console.log(`  ${item.id}: ${product}${item.message}${path}`)
    }
  }
  console.log("")
  console.log("Next commands:")
  for (const command of value.nextCommands) console.log(`  ${command}`)
}

function firstLine(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).find(Boolean)
}

function artifactStatus(file) {
  if (!file.exists) return "missing"
  if (file.skipped) return "skipped"
  if (file.valid === false) return "invalid"
  if (file.valid === true) return "ok"
  return "present"
}

function supportedProductText() {
  const names = products.map((item) => item.aliases.length > 0 ? `${item.product} (alias ${item.aliases.join(", ")})` : item.product)
  return `${names.slice(0, -1).join(", ")}, or ${names.at(-1)}`
}

function normalizeProduct(value) {
  return products.find((item) => item.product === value || item.aliases.includes(value))?.product
}

function readOption(name) {
  const index = argv.indexOf(name)
  if (index < 0) return undefined
  return argv[index + 1]
}
