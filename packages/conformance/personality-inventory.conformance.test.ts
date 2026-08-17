import { describe, expect, it } from "vitest"
import { auditPersonalityInventory, expectedPersonalityClassifications } from "@helix/recipes"

describe("personality inventory", () => {
  it("classifies the remaining OpenCode, Pi, and Nanobot differences as personality atoms or product shells", () => {
    const report = auditPersonalityInventory()

    expect(report.ok, report.issues.map((issue) => `${issue.id}: ${issue.message}`).join("\n")).toBe(true)
    expect(report.coverage.present).toBe(report.coverage.expected)
    expect(report.coverage.expected).toBe(expectedPersonalityClassifications.length)
    expect(report.coverage.opencodeAtoms).toBeGreaterThan(0)
    expect(report.coverage.piAtoms).toBeGreaterThan(0)
    expect(report.coverage.nanobotAtoms).toBeGreaterThan(0)
    expect(report.coverage.opencodeProductShells).toBeGreaterThan(0)
    expect(report.coverage.piProductShells).toBeGreaterThan(0)
    expect(report.coverage.nanobotProductShells).toBeGreaterThan(0)
    expect(report.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "opencode.session.projector.syncevent", port: "session.projector", present: true }),
        expect.objectContaining({ id: "opencode.plugin.loader", port: "hook.bus", present: true }),
        expect.objectContaining({ id: "opencode.provider.plugin-descriptor", port: "provider.stream", present: true }),
        expect.objectContaining({ id: "pi.session.store.jsonl-v3-migrator", port: "session.store", present: true }),
        expect.objectContaining({ id: "pi.extension.dynamic-tool-bridge", port: "tool.registry", present: true }),
        expect.objectContaining({ id: "pi.provider.extension-descriptor", port: "provider.stream", present: true }),
        expect.objectContaining({ id: "nanobot.session.store.jsonl", port: "session.store", present: true }),
        expect.objectContaining({ id: "nanobot.plugin.loader", port: "hook.bus", present: true }),
        expect.objectContaining({ id: "nanobot.provider.plugin-descriptor", port: "provider.stream", present: true }),
      ]),
    )
  })
})
