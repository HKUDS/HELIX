import { describe, expect, it } from "vitest"
import { runUpstreamE2EParity } from "@helix/recipes"

describe("pinned upstream e2e parity", () => {
  it("maps deeper upstream smoke tests into offline assembled-product checks", async () => {
    const report = await runUpstreamE2EParity({ cwd: process.cwd() })

    expect(report.ok).toBe(true)
    expect(report.issues).toEqual([])
    expect(report.products.map((product) => product.product)).toEqual(["opencode", "pi-mono"])
    expect(report.products.find((product) => product.product === "opencode")?.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "opencode:upstream-e2e-source-reference",
        "opencode:upstream-e2e-product-surface-readback",
        "opencode:upstream-e2e-session-timeline-paging",
        "opencode:upstream-e2e-fork-and-diff",
      ]),
    )
    expect(report.products.find((product) => product.product === "pi-mono")?.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "pi-mono:upstream-e2e-source-reference",
        "pi-mono:upstream-e2e-dynamic-tool-registration",
        "pi-mono:upstream-e2e-runtime-events",
        "pi-mono:upstream-e2e-branching",
      ]),
    )
  }, 60_000)
})
