#!/usr/bin/env node

import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const argv = process.argv.slice(2)
const json = argv.includes("--json")
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const root = resolve(readOption("--root") ?? projectRoot)
const strategyInput = readOption("--strategy")
const toolPathInput = readOption("--tool-path")
if (argv.includes("--tool-path") && (toolPathInput === undefined || toolPathInput.startsWith("--"))) {
  console.error("Missing claude-tap dry-run rehearsal tool path after --tool-path.")
  process.exit(2)
}
const requiredStrategy = strategyInput ?? (toolPathInput ? "explicitPath" : undefined)
if (requiredStrategy !== undefined && !["binary", "uvx", "explicitPath"].includes(requiredStrategy)) {
  console.error(`Unsupported claude-tap dry-run rehearsal strategy: ${requiredStrategy}. Expected binary, uvx, or explicitPath.`)
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

const products = [
  { product: "opencode", slug: "opencode-read-only", aliases: [], args: ["--tap-client", "opencode", "--", "run", "Reply OK"] },
  { product: "pi-mono", slug: "pi-read-only", aliases: ["pi"], args: ["--tap-client", "pi", "--", "-p", "Reply OK"] },
  { product: "hermes-agent", slug: "hermes-read-only", aliases: ["hermes"], args: ["--tap-client", "hermes", "--", "chat", "Reply OK"] },
]
const strategies = [
  { strategy: "binary", dir: "binary", prefixArgs: [] },
  { strategy: "uvx", dir: "uvx", prefixArgs: ["claude-tap"] },
  { strategy: "explicitPath", dir: "explicitPath", prefixArgs: [] },
]
const requiredProduct = productInput ? normalizeProduct(productInput) : undefined
if (productInput && !requiredProduct) {
  console.error(`Unsupported claude-tap dry-run rehearsal product: ${productInput}. Expected ${supportedProductText()}.`)
  process.exit(2)
}
const selectedProducts = requiredProduct ? products.filter((item) => item.product === requiredProduct) : products
const selectedStrategies = requiredStrategy ? strategies.filter((item) => item.strategy === requiredStrategy) : strategies.filter((item) => item.strategy !== "explicitPath")

const checks = []
for (const strategy of selectedStrategies) {
  for (const item of selectedProducts) {
    const runDir = resolve(root, ".helix/external-tools/dry-runs", strategy.dir, item.slug)
    const manifestPath = resolve(runDir, "run-manifest.json")
    const expectedArgs = [
      ...strategy.prefixArgs,
      "--tap-output-dir",
      resolve(runDir, "raw"),
      "--tap-no-open",
      "--tap-no-live",
      "--tap-no-update-check",
      "--tap-store-stream-events",
      ...item.args,
    ]
    const verification = verifyManifest({
      manifestPath,
      product: item.product,
      strategy: strategy.strategy,
      expectedCommand: strategy.strategy === "explicitPath" ? toolPath : undefined,
      expectedArgs,
    })
    checks.push({
      id: `claude-tap.dry-run.${strategy.strategy}.${item.slug}`,
      ok: verification.ok,
      strategy: strategy.strategy,
      product: item.product,
      manifestPath,
      issues: verification.issues,
    })
  }
}
const issues = checks.filter((item) => !item.ok)
const report = { ok: issues.length === 0, checks, issues }

if (json) console.log(`${JSON.stringify(report, null, 2)}\n`)
else printHuman(report)
if (!report.ok) process.exit(1)

function verifyManifest({ manifestPath, product, strategy, expectedCommand, expectedArgs }) {
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
    "dry-run",
    "--strategy",
    strategy,
    "--expect-args-json",
    JSON.stringify(expectedArgs),
    "--allow-unknown-tool-version",
    "--allow-empty-artifacts",
    "--json",
  ]
  if (expectedCommand) args.push("--expect-command", expectedCommand)
  const result = spawnSync(tsxCommand(), args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30000,
  })
  const text = `${result.stdout ?? ""}`.trim()
  if (text) {
    try {
      const parsed = JSON.parse(text)
      return {
        ok: parsed.ok === true,
        issues: Array.isArray(parsed.issues) ? parsed.issues.map((issue) => ({ id: issue.id ?? "issue", message: issue.message ?? JSON.stringify(issue) })) : [],
      }
    } catch {
      // Fall through to process-level error reporting.
    }
  }
  return {
    ok: false,
    issues: [{ id: "dry-run.verify", message: result.error?.message ?? firstLine(`${result.stderr ?? ""}\n${result.stdout ?? ""}`) ?? `verify-run-manifest exited ${result.status ?? "unknown"}` }],
  }
}

function tsxCommand() {
  const local = resolve(projectRoot, "node_modules/.bin/tsx")
  return existsSync(local) ? local : "tsx"
}

function printHuman(report) {
  console.log(`claude-tap dry-run rehearsal: ${report.ok ? "passed" : "failed"}`)
  for (const check of report.checks) {
    console.log(`  ${check.strategy}/${check.product}: ${check.ok ? "ok" : "failed"} ${check.manifestPath}`)
    for (const issue of check.issues) console.log(`    ${issue.id}: ${issue.message}`)
  }
}

function firstLine(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).find(Boolean)
}

function readOption(name) {
  const index = argv.indexOf(name)
  if (index < 0) return undefined
  return argv[index + 1]
}

function supportedProductText() {
  const names = products.map((item) => item.aliases.length > 0 ? `${item.product} (alias ${item.aliases.join(", ")})` : item.product)
  return `${names.slice(0, -1).join(", ")}, or ${names.at(-1)}`
}

function normalizeProduct(value) {
  return products.find((item) => item.product === value || item.aliases.includes(value))?.product
}
