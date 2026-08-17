#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const defaultRecipeDirs = [
  path.join(root, "docs", "reports", "harness-combo-recipes"),
  path.join(root, "docs", "reports", "harness-combo-recipes-decoupled-acceptance"),
]
const recipeDirs = (argValue("--recipe-dir")?.split(",").filter(Boolean) ?? defaultRecipeDirs).map((dir) => path.resolve(dir))
const outJSON = path.resolve(argValue("--out") ?? path.join(root, "docs", "reports", "harness-combo-source-purity-audit.json"))
const outMarkdown = path.resolve(argValue("--markdown") ?? path.join(root, "docs", "reports", "harness-combo-source-purity-audit.md"))
const products = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
const sourceDimensions = ["session", "hooks", "config", "prompt", "tools", "turn", "acceptance"]
const productShellsByProduct = {
  opencode: ["opencode.product-shell.harness"],
  "pi-mono": ["pi.product-shell.cli"],
  nanobot: ["nanobot.product-shell.harness"],
  "hermes-agent": ["hermes.product-shell.harness"],
}

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

function safeReadJSON(file) {
  try {
    return readJSON(file)
  } catch {
    return null
  }
}

function relative(file) {
  const rel = path.relative(root, file)
  return rel.startsWith("..") ? file : rel
}

function unique(values) {
  return [...new Set(values)]
}

function listJSONFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".json") && name !== "manifest.json")
    .map((name) => path.join(dir, name))
    .sort()
}

function sourceShellIDsFor(surfaces) {
  return unique((surfaces ?? []).flatMap((product) => productShellsByProduct[product] ?? []))
}

function arrayIDs(value) {
  return Array.isArray(value) ? value.map((item) => item?.id).filter((id) => typeof id === "string") : []
}

function sameSet(left, right) {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((item) => rightSet.has(item))
}

function auditRecipe(file) {
  const recipe = safeReadJSON(file)
  if (!recipe || typeof recipe !== "object") return null
  const blend = recipe.metadata?.harnessCombo
  if (!blend || typeof blend !== "object") return null

  const sourceIssues = []
  const nonSourceWrapperFields = []
  const surfaces = Array.isArray(blend.surfaces) ? unique(blend.surfaces.filter((item) => products.includes(item))) : []

  for (const dimension of sourceDimensions) {
    const value = blend[dimension]
    if (!products.includes(value)) sourceIssues.push(`invalid-dimension:${dimension}=${String(value)}`)
    else if (!surfaces.includes(value)) sourceIssues.push(`surface-missing:${dimension}=${value}`)
  }
  for (const surface of blend.surfaces ?? []) {
    if (!products.includes(surface)) sourceIssues.push(`invalid-surface:${String(surface)}`)
  }
  if (blend.providerPlugins !== "opencode" && blend.providerPlugins !== "none") sourceIssues.push(`invalid-providerPlugins:${String(blend.providerPlugins)}`)

  const atomIDs = arrayIDs(recipe.atoms)
  if (atomIDs.includes("contracts")) nonSourceWrapperFields.push("atom:contracts")

  const expectedShellIDs = sourceShellIDsFor(surfaces)
  const actualShellIDs = arrayIDs(recipe.productShells)
  if (!sameSet(actualShellIDs, expectedShellIDs)) {
    nonSourceWrapperFields.push("productShells:not-derived-from-surfaces")
  }

  for (const strategy of recipe.strategies ?? []) {
    if (strategy?.id === "tool.permission" && strategy.config?.mode === "workspace-scoped" && strategy.config?.source === "harness-combo-generator") {
      nonSourceWrapperFields.push("strategy:tool.permission mode=workspace-scoped source=harness-combo-generator")
    } else if (strategy?.config?.source === "harness-combo-generator") {
      nonSourceWrapperFields.push(`strategy:${strategy.id} source=harness-combo-generator`)
    }
  }

  for (const policy of recipe.policies ?? []) {
    if (policy?.id === "shell.execution" && policy.config?.source === "harness-combo-generator") {
      nonSourceWrapperFields.push(`policy:shell.execution mode=${String(policy.config?.mode ?? "unknown")} source=harness-combo-generator`)
    } else if (policy?.config?.source === "harness-combo-generator") {
      nonSourceWrapperFields.push(`policy:${policy.id} source=harness-combo-generator`)
    }
  }

  for (const personality of recipe.personalities ?? []) {
    if (personality === "opencode-pi-hybrid-personality") nonSourceWrapperFields.push("personality:opencode-pi-hybrid-personality")
  }

  if (recipe.metadata?.product === "opencode-pi-hybrid") {
    nonSourceWrapperFields.push("metadata.product:opencode-pi-hybrid runtime wrapper")
  }

  return {
    id: recipe.id,
    path: relative(file),
    sourceIssues: unique(sourceIssues),
    nonSourceWrapperFields: unique(nonSourceWrapperFields),
    productShellAudit: {
      expected: expectedShellIDs,
      actual: actualShellIDs,
    },
    harnessCombo: blend,
  }
}

function countFields(rows, key) {
  const counts = new Map()
  for (const row of rows) {
    for (const field of row[key] ?? []) counts.set(field, (counts.get(field) ?? 0) + 1)
  }
  return Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])))
}

function auditDir(dir) {
  const rows = listJSONFiles(dir).map(auditRecipe).filter(Boolean)
  return {
    dir: relative(dir),
    recipes: rows.length,
    sourceCleanRecipes: rows.filter((row) => row.sourceIssues.length === 0).length,
    sourceIssueRecipes: rows.filter((row) => row.sourceIssues.length > 0).length,
    wrapperCleanRecipes: rows.filter((row) => row.nonSourceWrapperFields.length === 0).length,
    wrapperIssueRecipes: rows.filter((row) => row.nonSourceWrapperFields.length > 0).length,
    sourceIssueCounts: countFields(rows, "sourceIssues"),
    nonSourceWrapperFieldCounts: countFields(rows, "nonSourceWrapperFields"),
    examples: rows.filter((row) => row.nonSourceWrapperFields.length > 0 || row.sourceIssues.length > 0).slice(0, 8),
  }
}

function scriptFinding(file, pattern, message) {
  const abs = path.join(root, file)
  if (!fs.existsSync(abs)) return null
  const lines = fs.readFileSync(abs, "utf8").split(/\r?\n/)
  const matches = []
  for (const [index, line] of lines.entries()) {
    if (line.includes(pattern)) matches.push({ line: index + 1, text: line.trim() })
  }
  return matches.length ? { file, pattern, message, matches } : null
}

function auditScripts() {
  return [
    scriptFinding("scripts/generate-harness-combo-recipes.mjs", "source: \"harness-combo-generator\"", "Generator should not emit runtime behavior sourced from itself."),
    scriptFinding("scripts/generate-harness-combo-recipes.mjs", "workspace-scoped", "Workspace-scoped permission is common Helix policy, not a source harness block."),
    scriptFinding("scripts/generate-harness-combo-recipes.mjs", "opencode-pi-hybrid-personality", "Hybrid personality is not from a dissected source harness."),
  ].filter(Boolean)
}

function renderMarkdown(report) {
  const lines = []
  lines.push("# Harness Combo Source-Purity Audit")
  lines.push("")
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push("")
  lines.push("This audit separates source dimensions from runtime wrapper fields. Source dimensions are `session`, `hooks`, `config`, `prompt`, `tools`, `turn`, and `acceptance`.")
  lines.push("")
  lines.push("## Recipe Artifacts")
  lines.push("")
  lines.push("| Recipe Dir | Recipes | Source-Clean | Wrapper-Clean | Wrapper-Issue Recipes |")
  lines.push("| --- | ---: | ---: | ---: | ---: |")
  for (const dir of report.recipeDirs) {
    lines.push(`| ${dir.dir} | ${dir.recipes} | ${dir.sourceCleanRecipes}/${dir.recipes} | ${dir.wrapperCleanRecipes}/${dir.recipes} | ${dir.wrapperIssueRecipes} |`)
  }
  lines.push("")
  for (const dir of report.recipeDirs) {
    lines.push(`## ${dir.dir}`)
    lines.push("")
    if (Object.keys(dir.sourceIssueCounts).length === 0) {
      lines.push("Source dimension values: clean.")
    } else {
      lines.push("Source dimension issues:")
      for (const [field, count] of Object.entries(dir.sourceIssueCounts)) lines.push(`- ${field}: ${count}`)
    }
    lines.push("")
    if (Object.keys(dir.nonSourceWrapperFieldCounts).length === 0) {
      lines.push("Non-source wrapper fields: none.")
    } else {
      lines.push("Non-source wrapper field counts:")
      for (const [field, count] of Object.entries(dir.nonSourceWrapperFieldCounts)) lines.push(`- ${field}: ${count}`)
    }
    lines.push("")
  }
  lines.push("## Script Findings")
  lines.push("")
  if (!report.scriptFindings.length) {
    lines.push("No matching script findings.")
  } else {
    lines.push("| File | Pattern | Matches | Meaning |")
    lines.push("| --- | --- | ---: | --- |")
    for (const finding of report.scriptFindings) {
      lines.push(`| ${finding.file} | \`${finding.pattern}\` | ${finding.matches.length} | ${finding.message} |`)
    }
  }
  lines.push("")
  const contaminatedDirs = report.recipeDirs.filter((dir) => dir.sourceIssueRecipes > 0 || dir.wrapperIssueRecipes > 0)
  if (contaminatedDirs.length > 0) {
    lines.push("Conclusion: one or more audited recipe dirs contain source issues or non-source wrapper fields. Scores from those recipe artifacts should be labeled contaminated until rerun with source-only recipes.")
  } else {
    lines.push("Conclusion: audited recipe artifacts are source-pure; source dimensions are valid and no non-source wrapper fields were detected.")
  }
  lines.push("")
  return `${lines.join("\n")}\n`
}

const report = {
  schemaVersion: 1,
  artifactKind: "harness-combo-source-purity-audit",
  generatedAt: new Date().toISOString(),
  sourceDimensions,
  products,
  recipeDirs: recipeDirs.map(auditDir),
  scriptFindings: auditScripts(),
}

fs.mkdirSync(path.dirname(outJSON), { recursive: true })
fs.writeFileSync(outJSON, `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(outMarkdown, renderMarkdown(report))
console.log(JSON.stringify({ outJSON, outMarkdown, recipeDirs: report.recipeDirs.map((dir) => ({ dir: dir.dir, recipes: dir.recipes, wrapperIssueRecipes: dir.wrapperIssueRecipes })) }, null, 2))
