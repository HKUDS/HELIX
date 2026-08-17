import { execFile } from "node:child_process"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const root = resolve(process.cwd())
const taskID = "livecodebench-1883-b-palindrome-removal"
const recipePath = resolve(root, "docs/reports/frontend-builder-livecodebench-recipe.json")
const artifactPath = resolve(root, "docs/reports/frontend-builder-livecodebench-task-parity.json")

async function main(): Promise<void> {
  await runCliJSON(["validate", "recipe-file", recipePath, "--json"], "validate frontend-built recipe")
  const assembled = (await runCliJSON(["assemble", "--recipe-file", recipePath, "--explain", "--json"], "assemble frontend-built recipe")) as {
    verification?: { ok?: boolean }
  }
  if (assembled.verification?.ok !== true) throw new Error("frontend-built recipe contract did not verify")

  const verification = (await runCliJSON(
    ["verify-task-parity", "--artifact", artifactPath, "--product", "opencode", "--mode", "assembled", "--task", taskID, "--json"],
    "verify frontend-built LiveCodeBench artifact",
  )) as { ok?: boolean }
  if (verification.ok !== true) throw new Error("frontend-built LiveCodeBench artifact did not verify")

  const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as {
    schemaVersion?: number
    provider?: string
    summary?: { reports?: number; failed?: number; gapsFound?: number }
    reports?: Array<{
      taskID?: string
      product?: string
      mode?: string
      status?: string
      providerEvidence?: { provider?: string; modelID?: string; requests?: number }
    }>
  }
  const report = artifact.reports?.[0]
  if (artifact.schemaVersion !== 1) throw new Error(`unexpected artifact schema ${artifact.schemaVersion}`)
  if (artifact.provider !== "live") throw new Error(`frontend artifact was not produced by live provider: ${artifact.provider || "missing"}`)
  if (artifact.summary?.reports !== 1 || artifact.summary.failed !== 0 || artifact.summary.gapsFound !== 0) {
    throw new Error(`frontend-built LiveCodeBench artifact was not clean: ${JSON.stringify(artifact.summary)}`)
  }
  if (!report || report.taskID !== taskID || report.product !== "opencode" || report.mode !== "assembled" || report.status !== "matched") {
    throw new Error(`frontend-built LiveCodeBench report did not match the expected task/product/mode/status: ${JSON.stringify(report)}`)
  }
  if (report.providerEvidence?.provider !== "live" || !report.providerEvidence.modelID || !report.providerEvidence.requests) {
    throw new Error(`frontend-built LiveCodeBench report is missing live provider evidence: ${JSON.stringify(report.providerEvidence)}`)
  }

  process.stdout.write(
    `Frontend builder LiveCodeBench artifact verified. Recipe: ${recipePath} Artifact: ${artifactPath} Model: ${report.providerEvidence.modelID} Requests: ${report.providerEvidence.requests}\n`,
  )
}

async function runCliJSON(args: string[], label: string): Promise<unknown> {
  try {
    const result = await execFileAsync(resolve(root, "node_modules/.bin/tsx"), ["packages/cli/src/index.ts", ...args], {
      cwd: root,
      timeout: 360_000,
      maxBuffer: 1024 * 1024 * 64,
    })
    const trimmed = result.stdout.trim()
    return trimmed ? (JSON.parse(trimmed) as unknown) : {}
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message?: string }
    throw new Error(`${label} failed: ${execError.stderr || execError.stdout || execError.message || String(error)}`)
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
