#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const outDir = argValue("--out-dir") ?? path.join(root, "docs", "reports", "harness-combo-recipes")
const max = Number(argValue("--max") ?? "0")
const products = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
const decoupleAcceptance = process.argv.includes("--decouple-acceptance")
const generatedAt = new Date().toISOString()
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

function slug(value) {
  return value.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function unique(values) {
  return [...new Set(values)]
}

function sourceProductShells(blend) {
  return unique(blend.surfaces.flatMap((product) => productShellsByProduct[product] ?? [])).map((id) => ({ id }))
}

function comboID(blend) {
  const parts = [
    "combo",
    `sh-${blend.session}`,
    `cfg-${blend.config}`,
    `prompt-${blend.prompt}`,
    `tools-${blend.tools}`,
    `turn-${blend.turn}`,
  ]
  if (blend.acceptance !== blend.turn) parts.push(`acc-${blend.acceptance}`)
  return parts.map(slug).join("-")
}

function recipeFor(blend, index) {
  const id = comboID(blend)
  return {
    id,
    version: "0.1.0",
    modules: [],
    atoms: [],
    productShells: sourceProductShells(blend),
    bindings: [],
    requiredCapabilities: [],
    strategies: [],
    policies: [],
    personalities: [],
    entrypoints: {
      validate: `npm run helix -- validate recipe-file ${path.join(outDir, `${id}.json`)} --json`,
      assemble: `npm run helix -- assemble --recipe-file ${path.join(outDir, `${id}.json`)} --json`,
    },
    conformance: { suite: ["recipes"] },
    metadata: {
      generatedAt,
      generator: "scripts/generate-harness-combo-recipes.mjs",
      candidateIndex: index,
      searchSpace: "phase1-stable-4x4x4x4x4",
      harnessCombo: blend,
    },
  }
}

const recipes = []
for (const sessionHooks of products) {
  for (const config of products) {
    for (const prompt of products) {
      for (const tools of products) {
        for (const turn of products) {
          for (const acceptance of decoupleAcceptance ? products : [turn]) {
            const blend = {
              session: sessionHooks,
              hooks: sessionHooks,
              config,
              prompt,
              tools,
              turn,
              acceptance,
              providerPlugins: sessionHooks === "opencode" ? "opencode" : "none",
              surfaces: unique([sessionHooks, config, prompt, tools, turn, acceptance]),
            }
            recipes.push(recipeFor(blend, recipes.length))
          }
        }
      }
    }
  }
}

const selected = max > 0 ? recipes.slice(0, max) : recipes
fs.mkdirSync(outDir, { recursive: true })
for (const recipe of selected) {
  fs.writeFileSync(path.join(outDir, `${recipe.id}.json`), `${JSON.stringify(recipe, null, 2)}\n`)
}

const manifest = {
  schemaVersion: 1,
  artifactKind: "harness-combo-recipe-manifest",
  generatedAt,
  outDir,
  products,
  dimensions: {
    sessionHooks: products,
    config: products,
    prompt: products,
    tools: products,
    turn: products,
    acceptance: decoupleAcceptance ? products : "same-as-turn",
  },
  decoupleAcceptance,
  totalCandidates: recipes.length,
  writtenCandidates: selected.length,
  recipes: selected.map((recipe) => ({
    id: recipe.id,
    path: path.join(outDir, `${recipe.id}.json`),
    harnessCombo: recipe.metadata.harnessCombo,
  })),
}

fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ outDir, totalCandidates: recipes.length, writtenCandidates: selected.length, manifest: path.join(outDir, "manifest.json") }, null, 2))
