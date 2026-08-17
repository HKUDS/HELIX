import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { runNanobotFitAudit } from "@helix/recipes"

describe("Nanobot baseline and fit audit", () => {
  it("pins upstream Nanobot facts and maps them to existing lego planes", () => {
    const baselinePath = join(process.cwd(), "docs", "nanobot-baseline.md")
    const source = readFileSync(baselinePath, "utf8")
    const audit = runNanobotFitAudit()

    expect(existsSync(baselinePath)).toBe(true)
    expect(source).toContain("https://github.com/HKUDS/nanobot")
    expect(source).toContain("v0.2.0")
    expect(source).toContain("nanobot-ai==0.2.0")
    expect(source).toContain("~/.nanobot/config.json")
    expect(audit.ok).toBe(true)
    expect(audit.topLevelPlanesAdded).toEqual([])
    expect(audit.rows.map((row) => row.nanobotAtom)).toEqual(
      expect.arrayContaining(["nanobot.session.store.jsonl", "nanobot.plugin.loader", "nanobot.provider.plugin-descriptor"]),
    )
  })
})
