import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import {
  normalizePortContractFixture,
  type LegoBlockInventoryEntry,
  type LegoPortContractFixture,
  type LegoRecipe,
} from "@helix/contracts"
import { auditSourceBoundaries } from "./boundary-lint"
import { compileRecipe, type CompiledRecipe } from "./compiler"
import { codingAgentMinimalRecipe, hermesAgentRecipe, nanobotRecipe, opencodePiHybridRecipe, opencodeRecipe, piMonoRecipe, swapRecipes } from "./recipes"
import { allRecipePortFixtures, routeForAtomBlock } from "./atom-catalog"

export interface LegoBlockLedgerIssue {
  id: string
  message: string
}

export interface LegoBlockLedgerPortRow {
  id: string
  cataloged: boolean
  fixture: boolean
  bound: boolean
  conformanceTested: boolean
  implementations: string[]
  personalityAtoms: string[]
  errors: string[]
  traces: string[]
  testAtoms: string[]
  commonBlocks: LegoBlockInventoryEntry[]
  testBlocks: LegoBlockInventoryEntry[]
  personalityBlocks: LegoBlockInventoryEntry[]
}

export interface LegoBlockLedgerPublicRoute {
  moduleID: string
  packageName: string
  exportPath: string
  ok: boolean
}

export interface LegoBlockLedgerCoverage {
  catalogedPorts: number
  fixturePorts: number
  boundPorts: number
  conformanceTestedPorts: number
  publicModules: number
  publicModulesWithRoute: number
  productSpecificLeaks: number
  portsWithErrors: number
  portsWithTraces: number
  portsWithTestAtoms: number
  replaceableAtomBlocks: number
  packBlocks: number
  productShellBlocks: number
}

export interface LegoBlockLedgerReport {
  ok: boolean
  catalogPath: string
  issues: LegoBlockLedgerIssue[]
  coverage: LegoBlockLedgerCoverage
  rows: LegoBlockLedgerPortRow[]
  publicRoutes: LegoBlockLedgerPublicRoute[]
}

export interface AuditLegoBlockLedgerInput {
  cwd?: string
  catalogPath?: string
  recipes?: LegoRecipe[]
}

export function auditLegoBlockLedger(input: AuditLegoBlockLedgerInput = {}): LegoBlockLedgerReport {
  const cwd = input.cwd ?? process.cwd()
  const catalogPath = input.catalogPath ?? join(cwd, "docs", "lego-block-catalog.md")
  const recipes = input.recipes ?? defaultLedgerRecipes()
  const catalogPortIDs = readCatalogPortIDs(catalogPath)
  const fixtures = allPortContractFixtures()
  const fixtureByID = new Map(fixtures.map((fixture) => [fixture.id, fixture]))
  const inventoryByID = new Map(fixtures.map((fixture) => [fixture.id, normalizePortContractFixture(fixture)]))
  const fixturePortIDs = new Set(fixtureByID.keys())
  const recipeBindingPortIDs = new Set(recipes.flatMap((recipe) => (recipe.bindings ?? []).map((binding) => binding.port)))
  const compiledRecipes = recipes.map((recipe) => compileRecipe(recipe))
  const publicRoutes = publicRoutesForCompiledRecipes(cwd, compiledRecipes)
  const boundaryReport = auditSourceBoundaries({ cwd })
  const issues: LegoBlockLedgerIssue[] = []

  for (const id of catalogPortIDs) {
    if (!fixturePortIDs.has(id)) {
      issues.push({ id, message: `cataloged port ${id} is missing a port contract fixture` })
    }
  }
  for (const id of fixturePortIDs) {
    if (!catalogPortIDs.has(id)) {
      issues.push({ id, message: `port fixture ${id} is missing from docs/lego-block-catalog.md` })
    }
  }
  for (const id of recipeBindingPortIDs) {
    if (!catalogPortIDs.has(id)) {
      issues.push({ id, message: `recipe binding port ${id} is not cataloged in docs/lego-block-catalog.md` })
    }
  }
  for (const fixture of fixtures) {
    const inventory = inventoryByID.get(fixture.id)
    if (!fixture.conformance.trim()) {
      issues.push({ id: fixture.id, message: `port fixture ${fixture.id} is missing conformance evidence` })
    }
    if (!inventory?.errors.length) {
      issues.push({ id: fixture.id, message: `port fixture ${fixture.id} is missing error semantics` })
    }
    if (!inventory?.traces.length) {
      issues.push({ id: fixture.id, message: `port fixture ${fixture.id} is missing trace semantics` })
    }
    if (!inventory?.testAtoms.length) {
      issues.push({ id: fixture.id, message: `port fixture ${fixture.id} is missing a test/mock atom` })
    }
    if (!inventory?.commonBlocks.length) {
      issues.push({ id: fixture.id, message: `port fixture ${fixture.id} is missing a common atom, pack, or shell implementation` })
    }
  }
  for (const route of publicRoutes) {
    if (!route.ok) {
      issues.push({
        id: route.moduleID,
        message: `public module ${route.moduleID} is missing export route ${route.packageName}${route.exportPath}`,
      })
    }
  }
  for (const issue of boundaryReport.issues) {
    issues.push({ id: issue.file, message: `product-specific leakage: ${issue.message}` })
  }

  const allPortIDs = [...new Set([...catalogPortIDs, ...fixturePortIDs, ...recipeBindingPortIDs])].sort()
  const rows = allPortIDs.map((id) => {
    const fixture = fixtureByID.get(id)
    const inventory = inventoryByID.get(id)
    return {
      id,
      cataloged: catalogPortIDs.has(id),
      fixture: Boolean(fixture),
      bound: recipeBindingPortIDs.has(id),
      conformanceTested: Boolean(fixture?.conformance.trim()),
      implementations: fixture?.implementations ?? [],
      personalityAtoms: fixture?.personalityAtoms ?? [],
      errors: inventory?.errors ?? [],
      traces: inventory?.traces ?? [],
      testAtoms: inventory?.testAtoms ?? [],
      commonBlocks: inventory?.commonBlocks ?? [],
      testBlocks: inventory?.testBlocks ?? [],
      personalityBlocks: inventory?.personalityBlocks ?? [],
    }
  })
  const allBlocks = [...inventoryByID.values()].flatMap((inventory) => inventory.blocks)

  return {
    ok: issues.length === 0,
    catalogPath,
    issues,
    coverage: {
      catalogedPorts: catalogPortIDs.size,
      fixturePorts: fixturePortIDs.size,
      boundPorts: recipeBindingPortIDs.size,
      conformanceTestedPorts: fixtures.filter((fixture) => fixture.conformance.trim()).length,
      publicModules: publicRoutes.length,
      publicModulesWithRoute: publicRoutes.filter((route) => route.ok).length,
      productSpecificLeaks: boundaryReport.issues.length,
      portsWithErrors: [...inventoryByID.values()].filter((inventory) => inventory.errors.length > 0).length,
      portsWithTraces: [...inventoryByID.values()].filter((inventory) => inventory.traces.length > 0).length,
      portsWithTestAtoms: [...inventoryByID.values()].filter((inventory) => inventory.testAtoms.length > 0).length,
      replaceableAtomBlocks: allBlocks.filter((block) => block.type === "atom").length,
      packBlocks: allBlocks.filter((block) => block.type === "pack").length,
      productShellBlocks: allBlocks.filter((block) => block.type === "product-shell").length,
    },
    rows,
    publicRoutes,
  }
}

export function readCatalogPortIDs(catalogPath: string): Set<string> {
  const source = readFileSync(catalogPath, "utf8")
  const ports = new Set<string>()
  let inPortCatalog = false
  for (const line of source.split(/\r?\n/)) {
    if (/^## 4\.\s+Common Port Catalog/.test(line)) inPortCatalog = true
    else if (/^## 5\./.test(line)) inPortCatalog = false
    if (!inPortCatalog) continue

    const row = /^\|\s*`([^`]+)`\s*\|/.exec(line)
    if (row?.[1]) ports.add(row[1])
  }
  return ports
}

export function allPortContractFixtures(): LegoPortContractFixture[] {
  return allRecipePortFixtures()
}

function defaultLedgerRecipes(): LegoRecipe[] {
  return [codingAgentMinimalRecipe, opencodeRecipe, piMonoRecipe, opencodePiHybridRecipe, nanobotRecipe, hermesAgentRecipe, ...Object.values(swapRecipes)]
}

function publicRoutesForCompiledRecipes(cwd: string, recipes: CompiledRecipe[]): LegoBlockLedgerPublicRoute[] {
  const moduleIDs = [...new Set(recipes.flatMap((recipe) => recipe.modules.map((module) => module.id)))].sort()
  return moduleIDs.map((moduleID) => publicRouteForModule(cwd, moduleID))
}

function publicRouteForModule(cwd: string, moduleID: string): LegoBlockLedgerPublicRoute {
  const route = expectedExportRouteForModule(moduleID)
  const manifest = readPackageManifest(cwd, route.packageDir)
  const target = manifest.exports?.[route.exportPath]
  return {
    moduleID,
    packageName: manifest.name,
    exportPath: route.exportPath,
    ok: typeof target === "string" && existsSync(join(cwd, "packages", route.packageDir, target)),
  }
}

function expectedExportRouteForModule(moduleID: string): { packageDir: string; exportPath: string } {
  const route = routeForAtomBlock(moduleID)
  return { packageDir: route.packageDir, exportPath: route.exportPath }
}

function readPackageManifest(cwd: string, packageDir: string): { name: string; exports?: Record<string, string> } {
  const path = join(cwd, "packages", packageDir, "package.json")
  if (!existsSync(path)) return { name: `@helix/${packageDir}` }
  return JSON.parse(readFileSync(path, "utf8")) as { name: string; exports?: Record<string, string> }
}
