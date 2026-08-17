import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import { auditSourceBoundaries } from "@helix/recipes"

describe("source boundary lint", () => {
  it("keeps current common atoms, provider atoms, tool atoms, and product shells inside declared boundaries", () => {
    const report = auditSourceBoundaries({ cwd: process.cwd() })

    expect(report.ok).toBe(true)
    expect(report.rules.map((rule) => rule.id)).toEqual([
      "common-no-personality-imports",
      "atoms-no-product-surface-imports",
      "provider-no-session-atoms",
      "tools-no-ui-imports",
      "product-shell-declared-deps",
    ])
    expect(report.issues).toEqual([])
  })

  it("reports product leakage across common/provider/tool/product-shell boundaries", () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-boundary-lint-"))
    try {
      writeSource(cwd, "packages/lego-session/src/atoms.ts", 'import "@helix/adapters-opencode"\nimport "./product-surface"\n')
      writeSource(cwd, "packages/lego-provider/src/provider.ts", 'import type { SessionService } from "@helix/lego-session"\n')
      writeSource(cwd, "packages/lego-tools/src/tool.ts", 'import { createNoopUI } from "@helix/lego-ui"\n')
      writeSource(cwd, "packages/adapters-opencode/src/product-surface.ts", 'import { runHarnessTurn } from "@helix/lego-agent-loop"\n')
      writeSource(cwd, "packages/adapters-pi/src/product-surface.ts", 'import type { LegoRecipe } from "@helix/contracts"\n')

      const report = auditSourceBoundaries({ cwd })

      expect(report.ok).toBe(false)
      expect(report.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ruleID: "common-no-personality-imports", import: "@helix/adapters-opencode" }),
          expect.objectContaining({ ruleID: "atoms-no-product-surface-imports", import: "./product-surface" }),
          expect.objectContaining({ ruleID: "provider-no-session-atoms", import: "@helix/lego-session" }),
          expect.objectContaining({ ruleID: "tools-no-ui-imports", import: "@helix/lego-ui" }),
          expect.objectContaining({ ruleID: "product-shell-declared-deps", import: "@helix/lego-agent-loop" }),
        ]),
      )
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

function writeSource(cwd: string, path: string, source: string): void {
  const fullPath = join(cwd, path)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, source, "utf8")
}
