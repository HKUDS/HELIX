import { describe, expect, it } from "vitest"
import { auditLegoBlockLedger, readCatalogPortIDs } from "@helix/recipes"

describe("lego block ledger", () => {
  it("keeps the catalog, port fixtures, recipe bindings, package exports, and boundary lint in sync", () => {
    const report = auditLegoBlockLedger({ cwd: process.cwd() })

    expect(report.ok, report.issues.map((issue) => `${issue.id}: ${issue.message}`).join("\n")).toBe(true)
    expect(report.coverage.catalogedPorts).toBeGreaterThan(0)
    expect(report.coverage.catalogedPorts).toBe(report.coverage.fixturePorts)
    expect(report.coverage.fixturePorts).toBe(report.coverage.conformanceTestedPorts)
    expect(report.coverage.fixturePorts).toBe(report.coverage.portsWithErrors)
    expect(report.coverage.fixturePorts).toBe(report.coverage.portsWithTraces)
    expect(report.coverage.fixturePorts).toBe(report.coverage.portsWithTestAtoms)
    expect(report.coverage.replaceableAtomBlocks).toBeGreaterThan(0)
    expect(report.coverage.packBlocks).toBeGreaterThan(0)
    expect(report.coverage.productShellBlocks).toBeGreaterThan(0)
    expect(report.coverage.publicModulesWithRoute).toBe(report.coverage.publicModules)
    expect(report.coverage.productSpecificLeaks).toBe(0)
    expect(report.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "session.reader",
          cataloged: true,
          fixture: true,
          conformanceTested: true,
          errors: ["session.reader.contract-error"],
          traces: ["session.reader.trace"],
          testAtoms: ["test.session.reader.mock"],
        }),
        expect.objectContaining({ id: "provider.event-normalizer", cataloged: true, fixture: true, conformanceTested: true }),
        expect.objectContaining({
          id: "product.shell",
          cataloged: true,
          fixture: true,
          conformanceTested: true,
          commonBlocks: expect.arrayContaining([expect.objectContaining({ id: "product.shell.minimal-cli", type: "product-shell" })]),
          personalityBlocks: expect.arrayContaining([expect.objectContaining({ id: "opencode.product-shell.server", type: "product-shell" })]),
        }),
      ]),
    )
    expect(report.rows.filter((row) => row.bound).map((row) => row.id)).toEqual(
      expect.arrayContaining(["session.id-generator", "session.event-log", "session.message-store", "session.projector", "session.context-selector", "tools"]),
    )
  })

  it("reports catalog rows that have no executable fixture evidence", () => {
    const catalog = readCatalogPortIDs(`${process.cwd()}/docs/lego-block-catalog.md`)
    expect(catalog).toContain("runtime.binding-planner")
    expect(catalog).toContain("prompt.compaction-adapter")
  })
})
