import { describe, expect, it } from "vitest"
import {
  buildAssemblyContract,
  compileRecipe,
  defaultLegoBundleCatalog,
  expandRecipeBundles,
  validateLegoBundleCatalog,
  type LegoBundleDescriptor,
} from "@helix/recipes"
import type { LegoRecipe } from "@helix/contracts"

describe("bundle catalog", () => {
  it("defines valid feature, product, and compat bundles", () => {
    const catalog = defaultLegoBundleCatalog()
    const issues = validateLegoBundleCatalog(catalog)

    expect(issues.filter((issue) => issue.severity === "error")).toEqual([])
    expect(catalog.map((bundle) => bundle.id)).toEqual(
      expect.arrayContaining([
        "bundle.agent-loop.turn-runner",
        "bundle.provider.openai-compatible",
        "bundle.tool.filesystem-shell",
        "bundle.opencode.session",
        "bundle.pi-mono.tools-extensions",
        "bundle.nanobot.prompt-config-ui",
        "bundle.hermes.session-sqlite-fts",
      ]),
    )
    expect(kinds(catalog)).toEqual(expect.arrayContaining(["feature-bundle", "product-bundle", "compat-bundle"]))
    expect(catalog.every((bundle) => bundle.atoms.length > 0 && bundle.ports.length > 0)).toBe(true)
  })

  it("expands bundle refs without duplicating explicitly exported atoms", () => {
    const catalog = defaultLegoBundleCatalog()
    const sessionBundle = mustBundle(catalog, "bundle.session.memory")
    const expansion = expandRecipeBundles([{ id: sessionBundle.id }], catalog)

    expect(expansion.expandedBundles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: sessionBundle.id,
          atoms: expect.arrayContaining(["session.store.memory", "session.message-store.memory"]),
          ports: expect.arrayContaining(["session.store", "session.message-store"]),
        }),
      ]),
    )

    const recipe: LegoRecipe = {
      id: "custom.bundle-session",
      version: "0.1.0",
      modules: [],
      atoms: sessionBundle.atoms.map((id) => ({ id })),
      productShells: [],
      bundles: [{ id: sessionBundle.id }],
      bindings: [],
      requiredCapabilities: [],
      personalities: ["common"],
    }
    const compiled = compileRecipe(recipe)
    expect(compiled.expandedBundles.map((bundle) => bundle.id)).toContain(sessionBundle.id)
    expect(new Set(compiled.modules.map((module) => module.id)).size).toBe(compiled.modules.length)
  })

  it("records bundle evidence in assembly contracts without changing the runtime atom fingerprint", () => {
    const contract = buildAssemblyContract({ product: "hermes-agent", generatedAt: "2026-06-02T00:00:00.000Z" })

    expect(contract.bundles.map((bundle) => bundle.id)).toEqual(expect.arrayContaining(["bundle.hermes.session-sqlite-fts"]))
    expect(contract.bundleExpansions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bundleID: "bundle.hermes.session-sqlite-fts",
          selectedAtomIDs: expect.arrayContaining(["hermes.session.store.sqlite-fts"]),
        }),
      ]),
    )
    expect(contract.atoms.find((atom) => atom.id === "hermes.session.store.sqlite-fts")?.bundleIDs).toContain("bundle.hermes.session-sqlite-fts")
    expect(contract.ports.find((port) => port.id === "session.store")?.bundleCandidates).toEqual(expect.arrayContaining(["bundle.hermes.session-sqlite-fts"]))
    expect(contract.fingerprints.bundle).toMatch(/^[a-f0-9]{16}$/)

    const relabeled = {
      ...contract,
      bundles: contract.bundles.map((bundle) => (bundle.id === "bundle.hermes.session-sqlite-fts" ? { ...bundle, label: "Renamed Hermes Session" } : bundle)),
    }
    expect(buildAssemblyContract({ product: "hermes-agent", generatedAt: "2026-06-02T01:00:00.000Z" }).fingerprints.atomSet).toBe(contract.fingerprints.atomSet)
    expect(relabeled.fingerprints.atomSet).toBe(contract.fingerprints.atomSet)
  })
})

function kinds(catalog: LegoBundleDescriptor[]): string[] {
  return [...new Set(catalog.map((bundle) => bundle.kind))].sort()
}

function mustBundle(catalog: LegoBundleDescriptor[], id: string): LegoBundleDescriptor {
  const bundle = catalog.find((candidate) => candidate.id === id)
  if (!bundle) throw new Error(`Missing bundle ${id}`)
  return bundle
}
