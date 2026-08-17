import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { auditNanobotLegoDepth, verifyNanobotLegoDepthReport, writeNanobotLegoDepthReport } from "@helix/recipes"

describe("nanobot lego depth", () => {
  it("audits Nanobot as decomposed lego atoms rather than a monolithic adapter", () => {
    const report = auditNanobotLegoDepth({
      cwd: process.cwd(),
      generatedAt: new Date("2026-05-30T00:00:00.000Z"),
    })
    const verification = verifyNanobotLegoDepthReport(report)

    expect(verification.ok).toBe(true)
    expect(report.ok).toBe(true)
    expect(report.upstream).toMatchObject({
      package: "nanobot-ai==0.2.0",
      parityMode: "native-captured-upstream-like",
    })
    expect(report.mechanisms.map((mechanism) => mechanism.id)).toEqual(
      expect.arrayContaining([
        "session-store",
        "hook-plugin",
        "prompt-resource",
        "runtime-acceptance",
        "tool-schema-result",
        "provider-request-stream",
        "product-shells",
      ]),
    )
    expect(report.mechanisms.every((mechanism) => mechanism.status !== "missing")).toBe(true)
    expect(report.matrix.find((row) => row.product === "nanobot")).toMatchObject({
      product: "nanobot",
      productShells: expect.any(Number),
      publicExportCoverage: 100,
    })
    expect(report.antiOverfit.commonImportsNanobot).toBe(false)

    const dir = mkdtempSync(join(tmpdir(), "helix-nanobot-depth-"))
    try {
      const jsonPath = join(dir, "nanobot-lego-depth.json")
      const markdownPath = join(dir, "nanobot-lego-depth.md")
      writeNanobotLegoDepthReport({ report, jsonPath, markdownPath })
      expect(JSON.parse(readFileSync(jsonPath, "utf8"))).toMatchObject({ schemaVersion: 1, ok: true, product: "nanobot" })
      expect(readFileSync(markdownPath, "utf8")).toContain("# Nanobot Lego Depth")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
