import { describe, expect, it } from "vitest"
import { buildRecipeTargetShapeReport } from "@helix/recipes"

describe("recipe target shapes", () => {
  it("freezes atom-level target shapes for OpenCode, Pi Mono, neutral minimal, and binding-only swaps", () => {
    const report = buildRecipeTargetShapeReport()

    expect(report.ok, report.issues.join("\n")).toBe(true)
    expect(report.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "opencode.full",
          personalityAtoms: expect.arrayContaining(["opencode.session.projector.syncevent", "opencode.plugin.loader"]),
          productShells: expect.arrayContaining(["opencode.product-shell.sdk", "opencode.product-shell.server"]),
        }),
        expect.objectContaining({
          id: "pi-mono.full",
          personalityAtoms: expect.arrayContaining(["pi.session.store.jsonl-v3", "pi.extension.dynamic-tool-bridge"]),
          productShells: expect.arrayContaining(["pi.product-shell.sdk", "pi.product-shell.rpc"]),
        }),
        expect.objectContaining({
          id: "nanobot.full",
          personalityAtoms: expect.arrayContaining(["nanobot.session.store.jsonl", "nanobot.plugin.loader"]),
          productShells: expect.arrayContaining(["nanobot.product-shell.sdk", "nanobot.product-shell.cli"]),
        }),
        expect.objectContaining({
          id: "coding-agent.minimal",
          personalityAtoms: [],
          productShells: [],
        }),
      ]),
    )
    for (const target of report.targets) {
      expect(target.commonAtoms.length, target.id).toBeGreaterThan(0)
      expect(target.commonAtoms.some((id) => id.startsWith("opencode.") || id.startsWith("pi.") || id.startsWith("nanobot.")), target.id).toBe(false)
    }
    expect(report.swaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "session swap", port: "session.store", changes: "binding-only" }),
        expect.objectContaining({ id: "tool-pack swap", port: "tools", changes: "binding-only" }),
        expect.objectContaining({ id: "provider transport swap", port: "provider.transport", changes: "binding-only" }),
      ]),
    )
  })
})
