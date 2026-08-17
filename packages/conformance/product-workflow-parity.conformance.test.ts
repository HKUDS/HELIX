import { describe, expect, it } from "vitest"
import { runUpstreamProductWorkflowParity } from "@helix/recipes"

describe("upstream product workflow parity", () => {
  it("exercises provider, interactive surfaces, and pinned fixture workflows through assembled products", async () => {
    const report = await runUpstreamProductWorkflowParity({ cwd: process.cwd() })

    expect(report.ok).toBe(true)
    expect(report.issues).toEqual([])
    expect(report.products.map((product) => product.product)).toEqual(["opencode", "pi-mono"])
    expect(report.products.find((product) => product.product === "opencode")?.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "opencode:provider-stream-workflow",
        "opencode:interactive-surface-workflow",
        "opencode:interactive-tui-event-loop-workflow",
        "opencode:upstream-fixture-product-sdk",
      ]),
    )
    expect(report.products.find((product) => product.product === "pi-mono")?.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "pi-mono:provider-stream-workflow",
        "pi-mono:interactive-rpc-tui-workflow",
        "pi-mono:live-rpc-web-transport-workflow",
        "pi-mono:interactive-tui-event-loop-workflow",
        "pi-mono:upstream-fixture-product-sdk",
      ]),
    )
  }, 30_000)
})
