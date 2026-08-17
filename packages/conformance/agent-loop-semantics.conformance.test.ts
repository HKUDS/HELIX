import { describe, expect, it } from "vitest"
import { runAgentLoopSemanticReplay } from "@helix/recipes"

describe("product-level agent-loop semantic replay", () => {
  it("runs the OpenCode, Pi, and Nanobot personalities through the same complete loop semantics", async () => {
    const report = await runAgentLoopSemanticReplay({ cwd: process.cwd() })

    expect(report.ok).toBe(true)
    expect(report.issues).toEqual([])
    expect(report.products.map((product) => product.product)).toEqual(["opencode", "pi-mono", "nanobot"])

    for (const product of report.products) {
      expect(product.result).toMatchObject({
        steps: 3,
        finish: "stop",
        retries: 1,
        syntheticContinues: 2,
        contextCompacted: true,
      })
      expect(product.checks.map((check) => check.id)).toEqual(
        expect.arrayContaining([
          `${product.product}:input-transform`,
          `${product.product}:system-transform`,
          `${product.product}:provider-options`,
          `${product.product}:retry`,
          `${product.product}:compaction`,
          `${product.product}:synthetic-continue`,
          `${product.product}:tool-mapping`,
          `${product.product}:multi-step`,
          `${product.product}:lifecycle-order`,
          `${product.product}:transcript-tail`,
        ]),
      )
      expect(product.requests.map((request) => request.phase)).toEqual(["retry-error", "tool", "length", "final"])
    }
  })
})
