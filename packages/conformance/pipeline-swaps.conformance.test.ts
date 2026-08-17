import { describe, expect, it } from "vitest"
import { auditRecipeLevelPipelineSwaps, recipeLevelPipelineSwaps } from "@helix/recipes"

describe("recipe-level pipeline swaps", () => {
  it("declares OpenCode/Pi/neutral pipeline swaps as strategy selections", () => {
    const report = auditRecipeLevelPipelineSwaps()

    expect(report.ok, report.issues.join("\n")).toBe(true)
    expect(report.swaps).toBe(recipeLevelPipelineSwaps)
    expect(report.swaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "opencode.pi-continuation-policy",
          baseRecipe: "opencode.full",
          overrides: [expect.objectContaining({ atomID: "turn.continuation-policy", strategy: "pi.turn.continuation-policy" })],
        }),
        expect.objectContaining({
          id: "pi.opencode-cursor-context",
          baseRecipe: "pi-mono.full",
          sessionBinding: expect.objectContaining({ port: "session.pagination", module: "opencode.session.pagination.update-time-cursor" }),
          overrides: [expect.objectContaining({ atomID: "turn.context-builder", strategy: "opencode.turn.context-builder" })],
        }),
        expect.objectContaining({
          id: "neutral.minimal-policy-set",
          baseRecipe: "coding-agent.minimal",
          overrides: expect.arrayContaining([
            expect.objectContaining({ atomID: "turn.retry-policy", strategy: "turn.retry-policy.none" }),
            expect.objectContaining({ atomID: "turn.continuation-policy", strategy: "turn.continuation-policy.none" }),
          ]),
        }),
      ]),
    )
  })
})
