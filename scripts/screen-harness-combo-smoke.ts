#!/usr/bin/env tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, relative, resolve } from "node:path"
import { parseRecipe, runProductTaskParity, type HarnessComboBlend } from "@helix/recipes"
import type { LegoRecipe } from "@helix/contracts"

interface ComboManifestRecipe {
  id: string
  path: string
  harnessCombo: HarnessComboBlend
}

interface ComboManifest {
  recipes: ComboManifestRecipe[]
}

interface SmokeRow {
  candidateID: string
  recipePath: string
  harnessCombo: HarnessComboBlend
  tasks: Array<{
    taskID: string
    status: string
    durationMs: number
    failedChecks: string[]
    toolCalls: number
    providerRequests: number
  }>
  score: number
  matched: number
  failed: number
  durationMs: number
}

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJSON<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T
}

function writeArtifact(out: string, markdown: string, rows: SmokeRow[], startedAt: string): void {
  const artifact = {
    schemaVersion: 1,
    artifactKind: "harness-combo-smoke-screening",
    generatedAt: new Date().toISOString(),
    startedAt,
    provider: "cassette",
    scoring: "matched fixture tasks / fixture tasks",
    rows,
  }
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, `${JSON.stringify(artifact, null, 2)}\n`)
  writeFileSync(markdown, renderMarkdown(artifact))
}

function renderMarkdown(artifact: { generatedAt: string; rows: SmokeRow[] }): string {
  const lines = [
    "# Harness Combo Smoke Screening",
    "",
    `Generated: ${artifact.generatedAt}`,
    "",
    "| Rank | Candidate | Score | Matched | Failed | Duration | Failed Checks |",
    "| ---: | --- | ---: | ---: | ---: | ---: | --- |",
  ]
  artifact.rows
    .slice()
    .sort(compareRows)
    .forEach((row, index) => {
      const failedChecks = [...new Set(row.tasks.flatMap((task) => task.failedChecks))].slice(0, 6).join("<br>") || "none"
      lines.push(`| ${index + 1} | ${row.candidateID} | ${row.score}/${row.tasks.length} | ${row.matched} | ${row.failed} | ${row.durationMs} | ${failedChecks} |`)
    })
  lines.push("")
  lines.push("This is a no-credential fixture screening board for generated harness combinations.")
  lines.push("")
  return `${lines.join("\n")}\n`
}

function compareRows(left: SmokeRow, right: SmokeRow): number {
  return right.score - left.score || left.failed - right.failed || left.durationMs - right.durationMs || left.candidateID.localeCompare(right.candidateID)
}

const root = process.cwd()
const comboManifestPath = resolve(argValue("--combo-manifest") ?? "docs/reports/harness-combo-recipes/manifest.json")
const out = resolve(argValue("--out") ?? "docs/reports/harness-combo-smoke-screening.json")
const markdown = resolve(argValue("--markdown") ?? "docs/reports/harness-combo-smoke-screening.md")
const taskIDs = (argValue("--tasks") ?? "read-only-answer,single-file-edit").split(",").filter(Boolean)
const maxCandidates = Number(argValue("--max-candidates") ?? "0")
const force = process.argv.includes("--force")
const startedAt = new Date().toISOString()

const manifest = readJSON<ComboManifest>(comboManifestPath)
const existingRows = !force && existsSync(out) ? readJSON<{ rows?: SmokeRow[] }>(out).rows ?? [] : []
const rowsByCandidate = new Map(existingRows.map((row) => [row.candidateID, row]))
const candidates = maxCandidates > 0 ? manifest.recipes.slice(0, maxCandidates) : manifest.recipes

for (const [index, candidate] of candidates.entries()) {
  if (rowsByCandidate.has(candidate.id)) continue
  const recipe = parseRecipe(readJSON<LegoRecipe>(candidate.path))
  const taskRows: SmokeRow["tasks"] = []
  for (const taskID of taskIDs) {
    const report = await runProductTaskParity({
      product: "opencode-pi-hybrid",
      mode: "assembled",
      taskID,
      recipe,
      recipeLabel: relative(root, candidate.path),
      provider: "cassette",
    })
    taskRows.push({
      taskID,
      status: report.status,
      durationMs: report.costLatency.durationMs,
      failedChecks: report.checks.filter((check) => !check.ok).map((check) => check.id),
      toolCalls: report.costLatency.toolCalls,
      providerRequests: report.costLatency.providerRequests,
    })
  }
  const matched = taskRows.filter((task) => task.status === "matched" || task.status === "acceptable-drift").length
  rowsByCandidate.set(candidate.id, {
    candidateID: candidate.id,
    recipePath: relative(root, candidate.path),
    harnessCombo: candidate.harnessCombo,
    tasks: taskRows,
    score: matched,
    matched,
    failed: taskRows.length - matched,
    durationMs: taskRows.reduce((sum, task) => sum + task.durationMs, 0),
  })
  if ((index + 1) % 25 === 0 || index === candidates.length - 1) {
    writeArtifact(out, markdown, [...rowsByCandidate.values()].sort(compareRows), startedAt)
  }
}

const rows = [...rowsByCandidate.values()].sort(compareRows)
writeArtifact(out, markdown, rows, startedAt)
console.log(JSON.stringify({ out, markdown, candidates: candidates.length, rows: rows.length, leader: rows[0] }, null, 2))
